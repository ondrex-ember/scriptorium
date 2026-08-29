// ═══════════════════════════════════════════════════════════════════════════
// DECAY SYSTEM v1 (B2 — simplified)
// Denní kažení zásob. Gate: tech_inventarium.
// Model: %/den z počtu kusů (bez timestampů per kus).
// Modifikátory: myši (zrní/chléb/sýr), sklady (redukce), overflow (×2).
// v2 plán: per-instance stáří, konzervace, sezónní vlivy.
// ═══════════════════════════════════════════════════════════════════════════

const DecaySystem = {

    DAY_MS: 24 * 60 * 60 * 1000,
    MICE_CAP: 30,   // max myší populace (30 myší = ×1.75 decay mult)

    // ── Sazby kažení (podíl/den) — single source of truth ────────────────
    // mice:true → položka podléhá myšímu multiplikátoru
    // flies:true → položka podléhá mouchovému multiplikátoru (viz fliesMult)
    DECAY_RATES: {
        milk:         { rate: 0.30 },
        goat_milk:    { rate: 0.30 },
        cream:        { rate: 0.30 },
        meat:         { rate: 0.20, flies: true },
        // udirna-mrd (7.8.2026): beef/mutton tu dřív chyběly úplně —
        // syrové hovězí/skopové dnes vůbec nehnilo (bug). pork nový.
        pork:         { rate: 0.20, flies: true },
        beef:         { rate: 0.20, flies: true },
        mutton:       { rate: 0.20, flies: true },
        salted_pork:  { rate: 0.05 },
        salted_beef:  { rate: 0.05 },
        fish:         { rate: 0.20, flies: true },
        carp:         { rate: 0.20, flies: true },
        chicken_meat: { rate: 0.20, flies: true },
        cooked_meat:  { rate: 0.15, flies: true },
        cooked_fish:  { rate: 0.15, flies: true },
        bread:        { rate: 0.10, mice: true },
        stew:         { rate: 0.15, flies: true },
        butter:       { rate: 0.08 },
        buttermilk:   { rate: 0.08 },
        berries:      { rate: 0.15 },
        mushroom:     { rate: 0.15 },
        egg:          { rate: 0.05 },
        cheese:       { rate: 0.03, mice: true, flies: true },
        // coquina-tier1-mrd (7.8.2026): domácí uzené — mezi syrovým (0.20)
        // a pravou Udírnou (0.005) — vyplatí se postoupit na Tier 3.
        smoked_meat_home: { rate: 0.05 },
        // coquina-tier2-mrd (7.8.2026): Černá kuchyně — mezistupeň mezi
        // Tier 1 (0.05) a Tier 3 (0.005), plynulá škála.
        smoked_meat_chimney: { rate: 0.02 },
        // udirna-mrd (7.8.2026): sníženo z 0.01 na 0.005 — Tier 3 má být
        // 10× lepší než Tier 1 (smoked_meat_home 0.05), ne jen 5×.
        cured_meat:   { rate: 0.005, mice: true },
        cured_beef:   { rate: 0.005, mice: true },
        // coquina-tier4-mrd (7.8.2026): almond_paste = čerstvá mletá pasta,
        // mirror butter. pork_pie_abbot = tvrdá krusta funguje jako
        // "středověký tupperware" (dle historického podkladu), vydrží týdny.
        almond_paste: { rate: 0.08 },
        pork_pie_abbot: { rate: 0.02, mice: true },
        // coquina-tier1-mrd (7.8.2026): hotová kaše, mirror stew
        pohanka_s_cesnekem: { rate: 0.15, flies: true },
        // coquina-tier1-mrd (7.8.2026): kysané zelí je trvanlivé (kvašení
        // konzervuje), mirror kdoule/zavařenina — pomalý rozklad.
        sauerkraut: { rate: 0.03 },
        zelnacka_s_kroupami: { rate: 0.15, flies: true },
        pucalka: { rate: 0.15, flies: true },
        ovesna_kase: { rate: 0.15, flies: true },
        cibulova_jicha: { rate: 0.15, flies: true },
        placky_z_popela: { rate: 0.10 },
        vajecna_jicha: { rate: 0.15, flies: true },
        stika_s_maslem: { rate: 0.15, flies: true },
        lard:         { rate: 0.01 },
        rye_grain:    { rate: 0.005, mice: true },
        rye_grain_1:  { rate: 0.005, mice: true },
        rye_grain_2:  { rate: 0.005, mice: true },
        wheat_grain:  { rate: 0.005, mice: true },
        wheat_grain_1: { rate: 0.005, mice: true },
        wheat_grain_2: { rate: 0.005, mice: true },
        barley:       { rate: 0.005, mice: true },
        oats:         { rate: 0.005, mice: true },
        millet:       { rate: 0.005, mice: true },
        peas:         { rate: 0.005, mice: true },

        // MAT kategorie (decay-audit-mrd, 9.8.2026) — sazbová pásma podle kategorie
        // fresh_dairy (0.25)
        tvaroh: { rate: 0.25 },
        wort: { rate: 0.25 },
        mustum_klevner: { rate: 0.25 },
        mustum_frankovka: { rate: 0.25 },
        mustum_tramin: { rate: 0.25 },
        cow_milk: { rate: 0.25 },
        // fresh_animal (0.18)
        fat: { rate: 0.18, flies: true },
        tallow: { rate: 0.18, flies: true },
        hide: { rate: 0.18, flies: true },
        raw_hide: { rate: 0.18, flies: true },
        calf_hide: { rate: 0.18, flies: true },
        lamb_hide: { rate: 0.18, flies: true },
        goat_hide: { rate: 0.18, flies: true },
        soaked_hide: { rate: 0.18, flies: true },
        stretched_hide: { rate: 0.18, flies: true },
        premium_soaked_hide: { rate: 0.18, flies: true },
        premium_stretched_hide: { rate: 0.18, flies: true },
        feather: { rate: 0.18, flies: true },
        feather_hen: { rate: 0.18, flies: true },
        pigeon_dung: { rate: 0.18, flies: true },
        manure: { rate: 0.18, flies: true },
        bone: { rate: 0.18, flies: true },
        rabbit_pelt: { rate: 0.18, flies: true },
        mouse: { rate: 0.18, flies: true },
        caught_small_game: { rate: 0.18, flies: true },
        cervec: { rate: 0.18, flies: true },
        rennet: { rate: 0.18, flies: true },
        scraps: { rate: 0.18, flies: true },
        // fresh_fish_small (0.15) — fry/carp_young jsou ŽIVÉ ryby v rybníce
        // (viz items.js "Vyrůstá v rybníce"/"z výtažníku, potřebuje čas"),
        // worms jsou krmná zásoba žížal — flies odstraněno (decay-mice-
        // flies-audit, 29.8.2026), base rate zůstává.
        fry: { rate: 0.15 },
        carp_young: { rate: 0.15 },
        worms: { rate: 0.15 },
        // fresh_produce (0.13)
        herb_red: { rate: 0.13 },
        herb_yellow: { rate: 0.13 },
        herb_blue: { rate: 0.13 },
        mint: { rate: 0.13 },
        pollen: { rate: 0.13 },
        bee_bread: { rate: 0.05 },
        linden_blossom: { rate: 0.13 },
        grass: { rate: 0.13 },
        leaves: { rate: 0.13 },
        cannabis: { rate: 0.13 },
        acorn: { rate: 0.13 },
        acorns: { rate: 0.13 },
        // cured_textile (0.03)
        leather: { rate: 0.03 },
        wild_leather: { rate: 0.03 },
        wool: { rate: 0.03 },
        wool_thread: { rate: 0.03 },
        linen_thread: { rate: 0.03 },
        hemp_fiber: { rate: 0.03 },
        flax_fiber: { rate: 0.03 },
        rags: { rate: 0.03 },
        pulp: { rate: 0.03 },
        hedvabi: { rate: 0.03 },
        leather_cords: { rate: 0.03 },
        fiber: { rate: 0.03 },
        rope: { rate: 0.03 },
        dreveky: { rate: 0.03 },
        kozene_boty: { rate: 0.03 },
        // dried_herb_spice (0.02)
        dried_herbs_bundle: { rate: 0.02, mice: true },
        hemp_pouch: { rate: 0.02, mice: true },
        dried_cannabis: { rate: 0.02, mice: true },
        pepr_cerny: { rate: 0.02, mice: true },
        zazvor: { rate: 0.02, mice: true },
        hrebicek: { rate: 0.02, mice: true },
        muskat: { rate: 0.02, mice: true },
        muskatovy_kvet: { rate: 0.02, mice: true },
        skorice: { rate: 0.02, mice: true },
        safran: { rate: 0.02, mice: true },
        almond: { rate: 0.02, mice: true },
        ground_spice: { rate: 0.02, mice: true },
        seeds_herb: { rate: 0.02, mice: true },
        acorn_roasted: { rate: 0.02, mice: true },
        chicory_roasted: { rate: 0.02, mice: true },
        galium: { rate: 0.02, mice: true },
        hostia: { rate: 0.02, mice: true },
        slany_sled: { rate: 0.02, mice: true },
        // grain_seed (0.005)
        seeds_vegetable: { rate: 0.005, mice: true },
        seeds_yellow: { rate: 0.005, mice: true },
        seeds_blue: { rate: 0.005, mice: true },
        seeds_mint: { rate: 0.005, mice: true },
        seeds_thyme: { rate: 0.005, mice: true },
        seeds_kopr: { rate: 0.005, mice: true },
        seeds_sage: { rate: 0.005, mice: true },
        seeds_fennel: { rate: 0.005, mice: true },
        seeds_wormwood: { rate: 0.005, mice: true },
        seeds_hyssop: { rate: 0.005, mice: true },
        seeds_yarrow: { rate: 0.005, mice: true },
        seeds_plantain: { rate: 0.005, mice: true },
        seeds_leek: { rate: 0.005, mice: true },
        seeds_carrot: { rate: 0.005, mice: true },
        seeds_onion: { rate: 0.005, mice: true },
        seeds_cabbage: { rate: 0.005, mice: true },
        seeds_radish: { rate: 0.005, mice: true },
        seeds_turnip: { rate: 0.005, mice: true },
        seeds_garlic: { rate: 0.005, mice: true },
        seeds_rye: { rate: 0.005, mice: true },
        seeds_wheat: { rate: 0.005, mice: true },
        seeds_barley: { rate: 0.005, mice: true },
        seeds_oats: { rate: 0.005, mice: true },
        seeds_millet: { rate: 0.005, mice: true },
        seeds_pohanka: { rate: 0.005, mice: true },
        seeds_peas: { rate: 0.005, mice: true },
        seeds_lentils: { rate: 0.005, mice: true },
        seeds_vikev: { rate: 0.005, mice: true },
        seeds_flax: { rate: 0.005, mice: true },
        seeds_mandrake: { rate: 0.005, mice: true },
        seeds_belladonna: { rate: 0.005, mice: true },
        seeds_poppy: { rate: 0.005, mice: true },
        seeds_nettle: { rate: 0.005, mice: true },
        seeds_cannabis: { rate: 0.005, mice: true },
        seeds_hops: { rate: 0.005, mice: true },
        pohanka: { rate: 0.005, mice: true },
        lentils: { rate: 0.005, mice: true },
        vikev: { rate: 0.005, mice: true },
        grain: { rate: 0.005, mice: true },
        grain_feed: { rate: 0.005, mice: true },
        flour: { rate: 0.005, mice: true },
        kroupy: { rate: 0.005, mice: true },
        flour_1: { rate: 0.005, mice: true },
        flour_2: { rate: 0.005, mice: true },
        hay: { rate: 0.005, mice: true },
        straw: { rate: 0.005, mice: true },
        couch_grass_flour: { rate: 0.005, mice: true },
        feed_meal: { rate: 0.005, mice: true },
        // preserve_slow (0.01) — decay-mice-flies-audit (29.8.2026): vosk/
        // propolis/pryskyřice/lepidlo/sůl přesunuty do DURABLE_DECAY_RATES.
        // Historicky proslulý svou nezkazitelností (sůl je sama konzervant),
        // ne "kažením" jako maso/sýr — viz DURABLE_DECAY_RATES mineral_glass.
        hops: { rate: 0.01 },
        linseed_oil: { rate: 0.01 },
        // wood_organic (0.008)
        wood: { rate: 0.008 },
        stick: { rate: 0.008 },
        bark: { rate: 0.008 },
        log: { rate: 0.008 },
        plank: { rate: 0.008 },
        wicker: { rate: 0.008 },
        tanbark: { rate: 0.008 },
        // ash_lime (0.015)
        ash_water: { rate: 0.015 },
        vapno_paleny_fresh: { rate: 0.015 },
        vapno_paleny_mature: { rate: 0.015 },
        vapno_hasene_fresh: { rate: 0.015 },
        vapno_hasene_mature: { rate: 0.015 },
        compost: { rate: 0.015 },
        bonemeal: { rate: 0.015 },
        charcoal: { rate: 0.015 },
        // sapling (0.02)
        seed_apple: { rate: 0.02 },
        seed_pear: { rate: 0.02 },
        seed_plum: { rate: 0.02 },
        seed_cherry: { rate: 0.02 },
        seed_walnut: { rate: 0.02 },
        seed_mulberry: { rate: 0.02 },
        seed_quince: { rate: 0.02 },
        seed_sorb: { rate: 0.02 },
        seed_rowan: { rate: 0.02 },
        seed_linden: { rate: 0.02 },
        viticis_belina: { rate: 0.02 },
        viticis_klevner: { rate: 0.02 },
        viticis_frankovka: { rate: 0.02 },
        viticis_tramin: { rate: 0.02 },
        viticis_modry_janek: { rate: 0.02 },
        viticis_baco: { rate: 0.02 },
        // dried_herb_spice_book (0.01)
        book_binding: { rate: 0.01 },
        book_cover: { rate: 0.01 },
        ink_pouch: { rate: 0.01 },
        quires: { rate: 0.01 },
        sewn_block: { rate: 0.01 },
        unfitted_codex: { rate: 0.01 },

        // FOOD kategorie (decay-audit-mrd, 9.8.2026) — sazbová pásma podle kategorie
        // raw_meat_fish (0.2)
        veal: { rate: 0.2, flies: true },
        rabbit_meat: { rate: 0.2, flies: true },
        crayfish: { rate: 0.2, flies: true },
        snail: { rate: 0.2, flies: true },
        frog_legs: { rate: 0.2, flies: true },
        pstruh: { rate: 0.2, flies: true },
        uhor: { rate: 0.2, flies: true },
        vyza_maso: { rate: 0.2, flies: true },
        // decay-mice-flies-audit (29.8.2026): sádky/rybník drží RYBY ŽIVÉ
        // (viz items.js popis "drží se živá v sádce"/"vyrůstá v rybníce") —
        // mouchy nekazí živou rybu ve vodě. flies odstraněno, base rate
        // zůstává (přirozená ztráta/péče, ne mouchový mechanismus).
        kapr_sadky_fresh: { rate: 0.2 },
        stika_sadky_fresh: { rate: 0.2 },
        vyza_sadky_fresh: { rate: 0.2 },
        stika: { rate: 0.2, flies: true },
        morel: { rate: 0.2, flies: true },
        porcini: { rate: 0.2, flies: true },
        saffron_milk_cap: { rate: 0.2, flies: true },
        quince: { rate: 0.2, flies: true },
        kapr_sadky_purified: { rate: 0.2 },
        stika_sadky_purified: { rate: 0.2 },
        // cooked_dish (0.15)
        braised_beef: { rate: 0.15, flies: true },
        cooked_beef: { rate: 0.15, flies: true },
        cooked_chicken: { rate: 0.15, flies: true },
        cooked_mutton: { rate: 0.15, flies: true },
        cooked_rabbit: { rate: 0.15, flies: true },
        mushroom_soup: { rate: 0.15, flies: true },
        spring_herb_porridge: { rate: 0.15, flies: true },
        rosehip_sauce: { rate: 0.15, flies: true },
        crayfish_boiled: { rate: 0.15, flies: true },
        snails_black_sauce: { rate: 0.15, flies: true },
        morel_stuffed: { rate: 0.15, flies: true },
        smazenice: { rate: 0.15, flies: true },
        stew_koreni: { rate: 0.15, flies: true },
        roast_beef: { rate: 0.15, flies: true },
        roast_rabbit_dish: { rate: 0.15, flies: true },
        pecena_slanecka: { rate: 0.15, flies: true },
        repny_prejt: { rate: 0.15, flies: true },
        raci_s_koprem: { rate: 0.15, flies: true },
        tvarohove_tasticky: { rate: 0.15, flies: true },
        frog_legs_fried: { rate: 0.15, flies: true },
        chicory_drink: { rate: 0.15, flies: true },
        acorn_brew: { rate: 0.15, flies: true },
        // baked_good (0.1)
        berry_pie: { rate: 0.1, mice: true },
        berry_pie_fine: { rate: 0.1, mice: true },
        berry_pie_fine_1: { rate: 0.1, mice: true },
        berry_pie_koreni: { rate: 0.1, mice: true },
        bread_fine: { rate: 0.1, mice: true },
        bread_fine_1: { rate: 0.1, mice: true },
        famine_bread: { rate: 0.1, mice: true },
        // fresh_veg (0.12)
        cabbage: { rate: 0.12 },
        carrot: { rate: 0.12 },
        onion: { rate: 0.12 },
        turnip: { rate: 0.12 },
        garlic: { rate: 0.12 },
        leek: { rate: 0.12 },
        radish: { rate: 0.12 },
        potato: { rate: 0.12 },
        burdock_root: { rate: 0.12 },
        cattail_root: { rate: 0.12 },
        couch_grass: { rate: 0.12 },
        dandelion: { rate: 0.12 },
        goosefoot: { rate: 0.12 },
        ground_elder: { rate: 0.12 },
        sorrel: { rate: 0.12 },
        burdock_root_baked: { rate: 0.12 },
        // fresh_fruit (0.12)
        apple: { rate: 0.12 },
        pear: { rate: 0.12 },
        cherry: { rate: 0.12 },
        plum: { rate: 0.12 },
        grapes_baco: { rate: 0.12 },
        grapes_belina: { rate: 0.12 },
        grapes_frankovka: { rate: 0.12 },
        grapes_klevner: { rate: 0.12 },
        grapes_modry_janek: { rate: 0.12 },
        grapes_tramin: { rate: 0.12 },
        cornel_cherry: { rate: 0.12 },
        mulberry: { rate: 0.12 },
        rowan: { rate: 0.12 },
        sorb: { rate: 0.12 },
        walnut: { rate: 0.12 },
        rosehip: { rate: 0.12 },
        sloe: { rate: 0.12 },
        wild_fruit: { rate: 0.12 },
        linden_fruit: { rate: 0.12 },
        beechnut: { rate: 0.12 },
        bracket_fungus: { rate: 0.12 },
        // cheese_fresh (0.15)
        cow_cheese_fresh: { rate: 0.15, mice: true },
        goat_cheese_fresh: { rate: 0.15, mice: true },
        sheep_cheese_fresh: { rate: 0.15, mice: true },
        syrecky_fresh: { rate: 0.15, mice: true },
        // cheese_mature (0.05)
        cow_cheese_mature: { rate: 0.05, mice: true },
        goat_cheese_mature: { rate: 0.05, mice: true },
        sheep_cheese_mature: { rate: 0.05, mice: true },
        syrecky_mature: { rate: 0.05, mice: true },
        // cheese_aged (0.02)
        cow_cheese_aged: { rate: 0.02, mice: true },
        goat_cheese_aged: { rate: 0.02, mice: true },
        sheep_cheese_aged: { rate: 0.02, mice: true },
        // preserve (0.03)
        sloe_jam: { rate: 0.03 },
        pickled_mushrooms: { rate: 0.03 },
        dried_wild_fruit: { rate: 0.03 },
        raisins: { rate: 0.03 },
        // egg_other (0.05)
        duck_egg: { rate: 0.05 },
        pigeon_egg: { rate: 0.05 },
        quail_egg: { rate: 0.05 },
        // fermented_drink (0.01)
        beer: { rate: 0.01 },
        cervisia_nigra: { rate: 0.01 },
        prima_cervisia: { rate: 0.01 },
        mustum: { rate: 0.01 },
        vinum: { rate: 0.01 },
        vinum_baci: { rate: 0.01 },
        vinum_obscurum: { rate: 0.01 },
        vinum_praeclarum: { rate: 0.01 },
        vinum_rubrum: { rate: 0.01 },
        wine: { rate: 0.01 },
        // herbal_drink (0.08)
        herbal_tea: { rate: 0.08 },
        hildegard_tisane: { rate: 0.08 },
        linden_tea: { rate: 0.08 },
        // near_eternal (0.002)
        water: { rate: 0.002 },
        spring_water: { rate: 0.002 },
        holy_water: { rate: 0.002 },
        vinegar: { rate: 0.002 },
        honey: { rate: 0.002 },
        // caviar (0.04)
        vyza_jikry: { rate: 0.04 },
        pryk: { rate: 0.04 },
    },

    // ── DURABLE_DECAY_RATES — trvanlivé zboží (nástroje, minerály, kov, kůže,
    // dřevo, textil, sklo). Mimo běžné jídelní kažení — vlastní, mnohem
    // pomalejší tabulka, chráněná skladem binárně (viz durableStorageProtects()),
    // s kaskádovou výjimkou pro krizi zásob (viz dailyTick + perishableStockLow()).
    // decay-audit-durables-mrd (9.8.2026)
    DURABLE_DECAY_RATES: {
        // mineral_glass (0.00002)
        alembic: { rate: 0.00002 },
        alum: { rate: 0.00002 },
        beryllus: { rate: 0.00002 },
        chalk: { rate: 0.00002 },
        chrlic: { rate: 0.00002 },
        clay: { rate: 0.00002 },
        cornu_cervi: { rate: 0.00002 },
        crushed_stone: { rate: 0.00002 },
        cut_stone: { rate: 0.00002 },
        drahokam_ulomek: { rate: 0.00002 },
        flint: { rate: 0.00002 },
        fly_trap_glass: { rate: 0.00002 },
        glass_bowl: { rate: 0.00002 },
        glass_flask: { rate: 0.00002 },
        glass_goblet: { rate: 0.00002 },
        glass_jug: { rate: 0.00002 },
        glass_mirror: { rate: 0.00002 },
        glass_pitcher: { rate: 0.00002 },
        glass_stopper: { rate: 0.00002 },
        glass_tankard: { rate: 0.00002 },
        glass_vase: { rate: 0.00002 },
        iron_ore: { rate: 0.00002 },
        nahrobek: { rate: 0.00002 },
        naramek_sklo_hnedy: { rate: 0.00002 },
        naramek_sklo_modry: { rate: 0.00002 },
        naramek_sklo_zeleny: { rate: 0.00002 },
        oculi: { rate: 0.00002 },
        palice_kamenna: { rate: 0.00002 },
        paternoster_beads: { rate: 0.00002 },
        pottery_vessel: { rate: 0.00002 },
        pumice: { rate: 0.00002 },
        reliquia: { rate: 0.00002 },
        rock: { rate: 0.00002 },
        sal_ammoniac: { rate: 0.00002 },
        sandarak: { rate: 0.00002 },
        sharp_stone: { rate: 0.00002 },
        stribrny_prut: { rate: 0.00002 },
        vapenec: { rate: 0.00002 },
        verzino: { rate: 0.00002 },
        whetstone: { rate: 0.00002 },
        whetstone_rock: { rate: 0.00002 },
        window_roundel: { rate: 0.00002 },
        zlaty_prut: { rate: 0.00002 },
        // decay-mice-flies-audit (29.8.2026): vosk/propolis/pryskyřice/
        // lepidlo/sůl — z DECAY_RATES (kažení, mirror maso/sýr, nesmyslné).
        // Reálně proslulý nezkazitelností (sůl = konzervant sám o sobě,
        // pryskyřice/vosk se historicky používaly ke konzervaci jiných věcí).
        beeswax: { rate: 0.00002 },
        propolis: { rate: 0.00002 },
        propolis_tinktura: { rate: 0.00002 },
        propolis_tinktura_vyzrala: { rate: 0.00002 },
        resin_spruce: { rate: 0.00002 },
        resin_pine: { rate: 0.00002 },
        smola: { rate: 0.00002 },
        resin_styrax: { rate: 0.00002 },
        resin_olibanum: { rate: 0.00002 },
        glue: { rate: 0.00002 },
        klih: { rate: 0.00002 },
        salt: { rate: 0.00002 },
        // iron_tool (0.0003)
        anvil: { rate: 0.0003 },
        britva_chirurgus: { rate: 0.0003 },
        britva_cizi: { rate: 0.0003 },
        britva_kovarska: { rate: 0.0003 },
        cooking_pot: { rate: 0.0003 },
        font_set: { rate: 0.0003 },
        hrebiky: { rate: 0.0003 },
        iron_axe: { rate: 0.0003 },
        iron_flail: { rate: 0.0003 },
        iron_ingot: { rate: 0.0003 },
        iron_pickaxe: { rate: 0.0003 },
        iron_saw: { rate: 0.0003 },
        iron_scythe: { rate: 0.0003 },
        iron_shovel: { rate: 0.0003 },
        iron_sickle: { rate: 0.0003 },
        iron_spade: { rate: 0.0003 },
        iron_tongs: { rate: 0.0003 },
        kovani: { rate: 0.0003 },
        lead_alloy: { rate: 0.0003 },
        metal_bosses: { rate: 0.0003 },
        metal_clasps: { rate: 0.0003 },
        palice_zelezna: { rate: 0.0003 },
        printing_type: { rate: 0.0003 },
        repair_kit: { rate: 0.0003 },
        sada_podkov: { rate: 0.0003 },
        tea_kettle: { rate: 0.0003 },
        worn_iron_axe: { rate: 0.0003 },
        worn_iron_flail: { rate: 0.0003 },
        worn_iron_pickaxe: { rate: 0.0003 },
        worn_iron_saw: { rate: 0.0003 },
        worn_iron_scythe: { rate: 0.0003 },
        worn_iron_shovel: { rate: 0.0003 },
        worn_iron_sickle: { rate: 0.0003 },
        worn_iron_spade: { rate: 0.0003 },
        worn_iron_tongs: { rate: 0.0003 },
        worn_type: { rate: 0.0003 },
        // wood_tool (0.0005)
        backgammon_board: { rate: 0.0005 },
        barrel_tool: { rate: 0.0005 },
        basket: { rate: 0.0005 },
        bedna: { rate: 0.0005 },
        bucket: { rate: 0.0005 },
        cheese_mold: { rate: 0.0005 },
        churn: { rate: 0.0005 },
        draughts_board: { rate: 0.0005 },
        fishing_rod: { rate: 0.0005 },
        fly_trap_paper: { rate: 0.0005 },
        french_deck: { rate: 0.0005 },
        goose_quill: { rate: 0.0005 },
        hnefatafl_board: { rate: 0.0005 },
        hoe: { rate: 0.0005 },
        karnoffel_deck: { rate: 0.0005 },
        loaded_dice: { rate: 0.0005 },
        mousetrap: { rate: 0.0005 },
        organ: { rate: 0.0005 },
        pestle: { rate: 0.0005 },
        playing_cards: { rate: 0.0005 },
        primero_deck: { rate: 0.0005 },
        quill: { rate: 0.0005 },
        // decay-mice-flies-audit (29.8.2026): quill_premium byl omylem v
        // DECAY_RATES "fresh_animal" (flies:true, 0.18/den) — je to hotovej
        // psací brk, ne syrová surovina. Mirror quill/goose_quill.
        quill_premium: { rate: 0.0005 },
        rithmomachia_board: { rate: 0.0005 },
        sack: { rate: 0.0005 },
        senet_board: { rate: 0.0005 },
        stone_axe: { rate: 0.0005 },
        stone_flail: { rate: 0.0005 },
        stone_knife: { rate: 0.0005 },
        stone_pickaxe: { rate: 0.0005 },
        stone_saw: { rate: 0.0005 },
        stone_scythe: { rate: 0.0005 },
        stone_shovel: { rate: 0.0005 },
        stone_sickle: { rate: 0.0005 },
        stone_spade: { rate: 0.0005 },
        storage_container: { rate: 0.0005 },
        tabula: { rate: 0.0005 },
        tinderbox: { rate: 0.0005 },
        truhla_i: { rate: 0.0005 },
        truhla_ii: { rate: 0.0005 },
        ur_board: { rate: 0.0005 },
        watering_can: { rate: 0.0005 },
        wooden_bowl: { rate: 0.0005 },
        wooden_flail: { rate: 0.0005 },
        // leather_tool (0.0007)
        bellows: { rate: 0.0007 },
        cushion: { rate: 0.0007 },
        quill_case: { rate: 0.0007 },
        scribes_belt: { rate: 0.0007 },
        scrinium_case: { rate: 0.0007 },
        water_pouch: { rate: 0.0007 },
        // textile_worn (0.0008)
        kutna: { rate: 0.0008 },
        roucho_bile: { rate: 0.0008 },
        roucho_cervene: { rate: 0.0008 },
        roucho_fialove: { rate: 0.0008 },
        roucho_zelene: { rate: 0.0008 },
    },

    // Existuje jakákoliv skladová budova → trvanlivé zboží plně chráněno (0 %),
    // dokud nenastane kaskáda (viz níže).
    durableStorageProtects: function() {
        const s = GameState.storage || {};
        return !!((s.almarium && s.almarium.built) || (s.cella && s.cella.built)
            || (s.horreum && s.horreum.built) || (s.old_cellars && s.old_cellars.built));
    },

    // "Rychle kazitelné" = vše z DECAY_RATES (jídlo/suroviny). Pod 20 kusů
    // celkem = došly zásoby na obětování při přetečení, kaskáda se spustí.
    perishableStockLow: function() {
        const inv = GameState.inventory || {};
        let total = 0;
        for (const id of Object.keys(this.DECAY_RATES)) total += (inv[id] || 0);
        return total < 20;
    },

    // ── Gate ──────────────────────────────────────────────────────────────
    isActive: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_inventarium'));
    },

    _ensureState: function() {
        if (!GameState.decay) GameState.decay = { lastTick: 0, lastLosses: [] };
        return GameState.decay;
    },

    // ── Modifikátory ──────────────────────────────────────────────────────
    // Myší multiplikátor (jen pro mice:true položky)
    miceMult: function() {
        const n = (GameState.mice && GameState.mice.count) || 0;
        return 1 + n / 40;   // mírné: 30 myší = ×1.75
    },

    // Myší vliv na Zahony (25.7.2026 sprint) — penalizace výnosu, strop −30 %
    // při 30+ myších. Vkládá se do totalMult vedle conversiEfficiency.
    miceGardenMult: function() {
        const n = (GameState.mice && GameState.mice.count) || 0;
        return Math.max(0.7, 1 - n * 0.01);
    },

    // Myší vliv na Dvůr (25.7.2026 sprint) — šance, že krmivo "zmizí" dřív,
    // než dojde na zvíře (myši byly rychlejší). Strop 40 % při 27+ myších.
    // Zvíře ten den zůstane nekrmené i přes plný sklad — skutečný blocker,
    // dokud hráč populaci nedostane pod kontrolu (kočka/pastičky).
    miceFeedTheftChance: function() {
        const n = (GameState.mice && GameState.mice.count) || 0;
        return Math.min(0.4, n * 0.015);
    },

    // Mouchový multiplikátor (jen pro flies:true položky, monastery-decay-mrd).
    // Aktivní hlavně v teplém období (květen–září). Hlavní faktor: postavené
    // Dvůr budovy + neuklizený hnůj (manure) ve skladu — vysoký stav manure
    // znamená, že hráč dlouho needlil chlévy. Vedlejší faktor: syrové maso/
    // ryby/sýr v inventáři (flies:true položky), menší váha.
    FLIES_FARMYARD_BUILDINGS: ['henhouse', 'sheepfold', 'cowbyre', 'pigsty', 'goatpen', 'rabbitry', 'stable', 'donkeyStall'],
    FLIES_MANURE_THRESHOLD: 20, // manure ve skladu, při kterém je penFactor na maximu
    fliesMult: function() {
        const month = new Date().getMonth() + 1; // 1–12
        const isFlySeason = (month >= 5 && month <= 9);
        if (!isFlySeason) return 1;

        const s = GameState.storage || {};
        let builtPens = 0;
        this.FLIES_FARMYARD_BUILDINGS.forEach(key => {
            if (GameState[key] && GameState[key].built) builtPens++;
        });
        const manureStock = (GameState.inventory && GameState.inventory['manure']) || 0;

        // Budovy + neuklizený hnůj — společný hlavní faktor (0–0.6)
        const penFactor = Math.min(1, builtPens / this.FLIES_FARMYARD_BUILDINGS.length) * 0.3;
        const manureFactor = Math.min(1, manureStock / this.FLIES_MANURE_THRESHOLD) * 0.3;
        // Syrové maso/ryby/sýr v inventáři — vedlejší faktor (0–0.4)
        let rawFoodStock = 0;
        Object.entries(this.DECAY_RATES).forEach(([id, def]) => {
            if (def.flies) rawFoodStock += (GameState.inventory && GameState.inventory[id]) || 0;
        });
        const rawFoodFactor = Math.min(1, rawFoodStock / 15) * 0.4;

        // Mucholapky (skleněná i papírová, funkčně stejné) — snižují výsledný
        // faktor, cap 3 aktivní (po vzoru mousetrap v miceTick), diminishing
        // returns na dalších kusech.
        const traps = ((GameState.inventory && GameState.inventory['fly_trap_glass']) || 0)
            + ((GameState.inventory && GameState.inventory['fly_trap_paper']) || 0);
        const trapReduction = Math.min(3, traps) * 0.15; // až −0.45 s 3+ pastmi

        return Math.max(1, 1 + penFactor + manureFactor + rawFoodFactor - trapReduction); // rozsah 1.0–2.0
    },

    // Redukce dle nejlepšího postaveného skladu
    storageReduction: function() {
        const s = GameState.storage || {};
        if (s.horreum  && s.horreum.built)  return 0.30;  // −70 %
        if (s.cella    && s.cella.built)    return 0.50;  // −50 %
        if (s.almarium && s.almarium.built) return 0.70;  // −30 %
        return 1.0;
    },

    // Celková kapacita skladů (sjednoceno s renderBuildings logikou)
    totalCapacity: function() {
        const s = GameState.storage || {};
        let cap = 1000;   // base
        if (s.almarium && s.almarium.built) cap += 200;
        if (s.cella    && s.cella.built)    cap += 600;
        if (s.horreum  && s.horreum.built)  cap += 1600;
        if (s.old_cellars && s.old_cellars.built) cap += 500;
        return cap;       // max 3900
    },

    // Typy nepočítané do kapacity (nástroje na zdi, zvířata ve chlévě, knihy v knihovně)
    CAP_EXEMPT_TYPES: ['tool', 'animal', 'lore'],

    countsTowardCap: function(id) {
        const item = (typeof ItemsDB !== 'undefined') ? ItemsDB[id] : null;
        if (!item) return true;
        return !this.CAP_EXEMPT_TYPES.includes(item.type);
    },

    totalStock: function() {
        const inv = GameState.inventory || {};
        let s = 0;
        for (const [id, v] of Object.entries(inv)) {
            if (typeof v === 'number' && v > 0 && this.countsTowardCap(id)) s += v;
        }
        return s;
    },

    isOverflow: function() {
        return this.totalStock() > this.totalCapacity();
    },

    // ── Myší populace — denní tick (běží VŽDY, i bez tech) ────────────────
    miceTick: function() {
        if (!GameState.mice) GameState.mice = { count: 3, lastTick: 0 };
        const m = GameState.mice;
        const now = Date.now();
        if (now - (m.lastTick || 0) < this.DAY_MS) return;
        m.lastTick = now;
        m.prevCount = m.count;   // pro trend v Myším panelu (tech_de_animalibus)

        // Spawn ∝ zásoby jídla/zrní; podzim+zima ×1.5 (myši táhnou do tepla)
        let foodStock = 0;
        const MICE_FOOD = ['rye_grain', 'rye_grain_1', 'rye_grain_2', 'wheat_grain', 'wheat_grain_1', 'wheat_grain_2', 'barley', 'oats', 'millet', 'peas', 'grain', 'bread', 'cheese', 'cured_meat'];
        MICE_FOOD.forEach(id => { foodStock += (GameState.inventory[id] || 0); });
        let spawn = Math.min(4, Math.floor(foodStock / 25) + 1);
        const month = new Date().getMonth();           // 0=led
        if (month >= 8 || month <= 1) spawn = Math.ceil(spawn * 1.5);   // září–únor
        m.count = Math.min(this.MICE_CAP, m.count + spawn);

        // Pastičky: každá −1 myš/den, 10% šance rozbití
        let traps = GameState.inventory['mousetrap'] || 0;
        if (traps > 0 && m.count > 0) {
            const effective = Math.min(3, traps);       // cap 3 aktivní pasti
            const caught = Math.min(m.count, effective);
            m.count -= caught;
            let broken = 0;
            for (let i = 0; i < effective; i++) if (Math.random() < 0.10) broken++;
            if (broken) {
                GameState.inventory['mousetrap'] = Math.max(0, traps - broken);
                if (typeof UI !== 'undefined' && UI.notify) UI.notify('🪤 ' + t('decay.trapBroken').replace('{n}', broken), true);
            }
        }

        // Přirozená úmrtnost
        if (m.count > 5 && Math.random() < 0.3) m.count -= 1;
    },

    // ── Denní tick (volán z game.js, self-guarded 24h) ────────────────────
    dailyTick: function() {
        this.miceTick();                       // myši žijí vždy
        if (!this.isActive()) return;          // decay až za tech_inventarium
        const st = this._ensureState();
        const now = Date.now();
        if (now - st.lastTick < this.DAY_MS) return;
        st.lastTick = now;

        const inv = GameState.inventory || {};
        const mMult = this.miceMult();
        const fMult = this.fliesMult();
        const sRed = this.storageReduction();
        const oMult = this.isOverflow() ? 2 : 1;

        // Bestiář — Belzebub, Cesta A: mouchy poprvé dosáhnou nejhoršího
        // stupně ("many", fliesMult > 1.7) → auto-odemkne. Idempotentní.
        if (fMult > 1.7 && typeof SecretsSystem !== 'undefined') {
            SecretsSystem.unlockFolioById('folio_belzebub_bestiar');
        }

        const losses = [];
        for (const [id, def] of Object.entries(this.DECAY_RATES)) {
            const count = inv[id] || 0;
            if (count <= 0) continue;
            let rate = def.rate * sRed * oMult;
            if (def.mice) rate *= mMult;
            if (def.flies) rate *= fMult;
            rate = Math.min(0.9, rate);

            const exact = count * rate;
            let lost = Math.floor(exact);
            if (Math.random() < (exact - lost)) lost += 1;   // pravděpodobnostní zbytek
            if (lost <= 0) continue;

            inv[id] = Math.max(0, count - lost);
            losses.push({ id, lost });
        }

        // ── Durable goods — vlastní, mnohem pomalejší tabulka. Chráněno
        // skladem binárně, kaskáda přepíše ochranu jen při overflow +
        // kriticky nízkých rychle kazitelných zásobách (decay-audit-
        // durables-mrd, 9.8.2026).
        const durableProtected = this.durableStorageProtects();
        const cascadeOverride = this.isOverflow() && this.perishableStockLow();
        if (!durableProtected || cascadeOverride) {
            for (const [id, def] of Object.entries(this.DURABLE_DECAY_RATES)) {
                const count = inv[id] || 0;
                if (count <= 0) continue;
                const exact = count * def.rate;
                let lost = Math.floor(exact);
                if (Math.random() < (exact - lost)) lost += 1;
                if (lost <= 0) continue;

                inv[id] = Math.max(0, count - lost);
                losses.push({ id, lost });
            }
        }

        st.lastLosses = losses;
        if (losses.length) this._notifyLosses(losses, oMult > 1);

        // Bestiář — Belzebub, Cesta B: nález mezi zkaženými zásobami, jen
        // když si k tomu reálně kažení dnes vzalo něco (losses.length > 0).
        if (losses.length > 0) {
            const alreadyFolio = GameState.scrinium && GameState.scrinium.folios
                && GameState.scrinium.folios['folio_belzebub_bestiar'] && GameState.scrinium.folios['folio_belzebub_bestiar'].found;
            const alreadyHeld = (GameState.inventory['belzebub_spis'] || 0) > 0;
            if (!alreadyFolio && !alreadyHeld && Math.random() < 0.06) {
                if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('belzebub_spis', 1);
                if (typeof Game !== 'undefined' && Game.showBelzebubSpisModal) setTimeout(function () { Game.showBelzebubSpisModal(); }, 300);
            }
        }

        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    _notifyLosses: function(losses, overflow) {
        const parts = losses.map(l => {
            const nm = (typeof iName === 'function') ? iName(l.id) : l.id;
            return `${l.lost}× ${nm}`;
        });
        let msg = t('decay.lossMsg').replace('{items}', parts.join(', '));
        if (overflow) msg += ' ' + t('decay.overflowNote');
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            NotificationSystem.panel('📦 ' + msg, 'warning');
        } else if (typeof UI !== 'undefined' && UI.notify) {
            UI.notify('📦 ' + msg, true);
        }
    },

    // ── Helpers pro Inventarium UI ────────────────────────────────────────
    // Efektivní denní sazba položky (po modifikátorech), null = nekazí se
    // qty (volitelné) — loose-herd sazba (viz FarmyardSystem) je qty-závislá
    // (√n škálování), na rozdíl od DECAY_RATES/DURABLE_DECAY_RATES kde na
    // qty nezáleží. Bez qty se pro zvířata vrátí null (stejné jako dřív).
    effectiveRate: function(id, qty) {
        const def = this.DECAY_RATES[id];
        if (def) {
            let rate = def.rate * this.storageReduction() * (this.isOverflow() ? 2 : 1);
            if (def.mice) rate *= this.miceMult();
            if (def.flies) rate *= this.fliesMult();
            return Math.min(0.9, rate);
        }
        const durableDef = this.DURABLE_DECAY_RATES[id];
        if (durableDef) {
            const protectedNow = this.durableStorageProtects() && !(this.isOverflow() && this.perishableStockLow());
            return protectedNow ? 0 : durableDef.rate;
        }
        // Volné stádo (loose-herd-mrd, 9.8.2026) — jiný systém (FarmyardSystem),
        // ale stejné volací místo, ať mají všechny UI seznamy jeden zdroj pravdy.
        if (qty > 0 && typeof FarmyardSystem !== 'undefined' && FarmyardSystem.LOOSE_HERD_SPECIES
            && FarmyardSystem.LOOSE_HERD_SPECIES.includes(id)) {
            return 0.15 / Math.sqrt(qty);
        }
        return null;
    },

    miceFuzzyShort: function() {
        const n = (GameState.mice && GameState.mice.count) || 0;
        if (n <= 1)  return t('decay.miceNone');
        if (n <= 6)  return t('decay.miceFew');
        if (n <= 15) return t('decay.miceSome');
        return t('decay.miceMany');
    },

    // Fuzzy text pro mouchy (monastery-decay-mrd) — na škále fliesMult (1.0–2.0)
    fliesFuzzyShort: function() {
        const m = this.fliesMult();
        if (m <= 1.05) return t('decay.fliesNone');
        if (m <= 1.4)  return t('decay.fliesFew');
        if (m <= 1.7)  return t('decay.fliesSome');
        return t('decay.fliesMany');
    },
};