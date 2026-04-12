// ============================================================
//  ATHANOR — Alchymistická laboratoř
//  src/systems/athanor.js
//  v1.0 | Scriptorium Phase 2
//
//  Závislosti: GameState, Game.addItem(), Game.removeItem(),
//              Game.save(), UI.notify()
//  Volání render: AthanorSystem.render('home-athanor-content')
//  Tick: AthanorSystem.tick() každé 2s z TimeSys nebo Game loop
// ============================================================

// ── DATA ────────────────────────────────────────────────────

const AthanorDB = {

  // ----------------------------------------------------------
  //  INGREDIENCE
  //  source: kde ji hráč získá
  //    'foraging'  = akce průzkum přírody
  //    'hunt'      = lov
  //    'trade'     = Starý Písař / barter
  //    'craft'     = vyrobí se z jiných itemů (už v ItemsDB)
  //    'existing'  = již v ItemsDB, žádná změna potřeba
  // ----------------------------------------------------------
  ingredients: [
    // ── EXISTUJÍCÍ v ItemsDB (žádná změna) ──
    {
      id: 'water',
      name: 'Voda',        name_lat: 'Aqua',
      rarity: 'common',    source: 'existing',
      color: '#6fa8dc',    icon: '💧',
      thermal: -2,         moisture: 4
    },
    {
      id: 'gum_arabic',
      name: 'Guma arabská', name_lat: 'Gummi Arabicum',
      rarity: 'uncommon',   source: 'existing',
      color: '#c9a96e',     icon: '🫙',
      thermal: 0,           moisture: 1
    },
    {
      id: 'gall_nut',
      name: 'Duběnka',     name_lat: 'Galla',
      rarity: 'uncommon',  source: 'existing',
      color: '#8b6914',    icon: '🌰',
      thermal: -1,         moisture: -2
    },
    {
      id: 'chalk',
      name: 'Křída',       name_lat: 'Creta',
      rarity: 'common',    source: 'existing',
      color: '#f0f0e8',    icon: '🪨',
      thermal: 0,          moisture: -1
    },
    {
      id: 'honey',
      name: 'Med',         name_lat: 'Mel',
      rarity: 'common',    source: 'existing',
      color: '#f0c040',    icon: '🍯',
      thermal: 2,          moisture: 2
    },

    // ── NOVÉ — přidat do ItemsDB ──
    {
      id: 'carbon_black',
      name: 'Saze',        name_lat: 'Carbo Niger',
      rarity: 'common',    source: 'foraging',
      color: '#1a1a1a',    icon: '🖤',
      thermal: 4,          moisture: -3,
      lore: 'Saze z krbu nebo loučí. Nejstarší černý pigment světa.',
      dropNote: 'Sbírej u krbu nebo z pochodně.'
    },
    {
      id: 'ochre',
      name: 'Okr',         name_lat: 'Ochra',
      rarity: 'common',    source: 'foraging',
      color: '#cc7722',    icon: '🟤',
      thermal: 1,          moisture: -2,
      lore: 'Žlutohnědá zemina bohatá na oxid železitý. Používána od pravěku.',
      dropNote: 'Nalézáš v jílovitých místech při průzkumu.'
    },
    {
      id: 'cinnabar',
      name: 'Rumělka',     name_lat: 'Cinnabaris',
      rarity: 'uncommon',  source: 'trade',
      color: '#c0392b',    icon: '🔴',
      thermal: 2,          moisture: -2,
      lore: 'Sulfid rtuťnatý. Zářivě červená barva, ale jedovatá. Rubrikátoři si olizovali štětce — a přicházeli o zuby.',
      dropNote: 'Nakoupíš u Starého Písaře.'
    },
    {
      id: 'lapis_lazuli',
      name: 'Lapis lazuli', name_lat: 'Lapis Lazuli',
      rarity: 'rare',       source: 'trade',
      color: '#1f4e91',     icon: '💎',
      thermal: -1,          moisture: 0,
      lore: 'Dražší než zlato. Dovážen z Afghánistánu. Barva Panny Marie. Jeptišky z Dalheim měly z něj modré zuby.',
      dropNote: 'Vzácné zboží — Starý Písař ho má jen občas.'
    },
    {
      id: 'verdigris',
      name: 'Měděnka',     name_lat: 'Viride Aeris',
      rarity: 'uncommon',  source: 'craft',
      color: '#2ecc71',    icon: '🟢',
      thermal: -1,         moisture: 1,
      lore: 'Zelenomodrá patina na mědi. Vzniká působením octa na měděný plech.',
      dropNote: 'Vyrobit: měděný plech + ocet (recept v dílně).'
    },
    {
      id: 'egg_tempera',
      name: 'Vaječná tempera', name_lat: 'Temperum Ovi',
      rarity: 'common',        source: 'craft',
      color: '#f5deb3',        icon: '🥚',
      thermal: 0,              moisture: 1,
      lore: 'Žloutek rozmíchaný s trochou vína. Nejstarší pojivo pigmentů v Evropě.',
      dropNote: 'Vyrobit: vejce + víno.'
    },
    {
      id: 'chamomile',
      name: 'Heřmánek',    name_lat: 'Chamomilla',
      rarity: 'common',    source: 'foraging',
      color: '#f0e68c',    icon: '🌼',
      thermal: -1,         moisture: 1,
      lore: 'Matka bylinek. Hildegarda z Bingenu ji doporučovala na žaludeční potíže i smutek duše.',
      dropNote: 'Roste na loukách při průzkumu.'
    },
    {
      id: 'st_johns_wort',
      name: 'Třezalka',    name_lat: 'Hypericum',
      rarity: 'common',    source: 'foraging',
      color: '#ffd700',    icon: '🌻',
      thermal: 2,          moisture: -2,
      lore: 'Bylina svatého Jana. Červený olej z jejích květů léčil rány i melancholii.',
      dropNote: 'Kvete v létě, sbírej při průzkumu.'
    },
    {
      id: 'beeswax',
      name: 'Včelí vosk',  name_lat: 'Cera Alba',
      rarity: 'uncommon',  source: 'foraging',
      color: '#f5c842',    icon: '🕯️',
      thermal: 1,          moisture: -1,
      lore: 'Čistý vosk z klášterního úlu. Pojivo masti i materiál pro pečetění listin.',
      dropNote: 'Nalézáš při průzkumu v blízkosti lesa.'
    }
  ],

  // ----------------------------------------------------------
  //  RECEPTY
  //  ingredients: pole { id, qty }
  //  result: { id, qty }  — přidá se do GameState.inventory
  //  effect: null | { type, value, duration_ms }
  //
  //  effect.type:
  //    'vigor_restore'  — GameState.vigor.current += value
  //    'hunger_extend'  — GameState.hunger.duration += value (ms)
  //    'craft_boost'    — uloží do activeEffects, craft speed ×value
  //    'ink_efficiency' — uloží do activeEffects, next N craftů ×0.5 spotřeba inkoustu
  //    null             — jen crafting material, žádný efekt
  // ----------------------------------------------------------
  recipes: [

    // ── TIER 1: Pigmenty a inkousty ──
    {
      id: 'rec_ink_carbon',
      name: 'Sazový inkoust',      name_lat: 'Atramentum Carboneum',
      icon: '🖤', tier: 1,          process: 'Mix',
      desc: 'Základní černý inkoust ze sazí. Levný, rychlý, vydrží staletí.',
      ingredients: [
        { id: 'carbon_black', qty: 2 },
        { id: 'gum_arabic',   qty: 1 },
        { id: 'water',        qty: 1 }
      ],
      result: { id: 'ink_carbon', qty: 2 },
      effect: null
    },
    {
      id: 'rec_ink_red',
      name: 'Červený inkoust',     name_lat: 'Atramentum Rubrum',
      icon: '🔴', tier: 1,          process: 'Mix',
      desc: 'Rumělkový inkoust pro rubriky a iniciály. Nakresli jím první písmeno kapitoly.',
      ingredients: [
        { id: 'cinnabar',   qty: 1 },
        { id: 'gum_arabic', qty: 1 },
        { id: 'water',      qty: 1 }
      ],
      result: { id: 'ink_red', qty: 1 },
      effect: null
    },
    {
      id: 'rec_pigment_yellow',
      name: 'Žlutý pigment',       name_lat: 'Pigmentum Ochreum',
      icon: '🟡', tier: 1,          process: 'Mix',
      desc: 'Okrový pigment v tempera pojivu. Pro iluminace zlatohnědých ploch.',
      ingredients: [
        { id: 'ochre',       qty: 2 },
        { id: 'egg_tempera', qty: 1 }
      ],
      result: { id: 'pigment_yellow', qty: 2 },
      effect: null
    },
    {
      id: 'rec_pigment_green',
      name: 'Zelený pigment',      name_lat: 'Pigmentum Viride',
      icon: '🟢', tier: 1,          process: 'Mix',
      desc: 'Měděnka v tempera. Krásná zelená, ale časem koroduje pergamen.',
      ingredients: [
        { id: 'verdigris',   qty: 1 },
        { id: 'egg_tempera', qty: 1 }
      ],
      result: { id: 'pigment_green', qty: 1 },
      effect: null
    },
    {
      id: 'rec_pigment_blue',
      name: 'Ultramarín',          name_lat: 'Pigmentum Lazuli',
      icon: '💙', tier: 1,          process: 'Mix',
      desc: 'Pigment z lapis lazuli. Dražší než zlato — vyhrazen pro roucho Panny Marie. Prestižní výzkumní bonus.',
      ingredients: [
        { id: 'lapis_lazuli', qty: 1 },
        { id: 'egg_tempera',  qty: 1 }
      ],
      result: { id: 'pigment_blue', qty: 1 },
      effect: {
        type: 'vigor_restore',
        value: 5,
        duration_ms: 0,
        label: 'Kontemplativní práce s pigmentem +5 vigor'
      }
    },

    // ── TIER 2: Consumables ──
    {
      id: 'rec_heřmánkový_odvar',
      name: 'Heřmánkový odvar',   name_lat: 'Infusum Chamomillae',
      icon: '🌼', tier: 2,          process: 'Boil',
      desc: 'Teplý odvar uklidní žaludek a obnoví síly. Hildegarda by schválila.',
      ingredients: [
        { id: 'chamomile', qty: 2 },
        { id: 'honey',     qty: 1 },
        { id: 'water',     qty: 1 }
      ],
      result: { id: 'potion_vigor_minor', qty: 1 },
      effect: {
        type: 'vigor_restore',
        value: 20,
        duration_ms: 0,
        label: 'Vigor +20'
      }
    },
    {
      id: 'rec_třezalkový_lektvar',
      name: 'Třezalkový lektvar',  name_lat: 'Potio Hyperici',
      icon: '🌻', tier: 2,           process: 'Boil',
      desc: 'Bylina svatého Jana žene pryč únavu i melancholii. Crafting rychleji po dobu 1 hodiny.',
      ingredients: [
        { id: 'st_johns_wort', qty: 2 },
        { id: 'honey',         qty: 1 },
        { id: 'water',         qty: 1 }
      ],
      result: { id: 'potion_craft_boost', qty: 1 },
      effect: {
        type: 'craft_boost',
        value: 1.5,
        duration_ms: 3600000,
        label: 'Crafting ×1.5 po dobu 1 hodiny'
      }
    },
    {
      id: 'rec_vosk_hojivý',
      name: 'Hojivá mast',         name_lat: 'Unguentum Sanativum',
      icon: '🕯️', tier: 2,          process: 'Mix',
      desc: 'Vosk s heřmánkem. Potírá rozmrzlé prsty a unavené zápěstí — prodlužuje sytost.',
      ingredients: [
        { id: 'beeswax',   qty: 1 },
        { id: 'chamomile', qty: 1 },
        { id: 'honey',     qty: 1 }
      ],
      result: { id: 'potion_hunger_remedy', qty: 1 },
      effect: {
        type: 'hunger_extend',
        value: 14400000,
        duration_ms: 0,
        label: 'Hlad se zpomalí o 4 hodiny'
      }
    }
  ]
};

// ── ENGINE ───────────────────────────────────────────────────

const AthanorSystem = {

  // Stavové efekty s expiry (craft_boost, ink_efficiency...)
  get activeEffects() {
    return GameState.athanor ? GameState.athanor.activeEffects : [];
  },

  // ── INIT ──────────────────────────────────────────────────
  init() {
    if (!GameState.athanor) {
      GameState.athanor = { activeEffects: [] };
    }
    // Spustí tick každé 2s
    setInterval(() => AthanorSystem.tick(), 2000);
  },

  // ── TICK (každé 2s) ───────────────────────────────────────
  tick() {
    if (!GameState.athanor) return;
    const now = Date.now();
    const before = GameState.athanor.activeEffects.length;
    GameState.athanor.activeEffects = GameState.athanor.activeEffects.filter(e => e.expiresAt > now);
    if (GameState.athanor.activeEffects.length !== before) {
      // Efekt vypršel — překresli pokud je tab otevřen
      const el = document.getElementById('home-athanor-content');
      if (el && el.style.display !== 'none') AthanorSystem.renderActiveEffects();
    }
  },

  // ── CRAFT ─────────────────────────────────────────────────
  craft(recipeId) {
    const recipe = AthanorDB.recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Zkontroluj ingredience
    for (const ing of recipe.ingredients) {
      const have = GameState.inventory[ing.id] || 0;
      if (have < ing.qty) {
        UI.notify('⚗️ Nemáš dostatek surovin.', true);
        return;
      }
    }

    // Odečti ingredience
    recipe.ingredients.forEach(i => Game.removeItem(i.id, i.qty));

    // Přidej výsledek do inventáře
    Game.addItem(recipe.result.id, recipe.result.qty);

    // Aplikuj efekt (pokud má)
    if (recipe.effect) {
      AthanorSystem.applyEffect(recipe.effect, recipe.name);
    }

    Game.save();

    UI.notify(`⚗️ Uvařeno: ${recipe.name}${recipe.effect ? ' — ' + recipe.effect.label : ''}`);

    // Překresli panel
    AthanorSystem.render('home-athanor-content');
  },

  // ── APPLY EFFECT ──────────────────────────────────────────
  applyEffect(effect, sourceName) {
    const now = Date.now();

    switch (effect.type) {

      case 'vigor_restore':
        if (!GameState.vigor) break;
        GameState.vigor.current = Math.min(
          GameState.vigor.max,
          GameState.vigor.current + effect.value
        );
        break;

      case 'hunger_extend':
        if (!GameState.hunger) break;
        GameState.hunger.duration = (GameState.hunger.duration || 0) + effect.value;
        GameState.hunger.fed = true;
        break;

      case 'craft_boost':
        GameState.athanor.activeEffects = GameState.athanor.activeEffects.filter(
          e => e.type !== 'craft_boost'
        );
        GameState.athanor.activeEffects.push({
          type: 'craft_boost',
          value: effect.value,
          label: effect.label,
          source: sourceName,
          expiresAt: now + effect.duration_ms
        });
        break;

      case 'ink_efficiency':
        GameState.athanor.activeEffects = GameState.athanor.activeEffects.filter(
          e => e.type !== 'ink_efficiency'
        );
        GameState.athanor.activeEffects.push({
          type: 'ink_efficiency',
          value: effect.value,
          label: effect.label,
          source: sourceName,
          expiresAt: now + effect.duration_ms
        });
        break;
    }
  },

  // ── QUERY HELPERS (volej z Game.craft() pro boost) ────────
  getCraftSpeedMultiplier() {
    const boost = GameState.athanor?.activeEffects.find(e => e.type === 'craft_boost');
    return boost ? boost.value : 1.0;
  },

  hasInkEfficiency() {
    return GameState.athanor?.activeEffects.some(e => e.type === 'ink_efficiency') || false;
  },

  // ── RENDER ────────────────────────────────────────────────
  render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    // PASSWORD GATE — deleguj na SecretsSystem pokud není odemčeno
    if (!GameState.secrets || !GameState.secrets.laboratoryUnlocked) {
      SecretsSystem.renderAthanorScreen(containerId);
      return;
    }

    const ingMap = {};
    AthanorDB.ingredients.forEach(i => { ingMap[i.id] = i; });

    // Aktivní efekty
    const effectsHtml = AthanorSystem.buildActiveEffectsHtml();

    // Recepty po tierech
    const tier1 = AthanorDB.recipes.filter(r => r.tier === 1);
    const tier2 = AthanorDB.recipes.filter(r => r.tier === 2);

    el.innerHTML = `
      <div style="padding:16px;max-width:700px;margin:0 auto;">

        <!-- Hlavička -->
        <div style="text-align:center;margin-bottom:20px;">
          <h2 style="font-family:'Cinzel',serif;font-size:1.3rem;color:var(--accent-gold);letter-spacing:2px;">
            ⚗️ Athanor Secretus
          </h2>
          <p style="font-style:italic;font-size:0.8rem;opacity:0.6;margin-top:4px;">
            Ignis latet in cinere — Oheň se skrývá v popelu
          </p>
        </div>

        <!-- Aktivní efekty -->
        ${effectsHtml}

        <!-- Tier 1 -->
        <div class="panel-title" style="margin-bottom:12px;">🎨 Pigmenty a inkousty</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;">
          ${tier1.map(r => AthanorSystem.buildRecipeCard(r, ingMap)).join('')}
        </div>

        <!-- Tier 2 -->
        <div class="panel-title" style="margin-bottom:12px;">🌿 Lektvary a masti</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${tier2.map(r => AthanorSystem.buildRecipeCard(r, ingMap)).join('')}
        </div>

        <!-- Ingredience k získání -->
        <div class="panel-title" style="margin-top:24px;margin-bottom:12px;">🌱 Suroviny — jak je získat</div>
        ${AthanorSystem.buildIngredientGuide()}

      </div>
    `;
  },

  buildRecipeCard(recipe, ingMap) {
    const canCraft = recipe.ingredients.every(i => (GameState.inventory[i.id] || 0) >= i.qty);

    const ingList = recipe.ingredients.map(i => {
      const have = GameState.inventory[i.id] || 0;
      const ok = have >= i.qty;
      const ing = ingMap[i.id];
      return `<span style="color:${ok ? 'var(--accent-gold)' : '#999'};font-size:0.78rem;">
        ${ing ? ing.icon : '?'} ${ing ? ing.name : i.id} ×${i.qty}
        <span style="opacity:0.6">(máš: ${have})</span>
      </span>`;
    }).join('<span style="opacity:0.4;margin:0 4px;">+</span>');

    const tierColors = { 1: '#8b6914', 2: '#2c6e49' };
    const processIcons = { Mix: '🥣', Boil: '🔥', Distill: '💨' };

    return `
      <div style="
        background:rgba(0,0,0,0.04);
        border:1px solid rgba(0,0,0,0.12);
        border-radius:6px;
        padding:12px 14px;
        border-left:3px solid ${tierColors[recipe.tier] || '#666'};
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-size:1.1rem;">${recipe.icon}</span>
            <strong style="font-size:0.95rem;margin-left:6px;">${recipe.name}</strong>
            <span style="font-style:italic;font-size:0.75rem;opacity:0.55;margin-left:6px;">${recipe.name_lat}</span>
            <span style="font-size:0.7rem;opacity:0.5;margin-left:8px;">${processIcons[recipe.process] || ''} ${recipe.process}</span>
          </div>
          <button
            onclick="AthanorSystem.craft('${recipe.id}')"
            style="
              padding:5px 14px;
              background:${canCraft ? 'var(--accent-gold)' : 'rgba(0,0,0,0.08)'};
              color:${canCraft ? '#1a1410' : '#999'};
              border:1px solid ${canCraft ? 'var(--accent-gold)' : 'rgba(0,0,0,0.15)'};
              border-radius:4px;
              font-size:0.8rem;
              cursor:${canCraft ? 'pointer' : 'not-allowed'};
              font-family:inherit;
            "
            ${canCraft ? '' : 'disabled'}
          >Uvař</button>
        </div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
          ${ingList}
          <span style="opacity:0.4;margin:0 4px;">→</span>
          <span style="font-size:0.78rem;color:var(--accent-gold);">
            ${recipe.result.qty}× ${recipe.result.id.replace(/_/g,' ')}
          </span>
        </div>
        <div style="margin-top:6px;font-size:0.76rem;opacity:0.6;font-style:italic;">${recipe.desc}</div>
        ${recipe.effect ? `<div style="margin-top:4px;font-size:0.74rem;color:#2c6e49;">✨ ${recipe.effect.label}</div>` : ''}
      </div>
    `;
  },

  buildActiveEffectsHtml() {
    if (!GameState.athanor?.activeEffects?.length) return '';
    const now = Date.now();
    const items = GameState.athanor.activeEffects.map(e => {
      const remaining = Math.max(0, e.expiresAt - now);
      const mins = Math.ceil(remaining / 60000);
      return `<span style="font-size:0.78rem;background:rgba(44,110,73,0.15);border:1px solid rgba(44,110,73,0.3);border-radius:12px;padding:3px 10px;color:#2c6e49;">
        ✨ ${e.label} — zbývá ${mins} min
      </span>`;
    }).join('');
    return `
      <div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:rgba(44,110,73,0.05);border-radius:6px;">
        <span style="font-size:0.72rem;opacity:0.5;width:100%;margin-bottom:4px;">Aktivní efekty:</span>
        ${items}
      </div>
    `;
  },

  renderActiveEffects() {
    const el = document.getElementById('athanor-active-effects');
    if (el) el.outerHTML = AthanorSystem.buildActiveEffectsHtml() || '<div id="athanor-active-effects"></div>';
  },

  buildIngredientGuide() {
    const newOnes = AthanorDB.ingredients.filter(i => i.source !== 'existing');
    const bySource = {};
    newOnes.forEach(i => {
      if (!bySource[i.source]) bySource[i.source] = [];
      bySource[i.source].push(i);
    });

    const sourceLabels = {
      foraging: '🌿 Průzkum přírody',
      hunt: '🏹 Lov',
      trade: '📦 Starý Písař',
      craft: '🔨 Výroba'
    };

    return Object.entries(bySource).map(([src, ings]) => `
      <div style="margin-bottom:12px;">
        <div style="font-size:0.78rem;font-weight:600;opacity:0.7;margin-bottom:6px;">${sourceLabels[src] || src}</div>
        ${ings.map(i => `
          <div style="display:flex;gap:8px;align-items:baseline;margin-bottom:4px;">
            <span style="font-size:0.85rem;">${i.icon}</span>
            <span style="font-size:0.82rem;"><strong>${i.name}</strong>
              <span style="font-style:italic;opacity:0.55;font-size:0.75rem;">${i.name_lat}</span></span>
            <span style="font-size:0.75rem;opacity:0.5;">— ${i.dropNote}</span>
          </div>
        `).join('')}
      </div>
    `).join('');
  }
};