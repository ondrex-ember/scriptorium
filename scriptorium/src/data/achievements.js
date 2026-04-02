const AchievementsDB = [
    // DISCOVERY CATEGORY
    {
        id: "first_craft",
        name: "První Řemeslník",
        desc: "Vyrob svůj první předmět",
        icon: "⚒️",
        category: "Discovery",
        condition: () => GameState.achievements.stats.itemsCrafted >= 1,
        reward: { research: 1 }
    },
    {
        id: "first_potion",
        name: "První Alchymista",
        desc: "Vyrob první lektvar",
        icon: "🧪",
        category: "Discovery",
        condition: () => GameState.inventory['potion_heal'] > 0 || GameState.achievements.stats.itemsCrafted >= 5,
        reward: { research: 2 }
    },
    {
        id: "collector",
        name: "Sběratel",
        desc: "Objevil 30 různých položek",
        icon: "📚",
        category: "Discovery",
        condition: () => GameState.discoveredLore.length >= 30,
        reward: { research: 3 }
    },
    {
        id: "encyclopedist",
        name: "Encyklopedista",
        desc: "Objevil všech 64 položek!",
        icon: "🎓",
        category: "Discovery",
        condition: () => GameState.discoveredLore.length >= 64,
        reward: { research: 5 }
    },
    
    // MASTERY CATEGORY
    {
        id: "garden_master",
        name: "Mistr Zahrady",
        desc: "Skliď 100x z políček",
        icon: "🌿",
        category: "Mastery",
        condition: () => GameState.achievements.stats.harvests >= 100,
        reward: { research: 3 }
    },
    {
        id: "eternal_flame",
        name: "Věčný Oheň",
        desc: "Udrž krb rozžehnutý 7 dní",
        icon: "🔥",
        category: "Mastery",
        condition: () => GameState.achievements.stats.daysWithFire >= 7,
        reward: { research: 2 }
    },
    {
        id: "never_hungry",
        name: "Nepřekonatelný",
        desc: "30 dní bez hladu",
        icon: "🍖",
        category: "Mastery",
        condition: () => GameState.achievements.stats.daysWithoutHunger >= 30,
        reward: { research: 4 }
    },
    {
        id: "master_crafter",
        name: "Mistr Řemeslník",
        desc: "Vyrob 500 předmětů",
        icon: "🛠️",
        category: "Mastery",
        condition: () => GameState.achievements.stats.itemsCrafted >= 500,
        reward: { research: 5 }
    },
    
    // PROGRESSION CATEGORY
    {
        id: "student",
        name: "Student",
        desc: "Unlock první technologii",
        icon: "📖",
        category: "Progression",
        condition: () => GameState.researchedTechs.length >= 1,
        reward: { research: 1 }
    },
    {
        id: "scholar",
        name: "Učenec",
        desc: "Unlock 5 technologií",
        icon: "🎓",
        category: "Progression",
        condition: () => GameState.researchedTechs.length >= 5,
        reward: { research: 2 }
    },
    {
        id: "master",
        name: "Mistr",
        desc: "Unlock všech 21 technologií!",
        icon: "👑",
        category: "Progression",
        condition: () => GameState.researchedTechs.length >= 21,
        reward: { research: 10 }
    },
    {
        id: "czech_scholar",
        name: "Český Učenec",
        desc: "Unlock české klášterní tradice",
        icon: "🏰",
        category: "Progression",
        condition: () => GameState.researchedTechs.includes('tech_monastery_wisdom'),
        reward: { research: 3 }
    },
    {
        id: "grand_master",
        name: "Velmistr",
        desc: "Unlock všechny TIER 5 technologie",
        icon: "⭐",
        category: "Progression",
        condition: () => GameState.researchedTechs.includes('tech_master_alchemist') && 
                         GameState.researchedTechs.includes('tech_illumination') && 
                         GameState.researchedTechs.includes('tech_astrology') && 
                         GameState.researchedTechs.includes('tech_czech_glass'),
        reward: { research: 15 }
    },
    {
        id: "researcher",
        name: "Badatel",
        desc: "Získej 50 research zápisků",
        icon: "📜",
        category: "Progression",
        condition: () => GameState.achievements.stats.researchCount >= 50,
        reward: { research: 3 }
    },
    
    // DEDICATION CATEGORY
    {
        id: "persistent",
        name: "Vytrvalý",
        desc: "3 dny streak",
        icon: "🔥",
        category: "Dedication",
        condition: () => GameState.dailyRewards.streak >= 3,
        reward: { research: 2 }
    },
    {
        id: "devoted",
        name: "Oddaný",
        desc: "7 dní streak",
        icon: "⭐",
        category: "Dedication",
        condition: () => GameState.dailyRewards.streak >= 7,
        reward: { research: 3 }
    },
    {
        id: "legend",
        name: "Legenda",
        desc: "30 dní streak!",
        icon: "💎",
        category: "Dedication",
        condition: () => GameState.dailyRewards.streak >= 30,
        reward: { research: 10 }
    },
    {
        id: "veteran",
        name: "Veterán",
        desc: "100 přihlášení celkem",
        icon: "🏆",
        category: "Dedication",
        condition: () => GameState.dailyRewards.totalLogins >= 100,
        reward: { research: 5 }
    }
];

