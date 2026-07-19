// ═══════════════════════════════════════════════════════════════════════════
// LIME SYSTEM v1 — Calcaria
// Per-instance zrání vápna. Gate: tech_calcaria.
// Model: instance v GameState.limeInstances, přechod fáze přesune
//        1 kus mezi inventářovými sloty (_fresh → _mature).
// Mirror CheeseSystem.js — dva samostatné jednofázové řetězy (vzor syrecky,
// bez aged fáze), zřetězené přes hráčovu craft akci (hašení) uprostřed.
//   vapno_paleny: pálení v peci (4 dny)
//   vapno_hasene: hašení + zrání v jámě (18 dní)
// ═══════════════════════════════════════════════════════════════════════════

const LimeSystem = {

    DAY_MS: 24 * 60 * 60 * 1000,

    // ── Definice typů — base itemId (bez _fresh/_mature přípony) ───────────
    LIME_TYPES: {
        vapno_paleny: { matureDays: 4,  agedDays: null },  // pálení v peci
        vapno_hasene: { matureDays: 18, agedDays: null },  // hašení + zrání v jámě
    },

    isActive: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_calcaria'));
    },

    _ensureState: function() {
        if (!GameState.limeInstances) GameState.limeInstances = [];
        return GameState.limeInstances;
    },

    // Voláno z recipe craft hooku při výrobě (burn_lime / slake_lime)
    registerInstance: function(baseType) {
        const list = this._ensureState();
        list.push({ baseType: baseType, createdAt: Date.now(), phase: 'fresh' });
    },

    // ── Denní tick (self-guarded, volán z game.js tick batch) ──────────────
    dailyTick: function() {
        if (!this.isActive()) return;
        if (!GameState.limeTick) GameState.limeTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.limeTick.lastTick || 0) < this.DAY_MS) return;
        GameState.limeTick.lastTick = now;

        const list = this._ensureState();
        let advanced = 0;
        list.forEach(inst => {
            const def = this.LIME_TYPES[inst.baseType];
            if (!def) return;
            const ageMs = now - inst.createdAt;
            if (inst.phase === 'fresh' && ageMs >= def.matureDays * this.DAY_MS) {
                this._advance(inst, 'mature');
                advanced++;
            }
        });

        if (advanced > 0) {
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                NotificationSystem.panel('⬜ ' + (lang === 'en'
                    ? advanced + '× lime advanced further.'
                    : advanced + '× vápno pokročilo do další fáze.'), 'info');
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
