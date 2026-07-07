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
        sellBonus: { /* K4: sýry — cheese item ID doplní Lactaria II implementace */ },
        desc: 'Vesnický sýrař. Vykoupí klášterní sýr lépe než trh.',
        desc_en: 'The village cheesemaker. Buys monastery cheese better than the market.'
    },
    mlynar: {
        name: 'Mlynář', name_en: 'Miller', icon: '🌾',
        primaryAxis: 'village',
        secondaryAxis: { axis: 'church', weight: 0.2 },   // mlýnský desátek
        unlockTech: null,                     // TBD: Mola je feature bez vlastního tech — kandidát unlockFlag po zprovoznění Mola vazby
        sellBonus: {},
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
        unlockTech: 'tech_lanificium',        // SCHVÁLEN, ale tech + wool item zatím NEEXISTUJÍ (MRD 1.4b) — kontakt zůstane zamčený do jejich vzniku
        sellBonus: { /* K4: wool */ },
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
        sellBonus: {},
        desc: 'Lovec drobné zvěře. Velká zvěř patří pánům — on to ví nejlíp.',
        desc_en: 'A hunter of small game. The big game belongs to the lords — he knows it best.'
    },
    sklar: {
        name: 'Sklář', name_en: 'Glassmaker', icon: '🔮',
        primaryAxis: 'scholars',
        secondaryAxis: null,
        unlockTech: 'tech_czech_glass',       // existuje
        sellBonus: {},                        // Sklář hlavně PRODÁVÁ (lab. sklo, spotřební) — nákupní kanál, viz MRD 1.6b TODO
        desc: 'Sklář z hutě v lesích. Alembiky a křivule pro učené — křehké zboží, stálý odbyt.',
        desc_en: 'A glassmaker from a forest works. Alembics and retorts for the learned — fragile goods, steady trade.'
    }
};