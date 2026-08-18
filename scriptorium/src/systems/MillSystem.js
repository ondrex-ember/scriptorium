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
    isBuilt: function() {
        return !!(GameState.storage && GameState.storage.mill && GameState.storage.mill.tier >= 2);
    },

    // Sucho = míň vody v náhonu = pomalejší mletí. 3denní okno, mirror
    // Pole vzoru (countDryDays/countWetDays), jen jinej práh/efekt.
    _productionMult: function() {
        if (typeof WeatherSystem === 'undefined' || !WeatherSystem.countDryDays) return 1.0;
        const { dry, total } = WeatherSystem.countDryDays(3);
        if (!total) return 1.0;
        const dryRatio = dry / total;
        if (dryRatio >= 1.0) return 0.2;   // 3/3 suchý dny — náhon skoro na dně
        if (dryRatio >= 0.66) return 0.5;  // 2/3 suchý dny — slabej průtok
        return 1.0;                         // dost srážek — plnej výkon
    },

    grind: function(inputId) {
        if (!this.isBuilt()) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const inp = (typeof SaeculumSystem !== 'undefined') ? SaeculumSystem.MOLA_INPUTS.find(x => x.id === inputId) : null;
        if (!inp) return;
        const have = GameState.inventory[inputId] || 0;
        if (have <= 0) { UI.notify(lang==='en' ? 'Nothing to grind.' : 'Není co mlít.', true); return; }

        const mult = this._productionMult();
        const outputQty = Math.max(1, Math.floor(have * mult));
        Game.removeItem(inputId, have);
        Game.addItem(inp.outputId, outputQty);
        Game.save();
        const outName = (typeof iName === 'function') ? iName(inp.outputId) : inp.outputId;
        UI.notifyPanel('🌾 ' + (lang==='en' ? `Ground into ${outputQty}× ${outName}.` : `Semleto na ${outputQty}× ${outName}.`), 'success');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        const el = document.getElementById('home-mill-content');
        if (el) el.innerHTML = this.render();
    },

    render: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!this.isBuilt()) {
            return `<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic;">${lang === 'en' ? 'The mill is not yet complete.' : 'Mlýn ještě není dokončenej.'}</div>`;
        }
        const mult = this._productionMult();
        const pct = Math.round(mult * 100);
        const flowLabel = mult >= 1.0
            ? (lang === 'en' ? 'Full flow' : 'Plnej průtok')
            : (mult >= 0.5 ? (lang === 'en' ? 'Weak flow — dry spell' : 'Slabej průtok — sucho') : (lang === 'en' ? 'Race nearly dry' : 'Náhon skoro na dně'));

        if (!GameState.ui) GameState.ui = {};
        const millOpen = GameState.ui.millSystemOpen !== false;
        let h = `<details ${millOpen ? 'open' : ''} ontoggle="GameState.ui.millSystemOpen = this.open; Game.save();" style="margin-bottom:16px; background:rgba(0,0,0,0.03);
                             border-radius:8px; border-left:3px solid var(--accent-gold);">`;
        h += `<summary style="cursor:pointer; padding:10px 14px; font-size:0.92rem; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px;">
                <span>💧 ${lang === 'en' ? 'Water Mill' : 'Vodní mlýn'}</span><span style="opacity:0.5; font-weight:normal;">▾</span>
              </summary>`;
        h += `<div style="padding:10px 14px 14px;">`;
        h += `<div style="font-size:0.76rem; opacity:0.6; margin-bottom:8px;">${lang === 'en' ? 'Own mill — no fee, no wait, only the water decides.' : 'Vlastní mlýn — žádnej poplatek, žádný čekání, rozhoduje jen voda.'} · 💧 ${flowLabel} (${pct}%)</div>`;
        h += `<div style="display:flex;flex-direction:column;gap:6px;">`;
        if (typeof SaeculumSystem !== 'undefined') {
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
        }
        h += `</div></div></details>`;
        return h;
    },
};