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
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(grose, { title: lang === 'en' ? 'Pilgrims' : 'Poutníci', source: lang === 'en' ? 'Pilgrims' : 'Poutníci', source_en: 'Pilgrims' });
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
                            CellariumSystem.addGrose(5 + Math.floor(Math.random() * 10), { title: lang === 'en' ? 'Wedding' : 'Svatba', source: lang === 'en' ? 'Parish' : 'Farnost', source_en: 'Parish' });
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
            const kEff = Game.conversiEfficiency(cleaner); // TECH DEBT #24 — Oblát rampa
            if (cleaner) cleaner.fatigue = Math.min(100, cleaner.fatigue + 5);
            if (kostelBrother) {
                Game.dormitoriumAddXp(kostelBrother, 'kostel');
                kostelBrother.fatigue = Math.min(100, (kostelBrother.fatigue || 0) + 5);
            }
            // Nezaučený Oblát odvede horší práci — kEff<1 zkrátí cleanUntil,
            // kostel se zašpiní dřív. Stejná pozice jako brotherMult, jen
            // násobí totéž trvání dolů místo nahoru.
            t.cleanUntil = now + Math.round(48 * 60 * 60 * 1000 * brotherMult * kEff);
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
            const kEff = Game.conversiEfficiency(cemCleaner); // TECH DEBT #24 — Oblát rampa
            if (cemCleaner) cemCleaner.fatigue = Math.min(100, cemCleaner.fatigue + 5);
            if (templumBrother) {
                Game.dormitoriumAddXp(templumBrother, 'kostel');
                templumBrother.fatigue = Math.min(100, (templumBrother.fatigue || 0) + 5);
            }
            cem.condition = Math.min(100, cem.condition + 5 * brotherMult * kEff);
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

    // Souřadnice 17 slotů v organických medieval řadách pro rozbalené zobrazení
    CEMETERY_MAP_COORDS_EXPANDED: [
        // Levá strana (organické medieval rozložení)
        { x: 72,  y: 110, tilt: -6 }, { x: 158, y: 118, tilt: 4 },  { x: 242, y: 112, tilt: -9 },
        { x: 88,  y: 152, tilt: 7 },  { x: 172, y: 144, tilt: -5 }, { x: 232, y: 158, tilt: 8 },
        { x: 68,  y: 198, tilt: -11 },{ x: 152, y: 190, tilt: 6 },  { x: 244, y: 202, tilt: -4 },
        
        // Pravá strana (organické medieval rozložení)
        { x: 418, y: 112, tilt: 5 },  { x: 504, y: 116, tilt: -7 }, { x: 588, y: 108, tilt: 8 },
        { x: 428, y: 156, tilt: -8 }, { x: 512, y: 146, tilt: 6 },  { x: 582, y: 160, tilt: -10 },
        { x: 412, y: 194, tilt: 9 },  { x: 498, y: 204, tilt: -5 }
    ],

    // Souřadnice 6 slotů pro náhledové (sbalené) zobrazení - organické rozložení
    CEMETERY_MAP_COORDS_COLLAPSED: [
        { x: 75,  y: 86,  tilt: -5 }, 
        { x: 162, y: 92,  tilt: 6 }, 
        { x: 238, y: 84,  tilt: -8 },
        { x: 422, y: 90,  tilt: 7 }, 
        { x: 508, y: 83,  tilt: -4 }, 
        { x: 582, y: 93,  tilt: 8 }
    ],

    _getCemeteryEnv: function () {
        let timeSlot = 'day';
        if (typeof HeaderImageSystem !== 'undefined' && HeaderImageSystem.getTimeSlot) {
            timeSlot = HeaderImageSystem.getTimeSlot();
        } else {
            const h = (typeof TimeSys !== 'undefined' && TimeSys.gameHour) ? TimeSys.gameHour() : new Date().getHours();
            if (h >= 5 && h <= 9) timeSlot = 'morning';
            else if (h >= 10 && h <= 17) timeSlot = 'day';
            else if (h >= 18 && h <= 20) timeSlot = 'evening';
            else timeSlot = 'night';
        }

        // Desetinna herni hodina (Europe/Prague, TimeSys — dle kanonickeho pravidla
        // hodin) pro plynulou drahu slunce/mesice po obloze (bugfix 30.8.2026 —
        // driv 4 pevne pozice dle hruby timeSlot kosiku, v poledne sedelo slunce
        // u prave zdi misto uprostred).
        let hourFrac;
        if (typeof TimeSys !== 'undefined' && TimeSys.gameHour) {
            hourFrac = TimeSys.gameHour(true);
        } else {
            const now = new Date();
            hourFrac = now.getHours() + now.getMinutes() / 60;
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

        return { timeSlot, hourFrac, weatherCode, condition, isNight, isSnow, isCloudy, isFog };
    },

    _getCemGraveSvg: function (cx, cy, built, isRecent, isNight, overallNeglected, cond, ts, slotTilt, idx) {
        let h = '';
        const index = idx != null ? idx : 0;
        const timestamp = ts != null ? ts : 0;
        
        // Individual grave neglect logic (authentic medieval variation)
        const isGraveNeglected = overallNeglected || (index % 3 === 1) || (cond < 75 && index % 2 === 0);
        const tiltAngle = slotTilt != null ? slotTilt : (((timestamp + index) % 17) - 8);

        // Ground base variation (6 distinct medieval styles) — derived from the grave's own
        // timestamp only (NOT array index), so the style stays stable as new graves are added
        // and older graves shift position in the displayed list (bugfix 30.8.2026).
        const groundStyle = Math.abs(timestamp) % 6;
        // Marker variation (6 distinct cross/headstone styles) — same stability fix, different
        // divisor to decorrelate from groundStyle.
        const markerStyle = Math.abs(Math.floor(timestamp / 7)) % 6;

        // Base ground shadow (soft ellipse on grass)
        h += `<ellipse cx="${cx + 1}" cy="${cy + 7}" rx="18" ry="6" fill="${isNight ? '#050a06' : '#121a0d'}" opacity="0.45"/>`;

        // --- GROUND BASE STYLES ---
        if (groundStyle === 0) {
            // Style 0: Stone Frame & Curb (Kamenná obruba)
            const stoneBorder = isGraveNeglected ? '#302a22' : '#4a4238';
            const earthFill = isGraveNeglected ? '#261f17' : '#3d3023';
            h += `<rect x="${cx - 15}" y="${cy + 2}" width="30" height="9" fill="${stoneBorder}" rx="1"/>`;
            h += `<rect x="${cx - 13}" y="${cy + 3.5}" width="26" height="6" fill="${earthFill}" rx="0.5"/>`;
            // Subtle stone corner joints
            h += `<line x1="${cx - 13}" y1="${cy + 2}" x2="${cx - 13}" y2="${cy + 11}" stroke="#1f1a14" stroke-width="0.8"/>`;
            h += `<line x1="${cx + 13}" y1="${cy + 2}" x2="${cx + 13}" y2="${cy + 11}" stroke="#1f1a14" stroke-width="0.8"/>`;
        } else if (groundStyle === 1) {
            // Style 1: Natural Earth Mound with Moss Patch (Přírodní hliněný rov s mechem)
            const moundColor = isGraveNeglected ? '#382c1e' : '#4a3826';
            const moundShadow = isGraveNeglected ? '#211810' : '#2d1f14';
            h += `<ellipse cx="${cx}" cy="${cy + 6}" rx="17" ry="5" fill="${moundShadow}"/>`;
            h += `<ellipse cx="${cx}" cy="${cy + 4.5}" rx="15" ry="4" fill="${moundColor}"/>`;
            // Subtle moss or earth highlight on mound
            if (isGraveNeglected) {
                h += `<ellipse cx="${cx - 5}" cy="${cy + 4}" rx="4" ry="1.5" fill="#3b4d24" opacity="0.7"/>`;
            } else {
                h += `<ellipse cx="${cx + 4}" cy="${cy + 4}" rx="5" ry="1.8" fill="#59432d" opacity="0.6"/>`;
            }
        } else if (groundStyle === 2) {
            // Style 2: Flat Stone Cover Slab (Kamenná krycí deska)
            const slabColor = isGraveNeglected ? '#3d3730' : '#524a40';
            const slabSide = isGraveNeglected ? '#24201b' : '#332e28';
            h += `<polygon points="${cx - 15},${cy + 3} ${cx + 13},${cy + 3} ${cx + 16},${cy + 8} ${cx - 12},${cy + 8}" fill="${slabColor}" stroke="#1e1a16" stroke-width="0.8"/>`;
            h += `<polygon points="${cx - 12},${cy + 8} ${cx + 16},${cy + 8} ${cx + 16},${cy + 9.5} ${cx - 12},${cy + 9.5}" fill="${slabSide}"/>`;
            // Engraved cross outline on ground slab
            h += `<line x1="${cx - 4}" y1="${cy + 5.5}" x2="${cx + 6}" y2="${cy + 5.5}" stroke="#24201b" stroke-width="0.8"/>`;
            h += `<line x1="${cx + 1}" y1="${cy + 4}" x2="${cx + 1}" y2="${cy + 7}" stroke="#24201b" stroke-width="0.8"/>`;
        } else if (groundStyle === 3) {
            // Style 3: Weathered Wooden Board Frame (Dřevěná ohrádka)
            const woodColor = isGraveNeglected ? '#2b1e13' : '#45301e';
            const woodStroke = isGraveNeglected ? '#1a110a' : '#291b10';
            h += `<rect x="${cx - 14}" y="${cy + 2.5}" width="28" height="8" fill="${woodColor}" stroke="${woodStroke}" stroke-width="1.2" rx="0.5"/>`;
            h += `<rect x="${cx - 12}" y="${cy + 4}" width="24" height="5" fill="#38291a"/>`;
            // Wooden corner stakes
            h += `<rect x="${cx - 14}" y="${cy + 1.5}" width="2.5" height="10" fill="#24170d"/>`;
            h += `<rect x="${cx + 11.5}" y="${cy + 1.5}" width="2.5" height="10" fill="#24170d"/>`;
        } else if (groundStyle === 4) {
            // Style 4: Old Sunken / Overgrown Plot (Zarostlý splynutý rov)
            h += `<ellipse cx="${cx}" cy="${cy + 5.5}" rx="14" ry="3.5" fill="#2d3f1d" opacity="0.6"/>`;
            h += `<ellipse cx="${cx - 2}" cy="${cy + 5}" rx="10" ry="2.5" fill="#36291c" opacity="0.5"/>`;
            // Wild grass blades
            h += `<path d="M ${cx - 8} ${cy + 6} Q ${cx - 6} ${cy + 1} ${cx - 4} ${cy + 5}" stroke="#3b5224" stroke-width="1.2" fill="none"/>`;
            h += `<path d="M ${cx + 5} ${cy + 6} Q ${cx + 7} ${cy + 1} ${cx + 9} ${cy + 5}" stroke="#3b5224" stroke-width="1.2" fill="none"/>`;
        } else {
            // Style 5: Gravel & Fieldstone Border (Štěrkové pole s polními kameny)
            h += `<ellipse cx="${cx}" cy="${cy + 5.5}" rx="15" ry="4.5" fill="#3b342c"/>`;
            // Fieldstone pebbles along edge
            h += `<circle cx="${cx - 13}" cy="${cy + 5}" r="2" fill="#595147"/>`;
            h += `<circle cx="${cx - 8}" cy="${cy + 8}" r="1.8" fill="#474037"/>`;
            h += `<circle cx="${cx + 2}" cy="${cy + 8.5}" r="1.6" fill="#524a41"/>`;
            h += `<circle cx="${cx + 10}" cy="${cy + 7}" r="2.2" fill="#403931"/>`;
            h += `<circle cx="${cx + 13}" cy="${cy + 4}" r="1.7" fill="#5e554a"/>`;
        }

        // Tended / Neglected detail overlays (natural medieval greenery, no bright artificial circles)
        if (isGraveNeglected) {
            // Wild weed / moss tufts on neglected graves
            h += `<path d="M ${cx - 9} ${cy + 6} Q ${cx - 7} ${cy - 1} ${cx - 5} ${cy + 5}" stroke="#2e3f1b" stroke-width="1.2" fill="none"/>`;
            h += `<path d="M ${cx + 6} ${cy + 6} Q ${cx + 8} ${cy} ${cx + 10} ${cy + 5}" stroke="#2e3f1b" stroke-width="1.2" fill="none"/>`;
        } else if (cond >= 70 && index % 3 === 0) {
            // Tended quiet wildflower sprig (subtle, natural)
            h += `<path d="M ${cx + 8} ${cy + 6} Q ${cx + 11} ${cy + 2} ${cx + 12} ${cy + 5}" stroke="#3d5225" stroke-width="1" fill="none"/>`;
            h += `<circle cx="${cx + 12}" cy="${cy + 2}" r="1.2" fill="#fef08a"/>`;
        }

        // --- MARKER / CROSS TRANSFORM ---
        const markerTransform = `transform="rotate(${tiltAngle} ${cx} ${cy + 5})"`;
        h += `<g ${markerTransform}>`;

        // Marker Base Ground Shadow
        h += `<ellipse cx="${cx + 1}" cy="${cy + 5.5}" rx="8" ry="3" fill="#000000" opacity="0.35"/>`;

        if (built) {
            // Stone Headstone Variations
            const stoneFill = isGraveNeglected ? '#464038' : 'url(#cemStoneGrad)';
            const stoneStroke = isGraveNeglected ? '#2b2620' : '#453d34';
            
            if (markerStyle === 0 || markerStyle === 1) {
                // Style A: Classic Gothic Arched Stone Slab
                h += `<path d="M ${cx - 8} ${cy + 5} L ${cx - 8} ${cy - 11} A 8 8 0 0 1 ${cx + 8} ${cy - 11} L ${cx + 8} ${cy + 5} Z" fill="${stoneFill}" stroke="${stoneStroke}" stroke-width="1"/>`;
                if (!isGraveNeglected) {
                    h += `<path d="M ${cx - 7} ${cy + 4} L ${cx - 7} ${cy - 10} A 7 7 0 0 1 ${cx + 6} ${cy - 10}" stroke="#c5b9a8" stroke-width="0.8" fill="none" opacity="0.5"/>`;
                }
                // Engraved Cross Relief
                h += `<path d="M ${cx} ${cy - 13} L ${cx} ${cy} M ${cx - 4.5} ${cy - 8.5} L ${cx + 4.5} ${cy - 8.5}" stroke="#29241f" stroke-width="1.4" stroke-linecap="round"/>`;
            } else if (markerStyle === 2 || markerStyle === 3) {
                // Style B: Peaked / Gabled Stele Stone
                h += `<path d="M ${cx - 8} ${cy + 5} L ${cx - 8} ${cy - 8} L ${cx} ${cy - 16} L ${cx + 8} ${cy - 8} L ${cx + 8} ${cy + 5} Z" fill="${stoneFill}" stroke="${stoneStroke}" stroke-width="1"/>`;
                h += `<path d="M ${cx - 7} ${cy - 7.5} L ${cx} ${cy - 14.5} L ${cx + 7} ${cy - 7.5}" stroke="#363028" stroke-width="0.8" fill="none"/>`;
                h += `<text x="${cx}" y="${cy - 2}" font-family="serif" font-size="5" font-weight="bold" fill="#29241f" text-anchor="middle">R.I.P.</text>`;
            } else {
                // Style C: Raised Stone Pedestal / Slab
                h += `<polygon points="${cx - 11},${cy + 3} ${cx + 10},${cy + 3} ${cx + 13},${cy + 6} ${cx - 8},${cy + 6}" fill="${stoneFill}" stroke="${stoneStroke}" stroke-width="1"/>`;
                h += `<polygon points="${cx - 11},${cy + 3} ${cx + 10},${cy + 3} ${cx + 10},${cy + 0.5} ${cx - 11},${cy + 0.5}" fill="#5a5248" stroke="${stoneStroke}" stroke-width="0.8"/>`;
                h += `<line x1="${cx - 4}" y1="${cy + 1.8}" x2="${cx + 4}" y2="${cy + 1.8}" stroke="#29241f" stroke-width="1"/>`;
            }

            if (isGraveNeglected) {
                // Creeping ivy on headstone
                h += `<path d="M ${cx - 8} ${cy + 3} Q ${cx - 4} ${cy - 4} ${cx - 6} ${cy - 11}" stroke="#4a5d32" stroke-width="1.2" fill="none"/>`;
                h += `<circle cx="${cx - 6}" cy="${cy - 6}" r="1.5" fill="#5f7a3e"/>`;
            }
        } else {
            // Wooden Cross Styles
            const crossStroke = isGraveNeglected ? '#332418' : '#5c3d20';
            const crossHighlight = isGraveNeglected ? '#453222' : '#80562e';
            
            if (markerStyle === 4) {
                // Style D: Celtic Ringed Cross
                h += `<circle cx="${cx}" cy="${cy - 7}" r="4.2" fill="none" stroke="${crossStroke}" stroke-width="1.5"/>`;
                h += `<line x1="${cx}" y1="${cy + 6}" x2="${cx}" y2="${cy - 15}" stroke="${crossStroke}" stroke-width="3" stroke-linecap="square"/>`;
                h += `<line x1="${cx - 0.5}" y1="${cy + 5}" x2="${cx - 0.5}" y2="${cy - 14.5}" stroke="${crossHighlight}" stroke-width="1" stroke-linecap="square"/>`;
                h += `<line x1="${cx - 7}" y1="${cy - 7}" x2="${cx + 7}" y2="${cy - 7}" stroke="${crossStroke}" stroke-width="3" stroke-linecap="square"/>`;
            } else if (markerStyle === 2) {
                // Style E: Weathered Timber Cross with Twine Binding
                h += `<line x1="${cx}" y1="${cy + 6}" x2="${cx}" y2="${cy - 14}" stroke="${crossStroke}" stroke-width="3.2" stroke-linecap="square"/>`;
                h += `<line x1="${cx - 6.5}" y1="${cy - 6.5}" x2="${cx + 6.5}" y2="${cy - 6.5}" stroke="${crossStroke}" stroke-width="3" stroke-linecap="square"/>`;
                // Twine rope cross binding
                h += `<line x1="${cx - 2.5}" y1="${cy - 9}" x2="${cx + 2.5}" y2="${cy - 4}" stroke="#a38259" stroke-width="1"/>`;
                h += `<line x1="${cx - 2.5}" y1="${cy - 4}" x2="${cx + 2.5}" y2="${cy - 9}" stroke="#a38259" stroke-width="1"/>`;
            } else {
                // Style F: Standard Medieval Oak Cross
                h += `<line x1="${cx}" y1="${cy + 6}" x2="${cx}" y2="${cy - 14}" stroke="${crossStroke}" stroke-width="3" stroke-linecap="square"/>`;
                h += `<line x1="${cx - 0.5}" y1="${cy + 5}" x2="${cx - 0.5}" y2="${cy - 13.5}" stroke="${crossHighlight}" stroke-width="1" stroke-linecap="square"/>`;
                h += `<line x1="${cx - 7}" y1="${cy - 7}" x2="${cx + 7}" y2="${cy - 7}" stroke="${crossStroke}" stroke-width="3" stroke-linecap="square"/>`;
                h += `<line x1="${cx - 6.5}" y1="${cy - 7.5}" x2="${cx + 6.5}" y2="${cy - 7.5}" stroke="${crossHighlight}" stroke-width="1" stroke-linecap="square"/>`;
                h += `<circle cx="${cx}" cy="${cy - 7}" r="1.2" fill="#1c130b"/>`;
            }
        }
        h += `</g>`;

        // Votive Candle / Svíčka (lit for recent or tended graves at night)
        const lit = !isGraveNeglected && (isRecent || (isNight && (timestamp % 2 === 0)));
        if (lit) {
            const candleX = cx + 11;
            const candleY = cy + 1;
            
            // Soft Radial Outer Glow
            h += `<circle cx="${candleX}" cy="${candleY - 1}" r="14" fill="url(#cemCandleGlow)" opacity="${isNight ? '0.8' : '0.45'}"/>`;
            // Glass Votive Jar
            h += `<rect x="${candleX - 2.5}" y="${candleY + 1}" width="5" height="6.5" fill="#dc2626" opacity="0.85" rx="1"/>`;
            h += `<rect x="${candleX - 2}" y="${candleY + 1.5}" width="1.5" height="5.5" fill="#fca5a5" opacity="0.4" rx="0.5"/>`;
            // Candle Flame
            h += `<ellipse cx="${candleX}" cy="${candleY - 1}" rx="1.6" ry="2.8" fill="#fbbf24"/>`;
            h += `<ellipse cx="${candleX}" cy="${candleY - 1}" rx="0.8" ry="1.6" fill="#ffffff"/>`;
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
        let skyTop = '#13284c', skyMid = '#1e3a8a', skyBottom = '#93c5fd';
        if (env.isNight) { skyTop = '#050b1a'; skyMid = '#0d182e'; skyBottom = '#1a273c'; }
        else if (env.timeSlot === 'morning') { skyTop = '#1a0927'; skyMid = '#6b1c43'; skyBottom = '#f59e0b'; }
        else if (env.timeSlot === 'evening') { skyTop = '#0f0c29'; skyMid = '#4a154b'; skyBottom = '#ea580c'; }
        else if (env.condition === 'rain') { skyTop = '#111827'; skyMid = '#1f2937'; skyBottom = '#4b5563'; }
        else if (env.isSnow) { skyTop = '#1e293b'; skyMid = '#334155'; skyBottom = '#94a3b8'; }
        else if (env.isCloudy) { skyTop = '#1e293b'; skyMid = '#475569'; skyBottom = '#94a3b8'; }

        // Ground colors
        let ground1 = '#385723', ground2 = '#233b15';
        if (env.isNight) { ground1 = '#101d13'; ground2 = '#08110a'; }
        else if (env.isSnow) { ground1 = '#e2e8f0'; ground2 = '#cbd5e1'; }
        else if (env.timeSlot === 'morning' || env.timeSlot === 'evening') { ground1 = '#283b1c'; ground2 = '#172710'; }

        // Path colors
        let pathColor = env.isNight ? '#2a221b' : (env.isSnow ? '#94a3b8' : '#736048');

        // Celestial (Sun / Moon) — plynula draha po obloze dle presne herni
        // hodiny (env.hourFrac), NE 4 pevne pozice dle hruby timeSlot kosiku
        // (bugfix 30.8.2026 — v poledne sedelo slunce u prave zdi misto
        // uprostred nad kapli). Vychod ~5h, poledne ~12:30 (vrchol uprostred),
        // zapad ~20h.
        let celestialSvg = '';
        const sunriseH = 5, sunsetH = 20, dayLen = sunsetH - sunriseH, nightLen = 24 - dayLen;
        if (env.isNight) {
            const nightHour = env.hourFrac >= sunsetH ? env.hourFrac - sunsetH : env.hourFrac + (24 - sunsetH);
            const tn = Math.max(0, Math.min(1, nightHour / nightLen));
            const moonX = 60 + tn * 560;
            const moonY = 15 + (1 - Math.sin(tn * Math.PI)) * 53;
            celestialSvg = `
                <!-- Moon Glow -->
                <circle cx="${moonX}" cy="${moonY}" r="28" fill="#f8fafc" opacity="0.06"/>
                <circle cx="${moonX}" cy="${moonY}" r="18" fill="#f8fafc" opacity="0.12"/>
                <circle cx="${moonX}" cy="${moonY}" r="11" fill="#f1f5f9"/>
                <circle cx="${moonX + 5}" cy="${moonY - 3}" r="9.5" fill="url(#cemSky)"/>
            `;
        } else if (env.condition !== 'rain' && !env.isCloudy) {
            const t = Math.max(0, Math.min(1, (env.hourFrac - sunriseH) / dayLen));
            const sunX = 60 + t * 560;
            const sunY = 15 + (1 - Math.sin(t * Math.PI)) * 53;
            let core = '#ffffff', glowOuter = '#fde047', glowMid = '#fef08a';
            if (env.timeSlot === 'morning') { core = '#fef9c3'; glowOuter = '#fde047'; glowMid = '#fef08a'; }
            else if (env.timeSlot === 'evening') { core = '#ffedd5'; glowOuter = '#f97316'; glowMid = '#fdba74'; }
            celestialSvg = `
                <circle cx="${sunX}" cy="${sunY}" r="36" fill="${glowOuter}" opacity="0.2"/>
                <circle cx="${sunX}" cy="${sunY}" r="20" fill="${glowMid}" opacity="0.4"/>
                <circle cx="${sunX}" cy="${sunY}" r="12" fill="${core}"/>
            `;
        }

        // Stars Field (Night only)
        const starCoords = [
            { x: 25, y: 10 }, { x: 75, y: 22 }, { x: 135, y: 12 }, { x: 195, y: 28 },
            { x: 255, y: 8 },  { x: 315, y: 18 }, { x: 385, y: 10 }, { x: 445, y: 24 },
            { x: 495, y: 8 },  { x: 525, y: 28 }, { x: 595, y: 14 }, { x: 645, y: 22 },
            { x: 160, y: 34 }, { x: 410, y: 35 }, { x: 620, y: 38 }
        ];
        const starsSvg = env.isNight ? starCoords.map((s, idx) =>
            `<circle cx="${s.x}" cy="${s.y}" r="${(idx % 4 === 0 ? 1.5 : 1)}" fill="#ffffff" opacity="${0.35 + (idx % 5) * 0.14}"/>`
        ).join('') : '';

        // Clouds
        const cloudsSvg = (!env.isNight && (env.isCloudy || env.condition === 'rain' || env.timeSlot === 'day')) ? `
            <path d="M 110 32 Q 130 18 155 24 Q 175 16 195 26 Q 215 22 220 34 Q 225 46 205 48 H 105 Q 95 38 110 32 Z" fill="${env.condition === 'rain' ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.65)'}"/>
            <path d="M 430 24 Q 450 12 475 18 Q 495 8 515 20 Q 535 16 540 28 Q 545 40 525 44 H 425 Q 415 32 430 24 Z" fill="${env.condition === 'rain' ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.55)'}"/>
        ` : '';

        // Atmospheric Weather Overlays & Particles
        let weatherOverlay = '';
        if (env.condition === 'rain') {
            for (let r = 0; r < 28; r++) {
                const rx = (r * 25) % 670 + 5;
                const ry = (r * 13) % 180 + 8;
                weatherOverlay += `<line x1="${rx}" y1="${ry}" x2="${rx - 7}" y2="${ry + 20}" stroke="rgba(186, 230, 253, 0.4)" stroke-width="1.2"/>`;
            }
        } else if (env.isSnow) {
            for (let s = 0; s < 32; s++) {
                const sx = (s * 21) % 670 + 5;
                const sy = (s * 15) % 180 + 8;
                weatherOverlay += `<circle cx="${sx}" cy="${sy}" r="${(s % 3 === 0 ? 2 : 1.2)}" fill="#ffffff" opacity="0.85"/>`;
            }
        } else if (env.isFog) {
            weatherOverlay += `
                <rect x="0" y="55" width="680" height="70" fill="url(#cemFogGrad)" opacity="0.65"/>
            `;
        } else if (env.isNight) {
            // Fireflies on clear warm nights
            const fireflyCoords = [
                { x: 120, y: 95 }, { x: 220, y: 110 }, { x: 450, y: 100 },
                { x: 530, y: 115 }, { x: 180, y: 140 }, { x: 490, y: 150 }
            ];
            weatherOverlay += fireflyCoords.map(f => `
                <circle cx="${f.x}" cy="${f.y}" r="6" fill="#fbbf24" opacity="0.15"/>
                <circle cx="${f.x}" cy="${f.y}" r="1.5" fill="#fef08a"/>
            `).join('');
        }

        // Chapel Architecture (Positioned with proper upper edge padding & distinct window/door separation)
        const windowGlow = (env.isNight || env.condition === 'rain' || env.timeSlot === 'evening') ? `
            <!-- Light Spill Cone -->
            <polygon points="340,49 310,78 370,78" fill="url(#cemWindowSpill)" opacity="0.6"/>
            <!-- Window Glow -->
            <circle cx="340" cy="46" r="12" fill="#f59e0b" opacity="0.4"/>
            <path d="M 334 50 V 43 A 6 6 0 0 1 346 43 V 50 Z" fill="#fbbf24"/>
        ` : `
            <path d="M 334 50 V 43 A 6 6 0 0 1 346 43 V 50 Z" fill="#60a5fa" opacity="0.75"/>
        `;

        const chapelSvg = `
            <g id="cemChapel">
                <!-- Main Chapel Body (Wider & Taller stone facade) -->
                <rect x="296" y="38" width="88" height="40" fill="${env.isNight ? '#1e1814' : '#473d34'}" stroke="${env.isNight ? '#100c09' : '#2b231c'}" stroke-width="1"/>
                <!-- Quoins / Corner stones -->
                <rect x="296" y="38" width="4" height="6" fill="#2d261f"/>
                <rect x="296" y="48" width="4" height="6" fill="#2d261f"/>
                <rect x="296" y="58" width="4" height="6" fill="#2d261f"/>
                <rect x="296" y="68" width="4" height="6" fill="#2d261f"/>
                <rect x="380" y="38" width="4" height="6" fill="#2d261f"/>
                <rect x="380" y="48" width="4" height="6" fill="#2d261f"/>
                <rect x="380" y="58" width="4" height="6" fill="#2d261f"/>
                <rect x="380" y="68" width="4" height="6" fill="#2d261f"/>

                <!-- Roof -->
                <path d="M 288 38 L 340 14 L 392 38 Z" fill="${env.isNight ? '#140f0c' : '#2d231a'}"/>
                <!-- Roof shingle lines -->
                <path d="M 300 32 L 380 32 M 312 25 L 368 25 M 325 19 L 355 19" stroke="${env.isNight ? '#0a0806' : '#1c1510'}" stroke-width="0.8"/>
                ${env.isSnow ? `<path d="M 286 38 L 340 13 L 394 38 Q 340 22 286 38 Z" fill="#f8fafc"/>` : ''}

                <!-- Spire Bell Tower & Cross -->
                <rect x="333" y="14" width="14" height="11" fill="${env.isNight ? '#17120e' : '#382f28'}"/>
                <path d="M 330 14 L 340 5 L 350 14 Z" fill="${env.isNight ? '#100c09' : '#241d18'}"/>
                <!-- Golden Spire Cross (Proper Christian proportions with longer upward/downward heading post) -->
                <line x1="340" y1="0" x2="340" y2="12" stroke="#c5a059" stroke-width="2.2" stroke-linecap="square"/>
                <line x1="334" y1="4" x2="346" y2="4" stroke="#c5a059" stroke-width="2.2" stroke-linecap="square"/>

                <!-- Bell in belfry -->
                <ellipse cx="340" cy="19" rx="2.5" ry="3" fill="#d97706" opacity="0.8"/>

                <!-- Gothic Window on Wall Facade -->
                ${windowGlow}
                <!-- Window Tracery -->
                <path d="M 334 50 V 43 A 6 6 0 0 1 346 43 V 50 Z" stroke="#241d18" stroke-width="1" fill="none"/>
                <line x1="340" y1="37" x2="340" y2="50" stroke="#241d18" stroke-width="1"/>
                <line x1="334" y1="45" x2="346" y2="45" stroke="#241d18" stroke-width="1"/>

                <!-- Ground Level Double Wooden Door (Positioned cleanly below the window) -->
                <path d="M 328 78 V 60 A 12 12 0 0 1 352 60 V 78 Z" fill="${env.isNight ? '#0a0806' : '#1f160f'}"/>
                <path d="M 330 78 V 62 A 10 10 0 0 1 350 62 V 78 Z" fill="${env.isNight ? '#140f0b' : '#332419'}"/>
                <!-- Seam line between double doors -->
                <line x1="340" y1="62" x2="340" y2="78" stroke="${env.isNight ? '#0a0806' : '#1a120c'}" stroke-width="0.8"/>
                <!-- Iron door strap hinges -->
                <line x1="330" y1="65" x2="338" y2="65" stroke="#000000" stroke-width="1"/>
                <line x1="342" y1="65" x2="350" y2="65" stroke="#000000" stroke-width="1"/>
                <line x1="330" y1="74" x2="338" y2="74" stroke="#000000" stroke-width="1"/>
                <line x1="342" y1="74" x2="350" y2="74" stroke="#000000" stroke-width="1"/>
                <!-- Brass door knobs -->
                <circle cx="338" cy="70" r="1" fill="#c5a059"/>
                <circle cx="342" cy="70" r="1" fill="#c5a059"/>
            </g>
        `;

        // Stone Wall & Creeping Ivy
        const wallSvg = `
            <g id="cemWall">
                <!-- Main Stone Wall -->
                <rect x="0" y="70" width="680" height="14" fill="${env.isNight ? '#16120d' : '#54493d'}"/>
                <!-- Wall Coping Top -->
                <rect x="0" y="67" width="680" height="4" fill="${env.isNight ? '#261f18' : '#706354'}"/>
                <line x1="0" y1="71" x2="680" y2="71" stroke="${env.isNight ? '#0c0a07' : '#3b3228'}" stroke-width="0.8"/>
                
                <!-- Masonry mortar texture -->
                <path d="M 0 77 H 680 M 50 71 V 77 M 120 77 V 84 M 190 71 V 77 M 260 77 V 84 M 420 71 V 77 M 490 77 V 84 M 560 71 V 77 M 630 77 V 84" stroke="${env.isNight ? '#0d0b08' : '#383027'}" stroke-width="0.8"/>

                ${env.isSnow ? `<rect x="0" y="66" width="680" height="3" fill="#f8fafc"/>` : ''}

                <!-- Gate Pillars -->
                <rect x="294" y="63" width="10" height="21" fill="${env.isNight ? '#120e0a' : '#3d342b'}"/>
                <rect x="292" y="61" width="14" height="3" fill="${env.isNight ? '#211a13' : '#574a3e'}"/>
                
                <rect x="376" y="63" width="10" height="21" fill="${env.isNight ? '#120e0a' : '#3d342b'}"/>
                <rect x="374" y="61" width="14" height="3" fill="${env.isNight ? '#211a13' : '#574a3e'}"/>

                <!-- Wrought Iron Gate Arch & Scrollwork over central path -->
                <path d="M 299 62 Q 340 46 381 62" stroke="${env.isNight ? '#0a0806' : '#261e16'}" stroke-width="2" fill="none"/>
                <line x1="310" y1="62" x2="310" y2="57" stroke="${env.isNight ? '#0a0806' : '#261e16'}" stroke-width="1.2"/>
                <line x1="322" y1="62" x2="322" y2="53" stroke="${env.isNight ? '#0a0806' : '#261e16'}" stroke-width="1.2"/>
                <line x1="334" y1="62" x2="334" y2="50" stroke="${env.isNight ? '#0a0806' : '#261e16'}" stroke-width="1.2"/>
                <line x1="346" y1="62" x2="346" y2="50" stroke="${env.isNight ? '#0a0806' : '#261e16'}" stroke-width="1.2"/>
                <line x1="358" y1="62" x2="358" y2="53" stroke="${env.isNight ? '#0a0806' : '#261e16'}" stroke-width="1.2"/>
                <line x1="370" y1="62" x2="370" y2="57" stroke="${env.isNight ? '#0a0806' : '#261e16'}" stroke-width="1.2"/>
                <!-- Iron Cross in center of arch -->
                <line x1="340" y1="44" x2="340" y2="52" stroke="#c5a059" stroke-width="1.5"/>
                <line x1="336" y1="47" x2="344" y2="47" stroke="#c5a059" stroke-width="1.5"/>

                <!-- Creeping Ivy on Wall -->
                <path d="M 20 84 Q 30 72 45 76 Q 60 70 75 80" stroke="#364b22" stroke-width="1.5" fill="none"/>
                <circle cx="32" cy="74" r="1.5" fill="#4d6b30"/>
                <circle cx="48" cy="74" r="1.5" fill="#4d6b30"/>
                <circle cx="62" cy="72" r="1.5" fill="#4d6b30"/>

                <path d="M 600 84 Q 615 70 635 75 Q 650 68 665 82" stroke="#364b22" stroke-width="1.5" fill="none"/>
                <circle cx="612" cy="72" r="1.5" fill="#4d6b30"/>
                <circle cx="638" cy="72" r="1.5" fill="#4d6b30"/>
            </g>
        `;

        // Beautiful Multi-layered Trees & Cypresses
        const treeNight = env.isNight;
        const leafGrad = treeNight ? 'url(#cemTreeDark)' : 'url(#cemTreeGrad)';
        const cypressGrad = treeNight ? 'url(#cemCypressDark)' : 'url(#cemCypressGrad)';
        
        const treesSvg = `
            <g id="cemTrees">
                <!-- Background Left Cypress (Smaller/Darker for depth) -->
                <path d="M 28 84 Q 22 50 32 26 Q 42 50 36 84 Z" fill="${treeNight ? '#08120b' : '#1d3318'}"/>

                <!-- Main Left Pine/Cypress Tree (With solid visible trunk connecting to ground) -->
                <g id="leftCypress">
                    <!-- Solid Wooden Trunk extending down behind stone wall to ground -->
                    <path d="M 57 84 L 57 32 L 67 32 L 67 84 Z" fill="${treeNight ? '#140d07' : '#3b2513'}"/>
                    <line x1="60" y1="84" x2="60" y2="32" stroke="${treeNight ? '#211409' : '#57361b'}" stroke-width="1.2"/>
                    
                    <!-- Overlapping Foliage Canopy Tiers (Seamless overlap, zero gaps!) -->
                    <!-- Tier 1 (Bottom Crown) -->
                    <path d="M 36 78 Q 62 56 88 78 Q 62 82 36 78 Z" fill="${cypressGrad}"/>
                    <!-- Tier 2 (Middle Crown) -->
                    <path d="M 40 64 Q 62 44 84 64 Q 62 68 40 64 Z" fill="${cypressGrad}"/>
                    <!-- Tier 3 (Upper Crown) -->
                    <path d="M 45 48 Q 62 26 79 48 Q 62 52 45 48 Z" fill="${cypressGrad}"/>
                    <!-- Tier 4 (Top Spire) -->
                    <path d="M 50 30 Q 62 10 74 30 Q 62 33 50 30 Z" fill="${cypressGrad}"/>
                    ${env.isSnow ? `<path d="M 50 30 Q 62 10 74 30 Q 62 24 50 30 Z" fill="#f8fafc" opacity="0.85"/>` : ''}
                </g>

                <!-- Bushy Yew / Shrub near left wall -->
                <path d="M 80 84 Q 72 65 88 62 Q 95 55 105 65 Q 115 72 108 84 Z" fill="${treeNight ? '#0d1a0f' : '#284220'}"/>

                <!-- Right Perimeter: Ancient Weeping Oak / Yew -->
                <g id="rightOak">
                    <!-- Trunk extending down to ground -->
                    <path d="M 622 84 Q 625 65 628 50 Q 640 45 648 42" stroke="#2b1c10" stroke-width="7" fill="none" stroke-linecap="round"/>
                    <path d="M 628 56 Q 615 48 605 45" stroke="#2b1c10" stroke-width="4" fill="none" stroke-linecap="round"/>
                    
                    <!-- Foliage Clusters -->
                    <path d="M 590 52 Q 575 35 595 24 Q 615 15 635 25 Q 655 18 668 35 Q 675 52 650 62 Q 625 68 590 52 Z" fill="${leafGrad}"/>
                    <path d="M 605 42 Q 590 28 610 20 Q 630 14 645 24 Q 660 30 648 45 Z" fill="${treeNight ? '#162e1c' : '#4d7036'}" opacity="0.6"/>
                    <circle cx="600" cy="38" r="14" fill="${treeNight ? '#0f2113' : '#2c471f'}"/>
                    <circle cx="640" cy="32" r="16" fill="${treeNight ? '#0f2113' : '#2c471f'}"/>

                    ${env.isSnow ? `
                        <path d="M 595 24 Q 615 15 635 25 Q 655 18 668 35 Q 630 22 595 24 Z" fill="#f8fafc"/>
                    ` : ''}
                </g>

                <!-- Background Right Cypress -->
                <path d="M 565 84 Q 558 52 568 32 Q 578 52 571 84 Z" fill="${treeNight ? '#09140c' : '#1f381a'}"/>
            </g>
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
            gravesSvg += this._getCemGraveSvg(c.x, c.y, !!g.nahrobek, isRecent, env.isNight, neglected, cond, g.ts, c.tilt, i);
        });

        // Path (Tapered Perspective Cobblestone Path)
        const pathEndY = isExpanded ? 230 : 120;
        const pathSvg = `
            <g id="cemPath">
                <polygon points="328,78 352,78 385,${pathEndY} 295,${pathEndY}" fill="${pathColor}"/>
                <!-- Cobblestone / Gravel detail lines -->
                <path d="M 320,${pathEndY - 20} Q 340,${pathEndY - 22} 360,${pathEndY - 20} M 315,${pathEndY - 45} Q 340,${pathEndY - 47} 365,${pathEndY - 45} M 325,100 Q 340,99 355,100" stroke="${env.isNight ? '#17120e' : '#574836'}" stroke-width="1" stroke-dasharray="3,3" fill="none" opacity="0.6"/>
                <!-- Path Edge Shadow -->
                <line x1="328" y1="78" x2="295" y2="${pathEndY}" stroke="#000000" stroke-width="1.5" opacity="0.3"/>
                <line x1="352" y1="78" x2="385" y2="${pathEndY}" stroke="#000000" stroke-width="1.5" opacity="0.3"/>
            </g>
        `;

        return `
            <svg width="100%" viewBox="0 0 680 ${viewBoxHeight}" role="img" style="display:block; border-radius:8px 8px 0 0;">
                <defs>
                    <linearGradient id="cemSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${skyTop}"/>
                        <stop offset="50%" stop-color="${skyMid}"/>
                        <stop offset="100%" stop-color="${skyBottom}"/>
                    </linearGradient>
                    <linearGradient id="cemGround" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${ground1}"/>
                        <stop offset="100%" stop-color="${ground2}"/>
                    </linearGradient>
                    <linearGradient id="cemTreeGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="${env.timeSlot==='morning'||env.timeSlot==='evening'?'#4d6e2a':'#3b5c23'}"/>
                        <stop offset="100%" stop-color="#1b3310"/>
                    </linearGradient>
                    <linearGradient id="cemTreeDark" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#1a3322"/>
                        <stop offset="100%" stop-color="#09140b"/>
                    </linearGradient>
                    <linearGradient id="cemCypressGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#4d7036"/>
                        <stop offset="40%" stop-color="#2d4a1f"/>
                        <stop offset="100%" stop-color="#192e10"/>
                    </linearGradient>
                    <linearGradient id="cemCypressDark" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#264733"/>
                        <stop offset="100%" stop-color="#0b170f"/>
                    </linearGradient>
                    <linearGradient id="cemStoneGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#9e9384"/>
                        <stop offset="100%" stop-color="#6e6456"/>
                    </linearGradient>
                    <linearGradient id="cemFogGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#cbd5e1" stop-opacity="0.0"/>
                        <stop offset="50%" stop-color="#e2e8f0" stop-opacity="0.5"/>
                        <stop offset="100%" stop-color="#cbd5e1" stop-opacity="0.0"/>
                    </linearGradient>
                    <radialGradient id="cemWindowSpill" cx="50%" cy="0%" r="100%">
                        <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0"/>
                    </radialGradient>
                    <radialGradient id="cemCandleGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/>
                        <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#d97706" stop-opacity="0.0"/>
                    </radialGradient>
                </defs>

                <!-- Sky Background -->
                <rect x="0" y="0" width="680" height="${viewBoxHeight}" fill="url(#cemSky)"/>
                ${starsSvg}
                ${celestialSvg}
                ${cloudsSvg}

                <!-- Architecture & Wall & Background Trees -->
                ${treesSvg}
                ${wallSvg}
                ${chapelSvg}

                <!-- Ground -->
                <rect x="0" y="78" width="680" height="${viewBoxHeight - 78}" fill="url(#cemGround)"/>
                ${pathSvg}

                <!-- Atmospheric Overlays -->
                ${weatherOverlay}

                <!-- Graves -->
                ${gravesSvg}
            </svg>
        `;
    },

    // ── RAJSKY DVUR: mapova vizualizace (mirror Hrbitov V1, ale bez znacek —
    // bezejmenne hroby prostych mnichu, ctvercovy dvur s krizovymi cestickami,
    // kasnou a lavatoriem, zadna kaple/brana). Zadano 30.8.2026. ──
    CLOISTER_MAP_SLOTS: 10,
    CLOISTER_MAP_COORDS_EXPANDED: [
        { x: 95,  y: 60 },  { x: 170, y: 75 },  { x: 250, y: 62 },
        { x: 430, y: 62 },  { x: 510, y: 75 },  { x: 585, y: 60 },
        { x: 120, y: 155 }, { x: 220, y: 165 },
        { x: 460, y: 165 }, { x: 560, y: 155 }
    ],
    CLOISTER_MAP_COORDS_COLLAPSED: [
        { x: 150, y: 40 }, { x: 520, y: 40 },
        { x: 150, y: 82 }, { x: 520, y: 82 }
    ],

    // Bezejmenny hrob prosteho mnicha — jen hlina/drn, zadny kriz ani nahrobek
    // (visitatio-reference: "hroby byly u prostych bratru velmi casto zcela
    // bezejmenne"). Styl odvozen z timestamp hrobu, NE z pozice/indexu —
    // stejna stabilita jako oprava Hrbitova 30.8.2026.
    _getCloisterGraveSvg: function (cx, cy, isNight, ts) {
        let h = '';
        const timestamp = ts != null ? ts : 0;
        const groundStyle = Math.abs(timestamp) % 6;

        h += `<ellipse cx="${cx + 1}" cy="${cy + 7}" rx="16" ry="5" fill="${isNight ? '#050a06' : '#121a0d'}" opacity="0.4"/>`;

        if (groundStyle === 0) {
            const stoneBorder = isNight ? '#221d17' : '#4a4238';
            const earthFill = isNight ? '#1c1712' : '#3d3023';
            h += `<rect x="${cx - 13}" y="${cy + 2}" width="26" height="8" fill="${stoneBorder}" rx="1"/>`;
            h += `<rect x="${cx - 11}" y="${cy + 3.2}" width="22" height="5.5" fill="${earthFill}" rx="0.5"/>`;
        } else if (groundStyle === 1) {
            const moundColor = isNight ? '#2e2517' : '#4a3826';
            const moundShadow = isNight ? '#181209' : '#2d1f14';
            h += `<ellipse cx="${cx}" cy="${cy + 5.5}" rx="15" ry="4.5" fill="${moundShadow}"/>`;
            h += `<ellipse cx="${cx}" cy="${cy + 4}" rx="13" ry="3.5" fill="${moundColor}"/>`;
        } else if (groundStyle === 2) {
            const slabColor = isNight ? '#332e28' : '#524a40';
            const slabSide = isNight ? '#1e1a16' : '#332e28';
            h += `<polygon points="${cx - 13},${cy + 3} ${cx + 11},${cy + 3} ${cx + 14},${cy + 7} ${cx - 10},${cy + 7}" fill="${slabColor}" stroke="#1e1a16" stroke-width="0.7"/>`;
            h += `<polygon points="${cx - 10},${cy + 7} ${cx + 14},${cy + 7} ${cx + 14},${cy + 8.3} ${cx - 10},${cy + 8.3}" fill="${slabSide}"/>`;
        } else if (groundStyle === 3) {
            const woodColor = isNight ? '#241a10' : '#45301e';
            const woodStroke = isNight ? '#160e08' : '#291b10';
            h += `<rect x="${cx - 12}" y="${cy + 2.5}" width="24" height="7" fill="${woodColor}" stroke="${woodStroke}" stroke-width="1" rx="0.5"/>`;
            h += `<rect x="${cx - 10.5}" y="${cy + 3.8}" width="21" height="4.5" fill="#38291a"/>`;
        } else if (groundStyle === 4) {
            h += `<ellipse cx="${cx}" cy="${cy + 5}" rx="12" ry="3" fill="#2d3f1d" opacity="0.55"/>`;
            h += `<ellipse cx="${cx - 2}" cy="${cy + 4.5}" rx="8" ry="2" fill="#36291c" opacity="0.45"/>`;
        } else {
            h += `<ellipse cx="${cx}" cy="${cy + 5}" rx="13" ry="4" fill="#3b342c"/>`;
            h += `<circle cx="${cx - 11}" cy="${cy + 4.5}" r="1.6" fill="#595147"/>`;
            h += `<circle cx="${cx + 9}" cy="${cy + 6}" r="1.8" fill="#403931"/>`;
        }

        // Vzacna tise rostouci travina — deterministicky z timestamp, zadna
        // individualni oznaceni (svicka/vyznameni), to sem nepatri.
        if (Math.abs(Math.floor(timestamp / 11)) % 5 === 0) {
            h += `<path d="M ${cx + 7} ${cy + 5} Q ${cx + 9} ${cy + 1} ${cx + 10} ${cy + 4}" stroke="#3d5225" stroke-width="1" fill="none"/>`;
        }

        return h;
    },

    renderCloisterScene: function (cem, lang, isExpanded) {
        const env = this._getCemeteryEnv();
        const graves = (cem && cem.graves) || [];
        const viewBoxHeight = isExpanded ? 230 : 120;
        const w = 680, hgt = viewBoxHeight, border = 40;

        let stoneMain = '#54493d', stoneDark = '#3b3228', grassMain = '#385723', grassDark = '#233b15';
        if (env.isNight) { stoneMain = '#221d17'; stoneDark = '#100c09'; grassMain = '#101d13'; grassDark = '#08110a'; }
        else if (env.isSnow) { grassMain = '#e2e8f0'; grassDark = '#cbd5e1'; }
        else if (env.timeSlot === 'morning' || env.timeSlot === 'evening') { grassMain = '#283b1c'; grassDark = '#172710'; }
        let pathColor = env.isNight ? '#2a221b' : (env.isSnow ? '#94a3b8' : '#736048');

        // Atmosfericke prekryvy — sdileno s Hrbitovem po vzoru, ale zadna obloha/
        // hvezdy/celestialni telesa: Rajsky dvur je uzavreny vnitrni prostor.
        let weatherOverlay = '';
        if (env.condition === 'rain') {
            for (let r = 0; r < 16; r++) {
                const rx = (r * 30) % (w - border * 2) + border + 5;
                const ry = (r * 11) % (hgt - border * 2 - 10) + border + 5;
                weatherOverlay += `<line x1="${rx}" y1="${ry}" x2="${rx - 6}" y2="${ry + 16}" stroke="rgba(186, 230, 253, 0.35)" stroke-width="1"/>`;
            }
        } else if (env.isSnow) {
            for (let s = 0; s < 18; s++) {
                const sx = (s * 24) % (w - border * 2) + border + 5;
                const sy = (s * 13) % (hgt - border * 2 - 10) + border + 5;
                weatherOverlay += `<circle cx="${sx}" cy="${sy}" r="${(s % 3 === 0 ? 1.8 : 1)}" fill="#ffffff" opacity="0.8"/>`;
            }
        } else if (env.isFog) {
            weatherOverlay += `<rect x="${border}" y="${border}" width="${w - border * 2}" height="${hgt - border * 2}" fill="url(#cloisterFogGrad)" opacity="0.4"/>`;
        }

        const coords = isExpanded ? this.CLOISTER_MAP_COORDS_EXPANDED : this.CLOISTER_MAP_COORDS_COLLAPSED;
        const slotsCount = isExpanded ? this.CLOISTER_MAP_SLOTS : 4;
        const shown = graves.slice().reverse().slice(0, slotsCount);
        let gravesSvg = '';
        shown.forEach((g, i) => {
            const c = coords[i];
            if (!c) return;
            gravesSvg += this._getCloisterGraveSvg(c.x, c.y, env.isNight, g.ts);
        });

        // Ambit — krizova chodba rami dvur ze vsech 4 stran, sloupky po obvodu
        let ambitSvg = `<rect x="0" y="0" width="${w}" height="${hgt}" fill="${stoneMain}"/>`;
        ambitSvg += `<rect x="${border}" y="${border}" width="${w - border * 2}" height="${hgt - border * 2}" fill="url(#cloisterGrass)"/>`;
        const colSpacing = 42;
        for (let cx0 = border + 14; cx0 < w - border; cx0 += colSpacing) {
            ambitSvg += `<rect x="${cx0}" y="${border - 10}" width="5" height="10" fill="${stoneDark}"/>`;
            ambitSvg += `<rect x="${cx0}" y="${hgt - border}" width="5" height="10" fill="${stoneDark}"/>`;
        }
        for (let cy0 = border + 14; cy0 < hgt - border; cy0 += colSpacing) {
            ambitSvg += `<rect x="${border - 10}" y="${cy0}" width="10" height="5" fill="${stoneDark}"/>`;
            ambitSvg += `<rect x="${w - border}" y="${cy0}" width="10" height="5" fill="${stoneDark}"/>`;
        }

        // Krizove cesticky
        const pathW = 26;
        let pathSvg = `<rect x="${w / 2 - pathW / 2}" y="${border}" width="${pathW}" height="${hgt - border * 2}" fill="${pathColor}"/>`;
        pathSvg += `<rect x="${border}" y="${hgt / 2 - pathW / 2}" width="${w - border * 2}" height="${pathW}" fill="${pathColor}"/>`;

        // Kasna uprostred, kde se cesticky krizi
        const fx = w / 2, fy = hgt / 2;
        const fountainSvg = `
            <ellipse cx="${fx + 1}" cy="${fy + 9}" rx="20" ry="6" fill="#000000" opacity="0.25"/>
            <ellipse cx="${fx}" cy="${fy}" rx="19" ry="10" fill="${stoneDark}"/>
            <ellipse cx="${fx}" cy="${fy - 1.5}" rx="15" ry="7.5" fill="#3d7a9e" opacity="0.75"/>
            <ellipse cx="${fx}" cy="${fy - 3}" rx="8" ry="4" fill="#7fb8d6" opacity="0.5"/>
            <rect x="${fx - 2.5}" y="${fy - 14}" width="5" height="12" fill="${stoneDark}"/>
            <circle cx="${fx}" cy="${fy - 15}" r="3" fill="${stoneDark}"/>
        `;

        // Lavatorium — kamenna mušle ve zdi jizni chodby, mimo stred
        const lx = border + 90, ly = hgt - border;
        const lavatoriumSvg = `
            <path d="M ${lx - 14} ${ly} Q ${lx} ${ly + 14} ${lx + 14} ${ly} Z" fill="${stoneDark}"/>
            <ellipse cx="${lx}" cy="${ly + 4}" rx="9" ry="4" fill="#3d7a9e" opacity="0.6"/>
        `;

        return `
            <svg width="100%" viewBox="0 0 ${w} ${hgt}" role="img" style="display:block; border-radius:8px 8px 0 0;">
                <defs>
                    <linearGradient id="cloisterGrass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${grassMain}"/>
                        <stop offset="100%" stop-color="${grassDark}"/>
                    </linearGradient>
                    <linearGradient id="cloisterFogGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#cbd5e1" stop-opacity="0.0"/>
                        <stop offset="50%" stop-color="#e2e8f0" stop-opacity="0.5"/>
                        <stop offset="100%" stop-color="#cbd5e1" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>

                <!-- Ambit + travnik -->
                ${ambitSvg}

                <!-- Krizove cesticky -->
                ${pathSvg}

                <!-- Atmosfericke prekryvy -->
                ${weatherOverlay}

                <!-- Hroby -->
                ${gravesSvg}

                <!-- Kasna a lavatorium -->
                ${fountainSvg}
                ${lavatoriumSvg}
            </svg>
        `;
    },
};
