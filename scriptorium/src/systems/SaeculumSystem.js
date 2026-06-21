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
      h += this.renderEntityTabs();
    }

    h += `</div>`;
    return h;
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
                class="filter-btn${isCur ? ' active' : ''}"
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
