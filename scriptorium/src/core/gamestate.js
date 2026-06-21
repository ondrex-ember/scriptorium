const ActionsDB = [
    { id: 'basic',        cat: 'scavenge', name: 'Průzkum okolí',    name_en: 'Scour the grounds',  icon: '🖐',  desc: 'Suroviny',         desc_en: 'Raw materials',      yield: 1 },
    { id: 'nature',       cat: 'scavenge', name: 'Sběr bylin',       name_en: 'Gather herbs',       icon: '🌿',  desc: 'Vlákna/Semínka',   desc_en: 'Fibres / Seeds',     yield: 1 },
    { id: 'hunt',         cat: 'scavenge', name: 'Lov zvěře',        name_en: 'Hunt game',          icon: '🐗',  desc: 'Tuk/Kosti',        desc_en: 'Fat / Bones',        yield: 1, req: 'stone_knife' },
    { id: 'bark',         cat: 'scavenge', name: 'Oloupat strom',    name_en: 'Strip bark',         icon: '🗡️', desc: 'Kůra',             desc_en: 'Bark',               yield: 1, req: 'stone_knife' },
    { id: 'fishing',      cat: 'scavenge', name: 'Rybolov',          name_en: 'Fish',               icon: '🎣',  desc: 'Ryby',             desc_en: 'Fish',               yield: 1, req: 'fishing_rod' },
    { id: 'foraging',     cat: 'scavenge', name: 'Sběr potravy',     name_en: 'Forage',             icon: '🧺',  desc: 'Houby/Bobule',     desc_en: 'Mushrooms / Berries',yield: 1, req: 'basket' },
    { id: 'wetlands',     cat: 'scavenge', name: 'Průzkum mokřadu',  name_en: 'Search the wetlands',icon: '🐸',  desc: 'Žáby/Slimáci',    desc_en: 'Frogs / Snails',     yield: 1, req: 'stone_knife' },
    { id: 'resin_harvest',cat: 'scavenge', name: 'Sběr pryskyřice',  name_en: 'Harvest resin',      icon: '🌲',  desc: 'Pryskyřice/Med',   desc_en: 'Resin / Honey',      yield: 1, req: 'stone_knife' },
    { id: 'well_water',   cat: 'scavenge', name: 'Jít pro vodu',        name_en: 'Draw water',          icon: '🚰',  desc: 'Ze studny',           desc_en: 'From the well',       yield: 1 },
    { id: 'grass_gather', cat: 'scavenge', name: 'Posečení trávy',      name_en: 'Mow grass',           icon: '🌿',  desc: 'Tráva na seno',       desc_en: 'Grass for hay',       yield: 1, req: [{item:'stone_scythe', mult:0.7}, {item:'iron_scythe', mult:1.2}] },
    { id: 'wood_harvest', cat: 'scavenge', name: 'Těžba dřeva',         name_en: 'Harvest wood',        icon: '🪓',  desc: 'Kulatina/Větve',      desc_en: 'Logs / Branches',     yield: 1, req: [{item:'stone_axe', mult:0.7}, {item:'iron_axe', mult:1.2}] },
    { id: 'worms_dig',    cat: 'scavenge', name: 'Kopání červů',        name_en: 'Dig for worms',       icon: '🪱',  desc: 'Krmivo pro kapry',    desc_en: 'Feed for carp',       yield: 1, req: [{item:'stone_spade', mult:0.7}, {item:'iron_spade', mult:1.2}] },
    { id: 'dig_clay',     cat: 'scavenge', name: 'Kopání hlíny',        name_en: 'Dig for clay',        icon: '🟤',  desc: 'Jílovitá hlína',      desc_en: 'Clay from the bank',  yield: 1, req: [{item:'stone_spade', mult:0.7}, {item:'iron_spade', mult:1.2}] },
    { id: 'yard_cleanup', cat: 'scavenge', name: 'Uklidit hospodářství',name_en: 'Clean the farmyard',  icon: '🧹',  desc: 'Zbytky + bonusy',     desc_en: 'Scraps + bonuses',    yield: 1 },
    // ── MINE ──────────────────────────────────────────────────────────────────
    { id: 'quarry_stone', cat: 'mine', collectMode: true,
      name: 'Lámání kamene', name_en: 'Quarry Stone',
      icon: '🪨', desc: 'Kámen + vzácně: tesaný kámen', desc_en: 'Stone + rare: cut stone',
      yield: 1, req: [{item:'stone_pickaxe', mult:0.7}, {item:'iron_pickaxe', mult:1.2}] },
    { id: 'mine_iron_ore', cat: 'mine', collectMode: true,
      name: 'Těžba rudy', name_en: 'Mine Iron Ore',
      icon: '⛏️', desc: 'Železná ruda + vzácně: dřevěné uhlí', desc_en: 'Iron ore + rare: charcoal',
      yield: 1, req: [{item:'stone_pickaxe', mult:0.7}, {item:'iron_pickaxe', mult:1.2}] },
];

let audioSys = null;
const GameState = {
    inventory: { "tinderbox": 1, "rock": 2, "stick": 2, "water": 5, "research": 6, "bread": 4, "fish": 3, "berry_pie": 2 },
    unlockedRecipes: [],
    researchedTechs: [],
    flags: { fireplaceLit: false, candleLit: false, torchLit: false, firstVisit: true, forceDark: true },
    lastSeen: 0,
    rank: {
        secular: 'laicus', monastic: null, path: 'secular',
        monasticStart: 0, canonicalStreak: 0, priorNomination: false,
        disciplines: [], rankHistory: []
    },
    settings: { volume: 0.17, musicEnabled: false, theme: 'default', autoTheme: false,
    // NEW: Hour chime
    hourChimeBasic: true,
    hourChimeMode: 'auto',
    hourChimeSound: 'avemaria',
    
    // NEW: Quiet hours
    quietHoursEnabled: false,
    quietHoursStart: 22,
    quietHoursEnd: 6
     },
    candleStart: 0,
    // hunger odstraněn — nahrazen VigorSystem (GameState.satiety + GameState.fatigue)
    garden: [
        // Fáze 1: 4x herb (2 odemčené, 2 za tech_garden_expand)
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb' },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb' },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb', locked: true },
        // Fáze 2: 4x vegetable + 2x special (za tech_horticulture)
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'special', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'special', locked: true },
        // Fáze 3: 4x vegetable navíc (za tech_advanced_farming)
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
    ],
    activeAction: null,
    selectedDuration: 0,
    terrain: { fatigue: 0, lastRegen: 0, lastToastTier: 0 }, // TerrainSystem — únava krajiny
    researchHour: { count: 0, hourStart: 0 }, // Research diminishing returns
    shopStock: { date: '', used: {} },          // Denní sklady entit (reset o půlnoci)
    discoveredLore: [], // Track discovered lore entries
    dailyRewards: {
        lastLogin: 0,
        streak: 0,
        lastBonusClaimed: 0,
        totalLogins: 0
    },
    achievements: {
        unlocked: [],
        stats: {
            itemsCrafted: 0,
            itemsDiscovered: 0,
            harvests: 0,
            daysWithFire: 0,
            daysWithoutHunger: 0,
            researchCount: 0,
            lambsBorn: 0,
            chicksHatched: 0
        }
    },
    kronika: [],
    kronikaSavedLang: 'cs',
    kronikaDailyBuffer: { date: '', gains: {} },
    kronikaCraftBuffer: { date: '', crafts: {} },
    craftedItems: {},
    notifications: [],  // NotificationSystem — persistentní panel zpráv
    toolUses: {},       // Zbývající použití nástrojů { itemId: remainingUses }
    persona: {
        nameGiven: '',
        nameReligious: '',
        portrait: null,
        bornYear: 0,
        bornMonth: 0,
        bornDay: 0,
        bornPlace: '',
        origin: null,           // 'merchant_son' | 'noble_scribe' | 'village_boy'
        originChosen: false,    // true po výběru původu
        originModalShown: false,// true po zobrazení modalu
        milestones: [],         // [{id, timestamp, descCs, descEn}]
        influence: {
            benedikt: 0,
            giacomo:  0,
            abbot:    0,
        },
        professions: [],        // odemčené profese
    },
    cat: {
        name: 'Bezejmenný myšilov',
        satiety: 50,        // 0–100, klesá v čase
        affection: 20,      // 0–100, roste krmením/hlazením
        caught: 0,          // myší chyceno celkem
        stolen: [],         // [{item, ts}] síň hanby — ukradené potraviny
        bornAt: 0,          // timestamp prvního setkání (init při tech_cura_felium)
        lastPet: 0,         // timestamp posledního pohlazení (Vigor bonus 1×/den)
        lastTick: 0,        // timestamp posledního denního ticku
        warmth: 50,         // 0–100, tepelný komfort (roste u ohně, klesá venku)
        location: 'garden', // 'garden' | 'fire' — kde kočka právě je
    },
    mice: { count: 3, lastTick: 0 }   // klášterní myší populace
};