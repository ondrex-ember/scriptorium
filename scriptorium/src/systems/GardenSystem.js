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
	// (Krmný systém žije v core/game.js — Game.checkAnimalFeeding())

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
        if (typeof FarmyardSystem !== 'undefined') {
            FarmyardSystem.renderFarmyard();
        }
    },

    // Stub delegace — vše farmyard přesunuto do FarmyardSystem.js

    _dvurTab: 'kurnik',
    switchDvurTab: function(tab) {
        if (typeof FarmyardSystem !== 'undefined') { FarmyardSystem._dvurTab = tab; FarmyardSystem.renderFarmyard(); }
    },
    buildAnimalPen: function(pen) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.buildAnimalPen(pen); },
    placeAnimal: function(pen)    { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.placeAnimal(pen); },
    slaughterRabbit: function()   { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterRabbit(); },
    collectGoatMilk: function()   { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.collectGoatMilk(); },
    feedAcorn: function(i)        { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.feedAcorn(i); },
    slaughterPig: function(i)     { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterPig(i); },
    _animalCanBuild: function(c)  { return typeof FarmyardSystem !== 'undefined' ? FarmyardSystem._animalCanBuild(c) : false; },
    _ensureAnimals: function()    { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem._ensureAnimals(); },
    ANIMAL_CFG: {},
    DVUR_TABS: [
        { id: 'kurnik',     icon: '🐔', tech: null },
        { id: 'ovcin',      icon: '🐑', tech: null },
        { id: 'kralikarna', icon: '🐇', tech: 'tech_cuniculi' },
        { id: 'kozi',       icon: '🐐', tech: 'tech_caprile' },
        { id: 'chlev',      icon: '🐖', tech: 'tech_suile' },
        { id: 'staj',       icon: '🐎', tech: 'tech_stabulum' },
        { id: 'oslarna',    icon: '🫏', tech: 'tech_asinus' },
        { id: 'studna',     icon: '🚰', tech: null },
    ],


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
        const hasAdminTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_piscina_administratio');

        let html = `<p class="text-sm" style="margin-bottom:12px; opacity:0.75;">${t('garden.piscinaDesc')}</p>`;
        let speciesBadge = null;
        if (hasAdminTech && typeof FishDB !== 'undefined') {
            const rows = p.fish || [];
            const species = new Set(rows.filter(r => r.qty > 0).map(r => r.species));
            const total = rows.reduce((s, r) => s + r.qty, 0);
            speciesBadge = `🐟 ${species.size} ${lang==='en'?'species':'druhů'} · ${total} ${lang==='en'?'fish':'ks'}`;
        }
        html += this._zahradaStatsBar(lang, [this._brotherBadge('piscina', lang), speciesBadge]);
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
        // Tier 3 je sdílená nádrž pro VŠECHNY dospělé ryby (Game.stockFish vyžaduje
        // tier>=3 a zapisuje štiku/pstruha/úhoře do stejného p.fish pole jako kapra).
        // p.carp (agregát jen kapra) zůstává zdrojem pro harvestCarp/fry produkci —
        // ty jsou mechanicky čistě kaprové. Tohle jen doplňuje zobrazení o ostatní druhy.
        const otherAdultQty = t3locked ? 0 : (p.fish||[]).filter(r => r.stage === 'adult' && r.species !== 'kapr').reduce((s, r) => s + r.qty, 0);
        const totalAdultQty = (p.carp||0) + otherAdultQty;
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
            html += `<div style="font-size:0.82rem; color:#fff;">🐠 ${t('garden.piscinaCarp')}: <strong>${p.carp||0}</strong>${otherAdultQty>0 ? ` <span style="opacity:0.75; font-size:0.85em;">+ ${otherAdultQty} ${lang==='en'?'other':'ostatní'}</span>` : ''}</div>`;
        }
        html += `</div>`;

        // Kapři + ostatní dospělé druhy — plovoucí + potápěcí animace, čistě dekorativní
        if (!t3locked && totalAdultQty > 0) {
            const carpCount = Math.min(totalAdultQty, 6);
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

        // ── SPRÁVA RYBNÍKA (gate: tech_piscina_administratio) ──────────────
        // Přehled druhů, nasazení nakoupené ryby, úlovek štiky, sádky, výlov.
        // Nezasahuje do Tier 1/2/3 boxů výše — čistě nová sekce navíc.
        if (hasAdminTech && typeof FishDB !== 'undefined') {
            const fishRows = p.fish || [];
            html += `<div style="margin-top:14px; padding:12px 14px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">`;
            html += `<div style="font-weight:bold; font-size:0.88rem; margin-bottom:8px;">📋 ${lang==='en'?'Pond Management':'Správa rybníka'}</div>`;

            // Přehled ryb — seskupené podle druhu a stádia
            const grouped = {};
            fishRows.forEach(r => { if (r.qty > 0) grouped[r.species + '|' + r.stage] = (grouped[r.species + '|' + r.stage] || 0) + r.qty; });
            const stageLabel = { fry: lang==='en'?'fry':'plůdek', young: lang==='en'?'young':'mladí', adult: lang==='en'?'adult':'dospělí' };
            html += `<div style="font-size:0.78rem; margin-bottom:10px;">`;
            if (Object.keys(grouped).length === 0) {
                html += `<span style="opacity:0.6; font-style:italic;">${lang==='en'?'The pond is empty.':'Rybník je prázdný.'}</span>`;
            } else {
                Object.keys(grouped).forEach(key => {
                    const [sp, stage] = key.split('|');
                    const def = FishDB[sp] || { icon: '🐟', name: sp, name_en: sp };
                    const spName = lang==='en' ? (def.name_en || sp) : (def.name || sp);
                    html += `<span style="display:inline-block; margin:2px 10px 2px 0;">${def.icon} ${spName} (${stageLabel[stage] || stage}): <strong>${grouped[key]}</strong></span>`;
                });
            }
            html += `</div>`;

            // Nasadit nakoupenou rybu — jen nenativní druhy, co má hráč v inventáři
            const stockable = Object.keys(FishDB).filter(sp => !FishDB[sp].native && (GameState.inventory[sp] || 0) > 0);
            if (stockable.length) {
                html += `<div style="font-size:0.75rem; margin-bottom:8px;">`;
                stockable.forEach(sp => {
                    const def = FishDB[sp];
                    const spName = lang==='en' ? def.name_en : def.name;
                    const have = GameState.inventory[sp] || 0;
                    html += `<button class="craft-btn" onclick="Game.stockFish('${sp}',1)" style="font-size:0.7rem; margin:2px 4px 2px 0;">${def.icon} ${lang==='en'?'Stock':'Nasadit'} ${spName} (${have})</button>`;
                });
                html += `</div>`;
            }

            // Štika — samostatný úlovek (nikdy ne Konvrš, viz Sprint 4)
            const stikaAdult = fishRows.filter(r => r.stage === 'adult' && r.species === 'stika').reduce((s, r) => s + r.qty, 0);
            if (stikaAdult > 0) {
                html += `<div style="font-size:0.75rem; margin-bottom:8px;">
                    🐊 ${lang==='en'?'Pike ready':'Štika k ulovení'}: <strong>${stikaAdult}</strong>
                    <button class="craft-btn" onclick="Game.catchPike(1)" style="font-size:0.7rem; margin-left:6px;">🎣 ${lang==='en'?'Catch 1':'Ulovit 1'}</button>
                    <button class="craft-btn" onclick="Game.catchPike(${stikaAdult})" style="font-size:0.7rem; margin-left:4px;">${lang==='en'?'All':'Vše'} (${stikaAdult})</button>
                </div>`;
            }

            // Sádky — přehled + přesun z rybníka
            const kaprAdultQty = fishRows.filter(r => r.stage === 'adult' && r.species === 'kapr').reduce((s, r) => s + r.qty, 0);
            const sadkyItems = ['kapr_sadky_fresh', 'kapr_sadky_purified', 'stika_sadky_fresh', 'stika_sadky_purified'];
            const sadkyHave = sadkyItems.some(id => (GameState.inventory[id] || 0) > 0);
            if (sadkyHave || kaprAdultQty > 0 || stikaAdult > 0) {
                html += `<div style="font-size:0.75rem; margin-bottom:8px; padding-top:6px; border-top:1px solid rgba(0,0,0,0.08);">`;
                html += `<div style="opacity:0.7; margin-bottom:4px;">🪣 ${lang==='en'?'Holding tank (sádky)':'Sádky'}</div>`;
                sadkyItems.forEach(id => {
                    const qty = GameState.inventory[id] || 0;
                    if (qty > 0) html += `${(typeof iName === 'function') ? iName(id) : id}: <strong>${qty}</strong>&nbsp;&nbsp;`;
                });
                if (kaprAdultQty > 0) html += `<button class="craft-btn" onclick="Game.moveToSadky('kapr',${kaprAdultQty})" style="font-size:0.68rem; margin:4px 4px 0 0;">${lang==='en'?'→ Carp to tank':'→ Kapr do sádek'}</button>`;
                if (stikaAdult > 0) html += `<button class="craft-btn" onclick="Game.moveToSadky('stika',${stikaAdult})" style="font-size:0.68rem; margin:4px 0 0;">${lang==='en'?'→ Pike to tank':'→ Štika do sádek'}</button>`;
                html += `</div>`;
            }

            // Výlov — sezónní event (jen říjen/listopad)
            const vylov = GameState.piscinaVylov;
            const nowMonth = new Date().getMonth() + 1;
            const isAutumn = (nowMonth === 10 || nowMonth === 11);
            html += `<div style="font-size:0.75rem; padding-top:6px; border-top:1px solid rgba(0,0,0,0.08);">`;
            if (vylov && vylov.active) {
                if (Date.now() >= vylov.readyAt) {
                    html += `🎣 ${lang==='en'?'The catch awaits at the dam.':'Úlovek čeká na hrázi.'} <button class="craft-btn" onclick="Game.harvestVylov()" style="font-size:0.7rem; margin-left:6px;">${lang==='en'?'Harvest the catch':'Sklidit výlov'}</button>`;
                } else {
                    const daysLeft = Math.max(0, Math.ceil((vylov.readyAt - Date.now()) / 86400000));
                    html += `🚰 ${lang==='en'?'Sluices draining':'Stavidla vypouští'}... (${daysLeft}d)`;
                }
            } else {
                html += `<button class="craft-btn" onclick="Game.startVylov()" ${isAutumn ? '' : 'disabled'} style="font-size:0.7rem;">🎣 ${lang==='en'?'Begin the autumn harvest':'Zahájit podzimní výlov'}</button>`;
                if (!isAutumn) html += `<span style="opacity:0.55; margin-left:6px; font-style:italic;">${lang==='en'?'(autumn only)':'(jen na podzim)'}</span>`;
            }
            html += `</div>`;

            // Vyza — jarní tah (gate: tech_piscina_expansio)
            if (GameState.researchedTechs.includes('tech_piscina_expansio')) {
                const tahVyz = GameState.piscinaTahVyz;
                const isSpring = (nowMonth === 3 || nowMonth === 4);
                const vyzaHave = GameState.inventory['vyza_sadky_fresh'] || 0;
                html += `<div style="font-size:0.75rem; padding-top:6px; border-top:1px solid rgba(0,0,0,0.08);">`;
                html += `<div style="opacity:0.7; margin-bottom:4px;">🐋 ${lang==='en'?'Sturgeon run':'Vyzí tah'}</div>`;
                if (vyzaHave > 0) {
                    html += `${lang==='en'?'Sturgeon in the tank':'Vyza v sádkách'}: <strong>${vyzaHave}</strong> <button class="craft-btn" onclick="Game.harvestVyza()" style="font-size:0.68rem; margin-left:6px;">${lang==='en'?'Process':'Zpracovat'}</button>`;
                } else if (tahVyz && tahVyz.active) {
                    if (Date.now() >= tahVyz.readyAt) {
                        html += `🌊 ${lang==='en'?'A sturgeon is caught, alive.':'V zátarasu je živá vyza.'} <button class="craft-btn" onclick="Game.harvestTahVyz()" style="font-size:0.7rem; margin-left:6px;">${lang==='en'?'Bring to tank':'Přenést do sádek'}</button>`;
                    } else {
                        const daysLeft = Math.max(0, Math.ceil((tahVyz.readyAt - Date.now()) / 86400000));
                        html += `🌊 ${lang==='en'?'Waiting at the weir':'Čeká se u zátarasu'}... (${daysLeft}d)`;
                    }
                } else {
                    html += `<button class="craft-btn" onclick="Game.startTahVyz()" ${isSpring ? '' : 'disabled'} style="font-size:0.7rem;">🌊 ${lang==='en'?'Set the weir':'Nastražit zátaras'}</button>`;
                    if (!isSpring) html += `<span style="opacity:0.55; margin-left:6px; font-style:italic;">${lang==='en'?'(spring only)':'(jen na jaře)'}</span>`;
                }
                html += `</div>`;
            }

            html += `</div>`;
        }

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
        html += this._zahradaStatsBar((typeof UI !== 'undefined' && UI.lang && UI.lang()==='en')?'en':'cs', [this._brotherBadge('sad', (typeof UI !== 'undefined' && UI.lang && UI.lang()==='en')?'en':'cs')]);
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
                const growHours = slot.growHoursActual || (td ? td.growHours : 48);
                const matureAt = slot.plantedAt + (growHours * 3600000);
                const pct = Math.min(100, Math.round(((now - slot.plantedAt) / (matureAt - slot.plantedAt)) * 100));
                const iconSize = (1.0 + (pct / 100) * 1.0).toFixed(2);
                content = `<div class="plot-soil" style="font-size:${iconSize}rem;">🌱</div><div class="text-sm">${slot.treeType ? iName(slot.treeType) : '?'}</div>`;
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
    // ── Stavový souhrn apiáře — co se děje napříč všemi úly, na první pohled ──
    _buildApiaryOverviewBar: function(apiary, now, hours, season) {
        const lang = (typeof UI !== 'undefined' && UI.lang && UI.lang() === 'en') ? 'en' : 'cs';
        let ready = 0, working = 0, empty = 0, needsQueen = 0, attention = 0, wintering = 0;
        apiary.forEach(h => {
            if (!h.built) { empty++; return; }
            if (!h.hasQueen) { needsQueen++; return; }
            if (season === 'winter') { wintering++; return; }
            const readyAt = h.lastCollectAt + (hours * 3600000);
            if (now >= readyAt) ready++; else working++;
            if ((h.varroaRevealed && (h.varroa || 0) >= 40) || (h.swarmMood || 0) >= 60) attention++;
        });

        const parts = [];
        if (ready > 0) parts.push(`<span style="color:#5a9a5a;">🍯 ${ready} ${lang==='en' ? (ready===1?'ready':'ready') : 'ke sklizni'}</span>`);
        if (working > 0) parts.push(`<span style="opacity:0.65;">⏳ ${working} ${lang==='en' ? 'working' : 'pracuje'}</span>`);
        if (wintering > 0) parts.push(`<span style="opacity:0.55;">❄️ ${wintering} ${lang==='en' ? 'wintering' : 'v zimě'}</span>`);
        if (needsQueen > 0) parts.push(`<span style="color:#c8961e;">🪹 ${needsQueen} ${lang==='en' ? 'need a queen' : 'bez matky'}</span>`);
        if (attention > 0) parts.push(`<span style="color:#c55;">⚠️ ${attention} ${lang==='en' ? 'need attention' : 'potřebuje pozornost'}</span>`);
        if (empty > 0) parts.push(`<span style="opacity:0.4;">➕ ${empty} ${lang==='en' ? 'empty' : 'volných'}</span>`);

        if (parts.length === 0 && apiary.every(h => !h.built)) return '';
        const statusRow = parts.length > 0 ? `<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;
            font-size:0.76rem;padding:6px 12px;margin-bottom:8px;
            background:rgba(0,0,0,0.04);border-radius:6px;border:1px solid rgba(0,0,0,0.08);">
            ${parts.join('')}
        </div>` : '';

        // Dashboard — agregované "high stats", trvale viditelné (ne za klikem)
        const built = apiary.filter(h => h.built);
        const withQueen = built.filter(h => h.hasQueen);
        const stats = GameState.apiaryStats || { totalHoney: 0, totalWax: 0, totalPropolis: 0, totalPollen: 0, totalCollections: 0 };
        let dashboardRow = '';
        if (built.length > 0) {
            const avgQueen = withQueen.length > 0
                ? (withQueen.reduce((s, h) => s + (h.queenStrength || 3), 0) / withQueen.length).toFixed(1)
                : null;
            const bestHive = withQueen.length > 0
                ? withQueen.reduce((best, h) => ((h.strength || 0) > (best.strength || 0) ? h : best), withQueen[0])
                : null;
            const grandCount = built.filter(h => h.grand).length;

            const card = (icon, value, label) => `<span style="display:inline-flex; align-items:baseline; gap:4px; padding:2px 8px; background:rgba(200,160,60,0.06); border-radius:4px;">
                <strong>${icon} ${value}</strong><span style="font-size:0.62rem; opacity:0.55;">${label}</span>
            </span>`;

            dashboardRow = `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;
                font-size:0.74rem;padding:6px 12px;margin-bottom:8px;
                background:rgba(0,0,0,0.02);border-radius:6px;border:1px solid rgba(0,0,0,0.06);">
                ${card('🐝', `${withQueen.length}/${built.length}`, lang==='en' ? 'colonies' : 'včelstev')}
                ${grandCount > 0 ? card('🛖', grandCount, lang==='en' ? 'Great Hives' : 'Velkých úlů') : ''}
                ${avgQueen ? card('⭐', avgQueen, lang==='en' ? 'avg. quality' : 'prům. kvalita') : ''}
                ${bestHive ? card('👑', bestHive.queenName, lang==='en' ? `top (str. ${bestHive.strength}/10)` : `top (síla ${bestHive.strength}/10)`) : ''}
                ${card('🍯', stats.totalHoney, lang==='en' ? 'honey total' : 'medu celkem')}
                ${card('🕯️', stats.totalWax, lang==='en' ? 'wax total' : 'vosku celkem')}
                ${stats.totalPropolis > 0 ? card('🟤', stats.totalPropolis, lang==='en' ? 'propolis total' : 'propolisu celkem') : ''}
                ${card('📖', stats.totalCollections, lang==='en' ? 'harvests' : 'sklizní')}
            </div>`;
        }

        return dashboardRow + statusRow;
    },

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
                queenVarroaResist: 0,
                queenWinter: 0,
                strength: 0,
                varroa: 0,
                swarmMood: 0,
                lastCollectAt: 0,
            }));
        }

        // Celoživotní statistiky apiária — "high stats" pro Včelařův přehled (dashboard)
        if (!GameState.apiaryStats) {
            GameState.apiaryStats = { totalHoney: 0, totalWax: 0, totalPropolis: 0, totalPollen: 0, totalCollections: 0 };
        }

        // Migrace starých save — přidej chybějící pole (varroaRisk boolean → varroa gradient)
        GameState.apiary.forEach(h => {
            if (h.queenName         === undefined) h.queenName         = null;
            if (h.queenStrength     === undefined) h.queenStrength     = 0;
            if (h.queenVarroaResist === undefined) h.queenVarroaResist = h.hasQueen ? (Math.floor(Math.random()*3)+2) : 0;
            if (h.queenWinter       === undefined) h.queenWinter       = h.hasQueen ? (Math.floor(Math.random()*3)+2) : 0;
            if (h.queenMildness     === undefined) h.queenMildness     = h.hasQueen ? (Math.floor(Math.random()*3)+2) : 0; // MRD 5.2
            if (h.queenSwarm        === undefined) h.queenSwarm        = h.hasQueen ? (Math.floor(Math.random()*3)+2) : 0; // MRD 5.2
            if (h.strength          === undefined) h.strength          = h.hasQueen ? 3 : 0;
            if (h.varroa            === undefined) h.varroa            = h.varroaRisk ? 50 : 0;
            if (h.varroaRevealed    === undefined) h.varroaRevealed    = false; // MRD 5.1
            if (h.lastCutAt         === undefined) h.lastCutAt         = 0; // MRD 5.3
            if (h.swarmMood         === undefined) h.swarmMood         = 0;
        });

        const season = Game._getApiarySeason ? Game._getApiarySeason() : 'summer';
        const seasonLabel = { spring:'🌸 Jaro', summer:'☀️ Léto', autumn:'🍂 Podzim', winter:'❄️ Zima' };
        const COLLECT_HOURS = { spring: 16, summer: 8, autumn: 20, winter: 999 };
        const hours = COLLECT_HOURS[season] || 12;
        const now = Date.now();

        // Zimní check
        if (Game.checkApiaryWinter) Game.checkApiaryWinter();

        let html = `<p class="text-sm" style="margin-bottom:12px; opacity:0.75;">${t('garden.apiaryDesc')}</p>`;
        const _apLang = (typeof UI !== 'undefined' && UI.lang && UI.lang()==='en')?'en':'cs';
        html += this._zahradaStatsBar(_apLang, [seasonLabel[season] || '', this._brotherBadge('apiarium', _apLang)]);
        html += this._buildApiaryOverviewBar(GameState.apiary, now, hours, season);
        html += `<div class="garden-grid">`;

        GameState.apiary.forEach((hive, idx) => {
            let content = '';
            let btn = '';
            let extra = '';

            if (!hive.built) {
                // ── Prázdný slot ───────────────────────────────────────────
                const canBuild = (GameState.inventory['stick'] || 0) >= 10 && (GameState.inventory['rope'] || 0) >= 5;
                const hasGrandItem = (GameState.inventory['velky_ul_2'] || 0) > 0 || (GameState.inventory['velky_ul_1'] || 0) > 0;
                const _gLang = (typeof UI !== 'undefined' && UI.lang && UI.lang()==='en') ? 'en' : 'cs';
                content = `<div class="plot-soil" style="opacity:0.3;">🪵</div>
                           <div class="text-sm">${t('garden.apiaryEmpty')}</div>`;
                btn = `<button class="craft-btn" onclick="Game.buildHive(${idx})"
                        ${canBuild ? '' : 'disabled'} style="font-size:0.75rem;">
                        ${t('garden.apiaryBuild')}</button>`;
                if (hasGrandItem) {
                    btn += `<button class="craft-btn" onclick="Game.buildGrandHive(${idx})" style="font-size:0.75rem;margin-top:4px;">
                        ${_gLang === 'en' ? '🛖 Build Great Hive' : '🛖 Postavit Velký úl'}</button>`;
                }

            } else if (!hive.hasQueen) {
                // ── Úl bez matky ───────────────────────────────────────────
                const hasQueen = (GameState.inventory['queen_bee'] || 0) > 0;
                const hasVeteran = (GameState.inventory['veteran_queen'] || 0) > 0;
                content = `<div class="plot-soil" style="opacity:0.5;">🪹</div>
                           <div class="text-sm">${t('garden.apiaryNoQueen')}</div>`;
                btn = `<button class="craft-btn" onclick="Game.addQueen(${idx})"
                        ${hasQueen ? '' : 'disabled'} style="font-size:0.75rem;">
                        ${t('garden.apiaryAddQueen')}</button>`;
                if (hasVeteran) {
                    btn += `<button class="craft-btn" onclick="Game.breedQueen(${idx})"
                             style="font-size:0.7rem; margin-top:4px; background:rgba(150,110,40,0.75);"
                             title="Vysloužilá matka — zděděná síla i zimovatelnost">
                             👑 Chovat z vysloužilé matky</button>`;
                }

            } else {
                // ── Aktivní úl ─────────────────────────────────────────────
                const strength = hive.strength || 3;
                const stars = '⭐'.repeat(Math.min(5, Math.ceil(strength / 2)));
                const _gLang2 = (typeof UI !== 'undefined' && UI.lang && UI.lang()==='en') ? 'en' : 'cs';
                const grandBadge = hive.grand
                    ? `<div style="font-size:0.68rem; color:var(--accent-gold); margin-bottom:2px;">🛖 ${_gLang2==='en' ? 'Great Hive' : 'Velký úl'} (${hive.grand === 2 ? 'II' : 'I'})</div>`
                    : '';
                const queenInfo = hive.queenName
                    ? `<div style="font-size:0.72rem; opacity:0.65; font-style:italic;">
                         👑 ${hive.queenName} ${'★'.repeat(hive.queenStrength || 2)}
                       </div>
                       <div style="font-size:0.65rem; opacity:0.55;" title="Odolnost Varroa / Zimovatelnost">
                         🛡️${'★'.repeat(hive.queenVarroaResist || 2)} ❄️${'★'.repeat(hive.queenWinter || 2)}
                       </div>
                       <div style="font-size:0.65rem; opacity:0.55;" title="Mírnost / Sklon k rojení">
                         🕊️${'★'.repeat(hive.queenMildness || 2)} 🌪️${'★'.repeat(hive.queenSwarm || 2)}
                       </div>`
                    : '';

                // Odhad příští sklizně — rovnou na kartě, žádný klikání (mimo zimu)
                let yieldEstimate = '';
                if (season !== 'winter') {
                    const honeyBaseMap = { spring: 1, summer: 3, autumn: 1 };
                    const waxBaseMap = { spring: 1, summer: 1, autumn: 2 };
                    const wMod = Game._apiaryWeatherMod ? Game._apiaryWeatherMod() : 1.0;
                    const sMod = (hive.strength || 3) / 5;
                    const qMod = (hive.queenStrength || 3) / 3;
                    const vPenalty = (hive.varroa || 0) >= 70 ? 0.5 : (hive.varroa || 0) >= 40 ? 0.8 : 1.0;
                    const gMult = hive.grand === 2 ? 1.5 : hive.grand === 1 ? 1.2 : 1.0;
                    const estHoney = Math.max(1, Math.round((honeyBaseMap[season] || 1) * sMod * qMod * wMod * vPenalty * gMult));
                    const estWax = Math.max(1, Math.round((waxBaseMap[season] || 1) * sMod * vPenalty * gMult));
                    yieldEstimate = `<div style="font-size:0.65rem; opacity:0.5; margin-top:2px;">
                        ~🍯${estHoney} ~🕯️${estWax}${!hive.varroaRevealed ? ' ❔' : ''}
                    </div>`;
                }

                // Varroa varování — MRD 5.1: skryté, dokud hráč úl nezkontroluje nebo nesklidí
                const varroa = hive.varroa || 0;
                const varroaWarn = !hive.varroaRevealed
                    ? `<div style="font-size:0.68rem; opacity:0.5; margin-top:2px;">🐝❔ Varroa: neznámo</div>`
                    : varroa >= 70
                    ? `<div style="font-size:0.72rem; color:#c55; margin-top:2px;">🚨 Varroa ${varroa}/100</div>`
                    : varroa >= 40
                    ? `<div style="font-size:0.72rem; color:#c90; margin-top:2px;">⚠️ Varroa ${varroa}/100</div>`
                    : varroa > 0
                    ? `<div style="font-size:0.68rem; opacity:0.5; margin-top:2px;">Varroa ${varroa}/100</div>`
                    : '';

                // Rojivá nálada — jen když je patrná
                const swarmMood = hive.swarmMood || 0;
                const swarmWarn = swarmMood >= 60
                    ? `<div style="font-size:0.72rem; color:#c55; margin-top:2px;">🐝 Rojivá nálada!</div>`
                    : swarmMood >= 30
                    ? `<div style="font-size:0.68rem; opacity:0.55; margin-top:2px;">🐝 Neklidná</div>`
                    : '';

                if (season === 'winter') {
                    // ── Zima: jen přikrmení ────────────────────────────────
                    content = `<div class="plot-soil" style="color:#7aa;">❄️</div>
                               <div class="text-sm">${t('garden.apiaryWintering')}</div>`;
                    extra = grandBadge + queenInfo + varroaWarn + swarmWarn +
                        `<div style="font-size:0.72rem; margin-top:3px;">${stars}</div>`;
                    const hasHoney = (GameState.inventory['honey'] || 0) >= 1;
                    btn = `<button class="craft-btn" onclick="Game.feedHive(${idx})"
                            ${hasHoney ? '' : 'disabled'} style="font-size:0.72rem;">
                            🍯 Přikrmit (1× med)</button>`;
                    if (!hive.varroaRevealed) {
                        btn += `<button class="craft-btn" onclick="Game.inspectHive(${idx})"
                                 style="font-size:0.7rem; margin-top:4px; background:rgba(90,90,140,0.6);">
                                 🔍 Zkontrolovat</button>`;
                    }

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
                    extra = grandBadge + queenInfo + varroaWarn + swarmWarn +
                        `<div style="font-size:0.72rem; margin-top:3px; opacity:0.7;">${stars}</div>` + yieldEstimate;
                    if (!hive.varroaRevealed) {
                        btn += `<button class="craft-btn" onclick="Game.inspectHive(${idx})"
                                 style="font-size:0.7rem; margin-top:4px; background:rgba(90,90,140,0.6);">
                                 🔍 Zkontrolovat</button>`;
                    }

                    // Léčba Varroa — dostupná jakmile je tlak patrný
                    if (varroa > 0) {
                        const hasThyme = (GameState.inventory['thyme'] || 0) >= 1;
                        btn += `<button class="craft-btn" onclick="Game.treatVarroa(${idx})"
                                 ${hasThyme ? '' : 'disabled'}
                                 style="font-size:0.7rem; margin-top:4px; background:rgba(60,120,60,0.8);">
                                 🌿 Léčit (1× tymián)</button>`;
                    }

                    // Řez matečníků — aktivní správa roje (MRD 5.3), jen s tech_custos_apium
                    const hasCustosApium = GameState.researchedTechs && GameState.researchedTechs.includes('tech_custos_apium');
                    if (hasCustosApium && (hive.swarmMood || 0) > 0) {
                        const cutCooldownLeft = ((hive.lastCutAt || 0) + (12 * 3600000)) - now;
                        if (cutCooldownLeft > 0) {
                            const waitCutH = Math.ceil(cutCooldownLeft / 3600000);
                            btn += `<button class="craft-btn" disabled style="font-size:0.7rem; margin-top:4px;">
                                     ✂️ ${waitCutH}h</button>`;
                        } else {
                            btn += `<button class="craft-btn" onclick="Game.cutQueenCells(${idx})"
                                     style="font-size:0.7rem; margin-top:4px; background:rgba(150,110,40,0.75);">
                                     ✂️ Vyříznout matečníky</button>`;
                        }
                    }

                    // Oddělek — silné včelstvo (síla ≥6) může založit nový úl ve volném slotu (MRD 5.4)
                    if (hasCustosApium && (hive.strength || 0) >= 6 && GameState.apiary.some(h => !h.built)) {
                        btn += `<button class="craft-btn" onclick="Game.makeNuc(${idx})"
                                 style="font-size:0.7rem; margin-top:4px; background:rgba(90,140,90,0.7);"
                                 title="Založí nové včelstvo ve volném slotu, oslabí tento úl o 3 síly">
                                 🐣 Vytvořit oddělek</button>`;
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

        // MRD 5.6 — Zrání propolisové tinktury (vzor Foudres), jen když je co zrát/vyzvednout
        const tinkturaHave = GameState.inventory['propolis_tinktura'] || 0;
        const aging = GameState.apiaryTinkturaAging;
        if (aging || tinkturaHave > 0) {
            html += `<div style="margin-top:12px; padding:12px 14px; background:rgba(150,110,40,0.06); border-radius:8px; border-left:3px solid rgba(150,110,40,0.4);">`;
            html += `<div style="font-weight:bold; font-size:0.85rem; margin-bottom:6px;">🏺 ${_apLang==='en'?'Aging tincture':'Zrání tinktury'}</div>`;
            if (aging) {
                const daysLeft = Math.max(0, Math.ceil((aging.readyAt - now) / 86400000));
                const ready = now >= aging.readyAt;
                html += `<div style="font-size:0.78rem; opacity:0.75; margin-bottom:6px;">
                    ${_apLang==='en'?'Tincture':'Tinktura'} ×${aging.amount} — ${ready ? (_apLang==='en'?'ready!':'hotovo!') : (daysLeft+'d')}
                </div>
                <button class="craft-btn" onclick="Game.collectTinkturaAging()" ${ready?'':'disabled'} style="background:${ready?'#4a7c59':'#888'};">
                    🏺 ${_apLang==='en'?'Collect':'Vyzvednout'}</button>`;
            } else {
                html += `<div style="font-size:0.72rem; opacity:0.6; margin-bottom:6px;">${_apLang==='en'?'Available':'K dispozici'}: ${tinkturaHave}</div>
                <input type="number" id="apiary-aging-amount" min="1" max="${tinkturaHave}" placeholder="${_apLang==='en'?'amount':'množství'}" style="font-size:0.72rem;padding:3px;width:100%;margin-bottom:4px;">
                <button class="craft-btn" onclick="Game.startTinkturaAging(document.getElementById('apiary-aging-amount').value)" style="font-size:0.75rem;">
                    🏺 ${_apLang==='en'?'Set to age (10d)':'Uložit ke zrání (10d)'}</button>`;
            }
            html += `</div>`;
        }

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
                { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb',    locked: true, fertStage: 0, fertQuality: 0, midGrowFertilized: false },
                { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'special', locked: true, fertStage: 0, fertQuality: 0, midGrowFertilized: false },
            ];
            GameState.garden.push(defaults[GameState.garden.length - 14] || { state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb', locked: true, fertStage: 0, fertQuality: 0, midGrowFertilized: false });
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
            // MRD zahony-tiers — starý save neměl fertStage vůbec; plot už v setí/růstu
            // pod starým pravidlem musel projít hnojením, takže tier 1 (bez regrese)
            if (plot.fertStage === undefined) plot.fertStage = (plot.state >= 1) ? 1 : 0;
            if (plot.fertQuality === undefined) plot.fertQuality = (plot.state >= 1) ? 1 : 0;
            if (plot.midGrowFertilized === undefined) plot.midGrowFertilized = false;
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
        const el = document.getElementById('garden-container');
        this._syncGardenLocks();

        // Calculate growth time with tech bonuses (per-plodina, viz GARDEN_PLANTS_DB.growHours)
        let growthSpeed = CONFIG.GROWTH_SPEED;
        if(GameState.researchedTechs.includes('tech_advanced_farming')) {
            growthSpeed *= 2.0; // +100% faster growth
        }
        
        const hasCustomPlant = GameState.researchedTechs.includes('tech_hortus_conclusus');
        const lang = (typeof UI !== 'undefined' && UI.lang) ? UI.lang() : 'cs';

        let html = this._zahradaStatsBar(lang, [this._brotherBadge('zahony', lang)]);
        html += `<div class="garden-grid">`;

        GameState.garden.forEach((plot, idx) => {
            let c = "", b = "", typeLabel = "";
            const growHoursForPlot = this.getGrowHours(plot.crop);
            const needed = (growHoursForPlot * 3600000) / growthSpeed;
            
            if(plot.locked) {
                c = `<div class="plot-soil" style="opacity:0.2">🔒</div><div class="text-sm">${t('garden.locked')}</div>`;
                b = `<button class="craft-btn" disabled>${t('garden.lockedTech')}</button>`;
            }
            else if (plot.state === 0) { 
                if(plot.cropType === 'herb') typeLabel = t('garden.herb');
                else if(plot.cropType === 'vegetable') typeLabel = t('garden.vegetable');
                else if(plot.cropType === 'special') typeLabel = t('garden.special');
                c = `<div class="plot-soil" style="opacity:0.3">🟫</div><div class="text-sm">${typeLabel}</div>`; 
                b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.fertilize')}</button>
                     <button class="craft-btn" onclick="Game.skipFertilize(${idx})" style="font-size:0.68rem;margin-top:3px;opacity:0.75;"
                             title="${lang==='en'?'Sow now, lower yield (~60%), no fertilizer needed':'Zasadit hned, nižší výnos (~60 %), bez hnojiva'}">
                             🟫 ${lang==='en'?'Sow without fertilizer':'Zasadit bez hnojiva'}</button>`; 
            }
            else if (plot.state === 1) {
                if(plot.cropType === 'herb') typeLabel = t('garden.herb');
                else if(plot.cropType === 'vegetable') typeLabel = t('garden.vegetable');
                else if(plot.cropType === 'special') typeLabel = t('garden.special');
                c = `<div class="plot-soil">🟫</div><div class="text-sm">${typeLabel}</div>`;
                if (hasCustomPlant) {
                    // Custom select — filtrovat podle cropType, jen ty co máme semena
                    let opts = Object.entries(GardenSystem.GARDEN_PLANTS_DB)
                        .filter(([, p]) => p.cropType === plot.cropType && (GameState.inventory[p.seed] || 0) > 0)
                        .map(([key, p]) => `<option value="${key}">${p.icon} ${lang==='en'?p.name_en:p.name} (${GameState.inventory[p.seed]||0}×)</option>`)
                        .join('');
                    // Legacy: staré seeds_vegetable (dřív sdílené mrkví+cibulí) — vysází namátkou
                    // jednu z nich, dokud se zásoba přirozeně nevyčerpá (zahrada-rust-kveteni-mrd)
                    if (plot.cropType === 'vegetable' && (GameState.inventory['seeds_vegetable'] || 0) > 0) {
                        opts += `<option value="__legacy_vegetable__">🌱 ${lang==='en'?'Old vegetable seed (random)':'Stará semena zeleniny (namátkou)'} (${GameState.inventory['seeds_vegetable']}×)</option>`;
                    }
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
                const isMature = Date.now() >= plot.plantedAt + needed;
                // MRD zahony-tiers — malý odznak aktuálního tieru + tlačítko přihnojit (hard cap 1×), skryto po dozrání
                let tierBadge = '';
                if (plot.midGrowFertilized) tierBadge = `<div style="font-size:0.62rem;opacity:0.6;margin-top:2px;">🌱+ ${lang==='en'?'boosted':'posíleno'}</div>`;
                else if (plot.fertStage < 1) tierBadge = `<div style="font-size:0.62rem;opacity:0.5;margin-top:2px;">🟫 ${lang==='en'?'no fertilizer':'bez hnojiva'}</div>`;
                else if (plot.fertQuality === 2) tierBadge = `<div style="font-size:0.62rem;opacity:0.5;margin-top:2px;">♻️ ${lang==='en'?'compost':'kompost'}</div>`;
                const midFertBtn = (!isMature && !plot.midGrowFertilized)
                    ? `<button class="craft-btn" onclick="Game.fertilizeDuringGrowth(${idx})" style="font-size:0.65rem;margin-top:2px;opacity:0.8;"
                        title="${lang==='en'?'Fertilize once more — boosts yield, hard cap for now':'Přihnojit ještě jednou — zvýší výnos, zatím tvrdý strop'}">
                        🌱 ${lang==='en'?'Fertilize':'Hnojit'}</button>`
                    : '';
                if (!plot.water) { 
                    c = `<div class="plot-soil">${cropIcon}</div><div class="text-sm">${cropName||t('garden.dry')}</div>${tierBadge}`; 
                    b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.water')}</button>${midFertBtn}`; 
                }
                else if (!isMature) { 
                    const growPct = Math.min(1, Math.max(0, (Date.now() - plot.plantedAt) / needed));
                    const iconSize = (1.0 + growPct * 1.0).toFixed(2);
                    c = `<div class="plot-soil" style="color:#888; font-size:${iconSize}rem;">${cropIcon}</div><div class="text-sm">${cropName||t('garden.growing')}</div>${tierBadge}`; 
                    b = `<button class="craft-btn" disabled>${t('garden.wait')}</button>${midFertBtn}`;
                    if (hasCustomPlant) b += ` <button class="craft-btn" style="background:#8b4a3a;margin-top:3px;font-size:0.7rem;" onclick="GardenSystem.uprootGardenPlot(${idx})">🪴 ${t('garden.uproot')}</button>`;
                }
                else { 
                    c = `<div class="plot-soil" style="color:#4caf50">${cropIcon}</div><div class="text-sm">${cropName||t('garden.grown')}</div>`; 
                    const gp = this.GARDEN_PLANTS_DB[plot.crop];
                    if (gp && gp.canFlower) {
                        b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.harvest')}</button>
                             <button class="craft-btn" style="background:#c5a059;margin-top:3px;font-size:0.7rem;" onclick="GardenSystem.letFlower(${idx})">🌸 ${lang==='en'?'Let flower':'Nechat vykvést'}</button>`;
                    } else {
                        b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">${t('garden.harvest')}</button>`;
                    }
                    if (hasCustomPlant) b += ` <button class="craft-btn" style="background:#8b4a3a;margin-top:3px;font-size:0.7rem;" onclick="GardenSystem.uprootGardenPlot(${idx})">🪴 ${t('garden.uproot')}</button>`;
                }
            }
            else if (plot.state === 3) {
                // Kvetení — čeká na semínka, žádná plodina (zahrada-rust-kveteni-mrd)
                const gp = this.GARDEN_PLANTS_DB[plot.crop];
                const flowerNeeded = (growHoursForPlot * 3600000) / growthSpeed; // stejná doba jako dozrání
                if (Date.now() < (plot.floweredAt || 0) + flowerNeeded) {
                    const growPct = Math.min(1, Math.max(0, (Date.now() - (plot.floweredAt||0)) / flowerNeeded));
                    const iconSize = (1.0 + growPct * 1.0).toFixed(2);
                    c = `<div class="plot-soil" style="color:#c58fd9; font-size:${iconSize}rem;">🌸</div><div class="text-sm">${lang==='en'?'Flowering':'Kvete'}</div>`;
                    b = `<button class="craft-btn" disabled>${t('garden.wait')}</button>`;
                } else {
                    c = `<div class="plot-soil" style="color:#c58fd9">🌸</div><div class="text-sm">${lang==='en'?'Seeds ready':'Semínka zralá'}</div>`;
                    b = `<button class="craft-btn" onclick="GardenSystem.collectSeeds(${idx})">🌱 ${lang==='en'?'Collect seeds':'Sklidit semínka'}</button>`;
                }
                b += ` <button class="craft-btn" style="background:#8b4a3a;margin-top:3px;font-size:0.7rem;" onclick="GardenSystem.uprootGardenPlot(${idx})">🪴 ${t('garden.uproot')}</button>`;
            }
            html += `<div class="garden-plot">${c}<div style="margin-top:auto">${b}</div></div>`;
        });

        html += `</div>`;
        el.innerHTML = html;
    },
    // ════════════════════════════════════════════════════════════════════════
    // POLE (Ager) — polní hospodářství
    // ════════════════════════════════════════════════════════════════════════

    _syncFieldLocks: function() {
        const techs = GameState.researchedTechs || [];
        let unlocked = 2;
        if (techs.includes('tech_de_re_rustica'))  unlocked = Math.max(unlocked, 4);
        if (techs.includes('tech_crop_rotation'))  unlocked = Math.max(unlocked, 6);
        if (techs.includes('tech_polnosti_ii'))    unlocked = Math.max(unlocked, 14);
        GameState.fields.forEach((f, i) => { f.locked = i >= unlocked; });
    },

    _makeFieldSlot: function(i) {
        return {
            locked: i >= 2,    // výchozí, _syncFieldLocks pak přepočítá
            state: 'empty',    // empty | ploughed | sown | growing | ready
            crop: null,        // id plodiny
            phase: 0,          // 0-3 (orba/klíčení/růst/zrání)
            phaseStart: 0,     // timestamp začátku fáze
            watered: false,
            wateredPhases: 0,  // kolik fází bylo zalitých v aktuálním cyklu (0-3, sucho-kompenzace)
            strawBonus: false, // má Humno?
            type: i < 11 ? 'normal' : 'fallow', // Polnosti II: 11 normálních + 3 úhorné (jen fallow plodiny)
        };
    },

    _initFields: function() {
        if (!GameState.fields) {
            GameState.fields = Array.from({length: 14}, (_, i) => this._makeFieldSlot(i));
        }
        // Migrace — existující save měl jen 6 slotů, doplnit na 14 + type pole
        while (GameState.fields.length < 14) {
            GameState.fields.push(this._makeFieldSlot(GameState.fields.length));
        }
        GameState.fields.forEach((f, i) => {
            if (f.strawBonus === undefined) f.strawBonus = false;
            if (f.wateredPhases === undefined) f.wateredPhases = 0;
            if (f.type === undefined) f.type = i < 11 ? 'normal' : 'fallow';
        });
        this._syncFieldLocks();
    },

    // ── ZÁHONY — databáze plantovatelných rostlin ────────────────────────────
    GARDEN_PLANTS_DB: {
        // cropType: 'herb'
        herb_red:    { cropType:'herb',      item:'herb_red',    seed:'seeds_herb',      icon:'🌺', name:'Krvavý květ',    name_en:'Bloodwort',     yield:2, growHours:72 },
        chamomile:   { cropType:'herb',      item:'chamomile',   seed:'seeds_yellow',    icon:'🌼', name:'Heřmánek',       name_en:'Chamomile',     yield:2, growHours:72 },
        herb_blue:   { cropType:'herb',      item:'herb_blue',   seed:'seeds_blue',      icon:'💜', name:'Levandule',      name_en:'Lavender',      yield:2, growHours:144 },
        mint:        { cropType:'herb',      item:'mint',        seed:'seeds_mint',      icon:'🌿', name:'Máta',           name_en:'Mint',          yield:2, growHours:36 },
        thyme:       { cropType:'herb',      item:'thyme',       seed:'seeds_thyme',     icon:'🌿', name:'Tymián',         name_en:'Thyme',         yield:2, growHours:72 },
        st_johns_wort:{ cropType:'herb',     item:'st_johns_wort',seed:'seeds_herb',     icon:'🌻', name:'Třezalka',       name_en:"St. John's Wort",yield:2, growHours:144 },
        sage:        { cropType:'herb',      item:'sage',        seed:'seeds_sage',      icon:'🌿', name:'Šalvěj',         name_en:'Sage',          yield:2, growHours:144 },
        fennel:      { cropType:'herb',      item:'fennel',      seed:'seeds_fennel',    icon:'🌿', name:'Fenykl',         name_en:'Fennel',        yield:2, growHours:72 },
        wormwood:    { cropType:'herb',      item:'wormwood',    seed:'seeds_wormwood',  icon:'🌿', name:'Pelyněk',        name_en:'Wormwood',      yield:2, growHours:144 },
        hyssop:      { cropType:'herb',      item:'hyssop',      seed:'seeds_hyssop',    icon:'🌿', name:'Yzop',           name_en:'Hyssop',        yield:2, growHours:72 },
        yarrow:      { cropType:'herb',      item:'yarrow',      seed:'seeds_yarrow',    icon:'🌿', name:'Řebříček',       name_en:'Yarrow',        yield:2, growHours:36 },
        plantain:    { cropType:'herb',      item:'plantain',    seed:'seeds_plantain',  icon:'🌿', name:'Jitrocel',       name_en:'Plantain',      yield:2, growHours:36 },
        // cropType: 'vegetable'
        carrot:      { cropType:'vegetable', item:'carrot',      seed:'seeds_carrot',    icon:'🥕', name:'Mrkev',          name_en:'Carrot',        yield:3, growHours:72,  canFlower:true, seedYield:2 },
        onion:       { cropType:'vegetable', item:'onion',       seed:'seeds_onion',     icon:'🧅', name:'Cibule',         name_en:'Onion',         yield:3, growHours:72,  canFlower:true, seedYield:2 },
        leek:        { cropType:'vegetable', item:'leek',        seed:'seeds_leek',      icon:'🌿', name:'Pór',            name_en:'Leek',          yield:3, growHours:144, canFlower:true, seedYield:2 },
        cabbage:     { cropType:'vegetable', item:'cabbage',     seed:'seeds_cabbage',   icon:'🥬', name:'Zelí',           name_en:'Cabbage',       yield:3, growHours:144, canFlower:true, seedYield:2 },
        radish:      { cropType:'vegetable', item:'radish',      seed:'seeds_radish',    icon:'🌱', name:'Ředkev',         name_en:'Radish',        yield:3, growHours:36 },
        turnip:      { cropType:'vegetable', item:'turnip',      seed:'seeds_turnip',    icon:'🟣', name:'Řepa',           name_en:'Turnip',        yield:3, growHours:72,  canFlower:true, seedYield:2 },
        garlic:      { cropType:'vegetable', item:'garlic',      seed:'seeds_garlic',    icon:'🧄', name:'Česnek',         name_en:'Garlic',        yield:3, growHours:312 },
        // cropType: 'special'
        mandrake:    { cropType:'special',   item:'mandrake',    seed:'seeds_mandrake',  icon:'🌿', name:'Mandragora',     name_en:'Mandrake',      yield:1, growHours:312 },
        belladonna:  { cropType:'special',   item:'belladonna',  seed:'seeds_belladonna',icon:'🫐', name:'Rulík zlomocný', name_en:'Belladonna',    yield:1, growHours:312 },
        poppy:       { cropType:'special',   item:'poppy',       seed:'seeds_poppy',     icon:'🌸', name:'Mák',            name_en:'Poppy',         yield:2, growHours:144 },
        nettle:      { cropType:'special',   item:'nettle',      seed:'seeds_nettle',    icon:'🌿', name:'Kopřiva',        name_en:'Nettle',        yield:3, growHours:36 },
        cannabis:    { cropType:'special',   item:'cannabis',    seed:'seeds_cannabis',  icon:'🌿', name:'Konopí seté',    name_en:'Hemp',          yield:3, growHours:312 },
        hops:        { cropType:'special',   item:'hops',        seed:'seeds_hops',      icon:'🌿', name:'Chmel',          name_en:'Hops',          yield:2, growHours:312 },
    },

    // Doba růstu podle druhu (hodiny) — fallback 24h, pokud druh chybí (zahrada-rust-kveteni-mrd)
    getGrowHours: function(cropId) {
        const p = this.GARDEN_PLANTS_DB[cropId];
        return (p && p.growHours) ? p.growHours : 24;
    },

    // Zasadit konkrétní plodinu (tech_hortus_conclusus)
    plantGardenPlot: function(idx, plantKey) {
        const plot = GameState.garden[idx];
        if (!plot || plot.locked) return;
        if (plot.state !== 1) { UI.notify('⚠️ Nejdříve zúrodni záhon.', true); return; }

        // Legacy: staré seeds_vegetable od hráčů před novým systémem semen/růstu —
        // namátkou zasadí mrkev nebo cibuli, dokud se zásoba přirozeně nevyčerpá
        if (plantKey === '__legacy_vegetable__') {
            if (!(GameState.inventory['seeds_vegetable'] > 0)) { UI.notify('⚠️ Chybí: stará semena zeleniny', true); return; }
            if (plot.cropType !== 'vegetable') { UI.notify('⚠️ Tento záhon není pro zeleninu.', true); return; }
            Game.removeItem('seeds_vegetable', 1);
            const legacyPick = this.GARDEN_PLANTS_DB[Math.random() < 0.5 ? 'carrot' : 'onion'];
            plot.state = 2;
            plot.crop = legacyPick.item;
            plot.plantedAt = Date.now();
            plot.water = false;
            Game.save();
            GardenSystem.renderGarden();
            UI.notify('🌱 ' + legacyPick.name + ' zasazen/a (staré semínko).');
            return;
        }

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

    // Vykořenit plodinu (vrátí 1 semínko, ale ne pokud právě kvete — o obojí bys přišel zadarmo)
    uprootGardenPlot: function(idx) {
        const plot = GameState.garden[idx];
        if (!plot || plot.locked) return;
        if (plot.state === 0) { UI.notify('⚠️ Záhon je prázdný.', true); return; }
        if (!confirm('Vykořenit záhon? Rostlina bude nenávratně zničena.')) return;
        const plant = plot.crop ? Object.values(this.GARDEN_PLANTS_DB).find(p => p.item === plot.crop) : null;
        if (plant && plot.state !== 3) Game.addItem(plant.seed, 1);
        plot.state = 0;
        plot.crop = null;
        plot.water = false;
        plot.plantedAt = 0;
        plot.floweredAt = 0;
        Game.save();
        GardenSystem.renderGarden();
        UI.notify('🪴 Záhon vykořeněn.');
    },

    // Nechat vykvést místo sklizně — žádná plodina, ale za stejnou dobu jako
    // dozrání dá seedYield semínek (zahrada-rust-kveteni-mrd)
    letFlower: function(idx) {
        const plot = GameState.garden[idx];
        if (!plot || plot.locked || plot.state !== 2) return;
        const gp = this.GARDEN_PLANTS_DB[plot.crop];
        if (!gp || !gp.canFlower) return;
        plot.state = 3;
        plot.floweredAt = Date.now();
        Game.save();
        this.renderGarden();
        UI.notify('🌸 ' + (gp.name || plot.crop) + ' necháno vykvést.');
    },

    // Sklizeň semínek po odkvětu
    collectSeeds: function(idx) {
        const plot = GameState.garden[idx];
        if (!plot || plot.locked || plot.state !== 3) return;
        const gp = this.GARDEN_PLANTS_DB[plot.crop];
        if (!gp) return;
        const growthSpeed = CONFIG.GROWTH_SPEED * (GameState.researchedTechs.includes('tech_advanced_farming') ? 2.0 : 1.0);
        const flowerNeeded = (this.getGrowHours(plot.crop) * 3600000) / growthSpeed;
        if (Date.now() < (plot.floweredAt || 0) + flowerNeeded) { UI.notify('⚠️ Ještě nekvete dost dlouho.', true); return; }
        Game.addItem(gp.seed, gp.seedYield || 1);
        plot.state = 0; plot.crop = null; plot.water = false; plot.floweredAt = 0;
        Game.save();
        this.renderGarden();
        UI.notify('🌱 Semínka sklizena.');
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
        vetch:  { id:'vikev',       icon:'🌸', name:'Vikev',   name_en:'Vetch',   seeds:'seeds_vikev',  yield:3, strawYield:0, feedVal:2, fallow:true },
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
                lastWateredAt: 0,         // timestamp poslední zálivky (sucho-kompenzace při sklizni)
            }));
        }
        // Migrace — přidat nová pole pokud chybí
        GameState.vinea.forEach(slot => {
            if (slot.cuttingsAvailable === undefined) slot.cuttingsAvailable = 0;
            if (slot.pruned === undefined) slot.pruned = false;
            if (slot.lastWateredAt === undefined) slot.lastWateredAt = 0;
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
        slot.lastWateredAt = 0;
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
        if (!confirm(lang==='en' ? 'Uproot this vine? It will be permanently destroyed.' : 'Vykořenit tuto révu? Bude nenávratně zničena.')) return;
        slot.state     = 'empty';
        slot.variety   = null;
        slot.plantedAt = 0;
        slot.ripeAt    = 0;
        slot.windowEnd = 0;
        slot.pruned    = false;
        slot.cuttingsAvailable = 0;
        slot.lastWateredAt = 0;
        Game.save();
        this.renderVinohrad();
        UI.notify('🪴 ' + (lang==='en' ? 'Vine uprooted.' : 'Réva vykořeněna.'));
    },

    waterVine: function(idx) {
        this._initVinea();
        const slot = GameState.vinea[idx];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!slot || (slot.state !== 'planted' && slot.state !== 'growing' && slot.state !== 'ripe')) return;
        if ((Date.now() - (slot.lastWateredAt || 0)) <= 4 * 24 * 3600000) {
            UI.notify(lang==='en' ? 'Already watered recently.' : 'Nedávno zalito.', true); return;
        }
        const techs = GameState.researchedTechs || [];
        const waterCost = techs.includes('tech_field_irrigation') ? 1 : 2;
        if ((GameState.inventory['water'] || 0) < waterCost) {
            UI.notify(lang==='en' ? 'Not enough water.' : 'Nedostatek vody!', true); return;
        }
        Game.removeItem('water', waterCost);
        slot.lastWateredAt = Date.now();
        Game.save();
        this.renderVinohrad();
        UI.notify('💧 ' + (lang==='en' ? 'Watered.' : 'Zalito.'));
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

        // Sucho/zálivka — poslední 4 dny (stejné okno jako Pole: countDryDays(3))
        let isDry = false, wasWatered = false;
        try {
            if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countDryDays) {
                isDry = WeatherSystem.countDryDays(3).dry >= 3;
            }
        } catch(e) {}
        wasWatered = (Date.now() - (slot.lastWateredAt || 0)) <= 4 * 24 * 3600000;

        let wateringMult = 1.0;
        if (isDry && !wasWatered) wateringMult = 0.5;       // sucho, nezaléváno — minimální výnos
        else if (isDry && wasWatered) wateringMult = 1.0;   // sucho, ale zaléváno — kompenzováno
        else if (!isDry && wasWatered) wateringMult = 2.0;  // není sucho, přesto zaléváno — bonus
        // !isDry && !wasWatered → 1.0 (výchozí, beze změny)

        qty = Math.max(1, Math.round(qty * wateringMult));

        // Sklizeň dává vždy syrové hrozny — zpracování (lis/fermentace) řeší Prelum/Cella fermentaria
        const outputId = 'grapes_' + variety.id;

        Game.addItem(outputId, qty);
        const itemName = (typeof iName === 'function') ? iName(outputId) : outputId;
        UI.notify('🍇 ' + (lang==='en'?'Harvested: ':'Sklizeno: ') + itemName + ' ×' + qty);
        Game.addKronikaEntry('important',
            '🍇 Vinohrad: sklizeno ' + (typeof iName==='function'?iName(outputId):outputId) + ' ×' + qty + '.',
            '🍇 Vineyard: harvested ' + outputId + ' ×' + qty + '.',
            '🍇 Vinea: collectum ' + outputId + ' ×' + qty + '.'
        );

        // Slot → dormant (réva přežije zimu)
        slot.state = 'dormant';
        Game.save();
        this.renderVinohrad();
    },

    // ── LIS (Prelum) — hrozny → víno / mošt ─────────────────────────────────
    pressGrapes: function(varietyId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.storage && GameState.storage.prelum && GameState.storage.prelum.built)) {
            UI.notify(lang==='en' ? 'Build Prelum first.' : 'Nejprve postav Prelum.', true); return;
        }
        const variety = this.VINEA_DB[varietyId];
        if (!variety) return;
        const grapesId = 'grapes_' + varietyId;
        const qty = GameState.inventory[grapesId] || 0;
        if (qty <= 0) {
            UI.notify(lang==='en' ? 'No grapes to press.' : 'Žádné hrozny k lisování.', true); return;
        }

        // 3 lehčí odrůdy → rovnou hotové víno (Bělina dle sucha mustum/pryk)
        // 3 těžší odrůdy → mustum_<odrůda>, čeká na fermentaci v Cella fermentaria
        let outputId;
        if (varietyId === 'belina') {
            let droughtDays = 0;
            try {
                if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countDryDays) {
                    droughtDays = WeatherSystem.countDryDays(6).dry;  // 7denní okno: dnes + 6 dní zpět
                }
            } catch(e) {}
            outputId = droughtDays >= 5 ? 'pryk' : 'mustum';
        } else if (varietyId === 'baco') {
            outputId = 'vinum_baci';
        } else if (varietyId === 'modry_janek') {
            outputId = 'vinum_obscurum';
        } else if (varietyId === 'klevner') {
            outputId = 'mustum_klevner';
        } else if (varietyId === 'frankovka') {
            outputId = 'mustum_frankovka';
        } else if (varietyId === 'tramin') {
            outputId = 'mustum_tramin';
        } else {
            return;
        }

        Game.removeItem(grapesId, qty);
        Game.addItem(outputId, qty);
        const itemName = (typeof iName === 'function') ? iName(outputId) : outputId;
        UI.notify('🍷 ' + (lang==='en'?'Pressed: ':'Nalisováno: ') + itemName + ' ×' + qty);
        Game.addKronikaEntry('important',
            '🍷 Prelum: nalisováno ' + (typeof iName==='function'?iName(outputId):outputId) + ' ×' + qty + '.',
            '🍷 Prelum: pressed ' + outputId + ' ×' + qty + '.',
            '🍷 Prelum: pressum ' + outputId + ' ×' + qty + '.'
        );
        Game.save();
        this.renderVinohrad();
    },

    // ── FERMENTACE (Cella fermentaria) — mošt → víno ────────────────────────
    fermentMustum: function(varietyId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.storage && GameState.storage.cella_fermentaria && GameState.storage.cella_fermentaria.built)) {
            UI.notify(lang==='en' ? 'Build Cella fermentaria first.' : 'Nejprve postav Cella fermentaria.', true); return;
        }
        const mustumId = 'mustum_' + varietyId;
        const qty = GameState.inventory[mustumId] || 0;
        if (qty <= 0) {
            UI.notify(lang==='en' ? 'No must to ferment.' : 'Žádný mošt k fermentaci.', true); return;
        }

        // Frankovka → Vinum Rubrum, Klevner a Tramín → Vinum (generické, beze stopy odrůdy)
        let outputId;
        if (varietyId === 'frankovka') outputId = 'vinum_rubrum';
        else if (varietyId === 'klevner' || varietyId === 'tramin') outputId = 'vinum';
        else return;

        Game.removeItem(mustumId, qty);
        Game.addItem(outputId, qty);
        const itemName = (typeof iName === 'function') ? iName(outputId) : outputId;
        UI.notify('⚗️ ' + (lang==='en'?'Fermented: ':'Zfermentováno: ') + itemName + ' ×' + qty);
        Game.addKronikaEntry('important',
            '⚗️ Cella fermentaria: zfermentováno ' + (typeof iName==='function'?iName(outputId):outputId) + ' ×' + qty + '.',
            '⚗️ Cella fermentaria: fermented ' + outputId + ' ×' + qty + '.',
            '⚗️ Cella fermentaria: fermentatum ' + outputId + ' ×' + qty + '.'
        );
        Game.save();
        this.renderVinohrad();
    },

    // ── FOUDRES — zrání vína (1 běžící sud, 14 dní) ─────────────────────────
    startAging: function(amount) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.storage && GameState.storage.foudres && GameState.storage.foudres.built)) {
            UI.notify(lang==='en' ? 'Build Foudres first.' : 'Nejprve postav Foudres.', true); return;
        }
        if (GameState.foudresBarrel) {
            UI.notify(lang==='en' ? 'A barrel is already aging.' : 'Sud už zraje.', true); return;
        }
        amount = parseInt(amount, 10) || 0;
        const have = GameState.inventory['vinum'] || 0;
        if (amount <= 0 || amount > have) {
            UI.notify(lang==='en' ? 'Not enough vinum.' : 'Nedostatek vinum.', true); return;
        }
        Game.removeItem('vinum', amount);
        GameState.foudresBarrel = {
            amount: amount,
            startedAt: Date.now(),
            readyAt: Date.now() + 14 * 86400000,   // 14 herních dní zrání
        };
        UI.notify('🛢️ ' + (lang==='en'?'Barrel started aging.':'Sud uložen ke zrání.'));
        Game.addKronikaEntry('important',
            '🛢️ Foudres: uloženo ' + amount + '× vinum ke zrání.',
            '🛢️ Foudres: ' + amount + '× vinum placed to age.',
            '🛢️ Foudres: ' + amount + '× vinum ad maturationem positum.'
        );
        Game.save();
        this.renderVinohrad();
    },

    collectAging: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const barrel = GameState.foudresBarrel;
        if (!barrel) return;
        if (Date.now() < barrel.readyAt) {
            UI.notify(lang==='en' ? 'Not ready yet.' : 'Ještě nezraje.', true); return;
        }
        Game.addItem('vinum_praeclarum', barrel.amount);
        const itemName = (typeof iName === 'function') ? iName('vinum_praeclarum') : 'vinum_praeclarum';
        UI.notify('🏺 ' + (lang==='en'?'Collected: ':'Vyzvednuto: ') + itemName + ' ×' + barrel.amount);
        Game.addKronikaEntry('important',
            '🏺 Foudres: vyzdviženo ' + itemName + ' ×' + barrel.amount + '.',
            '🏺 Foudres: collected ' + itemName + ' ×' + barrel.amount + '.',
            '🏺 Foudres: collectum ' + itemName + ' ×' + barrel.amount + '.'
        );
        GameState.foudresBarrel = null;
        Game.save();
        this.renderVinohrad();
    },

    // ── UVARIUM — sušení hroznů (1 běžící dávka, 5 dní) ─────────────────────
    startDrying: function(varietyId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.storage && GameState.storage.uvarium && GameState.storage.uvarium.built)) {
            UI.notify(lang==='en' ? 'Build Uvarium first.' : 'Nejprve postav Uvarium.', true); return;
        }
        if (GameState.uvariumDrying) {
            UI.notify(lang==='en' ? 'Grapes are already drying.' : 'Hrozny už schnou.', true); return;
        }
        const variety = this.VINEA_DB[varietyId];
        if (!variety) return;
        const grapesId = 'grapes_' + varietyId;
        const qty = GameState.inventory[grapesId] || 0;
        if (qty <= 0) {
            UI.notify(lang==='en' ? 'No grapes to dry.' : 'Žádné hrozny k sušení.', true); return;
        }
        Game.removeItem(grapesId, qty);
        GameState.uvariumDrying = {
            varietyId: varietyId,
            amount: qty,
            startedAt: Date.now(),
            readyAt: Date.now() + 5 * 86400000,   // 5 herních dní sušení
        };
        UI.notify('☀️ ' + (lang==='en'?'Grapes set to dry.':'Hrozny uloženy k sušení.'));
        Game.addKronikaEntry('important',
            '☀️ Uvarium: uloženo ' + qty + '× hroznů k sušení.',
            '☀️ Uvarium: ' + qty + '× grapes set to dry.',
            '☀️ Uvarium: ' + qty + '× uvae ad siccandum positae.'
        );
        Game.save();
        this.renderVinohrad();
    },

    collectDrying: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const drying = GameState.uvariumDrying;
        if (!drying) return;
        if (Date.now() < drying.readyAt) {
            UI.notify(lang==='en' ? 'Not dry yet.' : 'Ještě neuschly.', true); return;
        }
        Game.addItem('raisins', drying.amount);
        const itemName = (typeof iName === 'function') ? iName('raisins') : 'raisins';
        UI.notify('🍇 ' + (lang==='en'?'Collected: ':'Vyzvednuto: ') + itemName + ' ×' + drying.amount);
        Game.addKronikaEntry('important',
            '🍇 Uvarium: vyzdviženo ' + itemName + ' ×' + drying.amount + '.',
            '🍇 Uvarium: collected ' + itemName + ' ×' + drying.amount + '.',
            '🍇 Uvarium: collectum ' + itemName + ' ×' + drying.amount + '.'
        );
        GameState.uvariumDrying = null;
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
                        <div style="opacity:0.7; margin-top:3px;">${lang==='en'?'Rye, wheat, barley, oats, millet, peas, vetch, flax':'Žito, pšenice, ječmen, oves, proso, hrách, vikev, len'}</div>
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

        // Sucho indikátor — jako override generického textu počasí (detailnější, s dopadem na výnos)
        const droughtMsg = droughtDays > 0
            ? (droughtPenalty
                ? (lang==='en' ? `⚠️ Drought! ${droughtDays} dry days — yield -20%` : `⚠️ Sucho! ${droughtDays} suchých dní — výnos -20%`)
                : (lang==='en' ? `☀️ ${droughtDays} dry days` : `☀️ ${droughtDays} suchých dní`))
            : null;
        // Trojpolní info — jako extra položka ve stejném baru
        const trojpolniMsg = hasRotation
            ? (lang==='en' ? '✅ Three-field system: +25% yield' : '✅ Trojpolní systém: +25% výnos')
            : null;
        html += this._zahradaStatsBar(lang, [trojpolniMsg, this._brotherBadge('pole', lang)], droughtMsg);

        // Sloty
        html += '<div class="garden-grid" style="margin-bottom:16px;">';
        GameState.fields.forEach((field, idx) => {
            if (field.locked) {
                html += `<div class="garden-plot"><div class="plot-soil" style="opacity:0.2">🔒</div><div class="text-sm">${lang==='en'?'Locked':'Zamčeno'}</div></div>`;
                return;
            }

            // Úhorný slot — přijímá jen úhorné plodiny (dnes: vikev)
            const isFallow = field.type === 'fallow';
            const fallowBadge = isFallow ? `<div style="font-size:0.65rem;opacity:0.6;letter-spacing:0.05em;text-transform:uppercase;">🌱 ${lang==='en'?'Fallow slot':'Úhorný slot'}</div>` : '';

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
                // Výběr plodiny — úhorný slot nabízí jen úhorné plodiny
                const cropOpts = Object.entries(this.CROPS_DB)
                    .filter(([key, c]) => field.type !== 'fallow' || c.fallow)
                    .map(([key, c]) =>
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
                const overallPct = Math.min(1, (phaseIdx + progressPct / 100) / 4);
                const iconSize = (1.0 + overallPct * 1.0).toFixed(2);

                content = `<div class="plot-soil" style="color:${phaseIdx>=2?'#4caf50':'#888'}; font-size:${iconSize}rem;">${cropIcon}</div>
                           <div class="text-sm" style="font-weight:bold;">${crop ? (lang==='en'?crop.name_en:crop.name) : '?'}</div>
                           <div class="text-sm" style="opacity:0.7;">${phaseNames[phaseIdx]}</div>
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

            html += `<div class="garden-plot">${fallowBadge}${content}<div style="margin-top:auto">${btn}</div></div>`;
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

    // Počet semen potřebných k osetí celého pole (na rozdíl od záhonu, kde stačí 1)
    FIELD_SEED_COST: 30,

    sowField: function(idx, cropKey) {
        this._initFields();
        const field = GameState.fields[idx];
        const crop = this.CROPS_DB[cropKey];
        if (!field || field.locked || field.state !== 'ploughed' || !crop) return;
        if (field.type === 'fallow' && !crop.fallow) {
            if (typeof UI !== 'undefined') UI.notify(t('game.fallowCropOnly'), true);
            return;
        }
        // Kontrola semen
        const seedCost = this.FIELD_SEED_COST;
        if (!(GameState.inventory[crop.seeds] >= seedCost)) {
            const seedName = typeof ItemsDB !== 'undefined' && ItemsDB[crop.seeds] ? ItemsDB[crop.seeds].name : crop.seeds;
            const have = GameState.inventory[crop.seeds] || 0;
            if (typeof UI !== 'undefined') UI.notify('⚠️ Chybí: ' + seedName + ' (' + have + '/' + seedCost + ')', true);
            return;
        }
        Game.removeItem(crop.seeds, seedCost);
        field.state   = 'growing';
        field.crop    = cropKey;
        field.phase   = 0;
        field.phaseStart = Date.now();
        field.watered = false;
        field.wateredPhases = 0;
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
        const isRye = field.crop === 'rye';
        const isWheat = field.crop === 'wheat';

        // Výpočet výnosu — crop.yield je poměr osivo:výnos (1:3 apod.), násobí se počtem zasetých semen
        let yieldAmt = crop.yield * this.FIELD_SEED_COST;
        if (hasRotation) yieldAmt = Math.round(yieldAmt * 1.25);

        // Sucho penalizace (žito je vůči suchu odolné — neuplatňuje se)
        // Zalévání ve všech 3 fázích cyklu kompenzuje sucho, jako by pršelo
        const fullyIrrigated = (field.wateredPhases || 0) >= 3;
        let dryDays = 0, wetDays = 0;
        try {
            if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countDryDays) {
                dryDays = WeatherSystem.countDryDays(3).dry;  // okno: dnes + 3 dny zpět = 4 dny
                if (dryDays >= 3 && !isRye && !fullyIrrigated) yieldAmt = Math.max(1, Math.round(yieldAmt * 0.8));  // shoda s indikátorem
            }
            if (typeof WeatherSystem !== 'undefined' && WeatherSystem.countWetDays) {
                wetDays = WeatherSystem.countWetDays(3).wet;
            }
        } catch(e) {}

        // Kvalita zrna — jen pšenice a žito (systém kvality zrna, mill-implementation-plan.md)
        let outputId = crop.id;
        if (isWheat || isRye) {
            let chance1 = 70;                                  // základ 70 % 1. třída
            if (!hasHumno) chance1 -= 15;                       // bez sýpky degraduje
            if (hasRotation) chance1 += 10;                     // rotace = lepší hospodaření
            if (isWheat && dryDays >= 3 && !fullyIrrigated) chance1 -= 25;  // pšenice trpí suchem (kompenzováno zaléváním)
            if (isRye && wetDays >= 3) chance1 -= 25;            // žito trpí vlhkem (paličkovice)
            chance1 = Math.max(5, Math.min(95, chance1));
            const grade = (Math.random() * 100 < chance1) ? 1 : 2;
            outputId = crop.id + '_' + grade;
        }

        Game.addItem(outputId, yieldAmt);

        // Sláma
        const strawAmt = hasHumno ? crop.strawYield * 2 : Math.min(1, crop.strawYield);
        if (strawAmt > 0) Game.addItem('straw', strawAmt);

        // Reset pole
        field.state   = 'empty';
        field.crop    = null;
        field.phase   = 0;
        field.phaseStart = 0;
        field.watered = false;
        field.wateredPhases = 0;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cropName = lang === 'en' ? crop.name_en : crop.name;
        const outName = (typeof ItemsDB !== 'undefined' && ItemsDB[outputId]) ? (lang === 'en' ? ItemsDB[outputId].name_en : ItemsDB[outputId].name) : cropName;
        if (typeof UI !== 'undefined') UI.notify(`🌾 ${lang==='en'?'Harvested':'Sklizeno'}: ${outName} ×${yieldAmt}`);
        Game.addKronikaEntry('important', `🌾 Sklizeno: ${outName} ×${yieldAmt}`, `🌾 Harvested: ${outName} ×${yieldAmt}`, `🌾 Messis: ${outName} ×${yieldAmt}`);
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
                if (field.watered) field.wateredPhases = (field.wateredPhases || 0) + 1;
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
        html += this._zahradaStatsBar(lang, [this._brotherBadge('vinohrad', lang)]);

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
                const recentlyWatered = (Date.now() - (slot.lastWateredAt || 0)) <= 4 * 24 * 3600000;
                content = `<div style="font-size:1.2rem;">${variety ? variety.icon : '🍇'}</div>
                           <div class="text-sm">${variety ? (lang==='en'?variety.name_en:variety.name) : ''}</div>
                           <div style="height:3px;background:rgba(0,0,0,0.1);border-radius:2px;margin:3px 0;">
                             <div style="height:100%;width:${pct}%;background:var(--accent-gold);border-radius:2px;"></div>
                           </div>
                           <div style="font-size:0.68rem;opacity:0.6;">${daysLeft}d ${recentlyWatered ? '💧' : ''}</div>`;
                btn = `<button class="craft-btn" onclick="GardenSystem.pruneVine(${idx})" ${slot.pruned?'disabled':''}>✂️ ${lang==='en'?'Prune':'Prořezat'}${slot.pruned?' ✓':''}</button>
                       <button class="craft-btn" onclick="GardenSystem.waterVine(${idx})" ${recentlyWatered?'disabled':''} style="font-size:0.72rem; margin-top:3px;">💧 ${lang==='en'?'Water':'Zalít'}${recentlyWatered?' ✓':''}</button>
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

        // ── ZPRACOVÁNÍ — Prelum / Cella fermentaria / Foudres / Uvarium ────
        const storage = GameState.storage || {};
        const placeholder = (icon, title_cs, title_en, need_cs, need_en) => `
            <div style="background:rgba(197,160,89,0.08); border:1px solid rgba(197,160,89,0.3); border-radius:10px; padding:16px; margin-bottom:10px;">
                <div style="font-size:1.6rem; margin-bottom:6px;">${icon}</div>
                <h4 style="margin:0 0 6px 0; font-size:0.92rem;">${lang==='en'?title_en:title_cs}</h4>
                <div style="font-size:0.78rem; padding:6px 10px; background:rgba(197,160,89,0.1); border-radius:6px; border-left:3px solid var(--accent-gold); font-style:italic; opacity:0.85;">
                    🏗️ ${lang==='en'?need_en:need_cs}
                </div>
            </div>`;

        html += `<div class="section-title" style="margin-top:18px;">🍷 ${lang==='en'?'Processing':'Zpracování'}</div>`;

        // PRELUM
        if (storage.prelum && storage.prelum.built) {
            const opts = Object.values(this.VINEA_DB).map(v => {
                const have = GameState.inventory['grapes_' + v.id] || 0;
                return `<option value="${v.id}" ${have>0?'':'disabled'}>${lang==='en'?v.name_en:v.name} (${have})</option>`;
            }).join('');
            html += `<div class="garden-plot" style="margin-bottom:10px;">
                <div style="font-size:1.2rem;">🍷</div>
                <div class="text-sm" style="font-weight:600;">${lang==='en'?'Prelum — Press':'Prelum — Lis'}</div>
                <select id="prelum-sel" style="font-size:0.72rem;padding:2px;width:100%;margin:4px 0;">${opts}</select>
                <button class="craft-btn" onclick="GardenSystem.pressGrapes(document.getElementById('prelum-sel').value)">🍷 ${lang==='en'?'Press':'Lisovat'}</button>
            </div>`;
        } else {
            html += placeholder('🍷', 'Prelum (Lis)', 'Prelum (Press)',
                '<strong>Další krok:</strong> Postav Prelum v Cellarium → Budovy.',
                '<strong>Next:</strong> Build Prelum in Cellarium → Buildings.');
        }

        // CELLA FERMENTARIA
        if (storage.cella_fermentaria && storage.cella_fermentaria.built) {
            const fermentable = ['klevner', 'frankovka', 'tramin'];
            const opts = fermentable.map(id => {
                const v = this.VINEA_DB[id];
                const have = GameState.inventory['mustum_' + id] || 0;
                return `<option value="${id}" ${have>0?'':'disabled'}>${lang==='en'?v.name_en:v.name} (${have})</option>`;
            }).join('');
            html += `<div class="garden-plot" style="margin-bottom:10px;">
                <div style="font-size:1.2rem;">⚗️</div>
                <div class="text-sm" style="font-weight:600;">${lang==='en'?'Cella fermentaria — Ferment':'Cella fermentaria — Fermentace'}</div>
                <select id="cella-sel" style="font-size:0.72rem;padding:2px;width:100%;margin:4px 0;">${opts}</select>
                <button class="craft-btn" onclick="GardenSystem.fermentMustum(document.getElementById('cella-sel').value)">⚗️ ${lang==='en'?'Ferment':'Fermentovat'}</button>
            </div>`;
        } else {
            html += placeholder('⚗️', 'Cella fermentaria', 'Cella fermentaria',
                '<strong>Další krok:</strong> Postav Cella fermentaria v Cellarium → Budovy.',
                '<strong>Next:</strong> Build Cella fermentaria in Cellarium → Buildings.');
        }

        // FOUDRES
        if (storage.foudres && storage.foudres.built) {
            const barrel = GameState.foudresBarrel;
            if (barrel) {
                const daysLeft = Math.max(0, Math.ceil((barrel.readyAt - Date.now()) / 86400000));
                const ready = Date.now() >= barrel.readyAt;
                html += `<div class="garden-plot" style="margin-bottom:10px;">
                    <div style="font-size:1.2rem;">🛢️</div>
                    <div class="text-sm" style="font-weight:600;">${lang==='en'?'Foudres — Barrel':'Foudres — Sud'}</div>
                    <div style="font-size:0.78rem; opacity:0.75;">Vinum ×${barrel.amount} — ${ready?(lang==='en'?'ready!':'hotovo!'):(daysLeft+'d')}</div>
                    <button class="craft-btn" onclick="GardenSystem.collectAging()" ${ready?'':'disabled'} style="background:${ready?'#4a7c59':'#888'};">🏺 ${lang==='en'?'Collect':'Vyzvednout'}</button>
                </div>`;
            } else {
                const have = GameState.inventory['vinum'] || 0;
                html += `<div class="garden-plot" style="margin-bottom:10px;">
                    <div style="font-size:1.2rem;">🛢️</div>
                    <div class="text-sm" style="font-weight:600;">${lang==='en'?'Foudres — Barrel':'Foudres — Sud'}</div>
                    <div style="font-size:0.72rem; opacity:0.6;">${lang==='en'?'Vinum available':'Vinum k dispozici'}: ${have}</div>
                    <input type="number" id="foudres-amount" min="1" max="${have}" placeholder="${lang==='en'?'amount':'množství'}" style="font-size:0.72rem;padding:3px;width:100%;margin:4px 0;">
                    <button class="craft-btn" onclick="GardenSystem.startAging(document.getElementById('foudres-amount').value)" ${have>0?'':'disabled'}>🛢️ ${lang==='en'?'Barrel (14d)':'Uložit (14d)'}</button>
                </div>`;
            }
        } else {
            html += placeholder('🛢️', 'Foudres (Sudy)', 'Foudres (Barrels)',
                '<strong>Další krok:</strong> Postav Foudres v Cellarium → Budovy.',
                '<strong>Next:</strong> Build Foudres in Cellarium → Buildings.');
        }

        // UVARIUM
        if (storage.uvarium && storage.uvarium.built) {
            const drying = GameState.uvariumDrying;
            if (drying) {
                const v = this.VINEA_DB[drying.varietyId];
                const daysLeft = Math.max(0, Math.ceil((drying.readyAt - Date.now()) / 86400000));
                const ready = Date.now() >= drying.readyAt;
                html += `<div class="garden-plot" style="margin-bottom:10px;">
                    <div style="font-size:1.2rem;">☀️</div>
                    <div class="text-sm" style="font-weight:600;">${lang==='en'?'Uvarium — Drying':'Uvarium — Sušárna'}</div>
                    <div style="font-size:0.78rem; opacity:0.75;">${v?(lang==='en'?v.name_en:v.name):''} ×${drying.amount} — ${ready?(lang==='en'?'ready!':'hotovo!'):(daysLeft+'d')}</div>
                    <button class="craft-btn" onclick="GardenSystem.collectDrying()" ${ready?'':'disabled'} style="background:${ready?'#4a7c59':'#888'};">🍇 ${lang==='en'?'Collect':'Vyzvednout'}</button>
                </div>`;
            } else {
                const opts = Object.values(this.VINEA_DB).map(v => {
                    const have = GameState.inventory['grapes_' + v.id] || 0;
                    return `<option value="${v.id}" ${have>0?'':'disabled'}>${lang==='en'?v.name_en:v.name} (${have})</option>`;
                }).join('');
                html += `<div class="garden-plot" style="margin-bottom:10px;">
                    <div style="font-size:1.2rem;">☀️</div>
                    <div class="text-sm" style="font-weight:600;">${lang==='en'?'Uvarium — Drying':'Uvarium — Sušárna'}</div>
                    <select id="uvarium-sel" style="font-size:0.72rem;padding:2px;width:100%;margin:4px 0;">${opts}</select>
                    <button class="craft-btn" onclick="GardenSystem.startDrying(document.getElementById('uvarium-sel').value)">☀️ ${lang==='en'?'Dry (5d)':'Sušit (5d)'}</button>
                </div>`;
            }
        } else {
            html += placeholder('☀️', 'Uvarium (Sušárna)', 'Uvarium (Drying House)',
                '<strong>Další krok:</strong> Postav Uvarium v Cellarium → Budovy (vyžaduje tech Uvarium).',
                '<strong>Next:</strong> Build Uvarium in Cellarium → Buildings (requires Uvarium tech).');
        }

        el.innerHTML = html;
    },

    // ── Sjednocený stat bar (počasí + odkaz na Přehled) — pro všech 6 podtabů ──
    // extras: pole extra <span> textů (specifické pro podtab, např. sezóna/trojpolní)
    // weatherOverride: nahradí generický text počasí detailnější zprávou (např. sucho -20% výnos)
    // ── Dormitorium "kukaň" — indikátor přiřazeného bratra v tabu ──
    _brotherBadge: function(tabId, lang) {
        const b = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(x => x.assignedTab === tabId);
        if (!b) return null;
        const rec = (b.rosterId && typeof DormitoriumRosterDB !== 'undefined') ? DormitoriumRosterDB[b.rosterId] : null;
        const icon = (rec && rec.icon) ? rec.icon : '📿';
        const level = (typeof Game !== 'undefined' && Game.dormitoriumBrotherLevel) ? Game.dormitoriumBrotherLevel(b, tabId) : 1;
        return `<span title="${lang==='en'?'Overseen by':'Řídí'}: ${b.name}" style="cursor:default;">${icon} ${b.name} · Lv${level}</span>`;
    },

    _zahradaStatsBar: function(lang, extras, weatherOverride) {
        let weatherTxt = weatherOverride;
        if (!weatherTxt) {
            let dryDays = 0, wetDays = 0;
            try {
                if (typeof WeatherSystem !== 'undefined') {
                    dryDays = WeatherSystem.countDryDays ? WeatherSystem.countDryDays(3).dry : 0;
                    wetDays = WeatherSystem.countWetDays ? WeatherSystem.countWetDays(3).wet : 0;
                }
            } catch(e) {}
            if (dryDays >= 3) weatherTxt = lang==='en' ? `⚠️ Drought — ${dryDays} dry days` : `⚠️ Sucho — ${dryDays} suchých dní`;
            else if (wetDays >= 3) weatherTxt = lang==='en' ? `🌧️ Wet — ${wetDays} rainy days` : `🌧️ Vlhko — ${wetDays} deštivých dní`;
            else weatherTxt = lang==='en' ? '🌤️ Favorable weather' : '🌤️ Příznivé počasí';
        }
        const items = [`<span>${weatherTxt}</span>`];
        (extras || []).filter(Boolean).forEach(e => items.push(`<span>${e}</span>`));
        items.push(`<span style="cursor:pointer;margin-left:auto;" onclick="GardenSystem.showZahradaDetail()">📦 ${lang==='en'?'Overview':'Přehled'}</span>`);

        return `<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;font-size:0.78rem;opacity:0.8;padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:6px;margin-bottom:14px;">
            ${items.join('')}
        </div>`;
    },

    // ── Přehled produkce Zahrady + Dvora — jeden komplet modal (vzor: Vitrea) ──
    showZahradaDetail: function() {
        if (typeof NotificationSystem === 'undefined') return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const inv = GameState.inventory || {};
        const row = (id) => {
            const n = inv[id] || 0;
            const nm = (typeof iName === 'function') ? iName(id) : id;
            return `<div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:2px; ${n === 0 ? 'opacity:0.45;' : ''}"><span>${nm}</span><strong>${n}</strong></div>`;
        };
        const header = (icon, label) => `<div style="font-size:0.72rem; font-weight:bold; opacity:0.75; margin:8px 0 4px;">${icon} ${label}</div>`;

        let html = '';

        // Záhony — dynamicky z GARDEN_PLANTS_DB
        html += header('🌱', lang==='en'?'Beds':'Záhony');
        Object.values(this.GARDEN_PLANTS_DB).forEach(p => html += row(p.item));

        // Sad
        html += header('🌳', lang==='en'?'Orchard':'Sad');
        ['apple','pear','plum','cherry','walnut','mulberry','quince','sorb','rowan','linden_fruit','linden_blossom'].forEach(id => html += row(id));

        // Apiarium
        html += header('🐝', 'Apiarium');
        ['honey','beeswax','pollen'].forEach(id => html += row(id));

        // Piscina
        html += header('🐟', 'Piscina');
        ['fish','fry','carp','stika','pstruh','uhor','kapr_sadky_fresh','kapr_sadky_purified','stika_sadky_fresh','stika_sadky_purified'].forEach(id => html += row(id));

        // Pole — dynamicky z CROPS_DB
        html += header('🌾', lang==='en'?'Field':'Pole');
        Object.values(this.CROPS_DB).forEach(c => html += row(c.id));

        // Vinohrad — dynamicky z VINEA_DB outputs
        html += header('🍇', lang==='en'?'Vineyard':'Vinohrad');
        const vinOutputs = new Set();
        Object.values(this.VINEA_DB).forEach(v => (v.outputs || []).forEach(o => vinOutputs.add(o)));
        Array.from(vinOutputs).forEach(id => html += row(id));

        // Dvůr — zvířecí produkty
        html += header('🐔', lang==='en'?'Poultry':'Drůbež');
        ['egg','feather_hen','chicken_meat'].forEach(id => html += row(id));

        html += header('🐑', lang==='en'?'Sheep/Goats':'Ovce/Kozy');
        ['wool','mutton','raw_hide','lamb_hide','goat_milk'].forEach(id => html += row(id));

        html += header('🐷', lang==='en'?'Pigs':'Prasata');
        ['lard','cured_meat'].forEach(id => html += row(id));

        html += header('🐰', lang==='en'?'Rabbits':'Králíci');
        ['rabbit_meat','rabbit_pelt'].forEach(id => html += row(id));

        html += header('🕊️', lang==='en'?'Dovecote':'Holubník');
        ['pigeon_dung'].forEach(id => html += row(id));

        html += header('🌾', lang==='en'?'Feed & Manure':'Krmivo a hnůj');
        ['hay','grain','manure'].forEach(id => html += row(id));

        NotificationSystem.modal({
            icon: '🌿',
            title: lang==='en' ? 'Monastery produce' : 'Klášterní produkce',
            text: html,
            choices: [{ label: (lang==='en'?'Close':'Zavřít') }]
        });
    },

};