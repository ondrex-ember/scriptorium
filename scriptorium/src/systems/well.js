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
    TIME_DECAY:   { basic: 3, stone: 1.5, blessed: 0.5 },// purity −/den (stojatá voda)
    CLEAN_AMT:    40,                                    // purity + za vyčištění
    GRACE_DAYS:   5,                                     // dní bez degradace po čištění/stavbě
    PURITY_BANDS: { clean: 70 },                         // ≥70 clean, <70 dirty, 0 broken

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

    drawWater: function(useBucket = false) {
        if (!GameState.well.built) {
            UI.notify(t('game.wellNoWell'), true);
            return;
        }

        if (GameState.well.condition === "broken") {
            UI.notify(t('game.wellBroken'), true);
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

        // Dirty penalty
        if (GameState.well.condition === "dirty") {
            waterAmount = Math.floor(waterAmount * 0.5);
            UI.notify(t('game.wellMurky'));
        }

        // Special: Blessed well může dát holy water
        if (level === "blessed" && Math.random() < 0.2) {
            Game.addItem("holy_water", 1);
            UI.notify(t('game.wellHolyWater'));
        } else {
            Game.addItem("water", waterAmount);
            UI.notify(t('game.waterDrawn').replace('{amt}', waterAmount));
        }

        // Degradace užitím (purity model v2, místo RNG)
        this._degrade(this.USE_DECAY[level] || 0);
        Game.checkCalendarium();
        GameState.well.lastUse = Date.now();

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
        Game.save();
        UI.renderAll();
    },

    upgradeWell: function(toLevel) {
        const recipeMap = {
            "basic": "well_basic",
            "stone": "well_upgrade_stone"
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
        }
    },

    // Aplikuj pokles purity (clamp 0–100), přepočítej condition, hlas při zhoršení pásma
    _degrade: function(amount) {
        const w = GameState.well;
        const before = w.condition;
        w.purity = Math.max(0, Math.min(100, w.purity - amount));
        w.condition = this.purityToCondition(w.purity);

        // Hláška při přechodu do horšího pásma
        if (before === "clean" && w.condition === "dirty") {
            UI.notify(t('game.wellTurningGreen'), true);
        }
        if (before !== "broken" && w.condition === "broken") {
            Game.addKronikaEntry('important', '🪣 Studna se zřítila!', '🪣 The well has collapsed!', '🪣 Puteus corruit!');
            UI.notify(t('game.wellCollapsed'), true);
        }
    },

    // Denní tick — časová degradace (stojatá voda). Self-guard 24h + grace 5 dní po čištění.
    dailyTick: function() {
        this._ensureState();
        const w = GameState.well;
        if (!w.built || w.condition === "broken") return;

        const now = Date.now();
        if (now - (w.lastTick || 0) < this.DAY_MS) return;
        w.lastTick = now;

        // Grace period po vyčištění/postavení
        if (now - (w.lastClean || 0) < this.GRACE_DAYS * this.DAY_MS) return;

        this._degrade(this.TIME_DECAY[w.level] || 0);
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