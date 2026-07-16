// ═══════════════════════════════════════════════════════════════════════════
// WELL SYSTEM (Puteus)
// Krok 1 — čistá extrakce z game.js (1:1, beze změny chování).
// Volání zatím přepojí Krok 3 (game.js/shell.html/ui.js), staré kopie smaže Krok 4.
// Pozn.: this.addItem/save → Game.addItem/save (uvnitř WellSystem je this = WellSystem).
//        this.getWellStats / this.checkWellDegradation zůstávají (jsou zde).
//        checkCalendarium NEpatří studni — voláno jako Game.checkCalendarium() (přesun později).
// ═══════════════════════════════════════════════════════════════════════════

const WellSystem = {

    DAY_MS: 24 * 60 * 60 * 1000,

    // ── Tuning konstanty (single source of truth, doladit po testu) ──────────
    USE_DECAY:    { basic: 6, stone: 3, blessed: 1 },   // purity −/čerpání
    RAIN_FILL:    8,                                     // hladina +/deštivý den
    DRY_DRAIN:    { basic: 4, stone: 3, blessed: 2 },    // hladina −/suchý den
    RAIN_MURK:    { basic: 2, stone: 0.5, blessed: 0 },  // purity −/deštivý den (kalí nekrytou)
    DRY_MURK:     { basic: 2, stone: 1, blessed: 0.5 },  // purity −/suchý den (stojatá voda)
    DRAW_COST:    5,                                     // hladina −/čerpání
    TIME_DECAY:   { basic: 3, stone: 1.5, blessed: 0.5 },// purity −/den FALLBACK (když počasí nedostupné)
    CLEAN_AMT:    40,                                    // purity + za vyčištění
    GRACE_DAYS:   5,                                     // dní bez degradace po čištění/stavbě
    PURITY_BANDS: { clean: 70 },                         // ≥70 clean, <70 dirty, 0 broken
    LEVEL_YIELD_BANDS: [                                  // schody výnosu dle hladiny (nahrazuje starý plynulý vzorec)
        { max: 0,   mod: null, fixed: 1, key: 'levelBandEmpty' },
        { max: 29,  mod: 0.4,  key: 'levelBandLow' },
        { max: 49,  mod: 0.6,  key: 'levelBandModerate' },
        { max: 69,  mod: 0.8,  key: 'levelBandGood' },
        { max: 100, mod: 1.0,  key: 'levelBandFull' }
    ],

    // Init / migrace stavu studny (přesun z Game.init + purity model v2)
    _ensureState: function() {
        if (!GameState.well) {
            GameState.well = {
                built: false,
                level: "none",
                condition: "clean",
                lastUse: 0
            };
        }
        const w = GameState.well;
        // Migrace na purity model (v2) — dopočítat z condition u starých saveů
        if (typeof w.purity !== 'number') {
            w.purity = (w.condition === 'broken') ? 0 : (w.condition === 'dirty') ? 50 : 100;
        }
        if (typeof w.level_water !== 'number') w.level_water = 100;
        if (typeof w.frozen !== 'boolean')     w.frozen = false;
        if (typeof w.lastTick !== 'number')     w.lastTick = Date.now();
        if (typeof w.lastClean !== 'number')    w.lastClean = Date.now();
        return w;
    },

    // Mapování purity 0–100 → condition (kompat se starým kódem / ui.js renderWell)
    // Pásma: 70–100 clean | 40–69 dirty | 1–39 dirty(zanesená) | 0 broken
    purityToCondition: function(p) {
        if (p <= 0)  return "broken";
        if (p < 70)  return "dirty";
        return "clean";
    },

    // Stupňovitý výnos dle hladiny — jeden zdroj pravdy pro drawWater() i reportInfo().
    // wl<=0 → fixní minimum (fixed), jinak base × mod dle pásma.
    _levelYield: function(base, wl) {
        const bands = this.LEVEL_YIELD_BANDS;
        for (let i = 0; i < bands.length; i++) {
            if (wl <= bands[i].max) {
                const b = bands[i];
                const amount = (b.fixed != null) ? b.fixed : Math.max(1, Math.floor(base * b.mod));
                return { amount: amount, mod: b.mod, key: b.key };
            }
        }
        return { amount: Math.max(1, base), mod: 1.0, key: 'levelBandFull' };
    },

    drawWater: function(useBucket = false) {
        if (!GameState.well.built) {
            UI.notify(t('game.wellNoWell'), true);
            return;
        }

        if (GameState.well.condition === "broken") {
            UI.notify(t('game.wellBroken'), true);
            return;
        }

        // Zamrzlá studna — nelze čerpat
        if (this.isFrozen()) {
            GameState.well.frozen = true;
            UI.notify(t('game.wellFrozen'), true);
            return;
        }

        // Check tool
        const tool = useBucket ? "bucket" : "cooking_pot";
        if (!GameState.inventory[tool] || GameState.inventory[tool] <= 0) {
            UI.notify(t('game.needItemAmt').replace('{amt}', 1).replace('{item}', ItemsDB[tool].name), true);
            return;
        }

        // Get water amount
        const level = GameState.well.level;
        const stats = this.getWellStats(level);
        let waterAmount = useBucket ? stats.waterPerUseBucket : stats.waterPerUse;

        // Penalizace výnosu dle purity: <70 ×0.5, <30 ×0.4 (kriticky)
        const purity = GameState.well.purity;
        let murky = false;
        if (purity < 30) {
            waterAmount = Math.max(1, Math.floor(waterAmount * 0.4));
            murky = true;
        } else if (purity < 70) {
            waterAmount = Math.floor(waterAmount * 0.5);
            murky = true;
        }

        // Škálování hladinou — stupňovité pásmo (LEVEL_YIELD_BANDS), ne plynulý vzorec.
        const wl = (typeof GameState.well.level_water === 'number') ? GameState.well.level_water : 100;
        waterAmount = this._levelYield(waterAmount, wl).amount;

        // Special: Blessed well může dát holy water
        if (level === "blessed" && Math.random() < 0.2) {
            Game.addItem("holy_water", 1);
            UI.notify(t('game.wellHolyWater'));
        } else {
            const drawnId = murky ? "water" : "spring_water";
            Game.addItem(drawnId, waterAmount);
            const msg = t('game.waterDrawn').replace('{amt}', waterAmount).replace('{item}', iName(drawnId))
                + (murky ? ' ⚠️ ' + t('game.wellMurky') : '');
            UI.notify(msg);
        }

        // Degradace užitím (purity model v2, místo RNG) + úbytek hladiny
        this._degrade(this.USE_DECAY[level] || 0);
        GameState.well.level_water = Math.max(0, (GameState.well.level_water || 0) - this.DRAW_COST);
        Game.checkCalendarium();
        GameState.well.lastUse = Date.now();

        // Valetudo — komáří štípance z kriticky kalné studny, jen v létě (astronomicky)
        if (typeof HealthSystem !== 'undefined' && GameState.well.purity < 30) {
            const _now = new Date();
            const _m = _now.getMonth() + 1, _d = _now.getDate();
            const _isSummer = (_m === 6 && _d >= 21) || _m === 7 || _m === 8 || (_m === 9 && _d < 23);
            if (_isSummer && Math.random() < 0.01) HealthSystem.addCondition('mosquito_bites');
        }

        // Track well uses
        if (GameState.achievements) {
            GameState.achievements.stats.wellUses++;
        }

        Game.save();
        UI.renderAll();
    },

    cleanWell: function() {
        if (GameState.well.condition !== "dirty") {
            UI.notify(t('game.wellNotDirty'), true);
            return;
        }

        if (!GameState.inventory.purification_powder || GameState.inventory.purification_powder < 1) {
            UI.notify(t('game.wellNoPowder'), true);
            return;
        }

        Game.addItem("purification_powder", -1);
        GameState.well.purity = Math.min(100, GameState.well.purity + this.CLEAN_AMT);
        GameState.well.condition = this.purityToCondition(GameState.well.purity);
        GameState.well.lastClean = Date.now();

        // Track well cleans
        if (GameState.achievements) {
            GameState.achievements.stats.wellCleans++;
        }

        UI.notify(t('game.wellCleaned'));
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            NotificationSystem.panel('🪣 ' + t('game.wellCleaned'), 'system');
        }
        Game.save();
        UI.renderAll();
    },

    repairWell: function() {
        if (GameState.well.condition !== "broken") {
            UI.notify(t('game.wellNotBroken'), true);
            return;
        }

        if (!GameState.inventory.repair_kit || GameState.inventory.repair_kit < 1) {
            UI.notify(t('game.wellNoKit'), true);
            return;
        }

        Game.addItem("repair_kit", -1);
        GameState.well.purity = 100;
        GameState.well.condition = "clean";
        GameState.well.lastClean = Date.now();
        UI.notify(t('game.wellRepaired'));
        Game.addKronikaEntry('important', '🪣 Studna opravena.', '🪣 The well has been repaired.', '🪣 Puteus reparatus est.');
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            NotificationSystem.panel('🪣 ' + t('game.wellRepaired'), 'system');
        }
        Game.save();
        UI.renderAll();
    },

    upgradeWell: function(toLevel) {
        const recipeMap = {
            "basic": "well_basic",
            "stone": "well_upgrade_stone",
            "blessed": "well_upgrade_blessed"
        };

        const recipeId = recipeMap[toLevel];
        if (!recipeId) return;

        // Check if we can build/upgrade
        if (toLevel === "basic" && GameState.well.built) {
            UI.notify(t('game.wellAlreadyBuilt'), true);
            return;
        }

        if (toLevel === "stone" && GameState.well.level !== "basic") {
            UI.notify(t('game.wellNeedBasic'), true);
            return;
        }

        if (toLevel === "blessed" && GameState.well.level !== "stone") {
            UI.notify(t('game.wellNeedStone'), true);
            return;
        }

        // Build basic well
        if (toLevel === "basic") {
            const cost = { rock: 20, stick: 10, rope: 3 };

            for (let [item, amt] of Object.entries(cost)) {
                if (!GameState.inventory[item] || GameState.inventory[item] < amt) {
                    UI.notify(t('game.needItemAmt').replace('{amt}', amt).replace('{item}', ItemsDB[item].name), true);
                    return;
                }
            }

            // Consume materials
            for (let [item, amt] of Object.entries(cost)) {
                Game.addItem(item, -amt);
            }

            GameState.well.built = true;
            GameState.well.level = "basic";
            GameState.well.purity = 100;
            GameState.well.condition = "clean";
            GameState.well.lastClean = Date.now();
            UI.notify(t('game.wellBuilt'));
            Game.addKronikaEntry('important', '🪣 Studna postavena.', '🪣 The well has been built.', '🪣 Puteus aedificatus est.');
            Game.save();
            UI.renderAll();
            return;
        }

        // Upgrade to stone
        if (toLevel === "stone") {
            const cost = { rock: 30, rope: 5, charcoal: 10 };

            for (let [item, amt] of Object.entries(cost)) {
                if (!GameState.inventory[item] || GameState.inventory[item] < amt) {
                    UI.notify(t('game.needItemAmt').replace('{amt}', amt).replace('{item}', ItemsDB[item].name), true);
                    return;
                }
            }

            for (let [item, amt] of Object.entries(cost)) {
                Game.addItem(item, -amt);
            }

            GameState.well.level = "stone";
            UI.notify(t('game.wellUpgraded'));
            Game.save();
            UI.renderAll();
            return;
        }

        // Upgrade to blessed (posvěcená)
        if (toLevel === "blessed") {
            const cost = { cut_stone: 30, chalk: 8, candle: 5 };

            for (let [item, amt] of Object.entries(cost)) {
                if (!GameState.inventory[item] || GameState.inventory[item] < amt) {
                    UI.notify(t('game.needItemAmt').replace('{amt}', amt).replace('{item}', ItemsDB[item].name), true);
                    return;
                }
            }

            for (let [item, amt] of Object.entries(cost)) {
                Game.addItem(item, -amt);
            }

            GameState.well.level = "blessed";
            GameState.well.purity = 100;
            GameState.well.condition = "clean";
            GameState.well.lastClean = Date.now();
            GameState.well.frozen = false;
            UI.notify(t('game.wellBlessed'));
            Game.addKronikaEntry('important', '✨ Studna byla posvěcena.', '✨ The well has been blessed.', '✨ Puteus benedictus est.');
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                NotificationSystem.panel('✨ ' + t('game.wellBlessed'), 'system');
            }
            Game.save();
            UI.renderAll();
        }
    },

    // Souhrn pro report (spočítané hodnoty) — ui.js jen zobrazuje
    reportInfo: function() {
        const w = GameState.well;
        const lvl = w.level;
        const stats = this.getWellStats(lvl);

        // Aktuální výnos za nabrání (hrnec) po modifikátorech
        let base = stats.waterPerUse;
        const purity = w.purity;
        if (purity < 30) base = Math.max(1, Math.floor(base * 0.4));
        else if (purity < 70) base = Math.floor(base * 0.5);
        const wl = (typeof w.level_water === 'number') ? w.level_water : 100;
        const levelInfo = this._levelYield(base, wl);
        const yieldNow = levelInfo.amount;

        // Grace — kolik dní ochrany zbývá
        const graceMs = this.GRACE_DAYS * this.DAY_MS;
        const elapsed = Date.now() - (w.lastClean || 0);
        const graceLeft = (elapsed < graceMs) ? Math.ceil((graceMs - elapsed) / this.DAY_MS) : 0;

        // Předpověď počasí (suché/deštivé z 7 dní)
        let dry = null;
        if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countDryDays) {
            const d = WeatherSystem.countDryDays(7);
            if (d.total > 0) dry = { dry: d.dry, rainy: d.total - d.dry };
        }

        return {
            yieldNow: yieldNow,
            yieldBase: stats.waterPerUse,
            levelBandKey: levelInfo.key,
            levelMod: levelInfo.mod,
            graceLeft: graceLeft,
            uses: (GameState.achievements && GameState.achievements.stats.wellUses) || 0,
            cleans: (GameState.achievements && GameState.achievements.stats.wellCleans) || 0,
            forecast: dry
        };
    },

    // Seznam aktivních spotřebitelů vody (pro report). Vrací pole labelů.
    waterConsumers: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const out = [];
        // Záhony (zahrádky/viridárium) — vždy, pokud studna slouží
        out.push(lang === 'en' ? 'Plots' : 'Záhony');
        // Dobytek (ovce ve chlévě)
        if (GameState.sheepfold && GameState.sheepfold.built && GameState.sheepfold.sheep > 0) {
            out.push(lang === 'en' ? 'Livestock' : 'Dobytek');
        }
        // Sad
        if (GameState.orchard && GameState.orchard.built) {
            out.push(lang === 'en' ? 'Orchard' : 'Sad');
        }
        return out;
    },

    // Aplikuj pokles purity (clamp 0–100), přepočítej condition, hlas při zhoršení pásma
    _degrade: function(amount) {
        const w = GameState.well;
        const beforeP = w.purity;
        const beforeCond = w.condition;
        w.purity = Math.max(0, Math.min(100, w.purity - amount));
        w.condition = this.purityToCondition(w.purity);

        const panel = (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel)
            ? (msg, kind) => NotificationSystem.panel(msg, kind) : null;

        // Přechod pod 70 — voda kalní (clean → dirty)
        if (beforeP >= 70 && w.purity < 70) {
            UI.notify(t('game.wellTurningGreen'), true);
            if (panel) panel('🪣 ' + t('game.wellClouding'), 'warning');
        }
        // Přechod pod 40 — kriticky zanesená
        if (beforeP >= 40 && w.purity < 40 && w.purity > 0) {
            if (panel) panel('🪣 ' + t('game.wellClogged'), 'warning');
        }
        // Zřítila se (→ 0)
        if (beforeCond !== "broken" && w.condition === "broken") {
            Game.addKronikaEntry('important', '🪣 Studna se zřítila!', '🪣 The well has collapsed!', '🪣 Puteus corruit!');
            UI.notify(t('game.wellCollapsed'), true);
            if (panel) panel('🪣 ' + t('game.wellCollapsed'), 'error');
        }
        // BUGFIX: dailyTick mění condition/purity potichu na pozadí — bez tohoto
        // zůstává zobrazený stav (např. "Fouled") zaseklý v DOM, dokud hráč
        // nevyvolá jiný render trigger. Pokud je právě na home tabu, překresli
        // rovnou; jinak označ dirty, ať se dotáhne při přepnutí.
        if (beforeCond !== w.condition || beforeP !== w.purity) {
            if (typeof UI !== 'undefined') {
                if (UI.currentScreen === 'home' && UI.renderWell) {
                    UI.renderWell();
                } else if (UI._dirty) {
                    UI._dirty.home = true;
                }
            }
        }
    },

    // Mráz — zima (měsíc 12–2) + aktuální teplota < 0. Blessed ignoruje.
    isFrozen: function() {
        const w = GameState.well;
        if (!w || w.level === "blessed") return false;
        const m = new Date().getMonth() + 1; // 1–12
        if (!(m === 12 || m === 1 || m === 2)) return false;
        try {
            const c = (typeof WeatherSystem !== 'undefined') ? WeatherSystem.cache : null;
            if (c && c.current && typeof c.current.temperature_2m === 'number') {
                return c.current.temperature_2m < 0;
            }
        } catch (e) {}
        return false;
    },

    // Denní tick — počasní degradace (hladina + purity). Fallback paušál když počasí nedostupné.
    // Self-guard 24h + grace 5 dní po čištění.
    dailyTick: function() {
        this._ensureState();
        const w = GameState.well;
        if (!w.built || w.condition === "broken") return;

        const now = Date.now();
        if (now - (w.lastTick || 0) < this.DAY_MS) return;
        w.lastTick = now;

        // Aktualizovat zamrznutí (nezávisí na grace)
        w.frozen = this.isFrozen();

        // Grace period po vyčištění/postavení — chrání jen purity (kvalitu),
        // NE hladinu (level_water). Hladina se doplňuje/ubývá počasím vždy,
        // jinak by čerpání v grace vysušilo studnu bez šance na refill.
        const inGrace = now - (w.lastClean || 0) < this.GRACE_DAYS * this.DAY_MS;

        const lvl = w.level;
        // Počasí dostupné?
        let dry = { dry: 0, total: 0 };
        if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countDryDays) {
            dry = WeatherSystem.countDryDays(7);
        }

        if (dry.total > 0) {
            // Hybrid: déšť plní hladinu + kalí nekrytou, sucho ubírá hladinu + stojatá voda
            const rainy = dry.total - dry.dry;
            w.level_water = Math.max(0, Math.min(100,
                w.level_water + rainy * this.RAIN_FILL - dry.dry * (this.DRY_DRAIN[lvl] || 0)));
            if (!inGrace) {
                const purityDrop = dry.dry * (this.DRY_MURK[lvl] || 0) + rainy * (this.RAIN_MURK[lvl] || 0);
                this._degrade(purityDrop);
            }
        } else {
            // Fallback: počasí nedostupné → malý pasivní refill hladiny (25 % RAIN_FILL/den),
            // ať hladina bez weather dat nezůstane trvale zaseklá na 0. Purity degraduje
            // paušálně, jen mimo grace.
            w.level_water = Math.min(100, w.level_water + this.RAIN_FILL * 0.25);
            if (!inGrace) {
                this._degrade(this.TIME_DECAY[lvl] || 0);
            }
        }

        Game.save();
    },

    getWellStats: function(level) {
        const defaultStats = {
            waterPerUse: 3,
            waterPerUseBucket: 5,
            degradeChance: 0.08,
            breakChance: 0.03
        };

        const stats = {
            "basic": {
                waterPerUse: 3,
                waterPerUseBucket: 5,
                degradeChance: 0.15,
                breakChance: 0.05
            },
            "stone": {
                waterPerUse: 4,
                waterPerUseBucket: 8,
                degradeChance: 0.05,
                breakChance: 0.02
            },
            "blessed": {
                waterPerUse: 5,
                waterPerUseBucket: 10,
                degradeChance: 0.01,
                breakChance: 0.0,
                holyWaterChance: 0.2
            }
        };

        return stats[level] || defaultStats;
    }
};
