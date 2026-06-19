// ═══════════════════════════════════════════════════════════════════════════════
// TERRAIN SYSTEM — Únava krajiny
// Krajina má své limity. Intenzivní sběr ji vyčerpá, odpočinek ji obnoví.
// Timed výpravy jsou šetrnější než opakované instant kliky.
// ═══════════════════════════════════════════════════════════════════════════════

const TerrainSystem = {

    // ── Thresholds ────────────────────────────────────────────────────────────
    FATIGUE_RESTED:  20,   // 0–20  → plný výnos (1.0×)
    FATIGUE_TIRED:   50,   // 21–50 → poloviční výnos (0.5×)
                           // 51+   → čtvrtinový výnos (0.25×)

    // Fatigue dopad per akce
    FATIGUE_INSTANT: 2,    // každý instant klik
    FATIGUE_TIMED: {       // timed výpravy — šetrnější na krajinu
        1:  1,
        5:  3,
        10: 5,
        20: 8,
        30: 12,
    },

    // Regen: −5 fatigue každých 10 minut reálného času
    REGEN_AMOUNT:   5,
    REGEN_INTERVAL: 10 * 60 * 1000,

    // ── Init ──────────────────────────────────────────────────────────────────
    init: function() {
        if (!GameState.terrain) {
            GameState.terrain = { fatigue: 0, lastRegen: 0 };
        }
        if (typeof GameState.terrain.fatigue !== 'number') GameState.terrain.fatigue = 0;
        if (typeof GameState.terrain.lastRegen !== 'number') GameState.terrain.lastRegen = Date.now();
    },

    // ── Výpočet multiplikátoru výnosu ─────────────────────────────────────────
    getMult: function() {
        const f = (GameState.terrain && GameState.terrain.fatigue) || 0;
        if (f <= this.FATIGUE_RESTED) return 1.0;
        if (f <= this.FATIGUE_TIRED)  return 0.5;
        return 0.25;
    },

    // ── Dopad scavenge na únavu krajiny ───────────────────────────────────────
    // durationMin: 0 = instant, 1/5/10/20/30 = timed
    onScavenge: function(durationMin) {
        if (!GameState.terrain) this.init();
        const add = durationMin === 0
            ? this.FATIGUE_INSTANT
            : (this.FATIGUE_TIMED[durationMin] || this.FATIGUE_INSTANT);
        GameState.terrain.fatigue = Math.min(100, (GameState.terrain.fatigue || 0) + add);
    },

    // ── Tick — regen (voláno z minutového game loop) ──────────────────────────
    tick: function() {
        if (!GameState.terrain) this.init();
        const now = Date.now();
        const last = GameState.terrain.lastRegen || 0;
        if (now - last < this.REGEN_INTERVAL) return; // self-guard 10 min
        GameState.terrain.fatigue = Math.max(0, (GameState.terrain.fatigue || 0) - this.REGEN_AMOUNT);
        GameState.terrain.lastRegen = now;
    },

    // ── UI indikátor pro scavenge sekci ───────────────────────────────────────
    // Vrací HTML string — prázdný pokud fatigue = 0
    renderIndicator: function() {
        if (!GameState.terrain) return '';
        const f = GameState.terrain.fatigue || 0;
        if (f === 0) return '';

        const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.lang) || 'cs';
        const mult = this.getMult();

        let icon, labelCS, labelEN, color;
        if (f <= this.FATIGUE_RESTED) {
            icon = '🌿'; color = '#4caf50';
            labelCS = 'Krajina odpočatá';
            labelEN = 'Terrain rested';
        } else if (f <= this.FATIGUE_TIRED) {
            icon = '🍂'; color = '#ff9800';
            labelCS = 'Krajina unavená — výnos 50%';
            labelEN = 'Terrain tired — yield 50%';
        } else {
            icon = '🪨'; color = '#f44336';
            labelCS = 'Krajina vyčerpaná — výnos 25%';
            labelEN = 'Terrain exhausted — yield 25%';
        }

        const label = lang === 'en' ? labelEN : labelCS;
        const pct = Math.round((f / 100) * 100);

        return `<div id="terrain-indicator" style="
            display:flex; align-items:center; gap:8px;
            padding:6px 10px; margin-bottom:8px;
            background:rgba(0,0,0,0.15); border-radius:6px;
            border-left:3px solid ${color}; font-size:0.82rem;">
            <span>${icon}</span>
            <span style="color:${color}; flex:1;">${label}</span>
            <span style="opacity:0.6; font-size:0.75rem;">${pct}/100</span>
        </div>`;
    },

};
