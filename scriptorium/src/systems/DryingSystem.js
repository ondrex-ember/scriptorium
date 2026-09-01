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
        // mlynar-vlastni-mlyn-mrd.md §4.5 (16.8.2026) — dub na hřídel/kolo vodního
        // mlýna. dryDays herně zkráceno z historickejch "i několik let" na 5 dní.
        oak: { input: 'oak_log_raw', inputQty: 1, output: 'oak_log_seasoned', dryDays: 5 },
    },

    isActive: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_susarna'));
    },

    // Tier 2 — samostatná brána jen pro Sušárnu (Pracovna tab), Foculus
    // (isActive výš) zůstává na tech_susarna, mlynar-vlastni-mlyn-mrd.md
    // §4.5, upřesněno 16.8.2026.
    isIndustrialActive: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_susarna_industria'));
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
        // mlynar-vlastni-mlyn-mrd.md §4.5 (17.8.2026) — oprava: startDrying
        // psanej ještě jen na Foculus, nikdy neosvěžil novej Sušárna tab.
        // Bez tohohle klik na "Zahájit sušení" v Pracovně vypadal, že nic
        // nedělá — data se měnila, UI ne.
        const _dryingEl = document.getElementById('home-drying-content');
        if (_dryingEl && _dryingEl.style.display !== 'none') {
            _dryingEl.innerHTML = this.renderSusarna();
        }
        if (typeof UI !== 'undefined' && UI.notify) UI.notify('🌾 ' + (lang === 'en' ? 'Drying started.' : 'Sušení zahájeno.'));
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

    // ── Sušárna — průmyslová verze, Pracovna vlastní tab (mlynar-vlastni-
    // mlyn-mrd.md §4.5, 16.8.2026). NEZÁVISLÁ na renderFoculus (ten zůstává
    // soukromej, jen konopí) — tahle je generická přes celou DRY_TYPES,
    // víc instancí najednou na typ. Stejná data (GameState.dryingInstances,
    // stejnej dailyTick), jen jinej vstupní bod a jiná UI vrstva.
    renderSusarna: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!this.isIndustrialActive()) {
            return `<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Requires research first (Susarna Industria).' : 'Vyžaduje nejdřív výzkum (Sušárna Industria).'}</div>`;
        }
        // mlynar-vlastni-mlyn-mrd.md §4.5 (16.8.2026) — tech odemyká jen
        // MOŽNOST postavit, samotná funkčnost čeká na fyzickou budovu
        // (Cellarium → Budovy → Sušárna), mirror Fodina tech-vs-petice vzoru.
        if (!(GameState.storage && GameState.storage.susarna && GameState.storage.susarna.built)) {
            return `<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Build the Drying Rack first (Cellarium → Buildings).' : 'Nejdřív postav Sušárnu (Cellarium → Budovy).'}</div>`;
        }
        const list = this._ensureState();
        let h = '';

        Object.keys(this.DRY_TYPES).forEach(typeKey => {
            const def = this.DRY_TYPES[typeKey];
            const inName = (typeof iName === 'function') ? iName(def.input) : def.input;
            const outName = (typeof iName === 'function') ? iName(def.output) : def.output;
            const active = list.filter(inst => inst.type === typeKey);
            const have = GameState.inventory[def.input] || 0;
            const haveOutput = GameState.inventory[def.output] || 0;
            const can = have >= def.inputQty;

            h += `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">`;
            h += `<h4 style="margin:0 0 10px 0; color:var(--ink-primary);">🌾 ${outName}</h4>`;
            // Aktuální zásoba syroviny — "kolik čeho mám ve zdrojích", mirror
            // požadavku (17.8.2026). Bez tohohle nešlo poznat, jestli je co sušit.
            h += `<div style="font-size:0.78rem; opacity:0.65; margin-bottom:8px;">${lang === 'en' ? 'You have' : 'Máš'}: ${have}× ${inName}</div>`;

            if (active.length === 0) {
                h += `<div style="font-size:0.78rem; opacity:0.5; font-style:italic; margin-bottom:6px;">${lang === 'en' ? 'Nothing in progress.' : 'Momentálně nic nezraje.'}</div>`;
            } else {
                // Zbývající dny, ne holé %, mirror LimeSystem._renderStage přesně —
                // "1%" nikomu neřekne, jestli je to za hodinu, nebo za týden.
                active.forEach(inst => {
                    const totalMs = def.dryDays * this.DAY_MS;
                    const elapsedDays = (Date.now() - inst.startedAt) / this.DAY_MS;
                    const pct = Math.min(100, Math.round(elapsedDays / def.dryDays * 100));
                    const remainDays = Math.max(0, Math.ceil(def.dryDays - elapsedDays));
                    h += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:0.78rem;">
                        <div style="flex:1; background:rgba(0,0,0,0.1); border-radius:4px; height:8px;">
                            <div style="width:${pct}%; background:var(--accent-gold); height:8px; border-radius:4px; transition:width 0.3s;"></div>
                        </div>
                        <span style="opacity:0.65; white-space:nowrap;">${remainDays}${lang === 'en' ? 'd left' : 'd zbývá'}</span>
                    </div>`;
                });
            }

            h += `<button onclick="DryingSystem.startDrying('${typeKey}')" ${can ? '' : 'disabled'}
                style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--accent-gold);
                background:${can ? 'rgba(197,160,89,0.15)' : 'rgba(197,160,89,0.07)'};
                color:var(--accent-gold); cursor:${can ? 'pointer' : 'default'};
                font-size:0.82rem; opacity:${can ? '1' : '0.5'}; margin-top:6px;">
                🌾 ${lang === 'en' ? 'Start drying' : 'Zahájit sušení'} (${def.inputQty}× ${inName}, ${def.dryDays}${lang === 'en' ? 'd' : 'd'})
            </button>`;
            // "Máš hotovo" — aktuální sklad hotovýho výstupu, mirror Vápenice přesně.
            h += `<div style="font-size:0.72rem; opacity:0.6; margin-top:6px;">${lang === 'en' ? 'In stock' : 'Máš hotovo'}: ${haveOutput}×</div>`;
            h += `</div>`;
        });

        // susarna-uvarium-bridge (1.9.2026): Uvarium (sušení hroznů, Vinohrad)
        // je samostatný systém — vlastní GameState.uvariumDrying, ne DRY_TYPES.
        // Tahle karta nic nepřesouvá ani neduplikuje, jen čte stejný stav a
        // volá stejné GardenSystem.startDrying/collectDrying — zrcadlo karty
        // ve Vinohradu, jiné místo. Zobrazí se jen pokud je Uvarium postavené.
        if (typeof GardenSystem !== 'undefined' && GameState.storage && GameState.storage.uvarium && GameState.storage.uvarium.built) {
            const drying = GameState.uvariumDrying;
            const outName = (typeof iName === 'function') ? iName('raisins') : 'raisins';
            h += `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">`;
            h += `<h4 style="margin:0 0 10px 0; color:var(--ink-primary);">🍇 ${outName}</h4>`;
            if (drying) {
                const v = GardenSystem.VINEA_DB[drying.varietyId];
                const vName = v ? (lang === 'en' ? v.name_en : v.name) : drying.varietyId;
                const totalMs = 5 * this.DAY_MS;
                const elapsedMs = Date.now() - drying.startedAt;
                const pct = Math.min(100, Math.round(elapsedMs / totalMs * 100));
                const ready = Date.now() >= drying.readyAt;
                h += `<div style="font-size:0.78rem; opacity:0.65; margin-bottom:8px;">${vName} ×${drying.amount}</div>`;
                h += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:0.78rem;">
                    <div style="flex:1; background:rgba(0,0,0,0.1); border-radius:4px; height:8px;">
                        <div style="width:${pct}%; background:var(--accent-gold); height:8px; border-radius:4px; transition:width 0.3s;"></div>
                    </div>
                    <span style="opacity:0.65; white-space:nowrap;">${ready ? (lang === 'en' ? 'ready!' : 'hotovo!') : (Math.max(0, Math.ceil((drying.readyAt - Date.now()) / this.DAY_MS)) + (lang === 'en' ? 'd left' : 'd zbývá'))}</span>
                </div>`;
                h += `<button onclick="GardenSystem.collectDrying()" ${ready ? '' : 'disabled'}
                    style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--accent-gold);
                    background:${ready ? 'rgba(197,160,89,0.15)' : 'rgba(197,160,89,0.07)'};
                    color:var(--accent-gold); cursor:${ready ? 'pointer' : 'default'};
                    font-size:0.82rem; opacity:${ready ? '1' : '0.5'}; margin-top:6px;">
                    🍇 ${lang === 'en' ? 'Collect' : 'Vyzvednout'}
                </button>`;
            } else {
                const opts = Object.values(GardenSystem.VINEA_DB).map(v => {
                    const gHave = GameState.inventory['grapes_' + v.id] || 0;
                    return `<option value="${v.id}" ${gHave > 0 ? '' : 'disabled'}>${lang === 'en' ? v.name_en : v.name} (${gHave})</option>`;
                }).join('');
                h += `<div style="font-size:0.78rem; opacity:0.5; font-style:italic; margin-bottom:6px;">${lang === 'en' ? 'Nothing in progress.' : 'Momentálně nic nezraje.'}</div>`;
                h += `<select id="susarna-uvarium-sel" style="font-size:0.78rem;padding:4px;width:100%;margin-bottom:6px;">${opts}</select>`;
                h += `<button onclick="GardenSystem.startDrying(document.getElementById('susarna-uvarium-sel').value)"
                    style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--accent-gold);
                    background:rgba(197,160,89,0.15); color:var(--accent-gold); cursor:pointer;
                    font-size:0.82rem; margin-top:6px;">
                    🍇 ${lang === 'en' ? 'Start drying' : 'Zahájit sušení'} (5${lang === 'en' ? 'd' : 'd'})
                </button>`;
            }
            const haveRaisins = GameState.inventory['raisins'] || 0;
            h += `<div style="font-size:0.72rem; opacity:0.6; margin-top:6px;">${lang === 'en' ? 'In stock' : 'Máš hotovo'}: ${haveRaisins}×</div>`;
            h += `</div>`;
        }

        return h;
    },
};
