const TechTree = [
  // TIER 1
  { id: "tech_candle", name: "Zpracování Tuku", name_en: "Fat Rendering", cost: 2, desc: "Odemkne: Svíčky, Klíh", desc_en: "Unlocks: Candles, Glue", unlocks: ["candle", "glue"] },
  { id: "tech_meteorologica", name: "Meteorologica — Živly a Oheň", name_en: "Meteorologica — Elements and Fire", cost: 20, desc: "Aristotelovo pojednání o povětří a živlech. Oheň jako horký a suchý element stoupající k nebi. Odemkne: správu paliva v krbu, subtab Ohniště.", desc_en: "Aristotle's treatise on weather and the elements. Fire as a hot, dry element rising toward heaven. Unlocks: hearth fuel management, the Foculus subtab.", unlocks: ["fireplace_fuel"], requires: ["tech_candle"] },
  { id: "tech_backpack", name: "Organizace Batohu", name_en: "Satchel Organisation", cost: 3, desc: "Odemkne: Třídění předmětů", desc_en: "Unlocks: Item sorting", unlocks: [] },
  { id: "tech_backpack_ii", name: "Registrum Cellarii — Katalog Zásob", name_en: "Registrum Cellarii — Stock Catalogue", cost: 10, desc: "Cellarius sestavil podrobný rejstřík, kde má každá věc své místo — od nástrojů po nalezené drobnosti. Odemkne: filtrování podle kategorií v Inventariu (Cellarium → Zásoby). Vše, co nemá jasné zařazení, spadne do kategorie Ostatní.", desc_en: "The cellarius compiled a detailed register where every item has its place — from tools to found trinkets. Unlocks: category filtering in the Inventarium (Cellarium → Stores). Anything without a clear place falls under Miscellaneous.", unlocks: [], requires: ["tech_backpack"] },
  { id: "tech_bibliotheca_catalogus", name: "Katalog Knihovny", name_en: "Library Catalogue", cost: 10, desc: "Armarius sestavil katalog — signatura, obsah a secundo folio pro každý svazek. Odemyká: filtrování (Přečteno / Ke čtení / Bez akvizice) a sbalovací kategorie v Knihovně.", desc_en: "The armarius compiled a catalogue — shelf-mark, contents, and secundo folio for every volume. Unlocks: filtering (Read / To Read / Unacquired) and collapsible categories in the Library.", unlocks: [] },
  { id: "tech_alchemy_1", name: "Základy Bylinkářství", name_en: "Herbalism Basics", cost: 3, desc: "Odemkne: Hojivá mast, Hřejivá mast", desc_en: "Unlocks: Healing salve, Warming salve", unlocks: ["potion_heal", "unguentum_calidum"] },

  // TIER 2 - cooking
  { id: "tech_cooking_1", name: "Vaření", name_en: "Cooking", cost: 4, desc: "Odemkne: Hrnec, pečení", desc_en: "Unlocks: Cooking pot, roasting", unlocks: ["cooking_pot", "cooked_meat", "cooked_fish", "bread", "bread_fine", "bread_fine_1", "berry_pie_fine", "berry_pie_fine_1"] },
  { id: "tech_fishing", name: "Rybolov", name_en: "Fishing", cost: 3, desc: "Odemkne: Udice", desc_en: "Unlocks: Fishing rod", unlocks: ["fishing_rod"] },
  { id: "tech_foraging", name: "Sběr Potravy", name_en: "Foraging", cost: 3, desc: "Odemkne: Koš, houby", desc_en: "Unlocks: Basket, mushrooms", unlocks: ["basket"] },
  { id: "tech_cooking_2", name: "Pokročilé Vaření", name_en: "Advanced Cooking", cost: 5, desc: "Odemkne: Guláš, polévky", desc_en: "Unlocks: Stew, pottages", unlocks: ["stew", "mushroom_soup", "berry_pie", "tea_kettle", "herbal_tea", "herbal_tea_alt", "acorn_brew", "chicory_drink", "linden_tea", "acorn_roasted", "chicory_roasted"], requires: ["tech_cooking_1"] },
  { id: "tech_ars_coquinaria", name: "Ars Coquinaria", name_en: "Ars Coquinaria", cost: 8,
    desc: "Umění vařit raky, hlemýždě a žabí stehýnka podle italského mistra Martina de Rossi. Rychleji se odemyká přečtením jeho knihy v Knihovně.",
    desc_en: "The art of preparing crayfish, snails, and frog legs after the Italian master Martino de Rossi. Unlocks faster by reading his book in the Library.",
    unlocks: ["crayfish_boiled", "snails_black_sauce", "frog_legs_prep", "frog_legs_fried"], requires: ["tech_cooking_2"] },
  { id: "tech_cultus_herbarum", name: "Cultus Herbarum", name_en: "Cultus Herbarum", cost: 10,
    desc: "Lidová znalost divokých bylin, kořenů a hub — z klášterního herbáře. Rychleji se odemyká přečtením knihy v Knihovně.",
    desc_en: "Folk knowledge of wild herbs, roots and mushrooms — from the monastery's herbal manuscript. Unlocks faster by reading the book in the Library.",
    unlocks: ["spring_herb_porridge", "burdock_root_baked", "couch_grass_flour", "cattail_root_flour", "rosehip_sauce", "famine_bread", "dried_wild_fruit", "sloe_jam", "morel_stuffed", "pickled_mushrooms"], requires: ["tech_de_re_rustica"] },

  // TIER 2 - horticulture
  { id: "tech_garden_expand", name: "Rozšíření Zahrady", name_en: "Garden Expansion", cost: 4, desc: "Odemkne: 4 políčka zahrady.", desc_en: "Unlocks: 4 garden plots.", unlocks: [] },
  { id: "tech_garden_expand_2", name: "Větší Zahrada", name_en: "Larger Garden", cost: 7, desc: "Klášterní zahrada v Břevnově měla přes 200 druhů rostlin. Odemkne: 6 políček.", desc_en: "The Břevnov monastery garden held over 200 plant species. Unlocks: 6 plots.", unlocks: [], requires: ["tech_garden_expand"] },
  { id: "tech_piscina", name: "De Piscibus", name_en: "De Piscibus", cost: 8, desc: "Středověké kláštery chovaly kapry v rybníce pro dny půstu. Odemkne: Rybník (Piscina).", desc_en: "Medieval monasteries raised carp in ponds for fast days. Unlocks: Pond (Piscina).", unlocks: [], requires: ["tech_garden_expand"] },
  { id: "tech_piscina_administratio", name: "Piscina — Přehled Hejna", name_en: "Piscina — Overview of the Shoal", cost: 45, desc: "Kapr od štiky, mladý od dospělého — bez pořádku v evidenci splyne hejno v beztvarou masu. Cellarius navrhuje totéž, co pro dílny: jeden přehled místo dohadování od oka. Odemyká: druhovou evidenci, chov štiky, a možnost ulovit konkrétní kus podle druhu.", desc_en: "Carp from pike, young from grown — without order in the ledger the shoal blurs into a shapeless mass. The cellarer proposes the same as for the workshops: one overview instead of guessing by eye. Unlocks: species tracking, pike husbandry, and the ability to catch a specific fish by species.", unlocks: [], requires: ["tech_piscina"] },
  { id: "tech_piscina_expansio", name: "Piscina — Vyzí tah", name_en: "Piscina — The Sturgeon Run", cost: 60, desc: "Na jaře táhnou od moře obří vyzy vzhůru po řece k výtěru — kdysi až k samotné Olomouci. Zátaras na řece z nich vyloví jednu jedinou, živou, do sádek — čeká, dokud nepřijde chvíle ji zpracovat. Odemyká: jarní tah vyz, vyzí maso, jikry a klih.", desc_en: "In spring, great sturgeon run upriver from the sea to spawn — once as far as Olomouc itself. A weir on the river catches one, alive, into the holding tank — it waits until the time comes to process it. Unlocks: the spring sturgeon run, sturgeon meat, roe, and isinglass.", unlocks: [], requires: ["tech_piscina_administratio"] },
  { id: "tech_garden_expand_3", name: "Zahrada sv. Hildegardy", name_en: "Hildegard's Garden", cost: 10, desc: "Hildegarda z Bingenu popsala 230 rostlin ve Physica. Odemkne: 8 políček.", desc_en: "Hildegard of Bingen described 230 plants in Physica. Unlocks: 8 plots.", unlocks: [], requires: ["tech_garden_expand_2"] },
  { id: "tech_hortus_conclusus", name: "Hortus Conclusus", name_en: "Hortus Conclusus", cost: 25, desc: "Uzavřená zahrada — symbol středověké dokonalosti. Podle plánu ze Sankt Gallenu: Herbularius a Hortus jako oddělené části. Odemkne: 2 nové záhony (byliny + speciál) a možnost zasadit a vykořenit libovolnou plodinu na všech záhonech.", desc_en: "The enclosed garden — symbol of medieval perfection. Following the St Gallen plan: Herbularius and Hortus as separate sections. Unlocks: 2 new plots (herb + special) and the ability to plant and uproot any crop on all plots.", unlocks: ["cannabis_poultice"], requires: ["tech_garden_expand_3"] },
  { id: "tech_susarna", name: "Susarna — Sušárna", name_en: "Susarna — Drying Rack", cost: 15, desc: "Sušení na vzduchu a ve stínu — žádná zvláštní budova, jen čas a trpělivost. Odemkne: sušení konopí ve Foculu (24 h), základ pro budoucí sušené suroviny.", desc_en: "Air-drying in the shade — no special building, just time and patience. Unlocks: hemp drying at the Foculus (24h), foundation for future dried goods.", unlocks: ["dried_cannabis"], requires: ["tech_hortus_conclusus"] },
  { id: "tech_herbalism_2", name: "Pokročilé Bylinkářství", name_en: "Advanced Herbalism", cost: 4, desc: "Odemkne: Nové byliny", desc_en: "Unlocks: New herbs", unlocks: [] },
  { id: "tech_composting", name: "Kompostování", name_en: "Composting", cost: 3, desc: "Odemkne: Kompost", desc_en: "Unlocks: Compost", unlocks: ["compost"] },

  // TIER 3 - alchemy
  { id: "tech_alchemy_2", name: "Alchymie Úrovně 2", name_en: "Alchemy Level 2", cost: 5, desc: "Odemkne: Protijed, popel", desc_en: "Unlocks: Antidote, ash", unlocks: ["antidote", "ash", "ash_from_sticks", "ash_from_log"], requires: ["tech_alchemy_1"] },
  { id: "tech_destillatio", name: "Destillatio — Destilace", name_en: "Destillatio — Distillation", cost: 7, desc: "Arabská alchymie přinesla destilaci do Evropy ve 12. století. Oddělují se čisté esence od nečistot. Základní operace pro výrobu lektvaru a léčiv.", desc_en: "Arabian alchemy brought distillation to Europe in the 12th century. Pure essences are separated from impurities. Essential for potions and medicine.", unlocks: [], requires: ["tech_alchemy_2"] },
  { id: "tech_calcinatio", name: "Calcinatio — Žíhání", name_en: "Calcinatio — Calcination", cost: 6, desc: "Žíhání v silném ohni spaluje těkavé složky a zanechává čistou zemi. Základní alchymistická operace pro práci s popelem a minerály.", desc_en: "Calcination in intense fire burns off volatile parts, leaving pure earth. Fundamental for ash and mineral work.", unlocks: [], requires: ["tech_alchemy_3"] },
  { id: "tech_alchemy_3", name: "Alchymie Úrovně 3", name_en: "Alchemy Level 3", cost: 6, desc: "Odemkne: Tonikum, olej", desc_en: "Unlocks: Tonic, preservation oil", unlocks: ["stamina_tonic", "preservation_oil"], requires: ["tech_alchemy_2"] },
  { id: "tech_alchemy_4", name: "Mistrovská Alchymie", name_en: "Master Alchemy", cost: 8, desc: "Odemkne: Lektvar spánku", desc_en: "Unlocks: Sleep draught", unlocks: ["sleep_potion"], requires: ["tech_alchemy_3"] },

  // TIER 4 - Klášterní tradice
  { id: "tech_monastery_wisdom", name: "Klášterní Moudrost", name_en: "Monastic Wisdom", cost: 10, desc: "Studium českých klášterů (Břevnov 993, Zlatá Koruna 1263). Mniši uchovávali znalosti tisíc let.", desc_en: "Study of Bohemian monasteries (Břevnov 993, Zlatá Koruna 1263). Monks preserved knowledge for a thousand years.", unlocks: [] },
  { id: "tech_czech_herbs", name: "České Bylinkářství", name_en: "Bohemian Herbalism", cost: 8, desc: "Měsíček, třezalka, dobromysl — české léčivé byliny od 12. století.", desc_en: "Calendula, St. John's Wort, marjoram — Bohemian healing herbs since the 12th century.", unlocks: [], requires: ["tech_alchemy_2"] },
  { id: "tech_advanced_farming", name: "Pokročilé Farmaření", name_en: "Advanced Farming", cost: 9, desc: "Klášterní zahrady na Strahově pěstovaly 500 druhů rostlin. +50% rychlejší růst!", desc_en: "The Strahov monastery gardens cultivated 500 plant species. +50% faster growth!", unlocks: [], requires: ["tech_garden_expand"] },
  { id: "tech_preservation", name: "Konzervace Potravin", name_en: "Food Preservation", cost: 7, desc: "Kláštery uchovávaly semena v medu 50+ let. Jídlo vydrží 2x déle!", desc_en: "Monasteries stored seeds in honey for 50+ years. Food lasts twice as long!", unlocks: [], requires: ["tech_cooking_2"] },

  // TIER 5 - Mistrovské umění
  { id: "tech_master_alchemist", name: "Mistr Alchymista", name_en: "Master Alchemist", cost: 12, desc: "Rudolf II. shromáždil 300 alchymistů v Praze (1583). Vrchol středověké alchymie.", desc_en: "Rudolf II gathered 300 alchemists in Prague (1583). The pinnacle of medieval alchemy.", unlocks: [], requires: ["tech_alchemy_4"] },
  { id: "tech_athanor_quaternio", name: "Athanor Quaternio", name_en: "Athanor Quaternio", cost: 15, desc: "Rozšířený kelímek s druhým hrdlem pojme čtvrtou přísadu najednou — složitější Velké dílo vyžaduje složitější nádobu. Odemyká: čtvrtý slot v Athanoru.", desc_en: "A widened crucible with a second neck holds a fourth ingredient at once — a more complex Great Work demands a more complex vessel. Unlocks: a fourth Athanor slot.", unlocks: [], requires: ["tech_master_alchemist"] },
  { id: "tech_illumination", name: "Iluminace Rukopisů", name_en: "Manuscript Illumination", cost: 10, desc: "Umění zdobení rukopisů zlatem a drahokamy. České iluminované bible — vrchol středověku.", desc_en: "The art of decorating manuscripts with gold and gems. Bohemian illuminated bibles — the pinnacle of the Middle Ages.", unlocks: [], requires: ["tech_monastery_wisdom"] },
  { id: "tech_astrology", name: "Astrologie", name_en: "Astrology", cost: 11, desc: "Hvězdy ovlivňují osudy i alchymii. Pražský orloj (1410) sleduje postavení nebeských těles. Odemkne: lunární bonusy Athanoru, věštění.", desc_en: "Stars influence fate and alchemy alike. The Prague Orloj (1410) tracks celestial bodies. Unlocks: Athanor lunar bonuses, divination.", unlocks: [], requires: ["tech_monastery_wisdom"] },
  { id: "tech_astronomy", name: "Computus — Nebeská Mechanika", name_en: "Computus — Celestial Mechanics", cost: 10, desc: "Benediktini vynalezli computus — přesný výpočet data Velikonoc z lunisolárního cyklu. Bez tohoto umění nelze sestavit klášterní kalendář. Odemkne: Perpetuum Calendarium.", desc_en: "Benedictines invented computus — precise calculation of Easter from the lunisolar cycle. Without this art, no monastic calendar can be made. Unlocks: Perpetuum Calendarium.", unlocks: ["perpetuum_calendarium"], requires: ["tech_astrology"] },
  { id: "tech_czech_glass", name: "České Sklářství", name_en: "Bohemian Glasswork", cost: 10, desc: "České sklářství 13. stol bylo nejlepší v Evropě. Benátky kopírovaly naše techniky.", desc_en: "13th-century Bohemian glasswork was the finest in Europe. Venice copied our techniques.", unlocks: [], requires: ["tech_master_alchemist"] },

  // GAMES
  { id: "tech_games", name: "Aula Ludi", name_en: "Aula Ludi", cost: 8, desc: "Středověké hry a zábava.", desc_en: "Medieval games and entertainment.", unlocks: ["playing_cards"], requires: [] },
  { id: "tech_iching", name: "Starověká Moudrost", name_en: "Ancient Wisdom", cost: 8, desc: "Prostudoval jsi záhadné texty z Dálného východu. Kniha Proměn odhaluje skrytý řád věcí.", desc_en: "Thou hast studied strange texts from the Far East. The Book of Changes revealeth a hidden order.", unlocks: ["recipe_iching_book"], requires: ["tech_alchemy_2"] },
  { id: "tech_ur_game", name: "Starobylé Hry", name_en: "Ancient Games", cost: 6, desc: "Královská hra z Uru (2600 př.n.l.) — starší než pyramidy!", desc_en: "The Royal Game of Ur (2600 BC) — older than the pyramids!", unlocks: ["ur_board"], requires: ["tech_games"] },
  { id: "tech_primero", name: "Primero", name_en: "Primero", cost: 10, desc: "Předchůdce pokeru. Jindřich VIII prohrál jmění! (1530)", desc_en: "Ancestor of poker. Henry VIII lost a fortune at it! (1530)", unlocks: ["primero_deck"], requires: ["tech_games"] },
  { id: "tech_karnoffel", name: "Karnöffel", name_en: "Karnöffel", cost: 12, desc: "Nejstarší trumfová hra Evropy! Norimberk 1426. Církev ji zakazovala.", desc_en: "The oldest trump card game in Europe! Nuremberg 1426. The Church banned it.", unlocks: ["karnoffel_deck"], requires: ["tech_primero"] },
  { id: "tech_freecell", name: "Solitér Mistryně", name_en: "Master Solitaire", cost: 15, desc: "Logické karetní hádanky. Trénink paměti a strategie pro mnichy.", desc_en: "Logical card puzzles. Memory and strategy training for monks.", unlocks: ["french_deck"], requires: ["tech_karnoffel"] },
  { id: "tech_rithmomachia", name: "Filozofická Matematika", name_en: "Philosophical Mathematics", cost: 20, desc: "Rithmomachia — Bitva čísel (1030). Vyučováno na univerzitách! Pythagorejská harmonie.", desc_en: "Rithmomachia — Battle of Numbers (1030). Taught at universities! Pythagorean harmony.", unlocks: ["rithmomachia_board"], requires: ["tech_freecell"] },
  { id: "tech_senet", name: "Senet — Hra Faraonů", name_en: "Senet — Game of Pharaohs", cost: 6, desc: "Nejstarší desková hra světa (3100 př.n.l.). Egyptští faraoni ji hráli na cestu do záhrobí.", desc_en: "The world's oldest board game (3100 BC). Egyptian pharaohs played it for their journey to the afterlife.", unlocks: ["senet_board"], requires: ["tech_games"] },
  { id: "tech_backgammon", name: "Tables — Cesta Kamenů", name_en: "Tables — Journey of Stones", cost: 8, desc: "Předchůdce vrhcábů. Kostky + strategie. Oblíbené v klášterech i v krčmách.", desc_en: "Ancestor of backgammon. Dice + strategy. Beloved in monasteries and taverns alike.", unlocks: ["backgammon_board"], requires: ["tech_senet"] },
  { id: "tech_draughts", name: "Dáma — Hra Dam a Pánů", name_en: "Draughts — Game of Ladies", cost: 10, desc: "Jednoduchá pravidla, hluboká strategie. Z arabské hry Alquerque (10. stol.).", desc_en: "Simple rules, deep strategy. From the Arabic game Alquerque (10th cent.).", unlocks: ["draughts_board"], requires: ["tech_backgammon"] },
  { id: "tech_hnefatafl", name: "Hnefatafl — Královská Hra", name_en: "Hnefatafl — King's Game", cost: 14, desc: "Hra Vikingů (400–1100 n.l.). Asymetrická — král prchá, útočníci loví. Zmizel s příchodem šachů.", desc_en: "Viking game (400–1100 AD). Asymmetric — the king flees, warriors hunt. Vanished with the arrival of chess.", unlocks: ["hnefatafl_board"], requires: ["tech_draughts"] },

  // WELL
  { id: "tech_well_basic", name: "Studnařství", name_en: "Well Digging", cost: 5, desc: "Naučíš se hloubit studnu. Přístup k čisté vodě.", desc_en: "Learn to dig a well. Access to clean water.", unlocks: ["well_basic"], requires: [] },
  { id: "tech_water_bucket", name: "Větší Nádoby", name_en: "Larger Vessels", cost: 4, desc: "Vylepšené vědro přináší více vody najednou.", desc_en: "A larger bucket draws more water at once.", unlocks: ["bucket"], requires: ["tech_well_basic"] },
  { id: "tech_well_maintenance", name: "Údržba Studny", name_en: "Well Maintenance", cost: 6, desc: "Naučíš se rozpoznat znečištění a opravit poškození.", desc_en: "Learn to detect contamination and repair damage.", unlocks: ["purification_powder", "repair_kit"], requires: ["tech_well_basic", "tech_alchemy_2"] },
  { id: "tech_well_stone", name: "Kamenná Studna", name_en: "Stone Well", cost: 8, desc: "Vyzdít studnu kamenem — vydrží déle, dává čistší vodu.", desc_en: "Line the well with stone — lasts longer, yields cleaner water.", unlocks: ["well_upgrade_stone"], requires: ["tech_well_basic", "tech_well_maintenance"] },
  { id: "tech_well_blessed", name: "Posvěcená Studna", name_en: "Blessed Well", cost: 12, desc: "Rituál posvěcení vody. Studna odolá mrazu, téměř bez údržby, dává svěcenou vodu.", desc_en: "A ritual blessing of the water. The well resists frost, needs almost no upkeep, and yields holy water.", unlocks: ["well_upgrade_blessed"], requires: ["tech_well_stone"] },

  // NOTEBOOKS
  { id: "tech_writing_basics", name: "Základy Psaní", name_en: "Writing Basics", cost: 3, desc: "Voskové destičky pro dočasné poznámky.", desc_en: "Wax tablets for temporary notes.", unlocks: ["tabula"], requires: [] },
  { id: "tech_commonplace", name: "Pracovní Zápisníky", name_en: "Commonplace Books", cost: 5, desc: "Trvalé poznámky v kožených sešitech.", desc_en: "Permanent notes in leather notebooks.", unlocks: ["adversaria"], requires: ["tech_writing_basics"] },
  { id: "tech_portable_wisdom", name: "Kapesní Moudrost", name_en: "Portable Wisdom", cost: 6, desc: "Vademecum s přenosnými poznámkami.", desc_en: "A vademecum of portable notes.", unlocks: ["vademecum"], requires: ["tech_commonplace"] },
  { id: "tech_lore_collection", name: "Sbírání Moudrosti", name_en: "Collecting Wisdom", cost: 7, desc: "Florilegium pro sběr citátů z knihovny.", desc_en: "A florilegium for gathering library quotes.", unlocks: ["florilegium"], requires: ["tech_commonplace", "tech_monastery_wisdom"] },
  { id: "tech_master_manual", name: "Mistrovský Manuál", name_en: "Master Manual", cost: 8, desc: "Enchiridion — ultimate notebook systém.", desc_en: "Enchiridion — the ultimate notebook system.", unlocks: ["enchiridion"], requires: ["tech_portable_wisdom", "tech_lore_collection"] },
  { id: "tech_ars_chronicae", name: "Ars Chronicae", name_en: "Ars Chronicae", cost: 6, desc: "Kosmas psal Kroniku Čechů na sklonku života (†1125). Dalimil veršoval česky (1314). Hájek lhal okouzlující latinou (1541). Prostudoval jsi umění svědectví — nyní zapiš vlastní příběh. Odemkne: Kroniku.", desc_en: "Cosmas wrote his Chronicle of Bohemia on his deathbed (†1125). Dalimil versified in Czech (1314). Hájek spun enchanting lies in Latin (1541). Thou hast studied the art of witness — now write thine own story. Unlocks: The Chronicle.", unlocks: [], requires: ["tech_commonplace", "tech_monastery_wisdom"] },

  // VELLUM
  { id: "tech_vellum_prep", name: "Příprava Pergamenu", name_en: "Vellum Preparation", cost: 5, desc: "Loužení kůže ve vápenné lázni. Historicky 3–4 dny.", desc_en: "Soaking hide in lime water. Historically 3–4 days.", unlocks: ["raw_hide", "soaked_hide", "stretched_hide", "ash_water", "wild_leather"], requires: [] },
  { id: "tech_tanning", name: "Koželužství", name_en: "Tanning", cost: 6, desc: "Třísloviny z duběnek zpevní kůži. Základ každého skriptoria.", desc_en: "Gall nut tannins harden the hide. The foundation of every scriptorium.", unlocks: ["tanned_leather", "tanned_leather_bark", "bellows", "scrinium_case", "water_pouch", "ink_pouch"], requires: ["tech_vellum_prep"] },
  { id: "tech_bookbinding", name: "Vazba Knih", name_en: "Book Binding", cost: 8, desc: "Kožená vazba, deska a pouzdra. Z volných listů se stává kodex.", desc_en: "Leather binding, boards and cases. Loose leaves become a codex.", unlocks: ["book_binding", "book_cover", "quill_case", "scribes_belt", "cushion", "linen_thread", "leather_cords", "quires", "sewn_block", "unfitted_codex"], requires: ["tech_tanning"] },
  { id: "tech_vellum_mastery", name: "Mistrovství Pergamenu", name_en: "Vellum Mastery", cost: 7, desc: "Leštění pemzou, bělení křídou. 1 kodex = kůže 3 ovcí. Jak Olomoucký misál (1488).", desc_en: "Smoothing with pumice, whitening with chalk. 1 codex = 3 sheepskins. As the Olomouc Missal (1488).", unlocks: ["vellum", "pumice"], requires: ["tech_vellum_prep"] },

  // SCRIBE TOOLS & INK
  { id: "tech_scribe_tools", name: "Nástroje Písaře", name_en: "Scribe's Tools", cost: 4, desc: "Husí brko — historický nástroj. 10x použití, +2 ink per craft.", desc_en: "The goose quill — the scribe's tool. 10 uses, +2 ink per craft.", unlocks: ["quill"], requires: [] },
  { id: "tech_gallic_ink", name: "Železitoduběnkový Inkoust", name_en: "Iron Gall Ink", cost: 6, desc: "Duběnky + vitriol + arabská guma. Standard 15. století. Permanentní, ale prožírá po 80 letech.", desc_en: "Oak galls + vitriol + gum arabic. 15th-century standard. Permanent, but eats through vellum after 80 years.", unlocks: ["ink_gallic", "iron_sulfate", "gum_arabic"], requires: ["tech_alchemy_2"] },

  // CODEX
  { id: "tech_codex_basic", name: "Prostý Opis", name_en: "Plain Copy", cost: 8, desc: "'Nižší typografie' (Voit) — rychlé ruční opisování na papír.", desc_en: "'Lower typography' (Voit) — fast hand-copying onto paper.", unlocks: ["common_codex"], requires: [] },
  { id: "tech_codex_luxury", name: "Zdobný Opis", name_en: "Ornate Copy", cost: 10, desc: "Individuálně pořizované iniciály, kvalitní inkoust. Pro šlechtu a kláštery.", desc_en: "Individual initials, quality ink. For nobility and monasteries.", unlocks: ["luxury_codex"], requires: ["tech_codex_basic", "tech_gallic_ink"] },
  { id: "tech_codex_vellum", name: "Pergamenové Kodexy", name_en: "Vellum Codices", cost: 12, desc: "Na pergamenu. Jak 20 z 420 výtisků Olomouckého misálu. Věčné, ale drahé.", desc_en: "On vellum. Like 20 of the 420 copies of the Olomouc Missal. Eternal, but costly.", unlocks: ["vellum_codex"], requires: ["tech_vellum_mastery", "tech_codex_luxury"] },

  // CANONICAL HOURS
  { id: "tech_canonical_hours", name: "Kanonické Hodiny", name_en: "Canonical Hours", cost: 10, desc: "Benediktinský denní řád: Vigilie, Laudes, Prima, Sexta, Nona, Vesperae, Completorium. Odemkne systém časových buffů.", desc_en: "The Benedictine daily order: Vigils, Lauds, Prime, Sext, None, Vespers, Compline. Unlocks time-based buffs.", unlocks: ["book_of_hours", "hostia"], requires: ["tech_monastery_wisdom", "tech_codex_luxury"] },

  // CELLARIUM
  { id: "tech_cellarium", name: "Celerář — Skladník Kláštera", name_en: "Cellarer — Monastic Steward", cost: 8, desc: "Bratr Celerář každé ráno přiděloval práci a inventář. Automatická organizace zásob.", desc_en: "The Brother Cellarer assigned work and inventory each morning. Automatic supply organisation.", unlocks: [], requires: ["tech_monastery_wisdom"] },

  // ECONOMY
  { id: "tech_commercium", name: "Commercium — Stezky Kupců", name_en: "Commercium — Merchant Routes", cost: 6, desc: "Klášter není ostrovem. Za hradbami prochází svět — a s ním i ti, kdo nesou zboží z daleké Benátky, z Říma, z Levanty. Nauč se rozpoznat příchod kupce, otevři bránu a naslouchej. Někdy přiveze surovinu, jindy příběh — a oboje má svou cenu.", desc_en: "The monastery is no island. Beyond its walls the world passes by — and with it those who carry goods from distant Venice, from Rome, from the Levant. Learn to recognise the merchant's arrival, open the gate and listen. Sometimes he brings a raw material, sometimes a story — and both have their price.", unlocks: [], requires: [] },
  { id: "tech_cellarium_rd2", name: "Cellarium — Řád Sklepa", name_en: "Cellarium — Order of the Cellar", cost: 8, desc: "Každý klášter má své srdce v kapli, ale své střevo ve sklepě. Cellarius není jen správce sudů a pytlů — je to muž, který ví, co klášter potřebuje, co může prodat a za kolik. Bez něj jsi jen mnichem s plnýma rukama a prázdnou kapsou.", desc_en: "Every monastery has its heart in the chapel, but its belly in the cellar. The Cellarius is no mere keeper of barrels and sacks — he is the man who knows what the monastery needs, what it can sell, and for how much. Without him thou art but a monk with full hands and an empty purse.", unlocks: [], requires: ["tech_commercium"] },
  { id: "tech_conventual_spaces", name: "Konventní prostory — Ztracená Sklepení", name_en: "Conventual Spaces — The Lost Vaults", cost: 10, desc: "Nyní, když je ve sklepě řád, opat nařizuje systematický průzkum jeho nejzazších koutů. Staré plány kláštera hovoří o klenbách, které dnešní bratři nikdy nespatřili — zazděné, zapomenuté, čekající. Odemyká: Staré sklepy v Cellariu.", desc_en: "Now that order reigns in the cellar, the abbot orders a systematic search of its farthest corners. Old plans of the monastery speak of vaults today's brothers have never seen — walled up, forgotten, waiting. Unlocks: Old Cellars in the Cellarium.", unlocks: [], requires: ["tech_cellarium_rd2"] },
  { id: "tech_manufactura_overview", name: "Manufaktura — Přehled Práce", name_en: "Manufactory — Workforce Overview", cost: 45, desc: "Cellarius navrhl, aby se výkazy práce ze všech dílen scházely na jednom místě — kdo kde pracuje, jak je zkušený, co čeká na sebrání — místo obcházení každé dílny zvlášť. Odemyká: Manufaktura v Cellariu (přístupná až po postavení Dormitoria).", desc_en: "The cellarer proposed that work reports from every workshop converge in one place — who works where, how skilled they are, what awaits collection — instead of checking each workshop separately. Unlocks: Manufactory in the Cellarium (accessible once the Dormitory is built).", unlocks: [], requires: ["tech_cellarium_rd2"] },
  { id: "tech_numismatica", name: "Numismatica — Věda o Groších", name_en: "Numismatica — The Science of Groschen", cost: 10, desc: "Pražský groš je malý, ale těžký. Nese na sobě korunu, lva i latinský nápis — a v pravých rukou otevírá více dveří než modlitba. Nauč se počítat, nakupovat, prodávat. Hospoda, obchod, trh — každé místo má svůj rytmus a svou cenu.", desc_en: "The Prague groschen is small, but heavy. It bears a crown, a lion and a Latin inscription — and in the right hands it opens more doors than prayer. Learn to count, to buy, to sell. The tavern, the shop, the market — each place has its own rhythm and its own price.", unlocks: [], requires: ["tech_cellarium_rd2"] },

  // MUSIC SYSTEM
  { id: "tech_neuma_notation", name: "Neumatická Notace", name_en: "Neuma Notation", cost: 5, desc: "Kantor tě pozval na zkoušku chorálu. Tajemné značky na pergamenu — neumata — ukrývají melodie starší než klášter sám.", desc_en: "The cantor invited thee to choir practice. Mysterious marks on parchment — neumes — conceal melodies older than the monastery itself.", unlocks: [], requires: ["tech_writing_basics"] },
  { id: "tech_schola_cantorum", name: "Schola Cantorum", name_en: "Schola Cantorum", cost: 15, desc: "Škola zpěvců. Gregoriánský chorál zní skripturiem od Matutina do Completoria. Hudba jako modlitba, modlitba jako hudba.", desc_en: "The school of singers. Gregorian chant fills the scriptorium from Matins to Compline. Music as prayer, prayer as music.", unlocks: ["sheet_music"], requires: ["tech_neuma_notation"] },
  { id: "tech_organum_hydraulicum", name: "Organum Hydraulicum", name_en: "Hydraulic Organ", cost: 20, desc: "Theophilus Presbyter popsal v Schedula Diversarum Artium tajemství varhan. Vzduch, kůže a dřevo — a z toho se rodí hlas Boží.", desc_en: "Theophilus Presbyter described the secrets of the organ in Schedula Diversarum Artium. Air, leather and wood — and from these the voice of God is born.", unlocks: ["organ"], requires: ["tech_schola_cantorum", "tech_cellarium_rd2"] },
  { id: "tech_polyphonia", name: "Polyphonia", name_en: "Polyphony", cost: 12, desc: "Více hlasů, jeden Bůh. Ars Nova přichází z Francie — Guillaume de Machaut píše pro krále. Hudba se mění navždy.", desc_en: "Many voices, one God. Ars Nova arrives from France — Guillaume de Machaut writes for kings. Music changes forever.", unlocks: [], requires: ["tech_organum_hydraulicum"] },

  // PRINTING ENDGAME
  { id: "tech_printing_basics", name: "Základy Knihtisku", name_en: "Printing Basics", cost: 15, desc: "Tavení olova na litery. Gutenbergův vynález (1450). Revoluce.", desc_en: "Casting lead into type. Gutenberg's invention (1450). A revolution.", unlocks: ["lead_alloy", "printing_type"], requires: ["tech_codex_luxury"] },
  { id: "tech_privilegium", name: "Tiskařské Privilegium", name_en: "Printing Privilege", cost: 20, desc: "Biskupská pečeť. Monopol na tisk. Melantrich to dosáhl roku 1552. Endgame unlock.", desc_en: "The bishop's seal. A monopoly on printing. Melantrich achieved this in 1552. Endgame unlock.", unlocks: ["bishop_seal", "printing_privilege"], requires: ["tech_printing_basics", "tech_codex_vellum"] },
  // ═══════════════════════════════════════════════════════════════════════════
  // ZAHRADA — SAD, DVŮR, VČELÍN (v8.x)
  // ═══════════════════════════════════════════════════════════════════════════

  // SAD (Pomarium) — odemkne záložku Sad v Zahradě
  {
    id: "tech_tractatus_arboribus", name: "Tractatus de Arboribus", name_en: "Tractatus de Arboribus",
    cost: 10,
    desc: "Pojednání o stromech. Klášterní sady nesloužily jen k jídlu — hrušně stály na hřbitovech, lípy kryly studny, ořešáky dávaly pigment i léky. Odemkne: Sad (Pomarium) s 10 stromy.",
    desc_en: "A treatise on trees. Monastic orchards served not only as food — pear trees stood in cemeteries, lindens sheltered wells, walnuts gave pigment and medicine. Unlocks: Orchard (Pomarium) with 10 trees.",
    unlocks: [], requires: ["tech_writing_basics"]
  },

  // CHLÉV (Ovile) — odemkne stavbu chléva ve Dvoře
  {
    id: "tech_de_re_rustica", name: "De Re Rustica", name_en: "De Re Rustica",
    cost: 15,
    desc: "Columellův spis o zemědělství. Mniši jej opisovali od 8. století — v něm se skrývalo vše o ovcích, kravách a obilí. Odemkne: Chlév (Ovile) — chov ovcí pro vlnu, mléko a pergamen.",
    desc_en: "Columella's treatise on agriculture. Monks copied it from the 8th century onward — within lay everything about sheep, cattle and grain. Unlocks: Sheepfold (Ovile) — raising sheep for wool, milk and vellum.",
    unlocks: ["sulci", "feed_meal_rye", "feed_meal_rye_1", "feed_meal_rye_2", "feed_meal_wheat", "feed_meal_wheat_1", "feed_meal_wheat_2", "feed_meal_barley", "feed_meal_oats", "feed_meal_millet", "feed_meal_peas", "feed_meal_vikev", "feed_meal_scraps", "rye_to_seed", "rye_to_seed_1", "rye_to_seed_2", "wheat_to_seed", "wheat_to_seed_1", "wheat_to_seed_2", "barley_to_seed", "oats_to_seed", "millet_to_seed", "peas_to_seed", "vikev_to_seed"], requires: ["tech_garden_expand"]
  },

  // VČELÍN (Apiarium) — odemkne záložku Apiarium v Zahradě
  {
    id: "tech_liber_apium", name: "Liber Apium", name_en: "Liber Apium",
    cost: 12,
    desc: "Kniha o včelách. Columella, Isidor ze Sevilly i Hildegarda z Bingenu psali o včelách s úctou. Med léčil rány, vosk svítil při večerních modlitbách. Odemkne: Včelín (Apiarium) — med a vosk.",
    desc_en: "The Book of Bees. Columella, Isidore of Seville and Hildegard of Bingen all wrote of bees with reverence. Honey healed wounds, wax lit the evening prayers. Unlocks: Apiary (Apiarium) — honey and wax.",
    unlocks: [], requires: ["tech_monastery_wisdom"]
  },

  // VČELAŘINA II (Custos Apium) — odemkne Velký úl v Buildings, vyžaduje přečtenou knihu Ruralia Commoda
  {
    id: "tech_custos_apium", name: "Custos Apium", name_en: "Custos Apium",
    cost: 25,
    desc: "Strážce, ne dobyvatel. Crescenziho Ruralia Commoda učí, že úl si žádá službu, ne pouhé využívání — kdo se o včely stará pozorně a trpělivě, z mála za krátký čas získá mnoho. Odemkne: Velký úl (Buildings) a pokročilou péči o včelstvo.",
    desc_en: "A guardian, not a conqueror. Crescenzi's Ruralia Commoda teaches that the hive asks for service, not mere use — a keeper who tends the bees attentively and patiently gains much from little in a short time. Unlocks: the Great Hive (Buildings) and advanced apiary care.",
    unlocks: ["velky_ul_1", "velky_ul_2"], requires: ["tech_liber_apium"], requiresBook: "book_ruralia_apibus"
  },

  // SKLADOVÉ HOSPODÁŘSTVÍ
  {
    id: "tech_carpentaria", name: "Carpentaria — Tesařství", name_en: "Carpentaria — Carpentry",
    cost: 8,
    desc: "Klášterní tesař byl nepostradatelný. Sekera, dláto a pila — z větví dělal fošny, z kamene tesané kvádry. Bez tesaře nestojí ani studna, ani sýpka, ani sklep. Odemkne: Fošna (plank) a Tesaný kámen (cut_stone).",
    desc_en: "The monastic carpenter was indispensable. Axe, chisel, and saw — from branches he made planks, from stone he cut blocks. Without the carpenter, neither well nor granary nor cellar stands. Unlocks: Plank and Cut Stone.",
    unlocks: ["plank", "plank_from_log", "cut_stone", "log", "stone_saw", "wooden_bowl"], requires: ["tech_writing_basics"]
  },

  {
    id: "tech_almarium", name: "Almarium — Klášterní Skříň", name_en: "Almarium — Monastic Cupboard",
    cost: 6,
    desc: "Každý klášter měl své almarium — uzamčenou skříň či komoru na suché zásoby, pergamen a cenné suroviny. Bez pořádku ve skříni není pořádek v díle. Odemkne: stavbu Almarium (kapacita 200 jednotek).",
    desc_en: "Every monastery had its almarium — a locked cupboard or storeroom for dry goods, parchment and precious materials. Without order in the cupboard there is no order in the work. Unlocks: Almarium building (capacity 200 units).",
    unlocks: [], requires: ["tech_carpentaria"]
  },

  {
    id: "tech_cella", name: "Tacuinum Sanitatis — Cella", name_en: "Tacuinum Sanitatis — Cella",
    cost: 10,
    desc: "Ibn Butlanova tabulka zdraví: chlad a tma prodlužují život potravin. Klášterní cella — chladný klenutý sklep — byl vědomou zbraní proti hladu. Odemkne: stavbu Cella (kapacita 600j, decay organických 2–3× pomalejší).",
    desc_en: "Ibn Butlan's table of health: cold and darkness prolong the life of foodstuffs. The monastic cella — a cool vaulted cellar — was a conscious weapon against hunger. Unlocks: Cella building (capacity 600 units, organic decay 2–3× slower).",
    unlocks: [], requires: ["tech_almarium", "tech_cellarium"]
  },

  {
    id: "tech_horreum", name: "Liber Ruralium — Horreum", name_en: "Liber Ruralium — Horreum",
    cost: 14,
    desc: "Crescenziho encyklopedie hospodářství: sýpka musí stát na suchém místě, chráněna od myší i vlhkosti. Karel IV. si ho dal přeložit do češtiny. Odemkne: Horreum (kapacita 1600j) + krmivo jako denní nutnost pro zvířata.",
    desc_en: "Crescenzi's encyclopaedia of agriculture: the granary must stand on dry ground, protected from mice and damp. Charles IV had it translated into Czech. Unlocks: Horreum (capacity 1600 units) + fodder as a daily necessity for animals.",
    unlocks: ["hay"], requires: ["tech_cella", "tech_de_re_rustica"]
  },

  {
    id: "tech_cura_felium", name: "Cura Felium — Péče o kočky", name_en: "Cura Felium — Care of Cats",
    cost: 8,
    desc: "„Já lovím slova, on loví myši“ — psal irský mnich v 9. století o svém kocouru Pangur Bánovi. Kočka chrání zásoby i rukopisy před myšmi; v nejednom kodexu zůstaly otisky jejích tlapek v inkoustu. Odemkne: Felis — péče o klášterní kočku (krmení, přízeň, lov myší).",
    desc_en: "\u201CI hunt words, he hunts mice\u201D — wrote a 9th-century Irish monk of his cat Pangur Bán. The cat guards stores and manuscripts from mice; more than one codex bears her inky paw prints. Unlocks: Felis — care of the monastery cat (feeding, affection, mousing).",
    unlocks: [], requires: ["tech_de_re_rustica"]
  },

  {
    id: "tech_de_animalibus", name: "De Animalibus — Pozorování přírody", name_en: "De Animalibus — Observation of Nature",
    cost: 20,
    desc: "Albert Veliký rozlišil druhy hlodavců, popsal jejich chování a nory. Kdo zná nepřítele spíže, dokáže ho počítat a předvídat. Odemkne: Myší panel na Dvoře — přesný počet myší, trend populace, ztráty zásob a vliv na kažení.",
    desc_en: "Albertus Magnus distinguished rodent species, described their behaviour and burrows. He who knows the enemy of the larder can count it and predict it. Unlocks: Mouse panel in the Farmyard — exact mouse count, population trend, store losses, and decay impact.",
    unlocks: ["mice_panel"], requires: ["tech_cura_felium"]
  },

  {
    id: "tech_cuniculi", name: "Cuniculi — Chov králíků", name_en: "Cuniculi — Rabbit Keeping",
    cost: 6,
    desc: "Králíci v ohradách (leporaria) byli známí už Římanům; kláštery je chovaly pro maso i kožky. Množí se rychle a žerou skoro cokoliv. Odemkne: Králíkárna na Dvoře.",
    desc_en: "Rabbits in enclosures (leporaria) were known to the Romans; monasteries kept them for meat and pelts. They breed fast and eat almost anything. Unlocks: the Rabbit Hutch in the Farmyard.",
    unlocks: [], requires: ["tech_de_re_rustica"]
  },

  {
    id: "tech_caprile", name: "Caprile — Chov koz", name_en: "Caprile — Goat Keeping",
    cost: 12,
    desc: "Koza — kráva chudých. Nenáročná, mléko dává i v zimě, spase i to, co ovce odmítne. Odemkne: Kozí chlívek na Dvoře.",
    desc_en: "The goat — the poor man's cow. Undemanding, gives milk even in winter, grazes what sheep refuse. Unlocks: the Goat Pen in the Farmyard.",
    unlocks: [], requires: ["tech_de_re_rustica"]
  },

  {
    id: "tech_armentum", name: "Armentum — Chov skotu", name_en: "Armentum — Cattle Husbandry",
    cost: 14,
    desc: "Kráva dává pětkrát víc mléka než koza, ale žere víc a stojí víc. Velké kláštery chovaly desítky kusů — na mléko, máslo, sýr i vellum z telecí kůže. Odemkne: Kravín na Dvoře.",
    desc_en: "A cow gives five times the milk of a goat, but eats more and costs more. Great monasteries kept dozens of head — for milk, butter, cheese and vellum from calfskin. Unlocks: the Cow Byre in the Farmyard.",
    unlocks: [], requires: ["tech_caprile"]
  },

  {
    id: "tech_suile", name: "Suile — Chov prasat", name_en: "Suile — Pig Keeping",
    cost: 18,
    desc: "Prase — živá spižírna kláštera. Na podzim žaludy v lese, v zimě zabijačka: sádlo, špek, maso. Vyžaduje pevný chlév a pevné nervy. Odemkne: Chlév na Dvoře.",
    desc_en: "The pig — the monastery's living larder. Acorns in the woods in autumn, slaughter in winter: lard, cured meat, fresh meat. Requires a sturdy sty and steady nerves. Unlocks: the Pigsty in the Farmyard.",
    unlocks: [], requires: ["tech_de_re_rustica"]
  },

  {
    id: "tech_stabulum", name: "Stabulum — Stáj", name_en: "Stabulum — The Stable",
    cost: 30,
    desc: "Kůň byl ve středověku majetek jako dnes povoz s erbem. Tažná síla pro pole i cesty na trh — ale žere oves, potřebuje podkováře a stáj z tesaného kamene. Odemkne: Stáj na Dvoře.",
    desc_en: "In the Middle Ages a horse was property like a carriage with a coat of arms. Draught power for fields and market roads — but it eats oats, needs a farrier and a stable of cut stone. Unlocks: the Stable in the Farmyard.",
    unlocks: [], requires: ["tech_de_re_rustica"]
  },

  {
    id: "tech_asinus", name: "Asinus — Osel", name_en: "Asinus — The Donkey",
    cost: 11,
    desc: "Osel byl ve středověkém klášteře nejspolehlivějším pomocníkem: mlýn, studna, pole. Nevybíravý co žere, nikdy nestávkuje — většinou. Odemkne: Oslárna, osel Ouško a bonus výnosu na Poli.",
    desc_en: "The donkey was the medieval monastery's most reliable helper: mill, well, fields. Undemanding in diet, never strikes — mostly. Unlocks: the Donkey Stall, Ouško the donkey, and a field yield bonus.",
    unlocks: [], requires: ["tech_de_re_rustica"]
  },

  {
    id: "tech_lactaria", name: "Lactaria — Zpracování mléka", name_en: "Lactaria — Dairy Craft",
    cost: 15,
    desc: "Mléko vydrží den, máslo týdny, sýr měsíce. Klášterní mlékárna proměňuje pomíjivé v trvanlivé. Při stloukání másla zbude podmáslí — nic nepřijde nazmar. Odemkne: Máselnice, recepty Smetana a Máslo.",
    desc_en: "Milk keeps a day, butter for weeks, cheese for months. The monastic dairy turns the perishable into the lasting. Churning butter leaves buttermilk — nothing goes to waste. Unlocks: the Churn, Cream and Butter recipes.",
    unlocks: ["churn", "cream", "butter"], requires: ["tech_caprile"]
  },

  {
    id: "tech_caseus", name: "Caseus — Sýření mléka", name_en: "Caseus — Cheesemaking",
    cost: 20,
    desc: "Mléko samo zkysne, ale syřidlo dělá z tvarohu sýr. Slez z jehněte, výluh ze svízelu, nebo jen čas a teplo — tři cesty k téže hroudě. Odemkne: Syřidlo, čtyři druhy sýra.",
    desc_en: "Milk sours on its own, but rennet turns curd into cheese. A lamb's stomach, an extract of bedstraw, or simply time and warmth — three paths to the same wheel. Unlocks: Rennet, four kinds of cheese.",
    unlocks: ["rennet_galium", "cheese_mold", "goat_cheese", "sheep_cheese", "cow_cheese", "syrecky"], requires: ["tech_lactaria"]
  },

  {
    id: "tech_inventarium", name: "Inventarium — Soupis Zásob", name_en: "Inventarium — Inventory of Stores",
    cost: 8,
    desc: "Klášterní cellarius vedl přesný soupis každého pytle mouky a každého sudu piva. Bez inventáře se zásoby ztrácejí samy od sebe. Odemkne: subtab Inventarium v Cellariu — přehled zásob. POZOR: Kdo vede soupis, vidí i ztráty. Od této chvíle se zásoby kazí — mléko kysne, maso plesniví, myši žerou zrní. Připrav se na hospodaření se zásobami.",
    desc_en: "The monastic cellarius kept an exact inventory of every sack of flour and every barrel of ale. Without an inventory, stores disappear of their own accord. Unlocks: Inventarium subtab in the Cellarium — stock overview. BEWARE: He who keeps the ledger also sees the losses. From now on stores decay — milk sours, meat moulds, mice eat the grain. Prepare to manage your stores.",
    unlocks: ["mousetrap", "fly_trap_paper"], requires: ["tech_almarium"]
  },

  {
    id: "tech_horrea_minora", name: "Horrea Minora — Malé sklady", name_en: "Horrea Minora — Small Stores",
    cost: 12,
    desc: "Ne každý poklad potřebuje sýpku. Bedny a přestavěné sudy dají další místo k uskladnění, kus po kuse. Odemkne: craft Bedny + přestavbu Sudu na skladovací kontejner — obojí přičítá kapacitu v Inventariu.",
    desc_en: "Not every store needs a granary. Crates and rebuilt barrels give extra room, piece by piece. Unlocks: crafting the Crate + converting a Barrel into a storage container — both add capacity in the Inventarium.",
    unlocks: ["bedna", "storage_container"], requires: ["tech_horticulture", "tech_inventarium"]
  },

  {
    id: "tech_liber_rationum", name: "Pratica della Mercatura — Liber Rationum", name_en: "Pratica della Mercatura — Liber Rationum",
    cost: 12,
    desc: "Pegolottiho zápisník: každý groš má cenu a každá transakce má příběh. Florentský agent znal ceny od Londýna po Caffu. Odemkne: subtab Liber Rationum v Cellariu — účetní kniha všech transakcí.",
    desc_en: "Pegolotti's notebook: every groschen has a value and every transaction has a story. The Florentine agent knew prices from London to Caffa. Unlocks: Liber Rationum subtab in the Cellarium — account book of all transactions.",
    unlocks: [], requires: ["tech_commercium", "tech_inventarium"]
  },

  // NÁSTROJE
  {
    id: "tech_kovarina", name: "Kovářina — Kovářské řemeslo", name_en: "Smithcraft — Blacksmithing",
    cost: 35,
    desc: "Klášterní kovář byl nepostradatelný. Z rozžhaveného železa tvaroval sekerky, rýče i kosy. Bez kováře nezaoralo žádné pole. Odemkne: železné nástroje (sekerka, rýč, kosa, srp, cep, lopata, pila).",
    desc_en: "The monastic blacksmith was indispensable. He shaped axes, spades and scythes from heated iron. Without a smith no field could be ploughed. Unlocks: iron tools (axe, spade, scythe, sickle, flail, shovel, saw).",
    unlocks: ["iron_axe", "iron_spade", "iron_scythe", "iron_sickle", "iron_flail", "iron_shovel", "iron_saw", "iron_pickaxe", "iron_tongs", "iron_ingot", "repair_iron_axe", "repair_iron_spade", "repair_iron_scythe", "repair_iron_sickle", "repair_iron_flail", "repair_iron_shovel", "repair_iron_saw", "repair_iron_pickaxe", "metal_clasps", "metal_bosses"], requires: ["tech_horticulture"]
  },

  {
    id: "tech_fodina", name: "Fodina — Umění Těžby", name_en: "Fodina — Art of Mining",
    cost: 25,
    desc: "Těžba železné rudy si žádá více než jen krumpáč — vyžaduje znalost žil, výdřevy štol a horního práva. S tímto věděním může klášter požádat opata o právo otevřít důl. Odemkne: akce Těžba rudy (s krumpáčem).",
    desc_en: "Mining iron ore demands more than a pickaxe — it requires knowledge of veins, shaft timbering and mining law. With this knowledge the monastery may petition the Abbot to open a mine. Unlocks: Mine Iron Ore action (with pickaxe).",
    unlocks: ["fodina", "palice_kamenna", "palice_zelezna"], requires: ["tech_kovarina"]
  },

  {
    id: "tech_fornax", name: "Fornax Ferraria — Tavba Železa", name_en: "Fornax Ferraria — Smelting Iron",
    cost: 35,
    desc: "Tavení rudy v peci s měchy dosahuje teploty, při které hlušina odtéká a čisté železo zůstává. Saští hutníci přinesli toto tajemství do Čech ve 13. století. S tímto věděním lze požádat opata o stavbu hutě. Odemkne: Fornax Ferraria, výroba ingotů.",
    desc_en: "Smelting ore in a bellows furnace reaches temperatures at which slag flows away and pure iron remains. Saxon smelters brought this knowledge to Bohemia in the 13th century. With this knowledge the monastery may petition the Abbot to build a furnace. Unlocks: Fornax Ferraria, iron ingot crafting.",
    unlocks: ["fornax_ferraria"], requires: ["tech_fodina"]
  },

  {
    id: "tech_malleatura", name: "Malleatura — Hamernické Řemeslo", name_en: "Malleatura — The Hammer Craft",
    cost: 45,
    desc: "Vodní hamr buší na žhavou lupu tak dlouho, dokud struska nevyteče a nevznikne pevný ingot vyšší čistoty. Tento upgrade Fornaxu výrazně zvýší výtěžnost tavení. Odemkne: upgrade Malleatura (vyšší výtěžnost ingotů).",
    desc_en: "The water hammer pounds the hot bloom until slag is expelled and a purer ingot remains. This upgrade to the Fornax significantly increases smelting yield. Unlocks: Malleatura upgrade (higher ingot yield).",
    unlocks: ["malleatura"], requires: ["tech_fornax"]
  },

  {
    id: "tech_horticulture", name: "Horticultura — Zahradní umění", name_en: "Horticultura — Art of the Garden",
    cost: 10,
    desc: "Klášterní zahradník byl vzdělán v bylinářství, pěstování i závlaze. Odemkne: kamenné nástroje (sekerka, rýč, kosa, srp, cep, lopata), vědro, konev, sud.",
    desc_en: "The monastic gardener was learned in herbalism, cultivation and irrigation. Unlocks: stone tools (axe, spade, scythe, sickle, flail, shovel), bucket, watering can, barrel.",
    unlocks: ["stone_axe", "stone_spade", "stone_scythe", "stone_sickle", "stone_flail", "wooden_flail", "stone_shovel", "stone_pickaxe", "bucket", "watering_can", "barrel_tool"], requires: ["tech_writing_basics"]
  },

  {
    id: "tech_materia_prima", name: "Materia Prima — Poznání Suroviny", name_en: "Materia Prima — Knowledge of Materials",
    cost: 34,
    desc: "Středověký lékárník a písař věděl o každé surovině vše — odkud pochází, jak se kazí, k čemu slouží. Toto vědění se nezíská náhodou, ale pečlivým studiem a zápisky. Odemkne: kliknutí na item → podrobný modal s historií, vlastnostmi a použitím.",
    desc_en: "The medieval apothecary and scribe knew everything about every material — where it came from, how it spoiled, what it was used for. This knowledge is not gained by chance, but by careful study and annotation. Unlocks: click on any item → detailed modal with history, properties and uses.",
    unlocks: [], requires: ["tech_inventarium"]
  },

  // ── POLE (Ager) — tech chain ──────────────────────────────────────────────
  {
    id: "tech_crop_rotation", name: "Trojpolní systém", name_en: "Three-Field System",
    cost: 20,
    desc: "Středověká revoluce: první pole ozimé obilí, druhé jarní plodiny, třetí ladem. Půda si odpočine, výnosy stoupnou. Historicky nejdůležitější agrární inovace 12. století. Odemkne: +25% výnos Pole.",
    desc_en: "Medieval revolution: first field winter grain, second spring crops, third fallow. The soil rests, yields increase. Historically the most important agrarian innovation of the 12th century. Unlocks: +25% field yield.",
    unlocks: ["humno"], requires: ["tech_de_re_rustica"]
  },

  {
    id: "tech_polnosti_ii", name: "Polnosti II — Rozšíření", name_en: "Fields II — Expansion",
    cost: 30,
    desc: "Klučení lesa a odvodnění mokřin rozšíří klášterní pole na 11 běžných záhonů — a tři z nich, vyhrazené jako trvalý úhor, přijmou jen půdu šetřící plodiny jako vikev. Odemkne: 8 nových polních slotů (5 běžných + 3 úhorné).",
    desc_en: "Clearing forest and draining marshland expands the monastery's fields to 11 regular plots — with three set aside as permanent fallow ground, accepting only soil-sparing crops like vetch. Unlocks: 8 new field slots (5 regular + 3 fallow).",
    unlocks: [], requires: ["tech_crop_rotation"]
  },

  {
    id: "tech_field_drainage", name: "Odvodňování polí", name_en: "Field Drainage",
    cost: 18,
    desc: "Zamokřená pole se nedají orat. Benediktini a cisterciáci odvodňovali bažiny a proměňovali je v úrodnou půdu — historicky jedna z největších krajinných proměn středověku.",
    desc_en: "Waterlogged fields cannot be ploughed. Benedictines and Cistercians drained marshes and transformed them into fertile land — historically one of the greatest landscape transformations of the Middle Ages.",
    unlocks: [], requires: ["tech_crop_rotation"]
  },

  {
    id: "tech_field_irrigation", name: "Závlahový systém", name_en: "Irrigation System",
    cost: 22,
    desc: "Strouhy a kanálky od studny k poli. Méně vody na závlahu, větší odolnost při suchu. Columella o tom psal v 1. století, mniši to znovu objevili.",
    desc_en: "Channels and ditches from the well to the field. Less water for irrigation, greater drought resistance. Columella wrote about this in the 1st century; monks rediscovered it.",
    unlocks: [], requires: ["tech_field_drainage"]
  },

  // ── VINOHRAD (Vinea) ─────────────────────────────────────────────────────
  {
    id: "tech_vinohrad", name: "Vinea — Réva Vinná", name_en: "Vinea — The Vine",
    cost: 18,
    desc: "Liber de Cultura Vitis. Réva se množí řízky, ne semínkem. Odemkne: záložku Vinohrad. Pro výsadbu révy nejdříve postav Vinohrad (Vinea) v Cellarium → Budovy.",
    desc_en: "Liber de Cultura Vitis. Vines propagate by cutting, not by seed. Unlocks: Vineyard tab. To plant vines, first build the Vineyard (Vinea) in Cellarium → Buildings.",
    unlocks: [], requires: ["tech_de_re_rustica"]
  },

  {
    id: "tech_vinifikace", name: "Ars Vinificandi", name_en: "Ars Vinificandi",
    cost: 22,
    desc: "Umění přeměny moštu ve víno. Fermentace, filtrace, stáčení. Odemkne: Cella fermentaria — výroba Vinum a Vinum Rubrum.",
    desc_en: "The art of turning must into wine. Fermentation, filtration, racking. Unlocks: Cella fermentaria — producing Vinum and Vinum Rubrum.",
    unlocks: [], requires: ["tech_vinohrad"]
  },

  {
    id: "tech_tonnellerie", name: "Ars Tonnellaria", name_en: "Ars Tonnellaria",
    cost: 28,
    desc: "Výroba sudů z dubového dřeva. Víno zrající v sudu získá jantarovou barvu a hlubší chuť. Odemkne: Foudres + Bednářská dílna.",
    desc_en: "Cooperage — crafting oak barrels. Wine aged in the barrel gains amber colour and deeper flavour. Unlocks: Foudres + Cooperage.",
    unlocks: [], requires: ["tech_vinifikace"]
  },

  {
    id: "tech_uvarium", name: "Uvarium — Sušárna hroznů", name_en: "Uvarium — Drying House",
    cost: 22,
    desc: "Umění sušení hroznů na slunci a ve stínu. Giacomo přivezl znalost z Benátek. Odemkne: Uvarium — výroba hrozinek.",
    desc_en: "The art of drying grapes in sun and shade. Giacomo brought the knowledge from Venice. Unlocks: Uvarium — raisin production.",
    unlocks: [], requires: ["tech_tonnellerie"]
  },

  {
    id: "tech_prelum_olei", name: "Prelum Olei — Lisovna oleje", name_en: "Prelum Olei — Oil Press",
    cost: 20,
    desc: "Lněný olej z pole lisovaný dřevěným klínem. Propojení Pole → Skriptorium. Odemkne: Prelum Olei — výroba lněného oleje.",
    desc_en: "Linseed oil from the field, pressed with a wooden wedge. Links Field → Scriptorium. Unlocks: Prelum Olei — linseed oil production.",
    unlocks: [], requires: ["tech_de_re_rustica", "tech_vinohrad"]
  },

];
// ── KADIDLO (Thuribulum) ─────────────────────────────────────────────────
TechTree.push({
    id: "tech_thuribulum",
    name: "Thuribulum — Umění vykuřování",
    name_en: "Thuribulum — Art of Incense",
    cost: 12,
    desc: "Antická medicína i mnišská liturgie znají sílu dýmu. Dioscorides psal o pryskyřicích Pitys a Peuce i o pravém Olibanu z Arábie. Odemkne: výrobu a pálení kadidla v Ohništi pro regeneraci Vigoru.",
    desc_en: "Ancient medicine and monastic liturgy alike know the power of smoke. Dioscorides wrote of Pitys and Peuce resins and of true Olibanum from Arabia. Unlocks: crafting and burning incense at the Hearth for Vigor regeneration.",
    unlocks: ["incense_spruce", "incense_pine", "incense_styrax", "incense_olibanum"],
    requires: ["tech_meteorologica"]
});
// ── MAGISTER CONVERSORUM ─────────────────────────────────────────────────
TechTree.push({
    id: "tech_magister",
    name: "Magister conversorum",
    name_en: "Magister conversorum",
    cost: 35,
    desc: "Dosud každou při na Kapitule soudíš sám a každý konvrš je najatý natrvalo, nebo vůbec. Magister conversorum spory urovná sám, a otevře dveře i těm, co nechtějí zůstat navždy — famulům na sezónu, oblátům na vyrůstání. Odemyká: najímání Famula a Obláta, automatické řešení Kapituly.",
    desc_en: "Until now you alone judge every dispute at Chapter, and every lay brother is hired for life or not at all. The Magister conversorum settles disputes himself, and opens the door to those who won't stay forever — seasonal famuli, growing oblates. Unlocks: hiring Famulus and Oblate, automatic resolution of Chapter disputes.",
    unlocks: [],
    requires: []
});
// ── INFIRMARIUM — Ošetřovna ───────────────────────────────────────────────
TechTree.push({
    id: "tech_infirmarium",
    name: "Infirmarium",
    name_en: "Infirmarium",
    cost: 30,
    desc: "Nemocní dosud leží tam, kde je nemoc zastihla. Infirmarium jim dá vlastní síň, oddělenou od zdravého společenství. Odemyká: budovu Infirmarium a přístup k jejím čtyřem stanovištím péče.",
    desc_en: "The sick still lie wherever illness finds them. The Infirmarium gives them their own hall, set apart from the healthy community. Unlocks: the Infirmarium building and access to its four stations of care.",
    unlocks: [],
    requires: []
});
TechTree.push({
    id: "tech_infirmarium_servitor",
    name: "Servitor infirmariae",
    name_en: "Servitor infirmariae",
    cost: 12,
    desc: "Fyzická obsluha nemocných — převlékání lůžek, podávání léků, hygiena sálu. Odemyká: konvrší úkol Ošetřovatel.",
    desc_en: "Physical care of the sick — changing linens, giving medicine, keeping the hall clean. Unlocks: the Servitor lay-brother task.",
    unlocks: [],
    requires: ["tech_infirmarium"]
});
TechTree.push({
    id: "tech_infirmarium_coquus",
    name: "Coquus infirmariae",
    name_en: "Coquus infirmariae",
    cost: 12,
    desc: "Vlastní kuchyně ošetřovny — maso a bílý chléb povolené i mimo půst, k posílení nemocných. Odemyká: konvrší úkol Kuchař infirmaria.",
    desc_en: "The infirmary's own kitchen — meat and white bread allowed even outside fast days, to strengthen the sick. Unlocks: the Coquus lay-brother task.",
    unlocks: [],
    requires: ["tech_infirmarium"]
});
TechTree.push({
    id: "tech_infirmarium_hortulanus",
    name: "Hortulanus medicus",
    name_en: "Hortulanus medicus",
    cost: 12,
    desc: "Zahrádka léčivek při ošetřovně — šalvěj, meduňka, mandragora. Odemyká: konvrší úkol Bylinář.",
    desc_en: "A physic garden by the infirmary — sage, lemon balm, mandrake. Unlocks: the Hortulanus lay-brother task.",
    unlocks: [],
    requires: ["tech_infirmarium"]
});
TechTree.push({
    id: "tech_infirmarium_balneator",
    name: "Balneator / Focarius",
    name_en: "Balneator / Focarius",
    cost: 12,
    desc: "Topič a koupelník — udržuje oheň a teplou vodu pro léčebné koupele. Odemyká: konvrší úkol Topič.",
    desc_en: "The stoker and bath-keeper — tends the fire and warm water for healing baths. Unlocks: the Balneator lay-brother task.",
    unlocks: [],
    requires: ["tech_infirmarium"]
});
TechTree.push({
    id: "tech_infirmarium_apothecarius",
    name: "Ars Apothecaria",
    name_en: "Ars Apothecaria",
    cost: 12,
    desc: "Contraria contrariis curantur — nemocný humor se léčí opačnou kvalitou. Odemyká: první léčivé recepty pro Athanor (Odvar z duběnek, Mast ze lněného oleje).",
    desc_en: "Contraria contrariis curantur — an unbalanced humor is cured by its opposite quality. Unlocks: first medicinal recipes for the Athanor (Oak Gall Decoction, Linseed Oil Salve).",
    unlocks: ["odvar_z_dubenek", "mast_ze_lneneho_oleje", "odvar_z_vrby"],
    requires: ["tech_infirmarium"]
});
TechTree.push({
    id: "tech_chirurgus",
    name: "Chirurgia Magna",
    name_en: "Chirurgia Magna",
    cost: 15,
    desc: "Guy de Chauliac, 1365. Nejmodernější chirurgický spis doby — ošetřování ran, zlomenin, a spongia somnifera: mořská houba napuštěná opiem, blínem a mandragorou k utlumení bolesti před řezáním. Odemyká: Uspávací houbu.",
    desc_en: "Guy de Chauliac, 1365. The most advanced surgical treatise of the age — wound care, fractures, and the spongia somnifera: a sea sponge soaked with opium, henbane and mandrake to dull pain before cutting. Unlocks: the Sleeping Sponge.",
    unlocks: ["spongia_somnifera"],
    requires: ["tech_infirmarium"]
});
TechTree.push({
    id: "tech_studovna",
    name: "Studovna",
    name_en: "Studiolum",
    cost: 18,
    desc: "Šlechta odedávna hledala v klášterních archivech doklady k pozemkovým sporům, rodokmenům i závětem. Vlastní studovna při knihovně nabídne světskému hostu klid a soukromí, aniž naruší řád kláštera. Odemyká: přijímání žádostí Vrchnosti o přístup ke klášterním listinám.",
    desc_en: "Nobility had long sought in monastery archives the proof needed for land disputes, lineage claims, and testaments. A private study room by the library offers a secular guest quiet and privacy without disrupting the monastery's order. Unlocks: receiving the Lord's requests for access to the monastery's charters.",
    unlocks: [],
    requires: []
});
// ── PORTA — Holubí pošta ─────────────────────────────────────────────────
TechTree.push({
    id: "tech_porta",
    name: "Porta — Holubí pošta",
    name_en: "Porta — Pigeon Post",
    cost: 15,
    desc: "Opat žije daleko a jezdí jen na návštěvu. Nabízí hejno holubů pro výcvik a spojení. Odemkne: budovu Porta a recept Ptačího papíru — bez něj holubí pošta nedoletí.",
    desc_en: "The Abbot lives far away and visits only occasionally. He offers a flock of pigeons for training and connection. Unlocks: the Porta building and the Bird Paper recipe — without it, the pigeon post cannot fly.",
    unlocks: ["bird_paper"],
    requires: []
});
// ── VÁPENICE (Calcaria) ──────────────────────────────────────────────────
TechTree.push({
    id: "tech_calcaria",
    name: "Calcaria — Vápenice",
    name_en: "Calcaria — Lime Kiln",
    cost: 25,
    desc: "Vápenec sám o sobě k ničemu není. Teprve dny a noci ohně ve vápenici z něj udělají pálené vápno, a hašení s trpělivým zráním v jámě dá maltu, omítku i pergamen. Odemkne: budovu Vápenice, pálení a hašení vápna.",
    desc_en: "Limestone alone is worth nothing. Only days and nights of fire in the kiln turn it into quicklime, and slaking with patient maturation in the pit yields mortar, plaster, and parchment. Unlocks: the Lime Kiln building, lime burning and slaking.",
    unlocks: ["burn_lime", "slake_lime", "soaked_hide_lime", "premium_soaked_hide", "premium_soaked_hide_goat", "premium_stretched_hide", "premium_vellum"],
    requires: ["tech_fodina"]
});