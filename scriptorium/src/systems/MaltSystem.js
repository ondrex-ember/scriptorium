// ═══════════════════════════════════════════════════════════════════════════
// MaltSystem — barley→malt, uvnitř Pivovar tabu. Mirror LimeSystem.js, ale
// JEDNOSTUPŇOVÝ (ne pec+jáma) — sladování je historicky jeden souvislý
// proces (namočení→klíčení→sušení), ne dvě oddělené akce jako pálení/
// hašení vápna. sladovna-mrd.md v0.2 (7.9.2026), schváleno Bouvard.
//
// Gate: isActive() na tech_maltatio. Render se volá z
// CellariumSystem.renderPivovarTab(), NE jako vlastní tab/sub-tab.
// ═══════════════════════════════════════════════════════════════════════════

const MaltSystem = {
    DAY_MS: 24 * 60 * 60 * 1000,
    MATURE_DAYS: 2, // mirror vapno_paleny kompresní precedent (16.8.2026)

    isActive: function () {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_maltatio'));
    },

    _ensureState: function () {
        if (!GameState.maltInstances) GameState.maltInstances = [];
        return GameState.maltInstances;
    },

    registerInstance: function () {
        this._ensureState().push({ createdAt: Date.now(), phase: 'fresh' });
    },

    // Denní tick (self-guarded, volaný z game.js tick batch, mirror LimeSystem/
    // CheeseSystem — lastTick guard doplněn, chyběl v původní verzi).
    dailyTick: function () {
        if (!this.isActive()) return;
        if (!GameState.maltTick) GameState.maltTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.maltTick.lastTick || 0) < this.DAY_MS) return;
        GameState.maltTick.lastTick = now;

        const list = this._ensureState();
        let advanced = 0;
        list.forEach(inst => {
            if (inst.phase !== 'fresh') return;
            const ageDays = (now - inst.createdAt) / this.DAY_MS;
            if (ageDays < this.MATURE_DAYS) return;
            if ((GameState.inventory['malt_fresh'] || 0) > 0) {
                GameState.inventory['malt_fresh'] -= 1;
                GameState.inventory['malt'] = (GameState.inventory['malt'] || 0) + 1;
            }
            inst.phase = 'mature';
            advanced++;
        });
        if (advanced > 0 && typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // ── UI — sub-sekce uvnitř Pivovar tabu. Mirror LimeSystem._renderStage
    // (craft tlačítko + progress bary pro fresh vsádky + souhrn z inventáře,
    // ne ze stale instance pole). ──────────────────────────────────────────
    render: function () {
        if (!this.isActive()) return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const list = this._ensureState().filter(inst => inst.phase === 'fresh');
        const r = (typeof RecipesDB !== 'undefined') ? RecipesDB.find(x => x.id === 'malt_barley') : null;
        const haveMalt = GameState.inventory['malt'] || 0;

        let h = `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">`;
        h += `<h4 style="margin:0 0 10px 0; color:var(--ink-primary);">🌱 ${lang === 'en' ? 'Malt House' : 'Sladovna'}</h4>`;

        if (r) {
            let can = true; let reqStr = '';
            Object.entries(r.req).forEach(([id, amt]) => {
                const has = GameState.inventory[id] || 0;
                const missing = (amt > 0 && has < amt) || (amt === 0 && !has);
                if (missing) can = false;
                const nm = (typeof iName === 'function') ? iName(id) : id;
                reqStr += `${amt === 0 ? (lang === 'en' ? 'req.' : 'nutno mít') : amt + 'x'} ${nm}, `;
            });
            reqStr = reqStr.slice(0, -2);
            h += `<div style="font-size:0.78rem; opacity:0.65; margin-bottom:8px;">${reqStr}</div>`;
            h += `<button class="craft-btn" onclick="Game.craft('${r.id}')" ${can ? '' : 'disabled'} style="width:100%; font-size:0.82rem; margin-bottom:10px;">🌱 ${lang === 'en' ? 'Steep & Malt' : 'Namočit a sladovat'}</button>`;
        }

        if (list.length === 0) {
            h += `<div style="font-size:0.78rem; opacity:0.5; font-style:italic; margin-bottom:6px;">${lang === 'en' ? 'Nothing malting.' : 'Momentálně nic nesladuje.'}</div>`;
        } else {
            list.forEach(inst => {
                const ageDays = (Date.now() - inst.createdAt) / this.DAY_MS;
                const pct = Math.min(100, Math.round(ageDays / this.MATURE_DAYS * 100));
                const remainDays = Math.max(0, Math.ceil(this.MATURE_DAYS - ageDays));
                h += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:0.78rem;">
                    <div style="flex:1; background:rgba(0,0,0,0.1); border-radius:4px; height:8px;">
                        <div style="width:${pct}%; background:var(--accent-gold); height:8px; border-radius:4px; transition:width 0.3s;"></div>
                    </div>
                    <span style="opacity:0.65; white-space:nowrap;">${remainDays}d</span>
                </div>`;
            });
        }

        h += `<div style="font-size:0.72rem; opacity:0.6; margin-top:4px;">${lang === 'en' ? 'In stock' : 'Máš hotovo'}: ${haveMalt}× 🌾</div>`;
        h += `</div>`;
        return h;
    },
};
