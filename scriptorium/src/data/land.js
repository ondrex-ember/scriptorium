// ─────────────────────────────────────────────────────────────
// LandParcelsDB — Pozemky: rozšíření panství
// MRD: pozemky-mrd.md (v1.5, 16.8.2026)
// K1: infrastruktura. Hra tento soubor zatím NEČTE mimo rozhovor s
// opatem (Game.askAbbotAboutLand) a nákup samotnej (Game.buyLandParcel).
// Stavba budov NA parcele = další krok, dosud nikde neimplementováno.
//
// Statická definice, mirror GuildsDB (data/guilds.js) — mutable stav
// (owned/status) půjde do GameState.landParcels, NE sem.
//
// slotsCapacity (přejmenováno ze `slots` 16.8.2026, pozemky-mrd.md §3.1):
// KAPACITA, ne obsazení. Parcela nenese konkrétní budovy — jen tag +
// kolik slotů unese. Který budovy tam půjdou, řeší katalog nároků
// budov (pozemky-mrd.md §3.2, zatím jen v MRD, ne v kódu — čeká, až
// se bude řešit skutečná stavba).
// ─────────────────────────────────────────────────────────────

const LandParcelsDB = {
    mlynsky_nahon: {
        name: 'Mlýnský náhon', name_en: 'The Mill Race',
        tags: ['voda'],
        slotsCapacity: 1,
        price: 250,
        phase: 1,
        desc: 'Úzký pruh země podél odbočky z potoka, s náhonem už napůl vyhloubeným — někdejší majetek souseda, co ho klášteru nabídl k prodeji. Stačí pár úprav a voda potáhne kolo.',
        desc_en: "A narrow strip of land along a stream's offshoot, its race already half-dug — once a neighbour's land, now offered to the monastery for sale. A little adjustment, and the water will turn a wheel.",
    },
    navrsi: {
        name: 'Návrší', name_en: 'The Rise',
        tags: ['kopec'],
        slotsCapacity: 2,
        price: 250,
        phase: 2,
        desc: 'Holý hřeben nad klášterem, otevřený všem větrům — pastviny nahoře řídké, ale vítr tu nikdy neustává. Přesně to místo, kde by se otáčela mlýnská křídla.',
        desc_en: "A bare ridge above the monastery, open to every wind — the pasture up top is thin, but the wind never stops. Just the place for a mill's sails to turn.",
    },
    // Nový tag `slunce` (pozemky-mrd.md §3.2, 16.8.2026) — žádnej z
    // předchozích pěti neseděl na "sluneční svah" z historickýho
    // podkladu o vinařství. Přesná shoda, ne kompromis na existujícím.
    vinice: {
        name: 'Vinice', name_en: 'The Vineyard Slope',
        tags: ['slunce'],
        slotsCapacity: 2,
        price: 300,
        phase: 3,
        desc: 'Jižní svah nad řekou, kam slunce dopadá od rána do večera. Réva by se tu držela dobře — je jen otázka, kdo ji vysadí a jak dlouho počká na první úrodu.',
        desc_en: 'A south-facing slope above the river, where the sun falls from morning to evening. Vines would hold well here — only a question of who plants them, and how long they wait for the first harvest.',
    },
    // dilny-pozemky-mrd.md v0.3 — dílny (25.8.2026). Klášter praská ve
    // švech, každá nová dílna potřebuje vlastní parcelu, ne sdílený slot.
    // Přístup je PŘÍSNĚJŠÍ než u parcel výš — nestačí obecné otevření
    // jednání (pozemky_active), každá vyžaduje SAMOSTATNOU opatovu petici
    // (abbotPetition.land_<id>), teprve pak jde koupit.
    dvur_pekarsky: {
        name: 'Pekařský dvůr', name_en: "The Bakers' Yard",
        tags: [],
        slotsCapacity: 1,
        price: 150,
        phase: 4,
        desc: 'Klidný dvorek při zadní zdi, dost daleko od skriptoria, aby kouř z pece nevadil opisovačům, a dost blízko kuchyně, aby se mouka nemusela nosit přes půl kláštera.',
        desc_en: "A quiet yard by the back wall, far enough from the scriptorium that oven smoke won't trouble the copyists, close enough to the kitchen that flour needn't be carried across half the monastery.",
    },
    // kovarna-dilna-mrd.md v0.5 (30.8.2026) — druhá dílna, mirror
    // dvur_pekarsky, ale 2 sloty. Sousedí popisem s Pekařským dvorem
    // (kouř a rány kladiva stejně daleko od skriptoria), 2. slot je
    // rezerva na budoucí dílnu, žádná mechanická vazba na Furnus.
    u_hradby: {
        name: 'Dvůr u hradební zdi', name_en: 'The Wall-side Yard',
        tags: [],
        slotsCapacity: 2,
        price: 225,
        phase: 4,
        desc: 'Dvorek při hradební zdi, kousek od pekařského dvora — kouř a rány kladiva sem nedolehnou k opisovačům, a dvě dílny blízko sebe šetří cestu s materiálem.',
        desc_en: "A yard by the outer wall, close to the bakers' yard — smoke and hammer-blows stay far from the copyists, and two workshops side by side save a trip with materials.",
    },
};