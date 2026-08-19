// ═══ src/core/managers/PetitionManager.js ═══
// Extrakce z game.js (Krok 2 / D10, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Abbot petice / Ubytovna / Cechy / Pozemky. Původně
// Game.* na řádcích 3423-3604 + 4805-4897 + 4910-5277 (tři nesouvislé
// bloky, HEAD po D2-D5+D9+D12+cleanup). Chování beze změny — pouze přesun
// + přepsání this.addItem/removeItem -> Game.* (D8, needitováno) a
// self-referencí GUILD_GIFT_*/LAND_DESKY_MS/UBYTOVNA_TIER_COSTS ->
// PetitionManager.*. POZOR: conversiCapacity (řádek 4902 původně) VYNECHÁN
// záměrně — patří sémanticky do D14 (Conversi/Dormitorium), ne sem, i
// když seděl mezi těmito bloky v souboru. Zaestává v game.js do D14.
const PetitionManager = {
    _checkDomusIIConditions: function () {
        if (!(GameState.storage && GameState.storage.domus_conversorum_i && GameState.storage.domus_conversorum_i.built)) {
            return 'denied_phase2';
        }
        const influence = (GameState.persona && GameState.persona.influence && GameState.persona.influence.abbot) || 0;
        if (influence < 40) return 'denied_influence';

        let foodTotal = 0;
        for (const [id, qty] of Object.entries(GameState.inventory || {})) {
            const item = (typeof ItemsDB !== 'undefined') ? ItemsDB[id] : null;
            if (item && item.type === 'food' && typeof qty === 'number') foodTotal += qty;
        }
        if (foodTotal < 50) return 'denied_food';

        const grose = (typeof CellariumSystem !== 'undefined') ? CellariumSystem.getGrose() : 0;
        const txs = (GameState.treasury && GameState.treasury.transactions) || [];
        const ledgerBalance = txs.filter(t => t.type === 'sell').reduce((s, t) => s + t.total, 0)
            - txs.filter(t => t.type === 'buy').reduce((s, t) => s + t.total, 0);
        if (grose < 100 && ledgerBalance <= 0) return 'denied_economy';

        const drinkIds = ['vinum', 'vinum_rubrum', 'vinum_obscurum', 'vinum_baci', 'vinum_praeclarum', 'prima_cervisia', 'cervisia_nigra', 'honey'];
        const hasDrink = drinkIds.some(id => (GameState.inventory[id] || 0) > 0);
        if (!hasDrink) return 'denied_drink';

        if (!(GameState.rank && GameState.rank.monastic === 'prior')) return 'denied_rank';

        return null;
    },

    submitAbbotPetition: function (type) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'cs';
        if (!GameState.abbotPetition) GameState.abbotPetition = {};
        if (!GameState.abbotPetition[type]) {
            GameState.abbotPetition[type] = { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false };
        }
        const pet = GameState.abbotPetition[type];

        // Již odesláno nebo schváleno
        if (pet.status === 'pending') {
            UI.notify(cs ? '⏳ Žádost již byla odeslána. Čekej na odpověď opata.' : '⏳ Petition already submitted. Await the Abbot\'s reply.', true);
            return;
        }
        if (pet.status === 'approved') {
            UI.notify(cs ? '✅ Opat již schválil tuto žádost.' : '✅ The Abbot has already approved this petition.', true);
            return;
        }

        // Validace podmínek — pro fodinu
        if (type === 'fodina') {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fodina'))) {
                UI.notify(t('abbotPetition.fodina.denied_tech'), true); return;
            }
            if (!(GameState.storage && GameState.storage.fabrica && GameState.storage.fabrica.built)) {
                UI.notify(t('abbotPetition.fodina.denied_fabrica'), true); return;
            }
            if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 50) {
                UI.notify(t('abbotPetition.fodina.denied_groats'), true); return;
            }
            const hasPickaxe = (GameState.inventory['iron_pickaxe'] > 0) || (GameState.inventory['stone_pickaxe'] > 0)
                || (GameState.inventory['worn_iron_pickaxe'] > 0);
            if (!hasPickaxe) {
                UI.notify(t('abbotPetition.fodina.denied_pickaxe'), true); return;
            }
        }

        // Validace podmínek — pro fornax
        if (type === 'fornax') {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fornax'))) {
                UI.notify(t('abbotPetition.fornax.denied_tech'), true); return;
            }
            if (!(GameState.abbotPetition.fodina && GameState.abbotPetition.fodina.status === 'approved')) {
                UI.notify(t('abbotPetition.fornax.denied_fodina'), true); return;
            }
            if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 80) {
                UI.notify(t('abbotPetition.fornax.denied_groats'), true); return;
            }
            if ((GameState.inventory['charcoal'] || 0) < 15) {
                UI.notify(t('abbotPetition.fornax.denied_charcoal'), true); return;
            }
        }

        // Validace podmínek — pro Columbarium (Porta)
        if (type === 'columbarium') {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_porta'))) {
                UI.notify(t('abbotPetition.columbarium.denied_tech'), true); return;
            }
            if (!(GameState.columbarium && GameState.columbarium.built)) {
                UI.notify(t('abbotPetition.columbarium.denied_build'), true); return;
            }
        }

        // Validace podmínek — pro Domus Conversorum II
        if (type === 'domus_ii') {
            const deniedKey = this._checkDomusIIConditions();
            if (deniedKey) {
                UI.notify(t('abbotPetition.domus_ii.' + deniedKey), true); return;
            }
        }

        // Validace podmínek — pro Probošta (endgame-branches-reference.md sekce 4.3)
        if (type === 'probost') {
            const fTier = (GameState.templum && GameState.templum.fabricaTier) || 0;
            if (fTier < 1) {
                UI.notify(t('abbotPetition.probost.denied_fabrica'), true); return;
            }
            if (!['armarius', 'prior'].includes(GameState.rank && GameState.rank.monastic)) {
                UI.notify(t('abbotPetition.probost.denied_rank'), true); return;
            }
        }

        // Vše OK — odeslat žádost
        pet.status = 'pending';
        pet.submittedAt = Date.now();
        pet.deniedReason = null;

        const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
        const submitDate = _toGameDate(Date.now()).toLocaleDateString(cs ? 'cs-CZ' : 'en-GB');
        const responseDate = _toGameDate(Date.now() + 86400000).toLocaleDateString(cs ? 'cs-CZ' : 'en-GB');

        const kronikaCs = t('abbotPetition.' + type + '.kronika_submit')
            .replace('{responseDate}', responseDate);
        const kronikaEn = (lang === 'en' ? t('abbotPetition.' + type + '.kronika_submit') : '')
            .replace('{responseDate}', responseDate);

        UI.notifyPanel('📜 ' + (cs
            ? 'Žádost odeslána opatovi. Odpověď očekávána ' + responseDate + '.'
            : 'Petition submitted to the Abbot. Reply expected by ' + responseDate + '.'), 'system');

        Game.addKronikaEntry('important',
            kronikaCs,
            'Petition submitted. Reply expected by ' + responseDate + '.',
            'Petitio ad abbatem missa. Responsum ' + responseDate + ' exspectatur.'
        );

        Game.save();
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
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

    checkAbbotPetitions: function () {
        if (!GameState.abbotPetition) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'cs';
        const now = Date.now();
        const DAY_MS = 86400000;

        ['fodina', 'fornax', 'columbarium', 'domus_ii', 'domus_iii', 'probost'].forEach(type => {
            const pet = GameState.abbotPetition[type];
            if (!pet || pet.status !== 'pending') return;
            if (now - pet.submittedAt < DAY_MS) return;

            // 24h uplynulo — vyhodnotit
            let deniedKey = null;

            if (type === 'fodina') {
                if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fodina'))) deniedKey = 'denied_tech';
                else if (!(GameState.storage && GameState.storage.fabrica && GameState.storage.fabrica.built)) deniedKey = 'denied_fabrica';
                else if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 50) deniedKey = 'denied_groats';
                else {
                    const hasPickaxe = (GameState.inventory['iron_pickaxe'] > 0) || (GameState.inventory['stone_pickaxe'] > 0)
                        || (GameState.inventory['worn_iron_pickaxe'] > 0);
                    if (!hasPickaxe) deniedKey = 'denied_pickaxe';
                }
            }

            if (type === 'fornax') {
                if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fornax'))) deniedKey = 'denied_tech';
                else if (!(GameState.abbotPetition.fodina && GameState.abbotPetition.fodina.status === 'approved')) deniedKey = 'denied_fodina';
                else if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 80) deniedKey = 'denied_groats';
                else if ((GameState.inventory['charcoal'] || 0) < 15) deniedKey = 'denied_charcoal';
            }

            if (type === 'columbarium') {
                if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_porta'))) deniedKey = 'denied_tech';
                else if (!(GameState.columbarium && GameState.columbarium.built)) deniedKey = 'denied_build';
            }

            if (type === 'domus_ii') {
                deniedKey = this._checkDomusIIConditions();
            }

            if (type === 'probost') {
                const fTier = (GameState.templum && GameState.templum.fabricaTier) || 0;
                if (fTier < 1) deniedKey = 'denied_fabrica';
                else if (!['armarius', 'prior'].includes(GameState.rank && GameState.rank.monastic)) deniedKey = 'denied_rank';
            }

            if (deniedKey) {
                // Zamítnout
                pet.status = 'denied';
                pet.deniedReason = deniedKey;
                const reason = t('abbotPetition.' + type + '.' + deniedKey);
                UI.notifyPanel('❌ ' + (cs ? 'Opat zamítl žádost.' : 'The Abbot denied the petition.') + ' ' + reason, 'warning');
                Game.addKronikaEntry('important',
                    t('abbotPetition.' + type + '.kronika_denied').replace('{reason}', reason),
                    'The Abbot denied the petition. Reason: ' + reason,
                    'Abbas petitionem negavit.'
                );
                // Reset na none — hráč může zkusit znovu
                setTimeout(() => { pet.status = 'none'; pet.submittedAt = null; Game.save(); }, 3000);
            } else {
                // Schválit
                pet.status = 'approved';
                pet.inspectionPending = true;
                if (type === 'probost') {
                    if (!GameState.rank) GameState.rank = {};
                    GameState.rank.probost = true;
                }
                if (type === 'columbarium') {
                    if (typeof FarmyardSystem !== 'undefined') FarmyardSystem._ensureAnimals();
                    const _cfg = (typeof FarmyardSystem !== 'undefined') ? FarmyardSystem.COLUMBARIUM_CFG : null;
                    if (!GameState.columbarium.count) {
                        GameState.columbarium.count = _cfg ? _cfg.startCount : 20;
                    }
                    GameState.columbarium.lastEggAt = Date.now();
                    GameState.columbarium.lastFeatherAt = Date.now();
                    // PortaSystem engine gate — dopisy/pošta ožívají až s holuby
                    if (!GameState.flags) GameState.flags = {};
                    GameState.flags.porta_active = true;
                }
                UI.notifyPanel('✅ ' + t('abbotPetition.' + type + '.approved'), 'success');
                UI.notifyPanel('🔍 ' + t('abbotPetition.' + type + '.inspect_hint'), 'info');
                Game.addKronikaEntry('important',
                    t('abbotPetition.' + type + '.kronika_approved'),
                    type === 'fodina' ? 'The Abbot granted mining rights (Fodina).' : 'The Abbot approved the Fornax Ferraria.',
                    'Abbas petitionem approbavit.'
                );
            }
            Game.save();
            if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        });
    },

    // ── UBYTOVNA — kapacita hostů, vlastní tier žebřík (I→IV: 1/3/6/9) ──────
    // Sdílí prerekvizitu se sklepy (storage.old_cellars.built), ale progrese
    // je oddělená od Domus Conversorum (jiná budova, jiný účel — hosté, ne
    // trvalí konvrši). "Oddělené a propojené" (Bouvarde 2.8.2026).
    // Vlastní petiční systém (ne sdílený s abbotPetition/submitAbbotPetition)
    // — ten interně čte i18n klíče (t('abbotPetition.'+type+'...')), co pro
    // nové typy nemůžeme přidat bez aktuálních cs.js/en.js (i18n hard rule).
    // Tenhle systém je proto self-contained, inline bilingvní text všude.
    ubytovnaCapacity: function () {
        const s = GameState.storage || {};
        if (s.ubytovna_iv && s.ubytovna_iv.built) return 9;
        if (s.ubytovna_iii && s.ubytovna_iii.built) return 6;
        if (s.ubytovna_ii && s.ubytovna_ii.built) return 3;
        return 1;
    },

    UBYTOVNA_TIER_COSTS: {
        ubytovna_ii: { items: { cut_stone: 15, plank: 10, rope: 4 }, grose: 10, cap: 3 },
        ubytovna_iii: { items: { cut_stone: 105, plank: 63, rope: 25 }, grose: 35, cap: 6 },
        ubytovna_iv: { items: { cut_stone: 330, plank: 200, rope: 75, iron_ingot: 4 }, grose: 110, cap: 9 },
    },

    submitUbytovnaPetition: function (tier) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.ubytovnaPetition) GameState.ubytovnaPetition = {};
        if (!GameState.ubytovnaPetition[tier]) GameState.ubytovnaPetition[tier] = { status: 'none', submittedAt: null };
        const pet = GameState.ubytovnaPetition[tier];
        if (pet.status === 'pending') {
            UI.notify(lang === 'en' ? '⏳ Petition already submitted. Await the Abbot\'s reply.' : '⏳ Žádost už byla odeslána. Čekej na odpověď opata.', true);
            return;
        }
        if (pet.status === 'approved') {
            UI.notify(lang === 'en' ? '✅ The Abbot already approved this.' : '✅ Opat už tuto žádost schválil.', true);
            return;
        }
        pet.status = 'pending';
        pet.submittedAt = Date.now();
        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel('📜 ' + (lang === 'en'
            ? 'Petition submitted to the Abbot. Reply expected in 24h.'
            : 'Žádost odeslána opatovi. Odpověď se čeká za 24 hodin.'), 'system');
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // Cechy — Privilegium (cechy-a-prava-mrd.md §3.1, 16.8.2026). Mirror
    // submitUbytovnaPetition (plně inline text, ŽÁDNÝ t() — GuildsDB
    // nemá i18n klíče a nemáme je přidávat bez aktuálních cs.js/en.js).
    // Cena strhává se HNED při odeslání (historicky přesně — lobbing
    // stál peníze bez ohledu na výsledek), ne až při schválení.
    submitGuildPetition: function (guildId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (typeof GuildsDB === 'undefined' || !GuildsDB[guildId]) return;
        const guildName = lang === 'en' ? GuildsDB[guildId].name_en : GuildsDB[guildId].name;

        if (!GameState.guildPetition) GameState.guildPetition = {};
        if (!GameState.guildPetition[guildId]) GameState.guildPetition[guildId] = { status: 'none', submittedAt: null };
        const pet = GameState.guildPetition[guildId];

        if (pet.status === 'pending') {
            UI.notify(lang === 'en' ? '⏳ Petition already submitted. Await the Abbot\'s reply.' : '⏳ Žádost už byla odeslána. Čekej na odpověď opata.', true);
            return;
        }
        if ((GameState.guildPravo && GameState.guildPravo[guildId] && GameState.guildPravo[guildId].status === 'granted')) {
            UI.notify(lang === 'en' ? '✅ This guild has already granted you the Privilege.' : '✅ Tenhle cech ti už Privilegium udělil.', true);
            return;
        }
        if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_ius_terrae'))) {
            UI.notify(lang === 'en' ? '❌ Requires the "Ius Terrae" technology.' : '❌ Vyžaduje technologii "Ius Terrae — Zemské právo".', true);
            return;
        }
        const rel = (GameState.guildRelation && GameState.guildRelation[guildId]) || 0;
        if (rel < 50) {
            UI.notify(lang === 'en' ? `❌ ${guildName} does not trust you enough yet (${rel}/50).` : `❌ ${guildName} ti ještě dost nedůvěřuje (${rel}/50).`, true);
            return;
        }
        if ((GameState.inventory['zlaty_prut'] || 0) < 1) {
            UI.notify(lang === 'en' ? '❌ Requires 1 gold ingot — this must hurt.' : '❌ Vyžaduje 1 zlatý prut — musí to bolet.', true);
            return;
        }

        Game.removeItem('zlaty_prut', 1);
        pet.status = 'pending';
        pet.submittedAt = Date.now();
        if (!GameState.guildPravo) GameState.guildPravo = {};
        GameState.guildPravo[guildId] = { status: 'negotiating', mechanism: 'privilegium' };

        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel('📜 ' + (lang === 'en'
            ? `Petition for a Privilege sent to the Abbot on ${guildName}'s behalf. Reply expected in 24h.`
            : `Žádost o Privilegium k ${guildName} odeslána opatovi. Odpověď se čeká za 24 hodin.`), 'system');
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
            `📜 Žádost o Privilegium — ${GuildsDB[guildId].name}.`,
            `📜 Petition for a Privilege — ${GuildsDB[guildId].name_en}.`,
            `📜 Petitio de privilegio missa est.`);
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    },

    // Cechy — Dary/úplatky (cechy-a-prava-mrd.md §3.0, K3 Cesta B, 16.8.2026).
    // "Rychlá záchranná brzda" — okamžitej relation boost za cenu surovin,
    // na rozdíl od Cesty A (zakázky, náhodný, levnější) je tohle na
    // vyžádání, ale drahý a s cooldownem, ať nejde relation nafarmit
    // spamováním. Sud piva + med + svíce = "sud prémiového piva, medovina,
    // luxusní svíce" z historickýho podkladu, mapováno na existující itemy
    // (žádný nový items.js záznam — surgical).
    GUILD_GIFT_COST: { beer: 5, honey: 3, candle: 2 },
    GUILD_GIFT_RELATION: 10,
    GUILD_GIFT_COOLDOWN_MS: 86400000, // 24h na cech

    sendGuildGift: function (guildId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (typeof GuildsDB === 'undefined' || !GuildsDB[guildId]) return;
        const guildName = lang === 'en' ? GuildsDB[guildId].name_en : GuildsDB[guildId].name;

        if (!GameState.guildGiftCooldown) GameState.guildGiftCooldown = {};
        const lastGift = GameState.guildGiftCooldown[guildId] || 0;
        if (Date.now() - lastGift < PetitionManager.GUILD_GIFT_COOLDOWN_MS) {
            const hoursLeft = Math.ceil((PetitionManager.GUILD_GIFT_COOLDOWN_MS - (Date.now() - lastGift)) / 3600000);
            UI.notify(lang === 'en' ? `⏳ ${guildName} needs time to digest the last gift (${hoursLeft}h).` : `⏳ ${guildName} ještě tráví minulej dar (${hoursLeft}h).`, true);
            return;
        }

        for (const [item, amt] of Object.entries(PetitionManager.GUILD_GIFT_COST)) {
            if ((GameState.inventory[item] || 0) < amt) {
                const itemName = (typeof iName === 'function') ? iName(item) : item;
                UI.notify((lang === 'en' ? 'Not enough: ' : 'Nedostatek: ') + itemName + ' x' + amt, true);
                return;
            }
        }
        for (const [item, amt] of Object.entries(PetitionManager.GUILD_GIFT_COST)) { Game.removeItem(item, amt); }

        if (!GameState.guildRelation) GameState.guildRelation = {};
        const cur = GameState.guildRelation[guildId] || 0;
        GameState.guildRelation[guildId] = Math.max(0, Math.min(100, cur + PetitionManager.GUILD_GIFT_RELATION));
        GameState.guildGiftCooldown[guildId] = Date.now();

        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel('🎁 ' + (lang === 'en'
            ? `A barrel of beer, honey and fine candles sent to ${guildName}. The wheels of politics turn a little smoother.`
            : `Sud piva, med a jemné svíce poslány cechu: ${guildName}. Politická kolečka se protočila hladčeji.`), 'success');
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
            `🎁 Dar cechu — ${GuildsDB[guildId].name}.`,
            `🎁 A gift to the guild — ${GuildsDB[guildId].name_en}.`,
            `🎁 Munus collegio missum est.`);
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    },

    // Pozemky — rozhovor s opatem (pozemky-mrd.md §2, v1.3, 16.8.2026).
    // Dvoukrokovej, opakovatelnej dotaz — bez tech_regalia jen nasměruje
    // co studovat, s techem odemyká GameState.flags.pozemky_active natrvalo.
    // Mirror ostatních modal vzorů (NotificationSystem.modal), žádnej t().
    askAbbotAboutLand: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_regalia');

        if (GameState.flags && GameState.flags.pozemky_active) {
            UI.notify(lang === 'en' ? '✅ The Abbot already agreed — land is managed through Cellarium — Land.' : '✅ Opat už souhlasil — pozemky spravuješ přes Cellarium — Pozemky.', true);
            return;
        }

        if (!hasTech) {
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) NotificationSystem.modal({
                icon: '🏛️',
                title: lang === 'en' ? 'A word with the Abbot' : 'Slovo s opatem',
                text: lang === 'en'
                    ? "\"I welcome the thought of expanding our estate,\" the Abbot says, \"but such dealings with the Lord of the Manor demand more than good will. Study the Regalia first — then we shall speak again.\""
                    : '"Vítám myšlenku rozšířit naše panství," praví opat, "ale jednání se Zemským pánem si žádá víc než dobrou vůli. Nejdřív prostuduj Regálie — pak si znovu promluvíme."',
                choices: [{ label: lang === 'en' ? 'Understood' : 'Rozumím' }]
            });
            return;
        }

        if (!GameState.flags) GameState.flags = {};
        GameState.flags.pozemky_active = true;

        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) NotificationSystem.modal({
            icon: '🏛️',
            title: lang === 'en' ? 'A word with the Abbot' : 'Slovo s opatem',
            text: lang === 'en'
                ? "\"Now thou speakest with knowledge,\" the Abbot nods. \"I shall open dealings with the Lord of the Manor. Seek what land may be had in Cellarium — Land.\""
                : '"Teď mluvíš se znalostí," přikývne opat. "Zahájím jednání se Zemským pánem. Co je k mání za pozemky, hledej v Cellariu — Pozemky."',
            choices: [{ label: lang === 'en' ? 'Understood' : 'Rozumím' }]
        });
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
            '🏛️ Opat zahájil jednání se Zemským pánem o rozšíření panství.',
            '🏛️ The Abbot opened dealings with the Lord of the Manor to expand the estate.',
            '🏛️ Abbas cum domino de ampliatione fundi agere coepit.');
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    },

    buildUbytovnaTier: function (tier) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cfg = PetitionManager.UBYTOVNA_TIER_COSTS[tier];
        if (!cfg) return;
        const pet = GameState.ubytovnaPetition && GameState.ubytovnaPetition[tier];
        if (!pet || pet.status !== 'approved') {
            UI.notify(lang === 'en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
        }
        if (!GameState.storage) GameState.storage = {};
        if (!GameState.storage[tier]) GameState.storage[tier] = { built: false };
        if (GameState.storage[tier].built) {
            UI.notify(lang === 'en' ? 'Already built.' : 'Již postaveno.', true); return;
        }
        if (cfg.grose > 0 && (typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < cfg.grose) {
            UI.notify((lang === 'en' ? 'Not enough groats: ' : 'Nedostatek grošů: ') + cfg.grose, true); return;
        }
        for (const [item, amt] of Object.entries(cfg.items)) {
            if ((GameState.inventory[item] || 0) < amt) {
                const itemName = (typeof iName === 'function') ? iName(item) : item;
                UI.notify((lang === 'en' ? 'Not enough: ' : 'Nedostatek: ') + itemName + ' x' + amt, true); return;
            }
        }
        for (const [item, amt] of Object.entries(cfg.items)) { Game.removeItem(item, amt); }
        if (cfg.grose > 0 && typeof CellariumSystem !== 'undefined') CellariumSystem.addGrose(-cfg.grose);
        GameState.storage[tier].built = true;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel('🏗️ ' + (lang === 'en'
            ? 'Guesthouse expanded — ' + cfg.cap + ' beds now.'
            : 'Ubytovna rozšířena — teď ' + cfg.cap + ' lůžek.'), 'system');
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
            '🥾 Ubytovna rozšířena na ' + cfg.cap + ' lůžek.',
            '🥾 The Guesthouse was expanded to ' + cfg.cap + ' beds.',
            '🥾 Hospitium ampliatum est.');
        if (typeof CellariumSystem !== 'undefined') {
            if (!GameState.ui) GameState.ui = {};
            const _cel = document.getElementById('cellarium-content');
            if (_cel) _cel.outerHTML = CellariumSystem.renderCellariumContent();
        }
    },

    checkUbytovnaPetitions: function () {
        if (!GameState.ubytovnaPetition) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        const DAY_MS = 86400000;
        ['ubytovna_ii', 'ubytovna_iii', 'ubytovna_iv'].forEach(tier => {
            const pet = GameState.ubytovnaPetition[tier];
            if (!pet || pet.status !== 'pending') return;
            if (now - pet.submittedAt < DAY_MS) return;
            pet.status = 'approved';
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                UI.notifyPanel('✅ ' + (lang === 'en' ? 'The Abbot approved the guesthouse expansion.' : 'Opat schválil rozšíření Ubytovny.'), 'success');
            }
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
                '📜 Opat schválil rozšíření Ubytovny.',
                '📜 The Abbot approved the expansion of the Guesthouse.',
                '📜 Abbas hospitii ampliationem approbavit.');
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        });
    },

    // Cechy — Privilegium schválení (cechy-a-prava-mrd.md §3.1, 16.8.2026).
    // Mirror checkUbytovnaPetitions přesně. Re-validace relation při
    // schválení (na rozdíl od Ubytovny) — cena (zlaty_prut) se strhla už
    // při odeslání, ale vztah teoreticky mohl mezitím klesnout.
    checkGuildPetitions: function () {
        if (!GameState.guildPetition) return;
        if (typeof GUILDS_ACTIVE === 'undefined') return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        const DAY_MS = 86400000;
        GUILDS_ACTIVE.forEach(guildId => {
            const pet = GameState.guildPetition[guildId];
            if (!pet || pet.status !== 'pending') return;
            if (now - pet.submittedAt < DAY_MS) return;

            const guildName = lang === 'en' ? GuildsDB[guildId].name_en : GuildsDB[guildId].name;
            const rel = (GameState.guildRelation && GameState.guildRelation[guildId]) || 0;

            if (rel < 50) {
                pet.status = 'none';
                GameState.guildPravo[guildId] = { status: 'none', mechanism: null };
                if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel('❌ ' + (lang === 'en'
                    ? `${guildName} withdrew — trust had faded before the Abbot could conclude the matter.`
                    : `${guildName} žádost stáhl — důvěra vyprchala dřív, než opat věc dojednal.`), 'system');
            } else {
                pet.status = 'approved';
                GameState.guildPravo[guildId] = { status: 'granted', mechanism: 'privilegium' };
                if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel('✅ ' + (lang === 'en'
                    ? `The Abbot secured a Privilege from ${guildName}.`
                    : `Opat vyjednal Privilegium od cechu: ${guildName}.`), 'success');
                if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
                    `📜 Opat vyjednal Privilegium — ${GuildsDB[guildId].name}.`,
                    `📜 The Abbot secured a Privilege — ${GuildsDB[guildId].name_en}.`,
                    `📜 Abbas privilegium impetravit.`);
            }
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        });
    },

    // Pozemky — nákup parcely (pozemky-mrd.md §6, v1.3, 16.8.2026). Mirror
    // ubytovnaPetition/guildPetition vzoru, plně inline text. LandParcelsDB
    // je statická (mirror GuildsDB oprava) — mutable stav žije tady.
    LAND_DESKY_MS: 86400000, // 24h, "byrokracie ne fyzická práce" — mirror abbotPetition/guildPetition, ne Mola (4h)

    buyLandParcel: function (parcelId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.flags && GameState.flags.pozemky_active)) {
            UI.notify(lang === 'en' ? '❌ Speak with the Abbot first.' : '❌ Nejdřív promluv s opatem.', true);
            return;
        }
        if (typeof LandParcelsDB === 'undefined' || !LandParcelsDB[parcelId]) return;
        const parcel = LandParcelsDB[parcelId];
        const name = lang === 'en' ? (parcel.name_en || parcel.name) : parcel.name;

        if (!GameState.landParcels) GameState.landParcels = {};
        const existing = GameState.landParcels[parcelId];
        if (existing && existing.status !== 'none') {
            UI.notify(lang === 'en' ? '❌ Already acquired (or in progress).' : '❌ Už koupeno (nebo se vyřizuje).', true);
            return;
        }
        if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < parcel.price) {
            UI.notify((lang === 'en' ? 'Not enough groats: ' : 'Nedostatek grošů: ') + parcel.price, true);
            return;
        }

        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(-parcel.price);
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.recordCommissionIncome) {
            // Reuse jako výdaj — recordCommissionIncome píše 'sell'/kladně,
            // tady chceme zápornou položku, proto přímej zápis do transactions.
            if (!GameState.treasury) GameState.treasury = {};
            if (!GameState.treasury.transactions) GameState.treasury.transactions = [];
            GameState.treasury.transactions.unshift({
                date: new Date().toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' }),
                type: 'buy', itemId: null, name: name, qty: 1, price: parcel.price,
                entity: 'land', entityName: 'Zemský pán', entityName_en: 'Lord of the Manor',
                total: parcel.price,
            });
        }

        GameState.landParcels[parcelId] = { status: 'pending', purchasedAt: Date.now(), deskyCompleteAt: Date.now() + PetitionManager.LAND_DESKY_MS };

        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel('📜 ' + (lang === 'en'
            ? `${name} purchased — awaiting entry into the Land Register (~24h).`
            : `${name} koupen — čeká na zápis do Zemských desek (~24h).`), 'system');
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
            `🏛️ Koupen pozemek — ${parcel.name}.`,
            `🏛️ Land purchased — ${parcel.name_en || parcel.name}.`,
            `🏛️ Fundus emptus est.`);
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    },

    checkLandParcels: function () {
        if (!GameState.landParcels) return;
        if (typeof LandParcelsDB === 'undefined') return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        Object.keys(GameState.landParcels).forEach(parcelId => {
            const p = GameState.landParcels[parcelId];
            if (!p || p.status !== 'pending') return;
            if (now < p.deskyCompleteAt) return;
            const parcel = LandParcelsDB[parcelId];
            if (!parcel) return;
            p.status = 'owned';
            const name = lang === 'en' ? (parcel.name_en || parcel.name) : parcel.name;
            if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel('✅ ' + (lang === 'en'
                ? `${name} entered into the Land Register — the parcel is now thine.`
                : `${name} zapsán do Zemských desek — parcela je teď tvoje.`), 'success');
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
                `🏛️ Zápis do Zemských desek dokončen — ${parcel.name}.`,
                `🏛️ Land Register entry complete — ${parcel.name_en || parcel.name}.`,
                `🏛️ Fundus in tabulas terrae inscriptus est.`);
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        });
    },
};
