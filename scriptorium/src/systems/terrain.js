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
        // Reset toast tier při zotavení na odpočatou úroveň
        if (GameState.terrain.fatigue <= this.FATIGUE_RESTED && GameState.terrain.lastToastTier > 0) {
            GameState.terrain.lastToastTier = 0;
        }
    },

    // ── UI indikátor pro scavenge sekci ───────────────────────────────────────
    // Vždy zobrazen — hráč vždy vidí stav krajiny
    renderIndicator: function() {
        if (!GameState.terrain) this.init();
        const f = GameState.terrain.fatigue || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

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
        const barPct = Math.round((f / 100) * 100);

        // Regen info — kolik minut do zotavení na FATIGUE_RESTED
        let regenInfo = '';
        if (f > this.FATIGUE_RESTED) {
            const fatigueToRegen = f - this.FATIGUE_RESTED;
            const minsNeeded = Math.ceil(fatigueToRegen / this.REGEN_AMOUNT) * 10;
            const hNeeded = Math.floor(minsNeeded / 60);
            const mLeft = minsNeeded % 60;
            const timeStr = hNeeded > 0
                ? (lang === 'en' ? `~${hNeeded}h ${mLeft}m` : `~${hNeeded}h ${mLeft}min`)
                : (lang === 'en' ? `~${mLeft}m` : `~${mLeft}min`);
            regenInfo = lang === 'en'
                ? ` · recovers in ${timeStr}`
                : ` · zotaví se za ${timeStr}`;
        }

        return `<div id="terrain-indicator" style="
            padding:8px 10px; margin-bottom:10px;
            background:rgba(0,0,0,0.12); border-radius:6px;
            border-left:3px solid ${color}; font-size:0.82rem;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
                <span>${icon}</span>
                <span style="color:${color}; flex:1;">${label}${regenInfo}</span>
                <span style="opacity:0.5; font-size:0.75rem;">${f}/100</span>
            </div>
            <div style="background:rgba(0,0,0,0.2); border-radius:3px; height:4px; overflow:hidden;">
                <div style="width:${barPct}%; height:100%; background:${color}; border-radius:3px; transition:width 0.3s;"></div>
            </div>
        </div>`;
    },

};