// ═══ src/core/managers/HealthCareManager.js ═══
// Extrakce z game.js (Krok 2 / D13, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Valetudo/Infirmarium (NPC zdravi). Původně Game.* na
// řádcích 3774-3814 + 4802-4921 + 5594-5935 (tři nesouvislé bloky, HEAD po
// D1-D5+D9+D10+D12+cleanup). Chování beze změny — pouze přesun + přepsání
// this.removeItem -> Game.removeItem (D8) a this.DORMITORIUM_ROSTER_TRAIT_BONUS/
// this._konvrsTraits -> Game.* (D14, ještě needitováno).
// POZOR — poučení z bugu 19.8.2026 (Cellarium crash): _npcHealthTick je
// "privátní" (podtržítko), ale VOLá SE I MIMO tento blok (game.js:6084,
// D14 tick orchestrace, přes this._npcHealthTick()). Delegující stub v
// game.js proto MUSÍ existovat i pro tuhle "privátní" metodu — ověřeno
// systémovým gtřepem přes CELÝ game.js (ne jen původní blok), ne jen přes
// blínou Game.X( kontrolu jako u předchozích domén.
const HealthCareManager = {
    // infirmarium-dashboard-mirror (30.8.2026) — akce se dřív re-renderovaly
    // jen přes SaeculumSystem.switchEntity(), takže pokud je akce spuštěná
    // z NOVÉHO zrcadlenýho tlačítka v InfirmariumSystem tabu, ten zůstal
    // stale. Tenhle helper refreshne oba, kterej je zrovna v DOMu.
    _refreshInfirmariumTab: function () {
        const el = document.getElementById('home-infirmarium-content');
        if (el && typeof InfirmariumSystem !== 'undefined') el.innerHTML = InfirmariumSystem.renderInfirmariumTab();
    },

    healthConditionsDailyTick: function () {
        if (typeof HealthSystem === 'undefined') return;
        if (!GameState.healthTick) GameState.healthTick = { lastCheck: 0 };
        const DAY = 24 * 60 * 60 * 1000;
        if (Date.now() - (GameState.healthTick.lastCheck || 0) < DAY) return;
        GameState.healthTick.lastCheck = Date.now();

        const month = new Date().getMonth() + 1; // 1–12
        const isWinter = (month === 12 || month === 1 || month === 2);
        const isLateWinter = (month === 2 || month === 3); // scurvy

        // Revma z klečení — zima, mírná šance po Officiu/Kapitule
        if (isWinter && !HealthSystem.isActive('rheumatism') && Math.random() < 0.015) {
            HealthSystem.addCondition('rheumatism');
        }

        // Kurděje — pozdní zima, nedostatek ovoce v inventáři (méně než 3 kusy)
        if (isLateWinter && !HealthSystem.isActive('scurvy')) {
            const fruitStock = (GameState.inventory['berries'] || 0) + (GameState.inventory['dried_wild_fruit'] || 0)
                + (GameState.inventory['apple'] || 0) + (GameState.inventory['pear'] || 0);
            if (fruitStock < 3 && Math.random() < 0.03) {
                HealthSystem.addCondition('scurvy');
            }
        }

        // Vši/Svrab — vyšší šance, pokud je aktivní konvrš na Dvoře (kontakt
        // s laickými pracovníky a zvířaty)
        const hasDvurWorker = GameState.conversi && GameState.conversi.some(k => k.task === 'dvur');
        if (hasDvurWorker) {
            if (!HealthSystem.isActive('lice') && Math.random() < 0.01) HealthSystem.addCondition('lice');
            if (!HealthSystem.isActive('scabies') && Math.random() < 0.008) HealthSystem.addCondition('scabies');
        }

        // Dna — přemíra masa/vína za poslední týden
        if (!HealthSystem.isActive('gout') && typeof VigorSystem !== 'undefined' && VigorSystem.goutWeeklyScore) {
            const score = VigorSystem.goutWeeklyScore();
            if (score >= 8 && Math.random() < 0.05) {
                HealthSystem.addCondition('gout');
            }
        }
    },

    applySpongiaToInjured: function (entityId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const k = (GameState.conversi || []).find(x => x.id === entityId);
        if (!k) return;
        const now = Date.now();
        if (!k.injuredUntil || k.injuredUntil <= now) {
            UI.notify(lang === 'en' ? 'Not injured.' : 'Není zraněnej.', true); return;
        }
        if ((GameState.inventory['spongia_somnifera'] || 0) < 1) {
            UI.notify(lang === 'en' ? 'You have none in stock.' : 'Nemáš to na skladě.', true); return;
        }
        Game.removeItem('spongia_somnifera', 1);
        const shortened = now + 4 * 60 * 60 * 1000;
        if (shortened < k.injuredUntil) k.injuredUntil = shortened;
        UI.notifyPanel('🧽 ' + (lang === 'en' ? k.name + "'s pain is eased — back on his feet sooner." : k.name + 'ovi ulevila bolest — brzy na nohou.'), 'success');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('conversi');
        HealthCareManager._refreshInfirmariumTab();
    },

    // Capellanus — duchovní útěcha pacientovi, jednou za pobyt. Jinej efekt než
    // Infirmarius (stress/temptation u bratra, mood u konvrše) — ne další
    // vrstva do infirmariumCareModifier, ať se role nescvaknou do jednoho čísla.
    hearConfession: function (entityId, isBrother) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (!entity || !entity.admittedToInfirmarium) return;
        const hasCapellanus = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_capellanus');
        if (!hasCapellanus) {
            UI.notify(lang === 'en' ? 'No Capellanus to hear confession.' : 'Není Capellanus, kdo by vyslechl zpověď.', true); return;
        }
        if (entity.confessedThisStay) return;
        entity.confessedThisStay = true;
        if (isBrother) {
            entity.stress = Math.max(0, (entity.stress || 0) - 20);
            entity.temptation = Math.max(0, (entity.temptation || 0) - 20);
        } else {
            entity.mood = Math.min(100, (entity.mood || 0) + 15);
        }
        UI.notifyPanel('🙏 ' + (lang === 'en' ? entity.name + ' finds peace in confession.' : entity.name + ' nalezl klid ve zpovědi.'), 'success');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
        HealthCareManager._refreshInfirmariumTab();
    },

    hireChirurgus: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const relation = (GameState.contactRelation && GameState.contactRelation['chirurgus']) || 0;
        if (relation < 30) {
            UI.notify(lang === 'en' ? 'Not enough trust yet.' : 'Zatím nedostatečná důvěra.', true); return;
        }
        if (GameState.chirurgus && GameState.chirurgus.hired) return;
        GameState.chirurgus = { hired: true, wageOwed: 0, nextWage: Date.now() + 7 * 24 * 60 * 60 * 1000 };
        UI.notifyPanel('🩹 ' + (lang === 'en' ? 'The Chirurgus now serves the monastery.' : 'Chirurgus teď slouží klášteru.'), 'success');
        Game.addKronikaEntry('minor', '🩹 Chirurgus najat.', '🩹 Chirurgus hired.', '🩹 Chirurgus conductus est.');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.render();
    },

    // Denní kontrola týdenní mzdy Chirurga — samostatná od Conversi mzdový smyčky
    // (Chirurgus není v GameState.conversi, je externí Clientela kontakt).
    checkChirurgusWage: function () {
        if (!GameState.chirurgus || !GameState.chirurgus.hired) return;
        if (Date.now() < GameState.chirurgus.nextWage) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const due = 3 + (GameState.chirurgus.wageOwed || 0);
        const grose = (typeof CellariumSystem !== 'undefined') ? CellariumSystem.getGrose() : 0;
        if (grose >= due) {
            CellariumSystem.addGrose(-due, { title: lang === 'en' ? 'Chirurgus wage' : 'Výplata Chirurga', source: 'Chirurgus', source_en: 'Chirurgus' });
            GameState.chirurgus.wageOwed = 0;
            UI.notifyPanel('💰 ' + (lang === 'en' ? 'Chirurgus paid: ' + due + ' g.' : 'Chirurgus vyplacen: ' + due + ' g.'), 'system');
        } else {
            GameState.chirurgus.hired = false;
            GameState.chirurgus.wageOwed = 0;
            UI.notifyPanel('🚪 ' + (lang === 'en' ? 'The Chirurgus left, unpaid.' : 'Chirurgus odešel, neplacen.'), 'warning');
            Game.addKronikaEntry('minor', '🚪 Chirurgus opustil klášter, neplacen.', '🚪 The Chirurgus left the monastery, unpaid.', '');
        }
        GameState.chirurgus.nextWage = Date.now() + 7 * 24 * 60 * 60 * 1000;
        Game.save();
    },

    // Flebotomie — pouštění žilou. Homo Signorum: nebezpečnej den = úplněk NEBO
    // měsíc ve vodním znamení (Rak/Štír/Ryby — přebytek vlhkosti). Cooldown 21
    // dní/osobu (dobově 4-5×/rok = zhruba jednou za ~10 týdnů, 21 dní je spodní hranice).
    performFlebotomie: function (entityId, isBrother) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.chirurgus || !GameState.chirurgus.hired) {
            UI.notify(lang === 'en' ? 'No Chirurgus hired.' : 'Chirurgus není najatej.', true); return;
        }
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (!entity) return;
        const now = Date.now();
        const COOLDOWN = 21 * 24 * 60 * 60 * 1000;
        if (entity.lastFlebotomie && now - entity.lastFlebotomie < COOLDOWN) {
            const daysLeft = Math.ceil((COOLDOWN - (now - entity.lastFlebotomie)) / (24 * 60 * 60 * 1000));
            UI.notify(lang === 'en' ? 'Too soon — ' + daysLeft + 'd until safe again.' : 'Ještě brzy — bezpečný za ' + daysLeft + ' d.', true); return;
        }
        const d = new Date();
        const moonPhase = (typeof CalendarSystem !== 'undefined') ? CalendarSystem.getLunarForDay(d.getFullYear(), d.getMonth() + 1, d.getDate()) : '🌗';
        const zodiacIdx = (typeof CalendarSystem !== 'undefined' && CalendarSystem.getZodiacForMoonDay) ? CalendarSystem.getZodiacForMoonDay(d.getFullYear(), d.getMonth() + 1, d.getDate()) : 0;
        const zodiac = (typeof CalendarSystem !== 'undefined' && CalendarSystem.ZODIAC_SIGNS) ? CalendarSystem.ZODIAC_SIGNS[zodiacIdx] : null;
        const zodiacUnsafe = (typeof CalendarSystem !== 'undefined' && CalendarSystem.ZODIAC_UNSAFE_IDX) ? CalendarSystem.ZODIAC_UNSAFE_IDX.includes(zodiacIdx) : false;
        const unsafe = moonPhase === '🌕' || zodiacUnsafe;
        const zodiacName = zodiac ? (lang === 'en' ? zodiac.en : zodiac.cs) : '';
        const bodyPart = zodiac ? (lang === 'en' ? zodiac.bodyPart_en : zodiac.bodyPart_cs) : '';
        entity.lastFlebotomie = now;
        if (unsafe) {
            entity.fatigue = Math.min(100, (entity.fatigue || 0) + 15);
            UI.notifyPanel((zodiac ? zodiac.icon : '🌕') + ' ' + (lang === 'en'
                ? entity.name + ' was bled under ' + zodiacName + ' (' + bodyPart + ') — worse for it.'
                : entity.name + ' pouštěn žilou ve znamení ' + zodiacName + ' (' + bodyPart + ') — na škodu.'), 'warning');
        } else {
            entity.fatigue = Math.max(0, (entity.fatigue || 0) - 15);
            UI.notifyPanel('🩸 ' + (lang === 'en'
                ? entity.name + ' was bled under ' + zodiacName + ' — fatigue eased.'
                : entity.name + ' pouštěn žilou ve znamení ' + zodiacName + ' — únava ulevena.'), 'success');
        }
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
        HealthCareManager._refreshInfirmariumTab();
    },

    // ── Valetudo pro Conversi/Dormitorium ────────────────────────────────
    // Task/tab → nemoci, na které je ta práce riziková (skupina C).
    NPC_HEALTH_RISK: {
        zahony: 'cold', sad: 'cold', pole: 'cold', vinohrad: 'cold',
        apiarium: 'cold', piscina: 'cold',
        dvur: 'lice', hrbitov: 'lice',
        kostel: 'rheumatism',
        athanor: 'eye_strain', scriptorium: 'eye_strain',
    },
    // Sdílený zdroj (skupina B) — voda/úplavice škálují s GameState.well.purity
    // (stejný signál jako hráčova mouchová/nemocná mechanika ve WellSystem);
    // Oheň sv. Antonína/Kurděje zůstávají plochá aproximace (žádný centrální
    // čítač kvality žita/ovoce po ruce).
    NPC_SHARED_RISK: ['water_sickness', 'dysentery', 'ergot_fire', 'scurvy'],
    // Nákazlivé (skupina A) — šíří se uvnitř vlastního poolu (conversi mezi
    // sebou / bratři mezi sebou), sdílený dormitář a nářadí.
    NPC_CONTAGIOUS: ['scabies', 'lice'],

    // monk-hunger-mrd (14.8.2026) — hlad (unfedStreak z _runRefectory) jako
    // samostatný, přídavný zdroj rizika kurdějí/úplavice/malomyslnosti —
    // nezávislý na existujících task/shared-risk rollech výš, ne jejich úprava.
    HUNGER_ILLNESS: { threshold: 2, step: 0.02, cap: 0.10, ids: ['scurvy', 'dysentery', 'acedia'] },

    _npcHealthTick: function () {
        const conversi = GameState.conversi || [];
        const brothers = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
        const month = new Date().getMonth() + 1;
        const isSummer = month >= 5 && month <= 9;
        const isWinter = month === 12 || month <= 2;
        const isLateWinter = month === 2 || month === 3; // shodné s hráčovým healthConditionsDailyTick
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        const applyTick = (entity, isBrother) => {
            if (!entity.conditions) entity.conditions = {};
            Object.keys(entity.conditions).forEach(id => {
                const inst = entity.conditions[id];
                const def = HealthConditionsDB[id];
                if (!def || !inst) { delete entity.conditions[id]; return; }
                if (Date.now() >= inst.expiresAt) {
                    delete entity.conditions[id];
                    // Oheň sv. Antonína — jediná neduhová (bez léku), vzácná a nebezpečná;
                    // jediný spouštěč úmrtí NPC. Infirmarium teď vnáší modifikátor
                    // podle kvality péče — viz _checkErgotDeath/infirmariumCareModifier.
                    if (id === 'ergot_fire') this._checkErgotDeath(entity, isBrother);
                    // Uzdraven — pokud byl v péči Infirmaria a už nemá žádný neduh, propustit.
                    if (entity.admittedToInfirmarium && !Object.keys(entity.conditions).length) {
                        entity.admittedToInfirmarium = false;
                        if (GameState.infirmarium) {
                            GameState.infirmarium.patients = (GameState.infirmarium.patients || []).filter(p => p.entityId !== entity.id);
                        }
                    }
                    return;
                }
                // Denní tick = 24h najednou; NPC tlumeněji než hráč (0.3×),
                // ať se nerozpadnou po jednom dni smůly.
                // V péči Infirmaria (lůžko, teplo, strava) se dopad neduhu tlumí na polovinu.
                const careHalf = entity.admittedToInfirmarium ? 0.5 : 1;
                if (def.tickHour && typeof def.tickHour.fatigue === 'number') {
                    entity.fatigue = Math.min(100, (entity.fatigue || 0) + def.tickHour.fatigue * 24 * 0.3 * careHalf);
                }
                if (def.tickHour && typeof def.tickHour.satiety === 'number' && typeof entity.mood === 'number') {
                    entity.mood = Math.max(0, entity.mood - Math.abs(def.tickHour.satiety) * 24 * 0.1 * careHalf);
                }
            });
        };

        const tryInfect = (entity, id, chance) => {
            if (!entity.conditions) entity.conditions = {};
            if (entity.conditions[id]) return false;
            if (Math.random() >= chance) return false;
            const def = HealthConditionsDB[id];
            if (!def) return false;
            entity.conditions[id] = { startedAt: Date.now(), expiresAt: Date.now() + def.durationHours * 3600000 };
            if (def.onApply) {
                if (typeof def.onApply.fatigue === 'number') entity.fatigue = Math.min(100, (entity.fatigue || 0) + def.onApply.fatigue);
                if (typeof def.onApply.satiety === 'number' && typeof entity.mood === 'number') entity.mood = Math.max(0, entity.mood + def.onApply.satiety * 0.5);
            }
            const name = lang === 'en' ? def.name_en : def.name;
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                UI.notifyPanel('🤒 ' + entity.name + ' — ' + name + '.', 'warning');
            }
            return true;
        };

        [conversi, brothers].forEach(pool => {
            // Nákaza — pokud už v poolu někdo aktivní má, ostatní mají zvýšené riziko.
            this.NPC_CONTAGIOUS.forEach(id => {
                const infected = pool.filter(e => e.conditions && e.conditions[id]).length;
                pool.forEach(entity => {
                    applyTick(entity, pool === brothers);
                    const task = entity.task || entity.assignedTab;
                    const taskRisk = this.NPC_HEALTH_RISK[task] === id ? 0.02 : 0;
                    // Svrab nemá task-vazbu (na rozdíl od Vší/dvur) — "sdílený
                    // dormitář a nářadí" platí pro kohokoliv aktivního v poolu,
                    // proto malá základní šance, ne jen nákaza od nuly nikdy nevznikne.
                    const baseline = (id === 'scabies' && task) ? 0.004 : 0;
                    const contagionBonus = infected > 0 && !entity.conditions[id] ? 0.03 * infected : 0;
                    tryInfect(entity, id, Math.min(0.25, taskRisk + baseline + contagionBonus));
                });
            });
        });

        // Ostatní task-vázané (skupina C) — mimo nákazlivé, řešené výš
        [...conversi, ...brothers].forEach(entity => {
            const task = entity.task || entity.assignedTab;
            if (!task) return;
            const riskId = this.NPC_HEALTH_RISK[task];
            if (riskId && !this.NPC_CONTAGIOUS.includes(riskId)) {
                let chance = 0.02;
                if (riskId === 'cold' && isWinter) chance = 0.04;
                tryInfect(entity, riskId, chance);
            }
            if (task === 'apiarium' || task === 'piscina') {
                if (isSummer) tryInfect(entity, 'mosquito_bites', 0.03);
            }
            if (task === 'scriptorium') {
                tryInfect(entity, 'writers_cramp', 0.015);
                tryInfect(entity, 'saturnismus', 0.008);
                tryInfect(entity, 'acedia', 0.01);
            }
            if (task === 'piscina') tryInfect(entity, 'ague', isSummer ? 0.02 : 0.01);
        });

        // Nespavost — jen konvrši, zvýšená pokud je v partě 'chrapoun'.
        const snorerPresent = conversi.some(k => Game._konvrsTraits(k).includes('chrapoun'));
        conversi.forEach(k => {
            tryInfect(k, 'insomnia', snorerPresent ? 0.05 : 0.015);
        });

        // Dna — hráč to sleduje přes goutLog (jednotlivé konzumace), NPC
        // jednotlivě nejedí — proxy: jsou-li klášterní zásoby masa/vína
        // aktuálně bohaté, hodovalo se, riziko roste. Sdílí GOUT_*_ITEMS
        // seznam z VigorSystem, ať to není nezávislé číslo.
        {
            let meatStock = 0, wineStock = 0;
            if (typeof VigorSystem !== 'undefined') {
                (VigorSystem.GOUT_MEAT_ITEMS || []).forEach(id => { meatStock += (GameState.inventory[id] || 0); });
                (VigorSystem.GOUT_WINE_ITEMS || []).forEach(id => { wineStock += (GameState.inventory[id] || 0); });
            }
            const feasting = meatStock >= 10 && wineStock >= 5;
            [...conversi, ...brothers].forEach(entity => {
                tryInfect(entity, 'gout', feasting ? 0.03 : 0.005);
            });
        }

        // Sdílený zdroj (skupina B) — voda/úplavice škálují s purity studny.
        const wellPurity = (GameState.well && typeof GameState.well.purity === 'number') ? GameState.well.purity : 100;
        const fruitStock = (GameState.inventory['berries'] || 0) + (GameState.inventory['dried_wild_fruit'] || 0)
            + (GameState.inventory['apple'] || 0) + (GameState.inventory['pear'] || 0);
        [...conversi, ...brothers].forEach(entity => {
            const task = entity.task || entity.assignedTab;
            if (!task) return;
            const id = this.NPC_SHARED_RISK[Math.floor(Math.random() * this.NPC_SHARED_RISK.length)];
            // Kurděje: shodné okno s hráčem (pozdní zima + sklad ovoce <3 ks — sdílené
            // zásoby, funguje 1:1 i pro NPC na rozdíl od gutu, viz níž).
            if (id === 'scurvy' && (!isLateWinter || fruitStock >= 3)) return;
            let chance = 0.008;
            if (id === 'water_sickness' || id === 'dysentery') {
                chance = wellPurity < 30 ? 0.02 : wellPurity < 70 ? 0.01 : 0.002;
                if (id === 'dysentery') chance *= 0.4; // těžší varianta, vzácnější
            }
            tryInfect(entity, id, chance);
        });

        // monk-hunger-mrd (14.8.2026) — hlad (unfedStreak) zvyšuje riziko
        // kurdějí/úplavice/malomyslnosti, samostatně pro konvrše i mnichy.
        // Přídavné rolly, nezávislé na task/shared-risk blocích výš.
        {
            const hi = this.HUNGER_ILLNESS;
            [...conversi, ...brothers].forEach(entity => {
                const streak = entity.unfedStreak || 0;
                if (streak < hi.threshold) return;
                const bonus = Math.min(hi.cap, hi.step * (streak - 1));
                hi.ids.forEach(id => tryInfect(entity, id, bonus));
            });
        }

        Game.save();
    },

    // Riziko úmrtí na Oheň sv. Antonína — jediná neduhová bez léku (rare & dangerous).
    // Mnich má nižší riziko (teplo, lepší strava) než konvrš. Plochá čísla zatím —
    // Infirmarium (Medicus/Apothecarius péče) sem časem přidá modifikátor kvality.
    ERGOT_DEATH_CHANCE: { brother: 0.08, konvrs: 0.18 },

    _checkErgotDeath: function (entity, isBrother) {
        let chance = isBrother ? this.ERGOT_DEATH_CHANCE.brother : this.ERGOT_DEATH_CHANCE.konvrs;
        if (entity.admittedToInfirmarium) chance *= this.infirmariumCareModifier();
        if (Math.random() >= chance) return;
        this._npcDies(entity, isBrother, 'ergot_fire');
    },

    // Kvalita péče Infirmaria — násobitel (nižší = lepší) na death chance
    // a další budoucí healing výpočty. Tři sčítající se vrstvy:
    // (1) samotné lůžko/teplo/klid, (2) obsazení Servitor/Coquus/Balneator
    // (Hortulanus se nepočítá — ten krmí až budoucí Apothecarius řetěz),
    // (3) CHRONICON — komunita se už dřív rozhodla bdít nad nemocnými.
    infirmariumCareModifier: function () {
        let mod = 1.0;
        mod -= 0.15; // lůžko samo o sobě
        ['servitor', 'coquus', 'balneator'].forEach(taskId => {
            if ((GameState.conversi || []).some(k => k.task === taskId)) mod -= 0.10;
        });
        // Infirmarius (mnišský dohled) — jediná ze 4 mnišských rolí s funkcí zatím;
        // Medicus/Apothecarius/Capellanus jsou vědomej stub, čekají na diagnostiku/
        // produkční řetězec/zpověď v dalších sprintech.
        if ((GameState.dormitorium && GameState.dormitorium.brothers || []).some(b => b.assignedTab === 'infirmarium_infirmarius')) mod -= 0.10;
        if (GameState.flags && GameState.flags.chroniconPlagueBolstered) mod -= 0.10;
        return Math.max(0.2, mod); // floor — nikdy úplně zadarmo
    },

    // Přijetí nemocného mnicha/konvrše do Infirmaria — stahuje z práce,
    // výměnou za lepší šanci na uzdravení (viz infirmariumCareModifier).
    admitToInfirmarium: function (entityId, isBrother) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.infirmarium) GameState.infirmarium = { beds: 3, patients: [] };
        const inf = GameState.infirmarium;
        if (inf.patients.length >= inf.beds) {
            UI.notify(lang === 'en' ? 'No free bed.' : 'Žádná volná postel.', true); return;
        }
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (!entity) return;
        if (!entity.conditions || !Object.keys(entity.conditions).length) {
            UI.notify(lang === 'en' ? 'Nothing to treat.' : 'Není co léčit.', true); return;
        }
        if (entity.admittedToInfirmarium) return;
        entity.admittedToInfirmarium = true;
        entity.confessedThisStay = false;
        if (isBrother) entity.assignedTab = null; else entity.task = null;
        inf.patients.push({ entityId: entityId, isBrother: isBrother, admittedAt: Date.now() });
        UI.notifyPanel('🩺 ' + (lang === 'en' ? entity.name + ' admitted to the infirmary.' : entity.name + ' přijat do Infirmaria.'), 'system');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
        HealthCareManager._refreshInfirmariumTab();
    },

    dischargeFromInfirmarium: function (entityId, isBrother) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.infirmarium) GameState.infirmarium = { beds: 3, patients: [] };
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (entity) entity.admittedToInfirmarium = false;
        GameState.infirmarium.patients = (GameState.infirmarium.patients || []).filter(p => p.entityId !== entityId);
        if (entity) UI.notifyPanel('🩺 ' + (lang === 'en' ? entity.name + ' discharged from the infirmary.' : entity.name + ' propuštěn z Infirmaria.'), 'system');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
        HealthCareManager._refreshInfirmariumTab();
    },

    // Apothecarius podá lék admitted pacientovi — spotřebuje 1× item z inventáře,
    // vyléčí přesně ten neduh, kterej ho v cures[] uvádí (viz health.js).
    // Bez přiřazenýho Apothecaria (mnišská role) tahle akce vůbec nejde spustit.
    administerCure: function (entityId, isBrother, itemId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (!entity || !entity.conditions) return;
        const hasApothecarius = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_apothecarius');
        if (!hasApothecarius) {
            UI.notify(lang === 'en' ? 'No Apothecarius to prepare the dose.' : 'Není Apothecarius, kdo by dávku připravil.', true); return;
        }
        const conditionId = Object.keys(entity.conditions).find(id => {
            const def = HealthConditionsDB[id];
            return def && def.cures && def.cures.includes(itemId);
        });
        if (!conditionId) {
            UI.notify(lang === 'en' ? 'This remedy does not match any ailment here.' : 'Tenhle lék na nic z toho nesedí.', true); return;
        }
        if ((GameState.inventory[itemId] || 0) < 1) {
            UI.notify(lang === 'en' ? 'You have none of this in stock.' : 'Nemáš to na skladě.', true); return;
        }
        Game.removeItem(itemId, 1);
        delete entity.conditions[conditionId];
        const condDef = HealthConditionsDB[conditionId];
        const condName = condDef ? (lang === 'en' ? condDef.name_en : condDef.name) : conditionId;
        UI.notifyPanel('⚕️ ' + (lang === 'en' ? entity.name + ' cured of ' + condName + '.' : entity.name + ' vyléčen z ' + condName + '.'), 'system');
        if (entity.admittedToInfirmarium && !Object.keys(entity.conditions).length) {
            entity.admittedToInfirmarium = false;
            if (GameState.infirmarium) {
                GameState.infirmarium.patients = (GameState.infirmarium.patients || []).filter(p => p.entityId !== entity.id);
            }
        }
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
        HealthCareManager._refreshInfirmariumTab();
    },

    // Trvalé úmrtí — Rajský dvůr (vnitřní pohřebiště komunity), NE farní Hřbitov
    // (ten je jen pro farní rodiny přes parishEventTick — historicky odlišené prostory).
    // Okamžitá náhrada stejnou postavou z rosteru (Bouvard: "vlastní variace do rosteru").
    _npcDies: function (entity, isBrother, cause) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const name = entity.name;
        const rosterId = entity.rosterId || null;

        if (isBrother) {
            GameState.dormitorium.brothers = (GameState.dormitorium.brothers || []).filter(b => b !== entity);
        } else {
            GameState.conversi = (GameState.conversi || []).filter(k => k !== entity);
        }

        if (!GameState.rajskyDvur) GameState.rajskyDvur = { graves: [] };
        GameState.rajskyDvur.graves.push({ name: name, rosterId: rosterId, ts: Date.now(), cause: cause, wasBrother: isBrother });

        // Officium defunctorum — krátký komunitní stav, žádná nová role potřeba
        if (!GameState.flags) GameState.flags = {};
        GameState.flags.officiumDefunctorumUntil = Date.now() + 3 * 24 * 60 * 60 * 1000;

        UI.notifyPanel('☦️ ' + (lang === 'en' ? name + ' has died.' : name + ' zemřel.'), 'warning');
        Game.addKronikaEntry('important',
            '☦️ ' + name + ' zemřel. Requiescat in pace.',
            '☦️ ' + name + ' has died. Requiescat in pace.',
            '☦️ Frater migravit ad Dominum.');

        if (isBrother) this._respawnBrother(rosterId); else this._respawnKonvrs(rosterId);
        Game.save();
    },

    _respawnBrother: function (rosterId) {
        if (!GameState.dormitorium) GameState.dormitorium = { brothers: [] };
        if (!GameState.dormitorium.brothers) GameState.dormitorium.brothers = [];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const rec = (rosterId && typeof DormitoriumRosterDB !== 'undefined') ? DormitoriumRosterDB[rosterId] : null;
        const name = rec ? rec.name : (lang === 'en' ? 'Brother' : 'Bratr');
        const brother = {
            id: 'brother_' + Date.now(), rosterId: rosterId, name: name, hiredAt: Date.now(),
            assignedTab: null, xp: {}, fatigue: 0, mood: 60, loyalty: 30, stress: 0, temptation: 0,
            traits: { piety: 0, obedience: 0, asceticism: 0, erudition: 0, focus: 0, craftsmanship: 0, eloquence: 0, vigor: 0 },
        };
        const rosterBonus = Game.DORMITORIUM_ROSTER_TRAIT_BONUS[rosterId];
        if (rosterBonus) rosterBonus.forEach(key => { if (typeof brother.traits[key] === 'number') brother.traits[key] = Math.min(100, brother.traits[key] + 10); });
        GameState.dormitorium.brothers.push(brother);
        UI.notifyPanel('📿 ' + (lang === 'en' ? name + ' has taken his vows anew and joined the community.' : name + ' znovu složil sliby a připojil se ke komunitě.'), 'success');
    },

    _respawnKonvrs: function (rosterId) {
        if (!GameState.conversi) GameState.conversi = [];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const rec = (rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[rosterId] : null;
        const name = rec ? rec.name : (lang === 'en' ? 'Lay brother' : 'Konvrš');
        const konvrs = { id: 'konvrs_' + Date.now(), rosterId: rosterId, name: name, hiredAt: Date.now(), fatigue: 0 };
        GameState.conversi.push(konvrs);
        UI.notifyPanel('✝️ ' + (lang === 'en' ? name + ' has taken his vows anew and joined the community.' : name + ' znovu složil sliby a připojil se ke komunitě.'), 'success');
    },
};
