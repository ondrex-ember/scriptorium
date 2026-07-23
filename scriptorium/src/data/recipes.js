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
    { id: "pulp", output: "pulp", qty: 1, req: { "rags": 2, "water": 1, "pestle": 0 }, cat: "parchment" },
    { id: "paper", output: "paper", qty: 1, req: { "pulp": 2 }, cat: "parchment" },
    { id: "bird_paper", output: "bird_paper", qty: 3, req: { "paper_fine": 1 }, cat: "parchment", locked: true,
      desc: "Ztenčený benátský papír pro poštovní holuby.", desc_en: "Thinned Venetian paper for messenger pigeons." },
    { id: "ink", output: "ink", qty: 1, req: { "charcoal": 1, "water": 1, "pestle": 0 }, cat: "parchment" },
    { id: "research", output: "research", qty: 1, req: { "paper": 1, "ink": 1 }, cat: "lore" },
    
    // COOKING TOOLS
    { id: "fishing_rod", output: "fishing_rod", qty: 1, req: { "stick": 2, "rope": 1, "bone": 1 }, cat: "stone", locked: true },
    { id: "cooking_pot", output: "cooking_pot", qty: 1, req: { "rock": 3, "water": 1 }, cat: "craft", locked: true },
    { id: "tea_kettle", output: "tea_kettle", qty: 1, req: { "clay": 3, "water": 1 }, cat: "craft", locked: true },
    { id: "basket", output: "basket", qty: 1, req: { "fiber": 5, "stick": 2 }, cat: "craft", locked: true },

    // LACTARIA — zpracování mléka (tech_lactaria)
    { id: "wooden_bowl", output: "wooden_bowl", qty: 2, req: { "plank": 1 },                cat: "craft", locked: true },
    { id: "hostia",      output: "hostia",      qty: 5, req: { "flour_2": 1, "water": 1 },  cat: "craft", locked: true },
    { id: "mousetrap", output: "mousetrap", qty: 1, req: { "plank": 2, "rope": 1 },          cat: "craft", locked: true },
    { id: "fly_trap_paper", output: "fly_trap_paper", qty: 1, req: { "paper": 5, "glue": 2, "honey": 1 }, cat: "craft", locked: true },
    { id: "churn",  output: "churn",  qty: 1, req: { "plank": 5, "rope": 2 },               cat: "craft", locked: true },
    { id: "cream",  output: "cream",  qty: 1, req: { "goat_milk": 2 },                      cat: "food",  locked: true },
    { id: "butter", output: "butter", qty: 1, req: { "milk": 3, "churn": 0 },               cat: "food",  locked: true, byproduct: { id: "buttermilk", qty: 1 } },

    // CASEUS — sýrařství (tech_caseus, viz krok 2e)
    { id: "rennet_galium", output: "rennet", qty: 1, req: { "galium": 3 },                  cat: "food",  locked: true },
    { id: "cheese_mold",   output: "cheese_mold", qty: 1, req: { "plank": 3, "fiber": 4 },   cat: "craft", locked: true },
    { id: "goat_cheese",   output: "goat_cheese_fresh",  qty: 1, req: { "goat_milk": 4, "rennet": 1, "cheese_mold": 0 }, cat: "food", locked: true },
    { id: "sheep_cheese",  output: "sheep_cheese_fresh", qty: 1, req: { "milk": 4, "rennet": 1, "cheese_mold": 0 },       cat: "food", locked: true },
    { id: "cow_cheese",    output: "cow_cheese_fresh",   qty: 1, req: { "cow_milk": 4, "rennet": 1, "cheese_mold": 0 },   cat: "food", locked: true },
    { id: "syrecky",       output: "syrecky_fresh",      qty: 1, req: { "milk": 3, "cheese_mold": 0 },                    cat: "food", locked: true },
    
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
    { id: "enchiridion", output: "enchiridion", qty: 1, req: { "unfitted_codex": 1, "metal_clasps": 2, "metal_bosses": 4, "preservation_oil": 1 }, cat: "codex", locked: true },
    
    // COOKING RECIPES (vyžadují krb + pot)
    { id: "cooked_meat", output: "cooked_meat", qty: 1, req: { "meat": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "cooked_beef", output: "cooked_beef", qty: 1, req: { "beef": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "cooked_mutton", output: "cooked_mutton", qty: 1, req: { "mutton": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "cooked_chicken", output: "cooked_chicken", qty: 1, req: { "chicken_meat": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "cooked_rabbit", output: "cooked_rabbit", qty: 1, req: { "rabbit_meat": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "roast_beef", output: "roast_beef", qty: 1, req: { "cooked_beef": 1, "onion": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "braised_beef", output: "braised_beef", qty: 1, req: { "cooked_beef": 1, "carrot": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "roast_rabbit_dish", output: "roast_rabbit_dish", qty: 1, req: { "cooked_rabbit": 1, "carrot": 1, "cabbage": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "cooked_fish", output: "cooked_fish", qty: 1, req: { "fish": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "crayfish_boiled", output: "crayfish_boiled", qty: 1, req: { "crayfish": 3, "beer": 1, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Raci vaření v pivu s kmínem.", desc_en: "Crayfish boiled in beer with caraway." },
    { id: "snails_black_sauce", output: "snails_black_sauce", qty: 1, req: { "snail": 4, "bread": 1, "honey": 1, "fat": 1, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Hlemýždi v omáčce zahuštěné chlebem.", desc_en: "Snails in a bread-thickened sauce." },
    { id: "frog_legs_prep", output: "frog_legs", qty: 1, req: { "frog": 1 }, cat: "food", locked: true, desc: "Stažení a příprava žabích stehýnek.", desc_en: "Skinning and preparing frog legs." },
    { id: "frog_legs_fried", output: "frog_legs_fried", qty: 1, req: { "frog_legs": 2, "fat": 1, "garlic": 1, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Stehýnka osmažená na sádle s česnekem.", desc_en: "Legs fried in lard with garlic." },
    { id: "stew", output: "stew", qty: 1, req: { "meat": 1, "carrot": 1, "turnip": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "stew_koreni", output: "stew_koreni", qty: 1, req: { "meat": 1, "carrot": 1, "turnip": 1, "water": 1, "pepr_cerny": 1, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Guláš dochucený černým pepřem.", desc_en: "Stew seasoned with black pepper." },
    { id: "mushroom_soup", output: "mushroom_soup", qty: 1, req: { "mushroom": 2, "onion": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "spring_herb_porridge", output: "spring_herb_porridge", qty: 1, req: { "nettle": 1, "ground_elder": 1, "goosefoot": 1, "oats": 1, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Jarní bylinková kaše.", desc_en: "Spring herb porridge." },
    { id: "burdock_root_baked", output: "burdock_root_baked", qty: 1, req: { "burdock_root": 2 }, cat: "food", locked: true, desc: "Upečeno přímo v popelu, žádný hrnec netřeba.", desc_en: "Baked directly in the ashes, no pot needed." },
    { id: "couch_grass_flour", output: "couch_grass_flour", qty: 1, req: { "couch_grass": 3 }, cat: "food", locked: true, desc: "Umleto v hmoždíři.", desc_en: "Ground in a mortar." },
    { id: "cattail_root_flour", output: "couch_grass_flour", qty: 1, req: { "cattail_root": 3 }, cat: "food", locked: true, desc: "Umleto v hmoždíři.", desc_en: "Ground in a mortar." },
    { id: "rosehip_sauce", output: "rosehip_sauce", qty: 1, req: { "rosehip": 3, "bread": 1, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Šípková jícha.", desc_en: "Rosehip sauce." },
    { id: "famine_bread", output: "famine_bread", qty: 1, req: { "acorn": 2, "beechnut": 2, "pestle": 0 }, cat: "food", locked: true, desc: "Hladový chléb ze žaludů a bukvic.", desc_en: "Famine bread from acorns and beechnuts." },
    { id: "dried_wild_fruit", output: "dried_wild_fruit", qty: 1, req: { "wild_fruit": 2, "cornel_cherry": 1 }, cat: "food", locked: true, desc: "Křížaly sušené na peci.", desc_en: "Dried fruit by the oven." },
    { id: "sloe_jam", output: "sloe_jam", qty: 1, req: { "sloe": 3, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Trnková povidla, bez cukru, dlouhé vaření.", desc_en: "Sloe jam, no sugar, long boiling." },
    { id: "morel_stuffed", output: "morel_stuffed", qty: 1, req: { "morel": 3, "bread": 1, "garlic": 1, "fat": 1, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Plněné smrže.", desc_en: "Stuffed morels." },
    { id: "pickled_mushrooms", output: "pickled_mushrooms", qty: 1, req: { "saffron_milk_cap": 2, "porcini": 1, "barrel_tool": 0 }, cat: "food", locked: true, desc: "Naložené houby v slaném nálevu.", desc_en: "Pickled mushrooms in brine." },
    { id: "smazenice", output: "smazenice", qty: 1, req: { "mushroom": 3, "onion": 1, "egg": 2, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "bread", output: "bread", qty: 2, req: { "fiber": 3, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "bread_fine", output: "bread_fine", qty: 2, req: { "flour_2": 3, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "bread_fine_1", output: "bread_fine_1", qty: 2, req: { "flour_1": 3, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "berry_pie",      output: "berry_pie",      qty: 1, req: { "berries": 3, "honey": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "berry_pie_koreni", output: "berry_pie_koreni", qty: 1, req: { "berries": 3, "honey": 1, "skorice": 1, "cooking_pot": 0 }, cat: "food", locked: true, desc: "Koláč provoněný skořicí.", desc_en: "A tart scented with cinnamon." },
    { id: "berry_pie_fine",   output: "berry_pie_fine",   qty: 1, req: { "flour_2": 2, "berries": 3, "honey": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    { id: "berry_pie_fine_1", output: "berry_pie_fine_1", qty: 1, req: { "flour_1": 2, "berries": 3, "honey": 1, "cooking_pot": 0 }, cat: "food", locked: true },
    // Bylinné nápoje — snižují Únavu, bez Athanoru
    { id: "herbal_tea",     output: "herbal_tea",     qty: 1, req: { "chamomile": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Heřmánkový čaj. Únava -15.", desc_en: "Chamomile tea. Fatigue -15." },
    { id: "herbal_tea_alt", output: "herbal_tea",     qty: 1, req: { "thyme": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Tymiánový čaj. Únava -15.", desc_en: "Thyme tea. Fatigue -15." },
    { id: "hildegard_tisane", output: "hildegard_tisane", qty: 1, req: { "chamomile": 1, "thyme": 1, "honey": 1, "water": 1, "cooking_pot": 0 }, cat: "food", locked: true,
      desc: "Hildegardin recept. Únava -20.", desc_en: "Hildegard's recipe. Fatigue -20." },
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
    // Šrot — krmivo z polního zrní (4:2, libovolný druh)
    { id: "feed_meal_rye",    output: "feed_meal", qty: 2, req: { "rye_grain": 4 },  cat: "craft", locked: true,
      desc: "Šrot ze žita. Krmivo pro dobytek.", desc_en: "Feed meal from rye. Livestock feed." },
    { id: "feed_meal_rye_1",  output: "feed_meal", qty: 2, req: { "rye_grain_1": 4 }, cat: "craft", locked: true,
      desc: "Šrot z prvotřídního žita. Krmivo pro dobytek.", desc_en: "Feed meal from grade-1 rye. Livestock feed." },
    { id: "feed_meal_rye_2",  output: "feed_meal", qty: 2, req: { "rye_grain_2": 4 }, cat: "craft", locked: true,
      desc: "Šrot ze žita 2. třídy. Krmivo pro dobytek.", desc_en: "Feed meal from grade-2 rye. Livestock feed." },
    { id: "feed_meal_wheat",  output: "feed_meal", qty: 2, req: { "wheat_grain": 4 }, cat: "craft", locked: true,
      desc: "Šrot z pšenice. Krmivo pro dobytek.", desc_en: "Feed meal from wheat. Livestock feed." },
    { id: "feed_meal_wheat_1", output: "feed_meal", qty: 2, req: { "wheat_grain_1": 4 }, cat: "craft", locked: true,
      desc: "Šrot z prvotřídní pšenice. Krmivo pro dobytek.", desc_en: "Feed meal from grade-1 wheat. Livestock feed." },
    { id: "feed_meal_wheat_2", output: "feed_meal", qty: 2, req: { "wheat_grain_2": 4 }, cat: "craft", locked: true,
      desc: "Šrot z pšenice 2. třídy. Krmivo pro dobytek.", desc_en: "Feed meal from grade-2 wheat. Livestock feed." },
    { id: "feed_meal_barley", output: "feed_meal", qty: 2, req: { "barley": 4 },     cat: "craft", locked: true,
      desc: "Šrot z ječmene. Krmivo pro dobytek.", desc_en: "Feed meal from barley. Livestock feed." },
    { id: "feed_meal_oats",   output: "feed_meal", qty: 2, req: { "oats": 4 },       cat: "craft", locked: true,
      desc: "Šrot z ovsa. Krmivo pro dobytek.", desc_en: "Feed meal from oats. Livestock feed." },
    { id: "feed_meal_millet", output: "feed_meal", qty: 2, req: { "millet": 4 },     cat: "craft", locked: true,
      desc: "Šrot z prosa. Krmivo pro dobytek.", desc_en: "Feed meal from millet. Livestock feed." },
    { id: "feed_meal_peas",   output: "feed_meal", qty: 2, req: { "peas": 4 },       cat: "craft", locked: true,
      desc: "Šrot z hrachu. Krmivo pro dobytek.", desc_en: "Feed meal from peas. Livestock feed." },
    { id: "feed_meal_vikev",  output: "feed_meal", qty: 2, req: { "vikev": 4 },      cat: "craft", locked: true,
      desc: "Šrot z vikve. Levné krmivo pro dobytek i holuby.", desc_en: "Feed meal from vetch. Cheap fodder for livestock and pigeons." },
    { id: "feed_meal_scraps", output: "feed_meal", qty: 2, req: { "scraps": 3 },     cat: "craft", locked: true,
      desc: "Šrot ze zbytků. Levnější, ale stejně vydatné krmivo.", desc_en: "Feed meal from scraps. Cheaper, but just as hearty a feed." },
    // Osivo ze zrní — část úrody stranou jako příští setba (3:1)
    { id: "rye_to_seed",    output: "seeds_rye",    qty: 1, req: { "rye_grain": 3 },  cat: "craft", locked: true,
      desc: "Vybraná zrna žita ponechaná na osivo.", desc_en: "Selected rye grains set aside as seed." },
    { id: "rye_to_seed_1",  output: "seeds_rye",    qty: 1, req: { "rye_grain_1": 3 }, cat: "craft", locked: true,
      desc: "Vybraná zrna prvotřídního žita ponechaná na osivo.", desc_en: "Selected grade-1 rye grains set aside as seed." },
    { id: "rye_to_seed_2",  output: "seeds_rye",    qty: 1, req: { "rye_grain_2": 3 }, cat: "craft", locked: true,
      desc: "Vybraná zrna žita 2. třídy ponechaná na osivo.", desc_en: "Selected grade-2 rye grains set aside as seed." },
    { id: "wheat_to_seed",  output: "seeds_wheat",  qty: 1, req: { "wheat_grain": 3 }, cat: "craft", locked: true,
      desc: "Vybraná zrna pšenice ponechaná na osivo.", desc_en: "Selected wheat grains set aside as seed." },
    { id: "wheat_to_seed_1", output: "seeds_wheat",  qty: 1, req: { "wheat_grain_1": 3 }, cat: "craft", locked: true,
      desc: "Vybraná zrna prvotřídní pšenice ponechaná na osivo.", desc_en: "Selected grade-1 wheat grains set aside as seed." },
    { id: "wheat_to_seed_2", output: "seeds_wheat",  qty: 1, req: { "wheat_grain_2": 3 }, cat: "craft", locked: true,
      desc: "Vybraná zrna pšenice 2. třídy ponechaná na osivo.", desc_en: "Selected grade-2 wheat grains set aside as seed." },
    { id: "barley_to_seed", output: "seeds_barley", qty: 1, req: { "barley": 3 },     cat: "craft", locked: true,
      desc: "Vybraná zrna ječmene ponechaná na osivo.", desc_en: "Selected barley grains set aside as seed." },
    { id: "oats_to_seed",   output: "seeds_oats",   qty: 1, req: { "oats": 3 },       cat: "craft", locked: true,
      desc: "Vybraná zrna ovsa ponechaná na osivo.", desc_en: "Selected oat grains set aside as seed." },
    { id: "millet_to_seed", output: "seeds_millet", qty: 1, req: { "millet": 3 },     cat: "craft", locked: true,
      desc: "Vybraná zrna prosa ponechaná na osivo.", desc_en: "Selected millet grains set aside as seed." },
    { id: "peas_to_seed",   output: "seeds_peas",   qty: 1, req: { "peas": 3 },       cat: "craft", locked: true,
      desc: "Vybrané zrna hrachu ponechaná na osivo.", desc_en: "Selected pea grains set aside as seed." },
    { id: "vikev_to_seed",  output: "seeds_vikev",  qty: 1, req: { "vikev": 3 },      cat: "craft", locked: true,
      desc: "Vybraná zrna vikve ponechaná na osivo.", desc_en: "Selected vetch grains set aside as seed." },

    // Zelenina → semínka (nůž)
    { id: "carrot_to_seed", output: "seeds_vegetable", qty: 1, req: { "carrot": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá jádra mrkve ponechaná na osivo.", desc_en: "Carrot seeds cut out with a knife, set aside for sowing." },
    { id: "onion_to_seed", output: "seeds_vegetable", qty: 1, req: { "onion": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá semínka cibule ponechaná na osivo.", desc_en: "Onion seeds cut out with a knife, set aside for sowing." },
    { id: "leek_to_seed", output: "seeds_leek", qty: 1, req: { "leek": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá semínka pórku ponechaná na osivo.", desc_en: "Leek seeds cut out with a knife, set aside for sowing." },
    { id: "cabbage_to_seed", output: "seeds_cabbage", qty: 1, req: { "cabbage": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá semínka zelí ponechaná na osivo.", desc_en: "Cabbage seeds cut out with a knife, set aside for sowing." },
    { id: "radish_to_seed", output: "seeds_radish", qty: 1, req: { "radish": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá semínka ředkve ponechaná na osivo.", desc_en: "Radish seeds cut out with a knife, set aside for sowing." },
    { id: "turnip_to_seed", output: "seeds_turnip", qty: 1, req: { "turnip": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá semínka řepy ponechaná na osivo.", desc_en: "Turnip seeds cut out with a knife, set aside for sowing." },
    { id: "garlic_to_seed", output: "seeds_garlic", qty: 1, req: { "garlic": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem rozebraný stroužek česneku ponechaný na osivo.", desc_en: "Garlic clove separated with a knife, set aside for sowing." },

    // Byliny → semínka (nůž)
    { id: "herb_red_to_seed", output: "seeds_herb", qty: 1, req: { "herb_red": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka krvavého květu ponechaná na osivo.", desc_en: "Bloodwort seeds picked out with a knife, set aside for sowing." },
    { id: "chamomile_to_seed", output: "seeds_yellow", qty: 1, req: { "chamomile": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka heřmánku ponechaná na osivo.", desc_en: "Chamomile seeds picked out with a knife, set aside for sowing." },
    { id: "herb_blue_to_seed", output: "seeds_blue", qty: 1, req: { "herb_blue": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka levandule ponechaná na osivo.", desc_en: "Lavender seeds picked out with a knife, set aside for sowing." },
    { id: "mint_to_seed", output: "seeds_mint", qty: 1, req: { "mint": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka máty ponechaná na osivo.", desc_en: "Mint seeds picked out with a knife, set aside for sowing." },
    { id: "thyme_to_seed", output: "seeds_thyme", qty: 1, req: { "thyme": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka tymiánu ponechaná na osivo.", desc_en: "Thyme seeds picked out with a knife, set aside for sowing." },
    { id: "st_johns_wort_to_seed", output: "seeds_herb", qty: 1, req: { "st_johns_wort": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka třezalky ponechaná na osivo.", desc_en: "St. John's Wort seeds picked out with a knife, set aside for sowing." },
    { id: "sage_to_seed", output: "seeds_sage", qty: 1, req: { "sage": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka šalvěje ponechaná na osivo.", desc_en: "Sage seeds picked out with a knife, set aside for sowing." },
    { id: "fennel_to_seed", output: "seeds_fennel", qty: 1, req: { "fennel": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka fenyklu ponechaná na osivo.", desc_en: "Fennel seeds picked out with a knife, set aside for sowing." },
    { id: "wormwood_to_seed", output: "seeds_wormwood", qty: 1, req: { "wormwood": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka pelynku ponechaná na osivo.", desc_en: "Wormwood seeds picked out with a knife, set aside for sowing." },
    { id: "hyssop_to_seed", output: "seeds_hyssop", qty: 1, req: { "hyssop": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka yzopu ponechaná na osivo.", desc_en: "Hyssop seeds picked out with a knife, set aside for sowing." },
    { id: "yarrow_to_seed", output: "seeds_yarrow", qty: 1, req: { "yarrow": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka řebříčku ponechaná na osivo.", desc_en: "Yarrow seeds picked out with a knife, set aside for sowing." },
    { id: "plantain_to_seed", output: "seeds_plantain", qty: 1, req: { "plantain": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka jitrocele ponechaná na osivo.", desc_en: "Plantain seeds picked out with a knife, set aside for sowing." },

    // Ovoce → semínka (nůž)
    { id: "apple_to_seed", output: "seed_apple", qty: 1, req: { "apple": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá jádra jablka ponechaná na osivo.", desc_en: "Apple seeds cut out with a knife, set aside for sowing." },
    { id: "pear_to_seed", output: "seed_pear", qty: 1, req: { "pear": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá jádra hrušky ponechaná na osivo.", desc_en: "Pear seeds cut out with a knife, set aside for sowing." },
    { id: "plum_to_seed", output: "seed_plum", qty: 1, req: { "plum": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyňatá peckovina švestky ponechaná na osivo.", desc_en: "Plum stone cut out with a knife, set aside for sowing." },
    { id: "cherry_to_seed", output: "seed_cherry", qty: 1, req: { "cherry": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyňatá peckovina třešně ponechaná na osivo.", desc_en: "Cherry stone cut out with a knife, set aside for sowing." },
    { id: "walnut_to_seed", output: "seed_walnut", qty: 1, req: { "walnut": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem rozlousknutý ořech ponechaný na osivo.", desc_en: "Walnut cracked open with a knife, set aside for sowing." },
    { id: "mulberry_to_seed", output: "seed_mulberry", qty: 1, req: { "mulberry": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyloupaná semínka moruše ponechaná na osivo.", desc_en: "Mulberry seeds picked out with a knife, set aside for sowing." },
    { id: "quince_to_seed", output: "seed_quince", qty: 1, req: { "quince": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyříznutá jádra kdoule ponechaná na osivo.", desc_en: "Quince seeds cut out with a knife, set aside for sowing." },
    { id: "sorb_to_seed", output: "seed_sorb", qty: 1, req: { "sorb": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyňatá semínka oskeruše ponechaná na osivo.", desc_en: "Sorb apple seeds cut out with a knife, set aside for sowing." },
    { id: "rowan_to_seed", output: "seed_rowan", qty: 1, req: { "rowan": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem vyňatá semínka jeřabiny ponechaná na osivo.", desc_en: "Rowan berry seeds cut out with a knife, set aside for sowing." },
    { id: "linden_fruit_to_seed", output: "seed_linden", qty: 1, req: { "linden_fruit": 1 }, toolReq: [{item:"stone_knife"}], cat: "craft",
      desc: "Nožem oddělená nažka lípy ponechaná na osivo.", desc_en: "Linden nutlet separated with a knife, set aside for sowing." },
    
    // ALCHEMY - základní
    { id: "candle", output: "candle", qty: 1, req: { "fat": 1, "rope": 1 }, cat: "fire", locked: true }, 
    { id: "glue", output: "glue", qty: 1, req: { "bone": 2, "water": 1 }, cat: "craft", locked: true,
      desc: "Kostní klíh — kosti se hodiny vyvařují, dokud nevznikne hustá želatina.", desc_en: "Bone glue — bones boiled for hours into a thick gelatin." },
    { id: "potion_heal", output: "potion_heal", qty: 1, req: { "herb_red": 1, "fat": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "unguentum_calidum", output: "unguentum_calidum", qty: 1, req: { "comfrey": 2, "lard": 1, "rosemary": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "cannabis_poultice", output: "cannabis_poultice", qty: 1, req: { "cannabis": 2, "pestle": 0 }, cat: "alchemy", locked: true,
      desc: "Rozdrcené konopí na obklad proti revmatu a nachlazení.", desc_en: "Crushed hemp for a poultice against rheumatism and cold." },
    { id: "ash", output: "ash", qty: 1, req: { "charcoal": 4 }, cat: "alchemy", locked: true },
    { id: "ash_from_sticks", output: "ash", qty: 1, req: { "stick": 4 }, cat: "alchemy", locked: true, desc: "Spálené větve. Pomalé, ale bez uhlí.", desc_en: "Burned branches. Slow, but no charcoal needed." },
    { id: "ash_from_log", output: "ash", qty: 2, req: { "log": 1 }, cat: "alchemy", locked: true, desc: "Kulatina dá více popele.", desc_en: "A log yields more ash." },
    { id: "compost", output: "compost", qty: 2, req: { "fiber": 3, "bone": 1, "water": 1 }, cat: "craft", locked: true },
    
    // ALCHEMY - pokročilá
    { id: "antidote", output: "antidote", qty: 1, req: { "nightshade": 1, "honey": 1, "ash": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    // Apothecarius (Infirmarium) — první batch, Contraria contrariis curantur.
    // humor pole = kterej humor tenhle lék léčí (opačná kvalita), pro budoucí
    // automatický párování v Sprint 4 (doručení NPC pacientům).
    { id: "odvar_z_dubenek", output: "odvar_z_dubenek", qty: 1, req: { "gall_nut": 2, "water": 1, "cooking_pot": 0 }, cat: "alchemy", locked: true,
      humor: "sanguis",
      desc: "Svíravej odvar proti krvácení a průjmu — Krev se léčí chladem a suchem.", desc_en: "An astringent decoction against bleeding and flux — Blood is cured by cold and dryness." },
    { id: "mast_ze_lneneho_oleje", output: "mast_ze_lneneho_oleje", qty: 1, req: { "linseed_oil": 2, "pestle": 0 }, cat: "alchemy", locked: true,
      humor: "melancholia",
      desc: "Mast na vyschlé oči a ztuhlé šlachy — Černá žluč se léčí teplem a vlhkem.", desc_en: "A salve for dry eyes and stiff tendons — Black bile is cured by warmth and moisture." },
    { id: "odvar_z_vrby", output: "odvar_z_vrby", qty: 1, req: { "vrbova_kura": 2, "water": 1, "cooking_pot": 0 }, cat: "alchemy", locked: true,
      humor: "cholera",
      desc: "Chladivej odvar proti pálivýmu svědění a horkým kloubům — Žlutá žluč se léčí chladem a vlhkem.", desc_en: "A cooling decoction against burning itch and hot joints — Yellow bile is cured by cold and moisture." },
    { id: "spongia_somnifera", output: "spongia_somnifera", qty: 1, req: { "mandrake": 1, "belladonna": 1, "poppy": 1, "pestle": 0 }, cat: "alchemy", locked: true,
      desc: "Guy de Chauliac — mandragora, rulík, mák. Zmírní šok z těžkýho zranění.", desc_en: "Guy de Chauliac — mandrake, belladonna, poppy. Eases the shock of severe injury." },
    { id: "stamina_tonic", output: "stamina_tonic", qty: 1, req: { "herb_yellow": 1, "honey": 1, "roots": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "preservation_oil", output: "preservation_oil", qty: 1, req: { "resin": 2, "ash": 1, "herb_blue": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    { id: "sleep_potion", output: "sleep_potion", qty: 1, req: { "herb_blue": 2, "mushroom_poison": 1, "honey": 1, "pestle": 0 }, cat: "alchemy", locked: true },
    
    // ========== v7.5 NEW RECIPES - Historical Realities ==========
    
    // VELLUM CHAIN (Pergamen výroba - historicky přesná)
    { id: "ash_water", output: "ash_water", qty: 1, req: { "ash": 2, "water": 3 }, cat: "craft", locked: true, desc: "Louh na namáčení kůže. Historicky 3-4 dny.", desc_en: "Lye for soaking hides. Historically 3-4 days." },
    { id: "raw_hide", output: "raw_hide", qty: 1, req: { "hide": 4 }, cat: "craft", locked: true, desc: "Zpracování a identifikace divoké kůže — vydělání na použitelnou surovou kůži.", desc_en: "Processing and identifying wild hide — curing it into usable raw hide." },
    { id: "wild_leather", output: "wild_leather", qty: 1, req: { "hide": 3 }, cat: "craft", locked: true, desc: "Sedřít a usušit. Bez louhu, bez tříslovin — hrubé, ale rychlé.", desc_en: "Scrape and dry. No lye, no tannins — rough, but quick." },
    { id: "soaked_hide", output: "soaked_hide", qty: 1, req: { "raw_hide": 2, "ash_water": 1 }, cat: "craft", locked: true, desc: "Kůže loužená 3 dny.", desc_en: "Hide soaked for 3 days." },
    { id: "soaked_hide_lime", output: "soaked_hide", qty: 1, req: { "raw_hide": 2, "vapno_hasene_mature": 1 }, cat: "craft", locked: true, desc: "Kůže loužená ve vápenné lázni — rychlejší a čistší než louh.", desc_en: "Hide soaked in a lime bath — faster and cleaner than lye." },
    { id: "stretched_hide", output: "stretched_hide", qty: 1, req: { "soaked_hide": 1, "rope": 2 }, cat: "craft", locked: true, desc: "Napnuto v rámu.", desc_en: "Stretched on a frame." },
    { id: "pumice", output: "pumice", qty: 1, req: { "rock": 3 }, cat: "craft", locked: true, desc: "Sopečný kámen - leští.", desc_en: "Volcanic stone - for smoothing." },
    { id: "vellum", output: "vellum", qty: 1, req: { "stretched_hide": 1, "pumice": 0, "chalk": 1 }, cat: "parchment", locked: true, desc: "Konečný pergamen. 1 kodex = kůže 3 ovcí.", desc_en: "Finished parchment. 1 codex = 3 sheep hides." },
    { id: "premium_soaked_hide", output: "premium_soaked_hide", qty: 1, req: { "lamb_hide": 2, "vapno_hasene_mature": 1 }, cat: "craft", locked: true, desc: "Jehněčí kůže — jen ve vápně, nikdy v louhu.", desc_en: "Lamb hide — lime only, never lye." },
    { id: "premium_soaked_hide_goat", output: "premium_soaked_hide", qty: 1, req: { "goat_hide": 2, "vapno_hasene_mature": 1 }, cat: "craft", locked: true, desc: "Kozí kůže — jen ve vápně, nikdy v louhu.", desc_en: "Goat hide — lime only, never lye." },
    { id: "premium_stretched_hide", output: "premium_stretched_hide", qty: 1, req: { "premium_soaked_hide": 1, "rope": 1 }, cat: "craft", locked: true, desc: "Napnuto v rámu.", desc_en: "Stretched on a frame." },
    { id: "premium_vellum", output: "premium_vellum", qty: 1, req: { "premium_stretched_hide": 1, "pumice": 0, "chalk": 1 }, cat: "parchment", locked: true, desc: "Nejjemnější pergamen. Italský standard.", desc_en: "The finest vellum. The Italian standard." },
    
    // QUILL (Husí brko)
    { id: "quill", output: "quill", qty: 1, req: { "feather": 1, "stone_knife": 0 }, cat: "parchment", locked: true, desc: "Řez pod úhlem. 10x použití.", desc_en: "Cut at an angle. 10 uses." },
    
    // GALLIC INK (Železitoduběnkový inkoust - 15. století standard)
    { id: "iron_sulfate", output: "iron_sulfate", qty: 1, req: { "rock": 2, "ash": 1, "water": 1 }, cat: "parchment", locked: true, desc: "Vitriol. Chemická reakce.", desc_en: "Vitriol. Chemical reaction." },
    { id: "gum_arabic", output: "gum_arabic", qty: 1, req: { "resin": 2, "water": 1 }, cat: "parchment", locked: true, desc: "Pojidlo z akácie.", desc_en: "Binder from acacia." },
    { id: "ink_gallic", output: "ink_gallic", qty: 2, req: { "gall_nut": 2, "iron_sulfate": 1, "gum_arabic": 1, "pestle": 0 }, cat: "parchment", locked: true, desc: "Permanentní. Po 80 letech černá→hnědá.", desc_en: "Permanent. After 80 years black→brown." },
    { id: "ink_netolicky", output: "ink_gallic", qty: 3, req: { "gall_nut": 2, "iron_sulfate": 1, "gum_arabic": 1, "ash": 1, "pestle": 0 }, cat: "parchment", locked: true, desc: "Netolického vlastní receptura — méně duběnek, víc sazí. Vydá o třetinu víc.", desc_en: "Netolický's own formula — fewer galls, more soot. A third more yield." },
    
    // ADVANCED CODEX TYPES
    { id: "common_codex", output: "common_codex", qty: 1, req: { "paper": 10, "ink": 3 }, cat: "codex", locked: true, desc: "Ručně opsaný. 'Nižší typografie' (Voit).", desc_en: "Hand-copied. 'Lower typography' (Voit)." },
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
        req: { stick: 3, wild_leather: 2, bone: 2 },
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
    { id: "tanned_leather_bark", output: "leather", qty: 1, req: { stretched_hide: 2, tanbark: 3 }, cat: "craft", locked: true,
      desc: "Vydělená kůže tříslem ze stoupy. Hrubší lázeň, stejný výsledek — a duběnky zbudou na inkoust.", desc_en: "Leather tanned with stamp-mill bark. A coarser bath, the same result — and the galls are spared for ink." },

    // Měchy — dual use: oheň + varhany + Athanor upgrade
    { id: "bellows", output: "bellows", qty: 1, req: { wild_leather: 4, stick: 3, rope: 2 }, cat: "craft", locked: true,
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
    { id: "book_cover", output: "book_cover", qty: 1, req: { leather: 3, plank: 2 }, cat: "craft", locked: true,
      desc: "Dřevěná deska potažená kůží. Chrání kodex po staletí.", desc_en: "Wooden board covered in leather. Protects the codex for centuries." },

    // ═══════════════════════════════════════════════════════════════════════════
    // KNIHAŘSTVÍ — plný řetězec vazby (Enchiridion)
    // ═══════════════════════════════════════════════════════════════════════════
    { id: "linen_thread", output: "linen_thread", qty: 1, req: { flax_fiber: 3 }, cat: "craft", locked: true,
      desc: "Spředená lněná vlákna do nitě.", desc_en: "Linen fibres spun into thread." },
    { id: "leather_cords", output: "leather_cords", qty: 2, req: { leather: 1 }, cat: "craft", locked: true,
      desc: "Kůže nařezaná na tenké vazy pro vazadlo.", desc_en: "Leather cut into thin cords for the sewing frame." },
    { id: "metal_clasps", output: "metal_clasps", qty: 2, req: { iron_ingot: 1 }, cat: "iron", locked: true,
      desc: "Kované spony s okem na kožený řemínek.", desc_en: "Forged clasps with an eye for the leather strap." },
    { id: "metal_bosses", output: "metal_bosses", qty: 4, req: { iron_ingot: 1 }, cat: "iron", locked: true,
      desc: "Rohové a středové hrboly na desky.", desc_en: "Corner and centre bosses for the boards." },
    { id: "quires", output: "quires", qty: 1, req: { vellum: 1, ink_gallic: 2 }, cat: "codex", locked: true,
      desc: "Popsaný pergamen přehnutý do kvaternů.", desc_en: "Written vellum folded into quaternions." },
    { id: "sewn_block", output: "sewn_block", qty: 1, req: { quires: 4, linen_thread: 2, leather_cords: 2 }, cat: "codex", locked: true,
      desc: "Složky sešité na vazadle, nit po nitě.", desc_en: "Quires sewn on the frame, thread by thread." },
    { id: "unfitted_codex", output: "unfitted_codex", qty: 1, req: { sewn_block: 1, plank: 2, leather: 2 }, cat: "codex", locked: true,
      desc: "Blok mezi deskami, potažený kůží. Čeká na kováře.", desc_en: "Block between boards, covered in leather. Awaiting the smith." },

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
    { id: "plank_from_log", output: "plank", qty: 7, req: { log: 1 }, toolReq: [{item:"stone_saw"},{item:"iron_saw"}], cat: "craft", locked: true,
      desc: "Fošny nařezané z kulatiny pilou.", desc_en: "Planks sawn from a log with a saw." },

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
    { id:"palice_kamenna",output:"palice_kamenna",qty:1, req:{stick:2, rock:3, rope:1}, cat:"stone", locked:true,
      desc:"Těžké kladivo z opracovaného kamene. Láme vápenec.", desc_en:"A heavy mallet of worked stone. Breaks limestone." },
    { id:"stone_shovel", output:"stone_shovel", qty:1, req:{stick:2, rock:2, rope:1}, cat:"stone", locked:true,
      desc:"Plochý kámen jako lopata.", desc_en:"Flat stone as a shovel." },
    { id:"stone_saw",    output:"stone_saw",    qty:1, req:{stick:2, flint:2, cut_stone:3, rope:2}, cat:"stone", locked:true,
      desc:"Pila z křemenných úštěpků.", desc_en:"Saw of flint chips." },

    // ── DŘEVĚNÉ NÁSTROJE ─────────────────────────────────────────────────────
    { id:"bucket",       output:"bucket",       qty:1, req:{plank:3, rope:2},          cat:"craft", locked:true,
      desc:"Dřevěné vědro na vodu.", desc_en:"Wooden bucket for water." },
    { id:"watering_can", output:"watering_can", qty:1, req:{plank:2, rope:2, wild_leather:1}, cat:"craft", locked:true,
      desc:"Konev na zalévání zahrady.", desc_en:"Watering can for the garden." },
    { id:"barrel_tool",  output:"barrel_tool",  qty:1, req:{plank:6, rope:3},           cat:"craft", locked:true,
      desc:"Dřevěný sud na pivo, víno a vodu.", desc_en:"Wooden barrel for ale, wine and water." },
    { id:"bedna", output:"bedna", qty:1, req:{plank:8, rope:2}, cat:"craft", locked:true,
      desc:"Dřevěná bedna. +30 jednotek skladu v Inventariu.", desc_en:"Wooden crate. +30 units of storage in the Inventarium." },
    { id:"convert_barrel_to_container", output:"storage_container", qty:1, req:{barrel_tool:1}, cat:"craft", locked:true,
      desc:"Přestavba sudu na skladovací kontejner. +50 jednotek skladu v Inventariu.", desc_en:"Rebuilding a barrel into a storage container. +50 units of storage in the Inventarium." },

    // ── ŽELEZNÝ VÝROBNÍ ŘETĚZEC ─────────────────────────────────────────────
    { id:"iron_ingot", output:"iron_ingot", qty:1, req:{iron_ore:3, charcoal:2}, cat:"iron", locked:true,
      desc:"Tavení rudy s uhlím. Základ kovářství.", desc_en:"Smelting ore with charcoal. Foundation of smithcraft." },

    // ── KOVOVÉ NÁSTROJE (tech_kovarina, max 1 ks) ────────────────────────────
    { id:"iron_axe",    output:"iron_axe",    qty:1, req:{iron_ingot:2, plank:1, rope:1, wild_leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Masivní sekera. 2 ingoty na hlavu, kůže na opich.", desc_en:"Heavy axe. 2 ingots for the head, leather grip." },
    { id:"iron_spade",  output:"iron_spade",  qty:1, req:{iron_ingot:1, plank:2, rope:1},            cat:"iron", locked:true, maxStack:1,
      desc:"Železná čepel. 2 prkna: násada a opěrka nohy.", desc_en:"Iron blade. 2 planks: shaft and foot rest." },
    { id:"iron_scythe", output:"iron_scythe", qty:1, req:{iron_ingot:2, stick:3, rope:2, wild_leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Dlouhá zahnutá čepel. Historicky 3dílná rukojeť.", desc_en:"Long curved blade. Historically 3-piece handle." },
    { id:"iron_sickle", output:"iron_sickle", qty:1, req:{iron_ingot:1, stick:1, rope:1, wild_leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Zahnutá čepel, krátká rukojeť, kůže na opich.", desc_en:"Curved blade, short handle, leather wrapping." },
    { id:"iron_flail",  output:"iron_flail",  qty:1, req:{iron_ingot:1, stick:3, rope:2, wild_leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Železné závaží, 3dílná rukojeť, provazový kloub.", desc_en:"Iron weight, 3-piece handle, rope joint." },
    { id:"iron_shovel", output:"iron_shovel", qty:1, req:{iron_ingot:1, plank:2, rope:1},            cat:"iron", locked:true, maxStack:1,
      desc:"Širší čepel než rýč. 2 prkna na pevnou násadu.", desc_en:"Wider blade than spade. 2 planks for a firm shaft." },
    { id:"iron_saw",    output:"iron_saw",    qty:1, req:{iron_ingot:2, plank:1, wild_leather:1},         cat:"iron", locked:true, maxStack:1,
      desc:"Pilový list s mnoha zuby. 2 ingoty, dřevěný rám.", desc_en:"Saw blade with many teeth. 2 ingots, wooden frame." },
    { id:"iron_pickaxe",output:"iron_pickaxe",qty:1, req:{iron_ingot:2, stick:2, rope:1, wild_leather:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Těžká dvojitá hlava. 2 ingoty, dvojnásada.", desc_en:"Heavy double head. 2 ingots, double-hafted." },
    { id:"palice_zelezna",output:"palice_zelezna",qty:1, req:{iron_ingot:2, plank:1}, cat:"iron", locked:true, maxStack:1,
      desc:"Kované kladivo s železnou hlavou. Nejlepší na vápenec.", desc_en:"A forged mallet with an iron head. Best for limestone." },
    { id:"iron_tongs",  output:"iron_tongs",  qty:1, req:{iron_ingot:1, wild_leather:1},                  cat:"iron", locked:true, maxStack:1,
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
      req:{plank:12, iron_ingot:4, rope:5, wild_leather:2},
      cat:"building", locked:true, maxStack:1,
      desc:"Bednářská dílna. Výroba sudů pro export vína. Odemkne řemeslo bednáře.",
      desc_en:"Cooperage workshop. Craft barrels for wine export. Unlocks the cooper's craft." },

    // ── VČELÍN — Velký úl (Custos Apium, tier 1–2) ─────────────────────────────
    { id:"velky_ul_1",        output:"velky_ul_1",        qty:1,
      req:{log:15, rope:8, kovani:3},
      cat:"building", locked:true, maxStack:1,
      desc:"Zesílená konstrukce úlu — kulatina, lano a kování od kováře. Odemyká vylepšené včelstvo.",
      desc_en:"A reinforced hive structure — logs, rope, and blacksmith's ironwork. Unlocks an improved colony." },

    { id:"velky_ul_2",        output:"velky_ul_2",        qty:1,
      req:{velky_ul_1:1, log:25, rope:12, kovani:6},
      cat:"building", locked:true, maxStack:1,
      desc:"Dostavba Velkého úlu na plnou míru. Nejsilnější staveniště pro včelstvo v klášteře.",
      desc_en:"The Great Hive built out to its full measure. The strongest apiary structure in the monastery." },

    // ── VÁPENICE — pálení a hašení vápna (budova sama je v buildStorage()) ──
    { id:"burn_lime",  output:"vapno_paleny_fresh",  qty:1, req:{vapenec:4, log:3}, cat:"craft", locked:true,
      desc:"Vápenec do pece. Dny a noci ohně, než se vypálí.", desc_en:"Limestone into the kiln. Days and nights of fire before it burns through." },
    { id:"slake_lime", output:"vapno_hasene_fresh",  qty:2, req:{vapno_paleny_mature:1, water:2}, cat:"craft", locked:true,
      desc:"Pálené vápno uhašené vodou. Prudká reakce — teď musí uležet.", desc_en:"Quicklime slaked with water. A violent reaction — now it must rest." },
];
// ── KADIDLO (Thuribulum) ─────────────────────────────────────────────────
RecipesDB.push(
    { id: "incense_spruce",   output: "incense_spruce",   qty: 1, req: { "resin_spruce": 1, "charcoal": 1 }, cat: "fire", locked: true, desc: "Smrková pryskyřice + uhlí = primitivní kadidlo.", desc_en: "Spruce resin + charcoal = basic incense." },
    { id: "incense_pine",     output: "incense_pine",     qty: 1, req: { "resin_pine": 1,   "charcoal": 1 }, cat: "fire", locked: true, desc: "Borová pryskyřice + uhlí = vonné kadidlo.", desc_en: "Pine resin + charcoal = fragrant incense." },
    { id: "incense_styrax",   output: "incense_styrax",   qty: 1, req: { "resin_styrax": 1, "charcoal": 1 }, cat: "fire", locked: true, desc: "Styrax + uhlí = byzantské kadidlo.", desc_en: "Styrax + charcoal = Byzantine incense." },
    { id: "incense_olibanum", output: "incense_olibanum", qty: 1, req: { "resin_olibanum": 1, "charcoal": 1 }, cat: "fire", locked: true, desc: "Olibanum + uhlí = posvátné kadidlo.", desc_en: "Olibanum + charcoal = sacred incense." }
);