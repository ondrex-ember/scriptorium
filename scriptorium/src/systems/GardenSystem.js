// ═══════════════════════════════════════════════════════════════════════════
// GardenSystem — Zahrada, Dvůr, Sad, Apiarium, Piscina, Studna
// ═══════════════════════════════════════════════════════════════════════════

const GardenSystem = {

    // ════════════════════════════════════════════════════════════════════════
    // GAME LOGIC — Sad, Apiarium, Piscina, Dvůr
    // ════════════════════════════════════════════════════════════════════════

    plantTree: function(slotIdx, seedId) {
        if (!GameState.orchard) return;
        if (!seedId) { UI.notify(t('game.noSeedSelected'), true); return; }
        if (!(GameState.inventory[seedId] > 0)) { UI.notify(t('game.noSeeds'), true); return; }
        const slot = GameState.orchard[slotIdx];
        if (slot.state !== 'empty') { UI.notify(t('game.slotOccupied'), true); return; }
        Game.removeItem(seedId, 1);
        slot.state    = 'growing';
        slot.treeType = seedId;
        slot.plantedAt = Date.now();
        slot.lastHarvestAt = 0;
        Game.save();
        GardenSystem.renderOrchard();
        UI.notify('🌱 ' + t('game.treePlanted'));
    },

    harvestTree: function(slotIdx) {
        if (!GameState.orchard) return;
        const slot = GameState.orchard[slotIdx];
        if (slot.state !== 'mature') return;
        const TREE_FRUITS = {
            seed_apple: 'apple', seed_pear: 'pear', seed_plum: 'plum',
            seed_cherry: 'cherry', seed_walnut: 'walnut', seed_mulberry: 'mulberry',
            seed_quince: 'quince', seed_sorb: 'sorb', seed_rowan: 'rowan',
            seed_linden: 'linden_fruit',
        };
        const fruit = TREE_FRUITS[slot.treeType];
        if (!fruit) return;
        const qty = (slot.treeType === 'seed_walnut' || slot.treeType === 'seed_sorb') ? 2 : 3;
        Game.addItem(fruit, qty);
        // Lípa dává navíc lipový květ
        if (slot.treeType === 'seed_linden') Game.addItem('linden_blossom', 1);
        // Pyl při každé sklizni
        Game.addItem('pollen', 1);
        slot.lastHarvestAt = Date.now();
        Game.save();
        GardenSystem.renderOrchard();
        UI.notify('🍎 ' + t('game.treeHarvested').replace('{qty}', qty));
    },

    fellTree: function(slotIdx) {
        if (!GameState.orchard) return;
        const slot = GameState.orchard[slotIdx];
        if (slot.state === 'empty') return;

        // Prerekvizita: sekera (kamenná nebo železná)
        const axe = ['iron_axe', 'stone_axe'].find(a => (GameState.inventory[a] || 0) > 0);
        if (!axe) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            UI.notify(lang === 'en' ? '🪓 You need an axe to fell trees.' : '🪓 Pro kácení potřebuješ sekeru.', true);
            return;
        }

        // Výnos: log (kulatina) + stick
        const isMature = slot.state === 'mature';
        const logQty   = isMature ? (Math.random() < 0.4 ? 3 : 2) : 1;
        const stickQty = isMature ? 3 : 1;

        Game.addItem('log',   logQty);
        Game.addItem('stick', stickQty);

        // Opotřebení sekery
        GardenSystem.useToolCharge(axe);

        slot.state = 'empty';
        slot.treeType = null;
        slot.plantedAt = 0;
        slot.lastHarvestAt = 0;
        Game.save();
        GardenSystem.renderOrchard();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const msg = lang === 'en'
            ? '🪓 Tree felled: +' + logQty + ' log, +' + stickQty + ' stick.'
            : '🪓 Strom pokácen: +' + logQty + ' kulatina, +' + stickQty + ' větve.';
        UI.notify(msg);
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // APIARIUM (Včelín) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Pomocná: vrátí sezónu dle reálného měsíce ─────────────────────────────
    _getApiarySeason: function() {
        const m = new Date().getMonth() + 1; // 1–12
        if (m >= 3 && m <= 5)  return 'spring';
        if (m >= 6 && m <= 8)  return 'summer';
        if (m >= 9 && m <= 11) return 'autumn';
        return 'winter';
    },

    // ── Pomocná: pool jmen královen ───────────────────────────────────────────
    _queenNames: [
        'Hildegarda', 'Konstancie', 'Anežka', 'Dorota', 'Markéta',
        'Eliška', 'Žofie', 'Ludmila', 'Blanka', 'Alžběta',
        'Kunhuta', 'Radoslava', 'Doubravka', 'Přibyslava', 'Miloslava'
    ],

    _randomQueenName: function() {
        return this._queenNames[Math.floor(Math.random() * this._queenNames.length)];
    },

    buildHive: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (hive.built) return;
        if ((GameState.inventory['stick'] || 0) < 10) { UI.notify(t('game.needWood'), true); return; }
        if ((GameState.inventory['rope']  || 0) < 5)  { UI.notify(t('game.needRope'), true); return; }
        Game.removeItem('stick', 10);
        Game.removeItem('rope', 5);
        hive.built          = true;
        hive.hasQueen       = false;
        hive.queenName      = null;
        hive.queenStrength  = 0;   // 1–5 hvězd, nastaví se při usazení matky
        hive.strength       = 0;   // 1–10 síla včelstva
        hive.varroaRisk     = false;
        hive.lastCollectAt  = 0;
        Game.save();
        GardenSystem.renderApiary();
        UI.notify('🪹 ' + t('game.hiveBuilt'));
    },

    addQueen: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || hive.hasQueen) return;
        if (!(GameState.inventory['queen_bee'] > 0)) { UI.notify(t('game.needQueen'), true); return; }
        Game.removeItem('queen_bee', 1);
        hive.hasQueen      = true;
        hive.queenName     = GardenSystem._randomQueenName();
        hive.queenStrength = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy (náhoda)
        hive.strength      = 3; // začíná na střední síle
        hive.varroaRisk    = false;
        hive.lastCollectAt = Date.now();
        Game.save();
        GardenSystem.renderApiary();
        UI.notify('🐝 ' + t('game.queenAdded') + ' — ' + hive.queenName);
    },

    collectHive: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;

        const season = GardenSystem._getApiarySeason();

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

        // Produkce dle sezóny a síly včelstva
        const strengthMod = (hive.strength || 3) / 5; // 0.2–2.0
        const honeyBase   = { spring: 1, summer: 3, autumn: 1 };
        const waxBase     = { spring: 1, summer: 1, autumn: 2 };
        const honeyYield  = Math.max(1, Math.round(honeyBase[season] * strengthMod));
        const waxYield    = Math.max(1, Math.round(waxBase[season] * strengthMod));

        Game.addItem('honey', honeyYield);
        Game.addItem('beeswax', waxYield);

        // Pyl bonus — jen léto, jen pokud kvetou záhony nebo sad
        if (season === 'summer') {
            const hasFlowers = GameState.garden && GameState.garden.some(p => p.state === 2 && p.water);
            const hasTrees   = GameState.orchard && GameState.orchard.some(s => s.state === 'mature');
            if (hasFlowers || hasTrees) Game.addItem('pollen', 1);
        }

        // Síla roste po sklizni (péče o včely)
        hive.strength = Math.min(10, (hive.strength || 3) + 1);

        // Rojivá nálada — pokud je síla max a sklizeň přichází pozdě (2× lhůta)
        if (hive.strength >= 9 && now > hive.lastCollectAt + (hours * 2 * 3600000)) {
            // Matka odletěla
            hive.hasQueen  = false;
            hive.queenName = null;
            hive.strength  = 0;
            Game.save();
            GardenSystem.renderApiary();
            UI.notify('🐝 ' + t('game.hiveRojivy'));
            return;
        }

        hive.lastCollectAt = now;
        Game.save();
        GardenSystem.renderApiary();
        UI.notify('🍯 ' + t('game.hiveCollected') + ' (' + honeyYield + '× med, ' + waxYield + '× vosk)');
    },

    // ── Zimní přikrmení ────────────────────────────────────────────────────────
    feedHive: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        const season = GardenSystem._getApiarySeason();
        if (season !== 'winter') { UI.notify(t('game.hiveFeedOnlyWinter'), true); return; }
        if ((GameState.inventory['honey'] || 0) < 1) { UI.notify(t('game.hiveNeedHoney'), true); return; }
        Game.removeItem('honey', 1);
        // Přikrmení zachová sílu nebo ji zvýší
        hive.strength = Math.min(10, (hive.strength || 3) + 1);
        Game.save();
        GardenSystem.renderApiary();
        UI.notify('🍯 ' + t('game.hiveFed'));
    },

    // ── Léčba Varroa ──────────────────────────────────────────────────────────
    treatVarroa: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen || !hive.varroaRisk) return;
        if ((GameState.inventory['thyme'] || 0) < 1) { UI.notify(t('game.hiveNeedThyme'), true); return; }
        Game.removeItem('thyme', 1);
        hive.varroaRisk = false;
        hive.strength   = Math.max(1, (hive.strength || 3) - 1); // léčba stojí trochu síly
        Game.save();
        GardenSystem.renderApiary();
        UI.notify('🌿 ' + t('game.hiveTreated'));
    },

    // ── Zimní check (volá se 1× denně nebo při otevření Apiary) ───────────────
    checkApiaryWinter: function() {
        if (!GameState.apiary) return;
        const season = GardenSystem._getApiarySeason();
        if (season !== 'winter') return;
        let changed = false;
        GameState.apiary.forEach(hive => {
            if (!hive.built || !hive.hasQueen) return;
            // Pokud síla <= 0 → včelstvo uhynulo
            if ((hive.strength || 0) <= 0) {
                hive.hasQueen  = false;
                hive.queenName = null;
                hive.strength  = 0;
                changed = true;
                UI.notify('💀 ' + t('game.hiveDied'));
            }
        });
        if (changed) { Game.save(); GardenSystem.renderApiary(); }
    },

    // ── Náhodný Varroa event (volá se z EventsSystem nebo manuálně) ──────────
    triggerVarroa: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen || hive.varroaRisk) return;
        hive.varroaRisk = true;
        hive.strength   = Math.max(1, (hive.strength || 3) - 2);
        Game.save();
        GardenSystem.renderApiary();
        UI.notify('⚠️ ' + t('game.hiveVarroa'));
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PISCINA (Rybník) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    buildPiscina: function(tier) {
        const p = GameState.piscina;
        if (!GameState.researchedTechs.includes('tech_piscina')) { UI.notify(t('game.needDePiscibus'), true); return; }
        const costs = {
            1: { rock: 10, stick: 5 },
            2: { rock: 20, stick: 10, rope: 5 },
            3: { rock: 40, stick: 20, rope: 10 }
        };
        if (p.tier >= tier) { UI.notify(t('game.piscinaAlready'), true); return; }
        if (tier !== p.tier + 1) { UI.notify(t('game.piscinaTierOrder'), true); return; }
        const cost = costs[tier];
        if ((GameState.inventory['rock']||0) < cost.rock)  { UI.notify(t('game.needStone') + ` (${cost.rock})`, true); return; }
        if ((GameState.inventory['stick']||0) < cost.stick){ UI.notify(t('game.needWood')  + ` (${cost.stick})`, true); return; }
        if (cost.rope && (GameState.inventory['rope']||0) < cost.rope){ UI.notify(t('game.needRope') + ` (${cost.rope})`, true); return; }
        Game.removeItem('rock', cost.rock);
        Game.removeItem('stick', cost.stick);
        if (cost.rope) Game.removeItem('rope', cost.rope);
        p.tier = tier;
        Game.save(); GardenSystem.renderPiscina();
        UI.notify('🐟 ' + t('game.piscinaBuilt').replace('{tier}', tier));
    },

    addFry: function(qty) {
        const p = GameState.piscina;
        if (p.tier < 1) { UI.notify(t('game.needPiscina1'), true); return; }
        if ((GameState.inventory['fry']||0) < qty) { UI.notify(t('game.noFry'), true); return; }
        Game.removeItem('fry', qty);
        p.fry += qty;
        p.fryAddedAt = p.fryAddedAt || Date.now();
        Game.save(); GardenSystem.renderPiscina();
        UI.notify('🫧 ' + t('game.fryAdded').replace('{qty}', qty));
    },

    feedPiscina: function() {
        const p = GameState.piscina;
        if (p.tier < 1) return;
        const feedNeeded = p.fry + p.youngCarp + p.carp;
        if (feedNeeded === 0) { UI.notify(t('game.piscinaEmpty'), true); return; }
        if ((GameState.inventory['fiber']||0) < feedNeeded) { UI.notify(t('game.needFeedFish') + ` (${feedNeeded})`, true); return; }
        Game.removeItem('fiber', feedNeeded);
        p.lastFedAt = Date.now();
        Game.save(); GardenSystem.renderPiscina();
        UI.notify('🌿 ' + t('game.piscinaFed'));
    },

    transferFry: function() {
        const p = GameState.piscina;
        if (!p || (p.pendingFry||0) <= 0) { UI.notify(t('game.noFryPending'), true); return; }
        if (p.tier < 1) { UI.notify(t('game.needPiscina1'), true); return; }
        const qty = p.pendingFry;
        p.fry = (p.fry||0) + qty;
        p.pendingFry = 0;
        if (!p.fryAddedAt || p.fryAddedAt === 0) p.fryAddedAt = Date.now();
        Game.save(); GardenSystem.renderPiscina();
        UI.notify('🫧 ' + t('game.fryTransferred').replace('{qty}', qty));
    },

    harvestCarp: function(qty) {
        const p = GameState.piscina;
        qty = Math.min(qty, p.carp);
        if (qty <= 0) { UI.notify(t('game.noCarp'), true); return; }
        p.carp -= qty;
        Game.addItem('carp', qty);
        Game.save(); GardenSystem.renderPiscina();
        UI.notify('🐠 ' + t('game.carpHarvested').replace('{qty}', qty));
    },

    checkPiscinaGrowth: function() {
        const p = GameState.piscina;
        if (!p || p.tier < 1) return;
        const now = Date.now();
        const WEEK  = 7  * 24 * 3600000;
        const WEEKS2 = 14 * 24 * 3600000;
        let changed = false;

        // Tier 1 → tier 2: plůdek po týdnu přechází do výtažníku (pokud existuje)
        if (p.fry > 0 && p.tier >= 2 && p.fryAddedAt > 0 && now >= p.fryAddedAt + WEEK) {
            p.youngCarp += p.fry;
            p.fry = 0;
            p.youngAddedAt = now;
            p.fryAddedAt = 0;
            changed = true;
        }

        // Tier 2 → tier 3: nedospělí kapři po 2 týdnech přechází do kaprového rybníka
        if (p.youngCarp > 0 && p.tier >= 3 && p.youngAddedAt > 0 && now >= p.youngAddedAt + WEEKS2) {
            p.carp += p.youngCarp;
            p.youngCarp = 0;
            p.youngAddedAt = 0;
            changed = true;
        }

        // Tier 3: kaprový rybník produkuje 1 plůdek / 24h
        const DAY = 24 * 3600000;
        if (p.tier >= 3 && p.carp > 0) {
            if (p.lastFryProductionAt === undefined) p.lastFryProductionAt = now;
            if (now >= p.lastFryProductionAt + DAY) {
                p.pendingFry = (p.pendingFry || 0) + 1;
                p.lastFryProductionAt = now;
                changed = true;
            }
        }

        if (changed) { Game.save(); }
    },

    checkOrchardGrowth: function() {
        if (!GameState.orchard) return;
        const GROW_HOURS = {
            seed_apple: 48, seed_pear: 48, seed_plum: 36, seed_cherry: 36,
            seed_walnut: 72, seed_mulberry: 48, seed_quince: 60,
            seed_sorb: 72, seed_rowan: 48, seed_linden: 60,
        };
        let changed = false;
        GameState.orchard.forEach(slot => {
            if (slot.state === 'growing') {
                const hours = GROW_HOURS[slot.treeType] || 48;
                if (Date.now() >= slot.plantedAt + (hours * 3600000)) {
                    slot.state = 'mature';
                    slot.lastHarvestAt = Date.now(); // první sklizeň hned k dispozici
                    changed = true;
                }
            }
        });
        if (changed) { Game.save(); }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // GALLINARIUM (Kurník) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    buildHenhouse: function() {
        const h = GameState.henhouse;
        if (h.built) return;
        if ((GameState.inventory['rock'] || 0) < 15)  { UI.notify(t('game.needStone') + ' (15)', true); return; }
        if ((GameState.inventory['stick'] || 0) < 10) { UI.notify(t('game.needWood')  + ' (10)', true); return; }
        if ((GameState.inventory['rope'] || 0) < 3)   { UI.notify(t('game.needRope')  + ' (3)',  true); return; }
        Game.removeItem('rock', 15);
        Game.removeItem('stick', 10);
        Game.removeItem('rope', 3);
        h.built = true;
        Game.save(); GardenSystem.renderFarmyard();
        if (typeof CellariumSystem !== 'undefined' && (GameState.ui && GameState.ui.cellariumEntity) === 'buildings') CellariumSystem.switchEntity('buildings');
        UI.notify('🐔 ' + t('game.hennhouseBuilt'));
    },

    addHen: function(type) {
        const h = GameState.henhouse;
        if (!h.built) return;
        if (type === 'rooster') {
            if (h.rooster) { UI.notify(t('game.roosterAlready'), true); return; }
            if (!(GameState.inventory['rooster'] > 0)) { UI.notify(t('game.needRooster'), true); return; }
            Game.removeItem('rooster', 1);
            h.rooster = true;
        } else {
            if (h.hens.length >= 10) { UI.notify(t('game.hennsFull'), true); return; }
            if (!(GameState.inventory[type] > 0)) { UI.notify(t('game.needHen'), true); return; }
            Game.removeItem(type, 1);
            h.hens.push({ type, addedAt: Date.now() });
        }
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🐔 ' + t('game.henAdded'));
    },

    startNesting: function() {
        const h = GameState.henhouse;
        if (!h.built || !h.rooster || h.hens.length === 0) { UI.notify(t('game.nestingReq'), true); return; }
        if (h.nesting) { UI.notify(t('game.nestingActive'), true); return; }
        const now = Date.now();
        h.nesting = {
            state: 'nesting',
            startedAt: now,
            hatchAt: now + 86400000,  // 24h líhnutí
        };
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🥚 ' + t('game.nestingStarted'));
    },

    slaughterChick: function(qty) {
        const h = GameState.henhouse;
        qty = Math.min(qty, h.chickPool);
        if (qty <= 0) { UI.notify(t('game.noChicks'), true); return; }
        h.chickPool -= qty;
        Game.addItem('chicken_meat', qty);
        Game.addItem('feather_hen', qty * 2);
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🍗 ' + t('game.slaughtered').replace('{qty}', qty));
    },

    slaughterHen: function(idx) {
        const h = GameState.henhouse;
        if (!h.hens[idx]) return;
        h.hens.splice(idx, 1);
        Game.addItem('chicken_meat', 2);
        Game.addItem('feather_hen', 3);
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🍗 ' + t('game.henSlaughtered'));
    },

    collectHenhouse: function() {
        const h = GameState.henhouse;
        if (!h.built || h.hens.length === 0) return;
        const now = Date.now();
        const EGG_INTERVAL   = 8  * 3600000;
        const FEATH_INTERVAL = 24 * 3600000;
        let collected = false;
        if (now >= h.lastEggAt + EGG_INTERVAL) {
            const mult = h.rooster ? 1.2 : 1.0;
            const eggs = Math.floor(h.hens.length * mult);
            if (eggs > 0) { Game.addItem('egg', eggs); h.lastEggAt = now; collected = true; }
        }
        if (now >= h.lastFeatherAt + FEATH_INTERVAL) {
            Game.addItem('feather_hen', h.hens.length);
            h.lastFeatherAt = now; collected = true;
        }
        if (collected) { Game.save(); GardenSystem.renderFarmyard(); UI.notify('🥚 ' + t('game.hennouseCollected')); }
        else { const lang = (GameState.settings&&GameState.settings.language)||'cs'; UI.notify(lang==='en'?'🐔 Hens are still working...':'🐔 Slepice ještě pracují...', true); }
    },

    feedHenhouse: function() {
        const h = GameState.henhouse;
        if (!h.built || h.hens.length === 0) return;
        const chickFeed = h.nesting && h.nesting.state === 'growing' ? Math.ceil(h.nesting.chicks / 2) : 0;
        const totalFeed = h.hens.length + chickFeed;
        const feedItem = (GameState.inventory['seeds_herb'] || 0) >= totalFeed ? 'seeds_herb' : 'seeds_vegetable';
        if ((GameState.inventory[feedItem] || 0) < totalFeed) { UI.notify(t('game.needFeedHen') + ' (' + totalFeed + ')', true); return; }
        Game.removeItem(feedItem, totalFeed);
        h.lastFedAt = Date.now();
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🌾 ' + t('game.henFed'));
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // OVILE (Chlév) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    buildSheepfold: function() {
        const s = GameState.sheepfold;
        if (s.built) return;
        if (!GameState.researchedTechs.includes('tech_de_re_rustica')) { UI.notify(t('game.needDeReRustica'), true); return; }
        if ((GameState.inventory['rock'] || 0) < 20)  { UI.notify(t('game.needStone') + ' (20)', true); return; }
        if ((GameState.inventory['stick'] || 0) < 15) { UI.notify(t('game.needWood')  + ' (15)', true); return; }
        if ((GameState.inventory['rope'] || 0) < 5)   { UI.notify(t('game.needRope')  + ' (5)',  true); return; }
        Game.removeItem('rock', 20);
        Game.removeItem('stick', 15);
        Game.removeItem('rope', 5);
        s.built = true;
        Game.save(); GardenSystem.renderFarmyard();
        if (typeof CellariumSystem !== 'undefined' && (GameState.ui && GameState.ui.cellariumEntity) === 'buildings') CellariumSystem.switchEntity('buildings');
        UI.notify('🐑 ' + t('game.sheepfoldBuilt'));
    },

    addSheep: function() {
        const s = GameState.sheepfold;
        if (!s.built) return;
        if (s.sheep >= 6) { UI.notify(t('game.sheepFull'), true); return; }
        if (!(GameState.inventory['sheep'] > 0)) { UI.notify(t('game.needSheep'), true); return; }
        Game.removeItem('sheep', 1);
        s.sheep++;
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🐑 ' + t('game.sheepAdded'));
    },

    startBreeding: function() {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep < 2) { UI.notify(t('game.breedingReq'), true); return; }
        if (s.breeding) { UI.notify(t('game.breedingActive'), true); return; }
        const now = Date.now();
        s.breeding = {
            state: 'gestating',
            startedAt: now,
            bornAt: now + 172800000,  // 48h gestace
        };
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🐑 ' + t('game.breedingStarted'));
    },

    slaughterLamb: function(qty) {
        const s = GameState.sheepfold;
        qty = Math.min(qty, s.lambPool);
        if (qty <= 0) { UI.notify(t('game.noLambs'), true); return; }
        s.lambPool -= qty;
        Game.addItem('mutton', qty * 2);
        Game.addItem('lamb_hide', qty);
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🥩 ' + t('game.lambSlaughtered').replace('{qty}', qty));
    },

    slaughterSheep: function() {
        const s = GameState.sheepfold;
        if (s.sheep <= 0) return;
        s.sheep--;
        Game.addItem('mutton', 3);
        Game.addItem('raw_hide', 1);
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🥩 ' + t('game.sheepSlaughtered'));
    },

    collectSheepfold: function() {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep === 0) return;
        const now = Date.now();
        const MILK_INTERVAL = 12 * 3600000;
        const WOOL_INTERVAL = 48 * 3600000;
        let collected = false;
        if (now >= s.lastMilkAt + MILK_INTERVAL) {
            Game.addItem('milk', s.sheep);
            s.lastMilkAt = now; collected = true;
        }
        if (now >= s.lastWoolAt + WOOL_INTERVAL) {
            Game.addItem('wool', s.sheep);
            s.lastWoolAt = now; collected = true;
        }
        if (collected) { Game.save(); GardenSystem.renderFarmyard(); UI.notify('🐑 ' + t('game.sheepCollected')); }
        else UI.notify(t('game.hiveNotReady'), true);
    },

    feedSheepfold: function() {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep === 0) return;
        const lambFeed = s.breeding && s.breeding.state === 'growing' ? 1 : 0; // jehně potřebuje 1 trávu (polovina dospělé 2)
        const fiberNeeded = s.sheep * 2 + lambFeed;
        const waterNeeded = s.sheep + (lambFeed > 0 ? 1 : 0);
        if ((GameState.inventory['fiber'] || 0) < fiberNeeded) { UI.notify(t('game.needFeedSheep') + ' (' + fiberNeeded + ')', true); return; }
        if ((GameState.inventory['water'] || 0) < waterNeeded) { UI.notify(t('game.needWater'), true); return; }
        Game.removeItem('fiber', fiberNeeded);
        Game.removeItem('water', waterNeeded);
        s.lastFedAt = Date.now();
        s.lastWateredAt = Date.now();
        Game.save(); GardenSystem.renderFarmyard();
        UI.notify('🌿 ' + t('game.sheepFed'));
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // FARMYARD PRODUCTION TICK — volán každou minutu
    // ═══════════════════════════════════════════════════════════════════════════

    checkFarmyardProduction: function() {
        const now = Date.now();
        let changed = false;

        // Kurník — líhnutí a dorůstání
        const h = GameState.henhouse;
        if (h && h.nesting) {
            if (h.nesting.state === 'nesting' && now >= h.nesting.hatchAt) {
                // Vylíhnutí: 2–4 kuřata
                const count = 2 + Math.floor(Math.random() * 3);
                h.nesting.state   = 'growing';
                h.nesting.chicks  = count;
                h.nesting.hatchedAt = now;
                h.nesting.grownAt   = now + 172800000; // 48h dorůstání
                changed = true;
            }
            if (h.nesting.state === 'growing' && now >= h.nesting.grownAt) {
                // Dorůstání hotovo → pool
                const space = 10 - h.chickPool;
                h.chickPool += Math.min(h.nesting.chicks, space);
                h.nesting = null;
                changed = true;
            }
        }

        // Chlév — gestace a dorůstání
        const s = GameState.sheepfold;
        if (s && s.breeding) {
            if (s.breeding.state === 'gestating' && now >= s.breeding.bornAt) {
                s.breeding.state  = 'growing';
                s.breeding.lambAt = now;
                s.breeding.grownAt = now + 172800000; // 48h dorůstání
                changed = true;
            }
            if (s.breeding.state === 'growing' && now >= s.breeding.grownAt) {
                const space = 6 - s.lambPool;
                if (space > 0) { s.lambPool++; }
                s.breeding = null;
                changed = true;
            }
        }

        if (changed) Game.save();
    },

    // ════════════════════════════════════════════════════════════════════════
	// ─── KRMNÝ SYSTÉM ──────────────────────────────────────────────────────────
	checkAnimalFeeding: function() {
		const lang = (GameState.settings && GameState.settings.language) || 'cs';
		const now = Date.now();
		if (!GameState.feeding) GameState.feeding = {};
		const animals = [
			{ key: 'henhouse',  built: GameState.henhouse && GameState.henhouse.built && GameState.henhouse.hens && GameState.henhouse.hens.length > 0, feed: 'grain', feedAmt: 1, name: lang==='en'?'Hens':'Slepice' },
			{ key: 'sheepfold', built: GameState.sheepfold && GameState.sheepfold.built && GameState.sheepfold.sheep && GameState.sheepfold.sheep.length > 0, feed: 'hay', feedAmt: 1, name: lang==='en'?'Sheep':'Ovce' },
			{ key: 'piscina',   built: GameState.piscina && GameState.piscina.tier > 0, feed: 'worms', feedAmt: 1, name: lang==='en'?'Fish':'Ryby' },
		];
		animals.forEach(a => {
			if (!a.built) return;
			if (!GameState.feeding[a.key]) GameState.feeding[a.key] = { lastFed: now, hunger: 0 };
			const hoursSinceFed = (now - GameState.feeding[a.key].lastFed) / 3600000;
			if (hoursSinceFed >= 24) {
				const have = GameState.inventory[a.feed] || 0;
				if (have >= a.feedAmt) {
					Game.removeItem(a.feed, a.feedAmt);
					GameState.feeding[a.key].lastFed = now;
					GameState.feeding[a.key].hunger = 0;
					UI.notify(lang==='en' ? a.name+' fed automatically.' : a.name+' nakrmeny automaticky.');
				} else {
					GameState.feeding[a.key].hunger = Math.min(3, (GameState.feeding[a.key].hunger || 0) + 1);
					const penalty = GameState.feeding[a.key].hunger >= 3 ? 75 : GameState.feeding[a.key].hunger >= 2 ? 50 : 25;
					UI.notify((lang==='en' ? a.name+' hungry! Production -' : a.name+' hladovi! Produkce -')+penalty+'%', true);
					Game.addKronikaEntry('warning', a.name+' hladovi — chybi '+a.feed+'.', a.name+' hungry — no '+a.feed+'.', a.name+' esuriunt.');
				}
			}
		});
		Game.save();
	},

	// ─── TOOL USES SYSTÉM ──────────────────────────────────────────────────────
	useToolCharge: function(itemId) {
		const item = ItemsDB[itemId];
		if (!item || !item.maxUses) return; // Nástroj bez maxUses — nespotřebovává se (pestle atd.)

		if (!GameState.toolUses) GameState.toolUses = {};
		if (GameState.toolUses[itemId] === undefined) {
			GameState.toolUses[itemId] = item.maxUses;
		}

		GameState.toolUses[itemId]--;
		const remaining = GameState.toolUses[itemId];
		const lang = (GameState.settings && GameState.settings.language) || 'cs';
		const name = (typeof iName === 'function') ? iName(itemId) : itemId;

		if (remaining <= 0) {
			// Nástroj se opotřeboval
			const wornId = 'worn_' + itemId; // worn_iron_axe atd.
			if (itemId.startsWith('worn_') && item.tier === 'iron') {
				// Worn iron po 3 použitích → nenávratně zničen
				Game.removeItem(itemId, 1);
				delete GameState.toolUses[itemId];
				UI.notify((lang==='en' ? '💀 ' + name + ' destroyed beyond repair.' : '💀 ' + name + ' — nenávratně zničena.'), true);
				if (typeof NotificationSystem !== 'undefined') {
					NotificationSystem.panel((lang==='en' ? '💀 ' + name + ' destroyed. Craft new tools.' : '💀 ' + name + ' zničena. Vykov nové nástroje.'), 'warning');
				}
			} else if (item.tier === 'iron' && ItemsDB[wornId]) {
				// Iron → degradace na worn
				Game.removeItem(itemId, 1);
				Game.addItem(wornId, 1);
				delete GameState.toolUses[itemId];
				UI.notify((lang==='en' ? name + ' worn out — repair it.' : name + ' se opotřebovala — oprav ji.'), true);
				if (typeof NotificationSystem !== 'undefined') {
					NotificationSystem.panel((lang==='en' ? '🔧 ' + name + ' worn out. Needs repair.' : '🔧 ' + name + ' opotřebována. Potřebuje opravu.'), 'system');
				}
			} else {
				// Stone → smazat
				Game.removeItem(itemId, 1);
				delete GameState.toolUses[itemId];
				UI.notify((lang==='en' ? name + ' broke.' : name + ' se zlomila.'), true);
			}
		} else if (remaining > 0) {
			if (itemId.startsWith('worn_') && item.tier === 'iron') {
				// Worn nástroj — varování při každém použití
				UI.notify((lang==='en'
					? '⚠️ ' + name + ': ' + remaining + ' use(s) before destruction!'
					: '⚠️ ' + name + ': ještě ' + remaining + '× než se zničí!'), true);
				if (typeof NotificationSystem !== 'undefined') {
					NotificationSystem.panel((lang==='en'
						? '⚠️ ' + name + ': ' + remaining + ' use(s) left — repair or replace!'
						: '⚠️ ' + name + ': zbývají ' + remaining + ' použití — oprav nebo vykov nové!'), 'warning');
				}
			} else if (remaining === 3) {
				// Varování před koncem pro normální nástroje
				UI.notify((lang==='en' ? '⚠️ ' + name + ': ' + remaining + ' uses left.' : '⚠️ ' + name + ': zbývají ' + remaining + ' použití.'));
			}
		}
	},

	feedAnimals: function(animalKey) {
		const lang = (GameState.settings && GameState.settings.language) || 'cs';
		const feedMap = { henhouse: 'grain', sheepfold: 'hay', piscina: 'worms' };
		const nameMap = { henhouse: lang==='en'?'Hens':'Slepice', sheepfold: lang==='en'?'Sheep':'Ovce', piscina: lang==='en'?'Fish':'Ryby' };
		const feed = feedMap[animalKey];
		if (!feed) return;
		if ((GameState.inventory[feed] || 0) < 1) {
			UI.notify(lang==='en' ? 'No '+feed+' in stores.' : 'V zasobách neni '+feed+'.', true); return;
		}
		Game.removeItem(feed, 1);
		if (!GameState.feeding) GameState.feeding = {};
		if (!GameState.feeding[animalKey]) GameState.feeding[animalKey] = {};
		GameState.feeding[animalKey].lastFed = Date.now();
		GameState.feeding[animalKey].hunger = 0;
		UI.notify((lang==='en'?nameMap[animalKey]+' fed.':nameMap[animalKey]+' nakrmeny.'));
		Game.save();
	},

	buildStorage: function(type) {
		const lang = (GameState.settings && GameState.settings.language) || 'cs';
		if (!GameState.storage) GameState.storage = { almarium: {built:false}, cella: {built:false}, horreum: {built:false}, fabrica: {built:false} };
		if (!GameState.storage.fabrica) GameState.storage.fabrica = {built:false};
		if (!GameState.storage.transactions) GameState.storage.transactions = [];
		if (type === 'cella' && !GameState.storage.almarium.built) {
			UI.notify(lang==='en' ? 'Build Almarium first.' : 'Nejprve postav Almarium.', true); return;
		}
		if (type === 'horreum' && !GameState.storage.cella.built) {
			UI.notify(lang==='en' ? 'Build Cella first.' : 'Nejprve postav Cellu.', true); return;
		}
		if (GameState.storage[type] && GameState.storage[type].built) {
			UI.notify(lang==='en' ? 'Already built.' : 'Jiz postaveno.', true); return;
		}
		const costs = {
			almarium: { plank: 6, rope: 3, leather: 2 },
			cella:    { cut_stone: 12, rope: 5, chalk: 4 },
			horreum:  { cut_stone: 20, plank: 10, glue: 4, rope: 6 },
			fabrica:  { rock: 30, plank: 15, charcoal: 10, anvil: 1 },
		};
		const cost = costs[type];
		if (!cost) return;
		for (const [item, amt] of Object.entries(cost)) {
			if ((GameState.inventory[item] || 0) < amt) {
				const itemName = (typeof iName === 'function') ? iName(item) : item;
				UI.notify((lang==='en'?'Not enough: ':'Nedostatek: ')+itemName+' x'+amt, true); return;
			}
		}
		for (const [item, amt] of Object.entries(cost)) { Game.removeItem(item, amt); }
		GameState.storage[type].built = true;
		Game.save();
		const names = { almarium: 'Almarium', cella: 'Cella', horreum: 'Horreum', fabrica: 'Fabrica' };
		const n = names[type];
		UI.notifyPanel('🏗️ ' + (lang==='en' ? n+' built.' : n+' postaveno.'), 'system');
		Game.addKronikaEntry('important', n+' postaveno.', n+' built.', n+' aedificatum est.');
		// BUG #7 fix — re-render Buildings tabu po stavbě
		if (typeof CellariumSystem !== 'undefined') {
			if (!GameState.ui) GameState.ui = {};
			GameState.ui.cellariumEntity = 'buildings';
			const _cel = document.getElementById('cellarium-content');
			if (_cel) _cel.outerHTML = CellariumSystem.renderCellariumContent();
		}
	},

    // ════════════════════════════════════════════════════════════════════════
    // UI RENDER — Zahrada, Dvůr, Sad, Apiarium, Piscina
    // ════════════════════════════════════════════════════════════════════════

    _activeTab: 'dvur',

    switchGardenTab: function(tab, btn) {
        document.getElementById('garden-tab-zahony').style.display   = tab === 'zahony'   ? '' : 'none';
        document.getElementById('garden-tab-sad').style.display      = tab === 'sad'      ? '' : 'none';
        document.getElementById('garden-tab-apiarium').style.display = tab === 'apiarium' ? '' : 'none';
        document.getElementById('garden-tab-dvur').style.display     = tab === 'dvur'     ? '' : 'none';
        document.getElementById('garden-tab-piscina').style.display  = tab === 'piscina'  ? '' : 'none';
        const poleEl = document.getElementById('garden-tab-pole');
        if (poleEl) poleEl.style.display = tab === 'pole' ? '' : 'none';
        const vineaEl = document.getElementById('garden-tab-vinohrad');
        if (vineaEl) vineaEl.style.display = tab === 'vinohrad' ? '' : 'none';
        this._activeTab = tab;
        document.querySelectorAll('#screen-garden .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (tab === 'zahony')   GardenSystem.renderGarden();
        if (tab === 'dvur')     GardenSystem.renderFarmyard();
        if (tab === 'sad')      GardenSystem.renderOrchard();
        if (tab === 'apiarium') GardenSystem.renderApiary();
        if (tab === 'piscina')  GardenSystem.renderPiscina();
        if (tab === 'pole')     GardenSystem.renderFieldTab();
        if (tab === 'vinohrad') GardenSystem.renderVinohrad();
        // Kočka — init při prvním otevření Zahrady + kontrola, zda sídlí na tomto subtabu
        if (typeof ScriptoriumCat !== 'undefined') { ScriptoriumCat.show(); ScriptoriumCat.onTabSwitch(); }
    },

    renderFarmyard: function() {
        const el = document.getElementById('farmyard-container');
        if (!el) return;
        const h = GameState.henhouse  || {};
        const s = GameState.sheepfold || {};
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        let html = '';

        // GALLINARIUM
        html += `<div style="margin-bottom:24px; padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        // ── Dvůr v2: dashboard + subtaby ──────────────────────────────────
        const tab = this._dvurTab || 'kurnik';
        html += this._renderDvurDashboard();
        html += this._renderDvurTabs(tab);

        if (tab === 'kurnik') {
            html += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🐔 ${t('farmyard.gallinarium')}</h3>`;
            if (!h.built) {
                html += `<p class="text-sm" style="opacity:0.7; margin-bottom:10px;">${t('farmyard.hennhouseBuildDesc')}</p>`;
                html += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            } else {
                const hensCount = (h.hens||[]).length;
                html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; font-size:0.82rem;">`;
                html += `<div>🐔 ${t('farmyard.hens')}: <strong>${hensCount}/10</strong></div>`;
                html += `<div>🐓 ${t('farmyard.rooster')}: <strong>${h.rooster ? '✓' : '✗'}</strong></div>`;
                const eggReady  = now >= (h.lastEggAt||0) + 28800000;
                const feathReady = now >= (h.lastFeatherAt||0) + 86400000;
                html += `<div>🥚 ${t('farmyard.eggs')}: <strong>${eggReady ? t('farmyard.ready') : Math.ceil(((h.lastEggAt||0)+28800000-now)/3600000)+'h'}</strong></div>`;
                html += `<div>🪶 ${t('farmyard.feathers')}: <strong>${feathReady ? t('farmyard.ready') : Math.ceil(((h.lastFeatherAt||0)+86400000-now)/3600000)+'h'}</strong></div>`;
                html += `</div>`;
                html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">`;
                if (!h.rooster) {
                    const hasR = (GameState.inventory['rooster']||0) > 0;
                    html += `<button class="craft-btn" onclick="Game.addHen('rooster')" ${hasR?'':'disabled'} style="font-size:0.75rem;">🐓 ${t('farmyard.addRooster')}</button>`;
                }
                ['hen_white','hen_black','hen_colored'].forEach(type => {
                    const has = (GameState.inventory[type]||0) > 0;
                    const icon = type==='hen_white'?'🐔':type==='hen_black'?'🐓':'🐣';
                    html += `<button class="craft-btn" onclick="Game.addHen('${type}')" ${has&&hensCount<10?'':'disabled'} style="font-size:0.75rem; white-space:normal; word-break:break-word;">${icon} ${iName(type)}</button>`;
                });
                html += `</div>`;
                html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">`;
                html += `<button class="craft-btn" onclick="Game.collectHenhouse()" ${hensCount>0?'':'disabled'}>🥚 ${t('farmyard.collect')}</button>`;
                html += `<button class="craft-btn" onclick="Game.feedHenhouse()" ${hensCount>0?'':'disabled'} style="background:#4a7c59;">🌾 ${t('farmyard.feed')}</button>`;
                html += `</div>`;
                html += `<div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.06); border-radius:8px;">`;
                html += `<strong style="font-size:0.85rem;">🥚 ${t('farmyard.nesting')}</strong><br>`;
                if (!h.nesting) {
                    const canNest = h.rooster && hensCount > 0;
                    html += `<button class="craft-btn" onclick="Game.startNesting()" ${canNest?'':'disabled'} style="margin-top:6px; font-size:0.78rem;">${t('farmyard.startNesting')}</button>`;
                } else if (h.nesting.state === 'nesting') {
                    const left = Math.max(0, Math.ceil((h.nesting.hatchAt - now)/3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐣 ${t('farmyard.nestingProgress')} — ${left}h</p>`;
                } else if (h.nesting.state === 'growing') {
                    const left = Math.max(0, Math.ceil((h.nesting.grownAt - now)/3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐥 ${t('farmyard.chicksGrowing').replace('{n}', h.nesting.chicks)} — ${left}h</p>`;
                }
                if ((h.chickPool||0) > 0) {
                    html += `<div style="margin-top:8px; font-size:0.82rem;">🐓 ${t('farmyard.chickPool')}: <strong>${h.chickPool}</strong>
                        <button class="craft-btn" onclick="Game.slaughterChick(1)" style="margin-left:8px; font-size:0.72rem; background:#8b4a3a;">🍗 x1</button>
                        <button class="craft-btn" onclick="Game.slaughterChick(${h.chickPool})" style="margin-left:4px; font-size:0.72rem; background:#8b4a3a;">🍗 ${lang==='en'?'All':'Vše'}</button></div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        } else if (tab === 'ovcin') {
            // OVILE
            const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_de_re_rustica');
            html += `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid ${hasTech?'var(--accent-gold)':'rgba(0,0,0,0.2)'};">`;
            html += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🐑 ${t('farmyard.ovile')}</h3>`;
            if (!hasTech) {
                html += `<p class="text-sm" style="opacity:0.6; font-style:italic;">${t('farmyard.ovileLocked')}</p>`;
            } else if (!s.built) {
                html += `<p class="text-sm" style="opacity:0.7; margin-bottom:10px;">${t('farmyard.sheepfoldBuildDesc')}</p>`;
                html += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            } else {
                html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; font-size:0.82rem;">`;
                html += `<div>🐑 ${t('farmyard.sheep')}: <strong>${s.sheep||0}/6</strong></div>`;
                const milkReady = now >= (s.lastMilkAt||0) + 43200000;
                const woolReady = now >= (s.lastWoolAt||0) + 172800000;
                html += `<div>🥛 ${t('farmyard.milk')}: <strong>${milkReady ? t('farmyard.ready') : Math.ceil(((s.lastMilkAt||0)+43200000-now)/3600000)+'h'}</strong></div>`;
                html += `<div>🧶 ${t('farmyard.wool')}: <strong>${woolReady ? t('farmyard.ready') : Math.ceil(((s.lastWoolAt||0)+172800000-now)/3600000)+'h'}</strong></div>`;
                html += `</div>`;
                html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">`;
                const hasSheepItem = (GameState.inventory['sheep']||0) > 0;
                html += `<button class="craft-btn" onclick="Game.addSheep()" ${hasSheepItem&&(s.sheep||0)<6?'':'disabled'}>🐑 ${t('farmyard.addSheep')}</button>`;
                html += `<button class="craft-btn" onclick="Game.collectSheepfold()" ${(s.sheep||0)>0?'':'disabled'}>🥛 ${t('farmyard.collect')}</button>`;
                html += `<button class="craft-btn" onclick="Game.feedSheepfold()" ${(s.sheep||0)>0?'':'disabled'} style="background:#4a7c59;">🌿 ${t('farmyard.feed')}</button>`;
                if ((s.sheep||0) > 0) {
                    html += `<button class="craft-btn" onclick="Game.slaughterSheep()" style="background:#8b4a3a; font-size:0.78rem;">🥩 ${t('farmyard.slaughterSheep')}</button>`;
                }
                html += `</div>`;
                html += `<div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.06); border-radius:8px;">`;
                html += `<strong style="font-size:0.85rem;">🐑 ${t('farmyard.breeding')}</strong><br>`;
                if (!s.breeding) {
                    const canBreed = (s.sheep||0) >= 2;
                    html += `<button class="craft-btn" onclick="Game.startBreeding()" ${canBreed?'':'disabled'} style="margin-top:6px; font-size:0.78rem;">${t('farmyard.startBreeding')}</button>`;
                } else if (s.breeding.state === 'gestating') {
                    const left = Math.max(0, Math.ceil((s.breeding.bornAt - now)/3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🤰 ${t('farmyard.gestating')} — ${left}h</p>`;
                } else if (s.breeding.state === 'growing') {
                    const left = Math.max(0, Math.ceil((s.breeding.grownAt - now)/3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐑 ${t('farmyard.lambGrowing')} — ${left}h</p>`;
                }
                if ((s.lambPool||0) > 0) {
                    html += `<div style="margin-top:8px; font-size:0.82rem;">🐑 ${t('farmyard.lambPool')}: <strong>${s.lambPool}</strong>
                        <button class="craft-btn" onclick="Game.slaughterLamb(1)" style="margin-left:8px; font-size:0.72rem; background:#8b4a3a;">🥩 x1</button>
                        <button class="craft-btn" onclick="Game.slaughterLamb(${s.lambPool})" style="margin-left:4px; font-size:0.72rem; background:#8b4a3a;">🥩 ${lang==='en'?'All':'Vše'}</button></div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        } else if (tab === 'kralikarna' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_cuniculi')) {
            html += this._renderAnimalPen('rabbitry');
        } else if (tab === 'kozi' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_caprile')) {
            html += this._renderAnimalPen('goatpen');
        } else if (tab === 'chlev' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_suile')) {
            html += this._renderAnimalPen('pigsty');
        } else if (tab === 'staj' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_stabulum')) {
            html += this._renderAnimalPen('stable');
        } else if (tab !== 'studna') {
            html += this._renderDvurLocked(tab);
        }

        el.innerHTML = html;
        // Studna — statický blok v shell.html, jen show/hide dle subtabu
        const wellEl = document.getElementById('well-management');
        if (wellEl) wellEl.style.display = (tab === 'studna') ? 'block' : 'none';
    },


    // ═══════════════════════════════════════════════════════════════════
    // ZVĚŘ v2 — Králíkárna / Kozí chlívek / Chlév
    // ═══════════════════════════════════════════════════════════════════

    ANIMAL_CFG: {
        rabbitry: { itemId: 'rabbit', cap: 6,
            build: { plank: 10, stick: 5, rope: 2 },
            growMs:  4 * 24 * 60 * 60 * 1000,           // dospělost: 4 dny krmení
            breedMs: 7 * 24 * 60 * 60 * 1000 },        // množení: check 1×/7 dní
        goatpen:  { itemId: 'goat', cap: 3,
            build: { plank: 12, rock: 8, rope: 3 },
            milkMs: 12 * 60 * 60 * 1000 },             // mléko à 12h
        pigsty:   { itemId: 'piglet', cap: 3,
            build: { cut_stone: 15, plank: 10 },
            growMs: 60 * 24 * 60 * 60 * 1000,          // dospělost 60 dní
            acornBoostMs: 5 * 24 * 60 * 60 * 1000 },   // 1 žalud = −5 dní
        stable:   { itemId: 'horse', cap: 2,
            build: { plank: 15, cut_stone: 10, rope: 4 } },  // v1: jen ustájení, bez produkce
    },

    _penHungry: function(key) {
        const f = GameState.feeding && GameState.feeding[key];
        return !!(f && f.hunger > 0);
    },

    _ensureAnimals: function() {
        if (!GameState.rabbitry) GameState.rabbitry = { built: false, animals: [], lastBreed: 0 };
        if (!GameState.goatpen)  GameState.goatpen  = { built: false, animals: [] };
        if (!GameState.pigsty)   GameState.pigsty   = { built: false, animals: [] };
        if (!GameState.stable)   GameState.stable   = { built: false, animals: [] };
    },

    _animalCanBuild: function(cost) {
        const inv = GameState.inventory || {};
        return Object.entries(cost).every(([id, n]) => (inv[id] || 0) >= n);
    },

    buildAnimalPen: function(pen) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        if (!cfg || GameState[pen].built) return;
        if (!this._animalCanBuild(cfg.build)) { UI.notify(t('dvur.notEnough'), true); return; }
        Object.entries(cfg.build).forEach(([id, n]) => { GameState.inventory[id] -= n; });
        GameState[pen].built = true;
        UI.notify('🏗️ ' + t('dvur.built_' + pen));
        Game.save(); this.renderFarmyard();
    },

    placeAnimal: function(pen) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        const st = GameState[pen];
        if (!cfg || !st.built) return;
        if (st.animals.length >= cfg.cap) { UI.notify(t('dvur.penFull'), true); return; }
        if ((GameState.inventory[cfg.itemId] || 0) < 1) { UI.notify(t('dvur.noAnimal'), true); return; }
        GameState.inventory[cfg.itemId] -= 1;
        const a = { placedAt: Date.now() };
        if (pen === 'goatpen') a.lastMilk = Date.now();
        st.animals.push(a);
        UI.notify(t('dvur.placed_' + pen));
        Game.save(); this.renderFarmyard();
    },

    // ── Králíci: množení (check na render, guard 7 dní) ──────────────────
    _rabbitBreedCheck: function() {
        const st = GameState.rabbitry, cfg = this.ANIMAL_CFG.rabbitry;
        if (!st.built || st.animals.length < 2 || st.animals.length >= cfg.cap) return;
        if (this._penHungry('rabbitry')) { st.lastBreed = Date.now(); return; }   // hladoví se nemnoží
        const now = Date.now();
        if (!st.lastBreed) { st.lastBreed = now; return; }
        let births = 0;
        while (now - st.lastBreed >= cfg.breedMs && st.animals.length < cfg.cap) {
            st.lastBreed += cfg.breedMs;
            if (Math.random() < 0.6) { st.animals.push({ placedAt: now }); births++; }
        }
        if (now - st.lastBreed >= cfg.breedMs) st.lastBreed = now; // cap dosažen — reset
        if (births) {
            UI.notify('🐇 ' + t('dvur.rabbitBorn'));
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('event',
                    '🐇 V králíkárně přibylo mládě.',
                    '🐇 A kit was born in the rabbit hutch.',
                    '🐇 Cuniculus natus est.');
            }
            Game.save();
        }
    },

    slaughterRabbit: function(idx) {
        const st = GameState.rabbitry, cfg = this.ANIMAL_CFG.rabbitry;
        if (!st.built || !st.animals.length) return;
        const a = st.animals[idx];
        if (!a) return;
        // Porazit jen dospělého (≥ growMs)
        if (Date.now() - a.placedAt < cfg.growMs) {
            UI.notify(t('dvur.rabbitNotMature'), true); return;
        }
        st.animals.splice(idx, 1);
        GameState.inventory['rabbit_meat'] = (GameState.inventory['rabbit_meat'] || 0) + 1;
        GameState.inventory['rabbit_pelt'] = (GameState.inventory['rabbit_pelt'] || 0) + 1;
        UI.notify('🍖 ' + t('dvur.rabbitSlaughtered'));
        Game.save(); this.renderFarmyard();
    },

    // ── Kozy: mléko collect ──────────────────────────────────────────────
    collectGoatMilk: function() {
        const st = GameState.goatpen, cfg = this.ANIMAL_CFG.goatpen;
        if (!st.built) return;
        if (this._penHungry('goatpen')) { UI.notify(t('dvur.goatsHungry'), true); return; }
        const now = Date.now();
        let milk = 0;
        st.animals.forEach(a => {
            if (now - (a.lastMilk || a.placedAt) >= cfg.milkMs) {
                milk++; a.lastMilk = now;
                if (Math.random() < 0.05) GameState.inventory['goat_hide'] = (GameState.inventory['goat_hide'] || 0) + 1;
            }
        });
        if (milk) {
            GameState.inventory['goat_milk'] = (GameState.inventory['goat_milk'] || 0) + milk;
            UI.notify('🥛 ' + t('dvur.goatMilked').replace('{n}', milk));
            Game.save(); this.renderFarmyard();
        } else {
            UI.notify(t('dvur.goatNotReady'), true);
        }
    },

    // ── Prasata: žaludy + zabijačka ──────────────────────────────────────
    feedAcorn: function(idx) {
        const st = GameState.pigsty, cfg = this.ANIMAL_CFG.pigsty;
        const a = st.animals[idx];
        if (!a) return;
        if ((GameState.inventory['acorn'] || 0) < 1) { UI.notify(t('dvur.noAcorn'), true); return; }
        GameState.inventory['acorn'] -= 1;
        a.placedAt -= cfg.acornBoostMs;   // růst se "posune" o 5 dní zpět
        UI.notify('🌰 ' + t('dvur.acornFed'));
        Game.save(); this.renderFarmyard();
    },

    _pigMature: function(a) {
        return Date.now() - a.placedAt >= this.ANIMAL_CFG.pigsty.growMs;
    },

    slaughterPig: function(idx) {
        const st = GameState.pigsty;
        const a = st.animals[idx];
        if (!a || !this._pigMature(a)) return;
        st.animals.splice(idx, 1);
        const inv = GameState.inventory;
        inv['meat'] = (inv['meat'] || 0) + 4;
        inv['lard'] = (inv['lard'] || 0) + 3;
        inv['cured_meat'] = (inv['cured_meat'] || 0) + 2;
        UI.notify('🔪 ' + t('dvur.pigSlaughtered'));
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
            Game.addKronikaEntry('important',
                '🐖 Zabijačka! Klášterní spižírna se naplnila masem, sádlem a špekem.',
                '🐖 Pig slaughter! The monastery larder filled with meat, lard and cured meat.',
                '🐖 Porcus mactatus est.');
        }
        Game.save(); this.renderFarmyard();
    },

    // ── Render subtabů ────────────────────────────────────────────────────
    _renderAnimalPen: function(pen) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        const st = GameState[pen];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const icons = { rabbitry: '🐇', goatpen: '🐐', pigsty: '🐖', stable: '🐎' };
        let h = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        h += `<h3 style="margin:0 0 12px 0; font-size:1rem;">${icons[pen]} ${t('dvur.title_' + pen)}</h3>`;

        if (!st.built) {
            h += `<p class="text-sm" style="opacity:0.7; margin-bottom:10px;">${t('dvur.buildDesc_' + pen)}</p>`;
            h += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            h += `</div>`;
            return h;
        }

        if (pen === 'rabbitry') this._rabbitBreedCheck();

        h += `<div style="font-size:0.82rem; margin-bottom:10px;">${t('dvur.occupancy')}: <strong>${st.animals.length} / ${cfg.cap}</strong></div>`;

        const haveItem = (GameState.inventory[cfg.itemId] || 0);
        h += `<button class="craft-btn" style="margin-bottom:10px;" onclick="GardenSystem.placeAnimal('${pen}')"
            ${(haveItem > 0 && st.animals.length < cfg.cap) ? '' : 'disabled'}>➕ ${t('dvur.place_' + pen)} (${t('dvur.have')}: ${haveItem})</button>`;
        if (haveItem === 0 && st.animals.length < cfg.cap) {
            h += `<div style="font-size:0.74rem; opacity:0.6; font-style:italic; margin-bottom:10px;">${t('dvur.buyAtMarket')}</div>`;
        }

        if (this._penHungry(pen)) {
            h += `<div style="font-size:0.78rem; color:#c0392b; margin-bottom:8px;">⚠️ ${t('dvur.penHungry')}</div>`;
        }

        if (pen === 'rabbitry' && st.animals.length) {
            // Per-rabbit display (vzor pigsty) — porazit jen dospělé (≥ growMs = 4 dny)
            const now = Date.now();
            h += `<div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">`;
            st.animals.forEach((a, i) => {
                const mature = now - a.placedAt >= cfg.growMs;
                const pct = Math.min(100, Math.round((now - a.placedAt) / cfg.growMs * 100));
                const daysLeft = mature ? 0 : Math.ceil((cfg.growMs - (now - a.placedAt)) / 86400000);
                h += `<div style="padding:7px 10px; background:rgba(0,0,0,0.04); border-radius:6px; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:1.1rem;">${mature ? '🐰' : '🐇'}</span>
                    <div style="flex:1;">
                        <div style="font-size:0.78rem;">${mature ? t('dvur.rabbitMature') : t('dvur.rabbitGrowing') + ' ' + pct + '%' + (daysLeft ? ' (' + daysLeft + ' ' + t('dvur.daysLeft') + ')' : '')}</div>
                        <div style="height:4px; background:rgba(0,0,0,0.1); border-radius:3px; margin-top:3px;">
                            <div style="height:100%; width:${pct}%; background:var(--accent-gold); border-radius:3px;"></div>
                        </div>
                    </div>
                    ${mature ? `<button class="craft-btn" style="padding:4px 8px; font-size:0.72rem;" onclick="GardenSystem.slaughterRabbit(${i})">🔪 ${t('dvur.slaughterRabbit')}</button>` : ''}
                </div>`;
            });
            h += `</div>`;
            if (st.animals.length >= 2 && st.animals.length < cfg.cap && !this._penHungry('rabbitry')) {
                h += `<div style="font-size:0.78rem; opacity:0.7; margin-top:8px;">💕 ${t('dvur.breeding')}</div>`;
            }
        }

        if (pen === 'goatpen' && st.animals.length) {
            const now = Date.now();
            const readyCount = st.animals.filter(a => now - (a.lastMilk || a.placedAt) >= cfg.milkMs).length;
            // Stats grid
            h += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px; font-size:0.82rem;">`;
            h += `<div>🥛 ${t('dvur.milkReady')}: <strong>${readyCount}/${st.animals.length}</strong></div>`;
            const nextMilkMs = Math.min(...st.animals.map(a => cfg.milkMs - (now - (a.lastMilk || a.placedAt))));
            const nextMilkH = nextMilkMs > 0 ? Math.ceil(nextMilkMs / 3600000) : 0;
            h += `<div>${t('dvur.nextMilk')}: <strong>${readyCount === st.animals.length ? '✓' : nextMilkH + 'h'}</strong></div>`;
            h += `</div>`;
            // Per-goat rows
            h += `<div style="display:flex; flex-direction:column; gap:5px; margin-bottom:10px;">`;
            st.animals.forEach((a, i) => {
                const goatReady = now - (a.lastMilk || a.placedAt) >= cfg.milkMs;
                const msLeft = cfg.milkMs - (now - (a.lastMilk || a.placedAt));
                const hLeft = Math.max(0, Math.ceil(msLeft / 3600000));
                h += `<div style="padding:5px 8px; background:rgba(0,0,0,0.04); border-radius:5px; font-size:0.78rem; display:flex; align-items:center; gap:6px;">
                    <span>🐐</span>
                    <span>${t('dvur.goatLabel')} ${i+1}</span>
                    <span style="margin-left:auto; ${goatReady ? 'color:#27ae60;' : 'opacity:0.6;'}">${goatReady ? '🥛 ' + t('dvur.ready') : hLeft + 'h'}</span>
                </div>`;
            });
            h += `</div>`;
            h += `<button class="craft-btn" onclick="GardenSystem.collectGoatMilk()" ${readyCount ? '' : 'disabled'}>🥛 ${t('dvur.milkGoats')} (${readyCount})</button>`;
        }

        if (pen === 'pigsty' && st.animals.length) {
            h += `<div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">`;
            st.animals.forEach((a, i) => {
                const mature = this._pigMature(a);
                const pct = Math.min(100, Math.round((Date.now() - a.placedAt) / cfg.growMs * 100));
                const daysLeft = mature ? 0 : Math.ceil((cfg.growMs - (Date.now() - a.placedAt)) / 86400000);
                h += `<div style="padding:8px 10px; background:rgba(0,0,0,0.04); border-radius:6px; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:1.2rem;">${mature ? '🐖' : '🐷'}</span>
                    <div style="flex:1;">
                        <div style="font-size:0.78rem;">${mature ? t('dvur.pigMature') : t('dvur.pigGrowing') + ' ' + pct + '%' + (daysLeft ? ' (' + daysLeft + ' ' + t('dvur.daysLeft') + ')' : '')}</div>
                        <div style="height:5px; background:rgba(0,0,0,0.1); border-radius:3px; margin-top:3px;">
                            <div style="height:100%; width:${pct}%; background:var(--accent-gold); border-radius:3px;"></div>
                        </div>
                    </div>
                    ${mature
                        ? `<button class="craft-btn" style="padding:4px 8px; font-size:0.72rem;" onclick="GardenSystem.slaughterPig(${i})">🔪 ${t('dvur.slaughterPig')}</button>`
                        : `<button class="craft-btn" style="padding:4px 8px; font-size:0.72rem;" onclick="GardenSystem.feedAcorn(${i})" ${(GameState.inventory['acorn']||0) ? '' : 'disabled'}>🌰 ${t('dvur.feedAcorn')}</button>`}
                </div>`;
            });
            h += `</div>`;
        }

        if (pen === 'stable') {
            // Mine bonus badge
            const horseCount = st.animals.length;
            const multMap = { 0: 1.0, 1: 0.75, 2: 0.5 };
            const mult = multMap[horseCount] || 0.5;
            const multLabel = mult < 1 ? `×${mult}` : t('dvur.noBonus');
            const multColor = mult < 1 ? '#27ae60' : 'inherit';
            h += `<div style="padding:8px 10px; background:rgba(0,0,0,0.04); border-radius:6px; margin-bottom:10px; font-size:0.82rem;">`;
            h += `<div>⛏️ ${t('dvur.mineBonus')}: <strong style="color:${multColor};">${multLabel}</strong> ${t('dvur.mineBonusDesc')}</div>`;
            h += `</div>`;
            if (st.animals.length) {
                h += `<div style="display:flex; flex-direction:column; gap:5px; margin-bottom:10px;">`;
                st.animals.forEach((a, i) => {
                    const ageDays = Math.floor((Date.now() - a.placedAt) / 86400000);
                    h += `<div style="padding:6px 10px; background:rgba(0,0,0,0.04); border-radius:5px; font-size:0.8rem; display:flex; align-items:center; gap:6px;">
                        <span>🐎</span>
                        <span>${t('dvur.horseLabel')} ${i+1}</span>
                        <span style="margin-left:auto; opacity:0.6;">${ageDays} ${t('dvur.days')}</span>
                    </div>`;
                });
                h += `</div>`;
            }
        }

        h += `</div>`;
        return h;
    },

    // ── Dvůr v2 helpers ──────────────────────────────────────────────────
    _dvurTab: 'kurnik',

    switchDvurTab: function(tab) {
        this._dvurTab = tab;
        this.renderFarmyard();
    },

    DVUR_TABS: [
        { id: 'kurnik',     icon: '🐔', tech: null },
        { id: 'ovcin',      icon: '🐑', tech: null },
        { id: 'kralikarna', icon: '🐇', tech: 'tech_cuniculi' },
        { id: 'kozi',       icon: '🐐', tech: 'tech_caprile' },
        { id: 'chlev',      icon: '🐖', tech: 'tech_suile' },
        { id: 'staj',       icon: '🐎', tech: 'tech_stabulum' },
        { id: 'studna',     icon: '🚰', tech: null },
    ],

    _renderDvurTabs: function(active) {
        let h = `<div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px;">`;
        this.DVUR_TABS.forEach(tb => {
            const isActive = tb.id === active;
            const researched = !tb.tech || (GameState.researchedTechs && GameState.researchedTechs.includes(tb.tech));
            const lock = researched ? '' : ' 🔒';
            h += `<button class="filter-btn ${isActive ? 'active' : ''}" style="font-size:0.78rem; padding:5px 9px; ${researched ? '' : 'opacity:0.55;'}"
                onclick="GardenSystem.switchDvurTab('${tb.id}')">${tb.icon} ${t('dvur.tab_' + tb.id)}${lock}</button>`;
        });
        h += `</div>`;
        return h;
    },

    _renderDvurDashboard: function() {
        const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;
        const cat = GameState.cat || {};
        const hasCatTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_cura_felium');
        const miceN = (GameState.mice && GameState.mice.count) || 0;

        let h = `<div style="margin-bottom:14px; padding:10px 12px; background:rgba(197,160,89,0.07); border:1px solid rgba(197,160,89,0.25); border-radius:8px; display:flex; flex-direction:column; gap:5px;">`;
        h += `<div style="font-size:0.68rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; opacity:0.55;">${t('dvur.dashTitle')}</div>`;

        const miceTxt = ds ? ds.miceFuzzyShort()
            : (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.miceFuzzy ? ScriptoriumCat.miceFuzzy() : '');
        h += `<div style="font-size:0.8rem;">🐭 ${miceTxt}</div>`;

        // Přesný myší panel — gate: tech_de_animalibus (De Animalibus — Albertus Magnus)
        const hasAnimaliasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_de_animalibus');
        if (hasAnimaliasTech && GameState.mice) {
            const miceCount = GameState.mice.count || 0;
            const scrapsLoss = miceCount > 0 ? Math.floor(miceCount / 5) : 0;
            const decayMult = window.miceDecayMultiplier ? window.miceDecayMultiplier.toFixed(2) : '1.00';
            // Trend: odhadni ze spawn logiky
            const grain = ['grain','oats','millet','barley','rye','wheat'].reduce((s,id)=>s+(GameState.inventory[id]||0),0);
            const spawnEst = Math.floor(grain / 30);
            const mortalityEst = Math.floor(miceCount * 0.15);
            const netEst = spawnEst - mortalityEst;
            const trendArrow = netEst > 0 ? '▲' : netEst < 0 ? '▼' : '→';
            const trendColor = netEst > 0 ? '#c0392b' : netEst < 0 ? '#27ae60' : 'inherit';
            h += `<div style="font-size:0.78rem; margin-top:2px; padding:5px 7px; background:rgba(0,0,0,0.07); border-radius:5px; border-left:3px solid #a0722d;">`;
            h += `<div style="font-weight:bold; font-size:0.7rem; opacity:0.6; text-transform:uppercase; letter-spacing:0.06em;">📜 De Animalibus</div>`;
            h += `<div>${t('dvur.mice_label')}: <strong>${miceCount}</strong> <span style="color:${trendColor};">${trendArrow} ${netEst>0?'+':''}${netEst}${t('dvur.mice_net_per_day')}</span></div>`;
            if (scrapsLoss > 0) h += `<div style="color:#a0722d;">🗑️ ${t('dvur.mice_scraps')}: <strong>${scrapsLoss}</strong></div>`;
            h += `<div style="opacity:0.75;">⚠️ ${t('dvur.mice_decay')}: <strong>×${decayMult}</strong></div>`;
            h += `</div>`;
        }

        if (hasCatTech) {
            const title = (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.getTitle) ? ScriptoriumCat.getTitle() : '';
            const state = (cat.satiety !== undefined && cat.satiety < 30) ? t('dvur.catHunting') : t('dvur.catFed');
            h += `<div style="font-size:0.8rem;">🐈‍⬛ ${cat.name || ''} <span style="opacity:0.6;">(${title})</span> — ${state}</div>`;
        }

        // Krmivo — zásoba ve dnech (jen s Horreem, kdy krmení běží)
        if (GameState.storage && GameState.storage.horreum && GameState.storage.horreum.built) {
            const hasPigsty   = ((GameState.pigsty   && GameState.pigsty.animals)   || []).length > 0;
            const hasRabbitry = ((GameState.rabbitry  && GameState.rabbitry.animals) || []).length > 0;
            const hasGoatpen  = ((GameState.goatpen   && GameState.goatpen.animals)  || []).length > 0;
            const grainEaters = ((GameState.henhouse  && GameState.henhouse.hens)    || []).length > 0 ? 1 : 0;
            // Prasata jedí scraps (fallback grain) — v primáru je nezapočítáváme do grainPens
            const grainPens = grainEaters;
            const hayPens = (((GameState.sheepfold && GameState.sheepfold.sheep) || []).length > 0 ? 1 : 0)
                + (hasRabbitry ? 1 : 0) + (hasGoatpen ? 1 : 0);
            // Scraps: králíci (1/den), kozy (1/den fallback), prasata (2/den primár)
            const scrapsPens = (hasRabbitry ? 1 : 0) + (hasGoatpen ? 1 : 0) + (hasPigsty ? 2 : 0);
            const hayDays    = hayPens    ? Math.floor((GameState.inventory['hay']    || 0) / hayPens)    : null;
            const grainDays  = grainPens  ? Math.floor((GameState.inventory['grain']  || 0) / grainPens)  : null;
            const scrapsDays = scrapsPens ? Math.floor((GameState.inventory['scraps'] || 0) / scrapsPens) : null;
            const parts = [];
            if (hayDays    !== null) parts.push(`${t('dvur.feedHay')}: ${hayDays} ${t('dvur.days')}`);
            if (grainDays  !== null) parts.push(`${t('dvur.feedGrain')}: ${grainDays} ${t('dvur.days')}`);
            if (scrapsDays !== null) parts.push(`${t('dvur.feedScraps')}: ${scrapsDays} ${t('dvur.days')}`);
            if (parts.length) {
                const low = (hayDays !== null && hayDays < 3) || (grainDays !== null && grainDays < 3) || (scrapsDays !== null && scrapsDays < 3);
                h += `<div style="font-size:0.8rem; ${low ? 'color:#c0392b;' : ''}">\u{1F33E} ${t('dvur.feedStock')}: ${parts.join(' \u00B7 ')}</div>`;
            }
        }

        if (ds && ds.isActive() && miceN > 6) {
            h += `<div style="font-size:0.76rem; color:#a0722d;">⚠️ ${t('dvur.decayImpact')}</div>`;
        }

        h += `</div>`;
        return h;
    },

    _renderDvurLocked: function(tab) {
        const def = this.DVUR_TABS.find(tb => tb.id === tab);
        const researched = def && (!def.tech || (GameState.researchedTechs && GameState.researchedTechs.includes(def.tech)));
        if (researched) {
            return `<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic; font-size:0.85rem;">
                ${def ? def.icon : ''} ${t('dvur.comingSoon')}
            </div>`;
        }
        const techNm = def && def.tech && typeof tName === 'function' ? tName(def.tech) : '';
        return `<div style="padding:20px; text-align:center; opacity:0.6; font-size:0.85rem;">
            🔒 <em>${t('dvur.lockedPrefix')} ${techNm}</em>
        </div>`;
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PISCINA (Rybník) — renderPiscina
    // ═══════════════════════════════════════════════════════════════════════════
    renderPiscina: function() {
        const el = document.getElementById('piscina-container');
        if (!el) return;
        const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_piscina');

        if (!hasTech) {
            el.innerHTML = `
                <div style="text-align:center; padding:40px 20px; opacity:0.7;">
                    <div style="font-size:3rem; margin-bottom:16px;">🐟</div>
                    <em>Piscina clausa est.</em>
                    <div style="font-size:0.82rem; opacity:0.75; margin-top:8px;">${t('garden.piscinaLocked')}</div>
                </div>`;
            return;
        }

        const p = GameState.piscina || {};
        const now = Date.now();
        const WEEK  = 7  * 24 * 3600000;
        const WEEKS2 = 14 * 24 * 3600000;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        let html = `<p class="text-sm" style="margin-bottom:12px; opacity:0.75;">${t('garden.piscinaDesc')}</p>`;

        // ── TŘECÍ RYBNÍK (Tier 1) ── 1/7 výšky
        const t1locked = p.tier < 1;
        html += `<div style="
            margin-bottom:10px; border-radius:10px; overflow:hidden;
            border:2px solid ${t1locked ? 'rgba(0,0,0,0.15)' : '#4a7c8a'};
            background:${t1locked ? 'rgba(0,0,0,0.04)' : 'linear-gradient(180deg, #e8f4f8 0%, #b8dce8 100%)'};
            min-height:80px; position:relative;">
            <div style="padding:10px 14px; display:flex; align-items:center; gap:10px; position:relative; z-index:2;">
                <div style="flex:1;">
                    <strong style="font-size:0.9rem;">🫧 ${t('garden.piscinaTier1')}</strong>
                    <div style="font-size:0.75rem; opacity:0.7; font-style:italic;">${t('garden.piscinaTier1Sub')}</div>
                </div>`;

        if (t1locked) {
            const canBuild = (GameState.inventory['rock']||0)>=10 && (GameState.inventory['stick']||0)>=5;
            html += `<button class="craft-btn" onclick="Game.buildPiscina(1)" ${canBuild?'':'disabled'} style="font-size:0.75rem; white-space:normal;">
                🏗️ ${t('garden.piscinaBuild')} (10🪨 5🪵)</button>`;
        } else {
            html += `<div style="font-size:0.82rem;">🫧 ${t('garden.piscinaFry')}: <strong>${p.fry||0}</strong></div>`;
        }
        html += `</div>`;

        // Bublinky animace
        if (!t1locked) {
            for (let i=0; i<6; i++) {
                const left = 10 + Math.random()*80;
                const delay = Math.random()*3;
                const dur = 2 + Math.random()*2;
                html += `<div style="position:absolute; left:${left}%; bottom:5px; font-size:0.8rem;
                    animation:piscinaBubble ${dur}s ${delay}s infinite ease-in; opacity:0.6; z-index:1;">🫧</div>`;
            }

            // Přidat plůdek
            const hasFry = (GameState.inventory['fry']||0) > 0;
            html += `<div style="padding:6px 14px; display:flex; gap:8px; align-items:center; z-index:2; position:relative;">`;
            if (p.fryAddedAt && p.fry > 0) {
                const elapsed = now - p.fryAddedAt;
                const pct = Math.min(100, Math.round(elapsed / WEEK * 100));
                const daysLeft = Math.max(0, Math.ceil((WEEK - elapsed) / 86400000));
                html += `<div style="flex:1; font-size:0.75rem; opacity:0.8;">⏳ ${t('garden.piscinaGrowing')} ${pct}% (${daysLeft}d)</div>`;
            } else {
                html += `<button class="craft-btn" onclick="Game.addFry(1)" ${hasFry&&p.tier>=1?'':'disabled'} style="font-size:0.72rem;">+1 ${t('garden.piscinaAddFry')}</button>`;
                html += `<button class="craft-btn" onclick="Game.addFry(5)" ${hasFry&&(GameState.inventory['fry']||0)>=5&&p.tier>=1?'':'disabled'} style="font-size:0.72rem;">+5</button>`;
            }
            html += `</div>`;
        }
        html += `</div>`;

        // ── VÝTAŽNÍK (Tier 2) ── 2/7 výšky
        const t2locked = p.tier < 2;
        html += `<div style="
            margin-bottom:10px; border-radius:10px; overflow:hidden;
            border:2px solid ${t2locked ? 'rgba(0,0,0,0.15)' : '#2a6a7a'};
            background:${t2locked ? 'rgba(0,0,0,0.04)' : 'linear-gradient(180deg, #c8e8f0 0%, #88c4d8 100%)'};
            min-height:160px; position:relative;">
            <div style="padding:10px 14px; display:flex; align-items:center; gap:10px; position:relative; z-index:2;">
                <div style="flex:1;">
                    <strong style="font-size:0.9rem;">🐟 ${t('garden.piscinaTier2')}</strong>
                    <div style="font-size:0.75rem; opacity:0.7; font-style:italic;">${t('garden.piscinaTier2Sub')}</div>
                </div>`;

        if (t2locked && p.tier >= 1) {
            const canBuild = (GameState.inventory['rock']||0)>=20 && (GameState.inventory['stick']||0)>=10 && (GameState.inventory['rope']||0)>=5;
            html += `<button class="craft-btn" onclick="Game.buildPiscina(2)" ${canBuild?'':'disabled'} style="font-size:0.75rem; white-space:normal;">
                🏗️ ${t('garden.piscinaBuild')} (20🪨 10🪵 5➰)</button>`;
        } else if (t2locked) {
            html += `<div style="font-size:0.75rem; opacity:0.5; font-style:italic;">${t('garden.piscinaUpgradeFirst')}</div>`;
        } else {
            html += `<div style="font-size:0.82rem;">🐟 ${t('garden.piscinaYoung')}: <strong>${p.youngCarp||0}</strong></div>`;
        }
        html += `</div>`;

        // Plovoucí rybičky (tier 2)
        if (!t2locked && (p.youngCarp||0) > 0) {
            const fishCount = Math.min(p.youngCarp, 4);
            const t2icons = ['🐟','🐠','🐟','🐡'];
            for (let i=0; i<fishCount; i++) {
                // každá rybka má unikátní parametry
                const topPct  = 15 + Math.random()*60;          // 15–75% výška
                const dur     = 10 + Math.random()*12;           // 10–22s pomalé
                const delay   = -(Math.random()*10);             // záporný delay = hned na různém místě
                const sz      = 0.9 + Math.random()*0.6;        // různá velikost
                const goLeft   = Math.random() > 0.5;
                const backward = Math.random() < 0.15; // 15% šance pluje pozadu 🐟
                // emoji koukají doleva — při pohybu doprava je otočíme (pokud nepluje pozadu)
                const flipX    = goLeft ? 'scaleX(1)' : (backward ? 'scaleX(1)' : 'scaleX(-1)');
                const swimAnim = goLeft ? 'piscinaSwimL' : 'piscinaSwim';
                const diveDur = 4 + Math.random()*5;
                const diveDelay = Math.random()*6;
                html += `<div style="position:absolute; top:${topPct.toFixed(1)}%; font-size:${sz.toFixed(2)}rem;
                    transform:${flipX};
                    animation:${swimAnim} ${dur.toFixed(1)}s ${delay.toFixed(1)}s infinite linear,
                               piscinaWave ${diveDur.toFixed(1)}s ${diveDelay.toFixed(1)}s infinite ease-in-out;
                    z-index:1;">${t2icons[i%4]}</div>`;
            }
            if (p.youngAddedAt > 0) {
                const elapsed2 = now - p.youngAddedAt;
                const pct2 = Math.min(100, Math.round(elapsed2 / WEEKS2 * 100));
                const daysLeft2 = Math.max(0, Math.ceil((WEEKS2 - elapsed2) / 86400000));
                html += `<div style="padding:6px 14px; font-size:0.75rem; opacity:0.8; position:relative; z-index:2;">
                    ⏳ ${t('garden.piscinaMaturing')} ${pct2}% (${daysLeft2}d)</div>`;
            }
        }
        html += `</div>`;

        // ── KAPROVÝ RYBNÍK (Tier 3) ── 4/7 výšky
        const t3locked = p.tier < 3;
        html += `<div style="
            margin-bottom:10px; border-radius:10px; overflow:hidden;
            border:2px solid ${t3locked ? 'rgba(0,0,0,0.15)' : '#1a4a5a'};
            background:${t3locked ? 'rgba(0,0,0,0.04)' : 'linear-gradient(180deg, #a8d8e8 0%, #4898b8 50%, #1a6888 100%)'};
            min-height:260px; position:relative;">
            <div style="padding:10px 14px; display:flex; align-items:center; gap:10px; position:relative; z-index:2;">
                <div style="flex:1;">
                    <strong style="font-size:0.9rem; color:${t3locked?'inherit':'#fff'};">🐠 ${t('garden.piscinaTier3')}</strong>
                    <div style="font-size:0.75rem; opacity:0.7; font-style:italic; color:${t3locked?'inherit':'#e0f0ff'};">${t('garden.piscinaTier3Sub')}</div>
                </div>`;

        if (t3locked && p.tier >= 2) {
            const canBuild = (GameState.inventory['rock']||0)>=40 && (GameState.inventory['stick']||0)>=20 && (GameState.inventory['rope']||0)>=10;
            html += `<button class="craft-btn" onclick="Game.buildPiscina(3)" ${canBuild?'':'disabled'} style="font-size:0.75rem; white-space:normal;">
                🏗️ ${t('garden.piscinaBuild')} (40🪨 20🪵 10➰)</button>`;
        } else if (t3locked) {
            html += `<div style="font-size:0.75rem; opacity:0.5; font-style:italic;">${t('garden.piscinaUpgradeFirst')}</div>`;
        } else {
            html += `<div style="font-size:0.82rem; color:#fff;">🐠 ${t('garden.piscinaCarp')}: <strong>${p.carp||0}</strong></div>`;
        }
        html += `</div>`;

        // Kapři — plovoucí + potápěcí animace, každý individuální
        if (!t3locked && (p.carp||0) > 0) {
            const carpCount = Math.min(p.carp, 6);
            const icons = ['🐠','🐟','🐡','🐠','🐡','🐟'];
            for (let i=0; i<carpCount; i++) {
                const topPct  = 10 + Math.random()*70;           // 10–80% výška
                const dur     = 12 + Math.random()*15;           // 12–27s velmi pomalé
                const delay   = -(Math.random()*12);             // okamžitý start na různém místě
                const sz      = 1.1 + Math.random()*0.8;        // 1.1–1.9rem
                const goLeft   = Math.random() > 0.5;
                const backward = Math.random() < 0.15; // 15% šance pluje pozadu
                const flipX    = goLeft ? 'scaleX(1)' : (backward ? 'scaleX(1)' : 'scaleX(-1)');
                const swimAnim = goLeft ? 'piscinaSwimL' : 'piscinaSwim';
                const waveDur = 5 + Math.random()*7;
                const waveDelay = Math.random()*8;
                const diveDur = 6 + Math.random()*5;
                const diveDelay = Math.random()*10;
                html += `<div style="position:absolute; top:${topPct.toFixed(1)}%; font-size:${sz.toFixed(2)}rem;
                    transform:${flipX};
                    animation:${swimAnim} ${dur.toFixed(1)}s ${delay.toFixed(1)}s infinite linear,
                               piscinaWave ${waveDur.toFixed(1)}s ${waveDelay.toFixed(1)}s infinite ease-in-out,
                               piscinaDive ${diveDur.toFixed(1)}s ${diveDelay.toFixed(1)}s infinite ease-in-out;
                    z-index:1;">${icons[i%6]}</div>`;
            }
        } else if (!t3locked) {
            html += `<div style="padding:8px 14px; position:absolute; bottom:8px; left:0; right:0; z-index:2; color:#e0f0ff; font-size:0.8rem; font-style:italic; text-align:center;">${t('garden.piscinaWaitingCarp')}</div>`;
        }
        // Tlačítka vždy na spodku rybníku
        if (!t3locked) {
            // Pending plůdky z produkce
            const pendingFry = p.pendingFry || 0;
            const DAY = 24 * 3600000;
            const nextFryIn = p.lastFryProductionAt > 0 ? Math.max(0, Math.ceil((p.lastFryProductionAt + DAY - now) / 3600000)) : 24;
            html += `<div style="position:absolute; bottom:0; left:0; right:0; z-index:3; background:rgba(0,0,0,0.3); backdrop-filter:blur(2px);">`;
            if ((p.carp||0) > 0) {
                html += `<div style="padding:4px 14px 2px; font-size:0.72rem; color:#e0f0ff; opacity:0.85;">
                    🫧 ${lang==='en'?'Fry produced':'Plůdek vyprodukován'}: <strong>${pendingFry}</strong>
                    ${pendingFry > 0
                        ? `<button class="craft-btn" onclick="Game.transferFry()" style="margin-left:8px; font-size:0.68rem; padding:2px 8px; background:#1a5a6a;">
                            → ${lang==='en'?'Move to breeding pond':'Přesunout do třecího'}</button>`
                        : `<span style="opacity:0.6; margin-left:6px;">(${lang==='en'?'next in':'další za'} ${nextFryIn}h)</span>`
                    }
                </div>`;
            }
            html += `<div style="padding:4px 14px 8px; display:flex; gap:8px;">`;
            if ((p.carp||0) > 0) {
                html += `<button class="craft-btn" onclick="Game.harvestCarp(1)" style="font-size:0.75rem; background:#2a5a3a;">🐠 ${lang==='en'?'Harvest 1':'Sklidit 1'}</button>`;
                html += `<button class="craft-btn" onclick="Game.harvestCarp(${p.carp})" style="font-size:0.75rem; background:#2a5a3a;">🐠 ${lang==='en'?'All':'Vše'} (${p.carp})</button>`;
            }
            html += `<button class="craft-btn" onclick="Game.feedPiscina()" style="font-size:0.75rem; background:#4a7c59;">🌿 ${t('farmyard.feed')}</button>`;
            html += `</div></div>`;
        }
        html += `</div>`;

        el.innerHTML = html;

        // CSS animace — vložit pokud chybí
        if (!document.getElementById('piscina-style')) {
            const style = document.createElement('style');
            style.id = 'piscina-style';
            style.textContent = [
                '@keyframes piscinaBubble {',
                '  0%   { transform: translateY(0) scale(1); opacity:0.6; }',
                '  60%  { transform: translateY(-25px) scale(1.1); opacity:0.35; }',
                '  100% { transform: translateY(-45px) scale(0.7); opacity:0; }',
                '}',
                '@keyframes piscinaSwim {',
                '  0%   { left: -8%; }',
                '  100% { left: 108%; }',
                '}',
                '@keyframes piscinaSwimL {',
                '  0%   { left: 108%; }',
                '  100% { left: -8%; }',
                '}',
                '@keyframes piscinaWave {',
                '  0%   { margin-top: 0px; }',
                '  25%  { margin-top: 12px; }',
                '  50%  { margin-top: -8px; }',
                '  75%  { margin-top: 18px; }',
                '  100% { margin-top: 0px; }',
                '}',
                '@keyframes piscinaDive {',
                '  0%   { margin-top: 0px; opacity: 1; }',
                '  40%  { margin-top: 30px; opacity: 0.7; }',
                '  55%  { margin-top: 35px; opacity: 0.5; }',
                '  70%  { margin-top: 20px; opacity: 0.8; }',
                '  100% { margin-top: 0px; opacity: 1; }',
                '}'
            ].join('\n');
            document.head.appendChild(style);
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SAD (Pomarium) — renderOrchard
    // ═══════════════════════════════════════════════════════════════════════════
    renderOrchard: function() {
        const el = document.getElementById('orchard-container');
        if (!el) return;
        const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_tractatus_arboribus');

        if (!hasTech) {
            el.innerHTML = `
                <div style="text-align:center; padding:40px 20px; opacity:0.7;">
                    <div style="font-size:3rem; margin-bottom:16px;">🌳</div>
                    <div style="font-style:italic; font-size:0.95rem; margin-bottom:12px;">
                        <em>Pomarium clausum est.</em>
                    </div>
                    <div style="font-size:0.82rem; opacity:0.75;">
                        ${t('garden.orchardLocked')}
                    </div>
                </div>`;
            return;
        }

        // Inicializace orchard v GameState pokud chybí
        if (!GameState.orchard) {
            GameState.orchard = Array.from({length: 10}, () => ({
                state: 'empty',   // empty | growing | mature | fruiting
                treeType: null,   // seed id (seed_apple atd.)
                plantedAt: 0,
                lastHarvestAt: 0,
            }));
        }

        const TREE_DATA = {
            seed_apple:    { fruit: 'apple',        icon: '🍎', growHours: 48, harvestHours: 24 },
            seed_pear:     { fruit: 'pear',         icon: '🍐', growHours: 48, harvestHours: 24 },
            seed_plum:     { fruit: 'plum',         icon: '🫐', growHours: 36, harvestHours: 20 },
            seed_cherry:   { fruit: 'cherry',       icon: '🍒', growHours: 36, harvestHours: 18 },
            seed_walnut:   { fruit: 'walnut',       icon: '🥜', growHours: 72, harvestHours: 48 },
            seed_mulberry: { fruit: 'mulberry',     icon: '🍇', growHours: 48, harvestHours: 24 },
            seed_quince:   { fruit: 'quince',       icon: '🍋', growHours: 60, harvestHours: 36 },
            seed_sorb:     { fruit: 'sorb',         icon: '🟤', growHours: 72, harvestHours: 48 },
            seed_rowan:    { fruit: 'rowan',        icon: '🔴', growHours: 48, harvestHours: 24 },
            seed_linden:   { fruit: 'linden_fruit', icon: '🌸', growHours: 60, harvestHours: 36 },
        };

        let html = `<p class="text-sm" style="margin-bottom:15px; opacity:0.75;">${t('garden.orchardDesc')}</p>`;
        html += `<div class="garden-grid">`;

        GameState.orchard.forEach((slot, idx) => {
            const now = Date.now();
            let content = '';
            let btn = '';

            if (slot.state === 'empty') {
                // Zjisti dostupná semena v inventáři
                const availableSeeds = Object.keys(TREE_DATA).filter(s => (GameState.inventory[s] || 0) > 0);
                if (availableSeeds.length === 0) {
                    content = `<div class="plot-soil" style="opacity:0.3;">🌱</div><div class="text-sm">${t('garden.orchardEmpty')}</div>`;
                    btn = `<button class="craft-btn" disabled>${t('garden.orchardNoSeeds')}</button>`;
                } else {
                    content = `<div class="plot-soil" style="opacity:0.3;">🟫</div><div class="text-sm">${t('garden.orchardEmpty')}</div>`;
                    const opts = availableSeeds.map(s => `<option value="${s}">${iName(s)} (${GameState.inventory[s]}x)</option>`).join('');
                    btn = `<select id="orchard-seed-${idx}" class="craft-btn" style="margin-bottom:4px; font-size:0.75rem;">${opts}</select>
                           <button class="craft-btn" onclick="Game.plantTree(${idx}, document.getElementById('orchard-seed-${idx}').value)">${t('garden.orchardPlant')}</button>`;
                }
            } else if (slot.state === 'growing') {
                const td = TREE_DATA[slot.treeType];
                const matureAt = slot.plantedAt + (td ? td.growHours * 3600000 : 172800000);
                const pct = Math.min(100, Math.round(((now - slot.plantedAt) / (matureAt - slot.plantedAt)) * 100));
                content = `<div class="plot-soil">🌱</div><div class="text-sm">${slot.treeType ? iName(slot.treeType) : '?'}</div>`;
                btn = `<button class="craft-btn" disabled style="font-size:0.72rem;">${t('garden.orchardGrowing')} ${pct}%</button>`;
            } else if (slot.state === 'mature') {
                const td = TREE_DATA[slot.treeType];
                const fruitAt = slot.lastHarvestAt + (td ? td.harvestHours * 3600000 : 86400000);
                if (now >= fruitAt) {
                    // Plodí!
                    content = `<div class="plot-soil" style="color:#4caf50;">${td ? td.icon : '🌳'}</div><div class="text-sm">${slot.treeType ? iName(slot.treeType) : '?'}</div>`;
                    btn = `<button class="craft-btn" onclick="Game.harvestTree(${idx})">${t('garden.orchardHarvest')}</button>
                           <button class="craft-btn" onclick="Game.fellTree(${idx})" style="background:#8b4a3a; margin-top:4px; font-size:0.72rem;">🪓 ${t('garden.orchardFell')}</button>`;
                } else {
                    const waitH = Math.ceil((fruitAt - now) / 3600000);
                    content = `<div class="plot-soil" style="color:#888;">${td ? td.icon : '🌳'}</div><div class="text-sm">${slot.treeType ? iName(slot.treeType) : '?'}</div>`;
                    btn = `<button class="craft-btn" disabled style="font-size:0.72rem;">${t('garden.orchardWait')} ${waitH}h</button>
                           <button class="craft-btn" onclick="Game.fellTree(${idx})" style="background:#8b4a3a; margin-top:4px; font-size:0.72rem;">🪓 ${t('garden.orchardFell')}</button>`;
                }
            }

            html += `<div class="garden-plot">${content}<div style="margin-top:auto;">${btn}</div></div>`;
        });

        html += `</div>`;
        el.innerHTML = html;
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // APIARIUM (Včelín) — renderApiary
    // ═══════════════════════════════════════════════════════════════════════════
    renderApiary: function() {
        const el = document.getElementById('apiary-container');
        if (!el) return;
        const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_liber_apium');

        if (!hasTech) {
            el.innerHTML = `
                <div style="text-align:center; padding:40px 20px; opacity:0.7;">
                    <div style="font-size:3rem; margin-bottom:16px;">🐝</div>
                    <div style="font-style:italic; font-size:0.95rem; margin-bottom:12px;">
                        <em>Apiarium clausum est.</em>
                    </div>
                    <div style="font-size:0.82rem; opacity:0.75;">
                        ${t('garden.apiaryLocked')}
                    </div>
                </div>`;
            return;
        }

        // Inicializace apiary v GameState pokud chybí
        if (!GameState.apiary) {
            GameState.apiary = Array.from({length: 6}, () => ({
                built: false,
                hasQueen: false,
                queenName: null,
                queenStrength: 0,
                strength: 0,
                varroaRisk: false,
                lastCollectAt: 0,
            }));
        }

        // Migrace starých save — přidej chybějící pole
        GameState.apiary.forEach(h => {
            if (h.queenName     === undefined) h.queenName     = null;
            if (h.queenStrength === undefined) h.queenStrength = 0;
            if (h.strength      === undefined) h.strength      = h.hasQueen ? 3 : 0;
            if (h.varroaRisk    === undefined) h.varroaRisk    = false;
        });

        const season = Game._getApiarySeason ? Game._getApiarySeason() : 'summer';
        const seasonLabel = { spring:'🌸 Jaro', summer:'☀️ Léto', autumn:'🍂 Podzim', winter:'❄️ Zima' };
        const COLLECT_HOURS = { spring: 16, summer: 8, autumn: 20, winter: 999 };
        const hours = COLLECT_HOURS[season] || 12;
        const now = Date.now();

        // Zimní check
        if (Game.checkApiaryWinter) Game.checkApiaryWinter();

        let html = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                <p class="text-sm" style="flex:1; opacity:0.75; margin:0;">${t('garden.apiaryDesc')}</p>
                <span style="font-size:0.8rem; opacity:0.6; font-style:italic;">${seasonLabel[season] || ''}</span>
            </div>`;
        html += `<div class="garden-grid">`;

        GameState.apiary.forEach((hive, idx) => {
            let content = '';
            let btn = '';
            let extra = '';

            if (!hive.built) {
                // ── Prázdný slot ───────────────────────────────────────────
                const canBuild = (GameState.inventory['stick'] || 0) >= 10 && (GameState.inventory['rope'] || 0) >= 5;
                content = `<div class="plot-soil" style="opacity:0.3;">🪵</div>
                           <div class="text-sm">${t('garden.apiaryEmpty')}</div>`;
                btn = `<button class="craft-btn" onclick="Game.buildHive(${idx})"
                        ${canBuild ? '' : 'disabled'} style="font-size:0.75rem;">
                        ${t('garden.apiaryBuild')}</button>`;

            } else if (!hive.hasQueen) {
                // ── Úl bez matky ───────────────────────────────────────────
                const hasQueen = (GameState.inventory['queen_bee'] || 0) > 0;
                content = `<div class="plot-soil" style="opacity:0.5;">🪹</div>
                           <div class="text-sm">${t('garden.apiaryNoQueen')}</div>`;
                btn = `<button class="craft-btn" onclick="Game.addQueen(${idx})"
                        ${hasQueen ? '' : 'disabled'} style="font-size:0.75rem;">
                        ${t('garden.apiaryAddQueen')}</button>`;

            } else {
                // ── Aktivní úl ─────────────────────────────────────────────
                const strength = hive.strength || 3;
                const stars = '⭐'.repeat(Math.min(5, Math.ceil(strength / 2)));
                const queenInfo = hive.queenName
                    ? `<div style="font-size:0.72rem; opacity:0.65; font-style:italic;">
                         👑 ${hive.queenName} ${'★'.repeat(hive.queenStrength || 2)}
                       </div>`
                    : '';

                // Varroa varování
                const varroaWarn = hive.varroaRisk
                    ? `<div style="font-size:0.72rem; color:#c55; margin-top:2px;">⚠️ Varroa!</div>`
                    : '';

                if (season === 'winter') {
                    // ── Zima: jen přikrmení ────────────────────────────────
                    content = `<div class="plot-soil" style="color:#7aa;">❄️</div>
                               <div class="text-sm">${t('garden.apiaryWorking')}</div>`;
                    extra = queenInfo + varroaWarn +
                        `<div style="font-size:0.72rem; margin-top:3px;">${stars}</div>`;
                    const hasHoney = (GameState.inventory['honey'] || 0) >= 1;
                    btn = `<button class="craft-btn" onclick="Game.feedHive(${idx})"
                            ${hasHoney ? '' : 'disabled'} style="font-size:0.72rem;">
                            🍯 Přikrmit (1× med)</button>`;

                } else {
                    const readyAt = hive.lastCollectAt + (hours * 3600000);
                    if (now >= readyAt) {
                        content = `<div class="plot-soil" style="color:#c5a059;">🐝</div>
                                   <div class="text-sm">${t('garden.apiaryReady')}</div>`;
                        btn = `<button class="craft-btn" onclick="Game.collectHive(${idx})">
                                ${t('garden.apiaryCollect')}</button>`;
                    } else {
                        const waitH = Math.ceil((readyAt - now) / 3600000);
                        content = `<div class="plot-soil" style="color:#888;">🐝</div>
                                   <div class="text-sm">${t('garden.apiaryWorking')}</div>`;
                        btn = `<button class="craft-btn" disabled style="font-size:0.72rem;">
                                ${t('garden.apiaryWait')} ${waitH}h</button>`;
                    }
                    extra = queenInfo + varroaWarn +
                        `<div style="font-size:0.72rem; margin-top:3px; opacity:0.7;">${stars}</div>`;

                    // Léčba Varroa
                    if (hive.varroaRisk) {
                        const hasThyme = (GameState.inventory['thyme'] || 0) >= 1;
                        btn += `<button class="craft-btn" onclick="Game.treatVarroa(${idx})"
                                 ${hasThyme ? '' : 'disabled'}
                                 style="font-size:0.7rem; margin-top:4px; background:rgba(60,120,60,0.8);">
                                 🌿 Léčit (1× tymián)</button>`;
                    }
                }
            }

            html += `<div class="garden-plot">
                        ${content}
                        ${extra}
                        <div style="margin-top:auto; display:flex; flex-direction:column; gap:4px;">
                            ${btn}
                        </div>
                     </div>`;
        });

        html += `</div>`;
        el.innerHTML = html;
    },

    _syncGardenLocks: function() {
        const techs = GameState.researchedTechs || [];
        let unlocked = 2;
        if (techs.includes('tech_garden_expand'))        unlocked = Math.max(unlocked, 4);
        if (techs.includes('tech_garden_expand_2'))      unlocked = Math.max(unlocked, 6);
        if (techs.includes('tech_garden_expand_3'))      unlocked = Math.max(unlocked, 8);
        if (techs.includes('tech_horticulture'))         unlocked = Math.max(unlocked, 10);
        if (techs.includes('tech_advanced_farming'))     unlocked = Math.max(unlocked, 14);
        if (techs.includes('tech_hortus_conclusus'))     unlocked = Math.max(unlocked, 16);

        // Migrace: přidat sloty 14–15 pokud chybí
        while (GameState.garden.length < 16) {
            const defaults = [
                { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb',    locked: true },
                { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'special', locked: true },
            ];
            GameState.garden.push(defaults[GameState.garden.length - 14] || { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb', locked: true });
        }

        // Kanonická mapa cropType podle indexu (migrace poškozených save)
        const cropTypeMap = [
            'herb','herb','herb','herb',
            'vegetable','vegetable','vegetable','vegetable',
            'special','special',
            'vegetable','vegetable','vegetable','vegetable',
            'herb','special'
        ];
        GameState.garden.forEach((plot, i) => {
            plot.locked = i >= unlocked;
            if (cropTypeMap[i]) plot.cropType = cropTypeMap[i];
        });
    },

    renderGarden: function() {
        // Obnovit aktivní tab po renderAll
        const activeTab = this._activeTab || 'zahony';
        if (activeTab !== 'zahony') {
            // Přepnout na správný tab bez animace
            const btn = document.getElementById('garden-tab-btn-' + activeTab);
            this.switchGardenTab(activeTab, btn);
            return;
        }
        const el = document.getElementById('garden-container'); el.innerHTML = "";
        this._syncGardenLocks();

        // Calculate growth time with tech bonuses
        let growthSpeed = CONFIG.GROWTH_SPEED;
        if(GameState.researchedTechs.includes('tech_advanced_farming')) {
            growthSpeed *= 2.0; // +100% faster growth (24h → 12h)
        }
        const needed = CONFIG.BASE_GROWTH_TIME / growthSpeed;
        
        const hasCustomPlant = GameState.researchedTechs.includes('tech_hortus_conclusus');
        const lang = (typeof UI !== 'undefined' && UI.lang) ? UI.lang() : 'cs';

        GameState.garden.forEach((plot, idx) => {
            let c = "", b = "", typeLabel = "";
            
            if(plot.locked) {
                c = `<div class="plot-soil" style="opacity:0.2">🔒</div><div class="text-sm">${t('garden.locked')}</div>`;
                b = `<button class="craft-btn" disabled>${t('garden.lockedTech')}</button>`;
            }
            else if (plot.state === 0) { 
                if(plot.cropType === 'herb') typeLabel = t('garden.herb');
                else if(plot.cropType === 'vegetable') typeLabel = t('garden.vegetable');
                else if(plot.cropType === 'special') typeLabel = t('garden.special');
                c = `<div class="plot-soil" style="opacity:0.3">🟫</div><div class="text-sm">${typeLabel}</div>`; 
                b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.fertilize')}</button>`; 
            }
            else if (plot.state === 1) {
                if(plot.cropType === 'herb') typeLabel = t('garden.herb');
                else if(plot.cropType === 'vegetable') typeLabel = t('garden.vegetable');
                else if(plot.cropType === 'special') typeLabel = t('garden.special');
                c = `<div class="plot-soil">🟫</div><div class="text-sm">${typeLabel}</div>`;
                if (hasCustomPlant) {
                    // Custom select — filtrovat podle cropType, jen ty co máme semena
                    const opts = Object.entries(GardenSystem.GARDEN_PLANTS_DB)
                        .filter(([, p]) => p.cropType === plot.cropType && (GameState.inventory[p.seed] || 0) > 0)
                        .map(([key, p]) => `<option value="${key}">${p.icon} ${lang==='en'?p.name_en:p.name} (${GameState.inventory[p.seed]||0}×)</option>`)
                        .join('');
                    if (opts) {
                        b = `<select id="gp-sel-${idx}" style="font-size:0.7rem;margin-bottom:3px;width:100%;border-radius:6px;padding:2px;">${opts}</select>
                             <button class="craft-btn" onclick="GardenSystem.plantGardenPlot(${idx}, document.getElementById('gp-sel-${idx}').value)">${t('garden.plant')}</button>`;
                    } else {
                        b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.sow')}</button>
                             <div style="font-size:0.68rem;opacity:0.6;margin-top:2px;">${t('garden.noSeedsAvail')}</div>`;
                    }
                } else {
                    b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.sow')}</button>`;
                }
            }
            else if (plot.state === 2) {
                const cropIcon = ItemsDB[plot.crop] ? ItemsDB[plot.crop].icon : '🌱';
                const cropName = ItemsDB[plot.crop] ? (lang==='en' ? ItemsDB[plot.crop].name_en : ItemsDB[plot.crop].name) : '';
                if (!plot.water) { 
                    c = `<div class="plot-soil">${cropIcon}</div><div class="text-sm">${cropName||t('garden.dry')}</div>`; 
                    b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.water')}</button>`; 
                }
                else if (Date.now() < plot.plantedAt + needed) { 
                    c = `<div class="plot-soil" style="color:#888">${cropIcon}</div><div class="text-sm">${cropName||t('garden.growing')}</div>`; 
                    b = `<button class="craft-btn" disabled>${t('garden.wait')}</button>`;
                    if (hasCustomPlant) b += ` <button class="craft-btn" style="background:#8b4a3a;margin-top:3px;font-size:0.7rem;" onclick="GardenSystem.uprootGardenPlot(${idx})">🪴 ${t('garden.uproot')}</button>`;
                }
                else { 
                    c = `<div class="plot-soil" style="color:#4caf50">${cropIcon}</div><div class="text-sm">${cropName||t('garden.grown')}</div>`; 
                    b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.harvest')}</button>`;
                    if (hasCustomPlant) b += ` <button class="craft-btn" style="background:#8b4a3a;margin-top:3px;font-size:0.7rem;" onclick="GardenSystem.uprootGardenPlot(${idx})">🪴 ${t('garden.uproot')}</button>`;
                }
            }
            el.innerHTML += `<div class="garden-plot">${c}<div style="margin-top:auto">${b}</div></div>`;
        });
    },
    // ════════════════════════════════════════════════════════════════════════
    // POLE (Ager) — polní hospodářství
    // ════════════════════════════════════════════════════════════════════════

    _syncFieldLocks: function() {
        const techs = GameState.researchedTechs || [];
        let unlocked = 2;
        if (techs.includes('tech_de_re_rustica'))  unlocked = Math.max(unlocked, 4);
        if (techs.includes('tech_crop_rotation'))  unlocked = Math.max(unlocked, 6);
        GameState.fields.forEach((f, i) => { f.locked = i >= unlocked; });
    },

    _initFields: function() {
        if (!GameState.fields) {
            GameState.fields = Array.from({length: 6}, (_, i) => ({
                locked: i >= 2,    // start: 2 sloty, max 6
                state: 'empty',    // empty | ploughed | sown | growing | ready
                crop: null,        // id plodiny
                phase: 0,          // 0-3 (orba/klíčení/růst/zrání)
                phaseStart: 0,     // timestamp začátku fáze
                watered: false,
                strawBonus: false, // má Humno?
            }));
        }
        // Migrace
        GameState.fields.forEach(f => {
            if (f.strawBonus === undefined) f.strawBonus = false;
        });
        this._syncFieldLocks();
    },

    // ── ZÁHONY — databáze plantovatelných rostlin ────────────────────────────
    GARDEN_PLANTS_DB: {
        // cropType: 'herb'
        herb_red:    { cropType:'herb',      item:'herb_red',    seed:'seeds_herb',      icon:'🌺', name:'Krvavý květ',    name_en:'Bloodwort',     yield:2 },
        chamomile:   { cropType:'herb',      item:'chamomile',   seed:'seeds_yellow',    icon:'🌼', name:'Heřmánek',       name_en:'Chamomile',     yield:2 },
        herb_blue:   { cropType:'herb',      item:'herb_blue',   seed:'seeds_blue',      icon:'💜', name:'Levandule',      name_en:'Lavender',      yield:2 },
        mint:        { cropType:'herb',      item:'mint',        seed:'seeds_mint',      icon:'🌿', name:'Máta',           name_en:'Mint',          yield:2 },
        thyme:       { cropType:'herb',      item:'thyme',       seed:'seeds_thyme',     icon:'🌿', name:'Tymián',         name_en:'Thyme',         yield:2 },
        st_johns_wort:{ cropType:'herb',     item:'st_johns_wort',seed:'seeds_herb',     icon:'🌻', name:'Třezalka',       name_en:"St. John's Wort",yield:2 },
        sage:        { cropType:'herb',      item:'sage',        seed:'seeds_sage',      icon:'🌿', name:'Šalvěj',         name_en:'Sage',          yield:2 },
        fennel:      { cropType:'herb',      item:'fennel',      seed:'seeds_fennel',    icon:'🌿', name:'Fenykl',         name_en:'Fennel',        yield:2 },
        wormwood:    { cropType:'herb',      item:'wormwood',    seed:'seeds_wormwood',  icon:'🌿', name:'Pelyněk',        name_en:'Wormwood',      yield:2 },
        hyssop:      { cropType:'herb',      item:'hyssop',      seed:'seeds_hyssop',    icon:'🌿', name:'Yzop',           name_en:'Hyssop',        yield:2 },
        yarrow:      { cropType:'herb',      item:'yarrow',      seed:'seeds_yarrow',    icon:'🌿', name:'Řebříček',       name_en:'Yarrow',        yield:2 },
        // cropType: 'vegetable'
        carrot:      { cropType:'vegetable', item:'carrot',      seed:'seeds_vegetable', icon:'🥕', name:'Mrkev',          name_en:'Carrot',        yield:3 },
        onion:       { cropType:'vegetable', item:'onion',       seed:'seeds_vegetable', icon:'🧅', name:'Cibule',         name_en:'Onion',         yield:3 },
        leek:        { cropType:'vegetable', item:'leek',        seed:'seeds_leek',      icon:'🌿', name:'Pór',            name_en:'Leek',          yield:3 },
        cabbage:     { cropType:'vegetable', item:'cabbage',     seed:'seeds_cabbage',   icon:'🥬', name:'Zelí',           name_en:'Cabbage',       yield:3 },
        radish:      { cropType:'vegetable', item:'radish',      seed:'seeds_radish',    icon:'🌱', name:'Ředkev',         name_en:'Radish',        yield:3 },
        turnip:      { cropType:'vegetable', item:'turnip',      seed:'seeds_turnip',    icon:'🟣', name:'Řepa',           name_en:'Turnip',        yield:3 },
        garlic:      { cropType:'vegetable', item:'garlic',      seed:'seeds_garlic',    icon:'🧄', name:'Česnek',         name_en:'Garlic',        yield:3 },
        // cropType: 'special'
        mandrake:    { cropType:'special',   item:'mandrake',    seed:'seeds_mandrake',  icon:'🌿', name:'Mandragora',     name_en:'Mandrake',      yield:1 },
        belladonna:  { cropType:'special',   item:'belladonna',  seed:'seeds_belladonna',icon:'🫐', name:'Rulík zlomocný', name_en:'Belladonna',    yield:1 },
        poppy:       { cropType:'special',   item:'poppy',       seed:'seeds_poppy',     icon:'🌸', name:'Mák',            name_en:'Poppy',         yield:2 },
        nettle:      { cropType:'special',   item:'nettle',      seed:'seeds_nettle',    icon:'🌿', name:'Kopřiva',        name_en:'Nettle',        yield:3 },
        cannabis:    { cropType:'special',   item:'cannabis',    seed:'seeds_cannabis',  icon:'🌿', name:'Konopí seté',    name_en:'Hemp',          yield:3 },
    },

    // Zasadit konkrétní plodinu (tech_hortus_conclusus)
    plantGardenPlot: function(idx, plantKey) {
        const plot = GameState.garden[idx];
        if (!plot || plot.locked) return;
        if (plot.state !== 1) { UI.notify('⚠️ Nejdříve zúrodni záhon.', true); return; }
        const plant = this.GARDEN_PLANTS_DB[plantKey];
        if (!plant) return;
        if (plant.cropType !== plot.cropType) {
            UI.notify('⚠️ Tento záhon je pro ' + (plot.cropType === 'herb' ? 'byliny' : plot.cropType === 'vegetable' ? 'zeleninu' : 'speciály') + '.', true);
            return;
        }
        if (!(GameState.inventory[plant.seed] > 0)) {
            const seedName = typeof ItemsDB !== 'undefined' && ItemsDB[plant.seed] ? ItemsDB[plant.seed].name : plant.seed;
            UI.notify('⚠️ Chybí: ' + seedName, true);
            return;
        }
        Game.removeItem(plant.seed, 1);
        plot.state = 2;
        plot.crop = plant.item;
        plot.plantedAt = Date.now();
        plot.water = false;
        Game.save();
        GardenSystem.renderGarden();
        UI.notify('🌱 ' + plant.name + ' zasazen/a.');
    },

    // Vykořenit plodinu (vrátí 1 semínko)
    uprootGardenPlot: function(idx) {
        const plot = GameState.garden[idx];
        if (!plot || plot.locked) return;
        if (plot.state === 0) { UI.notify('⚠️ Záhon je prázdný.', true); return; }
        const plant = plot.crop ? Object.values(this.GARDEN_PLANTS_DB).find(p => p.item === plot.crop) : null;
        if (plant) Game.addItem(plant.seed, 1);
        plot.state = 0;
        plot.crop = null;
        plot.water = false;
        plot.plantedAt = 0;
        Game.save();
        GardenSystem.renderGarden();
        UI.notify('🪴 Záhon vykořeněn.');
    },

    // Délka jedné fáze v ms (3 reálné dny)
    FIELD_PHASE_MS: 3 * 24 * 60 * 60 * 1000,

    // Plodiny DB
    CROPS_DB: {
        rye:    { id:'rye_grain',   icon:'🌾', name:'Žito',    name_en:'Rye',     seeds:'seeds_rye',    yield:3, strawYield:2, feedVal:1 },
        wheat:  { id:'wheat_grain', icon:'🌾', name:'Pšenice', name_en:'Wheat',   seeds:'seeds_wheat',  yield:3, strawYield:1, feedVal:0 },
        barley: { id:'barley',      icon:'🌾', name:'Ječmen',  name_en:'Barley',  seeds:'seeds_barley', yield:3, strawYield:2, feedVal:0 },
        oats:   { id:'oats',        icon:'🌾', name:'Oves',    name_en:'Oats',    seeds:'seeds_oats',   yield:3, strawYield:2, feedVal:2 },
        millet: { id:'millet',      icon:'🌾', name:'Proso',   name_en:'Millet',  seeds:'seeds_millet', yield:4, strawYield:1, feedVal:2 },
        peas:   { id:'peas',        icon:'🫛', name:'Hrách',   name_en:'Peas',    seeds:'seeds_peas',   yield:4, strawYield:0, feedVal:1 },
        flax:   { id:'flax_fiber',  icon:'🧵', name:'Len',     name_en:'Flax',    seeds:'seeds_flax',   yield:2, strawYield:1, feedVal:0 },
    },

    // ── VINOHRAD (Vinea) — databáze odrůd ────────────────────────────────────
    VINEA_DB: {
        belina:      { id:'belina',      name:'Bělina',      name_en:'Heunisch',    icon:'🍇',
                       ripeDays:90,  windowDays:30, viticis:'viticis_belina',
                       outputs:['mustum','pryk'],    outputPrimary:'mustum' },
        klevner:     { id:'klevner',     name:'Klevner',     name_en:'Klevner',     icon:'🍇',
                       ripeDays:120, windowDays:21, viticis:'viticis_klevner',
                       outputs:['vinum'],            outputPrimary:'vinum' },
        frankovka:   { id:'frankovka',   name:'Frankovka',   name_en:'Frankovka',   icon:'🍇',
                       ripeDays:120, windowDays:21, viticis:'viticis_frankovka',
                       outputs:['vinum_rubrum'],     outputPrimary:'vinum_rubrum' },
        tramin:      { id:'tramin',      name:'Tramín',      name_en:'Traminer',    icon:'🍇',
                       ripeDays:150, windowDays:14, viticis:'viticis_tramin',
                       outputs:['vinum_praeclarum'], outputPrimary:'vinum_praeclarum' },
        modry_janek: { id:'modry_janek', name:'Modrý Janek', name_en:'Modrý Janek', icon:'🍇',
                       ripeDays:105, windowDays:18, viticis:'viticis_modry_janek',
                       outputs:['vinum_obscurum'],   outputPrimary:'vinum_obscurum' },
        baco:        { id:'baco',        name:'Baco Noir (Bago)', name_en:'Baco Noir', icon:'🍇',
                       ripeDays:75,  windowDays:25, viticis:'viticis_baco',
                       outputs:['vinum_baci'],       outputPrimary:'vinum_baci' },
    },

    // ── VINOHRAD (Vinea) — inicializace GameState ─────────────────────────────
    _initVinea: function() {
        if (!GameState.vinea) {
            GameState.vinea = Array.from({length: 6}, () => ({
                state: 'empty',           // empty | planted | growing | ripe | overripe | dormant
                variety: null,            // key do VINEA_DB
                plantedAt: 0,             // timestamp výsadby
                ripeAt: 0,                // timestamp dozrání (plantedAt + ripeDays*ms)
                windowEnd: 0,             // timestamp konce sklizňového okna
                pruned: false,            // byl proveden jarní řez? (+výnos bonus)
                cuttingsAvailable: 0,     // počet dostupných řízků po jarním řezu
            }));
        }
        // Migrace — přidat nová pole pokud chybí
        GameState.vinea.forEach(slot => {
            if (slot.cuttingsAvailable === undefined) slot.cuttingsAvailable = 0;
            if (slot.pruned === undefined) slot.pruned = false;
        });
    },

    // ── VINOHRAD — herní logika ───────────────────────────────────────────────

    plantVine: function(idx, varietyId) {
        this._initVinea();
        const slot = GameState.vinea[idx];
        const variety = this.VINEA_DB[varietyId];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!slot || !variety) return;
        // Blokace — Vinea musí být postavena
        if (!(GameState.storage && GameState.storage.vinea && GameState.storage.vinea.built)) {
            UI.notify(lang==='en' ? 'Build Vineyard (Vinea) first — Cellarium → Buildings.' : 'Nejprve postav Vinohrad (Vinea) — Cellarium → Budovy.', true); return;
        }
        if (slot.state !== 'empty') {
            UI.notify(lang==='en' ? 'Slot is occupied.' : 'Záhon je obsazený.', true); return;
        }
        if ((GameState.inventory[variety.viticis] || 0) < 1) {
            UI.notify(lang==='en' ? 'No cutting available.' : 'Nemáš řízek.', true); return;
        }
        Game.removeItem(variety.viticis, 1);
        const now = Date.now();
        const DAY_MS = 86400000;
        slot.state     = 'planted';
        slot.variety   = varietyId;
        slot.plantedAt = now;
        slot.ripeAt    = now + (variety.ripeDays * DAY_MS);
        slot.windowEnd = now + ((variety.ripeDays + variety.windowDays) * DAY_MS);
        slot.pruned    = false;
        slot.cuttingsAvailable = 0;
        Game.save();
        this.renderVinohrad();
        UI.notify('🌿 ' + (lang==='en' ? variety.name_en : variety.name) + (lang==='en' ? ' planted.' : ' zasazena.'));
    },

    pruneVine: function(idx) {
        this._initVinea();
        const slot = GameState.vinea[idx];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!slot || slot.state === 'empty') return;
        if (slot.pruned) { UI.notify(lang==='en' ? 'Already pruned this season.' : 'Již prořezáno.', true); return; }
        const month = new Date().getMonth() + 1;
        if (month < 3 || month > 4) {
            UI.notify(lang==='en' ? '✂️ Pruning is done in spring (March–April).' : '✂️ Prořez se dělá na jaře (březen–duben).', true); return;
        }
        const variety = slot.variety ? this.VINEA_DB[slot.variety] : null;
        slot.pruned = true;
        if (variety) {
            const cuttings = Math.random() < 0.5 ? 2 : 1;
            slot.cuttingsAvailable = cuttings;
            Game.addItem(variety.viticis, cuttings);
            UI.notify('✂️ ' + (lang==='en' ? 'Pruned. +' + cuttings + ' cutting(s).' : 'Prořezáno. +' + cuttings + ' řízek/řízky.'));
        }
        Game.save();
        this.renderVinohrad();
    },

    uprootVine: function(idx) {
        this._initVinea();
        const slot = GameState.vinea[idx];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!slot || slot.state === 'empty') return;
        slot.state     = 'empty';
        slot.variety   = null;
        slot.plantedAt = 0;
        slot.ripeAt    = 0;
        slot.windowEnd = 0;
        slot.pruned    = false;
        slot.cuttingsAvailable = 0;
        Game.save();
        this.renderVinohrad();
        UI.notify('🪴 ' + (lang==='en' ? 'Vine uprooted.' : 'Réva vykořeněna.'));
    },

    harvestVine: function(idx) {
        this._initVinea();
        const slot = GameState.vinea[idx];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!slot || slot.state !== 'ripe') { UI.notify(lang==='en'?'Not ready.':'Není zralá.', true); return; }
        const variety = this.VINEA_DB[slot.variety];
        if (!variety) return;

        // Výnos: base 2, +1 za prořez
        let qty = 2;
        if (slot.pruned) qty += 1;

        // Počasí: sucho → pryk (jen Bělina), jinak primary output
        let outputId = variety.outputPrimary;
        if (variety.id === 'belina') {
            let droughtDays = 0;
            try {
                if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countDryDays) {
                    droughtDays = WeatherSystem.countDryDays(6).dry;  // 7denní okno: dnes + 6 dní zpět
                }
            } catch(e) {}
            // Hráč mohl přepsat výběrem v UI
            if (slot.harvestChoice) {
                outputId = slot.harvestChoice;
            } else {
                outputId = droughtDays >= 5 ? 'pryk' : 'mustum';
            }
        }

        Game.addItem(outputId, qty);
        const itemName = (typeof iName === 'function') ? iName(outputId) : outputId;
        UI.notify('🍇 ' + (lang==='en'?'Harvested: ':'Sklizeno: ') + itemName + ' ×' + qty);
        Game.addKronikaEntry('important',
            '🍇 Vinohrad: sklizeno ' + (typeof iName==='function'?iName(outputId):outputId) + ' ×' + qty + '.',
            '🍇 Vineyard: harvested ' + outputId + ' ×' + qty + '.',
            '🍇 Vinea: collectum ' + outputId + ' ×' + qty + '.'
        );

        // Slot → dormant (réva přežije zimu)
        slot.state         = 'dormant';
        slot.harvestChoice = null;
        Game.save();
        this.renderVinohrad();
    },

    checkVineaGrowth: function() {
        if (!GameState.vinea) return;
        const now = Date.now();
        const month = new Date().getMonth() + 1;
        let changed = false;

        GameState.vinea.forEach(slot => {
            if (slot.state === 'empty') return;

            // Dormant → planted: jaro (březen), réva se probouzí
            if (slot.state === 'dormant' && month >= 3 && month <= 4) {
                const variety = slot.variety ? this.VINEA_DB[slot.variety] : null;
                if (variety) {
                    slot.state     = 'planted';
                    slot.plantedAt = now;
                    slot.ripeAt    = now + (variety.ripeDays * 86400000);
                    slot.windowEnd = now + ((variety.ripeDays + variety.windowDays) * 86400000);
                    slot.pruned    = false;
                    changed = true;
                }
                return;
            }

            // Planted → growing (po 7 dnech — viditelný růst)
            if (slot.state === 'planted' && now >= slot.plantedAt + (7 * 86400000)) {
                slot.state = 'growing';
                changed = true;
            }

            // Growing → ripe
            if (slot.state === 'growing' && now >= slot.ripeAt) {
                slot.state = 'ripe';
                changed = true;
            }

            // Ripe → overripe: okno prošlo
            if (slot.state === 'ripe' && now >= slot.windowEnd) {
                slot.state = 'overripe';
                changed = true;
            }

            // Overripe → dormant: zima (listopad+)
            if (slot.state === 'overripe' && month >= 11) {
                slot.state = 'dormant';
                changed = true;
            }
        });

        if (changed) Game.save();
    },

    renderFieldTab: function() {
        const el = document.getElementById('field-container');
        if (!el) return;
        this._initFields();

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const techs = GameState.researchedTechs || [];
        const hasField = techs.includes('tech_de_re_rustica');

        if (!hasField) {
            el.innerHTML = `
            <div style="padding:20px 16px;">
                <div style="background:rgba(197,160,89,0.08); border:1px solid rgba(197,160,89,0.3); border-radius:10px; padding:20px; margin-bottom:16px;">
                    <div style="font-size:2rem; margin-bottom:10px;">🌾</div>
                    <h3 style="margin:0 0 8px 0; font-size:1rem;">${lang==='en'?'Fields (Ager)':'Pole (Ager)'}</h3>
                    <p style="font-size:0.85rem; opacity:0.75; margin:0 0 12px 0; font-style:italic;">
                        ${lang==='en'
                            ? 'Monastic fields — plough, sow, water and harvest. Winter rye, spring wheat, barley for the brewery, oats for the horses.'
                            : 'Klášterní pole — orat, osít, zalít a sklidit. Ozimé žito, jarní pšenice, ječmen pro pivovar, oves pro koně.'}
                    </p>
                    <div style="font-size:0.8rem; padding:8px 12px; background:rgba(197,160,89,0.1); border-radius:6px; border-left:3px solid var(--accent-gold);">
                        🔒 ${lang==='en'
                            ? '<strong>Requires:</strong> Research <em>De Re Rustica</em> (Scriptorium → Tech), then build <em>Sulci</em> (Cellarium → Workshops)'
                            : '<strong>Nutné:</strong> Prostuduj <em>De Re Rustica</em> (Scriptorium → Výzkum), pak postav <em>Brázdy (Sulci)</em> (Cellarium → Dílny)'}
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.82rem;">
                    <div style="padding:12px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid rgba(197,160,89,0.4);">
                        <div style="font-size:1.2rem; margin-bottom:4px;">🌾</div>
                        <strong>${lang==='en'?'7 crops':'7 plodin'}</strong>
                        <div style="opacity:0.7; margin-top:3px;">${lang==='en'?'Rye, wheat, barley, oats, millet, peas, flax':'Žito, pšenice, ječmen, oves, proso, hrách, len'}</div>
                    </div>
                    <div style="padding:12px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid rgba(197,160,89,0.4);">
                        <div style="font-size:1.2rem; margin-bottom:4px;">🍺</div>
                        <strong>${lang==='en'?'Brewery link':'Link na Pivovar'}</strong>
                        <div style="opacity:0.7; margin-top:3px;">${lang==='en'?'Barley+hops → ale':'Ječmen+chmel → pivo'}</div>
                    </div>
                    <div style="padding:12px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid rgba(197,160,89,0.4);">
                        <div style="font-size:1.2rem; margin-bottom:4px;">🐎</div>
                        <strong>${lang==='en'?'Feed animals':'Krmivo'}</strong>
                        <div style="opacity:0.7; margin-top:3px;">${lang==='en'?'Oats for horses, grain for poultry':'Oves pro koně, zrní pro drůbež'}</div>
                    </div>
                    <div style="padding:12px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid rgba(197,160,89,0.4);">
                        <div style="font-size:1.2rem; margin-bottom:4px;">🌿</div>
                        <strong>${lang==='en'?'Three-field system':'Trojpolní'}</strong>
                        <div style="opacity:0.7; margin-top:3px;">${lang==='en'?'Tech: +25% yield':'Tech: +25% výnos'}</div>
                    </div>
                </div>
            </div>`;
            return;
        }

        const hasSulci  = GameState.storage && GameState.storage.sulci  && GameState.storage.sulci.built;
        const hasHumno  = GameState.storage && GameState.storage.humno   && GameState.storage.humno.built;
        const hasRotation = techs.includes('tech_crop_rotation');
        const hasIrrigation = techs.includes('tech_field_irrigation');

        // Sucho check
        let droughtPenalty = false;
        let droughtDays = 0;
        try {
            if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countDryDays) {
                droughtDays = WeatherSystem.countDryDays(3).dry;  // okno: dnes + 3 dny zpět = 4 dny
                droughtPenalty = droughtDays >= 3;                // citlivější: >=3 ze 4 suché
            }
        } catch(e) {}

        // Kapacita vody
        const water = GameState.inventory['water'] || 0;
        const waterCost = hasIrrigation ? 1 : 2;

        const now = Date.now();
        const phaseMs = this.FIELD_PHASE_MS;
        const phaseNames = lang === 'en'
            ? ['Ploughed','Sown','Growing','Ready']
            : ['Zorána','Oseta','Roste','Zralá'];
        const phaseIcons = ['🟫','🌱','🌿','🌾'];

        let html = '';

        // Sucho indikátor
        if (droughtDays > 0) {
            const color = droughtPenalty ? '#c0392b' : '#e67e22';
            const msg = droughtPenalty
                ? (lang==='en' ? `⚠️ Drought! ${droughtDays} dry days — yield -20%` : `⚠️ Sucho! ${droughtDays} suchých dní — výnos -20%`)
                : (lang==='en' ? `☀️ ${droughtDays} dry days` : `☀️ ${droughtDays} suchých dní`);
            html += `<div style="margin-bottom:12px; padding:8px 12px; background:rgba(197,160,89,0.1); border-radius:6px; border-left:3px solid ${color}; font-size:0.82rem; color:${color};">${msg}</div>`;
        }

        // Trojpolní info
        if (hasRotation) {
            html += `<div style="margin-bottom:10px; padding:6px 12px; background:rgba(90,154,90,0.1); border-radius:6px; font-size:0.78rem; color:#5a9a5a;">✅ ${lang==='en' ? 'Three-field system: +25% yield' : 'Trojpolní systém: +25% výnos'}</div>`;
        }

        // Sloty
        html += '<div class="garden-grid" style="margin-bottom:16px;">';
        GameState.fields.forEach((field, idx) => {
            if (field.locked) {
                html += `<div class="garden-plot"><div class="plot-soil" style="opacity:0.2">🔒</div><div class="text-sm">${lang==='en'?'Locked':'Zamčeno'}</div></div>`;
                return;
            }

            // Fallow slot (trojpolní)
            if (hasRotation && idx === 0 && GameState.fields.filter(f=>!f.locked && f.state!=='empty').length >= 2) {
                html += `<div class="garden-plot"><div class="plot-soil" style="opacity:0.5">🟤</div><div class="text-sm">${lang==='en'?'Fallow':'Úhor'}</div><div style="margin-top:auto"><button class="craft-btn" disabled>${lang==='en'?'Resting':'Odpočívá'}</button></div></div>`;
                return;
            }

            let content = '';
            let btn = '';

            if (field.state === 'empty') {
                content = `<div class="plot-soil" style="opacity:0.3">🟫</div><div class="text-sm">${lang==='en'?'Empty':'Prázdné'}</div>`;
                const canPlough = hasSulci;
                btn = `<button class="craft-btn" onclick="GardenSystem.ploughField(${idx})" ${canPlough?'':'disabled'}>🪠 ${lang==='en'?'Plough':'Orat'}</button>`;
                if (!hasSulci) btn += `<div style="font-size:0.7rem;opacity:0.5;margin-top:3px;">${lang==='en'?'Needs: Sulci':'Nutné: Brázdy'}</div>`;
            }
            else if (field.state === 'ploughed') {
                content = `<div class="plot-soil">🟫</div><div class="text-sm">${lang==='en'?'Ploughed':'Zorána'}</div>`;
                // Výběr plodiny
                const cropOpts = Object.entries(this.CROPS_DB).map(([key, c]) =>
                    `<option value="${key}">${lang==='en'?c.name_en:c.name}</option>`
                ).join('');
                btn = `<select id="field-crop-sel-${idx}" style="font-size:0.75rem;padding:2px;width:100%;margin-bottom:4px;">${cropOpts}</select>
                       <button class="craft-btn" onclick="GardenSystem.sowField(${idx}, document.getElementById('field-crop-sel-${idx}').value)">🌱 ${lang==='en'?'Sow':'Osít'}</button>`;
            }
            else if (field.state === 'growing') {
                const crop = this.CROPS_DB[field.crop];
                const cropIcon = crop ? crop.icon : '🌱';
                const phaseIdx = Math.min(field.phase, 3);
                const phaseEnd = field.phaseStart + phaseMs;
                const remaining = Math.max(0, phaseEnd - now);
                const hoursLeft = Math.ceil(remaining / (1000*60*60));
                const progressPct = Math.min(100, Math.round((1 - remaining/phaseMs)*100));

                content = `<div class="plot-soil" style="color:${phaseIdx>=2?'#4caf50':'#888'}">${cropIcon}</div>
                           <div class="text-sm">${phaseNames[phaseIdx]}</div>
                           <div style="height:3px;background:rgba(0,0,0,0.1);border-radius:2px;margin:3px 0;">
                             <div style="height:100%;width:${progressPct}%;background:var(--accent-gold);border-radius:2px;"></div>
                           </div>
                           <div style="font-size:0.68rem;opacity:0.6;">${hoursLeft}h</div>`;

                if (!field.watered && phaseIdx < 3) {
                    btn = `<button class="craft-btn" onclick="GardenSystem.waterField(${idx})" ${water>=waterCost?'':'disabled'}>💧 ${lang==='en'?'Water':'Zalít'} (${waterCost}💧)</button>`;
                } else if (phaseIdx >= 3) {
                    btn = `<button class="craft-btn" onclick="GardenSystem.harvestField(${idx})">🌾 ${lang==='en'?'Harvest':'Sklidit'}</button>`;
                } else {
                    btn = `<button class="craft-btn" disabled>⏳ ${lang==='en'?'Growing':'Roste'}</button>`;
                }
            }

            html += `<div class="garden-plot">${content}<div style="margin-top:auto">${btn}</div></div>`;
        });
        html += '</div>';

        // Info panel
        html += `<div style="font-size:0.78rem; opacity:0.65; padding:8px 12px; background:rgba(0,0,0,0.04); border-radius:6px; border-left:3px solid rgba(197,160,89,0.3);">
            💧 ${lang==='en'?'Water per irrigation':'Voda na závlahu'}: ${waterCost} | 
            🌾 ${lang==='en'?'Phase duration':'Délka fáze'}: 3 ${lang==='en'?'days':'dny'} | 
            ${hasHumno ? '✅ Humno: +sláma' : `🏗️ ${lang==='en'?'Build Humno for +straw':'Postav Humno pro +slámu'}`}
        </div>`;

        el.innerHTML = html;
    },

    ploughField: function(idx) {
        this._initFields();
        const field = GameState.fields[idx];
        if (!field || field.locked) return;
        field.state = 'ploughed';
        Game.save();
        this.renderFieldTab();
    },

    sowField: function(idx, cropKey) {
        this._initFields();
        const field = GameState.fields[idx];
        const crop = this.CROPS_DB[cropKey];
        if (!field || field.locked || field.state !== 'ploughed' || !crop) return;
        // Zkontrolovat semena (TODO: přidat seeds items)
        field.state   = 'growing';
        field.crop    = cropKey;
        field.phase   = 0;
        field.phaseStart = Date.now();
        field.watered = false;
        Game.save();
        this.renderFieldTab();
    },

    waterField: function(idx) {
        this._initFields();
        const field = GameState.fields[idx];
        if (!field || field.state !== 'growing') return;
        const techs = GameState.researchedTechs || [];
        const waterCost = techs.includes('tech_field_irrigation') ? 1 : 2;
        if ((GameState.inventory['water'] || 0) < waterCost) {
            if (typeof UI !== 'undefined') UI.notify('Nedostatek vody!', true);
            return;
        }
        Game.removeItem('water', waterCost);
        field.watered = true;
        Game.save();
        this.renderFieldTab();
    },

    harvestField: function(idx) {
        this._initFields();
        const field = GameState.fields[idx];
        const crop = this.CROPS_DB[field.crop];
        if (!field || field.state !== 'growing' || field.phase < 3 || !crop) return;

        const techs = GameState.researchedTechs || [];
        const hasRotation = techs.includes('tech_crop_rotation');
        const hasHumno   = GameState.storage && GameState.storage.humno && GameState.storage.humno.built;

        // Výpočet výnosu
        let yieldAmt = crop.yield;
        if (hasRotation) yieldAmt = Math.round(yieldAmt * 1.25);

        // Sucho penalizace
        try {
            if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countDryDays) {
                const dryDays = WeatherSystem.countDryDays(3).dry;  // okno: dnes + 3 dny zpět = 4 dny
                if (dryDays >= 3) yieldAmt = Math.max(1, Math.round(yieldAmt * 0.8));  // shoda s indikátorem
            }
        } catch(e) {}

        Game.addItem(crop.id, yieldAmt);

        // Sláma
        const strawAmt = hasHumno ? crop.strawYield * 2 : Math.min(1, crop.strawYield);
        if (strawAmt > 0) Game.addItem('straw', strawAmt);

        // Reset pole
        field.state   = 'empty';
        field.crop    = null;
        field.phase   = 0;
        field.phaseStart = 0;
        field.watered = false;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cropName = lang === 'en' ? crop.name_en : crop.name;
        if (typeof UI !== 'undefined') UI.notify(`🌾 ${lang==='en'?'Harvested':'Sklizeno'}: ${cropName} ×${yieldAmt}`);
        Game.addKronikaEntry('important', `🌾 Sklizeno: ${cropName} ×${yieldAmt}`, `🌾 Harvested: ${cropName} ×${yieldAmt}`, `🌾 Messis: ${cropName} ×${yieldAmt}`);
        Game.save();
        this.renderFieldTab();
    },

    // Automatická aktualizace fází pole (voláno z game tick)
    checkFieldGrowth: function() {
        if (!GameState.fields) return;
        const now = Date.now();
        const phaseMs = this.FIELD_PHASE_MS;
        let changed = false;
        GameState.fields.forEach(field => {
            if (field.state !== 'growing' || field.phase >= 3) return;
            const phaseEnd = field.phaseStart + phaseMs;
            if (now >= phaseEnd) {
                field.phase++;
                field.phaseStart = now;
                field.watered = false; // nová fáze = nová závlaha
                changed = true;
            }
        });
        if (changed) Game.save();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // VINOHRAD (Vinea) — render
    // ═══════════════════════════════════════════════════════════════════════════
    renderVinohrad: function() {
        const el = document.getElementById('vinohrad-container');
        if (!el) return;
        this._initVinea();

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const techs = GameState.researchedTechs || [];
        const hasTech = techs.includes('tech_vinohrad');
        const hasVinea = GameState.storage && GameState.storage.vinea && GameState.storage.vinea.built;

        if (!hasTech) {
            el.innerHTML = `
            <div style="padding:20px 16px;">
                <div style="background:rgba(197,160,89,0.08); border:1px solid rgba(197,160,89,0.3); border-radius:10px; padding:20px; margin-bottom:16px;">
                    <div style="font-size:2rem; margin-bottom:10px;">🍇</div>
                    <h3 style="margin:0 0 8px 0; font-size:1rem;">${lang==='en'?'Vineyard (Vinea)':'Vinohrad (Vinea)'}</h3>
                    <p style="font-size:0.85rem; opacity:0.75; margin:0 0 12px 0; font-style:italic;">
                        ${lang==='en'
                            ? 'Six vine varieties — Heunisch, Klevner, Frankovka, Traminer, Modrý Janek, Baco Noir. Each with its own ripening window and wine.'
                            : 'Šest odrůd révy — Bělina, Klevner, Frankovka, Tramín, Modrý Janek, Baco Noir. Každá se svým oknem sklizně a vínem.'}
                    </p>
                    <div style="font-size:0.8rem; padding:8px 12px; background:rgba(197,160,89,0.1); border-radius:6px; border-left:3px solid var(--accent-gold);">
                        🔒 ${lang==='en'
                            ? '<strong>Requires:</strong> Study <em>Liber de Cultura Vitis</em> (Library → Master Bartholomew) or unlock with 120 ⚗️'
                            : '<strong>Nutné:</strong> Prostuduj <em>Liber de Cultura Vitis</em> (Knihovna → Starý Písař) nebo odemkni za 120 ⚗️'}
                    </div>
                </div>
            </div>`;
            return;
        }

        if (!hasVinea) {
            el.innerHTML = `
            <div style="padding:20px 16px;">
                <div style="background:rgba(197,160,89,0.08); border:1px solid rgba(197,160,89,0.3); border-radius:10px; padding:20px; margin-bottom:16px;">
                    <div style="font-size:2rem; margin-bottom:10px;">🍇</div>
                    <h3 style="margin:0 0 8px 0; font-size:1rem;">${lang==='en'?'Vineyard (Vinea)':'Vinohrad (Vinea)'}</h3>
                    <p style="font-size:0.85rem; opacity:0.75; margin:0 0 12px 0; font-style:italic;">
                        ${lang==='en'
                            ? 'The tech is known — but the vineyard has not been built yet.'
                            : 'Technologie je zvládnuta — ale samotný vinohrad ještě nebyl postaven.'}
                    </p>
                    <div style="font-size:0.8rem; padding:8px 12px; background:rgba(197,160,89,0.1); border-radius:6px; border-left:3px solid var(--accent-gold);">
                        🏗️ ${lang==='en'
                            ? '<strong>Next:</strong> Build <em>Vinohrad (Vinea)</em> in Cellarium → Buildings (Plank ×12, Rope ×6, Stone ×6)'
                            : '<strong>Další krok:</strong> Postav <em>Vinohrad (Vinea)</em> v Cellarium → Budovy (Prkno ×12, Provaz ×6, Kámen ×6)'}
                    </div>
                </div>
            </div>`;
            return;
        }

        let html = `<div style="margin-bottom:12px; font-size:0.85rem; opacity:0.75; font-style:italic;">
            ${lang==='en' ? 'Six vine plots. Plant, prune, harvest within the window.' : 'Šest záhonů révy. Zasadit, prořezat, sklidit v okně.'}
        </div>`;

        html += '<div class="garden-grid" style="margin-bottom:16px;">';
        GameState.vinea.forEach((slot, idx) => {
            const variety = slot.variety ? this.VINEA_DB[slot.variety] : null;
            let content = '';
            let btn = '';

            if (slot.state === 'empty') {
                content = `<div class="plot-soil" style="opacity:0.3">🪴</div>
                           <div class="text-sm">${lang==='en'?'Empty':'Prázdné'}</div>`;
                const opts = Object.values(this.VINEA_DB).map(v => {
                    const hasViticis = (GameState.inventory[v.viticis] || 0) > 0;
                    return `<option value="${v.id}" ${hasViticis?'':'disabled'}>${lang==='en'?v.name_en:v.name}${hasViticis?'':' 🔒'}</option>`;
                }).join('');
                btn = `<select id="vinea-sel-${idx}" style="font-size:0.72rem;padding:2px;width:100%;margin-bottom:4px;">${opts}</select>
                       <button class="craft-btn" onclick="GardenSystem.plantVine(${idx}, document.getElementById('vinea-sel-${idx}').value)">🌿 ${lang==='en'?'Plant':'Zasadit'}</button>`;
            } else if (slot.state === 'planted' || slot.state === 'growing') {
                const daysTotal = variety ? variety.ripeDays : 90;
                const elapsed = (Date.now() - slot.plantedAt) / 86400000;
                const pct = Math.min(100, Math.round(elapsed / daysTotal * 100));
                const daysLeft = Math.max(0, Math.ceil(daysTotal - elapsed));
                content = `<div style="font-size:1.2rem;">${variety ? variety.icon : '🍇'}</div>
                           <div class="text-sm">${variety ? (lang==='en'?variety.name_en:variety.name) : ''}</div>
                           <div style="height:3px;background:rgba(0,0,0,0.1);border-radius:2px;margin:3px 0;">
                             <div style="height:100%;width:${pct}%;background:var(--accent-gold);border-radius:2px;"></div>
                           </div>
                           <div style="font-size:0.68rem;opacity:0.6;">${daysLeft}d</div>`;
                btn = `<button class="craft-btn" onclick="GardenSystem.pruneVine(${idx})" ${slot.pruned?'disabled':''}>✂️ ${lang==='en'?'Prune':'Prořezat'}${slot.pruned?' ✓':''}</button>
                       <button class="craft-btn" onclick="GardenSystem.uprootVine(${idx})" style="background:#8b4a3a; font-size:0.72rem; margin-top:3px;">🪴 ${lang==='en'?'Uproot':'Vykořenit'}</button>`;
            } else if (slot.state === 'ripe') {
                content = `<div style="font-size:1.4rem;">🍇</div>
                           <div class="text-sm" style="color:#5a9a5a;font-weight:600;">${lang==='en'?'Ready!':'Zralá!'}</div>
                           <div style="font-size:0.68rem;opacity:0.6;">${variety ? (lang==='en'?variety.name_en:variety.name) : ''}</div>`;
                btn = `<button class="craft-btn" onclick="GardenSystem.harvestVine(${idx})" style="background:#4a7c59;">🍇 ${lang==='en'?'Harvest':'Sklidit'}</button>
                       <button class="craft-btn" onclick="GardenSystem.uprootVine(${idx})" style="background:#8b4a3a; font-size:0.72rem; margin-top:3px;">🪴 ${lang==='en'?'Uproot':'Vykořenit'}</button>`;
            } else if (slot.state === 'overripe') {
                content = `<div style="font-size:1.4rem;">🍂</div>
                           <div class="text-sm" style="color:#c0392b;">${lang==='en'?'Overripe!':'Přezrálá!'}</div>
                           <div style="font-size:0.68rem;opacity:0.6;">${variety ? (lang==='en'?variety.name_en:variety.name) : ''}</div>`;
                btn = `<button class="craft-btn" onclick="GardenSystem.uprootVine(${idx})" style="background:#8b4a3a;">🪴 ${lang==='en'?'Uproot':'Vykořenit'}</button>`;
            } else if (slot.state === 'dormant') {
                content = `<div style="font-size:1.2rem;">❄️</div>
                           <div class="text-sm">${lang==='en'?'Dormant':'Zimní klid'}</div>
                           <div style="font-size:0.72rem;opacity:0.6;">${variety ? (lang==='en'?variety.name_en:variety.name) : ''}</div>`;
                btn = `<button class="craft-btn" onclick="GardenSystem.uprootVine(${idx})" style="background:#8b4a3a; font-size:0.72rem;">🪴 ${lang==='en'?'Uproot':'Vykořenit'}</button>`;
            }

            html += `<div class="garden-plot">${content}<div style="margin-top:auto">${btn}</div></div>`;
        });
        html += '</div>';

        el.innerHTML = html;
    },

};