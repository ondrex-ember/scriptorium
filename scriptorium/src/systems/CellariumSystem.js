// ═══════════════════════════════════════════════════════════════════════════════
// CELLARIUM SYSTEM v8.1 — Economy & Barter
// Pražský groš · Benedikt z Litomyšle · Hospoda / Obchod / Trh
// ═══════════════════════════════════════════════════════════════════════════════

const CellariumSystem = {

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════

  init: function() {
    if (!GameState.treasury) {
      GameState.treasury = {
        grose: 0        // 💰 Pražský groš
      };
    }
    // Migrate old save: silver → grose
    if (GameState.treasury.silver !== undefined) {
      GameState.treasury.grose = (GameState.treasury.grose || 0) + (GameState.treasury.silver || 0);
      delete GameState.treasury.silver;
      delete GameState.treasury.wine;
      delete GameState.treasury.grain;
    }

    if (!GameState.economy) {
      GameState.economy = {
        lastGiacomoVisit: 0,    // timestamp poslední návštěvy Giacoma
        lastHeinrichVisit: 0,   // timestamp poslední návštěvy Heinricha Traxdorfa
        tradesTotal: 0          // celkový počet transakcí
      };
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS — RESEARCH GATES
  // ═══════════════════════════════════════════════════════════════════════════

  hasCommercium:   function() { return GameState.researchedTechs.includes('tech_commercium'); },
  hasCellarium:    function() { return GameState.researchedTechs.includes('tech_cellarium_rd2'); },
  hasNumismatica:  function() { return GameState.researchedTechs.includes('tech_numismatica'); },

  // ═══════════════════════════════════════════════════════════════════════════
  // TREASURY — GROŠE
  // ═══════════════════════════════════════════════════════════════════════════

  getGrose: function() {
    return GameState.treasury.grose || 0;
  },

  addGrose: function(amount) {
    if (!GameState.treasury) GameState.treasury = { grose: 0 };
    GameState.treasury.grose = (GameState.treasury.grose || 0) + amount;
    Game.save();
    this.refreshGroseDisplay();
  },

  spendGrose: function(amount) {
    if (this.getGrose() < amount) return false;
    GameState.treasury.grose -= amount;
    Game.save();
    this.refreshGroseDisplay();
    return true;
  },

  refreshGroseDisplay: function() {
    const el = document.getElementById('cellarium-grose-count');
    if (el) el.textContent = this.getGrose();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME WINDOW — je daná entita otevřena?
  // Hospoda: každý den 14:00–02:00
  // Obchod:  Po–Pá 09:00–17:00
  // Trh:     So–Ne 08:00–16:00
  // ═══════════════════════════════════════════════════════════════════════════

  isEntityOpen: function(entity) {
    const now  = new Date();
    const hour = now.getHours();
    const day  = now.getDay(); // 0=Ne, 1=Po ... 6=So

    if (entity === 'tavern') {
      // 14:00–23:59 nebo 00:00–01:59
      return hour >= 14 || hour < 2;
    }
    if (entity === 'shop') {
      // Po–Pá, 09–17
      return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
    }
    if (entity === 'market') {
      // So–Ne, 08–16
      return (day === 0 || day === 6) && hour >= 8 && hour < 16;
    }
    return false;
  },

  // Textový popis otevírací doby
  entityHoursLabel: function(entity) {
    if (entity === 'tavern')  return 'každý den 14:00–02:00';
    if (entity === 'shop')    return 'Po–Pá 09:00–17:00';
    if (entity === 'market')  return 'So–Ne 08:00–16:00';
    return '';
  },

  entityHoursLabel_en: function(entity) {
    if (entity === 'tavern')  return 'daily 14:00–02:00';
    if (entity === 'shop')    return 'Mon–Fri 09:00–17:00';
    if (entity === 'market')  return 'Sat–Sun 08:00–16:00';
    return '';
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CENÍK — základní ceny per item (groše)
  // Každá entita má vlastní koeficient (Hospoda platí míň za suroviny, víc za jídlo)
  // Při každém otevření se aplikuje náhodný offset ±15%
  // ═══════════════════════════════════════════════════════════════════════════

  BASE_PRICES: {
    // Lore / Psaní
    paper:          2,
    ink:            2,
    ink_gallic:     5,
    vellum:        12,
    common_codex:   8,
    luxury_codex:  20,
    vellum_codex:  45,
    research:       3,
    // Jídlo
    bread:          1,
    cooked_meat:    3,
    cooked_fish:    2,
    stew:           4,
    mushroom_soup:  3,
    berry_pie:      3,
    honey:          4,
    // Suroviny
    fiber:          1,
    bark:           1,
    hide:           4,
    leather:        6,
    bone:           1,
    feather:        1,
    resin:          2,
    charcoal:       1,
    // Byliny
    herb_red:       2,
    herb_yellow:    2,
    herb_blue:      3,
    roots:          2,
    // Alchymie
    potion_heal:    6,
    antidote:       8,
    stamina_tonic:  7,
    preservation_oil: 8,
    candle:         2,
    // Nápoje
    beer:           2,
    wine:           5,
    // Suroviny — nové
    chalk:          2,
    // Leather system
    metal:          15,
    glue:           6,
    tallow:         4,
    sealant:        12,
    bellows:        40,
    book_binding:   25,
    // Varhany — Heinrich Traxdorf (fixed price, prodej jen přes NPC modal)
    organ:          600,
    // Herní desky (jen nákup, ne prodej)
    senet_board:    6,
    backgammon_board: 10,
    draughts_board:  8,
    hnefatafl_board: 15,
    // Ovoce ze sadu (Pomarium)
    apple:          2,
    pear:           2,
    plum:           2,
    cherry:         2,
    walnut:         4,
    mulberry:       3,
    quince:         3,
    sorb:           5,
    rowan:          1,
    linden_fruit:   2,
    // Produkty dvora (Curia)
    egg:            2,
    milk:           3,
    wool:           5,
    raw_hide:       4,
    feather_hen:    1,
    pollen:         3,
    linden_blossom: 3,
    beeswax:        6,
    // Semena (prodej přebytku — cca polovina nákupní ceny)
    seed_apple:     4,
    seed_pear:      4,
    seed_plum:      3,
    seed_cherry:    4,
    seed_walnut:    7,
    seed_mulberry:  6,
    seed_quince:    5,
    seed_sorb:      9,
    seed_rowan:     4,
    seed_linden:    7,
    // Rybník (Piscina)
    fry:            3,
    carp_young:     5,
    carp:           8,
    // Produkty Gallinarium & Ovile
    chicken_meat:   4,
    mutton:         6,
    lamb_hide:      8,
    chick:          3,
    lamb:           5,
  },

  // Koeficienty per entita (prodej hráče → entita)
  ENTITY_COEFF: {
    tavern:  { food: 1.3, lore: 0.6, mat: 0.7, alchemy: 0.9 },
    shop:    { food: 0.8, lore: 1.0, mat: 1.0, alchemy: 1.0 },
    market:  { food: 1.0, lore: 1.1, mat: 1.1, alchemy: 1.1 },
  },

  ITEM_CAT: {
    paper: 'lore', ink: 'lore', ink_gallic: 'lore', vellum: 'lore',
    common_codex: 'lore', luxury_codex: 'lore', vellum_codex: 'lore', research: 'lore',
    bread: 'food', cooked_meat: 'food', cooked_fish: 'food', stew: 'food',
    mushroom_soup: 'food', berry_pie: 'food', honey: 'food',
    fiber: 'mat', bark: 'mat', hide: 'mat', leather: 'mat', bone: 'mat',
    feather: 'mat', resin: 'mat', charcoal: 'mat',
    herb_red: 'mat', herb_yellow: 'mat', herb_blue: 'mat', roots: 'mat',
    chalk: 'mat',
    metal: 'mat', glue: 'mat', tallow: 'mat', sealant: 'mat',
    bellows: 'tool', book_binding: 'tool', organ: 'tool',
    senet_board: 'tool', backgammon_board: 'tool', draughts_board: 'tool', hnefatafl_board: 'tool',
    potion_heal: 'alchemy', antidote: 'alchemy', stamina_tonic: 'alchemy',
    beer: 'food', wine: 'food',
    preservation_oil: 'alchemy', candle: 'alchemy',
    // Ovoce
    apple: 'food', pear: 'food', plum: 'food', cherry: 'food',
    walnut: 'food', mulberry: 'food', quince: 'food', sorb: 'food',
    rowan: 'food', linden_fruit: 'mat',
    // Produkty dvora
    egg: 'food', milk: 'food', wool: 'mat', raw_hide: 'mat',
    feather_hen: 'mat', pollen: 'mat', linden_blossom: 'mat', beeswax: 'mat',
    // Semena
    seed_apple: 'mat', seed_pear: 'mat', seed_plum: 'mat', seed_cherry: 'mat',
    seed_walnut: 'mat', seed_mulberry: 'mat', seed_quince: 'mat', seed_sorb: 'mat',
    seed_rowan: 'mat', seed_linden: 'mat',
    fry: 'mat', carp_young: 'mat', carp: 'food_raw',
    chicken_meat: 'food', mutton: 'food',
    lamb_hide: 'mat', chick: 'mat', lamb: 'mat',
  },

  // Výpočet ceny s náhodným offsetem (seed per den+entita pro konzistenci v rámci dne)
  calcPrice: function(itemId, entity) {
    const base = this.BASE_PRICES[itemId];
    if (!base) return null;
    const cat   = this.ITEM_CAT[itemId] || 'mat';
    const coeff = this.ENTITY_COEFF[entity][cat] || 1.0;
    // Denní seed pro konzistentní ceny během dne
    const today = new Date();
    const seed  = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    const pseudoRand = ((seed * 9301 + entity.charCodeAt(0) * 49297 + itemId.charCodeAt(0) * 233) % 1000) / 1000;
    const offset = 0.85 + pseudoRand * 0.30; // 0.85–1.15
    return Math.max(1, Math.round(base * coeff * offset));
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SELL — hráč prodává item entitě
  // ═══════════════════════════════════════════════════════════════════════════

  sellItem: function(itemId, qty, entity) {
    if (!this.hasNumismatica()) return;
    if (!this.isEntityOpen(entity)) {
      UI.notify('⚠️ Clausum est. — Zavřeno.', true);
      return;
    }
    const have = GameState.inventory[itemId] || 0;
    if (have < qty) {
      UI.notify('⚠️ Non habes sufficiens!', true);
      return;
    }
    const price = this.calcPrice(itemId, entity);
    if (!price) return;
    const total = price * qty;
    Game.removeItem(itemId, qty);
    this.addGrose(total);
    GameState.economy.tradesTotal++;
    Game.save();
    const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
    UI.notify(t('cellarium.soldNotify').replace('{total}', total).replace('{qty}', qty).replace('{item}', itemName));
    this.renderCellariumContent();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUY — entita prodává hráči (special item per entita)
  // ═══════════════════════════════════════════════════════════════════════════

  ENTITY_SHOP: {
    tavern: [
      { itemId: 'stamina_tonic', basePrice: 8 },
      { itemId: 'beer',          basePrice: 2 },
      { itemId: 'wine',          basePrice: 7 },
    ],
    shop: [
      { itemId: 'chalk',         basePrice: 2 },
      { itemId: 'wine',          basePrice: 4 },
    ],
    market: [
      { itemId: 'paper',         basePrice: 3 },
      // Zvířata
      { itemId: 'hen_white',     basePrice: 15 },
      { itemId: 'hen_black',     basePrice: 18 },
      { itemId: 'hen_colored',   basePrice: 25 },
      { itemId: 'rooster',       basePrice: 20 },
      { itemId: 'sheep',         basePrice: 35 },
      { itemId: 'queen_bee',     basePrice: 40 },
      // Semena stromů — drahá
      { itemId: 'seed_apple',    basePrice: 8  },
      { itemId: 'seed_pear',     basePrice: 8  },
      { itemId: 'seed_plum',     basePrice: 7  },
      { itemId: 'seed_cherry',   basePrice: 9  },
      { itemId: 'seed_walnut',   basePrice: 15 },
      { itemId: 'seed_mulberry', basePrice: 12 },
      { itemId: 'seed_quince',   basePrice: 10 },
      { itemId: 'seed_sorb',     basePrice: 18 },
      { itemId: 'seed_rowan',    basePrice: 8  },
      { itemId: 'seed_linden',   basePrice: 14 },
      // Rybník
      { itemId: 'fry',           basePrice: 5  },
    ],
  },

  buyItem: function(entity, itemId) {
    if (!this.hasNumismatica()) return;
    if (!this.isEntityOpen(entity)) {
      UI.notify(t('cellarium.closed'), true);
      return;
    }
    const shopList = this.ENTITY_SHOP[entity];
    if (!shopList) return;
    const shopEntry = shopList.find(s => s.itemId === itemId);
    if (!shopEntry) return;
    const price = this.calcBuyPrice(itemId, entity, shopEntry.basePrice);
    if (this.getGrose() < price) {
      UI.notify(t('cellarium.noGrose'), true);
      return;
    }
    this.spendGrose(price);
    Game.addItem(itemId, 1);
    // Aplikuj efekt nápoje (pivo/víno)
    CellariumSystem.applyDrinkEffect(itemId);
    GameState.economy.tradesTotal++;
    Game.save();
    const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
    UI.notify(t('cellarium.boughtNotify').replace('{qty}', 1).replace('{item}', itemName).replace('{total}', price));
    this.renderCellariumContent();
  },

  applyDrinkEffect: function(itemId) {
    if (itemId === 'beer') {
      // Pivo: zažene hlad, ale otupí mysl (vigor dolů)
      if (GameState.hunger) {
        GameState.hunger.duration = (GameState.hunger.duration || 0) + 7200000; // +2h
        GameState.hunger.fed = true;
      }
      if (GameState.vigor) {
        GameState.vigor.current = Math.max(0, GameState.vigor.current - 10);
      }
      UI.notify('🍺 Lupulin — hlad zažehnán, mysl trochu zakalena.', false);
    } else if (itemId === 'wine') {
      // Víno: in vino veritas — drobný crafting boost, ale vigor dolů
      if (GameState.vigor) {
        GameState.vigor.current = Math.max(0, GameState.vigor.current - 15);
      }
      if (GameState.athanor) {
        const expiresAt = Date.now() + 1800000; // 30 min
        GameState.athanor.activeEffects = GameState.athanor.activeEffects.filter(e => e.type !== 'craft_boost');
        GameState.athanor.activeEffects.push({
          type: 'craft_boost',
          value: 1.1,
          label: 'In vino veritas — Crafting ×1.1 / 30 min',
          source: 'wine',
          expiresAt
        });
      }
      UI.notify('🍷 In vino veritas — ruka písaře se uvolnila.', false);
    }
  },

  calcBuyPrice: function(itemId, entity, basePrice) {
    const shopList = this.ENTITY_SHOP[entity];
    if (!shopList) return 0;
    // Pokud basePrice není předán, najdi ho
    const entry = shopList.find(s => s.itemId === itemId);
    const base = basePrice !== undefined ? basePrice : (entry ? entry.basePrice : 0);
    if (!base) return 0;
    const today = new Date();
    const seed  = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    const pseudoRand = ((seed * 9301 + entity.charCodeAt(0) * 49297 + itemId.charCodeAt(0) * 233 + 777) % 1000) / 1000;
    const offset = 0.85 + pseudoRand * 0.30;
    return Math.max(1, Math.round(base * offset));
  },

  renderBuyPanel: function(entity, lang) {
    const shopList = this.ENTITY_SHOP[entity];
    if (!shopList || shopList.length === 0) return '';
    const buyLabel = lang === 'en' ? 'BUY' : 'NÁKUP';
    const cards = shopList.map(entry => {
      const item = ItemsDB[entry.itemId];
      const icon = (item && item.icon) ? item.icon : '📦';
      const name = (typeof iName === 'function') ? iName(entry.itemId) : (item ? item.name : entry.itemId);
      const price = this.calcBuyPrice(entry.itemId, entity, entry.basePrice);
      const canAfford = this.getGrose() >= price;
      return `
        <div style="padding:8px 10px; background:rgba(197,160,89,0.06);
                    border-radius:6px; border:1px solid rgba(197,160,89,0.2);
                    display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.4rem; min-width:28px; text-align:center;">${icon}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:bold; font-size:0.82rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
            <div style="font-size:0.72rem; opacity:0.65;">${price} 💰</div>
          </div>
          <button onclick="CellariumSystem.buyItem('${entity}','${entry.itemId}')"
                  class="craft-btn"
                  style="padding:3px 10px; font-size:0.75rem; flex-shrink:0;"
                  ${canAfford ? '' : 'disabled'}>
            ${lang === 'en' ? 'Buy' : 'Koupit'}
          </button>
        </div>
      `;
    }).join('');
    return `
      <div style="margin-bottom:0;">
        <div style="font-size:0.7rem; font-weight:bold; letter-spacing:0.08em;
                    text-transform:uppercase; color:var(--accent-gold);
                    margin-bottom:8px; padding-bottom:4px;
                    border-bottom:2px solid var(--accent-gold);">
          📥 ${buyLabel}
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:6px;">
          ${cards}
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GIACOMO EVENT — weekly check
  // ═══════════════════════════════════════════════════════════════════════════

  checkGiacomoEvent: function() {
    if (!this.hasCommercium()) return;
    const now  = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    if (now - (GameState.economy.lastGiacomoVisit || 0) >= week) {
      GameState.economy.lastGiacomoVisit = now;
      Game.save();
      this.showGiacomoArrival();
    }
    // Heinrich Traxdorf — varhanář z Norimberka
    this.checkHeinrichEvent();
  },

  showGiacomoArrival: function() {
    // Show modal
    let existing = document.getElementById('giacomo-modal');
    if (existing) existing.remove();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const modal = document.createElement('div');
    modal.id = 'giacomo-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div style="background:var(--bg-parchment);border:2px solid var(--accent-gold);border-radius:12px;
                  max-width:480px;width:90%;padding:30px;position:relative;box-shadow:0 8px 40px rgba(0,0,0,0.5);">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:4rem;margin-bottom:8px;">⛵</div>
          <div style="font-family:'Cinzel Decorative';font-size:1.1rem;color:var(--accent-gold);">
            ${t('cellarium.giacomoTitle')}
          </div>
          <div style="font-size:0.8rem;opacity:0.65;font-style:italic;margin-top:4px;">
            ${t('cellarium.giacomoSubtitle')}
          </div>
        </div>
        <div style="font-style:italic;font-size:0.9rem;opacity:0.85;margin-bottom:24px;
                    padding:15px;background:rgba(197,160,89,0.08);border-radius:8px;
                    border-left:3px solid var(--accent-gold);">
          ${t('cellarium.giacomoGreeting')}
        </div>
        <div style="display:flex;gap:10px;">
          <button onclick="document.getElementById('giacomo-modal').remove()"
                  class="craft-btn" style="flex:1;">
            ${t('cellarium.giacomoBtnClose')}
          </button>
          <button onclick="document.getElementById('giacomo-modal').remove(); UI.switchScreen('home', document.getElementById('nav-home')); UI.switchHomeTab('cellarium', document.getElementById('home-tab-cellarium')); CellariumSystem.switchEntity('market');"
                  class="craft-btn" style="flex:1;background:var(--accent-gold);color:var(--bg-parchment);">
            ${t('cellarium.giacomoBtnVisit')}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEINRICH TRAXDORF EVENT — weekly organ merchant
  // ═══════════════════════════════════════════════════════════════════════════

  hasOrganum: function() {
    return GameState.researchedTechs && GameState.researchedTechs.includes('tech_organum_hydraulicum');
  },

  checkHeinrichEvent: function() {
    if (!this.hasOrganum()) return;
    const now  = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    if (now - (GameState.economy.lastHeinrichVisit || 0) >= week) {
      GameState.economy.lastHeinrichVisit = now;
      Game.save();
      this.showHeinrichArrival();
    }
  },

  showHeinrichArrival: function() {
    let existing = document.getElementById('heinrich-modal');
    if (existing) existing.remove();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const modal = document.createElement('div');
    modal.id = 'heinrich-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    const title    = t('cellarium.heinrichTitle');
    const subtitle = t('cellarium.heinrichSubtitle');
    const greeting = t('cellarium.heinrichGreeting');
    const btnClose = t('cellarium.heinrichBtnClose');
    const btnBuy   = t('cellarium.heinrichBtnBuy');
    const alreadyHas = (GameState.inventory['organ'] || 0) > 0;
    const canAfford  = this.getGrose() >= 600;

    modal.innerHTML = `
      <div style="background:var(--bg-parchment);border:2px solid var(--accent-gold);border-radius:12px;
                  max-width:480px;width:90%;padding:30px;position:relative;box-shadow:0 8px 40px rgba(0,0,0,0.5);">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:4rem;margin-bottom:8px;">🎹</div>
          <div style="font-family:'Cinzel Decorative';font-size:1.1rem;color:var(--accent-gold);">${title}</div>
          <div style="font-size:0.8rem;opacity:0.65;font-style:italic;margin-top:4px;">${subtitle}</div>
        </div>
        <div style="font-style:italic;font-size:0.9rem;opacity:0.85;margin-bottom:24px;
                    padding:15px;background:rgba(197,160,89,0.08);border-radius:8px;
                    border-left:3px solid var(--accent-gold);">
          ${greeting}
        </div>
        ${alreadyHas ? `<div style="font-size:0.85rem;opacity:0.7;margin-bottom:16px;text-align:center;">${t('cellarium.heinrichAlready')}</div>` : ''}
        <div style="display:flex;gap:10px;">
          <button onclick="document.getElementById('heinrich-modal').remove()"
                  class="craft-btn" style="flex:1;">${btnClose}</button>
          <button onclick="CellariumSystem.buyOrganFromHeinrich()"
                  class="craft-btn" style="flex:1;background:var(--accent-gold);color:var(--bg-parchment);"
                  ${(!canAfford || alreadyHas) ? 'disabled' : ''}>${btnBuy}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  buyOrganFromHeinrich: function() {
    if (this.getGrose() < 600) return;
    if ((GameState.inventory['organ'] || 0) > 0) return;
    this.spendGrose(600);
    Game.addItem('organ', 1);
    document.getElementById('heinrich-modal').remove();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    UI.notify(lang === 'en' ? '🎹 Organ acquired from Heinrich Traxdorf!' : '🎹 Varhany zakoupeny od Heinricha Traxdorfa!');
    Game.save();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UI RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  renderCellariumTab: function() {
    // Gate: tech_cellarium_rd2 required
    if (!this.hasCellarium()) {
      return this.renderLockedScreen();
    }
    return this.renderCellariumContent();
  },

  renderLockedScreen: function() {
    const hasCom = this.hasCommercium();
    return `
      <div style="text-align:center; padding:60px 20px; opacity:0.7;">
        <div style="font-size:3rem; margin-bottom:20px;">🔒</div>
        <div style="font-size:1.1rem; font-style:italic; margin-bottom:12px;">
          <em>Cellarium clausum est.</em>
        </div>
        <div style="font-size:0.85rem; opacity:0.8;">
          ${hasCom ? t('cellarium.lockedMsg') : t('cellarium.lockedMsgPre')}
        </div>
      </div>
    `;
  },

  renderCellariumContent: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const hasNum = this.hasNumismatica();

    let h = `<div id="cellarium-content" style="padding:10px;">`;

    // ── Hlavička: Benedikt + pokladna ───────────────────────────────────────
    h += `
      <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;
                  padding:15px; background:rgba(197,160,89,0.07);
                  border-radius:10px; border-left:4px solid var(--accent-gold);">
        <div style="font-size:2.5rem;">🧾</div>
        <div style="flex:1;">
          <div style="font-weight:bold; font-size:1rem;">Benedikt z Litomyšle</div>
          <div style="font-size:0.8rem; opacity:0.65; font-style:italic;">Cellarius · správce klášterního hospodářství</div>
          <div style="font-size:0.8rem; opacity:0.6; margin-top:4px;">
            „Quid offers? Quid quaeris?" — Co nabízíš? Co hledáš?
          </div>
        </div>
        <div style="text-align:center; min-width:70px;">
          <div style="font-size:1.8rem;">💰</div>
          <div style="font-weight:bold; font-size:1.3rem;" id="cellarium-grose-count">${this.getGrose()}</div>
          <div style="font-size:0.7rem; opacity:0.6;">grošů</div>
        </div>
      </div>
    `;

    if (!hasNum) {
      // Numismatica ještě neodemknuta
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
      // Entity tabs
      h += this.renderEntityTabs();
    }

    h += `</div>`;
    return h;
  },

  renderEntityTabs: function() {
    const entities = [
      { id: 'tavern', icon: '🍺', label: 'Hospoda', label_en: 'Tavern' },
      { id: 'shop',   icon: '🏪', label: 'Obchod',  label_en: 'Shop'   },
      { id: 'market', icon: '⛺', label: 'Trh',     label_en: 'Market' },
    ];
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!GameState.ui) GameState.ui = {};
    const active = GameState.ui.cellariumEntity || 'tavern';

    // Tab buttons
    let h = `<div style="display:flex; gap:8px; margin-bottom:16px;">`;
    entities.forEach(e => {
      const open   = this.isEntityOpen(e.id);
      const isCur  = e.id === active;
      const name   = lang === 'en' ? e.label_en : e.label;
      const hours  = lang === 'en' ? this.entityHoursLabel_en(e.id) : this.entityHoursLabel(e.id);
      h += `
        <button onclick="CellariumSystem.switchEntity('${e.id}')"
                class="filter-btn${isCur ? ' active' : ''}"
                style="flex:1; position:relative;">
          ${e.icon} ${name}
          <span style="display:block; font-size:0.65rem; opacity:0.7;">${hours}</span>
          <span style="position:absolute; top:4px; right:6px; font-size:0.6rem;
                       color:${open ? '#5a9' : '#c55'};">
            ${open ? '● OPEN' : '● CLOSED'}
          </span>
        </button>
      `;
    });
    h += `</div>`;

    // Entity obsah
    h += this.renderEntityPanel(active);
    return h;
  },

  switchEntity: function(entityId) {
    if (!GameState.ui) GameState.ui = {};
    GameState.ui.cellariumEntity = entityId;
    const el = document.getElementById('cellarium-content');
    if (el) el.outerHTML = this.renderCellariumContent();
    else this.renderCellariumTab();
  },

  renderEntityPanel: function(entity) {
    const open = this.isEntityOpen(entity);
    const lang = (GameState.settings && GameState.settings.language) || 'cs';

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03);
                         border-radius:8px; border-left:3px solid
                         ${open ? 'var(--accent-gold)' : 'rgba(0,0,0,0.15)'};">`;

    if (!open) {
      const label = lang === 'en' ? this.entityHoursLabel_en(entity) : this.entityHoursLabel(entity);
      h += `
        <div style="text-align:center; padding:20px; opacity:0.6;">
          <div style="font-size:2rem;">🔒</div>
          <div style="font-style:italic; margin-top:8px; font-size:0.9rem;">
            ${t('cellarium.closed')}<br>
            <span style="font-size:0.8rem;">${label}</span>
          </div>
        </div>
      `;
      h += `</div>`;
      return h;
    }

    // ── Dvousloupcový layout: NÁKUP | PRODEJ ───────────────────────────────
    const sellLabel = lang === 'en' ? 'SELL' : 'PRODEJ';
    const TAVERN_ITEMS = ['bread','cooked_meat','cooked_fish','stew','mushroom_soup',
                          'berry_pie','honey','water','potion_heal','stamina_tonic',
                          'sleep_potion','candle'];
    const sellable = Object.keys(this.BASE_PRICES).filter(id => {
      if ((GameState.inventory[id] || 0) === 0) return false;
      if (entity === 'tavern') return TAVERN_ITEMS.includes(id);
      return true;
    });

    // Wrapper — dva sloupce
    h += `<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; align-items:start;">`;

    // Levý sloupec — NÁKUP
    h += `<div>`;
    h += this.renderBuyPanel(entity, lang);
    h += `</div>`;

    // Pravý sloupec — PRODEJ
    h += `<div>`;
    h += `<div style="font-size:0.7rem; font-weight:bold; letter-spacing:0.08em;
                      text-transform:uppercase; color:var(--accent-gold);
                      margin-bottom:8px; padding-bottom:4px;
                      border-bottom:2px solid var(--accent-gold);">
            📤 ${sellLabel}
          </div>`;
    if (sellable.length === 0) {
      h += `<div style="text-align:center; padding:20px; opacity:0.5; font-style:italic; font-size:0.85rem;">
              ${t('cellarium.nothingToSell')}
            </div>`;
    } else {
      h += `<div style="display:flex; flex-direction:column; gap:6px;">`;
      sellable.forEach(id => {
        const have  = GameState.inventory[id] || 0;
        const price = this.calcPrice(id, entity);
        const item  = ItemsDB[id];
        const icon  = (item && item.icon) ? item.icon : '📦';
        const name  = (typeof iName === 'function') ? iName(id) : (item ? item.name : id);
        h += `
          <div style="padding:7px 10px; background:rgba(197,160,89,0.06);
                      border-radius:6px; border:1px solid rgba(197,160,89,0.2);
                      display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem; min-width:24px; text-align:center;">${icon}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:bold; font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
              <div style="font-size:0.7rem; opacity:0.65;">${lang==='en'?'Have':'Máš'}: ${have} · ${price} 💰</div>
            </div>
            <div style="display:flex; gap:3px; flex-shrink:0;">
              <button onclick="CellariumSystem.sellItem('${id}',1,'${entity}')"
                      class="craft-btn" style="font-size:0.7rem; padding:3px 6px;">×1</button>
              <button onclick="CellariumSystem.sellItem('${id}',5,'${entity}')"
                      class="craft-btn" style="font-size:0.7rem; padding:3px 6px;"
                      ${have >= 5 ? '' : 'disabled'}>×5</button>
              <button onclick="CellariumSystem.sellItem('${id}',${have},'${entity}')"
                      class="craft-btn" style="font-size:0.7rem; padding:3px 6px;">
                ${lang === 'en' ? 'All' : 'Vše'}
              </button>
            </div>
          </div>
        `;
      });
      h += `</div>`;
    }
    h += `</div>`; // konec pravého sloupce
    h += `</div>`; // konec grid

    h += `</div>`;
    return h;
  },

};