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
    { id:"tech_garden_expand",   name:"Rozšíření Zahrady",         name_en:"Garden Expansion",           cost:4,  desc:"Odemkne: 4 políčka zahrady.",                  desc_en:"Unlocks: 4 garden plots.",              unlocks:[] },
    { id:"tech_garden_expand_2", name:"Větší Zahrada",             name_en:"Larger Garden",              cost:7,  desc:"Klášterní zahrada v Břevnově měla přes 200 druhů rostlin. Odemkne: 6 políček.", desc_en:"The Břevnov monastery garden held over 200 plant species. Unlocks: 6 plots.", unlocks:[], requires:["tech_garden_expand"] },
    { id:"tech_piscina",         name:"De Piscibus",               name_en:"De Piscibus",                cost:8,  desc:"Středověké kláštery chovaly kapry v rybníce pro dny půstu. Odemkne: Rybník (Piscina).", desc_en:"Medieval monasteries raised carp in ponds for fast days. Unlocks: Pond (Piscina).", unlocks:[], requires:["tech_garden_expand"] },
    { id:"tech_garden_expand_3", name:"Zahrada sv. Hildegardy",    name_en:"Hildegard's Garden",         cost:10, desc:"Hildegarda z Bingenu popsala 230 rostlin ve Physica. Odemkne: 8 políček.", desc_en:"Hildegard of Bingen described 230 plants in Physica. Unlocks: 8 plots.", unlocks:[], requires:["tech_garden_expand_2"] },
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
    { id:"tech_games",           name:"Aula Ludi",                name_en:"Aula Ludi",                  cost:8,  desc:"Středověké hry a zábava.",                         desc_en:"Medieval games and entertainment.",             unlocks:["playing_cards"], requires:[] },
    { id:"tech_iching",          name:"Starověká Moudrost",        name_en:"Ancient Wisdom",             cost:8,  desc:"Prostudoval jsi záhadné texty z Dálného východu. Kniha Proměn odhaluje skrytý řád věcí.", desc_en:"Thou hast studied strange texts from the Far East. The Book of Changes revealeth a hidden order.", unlocks:["recipe_iching_book"], requires:["tech_alchemy_2"] },
    { id:"tech_ur_game",         name:"Starobylé Hry",             name_en:"Ancient Games",              cost:6,  desc:"Královská hra z Uru (2600 př.n.l.) — starší než pyramidy!",    desc_en:"The Royal Game of Ur (2600 BC) — older than the pyramids!", unlocks:["ur_board"], requires:["tech_games"] },
    { id:"tech_primero",         name:"Primero",                   name_en:"Primero",                    cost:10, desc:"Předchůdce pokeru. Jindřich VIII prohrál jmění! (1530)",       desc_en:"Ancestor of poker. Henry VIII lost a fortune at it! (1530)", unlocks:["primero_deck"], requires:["tech_games"] },
    { id:"tech_karnoffel",       name:"Karnöffel",                 name_en:"Karnöffel",                  cost:12, desc:"Nejstarší trumfová hra Evropy! Norimberk 1426. Církev ji zakazovala.", desc_en:"The oldest trump card game in Europe! Nuremberg 1426. The Church banned it.", unlocks:["karnoffel_deck"], requires:["tech_primero"] },
    { id:"tech_freecell",        name:"Solitér Mistryně",          name_en:"Master Solitaire",           cost:15, desc:"Logické karetní hádanky. Trénink paměti a strategie pro mnichy.", desc_en:"Logical card puzzles. Memory and strategy training for monks.", unlocks:["french_deck"], requires:["tech_karnoffel"] },
    { id:"tech_rithmomachia",    name:"Filozofická Matematika",    name_en:"Philosophical Mathematics",  cost:20, desc:"Rithmomachia — Bitva čísel (1030). Vyučováno na univerzitách! Pythagorejská harmonie.", desc_en:"Rithmomachia — Battle of Numbers (1030). Taught at universities! Pythagorean harmony.", unlocks:["rithmomachia_board"], requires:["tech_freecell"] },
    { id:"tech_senet",           name:"Senet — Hra Faraonů",      name_en:"Senet — Game of Pharaohs",   cost:6,  desc:"Nejstarší desková hra světa (3100 př.n.l.). Egyptští faraoni ji hráli na cestu do záhrobí.", desc_en:"The world's oldest board game (3100 BC). Egyptian pharaohs played it for their journey to the afterlife.", unlocks:["senet_board"], requires:["tech_games"] },
    { id:"tech_backgammon",      name:"Tables — Cesta Kamenů",    name_en:"Tables — Journey of Stones", cost:8,  desc:"Předchůdce vrhcábů. Kostky + strategie. Oblíbené v klášterech i v krčmách.", desc_en:"Ancestor of backgammon. Dice + strategy. Beloved in monasteries and taverns alike.", unlocks:["backgammon_board"], requires:["tech_senet"] },
    { id:"tech_draughts",        name:"Dáma — Hra Dam a Pánů",    name_en:"Draughts — Game of Ladies",  cost:10, desc:"Jednoduchá pravidla, hluboká strategie. Z arabské hry Alquerque (10. stol.).", desc_en:"Simple rules, deep strategy. From the Arabic game Alquerque (10th cent.).", unlocks:["draughts_board"], requires:["tech_backgammon"] },
    { id:"tech_hnefatafl",       name:"Hnefatafl — Královská Hra", name_en:"Hnefatafl — King's Game",   cost:14, desc:"Hra Vikingů (400–1100 n.l.). Asymetrická — král prchá, útočníci loví. Zmizel s příchodem šachů.", desc_en:"Viking game (400–1100 AD). Asymmetric — the king flees, warriors hunt. Vanished with the arrival of chess.", unlocks:["hnefatafl_board"], requires:["tech_draughts"] },

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
    { id:"tech_tanning",          name:"Koželužství",               name_en:"Tanning",                    cost:6,  desc:"Třísloviny z duběnek zpevní kůži. Základ každého skriptoria.", desc_en:"Gall nut tannins harden the hide. The foundation of every scriptorium.", unlocks:["tanned_leather","bellows","scrinium_case","water_pouch","ink_pouch"], requires:["tech_vellum_prep"] },
    { id:"tech_bookbinding",      name:"Vazba Knih",                name_en:"Book Binding",               cost:8,  desc:"Kožená vazba, deska a pouzdra. Z volných listů se stává kodex.", desc_en:"Leather binding, boards and cases. Loose leaves become a codex.", unlocks:["book_binding","book_cover","quill_case","scribes_belt","cushion"], requires:["tech_tanning"] },
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

    // ECONOMY
    { id:"tech_commercium",     name:"Commercium — Stezky Kupců",   name_en:"Commercium — Merchant Routes",   cost:6,  desc:"Klášter není ostrovem. Za hradbami prochází svět — a s ním i ti, kdo nesou zboží z daleké Benátky, z Říma, z Levanty. Nauč se rozpoznat příchod kupce, otevři bránu a naslouchej. Někdy přiveze surovinu, jindy příběh — a oboje má svou cenu.", desc_en:"The monastery is no island. Beyond its walls the world passes by — and with it those who carry goods from distant Venice, from Rome, from the Levant. Learn to recognise the merchant's arrival, open the gate and listen. Sometimes he brings a raw material, sometimes a story — and both have their price.", unlocks:[], requires:[] },
    { id:"tech_cellarium_rd2",  name:"Cellarium — Řád Sklepa",      name_en:"Cellarium — Order of the Cellar", cost:8,  desc:"Každý klášter má své srdce v kapli, ale své střevo ve sklepě. Cellarius není jen správce sudů a pytlů — je to muž, který ví, co klášter potřebuje, co může prodat a za kolik. Bez něj jsi jen mnichem s plnýma rukama a prázdnou kapsou.", desc_en:"Every monastery has its heart in the chapel, but its belly in the cellar. The Cellarius is no mere keeper of barrels and sacks — he is the man who knows what the monastery needs, what it can sell, and for how much. Without him thou art but a monk with full hands and an empty purse.", unlocks:[], requires:["tech_commercium"] },
    { id:"tech_numismatica",    name:"Numismatica — Věda o Groších", name_en:"Numismatica — The Science of Groschen", cost:10, desc:"Pražský groš je malý, ale těžký. Nese na sobě korunu, lva i latinský nápis — a v pravých rukou otevírá více dveří než modlitba. Nauč se počítat, nakupovat, prodávat. Hospoda, obchod, trh — každé místo má svůj rytmus a svou cenu.", desc_en:"The Prague groschen is small, but heavy. It bears a crown, a lion and a Latin inscription — and in the right hands it opens more doors than prayer. Learn to count, to buy, to sell. The tavern, the shop, the market — each place has its own rhythm and its own price.", unlocks:[], requires:["tech_cellarium_rd2"] },

    // MUSIC SYSTEM
    { id:"tech_neuma_notation",       name:"Neumatická Notace",          name_en:"Neuma Notation",             cost:5,  desc:"Kantor tě pozval na zkoušku chorálu. Tajemné značky na pergamenu — neumata — ukrývají melodie starší než klášter sám.", desc_en:"The cantor invited thee to choir practice. Mysterious marks on parchment — neumes — conceal melodies older than the monastery itself.", unlocks:[], requires:["tech_writing_basics"] },
    { id:"tech_schola_cantorum",      name:"Schola Cantorum",            name_en:"Schola Cantorum",            cost:15, desc:"Škola zpěvců. Gregoriánský chorál zní skripturiem od Matutina do Completoria. Hudba jako modlitba, modlitba jako hudba.", desc_en:"The school of singers. Gregorian chant fills the scriptorium from Matins to Compline. Music as prayer, prayer as music.", unlocks:["sheet_music"], requires:["tech_neuma_notation"] },
    { id:"tech_organum_hydraulicum",  name:"Organum Hydraulicum",        name_en:"Hydraulic Organ",            cost:20, desc:"Theophilus Presbyter popsal v Schedula Diversarum Artium tajemství varhan. Vzduch, kůže a dřevo — a z toho se rodí hlas Boží.", desc_en:"Theophilus Presbyter described the secrets of the organ in Schedula Diversarum Artium. Air, leather and wood — and from these the voice of God is born.", unlocks:["organ"], requires:["tech_schola_cantorum","tech_cellarium_rd2"] },
    { id:"tech_polyphonia",           name:"Polyphonia",                 name_en:"Polyphony",                  cost:12, desc:"Více hlasů, jeden Bůh. Ars Nova přichází z Francie — Guillaume de Machaut píše pro krále. Hudba se mění navždy.", desc_en:"Many voices, one God. Ars Nova arrives from France — Guillaume de Machaut writes for kings. Music changes forever.", unlocks:[], requires:["tech_organum_hydraulicum"] },

    // PRINTING ENDGAME
    { id:"tech_printing_basics",  name:"Základy Knihtisku",        name_en:"Printing Basics",            cost:15, desc:"Tavení olova na litery. Gutenbergův vynález (1450). Revoluce.", desc_en:"Casting lead into type. Gutenberg's invention (1450). A revolution.", unlocks:["lead_alloy","printing_type"], requires:["tech_codex_luxury"] },
    { id:"tech_privilegium",      name:"Tiskařské Privilegium",    name_en:"Printing Privilege",         cost:20, desc:"Biskupská pečeť. Monopol na tisk. Melantrich to dosáhl roku 1552. Endgame unlock.", desc_en:"The bishop's seal. A monopoly on printing. Melantrich achieved this in 1552. Endgame unlock.", unlocks:["bishop_seal","printing_privilege"], requires:["tech_printing_basics","tech_codex_vellum"] },
    // ═══════════════════════════════════════════════════════════════════════════
    // ZAHRADA — SAD, DVŮR, VČELÍN (v8.x)
    // ═══════════════════════════════════════════════════════════════════════════

    // SAD (Pomarium) — odemkne záložku Sad v Zahradě
    { id:"tech_tractatus_arboribus", name:"Tractatus de Arboribus",      name_en:"Tractatus de Arboribus",
      cost:10,
      desc:"Pojednání o stromech. Klášterní sady nesloužily jen k jídlu — hrušně stály na hřbitovech, lípy kryly studny, ořešáky dávaly pigment i léky. Odemkne: Sad (Pomarium) s 10 stromy.",
      desc_en:"A treatise on trees. Monastic orchards served not only as food — pear trees stood in cemeteries, lindens sheltered wells, walnuts gave pigment and medicine. Unlocks: Orchard (Pomarium) with 10 trees.",
      unlocks:[], requires:["tech_writing_basics"] },

    // CHLÉV (Ovile) — odemkne stavbu chléva ve Dvoře
    { id:"tech_de_re_rustica",       name:"De Re Rustica",                name_en:"De Re Rustica",
      cost:15,
      desc:"Columellův spis o zemědělství. Mniši jej opisovali od 8. století — v něm se skrývalo vše o ovcích, kravách a obilí. Odemkne: Chlév (Ovile) — chov ovcí pro vlnu, mléko a pergamen.",
      desc_en:"Columella's treatise on agriculture. Monks copied it from the 8th century onward — within lay everything about sheep, cattle and grain. Unlocks: Sheepfold (Ovile) — raising sheep for wool, milk and vellum.",
      unlocks:[], requires:["tech_garden_expand"] },

    // VČELÍN (Apiarium) — odemkne záložku Apiarium v Zahradě
    { id:"tech_liber_apium",         name:"Liber Apium",                  name_en:"Liber Apium",
      cost:12,
      desc:"Kniha o včelách. Columella, Isidor ze Sevilly i Hildegarda z Bingenu psali o včelách s úctou. Med léčil rány, vosk svítil při večerních modlitbách. Odemkne: Včelín (Apiarium) — med a vosk.",
      desc_en:"The Book of Bees. Columella, Isidore of Seville and Hildegard of Bingen all wrote of bees with reverence. Honey healed wounds, wax lit the evening prayers. Unlocks: Apiary (Apiarium) — honey and wax.",
      unlocks:[], requires:["tech_monastery_wisdom"] },

];