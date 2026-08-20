// ═══ src/core/managers/ApiaryManager.js ═══
// Extrakce z game.js (Krok 2 / D4, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Apiarium (včelíny). Původně Game.* na řádcích
// 1312–1774 (HEAD po D2+D3). Chování beze změny — pouze přesun +
// přepsání this.removeItem/addItem -> Game.removeItem/addItem
// (cross-doménová závislost na D8/Inventory, ještě needitovaném).
const ApiaryManager = {
    _getApiarySeason: function () {
        const m = new Date().getMonth() + 1; // 1–12
        if (m >= 3 && m <= 5) return 'spring';
        if (m >= 6 && m <= 8) return 'summer';
        if (m >= 9 && m <= 11) return 'autumn';
        return 'winter';
    },

    // ── Pomocná: pool jmen královen ───────────────────────────────────────────
    _queenNames: [
        'Hildegarda', 'Konstancie', 'Anežka', 'Dorota', 'Markéta',
        'Eliška', 'Žofie', 'Ludmila', 'Blanka', 'Alžběta',
        'Kunhuta', 'Radoslava', 'Doubravka', 'Přibyslava', 'Miloslava'
    ],

    _randomQueenName: function () {
        return this._queenNames[Math.floor(Math.random() * this._queenNames.length)];
    },

    // ── Pomocná: nektarový modifikátor dle reálného počasí (WMO kód) ──────────
    // Napojeno na WeatherSystem (Open-Meteo, Praha) — žádné vlastní počasí.
    // Chybí-li data (offline/nenačteno), vrací neutrální 1.0 — tiché selhání.
    _apiaryWeatherMod: function () {
        try {
            const code = WeatherSystem && WeatherSystem.cache && WeatherSystem.cache.current
                ? WeatherSystem.cache.current.weather_code : null;
            if (code === null || code === undefined) return 1.0;
            if (code === 0) return 1.3;  // jasno — ideální snůška
            if (code === 1) return 1.15; // skoro jasno
            if (code === 2) return 1.0;  // polojasno
            if (code === 3) return 0.8;  // zataženo
            if (code >= 45 && code <= 48) return 0.7;  // mlha
            if (code >= 51 && code <= 57) return 0.6;  // mrholení
            if (code >= 61 && code <= 67) return 0.4;  // déšť
            if (code >= 71 && code <= 77) return 0.2;  // sníh
            if (code >= 80 && code <= 82) return 0.4;  // přeháňky
            if (code >= 85 && code <= 86) return 0.2;  // sněžení
            if (code >= 95 && code <= 99) return 0.3;  // bouřka
            return 1.0;
        } catch (e) { return 1.0; }
    },

    buildHive: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (hive.built) return;
        if ((GameState.inventory['stick'] || 0) < 10) { UI.notify(t('game.needWood'), true); return; }
        if ((GameState.inventory['rope'] || 0) < 5) { UI.notify(t('game.needRope'), true); return; }
        Game.removeItem('stick', 10);
        Game.removeItem('rope', 5);
        hive.built = true;
        hive.hasQueen = false;
        hive.queenName = null;
        hive.queenStrength = 0;   // produktivita medu, 2–4 hvězdy, nastaví se při usazení matky
        hive.queenVarroaResist = 0;   // odolnost vůči Varroa, 2–4 hvězdy
        hive.queenWinter = 0;   // zimovatelnost, 2–4 hvězdy — ovlivňuje přežití zimy i šanci na veteránku
        hive.strength = 0;   // 1–10 síla včelstva
        hive.varroa = 0;   // 0–100 tlak Varroa, roste tiše v čase
        hive.varroaRevealed = false; // MRD 5.1 — skrytá Varroa, ukáže se jen po Zkontrolovat/sklizni
        hive.swarmMood = 0;   // 0–100 rojivá nálada
        hive.lastCollectAt = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('🪹 ' + t('game.hiveBuilt'));
    },

    // ── Velký úl (Custos Apium, MRD Apiarium II) ──────────────────────────────
    buildGrandHive: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (hive.built) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const hasTier2 = (GameState.inventory['velky_ul_2'] || 0) > 0;
        const hasTier1 = (GameState.inventory['velky_ul_1'] || 0) > 0;
        if (!hasTier2 && !hasTier1) {
            UI.notify(lang === 'en' ? 'You need a built Great Hive (I or II) from Crafting.' : 'Potřebuješ postavený Velký úl (I nebo II) z Craftingu.', true);
            return;
        }
        const tier = hasTier2 ? 2 : 1;
        Game.removeItem(hasTier2 ? 'velky_ul_2' : 'velky_ul_1', 1);
        hive.built = true;
        hive.grand = tier; // 1 nebo 2 — ovlivňuje yield multiplikátor v collectHive()
        hive.hasQueen = false;
        hive.queenName = null;
        hive.queenStrength = 0;
        hive.queenVarroaResist = 0;
        hive.queenWinter = 0;
        hive.strength = 0;
        hive.varroa = 0;
        hive.varroaRevealed = false; // MRD 5.1 — skrytá Varroa
        hive.swarmMood = 0;
        hive.lastCollectAt = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('🛖 ' + (lang === 'en'
            ? `Great Hive (${tier === 2 ? 'II' : 'I'}) built!`
            : `Velký úl (${tier === 2 ? 'II' : 'I'}) postaven!`));
    },

    addQueen: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || hive.hasQueen) return;
        if (!(GameState.inventory['queen_bee'] > 0)) { UI.notify(t('game.needQueen'), true); return; }
        Game.removeItem('queen_bee', 1);
        hive.hasQueen = true;
        hive.queenName = this._randomQueenName();
        hive.queenStrength = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy (náhoda)
        hive.queenVarroaResist = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy
        hive.queenWinter = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy
        hive.queenMildness = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy — MRD 5.2, tlumí růst rojivé nálady
        hive.queenSwarm = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy — MRD 5.2, žene rojivou náladu
        hive.strength = 3; // začíná na střední síle
        hive.varroa = 0;
        hive.varroaRevealed = false; // MRD 5.1 — nová matka, nová neznámá
        hive.swarmMood = 0;
        hive.lastCollectAt = Date.now();
        hive.lastCutAt = 0; // MRD 5.3 — řez matečníků, cooldown počítadlo
        Game.save();
        UI.renderApiary();
        UI.notify('🐝 ' + t('game.queenAdded') + ' — ' + hive.queenName);
    },

    // MRD 5.7 — chov matek: vysloužilá matka (z rojení, 280g na trhu) dá potomka
    // se zděděnou silou a zimovatelností (přesně dle popisu itemu veteran_queen)
    breedQueen: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || hive.hasQueen) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.inventory['veteran_queen'] > 0)) {
            UI.notify(lang === 'en' ? 'Requires a veteran queen.' : 'Vyžaduje vysloužilou matku.', true);
            return;
        }
        Game.removeItem('veteran_queen', 1);
        hive.hasQueen = true;
        hive.queenName = this._randomQueenName();
        hive.queenStrength = Math.floor(Math.random() * 3) + 3; // 3–5 hvězdy — zděděná síla
        hive.queenVarroaResist = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy, normální rozptyl
        hive.queenWinter = Math.floor(Math.random() * 3) + 3; // 3–5 hvězdy — zděděná zimovatelnost
        hive.queenMildness = Math.floor(Math.random() * 3) + 2;
        hive.queenSwarm = Math.floor(Math.random() * 3) + 2;
        hive.strength = 3;
        hive.varroa = 0;
        hive.varroaRevealed = false;
        hive.swarmMood = 0;
        hive.lastCollectAt = Date.now();
        hive.lastCutAt = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('👑 ' + (lang === 'en'
            ? `A bred queen — "${hive.queenName}" — inherits her mother's strength.`
            : `Chovná matka — „${hive.queenName}" — zdědila sílu své matky.`));
    },

    // MRD 5.6 — stárnutí propolisové tinktury (vzor: Foudres/foudresBarrel), jedna běžící dávka
    startTinkturaAging: function (amount) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (GameState.apiaryTinkturaAging) {
            UI.notify(lang === 'en' ? 'A batch is already aging.' : 'Dávka už zraje.', true);
            return;
        }
        amount = parseInt(amount, 10) || 0;
        const have = GameState.inventory['propolis_tinktura'] || 0;
        if (amount <= 0 || amount > have) {
            UI.notify(lang === 'en' ? 'Not enough tincture.' : 'Nedostatek tinktury.', true);
            return;
        }
        Game.removeItem('propolis_tinktura', amount);
        GameState.apiaryTinkturaAging = {
            amount: amount,
            startedAt: Date.now(),
            readyAt: Date.now() + 10 * 86400000, // 10 dní zrání
        };
        Game.save();
        UI.renderApiary();
        UI.notify('🏺 ' + (lang === 'en' ? 'Tincture set to age.' : 'Tinktura uložena ke zrání.'));
    },

    collectTinkturaAging: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const batch = GameState.apiaryTinkturaAging;
        if (!batch) return;
        if (Date.now() < batch.readyAt) {
            UI.notify(lang === 'en' ? 'Not ready yet.' : 'Ještě nezraje.', true);
            return;
        }
        Game.addItem('propolis_tinktura_vyzrala', batch.amount);
        GameState.apiaryTinkturaAging = null;
        Game.save();
        UI.renderApiary();
        UI.notify('🏺 ' + (lang === 'en' ? 'Aged tincture collected.' : 'Vyzrálá tinktura vyzvednuta.'));
    },

    // MRD 5.3 — aktivní správa roje: řez matečníků, ~75% šance sníží rojivou náladu na 0
    cutQueenCells: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_custos_apium'))) {
            UI.notify(lang === 'en' ? 'Requires the Custos Apium tech.' : 'Vyžaduje tech Custos Apium.', true);
            return;
        }
        const CUT_COOLDOWN_H = 12;
        const now = Date.now();
        if (now < (hive.lastCutAt || 0) + (CUT_COOLDOWN_H * 3600000)) {
            UI.notify(t('game.hiveNotReady'), true);
            return;
        }
        hive.lastCutAt = now;
        if (Math.random() < 0.75) {
            hive.swarmMood = 0;
            Game.save();
            UI.renderApiary();
            UI.notify('✂️ ' + (lang === 'en' ? 'Queen cells cut. The colony has settled.' : 'Matečníky vyříznuty. Rojivá nálada klesla.'));
        } else {
            Game.save();
            UI.renderApiary();
            UI.notify('🐝 ' + (lang === 'en' ? 'One queen cell was overlooked...' : 'Jeden matečník jsi přehlédl...'), true);
        }
    },

    // MRD 5.4 — oddělek: silný úl (síla ≥6) založí nový úl ve volném slotu, za cenu vlastní síly
    makeNuc: function (sourceIdx) {
        if (!GameState.apiary) return;
        const source = GameState.apiary[sourceIdx];
        if (!source.built || !source.hasQueen) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_custos_apium'))) {
            UI.notify(lang === 'en' ? 'Requires the Custos Apium tech.' : 'Vyžaduje tech Custos Apium.', true);
            return;
        }
        if ((source.strength || 0) < 6) {
            UI.notify(lang === 'en' ? 'The colony is too weak to split.' : 'Včelstvo je příliš slabé pro oddělení.', true);
            return;
        }
        const targetIdx = GameState.apiary.findIndex(h => !h.built);
        if (targetIdx === -1) {
            UI.notify(lang === 'en' ? 'No empty hive slot available.' : 'Není volný slot pro nový úl.', true);
            return;
        }
        source.strength = Math.max(0, source.strength - 3);
        const nuc = GameState.apiary[targetIdx];
        nuc.built = true;
        nuc.hasQueen = true;
        nuc.queenName = this._randomQueenName();
        nuc.queenStrength = Math.floor(Math.random() * 3) + 2;
        nuc.queenVarroaResist = Math.floor(Math.random() * 3) + 2;
        nuc.queenWinter = Math.floor(Math.random() * 3) + 2;
        nuc.queenMildness = Math.floor(Math.random() * 3) + 2;
        nuc.queenSwarm = Math.floor(Math.random() * 3) + 2;
        nuc.strength = 2; // mladé včelstvo, začíná slabší než nákup nové matky
        nuc.varroa = 0;
        nuc.varroaRevealed = false;
        nuc.swarmMood = 0;
        nuc.lastCollectAt = Date.now();
        nuc.lastCutAt = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('🐣 ' + (lang === 'en'
            ? `Nuc created — new colony "${nuc.queenName}" in a fresh slot.`
            : `Oddělek vytvořen — nové včelstvo „${nuc.queenName}“ v novém slotu.`));
    },

    // MRD 5.1 — bezplatná kontrola stavu Varroa kdykoliv, nezávisle na sklizni
    inspectHive: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        hive.varroaRevealed = true;
        Game.save();
        UI.renderApiary();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const v = hive.varroa || 0;
        const hint = v >= 70
            ? (lang === 'en' ? 'critical — treat soon' : 'kritický — brzy ošetři')
            : v >= 40
                ? (lang === 'en' ? 'rising' : 'roste')
                : (lang === 'en' ? 'calm' : 'klidný');
        UI.notify('🔍 ' + (lang === 'en' ? `Varroa: ${v}/100 (${hint})` : `Varroa: ${v}/100 (${hint})`));
    },

    collectHive: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;

        const season = this._getApiarySeason();

        // Zima — nelze sklízet
        if (season === 'winter') {
            UI.notify('❄️ ' + t('game.hiveWinter'), true);
            return;
        }

        // Časy sklizně dle sezóny
        const COLLECT_HOURS = { spring: 16, summer: 8, autumn: 20 };
        const hours = COLLECT_HOURS[season] || 12;
        const now = Date.now();
        if (now < hive.lastCollectAt + (hours * 3600000)) {
            UI.notify(t('game.hiveNotReady'), true);
            return;
        }

        // Varroa roste tiše s časem od poslední péče, odolnost matky ji tlumí
        const elapsedH = (now - hive.lastCollectAt) / 3600000;
        const varroaResist = hive.queenVarroaResist || 3;
        const varroaGrowth = Math.max(1, Math.round((elapsedH / 8) * (5 - varroaResist)));
        hive.varroa = Math.min(100, (hive.varroa || 0) + varroaGrowth);
        hive.varroaRevealed = true; // MRD 5.1 — sklizeň odhalí skutečný stav
        const varroaPenalty = hive.varroa >= 70 ? 0.5 : hive.varroa >= 40 ? 0.8 : 1.0;

        // Produkce dle sezóny, síly včelstva, produktivity matky, počasí a stavu Varroa
        const strengthMod = (hive.strength || 3) / 5; // 0.2–2.0
        const queenMod = (hive.queenStrength || 3) / 3; // 0.67–1.33
        const weatherMod = this._apiaryWeatherMod();
        // Velký úl (MRD 5.9) — čistý multiplikátor navrch, žádnej jinej vzorec se neupravuje
        const grandMult = hive.grand === 2 ? 1.5 : hive.grand === 1 ? 1.2 : 1.0;
        const honeyBase = { spring: 1, summer: 3, autumn: 1 };
        const waxBase = { spring: 1, summer: 1, autumn: 2 };
        const honeyYield = Math.max(1, Math.round(honeyBase[season] * strengthMod * queenMod * weatherMod * varroaPenalty * grandMult));
        const waxYield = Math.max(1, Math.round(waxBase[season] * strengthMod * varroaPenalty * grandMult));

        Game.addItem('honey', honeyYield);
        Game.addItem('beeswax', waxYield);

        // Celoživotní statistiky — "high stats" pro Včelařův přehled
        if (!GameState.apiaryStats) GameState.apiaryStats = { totalHoney: 0, totalWax: 0, totalPropolis: 0, totalBeeBread: 0, totalCollections: 0 };
        GameState.apiaryStats.totalHoney += honeyYield;
        GameState.apiaryStats.totalWax += waxYield;
        GameState.apiaryStats.totalCollections += 1;

        // Pyl bonus — jen léto, jen pokud kvetou záhony nebo sad
        if (season === 'summer') {
            const hasFlowers = GameState.garden && GameState.garden.some(p => p.state === 2 && p.water);
            const hasTrees = GameState.orchard && GameState.orchard.some(s => s.state === 'mature');
            if (hasFlowers || hasTrees) { Game.addItem('bee_bread', 1); GameState.apiaryStats.totalBeeBread += 1; }
        }

        // Propolis — vzácnější drobná šance při každé sklizni (MRD 5.5), Velký úl ji zdvojí
        const propolisChance = hive.grand ? 0.3 : 0.15;
        if (Math.random() < propolisChance) { Game.addItem('propolis', 1); GameState.apiaryStats.totalPropolis += 1; }

        // Síla roste po sklizni (péče o včely) — běžný úl s šancí 60 % (nerf + náhoda, MRD 5.9),
        // Velký úl roste spolehlivě — odměna za investici do stavby
        const growChance = hive.grand ? 1.0 : 0.6;
        if (Math.random() < growChance) {
            hive.strength = Math.min(10, (hive.strength || 3) + 1);
        }

        // Rojivá nálada — přeplněný úl (síla vysoká) a pozdní návštěva ji živí,
        // pravidelná péče ji naopak tiší. Odlet je pravděpodobnostní, ne pevný práh.
        // MRD 5.2 — queenSwarm (sklon k rojení) žene náladu nahoru, queenMildness ji tlumí.
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const swarmTemper = ((hive.queenSwarm || 3) - (hive.queenMildness || 3)) * 0.15; // -0.3..+0.3
        if (hive.strength >= 8) {
            const late = now > hive.lastCollectAt + (hours * 1.5 * 3600000);
            const gain = Math.round((late ? 15 : 5) * (1 + swarmTemper));
            hive.swarmMood = Math.min(100, (hive.swarmMood || 0) + gain);
        } else {
            hive.swarmMood = Math.max(0, (hive.swarmMood || 0) - 5);
        }

        // Šance na skutečný odlet — mírná matka roj spíš udrží, náchylná spíš pustí
        const swarmChance = Math.max(0.15, Math.min(0.55, 0.35 + swarmTemper));
        if (hive.swarmMood >= 60 && Math.random() < swarmChance) {
            // Matka odletěla s rojem — malá šance, že jde o vysloužilou matku k prodeji
            const veteranChance = 0.08 + (hive.queenWinter || 3) * 0.04;
            const isVeteran = Math.random() < veteranChance;
            if (isVeteran) Game.addItem('veteran_queen', 1);
            hive.hasQueen = false;
            hive.queenName = null;
            hive.strength = 0;
            hive.varroa = 0;
            hive.swarmMood = 0;
            Game.save();
            UI.renderApiary();
            UI.notify(isVeteran
                ? '👑 ' + (lang === 'en' ? 'The queen survived the swarm — a veteran, worth a fortune!' : 'Matka roj přežila — vysloužilá, cenná k prodeji!')
                : '🐝 ' + t('game.hiveRojivy'));
            return;
        }

        hive.lastCollectAt = now;
        Game.save();
        UI.renderApiary();
        UI.notify('🍯 ' + t('game.hiveCollected') + ' (' + honeyYield + '× med, ' + waxYield + '× vosk)');
    },

    // ── Zimní přikrmení ────────────────────────────────────────────────────────
    feedHive: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        const season = this._getApiarySeason();
        if (season !== 'winter') { UI.notify(t('game.hiveFeedOnlyWinter'), true); return; }
        if ((GameState.inventory['honey'] || 0) < 1) { UI.notify(t('game.hiveNeedHoney'), true); return; }
        Game.removeItem('honey', 1);
        // Přikrmení zachová sílu nebo ji zvýší
        hive.strength = Math.min(10, (hive.strength || 3) + 1);
        Game.save();
        UI.renderApiary();
        UI.notify('🍯 ' + t('game.hiveFed'));
    },

    // ── Léčba Varroa ──────────────────────────────────────────────────────────
    treatVarroa: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((hive.varroa || 0) <= 0) { UI.notify(lang === 'en' ? 'No Varroa pressure right now.' : 'Žádný tlak Varroa teď není.', true); return; }
        if ((GameState.inventory['thyme'] || 0) < 1) { UI.notify(t('game.hiveNeedThyme'), true); return; }
        Game.removeItem('thyme', 1);
        const reduction = 30 + (hive.queenVarroaResist || 3) * 5; // 40–50 dle odolnosti matky
        hive.varroa = Math.max(0, (hive.varroa || 0) - reduction);
        hive.strength = Math.max(1, (hive.strength || 3) - 1); // léčba stojí trochu síly
        Game.save();
        UI.renderApiary();
        UI.notify('🌿 ' + t('game.hiveTreated') + ' (-' + reduction + ' Varroa)');
    },

    // ── Zimní check (volá se 1× denně nebo při otevření Apiary) ───────────────
    checkApiaryWinter: function () {
        if (!GameState.apiary) return;
        const season = this._getApiarySeason();
        if (season !== 'winter') return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        let changed = false;
        GameState.apiary.forEach(hive => {
            if (!hive.built || !hive.hasQueen) return;
            // Úhyn: síla na nule, nebo vysoký tlak Varroa (riziko, ne jistota — zimovatelná matka pomáhá)
            const varroaDeath = (hive.varroa || 0) >= 80 && Math.random() < (0.35 - (hive.queenWinter || 3) * 0.05);
            if ((hive.strength || 0) <= 0 || varroaDeath) {
                const veteranChance = 0.05 + (hive.queenWinter || 3) * 0.03;
                const isVeteran = Math.random() < veteranChance;
                if (isVeteran) Game.addItem('veteran_queen', 1);
                hive.hasQueen = false;
                hive.queenName = null;
                hive.strength = 0;
                hive.varroa = 0;
                hive.swarmMood = 0;
                changed = true;
                UI.notify(isVeteran
                    ? '👑 ' + (lang === 'en' ? 'She did not survive the hive, but the veteran queen herself lived on!' : 'Včelstvo zimu nepřežilo, ale vysloužilá matka sama ano!')
                    : '💀 ' + t('game.hiveDied'));
            }
        });
        if (changed) { Game.save(); UI.renderApiary(); }
    },

    // ── Náhodný Varroa event (volá se z EventsSystem nebo manuálně) ──────────
    // ⚠️ nevoláno nikde v repu (ověřeno gtřepem 19.8.2026, audit před extrakcí D4) — ponecháno, ne mažeme neschváleně
    triggerVarroa: function (slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        hive.varroa = Math.min(100, (hive.varroa || 0) + 25);
        hive.strength = Math.max(1, (hive.strength || 3) - 2);
        Game.save();
        UI.renderApiary();
        UI.notify('⚠️ ' + t('game.hiveVarroa'));
    },
};