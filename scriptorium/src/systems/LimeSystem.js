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
        list.push({ baseType: baseType, createdAt: Date.now(), phase: 'fresh', cleaned: false });
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

    // ── Vyčistit pec — vedlejší produkt (popel) z vypálených vsádek ────────
    // Jen vapno_paleny (pec/oheň) — vapno_hasene zraje v jámě bez ohně,
    // žádný popel tam nevzniká. 16.8.2026, Bouvard schváleno.
    CLEAN_ASH: 4,

    cleanKiln: function() {
        const list = this._ensureState();
        const ready = list.filter(inst => inst.baseType === 'vapno_paleny' && inst.phase === 'mature' && !inst.cleaned);
        if (ready.length === 0) return;
        const gain = ready.length * this.CLEAN_ASH;
        ready.forEach(inst => { inst.cleaned = true; });
        if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('ash', gain);
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.notify) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            UI.notify('🌫️ ' + (lang === 'en' ? `+${gain} ash` : `+${gain} popela`));
        }
        const el = document.getElementById('home-vapenice-content');
        if (el && el.offsetParent !== null) el.innerHTML = this.render();
    },

    // ── UI — Vápenice tab v Pracovně (pec + jáma), 16.8.2026 ────────────────
    // Gate: tab button samotný se zobrazí jen po GameState.storage.vapenice.built
    // (viz ui.js renderAll), tahle metoda proto bez druhýho built-gate uvnitř.
    render: function() {
        if (!this.isActive()) return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        let h = '';
        h += this._renderStage('vapno_paleny', 'burn_lime', '🔥', lang === 'en' ? 'Kiln — Burning' : 'Pec — pálení', lang);
        h += this._renderCleanButton(lang);
        h += this._renderStage('vapno_hasene', 'slake_lime', '💧', lang === 'en' ? 'Pit — Slaking' : 'Jáma — hašení', lang);
        return h;
    },

    _renderCleanButton: function(lang) {
        const list = this._ensureState();
        const ready = list.filter(inst => inst.baseType === 'vapno_paleny' && inst.phase === 'mature' && !inst.cleaned);
        if (ready.length === 0) return '';
        const gain = ready.length * this.CLEAN_ASH;
        return `<button onclick="LimeSystem.cleanKiln()" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--accent-gold); background:rgba(197,160,89,0.15); color:var(--accent-gold); cursor:pointer; font-size:0.85rem; margin-bottom:12px;">🧹 ${lang === 'en' ? 'Clean the kiln' : 'Vyčistit pec'} (+${gain} 🌫️)</button>`;
    },

    // Jedna sekce (pec, nebo jáma) — craft tlačítko + progress bary pro
    // rozdělané vsádky (fresh). Hotové (mature) se nevypisují po jedný —
    // ukazuje se souhrn z reálnýho inventáře (zdroj pravdy), ne ze stale
    // instance pole (to by po spotřebování mature itemu jiným receptem
    // dál viselo v seznamu jako duch — stejná mezera co má CheeseSystem).
    _renderStage: function(baseType, recipeId, icon, title, lang) {
        const def = this.LIME_TYPES[baseType];
        const list = this._ensureState().filter(inst => inst.baseType === baseType && inst.phase === 'fresh');
        const r = (typeof RecipesDB !== 'undefined') ? RecipesDB.find(x => x.id === recipeId) : null;
        const matureId = baseType + '_mature';
        const haveMature = GameState.inventory[matureId] || 0;

        let h = `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">`;
        h += `<h4 style="margin:0 0 10px 0; color:var(--ink-primary);">${icon} ${title}</h4>`;

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
            h += `<button class="craft-btn" onclick="Game.craft('${r.id}')" ${can ? '' : 'disabled'} style="width:100%; font-size:0.82rem; margin-bottom:10px;">${icon} ${lang === 'en' ? 'Craft' : 'Vyrobit'}</button>`;
        }

        if (list.length === 0) {
            h += `<div style="font-size:0.78rem; opacity:0.5; font-style:italic; margin-bottom:6px;">${lang === 'en' ? 'Nothing in progress.' : 'Momentálně nic nezraje.'}</div>`;
        } else {
            list.forEach(inst => {
                const ageMs = Date.now() - inst.createdAt;
                const ageDays = ageMs / this.DAY_MS;
                const pct = Math.min(100, Math.round(ageDays / def.matureDays * 100));
                const remainDays = Math.max(0, Math.ceil(def.matureDays - ageDays));
                h += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:0.78rem;">
                    <div style="flex:1; background:rgba(0,0,0,0.1); border-radius:4px; height:8px;">
                        <div style="width:${pct}%; background:var(--accent-gold); height:8px; border-radius:4px; transition:width 0.3s;"></div>
                    </div>
                    <span style="opacity:0.65; white-space:nowrap;">${remainDays}${lang === 'en' ? 'd' : 'd'}</span>
                </div>`;
            });
        }

        h += `<div style="font-size:0.72rem; opacity:0.6; margin-top:4px;">${lang === 'en' ? 'In stock' : 'Máš hotovo'}: ${haveMature}×</div>`;
        h += `</div>`;
        return h;
    },
};