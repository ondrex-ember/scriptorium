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

        // ══════════════════════════════════════════════════
        // KRONIKY — 7 folií (Netolického pozůstalost)
        // ══════════════════════════════════════════════════

        {
            id: 'folio_netolicky_01',
            subtab: 'kroniky',
            icon: '📜',
            physicalForm: 'scroll',
            titleKey: 'scrinium.folios.netolicky_01.title',
            lectio: { textKey: 'scrinium.folios.netolicky_01.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.netolicky_01.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.netolicky_01.arcanum', cost: { item: 'candle', amount: 4 } },
        },
        {
            id: 'folio_netolicky_02',
            subtab: 'kroniky',
            icon: '📃',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.netolicky_02.title',
            lectio: { textKey: 'scrinium.folios.netolicky_02.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.netolicky_02.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.netolicky_02.arcanum', cost: { item: 'candle', amount: 4 } },
        },
        {
            id: 'folio_netolicky_03',
            subtab: 'kroniky',
            icon: '📃',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.netolicky_03.title',
            lectio: { textKey: 'scrinium.folios.netolicky_03.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.netolicky_03.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.netolicky_03.arcanum', cost: { item: 'candle', amount: 4 } },
        },
        {
            id: 'folio_netolicky_04',
            subtab: 'kroniky',
            icon: '📋',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.netolicky_04.title',
            lectio: { textKey: 'scrinium.folios.netolicky_04.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.netolicky_04.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.netolicky_04.arcanum', cost: { item: 'candle', amount: 4 } },
        },
        // ── 5. Receptura inkoustu — jediné folio s mechanickou odměnou ──
        {
            id: 'folio_netolicky_05',
            subtab: 'kroniky',
            icon: '📖',
            physicalForm: 'codex',
            titleKey: 'scrinium.folios.netolicky_05.title',
            lectio: { textKey: 'scrinium.folios.netolicky_05.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.netolicky_05.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: {
                textKey: 'scrinium.folios.netolicky_05.arcanum',
                cost: { item: 'ink_gallic', amount: 2 },
                reward: {
                    type: 'recipe_unlock',
                    recipeId: 'ink_netolicky',
                    notifyKey: 'scrinium.folios.netolicky_05.reward_notify',
                },
            },
        },
        {
            id: 'folio_netolicky_06',
            subtab: 'kroniky',
            icon: '📜',
            physicalForm: 'scroll',
            titleKey: 'scrinium.folios.netolicky_06.title',
            lectio: { textKey: 'scrinium.folios.netolicky_06.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.netolicky_06.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.netolicky_06.arcanum', cost: { item: 'candle', amount: 4 } },
        },
        {
            id: 'folio_netolicky_07',
            subtab: 'kroniky',
            icon: '📕',
            physicalForm: 'codex',
            titleKey: 'scrinium.folios.netolicky_07.title',
            lectio: { textKey: 'scrinium.folios.netolicky_07.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.netolicky_07.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.netolicky_07.arcanum', cost: { item: 'candle', amount: 5 } },
        },

        // ══════════════════════════════════════════════════
        // HERBÁŘ — 5 folií
        // ══════════════════════════════════════════════════

        // ── 1. De Signatura Rerum — narativní, žádný mechanický reward ──
        {
            id: 'folio_signatura',
            subtab: 'herbar',
            icon: '📃',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.signatura.title',
            lectio: { textKey: 'scrinium.folios.signatura.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.signatura.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: {
                textKey: 'scrinium.folios.signatura.arcanum',
                cost: { item: 'candle', amount: 4 },
                reward: {
                    type: 'ui_flag',
                    flag: 'signatura_awareness',
                    notifyKey: 'scrinium.folios.signatura.reward_notify',
                },
            },
        },
        // ── 2. Hildegardis de Herbis — recipe_unlock: nový nápoj ──
        {
            id: 'folio_hildegardis',
            subtab: 'herbar',
            icon: '📖',
            physicalForm: 'codex',
            titleKey: 'scrinium.folios.hildegardis.title',
            lectio: { textKey: 'scrinium.folios.hildegardis.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.hildegardis.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: {
                textKey: 'scrinium.folios.hildegardis.arcanum',
                cost: { item: 'candle', amount: 4 },
                reward: {
                    type: 'recipe_unlock',
                    recipeId: 'hildegard_tisane',
                    notifyKey: 'scrinium.folios.hildegardis.reward_notify',
                },
            },
        },
        // ── 3. Miasma et Odor Malus — narativní / foreshadowing B6 ──
        {
            id: 'folio_miasma',
            subtab: 'herbar',
            icon: '📜',
            physicalForm: 'scroll',
            titleKey: 'scrinium.folios.miasma.title',
            lectio: { textKey: 'scrinium.folios.miasma.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.miasma.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.miasma.arcanum', cost: { item: 'candle', amount: 4 } },
        },
        // ── 4. Mandragora Vociferans — narativní, žádná mechanika ──
        {
            id: 'folio_mandragora',
            subtab: 'herbar',
            icon: '📃',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.mandragora.title',
            lectio: { textKey: 'scrinium.folios.mandragora.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.mandragora.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.mandragora.arcanum', cost: { item: 'candle', amount: 4 } },
        },
        // ── 5. Theriaca Universalis — narativní breadcrumb → Athanor (žádný item) ──
        {
            id: 'folio_theriaca',
            subtab: 'herbar',
            icon: '📕',
            physicalForm: 'codex',
            titleKey: 'scrinium.folios.theriaca.title',
            lectio: { textKey: 'scrinium.folios.theriaca.lectio', cost: null },
            glossa: { textKey: 'scrinium.folios.theriaca.glossa', cost: { item: 'candle', amount: 3 } },
            arcanum: { textKey: 'scrinium.folios.theriaca.arcanum', cost: { item: 'candle', amount: 5 } },
        },

        // ══════════════════════════════════════════════════
        // BESTIÁŘ — 1 folio (první záznam)
        // ══════════════════════════════════════════════════

        // ── 1. Tytinillus — nález přes dvě nezávislé cesty:
        //      A) Titivillus craft-strike -> SecretsSystem.unlockFolioById (game.js)
        //      B) nález "titivillus_spis" při Úklidu hospodářství -> modal -> Předat do Scrinia
        //    Čistě narativní — žádný mechanický reward (List 4 jen popisuje
        //    existující Titivillus craft-mechaniku, nic nemění).
        {
            id: 'folio_titivillus_bestiar',
            subtab: 'bestiar',
            icon: '🐐',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.titivillus_bestiar.title',
            lectio: {
                textKey: 'scrinium.folios.titivillus_bestiar.lectio',
                cost: null,
                image: '/bestiary/titivillus.jpg',   // volitelné pole — jen tohle folio ho používá
            },
            glossa: {
                textKey: 'scrinium.folios.titivillus_bestiar.glossa',
                cost: { item: 'candle', amount: 3 },
            },
            arcanum: {
                textKey: 'scrinium.folios.titivillus_bestiar.arcanum',
                cost: { item: 'candle', amount: 5 },
            },
        },

        // ── 2. Acedia (Daemon meridianus) — nález přes dvě cesty:
        //      A) první reálný zásah Zbožnost-eroze (Vigor<30% týden) -> auto-unlock
        //      B) nález "acedia_spis" při úklidu chlévu zanedbaného ≥3 dny,
        //         šance roste s dalšími signály zanedbání (nízký Vigor,
        //         zaseklé Manufaktura taby) -> modal -> Předat do Scrinia
        //    Čistě narativní — popisuje existující Zbožnost erosion mechaniku,
        //    nic nemění.
        {
            id: 'folio_acedia_bestiar',
            subtab: 'bestiar',
            icon: '😴',
            physicalForm: 'leaf',
            titleKey: 'scrinium.folios.acedia_bestiar.title',
            lectio: {
                textKey: 'scrinium.folios.acedia_bestiar.lectio',
                cost: null,
                image: '/bestiary/acedia.jpg',
            },
            glossa: {
                textKey: 'scrinium.folios.acedia_bestiar.glossa',
                cost: { item: 'candle', amount: 3 },
            },
            arcanum: {
                textKey: 'scrinium.folios.acedia_bestiar.arcanum',
                cost: { item: 'candle', amount: 5 },
            },
        },

    ], // konec folios[]

}; // konec ScriniumDB