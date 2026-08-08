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
        grose: 0,
        transactions: []
      };
    }
    // Migrate: přidat transactions do existujících savů
    if (!GameState.treasury.transactions) {
      GameState.treasury.transactions = [];
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
    const hour = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour() : now.getHours();
    const day  = (typeof TimeSys !== 'undefined') ? TimeSys.gameWeekday() : now.getDay(); // 0=Ne, 1=Po ... 6=So

    if (entity === 'tavern') {
      if (GameState.secrets && GameState.secrets.tavernAlwaysOpen) return true;
      // 14:00–23:59 nebo 00:00–01:59
      return hour >= 14 || hour < 2;
    }
    if (entity === 'shop') {
      if (GameState.secrets && GameState.secrets.shopAlwaysOpen) return true;
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
    // Zlatnictví — prodej zpátky (Klenotník vykoupí za ~70 %, Obchod za ~80 %)
    stribrny_prut: 120,
    zlaty_prut:   1360,
    // Lore / Psaní
    paper:          2,
    ink:            2,
    ink_gallic:     5,
    vellum:        20,
    common_codex:  35,
    luxury_codex:  75,
    vellum_codex: 150,
    research:       3,
    // Rukopisy — craftované knihy (tier 1→4)
    adversaria:    18,
    vademecum:     45,
    florilegium:   70,
    enchiridion:  110,
    // Jídlo
    bread:          1,
    bread_fine:     2,
    bread_fine_1:   4,
    cooked_meat:    3,
    cooked_fish:    2,
    stew:           4,
    mushroom_soup:  3,
    berry_pie:      3,
    berry_pie_fine:   5,
    berry_pie_fine_1: 8,
    honey:          4,
    // Caseus — sýry (3 typy × fáze + syrečky)
    goat_cheese_fresh:    9,
    goat_cheese_mature:   14,
    goat_cheese_aged:     22,
    sheep_cheese_fresh:   10,
    sheep_cheese_mature:  16,
    sheep_cheese_aged:    24,
    cow_cheese_fresh:     8,
    cow_cheese_mature:    13,
    cow_cheese_aged:      20,
    syrecky_fresh:        5,
    syrecky_mature:       9,
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
    propolis:       7,   // MRD 5.5 — drobná šance při sklizni, vzácnější než pyl
    propolis_tinktura: 16, // MRD 5.5 — Athanor: propolis+spiritus_vini:maceratio
    propolis_tinktura_vyzrala: 32, // MRD 5.6 — 10denní zrání, dvojnásobná cena
    // Sýry (Lactaria/Caseus — prodej: Hospoda + Trh + Sýrař; Obchod vyloučen)
    goat_cheese_fresh:   4,
    goat_cheese_mature:  8,
    goat_cheese_aged:   15,
    sheep_cheese_fresh:  5,
    sheep_cheese_mature: 9,
    sheep_cheese_aged:  17,
    cow_cheese_fresh:    5,
    cow_cheese_mature:  10,
    cow_cheese_aged:    18,
    syrecky_fresh:       3,
    syrecky_mature:      6,
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
    // MRD Columbarium II — holoubě cennější než dospělý pták (historicky doloženo)
    pigeon_squab:   7,
    pigeon_meat:    4,
    lamb:           5,
    veteran_queen: 280,
  },

  // Plošné snížení výkupních cen (Trh/Obchod/Hospoda) — jedno místo k doladění.
  // Neovlivňuje nákupní ceny (calcBuyPrice) — jen calcPrice (sellItem).
  // Clientela (data/contacts.js) staví na calcPrice('market') jako základ,
  // takže se tenhle multiplikátor propaguje i tam automaticky.
  SELL_PRICE_MULT: 0.70,   // −30 %

  // Koeficienty per entita (prodej hráče → entita)
  ENTITY_COEFF: {
    tavern:  { food: 1.3, lore: 0.6, mat: 0.7, alchemy: 0.9 },
    shop:    { food: 0.8, lore: 1.0, mat: 1.0, alchemy: 1.0 },
    market:  { food: 1.0, lore: 1.1, mat: 1.1, alchemy: 1.1 },
  },

  ITEM_CAT: {
    paper: 'lore', ink: 'lore', ink_gallic: 'lore', vellum: 'lore',
    common_codex: 'lore', luxury_codex: 'lore', vellum_codex: 'lore', research: 'lore',
    adversaria: 'lore', vademecum: 'lore', florilegium: 'lore', enchiridion: 'lore',
    bread: 'food', bread_fine: 'food', bread_fine_1: 'food', cooked_meat: 'food', cooked_fish: 'food', stew: 'food',
    mushroom_soup: 'food', berry_pie: 'food', berry_pie_fine: 'food', berry_pie_fine_1: 'food', honey: 'food',
    goat_cheese_fresh: 'food', goat_cheese_mature: 'food', goat_cheese_aged: 'food',
    sheep_cheese_fresh: 'food', sheep_cheese_mature: 'food', sheep_cheese_aged: 'food',
    cow_cheese_fresh: 'food', cow_cheese_mature: 'food', cow_cheese_aged: 'food', syrecky_fresh: 'food', syrecky_mature: 'food',
    fiber: 'mat', bark: 'mat', hide: 'mat', leather: 'mat', bone: 'mat',
    feather: 'mat', resin: 'mat', charcoal: 'mat',
    herb_red: 'mat', herb_yellow: 'mat', herb_blue: 'mat', roots: 'mat',
    chalk: 'mat',
    metal: 'mat', glue: 'mat', tallow: 'mat', sealant: 'mat',
    stribrny_prut: 'mat', zlaty_prut: 'mat',
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
    feather_hen: 'mat', pollen: 'mat', linden_blossom: 'mat', beeswax: 'mat', propolis: 'mat', propolis_tinktura: 'mat', propolis_tinktura_vyzrala: 'mat',
    // Semena
    seed_apple: 'mat', seed_pear: 'mat', seed_plum: 'mat', seed_cherry: 'mat',
    seed_walnut: 'mat', seed_mulberry: 'mat', seed_quince: 'mat', seed_sorb: 'mat',
    seed_rowan: 'mat', seed_linden: 'mat',
    fry: 'mat', carp_young: 'mat', carp: 'food_raw',
    chicken_meat: 'food', mutton: 'food', pigeon_squab: 'food', pigeon_meat: 'food',
    lamb_hide: 'mat', chick: 'mat', lamb: 'mat',
    veteran_queen: 'mat',
  },

  // Výpočet ceny s náhodným offsetem (seed per den+entita pro konzistenci v rámci dne)
  // Saturační pásma — kolik kusů hráč dnes prodal entity
  _saturationMult: function(itemId, entity) {
    this._resetStockIfNewDay();
    const sold = (GameState.shopStock.dailySold[this._stockKey(entity, itemId)] || 0);
    if (sold <= 5)  return 1.00;
    if (sold <= 15) return 0.80;
    if (sold <= 30) return 0.60;
    return 0.45;
  },

  // CH-2: Postní dny (Chronicon fast flag) — ryby žádané, maso leží
  FAST_FISH: ['cooked_fish', 'carp'],
  FAST_MEAT: ['cooked_meat', 'chicken_meat', 'mutton', 'pigeon_squab', 'pigeon_meat'],

  _fastMult: function(itemId) {
    const snap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
    if (!snap || !snap.fast || !snap.fast.active) return 1.0;
    if (this.FAST_FISH.includes(itemId)) return 1.5;
    if (this.FAST_MEAT.includes(itemId)) return 0.5;
    return 1.0;
  },

  // Reputace → cenový multiplikátor (jen Hospoda; Trh/Obchod = čistě nabídka/poptávka)
  _repMult: function(entity) {
    if (entity !== 'tavern') return 1.0;
    return 1.10 + ((GameState.persona?.influence?.benedikt || 0) / 100) * 0.25;
  },

  calcPrice: function(itemId, entity, skipSaturation) {
    const base = this.BASE_PRICES[itemId];
    if (!base) return null;
    const cat   = this.ITEM_CAT[itemId] || 'mat';
    const coeff = this.ENTITY_COEFF[entity][cat] || 1.0;
    // Denní seed pro konzistentní ceny během dne
    const today = new Date();
    const seed  = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    const pseudoRand = ((seed * 9301 + entity.charCodeAt(0) * 49297 + itemId.charCodeAt(0) * 233) % 1000) / 1000;
    const offset = 0.85 + pseudoRand * 0.30; // 0.85–1.15
    const satMult = skipSaturation ? 1.0 : this._saturationMult(itemId, entity);
    const roleMult = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('market_price') : 1.0;
    // Professio: Illuminator (manuscript_price) — striktně jen role illuminator, žádný fallback pro ostatní
    const isIlluminator = (GameState.persona && GameState.persona.role === 'illuminator');
    const manuscriptMult = (cat === 'lore' && isIlluminator && typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('manuscript_price') : 1.0;
    const fastMult = this._fastMult(itemId);
    const repMult = this._repMult(entity);
    return Math.max(1, Math.round(base * coeff * offset * satMult * roleMult * manuscriptMult * fastMult * repMult * this.SELL_PRICE_MULT));
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SELL — hráč prodává item entitě
  // ═══════════════════════════════════════════════════════════════════════════

  // sellToContact-cap-audit (7.8.2026): sdíleno mezi sellItem (Cellarium)
  // a SaeculumSystem.sellToContact (Clientela) — jedno místo pravdy pro
  // postupnou slevu při velkoobjemovém prodeji.
  SELL_SAT_THRESHOLDS: [5, 15, 30],
  SELL_SAT_MULTS: [1.00, 0.80, 0.60, 0.45],

  // Sdílený výpočet saturovaného prodeje. hardCap (volitelný) = tvrdý denní
  // strop — nad něj se dál neprodává (na rozdíl od sellItem, kde saturace
  // jen zlevňuje, ale nikdy neblokuje). Vrací kolik se SKUTEČNĚ prodalo
  // (actuallySold může být < qty, pokud hardCap zarazí dřív).
  _calcSaturatedSale: function(baseNoSat, qty, soldBefore, hardCap) {
    const thresholds = this.SELL_SAT_THRESHOLDS;
    const mults = this.SELL_SAT_MULTS;
    const cap = hardCap || Infinity;
    let total = 0, remaining = qty, sold = soldBefore, guard = 0;
    while (remaining > 0 && sold < cap && guard < 10000) {
      guard++;
      let tierIdx = thresholds.findIndex(th => sold < th);
      if (tierIdx === -1) tierIdx = thresholds.length;
      let tierCap = tierIdx < thresholds.length ? thresholds[tierIdx] : Infinity;
      tierCap = Math.min(tierCap, cap);
      const canSellInTier = Math.min(remaining, tierCap - sold);
      if (canSellInTier <= 0) break;
      const tierPrice = Math.max(1, Math.round(baseNoSat * mults[tierIdx]));
      total += tierPrice * canSellInTier;
      sold += canSellInTier;
      remaining -= canSellInTier;
    }
    return { total: total, soldAfter: sold, actuallySold: sold - soldBefore };
  },

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
    // Cena BEZ saturačního multiplikátoru — ten se aplikuje postupně níže,
    // aby velký jednorázový prodej (tlačítko "Vše") správně degradoval cenu
    // uprostřed transakce, ne jen podle stavu PŘED prodejem (viz calcPrice).
    const baseNoSat = this.calcPrice(itemId, entity, true);
    if (!baseNoSat) return;

    this._resetStockIfNewDay();
    const soldKey = this._stockKey(entity, itemId);
    const soldBefore = GameState.shopStock.dailySold[soldKey] || 0;

    const result = this._calcSaturatedSale(baseNoSat, qty, soldBefore, null);
    const total = result.total;

    Game.removeItem(itemId, qty);
    this.addGrose(total);
    // Saturace — zaznamenat prodané množství
    GameState.shopStock.dailySold[soldKey] = result.soldAfter;
    this.recordTransaction('sell', itemId, qty, Math.round(total / qty), entity);
    GameState.economy.tradesTotal++;
    // Reputace — obchod zvyšuje vztah k entitě (+1 základ + Celerarius bonus navrch)
    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
        const repAxis = entity === 'tavern' ? 'benedikt' : entity === 'market' ? 'mercatus' : entity === 'shop' ? 'village' : null;
        if (repAxis) {
            const roleBonus = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('npc_rep_gain') : 0;
            PersonaSystem.addInfluence(repAxis, 1 + roleBonus);
        }
    }
    if (GameState.economy.tradesTotal === 1) {
        Game.addKronikaEntry('important', '🏛️ První obchod uzavřen v Cellariu.', '🏛️ First trade completed in the Cellarium.', '🏛️ Primum commercium in Cellario factum est.');
    }
    Game.save();
    const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
    UI.notify(t('cellarium.soldNotify').replace('{total}', total).replace('{qty}', qty).replace('{item}', itemName));
    if (total >= 15 && typeof NotificationSystem !== 'undefined') {
        const _slang = (GameState.settings && GameState.settings.language) || 'cs';
        NotificationSystem.panel('💰 ' + itemName + ' ×' + qty + ' → ' + total + ' g · ' + (_slang==='en' ? entity : entity), 'system');
    }
    // Tavern/Shop/Market se zobrazují uvnitř Saeculum obrazovky (#saeculum-content),
    // ne Cellarium (#cellarium-content) — refresh musí cílit tam, jinak zůstane
    // stav zaseklý až do ručního přepnutí tabu.
    if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUY — entita prodává hráči (special item per entita)
  // ═══════════════════════════════════════════════════════════════════════════

  ENTITY_SHOP: {
    tavern: [
      { itemId: 'stamina_tonic',  basePrice: 8,   dailyStock: 3  },
      { itemId: 'beer',           basePrice: 2,   dailyStock: 20 },
      { itemId: 'wine',           basePrice: 7,   dailyStock: 8  },
      { itemId: 'seeds_cannabis', basePrice: 45,  dailyStock: 1  }, // konopí seté — vzácné
    ],
    shop: [
      { itemId: 'chalk',           basePrice: 2,  dailyStock: 30 },
      { itemId: 'salt',            basePrice: 12, dailyStock: 2  },
      { itemId: 'wine',            basePrice: 4,  dailyStock: 5  },
      { itemId: 'seeds_thyme',     basePrice: 6,  dailyStock: 5  }, // tymián — Varroa léčba
      { itemId: 'seeds_plantain',  basePrice: 5,  dailyStock: 5  }, // jitrocel — hojivá bylina
      { itemId: 'seeds_herb',      basePrice: 6,  dailyStock: 10 },
      { itemId: 'seeds_vegetable', basePrice: 6,  dailyStock: 10 },
      { itemId: 'seeds_yellow',    basePrice: 8,  dailyStock: 3  }, // heřmánek
      { itemId: 'seeds_blue',      basePrice: 8,  dailyStock: 3  }, // levandule
      { itemId: 'seeds_mint',      basePrice: 8,  dailyStock: 3  },
      { itemId: 'seeds_sage',      basePrice: 10, dailyStock: 3  },
      { itemId: 'seeds_fennel',    basePrice: 10, dailyStock: 3  },
      { itemId: 'seeds_flax',      basePrice: 9,  dailyStock: 10 },
      // Hrách — obchod-podklad (7.8.2026): "Základní potraviny" v Olomouci
      // 1465 zahrnovaly obilí i hrách pospolu (základní trh, ne dálkový
      // dovoz) — dává smysl mít ho v Obchodě všední den, ne čekat na Trh
      // víkend. Zbytek polního osiva (žito/pšenice/ječmen...) zatím
      // zůstává jen na Trhu — otevřeno k rozšíření, pokud bude chtít Bouvard.
      { itemId: 'seeds_peas',      basePrice: 5,  dailyStock: 10 },
      { itemId: 'seeds_lentils',   basePrice: 5,  dailyStock: 10 }, // čočka — mirror hrách, obchod-podklad 7.8.2026
      // kovani-rozsireni-mrd (7.8.2026): hřebíky před tech_kovarina — drahý kanál, malý sklad
      { itemId: 'hrebiky',         basePrice: 6,  dailyStock: 3 },
      // Obchod-podklad (7.8.2026): 5 potvrzených mezer z historického
      // dokladu ("řemeslné výrobky běžné potřeby" + slané ryby, Zóna 1
      // olomouckého trhu). Karmín má navíc vlastní craft cestu (červec →
      // karmin, tech_cervec) — tohle je dovozní alternativa, dražší ale bez tech gatu.
      { itemId: 'pottery_vessel',  basePrice: 6,  dailyStock: 8  },
      { itemId: 'dreveky',         basePrice: 5,  dailyStock: 6  },
      { itemId: 'kozene_boty',     basePrice: 14, dailyStock: 3  },
      { itemId: 'slany_sled',      basePrice: 8,  dailyStock: 10 },
      { itemId: 'karmin',          basePrice: 30, dailyStock: 2  },
      // Kadidlo — dovozní pryskyřice (Thuribulum)
      { itemId: 'resin_styrax',    basePrice: 18, dailyStock: 2,  req_tech: 'tech_thuribulum' },
      // Alembik — destilační nádoba, dostupná v Obchodě od Destillatio (MRD: athanor-tiers)
      { itemId: 'alembic',         basePrice: 30, dailyStock: 1,  req_tech: 'tech_destillatio' },
      // Liturgická roucha — přesunuta do Tkadlecova Clientela buyOffer
      // (Clientela pool MRD, 25.7.2026): osobní vztah s tkadlecem, ne
      // anonymní pult vedle křídy a semínek. Viz contacts.js → tkadlec.
      // Včelař — sousedský chovatel, výhodnější cena než na Trhu (Trh: 40 groší)
      { itemId: 'queen_bee',       basePrice: 22, dailyStock: 1,  req_tech: 'tech_liber_apium' },
      // giacomo-obchod-mirror (7.8.2026): STEJNÝCH 14 položek jako Giacomo
      // (ContactsDB.giacomo.buyOffer), ale bez vztahu/reputace/přítomnosti —
      // anonymní pult, kdykoliv Obchod otevřený. Cena = Giacomova ZÁKLADNÍ
      // cena (ne slevněná) × 2,5 (běžné) nebo × 4,0 (top4 exotika — safran/
      // muškátový květ/hedvábí/olibanum, stejná čtveřice jako minReputation
      // gate u Giacoma). Sklad = poloviční, min. 1 — lokální trh dostane
      // menší příděl než přímý dovozce. STATICKY dopočteno teď, ne
      // dynamicky odvozeno z contacts.js — pokud se Giacomovy ceny změní,
      // je třeba přepočítat i tohle ručně.
      { itemId: 'paper_fine',      basePrice: 15,  dailyStock: 2 },  // 6×2.5
      { itemId: 'pepr_cerny',      basePrice: 15,  dailyStock: 2 },  // 6×2.5
      { itemId: 'zazvor',          basePrice: 15,  dailyStock: 2 },  // 6×2.5
      { itemId: 'hrebicek',        basePrice: 30,  dailyStock: 1 },  // 12×2.5
      { itemId: 'skorice',         basePrice: 25,  dailyStock: 1 },  // 10×2.5
      { itemId: 'muskat',          basePrice: 35,  dailyStock: 1 },  // 14×2.5
      { itemId: 'muskatovy_kvet',  basePrice: 80,  dailyStock: 1 },  // 20×4.0 — exotika
      { itemId: 'hedvabi',         basePrice: 60,  dailyStock: 1 },  // 15×4.0 — exotika
      { itemId: 'safran',          basePrice: 112, dailyStock: 1 },  // 28×4.0 — exotika
      { itemId: 'alum',            basePrice: 20,  dailyStock: 2 },  // 8×2.5
      { itemId: 'sandarak',        basePrice: 35,  dailyStock: 1 },  // 14×2.5
      { itemId: 'sal_ammoniac',    basePrice: 45,  dailyStock: 1 },  // 18×2.5
      { itemId: 'verzino',         basePrice: 40,  dailyStock: 1 },  // 16×2.5
      { itemId: 'incense_styrax',  basePrice: 25,  dailyStock: 1 },  // 10×2.5
      { itemId: 'incense_olibanum', basePrice: 64, dailyStock: 1 },  // 16×4.0 — exotika
    ],
    market: [
      { itemId: 'paper',         basePrice: 3,   dailyStock: 25 },
      { itemId: 'paper_fine',    basePrice: 18,  dailyStock: 2,  req_tech: 'tech_porta' },
      { itemId: 'palice_zelezna', basePrice: 50, dailyStock: 2,  req_tech: 'tech_fodina' },
      { itemId: 'salt',          basePrice: 9,   dailyStock: 20 },
      // kovani-rozsireni-mrd (7.8.2026): hřebíky před tech_kovarina — střední kanál
      { itemId: 'hrebiky',       basePrice: 4,   dailyStock: 10 },
      // Zvířata
      { itemId: 'hen_white',     basePrice: 15,  dailyStock: 3  },
      { itemId: 'hen_black',     basePrice: 18,  dailyStock: 2  },
      { itemId: 'hen_colored',   basePrice: 25,  dailyStock: 1  },
      { itemId: 'rooster',       basePrice: 20,  dailyStock: 2  },
      { itemId: 'sheep',         basePrice: 35,  dailyStock: 2  },
      { itemId: 'rabbit_m',      basePrice: 18,  dailyStock: 2,  req_tech: 'tech_cuniculi' },
      { itemId: 'rabbit_f',      basePrice: 24,  dailyStock: 2,  req_tech: 'tech_cuniculi' },
      { itemId: 'goat',          basePrice: 44,  dailyStock: 1,  req_tech: 'tech_caprile' },
      { itemId: 'piglet',        basePrice: 40,  dailyStock: 1,  req_tech: 'tech_suile' },
      { itemId: 'horse',         basePrice: 250, dailyStock: 1,  req_tech: 'tech_stabulum' },
      { itemId: 'donkey',        basePrice: 55,  dailyStock: 1,  req_tech: 'tech_asinus' },
      // Skot (Armentum) — kráva má týdenní zásobu (viz checkCowRestock), ne dailyStock
      { itemId: 'cow',           basePrice: 70,               req_tech: 'tech_armentum' },
      { itemId: 'tele',          basePrice: 35,  dailyStock: 1, req_tech: 'tech_armentum' },
      { itemId: 'byk',           basePrice: 2000, dailyStock: 1, req_tech: 'tech_armentum' },
      { itemId: 'queen_bee',     basePrice: 40,  dailyStock: 1  },
      // Holoubě — dodatek 27.7.2026, alternativa k chovu (mirror ostatních
      // mláďat výše). Gate tech_porta, stejně jako samotný Holubník.
      { itemId: 'pigeon_squab_live', basePrice: 50, dailyStock: 2, req_tech: 'tech_porta' },
      // Semena stromů — drahá
      { itemId: 'seed_apple',    basePrice: 8,   dailyStock: 3  },
      { itemId: 'seed_pear',     basePrice: 8,   dailyStock: 3  },
      { itemId: 'seed_plum',     basePrice: 7,   dailyStock: 3  },
      { itemId: 'seed_cherry',   basePrice: 9,   dailyStock: 3  },
      { itemId: 'seed_walnut',   basePrice: 15,  dailyStock: 2  },
      { itemId: 'seed_mulberry', basePrice: 12,  dailyStock: 2  },
      { itemId: 'seed_quince',   basePrice: 10,  dailyStock: 2  },
      { itemId: 'truhla_ii',     basePrice: 1700, dailyStock: 1 },
      { itemId: 'seed_sorb',     basePrice: 18,  dailyStock: 2  },
      { itemId: 'seed_rowan',    basePrice: 8,   dailyStock: 3  },
      { itemId: 'seed_linden',   basePrice: 14,  dailyStock: 2  },
      // Rybník
      { itemId: 'fry',           basePrice: 5,   dailyStock: 5  },
      { itemId: 'stika',         basePrice: 20,  dailyStock: 1,  req_tech: 'tech_piscina_administratio' },
      { itemId: 'pstruh',        basePrice: 15,  dailyStock: 2,  req_tech: 'tech_piscina_administratio' },
      { itemId: 'uhor',          basePrice: 22,  dailyStock: 1,  req_tech: 'tech_piscina_administratio' },
      // Zelenina
      { itemId: 'carrot',        basePrice: 4,   dailyStock: 30 },
      { itemId: 'onion',         basePrice: 4,   dailyStock: 30 },
      { itemId: 'leek',          basePrice: 6,   dailyStock: 20 },
      { itemId: 'cabbage',       basePrice: 4,   dailyStock: 30 },
      { itemId: 'garlic',        basePrice: 8,   dailyStock: 15 },
      // Semena zeleniny
      { itemId: 'seeds_leek',    basePrice: 10,  dailyStock: 5  },
      { itemId: 'seeds_cabbage', basePrice: 8,   dailyStock: 5  },
      { itemId: 'seeds_garlic',  basePrice: 12,  dailyStock: 5  },
      { itemId: 'seeds_radish',  basePrice: 6,   dailyStock: 5  },
      { itemId: 'seeds_turnip',  basePrice: 6,   dailyStock: 5  },
      // Pivovar suroviny
      { itemId: 'grain',         basePrice: 4,   dailyStock: 15 }, // obilí — bulk komodita, sníženo (systém kvality zrna, anti-grind)
      { itemId: 'flour_2',       basePrice: 9,   dailyStock: 4 },  // mouka 2. třídy — vyplatí se vypěstovat vlastní přes mlýn, ne kupovat
      { itemId: 'hops',          basePrice: 18,  dailyStock: 15 }, // chmel — vzácnější
      // Osivo pro pole
      { itemId: 'seeds_rye',     basePrice: 5,   dailyStock: 40 },
      { itemId: 'seeds_wheat',   basePrice: 6,   dailyStock: 30 },
      { itemId: 'seeds_barley',  basePrice: 5,   dailyStock: 30 },
      { itemId: 'seeds_oats',    basePrice: 4,   dailyStock: 30 },
      { itemId: 'seeds_millet',  basePrice: 6,   dailyStock: 20 },
      { itemId: 'seeds_peas',    basePrice: 5,   dailyStock: 25 },
      { itemId: 'seeds_vikev',   basePrice: 5,   dailyStock: 25 },
      // Kovářství (vyžaduje tech_kovarina)
      { itemId: 'stone_pickaxe', basePrice: 30,  dailyStock: 5  },
      { itemId: 'iron_ore',      basePrice: 15,  dailyStock: 10, req_tech: 'tech_kovarina' },
      { itemId: 'anvil',         basePrice: 250, dailyStock: 1,  req_tech: 'tech_kovarina' },
      { itemId: 'iron_axe',      basePrice: 65,  dailyStock: 2,  req_tech: 'tech_kovarina' },
      { itemId: 'iron_spade',    basePrice: 55,  dailyStock: 2,  req_tech: 'tech_kovarina' },
      { itemId: 'iron_scythe',   basePrice: 70,  dailyStock: 2,  req_tech: 'tech_kovarina' },
      { itemId: 'iron_sickle',   basePrice: 50,  dailyStock: 2,  req_tech: 'tech_kovarina' },
      { itemId: 'iron_flail',    basePrice: 60,  dailyStock: 2,  req_tech: 'tech_kovarina' },
      { itemId: 'iron_shovel',   basePrice: 55,  dailyStock: 2,  req_tech: 'tech_kovarina' },
      { itemId: 'iron_saw',      basePrice: 65,  dailyStock: 2,  req_tech: 'tech_kovarina' },
      // Kadidlo — vzácné arabské olibanum přes Giacoma (Thuribulum)
      { itemId: 'resin_olibanum',  basePrice: 45, dailyStock: 1,  req_tech: 'tech_thuribulum' },
    ],
  },

  // ── Daily Stock helpers ────────────────────────────────────────────────────
  _stockKey: function(entity, itemId) { return entity + ':' + itemId; },

  _resetStockIfNewDay: function() {
    if (!GameState.shopStock) GameState.shopStock = { date: '', used: {}, dailySold: {} };
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (GameState.shopStock.date !== today) {
      GameState.shopStock.date = today;
      GameState.shopStock.used     = {};
      GameState.shopStock.dailySold = {};
      // TODO: Chronicon stock_boost/shortage signal — napojit až Chronicon live
    }
    // Migrace starých savů bez dailySold
    if (!GameState.shopStock.dailySold) GameState.shopStock.dailySold = {};
  },

  _getStockRemaining: function(entity, itemId) {
    this._resetStockIfNewDay();
    // Kráva — týdenní zásoba (viz checkCowRestock), ne dailyStock jako ostatní zvířata
    if (itemId === 'cow') return (GameState.economy && GameState.economy.cowAvailable) ? 1 : 0;
    const shopList = this.ENTITY_SHOP[entity];
    if (!shopList) return 999;
    const entry = shopList.find(s => s.itemId === itemId);
    if (!entry || entry.dailyStock === undefined) return 999; // bez limitu
    const used = GameState.shopStock.used[this._stockKey(entity, itemId)] || 0;
    return Math.max(0, entry.dailyStock - used);
  },

  _useStock: function(entity, itemId) {
    if (itemId === 'cow') { if (GameState.economy) GameState.economy.cowAvailable = false; return; }
    const key = this._stockKey(entity, itemId);
    GameState.shopStock.used[key] = (GameState.shopStock.used[key] || 0) + 1;
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
    if (shopEntry.req_tech && !(GameState.researchedTechs && GameState.researchedTechs.includes(shopEntry.req_tech))) {
      UI.notify(t('game.techRequired') || '❌ Vyžaduje výzkum.', true);
      return;
    }
    // Denní sklad — check
    if (this._getStockRemaining(entity, itemId) <= 0) {
      const lang = (GameState.settings && GameState.settings.language) || 'cs';
      UI.notify(lang === 'en' ? '📦 Sold out for today. Come back tomorrow.' : '📦 Vyprodáno na dnes. Přijď zítra.', true);
      return;
    }
    // Velká truhla — vlastnický strop 2 ks celkem (vzácný special item, ne denní stock)
    if (itemId === 'truhla_ii' && (GameState.inventory['truhla_ii'] || 0) >= 2) {
      const lang = (GameState.settings && GameState.settings.language) || 'cs';
      UI.notify(lang === 'en' ? 'You already own the maximum of 2 Large Chests.' : 'Velkou truhlu už máš maximální počet 2 ks.', true);
      return;
    }
    const price = this.calcBuyPrice(itemId, entity, shopEntry.basePrice);
    if (this.getGrose() < price) {
      UI.notify(t('cellarium.noGrose'), true);
      return;
    }
    this.spendGrose(price);
    this._useStock(entity, itemId);
    Game.addItem(itemId, 1);
    this.recordTransaction('buy', itemId, 1, price, entity);
    GameState.economy.tradesTotal++;
    // Reputace — nákup taky zvyšuje vztah k entitě (stejný vzor jako sellItem)
    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
        const repAxis = entity === 'tavern' ? 'benedikt' : entity === 'market' ? 'mercatus' : entity === 'shop' ? 'village' : null;
        if (repAxis) {
            const roleBonus = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('npc_rep_gain') : 0;
            PersonaSystem.addInfluence(repAxis, 1 + roleBonus);
        }
    }
    Game.save();
    const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
    UI.notify(t('cellarium.boughtNotify').replace('{qty}', 1).replace('{item}', itemName).replace('{total}', price));
    if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
  },

  // Speciální "chuťovka" efekt (flavor panel + u vína craft-boost) — voláno
  // z Game.eat() PŘI SKUTEČNÉ KONZUMACI, ne při nákupu. Satiety/Fatigue už
  // řeší Game.eat() → VigorSystem.eat() generickou cestou (beer/wine jsou
  // type:'food'), takhle se to nezdvojuje.
  applyDrinkEffect: function(itemId) {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const panel = (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel)
      ? (msg) => NotificationSystem.panel(msg, 'info')
      : (msg) => UI.notify(msg, false);

    if (itemId === 'beer') {
      panel(lang === 'en'
        ? '🍺 Lupulin — thirst quenched, mind dulled.'
        : '🍺 Lupulin — hlad zažehnán, mysl trochu zakalena.');

    } else if (itemId === 'wine') {
      // Craft boost zachován
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
      panel(lang === 'en'
        ? "🍷 In vino veritas — the scribe's hand loosened."
        : '🍷 In vino veritas — ruka písaře se uvolnila.');
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

  // Pivo/víno vypité rovnou u pultu — platí se zvlášť od BUY, žádný item
  // do inventáře, efekt hned. Sdílí denní sklad s "koupit s sebou" (BUY),
  // je to fyzicky tentýž sud/soudek.
  drinkAtTavern: function(entity, itemId) {
    if (!this.hasNumismatica()) return;
    if (!this.isEntityOpen(entity)) {
      UI.notify(t('cellarium.closed'), true);
      return;
    }
    const shopList = this.ENTITY_SHOP[entity];
    if (!shopList) return;
    const shopEntry = shopList.find(s => s.itemId === itemId);
    if (!shopEntry) return;
    if (this._getStockRemaining(entity, itemId) <= 0) {
      const lang = (GameState.settings && GameState.settings.language) || 'cs';
      UI.notify(lang === 'en' ? '📦 Sold out for today. Come back tomorrow.' : '📦 Vyprodáno na dnes. Přijď zítra.', true);
      return;
    }
    const price = this.calcBuyPrice(itemId, entity, shopEntry.basePrice);
    if (this.getGrose() < price) {
      UI.notify(t('cellarium.noGrose'), true);
      return;
    }
    this.spendGrose(price);
    this._useStock(entity, itemId);
    this.recordTransaction('buy', itemId, 1, price, entity);
    if (typeof VigorSystem !== 'undefined') VigorSystem.eat(itemId);
    this.applyDrinkEffect(itemId);
    GameState.economy.tradesTotal++;
    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
      const repAxis = entity === 'tavern' ? 'benedikt' : entity === 'market' ? 'mercatus' : entity === 'shop' ? 'village' : null;
      if (repAxis) {
        const roleBonus = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('npc_rep_gain') : 0;
        PersonaSystem.addInfluence(repAxis, 1 + roleBonus);
      }
    }
    Game.save();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
    UI.notify(lang === 'en' ? 'Drank: ' + itemName + ' (' + price + ' g).' : 'Vypito: ' + itemName + ' (' + price + ' g).');
    if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
  },

  renderBuyPanel: function(entity, lang) {
    const allItems = this.ENTITY_SHOP[entity];
    if (!allItems || allItems.length === 0) return '';
    const shopList = allItems.filter(entry =>
      !entry.req_tech || (GameState.researchedTechs && GameState.researchedTechs.includes(entry.req_tech))
    );
    const buyLabel = lang === 'en' ? 'BUY' : 'NÁKUP';
    this._resetStockIfNewDay();
    const cards = shopList.map(entry => {
      const item = ItemsDB[entry.itemId];
      const icon = (item && item.icon) ? item.icon : '📦';
      const name = (typeof iName === 'function') ? iName(entry.itemId) : (item ? item.name : entry.itemId);
      const price = this.calcBuyPrice(entry.itemId, entity, entry.basePrice);
      const remaining = this._getStockRemaining(entity, entry.itemId);
      const hasStock = remaining > 0;
      const canAfford = this.getGrose() >= price;
      const canBuy = canAfford && hasStock;
      const stockLabel = entry.dailyStock !== undefined
        ? `<span style="opacity:0.5; font-size:0.7rem; margin-left:4px;">${remaining}/${entry.dailyStock}</span>`
        : '';
      const soldOut = !hasStock
        ? `<div style="font-size:0.7rem; color:#f44336; margin-top:2px;">${lang === 'en' ? '📦 Sold out' : '📦 Vyprodáno'}</div>`
        : '';
      return `
        <div style="padding:8px 10px; background:rgba(197,160,89,0.06);
                    border-radius:6px; border:1px solid rgba(197,160,89,0.2);
                    display:flex; align-items:center; gap:8px;
                    opacity:${hasStock ? 1 : 0.55};">
          <span style="font-size:1.4rem; min-width:28px; text-align:center;">${icon}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:bold; font-size:0.82rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}${stockLabel}</div>
            <div style="font-size:0.72rem; opacity:0.65;">${price} 💰</div>
            ${soldOut}
          </div>
          <button onclick="CellariumSystem.buyItem('${entity}','${entry.itemId}')"
                  class="craft-btn"
                  style="padding:3px 10px; font-size:0.75rem; flex-shrink:0;"
                  ${canBuy ? '' : 'disabled'}>
            ${lang === 'en' ? 'Buy' : 'Koupit'}
          </button>
          ${(entity === 'tavern' && (entry.itemId === 'beer' || entry.itemId === 'wine')) ? `
          <button onclick="CellariumSystem.drinkAtTavern('${entity}','${entry.itemId}')"
                  class="craft-btn"
                  style="padding:3px 10px; font-size:0.75rem; flex-shrink:0; background:#8a3324;"
                  ${canBuy ? '' : 'disabled'}>
            🍺 ${lang === 'en' ? 'Drink' : 'Vypít'}
          </button>` : ''}
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

  // Kráva — týdenní zásoba na trhu (1 kus/týden), mirror Giacomo intervalu.
  // Krava-mrd (26.7.2026): na rozdíl od dailyStock zvířat se resetuje jen
  // 1×/týden a NEpropadá, pokud se nekoupí (cowAvailable zůstane true).
  COW_RESTOCK_MS: 7 * 24 * 60 * 60 * 1000,
  checkCowRestock: function() {
    if (!GameState.economy) return;
    const now = Date.now();
    if (now - (GameState.economy.lastCowRestock || 0) >= this.COW_RESTOCK_MS) {
      GameState.economy.lastCowRestock = now;
      GameState.economy.cowAvailable = true;
      Game.save();
    }
  },

  // Giacomo je "v přístavu" jen 3 dny po příjezdu — jinak je jeho buyOffer (Clientela) nedostupný
  GIACOMO_PRESENCE_MS: 3 * 24 * 60 * 60 * 1000,
  isGiacomoPresent: function() {
    return (Date.now() - (GameState.economy.lastGiacomoVisit || 0)) < this.GIACOMO_PRESENCE_MS;
  },
  // giacomo-prezence-audit (7.8.2026): dřív se přítomnost zjišťovala jen při
  // pokusu o nákup (chybová notify) — nikde v UI se aktivně neukazovala.
  // Vrací { present: bool, days: int } — present ? dny do odjezdu : dny do
  // příjezdu (týdenní cyklus checkGiacomoEvent, 7 dní).
  giacomoDaysLeft: function() {
    const now = Date.now();
    const since = now - (GameState.economy.lastGiacomoVisit || 0);
    if (since < this.GIACOMO_PRESENCE_MS) {
      return { present: true, days: Math.max(0, Math.ceil((this.GIACOMO_PRESENCE_MS - since) / 86400000)) };
    }
    const week = 7 * 24 * 60 * 60 * 1000;
    return { present: false, days: Math.max(0, Math.ceil((week - since) / 86400000)) };
  },

  // giacomo-obchod-audit (7.8.2026): Giacomův CELKOVÝ stock (napříč celým
  // katalogem) škáluje s Chronicon regionálním napětím (region.tension,
  // sdílené všem hráčům) a persona.reputation.slechta funguje jako OBRANNÝ
  // faktor proti tension (ne samostatný bonus navrch). goldenAge tension
  // úplně přebije — historicky "zlatý věk" znamená bezpečné obchodní cesty
  // bez ohledu na jinak neklidný kraj; dává hráči šanci věc vylepšit i když
  // je Chronicon svět/hráčova reputace jinak ve špatném stavu.
  //
  // Vzorec (odsouhlaseno 7.8.2026):
  //   tensionPenalty   = tension > 50 ? (tension-50)/50 × 0.50 : 0   // 0–50 %, jen nad práh 50
  //   reputationOffset = min(tensionPenalty, (slechta/100) × tensionPenalty × 0.50)  // vrátí max polovinu ztráty
  //   stockMult = goldenAge ? 1.0 : clamp(1 − tensionPenalty + reputationOffset, 0.3, 1.0)
  //
  // Příklady: tension 25 → 1.0 (beze změny). Tension 80, slechta 0 → 0.70
  // (−30 %). Tension 80, slechta 100 → 0.85 (jen −15 %, reputace vrátila
  // polovinu ztráty). goldenAge aktivní → vždy 1.0 bez ohledu na tension.
  giacomoStockMult: function() {
    if (typeof ChroniconSystem === 'undefined' || !ChroniconSystem.getBuffs) return 1.0;
    const buffs = ChroniconSystem.getBuffs();
    if (buffs.goldenAge) return 1.0;
    const tension = typeof buffs.tension === 'number' ? buffs.tension : 25;
    const tensionPenalty = tension > 50 ? ((tension - 50) / 50) * 0.50 : 0;
    const slechta = (GameState.persona && GameState.persona.reputation && GameState.persona.reputation.slechta) || 0;
    const reputationOffset = Math.min(tensionPenalty, (slechta / 100) * tensionPenalty * 0.50);
    return Math.max(0.3, Math.min(1.0, 1 - tensionPenalty + reputationOffset));
  },

  // Stationarius — mirror Giacomo vzoru (týdenní interval + krátké okno),
  // jen delší cyklus (knižní veletrh je vzácnější než týdenní loď).
  // Nahrazuje dřívější kalendářní jaro/podzim — to bylo příliš pomalé
  // (reálné měsíce čekání podle toho, kdy hraješ).
  STATIONARIUS_INTERVAL_MS: 21 * 24 * 60 * 60 * 1000,  // každých 21 dní
  STATIONARIUS_PRESENCE_MS: 5 * 24 * 60 * 60 * 1000,   // přítomen 5 dní

  checkStationariusEvent: function() {
    const now = Date.now();
    if (!GameState.library) GameState.library = {};
    if (now - (GameState.library.lastStationariusVisit || 0) >= this.STATIONARIUS_INTERVAL_MS) {
      GameState.library.lastStationariusVisit = now;
      Game.save();
    }
  },

  isStationariusPresent: function() {
    if (!GameState.library) return false;
    return (Date.now() - (GameState.library.lastStationariusVisit || 0)) < this.STATIONARIUS_PRESENCE_MS;
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
          <button onclick="document.getElementById('giacomo-modal').remove(); UI.switchScreen('home', document.getElementById('nav-home')); UI.switchHomeTab('saeculum', document.getElementById('home-tab-saeculum')); SaeculumSystem.switchEntity('market');"
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
    // Furnishing → osa (endgame-branches-reference.md, Fabrica sekce 4.2)
    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
      PersonaSystem.addInfluence('village', 5);
      PersonaSystem.addInfluence('church', 5);
    }
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

  // ── Benedikt — dynamické motto (cellarium = sklad/zásoby, saeculum = hospoda) ──
  _benediktMotto: function(context) {
    context = context || 'cellarium';
    const grose = this.getGrose();
    const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;
    const stock = ds ? ds.totalStock() : 0;
    const cap   = ds ? ds.totalCapacity() : 1000;
    const pct   = cap > 0 ? Math.round(stock / cap * 100) : 0;

    if (grose === 0)      return t('cellarium.mottoEmpty');
    if (grose < 10)       return t('cellarium.mottoPoor');
    if (context === 'saeculum') {
      if (!this.isEntityOpen('tavern')) return t('cellarium.mottoShuttered');
    } else {
      if (pct > 90)       return t('cellarium.mottoFull');
    }
    if (grose > 200)      return t('cellarium.mottoRich');
    return t('cellarium.motto');
  },

  // ── Benedikt — stats panel (cellarium = sklad/zásoby, saeculum = hospoda) ──
  // VITREA V5: rozpad vybavení (informační modal — obchod se děje u Skláře/na trhu)
  showVitreaDetail: function() {
    if (typeof NotificationSystem === 'undefined') return;
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const inv = GameState.inventory || {};
    const row = (id) => {
      const n = inv[id] || 0;
      const nm = (typeof iName === 'function') ? iName(id) : id;
      return `<div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:2px; ${n === 0 ? 'opacity:0.45;' : ''}"><span>${nm}</span><strong>${n}</strong></div>`;
    };
    let html = `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin-bottom:4px;">🍽️ ${lang==='en'?'Tableware':'Stolní nádobí'}</div>`;
    ['glass_goblet','glass_tankard','glass_jug','glass_bowl','glass_pitcher','wooden_bowl'].forEach(id => html += row(id));
    html += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:8px 0 4px;">⚗️ ${lang==='en'?'Laboratory':'Laboratoř'}</div>`;
    ['alembic','glass_flask','glass_stopper'].forEach(id => html += row(id));
    html += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:8px 0 4px;">🏺 ${lang==='en'?'Other':'Ostatní'}</div>`;
    ['window_roundel','glass_vase','glass_mirror','paternoster_beads','fly_trap_glass'].forEach(id => html += row(id));
    const lb = GameState.vitreaLastBroken;
    if (lb) {
      const nm = (typeof iName === 'function') ? iName(lb.id) : lb.id;
      const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
      const when = _toGameDate(lb.ts).toLocaleDateString(lang==='en'?'en-GB':'cs-CZ');
      html += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic; margin-top:10px;">💥 ${lang==='en'?'Last broken':'Naposled rozbito'}: ${nm} (${when})</div>`;
    }
    NotificationSystem.modal({
      icon: '🍶',
      title: lang==='en' ? 'Monastery equipment' : 'Klášterní vybavení',
      text: html,
      choices: [{ label: (lang==='en'?'Close':'Zavřít') }]
    });
  },

  _benediktStats: function(context) {
    context = context || 'cellarium';
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;
    const stock = ds ? ds.totalStock() : 0;
    const cap   = ds ? ds.totalCapacity() : 1000;
    const pct   = cap > 0 ? Math.round(stock / cap * 100) : 0;
    const capColor = pct > 90 ? '#c0392b' : pct > 70 ? '#e67e22' : '#5a9a5a';

    const hasLR = GameState.researchedTechs && GameState.researchedTechs.includes('tech_liber_rationum');
    const txs = (GameState.treasury && GameState.treasury.transactions) || [];
    const totalSold = hasLR
      ? txs.filter(t => t.type === 'sell').reduce((s, t) => s + (t.total || 0), 0)
      : null;

    let h = `<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:0.78rem;opacity:0.8;
                         padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:6px;margin-bottom:14px;">`;
    if (totalSold !== null) {
      h += `<span>📊 ${lang==='en'?'Sold':'Prodáno'}: <strong>${totalSold} g</strong></span>`;
    }
    if (context === 'saeculum') {
      const tavernOpen = this.isEntityOpen('tavern');
      const tavernTxt = tavernOpen
        ? `<span style="color:#5a9a5a;">● ${lang==='en'?'open':'otevřeno'}</span>`
        : `<span style="color:#c0392b;">● ${lang==='en'?'closed':'zavřeno'}</span>`;
      h += `<span>🍺 ${lang==='en'?'Tavern':'Hospoda'}: ${tavernTxt}</span>`;
      // CH-2: postní den — indikátor
      const _fsnap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
      if (_fsnap && _fsnap.fast && _fsnap.fast.active) {
        const fn = (lang === 'en' ? (_fsnap.fast.name_en || _fsnap.fast.name_cs) : _fsnap.fast.name_cs) || '';
        h += `<span>🐟 ${lang==='en'?'Fast day':'Postní den'}${fn ? ' ('+fn+')' : ''} — ${lang==='en'?'fish in demand, meat lies':'ryby žádané, maso leží'}</span>`;
      }
    } else {
      h += `<span>🌾 ${lang==='en'?'Stores':'Zásoby'}: <strong style="color:${capColor};">${pct}%</strong></span>`;
    }
    // VITREA V5: agregát vybavení (stolní kapacita vs. bratři) — klik = rozpad
    if (GameState.vitreaGranted) {
      const TG = ['glass_goblet','glass_tankard','glass_jug','glass_bowl','glass_pitcher'];
      const glassCap = TG.reduce((s, id) => s + (GameState.inventory[id] || 0), 0);
      const woodCap = GameState.inventory['wooden_bowl'] || 0;
      const need = Math.max(1, (GameState.conversi || []).length);
      const vPct = Math.min(100, Math.round((glassCap + woodCap) / need * 100));
      const vColor = vPct >= 100 ? '#5a9a5a' : vPct >= 50 ? '#e67e22' : '#c0392b';
      h += `<span style="cursor:pointer;" onclick="CellariumSystem.showVitreaDetail()" title="${lang==='en'?'Click for breakdown':'Klik pro rozpad'}">🍶 ${lang==='en'?'Equipment':'Vybavení'}: <strong style="color:${vColor};">${vPct}%</strong></span>`;
    }
    h += `</div>`;
    return h;
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
          <div style="font-weight:bold; font-size:1rem;">${t('cellarium.benedict')}</div>
          <div style="font-size:0.8rem; opacity:0.65; font-style:italic;">${t('cellarium.benedictRole')}</div>
          <div style="font-size:0.8rem; opacity:0.6; margin-top:4px;">
            ${this._benediktMotto()}
          </div>
        </div>
        <div style="text-align:center; min-width:70px;">
          <div style="font-size:1.8rem;">💰</div>
          <div style="font-weight:bold; font-size:1.3rem;" id="cellarium-grose-count">${this.getGrose()}</div>
          <div style="font-size:0.7rem; opacity:0.6;">${t('cellarium.grose')}</div>
        </div>
      </div>
    `;

    h += this._benediktStats();

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
    const hasInv = GameState.researchedTechs && GameState.researchedTechs.includes('tech_inventarium');
    const hasLR  = GameState.researchedTechs && GameState.researchedTechs.includes('tech_liber_rationum');
    const hasOldCellars = (GameState.researchedTechs && GameState.researchedTechs.includes('tech_conventual_spaces')) || GameState.oldCellarsFound;
    // Manufaktura: tech + postavené Dormitorium (obojí musí platit — tech
    // samo o sobě může být vyzkoumaný dřív, tab se ale neukáže, dokud
    // budova fyzicky nestojí). Dormitorium NEMÁ vlastní .built pole —
    // sleduje se přes GameState.storage.dormitorium_i/ii/iii (3 úrovně),
    // stejný check jako v hireBrother().
    const hasManufactura = (GameState.researchedTechs && GameState.researchedTechs.includes('tech_manufactura_overview'))
      && typeof Game !== 'undefined' && Game.dormitoriumCapacity && Game.dormitoriumCapacity() > 0;

    const entities = [
      ...(hasInv ? [{ id: 'inventarium',    icon: '📦', label: 'Inventarium',   label_en: 'Inventarium'   }] : []),
      ...(hasLR  ? [{ id: 'liber_rationum', icon: '📒', label: 'Liber Rationum',label_en: 'Liber Rationum'}] : []),
      ...(hasOldCellars ? [{ id: 'old_cellars', icon: '🕯️', label: 'Staré sklepy', label_en: 'Old Cellars' }] : []),
      ...(hasManufactura ? [{ id: 'manufaktura', icon: '⚙️', label: 'Manufaktura', label_en: 'Manufactory' }] : []),
      { id: 'personal', icon: '👥', label: 'Personál', label_en: 'Personnel' },
      { id: 'buildings', icon: '🏗️', label: 'Budovy', label_en: 'Buildings' },
    ];
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!GameState.ui) GameState.ui = {};
    const active = GameState.ui.cellariumEntity || 'buildings';
    const safeActive = entities.some(e => e.id === active) ? active : 'buildings';

    // Tab buttons
    let h = `<div style="display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap;">`;
    entities.forEach(e => {
      const open   = this.isEntityOpen(e.id);
      const isCur  = e.id === safeActive;
      const name   = lang === 'en' ? e.label_en : e.label;
      const hours  = lang === 'en' ? this.entityHoursLabel_en(e.id) : this.entityHoursLabel(e.id);
      const openDot = `<span style="color:${open ? '#5a9' : '#c55'}; font-size:0.55rem;">
        ${open ? '●' : '●'}</span>`;
      h += `
        <button onclick="CellariumSystem.switchEntity('${e.id}')"
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

    // Entity obsah
    h += this.renderEntityPanel(safeActive);
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
    // Speciální chlívky — nemají hodiny ani nákup/prodej
    if (entity === 'inventarium')    return this.renderInventarium();
    if (entity === 'liber_rationum') return this.renderLiberRationum();
    if (entity === 'old_cellars')    return this.renderOldCellars();
    if (entity === 'buildings')      return this.renderBuildings();
    if (entity === 'manufaktura')    return (typeof SaeculumSystem !== 'undefined') ? SaeculumSystem.renderManufactura() : '';
    if (entity === 'personal')       return (typeof SaeculumSystem !== 'undefined') ? SaeculumSystem.renderPersonal() : '';

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

    // ── Reputace — info pruh (živé číslo, stejný zdroj jako calcPrice) ──────
    if (entity === 'tavern') {
      const sub = GameState.ui.tavernSubtab || 'shop';
      h += `
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <button class="filter-btn${sub==='shop'?' active':''}" onclick="GameState.ui.tavernSubtab='shop'; SaeculumSystem.switchEntity('tavern');" style="padding:6px 14px; font-weight:bold;">
          🍺 ${lang==='en'?'Tavern Store':'Šenk & Obchod'}
        </button>
        <button class="filter-btn${sub==='dice'?' active':''}" onclick="GameState.ui.tavernSubtab='dice'; SaeculumSystem.switchEntity('tavern');" style="padding:6px 14px; font-weight:bold; background:${sub==='dice'?'var(--accent-gold)':'rgba(197,160,89,0.1)'}; color:${sub==='dice'?'#000':'var(--ink-primary)'};">
          🎲 ${lang==='en'?'Gambling Table':'Hazardní Stůl & Vrhcáby'}
        </button>
      </div>
      `;

      if (sub === 'dice') {
        h += `<div id="tavern-dice-container"></div>`;
        setTimeout(() => { if (typeof TavernDice !== 'undefined') TavernDice.render(); }, 20);
        return h;
      }

      const rel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.benedikt) || 0;
      const pct = Math.round((this._repMult('tavern') - 1) * 100);
      h += `<div style="font-size:0.78rem;opacity:0.75;margin-bottom:10px;padding:6px 10px;background:rgba(197,160,89,0.08);border-radius:6px;">
        🏠 Benedikt: ${rel}/100 → ${lang==='en'?'prices':'ceny'} ${pct>=0?'+':''}${pct}%
      </div>`;
    } else if (entity === 'shop') {
      const rel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.village) || 0;
      h += `<div style="font-size:0.78rem;opacity:0.75;margin-bottom:10px;padding:6px 10px;background:rgba(197,160,89,0.08);border-radius:6px;">
        🌾 ${lang==='en'?'Village':'Vesnice'}: ${rel}/100
      </div>`;
    } else if (entity === 'market') {
      const rel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.giacomo) || 0;
      h += `<div style="font-size:0.78rem;opacity:0.75;margin-bottom:10px;padding:6px 10px;background:rgba(197,160,89,0.08);border-radius:6px;">
        ⚓ Giacomo: ${rel}/100
      </div>`;
    }

    // ── Dvousloupcový layout: NÁKUP | PRODEJ ───────────────────────────────
    const sellLabel = lang === 'en' ? 'SELL' : 'PRODEJ';
    const TAVERN_ITEMS = ['bread','cooked_meat','cooked_fish','stew','mushroom_soup',
                          'berry_pie','honey','water','potion_heal','stamina_tonic',
                          'sleep_potion','candle',
                          'egg','milk','chicken_meat','mutton','pigeon_squab','pigeon_meat',
                          'apple','pear','plum','cherry',
                          'beer','wine',
                          'goat_cheese_fresh','goat_cheese_mature','goat_cheese_aged',
                          'sheep_cheese_fresh','sheep_cheese_mature','sheep_cheese_aged',
                          'cow_cheese_fresh','cow_cheese_mature','cow_cheese_aged','syrecky_fresh','syrecky_mature'];
    // Obchod (kupecký krám) tyto položky nevykupuje — potraviny patří do krčmy a na trh
    const SHOP_EXCLUDED_ITEMS = ['goat_cheese_fresh','goat_cheese_mature','goat_cheese_aged',
                          'sheep_cheese_fresh','sheep_cheese_mature','sheep_cheese_aged',
                          'cow_cheese_fresh','cow_cheese_mature','cow_cheese_aged','syrecky_fresh','syrecky_mature'];
    const sellable = Object.keys(this.BASE_PRICES).filter(id => {
      if ((GameState.inventory[id] || 0) === 0) return false;
      if (entity === 'tavern') return TAVERN_ITEMS.includes(id);
      if (entity === 'shop' && SHOP_EXCLUDED_ITEMS.includes(id)) return false;
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
      h += `<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:6px;">`;
      sellable.forEach(id => {
        const have  = GameState.inventory[id] || 0;
        const price = this.calcPrice(id, entity);
        const item  = ItemsDB[id];
        const icon  = (item && item.icon) ? item.icon : '📦';
        const name  = (typeof iName === 'function') ? iName(id) : (item ? item.name : id);
        // Saturační indikátor
        const satMult  = this._saturationMult(id, entity);
        const satIcon  = satMult >= 1.0 ? '' : satMult >= 0.80 ? ' 🔻' : satMult >= 0.60 ? ' 🔻🔻' : ' 🔻🔻🔻';
        const satColor = satMult >= 1.0 ? 'inherit' : satMult >= 0.80 ? '#e67e22' : '#c0392b';
        h += `
          <div style="padding:7px 10px; background:rgba(197,160,89,0.06);
                      border-radius:6px; border:1px solid rgba(197,160,89,0.2);
                      display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem; min-width:24px; text-align:center;">${icon}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:bold; font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
              <div style="font-size:0.7rem; opacity:0.65;">${lang==='en'?'Have':'Máš'}: ${have} · <span style="color:${satColor};">${price} 💰${satIcon}</span></div>
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

  // ════════════════════════════════════════════════════════════════════
  // INVENTARIUM — přehled zásob s decay varováními
  // ════════════════════════════════════════════════════════════════════
  renderOldCellars: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const storage = GameState.storage || {};
    const phase1Built = storage.old_cellars && storage.old_cellars.built;

    const title = lang === 'en' ? 'Old Cellars' : 'Staré sklepy';
    const intro = lang === 'en'
      ? 'Forgotten vaults beneath the monastery, discovered by chance or by design. What lies here waits to be reclaimed.'
      : 'Zapomenuté klenby pod klášterem, objevené náhodou nebo záměrem. Co tu leží, čeká na znovuzískání.';

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<div style="font-size:0.75rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:6px;">${title}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:14px; font-style:italic;">${intro}</div>`;

    // Fáze 1 — Čistý sklep
    const cost1 = { cut_stone: 15, plank: 10, rope: 5, hrebiky: 5 };
    const costStr1 = Object.entries(cost1).map(([k,v]) => `${v}× ${(typeof iName==='function')?iName(k):k}`).join(', ');
    h += `<div style="padding:12px; margin-bottom:10px; background:rgba(255,255,255,0.4); border-radius:6px;">`;
    h += `<div style="font-weight:bold; margin-bottom:4px;">${lang==='en'?'Phase 1 — Cleared Cellar':'Fáze 1 — Čistý sklep'}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang==='en'?'Clears the rubble and shores up the old vault. Adds 500 units of storage capacity.':'Vyklidí suť a podepře staré klenutí. Přidá 500 jednotek skladové kapacity.'}</div>`;
    if (phase1Built) {
      h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang==='en'?'Complete':'Dokončeno'}</div>`;
    } else {
      h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr1}</div>`;
      h += `<button class="craft-btn" onclick="Game.buildStorage('old_cellars')">🏗️ ${lang==='en'?'Clear the cellar':'Vyklidit sklep'}</button>`;
    }
    h += `</div>`;

    // Fáze 2 — Domus Conversorum I (funkční)
    const phase2Built = storage.domus_conversorum_i && storage.domus_conversorum_i.built;
    const cost2 = { cut_stone: 40, plank: 25, rope: 10, hrebiky: 12 };
    const costStr2 = Object.entries(cost2).map(([k,v]) => `${v}× ${(typeof iName==='function')?iName(k):k}`).join(', ') + ` + 25g`;
    h += `<div style="padding:12px; margin-bottom:10px; background:${phase1Built ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.02)'}; border-radius:6px; opacity:${phase1Built ? '1' : '0.4'};">`;
    h += `<div style="font-weight:bold; margin-bottom:4px;">${phase1Built ? '' : '🔒 '}${lang==='en'?'Phase 2 — Domus Conversorum I':'Fáze 2 — Domus Conversorum I'}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang==='en'?'Dormitory for lay brothers (2 slots).':'Dormitář pro konvrše (2 sloty).'}</div>`;
    if (phase2Built) {
      h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang==='en'?'Complete':'Dokončeno'}</div>`;
    } else if (phase1Built) {
      h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr2}</div>`;
      h += `<button class="craft-btn" onclick="Game.buildStorage('domus_conversorum_i')">🏗️ ${lang==='en'?'Build':'Postavit'}</button>`;
    } else {
      h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">${lang==='en'?'Requires Phase 1 first.':'Nutná nejprve Fáze 1.'}</div>`;
    }
    h += `</div>`;
    // Fáze 3 — Domus Conversorum II (petice opatovi)
    const phase3Built = storage.domus_conversorum_ii && storage.domus_conversorum_ii.built;
    const petition = (GameState.abbotPetition && GameState.abbotPetition.domus_ii) || { status: 'none' };
    const cost3 = { cut_stone: 150, plank: 90, rope: 35, hrebiky: 35 };
    const costStr3 = Object.entries(cost3).map(([k,v]) => `${v}× ${(typeof iName==='function')?iName(k):k}`).join(', ') + ` + 50g`;
    h += `<div style="padding:12px; background:${phase2Built ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.02)'}; border-radius:6px; opacity:${phase2Built ? '1' : '0.4'};">`;
    h += `<div style="font-weight:bold; margin-bottom:4px;">${phase2Built ? '' : '🔒 '}${lang==='en'?'Phase 3 — Domus Conversorum II':'Fáze 3 — Domus Conversorum II'}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang==='en'?"Expanded dormitory (5 slots). Requires the Abbot's approval.":'Rozšířený dormitář (5 slotů). Vyžaduje souhlas opata.'}</div>`;
    if (phase3Built) {
      h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang==='en'?'Complete':'Dokončeno'}</div>`;
    } else if (!phase2Built) {
      h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">${lang==='en'?'Requires Phase 2 first.':'Nutná nejprve Fáze 2.'}</div>`;
    } else if (petition.status === 'pending') {
      const remH = Math.max(0, Math.ceil((petition.submittedAt + 86400000 - Date.now()) / 3600000));
      h += `<div style="font-size:0.8rem;">⏳ ${lang==='en'?'Awaiting the Abbot\'s reply —':'Čeká na odpověď opata —'} <strong>${remH}h</strong></div>`;
    } else if (petition.status === 'approved') {
      h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr3}</div>`;
      h += `<button class="craft-btn" onclick="Game.buildStorage('domus_conversorum_ii')">🏗️ ${lang==='en'?'Build':'Postavit'}</button>`;
    } else {
      h += `<button class="craft-btn" onclick="Game.submitAbbotPetition('domus_ii'); CellariumSystem.switchEntity('old_cellars');">📜 ${t('abbotPetition.domus_ii.submit_btn')}</button>`;
    }
    h += `</div>`;

    // Fáze 4 — Domus Conversorum III (petice opatovi, eskalovaná)
    const phase4Built = storage.domus_conversorum_iii && storage.domus_conversorum_iii.built;
    const petition3 = (GameState.abbotPetition && GameState.abbotPetition.domus_iii) || { status: 'none' };
    const cost4 = { cut_stone: 330, plank: 200, rope: 75, iron_ingot: 4, hrebiky: 70 };
    const costStr4 = Object.entries(cost4).map(([k,v]) => `${v}× ${(typeof iName==='function')?iName(k):k}`).join(', ') + ` + 110g`;
    h += `<div style="padding:12px; margin-top:10px; background:${phase3Built ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.02)'}; border-radius:6px; opacity:${phase3Built ? '1' : '0.4'};">`;
    h += `<div style="font-weight:bold; margin-bottom:4px;">${phase3Built ? '' : '🔒 '}${lang==='en'?'Phase 4 — Domus Conversorum III':'Fáze 4 — Domus Conversorum III'}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang==='en'?"Great dormitory for lay brothers (20 slots). Requires the Abbot's approval.":'Velký dormitář pro konvrše (20 slotů). Vyžaduje souhlas opata.'}</div>`;
    if (phase4Built) {
      h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang==='en'?'Complete':'Dokončeno'}</div>`;
    } else if (!phase3Built) {
      h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">${lang==='en'?'Requires Phase 3 first.':'Nutná nejprve Fáze 3.'}</div>`;
    } else if (petition3.status === 'pending') {
      const remH = Math.max(0, Math.ceil((petition3.submittedAt + 86400000 - Date.now()) / 3600000));
      h += `<div style="font-size:0.8rem;">⏳ ${lang==='en'?'Awaiting the Abbot\'s reply —':'Čeká na odpověď opata —'} <strong>${remH}h</strong></div>`;
    } else if (petition3.status === 'approved') {
      h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr4}</div>`;
      h += `<button class="craft-btn" onclick="Game.buildStorage('domus_conversorum_iii')">🏗️ ${lang==='en'?'Build':'Postavit'}</button>`;
    } else {
      h += `<button class="craft-btn" onclick="Game.submitAbbotPetition('domus_iii'); CellariumSystem.switchEntity('old_cellars');">📜 ${lang==='en'?'Submit petition to the Abbot':'Zaslat žádost opatovi'}</button>`;
    }
    h += `</div>`;

    // ═══ UBYTOVNA — samostatný tier žebřík (I→IV: 1/3/6/9 lůžek) ═══
    // Sdílí prerekvizitu (Fáze 1 — Čistý sklep), ale jinak oddělené od
    // Domus Conversorum (hosté, ne trvalí konvrši). Vlastní petiční
    // systém — Game.submitUbytovnaPetition/buildUbytovnaTier, ne sdílený
    // abbotPetition (i18n hard rule, viz komentář u ubytovnaCapacity).
    h += `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; margin:18px 0 8px;">🥾 ${lang==='en'?'Guesthouse — separate ladder':'Ubytovna — samostatný žebřík'}</div>`;

    const _ubyTiers = [
      { id: 'ubytovna_ii',  label_cs: 'Ubytovna II',  label_en: 'Guesthouse II',  desc_cs: 'Přístavek s dalšími lůžky (3 celkem).', desc_en: 'An annex with more beds (3 total).' },
      { id: 'ubytovna_iii', label_cs: 'Ubytovna III', label_en: 'Guesthouse III', desc_cs: 'Rozšířené křídlo (6 lůžek celkem).',    desc_en: 'An expanded wing (6 beds total).' },
      { id: 'ubytovna_iv',  label_cs: 'Ubytovna IV',  label_en: 'Guesthouse IV',  desc_cs: 'Plný hostinec (9 lůžek celkem).',      desc_en: 'A full guesthouse (9 beds total).' },
    ];
    const _ubyPrevBuilt = (i) => i === 0 ? phase1Built : (GameState.storage && GameState.storage[_ubyTiers[i-1].id] && GameState.storage[_ubyTiers[i-1].id].built);
    _ubyTiers.forEach((tierDef, i) => {
      const built = GameState.storage && GameState.storage[tierDef.id] && GameState.storage[tierDef.id].built;
      const prevOk = _ubyPrevBuilt(i);
      const pet = (GameState.ubytovnaPetition && GameState.ubytovnaPetition[tierDef.id]) || { status: 'none' };
      const cfg = (typeof Game !== 'undefined') ? Game.UBYTOVNA_TIER_COSTS[tierDef.id] : null;
      const costStr = cfg ? Object.entries(cfg.items).map(([k,v]) => `${v}× ${(typeof iName==='function')?iName(k):k}`).join(', ') + ` + ${cfg.grose}g` : '';
      h += `<div style="padding:12px; margin-bottom:8px; background:${prevOk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.02)'}; border-radius:6px; opacity:${prevOk ? '1' : '0.4'};">`;
      h += `<div style="font-weight:bold; margin-bottom:4px;">${prevOk ? '' : '🔒 '}${lang==='en'?tierDef.label_en:tierDef.label_cs}</div>`;
      h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang==='en'?tierDef.desc_en:tierDef.desc_cs}</div>`;
      if (built) {
        h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang==='en'?'Complete':'Dokončeno'}</div>`;
      } else if (!prevOk) {
        h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">${lang==='en'?'Requires the previous tier first.':'Nutná nejprve předchozí úroveň.'}</div>`;
      } else if (pet.status === 'pending') {
        const remH = Math.max(0, Math.ceil((pet.submittedAt + 86400000 - Date.now()) / 3600000));
        h += `<div style="font-size:0.8rem;">⏳ ${lang==='en'?'Awaiting the Abbot\'s reply —':'Čeká na odpověď opata —'} <strong>${remH}h</strong></div>`;
      } else if (pet.status === 'approved') {
        h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr}</div>`;
        h += `<button class="craft-btn" onclick="Game.buildUbytovnaTier('${tierDef.id}')">🏗️ ${lang==='en'?'Build':'Postavit'}</button>`;
      } else {
        h += `<button class="craft-btn" onclick="Game.submitUbytovnaPetition('${tierDef.id}'); CellariumSystem.switchEntity('old_cellars');">📜 ${lang==='en'?'Submit petition to the Abbot':'Zaslat žádost opatovi'}</button>`;
      }
      h += `</div>`;
    });

    h += `</div>`;
    return h;
  },

  renderInventarium: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const inv = GameState.inventory || {};
    const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;

    // Registrum Cellarii (tech_backpack_ii) — kategorický filtr zásob.
    // Mapování ItemsDB.type → kategorie filtru; cokoliv sem nespadne se
    // zobrazí v "Ostatní" (fallback pro budoucí položky bez jasného typu).
    const hasRegistrum = GameState.researchedTechs && GameState.researchedTechs.includes('tech_backpack_ii');
    const CAT_MAP = {
      mat: 'mat', tool: 'tool', food: 'food', food_raw: 'food',
      lore: 'lore', animal: 'animal',
      alchemy: 'alchemy', alchemy_ing: 'alchemy', potion: 'alchemy',
      herb: 'mat',
    };
    const CAT_LABELS = {
      all:     { icon: '📦', cs: 'Vše',      en: 'All' },
      mat:     { icon: '🧵', cs: 'Suroviny', en: 'Materials' },
      tool:    { icon: '🔧', cs: 'Nástroje', en: 'Tools' },
      food:    { icon: '🍞', cs: 'Jídlo',    en: 'Food' },
      lore:    { icon: '📖', cs: 'Vědění',   en: 'Lore' },
      animal:  { icon: '🐐', cs: 'Zvířata',  en: 'Animals' },
      alchemy: { icon: '⚗️', cs: 'Alchymie', en: 'Alchemy' },
      other:   { icon: '🗝️', cs: 'Ostatní',  en: 'Miscellaneous' },
    };
    if (!GameState.ui) GameState.ui = {};
    const activeCat = GameState.ui.inventariumFilter || 'all';

    const title = lang === 'en' ? 'Inventarium — Inventory of Stores' : 'Inventarium — Soupis Zásob';
    const capLabel = lang === 'en' ? 'Capacity' : 'Kapacita';
    const storageLabel = lang === 'en' ? 'Storage' : 'Sklad';

    // Kapacita — sjednoceno s renderBuildings (storage.*.built, včetně Horrea)
    const s = GameState.storage || {};
    let cap = 1000;
    const storParts = [lang === 'en' ? 'Cloister (1000u)' : 'Klášter (1000j)'];
    if (s.almarium && s.almarium.built) { cap += 200;  storParts.push('Almarium (+200j)'); }
    if (s.cella    && s.cella.built)    { cap += 600;  storParts.push('Cella (+600j)'); }
    if (s.horreum  && s.horreum.built)  { cap += 1600; storParts.push('Horreum (+1600j)'); }
    if (s.old_cellars && s.old_cellars.built) { cap += 500; storParts.push(lang === 'en' ? 'Old Cellars (+500u)' : 'Staré sklepy (+500j)'); }
    const bednaCnt = inv['bedna'] || 0;
    if (bednaCnt > 0) { cap += bednaCnt * 30; storParts.push((lang === 'en' ? 'Crates ×' : 'Bedny ×') + bednaCnt + ' (+' + (bednaCnt * 30) + (lang === 'en' ? 'u)' : 'j)')); }
    const containerCnt = inv['storage_container'] || 0;
    if (containerCnt > 0) { cap += containerCnt * 50; storParts.push((lang === 'en' ? 'Containers ×' : 'Kontejnery ×') + containerCnt + ' (+' + (containerCnt * 50) + (lang === 'en' ? 'u)' : 'j)')); }
    const sackCnt = inv['sack'] || 0;
    if (sackCnt > 0) { cap += sackCnt * 15; storParts.push((lang === 'en' ? 'Sacks ×' : 'Pytle ×') + sackCnt + ' (+' + (sackCnt * 15) + (lang === 'en' ? 'u)' : 'j)')); }
    const truhlaICnt = inv['truhla_i'] || 0;
    if (truhlaICnt > 0) { cap += truhlaICnt * 50; storParts.push((lang === 'en' ? 'Small Chests ×' : 'Malé truhly ×') + truhlaICnt + ' (+' + (truhlaICnt * 50) + (lang === 'en' ? 'u)' : 'j)')); }
    const truhlaIICnt = inv['truhla_ii'] || 0;
    if (truhlaIICnt > 0) { cap += truhlaIICnt * 250; storParts.push((lang === 'en' ? 'Large Chests ×' : 'Velké truhly ×') + truhlaIICnt + ' (+' + (truhlaIICnt * 250) + (lang === 'en' ? 'u)' : 'j)')); }
    const storName = storParts.join(' · ');
    const totalItems = (ds ? ds.totalStock() : Object.values(inv).reduce((sum, v) => sum + (typeof v === 'number' && v > 0 ? v : 0), 0));
    const capPct = Math.min(100, Math.round(totalItems / cap * 100));
    const overflow = totalItems > cap;
    const capColor = overflow ? '#c0392b' : capPct > 90 ? '#c0392b' : capPct > 70 ? '#e67e22' : '#5a9a5a';

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<div style="font-size:0.75rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:12px;">${title}</div>`;

    // Kapacita bar
    h += `<div style="margin-bottom:12px; padding:10px; background:rgba(197,160,89,0.06); border-radius:6px; border:1px solid rgba(197,160,89,0.2);">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span style="font-size:0.8rem; font-weight:bold;">${capLabel}</span>
        <span style="font-size:0.8rem; color:${capColor};">${totalItems} / ${cap}</span>
      </div>
      <div style="background:rgba(0,0,0,0.1); border-radius:4px; height:8px;">
        <div style="width:${capPct}%; background:${capColor}; height:8px; border-radius:4px; transition:width 0.3s;"></div>
      </div>
      <div style="font-size:0.7rem; opacity:0.6; margin-top:4px;">${storageLabel}: ${storName}</div>
      ${overflow ? `<div style="font-size:0.72rem; color:#c0392b; margin-top:6px;">⚠️ ${t('decay.overflowWarn')}</div>` : ''}
    </div>`;

    // Registrum Cellarii — kategorický filtr (tech_backpack_ii)
    if (hasRegistrum) {
      const counts = { all: 0 };
      Object.entries(inv).forEach(([id, qty]) => {
        if (typeof qty !== 'number' || qty <= 0) return;
        const item = ItemsDB[id];
        const cat = (item && CAT_MAP[item.type]) || 'other';
        counts.all++;
        counts[cat] = (counts[cat] || 0) + 1;
      });
      h += `<div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px;">`;
      Object.keys(CAT_LABELS).forEach(cat => {
        const n = counts[cat] || 0;
        if (cat !== 'all' && n === 0) return; // skrýt prázdné kategorie
        const lbl = CAT_LABELS[cat];
        const isActive = activeCat === cat;
        h += `<button onclick="GameState.ui.inventariumFilter='${cat}'; CellariumSystem.switchEntity('inventarium');"
          style="padding:5px 10px; border-radius:6px; font-size:0.75rem; cursor:pointer;
                 background:${isActive ? '#8a3324' : 'rgba(197,160,89,0.12)'};
                 color:${isActive ? '#fcf5e5' : 'inherit'};
                 border:1px solid ${isActive ? '#8a3324' : 'rgba(197,160,89,0.3)'};">
          ${lbl.icon} ${lang==='en' ? lbl.en : lbl.cs} <span style="opacity:0.7;">(${n})</span>
        </button>`;
      });
      h += `</div>`;
    } else {
      h += `<div style="margin-bottom:12px; padding:8px 10px; background:rgba(0,0,0,0.03); border-radius:6px; font-size:0.75rem; opacity:0.65; font-style:italic;">
        ${lang==='en'
          ? '📜 Study <strong>Registrum Cellarii</strong> to filter stores by category.'
          : '📜 Prostuduj <strong>Registrum Cellarii</strong> pro filtrování zásob podle kategorií.'}
      </div>`;
    }

    // Myší vliv (fuzzy)
    if (ds) {
      h += `<div style="margin-bottom:12px; padding:8px 10px; background:rgba(0,0,0,0.04); border-radius:6px; font-size:0.78rem; font-style:italic; opacity:0.8;">
        🐭 ${ds.miceFuzzyShort()}
      </div>`;
    }

    // Mouchy (monastery-decay-mrd) — jen zmínka, pokud je dopad zesílený
    // (fliesMult > 1.3, tedy "Some"/"Many" pásmo) — primární info je na Dvoře.
    if (ds && ds.fliesMult && ds.fliesMult() > 1.3) {
      h += `<div style="margin-bottom:12px; padding:8px 10px; background:rgba(0,0,0,0.04); border-radius:6px; font-size:0.78rem; font-style:italic; opacity:0.8;">
        🪰 ${ds.fliesFuzzyShort()}
      </div>`;
    }

    // Včerejší ztráty
    const losses = (GameState.decay && GameState.decay.lastLosses) || [];
    if (losses.length) {
      const parts = losses.map(l => `${l.lost}× ${(typeof iName === 'function') ? iName(l.id) : l.id}`).join(', ');
      h += `<div style="margin-bottom:12px; padding:8px 10px; background:rgba(192,57,43,0.08); border-radius:6px; border:1px solid rgba(192,57,43,0.25); font-size:0.78rem;">
        🗑️ ${t('decay.lastLosses')}: ${parts}
      </div>`;
    }

    // Položky s decay sazbou
    const rows = [];
    for (const [id, qty] of Object.entries(inv)) {
      if (typeof qty !== 'number' || qty <= 0) continue;
      const item = ItemsDB[id];
      const icon = (item && item.icon) ? item.icon : '📦';
      const name = (typeof iName === 'function') ? iName(id) : (item ? item.name : id);

      // Kategorie (jen pokud je Registrum odemčen — jinak filtr neexistuje a vše se vypíše)
      const itemCat = (item && CAT_MAP[item.type]) || 'other';
      if (hasRegistrum && activeCat !== 'all' && itemCat !== activeCat) continue;

      let decayHtml = '';
      let rate = ds ? ds.effectiveRate(id) : null;
      if (rate !== null && rate !== undefined) {
        const pct = Math.round(rate * 100);
        const warn = pct >= 20;
        decayHtml = `<span style="font-size:0.65rem; color:${warn ? '#c0392b' : '#a0722d'}; margin-left:4px;">
          ${warn ? '⚠️ ' : ''}−${pct}%/${lang === 'en' ? 'day' : 'den'}
        </span>`;
        rows.push({ id, qty, icon, name, decayHtml, sortKey: pct, cat: itemCat });
      } else {
        decayHtml = `<span style="font-size:0.65rem; opacity:0.4; margin-left:4px;">∞</span>`;
        rows.push({ id, qty, icon, name, decayHtml, sortKey: -1, cat: itemCat });
      }
    }

    // Seřadit: nejrychleji se kazící nahoře
    rows.sort((a, b) => b.sortKey - a.sortKey);

    const renderRow = (r) => `<div style="padding:7px 10px; background:rgba(197,160,89,0.06); border-radius:6px;
                      border:1px solid rgba(197,160,89,${r.sortKey >= 20 ? '0.5' : '0.15'});
                      display:flex; align-items:center; gap:8px;">
      <span style="font-size:1.2rem; min-width:24px;">${r.icon}</span>
      <div style="flex:1;">
        <span style="font-weight:bold; font-size:0.85rem;">${r.name}</span>
        ${r.decayHtml}
      </div>
      <span style="font-weight:bold; font-size:0.9rem; color:var(--accent-gold);">×${r.qty}</span>
      <span style="display:flex; gap:3px;">
        <button onclick="CellariumSystem.discardItem('${r.id}',1)" class="craft-btn" style="padding:3px 6px; font-size:0.65rem;">×1</button>
        <button onclick="CellariumSystem.discardItem('${r.id}',5)" class="craft-btn" style="padding:3px 6px; font-size:0.65rem;" ${r.qty < 5 ? 'disabled' : ''}>×5</button>
        <button onclick="CellariumSystem.discardItem('${r.id}',10)" class="craft-btn" style="padding:3px 6px; font-size:0.65rem;" ${r.qty < 10 ? 'disabled' : ''}>×10</button>
        <button onclick="CellariumSystem.discardItem('${r.id}','all')" class="craft-btn" style="padding:3px 6px; font-size:0.65rem; background:#8a3324; color:#fff;">${t('decay.discardAll')}</button>
      </span>
    </div>`;

    if (rows.length === 0) {
      h += `<div style="text-align:center; padding:20px; opacity:0.5; font-style:italic; font-size:0.85rem;">
        ${lang === 'en' ? 'Stores are empty.' : 'Zásoby jsou prázdné.'}
      </div>`;
    } else if (hasRegistrum && activeCat === 'all') {
      // Registrum Cellarii + pohled "Vše" — seskupit pod sbalovací nadpisy
      // kategorií, stejný vzor jako UI.toggleCraftCategory() v Craft panelu.
      const catOrderInv = ['mat', 'tool', 'food', 'lore', 'animal', 'alchemy', 'other'];
      catOrderInv.forEach(cat => {
        const catRows = rows.filter(r => r.cat === cat);
        if (catRows.length === 0) return;
        const lbl = CAT_LABELS[cat];
        const collapsed = !!(GameState.uiPrefs && GameState.uiPrefs.invCollapsed && GameState.uiPrefs.invCollapsed[cat]);
        h += `<div style="margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35); cursor:pointer; display:flex; align-items:center; gap:6px;" onclick="CellariumSystem.toggleInventariumCategory('${cat}')">
          <span id="inv-cat-chevron-${cat}" style="font-size:0.65rem; display:inline-block; transition:transform 0.15s; transform:rotate(${collapsed ? 0 : 90}deg);">▶</span>
          <span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${lbl.icon} ${lang==='en' ? lbl.en : lbl.cs} (${catRows.length})</span>
        </div>`;
        h += `<div id="inv-cat-body-${cat}" style="display:${collapsed ? 'none' : 'flex'}; flex-direction:column; gap:5px;">`;
        catRows.forEach(r => { h += renderRow(r); });
        h += `</div>`;
      });
    } else {
      h += `<div style="display:flex; flex-direction:column; gap:5px;">`;
      rows.forEach(r => { h += renderRow(r); });
      h += `</div>`;
    }

    h += `</div>`;
    return h;
  },

  // ── Stavba zvířecího výběhu (deleguje na GardenSystem) ───────────────
  buildPen: function(pen) {
    if (typeof GardenSystem === 'undefined') return;
    GardenSystem.buildAnimalPen(pen);
    // Re-render Budovy
    if ((GameState.ui && GameState.ui.cellariumEntity) === 'buildings') this.switchEntity('buildings');
  },

  // ── Zahodit předmět ze zásob ──────────────────────────────────────────
  // Sbalovací kategorie v pohledu "Vše" Inventaria — stejný vzor jako
  // UI.toggleCraftCategory() v Craft panelu, vlastní klíč/prefix ať nekoliduje.
  toggleInventariumCategory: function(cat) {
    if (!GameState.uiPrefs) GameState.uiPrefs = {};
    if (!GameState.uiPrefs.invCollapsed) GameState.uiPrefs.invCollapsed = {};
    const collapsed = !GameState.uiPrefs.invCollapsed[cat];
    GameState.uiPrefs.invCollapsed[cat] = collapsed;
    const body = document.getElementById('inv-cat-body-' + cat);
    if (body) body.style.display = collapsed ? 'none' : 'flex';
    const chevron = document.getElementById('inv-cat-chevron-' + cat);
    if (chevron) chevron.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(90deg)';
    if (typeof Game !== 'undefined' && Game.save) Game.save();
  },

  discardItem: function(id, qty) {
    const inv = GameState.inventory || {};
    const have = inv[id] || 0;
    if (have <= 0) return;

    let n = (qty === 'all') ? have : Math.min(qty, have);
    if (qty === 'all') {
      const nm = (typeof iName === 'function') ? iName(id) : id;
      if (!confirm(t('decay.discardConfirm').replace('{qty}', have).replace('{item}', nm))) return;
    }

    inv[id] = have - n;
    const nm = (typeof iName === 'function') ? iName(id) : id;
    if (typeof UI !== 'undefined' && UI.notify) UI.notify('🗑️ ' + t('decay.discarded').replace('{qty}', n).replace('{item}', nm));
    if (typeof Game !== 'undefined' && Game.save) Game.save();

    // Re-render Inventarium (skutečné API: switchEntity přerenderuje obsah)
    if ((GameState.ui && GameState.ui.cellariumEntity) === 'inventarium') {
      this.switchEntity('inventarium');
    }
  },

  // ════════════════════════════════════════════════════════════════════
  // LIBER RATIONUM — účetní kniha transakcí
  // ════════════════════════════════════════════════════════════════════
  recordTransaction: function(type, itemId, qty, price, entity) {
    if (!GameState.treasury) GameState.treasury = {};
    if (!GameState.treasury.transactions) GameState.treasury.transactions = [];
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const item = ItemsDB[itemId];
    const name = (typeof iName === 'function') ? iName(itemId) : (item ? item.name : itemId);
    const entityNames = { tavern: 'Hospoda', shop: 'Obchod', market: 'Trh' };
    const entityNamesEn = { tavern: 'Tavern', shop: 'Shop', market: 'Market' };
    GameState.treasury.transactions.unshift({
      date: new Date().toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' }),
      type,          // 'sell' | 'buy'
      itemId,
      name,
      qty,
      price,
      entity,
      entityName: entityNames[entity] || entity,
      entityName_en: entityNamesEn[entity] || entity,
      total: qty * price,
    });
    // Max 100 záznamů
    if (GameState.treasury.transactions.length > 100) {
      GameState.treasury.transactions = GameState.treasury.transactions.slice(0, 100);
    }
  },

  renderLiberRationum: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const txs = (GameState.treasury && GameState.treasury.transactions) || [];

    const title = lang === 'en' ? 'Liber Rationum — Account Book' : 'Liber Rationum — Účetní Kniha';
    const emptyLabel = lang === 'en' ? 'No transactions recorded yet.' : 'Zatím žádné záznamy.';
    const typeLabel = { sell: lang === 'en' ? 'Sold' : 'Prodáno', buy: lang === 'en' ? 'Bought' : 'Koupeno' };

    // Výpočet bilance
    const income  = txs.filter(t => t.type === 'sell').reduce((s, t) => s + t.total, 0);
    const expense = txs.filter(t => t.type === 'buy').reduce((s, t) => s + t.total, 0);
    const balance = income - expense;

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<div style="font-size:0.75rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:12px;">${title}</div>`;

    // Bilance summary
    h += `<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px;">
      <div style="text-align:center; padding:8px; background:rgba(90,154,90,0.1); border-radius:6px; border:1px solid rgba(90,154,90,0.3);">
        <div style="font-size:0.65rem; opacity:0.7;">${lang==='en'?'Income':'Příjmy'}</div>
        <div style="font-weight:bold; color:#5a9a5a;">+${income} 💰</div>
      </div>
      <div style="text-align:center; padding:8px; background:rgba(192,57,43,0.1); border-radius:6px; border:1px solid rgba(192,57,43,0.3);">
        <div style="font-size:0.65rem; opacity:0.7;">${lang==='en'?'Expenses':'Výdaje'}</div>
        <div style="font-weight:bold; color:#c0392b;">-${expense} 💰</div>
      </div>
      <div style="text-align:center; padding:8px; background:rgba(197,160,89,0.1); border-radius:6px; border:1px solid rgba(197,160,89,0.3);">
        <div style="font-size:0.65rem; opacity:0.7;">${lang==='en'?'Balance':'Bilance'}</div>
        <div style="font-weight:bold; color:${balance >= 0 ? '#5a9a5a' : '#c0392b'};">${balance >= 0 ? '+' : ''}${balance} 💰</div>
      </div>
    </div>`;

    if (txs.length === 0) {
      h += `<div style="text-align:center; padding:20px; opacity:0.5; font-style:italic; font-size:0.85rem;">${emptyLabel}</div>`;
    } else {
      h += `<div style="display:flex; flex-direction:column; gap:5px; max-height:400px; overflow-y:auto;">`;
      txs.forEach(tx => {
        const isSell = tx.type === 'sell';
        const tLabel = typeLabel[tx.type] || tx.type;
        const eName = lang === 'en' ? tx.entityName_en : tx.entityName;
        h += `<div style="padding:8px 10px; background:rgba(197,160,89,0.05);
                          border-radius:6px; border:1px solid rgba(197,160,89,0.15);
                          border-left:3px solid ${isSell ? '#5a9a5a' : '#c0392b'};
                          display:flex; align-items:center; gap:8px; font-size:0.82rem;">
          <span style="opacity:0.6; min-width:36px; font-size:0.7rem;">${tx.date}</span>
          <span style="opacity:0.7; min-width:50px;">${eName}</span>
          <span style="flex:1; font-weight:bold;">${tx.name} ×${tx.qty}</span>
          <span style="font-weight:bold; color:${isSell ? '#5a9a5a' : '#c0392b'}; white-space:nowrap;">
            ${isSell ? '+' : '-'}${tx.total} 💰
          </span>
        </div>`;
      });
      h += `</div>`;
    }

    h += `</div>`;
    return h;
  },



  // ════════════════════════════════════════════════════════════════════
  // BUILDINGS — stavby skladů + dílen
  // ════════════════════════════════════════════════════════════════════
  renderBuildings: function() {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const storage = GameState.storage || {};
    const hasCarp = GameState.researchedTechs && GameState.researchedTechs.includes('tech_carpentaria');
    const hasAlm  = GameState.researchedTechs && GameState.researchedTechs.includes('tech_almarium');
    const hasCel  = GameState.researchedTechs && GameState.researchedTechs.includes('tech_cella');
    const hasHor  = GameState.researchedTechs && GameState.researchedTechs.includes('tech_horreum');
    const hasKov  = GameState.researchedTechs && GameState.researchedTechs.includes('tech_kovarina');
    const hasRust = GameState.researchedTechs && GameState.researchedTechs.includes('tech_de_re_rustica');
    const hasCrop = GameState.researchedTechs && GameState.researchedTechs.includes('tech_crop_rotation');
    const hasVin  = GameState.researchedTechs && GameState.researchedTechs.includes('tech_vinohrad');
    const hasVinF = GameState.researchedTechs && GameState.researchedTechs.includes('tech_vinifikace');
    const hasTonn = GameState.researchedTechs && GameState.researchedTechs.includes('tech_tonnellerie');
    const hasUvar = GameState.researchedTechs && GameState.researchedTechs.includes('tech_uvarium');
    const hasPOlei= GameState.researchedTechs && GameState.researchedTechs.includes('tech_prelum_olei');
    const hasCalcaria = GameState.researchedTechs && GameState.researchedTechs.includes('tech_calcaria');

    const title = lang === 'en' ? 'Buildings' : 'Budovy';

    const storageBuildings = [
      {
        id: 'almarium', icon: '🗄️',
        name: 'Almarium', name_en: 'Almarium',
        desc: 'Uzamčená skříň na suché zásoby. Kapacita 200 jednotek.',
        desc_en: 'Locked storeroom for dry goods. Capacity 200 units.',
        cost: { plank: 6, rope: 3, leather: 2 },
        req_tech: hasAlm, req_build: true, req_label: null, capacity: 200,
      },
      {
        id: 'cella', icon: '🏚️',
        name: 'Cella', name_en: 'Cella',
        desc: 'Chladný klenutý sklep. Kapacita 600j. Organické zásoby vydrží 2–3× déle.',
        desc_en: 'Cool vaulted cellar. Capacity 600 units. Organic stores last 2–3× longer.',
        cost: { cut_stone: 12, rope: 5, chalk: 4 },
        req_tech: hasCel,
        req_build: storage.almarium && storage.almarium.built,
        req_label: lang === 'en' ? 'Requires: Almarium built' : 'Nutné: Almarium postaveno',
        capacity: 600,
      },
      {
        id: 'horreum', icon: '🌾',
        name: 'Horreum', name_en: 'Horreum',
        desc: 'Velká sýpka. Kapacita 1600j. Aktivuje krmivo pro zvířata.',
        desc_en: 'Large granary. Capacity 1600 units. Activates animal fodder.',
        cost: { cut_stone: 20, plank: 10, glue: 4, rope: 6, hrebiky: 5 },
        req_tech: hasHor,
        req_build: storage.cella && storage.cella.built,
        req_label: lang === 'en' ? 'Requires: Cella built' : 'Nutné: Cella postavena',
        capacity: 1600,
      },
    ];

    const workshopBuildings = [
      {
        id: 'fabrica', icon: '⚒️',
        name: 'Fabrica', name_en: 'Smithy',
        desc: 'Kovářská dílna s výhní. Výroba a oprava železných nástrojů.',
        desc_en: 'Smithy with forge. Craft and repair iron tools.',
        cost: { rock: 30, plank: 15, charcoal: 10, anvil: 1, hrebiky: 8 },
        req_tech: hasKov, req_build: true, req_label: null,
      },
      {
        id: 'fornax_ferraria', icon: '🔥',
        name: 'Fornax Ferraria (Huť)', name_en: 'Fornax Ferraria (Smelting Furnace)',
        desc: 'Tavicí pec s měchy. Přetaví železnou rudu na ingoty. Vyžaduje souhlas opata.',
        desc_en: 'Smelting furnace with bellows. Converts iron ore into ingots. Requires Abbot consent.',
        cost: { rock: 40, cut_stone: 15, clay: 20, plank: 20, charcoal: 15, hrebiky: 10 },
        req_tech: hasKov,
        req_build: GameState.abbotPetition && GameState.abbotPetition.fornax && GameState.abbotPetition.fornax.status === 'approved',
        req_label: lang === 'en' ? 'Requires: Abbot approval (petition) + Fodina open' : 'Nutné: Souhlas opata (žádost) + Fodina otevřena',
        petition_type: 'fornax',
      },
      {
        id: 'sulci', icon: '🪠',
        name: 'Sulci — Brázdy', name_en: 'Sulci — Furrows',
        desc: 'Vydlabané brázdy a dřevěný pluh. Bez brázd pole neorat. Odemkne subtab Pole.',
        desc_en: 'Cut furrows and a wooden plough. Without furrows, fields cannot be ploughed. Unlocks the Fields tab.',
        cost: { plank: 8, rope: 4, stick: 10 },
        req_tech: hasRust, req_build: true, req_label: null,
      },
      {
        id: 'humno', icon: '🏚️',
        name: 'Humno — Area', name_en: 'Humno — Threshing Floor',
        desc: 'Mlátecí plocha z udusané hlíny. Mlácení obilí na slámě. +sláma ze sklizně.',
        desc_en: 'Threshing floor of tamped earth. Threshing grain on straw. +straw from harvest.',
        cost: { cut_stone: 8, plank: 6, rope: 3 },
        req_tech: hasCrop,
        req_build: GameState.storage && GameState.storage.sulci && GameState.storage.sulci.built,
        req_label: lang === 'en' ? 'Requires: Sulci built' : 'Nutné: Brázdy postaveny',
      },
      {
        id: 'uvarium', icon: '☀️',
        name: 'Uvarium — Sušárna', name_en: 'Uvarium — Drying House',
        desc: 'Sušení hroznů na slunci a ve stínu. Giacomo přivezl znalost z Benátek. Výroba hrozinek.',
        desc_en: 'Drying grapes in sun and shade. Giacomo brought the knowledge from Venice. Raisin production.',
        cost: { plank: 8, rock: 4, rope: 3, hrebiky: 4 },
        req_tech: hasUvar,
        req_build: GameState.storage && GameState.storage.foudres && GameState.storage.foudres.built,
        req_label: lang === 'en' ? 'Requires: Foudres built + Uvarium tech' : 'Nutné: Foudres postaveny + tech Uvarium',
      },
      {
        id: 'prelum_olei', icon: '🫙',
        name: 'Prelum Olei — Lisovna', name_en: 'Prelum Olei — Oil Press',
        desc: 'Lněný olej z pole lisovaný dřevěným klínem. Propojení Pole → Skriptorium.',
        desc_en: 'Linseed oil from the field, pressed with a wooden wedge. Links Field → Scriptorium.',
        cost: { plank: 10, rope: 4, rock: 4, iron_ingot: 1, hrebiky: 5 },
        req_tech: hasPOlei,
        req_build: GameState.storage && GameState.storage.sulci && GameState.storage.sulci.built,
        req_label: lang === 'en' ? 'Requires: Sulci built + Prelum Olei tech' : 'Nutné: Brázdy postaveny + tech Prelum Olei',
      },
      {
        id: 'vapenice', icon: '🏭',
        name: 'Vápenice', name_en: 'Lime Kiln',
        desc: 'Pec u lomu. Dny a noci nepřetržitého ohně promění vápenec v pálené vápno.',
        desc_en: 'A kiln by the quarry. Days and nights of unbroken fire turn limestone into quicklime.',
        cost: { plank: 15, cut_stone: 20, clay: 20, hrebiky: 7 },
        req_tech: hasCalcaria, req_build: true, req_label: null,
      },
    ];

    const wineBuildings = [
      {
        id: 'vinea', icon: '🍇',
        name: 'Vinohrad (Vinea)', name_en: 'Vineyard (Vinea)',
        desc: 'Ohrada s dřevěnými opěrami a drátěným vedením pro révu. Odemkne výsadbu révy (6 slotů).',
        desc_en: 'Enclosure with wooden stakes and wire training for vines. Unlocks vine planting (6 slots).',
        cost: { plank: 12, rope: 6, rock: 6 },
        req_tech: hasVin, req_build: true, req_label: null,
      },
      {
        id: 'prelum', icon: '🍷',
        name: 'Prelum — Vinný lis', name_en: 'Prelum — Wine Press',
        desc: 'Dřevěný rám, kamenná podlaha, železné šrouby. Odemkne lisování hroznů → Mustum.',
        desc_en: 'Wooden frame, stone floor, iron screws. Unlocks grape pressing → Mustum.',
        cost: { plank: 8, rope: 4, rock: 6, iron_ingot: 2, hrebiky: 4 },
        req_tech: hasVin,
        req_build: GameState.storage && GameState.storage.vinea && GameState.storage.vinea.built,
        req_label: lang === 'en' ? 'Requires: Vinea built' : 'Nutné: Vinohrad (Vinea) postaven',
      },
      {
        id: 'cella_fermentaria', icon: '🫙',
        name: 'Cella fermentaria', name_en: 'Cella fermentaria',
        desc: 'Hliněné nádoby, kamenné zdivo, chlad. Odemkne fermentaci → Vinum a Vinum Rubrum.',
        desc_en: 'Clay vessels, stone masonry, cool air. Unlocks fermentation → Vinum and Vinum Rubrum.',
        cost: { plank: 10, rock: 8, rope: 3, clay: 4, hrebiky: 5 },
        req_tech: hasVinF,
        req_build: GameState.storage && GameState.storage.prelum && GameState.storage.prelum.built,
        req_label: lang === 'en' ? 'Requires: Prelum built + Ars Vinificandi' : 'Nutné: Prelum postaveno + Ars Vinificandi',
      },
      {
        id: 'foudres', icon: '🛢️',
        name: 'Foudres — Sudy', name_en: 'Foudres — Barrels',
        desc: 'Velké dubové sudy. Víno zrající v sudu získá jantarovou barvu. Odemkne Vinum Praeclarum.',
        desc_en: 'Large oak barrels. Wine aged in the barrel gains amber colour. Unlocks Vinum Praeclarum.',
        cost: { plank: 15, rope: 6, iron_ingot: 3, hrebiky: 7 },
        req_tech: hasTonn,
        req_build: GameState.storage && GameState.storage.cella_fermentaria && GameState.storage.cella_fermentaria.built,
        req_label: lang === 'en' ? 'Requires: Cella fermentaria + Ars Tonnellaria' : 'Nutné: Cella fermentaria + Ars Tonnellaria',
      },
      {
        id: 'cellarium_vini', icon: '🏺',
        name: 'Cellarium Vini — Vinný sklep', name_en: 'Cellarium Vini — Wine Cellar',
        desc: 'Chladný sklep s regály pro sudy. Giacomo platí za víno o 30% více.',
        desc_en: 'Cool cellar with barrel racks. Giacomo pays 30% more for wine.',
        cost: { cut_stone: 10, plank: 6, rope: 4, hrebiky: 3 },
        req_tech: hasTonn,
        req_build: GameState.storage && GameState.storage.foudres && GameState.storage.foudres.built,
        req_label: lang === 'en' ? 'Requires: Foudres built' : 'Nutné: Foudres postaveny',
      },
    ];
    const renderBuilding = (b) => {
      const built = storage[b.id] && storage[b.id].built;
      const canBuild = b.req_tech && b.req_build && !built;
      const locked = !b.req_tech;
      const waitBuild = b.req_tech && !b.req_build && !built;
      const costStr = Object.entries(b.cost).map(([id, qty]) => {
        const item = ItemsDB[id];
        const icon = item ? item.icon : '📦';
        const name = (typeof iName === 'function') ? iName(id) : (item ? item.name : id);
        const have = GameState.inventory[id] || 0;
        const ok = have >= qty;
        return `<span style="color:${ok ? 'inherit' : '#c0392b'};">${icon} ${name} ×${qty} (${lang==='en'?'have':'máš'}: ${have})</span>`;
      }).join(' &nbsp;');
      const statusIcon = built ? '✅' : (locked ? '🔒' : (waitBuild ? '⏳' : '🏗️'));
      const statusColor = built ? '#5a9a5a' : (locked ? 'rgba(0,0,0,0.3)' : 'var(--accent-gold)');
      return `<div style="padding:12px; background:rgba(197,160,89,0.05);
                        border-radius:8px; border:1px solid rgba(197,160,89,${built ? '0.5' : '0.2'});
                        border-left:4px solid ${statusColor};">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
          <span style="font-size:1.6rem;">${b.icon}</span>
          <div style="flex:1;">
            <div style="font-weight:bold; font-size:0.92rem;">${statusIcon} ${lang==='en' ? b.name_en : b.name}</div>
            <div style="font-size:0.78rem; opacity:0.75; margin-top:2px;">${lang==='en' ? b.desc_en : b.desc}</div>
          </div>
        </div>
        ${!built ? `<div style="font-size:0.73rem; opacity:0.7; margin-bottom:6px; display:flex; flex-wrap:wrap; gap:6px;">${costStr}</div>` : ''}
        ${b.req_label && !built ? `<div style="font-size:0.73rem; color:#e67e22; margin-bottom:6px;">⚠️ ${b.req_label}</div>` : ''}
        ${b.petition_type && !built ? (() => {
          const pet = GameState.abbotPetition && GameState.abbotPetition[b.petition_type];
          const pStatus = pet ? pet.status : 'none';
          if (pStatus === 'none') {
            return `<button class="craft-btn" style="font-size:0.78rem; margin-bottom:6px;" onclick="Game.submitAbbotPetition('${b.petition_type}'); if(typeof CellariumSystem !== 'undefined') CellariumSystem.switchEntity('buildings');">📜 ${t('abbotPetition.' + b.petition_type + '.submit_btn')}</button>`;
          } else if (pStatus === 'pending') {
            const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
            const sd = pet.submittedAt ? _toGameDate(pet.submittedAt).toLocaleDateString(lang==='cs'?'cs-CZ':'en-GB') : '?';
            const rd = pet.submittedAt ? _toGameDate(pet.submittedAt + 86400000).toLocaleDateString(lang==='cs'?'cs-CZ':'en-GB') : '?';
            return `<div style="font-size:0.78rem; opacity:0.7; font-style:italic;">⏳ ${t('abbotPetition.' + b.petition_type + '.pending').replace('{date}', sd).replace('{responseDate}', rd)}</div>`;
          }
          return '';
        })() : ''}
        ${canBuild ? `<button onclick="Game.buildStorage('${b.id}')" class="craft-btn" style="font-size:0.78rem;">🏗️ ${lang==='en' ? 'Build' : 'Postavit'}</button>` : ''}
        ${built ? `<div style="font-size:0.78rem; color:#5a9a5a; font-style:italic;">✅ ${lang==='en' ? 'Built' : 'Postaveno'}</div>` : ''}
        ${locked ? `<div style="font-size:0.78rem; opacity:0.5; font-style:italic;">🔒 ${lang==='en' ? 'Research required' : 'Vyžaduje výzkum'}</div>` : ''}
        ${waitBuild ? `<div style="font-size:0.78rem; opacity:0.6; font-style:italic;">⏳ ${b.req_label}</div>` : ''}
      </div>`;
    };

    const baseCap = 1000;   // sync s DecaySystem.totalCapacity
    const almCap  = (storage.almarium && storage.almarium.built) ? 200 : 0;
    const celCap  = (storage.cella    && storage.cella.built)    ? 600 : 0;
    const horCap  = (storage.horreum  && storage.horreum.built)  ? 1600 : 0;
    const oldCellCap = (storage.old_cellars && storage.old_cellars.built) ? 500 : 0;
    const totalCap = baseCap + almCap + celCap + horCap + oldCellCap;
    const capLabel = lang === 'en'
      ? `Current capacity: <strong>${totalCap} units</strong>`
      : `Aktuální kapacita: <strong>${totalCap} j</strong>`;

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<div style="font-size:0.75rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:14px;">${title}</div>`;

    if (!hasCarp) {
      h += `<div style="text-align:center; padding:20px; opacity:0.6; border:1px dashed rgba(197,160,89,0.3); border-radius:8px;">
        <div style="font-size:2rem; margin-bottom:8px;">🪚</div>
        <div style="font-style:italic; font-size:0.9rem;">
          ${lang === 'en' ? 'Study <strong>Carpentaria — Carpentry</strong> to unlock building.' : 'Prostuduj <strong>Carpentaria — Tesářství</strong> pro odemčení staveb.'}
        </div>
      </div>`;
    } else {
      // Collapsible sekce — grid: mobil 1 sloupec, desktop 2 (auto-fit)
      const section = (icon, label, inner) => `
        <details open style="background:rgba(197,160,89,0.04); border:1px solid rgba(197,160,89,0.2); border-radius:8px; padding:0;">
          <summary style="cursor:pointer; padding:10px 12px; font-size:0.78rem; font-weight:bold; letter-spacing:0.06em; text-transform:uppercase; opacity:0.8; user-select:none; list-style:none;">
            ${icon} ${label} <span style="float:right; opacity:0.5;">▾</span>
          </summary>
          <div style="padding:0 10px 10px;">${inner}</div>
        </details>`;

      let storInner = `<div style="grid-column:1/-1; font-size:0.78rem; padding:6px 8px; background:rgba(197,160,89,0.08); border-radius:6px;">${capLabel}</div>`;
      storageBuildings.forEach(b => { storInner += renderBuilding(b); });
      let wineInner = '';
      wineBuildings.forEach(b => { wineInner += renderBuilding(b); });
      let workInner = '';
      workshopBuildings.forEach(b => { workInner += renderBuilding(b); });

      // Dvůr — zvířecí stavby (stav v GameState.<pen>.built, staví GardenSystem)
      const penDefs = [
        { pen: 'rabbitry',    icon: '🐇', tech: 'tech_cuniculi' },
        { pen: 'goatpen',     icon: '🐐', tech: 'tech_caprile' },
        { pen: 'cowbyre',     icon: '🐄', tech: 'tech_armentum' },
        { pen: 'pigsty',      icon: '🐖', tech: 'tech_suile' },
        { pen: 'stable',      icon: '🐎', tech: 'tech_stabulum' },
        { pen: 'donkeyStall', icon: '🫏', tech: 'tech_asinus' },
      ];
      let dvurInner = '';
      penDefs.forEach(d => {
        if (typeof FarmyardSystem === 'undefined') return;
        FarmyardSystem._ensureAnimals();
        const cfg = FarmyardSystem.ANIMAL_CFG[d.pen];
        if (!cfg) return;   // stable nebo neznámý pen
        const built = GameState[d.pen] && GameState[d.pen].built;
        const hasT = GameState.researchedTechs && GameState.researchedTechs.includes(d.tech);
        const can = hasT && !built && FarmyardSystem._animalCanBuild(cfg.build);
        const costStr = Object.entries(cfg.build).map(([id, n]) => {
          const it = ItemsDB[id];
          const have = GameState.inventory[id] || 0;
          return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang==='en'?'has':'máš'}: ${have})</span></div>`;
        }).join('');
        dvurInner += `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
          <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">${d.icon} ${t('dvur.title_' + d.pen)}</div>
          <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${t('dvur.buildDesc_' + d.pen)}</div>
          ${built
            ? `<div style="font-size:0.78rem; color:#5a9a5a;">✅ ${lang==='en' ? 'Built' : 'Postaveno'}</div>`
            : !hasT
              ? `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${t('dvur.lockedPrefix')} ${(typeof tName === 'function') ? tName(d.tech) : d.tech}</div>`
              : costStr + `<button onclick="FarmyardSystem.buildAnimalPen('${d.pen}')" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${can ? '' : 'disabled'}>🏗️ ${lang==='en' ? 'Build' : 'Postavit'}</button>`}
        </div>`;
      });

      // Kurník a Ovčín — bespoke build funkce (Game.buildHenhouse/buildSheepfold)
      const simplePens = [
        { key: 'henhouse',  icon: '🐔', titleK: 'farmyard.gallinarium', descK: 'farmyard.hennhouseBuildDesc',
          cost: { rock: 15, stick: 10, rope: 3 }, fn: 'Game.buildHenhouse()' },
        { key: 'sheepfold', icon: '🐑', titleK: 'farmyard.ovile',       descK: 'farmyard.sheepfoldBuildDesc',
          cost: { rock: 20, stick: 15, rope: 5 }, fn: 'Game.buildSheepfold()',
          tech: 'tech_de_re_rustica' },
        { key: 'columbarium', icon: '🕊️', titleK: 'farmyard.columbarium', descK: 'farmyard.columbariumBuildDesc',
          cost: { cut_stone: 60, plank: 25, log: 15, wicker: 20, rope: 10, hrebiky: 10 }, fn: 'FarmyardSystem.buildColumbarium()',
          tech: 'tech_porta' },
      ];
      simplePens.forEach(d => {
        const built = GameState[d.key] && GameState[d.key].built;
        const hasT = !d.tech || (GameState.researchedTechs && GameState.researchedTechs.includes(d.tech));
        const can = hasT && !built && Object.entries(d.cost).every(([id, n]) => (GameState.inventory[id]||0) >= n);
        const costStr2 = Object.entries(d.cost).map(([id, n]) => {
          const it = ItemsDB[id];
          const have = GameState.inventory[id] || 0;
          return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang==='en'?'has':'máš'}: ${have})</span></div>`;
        }).join('');
        dvurInner += `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
          <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">${d.icon} ${t(d.titleK)}</div>
          <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${t(d.descK)}</div>
          ${built
            ? `<div style="font-size:0.78rem; color:#5a9a5a;">✅ ${lang==='en' ? 'Built' : 'Postaveno'}</div>`
            : !hasT
              ? `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${t('dvur.lockedPrefix')} ${(typeof tName === 'function') ? tName(d.tech) : d.tech}</div>`
              : costStr2 + `<button onclick="${d.fn}" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${can ? '' : 'disabled'}>🏗️ ${lang==='en' ? 'Build' : 'Postavit'}</button>`}
        </div>`;
      });

      // Studna — progresivní karta (patří k Dvoru, vedle kurníku/ovčína)
      dvurInner += this._renderWellBuilding(lang);

      // Knihovna — Stupeň I (Studovna). Tech tech_studovna otevírá možnost,
      // samotná stavba (materiál+groše) v Cellarium/Budovy, mirror vzoru Vápenice.
      const hasStudovnaTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_studovna');
      const libBuilt = storage.knihovna_grade_i && storage.knihovna_grade_i.built;
      const libCost = { cut_stone: 20, plank: 15, rope: 6, hrebiky: 7 };
      const libGrose = 15;
      const libHasGrose = (typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) >= libGrose;
      const libHasItems = Object.entries(libCost).every(([id, n]) => (GameState.inventory[id]||0) >= n);
      const libCan = hasStudovnaTech && !libBuilt && libHasGrose && libHasItems;
      const libCostStr = Object.entries(libCost).map(([id, n]) => {
        const it = ItemsDB[id];
        const have = GameState.inventory[id] || 0;
        return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang==='en'?'has':'máš'}: ${have})</span></div>`;
      }).join('') + `<div style="font-size:0.72rem; ${libHasGrose ? '' : 'color:#c0392b;'}">💰 ${libGrose}g</div>`;
      let libInner = `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
        <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">📖 ${lang==='en'?'Knihovna — Grade I':'Knihovna — Stupeň I'}</div>
        <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${lang==='en'?"A private study room by the library — receives the Lord's guests.":'Studovna při knihovně — přijímá hosty Vrchnosti.'}</div>
        ${libBuilt
          ? `<div style="font-size:0.78rem; color:#5a9a5a;">✅ ${lang==='en' ? 'Built' : 'Postaveno'}</div>`
          : !hasStudovnaTech
            ? `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${t('dvur.lockedPrefix')} ${(typeof tName === 'function') ? tName('tech_studovna') : 'Studovna'}</div>`
            : libCostStr + `<button onclick="Game.buildStorage('knihovna_grade_i')" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${libCan ? '' : 'disabled'}>🏗️ ${lang==='en' ? 'Build' : 'Postavit'}</button>`}
      </div>`;

      // Dormitorium — bratři (Dormitorium MRD), 3 sekvenční tiery, bez tech gate
      // (jen materiál + groše — sekvence I→II→III vynucena v Game.buildStorage).
      const dormTiers = [
        { id: 'dormitorium_i',   icon: '📿', label: lang==='en'?'Dormitorium I':'Dormitorium I',
          desc: lang==='en'?'Cells for 3 brothers.':'Cely pro 3 bratry.',
          cost: { cut_stone: 30, plank: 20, rope: 8, hrebiky: 10 }, grose: 15, reqPrev: null },
        { id: 'dormitorium_ii',  icon: '📿', label: lang==='en'?'Dormitorium II':'Dormitorium II',
          desc: lang==='en'?'Expanded — 6 brothers.':'Rozšířeno — 6 bratrů.',
          cost: { cut_stone: 90, plank: 60, rope: 25, iron_ingot: 2, glass_stopper: 6, hrebiky: 25 }, grose: 35, reqPrev: 'dormitorium_i' },
        { id: 'dormitorium_iii', icon: '📿', label: lang==='en'?'Dormitorium III':'Dormitorium III',
          desc: lang==='en'?'Full wing — 10 brothers.':'Celé křídlo — 10 bratrů.',
          cost: { cut_stone: 200, plank: 130, rope: 50, iron_ingot: 6, glass_stopper: 10, glass_tankard: 10, hrebiky: 50 }, grose: 70, reqPrev: 'dormitorium_ii' },
      ];
      let dormInner = '';
      dormTiers.forEach(d => {
        const built = storage[d.id] && storage[d.id].built;
        const prevOk = !d.reqPrev || (storage[d.reqPrev] && storage[d.reqPrev].built);
        const hasGrose = (typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) >= d.grose;
        const hasItems = Object.entries(d.cost).every(([id, n]) => (GameState.inventory[id]||0) >= n);
        const can = prevOk && !built && hasGrose && hasItems;
        const costStr = Object.entries(d.cost).map(([id, n]) => {
          const it = ItemsDB[id];
          const have = GameState.inventory[id] || 0;
          return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang==='en'?'has':'máš'}: ${have})</span></div>`;
        }).join('') + `<div style="font-size:0.72rem; ${hasGrose ? '' : 'color:#c0392b;'}">💰 ${d.grose}g</div>`;
        dormInner += `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
          <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">${d.icon} ${d.label}</div>
          <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${d.desc}</div>
          ${built
            ? `<div style="font-size:0.78rem; color:#5a9a5a;">✅ ${lang==='en' ? 'Built' : 'Postaveno'}</div>`
            : !prevOk
              ? `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${lang==='en' ? 'Requires: ' + (dormTiers.find(x=>x.id===d.reqPrev)||{}).label : 'Nutné: ' + (dormTiers.find(x=>x.id===d.reqPrev)||{}).label}</div>`
              : costStr + `<button onclick="Game.buildStorage('${d.id}')" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${can ? '' : 'disabled'}>🏗️ ${lang==='en' ? 'Build' : 'Postavit'}</button>`}
        </div>`;
      });

      // Sekce pod sebou (full-width), karty uvnitř v responsivním gridu
      const grid = (inner) => `<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:8px; align-items:start;">${inner}</div>`;
      h += `<div style="display:flex; flex-direction:column; gap:12px;">`;
      h += section('📦', lang==='en' ? 'Storage' : 'Sklady', grid(storInner));
      h += section('⚒️', lang==='en' ? 'Workshops' : 'Dílny', grid(workInner));
      h += section('🐄', lang==='en' ? 'Farmyard' : 'Dvůr', grid(dvurInner));
      h += section('🍇', lang==='en' ? 'Winery' : 'Vinohrad', grid(wineInner));
      h += section('📖', lang==='en' ? 'Library' : 'Knihovna', grid(libInner));
      h += section('📿', lang==='en' ? 'Dormitorium' : 'Dormitorium', grid(dormInner));
      h += `</div>`;
    }

    h += `</div>`;
    return h;
  },

  // Studna — progresivní karta (postavit → kamenná → posvěcená) v sekci Dvůr
  _renderWellBuilding: function(lang) {
    const w = GameState.well || {};
    const lvl = w.built ? w.level : 'none';
    const hasStone   = GameState.researchedTechs && GameState.researchedTechs.includes('tech_well_stone');
    const hasBlessed = GameState.researchedTechs && GameState.researchedTechs.includes('tech_well_blessed');

    const costRow = (cost) => Object.entries(cost).map(([id, n]) => {
      const it = ItemsDB[id];
      const have = GameState.inventory[id] || 0;
      return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang==='en'?'has':'máš'}: ${have})</span></div>`;
    }).join('');
    const canAfford = (cost) => Object.entries(cost).every(([id, n]) => (GameState.inventory[id]||0) >= n);
    const btn = (fn, cost, label) => `${costRow(cost)}<button onclick="${fn}" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${canAfford(cost) ? '' : 'disabled'}>🏗️ ${label}</button>`;
    const lockTech = (techName) => `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${t('dvur.lockedPrefix')} ${(typeof tName === 'function') ? tName(techName) : techName}</div>`;

    // Aktuální stav + další akce
    let statusLine, action;
    if (lvl === 'none') {
      statusLine = `<span style="opacity:0.7;">${t('wellUI.notBuiltShort')}</span>`;
      action = btn("WellSystem.upgradeWell('basic')", { rock: 20, stick: 10, rope: 3 }, t('wellUI.buildBasicBtn'));
    } else if (lvl === 'basic') {
      statusLine = `✅ ${t('wellUI.levelBasic')}`;
      action = hasStone
        ? btn("WellSystem.upgradeWell('stone')", { rock: 30, rope: 5, charcoal: 10 }, t('wellUI.upgradeStoneBtn'))
        : lockTech('tech_well_stone');
    } else if (lvl === 'stone') {
      statusLine = `✅ ${t('wellUI.levelStone')}`;
      action = hasBlessed
        ? btn("WellSystem.upgradeWell('blessed')", { cut_stone: 30, chalk: 8, candle: 5 }, t('wellUI.upgradeBlessedBtn'))
        : lockTech('tech_well_blessed');
    } else {
      statusLine = `✅ ${t('wellUI.levelBlessed')}`;
      action = `<div style="font-size:0.78rem; color:#5a9a5a; font-style:italic;">✨ ${t('wellUI.maxLevel')}</div>`;
    }

    return `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
      <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">🚰 ${t('wellUI.buildingName')}</div>
      <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${t('wellUI.buildingDesc')}</div>
      <div style="font-size:0.8rem; margin-bottom:6px;">${statusLine}</div>
      ${action}
    </div>`;
  },


};