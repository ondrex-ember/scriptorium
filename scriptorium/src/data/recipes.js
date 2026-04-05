const RecipesDB = [
    // BASIC TOOLS
    { id: "sharp_stone", output: "sharp_stone", qty: 1, req: { "rock": 2 }, cat: "tool" },
    { id: "rope", output: "rope", qty: 1, req: { "fiber": 3 }, cat: "mat" },
    { id: "stone_knife", output: "stone_knife", qty: 1, req: { "sharp_stone": 1, "stick": 1, "rope": 1 }, cat: "tool" },
    { id: "charcoal", output: "charcoal", qty: 2, req: { "stick": 2 }, cat: "mat" },
    { id: "pestle", output: "pestle", qty: 1, req: { "rock": 2, "sharp_stone": 1 }, cat: "tool" },
    { id: "flint", output: "flint", qty: 1, req: { "rock": 2 }, cat: "tool" },
    { id: "primitive_torch", output: "primitive_torch", qty: 1, req: { "stick": 1, "fat": 1 }, cat: "tool", blind: true },
    { id: "tinderbox", output: "tinderbox", qty: 1, req: { "bark": 1, "fiber": 1 }, cat: "tool", blind: true },
    { id: "hoe", output: "hoe", qty: 1, req: { "sharp_stone": 1, "stick": 2, "rope": 1 }, cat: "tool" },
    { id: "bonemeal", output: "bonemeal", qty: 3, req: { "bone": 1, "pestle": 0 }, cat: "mat" },
    
    // LORE SYSTEM
    { id: "pulp", output: "pulp", qty: 1, req: { "bark": 2, "water": 1, "pestle": 0 }, cat: "lore" },
    { id: "paper", output: "paper", qty: 1, req: { "pulp": 2 }, cat: "lore" },
    { id: "ink", output: "ink", qty: 1, req: { "charcoal": 1, "water": 1, "pestle": 0 }, cat: "lore" },
    { id: "research", output: "research", qty: 1, req: { "paper": 1, "ink": 1 }, cat: "lore" },
    
    // COOKING TOOLS
    { id: "fishing_rod", output: "fishing_rod", qty: 1, req: { "stick": 2, "rope": 1, "bone": 1 }, cat: "tool", locked: true },
    { id: "cooking_pot", output: "cooking_pot", qty: 1, req: { "rock": 3, "water": 1 }, cat: "tool", locked: true },
    { id: "basket", output: "basket", qty: 1, req: { "fiber": 5, "stick": 2 }, cat: "tool", locked: true },
    
    // NEW RECIPES - Mini-games & Notebooks
    { id: "playing_cards", output: "playing_cards", qty: 1, req: { "paper": 5, "ink": 1 }, cat: "tool", locked: true },
	{
	  id: "recipe_iching_book",
	  output: "iching_book",
	  qty: 1,
	  req: {
		paper: 32,  // 2x 64 hexagramů (polovina každého listu)
		ink: 15,
		herb_blue: 3,  // Levandule pro koncentraci
		herb_yellow: 3, // Heřmánek pro moudrost
		charcoal: 5
	  },
	  cat: "lore",
	  locked: true,
	  desc: "Kniha šedesáti čtyř proměn. Odhaluje skrytý řád vesmíru."
	},
	
	// PŘIDAT na konec pole RecipesDB (před poslední ]):
	{
		id: "bucket",
		output: "bucket",
		qty: 1,
		req: { stick: 3, rope: 2, rock: 2 },
		cat: "tool",
		locked: true, // Unlock: tech_water_bucket
		desc: "Větší nádoba - přináší více vody ze studny.", desc_en: "Larger vessel - draws more water from the well."
	},

	{
		id: "repair_kit",
		output: "repair_kit",
		qty: 1,
		req: { stick: 5, rope: 2, rock: 3 },
		cat: "tool",
		locked: true, // Unlock: tech_well_maintenance
		desc: "Sada na opravu studny.", desc_en: "Kit for well repairs."
	},

	{
		id: "purification_powder",
		output: "purification_powder",
		qty: 1,
		req: { ash: 2, charcoal: 1, herb_blue: 1, pestle: 0 },
		cat: "alchemy",
		locked: true, // Unlock: tech_well_maintenance
		desc: "Vyčistí znečištěnou studnu.", desc_en: "Purifies a contaminated well."
	},
	{
    id: "rithmomachia_board",
    output: "rithmomachia_board",
    qty: 1,
    req: { 
        paper: 64,          // 8×8 board
        ink: 20,            // čísla
        preservation_oil: 3,
        bone: 24,           // bílé kameny
        charcoal: 24        // černé kameny
    },
    cat: "tool",
    locked: true,
    desc: "Hra filozofů - Pythagorejská matematika v bitvě.", desc_en: "The Philosophers' Game - Pythagorean mathematics in battle."
	},
	{
    id: "primero_deck",
    output: "primero_deck",
    qty: 1,
    req: { paper: 40, ink: 10, preservation_oil: 2 },
    cat: "tool",
    locked: true,
    desc: "Španělský balíček pro Primero.", desc_en: "Spanish deck for Primero."
	},

	{
		id: "karnoffel_deck",
		output: "karnoffel_deck",
		qty: 1,
		req: { paper: 48, ink: 12, charcoal: 5 },
		cat: "tool",
		locked: true,
		desc: "Německý trumfový balíček.", desc_en: "German trump deck."
	},

	{
		id: "french_deck",
		output: "french_deck",
		qty: 1,
		req: { paper: 52, ink: 15, preservation_oil: 3, herb_blue: 2 },
		cat: "tool",
		locked: true,
		desc: "Francouzský balíček 52 karet.", desc_en: "French deck of 52 cards."
	},
	
	{
    id: "ur_board",
    output: "ur_board",
    qty: 1,
    req: { 
        paper: 20,      // herní plán
        ink: 5,         // políčka
        resin: 2,       // lakování desky
        bone: 7,        // kostěné žetony
        rock: 4         // 4 pyramidové kostky
    },
    cat: "tool",
    locked: true,
    desc: "Nejstarší desková hra světa - 2600 př.n.l.", desc_en: "The world's oldest board game - 2600 BC."
	},
    
    // NOTEBOOKS (5 types - progressive)
    { id: "tabula", output: "tabula", qty: 1, req: { "stick": 2, "fat": 1, "charcoal": 1 }, cat: "tool", locked: true },
    { id: "adversaria", output: "adversaria", qty: 1, req: { "paper": 5, "ink": 2, "rope": 1 }, cat: "tool", locked: true },
    { id: "vademecum", output: "vademecum", qty: 1, req: { "leather": 1, "paper": 10, "ink": 3 }, cat: "tool", locked: true },
    { id: "florilegium", output: "florilegium", qty: 1, req: { "leather": 2, "paper": 15, "ink": 5, "herb_yellow": 3 }, cat: "tool", locked: true },
    { id: "enchiridion", output: "enchiridion", qty: 1, req: { "leather": 3, "paper": 20, "ink": 8, "preservation_oil": 1 }, cat: "tool", locked: true },
    
    // COOKING RECIPES (vyžadují krb + pot)
    { id: "cooked_meat", output: "cooked_meat", qty: 1, req: { "meat": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "cooked_fish", output: "cooked_fish", qty: 1, req: { "fish": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "stew", output: "stew", qty: 1, req: { "meat": 1, "carrot": 1, "potato": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "mushroom_soup", output: "mushroom_soup", qty: 1, req: { "mushroom": 2, "onion": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "bread", output: "bread", qty: 2, req: { "fiber": 3, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "berry_pie", output: "berry_pie", qty: 1, req: { "berries": 3, "honey": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    
    // ALCHEMY - základní
    { id: "candle", output: "candle", qty: 1, req: { "fat": 1, "rope": 1 }, cat: "tool", locked: true }, 
    { id: "potion_heal", output: "potion_heal", qty: 1, req: { "herb_red": 1, "fat": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "ash", output: "ash", qty: 2, req: { "charcoal": 1 }, cat: "alchemy_ing", locked: true },
    { id: "compost", output: "compost", qty: 2, req: { "fiber": 3, "bone": 1, "water": 1 }, cat: "mat", locked: true },
    
    // ALCHEMY - pokročilá
    { id: "antidote", output: "antidote", qty: 1, req: { "nightshade": 1, "honey": 1, "ash": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "stamina_tonic", output: "stamina_tonic", qty: 1, req: { "herb_yellow": 1, "honey": 1, "roots": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "preservation_oil", output: "preservation_oil", qty: 1, req: { "resin": 2, "ash": 1, "herb_blue": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "sleep_potion", output: "sleep_potion", qty: 1, req: { "herb_blue": 2, "mushroom_poison": 1, "honey": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    
    // ========== v7.5 NEW RECIPES - Historical Realities ==========
    
    // VELLUM CHAIN (Pergamen výroba - historicky přesná)
    { id: "ash_water", output: "ash_water", qty: 1, req: { "ash": 2, "water": 3 }, cat: "mat", desc: "Louh na namáčení kůže. Historicky 3-4 dny.", desc_en: "Lye for soaking hides. Historically 3-4 days." },
    { id: "soaked_hide", output: "soaked_hide", qty: 1, req: { "hide": 1, "ash_water": 1 }, cat: "mat", locked: true, desc: "Kůže loužená 3 dny.", desc_en: "Hide soaked for 3 days." },
    { id: "stretched_hide", output: "stretched_hide", qty: 1, req: { "soaked_hide": 1, "rope": 2 }, cat: "mat", locked: true, desc: "Napnuto v rámu.", desc_en: "Stretched on a frame." },
    { id: "pumice", output: "pumice", qty: 1, req: { "rock": 3 }, cat: "mat", locked: true, desc: "Sopečný kámen - leští.", desc_en: "Volcanic stone - for smoothing." },
    { id: "vellum", output: "vellum", qty: 1, req: { "stretched_hide": 1, "pumice": 0, "chalk": 1 }, cat: "lore", locked: true, desc: "Konečný pergamen. 1 kodex = kůže 3 ovcí.", desc_en: "Finished parchment. 1 codex = 3 sheep hides." },
    
    // QUILL (Husí brko)
    { id: "quill", output: "quill", qty: 1, req: { "feather": 1, "stone_knife": 0 }, cat: "tool", locked: true, desc: "Řez pod úhlem. 10x použití.", desc_en: "Cut at an angle. 10 uses." },
    
    // GALLIC INK (Železitoduběnkový inkoust - 15. století standard)
    { id: "iron_sulfate", output: "iron_sulfate", qty: 1, req: { "rock": 2, "ash": 1, "water": 1 }, cat: "alchemy_ing", locked: true, desc: "Vitriol. Chemická reakce.", desc_en: "Vitriol. Chemical reaction." },
    { id: "gum_arabic", output: "gum_arabic", qty: 1, req: { "resin": 2, "water": 1 }, cat: "alchemy_ing", locked: true, desc: "Pojidlo z akácie.", desc_en: "Binder from acacia." },
    { id: "ink_gallic", output: "ink_gallic", qty: 2, req: { "gall_nut": 2, "iron_sulfate": 1, "gum_arabic": 1, "pestle": 0 }, cat: "lore", locked: true, desc: "Permanentní. Po 80 letech černá→hnědá.", desc_en: "Permanent. After 80 years black→brown." },
    
    // ADVANCED CODEX TYPES
    { id: "common_codex", output: "common_codex", qty: 1, req: { "paper": 10, "ink": 3 }, cat: "lore", locked: true, desc: "Běžný tisk. 'Nižší typografie' (Voit).", desc_en: "Common print. 'Lower typography' (Voit)." },
    { id: "luxury_codex", output: "luxury_codex", qty: 1, req: { "paper": 20, "ink_gallic": 5, "preservation_oil": 1 }, cat: "lore", locked: true, desc: "'Vyšší typografie' s kvalitním inkoustem.", desc_en: "'Higher typography' with quality ink." },
    { id: "vellum_codex", output: "vellum_codex", qty: 1, req: { "vellum": 3, "ink_gallic": 8, "preservation_oil": 2 }, cat: "lore", locked: true, desc: "Pergamenový. Jak Olomoucký misál (1488) - pouze 20 z 420 výtisků.", desc_en: "On vellum. Like the Olomouc Missal (1488) - only 20 of 420 copies." },
    
    // PRINTING PRESS SYSTEM
    { id: "lead_alloy", output: "lead_alloy", qty: 1, req: { "rock": 5, "charcoal": 3, "water": 1 }, cat: "mat", locked: true, desc: "Tavení kamene na olovo.", desc_en: "Smelting stone into lead." },
    { id: "printing_type", output: "printing_type", qty: 100, req: { "lead_alloy": 5, "pestle": 0 }, cat: "tool", locked: true, desc: "100 použití. Pak worn_type. Historicky se prodávaly za kovový odpad.", desc_en: "100 uses. Then worn_type. Historically sold as scrap metal." },
    
    // CANONICAL HOURS UNLOCK
    { id: "book_of_hours", output: "book_of_hours", qty: 1, req: { "luxury_codex": 1, "herb_blue": 5, "herb_yellow": 5 }, cat: "lore", locked: true, desc: "Horologium. Odemkne 8 denních buffů dle benediktinského řádu.", desc_en: "Horologium. Unlocks 8 daily buffs according to Benedictine order." },
    
    // PRIVILEGIUM QUESTLINE
    { id: "bishop_seal", output: "bishop_seal", qty: 1, req: { "vellum_codex": 10, "luxury_codex": 20 }, cat: "lore", locked: true, desc: "Daruj biskupovi 10 pergamenových + 20 luxusních kodexů.", desc_en: "Gift the bishop 10 vellum + 20 luxury codices." },
    { id: "printing_privilege", output: "printing_privilege", qty: 1, req: { "bishop_seal": 1, "research": 100 }, cat: "lore", locked: true, desc: "Monopol. Endgame.", desc_en: "Monopoly. Endgame." }
];