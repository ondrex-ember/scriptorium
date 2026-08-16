// ─────────────────────────────────────────────────────────────
// GuildsDB — Cechy: městská regulace mimo klášterní zdi
// MRD: cechy-a-prava-mrd.md §3, chronicon-cechy-mrd.md (schváleno)
// K1: infrastruktura, K2: read-only status panel (CellariumSystem).
//
// OPRAVA (16.8.2026): relation/pravo NEPATŘÍ sem — GuildsDB je STATICKÁ
// definice (mirror ContactsDB, který taky nedrží relation přímo).
// Mutable per-hráč stav žije v GameState.guildRelation[id] (number,
// lazy-init mirror GameState.contactRelation) a GameState.guildPravo[id]
// ({status, mechanism}, lazy-init). Bez týhle opravy by GuildsDB
// (statický soubor, přepisuje se při každym builds) ztrácel hráčův
// postup při každym re-buildu — přesně proto to ContactsDB taky takhle
// nedělá.
//
// `tension` (sdílený svět) žije v Chroniconu, čte se živě z
// ChroniconSystem._snap.guilds[id].tension — nikdy sem nekopírovat.
// ─────────────────────────────────────────────────────────────

// Aktivní pro UI teď (cechy-a-prava-mrd.md §1) — zbytek existuje jako data,
// ale nezobrazuje se hráči, dokud nepřijde Furnus/příslušný provoz.
const GUILDS_ACTIVE = ['mlynarsky', 'truhlarsky', 'kolarsky', 'kovarsky'];

const GuildsDB = {
    mlynarsky:  { name: 'Mlynářský cech',            name_en: "The Millers' Guild" },
    truhlarsky: { name: 'Truhlářský cech',            name_en: "The Cabinetmakers' Guild" },
    kolarsky:   { name: 'Kolářský cech',              name_en: "The Wheelwrights' Guild" },
    kovarsky:   { name: 'Kovářský a hamernický cech', name_en: "The Smiths' and Forgemasters' Guild" },
    // Rezerva — čeká na Furnus (Pekařský/Řeznický) a jednotlivý provozy
    // (cechy-a-prava-mrd.md §7 rollout). ID přítomná už teď, ať sedí
    // s Chroniconem od začátku, ne až se dopíšou.
    pekarsky:   { name: 'Pekařský cech',              name_en: "The Bakers' Guild" },
    reznicky:   { name: 'Řeznický cech',              name_en: "The Butchers' Guild" },
    zlatnicky:  { name: 'Zlatnický cech',             name_en: "The Goldsmiths' Guild" },
    kozeluzsky: { name: 'Koželužský cech',            name_en: "The Tanners' Guild" },
};