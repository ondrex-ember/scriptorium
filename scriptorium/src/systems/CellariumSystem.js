// ═══════════════════════════════════════════════════════════════════════════════
// CELLARIUM SYSTEM v8.1 — Economy & Barter
// Pražský groš · Benedikt z Litomyšle · Hospoda / Obchod / Trh
// ═══════════════════════════════════════════════════════════════════════════════

const CellariumSystem = {

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════

  init: function () {
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

  hasCommercium: function () { return GameState.researchedTechs.includes('tech_commercium'); },
  hasCellarium: function () { return GameState.researchedTechs.includes('tech_cellarium_rd2'); },
  hasNumismatica: function () { return GameState.researchedTechs.includes('tech_numismatica'); },

  // ═══════════════════════════════════════════════════════════════════════════
  // TREASURY — GROŠE
  // ═══════════════════════════════════════════════════════════════════════════

  getGrose: function () {
    return GameState.treasury.grose || 0;
  },

  // ledger-audit-mrd (28.8.2026) — druhý parametr nepovinný, zpětně
  // kompatibilní. Volání beze změny (addGrose(x)) se chová přesně jako
  // dřív. Kdo pošle ledger:{title,source,source_en}, zapíše se to
  // rovnou i do Liber Rationum — jedno volání místo dvou, nejde
  // zapomenout druhou půlku (přesně tahle mezera se předtím opakovala
  // 32× napříč projektem, viz audit).
  addGrose: function (amount, ledger) {
    if (!GameState.treasury) GameState.treasury = { grose: 0 };
    GameState.treasury.grose = (GameState.treasury.grose || 0) + amount;
    if (ledger && ledger.title) {
      if (amount > 0) this.recordCommissionIncome(ledger.title, amount, ledger.source, ledger.source_en);
      else if (amount < 0) this.recordCommissionExpense(ledger.title, Math.abs(amount), ledger.source, ledger.source_en);
    }
    Game.save();
    this.refreshGroseDisplay();
  },

  spendGrose: function (amount) {
    if (this.getGrose() < amount) return false;
    GameState.treasury.grose -= amount;
    Game.save();
    this.refreshGroseDisplay();
    return true;
  },

  refreshGroseDisplay: function () {
    const el = document.getElementById('cellarium-grose-count');
    if (el) el.textContent = this.getGrose();
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME WINDOW — je daná entita otevřena?
  // Hospoda: každý den 14:00–02:00
  // Obchod:  Po–Pá 09:00–17:00
  // Trh:     So–Ne 08:00–16:00
  // ═══════════════════════════════════════════════════════════════════════════

  isEntityOpen: function (entity) {
    const now = new Date();
    const hour = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour() : now.getHours();
    const day = (typeof TimeSys !== 'undefined') ? TimeSys.gameWeekday() : now.getDay(); // 0=Ne, 1=Po ... 6=So

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
  entityHoursLabel: function (entity) {
    if (entity === 'tavern') return 'každý den 14:00–02:00';
    if (entity === 'shop') return 'Po–Pá 09:00–17:00';
    if (entity === 'market') return 'So–Ne 08:00–16:00';
    return '';
  },

  entityHoursLabel_en: function (entity) {
    if (entity === 'tavern') return 'daily 14:00–02:00';
    if (entity === 'shop') return 'Mon–Fri 09:00–17:00';
    if (entity === 'market') return 'Sat–Sun 08:00–16:00';
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
    zlaty_prut: 1360,
    // Lore / Psaní
    paper: 2,
    ink: 2,
    ink_gallic: 5,
    vellum: 20,
    common_codex: 35,
    luxury_codex: 75,
    vellum_codex: 150,
    research: 3,
    // Rukopisy — craftované knihy (tier 1→4)
    adversaria: 18,
    vademecum: 45,
    florilegium: 70,
    enchiridion: 110,
    fitted_codex: 160,
    // Jídlo
    bread: 1,
    bread_fine: 2,
    bread_fine_1: 4,
    cooked_meat: 3,
    cooked_fish: 2,
    stew: 4,
    mushroom_soup: 3,
    berry_pie: 3,
    berry_pie_fine: 5,
    berry_pie_fine_1: 8,
    // pekarna-audit v3 (30.8.2026) — nové prodejné pečivo
    pernik: 10,
    preclik: 3,
    postni_chleb: 2,
    honey: 4,
    // Caseus — sýry (3 typy × fáze + syrečky)
    goat_cheese_fresh: 9,
    goat_cheese_mature: 14,
    goat_cheese_aged: 22,
    sheep_cheese_fresh: 10,
    sheep_cheese_mature: 16,
    sheep_cheese_aged: 24,
    cow_cheese_fresh: 8,
    cow_cheese_mature: 13,
    cow_cheese_aged: 20,
    syrecky_fresh: 5,
    syrecky_mature: 9,
    // Suroviny
    fiber: 1,
    bark: 1,
    hide: 4,
    leather: 6,
    bone: 1,
    feather: 1,
    resin: 2,
    charcoal: 1,
    // Byliny
    herb_red: 2,
    herb_yellow: 2,
    herb_blue: 3,
    roots: 2,
    // Alchymie
    potion_heal: 6,
    antidote: 8,
    stamina_tonic: 7,
    preservation_oil: 8,
    candle: 2,
    // Nápoje
    beer: 2,
    wine: 5,
    // Suroviny — nové
    chalk: 2,
    // Leather system
    metal: 15,
    glue: 6,
    tallow: 4,
    sealant: 12,
    bellows: 40,
    book_binding: 25,
    // Varhany — Heinrich Traxdorf (fixed price, prodej jen přes NPC modal)
    organ: 600,
    // Herní desky (jen nákup, ne prodej)
    senet_board: 6,
    backgammon_board: 10,
    draughts_board: 8,
    hnefatafl_board: 15,
    // Ovoce ze sadu (Pomarium)
    apple: 2,
    pear: 2,
    plum: 2,
    cherry: 2,
    walnut: 4,
    mulberry: 3,
    quince: 3,
    sorb: 5,
    rowan: 1,
    linden_fruit: 2,
    // Produkty dvora (Curia)
    egg: 2,
    milk: 3,
    wool: 5,
    raw_hide: 4,
    feather_hen: 1,
    pollen: 3,
    bee_bread: 9,   // pyl-prepracovani-mrd (18.8.2026): zpracovaný z 10x pollen
    linden_blossom: 3,
    beeswax: 6,
    propolis: 7,   // MRD 5.5 — drobná šance při sklizni, vzácnější než pyl
    propolis_tinktura: 16, // MRD 5.5 — Athanor: propolis+spiritus_vini:maceratio
    propolis_tinktura_vyzrala: 32, // MRD 5.6 — 10denní zrání, dvojnásobná cena
    // Sýry (Lactaria/Caseus — prodej: Hospoda + Trh + Sýrař; Obchod vyloučen)
    goat_cheese_fresh: 4,
    goat_cheese_mature: 8,
    goat_cheese_aged: 15,
    sheep_cheese_fresh: 5,
    sheep_cheese_mature: 9,
    sheep_cheese_aged: 17,
    cow_cheese_fresh: 5,
    cow_cheese_mature: 10,
    cow_cheese_aged: 18,
    syrecky_fresh: 3,
    syrecky_mature: 6,
    // Semena (prodej přebytku — cca polovina nákupní ceny)
    seed_apple: 4,
    seed_pear: 4,
    seed_plum: 3,
    seed_cherry: 4,
    seed_walnut: 7,
    seed_mulberry: 6,
    seed_quince: 5,
    seed_sorb: 9,
    seed_rowan: 4,
    seed_linden: 7,
    // Rybník (Piscina)
    fry: 3,
    carp_young: 5,
    carp: 8,
    // Produkty Gallinarium & Ovile
    chicken_meat: 4,
    mutton: 6,
    // udirna-mrd (7.8.2026): hotový konzervovaný produkt, dražší než syrové maso
    cured_meat: 10,
    cured_beef: 12,
    lamb_hide: 8,
    chick: 3,
    // MRD Columbarium II — holoubě cennější než dospělý pták (historicky doloženo)
    pigeon_squab: 7,
    pigeon_meat: 4,
    lamb: 5,
    veteran_queen: 280,
  },

  // Plošné snížení výkupních cen (Trh/Obchod/Hospoda) — jedno místo k doladění.
  // Neovlivňuje nákupní ceny (calcBuyPrice) — jen calcPrice (sellItem).
  // Clientela (data/contacts.js) staví na calcPrice('market') jako základ,
  // takže se tenhle multiplikátor propaguje i tam automaticky.
  SELL_PRICE_MULT: 0.70,   // −30 %

  // Koeficienty per entita (prodej hráče → entita)
  ENTITY_COEFF: {
    tavern: { food: 1.3, lore: 0.6, mat: 0.7, alchemy: 0.9 },
    shop: { food: 0.8, lore: 1.0, mat: 1.0, alchemy: 1.0 },
    market: { food: 1.0, lore: 1.1, mat: 1.1, alchemy: 1.1 },
  },

  ITEM_CAT: {
    paper: 'lore', ink: 'lore', ink_gallic: 'lore', vellum: 'lore',
    common_codex: 'lore', luxury_codex: 'lore', vellum_codex: 'lore', research: 'lore',
    adversaria: 'lore', vademecum: 'lore', florilegium: 'lore', enchiridion: 'lore', fitted_codex: 'lore',
    bread: 'food', bread_fine: 'food', bread_fine_1: 'food', cooked_meat: 'food', cooked_fish: 'food', stew: 'food',
    mushroom_soup: 'food', berry_pie: 'food', berry_pie_fine: 'food', berry_pie_fine_1: 'food', honey: 'food',
    pernik: 'food', preclik: 'food', postni_chleb: 'food',
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
    feather_hen: 'mat', pollen: 'mat', bee_bread: 'mat', linden_blossom: 'mat', beeswax: 'mat', propolis: 'mat', propolis_tinktura: 'mat', propolis_tinktura_vyzrala: 'mat',
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
  _saturationMult: function (itemId, entity) {
    this._resetStockIfNewDay();
    const sold = (GameState.shopStock.dailySold[this._stockKey(entity, itemId)] || 0);
    if (sold <= 5) return 1.00;
    if (sold <= 15) return 0.80;
    if (sold <= 30) return 0.60;
    return 0.45;
  },

  // CH-2: Postní dny (Chronicon fast flag) — ryby žádané, maso leží
  FAST_FISH: ['cooked_fish', 'carp'],
  FAST_MEAT: ['cooked_meat', 'chicken_meat', 'mutton', 'pigeon_squab', 'pigeon_meat'],

  _fastMult: function (itemId) {
    const snap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
    if (!snap || !snap.fast || !snap.fast.active) return 1.0;
    if (this.FAST_FISH.includes(itemId)) return 1.5;
    if (this.FAST_MEAT.includes(itemId)) return 0.5;
    return 1.0;
  },

  // Reputace → cenový multiplikátor (jen Hospoda; Trh/Obchod = čistě nabídka/poptávka)
  _repMult: function (entity) {
    if (entity !== 'tavern') return 1.0;
    return 1.10 + ((GameState.persona?.influence?.benedikt || 0) / 100) * 0.25;
  },

  calcPrice: function (itemId, entity, skipSaturation) {
    const base = this.BASE_PRICES[itemId];
    if (!base) return null;
    const cat = this.ITEM_CAT[itemId] || 'mat';
    const coeff = this.ENTITY_COEFF[entity][cat] || 1.0;
    // Denní seed pro konzistentní ceny během dne
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
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
  _calcSaturatedSale: function (baseNoSat, qty, soldBefore, hardCap) {
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

  sellItem: function (itemId, qty, entity) {
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
    let total = result.total;

    // Cechovní regulace & 10% poplatek (MRD v0.1-v0.6). Matter-level (ne
    // guild-level) — Pekařský má dvě různé věci, mouka je vždy jen
    // Mlynářského (v0.6 bod 4).
    let guildFee = 0;
    const affectedMatter = (typeof getItemGuildMatter === 'function') ? getItemGuildMatter(itemId) : null;
    // Cechy si hráče "všimly" až po GM zprávě (unlock_flags: guilds_noticed) —
    // do té doby fušerství nehlásíme, aby stará rozjetá hra nedostala tension
    // bez jakýhokoliv varování (v0.6 bod 5).
    const guildsNoticedPlayer = GameState.unlockedFlags && GameState.unlockedFlags.includes('guilds_noticed');
    if (affectedMatter && guildsNoticedPlayer) {
      const guildId = affectedMatter.guild.id;
      const matterKey = affectedMatter.matter.key;
      const privilegeStatus = GameState.guildPravo && GameState.guildPravo[matterKey] && GameState.guildPravo[matterKey].status;
      if (privilegeStatus === 'granted') {
        // Privilegium uděleno -> 10% poplatek cechu
        guildFee = Math.round(total * 0.10);
        total = Math.max(1, total - guildFee);
      } else {
        // Privilegium NENÍ uděleno -> fušerství (neoprávněný prodej), hlášení do Chroniconu.
        // count ořezán na klientovi i na serveru (MAX_COUNT_PER_REPORT) — jeden
        // velký prodej nesmí vychýlit napětí neúměrně (v0.6 bod 3).
        const todayStr = new Date().toISOString().slice(0, 10);
        if (typeof fetch === 'function') {
          fetch('/api/guild-tension-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId: guildId, day: todayStr, count: Math.min(qty, 5) })
          }).catch(err => console.warn('[guild-tension-report] send error:', err.message));
        }
        // v0.9 (25.8.2026) — hráč dřív neviděl, že se něco děje (jen tichej
        // report na pozadí). Teď jasně řekni, co riskuje a jak to napravit.
        const _flang = (GameState.settings && GameState.settings.language) || 'cs';
        const _gName = _flang === 'en' ? affectedMatter.guild.name_en : affectedMatter.guild.name;
        UI.notify(_flang === 'en'
          ? `⚠️ Sold without ${_gName}'s leave — fušerství. No privilege, no fee, but the guild's suspicion grows. Negotiate in Cellarium — Guilds to sell legally.`
          : `⚠️ Prodáno bez svolení cechu (${_gName}) — fušerství. Bez privilegia, bez poplatku, ale podezření cechu roste. Vyjednej si prodej v Cellariu — Cechy.`, true);
      }
    }

    // abbot-persona-mrd (9.8.2026) — konečně zapojený cellariumExtraYield,
    // dřív jen dekorativní pilulka. Mlynářovo jmění = "štědřejší váha" —
    // hráč dostane zaplaceno za +1 kus navíc, aniž by ho fyzicky odevzdal
    // (removeItem níže pořád bere jen původní qty).
    if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem.getBuffs) {
      const _cey = ChroniconSystem.getBuffs().cellariumExtraYield || 0;
      if (_cey > 0 && qty > 0) total += Math.round((total / qty) * _cey);
    }

    Game.removeItem(itemId, qty);
    this.addGrose(total);
    // Saturace — zaznamenat prodané množství
    GameState.shopStock.dailySold[soldKey] = result.soldAfter;
    this.recordTransaction('sell', itemId, qty, Math.round(total / qty), entity);
    GameState.economy.tradesTotal++;

    if (guildFee > 0 && affectedMatter) {
      const _lang = (GameState.settings && GameState.settings.language) || 'cs';
      UI.notify(_lang === 'en'
        ? `🏛️ Paid 10% guild fee (${guildFee} groats) to ${affectedMatter.guild.name_en}`
        : `🏛️ Zaplacen 10% cechovní poplatek (${guildFee} grošů) cechu ${affectedMatter.guild.name}`);
    }
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
      NotificationSystem.panel('💰 ' + itemName + ' ×' + qty + ' → ' + total + ' g · ' + (_slang === 'en' ? entity : entity), 'system');
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
      { itemId: 'stamina_tonic', basePrice: 8, dailyStock: 3 },
      { itemId: 'beer', basePrice: 2, dailyStock: 20 },
      { itemId: 'wine', basePrice: 7, dailyStock: 8 },
      { itemId: 'seeds_cannabis', basePrice: 45, dailyStock: 1 }, // konopí seté — vzácné
    ],
    shop: [
      { itemId: 'chalk', basePrice: 2, dailyStock: 30 },
      { itemId: 'salt', basePrice: 12, dailyStock: 2 },
      { itemId: 'wine', basePrice: 4, dailyStock: 5 },
      { itemId: 'seeds_thyme', basePrice: 6, dailyStock: 5 }, // tymián — Varroa léčba
      { itemId: 'kopr', basePrice: 6, dailyStock: 8 }, // kopr — k rakům
      { itemId: 'seeds_kopr', basePrice: 10, dailyStock: 3 }, // semínka kopru — vzácnější
      { itemId: 'seeds_plantain', basePrice: 5, dailyStock: 5 }, // jitrocel — hojivá bylina
      { itemId: 'seeds_herb', basePrice: 6, dailyStock: 10 },
      { itemId: 'seeds_vegetable', basePrice: 6, dailyStock: 10 },
      { itemId: 'seeds_yellow', basePrice: 8, dailyStock: 3 }, // heřmánek
      { itemId: 'seeds_blue', basePrice: 8, dailyStock: 3 }, // levandule
      { itemId: 'seeds_mint', basePrice: 8, dailyStock: 3 },
      { itemId: 'seeds_sage', basePrice: 10, dailyStock: 3 },
      { itemId: 'seeds_fennel', basePrice: 10, dailyStock: 3 },
      { itemId: 'seeds_flax', basePrice: 9, dailyStock: 10 },
      // Hrách — obchod-podklad (7.8.2026): "Základní potraviny" v Olomouci
      // 1465 zahrnovaly obilí i hrách pospolu (základní trh, ne dálkový
      // dovoz) — dává smysl mít ho v Obchodě všední den, ne čekat na Trh
      // víkend. Zbytek polního osiva (žito/pšenice/ječmen...) zatím
      // zůstává jen na Trhu — otevřeno k rozšíření, pokud bude chtít Bouvard.
      { itemId: 'seeds_peas', basePrice: 5, dailyStock: 10 },
      { itemId: 'seeds_lentils', basePrice: 5, dailyStock: 10 }, // čočka — mirror hrách, obchod-podklad 7.8.2026
      // kovani-rozsireni-mrd (7.8.2026): hřebíky před tech_kovarina — drahý kanál, malý sklad
      { itemId: 'hrebiky', basePrice: 6, dailyStock: 3 },
      // Obchod-podklad (7.8.2026): 5 potvrzených mezer z historického
      // dokladu ("řemeslné výrobky běžné potřeby" + slané ryby, Zóna 1
      // olomouckého trhu). Karmín má navíc vlastní craft cestu (červec →
      // karmin, tech_cervec) — tohle je dovozní alternativa, dražší ale bez tech gatu.
      { itemId: 'pottery_vessel', basePrice: 6, dailyStock: 8 },
      { itemId: 'dreveky', basePrice: 5, dailyStock: 6 },
      { itemId: 'kozene_boty', basePrice: 14, dailyStock: 3 },
      { itemId: 'slany_sled', basePrice: 8, dailyStock: 10 },
      { itemId: 'karmin', basePrice: 30, dailyStock: 2 },
      // Kadidlo — dovozní pryskyřice (Thuribulum)
      { itemId: 'resin_styrax', basePrice: 18, dailyStock: 2, req_tech: 'tech_thuribulum' },
      // Alembik — destilační nádoba, dostupná v Obchodě od Destillatio (MRD: athanor-tiers)
      { itemId: 'alembic', basePrice: 30, dailyStock: 1, req_tech: 'tech_destillatio' },
      // Liturgická roucha — přesunuta do Tkadlecova Clientela buyOffer
      // (Clientela pool MRD, 25.7.2026): osobní vztah s tkadlecem, ne
      // anonymní pult vedle křídy a semínek. Viz contacts.js → tkadlec.
      // Včelař — sousedský chovatel, výhodnější cena než na Trhu (Trh: 40 groší)
      { itemId: 'queen_bee', basePrice: 22, dailyStock: 1, req_tech: 'tech_liber_apium' },
      // giacomo-obchod-mirror (7.8.2026): STEJNÝCH 14 položek jako Giacomo
      // (ContactsDB.giacomo.buyOffer), ale bez vztahu/reputace/přítomnosti —
      // anonymní pult, kdykoliv Obchod otevřený. Cena = Giacomova ZÁKLADNÍ
      // cena (ne slevněná) × 2,5 (běžné) nebo × 4,0 (top4 exotika — safran/
      // muškátový květ/hedvábí/olibanum, stejná čtveřice jako minReputation
      // gate u Giacoma). Sklad = poloviční, min. 1 — lokální trh dostane
      // menší příděl než přímý dovozce. STATICKY dopočteno teď, ne
      // dynamicky odvozeno z contacts.js — pokud se Giacomovy ceny změní,
      // je třeba přepočítat i tohle ručně.
      { itemId: 'paper_fine', basePrice: 15, dailyStock: 2 },  // 6×2.5
      { itemId: 'pepr_cerny', basePrice: 15, dailyStock: 2 },  // 6×2.5
      { itemId: 'zazvor', basePrice: 15, dailyStock: 2 },  // 6×2.5
      { itemId: 'hrebicek', basePrice: 30, dailyStock: 1 },  // 12×2.5
      { itemId: 'skorice', basePrice: 25, dailyStock: 1 },  // 10×2.5
      { itemId: 'muskat', basePrice: 35, dailyStock: 1 },  // 14×2.5
      { itemId: 'muskatovy_kvet', basePrice: 80, dailyStock: 1 },  // 20×4.0 — exotika
      { itemId: 'hedvabi', basePrice: 60, dailyStock: 1 },  // 15×4.0 — exotika
      { itemId: 'safran', basePrice: 112, dailyStock: 1 },  // 28×4.0 — exotika
      { itemId: 'alum', basePrice: 20, dailyStock: 2 },  // 8×2.5
      { itemId: 'sandarak', basePrice: 35, dailyStock: 1 },  // 14×2.5
      { itemId: 'sal_ammoniac', basePrice: 45, dailyStock: 1 },  // 18×2.5
      { itemId: 'verzino', basePrice: 40, dailyStock: 1 },  // 16×2.5
      { itemId: 'incense_styrax', basePrice: 25, dailyStock: 1 },  // 10×2.5
      { itemId: 'incense_olibanum', basePrice: 64, dailyStock: 1 },  // 16×4.0 — exotika
    ],
    market: [
      { itemId: 'paper', basePrice: 3, dailyStock: 25 },
      { itemId: 'paper_fine', basePrice: 18, dailyStock: 2, req_tech: 'tech_porta' },
      { itemId: 'palice_zelezna', basePrice: 50, dailyStock: 2, req_tech: 'tech_fodina' },
      { itemId: 'salt', basePrice: 9, dailyStock: 20 },
      // kovani-rozsireni-mrd (7.8.2026): hřebíky před tech_kovarina — střední kanál
      { itemId: 'hrebiky', basePrice: 4, dailyStock: 10 },
      // Zvířata
      { itemId: 'hen_white', basePrice: 15, dailyStock: 3 },
      { itemId: 'hen_black', basePrice: 18, dailyStock: 2 },
      { itemId: 'hen_colored', basePrice: 25, dailyStock: 1 },
      { itemId: 'rooster', basePrice: 20, dailyStock: 2 },
      { itemId: 'sheep', basePrice: 35, dailyStock: 2 },
      { itemId: 'rabbit_m', basePrice: 18, dailyStock: 2, req_tech: 'tech_cuniculi' },
      { itemId: 'rabbit_f', basePrice: 24, dailyStock: 2, req_tech: 'tech_cuniculi' },
      { itemId: 'goat', basePrice: 44, dailyStock: 1, req_tech: 'tech_caprile' },
      { itemId: 'piglet', basePrice: 40, dailyStock: 1, req_tech: 'tech_suile' },
      { itemId: 'horse', basePrice: 250, dailyStock: 1, req_tech: 'tech_stabulum' },
      { itemId: 'donkey', basePrice: 55, dailyStock: 1, req_tech: 'tech_asinus' },
      // Skot (Armentum) — kráva má týdenní zásobu (viz checkCowRestock), ne dailyStock
      { itemId: 'cow', basePrice: 70, req_tech: 'tech_armentum' },
      { itemId: 'tele', basePrice: 35, dailyStock: 1, req_tech: 'tech_armentum' },
      { itemId: 'byk', basePrice: 2000, dailyStock: 1, req_tech: 'tech_armentum' },
      { itemId: 'queen_bee', basePrice: 40, dailyStock: 1 },
      // Holoubě — dodatek 27.7.2026, alternativa k chovu (mirror ostatních
      // mláďat výše). Gate tech_porta, stejně jako samotný Holubník.
      { itemId: 'pigeon_squab_live', basePrice: 50, dailyStock: 2, req_tech: 'tech_porta' },
      // Semena stromů — drahá
      { itemId: 'seed_apple', basePrice: 8, dailyStock: 3 },
      { itemId: 'seed_pear', basePrice: 8, dailyStock: 3 },
      { itemId: 'seed_plum', basePrice: 7, dailyStock: 3 },
      { itemId: 'seed_cherry', basePrice: 9, dailyStock: 3 },
      { itemId: 'seed_walnut', basePrice: 15, dailyStock: 2 },
      { itemId: 'seed_mulberry', basePrice: 12, dailyStock: 2 },
      { itemId: 'seed_quince', basePrice: 10, dailyStock: 2 },
      { itemId: 'truhla_ii', basePrice: 1700, dailyStock: 1 },
      // katalogizace-regaly-mrd (2.9.2026) — dostupné na trhu bez ohledu na
      // vztah (Bouvard: "nejdřív by to mělo být dostupné na trhu"), plochá
      // cena, jen běžné denní tržní kolísání. Truhlář (Clientela) nabízí
      // stejné kusy se slevou dle vztahu, viz contacts.js + contactBuyDiscountMult.
      { itemId: 'shelf_pluteus_inferior', basePrice: 30, dailyStock: 2, req_tech: 'tech_marc' },
      { itemId: 'shelf_pluteus_medius', basePrice: 30, dailyStock: 2, req_tech: 'tech_marc' },
      { itemId: 'shelf_pluteus_superior', basePrice: 30, dailyStock: 2, req_tech: 'tech_marc' },
      { itemId: 'shelf_scrinium_parvum', basePrice: 30, dailyStock: 2, req_tech: 'tech_marc' },
      { itemId: 'seed_sorb', basePrice: 18, dailyStock: 2 },
      { itemId: 'seed_rowan', basePrice: 8, dailyStock: 3 },
      { itemId: 'seed_linden', basePrice: 14, dailyStock: 2 },
      // Rybník
      { itemId: 'fry', basePrice: 5, dailyStock: 5 },
      { itemId: 'stika', basePrice: 20, dailyStock: 1, req_tech: 'tech_piscina_administratio' },
      { itemId: 'pstruh', basePrice: 15, dailyStock: 2, req_tech: 'tech_piscina_administratio' },
      { itemId: 'uhor', basePrice: 22, dailyStock: 1, req_tech: 'tech_piscina_administratio' },
      // Zelenina
      { itemId: 'carrot', basePrice: 4, dailyStock: 30 },
      { itemId: 'onion', basePrice: 4, dailyStock: 30 },
      { itemId: 'leek', basePrice: 6, dailyStock: 20 },
      { itemId: 'cabbage', basePrice: 4, dailyStock: 30 },
      { itemId: 'garlic', basePrice: 8, dailyStock: 15 },
      // Semena zeleniny
      { itemId: 'seeds_leek', basePrice: 10, dailyStock: 5 },
      { itemId: 'seeds_cabbage', basePrice: 8, dailyStock: 5 },
      { itemId: 'seeds_garlic', basePrice: 12, dailyStock: 5 },
      { itemId: 'seeds_radish', basePrice: 6, dailyStock: 5 },
      { itemId: 'seeds_turnip', basePrice: 6, dailyStock: 5 },
      // Pivovar suroviny
      { itemId: 'grain', basePrice: 4, dailyStock: 15 }, // obilí — bulk komodita, sníženo (systém kvality zrna, anti-grind)
      { itemId: 'flour_2', basePrice: 9, dailyStock: 4 },  // mouka 2. třídy — vyplatí se vypěstovat vlastní přes mlýn, ne kupovat
      { itemId: 'hops', basePrice: 18, dailyStock: 15 }, // chmel — vzácnější
      // Osivo pro pole
      { itemId: 'seeds_rye', basePrice: 5, dailyStock: 40 },
      { itemId: 'seeds_wheat', basePrice: 6, dailyStock: 30 },
      { itemId: 'seeds_barley', basePrice: 5, dailyStock: 30 },
      { itemId: 'seeds_oats', basePrice: 4, dailyStock: 30 },
      { itemId: 'seeds_millet', basePrice: 6, dailyStock: 20 },
      // coquina-tier1-mrd (7.8.2026): pohanka — nová plodina, dostupná od začátku
      { itemId: 'seeds_pohanka', basePrice: 8, dailyStock: 10 },
      { itemId: 'seeds_peas', basePrice: 5, dailyStock: 25 },
      { itemId: 'seeds_vikev', basePrice: 5, dailyStock: 25 },
      // Kovářství (vyžaduje tech_kovarina)
      { itemId: 'stone_pickaxe', basePrice: 30, dailyStock: 5 },
      { itemId: 'iron_ore', basePrice: 15, dailyStock: 10, req_tech: 'tech_kovarina' },
      { itemId: 'anvil', basePrice: 250, dailyStock: 1, req_tech: 'tech_kovarina' },
      { itemId: 'iron_axe', basePrice: 65, dailyStock: 2, req_tech: 'tech_kovarina' },
      { itemId: 'iron_spade', basePrice: 55, dailyStock: 2, req_tech: 'tech_kovarina' },
      { itemId: 'iron_scythe', basePrice: 70, dailyStock: 2, req_tech: 'tech_kovarina' },
      { itemId: 'iron_sickle', basePrice: 50, dailyStock: 2, req_tech: 'tech_kovarina' },
      { itemId: 'iron_flail', basePrice: 60, dailyStock: 2, req_tech: 'tech_kovarina' },
      { itemId: 'iron_shovel', basePrice: 55, dailyStock: 2, req_tech: 'tech_kovarina' },
      { itemId: 'iron_saw', basePrice: 65, dailyStock: 2, req_tech: 'tech_kovarina' },
      // kovarna-dilna-mrd.md v0.5 (30.8.2026) — vybavení pro Kovárnu
      { itemId: 'podkovarske_kladivo', basePrice: 35, dailyStock: 2, req_tech: 'tech_kovarina' },
      { itemId: 'raspa_kopytni', basePrice: 20, dailyStock: 1, req_tech: 'tech_kovarina' },
      // Kadidlo — vzácné arabské olibanum přes Giacoma (Thuribulum)
      { itemId: 'resin_olibanum', basePrice: 45, dailyStock: 1, req_tech: 'tech_thuribulum' },
    ],
  },

  // ── Daily Stock helpers ────────────────────────────────────────────────────
  _stockKey: function (entity, itemId) { return entity + ':' + itemId; },

  _resetStockIfNewDay: function () {
    if (!GameState.shopStock) GameState.shopStock = { date: '', used: {}, dailySold: {} };
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (GameState.shopStock.date !== today) {
      GameState.shopStock.date = today;
      GameState.shopStock.used = {};
      GameState.shopStock.dailySold = {};
      // TODO: Chronicon stock_boost/shortage signal — napojit až Chronicon live
    }
    // Migrace starých savů bez dailySold
    if (!GameState.shopStock.dailySold) GameState.shopStock.dailySold = {};
  },

  _getStockRemaining: function (entity, itemId) {
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

  _useStock: function (entity, itemId) {
    if (itemId === 'cow') { if (GameState.economy) GameState.economy.cowAvailable = false; return; }
    const key = this._stockKey(entity, itemId);
    GameState.shopStock.used[key] = (GameState.shopStock.used[key] || 0) + 1;
  },

  buyItem: function (entity, itemId) {
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
  applyDrinkEffect: function (itemId) {
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

  calcBuyPrice: function (itemId, entity, basePrice) {
    const shopList = this.ENTITY_SHOP[entity];
    if (!shopList) return 0;
    // Pokud basePrice není předán, najdi ho
    const entry = shopList.find(s => s.itemId === itemId);
    const base = basePrice !== undefined ? basePrice : (entry ? entry.basePrice : 0);
    if (!base) return 0;
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const pseudoRand = ((seed * 9301 + entity.charCodeAt(0) * 49297 + itemId.charCodeAt(0) * 233 + 777) % 1000) / 1000;
    const offset = 0.85 + pseudoRand * 0.30;
    return Math.max(1, Math.round(base * offset));
  },

  // Pivo/víno vypité rovnou u pultu — platí se zvlášť od BUY, žádný item
  // do inventáře, efekt hned. Sdílí denní sklad s "koupit s sebou" (BUY),
  // je to fyzicky tentýž sud/soudek.
  drinkAtTavern: function (entity, itemId) {
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

  // Cechy — cechy-a-prava-mrd.md §3 / chronicon-cechy-mrd.md. Read-only
  // status (K2). Mutable stav (relation/pravo) žije v GameState.
  // guildRelation/guildPravo, NE v GuildsDB (ten je statická definice,
  // mirror ContactsDB — viz oprava 16.8.2026 v data/guilds.js).
  // `tension` se čte živě z Chroniconu, NIKDY se lokálně neukládá —
  // je to sdílený svět, ne hráčův stav. Jen 4 MVP aktivní cechy
  // (GUILDS_ACTIVE), zbytek existuje v datech, ale nezobrazuje se,
  // dokud nepřijde Furnus.
  renderCechyStatus: function (lang) {
    if (typeof GuildsDB === 'undefined') return '';
    const activeGuilds = (typeof getActiveGuilds === 'function') ? getActiveGuilds() : (typeof GUILDS_BASE_ACTIVE !== 'undefined' ? GUILDS_BASE_ACTIVE : []);
    const snap = (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._snap) ? ChroniconSystem._snap : null;
    const worldGuilds = (snap && snap.guilds) || null;
    const guildRelation = GameState.guildRelation || {};
    const guildPravo = GameState.guildPravo || {};
    const guildPhase0 = GameState.guildPhase0 || {};

    let rows = '';
    activeGuilds.forEach(id => {
      const g = GuildsDB[id];
      if (!g) return;
      const name = lang === 'en' ? g.name_en : g.name;
      const tension = (worldGuilds && worldGuilds[id]) ? Math.round(worldGuilds[id].tension) : null;
      const tensionLabel = tension === null ? (lang === 'en' ? 'unknown' : 'neznámo') : `${tension}/100`;
      const rel = guildRelation[id] || 0;

      // Jeden řádek na VĚC (matterKey) — Pekařský má dvě, ostatní jednu
      // (v0.6 bod 4, mirror per cech×věc granularity).
      (g.matters || []).forEach(matter => {
        const matterLabel = lang === 'en' ? (matter.label_en || matter.label) : matter.label;
        const p0Status = (guildPhase0[matter.key] && guildPhase0[matter.key].status) || 'none';
        const pravoStatus = (guildPravo[matter.key] && guildPravo[matter.key].status) || 'none';

        let statusBadge = '';
        if (pravoStatus === 'granted') {
          statusBadge = `✅ ${lang === 'en' ? 'Privilege' : 'Privilegium'}`;
        } else if (pravoStatus === 'pending' || pravoStatus === 'negotiating') {
          statusBadge = `⏳ ${lang === 'en' ? 'Phase 2' : 'Fáze 2'}`;
        } else if (p0Status === 'approved') {
          statusBadge = `🔓 ${lang === 'en' ? 'Phase 0 Open' : 'Jednání'}`;
        } else if (p0Status === 'pending') {
          statusBadge = `⏳ ${lang === 'en' ? 'Phase 0' : 'Fáze 0'}`;
        } else {
          statusBadge = `🔒 ${lang === 'en' ? 'None' : 'Žádné'}`;
        }

        rows += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.74rem; opacity:0.85; padding:3px 0; border-bottom:1px dashed rgba(197,160,89,0.15);">
          <span>${g.masterIcon || '📜'} <strong>${name}</strong> — ${matterLabel} (${lang === 'en' ? 'rel' : 'vztah'} ${rel}/100)</span>
          <span>🔥 ${tensionLabel} · ${statusBadge}</span>
        </div>`;
      });
    });

    if (!rows) return '';

    if (!GameState.ui) GameState.ui = {};
    const cechyOpen = GameState.ui.cechyStatusOpen === true;
    return `<details ${cechyOpen ? 'open' : ''} ontoggle="GameState.ui.cechyStatusOpen = this.open; Game.save();" style="font-size:0.78rem;opacity:0.85;margin-bottom:10px;background:rgba(197,160,89,0.08);border-radius:6px;">
      <summary style="cursor:pointer; padding:8px 10px; font-weight:bold; list-style:none; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:6px;">
        <span>⚖️ ${lang === 'en' ? 'Guild Status' : 'Stav cechů'}</span><span style="opacity:0.5; font-weight:normal;">▾</span>
      </summary>
      <div style="padding:0 10px 8px;">
        ${rows}
      </div>
    </details>`;
  },

  renderBuyPanel: function (entity, lang) {
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

  checkGiacomoEvent: function () {
    if (!this.hasCommercium()) return;
    const now = Date.now();
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
  checkCowRestock: function () {
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
  isGiacomoPresent: function () {
    return (Date.now() - (GameState.economy.lastGiacomoVisit || 0)) < this.GIACOMO_PRESENCE_MS;
  },
  // giacomo-prezence-audit (7.8.2026): dřív se přítomnost zjišťovala jen při
  // pokusu o nákup (chybová notify) — nikde v UI se aktivně neukazovala.
  // Vrací { present: bool, days: int } — present ? dny do odjezdu : dny do
  // příjezdu (týdenní cyklus checkGiacomoEvent, 7 dní).
  giacomoDaysLeft: function () {
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
  giacomoStockMult: function () {
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

  checkStationariusEvent: function () {
    const now = Date.now();
    if (!GameState.library) GameState.library = {};
    if (now - (GameState.library.lastStationariusVisit || 0) >= this.STATIONARIUS_INTERVAL_MS) {
      GameState.library.lastStationariusVisit = now;
      Game.save();
    }
  },

  isStationariusPresent: function () {
    if (!GameState.library) return false;
    return (Date.now() - (GameState.library.lastStationariusVisit || 0)) < this.STATIONARIUS_PRESENCE_MS;
  },

  showGiacomoArrival: function () {
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

  // giacomo-market-stall (1.9.2026): Giacomo byl od začátku myšlen jako
  // dostupný hned (ContactsDB.giacomo.unlockTech = null), ale jediný vstup
  // k jeho buyOffer byl v Clientela — gated na rankTier>=3. Hráči pod tier 3
  // tak dostávali "Giacomo přijel!" pozvánku bez jakéhokoliv místa, kam jít.
  // Mirror Stationarius vzoru v Knihovně (ui.js) — vlastní "stánek" mimo
  // Clientela grid, volá stejný renderContactPanel(), žádný nový obchodní
  // engine. Mizí, jakmile hráč odemkne Clientela (tam má plnohodnotný vstup).
  renderGiacomoMarketStall: function (lang) {
    if (typeof ContactsDB === 'undefined' || !ContactsDB.giacomo) return '';
    const c = ContactsDB.giacomo;
    const present = this.isGiacomoPresent();
    const d = this.giacomoDaysLeft();
    const open = GameState.ui && GameState.ui.marketGiacomoOpen;

    let statusLine;
    if (present) {
      statusLine = lang === 'en' ? `In port — departs in ${d.days}d.` : `V přístavu — odplouvá za ${d.days} dny.`;
    } else {
      const lastVisit = (GameState.economy && GameState.economy.lastGiacomoVisit) || 0;
      const daysSince = lastVisit ? Math.floor((Date.now() - lastVisit) / 86400000) : null;
      const lastLine = daysSince !== null
        ? (lang === 'en' ? ` Last in the region ${daysSince}d ago.` : ` Naposledy v kraji před ${daysSince} dny.`)
        : '';
      statusLine = (lang === 'en' ? `At sea — returns in ${d.days}d.` : `Na moři — vrací se za ${d.days} dní.`) + lastLine;
    }

    let h = `<div style="margin-bottom:16px;padding:12px 14px;background:rgba(197,160,89,0.07);border:1px solid rgba(197,160,89,0.3);border-radius:6px;">
      <div style="display:flex;align-items:center;gap:10px;${present ? '' : 'opacity:0.6;'}">
        <div style="font-size:1.6rem;">${c.icon}</div>
        <div style="flex:1;">
          <strong>${lang === 'en' ? c.name_en : c.name}</strong>
          <div class="text-sm" style="opacity:0.75;">${statusLine}</div>
        </div>
        ${present ? `<button class="craft-btn" onclick="GameState.ui.marketGiacomoOpen = !GameState.ui.marketGiacomoOpen; SaeculumSystem.switchEntity('market');">🤝 ${lang === 'en' ? 'Trade' : 'Obchod'}</button>` : ''}
      </div>
      ${(present && open && typeof SaeculumSystem !== 'undefined') ? SaeculumSystem.renderContactPanel('giacomo') : ''}
    </div>`;
    return h;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEINRICH TRAXDORF EVENT — weekly organ merchant
  // ═══════════════════════════════════════════════════════════════════════════

  hasOrganum: function () {
    return GameState.researchedTechs && GameState.researchedTechs.includes('tech_organum_hydraulicum');
  },

  checkHeinrichEvent: function () {
    if (!this.hasOrganum()) return;
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    if (now - (GameState.economy.lastHeinrichVisit || 0) >= week) {
      GameState.economy.lastHeinrichVisit = now;
      Game.save();
      this.showHeinrichArrival();
    }
  },

  showHeinrichArrival: function () {
    let existing = document.getElementById('heinrich-modal');
    if (existing) existing.remove();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const modal = document.createElement('div');
    modal.id = 'heinrich-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    const title = t('cellarium.heinrichTitle');
    const subtitle = t('cellarium.heinrichSubtitle');
    const greeting = t('cellarium.heinrichGreeting');
    const btnClose = t('cellarium.heinrichBtnClose');
    const btnBuy = t('cellarium.heinrichBtnBuy');
    const alreadyHas = (GameState.inventory['organ'] || 0) > 0;
    const canAfford = this.getGrose() >= 600;

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

  buyOrganFromHeinrich: function () {
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

  renderCellariumTab: function () {
    // Gate: tech_cellarium_rd2 required
    if (!this.hasCellarium()) {
      return this.renderLockedScreen();
    }
    return this.renderCellariumContent();
  },

  renderLockedScreen: function () {
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
  _benediktMotto: function (context) {
    context = context || 'cellarium';
    const grose = this.getGrose();
    const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;
    const stock = ds ? ds.totalStock() : 0;
    const cap = ds ? ds.totalCapacity() : 1000;
    const pct = cap > 0 ? Math.round(stock / cap * 100) : 0;

    if (grose === 0) return t('cellarium.mottoEmpty');
    if (grose < 10) return t('cellarium.mottoPoor');
    if (context === 'saeculum') {
      if (!this.isEntityOpen('tavern')) return t('cellarium.mottoShuttered');
    } else {
      if (pct > 90) return t('cellarium.mottoFull');
    }
    if (grose > 200) return t('cellarium.mottoRich');
    return t('cellarium.motto');
  },

  // ── Benedikt — stats panel (cellarium = sklad/zásoby, saeculum = hospoda) ──
  // VITREA V5: rozpad vybavení (informační modal — obchod se děje u Skláře/na trhu)
  showVitreaDetail: function () {
    if (typeof NotificationSystem === 'undefined') return;
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const inv = GameState.inventory || {};
    const row = (id) => {
      const n = inv[id] || 0;
      const nm = (typeof iName === 'function') ? iName(id) : id;
      return `<div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:2px; ${n === 0 ? 'opacity:0.45;' : ''}"><span>${nm}</span><strong>${n}</strong></div>`;
    };
    let html = `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin-bottom:4px;">🍽️ ${lang === 'en' ? 'Tableware' : 'Stolní nádobí'}</div>`;
    ['glass_goblet', 'glass_tankard', 'glass_jug', 'glass_bowl', 'glass_pitcher', 'wooden_bowl'].forEach(id => html += row(id));
    html += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:8px 0 4px;">⚗️ ${lang === 'en' ? 'Laboratory' : 'Laboratoř'}</div>`;
    ['alembic', 'glass_flask', 'glass_stopper'].forEach(id => html += row(id));
    html += `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:8px 0 4px;">🏺 ${lang === 'en' ? 'Other' : 'Ostatní'}</div>`;
    ['window_roundel', 'glass_vase', 'glass_mirror', 'paternoster_beads', 'fly_trap_glass'].forEach(id => html += row(id));
    const lb = GameState.vitreaLastBroken;
    if (lb) {
      const nm = (typeof iName === 'function') ? iName(lb.id) : lb.id;
      const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
      const when = _toGameDate(lb.ts).toLocaleDateString(lang === 'en' ? 'en-GB' : 'cs-CZ');
      html += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic; margin-top:10px;">💥 ${lang === 'en' ? 'Last broken' : 'Naposled rozbito'}: ${nm} (${when})</div>`;
    }
    NotificationSystem.modal({
      icon: '🍶',
      title: lang === 'en' ? 'Monastery equipment' : 'Klášterní vybavení',
      text: html,
      choices: [{ label: (lang === 'en' ? 'Close' : 'Zavřít') }]
    });
  },

  _benediktStats: function (context) {
    context = context || 'cellarium';
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;
    const stock = ds ? ds.totalStock() : 0;
    const cap = ds ? ds.totalCapacity() : 1000;
    const pct = cap > 0 ? Math.round(stock / cap * 100) : 0;
    const capColor = pct > 90 ? '#c0392b' : pct > 70 ? '#e67e22' : '#5a9a5a';

    const hasLR = GameState.researchedTechs && GameState.researchedTechs.includes('tech_liber_rationum');
    const txs = (GameState.treasury && GameState.treasury.transactions) || [];
    const totalSold = hasLR
      ? txs.filter(t => t.type === 'sell').reduce((s, t) => s + (t.total || 0), 0)
      : null;

    let h = `<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:0.78rem;opacity:0.8;
                         padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:6px;margin-bottom:14px;">`;
    if (totalSold !== null) {
      h += `<span>📊 ${lang === 'en' ? 'Sold' : 'Prodáno'}: <strong>${totalSold} g</strong></span>`;
    }
    if (context === 'saeculum') {
      const tavernOpen = this.isEntityOpen('tavern');
      const tavernTxt = tavernOpen
        ? `<span style="color:#5a9a5a;">● ${lang === 'en' ? 'open' : 'otevřeno'}</span>`
        : `<span style="color:#c0392b;">● ${lang === 'en' ? 'closed' : 'zavřeno'}</span>`;
      h += `<span>🍺 ${lang === 'en' ? 'Tavern' : 'Hospoda'}: ${tavernTxt}</span>`;
      // CH-2: postní den — indikátor
      const _fsnap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
      if (_fsnap && _fsnap.fast && _fsnap.fast.active) {
        const fn = (lang === 'en' ? (_fsnap.fast.name_en || _fsnap.fast.name_cs) : _fsnap.fast.name_cs) || '';
        h += `<span>🐟 ${lang === 'en' ? 'Fast day' : 'Postní den'}${fn ? ' (' + fn + ')' : ''} — ${lang === 'en' ? 'fish in demand, meat lies' : 'ryby žádané, maso leží'}</span>`;
      }
    } else {
      h += `<span>🌾 ${lang === 'en' ? 'Stores' : 'Zásoby'}: <strong style="color:${capColor};">${pct}%</strong></span>`;
    }
    // VITREA V5: agregát vybavení (stolní kapacita vs. bratři) — klik = rozpad
    if (GameState.vitreaGranted) {
      const TG = ['glass_goblet', 'glass_tankard', 'glass_jug', 'glass_bowl', 'glass_pitcher'];
      const glassCap = TG.reduce((s, id) => s + (GameState.inventory[id] || 0), 0);
      const woodCap = GameState.inventory['wooden_bowl'] || 0;
      const need = Math.max(1, (GameState.conversi || []).length);
      const vPct = Math.min(100, Math.round((glassCap + woodCap) / need * 100));
      const vColor = vPct >= 100 ? '#5a9a5a' : vPct >= 50 ? '#e67e22' : '#c0392b';
      h += `<span style="cursor:pointer;" onclick="CellariumSystem.showVitreaDetail()" title="${lang === 'en' ? 'Click for breakdown' : 'Klik pro rozpad'}">🍶 ${lang === 'en' ? 'Equipment' : 'Vybavení'}: <strong style="color:${vColor};">${vPct}%</strong></span>`;
    }
    h += `</div>`;
    return h;
  },

  renderCellariumContent: function () {
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

  renderEntityTabs: function () {
    const hasInv = GameState.researchedTechs && GameState.researchedTechs.includes('tech_inventarium');
    const hasLR = GameState.researchedTechs && GameState.researchedTechs.includes('tech_liber_rationum');
    const hasOldCellars = (GameState.researchedTechs && GameState.researchedTechs.includes('tech_conventual_spaces')) || GameState.oldCellarsFound;
    // Manufaktura: tech + postavené Dormitorium (obojí musí platit — tech
    // samo o sobě může být vyzkoumaný dřív, tab se ale neukáže, dokud
    // budova fyzicky nestojí). Dormitorium NEMÁ vlastní .built pole —
    // sleduje se přes GameState.storage.dormitorium_i/ii/iii (3 úrovně),
    // stejný check jako v hireBrother().
    const hasManufactura = (GameState.researchedTechs && GameState.researchedTechs.includes('tech_manufactura_overview'))
      && typeof Game !== 'undefined' && Game.dormitoriumCapacity && Game.dormitoriumCapacity() > 0;

    const entities = [
      ...(hasInv ? [{ id: 'inventarium', icon: '📦', label: 'Inventarium', label_en: 'Inventarium' }] : []),
      ...(hasLR ? [{ id: 'liber_rationum', icon: '📒', label: 'Liber Rationum', label_en: 'Liber Rationum' }] : []),
      ...(hasOldCellars ? [{ id: 'old_cellars', icon: '🕯️', label: 'Staré sklepy', label_en: 'Old Cellars' }] : []),
      ...(hasManufactura ? [{ id: 'manufaktura', icon: '⚙️', label: 'Manufaktura', label_en: 'Manufactory' }] : []),
      { id: 'personal', icon: '👥', label: 'Personál', label_en: 'Personnel' },
      { id: 'buildings', icon: '🏗️', label: 'Budovy', label_en: 'Buildings' },
      // Cechy — cechy-a-prava-mrd.md §3, 16.8.2026. Vědomě NEgatováno tech_ius_terrae
      // (na rozdíl od Trh panelu) — relace se buduje zakázkama i bez znalosti
      // práva, hráč to musí vidět průběžně, ne až po výzkumu. Vždy dostupný,
      // mirror personal/buildings (žádný open/closed hodinovej gate).
      { id: 'cechy', icon: '⚖️', label: 'Cechy', label_en: 'Guilds' },
      // Pozemky — pozemky-mrd.md §6, 16.8.2026. Podmíněnej, na rozdíl od
      // Cechů — dokud hráč nepromluví s opatem (Budovy tab), tab se
      // vůbec nezobrazí. Jakmile flags.pozemky_active, zůstává natrvalo.
      ...((GameState.flags && GameState.flags.pozemky_active) ? [{ id: 'pozemky', icon: '🏛️', label: 'Pozemky', label_en: 'Land' }] : []),
    ];
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!GameState.ui) GameState.ui = {};
    const active = GameState.ui.cellariumEntity || 'buildings';
    const safeActive = entities.some(e => e.id === active) ? active : 'buildings';

    // Tab buttons
    let h = `<div style="display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap;">`;
    entities.forEach(e => {
      const open = this.isEntityOpen(e.id);
      const isCur = e.id === safeActive;
      const name = lang === 'en' ? e.label_en : e.label;
      const hours = lang === 'en' ? this.entityHoursLabel_en(e.id) : this.entityHoursLabel(e.id);
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

  switchEntity: function (entityId) {
    if (!GameState.ui) GameState.ui = {};
    GameState.ui.cellariumEntity = entityId;
    const el = document.getElementById('cellarium-content');
    if (el) el.outerHTML = this.renderCellariumContent();
    else this.renderCellariumTab();
  },

  renderEntityPanel: function (entity) {
    // Speciální chlívky — nemají hodiny ani nákup/prodej
    if (entity === 'inventarium') return this.renderInventarium();
    if (entity === 'liber_rationum') return this.renderLiberRationum();
    if (entity === 'old_cellars') return this.renderOldCellars();
    if (entity === 'buildings') return this.renderBuildings();
    if (entity === 'cechy') return this.renderCechyPanel();
    if (entity === 'pozemky') return this.renderPozemkyPanel();
    if (entity === 'manufaktura') return (typeof SaeculumSystem !== 'undefined') ? SaeculumSystem.renderManufactura() : '';
    if (entity === 'personal') return (typeof SaeculumSystem !== 'undefined') ? SaeculumSystem.renderPersonal() : '';

    const open = this.isEntityOpen(entity);
    const lang = (GameState.settings && GameState.settings.language) || 'cs';

    let h = '';
    // Giacomo stánek — nezávislý na otevírací době Trhu (So-Ne) a na
    // Clientela (rankTier>=3). Vlastní real-time okno, viz isGiacomoPresent.
    if (entity === 'market') {
      const rankTier = (typeof RankSystem !== 'undefined' && RankSystem.getSecularRankTier) ? RankSystem.getSecularRankTier() : 1;
      if (rankTier < 3) h += this.renderGiacomoMarketStall(lang);
    }

    h += `<div style="padding:15px; background:rgba(0,0,0,0.03);
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
      <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
        <button class="filter-btn${sub === 'shop' ? ' active' : ''}" onclick="GameState.ui.tavernSubtab='shop'; SaeculumSystem.switchEntity('tavern');" style="padding:6px 14px; font-weight:bold;">
          🍺 ${lang === 'en' ? 'Tavern Store' : 'Šenk & Obchod'}
        </button>
        <button class="filter-btn${sub === 'dice' ? ' active' : ''}" onclick="GameState.ui.tavernSubtab='dice'; SaeculumSystem.switchEntity('tavern');" style="padding:6px 14px; font-weight:bold; background:${sub === 'dice' ? 'var(--accent-gold)' : 'rgba(197,160,89,0.1)'}; color:${sub === 'dice' ? '#000' : 'var(--ink-primary)'};">
          🎲 ${lang === 'en' ? 'Hazard' : 'Hazard'}
        </button>
        <button class="filter-btn${sub === 'lapkove' ? ' active' : ''}" onclick="GameState.ui.tavernSubtab='lapkove'; SaeculumSystem.switchEntity('tavern');" style="padding:6px 14px; font-weight:bold; background:${sub === 'lapkove' ? 'var(--accent-gold)' : 'rgba(197,160,89,0.1)'}; color:${sub === 'lapkove' ? '#000' : 'var(--ink-primary)'};">
          🗡️ ${lang === 'en' ? 'The Lapkové Gang' : 'Parta Lapků'}
        </button>
        <button class="filter-btn${sub === 'mercenaries' ? ' active' : ''}" onclick="GameState.ui.tavernSubtab='mercenaries'; SaeculumSystem.switchEntity('tavern');" style="padding:6px 14px; font-weight:bold; background:${sub === 'mercenaries' ? 'var(--accent-gold)' : 'rgba(197,160,89,0.1)'}; color:${sub === 'mercenaries' ? '#000' : 'var(--ink-primary)'};">
          🛡️ ${lang === 'en' ? 'Mercenaries' : 'Žoldnéři'}
        </button>
      </div>
      `;

      if (sub === 'mercenaries') {
        return h + this._renderMercenariesSub(lang);
      }

      if (sub === 'dice' || sub === 'lapkove') {
        h += `<div id="tavern-dice-container"></div>`;
        // eventy-audit-mrd (05.09.2026) bod 3 dodatek — samostatná záložka
        // "Parta Lapků" skočí rovnou na Risk Stack (activeGame='riskstack')
        // místo výchozí Hazard hry; Hazard záložka nechává activeGame beze
        // změny (co bylo naposled zvoleno, výchozí 'hazard').
        setTimeout(() => {
            if (typeof TavernDice !== 'undefined') {
                if (sub === 'lapkove') TavernDice.activeGame = 'riskstack';
                else if (TavernDice.activeGame === 'riskstack') TavernDice.activeGame = 'hazard';
                TavernDice.render();
            }
        }, 20);
        return h;
      }

      const rel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.benedikt) || 0;
      const pct = Math.round((this._repMult('tavern') - 1) * 100);
      h += `<div style="font-size:0.78rem;opacity:0.75;margin-bottom:10px;padding:6px 10px;background:rgba(197,160,89,0.08);border-radius:6px;">
        🏠 Benedikt: ${rel}/100 → ${lang === 'en' ? 'prices' : 'ceny'} ${pct >= 0 ? '+' : ''}${pct}%
      </div>`;
    } else if (entity === 'shop') {
      const rel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.village) || 0;
      h += `<div style="font-size:0.78rem;opacity:0.75;margin-bottom:10px;padding:6px 10px;background:rgba(197,160,89,0.08);border-radius:6px;">
        🌾 ${lang === 'en' ? 'Village' : 'Vesnice'}: ${rel}/100
      </div>`;
    } else if (entity === 'market') {
      const rel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.giacomo) || 0;
      h += `<div style="font-size:0.78rem;opacity:0.75;margin-bottom:10px;padding:6px 10px;background:rgba(197,160,89,0.08);border-radius:6px;">
        ⚓ Giacomo: ${rel}/100
      </div>`;
      h += this.renderCechyStatus(lang);
    }

    // ── Dvousloupcový layout: NÁKUP | PRODEJ ───────────────────────────────
    const sellLabel = lang === 'en' ? 'SELL' : 'PRODEJ';
    const TAVERN_ITEMS = ['bread', 'cooked_meat', 'cooked_fish', 'stew', 'mushroom_soup',
      'berry_pie', 'honey', 'water', 'potion_heal', 'stamina_tonic',
      'sleep_potion', 'candle',
      'pernik', 'preclik', 'postni_chleb',
      'egg', 'milk', 'chicken_meat', 'mutton', 'pigeon_squab', 'pigeon_meat',
      'apple', 'pear', 'plum', 'cherry',
      'beer', 'wine',
      // udirna-mrd (7.8.2026): Trh čeká na Cechy, Hospoda může teď
      'cured_meat', 'cured_beef',
      'goat_cheese_fresh', 'goat_cheese_mature', 'goat_cheese_aged',
      'sheep_cheese_fresh', 'sheep_cheese_mature', 'sheep_cheese_aged',
      'cow_cheese_fresh', 'cow_cheese_mature', 'cow_cheese_aged', 'syrecky_fresh', 'syrecky_mature'];
    // Obchod (kupecký krám) tyto položky nevykupuje — potraviny patří do krčmy a na trh
    const SHOP_EXCLUDED_ITEMS = ['goat_cheese_fresh', 'goat_cheese_mature', 'goat_cheese_aged',
      'sheep_cheese_fresh', 'sheep_cheese_mature', 'sheep_cheese_aged',
      'cow_cheese_fresh', 'cow_cheese_mature', 'cow_cheese_aged', 'syrecky_fresh', 'syrecky_mature'];
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
        const have = GameState.inventory[id] || 0;
        const price = this.calcPrice(id, entity);
        const item = ItemsDB[id];
        const icon = (item && item.icon) ? item.icon : '📦';
        const name = (typeof iName === 'function') ? iName(id) : (item ? item.name : id);
        // Saturační indikátor
        const satMult = this._saturationMult(id, entity);
        const satIcon = satMult >= 1.0 ? '' : satMult >= 0.80 ? ' 🔻' : satMult >= 0.60 ? ' 🔻🔻' : ' 🔻🔻🔻';
        const satColor = satMult >= 1.0 ? 'inherit' : satMult >= 0.80 ? '#e67e22' : '#c0392b';
        h += `
          <div style="padding:7px 10px; background:rgba(197,160,89,0.06);
                      border-radius:6px; border:1px solid rgba(197,160,89,0.2);
                      display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem; min-width:24px; text-align:center;">${icon}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:bold; font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
              <div style="font-size:0.7rem; opacity:0.65;">${lang === 'en' ? 'Have' : 'Máš'}: ${have} · <span style="color:${satColor};">${price} 💰${satIcon}</span></div>
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
  renderOldCellars: function () {
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
    const costStr1 = Object.entries(cost1).map(([k, v]) => `${v}× ${(typeof iName === 'function') ? iName(k) : k}`).join(', ');
    h += `<div style="padding:12px; margin-bottom:10px; background:rgba(255,255,255,0.4); border-radius:6px;">`;
    h += `<div style="font-weight:bold; margin-bottom:4px;">${lang === 'en' ? 'Phase 1 — Cleared Cellar' : 'Fáze 1 — Čistý sklep'}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang === 'en' ? 'Clears the rubble and shores up the old vault. Adds 500 units of storage capacity.' : 'Vyklidí suť a podepře staré klenutí. Přidá 500 jednotek skladové kapacity.'}</div>`;
    if (phase1Built) {
      h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang === 'en' ? 'Complete' : 'Dokončeno'}</div>`;
    } else {
      h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr1}</div>`;
      h += `<button class="craft-btn" onclick="Game.buildStorage('old_cellars')">🏗️ ${lang === 'en' ? 'Clear the cellar' : 'Vyklidit sklep'}</button>`;
    }
    h += `</div>`;

    // Fáze 2 — Domus Conversorum I (funkční)
    const phase2Built = storage.domus_conversorum_i && storage.domus_conversorum_i.built;
    const cost2 = { cut_stone: 40, plank: 25, rope: 10, hrebiky: 12 };
    const costStr2 = Object.entries(cost2).map(([k, v]) => `${v}× ${(typeof iName === 'function') ? iName(k) : k}`).join(', ') + ` + 25g`;
    h += `<div style="padding:12px; margin-bottom:10px; background:${phase1Built ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.02)'}; border-radius:6px; opacity:${phase1Built ? '1' : '0.4'};">`;
    h += `<div style="font-weight:bold; margin-bottom:4px;">${phase1Built ? '' : '🔒 '}${lang === 'en' ? 'Phase 2 — Domus Conversorum I' : 'Fáze 2 — Domus Conversorum I'}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang === 'en' ? 'Dormitory for lay brothers (2 slots).' : 'Dormitář pro konvrše (2 sloty).'}</div>`;
    if (phase2Built) {
      h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang === 'en' ? 'Complete' : 'Dokončeno'}</div>`;
    } else if (phase1Built) {
      h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr2}</div>`;
      h += `<button class="craft-btn" onclick="Game.buildStorage('domus_conversorum_i')">🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`;
    } else {
      h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Requires Phase 1 first.' : 'Nutná nejprve Fáze 1.'}</div>`;
    }
    h += `</div>`;
    // Fáze 3 — Domus Conversorum II (petice opatovi)
    const phase3Built = storage.domus_conversorum_ii && storage.domus_conversorum_ii.built;
    const petition = (GameState.abbotPetition && GameState.abbotPetition.domus_ii) || { status: 'none' };
    const cost3 = { cut_stone: 150, plank: 90, rope: 35, hrebiky: 35 };
    const costStr3 = Object.entries(cost3).map(([k, v]) => `${v}× ${(typeof iName === 'function') ? iName(k) : k}`).join(', ') + ` + 50g`;
    h += `<div style="padding:12px; background:${phase2Built ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.02)'}; border-radius:6px; opacity:${phase2Built ? '1' : '0.4'};">`;
    h += `<div style="font-weight:bold; margin-bottom:4px;">${phase2Built ? '' : '🔒 '}${lang === 'en' ? 'Phase 3 — Domus Conversorum II' : 'Fáze 3 — Domus Conversorum II'}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang === 'en' ? "Expanded dormitory (5 slots). Requires the Abbot's approval." : 'Rozšířený dormitář (5 slotů). Vyžaduje souhlas opata.'}</div>`;
    if (phase3Built) {
      h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang === 'en' ? 'Complete' : 'Dokončeno'}</div>`;
    } else if (!phase2Built) {
      h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Requires Phase 2 first.' : 'Nutná nejprve Fáze 2.'}</div>`;
    } else if (petition.status === 'pending') {
      const remH = Math.max(0, Math.ceil((petition.submittedAt + 86400000 - Date.now()) / 3600000));
      h += `<div style="font-size:0.8rem;">⏳ ${lang === 'en' ? 'Awaiting the Abbot\'s reply —' : 'Čeká na odpověď opata —'} <strong>${remH}h</strong></div>`;
    } else if (petition.status === 'approved') {
      h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr3}</div>`;
      h += `<button class="craft-btn" onclick="Game.buildStorage('domus_conversorum_ii')">🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`;
    } else {
      h += `<button class="craft-btn" onclick="Game.submitAbbotPetition('domus_ii'); CellariumSystem.switchEntity('old_cellars');">📜 ${t('abbotPetition.domus_ii.submit_btn')}</button>`;
    }
    h += `</div>`;

    // Fáze 4 — Domus Conversorum III (petice opatovi, eskalovaná)
    const phase4Built = storage.domus_conversorum_iii && storage.domus_conversorum_iii.built;
    const petition3 = (GameState.abbotPetition && GameState.abbotPetition.domus_iii) || { status: 'none' };
    const cost4 = { cut_stone: 330, plank: 200, rope: 75, iron_ingot: 4, hrebiky: 70 };
    const costStr4 = Object.entries(cost4).map(([k, v]) => `${v}× ${(typeof iName === 'function') ? iName(k) : k}`).join(', ') + ` + 110g`;
    h += `<div style="padding:12px; margin-top:10px; background:${phase3Built ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.02)'}; border-radius:6px; opacity:${phase3Built ? '1' : '0.4'};">`;
    h += `<div style="font-weight:bold; margin-bottom:4px;">${phase3Built ? '' : '🔒 '}${lang === 'en' ? 'Phase 4 — Domus Conversorum III' : 'Fáze 4 — Domus Conversorum III'}</div>`;
    h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang === 'en' ? "Great dormitory for lay brothers (20 slots). Requires the Abbot's approval." : 'Velký dormitář pro konvrše (20 slotů). Vyžaduje souhlas opata.'}</div>`;
    if (phase4Built) {
      h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang === 'en' ? 'Complete' : 'Dokončeno'}</div>`;
    } else if (!phase3Built) {
      h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Requires Phase 3 first.' : 'Nutná nejprve Fáze 3.'}</div>`;
    } else if (petition3.status === 'pending') {
      const remH = Math.max(0, Math.ceil((petition3.submittedAt + 86400000 - Date.now()) / 3600000));
      h += `<div style="font-size:0.8rem;">⏳ ${lang === 'en' ? 'Awaiting the Abbot\'s reply —' : 'Čeká na odpověď opata —'} <strong>${remH}h</strong></div>`;
    } else if (petition3.status === 'approved') {
      h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr4}</div>`;
      h += `<button class="craft-btn" onclick="Game.buildStorage('domus_conversorum_iii')">🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`;
    } else {
      h += `<button class="craft-btn" onclick="Game.submitAbbotPetition('domus_iii'); CellariumSystem.switchEntity('old_cellars');">📜 ${lang === 'en' ? 'Submit petition to the Abbot' : 'Zaslat žádost opatovi'}</button>`;
    }
    h += `</div>`;

    // ═══ UBYTOVNA — samostatný tier žebřík (I→IV: 1/3/6/9 lůžek) ═══
    // Sdílí prerekvizitu (Fáze 1 — Čistý sklep), ale jinak oddělené od
    // Domus Conversorum (hosté, ne trvalí konvrši). Vlastní petiční
    // systém — Game.submitUbytovnaPetition/buildUbytovnaTier, ne sdílený
    // abbotPetition (i18n hard rule, viz komentář u ubytovnaCapacity).
    h += `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; margin:18px 0 8px;">🥾 ${lang === 'en' ? 'Guesthouse — separate ladder' : 'Ubytovna — samostatný žebřík'}</div>`;

    const _ubyTiers = [
      { id: 'ubytovna_ii', label_cs: 'Ubytovna II', label_en: 'Guesthouse II', desc_cs: 'Přístavek s dalšími lůžky (3 celkem).', desc_en: 'An annex with more beds (3 total).' },
      { id: 'ubytovna_iii', label_cs: 'Ubytovna III', label_en: 'Guesthouse III', desc_cs: 'Rozšířené křídlo (6 lůžek celkem).', desc_en: 'An expanded wing (6 beds total).' },
      { id: 'ubytovna_iv', label_cs: 'Ubytovna IV', label_en: 'Guesthouse IV', desc_cs: 'Plný hostinec (9 lůžek celkem).', desc_en: 'A full guesthouse (9 beds total).' },
    ];
    const _ubyPrevBuilt = (i) => i === 0 ? phase1Built : (GameState.storage && GameState.storage[_ubyTiers[i - 1].id] && GameState.storage[_ubyTiers[i - 1].id].built);
    _ubyTiers.forEach((tierDef, i) => {
      const built = GameState.storage && GameState.storage[tierDef.id] && GameState.storage[tierDef.id].built;
      const prevOk = _ubyPrevBuilt(i);
      const pet = (GameState.ubytovnaPetition && GameState.ubytovnaPetition[tierDef.id]) || { status: 'none' };
      const cfg = (typeof Game !== 'undefined') ? Game.UBYTOVNA_TIER_COSTS[tierDef.id] : null;
      const costStr = cfg ? Object.entries(cfg.items).map(([k, v]) => `${v}× ${(typeof iName === 'function') ? iName(k) : k}`).join(', ') + ` + ${cfg.grose}g` : '';
      h += `<div style="padding:12px; margin-bottom:8px; background:${prevOk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.02)'}; border-radius:6px; opacity:${prevOk ? '1' : '0.4'};">`;
      h += `<div style="font-weight:bold; margin-bottom:4px;">${prevOk ? '' : '🔒 '}${lang === 'en' ? tierDef.label_en : tierDef.label_cs}</div>`;
      h += `<div style="font-size:0.8rem; opacity:0.75; margin-bottom:8px;">${lang === 'en' ? tierDef.desc_en : tierDef.desc_cs}</div>`;
      if (built) {
        h += `<div style="color:#5a9; font-size:0.85rem;">✅ ${lang === 'en' ? 'Complete' : 'Dokončeno'}</div>`;
      } else if (!prevOk) {
        h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Requires the previous tier first.' : 'Nutná nejprve předchozí úroveň.'}</div>`;
      } else if (pet.status === 'pending') {
        const remH = Math.max(0, Math.ceil((pet.submittedAt + 86400000 - Date.now()) / 3600000));
        h += `<div style="font-size:0.8rem;">⏳ ${lang === 'en' ? 'Awaiting the Abbot\'s reply —' : 'Čeká na odpověď opata —'} <strong>${remH}h</strong></div>`;
      } else if (pet.status === 'approved') {
        h += `<div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">${costStr}</div>`;
        h += `<button class="craft-btn" onclick="Game.buildUbytovnaTier('${tierDef.id}')">🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`;
      } else {
        h += `<button class="craft-btn" onclick="Game.submitUbytovnaPetition('${tierDef.id}'); CellariumSystem.switchEntity('old_cellars');">📜 ${lang === 'en' ? 'Submit petition to the Abbot' : 'Zaslat žádost opatovi'}</button>`;
      }
      h += `</div>`;
    });

    h += `</div>`;
    return h;
  },

  // Pozemky — plná stránka na úrovni Cechy/Inventarium (pozemky-mrd.md
  // §6.1, 16.8.2026). Fáze 1: jen mlynsky_nahon. Tři stavy per parcela:
  // available (koupit), pending (čeká na Zemské desky, 24h), owned
  // (koupena — stavba Mlýna samotná je samostatnej, budoucí krok).
  // ── Kovárna — vlastní pec (kovarna-dilna-mrd.md v0.6, 30.8.2026) ────────
  // Mirror FireplaceSystem (fireplace.js) principu, ale vlastní, nezávislý
  // stav — Kovárna NENÍ domácí Foculus, dvě oddělený ohniště. Jakmile
  // Kovárna stojí, VŠECHNO kovářský kování (starejch 33 receptů + nový 3
  // podkovářský) potřebuje hořící pec — gate žije v InventoryManager.craft().
  KOVARNA_FUEL_VALUES: {
    stick: 1 * 60 * 60 * 1000,
    wood: 2 * 60 * 60 * 1000,
    log: 4 * 60 * 60 * 1000,
    charcoal: 16 * 60 * 60 * 1000, // mnohem delší hoření než v domácím Foculusu (8h)
  },
  KOVARNA_MAX_FUEL_MS: 24 * 60 * 60 * 1000,

  _ensureKovarnaFurnace: function () {
    if (!GameState.storage) GameState.storage = {};
    if (!GameState.storage.kovarna) GameState.storage.kovarna = { built: false, tier: 0 };
    if (!GameState.storage.kovarna.furnace) {
      GameState.storage.kovarna.furnace = { fuelMs: 0, lastFuelType: null, lastUpdate: Date.now(), craftCount: 0 };
    }
  },

  kovarnaAddFuel: function (itemId) {
    this._ensureKovarnaFurnace();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!(GameState.storage.kovarna && GameState.storage.kovarna.built)) return;
    const fuelAmount = this.KOVARNA_FUEL_VALUES[itemId];
    if (!fuelAmount) return;
    if ((GameState.inventory[itemId] || 0) < 1) {
      const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
      UI.notify((lang === 'en' ? 'Not enough: ' : 'Nedostatek: ') + itemName, true);
      return;
    }
    const f = GameState.storage.kovarna.furnace;
    if (f.fuelMs + fuelAmount > this.KOVARNA_MAX_FUEL_MS) {
      UI.notify(lang === 'en' ? 'The furnace is full.' : 'Pec je plná.', true);
      return;
    }
    InventoryManager.removeItem(itemId, 1);
    f.fuelMs += fuelAmount;
    f.lastFuelType = itemId;
    Game.save();
    const el = document.getElementById('home-kovarna-content');
    if (el) el.innerHTML = this.renderKovarnaTab();
    UI.notify(lang === 'en' ? '🔥 Fuel added.' : '🔥 Palivo přiloženo.');
  },

  // Volané z hlavního game loopu (core/game.js setInterval), mirror
  // FireplaceSystem.tick() — počítá i reálný čas offline.
  kovarnaFurnaceTick: function () {
    if (!(GameState.storage && GameState.storage.kovarna && GameState.storage.kovarna.built)) return;
    this._ensureKovarnaFurnace();
    const f = GameState.storage.kovarna.furnace;
    if (f.fuelMs <= 0) return;
    const now = Date.now();
    const delta = now - (f.lastUpdate || now);
    f.lastUpdate = now;
    f.fuelMs = Math.max(0, f.fuelMs - delta);
    if (f.fuelMs <= 0) f.lastFuelType = null;
  },

  // Furnus (Pekárna) — obsah sub-tabu (dilny-pozemky-mrd.md v0.3, 25.8.2026).
  // Mirror LimeSystem.render() stylově, ale jednodušší — jeden recept
  // (bread_fine), žádné vícefázové zrání. §8 MRD — trvalá cechovní
  // připomínka musí být VIDĚT tady, ne schovaná jinde.
  //
  // Vlastní pec (pekarna-audit v2, 30.8.2026) — mirror Kovárna furnace
  // principu 1:1, jen jiná ilustrace (kulatá klenutá pec, ne kovářská
  // výheň) a standardní palivový hodnoty (žádná "delší hoření" výjimka —
  // ta byla specifická pro kovářskou výheň).
  FURNUS_FUEL_VALUES: {
    stick: 1 * 60 * 60 * 1000,
    wood: 2 * 60 * 60 * 1000,
    log: 4 * 60 * 60 * 1000,
    charcoal: 8 * 60 * 60 * 1000,
  },
  FURNUS_MAX_FUEL_MS: 24 * 60 * 60 * 1000,

  _ensureFurnusFurnace: function () {
    if (!GameState.storage) GameState.storage = {};
    if (!GameState.storage.furnus) GameState.storage.furnus = { built: false };
    if (!GameState.storage.furnus.furnace) {
      GameState.storage.furnus.furnace = { fuelMs: 0, lastFuelType: null, lastUpdate: Date.now() };
    }
  },

  furnusAddFuel: function (itemId) {
    this._ensureFurnusFurnace();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!(GameState.storage.furnus && GameState.storage.furnus.built)) return;
    const fuelAmount = this.FURNUS_FUEL_VALUES[itemId];
    if (!fuelAmount) return;
    if ((GameState.inventory[itemId] || 0) < 1) {
      const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
      UI.notify((lang === 'en' ? 'Not enough: ' : 'Nedostatek: ') + itemName, true);
      return;
    }
    const f = GameState.storage.furnus.furnace;
    if (f.fuelMs + fuelAmount > this.FURNUS_MAX_FUEL_MS) {
      UI.notify(lang === 'en' ? 'The oven is full.' : 'Pec je plná.', true);
      return;
    }
    InventoryManager.removeItem(itemId, 1);
    f.fuelMs += fuelAmount;
    f.lastFuelType = itemId;
    Game.save();
    const el = document.getElementById('home-furnus-content');
    if (el) el.innerHTML = this.renderFurnusTab();
    UI.notify(lang === 'en' ? '🔥 Fuel added.' : '🔥 Palivo přiloženo.');
  },

  // Volané z hlavního game loopu (core/game.js setInterval), mirror
  // kovarnaFurnaceTick() přesně.
  furnusFurnaceTick: function () {
    if (!(GameState.storage && GameState.storage.furnus && GameState.storage.furnus.built)) return;
    this._ensureFurnusFurnace();
    const f = GameState.storage.furnus.furnace;
    if (f.fuelMs <= 0) return;
    const now = Date.now();
    const delta = now - (f.lastUpdate || now);
    f.lastUpdate = now;
    f.fuelMs = Math.max(0, f.fuelMs - delta);
    if (f.fuelMs <= 0) f.lastFuelType = null;
  },

  _furnusOvenSvg: function (active) {
    const glow = active ? `
      <ellipse cx="70" cy="80" rx="18" ry="8" fill="#ff8c3a" opacity="0.6">
        <animate attributeName="opacity" values="0.45;0.8;0.45" dur="1.8s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="70" cy="78" rx="9" ry="4.5" fill="#ffd27a" opacity="0.75">
        <animate attributeName="opacity" values="0.55;0.95;0.55" dur="1.2s" repeatCount="indefinite"/>
      </ellipse>` : '';
    return `<svg viewBox="0 0 140 130" width="100%" height="120" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
      <ellipse cx="70" cy="122" rx="52" ry="6" fill="rgba(8,6,3,0.4)"/>
      <path d="M 20 106 Q 20 30 70 25 Q 120 30 120 106 Z" fill="#c9a877" stroke="#7a5c3a" stroke-width="2"/>
      <path d="M 20 106 Q 20 30 70 25 Q 120 30 120 106 Z" fill="none" stroke="#a8875f" stroke-width="1" opacity="0.45"/>
      <path d="M 52 106 L 52 80 Q 52 68 70 68 Q 88 68 88 80 L 88 106 Z" fill="#1a1310"/>
      ${glow}
      <rect x="15" y="101" width="110" height="10" rx="2" fill="#8a6f4e" stroke="#5c4530" stroke-width="1"/>
    </svg>`;
  },

  renderFurnusTab: function () {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    let h = `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">
      <h4 style="margin:0 0 8px 0; color:var(--ink-primary);">🍞 ${lang === 'en' ? 'Furnus — Bakery Oven' : 'Furnus — Pekařská pec'}</h4>
      <div style="font-size:0.82rem; opacity:0.75; font-style:italic;">
        ${lang === 'en'
        ? "The clay vault holds heat evenly through the whole batch — flour and water go in, fine bread comes out."
        : 'Hliněná klenba drží žár rovnoměrně po celou várku — dovnitř jde mouka a voda, ven jde bílý chléb.'}
      </div>
    </div>`;

    if (!(GameState.storage && GameState.storage.furnus && GameState.storage.furnus.built)) {
      h += `<div style="opacity:0.6; font-style:italic; font-size:0.82rem;">${lang === 'en' ? 'Furnus not yet built.' : 'Furnus ještě není postaven.'}</div>`;
      return h;
    }

    this._ensureFurnusFurnace();
    const furnace = GameState.storage.furnus.furnace;
    const fPct = Math.max(0, Math.min(100, Math.round((furnace.fuelMs / this.FURNUS_MAX_FUEL_MS) * 100)));
    const fActive = furnace.fuelMs > 0;
    const fHoursLeft = Math.floor(furnace.fuelMs / 3600000);
    const fFuelTypeName = furnace.lastFuelType ? ((typeof iName === 'function') ? iName(furnace.lastFuelType) : furnace.lastFuelType) : null;

    h += `<div style="background:rgba(0,0,0,0.03); padding:14px; border-radius:8px; margin-bottom:12px;">
      <div style="text-align:center; margin-bottom:8px;">${this._furnusOvenSvg(fActive)}</div>
      <div style="display:flex; justify-content:space-between; font-size:0.75rem; opacity:0.7; margin-bottom:3px;">
        <span>${fActive ? (lang === 'en' ? 'Oven hot' : 'Pec vyhřátá') + (fFuelTypeName ? ' (' + fFuelTypeName + ')' : '') : (lang === 'en' ? 'Oven cold — light it before baking' : 'Pec studená — než můžeš péct, musíš zatopit')}</span>
        <span>${fActive ? fHoursLeft + 'h' : ''}</span>
      </div>
      <div style="height:8px; background:rgba(0,0,0,0.2); border-radius:4px; overflow:hidden; margin-bottom:10px; border:1px solid rgba(197,160,89,0.3);">
        <div style="height:100%; width:${fPct}%; background:#ffbd40; transition:width 0.5s;"></div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${['stick', 'wood', 'log', 'charcoal'].map(fid => {
      const have = GameState.inventory[fid] || 0;
      const fname = (typeof iName === 'function') ? iName(fid) : fid;
      const hrs = this.FURNUS_FUEL_VALUES[fid] / 3600000;
      return `<button class="filter-btn" style="flex:1; min-width:80px;" ${have < 1 ? 'disabled' : ''} onclick="CellariumSystem.furnusAddFuel('${fid}')" title="+${hrs}h">+ ${fname} (${have})</button>`;
    }).join('')}
      </div>
    </div>`;

    // §8 — trvalá, viditelná připomínka cechovního rizika
    const guildId = 'pekarsky';
    const g = (typeof GuildsDB !== 'undefined') ? GuildsDB[guildId] : null;
    const gName = g ? (lang === 'en' ? g.name_en : g.name) : 'Pekařský cech';
    const matterKey = 'pekarsky:chleba';
    const pravoStatus = (GameState.guildPravo && GameState.guildPravo[matterKey] && GameState.guildPravo[matterKey].status) || 'none';
    if (pravoStatus === 'granted') {
      h += `<div style="background:rgba(76,175,80,0.1); border:1px solid #4CAF50; padding:10px 14px; border-radius:6px; margin-bottom:12px; font-size:0.78rem;">
        ✅ ${lang === 'en'
          ? `Legal sale right with ${gName} — 10% fee applies, no risk.`
          : `Máš právo prodeje od cechu ${gName} — platí se 10 % poplatek, bez rizika.`}
      </div>`;
    } else {
      h += `<div style="background:rgba(197,90,60,0.1); border:1px solid #b05a3c; padding:10px 14px; border-radius:6px; margin-bottom:12px; font-size:0.78rem;">
        ⚠️ ${lang === 'en'
          ? `Selling bread on the Market without ${gName}'s leave is fušerství — no fee, but suspicion grows and a raid may follow. Negotiate in Cellarium — Guilds.`
          : `Prodej chleba na Trhu bez svolení cechu ${gName} je fušerství — bez poplatku, ale podezření roste a časem hrozí nájezd. Vyjednej si to v Cellariu — Cechy.`}
      </div>`;
    }

    // Craft/cook list — pekarna-audit (30.8.2026), mirror Kovárna craft listu.
    // Moukový recepty (bread_fine/bread_fine_1/berry_pie_fine/berry_pie_fine_1)
    // jsou COOK_TYPES (přesměrujou na CookingSystem.startCooking, timed
    // proces s needsBuild:'furnus' gate) — hostia je cat:"craft" (instant
    // Game.craft). Rozlišeno automaticky podle přítomnosti v COOK_TYPES.
    const FURNUS_RECIPE_IDS = ['bread', 'bread_fine', 'bread_fine_1', 'berry_pie', 'berry_pie_koreni', 'berry_pie_fine', 'berry_pie_fine_1', 'pernik', 'preclik', 'postni_chleb', 'hostia'];
    h += `<div style="display:grid; grid-template-columns:1fr; gap:6px;">`;
    FURNUS_RECIPE_IDS.forEach(id => {
      const r = (typeof RecipesDB !== 'undefined') ? RecipesDB.find(x => x.id === id) : null;
      if (!r) return;
      if (r.locked && !(GameState.unlockedRecipes && GameState.unlockedRecipes.includes(id))) return;
      const prod = ItemsDB[r.output];
      if (!prod) return;
      const isCooked = (typeof CookingSystem !== 'undefined' && CookingSystem.COOK_TYPES && CookingSystem.COOK_TYPES[id]);
      let can = true;
      let reqStr = '';
      if (isCooked) {
        const def = CookingSystem.COOK_TYPES[id];
        const has = GameState.inventory[def.input] || 0;
        const missing = has < def.inputQty;
        if (missing) can = false;
        const iN = (typeof iName === 'function') ? iName(def.input) : def.input;
        reqStr += `<span style="${missing ? 'color:#b05a3c;' : ''}">${iN} ${has}/${def.inputQty}</span> `;
        if (def.extraInputs) {
          Object.entries(def.extraInputs).forEach(([eid, eqty]) => {
            const ehas = GameState.inventory[eid] || 0;
            const emissing = ehas < eqty;
            if (emissing) can = false;
            const eN = (typeof iName === 'function') ? iName(eid) : eid;
            reqStr += `<span style="${emissing ? 'color:#b05a3c;' : ''}">${eN} ${ehas}/${eqty}</span> `;
          });
        }
        if (def.needsTool) {
          def.needsTool.forEach(tid => {
            const hasT = (GameState.inventory[tid] || 0) > 0;
            if (!hasT) can = false;
            const tN = (typeof iName === 'function') ? iName(tid) : tid;
            reqStr += `<span style="${hasT ? '' : 'color:#b05a3c;'}">+ 🔧 ${tN}</span>`;
          });
        }
      } else {
        Object.entries(r.req || {}).forEach(([iid, amt]) => {
          const has = GameState.inventory[iid] || 0;
          const missing = (amt > 0 && has < amt) || (amt === 0 && !has);
          if (missing) can = false;
          const iN = (typeof iName === 'function') ? iName(iid) : iid;
          reqStr += `<span style="${missing ? 'color:#b05a3c;' : ''}">${iN}${amt > 0 ? ' ' + has + '/' + amt : ''}</span> `;
        });
      }
      const onclickCall = isCooked ? `CookingSystem.startCooking('${id}')` : `Game.craft('${id}')`;
      const label = lang === 'en' ? 'Bake' : 'Péct';
      h += `<div style="display:flex; align-items:center; gap:10px; padding:8px 10px; background:rgba(0,0,0,0.03); border-radius:6px;">
        <div style="font-size:1.3rem;">${prod.icon}</div>
        <div style="flex:1; font-size:0.8rem;"><strong>${lang === 'en' ? (prod.name_en || prod.name) : prod.name}</strong><div style="font-size:0.68rem; opacity:0.75;">${reqStr}</div></div>
        <button class="craft-btn" onclick="${onclickCall}" ${can ? '' : 'disabled'}>${label}</button>
      </div>`;
    });
    h += `</div>`;
    return h;
  },

  // ── Kovárna — tab obsah (kovarna-dilna-mrd.md v0.6, 30.8.2026) ──────────
  KOVARNA_TIERS: [
    { name: 'Oprava podkov', name_en: 'Horseshoe Repair', cost: 0, req: null },
    { name: 'Kování nových podkov', name_en: 'Forging New Horseshoes', cost: 40, req: { materials: { iron_ingot: 4, plank: 5, hrebiky: 6 } } },
    { name: 'Prémiové podkovy', name_en: 'Premium Horseshoes', cost: 90, req: { materials: { iron_ingot: 8, plank: 8, hrebiky: 10, wild_leather: 3 } } },
  ],

  _kovarnaMeetsRequirements: function (req) {
    if (!req) return true;
    if (req.materials) {
      for (const matId in req.materials) {
        if ((GameState.inventory[matId] || 0) < req.materials[matId]) return false;
      }
    }
    return true;
  },

  upgradeKovarna: function () {
    if (!GameState.storage || !GameState.storage.kovarna) return;
    const kov = GameState.storage.kovarna;
    const tier = kov.tier || 0;
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (tier >= this.KOVARNA_TIERS.length) return;
    const next = this.KOVARNA_TIERS[tier];
    if (!next) return;
    if (!this._kovarnaMeetsRequirements(next.req)) { UI.notify('⚠️ ' + (lang === 'en' ? 'Requirements not met.' : 'Podmínky nesplněny.'), true); return; }
    if (this.getGrose() < next.cost) { UI.notify('⚠️ ' + (lang === 'en' ? 'Not enough groschen.' : 'Nedostatek grošů.'), true); return; }
    this.addGrose(-next.cost);
    const mats = (next.req && next.req.materials) || {};
    for (const matId in mats) InventoryManager.removeItem(matId, mats[matId]);
    kov.tier = tier + 1;
    Game.save();
    const name = lang === 'en' ? next.name_en : next.name;
    UI.notifyPanel('🔨 ' + (lang === 'en' ? 'The smithy advances: ' : 'Kovárna postoupila: ') + name + '.', 'success');
    Game.addKronikaEntry('important',
      '🔨 Kovárna povýšena na stupeň ' + (tier + 1) + ' — ' + name + '.',
      '🔨 The Kovárna advanced to Tier ' + (tier + 1) + ' — ' + name + '.',
      '🔨 Officina fabrilis aucta est.');
    const el = document.getElementById('home-kovarna-content');
    if (el) el.innerHTML = this.renderKovarnaTab();
  },

  _kovarnaFurnaceSvg: function (active) {
    const glow = active ? `
      <ellipse cx="70" cy="88" rx="22" ry="10" fill="#ff8c3a" opacity="0.55">
        <animate attributeName="opacity" values="0.4;0.75;0.4" dur="1.6s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="70" cy="86" rx="12" ry="6" fill="#ffd27a" opacity="0.7">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.1s" repeatCount="indefinite"/>
      </ellipse>` : '';
    return `<svg viewBox="0 0 140 130" width="100%" height="120" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
      <ellipse cx="70" cy="122" rx="55" ry="6" fill="rgba(8,6,3,0.4)"/>
      <rect x="20" y="30" width="100" height="80" rx="4" fill="#4a4038" stroke="#0a0806" stroke-width="1.5"/>
      <path d="M 45 110 L 45 70 Q 45 55 70 55 Q 95 55 95 70 L 95 110 Z" fill="#161310"/>
      ${glow}
      <rect x="55" y="95" width="30" height="8" rx="2" fill="#2e2822" stroke="#0a0806" stroke-width="1"/>
      <rect x="50" y="103" width="40" height="6" rx="1" fill="#1a1712"/>
    </svg>`;
  },

  _renderKovarnaTierPanel: function (tier, lang) {
    const cur = this.KOVARNA_TIERS[tier - 1];
    const next = this.KOVARNA_TIERS[tier];
    const curName = cur ? (lang === 'en' ? cur.name_en : cur.name) : '?';
    let h = `<div style="padding:12px 15px; margin-bottom:12px; background:rgba(197,160,89,0.05); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
      <div style="font-weight:bold; font-size:0.9rem; margin-bottom:8px;">🔨 ${lang === 'en' ? 'Tier' : 'Stupeň'} ${tier} — ${curName}</div>`;
    if (next) {
      const nextName = lang === 'en' ? next.name_en : next.name;
      const req = next.req || {};
      const rows = [];
      if (req.materials) {
        Object.keys(req.materials).forEach(matId => {
          const need = req.materials[matId];
          const have = GameState.inventory[matId] || 0;
          const matName = (typeof iName === 'function') ? iName(matId) : matId;
          rows.push([have >= need, matName + ' ' + have + '/' + need]);
        });
      }
      const met = rows.every(r => r[0]);
      h += rows.map(r => `<div style="font-size:0.68rem; ${r[0] ? 'opacity:0.7;' : 'color:#c0392b;'}">${r[0] ? '✓' : '✗'} ${r[1]}</div>`).join('');
      h += `<button class="craft-btn" style="margin-top:8px; width:100%;" ${met && this.getGrose() >= next.cost ? '' : 'disabled'} onclick="CellariumSystem.upgradeKovarna()">⬆️ ${lang === 'en' ? 'Raise to' : 'Povýšit na'} ${nextName} (${next.cost}g)</button>`;
    } else {
      h += `<div style="font-size:0.75rem; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Highest tier reached.' : 'Nejvyšší úroveň dosažena.'}</div>`;
    }
    h += `</div>`;
    return h;
  },

  _renderKovarnaGuildReminder: function (lang) {
    const guildId = 'kovarsky';
    const g = (typeof GuildsDB !== 'undefined') ? GuildsDB[guildId] : null;
    const gName = g ? (lang === 'en' ? g.name_en : g.name) : 'Kovářský cech';
    const matterKey = 'kovarsky:hamr';
    const pravoStatus = (GameState.guildPravo && GameState.guildPravo[matterKey] && GameState.guildPravo[matterKey].status) || 'none';
    if (pravoStatus === 'granted') {
      return `<div style="background:rgba(76,175,80,0.1); border:1px solid #4CAF50; padding:10px 14px; border-radius:6px; margin-bottom:12px; font-size:0.78rem;">
        ✅ ${lang === 'en' ? `Legal sale right with ${gName} — 10% fee applies, no risk.` : `Máš právo prodeje od cechu ${gName} — platí se 10 % poplatek, bez rizika.`}
      </div>`;
    }
    return `<div style="background:rgba(197,90,60,0.1); border:1px solid #b05a3c; padding:10px 14px; border-radius:6px; margin-bottom:12px; font-size:0.78rem;">
      ⚠️ ${lang === 'en' ? `Selling smithy goods on the Market without ${gName}'s leave is fušerství — no fee, but suspicion grows and a raid may follow. Negotiate in Cellarium — Guilds.` : `Prodej kovářského zboží na Trhu bez svolení cechu ${gName} je fušerství — bez poplatku, ale podezření roste a časem hrozí nájezd. Vyjednej si to v Cellariu — Cechy.`}
    </div>`;
  },

  // vyroba-stavby-mrd navazuje (6.9.2026) — žoldnéřská ochrana, Fáze B.
  // Shape (name/icon/role/hp/atk/ability) odpovídá archetypům z dodanýho
  // boj-kódu (Strážce stezky/Lovec stop/Lesní vědma) — až Fáze C přeportuje
  // samotný boj, čte přímo odsud, žádnej remap netřeba.
  MERCENARY_ARCHETYPES: [
    {
      id: 'strazce', icon: '🛡️',
      name: 'Strážce stezky', name_en: 'Trail Guardian',
      role: 'Ocel a odhodlání', role_en: 'Steel and resolve',
      desc: 'Vysoké zdraví a jistý úder. Umí podržet linii, když se stezka sevře.',
      desc_en: 'High health and a steady blow. Holds the line when the trail closes in.',
      hp: 125, atk: 16, ability: 'Opevnění: obnoví 12 HP.', ability_en: 'Fortify: restores 12 HP.',
    },
    {
      id: 'lovec', icon: '🏹',
      name: 'Lovec stop', name_en: 'Trail Hunter',
      role: 'Tichý a přesný', role_en: 'Silent and precise',
      desc: 'Rychlý střelec s vyšší šancí na kritický zásah.',
      desc_en: 'A swift archer with a higher chance to land a critical hit.',
      hp: 95, atk: 19, ability: 'Přesný výstřel: +15 % kritické šance.', ability_en: 'Aimed shot: +15% critical chance.',
    },
    {
      id: 'vedma', icon: '🌿',
      name: 'Lesní vědma', name_en: 'Forest Seer',
      role: 'Čte znamení', role_en: 'Reads the signs',
      desc: 'Křehká, ale dokáže zvrátit souboj léčivým rituálem.',
      desc_en: 'Frail, but can turn the tide with a healing ritual.',
      hp: 85, atk: 14, ability: 'Rituál mízy: obnoví 24 HP.', ability_en: 'Sap ritual: restores 24 HP.',
    },
  ],

  hireMercenary: function (archId) {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (!(GameState.abbotPetition && GameState.abbotPetition.mercenaries && GameState.abbotPetition.mercenaries.status === 'approved')) {
      UI.notify(lang === 'en' ? 'Requires Abbot approval first.' : 'Nejprve vyžaduje souhlas opata.', true); return;
    }
    if (GameState.mercenary) {
      UI.notify(lang === 'en' ? 'You already have a mercenary.' : 'Žoldnéře už máš.', true); return;
    }
    const arch = this.MERCENARY_ARCHETYPES.find(a => a.id === archId);
    if (!arch) return;
    if (this.getGrose() < 50) {
      UI.notify(lang === 'en' ? 'Not enough groats (50).' : 'Nedostatek grošů (50).', true); return;
    }
    this.addGrose(-50, { title: lang === 'en' ? 'Mercenary hire' : 'Najmutí žoldnéře', source: arch.name, source_en: arch.name_en });
    GameState.mercenary = {
      id: arch.id, icon: arch.icon,
      name: arch.name, name_en: arch.name_en,
      role: arch.role, role_en: arch.role_en,
      hp: arch.hp, max: arch.hp, atk: arch.atk,
      ability: arch.ability, ability_en: arch.ability_en,
      // vyroba-stavby-mrd — iniciální zbraň, další postup (sekera/meč/luk) budoucí rozvoj.
      equipment: { weapon: null },
      hiredAt: Date.now(),
    };
    UI.notifyPanel('🛡️ ' + (lang === 'en' ? (arch.name_en + ' has joined as your mercenary.') : (arch.name + ' se přidal jako tvůj žoldnéř.')), 'success');
    Game.addKronikaEntry('important',
      'Najat žoldnéř: ' + arch.name + '.', 'Mercenary hired: ' + arch.name_en + '.', 'Mercenarius conductus est.'
    );
    Game.save();
    if (typeof PersonaSystem !== 'undefined') PersonaSystem.rerenderIfOpen();
    this.switchEntity('tavern');
  },

  _renderMercenariesSub: function (lang) {
    if (!GameState.abbotPetition) GameState.abbotPetition = {};
    const pet = GameState.abbotPetition.mercenaries;
    let h = `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">
      <h4 style="margin:0 0 8px 0; color:var(--ink-primary);">🛡️ ${lang === 'en' ? 'Mercenary Protection' : 'Žoldnéřská ochrana'}</h4>
      <div style="font-size:0.82rem; opacity:0.75; font-style:italic;">
        ${lang === 'en'
        ? 'The roads beyond the walls are not always safe. A hired blade travels where the brothers cannot.'
        : 'Cesty za zdmi nejsou vždy bezpečné. Najatá čepel jde tam, kam se bratři neodváží.'}
      </div>
    </div>`;

    if (!pet || pet.status === 'none' || pet.status === 'denied') {
      h += `<div style="opacity:0.7; font-size:0.85rem; margin-bottom:10px;">${t('abbotPetition.mercenaries.locked_hint')}</div>`;
      h += `<button class="craft-btn" onclick="Game.submitAbbotPetition('mercenaries')">📜 ${t('abbotPetition.mercenaries.submit_btn')}</button>`;
      return h;
    }
    if (pet.status === 'pending') {
      const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
      const sd = pet.submittedAt ? _toGameDate(pet.submittedAt).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB') : '?';
      const rd = pet.submittedAt ? _toGameDate(pet.submittedAt + 86400000).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB') : '?';
      h += `<div style="opacity:0.75; font-size:0.85rem; font-style:italic;">⏳ ${t('abbotPetition.mercenaries.pending').replace('{date}', sd).replace('{responseDate}', rd)}</div>`;
      return h;
    }

    // approved
    if (GameState.mercenary) {
      const m = GameState.mercenary;
      h += `<div style="padding:12px; background:rgba(90,154,90,0.08); border:1px solid rgba(90,154,90,0.4); border-radius:8px; font-size:0.85rem;">
        ✅ ${lang === 'en' ? `You have already hired ${m.name_en}.` : `Už máš najatého žoldnéře: ${m.name}.`} ${lang === 'en' ? 'See him in Persona — Retinue.' : 'Najdeš ho v Persona — Družina.'}
      </div>`;
      return h;
    }

    h += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;">`;
    this.MERCENARY_ARCHETYPES.forEach(a => {
      h += `<div style="padding:14px; background:rgba(0,0,0,0.03); border:1px solid rgba(197,160,89,0.3); border-radius:8px;">
        <div style="font-size:1.8rem; text-align:center;">${a.icon}</div>
        <div style="font-weight:bold; text-align:center; margin-top:4px;">${lang === 'en' ? a.name_en : a.name}</div>
        <div style="font-size:0.72rem; opacity:0.6; text-align:center; font-style:italic;">${lang === 'en' ? a.role_en : a.role}</div>
        <div style="font-size:0.75rem; opacity:0.8; margin:8px 0;">${lang === 'en' ? a.desc_en : a.desc}</div>
        <div style="font-size:0.75rem; display:flex; justify-content:space-between; opacity:0.8; margin-bottom:6px;">
          <span>❤️ ${a.hp}</span><span>⚔️ ${a.atk}</span>
        </div>
        <div style="font-size:0.72rem; opacity:0.65; margin-bottom:10px;">✦ ${lang === 'en' ? a.ability_en : a.ability}</div>
        <button class="craft-btn" style="width:100%;" onclick="CellariumSystem.hireMercenary('${a.id}')">${lang === 'en' ? 'Hire (50g)' : 'Najmout (50g)'}</button>
      </div>`;
    });
    h += `</div>`;
    return h;
  },

  _renderKovarnaCraftList: function (lang) {
    if (typeof RecipesDB === 'undefined') return '';
    const recipes = RecipesDB.filter(r => r.cat === 'iron' && (!r.locked || (GameState.unlockedRecipes && GameState.unlockedRecipes.includes(r.id))));
    if (!recipes.length) return '';
    let h = `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85; margin:10px 0 8px;">⚒️ ${lang === 'en' ? 'Smithing' : 'Kovářství'}</div>`;
    h += `<div style="display:grid; grid-template-columns:1fr; gap:6px;">`;
    recipes.forEach(r => {
      const prod = ItemsDB[r.output];
      if (!prod) return;
      let can = true;
      let reqStr = '';
      Object.entries(r.req || {}).forEach(([id, amt]) => {
        const has = GameState.inventory[id] || 0;
        const missing = (amt > 0 && has < amt) || (amt === 0 && !has);
        if (missing) can = false;
        const iN = (typeof iName === 'function') ? iName(id) : id;
        reqStr += `<span style="${missing ? 'color:#b05a3c;' : ''}">${iN}${amt > 0 ? ' ' + has + '/' + amt : ''}</span> `;
      });
      if (r.toolReq) {
        const hasTool = r.toolReq.some(tr => (GameState.inventory[tr.item] || 0) > 0 || (GameState.inventory['worn_' + tr.item] || 0) > 0);
        if (!hasTool) can = false;
        const toolNames = r.toolReq.map(tr => (typeof iName === 'function') ? iName(tr.item) : tr.item).join('/');
        reqStr += `<span style="${hasTool ? '' : 'color:#b05a3c;'}">+ 🔧 ${toolNames}</span>`;
      }
      if (prod.maxStack && !r.id.startsWith('repair_')) {
        const have = GameState.inventory[r.output] || 0;
        const worn = GameState.inventory['worn_' + r.output] || 0;
        if (have + worn >= prod.maxStack) can = false;
      }
      const label = r.id.startsWith('repair_') ? (lang === 'en' ? 'Repair' : 'Opravit') : (lang === 'en' ? 'Forge' : 'Kovat');
      h += `<div style="display:flex; align-items:center; gap:10px; padding:8px 10px; background:rgba(0,0,0,0.03); border-radius:6px;">
        <div style="font-size:1.3rem;">${prod.icon}</div>
        <div style="flex:1; font-size:0.8rem;"><strong>${lang === 'en' ? (prod.name_en || prod.name) : prod.name}</strong><div style="font-size:0.68rem; opacity:0.75;">${reqStr}</div></div>
        <button class="craft-btn" onclick="Game.craft('${r.id}')" ${can ? '' : 'disabled'}>${label}</button>
      </div>`;
    });
    h += `</div>`;
    return h;
  },

  renderKovarnaTab: function () {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    let h = `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">
      <h4 style="margin:0 0 8px 0; color:var(--ink-primary);">🔨 ${lang === 'en' ? 'Kovárna — the Smithy' : 'Kovárna'}</h4>
      <div style="font-size:0.82rem; opacity:0.75; font-style:italic;">
        ${lang === 'en'
        ? "The smith's work has outgrown its old corner — anvil, forge and tools have all moved here, into a proper workshop of their own."
        : 'Kovářská práce přerostla svůj starý kout — kovadlina, výheň i nářadí se přestěhovaly sem, do vlastní pořádné dílny.'}
      </div>
    </div>`;

    if (!(GameState.storage && GameState.storage.kovarna && GameState.storage.kovarna.built)) {
      h += `<div style="opacity:0.6; font-style:italic; font-size:0.82rem;">${lang === 'en' ? 'Kovárna not yet built.' : 'Kovárna ještě není postavena.'}</div>`;
      return h;
    }

    this._ensureKovarnaFurnace();
    const kov = GameState.storage.kovarna;
    const furnace = kov.furnace;
    const tier = kov.tier || 0;

    const pct = Math.max(0, Math.min(100, Math.round((furnace.fuelMs / this.KOVARNA_MAX_FUEL_MS) * 100)));
    const active = furnace.fuelMs > 0;
    const hoursLeft = Math.floor(furnace.fuelMs / 3600000);
    const fuelTypeName = furnace.lastFuelType ? ((typeof iName === 'function') ? iName(furnace.lastFuelType) : furnace.lastFuelType) : null;

    h += `<div style="background:rgba(0,0,0,0.03); padding:14px; border-radius:8px; margin-bottom:12px;">
      <div style="text-align:center; margin-bottom:8px;">${this._kovarnaFurnaceSvg(active)}</div>
      <div style="display:flex; justify-content:space-between; font-size:0.75rem; opacity:0.7; margin-bottom:3px;">
        <span>${active ? (lang === 'en' ? 'Furnace burning' : 'Pec hoří') + (fuelTypeName ? ' (' + fuelTypeName + ')' : '') : (lang === 'en' ? 'Furnace cold' : 'Pec vychladlá')}</span>
        <span>${active ? hoursLeft + 'h' : ''}</span>
      </div>
      <div style="height:8px; background:rgba(0,0,0,0.2); border-radius:4px; overflow:hidden; margin-bottom:10px; border:1px solid rgba(197,160,89,0.3);">
        <div style="height:100%; width:${pct}%; background:#ffbd40; transition:width 0.5s;"></div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${['stick', 'wood', 'log', 'charcoal'].map(fid => {
      const have = GameState.inventory[fid] || 0;
      const fname = (typeof iName === 'function') ? iName(fid) : fid;
      const hrs = this.KOVARNA_FUEL_VALUES[fid] / 3600000;
      return `<button class="filter-btn" style="flex:1; min-width:80px;" ${have < 1 ? 'disabled' : ''} onclick="CellariumSystem.kovarnaAddFuel('${fid}')" title="+${hrs}h">+ ${fname} (${have})</button>`;
    }).join('')}
      </div>
    </div>`;

    const waterCount = GameState.inventory['water'] || 0;
    h += `<div style="font-size:0.78rem; opacity:0.7; margin-bottom:12px;">💧 ${lang === 'en' ? 'Water for quenching' : 'Voda na kalení'}: <strong>${waterCount}</strong></div>`;

    // eventy-audit-mrd sešitka (05.09.2026) — dřív podkovy nebyly v Kovárně
    // vidět vůbec, jen mezi obecnými Zásobami. Sada_podkov/premium/worn už
    // jako itemy existují (viz recipes.js — sada_podkov, cat:'iron'), jen
    // jim chyběl vlastní řádek. Mirror stejného vzoru jako voda výš.
    const podkovyOk = GameState.inventory['sada_podkov'] || 0;
    const podkovyPrem = GameState.inventory['sada_podkov_premium'] || 0;
    const podkovyWorn = GameState.inventory['worn_sada_podkov'] || 0;
    if (podkovyOk + podkovyPrem + podkovyWorn > 0) {
        h += `<div style="font-size:0.78rem; opacity:0.7; margin-bottom:12px;">🧲 ${lang === 'en' ? 'Horseshoe sets' : 'Sady podkov'}:
            <strong>${podkovyOk}</strong>${lang === 'en' ? ' ready' : ' hotových'}${podkovyPrem > 0 ? `, <strong>${podkovyPrem}</strong> ${lang === 'en' ? 'premium' : 'prémiových'}` : ''}${podkovyWorn > 0 ? `, <strong style="color:#b05a3c;">${podkovyWorn}</strong> ${lang === 'en' ? 'worn (needs repair)' : 'opotřebených (k opravě)'}` : ''}
        </div>`;
    }

    h += this._renderKovarnaTierPanel(tier, lang);
    h += this._renderKovarnaGuildReminder(lang);
    h += this._renderKovarnaCraftList(lang);

    return h;
  },

  // vyroba-stavby-mrd (6.9.2026) — Bednářská dílna, mirror Kovárna vzoru
  // (header karta + built-check + craft list). Bez vlastní pece/mechaniky —
  // dřevozpracující řemeslo, ne kov/pekárna, žádnej ohňový sub-systém
  // nebyl žádanej. Craft list = existující sud/bedna/kontejner recepty
  // (žádný nový needsBuild gate — zůstávají dostupné i mimo dílnu, jen se
  // tady navíc přehledně sbalí). Nové exportní recepty ("řemeslo bednáře"
  // ve smyslu MRD) jsou budoucí práce, viz Memory.
  _renderBednaDilnaCraftList: function (lang) {
    if (typeof RecipesDB === 'undefined') return '';
    const ids = ['barrel_tool', 'bedna', 'convert_barrel_to_container'];
    const recipes = RecipesDB.filter(r => ids.includes(r.id) && (!r.locked || (GameState.unlockedRecipes && GameState.unlockedRecipes.includes(r.id))));
    if (!recipes.length) return `<div style="opacity:0.6; font-style:italic; font-size:0.8rem; margin-top:10px;">${lang === 'en' ? 'Nothing to craft here yet — research the basics first.' : 'Zatím není co vyrábět — nejprve prozkoumej základy.'}</div>`;
    let h = `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85; margin:10px 0 8px;">🛢️ ${lang === 'en' ? 'Cooperage' : 'Bednářství'}</div>`;
    h += `<div style="display:grid; grid-template-columns:1fr; gap:6px;">`;
    recipes.forEach(r => {
      const prod = ItemsDB[r.output];
      if (!prod) return;
      let can = true;
      let reqStr = '';
      Object.entries(r.req || {}).forEach(([id, amt]) => {
        const has = GameState.inventory[id] || 0;
        const missing = (amt > 0 && has < amt) || (amt === 0 && !has);
        if (missing) can = false;
        const iN = (typeof iName === 'function') ? iName(id) : id;
        reqStr += `<span style="${missing ? 'color:#b05a3c;' : ''}">${iN}${amt > 0 ? ' ' + has + '/' + amt : ''}</span> `;
      });
      if (prod.maxStack) {
        const have = GameState.inventory[r.output] || 0;
        if (have >= prod.maxStack) can = false;
      }
      h += `<div style="display:flex; align-items:center; gap:10px; padding:8px 10px; background:rgba(0,0,0,0.03); border-radius:6px;">
        <div style="font-size:1.3rem;">${prod.icon}</div>
        <div style="flex:1; font-size:0.8rem;"><strong>${lang === 'en' ? (prod.name_en || prod.name) : prod.name}</strong><div style="font-size:0.68rem; opacity:0.75;">${reqStr}</div></div>
        <button class="craft-btn" onclick="Game.craft('${r.id}')" ${can ? '' : 'disabled'}>${lang === 'en' ? 'Craft' : 'Vyrobit'}</button>
      </div>`;
    });
    h += `</div>`;
    return h;
  },

  renderBednaDilnaTab: function () {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    let h = `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">
      <h4 style="margin:0 0 8px 0; color:var(--ink-primary);">🛢️ ${lang === 'en' ? 'Cooperage Workshop' : 'Bednářská dílna'}</h4>
      <div style="font-size:0.82rem; opacity:0.75; font-style:italic;">
        ${lang === 'en'
        ? 'Staves and hoops instead of anvil and fire — barrels and crates take shape here, under one roof.'
        : 'Dužiny a obruče místo kovadliny a ohně — sudy a bedny tu vznikají pod jednou střechou.'}
      </div>
    </div>`;

    if (!(GameState.storage && GameState.storage.bedna_dilna && GameState.storage.bedna_dilna.built)) {
      h += `<div style="opacity:0.6; font-style:italic; font-size:0.82rem;">${lang === 'en' ? 'Cooperage Workshop not yet built.' : 'Bednářská dílna ještě není postavena.'}</div>`;
      return h;
    }

    h += this._renderBednaDilnaCraftList(lang);
    return h;
  },

  renderPozemkyPanel: function () {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (typeof LandParcelsDB === 'undefined') {
      return `<div style="padding:20px; opacity:0.6; text-align:center;">🏛️</div>`;
    }
    const landParcels = GameState.landParcels || {};
    // dilny-pozemky-mrd.md v0.3 §8 (25.8.2026) — proč ten tag, vysvětleno hráči.
    const TAG_HINTS = {
      voda: { cs: 'voda — pohon mlýnského/hamerského kola', en: 'water — power for a mill or trip-hammer wheel' },
      kopec: { cs: 'kopec — otevřeno větru', en: 'hill — open to the wind' },
      slunce: { cs: 'slunce — jižní svah pro vinnou révu', en: 'sun — south-facing slope for vines' },
      les: { cs: 'les — přístup ke dřevu pro dřevozpracující dílny', en: 'forest — timber access for woodworking workshops' },
    };

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<div style="font-size:0.85rem; opacity:0.75; font-style:italic; margin-bottom:14px;">
      ${lang === 'en'
        ? 'Land the Abbot has secured leave to acquire from the Lord of the Manor.'
        : 'Pozemky, co opat vyjednal možnost získat od Zemského pána.'}
    </div>`;

    Object.keys(LandParcelsDB).forEach(id => {
      const parcel = LandParcelsDB[id];
      const name = lang === 'en' ? (parcel.name_en || parcel.name) : parcel.name;
      const desc = lang === 'en' ? (parcel.desc_en || parcel.desc) : parcel.desc;
      const state = (landParcels[id] && landParcels[id].status) || 'none';

      let actionHtml = '';
      // dilny-pozemky-mrd.md v0.3 (25.8.2026) — parcely pro dílny mají
      // vlastní opatovu petici PŘED nákupem (land_<id>). Parcely bez ní
      // (mlynsky_nahon/navrsi/vinice) se chovají přesně jako dřív.
      const landPetKey = 'land_' + id;
      const landPet = GameState.abbotPetition && GameState.abbotPetition[landPetKey];
      if (state === 'none' && landPet) {
        if (landPet.status === 'none') {
          actionHtml = `<button onclick="Game.submitAbbotPetition('${landPetKey}')" style="font-size:0.78rem; padding:6px 14px; cursor:pointer;">🏛️ ${lang === 'en' ? 'Ask the Abbot' : 'Požádat opata'}</button>`;
        } else if (landPet.status === 'pending') {
          actionHtml = `<span style="font-size:0.78rem; opacity:0.7;">⏳ ${lang === 'en' ? 'Abbot considers…' : 'Opat zvažuje…'}</span>`;
        } else if (landPet.status === 'approved') {
          actionHtml = `<button onclick="Game.buyLandParcel('${id}')" style="font-size:0.78rem; padding:6px 14px; cursor:pointer;">${lang === 'en' ? `Buy — ${parcel.price}g` : `Koupit — ${parcel.price}g`}</button>`;
        }
      } else if (state === 'none') {
        actionHtml = `<button onclick="Game.buyLandParcel('${id}')" style="font-size:0.78rem; padding:6px 14px; cursor:pointer;">${lang === 'en' ? `Buy — ${parcel.price}g` : `Koupit — ${parcel.price}g`}</button>`;
      } else if (state === 'pending') {
        const p = landParcels[id];
        const hoursLeft = Math.max(0, Math.ceil((p.deskyCompleteAt - Date.now()) / 3600000));
        actionHtml = `<span style="font-size:0.78rem; opacity:0.7;">⏳ ${lang === 'en' ? `Land Register, ~${hoursLeft}h` : `Zemské desky, ~${hoursLeft}h`}</span>`;
      } else if (state === 'owned') {
        actionHtml = `<span style="font-size:0.78rem;">✅ ${lang === 'en' ? 'Owned' : 'Vlastníš'}</span>`;
      }

      h += `<div style="padding:12px 14px; margin-bottom:10px; background:rgba(197,160,89,0.06); border-radius:6px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="font-weight:bold; font-size:0.9rem;">${name}</div>
          ${actionHtml}
        </div>
        <div style="font-size:0.78rem; opacity:0.75; font-style:italic; margin-bottom:4px;">${desc}</div>
        <div style="font-size:0.72rem; opacity:0.6;">${lang === 'en' ? 'tags' : 'tagy'}: ${parcel.tags.length ? parcel.tags.map(tg => TAG_HINTS[tg] ? (lang === 'en' ? TAG_HINTS[tg].en : TAG_HINTS[tg].cs) : tg).join(', ') : (lang === 'en' ? 'no special terrain' : 'bez zvláštního terénu')} · ${lang === 'en' ? 'slots' : 'sloty'}: ${parcel.slotsCapacity}</div>
      </div>`;
    });

    h += `</div>`;
    return h;
  },


  checkGuildActivations: function () {
    if (typeof GameState === 'undefined') return;
    if (!GameState.activeGuilds || !Array.isArray(GameState.activeGuilds)) {
      GameState.activeGuilds = ['mlynarsky', 'truhlarsky', 'kolarsky', 'kovarsky'];
    }

    // v0.7 oprava (24.8.2026) — 'sausage'/'jeweled_binding'/'gold_leaf' jsou
    // fiktivní ID bez krytí v items.js (stejný nález jako affectedGoods audit).
    // Mapováno na reálné itemy — jinak tyhle větve OR podmínky nikdy nesplní.
    // v0.9 oprava (25.8.2026) — 'tech_fornax' byla ŠPATNÁ tech (Fornax
    // Ferraria = kovářská huť, ne pekárna, jen sdílený latinský kořen).
    // Furnus má teď vlastní tech_furnus + storage.furnus (dilny-pozemky-mrd.md v0.3).
    const triggers = {
      pekarsky: (GameState.researchedTechs && GameState.researchedTechs.includes('tech_furnus')) ||
        (GameState.storage && GameState.storage.furnus && GameState.storage.furnus.built) ||
        ((GameState.inventory && GameState.inventory['flour'] || 0) >= 10),
      reznicky: (GameState.inventory && ((GameState.inventory['meat'] || 0) + (GameState.inventory['cured_meat'] || 0)) >= 10),
      zlatnicky: (GameState.inventory && ((GameState.inventory['zlaty_prut'] || 0) >= 1 || (GameState.inventory['aurum_musicum'] || 0) >= 1)),
      kozeluzsky: (GameState.researchedTechs && (GameState.researchedTechs.includes('tech_ligatura') || GameState.researchedTechs.includes('tech_compactura')))
    };

    const lang = (GameState.settings && GameState.settings.language) || 'cs';

    Object.keys(triggers).forEach(id => {
      if (triggers[id] && !GameState.activeGuilds.includes(id)) {
        GameState.activeGuilds.push(id);
        const g = GuildsDB[id];
        if (g) {
          const gName = lang === 'en' ? g.name_en : g.name;
          if (typeof UI !== 'undefined' && UI.notifyPanel) {
            UI.notifyPanel('📜 ' + (lang === 'en'
              ? `New Guild activated: ${gName} (${g.masterName})`
              : `Aktivován nový cech: ${gName} (${g.masterName})`), 'system');
          }
        }
      }
    });
  },

  // §3 — Cechovní panel (MRD v0.1 - v0.5 Dashboard)
  renderCechyPanel: function () {
    this.checkGuildActivations();
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    if (typeof GuildsDB === 'undefined') {
      return `<div style="padding:20px; opacity:0.6; text-align:center;">⚖️</div>`;
    }
    const activeGuilds = (typeof getActiveGuilds === 'function') ? getActiveGuilds() : (typeof GUILDS_BASE_ACTIVE !== 'undefined' ? GUILDS_BASE_ACTIVE : []);
    const snap = (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._snap) ? ChroniconSystem._snap : null;
    const worldGuilds = (snap && snap.guilds) || null;
    const guildRelation = GameState.guildRelation || {};
    const guildPravo = GameState.guildPravo || {};
    const guildPhase0 = GameState.guildPhase0 || {};
    const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_ius_terrae');

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<div style="font-size:0.85rem; opacity:0.75; font-style:italic; margin-bottom:8px;">
      ${lang === 'en'
        ? 'Guild relationship is built with Guild Masters via gifts and commissions. Negotiations require Abbot permission (Phase 0) and ratification (Phase 2).'
        : 'Vztahy s cechmistry se budují přes dary a zakázky. Jednání vyžaduje povolení opata (Fáze 0) a ratifikaci Privilegia (Fáze 2).'}
    </div>`;
    h += `<div style="font-size:0.72rem; opacity:0.6; margin-bottom:14px;">
      🎁 ${lang === 'en' ? 'Gift costs' : 'Dar stojí'}: 5× ${lang === 'en' ? 'beer' : 'pivo'}, 3× ${lang === 'en' ? 'honey' : 'med'}, 2× ${lang === 'en' ? 'candle' : 'svíčka'} → +${(typeof PetitionManager !== 'undefined' ? PetitionManager.GUILD_GIFT_RELATION : 10)} ${lang === 'en' ? 'relation, 24h cooldown per guild' : 'vztahu, cooldown 24h na cech'}
    </div>`;

    activeGuilds.forEach(id => {
      const g = GuildsDB[id];
      if (!g) return;
      const name = lang === 'en' ? g.name_en : g.name;
      const masterName = g.masterName || 'Cechmistr';
      const masterIcon = g.masterIcon || '📜';
      const desc = lang === 'en' ? (g.desc_en || g.desc) : g.desc;
      const matters = g.matters || [];

      const tension = (worldGuilds && worldGuilds[id]) ? Math.round(worldGuilds[id].tension) : null;
      const tensionLabel = tension === null ? (lang === 'en' ? 'unknown' : 'neznámo') : `${tension}/100`;

      const rel = guildRelation[id] || 0;
      const sparkline = (typeof getGuildSparkline === 'function') ? getGuildSparkline(id) : '──────';
      const trend = (typeof getGuildTrend === 'function') ? getGuildTrend(id) : { arrow: '→', delta: '0', color: 'opacity:0.6;' };

      // Jedna karta na cech, ale UVNITŘ jeden řádek na věc (matterKey) —
      // Pekařský má dvě samostatné petice/ratifikace (v0.6 bod 4).
      let mattersHtml = '';
      let allGranted = matters.length > 0;
      matters.forEach(matter => {
        const matterKey = matter.key;
        const matterLabel = lang === 'en' ? (matter.label_en || matter.label) : matter.label;
        const privilegeLabel = lang === 'en' ? (matter.privilegeLabel_en || matter.privilegeLabel) : matter.privilegeLabel;
        const p0 = guildPhase0[matterKey] || { status: 'none' };
        const p2 = guildPravo[matterKey] || { status: 'none' };
        if (p2.status !== 'granted') allGranted = false;

        let phase0Html = '';
        if (p0.status === 'none') {
          phase0Html = `<button onclick="Game.submitGuildPhase0Petition('${id}','${matterKey}')" style="font-size:0.72rem; padding:4px 10px; cursor:pointer; background:rgba(197,160,89,0.15); border:1px solid var(--accent-gold); border-radius:4px;">📜 ${lang === 'en' ? 'Phase 0: Ask Abbot to open negotiations' : '📜 Fáze 0: Požádat opata o zahájení jednání'}</button>`;
        } else if (p0.status === 'pending') {
          phase0Html = `<span style="font-size:0.72rem; opacity:0.7; font-style:italic;">⏳ ${lang === 'en' ? 'Phase 0: Abbot negotiating (~24h)...' : 'Fáze 0: Opat vyjednává (~24h)...'}</span>`;
        } else {
          phase0Html = `<span style="font-size:0.72rem; color:#4CAF50; font-weight:bold;">✅ ${lang === 'en' ? 'Phase 0: Negotiations Open' : 'Fáze 0: Jednání otevřeno'}</span>`;
        }

        let phase2Html = '';
        if (p0.status === 'approved') {
          if (p2.status === 'none') {
            if (rel >= 50 && hasTech) {
              phase2Html = `<button onclick="Game.submitGuildPetition('${id}','${matterKey}')" style="font-size:0.72rem; padding:4px 10px; margin-left:8px; cursor:pointer; background:rgba(76,175,80,0.15); border:1px solid #4CAF50; border-radius:4px;">📜 ${lang === 'en' ? 'Phase 2: Request Privilege (1 gold ingot)' : '📜 Fáze 2: Žádost o Privilegium (1× zlatý prut)'}</button>`;
            } else {
              const missingTech = !hasTech ? (lang === 'en' ? 'requires tech "Ius Terrae"' : 'vyžaduje tech "Ius Terrae"') : '';
              const missingRel = rel < 50 ? (lang === 'en' ? 'requires relation 50+' : 'vyžaduje vztah 50+') : '';
              const reason = [missingTech, missingRel].filter(Boolean).join(' & ');
              phase2Html = `<span style="font-size:0.68rem; opacity:0.6; margin-left:8px; font-style:italic;">🔒 Phase 2: ${reason}</span>`;
            }
          } else if (p2.status === 'pending' || p2.status === 'negotiating') {
            phase2Html = `<span style="font-size:0.72rem; opacity:0.7; margin-left:8px; font-style:italic;">⏳ ${lang === 'en' ? 'Phase 2: Ratification in progress (~24h)' : 'Fáze 2: Ratifikace probíhá (~24h)'}</span>`;
          } else if (p2.status === 'granted') {
            phase2Html = `<span style="font-size:0.72rem; color:#4CAF50; font-weight:bold; margin-left:8px;">✅ ${lang === 'en' ? 'Privilege Granted (10% fee)' : 'Privilegium Uděleno (10% poplatek)'}</span>`;
          }
        }

        mattersHtml += `<div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed rgba(197,160,89,0.15);">
          <div style="font-size:0.73rem; opacity:0.7; margin-bottom:4px;">⚖️ ${lang === 'en' ? 'Scope' : 'Účinek'}: <strong>${privilegeLabel}</strong></div>
          <div style="display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:4px;">${phase0Html} ${phase2Html}</div>
        </div>`;
      });

      let giftHtml = '';
      if (!allGranted) {
        const cd = (GameState.guildGiftCooldown && GameState.guildGiftCooldown[id]) || 0;
        const cdMs = (typeof PetitionManager !== 'undefined' ? PetitionManager.GUILD_GIFT_COOLDOWN_MS : 86400000);
        const cdLeftMs = cdMs - (Date.now() - cd);
        if (cdLeftMs > 0) {
          const hrs = Math.ceil(cdLeftMs / 3600000);
          giftHtml = `<span style="font-size:0.68rem; opacity:0.5; margin-left:8px;">🎁 ${hrs}h</span>`;
        } else {
          giftHtml = `<button onclick="Game.sendGuildGift('${id}')" style="font-size:0.72rem; padding:4px 10px; margin-left:8px; cursor:pointer;">🎁 ${lang === 'en' ? 'Send Gift' : 'Poslat dar'}</button>`;
        }
      }

      h += `<div style="padding:12px 14px; margin-bottom:10px; background:rgba(197,160,89,0.06); border-radius:8px; border:1px solid rgba(197,160,89,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div>
            <div style="font-weight:bold; font-size:0.95rem;">${masterIcon} ${name} — <span style="font-size:0.85rem; font-weight:normal; opacity:0.85;">${masterName}</span></div>
            <div style="font-size:0.76rem; opacity:0.75; font-style:italic; margin-top:2px;">"${desc}"</div>
          </div>
          <div style="text-align:right; font-family:monospace; font-size:0.8rem; background:rgba(0,0,0,0.05); padding:4px 8px; border-radius:4px;">
            <div>${lang === 'en' ? 'Rel' : 'Vztah'}: <strong>${rel}/100</strong> <span style="${trend.color}">${trend.arrow} ${trend.delta}</span></div>
            <div style="font-size:0.7rem; opacity:0.8; letter-spacing:1px; margin-top:2px;">[ ${sparkline} ]</div>
          </div>
        </div>

        <div style="font-size:0.73rem; opacity:0.7; margin-bottom:8px;">
          🔥 ${lang === 'en' ? 'World Tension' : 'Světové napětí'}: <strong>${tensionLabel}</strong>
        </div>

        ${mattersHtml}

        <div style="display:flex; justify-content:flex-end; align-items:center; padding-top:2px;">
          ${giftHtml}
        </div>
      </div>`;
    });

    h += `<button onclick="UI.switchScreen('lore', document.getElementById('nav-lore')); UI.switchLoreTab('commitments');"
            style="width:100%; margin-top:6px; padding:10px; cursor:pointer; font-size:0.82rem; background:rgba(197,160,89,0.1); border:1px solid var(--accent-gold); border-radius:6px;">
      📜 ${lang === 'en' ? 'Go to Guild Commissions (Lore → Commitments)' : 'Do Zakázek cechů (Lore → Commitments)'}
    </button>`;

    h += `</div>`;
    return h;
  },

  renderInventarium: function () {
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
      all: { icon: '📦', cs: 'Vše', en: 'All' },
      mat: { icon: '🧵', cs: 'Suroviny', en: 'Materials' },
      tool: { icon: '🔧', cs: 'Nástroje', en: 'Tools' },
      food: { icon: '🍞', cs: 'Jídlo', en: 'Food' },
      lore: { icon: '📖', cs: 'Vědění', en: 'Lore' },
      animal: { icon: '🐐', cs: 'Zvířata', en: 'Animals' },
      alchemy: { icon: '⚗️', cs: 'Alchymie', en: 'Alchemy' },
      other: { icon: '🗝️', cs: 'Ostatní', en: 'Miscellaneous' },
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
    if (s.almarium && s.almarium.built) { cap += 200; storParts.push('Almarium (+200j)'); }
    if (s.cella && s.cella.built) { cap += 600; storParts.push('Cella (+600j)'); }
    if (s.horreum && s.horreum.built) { cap += 1600; storParts.push('Horreum (+1600j)'); }
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
          ${lbl.icon} ${lang === 'en' ? lbl.en : lbl.cs} <span style="opacity:0.7;">(${n})</span>
        </button>`;
      });
      h += `</div>`;
    } else {
      h += `<div style="margin-bottom:12px; padding:8px 10px; background:rgba(0,0,0,0.03); border-radius:6px; font-size:0.75rem; opacity:0.65; font-style:italic;">
        ${lang === 'en'
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
      let rate = ds ? ds.effectiveRate(id, qty) : null;
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
          <span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${lbl.icon} ${lang === 'en' ? lbl.en : lbl.cs} (${catRows.length})</span>
        </div>`;
        h += `<div id="inv-cat-body-${cat}" style="display:${collapsed ? 'none' : 'grid'}; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:5px;">`;
        catRows.forEach(r => { h += renderRow(r); });
        h += `</div>`;
      });
    } else {
      h += `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:5px;">`;
      rows.forEach(r => { h += renderRow(r); });
      h += `</div>`;
    }

    h += `</div>`;
    return h;
  },

  // ── Stavba zvířecího výběhu (deleguje na GardenSystem) ───────────────
  buildPen: function (pen) {
    if (typeof GardenSystem === 'undefined') return;
    GardenSystem.buildAnimalPen(pen);
    // Re-render Budovy
    if ((GameState.ui && GameState.ui.cellariumEntity) === 'buildings') this.switchEntity('buildings');
  },

  // ── Zahodit předmět ze zásob ──────────────────────────────────────────
  // Sbalovací kategorie v pohledu "Vše" Inventaria — stejný vzor jako
  // UI.toggleCraftCategory() v Craft panelu, vlastní klíč/prefix ať nekoliduje.
  toggleInventariumCategory: function (cat) {
    if (!GameState.uiPrefs) GameState.uiPrefs = {};
    if (!GameState.uiPrefs.invCollapsed) GameState.uiPrefs.invCollapsed = {};
    const collapsed = !GameState.uiPrefs.invCollapsed[cat];
    GameState.uiPrefs.invCollapsed[cat] = collapsed;
    const body = document.getElementById('inv-cat-body-' + cat);
    if (body) body.style.display = collapsed ? 'none' : 'grid';
    const chevron = document.getElementById('inv-cat-chevron-' + cat);
    if (chevron) chevron.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(90deg)';
    if (typeof Game !== 'undefined' && Game.save) Game.save();
  },

  discardItem: function (id, qty) {
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
  recordTransaction: function (type, itemId, qty, price, entity) {
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

  // Zakázky/dary do Liber Rationum — 16.8.2026, oprava mezery: addGrose()
  // z CommitmentsSystem.js na 6 místech nikdy nezapisoval do treasury.
  // transactions (uživatelský nález — vyplacené groše "zmizely" z účetní
  // knihy). type: 'sell' záměrně (stejná bilance-logika jako u prodeje —
  // renderLiberRationum počítá income jen z type==='sell', ne z nového
  // typu navíc). itemId: null, qty: 1 — title/sourceName nahrazuje
  // ItemsDB lookup, recordTransaction beze změny (shop tok netknutej).
  recordCommissionIncome: function (title, amount, sourceName, sourceName_en) {
    if (!GameState.treasury) GameState.treasury = {};
    if (!GameState.treasury.transactions) GameState.treasury.transactions = [];
    if (!amount) return;
    GameState.treasury.transactions.unshift({
      date: new Date().toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' }),
      type: 'sell',
      itemId: null,
      name: title,
      qty: 1,
      price: amount,
      entity: 'commission',
      entityName: sourceName || 'Zakázka',
      entityName_en: sourceName_en || sourceName || 'Commission',
      total: amount,
    });
    if (GameState.treasury.transactions.length > 100) {
      GameState.treasury.transactions = GameState.treasury.transactions.slice(0, 100);
    }
  },

  // Výdajová dvojče recordCommissionIncome — ledger-audit-mrd (28.8.2026).
  // Stejný tvar, type:'buy' místo 'sell'. Dřív existovala jen jako ruční
  // transactions.unshift v PetitionManager.js (nákup pozemku) — vytaženo
  // sem jako sdílená funkce, ať se nekopíruje 13× napříč soubory.
  recordCommissionExpense: function (title, amount, sourceName, sourceName_en) {
    if (!GameState.treasury) GameState.treasury = {};
    if (!GameState.treasury.transactions) GameState.treasury.transactions = [];
    if (!amount) return;
    GameState.treasury.transactions.unshift({
      date: new Date().toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' }),
      type: 'buy',
      itemId: null,
      name: title,
      qty: 1,
      price: amount,
      entity: 'commission',
      entityName: sourceName || 'Výdaj',
      entityName_en: sourceName_en || sourceName || 'Expense',
      total: amount,
    });
    if (GameState.treasury.transactions.length > 100) {
      GameState.treasury.transactions = GameState.treasury.transactions.slice(0, 100);
    }
  },

  renderLiberRationum: function () {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const txs = (GameState.treasury && GameState.treasury.transactions) || [];

    const title = lang === 'en' ? 'Liber Rationum — Account Book' : 'Liber Rationum — Účetní Kniha';
    const emptyLabel = lang === 'en' ? 'No transactions recorded yet.' : 'Zatím žádné záznamy.';
    const typeLabel = { sell: lang === 'en' ? 'Sold' : 'Prodáno', buy: lang === 'en' ? 'Bought' : 'Koupeno' };

    // Výpočet bilance
    const income = txs.filter(t => t.type === 'sell').reduce((s, t) => s + t.total, 0);
    const expense = txs.filter(t => t.type === 'buy').reduce((s, t) => s + t.total, 0);
    const balance = income - expense;

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<div style="font-size:0.75rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:12px;">${title}</div>`;

    // Bilance summary
    h += `<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px;">
      <div style="text-align:center; padding:8px; background:rgba(90,154,90,0.1); border-radius:6px; border:1px solid rgba(90,154,90,0.3);">
        <div style="font-size:0.65rem; opacity:0.7;">${lang === 'en' ? 'Income' : 'Příjmy'}</div>
        <div style="font-weight:bold; color:#5a9a5a;">+${income} 💰</div>
      </div>
      <div style="text-align:center; padding:8px; background:rgba(192,57,43,0.1); border-radius:6px; border:1px solid rgba(192,57,43,0.3);">
        <div style="font-size:0.65rem; opacity:0.7;">${lang === 'en' ? 'Expenses' : 'Výdaje'}</div>
        <div style="font-weight:bold; color:#c0392b;">-${expense} 💰</div>
      </div>
      <div style="text-align:center; padding:8px; background:rgba(197,160,89,0.1); border-radius:6px; border:1px solid rgba(197,160,89,0.3);">
        <div style="font-size:0.65rem; opacity:0.7;">${lang === 'en' ? 'Balance' : 'Bilance'}</div>
        <div style="font-weight:bold; color:${balance >= 0 ? '#5a9a5a' : '#c0392b'};">${balance >= 0 ? '+' : ''}${balance} 💰</div>
      </div>
    </div>`;

    if (txs.length === 0) {
      h += `<div style="text-align:center; padding:20px; opacity:0.5; font-style:italic; font-size:0.85rem;">${emptyLabel}</div>`;
    } else {
      h += `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:5px; max-height:400px; overflow-y:auto;">`;
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
  renderBuildings: function () {
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const storage = GameState.storage || {};
    const hasCarp = GameState.researchedTechs && GameState.researchedTechs.includes('tech_carpentaria');
    const hasAlm = GameState.researchedTechs && GameState.researchedTechs.includes('tech_almarium');
    const hasCel = GameState.researchedTechs && GameState.researchedTechs.includes('tech_cella');
    const hasHor = GameState.researchedTechs && GameState.researchedTechs.includes('tech_horreum');
    const hasKov = GameState.researchedTechs && GameState.researchedTechs.includes('tech_kovarina');
    const hasRust = GameState.researchedTechs && GameState.researchedTechs.includes('tech_de_re_rustica');
    const hasCrop = GameState.researchedTechs && GameState.researchedTechs.includes('tech_crop_rotation');
    const hasVin = GameState.researchedTechs && GameState.researchedTechs.includes('tech_vinohrad');
    const hasVinF = GameState.researchedTechs && GameState.researchedTechs.includes('tech_vinifikace');
    const hasTonn = GameState.researchedTechs && GameState.researchedTechs.includes('tech_tonnellerie');
    const hasUvar = GameState.researchedTechs && GameState.researchedTechs.includes('tech_uvarium');
    const hasPOlei = GameState.researchedTechs && GameState.researchedTechs.includes('tech_prelum_olei');
    const hasCalcaria = GameState.researchedTechs && GameState.researchedTechs.includes('tech_calcaria');
    const hasUdirna = GameState.researchedTechs && GameState.researchedTechs.includes('tech_udirna');
    const hasTacuinum = GameState.researchedTechs && GameState.researchedTechs.includes('tech_tacuinum_sanitatis');
    const hasPlatina = GameState.researchedTechs && GameState.researchedTechs.includes('tech_platina_honesta');
    // mlynar-vlastni-mlyn-mrd.md §4.5 (16.8.2026) — Sušárna jako skutečná
    // budova, ne jen tech. Historický podklad: kámen+cihly (požární
    // bezpečnost), železné rošty, vápno/hlína jako pojivo.
    const hasSusarnaIndustria = GameState.researchedTechs && GameState.researchedTechs.includes('tech_susarna_industria');

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
        // dilny-pozemky-mrd.md v0.3 (25.8.2026) — první ze čtyř dílen.
        // req_build kombinuje DVĚ podmínky: opatova petice o Furnus SAMOTNÝ
        // (mirror fornax_ferraria) A vlastnictví parcely Pekařský dvůr
        // (nová vrstva parcela→budova, §5 MRD) — obojí musí platit.
        id: 'furnus', icon: '🍞',
        name: 'Furnus (Pekárna)', name_en: 'Furnus (Bakery Oven)',
        desc: 'Hliněná pec s klenutým stropem na pečení chleba ve velkém. Vyžaduje souhlas opata a vlastní pozemek (Pekařský dvůr).',
        desc_en: 'Clay-vaulted oven for baking bread at scale. Requires Abbot consent and its own parcel (the Bakers\' Yard).',
        cost: { clay: 20, rock: 15, plank: 10, hrebiky: 5 },
        req_tech: (GameState.researchedTechs && GameState.researchedTechs.includes('tech_furnus')),
        req_build: (GameState.abbotPetition && GameState.abbotPetition.furnus && GameState.abbotPetition.furnus.status === 'approved')
          && (GameState.landParcels && GameState.landParcels['dvur_pekarsky'] && GameState.landParcels['dvur_pekarsky'].status === 'owned'),
        req_label: lang === 'en'
          ? 'Requires: own the Bakers\' Yard parcel (Cellarium — Land) + Abbot approval (petition)'
          : 'Nutné: vlastnit parcelu Pekařský dvůr (Cellarium — Pozemky) + souhlas opata (žádost)',
        petition_type: 'furnus',
      },
      {
        // kovarna-dilna-mrd.md v0.5 (30.8.2026) — druhá dílna, mirror furnus
        // entry přesně. req_build kombinuje opatovu petici o Kovárnu SAMOTNOU
        // A vlastnictví parcely Dvůr u hradební zdi — obojí musí platit.
        id: 'kovarna', icon: '🔨',
        name: 'Kovárna', name_en: 'Kovárna (Smithy)',
        desc: 'Kovárna s pevnou kovadlinou a stálým žárem. Oprava a kování podkov ve velkém. Vyžaduje souhlas opata a vlastní pozemek (Dvůr u hradební zdi).',
        desc_en: 'A smithy with a firm anvil and steady heat. Repairing and forging horseshoes at scale. Requires Abbot consent and its own parcel (the Wall-side Yard).',
        cost: { rock: 25, plank: 15, charcoal: 10, anvil: 1, hrebiky: 8 },
        req_tech: (GameState.researchedTechs && GameState.researchedTechs.includes('tech_kovarna')),
        req_build: (GameState.abbotPetition && GameState.abbotPetition.kovarna && GameState.abbotPetition.kovarna.status === 'approved')
          && (GameState.landParcels && GameState.landParcels['u_hradby'] && GameState.landParcels['u_hradby'].status === 'owned'),
        req_label: lang === 'en'
          ? 'Requires: own the Wall-side Yard parcel (Cellarium — Land) + Abbot approval (petition)'
          : 'Nutné: vlastnit parcelu Dvůr u hradební zdi (Cellarium — Pozemky) + souhlas opata (žádost)',
        petition_type: 'kovarna',
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
      {
        id: 'susarna', icon: '🏛️',
        name: 'Sušárna', name_en: 'Drying Rack',
        desc: 'Kamenná stavba se železnými rošty nad tlejícím ohništěm — nikdy otevřený plamen, jen sálavé teplo a kouř. Syrové dřevo tu vyzraje za týdny, ne za roky.',
        desc_en: 'A stone structure with iron grates over a smouldering hearth — never an open flame, only radiant heat and smoke. Green timber seasons here in weeks, not years.',
        cost: { cut_stone: 25, iron_ingot: 5, vapno_hasene_mature: 10, plank: 8, hrebiky: 5 },
        req_tech: hasSusarnaIndustria, req_build: true, req_label: null,
      },
      {
        id: 'cerna_kuchyne', icon: '🏚️',
        name: 'Černá kuchyně', name_en: 'Black Kitchen',
        desc: 'Klenutá kuchyně s širokým soplouchem. Rychlejší a účinnější uzení než holé Ohniště, oddělené od obytných místností.',
        desc_en: 'A vaulted kitchen with a wide smoke-hood. Faster, more effective smoking than a bare Hearth, separated from the living quarters.',
        cost: { cut_stone: 15, plank: 8, clay: 12, hrebiky: 3 },
        req_tech: hasTacuinum, req_build: true, req_label: null,
      },
      {
        id: 'udirna', icon: '🏚️',
        name: 'Udírna', name_en: 'Smokehouse',
        desc: 'Samostatná věžová udírna. Studený kouř z dřeva mimo ohniště vyudí maso na zimu.',
        desc_en: 'A standalone tower smokehouse. Cold smoke from an offset hearth cures meat for winter.',
        cost: { cut_stone: 25, plank: 15, rope: 4, clay: 8, hrebiky: 6 },
        req_tech: hasUdirna, req_build: true, req_label: null,
      },
      {
        id: 'velky_hmozdir', icon: '⚱️',
        name: 'Velký hmoždíř', name_en: 'Great Mortar',
        desc: 'Kamenný hmoždíř na drcení koření a mandlí. Bez něj zůstává drahé koření jen hrubé kusy.',
        desc_en: 'A stone mortar for grinding spice and almonds. Without it, costly spice stays coarse lumps.',
        cost: { cut_stone: 30, hrebiky: 2 },
        req_tech: hasPlatina, req_build: true, req_label: null,
      },
      {
        id: 'rozen', icon: '🍖',
        name: 'Rožeň', name_en: 'Spit',
        desc: 'Železný rožeň na pečeně hodné panského stolu.',
        desc_en: 'An iron spit for roasts worthy of a lord\'s table.',
        cost: { iron_ingot: 6, plank: 4, hrebiky: 3 },
        req_tech: hasPlatina, req_build: true, req_label: null,
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
      {
        id: 'bedna_dilna', icon: '🛢️',
        name: 'Bednářská dílna', name_en: 'Cooperage Workshop',
        desc: 'Výroba sudů pro export vína. Odemkne řemeslo bednáře.',
        desc_en: 'Crafts barrels for wine export. Unlocks the cooper\'s craft.',
        cost: { plank: 12, iron_ingot: 4, rope: 5, wild_leather: 2 },
        req_tech: hasTonn, req_build: true, req_label: null,
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
        return `<span style="color:${ok ? 'inherit' : '#c0392b'};">${icon} ${name} ×${qty} (${lang === 'en' ? 'have' : 'máš'}: ${have})</span>`;
      }).join(' &nbsp;');
      const statusIcon = built ? '✅' : (locked ? '🔒' : (waitBuild ? '⏳' : '🏗️'));
      const statusColor = built ? '#5a9a5a' : (locked ? 'rgba(0,0,0,0.3)' : 'var(--accent-gold)');
      return `<div style="padding:12px; background:rgba(197,160,89,0.05);
                        border-radius:8px; border:1px solid rgba(197,160,89,${built ? '0.5' : '0.2'});
                        border-left:4px solid ${statusColor};">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
          <span style="font-size:1.6rem;">${b.icon}</span>
          <div style="flex:1;">
            <div style="font-weight:bold; font-size:0.92rem;">${statusIcon} ${lang === 'en' ? b.name_en : b.name}</div>
            <div style="font-size:0.78rem; opacity:0.75; margin-top:2px;">${lang === 'en' ? b.desc_en : b.desc}</div>
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
            const sd = pet.submittedAt ? _toGameDate(pet.submittedAt).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB') : '?';
            const rd = pet.submittedAt ? _toGameDate(pet.submittedAt + 86400000).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB') : '?';
            return `<div style="font-size:0.78rem; opacity:0.7; font-style:italic;">⏳ ${t('abbotPetition.' + b.petition_type + '.pending').replace('{date}', sd).replace('{responseDate}', rd)}</div>`;
          }
          return '';
        })() : ''}
        ${canBuild ? `<button onclick="Game.buildStorage('${b.id}')" class="craft-btn" style="font-size:0.78rem;">🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>` : ''}
        ${built ? `<div style="font-size:0.78rem; color:#5a9a5a; font-style:italic;">✅ ${lang === 'en' ? 'Built' : 'Postaveno'}</div>` : ''}
        ${locked ? `<div style="font-size:0.78rem; opacity:0.5; font-style:italic;">🔒 ${lang === 'en' ? 'Research required' : 'Vyžaduje výzkum'}</div>` : ''}
        ${waitBuild ? `<div style="font-size:0.78rem; opacity:0.6; font-style:italic;">⏳ ${b.req_label}</div>` : ''}
      </div>`;
    };

    const baseCap = 1000;   // sync s DecaySystem.totalCapacity
    const almCap = (storage.almarium && storage.almarium.built) ? 200 : 0;
    const celCap = (storage.cella && storage.cella.built) ? 600 : 0;
    const horCap = (storage.horreum && storage.horreum.built) ? 1600 : 0;
    const oldCellCap = (storage.old_cellars && storage.old_cellars.built) ? 500 : 0;
    const totalCap = baseCap + almCap + celCap + horCap + oldCellCap;
    const capLabel = lang === 'en'
      ? `Current capacity: <strong>${totalCap} units</strong>`
      : `Aktuální kapacita: <strong>${totalCap} j</strong>`;

    let h = `<div style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
    h += `<div style="font-size:0.75rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); margin-bottom:14px;">${title}</div>`;

    // Pozemky — pozemky-mrd.md §2, v1.3, 16.8.2026. Vždy dostupnej dotaz,
    // nezávislej na tech_regalia (opat odpoví podmíněně, viz Game.
    // askAbbotAboutLand). Zmizí, jakmile je flags.pozemky_active true —
    // pak už se řeší přes Scriptorium (Fáze 2, zatím 0 kód).
    if (!(GameState.flags && GameState.flags.pozemky_active)) {
      h += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; margin-bottom:14px; background:rgba(197,160,89,0.08); border-radius:6px;">
        <span style="font-size:0.82rem;">🏛️ ${lang === 'en' ? "The monastery's land could grow." : 'Klášterní panství by mohlo růst.'}</span>
        <button onclick="Game.askAbbotAboutLand()" style="font-size:0.72rem; padding:4px 10px; cursor:pointer;">${lang === 'en' ? 'Speak with the Abbot' : 'Promluvit s opatem'}</button>
      </div>`;
    }

    // Vodní mlýn — mlynar-vlastni-mlyn-mrd.md §4.9 (v1.3, 16.8.2026).
    // Zobrazí se, jakmile je mlynsky_nahon vlastněná (i před tím jako
    // hint, ať hráč ví proč to tam chybí — mirror "otevřená mezera"
    // principu, ne skrytá podmínka).
    const _mlynParcelOwned = GameState.landParcels && GameState.landParcels.mlynsky_nahon && GameState.landParcels.mlynsky_nahon.status === 'owned';
    if (GameState.flags && GameState.flags.pozemky_active) {
      const _m = (GameState.storage && GameState.storage.mill) || { tier: -1 };
      const _mTier = (typeof _m.tier === 'number') ? _m.tier : -1;
      h += `<div style="padding:12px 14px; margin-bottom:14px; background:rgba(197,160,89,0.06); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
      h += `<div style="font-weight:bold; font-size:0.9rem; margin-bottom:6px;">🏛️ ${lang === 'en' ? 'Water Mill' : 'Vodní mlýn'}</div>`;
      if (!_mlynParcelOwned) {
        h += `<div style="font-size:0.78rem; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Requires the Mill Race parcel (Cellarium → Land).' : 'Vyžaduje vlastněnou parcelu Mlýnský náhon (Cellarium → Pozemky).'}</div>`;
      } else if (_m.buildUntil) {
        const hoursLeft = Math.max(0, Math.ceil((_m.buildUntil - Date.now()) / 3600000));
        const buildingName = lang === 'en' ? Game.MILL_TIERS[_m.buildTargetTier].name_en : Game.MILL_TIERS[_m.buildTargetTier].name;
        h += `<div style="font-size:0.78rem; opacity:0.7;">⏳ ${lang === 'en' ? `Building ${buildingName}, ~${hoursLeft}h` : `Staví se ${buildingName}, ~${hoursLeft}h`}</div>`;
      } else if (_mTier >= Game.MILL_TIERS.length - 1) {
        h += `<div style="font-size:0.78rem;">✅ ${lang === 'en' ? 'Complete: The Mechanism' : 'Dokončeno: Mechanismus'}</div>`;
      } else {
        const next = Game.MILL_TIERS[_mTier + 1];
        const nextName = lang === 'en' ? next.name_en : next.name;
        const curLabel = _mTier === -1 ? (lang === 'en' ? 'not started' : 'nezahájeno') : (lang === 'en' ? Game.MILL_TIERS[_mTier].name_en : Game.MILL_TIERS[_mTier].name);
        const matsStr = Object.entries(next.materials).map(([id, qty]) => `${qty}× ${(typeof iName === 'function') ? iName(id) : id}`).join(', ');
        h += `<div style="font-size:0.78rem; opacity:0.7; margin-bottom:6px;">${lang === 'en' ? 'Current' : 'Aktuálně'}: ${curLabel} → ${nextName} (${next.cost}g, ${matsStr})</div>`;
        // Sekerník — mlynar-vlastni-mlyn-mrd.md §4.6, 16.8.2026. Tři stavy:
        // potřeba najmout / na cestě (čeká) / připravenej (buduj).
        if (next.needsSekernik && _m.millwrightReadyForTier !== (_mTier + 1)) {
          if (_m.millwrightHireUntil) {
            const sHoursLeft = Math.max(0, Math.ceil((_m.millwrightHireUntil - Date.now()) / 3600000));
            h += `<div style="font-size:0.72rem; opacity:0.6; font-style:italic;">🔨 ${lang === 'en' ? `Millwright on his way, ~${sHoursLeft}h` : `Sekerník na cestě, ~${sHoursLeft}h`}</div>`;
          } else {
            h += `<button onclick="Game.hireMillwright()" class="craft-btn" style="font-size:0.78rem;">🔨 ${lang === 'en' ? `Hire the millwright (${Game.MILLWRIGHT_COST}g)` : `Najmout sekerníka (${Game.MILLWRIGHT_COST}g)`}</button>`;
          }
        } else {
          h += `<button onclick="Game.upgradeMillTier()" class="craft-btn" style="font-size:0.78rem;">🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`;
        }
      }
      h += `</div>`;
    }

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
        { pen: 'rabbitry', icon: '🐇', tech: 'tech_cuniculi' },
        { pen: 'goatpen', icon: '🐐', tech: 'tech_caprile' },
        { pen: 'cowbyre', icon: '🐄', tech: 'tech_armentum' },
        { pen: 'pigsty', icon: '🐖', tech: 'tech_suile' },
        { pen: 'stable', icon: '🐎', tech: 'tech_stabulum' },
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
          return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang === 'en' ? 'has' : 'máš'}: ${have})</span></div>`;
        }).join('');
        dvurInner += `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
          <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">${d.icon} ${t('dvur.title_' + d.pen)}</div>
          <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${t('dvur.buildDesc_' + d.pen)}</div>
          ${built
            ? `<div style="font-size:0.78rem; color:#5a9a5a;">✅ ${lang === 'en' ? 'Built' : 'Postaveno'}</div>`
            : !hasT
              ? `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${t('dvur.lockedPrefix')} ${(typeof tName === 'function') ? tName(d.tech) : d.tech}</div>`
              : costStr + `<button onclick="FarmyardSystem.buildAnimalPen('${d.pen}')" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${can ? '' : 'disabled'}>🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`}
        </div>`;
      });

      // Kurník a Ovčín — bespoke build funkce (Game.buildHenhouse/buildSheepfold)
      const simplePens = [
        {
          key: 'henhouse', icon: '🐔', titleK: 'farmyard.gallinarium', descK: 'farmyard.hennhouseBuildDesc',
          cost: { rock: 15, stick: 10, rope: 3 }, fn: 'Game.buildHenhouse()'
        },
        {
          key: 'sheepfold', icon: '🐑', titleK: 'farmyard.ovile', descK: 'farmyard.sheepfoldBuildDesc',
          cost: { rock: 20, stick: 15, rope: 5 }, fn: 'Game.buildSheepfold()',
          tech: 'tech_de_re_rustica'
        },
        {
          key: 'columbarium', icon: '🕊️', titleK: 'farmyard.columbarium', descK: 'farmyard.columbariumBuildDesc',
          cost: { cut_stone: 60, plank: 25, log: 15, wicker: 20, rope: 10, hrebiky: 10 }, fn: 'FarmyardSystem.buildColumbarium()',
          tech: 'tech_porta'
        },
      ];
      simplePens.forEach(d => {
        const built = GameState[d.key] && GameState[d.key].built;
        const hasT = !d.tech || (GameState.researchedTechs && GameState.researchedTechs.includes(d.tech));
        const can = hasT && !built && Object.entries(d.cost).every(([id, n]) => (GameState.inventory[id] || 0) >= n);
        const costStr2 = Object.entries(d.cost).map(([id, n]) => {
          const it = ItemsDB[id];
          const have = GameState.inventory[id] || 0;
          return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang === 'en' ? 'has' : 'máš'}: ${have})</span></div>`;
        }).join('');
        dvurInner += `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
          <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">${d.icon} ${t(d.titleK)}</div>
          <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${t(d.descK)}</div>
          ${built
            ? `<div style="font-size:0.78rem; color:#5a9a5a;">✅ ${lang === 'en' ? 'Built' : 'Postaveno'}</div>`
            : !hasT
              ? `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${t('dvur.lockedPrefix')} ${(typeof tName === 'function') ? tName(d.tech) : d.tech}</div>`
              : costStr2 + `<button onclick="${d.fn}" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${can ? '' : 'disabled'}>🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`}
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
      const libHasItems = Object.entries(libCost).every(([id, n]) => (GameState.inventory[id] || 0) >= n);
      const libCan = hasStudovnaTech && !libBuilt && libHasGrose && libHasItems;
      const libCostStr = Object.entries(libCost).map(([id, n]) => {
        const it = ItemsDB[id];
        const have = GameState.inventory[id] || 0;
        return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang === 'en' ? 'has' : 'máš'}: ${have})</span></div>`;
      }).join('') + `<div style="font-size:0.72rem; ${libHasGrose ? '' : 'color:#c0392b;'}">💰 ${libGrose}g</div>`;
      let libInner = `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
        <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">📖 ${lang === 'en' ? 'Knihovna — Grade I' : 'Knihovna — Stupeň I'}</div>
        <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${lang === 'en' ? "A private study room by the library — receives the Lord's guests." : 'Studovna při knihovně — přijímá hosty Vrchnosti.'}</div>
        ${libBuilt
          ? `<div style="font-size:0.78rem; color:#5a9a5a;">✅ ${lang === 'en' ? 'Built' : 'Postaveno'}</div>`
          : !hasStudovnaTech
            ? `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${t('dvur.lockedPrefix')} ${(typeof tName === 'function') ? tName('tech_studovna') : 'Studovna'}</div>`
            : libCostStr + `<button onclick="Game.buildStorage('knihovna_grade_i')" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${libCan ? '' : 'disabled'}>🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`}
      </div>`;

      // Dormitorium — bratři (Dormitorium MRD), 3 sekvenční tiery, bez tech gate
      // (jen materiál + groše — sekvence I→II→III vynucena v Game.buildStorage).
      const dormTiers = [
        {
          id: 'dormitorium_i', icon: '📿', label: lang === 'en' ? 'Dormitorium I' : 'Dormitorium I',
          desc: lang === 'en' ? 'Cells for 3 brothers.' : 'Cely pro 3 bratry.',
          cost: { cut_stone: 30, plank: 20, rope: 8, hrebiky: 10 }, grose: 15, reqPrev: null
        },
        {
          id: 'dormitorium_ii', icon: '📿', label: lang === 'en' ? 'Dormitorium II' : 'Dormitorium II',
          desc: lang === 'en' ? 'Expanded — 6 brothers.' : 'Rozšířeno — 6 bratrů.',
          cost: { cut_stone: 90, plank: 60, rope: 25, iron_ingot: 2, glass_stopper: 6, hrebiky: 25 }, grose: 35, reqPrev: 'dormitorium_i'
        },
        {
          id: 'dormitorium_iii', icon: '📿', label: lang === 'en' ? 'Dormitorium III' : 'Dormitorium III',
          desc: lang === 'en' ? 'Full wing — 10 brothers.' : 'Celé křídlo — 10 bratrů.',
          cost: { cut_stone: 200, plank: 130, rope: 50, iron_ingot: 6, glass_stopper: 10, glass_tankard: 10, hrebiky: 50 }, grose: 70, reqPrev: 'dormitorium_ii'
        },
      ];
      let dormInner = '';
      dormTiers.forEach(d => {
        const built = storage[d.id] && storage[d.id].built;
        const prevOk = !d.reqPrev || (storage[d.reqPrev] && storage[d.reqPrev].built);
        const hasGrose = (typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) >= d.grose;
        const hasItems = Object.entries(d.cost).every(([id, n]) => (GameState.inventory[id] || 0) >= n);
        const can = prevOk && !built && hasGrose && hasItems;
        const costStr = Object.entries(d.cost).map(([id, n]) => {
          const it = ItemsDB[id];
          const have = GameState.inventory[id] || 0;
          return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang === 'en' ? 'has' : 'máš'}: ${have})</span></div>`;
        }).join('') + `<div style="font-size:0.72rem; ${hasGrose ? '' : 'color:#c0392b;'}">💰 ${d.grose}g</div>`;
        dormInner += `<div style="padding:10px; background:rgba(197,160,89,0.05); border-radius:8px; border:1px solid rgba(197,160,89,0.18);">
          <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">${d.icon} ${d.label}</div>
          <div style="font-size:0.75rem; opacity:0.7; margin-bottom:6px;">${d.desc}</div>
          ${built
            ? `<div style="font-size:0.78rem; color:#5a9a5a;">✅ ${lang === 'en' ? 'Built' : 'Postaveno'}</div>`
            : !prevOk
              ? `<div style="font-size:0.74rem; opacity:0.6;">🔒 ${lang === 'en' ? 'Requires: ' + (dormTiers.find(x => x.id === d.reqPrev) || {}).label : 'Nutné: ' + (dormTiers.find(x => x.id === d.reqPrev) || {}).label}</div>`
              : costStr + `<button onclick="Game.buildStorage('${d.id}')" class="craft-btn" style="font-size:0.78rem; margin-top:6px;" ${can ? '' : 'disabled'}>🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`}
        </div>`;
      });

      // Sekce pod sebou (full-width), karty uvnitř v responsivním gridu
      const grid = (inner) => `<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:8px; align-items:start;">${inner}</div>`;
      h += `<div style="display:flex; flex-direction:column; gap:12px;">`;
      h += section('📦', lang === 'en' ? 'Storage' : 'Sklady', grid(storInner));
      h += section('⚒️', lang === 'en' ? 'Workshops' : 'Dílny', grid(workInner));
      h += section('🐄', lang === 'en' ? 'Farmyard' : 'Dvůr', grid(dvurInner));
      h += section('🍇', lang === 'en' ? 'Winery' : 'Vinohrad', grid(wineInner));
      h += section('📖', lang === 'en' ? 'Library' : 'Knihovna', grid(libInner));
      h += section('📿', lang === 'en' ? 'Dormitorium' : 'Dormitorium', grid(dormInner));
      h += `</div>`;
    }

    h += `</div>`;
    return h;
  },

  // Studna — progresivní karta (postavit → kamenná → posvěcená) v sekci Dvůr
  _renderWellBuilding: function (lang) {
    const w = GameState.well || {};
    const lvl = w.built ? w.level : 'none';
    const hasStone = GameState.researchedTechs && GameState.researchedTechs.includes('tech_well_stone');
    const hasBlessed = GameState.researchedTechs && GameState.researchedTechs.includes('tech_well_blessed');

    const costRow = (cost) => Object.entries(cost).map(([id, n]) => {
      const it = ItemsDB[id];
      const have = GameState.inventory[id] || 0;
      return `<div style="font-size:0.72rem; ${have >= n ? '' : 'color:#c0392b;'}">${it ? it.icon : '📦'} ${(typeof iName === 'function') ? iName(id) : id} ×${n} <span style="opacity:0.6;">(${lang === 'en' ? 'has' : 'máš'}: ${have})</span></div>`;
    }).join('');
    const canAfford = (cost) => Object.entries(cost).every(([id, n]) => (GameState.inventory[id] || 0) >= n);
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