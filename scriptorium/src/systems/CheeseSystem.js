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

    // coquina-cheese-mirror-mrd (7.8.2026): zrcadlení zrání do Vaření —
    // jen zobrazení průběhu, výroba čerstvého sýra i denní tick zůstávají
    // beze změny (CheeseSystem samostatný systém, ne migrovaný do CookingSystem).
    render: function() {
        if (!this.isActive()) return '';
        const list = this._ensureState();
        if (list.length === 0) return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.ui) GameState.ui = {};
        const cheeseOpen = GameState.ui.cheeseAgingOpen !== false;
        let h = `<details ${cheeseOpen ? 'open' : ''} ontoggle="GameState.ui.cheeseAgingOpen = this.open; Game.save();" style="margin-top:14px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
        h += `<summary style="cursor:pointer; padding:10px 14px; font-size:0.92rem; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px; color:var(--ink-primary);">
                <span>🧀 ${lang === 'en' ? 'Cheese Aging' : 'Zrání sýrů'}</span><span style="opacity:0.5; font-weight:normal;">▾</span>
              </summary>`;
        h += `<div style="padding:4px 14px 14px;">`;
        list.forEach(inst => {
            const def = this.CHEESE_TYPES[inst.baseType];
            if (!def) return;
            const ageMs = Date.now() - inst.createdAt;
            const ageDays = ageMs / this.DAY_MS;
            const name = (typeof iName === 'function') ? iName(inst.baseType + '_' + inst.phase) : inst.baseType;
            let targetDays, label;
            if (inst.phase === 'fresh') { targetDays = def.matureDays; label = lang === 'en' ? 'to Mature' : 'do zralého'; }
            else if (inst.phase === 'mature' && def.agedDays) { targetDays = def.agedDays; label = lang === 'en' ? 'to Aged' : 'do vyzrálého'; }
            else { h += `<div style="background:rgba(0,0,0,0.05); padding:10px 12px; border-radius:8px; margin-bottom:6px; font-size:0.8rem;">✅ ${name} — ${lang === 'en' ? 'fully aged' : 'plně vyzrálé'}</div>`; return; }
            const pct = Math.min(100, Math.round(ageDays / targetDays * 100));
            const remainDays = Math.max(0, Math.ceil(targetDays - ageDays));
            h += `<div style="background:rgba(0,0,0,0.05); padding:12px; border-radius:8px; border-left:3px solid var(--accent-gold); margin-bottom:8px;">
                    <div style="font-size:0.85rem; font-weight:bold; margin-bottom:6px;">${name}</div>
                    <div style="background:rgba(0,0,0,0.1); border-radius:4px; height:8px;">
                      <div style="width:${pct}%; background:var(--accent-gold); height:8px; border-radius:4px; transition:width 0.3s;"></div>
                    </div>
                    <div style="font-size:0.72rem; opacity:0.65; margin-top:4px;">${remainDays} ${lang === 'en' ? 'days' : 'dní'} ${label}</div>
                  </div>`;
        });
        h += `</div></details>`;
        return h;
    },
};