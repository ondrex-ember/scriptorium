// ─────────────────────────────────────────────────────────────
// GuildsDB — Cechy: městská regulace mimo klášterní zdi
// MRD: cechy-a-prava-mrd.md §3, chronicon-cechy-mrd.md (schváleno)
// K1: infrastruktura. Hra tento soubor zatím NEČTE. Žádná mechanika.
//
// DŮLEŽITÉ: id klíče MUSÍ sedět 1:1 s Chronicon data/guilds.js —
// `relation`/`pravo` jsou per-hráč (žijou tady), `tension` je sdílený
// svět a žije v Chroniconu (ChroniconSystem._snap.guilds[id].tension).
// Nespojovat, nekopírovat tension sem — čte se z _snap přímo, až bude
// K2 (UI/negotiation).
// ─────────────────────────────────────────────────────────────

// Aktivní pro UI teď (cechy-a-prava-mrd.md §1) — zbytek existuje jako data,
// ale nezobrazuje se hráči, dokud nepřijde Furnus/příslušný provoz.
const GUILDS_ACTIVE = ['mlynarsky', 'truhlarsky', 'kolarsky', 'kovarsky'];

const GuildsDB = {
    mlynarsky: {
        name: 'Mlynářský cech', name_en: "The Millers' Guild",
        relation: 0,
        pravo: { status: 'none', mechanism: null }, // mechanism: 'privilegium' | 'klasterni_dvur' | 'veletrh'
    },
    truhlarsky: {
        name: 'Truhlářský cech', name_en: "The Cabinetmakers' Guild",
        relation: 0,
        pravo: { status: 'none', mechanism: null },
    },
    kolarsky: {
        name: 'Kolářský cech', name_en: "The Wheelwrights' Guild",
        relation: 0,
        pravo: { status: 'none', mechanism: null },
    },
    kovarsky: {
        name: 'Kovářský a hamernický cech', name_en: "The Smiths' and Forgemasters' Guild",
        relation: 0,
        pravo: { status: 'none', mechanism: null },
    },
    // Rezerva — čeká na Furnus (Pekařský/Řeznický) a jednotlivý provozy
    // (cechy-a-prava-mrd.md §7 rollout). Přítomný teď, ať id sedí s
    // Chroniconem od začátku, ne až se dopíšou.
    pekarsky: {
        name: 'Pekařský cech', name_en: "The Bakers' Guild",
        relation: 0,
        pravo: { status: 'none', mechanism: null },
    },
    reznicky: {
        name: 'Řeznický cech', name_en: "The Butchers' Guild",
        relation: 0,
        pravo: { status: 'none', mechanism: null },
    },
    zlatnicky: {
        name: 'Zlatnický cech', name_en: "The Goldsmiths' Guild",
        relation: 0,
        pravo: { status: 'none', mechanism: null },
    },
    kozeluzsky: {
        name: 'Koželužský cech', name_en: "The Tanners' Guild",
        relation: 0,
        pravo: { status: 'none', mechanism: null },
    },
};