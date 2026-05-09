// ═══════════════════════════════════════════════════════════════════════════════
// EASTER EGG SYSTEM v9.0 — Locked Secret Tabs
// Scrinium Abbatis (Forbidden Library) + Athanor Secretus (Secret Laboratory)
// ═══════════════════════════════════════════════════════════════════════════════

const SecretsSystem = {

  init: function() {
    if (!GameState.secrets) {
      GameState.secrets = {
        // Current unlock state
        forbiddenUnlocked: false,     // Scrinium Abbatis
        laboratoryUnlocked: false,    // Athanor Secretus

        // Dev access
        devPassword: 'exordium',

        // Future unlock conditions (prepared but not active)
        forbiddenBooksRead: 0,        // Read all 17 library books
        laboratoryClues: 0,           // Find 3 alchemical symbols
        inquisitionHeat: 0            // 0-100, raids at 80+
      };
    }

    // Stav folií Scrinia — inicializace pokud chybí
    if (!GameState.scrinium) {
      GameState.scrinium = {
        activeSubtab: 'tajne_spisy',  // výchozí subtab po otevření
        folios: {}                    // { folio_id: { found: bool, layer: 0-3 } }
      };
    }

    // Zajisti že každé folio v DB má svůj záznam v GameState
    if (typeof ScriniumDB !== 'undefined') {
      ScriniumDB.folios.forEach(function(folio) {
        if (!GameState.scrinium.folios[folio.id]) {
          GameState.scrinium.folios[folio.id] = { found: false, layer: 0 };
        }
      });
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UNLOCK CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  checkForbiddenUnlock: function() {
    if (!GameState.library || !GameState.secrets) return false;
    if (GameState.secrets.forbiddenUnlocked) return false;
    // Scrinium se otevře po přečtení 5 knih — realistická podmínka
    const THRESHOLD = 5;
    const readBooks = GameState.library.readBooks.length;
    if (readBooks >= THRESHOLD) {
      GameState.secrets.forbiddenUnlocked = true;
      // Inicializuj scrinium stav pokud ještě neexistuje
      if (!GameState.scrinium) {
        GameState.scrinium = { activeSubtab: 'tajne_spisy', folios: {} };
      }
      if (typeof ScriniumDB !== 'undefined') {
        ScriniumDB.folios.forEach(function(folio) {
          if (!GameState.scrinium.folios[folio.id]) {
            GameState.scrinium.folios[folio.id] = { found: false, layer: 0 };
          }
        });
      }
      Game.save();
      UI.notify('📕 Scrinium Abbatis apertum est! Opat ti otevřel svou soukromou knihovnu.');
      return true;
    }
    return false;
  },

  checkLaboratoryUnlock: function() {
    if (GameState.secrets.laboratoryClues >= 3 && !GameState.secrets.laboratoryUnlocked) {
      GameState.secrets.laboratoryUnlocked = true;
      Game.save();
      UI.notify('🔬 Athanor Secretus apertum est!');
      return true;
    }
    return false;
  },

  addLaboratoryClue: function() {
    GameState.secrets.laboratoryClues++;
    Game.save();
    UI.notify(`🔍 Symbolum alchemicum inventum! (${GameState.secrets.laboratoryClues}/3)`);
    this.checkLaboratoryUnlock();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLIO DISCOVERY — mapování knih na folia
  // Volá se z LibraryHelpers.readBook() po každém přečtení knihy
  // ═══════════════════════════════════════════════════════════════════════════

  _folioDiscoveryMap: {
    'book_gutenberg_betrayal': 'folio_epistola',
    'book_de_arte_predicandi': 'folio_fausto',
    'book_scribes_war':        'folio_titivillus',
    'book_prague_mystery':     'folio_palimpsest',
  },

  checkFolioDiscovery: function(bookId) {
    if (!GameState.secrets || !GameState.secrets.forbiddenUnlocked) return;
    if (!GameState.scrinium) return;

    const folioId = this._folioDiscoveryMap[bookId];
    if (!folioId) return;

    const state = GameState.scrinium.folios[folioId];
    if (!state || state.found) return;

    GameState.scrinium.folios[folioId].found = true;
    Game.save();

    const folio = (typeof ScriniumDB !== 'undefined')
      ? ScriniumDB.folios.find(function(f) { return f.id === folioId; })
      : null;
    const folioTitle = folio ? t(folio.titleKey) : folioId;
    UI.notify('📜 Nalezen zápisek ve Scrinium Abbatis: ' + folioTitle);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEV TOOLS
  // ═══════════════════════════════════════════════════════════════════════════

  promptDevPassword: function() {
    const pw = prompt('🔓 Password (dev only):');
    if (!pw) return;
    if (pw === GameState.secrets.devPassword) {
      GameState.secrets.forbiddenUnlocked = true;
      GameState.secrets.laboratoryUnlocked = true;
      // Dev: odemkni všechna folia Tajných spisů pro testování
      if (typeof ScriniumDB !== 'undefined') {
        ScriniumDB.folios.forEach(function(folio) {
          if (folio.subtab === 'tajne_spisy') {
            GameState.scrinium.folios[folio.id] = { found: true, layer: 0 };
          }
        });
      }
      Game.save();
      UI.notify('🔓 Omnes ianuae apertae sunt! (All doors opened)');
      setTimeout(() => location.reload(), 1000);
    } else {
      UI.notify('❌ Password incorrectum!', true);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCRINIUM — HLAVNÍ RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  renderScriniumTab: function() {
    const activeSubtab = GameState.scrinium.activeSubtab || 'tajne_spisy';

    // ── Subtab navigace ───────────────────────────────────────────────────
    let subtabNav = '<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:20px;">';
    Object.values(ScriniumDB.subtabs).forEach(function(st) {
      const isActive = st.id === activeSubtab;
      const bg = isActive
        ? 'background:var(--accent-warm,#8a3324); color:#fff;'
        : 'background:rgba(0,0,0,0.05); color:var(--ink-primary);';
      subtabNav += `<button onclick="SecretsSystem.switchSubtab('${st.id}')"
        style="${bg} border:none; border-radius:4px; padding:6px 14px; cursor:pointer;
               font-family:'Crimson Text'; font-size:0.95rem;">
        ${t(st.labelKey)}
      </button>`;
    });
    subtabNav += '</div>';

    // ── Obsah aktivního subtabu ───────────────────────────────────────────
    const content = this.renderSubtabContent(activeSubtab);

    return `
      <div id="scrinium-tab" style="padding:24px 20px;">
        <h2 style="margin-bottom:4px; font-size:1.4rem;">📕 ${t('scrinium.title')}</h2>
        <p style="font-style:italic; opacity:0.7; margin-bottom:20px; font-size:0.9rem;">
          ${t('scrinium.subtitle')}
        </p>
        ${subtabNav}
        <div id="scrinium-subtab-content">
          ${content}
        </div>
      </div>`;
  },

  switchSubtab: function(subtabId) {
    GameState.scrinium.activeSubtab = subtabId;
    const el = document.getElementById('scrinium-subtab-content');
    if (el) el.innerHTML = this.renderSubtabContent(subtabId);
    // Aktualizuj tlačítka
    const tab = document.getElementById('scrinium-tab');
    if (tab) {
      tab.querySelectorAll('button[onclick^="SecretsSystem.switchSubtab"]').forEach(function(btn) {
        const id = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        const isActive = id === subtabId;
        btn.style.background = isActive ? 'var(--accent-warm,#8a3324)' : 'rgba(0,0,0,0.05)';
        btn.style.color = isActive ? '#fff' : 'var(--ink-primary)';
      });
    }
  },

  renderSubtabContent: function(subtabId) {
    // Folia tohoto subtabu
    const foliosInTab = ScriniumDB.folios.filter(function(f) {
      return f.subtab === subtabId;
    });

    if (foliosInTab.length === 0) {
      return `<div style="padding:40px; text-align:center; opacity:0.5;">
        <p style="font-style:italic;">In constructione...</p>
      </div>`;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
    const self = this;
    foliosInTab.forEach(function(folio) {
      html += self.renderFolioCard(folio);
    });
    html += '</div>';
    return html;
  },

  // ── Karta folia (přehled) ─────────────────────────────────────────────────
  renderFolioCard: function(folio) {
    const state = GameState.scrinium.folios[folio.id] || { found: false, layer: 0 };
    const title = t(folio.titleKey);
    const formKey = 'scrinium.folio.physical_' + folio.physicalForm;
    const formLabel = t(formKey);

    // Barva podle stavu
    let statusBadge = '';
    let cardOpacity = '1';
    if (!state.found) {
      cardOpacity = '0.45';
      statusBadge = `<span style="font-size:0.75rem; background:rgba(0,0,0,0.08);
        padding:2px 8px; border-radius:3px;">${t('scrinium.folio.not_found')}</span>`;
    } else if (state.layer === 0) {
      statusBadge = `<span style="font-size:0.75rem; background:rgba(138,51,36,0.12);
        color:var(--accent-warm,#8a3324); padding:2px 8px; border-radius:3px;">
        ${t('scrinium.folio.found')}</span>`;
    } else if (state.layer === 3) {
      statusBadge = `<span style="font-size:0.75rem; background:rgba(60,120,60,0.15);
        color:#2a6a2a; padding:2px 8px; border-radius:3px;">
        ✓ ${t('scrinium.folio.layer_arcanum')}</span>`;
    } else {
      const layerNames = ['', t('scrinium.folio.layer_lectio'),
                              t('scrinium.folio.layer_glossa'),
                              t('scrinium.folio.layer_arcanum')];
      statusBadge = `<span style="font-size:0.75rem; background:rgba(80,80,160,0.12);
        color:#444; padding:2px 8px; border-radius:3px;">
        ${layerNames[state.layer]}</span>`;
    }

    const clickable = state.found
      ? `onclick="SecretsSystem.openFolio('${folio.id}')" style="cursor:pointer;"`
      : '';

    return `
      <div ${clickable} style="opacity:${cardOpacity}; padding:14px 16px;
        background:rgba(0,0,0,0.03); border-radius:6px;
        border:1px solid rgba(0,0,0,0.1);
        transition:background 0.15s;"
        onmouseover="if(${state.found}) this.style.background='rgba(0,0,0,0.07)'"
        onmouseout="this.style.background='rgba(0,0,0,0.03)'">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.5rem;">${folio.icon}</span>
          <div style="flex:1;">
            <div style="font-weight:600; font-size:1rem;">${title}</div>
            <div style="font-size:0.8rem; opacity:0.6; margin-top:2px;">${formLabel}</div>
          </div>
          ${statusBadge}
        </div>
      </div>`;
  },

  // ── Detail folia (čtení vrstev) ───────────────────────────────────────────
  openFolio: function(folioId) {
    const folio = ScriniumDB.folios.find(function(f) { return f.id === folioId; });
    if (!folio) return;
    const state = GameState.scrinium.folios[folioId];
    if (!state || !state.found) return;

    const el = document.getElementById('scrinium-subtab-content');
    if (!el) return;
    el.innerHTML = this.renderFolioDetail(folio, state);
  },

  renderFolioDetail: function(folio, state) {
    const title = t(folio.titleKey);
    const layers = ['lectio', 'glossa', 'arcanum'];
    const layerLabels = [
      t('scrinium.folio.layer_lectio'),
      t('scrinium.folio.layer_glossa'),
      t('scrinium.folio.layer_arcanum')
    ];

    // ── Zpět tlačítko ─────────────────────────────────────────────────────
    let html = `
      <button onclick="SecretsSystem.switchSubtab('${folio.subtab}')"
        style="margin-bottom:16px; background:none; border:1px solid rgba(0,0,0,0.2);
               border-radius:4px; padding:5px 12px; cursor:pointer;
               font-family:'Crimson Text'; font-size:0.9rem;">
        ← ${t('scrinium.subtabs.' + folio.subtab)}
      </button>
      <div style="max-width:680px;">
        <h3 style="font-size:1.2rem; margin-bottom:4px;">${folio.icon} ${title}</h3>
        <p style="font-size:0.8rem; opacity:0.55; margin-bottom:20px;">
          ${t('scrinium.folio.physical_' + folio.physicalForm)}
        </p>`;

    // ── Zobrazené vrstvy (ty co jsou přečtené) ────────────────────────────
    for (let i = 0; i < state.layer; i++) {
      const layerKey = layers[i];
      const text = t(folio[layerKey].textKey);
      html += `
        <div style="margin-bottom:20px; padding:16px;
          background:rgba(0,0,0,0.03); border-radius:6px;
          border-left:3px solid rgba(138,51,36,0.3);">
          <div style="font-size:0.75rem; font-weight:600; opacity:0.5;
            text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
            ${layerLabels[i]}
          </div>
          <div style="font-style:italic; line-height:1.7; white-space:pre-line;">
            ${text}
          </div>
        </div>`;
    }

    // ── Akce: další vrstva nebo hotovo ────────────────────────────────────
    if (state.layer < 3) {
      const nextLayerKey = layers[state.layer];
      const nextLayer = folio[nextLayerKey];
      const nextLabel = layerLabels[state.layer];

      let costHtml = '';
      if (nextLayer.cost) {
        const itemName = (typeof iName === 'function') ? iName(nextLayer.cost.item) : nextLayer.cost.item;
        costHtml = `<span style="font-size:0.8rem; opacity:0.7; margin-right:12px;">
          ${t('scrinium.folio.cost_label')} ${nextLayer.cost.amount}× ${itemName}
        </span>`;
      }

      let btnLabel = '';
      if (state.layer === 0) btnLabel = t('scrinium.folio.btn_lectio');
      else if (state.layer === 1) btnLabel = t('scrinium.folio.btn_glossa');
      else btnLabel = t('scrinium.folio.btn_arcanum');

      html += `
        <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
          ${costHtml}
          <button onclick="SecretsSystem.advanceFolioLayer('${folio.id}')"
            style="background:var(--accent-warm,#8a3324); color:#fff; border:none;
                   border-radius:4px; padding:8px 18px; cursor:pointer;
                   font-family:'Crimson Text'; font-size:1rem;">
            ${btnLabel}
          </button>
        </div>`;
    } else {
      html += `
        <div style="margin-top:8px; font-size:0.85rem; opacity:0.6; font-style:italic;">
          ${t('scrinium.folio.btn_done')}
        </div>`;
    }

    html += '</div>';
    return html;
  },

  // ── Postup na další vrstvu překladu ──────────────────────────────────────
  advanceFolioLayer: function(folioId) {
    const folio = ScriniumDB.folios.find(function(f) { return f.id === folioId; });
    if (!folio) return;
    const state = GameState.scrinium.folios[folioId];
    if (!state || !state.found || state.layer >= 3) return;

    const layers = ['lectio', 'glossa', 'arcanum'];
    const currentLayer = folio[layers[state.layer]];

    // Zkontroluj cenu
    if (currentLayer.cost) {
      const has = (GameState.inventory[currentLayer.cost.item] || 0);
      if (has < currentLayer.cost.amount) {
        UI.notify(t('scrinium.folio.err_no_item'), true);
        return;
      }
      // Strhni suroviny
      GameState.inventory[currentLayer.cost.item] =
        (GameState.inventory[currentLayer.cost.item] || 0) - currentLayer.cost.amount;
    }

    // Posun na další vrstvu
    state.layer++;
    Game.save();

    // Odměna za Arcanum (layer 3)
    if (state.layer === 3 && currentLayer.reward) {
      this.applyFolioReward(folio, currentLayer.reward);
    }

    // Překresli detail
    const el = document.getElementById('scrinium-subtab-content');
    if (el) el.innerHTML = this.renderFolioDetail(folio, state);
  },

  // ── Aplikace odměny za Arcanum ────────────────────────────────────────────
  applyFolioReward: function(folio, reward) {
    if (reward.type === 'unlock_athanor') {
      GameState.secrets.laboratoryUnlocked = true;
      Game.save();
      this.showAthanorModal();
    } else if (reward.type === 'ui_flag') {
      if (!GameState.flags) GameState.flags = {};
      GameState.flags[reward.flag] = true;
      Game.save();
      UI.notify(t(reward.notifyKey));
    } else if (reward.type === 'recipe_unlock') {
      if (!GameState.unlockedRecipes) GameState.unlockedRecipes = [];
      if (!GameState.unlockedRecipes.includes(reward.recipeId)) {
        GameState.unlockedRecipes.push(reward.recipeId);
      }
      Game.save();
      UI.notify(t(reward.notifyKey));
    } else if (reward.type === 'choice') {
      // Faustova smlouva — modální volba
      this.showFaustChoice(folio);
    }
  },

  // ── Athanor discovery modal ───────────────────────────────────────────────
  showAthanorModal: function() {
    const existing = document.getElementById('athanor-discovery-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'athanor-discovery-modal';
    modal.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.75);
      display:flex; align-items:center; justify-content:center;
      z-index:9999; font-family:'Crimson Text', serif;`;

    modal.innerHTML = `
      <div style="
        background:var(--bg-card, #f5f0e8);
        border-radius:10px;
        padding:40px 36px 32px;
        max-width:420px;
        width:90%;
        text-align:center;
        box-shadow:0 8px 40px rgba(0,0,0,0.5);
        border:1px solid rgba(138,51,36,0.2);">

        <!-- SVG: Alchymistická křivule (alembic) -->
        <svg viewBox="0 0 120 160" width="100" height="133"
             xmlns="http://www.w3.org/2000/svg" style="margin-bottom:20px; opacity:0.85;">
          <!-- Tělo baňky -->
          <ellipse cx="60" cy="110" rx="42" ry="38"
            fill="rgba(138,51,36,0.08)" stroke="#8a3324" stroke-width="2"/>
          <!-- Hrdlo -->
          <rect x="50" y="68" width="20" height="28"
            fill="rgba(138,51,36,0.06)" stroke="#8a3324" stroke-width="2" rx="2"/>
          <!-- Hubice (nos) -->
          <path d="M70 75 Q95 65 105 50"
            fill="none" stroke="#8a3324" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Kapka na konci hubice -->
          <circle cx="106" cy="49" r="3.5" fill="#8a3324" opacity="0.7"/>
          <!-- Víčko / zátkový uzávěr -->
          <ellipse cx="60" cy="67" rx="13" ry="5"
            fill="rgba(138,51,36,0.2)" stroke="#8a3324" stroke-width="1.5"/>
          <!-- Páry / bubliny uvnitř baňky -->
          <circle cx="48" cy="105" r="4" fill="none" stroke="#8a3324"
            stroke-width="1" opacity="0.4"/>
          <circle cx="65" cy="118" r="6" fill="none" stroke="#8a3324"
            stroke-width="1" opacity="0.3"/>
          <circle cx="75" cy="100" r="3" fill="none" stroke="#8a3324"
            stroke-width="1" opacity="0.35"/>
          <!-- Plamen pod baňkou -->
          <path d="M42 150 Q50 130 60 148 Q70 130 78 150"
            fill="rgba(200,80,0,0.25)" stroke="rgba(200,80,0,0.6)"
            stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M50 150 Q56 138 60 150 Q64 138 70 150"
            fill="rgba(240,120,0,0.35)" stroke="none"/>
        </svg>

        <!-- Nadpis -->
        <div style="
          font-size:0.7rem; letter-spacing:0.15em; text-transform:uppercase;
          opacity:0.45; margin-bottom:8px;">
          Athanor Secretus
        </div>
        <h2 style="font-size:1.5rem; margin-bottom:16px; color:var(--ink-primary,#2c1810);">
          🔥 Ignis perpetuus ardet
        </h2>

        <!-- Hint -->
        <p style="
          font-style:italic; line-height:1.7; opacity:0.8;
          margin-bottom:8px; font-size:1.05rem;">
          „Věčný oheň hoří."
        </p>
        <p style="
          line-height:1.6; font-size:0.95rem; opacity:0.7;
          margin-bottom:28px;">
          V Pracovně jsou zamčené dveře,<br>
          které jsi dosud nemohl otevřít.<br>
          <strong>Nyní znáš slovo. Nyní vejdeš.</strong>
        </p>

        <!-- Tlačítko -->
        <button onclick="document.getElementById('athanor-discovery-modal').remove()"
          style="
            background:var(--accent-warm,#8a3324); color:#fff;
            border:none; border-radius:5px;
            padding:10px 28px; cursor:pointer;
            font-family:'Crimson Text'; font-size:1.05rem;
            letter-spacing:0.03em;">
          Deo gratias
        </button>
      </div>`;

    document.body.appendChild(modal);

    // Zavřít kliknutím na pozadí
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });
  },

  // ── Faustova volba (modal) ────────────────────────────────────────────────
  showFaustChoice: function(folio) {
    const cs = t('scrinium.folios.fausto.choice_prompt');
    const signLabel = t('scrinium.folios.fausto.choice_sign');
    const refuseLabel = t('scrinium.folios.fausto.choice_refuse');

    const modal = document.createElement('div');
    modal.id = 'faust-choice-modal';
    modal.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.6);
      display:flex; align-items:center; justify-content:center; z-index:9999;`;
    modal.innerHTML = `
      <div style="background:var(--bg-card,#f5f0e8); border-radius:8px;
        padding:32px; max-width:400px; text-align:center; font-family:'Crimson Text';">
        <div style="font-size:2rem; margin-bottom:12px;">😈</div>
        <p style="font-style:italic; line-height:1.6; margin-bottom:24px;">${cs}</p>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button onclick="SecretsSystem.resolveFaust(true)"
            style="background:rgba(138,51,36,0.85); color:#fff; border:none;
                   border-radius:4px; padding:10px 20px; cursor:pointer;
                   font-family:'Crimson Text'; font-size:1rem;">
            ${signLabel}
          </button>
          <button onclick="SecretsSystem.resolveFaust(false)"
            style="background:rgba(0,0,0,0.08); border:none; border-radius:4px;
                   padding:10px 20px; cursor:pointer;
                   font-family:'Crimson Text'; font-size:1rem;">
            ${refuseLabel}
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  },

  resolveFaust: function(signed) {
    const modal = document.getElementById('faust-choice-modal');
    if (modal) modal.remove();

    if (signed) {
      // Bonus: +50 research, ale za 5 herních dní přijde debuff event
      if (GameState.resources) {
        GameState.resources.research = (GameState.resources.research || 0) + 50;
      }
      if (!GameState.flags) GameState.flags = {};
      GameState.flags.faust_signed = true;
      UI.notify(t('scrinium.folios.fausto.signed_notify'));
    } else {
      // Achievement
      if (typeof AchievementsDB !== 'undefined' && typeof Game.unlockAchievement === 'function') {
        Game.unlockAchievement('faust_refused');
      }
      UI.notify(t('scrinium.folios.fausto.refused_notify'));
    }
    Game.save();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCRINIUM SCREEN — vstupní bod z ui.js
  // ═══════════════════════════════════════════════════════════════════════════

  renderScriniumScreen: function(elementId) {
    const el = document.getElementById(elementId || 'scrinium-content');
    if (!el) return;

    if (GameState.secrets && GameState.secrets.forbiddenUnlocked) {
      el.innerHTML = this.renderScriniumTab();
      return;
    }

    el.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h2 style="margin-bottom: 10px;">📕 Scrinium Abbatis</h2>
        <p style="font-style: italic; opacity: 0.7; margin-bottom: 30px;">(Abbot's Private Library)</p>
        <div style="max-width: 400px; margin: 0 auto; padding: 40px; background: rgba(0,0,0,0.03); border-radius: 10px; border: 2px dashed rgba(0,0,0,0.2);">
          <div style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;">🔒</div>
          <p style="font-style: italic; line-height: 1.6; margin-bottom: 25px;">
            "Nondum tempus tuum venit, frater."<br>
            <span style="font-size: 0.85rem; opacity: 0.7;">Thy time hath not yet come, brother.</span>
          </p>
          <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px;">${t('scrinium.locked_hint')}</p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <input type="password" id="scrinium-pw" placeholder="Heslo..."
                   style="padding: 8px 12px; border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; font-family: 'Crimson Text'; font-size: 1rem; background: var(--bg-card); color: var(--ink-primary);"
                   onkeydown="if(event.key==='Enter') SecretsSystem.tryPassword('scrinium', '${elementId || 'scrinium-content'}')">
            <button onclick="SecretsSystem.tryPassword('scrinium', '${elementId || 'scrinium-content'}')" class="craft-btn">🔓</button>
          </div>
        </div>
      </div>`;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ATHANOR SCREEN — beze změny
  // ═══════════════════════════════════════════════════════════════════════════

  renderAthanorTab: function() {
    let h = '<div id="athanor-tab" style="padding: 40px; text-align: center;">';
    h += '<h2 style="margin-bottom: 20px;">🔬 Athanor Secretus</h2>';
    h += '<p style="font-style: italic; opacity: 0.8; margin-bottom: 30px;">(Secret Furnace / Laboratory)</p>';
    h += '<div style="max-width: 500px; margin: 0 auto; padding: 50px; background: rgba(0,0,0,0.03); border-radius: 10px; border: 2px dashed rgba(0,0,0,0.2);">';
    h += '<div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🧪</div>';
    h += '<p style="font-style: italic; line-height: 1.6; margin-bottom: 20px;">';
    h += '"Ignis perpetuus ardet, transmutatio incipit..."<br>';
    h += '<span style="font-size: 0.85rem; opacity: 0.7;">(The eternal fire burns, transmutation begins...)</span>';
    h += '</p>';
    h += '<div style="margin-top: 30px; padding: 15px; background: rgba(138,51,36,0.1); border-radius: 5px;">';
    h += '<p style="font-size: 0.85rem; margin: 0;">🚧 <strong>In constructione</strong></p>';
    h += '<p style="font-size: 0.75rem; opacity: 0.7; margin-top: 5px;">Under construction</p>';
    h += '</div>';
    h += '</div>';
    h += '</div>';
    return h;
  },

  renderAthanorScreen: function(elementId) {
    const el = document.getElementById(elementId || 'home-athanor-content');
    if (!el) return;
    if (GameState.secrets && GameState.secrets.laboratoryUnlocked) {
      el.innerHTML = this.renderAthanorTab();
      return;
    }
    el.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h2 style="margin-bottom: 10px;">🔬 Athanor Secretus</h2>
        <p style="font-style: italic; opacity: 0.7; margin-bottom: 30px;">(Secret Laboratory)</p>
        <div style="max-width: 400px; margin: 0 auto; padding: 40px; background: rgba(0,0,0,0.03); border-radius: 10px; border: 2px dashed rgba(0,0,0,0.2);">
          <div style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;">🧪</div>
          <p style="font-style: italic; line-height: 1.6; margin-bottom: 25px;">
            "Ignis latet in cinere, frater."<br>
            <span style="font-size: 0.85rem; opacity: 0.7;">Fire hides in the ashes, brother.</span>
          </p>
          <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px;">Tato laboratoř se odemkne v příští fázi hry.</p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <input type="password" id="athanor-pw" placeholder="Heslo..."
                   style="padding: 8px 12px; border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; font-family: 'Crimson Text'; font-size: 1rem; background: var(--bg-card); color: var(--ink-primary);"
                   onkeydown="if(event.key==='Enter') SecretsSystem.tryPassword('athanor', '${elementId || 'home-athanor-content'}')">
            <button onclick="SecretsSystem.tryPassword('athanor', '${elementId || 'home-athanor-content'}')" class="craft-btn">🔓</button>
          </div>
        </div>
      </div>`;
  },

  tryPassword: function(type, elementId) {
    const inputId = type === 'scrinium' ? 'scrinium-pw' : 'athanor-pw';
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.value === (GameState.secrets.devPassword || 'exordium')) {
      GameState.secrets.forbiddenUnlocked = true;
      GameState.secrets.laboratoryUnlocked = true;
      // Dev: odemkni Tajné spisy pro testování
      if (typeof ScriniumDB !== 'undefined') {
        ScriniumDB.folios.forEach(function(folio) {
          if (folio.subtab === 'tajne_spisy') {
            GameState.scrinium.folios[folio.id] = { found: true, layer: 0 };
          }
        });
      }
      Game.save();
      if (typeof UI !== 'undefined') UI.notify('🔓 Omnes ianuae apertae sunt!');
      if (type === 'scrinium') this.renderScriniumScreen(elementId);
      else this.renderAthanorScreen(elementId);
    } else {
      if (typeof UI !== 'undefined') UI.notify('❌ Heslo není správné.', true);
      input.value = '';
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEV BUTTON (Hidden in Settings)
  // ═══════════════════════════════════════════════════════════════════════════

  renderDevButton: function() {
    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.1);">
        <button onclick="SecretsSystem.promptDevPassword()"
                style="opacity: 0.3; font-size: 0.7rem; padding: 5px 10px; background: none; border: 1px solid rgba(0,0,0,0.2); cursor: pointer;">
          🔓 Secretum
        </button>
      </div>`;
  }

};