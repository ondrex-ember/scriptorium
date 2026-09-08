// ═══════════════════════════════════════════════════════════════════════════
// CERVISIARIA SYSTEM — velkovýroba piva (uvnitř Pivovar tabu). Mirror
// CheeseSystem.js (fresh→mature→aged, aged volitelný), ale s JEDNÍM
// rozdílem: finální fáze nemapuje na "baseType_phase" příponu jako sýr,
// ale na HOLÉ jméno itemu (prima_cervisia / cervisia_nigra) — musí sedět
// s existujícím Athanor itemem a s GuildsDB.affectedGoods (šenkovní
// právo reguluje prodej "prima_cervisia", ne "prima_cervisia_mature").
// pivovar-velkovyroba-mrd.md v0.7 (7.9.2026), schváleno Bouvard.
//
// Gate: tech_braxatio (prima_cervisia) / tech_braxatio_nigra (cervisia_nigra).
// Render se volá z CellariumSystem.renderPivovarTab(), NE jako vlastní tab.
// ═══════════════════════════════════════════════════════════════════════════

const CervisiariaSystem = {

    DAY_MS: 24 * 60 * 60 * 1000,

    // Nástřel čísla — mirror CHEESE_TYPES řádu, podloženo historickým
    // podkladem (Unger): "3-7 dní" kvašení, "týdny" pro silnější piva.
    CERVISIA_TYPES: {
        prima_cervisia: { matureDays: 5, agedDays: null },  // slabé, rychlá spotřeba
        cervisia_nigra: { matureDays: 7, agedDays: 14 },     // silné, kvašení + zrání
    },

    isActive: function (baseType) {
        if (baseType === 'cervisia_nigra') {
            return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_braxatio_nigra'));
        }
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_braxatio'));
    },

    _ensureState: function () {
        if (!GameState.cervisiaInstances) GameState.cervisiaInstances = [];
        return GameState.cervisiaInstances;
    },

    // Voláno z recipe craft hooku při vaření nové várky (brew_prima_cervisia
    // / brew_cervisia_nigra). Praxí-počítadlo pro tech_braxatio_nigra gate
    // (InventoryManager.researchTech) žije tady, ne v Athanoru — počítá
    // VELKÉ várky, ne malé Athanor kusy (jiný účel než Athanor counter).
    registerInstance: function (baseType) {
        this._ensureState().push({ baseType: baseType, createdAt: Date.now(), phase: 'fresh' });
        if (baseType === 'prima_cervisia') {
            GameState.cervisiariaBrewCount = (GameState.cervisiariaBrewCount || 0) + 1;
        }
    },

    // Vrátí finální itemId pro danou fázi — bare jméno na konci řetězu
    // (mature když agedDays===null, jinak aged), jinak baseType_phase.
    _itemIdForPhase: function (baseType, phase) {
        const def = this.CERVISIA_TYPES[baseType];
        const isFinal = (phase === 'mature' && !def.agedDays) || (phase === 'aged');
        return isFinal ? baseType : (baseType + '_' + phase);
    },

    dailyTick: function () {
        if (!(this.isActive('prima_cervisia') || this.isActive('cervisia_nigra'))) return;
        if (!GameState.cervisiaTick) GameState.cervisiaTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.cervisiaTick.lastTick || 0) < this.DAY_MS) return;
        GameState.cervisiaTick.lastTick = now;

        const list = this._ensureState();
        let advanced = 0;
        list.forEach(inst => {
            const def = this.CERVISIA_TYPES[inst.baseType];
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
                NotificationSystem.panel('🍺 ' + (lang === 'en'
                    ? advanced + '× beer matured further.'
                    : advanced + '× pivo dozrálo do další fáze.'), 'info');
            }
            if (typeof Game !== 'undefined' && Game.save) Game.save();
        }
    },

    _advance: function (inst, newPhase) {
        const oldId = this._itemIdForPhase(inst.baseType, inst.phase);
        const newId = this._itemIdForPhase(inst.baseType, newPhase);
        if ((GameState.inventory[oldId] || 0) > 0) {
            GameState.inventory[oldId] -= 1;
            GameState.inventory[newId] = (GameState.inventory[newId] || 0) + 1;
        }
        inst.phase = newPhase;
    },

    // ── UI — sub-sekce uvnitř Pivovar tabu. Mirror CheeseSystem.render
    // (craft karty nahoře + rozbalovací "Zrání" panel s progress bary). ────
    render: function () {
        if (!(this.isActive('prima_cervisia') || this.isActive('cervisia_nigra'))) return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const list = this._ensureState();
        let h = '';

        const brewRecipeIds = ['brew_prima_cervisia', 'brew_cervisia_nigra'];
        const brewRecipes = brewRecipeIds
            .map(id => (typeof RecipesDB !== 'undefined') ? RecipesDB.find(r => r.id === id) : null)
            .filter(r => r && (!r.locked || (GameState.unlockedRecipes || []).includes(r.id)));

        if (brewRecipes.length > 0) {
            h += `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">`;
            h += `<h4 style="margin:0 0 10px 0; color:var(--ink-primary);">🍺 ${lang === 'en' ? 'Brew' : 'Vařit'}</h4>`;
            h += `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:6px;">`;
            brewRecipes.forEach(r => {
                const prod = (typeof ItemsDB !== 'undefined') ? ItemsDB[r.output] : null;
                if (!prod) return;
                let can = true; let reqStr = '';
                Object.entries(r.req).forEach(([id, amt]) => {
                    const has = GameState.inventory[id] || 0;
                    const missing = (amt > 0 && has < amt) || (amt === 0 && !has);
                    if (missing) can = false;
                    const nm = (typeof iName === 'function') ? iName(id) : id;
                    reqStr += `${amt === 0 ? (lang === 'en' ? 'req.' : 'nutno mít') : amt + 'x'} ${nm}, `;
                });
                reqStr = reqStr.slice(0, -2);
                const outName = (typeof iName === 'function') ? iName(r.output) : r.output;
                h += `<div style="background:rgba(255,255,255,0.4); padding:10px; border-radius:8px; border:1px solid rgba(197,160,89,0.3);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <div>
                            <div style="font-size:0.82rem; font-weight:bold;">${prod.icon} ${outName}</div>
                            <div style="font-size:0.7rem; opacity:0.65;">${reqStr}</div>
                          </div>
                          <button class="craft-btn" onclick="Game.craft('${r.id}')" ${can ? '' : 'disabled'} style="font-size:0.75rem;">🍺 ${lang === 'en' ? 'Brew' : 'Vařit'}</button>
                        </div>
                      </div>`;
            });
            h += `</div></div>`;
        }

        if (list.length === 0) return h;
        if (!GameState.ui) GameState.ui = {};
        const open = GameState.ui.cervisiariaAgingOpen !== false;
        h += `<details ${open ? 'open' : ''} ontoggle="GameState.ui.cervisiariaAgingOpen = this.open; Game.save();" style="margin-top:14px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
        h += `<summary style="cursor:pointer; padding:10px 14px; font-size:0.92rem; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px; color:var(--ink-primary);">
                <span>🍺 ${lang === 'en' ? 'Fermenting & Aging' : 'Kvašení a zrání'}</span><span style="opacity:0.5; font-weight:normal;">▾</span>
              </summary>`;
        h += `<div style="padding:4px 14px 14px;">`;
        list.forEach(inst => {
            const def = this.CERVISIA_TYPES[inst.baseType];
            if (!def) return;
            const ageMs = Date.now() - inst.createdAt;
            const ageDays = ageMs / this.DAY_MS;
            const curId = this._itemIdForPhase(inst.baseType, inst.phase);
            const name = (typeof iName === 'function') ? iName(curId) : inst.baseType;
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
