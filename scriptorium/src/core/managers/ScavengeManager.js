// ═══ src/core/managers/ScavengeManager.js ═══
// Extrakce z game.js (Krok 2 / D7, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Scavenge/core actions + sezonní pomocné funkce.
// Původně Game.* na řádcích 2-87 (úvod souboru, LOST_ITEM_POOLS/
// SEASON_MODS/_seasonMult/_seasonRoll/_weightedSeasonPick/_scavenging) +
// 1150-1992 + 3147-3195 (HEAD po D1-D5+D8+D9+D10+D12+D13+cleanup).
// Tři nesouvislé bloky. Chování beze změny — pouze přesun + přepsání
// this.addItem/removeItem/useToolCharge -> Game.* (D8) a
// this._getApiarySeason -> Game._getApiarySeason (D4, oba cross-doménové,
// needitováno/hotovo dřív) a self-reference Game._scavenging ->
// ScavengeManager._scavenging (stěhuje se spolu z úvodu souboru).
const ScavengeManager = {
    _scavenging: false,

    // Tematické rozdělení lostItem nálezů (viz ItemsDB, lostItem:true) mezi
    // scavenge akce — každá skupina padá jen ze svého tematicky odpovídajícího
    // typu, místo jednoho universálního poolu. yard_cleanup si ponechává
    // přístup ke VŠEM 30 položkám (obecný úklid), ale se sníženou šancí.
    LOST_ITEM_POOLS: {
        basic: ['lost_key_1', 'lost_key_2', 'lost_key_3', 'lost_key_4', 'lost_key_5',
            'key_large_1', 'key_large_2', 'key_large_3',
            'lost_scroll_1', 'lost_scroll_2',
            'old_coin_1', 'old_coin_2', 'old_coin_3'],
        nature: ['flask_cut', 'clasp_hunter', 'clasp_monk', 'clasp_silver', 'clasp_leather', 'clasp_bronze',
            'pipe_large', 'pipe_small', 'rosarium', 'pilgrim_badge', 'sundial_pocket', 'inkwell_small'],
        foraging: ['torn_page', 'wax_seal', 'dried_herbs_bundle', 'hemp_pouch', 'mysterious_bulb'],
        // fishing-species-mrd (10.8.2026): 5 nových říčních nálezů
        fishing: ['old_boot', 'broken_pot_shard', 'drowned_coin', 'lost_fishing_hook', 'water_smoothed_amulet'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // seasonalita-scavenge-mrd.md (13.8.2026) — sezónní dostupnost scavenge
    // položek. Mirror Chronicon SEASON_MODS vzoru (data/actors.js), jen
    // kategorií (ItemsDB[id].seasonCat) místo per-aktér. Žádný tech gate
    // na sezónu samotnou (ambientní fakt světa) — jen na řešení (budoucí
    // tech_hon/tech_konzervace). [jaro, léto, podzim, zima]
    // ═══════════════════════════════════════════════════════════════════
    SEASON_MODS: {
        jarni_zelenina: [1.5, 1.0, 0.4, 0.1],
        jarni_houba: [1.8, 0.1, 0.05, 0],
        podzimni_houby: [0.2, 0.6, 1.6, 0.3],
        podzimni_orechy: [0.1, 0.1, 1.6, 0.5],
        letni_bobule: [0.3, 1.6, 0.5, 0],
        podzimni_plane_ovoce: [0, 0.2, 1.5, 0.4],
        koreny_hlizy: [1.0, 0.8, 1.3, 0.6],
        semena_letni_podzim: [0.1, 0.5, 1.5, 0.2],
        aromaticke_byliny: [0.6, 1.6, 0.8, 0.1],
        lipovy_kvet: [0, 1.8, 0.1, 0],
        rozmaryn: [0.6, 1.0, 0.8, 0.4],
        vlakno: [0.5, 1.2, 1.3, 0.3],
        mokradni_fauna: [0.5, 1.6, 0.7, 0.05],
        divoka_vejce: [1.3, 1.2, 0.2, 0],
        prouti: [1.0, 0.6, 0.8, 1.3],
        drevo_kura: [1.0, 0.9, 1.0, 1.0],
        pryskyrice_smula: [0.8, 0.7, 1.0, 1.2],
        nerosty: [1.0, 1.0, 1.0, 0.7],
        zizaly: [1.2, 0.9, 1.2, 0.3],
        lov: [0.4, 0.5, 1.3, 1.4],
        rybolov: [1.0, 0.9, 1.1, 0.6],
        jalovec: [0.6, 0.7, 1.0, 1.2],
        hmyz_teplo: [1.0, 1.3, 1.0, 0.05],
        jedovate_rostliny: [0.1, 0.9, 1.3, 0.1],
        zimuvzdorna_zelenina: [0.3, 0.5, 1.2, 0.9],
    },

    // Sezónní multiplikátor pro daný item (1 = beze změny, pro netagované
    // položky vždy 1 — bezpečný no-op). Sdílí zdroj sezóny s Apiáriem.
    _seasonMult: function (itemId) {
        const def = typeof ItemsDB !== 'undefined' ? ItemsDB[itemId] : null;
        const cat = def && def.seasonCat;
        if (!cat || !this.SEASON_MODS[cat]) return 1;
        const idx = Game._getApiarySeason();
        const arr = this.SEASON_MODS[cat];
        return (typeof arr[idx] === 'number') ? arr[idx] : 1;
    },

    // Nahrazuje `Math.random() < P` u nezávislých bonusových dropů —
    // stejné volání, jen P se sezónně přeškáluje. Ořezáno na 0.95, ať
    // žádná kombinace nedá jistotu.
    _seasonRoll: function (itemId, baseP) {
        return Math.random() < Math.min(baseP * this._seasonMult(itemId), 0.95);
    },

    // Vážený výběr z primárního poolu (dřív pevný r<X řetězec). `pool`:
    // [{id, qty, w}], `w` = původní design váha (šířky z dřívějších
    // prahů, součet 1.0 — ověřeno ručně proti staré logice). Při w=1
    // pro všechny sezóny reprodukuje identické rozložení jako dřív.
    _weightedSeasonPick: function (pool) {
        const weighted = pool.map((p) => ({ id: p.id, qty: p.qty, w: p.w * this._seasonMult(p.id) }));
        const total = weighted.reduce((s, p) => s + p.w, 0);
        if (total <= 0) return pool[pool.length - 1]; // bezpečný fallback, nemělo by nastat
        let r = Math.random() * total;
        for (let i = 0; i < weighted.length; i++) {
            r -= weighted[i].w;
            if (r <= 0) return weighted[i];
        }
        return weighted[weighted.length - 1];
    },

    _checkRustyPotFind: function (actionType) {
        if (actionType !== 'basic' && actionType !== 'yard_cleanup') return;
        if ((GameState.inventory['zrezly_kotlik'] || 0) > 0 || (GameState.inventory['cooking_pot'] || 0) > 0) return;
        if (!GameState.rustyPotHunt) GameState.rustyPotHunt = { basic: 0, yard_cleanup: 0 };
        GameState.rustyPotHunt[actionType] = (GameState.rustyPotHunt[actionType] || 0) + 1;
        const bC = GameState.rustyPotHunt.basic;
        const yC = GameState.rustyPotHunt.yard_cleanup;
        const combined = bC + yC;
        const guaranteed = bC >= 4 || yC >= 3 || combined >= 9;
        const chance = guaranteed ? 1.0 : (0.12 + combined * 0.06);
        if (Math.random() < chance) {
            Game.addItem('zrezly_kotlik', 1);
            if (typeof UI !== 'undefined' && UI.notify) {
                const _name = (typeof iName === 'function') ? iName('zrezly_kotlik') : 'Zrezlý kotlík';
                UI.notify('🔍 ' + _name + '!');
            }
        }
    },

    // ── scavenge-reward-consolidation-mrd (9.8.2026) ─────────────────────
    // Jedno místo pravdy pro drop-tabulky scavenge typů. Dřív existovaly
    // 2-4× duplicitně napříč 3 kontexty (instant-loop / timed-completion /
    // durationMin=0 instant) a driftovaly nezávisle (basic/nature/resin_harvest/
    // yard_cleanup měly mezi kopiemi reálně chybějící itemy). Použita vždy
    // nejúplnější nalezená verze. Volá se ze všech 3 kontextů.
    // POZOR: quarry_stone/mine_iron_ore/quarry_limestone SEM NEPATŘÍ — jsou
    // to mine-collectMode typy se svými vlastními lokálními proměnnými
    // (_tier/_mMultC/_freshMult/_hasPalice/MINE_YIELD), zůstávají nedotčené.
    _scavengeReward: function (type, r) {
        if (type === 'basic' || type === 'yard_cleanup') this._checkRustyPotFind(type);
        if (type === 'hunt') {
            Game.addItem('fat', 1);
            Game.addItem('meat', 1);
            if (r > 0.4) Game.addItem('bone', 1);
            // v7.5: NEW DROPS
            if (r > 0.5) Game.addItem('hide', 1); // 50% chance - wild hide, needs processing into raw_hide or wild_leather
            if (r > 0.7) Game.addItem('feather', 1); // 30% chance - for quill
            // Lůj (tallow-mrd, 7.8.2026): 3x řidčeji než tuk
            if (this._seasonRoll('tallow', 0.33)) Game.addItem('tallow', 1);
        }
        else if (type === 'bark') {
            if (Math.random() < 0.15) Game.addItem('vrbova_kura', 1);
            else if (Math.random() < 0.15) Game.addItem('oak_bark', 1);
            else Game.addItem('bark', 2);
        }
        else if (type === 'fishing') {
            // fishing-species-mrd (10.8.2026): druhy místo generické 'fish'
            // (pstruh 35% / kapr 30% / úhoř 20% / štika 15%), mirror existující
            // 4 itemy (dnes vázané na Piscina/sádky kvalitu, ale stejná ryba,
            // ať z řeky nebo rybníka). Množství jako dřív (1-2 kusy).
            const qty = r < 0.3 ? 2 : 1;
            const sr = Math.random();
            if (sr < 0.35) Game.addItem('pstruh', qty);
            else if (sr < 0.65) Game.addItem('carp', qty);
            else if (sr < 0.85) Game.addItem('uhor', qty);
            else Game.addItem('stika', qty);
            if (r > 0.8) Game.addItem('water', 1);
            // Říční poklady — mirror ostatních LOST_ITEM_POOLS, ~0.5% šance
            if (Math.random() < 0.005) {
                const pool = this.LOST_ITEM_POOLS.fishing;
                const found = pool[Math.floor(Math.random() * pool.length)];
                Game.addItem(found, 1);
                UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
            }
        }
        else if (type === 'foraging') {
            const _forPick = this._weightedSeasonPick([
                { id: 'mushroom', qty: 2, w: 0.25 },
                { id: 'berries', qty: 2, w: 0.20 },
                { id: 'mushroom_poison', qty: 1, w: 0.10 },
                { id: 'roots', qty: 1, w: 0.15 },
                { id: 'seeds_vegetable', qty: 1, w: 0.10 },
                { id: 'nightshade', qty: 1, w: 0.10 },
                { id: 'fiber', qty: 1, w: 0.05 },
            ]);
            Game.addItem(_forPick.id, _forPick.qty);
            if (this._seasonRoll('viticis_baco', 0.02)) Game.addItem('viticis_baco', 1);
            // v8.x: Zelenina a koření při sběru potravy
            if (this._seasonRoll('garlic', 0.05)) Game.addItem('garlic', 1);
            if (this._seasonRoll('leek', 0.04)) Game.addItem('leek', 1);
            if (this._seasonRoll('nettle', 0.04)) Game.addItem('nettle', 1);
            if (this._seasonRoll('galium', 0.04)) Game.addItem('galium', 1);
            if (this._seasonRoll('seeds_garlic', 0.03)) Game.addItem('seeds_garlic', 1);
            if (this._seasonRoll('seeds_nettle', 0.02)) Game.addItem('seeds_nettle', 1);
            // Žaludy — podzimní nález
            if (this._seasonRoll('acorn', 0.12)) Game.addItem('acorn', 1);
            // Hlemýždi — vyšší šance po dešti
            const _snailWet = (typeof WeatherSystem !== 'undefined') ? WeatherSystem.countWetDays(3) : { wet: 0 };
            if (this._seasonRoll('snail', _snailWet.wet >= 2 ? 0.15 : 0.05)) Game.addItem('snail', 1);
            // Divoké byliny a kořeny (Cultus Herbarum)
            if (this._seasonRoll('ground_elder', 0.06)) Game.addItem('ground_elder', 1);
            if (this._seasonRoll('goosefoot', 0.05)) Game.addItem('goosefoot', 1);
            if (this._seasonRoll('sorrel', 0.05)) Game.addItem('sorrel', 1);
            if (this._seasonRoll('dandelion', 0.04)) Game.addItem('dandelion', 1);
            if (this._seasonRoll('burdock_root', 0.05)) Game.addItem('burdock_root', 1);
            if (this._seasonRoll('couch_grass', 0.05)) Game.addItem('couch_grass', 1);
            // Titivillus-infirmary-mrd — jalovec roste v lesích/na mezích
            if (this._seasonRoll('juniper', 0.03)) Game.addItem('juniper', 1);
            // Bukvice — podzim, spolu se žaludy
            if (this._seasonRoll('beechnut', 0.08)) Game.addItem('beechnut', 1);
            // Vzácnější houby (Cultus Herbarum)
            if (this._seasonRoll('morel', 0.03)) Game.addItem('morel', 1);
            if (this._seasonRoll('saffron_milk_cap', 0.04)) Game.addItem('saffron_milk_cap', 1);
            if (this._seasonRoll('porcini', 0.03)) Game.addItem('porcini', 1);
            // Červec — obchod-podklad 7.8.2026, u kořenů luk, drtí se na karmín (tech_cervec)
            if (this._seasonRoll('cervec', 0.04)) Game.addItem('cervec', 1);
            // Křepelčí vejce — vejce-druhy-mrd 7.8.2026, hnízdo v trávě, vzácné
            if (this._seasonRoll('quail_egg', 0.03)) Game.addItem('quail_egg', 1);
            // 0.07% — útržky, pečeť, byliny/váček zapomenuté v přírodě (viz LOST_ITEM_POOLS.foraging)
            if (Math.random() < 0.0007) {
                const pool = this.LOST_ITEM_POOLS.foraging;
                const found = pool[Math.floor(Math.random() * pool.length)];
                Game.addItem(found, 1);
                UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
            }
            // Zatoulaná kráva — krava-mrd (26.7.2026), viz FarmyardSystem.showStrayCowModal
            if (GameState.researchedTechs && GameState.researchedTechs.includes('tech_armentum')
                && typeof FarmyardSystem !== 'undefined' && Math.random() < FarmyardSystem.strayCowChance()) {
                FarmyardSystem.showStrayCowModal('scavenge');
            }
        }
        else if (type === 'wetlands') {
            const _wetPick = this._weightedSeasonPick([
                { id: 'frog', qty: 1, w: 0.40 },
                { id: 'slug', qty: 2, w: 0.30 },
                { id: 'water', qty: 2, w: 0.15 },
                { id: 'fiber', qty: 1, w: 0.10 },
            ]);
            Game.addItem(_wetPick.id, _wetPick.qty);
            // v8.x: plůdek — vzácný nález v mokřadu
            if (this._seasonRoll('fry', 0.08)) Game.addItem('fry', 1);
            // Raci — vzácnější nález v mokřadu
            if (this._seasonRoll('crayfish', 0.15)) Game.addItem('crayfish', 1);
            // Orobinec — kořen z mokřadu
            if (this._seasonRoll('cattail_root', 0.06)) Game.addItem('cattail_root', 1);
            // Proutí — vrbové pruty u mokřadu, běžný stavební materiál (Columbarium)
            if (this._seasonRoll('wicker', 0.20)) Game.addItem('wicker', 2);
            // Kachní vejce — vejce-druhy-mrd 7.8.2026, hnízdo u vody
            if (this._seasonRoll('duck_egg', 0.05)) Game.addItem('duck_egg', 1);
        }
        else if (type === 'grass_gather') {
            Game.addItem('grass', Math.random() < 0.5 ? 3 : 2);
            if (this._seasonRoll('fiber', 0.40)) Game.addItem('fiber', Math.random() < 0.5 ? 3 : 2);
            if (this._seasonRoll('linden_blossom', 0.30)) Game.addItem('linden_blossom', 1);
            if (this._seasonRoll('chamomile', 0.20)) Game.addItem('chamomile', 1);
            if (this._seasonRoll('thyme', 0.10)) Game.addItem('thyme', 1);
            if (this._seasonRoll('yarrow', 0.08)) Game.addItem('yarrow', 1);
            if (this._seasonRoll('wormwood', 0.05)) Game.addItem('wormwood', 1);
            if (this._seasonRoll('kopr', 0.05)) Game.addItem('kopr', 1);
            if (this._seasonRoll('sage', 0.04)) Game.addItem('sage', 1);
            if (this._seasonRoll('plantain', 0.02)) Game.addItem('plantain', 1);
            // Titivillus-infirmary-mrd — kostival a rozmarýn rostou mezi trávou (jalovec je keř, viz jinde)
            if (this._seasonRoll('comfrey', 0.03)) Game.addItem('comfrey', 1);
            if (this._seasonRoll('rosemary', 0.02)) Game.addItem('rosemary', 1);
            // Divoke obili mezi travou
            if (this._seasonRoll('seeds_rye', 0.04)) Game.addItem('seeds_rye', 1);
            if (this._seasonRoll('seeds_wheat', 0.03)) Game.addItem('seeds_wheat', 1);
            if (this._seasonRoll('seeds_barley', 0.03)) Game.addItem('seeds_barley', 1);
            if (this._seasonRoll('seeds_oats', 0.03)) Game.addItem('seeds_oats', 1);
            if (this._seasonRoll('seeds_millet', 0.02)) Game.addItem('seeds_millet', 1);
            if (this._seasonRoll('seeds_peas', 0.02)) Game.addItem('seeds_peas', 1);
            if (this._seasonRoll('seeds_flax', 0.015)) Game.addItem('seeds_flax', 1);
            // herbarium-seed-fix-mrd (10.8.2026): stejný vzácný nález jako u nature,
            // Sběr bylin je tematicky stejně vhodné místo
            if (Math.random() < 0.004) Game.addItem('seeds_mandrake', 1);
            if (Math.random() < 0.005) Game.addItem('seeds_belladonna', 1);
            if (Math.random() < 0.008) Game.addItem('seeds_poppy', 1);
        }
        else if (type === 'wood_harvest') {
            Game.addItem('log', Math.random() < 0.4 ? 2 : 1);
            if (this._seasonRoll('stick', 0.60)) Game.addItem('stick', 2);
            if (this._seasonRoll('bark', 0.20)) Game.addItem('bark', 1);
            if (this._seasonRoll('resin', 0.10)) Game.addItem('resin', 1);
            if (Math.random() < 0.05) Game.addItem('charcoal', 1);
            // Smůla — na louč (torch_resin-mrd, 6.8.2026): kácení dává víc než průzkum
            if (this._seasonRoll('resin_spruce', 0.25)) Game.addItem('resin_spruce', Math.random() < 0.4 ? 2 : 1);
            if (this._seasonRoll('resin_pine', 0.15)) Game.addItem('resin_pine', 1);
            // Dub — mlynar-vlastni-mlyn-mrd.md §4.5 (16.8.2026), vzácnej nález,
            // syrovej, potřebuje DryingSystem sušení (tech_susarna) než jde použít.
            if (Math.random() < 0.08) Game.addItem('oak_log_raw', 1);
        }
        else if (type === 'worms_dig') {
            Game.addItem('worms', Math.random() < 0.5 ? 3 : 2);
            if (Math.random() < 0.40) Game.addItem('rock', 1);
            if (Math.random() < 0.20) Game.addItem('clay', 1);
            if (this._seasonRoll('seeds_herb', 0.10)) Game.addItem('seeds_herb', 1);
        }
        else if (type === 'dig_clay') {
            Game.addItem('clay', Math.random() < 0.5 ? 3 : 2);
            if (Math.random() < 0.30) Game.addItem('rock', 1);
            if (Math.random() < 0.10) Game.addItem('worms', 1);
        }
        else if (type === 'basic') {
            const _basicPick = this._weightedSeasonPick([
                { id: 'rock', qty: 1, w: 0.4 },
                { id: 'stick', qty: 1, w: 0.6 },
            ]);
            Game.addItem(_basicPick.id, _basicPick.qty);
            if (Math.random() < 0.05) Game.addItem('carbon_black', 1);
            if (Math.random() < 0.04) Game.addItem('ochre', 1);
            if (Math.random() < 0.10) Game.addItem('chalk', 1);
            if (Math.random() < 0.35) Game.addItem('rags', 1);
            // Smůla — na louč (torch_resin-mrd, 6.8.2026): dostupná i z běžného průzkumu
            if (this._seasonRoll('resin_spruce', 0.08)) Game.addItem('resin_spruce', 1);
            if (this._seasonRoll('resin_pine', 0.05)) Game.addItem('resin_pine', 1);
            // Iron ore — vzácný nález (3%) po odemčení kovařiny
            if (Math.random() < 0.03 && GameState.researchedTechs && GameState.researchedTechs.includes('tech_kovarina')) {
                Game.addItem('iron_ore', 1);
            }
            // 0.17% — klíče/svitky/mince (viz LOST_ITEM_POOLS.basic)
            if (Math.random() < 0.0017) {
                const pool = this.LOST_ITEM_POOLS.basic;
                const found = pool[Math.floor(Math.random() * pool.length)];
                Game.addItem(found, 1);
                UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
            }
        }
        else if (type === 'nature') {
            const _natPick = this._weightedSeasonPick([
                { id: 'herb_red', qty: 1, w: 0.08 },
                { id: 'herb_yellow', qty: 1, w: 0.04 },
                { id: 'herb_blue', qty: 1, w: 0.04 },
                { id: 'mint', qty: 1, w: 0.04 },
                { id: 'fiber', qty: 2, w: 0.20 },
                { id: 'water', qty: 1, w: 0.20 },
                { id: 'seeds_herb', qty: 1, w: 0.10 },
                { id: 'seeds_yellow', qty: 1, w: 0.10 },
                { id: 'seeds_blue', qty: 1, w: 0.05 },
                { id: 'seeds_mint', qty: 1, w: 0.05 },
            ]);
            Game.addItem(_natPick.id, _natPick.qty);

            // v7.5: NEW DROP - gall_nut for gallic ink
            if (Math.random() < 0.06) Game.addItem('gall_nut', 1); // 6% chance
            // hadry — základ hadrového papíru
            if (Math.random() < 0.35) Game.addItem('rags', 1);
            // Athanor: byliny
            if (this._seasonRoll('chamomile', 0.08)) Game.addItem('chamomile', 1);
            if (this._seasonRoll('plantain', 0.08)) Game.addItem('plantain', 1);
            if (this._seasonRoll('st_johns_wort', 0.05)) Game.addItem('st_johns_wort', 1);
            if (this._seasonRoll('thyme', 0.04)) Game.addItem('thyme', 1);
            if (this._seasonRoll('seeds_thyme', 0.03)) Game.addItem('seeds_thyme', 1);
            if (this._seasonRoll('kopr', 0.03)) Game.addItem('kopr', 1);
            if (Math.random() < 0.01) Game.addItem('seeds_kopr', 1);
            if (Math.random() < 0.02) Game.addItem('hops', 1);
            if (Math.random() < 0.01) Game.addItem('seeds_hops', 1);
            // v8.x: Nové byliny — šalvěj, fenykl, pelyněk, yzop, řebříček
            if (this._seasonRoll('sage', 0.03)) Game.addItem('sage', 1);
            if (this._seasonRoll('fennel', 0.02)) Game.addItem('fennel', 1);
            if (this._seasonRoll('wormwood', 0.03)) Game.addItem('wormwood', 1);
            if (this._seasonRoll('yarrow', 0.04)) Game.addItem('yarrow', 1);
            if (this._seasonRoll('hyssop', 0.02)) Game.addItem('hyssop', 1);
            // Titivillus-infirmary-mrd — kostival, jalovec, rozmarýn (na mast proti revma/křeči)
            if (this._seasonRoll('comfrey', 0.03)) Game.addItem('comfrey', 1);
            if (this._seasonRoll('juniper', 0.02)) Game.addItem('juniper', 1);
            if (this._seasonRoll('rosemary', 0.03)) Game.addItem('rosemary', 1);
            // Semena nových bylin — vzácnější
            if (this._seasonRoll('seeds_sage', 0.015)) Game.addItem('seeds_sage', 1);
            if (this._seasonRoll('seeds_wormwood', 0.010)) Game.addItem('seeds_wormwood', 1);
            if (this._seasonRoll('seeds_yarrow', 0.020)) Game.addItem('seeds_yarrow', 1);
            // herbarium-seed-fix-mrd (10.8.2026): vzácné/nebezpečné byliny —
            // dřív neměly ŽÁDNOU cestu k získání (ani scavenge, ani trh),
            // celé Herbář Scrinium vlákno bylo nedosažitelné. Nízká šance,
            // mirror stromových semínek co do řádu vzácnosti.
            if (Math.random() < 0.004) Game.addItem('seeds_mandrake', 1);
            if (Math.random() < 0.005) Game.addItem('seeds_belladonna', 1);
            if (Math.random() < 0.008) Game.addItem('seeds_poppy', 1);
            // Rare drop - Netolického pozůstalost (0.1% chance)
            if (Math.random() < 0.001) {
                Game.addItem('netolicky_legacy', 1);
                UI.notifyPanel('📜 ' + (typeof t === 'function' ? t('game.rareFind') : 'Vzácný nález!'), 'system');
                setTimeout(function () { Game.showNetolickyModal(); }, 300);
            }
            // 0.16% — spony/dýmky/drobnosti (viz LOST_ITEM_POOLS.nature)
            if (Math.random() < 0.0016) {
                const pool = this.LOST_ITEM_POOLS.nature;
                const found = pool[Math.floor(Math.random() * pool.length)];
                Game.addItem(found, 1);
                UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
            }
            // Alchymický symbol vyrytý do kamene/kůry — 4. cesta k Athanoru (laboratoryClues, 3 potřeba)
            if (GameState.secrets && !GameState.secrets.laboratoryUnlocked && (GameState.secrets.laboratoryClues || 0) < 3 && Math.random() < 0.0016) {
                if (typeof SecretsSystem !== 'undefined') SecretsSystem.addLaboratoryClue();
            }
            // v8.x: Sad & Apiarium drops
            if (this._seasonRoll('pollen', 0.01)) Game.addItem('pollen', 1);          // 1% (dřív 4%) — pyl z luk
            if (this._seasonRoll('linden_blossom', 0.03)) Game.addItem('linden_blossom', 1);  // 3% — lipový květ
            // Semena stromů — vzácné nálezy při sběru v přírodě
            const treeSeedRoll = Math.random();
            if (treeSeedRoll < 0.015) Game.addItem('seed_apple', 1);
            else if (treeSeedRoll < 0.025) Game.addItem('seed_pear', 1);
            else if (treeSeedRoll < 0.034) Game.addItem('seed_plum', 1);
            else if (treeSeedRoll < 0.040) Game.addItem('seed_cherry', 1);
            else if (treeSeedRoll < 0.043) Game.addItem('seed_rowan', 1);
            // Plané ovoce a šípky — podzim (Cultus Herbarum)
            if (this._seasonRoll('rosehip', 0.06)) Game.addItem('rosehip', 1);
            if (this._seasonRoll('wild_fruit', 0.05)) Game.addItem('wild_fruit', 1);
            if (this._seasonRoll('cornel_cherry', 0.04)) Game.addItem('cornel_cherry', 1);
            if (this._seasonRoll('sloe', 0.03)) Game.addItem('sloe', 1);
            if (this._seasonRoll('bracket_fungus', 0.03)) Game.addItem('bracket_fungus', 1);
        }
        else if (type === 'resin_harvest') {
            // Honey/beeswax/pollen přesunuty do wild_beekeeping
            // (brtnictví-scavenge-mrd, 25.8.2026) — vlastní akce místo
            // vedlejšího produktu. resin_harvest zůstává čistě
            // dřevo/pryskyřice zaměřený.
            const _resinPick = this._weightedSeasonPick([
                { id: 'resin', qty: 1, w: 0.5 },
                { id: 'bark', qty: 1, w: 0.3 },
            ]);
            Game.addItem(_resinPick.id, _resinPick.qty);
            if (this._seasonRoll('linden_blossom', 0.05)) Game.addItem('linden_blossom', 1);
            if (this._seasonRoll('viticis_baco', 0.03)) Game.addItem('viticis_baco', 1);
            // Kadidlo: smrková a borová pryskyřice
            if (this._seasonRoll('resin_spruce', 0.40)) Game.addItem('resin_spruce', 1);
            if (this._seasonRoll('resin_pine', 0.25)) Game.addItem('resin_pine', 1);
        }
        else if (type === 'wild_beekeeping') {
            // brtnictví (25.8.2026) — divoké/lesní včelařství v dutinách
            // stromů, historicky doložená slovanská praxe (brť =
            // vydlabaný kmen jako úl, brtník = lesní včelař, značil
            // stromy vlastnickým cejchem proti krádeži). Med hlavní
            // výstup, sdílí seasonCat 'hmyz_teplo' s Apiariem (včely
            // dormantní v zimě). Pyl VĚDOMĚ VYNECHÁN jako samostatná
            // surovina — pylové lapače na česně úlu jsou moderní
            // vynález (19./20. stol.), středověký brtník by pyl
            // nerozeznal od toho, co včely zpracují přímo v plástu.
            // bee_bread má na rozdíl od pylu reálnou antickou oporu
            // (Hippokrates, Plinius — stejné zdůvodnění jako u
            // pyl/bee_bread splitu, 19.8.2026) — malá šance navíc.
            if (this._seasonRoll('honey', 0.85)) Game.addItem('honey', Math.random() < 0.3 ? 2 : 1);
            if (Math.random() < 0.35) Game.addItem('beeswax', 1);
            if (Math.random() < 0.05) Game.addItem('bee_bread', 1);
        }
        else if (type === 'yard_cleanup') {
            Game.addItem('scraps', Math.random() < 0.5 ? 2 : 1);
            if (Math.random() < 0.40) Game.addItem('feather_hen', 1);
            if (Math.random() < 0.30) Game.addItem('wool', 1);
            if (Math.random() < 0.20) Game.addItem('egg', 1);
            if (Math.random() < 0.03) Game.addItem('pollen', 1);
            if (Math.random() < 0.05) Game.addItem('bone', 1);
            Game.addItem('rags', 1);                             // staré hadry z hospodářství
            if (Math.random() < 0.35) Game.addItem('rags', 1);   // bonus
            // 0.2% — viz vysvětlení u instant varianty výše
            if (Math.random() < 0.002) {
                const lostPool = Object.entries(ItemsDB).filter(([id, i]) => i.lostItem).map(([id]) => id);
                if (lostPool.length > 0) {
                    const found = lostPool[Math.floor(Math.random() * lostPool.length)];
                    Game.addItem(found, 1);
                    UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                }
            }
            // 👺 Cesta B (Bestiář) — nález "titivillus_spis", nezávislý na
            // lostPool i na Titivillus craft-checku (Cesta A). Vlastní 0.2%,
            // zablokovaný jen když už folio máš, nebo spis už držíš v inventáři.
            {
                const _folioState = GameState.scrinium && GameState.scrinium.folios && GameState.scrinium.folios['folio_titivillus_bestiar'];
                const _alreadyHeld = (GameState.inventory['titivillus_spis'] || 0) > 0;
                if (!(_folioState && _folioState.found) && !_alreadyHeld && Math.random() < 0.002) {
                    Game.addItem('titivillus_spis', 1);
                    setTimeout(function () { Game.showTitivillusSpisModal(); }, 300);
                }
            }
        }
    },

    scavenge: function (type) {
        if (typeof VigorSystem !== 'undefined' && !VigorSystem.canAct()) { UI.notify(t('game.vigor.exhausted'), true); return; }

        // Vigor — Fatigue z akce. Instant klik stojí víc než timed výprava
        // (stejná filozofie jako TerrainSystem — grind je dražší než rozvržené hraní).
        if (typeof VigorSystem !== 'undefined') VigorSystem.onScavenge(type, GameState.selectedDuration || 0);
        // Save hint tracking
        Game._saveHint.actions++;
        Game._checkSaveHint();
        if (typeof EventsSystem !== 'undefined') EventsSystem.onAction();

        // Valetudo — riziko nachlazení při mokrém počasí (venkovní akce)
        if (typeof HealthSystem !== 'undefined' && typeof WeatherSystem !== 'undefined' && !HealthSystem.isActive('cold')) {
            const wetCheck = WeatherSystem.countWetDays(3);
            if (wetCheck.wet >= 2 && Math.random() < 0.015) {
                HealthSystem.addCondition('cold');
            }
        }

        // === SPECIAL HANDLING FOR WELL === (PŘIDAT NA ZAČÁTEK)
        if (type === 'well_water') {
            // Check if well exists
            if (!GameState.well.built) {
                UI.notify(t('game.needWell'), true);
                return;
            }

            // Draw water with pot (default) or bucket
            const hasBucket = GameState.inventory.bucket && GameState.inventory.bucket > 0;
            WellSystem.drawWater(hasBucket);
            return;
        }
        // === END WELL HANDLING ===

        // === MINE ACTIONS (collectMode) ===
        const _mineAction = ActionsDB.find(a => a.id === type && a.collectMode);
        if (_mineAction) {
            // Výnosová tabulka podle nominálního tieru (viz Doly MRD) — koně mění
            // jen reálný čas čekání, NE tuhle tabulku.
            const MINE_YIELD = {
                quarry_stone: { 2.5: [10, 12], 5: [20, 30], 10: [45, 55], 20: [130, 160], 30: [240, 300] },
                mine_iron_ore: { 2.5: [1, 1], 5: [1, 3], 10: [3, 5], 20: [6, 10], 30: [10, 15] },
                quarry_limestone: { 2.5: [8, 10], 5: [16, 24], 10: [36, 44], 20: [100, 130], 30: [190, 240] },
            };
            // COMPLETION: kliknutí na "Sbírat" po uplynutí timeru
            if (GameState.activeAction && GameState.activeAction.id === type) {
                if (Date.now() < GameState.activeAction.endTime) {
                    // Timer ještě běží — zrušit
                    GameState.activeAction = null;
                    Game.save(); UI.renderMineActions(); return;
                }
                // Doručit loot
                const _mFoundC = _mineAction.req ? _mineAction.req.find(r => (GameState.inventory[r.item] > 0) || (GameState.inventory['worn_' + r.item] > 0)) : null;
                const _mMultC = _mFoundC ? (_mFoundC.mult || 0.7) : 1.0;
                const _tier = GameState.activeAction.durationMin || 5;
                const _freshMult = (typeof GameState.activeAction.freshMult === 'number') ? GameState.activeAction.freshMult : 1.0;
                const _invBefore = {};
                for (const k of Object.keys(GameState.inventory)) _invBefore[k] = GameState.inventory[k] || 0;
                const _hasPalice = (GameState.inventory['palice_kamenna'] > 0) || (GameState.inventory['palice_zelezna'] > 0);
                if (type === 'quarry_stone') {
                    const range = MINE_YIELD.quarry_stone[_tier] || MINE_YIELD.quarry_stone[5];
                    const qty = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
                    Game.addItem('rock', Math.max(1, Math.round(qty * _mMultC * _freshMult)));
                    if (Math.random() < 0.15) Game.addItem('cut_stone', 1);
                    if (Math.random() < 0.05) Game.addItem('clay', 1);
                    if (_hasPalice && Math.random() < 0.05) Game.addItem('vapenec', 1);
                } else if (type === 'mine_iron_ore') {
                    const range = MINE_YIELD.mine_iron_ore[_tier] || MINE_YIELD.mine_iron_ore[5];
                    const qty = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
                    Game.addItem('iron_ore', Math.max(1, Math.round(qty * _mMultC * _freshMult)));
                    if (Math.random() < 0.20) Game.addItem('charcoal', 1);
                    if (Math.random() < 0.05) Game.addItem('rock', 2);
                    if (_hasPalice && Math.random() < 0.08) Game.addItem('vapenec', 1);
                } else if (type === 'quarry_limestone') {
                    const range = MINE_YIELD.quarry_limestone[_tier] || MINE_YIELD.quarry_limestone[5];
                    const qty = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
                    Game.addItem('vapenec', Math.max(1, Math.round(qty * _mMultC * _freshMult)));
                }
                const _tgains = {};
                for (const k of Object.keys(GameState.inventory)) {
                    const diff = (GameState.inventory[k] || 0) - (_invBefore[k] || 0);
                    if (diff > 0) _tgains[k] = diff;
                }
                if (Object.keys(_tgains).length > 0) UI.notifyAccum(_tgains);
                if (_mFoundC) Game.useToolCharge(_mFoundC.item);
                GameState.activeAction = null;
                Game.save(); UI.renderMineActions();
                return;
            }
            // BUSY: jiná akce běží
            if (GameState.activeAction) {
                UI.notify(t('game.busy'), true); return;
            }
            // START: první kliknutí
            const _mFound = _mineAction.req ? _mineAction.req.find(r => (GameState.inventory[r.item] > 0) || (GameState.inventory['worn_' + r.item] > 0)) : null;
            if (_mineAction.req && !_mFound) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                const _toolNames = _mineAction.req.map(r => ItemsDB[r.item] ? ItemsDB[r.item].name : r.item).join('/');
                const _toolNamesEn = _mineAction.req.map(r => ItemsDB[r.item] ? ItemsDB[r.item].name_en : r.item).join('/');
                UI.notify(lang === 'en' ? ('❌ Requires: ' + _toolNamesEn + '.') : ('❌ Vyžaduje: ' + _toolNames + '.'), true);
                return;
            }
            const _mMult = (_mFound && _mFound.mult) ? _mFound.mult : 1.0;
            const _mMultiplier = Math.round(8 * _mMult);
            const _tierStart = GameState.selectedMineDuration || 5;
            // Únava dolu (žíly) — zaznamenat na START, ne na collect (stejný vzor jako Terrain/Curia)
            const _freshMultStart = (typeof MineSystem !== 'undefined') ? MineSystem.getMult() : 1.0;
            if (typeof MineSystem !== 'undefined') MineSystem.onScavenge(_tierStart);
            // Koně zrychlují Mine (tažná síla při dopravě rubaniny) — mění jen reálný
            // čas čekání, výnosová tabulka zůstává vázaná na zvolený nominální tier.
            // Podkovy (Kovář-reference MRD, 2.8.2026): 2+ řádně okovaní koně = max gain,
            // jinak (neokovaný/jen 1 okovaný) padá na baseline 25% i při víc koních.
            const _stableAnimals = (GameState.stable && GameState.stable.animals) ? GameState.stable.animals : [];
            const _horseCount = _stableAnimals.length;
            const _shodHorseCount = _stableAnimals.filter(a => a.shoeDurability > 0).length;
            const _horseTimeMult = _shodHorseCount >= 2 ? 0.5 : _horseCount >= 1 ? 0.75 : 1.0;
            const _mineMs = Math.round(_tierStart * 60 * 1000 * _horseTimeMult);
            // Aktivní opotřebení podkov — škáluje s délkou tieru (X = round(6×tier/30))
            const _shoeWear = Math.round(6 * _tierStart / 30);
            _stableAnimals.forEach(a => { if (a.shoeDurability > 0) a.shoeDurability = Math.max(0, a.shoeDurability - _shoeWear); });
            GameState.activeAction = { id: type, startTime: Date.now(), endTime: Date.now() + _mineMs, multiplier: _mMultiplier, durationMin: _tierStart, freshMult: _freshMultStart };
            Game.save(); UI.renderMineActions();
            return;
        }
        // === END MINE ACTIONS ===
        // Check requirements

        const action = ActionsDB.find(a => a.id === type);
        let _toolMult = 1.0; // multiplier z nástroje
        let _usedToolId = null; // ID použitého nástroje pro useToolCharge
        if (action && action.req) {
            if (Array.isArray(action.req)) {
                // Pole req — najít první dostupný nástroj a jeho multiplier
                let found = action.req.find(r => GameState.inventory[r.item] > 0);
                // Fallback: worn varianta s 20% výtěží
                if (!found) {
                    found = action.req.reduce((best, r) => {
                        const wornId = 'worn_' + r.item;
                        if (!best && GameState.inventory[wornId] > 0)
                            return { item: wornId, mult: 0.2 };
                        return best;
                    }, null);
                }
                if (!found) {
                    const names = action.req.map(r => ItemsDB[r.item] ? ItemsDB[r.item].name : r.item).join('/');
                    UI.notify(t('game.missingItem').replace('{item}', names), true);
                    return;
                }
                _toolMult = found.mult;
                _usedToolId = found.item;
            } else {
                if (!(GameState.inventory[action.req] > 0)) {
                    UI.notify(t('game.missingItem').replace('{item}', ItemsDB[action.req] ? ItemsDB[action.req].name : action.req), true);
                    return;
                }
            }
        }

        // ── snapshot pro quick scavenge ──
        ScavengeManager._scavenging = true;
        const _qbefore = {};
        for (const k of Object.keys(GameState.inventory)) _qbefore[k] = GameState.inventory[k] || 0;

        if (GameState.activeAction && GameState.activeAction.id === type) {
            const now = Date.now();
            const totalDur = GameState.activeAction.endTime - GameState.activeAction.startTime;
            const elapsed = now - GameState.activeAction.startTime;
            const multiplier = GameState.activeAction.multiplier;
            let count = 0; let msg = "";
            if (now >= GameState.activeAction.endTime) { count = Math.round(multiplier * _toolMult); msg = t('game.done'); }
            else { const ratio = elapsed / totalDur; count = Math.floor(multiplier * ratio * _toolMult); msg = t('game.interrupted'); }
            GameState.activeAction = null;

            // Track action completion
            if (GameState.achievements) {
                GameState.achievements.stats.actionsCompleted++;
            }

            ScavengeManager._scavenging = true;
            const _invBefore = {};
            for (const k of Object.keys(GameState.inventory)) _invBefore[k] = GameState.inventory[k] || 0;
            let total = 0;
            for (let i = 0; i < count; i++) {
                let r = Math.random();
                if (['hunt', 'nature', 'basic', 'bark', 'fishing', 'foraging', 'wetlands', 'resin_harvest', 'wild_beekeeping', 'grass_gather', 'wood_harvest', 'worms_dig', 'dig_clay', 'yard_cleanup'].includes(type)) {
                    this._scavengeReward(type, r);
                }
                else if (type === 'quarry_stone') {
                    const qty = Math.random() < 0.4 ? 6 : (Math.random() < 0.6 ? 4 : 3);
                    Game.addItem('rock', Math.round(qty * _toolMult));
                    if (Math.random() < 0.15) Game.addItem('cut_stone', 1);
                    if (Math.random() < 0.05) Game.addItem('clay', 1);
                }
                else if (type === 'mine_iron_ore') {
                    const qty = Math.random() < 0.4 ? 3 : (Math.random() < 0.6 ? 2 : 1);
                    Game.addItem('iron_ore', Math.round(qty * _toolMult));
                    if (Math.random() < 0.20) Game.addItem('charcoal', 1);
                    if (Math.random() < 0.05) Game.addItem('rock', 2);
                }
                total++;
            }
            if (total > 0) {
                const _tgains = {};
                for (const k of Object.keys(GameState.inventory)) {
                    const diff = (GameState.inventory[k] || 0) - (_invBefore[k] || 0);
                    if (diff > 0) _tgains[k] = diff;
                }
                if (Object.keys(_tgains).length > 0) {
                    UI.notifyAccum(_tgains);
                    if (!GameState.kronikaDailyBuffer) GameState.kronikaDailyBuffer = { date: '', gains: {} };
                    const _todayK = new Date().toISOString().slice(0, 10);
                    if (GameState.kronikaDailyBuffer.date !== _todayK) { Game.kronikaFlushBuffer(); GameState.kronikaDailyBuffer.date = _todayK; }
                    for (const [k, v] of Object.entries(_tgains)) GameState.kronikaDailyBuffer.gains[k] = (GameState.kronikaDailyBuffer.gains[k] || 0) + v;
                } else {
                    UI.notify(t('game.scavengeResult').replace('{msg}', msg).replace('{total}', total));
                }
            } else {
                UI.notify(t('game.scavengeNothing').replace('{msg}', msg));
            }
            // ── KRONIKA: agregace denních gainů ──
            if (total > 0 && typeof GameState.kronikaDailyBuffer !== 'undefined') {
                if (!GameState.kronikaDailyBuffer) GameState.kronikaDailyBuffer = { date: '', gains: {} };
                const todayStr = new Date().toISOString().slice(0, 10);
                if (GameState.kronikaDailyBuffer.date !== todayStr) {
                    Game.kronikaFlushBuffer();
                    GameState.kronikaDailyBuffer.date = todayStr;
                }
                // Přičíst získané položky z inventáře (diff)
                // Přičteme obecně podle typu akce
                const _actionLabel = type;
                GameState.kronikaDailyBuffer.gains[_actionLabel] = (GameState.kronikaDailyBuffer.gains[_actionLabel] || 0) + total;
            }
            ScavengeManager._scavenging = false;
            if (_usedToolId) Game.useToolCharge(_usedToolId);
            Game.save(); UI.renderAll(); return;
        }
        if (GameState.activeAction && (type === 'basic' || type === 'nature')) {
            // Únava hospodářství platí i tady — jinak jde o grindovací díru
            // (timed akce běží jinde, ale RYCHLE! by jinak bylo bez postihu).
            if (typeof CuriaSystem !== 'undefined') CuriaSystem.onScavenge(0);
            let r = Math.random();
            if (type === 'nature' || type === 'basic') {
                this._scavengeReward(type, r);
            }
            // ── Aplikovat curia mult na zisk (stejná logika jako hlavní instant cesta) ──
            const _curiaMultQ = (typeof CuriaSystem !== 'undefined') ? CuriaSystem.getMult() : 1.0;
            const _qgains = {};
            for (const k of Object.keys(GameState.inventory)) {
                const diff = (GameState.inventory[k] || 0) - (_qbefore[k] || 0);
                if (diff > 0) {
                    const reduced = _curiaMultQ >= 1.0 ? diff : Math.max(1, Math.round(diff * _curiaMultQ));
                    const remove = diff - reduced;
                    if (remove > 0) Game.removeItem(k, remove);
                    if (reduced > 0) _qgains[k] = reduced;
                }
            }
            if (Object.keys(_qgains).length > 0) UI.notifyAccum(_qgains);
            else UI.notify(t('game.quickScavenge'));
            ScavengeManager._scavenging = false;
            Game.save(); UI.renderAll(); return;
        }
        if (GameState.activeAction) { UI.notify(t('game.busy'), true); return; }

        const durationMin = action.collectMode ? 5 : GameState.selectedDuration;
        if (durationMin === 0) {
            // Únava krajiny — instant klik (jen terénní akce)
            if (typeof TerrainSystem !== 'undefined' && TerrainSystem.isTerrainAction(type)) TerrainSystem.onScavenge(0);
            // Únava hospodářství — oddělený pool od krajiny
            if (typeof CuriaSystem !== 'undefined' && CuriaSystem.isCuriaAction(type)) CuriaSystem.onScavenge(0);
            // ── snapshot pro single scavenge ──
            ScavengeManager._scavenging = true;
            const _s0before = {};
            for (const k of Object.keys(GameState.inventory)) _s0before[k] = GameState.inventory[k] || 0;
            let r = Math.random();
            if (['hunt', 'nature', 'basic', 'bark', 'fishing', 'foraging', 'wetlands', 'resin_harvest', 'wild_beekeeping', 'grass_gather', 'wood_harvest', 'worms_dig', 'dig_clay', 'yard_cleanup'].includes(type)) {
                this._scavengeReward(type, r);
            }
            // ── notifyAccum: single scavenge ──
            {
                const _s0gains = {};
                const _terrainMult = (typeof TerrainSystem !== 'undefined' && TerrainSystem.isTerrainAction(type)) ? TerrainSystem.getMult() : 1.0;
                const _curiaMult = (typeof CuriaSystem !== 'undefined' && CuriaSystem.isCuriaAction(type)) ? CuriaSystem.getMult() : 1.0;
                const _zoneMult = Math.min(_terrainMult, _curiaMult); // vždy jen jeden < 1.0, druhý je 1.0
                const _prevTier = (GameState.terrain && GameState.terrain.lastToastTier) || 0;
                const _prevCuriaTier = (GameState.curia && GameState.curia.lastToastTier) || 0;
                for (const k of Object.keys(GameState.inventory)) {
                    const diff = (GameState.inventory[k] || 0) - (_s0before[k] || 0);
                    if (diff > 0) {
                        // Aplikovat zone mult (terrain nebo curia) — min 1 aby hráč vždy něco dostal
                        const reduced = _zoneMult >= 1.0 ? diff : Math.max(1, Math.round(diff * _zoneMult));
                        const remove = diff - reduced;
                        if (remove > 0) Game.removeItem(k, remove);
                        if (reduced > 0) _s0gains[k] = reduced;
                    }
                }
                // Toast POUZE při přechodu tieru (ne každý klik)
                if (typeof TerrainSystem !== 'undefined' && _terrainMult < 1.0) {
                    const lang = (GameState.settings && GameState.settings.language) || 'cs';
                    const currTier = _terrainMult <= 0.25 ? 2 : 1;
                    if (currTier > _prevTier) {
                        const msg = currTier === 2
                            ? (lang === 'en' ? '🪨 Terrain exhausted — yields at 25%' : '🪨 Krajina vyčerpaná — výnosy jen 25%')
                            : (lang === 'en' ? '🍂 Terrain tired — yields at 50%' : '🍂 Krajina unavená — výnosy 50%');
                        UI.notify(msg, true);
                        if (GameState.terrain) GameState.terrain.lastToastTier = currTier;
                    }
                }
                if (typeof CuriaSystem !== 'undefined' && _curiaMult < 1.0) {
                    const lang = (GameState.settings && GameState.settings.language) || 'cs';
                    const currTier = _curiaMult <= 0.25 ? 2 : 1;
                    if (currTier > _prevCuriaTier) {
                        const msg = currTier === 2
                            ? (lang === 'en' ? '🕸️ Nearby grounds exhausted — yields at 25%' : '🕸️ Blízké okolí vytěžené — výnosy jen 25%')
                            : (lang === 'en' ? '🧹 Nearby grounds picked over — yields at 50%' : '🧹 Blízké okolí prohledané — výnosy 50%');
                        UI.notify(msg, true);
                        if (GameState.curia) GameState.curia.lastToastTier = currTier;
                    }
                }
                // Reset tier při zotavení (regen sníží fatigue)
                if (typeof TerrainSystem !== 'undefined' && _terrainMult >= 1.0 && _prevTier > 0) {
                    if (GameState.terrain) GameState.terrain.lastToastTier = 0;
                }
                if (typeof CuriaSystem !== 'undefined' && _curiaMult >= 1.0 && _prevCuriaTier > 0) {
                    if (GameState.curia) GameState.curia.lastToastTier = 0;
                }
                if (Object.keys(_s0gains).length > 0) UI.notifyAccum(_s0gains);
            }
            ScavengeManager._scavenging = false;
            if (_usedToolId) Game.useToolCharge(_usedToolId);
            Game.save(); UI.renderAll(); return;
        } else {
            // TIMED scavenge — tabulka výnosů dle délky. Přepočítáno, aby delší
            // akce dávaly citelně lepší poměr výnos/minuta než rychlé klikání
            // (viz Game.scavenge anti-grind okno) — motivace nechat hru běžet
            // na pozadí místo opakovaného klikání. 15min je nová volba.
            let multiplier = durationMin === 1 ? 6
                : durationMin === 5 ? 40
                    : durationMin === 10 ? 90
                        : durationMin === 15 ? 170
                            : durationMin === 20 ? 260
                                : durationMin === 30 ? 480
                                    : 6;

            // Apply tool multiplier
            if (_toolMult !== 1.0) multiplier = Math.round(multiplier * _toolMult);

            // Apply canonical hours foraging buff
            if (typeof CanonicalHours !== 'undefined') {
                const foragingMult = CanonicalHours.getForagingMultiplier();
                multiplier = Math.floor(multiplier * foragingMult);
            }

            // Apply terrain mult — timed výpravy jsou šetrnější na krajinu (jen terénní akce)
            if (typeof TerrainSystem !== 'undefined' && TerrainSystem.isTerrainAction(type)) {
                multiplier = Math.max(1, Math.floor(multiplier * TerrainSystem.getMult()));
                TerrainSystem.onScavenge(durationMin);
            }
            // Apply curia mult — totéž pro hospodářské akce, oddělený pool
            if (typeof CuriaSystem !== 'undefined' && CuriaSystem.isCuriaAction(type)) {
                multiplier = Math.max(1, Math.floor(multiplier * CuriaSystem.getMult()));
                CuriaSystem.onScavenge(durationMin);
            }

            GameState.activeAction = { id: type, startTime: Date.now(), endTime: Date.now() + (durationMin * 60 * 1000), multiplier: multiplier };
            Game.save(); UI.renderActions();
        }
    },
    checkEnvironment: function () {
        if (typeof FireplaceSystem !== 'undefined') FireplaceSystem.render();
        const container = document.getElementById('game-container');
        const fpCard = document.getElementById('card-fireplace');
        const fpCardOverlay = document.getElementById('card-fireplace-overlay');
        const navHome = document.getElementById('nav-home');
        const btnIgnite = document.getElementById('btn-ignite');
        const btnIgniteOverlay = document.getElementById('btn-ignite-overlay');
        if (GameState.flags.fireplaceLit) {
            if (fpCard) fpCard.classList.add('fireplace-active');
            if (navHome) navHome.classList.add('nav-fire-active');
            const fpTitle = document.getElementById('fireplace-title');
            if (fpTitle) fpTitle.innerText = t('fireplace.lit');
            const fpDesc = document.getElementById('fireplace-desc');
            // fireplace-tier2-mrd (9.8.2026): reálný status místo statické
            // fráze — mirror _wordedBurnout z Foculus panelu, ať karta
            // Oheň/dlaždice v Pracovně ukazuje totéž, co bohatý panel.
            if (fpDesc) {
                fpDesc.innerText = (typeof FireplaceSystem !== 'undefined' && FireplaceSystem._fullStatusText && GameState.fire)
                    ? FireplaceSystem._fullStatusText(GameState.fire.fuelMs)
                    : t('fireplace.litDesc');
            }
            if (btnIgnite) btnIgnite.style.display = 'none';
            const fpVisualLit = document.getElementById('fireplace-visual');
            if (fpVisualLit) fpVisualLit.src = '/img/hearth_base_red.png';
            // Overlay: zhasnout, krb hoří — overlay nepotřebný
            if (fpCardOverlay) fpCardOverlay.style.display = 'none';
        } else {
            // Hint pro nové hráče: krb nebyl nikdy rozžéhnut
            const neverLit = !(GameState.achievements?.stats?.fireplaceCount);
            if (btnIgnite) btnIgnite.classList.toggle('btn-ignite--hint', neverLit);
            const fpVisualDead = document.getElementById('fireplace-visual');
            if (fpVisualDead) fpVisualDead.src = '/img/hearth_base_dead.png';
            // Overlay: zrcadlí primární kartu, viditelný jen na Pracovna/main tabu
            if (fpCardOverlay) {
                const titleMain = document.getElementById('fireplace-title');
                const titleOv = document.getElementById('fireplace-title-overlay');
                if (titleMain && titleOv) titleOv.innerText = titleMain.innerText;
                const descMain = document.getElementById('fireplace-desc');
                const descOv = document.getElementById('fireplace-desc-overlay');
                if (descMain && descOv) descOv.innerText = descMain.innerText;
                const visOv = document.getElementById('fireplace-visual-overlay');
                if (visOv) visOv.src = '/img/hearth_base_dead.png';
                if (btnIgniteOverlay) btnIgniteOverlay.classList.toggle('btn-ignite--hint', neverLit);
                const mainTab = document.getElementById('home-tab-main');
                const onHomeMain = (UI.currentScreen === 'home') &&
                    (!mainTab || mainTab.classList.contains('active'));
                fpCardOverlay.style.display = onHomeMain ? 'flex' : 'none';
            }
        }
        const isDark = GameState.flags.forceDark || (!TimeSys.isDaytime() && !GameState.flags.fireplaceLit && !GameState.flags.candleLit && !GameState.flags.torchLit);
        if (container) {
            if (isDark) container.classList.add('mode-frozen');
            else container.classList.remove('mode-frozen');
        }

        const lightCard = document.getElementById('card-light-source');
        const navLore = document.getElementById('nav-lore');
        const loreOverlay = document.getElementById('lore-overlay');
        const loreWrap = document.getElementById('lore-content-wrapper');
        const btnCandle = document.getElementById('btn-light-candle');
        const btnTorch = document.getElementById('btn-light-torch');
        const lightDesc = document.getElementById('light-desc'); // Přidáno pro popisek

        if (lightCard) lightCard.classList.remove('candle-active', 'torch-active');
        if (navLore) navLore.classList.remove('nav-candle-active', 'nav-torch-active');
        if (lightCard) lightCard.style.opacity = GameState.flags.fireplaceLit ? "1" : "0.5";

        if (GameState.flags.candleLit) {
            const lIcon = document.getElementById('light-icon'); if (lIcon) lIcon.innerText = "🕯️";
            const lTitle = document.getElementById('light-title'); if (lTitle) lTitle.innerText = t('light.candle');
            // svetlo-detail-mrd (9.8.2026): slovní odhad zbývající doby —
            // schválně bez přesných minut/hodin, jen "čerstvá/stabilní/dohořívá".
            if (lightDesc) {
                // svitidla-mrd (16.8.2026) — per-tier lightHours (candleItemId),
                // fallback na starou CONFIG konstantu pro save předcházející tuhle opravu.
                const _candleDurMs = (GameState.candleItemId && ItemsDB[GameState.candleItemId] && ItemsDB[GameState.candleItemId].lightHours)
                    ? ItemsDB[GameState.candleItemId].lightHours * 3600000
                    : CONFIG.CANDLE_DURATION;
                const _candlePct = 1 - Math.max(0, Math.min(1, (Date.now() - (GameState.candleStart || 0)) / _candleDurMs));
                const _cTier = _candlePct > 0.66 ? 'fresh' : _candlePct > 0.25 ? 'steady' : 'low';
                lightDesc.innerText = t('light.candleDescs.' + _cTier);
            }
            if (navLore) navLore.classList.add('nav-candle-active');
            if (btnCandle) btnCandle.style.display = 'none'; if (btnTorch) btnTorch.style.display = 'inline-block';
            if (loreOverlay) loreOverlay.style.display = 'none'; if (loreWrap) loreWrap.classList.remove('lore-darkness');
        } else if (GameState.flags.torchLit) {
            const lIcon = document.getElementById('light-icon'); if (lIcon) lIcon.innerText = "🔥";
            // svetlo-detail-mrd (9.8.2026): konkrétní typ louče (tuková/lojová/
            // smolná) místo obecného textu — torchItemId/lightHours už existují,
            // jen se dřív nepoužívaly v tomhle zobrazení.
            const _torchItem = GameState.torchItemId || 'primitive_torch';
            const _torchName = (typeof iName === 'function' && ItemsDB[_torchItem]) ? iName(_torchItem) : t('light.torch');
            const lTitle = document.getElementById('light-title'); if (lTitle) lTitle.innerText = _torchName;
            if (lightDesc) {
                const _torchHrs = (ItemsDB[_torchItem] && ItemsDB[_torchItem].lightHours) ? ItemsDB[_torchItem].lightHours : 1;
                const _torchPct = 1 - Math.max(0, Math.min(1, (Date.now() - (GameState.torchStart || 0)) / (_torchHrs * 3600000)));
                const _tTier = _torchPct > 0.66 ? 'fresh' : _torchPct > 0.25 ? 'steady' : 'low';
                lightDesc.innerText = t('light.torchDescs.' + _torchItem + '.' + _tTier);
            }
            if (navLore) navLore.classList.add('nav-torch-active');
            if (btnTorch) btnTorch.style.display = 'none'; if (btnCandle) btnCandle.style.display = 'inline-block';
            if (loreOverlay) loreOverlay.style.display = 'none'; if (loreWrap) loreWrap.classList.remove('lore-darkness');
        } else {
            const lIcon = document.getElementById('light-icon'); if (lIcon) lIcon.innerText = "🌑";
            const lTitle = document.getElementById('light-title'); if (lTitle) lTitle.innerText = t('light.none');
            if (lightDesc) lightDesc.innerText = t('light.noneDesc'); // Aktualizace popisku
            const hasC = (GameState.inventory['candle'] || 0) > 0;
            const hasT = (GameState.inventory['primitive_torch'] || 0) > 0 || (GameState.inventory['torch_tallow'] || 0) > 0 || (GameState.inventory['torch_resin'] || 0) > 0;
            if (btnCandle) btnCandle.style.display = (GameState.flags.fireplaceLit && hasC) ? 'inline-block' : 'none';
            if (btnTorch) btnTorch.style.display = (GameState.flags.fireplaceLit && hasT) ? 'inline-block' : 'none';
            if (loreOverlay) loreOverlay.style.display = 'block'; if (loreWrap) loreWrap.classList.add('lore-darkness');
        }
        if (btnCandle) btnCandle.disabled = !GameState.flags.fireplaceLit;
        if (btnTorch) btnTorch.disabled = !GameState.flags.fireplaceLit;
        UI.renderActions();
        // Tech backpack filter visibility
        const filterBar = document.getElementById('inv-filter-bar');
        if (filterBar) {
            if (GameState.researchedTechs.includes("tech_backpack")) {
                filterBar.style.display = 'flex';
            } else {
                filterBar.style.display = 'none';
            }
        }
    },

    // ── L3b: Oka na drobnou zvěř (Lovec řetěz). Paralelní k noži — aktivní lov (tuk gate) NEDOTČEN. ──
    SNARE_MS: 12 * 60 * 60 * 1000,
    SNARE_BREAK_CHANCE: 0.4,

    setSnare: function () {
        if ((GameState.inventory['snare'] || 0) <= 0) { UI.notify('⚠️ Nemáš žádné oko.', true); return; }
        if (!GameState.snareTraps) GameState.snareTraps = [];
        if (GameState.snareTraps.length >= 3) { UI.notify('⚠️ Víc než 3 oka najednou nelíčíš.', true); return; }
        Game.removeItem('snare', 1);
        GameState.snareTraps.push({ readyAt: Date.now() + this.SNARE_MS });
        Game.save();
        UI.notify('🪤 Oko nalíčeno. Vrať se za 12 hodin.');
        UI.renderScavengeActions();
    },

    collectSnares: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.snareTraps) GameState.snareTraps = [];
        const now = Date.now();
        const ready = GameState.snareTraps.filter(s => now >= s.readyAt);
        if (!ready.length) return;
        GameState.snareTraps = GameState.snareTraps.filter(s => now < s.readyAt);
        let caught = 0, returned = 0, broken = 0;
        ready.forEach(() => {
            caught++;
            Game.addItem('caught_small_game', 1);
            if (Math.random() < this.SNARE_BREAK_CHANCE) broken++;
            else { returned++; Game.addItem('snare', 1); }
        });
        Game.save();
        UI.notify('🐿️ ' + (lang === 'en'
            ? 'Snares: ' + caught + ' catch(es), ' + broken + ' snare(s) broken.'
            : 'Oka: úlovky ' + caught + ', zničená oka ' + broken + '.'));
        UI.renderScavengeActions();
    },

    processCaughtGame: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((GameState.inventory['caught_small_game'] || 0) <= 0) return;
        if ((GameState.inventory['stone_knife'] || 0) <= 0) { UI.notify('⚠️ ' + (lang === 'en' ? 'You need a knife.' : 'Potřebuješ nůž.'), true); return; }
        Game.removeItem('caught_small_game', 1);
        Game.addItem('meat', 1);      // Divoké maso
        Game.addItem('fat', 1);
        Game.addItem('scraps', 1);    // zbytky — krmivo (B3 vazba)
        if (Math.random() < 0.5) Game.addItem('bone', 1);
        Game.save();
        UI.notify('🔪 ' + (lang === 'en' ? 'Dressed: wild meat, fat, scraps.' : 'Zpracováno: divoké maso, tuk, zbytky.'));
        UI.renderScavengeActions();
    },
};