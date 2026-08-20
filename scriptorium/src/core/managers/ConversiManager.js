// ═══ src/core/managers/ConversiManager.js ═══
// Extrakce z game.js (Krok 2 / D14 + D15 merge, refactoring-audit-mrd-
// 19-8-2026.md §2), 20.8.2026. Domain: Conversi/Dormitorium (jádro
// pracovní síly kláštera) + Manufaktura (D15, sloučeno sem — souvisí
// obsahově). Největší a nejprovázanější extrakce z celé sekvence.
// Původně Game.* na řádcích 1184-1193 + 1214-1688 + 1703-2369 +
// 2381-3537 (čtyři nesouvislé bloky, HEAD po D1-D5+D7-D13+cleanup).
// Chování beze změny — pouze přesun + přepsání this.addItem/removeItem/
// addKronikaEntry -> Game.* (D8/D9, hotovo dřív) a self-referencí
// Game.isOfficiumHours/_showKapitulaModal -> ConversiManager.*.
// 5 datových konstant má externí čtenáře mimo tuto doménu (KONVRS_NAMES
// z ChroniconSystem.js, CONVERSI_TASKS a REFECTORY_FOODS ze
// SaeculumSystem.js, DORMITORIUM_ROSTER_TRAIT_BONUS z HealthCareManager.js,
// DORMITORIUM_TAB_TRAITS z init() v game.js samotném) — aliasy v game.js
// přidány PREVENTIVNĚ (poučeno z MILL_TIERS/PARISH_SURNAMES bugů).
// conversiCapacity (D10 sdílená, viz nález 19.8.) a vitreaGrantStartPool-
// style regrese (D10, 20.8.) — obojí příklady stejné třídy chyby, kterou
// tenhle preventivní alias-sweep cílí předejít, ne opravovat po faktu.
const ConversiManager = {
    // ── CONVERSI — holý skelet (jméno + slot) ───────────────────────────────
    KONVRS_NAMES: ['Jakub', 'Matěj', 'Ondřej', 'Šimon', 'Tomáš', 'Vojtěch', 'Blažej', 'Havel', 'Prokop', 'Bartoloměj', 'Jiljí', 'Řehoř', 'Vít', 'Bonifác', 'Kliment'],

    conversiCapacity: function () {
        const s = GameState.storage || {};
        if (s.domus_conversorum_iii && s.domus_conversorum_iii.built) return 20;
        if (s.domus_conversorum_ii && s.domus_conversorum_ii.built) return 5;
        if (s.domus_conversorum_i && s.domus_conversorum_i.built) return 2;
        return 0;
    },

    // ── DORMITORIUM — kapacita bratrů (mniši/skriptoři, manažerská vrstva) ──
    dormitoriumCapacity: function () {
        const s = GameState.storage || {};
        if (s.dormitorium_iii && s.dormitorium_iii.built) return 10;
        if (s.dormitorium_ii && s.dormitorium_ii.built) return 6;
        if (s.dormitorium_i && s.dormitorium_i.built) return 3;
        return 0;
    },

    // ── DORMITORIUM — XP/úroveň specializace (odvozená z assignedTab) ──
    // Úroveň se nově počítá z PRIMÁRNÍ vlastnosti pro daný tab (viz
    // DORMITORIUM_TAB_TRAITS), ne z odděleného xp[tabId] čítače — jeden zdroj
    // pravdy. Škála prahů zdvojnásobena oproti starému [0,15,50,120], protože
    // primární vlastnost roste +2/tick (dormitoriumAddXp), staré XP jen +1/tick.
    // Fallback na starý xp[tabId] systém zůstává pro jistotu, kdyby tab neměl
    // definovanou primární vlastnost v DORMITORIUM_TAB_TRAITS.
    DORMITORIUM_XP_THRESHOLDS: [0, 30, 100, 240], // index = level-1 (1-4), škála traits (0-100 cap ale růst neomezený zde)
    DORMITORIUM_LEVEL_MULT: [1.0, 1.10, 1.20, 1.30],

    dormitoriumBrotherLevel: function (brother, tabId) {
        const map = this.DORMITORIUM_TAB_TRAITS[tabId];
        const th = this.DORMITORIUM_XP_THRESHOLDS;
        let value;
        if (map && brother.traits && typeof brother.traits[map.primary] === 'number') {
            value = brother.traits[map.primary];
        } else {
            // Fallback — starý systém, pro taby bez definované primární vlastnosti
            value = (brother.xp && brother.xp[tabId]) || 0;
        }
        let level = 1;
        for (let i = th.length - 1; i >= 0; i--) {
            if (value >= th[i]) { level = i + 1; break; }
        }
        return level;
    },

    dormitoriumBrotherMult: function (brother, tabId) {
        const level = this.dormitoriumBrotherLevel(brother, tabId);
        let mult = this.DORMITORIUM_LEVEL_MULT[level - 1];
        // Nemoc snižuje výkon přímo — mimo fatigue navíc (co ho stejně
        // vyřadí z výběru přes existující filtry), i aktivní bratr pracuje hůř.
        if (brother.conditions && Object.keys(brother.conditions).length > 0) mult *= 0.7;
        // monk-hunger-mrd (14.8.2026) — mírný okamžitý postih za hlad, dřív
        // než se stačí rozvinout v nemoc (ta srazí přes řádek výš). Násobí
        // se s ním, ne nahrazuje — hladový A nemocný bratr je na tom nejhůř.
        if (brother.unfedStreak > 0) mult *= 0.9;
        return mult;
    },

    // Mapování tab → (primární vlastnost +2, sekundární +1) — monk-attributes-mrd.
    // Zbožnost/Pokora/Askeze/Výřečnost prací NEROSTOU — rostou denním rytmem
    // (Officium/Kapitula), řešeno jinde, ne zde.
    DORMITORIUM_TAB_TRAITS: {
        athanor: { primary: 'erudition', secondary: 'focus' },
        athanor_research: { primary: 'erudition', secondary: 'focus' },
        scriptorium: { primary: 'erudition', secondary: 'focus' },
        zahony: { primary: 'craftsmanship', secondary: 'vigor' },
        sad: { primary: 'craftsmanship', secondary: 'vigor' },
        pole: { primary: 'craftsmanship', secondary: 'vigor' },
        vinohrad: { primary: 'craftsmanship', secondary: 'vigor' },
        apiarium: { primary: 'craftsmanship', secondary: 'vigor' },
        piscina: { primary: 'craftsmanship', secondary: 'vigor' },
        dvur: { primary: 'vigor', secondary: 'craftsmanship' },
        kostel: { primary: 'piety', secondary: 'obedience' },
        // coquina-tier4-mrd (7.8.2026): Mistr kuchař — hráčova akce
        // (Vaření), ne denní tick jako ostatní. XP guard 1×/den v
        // CookingSystem.js, ať level neroste rychleji jen kvůli krátkým
        // receptům (mletí koření apod.).
        kuchyne: { primary: 'craftsmanship', secondary: 'focus' },
    },

    // Individualizace rosteru (monk-attributes-mrd, krok 5) — malý startovní
    // náznak charakteru per postava, +10 v uvedených 2 vlastnostech při
    // najmutí. Odvozeno z origin textů v DormitoriumRosterDB — jemný odraz
    // povahy, ne mechanicky rozhodující rozdíl mezi postavami.
    DORMITORIUM_ROSTER_TRAIT_BONUS: {
        b_bonaventura: ['craftsmanship', 'asceticism'],   // Zahradník — trpělivý, mluví s rostlinami
        b_kolumban: ['craftsmanship', 'vigor'],         // Chovatel — pozná nemocné zvíře, věrný stádu
        b_prokulus: ['erudition', 'focus'],             // Skriptor — ruka se netřese, pyšný na řemeslo
        b_teofil: ['erudition', 'focus'],             // Alchymista — tajemný, přemýšlivý
        b_radim: ['erudition', 'eloquence'],         // Knihovník — nejstarší, vřelost k mladším
        b_borek: ['obedience', 'vigor'],             // Bývalý žoldák — kázeň, ostražitost
        b_jaroslav: ['craftsmanship', 'piety'],         // Včelař — trpělivý, mluví o včelách jako o obci
        b_vratislav: ['erudition', 'obedience'],         // Nejmladší — horlivý, zapisuje si vše
        b_nezamysl: ['focus', 'piety'],                 // Rybář — mlčenlivá trpělivost u vody
        b_ctirad: ['erudition', 'craftsmanship'],     // Kronikář — posedlý přesností dat
    },

    // Sestaví jméno pro _reportWork hlášku — když bratr i konvrš pracují
    // spolu (combo bonus se ve výnosu už projevuje), zmíní oba; jinak jen
    // toho, kdo tam skutečně je.
    _workCredit: function (brother, konvrs) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (brother && konvrs) {
            return brother.name + (lang === 'en' ? ' (with ' + konvrs.name + ')' : ' (s pomocí ' + konvrs.name + ')');
        }
        return brother ? brother.name : (konvrs ? konvrs.name : '');
    },

    dormitoriumAddXp: function (brother, tabId) {
        if (!brother.xp) brother.xp = {};
        const levelBefore = this.dormitoriumBrotherLevel(brother, tabId);
        brother.xp[tabId] = (brother.xp[tabId] || 0) + 1;

        // Stress — přepracování. Kontrola PŘED touhle prací přidanou únavou
        // (representuje "už teď je vyčerpaný"), ne po ní.
        if (typeof brother.fatigue === 'number' && brother.fatigue >= 70) {
            brother.stress = Math.min(100, (brother.stress || 0) + 3);
        }

        // Vedlejší přírůstek do traits — zatím NEnahrazuje výše uvedený
        // xp[tabId] čítač (ten dál řídí dormitoriumBrotherLevel/Mult), jen
        // ho doplňuje. Přepočítání levelu na traits je samostatný krok
        // (monk-attributes-mrd, sekce 6, bod 3) — zatím neproveden.
        const map = this.DORMITORIUM_TAB_TRAITS[tabId];
        if (map && brother.traits) {
            if (typeof brother.traits[map.primary] === 'number') {
                brother.traits[map.primary] = Math.min(100, brother.traits[map.primary] + 2);
            }
            if (typeof brother.traits[map.secondary] === 'number') {
                brother.traits[map.secondary] = Math.min(100, brother.traits[map.secondary] + 1);
            }
        }

        // Level-up hlášení — dřív se počítal a používal (Manufaktura dashboard),
        // ale hráč se o postupu nikde aktivně nedozvěděl.
        const levelAfter = this.dormitoriumBrotherLevel(brother, tabId);
        if (levelAfter > levelBefore) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const spec = (typeof DormitoriumSpecializationDB !== 'undefined') ? DormitoriumSpecializationDB[tabId] : null;
            const specName = spec ? (lang === 'en' ? spec.name_en : spec.name) : tabId;
            const mult = this.dormitoriumBrotherMult(brother, tabId);
            UI.notifyPanel('📈 ' + (lang === 'en'
                ? brother.name + ' reached level ' + levelAfter + '/4 in ' + specName + ' (×' + mult.toFixed(2) + ' yield).'
                : brother.name + ' dosáhl úrovně ' + levelAfter + '/4 v oboru ' + specName + ' (×' + mult.toFixed(2) + ' výnos).'), 'success');
            Game.addKronikaEntry('minor',
                '📈 ' + brother.name + ' dosáhl úrovně ' + levelAfter + '/4 (' + specName + ').',
                '📈 ' + brother.name + ' reached level ' + levelAfter + '/4 (' + specName + ').',
                '');
        }
    },

    // Přiřadí bratra na tab (max 1 bratr per tab). tabId === null odebere.
    assignBrotherTab: function (brotherId, tabId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const b = (GameState.dormitorium && GameState.dormitorium.brothers || []).find(x => x.id === brotherId);
        if (!b) return;
        if (tabId === null) { b.assignedTab = null; Game.save(); if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('dormitorium'); return; }

        if (tabId.indexOf('infirmarium_') === 0 && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_infirmarium'))) {
            UI.notify(lang === 'en' ? 'This role is not open yet.' : 'Tato role ještě není otevřená.', true); return;
        }

        const taken = GameState.dormitorium.brothers.find(x => x.assignedTab === tabId && x.id !== b.id);
        if (taken) {
            UI.notify(lang === 'en' ? taken.name + ' already manages this section.' : taken.name + ' už tuto sekci řídí.', true); return;
        }

        b.assignedTab = tabId;
        Game.save();
        const spec = (typeof DormitoriumSpecializationDB !== 'undefined') ? DormitoriumSpecializationDB[tabId] : null;
        const specName = spec ? (lang === 'en' ? spec.name_en : spec.name) : tabId;
        UI.notifyPanel('📿 ' + (lang === 'en' ? b.name + ' now oversees: ' + specName : b.name + ' nyní řídí: ' + specName), 'system');
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('dormitorium');
    },

    // ── DORMITORIUM — najmutí bratra (mnicha/skriptora) ──
    // Bez rank/vztah gate (na rozdíl od Conversi) — jen kapacita budovy + groše.
    hireBrother: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.dormitorium) GameState.dormitorium = { brothers: [] };
        if (!GameState.dormitorium.brothers) GameState.dormitorium.brothers = [];
        const cap = this.dormitoriumCapacity();
        if (cap === 0) {
            UI.notify(lang === 'en' ? 'Build Dormitorium first.' : 'Nejprve postav Dormitorium.', true); return;
        }
        if (GameState.dormitorium.brothers.length >= cap) {
            UI.notify(lang === 'en' ? 'No free beds in the Dormitorium.' : 'V Dormitoriu není volné lůžko.', true); return;
        }
        const HIRE_COST = 30;
        if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < HIRE_COST) {
            UI.notify(lang === 'en' ? 'Not enough groats.' : 'Nedostatek grošů.', true); return;
        }

        let rosterId = null, name, hireQuote = '';
        const rosterOk = (typeof DormitoriumRosterDB !== 'undefined') && Object.keys(DormitoriumRosterDB).length > 0;
        if (rosterOk) {
            const hiredIds = GameState.dormitorium.brothers.map(b => b.rosterId).filter(Boolean);
            const availIds = Object.keys(DormitoriumRosterDB).filter(rid => !hiredIds.includes(rid));
            const poolIds = availIds.length ? availIds : Object.keys(DormitoriumRosterDB);
            rosterId = poolIds[Math.floor(Math.random() * poolIds.length)];
            const rec = DormitoriumRosterDB[rosterId];
            name = rec.name;
            const hq = rec.quotes && rec.quotes.hire;
            if (hq) hireQuote = (lang === 'en' ? hq.en : hq.cs);
        } else {
            name = lang === 'en' ? 'Brother' : 'Bratr';
        }

        CellariumSystem.addGrose(-HIRE_COST);

        // Duchovní/intelektuální/praktické vlastnosti (monk-attributes-mrd) —
        // start: 0, roste jen prací (viz dormitoriumAddXp). Bez náhodné variace
        // na startu — každý bratr začíná na úrovni 1/4 ve všech tabech.
        const brother = {
            id: 'brother_' + Date.now(),
            rosterId, name,
            hiredAt: Date.now(),
            assignedTab: null,
            xp: {},
            fatigue: 0,
            mood: 60,
            loyalty: 30,
            stress: 0,
            temptation: 0,
            traits: {
                piety: 0,          // Zbožnost
                obedience: 0,      // Pokora/Poslušnost
                asceticism: 0,     // Askeze
                erudition: 0,      // Učenost
                focus: 0,          // Soustředění
                craftsmanship: 0,  // Řemeslná zručnost
                eloquence: 0,      // Výřečnost
                vigor: 0,          // Tělesná zdatnost
            },
        };

        // Individualizace rosteru (monk-attributes-mrd, krok 5) — malý
        // startovní náznak charakteru podle postavy (+10 ve 2 vlastnostech,
        // ne extrémní rozdíl, jen jemný odraz origin textu). Bratři mimo
        // roster (fallback "Bratr") nedostávají žádný bonus.
        const rosterBonus = this.DORMITORIUM_ROSTER_TRAIT_BONUS[rosterId];
        if (rosterBonus) {
            rosterBonus.forEach(key => {
                if (typeof brother.traits[key] === 'number') {
                    brother.traits[key] = Math.min(100, brother.traits[key] + 10);
                }
            });
        }

        GameState.dormitorium.brothers.push(brother);

        UI.notifyPanel('📿 ' + (lang === 'en' ? name + ' has joined as a brother.' : name + ' se připojil jako bratr.') + (hireQuote ? ' „' + hireQuote + '“' : ''), 'success');
        Game.addKronikaEntry('important',
            '📿 ' + name + ' se připojil ke klášteru jako bratr Dormitoria.',
            '📿 ' + name + ' has joined the monastery as a brother of the Dormitorium.',
            '📿 ' + name + ' frater factus est.'
        );
        Game.save();
    },

    // Hlášení odvedené práce (Conversi/Dormitorium) — Kronika + Zprávy z
    // kláštera + přehled za poslední tick (GameState.lastTickReport).
    _reportWork: function (text_cs, text_en) {
        if (!GameState.lastTickReport) GameState.lastTickReport = [];
        GameState.lastTickReport.push({ ts: Date.now(), cs: text_cs, en: text_en });

        Game.addKronikaEntry('minor', text_cs, text_en, '');
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            NotificationSystem.panel(lang === 'en' ? text_en : text_cs, 'system');
        }
    },

    // ── CONVERSI — přiřazování úkolů (M1) ───────────────────────────────────
    CONVERSI_TASKS: {
        dvur: { icon: '🏚️', away: false, dailyRiskPct: 8, injuryKind: 'physical' },
        zahony: { icon: '🌿', away: false, dailyRiskPct: 2, injuryKind: 'physical' },
        sad: { icon: '🍎', away: false, dailyRiskPct: 7, injuryKind: 'physical' },
        apiarium: { icon: '🐝', away: false, dailyRiskPct: 5, injuryKind: 'sting', injuryHours: 6 },
        piscina: { icon: '🐟', away: false, dailyRiskPct: 5, injuryKind: 'physical' },
        pole: { icon: '🌾', away: false, dailyRiskPct: 7, injuryKind: 'physical' },
        vinohrad: { icon: '🍇', away: false, dailyRiskPct: 6, injuryKind: 'physical' },
        scavenge: { icon: '🌾', away: true, durationMs: 8 * 60 * 60 * 1000, riskPct: 12 },
        doly: { icon: '⛏️', away: true, durationMs: 20 * 60 * 60 * 1000, riskPct: 20 },
        kostel: { icon: '⛪', away: false, dailyRiskPct: 3, injuryKind: 'physical' },
        hrbitov: { icon: '⚰️', away: false, dailyRiskPct: 6, injuryKind: 'physical' },
        servitor: { icon: '🩺', away: false, dailyRiskPct: 6, injuryKind: 'illness' },
        coquus: { icon: '🍲', away: false, dailyRiskPct: 7, injuryKind: 'physical' },
        hortulanus: { icon: '🌿', away: false, dailyRiskPct: 2, injuryKind: 'physical' },
        balneator: { icon: '🔥', away: false, dailyRiskPct: 7, injuryKind: 'physical' },
    },
    CONVERSI_TASK_SLOTS: 2,

    // Vrací {locked, reasonKey} — reasonKey pro i18n hint na dlaždici
    conversiTaskGate: function (taskId) {
        if (taskId === 'doly') {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fodina'))) {
                return { locked: true, reasonKey: 'gate_fodina_tech' };
            }
            if (!(GameState.abbotPetition && GameState.abbotPetition.fodina && GameState.abbotPetition.fodina.status === 'approved')) {
                return { locked: true, reasonKey: 'gate_fodina_approval' };
            }
            return { locked: false };
        }
        if (taskId === 'kostel') {
            if (!(typeof TemplumSystem !== 'undefined' && TemplumSystem.isUnlocked())) {
                return { locked: true, reasonKey: 'gate_frater' };
            }
            return { locked: false };
        }
        const INFIRMARIUM_SUBTECH = {
            servitor: 'tech_infirmarium_servitor',
            coquus: 'tech_infirmarium_coquus',
            hortulanus: 'tech_infirmarium_hortulanus',
            balneator: 'tech_infirmarium_balneator'
        };
        if (INFIRMARIUM_SUBTECH[taskId]) {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes(INFIRMARIUM_SUBTECH[taskId]))) {
                return { locked: true, reasonKey: 'gate_infirmarium_tech' };
            }
            return { locked: false };
        }
        return { locked: false }; // dvur, scavenge — bez gate
    },

    conversiTaskCount: function (taskId, excludeId) {
        return (GameState.conversi || []).filter(k => k.task === taskId && k.id !== excludeId).length;
    },

    // Přiřadí konvrše na úkol; taskId === null odebere z fronty. Validuje gate + sloty.
    assignConversiTask: function (konvrsId, taskId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const k = (GameState.conversi || []).find(x => x.id === konvrsId);
        if (!k) return;
        if (k.awayUntil && k.awayUntil > Date.now()) {
            UI.notify(lang === 'en' ? 'He is away — wait for his return.' : 'Je pryč — počkej na návrat.', true); return;
        }
        if (taskId === null) { k.task = null; Game.save(); if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('conversi'); return; }

        const gate = this.conversiTaskGate(taskId);
        if (gate.locked) {
            UI.notify(lang === 'en' ? 'This task is not open yet.' : 'Tento úkol ještě není otevřený.', true); return;
        }
        if (this.conversiTaskCount(taskId, k.id) >= this.CONVERSI_TASK_SLOTS) {
            UI.notify(lang === 'en' ? 'No free slot for this task.' : 'Žádný volný slot na tento úkol.', true); return;
        }

        k.task = taskId;
        const cfg = this.CONVERSI_TASKS[taskId];
        if (cfg && cfg.away) {
            k.awayTask = taskId;
            k.awayUntil = Date.now() + cfg.durationMs;
            UI.notifyPanel('🚶 ' + (lang === 'en' ? k.name + ' left for ' + taskId + '.' : k.name + ' odešel na úkol: ' + taskId + '.'), 'system');
        } else if (this.conversiDayBlock() !== 'work') {
            UI.notify(lang === 'en' ? 'Assigned — he\'ll begin work at the next work block.' : 'Přiřazeno — konvrš se pustí do práce až v dalším pracovním bloku.', false);
        }
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('conversi');
    },

    // Vyřeší návraty z Scavenge/Dolů — riziko, výnos, hláška. Volat z periodického ticku.
    CONVERSI_SCAVENGE_LOOT: ['mushroom', 'berries', 'thyme', 'st_johns_wort', 'wood', 'clay', 'rose', 'cornu_cervi', 'gentian'],
    checkConversiReturns: function () {
        if (!GameState.conversi || !GameState.conversi.length) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        GameState.conversi.forEach(k => {
            if (!k.awayUntil || k.awayUntil > now) return;
            const taskId = k.awayTask;
            const cfg = this.CONVERSI_TASKS[taskId];
            k.awayUntil = null;
            k.awayTask = null;
            k.task = null; // po návratu čeká na nové přiřazení

            const rec = (k.rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[k.rosterId] : null;
            const roll = Math.random() * 100;
            const risky = cfg && roll < cfg.riskPct;

            let yieldTxt = '';
            if (taskId === 'doly') {
                if (risky) {
                    k.injuredUntil = now + 24 * 60 * 60 * 1000;
                    k.fatigue = Math.min(100, k.fatigue + 20);
                    UI.notifyPanel('⚠️ ' + (lang === 'en' ? k.name + ' was hurt in the mine. Resting 24h.' : k.name + ' se zranil v dole. Odpočívá 24h.'), 'warning');
                    Game.addKronikaEntry('minor', '⚠️ ' + k.name + ' se zranil v dole.', '⚠️ ' + k.name + ' was hurt in the mine.', '⚠️ ' + k.name + ' in fodina vulneratus est.');
                } else {
                    const qty = 2 + Math.floor(Math.random() * 3);
                    Game.addItem('iron_ore', qty);
                    k.fatigue = Math.min(100, k.fatigue + 15);
                    yieldTxt = qty + '× iron_ore';
                    // Fix 3B (athanor-integrity-audit.md §3) — vzácný byproduct z hlubších štol
                    // Vlna 2 (media-materia-konsolidace.md §3) — sal_petrae/arsenicum doplněny do poolu
                    if (Math.random() < 0.15) {
                        const rarePool = ['vitriol', 'malachite', 'sal_petrae', 'arsenicum'];
                        const bonusId = rarePool[Math.floor(Math.random() * rarePool.length)];
                        Game.addItem(bonusId, 1);
                        yieldTxt += ' + 1× ' + bonusId;
                    }
                    // Vlna 1 (media-materia-konsolidace.md §3) — základní kovy častější
                    // než vzácné minerály nahoře, samostatný roll.
                    if (Math.random() < 0.4) {
                        const metalPool = ['lead', 'copper', 'tin'];
                        const metalId = metalPool[Math.floor(Math.random() * metalPool.length)];
                        Game.addItem(metalId, 1);
                        yieldTxt += ' + 1× ' + metalId;
                    }
                    UI.notifyPanel('⛏️ ' + (lang === 'en' ? k.name + ' returned from the mine with ' + yieldTxt + '.' : k.name + ' se vrátil z dolu s ' + yieldTxt + '.'), 'success');
                    Game.addKronikaEntry('minor', '⛏️ ' + k.name + ' přinesl z dolu ' + yieldTxt + '.', '⛏️ ' + k.name + ' brought ' + yieldTxt + ' from the mine.', '⛏️ ' + k.name + ' e fodina rediit.');
                }
            } else if (taskId === 'scavenge') {
                if (risky) {
                    const lost = Math.min(3, Math.floor(Math.random() * 3) + 1);
                    UI.notifyPanel('🏴 ' + (lang === 'en' ? 'Robbers took ' + k.name + "'s haul on the road." : 'Lapkové oloupili ' + k.name + ' na cestě.'), 'warning');
                    Game.addKronikaEntry('minor', '🏴 Lapkové oloupili ' + k.name + ' na zpáteční cestě.', '🏴 Robbers waylaid ' + k.name + ' on the road home.', '🏴 Latrones ' + k.name + ' spoliaverunt.');
                } else {
                    const itemId = this.CONVERSI_SCAVENGE_LOOT[Math.floor(Math.random() * this.CONVERSI_SCAVENGE_LOOT.length)];
                    const qty = 1 + Math.floor(Math.random() * 3);
                    Game.addItem(itemId, qty);
                    k.fatigue = Math.min(100, k.fatigue + 10);
                    yieldTxt = qty + '× ' + itemId;
                    UI.notifyPanel('🌾 ' + (lang === 'en' ? k.name + ' returned from scavenging with ' + yieldTxt + '.' : k.name + ' se vrátil ze scavenge s ' + yieldTxt + '.'), 'success');
                    Game.addKronikaEntry('minor', '🌾 ' + k.name + ' přinesl ze scavenge ' + yieldTxt + '.', '🌾 ' + k.name + ' brought ' + yieldTxt + ' from scavenging.', '🌾 ' + k.name + ' rediit.');
                }
            }
        });
        Game.save();
    },

    // Denní riziko zranění/nákazy u away:false konvrší úkolů (Dvůr, Pole, Coquus...).
    // Nezávislé na checkConversiChores — čistě aditivní, nesahá na výnosovou logiku.
    // Princip: NIKDY nesmí vyžadovat Infirmarium k vyřešení — čas vždy stačí sám,
    // Infirmarium/Apothecarius je jen akcelerátor (viz infirmariumCareModifier).
    checkConversiTaskRisk: function () {
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        if (!GameState.conversiNextRiskCheck) { GameState.conversiNextRiskCheck = now + DAY; return; } // první den bez rizika
        if (now < GameState.conversiNextRiskCheck) return;
        GameState.conversiNextRiskCheck = now + DAY;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        (GameState.conversi || []).forEach(k => {
            if (!k.task) return;
            if (k.injuredUntil && k.injuredUntil > now) return;
            if (k.admittedToInfirmarium) return;
            if (k.awayUntil && k.awayUntil > now) return;
            if (k.penanceUntil && k.penanceUntil > now) return;
            const cfg = this.CONVERSI_TASKS[k.task];
            if (!cfg || !cfg.dailyRiskPct) return;
            if (Math.random() * 100 >= cfg.dailyRiskPct) return;

            if (cfg.injuryKind === 'illness') {
                // Servitor — nákaza od právě léčenýho pacienta, ne injuredUntil
                const inf = GameState.infirmarium || { patients: [] };
                const patientConditions = [];
                (inf.patients || []).forEach(p => {
                    const pool = p.isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
                    const patient = pool.find(e => e.id === p.entityId);
                    if (patient && patient.conditions) {
                        Object.keys(patient.conditions).forEach(cid => { if (!patientConditions.includes(cid)) patientConditions.push(cid); });
                    }
                });
                if (!patientConditions.length) return; // nikdo nemocnej, není co chytit
                const caughtId = patientConditions[Math.floor(Math.random() * patientConditions.length)];
                if (!k.conditions) k.conditions = {};
                if (k.conditions[caughtId]) return; // už to má
                const def = HealthConditionsDB[caughtId];
                if (!def) return;
                k.conditions[caughtId] = { startedAt: now, expiresAt: now + def.durationHours * 3600000 };
                const condName = lang === 'en' ? def.name_en : def.name;
                UI.notifyPanel('🤒 ' + (lang === 'en' ? k.name + ' caught ' + condName + ' from a patient.' : k.name + ' se nakazil od pacienta: ' + condName + '.'), 'warning');
                Game.addKronikaEntry('minor', '🤒 ' + k.name + ' se v Infirmariu nakazil: ' + condName + '.', '🤒 ' + k.name + ' caught ' + condName + ' at the infirmary.', '🤒 ' + k.name + ' aegrotavit.');
            } else {
                const hours = cfg.injuryHours || 24;
                k.injuredUntil = now + hours * 60 * 60 * 1000;
                k.fatigue = Math.min(100, (k.fatigue || 0) + (cfg.injuryKind === 'sting' ? 10 : 20));
                const kindMsg = cfg.injuryKind === 'sting'
                    ? (lang === 'en' ? k.name + ' was stung repeatedly. Swelling for ' + hours + 'h.' : k.name + ' dostal několik žihadel. Otok na ' + hours + 'h.')
                    : (lang === 'en' ? k.name + ' was hurt at work. Resting ' + hours + 'h.' : k.name + ' se zranil při práci. Odpočívá ' + hours + 'h.');
                UI.notifyPanel('⚠️ ' + kindMsg, 'warning');
                Game.addKronikaEntry('minor', '⚠️ ' + k.name + ' se zranil při práci.', '⚠️ ' + k.name + ' was hurt at work.', '⚠️ ' + k.name + ' vulneratus est.');
            }
        });
        Game.save();
    },

    hireFamulus: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.conversi) GameState.conversi = [];
        if (!GameState.researchedTechs || !GameState.researchedTechs.includes('tech_magister')) {
            UI.notify(lang === 'en' ? 'Requires the Magister tech.' : 'Vyžaduje tech Magister.', true); return;
        }
        const cap = this.conversiCapacity();
        if (GameState.conversi.length >= cap) {
            UI.notify(lang === 'en' ? 'No free beds in the Domus.' : 'V Domu není volné lůžko.', true); return;
        }
        const usedNames = GameState.conversi.map(k => k.name);
        const available = this.KONVRS_NAMES.filter(n => !usedNames.includes(n));
        const pool = available.length ? available : this.KONVRS_NAMES;
        const name = pool[Math.floor(Math.random() * pool.length)];
        const famulus = { id: 'famulus_' + Date.now(), rosterId: null, name: name, type: 'famulus', hiredAt: Date.now(), fatigue: 0, mood: 60, wageOwed: 0 };
        GameState.conversi.push(famulus);
        UI.notifyPanel('💼 ' + (lang === 'en' ? name + ' has joined as a famulus — a seasonal hand.' : name + ' se připojil jako famulus — sezónní síla.'), 'success');
        Game.addKronikaEntry('minor', '💼 ' + name + ' najat jako famulus.', '💼 ' + name + ' hired as a famulus.', '💼 ' + name + ' famulus conductus est.');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
    },

    // Oblát — dítě/mladík vstupující do kláštera, dozrává na konvrše po 30
    // reálných dnech (_checkOblatMaturation, denní tick). Bez mzdy do dozrání.
    hireOblat: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.conversi) GameState.conversi = [];
        if (!GameState.researchedTechs || !GameState.researchedTechs.includes('tech_magister')) {
            UI.notify(lang === 'en' ? 'Requires the Magister tech.' : 'Vyžaduje tech Magister.', true); return;
        }
        const cap = this.conversiCapacity();
        if (GameState.conversi.length >= cap) {
            UI.notify(lang === 'en' ? 'No free beds in the Domus.' : 'V Domu není volné lůžko.', true); return;
        }
        if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 5) {
            UI.notify(lang === 'en' ? 'Not enough groats.' : 'Nedostatek grošů.', true); return;
        }
        const usedNames = GameState.conversi.map(k => k.name);
        const available = this.KONVRS_NAMES.filter(n => !usedNames.includes(n));
        const pool = available.length ? available : this.KONVRS_NAMES;
        const name = pool[Math.floor(Math.random() * pool.length)];
        CellariumSystem.addGrose(-5);
        const oblat = { id: 'oblat_' + Date.now(), rosterId: null, name: name, type: 'oblat', hiredAt: Date.now(), fatigue: 0, mood: 60, matureAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
        GameState.conversi.push(oblat);
        UI.notifyPanel('🌱 ' + (lang === 'en' ? name + ' has been taken in as an oblate.' : name + ' byl přijat jako oblát.'), 'success');
        Game.addKronikaEntry('minor', '🌱 ' + name + ' přijat jako oblát.', '🌱 ' + name + ' taken in as an oblate.', '🌱 ' + name + ' oblatus susceptus est.');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
    },

    // Denní kontrola dozrání obláta na konvrše — volat z denního ticku.
    _checkOblatMaturation: function () {
        if (!GameState.conversi) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        GameState.conversi.forEach(k => {
            if (k.type !== 'oblat' || !k.matureAt || k.matureAt > now) return;
            k.type = null;
            delete k.matureAt;
            if (typeof k.loyalty !== 'number') k.loyalty = 30;
            if (typeof k.wageOwed !== 'number') k.wageOwed = 0;
            UI.notifyPanel('✝️ ' + (lang === 'en' ? k.name + ' has matured into a full lay brother.' : k.name + ' dozrál na plnýho konvrše.'), 'success');
            Game.addKronikaEntry('minor', '✝️ ' + k.name + ' dozrál z obláta na konvrše.', '✝️ ' + k.name + ' has matured from oblate to lay brother.', '✝️ ' + k.name + ' conversus factus est.');
        });
        Game.save();
    },

    hireKonvrs: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.conversi) GameState.conversi = [];
        const cap = this.conversiCapacity();
        if (cap === 0) {
            UI.notify(lang === 'en' ? 'Build Domus Conversorum first.' : 'Nejprve postav Domus Conversorum.', true); return;
        }
        if (GameState.conversi.length >= cap) {
            UI.notify(lang === 'en' ? 'No free beds in the Domus.' : 'V Domu není volné lůžko.', true); return;
        }
        const monasticOk = ['frater', 'armarius', 'prior'].includes(GameState.rank && GameState.rank.monastic);
        if (!monasticOk) {
            UI.notify(lang === 'en' ? 'Requires the rank of Frater or higher.' : 'Vyžaduje hodnost Frater nebo vyšší.', true); return;
        }
        const village = (GameState.persona && GameState.persona.influence && GameState.persona.influence.village) || 0;
        if (village < 15) {
            UI.notify(lang === 'en' ? 'Not enough standing with the village.' : 'Nedostatečná vážnost u vesnice.', true); return;
        }
        if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 10) {
            UI.notify(lang === 'en' ? 'Not enough groats.' : 'Nedostatek grošů.', true); return;
        }

        // Nábor z rosteru (ConversiRosterDB); fallback na KONVRS_NAMES, pokud roster nedostupný.
        // Náklady se strhávají až PO výběru kandidáta — odmítnutí (tenze) je zdarma.
        let rosterId = null, name, hireQuote = '';
        const rosterOk = (typeof ConversiRosterDB !== 'undefined') && Object.keys(ConversiRosterDB).length > 0;
        if (rosterOk) {
            const hiredIds = GameState.conversi.map(k => k.rosterId).filter(Boolean);
            const availIds = Object.keys(ConversiRosterDB).filter(rid => !hiredIds.includes(rid));
            const poolIds = availIds.length ? availIds : Object.keys(ConversiRosterDB);
            rosterId = poolIds[Math.floor(Math.random() * poolIds.length)];
            const rec = ConversiRosterDB[rosterId];
            name = rec.name;

            // Tenze s někým už najatým → kandidát odmítne (deterministicky), bez nákladů
            if (typeof ConversiBondsDB !== 'undefined') {
                const enemyBond = ConversiBondsDB.find(bd => bd.type === 'tension' &&
                    ((bd.a === rosterId && hiredIds.includes(bd.b)) ||
                        (bd.b === rosterId && hiredIds.includes(bd.a))));
                if (enemyBond) {
                    const enemyId = (enemyBond.a === rosterId) ? enemyBond.b : enemyBond.a;
                    const enemyName = (ConversiRosterDB[enemyId] && ConversiRosterDB[enemyId].name) || '?';
                    const rq = rec.quotes && rec.quotes.refuse;
                    const refuseQuote = rq ? (lang === 'en' ? rq.en : rq.cs) : '';
                    UI.notifyPanel('🚫 ' + (lang === 'en'
                        ? name + ' refuses to join while ' + enemyName + ' lives here.'
                        : name + ' odmítá vstoupit, dokud tu žije ' + enemyName + '.')
                        + (refuseQuote ? ' „' + refuseQuote + '“' : ''), 'warning');
                    Game.addKronikaEntry('minor',
                        '🚫 ' + name + ' odmítl vstoupit do kláštera — nevychází s bratrem jménem ' + enemyName + '.',
                        '🚫 ' + name + ' refused to join the monastery — he does not get along with brother ' + enemyName + '.',
                        '🚫 ' + name + ' intrare recusavit.'
                    );
                    return;
                }
            }

            const hq = rec.quotes && rec.quotes.hire;
            if (hq) hireQuote = (lang === 'en' ? hq.en : hq.cs);
        } else {
            const usedNames = GameState.conversi.map(k => k.name);
            const available = this.KONVRS_NAMES.filter(n => !usedNames.includes(n));
            const pool = available.length ? available : this.KONVRS_NAMES;
            name = pool[Math.floor(Math.random() * pool.length)];
        }

        GameState.persona.influence.village -= 15;
        CellariumSystem.addGrose(-10);

        const konvrs = { id: 'konvrs_' + Date.now(), rosterId, name, hiredAt: Date.now(), fatigue: 0 };
        GameState.conversi.push(konvrs);

        UI.notifyPanel('✝️ ' + (lang === 'en' ? name + ' has joined as a lay brother.' : name + ' se připojil jako konvrš.') + (hireQuote ? ' „' + hireQuote + '“' : ''), 'success');
        Game.addKronikaEntry('important',
            '✝️ ' + name + ' se připojil ke klášteru jako konvrš.',
            '✝️ ' + name + ' has joined the monastery as a lay brother.',
            '✝️ ' + name + ' conversus factus est.'
        );
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
    },

    // ── Rozvázání slibu — Vlákno A (npc-subtab-konsolidovany-mrd.md §2.1) ──
    // Jen Konvrš (ne Famulus/Oblát — jiná právní kategorie, viz MRD §1).
    // Gate: armarius/prior (těžší akt než najmutí, co stačí frater+) a jen
    // při Officiu (6–9h, TimeSys.gameHour) — veřejný akt, ne tichý.
    // Dvě narativní varianty, mechanicky totožné: 'absolutio' (rozvázání
    // slibu) / 'translatio' (poslán do jiného domu). Žádný Pověst hit zde
    // — to je vyhrazeno pro nedobrovolný odchod zanedbáním (viz leavers
    // výše, §5 MRD). Afinitní vazba (ConversiBondsDB) se šíří na partnera.
    dismissKonvrs: function (id, variant) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const m = GameState.rank && GameState.rank.monastic;
        if (!['armarius', 'prior'].includes(m)) {
            UI.notify(lang === 'en' ? '❌ Requires rank Armarius or higher.' : '❌ Vyžaduje hodnost Armarius nebo vyšší.', true);
            return;
        }
        if (!ConversiManager.isOfficiumHours()) {
            UI.notify(lang === 'en' ? '❌ Such a matter is spoken only at Officium (6:00–9:00).' : '❌ Taková věc se přednáší jen při Officiu (6:00–9:00).', true);
            return;
        }
        const k = (GameState.conversi || []).find(x => x.id === id);
        if (!k || k.type === 'famulus' || k.type === 'oblat') return;

        const rec = (k.rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[k.rosterId] : null;
        const farewell = rec && rec.quotes && rec.quotes.farewell
            ? (lang === 'en' ? rec.quotes.farewell.en : rec.quotes.farewell.cs)
            : (variant === 'translatio'
                ? (lang === 'en' ? 'God\'s houses are many. I go to another.' : 'Božích domů je víc. Jdu do jiného.')
                : (lang === 'en' ? 'The vow is spoken; it may also be unspoken. I go in peace.' : 'Slib je pronesen; dá se i odříct. Odcházím v pokoji.'));

        // Afinitní vazba — ztráta se šíří na partnera (ne tension, ta by
        // se naopak uklidnila odchodem — jen affinity nese smutek).
        if (k.rosterId && typeof ConversiBondsDB !== 'undefined') {
            const hiredIds = (GameState.conversi || []).map(x => x.rosterId).filter(Boolean);
            const affinityBond = ConversiBondsDB.find(bd =>
                bd.type === 'affinity' && (bd.a === k.rosterId || bd.b === k.rosterId) &&
                hiredIds.includes(bd.a === k.rosterId ? bd.b : bd.a));
            if (affinityBond) {
                const partnerId = affinityBond.a === k.rosterId ? affinityBond.b : affinityBond.a;
                const partner = GameState.conversi.find(x => x.rosterId === partnerId);
                if (partner) {
                    partner.mood = Math.max(0, (typeof partner.mood === 'number' ? partner.mood : 60) - 12);
                    const partnerRec = ConversiRosterDB[partnerId];
                    if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel((lang === 'en'
                        ? '💔 ' + (partnerRec ? partnerRec.name : partnerId) + ' heard of ' + k.name + '\'s departure — the loss weighs on him.'
                        : '💔 ' + (partnerRec ? partnerRec.name : partnerId) + ' se doslechl o odchodu ' + k.name + ' — ztráta na něm leží.'), 'system');
                }
            }
        }

        GameState.conversi = GameState.conversi.filter(x => x.id !== id);

        const actionLabel_cs = variant === 'translatio' ? 'poslán do jiného domu (translatio)' : 'slib rozvázán (absolutio voti)';
        const actionLabel_en = variant === 'translatio' ? 'sent to another house (translatio)' : 'vow released (absolutio voti)';
        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            UI.notifyPanel('🕊️ ' + k.name + ' — ' + (lang === 'en' ? actionLabel_en : actionLabel_cs) + '. „' + farewell + '“', 'system');
        }
        Game.addKronikaEntry('important',
            '🕊️ ' + k.name + ' — ' + actionLabel_cs + '. „' + farewell + '“',
            '🕊️ ' + k.name + ' — ' + actionLabel_en + '. "' + farewell + '"',
            '🕊️ ' + k.name + ' recessit in pace.'
        );
        Game.save();
        if (GameState.ui) GameState.ui.conversiSelected = null;
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('conversi');
    },

    // Officium — konvrši nedostupní mezi Laudes (6:00) a Prima (9:00), reálný čas
    isOfficiumHours: function () {
        const h = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour() : new Date().getHours();
        return h >= 6 && h < 9;
    },

    // Denní režim (Regula): blok dne podle Europe/Prague (ne lokální čas zařízení hráče)
    conversiDayBlock: function () {
        const h = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour() : new Date().getHours();
        if (h >= 6 && h < 9) return 'officium'; // modlitba
        if (h >= 12 && h < 13) return 'lunch';    // oběd v refektáři
        if (h >= 18 && h < 19) return 'vespers';  // nešpory
        if (h >= 22 || h < 5) return 'night';    // spánek
        return 'work';
    },

    // Refektář: prostá strava, priorita od nejlevnější; luxus (koláče, pečeně) se NIKDY nebere
    REFECTORY_FOODS: ['spring_herb_porridge', 'famine_bread', 'burdock_root_baked', 'berries', 'mushroom', 'bread', 'mushroom_soup', 'cooked_fish', 'cooked_meat', 'stew'],

    // monk-hunger-mrd (14.8.2026) — strop akumulátoru, ať dluh za dlouhé
    // hladovění nenaroste do nesmyslných čísel (víc než 2 dny dluhu se dál
    // neprohlubuje, unfedStreak už samo o sobě vyjadřuje závažnost).
    BROTHER_MEAL_ACCUMULATOR_CAP: 2,

    // Mnišská porce: 0.5x konvrš, snížená Askezí (0-100). Askeze 100 → 0.25,
    // askeze 0 → 0.5. Nikdy nula — i nejpřísnější asketa musí něco jíst.
    _brotherPortion: function (b) {
        const asc = (b.traits && typeof b.traits.asceticism === 'number') ? b.traits.asceticism : 0;
        return 0.5 * (1 - asc / 200);
    },

    _runRefectory: function () {
        const lastMeal = GameState.conversiLastMeal || 0;
        if (Date.now() - lastMeal < 24 * 60 * 60 * 1000) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const inv = GameState.inventory || {};
        // V2: nádobí = kapacita (nespotřebovává se). Sklo/keramika = plný efekt, dřevo = základ, bez nádobí = minimum.
        const TABLE_GLASS = ['glass_goblet', 'glass_tankard', 'glass_jug', 'glass_bowl', 'glass_pitcher'];
        const glassCap = TABLE_GLASS.reduce((s, id) => s + (inv[id] || 0), 0);
        const woodCap = inv['wooden_bowl'] || 0;
        const fed = [], unfed = [];
        const dish = { glass: 0, wood: 0, none: 0 };
        let servedIdx = 0;
        GameState.conversi.forEach(k => {
            const foodId = this.REFECTORY_FOODS.find(f => (inv[f] || 0) > 0);
            if (foodId) {
                inv[foodId] -= 1;
                if (servedIdx < glassCap) {
                    k.fatigue = Math.max(0, k.fatigue - 10);
                    k.mood = Math.min(100, k.mood + 3);
                    dish.glass++;
                } else if (servedIdx < glassCap + woodCap) {
                    k.fatigue = Math.max(0, k.fatigue - 5);
                    k.mood = Math.min(100, k.mood + 2);
                    dish.wood++;
                } else {
                    k.fatigue = Math.max(0, k.fatigue - 3);
                    dish.none++;
                }
                servedIdx++;
                fed.push(k.name);
                k.unfedStreak = 0;
            } else {
                k.mood = Math.max(0, k.mood - 8);
                k.loyalty = Math.max(0, k.loyalty - 2);
                unfed.push(k.name);
                k.unfedStreak = (k.unfedStreak || 0) + 1;
            }
        });

        // monk-hunger-mrd Fáze 3 (14.8.2026) — zběhnutí z hladu. Jen konvrši
        // (mniši vázáni slibem, netýká se jich). Práh streak 3, šance roste
        // s dny hladovění, strop 50 %. Smrt na neúspěšný pokus zatím
        // NEŘEŠENA — samostatný pozdější krok (jinak pro mnichy, jinak pro
        // konvrše — Bouvard 14.8.2026).
        const deserters = [];
        GameState.conversi.forEach(k => {
            if ((k.unfedStreak || 0) < 3) return;
            const chance = Math.min(0.5, 0.1 * (k.unfedStreak - 2));
            if (Math.random() < chance) deserters.push(k);
        });
        deserters.forEach(k => {
            GameState.conversi = GameState.conversi.filter(x => x.id !== k.id);
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
                PersonaSystem.addReputation('lidovost', -2);
            }
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                UI.notifyPanel('🚪 ' + (lang === 'en'
                    ? k.name + ' has fled the monastery — hunger drove him over the wall.'
                    : k.name + ' zběhl z kláštera — hlad ho vyhnal přes zeď.'), 'warning');
            }
            Game.addKronikaEntry('important',
                '🚪 ' + k.name + ' zběhl z kláštera. Hlad byl silnější než slib.',
                '🚪 ' + k.name + ' has deserted the monastery. Hunger proved stronger than the vow.',
                '🚪 ' + k.name + ' fugit.'
            );
        });

        // monk-hunger-mrd — mniši ze stejné zásoby, po konvrších. Zlomková
        // potřeba (0.25-0.5) přes akumulátor: dokud nedluží celou porci,
        // ten den se neřeší (přirozeně řidší stravování u vyšší Askeze).
        // Nádobí se na bratry nepočítá — klauzura, ne konvršský refektář.
        const brothers = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
        const brothersFed = [], brothersUnfed = [];
        brothers.forEach(b => {
            if (typeof b.mealAccumulator !== 'number') b.mealAccumulator = 0;
            b.mealAccumulator = Math.min(this.BROTHER_MEAL_ACCUMULATOR_CAP, b.mealAccumulator + this._brotherPortion(b));
            if (b.mealAccumulator < 1) return;
            const foodId = this.REFECTORY_FOODS.find(f => (inv[f] || 0) > 0);
            if (foodId) {
                inv[foodId] -= 1;
                b.mealAccumulator -= 1;
                b.fatigue = Math.max(0, (b.fatigue || 0) - 5);
                b.mood = Math.min(100, (b.mood || 60) + 2);
                brothersFed.push(b.name);
                b.unfedStreak = 0;
            } else {
                b.mood = Math.max(0, (b.mood || 60) - 8);
                b.loyalty = Math.max(0, (b.loyalty || 30) - 2);
                brothersUnfed.push(b.name);
                b.unfedStreak = (b.unfedStreak || 0) + 1;
            }
        });

        const allUnfed = unfed.concat(brothersUnfed);
        GameState.conversiMealLog = { ts: Date.now(), fed: fed, unfed: unfed, dish: dish, brothersFed: brothersFed, brothersUnfed: brothersUnfed };
        GameState.conversiLastMeal = Date.now();
        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            if (allUnfed.length === 0) {
                const handNote = dish.none > 0 ? (lang === 'en' ? ' Some ate from their hands — dishes are short.' : ' Část jedla z ruky — nádobí nestačí.') : '';
                UI.notifyPanel('🍲 ' + (lang === 'en' ? 'The refectory served everyone.' : 'Refektář nasytil všechny.') + handNote, dish.none > 0 ? 'warning' : 'success');
            } else {
                UI.notifyPanel('🍲 ' + (lang === 'en'
                    ? 'The refectory is short of food — hungry: ' + allUnfed.join(', ')
                    : 'V refektáři nebylo dost jídla — hladoví: ' + allUnfed.join(', ')), 'warning');
            }
        }
        Game.addKronikaEntry('minor',
            allUnfed.length === 0 ? '🍲 Refektář: všichni nasyceni.' : '🍲 Refektář: nedostatek jídla, hladoví — ' + allUnfed.join(', ') + '.',
            allUnfed.length === 0 ? '🍲 Refectory: everyone fed.' : '🍲 Refectory: food shortage, hungry — ' + allUnfed.join(', ') + '.',
            allUnfed.length === 0 ? '🍲 Refectorium: omnes saturati.' : '🍲 Refectorium: fames.');
        Game.save();
    },

    // Traity konvrše z rosteru (fallback prázdné pole)
    _konvrsTraits: function (k) {
        if (!k || !k.rosterId || typeof ConversiRosterDB === 'undefined') return [];
        const rec = ConversiRosterDB[k.rosterId];
        return (rec && rec.traits) ? rec.traits : [];
    },

    // Kapitula — týdenní shromáždění konvršů: konflikt (tenze) / bonus (svornost) / ticho
    _runKapitula: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const list = GameState.conversi || [];
        const hiredIds = list.map(k => k.rosterId).filter(Boolean);

        // Aktivní tenze: oba z páru najatí. Vlákno B — páry označené jako
        // "vyhořelé" (GameState.kapitulaHistory[pairKey].resolved==='burned')
        // se dál nenabízí, mirror principu "jednou provždy vyřešeno".
        let conflict = null;
        if (typeof ConversiBondsDB !== 'undefined') {
            const bond = ConversiBondsDB.find(bd => {
                if (bd.type !== 'tension' || !hiredIds.includes(bd.a) || !hiredIds.includes(bd.b)) return false;
                const pairKey = bd.a + '|' + bd.b;
                const hist = GameState.kapitulaHistory && GameState.kapitulaHistory[pairKey];
                return !(hist && hist.resolved === 'burned');
            });
            if (bond) {
                const ka = list.find(k => k.rosterId === bond.a);
                const kb = list.find(k => k.rosterId === bond.b);
                if (ka && kb) conflict = { bond, ka, kb };
            }
        }

        if (conflict) {
            const { bond, ka, kb } = conflict;
            // Napětí v komunitě — i bratři v Dormitoriu ho cítí, ne jen dva
            // konvrši v konfliktu. Malý plošný bump, nezávislý na volbě řešení.
            // Jednorázový vedlejší efekt SETKÁNÍ (ne volby) — proto zůstává tady
            // v _runKapitula, ne v _showKapitulaModal (ta se volá i při reopenu).
            (GameState.dormitorium && GameState.dormitorium.brothers || []).forEach(b => {
                if (b.assignedTab) b.stress = Math.min(100, (b.stress || 0) + 5);
            });
            // Bestiář: první reálný konflikt na Kapitule odemkne Titivillovu
            // "druhou tvář" — týž démon, tentokrát poslouchající klevety
            // místo opisovačských chyb. unlockFolioById je idempotentní.
            if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_titivillus_secunda');

            // Vlákno B — Kapitula jako seriál. meetCount roste při KAŽDÉM
            // setkání tohohle konkrétního páru (ne globálně). 3. setkání
            // nabídne jednorázovou volbu místo běžného modálu; jinak beze
            // změny existující logiky (surgical — MRD §3).
            const pairKey = bond.a + '|' + bond.b;
            if (!GameState.kapitulaHistory) GameState.kapitulaHistory = {};
            if (!GameState.kapitulaHistory[pairKey]) GameState.kapitulaHistory[pairKey] = { meetCount: 0, lastPeaceful: false, resolved: null };
            GameState.kapitulaHistory[pairKey].meetCount++;

            // Persistováno — klik mimo modal ho jen schová, ne ztratí (reopen z panelu).
            GameState.pendingKapitula = pairKey;
            Game.save();

            ConversiManager._showKapitulaModal(pairKey);
            return;
        }

        // Bez konfliktu: svorná parta (průměrný mood ≥ 65) → bonus
        const avgMood = list.reduce((s, k) => s + (k.mood || 60), 0) / list.length;
        if (avgMood >= 65) {
            list.forEach(k => {
                k.fatigue = Math.max(0, k.fatigue - 5);
                k.mood = Math.min(100, k.mood + 3);
            });
            // Zrcadlí úlevu i pro bratry — jediná odventilovací chvíle pro Stress,
            // který jinak jen roste (fatigue/konflikt/ztráta parťáka).
            (GameState.dormitorium && GameState.dormitorium.brothers || []).forEach(b => {
                if (b.assignedTab) b.stress = Math.max(0, (b.stress || 0) - 5);
            });
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                UI.notifyPanel('⚖️ ' + (lang === 'en' ? 'The chapter passed in peace and concord. The brothers work with lighter hearts.' : 'Kapitula proběhla v pokoji a svornosti. Bratři pracují s lehčím srdcem.'), 'success');
            }
            Game.addKronikaEntry('minor',
                '⚖️ Kapitula proběhla v pokoji a svornosti.',
                '⚖️ The chapter passed in peace and concord.',
                '⚖️ Capitulum in pace actum est.');
        } else {
            Game.addKronikaEntry('minor',
                '⚖️ Kapitula proběhla bez zvláštních událostí.',
                '⚖️ The chapter passed without notable events.',
                '⚖️ Capitulum sine eventu.');
        }
    },

    // Reopen z panelu "Zprávy kláštera" — pairKey stačí, zbytek (bond/ka/kb/
    // hist/retro) se dopočítá znovu ze živého GameState (deterministické).
    reopenKapitula: function () {
        const pairKey = GameState.pendingKapitula;
        if (!pairKey) return;
        ConversiManager._showKapitulaModal(pairKey);
    },

    _showKapitulaModal: function (pairKey) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const [aId, bId] = pairKey.split('|');
        const list = GameState.conversi || [];
        const ka = list.find(k => k.rosterId === aId);
        const kb = list.find(k => k.rosterId === bId);
        const bond = (typeof ConversiBondsDB !== 'undefined') ? ConversiBondsDB.find(bd => bd.a === aId && bd.b === bId) : null;
        const pendingId = 'kapitula_' + pairKey;
        const clearPending = () => {
            if (GameState.pendingKapitula === pairKey) GameState.pendingKapitula = null;
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.resolvePendingEvent) NotificationSystem.resolvePendingEvent(pendingId);
        };
        if (!ka || !kb || !bond) { clearPending(); return; } // mezitím se stav změnil (odešel, apod.)

        if (!GameState.kapitulaHistory) GameState.kapitulaHistory = {};
        if (!GameState.kapitulaHistory[pairKey]) GameState.kapitulaHistory[pairKey] = { meetCount: 0, lastPeaceful: false, resolved: null };
        const hist = GameState.kapitulaHistory[pairKey];
        const rerender = () => { if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern'); };
        const retro = (typeof KapitulaRetrospectiveDB !== 'undefined') ? KapitulaRetrospectiveDB[pairKey] : null;
        const isFinal = hist.meetCount === 3 && retro;

        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.pendingEvent) {
            NotificationSystem.pendingEvent({
                id: pendingId,
                icon: isFinal ? '🔥' : '⚖️',
                title: (lang === 'en' ? 'Chapter — ' : 'Kapitula — ') + ka.name + ' × ' + kb.name,
                source: 'game_kapitula',
            });
        }

        if (isFinal) {
            // Třetí setkání — jednorázová volba: vyhoření (jeden odejde,
            // pár se natrvalo uzavře) vs. trvání (žije dál jako rys komunity).
            const victim3 = (ka.loyalty <= kb.loyalty) ? ka : kb;
            const leavesText = lang === 'en' ? retro.leaves_en : retro.leaves_cs;
            NotificationSystem.modal({
                icon: '🔥',
                title: (lang === 'en' ? 'Chapter — a choice, once and for all' : 'Kapitula — volba, jednou provždy'),
                text: `<div style="font-size:0.82rem; line-height:1.45;"><strong>${ka.name}</strong> × <strong>${kb.name}</strong><br><span style="opacity:0.75; font-style:italic;">${lang === 'en' ? bond.desc_en : bond.desc_cs}</span><br><br>${lang === 'en' ? 'This has come before the chapter enough times. It ends here, one way or another.' : 'Tohle už bylo před kapitulou dost často. Skončí to tu, tak či onak.'}</div>`,
                choices: [
                    {
                        label: (lang === 'en' ? '🔥 Let it burn out' : '🔥 Nechat vyhořet'), type: 'danger', effect: () => {
                            hist.resolved = 'burned';
                            GameState.conversi = GameState.conversi.filter(x => x.id !== victim3.id);
                            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                                UI.notifyPanel('🔥 ' + victim3.name + ' — ' + (lang === 'en' ? 'has left.' : 'odešel.') + ' „' + leavesText + '“', 'warning');
                            }
                            Game.addKronikaEntry('important',
                                '🔥 ' + victim3.name + ' opustil klášter. „' + leavesText + '“',
                                '🔥 ' + victim3.name + ' left the monastery. "' + leavesText + '"',
                                '🔥 ' + victim3.name + ' recessit.');
                            clearPending();
                            Game.save(); rerender();
                        }
                    },
                    {
                        label: (lang === 'en' ? '🕯️ Let it live on' : '🕯️ Nechat žít dál'), effect: () => {
                            hist.resolved = 'persists';
                            ka.mood = Math.min(100, ka.mood + 3);
                            kb.mood = Math.min(100, kb.mood + 3);
                            Game.addKronikaEntry('minor',
                                '🕯️ Napětí mezi ' + ka.name + ' a ' + kb.name + ' zůstává — trvalý rys komunity, ne rána.',
                                '🕯️ The tension between ' + ka.name + ' and ' + kb.name + ' remains — a lasting trait of the community, not a wound.',
                                '🕯️ Manet.');
                            clearPending();
                            Game.save(); rerender();
                        }
                    }
                ]
            });
            return;
        }

        // Viník = nižší loajalita; druhý = poškozený
        const victim = (ka.loyalty <= kb.loyalty) ? ka : kb;
        const other = (victim === ka) ? kb : ka;
        const bondText = lang === 'en' ? bond.desc_en : bond.desc_cs;
        // Vlákno B — 2. setkání, jen pokud 1. bylo vyřešeno smírně, přidá
        // retrospektivu před běžný text. Volby/efekty beze změny.
        const retroText = (hist.meetCount === 2 && hist.lastPeaceful && retro)
            ? `<br><br><span style="opacity:0.8;">${lang === 'en' ? retro.retrospective_en : retro.retrospective_cs}</span>` : '';
        NotificationSystem.modal({
            icon: '⚖️',
            title: (lang === 'en' ? 'Chapter — a dispute among the brothers' : 'Kapitula — spor mezi bratry'),
            text: `<div style="font-size:0.82rem; line-height:1.45;"><strong>${ka.name}</strong> × <strong>${kb.name}</strong><br><span style="opacity:0.75; font-style:italic;">${bondText}</span>${retroText}<br><br>${lang === 'en' ? 'The chapter awaits your judgement.' : 'Kapitula čeká na tvůj soud.'}</div>`,
            choices: [
                {
                    label: (lang === 'en' ? '🕊️ Reconcile them' : '🕊️ Rozsoudit smírně'), effect: () => {
                        ka.mood = Math.min(100, ka.mood + 5);
                        kb.mood = Math.min(100, kb.mood + 5);
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
                        hist.lastPeaceful = true;
                        Game.addKronikaEntry('minor',
                            '⚖️ Kapitula: spor mezi bratry ' + ka.name + ' a ' + kb.name + ' urovnán smírem.',
                            '⚖️ Chapter: the dispute between ' + ka.name + ' and ' + kb.name + ' was settled peacefully.',
                            '⚖️ Capitulum: lis composita est.');
                        clearPending();
                        Game.save(); rerender();
                    }
                },
                {
                    label: (lang === 'en' ? '⚖️ Impose penance on ' + victim.name : '⚖️ Uložit Pokání — ' + victim.name), type: 'danger', effect: () => {
                        victim.penanceUntil = Date.now() + 2 * 24 * 60 * 60 * 1000;
                        victim.loyalty = Math.max(0, victim.loyalty - 5);
                        other.mood = Math.min(100, other.mood + 8);
                        hist.lastPeaceful = false;
                        UI.notifyPanel('⚖️ ' + (lang === 'en' ? victim.name + ' was given two days of penance.' : victim.name + ' dostal dva dny Pokání.'), 'warning');
                        Game.addKronikaEntry('important',
                            '⚖️ Kapitula: bratr ' + victim.name + ' dostal dva dny Pokání za spor s bratrem jménem ' + other.name + '.',
                            '⚖️ Chapter: brother ' + victim.name + ' received two days of penance over the dispute with brother ' + other.name + '.',
                            '⚖️ Capitulum: ' + victim.name + ' poenitentiam accepit.');
                        clearPending();
                        Game.save(); rerender();
                    }
                },
                {
                    label: (lang === 'en' ? '🤐 Let it be' : '🤐 Nechat být'), effect: () => {
                        hist.lastPeaceful = false;
                        ka.mood = Math.max(0, ka.mood - 5);
                        kb.mood = Math.max(0, kb.mood - 5);
                        Game.addKronikaEntry('minor',
                            '⚖️ Kapitula: spor mezi bratry zůstal nevyřešen. Hnisá dál.',
                            '⚖️ Chapter: the dispute among the brothers remains unresolved. It festers on.',
                            '⚖️ Capitulum: lis manet.');
                        clearPending();
                        Game.save(); rerender();
                    }
                }
            ]
        });
    },

    // ═══════════════════════════════════════════════════════════════════
    // MANUFAKTURA — dashboard vrstva nad Dormitorium/Conversi produkcí.
    // Nemění žádnou výnosovou logiku uvnitř checkConversiChores() —
    // manufacturaCollect() jen dočasně odemkne 24h gate pro JEDEN tab
    // a zavolá existující funkci beze změny. dvur nemá pole (údržba —
    // úklid/krmení po jednotlivých chlévech, ne jednorázový sběr).
    // athanor/scriptorium nejsou v CONVERSI_TASKS — jen bratr, bez konvrše.
    // ═══════════════════════════════════════════════════════════════════
    MANUFACTURA_LASTTICK_FIELD: {
        zahony: 'conversiGardenLastTick',
        sad: 'conversiOrchardLastTick',
        apiarium: 'conversiApiaryLastTick',
        piscina: 'conversiPiscinaLastTick',
        pole: 'conversiFieldLastTick',
        vinohrad: 'conversiVineaLastTick',
        athanor: 'conversiAthanorLastTick',
        scriptorium: 'conversiScriptoriumLastTick',
    },

    manufacturaCollect: function (tabKey) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const field = this.MANUFACTURA_LASTTICK_FIELD[tabKey];
        if (!field) return; // dvur — údržba, nic ke collectu
        const DAY = 24 * 60 * 60 * 1000;
        const last = GameState[field] || 0;
        if (Date.now() - last < DAY) {
            UI.notify(lang === 'en' ? '⏳ Not ready yet.' : '⏳ Ještě není připraveno.', true);
            return;
        }
        GameState[field] = 0; // odemkne gate — checkConversiChores tenhle tab zpracuje beze změny
        this.checkConversiChores(tabKey);
        Game.save();
        // checkConversiChores(tabKey) teď zpracuje JEN tenhle jeden tab
        // (onlyTab parametr) — ostatní ready taby zůstanou nedotčené, dokud
        // je hráč sám nesebere. Verifikace zůstává jako pojistka (např. build
        // chybí nebo nikdo nepracuje → LastTick zůstane na 0, nic se nestalo).
        if (GameState[field] > 0) {
            UI.notify(lang === 'en' ? '🧺 Collected.' : '🧺 Sebráno.', false);
        } else {
            UI.notify(lang === 'en'
                ? 'ℹ️ Nothing collected — check that someone is assigned and working here.'
                : 'ℹ️ Nic nesebráno — zkontroluj, že tam někdo je přiřazený a pracuje.', true);
        }
        // switchEntity() cílilo přímo na #cellarium-content, ale nad ním je
        // v shell.html obalový #home-cellarium-content s vlastním dirty-flag
        // systémem — bez nastavení UI._dirty.cellarium se refresh nepromítne
        // hned (musel se počkat na nějaký JINÝ trigger, odtud dojem "funguje
        // až na druhý klik"). Přepojeno na stejný ověřený vzor jako well.js.
        if (typeof UI !== 'undefined') {
            if (!UI._dirty) UI._dirty = {};
            UI._dirty.cellarium = true;
            UI.renderAll();
        }
    },

    // Jen čte, nic nemění. Pro dashboard kartu jednoho tabu.
    manufacturaStatus: function (tabKey) {
        const DAY = 24 * 60 * 60 * 1000;
        const field = this.MANUFACTURA_LASTTICK_FIELD[tabKey];
        // Hřbitov nemá vlastní bratr-specializaci — dohlíží na něj stejný
        // Kostelník jako na kostel (jeden bratr, celý Templum). XP/level se
        // proto čte pod 'kostel', ne pod 'hrbitov'.
        const brotherTabKey = tabKey === 'hrbitov' ? 'kostel' : tabKey;
        const brother = (GameState.dormitorium && GameState.dormitorium.brothers || []).find(b => b.assignedTab === brotherTabKey);
        const konvrs = (GameState.conversi || []).find(k => k.task === tabKey);
        let ready = false, hoursLeft = null;
        if (field) {
            const elapsed = Date.now() - (GameState[field] || 0);
            ready = elapsed >= DAY;
            hoursLeft = ready ? 0 : Math.ceil((DAY - elapsed) / 3600000);
        }
        return {
            tabKey, brother, konvrs, hasField: !!field, ready, hoursLeft,
            level: brother ? this.dormitoriumBrotherLevel(brother, brotherTabKey) : null,
            mult: brother ? this.dormitoriumBrotherMult(brother, brotherTabKey) : null,
            xp: brother ? ((brother.xp && brother.xp[brotherTabKey]) || 0) : null,
            combo: !!(brother && konvrs),
        };
    },

    checkConversiChores: function (onlyTab) {
        // POZOR: dřív zde bylo `if (!GameState.conversi || length===0) return;`,
        // což při absenci JAKÉHOKOLIV konvrše zablokovalo i Dormitorium bratry
        // (ti fungují nezávisle na Conversi). Nahrazeno bezpečnou inicializací.
        if (!GameState.conversi) GameState.conversi = [];

        // Přehled práce za poslední tick — vyčistit na začátku, naplní ho
        // jednotlivé sekce (_reportWork) při odvedené práci.
        GameState.lastTickReport = [];

        // Migrace: sdílená conversiFatigue → per-konvrš fatigue (varianta A: rozdat hodnotu)
        const legacyFatigue = (typeof GameState.conversiFatigue === 'number') ? GameState.conversiFatigue : 0;
        GameState.conversi.forEach(k => {
            if (typeof k.fatigue !== 'number') k.fatigue = legacyFatigue;
            if (typeof k.mood !== 'number') k.mood = 60;
            if (typeof k.loyalty !== 'number') k.loyalty = 30;
            if (typeof k.unfedStreak !== 'number') k.unfedStreak = 0;
            // Migrace: starý save bez rosterId → dohledat podle jména; mimo roster = null (běží dál bez hlášek)
            if (k.rosterId === undefined && typeof ConversiRosterDB !== 'undefined') {
                const rid = Object.keys(ConversiRosterDB).find(r => ConversiRosterDB[r].name === k.name);
                k.rosterId = rid || null;
            }
        });
        if (typeof GameState.conversiFatigue === 'number') delete GameState.conversiFatigue;

        // ── Mzda: 2 groše/konvrš, výplatní den 1×/7 reálných dní ──
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!GameState.conversiNextWage) GameState.conversiNextWage = Date.now() + WEEK; // první výplata za týden, žádný zpětný dluh
        if (Date.now() >= GameState.conversiNextWage && GameState.conversi.length > 0) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const leavers = [];
            let paidCount = 0, paidTotal = 0;
            GameState.conversi.forEach(k => {
                if (k.type === 'oblat') return; // dozrává, ještě nebere mzdu
                if (typeof k.wageOwed !== 'number') k.wageOwed = 0;
                const wageBase = k.type === 'famulus' ? 4 : 2;
                const due = wageBase + k.wageOwed;
                const grose = (typeof CellariumSystem !== 'undefined') ? CellariumSystem.getGrose() : 0;
                if (grose >= due) {
                    CellariumSystem.addGrose(-due);
                    if (k.wageOwed > 0 && k.type !== 'famulus') k.loyalty = Math.min(100, k.loyalty + 2); // splacený dluh = usmíření
                    k.wageOwed = 0;
                    paidCount++;
                    paidTotal += due;
                } else if (k.type === 'famulus') {
                    // Famulus — žádná trvalá vazba, při neplacení odchází okamžitě (ne gradual loyalty decay)
                    leavers.push(k);
                } else {
                    k.wageOwed += wageBase;
                    k.loyalty = Math.max(0, k.loyalty - 5);
                    k.mood = Math.max(0, k.mood - 5);
                    if (k.loyalty <= 0) leavers.push(k);
                }
            });
            // Souhrnná hláška za týden — jedna zpráva, ne per-konvrš spam.
            if (paidCount > 0) {
                if (typeof UI !== 'undefined' && UI.notifyPanel) {
                    UI.notifyPanel('💰 ' + (lang === 'en'
                        ? 'Wages paid: ' + paidCount + ' lay brother(s), ' + paidTotal + ' g.'
                        : 'Mzda vyplacena: ' + paidCount + ' konvrš(ů), ' + paidTotal + ' g.'), 'system');
                }
                Game.addKronikaEntry('minor',
                    '💰 Mzda vyplacena: ' + paidCount + ' konvrš(ů), ' + paidTotal + ' g.',
                    '💰 Wages paid: ' + paidCount + ' lay brother(s), ' + paidTotal + ' g.',
                    '');
            }
            leavers.forEach(k => {
                GameState.conversi = GameState.conversi.filter(x => x.id !== k.id);
                // Ztráta pracovního parťáka — bratr na stejném tabu to nese těžce.
                if (k.task) {
                    const partnerBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
                        .find(b => b.assignedTab === k.task);
                    if (partnerBrother) partnerBrother.stress = Math.min(100, (partnerBrother.stress || 0) + 8);
                }
                // Pověst (npc-subtab-konsolidovany-mrd.md §5) — nedobrovolný odchod
                // "zanedbáním" (ne translatio, ne důstojné rozvázání) sráží Lidovost.
                if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
                    PersonaSystem.addReputation('lidovost', -2);
                }
                if (typeof UI !== 'undefined' && UI.notifyPanel) {
                    UI.notifyPanel('🚪 ' + (lang === 'en'
                        ? k.name + ' has left the monastery — unpaid and forgotten.'
                        : k.name + ' opustil klášter — neplacen a zapomenut.'), 'warning');
                }
                Game.addKronikaEntry('important',
                    '🚪 ' + k.name + ' opustil klášter. Mzda zůstala nevyplacena příliš dlouho.',
                    '🚪 ' + k.name + ' left the monastery. His wages went unpaid too long.',
                    '🚪 ' + k.name + ' monasterium reliquit.'
                );
            });
            GameState.conversiNextWage = Date.now() + WEEK;
            Game.save();
        }

        // ── Kapitula: týdenní shromáždění (první za ~3,5 dne — střídá se s výplatou) ──
        if (!GameState.conversiNextKapitula) GameState.conversiNextKapitula = Date.now() + Math.round(WEEK / 2);
        if (Date.now() >= GameState.conversiNextKapitula && GameState.conversi.length > 0) {
            GameState.conversiNextKapitula = Date.now() + WEEK;
            this._runKapitula();
            Game.save();
        }

        // ── Temptation: denní drift podle Zbožnosti opata (persona.zboznost).
        // Nízká Zbožnost v komunitě = víc pokušení pro bratry; zdravá Zbožnost
        // ho naopak pomalu odplavuje (stejná "eroduje potichu" filozofie jako
        // Zbožnost/Vigor jinde ve hře). Self-guard 24h, nezávislé na Kapitule/mzdě.
        const DAY = 24 * 60 * 60 * 1000;
        if (!GameState.dormitoriumTemptationLastTick) GameState.dormitoriumTemptationLastTick = 0;
        if (Date.now() - GameState.dormitoriumTemptationLastTick >= DAY) {
            GameState.dormitoriumTemptationLastTick = Date.now();
            const brothers = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
            if (brothers.length > 0) {
                const zboznost = (GameState.persona && typeof GameState.persona.zboznost === 'number') ? GameState.persona.zboznost : 50;
                const delta = zboznost < 15 ? 4 : zboznost < 30 ? 2 : zboznost >= 70 ? -2 : 0;
                if (delta !== 0) {
                    brothers.forEach(b => {
                        b.temptation = Math.max(0, Math.min(100, (b.temptation || 0) + delta));
                    });
                    Game.save();
                }
            }
        }

        // ── Bestiář: Marginalie — uzavírací meta-karta. Odemkne se, jakmile
        // jsou nalezeny všechny předchozí bestie (jediná, co nemá teologa —
        // proto přichází poslední, ne nezávisle jako ostatní). Self-guard 24h.
        if (!GameState.marginalieCheckLastTick) GameState.marginalieCheckLastTick = 0;
        if (Date.now() - GameState.marginalieCheckLastTick >= DAY) {
            GameState.marginalieCheckLastTick = Date.now();
            const prereq = ['folio_titivillus_bestiar', 'folio_titivillus_secunda', 'folio_acedia_bestiar',
                'folio_belzebub_bestiar', 'folio_grim_bestiar', 'folio_revenanti_bestiar'];
            const folios = (GameState.scrinium && GameState.scrinium.folios) || {};
            const allFound = prereq.every(id => folios[id] && folios[id].found);
            if (allFound && typeof SecretsSystem !== 'undefined') {
                SecretsSystem.unlockFolioById('folio_marginalie_bestiar');
            }
        }

        // ── Valetudo pro Conversi/Dormitorium — jeden sdílený denní tick.
        // Mirror HealthSystem.js enginu (stejné HealthConditionsDB, stejný
        // onApply/tickHour tvar), jen NPC verze místo GameState.satiety/fatigue.
        // Výkonový postih: nemoc přidává fatigue navíc (přirozeně vyřadí z
        // výběru přes existující fatigue<80/90 filtry) + dormitoriumBrotherMult
        // má přímý ×0.7 postih (viz výš).
        if (!GameState.npcHealthLastTick) GameState.npcHealthLastTick = 0;
        if (Date.now() - GameState.npcHealthLastTick >= DAY && typeof HealthConditionsDB !== 'undefined') {
            GameState.npcHealthLastTick = Date.now();
            Game._npcHealthTick();
        }

        // ── Denní režim (Regula) ──
        const dayBlock = this.conversiDayBlock();


        // Officium (6–9): odpočinek + denní mood/loyalty tick — jednou za 24h
        if (dayBlock === 'officium') {
            const lastRest = GameState.conversiLastRest || 0;
            if (Date.now() - lastRest >= 24 * 60 * 60 * 1000) {
                const snorerPresent = GameState.conversi.some(k => this._konvrsTraits(k).includes('chrapoun'));
                const hiredIds = GameState.conversi.map(k => k.rosterId).filter(Boolean);
                GameState.conversi.forEach(k => {
                    const tr = this._konvrsTraits(k);
                    let rest = 10;
                    if (tr.includes('trpelivy')) rest = 15;
                    if (snorerPresent && !tr.includes('chrapoun')) rest = Math.min(rest, 7);
                    k.fatigue = Math.max(0, k.fatigue - rest);

                    // Mood: vazby mezi najatými (afinita +3, tenze -3); bez vazeb drift +2 k 60
                    let moodDelta = 0, hasBond = false;
                    if (k.rosterId && typeof ConversiBondsDB !== 'undefined') {
                        ConversiBondsDB.forEach(bd => {
                            const other = (bd.a === k.rosterId) ? bd.b : (bd.b === k.rosterId ? bd.a : null);
                            if (other && hiredIds.includes(other)) {
                                hasBond = true;
                                moodDelta += (bd.type === 'affinity') ? 3 : -3;
                            }
                        });
                    }
                    if (!hasBond && k.mood < 60) moodDelta += 2;
                    k.mood = Math.max(0, Math.min(100, (k.mood || 60) + moodDelta));
                    if (tr.includes('mrzout')) k.mood = Math.min(k.mood, 70);

                    // Loyalty: +1/den služby, zbožný +2
                    k.loyalty = Math.min(100, (k.loyalty || 30) + (tr.includes('zbozny') ? 2 : 1));
                });
                GameState.conversiLastRest = Date.now();
                Game.save();
            }
            if (!onlyTab) return; // na Officiu, automatický tick nedostupný pro úkoly (ruční Collect smí projít)
        }

        // Oběd (12–13): refektář — jídlo z klášterních zásob, jednou za 24h
        if (dayBlock === 'lunch') {
            this._runRefectory();
            if (!onlyTab) return; // u oběda, automatický tick nedostupný pro úkoly (ruční Collect smí projít)
        }

        // Nešpory (18–19): večerní modlitba — loyalty +1, jednou za 24h
        if (dayBlock === 'vespers') {
            const lastVespers = GameState.conversiLastVespers || 0;
            if (Date.now() - lastVespers >= 24 * 60 * 60 * 1000) {
                GameState.conversi.forEach(k => {
                    k.loyalty = Math.min(100, (k.loyalty || 30) + 1);
                });
                GameState.conversiLastVespers = Date.now();
                Game.save();
            }
            if (!onlyTab) return; // na nešporách, automatický tick nedostupný pro úkoly (ruční Collect smí projít)
        }

        // Noc (22–5): spánek
        if (dayBlock === 'night' && !onlyTab) return; // spánek — automatický tick nedostupný, ruční Collect smí projít

        // Práci dělá nejméně unavený dostupný konvrš PŘIŘAZENÝ na Dvůr (M1: přiřazení nahrazuje "kdo je volný")
        const worker = GameState.conversi
            .filter(k => k.task === 'dvur'
                && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > Date.now())
                && !(k.injuredUntil && k.injuredUntil > Date.now())
                && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        // POZOR: dřív zde bylo `if (!worker) return;`, což při absenci konvrše
        // na Dvoru zablokovalo ÚPLNĚ VŠECHNY následující sekce (Záhony, Sad,
        // Apiarium, Piscina, Pole, Vinohrad, Athanor) — každá má svůj vlastní
        // worker-filtr, takže na tomhle `return` nezávisí. Opraveno na
        // `if (worker || dvurBrother) { ... }`, aby zbytek funkce běžel bez
        // ohledu na obsazenost Dvora, a aby i samotný Dvůr fungoval s bratrem
        // bez přiřazeného konvrše (stejný vzor jako ostatní taby).
        const dvurBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'dvur');
        if ((!onlyTab || onlyTab === 'dvur') && (worker || dvurBrother)) {
            if (typeof FarmyardSystem === 'undefined') return;
            // Mapování: (argument pro cleanPen) → (klíč v GameState, kde se hlídá .built)
            const pens = [
                { arg: 'kurnik', state: 'henhouse' },
                { arg: 'kosar', state: 'sheepfold' },
                { arg: 'cowbyre', state: 'cowbyre' },
                { arg: 'pigsty', state: 'pigsty' },
                { arg: 'goatpen', state: 'goatpen' },
                { arg: 'rabbitry', state: 'rabbitry' },
                { arg: 'stable', state: 'stable' },
                { arg: 'donkeyStall', state: 'donkeyStall' },
            ];
            let cleanedAny = false;
            const DAY = 24 * 60 * 60 * 1000;
            pens.forEach(p => {
                const st = GameState[p.state];
                if (st && st.built) {
                    // Pojistka: chlév v cooldownu přeskočit tiše — cleanPen by toastoval "uklidíte až zítra"
                    if (Date.now() - (st.lastCleanMs || 0) < DAY) return;
                    const before = st.lastCleanMs || 0;
                    FarmyardSystem.cleanPen(p.arg);
                    if ((st.lastCleanMs || 0) > before) cleanedAny = true;
                }
            });

            // Krmení — jen dokud NENÍ Horreum (pak přebírá Game.checkAnimalFeeding()
            // automaticky, nezávisle na konvrši/bratrovi, aby se krmivo nespotřebovávalo 2×)
            let fedAny = false;
            const hasHorreum = GameState.storage && GameState.storage.horreum && GameState.storage.horreum.built;
            if (!hasHorreum) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                const animals = [
                    { key: 'henhouse', built: GameState.henhouse && GameState.henhouse.built && GameState.henhouse.hens && GameState.henhouse.hens.length > 0, feedChain: ['grain', 'feed_meal'], feedAmt: 1, name: lang === 'en' ? 'Hens' : 'Slepice' },
                    { key: 'sheepfold', built: GameState.sheepfold && GameState.sheepfold.built && GameState.sheepfold.sheep && GameState.sheepfold.sheep.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang === 'en' ? 'Sheep' : 'Ovce' },
                    { key: 'rabbitry', built: GameState.rabbitry && GameState.rabbitry.built && GameState.rabbitry.animals && GameState.rabbitry.animals.length > 0, feedChain: ['scraps', 'hay'], feedAmt: 1, name: lang === 'en' ? 'Rabbits' : 'Králíci' },
                    { key: 'goatpen', built: GameState.goatpen && GameState.goatpen.built && GameState.goatpen.animals && GameState.goatpen.animals.length > 0, feedChain: ['hay', 'scraps', 'feed_meal'], feedAmt: 1, name: lang === 'en' ? 'Goats' : 'Kozy' },
                    { key: 'cowbyre', built: GameState.cowbyre && GameState.cowbyre.built && GameState.cowbyre.animals && GameState.cowbyre.animals.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang === 'en' ? 'Cattle' : 'Skot' },
                    { key: 'pigsty', built: GameState.pigsty && GameState.pigsty.built && GameState.pigsty.animals && GameState.pigsty.animals.length > 0, feedChain: ['scraps', 'feed_meal', 'grain', 'hay'], feedAmt: 2, name: lang === 'en' ? 'Pigs' : 'Prasata' },
                ];
                animals.forEach(a => {
                    if (!a.built) return;
                    // v2: lastFedAt přímo na GameState[pen] — stejné pole jako getMood()/manuální Feed
                    const hoursSinceFed = (Date.now() - (GameState[a.key].lastFedAt || 0)) / 3600000;
                    if (hoursSinceFed < 24) return;
                    const useFeed = a.feedChain.find(f => (GameState.inventory[f] || 0) >= a.feedAmt);
                    if (useFeed) {
                        Game.removeItem(useFeed, a.feedAmt);
                        GameState[a.key].lastFedAt = Date.now();
                        fedAny = true;
                    }
                });
            }

            if (cleanedAny || fedAny) {
                if (worker) {
                    const workGain = this._konvrsTraits(worker).includes('silak') ? 10 : 15;
                    worker.fatigue = Math.min(100, worker.fatigue + workGain);
                }
                if (dvurBrother) {
                    this.dormitoriumAddXp(dvurBrother, 'dvur');
                    dvurBrother.fatigue = Math.min(100, (dvurBrother.fatigue || 0) + 10);
                }
                const who = this._workCredit(dvurBrother, worker);
                const parts_cs = [], parts_en = [];
                if (cleanedAny) { parts_cs.push('uklidil chlévy'); parts_en.push('cleaned the pens'); }
                if (fedAny) { parts_cs.push('nakrmil zvířata'); parts_en.push('fed the animals'); }
                if (typeof this._reportWork === 'function') {
                    this._reportWork(
                        `🏚️ ${who} (Dvůr): ${parts_cs.join(', ')}.`,
                        `🏚️ ${who} (Farmyard): ${parts_en.join(', ')}.`
                    );
                }
                Game.save();
            }
        }

        // ── Záhony (L1): přiřazený konvrš zalévá a sklízí, self-guarded 24h.
        //    Přiřazený bratr (Dormitorium) dělá totéž SÁM i bez konvrše;
        //    pokud je konvrš přítomen zároveň, bratr násobí jeho výnos podle
        //    své úrovně specializace "Zahradník". ──
        const gardener = GameState.conversi
            .filter(k => k.task === 'zahony'
                && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > Date.now())
                && !(k.injuredUntil && k.injuredUntil > Date.now())
                && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const gardenBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'zahony');
        if ((!onlyTab || onlyTab === 'zahony') && (gardener || gardenBrother) && GameState.garden) {
            if (!GameState.conversiGardenLastTick) GameState.conversiGardenLastTick = 0;
            if (Date.now() - GameState.conversiGardenLastTick >= DAY) {
                GameState.conversiGardenLastTick = Date.now();
                let didWork = false;

                let growthSpeed = CONFIG.GROWTH_SPEED;
                if (GameState.researchedTechs.includes('tech_advanced_farming')) growthSpeed *= 2.0;
                const brotherMult = gardenBrother ? this.dormitoriumBrotherMult(gardenBrother, 'zahony') : 1.0;
                const harvested = {};

                GameState.garden.forEach(plot => {
                    if (plot.locked || plot.state !== 2) return;
                    const growHoursForPlot = (typeof GardenSystem !== 'undefined') ? GardenSystem.getGrowHours(plot.crop) : 24;
                    const needed = (growHoursForPlot * 3600000) / growthSpeed;

                    // Zalít, pokud suché a je voda na skladě
                    if (!plot.water) {
                        if ((GameState.inventory['water'] || 0) > 0) {
                            Game.removeItem('water', 1);
                            plot.water = true;
                            didWork = true;
                        }
                        return;
                    }

                    // Sklidit, pokud dozrálo — stejná logika výnosu jako farmAction, záhon zůstane prázdný
                    if (Date.now() > plot.plantedAt + needed) {
                        const harvestCrop = plot.crop;
                        const _wasFertStage = plot.fertStage;
                        const _wasFertQuality = plot.fertQuality;
                        const _wasMidGrowFertilized = plot.midGrowFertilized;
                        plot.state = 0; plot.water = false; plot.crop = null;
                        plot.fertStage = 0; plot.fertQuality = 0; plot.midGrowFertilized = false;
                        didWork = true;

                        if (GameState.achievements) GameState.achievements.stats.harvests++;
                        const _gp = (typeof GardenSystem !== 'undefined')
                            ? Object.values(GardenSystem.GARDEN_PLANTS_DB).find(p => p.item === harvestCrop)
                            : null;
                        const _yieldMult = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('herb_yield') : 1.0;
                        // MRD zahony-tiers — stejný vzorec jako farmAction
                        let _fertMultAuto = 0.6;
                        if (_wasFertStage >= 1) _fertMultAuto = (_wasFertQuality === 2) ? 1.15 : 1.0;
                        if (_wasMidGrowFertilized) _fertMultAuto = 1.3;
                        const totalMult = _yieldMult * brotherMult * _fertMultAuto;
                        const track = (id, qty) => { harvested[id] = (harvested[id] || 0) + qty; };
                        if (_gp) {
                            const q = Math.max(1, Math.round(_gp.yield * totalMult));
                            Game.addItem(harvestCrop, q); track(harvestCrop, q);
                            if (!_gp.canFlower && Math.random() < 0.3) Game.addItem(_gp.seed, 1);
                        } else if (harvestCrop === 'hops') {
                            const q = Math.max(1, Math.round(2 * totalMult));
                            Game.addItem('hops', q); track('hops', q);
                            if (Math.random() > 0.6) Game.addItem('seeds_hops', 1);
                        } else if (['carrot', 'onion', 'potato'].includes(harvestCrop)) {
                            const q = Math.max(1, Math.round(3 * totalMult));
                            Game.addItem(harvestCrop, q); track(harvestCrop, q);
                            if (Math.random() > 0.5) Game.addItem('seeds_vegetable', 1);
                        } else if (harvestCrop) {
                            const q = Math.max(1, Math.round(2 * totalMult));
                            Game.addItem(harvestCrop, q); track(harvestCrop, q);
                        }
                    }
                });

                if (didWork) {
                    if (gardener) {
                        const workGain = this._konvrsTraits(gardener).includes('silak') ? 10 : 15;
                        gardener.fatigue = Math.min(100, gardener.fatigue + workGain);
                    }
                    if (gardenBrother) {
                        this.dormitoriumAddXp(gardenBrother, 'zahony');
                        gardenBrother.fatigue = Math.min(100, (gardenBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(gardenBrother, gardener);
                    const harvestKeys = Object.keys(harvested);
                    if (harvestKeys.length) {
                        const listStr = harvestKeys.map(id => `${harvested[id]}× ${(typeof iName === 'function') ? iName(id) : id}`).join(', ');
                        this._reportWork(`🌿 ${who} (Záhony) sklidil: ${listStr}.`, `🌿 ${who} (Garden) harvested: ${listStr}.`);
                    } else {
                        this._reportWork(`🌿 ${who} (Záhony) zaléval.`, `🌿 ${who} (Garden) watered.`);
                    }
                    Game.checkAchievements();
                    Game.save();
                }
            }
        }

        // ── Sad (L1): přiřazený konvrš sklízí dozrálé stromy, self-guarded 24h.
        //    Přiřazený bratr (specializace "Sadař") dělá totéž sám i bez
        //    konvrše; s konvršem násobí jeho výnos. ──
        const orchardKeeper = GameState.conversi
            .filter(k => k.task === 'sad'
                && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > Date.now())
                && !(k.injuredUntil && k.injuredUntil > Date.now())
                && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const orchardBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'sad');
        if ((!onlyTab || onlyTab === 'sad') && (orchardKeeper || orchardBrother) && GameState.orchard) {
            if (!GameState.conversiOrchardLastTick) GameState.conversiOrchardLastTick = 0;
            if (Date.now() - GameState.conversiOrchardLastTick >= DAY) {
                GameState.conversiOrchardLastTick = Date.now();
                let didHarvest = false;
                const brotherMult = orchardBrother ? this.dormitoriumBrotherMult(orchardBrother, 'sad') : 1.0;
                const harvested = {};

                const TREE_DATA = {
                    seed_apple: { harvestHours: 24 }, seed_pear: { harvestHours: 24 },
                    seed_plum: { harvestHours: 20 }, seed_cherry: { harvestHours: 18 },
                    seed_walnut: { harvestHours: 48 }, seed_mulberry: { harvestHours: 24 },
                    seed_quince: { harvestHours: 36 }, seed_sorb: { harvestHours: 48 },
                    seed_rowan: { harvestHours: 24 }, seed_linden: { harvestHours: 36 },
                };
                const TREE_FRUITS = {
                    seed_apple: 'apple', seed_pear: 'pear', seed_plum: 'plum',
                    seed_cherry: 'cherry', seed_walnut: 'walnut', seed_mulberry: 'mulberry',
                    seed_quince: 'quince', seed_sorb: 'sorb', seed_rowan: 'rowan',
                    seed_linden: 'linden_fruit',
                };

                (GameState.orchard || []).forEach(slot => {
                    if (slot.state !== 'mature') return;
                    const td = TREE_DATA[slot.treeType];
                    const fruitAt = slot.lastHarvestAt + (td ? td.harvestHours * 3600000 : 86400000);
                    if (Date.now() < fruitAt) return; // ještě neplodí — čeká na cooldown, stejně jako u ruční sklizně

                    const fruit = TREE_FRUITS[slot.treeType];
                    if (!fruit) return;
                    const baseQty = (slot.treeType === 'seed_walnut' || slot.treeType === 'seed_sorb') ? 2 : 3;
                    const qty = Math.max(1, Math.round(baseQty * brotherMult));
                    Game.addItem(fruit, qty);
                    harvested[fruit] = (harvested[fruit] || 0) + qty;
                    if (slot.treeType === 'seed_linden') Game.addItem('linden_blossom', 1);
                    Game.addItem('pollen', 1);
                    slot.lastHarvestAt = Date.now();
                    didHarvest = true;
                });

                if (didHarvest) {
                    if (orchardKeeper) {
                        const workGain = this._konvrsTraits(orchardKeeper).includes('silak') ? 10 : 15;
                        orchardKeeper.fatigue = Math.min(100, orchardKeeper.fatigue + workGain);
                    }
                    if (orchardBrother) {
                        this.dormitoriumAddXp(orchardBrother, 'sad');
                        orchardBrother.fatigue = Math.min(100, (orchardBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(orchardBrother, orchardKeeper);
                    const listStr = Object.keys(harvested).map(id => `${harvested[id]}× ${(typeof iName === 'function') ? iName(id) : id}`).join(', ');
                    this._reportWork(`🍎 ${who} (Sad) sklidil: ${listStr}.`, `🍎 ${who} (Orchard) harvested: ${listStr}.`);
                    Game.save();
                }
            }
        }

        // ── Apiarium (L1): přiřazený konvrš sklízí med/vosk, přikrmuje v zimě
        //    a léčí Varroa — self-guarded 24h. Přiřazený bratr (specializace
        //    "Včelař") dělá totéž sám i bez konvrše; s konvršem násobí výnos
        //    sklizně (Varroa léčba a zimní přikrmení jsou binární, bez bonusu). ──
        const beekeeper = GameState.conversi
            .filter(k => k.task === 'apiarium'
                && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > Date.now())
                && !(k.injuredUntil && k.injuredUntil > Date.now())
                && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const apiaryBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'apiarium');
        if ((!onlyTab || onlyTab === 'apiarium') && (beekeeper || apiaryBrother) && GameState.apiary && typeof GardenSystem !== 'undefined') {
            if (!GameState.conversiApiaryLastTick) GameState.conversiApiaryLastTick = 0;
            if (Date.now() - GameState.conversiApiaryLastTick >= DAY) {
                GameState.conversiApiaryLastTick = Date.now();
                let didWork = false;
                const season = Game._getApiarySeason();
                const now = Date.now();
                const weatherMod = Game._apiaryWeatherMod();
                const brotherMult = apiaryBrother ? this.dormitoriumBrotherMult(apiaryBrother, 'apiarium') : 1.0;
                let honeyGained = 0, waxGained = 0, varroaTreated = 0, fedHives = 0, veteranQueens = 0;

                GameState.apiary.forEach(hive => {
                    if (!hive.built || !hive.hasQueen) return;

                    // Varroa roste tiše s časem — konvrš ji sleduje a léčí, jakmile je vysoká
                    const elapsedH = (now - hive.lastCollectAt) / 3600000;
                    const varroaResist = hive.queenVarroaResist || 3;
                    hive.varroa = Math.min(100, (hive.varroa || 0) + Math.max(1, Math.round((elapsedH / 8) * (5 - varroaResist))));

                    // Léčba Varroa má přednost — riziko hrozí kdykoliv v roce
                    if (hive.varroa >= 40) {
                        if ((GameState.inventory['thyme'] || 0) > 0) {
                            Game.removeItem('thyme', 1);
                            hive.varroa = Math.max(0, hive.varroa - (30 + varroaResist * 5));
                            hive.strength = Math.max(1, (hive.strength || 3) - 1);
                            didWork = true;
                            varroaTreated++;
                        }
                        return;
                    }

                    if (season === 'winter') {
                        // Zimní přikrmení — jen pokud síla není už na maximu
                        if (hive.strength < 10 && (GameState.inventory['honey'] || 0) > 0) {
                            Game.removeItem('honey', 1);
                            hive.strength = Math.min(10, (hive.strength || 3) + 1);
                            didWork = true;
                            fedHives++;
                        }
                        return;
                    }

                    // Sklizeň — stejná gate logika jako ruční collectHive
                    const COLLECT_HOURS = { spring: 16, summer: 8, autumn: 20 };
                    const hours = COLLECT_HOURS[season] || 12;
                    if (now < hive.lastCollectAt + (hours * 3600000)) return;

                    const varroaPenalty = hive.varroa >= 70 ? 0.5 : hive.varroa >= 40 ? 0.8 : 1.0;
                    const strengthMod = (hive.strength || 3) / 5;
                    const queenMod = (hive.queenStrength || 3) / 3;
                    const honeyBase = { spring: 1, summer: 3, autumn: 1 };
                    const waxBase = { spring: 1, summer: 1, autumn: 2 };
                    const hQty = Math.max(1, Math.round(honeyBase[season] * strengthMod * queenMod * weatherMod * varroaPenalty * brotherMult));
                    const wQty = Math.max(1, Math.round(waxBase[season] * strengthMod * varroaPenalty * brotherMult));
                    Game.addItem('honey', hQty);
                    Game.addItem('beeswax', wQty);
                    honeyGained += hQty; waxGained += wQty;

                    if (season === 'summer') {
                        const hasFlowers = GameState.garden && GameState.garden.some(p => p.state === 2 && p.water);
                        const hasTrees = GameState.orchard && GameState.orchard.some(s => s.state === 'mature');
                        if (hasFlowers || hasTrees) Game.addItem('bee_bread', 1);
                    }

                    hive.strength = Math.min(10, (hive.strength || 3) + 1);

                    // Rojivá nálada — konvrš díky pravidelné 24h péči nálada roste pomaleji,
                    // ale odlet je pořád možný (pravděpodobnostně, ne pevný práh)
                    if (hive.strength >= 8) {
                        hive.swarmMood = Math.min(100, (hive.swarmMood || 0) + 4);
                    } else {
                        hive.swarmMood = Math.max(0, (hive.swarmMood || 0) - 5);
                    }
                    if (hive.swarmMood >= 60 && Math.random() < 0.35) {
                        const veteranChance = 0.08 + (hive.queenWinter || 3) * 0.04;
                        if (Math.random() < veteranChance) { Game.addItem('veteran_queen', 1); veteranQueens++; }
                        hive.hasQueen = false;
                        hive.queenName = null;
                        hive.strength = 0;
                        hive.varroa = 0;
                        hive.swarmMood = 0;
                        didWork = true;
                        return;
                    }
                    hive.lastCollectAt = now;
                    didWork = true;
                });

                if (didWork) {
                    if (beekeeper) {
                        const workGain = this._konvrsTraits(beekeeper).includes('silak') ? 10 : 15;
                        beekeeper.fatigue = Math.min(100, beekeeper.fatigue + workGain);
                    }
                    if (apiaryBrother) {
                        this.dormitoriumAddXp(apiaryBrother, 'apiarium');
                        apiaryBrother.fatigue = Math.min(100, (apiaryBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(apiaryBrother, beekeeper);
                    const parts_cs = [], parts_en = [];
                    if (honeyGained || waxGained) { parts_cs.push(`sklidil ${honeyGained}× med, ${waxGained}× vosk`); parts_en.push(`harvested ${honeyGained}× honey, ${waxGained}× wax`); }
                    if (varroaTreated) { parts_cs.push(`ošetřil ${varroaTreated} úl(y) proti Varroa`); parts_en.push(`treated ${varroaTreated} hive(s) for Varroa`); }
                    if (fedHives) { parts_cs.push(`přikrmil ${fedHives} úl(y)`); parts_en.push(`fed ${fedHives} hive(s)`); }
                    if (veteranQueens) { parts_cs.push(`zachránil ${veteranQueens} vysloužilou matku z roje`); parts_en.push(`saved ${veteranQueens} veteran queen from a swarm`); }
                    this._reportWork(
                        `🐝 ${who} (Apiarium): ${parts_cs.join(', ')}.`,
                        `🐝 ${who} (Apiary): ${parts_en.join(', ')}.`
                    );
                    Game.save();
                }
            }
        }

        // ── Piscina (L1): přiřazený konvrš krmí ryby, přesouvá čekající plůdek
        //    a sklízí dospělé kapry — self-guarded 24h. Přiřazený bratr
        //    (specializace "Rybář") dělá totéž sám i bez konvrše; s konvršem
        //    násobí sklizený počet kaprů (krmení/přesun plůdku beze změny). ──
        const fisherman = GameState.conversi
            .filter(k => k.task === 'piscina'
                && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > Date.now())
                && !(k.injuredUntil && k.injuredUntil > Date.now())
                && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const piscinaBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'piscina');
        if ((!onlyTab || onlyTab === 'piscina') && (fisherman || piscinaBrother) && GameState.piscina && GameState.piscina.tier >= 1) {
            if (!GameState.conversiPiscinaLastTick) GameState.conversiPiscinaLastTick = 0;
            if (Date.now() - GameState.conversiPiscinaLastTick >= DAY) {
                GameState.conversiPiscinaLastTick = Date.now();
                const p = GameState.piscina;
                let didWork = false;
                const brotherMult = piscinaBrother ? this.dormitoriumBrotherMult(piscinaBrother, 'piscina') : 1.0;
                let didFeed = false, didTransfer = false, carpCaught = 0;

                // Krmení — spotřebuje fiber podle počtu ryb všech stupňů
                const feedNeeded = (p.fry || 0) + (p.youngCarp || 0) + (p.carp || 0);
                if (feedNeeded > 0 && (GameState.inventory['fiber'] || 0) >= feedNeeded) {
                    Game.removeItem('fiber', feedNeeded);
                    p.lastFedAt = Date.now();
                    didWork = true; didFeed = true;
                }

                // Přesun čekajícího plůdku do prvního stupně — vlastní řádek
                if ((p.pendingFry || 0) > 0) {
                    p.fish = p.fish || [];
                    p.fish.push({ id: Game._piscinaNextId(), species: 'kapr', stage: 'fry', qty: p.pendingFry, enteredStageAt: Date.now() });
                    p.pendingFry = 0;
                    didWork = true; didTransfer = true;
                }

                // Sklizeň všech dospělých kaprů — bratr násobí ulovené množství.
                // Filtr na species:'kapr' záměrně — jiné druhy (štika a další
                // z Trhu/Clientely) tímhle automatem NEsmí projít, jinak by se
                // sklidily jako 'carp' bez ohledu na skutečný druh (viz Sprint 4).
                const carpTotal = (p.fish || []).filter(r => r.stage === 'adult' && r.species === 'kapr').reduce((s, r) => s + r.qty, 0);
                if (carpTotal > 0) {
                    const qty = Math.max(carpTotal, Math.round(carpTotal * brotherMult));
                    (p.fish || []).forEach(r => { if (r.stage === 'adult' && r.species === 'kapr') r.qty = 0; });
                    Game.addItem('carp', qty);
                    didWork = true; carpCaught = qty;
                }

                Game._piscinaSyncAggregates();

                if (didWork) {
                    if (fisherman) {
                        const workGain = this._konvrsTraits(fisherman).includes('silak') ? 10 : 15;
                        fisherman.fatigue = Math.min(100, fisherman.fatigue + workGain);
                    }
                    if (piscinaBrother) {
                        this.dormitoriumAddXp(piscinaBrother, 'piscina');
                        piscinaBrother.fatigue = Math.min(100, (piscinaBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(piscinaBrother, fisherman);
                    const parts_cs = [], parts_en = [];
                    if (didFeed) { parts_cs.push('nakrmil ryby'); parts_en.push('fed the fish'); }
                    if (didTransfer) { parts_cs.push('přesunul plůdek'); parts_en.push('moved the fry'); }
                    if (carpCaught) { parts_cs.push(`vylovil ${carpCaught}× kapra`); parts_en.push(`caught ${carpCaught}× carp`); }
                    this._reportWork(
                        `🐟 ${who} (Piscina): ${parts_cs.join(', ')}.`,
                        `🐟 ${who} (Fishpond): ${parts_en.join(', ')}.`
                    );
                    Game.save();
                }
            }
        }

        // ── Pole (L1): přiřazený konvrš zalévá rostoucí pole a sklízí dozrálá,
        //    self-guarded 24h. Volá přímo GardenSystem.waterField/harvestField —
        //    výpočet výnosu (počasí, kvalita zrna, sláma) je tam příliš složitý
        //    na bezpečné duplikování zvlášť. Přiřazený bratr (specializace
        //    "Rolník") dělá totéž sám i bez konvrše; s konvršem násobí výnos —
        //    bonus se dopočítává porovnáním stavu inventáře před/po sklizni. ──
        const plowman = GameState.conversi
            .filter(k => k.task === 'pole'
                && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > Date.now())
                && !(k.injuredUntil && k.injuredUntil > Date.now())
                && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const fieldBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'pole');
        if ((!onlyTab || onlyTab === 'pole') && (plowman || fieldBrother) && GameState.fields && typeof GardenSystem !== 'undefined') {
            if (!GameState.conversiFieldLastTick) GameState.conversiFieldLastTick = 0;
            if (Date.now() - GameState.conversiFieldLastTick >= DAY) {
                GameState.conversiFieldLastTick = Date.now();
                let didWork = false;
                const techs = GameState.researchedTechs || [];
                const waterCost = techs.includes('tech_field_irrigation') ? 1 : 2;
                const brotherMult = fieldBrother ? this.dormitoriumBrotherMult(fieldBrother, 'pole') : 1.0;
                const harvested = {};

                GameState.fields.forEach((field, idx) => {
                    if (field.locked || field.state !== 'growing') return;

                    if (!field.watered) {
                        if ((GameState.inventory['water'] || 0) >= waterCost) {
                            GardenSystem.waterField(idx);
                            didWork = true;
                        }
                        return;
                    }
                    if (field.phase >= 3) {
                        const before = Object.assign({}, GameState.inventory);
                        GardenSystem.harvestField(idx);
                        didWork = true;
                        Object.keys(GameState.inventory).forEach(itemId => {
                            let gained = (GameState.inventory[itemId] || 0) - (before[itemId] || 0);
                            if (gained <= 0) return;
                            if (brotherMult > 1.0) {
                                const bonus = Math.round(gained * (brotherMult - 1.0));
                                if (bonus > 0) { Game.addItem(itemId, bonus); gained += bonus; }
                            }
                            harvested[itemId] = (harvested[itemId] || 0) + gained;
                        });
                    }
                });

                if (didWork) {
                    if (plowman) {
                        const workGain = this._konvrsTraits(plowman).includes('silak') ? 10 : 15;
                        plowman.fatigue = Math.min(100, plowman.fatigue + workGain);
                    }
                    if (fieldBrother) {
                        this.dormitoriumAddXp(fieldBrother, 'pole');
                        fieldBrother.fatigue = Math.min(100, (fieldBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(fieldBrother, plowman);
                    const harvestKeys = Object.keys(harvested);
                    if (harvestKeys.length) {
                        const listStr = harvestKeys.map(id => `${harvested[id]}× ${(typeof iName === 'function') ? iName(id) : id}`).join(', ');
                        this._reportWork(`🌾 ${who} (Pole) sklidil: ${listStr}.`, `🌾 ${who} (Field) harvested: ${listStr}.`);
                    } else {
                        this._reportWork(`🌾 ${who} (Pole) zaléval.`, `🌾 ${who} (Field) watered.`);
                    }
                    Game.save();
                }
            }
        }

        // ── Vinohrad (L1): přiřazený konvrš zalévá, prořezává (i mimo sezónu —
        //    specialista, na rozdíl od hráče gate neplatí) a sklízí dozrálou révu,
        //    self-guarded 24h. Přiřazený bratr (specializace "Vinař") dělá totéž
        //    sám i bez konvrše; s konvršem násobí výnos sklizně (prořez/cuttings
        //    beze změny). ──
        const vintner = GameState.conversi
            .filter(k => k.task === 'vinohrad'
                && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                && (typeof k.mood !== 'number' || k.mood >= 30)
                && !(k.penanceUntil && k.penanceUntil > Date.now())
                && !(k.injuredUntil && k.injuredUntil > Date.now())
                && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const vineaBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'vinohrad');
        if ((!onlyTab || onlyTab === 'vinohrad') && (vintner || vineaBrother) && GameState.vinea && typeof GardenSystem !== 'undefined') {
            if (!GameState.conversiVineaLastTick) GameState.conversiVineaLastTick = 0;
            if (Date.now() - GameState.conversiVineaLastTick >= DAY) {
                GameState.conversiVineaLastTick = Date.now();
                let didWork = false;
                const techs = GameState.researchedTechs || [];
                const waterCost = techs.includes('tech_field_irrigation') ? 1 : 2;
                const brotherMult = vineaBrother ? this.dormitoriumBrotherMult(vineaBrother, 'vinohrad') : 1.0;
                let prunedCount = 0;
                const harvested = {};

                GameState.vinea.forEach((slot, idx) => {
                    if (!slot || slot.state === 'empty' || slot.state === 'dormant') return;

                    // Prořez — konvrš specialista obchází sezónní gate (na rozdíl od hráče)
                    if (!slot.pruned && (slot.state === 'planted' || slot.state === 'growing')) {
                        const variety = slot.variety ? GardenSystem.VINEA_DB[slot.variety] : null;
                        if (variety) {
                            slot.pruned = true;
                            const cuttings = Math.random() < 0.5 ? 2 : 1;
                            slot.cuttingsAvailable = cuttings;
                            Game.addItem(variety.viticis, cuttings);
                            didWork = true;
                            prunedCount++;
                        }
                    }

                    // Zalévání — mimo dormant/empty, jen pokud je voda na skladě
                    if ((GameState.inventory['water'] || 0) >= waterCost) {
                        GardenSystem.waterVine(idx);
                        didWork = true;
                    }

                    // Sklizeň dozrálé révy
                    if (slot.state === 'ripe') {
                        const before = Object.assign({}, GameState.inventory);
                        GardenSystem.harvestVine(idx);
                        didWork = true;
                        Object.keys(GameState.inventory).forEach(itemId => {
                            let gained = (GameState.inventory[itemId] || 0) - (before[itemId] || 0);
                            if (gained <= 0) return;
                            if (brotherMult > 1.0) {
                                const bonus = Math.round(gained * (brotherMult - 1.0));
                                if (bonus > 0) { Game.addItem(itemId, bonus); gained += bonus; }
                            }
                            harvested[itemId] = (harvested[itemId] || 0) + gained;
                        });
                    }
                });

                if (didWork) {
                    if (vintner) {
                        const workGain = this._konvrsTraits(vintner).includes('silak') ? 10 : 15;
                        vintner.fatigue = Math.min(100, vintner.fatigue + workGain);
                    }
                    if (vineaBrother) {
                        this.dormitoriumAddXp(vineaBrother, 'vinohrad');
                        vineaBrother.fatigue = Math.min(100, (vineaBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(vineaBrother, vintner);
                    const parts_cs = [], parts_en = [];
                    if (prunedCount) { parts_cs.push(`prořezal ${prunedCount} keř(ů)`); parts_en.push(`pruned ${prunedCount} vine(s)`); }
                    const harvestKeys = Object.keys(harvested);
                    if (harvestKeys.length) {
                        const listStr = harvestKeys.map(id => `${harvested[id]}× ${(typeof iName === 'function') ? iName(id) : id}`).join(', ');
                        parts_cs.push(`sklidil: ${listStr}`);
                        parts_en.push(`harvested: ${listStr}`);
                    }
                    if (!parts_cs.length) { parts_cs.push('zaléval'); parts_en.push('watered'); }
                    this._reportWork(
                        `🍇 ${who} (Vinohrad): ${parts_cs.join(', ')}.`,
                        `🍇 ${who} (Vineyard): ${parts_en.join(', ')}.`
                    );
                    Game.save();
                }
            }
        }

        // ── Athanor (L1, Dormitorium MRD Fáze 1): přiřazený bratr (specializace
        //    "Alchymista") sám vybírá ingredience a vaří, self-guarded 24h.
        //    Žádný Conversi task pro Athanor neexistuje — čistě bratrovská role.
        //    Heuristika výběru: bratr vaří POUZE již objevené kombinace
        //    (state.discovered[]), aby neplýtval vzácné suroviny na neznámé
        //    pokusy. Pokud žádnou známou kombinaci nemá po ruce, nedělá nic. ──
        const athanorBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'athanor');
        if ((!onlyTab || onlyTab === 'athanor') && athanorBrother && GameState.athanor && typeof AthanorDB !== 'undefined' && typeof CombinationEngine !== 'undefined') {
            if (!GameState.conversiAthanorLastTick) GameState.conversiAthanorLastTick = 0;
            if (Date.now() - GameState.conversiAthanorLastTick >= DAY) {
                GameState.conversiAthanorLastTick = Date.now();
                const state = GameState.athanor;

                // Bratr nezasahuje do hráčova právě probíhajícího vaření
                if (!state.brewing && state.discovered && state.discovered.length > 0) {
                    // Najdi první objevenou kombinaci, na kterou má bratr suroviny
                    let chosen = null;
                    for (const key of state.discovered) {
                        const sepIdx = key.lastIndexOf(':');
                        if (sepIdx < 0) continue;
                        const ingPart = key.slice(0, sepIdx);
                        const processId = key.slice(sepIdx + 1);
                        const slotIds = ingPart.split('+');

                        const counts = {};
                        slotIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
                        const hasAll = Object.entries(counts).every(([id, qty]) => (GameState.inventory[id] || 0) >= qty);
                        if (hasAll) { chosen = { slotIds, processId }; break; }
                    }

                    if (chosen) {
                        // Destilace vyžaduje alembik + baňku, stejně jako u hráče
                        const needsVitrea = chosen.processId === 'destillatio';
                        const hasAlembic = (GameState.inventory['alembic'] || 0) > 0;
                        const hasFlask = (GameState.inventory['glass_flask'] || 0) > 0;
                        if (!needsVitrea || (hasAlembic && hasFlask)) {
                            chosen.slotIds.forEach(id => Game.removeItem(id, 1));
                            if (needsVitrea) Game.removeItem('glass_flask', 1);

                            const result = CombinationEngine.evaluate(chosen.slotIds, chosen.processId);
                            if (result.success) {
                                const { combo, isCritical } = result;
                                const qty = combo.result.qty + (isCritical ? 1 : 0);
                                Game.addItem(combo.result.id, qty);
                                if (combo.effect && typeof AthanorSystem !== 'undefined' && AthanorSystem.applyEffect) {
                                    AthanorSystem.applyEffect(combo.effect, combo.name);
                                }
                                this._reportWork(
                                    `⚗️ ${athanorBrother.name} (Athanor) uvařil: ${qty}× ${combo.name}${isCritical ? ' ✨' : ''}.`,
                                    `⚗️ ${athanorBrother.name} (Athanor) brewed: ${qty}× ${combo.name}${isCritical ? ' ✨' : ''}.`
                                );
                            } else {
                                this._reportWork(
                                    `⚗️ ${athanorBrother.name} (Athanor) neuspěl při vaření — suroviny přišly vniveč.`,
                                    `⚗️ ${athanorBrother.name} (Athanor) failed the brew — ingredients wasted.`
                                );
                            }

                            this.dormitoriumAddXp(athanorBrother, 'athanor');
                            athanorBrother.fatigue = Math.min(100, (athanorBrother.fatigue || 0) + 10);
                            Game.save();

                            if (typeof AthanorSystem !== 'undefined' && AthanorSystem.refreshIfOpen) {
                                AthanorSystem.refreshIfOpen();
                            }
                        }
                    }
                }
            }
        }

        // ── Athanor Výzkum (athanor-research-mrd, Tier 1 — Llull): přiřazený
        //    bratr "Badatel" zkouší NEobjevené kombinace, self-guarded 24h.
        //    Tier 1 (Circulus Lullianus): filtrovaný pokus — před spotřebou
        //    surovin se kombinace "na zkoušku" vyhodnotí; pokud padne do
        //    CORRUPTIO (thermal/moisture mimo rozsah), zahodí se BEZ nákladu
        //    a zkusí se jiná. Denní budget dle náročnosti procesu, ne pevný
        //    počet pokusů. UNKNOWN se blacklistuje natrvalo (failedAttempts),
        //    LOCKED ne — recept může být později odemčen foliem. ──
        const RESEARCH_ATTEMPT_COST = { trituratio: 1, coctio: 1, maceratio: 1, destillatio: 2, calcinatio: 2 };
        const RESEARCH_DAILY_BUDGET = 3;
        const researchBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'athanor_research');
        if ((!onlyTab || onlyTab === 'athanor_research') && researchBrother && GameState.athanor
            && typeof AthanorDB !== 'undefined' && typeof CombinationEngine !== 'undefined'
            && GameState.researchedTechs && GameState.researchedTechs.includes('tech_athanor_ars_magna')
            && (GameState.inventory['circulus_lullianus'] || 0) > 0) {
            if (!GameState.conversiAthanorResearchLastTick) GameState.conversiAthanorResearchLastTick = 0;
            if (Date.now() - GameState.conversiAthanorResearchLastTick >= DAY) {
                GameState.conversiAthanorResearchLastTick = Date.now();
                const state = GameState.athanor;
                if (!state.failedAttempts) state.failedAttempts = [];

                if (!state.brewing) {
                    let budget = RESEARCH_DAILY_BUDGET;
                    let attempts = 0, successes = 0, newFinds = [], accident = false;

                    while (budget > 0 && !accident) {
                        // Najdi kombinaci "na zkoušku" — až 5 rerollů, bez nákladu,
                        // dokud nenarazí na něco, co stojí za skutečný pokus.
                        let picked = null;
                        for (let reroll = 0; reroll < 5 && !picked; reroll++) {
                            const feasibleProcs = AthanorDB.processes.filter(p => {
                                const cost = RESEARCH_ATTEMPT_COST[p.id] || 1;
                                if (cost > budget) return false;
                                if (p.unlock && !(GameState.researchedTechs && GameState.researchedTechs.includes(p.unlock))) return false;
                                if (p.id === 'destillatio' && !((GameState.inventory['alembic'] || 0) > 0 && (GameState.inventory['glass_flask'] || 0) > 0)) return false;
                                return true;
                            });
                            if (!feasibleProcs.length) break; // žádný proces se dnes už nevejde/není odemčen
                            const process = feasibleProcs[Math.floor(Math.random() * feasibleProcs.length)];

                            const pool = AthanorDB.ingredients.filter(ing => (GameState.inventory[ing.id] || 0) > 0);
                            if (!pool.length) break; // nic na skladě k pokusu

                            const maxSlots = (typeof AthanorSystem !== 'undefined' && AthanorSystem.maxSlots) ? AthanorSystem.maxSlots() : 3;
                            const n = 2 + Math.floor(Math.random() * (maxSlots - 1)); // 2..maxSlots
                            const slotIds = [];
                            for (let i = 0; i < n; i++) slotIds.push(pool[Math.floor(Math.random() * pool.length)].id);
                            const counts = {};
                            slotIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
                            const hasAll = Object.entries(counts).every(([id, qty]) => (GameState.inventory[id] || 0) >= qty);
                            if (!hasAll) continue; // reroll, nestálo to náklad

                            const key = [...slotIds].sort().join('+') + ':' + process.id;
                            if (state.failedAttempts.includes(key)) continue; // už víme, že je to slepá ulička

                            const preview = CombinationEngine.evaluate(slotIds, process.id);
                            if (!preview.success && preview.failure && preview.failure.id === 'CORRUPTIO') continue; // Llullův filtr — přeskočí bez nákladu

                            picked = { slotIds, process, key, result: preview };
                        }

                        if (!picked) break; // 5 rerollů bez výsledku — dnes už dál nejde

                        // Skutečný pokus — teď se to počítá.
                        const cost = RESEARCH_ATTEMPT_COST[picked.process.id] || 1;
                        budget -= cost;
                        attempts++;
                        picked.slotIds.forEach(id => Game.removeItem(id, 1));
                        if (picked.process.id === 'destillatio') Game.removeItem('glass_flask', 1);

                        const result = picked.result;
                        if (result.success) {
                            const { combo, isCritical } = result;
                            const qty = combo.result.qty + (isCritical ? 1 : 0);
                            Game.addItem(combo.result.id, qty);
                            if (combo.effect && typeof AthanorSystem !== 'undefined' && AthanorSystem.applyEffect) {
                                AthanorSystem.applyEffect(combo.effect, combo.name);
                            }
                            const isNewDiscovery = !state.discovered.includes(picked.key);
                            if (isNewDiscovery) { state.discovered.push(picked.key); newFinds.push(combo.name); }
                            successes++;
                        } else {
                            if (result.failure && result.failure.id === 'UNKNOWN' && !state.failedAttempts.includes(picked.key)) {
                                state.failedAttempts.push(picked.key);
                            }
                            // 4 % šance na nehodu při neúspěchu — popáleniny + zapečetěný Athanor
                            if (Math.random() < 0.04) {
                                accident = true;
                                if (!researchBrother.conditions) researchBrother.conditions = {};
                                if (!researchBrother.conditions['alchemical_burn']) {
                                    const def = HealthConditionsDB['alchemical_burn'];
                                    researchBrother.conditions['alchemical_burn'] = { startedAt: Date.now(), expiresAt: Date.now() + def.durationHours * 3600000 };
                                    if (def.onApply && typeof def.onApply.fatigue === 'number') {
                                        researchBrother.fatigue = Math.min(100, (researchBrother.fatigue || 0) + def.onApply.fatigue);
                                    }
                                }
                                if (!GameState.flags) GameState.flags = {};
                                GameState.flags.athanorSealedUntil = Date.now() + (2 * 3600000);
                            }
                        }
                        researchBrother.fatigue = Math.min(100, (researchBrother.fatigue || 0) + 15);
                        this.dormitoriumAddXp(researchBrother, 'athanor_research');
                    }

                    if (attempts > 0) {
                        const lang = (GameState.settings && GameState.settings.language) || 'cs';
                        let msg_cs = `🎡 ${researchBrother.name} (Výzkum) provedl ${attempts}× pokus`;
                        let msg_en = `🎡 ${researchBrother.name} (Research) ran ${attempts} attempt${attempts > 1 ? 's' : ''}`;
                        if (newFinds.length) {
                            msg_cs += ` — 📜 nový objev: ${newFinds.join(', ')}!`;
                            msg_en += ` — 📜 new discovery: ${newFinds.join(', ')}!`;
                        } else if (successes > 0) {
                            msg_cs += `, ${successes}× úspěšně (už známé recepty)`;
                            msg_en += `, ${successes} successful (already-known recipes)`;
                        } else {
                            msg_cs += `, bez úspěchu`;
                            msg_en += `, no success`;
                        }
                        if (accident) {
                            msg_cs += `. 🩹 Nehoda — ${researchBrother.name} se popálil, Athanor je poškozený.`;
                            msg_en += `. 🩹 Accident — ${researchBrother.name} was burned, the Athanor is damaged.`;
                        }
                        this._reportWork(msg_cs + '.', msg_en + '.');
                        Game.save();
                        if (typeof AthanorSystem !== 'undefined' && AthanorSystem.refreshIfOpen) {
                            AthanorSystem.refreshIfOpen();
                        }
                    }
                }
            }
        }

        // ── Scriptorium (L1): přiřazený bratr (specializace "Skriptor") ──
        //    Přiřazený bratr v Dormitoriu (Skriptor):
        //    1) Opisuje folia aktivního kodexu v Scriptorium (dle své úrovně Skriptor, spotřebovává Inkoust + Papír/Pergamen)
        //    2) Čte odemčené, dosud nepřečtené knihy v knihovně jako doplňkovou činnost.
        const scriptoriumBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'scriptorium' && (b.fatigue || 0) < 90);

        if ((!onlyTab || onlyTab === 'scriptorium') && scriptoriumBrother && GameState.library) {
            if (!GameState.conversiScriptoriumLastTick) GameState.conversiScriptoriumLastTick = 0;
            if (Date.now() - GameState.conversiScriptoriumLastTick >= DAY) {
                GameState.conversiScriptoriumLastTick = Date.now();

                let workDone = false;

                // 1) Opisování rukopisů
                if (!GameState.manuscriptsState) {
                    GameState.manuscriptsState = { activeId: 'anselm', progress: 0, auto: false, copies: {} };
                }
                const ms = GameState.manuscriptsState;
                if (!ms.copies) ms.copies = {};

                const MANUSCRIPTS_DB = {
                    anselm: 10, benedict: 20, chronica: 35, herbar: 50, homiliar: 75, gigas: 120
                };
                const MANUSCRIPT_NAMES = {
                    anselm: 'Žaltář sv. Anselma', benedict: 'Řehole sv. Benedikta', chronica: 'Kronika kláštera Kladruby',
                    herbar: 'Herbář a Lékařství', homiliar: 'Homiliář a Kázání', gigas: 'Codex Gigas'
                };

                const totalFolios = MANUSCRIPTS_DB[ms.activeId] || 10;
                const msName = MANUSCRIPT_NAMES[ms.activeId] || ms.activeId;

                const level = this.dormitoriumBrotherLevel(scriptoriumBrother, 'scriptorium') || 1;
                const maxFoliosToCopy = 1 + level; // Úroveň 1 = 2 folia, Úroveň 4 = 5 folií za den

                let foliosCopied = 0;
                for (let f = 0; f < maxFoliosToCopy; f++) {
                    const paper = GameState.inventory['paper'] || 0;
                    const parchment = GameState.inventory['parchment'] || 0;
                    const ink = GameState.inventory['ink'] || 0;

                    if (ink <= 0 || (paper <= 0 && parchment <= 0)) break;

                    GameState.inventory['ink'] = ink - 1;
                    if (parchment > 0) GameState.inventory['parchment'] = parchment - 1;
                    else GameState.inventory['paper'] = paper - 1;

                    ms.progress = (ms.progress || 0) + 1;
                    GameState.inventory['research'] = (GameState.inventory['research'] || 0) + 3;
                    foliosCopied++;

                    if (ms.progress >= totalFolios) {
                        ms.progress = 0;
                        ms.copies[ms.activeId] = (ms.copies[ms.activeId] || 0) + 1;
                        GameState.inventory['research'] += 20;
                        GameState.inventory['parchment'] = (GameState.inventory['parchment'] || 0) + 2;
                        this._reportWork(
                            `📜 ${scriptoriumBrother.name} (Skriptor) dokončil opis kodexu „${msName}“! (+20 Zápisků, +2 Pergamene).`,
                            `📜 ${scriptoriumBrother.name} (Scriptor) completed manuscript "${msName}"!`
                        );
                        break;
                    }
                }

                if (foliosCopied > 0) {
                    workDone = true;
                    this.dormitoriumAddXp(scriptoriumBrother, 'scriptorium');
                    scriptoriumBrother.fatigue = Math.min(100, (scriptoriumBrother.fatigue || 0) + 10);
                    this._reportWork(
                        `✒️ ${scriptoriumBrother.name} (Skriptor) opsal ${foliosCopied} folia kodexu „${msName}“ (+${foliosCopied * 3} Zápisků).`,
                        `✒️ ${scriptoriumBrother.name} (Scriptor) copied ${foliosCopied} folios of "${msName}".`
                    );
                }

                // 2) Čtení odemčených knih z knihovny
                if (typeof LibraryDB !== 'undefined' && typeof LibraryHelpers !== 'undefined') {
                    const unread = LibraryDB.books.find(b =>
                        GameState.library.unlockedBooks.includes(b.id) &&
                        !GameState.library.readBooks.includes(b.id)
                    );

                    if (unread) {
                        LibraryHelpers.readBook(unread.id);
                        if (!workDone) {
                            this.dormitoriumAddXp(scriptoriumBrother, 'scriptorium');
                            scriptoriumBrother.fatigue = Math.min(100, (scriptoriumBrother.fatigue || 0) + 10);
                        }
                        const title = unread.title || unread.id;
                        this._reportWork(
                            `📖 ${scriptoriumBrother.name} (Skriptor) přečetl knihu: „${title}“.`,
                            `📖 ${scriptoriumBrother.name} (Scriptor) read book: "${title}".`
                        );
                        workDone = true;
                    }
                }

                if (workDone) {
                    Game.save();
                }
            }
        }
    },
};