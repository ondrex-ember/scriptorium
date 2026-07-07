// ─────────────────────────────────────────────────────────────
// ContactsDB — Clientela: satelitní kontakty kláštera
// MRD: clientela-conversi-porta-reference.md, sekce 1.2b (schváleno)
// K1: infrastruktura. Hra tento soubor zatím NEČTE.
// Hub UI (8. subtab Saeculum, gate: secular antiquarius) = K2.
// Relation mechanika = K3. Sell bonus napojení = K4.
//
// GATE MAPOVÁNÍ (unlockTech) = NÁVRH ověřený proti reálným tech ID
// v data/tech.js — potvrdit před K2. Položky označené TBD čekají
// na rozhodnutí/na vznik techu.
// ─────────────────────────────────────────────────────────────

const ContactsDB = {
    syrar: {
        name: 'Sýrař', name_en: 'Cheesemaker', icon: '🧀',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_caseus',            // existuje (Lactaria II řetězec)
        sellBonus: { items: { goat_cheese_fresh: null, goat_cheese_mature: null, goat_cheese_aged: null,
                              sheep_cheese_fresh: null, sheep_cheese_mature: null, sheep_cheese_aged: null,
                              cow_cheese_fresh: null, cow_cheese_mature: null, cow_cheese_aged: null, syrecky_fresh: null, syrecky_mature: null } }, // K4b: null = BASE_PRICES
        desc: 'Vesnický sýrař. Vykoupí klášterní sýr lépe než trh.',
        desc_en: 'The village cheesemaker. Buys monastery cheese better than the market.'
    },
    mlynar: {
        name: 'Mlynář', name_en: 'Miller', icon: '🌾',
        primaryAxis: 'village',
        secondaryAxis: { axis: 'church', weight: 0.2 },   // mlýnský desátek
        unlockTech: null,                     // dostupný hned s hubem (Mola/mouka = raná hra)
        // M1 — výkup z polí (mouku NEvykupuje, tu mele sám); zrní mimo BASE_PRICES = exkluzivní kanál
        sellBonus: { items: { grain: 2, rye_grain_2: 3, wheat_grain_2: 3, rye_grain_1: 5, wheat_grain_1: 5,
                              barley: 2, oats: 2, millet: 2, peas: 2 } },
        // M2 — nabídka (prodává hráči): zrní a mouka, denní stock
        buyOffer: { items: { grain:   { price: 4,  stock: 10 },
                             flour_2: { price: 9,  stock: 5 },
                             flour_1: { price: 16, stock: 2 } } },
        desc: 'Mlynář od řeky. Desátek odvádí kostelu, obchody dělá s každým.',
        desc_en: 'The miller by the river. He tithes to the church and trades with everyone.'
    },
    vinar: {
        name: 'Vinař', name_en: 'Winemaker', icon: '🍷',
        primaryAxis: 'village',
        secondaryAxis: { axis: 'church', weight: 0.2 },   // mešní víno
        unlockTech: 'tech_vinifikace',        // existuje (Mustum→Vinum řetězec)
        sellBonus: { items: { mustum: 3, vinum: 9, vinum_rubrum: 10, vinum_praeclarum: 22 } }, // K4b: exkluzivní odbyt — trh vinum neprodává (mimo BASE_PRICES)
        desc: 'Vinař z jižních strání. Mešní víno dodává i biskupství.',
        desc_en: 'A winemaker from the southern slopes. He supplies mass wine even to the bishopric.'
    },
    kovar: {
        name: 'Kovář', name_en: 'Blacksmith', icon: '🔨',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_kovarina',          // existuje
        sellBonus: { items: { iron_ore: 6 } },   // K4b: výkup pod nákupní cenou Obchodu (15) — přebytek rozhodne hráč
        desc: 'Vesnický kovář. Vykoupí přebytečnou rudu, prodá nástroje.',
        desc_en: 'The village blacksmith. Buys surplus ore, sells tools.'
    },
    tkadlec: {
        name: 'Tkadlec', name_en: 'Weaver', icon: '🧵',
        primaryAxis: 'village',
        secondaryAxis: { axis: 'church', weight: 0.2 },   // roucha/paramenta
        unlockTech: 'tech_de_re_rustica',     // stříhání vlny žije pod Ovile (tech_lanificium zrušen — mechanika už existovala)
        sellBonus: { items: { wool: null } }, // K4: null = cena z BASE_PRICES (wool: 5)
        desc: 'Tkadlec z podhradí. Vlnu bere, roucha tká i pro kostel.',
        desc_en: 'A weaver from below the castle. He takes wool and weaves vestments even for the church.'
    },
    voskar: {
        name: 'Voskař', name_en: 'Wax Chandler', icon: '🕯️',
        primaryAxis: 'church',
        secondaryAxis: null,
        unlockTech: 'tech_candle',            // existuje (Apiarium/svíce)
        sellBonus: { items: { beeswax: null } }, // K4: null = cena z BASE_PRICES (trh)
        desc: 'Voskař u kostela. Surový vosk z Apiária vykoupí líp než kdokoliv.',
        desc_en: 'The wax chandler by the church. He pays better for raw beeswax than anyone.'
    },
    lovec: {
        name: 'Lovec', name_en: 'Hunter', icon: '🏹',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_de_animalibus',     // NÁVRH (znalost zvěře) — TBD potvrdit, alternativa: scavenge hunt flag
        sellBonus: { items: { meat: 2, hide: null, leather: null, caught_small_game: 3 } }, // L2: Divoké maso exkluzivně (mimo trh), kůže z BASE_PRICES; fat/bone záměrně mimo (craft užití)
        // L3a: exkluzivní nabídka — oko až od vztahu ≥ 25 (MRD bod 8 mechanismus)
        buyOffer: { items: { snare: { price: 5, stock: 3, minRelation: 25 } } },
        desc: 'Lovec drobné zvěře. Velká zvěř patří pánům — on to ví nejlíp.',
        desc_en: 'A hunter of small game. The big game belongs to the lords — he knows it best.'
    },
    sklar: {
        name: 'Sklář', name_en: 'Glassmaker', icon: '🔮',
        primaryAxis: 'scholars',
        secondaryAxis: null,
        unlockTech: 'tech_czech_glass',       // existuje
        unlockBook: 'book_czech_glass',       // dvojitý gate (schváleno 7.7.): tech = umíš, kniha = víš o hutích
        sellBonus: {},                        // Sklář jen prodává — výkup nemá
        // V4 — nabídka: běžné kusy denně; speciality přes ZAKÁZKY (glassOrders níže)
        buyOffer: { items: { glass_stopper: { price: 3,  stock: 5 },
                             glass_flask:   { price: 6,  stock: 3 },
                             glass_goblet:  { price: 8,  stock: 2 },
                             glass_tankard: { price: 8,  stock: 2 },
                             glass_jug:     { price: 9,  stock: 2 },
                             glass_bowl:    { price: 10, stock: 2 },
                             glass_pitcher: { price: 12, stock: 1 },
                             fly_trap_glass:{ price: 7,  stock: 1 } } },
        // V4/S2 — zakázky: 48 h, 50 % záloha, vztahové gaty, +2 vztah za dokončení
        glassOrders: { vaza:     { itemId: 'glass_vase',        price: 14, minRelation: 0  },
                       tercik:   { itemId: 'window_roundel',    price: 15, minRelation: 0  },
                       alembik:  { itemId: 'alembic',           price: 25, minRelation: 25 },
                       pateriky: { itemId: 'paternoster_beads', price: 18, minRelation: 30 },
                       zrcadlo:  { itemId: 'glass_mirror',      price: 40, minRelation: 50 } },
        desc: 'Sklář z hutě v lesích. Alembiky a křivule pro učené — křehké zboží, stálý odbyt.',
        desc_en: 'A glassmaker from a forest works. Alembics and retorts for the learned — fragile goods, steady trade.'
    }
};