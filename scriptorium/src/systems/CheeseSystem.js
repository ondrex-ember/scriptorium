// ═══════════════════════════════════════════════════════════════════════════
// CHEESE SYSTEM v1 — Caseus
// Per-instance zrání sýra. Gate: tech_caseus.
// Model: instance v GameState.cheeseInstances, přechod fáze přesune
//        1 kus mezi inventářovými sloty (_fresh → _mature → _aged).
// Mature: 4-5 dní, Aged: dalších 8-10 dní (celkem 12-15 dní od výroby).
// ═══════════════════════════════════════════════════════════════════════════

const CheeseSystem = {

    DAY_MS: 24 * 60 * 60 * 1000,

    // ── Definice typů — base itemId (bez _fresh/_mature/_aged přípony) ────
    CHEESE_TYPES: {
        goat_cheese:  { matureDays: 4, agedDays: 12 },
        sheep_cheese: { matureDays: 5, agedDays: 14 },
        cow_cheese:   { matureDays: 5, agedDays: 15 },
        syrecky:      { matureDays: 2, agedDays: null },  // bez aged fáze
    },

    isActive: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_caseus'));
    },

    _ensureState: function() {
        if (!GameState.cheeseInstances) GameState.cheeseInstances = [];
        return GameState.cheeseInstances;
    },

    // Voláno z recipe craft hooku při výrobě nového sýra
    registerInstance: function(baseType) {
        const list = this._ensureState();
        list.push({ baseType: baseType, createdAt: Date.now(), phase: 'fresh' });
    },

    // ── Denní tick (self-guarded, volán z game.js tick batch) ──────────────
    dailyTick: function() {
        if (!this.isActive()) return;
        if (!GameState.cheeseTick) GameState.cheeseTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.cheeseTick.lastTick || 0) < this.DAY_MS) return;
        GameState.cheeseTick.lastTick = now;

        const list = this._ensureState();
        let advanced = 0;
        list.forEach(inst => {
            const def = this.CHEESE_TYPES[inst.baseType];
            if (!def) return;
            const ageMs = now - inst.createdAt;
            if (inst.phase === 'fresh' && ageMs >= def.matureDays * this.DAY_MS) {
                this._advance(inst, 'mature');
                advanced++;
            } else if (inst.phase === 'mature' && def.agedDays && ageMs >= def.agedDays * this.DAY_MS) {
                this._advance(inst, 'aged');
                advanced++;
            }
        });

        if (advanced > 0) {
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                NotificationSystem.panel('🧀 ' + (lang === 'en'
                    ? advanced + '× cheese matured further.'
                    : advanced + '× sýr dozrál do další fáze.'), 'info');
            }
            if (typeof Game !== 'undefined') Game.save();
        }
    },

    // Přesune 1 kus mezi inventářovými sloty a aktualizuje instanci
    _advance: function(inst, newPhase) {
        const oldId = inst.baseType + '_' + inst.phase;
        const newId = inst.baseType + '_' + newPhase;
        if ((GameState.inventory[oldId] || 0) > 0) {
            GameState.inventory[oldId] -= 1;
            GameState.inventory[newId] = (GameState.inventory[newId] || 0) + 1;
        }
        inst.phase = newPhase;
    },
};
