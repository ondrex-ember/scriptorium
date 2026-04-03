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
        desc: "Objevil všech 64 položek!",  desc_en: "Discover all 64 items!",
        icon: "🎓", category: "Discovery",
        condition: () => GameState.discoveredLore.length >= 64,
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
    }
];
