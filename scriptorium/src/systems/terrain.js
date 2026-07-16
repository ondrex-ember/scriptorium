// ═══════════════════════════════════════════════════════════════════════════════
// TERRAIN SYSTEM — Únava krajiny
// Krajina má své limity. Intenzivní sběr ji vyčerpá, odpočinek ji obnoví.
// Timed výpravy jsou šetrnější než opakované instant kliky.
// ═══════════════════════════════════════════════════════════════════════════════

const TerrainSystem = {

    // ── Akce ovlivněné únavou krajiny (whitelist) ──────────────────────────────
    // Vše mimo tento seznam = bez terrain efektu (workshop/dvůr/studna akce)
    TERRAIN_ACTIONS: [
        'hunt', 'bark', 'fishing', 'wetlands', 'resin_harvest',
        'worms_dig', 'dig_clay', 'foraging', 'grass_gather', 'wood_harvest',
    ],

    isTerrainAction: function(type) {
        return this.TERRAIN_ACTIONS.includes(type);
    },

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

    // Regen: −10 fatigue každých 10 minut reálného času (zrychleno 2×)
    REGEN_AMOUNT:   10,
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
        const elapsed = now - last;
        if (elapsed < this.REGEN_INTERVAL) return; // self-guard 10 min
        const steps = Math.floor(elapsed / this.REGEN_INTERVAL);
        GameState.terrain.fatigue = Math.max(0, (GameState.terrain.fatigue || 0) - (steps * this.REGEN_AMOUNT));
        GameState.terrain.lastRegen = last + (steps * this.REGEN_INTERVAL); // zbytek < interval se nezahodí
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

// ═══════════════════════════════════════════════════════════════════════════════
// CURIA SYSTEM — Únava hospodářství (blízké okolí kláštera)
// Stejná filozofie jako TerrainSystem, ale oddělený stav — uklízení dvora
// neubírá zvěř v lese, a naopak. Vlastní pool, vlastní ukazatel.
// ═══════════════════════════════════════════════════════════════════════════════

const CuriaSystem = {

    CURIA_ACTIONS: ['basic', 'nature', 'yard_cleanup'],

    isCuriaAction: function(type) {
        return this.CURIA_ACTIONS.includes(type);
    },

    FATIGUE_RESTED: 20,
    FATIGUE_TIRED:  50,

    FATIGUE_INSTANT: 2,
    FATIGUE_TIMED: { 1: 1, 5: 3, 10: 5, 20: 8, 30: 12 },

    REGEN_AMOUNT:   10,
    REGEN_INTERVAL: 10 * 60 * 1000,

    init: function() {
        if (!GameState.curia) {
            GameState.curia = { fatigue: 0, lastRegen: 0 };
        }
        if (typeof GameState.curia.fatigue !== 'number') GameState.curia.fatigue = 0;
        if (typeof GameState.curia.lastRegen !== 'number') GameState.curia.lastRegen = Date.now();
    },

    getMult: function() {
        const f = (GameState.curia && GameState.curia.fatigue) || 0;
        if (f <= this.FATIGUE_RESTED) return 1.0;
        if (f <= this.FATIGUE_TIRED)  return 0.5;
        return 0.25;
    },

    onScavenge: function(durationMin) {
        if (!GameState.curia) this.init();
        const add = durationMin === 0
            ? this.FATIGUE_INSTANT
            : (this.FATIGUE_TIMED[durationMin] || this.FATIGUE_INSTANT);
        GameState.curia.fatigue = Math.min(100, (GameState.curia.fatigue || 0) + add);
    },

    tick: function() {
        if (!GameState.curia) this.init();
        const now = Date.now();
        const last = GameState.curia.lastRegen || 0;
        const elapsed = now - last;
        if (elapsed < this.REGEN_INTERVAL) return;
        const steps = Math.floor(elapsed / this.REGEN_INTERVAL);
        GameState.curia.fatigue = Math.max(0, (GameState.curia.fatigue || 0) - (steps * this.REGEN_AMOUNT));
        GameState.curia.lastRegen = last + (steps * this.REGEN_INTERVAL);
    },

    renderIndicator: function() {
        if (!GameState.curia) this.init();
        const f = GameState.curia.fatigue || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        let icon, labelCS, labelEN, color;
        if (f <= this.FATIGUE_RESTED) {
            icon = '🏡'; color = '#4caf50';
            labelCS = 'Okolí kláštera prohledané'; // odpočaté = ještě je co hledat
            labelEN = 'Monastery grounds fresh';
        } else if (f <= this.FATIGUE_TIRED) {
            icon = '🧹'; color = '#ff9800';
            labelCS = 'Blízké okolí prohledané — výnos 50%';
            labelEN = 'Nearby grounds picked over — yield 50%';
        } else {
            icon = '🕸️'; color = '#f44336';
            labelCS = 'Blízké okolí vytěžené — výnos 25%';
            labelEN = 'Nearby grounds exhausted — yield 25%';
        }

        const label = lang === 'en' ? labelEN : labelCS;
        const barPct = Math.round((f / 100) * 100);

        let regenInfo = '';
        if (f > this.FATIGUE_RESTED) {
            const fatigueToRegen = f - this.FATIGUE_RESTED;
            const minsNeeded = Math.ceil(fatigueToRegen / this.REGEN_AMOUNT) * 10;
            const hNeeded = Math.floor(minsNeeded / 60);
            const mLeft = minsNeeded % 60;
            const timeStr = hNeeded > 0
                ? (lang === 'en' ? `~${hNeeded}h ${mLeft}m` : `~${hNeeded}h ${mLeft}min`)
                : (lang === 'en' ? `~${mLeft}m` : `~${mLeft}min`);
            regenInfo = lang === 'en' ? ` · recovers in ${timeStr}` : ` · zotaví se za ${timeStr}`;
        }

        return `<div id="curia-indicator" style="
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

// ═══════════════════════════════════════════════════════════════════════════════
// MINE SYSTEM — Únava dolu (žíly)
// Stejná filozofie jako Terrain/Curia, vlastní oddělený pool. Vztahuje se jen
// na collectMode akce quarry_stone/mine_iron_ore (Pracovna → Doly).
// ═══════════════════════════════════════════════════════════════════════════════

const MineSystem = {

    MINE_ACTIONS: ['quarry_stone', 'mine_iron_ore'],

    isMineAction: function(type) {
        return this.MINE_ACTIONS.includes(type);
    },

    FATIGUE_RESTED: 20,
    FATIGUE_TIRED:  50,

    FATIGUE_INSTANT: 2,
    // Delší (nominální) těžba je šetrnější k žíle než časté krátké výpravy —
    // stejná filozofie jako Terrain/Curia FATIGUE_TIMED.
    FATIGUE_TIMED: { 2.5: 2, 5: 3, 10: 5, 20: 8, 30: 12 },

    REGEN_AMOUNT:   10,
    REGEN_INTERVAL: 10 * 60 * 1000,

    init: function() {
        if (!GameState.mine) {
            GameState.mine = { fatigue: 0, lastRegen: 0 };
        }
        if (typeof GameState.mine.fatigue !== 'number') GameState.mine.fatigue = 0;
        if (typeof GameState.mine.lastRegen !== 'number') GameState.mine.lastRegen = Date.now();
    },

    getMult: function() {
        const f = (GameState.mine && GameState.mine.fatigue) || 0;
        if (f <= this.FATIGUE_RESTED) return 1.0;
        if (f <= this.FATIGUE_TIRED)  return 0.5;
        return 0.25;
    },

    // durationMin: nominální tier (2.5/5/10/20/30) — NE reálný, koňmi zkrácený čas
    onScavenge: function(durationMin) {
        if (!GameState.mine) this.init();
        const add = this.FATIGUE_TIMED[durationMin] || this.FATIGUE_INSTANT;
        GameState.mine.fatigue = Math.min(100, (GameState.mine.fatigue || 0) + add);
    },

    tick: function() {
        if (!GameState.mine) this.init();
        const now = Date.now();
        const last = GameState.mine.lastRegen || 0;
        const elapsed = now - last;
        if (elapsed < this.REGEN_INTERVAL) return;
        const steps = Math.floor(elapsed / this.REGEN_INTERVAL);
        GameState.mine.fatigue = Math.max(0, (GameState.mine.fatigue || 0) - (steps * this.REGEN_AMOUNT));
        GameState.mine.lastRegen = last + (steps * this.REGEN_INTERVAL);
    },

    renderIndicator: function() {
        if (!GameState.mine) this.init();
        const f = GameState.mine.fatigue || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        let icon, labelCS, labelEN, color;
        if (f <= this.FATIGUE_RESTED) {
            icon = '⛏️'; color = '#4caf50';
            labelCS = 'Žíla čerstvá';
            labelEN = 'Vein fresh';
        } else if (f <= this.FATIGUE_TIRED) {
            icon = '🪨'; color = '#ff9800';
            labelCS = 'Žíla unavená — výnos 50%';
            labelEN = 'Vein tired — yield 50%';
        } else {
            icon = '🕳️'; color = '#f44336';
            labelCS = 'Žíla vyčerpaná — výnos 25%';
            labelEN = 'Vein exhausted — yield 25%';
        }

        const label = lang === 'en' ? labelEN : labelCS;
        const barPct = Math.round((f / 100) * 100);

        let regenInfo = '';
        if (f > this.FATIGUE_RESTED) {
            const fatigueToRegen = f - this.FATIGUE_RESTED;
            const minsNeeded = Math.ceil(fatigueToRegen / this.REGEN_AMOUNT) * 10;
            const hNeeded = Math.floor(minsNeeded / 60);
            const mLeft = minsNeeded % 60;
            const timeStr = hNeeded > 0
                ? (lang === 'en' ? `~${hNeeded}h ${mLeft}m` : `~${hNeeded}h ${mLeft}min`)
                : (lang === 'en' ? `~${mLeft}m` : `~${mLeft}min`);
            regenInfo = lang === 'en' ? ` · recovers in ${timeStr}` : ` · zotaví se za ${timeStr}`;
        }

        return `<div id="mine-indicator" style="
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
