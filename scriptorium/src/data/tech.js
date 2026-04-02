const TechTree = [
    // TIER 1
    { id:"tech_candle",          name:"Zpracování Tuku",           name_en:"Fat Rendering",              cost:2,  desc:"Odemkne: Svíčky",                              desc_en:"Unlocks: Candles",                      unlocks:["candle"] },
    { id:"tech_backpack",        name:"Organizace Batohu",         name_en:"Satchel Organisation",       cost:3,  desc:"Odemkne: Třídění předmětů",                    desc_en:"Unlocks: Item sorting",                 unlocks:[] },
    { id:"tech_alchemy_1",       name:"Základy Bylinkářství",      name_en:"Herbalism Basics",           cost:3,  desc:"Odemkne: Hojivá mast",                         desc_en:"Unlocks: Healing salve",                unlocks:["potion_heal"] },

    // TIER 2 - cooking
    { id:"tech_cooking_1",       name:"Vaření",                    name_en:"Cooking",                    cost:4,  desc:"Odemkne: Hrnec, pečení",                       desc_en:"Unlocks: Cooking pot, roasting",        unlocks:["cooking_pot","cooked_meat","cooked_fish","bread"] },
    { id:"tech_fishing",         name:"Rybolov",                   name_en:"Fishing",                    cost:3,  desc:"Odemkne: Udice",                               desc_en:"Unlocks: Fishing rod",                  unlocks:["fishing_rod"] },
    { id:"tech_foraging",        name:"Sběr Potravy",              name_en:"Foraging",                   cost:3,  desc:"Odemkne: Koš, houby",                          desc_en:"Unlocks: Basket, mushrooms",            unlocks:["basket"] },
    { id:"tech_cooking_2",       name:"Pokročilé Vaření",          name_en:"Advanced Cooking",           cost:5,  desc:"Odemkne: Guláš, polévky",                      desc_en:"Unlocks: Stew, pottages",               unlocks:["stew","mushroom_soup","berry_pie"], requires:["tech_cooking_1"] },

    // TIER 2 - horticulture
    { id:"tech_garden_expand",   name:"Rozšíření Zahrady",         name_en:"Garden Expansion",           cost:4,  desc:"Odemkne: 4 políčka",                           desc_en:"Unlocks: 4 garden plots",               unlocks:[] },
    { id:"tech_herbalism_2",     name:"Pokročilé Bylinkářství",    name_en:"Advanced Herbalism",         cost:4,  desc:"Odemkne: Nové byliny",                         desc_en:"Unlocks: New herbs",                    unlocks:[] },
    { id:"tech_composting",      name:"Kompostování",              name_en:"Composting",                 cost:3,  desc:"Odemkne: Kompost",                             desc_en:"Unlocks: Compost",                      unlocks:["compost"] },

    // TIER 3 - alchemy
    { id:"tech_alchemy_2",       name:"Alchymie Úrovně 2",         name_en:"Alchemy Level 2",            cost:5,  desc:"Odemkne: Protijed, popel",                     desc_en:"Unlocks: Antidote, ash",                unlocks:["antidote","ash"], requires:["tech_alchemy_1"] },
    { id:"tech_alchemy_3",       name:"Alchymie Úrovně 3",         name_en:"Alchemy Level 3",            cost:6,  desc:"Odemkne: Tonikum, olej",                       desc_en:"Unlocks: Tonic, preservation oil",      unlocks:["stamina_tonic","preservation_oil"], requires:["tech_alchemy_2"] },
    { id:"tech_alchemy_4",       name:"Mistrovská Alchymie",       name_en:"Master Alchemy",             cost:8,  desc:"Odemkne: Lektvar spánku",                      desc_en:"Unlocks: Sleep draught",                unlocks:["sleep_potion"], requires:["tech_alchemy_3"] },

    // TIER 4 - Klášterní tradice
    { id:"tech_monastery_wisdom",name:"Klášterní Moudrost",        name_en:"Monastic Wisdom",            cost:10, desc:"Studium českých klášterů (Břevnov 993, Zlatá Koruna 1263). Mniši uchovávali znalosti tisíc let.", desc_en:"Study of Bohemian monasteries (Břevnov 993, Zlatá Koruna 1263). Monks preserved knowledge for a thousand years.", unlocks:[] },
    { id:"tech_czech_herbs",     name:"České Bylinkářství",        name_en:"Bohemian Herbalism",         cost:8,  desc:"Měsíček, třezalka, dobromysl — české léčivé byliny od 12. století.", desc_en:"Calendula, St. John's Wort, marjoram — Bohemian healing herbs since the 12th century.", unlocks:[], requires:["tech_alchemy_2"] },
    { id:"tech_advanced_farming",name:"Pokročilé Farmaření",       name_en:"Advanced Farming",           cost:9,  desc:"Klášterní zahrady na Strahově pěstovaly 500 druhů rostlin. +50% rychlejší růst!", desc_en:"The Strahov monastery gardens cultivated 500 plant species. +50% faster growth!", unlocks:[], requires:["tech_garden_expand"] },
    { id:"tech_preservation",    name:"Konzervace Potravin",       name_en:"Food Preservation",          cost:7,  desc:"Kláštery uchovávaly semena v medu 50+ let. Jídlo vydrží 2x déle!", desc_en:"Monasteries stored seeds in honey for 50+ years. Food lasts twice as long!", unlocks:[], requires:["tech_cooking_2"] },

    // TIER 5 - Mistrovské umění
    { id:"tech_master_alchemist",name:"Mistr Alchymista",          name_en:"Master Alchemist",           cost:12, desc:"Rudolf II. shromáždil 300 alchymistů v Praze (1583). Vrchol středověké alchymie.", desc_en:"Rudolf II gathered 300 alchemists in Prague (1583). The pinnacle of medieval alchemy.", unlocks:[], requires:["tech_alchemy_4"] },
    { id:"tech_illumination",    name:"Iluminace Rukopisů",        name_en:"Manuscript Illumination",    cost:10, desc:"Umění zdobení rukopisů zlatem a drahokamy. České iluminované bible — vrchol středověku.", desc_en:"The art of decorating manuscripts with gold and gems. Bohemian illuminated bibles — the pinnacle of the Middle Ages.", unlocks:[], requires:["tech_monastery_wisdom"] },
    { id:"tech_astrology",       name:"Astrologie",                name_en:"Astrology",                  cost:11, desc:"Tycho Brahe zemřel v Praze (1601). Pražský orloj (1410) ukazuje pozice planet.", desc_en:"Tycho Brahe died in Prague (1601). The Prague Orloj (1410) tracks planetary positions.", unlocks:[], requires:["tech_monastery_wisdom"] },
    { id:"tech_czech_glass",     name:"České Sklářství",           name_en:"Bohemian Glasswork",         cost:10, desc:"České sklářství 13. stol bylo nejlepší v Evropě. Benátky kopírovaly naše techniky.", desc_en:"13th-century Bohemian glasswork was the finest in Europe. Venice copied our techniques.", unlocks:[], requires:["tech_master_alchemist"] },

    // GAMES
    { id:"tech_games",           name:"Hry a Záznamy",             name_en:"Games & Records",            cost:8,  desc:"Středověké hry.",                              desc_en:"Medieval games.",                       unlocks:["playing_cards"], requires:["tech_monastery_wisdom"] },
    { id:"tech_iching",          name:"Starověká Moudrost",        name_en:"Ancient Wisdom",             cost:8,  desc:"Prostudoval jsi záhadné texty z Dálného východu. Kniha Proměn odhaluje skrytý řád věcí.", desc_en:"Thou hast studied strange texts from the Far East. The Book of Changes revealeth a hidden order.", unlocks:["recipe_iching_book"], requires:["tech_alchemy_2"] },
    { id:"tech_ur_game",         name:"Starobylé Hry",             name_en:"Ancient Games",              cost:6,  desc:"Královská hra z Uru (2600 př.n.l.) — starší než pyramidy!",    desc_en:"The Royal Game of Ur (2600 BC) — older than the pyramids!", unlocks:["ur_board"], requires:["tech_games"] },
    { id:"tech_primero",         name:"Primero",                   name_en:"Primero",                    cost:10, desc:"Předchůdce pokeru. Jindřich VIII prohrál jmění! (1530)",       desc_en:"Ancestor of poker. Henry VIII lost a fortune at it! (1530)", unlocks:["primero_deck"], requires:["tech_games"] },
    { id:"tech_karnoffel",       name:"Karnöffel",                 name_en:"Karnöffel",                  cost:12, desc:"Nejstarší trumfová hra Evropy! Norimberk 1426. Církev ji zakazovala.", desc_en:"The oldest trump card game in Europe! Nuremberg 1426. The Church banned it.", unlocks:["karnoffel_deck"], requires:["tech_primero"] },
    { id:"tech_freecell",        name:"Solitér Mistryně",          name_en:"Master Solitaire",           cost:15, desc:"Logické karetní hádanky. Trénink paměti a strategie pro mnichy.", desc_en:"Logical card puzzles. Memory and strategy training for monks.", unlocks:["french_deck"], requires:["tech_karnoffel"] },
    { id:"tech_rithmomachia",    name:"Filozofická Matematika",    name_en:"Philosophical Mathematics",  cost:20, desc:"Rithmomachia — Bitva čísel (1030). Vyučováno na univerzitách! Pythagorejská harmonie.", desc_en:"Rithmomachia — Battle of Numbers (1030). Taught at universities! Pythagorean harmony.", unlocks:["rithmomachia_board"], requires:["tech_freecell"] },

    // WELL
    { id:"tech_well_basic",       name:"Studnařství",              name_en:"Well Digging",               cost:5,  desc:"Naučíš se hloubit studnu. Přístup k čisté vodě.",     desc_en:"Learn to dig a well. Access to clean water.", unlocks:["well_basic"], requires:[] },
    { id:"tech_water_bucket",     name:"Větší Nádoby",             name_en:"Larger Vessels",             cost:4,  desc:"Vylepšené vědro přináší více vody najednou.",         desc_en:"A larger bucket draws more water at once.", unlocks:["bucket"], requires:["tech_well_basic"] },
    { id:"tech_well_maintenance", name:"Údržba Studny",            name_en:"Well Maintenance",           cost:6,  desc:"Naučíš se rozpoznat znečištění a opravit poškození.", desc_en:"Learn to detect contamination and repair damage.", unlocks:["purification_powder","repair_kit"], requires:["tech_well_basic","tech_alchemy_2"] },
    { id:"tech_well_stone",       name:"Kamenná Studna",           name_en:"Stone Well",                 cost:8,  desc:"Vyzdít studnu kamenem — vydrží déle, dává čistší vodu.", desc_en:"Line the well with stone — lasts longer, yields cleaner water.", unlocks:["well_upgrade_stone"], requires:["tech_well_basic","tech_well_maintenance"] },

    // NOTEBOOKS
    { id:"tech_writing_basics",   name:"Základy Psaní",            name_en:"Writing Basics",             cost:3,  desc:"Voskové destičky pro dočasné poznámky.",    desc_en:"Wax tablets for temporary notes.",       unlocks:["tabula"], requires:[] },
    { id:"tech_commonplace",      name:"Pracovní Zápisníky",       name_en:"Commonplace Books",          cost:5,  desc:"Trvalé poznámky v kožených sešitech.",      desc_en:"Permanent notes in leather notebooks.",  unlocks:["adversaria"], requires:["tech_writing_basics"] },
    { id:"tech_portable_wisdom",  name:"Kapesní Moudrost",         name_en:"Portable Wisdom",            cost:6,  desc:"Vademecum s přenosnými poznámkami.",        desc_en:"A vademecum of portable notes.",          unlocks:["vademecum"], requires:["tech_commonplace"] },
    { id:"tech_lore_collection",  name:"Sbírání Moudrosti",        name_en:"Collecting Wisdom",          cost:7,  desc:"Florilegium pro sběr citátů z knihovny.",   desc_en:"A florilegium for gathering library quotes.", unlocks:["florilegium"], requires:["tech_commonplace","tech_monastery_wisdom"] },
    { id:"tech_master_manual",    name:"Mistrovský Manuál",        name_en:"Master Manual",              cost:8,  desc:"Enchiridion — ultimate notebook systém.",   desc_en:"Enchiridion — the ultimate notebook system.", unlocks:["enchiridion"], requires:["tech_portable_wisdom","tech_lore_collection"] },

    // VELLUM
    { id:"tech_vellum_prep",      name:"Příprava Pergamenu",       name_en:"Vellum Preparation",         cost:5,  desc:"Loužení kůže ve vápenné lázni. Historicky 3–4 dny.", desc_en:"Soaking hide in lime water. Historically 3–4 days.", unlocks:["soaked_hide","stretched_hide"], requires:[] },
    { id:"tech_vellum_mastery",   name:"Mistrovství Pergamenu",    name_en:"Vellum Mastery",             cost:7,  desc:"Leštění pemzou, bělení křídou. 1 kodex = kůže 3 ovcí. Jak Olomoucký misál (1488).", desc_en:"Smoothing with pumice, whitening with chalk. 1 codex = 3 sheepskins. As the Olomouc Missal (1488).", unlocks:["vellum","pumice"], requires:["tech_vellum_prep"] },

    // SCRIBE TOOLS & INK
    { id:"tech_scribe_tools",     name:"Nástroje Písaře",          name_en:"Scribe's Tools",             cost:4,  desc:"Husí brko — historický nástroj. 10x použití, +2 ink per craft.", desc_en:"The goose quill — the scribe's tool. 10 uses, +2 ink per craft.", unlocks:["quill"], requires:[] },
    { id:"tech_gallic_ink",       name:"Železitoduběnkový Inkoust",name_en:"Iron Gall Ink",              cost:6,  desc:"Duběnky + vitriol + arabská guma. Standard 15. století. Permanentní, ale prožírá po 80 letech.", desc_en:"Oak galls + vitriol + gum arabic. 15th-century standard. Permanent, but eats through vellum after 80 years.", unlocks:["ink_gallic","iron_sulfate","gum_arabic"], requires:["tech_alchemy_2"] },

    // CODEX
    { id:"tech_codex_basic",      name:"Běžná Typografie",         name_en:"Common Typography",          cost:8,  desc:"'Nižší typografie' (Voit) — rychlý papírový tisk.", desc_en:"'Lower typography' (Voit) — fast paper printing.", unlocks:["common_codex"], requires:[] },
    { id:"tech_codex_luxury",     name:"Vyšší Typografie",         name_en:"Luxury Typography",          cost:10, desc:"Individuálně pořizované iniciály, kvalitní inkoust. Pro šlechtu a kláštery.", desc_en:"Individual initials, quality ink. For nobility and monasteries.", unlocks:["luxury_codex"], requires:["tech_codex_basic","tech_gallic_ink"] },
    { id:"tech_codex_vellum",     name:"Pergamenové Kodexy",       name_en:"Vellum Codices",             cost:12, desc:"Na pergamenu. Jak 20 z 420 výtisků Olomouckého misálu. Věčné, ale drahé.", desc_en:"On vellum. Like 20 of the 420 copies of the Olomouc Missal. Eternal, but costly.", unlocks:["vellum_codex"], requires:["tech_vellum_mastery","tech_codex_luxury"] },

    // CANONICAL HOURS
    { id:"tech_canonical_hours",  name:"Kanonické Hodiny",         name_en:"Canonical Hours",            cost:10, desc:"Benediktinský denní řád: Vigilie, Laudes, Prima, Sexta, Nona, Vesperae, Completorium. Odemkne systém časových buffů.", desc_en:"The Benedictine daily order: Vigils, Lauds, Prime, Sext, None, Vespers, Compline. Unlocks time-based buffs.", unlocks:["book_of_hours"], requires:["tech_monastery_wisdom","tech_codex_luxury"] },

    // CELLARIUM
    { id:"tech_cellarium",        name:"Celerář — Skladník Kláštera", name_en:"Cellarer — Monastic Steward", cost:8, desc:"Bratr Celerář každé ráno přiděloval práci a inventář. Automatická organizace zásob.", desc_en:"The Brother Cellarer assigned work and inventory each morning. Automatic supply organisation.", unlocks:[], requires:["tech_monastery_wisdom"] },

    // PRINTING ENDGAME
    { id:"tech_printing_basics",  name:"Základy Knihtisku",        name_en:"Printing Basics",            cost:15, desc:"Tavení olova na litery. Gutenbergův vynález (1450). Revoluce.", desc_en:"Casting lead into type. Gutenberg's invention (1450). A revolution.", unlocks:["lead_alloy","printing_type"], requires:["tech_codex_luxury"] },
    { id:"tech_privilegium",      name:"Tiskařské Privilegium",    name_en:"Printing Privilege",         cost:20, desc:"Biskupská pečeť. Monopol na tisk. Melantrich to dosáhl roku 1552. Endgame unlock.", desc_en:"The bishop's seal. A monopoly on printing. Melantrich achieved this in 1552. Endgame unlock.", unlocks:["bishop_seal","printing_privilege"], requires:["tech_printing_basics","tech_codex_vellum"] },
];
