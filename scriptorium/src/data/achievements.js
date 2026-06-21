const AchievementsDB = [
    // DISCOVERY
    {
        id: "first_craft",
        name: "První Řemeslník",       name_en: "First Craftsman",
        desc: "Vyrob svůj první předmět", desc_en: "Craft thy first item",
        icon: "⚒️", category: "Discovery",
        condition: () => GameState.achievements.stats.itemsCrafted >= 1,
        reward: { research: 1 }
    },
    {
        id: "first_potion",
        name: "První Alchymista",      name_en: "First Alchemist",
        desc: "Vyrob první lektvar",   desc_en: "Brew thy first potion",
        icon: "🧪", category: "Discovery",
        condition: () => GameState.inventory['potion_heal'] > 0 || GameState.achievements.stats.itemsCrafted >= 5,
        reward: { research: 2 }
    },
    {
        id: "collector",
        name: "Sběratel",                   name_en: "Collector",
        desc: "Objevil 30 různých položek", desc_en: "Discover 30 different items",
        icon: "📚", category: "Discovery",
        condition: () => GameState.discoveredLore.length >= 30,
        reward: { research: 3 }
    },
    {
        id: "encyclopedist",
        name: "Encyklopedista",             name_en: "Encyclopaedist",
        desc: "Objevil všech 107 položek!",  desc_en: "Discover all 107 items!",
        icon: "🎓", category: "Discovery",
        condition: () => GameState.discoveredLore.length >= 107,
        reward: { research: 5 }
    },

    // MASTERY
    {
        id: "garden_master",
        name: "Mistr Zahrady",         name_en: "Garden Master",
        desc: "Skliď 100x z políček",  desc_en: "Harvest 100 times from the garden",
        icon: "🌿", category: "Mastery",
        condition: () => GameState.achievements.stats.harvests >= 100,
        reward: { research: 3 }
    },
    {
        id: "eternal_flame",
        name: "Věčný Oheň",                    name_en: "Eternal Flame",
        desc: "Udrž krb rozžehnutý 7 dní",     desc_en: "Keep the hearth burning for 7 days",
        icon: "🔥", category: "Mastery",
        condition: () => GameState.achievements.stats.daysWithFire >= 7,
        reward: { research: 2 }
    },
    {
        id: "never_hungry",
        name: "Nepřekonatelný",    name_en: "Never Famished",
        desc: "30 dní bez hladu",  desc_en: "30 days without hunger",
        icon: "🍖", category: "Mastery",
        condition: () => GameState.achievements.stats.daysWithoutHunger >= 30,
        reward: { research: 4 }
    },
    {
        id: "master_crafter",
        name: "Mistr Řemeslník",   name_en: "Master Craftsman",
        desc: "Vyrob 500 předmětů",desc_en: "Craft 500 items",
        icon: "🛠️", category: "Mastery",
        condition: () => GameState.achievements.stats.itemsCrafted >= 500,
        reward: { research: 5 }
    },

    // PROGRESSION
    {
        id: "student",
        name: "Student",                    name_en: "Student",
        desc: "Unlock první technologii",   desc_en: "Unlock thy first technology",
        icon: "📖", category: "Progression",
        condition: () => GameState.researchedTechs.length >= 1,
        reward: { research: 1 }
    },
    {
        id: "scholar",
        name: "Učenec",                 name_en: "Scholar",
        desc: "Unlock 5 technologií",   desc_en: "Unlock 5 technologies",
        icon: "🎓", category: "Progression",
        condition: () => GameState.researchedTechs.length >= 5,
        reward: { research: 2 }
    },
    {
        id: "master",
        name: "Mistr",                          name_en: "Master",
        desc: "Unlock všech 21 technologií!",   desc_en: "Unlock all 21 technologies!",
        icon: "👑", category: "Progression",
        condition: () => GameState.researchedTechs.length >= 21,
        reward: { research: 10 }
    },
    {
        id: "czech_scholar",
        name: "Český Učenec",                       name_en: "Bohemian Scholar",
        desc: "Unlock české klášterní tradice",     desc_en: "Unlock Bohemian monastic traditions",
        icon: "🏰", category: "Progression",
        condition: () => GameState.researchedTechs.includes('tech_monastery_wisdom'),
        reward: { research: 3 }
    },
    {
        id: "grand_master",
        name: "Velmistr",                           name_en: "Grand Master",
        desc: "Unlock všechny TIER 5 technologie",  desc_en: "Unlock all Tier 5 technologies",
        icon: "⭐", category: "Progression",
        condition: () => GameState.researchedTechs.includes('tech_master_alchemist') &&
                         GameState.researchedTechs.includes('tech_illumination') &&
                         GameState.researchedTechs.includes('tech_astrology') &&
                         GameState.researchedTechs.includes('tech_czech_glass'),
        reward: { research: 15 }
    },
    {
        id: "researcher",
        name: "Badatel",                        name_en: "Researcher",
        desc: "Získej 50 research zápisků",     desc_en: "Accumulate 50 research notes",
        icon: "📜", category: "Progression",
        condition: () => GameState.achievements.stats.researchCount >= 50,
        reward: { research: 3 }
    },

    // DEDICATION
    {
        id: "persistent",
        name: "Vytrvalý",      name_en: "Persistent",
        desc: "3 dny streak",  desc_en: "3 day streak",
        icon: "🔥", category: "Dedication",
        condition: () => GameState.dailyRewards.streak >= 3,
        reward: { research: 2 }
    },
    {
        id: "devoted",
        name: "Oddaný",        name_en: "Devoted",
        desc: "7 dní streak",  desc_en: "7 day streak",
        icon: "⭐", category: "Dedication",
        condition: () => GameState.dailyRewards.streak >= 7,
        reward: { research: 3 }
    },
    {
        id: "legend",
        name: "Legenda",        name_en: "Legend",
        desc: "30 dní streak!", desc_en: "30 day streak!",
        icon: "💎", category: "Dedication",
        condition: () => GameState.dailyRewards.streak >= 30,
        reward: { research: 10 }
    },
    {
        id: "veteran",
        name: "Veterán",                    name_en: "Veteran",
        desc: "100 přihlášení celkem",      desc_en: "100 total logins",
        icon: "🏆", category: "Dedication",
        condition: () => GameState.dailyRewards.totalLogins >= 100,
        reward: { research: 5 }
    },

    // VINOHRAD
    {
        id: "first_grapes",
        name: "První réva",         name_en: "First Vines",
        desc: "Sklízej svůj první hrozen",  desc_en: "Harvest thy first grape",
        icon: "🍇", category: "Vinohrad",
        condition: () => GameState.discoveredLore.some(id => ['grapes_belina','grapes_klevner','grapes_frankovka','grapes_tramin','grapes_modry_janek','grapes_baco'].includes(id)),
        reward: { research: 2 }
    },
    {
        id: "first_press",
        name: "Mošt teče",          name_en: "First Press",
        desc: "Vylisuj první mošt nebo Pryk", desc_en: "Press thy first must or Pryk",
        icon: "🍶", category: "Vinohrad",
        condition: () => GameState.discoveredLore.includes('mustum') || GameState.discoveredLore.includes('pryk'),
        reward: { research: 2 }
    },
    {
        id: "vinum_praeclarum",
        name: "Vinum Praeclarum",   name_en: "The Bishop's Wine",
        desc: "Uvař první Vinum Praeclarum pro biskupský stůl", desc_en: "Brew thy first Vinum Praeclarum for the bishop's table",
        icon: "🏺", category: "Vinohrad",
        condition: () => GameState.discoveredLore.includes('vinum_praeclarum'),
        reward: { research: 5 }
    },
    {
        id: "five_wines",
        name: "Pět odstínů révy",   name_en: "Five Shades of the Vine",
        desc: "Vyrob všech pět druhů vína", desc_en: "Produce all five kinds of wine",
        icon: "🍷", category: "Vinohrad",
        condition: () => ['vinum','vinum_rubrum','vinum_praeclarum','vinum_obscurum','vinum_baci'].every(id => GameState.discoveredLore.includes(id)),
        reward: { research: 6 }
    },

    // POLE
    {
        id: "first_field_harvest",
        name: "Žeň",                name_en: "The Harvest",
        desc: "Sklízej první úrodu z Pole", desc_en: "Reap thy first harvest from the Field",
        icon: "🌾", category: "Pole",
        condition: () => GameState.discoveredLore.some(id => ['rye_grain','wheat_grain','barley','oats','millet','peas','flax_fiber'].includes(id)),
        reward: { research: 2 }
    },
    {
        id: "three_field_farmer",
        name: "Trojpolní hospodář",  name_en: "Three-Field Farmer",
        desc: "Odemkni trojpolní systém hospodaření", desc_en: "Unlock the three-field crop rotation system",
        icon: "🟫", category: "Pole",
        condition: () => GameState.researchedTechs.includes('tech_crop_rotation'),
        reward: { research: 3 }
    },
    {
        id: "seven_crops",
        name: "Všech sedm",         name_en: "All Seven",
        desc: "Sklízej všech sedm plodin Pole aspoň jednou", desc_en: "Harvest all seven Field crops at least once",
        icon: "🌿", category: "Pole",
        condition: () => ['rye_grain','wheat_grain','barley','oats','millet','peas','flax_fiber'].every(id => GameState.discoveredLore.includes(id)),
        reward: { research: 5 }
    },

    // DVŮR
    {
        id: "first_lamb",
        name: "První jehně",        name_en: "First Lamb",
        desc: "Tvé stádo přivedlo na svět první jehně", desc_en: "Thy flock has brought forth its first lamb",
        icon: "🐑", category: "Dvůr",
        condition: () => (GameState.achievements.stats.lambsBorn || 0) >= 1,
        reward: { research: 2 }
    },
    {
        id: "first_chick",
        name: "První kuře",         name_en: "First Chick",
        desc: "Z kurníku se vylíhlo první kuře", desc_en: "The first chick has hatched in the henhouse",
        icon: "🐣", category: "Dvůr",
        condition: () => (GameState.achievements.stats.chicksHatched || 0) >= 1,
        reward: { research: 2 }
    },
    {
        id: "shepherd",
        name: "Pastýř",             name_en: "Shepherd",
        desc: "Tvé stádo dosáhlo pěti ovcí", desc_en: "Thy flock has reached five sheep",
        icon: "🐏", category: "Dvůr",
        condition: () => GameState.sheepfold && GameState.sheepfold.sheep >= 5,
        reward: { research: 3 }
    },

    // ATHANOR
    {
        id: "great_key",
        name: "Velký klíč",         name_en: "The Great Key",
        desc: "Odemkni přístup do Athanoru skrze nalezenou šifru", desc_en: "Unlock access to the Athanor through the discovered cipher",
        icon: "🔑", category: "Athanor",
        condition: () => GameState.secrets && GameState.secrets.laboratoryUnlocked === true,
        reward: { research: 5 }
    },
    {
        id: "first_transmutation",
        name: "První transmutace",  name_en: "First Transmutation",
        desc: "Odhal svou první kombinaci v Athanoru", desc_en: "Discover thy first combination in the Athanor",
        icon: "⚗️", category: "Athanor",
        condition: () => GameState.athanor && GameState.athanor.discovered && GameState.athanor.discovered.length >= 1,
        reward: { research: 3 }
    },
    {
        id: "athanor_master",
        name: "Mistr Athanoru",     name_en: "Master of the Athanor",
        desc: "Odhal všechny kombinace v Athanoru", desc_en: "Discover every combination in the Athanor",
        icon: "📖", category: "Athanor",
        condition: () => GameState.athanor && GameState.athanor.discovered && typeof AthanorDB !== 'undefined' && GameState.athanor.discovered.length >= Object.keys(AthanorDB.combinations).length,
        reward: { research: 10 }
    },

    // SCRINIUM
    {
        id: "secret_writings",
        name: "Tajné spisy",        name_en: "Secret Writings",
        desc: "Nalezni všechna folia z Tajných spisů", desc_en: "Find all folios of the Secret Writings",
        icon: "📜", category: "Scrinium",
        condition: () => {
            if (!GameState.scrinium || !GameState.scrinium.folios) return false;
            const ids = ['folio_epistola','folio_fausto','folio_palimpsest','folio_titivillus'];
            return ids.every(id => GameState.scrinium.folios[id] && GameState.scrinium.folios[id].found);
        },
        reward: { research: 5 }
    },
    {
        id: "arcanum_reader",
        name: "Do hlubin Arcana",    name_en: "Into the Arcanum",
        desc: "Rozluštěn první folio až na vrstvu Arcanum", desc_en: "Decipher thy first folio down to its Arcanum layer",
        icon: "🔐", category: "Scrinium",
        condition: () => {
            if (!GameState.scrinium || !GameState.scrinium.folios) return false;
            return Object.values(GameState.scrinium.folios).some(f => f.layer === 3);
        },
        reward: { research: 4 }
    },

    // CELLARIUM
    {
        id: "first_trade",
        name: "První obchod",       name_en: "First Trade",
        desc: "Uzavři svůj první obchod v Cellariu", desc_en: "Complete thy first trade in the Cellarium",
        icon: "🏛️", category: "Cellarium",
        condition: () => GameState.economy && GameState.economy.tradesTotal >= 1,
        reward: { research: 2 }
    },
    {
        id: "merchant",
        name: "Kupec",              name_en: "Merchant",
        desc: "Dokonči 100 obchodů v Cellariu", desc_en: "Complete 100 trades in the Cellarium",
        icon: "💰", category: "Cellarium",
        condition: () => GameState.economy && GameState.economy.tradesTotal >= 100,
        reward: { research: 5 }
    }
];