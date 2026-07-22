// ═══════════════════════════════════════════════════════════════════════════
// DRYING SYSTEM v1 — Susarna
// Generické sušení, žádná budova. Gate: tech_susarna.
// Model: instance v GameState.dryingInstances, self-guarded denní tick
//        (vzor CheeseSystem.dailyTick), notifikace při dokončení.
// Rozšíření na budoucí suroviny = jen další řádek v DRY_TYPES.
// ═══════════════════════════════════════════════════════════════════════════

const DryingSystem = {

    DAY_MS: 24 * 60 * 60 * 1000,

    DRY_TYPES: {
        cannabis: { input: 'cannabis', inputQty: 2, output: 'dried_cannabis', dryDays: 1 },
    },

    isActive: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_susarna'));
    },

    _ensureState: function() {
        if (!GameState.dryingInstances) GameState.dryingInstances = [];
        return GameState.dryingInstances;
    },

    startDrying: function(typeKey) {
        if (!this.isActive()) return;
        const def = this.DRY_TYPES[typeKey];
        if (!def) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((GameState.inventory[def.input] || 0) < def.inputQty) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Not enough raw material.' : 'Nedostatek suroviny.', true);
            return;
        }
        Game.removeItem(def.input, def.inputQty);
        this._ensureState().push({ type: typeKey, startedAt: Date.now() });
        Game.save();
        if (typeof FireplaceSystem !== 'undefined') FireplaceSystem.render();
    },

    // ── Denní tick (self-guarded, volán z game.js tick batch) ──────────────
    dailyTick: function() {
        if (!this.isActive()) return;
        if (!GameState.dryingTick) GameState.dryingTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.dryingTick.lastTick || 0) < this.DAY_MS) return;
        GameState.dryingTick.lastTick = now;

        const list = this._ensureState();
        let done = 0;
        for (let i = list.length - 1; i >= 0; i--) {
            const inst = list[i];
            const def = this.DRY_TYPES[inst.type];
            if (!def) { list.splice(i, 1); continue; }
            const ageMs = now - inst.startedAt;
            if (ageMs >= def.dryDays * this.DAY_MS) {
                Game.addItem(def.output, 1);
                list.splice(i, 1);
                done++;
            }
        }

        if (done > 0) {
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                NotificationSystem.panel('🌿 ' + (lang === 'en'
                    ? done + '× dried and ready.'
                    : done + '× usušeno a připraveno.'), 'info');
            }
            if (typeof Game !== 'undefined') Game.save();
        }
    },

    // ── Foculus UI — progress bar (vzor Inventarium kapacitního baru) ──────
    renderFoculus: function() {
        if (!this.isActive()) return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const list = this._ensureState();
        const card = `background:rgba(0,0,0,0.05);padding:14px;border-radius:10px;border-left:3px solid var(--accent-gold);margin-bottom:12px;`;
        let h = `<div style="${card}"><h4 style="margin:0 0 10px 0;color:var(--ink-primary);">🌿 ${lang === 'en' ? 'Drying Rack' : 'Sušárna'}</h4>`;

        const active = list.find(inst => inst.type === 'cannabis');
        if (active) {
            const def = this.DRY_TYPES.cannabis;
            const totalMs = def.dryDays * this.DAY_MS;
            const slowMult = (typeof FireplaceSystem !== 'undefined' && FireplaceSystem._dymkaSlowMult) ? FireplaceSystem._dymkaSlowMult() : 1;
            const elapsed = (Date.now() - active.startedAt) * slowMult;
            const pct = Math.min(100, Math.round(elapsed / totalMs * 100));
            h += `<div style="background:rgba(0,0,0,0.1); border-radius:4px; height:8px;">
                <div style="width:${pct}%; background:var(--accent-gold); height:8px; border-radius:4px; transition:width 0.3s;"></div>
              </div>`;
            h += `<div style="font-size:0.72rem; opacity:0.65; margin-top:4px; text-align:center;">${lang === 'en' ? 'Drying in progress...' : 'Sušení probíhá...'}</div>`;
        } else {
            const have = GameState.inventory['cannabis'] || 0;
            const can = have >= this.DRY_TYPES.cannabis.inputQty;
            h += `<button onclick="DryingSystem.startDrying('cannabis')" ${can ? '' : 'disabled'} style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--accent-gold);background:${can ? 'rgba(197,160,89,0.15)' : 'rgba(197,160,89,0.07)'};color:var(--accent-gold);cursor:${can ? 'pointer' : 'default'};font-size:0.85rem;opacity:${can ? '1' : '0.5'};">🌿 ${lang === 'en' ? 'Dry hemp (24h)' : 'Sušit konopí (24h)'}</button>`;
            if (!can) h += `<div style="font-size:0.72rem;opacity:0.55;margin-top:6px;text-align:center;">${lang === 'en' ? 'Need 2× hemp' : 'Potřeba 2× konopí'}</div>`;
        }
        h += `</div>`;
        return h;
    },
};
