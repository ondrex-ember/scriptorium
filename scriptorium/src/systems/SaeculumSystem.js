// ═══════════════════════════════════════════════════════════════════════════════
// SAECULUM SYSTEM v1.0 — Kontakt s venkem
// Hospoda / Obchod / Trh — vyňato z Cellaria, vlastní subtab Pracovny
// Cenový engine (BASE_PRICES, calcPrice, sellItem, buyItem) zůstává v CellariumSystem —
// Saeculum je tenká prezentační vrstva, co do něj volá.
// ═══════════════════════════════════════════════════════════════════════════════

const SaeculumSystem = {

  renderSaeculumTab: function() {
    // Stejná brána jako Cellarium — Hospoda/Obchod/Trh se jen přesunuly, neodemykají se nově
    if (!CellariumSystem.hasCellarium()) {
      return CellariumSystem.renderLockedScreen();
    }
    return this.renderSaeculumContent();
  },

  renderSaeculumContent: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const hasNum = CellariumSystem.hasNumismatica();

    let h = `<div id="saeculum-content" style="padding:10px;">`;

    // ── Hlavička: Benedikt + pokladna (sdílený s Cellariem, jen jiný kontext) ──
    h += `
      <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;
                  padding:15px; background:rgba(197,160,89,0.07);
                  border-radius:10px; border-left:4px solid var(--accent-gold);">
        <div style="font-size:2.5rem;">🧾</div>
        <div style="flex:1;">
          <div style="font-weight:bold; font-size:1rem;">${t('cellarium.benedict')}</div>
          <div style="font-size:0.8rem; opacity:0.65; font-style:italic;">${t('cellarium.benedictRole')}</div>
          <div style="font-size:0.8rem; opacity:0.6; margin-top:4px;">
            ${CellariumSystem._benediktMotto('saeculum')}
          </div>
        </div>
        <div style="text-align:center; min-width:70px;">
          <div style="font-size:1.8rem;">💰</div>
          <div style="font-weight:bold; font-size:1.3rem;" id="cellarium-grose-count">${CellariumSystem.getGrose()}</div>
          <div style="font-size:0.7rem; opacity:0.6;">${t('cellarium.grose')}</div>
        </div>
      </div>
    `;

    h += CellariumSystem._benediktStats('saeculum');

    if (!hasNum) {
      h += `
        <div style="text-align:center; padding:30px; opacity:0.6;
                    border:1px dashed rgba(197,160,89,0.3); border-radius:8px;">
          <div style="font-size:2rem; margin-bottom:10px;">📜</div>
          <div style="font-style:italic; font-size:0.9rem;">
            Benedikt vítá tvou návštěvu, ale obchod zatím stojí.<br>
            Odemkni <strong>Numismatica — Věda o Groších</strong> pro plný přístup.
          </div>
        </div>
      `;
    } else {
      h += this.renderForumPecuarium();
      h += this.renderMola();
      h += this.renderEntityTabs();
    }

    h += `</div>`;
    return h;
  },

  // ── Forum Pecuarium — výpůjčky plemenných samců ze vsi ─────────────────
  LOAN_TYPES: [
    { type: 'ram',        icon: '🐏', label: 'Beran', label_en: 'Ram',         pen: 'sheepfold', penLabel: 'Ovile',   cost: 15 },
    { type: 'billy_goat', icon: '🐐', label: 'Kozel', label_en: 'Billy goat',  pen: 'goatpen',    penLabel: 'Caprile', cost: 15 },
    { type: 'boar',       icon: '🐗', label: 'Kanec', label_en: 'Boar',        pen: 'pigsty',     penLabel: 'Suile',   cost: 15 },
  ],

  renderForumPecuarium: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const loan = GameState.loanMale;
    const active = loan && Date.now() < loan.returnsAt;

    if (!GameState.ui) GameState.ui = {};
    const forumOpen = GameState.ui.saeculumForumOpen !== false;
    let h = `<details ${forumOpen ? 'open' : ''} ontoggle="GameState.ui.saeculumForumOpen = this.open; Game.save();" style="margin-bottom:16px; background:rgba(0,0,0,0.03);
                         border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<summary style="cursor:pointer; padding:10px 14px; font-size:0.92rem; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px;">
            <span>🐏 Forum Pecuarium</span><span style="opacity:0.5; font-weight:normal;">▾</span>
          </summary>`;
    h += `<div style="padding:10px 14px 14px;">`;

    if (active) {
      const ty = this.LOAN_TYPES.find(x => x.type === loan.type);
      const remH = (typeof FarmyardSystem !== 'undefined') ? FarmyardSystem.loanMaleRemainingH() : 0;
      h += `<div style="font-size:0.85rem;">
              ${ty ? ty.icon : '🐾'} ${lang==='en' ? (ty?ty.label_en:loan.type) : (ty?ty.label:loan.type)}
              — ${lang==='en' ? 'returns in' : 'vrátí se za'} <strong>${remH}h</strong>
              ${ty ? `<div style="font-size:0.75rem;opacity:0.6;margin-top:4px;">${lang==='en'?'Visit the':'Zamiř do'} ${ty.penLabel}.</div>` : ''}
            </div>`;
    } else {
      h += `<div style="display:flex;gap:8px;flex-wrap:wrap;">`;
      this.LOAN_TYPES.forEach(ty => {
        const penBuilt = !!(GameState[ty.pen] && GameState[ty.pen].built);
        const name = lang === 'en' ? ty.label_en : ty.label;
        h += `<button class="craft-btn" onclick="FarmyardSystem.borrowMale('${ty.type}', ${ty.cost}) && SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');" ${penBuilt ? '' : 'disabled'}
                style="flex:1 1 calc(33% - 8px); min-width:0; white-space:normal; word-break:break-word; line-height:1.25;">
                ${ty.icon} ${name} (${ty.cost}g)
              </button>`;
      });
      h += `</div>`;
    }
    h += `</div></details>`;
    return h;
  },

  // ── Mola — mlýn, mele zrní na mouku ─────────────────────────────────────
  MOLA_INPUTS: [
    { id: 'wheat_grain_1', outputId: 'flour_1', icon: '🌾', label: 'Pšenice (1. tř.)', label_en: 'Wheat (Grade 1)' },
    { id: 'rye_grain_1',   outputId: 'flour_1', icon: '🌾', label: 'Žito (1. tř.)',     label_en: 'Rye (Grade 1)' },
    { id: 'wheat_grain_2', outputId: 'flour_2', icon: '🌾', label: 'Pšenice (2. tř.)', label_en: 'Wheat (Grade 2)' },
    { id: 'rye_grain_2',   outputId: 'flour_2', icon: '🌾', label: 'Žito (2. tř.)',     label_en: 'Rye (Grade 2)' },
    { id: 'grain',         outputId: 'flour_2', icon: '🌾', label: 'Zrní (tržní)',      label_en: 'Grain (market)' },
  ],
  MOLA_COST: 3,
  MOLA_MS: 4 * 60 * 60 * 1000,

  renderMola: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const order = GameState.millOrder;
    const active = order && Date.now() < order.returnsAt;

    if (!GameState.ui) GameState.ui = {};
    const molaOpen = GameState.ui.saeculumMolaOpen !== false;
    let h = `<details ${molaOpen ? 'open' : ''} ontoggle="GameState.ui.saeculumMolaOpen = this.open; Game.save();" style="margin-bottom:16px; background:rgba(0,0,0,0.03);
                         border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<summary style="cursor:pointer; padding:10px 14px; font-size:0.92rem; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px;">
            <span>⚙️ ${t('saeculum.mola')}</span><span style="opacity:0.5; font-weight:normal;">▾</span>
          </summary>`;
    h += `<div style="padding:10px 14px 14px;">`;

    if (active) {
      const remH = this.millRemainingH();
      const outItem = (typeof ItemsDB !== 'undefined') ? ItemsDB[order.outputId] : null;
      const outName = outItem ? (lang === 'en' ? outItem.name_en : outItem.name) : order.outputId;
      h += `<div style="font-size:0.85rem;">⚙️ ${t('saeculum.milling')}: ${order.qty}× ${outName}`;
      if (remH > 0) {
        h += ` — ${t('saeculum.readyIn')} <strong>${remH}h</strong></div>`;
      } else {
        h += `</div><button class="craft-btn" onclick="SaeculumSystem.collectFromMill()" style="margin-top:8px;">📦 ${t('saeculum.millCollect')}</button>`;
      }
    } else {
      h += `<div style="display:flex;flex-direction:column;gap:6px;">`;
      this.MOLA_INPUTS.forEach(inp => {
        const have = GameState.inventory[inp.id] || 0;
        const name = lang === 'en' ? inp.label_en : inp.label;
        h += `<button class="craft-btn" onclick="SaeculumSystem.sendToMill('${inp.id}')" ${have > 0 ? '' : 'disabled'}
                style="text-align:left; white-space:normal; word-break:break-word; line-height:1.25; width:100%;">
                ${inp.icon} ${name} (${have}) → ${t('saeculum.millTo')}
              </button>`;
      });
      h += `</div>`;
      h += `<div style="font-size:0.72rem;opacity:0.6;margin-top:6px;">${t('saeculum.millCostNote')}</div>`;
    }
    h += `</div></details>`;
    return h;
  },

  sendToMill: function(inputId) {
    if (GameState.millOrder && Date.now() < GameState.millOrder.returnsAt) {
      if (typeof UI !== 'undefined') UI.notify(t('saeculum.millActive'), true);
      return false;
    }
    const have = GameState.inventory[inputId] || 0;
    if (have <= 0) return false;
    const inp = this.MOLA_INPUTS.find(x => x.id === inputId);
    if (!inp) return false;
    if (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) {
      if (CellariumSystem.getGrose() < this.MOLA_COST) {
        if (typeof UI !== 'undefined') UI.notify(t('saeculum.millNoGold'), true);
        return false;
      }
      CellariumSystem.addGrose(-this.MOLA_COST);
    }
    Game.removeItem(inputId, have);
    GameState.millOrder = { inputId, outputId: inp.outputId, qty: have, returnsAt: Date.now() + this.MOLA_MS };
    if (typeof UI !== 'undefined') UI.notify('⚙️ ' + t('saeculum.millSent'));
    if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
      Game.addKronikaEntry('important',
        '⚙️ Zrní odvezeno na mlýn. Vrátí se za 4 hodiny jako mouka.',
        '⚙️ Grain sent to the mill. Returns as flour in 4 hours.',
        '⚙️ Granum ad molam missum est.');
    }
    if (typeof Game !== 'undefined' && Game.save) Game.save();
    this.switchEntity(GameState.ui.saeculumEntity || 'tavern');
    return true;
  },

  collectFromMill: function() {
    const order = GameState.millOrder;
    if (!order || Date.now() < order.returnsAt) return false;
    Game.addItem(order.outputId, order.qty);
    GameState.millOrder = null;
    if (typeof UI !== 'undefined') UI.notify('⚙️ ' + t('saeculum.millCollected'));
    if (typeof Game !== 'undefined' && Game.save) Game.save();
    this.switchEntity(GameState.ui.saeculumEntity || 'tavern');
    return true;
  },

  millRemainingH: function() {
    const o = GameState.millOrder;
    if (!o || Date.now() >= o.returnsAt) return 0;
    return Math.ceil((o.returnsAt - Date.now()) / (60 * 60 * 1000));
  },

  renderEntityTabs: function() {
    const entities = [
      { id: 'tavern', icon: '🍺', label: 'Hospoda', label_en: 'Tavern' },
      { id: 'shop',   icon: '🏪', label: 'Obchod',  label_en: 'Shop'   },
      { id: 'market', icon: '⛺', label: 'Trh',      label_en: 'Market' },
    ];
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!GameState.ui) GameState.ui = {};
    const active = GameState.ui.saeculumEntity || 'tavern';

    let h = `<div style="display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap;">`;
    entities.forEach(e => {
      const open   = CellariumSystem.isEntityOpen(e.id);
      const isCur  = e.id === active;
      const name   = lang === 'en' ? e.label_en : e.label;
      const hours  = lang === 'en' ? CellariumSystem.entityHoursLabel_en(e.id) : CellariumSystem.entityHoursLabel(e.id);
      const openDot = `<span style="color:${open ? '#5a9' : '#c55'}; font-size:0.55rem;">●</span>`;
      h += `
        <button onclick="SaeculumSystem.switchEntity('${e.id}')"
                class="filter-btn entity-tab-btn${isCur ? ' active' : ''}"
                style="flex: 1 1 calc(33% - 6px); min-width:0; position:relative; padding-bottom:6px;">
          <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
            ${e.icon} ${name} ${openDot}
          </div>
          <div style="font-size:0.6rem; opacity:0.6; margin-top:2px;">${hours}</div>
        </button>
      `;
    });
    h += `</div>`;

    h += CellariumSystem.renderEntityPanel(active);
    return h;
  },

  switchEntity: function(entityId) {
    if (!GameState.ui) GameState.ui = {};
    GameState.ui.saeculumEntity = entityId;
    const el = document.getElementById('saeculum-content');
    if (el) el.outerHTML = this.renderSaeculumContent();
    else this.renderSaeculumTab();
  },

};