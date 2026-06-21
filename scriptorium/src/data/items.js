const ItemsDB = {
    // BASIC MATERIALS
    "tinderbox": { name: "Troud", name_en: "Tinderbox", icon: "🔥", type: "tool", tier: "fire", desc: "Sada na oheň.", desc_en: "A fire-starting kit." },
    "rock": { name: "Kámen", name_en: "Stone", icon: "🪨", type: "mat", desc: "Tvrdý.", desc_en: "Hard stone." },
    "clay": { name: "Hlína", name_en: "Clay", icon: "🟤", type: "mat", desc: "Jílovitá hlína z břehu potoka. Vhodná pro hrnčířství a stavbu.", desc_en: "Clay from a streambank. Good for pottery and construction." },
    "stick": { name: "Větev", name_en: "Branch", icon: "🪵", type: "mat", desc: "Dřevo.", desc_en: "A length of wood." },
    "fiber": { name: "Tráva", name_en: "Grass", icon: "🌾", type: "mat", desc: "Vlákna.", desc_en: "Plant fibres." },
    "bark": { name: "Kůra", name_en: "Bark", icon: "🍂", type: "mat", desc: "Kůra stromu.", desc_en: "Tree bark." },
    "charcoal": { name: "Uhel", name_en: "Charcoal", icon: "⚫", type: "mat", desc: "Spálené dřevo.", desc_en: "Burned wood." },
    "water": { name: "Voda", name_en: "Water", icon: "💧", type: "mat", desc: "Čistá voda.", desc_en: "Clean water." },
    "spring_water": { name: "Pramenitá voda", name_en: "Spring Water", icon: "🫧", type: "food", desc: "Čistá pramenitá voda. Osvěžuje tělo a snižuje únavu.", desc_en: "Pure spring water. Refreshes the body and eases fatigue." },
    "herb_red": { name: "Krvavý květ", name_en: "Bloodwort", icon: "🌺", type: "mat", desc: "Bylina.", desc_en: "A red healing herb." },
    "fat": { name: "Tuk", name_en: "Fat", icon: "🥩", type: "mat", desc: "Zvířecí tuk.", desc_en: "Animal fat." },
    "meat": { name: "Maso", name_en: "Meat", icon: "🍖", type: "mat", desc: "Surové maso.", desc_en: "Raw meat." },
    "bone": { name: "Kost", name_en: "Bone", icon: "☠️", type: "mat", desc: "Tvrdá kost.", desc_en: "Hard bone." },
    "leather": { name: "Kůže", name_en: "Leather", icon: "🦌", type: "mat", desc: "Ze zvířat.", desc_en: "Cured animal hide." },

    // TOOLS
    "sharp_stone": { name: "Úštěpek", name_en: "Flint Shard", icon: "🔪", type: "tool", desc: "Základní ostří.", desc_en: "A crude cutting edge." },
    "stone_knife": { name: "Nůž", name_en: "Stone Knife", icon: "🗡️", type: "tool", desc: "Nástroj k lovu.", desc_en: "A hunting tool." },
    "pestle": { name: "Hmoždíř", name_en: "Mortar & Pestle", icon: "🥣", type: "tool", desc: "Na drcení.", desc_en: "For grinding." },
    "flint": { name: "Křesadlo", name_en: "Flint", icon: "🔥", type: "tool", tier: "fire", desc: "Na oheň.", desc_en: "For striking fire." },
    "primitive_torch": { name: "Louč", name_en: "Torch", icon: "🪵", type: "tool", tier: "fire", desc: "Špinavé světlo.", desc_en: "Crude light." },
    "candle": { name: "Svíčka", name_en: "Candle", icon: "🕯️", type: "tool", tier: "fire", desc: "24h světla.", desc_en: "24 hours of light." },
    "rope": { name: "Provaz", name_en: "Rope", icon: "➰", type: "mat", desc: "Pevný spoj.", desc_en: "Strong binding." },
    "hoe": { name: "Motyka", name_en: "Hoe", icon: "⚒️", type: "tool", desc: "K farmě.", desc_en: "For the garden." },
    "fishing_rod": { name: "Udice", name_en: "Fishing Rod", icon: "🎣", type: "tool", desc: "Na ryby.", desc_en: "For fishing." },
    "cooking_pot": { name: "Hrnec", name_en: "Cooking Pot", icon: "🫕", type: "tool", desc: "Na vaření.", desc_en: "For cooking." },
    "tea_kettle": { name: "Konvička", name_en: "Kettle", icon: "🫖", type: "tool", desc: "Hliněná konvička na čaj. Pověsí se nad oheň.", desc_en: "A clay kettle for tea. Hung over the fire." },
    "basket": { name: "Koš", name_en: "Basket", icon: "🧺", type: "tool", desc: "Na sběr.", desc_en: "For foraging." },

    "repair_kit": { name: "Opravná sada", name_en: "Repair Kit", icon: "🔧", type: "tool", desc: "Na opravu studny.", desc_en: "For repairing the well.", cat: "tool" },

    // LORE
    "pulp": { name: "Dřevná drť", name_en: "Wood Pulp", icon: "🌫️", type: "mat", desc: "Základ papíru.", desc_en: "The base of paper." },
    "paper": { name: "Papír", name_en: "Paper", icon: "📄", type: "lore", desc: "K psaní.", desc_en: "For writing." },
    "ink": { name: "Inkoust", name_en: "Ink", icon: "✒️", type: "lore", desc: "Černý.", desc_en: "Black ink." },
    "research": { name: "Zápisky", name_en: "Notes", icon: "📜", type: "lore", desc: "Vědění.", desc_en: "Accumulated knowledge." },

    // ALCHEMY
    "bonemeal": { name: "Hnojivo", name_en: "Bonemeal", icon: "🦴", type: "mat", desc: "Z kostí.", desc_en: "Ground bone fertilizer." },
    "seeds_herb": { name: "Semínka", name_en: "Seeds", icon: "🌱", type: "mat", desc: "Rostliny.", desc_en: "Plant seeds." },
    "potion_heal": { name: "Mast", name_en: "Healing Salve", icon: "🧪", type: "alchemy", desc: "Léčí.", desc_en: "Heals wounds." },
    "antidote": { name: "Protijed", name_en: "Antidote", icon: "💚", type: "alchemy", desc: "Proti jedu.", desc_en: "Against poison." },
    "stamina_tonic": { name: "Tonikum síly", name_en: "Stamina Tonic", icon: "⚡", type: "alchemy", desc: "Energie.", desc_en: "Restores energy." },
    "preservation_oil": { name: "Konzervační olej", name_en: "Preservation Oil", icon: "🫙", type: "alchemy", desc: "Uchovává.", desc_en: "Preserves food and materials." },
    "sleep_potion": { name: "Lektvar spánku", name_en: "Sleep Draught", icon: "😴", type: "alchemy", desc: "Hluboký spánek.", desc_en: "Brings deep sleep." },
    "compost": { name: "Kompost", name_en: "Compost", icon: "♻️", type: "mat", desc: "Lepší hnojivo.", desc_en: "Richer fertilizer." },
    "purification_powder": { name: "Čisticí prášek", name_en: "Purification Powder", icon: "✨", type: "alchemy", desc: "Odstraňuje nečistoty z vody.", desc_en: "Removes impurities from water.", cat: "alchemy" },
    "ash": { name: "Popel", name_en: "Ash", icon: "🌫️", type: "alchemy_ing", desc: "Z ohně.", desc_en: "From the fire." },

    // ALCHEMY INGREDIENTS
    "frog": { name: "Žába", name_en: "Frog", icon: "🐸", type: "alchemy_ing", desc: "Z mokřadu.", desc_en: "From the wetlands." },
    "slug": { name: "Slimák", name_en: "Slug", icon: "🐌", type: "alchemy_ing", desc: "Sliz.", desc_en: "Slimy creature." },
    "resin": { name: "Pryskyřice", name_en: "Resin", icon: "💧", type: "alchemy_ing", desc: "Ze stromů.", desc_en: "Tree resin." },
    "honey": { name: "Med", name_en: "Honey", icon: "🍯", type: "alchemy_ing", desc: "Včelí med.", desc_en: "Bee honey." },
    "mushroom_poison": { name: "Muchotrávka", name_en: "Death Cap", icon: "🍄", type: "alchemy_ing", desc: "Jedovatá houba.", desc_en: "A poisonous mushroom." },
    "roots": { name: "Kořeny", name_en: "Roots", icon: "🪴", type: "alchemy_ing", desc: "Hluboké kořeny.", desc_en: "Deep roots." },
    "nightshade": { name: "Rulík", name_en: "Nightshade", icon: "🖤", type: "alchemy_ing", desc: "Jedovatý, léčivý.", desc_en: "Deadly yet medicinal." },

    // FOOD RAW
    "fish": { name: "Ryba", name_en: "Fish", icon: "🐟", type: "food_raw", desc: "Čerstvá ryba.", desc_en: "Fresh fish." },
    "mushroom": { name: "Houby", name_en: "Mushrooms", icon: "🍄", type: "food_raw", desc: "Jedlé houby.", desc_en: "Edible mushrooms." },
    "carrot": { name: "Mrkev", name_en: "Carrot", icon: "🥕", type: "food_raw", desc: "Ze zahrady.", desc_en: "From the garden." },
    "onion": { name: "Cibule", name_en: "Onion", icon: "🧅", type: "food_raw", desc: "Ze zahrady.", desc_en: "From the garden." },
    "leek": { name: "Pór", name_en: "Leek", icon: "🌿", type: "food_raw", desc: "Allium porrum. Klášterní zahrada ze Sankt Gallenu. Základ polévky.", desc_en: "Allium porrum. From the St Gallen monastery plan. Soup staple." },
    "cabbage": { name: "Zelí", name_en: "Cabbage", icon: "🥬", type: "food_raw", desc: "Brassica oleracea. Základ středověké stravy v Čechách. Kvas i vaření.", desc_en: "Brassica oleracea. Staple of medieval Czech diet. Fermented and cooked." },
    "radish": { name: "Ředkev", name_en: "Radish", icon: "🌱", type: "food_raw", desc: "Raphanus sativus. Capitulare de villis, 812. Jedla se syrová i vařená.", desc_en: "Raphanus sativus. Capitulare de villis, 812. Eaten raw and cooked." },
    "turnip": { name: "Řepa", name_en: "Turnip", icon: "🟣", type: "food_raw", desc: "Beta vulgaris. Zimní zásoby kláštera. Vydrží v sklepě celou zimu.", desc_en: "Beta vulgaris. Monastery winter stores. Keeps in the cellar all winter." },
    "garlic": { name: "Česnek", name_en: "Garlic", icon: "🧄", type: "food_raw", desc: "Allium sativum. Lék i koření. Hildegarda: teplý a suchý, zahání nemoci.", desc_en: "Allium sativum. Medicine and spice. Hildegard: warm and dry, drives off sickness." },
    "potato": { name: "Brambora", name_en: "Potato", icon: "🥔", type: "food_raw", desc: "Ze zahrady.", desc_en: "From the garden." },
    "berries": { name: "Bobule", name_en: "Berries", icon: "🫐", type: "food", hunger: 2, desc: "Lesní plody. Lze jíst syrové — zasytí na 2h.", desc_en: "Forest berries. Edible raw — fills for 2h." },

    // COOKED FOOD
    "cooked_meat": { name: "Pečené maso", name_en: "Roasted Meat", icon: "🍗", type: "food", hunger: 6, desc: "Sytí 6h.", desc_en: "Fills for 6h." },
    "cooked_fish": { name: "Pečená ryba", name_en: "Roasted Fish", icon: "🐠", type: "food", hunger: 4, desc: "Sytí 4h.", desc_en: "Fills for 4h." },
    "stew": { name: "Guláš", name_en: "Stew", icon: "🍲", type: "food", hunger: 12, desc: "Sytí 12h.", desc_en: "Fills for 12h." },
    "mushroom_soup": { name: "Houbová polévka", name_en: "Mushroom Pottage", icon: "🥣", type: "food", hunger: 8, desc: "Sytí 8h.", desc_en: "Fills for 8h." },
    "bread": { name: "Chléb", name_en: "Bread", icon: "🍞", type: "food", hunger: 10, desc: "Sytí 10h.", desc_en: "Fills for 10h." },
    "berry_pie": { name: "Borůvkový koláč", name_en: "Berry Tart", icon: "🥧", type: "food", hunger: 8, desc: "Sytí 8h.", desc_en: "Fills for 8h." },

    // HERBS & SEEDS
    "herb_yellow": { name: "Heřmánek", name_en: "Chamomile", icon: "🌼", type: "mat", desc: "Uklidňující bylina.", desc_en: "A calming herb." },
    "herb_blue": { name: "Levandule", name_en: "Lavender", icon: "💜", type: "mat", desc: "Na spaní.", desc_en: "For sleep." },
    "mint": { name: "Máta", name_en: "Mint", icon: "🌿", type: "mat", desc: "Osvěžující.", desc_en: "Refreshing." },
    "seeds_vegetable": { name: "Semínka zeleniny", name_en: "Vegetable Seeds", icon: "🌱", type: "mat", desc: "Zelenina.", desc_en: "Vegetable seeds." },
    "seeds_yellow": { name: "Semínka heřmánku", name_en: "Chamomile Seeds", icon: "🌾", type: "mat", desc: "Žlutá bylina.", desc_en: "Yellow herb seeds." },
    "seeds_blue": { name: "Semínka levandule", name_en: "Lavender Seeds", icon: "🌾", type: "mat", desc: "Modrá bylina.", desc_en: "Blue herb seeds." },
    "seeds_mint": { name: "Semínka máty", name_en: "Mint Seeds", icon: "🌾", type: "mat", desc: "Máta.", desc_en: "Mint seeds." },
    "seeds_thyme": { name: "Semínka tymiánu", name_en: "Thyme Seeds", icon: "🌾", type: "mat", desc: "Tymián. Léčí Varroa, koření jídla.", desc_en: "Thyme. Treats Varroa, seasons food." },
    "seeds_sage": { name: "Semínka šalvěje", name_en: "Sage Seeds", icon: "🌾", type: "mat", desc: "Šalvěj. Salvia — zachraňuje.", desc_en: "Sage. Salvia — it saves." },
    "seeds_fennel": { name: "Semínka fenyklu", name_en: "Fennel Seeds", icon: "🌾", type: "mat", desc: "Fenykl. Na trávení.", desc_en: "Fennel. For digestion." },
    "seeds_wormwood": { name: "Semínka pelynku", name_en: "Wormwood Seeds", icon: "🌾", type: "mat", desc: "Pelyněk. Hořký jako pokání.", desc_en: "Wormwood. Bitter as penance." },
    "seeds_hyssop": { name: "Semínka yzopu", name_en: "Hyssop Seeds", icon: "🌾", type: "mat", desc: "Yzop. Benediktinská bylina.", desc_en: "Hyssop. A Benedictine herb." },
    "seeds_yarrow": { name: "Semínka řebříčku", name_en: "Yarrow Seeds", icon: "🌾", type: "mat", desc: "Řebříček. Hojení ran.", desc_en: "Yarrow. Wound healing." },
    "seeds_leek": { name: "Semínka póru", name_en: "Leek Seeds", icon: "🌱", type: "mat", desc: "Pór. Ze záhonů sv. Gallenských.", desc_en: "Leek. From the St Gallen beds." },
    "seeds_cabbage": { name: "Semínka zelí", name_en: "Cabbage Seeds", icon: "🌱", type: "mat", desc: "Zelí. Základ stravy.", desc_en: "Cabbage. Diet staple." },
    "seeds_radish": { name: "Semínka ředkve", name_en: "Radish Seeds", icon: "🌱", type: "mat", desc: "Ředkev. Rychle klíčí.", desc_en: "Radish. Sprouts quickly." },
    "seeds_turnip": { name: "Semínka řepy", name_en: "Turnip Seeds", icon: "🌱", type: "mat", desc: "Řepa. Na zimu.", desc_en: "Turnip. For winter." },
    "seeds_garlic": { name: "Stroužky česneku", name_en: "Garlic Cloves", icon: "🧄", type: "mat", desc: "Česnek. Sází se stroužky, ne semeny.", desc_en: "Garlic. Planted as cloves, not seeds." },
    "seeds_rye": { name: "Osivo žita", name_en: "Rye Seed", icon: "🌾", type: "mat", desc: "Osivo žita. Ozimá plodina pro pole.", desc_en: "Rye seed. A winter crop for the fields." },
    "seeds_wheat": { name: "Osivo pšenice", name_en: "Wheat Seed", icon: "🌾", type: "mat", desc: "Osivo pšenice. Jarní plodina pro pole.", desc_en: "Wheat seed. A spring crop for the fields." },
    "seeds_barley": { name: "Osivo ječmene", name_en: "Barley Seed", icon: "🌾", type: "mat", desc: "Osivo ječmene. Pro pole, i pro pivovar.", desc_en: "Barley seed. For the fields — and the brewery." },
    "seeds_oats": { name: "Osivo ovsa", name_en: "Oat Seed", icon: "🌾", type: "mat", desc: "Osivo ovsa. Krmivo pro koně a dobytek.", desc_en: "Oat seed. Feed for horses and livestock." },
    "seeds_millet": { name: "Osivo prosa", name_en: "Millet Seed", icon: "🌾", type: "mat", desc: "Osivo prosa. Nenáročná plodina pro pole.", desc_en: "Millet seed. An undemanding field crop." },
    "seeds_peas": { name: "Osivo hrachu", name_en: "Pea Seed", icon: "🌱", type: "mat", desc: "Osivo hrachu. Luštěnina pro pole.", desc_en: "Pea seed. A legume for the fields." },
    "seeds_flax": { name: "Osivo lnu", name_en: "Flax Seed", icon: "🌱", type: "mat", desc: "Osivo lnu. Přadná plodina, vzácnější.", desc_en: "Flax seed. A fibre crop, rarer to find." },
    "seeds_mandrake": { name: "Semínka mandragory", name_en: "Mandrake Seeds", icon: "🌾", type: "mat", desc: "Vzácná. Opatřit není snadné.", desc_en: "Rare. Not easy to obtain." },
    "seeds_belladonna": { name: "Semínka rulíku", name_en: "Belladonna Seeds", icon: "🌾", type: "mat", desc: "Jedovatá. Zacházet opatrně.", desc_en: "Poisonous. Handle with care." },
    "seeds_poppy": { name: "Semínka máku", name_en: "Poppy Seeds", icon: "🌾", type: "mat", desc: "Mák. Léčivý i jedlý.", desc_en: "Poppy. Medicinal and edible." },
    "seeds_nettle": { name: "Semínka kopřivy", name_en: "Nettle Seeds", icon: "🌱", type: "mat", desc: "Kopřiva. Roste všude, ale v zahradě lépe.", desc_en: "Nettle. Grows anywhere, better in a garden." },
    "seeds_cannabis": { name: "Semínka konopí setého", name_en: "Hemp Seeds", icon: "🌱", type: "mat", desc: "Cannabis sativa. Konopí seté — pěstováno v Čechách od nepaměti na vlákno, olej i semena.", desc_en: "Cannabis sativa. Hemp — cultivated in Bohemia since ancient times for fibre, oil and seed." },

    // NOTEBOOKS
    "tabula": { name: "Tabula (Vosková destička)", name_en: "Tabula (Wax Tablet)", icon: "📋", type: "tool", desc: "Dočasné poznámky.", desc_en: "Temporary notes." },
    "adversaria": { name: "Adversaria (Pracovní sešit)", name_en: "Adversaria (Workbook)", icon: "📔", type: "tool", desc: "Trvalé poznámky.", desc_en: "Permanent notes." },
    "vademecum": { name: "Vademecum (Jdi se mnou)", name_en: "Vademecum (Go With Me)", icon: "📘", type: "tool", desc: "Kapesní příručka.", desc_en: "A pocket handbook." },
    "florilegium": { name: "Florilegium (Sbírka květů)", name_en: "Florilegium (Flower Book)", icon: "🌸", type: "tool", desc: "Sbírka mouder.", desc_en: "A collection of wisdom." },
    "enchiridion": { name: "Enchiridion (Mistrovský manuál)", name_en: "Enchiridion (Master Manual)", icon: "📖", type: "tool", desc: "Ultimate systém.", desc_en: "The ultimate system." },

    // I-CHING
    "iching_book": { name: "I-Ching (Kniha Proměn)", name_en: "I-Ching (Book of Changes)", icon: "☯️", type: "lore", cat: "lore", desc: "Starověký čínský text věštění. Hoď mince a poznej svůj osud.", desc_en: "Ancient Chinese divination. Cast coins and know thy fate." },

    // VELLUM CHAIN
    "hide": { name: "Kůže", name_en: "Raw Hide", icon: "🦌", type: "mat", desc: "Surová kůže ze zvěře.", desc_en: "Raw hide from game." },
    "pumice": { name: "Pemza", name_en: "Pumice", icon: "🪨", type: "mat", desc: "Sopečný kámen na leštění.", desc_en: "Volcanic stone for smoothing." },
    "chalk": { name: "Křída", name_en: "Chalk", icon: "⚪", type: "mat", desc: "Bělení pergamenu.", desc_en: "For whitening vellum." },
    "ash_water": { name: "Louh", name_en: "Lye Water", icon: "💧", type: "mat", desc: "Voda s popelem - na namáčení kůže.", desc_en: "Ash water for soaking hide." },
    "soaked_hide": { name: "Namáčená kůže", name_en: "Soaked Hide", icon: "🦌", type: "mat", desc: "Kůže po 3denním loužení.", desc_en: "Hide after three days in lye." },
    "stretched_hide": { name: "Napnutá kůže", name_en: "Stretched Hide", icon: "🦌", type: "mat", desc: "V rámu, sušená.", desc_en: "Stretched on a frame to dry." },
    "vellum": { name: "Pergamen", name_en: "Vellum", icon: "📜", type: "lore", desc: "Vyšší kvalita než papír. Věčný.", desc_en: "Finer than paper. Eternal." },

    // QUILL
    "feather": { name: "Husí pero", name_en: "Goose Feather", icon: "🪶", type: "mat", desc: "Z křídla husy.", desc_en: "From a goose wing." },
    "quill": { maxUses: 10, name: "Brko", name_en: "Quill", icon: "🪶", type: "tool", desc: "10x použití. +2 ink/craft.", desc_en: "10 uses. +2 ink per craft." },

    // GALLIC INK
    "gall_nut": { name: "Duběnka", name_en: "Oak Gall", icon: "🫘", type: "alchemy_ing", desc: "Hálka na dubu. Obsahuje tanin.", desc_en: "Oak gall. Contains tannin." },
    "iron_sulfate": { name: "Síran železnatý", name_en: "Iron Vitriol", icon: "⚗️", type: "alchemy_ing", desc: "Vitriol. Z chemické reakce.", desc_en: "Vitriol. From chemical reaction." },
    "gum_arabic": { name: "Arabská guma", name_en: "Gum Arabic", icon: "💧", type: "alchemy_ing", desc: "Ze stromů akácie. Pojidlo.", desc_en: "From acacia trees. A binder." },
    "ink_gallic": { name: "Železitoduběnkový inkoust", name_en: "Iron Gall Ink", icon: "✒️", type: "lore", desc: "Permanentní. Prožírá pergamen po 80 letech.", desc_en: "Permanent. Eats through vellum after 80 years." },

    // PRINTING PRESS
    "lead_alloy": { name: "Olověná slitina", name_en: "Lead Alloy", icon: "⚗️", type: "mat", desc: "Základ tiskových liter.", desc_en: "Base for printing type." },
    "printing_type": { name: "Tiskové litery", name_en: "Printing Type", icon: "🔤", type: "tool", desc: "100x použití. Pak worn_type.", desc_en: "100 uses. Then worn_type." },
    "worn_type": { name: "Opotřebované litery", name_en: "Worn Type", icon: "🔤", type: "mat", desc: "Prodávaly se jako kovový odpad.", desc_en: "Sold as scrap metal." },

    // CODEX TYPES
    "common_codex": { name: "Běžný kodex", name_en: "Common Codex", icon: "📘", type: "lore", desc: "Papírový tisk. 1 research.", desc_en: "Paper print. 1 research." },
    "luxury_codex": { name: "Luxusní kodex", name_en: "Luxury Codex", icon: "📕", type: "lore", desc: "S illuminací. 5 research.", desc_en: "Illuminated. 5 research." },
    "vellum_codex": { name: "Pergamenový kodex", name_en: "Vellum Codex", icon: "📜", type: "lore", desc: "Na pergamenu. 10 research.", desc_en: "On vellum. 10 research." },

    // CANONICAL HOURS & PRIVILEGIUM
    "book_of_hours": { name: "Horologium (Kniha hodin)", name_en: "Book of Hours", icon: "🕰️", type: "lore", desc: "Odemkne kanonické hodiny.", desc_en: "Unlocks the canonical hours system." },
    "perpetuum_calendarium": { maxStack: 1, name: "Perpetuum Calendarium", name_en: "Perpetuum Calendarium", icon: "📅", type: "lore", desc: "Klášterní kalendář na jeden rok. Ukazuje svátky, lunární cykly a doby postů. Obnovit v lednu.", desc_en: "Monastic calendar for one year. Shows feasts, lunar cycles and fasting periods. Renew in January." },
    "bishop_seal": { name: "Biskupská pečeť", name_en: "Bishop's Seal", icon: "💍", type: "lore", desc: "Souhlas biskupa k tisku.", desc_en: "The bishop's approval to print." },
    "printing_privilege": { name: "Tiskařské privilegium", name_en: "Printing Privilege", icon: "📜", type: "lore", desc: "Monopol na tisk. Endgame.", desc_en: "A monopoly on printing. Endgame." },

    // GAMES
    "playing_cards": { name: "Herní karty", name_en: "Playing Cards", icon: "🎴", type: "tool", desc: "Odemkne memory game.", desc_en: "Unlocks the memory game." },
    "ur_board": { name: "Královská Deska z Uru", name_en: "Royal Game of Ur", icon: "🎲", type: "tool", cat: "tool", desc: "Nejstarší desková hra (2600 př.n.l.).", desc_en: "The oldest known board game (2600 BC)." },
    "primero_deck": { name: "Primero Balíček", name_en: "Primero Deck", icon: "🃏", type: "tool", cat: "tool", desc: "Předchůdce pokeru.", desc_en: "Ancestor of poker." },
    "karnoffel_deck": { name: "Karnöffel Balíček", name_en: "Karnöffel Deck", icon: "🎴", type: "tool", cat: "tool", desc: "Nejstarší trumfová hra. 1426.", desc_en: "Oldest trump card game. 1426." },
    "french_deck": { name: "Francouzský Balíček", name_en: "French Deck", icon: "🂡", type: "tool", cat: "tool", desc: "52 karet se čtyřmi barvami.", desc_en: "52 cards in four suits." },
    "rithmomachia_board": { name: "Rithmomachia Deska", name_en: "Rithmomachia Board", icon: "🔢", type: "tool", cat: "tool", desc: "Bitva čísel — na univerzitách.", desc_en: "Battle of Numbers — taught at universities." },

    // EASTER EGG
    "netolicky_legacy": { name: "Netolického pozůstalost", name_en: "Netolický's Legacy", icon: "📜", type: "lore", desc: "Starý dokument z tiskárny.", desc_en: "An old document from the print shop." },

    // ── ZTRACENÉ PŘEDMĚTY (lostPool — yard_cleanup) ───────────────────────────
    "torn_page": {
        name: "Útržek pergamenu", name_en: "Torn Page", icon: "📄", type: "lore", lostItem: true,
        desc: "Potrhaný list s nečitelným textem. Místy čitelné latinské slabiky. Kdo to psal?", desc_en: "A torn leaf with barely legible text. Fragments of Latin visible. Who wrote this?"
    },
    "wax_seal": {
        name: "Pečetní vosk", name_en: "Wax Seal", icon: "🔴", type: "mat", lostItem: true,
        desc: "Stará pečeť odlomená od dopisu. Heraldický znak — ale čí? Vosk lze přetavit.", desc_en: "An old seal broken from a letter. A heraldic device — but whose? The wax can be remelted."
    },
    "dried_herbs_bundle": {
        name: "Svazek sušených bylin", name_en: "Dried Herbs Bundle", icon: "🌿", type: "mat", lostItem: true,
        desc: "Svazek sušených bylin svázaný provázkem. Někdo je tu zapomněl. Voní heřmánkem a mátohou.", desc_en: "A bundle of dried herbs tied with twine. Someone left it behind. Smells of chamomile and mint."
    },
    "hemp_pouch": {
        name: "Váček s konopím", name_en: "Hemp Pouch", icon: "👝", type: "mat", lostItem: true,
        desc: "Malý plátěný váček. Uvnitř semínka konopí a trocha vlákna. Staré, ale použitelné.", desc_en: "A small linen pouch. Inside: hemp seeds and some fibre. Old but usable."
    },
    "mysterious_bulb": {
        name: "Záhadný kořen", name_en: "Mysterious Bulb", icon: "🧅", type: "mat", lostItem: true,
        desc: "Cibulovitý kořen neznámého původu. Mohl by to být cokoliv. Jen zahrada odhalí pravdu.", desc_en: "A bulbous root of unknown origin. Could be anything. Only the garden will reveal the truth."
    },
    "lost_key_1": {
        name: "Rezavý klíč č.1", name_en: "Rusty Key #1", icon: "🗝️", type: "key", lostItem: true,
        desc: "Starý rezavý klíč. Neznámý původ. Třeba ho prozkoumat.", desc_en: "An old rusty key. Unknown origin. Worth examining."
    },
    "lost_key_2": {
        name: "Rezavý klíč č.2", name_en: "Rusty Key #2", icon: "🗝️", type: "key", lostItem: true,
        desc: "Starý rezavý klíč. Neznámý původ. Třeba ho prozkoumat.", desc_en: "An old rusty key. Unknown origin. Worth examining."
    },
    "lost_key_3": {
        name: "Rezavý klíč č.3", name_en: "Rusty Key #3", icon: "🗝️", type: "key", lostItem: true,
        desc: "Starý rezavý klíč. Neznámý původ. Třeba ho prozkoumat.", desc_en: "An old rusty key. Unknown origin. Worth examining."
    },
    "lost_key_4": {
        name: "Rezavý klíč č.4", name_en: "Rusty Key #4", icon: "🗝️", type: "key", lostItem: true, maxStack: 4,
        desc: "Starý rezavý klíč. Neznámý původ. Třeba ho prozkoumat. Může být nalezen vícekrát.", desc_en: "An old rusty key. Unknown origin. Worth examining. Can be found multiple times."
    },
    "lost_key_5": {
        name: "Rezavý klíč č.5", name_en: "Rusty Key #5", icon: "🗝️", type: "key", lostItem: true,
        desc: "Starý rezavý klíč. Neznámý původ. Třeba ho prozkoumat. Hlubší záhada čeká.", desc_en: "An old rusty key. Unknown origin. Worth examining. A deeper mystery awaits."
    },
    "key_large_1": {
        name: "Velký klíč č.1", name_en: "Large Key #1", icon: "🔑", type: "key", lostItem: true,
        desc: "Těžký kovaný klíč od nějakých velkých dveří. Třeba ho prozkoumat.", desc_en: "A heavy forged key to some large door. Worth examining."
    },
    "key_large_2": {
        name: "Velký klíč č.2", name_en: "Large Key #2", icon: "🔑", type: "key", lostItem: true,
        desc: "Těžký kovaný klíč od nějakých velkých dveří. Třeba ho prozkoumat.", desc_en: "A heavy forged key to some large door. Worth examining."
    },
    "key_large_3": {
        name: "Velký klíč č.3", name_en: "Large Key #3", icon: "🔑", type: "key", lostItem: true,
        desc: "Těžký kovaný klíč od nějakých velkých dveří. Třeba ho prozkoumat.", desc_en: "A heavy forged key to some large door. Worth examining."
    },
    "lost_scroll_1": {
        name: "Vybledlý svitek č.1", name_en: "Faded Scroll #1", icon: "📜", type: "lore", lostItem: true,
        desc: "Starý svitek popsaný vybledlým inkoustem. Třeba ho prozkoumat.", desc_en: "An old scroll covered in faded ink. Worth examining."
    },
    "lost_scroll_2": {
        name: "Vybledlý svitek č.2", name_en: "Faded Scroll #2", icon: "📜", type: "lore", lostItem: true,
        desc: "Starý svitek popsaný vybledlým inkoustem. Třeba ho prozkoumat.", desc_en: "An old scroll covered in faded ink. Worth examining."
    },
    "flask_cut": {
        name: "Broušený flakonek", name_en: "Cut Glass Flask", icon: "🫙", type: "misc", lostItem: true,
        desc: "Malý broušený flakonek z českého skla. Na voňavku nebo lektvar.", desc_en: "A small cut glass flask from Bohemian crystal. For perfume or potion."
    },
    "clasp_hunter": {
        name: "Lovecká spona", name_en: "Hunter's Clasp", icon: "🔩", type: "misc", lostItem: true,
        desc: "Bronzová spona ve tvaru jelena. Patřila lovci nebo rytíři.", desc_en: "Bronze clasp in the shape of a stag. Belonged to a hunter or knight."
    },
    "clasp_monk": {
        name: "Mnišská spona", name_en: "Monk's Clasp", icon: "🔩", type: "misc", lostItem: true,
        desc: "Jednoduchá železná spona. Sepínala hábit staletí.", desc_en: "A simple iron clasp. It fastened habits for centuries."
    },
    "clasp_silver": {
        name: "Stříbrná spona", name_en: "Silver Clasp", icon: "🔩", type: "misc", lostItem: true,
        desc: "Stříbrná filigránová spona. Kdo ji ztratil, hledá ji dodnes.", desc_en: "Silver filigree clasp. Whoever lost it is still looking."
    },
    "clasp_leather": {
        name: "Kožená spona", name_en: "Leather Clasp", icon: "🔩", type: "misc", lostItem: true,
        desc: "Vyřezávaná kožená spona. Řemeslná práce sedláře.", desc_en: "Carved leather clasp. The craftwork of a saddler."
    },
    "clasp_bronze": {
        name: "Bronzová spona", name_en: "Bronze Clasp", icon: "🔩", type: "misc", lostItem: true,
        desc: "Pozlacená bronzová spona s rytinou. Starší než klášter sám.", desc_en: "Gilded bronze clasp with engraving. Older than the monastery itself."
    },
    "pipe_large": {
        name: "Dýmka", name_en: "Pipe", icon: "🪵", type: "misc", lostItem: true,
        desc: "Velká dřevěná dýmka. Tabák do Čech teprve přijde — ale trocha sušeného konopí z váčku poslouží stejně dobře.", desc_en: "A large wooden pipe. Tobacco has yet to reach Bohemia — but a little dried hemp from a pouch serves just as well."
    },
    "pipe_small": {
        name: "Kapesní dýmka", name_en: "Pocket Pipe", icon: "🪵", type: "misc", lostItem: true,
        desc: "Malá kapesní dýmka. Vhodná na cestu — a pro tajnou chvilku klidu, má-li člověk po ruce váček konopí.", desc_en: "A small pocket pipe. Good for travel — and for a secret moment of peace, if one has a hemp pouch at hand."
    },
    "rosarium": {
        name: "Růženec", name_en: "Rosary", icon: "📿", type: "misc", lostItem: true,
        desc: "Dřevěný růženec ze dřeva ze Svaté země. Sto padesát zrn, sto padesát Ave Maria.", desc_en: "Wooden rosary from Holy Land timber. One hundred and fifty beads, one hundred and fifty Ave Marias."
    },
    "pilgrim_badge": {
        name: "Poutní odznak", name_en: "Pilgrim Badge", icon: "⭐", type: "misc", lostItem: true,
        desc: "Olověný odznak poutníka. Z Compostely, Říma nebo snad z Jeruzaléma?", desc_en: "A lead pilgrim badge. From Compostela, Rome, or perhaps Jerusalem?"
    },
    "sundial_pocket": {
        name: "Kapesní sluneční hodiny", name_en: "Pocket Sundial", icon: "☀️", type: "misc", lostItem: true,
        desc: "Mosazné kapesní hodiny na slunce. Bez slunce k ničemu. A přesto vzácné.", desc_en: "Brass pocket sundial. Useless without sun. And yet precious."
    },
    "inkwell_small": {
        name: "Malý kalamář", name_en: "Small Inkwell", icon: "🖊️", type: "misc", lostItem: true,
        desc: "Malý kalamář z hliněné glazury. Písař ho postrádá.", desc_en: "A small glazed clay inkwell. A scribe is missing it."
    },
    "old_coin_1": {
        name: "Měděná mince", name_en: "Copper Coin", icon: "🪙", type: "currency", lostItem: true,
        desc: "Stará měděná mince nalezená při úklidu dvora. Kdo ji ztratil? Dávno to bylo.", desc_en: "An old copper coin found while cleaning the yard. Who dropped it? Long ago, that."
    },
    "old_coin_2": {
        name: "Stříbrná mince", name_en: "Silver Coin", icon: "🪙", type: "currency", lostItem: true,
        desc: "Stříbrný groš, trochu otlučený. Nese znak českého království. Vzácnější nález.", desc_en: "A silver groschen, slightly worn. Bears the Bohemian crown mark. A rarer find."
    },
    "old_coin_3": {
        name: "Zlatá mince", name_en: "Gold Coin", icon: "🏅", type: "currency", lostItem: true,
        desc: "Zlatý dukát. V klášterním dvoře? Někdo ho tady musel ztratit za velmi podivných okolností.", desc_en: "A gold ducat. In the monastery yard? Someone must have dropped it under very peculiar circumstances."
    },

    // ATHANOR — ingredience (nové suroviny)
    "carbon_black": { name: "Saze", name_en: "Carbon Black", icon: "🖤", type: "alchemy_ing", desc: "Saze z krbu. Nejstarší černý pigment.", desc_en: "Soot from the hearth. The oldest black pigment." },
    "ochre": { name: "Okr", name_en: "Ochre", icon: "🟤", type: "alchemy_ing", desc: "Žlutohnědá zemina. Pigment od pravěku.", desc_en: "Yellow-brown earth. A pigment since prehistory." },
    "cinnabar": { name: "Rumělka", name_en: "Cinnabar", icon: "🔴", type: "alchemy_ing", desc: "Sulfid rtuťnatý. Krásně červený, ale jedovatý.", desc_en: "Mercuric sulfide. Beautiful red, but poisonous." },
    "lapis_lazuli": { name: "Lapis lazuli", name_en: "Lapis Lazuli", icon: "💎", type: "alchemy_ing", desc: "Dražší než zlato. Barva roucha Panny Marie.", desc_en: "More precious than gold. The colour of the Virgin's robe." },
    "verdigris": { name: "Měděnka", name_en: "Verdigris", icon: "🟢", type: "alchemy_ing", desc: "Zelená patina mědi. Časem koroduje pergamen.", desc_en: "Green copper patina. Corrodes vellum over time." },
    "egg_tempera": { name: "Vaječná tempera", name_en: "Egg Tempera", icon: "🥚", type: "alchemy_ing", desc: "Žloutek s vínem. Nejstarší pojivo pigmentů.", desc_en: "Egg yolk with wine. The oldest pigment binder." },
    "chamomile": { name: "Heřmánek", name_en: "Chamomile", icon: "🌼", type: "herb", desc: "Matka bylinek. Hildegarda ho doporučovala.", desc_en: "Mother of herbs. Hildegard recommended it." },
    "st_johns_wort": { name: "Třezalka", name_en: "St. John's Wort", icon: "🌻", type: "herb", desc: "Bylina sv. Jana. Léčí rány i melancholii.", desc_en: "Herb of St. John. Heals wounds and melancholy." },
    "thyme": { name: "Tymián", name_en: "Thyme", icon: "🌿", type: "herb", desc: "Odvání Varroa z úlů. Hildegarda jej znala dobře.", desc_en: "Drives Varroa from hives. Hildegard knew it well." },
    "sage": { name: "Šalvěj", name_en: "Sage", icon: "🌿", type: "herb", desc: "Salvia officinalis. Kapitulář Karla Velikého. Čistí vzduch i mysl.", desc_en: "Salvia officinalis. Capitulare de villis. Purifies air and mind." },
    "fennel": { name: "Fenykl", name_en: "Fennel", icon: "🌿", type: "herb", desc: "Foeniculum vulgare. Dobrý na trávení, Hildegarda jej doporučovala.", desc_en: "Foeniculum vulgare. Good for digestion, praised by Hildegard." },
    "wormwood": { name: "Pelyněk", name_en: "Wormwood", icon: "🌿", type: "herb", desc: "Artemisia absinthium. Bylina všech bylin. Chrání před morem.", desc_en: "Artemisia absinthium. Herb of herbs. Wards off pestilence." },
    "hyssop": { name: "Yzop", name_en: "Hyssop", icon: "🌿", type: "herb", desc: "Hyssopus officinalis. Benediktinský klášter bez yzopu? Nemyslitelné.", desc_en: "Hyssopus officinalis. A Benedictine monastery without hyssop? Unthinkable." },
    "yarrow": { name: "Řebříček", name_en: "Yarrow", icon: "🌿", type: "herb", desc: "Achillea millefolium. Hojí rány. Místní česká bylina, v Čechách od nepaměti.", desc_en: "Achillea millefolium. Heals wounds. A native Czech herb, grown here since time immemorial." },
    "beeswax": { name: "Včelí vosk", name_en: "Beeswax", icon: "🕯️", type: "mat", desc: "Z klášterního úlu. Pojivo masti i pečetidlo.", desc_en: "From the monastery hive. Salve binder and sealant." },
    "mandrake": { name: "Mandragora", name_en: "Mandrake", icon: "🌿", type: "special", desc: "Mandragora officinarum. Kapitulář Karla Velikého. Kořen ve tvaru člověka — křičí při vytrhnutí. Pro silné lektvary.", desc_en: "Mandragora officinarum. Root shaped like a man — screams when pulled. For powerful potions." },
    "belladonna": { name: "Rulík zlomocný", name_en: "Belladonna", icon: "🫐", type: "special", desc: "Atropa belladonna. Jed i lék. Lékárníci jej míchali v malých dávkách. Nebezpečná rostlina.", desc_en: "Atropa belladonna. Poison and medicine alike. Apothecaries used it in small doses. Dangerous." },
    "poppy": { name: "Mák", name_en: "Poppy", icon: "🌸", type: "special", desc: "Papaver somniferum. Hildegarda znala jeho moc. Tišil bolest, navozoval spánek. Cenný i drahý.", desc_en: "Papaver somniferum. Hildegard knew its power. Eased pain, brought sleep. Valued and costly." },
    "nettle": { name: "Kopřiva", name_en: "Nettle", icon: "🌿", type: "special", desc: "Urtica dioica. Vlákno, jídlo i lék. Klášterní zahrady ji pěstovaly záměrně — na látku i odvar.", desc_en: "Urtica dioica. Fibre, food and medicine. Monastery gardens cultivated it deliberately." },
    "cannabis": { name: "Konopí seté", name_en: "Hemp", icon: "🌿", type: "mat", desc: "Cannabis sativa. Pěstováno v Čechách od středověku — vlákno na lana a plátno, semena na olej i jídlo.", desc_en: "Cannabis sativa. Cultivated in Bohemia since the Middle Ages — fibre for rope and cloth, seeds for oil and food." },

    // ATHANOR — výsledné produkty
    "ink_carbon": { name: "Sazový inkoust", name_en: "Carbon Ink", icon: "🖤", type: "lore", desc: "Černý inkoust ze sazí. Levný a trvanlivý.", desc_en: "Black ink from soot. Cheap and durable." },
    "ink_red": { name: "Červený inkoust", name_en: "Red Ink", icon: "🔴", type: "lore", desc: "Rumělkový inkoust pro rubriky a iniciály.", desc_en: "Cinnabar ink for rubrics and initials." },
    "pigment_yellow": { name: "Žlutý pigment", name_en: "Yellow Pigment", icon: "🟡", type: "lore", desc: "Okrový pigment v tempera. Pro iluminace.", desc_en: "Ochre pigment in tempera. For illuminations." },
    "pigment_green": { name: "Zelený pigment", name_en: "Green Pigment", icon: "🟢", type: "lore", desc: "Měděnka v tempera. Časem koroduje pergamen.", desc_en: "Verdigris in tempera. Corrodes vellum over time." },
    "pigment_blue": { name: "Ultramarín", name_en: "Ultramarine", icon: "💙", type: "lore", desc: "Z lapis lazuli. Dražší než zlato.", desc_en: "From lapis lazuli. More precious than gold." },
    "potion_vigor_minor": { name: "Heřmánkový odvar", name_en: "Chamomile Draught", icon: "🌼", type: "potion", desc: "Obnoví síly. Vigor +20.", desc_en: "Restores strength. Vigor +20." },
    "potion_craft_boost": { name: "Třezalkový lektvar", name_en: "St. John's Tincture", icon: "🌻", type: "potion", desc: "Crafting ×1.5 po dobu 1 hodiny.", desc_en: "Crafting ×1.5 for 1 hour." },
    "potion_hunger_remedy": { name: "Hojivá mast", name_en: "Healing Salve", icon: "🕯️", type: "potion", desc: "Zpomalí hlad o 4 hodiny.", desc_en: "Slows hunger by 4 hours." },
    "herbal_tea": { name: "Bylinný čaj", name_en: "Herbal Tea", icon: "🍵", type: "food", desc: "Heřmánek, tymián nebo máta s vodou. Uklidní tělo a sníží únavu.", desc_en: "Chamomile, thyme or mint with water. Calms the body and eases fatigue." },
    "acorn_brew": { name: "Žaludovka", name_en: "Acorn Brew", icon: "☕", type: "food", desc: "Náhražka kávy ze žaludů. Hořká, ale zahřeje a pročistí hlavu.", desc_en: "A coffee substitute from acorns. Bitter, but warming and clearing." },
    "chicory_drink": { name: "Cikorka", name_en: "Chicory Coffee", icon: "🥤", type: "food", desc: "Z pražené a mleté čekanky vařené s vodou. Starobylý klášterní lék na únavu.", desc_en: "From roasted, ground chicory root boiled with water. An ancient monastic remedy for fatigue." },
    "acorn_roasted": { name: "Pražený žalud", name_en: "Roasted Acorn", icon: "🌰", type: "mat", desc: "Pražené a mleté žaludy. Připraveno k vaření Žaludovky.", desc_en: "Roasted, ground acorns. Ready for brewing into Acorn Brew." },
    "chicory_roasted": { name: "Pražená čekanka", name_en: "Roasted Chicory", icon: "🪴", type: "mat", desc: "Pražený a mletý kořen čekanky. Připraveno k vaření Cikorky.", desc_en: "Roasted, ground chicory root. Ready for brewing into Chicory Coffee." },
    "linden_tea": { name: "Lipový čaj", name_en: "Linden Tea", icon: "🍵", type: "food", desc: "Sušený lipový květ s horkou vodou. Uklidňující, lehce sytící.", desc_en: "Dried linden blossom with hot water. Calming, mildly nourishing." },
    "beer": { name: "Pivo", name_en: "Beer", icon: "🍺", type: "food", desc: "Otupí mysl, ale zažene hlad. Únava +10 — pozor!", desc_en: "Dulls the mind but wards off hunger. Fatigue +10 — beware!" },
    "wine": { name: "Víno", name_en: "Wine", icon: "🍷", type: "food", desc: "In vino veritas. Crafting ×1.1 / 30 min. Vigor -15.", desc_en: "In vino veritas. Crafting ×1.1 / 30 min. Vigor -15." },
    "varnish": { name: "Vernix", name_en: "Varnish", icon: "✨", type: "lore", desc: "Průzračný lak na pergamen. Chrání iluminace.", desc_en: "Clear varnish for parchment. Protects illuminations." },
    "salve_hands": { name: "Mast na prsty", name_en: "Hand Salve", icon: "🌻", type: "potion", desc: "Léčí písařská záda. Crafting ×1.25 / 30 min.", desc_en: "Heals scribe hands. Crafting ×1.25 / 30 min." },

    // NOVÉ HRÁČSKÉ DESKY (sprint v8.x)
    "senet_board": { name: "Senet", name_en: "Senet Board", icon: "𓂀", type: "tool", cat: "tool", desc: "Egyptská hra faraonů. 3100 př.n.l.", desc_en: "Egyptian game of the pharaohs. 3100 BC." },
    "backgammon_board": { name: "Tables (Vrhcáby)", name_en: "Tables Board", icon: "🎯", type: "tool", cat: "tool", desc: "Hra kamenů a kostek. Předchůdce vrhcábů.", desc_en: "Game of stones and dice. Ancestor of backgammon." },
    "draughts_board": { name: "Dáma", name_en: "Draughts Board", icon: "⚫", type: "tool", cat: "tool", desc: "Hra dam a pánů. Jednoduchá, hluboká.", desc_en: "Game of ladies and lords. Simple yet deep." },
    "hnefatafl_board": { name: "Hnefatafl", name_en: "Hnefatafl Board", icon: "♟️", type: "tool", cat: "tool", desc: "Královská hra Vikingů. Král prchá, útočníci loví.", desc_en: "Royal Viking game. The king flees, warriors hunt." },

    // ═══════════════════════════════════════════════════════════════════════════
    // MUSIC SYSTEM (v8.x) — Hudební nástroje a notace
    // ═══════════════════════════════════════════════════════════════════════════
    "sheet_music": { name: "Notový zápis", name_en: "Sheet Music", icon: "🎼", type: "lore", desc: "Pergamen s neumatickou notací. Základ gregoriánského chorálu.", desc_en: "Parchment with neume notation. The foundation of Gregorian chant." },
    "organ": { name: "Varhany", name_en: "Organ", icon: "🎹", type: "tool", cat: "tool", desc: "Hydraulické varhany podle Theophila Presbytera. Hlas Boží.", desc_en: "Hydraulic organ after Theophilus Presbyter. The voice of God." },

    // ═══════════════════════════════════════════════════════════════════════════
    // LEATHER SYSTEM (v8.x) — Kožené výrobky skriptoria
    // ═══════════════════════════════════════════════════════════════════════════
    "glue": { name: "Klej", name_en: "Glue", icon: "🫧", type: "mat", desc: "Kostní klej. Váže dřevo i pergamen.", desc_en: "Bone glue. Bonds wood and parchment." },
    "plank": { name: "Fošna", name_en: "Plank", icon: "🪵", type: "mat", desc: "Otesaná dřevěná deska. Základ každé stavby.", desc_en: "A hewn wooden board. The foundation of every building." },
    "cut_stone": { name: "Tesaný kámen", name_en: "Cut Stone", icon: "🧱", type: "mat", desc: "Kámen opracovaný dlátem. Pevný základ sklepa i sýpky.", desc_en: "Stone shaped by chisel. The firm foundation of cellar and granary." },

    // ── KAMENNÉ NÁSTROJE (tech_horticulture + tech_carpentaria) ────────────────
    "stone_axe": { maxUses: 10, name: "Kamenná sekerka", name_en: "Stone Axe", icon: "🪓", type: "tool", tier: "stone", desc: "Kamenné ostří na dřevěné násadě. Odemkne těžbu dřeva.", desc_en: "Stone blade on a wooden haft. Unlocks wood harvesting." },
    "stone_spade": { maxUses: 10, name: "Kamenný rýč", name_en: "Stone Spade", icon: "⛏️", type: "tool", tier: "stone", desc: "Plochý kámen na násadě. Kopání červů a přesazování.", desc_en: "Flat stone on a haft. Digging worms and transplanting." },
    "stone_scythe": { maxUses: 10, name: "Kamenná kosa", name_en: "Stone Scythe", icon: "⚔️", type: "tool", tier: "stone", desc: "Kamenné ostří. Sečení trávy na seno.", desc_en: "Stone blade. Cuts grass for hay." },
    "stone_sickle": { maxUses: 10, name: "Kamenný srp", name_en: "Stone Sickle", icon: "🌾", type: "tool", tier: "stone", desc: "Malé kamenné ostří. Žeň bylin a obilí.", desc_en: "Small stone blade. Harvesting herbs and grain." },
    "stone_flail": { maxUses: 10, name: "Kamenný cep", name_en: "Stone Flail", icon: "🪵", type: "tool", tier: "stone", desc: "Dřevěný cep s kamenným závažím. Mlácení obilí.", desc_en: "Wooden flail with stone weight. Threshing grain." },
    "wooden_flail": { maxUses: 15, name: "Dřevěný cep", name_en: "Wooden Flail", icon: "🪵", type: "tool", tier: "wood", desc: "Prostý dřevěný cep. Nejjednodušší mlácení obilí.", desc_en: "Simple wooden flail. The most basic threshing tool." },
    "stone_pickaxe": { maxUses: 10, name: "Kamenný krumpáč", name_en: "Stone Pickaxe", icon: "⛏️", type: "tool", tier: "stone", desc: "Kamenná hlava na násadě. Těžba rudy a bourání kamene.", desc_en: "Stone head on a haft. Ore mining and stone breaking." },
    "stone_shovel": { name: "Kamenná lopata", name_en: "Stone Shovel", icon: "🪛", type: "tool", tier: "stone", desc: "Plochý kámen jako lopata. Přesun půdy a hnoje.", desc_en: "Flat stone as shovel. Moving soil and manure." },
    "stone_saw": { maxUses: 10, name: "Kamenná pila", name_en: "Stone Saw", icon: "🪚", type: "tool", tier: "stone", desc: "Pila z křemenných úštěpků. Hrubé opracování dřeva.", desc_en: "Saw of flint chips. Rough wood working." },

    // ── DŘEVĚNÉ NÁSTROJE (jen jedna verze) ──────────────────────────────────
    "bucket": { name: "Vědro", name_en: "Bucket", icon: "🪣", type: "tool", desc: "Dřevěné vědro. Přenáší vodu ze studny.", desc_en: "Wooden bucket. Carries water from the well." },
    "watering_can": { name: "Konev", name_en: "Watering Can", icon: "🚿", type: "tool", desc: "Konev na zalévání zahrady.", desc_en: "Watering can for the garden." },
    "barrel_tool": { name: "Sud", name_en: "Barrel", icon: "🛢️", type: "tool", desc: "Dřevěný sud. Skladování piva, vína a vody.", desc_en: "Wooden barrel. Storage for ale, wine and water." },

    // ── KOVOVÉ NÁSTROJE (tech_kovarina — po kovárně) ─────────────────────────
    "iron_axe": { maxUses: 20, maxStack: 1, name: "Železná sekerka", name_en: "Iron Axe", icon: "🪓", type: "tool", tier: "iron", desc: "Železné ostří. Rychlejší těžba dřeva, více kulatiny.", desc_en: "Iron blade. Faster wood harvesting, more logs." },
    "iron_spade": { maxUses: 20, maxStack: 1, name: "Železný rýč", name_en: "Iron Spade", icon: "⛏️", type: "tool", tier: "iron", desc: "Železný rýč. Více červů, hlubší kopání.", desc_en: "Iron spade. More worms, deeper digging." },
    "iron_scythe": { maxUses: 20, maxStack: 1, name: "Železná kosa", name_en: "Iron Scythe", icon: "⚔️", type: "tool", tier: "iron", desc: "Ostrá železná kosa. Více trávy za méně akcí.", desc_en: "Sharp iron scythe. More grass per action." },
    "iron_sickle": { maxUses: 20, maxStack: 1, name: "Železný srp", name_en: "Iron Sickle", icon: "🌾", type: "tool", tier: "iron", desc: "Železný srp. Přesná žeň obilí a bylin.", desc_en: "Iron sickle. Precise harvesting of grain and herbs." },
    "iron_flail": { maxUses: 20, maxStack: 1, name: "Železný cep", name_en: "Iron Flail", icon: "🪵", type: "tool", tier: "iron", desc: "Železné závaží. Efektivnější mlácení obilí.", desc_en: "Iron weight. More efficient threshing." },
    "iron_shovel": { maxUses: 20, maxStack: 1, name: "Železná lopata", name_en: "Iron Shovel", icon: "🪛", type: "tool", tier: "iron", desc: "Železná lopata. Rychlý přesun půdy a hnoje.", desc_en: "Iron shovel. Fast movement of soil and manure." },
    "iron_saw": { maxUses: 20, maxStack: 1, name: "Železná pila", name_en: "Iron Saw", icon: "🪚", type: "tool", tier: "iron", desc: "Železná pila. Přesné zpracování kulatiny na fošny.", desc_en: "Iron saw. Precise processing of logs into planks." },
    "iron_pickaxe": { maxUses: 20, maxStack: 1, name: "Železný krumpáč", name_en: "Iron Pickaxe", icon: "⛏️", type: "tool", tier: "iron", desc: "Těžká železná hlava. Efektivní těžba rudy a bourání.", desc_en: "Heavy iron head. Efficient ore mining and demolition." },
    "iron_tongs": { maxUses: 30, maxStack: 1, name: "Železné kleště", name_en: "Iron Tongs", icon: "🔧", type: "tool", tier: "iron", desc: "Kovářské kleště. Nutné pro opravy železa v Kovárně.", desc_en: "Blacksmith tongs. Required for iron repairs at the Smithy." },
    "log": { name: "Kulatina", name_en: "Log", icon: "🪵", type: "mat", desc: "Kmen pokáceného stromu. Základ tesařství.", desc_en: "Felled tree trunk. The foundation of carpentry." },
    "bellows": { name: "Měchy", name_en: "Bellows", icon: "💨", type: "tool", cat: "tool", desc: "Kožené měchy. Rozdmýchají oheň i varhanní píšťaly.", desc_en: "Leather bellows. Fan the fire and the organ pipes alike." },
    "book_binding": { name: "Vazba knih", name_en: "Book Binding", icon: "📚", type: "mat", desc: "Kožená vazba drží složky pohromadě. Bez ní jsou jen listy.", desc_en: "Leather binding holds the quires. Without it, just loose leaves." },
    "quill_case": { name: "Pouzdro na pera", name_en: "Quill Case", icon: "🖊️", type: "tool", cat: "tool", desc: "Kožené pouzdro chrání husí brka před zlomením.", desc_en: "Leather case protects quills from snapping." },
    "scribes_belt": { name: "Opasek písaře", name_en: "Scribe's Belt", icon: "🪢", type: "tool", cat: "tool", desc: "Na opasku visí nůž, brousek a pouzdro na pero.", desc_en: "Knife, whetstone and quill case hang from it. The scribe's kit." },
    "book_cover": { name: "Kožená deska", name_en: "Book Cover", icon: "📖", type: "mat", desc: "Dřevěná deska potažená kůží. Chrání kodex po staletí.", desc_en: "Wooden board covered in leather. Protects the codex for centuries." },
    "cushion": { name: "Kožené sedátko", name_en: "Leather Cushion", icon: "🪑", type: "tool", cat: "tool", desc: "Mniši seděli 6 hodin denně. Sedátko nebylo luxus — nutnost.", desc_en: "Monks sat 6 hours daily. A cushion was necessity, not luxury." },
    "scrinium_case": { name: "Transportní pouzdro", name_en: "Scrinium Case", icon: "🧳", type: "tool", cat: "tool", desc: "Kožené pouzdro na přepravu cenných kodexů.", desc_en: "Leather case for transporting precious codices." },
    "water_pouch": { name: "Kožený měšec", name_en: "Water Pouch", icon: "🫗", type: "tool", cat: "tool", desc: "Kožený měšec na vodu. Mniši nosili pití při práci.", desc_en: "Leather pouch for water. Monks carried drink during work." },
    "ink_pouch": { name: "Váček na inkoust", name_en: "Ink Pouch", icon: "🫙", type: "mat", desc: "Kožený váček na suchý inkoust a práškové pigmenty.", desc_en: "Leather pouch for dry ink and powdered pigments." },
    // ═══════════════════════════════════════════════════════════════════════════
    // DVŮR — Nakupitelná zvířata (Trh)
    // ═══════════════════════════════════════════════════════════════════════════
    "hen_white": { name: "Slepice bílá", name_en: "White Hen", icon: "🐔", type: "animal", desc: "Bílá slepice. Nosí vejce každých 8h.", desc_en: "White hen. Lays eggs every 8h." },
    "hen_black": { name: "Slepice černá", name_en: "Black Hen", icon: "🐓", type: "animal", desc: "Černá slepice. Nosí vejce každých 8h.", desc_en: "Black hen. Lays eggs every 8h." },
    "hen_colored": { name: "Slepice pestrá", name_en: "Coloured Hen", icon: "🦚", type: "animal", desc: "Pestrá slepice. Dává více peří.", desc_en: "Colourful hen. Produces more feathers." },
    "rooster": { name: "Kohout", name_en: "Rooster", icon: "🐓", type: "animal", desc: "Kohout zvyšuje snůšku vajec o 20%.", desc_en: "Rooster increases egg yield by 20%." },
    "sheep": { name: "Ovce", name_en: "Sheep", icon: "🐑", type: "animal", desc: "Ovce produkuje vlnu, mléko a kůži.", desc_en: "Sheep produces wool, milk and hide." },

    // ── Produkty zvířat ────────────────────────────────────────────────────
    "egg": { name: "Vejce", name_en: "Egg", icon: "🥚", type: "mat", desc: "Čerstvé vejce ze slepice. Jídlo i pigment.", desc_en: "Fresh egg from the hen. Food and pigment." },
    "milk": { name: "Mléko", name_en: "Milk", icon: "🥛", type: "mat", desc: "Čerstvé mléko od ovce.", desc_en: "Fresh milk from the sheep." },
    "wool": { name: "Vlna", name_en: "Wool", icon: "🧶", type: "mat", desc: "Střižená vlna. Na přízi, tkaní i šití.", desc_en: "Shorn wool. For spinning, weaving and sewing." },
    "raw_hide": { name: "Surová kůže", name_en: "Raw Hide", icon: "🐑", type: "mat", desc: "Neupravená zvířecí kůže. Nutno vyčinit.", desc_en: "Untreated animal hide. Must be cured." },
    "feather_hen": { name: "Peří", name_en: "Hen Feather", icon: "🪶", type: "mat", desc: "Husté peří. Na polštáře i brky.", desc_en: "Thick feathers. For pillows and quills." },

    // ── Produkty zahrady / včelína ─────────────────────────────────────────
    "pollen": { name: "Pyl", name_en: "Pollen", icon: "🌼", type: "mat", desc: "Včelí pyl. Léčivý a vzácný.", desc_en: "Bee pollen. Medicinal and rare." },
    "linden_blossom": { name: "Lipový květ", name_en: "Linden Blossom", icon: "🌸", type: "mat", desc: "Sušený lipový květ. Do čaje i léčiv.", desc_en: "Dried linden blossom. For tea and remedies." },
    "grass": { name: "Tráva", name_en: "Grass", icon: "🌿", type: "mat", desc: "Posečená čerstvá tráva. Suší se na seno.", desc_en: "Cut fresh grass. Dried to make hay." },
    "queen_bee": { name: "Včelí matka", name_en: "Queen Bee", icon: "🐝", type: "animal", desc: "Včelí matka. Nutná pro stavbu úlu.", desc_en: "Queen bee. Required to establish a hive." },

    // ═══════════════════════════════════════════════════════════════════════════
    // DVŮR — Gallinarium & Ovile mláďata + maso (v8.x)
    // ═══════════════════════════════════════════════════════════════════════════
    "chick": { name: "Kuře", name_en: "Chick", icon: "🐣", type: "animal", desc: "Mladé kuře. Dorůstá v kurníku.", desc_en: "Young chick. Growing in the henhouse." },
    "lamb": { name: "Jehně", name_en: "Lamb", icon: "🐑", type: "animal", desc: "Mladé jehně. Dorůstá v chlévu.", desc_en: "Young lamb. Growing in the sheepfold." },
    "chicken_meat": { name: "Kuřecí maso", name_en: "Chicken Meat", icon: "🍗", type: "food", hunger: 5, desc: "Čerstvé kuřecí. Sytí 5h.", desc_en: "Fresh chicken. Fills for 5h." },
    "mutton": { name: "Skopové maso", name_en: "Mutton", icon: "🥩", type: "food", hunger: 7, desc: "Skopové z chléva. Sytí 7h.", desc_en: "Mutton from the fold. Fills for 7h." },
    "lamb_hide": { name: "Jehněčí kůže", name_en: "Lamb Hide", icon: "🦌", type: "mat", desc: "Jemná kůže jehněte. Kvalitnější pergamen.", desc_en: "Fine lamb skin. Superior vellum quality." },

    // ═══════════════════════════════════════════════════════════════════════════
    // PISCINA (Rybník) — v8.x
    // ═══════════════════════════════════════════════════════════════════════════
    "fry": { name: "Plůdek (potěr)", name_en: "Fish Fry", icon: "🫧", type: "mat", desc: "Malý rybí potěr. Vyrůstá v rybníce.", desc_en: "Tiny fish fry. Grows in the pond." },
    "carp_young": { name: "Kapr (nedospělý)", name_en: "Young Carp", icon: "🐟", type: "mat", desc: "Nedospělý kapr z výtažníku. Potřebuje čas.", desc_en: "Young carp from the rearing pond. Needs time." },
    "carp": { name: "Kapr tržní", name_en: "Market Carp", icon: "🐠", type: "food_raw", desc: "Dospělý kapr. Prodej nebo vaření.", desc_en: "Adult carp. For sale or cooking." },

    // ═══════════════════════════════════════════════════════════════════════════
    // PIVOVAR (Cervisiaria) — v9.x
    // ═══════════════════════════════════════════════════════════════════════════
    "hops": { name: "Chmel", name_en: "Hops", icon: "🌿", type: "mat", desc: "Aromatická rostlina. Dodává pivu hořkost a vůni.", desc_en: "Aromatic plant. Gives beer bitterness and aroma." },
    "seeds_hops": { name: "Semínka chmele", name_en: "Hop Seeds", icon: "🌾", type: "mat", desc: "Chmel lze pěstovat v zahradě. Vzácné semínko.", desc_en: "Hops can be grown in the garden. Rare seeds." },
    "wort": { name: "Mladina", name_en: "Wort", icon: "🫗", type: "mat", desc: "Fermentovaná obilná mladina. Základ každého piva.", desc_en: "Fermented grain wort. The base of every beer." },
    "prima_cervisia": { name: "Prima Cervisia", name_en: "Prima Cervisia", icon: "🍺", type: "food", hunger: 6, desc: "Klášterní pivo světlé. Sytí a posiluje komunitu.", desc_en: "Light monastery ale. Nourishes and strengthens the community." },
    "cervisia_nigra": { name: "Cervisia Nigra", name_en: "Cervisia Nigra", icon: "🍺", type: "food", hunger: 8, desc: "Klášterní pivo tmavé. Vzácnější, chutnější.", desc_en: "Dark monastery ale. Rarer and more flavourful." },

    // ═══════════════════════════════════════════════════════════════════════════
    // SAD — Semena stromů (Trh)
    // ═══════════════════════════════════════════════════════════════════════════
    "seed_apple": { name: "Sazenice jabloně", name_en: "Apple Sapling", icon: "🍎", type: "mat", desc: "Sází se do sadu. Plodí za 48h.", desc_en: "Plant in the orchard. Bears fruit after 48h." },
    "seed_pear": { name: "Sazenice hrušně", name_en: "Pear Sapling", icon: "🍐", type: "mat", desc: "Sází se do sadu. Plodí za 48h.", desc_en: "Plant in the orchard. Bears fruit after 48h." },
    "seed_plum": { name: "Sazenice švestky", name_en: "Plum Sapling", icon: "🫐", type: "mat", desc: "Sází se do sadu. Plodí za 36h.", desc_en: "Plant in the orchard. Bears fruit after 36h." },
    "seed_cherry": { name: "Sazenice třešně", name_en: "Cherry Sapling", icon: "🍒", type: "mat", desc: "Sází se do sadu. Plodí za 36h.", desc_en: "Plant in the orchard. Bears fruit after 36h." },
    "seed_walnut": { name: "Sazenice ořešáku", name_en: "Walnut Sapling", icon: "🥜", type: "mat", desc: "Sází se do sadu. Plodí za 72h.", desc_en: "Plant in the orchard. Bears fruit after 72h." },
    "seed_mulberry": { name: "Sazenice morušovníku", name_en: "Mulberry Sapling", icon: "🍇", type: "mat", desc: "Sází se do sadu. Plodí za 48h.", desc_en: "Plant in the orchard. Bears fruit after 48h." },
    "seed_quince": { name: "Sazenice kdouloně", name_en: "Quince Sapling", icon: "🍋", type: "mat", desc: "Sází se do sadu. Plodí za 60h.", desc_en: "Plant in the orchard. Bears fruit after 60h." },
    "seed_sorb": { name: "Sazenice jeřábu", name_en: "Sorb Sapling", icon: "🟤", type: "mat", desc: "Sází se do sadu. Plodí za 72h.", desc_en: "Plant in the orchard. Bears fruit after 72h." },
    "seed_rowan": { name: "Sazenice jeřábu pt.", name_en: "Rowan Sapling", icon: "🔴", type: "mat", desc: "Sází se do sadu. Plodí za 48h.", desc_en: "Plant in the orchard. Bears fruit after 48h." },
    "seed_linden": { name: "Sazenice lípy", name_en: "Linden Sapling", icon: "🌸", type: "mat", desc: "Sází se do sadu. Plodí za 60h.", desc_en: "Plant in the orchard. Bears fruit after 60h." },

    // ── KRMNÉ SUROVINY ────────────────────────────────────────────────────────
    "hay": { name: "Seno", name_en: "Hay", icon: "🌾", type: "mat", desc: "Sušená tráva. Základní krmivo pro ovce, kozy a koně.", desc_en: "Dried grass. Basic fodder for sheep, goats and horses." },
    "grain": { name: "Zrní", name_en: "Grain", icon: "🌾", type: "mat", desc: "Pšenice nebo ječmen. Krmivo pro slepice a prasata. Základ piva.", desc_en: "Wheat or barley. Feed for hens and pigs. The basis of ale." },
    "worms": { name: "Červi", name_en: "Worms", icon: "🪱", type: "mat", desc: "Žížaly ze zahrady. Krmivo pro kapry.", desc_en: "Earthworms from the garden. Feed for carp." },
    "acorns": { name: "Žaludy", name_en: "Acorns", icon: "🌰", type: "mat", desc: "Lesní plody z dubu. Krmivo pro prasata. Sbírají se na podzim.", desc_en: "Oak fruits from the forest. Pig fodder. Gathered in autumn." },
    "leaves": { name: "Listí", name_en: "Leaves", icon: "🍃", type: "mat", desc: "Čerstvé listí stromů. Oblíbená pochutina koz.", desc_en: "Fresh tree leaves. A favourite treat for goats." },
    "scraps": { name: "Zbytky", name_en: "Scraps", icon: "🍖", type: "mat", desc: "Kuchyňské zbytky. Prasata sní vše.", desc_en: "Kitchen scraps. Pigs eat everything." },

    // ── PRODUKTY NOVÝCH ZVÍŘAT (easter eggs — zvířata teprve přijdou) ────────
    "goat_hide": { name: "Kozí kůže", name_en: "Goat Hide", icon: "🐐", type: "mat", desc: "Kozí kůže poskytuje nejkvalitnější pergamen — tenký, pevný, málo mastný. Italské kláštery ho znaly jako standard.", desc_en: "Goat hide yields the finest parchment — thin, strong, little grease. Italian monasteries knew it as the standard." },
    "goat_milk": { name: "Kozí mléko", name_en: "Goat Milk", icon: "🥛", type: "mat", desc: "Kozí mléko a syrovátka. Součást klášterní lékárny. Podávalo se nemocným bratrům.", desc_en: "Goat milk and whey. Part of the monastic infirmary. Served to ailing brothers." },
    "lard": { name: "Sádlo", name_en: "Lard", icon: "🫙", type: "mat", desc: "Vepřové sádlo. Konzervant, mazivo i palivo do lamp.", desc_en: "Pig lard. Preservative, lubricant and lamp fuel." },
    "cured_meat": { name: "Uzené maso", name_en: "Cured Meat", icon: "🥩", type: "mat", desc: "Nasolené a uzené vepřové. Vydrží celou zimu. Zásobování konvršů a čeledi.", desc_en: "Salted and smoked pork. Lasts all winter. Provisions for lay brothers and servants." },
    "quill_premium": { name: "Brk holubí", name_en: "Pigeon Quill", icon: "🪶", type: "mat", desc: "Holubí brk. Jemnější než husí, vhodný pro drobné písmo a iluminace.", desc_en: "Pigeon quill. Finer than goose feather, suited for small script and illumination." },
    "pigeon_dung": { name: "Holubí trus", name_en: "Pigeon Dung", icon: "💩", type: "mat", desc: "Vysoce koncentrované hnojivo. Klášterní zahradníci ho sbírali z holubníku pro zahradu.", desc_en: "Highly concentrated fertiliser. Monastic gardeners collected it from the dovecote for the garden." },
    "butter": { name: "Máslo", name_en: "Butter", icon: "🧈", type: "mat", desc: "Čerstvé máslo z kravského mléka. Postní výjimka u nemocných.", desc_en: "Fresh butter from cow's milk. A Lenten exception for the sick." },
    "cheese": { name: "Sýr", name_en: "Cheese", icon: "🧀", type: "mat", desc: "Tvrdý klášterní sýr. Trvanlivý, výživný. Prodávaný na trzích.", desc_en: "Hard monastic cheese. Long-lasting, nutritious. Sold at markets." },
    "cream": { name: "Smetana", name_en: "Cream", icon: "🥛", type: "mat", desc: "Hustá smetana sebraná z mléka. Vzácnost klášterní kuchyně — a slabost každé kočky.", desc_en: "Thick cream skimmed from milk. A rarity of the monastic kitchen — and every cat's weakness." },
    "buttermilk": { name: "Podmáslí", name_en: "Buttermilk", icon: "🥛", type: "mat", desc: "Kyselé podmáslí, zbytek po stloukání másla. Osvěžující nápoj čeledi.", desc_en: "Sour buttermilk, left over from churning butter. A refreshing drink for the servants." },
    "mouse": { name: "Myš", name_en: "Mouse", icon: "🐭", type: "mat", desc: "Klášterní myš. Žere zrní i pergamen. Kočka ji občas přinese jako dar.", desc_en: "A monastery mouse. Eats grain and parchment alike. The cat sometimes brings one as a gift." },
    "rabbit_m": { name: "Králík ♂", name_en: "Rabbit ♂", icon: "🐇", type: "animal", desc: "Samec. V králíkárně se postará o přírůstky.", desc_en: "Male. Will take care of the offspring in the hutch." },
    "rabbit_f": { name: "Králice ♀", name_en: "Rabbit ♀", icon: "🐇", type: "animal", desc: "Samice. Rodí mláďata každých 7 dní.", desc_en: "Female. Bears kits every 7 days." },
    "rabbit_meat": { name: "Králičí maso", name_en: "Rabbit Meat", icon: "🍖", type: "mat", desc: "Jemné maso z králíkárny. Klášterní kuchyně ho cení.", desc_en: "Tender meat from the hutch. Prized by the monastic kitchen." },
    "rabbit_pelt": { name: "Králičí kožka", name_en: "Rabbit Pelt", icon: "🦊", type: "mat", desc: "Měkká kožka. Na podšívky rukavic a lemování kapucí.", desc_en: "A soft pelt. For glove linings and hood trims.", },
    "goat": { name: "Koza", name_en: "Goat", icon: "🐐", type: "animal", desc: "Kráva chudých. Mléko dává i v zimě a spase, co ovce odmítne.", desc_en: "The poor man's cow. Gives milk even in winter and grazes what sheep refuse." },
    "piglet": { name: "Sele", name_en: "Piglet", icon: "🐖", type: "animal", desc: "Mladé prase. Za pár měsíců živá spižírna — krm ho žaludy.", desc_en: "A young pig. In a few months a living larder — feed it acorns." },
    "acorn": { name: "Žalud", name_en: "Acorn", icon: "🌰", type: "mat", desc: "Dubový žalud. Prasata po nich rostou jako z vody.", desc_en: "An oak acorn. Pigs fatten on them remarkably." },
    "churn": { name: "Máselnice", name_en: "Butter Churn", icon: "🛢️", type: "tool", desc: "Dřevěná máselnice. Hodiny stloukání promění smetanu v máslo — a zbude podmáslí.", desc_en: "A wooden churn. Hours of churning turn cream into butter — leaving buttermilk behind." },
    "mousetrap": { name: "Pastička na myši", name_en: "Mousetrap", icon: "🪤", type: "tool", desc: "Dřevěná past s pružinou. Chytí myš denně — než se rozbije.", desc_en: "A wooden spring trap. Catches a mouse a day — until it breaks." },
    "manure": { name: "Hnůj", name_en: "Manure", icon: "💩", type: "mat", desc: "Hnůj z klášterního dvora. Surovina pro výrobu kompostu. Každý úklid výběhu přidá 1–3 kusy.", desc_en: "Dung from the farmyard. Raw material for compost. Every pen clean-up adds 1–3 pieces." },

    // ── BUDOUCÍ ZVÍŘATA (easter eggs — jen definice, mechanika přijde později) ─
    "cow": { name: "Kráva", name_en: "Cow", icon: "🐄", type: "animal", desc: "Kráva: vellum z telete pro nejvzácnější kodexy, máslo, sýr. Velké kláštery jich měly desítky.", desc_en: "Cow: calf vellum for the rarest codices, butter, cheese. Great monasteries kept dozens." },
    "donkey": { name: "Osel", name_en: "Donkey", icon: "🫏", type: "animal", desc: "Osel: vozí obilí ze sýpky do mlýna, pohání studnu. Levný, nenáročný, psychicky zdatný pro monotónní práci.", desc_en: "Donkey: carries grain from granary to mill, powers the well. Cheap, undemanding, mentally suited for monotonous work." },
    "horse": { name: "Kůň", name_en: "Horse", icon: "🐴", type: "animal", desc: "Kůň: koňský potah ujede 30–40 km za den. Otevírá vzdálené trhy. Klášter ho potřebuje pro reprezentaci i vojenskou povinnost.", desc_en: "Horse: a horse-drawn cart covers 30–40 km a day. Opens distant markets. The monastery needs him for representation and military obligation." },
    "mule": { name: "Mula", name_en: "Mule", icon: "🐴", type: "animal", desc: "Mula: církevní limuzína. Opati jezdili na bílých mulách jako symbol pokory i statusu. Horské stezky, solné cesty.", desc_en: "Mule: the ecclesiastical limousine. Abbots rode white mules as a symbol of humility and status. Mountain paths, salt roads." },
    "pigeon": { name: "Holub", name_en: "Pigeon", icon: "🕊️", type: "animal", desc: "Holub: holubník jako zdroj čerstvého masa pro vzácné hosty, brků pro iluminátory a hnojiva pro zahradu.", desc_en: "Pigeon: the dovecote as a source of fresh meat for honoured guests, quills for illuminators, and dung for the garden." },
    "pig": { name: "Prase", name_en: "Pig", icon: "🐷", type: "animal", desc: "Prase: přes léto na žaludění v lese, na zimu poraženo. Sádlo a uzené maso pro konvrše a čeleď. Mniši vepřové příliš nejedli.", desc_en: "Pig: summer grazing on acorns in the forest, slaughtered for winter. Lard and cured meat for lay brothers and servants. Monks ate little pork themselves." },
    // ── ŽELEZNÁ RUDA + INGOT ────────────────────────────────────────────────
    "iron_ore": { name: "Železná ruda", name_en: "Iron Ore", icon: "🪨", type: "mat", desc: "Surová železná ruda. Taví se s uhlím na ingot.", desc_en: "Raw iron ore. Smelted with charcoal into an ingot." },
    "iron_ingot": { name: "Železný ingot", name_en: "Iron Ingot", icon: "⚙️", type: "mat", desc: "Odlitý prut železa. Základ kovářského řemesla.", desc_en: "Cast iron bar. The foundation of the blacksmith's craft." },
    "anvil": { maxStack: 1, name: "Kovadlina", name_en: "Anvil", icon: "⚒️", type: "mat", desc: "Těžká železná kovadlina. Nutná pro stavbu kovárny.", desc_en: "Heavy iron anvil. Required to build the smithy." },

    // ── OPOTŘEBENÉ ŽELEZNÉ NÁSTROJE ──────────────────────────────────────────
    "worn_iron_axe": { maxUses: 3, name: "Otupená sekerka", name_en: "Worn Iron Axe", icon: "🪓", type: "tool", tier: "iron", desc: "Otupené železné ostří. Opravit v Kovárně.", desc_en: "Blunted iron blade. Repair at the Smithy." },
    "worn_iron_spade": { maxUses: 3, name: "Tupý rýč", name_en: "Worn Iron Spade", icon: "⛏️", type: "tool", tier: "iron", desc: "Ohnutý železný rýč. Opravit v Kovárně.", desc_en: "Bent iron spade. Repair at the Smithy." },
    "worn_iron_scythe": { maxUses: 3, name: "Tupá kosa", name_en: "Worn Iron Scythe", icon: "⚔️", type: "tool", tier: "iron", desc: "Otupenná železná kosa. Opravit v Kovárně.", desc_en: "Blunted iron scythe. Repair at the Smithy." },
    "worn_iron_sickle": { maxUses: 3, name: "Tupý srp", name_en: "Worn Iron Sickle", icon: "🌾", type: "tool", tier: "iron", desc: "Otupenný železný srp. Opravit v Kovárně.", desc_en: "Blunted iron sickle. Repair at the Smithy." },
    "worn_iron_flail": { maxUses: 3, name: "Uvolněný cep", name_en: "Worn Iron Flail", icon: "🪵", type: "tool", tier: "iron", desc: "Uvolněné závaží. Opravit v Kovárně.", desc_en: "Loose weight. Repair at the Smithy." },
    "worn_iron_shovel": { maxUses: 3, name: "Ohnutá lopata", name_en: "Worn Iron Shovel", icon: "🪛", type: "tool", tier: "iron", desc: "Ohnutá železná lopata. Opravit v Kovárně.", desc_en: "Bent iron shovel. Repair at the Smithy." },
    "worn_iron_saw": { maxUses: 3, name: "Tupá pila", name_en: "Worn Iron Saw", icon: "🪚", type: "tool", tier: "iron", desc: "Otupenné zuby pily. Opravit v Kovárně.", desc_en: "Blunted saw teeth. Repair at the Smithy." },
    "worn_iron_pickaxe": { maxUses: 3, name: "Otupený krumpáč", name_en: "Worn Iron Pickaxe", icon: "⛏️", type: "tool", tier: "iron", desc: "Otupená železná hlava. Opravit v Kovárně.", desc_en: "Blunted iron head. Repair at the Smithy." },
    "worn_iron_tongs": { maxUses: 3, name: "Opotřebené kleště", name_en: "Worn Iron Tongs", icon: "🔧", type: "tool", tier: "iron", desc: "Kleště na hranici životnosti. Přetavit nebo zahodit.", desc_en: "Tongs past their limit. Smelt or discard." },

    // ── POLE (Ager) — plodiny ─────────────────────────────────────────────────
    "rye_grain": { name: "Žitné zrno", name_en: "Rye Grain", icon: "🌾", type: "mat", desc: "Ozimé žito. Základ klášterského chleba a kaše. Krmivo pro dobytek.", desc_en: "Winter rye. The basis of monastic bread and porridge. Livestock fodder." },
    "wheat_grain": { name: "Pšeničné zrno", name_en: "Wheat Grain", icon: "🌾", type: "mat", desc: "Pšenice jarní. Kvalitnější mouka než žitná. Lepší chléb a oplatky.", desc_en: "Spring wheat. Finer flour than rye. Better bread and wafers." },
    "barley": { name: "Ječmen", name_en: "Barley", icon: "🌾", type: "mat", desc: "Dvouřadý ječmen. Základ každého klášterního piva. Bez ječmene není pivovar.", desc_en: "Two-row barley. The basis of every monastic ale. Without barley, no brewery." },
    "oats": { name: "Oves", name_en: "Oats", icon: "🌾", type: "mat", desc: "Oves setý. Krmivo pro koně a osla. Bez ovsa tažný dobytek ztrácí sílu.", desc_en: "Common oats. Feed for horses and donkeys. Without oats, draught animals lose strength." },
    "millet": { name: "Proso", name_en: "Millet", icon: "🌾", type: "mat", desc: "Proso seté. Rychlá kaše, krmivo pro drůbež. Odolné i v suchu.", desc_en: "Common millet. Quick porridge, poultry feed. Resilient even in drought." },
    "peas": { name: "Hrách", name_en: "Peas", icon: "🫛", type: "mat", desc: "Polní hrách. Polévka, krmivo, obohacuje půdu dusíkem.", desc_en: "Field peas. Soup, fodder, enriches soil with nitrogen." },
    "flax_fiber": { name: "Lněná vlákna", name_en: "Flax Fibre", icon: "🧵", type: "mat", desc: "Stonky lnu po rosení a tření. Základ pro tkaní plátna a výrobu provazů.", desc_en: "Flax stalks after retting and breaking. The basis for weaving linen and making rope." },
    "straw": { name: "Sláma", name_en: "Straw", icon: "🌿", type: "mat", desc: "Posklizňová sláma. Podestýlka pro zvířata, střešní krytina, krmivo pro skot.", desc_en: "Post-harvest straw. Bedding for animals, thatching material, fodder for cattle." },
    "flour": { name: "Mouka", name_en: "Flour", icon: "⚪", type: "mat", desc: "Mletá pšeničná nebo žitná mouka. Základ pro chléb, oplatky a kaši.", desc_en: "Ground wheat or rye flour. The basis for bread, wafers and porridge." },
    "grain_feed": { name: "Zrní (krmivo)", name_en: "Grain Feed", icon: "🌾", type: "mat", desc: "Směs zrní pro drůbež a prasata. Udržuje zdraví zvířat.", desc_en: "Grain mix for poultry and pigs. Maintains animal health." },
    "goose_quill": { name: "Husí pero", name_en: "Goose Quill", icon: "🪶", type: "tool", desc: "Nejlepší pero pro písaře. Tvrdší a pružnější než slepičí. Husy pro skriptorium.", desc_en: "The finest quill for scribes. Harder and more flexible than a hen's feather. Geese for the scriptorium." },

    // ── VINOHRAD (Vinea) — řízky ──────────────────────────────────────────────
    "viticis_belina": { name: "Řízek Běliny", name_en: "Heunisch Cutting", icon: "🌿", type: "mat", desc: "Řízek Běliny (Heunisch). Nejstarší moravská odrůda. Zasadit do Vinohradu.", desc_en: "Heunisch cutting. The oldest Moravian variety. Plant in the Vineyard." },
    "viticis_klevner": { name: "Řízek Klevneru", name_en: "Klevner Cutting", icon: "🌿", type: "mat", desc: "Řízek Klevneru (Rulandské bílé). Burgundská odrůda z doby Karla IV. Zasadit do Vinohradu.", desc_en: "Klevner (Burgundy white) cutting. A Burgundian variety since Charles IV. Plant in the Vineyard." },
    "viticis_frankovka": { name: "Řízek Frankovky", name_en: "Frankovka Cutting", icon: "🌿", type: "mat", desc: "Řízek Frankovky. Nejrozšířenější modrá odrůda na Moravě. Zasadit do Vinohradu.", desc_en: "Frankovka cutting. The most widespread blue variety in Moravia. Plant in the Vineyard." },
    "viticis_tramin": { name: "Řízek Tramínu", name_en: "Traminer Cutting", icon: "🌿", type: "mat", desc: "Řízek Tramínu červeného. Vzácný. Získat jen z vlastní révy nebo od cizince.", desc_en: "Red Traminer cutting. Rare. Obtain only from your own vine or a stranger." },
    "viticis_modry_janek": { name: "Řízek Modrého Janka", name_en: "Modrý Janek Cutting", icon: "🌿", type: "mat", desc: "Řízek Modrého Janka. Mutace Veltlínského zeleného, znojemská rarita. Zasadit do Vinohradu.", desc_en: "Modrý Janek cutting. A mutation of Grüner Veltliner, a Znojmo rarity. Plant in the Vineyard." },

    // ── VINOHRAD (Vinea) — výstupy ────────────────────────────────────────────
    "mustum": { name: "Mustum", name_en: "Mustum", icon: "🍇", type: "food", hunger: 4, desc: "Čerstvý hroznový mošt. Rychle se kazí. Prodat nebo fermentovat.", desc_en: "Fresh grape must. Spoils quickly. Sell or ferment." },
    "pryk": { name: "Pryk", name_en: "Pryk", icon: "🍶", type: "food", hunger: 3, desc: "Nedozrálé víno z Běliny. Kyselé, levné, oblíbené u konvršů.", desc_en: "Unripe wine from Heunisch. Sour, cheap, popular with lay brothers." },
    "vinum": { name: "Vinum", name_en: "Vinum", icon: "🍷", type: "food", hunger: 5, desc: "Klášterní bílé víno z Klevneru. In vino veritas.", desc_en: "Monastic white wine from Klevner. In vino veritas." },
    "vinum_rubrum": { name: "Vinum Rubrum", name_en: "Vinum Rubrum", icon: "🍷", type: "food", hunger: 5, desc: "Červené víno z Frankovky. Temnější barva, jiný odběratel než bílé.", desc_en: "Red wine from Frankovka. Darker colour, different buyer than white." },
    "vinum_praeclarum": { name: "Vinum Praeclarum", name_en: "Vinum Praeclarum", icon: "🏺", type: "food", hunger: 6, desc: "Vzácné bílé víno z Tramínu. Nejdražší víno v klášteře. Pro biskupský stůl.", desc_en: "Rare white wine from Traminer. The costliest wine in the monastery. For the bishop's table." },
    "vinum_obscurum": { name: "Vinum Obscurum", name_en: "Vinum Obscurum", icon: "🫙", type: "food", hunger: 4, desc: "Tmavé víno z Modrého Janka. Nízký výnos, znojemská kuriozita. Bonus v Athanoru.", desc_en: "Dark wine from Modrý Janek. Low yield, a Znojmo curiosity. Bonus in the Athanor." },
    "viticis_baco": { name: "Řízek Baga", name_en: "Baco Noir Cutting", icon: "🌿", type: "mat", desc: "Řízek Baco Noir (Bago). Odolný hybrid, divoce rostoucí. Vzácný nález při sběru.", desc_en: "Baco Noir (Bago) cutting. A resilient hybrid, found growing wild. A rare find." },
    "vinum_baci": { name: "Vinum Baci", name_en: "Vinum Baci", icon: "🍷", type: "food", hunger: 4, desc: "Tmavě rubínové víno z Baga. Silné barvivo, vhodné ke scelování. Lidové víno jižní Moravy.", desc_en: "Dark ruby wine from Baco Noir. Strong colourant, good for blending. A southern Moravian folk wine." },
    "raisins": { name: "Hrozinky", name_en: "Raisins", icon: "🍇", type: "food", hunger: 3, desc: "Sušené hrozny z Uvaria. Trvanlivé, sladké. Vhodné do jídla nebo na prodej.", desc_en: "Dried grapes from the Uvarium. Long-lasting and sweet. Good for food or trade." },
    "linseed_oil": { name: "Lněný olej", name_en: "Linseed Oil", icon: "🫙", type: "mat", desc: "Olej lisovaný z lněného semene. Pojivo pro inkoust a pigmenty. Propojuje Pole se Skriptoriem.", desc_en: "Oil pressed from linseed. Binder for ink and pigments. Links the Field to the Scriptorium." },

    // ── VINOHRAD (Vinea) — zpracování (hrozny + mošt) ──────────────────────────
    "grapes_belina": { name: "Hrozny Běliny", name_en: "Heunisch Grapes", icon: "🍇", type: "food", hunger: 2, desc: "Čerstvé hrozny z Běliny. Jíst syrové, nebo nalisovat v Prelu.", desc_en: "Fresh Heunisch grapes. Eat raw, or press at the Prelum." },
    "grapes_klevner": { name: "Hrozny Klevneru", name_en: "Klevner Grapes", icon: "🍇", type: "food", hunger: 2, desc: "Čerstvé hrozny z Klevneru. Jíst syrové, nebo nalisovat v Prelu.", desc_en: "Fresh Klevner grapes. Eat raw, or press at the Prelum." },
    "grapes_frankovka": { name: "Hrozny Frankovky", name_en: "Frankovka Grapes", icon: "🍇", type: "food", hunger: 2, desc: "Čerstvé hrozny z Frankovky. Jíst syrové, nebo nalisovat v Prelu.", desc_en: "Fresh Frankovka grapes. Eat raw, or press at the Prelum." },
    "grapes_tramin": { name: "Hrozny Tramínu", name_en: "Traminer Grapes", icon: "🍇", type: "food", hunger: 2, desc: "Čerstvé hrozny z Tramínu. Jíst syrové, nebo nalisovat v Prelu.", desc_en: "Fresh Traminer grapes. Eat raw, or press at the Prelum." },
    "grapes_modry_janek": { name: "Hrozny Modrého Janka", name_en: "Modrý Janek Grapes", icon: "🍇", type: "food", hunger: 2, desc: "Čerstvé hrozny z Modrého Janka. Jíst syrové, nebo nalisovat v Prelu.", desc_en: "Fresh Modrý Janek grapes. Eat raw, or press at the Prelum." },
    "grapes_baco": { name: "Hrozny Baga", name_en: "Baco Noir Grapes", icon: "🍇", type: "food", hunger: 2, desc: "Čerstvé hrozny z Baco Noir. Jíst syrové, nebo nalisovat v Prelu.", desc_en: "Fresh Baco Noir grapes. Eat raw, or press at the Prelum." },
    "mustum_klevner": { name: "Mošt z Klevneru", name_en: "Klevner Must", icon: "🍶", type: "mat", desc: "Nalisovaný mošt z Klevneru. Čeká na fermentaci v Cella fermentaria.", desc_en: "Pressed must from Klevner. Awaits fermentation at the Cella fermentaria." },
    "mustum_frankovka": { name: "Mošt z Frankovky", name_en: "Frankovka Must", icon: "🍶", type: "mat", desc: "Nalisovaný mošt z Frankovky. Čeká na fermentaci v Cella fermentaria.", desc_en: "Pressed must from Frankovka. Awaits fermentation at the Cella fermentaria." },
    "mustum_tramin": { name: "Mošt z Tramínu", name_en: "Traminer Must", icon: "🍶", type: "mat", desc: "Nalisovaný mošt z Tramínu. Čeká na fermentaci v Cella fermentaria.", desc_en: "Pressed must from Traminer. Awaits fermentation at the Cella fermentaria." },
};
// Oprava BUG #2 — semena stromů chybějící v ItemsDB (Trh nákup)
// (vloženo před uzavírací }; — merge do objektu před buildem)