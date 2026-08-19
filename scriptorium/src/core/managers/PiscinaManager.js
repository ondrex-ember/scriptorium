// ═══ src/core/managers/PiscinaManager.js ═══
// Extrakce z game.js (Krok 2 / D5, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Piscina (rybík). Původně Game.* na řádcích
// 1338–1751 (HEAD po D2+D3+D4). Chování beze změny — pouze přesun +
// přepsání this.removeItem/addItem -> Game.removeItem/addItem
// (D8/Inventory, needitováno) a self-referencí
// Game._piscinaNextId/_piscinaSyncAggregates/SADKY_PURIFY_DAYS/
// VYLOV_DRAIN_DAYS -> PiscinaManager.* (patřily do této domény,
// jen byly odkazovány přes Game. prefix).
const PiscinaManager = {
    _piscinaNextId: function () {
        const p = GameState.piscina;
        p._fishIdSeq = (p._fishIdSeq || 0) + 1;
        return 'f' + p._fishIdSeq;
    },

    // Přepočte staré agregátní počty (p.fry/p.youngCarp/p.carp + jejich
    // *AddedAt) z fish[] — render i feedPiscina zůstávají beze změny,
    // čtou pořád stejná pole, jen teď jsou odvozená z entitního modelu.
    // Nejstarší řádek daného stádia určuje *AddedAt (nejblíž dokončení).
    // Počítá se JEN kapr — Breeding/Rearing/Carp Pond je narativně čistě
    // kaprový cyklus; ostatní druhy (štika/pstruh/úhoř) žijí ve fish[]
    // vedle, ale do těchhle starých agregátů nepatří (jinak by štika
    // navyšovala zobrazený počet kaprů).
    _piscinaSyncAggregates: function () {
        const p = GameState.piscina;
        if (!p || !p.fish) return;
        p.fish = p.fish.filter(r => r.qty > 0);
        const sumQty = (stage) => p.fish.filter(r => r.stage === stage && r.species === 'kapr').reduce((s, r) => s + r.qty, 0);
        const oldestAt = (stage) => {
            const rows = p.fish.filter(r => r.stage === stage && r.species === 'kapr');
            return rows.length ? Math.min(...rows.map(r => r.enteredStageAt)) : 0;
        };
        p.fry = sumQty('fry');
        p.fryAddedAt = p.fry > 0 ? oldestAt('fry') : 0;
        p.youngCarp = sumQty('young');
        p.youngAddedAt = p.youngCarp > 0 ? oldestAt('young') : 0;
        p.carp = sumQty('adult');
    },

    // Nasadí nakoupenou/darovanou rybu (stika/pstruh/uhor) přímo do rybníka
    // jako dospělý řádek — koupený kus je už vzrostlý, neprochází fry/young.
    // Konzolí testovatelné hned; tlačítko v UI přijde v Sprintu 7.
    stockFish: function (species, qty) {
        const p = GameState.piscina;
        if (p.tier < 3) { UI.notify(t('game.needPiscina1'), true); return; }
        if ((GameState.inventory[species] || 0) < qty) { UI.notify(t('game.missingItem').replace('{item}', ItemsDB[species] ? ItemsDB[species].name : species), true); return; }
        Game.removeItem(species, qty);
        p.fish = p.fish || [];
        p.fish.push({ id: PiscinaManager._piscinaNextId(), species: species, stage: 'adult', qty: qty, enteredStageAt: Date.now() });
        PiscinaManager._piscinaSyncAggregates();
        Game.save(); UI.renderPiscina();
        const name = (typeof iName === 'function') ? iName(species) : species;
        UI.notify('🎣 ' + name + ' ×' + qty + ' → Piscina');
    },

    buildPiscina: function (tier) {
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
        if ((GameState.inventory['rock'] || 0) < cost.rock) { UI.notify(t('game.needStone') + ` (${cost.rock})`, true); return; }
        if ((GameState.inventory['stick'] || 0) < cost.stick) { UI.notify(t('game.needWood') + ` (${cost.stick})`, true); return; }
        if (cost.rope && (GameState.inventory['rope'] || 0) < cost.rope) { UI.notify(t('game.needRope') + ` (${cost.rope})`, true); return; }
        Game.removeItem('rock', cost.rock);
        Game.removeItem('stick', cost.stick);
        if (cost.rope) Game.removeItem('rope', cost.rope);
        p.tier = tier;
        Game.save(); UI.renderPiscina();
        UI.notify('🐟 ' + t('game.piscinaBuilt').replace('{tier}', tier));
    },

    addFry: function (qty) {
        const p = GameState.piscina;
        if (p.tier < 1) { UI.notify(t('game.needPiscina1'), true); return; }
        if ((GameState.inventory['fry'] || 0) < qty) { UI.notify(t('game.noFry'), true); return; }
        Game.removeItem('fry', qty);
        p.fish = p.fish || [];
        p.fish.push({ id: PiscinaManager._piscinaNextId(), species: 'kapr', stage: 'fry', qty: qty, enteredStageAt: Date.now() });
        PiscinaManager._piscinaSyncAggregates();
        Game.save(); UI.renderPiscina();
        UI.notify('🫧 ' + t('game.fryAdded').replace('{qty}', qty));
    },

    feedPiscina: function () {
        const p = GameState.piscina;
        if (p.tier < 1) return;
        // feed-cooldown-fix-mrd (10.8.2026): lastFedAt se dřív jen nastavovalo,
        // nikdy nekontrolovalo — krmitelné donekonečna. Teď 1/den.
        const DAY = 24 * 60 * 60 * 1000;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (p.lastFedAt && (Date.now() - p.lastFedAt) < DAY) {
            UI.notify(lang === 'en' ? '⚠️ Already fed today.' : '⚠️ Dnes už jsi nakrmil.', true);
            return;
        }
        const feedNeeded = p.fry + p.youngCarp + p.carp;
        if (feedNeeded === 0) { UI.notify(t('game.piscinaEmpty'), true); return; }
        if ((GameState.inventory['fiber'] || 0) < feedNeeded) { UI.notify(t('game.needFeedFish') + ` (${feedNeeded})`, true); return; }
        Game.removeItem('fiber', feedNeeded);
        p.lastFedAt = Date.now();
        Game.save(); UI.renderPiscina();
        UI.notify('🌿 ' + t('game.piscinaFed'));
    },

    transferFry: function () {
        const p = GameState.piscina;
        if (!p || (p.pendingFry || 0) <= 0) { UI.notify(t('game.noFryPending'), true); return; }
        if (p.tier < 1) { UI.notify(t('game.needPiscina1'), true); return; }
        const qty = p.pendingFry;
        p.fish = p.fish || [];
        p.fish.push({ id: PiscinaManager._piscinaNextId(), species: 'kapr', stage: 'fry', qty: qty, enteredStageAt: Date.now() });
        p.pendingFry = 0;
        PiscinaManager._piscinaSyncAggregates();
        Game.save(); UI.renderPiscina();
        UI.notify('🫧 ' + t('game.fryTransferred').replace('{qty}', qty));
    },

    harvestCarp: function (qty) {
        const p = GameState.piscina;
        qty = Math.min(qty, p.carp);
        if (qty <= 0) { UI.notify(t('game.noCarp'), true); return; }
        let remaining = qty;
        const adultRows = (p.fish || []).filter(r => r.stage === 'adult' && r.species === 'kapr' && r.qty > 0).sort((a, b) => a.enteredStageAt - b.enteredStageAt);
        for (const row of adultRows) {
            if (remaining <= 0) break;
            const take = Math.min(row.qty, remaining);
            row.qty -= take;
            remaining -= take;
        }
        PiscinaManager._piscinaSyncAggregates();
        Game.addItem('carp', qty);
        Game.save(); UI.renderPiscina();
        UI.notify('🐠 ' + t('game.carpHarvested').replace('{qty}', qty));
    },

    checkPiscinaGrowth: function () {
        const p = GameState.piscina;
        if (!p || p.tier < 1) return;
        p.fish = p.fish || [];
        const now = Date.now();
        const WEEK = 7 * 24 * 3600000;
        const WEEKS2 = 14 * 24 * 3600000;
        let changed = false;

        // Tier 1 → tier 2: každý plůdkový řádek zraje samostatně — vlastní
        // enteredStageAt, žádný sdílený timestamp k resetnutí cizím řádkem.
        if (p.tier >= 2) {
            p.fish.forEach(row => {
                if (row.stage === 'fry' && row.qty > 0 && now >= row.enteredStageAt + WEEK) {
                    row.stage = 'young';
                    row.enteredStageAt = now;
                    changed = true;
                }
            });
        }

        // Tier 2 → tier 3: každý řádek nedospělých kapřů zraje samostatně
        if (p.tier >= 3) {
            p.fish.forEach(row => {
                if (row.stage === 'young' && row.qty > 0 && now >= row.enteredStageAt + WEEKS2) {
                    row.stage = 'adult';
                    row.enteredStageAt = now;
                    changed = true;
                }
            });
        }

        // Tier 3: kaprový rybník produkuje 1 plůdek / 24h — beze změny,
        // vztaženo k celkovému počtu dospělých, ne k jednotlivým řádkům.
        const DAY = 24 * 3600000;
        const carpQty = p.fish.filter(r => r.stage === 'adult').reduce((s, r) => s + r.qty, 0);
        if (p.tier >= 3 && carpQty > 0) {
            if (p.lastFryProductionAt === undefined) p.lastFryProductionAt = now;
            if (now >= p.lastFryProductionAt + DAY) {
                p.pendingFry = (p.pendingFry || 0) + 1;
                p.lastFryProductionAt = now;
                changed = true;
            }
        }

        if (changed) {
            PiscinaManager._piscinaSyncAggregates();
            Game.save();
        }
    },

    // Štika — přirozená kontrola hejna (historicky doloženo, viz MRD sekce 4).
    // Týdně sežere 1 kus na štiku, vždy nejmladší dostupný řádek nekaprodravce
    // (young má přednost před fry — proxy za "nejslabší", bez simulace zdraví).
    // Nikdy nesahá na dospělé/tržní kusy — štika loví jen mezi dorůstajícími.
    checkPiscinaPredation: function () {
        const p = GameState.piscina;
        if (!p || !p.fish) return;
        const stikaCount = p.fish.filter(r => r.stage === 'adult' && r.species === 'stika').reduce((s, r) => s + r.qty, 0);
        if (stikaCount <= 0) return;
        const now = Date.now();
        const WEEK = 7 * 24 * 3600000;
        if (p.lastPredationAt === undefined) p.lastPredationAt = now;
        if (now < p.lastPredationAt + WEEK) return;
        p.lastPredationAt = now;

        let remaining = stikaCount;
        ['young', 'fry'].forEach(stage => {
            if (remaining <= 0) return;
            const rows = p.fish.filter(r => r.stage === stage && r.species !== 'stika' && r.qty > 0)
                .sort((a, b) => b.enteredStageAt - a.enteredStageAt); // nejmladší (nejnovější) nejdřív
            for (const row of rows) {
                if (remaining <= 0) break;
                const take = Math.min(row.qty, remaining);
                row.qty -= take;
                remaining -= take;
            }
        });
        PiscinaManager._piscinaSyncAggregates();
        Game.save();
    },

    // Úlovek štiky — VÝHRADNĚ hráčem/mnichem, nikdy konvršem. Konvrš přiřazený
    // do Piscina Manufaktura sklízí jen kapra (viz oprava v auto-collect bloku
    // níže) — tahle funkce se odtud nikdy nevolá, štika se musí lovit ručně.
    catchPike: function (qty) {
        const p = GameState.piscina;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const stikaTotal = (p.fish || []).filter(r => r.stage === 'adult' && r.species === 'stika').reduce((s, r) => s + r.qty, 0);
        qty = Math.min(qty, stikaTotal);
        if (qty <= 0) { UI.notify(lang === 'en' ? '❌ No pike to catch.' : '❌ Žádná štika k ulovení.', true); return; }
        let remaining = qty;
        const rows = (p.fish || []).filter(r => r.stage === 'adult' && r.species === 'stika' && r.qty > 0).sort((a, b) => a.enteredStageAt - b.enteredStageAt);
        for (const row of rows) {
            if (remaining <= 0) break;
            const take = Math.min(row.qty, remaining);
            row.qty -= take;
            remaining -= take;
        }
        PiscinaManager._piscinaSyncAggregates();
        Game.addItem('stika', qty);
        Game.save(); UI.renderPiscina();
        UI.notify((lang === 'en' ? '🎣 Pike caught ×' : '🎣 Ulovena štika ×') + qty);
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SÁDKY — per-instance zrání ryb po vylovení (reuse vzoru z CheeseSystem.js:
    // registrace instance + přesun 1 kusu mezi inventářovými sloty _fresh → _purified).
    // Rozdíl oproti sýru: instance je qty-vážená (stejný vzor jako Piscina fish[]
    // ze Sprintu 1), ne 1 instance na kus — víc kusů vylovených najednou sdílí
    // řádek, dokud se něco neodliší. Volitelná alternativa k přímému harvestCarp/
    // catchPike — hráč si vybere: rychlá sklizeň hned, nebo počkat na lepší kvalitu.
    // Gate: tech_piscina_administratio (součást "kompletní správy", viz MRD).
    // ═══════════════════════════════════════════════════════════════════════════

    SADKY_PURIFY_DAYS: 3,

    // Přesune dospělé kusy z rybníka do sádek (místo přímé sklizně do inventáře).
    // fishing-species-mrd (10.8.2026): NOVÁ funkce, mirror moveToSadky, ale
    // zdroj je volný úlovek z inventáře (rybaření-scavenge), ne dospělé kusy
    // z Piscina chovu. Jen kapr/štika mají _sadky_fresh pár — pstruh/úhoř
    // zatím ne (vědomé omezení rozsahu, MRD 10.8.2026, krok 3).
    // POZOR na nesoulad jmen: inventář+scavenge používá anglicky 'carp',
    // ale existující sádky/Piscina infrastruktura interně 'kapr' (viz
    // moveToSadky volání v GardenSystem.js) — štika je stejně v obou.
    SADKY_SUPPORTED_SPECIES: { carp: 'kapr', stika: 'stika' },
    stockCaughtFish: function (invSpecies, qty) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.researchedTechs.includes('tech_piscina_administratio')) { UI.notify(t('game.needDePiscibus'), true); return; }
        const sadkySpecies = this.SADKY_SUPPORTED_SPECIES[invSpecies];
        if (!sadkySpecies) {
            UI.notify(lang === 'en' ? '❌ This species cannot be kept in the holding tank yet.' : '❌ Tenhle druh zatím do sádek nejde.', true);
            return;
        }
        const have = GameState.inventory[invSpecies] || 0;
        qty = Math.min(qty, have);
        if (qty <= 0) { UI.notify(lang === 'en' ? '❌ No catch to stock.' : '❌ Žádný úlovek k naskladnění.', true); return; }
        Game.removeItem(invSpecies, qty);

        if (!GameState.piscinaSadky) GameState.piscinaSadky = [];
        GameState.piscinaSadky.push({ id: PiscinaManager._piscinaNextId(), species: sadkySpecies, qty: qty, enteredAt: Date.now(), phase: 'fresh' });
        Game.addItem(sadkySpecies + '_sadky_fresh', qty);
        Game.save(); UI.renderPiscina();
        const name = (typeof iName === 'function') ? iName(invSpecies) : invSpecies;
        UI.notify('🪣 ' + name + ' ×' + qty + ' → ' + (lang === 'en' ? 'holding tank' : 'sádky'));
    },

    moveToSadky: function (species, qty) {
        const p = GameState.piscina;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.researchedTechs.includes('tech_piscina_administratio')) { UI.notify(t('game.needDePiscibus'), true); return; }
        const rows = (p.fish || []).filter(r => r.stage === 'adult' && r.species === species && r.qty > 0).sort((a, b) => a.enteredStageAt - b.enteredStageAt);
        const total = rows.reduce((s, r) => s + r.qty, 0);
        qty = Math.min(qty, total);
        if (qty <= 0) { UI.notify(lang === 'en' ? '❌ Nothing to move to the holding tank.' : '❌ Nic k přesunu do sádek.', true); return; }
        let remaining = qty;
        for (const row of rows) {
            if (remaining <= 0) break;
            const take = Math.min(row.qty, remaining);
            row.qty -= take;
            remaining -= take;
        }
        PiscinaManager._piscinaSyncAggregates();

        if (!GameState.piscinaSadky) GameState.piscinaSadky = [];
        GameState.piscinaSadky.push({ id: PiscinaManager._piscinaNextId(), species: species, qty: qty, enteredAt: Date.now(), phase: 'fresh' });
        Game.addItem(species + '_sadky_fresh', qty);
        Game.save(); UI.renderPiscina();
        const name = (typeof iName === 'function') ? iName(species) : species;
        UI.notify('🪣 ' + name + ' ×' + qty + ' → ' + (lang === 'en' ? 'holding tank' : 'sádky'));
    },

    // Denní tick (self-guarded, volaný z tick smyčky vedle checkPiscinaGrowth).
    checkSadkyAging: function () {
        if (!GameState.piscinaSadky || !GameState.piscinaSadky.length) return;
        const now = Date.now();
        const DAY = 24 * 3600000;
        let advanced = 0;
        GameState.piscinaSadky.forEach(inst => {
            if (inst.phase === 'fresh' && inst.qty > 0 && now >= inst.enteredAt + PiscinaManager.SADKY_PURIFY_DAYS * DAY) {
                const oldId = inst.species + '_sadky_fresh';
                const newId = inst.species + '_sadky_purified';
                const moved = Math.min(GameState.inventory[oldId] || 0, inst.qty);
                if (moved > 0) {
                    GameState.inventory[oldId] -= moved;
                    GameState.inventory[newId] = (GameState.inventory[newId] || 0) + moved;
                }
                inst.phase = 'purified';
                advanced += moved;
            }
        });
        GameState.piscinaSadky = GameState.piscinaSadky.filter(inst => inst.qty > 0);
        if (advanced > 0) {
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                NotificationSystem.panel('🪣 ' + (lang === 'en'
                    ? advanced + '× fish purified in the holding tank.'
                    : advanced + '× ryba se pročistila v sádkách.'), 'info');
            }
            Game.save();
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // VÝLOV — podzimní výlov rybníka (viz MRD sekce 7). Reuse existujících vzorů:
    // ad-hoc Date.now() timer (jako feedPiscina/checkPiscinaGrowth), Manufaktura
    // Conversi/bratr přiřazení (jako auto-collect blok) pro bonus, ne podmínku.
    // Gate: tech_piscina_administratio + podzimní měsíc (říjen/listopad, reálné
    // device datum — stejný vzor jako sezónní check ve WellSystem, ne TimeSys
    // hodina/den, protože jde o roční sezónu, ne o hodinu v rámci dne).
    // KLÍČOVÉ: sklízí jen kapra. Štika se NEsklidí automaticky — zůstává v
    // rybníce, dokud ji hráč sám neuloví přes catchPike().
    // ═══════════════════════════════════════════════════════════════════════════

    VYLOV_DRAIN_DAYS: 3,

    startVylov: function () {
        const p = GameState.piscina;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.researchedTechs.includes('tech_piscina_administratio')) { UI.notify(t('game.needDePiscibus'), true); return; }
        if (p.tier < 3) { UI.notify(t('game.piscinaUpgradeFirst'), true); return; }
        if (GameState.piscinaVylov && GameState.piscinaVylov.active) { UI.notify(t('game.busy'), true); return; }
        const month = new Date().getMonth() + 1; // reálné device datum (sezóna, ne hodina — jiný vzor než TimeSys)
        if (month !== 10 && month !== 11) {
            UI.notify(lang === 'en' ? '❌ The pond can only be drained in autumn (Oct–Nov).' : '❌ Rybník lze vypustit jen na podzim (říjen–listopad).', true);
            return;
        }
        const DAY = 24 * 3600000;
        GameState.piscinaVylov = { active: true, startedAt: Date.now(), readyAt: Date.now() + PiscinaManager.VYLOV_DRAIN_DAYS * DAY, notifiedReady: false };
        Game.save(); UI.renderPiscina();
        UI.notify(lang === 'en' ? '🚰 Sluices opened — the pond is draining.' : '🚰 Stavidla otevřena — rybník se vypouští.');
    },

    // Denní tick (volaný z tick smyčky) — jen jednorázová notifikace, jakmile
    // vypouštění doběhne. Samotná sklizeň čeká na ruční harvestVylov().
    checkVylovStatus: function () {
        const v = GameState.piscinaVylov;
        if (!v || !v.active || v.notifiedReady) return;
        if (Date.now() >= v.readyAt) {
            v.notifiedReady = true;
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                NotificationSystem.panel('🎣 ' + (lang === 'en'
                    ? 'The pond has been drained — the catch awaits at the dam.'
                    : 'Rybník je vypuštěn — úlovek čeká na hrázi.'), 'info');
            }
            Game.save();
        }
    },

    harvestVylov: function () {
        const p = GameState.piscina;
        const v = GameState.piscinaVylov;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!v || !v.active) { UI.notify(t('game.busy'), true); return; }
        if (Date.now() < v.readyAt) { UI.notify(lang === 'en' ? '⏳ The sluices are still draining.' : '⏳ Stavidla ještě vypouští.', true); return; }

        // Conversi/bratr přiřazený do Piscina — bonus na výnos, ne podmínka (MRD 3a)
        const hasHelp = (GameState.conversi || []).some(k => k.task === 'piscina')
            || ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'piscina');
        const mult = hasHelp ? 1.2 : 1.0;

        // Kapr — VŠECHNY dospělé řádky. Štika (species !== 'kapr') se filtrem
        // vylučuje záměrně — zůstává v rybníce, ulov je zvlášť přes catchPike().
        const carpTotal = (p.fish || []).filter(r => r.stage === 'adult' && r.species === 'kapr').reduce((s, r) => s + r.qty, 0);
        const carpQty = Math.round(carpTotal * mult);
        (p.fish || []).forEach(r => { if (r.stage === 'adult' && r.species === 'kapr') r.qty = 0; });
        if (carpQty > 0) Game.addItem('carp', carpQty);

        // Plevelná ryba/drobní — malý vedlejší výnos, prodá se rovnou chudině (charita, dle historického materiálu)
        const smallFishCoin = 2 + Math.floor(Math.random() * 4);
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(smallFishCoin);
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 1);

        PiscinaManager._piscinaSyncAggregates();
        GameState.piscinaVylov = { active: false, startedAt: 0, readyAt: 0, notifiedReady: false };
        Game.save(); UI.renderPiscina();

        const msg = lang === 'en'
            ? `🎣 Autumn harvest: ${carpQty}× carp brought in${hasHelp ? ' (net-haulers\' help)' : ''}. Small fish sold to the poor for ${smallFishCoin} g. Pike remain in the pond — catch them separately.`
            : `🎣 Podzimní výlov: ${carpQty}× kapr sklizen${hasHelp ? ' (s pomocí sítětařů)' : ''}. Drobná ryba prodána chudině za ${smallFishCoin} g. Štiky zůstávají v rybníce — ulov je zvlášť.`;
        UI.notify(msg);
    },
};
