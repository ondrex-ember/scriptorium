const ActionsDB = [
    { id: 'basic',        name: 'Průzkum okolí',    name_en: 'Scour the grounds',  icon: '🖐',  desc: 'Suroviny',         desc_en: 'Raw materials',      yield: 1 },
    { id: 'nature',       name: 'Sběr bylin',       name_en: 'Gather herbs',       icon: '🌿',  desc: 'Vlákna/Semínka',   desc_en: 'Fibres / Seeds',     yield: 1 },
    { id: 'hunt',         name: 'Lov zvěře',        name_en: 'Hunt game',          icon: '🐗',  desc: 'Tuk/Kosti',        desc_en: 'Fat / Bones',        yield: 1, req: 'stone_knife' },
    { id: 'bark',         name: 'Oloupat strom',    name_en: 'Strip bark',         icon: '🗡️', desc: 'Kůra',             desc_en: 'Bark',               yield: 1, req: 'stone_knife' },
    { id: 'fishing',      name: 'Rybolov',          name_en: 'Fish',               icon: '🎣',  desc: 'Ryby',             desc_en: 'Fish',               yield: 1, req: 'fishing_rod' },
    { id: 'foraging',     name: 'Sběr potravy',     name_en: 'Forage',             icon: '🧺',  desc: 'Houby/Bobule',     desc_en: 'Mushrooms / Berries',yield: 1, req: 'basket' },
    { id: 'wetlands',     name: 'Průzkum mokřadu',  name_en: 'Search the wetlands',icon: '🐸',  desc: 'Žáby/Slimáci',    desc_en: 'Frogs / Snails',     yield: 1, req: 'stone_knife' },
    { id: 'resin_harvest',name: 'Sběr pryskyřice',  name_en: 'Harvest resin',      icon: '🌲',  desc: 'Pryskyřice/Med',   desc_en: 'Resin / Honey',      yield: 1, req: 'stone_knife' },
    { id: 'well_water',   name: 'Jít pro vodu',     name_en: 'Draw water',         icon: '🚰',  desc: 'Ze studny',        desc_en: 'From the well',      yield: 1, req: 'well_built' }
];

let audioSys = null;
const GameState = {
    inventory: { "tinderbox": 1, "rock": 2, "stick": 2, "water": 5 },
    unlockedRecipes: [],
    researchedTechs: [],
    flags: { fireplaceLit: false, candleLit: false, torchLit: false, firstVisit: true, forceDark: true },
    lastSeen: 0,
    rank: {
        secular: 'laicus', monastic: null, path: 'secular',
        monasticStart: 0, canonicalStreak: 0, priorNomination: false,
        disciplines: [], rankHistory: []
    },
    settings: { volume: 0.17, theme: 'default', autoTheme: false,
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
    hunger: { fed: true, lastMeal: Date.now(), duration: 24 * 60 * 60 * 1000 }, // 24h do hladu
    garden: [
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb' },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb' },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true },
        { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'special', locked: true }
    ],
    activeAction: null,
    selectedDuration: 0,
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
            researchCount: 0
        }
    },
    kronika: [],
    kronikaSavedLang: 'cs',
    kronikaDailyBuffer: { date: '', gains: {} },
    kronikaCraftBuffer: { date: '', crafts: {} },
    craftedItems: {},
    notifications: []  // NotificationSystem — persistentní panel zpráv
};