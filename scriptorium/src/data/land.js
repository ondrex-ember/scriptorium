// ─────────────────────────────────────────────────────────────
// LandParcelsDB — Pozemky: rozšíření panství
// MRD: pozemky-mrd.md (v1.3, schváleno 16.8.2026)
// K1: infrastruktura. Hra tento soubor zatím NEČTE mimo rozhovor s
// opatem (Game.askAbbotAboutLand). Picker/nákup samotnej = další krok.
//
// Statická definice, mirror GuildsDB (data/guilds.js) — mutable stav
// (owned/status) půjde do GameState.landParcels, NE sem, stejná chyba
// jako se opravovala u GuildsDB v1.0 (relation nepatřilo do static DB).
//
// Fáze 1 (teď): jen mlynsky_nahon. Zbytek matrixu (Návrší/Hvozd/Cesta/
// Vesnice, pozemky-mrd.md §3) se přidá stejným vzorem, až přijde na
// řadu — žádná architektura navíc potřeba, jen nové záznamy.
// ─────────────────────────────────────────────────────────────

const LandParcelsDB = {
    mlynsky_nahon: {
        name: 'Mlýnský náhon', name_en: 'The Mill Race',
        tags: ['voda'],
        slots: 1,
        price: 250,
        phase: 1,
        desc: 'Úzký pruh země podél odbočky z potoka, s náhonem už napůl vyhloubeným — někdejší majetek souseda, co ho klášteru nabídl k prodeji. Stačí pár úprav a voda potáhne kolo.',
        desc_en: "A narrow strip of land along a stream's offshoot, its race already half-dug — once a neighbour's land, now offered to the monastery for sale. A little adjustment, and the water will turn a wheel.",
    },
};