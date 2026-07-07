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

  // ── CONVERSI — holý skelet (jméno + slot, bez úkolů zatím) ──────────────
  // Detail konvrše — sheet přes existující NotificationSystem.modal (žádná nová infrastruktura)
  showConversiDetail: function(id) {
    if (typeof NotificationSystem === 'undefined') return;
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const k = (GameState.conversi || []).find(x => x.id === id);
    if (!k) return;
    const rec = (k.rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[k.rosterId] : null;
    const icon = (rec && rec.icon) ? rec.icon : '✝️';
    const origin = rec ? (lang === 'en' ? rec.origin_en : rec.origin_cs) : '';
    const mood = (typeof k.mood === 'number') ? k.mood : 60;
    const loyalty = (typeof k.loyalty === 'number') ? k.loyalty : 30;
    const fat = (typeof k.fatigue === 'number') ? k.fatigue : 0;

    const bar = (label, val, color) => `
      <div style="margin-bottom:7px;">
        <div style="display:flex; justify-content:space-between; font-size:0.72rem; opacity:0.75; margin-bottom:2px;">
          <span>${label}</span><span>${val}%</span>
        </div>
        <div style="background:rgba(0,0,0,0.12); border-radius:3px; height:5px;">
          <div style="width:${val}%; background:${color}; height:5px; border-radius:3px;"></div>
        </div>
      </div>`;
    const moodColor = mood >= 65 ? '#5a9a5a' : mood >= 40 ? '#e67e22' : '#c0392b';
    const loyColor  = loyalty >= 70 ? '#5a9a5a' : loyalty >= 40 ? '#e67e22' : '#c0392b';
    const fatColor  = fat <= 40 ? '#5a9a5a' : fat <= 70 ? '#e67e22' : '#c0392b';

    let html = '';
    if (origin) html += `<div style="font-style:italic; font-size:0.8rem; opacity:0.8; margin-bottom:10px; line-height:1.4;">${origin}</div>`;
    html += bar((lang==='en'?'😊 Mood':'😊 Nálada'), mood, moodColor);
    html += bar((lang==='en'?'🤝 Loyalty':'🤝 Věrnost'), loyalty, loyColor);
    html += bar((lang==='en'?'😴 Fatigue':'😴 Únava'), fat, fatColor);

    // Kontrakt
    const owed = (typeof k.wageOwed === 'number') ? k.wageOwed : 0;
    const nextW = GameState.conversiNextWage ? Math.max(0, Math.ceil((GameState.conversiNextWage - Date.now()) / (24*60*60*1000))) : null;
    html += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:10px 0 4px;">${lang==='en'?'Contract':'Kontrakt'}</div>`;
    html += `<div style="font-size:0.76rem; margin-bottom:3px;">💰 ${lang==='en'?'Wage: 2 groats/week':'Mzda: 2 groše/týden'}${nextW !== null ? (lang==='en' ? ' · payday in '+nextW+'d' : ' · výplata za '+nextW+' d') : ''}</div>`;
    if (owed > 0) html += `<div style="font-size:0.76rem; margin-bottom:3px; color:#c0392b;">💸 ${lang==='en'?'Owed':'Dluh'}: ${owed} g</div>`;
    if (k.penanceUntil && k.penanceUntil > Date.now()) {
        const pd = Math.ceil((k.penanceUntil - Date.now()) / (24*60*60*1000));
        html += `<div style="font-size:0.76rem; margin-bottom:3px;">⚖️ ${lang==='en' ? 'Penance: '+pd+' day(s) remaining — does not work' : 'Pokání: zbývá '+pd+' d — nepracuje'}</div>`;
    }

    if (rec && rec.traits && rec.traits.length && typeof ConversiTraitsDB !== 'undefined') {
      html += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:10px 0 4px;">${lang==='en'?'Traits':'Vlastnosti'}</div>`;
      rec.traits.forEach(tid => {
        const td = ConversiTraitsDB[tid];
        if (!td) return;
        html += `<div style="font-size:0.76rem; margin-bottom:3px;">${td.icon} <strong>${lang==='en'?td.name_en:td.name}</strong> — ${lang==='en'?td.desc_en:td.desc}</div>`;
      });
    }

    if (k.rosterId && typeof ConversiBondsDB !== 'undefined') {
      const hiredIds = GameState.conversi.map(x => x.rosterId).filter(Boolean);
      const bonds = ConversiBondsDB.filter(bd => bd.a === k.rosterId || bd.b === k.rosterId);
      if (bonds.length) {
        html += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:10px 0 4px;">${lang==='en'?'Bonds':'Vazby'}</div>`;
        bonds.forEach(bd => {
          const otherId = (bd.a === k.rosterId) ? bd.b : bd.a;
          const otherRec = ConversiRosterDB[otherId];
          const otherName = otherRec ? otherRec.name : '?';
          const inCrew = hiredIds.includes(otherId);
          const mark = bd.type === 'affinity' ? '🟢' : '🔴';
          const here = inCrew ? (lang==='en'?'✓ in the monastery':'✓ v klášteře') : (lang==='en'?'✗ not here':'✗ není zde');
          html += `<div style="font-size:0.76rem; margin-bottom:5px; line-height:1.35;">${mark} <strong>${otherName}</strong> <span style="opacity:0.6; font-size:0.68rem;">(${here})</span><br><span style="opacity:0.75;">${lang==='en'?bd.desc_en:bd.desc_cs}</span></div>`;
        });
      }
    }

    NotificationSystem.modal({
      icon: icon,
      title: k.name,
      text: html,
      choices: [{ label: (lang==='en'?'Close':'Zavřít') }]
    });
  },

  renderConversi: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!GameState.ui) GameState.ui = {};
    const conversiOpen = GameState.ui.saeculumConversiOpen !== false;
    const cap = (typeof Game !== 'undefined' && Game.conversiCapacity) ? Game.conversiCapacity() : 0;
    const list = GameState.conversi || [];

    let h = `<details ${conversiOpen ? 'open' : ''} ontoggle="GameState.ui.saeculumConversiOpen = this.open; Game.save();" style="margin-bottom:16px; background:rgba(0,0,0,0.03);
                         border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<summary style="cursor:pointer; padding:10px 14px; font-size:0.92rem; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px;">
            <span>✝️ ${lang==='en'?'Conversi':'Conversi'}</span><span style="opacity:0.5; font-weight:normal;">▾</span>
          </summary>`;
    h += `<div style="padding:10px 14px 14px;">`;

    if (cap === 0) {
      h += `<div style="font-size:0.8rem; opacity:0.6; font-style:italic;">${lang==='en'?'No dormitory built yet — see Old Cellars in the Cellarium.':'Zatím žádný dormitář — viz Staré sklepy v Cellariu.'}</div>`;
    } else {
      h += `<div style="font-size:0.85rem; margin-bottom:8px;">${lang==='en'?'Beds':'Lůžka'}: <strong>${list.length} / ${cap}</strong></div>`;
      if (list.length && GameState.conversiNextWage) {
        const daysToWage = Math.max(0, Math.ceil((GameState.conversiNextWage - Date.now()) / (24*60*60*1000)));
        h += `<div style="font-size:0.72rem; opacity:0.65; margin-bottom:8px;">💰 ${lang==='en' ? 'Wage: 2 g/brother · payday in '+daysToWage+'d' : 'Mzda: 2 g/konvrš · výplata za '+daysToWage+' d'}</div>`;
      }
      const atOfficium = (typeof Game !== 'undefined' && Game.isOfficiumHours) ? Game.isOfficiumHours() : false;
      const allTired = list.length > 0 && list.every(k => (typeof k.fatigue === 'number' ? k.fatigue : 0) >= 80);
      if (list.length && atOfficium) {
        h += `<div style="font-size:0.75rem; opacity:0.7; font-style:italic; margin-bottom:8px;">🕯️ ${lang==='en'?'At Officium (6:00–9:00) — unavailable for chores.':'Na Officiu (6:00–9:00) — nedostupní pro úkoly.'}</div>`;
      } else if (allTired) {
        h += `<div style="font-size:0.75rem; opacity:0.7; font-style:italic; margin-bottom:8px;">😴 ${lang==='en'?'All too tired for chores — let them rest.':'Všichni příliš unavení na úkoly — nechej je odpočinout.'}</div>`;
      }
      if (list.length) {
        h += `<div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">`;
        list.forEach(k => {
          const kf = (typeof k.fatigue === 'number') ? k.fatigue : 0;
          const kfColor = kf >= 80 ? '#c0392b' : kf >= 50 ? '#e67e22' : '#5a9a5a';
          const rec = (k.rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[k.rosterId] : null;
          const kIcon = (rec && rec.icon) ? rec.icon : '✝️';
          const kOrigin = rec ? (lang === 'en' ? rec.origin_en : rec.origin_cs) : '';
          let traitBadges = '';
          if (rec && rec.traits && typeof ConversiTraitsDB !== 'undefined') {
            traitBadges = rec.traits.map(tid => {
              const td = ConversiTraitsDB[tid];
              if (!td) return '';
              const tName = lang === 'en' ? td.name_en : td.name;
              const tDesc = lang === 'en' ? td.desc_en : td.desc;
              return `<span title="${tDesc}" style="font-size:0.66rem; background:rgba(197,160,89,0.18); border:1px solid rgba(197,160,89,0.35); border-radius:4px; padding:1px 5px; margin-left:6px; cursor:default;">${td.icon} ${tName}</span>`;
            }).join('');
          }
          h += `<div onclick="SaeculumSystem.showConversiDetail('${k.id}')" style="font-size:0.82rem; padding:6px 8px; background:rgba(255,255,255,0.4); border-radius:6px; cursor:pointer;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>${kIcon} ${k.name}${traitBadges}${(k.wageOwed > 0) ? `<span style="font-size:0.66rem; background:rgba(192,57,43,0.15); border:1px solid rgba(192,57,43,0.4); border-radius:4px; padding:1px 5px; margin-left:6px; color:#c0392b;">💸 ${k.wageOwed}g</span>` : ''}${(k.penanceUntil && k.penanceUntil > Date.now()) ? `<span style="font-size:0.66rem; background:rgba(80,80,140,0.12); border:1px solid rgba(80,80,140,0.35); border-radius:4px; padding:1px 5px; margin-left:6px;">⚖️ ${lang==='en'?'Penance':'Pokání'} ${Math.ceil((k.penanceUntil - Date.now())/(24*60*60*1000))}d</span>` : ''}</span>
                    <span style="font-size:0.68rem; opacity:0.7;">${(typeof k.mood === 'number') ? ((k.mood >= 65 ? '😊' : k.mood >= 40 ? '😐' : '😞') + ' ' + k.mood + '% · ') : ''}${lang==='en'?'Fatigue':'Únava'} ${kf}%</span>
                  </div>
                  <div style="background:rgba(0,0,0,0.1); border-radius:3px; height:4px; margin-top:4px;">
                    <div style="width:${kf}%; background:${kfColor}; height:4px; border-radius:3px;"></div>
                  </div>
                  ${kOrigin ? `<div style="font-size:0.68rem; opacity:0.6; margin-top:4px; font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${kOrigin}</div>` : ''}
                </div>`;
        });
        h += `</div>`;
      }
      if (list.length < cap) {
        h += `<button class="craft-btn" onclick="Game.hireKonvrs()">🤝 ${lang==='en'?'Hire a lay brother (10g)':'Najmout konvrše (10g)'}</button>`;
      } else {
        h += `<div style="font-size:0.75rem; opacity:0.6; font-style:italic;">${lang==='en'?'No free beds.':'Žádné volné lůžko.'}</div>`;
      }
    }
    h += `</div></details>`;
    return h;
  },

  renderEntityTabs: function() {
    const trade = ['tavern', 'shop', 'market'];
    const entities = [
      { id: 'tavern',   icon: '🍺', label: 'Hospoda',         label_en: 'Tavern' },
      { id: 'shop',     icon: '🏪', label: 'Obchod',          label_en: 'Shop'   },
      { id: 'market',   icon: '⛺', label: 'Trh',             label_en: 'Market' },
      { id: 'forum',    icon: '🐏', label: 'Forum Pecuarium', label_en: 'Forum Pecuarium' },
      { id: 'mola',     icon: '⚙️', label: 'Mola',            label_en: 'Mola' },
      { id: 'conversi', icon: '✝️', label: 'Conversi',        label_en: 'Conversi' },
      { id: 'regula',   icon: '🕯️', label: 'Regula',          label_en: 'Regula' },
    ];
    // Clientela: gated na secular antiquarius (tier 3) — pod tier 3 tab neexistuje
    const rankTier = (typeof RankSystem !== 'undefined' && RankSystem.getSecularRankTier) ? RankSystem.getSecularRankTier() : 1;
    if (rankTier >= 3 && typeof ContactsDB !== 'undefined') {
      entities.push({ id: 'clientela', icon: '🤝', label: 'Clientela', label_en: 'Clientela' });
    }
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!GameState.ui) GameState.ui = {};
    let active = GameState.ui.saeculumEntity || 'tavern';
    if (!entities.some(e => e.id === active)) active = 'tavern';

    let h = `<div style="display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap;">`;
    entities.forEach(e => {
      const isTrade = trade.includes(e.id);
      const isCur   = e.id === active;
      const name    = lang === 'en' ? e.label_en : e.label;
      let sub = '', dot = '';
      if (isTrade) {
        const open = CellariumSystem.isEntityOpen(e.id);
        dot = ` <span style="color:${open ? '#5a9' : '#c55'}; font-size:0.55rem;">●</span>`;
        sub = lang === 'en' ? CellariumSystem.entityHoursLabel_en(e.id) : CellariumSystem.entityHoursLabel(e.id);
      }
      h += `
        <button onclick="SaeculumSystem.switchEntity('${e.id}')"
                class="filter-btn entity-tab-btn${isCur ? ' active' : ''}"
                style="flex: 1 1 calc(25% - 6px); min-width:110px; position:relative; padding-bottom:6px;">
          <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
            ${e.icon} ${name}${dot}
          </div>
          ${sub ? `<div style="font-size:0.6rem; opacity:0.6; margin-top:2px;">${sub}</div>` : ''}
        </button>
      `;
    });
    h += `</div>`;

    if (trade.includes(active))      h += CellariumSystem.renderEntityPanel(active);
    else if (active === 'forum')     h += this.renderForumPecuarium();
    else if (active === 'mola')      h += this.renderMola();
    else if (active === 'conversi')  h += this.renderConversi();
    else if (active === 'regula')    h += this.renderRegula();
    else if (active === 'clientela') h += this.renderClientela();
    return h;
  },

  // Clientela — hub satelitních kontaktů (MRD 1.2b); K2 = zobrazení, relation/obchod = K3/K4
  // K3: vztah roste/klesá přes addContactRelation; růst se propaguje do osy (0.3×),
  // slabá ozvěna (0.2× z propagace) jen kde je v ContactsDB. Pokles se NEpropaguje.
  addContactRelation: function(id, amt) {
    if (typeof ContactsDB === 'undefined' || !ContactsDB[id] || !amt) return;
    if (!GameState.contactRelation) GameState.contactRelation = {};
    const cur = GameState.contactRelation[id] || 0;
    GameState.contactRelation[id] = Math.max(0, Math.min(100, cur + amt));
    if (amt > 0 && typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
      const c = ContactsDB[id];
      const primary = Math.max(1, Math.round(amt * 0.3));
      PersonaSystem.addInfluence(c.primaryAxis, primary);
      if (c.secondaryAxis) {
        const echo = Math.max(1, Math.round(primary * c.secondaryAxis.weight));
        PersonaSystem.addInfluence(c.secondaryAxis.axis, echo);
      }
    }
    Game.save();
  },

  // K4: prodej kontaktu — cena z calcPrice('market') × vztahový násobič (1.10 při 0 → 1.35 při 100).
  // Bez saturace a otevíracích hodin (osobní vztah, malé objemy). +1 vztah za prodejní AKCI (ne kus).
  contactPriceMult: function(contactId) {
    const r = Math.min(100, (GameState.contactRelation || {})[contactId] || 0);
    return 1.10 + (r / 100) * 0.25;
  },

  sellToContact: function(contactId, itemId, qty) {
    if (typeof ContactsDB === 'undefined' || typeof CellariumSystem === 'undefined') return;
    const c = ContactsDB[contactId];
    const items = c && c.sellBonus && c.sellBonus.items;
    if (!items || !(itemId in items)) return;
    const have = GameState.inventory[itemId] || 0;
    if (qty === 'all') qty = have;
    qty = Math.max(0, Math.min(have, qty | 0));
    if (qty <= 0) { UI.notify('⚠️ Non habes sufficiens!', true); return; }
    // Základ: BASE_PRICES přes calcPrice('market'); není-li item na trhu, kontaktní base cena (exkluzivní odbyt)
    const basePrice = CellariumSystem.calcPrice(itemId, 'market') || items[itemId];
    if (!basePrice) return;
    const price = Math.max(1, Math.round(basePrice * this.contactPriceMult(contactId)));
    const total = price * qty;
    Game.removeItem(itemId, qty);
    CellariumSystem.addGrose(total);
    CellariumSystem.recordTransaction('sell', itemId, qty, price, contactId);
    GameState.economy.tradesTotal++;
    this.addContactRelation(contactId, 1);
    Game.save();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
    const cName = lang === 'en' ? c.name_en : c.name;
    UI.notify('🤝 ' + itemName + ' ×' + qty + ' → ' + total + ' g · ' + cName);
    this.showContactDetail(contactId); // refresh modalu (replace, ne stack)
    this.switchEntity(GameState.ui.saeculumEntity || 'clientela'); // refresh hubu pod modalem
  },

  renderClientela: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const rel = GameState.contactRelation || {};
    const researched = GameState.researchedTechs || [];

    let h = `<div style="margin-bottom:16px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold); padding:12px 14px;">`;
    h += `<div style="font-weight:bold; font-size:0.92rem; margin-bottom:4px;">🤝 ${lang==='en'?'Clientela — contacts beyond the walls':'Clientela — kontakty za zdmi kláštera'}</div>`;
    h += `<div style="font-size:0.72rem; opacity:0.65; margin-bottom:12px;">${lang==='en'
        ? 'Craftsmen and traders of the region. Good relations open better prices than the market.'
        : 'Řemeslníci a obchodníci kraje. Dobré vztahy otevřou lepší ceny než trh.'}</div>`;

    h += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:8px;">`;
    Object.keys(ContactsDB).forEach(id => {
      const c = ContactsDB[id];
      const unlocked = !c.unlockTech || researched.includes(c.unlockTech);
      const r = Math.min(100, Math.round(rel[id] || 0));
      if (unlocked) {
        const rColor = r >= 75 ? '#5a9a5a' : r >= 40 ? 'var(--accent-gold)' : 'var(--ink-secondary)';
        h += `<div onclick="SaeculumSystem.showContactDetail('${id}')" style="padding:10px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.25); border-radius:8px; cursor:pointer;">
                <div style="font-size:1.5rem; margin-bottom:4px;">${c.icon}</div>
                <div style="font-weight:bold; font-size:0.8rem;">${lang==='en'?c.name_en:c.name}</div>
                <div style="display:flex; justify-content:space-between; font-size:0.62rem; opacity:0.6; margin:4px 0 2px;">
                  <span>${lang==='en'?'Relation':'Vztah'}</span><span>${r}/100</span>
                </div>
                <div style="background:rgba(0,0,0,0.1); border-radius:3px; height:4px;">
                  <div style="width:${r}%; background:${rColor}; height:4px; border-radius:3px;"></div>
                </div>
              </div>`;
      } else {
        h += `<div style="padding:10px; background:rgba(0,0,0,0.04); border:1px dashed rgba(197,160,89,0.25); border-radius:8px; opacity:0.5;">
                <div style="font-size:1.5rem; margin-bottom:4px; filter:grayscale(1);">🔒</div>
                <div style="font-weight:bold; font-size:0.8rem;">???</div>
                <div style="font-size:0.62rem; opacity:0.7; font-style:italic; margin-top:4px;">${lang==='en'?'Unlocks through research':'Odemkne se výzkumem'}</div>
              </div>`;
      }
    });
    h += `</div></div>`;
    return h;
  },

  showContactDetail: function(id) {
    if (typeof NotificationSystem === 'undefined' || typeof ContactsDB === 'undefined') return;
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const c = ContactsDB[id];
    if (!c) return;
    const r = Math.min(100, Math.round((GameState.contactRelation || {})[id] || 0));
    const rColor = r >= 75 ? '#5a9a5a' : r >= 40 ? 'var(--accent-gold)' : '#8a8a8a';
    const axisName = (a) => a === 'village' ? (lang==='en'?'Saeculum (village)':'Saeculum (vesnice)')
                    : a === 'church' ? (lang==='en'?'Ecclesia (church)':'Ecclesia (církev)')
                    : (lang==='en'?'Schola (scholars)':'Schola (učenci)');

    let html = `<div style="font-style:italic; font-size:0.8rem; opacity:0.8; margin-bottom:10px; line-height:1.4;">${lang==='en'?c.desc_en:c.desc}</div>`;
    html += `<div style="margin-bottom:7px;">
        <div style="display:flex; justify-content:space-between; font-size:0.72rem; opacity:0.75; margin-bottom:2px;">
          <span>🤝 ${lang==='en'?'Relation':'Vztah'}</span><span>${r}/100</span>
        </div>
        <div style="background:rgba(0,0,0,0.12); border-radius:3px; height:5px;">
          <div style="width:${r}%; background:${rColor}; height:5px; border-radius:3px;"></div>
        </div>
      </div>`;
    html += `<div style="font-size:0.76rem; margin-bottom:3px;">🏛️ ${lang==='en'?'Sphere':'Sféra'}: ${axisName(c.primaryAxis)}</div>`;
    if (c.secondaryAxis) html += `<div style="font-size:0.76rem; margin-bottom:3px; opacity:0.7;">↳ ${lang==='en'?'faint echo into':'slabá ozvěna do'} ${axisName(c.secondaryAxis.axis)}</div>`;

    // Výkup (K4) — jen pokud má kontakt sellBonus items
    const sbItems = c.sellBonus && c.sellBonus.items;
    if (sbItems && Object.keys(sbItems).length && typeof CellariumSystem !== 'undefined') {
      html += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:10px 0 4px;">💰 ${lang==='en'?'Buying from you':'Výkup'} <span style="opacity:0.6; font-weight:normal;">(+${Math.round((this.contactPriceMult(id)-1)*100)} % ${lang==='en'?'over market':'nad trh'})</span></div>`;
      let anyStock = false;
      Object.keys(sbItems).forEach(itemId => {
        const have = GameState.inventory[itemId] || 0;
        if (have <= 0) return;
        anyStock = true;
        const basePrice = CellariumSystem.calcPrice(itemId, 'market') || sbItems[itemId] || 0;
        const price = Math.max(1, Math.round(basePrice * this.contactPriceMult(id)));
        const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
        html += `<div style="display:flex; align-items:center; gap:6px; font-size:0.76rem; margin-bottom:5px;">
            <span style="flex:1;">${itemName} <span style="opacity:0.6;">(${lang==='en'?'have':'máš'} ${have} · ${price} g/${lang==='en'?'pc':'ks'})</span></span>
            <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" onclick="SaeculumSystem.sellToContact('${id}','${itemId}',1)">×1</button>
            <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" onclick="SaeculumSystem.sellToContact('${id}','${itemId}',5)">×5</button>
            <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" onclick="SaeculumSystem.sellToContact('${id}','${itemId}','all')">${lang==='en'?'all':'vše'}</button>
          </div>`;
      });
      if (!anyStock) html += `<div style="font-size:0.74rem; opacity:0.55; font-style:italic;">${lang==='en'?'You have nothing he would buy right now.':'Nemáš teď nic, co by vykoupil.'}</div>`;
    }

    html += `<div style="font-size:0.72rem; opacity:0.55; font-style:italic; margin-top:10px;">${lang==='en'
        ? 'Trade ties will form with time — deal with him and the relation will grow.'
        : 'Obchodní vazby se teprve utvoří — jednej s ním a vztah poroste.'}</div>`;

    NotificationSystem.modal({
      icon: c.icon,
      title: lang==='en' ? c.name_en : c.name,
      text: html,
      choices: [{ label: (lang==='en'?'Close':'Zavřít') }]
    });
  },

  // Regula — denní režim konvršů + refektář
  renderRegula: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const block = (typeof Game !== 'undefined' && Game.conversiDayBlock) ? Game.conversiDayBlock() : 'work';
    const list = GameState.conversi || [];

    const blocks = [
      { id: 'officium', icon: '🕯️', time: '6:00–9:00',   cs: 'Officium — ranní modlitba',   en: 'Officium — morning prayer' },
      { id: 'work',     icon: '⚒️', time: '9:00–12:00',  cs: 'Práce',                        en: 'Work' },
      { id: 'lunch',    icon: '🍲', time: '12:00–13:00', cs: 'Oběd v refektáři',             en: 'Refectory meal' },
      { id: 'work2',    icon: '⚒️', time: '13:00–18:00', cs: 'Práce',                        en: 'Work' },
      { id: 'vespers',  icon: '🙏', time: '18:00–19:00', cs: 'Nešpory',                      en: 'Vespers' },
      { id: 'work3',    icon: '⚒️', time: '19:00–22:00', cs: 'Práce',                        en: 'Work' },
      { id: 'night',    icon: '🌙', time: '22:00–5:00',  cs: 'Spánek',                       en: 'Sleep' },
    ];
    const isActive = (b) => (b.id === block) || (b.id.startsWith('work') && block === 'work');

    let h = `<div style="margin-bottom:16px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold); padding:12px 14px;">`;
    h += `<div style="font-weight:bold; font-size:0.92rem; margin-bottom:10px;">🕯️ ${lang==='en'?'Regula — the daily rule':'Regula — denní řád'}</div>`;

    if (!list.length) {
      h += `<div style="font-size:0.8rem; opacity:0.6; font-style:italic;">${lang==='en'?'No lay brothers yet — the rule awaits them.':'Zatím žádní konvrši — řád na ně čeká.'}</div>`;
      h += `</div>`;
      return h;
    }

    // Rozvrh dne
    blocks.forEach(b => {
      const cur = isActive(b);
      h += `<div style="display:flex; gap:10px; align-items:center; padding:4px 8px; border-radius:5px; font-size:0.8rem; ${cur ? 'background:rgba(197,160,89,0.15); font-weight:bold;' : 'opacity:0.65;'}">
              <span style="min-width:88px;">${b.time}</span>
              <span>${b.icon} ${lang==='en'?b.en:b.cs}</span>
              ${cur ? `<span style="margin-left:auto; font-size:0.68rem; opacity:0.8;">◀ ${lang==='en'?'now':'nyní'}</span>` : ''}
            </div>`;
    });

    // Refektář info
    h += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:12px 0 4px;">🍲 ${lang==='en'?'Refectory':'Refektář'}</div>`;
    h += `<div style="font-size:0.72rem; opacity:0.65; margin-bottom:6px;">${lang==='en'
        ? 'One portion of plain fare per brother per day. Feasts (pies, roasts) are never touched.'
        : 'Jedna porce prosté stravy na bratra denně. Sváteční jídlo (koláče, pečeně) refektář nebere.'}</div>`;
    const log = GameState.conversiMealLog;
    if (log) {
      const when = new Date(log.ts).toLocaleDateString(lang==='en'?'en-GB':'cs-CZ');
      if (log.fed.length)   h += `<div style="font-size:0.76rem; margin-bottom:2px;">✅ ${when} — ${lang==='en'?'fed':'nasyceni'}: ${log.fed.join(', ')}</div>`;
      if (log.unfed.length) h += `<div style="font-size:0.76rem; color:#c0392b;">⚠️ ${when} — ${lang==='en'?'hungry':'hladoví'}: ${log.unfed.join(', ')}</div>`;
    } else {
      h += `<div style="font-size:0.76rem; opacity:0.6; font-style:italic;">${lang==='en'?'No meal served yet.':'Zatím se nevařilo.'}</div>`;
    }

    h += `</div>`;
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