const ItemsDB = {
    // BASIC MATERIALS
    "tinderbox": { name: "Troud", name_en: "Tinderbox", icon: "🔥", type: "tool", tier: "fire", desc: "Sada na oheň.", desc_en: "A fire-starting kit." },
    "rock": { name: "Kámen", name_en: "Stone", icon: "🪨", type: "mat", desc: "Tvrdý.", desc_en: "Hard stone." },
    "clay": { name: "Hlína", name_en: "Clay", icon: "🟤", type: "mat", desc: "Jílovitá hlína z břehu potoka. Vhodná pro hrnčířství a stavbu.", desc_en: "Clay from a streambank. Good for pottery and construction." },
    "wood": { name: "Dřevo", name_en: "Wood", icon: "🪵", type: "mat", desc: "Klestí a větve sebrané při hledání. Palivo i stavební materiál.", desc_en: "Brushwood and branches gathered while foraging. Fuel and building material." },
    "wicker": { name: "Proutí", name_en: "Wicker", icon: "🧺", type: "mat", desc: "Ohebné vrbové pruty z mokřadu. Na pletení košů i konstrukcí.", desc_en: "Pliant willow withies from the wetlands. For weaving baskets and structures." },
    "stick": { name: "Větev", name_en: "Branch", icon: "🪵", type: "mat", desc: "Dřevo.", desc_en: "A length of wood." },
    "fiber": { name: "Vlákno", name_en: "Fiber", icon: "🌾", type: "mat", desc: "Vlákna.", desc_en: "Plant fibres." },
    "bark": { name: "Kůra", name_en: "Bark", icon: "🍂", type: "mat", desc: "Kůra stromu.", desc_en: "Tree bark." },
    "rags": { name: "Staré hadry", name_en: "Rags", icon: "🧻", type: "mat", desc: "Opotřebené kousky plátna a lnu. Základ hadrového papíru.", desc_en: "Worn scraps of linen and cloth. The basis of rag paper." },
    "charcoal": { name: "Uhel", name_en: "Charcoal", icon: "⚫", type: "mat", desc: "Spálené dřevo.", desc_en: "Burned wood." },
    "water": { name: "Voda", name_en: "Water", icon: "💧", type: "food", desc: "Voda ze studny nebo z přírody. Ne vždy čistá.", desc_en: "Water from a well or the wild. Not always clean." },
    "spring_water": { name: "Pramenitá voda", name_en: "Spring Water", icon: "🫧", type: "food", desc: "Čistá pramenitá voda. Osvěžuje tělo a snižuje únavu.", desc_en: "Pure spring water. Refreshes the body and eases fatigue." },
    "holy_water": { name: "Svěcená voda", name_en: "Holy Water", icon: "✨", type: "food", desc: "Posvěcená voda z požehnané studny. Nejčistší, jakou lze získat.", desc_en: "Blessed water from a consecrated well. The purest water obtainable." },
    "herb_red": { name: "Krvavý květ", name_en: "Bloodwort", icon: "🌺", type: "mat", desc: "Bylina.", desc_en: "A red healing herb." },
    "fat": { name: "Tuk", name_en: "Fat", icon: "🥩", type: "mat", desc: "Zvířecí tuk.", desc_en: "Animal fat." },
    "meat": { name: "Divoké maso", name_en: "Wild Game Meat", icon: "🍖", type: "food_raw", desc: "Syrové maso z ulovené zvěře. K vaření, ne k prodeji na trhu.", desc_en: "Raw meat from hunted game. For cooking, not for the market stall." },
    "crayfish": { name: "Raci", name_en: "Crayfish", icon: "🦞", type: "food_raw", desc: "Sladkovodní raci z mokřadu.", desc_en: "Freshwater crayfish from the wetlands." },
    "snail": { name: "Hlemýždi", name_en: "Snails", icon: "🐌", type: "food_raw", desc: "Hlemýždi s ulitou. Jiní tvorové než slimák.", desc_en: "Shelled snails. A different creature from the slug." },
    "frog_legs": { name: "Žabí stehýnka", name_en: "Frog Legs", icon: "🍗", type: "food_raw", desc: "Stažená stehýnka ze žáby.", desc_en: "Skinned frog legs." },
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
    "pulp": { name: "Hadrovina", name_en: "Rag Pulp", icon: "🌫️", type: "mat", desc: "Rozmělněná lněná vlákna ve vodě. Základ hadrového papíru.", desc_en: "Macerated linen fibres in water. The base of rag paper." },
    "paper": { name: "Hadrový papír", name_en: "Rag Paper", icon: "📄", type: "lore", desc: "Lisovaná hadrovina. Středověký papír z lněných vláken, ne ze dřeva.", desc_en: "Pressed rag pulp. Medieval paper made from linen fibres, not wood." },
    "paper_fine": { name: "Benátský papír", name_en: "Venetian Paper", icon: "📃", type: "lore", desc: "Jemnější a bělejší než hadrový papír z domácí výroby. Giacomo ho vozí z Benátek.", desc_en: "Finer and whiter than home-pressed rag paper. Giacomo brings it from Venice." },
    "bird_paper": { name: "Holubí lístek", name_en: "Pigeon Paper", icon: "🕊️", type: "lore", desc: "Charta columbina — ztenčený a odlehčený benátský papír. Unese let na nožičce holuba, ne však mnoho slov.", desc_en: "Charta columbina — thinned and lightened Venetian paper. It bears a pigeon's flight, but few words." },
    "ink": { name: "Inkoust", name_en: "Ink", icon: "✒️", type: "lore", desc: "Černý.", desc_en: "Black ink." },
    "research": { name: "Zápisky", name_en: "Notes", icon: "📜", type: "lore", desc: "Vědění.", desc_en: "Accumulated knowledge." },

    // ALCHEMY
    "bonemeal": { name: "Hnojivo", name_en: "Bonemeal", icon: "🦴", type: "mat", desc: "Z kostí.", desc_en: "Ground bone fertilizer." },
    "seeds_herb": { name: "Semínka", name_en: "Seeds", icon: "🌱", type: "mat", desc: "Rostliny.", desc_en: "Plant seeds." },
    "potion_heal": { name: "Mast", name_en: "Healing Salve", icon: "🧪", type: "alchemy", desc: "Léčí.", desc_en: "Heals wounds." },
    "unguentum_calidum": { name: "Hřejivá mast", name_en: "Warming Salve", icon: "🫙", type: "alchemy", desc: "Kostival, sádlo a rozmarýn. Podle galenické medicíny prohřívá a vysušuje studené vlhké šťávy — proti revma a křečím.", desc_en: "Comfrey, lard and rosemary. In Galenic medicine, warms and dries the cold, damp humours — against rheumatism and cramps." },
    "cannabis_poultice": { name: "Konopný obklad", name_en: "Hemp Poultice", icon: "🌿", type: "alchemy", desc: "Rozdrcené listy a kořen konopí. Horký obklad na revmatické klouby a prochladlé tělo.", desc_en: "Crushed hemp leaves and root. A hot poultice for rheumatic joints and a chilled body." },
    "dried_cannabis": { name: "Sušené konopí", name_en: "Dried Hemp", icon: "🥀", type: "mat", desc: "Konopí sušené 24 hodin ve stínu. Připravené k napěchování do dýmky.", desc_en: "Hemp dried for 24 hours in the shade. Ready to be packed into a pipe." },
    "antidote": { name: "Protijed", name_en: "Antidote", icon: "💚", type: "alchemy", desc: "Proti jedu.", desc_en: "Against poison." },
    "odvar_z_dubenek": { name: "Odvar z duběnek", name_en: "Oak Gall Decoction", icon: "🫘", type: "alchemy", desc: "Svíravý odvar. Zastavuje krvácení a průjem.", desc_en: "An astringent decoction. Stops bleeding and flux." },
    "mast_ze_lneneho_oleje": { name: "Mast ze lněného oleje", name_en: "Linseed Oil Salve", icon: "🧴", type: "alchemy", desc: "Zvlhčuje vyschlé oči a ztuhlé šlachy.", desc_en: "Soothes dried eyes and stiffened tendons." },
    "odvar_z_vrby": { name: "Odvar z vrbové kůry", name_en: "Willow Bark Decoction", icon: "🍵", type: "alchemy", desc: "Chladí pálivé svědění a horké klouby.", desc_en: "Cools burning itch and hot joints." },
    "spongia_somnifera": { name: "Uspávací houba", name_en: "Sleeping Sponge", icon: "🧽", type: "alchemy", desc: "Houba napuštěná mandragorou, rulíkem a mákem. Zmírní šok ze zranění.", desc_en: "A sponge soaked with mandrake, belladonna and poppy. Eases the shock of injury." },
    "elixir_purgationis": { name: "Očistný elixír", name_en: "Purging Elixir", icon: "🍯", type: "alchemy", desc: "Elixir Purgationis. Teplé víno s medem a rozmarýnem — horké a vlhké proti studené a suché černé žluči.", desc_en: "Elixir Purgationis. Warm wine with honey and rosemary — hot and moist against the cold, dry black bile." },
    "haereticum_stellarum": { name: "Nápoj cizích hvězd", name_en: "Draught of Foreign Stars", icon: "✨", type: "potion", desc: "Potio Stellarum Alienarum. Hvězdy, které žádný žebřík k nebi nezná.", desc_en: "Potio Stellarum Alienarum. Stars that know no ladder to heaven." },
    "haereticum_circuli": { name: "Odvar kola životů", name_en: "Decoction of the Wheel of Lives", icon: "🌀", type: "potion", desc: "Decoctum Rotae Vitarum. Sen o těle, které už jednou bylo.", desc_en: "Decoctum Rotae Vitarum. A dream of a body once already lived." },
    "haereticum_fortunae": { name: "Elixír cizí přízně", name_en: "Elixir of Foreign Fortune", icon: "🍀", type: "potion", desc: "Elixir Fortunae Alienae. Štěstí, které si nikdo nezasloužil prací.", desc_en: "Elixir Fortunae Alienae. A fortune earned by no honest work." },
    "haereticum_amoris": { name: "Nápoj cizí touhy", name_en: "Draught of Foreign Desire", icon: "🌸", type: "potion", desc: "Potio Desiderii Alieni. Touha, která nepatří klášterní cele.", desc_en: "Potio Desiderii Alieni. A desire that belongs to no monastic cell." },
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
    "substantia_ignota": { name: "Neznámá substance", name_en: "Unknown Substance", icon: "❓", type: "alchemy_ing", desc: "Nikdo neví, co to je. Ani poutník sám to neřekl.", desc_en: "No one knows what it is. Not even the pilgrim who brought it would say." },
    "honey": { name: "Med", name_en: "Honey", icon: "🍯", type: "food", desc: "Včelí med.", desc_en: "Bee honey." },
    "mushroom_poison": { name: "Muchotrávka", name_en: "Death Cap", icon: "🍄", type: "alchemy_ing", desc: "Jedovatá houba.", desc_en: "A poisonous mushroom." },
    "roots": { name: "Kořeny", name_en: "Roots", icon: "🪴", type: "alchemy_ing", desc: "Hluboké kořeny.", desc_en: "Deep roots." },
    "nightshade": { name: "Rulík", name_en: "Nightshade", icon: "🖤", type: "alchemy_ing", desc: "Jedovatý, léčivý.", desc_en: "Deadly yet medicinal." },

    // FOOD RAW
    "fish": { name: "Ryba", name_en: "Fish", icon: "🐟", type: "food_raw", desc: "Čerstvá ryba.", desc_en: "Fresh fish." },
    "mushroom": { name: "Houby", name_en: "Mushrooms", icon: "🍄", type: "food", desc: "Jedlé houby.", desc_en: "Edible mushrooms." },
    "carrot": { name: "Mrkev", name_en: "Carrot", icon: "🥕", type: "food_raw", desc: "Ze zahrady.", desc_en: "From the garden." },
    "onion": { name: "Cibule", name_en: "Onion", icon: "🧅", type: "food_raw", desc: "Ze zahrady.", desc_en: "From the garden." },
    "leek": { name: "Pór", name_en: "Leek", icon: "🌿", type: "food_raw", desc: "Allium porrum. Klášterní zahrada ze Sankt Gallenu. Základ polévky.", desc_en: "Allium porrum. From the St Gallen monastery plan. Soup staple." },
    "cabbage": { name: "Zelí", name_en: "Cabbage", icon: "🥬", type: "food_raw", desc: "Brassica oleracea. Základ středověké stravy v Čechách. Kvas i vaření.", desc_en: "Brassica oleracea. Staple of medieval Czech diet. Fermented and cooked." },
    "radish": { name: "Ředkev", name_en: "Radish", icon: "🌱", type: "food_raw", desc: "Raphanus sativus. Capitulare de villis, 812. Jedla se syrová i vařená.", desc_en: "Raphanus sativus. Capitulare de villis, 812. Eaten raw and cooked." },
    "turnip": { name: "Řepa", name_en: "Turnip", icon: "🟣", type: "food_raw", desc: "Beta vulgaris. Zimní zásoby kláštera. Vydrží v sklepě celou zimu.", desc_en: "Beta vulgaris. Monastery winter stores. Keeps in the cellar all winter." },
    "garlic": { name: "Česnek", name_en: "Garlic", icon: "🧄", type: "food_raw", desc: "Allium sativum. Lék i koření. Hildegarda: teplý a suchý, zahání nemoci.", desc_en: "Allium sativum. Medicine and spice. Hildegard: warm and dry, drives off sickness." },
    "ground_elder": { name: "Bršlice kozí noha", name_en: "Ground Elder", icon: "🌿", type: "food_raw", desc: "Aegopodium podagraria. Dnes plevel, ve středověku hlavní jarní zelenina.", desc_en: "Aegopodium podagraria. A weed today, a staple spring green in the Middle Ages." },
    "goosefoot": { name: "Lebeda", name_en: "Goosefoot", icon: "🌿", type: "food_raw", desc: "Chenopodium album. Rostla kolem obydlí, listy bohaté na bílkoviny.", desc_en: "Chenopodium album. Grew around dwellings, leaves rich in protein." },
    "sorrel": { name: "Šťovík", name_en: "Sorrel", icon: "🌿", type: "food_raw", desc: "Rumex acetosa. Kyselá chuť tam, kde chyběl citron i ocet.", desc_en: "Rumex acetosa. A sour bite where lemon and vinegar were scarce." },
    "dandelion": { name: "Pampeliška", name_en: "Dandelion", icon: "🌼", type: "food_raw", desc: "Taraxacum. Jarní očistná bylina, i s ptačincem žabincem.", desc_en: "Taraxacum. A spring cleansing herb, alongside chickweed." },
    "burdock_root": { name: "Kořen lopuchu", name_en: "Burdock Root", icon: "🥕", type: "food_raw", desc: "Arctium lappa. Hladové jídlo — kořen pečený v popelu.", desc_en: "Arctium lappa. Famine food — root baked in ashes." },
    "couch_grass": { name: "Pýr plazivý", name_en: "Couch Grass", icon: "🌾", type: "food_raw", desc: "Elymus repens. Oddenky plné škrobu, mlely se na mouku.", desc_en: "Elymus repens. Starch-rich rhizomes, ground into flour." },
    "cattail_root": { name: "Kořen orobince", name_en: "Cattail Root", icon: "🌾", type: "food_raw", desc: "Typha. Rostl kolem rybníků, oddenky bohaté na škrob.", desc_en: "Typha. Grew around ponds, starch-rich rhizomes." },
    "potato": { name: "Brambora", name_en: "Potato", icon: "🥔", type: "food_raw", desc: "Ze zahrady.", desc_en: "From the garden." },
    "berries": { name: "Bobule", name_en: "Berries", icon: "🫐", type: "food", hunger: 2, desc: "Lesní plody. Lze jíst syrové — zasytí na 2h.", desc_en: "Forest berries. Edible raw — fills for 2h." },
    "rosehip": { name: "Šípky", name_en: "Rosehips", icon: "🔴", type: "food_raw", desc: "Fructus rosae. Hlavní zdroj vitamínů na zimu.", desc_en: "Fructus rosae. The main source of winter vitamins." },
    "beechnut": { name: "Bukvice", name_en: "Beechnuts", icon: "🌰", type: "food_raw", desc: "Fagus sylvatica. Z bukvic se lisoval i jedlý olej.", desc_en: "Fagus sylvatica. Beechnuts were also pressed for edible oil." },
    "wild_fruit": { name: "Planá jablka a hrušky", name_en: "Wild Apples and Pears", icon: "🍏", type: "food_raw", desc: "Pláňata. Tvrdá a trpká, syrová se nedala jíst.", desc_en: "Wild fruit. Hard and bitter, inedible raw." },
    "cornel_cherry": { name: "Dřínky", name_en: "Cornel Cherries", icon: "🍒", type: "food_raw", desc: "Cornus mas. Kyselé plody dřínu obecného.", desc_en: "Cornus mas. Tart fruit of the cornelian cherry." },
    "sloe": { name: "Trnky", name_en: "Sloes", icon: "🫐", type: "food_raw", desc: "Prunus spinosa. Po prvním mrazu ztrácí svíravou trpkost.", desc_en: "Prunus spinosa. The first frost takes away their sharp bitterness." },
    "morel": { name: "Smrže", name_en: "Morels", icon: "🍄", type: "food_raw", desc: "Vzácná a ceněná jarní houba.", desc_en: "A rare and prized spring mushroom." },
    "saffron_milk_cap": { name: "Ryzce", name_en: "Saffron Milk Caps", icon: "🍊", type: "food_raw", desc: "Nakládají se do slaného nálevu — vydrží celou zimu.", desc_en: "Preserved in brine — they keep all winter." },
    "porcini": { name: "Hřiby", name_en: "Porcini", icon: "🍄", type: "food_raw", desc: "Nejceněnější houba lesa.", desc_en: "The most prized mushroom of the forest." },
    "bracket_fungus": { name: "Choroš sírový", name_en: "Chicken of the Woods", icon: "🍊", type: "food_raw", desc: "Roste na stromech, ne na zemi. Struktura podobná kuřecímu masu.", desc_en: "Grows on trees, not the ground. Texture similar to chicken." },

    // COOKED FOOD
    "cooked_meat": { name: "Pečené maso", name_en: "Roasted Meat", icon: "🍗", type: "food", hunger: 6, desc: "Sytí 6h.", desc_en: "Fills for 6h." },
    "crayfish_boiled": { name: "Raci vaření v pivu", name_en: "Crayfish Boiled in Beer", icon: "🦞", type: "food", desc: "Raci uvaření v pivu. Oblíbené mezi prostým lidem.", desc_en: "Crayfish boiled in beer. A favourite among common folk." },
    "snails_black_sauce": { name: "Hlemýždi v černé omáčce", name_en: "Snails in Black Sauce", icon: "🐌", type: "food", desc: "Hlemýždi v omáčce zahuštěné chlebem a medem.", desc_en: "Snails in a sauce thickened with bread and honey." },
    "frog_legs_fried": { name: "Žabí stehýnka na česneku", name_en: "Fried Frog Legs with Garlic", icon: "🍗", type: "food", desc: "Stehýnka osmažená na sádle s česnekem.", desc_en: "Legs fried in lard with garlic." },
    "cooked_beef": { name: "Pečené hovězí", name_en: "Roasted Beef", icon: "🍗", type: "food", desc: "Hovězí upečené na ohni.", desc_en: "Beef roasted over the fire." },
    "cooked_mutton": { name: "Pečené skopové", name_en: "Roasted Mutton", icon: "🍗", type: "food", desc: "Skopové upečené na ohni.", desc_en: "Mutton roasted over the fire." },
    "cooked_chicken": { name: "Pečené kuře", name_en: "Roasted Chicken", icon: "🍗", type: "food", desc: "Kuře upečené na ohni.", desc_en: "Chicken roasted over the fire." },
    "cooked_rabbit": { name: "Pečený králík", name_en: "Roasted Rabbit", icon: "🍗", type: "food", desc: "Králík upečený na ohni.", desc_en: "Rabbit roasted over the fire." },
    "roast_beef": { name: "Hovězí pečeně", name_en: "Beef Roast", icon: "🍽️", type: "food", desc: "Pečené hovězí s cibulí. Klášterní hostina.", desc_en: "Roasted beef with onion. A monastic feast." },
    "braised_beef": { name: "Dušené hovězí", name_en: "Braised Beef", icon: "🍽️", type: "food", desc: "Hovězí dušené s mrkví.", desc_en: "Beef braised with carrot." },
    "roast_rabbit_dish": { name: "Pečený králík s zeleninou", name_en: "Roast Rabbit with Vegetables", icon: "🍽️", type: "food", desc: "Králík pečený s mrkví a zelím.", desc_en: "Rabbit roasted with carrot and cabbage." },
    "cooked_fish": { name: "Pečená ryba", name_en: "Roasted Fish", icon: "🐠", type: "food", hunger: 4, desc: "Sytí 4h.", desc_en: "Fills for 4h." },
    "stew": { name: "Guláš", name_en: "Stew", icon: "🍲", type: "food", hunger: 12, desc: "Sytí 12h.", desc_en: "Fills for 12h." },
    "stew_koreni": { name: "Guláš s pepřem", name_en: "Peppered Stew", icon: "🍲", type: "food", desc: "Guláš dochucený černým pepřem — statusová hostina, ne obyčejná kaše.", desc_en: "Stew seasoned with black pepper — a dish of status, not common porridge." },
    "mushroom_soup": { name: "Houbová polévka", name_en: "Mushroom Pottage", icon: "🥣", type: "food", hunger: 8, desc: "Sytí 8h.", desc_en: "Fills for 8h." },
    "spring_herb_porridge": { name: "Jarní bylinková kaše", name_en: "Spring Herb Porridge", icon: "🥣", type: "food", desc: "Kopřiva, bršlice a lebeda v ovesné kaši. Chudé jaro, plný hrnec.", desc_en: "Nettle, ground elder and goosefoot in oat porridge. A lean spring, a full pot." },
    "couch_grass_flour": { name: "Pýrová mouka", name_en: "Couch Grass Flour", icon: "🌾", type: "mat", desc: "Umleté oddenky pýru. Hladový chléb, když obilí došlo.", desc_en: "Ground couch grass rhizomes. Famine bread when the grain runs out." },
    "burdock_root_baked": { name: "Pečený kořen lopuchu", name_en: "Baked Burdock Root", icon: "🥕", type: "food", desc: "Upečený v popelu ohně. Nasládlá, zemitá chuť.", desc_en: "Baked in the ashes of the fire. A sweetish, earthy taste." },
    "rosehip_sauce": { name: "Šípková jícha", name_en: "Rosehip Sauce", icon: "🍲", type: "food", desc: "Šípky rozvařené a zahuštěné chlebem.", desc_en: "Rosehips stewed down and thickened with bread." },
    "famine_bread": { name: "Hladový chléb", name_en: "Famine Bread", icon: "🍞", type: "food", desc: "Žaludy a bukvice, louhované a umleté na mouku. Jídlo krajní nouze.", desc_en: "Acorns and beechnuts, leached and ground into flour. Food of last resort." },
    "dried_wild_fruit": { name: "Křížaly", name_en: "Dried Wild Fruit", icon: "🍏", type: "food", desc: "Planá jablka a dřínky sušené na peci.", desc_en: "Wild apples and cornel cherries dried by the oven." },
    "sloe_jam": { name: "Trnková povidla", name_en: "Sloe Jam", icon: "🍇", type: "food", desc: "Bez cukru — jen dlouhé vaření a trpělivost.", desc_en: "No sugar — just long boiling and patience." },
    "morel_stuffed": { name: "Plněné smrže", name_en: "Stuffed Morels", icon: "🍄", type: "food", desc: "Smrže plněné bylinkami, pečené v hliněné nádobě.", desc_en: "Morels stuffed with herbs, baked in a clay dish." },
    "pickled_mushrooms": { name: "Naložené houby", name_en: "Pickled Mushrooms", icon: "🍄", type: "food", desc: "Ryzce a hřiby v slaném nálevu. Vydrží celou zimu.", desc_en: "Saffron milk caps and porcini in brine. Keeps all winter." },
    "smazenice": { name: "Smaženice", name_en: "Fried Mushroom Scramble", icon: "🍳", type: "food", hunger: 9, desc: "Houby smažené s vejci a cibulí. Sytí 9h.", desc_en: "Mushrooms fried with eggs and onion. Fills for 9h." },
    "bread": { name: "Chléb", name_en: "Bread", icon: "🍞", type: "food", hunger: 10, desc: "Sytí 10h.", desc_en: "Fills for 10h." },
    "bread_fine": { name: "Bílý chléb", name_en: "Fine Bread", icon: "🍞", type: "food", desc: "Chléb z mleté mouky 2. třídy. Sytější a chutnější než obyčejný chléb.", desc_en: "Bread from grade-2 flour. Heartier and finer than common bread." },
    "bread_fine_1": { name: "Bílý chléb (prvotřídní)", name_en: "Fine Bread (Grade 1)", icon: "🍞", type: "food", desc: "Chléb z prvotřídní mouky vlastního pole. Nejlepší chléb v klášteře.", desc_en: "Bread from grade-1 flour off your own field. The finest bread in the monastery." },
    "berry_pie": { name: "Borůvkový koláč", name_en: "Berry Tart", icon: "🥧", type: "food", hunger: 8, desc: "Sytí 8h.", desc_en: "Fills for 8h." },
    "berry_pie_koreni": { name: "Borůvkový koláč se skořicí", name_en: "Cinnamon Berry Tart", icon: "🥧", type: "food", desc: "Koláč provoněný skořicí. Vzácné koření na obyčejném ovoci.", desc_en: "A tart scented with cinnamon. Rare spice on humble fruit." },
    "berry_pie_fine": { name: "Borůvkový koláč (moučný)", name_en: "Fine Berry Tart", icon: "🥧", type: "food", desc: "Koláč s pravým těstem z mouky 2. třídy. Lepší než prostý koláč.", desc_en: "A tart with proper dough from grade-2 flour. Finer than the plain version." },
    "berry_pie_fine_1": { name: "Borůvkový koláč (prvotřídní)", name_en: "Fine Berry Tart (Grade 1)", icon: "🥧", type: "food", desc: "Koláč z prvotřídní mouky vlastního pole. Top koláč kláštera.", desc_en: "A tart from grade-1 flour off your own field. The monastery's finest pastry." },

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
    "seeds_plantain": { name: "Semínka jitrocele", name_en: "Plantain Seeds", icon: "🌾", type: "mat", desc: "Jitrocel. Hojivá bylina od nepaměti.", desc_en: "Plantain. A healing herb since time immemorial." },
    "seeds_leek": { name: "Semínka póru", name_en: "Leek Seeds", icon: "🌱", type: "mat", desc: "Pór. Ze záhonů sv. Gallenských.", desc_en: "Leek. From the St Gallen beds." },
    "seeds_carrot": { name: "Semínka mrkve", name_en: "Carrot Seeds", icon: "🌱", type: "mat", desc: "Mrkev. Vzejde jen z rostliny nechané vykvést.", desc_en: "Carrot. Comes only from a plant left to flower." },
    "seeds_onion": { name: "Semínka cibule", name_en: "Onion Seeds", icon: "🌱", type: "mat", desc: "Cibule. Vzejde jen z rostliny nechané vykvést.", desc_en: "Onion. Comes only from a plant left to flower." },
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
    "seeds_vikev": { name: "Osivo vikve", name_en: "Vetch Seed", icon: "🌱", type: "mat", desc: "Osivo vikve. Luštěnina pro pole, hojí půdu.", desc_en: "Vetch seed. A legume for the fields, heals the soil." },
    "seeds_flax": { name: "Osivo lnu", name_en: "Flax Seed", icon: "🌱", type: "mat", desc: "Osivo lnu. Přadná plodina, vzácnější.", desc_en: "Flax seed. A fibre crop, rarer to find." },
    "seeds_mandrake": { name: "Semínka mandragory", name_en: "Mandrake Seeds", icon: "🌾", type: "mat", desc: "Vzácná. Opatřit není snadné.", desc_en: "Rare. Not easy to obtain." },
    "seeds_belladonna": { name: "Semínka rulíku", name_en: "Belladonna Seeds", icon: "🌾", type: "mat", desc: "Jedovatá. Zacházet opatrně.", desc_en: "Poisonous. Handle with care." },
    "seeds_poppy": { name: "Semínka máku", name_en: "Poppy Seeds", icon: "🌾", type: "mat", desc: "Mák. Léčivý i jedlý.", desc_en: "Poppy. Medicinal and edible." },
    "seeds_nettle": { name: "Semínka kopřivy", name_en: "Nettle Seeds", icon: "🌱", type: "mat", desc: "Kopřiva. Roste všude, ale v zahradě lépe.", desc_en: "Nettle. Grows anywhere, better in a garden." },
    "seeds_cannabis": { name: "Semínka konopí setého", name_en: "Hemp Seeds", icon: "🌱", type: "mat", desc: "Cannabis sativa. Konopí seté — pěstováno v Čechách od nepaměti na vlákno, olej i semena.", desc_en: "Cannabis sativa. Hemp — cultivated in Bohemia since ancient times for fibre, oil and seed." },

    // NOTEBOOKS
    "tabula": { name: "Tabula (Vosková destička)", name_en: "Tabula (Wax Tablet)", icon: "📋", type: "tool", desc: "Dočasné poznámky.", desc_en: "Temporary notes." },
    "adversaria": { name: "Adversaria (Pracovní sešit)", name_en: "Adversaria (Workbook)", icon: "📔", type: "lore", desc: "Trvalé poznámky.", desc_en: "Permanent notes." },
    "vademecum": { name: "Vademecum (Jdi se mnou)", name_en: "Vademecum (Go With Me)", icon: "📘", type: "lore", desc: "Kapesní příručka.", desc_en: "A pocket handbook." },
    "florilegium": { name: "Florilegium (Sbírka květů)", name_en: "Florilegium (Flower Book)", icon: "🌸", type: "lore", desc: "Sbírka mouder.", desc_en: "A collection of wisdom." },
    "enchiridion": { name: "Enchiridion (Mistrovský manuál)", name_en: "Enchiridion (Master Manual)", icon: "📖", type: "lore", desc: "Ultimate systém.", desc_en: "The ultimate system." },

    // I-CHING
    "iching_book": { name: "I-Ching (Kniha Proměn)", name_en: "I-Ching (Book of Changes)", icon: "☯️", type: "lore", cat: "lore", desc: "Starověký čínský text věštění. Hoď mince a poznej svůj osud.", desc_en: "Ancient Chinese divination. Cast coins and know thy fate." },

    // VELLUM CHAIN
    "hide": { name: "Divoká kůže", name_en: "Wild Hide", icon: "🦌", type: "mat", desc: "Nezpracovaná, neidentifikovaná kůže z lovu. Hrubě na useň, nebo pracně na surovou kůži pro pergamen.", desc_en: "Unprocessed, unidentified hide from the hunt. Crudely into rawhide, or laboriously into raw hide for vellum." },
    "wild_leather": { name: "Hrubá useň", name_en: "Rough Rawhide", icon: "🦴", type: "mat", desc: "Sedřená a usušená divoká kůže, bez vydělávání. Hrubá, ale postačí na nástroje.", desc_en: "Scraped and dried wild hide, untanned. Rough, but good enough for tools." },
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
    "vrbova_kura": { name: "Vrbová kůra", name_en: "Willow Bark", icon: "🌿", type: "alchemy_ing", desc: "Chladná a vlhká kůra vrby. Tiší horečku a bolest.", desc_en: "Cool, moist willow bark. Eases fever and pain." },
    "oak_bark": { name: "Dubová kůra", name_en: "Oak Bark", icon: "🌳", type: "alchemy_ing", desc: "Třísloviny z dubové kůry. Základ pro fixaci barviv i výrobu inkoustu bez kovů.", desc_en: "Tannins from oak bark. A base for fixing dyes and making ink without metals." },
    "iron_sulfate": { name: "Síran železnatý", name_en: "Iron Vitriol", icon: "⚗️", type: "alchemy_ing", desc: "Vitriol. Z chemické reakce.", desc_en: "Vitriol. From chemical reaction." },
    "gum_arabic": { name: "Arabská guma", name_en: "Gum Arabic", icon: "💧", type: "alchemy_ing", desc: "Ze stromů akácie. Pojidlo.", desc_en: "From acacia trees. A binder." },
    "ink_gallic": { name: "Železitoduběnkový inkoust", name_en: "Iron Gall Ink", icon: "✒️", type: "lore", desc: "Permanentní. Prožírá pergamen po 80 letech.", desc_en: "Permanent. Eats through vellum after 80 years." },

    // PRINTING PRESS
    "lead_alloy": { name: "Olověná slitina", name_en: "Lead Alloy", icon: "⚗️", type: "mat", desc: "Základ tiskových liter.", desc_en: "Base for printing type." },
    "printing_type": { name: "Tiskové litery", name_en: "Printing Type", icon: "🔤", type: "tool", desc: "100x použití. Pak worn_type.", desc_en: "100 uses. Then worn_type." },
    "font_set": { name: "Sada mohučských liter", name_en: "Mainz Type Set", icon: "🔡", type: "tool", desc: "Prémiová sada liter z původní Gutenbergovy dílny. Historická vzácnost.", desc_en: "A premium type set from Gutenberg's original workshop. A historical rarity." },
    "worn_type": { name: "Opotřebované litery", name_en: "Worn Type", icon: "🔤", type: "mat", desc: "Prodávaly se jako kovový odpad.", desc_en: "Sold as scrap metal." },

    // CODEX TYPES
    "common_codex": { name: "Běžný kodex", name_en: "Common Codex", icon: "📘", type: "lore", desc: "Ručně opsaný papírový kodex. 1 research.", desc_en: "Hand-copied paper codex. 1 research." },
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

    // ── Fix 3B (athanor-integrity-audit.md §3) — 9 chybějících ingrediencí,
    // co blokovaly 8 recomentovaných Athanor combos. Zdroje: Doly (vitriol,
    // malachite), Scavenge (rose), Athanor-craft (vinegar, turpentine),
    // B3/E1 event pool (sulfur, mercury — už tam byly zapsané, jen chyběl item),
    // Giacomo import (alum, sandarak).
    "vitriol": { name: "Zelená skalice", name_en: "Green Vitriol", icon: "💚", type: "alchemy_ing", desc: "Vitriolum. Síran železnatý z hlubin dolu. Se svíravou duběnkou dává inkoust, co propálí pergamen za sto let, ale vydrží tisíc.", desc_en: "Vitriolum. Iron sulfate from deep in the mine. With astringent oak gall it makes an ink that eats through vellum in a century, yet lasts a thousand years." },
    "malachite": { name: "Malachit", name_en: "Malachite", icon: "🟢", type: "alchemy_ing", desc: "Zelená měděná ruda z dolu. Rozetřená dává jasně zelený pigment pro iluminace.", desc_en: "Green copper ore from the mine. Ground fine, it yields a bright green pigment for illuminations." },
    "rose": { name: "Divoká růže", name_en: "Wild Rose", icon: "🌹", type: "herb", desc: "Šípková růže z mezí a remízků. Okvětní lístky voní i po usušení.", desc_en: "Wild dog-rose from the hedgerows. Its petals keep their scent even dried." },
    "vinegar": { name: "Ocet", name_en: "Vinegar", icon: "🍶", type: "food", desc: "Zkyslé víno. Konzervant, rozpouštědlo, základ mnoha lékařských odvarů.", desc_en: "Soured wine. A preservative, a solvent, the base of many medicinal draughts." },
    "turpentine": { name: "Terpentýn", name_en: "Turpentine", icon: "🧴", type: "alchemy_ing", desc: "Destilát z borové pryskyřice. Ředí laky, čistí štětce — postup starý jako antika sama.", desc_en: "A distillate of pine resin. Thins varnishes, cleans brushes — a process as old as antiquity." },
    "sulfur": { name: "Síra", name_en: "Sulfur", icon: "🟡", type: "alchemy_ing", desc: "Žlutý hořlavý nerost. Alchymisté v něm viděli jednu ze tří základních principů hmoty.", desc_en: "A yellow, combustible mineral. Alchemists saw in it one of the three basic principles of matter." },
    "mercury": { name: "Rtuť", name_en: "Mercury", icon: "🔘", type: "alchemy_ing", desc: "Argentum vivum — živé stříbro. Tekutý kov, co se nikdy nezastaví. Jedovatý, ale nepostradatelný v alchymistické dílně.", desc_en: "Argentum vivum — quicksilver. A liquid metal that never stops moving. Poisonous, but indispensable in the alchemist's workshop." },
    "alum": { name: "Kamenec", name_en: "Alum", icon: "⚪", type: "mat", desc: "Nezbytné mořidlo pro barvení a činění. Do roku 1462 se dovážel draze z osmanské Foceje — teď ho papežský monopol těží z Tolfy.", desc_en: "An essential mordant for dyeing and tanning. Until 1462 it was imported at great cost from Ottoman Phocaea — now a papal monopoly mines it at Tolfa." },
    "sandarak": { name: "Sandarak", name_en: "Sandarac", icon: "🟠", type: "mat", desc: "Vzácná pryskyřice ze severoafrického jehličnanu. Cennini ji chválí pro čiré laky na iluminace.", desc_en: "A rare resin from a North African conifer. Cennini praises it for clear varnishes over illuminations." },

    // ── Vlna 1 (media-materia-konsolidace.md §3) — Doly trojice základních kovů.
    "lead": { name: "Olovo", name_en: "Lead", icon: "⚫", type: "alchemy_ing", desc: "Plumbum. Těžké, měkké olovo z hlubších štol — v Kutné Hoře se váže spolu se stříbrnou rudou.", desc_en: "Plumbum. Heavy, soft lead from deeper shafts — at Kutná Hora it occurs bound together with silver ore." },
    "copper": { name: "Měď", name_en: "Copper", icon: "🟠", type: "alchemy_ing", desc: "Cuprum. Červenozlatý kov z dolu. Základ pro měděnku, azurit i sklářské barvení.", desc_en: "Cuprum. A red-gold metal from the mine. The base for verdigris, azurite, and glass colouring." },
    "tin": { name: "Cín", name_en: "Tin", icon: "⚪", type: "alchemy_ing", desc: "Stannum. Čechy jsou cínová velmoc — Krušné hory dodávají cín do celé Evropy.", desc_en: "Stannum. Bohemia is a tin power — the Ore Mountains supply tin across Europe." },

    // ── Vlna 2 (media-materia-konsolidace.md §3) — zbytek Prima Materia.
    "sal_petrae": { name: "Ledek", name_en: "Saltpetre", icon: "⚪", type: "alchemy_ing", desc: "Sal Petrae. Výkvět usazený na stěnách hlubších štol — dobová metoda sběru \"kamenné soli\".", desc_en: "Sal Petrae. An efflorescence found on the walls of deeper mine shafts — the period method of gathering \"stone salt\"." },
    "arsenicum": { name: "Arsen", name_en: "Arsenic", icon: "🟡", type: "alchemy_ing", desc: "Arsenicum. Prudce jedovatý nerost, který se v dole váže na jiné rudy. Albertus Magnus o něm psal jako o jedu i bělidlu mědi.", desc_en: "Arsenicum. A violently poisonous mineral bound to other ores in the mine. Albertus Magnus wrote of it as both poison and a whitener of copper." },
    "sal_ammoniac": { name: "Salmiak", name_en: "Sal Ammoniac", icon: "⚪", type: "mat", desc: "Sal Ammoniacum. Dováží se draze z Egypta přes Benátky. Hlavní tavidlo metalurgie, nepostradatelné pro mozaikové zlato.", desc_en: "Sal Ammoniacum. Imported at great cost from Egypt via Venice. The chief flux of metallurgy, indispensable for mosaic gold." },
    "verzino": { name: "Verzino", name_en: "Verzino", icon: "🪵", type: "mat", desc: "Sapanové dřevo z Asie, obchodované v Evropě už od 12. století (Cenninim zmiňováno jako \"uerzino\"). Sytě purpurové barvivo.", desc_en: "Sappanwood from Asia, traded in Europe since the 12th century (Cennini calls it \"uerzino\"). A deep purple dye." },
    "cornu_cervi": { name: "Jelení paroh", name_en: "Deer Antler", icon: "🦌", type: "mat", desc: "Cornu Cervi. Sesbíraný shozený paroh z lesa. Žíháním dá nejjemnější bílý prášek ve skriptoriu.", desc_en: "Cornu Cervi. A shed antler gathered from the forest. Calcined, it yields the finest white powder in the scriptorium." },
    "gentian": { name: "Hořec", name_en: "Gentian", icon: "🌼", type: "herb", desc: "Gentiana. Hořká horská bylina, základ theriaku a žaludečních tonik od antiky.", desc_en: "Gentiana. A bitter mountain herb, the base of theriac and stomach tonics since antiquity." },

    // ── Vlna 3 (media-materia-konsolidace.md §5) — prekurzory + Ultima Materia
    "aqua_ardens": { name: "Ohnivá voda", name_en: "Aqua Ardens", icon: "🔥", type: "alchemy_ing", desc: "Aqua Ardens. Hořlavý destilát z prvního průchodu vína alembikem. Základní dezinfekce Infirmaria, předstupeň čistého lihu.", desc_en: "Aqua Ardens. A flammable distillate from the first pass of wine through the alembic. Basic disinfectant for the Infirmary, a precursor to pure spirit." },
    "spiritus_vini": { name: "Vinný líh", name_en: "Spirit of Wine", icon: "🔥", type: "alchemy_ing", desc: "Spiritus Vini Rectificatus. Čistý, vysoce hořlavý alkohol z opakované destilace. Extrahující médium pro nejsilnější tinktury.", desc_en: "Spiritus Vini Rectificatus. Pure, highly flammable alcohol from repeated distillation. The extracting medium for the strongest tinctures." },
    "acetum_destillatum": { name: "Destilovaný ocet", name_en: "Distilled Vinegar", icon: "🍶", type: "alchemy_ing", desc: "Spiritus Aceti. Vysoce koncentrovaná kyselina octová zbavená vinných nečistot. Klíčová pro čistou olověnou bělobu.", desc_en: "Spiritus Aceti. Highly concentrated acetic acid, freed of wine impurities. Key to pure lead white." },
    "spiritus_vitrioli": { name: "Olej vitriolu", name_en: "Oil of Vitriol", icon: "🧪", type: "alchemy_ing", desc: "Spiritus Vitrioli. Extrémně žíravá kyselina ze silné destilace zelené skalice. Zuhelnatí organické zbytky, žíravě leptá.", desc_en: "Spiritus Vitrioli. An extremely caustic acid from the strong distillation of green vitriol. Chars organic remains, corrosively etches." },
    "aqua_fortis": { name: "Kyselina dusičná", name_en: "Aqua Fortis", icon: "🧪", type: "alchemy_ing", desc: "Aqua Fortis. Destilace vitriolu, kamence a ledku. Rozpouští stříbro, leptá kovy — Pseudo-Geberova Summa Perfectionis, ~1300.", desc_en: "Aqua Fortis. A distillation of vitriol, alum and saltpetre. Dissolves silver, etches metals — Pseudo-Geber's Summa Perfectionis, c.1300." },
    "aqua_regia": { name: "Lučavka královská", name_en: "Aqua Regia", icon: "🧪", type: "alchemy_ing", desc: "Aqua Regia. Aqua Fortis smíchaná se salmiakem. Jediná kapalina, co rozpustí zlato.", desc_en: "Aqua Regia. Aqua Fortis mixed with sal ammoniac. The only liquid that dissolves gold." },
    "auripigmentum": { name: "Auripigment", name_en: "Orpiment", icon: "🟡", type: "alchemy_ing", desc: "Auripigmentum. Sulfid arsenitý. Zářivě citronově žlutá, připomíná ryzí zlato — extrémně toxická. Albertus Magnus o ní psal v De Mineralibus.", desc_en: "Auripigmentum. Arsenic sulfide. A brilliant lemon yellow resembling pure gold — extremely toxic. Albertus Magnus wrote of it in De Mineralibus." },
    "cinnabaris_pura": { name: "Syntetická rumělka", name_en: "Synthetic Vermilion", icon: "🔴", type: "alchemy_ing", desc: "Cinnabaris Pura. Alchymistická syntéza síry a živého stříbra v zapečetěné baňce. Prudký žár, toxické výpary — riziko exploze v Athanoru.", desc_en: "Cinnabaris Pura. An alchemical synthesis of sulfur and quicksilver in a sealed flask. Fierce heat, toxic fumes — risk of explosion in the Athanor." },
    "atramentum_perpetuum": { name: "Věčný inkoust", name_en: "Everlasting Ink", icon: "⚫", type: "alchemy_ing", desc: "Atramentum Perpetuum. Ferrogalický inkoust vařený s vinným lihem pro maximální penetraci do pergamenu. Nevybledne, nepodlehne vlhku.", desc_en: "Atramentum Perpetuum. Iron-gall ink boiled with spirit of wine for maximum penetration into vellum. Never fades, never succumbs to damp." },
    "verdigris_purum": { name: "Krystalická měděnka", name_en: "Purified Verdigris", icon: "🟢", type: "alchemy_ing", desc: "Viride Aeris Purificatum. Surová měděnka rozpuštěná v destilovaném octu a nechaná pomalu krystalizovat. Nejhlubší smaragdový tón středověku.", desc_en: "Viride Aeris Purificatum. Raw verdigris dissolved in distilled vinegar and left to crystallise slowly. The deepest emerald tone of the Middle Ages." },
    "magisterium_mandragorae": { name: "Magisterium mandragory", name_en: "Magisterium of Mandrake", icon: "🌿", type: "alchemy_ing", desc: "Magisterium Mandragorae. Mandragora destilovaná s lihem a medem. Vysoce riskantní anestetikum — a most k myšlenkám, které do kláštera nepatří.", desc_en: "Magisterium Mandragorae. Mandrake distilled with spirit and honey. A highly risky anaesthetic — and a bridge to thoughts that do not belong in the monastery." },
    "aurum_musicum": { name: "Mozaikové zlato", name_en: "Mosaic Gold", icon: "✨", type: "alchemy_ing", desc: "Aurum Musicum. Rtuť, cín, síra a salmiak žíhané v zapečetěné baňce. Sulfid cíničitý, co se třpytí jako zlato a nikdy nezčerná — Cennini, ~1400.", desc_en: "Aurum Musicum. Mercury, tin, sulfur and sal ammoniac calcined in a sealed flask. Tin sulfide that glitters like gold and never darkens — Cennini, c.1400." },
    "theriacum_simplex": { name: "Základní theriak", name_en: "Simple Theriac", icon: "🍯", type: "alchemy_ing", desc: "Theriacum Simplex. Pelyněk, hořec a med svařené s vínem. Hořkosladký základní kámen pro legendární Theriacum Monasticum.", desc_en: "Theriacum Simplex. Wormwood, gentian and honey boiled with wine. A bittersweet cornerstone for the legendary Theriacum Monasticum." },

    // ── Scrinium Recipe Folios MRD — 23 receptů odemčených nalezením 7 folií
    // v Tajných spisech (unlockFolio gate v athanor.js, ne TechTree).
    // Folio 1 — Codex Coloris Perditi (Ztracené barvy)
    "palette_membrana": { name: "Tělová barva", name_en: "Flesh Tone", icon: "🎨", type: "alchemy_ing", desc: "Palette Membrana. Běloba, suřík a okr utřené dohromady. Základní tón pro malbu lidské kůže v iluminacích.", desc_en: "Palette Membrana. Lead white, red lead and ochre ground together. The base tone for painting human skin in illuminations." },
    "poschum": { name: "Stínovací barva", name_en: "Shading Paint", icon: "🎨", type: "alchemy_ing", desc: "Poschum. Tělová barva prohloubená sinopií. Vrhá stín pod oči a líce — vdechuje iluminaci hloubku a život.", desc_en: "Poschum. Flesh tone deepened with sinopia. Casts shadow beneath eyes and cheeks — breathes depth and life into an illumination." },
    "pigment_regius": { name: "Královský pigment", name_en: "Regal Pigment", icon: "🟣", type: "alchemy_ing", desc: "Pigmentum Regium. Krystalická měděnka smíchaná s lapis lazuli. Sytý modrozelený tón vyhrazený rouchům králů a Krista.", desc_en: "Pigmentum Regium. Purified verdigris mixed with lapis lazuli. A deep blue-green reserved for the robes of kings and Christ." },

    // Folio 2 — Notata Fornacis (Poznámky od pece)
    "sklo_zelene": { name: "Zelené sklo", name_en: "Green Glass", icon: "🟢", type: "alchemy_ing", desc: "Vitrum Viride. Žíhaná měď tavená s louhovou solí. Měď barví sklo do syta zelena — postup starý jako sklářství samo.", desc_en: "Vitrum Viride. Calcined copper melted with alkali salt. Copper colours glass a deep green — a technique as old as glassmaking itself." },
    "glazura_bila": { name: "Bílá glazura", name_en: "White Glaze", icon: "⚪", type: "alchemy_ing", desc: "Glazura Alba. Cínový popel s křídou. Neprůhledná bílá glazura na klášterní keramiku — cínová běloba kryje jako žádná jiná.", desc_en: "Glazura Alba. Tin ash with chalk. An opaque white glaze for monastery pottery — tin white covers like nothing else." },
    "sklo_olovnate": { name: "Olovnaté sklo", name_en: "Lead Glass", icon: "🟡", type: "alchemy_ing", desc: "Vitrum Plumbeum. Klejt tavený s louhovou solí. Těžší, měkčí sklo — snadněji broušené a řezané než obyčejné lesní sklo.", desc_en: "Vitrum Plumbeum. Litharge melted with alkali salt. A heavier, softer glass — easier to cut and grind than common forest glass." },

    // Folio 3 — Liber Medicaminum Arcanorum
    "mast_kostivalova": { name: "Kostivalová mast", name_en: "Comfrey Salve", icon: "🫙", type: "alchemy", desc: "Unguentum Symphyti. Kostival svařený s voskem a lněným olejem. Základ středověké ortopedie na pohmožděniny a zlomeniny.", desc_en: "Unguentum Symphyti. Comfrey boiled with wax and linseed oil. The foundation of medieval orthopaedics for bruises and fractures." },
    "tinktura_rebrikova": { name: "Řebříčková tinktura", name_en: "Yarrow Tincture", icon: "🍶", type: "alchemy", desc: "Tinctura Millefolii. Řebříček louhovaný v octě. Achilles jím prý léčil rány svých vojáků — proto Achillea millefolium.", desc_en: "Tinctura Millefolii. Yarrow steeped in vinegar. Achilles is said to have healed his soldiers' wounds with it — hence Achillea millefolium." },
    "sirup_jalovcovy": { name: "Jalovcový sirup", name_en: "Juniper Syrup", icon: "🍯", type: "alchemy", desc: "Syrupus Juniperi. Jalovec svařený s medem. Silně prohřívací, oblíbený proti revma a dně.", desc_en: "Syrupus Juniperi. Juniper boiled with honey. Strongly warming, favoured against rheumatism and gout." },
    "elixir_plicni": { name: "Plicní elixír", name_en: "Lung Elixir", icon: "🍶", type: "alchemy", desc: "Elixir Pulmonis. Yzop vařený s vínem. Benediktinská bylina proti kašli a dechové tísni od žalmů až po klášterní zahrady.", desc_en: "Elixir Pulmonis. Hyssop boiled with wine. A Benedictine herb against cough and breathlessness, from the Psalms to monastic gardens." },

    // Folio 4 — Testamentum Ultimum (capstone)
    "theriacum_monasticum": { name: "Theriacum Monasticum", name_en: "Theriacum Monasticum", icon: "👑", type: "alchemy", desc: "Legendární univerzální protijed. Ve středověku míval až 64 složek a zrál 12 let — nejdražší lék světa. Tahle klášterní verze je skromnější, ale stejně vzácná.", desc_en: "The legendary universal antidote. Medieval versions had up to 64 ingredients and aged 12 years — the world's most expensive medicine. This monastic version is humbler, but no less precious." },
    "elixir_vitae": { name: "Elixir Vitae", name_en: "Elixir Vitae", icon: "✨", type: "alchemy", desc: "Elixír života. Alchymisté od Rogera Bacona snili o látce, co zastaví stárnutí. Tahle verze zázrak neslibuje — jen den bez únavy.", desc_en: "The Elixir of Life. Alchemists since Roger Bacon dreamed of a substance to halt ageing. This version promises no miracle — only a day without fatigue." },

    // Folio 5 — Herbarium Occultum
    "mast_jitrocelova": { name: "Jitrocelová mast", name_en: "Plantain Salve", icon: "🫙", type: "alchemy", desc: "Unguentum Plantaginis. Jitrocel utřený s voskem. Poutníkova bylina roste u každé cesty a hojí rány od nepaměti.", desc_en: "Unguentum Plantaginis. Plantain ground with wax. The wayfarer's herb grows by every road and has healed wounds since time immemorial." },
    "sirup_fenyklovy": { name: "Fenyklový sirup", name_en: "Fennel Syrup", icon: "🍯", type: "alchemy", desc: "Syrupus Foeniculi. Fenykl svařený s medem. Hildegarda jej doporučovala na trávení a plynatost.", desc_en: "Syrupus Foeniculi. Fennel boiled with honey. Hildegard recommended it for digestion and flatulence." },
    "mast_universalni": { name: "Univerzální mast", name_en: "Universal Salve", icon: "🫙", type: "alchemy", desc: "Unguentum Universale. Kostival a řebříček svařené s voskem. Léčí rány, pohmožděniny i drobné popáleniny — jedna mast na vše.", desc_en: "Unguentum Universale. Comfrey and yarrow boiled with wax. Heals wounds, bruises and minor burns — one salve for everything." },

    // Folio 6 — Fragmenta Alchemiae
    "pigment_malachit": { name: "Malachitová zeleň", name_en: "Malachite Green", icon: "🟢", type: "alchemy_ing", desc: "Pigmentum Malachitum. Malachit rozetřený s arabskou gumou. Zelený pigment používaný od starověkého Egypta.", desc_en: "Pigmentum Malachitum. Malachite ground with gum arabic. A green pigment used since ancient Egypt." },
    "mordant_universal": { name: "Univerzální mořidlo", name_en: "Universal Mordant", icon: "🧪", type: "alchemy_ing", desc: "Mordant Universalis. Kamenec s křídou a gumou. Váže rostlinná barviva na tkaninu i pergamen, aby nevymyla vlhkem.", desc_en: "Mordant Universalis. Alum with chalk and gum. Binds plant dyes to cloth and vellum so damp cannot wash them away." },
    "tmel_kostni": { name: "Kostní tmel", name_en: "Bone Putty", icon: "🦴", type: "alchemy_ing", desc: "Cement Ossium. Kostní popel s lněným olejem. Hustá tmelová hmota pro přípravu podkladu pod zlacení.", desc_en: "Cement Ossium. Bone ash with linseed oil. A dense puttying compound for preparing a ground beneath gilding." },
    "pigment_zlatozluty": { name: "Zlatožlutý pigment", name_en: "Golden Yellow Pigment", icon: "🟡", type: "alchemy_ing", desc: "Pigmentum Aureum. Auripigment s arabskou gumou. Citronově zlatá barva pro iluzi zlacení v chudších liturgických knihách.", desc_en: "Pigmentum Aureum. Orpiment with gum arabic. A lemon-gold colour for the illusion of gilding in humbler liturgical books." },

    // Folio 7 — Secretum Vitriarii
    "slitina_cin_olovo": { name: "Cínovo-olověná slitina", name_en: "Tin-Lead Alloy", icon: "⚪", type: "alchemy_ing", desc: "Stannum Plumbeum. Cín tavený s olovem. Cíncovina — pravá středověká pájka a slitina na cínové nádobí.", desc_en: "Stannum Plumbeum. Tin melted with lead. Pewter — a true medieval solder and the alloy of tin tableware." },
    "bronz": { name: "Bronz", name_en: "Bronze", icon: "🟠", type: "alchemy_ing", desc: "Aes. Měď tavená s cínem. Nejstarší slitina lidstva — zvony, nářadí, sochy. Klášter s vlastním bronzem si odlije vlastní zvon.", desc_en: "Aes. Copper melted with tin. Humanity's oldest alloy — bells, tools, statues. A monastery with its own bronze can cast its own bell." },
    "lak_universalni": { name: "Sandarakový lak", name_en: "Sandarac Varnish", icon: "✨", type: "alchemy_ing", desc: "Vernix Sandaraca. Sandarak rozpuštěný ve vinném lihu — Cenniniho nejluxusnější čirý lak. Uzavírá iluminace proti vzdušné vlhkosti.", desc_en: "Vernix Sandaraca. Sandarac dissolved in spirit of wine — Cennini's most luxurious clear varnish. Seals illuminations against damp air." },
    "belidlo_medi": { name: "Bělidlo mědi", name_en: "Copper Whitener", icon: "⚪", type: "alchemy_ing", desc: "Candificatio Cupri. Arsen s křídou. Albertus Magnus o arsenu psal jako o jedu i bělidlu mědi — nebezpečný, ale účinný postup.", desc_en: "Candificatio Cupri. Arsenic with chalk. Albertus Magnus wrote of arsenic as both poison and a whitener of copper — a dangerous but effective process." },

    // ── Vlna 2 — navazující Media Materia (žádná surovina nechybí)
    "ash_water": { name: "Louh z popela", name_en: "Wood-Ash Lye", icon: "🫗", type: "alchemy_ing", desc: "Aqua Cinerum. Voda protažená dřevěným popelem. Zásaditý louh — základ mýdla i sklářské huti.", desc_en: "Aqua Cinerum. Water leached through wood ash. An alkaline lye — the base of soap and the glass furnace." },
    "tartarus": { name: "Vinný kámen", name_en: "Tartar", icon: "🍇", type: "alchemy_ing", desc: "Tartarus. Krystalická usazenina seškrábaná ze stěn sudů se zralým vínem.", desc_en: "Tartarus. A crystalline crust scraped from the walls of barrels holding aged wine." },
    "sal_alkali": { name: "Louhová sůl", name_en: "Alkali Salt", icon: "⚪", type: "alchemy_ing", desc: "Sal Alkali. Odpařený a žíhaný popelový louh. Nezbytný pro tavení lesního skla ve sklářské huti.", desc_en: "Sal Alkali. Evaporated and calcined wood-ash lye. Essential for melting forest glass in the glassworks." },
    "oleum_tartari": { name: "Olej vinného kamene", name_en: "Oil of Tartar", icon: "🫗", type: "alchemy_ing", desc: "Oleum Tartari per Deliquium. Silná zásada z louhování vinného kamene. Neutralizuje kyseliny, základ klášterních mýdel.", desc_en: "Oleum Tartari per Deliquium. A strong alkali from leaching tartar. Neutralises acids, the base of monastic soaps." },
    "spodium": { name: "Kostní popel", name_en: "Bone Ash", icon: "⚪", type: "alchemy_ing", desc: "Spodium. Žíhaná kost na extrémně suchý bílý prášek. Leští pergamen, staví žáruvzdorné kelímky pro kupelaci stříbra.", desc_en: "Spodium. Calcined bone reduced to an extremely dry white powder. Polishes vellum, builds refractory crucibles for silver cupellation." },
    "spodium_cervi": { name: "Jelení běloba", name_en: "Hartshorn White", icon: "⚪", type: "alchemy_ing", desc: "Spodium Cervi. Dokonale vyžíhaný jelení paroh utřený na nejjemnější bílý prášek. Pro nejjemnější odlesky na rouchách svatých.", desc_en: "Spodium Cervi. A perfectly calcined antler ground to the finest white powder. For the finest highlights on the robes of saints." },
    "calx_alba": { name: "Vápenná běloba", name_en: "Shell White", icon: "⚪", type: "alchemy_ing", desc: "Calx Alba. Vaječné skořápky žíhané na čistý oxid vápenatý. Levnější náhrada za olověnou bělobu.", desc_en: "Calx Alba. Eggshells calcined to pure calcium oxide. A cheaper substitute for lead white." },
    "carbo_vitis": { name: "Révová čerň", name_en: "Vine Black", icon: "🖤", type: "alchemy_ing", desc: "Carbo Vitis. Dřevo žíhané bez přístupu vzduchu na sametově modročerný uhlík — jemnější než obyčejné saze z krbu.", desc_en: "Carbo Vitis. Wood calcined without air into a velvety blue-black char — finer than ordinary hearth soot." },
    "cerusa": { name: "Olověná běloba", name_en: "Lead White", icon: "⚪", type: "alchemy_ing", desc: "Cerusa. Olověné pláty zavěšené nad destilovaným octem v teplém koňském hnoji — po týdnech se seškrábne zářivě bílý prášek.", desc_en: "Cerusa. Lead plates suspended over distilled vinegar in warm horse dung — after weeks a brilliant white powder is scraped off." },
    "minium": { name: "Suřík", name_en: "Red Lead", icon: "🔴", type: "alchemy_ing", desc: "Minium. Olověná běloba dlouze pražená, dokud nezčervená. Barva rubrik a iniciál — odtud slovo \"miniatura\".", desc_en: "Minium. Lead white roasted at length until it reddens. The colour of rubrics and initials — the origin of the word \"miniature\"." },
    "lithargyrum": { name: "Klejt", name_en: "Litharge", icon: "🟡", type: "alchemy_ing", desc: "Lithargyrum. Žlutý oxid olovnatý z přímého tavení olova na vzduchu. Sušidlo do fermeže, glazura do skla.", desc_en: "Lithargyrum. Yellow lead oxide from directly smelting lead in air. A drier for varnish, a glaze for glass." },
    "calx_cupri": { name: "Žíhaná měď", name_en: "Calcined Copper", icon: "⚫", type: "alchemy_ing", desc: "Calx Cupri. Černý oxid měďnatý. Barví sklo do syta zelena až modra.", desc_en: "Calx Cupri. Black copper oxide. Colours glass a deep green to blue." },
    "cinere_stanni": { name: "Cínový popel", name_en: "Tin Ash", icon: "⚪", type: "alchemy_ing", desc: "Cinere Stanni. Oxid cíničitý ze žíhaného cínu. Základ bílé neprůhledné glazury a mozaikového zlata.", desc_en: "Cinere Stanni. Stannic oxide from calcined tin. The base for opaque white glaze and mosaic gold." },

    // ── Wave 0 (media-materia-konsolidace.md §7) — Theophilus/Cennini strom,
    // vlna bez nových surovin (jen existující ingredience, nové combo výstupy).
    "ochra_flava": { name: "Zušlechtěný okr", name_en: "Refined Ochre", icon: "🟡", type: "alchemy_ing", desc: "Ochra Flava Preparata. Surový okr donekonečna plavený ve vodě, dokud nezůstane jen čisté jemné zrno.", desc_en: "Ochra Flava Preparata. Raw ochre washed endlessly in water until only the fine pure grain remains." },
    "succus_viridis": { name: "Šťávová zeleň", name_en: "Sap Green", icon: "🟢", type: "alchemy_ing", desc: "Succus Viridis. Bobule svařené s kamencem a arabskou gumou. Průzračná lazurovací zeleň na listoví.", desc_en: "Succus Viridis. Berries boiled with alum and gum arabic. A transparent glaze-green for foliage." },
    "lacca_rosarum": { name: "Růžový lak", name_en: "Rose Lake", icon: "🌸", type: "alchemy_ing", desc: "Lacca Rosarum. Okvětní lístky vysrážené kamencem na křídu. Lazurovací růžová pro rubínový efekt v miniaturách.", desc_en: "Lacca Rosarum. Rose petals precipitated with alum onto chalk. A glaze-pink for a ruby effect in miniatures." },
    "lazulium_mellitum": { name: "Medový ultramarín", name_en: "Honeyed Ultramarine", icon: "💙", type: "alchemy_ing", desc: "Lazulium Mellitum. Lapis lazuli hnětený v medu a gumě, aby se vytáhlo jen čisté modré zrno bez šedých nečistot.", desc_en: "Lazulium Mellitum. Lapis lazuli kneaded in honey and gum to draw out only the pure blue grain, free of grey impurities." },
    "mastix_liquida": { name: "Tekutý tmel", name_en: "Liquid Mastic", icon: "🫙", type: "alchemy_ing", desc: "Mastix Liquida. Univerzální voděodolné lepidlo knihařů — zpevňuje hřbety, těsní sudy.", desc_en: "Mastix Liquida. A bookbinder's universal waterproof glue — reinforces spines, seals barrels." },
    "lazur_teutonicum": { name: "Německá modř", name_en: "German Azure", icon: "💠", type: "alchemy_ing", desc: "Lazur Teutonicum. Azuritová modř z vitriolu a vaječné tempery. Dostupná klášterní náhrada za drahý lapis lazuli.", desc_en: "Lazur Teutonicum. An azurite blue from vitriol and egg tempera. An affordable monastic substitute for costly lapis lazuli." },
    "atramentum_siccum": { name: "Inkoustový koláč", name_en: "Dried Ink Cake", icon: "⬛", type: "alchemy_ing", desc: "Atramentum Siccum. Ferrogalický inkoust odpařený do tuhé hmoty. Rozředí se kapkou vína — pro cestující mnichy a holubí poštu.", desc_en: "Atramentum Siccum. Iron-gall ink evaporated to a solid cake. Thinned with a drop of wine — for travelling monks and pigeon post." },
    "sinopia_tosta": { name: "Žíhaná sinopia", name_en: "Roasted Sinopia", icon: "🟤", type: "alchemy_ing", desc: "Sinopia Tosta. Žlutý okr žíhaný v Athanoru, dokud neztratí vázanou vodu a nezčervená. Teplý podklad pro stínování tváří.", desc_en: "Sinopia Tosta. Yellow ochre roasted in the Athanor until it loses its bound water and reddens. A warm underpaint for shading faces." },
    "verdigris": { name: "Měděnka", name_en: "Verdigris", icon: "🟢", type: "alchemy_ing", desc: "Zelená patina mědi. Časem koroduje pergamen.", desc_en: "Green copper patina. Corrodes vellum over time." },
    "egg_tempera": { name: "Vaječná tempera", name_en: "Egg Tempera", icon: "🥚", type: "alchemy_ing", desc: "Žloutek s vínem. Nejstarší pojivo pigmentů.", desc_en: "Egg yolk with wine. The oldest pigment binder." },
    "chamomile": { name: "Heřmánek", name_en: "Chamomile", icon: "🌼", type: "herb", desc: "Matka bylinek. Hildegarda ho doporučovala.", desc_en: "Mother of herbs. Hildegard recommended it." },
    "st_johns_wort": { name: "Třezalka", name_en: "St. John's Wort", icon: "🌻", type: "herb", desc: "Bylina sv. Jana. Léčí rány i melancholii.", desc_en: "Herb of St. John. Heals wounds and melancholy." },
    "thyme": { name: "Tymián", name_en: "Thyme", icon: "🌿", type: "herb", desc: "Odvání Varroa z úlů. Hildegarda jej znala dobře.", desc_en: "Drives Varroa from hives. Hildegard knew it well." },
    "sage": { name: "Šalvěj", name_en: "Sage", icon: "🌿", type: "herb", desc: "Salvia officinalis. Kapitulář Karla Velikého. Čistí vzduch i mysl.", desc_en: "Salvia officinalis. Capitulare de villis. Purifies air and mind." },
    "fennel": { name: "Fenykl", name_en: "Fennel", icon: "🌿", type: "herb", desc: "Foeniculum vulgare. Dobrý na trávení, Hildegarda jej doporučovala.", desc_en: "Foeniculum vulgare. Good for digestion, praised by Hildegard." },
    "wormwood": { name: "Pelyněk", name_en: "Wormwood", icon: "🌿", type: "herb", desc: "Artemisia absinthium. Bylina všech bylin. Chrání před morem.", desc_en: "Artemisia absinthium. Herb of herbs. Wards off pestilence." },
    "comfrey": { name: "Kostival lékařský", name_en: "Comfrey", icon: "🌿", type: "herb", desc: "Symphytum officinale. Základ středověké ortopedie — obklady na bolavé klouby a kosti.", desc_en: "Symphytum officinale. The foundation of medieval orthopaedics — poultices for aching joints and bones." },
    "juniper": { name: "Jalovec", name_en: "Juniper", icon: "🌲", type: "herb", desc: "Juniperus communis. Silně prohřívací silice, oblíbená na revma.", desc_en: "Juniperus communis. Strongly warming resin, favoured against rheumatism." },
    "rosemary": { name: "Rozmarýn", name_en: "Rosemary", icon: "🌿", type: "herb", desc: "Rosmarinus officinalis. Prohřívá a stimuluje krevní oběh ve ztuhlé ruce.", desc_en: "Rosmarinus officinalis. Warms and stimulates blood flow in a stiff hand." },
    "hyssop": { name: "Yzop", name_en: "Hyssop", icon: "🌿", type: "herb", desc: "Hyssopus officinalis. Benediktinský klášter bez yzopu? Nemyslitelné.", desc_en: "Hyssopus officinalis. A Benedictine monastery without hyssop? Unthinkable." },
    "yarrow": { name: "Řebříček", name_en: "Yarrow", icon: "🌿", type: "herb", desc: "Achillea millefolium. Hojí rány. Místní česká bylina, v Čechách od nepaměti.", desc_en: "Achillea millefolium. Heals wounds. A native Czech herb, grown here since time immemorial." },
    "plantain": { name: "Jitrocel", name_en: "Plantain", icon: "🌿", type: "herb", desc: "Plantago major. Poutníkova bylina — roste u každé cesty, hojí rány a odvary tiší kašel.", desc_en: "Plantago major. The wayfarer's herb — grows by every road, heals wounds, and its brew soothes coughs." },
    "beeswax": { name: "Včelí vosk", name_en: "Beeswax", icon: "🕯️", type: "mat", desc: "Z klášterního úlu. Pojivo masti i pečetidlo.", desc_en: "From the monastery hive. Salve binder and sealant." },
    "propolis": { name: "Propolis", name_en: "Propolis", icon: "🟤", type: "mat", desc: "Pryskyřičná tmel, kterým včely utěsňují úl. Vzácnější než pyl, sbírá se jen občas.", desc_en: "The resinous cement bees use to seal the hive. Rarer than pollen, only occasionally gathered." },
    "propolis_tinktura": { name: "Propolisová tinktura", name_en: "Propolis Tincture", icon: "🧪", type: "mat", desc: "Propolis louhovaný ve vinném lihu. Klášterní lék proti ranám a bolesti v krku.", desc_en: "Propolis steeped in grain spirit. A monastery remedy for wounds and sore throats." },
    "propolis_tinktura_vyzrala": { name: "Vyzrálá propolisová tinktura", name_en: "Aged Propolis Tincture", icon: "🏺", type: "mat", desc: "Tinktura uložená k dlouhému zrání. Síla se zesílila, léčivý účinek je hlubší a trvalejší.", desc_en: "Tincture set to age long. Its strength has deepened — a healing effect both stronger and more lasting." },
    "mandrake": { name: "Mandragora", name_en: "Mandrake", icon: "🌿", type: "special", desc: "Mandragora officinarum. Kapitulář Karla Velikého. Kořen ve tvaru člověka — křičí při vytrhnutí. Pro silné lektvary.", desc_en: "Mandragora officinarum. Root shaped like a man — screams when pulled. For powerful potions." },
    "belladonna": { name: "Rulík zlomocný", name_en: "Belladonna", icon: "🫐", type: "special", desc: "Atropa belladonna. Jed i lék. Lékárníci jej míchali v malých dávkách. Nebezpečná rostlina.", desc_en: "Atropa belladonna. Poison and medicine alike. Apothecaries used it in small doses. Dangerous." },
    "poppy": { name: "Mák", name_en: "Poppy", icon: "🌸", type: "special", desc: "Papaver somniferum. Hildegarda znala jeho moc. Tišil bolest, navozoval spánek. Cenný i drahý.", desc_en: "Papaver somniferum. Hildegard knew its power. Eased pain, brought sleep. Valued and costly." },
    "nettle": { name: "Kopřiva", name_en: "Nettle", icon: "🌿", type: "special", desc: "Urtica dioica. Vlákno, jídlo i lék. Klášterní zahrady ji pěstovaly záměrně — na látku i odvar.", desc_en: "Urtica dioica. Fibre, food and medicine. Monastery gardens cultivated it deliberately." },
    "cannabis": { name: "Konopí seté", name_en: "Hemp", icon: "🌿", type: "mat", desc: "Cannabis sativa. Pěstováno v Čechách od středověku — vlákno na lana a plátno, semena na olej i jídlo.", desc_en: "Cannabis sativa. Cultivated in Bohemia since the Middle Ages — fibre for rope and cloth, seeds for oil and food." },
    "hemp_fiber": { name: "Konopné vlákno", name_en: "Hemp Fibre", icon: "🧵", type: "mat", desc: "Stonky rosené, lámané a mykané — hrubší a pevnější než len.", desc_en: "Stalks retted, broken and hackled — coarser and stronger than flax." },
    "hemp_canvas": { name: "Plachtovina", name_en: "Hemp Canvas", icon: "🧵", type: "lore", desc: "Hrubá konopná tkanina. Na pytle, ne na oděv.", desc_en: "Coarse hemp fabric. For sacking, not clothing." },
    "sack": { name: "Pytel", name_en: "Sack", icon: "🧺", type: "tool", desc: "Konopný pytel na zrní a mouku. +15 jednotek skladové kapacity v Inventariu.", desc_en: "Hemp sack for grain and flour. +15 units of storage capacity in the Inventarium." },

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
    "hildegard_tisane": { name: "Hildegardin odvar", name_en: "Hildegard's Tisane", icon: "🍵", type: "food", desc: "Heřmánek a tymián slazené medem, podle receptu Hildegardy z Bingenu. Účinnější než prostý bylinný čaj.", desc_en: "Chamomile and thyme sweetened with honey, after Hildegard of Bingen's recipe. More potent than plain herbal tea." },
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
    "nahrobek": { name: "Náhrobek", name_en: "Gravestone", icon: "🪦", type: "mat", desc: "Kamenná deska se jménem. Dílo kameníka pro hrob na hřbitově.", desc_en: "A stone slab bearing a name. The stonemason's work for a grave in the cemetery." },
    "chrlic": { name: "Chrlič", name_en: "Gargoyle", icon: "🗿", type: "mat", desc: "Kamenná obluda odvádějící dešťovou vodu z okapu. Zdobí i chrání chrám.", desc_en: "A stone beast channeling rainwater from the eaves. It adorns and guards the church." },

    // ── KAMENNÉ NÁSTROJE (tech_horticulture + tech_carpentaria) ────────────────
    "stone_axe": { maxUses: 10, name: "Kamenná sekerka", name_en: "Stone Axe", icon: "🪓", type: "tool", tier: "stone", desc: "Kamenné ostří na dřevěné násadě. Odemkne těžbu dřeva.", desc_en: "Stone blade on a wooden haft. Unlocks wood harvesting." },
    "stone_spade": { maxUses: 10, name: "Kamenný rýč", name_en: "Stone Spade", icon: "⛏️", type: "tool", tier: "stone", desc: "Plochý kámen na násadě. Kopání červů a přesazování.", desc_en: "Flat stone on a haft. Digging worms and transplanting." },
    "stone_scythe": { maxUses: 10, name: "Kamenná kosa", name_en: "Stone Scythe", icon: "⚔️", type: "tool", tier: "stone", desc: "Kamenné ostří. Sečení trávy na seno.", desc_en: "Stone blade. Cuts grass for hay." },
    "stone_sickle": { maxUses: 10, name: "Kamenný srp", name_en: "Stone Sickle", icon: "🌾", type: "tool", tier: "stone", desc: "Malé kamenné ostří. Žeň bylin a obilí.", desc_en: "Small stone blade. Harvesting herbs and grain." },
    "stone_flail": { maxUses: 10, name: "Kamenný cep", name_en: "Stone Flail", icon: "🪵", type: "tool", tier: "stone", desc: "Dřevěný cep s kamenným závažím. Mlácení obilí.", desc_en: "Wooden flail with stone weight. Threshing grain." },
    "wooden_flail": { maxUses: 15, name: "Dřevěný cep", name_en: "Wooden Flail", icon: "🪵", type: "tool", tier: "wood", desc: "Prostý dřevěný cep. Nejjednodušší mlácení obilí.", desc_en: "Simple wooden flail. The most basic threshing tool." },
    "stone_pickaxe": { maxUses: 150, name: "Kamenný krumpáč", name_en: "Stone Pickaxe", icon: "⛏️", type: "tool", tier: "stone", desc: "Kamenná hlava na násadě. Těžba rudy a bourání kamene.", desc_en: "Stone head on a haft. Ore mining and stone breaking." },
    "palice_kamenna": { maxUses: 100, name: "Kamenná palice", name_en: "Stone Mallet", icon: "🔨", type: "tool", tier: "stone", desc: "Těžké kladivo z opracovaného kamene. Láme vápenec v lomu.", desc_en: "A heavy mallet of worked stone. Breaks limestone in the quarry." },
    "stone_shovel": { name: "Kamenná lopata", name_en: "Stone Shovel", icon: "🪛", type: "tool", tier: "stone", desc: "Plochý kámen jako lopata. Přesun půdy a hnoje.", desc_en: "Flat stone as shovel. Moving soil and manure." },
    "stone_saw": { maxUses: 10, name: "Kamenná pila", name_en: "Stone Saw", icon: "🪚", type: "tool", tier: "stone", desc: "Pila z křemenných úštěpků. Hrubé opracování dřeva.", desc_en: "Saw of flint chips. Rough wood working." },

    // ── DŘEVĚNÉ NÁSTROJE (jen jedna verze) ──────────────────────────────────
    "bucket": { name: "Vědro", name_en: "Bucket", icon: "🪣", type: "tool", desc: "Dřevěné vědro. Přenáší vodu ze studny.", desc_en: "Wooden bucket. Carries water from the well." },
    "watering_can": { name: "Konev", name_en: "Watering Can", icon: "🚿", type: "tool", desc: "Konev na zalévání zahrady.", desc_en: "Watering can for the garden." },
    "barrel_tool": { name: "Sud", name_en: "Barrel", icon: "🛢️", type: "tool", desc: "Dřevěný sud. Skladování piva, vína a vody.", desc_en: "Wooden barrel. Storage for ale, wine and water." },
    "bedna": { name: "Bedna", name_en: "Crate", icon: "🗃️", type: "tool", desc: "Dřevěná bedna. +30 jednotek skladové kapacity v Inventariu.", desc_en: "Wooden crate. +30 units of storage capacity in the Inventarium." },
    "storage_container": { name: "Skladovací kontejner", name_en: "Storage Container", icon: "📦", type: "tool", desc: "Sud přestavěný na kontejner. +50 jednotek skladové kapacity v Inventariu.", desc_en: "A barrel rebuilt into a container. +50 units of storage capacity in the Inventarium." },

    // ── KOVOVÉ NÁSTROJE (tech_kovarina — po kovárně) ─────────────────────────
    "iron_axe": { maxUses: 20, maxStack: 1, name: "Železná sekerka", name_en: "Iron Axe", icon: "🪓", type: "tool", tier: "iron", desc: "Železné ostří. Rychlejší těžba dřeva, více kulatiny.", desc_en: "Iron blade. Faster wood harvesting, more logs." },
    "iron_spade": { maxUses: 20, maxStack: 1, name: "Železný rýč", name_en: "Iron Spade", icon: "⛏️", type: "tool", tier: "iron", desc: "Železný rýč. Více červů, hlubší kopání.", desc_en: "Iron spade. More worms, deeper digging." },
    "iron_scythe": { maxUses: 20, maxStack: 1, name: "Železná kosa", name_en: "Iron Scythe", icon: "⚔️", type: "tool", tier: "iron", desc: "Ostrá železná kosa. Více trávy za méně akcí.", desc_en: "Sharp iron scythe. More grass per action." },
    "iron_sickle": { maxUses: 20, maxStack: 1, name: "Železný srp", name_en: "Iron Sickle", icon: "🌾", type: "tool", tier: "iron", desc: "Železný srp. Přesná žeň obilí a bylin.", desc_en: "Iron sickle. Precise harvesting of grain and herbs." },
    "iron_flail": { maxUses: 20, maxStack: 1, name: "Železný cep", name_en: "Iron Flail", icon: "🪵", type: "tool", tier: "iron", desc: "Železné závaží. Efektivnější mlácení obilí.", desc_en: "Iron weight. More efficient threshing." },
    "iron_shovel": { maxUses: 20, maxStack: 1, name: "Železná lopata", name_en: "Iron Shovel", icon: "🪛", type: "tool", tier: "iron", desc: "Železná lopata. Rychlý přesun půdy a hnoje.", desc_en: "Iron shovel. Fast movement of soil and manure." },
    "iron_saw": { maxUses: 20, maxStack: 1, name: "Železná pila", name_en: "Iron Saw", icon: "🪚", type: "tool", tier: "iron", desc: "Železná pila. Přesné zpracování kulatiny na fošny.", desc_en: "Iron saw. Precise processing of logs into planks." },
    "iron_pickaxe": { maxUses: 700, maxStack: 1, name: "Železný krumpáč", name_en: "Iron Pickaxe", icon: "⛏️", type: "tool", tier: "iron", desc: "Těžká železná hlava. Efektivní těžba rudy a bourání.", desc_en: "Heavy iron head. Efficient ore mining and demolition." },
    "palice_zelezna": { maxUses: 700, maxStack: 1, name: "Železná palice", name_en: "Iron Mallet", icon: "🔨", type: "tool", tier: "iron", desc: "Kované kladivo s železnou hlavou. Nejlepší nástroj na lámání vápence.", desc_en: "A forged mallet with an iron head. The best tool for breaking limestone." },
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
    // KNIHAŘSTVÍ — Plný řetězec vazby (quires → sewn_block → unfitted_codex)
    // ═══════════════════════════════════════════════════════════════════════════
    "linen_thread": { name: "Lněná nit", name_en: "Linen Thread", icon: "🧵", type: "mat", desc: "Spředená lněná vlákna. Drží složky sešité na vazech.", desc_en: "Spun linen fibres. Holds the quires sewn onto the cords." },
    "linen_cloth": { name: "Plátno", name_en: "Linen Cloth", icon: "🧵", type: "lore", desc: "Tkané lněné plátno. Opotřebené se stává hadry pro papír.", desc_en: "Woven linen cloth. When worn, it becomes rags for paper." },
    "leather_cords": { name: "Kožené vazy", name_en: "Leather Cords", icon: "🪢", type: "mat", desc: "Tenké řemínky, napnuté na vazadlu. Základ šití knižního bloku.", desc_en: "Thin cords, stretched on the sewing frame. The basis of stitching the book block." },
    "metal_clasps": { name: "Kovové spony", name_en: "Metal Clasps", icon: "🔩", type: "mat", desc: "Zaklapnou desky k sobě — brání kroucení pergamenu vlhkem.", desc_en: "Clasp the boards shut — prevent the vellum from warping in damp." },
    "metal_bosses": { name: "Kovové puklice", name_en: "Metal Bosses", icon: "🔘", type: "mat", desc: "Rohové a středové hrboly. Chrání kožený potah, když kniha leží na pultu.", desc_en: "Corner and centre bosses. Protect the leather cover when the book lies on a lectern." },
    "quires": { name: "Složky", name_en: "Quires", icon: "📑", type: "mat", desc: "Popsaný pergamen přehnutý a vložený do sebe — kvaterny, základ knižního bloku.", desc_en: "Written vellum folded and nested — quaternions, the basis of the book block." },
    "sewn_block": { name: "Ušitý blok", name_en: "Sewn Block", icon: "📗", type: "mat", desc: "Složky sešité na kožených vazech lněnou nití. Ještě bez desek.", desc_en: "Quires sewn onto leather cords with linen thread. Still without boards." },
    "unfitted_codex": { name: "Neokovaná kniha", name_en: "Unfitted Codex", icon: "📕", type: "mat", desc: "Ušitý blok mezi dřevěnými deskami, potažený kůží. Čeká na kování.", desc_en: "Sewn block between wooden boards, covered in leather. Awaiting its fittings." },
    // ═══════════════════════════════════════════════════════════════════════════
    // DVŮR — Nakupitelná zvířata (Trh)
    // ═══════════════════════════════════════════════════════════════════════════
    "hen_white": { name: "Slepice bílá", name_en: "White Hen", icon: "🐔", type: "animal", desc: "Bílá slepice. Nosí vejce každých 8h.", desc_en: "White hen. Lays eggs every 8h." },
    "hen_black": { name: "Slepice černá", name_en: "Black Hen", icon: "🐓", type: "animal", desc: "Černá slepice. Nosí vejce každých 8h.", desc_en: "Black hen. Lays eggs every 8h." },
    "hen_colored": { name: "Slepice pestrá", name_en: "Coloured Hen", icon: "🦚", type: "animal", desc: "Pestrá slepice. Dává více peří.", desc_en: "Colourful hen. Produces more feathers." },
    "rooster": { name: "Kohout", name_en: "Rooster", icon: "🐓", type: "animal", desc: "Kohout zvyšuje snůšku vajec o 20%.", desc_en: "Rooster increases egg yield by 20%." },
    "sheep": { name: "Ovce", name_en: "Sheep", icon: "🐑", type: "animal", desc: "Ovce produkuje vlnu, mléko a kůži.", desc_en: "Sheep produces wool, milk and hide." },

    // ── Produkty zvířat ────────────────────────────────────────────────────
    "egg": { name: "Vejce", name_en: "Egg", icon: "🥚", type: "food", desc: "Čerstvé vejce ze slepice. Jídlo i pigment.", desc_en: "Fresh egg from the hen. Food and pigment." },
    "milk": { name: "Mléko", name_en: "Milk", icon: "🥛", type: "mat", desc: "Čerstvé mléko od ovce.", desc_en: "Fresh milk from the sheep." },
    "wool": { name: "Vlna", name_en: "Wool", icon: "🧶", type: "mat", desc: "Střižená vlna. Na přízi, tkaní i šití.", desc_en: "Shorn wool. For spinning, weaving and sewing." },
    "wool_thread": { name: "Vlněná příze", name_en: "Wool Yarn", icon: "🧶", type: "mat", desc: "Spředená vlna. Na tkaní soukna.", desc_en: "Spun wool. For weaving woolen cloth." },
    "wool_cloth": { name: "Soukno", name_en: "Wool Cloth", icon: "🧶", type: "lore", desc: "Tkané vlněné sukno. Teplejší a hrubší než plátno.", desc_en: "Woven wool cloth. Warmer and coarser than linen." },
    "fulled_wool_cloth": { name: "Zvalchované soukno", name_en: "Fulled Wool Cloth", icon: "🧶", type: "lore", desc: "Zplstěno louhem místo odstáté moči — hustší, teplejší, dostupné každému klášteru.", desc_en: "Fulled with lye instead of stale urine — denser, warmer, available to every monastery." },
    "kutna": { name: "Kutna", name_en: "Habit", icon: "👘", type: "tool", desc: "Mnišský hábit dle Řehole. Šije Vestiarius z hotového sukna.", desc_en: "A monastic habit per the Rule. Sewn by the Vestiarius from finished cloth." },
    "raw_hide": { name: "Surová kůže", name_en: "Raw Hide", icon: "🐑", type: "mat", desc: "Neupravená zvířecí kůže. Nutno vyčinit.", desc_en: "Untreated animal hide. Must be cured." },
    "feather_hen": { name: "Peří", name_en: "Hen Feather", icon: "🪶", type: "mat", desc: "Husté peří. Na polštáře i brky.", desc_en: "Thick feathers. For pillows and quills." },

    // ── Produkty zahrady / včelína ─────────────────────────────────────────
    "pollen": { name: "Pyl", name_en: "Pollen", icon: "🌼", type: "mat", desc: "Včelí pyl. Léčivý a vzácný.", desc_en: "Bee pollen. Medicinal and rare." },
    "linden_blossom": { name: "Lipový květ", name_en: "Linden Blossom", icon: "🌸", type: "mat", desc: "Sušený lipový květ. Do čaje i léčiv.", desc_en: "Dried linden blossom. For tea and remedies." },
    "apple": { name: "Jablko", name_en: "Apple", icon: "🍎", type: "food_raw", desc: "Ze sadu. Skladuje se do jara.", desc_en: "From the orchard. Keeps until spring." },
    "pear": { name: "Hruška", name_en: "Pear", icon: "🍐", type: "food_raw", desc: "Ze sadu. Šťavnatá, ale rychle měkne.", desc_en: "From the orchard. Juicy but softens quickly." },
    "plum": { name: "Švestka", name_en: "Plum", icon: "🫐", type: "food_raw", desc: "Ze sadu. Na povidla i pálenku.", desc_en: "From the orchard. For jam and brandy." },
    "cherry": { name: "Třešeň", name_en: "Cherry", icon: "🍒", type: "food_raw", desc: "Ze sadu. Sladká letní úroda.", desc_en: "From the orchard. Sweet summer harvest." },
    "walnut": { name: "Vlašský ořech", name_en: "Walnut", icon: "🥜", type: "food_raw", desc: "Ze sadu. Vydrží celou zimu ve skořápce.", desc_en: "From the orchard. Keeps all winter in its shell." },
    "mulberry": { name: "Moruše", name_en: "Mulberry", icon: "🫐", type: "food_raw", desc: "Ze sadu. Barví prsty i pergamen.", desc_en: "From the orchard. Stains fingers and parchment alike." },
    "quince": { name: "Kdoule", name_en: "Quince", icon: "🍋", type: "food_raw", desc: "Ze sadu. Tvrdá, voňavá, na marmeládu.", desc_en: "From the orchard. Hard, fragrant, for marmalade." },
    "sorb": { name: "Oskeruše", name_en: "Sorb Apple", icon: "🟤", type: "food_raw", desc: "Ze sadu. Trpká, dozrává až po prvních mrazech.", desc_en: "From the orchard. Tart, ripens only after first frost." },
    "rowan": { name: "Jeřabina", name_en: "Rowan Berry", icon: "🔴", type: "food_raw", desc: "Ze sadu. Hořká syrová, sladší po zpracování.", desc_en: "From the orchard. Bitter raw, sweeter when processed." },
    "linden_fruit": { name: "Lipový plod", name_en: "Linden Fruit", icon: "🌸", type: "food_raw", desc: "Ze sadu. Drobná nažka lípy, spíš léčivá než k jídlu.", desc_en: "From the orchard. A tiny linden nutlet, more medicinal than edible." },
    "grass": { name: "Tráva", name_en: "Grass", icon: "🌿", type: "mat", desc: "Posečená čerstvá tráva. Suší se na seno.", desc_en: "Cut fresh grass. Dried to make hay." },
    "queen_bee": { name: "Včelí matka", name_en: "Queen Bee", icon: "🐝", type: "animal", desc: "Včelí matka. Nutná pro stavbu úlu.", desc_en: "Queen bee. Required to establish a hive." },
    "veteran_queen": { name: "Vysloužilá matka", name_en: "Veteran Queen", icon: "👑", type: "animal", desc: "Stará matka, která přežila roj i zimu. Včelaři takové platí zlatem — z jejího plodu se prý dědí síla i zimovatelnost.", desc_en: "An old queen who survived both swarming and winter. Beekeepers pay gold for one — her brood is said to inherit strength and hardiness alike." },

    // ═══════════════════════════════════════════════════════════════════════════
    // DVŮR — Gallinarium & Ovile mláďata + maso (v8.x)
    // ═══════════════════════════════════════════════════════════════════════════
    "chick": { name: "Kuře", name_en: "Chick", icon: "🐣", type: "animal", desc: "Mladé kuře. Dorůstá v kurníku.", desc_en: "Young chick. Growing in the henhouse." },
    "lamb": { name: "Jehně", name_en: "Lamb", icon: "🐑", type: "animal", desc: "Mladé jehně. Dorůstá v chlévu.", desc_en: "Young lamb. Growing in the sheepfold." },
    "chicken_meat": { name: "Kuřecí maso", name_en: "Chicken Meat", icon: "🍗", type: "food_raw", hunger: 5, desc: "Čerstvé kuřecí. Uvař před jídlem.", desc_en: "Fresh chicken. Cook before eating." },
    "mutton": { name: "Skopové maso", name_en: "Mutton", icon: "🥩", type: "food_raw", hunger: 7, desc: "Skopové z chléva. Uvař před jídlem.", desc_en: "Mutton from the fold. Cook before eating." },
    "lamb_hide": { name: "Jehněčí kůže", name_en: "Lamb Hide", icon: "🦌", type: "mat", desc: "Jemná kůže jehněte. Kvalitnější pergamen.", desc_en: "Fine lamb skin. Superior vellum quality." },
    "premium_soaked_hide": { name: "Prémiová namáčená kůže", name_en: "Premium Soaked Hide", icon: "🦌", type: "mat", desc: "Jehněčí či kozí kůže loužená výhradně ve vápně — jemnější než louh.", desc_en: "Lamb or goat hide soaked exclusively in lime — gentler than lye." },
    "premium_stretched_hide": { name: "Prémiová napnutá kůže", name_en: "Premium Stretched Hide", icon: "🦌", type: "mat", desc: "V rámu, sušená. Základ nejjemnějšího pergamenu.", desc_en: "Stretched on a frame to dry. The base of the finest vellum." },
    "premium_vellum": { name: "Prémiový pergamen", name_en: "Premium Vellum", icon: "📜", type: "lore", desc: "Z jehněte či kozy. Tenký, pevný, málo mastný — italský standard.", desc_en: "From lamb or goat. Thin, strong, little grease — the Italian standard." },

    // ═══════════════════════════════════════════════════════════════════════════
    // PISCINA (Rybník) — v8.x
    // ═══════════════════════════════════════════════════════════════════════════
    "fry": { name: "Plůdek (potěr)", name_en: "Fish Fry", icon: "🫧", type: "mat", desc: "Malý rybí potěr. Vyrůstá v rybníce.", desc_en: "Tiny fish fry. Grows in the pond." },
    "carp_young": { name: "Kapr (nedospělý)", name_en: "Young Carp", icon: "🐟", type: "mat", desc: "Nedospělý kapr z výtažníku. Potřebuje čas.", desc_en: "Young carp from the rearing pond. Needs time." },
    "carp": { name: "Kapr tržní", name_en: "Market Carp", icon: "🐠", type: "food_raw", desc: "Dospělý kapr. Prodej nebo vaření.", desc_en: "Adult carp. For sale or cooking." },
    "stika": { name: "Štika", name_en: "Pike", icon: "🐊", type: "food_raw", desc: "Dravá ryba. Nasazuje se do rybníka jako přirozená kontrola hejna.", desc_en: "A predatory fish. Stocked in the pond as a natural check on the shoal." },
    "kapr_sadky_fresh": { name: "Kapr v sádkách (čerstvý)", name_en: "Carp in the Holding Tank (Fresh)", icon: "🐠", type: "food_raw", desc: "Právě vylovený kapr, ještě s bahenní pachutí. Za pár dní se pročistí.", desc_en: "Just-caught carp, still with a muddy taste. It will purify in a few days." },
    "kapr_sadky_purified": { name: "Kapr v sádkách (pročištěný)", name_en: "Carp in the Holding Tank (Purified)", icon: "🐠", type: "food_raw", desc: "Kapr po pobytu v sádkách. Bez bahenní pachuti, vyšší cena.", desc_en: "Carp after time in the holding tank. No muddy taste, higher value." },
    "stika_sadky_fresh": { name: "Štika v sádkách (čerstvá)", name_en: "Pike in the Holding Tank (Fresh)", icon: "🐊", type: "food_raw", desc: "Právě ulovená štika, ještě s bahenní pachutí. Za pár dní se pročistí.", desc_en: "Just-caught pike, still with a muddy taste. It will purify in a few days." },
    "vyza_sadky_fresh": { name: "Vyza v sádkách", name_en: "Sturgeon in the Holding Tank", icon: "🐋", type: "food_raw", desc: "Ulovená při jarním tahu, drží se živá v sádce jako čerstvá zásoba — pro nečekaného hosta, dokud nepřijde její čas.", desc_en: "Caught during the spring run, kept alive in the holding tank as a fresh reserve — for an unexpected guest, until its time comes." },
    "vyza_maso": { name: "Vyzí maso", name_en: "Sturgeon Meat", icon: "🐋", type: "food", hunger: 20, desc: "Maso obří tažné ryby. Sytí 20h — hodovní jídlo, ne všední.", desc_en: "Meat of the great migratory fish. Fills for 20h — a feast dish, not everyday fare." },
    "vyza_jikry": { name: "Vyzí jikry", name_en: "Sturgeon Roe", icon: "⚫", type: "food", hunger: 4, desc: "Nasolený kaviár. Teologicky legální i v nejpřísnějším postu — luxus na opatův stůl.", desc_en: "Salted caviar. Theologically permitted even during the strictest fast — a luxury for the abbot's table." },
    "klih": { name: "Vyzí klih", name_en: "Isinglass", icon: "🧊", type: "mat", desc: "Sušený měchýřový klih. Nejčistší pojivo — pro nejdražší knižní vazby, iluminátorské barvy (nemění odstín zlaté a modré) a čiření piva a vína.", desc_en: "Dried swim-bladder glue. The purest binder — for the finest bookbindings, illuminator's pigments (doesn't shift the tone of gold and blue), and fining beer and wine." },
    "stika_sadky_purified": { name: "Štika v sádkách (pročištěná)", name_en: "Pike in the Holding Tank (Purified)", icon: "🐊", type: "food_raw", desc: "Štika po pobytu v sádkách. Bez bahenní pachuti, vyšší cena.", desc_en: "Pike after time in the holding tank. No muddy taste, higher value." },
    "pstruh": { name: "Pstruh", name_en: "Trout", icon: "🐡", type: "food_raw", desc: "Ryba čisté vody. Vyžaduje dobrou jakost rybníka.", desc_en: "A fish of clean water. Requires good pond quality." },
    "uhor": { name: "Úhoř", name_en: "Eel", icon: "🐍", type: "food_raw", desc: "Tučná ryba, cenná na trhu i na stole.", desc_en: "A fatty fish, valued at market and at table." },

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
    "feed_meal": { name: "Šrot", name_en: "Feed Meal", icon: "🟤", type: "mat", desc: "Drcené zrno z pole. Vydatné krmivo pro dobytek.", desc_en: "Crushed grain from the fields. Hearty feed for livestock." },
    "worms": { name: "Červi", name_en: "Worms", icon: "🪱", type: "mat", desc: "Žížaly ze zahrady. Krmivo pro kapry.", desc_en: "Earthworms from the garden. Feed for carp." },
    "acorns": { name: "Žaludy", name_en: "Acorns", icon: "🌰", type: "mat", desc: "Lesní plody z dubu. Krmivo pro prasata. Sbírají se na podzim.", desc_en: "Oak fruits from the forest. Pig fodder. Gathered in autumn." },
    "leaves": { name: "Listí", name_en: "Leaves", icon: "🍃", type: "mat", desc: "Čerstvé listí stromů. Oblíbená pochutina koz.", desc_en: "Fresh tree leaves. A favourite treat for goats." },
    "scraps": { name: "Zbytky", name_en: "Scraps", icon: "🍖", type: "mat", desc: "Kuchyňské zbytky. Prasata sní vše.", desc_en: "Kitchen scraps. Pigs eat everything." },
    "snare": { name: "Oko na drobnou zvěř", name_en: "Small Game Snare", icon: "🪤", type: "tool", desc: "Drátěné oko od Lovce. Na plchy, veverky a ptáky — velká zvěř patří pánům.", desc_en: "A wire snare from the Hunter. For dormice, squirrels and birds — big game belongs to the lords." },
    "caught_small_game": { name: "Ulovená drobná zvěř", name_en: "Caught Small Game", icon: "🐿️", type: "mat", desc: "Úlovek z oka. Prodej Lovci vcelku, nebo zpracuj nožem na maso, tuk a zbytky.", desc_en: "A snare catch. Sell whole to the Hunter, or dress it with a knife for meat, fat and scraps." },

    // ── VITREA: klášterní vybavení (MRD vitrea-equipment-reference.md) ──
    "wooden_bowl": { name: "Dřevěná miska", name_en: "Wooden Bowl", icon: "🥣", type: "tool", desc: "Řezaná z fošny. Nerozbitná. Základ klášterního stolu — sklo je luxus.", desc_en: "Carved from a plank. Unbreakable. The staple of the monastic table — glass is a luxury." },
    "glass_stopper": { name: "Špunty", name_en: "Glass Stoppers", icon: "🔘", type: "tool", desc: "Skleněné zátky na láhve a baňky.", desc_en: "Glass stoppers for bottles and flasks." },
    "glass_flask": { name: "Baňka", name_en: "Glass Flask", icon: "⚗️", type: "tool", desc: "Laboratorní sklo pro Athanor. Křehké — praská žárem.", desc_en: "Laboratory glass for the Athanor. Fragile — heat cracks it." },
    "fly_trap_glass": { name: "Mucholapka", name_en: "Glass Fly Trap", icon: "🫙", type: "tool", desc: "Skleněná past na mouchy se sladkou návnadou. Doložený kus středověké domácnosti.", desc_en: "A glass fly trap with sweet bait. A documented piece of the medieval household." },
    "fly_trap_paper": { name: "Lepová mucholapka", name_en: "Paper Fly Trap", icon: "📃", type: "tool", desc: "Lepený papír s medovou návnadou. Prostší, ale funkční náhrada za sklo.", desc_en: "Glued paper with a honey lure. A simpler but functional substitute for glass." },
    "glass_goblet": { name: "Číše", name_en: "Glass Goblet", icon: "🥂", type: "tool", desc: "Skleněná číše na víno. Stolní nádobí lepších dnů.", desc_en: "A glass goblet for wine. Tableware for better days." },
    "glass_tankard": { name: "Půllitr", name_en: "Glass Tankard", icon: "🍺", type: "tool", desc: "Silnostěnný skleněný půllitr. Stolní nádobí.", desc_en: "A thick-walled glass tankard. Tableware." },
    "glass_jug": { name: "Džbán", name_en: "Glass Jug", icon: "🏺", type: "tool", desc: "Džbán na vodu i víno. Stolní nádobí.", desc_en: "A jug for water and wine. Tableware." },
    "glass_bowl": { name: "Mísa", name_en: "Glass Bowl", icon: "🫕", type: "tool", desc: "Skleněná mísa. Stolní nádobí.", desc_en: "A glass bowl. Tableware." },
    "glass_pitcher": { name: "Konvice", name_en: "Glass Pitcher", icon: "🫖", type: "tool", desc: "Konvice se skleněným tělem. Stolní nádobí.", desc_en: "A pitcher with a glass body. Tableware." },
    "glass_vase": { name: "Váza", name_en: "Glass Vase", icon: "🏵️", type: "tool", desc: "Ozdobná váza. Krása má v klášteře své místo.", desc_en: "A decorative vase. Beauty has its place in a monastery." },
    "window_roundel": { name: "Okenní terčík", name_en: "Window Roundel", icon: "🟡", type: "tool", desc: "Kulatý terčík do olova okenní výplně. Světlo dovnitř, zima ven.", desc_en: "A round pane set in lead. Light in, cold out." },
    "paternoster_beads": { name: "Páteříky", name_en: "Paternoster Beads", icon: "📿", type: "tool", desc: "Skleněné růžencové korálky. Sklářská pýcha českých hutí.", desc_en: "Glass rosary beads. The pride of Bohemian glassworks." },
    "beryllus": { name: "Beryllus", name_en: "Beryllus", icon: "🔍", type: "tool", desc: "Beryllus. Broušený úlomek horského křišťálu nebo berylu — dobovým učencům známý též jako lapis ad legendum, „kámen ke čtení\". Klade se vypuklou stranou vzhůru přímo na stránku a zvětšuje písmo pod sebou. Předchůdce brýlí o dobrých dvě stě let.", desc_en: "Beryllus. A ground fragment of rock crystal or beryl — known to period scholars also as the lapis ad legendum, the \"reading stone.\" Laid convex-side up directly on the page, it magnifies the script beneath. A forerunner of spectacles by some two hundred years." },
    "oculi": { name: "Oculi", name_en: "Oculi", icon: "👓", type: "tool", desc: "Oculi. Dvě broušené čočky z olovnatého skla ve dřevěném rámu, spojené nýtem přes nos. Následník staršího beryllu — místo na stránku se kladou přímo na obličej. Křehké: sklo časem praská, nebo se brýle jednoduše někde zatoulají.", desc_en: "Oculi. Two ground lenses of lead glass in a wooden frame, riveted across the bridge of the nose. Successor to the older beryllus — instead of resting on the page, they sit on the face. Fragile: the glass cracks in time, or the spectacles simply go missing." },
    "roucho_bile": { name: "Roucho — bílé", name_en: "Vestment — White", icon: "🤍", type: "tool", desc: "Pro vánoční a velikonoční dobu. Trvanlivé — nespotřebovává se.", desc_en: "For Christmastide and Eastertide. Durable — not consumed." },
    "roucho_fialove": { name: "Roucho — fialové", name_en: "Vestment — Purple", icon: "💜", type: "tool", desc: "Pro advent a půst. Trvanlivé — nespotřebovává se.", desc_en: "For Advent and Lent. Durable — not consumed." },
    "roucho_zelene": { name: "Roucho — zelené", name_en: "Vestment — Green", icon: "💚", type: "tool", desc: "Pro liturgické mezidobí. Trvanlivé — nespotřebovává se.", desc_en: "For Ordinary Time. Durable — not consumed." },
    "roucho_cervene": { name: "Roucho — červené", name_en: "Vestment — Red", icon: "❤️", type: "tool", desc: "Pro Letnice a svátky mučedníků. Trvanlivé — nespotřebovává se.", desc_en: "For Pentecost and martyrs' feasts. Durable — not consumed." },
    "alembic": { name: "Alembik", name_en: "Alembic", icon: "⚗️", type: "tool", desc: "Destilační nádoba z čirého skla. Bez alembiku není destilace.", desc_en: "A distillation vessel of clear glass. No alembic, no distillation." },
    "glass_mirror": { name: "Zrcadlo", name_en: "Glass Mirror", icon: "🪞", type: "tool", desc: "Broušené zrcadlo — vzácnost hodná biskupského stolu.", desc_en: "A polished mirror — a rarity fit for a bishop's table." },

    "hostia": { name: "Hostie", name_en: "Host Wafers", icon: "🫓", type: "mat", desc: "Nekvašené oplatky z pšeničné mouky. Pečené v kleštích s vyrytým beránkem.", desc_en: "Unleavened wafers of wheat flour. Baked in irons engraved with the Lamb." },
    "tanbark": { name: "Tříslo", name_en: "Tanbark", icon: "🟤", type: "mat", desc: "Dubová kůra drcená ve stoupě. Třísloviny pro koželužnu — hrubší než duběnky, ale je jí dost.", desc_en: "Oak bark crushed in a stamp mill. Tannins for the tannery — coarser than oak galls, but plentiful." },
    "reliquia": { name: "Relikvie", name_en: "Relic", icon: "✨", type: "tool", desc: "Ostatek světce v pozlaceném relikviáři — dar Jeho Milosti za vzorný dům. Nelze koupit ani prodat.", desc_en: "A saint's relic in a gilded reliquary — a gift of His Grace for an exemplary house. Cannot be bought or sold." },

    // ── PRODUKTY NOVÝCH ZVÍŘAT (easter eggs — zvířata teprve přijdou) ────────
    "goat_hide": { name: "Kozí kůže", name_en: "Goat Hide", icon: "🐐", type: "mat", desc: "Kozí kůže poskytuje nejkvalitnější pergamen — tenký, pevný, málo mastný. Italské kláštery ho znaly jako standard.", desc_en: "Goat hide yields the finest parchment — thin, strong, little grease. Italian monasteries knew it as the standard." },
    "goat_milk": { name: "Kozí mléko", name_en: "Goat Milk", icon: "🥛", type: "mat", desc: "Kozí mléko a syrovátka. Součást klášterní lékárny. Podávalo se nemocným bratrům.", desc_en: "Goat milk and whey. Part of the monastic infirmary. Served to ailing brothers." },
    "cow_milk": { name: "Kravské mléko", name_en: "Cow Milk", icon: "🥛", type: "mat", desc: "Husté kravské mléko z klášterního chléva. Základ másla i sýra.", desc_en: "Rich cow's milk from the monastery byre. The base of butter and cheese." },
    "lard": { name: "Sádlo", name_en: "Lard", icon: "🫙", type: "mat", desc: "Vepřové sádlo. Konzervant, mazivo i palivo do lamp.", desc_en: "Pig lard. Preservative, lubricant and lamp fuel." },
    "cured_meat": { name: "Uzené maso", name_en: "Cured Meat", icon: "🥩", type: "food", desc: "Nasolené a uzené vepřové. Vydrží celou zimu. Zásobování konvršů a čeledi.", desc_en: "Salted and smoked pork. Lasts all winter. Provisions for lay brothers and servants." },
    "beef": { name: "Hovězí maso", name_en: "Beef", icon: "🍖", type: "food_raw", desc: "Syrové hovězí z kravína. Uvař nebo usuš před jídlem.", desc_en: "Raw beef from the byre. Cook or cure before eating." },
    "cured_beef": { name: "Uzené hovězí", name_en: "Cured Beef", icon: "🥩", type: "food", desc: "Nasolené a uzené hovězí. Vydrží celou zimu.", desc_en: "Salted and smoked beef. Lasts all winter." },
    "quill_premium": { name: "Brk holubí", name_en: "Pigeon Quill", icon: "🪶", type: "mat", desc: "Holubí brk. Jemnější než husí, vhodný pro drobné písmo a iluminace.", desc_en: "Pigeon quill. Finer than goose feather, suited for small script and illumination." },
    "pigeon_dung": { name: "Holubí trus", name_en: "Pigeon Dung", icon: "💩", type: "mat", desc: "Vysoce koncentrované hnojivo. Klášterní zahradníci ho sbírali z holubníku pro zahradu.", desc_en: "Highly concentrated fertiliser. Monastic gardeners collected it from the dovecote for the garden." },
    "butter": { name: "Máslo", name_en: "Butter", icon: "🧈", type: "mat", desc: "Čerstvé máslo z kravského mléka. Postní výjimka u nemocných.", desc_en: "Fresh butter from cow's milk. A Lenten exception for the sick." },
    "cheese": { name: "Sýr", name_en: "Cheese", icon: "🧀", type: "food", desc: "Tvrdý klášterní sýr. Trvanlivý, výživný. Prodávaný na trzích.", desc_en: "Hard monastic cheese. Long-lasting, nutritious. Sold at markets." },
    "salt": { name: "Sůl", name_en: "Salt", icon: "🧂", type: "mat", desc: "Drahá obchodní komodita ze solných stezek. Bez ní se sýr nezasolí a brzy zkazí.", desc_en: "A costly trade good from the salt roads. Without it cheese cannot be salted and soon spoils." },

    // GIACOMO IMPORT — koření a hedvábí, viz ContactsDB.giacomo.buyOffer
    "pepr_cerny": { name: "Černý pepř", name_en: "Black Pepper", icon: "⚫", type: "mat", desc: "Král koření. Tvoří většinu obchodu s Orientem — platí se jím i daně.", desc_en: "The king of spices. Makes up most of the trade with the Orient — even taxes are paid in it." },
    "zazvor": { name: "Zázvor", name_en: "Ginger", icon: "🫚", type: "mat", desc: "Druhé nejoblíbenější koření po pepři. Z Indie a Číny, sušený i v cukru.", desc_en: "The second most popular spice after pepper. From India and China, dried or preserved in sugar." },
    "hrebicek": { name: "Hřebíček", name_en: "Clove", icon: "🟤", type: "mat", desc: "Sušená poupata z Ostrovů koření. Silná vůně, tiší bolest zubů.", desc_en: "Dried buds from the Spice Islands. Strong scent, eases toothache." },
    "muskat": { name: "Muškátový oříšek", name_en: "Nutmeg", icon: "🟠", type: "mat", desc: "Jádro semene z jediné rostliny, co roste na souostroví Banda. Vzácné a drahé.", desc_en: "The seed kernel of a plant that grows only on the Banda Islands. Rare and costly." },
    "muskatovy_kvet": { name: "Muškátový květ", name_en: "Mace", icon: "🔴", type: "mat", desc: "Sytě červený míšek obalující muškátový oříšek. Jemnější chuť, dražší než oříšek sám.", desc_en: "The bright red membrane wrapping the nutmeg seed. A finer flavour, pricier than the nut itself." },
    "skorice": { name: "Skořice", name_en: "Cinnamon", icon: "🟫", type: "mat", desc: "Ve skutečnosti čínská kasie — drsnější a ostřejší než pravá cejlonská skořice.", desc_en: "In truth Chinese cassia — coarser and sharper than true Ceylon cinnamon." },
    "safran": { name: "Šafrán", name_en: "Saffron", icon: "🟡", type: "mat", desc: "Nejdražší koření světa. Na půl kila je třeba 75 000 květů. Zlatá barva na panském stole.", desc_en: "The world's most expensive spice. Half a kilo needs 75,000 flowers. A golden colour for the lord's table." },
    "hedvabi": { name: "Hedvábí", name_en: "Silk", icon: "🧣", type: "mat", desc: "Vzácná tkanina z Východu. Giacomo ji sežene, i když sám neví odkud přesně.", desc_en: "A rare fabric from the East. Giacomo procures it, though even he isn't quite sure where from." },

    "rennet": { name: "Syřidlo", name_en: "Rennet", icon: "🫙", type: "mat", desc: "Sráží mléko pro výrobu sýra. Ze slezu mláděte nebo z bylin.", desc_en: "Curdles milk for cheesemaking. From a kid's stomach or from herbs." },
    "galium": { name: "Svízel syřišťový", name_en: "Lady's Bedstraw", icon: "🌼", type: "mat", desc: "Žlutě kvetoucí bylina. Výluh sráží mléko — chudší alternativa ke slezu.", desc_en: "A yellow-flowering herb. Its extract curdles milk — a poor man's rennet." },

    // ── CASEUS — sýry (4 typy × fáze zrání) ───────────────────────────────────
    "goat_cheese_fresh": { name: "Kozí sýr (čerstvý)", name_en: "Goat Cheese (Fresh)", icon: "🧀", type: "food", desc: "Čerstvý kozí sýr. Měkký, rychle se zkazí.", desc_en: "Fresh goat cheese. Soft, spoils quickly." },
    "goat_cheese_mature": { name: "Kozí sýr (zralý)", name_en: "Goat Cheese (Mature)", icon: "🧀", type: "food", desc: "Vyzrálý kozí sýr. Pevnější, výraznější chuť.", desc_en: "Matured goat cheese. Firmer, sharper flavour." },
    "goat_cheese_aged": { name: "Kozí sýr (starý)", name_en: "Goat Cheese (Aged)", icon: "🧀", type: "food", desc: "Dlouho zrálý kozí sýr. Vzácný, vysoce ceněný.", desc_en: "Long-aged goat cheese. Rare, highly prized." },
    "sheep_cheese_fresh": { name: "Ovčí sýr (čerstvý)", name_en: "Sheep Cheese (Fresh)", icon: "🧀", type: "food", desc: "Čerstvý ovčí sýr. Měkký, rychle se zkazí.", desc_en: "Fresh sheep cheese. Soft, spoils quickly." },
    "sheep_cheese_mature": { name: "Ovčí sýr (zralý)", name_en: "Sheep Cheese (Mature)", icon: "🧀", type: "food", desc: "Vyzrálý ovčí sýr. Pevnější, výraznější chuť.", desc_en: "Matured sheep cheese. Firmer, sharper flavour." },
    "sheep_cheese_aged": { name: "Ovčí sýr (starý)", name_en: "Sheep Cheese (Aged)", icon: "🧀", type: "food", desc: "Dlouho zrálý ovčí sýr. Vzácný, vysoce ceněný.", desc_en: "Long-aged sheep cheese. Rare, highly prized." },
    "cow_cheese_fresh": { name: "Kravský sýr (čerstvý)", name_en: "Cow Cheese (Fresh)", icon: "🧀", type: "food", desc: "Čerstvý kravský sýr. Měkký, rychle se zkazí.", desc_en: "Fresh cow cheese. Soft, spoils quickly." },
    "cow_cheese_mature": { name: "Kravský sýr (zralý)", name_en: "Cow Cheese (Mature)", icon: "🧀", type: "food", desc: "Vyzrálý kravský sýr. Pevnější, výraznější chuť.", desc_en: "Matured cow cheese. Firmer, sharper flavour." },
    "cow_cheese_aged": { name: "Kravský sýr (starý)", name_en: "Cow Cheese (Aged)", icon: "🧀", type: "food", desc: "Dlouho zrálý kravský sýr. Vzácný, vysoce ceněný.", desc_en: "Long-aged cow cheese. Rare, highly prized." },
    "syrecky_fresh": { name: "Syrečky (čerstvé)", name_en: "Curd Cheese (Fresh)", icon: "🧀", type: "food", desc: "Čerstvé syrečky z kysaného tvarohu. Olomoucká specialita — bez syřidla.", desc_en: "Fresh curd cheese from soured curds. An Olomouc speciality — no rennet needed." },
    "syrecky_mature": { name: "Syrečky (zralé)", name_en: "Curd Cheese (Mature)", icon: "🧀", type: "food", desc: "Vyzrálé syrečky. Pronikavá vůně, výrazná chuť.", desc_en: "Matured curd cheese. Pungent aroma, sharp flavour." },
    "cream": { name: "Smetana", name_en: "Cream", icon: "🥛", type: "mat", desc: "Hustá smetana sebraná z mléka. Vzácnost klášterní kuchyně — a slabost každé kočky.", desc_en: "Thick cream skimmed from milk. A rarity of the monastic kitchen — and every cat's weakness." },
    "buttermilk": { name: "Podmáslí", name_en: "Buttermilk", icon: "🥛", type: "mat", desc: "Kyselé podmáslí, zbytek po stloukání másla. Osvěžující nápoj čeledi.", desc_en: "Sour buttermilk, left over from churning butter. A refreshing drink for the servants." },
    "mouse": { name: "Myš", name_en: "Mouse", icon: "🐭", type: "mat", desc: "Klášterní myš. Žere zrní i pergamen. Kočka ji občas přinese jako dar.", desc_en: "A monastery mouse. Eats grain and parchment alike. The cat sometimes brings one as a gift." },
    "rabbit_m": { name: "Králík ♂", name_en: "Rabbit ♂", icon: "🐇", type: "animal", desc: "Samec. V králíkárně se postará o přírůstky.", desc_en: "Male. Will take care of the offspring in the hutch." },
    "rabbit_f": { name: "Králice ♀", name_en: "Rabbit ♀", icon: "🐇", type: "animal", desc: "Samice. Rodí mláďata každých 7 dní.", desc_en: "Female. Bears kits every 7 days." },
    "rabbit_meat": { name: "Králičí maso", name_en: "Rabbit Meat", icon: "🍖", type: "food_raw", desc: "Jemné maso z králíkárny. Klášterní kuchyně ho cení.", desc_en: "Tender meat from the hutch. Prized by the monastic kitchen." },
    "rabbit_pelt": { name: "Králičí kožka", name_en: "Rabbit Pelt", icon: "🦊", type: "mat", desc: "Měkká kožka. Na podšívky rukavic a lemování kapucí.", desc_en: "A soft pelt. For glove linings and hood trims.", },
    "goat": { name: "Koza", name_en: "Goat", icon: "🐐", type: "animal", desc: "Kráva chudých. Mléko dává i v zimě a spase, co ovce odmítne.", desc_en: "The poor man's cow. Gives milk even in winter and grazes what sheep refuse." },
    "piglet": { name: "Sele", name_en: "Piglet", icon: "🐖", type: "animal", desc: "Mladé prase. Za pár měsíců živá spižírna — krm ho žaludy.", desc_en: "A young pig. In a few months a living larder — feed it acorns." },
    "acorn": { name: "Žalud", name_en: "Acorn", icon: "🌰", type: "mat", desc: "Dubový žalud. Prasata po nich rostou jako z vody.", desc_en: "An oak acorn. Pigs fatten on them remarkably." },
    "churn": { name: "Máselnice", name_en: "Butter Churn", icon: "🛢️", type: "tool", desc: "Dřevěná máselnice. Hodiny stloukání promění smetanu v máslo — a zbude podmáslí.", desc_en: "A wooden churn. Hours of churning turn cream into butter — leaving buttermilk behind." },
    "cheese_mold": { name: "Sýrařská forma", name_en: "Cheese Mold", icon: "🧺", type: "tool", desc: "Proutěný košík s plátnem. Odděluje syrovátku od tvarohu a dává sýru tvar.", desc_en: "A wicker basket lined with cloth. Separates whey from curd and shapes the cheese." },
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
    "vapenec": { name: "Vápenec", name_en: "Limestone", icon: "⚪", type: "mat", desc: "Vylámaný vápencový kámen. Čeká na pálení ve vápenici.", desc_en: "Quarried limestone rock. Awaits burning in the lime kiln." },
    "vapno_paleny_fresh": { name: "Vápenec v peci", name_en: "Limestone in the Kiln", icon: "🔥", type: "mat", desc: "Hoří ve vápenici dny a noci beze změny plamene. Ještě není hotové.", desc_en: "Burning in the kiln for days and nights without pause. Not yet done." },
    "vapno_paleny_mature": { name: "Pálené vápno", name_en: "Quicklime", icon: "🧱", type: "mat", desc: "Vypálený vápenec. Prudce reaguje s vodou — čeká na hašení.", desc_en: "Burnt limestone. Reacts violently with water — awaits slaking." },
    "vapno_hasene_fresh": { name: "Čerstvě hašené vápno", name_en: "Freshly Slaked Lime", icon: "💧", type: "mat", desc: "Uhašeno vodou, ještě prudké. Musí uležet v jámě.", desc_en: "Just slaked with water, still caustic. Must rest in the pit." },
    "vapno_hasene_mature": { name: "Vápno", name_en: "Lime", icon: "⬜", type: "mat", desc: "Vyzrálé v jámě. Klidné, použitelné — malta, omítka, pergamen.", desc_en: "Matured in the pit. Stable and usable — mortar, plaster, parchment." },
    "iron_ingot": { name: "Železný ingot", name_en: "Iron Ingot", icon: "⚙️", type: "mat", desc: "Odlitý prut železa. Základ kovářského řemesla.", desc_en: "Cast iron bar. The foundation of the blacksmith's craft." },
    "kovani": { name: "Kování", name_en: "Ironwork Fittings", icon: "🔩", type: "mat", desc: "Kované pásy, skoby a spony. Vesnický kovář je prodává hotové — sám je nekuješ.", desc_en: "Forged bands, cramps, and clasps. The village blacksmith sells these ready-made — you don't forge them yourself." },
    "velky_ul_1": { maxStack: 1, name: "Velký úl (I)", name_en: "Great Hive (I)", icon: "🛖", type: "mat", desc: "Zesílená konstrukce úlu — kulatina, lano a kování od kováře. Odemyká vylepšené včelstvo.", desc_en: "A reinforced hive structure — logs, rope, and blacksmith's ironwork. Unlocks an improved colony." },
    "velky_ul_2": { maxStack: 1, name: "Velký úl (II)", name_en: "Great Hive (II)", icon: "🛖", type: "mat", desc: "Dostavba Velkého úlu na plnou míru. Nejsilnější staveniště pro včelstvo v klášteře.", desc_en: "The Great Hive built out to its full measure. The strongest apiary structure in the monastery." },
    "anvil": { maxStack: 1, name: "Kovadlina", name_en: "Anvil", icon: "⚒️", type: "mat", desc: "Těžká železná kovadlina. Nutná pro stavbu kovárny.", desc_en: "Heavy iron anvil. Required to build the smithy." },

    // ── HUTNÍ STAVBY ─────────────────────────────────────────────────────────
    "fodina": { maxStack: 1, name: "Fodina (Důl)", name_en: "Fodina (Mine)", icon: "⛏️", type: "building", desc: "Klášterní důl na železnou rudu. Vyžaduje souhlas opata a horní privilegium.", desc_en: "Monastic iron ore mine. Requires the abbot's consent and mining rights." },
    "fornax_ferraria": { maxStack: 1, name: "Fornax Ferraria (Huť)", name_en: "Fornax Ferraria (Smelting Furnace)", icon: "🔥", type: "building", desc: "Tavicí pec s měchy. Přetaví železnou rudu na ingoty. Vyžaduje souhlas opata.", desc_en: "Smelting furnace with bellows. Converts iron ore into ingots. Requires the abbot's consent." },

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
    "rye_grain_1": { name: "Žitné zrno (1. třída)", name_en: "Rye Grain (Grade 1)", icon: "🌾", type: "mat", desc: "Prvotřídní žito z vlastního pole. Nejlepší mouka.", desc_en: "Prime rye from your own field. The finest flour." },
    "rye_grain_2": { name: "Žitné zrno (2. třída)", name_en: "Rye Grain (Grade 2)", icon: "🌾", type: "mat", desc: "Žito horší kvality — vlhko či paličkovice. Postačí na krmivo i mouku.", desc_en: "Lower-grade rye — dampness or ergot risk. Fine for feed or coarser flour." },
    "wheat_grain_1": { name: "Pšeničné zrno (1. třída)", name_en: "Wheat Grain (Grade 1)", icon: "🌾", type: "mat", desc: "Prvotřídní pšenice z vlastního pole. Nejlepší mouka.", desc_en: "Prime wheat from your own field. The finest flour." },
    "wheat_grain_2": { name: "Pšeničné zrno (2. třída)", name_en: "Wheat Grain (Grade 2)", icon: "🌾", type: "mat", desc: "Pšenice horší kvality — sucho a chvostky. Postačí na krmivo i mouku.", desc_en: "Lower-grade wheat — drought and screenings. Fine for feed or coarser flour." },
    "barley": { name: "Ječmen", name_en: "Barley", icon: "🌾", type: "mat", desc: "Dvouřadý ječmen. Základ každého klášterního piva. Bez ječmene není pivovar.", desc_en: "Two-row barley. The basis of every monastic ale. Without barley, no brewery." },
    "oats": { name: "Oves", name_en: "Oats", icon: "🌾", type: "mat", desc: "Oves setý. Krmivo pro koně a osla. Bez ovsa tažný dobytek ztrácí sílu.", desc_en: "Common oats. Feed for horses and donkeys. Without oats, draught animals lose strength." },
    "millet": { name: "Proso", name_en: "Millet", icon: "🌾", type: "mat", desc: "Proso seté. Rychlá kaše, krmivo pro drůbež. Odolné i v suchu.", desc_en: "Common millet. Quick porridge, poultry feed. Resilient even in drought." },
    "peas": { name: "Hrách", name_en: "Peas", icon: "🫛", type: "mat", desc: "Polní hrách. Polévka, krmivo, obohacuje půdu dusíkem.", desc_en: "Field peas. Soup, fodder, enriches soil with nitrogen." },
    "vikev": { name: "Vikev", name_en: "Vetch", icon: "🌸", type: "mat", desc: "Drobná luštěnina — levné krmivo pro dobytek i holuby, na kořenech váže dusík. Sela se na úhor.", desc_en: "A small legume — cheap fodder for livestock and pigeons, fixes nitrogen at the roots. Sown on fallow ground." },
    "flax_fiber": { name: "Lněná vlákna", name_en: "Flax Fibre", icon: "🧵", type: "mat", desc: "Stonky lnu po rosení a tření. Základ pro tkaní plátna a výrobu provazů.", desc_en: "Flax stalks after retting and breaking. The basis for weaving linen and making rope." },
    "straw": { name: "Sláma", name_en: "Straw", icon: "🌿", type: "mat", desc: "Posklizňová sláma. Podestýlka pro zvířata, střešní krytina, krmivo pro skot.", desc_en: "Post-harvest straw. Bedding for animals, thatching material, fodder for cattle." },
    "flour": { name: "Mouka", name_en: "Flour", icon: "⚪", type: "mat", desc: "Mletá pšeničná nebo žitná mouka. Základ pro chléb, oplatky a kaši.", desc_en: "Ground wheat or rye flour. The basis for bread, wafers and porridge." },
    "flour_1": { name: "Mouka (1. třída)", name_en: "Flour (Grade 1)", icon: "⚪", type: "mat", desc: "Semleta z prvotřídního zrní vlastního pole. Nejlepší chléb a koláče.", desc_en: "Milled from prime grain off your own field. The finest bread and pastries." },
    "flour_2": { name: "Mouka (2. třída)", name_en: "Flour (Grade 2)", icon: "⚪", type: "mat", desc: "Běžná mouka — z horšího zrní nebo koupená. Postačí na denní chléb.", desc_en: "Common flour — lower-grade or bought. Fine for everyday bread." },
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
// (vloženo před uzavírací závorku objektu — merge do objektu před buildem)
// ── KADIDLO (Thuribulum) ─────────────────────────────────────────────────
// Přidáno jako Object.assign — bezpečný merge bez zásahu do stávajícího kódu
Object.assign(ItemsDB, {
    // Suroviny — pryskyřice
    "resin_spruce": { name: "Smrková pryskyřice", name_en: "Spruce Resin", icon: "🌲", type: "mat", desc: "Obyčejná smrková smůla nasbíraná v lese. Základ nejjednodušší kadidelné směsi.", desc_en: "Common spruce pitch from the forest. The basis of the simplest incense blend." },
    "resin_pine": { name: "Borová pryskyřice", name_en: "Pine Resin", icon: "🌲", type: "mat", desc: "Lepkavá pryskyřice borového stromu. Dioscorides stromy Pitys a Peuce chválil pro jejich stahující vlastnosti.", desc_en: "Sticky pine resin. Dioscorides praised the Pitys and Peuce trees for their astringent properties." },
    "resin_styrax": { name: "Styrax", name_en: "Styrax", icon: "🏺", type: "mat", desc: "Vzácná pryskyřice styraxového stromu dovážená z Levanty. Hojně využívaná v klášterních vykuřovadlech.", desc_en: "Rare resin of the styrax tree, imported from the Levant. Widely used in monastic incenses." },
    "resin_olibanum": { name: "Olibanum", name_en: "Olibanum", icon: "✨", type: "mat", desc: "Pravé arabské kadidlo (Libanon Thus). Jak píše Dioscorides: dobré kadidlo je bílé, uvnitř mastné a hoří rovným plamenem.", desc_en: "True Arabian frankincense (Libanon Thus). As Dioscorides writes: good frankincense is white, oily within, and burns with a straight flame." },
    // Hotová kadidla (consumable)
    "incense_spruce": { name: "Smrkové kadidlo", name_en: "Spruce Incense", icon: "💨", type: "consumable", desc: "Hrouda smrčí smůly a uhlíku. Slabě vonící, ale dostupná útěcha pro únaveného písaře. Hoří 10 sekund.", desc_en: "A lump of spruce pitch and charcoal. Faint-scented but accessible comfort for a weary scribe. Burns for 10 seconds." },
    "incense_pine": { name: "Borové kadidlo", name_en: "Pine Incense", icon: "💨", type: "consumable", desc: "Voní hlubokým lesem a pryskyřicí. Při hoření tiší únavu těla i mysli. Hoří 15 sekund.", desc_en: "Smells of deep forest and resin. Soothes the fatigue of body and mind while burning. Burns for 15 seconds." },
    "incense_styrax": { name: "Styraxové kadidlo", name_en: "Styrax Incense", icon: "💨", type: "consumable", desc: "Sladce a těžce vonící kadidlo pro jasnou mysl. Oblíbené v byzantských klášterech. Hoří 22 sekund.", desc_en: "Sweet and heavy-scented incense for a clear mind. Favoured in Byzantine monasteries. Burns for 22 seconds." },
    "incense_olibanum": { name: "Olibanum", name_en: "Olibanum Incense", icon: "💨", type: "consumable", desc: "Posvátný dým arabského kadidla. Kouř stoupá k nebi jako modlitba. Očišťuje tělo i ducha. Hoří 30 sekund.", desc_en: "Sacred smoke of Arabian frankincense. The smoke rises heavenward like a prayer. Purifies body and spirit. Burns for 30 seconds." },
});
// ── BESTIÁŘ — nález spisu (yard_cleanup, nezávislý na Titivillus craft-checku) ──
// Přidáno jako Object.assign — bezpečný merge bez zásahu do stávajícího kódu
Object.assign(ItemsDB, {
    "titivillus_spis": {
        name: "Spis o Titivillovi", name_en: "A Note on Titivillus", icon: "📖", type: "lore",
        desc: "Polozetlelý list se skicou rohatého tvora a varovnými verši. Někdo si dal práci to zapsat.", desc_en: "A half-decayed leaf with a sketch of a horned creature and warning verses. Someone took care to write it down."
    },
});
// ── BESTIÁŘ — nález spisu (cleanPen, nezávislý na Acedia erosion-checku) ──
Object.assign(ItemsDB, {
    "acedia_spis": {
        name: "Spis o Acedii", name_en: "A Note on Acedia", icon: "📜", type: "lore",
        desc: "Vlhkem zvlněný list, zastrčený ve spáře proutěné stěny. Někdo si zapsal, jaké to je, když den nechce skončit.", desc_en: "A page warped with damp, wedged in the crack of a wattle wall. Someone once wrote down what it feels like when the day will not end."
    },
});
// ── BESTIÁŘ — nález spisu (DecaySystem loss-check, nezávislý na fliesMult erosion-checku) ──
Object.assign(ItemsDB, {
    "belzebub_spis": {
        name: "Spis o Belzebubovi", name_en: "A Note on Beelzebub", icon: "🪰", type: "lore",
        desc: "Potřísněný list nalezený mezi zkaženými zásobami. Někdo si zapsal, co znamená, když zanedbání přivolá roj.", desc_en: "A stained page found among the spoiled stores. Someone once wrote down what it means when neglect draws a swarm."
    },
});