// ═══ src/core/managers/GardenManager.js ═══
// Extrakce z game.js (Krok 2 / D3, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Zahony (hnojeni/farmAction) + Sad (stromy).
// Puvodne Game.* na radcich 1297-1542 + 2433-2448 (HEAD po D2, 5df8537+).
// Chovani beze zmeny — pouze presun + prepis this.removeItem/addItem
// -> Game.removeItem/addItem (cross-domenova zavislost na jeste
// needitovanem D8/Inventory).
const GardenManager = {
    skipFertilize: function (plotIdx) {
        const plot = GameState.garden[plotIdx];
        if (!plot || plot.locked) return;
        if (plot.state !== 0) return;
        if (!(GameState.inventory['hoe'] > 0)) { UI.notify(t('game.needHoe'), true); return; }
        plot.state = 1;
        plot.fertStage = 0;
        plot.fertQuality = 0;
        Game.save();
        UI.renderAll();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        UI.notify(lang === 'en' ? '🟫 Sown without fertilizer — lower yield, but no waiting.' : '🟫 Zaséto bez hnojiva — nižší výnos, ale bez čekání na hnůj.');
    },

    // MRD zahony-tiers — přihnojit v průběhu růstu, hard cap 1× za cyklus (budoucí pokročilá horticulture zvýší strop)
    fertilizeDuringGrowth: function (plotIdx) {
        const plot = GameState.garden[plotIdx];
        if (!plot || plot.locked) return;
        if (plot.state !== 2) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (plot.midGrowFertilized) {
            UI.notify(lang === 'en' ? 'Already fertilized this cycle — hard cap for now.' : 'Tento cyklus už bylo přihnojeno — zatím tvrdý strop.', true);
            return;
        }
        const fertItem = (GameState.inventory['compost'] > 0) ? 'compost' : 'bonemeal';
        if (!(GameState.inventory[fertItem] > 0)) { UI.notify(t('game.needFertilizer'), true); return; }
        Game.removeItem(fertItem, 1);
        plot.midGrowFertilized = true;
        Game.save();
        UI.renderAll();
        UI.notify(lang === 'en' ? '🌱 Fertilized mid-growth — yield boosted.' : '🌱 Přihnojeno v průběhu růstu — výnos posílen.');
    },

    farmAction: function (plotIdx) {
        const plot = GameState.garden[plotIdx];
        if (plot.locked) { UI.notify(t('game.plotLocked'), true); return; }

        if (plot.state === 0) {
            if (!(GameState.inventory['hoe'] > 0)) { UI.notify(t('game.needHoe'), true); return; }
            const fertItem = (GameState.inventory['compost'] > 0) ? 'compost' : 'bonemeal';
            if (!(GameState.inventory[fertItem] > 0)) { UI.notify(t('game.needFertilizer'), true); return; }
            Game.removeItem(fertItem, 1); plot.state = 1;
            plot.fertStage = 1;
            plot.fertQuality = (fertItem === 'compost') ? 2 : 1; // MRD zahony-tiers — compost = "lepší hnojivo"
        } else if (plot.state === 1) {
            // Pokud má hráč tech_hortus_conclusus — custom sázení řeší GardenSystem.plantGardenPlot
            // farmAction state=1 je fallback pro auto-sow bez techu
            const hasHortus = GameState.researchedTechs && GameState.researchedTechs.includes('tech_hortus_conclusus');
            if (hasHortus) {
                // S techem — UI zobrazuje select, farmAction by neměl být volán pro state=1
                // Ale pro jistotu přesměruj na renderGarden
                GardenSystem.renderGarden();
                return;
            }

            // Auto-sow bez tech_hortus_conclusus
            // Seed pool dle cropType — využít GARDEN_PLANTS_DB pokud dostupné
            let seedsNeeded = '';
            if (plot.cropType === 'herb') {
                const herbSeeds = ['seeds_herb', 'seeds_yellow', 'seeds_blue', 'seeds_mint', 'seeds_thyme', 'seeds_sage', 'seeds_fennel', 'seeds_wormwood', 'seeds_hyssop', 'seeds_yarrow'];
                seedsNeeded = herbSeeds.find(s => (GameState.inventory[s] || 0) > 0) || 'seeds_herb';
            } else if (plot.cropType === 'vegetable') {
                const vegSeeds = ['seeds_vegetable', 'seeds_leek', 'seeds_cabbage', 'seeds_radish', 'seeds_turnip', 'seeds_garlic'];
                seedsNeeded = vegSeeds.find(s => (GameState.inventory[s] || 0) > 0) || 'seeds_vegetable';
            } else if (plot.cropType === 'special') {
                const specSeeds = ['seeds_mandrake', 'seeds_belladonna', 'seeds_poppy', 'seeds_nettle', 'seeds_hops', 'seeds_herb'];
                seedsNeeded = specSeeds.find(s => (GameState.inventory[s] || 0) > 0) || '';
            }

            if (!seedsNeeded || !(GameState.inventory[seedsNeeded] > 0)) {
                UI.notify(t('game.needSeeds'), true);
                return;
            }

            Game.removeItem(seedsNeeded, 1);
            plot.state = 2;

            // Seed → crop mapping — přes GARDEN_PLANTS_DB pokud možno
            if (typeof GardenSystem !== 'undefined' && GardenSystem.GARDEN_PLANTS_DB) {
                const plantDef = Object.values(GardenSystem.GARDEN_PLANTS_DB).find(p => p.seed === seedsNeeded && p.cropType === plot.cropType);
                if (plantDef) {
                    plot.crop = plantDef.item;
                } else {
                    // Fallback pro seeds_vegetable (náhodná zelenina)
                    const veggies = ['carrot', 'onion', 'leek', 'cabbage', 'radish', 'turnip'];
                    plot.crop = veggies[Math.floor(Math.random() * veggies.length)];
                }
            } else {
                // Hardcoded fallback
                const seedCropMap = {
                    seeds_herb: 'herb_red', seeds_yellow: 'herb_yellow', seeds_blue: 'herb_blue',
                    seeds_mint: 'mint', seeds_thyme: 'thyme', seeds_sage: 'sage',
                    seeds_fennel: 'fennel', seeds_wormwood: 'wormwood', seeds_hyssop: 'hyssop', seeds_yarrow: 'yarrow',
                    seeds_vegetable: 'carrot', seeds_leek: 'leek', seeds_cabbage: 'cabbage',
                    seeds_radish: 'radish', seeds_turnip: 'turnip', seeds_garlic: 'garlic',
                    seeds_mandrake: 'mandrake', seeds_belladonna: 'belladonna', seeds_poppy: 'poppy', seeds_nettle: 'nettle',
                    seeds_hops: 'hops',
                };
                plot.crop = seedCropMap[seedsNeeded] || 'herb_red';
            }

            plot.plantedAt = Date.now();
        } else if (plot.state === 2 && !plot.water) {
            const haveWater = GameState.inventory['water'] || 0;
            const haveSpring = GameState.inventory['spring_water'] || 0;
            if (haveWater <= 0 && haveSpring <= 0) { UI.notify(t('game.needWater'), true); return; }
            const usedSpring = haveWater <= 0;
            if (usedSpring) Game.removeItem('spring_water', 1); else Game.removeItem('water', 1);
            plot.water = true;
            UI.notify(t(usedSpring ? 'game.wateredSpring' : 'game.watered'));
        } else if (plot.state === 2 && plot.water) {
            // Calculate growth time with tech bonuses (per-plodina, GARDEN_PLANTS_DB.growHours)
            let growthSpeed = CONFIG.GROWTH_SPEED;
            if (GameState.researchedTechs.includes('tech_advanced_farming')) {
                growthSpeed *= 2.0; // +100% faster growth
            }
            const growHoursForPlot = (typeof GardenSystem !== 'undefined') ? GardenSystem.getGrowHours(plot.crop) : 24;
            const needed = (growHoursForPlot * 3600000) / growthSpeed;

            if (Date.now() > plot.plantedAt + needed) {
                plot.state = 0; plot.water = false;
                const harvestCrop = plot.crop;
                plot.crop = null;

                // Track harvest stat
                if (GameState.achievements) {
                    GameState.achievements.stats.harvests++;
                }

                // Harvest yields — via GARDEN_PLANTS_DB
                const _gp = typeof GardenSystem !== 'undefined'
                    ? Object.values(GardenSystem.GARDEN_PLANTS_DB).find(p => p.item === harvestCrop)
                    : null;
                // Role Zahradník: herb_yield bonus (1.20 = +20%)
                const _yieldMult = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('herb_yield') : 1.0;
                // MRD zahony-tiers — hnojivo ovlivňuje výnos: 0=bez hnojiva 0.6x, 1=bonemeal 1.0x,
                // compost 1.15x, přihnojeno v růstu (hard cap) 1.3x bez ohledu na vstupní kvalitu
                let _fertMult = 0.6;
                if (plot.fertStage >= 1) _fertMult = (plot.fertQuality === 2) ? 1.15 : 1.0;
                if (plot.midGrowFertilized) _fertMult = 1.3;
                const _totalMult = _yieldMult * _fertMult;
                if (_gp) {
                    Game.addItem(harvestCrop, Math.max(1, Math.round(_gp.yield * _totalMult)));
                    // Šance vrátit semínko (30%) — NEPLATÍ pro druhy s kvetením (zahrada-rust-kveteni-mrd):
                    // u nich jde semínko jen přes GardenSystem.collectSeeds()
                    if (!_gp.canFlower && Math.random() < 0.3) Game.addItem(_gp.seed, 1);
                } else if (harvestCrop === 'hops') {
                    Game.addItem('hops', Math.max(1, Math.round(2 * _totalMult)));
                    if (Math.random() > 0.6) Game.addItem('seeds_hops', 1);
                } else if (['carrot', 'onion', 'potato'].includes(harvestCrop)) {
                    Game.addItem(harvestCrop, Math.max(1, Math.round(3 * _totalMult)));
                    if (Math.random() > 0.5) Game.addItem('seeds_vegetable', 1);
                } else if (harvestCrop) {
                    // fallback pro neznámé plodiny
                    Game.addItem(harvestCrop, Math.max(1, Math.round(2 * _totalMult)));
                }

                // MRD zahony-tiers — reset pro příští cyklus
                plot.fertStage = 0;
                plot.fertQuality = 0;
                plot.midGrowFertilized = false;

                // Herbarium — threshold odemykání Scrinium folií za vzácné byliny
                if (['mandrake', 'belladonna', 'poppy'].includes(harvestCrop)) {
                    if (!GameState.herbarium) GameState.herbarium = { rareTotal: 0, mandrakeTotal: 0 };
                    GameState.herbarium.rareTotal = (GameState.herbarium.rareTotal || 0) + 1;
                    if (harvestCrop === 'mandrake') {
                        GameState.herbarium.mandrakeTotal = (GameState.herbarium.mandrakeTotal || 0) + 1;
                    }
                    if (typeof SecretsSystem !== 'undefined') {
                        const rt = GameState.herbarium.rareTotal;
                        const mt = GameState.herbarium.mandrakeTotal;
                        if (rt >= 1) SecretsSystem.unlockFolioById('folio_signatura');
                        if (rt >= 5) SecretsSystem.unlockFolioById('folio_hildegardis');
                        if (rt >= 15) SecretsSystem.unlockFolioById('folio_miasma');
                        if (mt >= 3) SecretsSystem.unlockFolioById('folio_mandragora');
                        if (rt >= 30) SecretsSystem.unlockFolioById('folio_theriaca');
                    }
                }

                Game.checkAchievements();
            } else UI.notify(t('game.growing'), true);
        }
        Game.save(); UI.renderAll();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SAD (Pomarium) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    // Sdílená základní doba růstu (hodiny) — čte plantTree() i checkOrchardGrowth().
    // Skutečná doba se losuje jednou při zasazení (±15 %), viz plantTree().
    ORCHARD_GROW_HOURS: {
        seed_apple: 48, seed_pear: 48, seed_plum: 36, seed_cherry: 36,
        seed_walnut: 72, seed_mulberry: 48, seed_quince: 60,
        seed_sorb: 72, seed_rowan: 48, seed_linden: 60,
    },

    plantTree: function (slotIdx, seedId) {
        if (!GameState.orchard) return;
        if (!seedId) { UI.notify(t('game.noSeedSelected'), true); return; }
        if (!(GameState.inventory[seedId] > 0)) { UI.notify(t('game.noSeeds'), true); return; }
        const slot = GameState.orchard[slotIdx];
        if (slot.state !== 'empty') { UI.notify(t('game.slotOccupied'), true); return; }
        Game.removeItem(seedId, 1);
        slot.state = 'growing';
        slot.treeType = seedId;
        slot.plantedAt = Date.now();
        slot.lastHarvestAt = 0;
        // Doba růstu — losuje se jednou napevno, ±15 % kolem základu (náhoda do Sadu)
        const baseHours = this.ORCHARD_GROW_HOURS[seedId] || 48;
        slot.growHoursActual = Math.round(baseHours * (0.85 + Math.random() * 0.3) * 10) / 10;
        Game.save();
        UI.renderOrchard();
        UI.notify('🌱 ' + t('game.treePlanted'));
    },

    harvestTree: function (slotIdx) {
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
        const baseQty = (slot.treeType === 'seed_walnut' || slot.treeType === 'seed_sorb') ? 2 : 3;
        const bountiful = Math.random() < 0.2;
        const qty = baseQty + (bountiful ? 1 : 0);
        Game.addItem(fruit, qty);
        // Lípa dává navíc lipový květ
        if (slot.treeType === 'seed_linden') Game.addItem('linden_blossom', 1);
        // Pyl při sklizni — pyl-frekvence-mrd (20.8.2026): drobná vedlejší
        // surovina, ne garantovaný drop. Jen jaro/léto (kvetení), 8 % šance.
        const _pollenSeason = (typeof Game !== 'undefined' && Game._getApiarySeason) ? Game._getApiarySeason() : null;
        if ((_pollenSeason === 'spring' || _pollenSeason === 'summer') && Math.random() < 0.08) Game.addItem('pollen', 1);
        slot.lastHarvestAt = Date.now();
        Game.save();
        UI.renderOrchard();
        const _lang = (GameState.settings && GameState.settings.language) || 'cs';
        UI.notify((bountiful ? '🍎✨ ' : '🍎 ') + t('game.treeHarvested').replace('{qty}', qty)
            + (bountiful ? (_lang === 'en' ? ' — bountiful harvest!' : ' — bohatá úroda!') : ''));
    },

    fellTree: function (slotIdx) { return GardenSystem.fellTree(slotIdx); },

    checkOrchardGrowth: function () {
        if (!GameState.orchard) return;
        let changed = false;
        GameState.orchard.forEach(slot => {
            if (slot.state === 'growing') {
                // Použij losovanou dobu (pokud existuje), jinak fallback na základ (staré uložené hry)
                const hours = slot.growHoursActual || this.ORCHARD_GROW_HOURS[slot.treeType] || 48;
                if (Date.now() >= slot.plantedAt + (hours * 3600000)) {
                    slot.state = 'mature';
                    slot.lastHarvestAt = Date.now(); // první sklizeň hned k dispozici
                    changed = true;
                }
            }
        });
        if (changed) { Game.save(); }
    },
};