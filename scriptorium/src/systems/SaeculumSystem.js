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
    // M-V: vodní PILA (Obchod nit 1, payoff dopisu L5) — mult 7, prémiová cena, gate tech+vztah
    { id: 'log', outputId: 'plank', mult: 7, cost: 5, unlockTech: 'tech_carpentaria', minRelation: 10,
      icon: '🪵', label: 'Klády (pila: 1 → 7 fošen)', label_en: 'Logs (sawmill: 1 → 7 planks)' },
    // M-V2: STOUPA — kůra → tříslo (koželužský bulk; duběnky zůstávají pro inkoust)
    { id: 'bark', outputId: 'tanbark', mult: 2, cost: 4, unlockTech: 'tech_tanning', minRelation: 15,
      icon: '🟤', label: 'Kůra (stoupa: 1 → 2 třísla)', label_en: 'Bark (stamp mill: 1 → 2 tanbark)' },
  ],
  MOLA_COST: 3,
  MOLA_MS: 4 * 60 * 60 * 1000,

  renderMola: function() {
    if (!GameState.ui) GameState.ui = {};
    const molaOpen = GameState.ui.saeculumMolaOpen !== false;
    let h = `<details ${molaOpen ? 'open' : ''} ontoggle="GameState.ui.saeculumMolaOpen = this.open; Game.save();" style="margin-bottom:16px; background:rgba(0,0,0,0.03);
                         border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<summary style="cursor:pointer; padding:10px 14px; font-size:0.92rem; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px;">
            <span>⚙️ ${t('saeculum.mola')}</span><span style="opacity:0.5; font-weight:normal;">▾</span>
          </summary>`;
    h += `<div style="padding:10px 14px 14px;">`;
    h += this.renderMolaInner();
    h += `</div></details>`;
    return h;
  },

  // Tělo Mola bloku — sdílené: vlastní tab (tier <3) i Mlynářův panel (tier ≥3). Mechanika beze změny.
  renderMolaInner: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const order = GameState.millOrder;
    const active = order && Date.now() < order.returnsAt;
    let h = '';

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
      const researched = GameState.researchedTechs || [];
      const mlynarRel = (GameState.contactRelation || {}).mlynar || 0;
      this.MOLA_INPUTS.forEach(inp => {
        // M-V: gate služeb (zrní bez polí — beze změny)
        if (inp.unlockTech && !researched.includes(inp.unlockTech)) return;
        const name = lang === 'en' ? inp.label_en : inp.label;
        if (inp.minRelation && mlynarRel < inp.minRelation) {
          h += `<div style="font-size:0.76rem; opacity:0.5; padding:4px 2px;">🔒 ${inp.icon} ${name} <span style="font-style:italic;">(${lang==='en'?'from relation':'od vztahu'} ${inp.minRelation})</span></div>`;
          return;
        }
        const have = GameState.inventory[inp.id] || 0;
        h += `<button class="craft-btn" onclick="SaeculumSystem.sendToMill('${inp.id}')" ${have > 0 ? '' : 'disabled'}
                style="text-align:left; white-space:normal; word-break:break-word; line-height:1.25; width:100%;">
                ${inp.icon} ${name} (${have}) → ${t('saeculum.millTo')}
              </button>`;
      });
      h += `</div>`;
      h += `<div style="font-size:0.72rem;opacity:0.6;margin-top:6px;">${t('saeculum.millCostNote')}</div>`;
    }
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
    const orderCost = inp.cost || this.MOLA_COST;
    if (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) {
      if (CellariumSystem.getGrose() < orderCost) {
        if (typeof UI !== 'undefined') UI.notify(t('saeculum.millNoGold'), true);
        return false;
      }
      CellariumSystem.addGrose(-orderCost);
    }
    Game.removeItem(inputId, have);
    GameState.millOrder = { inputId, outputId: inp.outputId, qty: have * (inp.mult || 1), returnsAt: Date.now() + this.MOLA_MS };
    if (typeof UI !== 'undefined') UI.notify('⚙️ ' + t('saeculum.millSent'));
    if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
      Game.addKronikaEntry('important',
        '⚙️ Náklad odvezen na mlýn. Kolo se točí, za 4 hodiny je hotovo.',
        '⚙️ The load is off to the mill. The wheel turns; ready in 4 hours.',
        '⚙️ Onus ad molam missum est.');
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
    html += this._illnessBadgeHtml(k, lang);
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

  // ── CONVERSI — chip řádka + inline detail (M1: task assignment) ─────────
  selectConversi: function(id) {
    if (!GameState.ui) GameState.ui = {};
    GameState.ui.conversiSelected = (GameState.ui.conversiSelected === id) ? null : id;
    this.switchEntity('conversi');
  },

  selectBrother: function(id) {
    if (!GameState.ui) GameState.ui = {};
    GameState.ui.brotherSelected = (GameState.ui.brotherSelected === id) ? null : id;
    this.switchEntity('dormitorium');
  },

  // ── DORMITORIUM — bratři (mniši/skriptoři), manažerská vrstva nad Conversi ──
  // Tabů, které mohou být přiřazeny: klíče DormitoriumSpecializationDB.
  renderDormitorium: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!GameState.ui) GameState.ui = {};
    const cap = (typeof Game !== 'undefined' && Game.dormitoriumCapacity) ? Game.dormitoriumCapacity() : 0;
    const list = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
    const selected = GameState.ui.brotherSelected;

    let h = `<div style="margin-bottom:16px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold); padding:12px 14px;">`;
    h += `<div style="font-weight:bold; font-size:0.92rem; margin-bottom:4px;">📿 ${lang==='en'?'Dormitorium':'Dormitorium'}</div>`;

    if (cap === 0) {
      h += `<div style="font-size:0.8rem; opacity:0.6; font-style:italic;">${lang==='en'
        ? 'No Dormitorium built yet — build it in Cellarium → Buildings.'
        : 'Zatím žádné Dormitorium — postav ho v Cellarium → Budovy.'}</div>`;
    } else {
      h += `<div style="font-size:0.85rem; margin-bottom:8px;">${lang==='en'?'Beds':'Lůžka'}: <strong>${list.length} / ${cap}</strong></div>`;

      // Přehled práce za poslední tick — co konvrši/bratři stihli udělat
      const report = GameState.lastTickReport || [];
      if (report.length) {
        h += `<div style="margin-bottom:10px; padding:8px 10px; background:rgba(0,0,0,0.03); border-radius:6px;">`;
        h += `<div style="font-size:0.68rem; font-weight:bold; opacity:0.65; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">${lang==='en'?'Since last report':'Od posledního hlášení'}</div>`;
        report.forEach(r => {
          h += `<div style="font-size:0.74rem; opacity:0.85; margin-bottom:2px;">${lang==='en' ? r.en : r.cs}</div>`;
        });
        h += `</div>`;
      }

      if (list.length) {
        h += `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">`;
        list.forEach(b => {
          const rec = (b.rosterId && typeof DormitoriumRosterDB !== 'undefined') ? DormitoriumRosterDB[b.rosterId] : null;
          const bIcon = (rec && rec.icon) ? rec.icon : '📿';
          const isActive = b.id === selected;
          const spec = b.assignedTab && typeof DormitoriumSpecializationDB !== 'undefined' ? DormitoriumSpecializationDB[b.assignedTab] : null;
          const specIcon = spec ? spec.icon : '';
          h += `<div onclick="SaeculumSystem.selectBrother('${b.id}')" style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:${isActive ? 'rgba(197,160,89,0.22)' : 'rgba(255,255,255,0.4)'}; border:${isActive ? '2px solid var(--accent-wax)' : '1px solid rgba(197,160,89,0.4)'}; border-radius:8px; cursor:pointer;">
                  <span style="font-size:1rem;">${bIcon}</span>
                  <span style="font-size:0.72rem; font-weight:bold;">${b.name}</span>
                  ${(b.conditions && Object.keys(b.conditions).length > 0) ? `<span style="font-size:0.85rem;">🤒</span>` : ''}
                  ${specIcon ? `<span style="font-size:0.7rem;">${specIcon}</span>` : `<span style="width:6px; height:6px; border-radius:50%; background:#7f8fa6;"></span>`}
                </div>`;
        });
        h += `</div>`;
      }

      if (list.length < cap) {
        h += `<button class="craft-btn" onclick="Game.hireBrother()">📿 ${lang==='en'?'Hire a brother (30g)':'Najmout bratra (30g)'}</button>`;
      } else {
        h += `<div style="font-size:0.75rem; opacity:0.6; font-style:italic;">${lang==='en'?'No free beds.':'Žádné volné lůžko.'}</div>`;
      }

      if (selected) {
        const b = list.find(x => x.id === selected);
        if (b) h += this.renderDormitoriumDetail(b);
      }
    }
    h += `</div>`;
    return h;
  },

  renderDormitoriumDetail: function(b) {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const rec = (b.rosterId && typeof DormitoriumRosterDB !== 'undefined') ? DormitoriumRosterDB[b.rosterId] : null;
    const icon = (rec && rec.icon) ? rec.icon : '📿';
    const origin = rec ? (lang === 'en' ? rec.origin_en : rec.origin_cs) : '';
    const fat = (typeof b.fatigue === 'number') ? b.fatigue : 0;
    const fatColor = fat <= 40 ? '#5a9a5a' : fat <= 70 ? '#e67e22' : '#c0392b';

    let h = `<div style="background:rgba(255,255,255,0.45); border-radius:8px; padding:12px 14px; margin-top:4px;">`;
    h += `<div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:8px;">
            <div style="font-size:1.8rem;">${icon}</div>
            <div style="flex:1;"><div style="font-weight:bold; font-size:0.95rem;">${b.name}</div>
            ${origin ? `<div style="font-style:italic; font-size:0.74rem; opacity:0.75; margin-top:2px; line-height:1.35;">${origin}</div>` : ''}</div>
          </div>`;

    // ── Regula — aktuální denní stav (Officium/oběd/nešpory/noc/práce), ──
    // mění se v průběhu dne. Sdílí Game.conversiDayBlock() s Conversi —
    // bratr respektuje stejný denní rytmus (viz checkConversiChores).
    if (typeof Game !== 'undefined' && Game.conversiDayBlock) {
      const dayBlock = Game.conversiDayBlock();
      const regula = {
        officium: { icon: '🕯️', cs: 'Na Officiu — modlí se, nedostupný', en: 'At Officium — praying, unavailable' },
        lunch:    { icon: '🍲', cs: 'U oběda v refektáři', en: 'At lunch in the refectory' },
        vespers:  { icon: '🕯️', cs: 'Na nešporách', en: 'At vespers' },
        night:    { icon: '😴', cs: 'Spí', en: 'Sleeping' },
        work:     { icon: '⚒️', cs: 'Pracuje', en: 'Working' },
      }[dayBlock];
      h += `<div style="font-size:0.76rem; margin:4px 0 8px; opacity:0.8;">${regula.icon} ${lang==='en'?regula.en:regula.cs}</div>`;
    }

    h += this._illnessBadgeHtml(b, lang);
    h += this._infirmariumActionHtml(b, true, lang);
    h += this._flebotomieActionHtml(b, true, lang);

    h += `<div style="margin-bottom:7px;">
        <div style="display:flex; justify-content:space-between; font-size:0.72rem; opacity:0.75; margin-bottom:2px;">
          <span>😴 ${lang==='en'?'Fatigue':'Únava'}</span><span>${fat}%</span>
        </div>
        <div style="background:rgba(0,0,0,0.12); border-radius:3px; height:5px;">
          <div style="width:${fat}%; background:${fatColor}; height:5px; border-radius:3px;"></div>
        </div>
      </div>`;

    // ── Stres a Pokušení — nové dynamické metriky (monk-attributes-mrd) ──
    const stress = (typeof b.stress === 'number') ? b.stress : 0;
    const temptation = (typeof b.temptation === 'number') ? b.temptation : 0;
    const stressColor = stress <= 40 ? '#5a9a5a' : stress <= 70 ? '#e67e22' : '#c0392b';
    const temptColor = temptation <= 40 ? '#5a9a5a' : temptation <= 70 ? '#e67e22' : '#c0392b';
    h += `<div style="margin-bottom:7px;">
        <div style="display:flex; justify-content:space-between; font-size:0.72rem; opacity:0.75; margin-bottom:2px;">
          <span>😰 ${lang==='en'?'Stress':'Stres'}</span><span>${stress}%</span>
        </div>
        <div style="background:rgba(0,0,0,0.12); border-radius:3px; height:5px;">
          <div style="width:${stress}%; background:${stressColor}; height:5px; border-radius:3px;"></div>
        </div>
      </div>`;
    h += `<div style="margin-bottom:7px;">
        <div style="display:flex; justify-content:space-between; font-size:0.72rem; opacity:0.75; margin-bottom:2px;">
          <span>😈 ${lang==='en'?'Temptation':'Pokušení'}</span><span>${temptation}%</span>
        </div>
        <div style="background:rgba(0,0,0,0.12); border-radius:3px; height:5px;">
          <div style="width:${temptation}%; background:${temptColor}; height:5px; border-radius:3px;"></div>
        </div>
      </div>`;

    // ── 8 duchovních/intelektuálních/praktických vlastností (monk-attributes-mrd) ──
    if (b.traits) {
      const TRAIT_LABELS = {
        piety:         { icon: '🙏', cs: 'Zbožnost',           en: 'Piety' },
        obedience:     { icon: '🤲', cs: 'Pokora',             en: 'Obedience' },
        asceticism:    { icon: '⛓️', cs: 'Askeze',             en: 'Asceticism' },
        erudition:     { icon: '📖', cs: 'Učenost',            en: 'Erudition' },
        focus:         { icon: '🎯', cs: 'Soustředění',        en: 'Focus' },
        craftsmanship: { icon: '🔨', cs: 'Řemeslná zručnost',  en: 'Craftsmanship' },
        eloquence:     { icon: '💬', cs: 'Výřečnost',          en: 'Eloquence' },
        vigor:         { icon: '💪', cs: 'Tělesná zdatnost',   en: 'Vigor' },
      };
      h += `<div style="border-top:1px solid rgba(197,160,89,0.3); margin-top:8px; padding-top:8px;">`;
      h += `<div style="font-size:0.7rem; font-weight:bold; opacity:0.7; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;">${lang==='en'?'Character':'Povaha'}</div>`;
      h += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 10px;">`;
      Object.keys(TRAIT_LABELS).forEach(key => {
        const val = b.traits[key] || 0;
        const lbl = TRAIT_LABELS[key];
        h += `<div style="font-size:0.68rem; display:flex; justify-content:space-between; opacity:0.8;">
                <span>${lbl.icon} ${lang==='en'?lbl.en:lbl.cs}</span><span>${val}</span>
              </div>`;
      });
      h += `</div></div>`;
    }

    // ── Flavor text — krátká, denně se měnící hláška, čistě kosmetická ──
    if (rec && rec.quotes) {
      const dayIdx = Math.floor(Date.now() / 86400000) + b.id.length; // mění se denně, jiné per bratr
      const flavorPool = [rec.quotes.tired, rec.quotes.work, rec.quotes.officium].filter(Boolean);
      if (flavorPool.length) {
        const chosen = flavorPool[dayIdx % flavorPool.length];
        h += `<div style="font-size:0.72rem; font-style:italic; opacity:0.65; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(197,160,89,0.25);">
                „${lang==='en' ? chosen.en : chosen.cs}“
              </div>`;
      }
    }

    // Aktuální specializace + úroveň (pokud přiřazen)
    if (b.assignedTab && typeof DormitoriumSpecializationDB !== 'undefined') {
      const spec = DormitoriumSpecializationDB[b.assignedTab];
      const specName = spec ? (lang==='en' ? spec.name_en : spec.name) : b.assignedTab;
      const level = (typeof Game !== 'undefined' && Game.dormitoriumBrotherLevel) ? Game.dormitoriumBrotherLevel(b, b.assignedTab) : 1;
      const xp = (b.xp && b.xp[b.assignedTab]) || 0;
      const mult = (typeof Game !== 'undefined' && Game.dormitoriumBrotherMult) ? Game.dormitoriumBrotherMult(b, b.assignedTab) : 1.0;
      h += `<div style="font-size:0.78rem; margin:8px 0; padding:8px 10px; background:rgba(197,160,89,0.1); border-radius:6px;">
              ${spec ? spec.icon : ''} <strong>${specName}</strong> — ${lang==='en'?'level':'úroveň'} ${level}/4
              <span style="opacity:0.65;"> (${xp} XP, ×${mult.toFixed(2)} ${lang==='en'?'yield':'výnos'})</span>
            </div>`;
    }

    // Přiřazení na sekci
    h += `<div style="border-top:1px solid rgba(197,160,89,0.3); margin-top:8px; padding-top:8px;">`;
    if (b.admittedToInfirmarium) {
      h += `<div style="font-size:0.78rem;">🩺 ${lang==='en' ? "In the infirmary's care — cannot be assigned" : 'V péči Infirmaria — nelze přiřadit'}</div>`;
      h += `</div>`; // zavírá "Přiřazení na sekci" div
      h += `</div>`; // zavírá vnější wrapper div (otevřen na začátku funkce)
      return h;
    }
    h += `<div style="font-size:0.7rem; font-weight:bold; opacity:0.7; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;">${lang==='en'?'Assign to':'Přiřadit na'}</div>`;
    h += `<div style="display:flex; gap:6px; flex-wrap:wrap;">`;
    const specKeys = (typeof DormitoriumSpecializationDB !== 'undefined') ? Object.keys(DormitoriumSpecializationDB) : [];
    specKeys.forEach(tabId => {
      const spec = DormitoriumSpecializationDB[tabId];
      const isCur = b.assignedTab === tabId;
      const takenBy = (GameState.dormitorium.brothers || []).find(x => x.assignedTab === tabId && x.id !== b.id);
      // Infirmarium mnišský role — tech-gated brother specializace.
      const locked = (tabId.indexOf('infirmarium_') === 0
          && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_infirmarium')))
        || (tabId === 'studovna'
          && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_studovna')));
      const disabled = (takenBy && !isCur) || locked;
      const bg = isCur ? '#8a3324' : disabled ? 'rgba(0,0,0,0.04)' : 'rgba(197,160,89,0.15)';
      const fg = isCur ? '#fcf5e5' : 'inherit';
      const opac = disabled && !isCur ? '0.55' : '1';
      const specName = lang === 'en' ? spec.name_en : spec.name;
      const lockedTechName = tabId === 'studovna' ? (lang==='en'?'Studovna':'Studovna') : (lang==='en'?'Infirmarium':'Infirmarium');
      const hint = locked ? (lang==='en'?'needs tech: ':'chybí tech: ') + lockedTechName
                 : (takenBy && !isCur ? specName + ' (' + takenBy.name + ')' : specName);
      h += `<div onclick="${disabled ? '' : `Game.assignBrotherTab('${b.id}', ${isCur ? 'null' : `'${tabId}'`})`}" style="cursor:${disabled ? 'default' : 'pointer'}; opacity:${opac}; padding:6px 10px; border-radius:6px; background:${bg}; color:${fg}; font-size:0.74rem; text-align:center;">
              <div>${spec.icon}</div>
              <div style="font-size:0.6rem; opacity:0.85;">${hint}</div>
            </div>`;
    });
    h += `</div></div>`;
    h += `</div>`;
    return h;
  },

  // Detail konvrše — inline panel (konvence: modal = info, panel = akce; tady jde o obojí)
  renderConversiDetail: function(k) {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const rec = (k.rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[k.rosterId] : null;
    const icon = (rec && rec.icon) ? rec.icon : '✝️';
    const origin = rec ? (lang === 'en' ? rec.origin_en : rec.origin_cs) : '';
    const mood = (typeof k.mood === 'number') ? k.mood : 60;
    const loyalty = (typeof k.loyalty === 'number') ? k.loyalty : 30;
    const fat = (typeof k.fatigue === 'number') ? k.fatigue : 0;
    const now = Date.now();
    const isAway = k.awayUntil && k.awayUntil > now;
    const isInjured = k.injuredUntil && k.injuredUntil > now;
    const inPenance = k.penanceUntil && k.penanceUntil > now;

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

    let h = `<div style="background:rgba(255,255,255,0.45); border-radius:8px; padding:12px 14px; margin-top:4px;">`;
    const typeLabel = k.type === 'famulus' ? (lang==='en'?'Famulus — seasonal hand':'Famulus — sezónní síla')
                     : k.type === 'oblat'   ? (lang==='en'?'Oblate':'Oblát')
                     : (lang==='en'?'Konvrš':'Konvrš');
    h += `<div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:8px;">
            <div style="font-size:1.8rem;">${icon}</div>
            <div style="flex:1;"><div style="display:flex; justify-content:space-between; align-items:baseline;">
              <div style="font-weight:bold; font-size:0.95rem;">${k.name}</div>
              <div style="font-size:0.66rem; opacity:0.55; font-style:italic;">${typeLabel}</div>
            </div>
            ${origin ? `<div style="font-style:italic; font-size:0.74rem; opacity:0.75; margin-top:2px; line-height:1.35;">${origin}</div>` : ''}</div>
          </div>`;

    h += this._illnessBadgeHtml(k, lang);
    h += this._infirmariumActionHtml(k, false, lang);
    h += this._flebotomieActionHtml(k, false, lang);

    h += bar((lang==='en'?'😊 Mood':'😊 Nálada'), mood, moodColor);
    if (k.type !== 'famulus') h += bar((lang==='en'?'🤝 Loyalty':'🤝 Věrnost'), loyalty, loyColor);
    h += bar((lang==='en'?'😴 Fatigue':'😴 Únava'), fat, fatColor);

    if (k.type === 'oblat') {
      const daysLeft = k.matureAt ? Math.max(0, Math.ceil((k.matureAt - now) / (24*60*60*1000))) : null;
      h += `<div style="font-size:0.76rem; margin:6px 0 3px; color:var(--accent-gold);">🌱 ${daysLeft !== null ? (lang==='en' ? 'Matures into a lay brother in '+daysLeft+' d' : 'Dozraje v konvrše za '+daysLeft+' d') : (lang==='en'?'Still growing':'Ještě roste')}</div>`;
    } else {
      const wageAmount = k.type === 'famulus' ? 4 : 2;
      const owed = (typeof k.wageOwed === 'number') ? k.wageOwed : 0;
      const nextW = GameState.conversiNextWage ? Math.max(0, Math.ceil((GameState.conversiNextWage - now) / (24*60*60*1000))) : null;
      h += `<div style="font-size:0.76rem; margin:6px 0 3px;">💰 ${lang==='en' ? 'Wage: '+wageAmount+' groats/week' : 'Mzda: '+wageAmount+' groše/týden'}${nextW !== null ? (lang==='en' ? ' · payday in '+nextW+'d' : ' · výplata za '+nextW+' d') : ''}</div>`;
      if (owed > 0) h += `<div style="font-size:0.76rem; margin-bottom:3px; color:#c0392b;">💸 ${lang==='en'?'Owed':'Dluh'}: ${owed} g</div>`;
      if (k.type === 'famulus') h += `<div style="font-size:0.68rem; opacity:0.6; font-style:italic; margin-bottom:3px;">${lang==='en'?'No lasting bond — leaves at once if unpaid.':'Bez trvalé vazby — při neplacení hned odchází.'}</div>`;
    }

    if (rec && rec.traits && rec.traits.length && typeof ConversiTraitsDB !== 'undefined') {
      h += `<div style="display:flex; gap:4px; flex-wrap:wrap; margin:6px 0;">`;
      rec.traits.forEach(tid => {
        const td = ConversiTraitsDB[tid];
        if (!td) return;
        h += `<span title="${lang==='en'?td.desc_en:td.desc}" style="font-size:0.66rem; background:rgba(197,160,89,0.18); border:1px solid rgba(197,160,89,0.35); border-radius:4px; padding:1px 5px;">${td.icon} ${lang==='en'?td.name_en:td.name}</span>`;
      });
      h += `</div>`;
    }

    // ── Stav / přiřazení úkolu ──
    h += `<div style="border-top:1px solid rgba(197,160,89,0.3); margin-top:8px; padding-top:8px;">`;
    if (k.admittedToInfirmarium) {
      h += `<div style="font-size:0.78rem;">🩺 ${lang==='en' ? "In the infirmary's care — cannot be assigned" : 'V péči Infirmaria — nelze přiřadit'}</div>`;
    } else if (isAway) {
      const hRem = Math.ceil((k.awayUntil - now) / (60*60*1000));
      const taskIcon = (Game.CONVERSI_TASKS[k.awayTask] || {}).icon || '';
      h += `<div style="font-size:0.78rem;">🚶 ${lang==='en' ? 'Away on task '+taskIcon+' — returns in '+hRem+'h' : 'Na úkolu '+taskIcon+' — návrat za '+hRem+'h'}</div>`;
    } else if (isInjured) {
      const hRem = Math.ceil((k.injuredUntil - now) / (60*60*1000));
      h += `<div style="font-size:0.78rem; color:#c0392b;">🤕 ${lang==='en' ? 'Injured — resting '+hRem+'h, cannot be assigned' : 'Zraněn — odpočívá ještě '+hRem+'h, nelze přiřadit'}</div>`;
      if ((GameState.inventory['spongia_somnifera'] || 0) > 0) {
        h += `<button class="craft-btn" style="margin-top:4px; padding:3px 8px; font-size:0.68rem;" onclick="Game.applySpongiaToInjured('${k.id}')">🧽 ${lang==='en'?'Apply Sleeping Sponge':'Podat uspávací houbu'} (${GameState.inventory['spongia_somnifera']})</button>`;
      }
    } else if (inPenance) {
      const pd = Math.ceil((k.penanceUntil - now) / (24*60*60*1000));
      h += `<div style="font-size:0.78rem;">⚖️ ${lang==='en' ? 'Penance: '+pd+' day(s) — cannot be assigned' : 'Pokání: '+pd+' d — nelze přiřadit'}</div>`;
    } else {
      h += `<div style="font-size:0.7rem; font-weight:bold; opacity:0.7; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em;">${lang==='en'?'Assign to':'Přiřadit na'}</div>`;
      h += `<div style="display:flex; gap:6px; flex-wrap:wrap;">`;
      Object.keys(Game.CONVERSI_TASKS).forEach(taskId => {
        const cfg = Game.CONVERSI_TASKS[taskId];
        const gate = Game.conversiTaskGate(taskId);
        const taken = Game.conversiTaskCount(taskId, k.id);
        const isCur = k.task === taskId;
        const full = !isCur && taken >= Game.CONVERSI_TASK_SLOTS;
        const label = ({dvur: lang==='en'?'Farmyard':'Dvůr', zahony: lang==='en'?'Garden':'Záhony', sad: lang==='en'?'Orchard':'Sad', apiarium: lang==='en'?'Apiary':'Apiarium', piscina: lang==='en'?'Fishpond':'Piscina', pole: lang==='en'?'Field':'Pole', vinohrad: lang==='en'?'Vineyard':'Vinohrad', scavenge:'Scavenge', doly: lang==='en'?'Mine':'Doly', kostel: lang==='en'?'Church':'Kostel', hrbitov: lang==='en'?'Cemetery':'Hřbitov',
            servitor: lang==='en'?'Servitor':'Ošetřovatel', coquus: lang==='en'?'Coquus':'Kuchař', hortulanus: lang==='en'?'Hortulanus':'Bylinář', balneator: lang==='en'?'Balneator':'Topič'})[taskId];
        let hint = '';
        if (gate.locked) {
          hint = gate.reasonKey === 'gate_fodina_tech' ? (lang==='en'?'needs tech: Fodina':'chybí tech: Fodina')
               : gate.reasonKey === 'gate_fodina_approval' ? (lang==='en'?"needs Abbot's approval":'chybí schválení opata')
               : gate.reasonKey === 'gate_frater' ? (lang==='en'?'needs Frater+':'chybí Frater+')
               : gate.reasonKey === 'gate_infirmarium_tech' ? (lang==='en'?'needs tech: Infirmarium':'chybí tech: Infirmarium')
               : '';
        } else if (full) {
          hint = lang==='en' ? 'slots full' : 'plno';
        } else {
          hint = taken + '/' + Game.CONVERSI_TASK_SLOTS;
        }
        const bg = isCur ? '#8a3324' : (gate.locked || full) ? 'rgba(0,0,0,0.04)' : 'rgba(197,160,89,0.15)';
        const fg = isCur ? '#fcf5e5' : 'inherit';
        const opac = (gate.locked || full) && !isCur ? '0.55' : '1';
        h += `<div onclick="Game.assignConversiTask('${k.id}', ${isCur ? 'null' : `'${taskId}'`})" style="cursor:pointer; opacity:${opac}; padding:6px 10px; border-radius:6px; background:${bg}; color:${fg}; font-size:0.74rem; text-align:center;">
                <div>${cfg.icon} ${label}</div>
                <div style="font-size:0.6rem; opacity:0.75;">${hint}</div>
              </div>`;
      });
      h += `</div>`;
    }
    h += `</div></div>`;
    return h;
  },

  // Nemoc musí "řvát" — výrazný červený badge, ne tichý text.
  // Admit/Discharge tlačítko + stav "v péči" — voláno z detail view (konvrš i bratr).
  // Flebotomie tlačítko — nezávislý na nemoci (preventivní), jen Chirurgus + cooldown.
  _flebotomieActionHtml: function(entity, isBrother, lang) {
    if (!GameState.chirurgus || !GameState.chirurgus.hired) return '';
    const now = Date.now();
    const COOLDOWN = 21 * 24 * 60 * 60 * 1000;
    if (entity.lastFlebotomie && now - entity.lastFlebotomie < COOLDOWN) {
      const daysLeft = Math.ceil((COOLDOWN - (now - entity.lastFlebotomie)) / (24*60*60*1000));
      return `<div style="font-size:0.68rem; opacity:0.5; margin:2px 0 6px; font-style:italic;">🩸 ${lang==='en'?'Bled recently — safe again in '+daysLeft+'d':'Nedávno pouštěna žíla — bezpečný za '+daysLeft+' d'}</div>`;
    }
    return `<button class="craft-btn" style="margin:2px 0 6px; padding:3px 8px; font-size:0.68rem;" onclick="Game.performFlebotomie('${entity.id}', ${isBrother})">🩸 ${lang==='en'?'Bloodletting (Flebotomie)':'Pouštění žilou (Flebotomie)'}</button>`;
  },

  _infirmariumActionHtml: function(entity, isBrother, lang) {
    if (typeof InfirmariumSystem === 'undefined' || !InfirmariumSystem.isUnlocked()) return '';
    const hasCondition = entity.conditions && Object.keys(entity.conditions).length > 0;
    const admitted = !!entity.admittedToInfirmarium;
    if (!hasCondition && !admitted) return '';
    if (admitted) {
      let h = `<div style="font-size:0.76rem; margin:4px 0 4px; padding:6px 10px; background:rgba(197,160,89,0.12); border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                <span>🩺 ${lang==='en'?"In the infirmary's care":'V péči Infirmaria'}</span>
                <button class="craft-btn" style="padding:2px 8px; font-size:0.68rem;" onclick="Game.dischargeFromInfirmarium('${entity.id}', ${isBrother})">${lang==='en'?'Discharge':'Propustit'}</button>
              </div>`;
      const hasApothecarius = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_apothecarius');
      if (hasApothecarius) {
        const conditionIds = Object.keys(entity.conditions || {});
        const available = [];
        conditionIds.forEach(cid => {
          const def = typeof HealthConditionsDB !== 'undefined' ? HealthConditionsDB[cid] : null;
          if (!def || !def.cures) return;
          def.cures.forEach(itemId => {
            if ((GameState.inventory[itemId] || 0) > 0 && !available.includes(itemId)) available.push(itemId);
          });
        });
        if (available.length) {
          h += `<div style="font-size:0.68rem; opacity:0.7; margin-bottom:4px;">⚕️ ${lang==='en'?'Administer':'Podat'}:</div>`;
          h += `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px;">`;
          h += available.map(itemId => `<button class="craft-btn" style="padding:3px 8px; font-size:0.68rem;" onclick="Game.administerCure('${entity.id}', ${isBrother}, '${itemId}')">${typeof iName === 'function' ? iName(itemId) : itemId} (${GameState.inventory[itemId]})</button>`).join('');
          h += `</div>`;
        } else {
          h += `<div style="font-size:0.68rem; opacity:0.55; font-style:italic; margin-bottom:6px;">${lang==='en'?'Nothing in stock that helps.':'Nic vhodnýho na skladě.'}</div>`;
        }
      }
      const hasCapellanus = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_capellanus');
      if (hasCapellanus && !entity.confessedThisStay) {
        h += `<button class="craft-btn" style="padding:3px 8px; font-size:0.68rem;" onclick="Game.hearConfession('${entity.id}', ${isBrother})">🙏 ${lang==='en'?'Hear confession':'Vyslechnout zpověď'}</button>`;
      }
      return h;
    }
    const inf = GameState.infirmarium || { beds: 3, patients: [] };
    const full = (inf.patients || []).length >= inf.beds;
    return `<div style="font-size:0.76rem; margin:4px 0 8px; display:flex; justify-content:space-between; align-items:center;">
              <button class="craft-btn" ${full ? 'disabled' : ''} onclick="Game.admitToInfirmarium('${entity.id}', ${isBrother})">🩺 ${lang==='en'?'Admit to Infirmary':'Přijmout do Infirmaria'}</button>
              <span style="opacity:0.65; font-size:0.68rem;">${(inf.patients||[]).length}/${inf.beds} ${lang==='en'?'beds':'lůžek'}</span>
            </div>`;
  },

  _illnessBadgeHtml: function(entity, lang) {
    if (!entity.conditions || typeof HealthConditionsDB === 'undefined') return '';
    const ids = Object.keys(entity.conditions);
    if (!ids.length) return '';
    const rows = ids.map(id => {
      const def = HealthConditionsDB[id];
      if (!def) return '';
      const name = lang === 'en' ? def.name_en : def.name;
      return `<div style="display:flex; align-items:center; gap:5px;">
                <span style="font-size:1rem;">${def.icon}</span>
                <strong style="color:#c0392b;">${name}</strong>
              </div>`;
    }).join('');
    return `<div style="background:rgba(192,57,43,0.15); border:1px solid #c0392b; border-radius:6px;
                        padding:5px 8px; margin:3px 0 6px 0; animation:illnessPulse 2s infinite;">
              ${rows}
            </div>
            <style>@keyframes illnessPulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }</style>`;
  },

  renderManufactura: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    // Pořadí odpovídá DormitoriumSpecializationDB; dvur navíc (údržba, bez XP tabu tam).
    const TAB_ORDER = ['dvur', 'kostel', 'hrbitov', 'zahony', 'sad', 'pole', 'vinohrad', 'apiarium', 'piscina', 'columbarium', 'athanor', 'scriptorium'];
    // Konvrš lze přiřadit jen na tyto (athanor/scriptorium nejsou v CONVERSI_TASKS — jen bratr).
    const CONVERSI_CAPABLE = ['dvur', 'kostel', 'hrbitov', 'zahony', 'sad', 'apiarium', 'piscina', 'pole', 'vinohrad', 'columbarium'];

    let h = `<div style="margin-bottom:10px; font-size:0.8rem; opacity:0.75;">
      ${lang === 'en'
        ? 'Overview of every workspace — who works there, how skilled they are, and what is ready to collect.'
        : 'Přehled všech pracovišť — kdo tam pracuje, jak je zkušený, a co je připravené ke sběru.'}
    </div>`;

    // ── Informační lišta: co teď dělá komunita (Officium/Oběd/Nešpory/Noc/Práce) ──
    const DAY_BLOCK_INFO = {
      officium: { icon: '🙏', cs: 'Officium — ranní modlitba a odpočinek. Automatický tick čeká, ruční Sběr funguje.', en: 'Officium — morning prayer and rest. The automatic tick waits; manual Collect still works.' },
      lunch:    { icon: '🍽️', cs: 'Oběd — konvrši v refektáři. Automatický tick čeká, ruční Sběr funguje.', en: 'Lunch — lay brothers in the refectory. The automatic tick waits; manual Collect still works.' },
      vespers:  { icon: '🕯️', cs: 'Nešpory — večerní modlitba. Automatický tick čeká, ruční Sběr funguje.', en: 'Vespers — evening prayer. The automatic tick waits; manual Collect still works.' },
      night:    { icon: '🌙', cs: 'Noc — všichni spí. Automatický tick čeká, ruční Sběr funguje.', en: 'Night — everyone sleeps. The automatic tick waits; manual Collect still works.' },
      work:     { icon: '⚒️', cs: 'Pracovní doba — dílny v provozu.', en: 'Working hours — workshops active.' },
    };
    const dayBlock = (typeof Game !== 'undefined' && Game.conversiDayBlock) ? Game.conversiDayBlock() : 'work';
    const info = DAY_BLOCK_INFO[dayBlock] || DAY_BLOCK_INFO.work;
    h += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:14px; padding:8px 12px;
                       background:rgba(197,160,89,0.12); border-radius:6px; border-left:3px solid var(--accent-gold);
                       font-size:0.78rem;">
            <span style="font-size:1.1rem;">${info.icon}</span>
            <span>${lang === 'en' ? info.en : info.cs}</span>
          </div>`;

    h += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:10px;">`;

    TAB_ORDER.forEach(tabKey => {
      const spec = (typeof DormitoriumSpecializationDB !== 'undefined') ? DormitoriumSpecializationDB[tabKey] : null;
      const specName = spec ? (lang === 'en' ? spec.name_en : spec.name) : tabKey;
      const specIcon = spec ? spec.icon : '⚙️';
      const st = (typeof Game !== 'undefined' && Game.manufacturaStatus) ? Game.manufacturaStatus(tabKey) : null;
      if (!st) return;

      h += `<div style="padding:12px; background:rgba(197,160,89,0.07); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">`;
      h += `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <div style="font-weight:bold; font-size:0.88rem;">${specIcon} ${specName}</div>
              ${st.combo && tabKey !== 'hrbitov' ? `<span title="${lang === 'en' ? 'Brother + lay brother working together' : 'Bratr a konvrš pracují spolu'}" style="font-size:0.9rem;">🤝</span>` : ''}
            </div>`;

      // Bratr — hřbitov nemá vlastní bratra, dohlíží Kostelník (viz manufacturaStatus)
      if (tabKey !== 'hrbitov') {
        if (st.brother) {
          h += `<div style="font-size:0.76rem; margin-bottom:3px;">
                  📿 <strong>${st.brother.name}</strong> — ${lang === 'en' ? 'level' : 'úroveň'} ${st.level}/4
                  <span style="opacity:0.65;"> (${st.xp} XP, ×${st.mult.toFixed(2)} ${lang === 'en' ? 'yield' : 'výnos'})</span>
                </div>`;
          h += this._illnessBadgeHtml(st.brother, lang);
        } else {
          h += `<div style="font-size:0.76rem; opacity:0.5; margin-bottom:3px;">📿 ${lang === 'en' ? 'no brother assigned' : 'nepřiřazen žádný bratr'}</div>`;
        }
      }

      // Konvrš (jen na tabech, kde je to vůbec možné)
      if (CONVERSI_CAPABLE.includes(tabKey)) {
        if (st.konvrs) {
          h += `<div style="font-size:0.76rem; opacity:0.85; margin-bottom:6px;">✝️ <strong>${st.konvrs.name}</strong></div>`;
          h += this._illnessBadgeHtml(st.konvrs, lang);
        } else {
          h += `<div style="font-size:0.76rem; opacity:0.5; margin-bottom:6px;">✝️ ${lang === 'en' ? 'no lay brother assigned' : 'nepřiřazen žádný konvrš'}</div>`;
        }
      }

      // Stav / Collect
      h += `<div style="border-top:1px dashed rgba(197,160,89,0.3); margin-top:6px; padding-top:6px;">`;
      if (!st.hasField) {
        // Dvůr — údržba, žádný jednorázový výnos ke sběru
        const maintMsg = tabKey === 'kostel'
          ? (lang === 'en' ? 'Maintenance — keeps the church clean, no single yield to collect.' : 'Údržba — udržuje kostel čistý, nesbírá se jednorázově.')
          : tabKey === 'hrbitov'
          ? (lang === 'en' ? 'Maintenance — keeps the graves tended, no single yield to collect.' : 'Údržba — udržuje hroby, nesbírá se jednorázově.')
          : (lang === 'en' ? 'Maintenance — cleans & feeds as needed, no single yield to collect.' : 'Údržba — uklízí a krmí dle potřeby, nesbírá se jednorázově.');
        h += `<div style="font-size:0.72rem; opacity:0.65;">🧹 ${maintMsg}</div>`;
      } else if (!st.brother && !st.konvrs) {
        h += `<div style="font-size:0.72rem; opacity:0.5;">${lang === 'en' ? 'Nobody working here.' : 'Nikdo tu nepracuje.'}</div>`;
      } else if (st.ready) {
        h += `<button class="craft-btn" onclick="Game.manufacturaCollect('${tabKey}')" style="width:100%; background:#4a7c59;">
                🧺 ${lang === 'en' ? 'Collect' : 'Sebrat'}
              </button>`;
      } else {
        h += `<div style="font-size:0.72rem; opacity:0.65;">⏳ ${lang === 'en' ? 'Ready in' : 'Připraveno za'} ~${st.hoursLeft}h</div>`;
      }
      h += `</div>`;

      h += `</div>`;
    });

    h += `</div>`;
    return h;
  },

  renderConversi: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!GameState.ui) GameState.ui = {};
    const cap = (typeof Game !== 'undefined' && Game.conversiCapacity) ? Game.conversiCapacity() : 0;
    const list = GameState.conversi || [];
    const selected = GameState.ui.conversiSelected;

    let h = `<div style="margin-bottom:16px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold); padding:12px 14px;">`;
    h += `<div style="font-weight:bold; font-size:0.92rem; margin-bottom:4px;">✝️ ${lang==='en'?'Conversi':'Conversi'}</div>`;

    if (cap === 0) {
      const hasOldCellarsAccess = (GameState.researchedTechs && GameState.researchedTechs.includes('tech_conventual_spaces')) || GameState.oldCellarsFound;
      const dormHint = hasOldCellarsAccess
        ? (lang==='en' ? 'No dormitory built yet — build it in Old Cellars (Cellarium).' : 'Zatím žádný dormitář — postav ho ve Starých sklepech (Cellarium).')
        : (lang==='en' ? 'No dormitory built yet. First find the Old Cellars — research it (Conventual Spaces) or stumble upon it by chance.' : 'Zatím žádný dormitář. Nejprve objev Staré sklepy — buď výzkumem (Konventní prostory), nebo náhodným nálezem.');
      h += `<div style="font-size:0.8rem; opacity:0.6; font-style:italic;">${dormHint}</div>`;
    } else {
      h += `<div style="font-size:0.85rem; margin-bottom:8px;">${lang==='en'?'Beds':'Lůžka'}: <strong>${list.length} / ${cap}</strong></div>`;
      if (list.length && GameState.conversiNextWage) {
        const daysToWage = Math.max(0, Math.ceil((GameState.conversiNextWage - Date.now()) / (24*60*60*1000)));
        h += `<div style="font-size:0.72rem; opacity:0.65; margin-bottom:8px;">💰 ${lang==='en' ? 'Wage: 2 g/brother · payday in '+daysToWage+'d' : 'Mzda: 2 g/konvrš · výplata za '+daysToWage+' d'}</div>`;
      }
      const atOfficium = (typeof Game !== 'undefined' && Game.isOfficiumHours) ? Game.isOfficiumHours() : false;
      if (list.length && atOfficium) {
        h += `<div style="font-size:0.75rem; opacity:0.7; font-style:italic; margin-bottom:8px;">🕯️ ${lang==='en'?'At Officium (6:00–9:00) — unavailable for chores.':'Na Officiu (6:00–9:00) — nedostupní pro úkoly.'}</div>`;
      }
      if (list.length) {
        h += `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">`;
        list.forEach(k => {
          const kf = (typeof k.fatigue === 'number') ? k.fatigue : 0;
          const rec = (k.rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[k.rosterId] : null;
          const typeFallbackIcon = k.type === 'famulus' ? '💼' : k.type === 'oblat' ? '🌱' : '✝️';
          const kIcon = (rec && rec.icon) ? rec.icon : typeFallbackIcon;
          const isActive = k.id === selected;
          const now = Date.now();
          let statusDot = '#5a9a5a'; // volný
          let statusIcon = '';
          if (k.awayUntil && k.awayUntil > now) { statusDot = '#7f8fa6'; statusIcon = '🚶'; }
          else if (k.injuredUntil && k.injuredUntil > now) { statusDot = '#c0392b'; statusIcon = '🤕'; }
          else if (k.penanceUntil && k.penanceUntil > now) { statusDot = '#7f6ea6'; statusIcon = '⚖️'; }
          else if (kf >= 80) { statusDot = '#c0392b'; }
          else if (k.task) { statusIcon = (Game.CONVERSI_TASKS[k.task] || {}).icon || ''; }
          h += `<div onclick="SaeculumSystem.selectConversi('${k.id}')" style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:${isActive ? 'rgba(197,160,89,0.22)' : 'rgba(255,255,255,0.4)'}; border:${isActive ? '2px solid var(--accent-wax)' : '1px solid rgba(197,160,89,0.4)'}; border-radius:8px; cursor:pointer;">
                  <span style="font-size:1rem;">${kIcon}</span>
                  <span style="font-size:0.72rem; font-weight:bold;">${k.name}</span>
                  ${(k.conditions && Object.keys(k.conditions).length > 0) ? `<span style="font-size:0.85rem;">🤒</span>` : ''}
                  ${statusIcon ? `<span style="font-size:0.7rem;">${statusIcon}</span>` : `<span style="width:6px; height:6px; border-radius:50%; background:${statusDot};"></span>`}
                </div>`;
        });
        h += `</div>`;
      }

      if (list.length < cap) {
        h += `<button class="craft-btn" onclick="Game.hireKonvrs()">🤝 ${lang==='en'?'Hire a lay brother (10g)':'Najmout konvrše (10g)'}</button>`;
        if (GameState.researchedTechs.includes('tech_magister')) {
          h += `<button class="craft-btn" style="margin-top:4px;" onclick="Game.hireFamulus()">💼 ${lang==='en'?'Hire a famulus (4g/week)':'Najmout famula (4g/týden)'}</button>`;
          h += `<button class="craft-btn" style="margin-top:4px;" onclick="Game.hireOblat()">🌱 ${lang==='en'?'Take in an oblate (5g)':'Přijmout obláta (5g)'}</button>`;
        }
      } else {
        h += `<div style="font-size:0.75rem; opacity:0.6; font-style:italic;">${lang==='en'?'No free beds.':'Žádné volné lůžko.'}</div>`;
      }

      if (selected) {
        const k = list.find(x => x.id === selected);
        if (k) h += this.renderConversiDetail(k);
      }
    }
    h += `</div>`;
    h += this.renderUbytovna();
    return h;
  },

  // Vlna 1 — Ubytovna, vnořená pod Conversi (ubytovna-mrd.md §8c —
  // Ondrex: "klidně pod Conversi"). Čistě zobrazovací, žádná nová
  // game-state mutace. Data v GameState.ubytovna.guests[] (ChroniconSystem.js).
  UBYTOVNA_VARIANT_NAMES: {
    poutnik:       { cs: 'Poutník',       en: 'Pilgrim' },
    kramar:        { cs: 'Kramář',        en: 'Peddler' },
    zebravy_mnich: { cs: 'Žebravý bratr', en: 'Mendicant friar' },
    uprchlik:      { cs: 'Uprchlík',      en: 'Refugee' },
  },

  renderUbytovna: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const cap = (typeof Game !== 'undefined' && Game.ubytovnaCapacity) ? Game.ubytovnaCapacity() : 1;
    const guests = (GameState.ubytovna && GameState.ubytovna.guests) || [];
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    let h = `<div style="margin-bottom:16px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold); padding:12px 14px;">`;
    h += `<div style="font-weight:bold; font-size:0.92rem; margin-bottom:4px;">🥾 ${lang==='en'?'Guesthouse':'Ubytovna'}</div>`;
    h += `<div style="font-size:0.85rem; margin-bottom:6px;">${lang==='en'?'Guests':'Hosté'}: <strong>${guests.length} / ${cap}</strong></div>`;
    h += `<div style="font-size:0.7rem; opacity:0.6; font-style:italic; margin-bottom:8px;">${lang==='en'
      ? 'Guests arrive on their own — pilgrims, refugees, travelers passing through.'
      : 'Hosté přicházejí sami — poutníci, uprchlíci, pocestní na cestě.'}</div>`;

    if (!guests.length) {
      h += `<div style="font-size:0.8rem; opacity:0.6; font-style:italic;">${lang==='en'?'No one is staying here yet.':'Zatím tu nikdo nebydlí.'}</div>`;
    } else {
      h += `<div style="display:flex; flex-wrap:wrap; gap:6px;">`;
      guests.forEach(g => {
        const vn = this.UBYTOVNA_VARIANT_NAMES[g.variant] || { cs: g.variant, en: g.variant };
        const name = lang === 'en' ? vn.en : vn.cs;
        const icon = g.variant === 'uprchlik' ? '🏚️' : '🥾';
        const dueAt = (g.arrivedAt || 0) + (g.plannedDays || 1) * DAY_MS;
        const daysLeft = Math.max(0, Math.ceil((dueAt - now) / DAY_MS));
        const chance = Math.round(g.joinChance || 0);
        h += `<div style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.4); border-radius:8px;">
                <span style="font-size:1rem;">${icon}</span>
                <span style="font-size:0.72rem; font-weight:bold;">${name}</span>
                <span style="font-size:0.65rem; opacity:0.6;">${daysLeft}${lang==='en'?'d left':'d zbývá'}</span>
                ${chance > 0 ? `<span style="font-size:0.65rem; opacity:0.75;" title="${lang==='en'?'Growing fondness for monastic life':'Rostoucí náklonnost ke klášternímu životu'}">🙏 ${chance}%</span>` : ''}
              </div>`;
      });
      h += `</div>`;
    }
    h += `</div>`;
    return h;
  },

  renderEntityTabs: function() {
    const trade = ['tavern', 'shop', 'market'];
    const rankTier = (typeof RankSystem !== 'undefined' && RankSystem.getSecularRankTier) ? RankSystem.getSecularRankTier() : 1;
    const entities = [
      { id: 'tavern',   icon: '🍺', label: 'Hospoda',         label_en: 'Tavern' },
      { id: 'shop',     icon: '🏪', label: 'Obchod',          label_en: 'Shop'   },
      { id: 'market',   icon: '⛺', label: 'Trh',             label_en: 'Market' },
      { id: 'forum',    icon: '🐏', label: 'Forum Pecuarium', label_en: 'Forum Pecuarium' },
      { id: 'conversi', icon: '✝️', label: 'Conversi',        label_en: 'Conversi' },
      { id: 'dormitorium', icon: '📿', label: 'Dormitorium',  label_en: 'Dormitorium' },
      { id: 'regula',   icon: '🕯️', label: 'Regula',          label_en: 'Regula' },
    ];
    // Mola: pod tier 3 vlastní tab; od tier 3 žije uvnitř Mlynářova panelu (Clientela) — pročištění bez regrese
    if (rankTier < 3) {
      entities.splice(4, 0, { id: 'mola', icon: '⚙️', label: 'Mola', label_en: 'Mola' });
    }
    // Clientela: gated na secular antiquarius (tier 3) — pod tier 3 tab neexistuje
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
    else if (active === 'dormitorium') h += this.renderDormitorium();
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
    if (contactId === 'stationarius' && typeof CellariumSystem !== 'undefined' && !CellariumSystem.isStationariusPresent()) {
      const lang = (GameState.settings && GameState.settings.language) || 'cs';
      UI.notify(lang==='en' ? 'The Stationarius travels between book fairs — he is not in Olomouc now.' : 'Stationarius cestuje mezi veletrhy — teď není v Olomouci.', true);
      return;
    }
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
    this.switchEntity('clientela'); // refresh panelu (modal zrušen)
  },

  // GUI: panel místo modalu (schváleno) — klik na dlaždici otevře obchodní panel uvnitř tabu
  openContact: function(id) {
    if (!GameState.ui) GameState.ui = {};
    GameState.ui.clientelaContact = (GameState.ui.clientelaContact === id) ? null : id;
    this.switchEntity('clientela');
  },

  closeContact: function() {
    if (GameState.ui) GameState.ui.clientelaContact = null;
    this.switchEntity('clientela');
  },

  // M2: nákup od kontaktu — denní stock, vztah +1/nákupní akce
  _contactSoldToday: function(contactId, itemId) {
    const dayKey = new Date().toDateString();
    if (!GameState.contactShopSold || GameState.contactShopSold.day !== dayKey) {
      GameState.contactShopSold = { day: dayKey, sold: {} };
    }
    return GameState.contactShopSold.sold[contactId + ':' + itemId] || 0;
  },

  buyFromContact: function(contactId, itemId, qty) {
    if (typeof ContactsDB === 'undefined' || typeof CellariumSystem === 'undefined') return;
    const c = ContactsDB[contactId];
    const offer = c && c.buyOffer && c.buyOffer.items && c.buyOffer.items[itemId];
    if (!offer) return;
    // Giacomo je jen 3 dny "v přístavu" po příjezdu — mimo okno nelze nakoupit
    if (contactId === 'giacomo' && !CellariumSystem.isGiacomoPresent()) {
      const lang = (GameState.settings && GameState.settings.language) || 'cs';
      UI.notify(lang==='en' ? "Giacomo's ship is at sea — return after he arrives." : 'Giacomova loď je na moři — vrať se po jeho příjezdu.', true);
      return;
    }
    // Stationarius je v Olomouci jen po jarním/podzimním knižním veletrhu
    if (contactId === 'stationarius' && !CellariumSystem.isStationariusPresent()) {
      const lang = (GameState.settings && GameState.settings.language) || 'cs';
      UI.notify(lang==='en' ? 'The Stationarius travels between book fairs — he is not in Olomouc now.' : 'Stationarius cestuje mezi veletrhy — teď není v Olomouci.', true);
      return;
    }
    // Exkluzivní nabídka: gate na vztah (MRD bod 8)
    if (offer.minRelation && ((GameState.contactRelation || {})[contactId] || 0) < offer.minRelation) return;
    const soldToday = this._contactSoldToday(contactId, itemId);
    const left = Math.max(0, offer.stock - soldToday);
    qty = Math.max(0, Math.min(left, qty | 0));
    if (qty <= 0) { UI.notify('⚠️ ' + (((GameState.settings||{}).language)==='en' ? 'Sold out today.' : 'Dnes vyprodáno.'), true); return; }
    const total = offer.price * qty;
    if (CellariumSystem.getGrose() < total) { UI.notify('⚠️ Non habes sufficiens!', true); return; }
    CellariumSystem.addGrose(-total);
    Game.addItem(itemId, qty);
    GameState.contactShopSold.sold[contactId + ':' + itemId] = soldToday + qty;
    CellariumSystem.recordTransaction('buy', itemId, qty, offer.price, contactId);
    this.addContactRelation(contactId, 1);
    Game.save();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
    UI.notify('🛒 ' + itemName + ' ×' + qty + ' → -' + total + ' g');
    this.switchEntity('clientela');
  },

  // V4/S2: Zakázky u kontaktu (Sklář, Kameník...) — 1 slot NA KONTAKT, 48 h, 50 % záloha, doplatek při vyzvednutí, +2 vztah
  GLASS_ORDER_MS: 48 * 60 * 60 * 1000,

  orderFromContact: function(contactId, orderKey) {
    if (typeof ContactsDB === 'undefined') return;
    const c = ContactsDB[contactId];
    const ord = c && c.glassOrders && c.glassOrders[orderKey];
    if (!ord) return;
    if (!GameState.craftOrders) GameState.craftOrders = {};
    if (GameState.craftOrders[contactId]) { UI.notify('⚠️ Zakázka už běží — jedna najednou.', true); return; }
    const rel = (GameState.contactRelation || {})[contactId] || 0;
    if (ord.minRelation && rel < ord.minRelation) return;
    const deposit = Math.ceil(ord.price / 2);
    if (CellariumSystem.getGrose() < deposit) { UI.notify('⚠️ Non habes sufficiens! Záloha ' + deposit + ' g.', true); return; }
    CellariumSystem.addGrose(-deposit);
    GameState.craftOrders[contactId] = { itemId: ord.itemId, price: ord.price, deposit: deposit, readyAt: Date.now() + this.GLASS_ORDER_MS };
    Game.save();
    const itemName = (typeof iName === 'function') ? iName(ord.itemId) : ord.itemId;
    UI.notify('🔮 Zakázka přijata: ' + itemName + '. Hotovo za 48 h. Záloha ' + deposit + ' g.');
    this.switchEntity('clientela');
  },

  collectGlassOrder: function(contactId) {
    const o = GameState.craftOrders && GameState.craftOrders[contactId];
    if (!o || Date.now() < o.readyAt) return;
    const rest = o.price - o.deposit;
    if (CellariumSystem.getGrose() < rest) { UI.notify('⚠️ Doplatek ' + rest + ' g. Zakázka trpělivě čeká.', true); return; }
    CellariumSystem.addGrose(-rest);
    Game.addItem(o.itemId, 1);
    CellariumSystem.recordTransaction('buy', o.itemId, 1, o.price, contactId);
    this.addContactRelation(contactId, 2);
    const itemName = (typeof iName === 'function') ? iName(o.itemId) : o.itemId;
    const lang0 = (GameState.settings && GameState.settings.language) || 'cs';
    const contactName = ContactsDB[contactId] ? (lang0==='en' ? ContactsDB[contactId].name_en : ContactsDB[contactId].name) : '';
    delete GameState.craftOrders[contactId];
    Game.save();
    UI.notify('🔮 Zakázka vyzvednuta: ' + itemName + '.');
    Game.addKronikaEntry('minor', '🔮 ' + contactName + ' dodal zakázku: ' + itemName + '.', '🔮 ' + contactName + ' delivered a commission: ' + itemName + '.', '🔮 Opus traditum est.');
    this.switchEntity('clientela');
  },

  renderClientela: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const activeContact = GameState.ui && GameState.ui.clientelaContact;
    const rel = GameState.contactRelation || {};
    const researched = GameState.researchedTechs || [];

    let h = `<div style="margin-bottom:16px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold); padding:12px 14px;">`;
    h += `<div style="font-weight:bold; font-size:0.92rem; margin-bottom:4px;">🤝 ${lang==='en'?'Clientela — contacts beyond the walls':'Clientela — kontakty za zdmi kláštera'}</div>`;
    h += `<div style="font-size:0.72rem; opacity:0.65; margin-bottom:12px;">${lang==='en'
        ? 'Craftsmen and traders of the region. Good relations open better prices than the market.'
        : 'Řemeslníci a obchodníci kraje. Dobré vztahy otevřou lepší ceny než trh.'}</div>`;

    h += `<div style="display:flex; flex-wrap:wrap; gap:6px;">`;
    Object.keys(ContactsDB).forEach(id => {
      if (id === 'stationarius') return; // vlastní vstup v Knihovně, ne tady
      const c = ContactsDB[id];
      const unlocked = (!c.unlockTech || researched.includes(c.unlockTech))
                    && (!c.unlockBook || (GameState.library && GameState.library.readBooks && GameState.library.readBooks.includes(c.unlockBook)));
      const r = Math.min(100, Math.round(rel[id] || 0));
      if (unlocked) {
        const isActive = id === activeContact;
        h += `<div onclick="SaeculumSystem.openContact('${id}')" style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:${isActive ? 'rgba(197,160,89,0.22)' : 'rgba(255,255,255,0.4)'}; border:${isActive ? '2px solid var(--accent-wax)' : '1px solid rgba(197,160,89,0.4)'}; border-radius:8px; cursor:pointer;">
                <span style="font-size:1rem;">${c.icon}</span>
                <span style="font-size:0.72rem; font-weight:bold;">${lang==='en'?c.name_en:c.name}</span>
                <span style="font-size:0.62rem; opacity:0.6;">${r}%</span>
              </div>`;
      } else {
        h += `<div style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:rgba(0,0,0,0.04); border:1px dashed rgba(197,160,89,0.35); border-radius:8px; opacity:0.55;">
                <span style="font-size:1rem; filter:grayscale(1);">🔒</span>
                <span style="font-size:0.72rem;">???</span>
              </div>`;
      }
    });
    h += `</div></div>`;

    if (activeContact && typeof ContactsDB !== 'undefined' && ContactsDB[activeContact]) {
      h += this.renderContactPanel(activeContact);
    }
    return h;
  },

  // Obchodní panel kontaktu: hlavička + Nabídka | Výkup (+ Mola blok u Mlynáře od tier 3)
  renderContactPanel: function(id) {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const c = ContactsDB[id];
    const r = Math.min(100, Math.round((GameState.contactRelation || {})[id] || 0));
    const rColor = r >= 75 ? '#5a9a5a' : r >= 40 ? 'var(--accent-gold)' : '#8a8a8a';
    const axisName = (a) => a === 'village' ? (lang==='en'?'Saeculum (village)':'Saeculum (vesnice)')
                    : a === 'church' ? (lang==='en'?'Ecclesia (church)':'Ecclesia (církev)')
                    : (lang==='en'?'Schola (scholars)':'Schola (učenci)');

    let h = `<div style="margin-bottom:16px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold); padding:12px 14px;">`;
    // Hlavička
    h += `<div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:10px;">
            <div style="font-size:2.2rem;">${c.icon}</div>
            <div style="flex:1;">
              <div style="font-weight:bold; font-size:1rem;">${lang==='en'?c.name_en:c.name}</div>
              <div style="font-size:0.76rem; opacity:0.75; font-style:italic; margin:2px 0 6px;">${lang==='en'?c.desc_en:c.desc}</div>
              <div style="font-size:0.7rem; opacity:0.6;">🏛️ ${axisName(c.primaryAxis)}${c.secondaryAxis ? ` · ↳ ${lang==='en'?'echo':'ozvěna'}: ${axisName(c.secondaryAxis.axis)}` : ''}</div>
            </div>
            <div style="min-width:130px;">
              <div style="display:flex; justify-content:space-between; font-size:0.68rem; opacity:0.7; margin-bottom:2px;">
                <span>🤝 ${lang==='en'?'Relation':'Vztah'}</span><span>${r}/100</span>
              </div>
              <div style="background:rgba(0,0,0,0.12); border-radius:3px; height:5px;">
                <div style="width:${r}%; background:${rColor}; height:5px; border-radius:3px;"></div>
              </div>
            </div>
          </div>`;

    // 🩹 Chirurgus — hybrid hire, jedinej kontakt s touhle mechanikou
    if (id === 'chirurgus') {
      const hired = GameState.chirurgus && GameState.chirurgus.hired;
      h += `<div style="margin-bottom:12px; padding:10px; background:rgba(197,160,89,0.08); border-radius:6px;">`;
      if (hired) {
        h += `<div style="font-size:0.8rem;">🩹 ${lang==='en'?'In service of the monastery — 3 g/week.':'Slouží klášteru — 3 g/týden.'}</div>`;
      } else if (r >= 30) {
        h += `<button class="craft-btn" onclick="Game.hireChirurgus()">🩹 ${lang==='en'?'Hire (3 g/week)':'Najmout (3 g/týden)'}</button>`;
      } else {
        h += `<div style="font-size:0.78rem; opacity:0.6; font-style:italic;">${lang==='en'?'Needs relation 30+ to hire.':'Pro najmutí potřeba vztah 30+.'}</div>`;
      }
      h += `</div>`;
    }

    // Dva sloupce: Nabídka | Výkup
    h += `<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px; align-items:start;">`;

    // 🛒 Nabídka (kontakt prodává hráči)
    h += `<div><div style="font-size:0.7rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:8px; padding-bottom:4px; border-bottom:2px solid var(--accent-gold);">🛒 ${lang==='en'?'HIS OFFER':'NABÍDKA'}</div>`;
    const offerItems = c.buyOffer && c.buyOffer.items;
    if (offerItems && Object.keys(offerItems).length) {
      Object.keys(offerItems).forEach(itemId => {
        const o = offerItems[itemId];
        const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
        if (o.minRelation && r < o.minRelation) {
          h += `<div style="display:flex; align-items:center; gap:6px; font-size:0.78rem; margin-bottom:6px; opacity:0.5;">
                  <span style="flex:1;">🔒 ${itemName} <span style="opacity:0.7; font-style:italic;">(${lang==='en'?'from relation':'od vztahu'} ${o.minRelation})</span></span>
                </div>`;
          return;
        }
        const left = Math.max(0, o.stock - this._contactSoldToday(id, itemId));
        const grose = CellariumSystem.getGrose();
        h += `<div style="display:flex; align-items:center; gap:6px; font-size:0.78rem; margin-bottom:6px;">
                <span style="flex:1;">${itemName} <span style="opacity:0.6;">(${o.price} g/${lang==='en'?'pc':'ks'} · ${lang==='en'?'stock':'skladem'} ${left})</span></span>
                <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" ${left>0 && grose>=o.price ? '' : 'disabled'} onclick="SaeculumSystem.buyFromContact('${id}','${itemId}',1)">×1</button>
                <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" ${left>=5 && grose>=o.price*5 ? '' : 'disabled'} onclick="SaeculumSystem.buyFromContact('${id}','${itemId}',5)">×5</button>
              </div>`;
      });
    } else {
      h += `<div style="font-size:0.74rem; opacity:0.55; font-style:italic;">${lang==='en'?'Nothing on offer right now.':'Zatím nic nenabízí.'}</div>`;
    }
    h += `</div>`;

    // 💰 Výkup (hráč prodává kontaktu)
    h += `<div><div style="font-size:0.7rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:8px; padding-bottom:4px; border-bottom:2px solid var(--accent-gold);">💰 ${lang==='en'?'BUYING FROM YOU':'VÝKUP'} <span style="opacity:0.6; font-weight:normal; text-transform:none;">(+${Math.round((this.contactPriceMult(id)-1)*100)} % ${lang==='en'?'over market':'nad trh'})</span></div>`;
    const sbItems = c.sellBonus && c.sellBonus.items;
    if (sbItems && Object.keys(sbItems).length) {
      let anyStock = false;
      Object.keys(sbItems).forEach(itemId => {
        const have = GameState.inventory[itemId] || 0;
        if (have <= 0) return;
        anyStock = true;
        const basePrice = CellariumSystem.calcPrice(itemId, 'market') || sbItems[itemId] || 0;
        const price = Math.max(1, Math.round(basePrice * this.contactPriceMult(id)));
        const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
        h += `<div style="display:flex; align-items:center; gap:6px; font-size:0.78rem; margin-bottom:6px;">
                <span style="flex:1;">${itemName} <span style="opacity:0.6;">(${lang==='en'?'have':'máš'} ${have} · ${price} g/${lang==='en'?'pc':'ks'})</span></span>
                <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" onclick="SaeculumSystem.sellToContact('${id}','${itemId}',1)">×1</button>
                <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" onclick="SaeculumSystem.sellToContact('${id}','${itemId}',5)">×5</button>
                <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" onclick="SaeculumSystem.sellToContact('${id}','${itemId}','all')">${lang==='en'?'all':'vše'}</button>
              </div>`;
      });
      if (!anyStock) h += `<div style="font-size:0.74rem; opacity:0.55; font-style:italic;">${lang==='en'?'You have nothing he would buy right now.':'Nemáš teď nic, co by vykoupil.'}</div>`;
    } else {
      h += `<div style="font-size:0.74rem; opacity:0.55; font-style:italic;">${lang==='en'?'He buys nothing at the moment.':'Zatím nic nevykupuje.'}</div>`;
    }
    h += `</div>`;

    h += `</div>`; // konec sloupců

    // 🔮 Zakázky (V4/S2) — jen kontakt s glassOrders
    if (c.glassOrders && Object.keys(c.glassOrders).length) {
      h += `<div style="margin-top:14px;"><div style="font-size:0.7rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:8px; padding-bottom:4px; border-bottom:2px solid var(--accent-gold);">🔮 ${lang==='en'?'COMMISSIONS':'ZAKÁZKY'} <span style="opacity:0.6; font-weight:normal; text-transform:none;">(48 h · ${lang==='en'?'50 % deposit':'50 % záloha'})</span></div>`;
      const o = GameState.craftOrders && GameState.craftOrders[id];
      if (o) {
        const remH = Math.max(0, Math.ceil((o.readyAt - Date.now()) / 3600000));
        const oName = (typeof iName === 'function') ? iName(o.itemId) : o.itemId;
        if (remH > 0) {
          h += `<div style="font-size:0.78rem;">⏳ ${lang==='en'?'In work':'V práci'}: ${oName} — ${lang==='en'?'ready in':'hotovo za'} <strong>${remH} h</strong></div>`;
        } else {
          const rest = o.price - o.deposit;
          h += `<div style="font-size:0.78rem; margin-bottom:6px;">✅ ${oName} ${lang==='en'?'is ready':'je hotov'} — ${lang==='en'?'balance due':'doplatek'} ${rest} g</div>
                <button class="craft-btn" onclick="SaeculumSystem.collectGlassOrder('${id}')">📦 ${lang==='en'?'Collect':'Vyzvednout'}</button>`;
        }
      } else {
        Object.keys(c.glassOrders).forEach(key => {
          const ord = c.glassOrders[key];
          const itemName = (typeof iName === 'function') ? iName(ord.itemId) : ord.itemId;
          if (ord.minRelation && r < ord.minRelation) {
            h += `<div style="font-size:0.78rem; margin-bottom:5px; opacity:0.5;">🔒 ${itemName} <span style="opacity:0.7; font-style:italic;">(${lang==='en'?'from relation':'od vztahu'} ${ord.minRelation})</span></div>`;
            return;
          }
          const deposit = Math.ceil(ord.price / 2);
          h += `<div style="display:flex; align-items:center; gap:6px; font-size:0.78rem; margin-bottom:5px;">
                  <span style="flex:1;">${itemName} <span style="opacity:0.6;">(${ord.price} g · ${lang==='en'?'deposit':'záloha'} ${deposit} g)</span></span>
                  <button class="craft-btn" style="padding:2px 8px; font-size:0.7rem;" ${CellariumSystem.getGrose() >= deposit ? '' : 'disabled'} onclick="SaeculumSystem.orderFromContact('${id}','${key}')">${lang==='en'?'Order':'Objednat'}</button>
                </div>`;
        });
      }
      h += `</div>`;
    }

    // Mola blok — Mlynář od tier 3 (integrace, mechanika sendToMill/collectFromMill beze změny)
    if (id === 'mlynar') {
      h += `<div style="margin-top:14px;"><div style="font-size:0.7rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:8px; padding-bottom:4px; border-bottom:2px solid var(--accent-gold);">⚙️ ${t('saeculum.mola')}</div>`;
      h += this.renderMolaInner();
      h += `</div>`;
    }

    h += `</div>`;
    return h;
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
    // V2: nádobí — kapacita vs. počet bratrů
    const _TG = ['glass_goblet','glass_tankard','glass_jug','glass_bowl','glass_pitcher'];
    const _glassCap = _TG.reduce((s, id) => s + (GameState.inventory[id] || 0), 0);
    const _woodCap = GameState.inventory['wooden_bowl'] || 0;
    const _short = Math.max(0, list.length - _glassCap - _woodCap);
    h += `<div style="font-size:0.76rem; margin-bottom:6px; ${_short > 0 ? 'color:#c0392b;' : ''}">🍽️ ${lang==='en'?'Dishes':'Nádobí'}: ${lang==='en'?'glass':'sklo'} ${_glassCap} · ${lang==='en'?'wood':'dřevo'} ${_woodCap}${_short > 0 ? ` · ${lang==='en'?'short for':'chybí pro'} ${_short}` : ''}</div>`;
    const log = GameState.conversiMealLog;
    if (log) {
      const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
      const when = _toGameDate(log.ts).toLocaleDateString(lang==='en'?'en-GB':'cs-CZ');
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