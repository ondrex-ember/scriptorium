// ═══════════════════════════════════════════════════════════════════════════════
// SCRINIUM ABBATIS — Data
// Soukromá knihovna opata. Přístup pouze pro zasvěcené.
// Struktura: ScriniumDB.subtabs + ScriniumDB.folios
// Každé folio má tři překladové vrstvy: lectio / glossa / arcanum
// ═══════════════════════════════════════════════════════════════════════════════

const ScriniumDB = {

    // ── Subtaby ────────────────────────────────────────────────────────────────
    subtabs: {
        bestiar:     { id: 'bestiar',     icon: '🐉', labelKey: 'scrinium.subtabs.bestiar'     },
        herbar:      { id: 'herbar',      icon: '🌿', labelKey: 'scrinium.subtabs.herbar'      },
        kroniky:     { id: 'kroniky',     icon: '📜', labelKey: 'scrinium.subtabs.kroniky'     },
        tajne_spisy: { id: 'tajne_spisy', icon: '🔐', labelKey: 'scrinium.subtabs.tajne_spisy' },
        mapy:        { id: 'mapy',        icon: '🗺️', labelKey: 'scrinium.subtabs.mapy'        },
    },

    // ── Folia ─────────────────────────────────────────────────────────────────
    // Stav folií se uchovává v GameState.scrinium.folios[id]:
    //   { found: bool, layer: 0–3 }
    //   0 = nenalezeno, 1 = Lectio, 2 = Glossa, 3 = Arcanum

    folios: [

        // ══════════════════════════════════════════════════
        // TAJNÉ SPISY — 4 folia
        // ══════════════════════════════════════════════════

        // ── 1. Epistola de Rebus Ignotis ──────────────────
        // Klíčové folio: Arcanum odhalí přístup k Athanoru
        {
            id: 'folio_epistola',
            subtab: 'tajne_spisy',
            icon: '📜',
            physicalForm: 'scroll',     // scroll | leaf | codex | map
            titleKey: 'scrinium.folios.epistola.title',
            lectio: {
                textKey: 'scrinium.folios.epistola.lectio',
                cost: null,             // Lectio = zdarma, jen nalezení
            },
            glossa: {
                textKey: 'scrinium.folios.epistola.glossa',
                cost: { item: 'candle', amount: 6 },  // 6 lojových NEBO 3 voskové (viz arcanum)
            },
            arcanum: {
                textKey: 'scrinium.folios.epistola.arcanum',
                cost: { item: 'wax_candle', amount: 3 },  // pouze vosková svíčka — Opat trvá
                reward: {
                    type: 'unlock_athanor',
                    notifyKey: 'scrinium.folios.epistola.reward_notify',
                },
            },
        },

        // ── 2. De Fausto Contractu ────────────────────────
        // Easter egg: hráč volí podepsat nebo odmítnout smlouvu
        {
            id: 'folio_fausto',
            subtab: 'tajne_spisy',
            icon: '📃',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.fausto.title',
            lectio: {
                textKey: 'scrinium.folios.fausto.lectio',
                cost: null,
            },
            glossa: {
                textKey: 'scrinium.folios.fausto.glossa',
                cost: { item: 'candle', amount: 3 },
            },
            arcanum: {
                textKey: 'scrinium.folios.fausto.arcanum',
                cost: { item: 'ink', amount: 2 },
                reward: {
                    type: 'choice',
                    choiceKey: 'scrinium.folios.fausto.choice',
                },
            },
        },

        // ── 3. Ars Palimpsesti ────────────────────────────
        // Odměna: nový recept — recyklace použitého pergamenu
        {
            id: 'folio_palimpsest',
            subtab: 'tajne_spisy',
            icon: '📋',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.palimpsest.title',
            lectio: {
                textKey: 'scrinium.folios.palimpsest.lectio',
                cost: null,
            },
            glossa: {
                textKey: 'scrinium.folios.palimpsest.glossa',
                cost: { item: 'candle', amount: 3 },
            },
            arcanum: {
                textKey: 'scrinium.folios.palimpsest.arcanum',
                cost: { item: 'candle', amount: 5 },
                reward: {
                    type: 'recipe_unlock',
                    recipeId: 'recipe_palimpsest_recycle',
                    notifyKey: 'scrinium.folios.palimpsest.reward_notify',
                },
            },
        },

        // ── 4. De Titivillo Daemone ───────────────────────
        // Odměna: trvale viditelný Vigor warning indikátor v UI
        {
            id: 'folio_titivillus',
            subtab: 'tajne_spisy',
            icon: '📖',
            physicalForm: 'codex',
            titleKey: 'scrinium.folios.titivillus.title',
            lectio: {
                textKey: 'scrinium.folios.titivillus.lectio',
                cost: null,
            },
            glossa: {
                textKey: 'scrinium.folios.titivillus.glossa',
                cost: { item: 'candle', amount: 3 },
            },
            arcanum: {
                textKey: 'scrinium.folios.titivillus.arcanum',
                cost: { item: 'candle', amount: 5 },
                reward: {
                    type: 'ui_flag',
                    flag: 'titivillus_awareness',
                    notifyKey: 'scrinium.folios.titivillus.reward_notify',
                },
            },
        },

    ], // konec folios[]

}; // konec ScriniumDB