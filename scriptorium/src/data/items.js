const ItemsDB = {
    // BASIC MATERIALS
    "tinderbox":       { name:"Troud",               name_en:"Tinderbox",              icon:"🔥", type:"tool",        desc:"Sada na oheň.",                                    desc_en:"A fire-starting kit." },
    "rock":            { name:"Kámen",               name_en:"Stone",                  icon:"🪨", type:"mat",         desc:"Tvrdý.",                                           desc_en:"Hard stone." },
    "stick":           { name:"Větev",               name_en:"Branch",                 icon:"🪵", type:"mat",         desc:"Dřevo.",                                           desc_en:"A length of wood." },
    "fiber":           { name:"Tráva",               name_en:"Grass",                  icon:"🌾", type:"mat",         desc:"Vlákna.",                                          desc_en:"Plant fibres." },
    "bark":            { name:"Kůra",                name_en:"Bark",                   icon:"🍂", type:"mat",         desc:"Kůra stromu.",                                     desc_en:"Tree bark." },
    "charcoal":        { name:"Uhel",                name_en:"Charcoal",               icon:"⚫", type:"mat",         desc:"Spálené dřevo.",                                   desc_en:"Burned wood." },
    "water":           { name:"Voda",                name_en:"Water",                  icon:"💧", type:"mat",         desc:"Čistá voda.",                                      desc_en:"Clean water." },
    "herb_red":        { name:"Krvavý květ",         name_en:"Bloodwort",              icon:"🌺", type:"mat",         desc:"Bylina.",                                          desc_en:"A red healing herb." },
    "fat":             { name:"Tuk",                 name_en:"Fat",                    icon:"🥩", type:"mat",         desc:"Zvířecí tuk.",                                     desc_en:"Animal fat." },
    "meat":            { name:"Maso",                name_en:"Meat",                   icon:"🍖", type:"mat",         desc:"Surové maso.",                                     desc_en:"Raw meat." },
    "bone":            { name:"Kost",                name_en:"Bone",                   icon:"☠️", type:"mat",         desc:"Tvrdá kost.",                                      desc_en:"Hard bone." },
    "leather":         { name:"Kůže",                name_en:"Leather",                icon:"🦌", type:"mat",         desc:"Ze zvířat.",                                       desc_en:"Cured animal hide." },

    // TOOLS
    "sharp_stone":     { name:"Úštěpek",             name_en:"Flint Shard",            icon:"🔪", type:"tool",        desc:"Základní ostří.",                                  desc_en:"A crude cutting edge." },
    "stone_knife":     { name:"Nůž",                 name_en:"Stone Knife",            icon:"🗡️", type:"tool",        desc:"Nástroj k lovu.",                                  desc_en:"A hunting tool." },
    "pestle":          { name:"Hmoždíř",             name_en:"Mortar & Pestle",        icon:"🥣", type:"tool",        desc:"Na drcení.",                                       desc_en:"For grinding." },
    "flint":           { name:"Křesadlo",            name_en:"Flint",                  icon:"🔥", type:"tool",        desc:"Na oheň.",                                         desc_en:"For striking fire." },
    "primitive_torch": { name:"Louč",                name_en:"Torch",                  icon:"🪵", type:"tool",        desc:"Špinavé světlo.",                                  desc_en:"Crude light." },
    "candle":          { name:"Svíčka",              name_en:"Candle",                 icon:"🕯️", type:"tool",        desc:"24h světla.",                                      desc_en:"24 hours of light." },
    "rope":            { name:"Provaz",              name_en:"Rope",                   icon:"➰", type:"mat",         desc:"Pevný spoj.",                                      desc_en:"Strong binding." },
    "hoe":             { name:"Motyka",              name_en:"Hoe",                    icon:"⚒️", type:"tool",        desc:"K farmě.",                                         desc_en:"For the garden." },
    "fishing_rod":     { name:"Udice",               name_en:"Fishing Rod",            icon:"🎣", type:"tool",        desc:"Na ryby.",                                         desc_en:"For fishing." },
    "cooking_pot":     { name:"Hrnec",               name_en:"Cooking Pot",            icon:"🫕", type:"tool",        desc:"Na vaření.",                                       desc_en:"For cooking." },
    "basket":          { name:"Koš",                 name_en:"Basket",                 icon:"🧺", type:"tool",        desc:"Na sběr.",                                         desc_en:"For foraging." },
    "bucket":          { name:"Vědro",               name_en:"Bucket",                 icon:"🪣", type:"tool",        desc:"Větší nádoba na vodu.",                            desc_en:"Draws more water from the well.", cat:"tool" },
    "repair_kit":      { name:"Opravná sada",        name_en:"Repair Kit",             icon:"🔧", type:"tool",        desc:"Na opravu studny.",                                desc_en:"For repairing the well.", cat:"tool" },

    // LORE
    "pulp":            { name:"Dřevná drť",          name_en:"Wood Pulp",              icon:"🌫️", type:"mat",         desc:"Základ papíru.",                                   desc_en:"The base of paper." },
    "paper":           { name:"Papír",               name_en:"Paper",                  icon:"📄", type:"lore",        desc:"K psaní.",                                         desc_en:"For writing." },
    "ink":             { name:"Inkoust",             name_en:"Ink",                    icon:"✒️", type:"lore",        desc:"Černý.",                                           desc_en:"Black ink." },
    "research":        { name:"Zápisky",             name_en:"Notes",                  icon:"📜", type:"lore",        desc:"Vědění.",                                          desc_en:"Accumulated knowledge." },

    // ALCHEMY
    "bonemeal":        { name:"Hnojivo",             name_en:"Bonemeal",               icon:"🦴", type:"mat",         desc:"Z kostí.",                                         desc_en:"Ground bone fertilizer." },
    "seeds_herb":      { name:"Semínka",             name_en:"Seeds",                  icon:"🌱", type:"mat",         desc:"Rostliny.",                                        desc_en:"Plant seeds." },
    "potion_heal":     { name:"Mast",                name_en:"Healing Salve",          icon:"🧪", type:"alchemy",     desc:"Léčí.",                                            desc_en:"Heals wounds." },
    "antidote":        { name:"Protijed",            name_en:"Antidote",               icon:"💚", type:"alchemy",     desc:"Proti jedu.",                                      desc_en:"Against poison." },
    "stamina_tonic":   { name:"Tonikum síly",        name_en:"Stamina Tonic",          icon:"⚡", type:"alchemy",     desc:"Energie.",                                         desc_en:"Restores energy." },
    "preservation_oil":{ name:"Konzervační olej",    name_en:"Preservation Oil",       icon:"🫙", type:"alchemy",     desc:"Uchovává.",                                        desc_en:"Preserves food and materials." },
    "sleep_potion":    { name:"Lektvar spánku",      name_en:"Sleep Draught",          icon:"😴", type:"alchemy",     desc:"Hluboký spánek.",                                  desc_en:"Brings deep sleep." },
    "compost":         { name:"Kompost",             name_en:"Compost",                icon:"♻️", type:"mat",         desc:"Lepší hnojivo.",                                   desc_en:"Richer fertilizer." },
    "purification_powder":{ name:"Čisticí prášek",  name_en:"Purification Powder",    icon:"✨", type:"alchemy",     desc:"Odstraňuje nečistoty z vody.",                     desc_en:"Removes impurities from water.", cat:"alchemy" },
    "ash":             { name:"Popel",               name_en:"Ash",                    icon:"🌫️", type:"alchemy_ing", desc:"Z ohně.",                                          desc_en:"From the fire." },

    // ALCHEMY INGREDIENTS
    "frog":            { name:"Žába",                name_en:"Frog",                   icon:"🐸", type:"alchemy_ing", desc:"Z mokřadu.",                                       desc_en:"From the wetlands." },
    "slug":            { name:"Slimák",              name_en:"Slug",                   icon:"🐌", type:"alchemy_ing", desc:"Sliz.",                                            desc_en:"Slimy creature." },
    "resin":           { name:"Pryskyřice",          name_en:"Resin",                  icon:"💧", type:"alchemy_ing", desc:"Ze stromů.",                                       desc_en:"Tree resin." },
    "honey":           { name:"Med",                 name_en:"Honey",                  icon:"🍯", type:"alchemy_ing", desc:"Včelí med.",                                       desc_en:"Bee honey." },
    "mushroom_poison": { name:"Muchotrávka",         name_en:"Death Cap",              icon:"🍄", type:"alchemy_ing", desc:"Jedovatá houba.",                                  desc_en:"A poisonous mushroom." },
    "roots":           { name:"Kořeny",              name_en:"Roots",                  icon:"🪴", type:"alchemy_ing", desc:"Hluboké kořeny.",                                  desc_en:"Deep roots." },
    "nightshade":      { name:"Rulík",               name_en:"Nightshade",             icon:"🖤", type:"alchemy_ing", desc:"Jedovatý, léčivý.",                                desc_en:"Deadly yet medicinal." },

    // FOOD RAW
    "fish":            { name:"Ryba",                name_en:"Fish",                   icon:"🐟", type:"food_raw",    desc:"Čerstvá ryba.",                                    desc_en:"Fresh fish." },
    "mushroom":        { name:"Houby",               name_en:"Mushrooms",              icon:"🍄", type:"food_raw",    desc:"Jedlé houby.",                                     desc_en:"Edible mushrooms." },
    "carrot":          { name:"Mrkev",               name_en:"Carrot",                 icon:"🥕", type:"food_raw",    desc:"Ze zahrady.",                                      desc_en:"From the garden." },
    "onion":           { name:"Cibule",              name_en:"Onion",                  icon:"🧅", type:"food_raw",    desc:"Ze zahrady.",                                      desc_en:"From the garden." },
    "potato":          { name:"Brambora",            name_en:"Potato",                 icon:"🥔", type:"food_raw",    desc:"Ze zahrady.",                                      desc_en:"From the garden." },
    "berries":         { name:"Bobule",              name_en:"Berries",                icon:"🫐", type:"food_raw",    desc:"Lesní plody.",                                     desc_en:"Forest berries." },

    // COOKED FOOD
    "cooked_meat":     { name:"Pečené maso",         name_en:"Roasted Meat",           icon:"🍗", type:"food", hunger:6,  desc:"Sytí 6h.",   desc_en:"Fills for 6h." },
    "cooked_fish":     { name:"Pečená ryba",         name_en:"Roasted Fish",           icon:"🐠", type:"food", hunger:4,  desc:"Sytí 4h.",   desc_en:"Fills for 4h." },
    "stew":            { name:"Guláš",               name_en:"Stew",                   icon:"🍲", type:"food", hunger:12, desc:"Sytí 12h.",  desc_en:"Fills for 12h." },
    "mushroom_soup":   { name:"Houbová polévka",     name_en:"Mushroom Pottage",       icon:"🥣", type:"food", hunger:8,  desc:"Sytí 8h.",   desc_en:"Fills for 8h." },
    "bread":           { name:"Chléb",               name_en:"Bread",                  icon:"🍞", type:"food", hunger:10, desc:"Sytí 10h.",  desc_en:"Fills for 10h." },
    "berry_pie":       { name:"Borůvkový koláč",     name_en:"Berry Tart",             icon:"🥧", type:"food", hunger:8,  desc:"Sytí 8h.",   desc_en:"Fills for 8h." },

    // HERBS & SEEDS
    "herb_yellow":     { name:"Heřmánek",            name_en:"Chamomile",              icon:"🌼", type:"mat",         desc:"Uklidňující bylina.",                               desc_en:"A calming herb." },
    "herb_blue":       { name:"Levandule",           name_en:"Lavender",               icon:"💜", type:"mat",         desc:"Na spaní.",                                        desc_en:"For sleep." },
    "mint":            { name:"Máta",                name_en:"Mint",                   icon:"🌿", type:"mat",         desc:"Osvěžující.",                                      desc_en:"Refreshing." },
    "seeds_vegetable": { name:"Semínka zeleniny",    name_en:"Vegetable Seeds",        icon:"🌱", type:"mat",         desc:"Zelenina.",                                        desc_en:"Vegetable seeds." },
    "seeds_yellow":    { name:"Semínka heřmánku",    name_en:"Chamomile Seeds",        icon:"🌾", type:"mat",         desc:"Žlutá bylina.",                                    desc_en:"Yellow herb seeds." },
    "seeds_blue":      { name:"Semínka levandule",   name_en:"Lavender Seeds",         icon:"🌾", type:"mat",         desc:"Modrá bylina.",                                    desc_en:"Blue herb seeds." },
    "seeds_mint":      { name:"Semínka máty",        name_en:"Mint Seeds",             icon:"🌾", type:"mat",         desc:"Máta.",                                            desc_en:"Mint seeds." },
    "seeds_thyme":     { name:"Semínka tymiánu",     name_en:"Thyme Seeds",            icon:"🌾", type:"mat",         desc:"Tymián. Léčí Varroa, koření jídla.",               desc_en:"Thyme. Treats Varroa, seasons food." },

    // NOTEBOOKS
    "tabula":      { name:"Tabula (Vosková destička)",       name_en:"Tabula (Wax Tablet)",        icon:"📋", type:"tool", desc:"Dočasné poznámky.",  desc_en:"Temporary notes." },
    "adversaria":  { name:"Adversaria (Pracovní sešit)",     name_en:"Adversaria (Workbook)",      icon:"📔", type:"tool", desc:"Trvalé poznámky.",   desc_en:"Permanent notes." },
    "vademecum":   { name:"Vademecum (Jdi se mnou)",         name_en:"Vademecum (Go With Me)",     icon:"📘", type:"tool", desc:"Kapesní příručka.",  desc_en:"A pocket handbook." },
    "florilegium": { name:"Florilegium (Sbírka květů)",      name_en:"Florilegium (Flower Book)",  icon:"🌸", type:"tool", desc:"Sbírka mouder.",     desc_en:"A collection of wisdom." },
    "enchiridion": { name:"Enchiridion (Mistrovský manuál)", name_en:"Enchiridion (Master Manual)",icon:"📖", type:"tool", desc:"Ultimate systém.",   desc_en:"The ultimate system." },

    // I-CHING
    "iching_book": { name:"I-Ching (Kniha Proměn)", name_en:"I-Ching (Book of Changes)", icon:"☯️", type:"lore", cat:"lore", desc:"Starověký čínský text věštění. Hoď mince a poznej svůj osud.", desc_en:"Ancient Chinese divination. Cast coins and know thy fate." },

    // VELLUM CHAIN
    "hide":           { name:"Kůže",                 name_en:"Raw Hide",               icon:"🦌", type:"mat",  desc:"Surová kůže ze zvěře.",                            desc_en:"Raw hide from game." },
    "pumice":         { name:"Pemza",                name_en:"Pumice",                 icon:"🪨", type:"mat",  desc:"Sopečný kámen na leštění.",                        desc_en:"Volcanic stone for smoothing." },
    "chalk":          { name:"Křída",                name_en:"Chalk",                  icon:"⚪", type:"mat",  desc:"Bělení pergamenu.",                                desc_en:"For whitening vellum." },
    "ash_water":      { name:"Louh",                 name_en:"Lye Water",              icon:"💧", type:"mat",  desc:"Voda s popelem - na namáčení kůže.",               desc_en:"Ash water for soaking hide." },
    "soaked_hide":    { name:"Namáčená kůže",        name_en:"Soaked Hide",            icon:"🦌", type:"mat",  desc:"Kůže po 3denním loužení.",                         desc_en:"Hide after three days in lye." },
    "stretched_hide": { name:"Napnutá kůže",         name_en:"Stretched Hide",         icon:"🦌", type:"mat",  desc:"V rámu, sušená.",                                  desc_en:"Stretched on a frame to dry." },
    "vellum":         { name:"Pergamen",             name_en:"Vellum",                 icon:"📜", type:"lore", desc:"Vyšší kvalita než papír. Věčný.",                  desc_en:"Finer than paper. Eternal." },

    // QUILL
    "feather":        { name:"Husí pero",            name_en:"Goose Feather",          icon:"🪶", type:"mat",  desc:"Z křídla husy.",                                   desc_en:"From a goose wing." },
    "quill":          { name:"Brko",                 name_en:"Quill",                  icon:"🪶", type:"tool", desc:"10x použití. +2 ink/craft.",                       desc_en:"10 uses. +2 ink per craft." },

    // GALLIC INK
    "gall_nut":       { name:"Duběnka",              name_en:"Oak Gall",               icon:"🫘", type:"alchemy_ing", desc:"Hálka na dubu. Obsahuje tanin.",             desc_en:"Oak gall. Contains tannin." },
    "iron_sulfate":   { name:"Síran železnatý",      name_en:"Iron Vitriol",           icon:"⚗️", type:"alchemy_ing", desc:"Vitriol. Z chemické reakce.",                desc_en:"Vitriol. From chemical reaction." },
    "gum_arabic":     { name:"Arabská guma",         name_en:"Gum Arabic",             icon:"💧", type:"alchemy_ing", desc:"Ze stromů akácie. Pojidlo.",                 desc_en:"From acacia trees. A binder." },
    "ink_gallic":     { name:"Železitoduběnkový inkoust", name_en:"Iron Gall Ink",     icon:"✒️", type:"lore",        desc:"Permanentní. Prožírá pergamen po 80 letech.", desc_en:"Permanent. Eats through vellum after 80 years." },

    // PRINTING PRESS
    "lead_alloy":     { name:"Olověná slitina",      name_en:"Lead Alloy",             icon:"⚗️", type:"mat",  desc:"Základ tiskových liter.",                          desc_en:"Base for printing type." },
    "printing_type":  { name:"Tiskové litery",       name_en:"Printing Type",          icon:"🔤", type:"tool", desc:"100x použití. Pak worn_type.",                     desc_en:"100 uses. Then worn_type." },
    "worn_type":      { name:"Opotřebované litery",  name_en:"Worn Type",              icon:"🔤", type:"mat",  desc:"Prodávaly se jako kovový odpad.",                  desc_en:"Sold as scrap metal." },

    // CODEX TYPES
    "common_codex":   { name:"Běžný kodex",          name_en:"Common Codex",           icon:"📘", type:"lore", desc:"Papírový tisk. 1 research.",                       desc_en:"Paper print. 1 research." },
    "luxury_codex":   { name:"Luxusní kodex",        name_en:"Luxury Codex",           icon:"📕", type:"lore", desc:"S illuminací. 5 research.",                        desc_en:"Illuminated. 5 research." },
    "vellum_codex":   { name:"Pergamenový kodex",    name_en:"Vellum Codex",           icon:"📜", type:"lore", desc:"Na pergamenu. 10 research.",                       desc_en:"On vellum. 10 research." },

    // CANONICAL HOURS & PRIVILEGIUM
    "book_of_hours":       { name:"Horologium (Kniha hodin)", name_en:"Book of Hours",       icon:"🕰️", type:"lore", desc:"Odemkne kanonické hodiny.",    desc_en:"Unlocks the canonical hours system." },
    "bishop_seal":         { name:"Biskupská pečeť",          name_en:"Bishop's Seal",       icon:"💍", type:"lore", desc:"Souhlas biskupa k tisku.",      desc_en:"The bishop's approval to print." },
    "printing_privilege":  { name:"Tiskařské privilegium",    name_en:"Printing Privilege",  icon:"📜", type:"lore", desc:"Monopol na tisk. Endgame.",     desc_en:"A monopoly on printing. Endgame." },

    // GAMES
    "playing_cards":       { name:"Herní karty",              name_en:"Playing Cards",       icon:"🎴", type:"tool", desc:"Odemkne memory game.",          desc_en:"Unlocks the memory game." },
    "ur_board":            { name:"Královská Deska z Uru",    name_en:"Royal Game of Ur",    icon:"🎲", type:"tool", cat:"tool", desc:"Nejstarší desková hra (2600 př.n.l.).", desc_en:"The oldest known board game (2600 BC)." },
    "primero_deck":        { name:"Primero Balíček",          name_en:"Primero Deck",        icon:"🃏", type:"tool", cat:"tool", desc:"Předchůdce pokeru.",              desc_en:"Ancestor of poker." },
    "karnoffel_deck":      { name:"Karnöffel Balíček",        name_en:"Karnöffel Deck",      icon:"🎴", type:"tool", cat:"tool", desc:"Nejstarší trumfová hra. 1426.",   desc_en:"Oldest trump card game. 1426." },
    "french_deck":         { name:"Francouzský Balíček",      name_en:"French Deck",         icon:"🂡", type:"tool", cat:"tool", desc:"52 karet se čtyřmi barvami.",     desc_en:"52 cards in four suits." },
    "rithmomachia_board":  { name:"Rithmomachia Deska",       name_en:"Rithmomachia Board",  icon:"🔢", type:"tool", cat:"tool", desc:"Bitva čísel — na univerzitách.",  desc_en:"Battle of Numbers — taught at universities." },

    // EASTER EGG
    "netolicky_legacy":    { name:"Netolického pozůstalost",  name_en:"Netolický's Legacy",  icon:"📜", type:"lore", desc:"Starý dokument z tiskárny.",     desc_en:"An old document from the print shop." },

    // ATHANOR — ingredience (nové suroviny)
    "carbon_black":   { name:"Saze",             name_en:"Carbon Black",    icon:"🖤", type:"alchemy_ing", desc:"Saze z krbu. Nejstarší černý pigment.",           desc_en:"Soot from the hearth. The oldest black pigment." },
    "ochre":          { name:"Okr",              name_en:"Ochre",           icon:"🟤", type:"alchemy_ing", desc:"Žlutohnědá zemina. Pigment od pravěku.",          desc_en:"Yellow-brown earth. A pigment since prehistory." },
    "cinnabar":       { name:"Rumělka",          name_en:"Cinnabar",        icon:"🔴", type:"alchemy_ing", desc:"Sulfid rtuťnatý. Krásně červený, ale jedovatý.",  desc_en:"Mercuric sulfide. Beautiful red, but poisonous." },
    "lapis_lazuli":   { name:"Lapis lazuli",     name_en:"Lapis Lazuli",    icon:"💎", type:"alchemy_ing", desc:"Dražší než zlato. Barva roucha Panny Marie.",     desc_en:"More precious than gold. The colour of the Virgin's robe." },
    "verdigris":      { name:"Měděnka",          name_en:"Verdigris",       icon:"🟢", type:"alchemy_ing", desc:"Zelená patina mědi. Časem koroduje pergamen.",    desc_en:"Green copper patina. Corrodes vellum over time." },
    "egg_tempera":    { name:"Vaječná tempera",  name_en:"Egg Tempera",     icon:"🥚", type:"alchemy_ing", desc:"Žloutek s vínem. Nejstarší pojivo pigmentů.",     desc_en:"Egg yolk with wine. The oldest pigment binder." },
    "chamomile":      { name:"Heřmánek",         name_en:"Chamomile",       icon:"🌼", type:"herb",        desc:"Matka bylinek. Hildegarda ho doporučovala.",      desc_en:"Mother of herbs. Hildegard recommended it." },
    "st_johns_wort":  { name:"Třezalka",         name_en:"St. John's Wort", icon:"🌻", type:"herb",        desc:"Bylina sv. Jana. Léčí rány i melancholii.",       desc_en:"Herb of St. John. Heals wounds and melancholy." },
    "thyme":          { name:"Tymián",            name_en:"Thyme",           icon:"🌿", type:"herb",        desc:"Odvání Varroa z úlů. Hildegarda jej znala dobře.", desc_en:"Drives Varroa from hives. Hildegard knew it well." },
    "beeswax":        { name:"Včelí vosk",       name_en:"Beeswax",         icon:"🕯️", type:"mat",         desc:"Z klášterního úlu. Pojivo masti i pečetidlo.",   desc_en:"From the monastery hive. Salve binder and sealant." },

    // ATHANOR — výsledné produkty
    "ink_carbon":          { name:"Sazový inkoust",    name_en:"Carbon Ink",          icon:"🖤", type:"lore",    desc:"Černý inkoust ze sazí. Levný a trvanlivý.",          desc_en:"Black ink from soot. Cheap and durable." },
    "ink_red":             { name:"Červený inkoust",   name_en:"Red Ink",             icon:"🔴", type:"lore",    desc:"Rumělkový inkoust pro rubriky a iniciály.",          desc_en:"Cinnabar ink for rubrics and initials." },
    "pigment_yellow":      { name:"Žlutý pigment",     name_en:"Yellow Pigment",      icon:"🟡", type:"lore",    desc:"Okrový pigment v tempera. Pro iluminace.",           desc_en:"Ochre pigment in tempera. For illuminations." },
    "pigment_green":       { name:"Zelený pigment",    name_en:"Green Pigment",       icon:"🟢", type:"lore",    desc:"Měděnka v tempera. Časem koroduje pergamen.",       desc_en:"Verdigris in tempera. Corrodes vellum over time." },
    "pigment_blue":        { name:"Ultramarín",        name_en:"Ultramarine",         icon:"💙", type:"lore",    desc:"Z lapis lazuli. Dražší než zlato.",                  desc_en:"From lapis lazuli. More precious than gold." },
    "potion_vigor_minor":  { name:"Heřmánkový odvar",  name_en:"Chamomile Draught",   icon:"🌼", type:"potion",  desc:"Obnoví síly. Vigor +20.",                            desc_en:"Restores strength. Vigor +20." },
    "potion_craft_boost":  { name:"Třezalkový lektvar", name_en:"St. John's Tincture", icon:"🌻", type:"potion",  desc:"Crafting ×1.5 po dobu 1 hodiny.",                   desc_en:"Crafting ×1.5 for 1 hour." },
    "potion_hunger_remedy":{ name:"Hojivá mast",       name_en:"Healing Salve",       icon:"🕯️", type:"potion",  desc:"Zpomalí hlad o 4 hodiny.",                           desc_en:"Slows hunger by 4 hours." },
    "beer":                { name:"Pivo",              name_en:"Beer",                icon:"🍺", type:"food",    desc:"Otupí mysl, ale zažene hlad na 2h. Vigor -10.",      desc_en:"Dulls the mind but wards off hunger for 2h. Vigor -10." },
    "wine":                { name:"Víno",              name_en:"Wine",                icon:"🍷", type:"food",    desc:"In vino veritas. Crafting ×1.1 / 30 min. Vigor -15.", desc_en:"In vino veritas. Crafting ×1.1 / 30 min. Vigor -15." },
    "varnish":             { name:"Vernix",            name_en:"Varnish",             icon:"✨", type:"lore",    desc:"Průzračný lak na pergamen. Chrání iluminace.",       desc_en:"Clear varnish for parchment. Protects illuminations." },
    "salve_hands":         { name:"Mast na prsty",     name_en:"Hand Salve",          icon:"🌻", type:"potion",  desc:"Léčí písařská záda. Crafting ×1.25 / 30 min.",       desc_en:"Heals scribe hands. Crafting ×1.25 / 30 min." },

    // NOVÉ HRÁČSKÉ DESKY (sprint v8.x)
    "senet_board":      { name:"Senet",               name_en:"Senet Board",         icon:"𓂀", type:"tool", cat:"tool", desc:"Egyptská hra faraonů. 3100 př.n.l.",               desc_en:"Egyptian game of the pharaohs. 3100 BC." },
    "backgammon_board": { name:"Tables (Vrhcáby)",    name_en:"Tables Board",        icon:"🎯", type:"tool", cat:"tool", desc:"Hra kamenů a kostek. Předchůdce vrhcábů.",          desc_en:"Game of stones and dice. Ancestor of backgammon." },
    "draughts_board":   { name:"Dáma",                name_en:"Draughts Board",      icon:"⚫", type:"tool", cat:"tool", desc:"Hra dam a pánů. Jednoduchá, hluboká.",             desc_en:"Game of ladies and lords. Simple yet deep." },
    "hnefatafl_board":  { name:"Hnefatafl",           name_en:"Hnefatafl Board",     icon:"♟️", type:"tool", cat:"tool", desc:"Královská hra Vikingů. Král prchá, útočníci loví.", desc_en:"Royal Viking game. The king flees, warriors hunt." },

    // ═══════════════════════════════════════════════════════════════════════════
    // MUSIC SYSTEM (v8.x) — Hudební nástroje a notace
    // ═══════════════════════════════════════════════════════════════════════════
    "sheet_music":    { name:"Notový zápis",          name_en:"Sheet Music",         icon:"🎼", type:"lore",             desc:"Pergamen s neumatickou notací. Základ gregoriánského chorálu.",  desc_en:"Parchment with neume notation. The foundation of Gregorian chant." },
    "organ":          { name:"Varhany",               name_en:"Organ",               icon:"🎹", type:"tool", cat:"tool", desc:"Hydraulické varhany podle Theophila Presbytera. Hlas Boží.",     desc_en:"Hydraulic organ after Theophilus Presbyter. The voice of God." },

    // ═══════════════════════════════════════════════════════════════════════════
    // LEATHER SYSTEM (v8.x) — Kožené výrobky skriptoria
    // ═══════════════════════════════════════════════════════════════════════════
    "glue":           { name:"Klej",                  name_en:"Glue",                icon:"🫧", type:"mat",              desc:"Kostní klej. Váže dřevo i pergamen.",                           desc_en:"Bone glue. Bonds wood and parchment." },
    "plank":          { name:"Fošna",                 name_en:"Plank",               icon:"🪵", type:"mat",              desc:"Otesaná dřevěná deska. Základ každé stavby.",           desc_en:"A hewn wooden board. The foundation of every building." },
    "cut_stone":      { name:"Tesaný kámen",          name_en:"Cut Stone",           icon:"🧱", type:"mat",              desc:"Kámen opracovaný dlátem. Pevný základ sklepa i sýpky.", desc_en:"Stone shaped by chisel. The firm foundation of cellar and granary." },

    // ── NÁSTROJE (tech_kovarina + tech_horticulture) ──────────────────────────
    "axe":            { name:"Sekerka",             name_en:"Axe",              icon:"🪓", type:"tool", desc:"Tesařská sekerka. Odemkne těžbu dřeva (kulatina).",   desc_en:"Carpenter's axe. Unlocks wood harvesting (logs)." },
    "spade":          { name:"Rýč",                 name_en:"Spade",            icon:"⛏️", type:"tool", desc:"Rýč na kopání. Nutný pro červy a přesazování stromů.", desc_en:"Digging spade. Required for worms and transplanting trees." },
    "bucket":         { name:"Vědro",               name_en:"Bucket",           icon:"🪣", type:"tool", desc:"Dřevěné vědro. Přenáší vodu ze studny.",              desc_en:"Wooden bucket. Carries water from the well." },
    "shovel":         { name:"Lopata",              name_en:"Shovel",           icon:"🪛", type:"tool", desc:"Lopata na přesun půdy a hnoje.",                      desc_en:"Shovel for moving soil and manure." },
    "watering_can":   { name:"Konev",               name_en:"Watering Can",     icon:"🚿", type:"tool", desc:"Konev na zalévání zahrady.",                          desc_en:"Watering can for the garden." },
    "barrel_tool":    { name:"Sud",                 name_en:"Barrel",           icon:"🛢️", type:"tool", desc:"Dřevěný sud. Skladování piva, vína a vody.",          desc_en:"Wooden barrel. Storage for ale, wine and water." },
    "saw":            { name:"Pila",                name_en:"Saw",              icon:"🪚", type:"tool", desc:"Tesařská pila. Zpracování kulatiny na fošny.",         desc_en:"Carpenter's saw. Processes logs into planks." },
    "bellows":        { name:"Měchy",                 name_en:"Bellows",             icon:"💨", type:"tool", cat:"tool", desc:"Kožené měchy. Rozdmýchají oheň i varhanní píšťaly.",          desc_en:"Leather bellows. Fan the fire and the organ pipes alike." },
    "book_binding":   { name:"Vazba knih",            name_en:"Book Binding",        icon:"📚", type:"mat",              desc:"Kožená vazba drží složky pohromadě. Bez ní jsou jen listy.",   desc_en:"Leather binding holds the quires. Without it, just loose leaves." },
    "quill_case":     { name:"Pouzdro na pera",       name_en:"Quill Case",          icon:"🖊️", type:"tool", cat:"tool", desc:"Kožené pouzdro chrání husí brka před zlomením.",               desc_en:"Leather case protects quills from snapping." },
    "scribes_belt":   { name:"Opasek písaře",         name_en:"Scribe's Belt",       icon:"🪢", type:"tool", cat:"tool", desc:"Na opasku visí nůž, brousek a pouzdro na pero.",               desc_en:"Knife, whetstone and quill case hang from it. The scribe's kit." },
    "book_cover":     { name:"Kožená deska",          name_en:"Book Cover",          icon:"📖", type:"mat",              desc:"Dřevěná deska potažená kůží. Chrání kodex po staletí.",         desc_en:"Wooden board covered in leather. Protects the codex for centuries." },
    "cushion":        { name:"Kožené sedátko",        name_en:"Leather Cushion",     icon:"🪑", type:"tool", cat:"tool", desc:"Mniši seděli 6 hodin denně. Sedátko nebylo luxus — nutnost.",   desc_en:"Monks sat 6 hours daily. A cushion was necessity, not luxury." },
    "scrinium_case":  { name:"Transportní pouzdro",   name_en:"Scrinium Case",       icon:"🧳", type:"tool", cat:"tool", desc:"Kožené pouzdro na přepravu cenných kodexů.",                   desc_en:"Leather case for transporting precious codices." },
    "water_pouch":    { name:"Kožený měšec",          name_en:"Water Pouch",         icon:"🫗", type:"tool", cat:"tool", desc:"Kožený měšec na vodu. Mniši nosili pití při práci.",            desc_en:"Leather pouch for water. Monks carried drink during work." },
    "ink_pouch":      { name:"Váček na inkoust",      name_en:"Ink Pouch",           icon:"🫙", type:"mat",              desc:"Kožený váček na suchý inkoust a práškové pigmenty.",            desc_en:"Leather pouch for dry ink and powdered pigments." },
    // ═══════════════════════════════════════════════════════════════════════════
    // DVŮR — Nakupitelná zvířata (Trh)
    // ═══════════════════════════════════════════════════════════════════════════
    "hen_white":     { name:"Slepice bílá",   name_en:"White Hen",      icon:"🐔", type:"animal", desc:"Bílá slepice. Nosí vejce každých 8h.",       desc_en:"White hen. Lays eggs every 8h." },
    "hen_black":     { name:"Slepice černá",  name_en:"Black Hen",      icon:"🐓", type:"animal", desc:"Černá slepice. Nosí vejce každých 8h.",       desc_en:"Black hen. Lays eggs every 8h." },
    "hen_colored":   { name:"Slepice pestrá", name_en:"Coloured Hen",   icon:"🦚", type:"animal", desc:"Pestrá slepice. Dává více peří.",             desc_en:"Colourful hen. Produces more feathers." },
    "rooster":       { name:"Kohout",         name_en:"Rooster",        icon:"🐓", type:"animal", desc:"Kohout zvyšuje snůšku vajec o 20%.",          desc_en:"Rooster increases egg yield by 20%." },
    "sheep":         { name:"Ovce",           name_en:"Sheep",          icon:"🐑", type:"animal", desc:"Ovce produkuje vlnu, mléko a kůži.",          desc_en:"Sheep produces wool, milk and hide." },

    // ── Produkty zvířat ────────────────────────────────────────────────────
    "egg":            { name:"Vejce",            name_en:"Egg",             icon:"🥚", type:"mat",    desc:"Čerstvé vejce ze slepice. Jídlo i pigment.",   desc_en:"Fresh egg from the hen. Food and pigment." },
    "milk":           { name:"Mléko",            name_en:"Milk",            icon:"🥛", type:"mat",    desc:"Čerstvé mléko od ovce.",                       desc_en:"Fresh milk from the sheep." },
    "wool":           { name:"Vlna",             name_en:"Wool",            icon:"🧶", type:"mat",    desc:"Střižená vlna. Na přízi, tkaní i šití.",       desc_en:"Shorn wool. For spinning, weaving and sewing." },
    "raw_hide":       { name:"Surová kůže",      name_en:"Raw Hide",        icon:"🐑", type:"mat",    desc:"Neupravená zvířecí kůže. Nutno vyčinit.",      desc_en:"Untreated animal hide. Must be cured." },
    "feather_hen":    { name:"Peří",             name_en:"Hen Feather",     icon:"🪶", type:"mat",    desc:"Husté peří. Na polštáře i brky.",              desc_en:"Thick feathers. For pillows and quills." },

    // ── Produkty zahrady / včelína ─────────────────────────────────────────
    "pollen":         { name:"Pyl",              name_en:"Pollen",          icon:"🌼", type:"mat",    desc:"Včelí pyl. Léčivý a vzácný.",                  desc_en:"Bee pollen. Medicinal and rare." },
    "linden_blossom": { name:"Lipový květ",      name_en:"Linden Blossom",  icon:"🌸", type:"mat",    desc:"Sušený lipový květ. Do čaje i léčiv.",         desc_en:"Dried linden blossom. For tea and remedies." },
    "grass":          { name:"Tráva",              name_en:"Grass",            icon:"🌿", type:"mat",    desc:"Posečená čerstvá tráva. Suší se na seno.",     desc_en:"Cut fresh grass. Dried to make hay." },
    "queen_bee":     { name:"Včelí matka",    name_en:"Queen Bee",      icon:"🐝", type:"animal", desc:"Včelí matka. Nutná pro stavbu úlu.",          desc_en:"Queen bee. Required to establish a hive." },

    // ═══════════════════════════════════════════════════════════════════════════
    // DVŮR — Gallinarium & Ovile mláďata + maso (v8.x)
    // ═══════════════════════════════════════════════════════════════════════════
    "chick":         { name:"Kuře",           name_en:"Chick",          icon:"🐣", type:"animal", desc:"Mladé kuře. Dorůstá v kurníku.",             desc_en:"Young chick. Growing in the henhouse." },
    "lamb":          { name:"Jehně",          name_en:"Lamb",           icon:"🐑", type:"animal", desc:"Mladé jehně. Dorůstá v chlévu.",             desc_en:"Young lamb. Growing in the sheepfold." },
    "chicken_meat":  { name:"Kuřecí maso",    name_en:"Chicken Meat",   icon:"🍗", type:"food", hunger:5, desc:"Čerstvé kuřecí. Sytí 5h.",           desc_en:"Fresh chicken. Fills for 5h." },
    "mutton":        { name:"Skopové maso",   name_en:"Mutton",         icon:"🥩", type:"food", hunger:7, desc:"Skopové z chléva. Sytí 7h.",          desc_en:"Mutton from the fold. Fills for 7h." },
    "lamb_hide":     { name:"Jehněčí kůže",   name_en:"Lamb Hide",      icon:"🦌", type:"mat",         desc:"Jemná kůže jehněte. Kvalitnější pergamen.", desc_en:"Fine lamb skin. Superior vellum quality." },

    // ═══════════════════════════════════════════════════════════════════════════
    // PISCINA (Rybník) — v8.x
    // ═══════════════════════════════════════════════════════════════════════════
    "fry":           { name:"Plůdek (potěr)",    name_en:"Fish Fry",       icon:"🫧", type:"mat",      desc:"Malý rybí potěr. Vyrůstá v rybníce.",                   desc_en:"Tiny fish fry. Grows in the pond." },
    "carp_young":    { name:"Kapr (nedospělý)",  name_en:"Young Carp",     icon:"🐟", type:"mat",      desc:"Nedospělý kapr z výtažníku. Potřebuje čas.",            desc_en:"Young carp from the rearing pond. Needs time." },
    "carp":          { name:"Kapr tržní",        name_en:"Market Carp",    icon:"🐠", type:"food_raw", desc:"Dospělý kapr. Prodej nebo vaření.",                     desc_en:"Adult carp. For sale or cooking." },

    // ═══════════════════════════════════════════════════════════════════════════
    // PIVOVAR (Cervisiaria) — v9.x
    // ═══════════════════════════════════════════════════════════════════════════
    "grain":         { name:"Obilí",             name_en:"Grain",          icon:"🌾", type:"mat",      desc:"Základní surovina pro výrobu piva a chleba.",           desc_en:"Basic material for brewing and baking." },
    "hops":          { name:"Chmel",             name_en:"Hops",           icon:"🌿", type:"mat",      desc:"Aromatická rostlina. Dodává pivu hořkost a vůni.",      desc_en:"Aromatic plant. Gives beer bitterness and aroma." },
    "seeds_hops":    { name:"Semínka chmele",    name_en:"Hop Seeds",      icon:"🌾", type:"mat",      desc:"Chmel lze pěstovat v zahradě. Vzácné semínko.",          desc_en:"Hops can be grown in the garden. Rare seeds." },
    "wort":          { name:"Mladina",           name_en:"Wort",           icon:"🫗", type:"mat",      desc:"Fermentovaná obilná mladina. Základ každého piva.",      desc_en:"Fermented grain wort. The base of every beer." },
    "prima_cervisia":{ name:"Prima Cervisia",    name_en:"Prima Cervisia", icon:"🍺", type:"food",  hunger:6, desc:"Klášterní pivo světlé. Sytí a posiluje komunitu.", desc_en:"Light monastery ale. Nourishes and strengthens the community." },
    "cervisia_nigra":{ name:"Cervisia Nigra",    name_en:"Cervisia Nigra", icon:"🍺", type:"food",  hunger:8, desc:"Klášterní pivo tmavé. Vzácnější, chutnější.",       desc_en:"Dark monastery ale. Rarer and more flavourful." },

    // ═══════════════════════════════════════════════════════════════════════════
    // SAD — Semena stromů (Trh)
    // ═══════════════════════════════════════════════════════════════════════════
    "seed_apple":    { name:"Sazenice jabloně",    name_en:"Apple Sapling",     icon:"🍎", type:"mat", desc:"Sází se do sadu. Plodí za 48h.", desc_en:"Plant in the orchard. Bears fruit after 48h." },
    "seed_pear":     { name:"Sazenice hrušně",     name_en:"Pear Sapling",      icon:"🍐", type:"mat", desc:"Sází se do sadu. Plodí za 48h.", desc_en:"Plant in the orchard. Bears fruit after 48h." },
    "seed_plum":     { name:"Sazenice švestky",    name_en:"Plum Sapling",      icon:"🫐", type:"mat", desc:"Sází se do sadu. Plodí za 36h.", desc_en:"Plant in the orchard. Bears fruit after 36h." },
    "seed_cherry":   { name:"Sazenice třešně",     name_en:"Cherry Sapling",    icon:"🍒", type:"mat", desc:"Sází se do sadu. Plodí za 36h.", desc_en:"Plant in the orchard. Bears fruit after 36h." },
    "seed_walnut":   { name:"Sazenice ořešáku",    name_en:"Walnut Sapling",    icon:"🥜", type:"mat", desc:"Sází se do sadu. Plodí za 72h.", desc_en:"Plant in the orchard. Bears fruit after 72h." },
    "seed_mulberry": { name:"Sazenice morušovníku",name_en:"Mulberry Sapling",  icon:"🍇", type:"mat", desc:"Sází se do sadu. Plodí za 48h.", desc_en:"Plant in the orchard. Bears fruit after 48h." },
    "seed_quince":   { name:"Sazenice kdouloně",   name_en:"Quince Sapling",    icon:"🍋", type:"mat", desc:"Sází se do sadu. Plodí za 60h.", desc_en:"Plant in the orchard. Bears fruit after 60h." },
    "seed_sorb":     { name:"Sazenice jeřábu",     name_en:"Sorb Sapling",      icon:"🟤", type:"mat", desc:"Sází se do sadu. Plodí za 72h.", desc_en:"Plant in the orchard. Bears fruit after 72h." },
    "seed_rowan":    { name:"Sazenice jeřábu pt.",  name_en:"Rowan Sapling",    icon:"🔴", type:"mat", desc:"Sází se do sadu. Plodí za 48h.", desc_en:"Plant in the orchard. Bears fruit after 48h." },
    "seed_linden":   { name:"Sazenice lípy",        name_en:"Linden Sapling",   icon:"🌸", type:"mat", desc:"Sází se do sadu. Plodí za 60h.", desc_en:"Plant in the orchard. Bears fruit after 60h." },

    // ── KRMNÉ SUROVINY ────────────────────────────────────────────────────────
    "hay":            { name:"Seno",              name_en:"Hay",              icon:"🌾", type:"mat", desc:"Sušená tráva. Základní krmivo pro ovce, kozy a koně.", desc_en:"Dried grass. Basic fodder for sheep, goats and horses." },
    "grain":          { name:"Zrní",              name_en:"Grain",            icon:"🌾", type:"mat", desc:"Pšenice nebo ječmen. Krmivo pro slepice a prasata. Základ piva.", desc_en:"Wheat or barley. Feed for hens and pigs. The basis of ale." },
    "worms":          { name:"Červi",             name_en:"Worms",            icon:"🪱", type:"mat", desc:"Žížaly ze zahrady. Krmivo pro kapry.", desc_en:"Earthworms from the garden. Feed for carp." },
    "acorns":         { name:"Žaludy",            name_en:"Acorns",           icon:"🌰", type:"mat", desc:"Lesní plody z dubu. Krmivo pro prasata. Sbírají se na podzim.", desc_en:"Oak fruits from the forest. Pig fodder. Gathered in autumn." },
    "leaves":         { name:"Listí",             name_en:"Leaves",           icon:"🍃", type:"mat", desc:"Čerstvé listí stromů. Oblíbená pochutina koz.", desc_en:"Fresh tree leaves. A favourite treat for goats." },
    "scraps":         { name:"Zbytky",            name_en:"Scraps",           icon:"🍖", type:"mat", desc:"Kuchyňské zbytky. Prasata sní vše.", desc_en:"Kitchen scraps. Pigs eat everything." },

    // ── PRODUKTY NOVÝCH ZVÍŘAT (easter eggs — zvířata teprve přijdou) ────────
    "goat_hide":      { name:"Kozí kůže",         name_en:"Goat Hide",        icon:"🐐", type:"mat", desc:"Kozí kůže poskytuje nejkvalitnější pergamen — tenký, pevný, málo mastný. Italské kláštery ho znaly jako standard.", desc_en:"Goat hide yields the finest parchment — thin, strong, little grease. Italian monasteries knew it as the standard." },
    "goat_milk":      { name:"Kozí mléko",        name_en:"Goat Milk",        icon:"🥛", type:"mat", desc:"Kozí mléko a syrovátka. Součást klášterní lékárny. Podávalo se nemocným bratrům.", desc_en:"Goat milk and whey. Part of the monastic infirmary. Served to ailing brothers." },
    "vellum":         { name:"Vellum",            name_en:"Vellum",           icon:"📜", type:"mat", desc:"Pergamen z kůže nenarozeného nebo novorozeného telete. Nejluxusnější písací materiál středověku. Určen pro nejvzácnější kodexy.", desc_en:"Parchment from the hide of an unborn or newborn calf. The most luxurious writing material of the Middle Ages. Reserved for the rarest codices." },
    "lard":           { name:"Sádlo",             name_en:"Lard",             icon:"🫙", type:"mat", desc:"Vepřové sádlo. Konzervant, mazivo i palivo do lamp.", desc_en:"Pig lard. Preservative, lubricant and lamp fuel." },
    "cured_meat":     { name:"Uzené maso",        name_en:"Cured Meat",       icon:"🥩", type:"mat", desc:"Nasolené a uzené vepřové. Vydrží celou zimu. Zásobování konvršů a čeledi.", desc_en:"Salted and smoked pork. Lasts all winter. Provisions for lay brothers and servants." },
    "quill_premium":  { name:"Brk holubí",        name_en:"Pigeon Quill",     icon:"🪶", type:"mat", desc:"Holubí brk. Jemnější než husí, vhodný pro drobné písmo a iluminace.", desc_en:"Pigeon quill. Finer than goose feather, suited for small script and illumination." },
    "pigeon_dung":    { name:"Holubí trus",       name_en:"Pigeon Dung",      icon:"💩", type:"mat", desc:"Vysoce koncentrované hnojivo. Klášterní zahradníci ho sbírali z holubníku pro zahradu.", desc_en:"Highly concentrated fertiliser. Monastic gardeners collected it from the dovecote for the garden." },
    "butter":         { name:"Máslo",             name_en:"Butter",           icon:"🧈", type:"mat", desc:"Čerstvé máslo z kravského mléka. Postní výjimka u nemocných.", desc_en:"Fresh butter from cow's milk. A Lenten exception for the sick." },
    "cheese":         { name:"Sýr",               name_en:"Cheese",           icon:"🧀", type:"mat", desc:"Tvrdý klášterní sýr. Trvanlivý, výživný. Prodávaný na trzích.", desc_en:"Hard monastic cheese. Long-lasting, nutritious. Sold at markets." },

    // ── BUDOUCÍ ZVÍŘATA (easter eggs — jen definice, mechanika přijde později) ─
    "goat":           { name:"Koza",              name_en:"Goat",             icon:"🐐", type:"animal", desc:"Koza: kozí pergamen, léčivé mléko — ale pozor, sežere zahradní stromky. Věčný zdroj napětí v klášteře.", desc_en:"Goat: fine parchment, medicinal milk — but beware, she will eat the orchard saplings. An eternal source of tension in the monastery." },
    "cow":            { name:"Kráva",             name_en:"Cow",              icon:"🐄", type:"animal", desc:"Kráva: vellum z telete pro nejvzácnější kodexy, máslo, sýr. Velké kláštery jich měly desítky.", desc_en:"Cow: calf vellum for the rarest codices, butter, cheese. Great monasteries kept dozens." },
    "donkey":         { name:"Osel",              name_en:"Donkey",           icon:"🫏", type:"animal", desc:"Osel: vozí obilí ze sýpky do mlýna, pohání studnu. Levný, nenáročný, psychicky zdatný pro monotónní práci.", desc_en:"Donkey: carries grain from granary to mill, powers the well. Cheap, undemanding, mentally suited for monotonous work." },
    "horse":          { name:"Kůň",               name_en:"Horse",            icon:"🐴", type:"animal", desc:"Kůň: koňský potah ujede 30–40 km za den. Otevírá vzdálené trhy. Klášter ho potřebuje pro reprezentaci i vojenskou povinnost.", desc_en:"Horse: a horse-drawn cart covers 30–40 km a day. Opens distant markets. The monastery needs him for representation and military obligation." },
    "mule":           { name:"Mula",              name_en:"Mule",             icon:"🐴", type:"animal", desc:"Mula: církevní limuzína. Opati jezdili na bílých mulách jako symbol pokory i statusu. Horské stezky, solné cesty.", desc_en:"Mule: the ecclesiastical limousine. Abbots rode white mules as a symbol of humility and status. Mountain paths, salt roads." },
    "pigeon":         { name:"Holub",             name_en:"Pigeon",           icon:"🕊️", type:"animal", desc:"Holub: holubník jako zdroj čerstvého masa pro vzácné hosty, brků pro iluminátory a hnojiva pro zahradu.", desc_en:"Pigeon: the dovecote as a source of fresh meat for honoured guests, quills for illuminators, and dung for the garden." },
    "pig":            { name:"Prase",             name_en:"Pig",              icon:"🐷", type:"animal", desc:"Prase: přes léto na žaludění v lese, na zimu poraženo. Sádlo a uzené maso pro konvrše a čeleď. Mniši vepřové příliš nejedli.", desc_en:"Pig: summer grazing on acorns in the forest, slaughtered for winter. Lard and cured meat for lay brothers and servants. Monks ate little pork themselves." },
};
    // Oprava BUG #2 — semena stromů chybějící v ItemsDB (Trh nákup)
    // (vloženo před uzavírací }; — merge do objektu před buildem)