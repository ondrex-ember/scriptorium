const RecipesDB = [
    // BASIC TOOLS
    { id: "sharp_stone", output: "sharp_stone", qty: 1, req: { "rock": 2 }, cat: "stone" },
    { id: "rope", output: "rope", qty: 1, req: { "fiber": 3 }, cat: "craft" },
    { id: "stone_knife", output: "stone_knife", qty: 1, req: { "sharp_stone": 1, "stick": 1, "rope": 1 }, cat: "stone" },
    { id: "charcoal", output: "charcoal", qty: 2, req: { "stick": 2 }, cat: "fire" },
    { id: "pestle", output: "pestle", qty: 1, req: { "rock": 2, "sharp_stone": 1 }, cat: "stone" },
    { id: "flint", output: "flint", qty: 1, req: { "rock": 2 }, cat: "stone" },
    { id: "primitive_torch", output: "primitive_torch", qty: 1, req: { "stick": 1, "fat": 1 }, cat: "fire", blind: true },
    { id: "tinderbox", output: "tinderbox", qty: 1, req: { "bark": 1, "fiber": 1 }, cat: "fire", blind: true },
    { id: "hoe", output: "hoe", qty: 1, req: { "sharp_stone": 1, "stick": 2, "rope": 1 }, cat: "stone" },
    { id: "bonemeal", output: "bonemeal", qty: 3, req: { "bone": 1, "pestle": 0 }, cat: "craft" },
    
    // LORE SYSTEM
    { id: "pulp", output: "pulp", qty: 1, req: { "bark": 2, "water": 1, "pestle": 0 }, cat: "parchment" },
    { id: "paper", output: "paper", qty: 1, req: { "pulp": 2 }, cat: "parchment" },
    { id: "ink", output: "ink", qty: 1, req: { "charcoal": 1, "water": 1, "pestle": 0 }, cat: "parchment" },
    { id: "research", output: "research", qty: 1, req: { "paper": 1, "ink": 1 }, cat: "lore" },
    
    // COOKING TOOLS
    { id: "fishing_rod", output: "fishing_rod", qty: 1, req: { "stick": 2, "rope": 1, "bone": 1 }, cat: "stone", locked: true },
    { id: "cooking_pot", output: "cooking_pot", qty: 1, req: { "rock": 3, "water": 1 }, cat: "craft", locked: true },
    { id: "tea_kettle", output: "tea_kettle", qty: 1, req: { "clay": 3, "water": 1 }, cat: "craft", locked: true },
    { id: "basket", output: "basket", qty: 1, req: { "fiber": 5, "stick": 2 }, cat: "craft", locked: true },

    // LACTARIA — zpracování mléka (tech_lactaria)
    { id: "mousetrap", output: "mousetrap", qty: 1, req: { "plank": 2, "rope": 1 },          cat: "craft", locked: true },
    { id: "churn",  output: "churn",  qty: 1, req: { "plank": 5, "rope": 2 },               cat: "craft", locked: true },
    { id: "cream",  output: "cream",  qty: 1, req: { "goat_milk": 2 },                      cat: "food",  locked: true },
    { id: "butter", output: "butter", qty: 1, req: { "milk": 3, "churn": 0 },               cat: "food",  locked: true, byproduct: { id: "buttermilk", qty: 1 } },
    
    // NEW RECIPES - Mini-games & Notebooks
    { id: "playing_cards", output: "playing_cards", qty: 1, req: { "paper": 5, "ink": 1 }, cat: "lore", locked: true },
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
		id: "repair_kit",
		output: "repair_kit",
		qty: 1,
		req: { stick: 5, rope: 2, rock: 3 },
		cat: "craft",
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
    cat: "lore",
    locked: true,
    desc: "Hra filozofů - Pythagorejská matematika v bitvě.", desc_en: "The Philosophers' Game - Pythagorean mathematics in battle."
	},
	{
    id: "primero_deck",
    output: "primero_deck",
    qty: 1,
    req: { paper: 40, ink: 10, preservation_oil: 2 },
    cat: "lore",
    locked: true,
    desc: "Španělský balíček pro Primero.", desc_en: "Spanish deck for Primero."
	},

	{
		id: "karnoffel_deck",
		output: "karnoffel_deck",
		qty: 1,
		req: { paper: 48, ink: 12, charcoal: 5 },
		cat: "lore",
		locked: true,
		desc: "Německý trumfový balíček.", desc_en: "German trump deck."
	},

	{
		id: "french_deck",
		output: "french_deck",
		qty: 1,
		req: { paper: 52, ink: 15, preservation_oil: 3, herb_blue: 2 },
		cat: "lore",
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
    cat: "lore",
    locked: true,
    desc: "Nejstarší desková hra světa - 2600 př.n.l.", desc_en: "The world's oldest board game - 2600 BC."
	},
    
    // NOTEBOOKS (5 types - progressive)
    { id: "tabula", output: "tabula", qty: 1, req: { "stick": 2, "fat": 1, "charcoal": 1 }, cat: "lore", locked: true },
    { id: "adversaria", output: "adversaria", qty: 1, req: { "paper": 5, "ink": 2, "rope": 1 }, cat: "codex", locked: true },
    { id: "vademecum", output: "vademecum", qty: 1, req: { "leather": 1, "paper": 10, "ink": 3 }, cat: "codex", locked: true },
    { id: "florilegium", output: "florilegium", qty: 1, req: { "leather": 2, "paper": 15, "ink": 5, "herb_yellow": 3 }, cat: "codex", locked: true },
    { id: "enchiridion", output: "enchiridion", qty: 1, req: { "leather": 3, "paper": 20, "ink": 8, "preservation_oil": 1 }, cat: "codex", locked: true },
    
    // COOKING RECIPES (vyžadují krb + pot)
    { id: "cooked_meat", output: "cooked_meat", qty: 1, req: { "meat": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "cooked_fish", output: "cooked_fish", qty: 1, req: { "fish": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "stew", output: "stew", qty: 1, req: { "meat": 1, "carrot": 1, "potato": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "mushroom_soup", output: "mushroom_soup", qty: 1, req: { "mushroom": 2, "onion": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "bread", output: "bread", qty: 2, req: { "fiber": 3, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "berry_pie",      output: "berry_pie",      qty: 1, req: { "berries": 3, "honey": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    // Bylinné nápoje — snižují Únavu, bez Athanoru
    { id: "herbal_tea",     output: "herbal_tea",     qty: 1, req: { "chamomile": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Heřmánkový čaj. Únava -15.", desc_en: "Chamomile tea. Fatigue -15." },
    { id: "herbal_tea_alt", output: "herbal_tea",     qty: 1, req: { "thyme": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Tymiánový čaj. Únava -15.", desc_en: "Thyme tea. Fatigue -15." },
    { id: "acorn_roasted",  output: "acorn_roasted",  qty: 1, req: { "acorn": 2, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Pražené a mleté žaludy. Příprava na Žaludovku.", desc_en: "Roasted, ground acorns. Preparation for Acorn Brew." },
    { id: "chicory_roasted", output: "chicory_roasted", qty: 1, req: { "roots": 2, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Pražená a mletá čekanka. Příprava na Cikorku.", desc_en: "Roasted, ground chicory root. Preparation for Chicory Coffee." },
    { id: "acorn_brew",     output: "acorn_brew",     qty: 1, req: { "acorn_roasted": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Žaludovka. Únava -10.", desc_en: "Acorn brew. Fatigue -10." },
    { id: "chicory_drink",  output: "chicory_drink",  qty: 1, req: { "chicory_roasted": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Cikorka. Únava -12.", desc_en: "Chicory coffee. Fatigue -12." },
    { id: "linden_tea",     output: "linden_tea",     qty: 1, req: { "linden_blossom": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Lipový čaj. Únava -8, Sytost +8.", desc_en: "Linden tea. Fatigue -8, Satiety +8." },
    
    // ALCHEMY - základní
    { id: "candle", output: "candle", qty: 1, req: { "fat": 1, "rope": 1 }, cat: "fire", locked: true }, 
    { id: "glue", output: "glue", qty: 1, req: { "bone": 2, "water": 1 }, cat: "craft", locked: true,
      desc: "Kostní klíh — kosti se hodiny vyvařují, dokud nevznikne hustá želatina.", desc_en: "Bone glue — bones boiled for hours into a thick gelatin." },
    { id: "potion_heal", output: "potion_heal", qty: 1, req: { "herb_red": 1, "fat": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "ash", output: "ash", qty: 1, req: { "charcoal": 4 }, cat: "alchemy", locked: true },
    { id: "ash_from_sticks", output: "ash", qty: 1, req: { "stick": 4 }, cat: "alchemy", locked: true, desc: "Spálené větve. Pomalé, ale bez uhlí.", desc_en: "Burned branches. Slow, but no charcoal needed." },
    { id: "ash_from_log", output: "ash", qty: 2, req: { "log": 1 }, cat: "alchemy", locked: true, desc: "Kulatina dá více popele.", desc_en: "A log yields more ash." },
    { id: "compost", output: "compost", qty: 2, req: { "fiber": 3, "bone": 1, "water": 1 }, cat: "craft", locked: true },
    
    // ALCHEMY - pokročilá
    { id: "antidote", output: "antidote", qty: 1, req: { "nightshade": 1, "honey": 1, "ash": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "stamina_tonic", output: "stamina_tonic", qty: 1, req: { "herb_yellow": 1, "honey": 1, "roots": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "preservation_oil", output: "preservation_oil", qty: 1, req: { "resin": 2, "ash": 1, "herb_blue": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "sleep_potion", output: "sleep_potion", qty: 1, req: { "herb_blue": 2, "mushroom_poison": 1, "honey": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    
    // ========== v7.5 NEW RECIPES - Historical Realities ==========
    
    // VELLUM CHAIN (Pergamen výroba - historicky přesná)
    { id: "ash_water", output: "ash_water", qty: 1, req: { "ash": 2, "water": 3 }, cat: "craft", locked: true, desc: "Louh na namáčení kůže. Historicky 3-4 dny.", desc_en: "Lye for soaking hides. Historically 3-4 days." },
    { id: "soaked_hide", output: "soaked_hide", qty: 1, req: { "hide": 2, "ash_water": 1 }, cat: "craft", locked: true, desc: "Kůže loužená 3 dny.", desc_en: "Hide soaked for 3 days." },
    { id: "stretched_hide", output: "stretched_hide", qty: 1, req: { "soaked_hide": 1, "rope": 2 }, cat: "craft", locked: true, desc: "Napnuto v rámu.", desc_en: "Stretched on a frame." },
    { id: "pumice", output: "pumice", qty: 1, req: { "rock": 3 }, cat: "craft", locked: true, desc: "Sopečný kámen - leští.", desc_en: "Volcanic stone - for smoothing." },
    { id: "vellum", output: "vellum", qty: 1, req: { "stretched_hide": 1, "pumice": 0, "chalk": 1 }, cat: "parchment", locked: true, desc: "Konečný pergamen. 1 kodex = kůže 3 ovcí.", desc_en: "Finished parchment. 1 codex = 3 sheep hides." },
    
    // QUILL (Husí brko)
    { id: "quill", output: "quill", qty: 1, req: { "feather": 1, "stone_knife": 0 }, cat: "parchment", locked: true, desc: "Řez pod úhlem. 10x použití.", desc_en: "Cut at an angle. 10 uses." },
    
    // GALLIC INK (Železitoduběnkový inkoust - 15. století standard)
    { id: "iron_sulfate", output: "iron_sulfate", qty: 1, req: { "rock": 2, "ash": 1, "water": 1 }, cat: "parchment", locked: true, desc: "Vitriol. Chemická reakce.", desc_en: "Vitriol. Chemical reaction." },
    { id: "gum_arabic", output: "gum_arabic", qty: 1, req: { "resin": 2, "water": 1 }, cat: "parchment", locked: true, desc: "Pojidlo z akácie.", desc_en: "Binder from acacia." },
    { id: "ink_gallic", output: "ink_gallic", qty: 2, req: { "gall_nut": 2, "iron_sulfate": 1, "gum_arabic": 1, "pestle": 0 }, cat: "parchment", locked: true, desc: "Permanentní. Po 80 letech černá→hnědá.", desc_en: "Permanent. After 80 years black→brown." },
    
    // ADVANCED CODEX TYPES
    { id: "common_codex", output: "common_codex", qty: 1, req: { "paper": 10, "ink": 3 }, cat: "codex", locked: true, desc: "Běžný tisk. 'Nižší typografie' (Voit).", desc_en: "Common print. 'Lower typography' (Voit)." },
    { id: "luxury_codex", output: "luxury_codex", qty: 1, req: { "paper": 20, "ink_gallic": 5, "preservation_oil": 1 }, cat: "codex", locked: true, desc: "'Vyšší typografie' s kvalitním inkoustem.", desc_en: "'Higher typography' with quality ink." },
    { id: "vellum_codex", output: "vellum_codex", qty: 1, req: { "vellum": 3, "ink_gallic": 8, "preservation_oil": 2 }, cat: "codex", locked: true, desc: "Pergamenový. Jak Olomoucký misál (1488) - pouze 20 z 420 výtisků.", desc_en: "On vellum. Like the Olomouc Missal (1488) - only 20 of 420 copies." },
    
    // PRINTING PRESS SYSTEM
    { id: "lead_alloy", output: "lead_alloy", qty: 1, req: { "rock": 5, "charcoal": 3, "water": 1 }, cat: "craft", locked: true, desc: "Tavení kamene na olovo.", desc_en: "Smelting stone into lead." },
    { id: "printing_type", output: "printing_type", qty: 100, req: { "lead_alloy": 5, "pestle": 0 }, cat: "codex", locked: true, desc: "100 použití. Pak worn_type. Historicky se prodávaly za kovový odpad.", desc_en: "100 uses. Then worn_type. Historically sold as scrap metal." },
    
    // CANONICAL HOURS UNLOCK
    { id: "book_of_hours", output: "book_of_hours", qty: 1, req: { "luxury_codex": 1, "herb_blue": 5, "herb_yellow": 5 }, cat: "codex", locked: true, desc: "Horologium. Odemkne 8 denních buffů dle benediktinského řádu.", desc_en: "Horologium. Unlocks 8 daily buffs according to Benedictine order." },
    { id: "perpetuum_calendarium", output: "perpetuum_calendarium", qty: 1, req: { "paper": 3, "ink": 2, "vellum": 1 }, cat: "codex", locked: true, desc: "Klášterní kalendář. Odemkne záložku Calendarium ve Skriptoriu. Nutno obnovit v lednu.", desc_en: "Monastic calendar. Unlocks the Calendarium tab in the Scriptorium. Must be renewed in January." },
    
    // PRIVILEGIUM QUESTLINE
    { id: "bishop_seal", output: "bishop_seal", qty: 1, req: { "vellum_codex": 10, "luxury_codex": 20 }, cat: "codex", locked: true, desc: "Daruj biskupovi 10 pergamenových + 20 luxusních kodexů.", desc_en: "Gift the bishop 10 vellum + 20 luxury codices." },
    { id: "printing_privilege", output: "printing_privilege", qty: 1, req: { "bishop_seal": 1, "research": 100 }, cat: "codex", locked: true, desc: "Monopol. Endgame.", desc_en: "Monopoly. Endgame." },

    // ═══════════════════════════════════════════════════════════════════════════
    // NOVÉ HERNÍ DESKY (sprint v8.x)
    // chalk není craftitelný — kupuje se v Cellariu (Obchod, 2 groše / 3 křída)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "senet_board",
        output: "senet_board",
        qty: 1,
        req: { stick: 2, bone: 2, ink: 1 },
        cat: "lore",
        locked: true,
        desc: "Egyptská hra faraonů — 30 polí, 5 kamenů, 4 hůlky-kostky.", desc_en: "Egyptian game of pharaohs — 30 squares, 5 stones, 4 stick-dice."
    },
    {
        id: "backgammon_board",
        output: "backgammon_board",
        qty: 1,
        req: { stick: 3, leather: 2, bone: 2 },
        cat: "lore",
        locked: true,
        desc: "Vrhcáby — deska z kůže, kameny z kostí, dvě kostky.", desc_en: "Tables — leather board, bone stones, two dice."
    },
    {
        id: "draughts_board",
        output: "draughts_board",
        qty: 1,
        req: { stick: 3, charcoal: 1, chalk: 1 },
        cat: "lore",
        locked: true,
        desc: "Dáma — střídavá pole z uhlí a křídy, 24 kamenů.", desc_en: "Draughts — alternating charcoal and chalk squares, 24 stones."
    },
    {
        id: "hnefatafl_board",
        output: "hnefatafl_board",
        qty: 1,
        req: { stick: 4, bone: 3, vellum: 1 },
        cat: "lore",
        locked: true,
        desc: "Hnefatafl — asymetrická hra. Král a 12 obránců vs. 24 útočníků.", desc_en: "Hnefatafl — asymmetric game. King and 12 defenders vs. 24 attackers."
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LEATHER SYSTEM (v8.x) — Koželužství a kožené výrobky skriptoria
    // ═══════════════════════════════════════════════════════════════════════════

    // Výroba kůže (dokončení řetězce: hide → soaked → stretched → leather)
    { id: "tanned_leather", output: "leather", qty: 1, req: { stretched_hide: 2, gall_nut: 2 }, cat: "craft", locked: true,
      desc: "Vydělená kůže. Třísloviny z duběnek zpevní vlákna.", desc_en: "Tanned leather. Gall nut tannins harden the fibres." },

    // Měchy — dual use: oheň + varhany + Athanor upgrade
    { id: "bellows", output: "bellows", qty: 1, req: { leather: 4, stick: 3, rope: 2 }, cat: "craft", locked: true,
      desc: "Kožené měchy. Rozdmýchají oheň i varhanní píšťaly.", desc_en: "Leather bellows. Fan the fire and the organ pipes alike." },

    // Vazba knih — základ pro luxury/vellum codex
    { id: "book_binding", output: "book_binding", qty: 1, req: { leather: 2, stick: 3, glue: 1 }, cat: "craft", locked: true,
      desc: "Kožená vazba drží složky pohromadě. Bez ní jsou jen volné listy.", desc_en: "Leather binding holds the quires together. Without it, just loose leaves." },

    // Pouzdro na pera
    { id: "quill_case", output: "quill_case", qty: 1, req: { leather: 1, rope: 1 }, cat: "craft", locked: true,
      desc: "Kožené pouzdro chrání husí brka před zlomením.", desc_en: "Leather case protects quills from snapping." },

    // Opasek písaře — buff later
    { id: "scribes_belt", output: "scribes_belt", qty: 1, req: { leather: 2, rope: 1 }, cat: "craft", locked: true,
      desc: "Na opasku visí nůž, brousek a pouzdro na pero. Písařova výbava.", desc_en: "Knife, whetstone and quill case hang from it. The scribe's kit." },

    // Kožená deska — pro luxury codex
    { id: "book_cover", output: "book_cover", qty: 1, req: { leather: 3, stick: 5 }, cat: "craft", locked: true,
      desc: "Dřevěná deska potažená kůží. Chrání kodex po staletí.", desc_en: "Wooden board covered in leather. Protects the codex for centuries." },

    // Kožené sedátko — komfort buff later
    { id: "cushion", output: "cushion", qty: 1, req: { leather: 2, fiber: 3 }, cat: "craft", locked: true,
      desc: "Mniši seděli 6 hodin denně. Sedátko nebylo luxus — bylo nutnost.", desc_en: "Monks sat 6 hours daily. A cushion was not luxury — it was necessity." },

    // Transportní pouzdro — pro export/trade later
    { id: "scrinium_case", output: "scrinium_case", qty: 1, req: { leather: 4, rope: 2 }, cat: "craft", locked: true,
      desc: "Kožené pouzdro na přepravu cenných kodexů. Cestovní skriptorium.", desc_en: "Leather case for transporting precious codices. A travelling scriptorium." },

    // Kožený měšec na vodu
    { id: "water_pouch", output: "water_pouch", qty: 1, req: { leather: 1, rope: 1 }, cat: "craft", locked: true,
      desc: "Kožený měšec. Mniši nosili pití při práci v skriptoriu.", desc_en: "Leather pouch. Monks carried drink during work in the scriptorium." },

    // Váček na inkoust/pigmenty
    { id: "ink_pouch", output: "ink_pouch", qty: 1, req: { leather: 1, rope: 1 }, cat: "craft", locked: true,
      desc: "Kožený váček na suchý inkoust a práškové pigmenty.", desc_en: "Leather pouch for dry ink and powdered pigments." },

    // ── STAVEBNÍ MATERIÁLY (tech_carpentaria) ───────────────────────────────
    { id: "plank", output: "plank", qty: 2, req: { stick: 5 }, cat: "craft", locked: true,
      desc: "Otesané fošny z větví. Základ každé dřevěné stavby.", desc_en: "Hewn planks from branches. The foundation of every wooden structure." },

    { id: "cut_stone", output: "cut_stone", qty: 1, req: { rock: 4 }, cat: "craft", locked: true,
      desc: "Opracovaný kvádr. Klášterní tesař ho vytesá dlátem a palicí.", desc_en: "A dressed block. The monastic carpenter shapes it with chisel and mallet." },

    // ── KRMNÉ SUROVINY (tech_horreum) ────────────────────────────────────────
    { id: "hay", output: "hay", qty: 2, req: { grass: 5 }, cat: "craft", locked: true,
      desc: "Posečená a sušená tráva. Základní krmivo pro ovce a kozy.", 
      desc_en: "Cut and dried grass. Basic fodder for sheep and goats." },




    // ── KAMENNÉ NÁSTROJE (tech_horticulture + tech_carpentaria) ─────────────
    { id:"stone_axe",    output:"stone_axe",    qty:1, req:{stick:2, rock:3, rope:1}, cat:"stone", locked:true,
      desc:"Kamenné ostří na dřevené násadě.", desc_en:"Stone blade on a wooden haft." },
    { id:"stone_spade",  output:"stone_spade",  qty:1, req:{stick:2, rock:2, rope:1}, cat:"stone", locked:true,
      desc:"Plochý kámen na násadě.", desc_en:"Flat stone on a haft." },
    { id:"stone_scythe", output:"stone_scythe", qty:1, req:{stick:3, rock:3, rope:2}, cat:"stone", locked:true,
      desc:"Kamenné ostří na dlouhé násadě.", desc_en:"Stone blade on a long haft." },
    { id:"stone_sickle", output:"stone_sickle", qty:1, req:{stick:1, rock:2, rope:1}, cat:"stone", locked:true,
      desc:"Malé kamenné ostří. Žeň bylin.", desc_en:"Small stone blade. For harvesting herbs." },
    { id:"stone_flail",  output:"stone_flail",  qty:1, req:{stick:3, rope:2, rock:1}, cat:"stone", locked:true,
      desc:"Dřevěný cep s kamenným závažím.", desc_en:"Wooden flail with stone weight." },
    { id:"wooden_flail", output:"wooden_flail", qty:1, req:{stick:3, rope:2}, cat:"stone", locked:true,
      desc:"Prostý dřevěný cep. Základní mlácení obilí.", desc_en:"Simple wooden flail. Basic threshing tool." },
    { id:"stone_pickaxe",output:"stone_pickaxe",qty:1, req:{stick:2, rock:4, rope:2}, cat:"stone", locked:true,
      desc:"Kamenná hlava upevněná na násadě. Těžba rudy.", desc_en:"Stone head fixed to a haft. Ore mining." },
    { id:"stone_shovel", output:"stone_shovel", qty:1, req:{stick:2, rock:2, rope:1}, cat:"stone", locked:true,
      desc:"Plochý kámen jako lopata.", desc_en:"Flat stone as a shovel." },
    { id:"stone_saw",    output:"stone_saw",    qty:1, req:{stick:2, flint:2, rope:1}, cat:"stone", locked:true,
      desc:"Pila z křemenných úštěpků.", desc_en:"Saw of flint chips." },

    // ── DŘEVĚNÉ NÁSTROJE ─────────────────────────────────────────────────────
    { id:"bucket",       output:"bucket",       qty:1, req:{plank:3, rope:2},          cat:"craft", locked:true,
      desc:"Dřevěné vědro na vodu.", desc_en:"Wooden bucket for water." },
    { id:"watering_can", output:"watering_can", qty:1, req:{plank:2, rope:2, leather:1}, cat:"craft", locked:true,
      desc:"Konev na zalévání zahrady.", desc_en:"Watering can for the garden." },
    { id:"barrel_tool",  output:"barrel_tool",  qty:1, req:{plank:6, rope:3},           cat:"craft", locked:true,
      desc:"Dřevěný sud na pivo, víno a vodu.", desc_en:"Wooden barrel for ale, wine and water." },

    // ── ŽELEZNÝ VÝROBNÍ ŘETĚZEC ─────────────────────────────────────────────
    { id:"iron_ingot", output:"iron_ingot", qty:1, req:{iron_ore:3, charcoal:2}, cat:"mat", locked:true,
      desc:"Tavení rudy s uhlím. Základ kovářství.", desc_en:"Smelting ore with charcoal. Foundation of smithcraft." },

    // ── KOVOVÉ NÁSTROJE (tech_kovarina, max 1 ks) ────────────────────────────
    { id:"iron_axe",    output:"iron_axe",    qty:1, req:{iron_ingot:2, plank:1, rope:1, leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Masivní sekera. 2 ingoty na hlavu, kůže na opich.", desc_en:"Heavy axe. 2 ingots for the head, leather grip." },
    { id:"iron_spade",  output:"iron_spade",  qty:1, req:{iron_ingot:1, plank:2, rope:1},            cat:"iron", locked:true, maxStack:1,
      desc:"Železná čepel. 2 prkna: násada a opěrka nohy.", desc_en:"Iron blade. 2 planks: shaft and foot rest." },
    { id:"iron_scythe", output:"iron_scythe", qty:1, req:{iron_ingot:2, stick:3, rope:2, leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Dlouhá zahnutá čepel. Historicky 3dílná rukojeť.", desc_en:"Long curved blade. Historically 3-piece handle." },
    { id:"iron_sickle", output:"iron_sickle", qty:1, req:{iron_ingot:1, stick:1, rope:1, leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Zahnutá čepel, krátká rukojeť, kůže na opich.", desc_en:"Curved blade, short handle, leather wrapping." },
    { id:"iron_flail",  output:"iron_flail",  qty:1, req:{iron_ingot:1, stick:3, rope:2, leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Železné závaží, 3dílná rukojeť, provazový kloub.", desc_en:"Iron weight, 3-piece handle, rope joint." },
    { id:"iron_shovel", output:"iron_shovel", qty:1, req:{iron_ingot:1, plank:2, rope:1},            cat:"iron", locked:true, maxStack:1,
      desc:"Širší čepel než rýč. 2 prkna na pevnou násadu.", desc_en:"Wider blade than spade. 2 planks for a firm shaft." },
    { id:"iron_saw",    output:"iron_saw",    qty:1, req:{iron_ingot:2, plank:1, leather:1},         cat:"iron", locked:true, maxStack:1,
      desc:"Pilový list s mnoha zuby. 2 ingoty, dřevěný rám.", desc_en:"Saw blade with many teeth. 2 ingots, wooden frame." },
    { id:"iron_pickaxe",output:"iron_pickaxe",qty:1, req:{iron_ingot:2, stick:2, rope:1, leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Těžká dvojitá hlava. 2 ingoty, dvojnásada.", desc_en:"Heavy double head. 2 ingots, double-hafted." },
    { id:"iron_tongs",  output:"iron_tongs",  qty:1, req:{iron_ingot:1, leather:1},                  cat:"iron", locked:true, maxStack:1,
      desc:"Kovářské kleště. Nezbytné pro opravy v Kovárně.", desc_en:"Blacksmith tongs. Essential for repairs at the Smithy." },

    // ── OPRAVA OPOTŘEBENÝCH NÁSTROJŮ (Fabrica — vyžaduje iron_tongs) ─────────
    { id:"repair_iron_axe",    output:"iron_axe",    qty:1, req:{worn_iron_axe:1,     iron_tongs:1}, cat:"iron", locked:true, desc:"Překování a nabroušení sekerky.", desc_en:"Reforge and sharpen the axe." },
    { id:"repair_iron_spade",  output:"iron_spade",  qty:1, req:{worn_iron_spade:1,   iron_tongs:1}, cat:"iron", locked:true, desc:"Vyrovnání a oprava rýče.", desc_en:"Straighten and repair the spade." },
    { id:"repair_iron_scythe", output:"iron_scythe", qty:1, req:{worn_iron_scythe:1,  iron_tongs:1}, cat:"iron", locked:true, desc:"Nabroušení kosy na bruse.", desc_en:"Sharpen the scythe on the grindstone." },
    { id:"repair_iron_sickle", output:"iron_sickle", qty:1, req:{worn_iron_sickle:1,  iron_tongs:1}, cat:"iron", locked:true, desc:"Nabroušení a překování srpu.", desc_en:"Sharpen and reforge the sickle." },
    { id:"repair_iron_flail",  output:"iron_flail",  qty:1, req:{worn_iron_flail:1,   iron_tongs:1}, cat:"iron", locked:true, desc:"Utažení závaží, nové spojení.", desc_en:"Tighten the weight, new joint." },
    { id:"repair_iron_shovel", output:"iron_shovel", qty:1, req:{worn_iron_shovel:1,  iron_tongs:1}, cat:"iron", locked:true, desc:"Narovnání čepele lopaty.", desc_en:"Straighten the shovel blade." },
    { id:"repair_iron_saw",     output:"iron_saw",     qty:1, req:{worn_iron_saw:1,     iron_tongs:1}, cat:"iron", locked:true, desc:"Přebroušení zubů pily.", desc_en:"Re-sharpen the saw teeth." },
    { id:"repair_iron_pickaxe", output:"iron_pickaxe", qty:1, req:{worn_iron_pickaxe:1, iron_tongs:1}, cat:"iron", locked:true, desc:"Překování hrotu krumpáče.", desc_en:"Reforge the pickaxe head." },

    // ── VINOHRAD — stavby ─────────────────────────────────────────────────────
    { id:"prelum",            output:"prelum",            qty:1,
      req:{plank:8, rope:4, rock:6, iron_ingot:2},
      cat:"building", locked:true, maxStack:1,
      desc:"Vinný lis. Dřevěný rám, kamenná podlaha, železné šrouby. Odemkne zpracování hroznů.",
      desc_en:"Wine press. Wooden frame, stone floor, iron screws. Unlocks grape processing." },

    { id:"cella_fermentaria", output:"cella_fermentaria", qty:1,
      req:{plank:10, rock:8, rope:3, clay:4},
      cat:"building", locked:true, maxStack:1,
      desc:"Fermentační sklep. Hliněné nádoby, kamenné zdivo, chlad. Odemkne výrobu Vinum a Vinum Rubrum.",
      desc_en:"Fermentation cellar. Clay vessels, stone masonry, cool air. Unlocks Vinum and Vinum Rubrum." },

    { id:"foudres",           output:"foudres",           qty:1,
      req:{plank:15, rope:6, iron_ingot:3},
      cat:"building", locked:true, maxStack:1,
      desc:"Velké dubové sudy. Víno zrající v sudu získá jantarovou barvu. Odemkne Vinum Praeclarum.",
      desc_en:"Large oak barrels. Wine aged in the barrel gains amber colour. Unlocks Vinum Praeclarum." },

    { id:"bedna_dilna",       output:"bedna_dilna",       qty:1,
      req:{plank:12, iron_ingot:4, rope:5, leather:2},
      cat:"building", locked:true, maxStack:1,
      desc:"Bednářská dílna. Výroba sudů pro export vína. Odemkne řemeslo bednáře.",
      desc_en:"Cooperage workshop. Craft barrels for wine export. Unlocks the cooper's craft." },
];