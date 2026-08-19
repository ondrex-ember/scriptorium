// ─────────────────────────────────────────────────────────────
// MillSystem — vlastní vodní mlýn, PROVOZ (ne stavba — ta je
// Game.MILL_TIERS/upgradeMillTier v core/game.js).
// mlynar-vlastni-mlyn-mrd.md §4.7 (v1.3, 16.8.2026). Anglifikace názvů
// (systém, funkce, pole) 16.8.2026 — zobrazovaný text zůstává bilingvní.
//
// Odemyká se, jakmile GameState.storage.mill.tier >= 2 (Mechanismus
// dokončen) — mirror Vápenice vzoru (gate na built, ne na tech, žádná
// smysluplná mezera "mám právo, ale ne budovu" tady existuje).
//
// Payoff oproti Mola (SaeculumSystem, Fáze 1): žádný poplatek (měřičné),
// žádný 4h čekání — melí se okamžitě, dokud vydrží voda. Výkon vázanej
// na srážky (WeatherSystem.countDryDays), ne na vítr (to je budoucí
// Fáze 2, větrný mlýn, jinej vzorec).
//
// Vizuální/interakční vzor přebranej z Mola/Mlynář panelu
// (SaeculumSystem.renderMola/renderMolaInner) — collapsible <details>,
// plnošířkový buttony. Neni to mirror (žádná fronta/poplatek), jen
// stejnej interakční jazyk.
// ─────────────────────────────────────────────────────────────

const MillSystem = {
    isBuilt: function () {
        return !!(GameState.storage && GameState.storage.mill && GameState.storage.mill.tier >= 2);
    },

    // Sucho = míň vody v náhonu = pomalejší mletí. 3denní okno, mirror
    // Pole vzoru (countDryDays/countWetDays), jen jinej práh/efekt.
    _productionMult: function () {
        if (typeof WeatherSystem === 'undefined' || !WeatherSystem.countDryDays) return 1.0;
        const { dry, total } = WeatherSystem.countDryDays(3);
        if (!total) return 1.0;
        const dryRatio = dry / total;
        if (dryRatio >= 1.0) return 0.2;   // 3/3 suchý dny — náhon skoro na dně
        if (dryRatio >= 0.66) return 0.5;  // 2/3 suchý dny — slabej průtok
        return 1.0;                         // dost srážek — plnej výkon
    },

    // Mletí trvá pár minut (mlynar-vlastni-mlyn-mrd.md §4.10, 19.8.2026,
    // schváleno Bouvardem). Prahy mirror SaeculumSystem.MOLA_FEE_TIERS —
    // stejná ekonomika, jen minuty místo grošů. Suché dny (_productionMult
    // výš) škálujou pořád jen výtěžek, ne čas — schváleno beze změny.
    GRIND_TIME_TIERS: [
        { max: 40, ms: 3 * 60 * 1000 },
        { max: 90, ms: 4 * 60 * 1000 },
        { max: 150, ms: 5 * 60 * 1000 },
        { max: 225, ms: 6 * 60 * 1000 },
        { max: 325, ms: 7 * 60 * 1000 },
        { max: Infinity, ms: 8 * 60 * 1000 },
    ],
    _grindTimeForQty: function (qty) {
        const tier = this.GRIND_TIME_TIERS.find(t => qty <= t.max);
        return tier ? tier.ms : this.GRIND_TIME_TIERS[this.GRIND_TIME_TIERS.length - 1].ms;
    },
    _grindRemainingLabel: function () {
        const o = GameState.storage.mill && GameState.storage.mill.grindOrder;
        if (!o) return '';
        const remMs = Math.max(0, o.returnsAt - Date.now());
        const m = Math.floor(remMs / 60000);
        const s = Math.floor((remMs % 60000) / 1000);
        return m + ':' + (s < 10 ? '0' : '') + s;
    },

    grind: function (inputId) {
        if (!this.isBuilt()) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (GameState.storage.mill.grindOrder && Date.now() < GameState.storage.mill.grindOrder.returnsAt) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'The mill is already grinding.' : 'Mlýn už mele.', true);
            return;
        }
        const inp = (typeof SaeculumSystem !== 'undefined') ? SaeculumSystem.MOLA_INPUTS.find(x => x.id === inputId) : null;
        if (!inp) return;
        const have = GameState.inventory[inputId] || 0;
        if (have <= 0) { UI.notify(lang === 'en' ? 'Nothing to grind.' : 'Není co mlít.', true); return; }

        const mult = this._productionMult();
        const outputQty = Math.max(1, Math.floor(have * mult));
        const waitMs = this._grindTimeForQty(have);
        Game.removeItem(inputId, have);
        GameState.storage.mill.grindOrder = { inputId, outputId: inp.outputId, qty: outputQty, returnsAt: Date.now() + waitMs };
        Game.save();
        if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? '⚙️ Grinding started.' : '⚙️ Mletí zahájeno.');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        const el = document.getElementById('home-mill-content');
        if (el) el.innerHTML = this.render();
    },

    collectGrind: function () {
        if (!this.isBuilt()) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const order = GameState.storage.mill.grindOrder;
        if (!order || Date.now() < order.returnsAt) return;
        Game.addItem(order.outputId, order.qty);
        GameState.storage.mill.grindOrder = null;
        Game.save();
        const outName = (typeof iName === 'function') ? iName(order.outputId) : order.outputId;
        UI.notifyPanel('🌾 ' + (lang === 'en' ? `Collected ${order.qty}× ${outName}.` : `Vyzvednuto ${order.qty}× ${outName}.`), 'success');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        const el = document.getElementById('home-mill-content');
        if (el) el.innerHTML = this.render();
    },

    render: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!this.isBuilt()) {
            return `<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic;">${lang === 'en' ? 'The mill is not yet complete.' : 'Mlýn ještě není dokončenej.'}</div>`;
        }
        const mult = this._productionMult();
        const pct = Math.round(mult * 100);
        const flowLabel = mult >= 1.0
            ? (lang === 'en' ? 'Full flow' : 'Plnej průtok')
            : (mult >= 0.5 ? (lang === 'en' ? 'Weak flow — dry spell' : 'Slabej průtok — sucho') : (lang === 'en' ? 'Race nearly dry' : 'Náhon skoro na dně'));

        const order = GameState.storage.mill.grindOrder;
        const grinding = !!(order && Date.now() < order.returnsAt);
        const ready = !!(order && !grinding);

        if (!GameState.ui) GameState.ui = {};
        const millOpen = GameState.ui.millSystemOpen !== false;
        // Rotující kolo dokud se mele — čistě CSS, žádnej novej SVG systém
        // (mlynar-vlastni-mlyn-mrd.md §4.10, 19.8.2026).
        let h = `<style>@keyframes millWheelSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}.mill-spinning{display:inline-block;animation:millWheelSpin 1.1s linear infinite;}</style>`;
        h += `<details ${millOpen ? 'open' : ''} ontoggle="GameState.ui.millSystemOpen = this.open; Game.save();" style="margin-bottom:16px; background:rgba(0,0,0,0.03);
                             border-radius:8px; border-left:3px solid var(--accent-gold);">`;
        h += `<summary style="cursor:pointer; padding:10px 14px; font-size:0.92rem; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px;">
                <span><span class="${grinding ? 'mill-spinning' : ''}">⚙️</span> ${lang === 'en' ? 'Water Mill' : 'Vodní mlýn'}</span><span style="opacity:0.5; font-weight:normal;">▾</span>
              </summary>`;
        h += `<div style="padding:10px 14px 14px;">`;
        h += `<div style="font-size:0.76rem; opacity:0.6; margin-bottom:8px;">${lang === 'en' ? 'Own mill — no fee, no waiting for outsiders, only the water decides.' : 'Vlastní mlýn — žádnej poplatek, nečekáš na cizí frontu, rozhoduje jen voda.'}</div>`;

        h += `<div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; opacity:0.65; margin-bottom:3px;">
                    <span>💧 ${flowLabel}</span><span>${pct}%</span>
                </div>
                <div style="height:6px; background:rgba(0,0,0,0.08); border:1px solid var(--accent-gold); border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:var(--accent-gold);"></div>
                </div>
              </div>`;

        if (grinding || ready) {
            const outItem = (typeof ItemsDB !== 'undefined') ? ItemsDB[order.outputId] : null;
            const outName = outItem ? (lang === 'en' ? outItem.name_en : outItem.name) : order.outputId;
            if (grinding) {
                h += `<div style="font-size:0.85rem;">⚙️ ${lang === 'en' ? 'Grinding' : 'Mele se'}: ${order.qty}× ${outName} — ${lang === 'en' ? 'ready in' : 'hotovo za'} <strong>${this._grindRemainingLabel()}</strong></div>`;
            } else {
                h += `<div style="font-size:0.85rem; margin-bottom:8px;">${lang === 'en' ? 'Ready' : 'Hotovo'}: ${order.qty}× ${outName}</div>`;
                h += `<button class="craft-btn" onclick="MillSystem.collectGrind()" style="width:100%;">📦 ${lang === 'en' ? 'Collect' : 'Vyzvednout'}</button>`;
            }
        } else if (typeof SaeculumSystem !== 'undefined') {
            h += `<div style="display:flex;flex-direction:column;gap:6px;">`;
            SaeculumSystem.MOLA_INPUTS.filter(inp => !inp.mult).forEach(inp => { // jen zrní (log/bark mají mult, patří Mlynáři/Mole, ne sem)
                const have = GameState.inventory[inp.id] || 0;
                const label = lang === 'en' ? inp.label_en : inp.label;
                const outName = (typeof iName === 'function') ? iName(inp.outputId) : inp.outputId;
                const verb = lang === 'en' ? 'grind to' : 'semlít na';
                h += `<button class="craft-btn" onclick="MillSystem.grind('${inp.id}')" ${have > 0 ? '' : 'disabled'}
                        style="text-align:left; white-space:normal; word-break:break-word; line-height:1.25; width:100%;">
                        ${inp.icon} ${label} (${have}) → ${verb} ${outName}
                      </button>`;
            });
            h += `</div>`;
        }
        h += `</div></details>`;
        return h;
    },
};