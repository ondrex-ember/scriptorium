// ═══ src/core/managers/TemplumManager.js ═══
// Extrakce z game.js (Krok 2 / D11, refactoring-audit-mrd-19-8-2026.md §2),
// 20.8.2026. Domain: Templum (kostel). Původně Game.* na řádcích
// 1110-1796 + 1807-2061 + 2077-2225 (HEAD po D1-D5+D7-D10+D12-D13+cleanup).
// OPRAVA REGRESE: vitreaGrantStartPool/vitreaWearTick/VITREA_BREAKABLE
// byly omylem sebrány do PetitionManager.js (D10) chybnou hranicí bloku
// 19.8. — BEZ delegujícího stubu v game.js, tudíž Game.vitreaGrantStartPool
// byl undefined a init() guard (řádek 811) je tiše přeskakoval od push D10.
// Zjištěno a opraveno 20.8.2026 při přípravě D11 — přesunuto sem (správná
// doména, Vitrea = kostelní vitráže/sklo), z PetitionManager.js odstraněno,
// stub přidán. Chování beze změny jinak — pouze přesun + přepsání
// this.removeItem/addItem -> Game.* (D8) a this.dormitoriumBrotherMult/
// dormitoriumAddXp/_workCredit/_konvrsTraits -> Game.* (D14, needitováno).
// PARISH_SURNAMES a FABRICA_TIERS mají externí čtenáře (CommitmentsSystem.js,
// ChroniconSystem.js, TemplumSystem.js) — alias v game.js přidán
// PREVENTIVNĚ, než crashly (poučeno z MILL_TIERS bugu 19.8.).
const TemplumManager = {
    pilgrimTick: function () {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (!(GameState.researchedTechs || []).includes('tech_canonical_hours')) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        if (!t.lastMass) return; // mrtvý kostel poutníky nemá
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!t.nextPilgrims) { t.nextPilgrims = Date.now() + Math.round(WEEK * 0.375); Game.save(); return; } // offset ~2,6 d
        if (Date.now() < t.nextPilgrims) return;
        t.nextPilgrims = Date.now() + WEEK;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const hasRelic = (GameState.inventory['reliquia'] || 0) >= 1;
        const snap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
        const feast = !!(snap && snap.feast && snap.feast.active);
        const chance = Math.min(0.7, 0.4 + (hasRelic ? 0.2 : 0) + (feast ? 0.1 : 0));
        if (Math.random() >= chance) { Game.save(); return; } // ticho — žádný spam

        const infl = (GameState.persona && GameState.persona.influence) || {};
        const grose = 3 + Math.floor(Math.random() * 6) + Math.floor((infl.church || 0) / 10);
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(grose);
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 1);
        t.lastPilgrims = { ts: Date.now(), grose: grose };
        TemplumManager._templumLog({ type: 'pilgrims', grose: grose });
        // T6-V2: poutní cesty = přenašeči — 10% šance nachlazení (existující nemoc, žádný nový obsah)
        let caughtCold = false;
        if (typeof HealthSystem !== 'undefined' && HealthSystem.addCondition && Math.random() < 0.10) {
            HealthSystem.addCondition('cold');
            caughtCold = true;
        }
        Game.save();

        const flavors = [
            ['🚶 Poutníci z kraje se zastavili u kostela. Ofěra: ' + grose + ' grošů.', '🚶 Pilgrims from the countryside stopped at the church. Offering: ' + grose + ' groschen.'],
            ['🚶 Skupinka poutníků klečela u oltáře do soumraku. V misce zůstalo ' + grose + ' grošů.', '🚶 A band of pilgrims knelt at the altar till dusk. ' + grose + ' groschen remained in the bowl.'],
            ['🚶 Poutníci prosili o požehnání na cestu' + (hasRelic ? ' — a chtěli spatřit relikvii' : '') + '. Ofěra ' + grose + ' grošů.', '🚶 Pilgrims asked a blessing for the road' + (hasRelic ? ' — and wished to see the relic' : '') + '. Offering of ' + grose + ' groschen.'],
        ];
        const f = flavors[Math.floor(Math.random() * flavors.length)];
        const coldNote = caughtCold ? (lang === 'en' ? ' One of the pilgrims coughed through the whole mass.' : ' Jeden z poutníků kašlal celou mši.') : '';
        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel((lang === 'en' ? f[1] : f[0]) + coldNote, 'success');
        Game.addKronikaEntry('minor', f[0] + (caughtCold ? ' Jeden z poutníků kašlal celou mši.' : ''), f[1] + (caughtCold ? ' One of the pilgrims coughed through the whole mass.' : ''), '🚶 Peregrini venerunt.');

        // T6-V2: poutní cesty přenášejí — 10% šance nachlazení (ofěra přišla tak jako tak; riziko = cena otevřených dveří)
        if (typeof HealthSystem !== 'undefined' && HealthSystem.addCondition && Math.random() < 0.10) {
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                UI.notifyPanel(lang === 'en'
                    ? '🤧 One of the pilgrims coughed through the whole mass…'
                    : '🤧 Jeden z poutníků kašlal celou mši…', 'warning');
            }
            HealthSystem.addCondition('cold');
        }
    },

    // ── TEMPLUM Probošt: životní události farních rodin (endgame-branches-reference.md sekce 4.3) ──
    PARISH_SURNAMES: ['Novák', 'Dvořák', 'Král', 'Procházka', 'Sedlák', 'Novotný', 'Malý', 'Kovář', 'Krejčí'],

    parishEventTick: function () {
        if (!(GameState.rank && GameState.rank.probost)) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!t.nextParishEvent) { t.nextParishEvent = Date.now() + Math.round(WEEK * 0.5); Game.save(); return; }
        if (Date.now() < t.nextParishEvent) return;
        t.nextParishEvent = Date.now() + WEEK;
        if (Math.random() >= 0.5) { Game.save(); return; } // ne každý týden — tichý farní klid

        const types = ['baptism', 'wedding', 'funeral'];
        const type = types[Math.floor(Math.random() * types.length)];
        const surname = this.PARISH_SURNAMES[Math.floor(Math.random() * this.PARISH_SURNAMES.length)];
        const id = 'parish_' + type + '_' + Date.now();
        // Persistováno — klik mimo modal ho jen schová, ne ztratí (reopen z panelu).
        t.pendingParish = { id: id, type: type, surname: surname };
        Game.save();

        TemplumManager._showParishModal(type, surname, id);
    },

    // Reopen z panelu "Zprávy kláštera" — stejná modalka, znovu z persistovaných dat.
    reopenParishEvent: function () {
        const p = GameState.templum && GameState.templum.pendingParish;
        if (!p) return;
        TemplumManager._showParishModal(p.type, p.surname, p.id);
    },

    _showParishModal: function (type, surname, id) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const titleMap = { baptism: ['Křest', 'Baptism'], wedding: ['Svatba', 'Wedding'], funeral: ['Pohřeb', 'Funeral'] };
        const descMap = {
            baptism: ['Rodina ' + surname + ' žádá o křest dítěte.', 'The ' + surname + ' family asks for a christening.'],
            wedding: ['Rodina ' + surname + ' žádá o oddání.', 'The ' + surname + ' family asks to be wed.'],
            funeral: ['Rodina ' + surname + ' žádá o pohřeb.', 'The ' + surname + ' family asks for a funeral rite.'],
        };

        const rerender = () => {
            const el = document.getElementById('home-templum-content');
            if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
        };
        const clearPending = () => {
            if (GameState.templum) GameState.templum.pendingParish = null;
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.resolvePendingEvent) NotificationSystem.resolvePendingEvent(id);
        };
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.pendingEvent) {
            NotificationSystem.pendingEvent({
                id: id,
                icon: type === 'baptism' ? '👶' : type === 'wedding' ? '💍' : '⚰️',
                title: (lang === 'en' ? titleMap[type][1] : titleMap[type][0]) + ' — ' + surname,
                source: 'game_parish',
            });
        }

        NotificationSystem.modal({
            icon: type === 'baptism' ? '👶' : type === 'wedding' ? '💍' : '⚰️',
            title: (lang === 'en' ? titleMap[type][1] : titleMap[type][0]) + ' — ' + surname,
            text: `<div style="font-size:0.82rem; line-height:1.45;">${lang === 'en' ? descMap[type][1] : descMap[type][0]}</div>`,
            choices: [
                {
                    label: (lang === 'en' ? '✝️ Officiate' : '✝️ Vykonat obřad'), effect: () => {
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                            PersonaSystem.addInfluence('church', 2);
                            PersonaSystem.addInfluence('village', 2);
                        }
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', 1);
                        if (type === 'wedding' && typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                            CellariumSystem.addGrose(5 + Math.floor(Math.random() * 10));
                        }
                        if (type === 'funeral') {
                            if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
                            GameState.cemetery.graves.push({ surname: surname, ts: Date.now() });
                            // Bestiář: první hrob na hřbitově odemkne Kostelního grima —
                            // legenda praví, že první pohřbený musí navždy hlídat bránu.
                            if (GameState.cemetery.graves.length === 1 && typeof SecretsSystem !== 'undefined') {
                                SecretsSystem.unlockFolioById('folio_grim_bestiar');
                            }
                        }
                        TemplumManager._templumLog({ type: 'parish', eventType: type, surname: surname, officiated: true });
                        Game.addKronikaEntry('minor',
                            '✝️ ' + titleMap[type][0] + ': rodina ' + surname + ' — obřad vykonán.',
                            '✝️ ' + titleMap[type][1] + ': the ' + surname + ' family — rite performed.',
                            '✝️ Ritus peractus est.');
                        clearPending();
                        Game.save(); rerender();
                    }
                },
                {
                    label: (lang === 'en' ? '📋 Plan for later (Commitments)' : '📋 Naplánovat do Zakázek'), effect: () => {
                        // Klášter pool zůstává lokální — žádný _reportActorFavorIfNewDay
                        // (na rozdíl od Vesnice pool v CommitmentsSystem.resolveChronicle).
                        // farnost-chronicon-reference.md, dodatek 27.7.2026.
                        if (!Array.isArray(GameState.localFarniEvents)) GameState.localFarniEvents = [];
                        GameState.localFarniEvents.push({
                            id: 'local_farni_' + type + '_' + Date.now(),
                            type: type,
                            surname: surname,
                        });
                        if (GameState.localFarniEvents.length > 10) GameState.localFarniEvents.shift();
                        clearPending();
                        Game.save(); rerender();
                        if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? '📋 Added to Commitments.' : '📋 Přidáno do Zakázek.');
                    }
                },
                {
                    label: (lang === 'en' ? '🚪 Decline' : '🚪 Odmítnout'), effect: () => {
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', -2);
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', -1);
                        TemplumManager._templumLog({ type: 'parish', eventType: type, surname: surname, officiated: false });
                        Game.addKronikaEntry('minor',
                            '🚪 ' + titleMap[type][0] + ': rodina ' + surname + ' odmítnuta.',
                            '🚪 ' + titleMap[type][1] + ': the ' + surname + ' family turned away.',
                            '🚪 Petitio recusata est.');
                        clearPending();
                        Game.save(); rerender();
                    }
                }
            ]
        });
    },

    // ── VISITATIO V1: biskupská vizitace — checklist z žitých systémů (MRD visitatio-reference.md) ──
    visitatioTick: function () {
        const at = GameState.flags && GameState.flags.visitatioAt;
        if (!at || Date.now() < at) return;
        if (typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        const t = GameState.templum || {};
        const inv = GameState.inventory || {};
        const infl = (GameState.persona && GameState.persona.influence) || {};

        // Checklist (MRD sekce 3)
        const rows = [];
        const item = (ok, pts, cs, en) => { rows.push({ ok: ok, pts: ok ? pts : 0, cs: cs, en: en }); return ok ? pts : 0; };
        let score = 0;
        score += item((t.litUntil || 0) > now, 1, 'Kostel svítí', 'Church is lit');
        score += item((t.cleanUntil || 0) > now, 1, 'Kostel čistý', 'Church is clean');
        score += item(!!(t.lastMass && now - t.lastMass.ts < 8 * 24 * 3600000), 2, 'Mše slouženy pravidelně', 'Mass held regularly');
        score += item((infl.church || 0) >= 40, 2, 'Ecclesia vliv ≥ 40', 'Ecclesia influence ≥ 40');
        const hasIncense = ['incense_olibanum', 'incense_styrax', 'incense_pine', 'incense_spruce'].some(id => (inv[id] || 0) > 0);
        score += item((inv['candle'] || 0) >= 2 && ((inv['vinum'] || 0) + (inv['wine'] || 0)) >= 1 && hasIncense && (inv['hostia'] || 0) >= 3, 1, 'Zásoba na mši skladem', 'Mass supplies in store');
        score += item(!!t.lastConfession, 1, 'Zpovědní služba běží', 'Confession service kept');
        // monk-hunger-mrd Fáze 4 (14.8.2026) — snapshot posledního refektářského
        // ticku, ne týdenní průměr (stejný vzor jako ostatní řádky výš — živý stav).
        const mealLog = GameState.conversiMealLog;
        const anyHungry = !!(mealLog && ((mealLog.unfed && mealLog.unfed.length) || (mealLog.brothersUnfed && mealLog.brothersUnfed.length)));
        score += item(!anyHungry, 1, 'Nikdo v domě nehladoví', 'No one in the house goes hungry');
        const mis = GameState.flags.bishopMissal;
        const misPts = mis === 'delivered' ? 2 : mis === 'failed' ? -2 : mis === 'refused_final' ? -1 : 0;
        rows.push({ ok: misPts > 0, pts: misPts, cs: 'Misálová pověst', en: 'Missal reputation' });
        score += misPts;

        // Pásma
        const band = score >= 7 ? 'laudatio' : score >= 3 ? 'neutrum' : 'correctio';
        let victim = null;
        if (band === 'laudatio') {
            // V3-A: relikvie jen při prvním Laudatiu; opakované = Ecclesia +12 místo ní
            const hasRelic = (GameState.inventory['reliquia'] || 0) >= 1;
            if (hasRelic) {
                if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 12);
            } else {
                Game.addItem('reliquia', 1);
                if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 10);
            }
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
                PersonaSystem.addReputation('slechta', 3);
                PersonaSystem.addReputation('cirkev', 3);
            }
            GameState.flags.visitatioLaudatio = true;
            if (GameState.rank) GameState.rank.priorNomination = true; // MRD 6.5: biskupova chvála = jmenovací akt (Prior)
        } else if (band === 'neutrum') {
            if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 3);
        } else {
            if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', -5);
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
                PersonaSystem.addReputation('lidovost', -1);
                PersonaSystem.addReputation('slechta', -3);
                PersonaSystem.addReputation('cirkev', -3);
            }
            // Jednotlivec, ne plošný trest: biskup jmenuje jednoho „nedbalého" bratra (MRD 6.6)
            const pool = (GameState.conversi || []).filter(k => !(k.penanceUntil && k.penanceUntil > now));
            if (pool.length) {
                victim = pool[Math.floor(Math.random() * pool.length)];
                victim.penanceUntil = now + 2 * 24 * 3600000;
            }
        }
        GameState.flags.visitatioAt = null;
        GameState.flags.visitatioDone = now;
        // V3-A: re-arm ohlašovacího dopisu (PortaSystem readIds je jinak navždy) — archiv historii vizitací kumuluje
        if (GameState.letters && GameState.letters.readIds) {
            delete GameState.letters.readIds['l11_visitatio_ohlaseni'];
            if (GameState.letters.firstSeen) delete GameState.letters.firstSeen['l11_visitatio_ohlaseni'];
        }
        Game.save();

        // Kronika
        const kCs = band === 'laudatio' ? '✨ Vizitace: Jeho Milost chválila dům a darovala relikvii. Laudatio!'
            : band === 'neutrum' ? '🔔 Vizitace: Jeho Milost přikývla. „Příště více," pravila kancelář.'
                : '⚖️ Vizitace: napomenutí domu.' + (victim ? ' Bratr ' + victim.name + ' jmenován nedbalým — dva dny pokání.' : '');
        const kEn = band === 'laudatio' ? '✨ Visitation: His Grace praised the house and bestowed a relic. Laudatio!'
            : band === 'neutrum' ? '🔔 Visitation: His Grace nodded. "More, next time," said the chancery.'
                : '⚖️ Visitation: the house admonished.' + (victim ? ' Brother ' + victim.name + ' named negligent — two days of penance.' : '');
        Game.addKronikaEntry('important', kCs, kEn, '✝️ Visitatio canonica peracta est.');

        // Modal s rozpisem — hráč vidí, ZA CO
        let html = rows.map(r => `<div style="display:flex; justify-content:space-between; font-size:0.78rem; ${r.ok ? '' : 'color:#c0392b;'}"><span>${r.ok ? '✓' : '✗'} ${lang === 'en' ? r.en : r.cs}</span><strong>${r.pts > 0 ? '+' + r.pts : r.pts}</strong></div>`).join('');
        html += `<div style="border-top:1px solid rgba(0,0,0,0.15); margin-top:6px; padding-top:6px; display:flex; justify-content:space-between; font-size:0.82rem; font-weight:bold;"><span>${lang === 'en' ? 'Total' : 'Celkem'}</span><span>${score} b</span></div>`;
        const verdictCs = band === 'laudatio' ? '✨ LAUDATIO — relikvie darována, Ecclesia +10.'
            : band === 'neutrum' ? '🔔 Zdvořilé přikývnutí. Ecclesia +3.'
                : '⚖️ CORRECTIO — Ecclesia −5.' + (victim ? ' Bratr ' + victim.name + ': 2 dny pokání.' : '');
        const verdictEn = band === 'laudatio' ? '✨ LAUDATIO — a relic bestowed, Ecclesia +10.'
            : band === 'neutrum' ? '🔔 A courteous nod. Ecclesia +3.'
                : '⚖️ CORRECTIO — Ecclesia −5.' + (victim ? ' Brother ' + victim.name + ': 2 days of penance.' : '');
        html += `<div style="margin-top:8px; font-size:0.82rem;">${lang === 'en' ? verdictEn : verdictCs}</div>`;
        NotificationSystem.modal({
            icon: '✝️',
            title: lang === 'en' ? 'The Bishop\'s Visitation' : 'Biskupská vizitace',
            text: html,
            choices: [{
                label: lang === 'en' ? '🙏 So be it' : '🙏 Staň se', effect: () => {
                    const el = document.getElementById('home-templum-content');
                    if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
                }
            }]
        });
    },

    // ── TEMPLUM T5: Dary — páteříky/vosk → Ecclesia (bez cooldownu; decay reguluje sám) ──
    TEMPLUM_DONATIONS: {
        paternoster_beads: { qty: 1, influence: 5 },
        beeswax: { qty: 5, influence: 2 },
        crayfish_boiled: { qty: 1, influence: 3 },
        // TODO: relikvie — item přijde s vizitací / Porta biskupským řetězem
    },

    // vrchcaby-hrich-mrd (15.8.2026): almužna za groše, cílí na inquisitionHeat
    // (veřejné gesto — chladí podezření), ne na Zbožnost (to řeší existující
    // item-based Dary výše, +1 flat). Cena za bod roste s velikostí, ať
    // bohatství neumaže podezření zadarmo.
    PENANCE_TIERS: {
        small: { cost: 15, heatCool: 8 },
        medium: { cost: 40, heatCool: 20 },
        large: { cost: 100, heatCool: 45 },
    },

    templumPenance: function (tier) {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        const p = this.PENANCE_TIERS[tier];
        if (!p) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (typeof CellariumSystem === 'undefined' || CellariumSystem.getGrose() < p.cost) {
            UI.notify('⚠️ Non habes sufficiens!', true); return;
        }
        CellariumSystem.spendGrose(p.cost);
        if (!GameState.secrets) GameState.secrets = {};
        GameState.secrets.inquisitionHeat = Math.max(0, (GameState.secrets.inquisitionHeat || 0) - p.heatCool);
        if (!GameState.templum) GameState.templum = {};
        GameState.templum.lastDonation = { id: 'penance_' + tier, ts: Date.now() };
        TemplumManager._templumLog({ type: 'donation', itemId: 'penance_' + tier, influence: 0, heatCool: p.heatCool });
        Game.save();
        UI.notify('📿 ' + (lang === 'en'
            ? 'Alms given — suspicion cooled by ' + p.heatCool + '.'
            : 'Almužna dána — podezření sníženo o ' + p.heatCool + '.'));
        Game.addKronikaEntry('minor',
            '📿 Almužna do Templa — ' + p.cost + ' grošů.',
            '📿 Alms to the Temple — ' + p.cost + ' groschen.',
            '📿 Eleemosyna templo data.');
        const el = document.getElementById('home-templum-content');
        if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
    },

    templumDonate: function (itemId) {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        const d = this.TEMPLUM_DONATIONS[itemId];
        if (!d) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((GameState.inventory[itemId] || 0) < d.qty) { UI.notify('⚠️ Non habes sufficiens!', true); return; }
        Game.removeItem(itemId, d.qty);
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
            PersonaSystem.addInfluence('church', d.influence);
        }
        // Zbožnost — Avaritia/štědrost (endgame-branches-reference.md sekce 9)
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
        if (!GameState.templum) GameState.templum = {};
        const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
        GameState.templum.lastDonation = { id: itemId, ts: Date.now() };
        TemplumManager._templumLog({ type: 'donation', itemId: itemId, influence: d.influence });
        Game.save();
        UI.notify('📿 ' + (lang === 'en'
            ? 'Offering accepted: ' + itemName + ' — Ecclesia +' + d.influence + '.'
            : 'Dar přijat: ' + itemName + ' — Ecclesia +' + d.influence + '.'));
        Game.addKronikaEntry('minor',
            '📿 Kostelu darováno: ' + itemName + '.',
            '📿 Offered to the church: ' + itemName + '.',
            '📿 Donum ecclesiae oblatum est.');
        const el = document.getElementById('home-templum-content');
        if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
    },

    // ── TEMPLUM: sdílený log pro dashboard (Confession/Mass/Offerings/
    // Pilgrims/Parish karty si z něj filtrují vlastní typ). Max 50 záznamů,
    // nejnovější první. Aditivní vedle stávajících t.lastX snapshotů —
    // ty se nemění, log se jen navíc plní.
    _templumLog: function (entry) {
        if (!GameState.templum) GameState.templum = {};
        if (!Array.isArray(GameState.templum.log)) GameState.templum.log = [];
        GameState.templum.log.unshift(Object.assign({ ts: Date.now() }, entry));
        if (GameState.templum.log.length > 50) GameState.templum.log.length = 50;
    },

    // ── TEMPLUM T4: Zpověď — 1×/7 d, náhodný ODEMČENÝ Clientela kontakt; osy se perou ──
    templumConfessionTick: function () {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (typeof ContactsDB === 'undefined' || typeof NotificationSystem === 'undefined') return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!t.nextConfession) { t.nextConfession = Date.now() + Math.round(WEEK * 0.75); Game.save(); return; } // offset ~5 d proti výplatě/Kapitule
        if (Date.now() < t.nextConfession) return;

        const researched = GameState.researchedTechs || [];
        const readBooks = (GameState.library && GameState.library.readBooks) || [];
        const unlocked = Object.keys(ContactsDB).filter(id => {
            const c = ContactsDB[id];
            return (!c.unlockTech || researched.includes(c.unlockTech))
                && (!c.unlockBook || readBooks.includes(c.unlockBook));
        });
        t.nextConfession = Date.now() + WEEK;
        if (!unlocked.length) { Game.save(); return; } // nikdo se nezná — zpověď odpadá

        const contactId = unlocked[Math.floor(Math.random() * unlocked.length)];
        const pendingId = 'confession_' + contactId + '_' + Date.now();
        // Persistováno — klik mimo modal ho jen schová, ne ztratí (reopen z panelu).
        t.pendingConfession = { contactId: contactId, pendingId: pendingId };
        Game.save();

        TemplumManager._showConfessionModal(contactId, pendingId);
    },

    // Reopen z panelu "Zprávy kláštera" — stejný kontakt, znovu z persistovaných dat.
    reopenConfession: function () {
        const p = GameState.templum && GameState.templum.pendingConfession;
        if (!p) return;
        TemplumManager._showConfessionModal(p.contactId, p.pendingId);
    },

    _showConfessionModal: function (id, pendingId) {
        const c = (typeof ContactsDB !== 'undefined') ? ContactsDB[id] : null;
        const t = GameState.templum || (GameState.templum = {});
        const clearPending = () => {
            if (GameState.templum) GameState.templum.pendingConfession = null;
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.resolvePendingEvent) NotificationSystem.resolvePendingEvent(pendingId);
        };
        if (!c) { clearPending(); return; } // data se mezitím změnila — nic k zobrazení

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cName = lang === 'en' ? c.name_en : c.name;
        const sin = lang === 'en' ? (c.confession_en || '') : (c.confession || '');

        // Osa a váha — Přísné pokání/Shovívavost teď platí/vydělávají na OSE
        // toho konkrétního kontaktu, ne vždycky na Church. Sekundární osa
        // (je-li) dostane poměrnou část dle její weight.
        const axis = c.primaryAxis || 'village';
        const secAxis = c.secondaryAxis && c.secondaryAxis.axis;
        const secWeight = c.secondaryAxis ? c.secondaryAxis.weight : 0;

        // Gated kontakty (mají minRelation práh na zboží/zakázky) riskují víc
        // při přísném pokání — formální vztah, hůř snáší tvrdost.
        const isGated = (c.buyOffer && Object.values(c.buyOffer.items || {}).some(o => o.minRelation))
            || (c.glassOrders && Object.values(c.glassOrders).some(o => o.minRelation));
        const strictPenalty = isGated ? -5 : -3;
        const curRelation = (GameState.contactRelation && GameState.contactRelation[id]) || 0;
        const gateWarning = isGated
            ? `<div style="margin-top:6px; font-size:0.72rem; color:#c0392b;">⚠️ ${lang === 'en'
                ? 'A formal relationship — harsh judgment risks more here (current relation: ' + curRelation + ').'
                : 'Formální vztah — přísnost tu riskuje víc (aktuální vztah: ' + curRelation + ').'}</div>`
            : '';

        const rerender = () => {
            const el = document.getElementById('home-templum-content');
            if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
        };
        const record = (choice) => {
            t.lastConfession = { id: id, name: cName, choice: choice, ts: Date.now() };
            TemplumManager._templumLog({ type: 'confession', name: cName, choice: choice });
        };

        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.pendingEvent) {
            NotificationSystem.pendingEvent({
                id: pendingId,
                icon: '🙏',
                title: (lang === 'en' ? 'Confession — ' : 'Zpověď — ') + cName,
                source: 'game_confession',
            });
        }

        NotificationSystem.modal({
            icon: '🙏',
            title: (lang === 'en' ? 'Confession — ' : 'Zpověď — ') + cName,
            text: `<div style="font-size:0.82rem; line-height:1.45;">${c.icon} <span style="font-style:italic; opacity:0.85;">${sin}</span><br><br>${lang === 'en' ? 'He kneels and waits for your word.' : 'Klečí a čeká na tvé slovo.'}</div>${gateWarning}`,
            choices: [
                {
                    label: (lang === 'en' ? '⚖️ Strict penance' : '⚖️ Přísné pokání'), type: 'danger', effect: () => {
                        if (typeof PersonaSystem !== 'undefined') {
                            PersonaSystem.addInfluence(axis, 3);
                            if (secAxis) PersonaSystem.addInfluence(secAxis, Math.round(3 * secWeight * 10) / 10);
                            if (PersonaSystem.addZboznost) PersonaSystem.addZboznost(2);
                        }
                        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.addContactRelation(id, strictPenalty);
                        record('strict');
                        Game.addKronikaEntry('minor',
                            '🙏 Zpověď: ' + cName + ' dostal přísné pokání. Bylo to k něčímu prospěchu — jemu ne.',
                            '🙏 Confession: ' + cName + ' received strict penance. Someone benefits from it — he does not.',
                            '🙏 Poenitentia severa imposita est.');
                        clearPending();
                        Game.save(); rerender();
                    }
                },
                {
                    label: (lang === 'en' ? '🕊️ Leniency' : '🕊️ Shovívavost'), effect: () => {
                        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.addContactRelation(id, 3);
                        if (typeof PersonaSystem !== 'undefined') {
                            PersonaSystem.addInfluence(axis, 1);
                            if (secAxis) PersonaSystem.addInfluence(secAxis, Math.round(1 * secWeight * 10) / 10);
                        }
                        record('lenient');
                        Game.addKronikaEntry('minor',
                            '🙏 Zpověď: ' + cName + ' odešel s lehkým pokáním a lehčím srdcem.',
                            '🙏 Confession: ' + cName + ' left with a light penance and a lighter heart.',
                            '🙏 Misericordia praevaluit.');
                        clearPending();
                        Game.save(); rerender();
                    }
                },
                {
                    label: (lang === 'en' ? '🚪 Turn him away' : '🚪 Odmítnout'), effect: () => {
                        record('refused');
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(-1);
                        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.addContactRelation(id, -2);
                        Game.addKronikaEntry('minor',
                            '🙏 Zpověď: ' + cName + ' odešel nevyslyšen — a nezapomene na to.',
                            '🙏 Confession: ' + cName + ' left unheard — and will not forget it.',
                            '🙏 Confessio recusata est.');
                        clearPending();
                        Game.save(); rerender();
                    }
                },
            ]
        });
    },

    // ── Haeresis Occulta MRD — Cesta B (pokání). Dedikovaná akce, VÝSLOVNĚ
    // oddělená od templumConfessionTick nahoře (ten řeší cizí hříchy
    // villagerů/kontaktů, ne bratrův vlastní blud). Volá se z tlačítka
    // ve Valetudo tabu (PersonaSystem._renderValetudo), jen když je
    // haeresis_occulta aktivní. Léčí okamžitě (žádný item), ale sráží
    // inquisitionHeat víc než Cesta A (Elixir Purgationis).
    // vrchcaby-confessor-agency-mrd (16.8.2026): sdílené pro obě zpovědi
    // (kacířství i hazard) — opat rozhoduje sám, váha podle jeho
    // charakterového rysu + mírný posun podle aktuálního Podezření.
    ABBOT_STRICTNESS: { bernard: 0.50, prokop: 0.65, metodej: 0.35, havel: 0.30, bohuslav: 0.55 },
    _rollAbbotStrict: function () {
        const abbotId = GameState.knownAbbotId || 'bernard';
        const heat = (GameState.secrets && GameState.secrets.inquisitionHeat) || 0;
        const pStrict = Math.max(0.05, Math.min(0.95, (this.ABBOT_STRICTNESS[abbotId] || 0.50) + (heat / 100) * 0.15));
        return Math.random() < pStrict;
    },

    confessHeresy: function () {
        if (!(GameState.health && GameState.health.active && GameState.health.active['haeresis_occulta'])) return;
        if ((GameState.abbotLocation || 'present') !== 'present') return;
        if (typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cool = (amount) => { if (GameState.secrets) GameState.secrets.inquisitionHeat = Math.max(0, (GameState.secrets.inquisitionHeat || 0) - amount); };
        const abbotName = (typeof AbbotSystem !== 'undefined' && AbbotSystem.getCurrentAbbot) ? AbbotSystem.getCurrentAbbot().name : 'Opat';

        NotificationSystem.modal({
            icon: '🙏',
            title: lang === 'en' ? 'Confess to the Abbot' : 'Vyznat se opatovi',
            text: lang === 'en'
                ? 'The thought that crept in with the draught does not belong to you. Kneel and confess it before it takes root. How he judges you is his to decide, not yours.'
                : 'Myšlenka, co přišla s douškem, ti nepatří. Poklekni a vyznej ji, než zapustí kořeny. Jak tě posoudí, je na něm, ne na tobě.',
            choices: [
                {
                    label: (lang === 'en' ? '🙏 Confess' : '🙏 Vyznat se'), type: 'primary', effect: () => {
                        HealthSystem.removeCondition('haeresis_occulta', true);
                        const strict = TemplumManager._rollAbbotStrict();
                        if (strict) {
                            if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 8);
                            cool(20);
                            UI.notify('⚖️ ' + (lang === 'en'
                                ? abbotName + ' judges you strictly — painful, but thorough. Ecclesia +8, suspicion −20.'
                                : abbotName + ' tě posoudil přísně — bolestivé, ale důkladné. Ecclesia +8, Podezření −20.'));
                            Game.addKronikaEntry('minor',
                                '🙏 Vyznal ses opatovi z kacířského bludu. Posoudil tě přísně.',
                                '🙏 You confessed the heretical delusion to the Abbot. He judged you strictly.',
                                '🙏 Confessio facta est. Poenitentia severa.');
                        } else {
                            if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 3);
                            cool(12);
                            UI.notify('🕊️ ' + (lang === 'en'
                                ? abbotName + ' shows you mercy — a lighter heart, a smaller peace. Ecclesia +3, suspicion −12.'
                                : abbotName + ' ti prokázal milost — lehčí srdce, menší klid. Ecclesia +3, Podezření −12.'));
                            Game.addKronikaEntry('minor',
                                '🙏 Vyznal ses opatovi z kacířského bludu. Prokázal ti milost.',
                                '🙏 You confessed the heretical delusion to the Abbot. He showed you mercy.',
                                '🙏 Confessio facta est. Misericordia data.');
                        }
                        Game.save();
                        if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
                    }
                }
            ]
        });
    },

    // vrchcaby-hrich-mrd (15.8.2026): zpověď z hazardu — živý AI rozhovor
    // (mirror scribeAIChat, vlastní kvóta 4/den) + mechanické tlačítka
    // (mirror confessHeresy). Chat = atmosféra, tlačítka = jediný zdroj
    // mechanického efektu — AI odpověď nikdy nemění Zbožnost/heat sama.
    confessGambling: function () {
        if ((GameState.abbotLocation || 'present') !== 'present') return;
        if (typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cool = (amount) => { if (GameState.secrets) GameState.secrets.inquisitionHeat = Math.max(0, (GameState.secrets.inquisitionHeat || 0) - amount); };
        const abbotName = (typeof AbbotSystem !== 'undefined' && AbbotSystem.getCurrentAbbot) ? AbbotSystem.getCurrentAbbot().name : 'Opat';

        if (!GameState.confessorState) GameState.confessorState = { aiQuota: { count: 0, resetAt: 0 } };
        const quota = GameState.confessorState.aiQuota;
        const DAY_MS = 24 * 3600000;
        const DAILY_LIMIT = 4;
        if (Date.now() - quota.resetAt > DAY_MS) { quota.count = 0; quota.resetAt = Date.now(); }
        const remaining = Math.max(0, DAILY_LIMIT - quota.count);

        const chatHtml = remaining > 0 ? `
            <div style="margin-bottom:8px; font-size:0.85rem; opacity:0.8;">
                ${lang === 'en' ? `Speak with him (${remaining} left today):` : `Promluv k němu (zbývá ${remaining} dnes):`}
            </div>
            <textarea id="confessor-chat-input" rows="2" maxlength="300"
                style="width:100%; box-sizing:border-box; padding:8px; border-radius:4px; border:1px solid var(--border-color); background:rgba(0,0,0,0.15); color:inherit; font-family:inherit;"
                placeholder="${lang === 'en' ? 'Confess...' : 'Vyznej se...'}"></textarea>
            <button class="craft-btn" style="margin-top:8px;" onclick="TemplumManager.confessorAISend()">📨 ${lang === 'en' ? 'Speak' : 'Promluvit'}</button>
            <div id="confessor-chat-reply" style="margin-top:10px; font-style:italic; min-height:20px;"></div>
        ` : `<div style="font-size:0.82rem; opacity:0.7; font-style:italic;">${lang === 'en' ? 'He has heard enough confessions for today.' : 'Dnes už vyslechl dost zpovědí.'}</div>`;

        NotificationSystem.modal({
            icon: '🙏',
            title: (lang === 'en' ? 'Confess to ' : 'Vyznat se — ') + abbotName,
            text: `<div style="margin-bottom:10px;">${lang === 'en'
                ? 'You kneel to confess: you have been gambling at dice, and it weighs on you. How he judges you is his to decide, not yours.'
                : 'Klekáš ke zpovědi: hrál jsi v kostky, a tíží tě to. Jak tě posoudí, je na něm, ne na tobě.'}</div>${chatHtml}`,
            choices: [
                {
                    label: (lang === 'en' ? '🙏 Confess' : '🙏 Vyznat se'), type: 'primary', effect: () => {
                        const strict = TemplumManager._rollAbbotStrict();
                        if (strict) {
                            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(2);
                            cool(20);
                            UI.notify('⚖️ ' + (lang === 'en'
                                ? abbotName + ' judges you strictly — Piety +2, suspicion −20.'
                                : abbotName + ' tě posoudil přísně — Zbožnost +2, Podezření −20.'));
                            Game.addKronikaEntry('minor',
                                '🙏 Vyznal ses opatovi z hazardu. Posoudil tě přísně.',
                                '🙏 You confessed the gambling to the Abbot. He judged you strictly.',
                                '🙏 Confessio facta est de alea. Poenitentia severa.');
                        } else {
                            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
                            cool(12);
                            UI.notify('🕊️ ' + (lang === 'en'
                                ? abbotName + ' shows you mercy — Piety +1, suspicion −12.'
                                : abbotName + ' ti prokázal milost — Zbožnost +1, Podezření −12.'));
                            Game.addKronikaEntry('minor',
                                '🙏 Vyznal ses opatovi z hazardu. Prokázal ti milost.',
                                '🙏 You confessed the gambling to the Abbot. He showed you mercy.',
                                '🙏 Confessio facta est de alea. Misericordia data.');
                        }
                        Game.save();
                        if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
                    }
                }
            ]
        });
    },

    // Typovaná pole pro confessor-chat kontext — žádný syrový text, backend stejně revaliduje.
    _gatherConfessorContext: function () {
        return {
            zboznost: (GameState.persona && GameState.persona.zboznost) || 0,
            inquisitionHeat: (GameState.secrets && GameState.secrets.inquisitionHeat) || 0,
            gamblingNetLoss: (GameState.gamblingStats && GameState.gamblingStats.netLoss) || 0
        };
    },

    confessorAISend: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const input = document.getElementById('confessor-chat-input');
        const replyEl = document.getElementById('confessor-chat-reply');
        if (!input || !replyEl) return;
        const message = input.value.trim();
        if (!message) return;

        replyEl.textContent = lang === 'en' ? 'He ponders...' : 'Přemýšlí...';
        input.disabled = true;

        if (!GameState.confessorState) GameState.confessorState = { aiQuota: { count: 0, resetAt: 0 } };
        const quota = GameState.confessorState.aiQuota;
        const abbotId = GameState.knownAbbotId || 'bernard';

        fetch('/api/confessor-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message.slice(0, 300), lang, abbotId, context: TemplumManager._gatherConfessorContext() })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                replyEl.textContent = data && data.reply
                    ? data.reply
                    : (lang === 'en' ? '...' : '...');
                if (!(data && data.filtered)) {
                    quota.count++;
                    Game.save();
                }
                input.disabled = false;
            })
            .catch(function () {
                replyEl.textContent = lang === 'en' ? 'He does not answer.' : 'Neodpovídá.';
                input.disabled = false;
            });
    },

    MASS_INCENSE_TIER: { incense_spruce: 0, incense_pine: 1, incense_styrax: 2, incense_olibanum: 3 },

    serveMass: function () {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const now = Date.now();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((t.nextMass || 0) > now) return;
        const inv = GameState.inventory;

        if ((inv['candle'] || 0) < 2) { UI.notify('⚠️ ' + (lang === 'en' ? 'Mass needs 2 candles.' : 'Mše potřebuje 2 svíce.'), true); return; }
        const wineId = (inv['vinum'] || 0) > 0 ? 'vinum' : ((inv['wine'] || 0) > 0 ? 'wine' : null);
        if (!wineId) { UI.notify('⚠️ ' + (lang === 'en' ? 'Mass needs wine.' : 'Mše potřebuje víno.'), true); return; }
        // Nejlepší dostupné kadidlo — mši náleží to nejlepší (historicky věrné, tier bonus funguje)
        const incenseId = ['incense_olibanum', 'incense_styrax', 'incense_pine', 'incense_spruce'].find(id => (inv[id] || 0) > 0);
        if (!incenseId) { UI.notify('⚠️ ' + (lang === 'en' ? 'Mass needs incense.' : 'Mše potřebuje kadidlo.'), true); return; }
        if ((inv['hostia'] || 0) < 3) { UI.notify('⚠️ ' + (lang === 'en' ? 'Mass needs 3 host wafers.' : 'Mše potřebuje 3 hostie.'), true); return; }

        Game.removeItem('candle', 2);
        Game.removeItem(wineId, 1);
        Game.removeItem(incenseId, 1);
        Game.removeItem('hostia', 3);

        // Mešní nádobí (od Katedrály): křehké sklo se občas rozbije, spotřeba jen pokud je skladem
        let brokenGlass = null;
        if ((t.fabricaTier || 0) >= 3 && Math.random() < 0.08) {
            const glassOrder = Math.random() < 0.5 ? ['glass_goblet', 'glass_bowl'] : ['glass_bowl', 'glass_goblet'];
            const glassId = glassOrder.find(id => (inv[id] || 0) > 0);
            if (glassId) { Game.removeItem(glassId, 1); brokenGlass = glassId; }
        }

        // Stav kostela (T2 payoff): zhasnuto nebo zaprášeno → poloviční efekt
        const lit = (t.litUntil || 0) > now;
        const clean = (t.cleanUntil || 0) > now;
        const degraded = !lit || !clean;
        // Vestment-sezóna: liturgická barva musí sedět, jinak stejná penalizace jako degraded
        const VESTMENT_BY_COLOR = { white: 'roucho_bile', purple: 'roucho_fialove', green: 'roucho_zelene', red: 'roucho_cervene' };
        const liturgicalColor = (typeof CalendarSystem !== 'undefined' && CalendarSystem.getLiturgicalColor) ? CalendarSystem.getLiturgicalColor(new Date()) : null;
        const vestmentId = liturgicalColor ? VESTMENT_BY_COLOR[liturgicalColor] : null;
        const wrongVestment = vestmentId ? (inv[vestmentId] || 0) < 1 : false;
        let eccl = 5 + (this.MASS_INCENSE_TIER[incenseId] || 0);
        // Visitatio V2: vystavená relikvie — mše nese větší milost (základ, PŘED degradací i svátkem)
        if ((GameState.inventory['reliquia'] || 0) >= 1) eccl += 1;
        let vill = 3;
        if (degraded) { eccl = Math.max(1, Math.floor(eccl / 2)); vill = Math.max(1, Math.floor(vill / 2)); }
        if (wrongVestment) { eccl = Math.max(1, Math.floor(eccl / 2)); vill = Math.max(1, Math.floor(vill / 2)); }
        // Svátkový násobič (Chronicon feast flag) — PO degradaci; defenzivní no-op bez snapshotu
        let feastName = null;
        const _snap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
        if (_snap && _snap.feast && _snap.feast.active) {
            feastName = (lang === 'en' ? (_snap.feast.name_en || _snap.feast.name_cs) : _snap.feast.name_cs) || null;
            eccl *= 2;
            vill *= 2;
        }

        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
            PersonaSystem.addInfluence('church', eccl);
            PersonaSystem.addInfluence('village', vill);
        }
        // Zbožnost — osobní kotva (endgame-branches-reference.md sekce 9, Superbia/pravidelnost)
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
        t.nextMass = now + 7 * 24 * 60 * 60 * 1000;
        t.lastMass = { ts: now, incense: incenseId, degraded: degraded };
        TemplumManager._templumLog({ type: 'mass', incense: incenseId, degraded: degraded, feastName: feastName, eccl: eccl });
        // Anonymní denní favor report pro CHRONICON aktéra 'klaster' —
        // farnost-chronicon-reference.md sekce 4. Funkce v ChroniconSystem.js
        // existovala už dřív, jen nebyla nikde volaná.
        if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._reportActorFavorIfNewDay) {
            ChroniconSystem._reportActorFavorIfNewDay('klaster');
        }
        // R1: odsloužená mše = držený kanonický rytmus (frater vyžaduje streak ≥ 7)
        if (GameState.rank) {
            GameState.rank.canonicalStreak = (GameState.rank.canonicalStreak || 0) + 1;
            if (typeof RankSystem !== 'undefined' && RankSystem.checkMonasticProgress) RankSystem.checkMonasticProgress();
        }
        Game.save();

        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            const feastPart = feastName ? (lang === 'en' ? ' Feast of ' + feastName + ' — twofold grace!' : ' Svátek ' + feastName + ' — dvojnásobná milost!') : '';
            const vestmentPart = wrongVestment ? (lang === 'en' ? ' Wrong vestment colour — impact reduced.' : ' Špatná barva roucha — dopad snížen.') : '';
            const glassPart = brokenGlass ? (lang === 'en' ? ' Fragile glass broke during mass.' : ' Křehké sklo při mši prasklo.') : '';
            UI.notifyPanel('⛪ ' + (degraded
                ? (lang === 'en' ? 'Mass held in gloom and dust. Ecclesia +' + eccl + ', village +' + vill + '.' : 'Mše v šeru a prachu. Ecclesia +' + eccl + ', vesnice +' + vill + '.')
                : (lang === 'en' ? 'Mass held. Ecclesia +' + eccl + ', village +' + vill + '.' : 'Mše odsloužena. Ecclesia +' + eccl + ', vesnice +' + vill + '.')) + feastPart + vestmentPart + glassPart, (degraded || wrongVestment) ? 'warning' : 'success');
        }
        Game.addKronikaEntry('important',
            feastName ? '⛪ Mše o svátku ' + feastName + ' — kostel praskal ve švech.' : (degraded ? '⛪ Mše sloužena v šeru a prachu — kostel volá po péči.' : '⛪ Mše slavnostně odsloužena. Kraj naslouchal.'),
            feastName ? '⛪ Mass on the feast of ' + feastName + ' — the church was full to bursting.' : (degraded ? '⛪ Mass held in gloom and dust — the church calls for care.' : '⛪ Mass solemnly celebrated. The countryside listened.'),
            '⛪ Missa celebrata est.');
        const el = document.getElementById('home-templum-content');
        if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
    },

    // Pilíř Almužník (T7) — týdenní rozdání přebytku jídla, mirror serveMass
    // vzoru. Gating (rank frater+, cooldown, 15 jídla) už existovalo v
    // TemplumSystem.renderTemplumTab(), jen tahle akce chyběla — tlačítko
    // volalo TemplumManager.giveAlms(), která nikde nebyla definovaná.
    giveAlms: function () {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const now = Date.now();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        if (!(GameState.rank && ['frater', 'armarius', 'prior'].includes(GameState.rank.monastic))) return;
        if ((t.nextAlms || 0) > now) return;

        const inv = GameState.inventory;
        let need = 15;
        const consumed = [];
        for (const [id, qty] of Object.entries(inv || {})) {
            if (need <= 0) break;
            const it = (typeof ItemsDB !== 'undefined') ? ItemsDB[id] : null;
            if (it && it.type === 'food' && typeof qty === 'number' && qty > 0) {
                const take = Math.min(qty, need);
                consumed.push([id, take]);
                need -= take;
            }
        }
        if (need > 0) {
            UI.notify('⚠️ ' + (lang === 'en' ? 'Not enough food surplus (need 15).' : 'Nedostatek přebytku jídla (potřeba 15).'), true);
            return;
        }
        consumed.forEach(([id, qty]) => Game.removeItem(id, qty));

        const vill = 5;
        const zboz = 1;
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', vill);
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(zboz);
        // Pověst — Lidovost, tiered diminishing returns (povest-frakcni-reputace-mrd.md R3)
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
            const _curLid = (GameState.persona && GameState.persona.reputation && GameState.persona.reputation.lidovost) || 0;
            const _repDelta = _curLid < 50 ? 2 : _curLid < 80 ? 1 : 0;
            if (_repDelta > 0) PersonaSystem.addReputation('lidovost', _repDelta);
        }

        t.nextAlms = now + 7 * 24 * 60 * 60 * 1000;
        t.lastAlms = { ts: now };

        // templum-reward-combo-mrd (9.8.2026): item generace (svíce jako
        // vedlejší produkt bohoslužby) + abbotFavor + neprerušená kontinuita
        // (streak týdnů beze suspension, roste bonus, strop +50%).
        if (!t.uninterruptedWeeks) t.uninterruptedWeeks = 0;
        t.uninterruptedWeeks += 1;
        const streakMult = Math.min(1.5, 1 + t.uninterruptedWeeks * 0.05);
        Game.addItem('candle', Math.round(1 * streakMult));
        if (!GameState.secrets) GameState.secrets = {};
        GameState.secrets.abbotFavor = (GameState.secrets.abbotFavor || 0) + 2;

        // Stejný anonymní denní favor report pro 'klaster' jako u mše —
        // almužna je taky charitativní čin kláštera vůči kraji.
        if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._reportActorFavorIfNewDay) {
            ChroniconSystem._reportActorFavorIfNewDay('klaster');
        }

        Game.save();

        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            UI.notifyPanel('🥖 ' + (lang === 'en'
                ? 'Alms distributed. Village +' + vill + ', piety +' + zboz + '.'
                : 'Almužna rozdána. Vesnice +' + vill + ', zbožnost +' + zboz + '.'), 'success');
        }
        Game.addKronikaEntry('important',
            '🥖 Almužník rozdal přebytek jídla chudým ve vsi.',
            '🥖 The almoner distributed the surplus food to the poor of the village.',
            '🥖 Eleemosyna pauperibus distributa est.');

        const elAlms = document.getElementById('home-templum-content');
        if (elAlms && typeof TemplumSystem !== 'undefined') elAlms.innerHTML = TemplumSystem.renderTemplumTab();
    },

    // ── TEMPLUM Fabrica Ecclesiae — 4 stavební úrovně (endgame-branches-reference.md sekce 4.2) ──
    FABRICA_TIERS: [
        { name: 'Kaple', name_en: 'Chapel', cost: 0, req: null, decayMult: 1.00, repairEff: 1.00 },
        { name: 'Kostel', name_en: 'Church', cost: 150, req: { ecclesia: 15, condition: 60, organ: true }, decayMult: 1.10, repairEff: 1.10 },
        { name: 'Chrám', name_en: 'Temple', cost: 400, req: { ecclesia: 35, zboznost: 25, condition: 70, materials: { cut_stone: 150, plank: 80, iron_ingot: 4, glass_stopper: 8 } }, decayMult: 1.20, repairEff: 1.25, buildDays: 10, repairCost: 20, repairMaterials: { cut_stone: 5 } },
        { name: 'Katedrála', name_en: 'Cathedral', cost: 900, req: { ecclesia: 60, zboznost: 50, condition: 80, materials: { cut_stone: 350, plank: 200, iron_ingot: 12, glass_stopper: 20, glass_goblet: 3, glass_bowl: 3, chrlic: 4 } }, decayMult: 1.35, repairEff: 1.40, buildDays: 14, repairCost: 30, repairMaterials: { cut_stone: 8, glass_bowl: 1 } },
    ],

    fabricaMeetsRequirements: function (req) {
        if (!req) return true;
        const p = GameState.persona || {};
        const cond = (GameState.templum && GameState.templum.condition != null) ? GameState.templum.condition : 100;
        if (req.condition && cond < req.condition) return false;
        if (req.ecclesia && ((p.influence && p.influence.church) || 0) < req.ecclesia) return false;
        if (req.zboznost && (p.zboznost || 0) < req.zboznost) return false;
        if (req.organ && (GameState.inventory['organ'] || 0) < 1) return false;
        if (req.materials) {
            for (const matId in req.materials) {
                if ((GameState.inventory[matId] || 0) < req.materials[matId]) return false;
            }
        }
        return true;
    },

    upgradeFabrica: function () {
        if (typeof CellariumSystem === 'undefined') return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const tier = t.fabricaTier || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (tier >= this.FABRICA_TIERS.length - 1) return;
        if (t.fabricaBuildUntil) { UI.notify('⚠️ ' + (lang === 'en' ? 'Construction already underway.' : 'Stavba už probíhá.'), true); return; }
        const next = this.FABRICA_TIERS[tier + 1];
        if (!this.fabricaMeetsRequirements(next.req)) { UI.notify('⚠️ ' + (lang === 'en' ? 'Requirements not met.' : 'Podmínky nesplněny.'), true); return; }
        if (CellariumSystem.getGrose() < next.cost) { UI.notify('⚠️ ' + (lang === 'en' ? 'Not enough groschen.' : 'Nedostatek grošů.'), true); return; }
        CellariumSystem.spendGrose(next.cost);
        const mats = (next.req && next.req.materials) || {};
        for (const matId in mats) Game.removeItem(matId, mats[matId]);
        const name = lang === 'en' ? next.name_en : next.name;
        if (next.buildDays) {
            // templum-reward-combo-mrd (9.8.2026): neprerušená kontinuita
            // zrychlí stavbu, strop 25% (mirror giveAlms streakMult, jiný cíl)
            const _weeks = (t.uninterruptedWeeks || 0);
            const _speedMult = Math.max(0.75, 1 - _weeks * 0.02); // 2%/týden, dno 75% (=max 25% zrychlení)
            t.fabricaBuildUntil = Date.now() + Math.round(next.buildDays * _speedMult) * 24 * 60 * 60 * 1000;
            t.fabricaBuildTargetTier = tier + 1;
            Game.save();
            UI.notifyPanel('🏗️ ' + (lang === 'en' ? 'Construction begins: ' : 'Stavba začíná: ') + name + '.', 'success');
            Game.addKronikaEntry('important',
                '🏗️ Fabrica: stavba ' + name + ' zahájena. Potrvá ' + next.buildDays + ' dní.',
                '🏗️ Fabrica: construction of ' + name + ' begun. Will take ' + next.buildDays + ' days.',
                '🏗️ Fabrica ecclesiae aedificatur.');
        } else {
            t.fabricaTier = tier + 1;
            Game.save();
            UI.notifyPanel('🏛️ ' + (lang === 'en' ? 'The church rises: ' : 'Kostel roste: ') + name + '.', 'success');
            Game.addKronikaEntry('important',
                '🏛️ Fabrica: kostel povýšen na ' + name + '.',
                '🏛️ Fabrica: the church raised to ' + name + '.',
                '🏛️ Fabrica ecclesiae aucta est.');
        }
        const el2 = document.getElementById('home-templum-content');
        if (el2 && typeof TemplumSystem !== 'undefined') el2.innerHTML = TemplumSystem.renderTemplumTab();
    },

    checkFabricaBuildComplete: function () {
        if (!GameState.templum) return;
        const t = GameState.templum;
        if (!t.fabricaBuildUntil || Date.now() < t.fabricaBuildUntil) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const targetTier = t.fabricaBuildTargetTier;
        const def = this.FABRICA_TIERS[targetTier];
        t.fabricaTier = targetTier;
        t.fabricaBuildUntil = null;
        t.fabricaBuildTargetTier = null;
        const name = lang === 'en' ? def.name_en : def.name;
        Game.save();
        UI.notifyPanel('🏛️ ' + (lang === 'en' ? 'Construction complete: ' : 'Stavba dokončena: ') + name + '.', 'success');
        Game.addKronikaEntry('important',
            '🏛️ Fabrica: ' + name + ' dokončena.',
            '🏛️ Fabrica: ' + name + ' completed.',
            '🏛️ Fabrica ecclesiae perfecta est.');
    },

    buildNahrobek: function (ts) {
        if (!GameState.cemetery) return;
        const grave = (GameState.cemetery.graves || []).find(g => g.ts === ts);
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!grave || grave.nahrobek) return;
        if ((GameState.inventory['nahrobek'] || 0) < 1) { UI.notify('⚠️ ' + (lang === 'en' ? 'No gravestone in store.' : 'Nemáš náhrobek na skladě.'), true); return; }
        Game.removeItem('nahrobek', 1);
        grave.nahrobek = true;
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
        Game.save();
        UI.notify('🪦 ' + (lang === 'en' ? 'Gravestone set.' : 'Náhrobek postaven.'));
        const el = document.getElementById('home-templum-content');
        if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
    },

    repairFabrica: function () {
        if (typeof CellariumSystem === 'undefined') return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const tierDef = this.FABRICA_TIERS[t.fabricaTier || 0];
        const cost = tierDef.repairCost || 20;
        const mats = tierDef.repairMaterials || {};
        if (CellariumSystem.getGrose() < cost) { UI.notify('⚠️ ' + (lang === 'en' ? 'Not enough groschen.' : 'Nedostatek grošů.'), true); return; }
        for (const matId in mats) {
            if ((GameState.inventory[matId] || 0) < mats[matId]) {
                const matName = (typeof iName === 'function') ? iName(matId) : matId;
                UI.notify('⚠️ ' + (lang === 'en' ? 'Missing material: ' : 'Chybí materiál: ') + matName + '.', true);
                return;
            }
        }
        CellariumSystem.spendGrose(cost);
        for (const matId in mats) Game.removeItem(matId, mats[matId]);
        t.condition = Math.min(100, (t.condition != null ? t.condition : 100) + 15 * tierDef.repairEff);
        Game.save();
        UI.notify('🔧 ' + (lang === 'en' ? 'Repairs made.' : 'Opraveno.'));
        const el3 = document.getElementById('home-templum-content');
        if (el3 && typeof TemplumSystem !== 'undefined') el3.innerHTML = TemplumSystem.renderTemplumTab();
    },
    templumDailyTick: function () {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        this.checkFabricaBuildComplete();
        if (now - (t.lastTick || 0) < DAY) return;
        t.lastTick = now;

        // Svíce: kostel spotřebuje 1 svíci denně (Voskařova smyčka); bez svíce zhasnuto
        if ((GameState.inventory['candle'] || 0) > 0) {
            Game.removeItem('candle', 1);
            t.litUntil = now + DAY;
        }

        // Úklid: konvrš PŘIŘAZENÝ na Kostel a/nebo bratr (Kostelník) dohlížející —
        // stejný combo vzor jako Manufaktura (dormitoriumBrotherMult, _workCredit).
        // Buď může uklízet sám; s oběma se čisto drží déle.
        const kostelBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'kostel');
        const cleaner = (GameState.conversi || [])
            .filter(k => k.task === 'kostel'
                && k.fatigue < (Game._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > now)
                && !(k.injuredUntil && k.injuredUntil > now)
                && !(k.awayUntil && k.awayUntil > now))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (cleaner || kostelBrother) {
            const brotherMult = kostelBrother ? Game.dormitoriumBrotherMult(kostelBrother, 'kostel') : 1.0;
            if (cleaner) cleaner.fatigue = Math.min(100, cleaner.fatigue + 5);
            if (kostelBrother) {
                Game.dormitoriumAddXp(kostelBrother, 'kostel');
                kostelBrother.fatigue = Math.min(100, (kostelBrother.fatigue || 0) + 5);
            }
            t.cleanUntil = now + Math.round(48 * 60 * 60 * 1000 * brotherMult);
            t.lastCleaner = Game._workCredit(kostelBrother, cleaner);
        }
        // Fabrica: strukturální stav budovy pomalu chátrá, rychleji u vyšších úrovní
        const fTier = this.FABRICA_TIERS[t.fabricaTier || 0];
        t.condition = Math.max(0, (t.condition != null ? t.condition : 100) - 0.3 * fTier.decayMult);

        // Hřbitov: konvrš přiřazený na Hřbitov a/nebo bratr Kostelník dohlížející.
        // Bratr NENÍ samostatná "hrbitov" specializace — jeden Kostelník
        // (assignedTab === 'kostel') dohlíží na celý Templum, hřbitov nevyjímaje.
        // Rozlišení kostel/hřbitov je jen na úrovni konvršů (fyzická práce),
        // ne na úrovni dohlížejícího bratra.
        if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
        const cem = GameState.cemetery;
        const templumBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'kostel');
        const cemCleaner = (GameState.conversi || [])
            .filter(k => k.task === 'hrbitov'
                && k.fatigue < (Game._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > now)
                && !(k.injuredUntil && k.injuredUntil > now)
                && !(k.awayUntil && k.awayUntil > now))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (cemCleaner || templumBrother) {
            const brotherMult = templumBrother ? Game.dormitoriumBrotherMult(templumBrother, 'kostel') : 1.0;
            if (cemCleaner) cemCleaner.fatigue = Math.min(100, cemCleaner.fatigue + 5);
            if (templumBrother) {
                Game.dormitoriumAddXp(templumBrother, 'kostel');
                templumBrother.fatigue = Math.min(100, (templumBrother.fatigue || 0) + 5);
            }
            cem.condition = Math.min(100, cem.condition + 5 * brotherMult);
            cem.lastCleaner = Game._workCredit(templumBrother, cemCleaner);
        }
        cem.condition = Math.max(0, cem.condition - 1); // pomalé zarůstání bez péče

        // Bestiář: Revenanti — hřbitov dlouhodobě zanedbaný (<30 %, se hroby)
        // odemkne legendu o neklidných mrtvých. Mirror Acedia vzoru (nízký
        // Vigor dlouho = eroze); tady nízký condition dlouho = nález.
        if (cem.condition < 30 && cem.graves.length > 0 && typeof SecretsSystem !== 'undefined') {
            SecretsSystem.unlockFolioById('folio_revenanti_bestiar');
        }

        // Persona influence — zanedbání se tiše propíše do vztahů, ne jen
        // do čísla stavu. Fabrica (fyzická stavba kostela) je věc hierarchie
        // → Church osa. Hřbitov (hroby vesnických rodin) je věc obce →
        // Village osa. Malý denní úbytek, jen pod prahem 40 %.
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
            if (t.condition < 40) {
                PersonaSystem.addInfluence('church', -0.3);
                if (!t.neglectWarnedChurch) {
                    t.neglectWarnedChurch = true;
                    Game.addKronikaEntry('important',
                        '⚠️ Sešlý kostel neujde pozornosti hierarchie. Vztah s Církví tiše klesá.',
                        '⚠️ A dilapidated church does not escape the notice of the hierarchy. Relations with the Church are quietly slipping.', '');
                }
            } else {
                t.neglectWarnedChurch = false;
            }
            if (cem.condition < 40) {
                PersonaSystem.addInfluence('village', -0.3);
                if (!GameState.cemetery.neglectWarnedVillage) {
                    GameState.cemetery.neglectWarnedVillage = true;
                    Game.addKronikaEntry('important',
                        '⚠️ Zarostlý hřbitov si vesničané všimli — jsou to jejich mrtví. Vztah s Vsí tiše klesá.',
                        '⚠️ The overgrown churchyard has not gone unnoticed by the villagers — these are their dead. Relations with the Village are quietly slipping.', '');
                }
            } else {
                GameState.cemetery.neglectWarnedVillage = false;
            }
        }

        Game.save();
    },

    // ── VITREA V1: startovní pool + denní opotřebení (MRD vitrea-equipment-reference.md) ──
    VITREA_BREAKABLE: ['glass_stopper', 'glass_flask', 'fly_trap_glass', 'glass_goblet', 'glass_tankard', 'glass_jug', 'glass_bowl', 'glass_pitcher', 'glass_vase', 'window_roundel', 'paternoster_beads', 'alembic', 'glass_mirror'],

    vitreaGrantStartPool: function () {
        if (GameState.vitreaGranted) return;
        GameState.vitreaGranted = true;
        // Klášter začíná s vybavením (~18 ks); alembik záměrně NE — hard gate přes Skláře
        Game.addItem('glass_bowl', 3);
        Game.addItem('glass_jug', 3);
        Game.addItem('glass_goblet', 4);
        Game.addItem('glass_pitcher', 1);
        Game.addItem('glass_stopper', 5);
        Game.addItem('glass_flask', 2);
        Game.save();
    },

    vitreaWearTick: function () {
        const last = GameState.vitreaLastWear || 0;
        if (Date.now() - last < 24 * 60 * 60 * 1000) return;
        GameState.vitreaLastWear = Date.now();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const conversiCnt = (GameState.conversi || []).length;
        const jilji = (GameState.conversi || []).some(k => k.rosterId === 'k_jilji');
        const chance = Math.min(0.35, 0.05 + 0.02 * conversiCnt + (jilji ? 0.05 : 0));
        if (Math.random() >= chance) { Game.save(); return; }
        const owned = this.VITREA_BREAKABLE.filter(id => (GameState.inventory[id] || 0) > 0);
        if (!owned.length) { Game.save(); return; }
        const victim = owned[Math.floor(Math.random() * owned.length)];
        Game.removeItem(victim, 1);
        GameState.vitreaLastBroken = { id: victim, ts: Date.now() };
        const itemName = (typeof iName === 'function') ? iName(victim) : victim;
        const blameJilji = jilji && Math.random() < 0.5;
        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            UI.notifyPanel('💥 ' + (lang === 'en'
                ? itemName + ' broke' + (blameJilji ? ' — Jiljí swears it slipped by itself.' : '.')
                : itemName + ' se rozbil' + (blameJilji ? ' — Jiljí přísahá, že to vyklouzlo samo.' : '.')), 'warning');
        }
        Game.addKronikaEntry('minor',
            '💥 Rozbil se kus vybavení: ' + itemName + (blameJilji ? '. Jiljí u toho byl. Samozřejmě.' : '.'),
            '💥 A piece of equipment broke: ' + itemName + (blameJilji ? '. Jiljí was there. Of course.' : '.'),
            '💥 Vas fractum est.');
        Game.save();
    },

    // ── HŘBITOV V1: mapová vizualizace (MRD hřbitov-vizuál-v1, 21.8.2026) ──
    CEMETERY_MAP_SLOTS: 17,
    CEMETERY_RECENT_DAYS: 30,
    CEMETERY_CHAPEL_RATIO: 0.5,

    // Souřadnice 17 slotů v 3 řadách pro rozbalené zobrazení
    CEMETERY_MAP_COORDS_EXPANDED: [
        { x: 80, y: 115 }, { x: 160, y: 115 }, { x: 240, y: 115 },
        { x: 420, y: 115 }, { x: 500, y: 115 }, { x: 580, y: 115 },
        { x: 80, y: 155 }, { x: 160, y: 155 }, { x: 240, y: 155 },
        { x: 420, y: 155 }, { x: 500, y: 155 }, { x: 580, y: 155 },
        { x: 80, y: 195 }, { x: 160, y: 195 }, { x: 240, y: 195 },
        { x: 440, y: 195 }, { x: 540, y: 195 }
    ],

    // Souřadnice 6 slotů pro náhledové (sbalené) zobrazení
    CEMETERY_MAP_COORDS_COLLAPSED: [
        { x: 80, y: 88 }, { x: 160, y: 88 }, { x: 240, y: 88 },
        { x: 420, y: 88 }, { x: 500, y: 88 }, { x: 580, y: 88 }
    ],

    _getCemeteryEnv: function () {
        let timeSlot = 'day';
        if (typeof HeaderImageSystem !== 'undefined' && HeaderImageSystem.getTimeSlot) {
            timeSlot = HeaderImageSystem.getTimeSlot();
        } else {
            const h = new Date().getHours();
            if (h >= 5 && h <= 9) timeSlot = 'morning';
            else if (h >= 10 && h <= 17) timeSlot = 'day';
            else if (h >= 18 && h <= 20) timeSlot = 'evening';
            else timeSlot = 'night';
        }

        let weatherCode = null;
        if (typeof WeatherSystem !== 'undefined' && WeatherSystem.cache && WeatherSystem.cache.current) {
            weatherCode = WeatherSystem.cache.current.weather_code;
        } else {
            try {
                const cached = localStorage.getItem('weather_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && parsed.data && parsed.data.current) {
                        weatherCode = parsed.data.current.weather_code;
                    }
                }
            } catch (e) { }
        }

        let condition = 'clear';
        if (typeof HeaderImageSystem !== 'undefined' && HeaderImageSystem.getWeatherCondition) {
            condition = HeaderImageSystem.getWeatherCondition(weatherCode);
        } else if (weatherCode !== null && weatherCode >= 51 && weatherCode <= 99) {
            condition = 'rain';
        }

        const isNight = timeSlot === 'night' || timeSlot === 'night-late';
        const isSnow = (weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86;
        const isCloudy = weatherCode === 2 || weatherCode === 3;
        const isFog = weatherCode >= 45 && weatherCode <= 48;

        return { timeSlot, weatherCode, condition, isNight, isSnow, isCloudy, isFog };
    },

    _getCemGraveSvg: function (cx, cy, built, isRecent, isNight, neglected, cond, ts) {
        let h = '';
        const moundColor = neglected ? '#3f382a' : '#4a3728';
        h += `<ellipse cx="${cx}" cy="${cy + 6}" rx="18" ry="5" fill="${moundColor}" opacity="0.8"/>`;

        if (built) {
            const stoneFill = neglected ? '#5c564c' : '#8c8275';
            const stoneStroke = neglected ? '#3a362e' : '#524b42';
            h += `<path d="M ${cx - 8} ${cy + 6} L ${cx - 8} ${cy - 8} A 8 8 0 0 1 ${cx + 8} ${cy - 8} L ${cx + 8} ${cy + 6} Z" fill="${stoneFill}" stroke="${stoneStroke}" stroke-width="0.8"/>`;
            h += `<path d="M ${cx} ${cy - 10} L ${cx} ${cy + 2} M ${cx - 4} ${cy - 6} L ${cx + 4} ${cy - 6}" stroke="#38332c" stroke-width="1.2" stroke-linecap="round"/>`;

            if (cond >= 70 && (ts % 2 === 0)) {
                h += `<circle cx="${cx - 9}" cy="${cy + 5}" r="2" fill="#ef4444"/>`;
                h += `<circle cx="${cx - 6}" cy="${cy + 7}" r="1.8" fill="#f59e0b"/>`;
                h += `<circle cx="${cx + 8}" cy="${cy + 6}" r="2" fill="#3b82f6"/>`;
            }
            if (neglected) {
                h += `<path d="M ${cx - 8} ${cy + 4} Q ${cx - 4} ${cy - 2} ${cx - 6} ${cy - 8}" stroke="#4a5d32" stroke-width="1.2" fill="none"/>`;
                h += `<circle cx="${cx - 6}" cy="${cy - 4}" r="1.5" fill="#5f7a3e"/>`;
            }
        } else {
            const crossStroke = neglected ? '#3a2a1a' : '#5c3a1e';
            const leanAngle = neglected && (ts % 3 === 0) ? 'transform="rotate(8 ' + cx + ' ' + (cy + 6) + ')"' : '';
            h += `<g ${leanAngle}>`;
            h += `<line x1="${cx}" y1="${cy + 7}" x2="${cx}" y2="${cy - 12}" stroke="${crossStroke}" stroke-width="2.5" stroke-linecap="round"/>`;
            h += `<line x1="${cx - 7}" y1="${cy - 5}" x2="${cx + 7}" y2="${cy - 5}" stroke="${crossStroke}" stroke-width="2.5" stroke-linecap="round"/>`;
            h += `</g>`;
        }

        const lit = isRecent || (isNight && (ts % 3 === 0));
        if (lit) {
            h += `<circle cx="${cx + 12}" cy="${cy + 2}" r="10" fill="#f59e0b" opacity="0.25"/>`;
            h += `<rect x="${cx + 11}" y="${cy + 2}" width="2.5" height="6" fill="#fef3c7" rx="0.5"/>`;
            h += `<ellipse cx="${cx + 12.25}" cy="${cy}" rx="1.5" ry="2.5" fill="#fbbf24"/>`;
            h += `<ellipse cx="${cx + 12.25}" cy="${cy}" rx="0.7" ry="1.2" fill="#ffffff"/>`;
        }

        return h;
    },

    renderCemeteryScene: function (cem, lang, isExpanded) {
        const env = this._getCemeteryEnv();
        const graves = cem.graves || [];
        const builtCount = graves.filter(g => g.nahrobek).length;
        const chapelOn = graves.length > 0 && (builtCount / graves.length) >= this.CEMETERY_CHAPEL_RATIO;
        const neglected = (cem.condition != null ? cem.condition : 100) < 40;
        const cond = cem.condition != null ? cem.condition : 100;
        const recentMs = this.CEMETERY_RECENT_DAYS * 24 * 60 * 60 * 1000;
        const now = Date.now();

        const viewBoxHeight = isExpanded ? 230 : 120;

        // Sky colors
        let skyTop = '#1d4ed8', skyBottom = '#93c5fd';
        if (env.isNight) { skyTop = '#070b19'; skyBottom = '#131d2e'; }
        else if (env.timeSlot === 'morning') { skyTop = '#210b1a'; skyBottom = '#f3c06d'; }
        else if (env.timeSlot === 'evening') { skyTop = '#1a1640'; skyBottom = '#f97316'; }
        else if (env.condition === 'rain') { skyTop = '#1b2430'; skyBottom = '#414f60'; }
        else if (env.isSnow) { skyTop = '#2d3748'; skyBottom = '#cbd5e1'; }
        else if (env.isCloudy) { skyTop = '#334155'; skyBottom = '#808ea0'; }

        // Ground colors
        let ground1 = '#415f2b', ground2 = '#2f461e';
        if (env.isNight) { ground1 = '#142217'; ground2 = '#0d170f'; }
        else if (env.isSnow) { ground1 = '#e2e8f0'; ground2 = '#cbd5e1'; }
        else if (env.timeSlot === 'morning' || env.timeSlot === 'evening') { ground1 = '#2e4320'; ground2 = '#1e2f15'; }

        // Path colors
        let pathColor = env.isNight ? '#332b23' : (env.isSnow ? '#9ca3af' : '#857255');

        // Celestial
        let celestialSvg = '';
        if (env.isNight) {
            celestialSvg = `
                <circle cx="560" cy="35" r="22" fill="#f8fafc" opacity="0.08"/>
                <circle cx="560" cy="35" r="14" fill="#f8fafc" opacity="0.15"/>
                <circle cx="560" cy="35" r="10" fill="#f1f5f9"/>
                <circle cx="564" cy="33" r="8.5" fill="url(#cemSky)"/>
            `;
        } else if (env.timeSlot === 'morning') {
            celestialSvg = `<circle cx="110" cy="65" r="28" fill="#fde047" opacity="0.15"/><circle cx="110" cy="65" r="14" fill="#fef08a"/>`;
        } else if (env.timeSlot === 'evening') {
            celestialSvg = `<circle cx="570" cy="65" r="28" fill="#f97316" opacity="0.2"/><circle cx="570" cy="65" r="14" fill="#fdba74"/>`;
        } else if (env.condition !== 'rain' && !env.isCloudy) {
            celestialSvg = `<circle cx="580" cy="32" r="30" fill="#fde047" opacity="0.2"/><circle cx="580" cy="32" r="15" fill="#fef08a"/>`;
        }

        // Stars
        const starCoords = [
            { x: 30, y: 12 }, { x: 80, y: 25 }, { x: 140, y: 15 }, { x: 210, y: 30 },
            { x: 270, y: 10 }, { x: 320, y: 22 }, { x: 390, y: 14 }, { x: 450, y: 28 },
            { x: 500, y: 12 }, { x: 530, y: 32 }, { x: 590, y: 18 }, { x: 640, y: 25 }
        ];
        const starsSvg = env.isNight ? starCoords.map((s, idx) =>
            `<circle cx="${s.x}" cy="${s.y}" r="${(idx % 3 === 0 ? 1.5 : 1)}" fill="#ffffff" opacity="${0.4 + (idx % 5) * 0.12}"/>`
        ).join('') : '';

        // Clouds
        const cloudsSvg = (!env.isNight && (env.isCloudy || env.condition === 'rain' || env.timeSlot === 'day')) ? `
            <path d="M 120 30 Q 135 18 155 25 Q 170 18 185 28 Q 200 25 205 35 Q 210 45 195 48 H 115 Q 105 40 120 30 Z" fill="${env.condition === 'rain' ? 'rgba(51, 65, 85, 0.7)' : 'rgba(255, 255, 255, 0.7)'}"/>
            <path d="M 440 22 Q 455 12 475 18 Q 490 10 505 20 Q 520 18 525 28 Q 530 38 515 42 H 435 Q 425 32 440 22 Z" fill="${env.condition === 'rain' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(255, 255, 255, 0.6)'}"/>
        ` : '';

        // Weather effects
        let weatherOverlay = '';
        if (env.condition === 'rain') {
            for (let r = 0; r < 24; r++) {
                const rx = (r * 29) % 670 + 5;
                const ry = (r * 11) % 180 + 10;
                weatherOverlay += `<line x1="${rx}" y1="${ry}" x2="${rx - 6}" y2="${ry + 18}" stroke="rgba(186, 230, 253, 0.45)" stroke-width="1.2"/>`;
            }
        } else if (env.isSnow) {
            for (let s = 0; s < 28; s++) {
                const sx = (s * 23) % 670 + 5;
                const sy = (s * 13) % 180 + 10;
                weatherOverlay += `<circle cx="${sx}" cy="${sy}" r="${(s % 2 === 0 ? 1.8 : 1.2)}" fill="#ffffff" opacity="0.85"/>`;
            }
        } else if (env.isFog) {
            weatherOverlay += `<rect x="0" y="60" width="680" height="60" fill="#e2e8f0" opacity="0.25"/>`;
        }

        // Chapel
        const windowGlow = (env.isNight || env.condition === 'rain') ? `
            <circle cx="340" cy="42" r="16" fill="#f59e0b" opacity="0.35"/>
            <rect x="334" y="32" width="12" height="20" rx="6" fill="#fbbf24"/>
        ` : `
            <rect x="334" y="32" width="12" height="20" rx="6" fill="#60a5fa" opacity="0.7"/>
        `;

        const chapelSvg = `
            <g id="cemChapel">
                <!-- Chapel base structure -->
                <rect x="308" y="38" width="64" height="42" fill="${env.isNight ? '#221b15' : '#4a423a'}" stroke="${env.isNight ? '#14100c' : '#2e2924'}"/>
                <!-- Roof -->
                <path d="M 302 38 L 340 14 L 378 38 Z" fill="${env.isNight ? '#17130f' : '#2b2520'}"/>
                ${env.isSnow ? `<path d="M 300 38 L 340 12 L 380 38 Q 340 18 300 38 Z" fill="#f8fafc"/>` : ''}
                <!-- Spire cross -->
                <line x1="340" y1="5" x2="340" y2="14" stroke="#c5a059" stroke-width="2"/>
                <line x1="335" y1="8" x2="345" y2="8" stroke="#c5a059" stroke-width="2"/>
                <!-- Door -->
                <path d="M 330 80 V 58 A 10 10 0 0 1 350 58 V 80 Z" fill="${env.isNight ? '#0d0a08' : '#241b14'}"/>
                <!-- Window -->
                ${windowGlow}
                <!-- Window grid -->
                <line x1="340" y1="32" x2="340" y2="52" stroke="#2e2924" stroke-width="1"/>
                <line x1="334" y1="42" x2="346" y2="42" stroke="#2e2924" stroke-width="1"/>
            </g>
        `;

        // Wall & Trees
        const wallSvg = `
            <rect x="0" y="72" width="680" height="12" fill="${env.isNight ? '#1d1712' : '#574d42'}"/>
            <rect x="0" y="70" width="680" height="3" fill="${env.isNight ? '#2e251d' : '#73675a'}"/>
            <rect x="302" y="66" width="8" height="20" fill="${env.isNight ? '#14100c' : '#423a31'}"/>
            <rect x="370" y="66" width="8" height="20" fill="${env.isNight ? '#14100c' : '#423a31'}"/>
            <path d="M 312 72 V 86 M 318 70 V 86 M 324 72 V 86 M 356 72 V 86 M 362 70 V 86 M 368 72 V 86" stroke="${env.isNight ? '#0a0806' : '#26201a'}" stroke-width="1.5"/>
        `;

        const treesSvg = `
            <path d="M 65 82 L 68 30 Q 52 48 42 82 Z" fill="${env.isNight ? '#0f1c12' : '#2d4520'}"/>
            <path d="M 68 30 Q 82 48 74 82 Z" fill="${env.isNight ? '#0a140c' : '#223818'}"/>
            <rect x="64" y="78" width="8" height="16" fill="#38281a"/>
            
            <path d="M 615 82 Q 598 52 620 25 Q 645 52 635 82 Z" fill="${env.isNight ? '#0f1c12' : '#2d4520'}"/>
            <rect x="622" y="78" width="8" height="16" fill="#38281a"/>
        `;

        // Mounds & Grave Markers
        const coords = isExpanded ? this.CEMETERY_MAP_COORDS_EXPANDED : this.CEMETERY_MAP_COORDS_COLLAPSED;
        const slotsCount = isExpanded ? this.CEMETERY_MAP_SLOTS : 6;
        const shown = graves.slice().reverse().slice(0, slotsCount);

        let gravesSvg = '';
        shown.forEach((g, i) => {
            const c = coords[i];
            if (!c) return;
            const isRecent = (now - g.ts) < recentMs;
            gravesSvg += this._getCemGraveSvg(c.x, c.y, !!g.nahrobek, isRecent, env.isNight, neglected, cond, g.ts);
        });

        // Path
        const pathSvg = `<polygon points="325,78 355,78 ${isExpanded ? '380,230 300,230' : '370,120 310,120'}" fill="${pathColor}" opacity="0.8"/>`;

        return `
            <svg width="100%" viewBox="0 0 680 ${viewBoxHeight}" role="img" style="display:block; border-radius:8px 8px 0 0;">
                <defs>
                    <linearGradient id="cemSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${skyTop}"/>
                        <stop offset="100%" stop-color="${skyBottom}"/>
                    </linearGradient>
                    <linearGradient id="cemGround" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${ground1}"/>
                        <stop offset="100%" stop-color="${ground2}"/>
                    </linearGradient>
                </defs>

                <!-- Sky Background -->
                <rect x="0" y="0" width="680" height="${viewBoxHeight}" fill="url(#cemSky)"/>
                ${starsSvg}
                ${celestialSvg}
                ${cloudsSvg}
                ${weatherOverlay}

                <!-- Architecture & Wall -->
                ${wallSvg}
                ${chapelSvg}
                ${treesSvg}

                <!-- Ground -->
                <rect x="0" y="78" width="680" height="${viewBoxHeight - 78}" fill="url(#cemGround)"/>
                ${pathSvg}

                <!-- Graves -->
                ${gravesSvg}
            </svg>
        `;
    },
};
