// ═══ src/core/managers/InventoryManager.js ═══
// Extrakce z game.js (Krok 2 / D8, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Inventory/Crafting/Study/Eat/Drink. Původně Game.*
// na řádcích 1991-3059 (HEAD po D1-D5+D9+D10+D12+D13+cleanup), jeden
// souvislý blok. Chování beze změny — pouze přesun + přepsání self-referencí
// this.removeItem/addItem/useToolCharge -> InventoryManager.* (stěhují se
// spolu). Zbylé Game.* odkazy (_checkSaveHint/_saveHint z D1,
// addKronikaEntry/kronikaCraftFlushBuffer z D9, checkEnvironment z D7)
// zůstávají správně jako externí závislosti. OPRAVENO 29.8.2026:
// _scavenging NEbyl správnou externí závislostí — Game._scavenging nikdy
// neexistoval (ScavengeManager je od D7 extrakce vlastní objekt, ne
// Game.*), potlačení toastu při hromadném scavengi tiše nefungovalo. Teď
// čte ScavengeManager._scavenging přímo (addItem.js, scavenge-toast-fix).
// POZNÁMKA (ne bug, jen pozorování): GardenSystem.js má vlastní živý
// useToolCharge (voliván z fellTree) a VigorSystem.js vlastní živý eat
// (voliván z Game.eat níže) — jiné, ne duplicity, netknuto.
const InventoryManager = {
    addItem: function (id, qty) {
        const isFirstTime = !GameState.inventory[id] || GameState.inventory[id] === 0;

        if (!GameState.inventory[id]) GameState.inventory[id] = 0;
        GameState.inventory[id] += qty;

        // Stats tracking
        if (GameState.achievements) {
            GameState.achievements.stats.itemsCrafted += qty;
            if (id === 'research') {
                GameState.achievements.stats.researchCount += qty;
            }
        }

        // Discovery mechanika
        if (isFirstTime && LoreDB[id] && !GameState.discoveredLore.includes(id)) {
            GameState.discoveredLore.push(id);
            if (GameState.achievements) GameState.achievements.stats.itemsDiscovered++;
            UI.notifyPanel(t('game.newCodexEntry'), 'system');
            Game.addKronikaEntry('important', '📜 Nový zápis v Codexu.', '📜 New entry in the Codex.', '📜 Nova inscriptio in Codice.');
            setTimeout(() => UI.notify(t('game.itemAdded').replace('{qty}', qty).replace('{item}', iName(id))), 500);
        } else {
            // bug fix 29.8.2026: kontrolovalo se Game._scavenging, který
            // nikdy neexistoval (ScavengeManager je od D7 extrakce vlastní
            // objekt, ne Game.*) — potlačení obecného toastu při hromadném
            // scavengi nikdy nefungovalo (duplicitní toasty, mj. u vody).
            if (!ScavengeManager._scavenging) UI.notify(t('game.itemAdded').replace('{qty}', qty).replace('{item}', iName(id)));
        }

        // perf fix 29.8.2026 (scavenge-claim-freeze): checkAchievements()
        // procházelo celou AchievementsDB při KAŽDÉM addItem() volání, i
        // během hromadného scavenge-claimu (desítky/stovky volání v jedné
        // smyčce — viz ScavengeManager claim blok). Teď respektuje stejnou
        // dávkovou bránu jako save/render — jednorázový check doplněn na
        // konci claim smyčky (ScavengeManager.js).
        if (!ScavengeManager._scavenging) {
            Game.save(); Game.checkEnvironment(); UI.renderAll();
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.render) PersonaSystem.render();
            Game.checkAchievements();
        }
    },
    removeItem: function (id, qty) {
        if (GameState.inventory[id] >= qty) {
            GameState.inventory[id] -= qty; if (GameState.inventory[id] <= 0) delete GameState.inventory[id];
            Game.save(); Game.checkEnvironment(); UI.renderAll(); return true;
        } return false;
    },
    craft: function (id) {
        const r = RecipesDB.find(x => x.id === id);
        // coquina-migrace-mrd (7.8.2026): migrované cat:"food" recepty
        // (mají shodné id v CookingSystem.COOK_TYPES) se přesměrují na
        // časovaný proces ve Vaření. Ne-migrované food recepty i vše
        // ostatní (cat != food) beze změny — okamžitá cesta níž.
        if (r && r.cat === 'food' && typeof CookingSystem !== 'undefined' && CookingSystem.COOK_TYPES && CookingSystem.COOK_TYPES[id]) {
            CookingSystem.startCooking(id);
            return;
        }
        // Sušárna — mirror cooking redirect přesně (mlynar-vlastni-mlyn-mrd.md
        // §4.5, 16.8.2026). cat 'mat' + shoda v DRY_TYPES = přesměruj na
        // časovanej proces, jinak normální okamžitá cesta níž beze změny.
        if (r && r.cat === 'mat' && typeof DryingSystem !== 'undefined' && DryingSystem.DRY_TYPES && DryingSystem.DRY_TYPES[id]) {
            DryingSystem.startDrying(id);
            return;
        }
        if (!GameState.flags.fireplaceLit && !r.blind) { UI.notify(t('game.frozenHands'), true); return; }

        // Save hint tracking
        Game._saveHint.actions++;
        Game._checkSaveHint();
        if (typeof EventsSystem !== 'undefined') EventsSystem.onAction();
        if (typeof EventFeedScheduler !== 'undefined') EventFeedScheduler.onAction();

        // Vigor check — těžké recepty vyžadují Vigor >= 25, lehké >= 10
        if (typeof VigorSystem !== 'undefined') {
            if (!VigorSystem.canAct()) { UI.notify(t('game.vigor.exhausted'), true); return; }
            const heavyItems = ['vellum', 'codex_luxury', 'illuminated_page', 'vellum_codex', 'printing_type', 'ink_gallic'];
            const isHeavy = heavyItems.includes(r.output);
            const isLight = ['paper', 'ink', 'candle', 'candle_tallow', 'candle_wax', 'tinderbox', 'quill', 'tallow_candle'].includes(r.output);
            if (isHeavy && !VigorSystem.canHeavy()) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(lang === 'en'
                    ? '😵 Too exhausted for this task. Eat something first. (Vigor < 25)'
                    : '😵 Na tuto práci jsi příliš vyčerpán. Nejdříve se najez. (Vigor < 25)', true);
                return;
            }
            if (!isLight && !isHeavy && !VigorSystem.canLight()) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(lang === 'en'
                    ? '😔 Too tired for crafting. Rest or eat first. (Vigor < 10)'
                    : '😔 Jsi příliš unavený. Odpočiň si nebo se najez. (Vigor < 10)', true);
                return;
            }
        }

        // Gate: iron_ingot vyžaduje Fornax Ferraria
        if (r.id === 'iron_ingot') {
            if (!(GameState.storage && GameState.storage.fornax_ferraria && GameState.storage.fornax_ferraria.built)) {
                const _gl = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(_gl === 'en' ? '❌ Requires Fornax Ferraria (smelting furnace).' : '❌ Vyžaduje Fornax Ferraria (tavicí pec).', true);
                return;
            }
        }

        // Gate: bread_fine vyžaduje Furnus — SKUTEČNEJ gate žije v
        // CookingSystem.COOK_TYPES.bread_fine.needsBuild (pekarna-audit,
        // 30.8.2026). Tenhle check tady byl od 25.8.2026 mrtvej kód —
        // bread_fine je cat:"food" + má COOK_TYPES záznam, takže se
        // přesměruje na CookingSystem.startCooking() hned na začátku
        // craft() (viz výš), dřív než by sem vůbec došlo.

        // Gate: podkovy vyžadují Kovárnu a odpovídající tier (kovarna-dilna-mrd.md v0.5, 30.8.2026)
        if (r.id === 'repair_sada_podkov') {
            if (!(GameState.storage && GameState.storage.kovarna && GameState.storage.kovarna.built)) {
                const _gl = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(_gl === 'en' ? '❌ Requires the Kovárna (smithy).' : '❌ Vyžaduje Kovárnu.', true);
                return;
            }
        }
        if (r.id === 'sada_podkov') {
            const _tier = (GameState.storage && GameState.storage.kovarna && GameState.storage.kovarna.tier) || 0;
            if (_tier < 2) {
                const _gl = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(_gl === 'en' ? '❌ Requires Kovárna Tier 2.' : '❌ Vyžaduje Kovárnu, stupeň 2.', true);
                return;
            }
        }
        if (r.id === 'sada_podkov_premium') {
            const _tier = (GameState.storage && GameState.storage.kovarna && GameState.storage.kovarna.tier) || 0;
            if (_tier < 3) {
                const _gl = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(_gl === 'en' ? '❌ Requires Kovárna Tier 3.' : '❌ Vyžaduje Kovárnu, stupeň 3.', true);
                return;
            }
        }

        // Gate: JAKMILE Kovárna stojí, VŠECHNO kovářský kování (starejch 33
        // receptů + nový 3 podkovářský) potřebuje hořící pec — mirror
        // Foculus principu, ale samostatný stav (kovarna-dilna-mrd.md v0.6,
        // 30.8.2026). Před postavením Kovárny beze změny (Fabrica/tech_kovarina
        // jede jako dřív, žádnej fire-gate).
        let _usedKovarnaFire = false;
        if (r.cat === 'iron' && GameState.storage && GameState.storage.kovarna && GameState.storage.kovarna.built) {
            if (typeof CellariumSystem !== 'undefined') CellariumSystem._ensureKovarnaFurnace();
            const _furnace = GameState.storage.kovarna.furnace;
            const _gl = (GameState.settings && GameState.settings.language) || 'cs';
            if (!_furnace || _furnace.fuelMs <= 0) {
                UI.notify(_gl === 'en' ? '❌ The furnace has gone cold. Add fuel in the Kovárna.' : '❌ Pec vychladla. Přilož palivo v Kovárně.', true);
                return;
            }
            if (r.id === 'sada_podkov_premium' && _furnace.lastFuelType !== 'charcoal') {
                UI.notify(_gl === 'en' ? '❌ Premium work needs the furnace burning on charcoal.' : '❌ Prémiová práce potřebuje pec hořící na uhlí.', true);
                return;
            }
            _usedKovarnaFire = true;
        }

        // Gate: hostia (instant craft, ne CookingSystem) — jakmile Furnus
        // stojí, potřebuje taky hořící pec. Mirror Kovárna vzoru, jen bez
        // charcoal-only prémiový výjimky. pekarna-audit v2 (30.8.2026).
        if (r.id === 'hostia' && GameState.storage && GameState.storage.furnus && GameState.storage.furnus.built) {
            if (typeof CellariumSystem !== 'undefined') CellariumSystem._ensureFurnusFurnace();
            const _fFurnace = GameState.storage.furnus.furnace;
            const _gl2 = (GameState.settings && GameState.settings.language) || 'cs';
            if (!_fFurnace || _fFurnace.fuelMs <= 0) {
                UI.notify(_gl2 === 'en' ? '❌ The oven has gone cold. Add fuel in the Pekárna.' : '❌ Pec vychladla. Přilož palivo v Pekárně.', true);
                return;
            }
        }

        // maxStack check — iron nástroje max 1 ks (repair_ recepty vyjmuty, ty vlastnictví worn_ verze vyžadují)
        const outItem = ItemsDB[r.output];
        if (outItem && outItem.maxStack && !r.id.startsWith('repair_')) {
            const have = GameState.inventory[r.output] || 0;
            const worn = GameState.inventory['worn_' + r.output] || 0;
            if (have + worn >= outItem.maxStack) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(lang === 'en' ? '⚠️ You already have this tool.' : '⚠️ Tento nástroj již máš.', true);
                return;
            }
        }

        for (let [item, amt] of Object.entries(r.req)) {
            if (amt > 0 && (!GameState.inventory[item] || GameState.inventory[item] < amt)) { UI.notify(t('game.missingMats'), true); return; }
            if (amt === 0 && !GameState.inventory[item]) { UI.notify(`${t('game.required2')} ${iName(item)}`, true); return; }
        }

        // Alternativní nástroj (vlastníš-li kterýkoliv z uvedených) — stejný vzor jako Mine/Scavenge
        let _foundTool = null;
        if (r.toolReq) {
            _foundTool = r.toolReq.find(tr => (GameState.inventory[tr.item] > 0) || (GameState.inventory['worn_' + tr.item] > 0));
            if (!_foundTool) {
                UI.notify(`${t('game.needTool')} ${r.toolReq.map(tr => iName(tr.item)).join(' / ')}`, true);
                return;
            }
        }

        // ── RESEARCH: Vigor gate (před odebráním surovin) ───────────────────
        if (r.output === 'research') {
            if (typeof VigorSystem !== 'undefined' && !VigorSystem.canResearch()) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(lang === 'en'
                    ? '😵 Too tired to write. Eat something or rest first. (Vigor < 20)'
                    : '😵 Příliš unaven na psaní. Nejdříve se najedz nebo odpočiň. (Vigor < 20)', true);
                return;
            }
            // Křeč písařské ruky (monastery-decay-mrd) — ruka je příliš
            // rozklepaná na psaní Zápisků, dokud nemoc nepřejde/nevyléčí se.
            if (typeof HealthSystem !== 'undefined' && HealthSystem.isActive('writers_cramp')) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(lang === 'en'
                    ? '✍️ Your hand shakes too badly to write — writer\'s cramp.'
                    : '✍️ Ruka se ti třese příliš na psaní — křeč písařské ruky.', true);
                return;
            }
        }

        // abbot-persona-mrd (9.8.2026) — konečně zapojený tallowCostDiscount,
        // dřív jen dekorativní pilulka. Recepty mají pevné celočíselné qty
        // (fat:1/tallow:1), takže % sleva = % šance na vrácení té konkrétní
        // suroviny místo zlomkového snížení ceny.
        let _tallowDiscount = 0;
        // svitidla-mrd (16.8.2026) — candle_tallow patří do stejný podmínky,
        // spotřebovává tallow přesně jako torch_tallow.
        if ((r.output === 'candle' || r.output === 'torch_tallow' || r.output === 'candle_tallow') && typeof ChroniconSystem !== 'undefined' && ChroniconSystem.getBuffs) {
            _tallowDiscount = ChroniconSystem.getBuffs().tallowCostDiscount || 0;
        }
        for (let [item, amt] of Object.entries(r.req)) {
            if (amt <= 0) continue;
            if (_tallowDiscount > 0 && (item === 'fat' || item === 'tallow') && Math.random() < _tallowDiscount) continue; // vrácena zdarma
            InventoryManager.removeItem(item, amt);
        }
        if (_foundTool) InventoryManager.useToolCharge(_foundTool.item);

        // Voda na kalení — minimální spotřeba, jen když se kovalo u hořící
        // pece v Kovárně (kovarna-dilna-mrd.md v0.6, 30.8.2026). 1 voda po
        // každým 4. kovářským craftu, soft (bez vody = žádná penalizace,
        // jen se nespotřebuje).
        if (_usedKovarnaFire) {
            const _furnace = GameState.storage.kovarna.furnace;
            _furnace.craftCount = (_furnace.craftCount || 0) + 1;
            if (_furnace.craftCount >= 4) {
                _furnace.craftCount = 0;
                if ((GameState.inventory['water'] || 0) >= 1) InventoryManager.removeItem('water', 1);
            }
        }

        // Init toolUses pro nový nástroj
        if (outItem && outItem.maxUses) {
            if (!GameState.toolUses) GameState.toolUses = {};
            GameState.toolUses[r.output] = outItem.maxUses;
        }

        // ========== NEW: Apply canonical hours crafting buff ==========
        let craftQty = r.qty;
        if (typeof CanonicalHours !== 'undefined') {
            const mult = CanonicalHours.getCraftingSpeedMultiplier();
            if (mult > 1.0) {
                // Laudes (+25%): chance to craft extra item
                if (Math.random() < (mult - 1.0)) {
                    craftQty += 1;
                }
            }
        }
        // Professio: Scriptor (craft_speed) — stejný vzor, samostatná šance navíc
        if (typeof RankSystem !== 'undefined') {
            const roleMult = RankSystem.getActiveBonus('craft_speed');
            if (roleMult > 1.0 && Math.random() < (roleMult - 1.0)) craftQty += 1;
        }
        // Dýmka Flow state — dočasný bonus, stejný vzor jako Professio Scriptor
        if (GameState.flags && GameState.flags.dymkaEffectType === 'flow' && GameState.flags.dymkaEffectUntil && Date.now() < GameState.flags.dymkaEffectUntil) {
            if (Math.random() < 0.5) craftQty += 1;
        }
        // abbot-persona-mrd (9.8.2026) — konečně zapojený craftSuccessBonus,
        // dřív jen dekorativní pilulka. Stejný vzor jako Laudes/Professio výš.
        if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem.getBuffs) {
            const _csb = ChroniconSystem.getBuffs().craftSuccessBonus || 0;
            if (_csb > 0 && Math.random() < _csb) craftQty += 1;
        }

        // ── RESEARCH: diminishing returns ────────────────────────────────────
        if (r.output === 'research') {
            // abbot-persona-mrd (9.8.2026) — konečně zapojený scriptXpBonus,
            // dřív jen dekorativní pilulka. Aplikuje se PŘED diminishing
            // returns, ať se počítá do stejné hodinové kvóty jako zbytek.
            if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem.getBuffs) {
                const _sxb = ChroniconSystem.getBuffs().scriptXpBonus || 0;
                if (_sxb > 0 && Math.random() < _sxb) craftQty += 1;
            }
            if (!GameState.researchHour) GameState.researchHour = { count: 0, hourStart: 0 };
            const now = Date.now();
            const HOUR_MS = 60 * 60 * 1000;
            if (now - GameState.researchHour.hourStart >= HOUR_MS) {
                GameState.researchHour.count = 0;
                GameState.researchHour.hourStart = now;
            }
            GameState.researchHour.count += craftQty;
            const cnt = GameState.researchHour.count;
            if (cnt > 20) {
                craftQty = Math.max(1, Math.round(craftQty * 0.25));
            } else if (cnt > 10) {
                craftQty = Math.max(1, Math.round(craftQty * 0.5));
            }
        }

        // ── KRONIKA: denní craft buffer ──
        if (!GameState.kronikaCraftBuffer) GameState.kronikaCraftBuffer = { date: '', crafts: {} };
        const _todayCraft = new Date().toISOString().slice(0, 10);
        if (GameState.kronikaCraftBuffer.date !== _todayCraft) {
            Game.kronikaCraftFlushBuffer();
            GameState.kronikaCraftBuffer.date = _todayCraft;
        }
        GameState.kronikaCraftBuffer.crafts[r.output] = (GameState.kronikaCraftBuffer.crafts[r.output] || 0) + craftQty;
        // ── KRONIKA: první craft ──
        if (!GameState.craftedItems) GameState.craftedItems = {};
        const _firstCraft = !GameState.craftedItems[r.output];
        GameState.craftedItems[r.output] = (GameState.craftedItems[r.output] || 0) + craftQty;
        if (_firstCraft) {
            const _fci = ItemsDB[r.output];
            const _fcn = _fci ? _fci.name : r.output;
            const _fcne = _fci ? (_fci.name_en || _fci.name) : r.output;
            Game.addKronikaEntry('important', `⚒️ Poprvé vyrobeno: ${_fcn}`, `⚒️ Crafted for the first time: ${_fcne}`, `⚒️ Primo factum: ${_fcn}`);
        }
        InventoryManager.addItem(r.output, craftQty);
        // coquina-kotlik-mrd (9.8.2026): tier tracking pro Kotlík — jen
        // vizuál/popisky (viz CoquinaVisuals.ohniste), nedotýká se
        // cooking_pot:0 kontroly v žádném z ~40 receptů, co ji vyžadují.
        if (r.id === 'cooking_pot') GameState.cookingPotTier = 1;
        else if (r.id === 'vycistit_kotlik') GameState.cookingPotTier = 2;
        else if (r.id === 'bronzovy_kotlik') GameState.cookingPotTier = 3;
        if (typeof UI !== 'undefined' && UI.spawnFloatingGain) UI.spawnFloatingGain(r.id, craftQty);
        // coquina-vyroba-modal-mrd (7.8.2026): Výroba beze změny chování
        // (pořád okamžité), jen informativní odkaz do Vaření pro cat:"food".
        if (r.cat === 'food' && typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const outName = (typeof iName === 'function') ? iName(r.output) : r.output;
            NotificationSystem.modal({
                icon: '🍲',
                title: lang === 'en' ? 'Cooked' : 'Uvařeno',
                text: lang === 'en' ? `${outName} is ready. See it alongside other kitchen work in Cooking.` : `${outName} je hotové. Sleduj to spolu s ostatní kuchyní v tabu Vaření.`,
                choices: [
                    {
                        label: lang === 'en' ? 'Go to Cooking' : 'Do Vaření', type: 'primary',
                        effect: function () { if (typeof UI !== 'undefined' && UI.switchHomeSubTab) UI.switchHomeSubTab('cooking', document.getElementById('home-sub-cooking')); }
                    },
                    { label: lang === 'en' ? 'Continue' : 'Pokračovat', type: 'default', effect: function () { } },
                ],
            });
        }

        // Vigor — přidat Fatigue dle výstupu
        if (typeof VigorSystem !== 'undefined') VigorSystem.onCraft(r.output);
        // Byproduct — vedlejší produkt receptu (např. stloukání másla → podmáslí)
        if (r.byproduct && r.byproduct.id) {
            InventoryManager.addItem(r.byproduct.id, r.byproduct.qty || 1);
            UI.notify('➕ ' + ((typeof iName === 'function') ? iName(r.byproduct.id) : r.byproduct.id) + ' ×' + (r.byproduct.qty || 1));
        }
        // Caseus — registrace per-instance zrání pro nově vyrobený sýr
        if (typeof CheeseSystem !== 'undefined') {
            const _cheeseBase = { goat_cheese: 'goat_cheese', sheep_cheese: 'sheep_cheese', cow_cheese: 'cow_cheese', syrecky: 'syrecky' }[r.id];
            if (_cheeseBase) {
                for (let _ci = 0; _ci < craftQty; _ci++) CheeseSystem.registerInstance(_cheeseBase);
            }
        }
        // Calcaria — registrace per-instance zrání pro nově vypálené/hašené vápno
        if (typeof LimeSystem !== 'undefined') {
            const _limeBase = { burn_lime: 'vapno_paleny', slake_lime: 'vapno_hasene' }[r.id];
            if (_limeBase) {
                for (let _li = 0; _li < craftQty; _li++) LimeSystem.registerInstance(_limeBase);
            }
        }
        // Analytics – zaznamenej craft
        const craftedItem = ItemsDB[r.output];
        if (craftedItem) Analytics.itemCrafted(r.output, craftedItem.name, craftedItem.type);
        // Speciálně pro research
        if (r.output === 'research') {
            Analytics.researchCrafted((GameState.inventory['research'] || 0) + craftQty);
        }

        // 👿 TITIVILLUS – démon překlepů
        // Sbírá chyby z lore itemů (papír, inkoust, zápisky)
        // Vyšší šance v noci bez světla; Professio Scriptor (craft_errors) sanci snižuje
        if (['paper', 'ink', 'research'].includes(r.output)) {
            const isNight = !TimeSys.isDaytime();
            const noLight = !GameState.flags.candleLit && !GameState.flags.torchLit;
            const roleErrMult = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('craft_errors') : 1.0;
            const chance = ((isNight && noLight) ? 0.08 : 0.03) * roleErrMult;
            if (Math.random() < chance) {
                InventoryManager.removeItem(r.output, r.qty); // ukradne výstup
                Analytics.titivillusStruck(r.output, isNight && noLight);
                // Cesta A (Bestiář): první setkání s Titivillem rovnou odemkne
                // jeho záznam ve Scriniu. unlockFolioById() je idempotentní
                // (no-op, pokud už nalezeno) — bezpečné volat při každém strike.
                if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_titivillus_bestiar');
                const quotes = t('titivillus');
                UI.notify(quotes[Math.floor(Math.random() * quotes.length)], true);
                // Křeč písařské ruky (monastery-decay-mrd) — Titivillus, když
                // ukradne Zápisek (research) konkrétně, občas zanechá i křeč
                // v ruce, ne jen ztrátu výstupu. Nízká šance, jen u research.
                if (r.output === 'research' && typeof HealthSystem !== 'undefined'
                    && !HealthSystem.isActive('writers_cramp') && Math.random() < 0.15) {
                    HealthSystem.addCondition('writers_cramp');
                }
                Game.save(); UI.renderAll();
                return;
            }
        }

        // ── KRONIKA: důležité crafty ──
        const _kronikaImportantCrafts = ['manuscript', 'illuminated_manuscript', 'bible', 'psalter'];
        if (_kronikaImportantCrafts.includes(r.output)) {
            const _ci = ItemsDB[r.output];
            const _cn = _ci ? _ci.name : r.output;
            const _cne = _ci ? (_ci.name_en || _ci.name) : r.output;
            Game.addKronikaEntry('important',
                `Vyrobeno: ${craftQty}× ${_cn}`,
                `Crafted: ${craftQty}× ${_cne}`,
                `Factum: ${craftQty}× ${_cn}`
            );
        }
        Game.save();
        UI.renderAll();
    },
    study: function (id) {
        const tech = TechTree.find(x => x.id === id);
        if (typeof VigorSystem !== 'undefined' && !VigorSystem.canResearch()) { UI.notify(t('game.vigor.researchBlock'), true); return; }
        if ((GameState.inventory['research'] || 0) < tech.cost) { UI.notify(t('game.notEnoughResearch'), true); return; }

        // NOVÉ: kniha jako prerekvizita výzkumu
        if (tech.requiresBook) {
            const hasRead = GameState.library && GameState.library.readBooks && GameState.library.readBooks.includes(tech.requiresBook);
            if (!hasRead) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(lang === 'en' ? '📖 You must first read the required book.' : '📖 Nejprve musíš přečíst potřebný spis.', true);
                return;
            }
        }

        // Save hint tracking (research = important action)
        Game._saveHint.actions += 5;
        Game._checkSaveHint();

        // Check if requires other tech
        if (tech.requires) {
            const missing = tech.requires.find(req => !GameState.researchedTechs.includes(req));
            if (missing) {
                const reqTech = TechTree.find(x => x.id === missing);
                UI.notify(`${t('game.techRequired')} ${reqTech.name}`, true);
                return;
            }
        }

        InventoryManager.removeItem('research', tech.cost); GameState.researchedTechs.push(id);
        Game.addKronikaEntry('important',
            `Poznáno: ${tech.name}`,
            `Discovered: ${tech.name_en || tech.name}`,
            `Cognitum: ${tech.name}`
        );
        tech.unlocks.forEach(rid => {
            if (!GameState.unlockedRecipes.includes(rid)) {
                GameState.unlockedRecipes.push(rid);
                const _rdb = typeof RecipesDB !== 'undefined' ? RecipesDB.find(x => x.id === rid) : null;
                const _rout = _rdb ? _rdb.output : rid;
                const _ri = ItemsDB && ItemsDB[_rout] ? ItemsDB[_rout] : null;
                if (!_ri) return; // přeskočit — recipe bez položky v ItemsDB (UI prvky, systémové recepty)
                const _rn = _ri.name;
                const _rne = _ri.name_en || _ri.name;
                Game.addKronikaEntry('important', `📋 Nová receptura: ${_rn}`, `📋 New recipe: ${_rne}`, `📋 Nova formula: ${_rn}`);
            }
        });
        Analytics.techUnlocked(id, tech.name, tech.cost);

        // Special unlocks
        if (id === 'tech_garden_expand') {
            // Odemkne herb sloty 2-3
            if (GameState.garden[2]) GameState.garden[2].locked = false;
            if (GameState.garden[3]) GameState.garden[3].locked = false;
        }
        if (id === 'tech_horticulture') {
            // Odemkne 4x vegetable + 2x special (sloty 4-9)
            for (let i = 4; i <= 9; i++) { if (GameState.garden[i]) GameState.garden[i].locked = false; }
        }
        if (id === 'tech_advanced_farming') {
            // Odemkne 4x vegetable navíc (sloty 10-13)
            for (let i = 10; i <= 13; i++) { if (GameState.garden[i]) GameState.garden[i].locked = false; }
        }
        if (id === 'tech_porta') {
            // Odemkne Dvůr subtab Columbarium (flag-gated, ne tech-gated přímo)
            if (!GameState.flags) GameState.flags = {};
            GameState.flags.columbarium_available = true;
            // Reverse-unlock — tech odemyká knihy (opačný směr než obvykle: kniha→tech)
            if (!GameState.library) GameState.library = { startDate: Date.now(), unlockedBooks: [], readBooks: [], scribeState: { visited: false, totalTrades: 0, lastTrade: 0, lastTopicAt: 0, askedTopics: [] } };
            if (!GameState.library.unlockedBooks) GameState.library.unlockedBooks = [];
            ['book_palladius_columbaria', 'book_barid_columbinus'].forEach(bid => {
                if (!GameState.library.unlockedBooks.includes(bid)) GameState.library.unlockedBooks.push(bid);
            });
        }

        const _slang = (GameState.settings && GameState.settings.language) || 'cs';
        UI.notifyPanel(`📜 ${t('game.crafted')} ${_slang === 'en' ? (tech.name_en || tech.name) : tech.name}`, 'system');

        // Vigor: research stojí fatigue + hlad dle obtížnosti techu
        if (typeof VigorSystem !== 'undefined') {
            const fatigueCost = tech.cost <= 6
                ? tech.cost * 0.5
                : Math.min(tech.cost * 0.7, 30);
            const satietyCost = tech.cost * 0.4;
            VigorSystem.addFatigue(fatigueCost);
            GameState.satiety = Math.max(0, (GameState.satiety || 80) - satietyCost);
            VigorSystem.renderPill();
        }

        Game.save(); UI.renderAll(); Game.checkEnvironment();
        Game.checkAchievements();

        // Ukázka písma pokud existuje pro tuto technologii
        const spec = typeof FontSpecimensDB !== 'undefined' && FontSpecimensDB.techs[id];
        if (spec) {
            setTimeout(() => UI.showFontSpecimenModal(tech.name, spec), 600);
        }
    },
    eat: function (foodId) {
        const item = ItemsDB[foodId];
        const _potionCures = ['antidote', 'potion_heal', 'sleep_potion', 'stamina_tonic', 'unguentum_calidum', 'cannabis_poultice', 'odvar_z_dubenek', 'mast_ze_lneneho_oleje', 'odvar_z_vrby', 'elixir_purgationis'];
        const _isPotionCure = _potionCures.includes(foodId);
        // Syrové ovoce/zelenina (food_raw), co lze sníst přímo — viz VigorSystem.RAW_EDIBLE_FOOD
        const _isRawEdible = (typeof VigorSystem !== 'undefined' && VigorSystem.RAW_EDIBLE_FOOD && VigorSystem.RAW_EDIBLE_FOOD.includes(foodId));
        if (!item || (item.type !== 'food' && !_isPotionCure && !_isRawEdible)) { UI.notify(t('game.notFood'), true); return; }
        if (!(GameState.inventory[foodId] > 0)) { UI.notify(t('game.noFood'), true); return; }

        // B6 smart no-op guard (eating-noop-guard-spec-25-8-2026, schváleno
        // 9.8.2026) — jen za tech_mensura_ciborum. Blokuje JEN plain food
        // bez vedlejšího efektu, když je satiety už na stropu. Záporný
        // FOOD_FATIGUE (stew/tisane) guard neblokuje — ten efekt platí i
        // při plné sytosti. _isPotionCure/_isRawEdible mimo scope.
        if (item.type === 'food' && !_isRawEdible && typeof VigorSystem !== 'undefined'
            && GameState.researchedTechs && GameState.researchedTechs.includes('tech_mensura_ciborum')) {
            const atCap = (GameState.satiety || 0) >= VigorSystem.MAX_SATIETY;
            const fatChange = VigorSystem.FOOD_FATIGUE[foodId] || 0;
            if (atCap && fatChange >= 0) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(lang === 'en' ? 'Already full — this would do nothing.' : 'Už jsi sytý — tohle by nic nezměnilo.', true);
                return;
            }
        }

        InventoryManager.removeItem(foodId, 1);

        // Vigor systém v2 — VigorSystem.eat() zpracuje Satiety + Fatigue ('food' i syrové jedlé položky)
        if ((item.type === 'food' || _isRawEdible) && typeof VigorSystem !== 'undefined') {
            VigorSystem.eat(foodId);
        }

        // Pivo/víno — speciální "chuťovka" (flavor + u vína Athanor craft-boost).
        // Přesunuto sem z Cellarium buyItem() — dřív se spouštělo už při
        // NÁKUPU, takže item zůstal v inventáři a efekt se aplikoval zadarmo
        // navíc. Teď se aplikuje jen při skutečné konzumaci.
        if ((foodId === 'beer' || foodId === 'wine') && typeof CellariumSystem !== 'undefined' && CellariumSystem.applyDrinkEffect) {
            CellariumSystem.applyDrinkEffect(foodId);
        }

        // Valetudo — pokud item léčí aktivní neduh, vyléčit; jinak (u lektvarů) baseline efekt
        if (typeof HealthSystem !== 'undefined') {
            const _cured = HealthSystem.cureWith(foodId);
            if (!_cured && _isPotionCure) {
                if (foodId === 'antidote') HealthSystem._applyDelta(5, 0);
                else if (foodId === 'potion_heal') HealthSystem._applyDelta(0, -10);
                else if (foodId === 'sleep_potion') HealthSystem._applyDelta(0, -20);
                else if (foodId === 'stamina_tonic') HealthSystem._applyDelta(5, -15);
            }
        }

        // Track meals eaten
        if (GameState.achievements && GameState.achievements.stats) {
            GameState.achievements.stats.mealsEaten = (GameState.achievements.stats.mealsEaten || 0) + 1;
        }

        Game.save();
        UI.renderAll();
    },

    // Pití vody (water = mat type, proto vlastní funkce)
    drink: function (itemId) {
        const drinkable = ['water', 'spring_water', 'holy_water'];
        if (!drinkable.includes(itemId)) { UI.notify(t('game.notFood'), true); return; }
        if (!(GameState.inventory[itemId] > 0)) { UI.notify(t('game.noFood'), true); return; }
        InventoryManager.removeItem(itemId, 1);
        if (typeof VigorSystem !== 'undefined') VigorSystem.eat(itemId);
        // Nekvalitní voda (2. třída/venkovní) — malá šance na nevolnost (Valetudo)
        if (itemId === 'water' && typeof HealthSystem !== 'undefined' && !HealthSystem.isActive('water_sickness') && Math.random() < 0.01) {
            HealthSystem.addCondition('water_sickness');
        }
        // Úplavice — vzácnější, závažnější varianta (monastery-decay-mrd)
        if (itemId === 'water' && typeof HealthSystem !== 'undefined' && !HealthSystem.isActive('dysentery') && Math.random() < 0.004) {
            HealthSystem.addCondition('dysentery');
        }
        Game.save();
        UI.renderAll();
    },

    checkDailyReward: function () {
        const now = Date.now();
        const today = new Date(now).setHours(0, 0, 0, 0);
        const lastLoginDay = new Date(GameState.dailyRewards.lastLogin).setHours(0, 0, 0, 0);
        const daysSinceLastLogin = Math.floor((today - lastLoginDay) / (24 * 60 * 60 * 1000));

        // Skip if already claimed today
        const lastClaimDay = new Date(GameState.dailyRewards.lastBonusClaimed).setHours(0, 0, 0, 0);
        if (today === lastClaimDay) {
            return; // Already claimed today
        }

        // Update login tracking
        GameState.dailyRewards.lastLogin = now;
        GameState.dailyRewards.totalLogins++;

        // Daily stats tracking
        if (GameState.achievements) {
            if (GameState.flags.fireplaceLit) {
                GameState.achievements.stats.daysWithFire++;
            }
            // Vigor v2: "fed" = Vigor >= 25
            if (typeof VigorSystem !== 'undefined' && VigorSystem.getVigor() >= 25) {
                GameState.achievements.stats.daysWithoutHunger++;
            } else {
                GameState.achievements.stats.daysWithoutHunger = 0;
            }
        }

        // Update streak
        if (daysSinceLastLogin === 1) {
            // Consecutive day
            GameState.dailyRewards.streak++;
        } else if (daysSinceLastLogin > 1) {
            // Streak broken
            GameState.dailyRewards.streak = 1;
        } else if (daysSinceLastLogin === 0 && GameState.dailyRewards.streak === 0) {
            // First ever login
            GameState.dailyRewards.streak = 1;
        }

        // ── DAILY REWARD SYSTEM v2 ───────────────────────────────────────────────
        const streak = GameState.dailyRewards.streak;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        let bonusText = '';
        let streakBonus = false;
        const rewards = [];

        // Milníky — override cyklu
        if (streak === 100) {
            rewards.push({ item: 'research', qty: 10 }, { item: 'vellum', qty: 1 });
            bonusText = lang === 'en' ? '+10 Research + Vellum (100 days!) — "The Chronicler writes your name. Not as a visitor — as a brother."'
                : '+10 Zápisků + Pergamen (100 dní!) — "Kronikář zapíše tvé jméno. Ne jako hosta — jako bratra."';
            streakBonus = true;
        } else if (streak === 60) {
            const pool = ['lapis_lazuli', 'cinnabar'];
            const rare = pool[Math.floor(Math.random() * pool.length)];
            rewards.push({ item: 'research', qty: 5 }, { item: rare, qty: 1 });
            bonusText = lang === 'en' ? '+5 Research + rare find (60 days!) — "The Elder Scribe comes with a small pouch."'
                : '+5 Zápisků + vzácná surovina (60 dní!) — "Starý Písař přichází s váčkem."';
            streakBonus = true;
        } else if (streak === 30) {
            rewards.push({ item: 'research', qty: 5 }, { item: 'candle', qty: 1 });
            bonusText = lang === 'en' ? '+5 Research + Candle (30 days!) — "The Abbot has taken notice."'
                : '+5 Zápisků + Svíčka (30 dní!) — "Měsíc věrnosti. Opat si tě všiml."';
            streakBonus = true;
        } else if (streak === 14) {
            rewards.push({ item: 'research', qty: 2 }, { item: 'paper', qty: 1 }, { item: 'candle', qty: 1 });
            bonusText = lang === 'en' ? '+2 Research + Paper + Candle (14 days!) — "The manuscript takes shape."'
                : '+2 Zápisky + Papír + Svíčka (14 dní!) — "Rukopis se začíná rýsovat."';
            streakBonus = true;
        } else {
            // Cyklus dní 1–7 (opakuje se mezi milníky)
            const cycleDay = ((streak - 1) % 7) + 1;
            if (cycleDay === 1) {
                bonusText = lang === 'en' ? '"First day in the cycle. Be silent and observe."'
                    : '"Mlč a pozoruj. Dnes pero odpočívá."';
            } else if (cycleDay === 2) {
                rewards.push({ item: 'paper', qty: 1 });
                bonusText = lang === 'en' ? '+1 Paper — "You found a sheet behind the altar."'
                    : '+1 Papír — "Nalezl jsi arch za oltářem."';
            } else if (cycleDay === 3) {
                if (Math.random() < 0.5) { rewards.push({ item: 'paper', qty: 1 }); bonusText = lang === 'en' ? '+1 Paper' : '+1 Papír'; }
                else { rewards.push({ item: 'ink', qty: 1 }); bonusText = lang === 'en' ? '+1 Ink' : '+1 Inkoust'; }
                bonusText += lang === 'en' ? ' — "The Elder Scribe left something on the lectern."'
                    : ' — "Starý Písař něco nechal na pulpitu."';
            } else if (cycleDay === 4) {
                rewards.push({ item: 'research', qty: 1 });
                bonusText = lang === 'en' ? '+1 Research — "A quiet hour for study."'
                    : '+1 Zápisek — "Tichá hodina ke studiu."';
            } else if (cycleDay === 5) {
                rewards.push({ item: 'paper', qty: 1 });
                bonusText = lang === 'en' ? '+1 Paper — "The papermaker was generous."'
                    : '+1 Papír — "Papírník byl štědrý."';
            } else if (cycleDay === 6) {
                const r = Math.random();
                if (r < 0.34) { rewards.push({ item: 'paper', qty: 1 }); bonusText = lang === 'en' ? '+1 Paper' : '+1 Papír'; }
                else if (r < 0.67) { rewards.push({ item: 'ink', qty: 1 }); bonusText = lang === 'en' ? '+1 Ink' : '+1 Inkoust'; }
                else { rewards.push({ item: 'research', qty: 1 }); bonusText = lang === 'en' ? '+1 Research' : '+1 Zápisek'; }
                bonusText += lang === 'en' ? ' — "A good day at the desk."'
                    : ' — "Dobrý den u pultu."';
            } else { // cycleDay === 7
                rewards.push({ item: 'research', qty: 1 }, { item: 'paper', qty: 1 });
                bonusText = lang === 'en' ? '+1 Research +1 Paper — "A week of faithful work."'
                    : '+1 Zápisek +1 Papír — "Týden věrné práce."';
            }
        }

        // Canonical hours buff — jen na research složku
        let canonMult = 1;
        if (typeof CanonicalHours !== 'undefined') canonMult = CanonicalHours.getResearchMultiplier();
        rewards.forEach(r => {
            let qty = r.qty;
            if (r.item === 'research' && canonMult !== 1) qty = Math.floor(qty * canonMult);
            if (qty > 0) InventoryManager.addItem(r.item, qty);
        });
        GameState.dailyRewards.lastBonusClaimed = now;

        // Get daily fact
        const factIndex = GameState.dailyRewards.totalLogins % DailyFactsDB.length;
        const factObj = DailyFactsDB[factIndex];

        // Support CS/EN structure
        const currentLang = (GameState.settings && GameState.settings.language) || 'cs';
        const fact = (typeof factObj === 'object')
            ? (currentLang === 'en' ? factObj.en : factObj.cs)
            : factObj; // Fallback pro starý formát (plain string)

        // Show modal
        UI.showDailyRewardModal(bonusText, GameState.dailyRewards.streak, fact, streakBonus);
        // Panel záznam — persistent reference
        if (typeof NotificationSystem !== 'undefined') {
            const _dlang = (GameState.settings && GameState.settings.language) || 'cs';
            NotificationSystem.panel('🎁 ' + (_dlang === 'en' ? 'Daily reward: ' : 'Denní odměna: ') + bonusText + ' · streak: ' + GameState.dailyRewards.streak, 'system');
        }
        UI.updateStreak();
        Analytics.dailyRewardClaimed(GameState.dailyRewards.streak);
        Analytics.sessionStart(GameState.dailyRewards.totalLogins, daysSinceLastLogin);

        Game.save();
        Game.checkAchievements();
        Game.checkAnimalFeeding();
    },
    checkAchievements: function () {
        if (!GameState.achievements) return;

        let newUnlocks = [];

        AchievementsDB.forEach(ach => {
            // Skip if already unlocked
            if (GameState.achievements.unlocked.includes(ach.id)) return;

            // Check condition
            if (ach.condition()) {
                GameState.achievements.unlocked.push(ach.id);
                newUnlocks.push(ach);

                // Grant reward
                if (ach.reward.research) {
                    InventoryManager.addItem('research', ach.reward.research);
                }
            }
        });

        // Show notifications — přeskočit při prvním spuštění (jazyk ještě není zvolen)
        if (newUnlocks.length > 0 && !GameState.flags.firstVisit) {
            newUnlocks.forEach(ach => {
                setTimeout(() => {
                    const _alang = (GameState.settings && GameState.settings.language) || 'cs';
                    const _an = _alang === 'en' ? (ach.name_en || ach.name) : ach.name;
                    UI.notifyPanel(`🏆 Achievement: ${_an}!`, 'system');
                    Analytics.achievementUnlocked(ach.id, ach.name);
                    Game.addKronikaEntry('important', `🏆 Dosaženo: ${ach.name}`, `🏆 Achievement: ${_an}`, `🏆 Factum est: ${ach.name}`);
                }, 300);
            });

            Game.save();
            UI.renderAll();
        }

        // Check Library Easter Eggs
        if (typeof LibraryHelpers !== 'undefined') {
            LibraryHelpers.checkEasterEggs();
        }
    },

    // === WELL SYSTEM === (PŘIDAT před poslední } objektu Game)

    // ─── KRMNÝ SYSTÉM ──────────────────────────────────────────────────────────
    checkAnimalFeeding: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        if (!GameState.feeding) GameState.feeding = {};
        // Krmení aktivuje až Horreum (sýpka skladuje krmivo) — do té doby se zvířata pasou sama
        if (!(GameState.storage && GameState.storage.horreum && GameState.storage.horreum.built)) return;
        const animals = [
            { key: 'henhouse', built: GameState.henhouse && GameState.henhouse.built && GameState.henhouse.hens && GameState.henhouse.hens.length > 0, feedChain: ['grain', 'feed_meal'], feedAmt: 1, name: lang === 'en' ? 'Hens' : 'Slepice', v2: true },
            { key: 'sheepfold', built: GameState.sheepfold && GameState.sheepfold.built && GameState.sheepfold.sheep && GameState.sheepfold.sheep.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang === 'en' ? 'Sheep' : 'Ovce', v2: true },
            { key: 'piscina', built: GameState.piscina && GameState.piscina.tier > 0, feedChain: ['worms'], feedAmt: 1, name: lang === 'en' ? 'Fish' : 'Ryby', v2: false },
            { key: 'rabbitry', built: GameState.rabbitry && GameState.rabbitry.built && GameState.rabbitry.animals && GameState.rabbitry.animals.length > 0, feedChain: ['scraps', 'hay'], feedAmt: 1, name: lang === 'en' ? 'Rabbits' : 'Králíci', v2: true },
            { key: 'goatpen', built: GameState.goatpen && GameState.goatpen.built && GameState.goatpen.animals && GameState.goatpen.animals.length > 0, feedChain: ['hay', 'scraps', 'feed_meal'], feedAmt: 1, name: lang === 'en' ? 'Goats' : 'Kozy', v2: true },
            { key: 'cowbyre', built: GameState.cowbyre && GameState.cowbyre.built && GameState.cowbyre.animals && GameState.cowbyre.animals.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang === 'en' ? 'Cattle' : 'Skot', v2: true },
            { key: 'pigsty', built: GameState.pigsty && GameState.pigsty.built && GameState.pigsty.animals && GameState.pigsty.animals.length > 0, feedChain: ['scraps', 'feed_meal', 'grain', 'hay'], feedAmt: 2, name: lang === 'en' ? 'Pigs' : 'Prasata', v2: true },
        ];
        animals.forEach(a => {
            if (!a.built) return;

            if (a.v2) {
                // v2: hlad se počítá z GameState[pen].lastFedAt přes FarmyardSystem.getMood() —
                // stejné pole jako u manuálního Feed tlačítka. Žádný samostatný hunger counter.
                const hoursSinceFed = (now - (GameState[a.key].lastFedAt || 0)) / 3600000;
                if (hoursSinceFed < 24) return;
                const useFeed = a.feedChain.find(f => (GameState.inventory[f] || 0) >= a.feedAmt);
                if (useFeed) {
                    Game.removeItem(useFeed, a.feedAmt);
                    GameState[a.key].lastFedAt = now;
                    UI.notify(lang === 'en' ? a.name + ' fed automatically.' : a.name + ' nakrmeny automaticky.');
                    if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                        NotificationSystem.panel('🌾 ' + (lang === 'en' ? a.name + ' fed automatically (' + useFeed + ').' : a.name + ' automaticky nakrmeny (' + useFeed + ').'), 'system');
                    }
                    Game.addKronikaEntry('minor',
                        '🌾 ' + a.name + ' automaticky nakrmeny (' + useFeed + ').',
                        '🌾 ' + a.name + ' fed automatically (' + useFeed + ').',
                        '🌾 Animalia pasta sunt.');
                } else {
                    UI.notify((lang === 'en' ? a.name + ' hungry! No ' + a.feedChain[0] + ' in Horreum.' : a.name + ' hladoví! Chybí ' + a.feedChain[0] + ' v sýpce.'), true);
                    if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                        NotificationSystem.panel('⚠️ ' + (lang === 'en' ? a.name + ' hungry — no ' + a.feedChain[0] + '.' : a.name + ' hladoví — chybí ' + a.feedChain[0] + '.'), 'warning');
                    }
                    Game.addKronikaEntry('warning', a.name + ' hladovi — chybi ' + a.feedChain[0] + '.', a.name + ' hungry — no ' + a.feedChain[0] + '.', a.name + ' esuriunt.');
                }
                return;
            }

            // mimo v2 (piscina) — beze změny, starý GameState.feeding tracker
            if (!GameState.feeding[a.key]) GameState.feeding[a.key] = { lastFed: now, hunger: 0 };
            const hoursSinceFed = (now - GameState.feeding[a.key].lastFed) / 3600000;
            if (hoursSinceFed >= 24) {
                // Vyzkoušej krmiva v pořadí preference — první dostupné se spotřebuje
                const useFeed = a.feedChain.find(f => (GameState.inventory[f] || 0) >= a.feedAmt);
                if (useFeed) {
                    Game.removeItem(useFeed, a.feedAmt);
                    GameState.feeding[a.key].lastFed = now;
                    GameState.feeding[a.key].hunger = 0;
                    UI.notify(lang === 'en' ? a.name + ' fed automatically.' : a.name + ' nakrmeny automaticky.');
                    if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                        NotificationSystem.panel('🌾 ' + (lang === 'en' ? a.name + ' fed automatically (' + useFeed + ').' : a.name + ' automaticky nakrmeny (' + useFeed + ').'), 'system');
                    }
                    Game.addKronikaEntry('minor',
                        '🌾 ' + a.name + ' automaticky nakrmeny (' + useFeed + ').',
                        '🌾 ' + a.name + ' fed automatically (' + useFeed + ').',
                        '🌾 Animalia pasta sunt.');
                } else {
                    GameState.feeding[a.key].hunger = Math.min(3, (GameState.feeding[a.key].hunger || 0) + 1);
                    const penalty = GameState.feeding[a.key].hunger >= 3 ? 75 : GameState.feeding[a.key].hunger >= 2 ? 50 : 25;
                    UI.notify((lang === 'en' ? a.name + ' hungry! Production -' : a.name + ' hladovi! Produkce -') + penalty + '%', true);
                    if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                        NotificationSystem.panel('⚠️ ' + (lang === 'en' ? a.name + ' hungry — no ' + a.feedChain[0] + '. Production -' + penalty + '%.' : a.name + ' hladoví — chybí ' + a.feedChain[0] + '. Produkce -' + penalty + '%.'), 'warning');
                    }
                    Game.addKronikaEntry('warning', a.name + ' hladovi — chybi ' + a.feedChain[0] + '.', a.name + ' hungry — no ' + a.feedChain[0] + '.', a.name + ' esuriunt.');
                }
            }
        });
        Game.save();
    },

    // ─── TOOL USES SYSTÉM ──────────────────────────────────────────────────────
    useToolCharge: function (itemId) {
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
                InventoryManager.removeItem(itemId, 1);
                delete GameState.toolUses[itemId];
                UI.notify((lang === 'en' ? '💀 ' + name + ' destroyed beyond repair.' : '💀 ' + name + ' — nenávratně zničena.'), true);
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.panel((lang === 'en' ? '💀 ' + name + ' destroyed. Craft new tools.' : '💀 ' + name + ' zničena. Vykov nové nástroje.'), 'warning');
                }
            } else if (item.tier === 'iron' && ItemsDB[wornId]) {
                // Iron → degradace na worn
                InventoryManager.removeItem(itemId, 1);
                InventoryManager.addItem(wornId, 1);
                delete GameState.toolUses[itemId];
                UI.notify((lang === 'en' ? name + ' worn out — repair it.' : name + ' se opotřebovala — oprav ji.'), true);
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.panel((lang === 'en' ? '🔧 ' + name + ' worn out. Needs repair.' : '🔧 ' + name + ' opotřebována. Potřebuje opravu.'), 'system');
                }
            } else {
                // Stone → smazat
                InventoryManager.removeItem(itemId, 1);
                delete GameState.toolUses[itemId];
                UI.notify((lang === 'en' ? name + ' broke.' : name + ' se zlomila.'), true);
            }
        } else if (remaining > 0) {
            if (itemId.startsWith('worn_') && item.tier === 'iron') {
                // Worn nástroj — varování při každém použití
                UI.notify((lang === 'en'
                    ? '⚠️ ' + name + ': ' + remaining + ' use(s) before destruction!'
                    : '⚠️ ' + name + ': ještě ' + remaining + '× než se zničí!'), true);
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.panel((lang === 'en'
                        ? '⚠️ ' + name + ': ' + remaining + ' use(s) left — repair or replace!'
                        : '⚠️ ' + name + ': zbývají ' + remaining + ' použití — oprav nebo vykov nové!'), 'warning');
                }
            } else if (remaining === 3) {
                // Varování před koncem pro normální nástroje
                UI.notify((lang === 'en' ? '⚠️ ' + name + ': ' + remaining + ' uses left.' : '⚠️ ' + name + ': zbývají ' + remaining + ' použití.'));
            }
        }
    },

    buildStorage: function (type) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.storage) GameState.storage = { almarium: { built: false }, cella: { built: false }, horreum: { built: false }, fabrica: { built: false }, sulci: { built: false }, humno: { built: false } };
        if (!GameState.storage.fabrica) GameState.storage.fabrica = { built: false };
        if (!GameState.storage.sulci) GameState.storage.sulci = { built: false };
        if (!GameState.storage.humno) GameState.storage.humno = { built: false };
        if (!GameState.storage.vinea) GameState.storage.vinea = { built: false };
        if (!GameState.storage.prelum) GameState.storage.prelum = { built: false };
        if (!GameState.storage.cella_fermentaria) GameState.storage.cella_fermentaria = { built: false };
        if (!GameState.storage.foudres) GameState.storage.foudres = { built: false };
        if (!GameState.storage.cellarium_vini) GameState.storage.cellarium_vini = { built: false };
        if (!GameState.storage.uvarium) GameState.storage.uvarium = { built: false };
        if (!GameState.storage.prelum_olei) GameState.storage.prelum_olei = { built: false };
        if (!GameState.storage.fodina) GameState.storage.fodina = { built: false };
        if (!GameState.storage.fornax_ferraria) GameState.storage.fornax_ferraria = { built: false };
        if (!GameState.storage.furnus) GameState.storage.furnus = { built: false };
        // kovarna-dilna-mrd.md v0.5 (30.8.2026) — Kovárna, druhá dílna. tier
        // 0 dokud built===false, na 1 skočí automaticky při dokončení stavby
        // (viz konec funkce), T2/T3 se odemykaj samostatnym upgradem.
        if (!GameState.storage.kovarna) GameState.storage.kovarna = { built: false, tier: 0 };
        if (!GameState.storage.vapenice) GameState.storage.vapenice = { built: false };
        if (!GameState.storage.udirna) GameState.storage.udirna = { built: false };
        if (!GameState.storage.cerna_kuchyne) GameState.storage.cerna_kuchyne = { built: false };
        if (!GameState.storage.velky_hmozdir) GameState.storage.velky_hmozdir = { built: false };
        if (!GameState.storage.rozen) GameState.storage.rozen = { built: false };
        if (!GameState.storage.susarna) GameState.storage.susarna = { built: false };
        // vyroba-stavby-mrd (5.9.2026) — Bednářská dílna, dokončení slibu z
        // popisu tech_tonnellerie ("Odemkne: Foudres + Bednářská dílna").
        // Karta v CellariumSystem.js (Vinohrad build-array), req_tech: hasTonn,
        // req_build: true (nezávislá na Foudres, stavitelná hned po techu).
        if (!GameState.storage.bedna_dilna) GameState.storage.bedna_dilna = { built: false };
        if (!GameState.storage.old_cellars) GameState.storage.old_cellars = { built: false };
        if (!GameState.storage.domus_conversorum_i) GameState.storage.domus_conversorum_i = { built: false };
        if (!GameState.storage.domus_conversorum_ii) GameState.storage.domus_conversorum_ii = { built: false };
        if (!GameState.storage.domus_conversorum_iii) GameState.storage.domus_conversorum_iii = { built: false };
        if (!GameState.storage.dormitorium_i) GameState.storage.dormitorium_i = { built: false };
        if (!GameState.storage.dormitorium_ii) GameState.storage.dormitorium_ii = { built: false };
        if (!GameState.storage.dormitorium_iii) GameState.storage.dormitorium_iii = { built: false };
        if (!GameState.storage.knihovna_grade_i) GameState.storage.knihovna_grade_i = { built: false };
        if (!GameState.storage.transactions) GameState.storage.transactions = [];
        // Prereq checks — storage buildings
        if (type === 'cella' && !GameState.storage.almarium.built) {
            UI.notify(lang === 'en' ? 'Build Almarium first.' : 'Nejprve postav Almarium.', true); return;
        }
        if (type === 'horreum' && !GameState.storage.cella.built) {
            UI.notify(lang === 'en' ? 'Build Cella first.' : 'Nejprve postav Cellu.', true); return;
        }
        // Prereq checks — Vinohrad buildings
        if (type === 'vinea' && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_vinohrad'))) {
            UI.notify(lang === 'en' ? 'Research Vinea first.' : 'Nejprve prozkoumej tech Vinea.', true); return;
        }
        if (type === 'prelum' && !GameState.storage.vinea.built) {
            UI.notify(lang === 'en' ? 'Build Vinea first.' : 'Nejprve postav Vinohrad (Vinea).', true); return;
        }
        if (type === 'cella_fermentaria' && !GameState.storage.prelum.built) {
            UI.notify(lang === 'en' ? 'Build Prelum first.' : 'Nejprve postav Prelum (Lis).', true); return;
        }
        if (type === 'foudres' && !GameState.storage.cella_fermentaria.built) {
            UI.notify(lang === 'en' ? 'Build Cella fermentaria first.' : 'Nejprve postav Cella fermentaria.', true); return;
        }
        if (type === 'cellarium_vini' && !GameState.storage.foudres.built) {
            UI.notify(lang === 'en' ? 'Build Foudres first.' : 'Nejprve postav Foudres.', true); return;
        }
        if (type === 'uvarium' && !GameState.storage.foudres.built) {
            UI.notify(lang === 'en' ? 'Build Foudres first.' : 'Nejprve postav Foudres.', true); return;
        }
        if (type === 'prelum_olei' && !(GameState.storage.sulci && GameState.storage.sulci.built)) {
            UI.notify(lang === 'en' ? 'Build Sulci first.' : 'Nejprve postav Brázdy (Sulci).', true); return;
        }
        if (type === 'fornax_ferraria') {
            if (!(GameState.abbotPetition && GameState.abbotPetition.fornax && GameState.abbotPetition.fornax.status === 'approved')) {
                UI.notify(lang === 'en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
            }
        }
        // dilny-pozemky-mrd.md v0.3 — Furnus (25.8.2026), mirror fornax_ferraria
        if (type === 'furnus') {
            if (!(GameState.abbotPetition && GameState.abbotPetition.furnus && GameState.abbotPetition.furnus.status === 'approved')) {
                UI.notify(lang === 'en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
            }
        }
        // kovarna-dilna-mrd.md v0.5 (30.8.2026) — Kovárna, mirror furnus přesně.
        if (type === 'kovarna') {
            if (!(GameState.abbotPetition && GameState.abbotPetition.kovarna && GameState.abbotPetition.kovarna.status === 'approved')) {
                UI.notify(lang === 'en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
            }
        }
        if (type === 'old_cellars') {
            const unlocked = (GameState.researchedTechs && GameState.researchedTechs.includes('tech_conventual_spaces')) || GameState.oldCellarsFound;
            if (!unlocked) {
                UI.notify(lang === 'en' ? 'The old vaults have not yet been found.' : 'Staré klenby ještě nebyly objeveny.', true); return;
            }
        }
        if (type === 'dormitorium_ii' && !(GameState.storage.dormitorium_i && GameState.storage.dormitorium_i.built)) {
            UI.notify(lang === 'en' ? 'Build Dormitorium I first.' : 'Nejprve postav Dormitorium I.', true); return;
        }
        if (type === 'dormitorium_iii' && !(GameState.storage.dormitorium_ii && GameState.storage.dormitorium_ii.built)) {
            UI.notify(lang === 'en' ? 'Build Dormitorium II first.' : 'Nejprve postav Dormitorium II.', true); return;
        }
        if (type === 'domus_conversorum_i' && !(GameState.storage.old_cellars && GameState.storage.old_cellars.built)) {
            UI.notify(lang === 'en' ? 'Clear the Old Cellars first.' : 'Nejprve vyklidit Staré sklepy.', true); return;
        }
        if (type === 'domus_conversorum_ii') {
            if (!(GameState.abbotPetition && GameState.abbotPetition.domus_ii && GameState.abbotPetition.domus_ii.status === 'approved')) {
                UI.notify(lang === 'en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
            }
        }
        if (type === 'domus_conversorum_iii') {
            if (!(GameState.abbotPetition && GameState.abbotPetition.domus_iii && GameState.abbotPetition.domus_iii.status === 'approved')) {
                UI.notify(lang === 'en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
            }
        }
        if (type === 'vapenice' && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_calcaria'))) {
            UI.notify(lang === 'en' ? 'Research Calcaria first.' : 'Nejprve prozkoumej tech Calcaria.', true); return;
        }
        if (type === 'susarna' && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_susarna_industria'))) {
            UI.notify(lang === 'en' ? 'Research Susarna Industria first.' : 'Nejprve prozkoumej tech Sušárna Industria.', true); return;
        }
        if (GameState.storage[type] && GameState.storage[type].built) {
            UI.notify(lang === 'en' ? 'Already built.' : 'Jiz postaveno.', true); return;
        }
        const costs = {
            almarium: { plank: 6, rope: 3, leather: 2 },
            cella: { cut_stone: 12, rope: 5, chalk: 4 },
            // kovani-rozsireni-mrd v2 (7.8.2026): hřebíky do staveb střední+
            // úrovně (ne raná fáze) — viz mrd audit, skutečný zdroj nákladů
            // (ne recipes.js RecipesDB, které tahle funkce vůbec nečte).
            horreum: { cut_stone: 20, plank: 10, glue: 4, rope: 6, hrebiky: 5 },
            fabrica: { rock: 30, plank: 15, charcoal: 10, anvil: 1, hrebiky: 8 },
            sulci: { plank: 8, rope: 4, stick: 10 },
            humno: { cut_stone: 8, plank: 6, rope: 3 },
            vinea: { plank: 12, rope: 6, rock: 6 },
            prelum: { plank: 8, rope: 4, rock: 6, iron_ingot: 2, hrebiky: 4 },
            cella_fermentaria: { plank: 10, rock: 8, rope: 3, clay: 4, hrebiky: 5 },
            foudres: { plank: 15, rope: 6, iron_ingot: 3, hrebiky: 7 },
            cellarium_vini: { cut_stone: 10, plank: 6, rope: 4, hrebiky: 3 },
            uvarium: { plank: 8, rock: 4, rope: 3, hrebiky: 4 },
            prelum_olei: { plank: 10, rope: 4, rock: 4, iron_ingot: 1, hrebiky: 5 },
            fornax_ferraria: { rock: 40, cut_stone: 15, clay: 20, plank: 20, charcoal: 15, hrebiky: 10 },
            // dilny-pozemky-mrd.md v0.3 — Furnus (25.8.2026), i18n build_cost
            // (cs.js/en.js abbotPetition.furnus.build_cost) musí sedět s tímhle.
            furnus: { clay: 20, rock: 15, plank: 10, hrebiky: 5 },
            // kovarna-dilna-mrd.md v0.5 (30.8.2026) — Kovárna, i18n build_cost
            // (abbotPetition.kovarna.build_cost) musí sedět s tímhle.
            kovarna: { rock: 25, plank: 15, charcoal: 10, anvil: 1, hrebiky: 8 },
            vapenice: { plank: 15, cut_stone: 20, clay: 20, hrebiky: 7 },
            // mlynar-vlastni-mlyn-mrd.md §4.5 (16.8.2026) — kámen+železo+vápno,
            // mirror Udírna/Vápenice škály (mid-tier utility budova).
            susarna: { cut_stone: 25, iron_ingot: 5, vapno_hasene_mature: 10, plank: 8, hrebiky: 5 },
            old_cellars: { cut_stone: 15, plank: 10, rope: 5, hrebiky: 5 },
            domus_conversorum_i: { cut_stone: 40, plank: 25, rope: 10, hrebiky: 12 },
            domus_conversorum_ii: { cut_stone: 150, plank: 90, rope: 35, hrebiky: 35 },
            domus_conversorum_iii: { cut_stone: 330, plank: 200, rope: 75, iron_ingot: 4, hrebiky: 70 },
            dormitorium_i: { cut_stone: 30, plank: 20, rope: 8, hrebiky: 10 },
            dormitorium_ii: { cut_stone: 90, plank: 60, rope: 25, iron_ingot: 2, glass_stopper: 6, hrebiky: 25 },
            dormitorium_iii: { cut_stone: 200, plank: 130, rope: 50, iron_ingot: 6, glass_stopper: 10, glass_tankard: 10, hrebiky: 50 },
            knihovna_grade_i: { cut_stone: 20, plank: 15, rope: 6, hrebiky: 7 },
            // udirna-mrd (7.8.2026): samostatná věžová udírna, kámen+dřevo dle podkladu
            udirna: { cut_stone: 25, plank: 15, rope: 4, clay: 8, hrebiky: 6 },
            // coquina-tier2-mrd (7.8.2026): klenutá kuchyně + soplouch — víc jíl na komín, míň prkna než Udírna
            cerna_kuchyne: { cut_stone: 15, plank: 8, clay: 12, hrebiky: 3 },
            // coquina-tier4-mrd (7.8.2026): panská kuchyně — hmoždíř na koření, rožeň na pečeně
            velky_hmozdir: { cut_stone: 30, hrebiky: 2 },
            rozen: { iron_ingot: 6, plank: 4, hrebiky: 3 },
            // vyroba-stavby-mrd (6.9.2026) — Bednářská dílna, musí sedět s
            // cost objektem v CellariumSystem.js (Vinohrad build-array).
            bedna_dilna: { plank: 12, iron_ingot: 4, rope: 5, wild_leather: 2 },
        };
        // Volitelný groše náklad navíc k materiálu — dnes jen Domus Conversorum I/II.
        // Cokoliv chybí v costsGrose má groseNeeded=0, tedy nulový dopad na stávající budovy.
        const costsGrose = {
            domus_conversorum_i: 25,
            domus_conversorum_ii: 50,
            domus_conversorum_iii: 110,
            dormitorium_i: 15,
            dormitorium_ii: 35,
            dormitorium_iii: 70,
            knihovna_grade_i: 15,
        };
        const cost = costs[type];
        if (!cost) return;
        const groseNeeded = costsGrose[type] || 0;
        if (groseNeeded > 0 && (typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < groseNeeded) {
            UI.notify((lang === 'en' ? 'Not enough groats: ' : 'Nedostatek grošů: ') + groseNeeded, true); return;
        }
        for (const [item, amt] of Object.entries(cost)) {
            if ((GameState.inventory[item] || 0) < amt) {
                const itemName = (typeof iName === 'function') ? iName(item) : item;
                UI.notify((lang === 'en' ? 'Not enough: ' : 'Nedostatek: ') + itemName + ' x' + amt, true); return;
            }
        }
        for (const [item, amt] of Object.entries(cost)) { InventoryManager.removeItem(item, amt); }
        if (groseNeeded > 0 && typeof CellariumSystem !== 'undefined') CellariumSystem.addGrose(-groseNeeded, { title: lang === 'en' ? 'Construction' : 'Stavba', source: type, source_en: type });
        GameState.storage[type].built = true;
        // kovarna-dilna-mrd.md v0.5 (30.8.2026) — stavba Kovárny = automaticky
        // Tier 1 (oprava podkov). T2/T3 se odemykaj samostatnym upgradem, ne tady.
        if (type === 'kovarna') GameState.storage.kovarna.tier = 1;
        Game.save();
        const names = {
            almarium: 'Almarium', cella: 'Cella', horreum: 'Horreum',
            fabrica: 'Fabrica', sulci: 'Sulci', humno: 'Humno',
            vinea: 'Vinea', prelum: 'Prelum', cella_fermentaria: 'Cella fermentaria',
            foudres: 'Foudres', cellarium_vini: 'Cellarium Vini',
            uvarium: 'Uvarium', prelum_olei: 'Prelum Olei',
            fornax_ferraria: 'Fornax Ferraria',
            furnus: 'Furnus',
            kovarna: 'Kovárna',
            vapenice: 'Vápenice',
            old_cellars: 'Staré sklepy',
            domus_conversorum_i: 'Domus Conversorum I',
            domus_conversorum_ii: 'Domus Conversorum II',
            domus_conversorum_iii: 'Domus Conversorum III',
            dormitorium_i: 'Dormitorium I',
            dormitorium_ii: 'Dormitorium II',
            dormitorium_iii: 'Dormitorium III',
            knihovna_grade_i: 'Knihovna — Stupeň I',
            bedna_dilna: 'Bednářská dílna',
        };
        const n = names[type] || type;
        UI.notifyPanel('🏗️ ' + (lang === 'en' ? n + ' built.' : n + ' postaveno.'), 'system');
        Game.addKronikaEntry('important', n + ' postaveno.', n + ' built.', n + ' aedificatum est.');
        // Discovery: tech_prelum_olei při stavbě Sulci
        if (type === 'sulci' && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_prelum_olei'))) {
            const techObj = typeof TechTree !== 'undefined' ? TechTree.find(x => x.id === 'tech_prelum_olei') : null;
            if (techObj) {
                // Jen odemknout jako dostupný k výzkumu — ne přidat rovnou
                NotificationSystem.panel('📜 ' + (lang === 'en'
                    ? 'The furrows reveal a new possibility — an oil press for linseed.'
                    : 'Brázdy odhalily novou možnost — lisovna pro lněný olej.'), 'system');
            }
        }
        // re-render Buildings tabu po stavbě
        if (typeof CellariumSystem !== 'undefined') {
            if (!GameState.ui) GameState.ui = {};
            GameState.ui.cellariumEntity = 'buildings';
            const _cel = document.getElementById('cellarium-content');
            if (_cel) _cel.outerHTML = CellariumSystem.renderCellariumContent();
        }
    },

    checkCalendarium: function () {
        // Spustit jen 1× za den
        if (!GameState.flags) GameState.flags = {};
        const today = new Date().toISOString().slice(0, 10);
        if (GameState.flags.calendarChecked === today) return;
        GameState.flags.calendarChecked = today;

        const hasCalendarium = (GameState.inventory['perpetuum_calendarium'] > 0);
        if (!hasCalendarium) return;

        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const day = now.getDate();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Leden — upozornění na obnovení
        if (month === 1) {
            if (!GameState.flags.calendarRenewedThisYear) {
                const msg = lang === 'en'
                    ? '📅 A new year hath begun. Craft a new Perpetuum Calendarium!'
                    : '📅 Nový rok začal. Vyroб nový Perpetuum Calendarium!';
                UI.notifyPanel(msg, 'warning');
                // Nezničí, jen upozorní — hráč musí craft ručně
            }
        } else {
            GameState.flags.calendarRenewedThisYear = false;
        }

        // Prosinec — varování před expirací
        if (month === 12) {
            const warnings = [
                { day: 1, key: 'month' },
                { day: 17, key: 'twoWeeks' },
                { day: 24, key: 'week' },
                { day: 31, key: 'expire' },
            ];
            const warn = warnings.find(w => w.day === day);
            if (warn && !GameState.flags[`calWarn_${warn.key}_${now.getFullYear()}`]) {
                GameState.flags[`calWarn_${warn.key}_${now.getFullYear()}`] = true;
                const msgs = {
                    cs: { month: '📅 Calendarium vyprší za měsíc. Připrav zásoby!', twoWeeks: '📅 Calendarium vyprší za 14 dní.', week: '📅 Calendarium vyprší za týden!', expire: '📅 Calendarium dnes vyprší. Vyroб nový v lednu!' },
                    en: { month: '📅 Calendarium expires in one month. Prepare supplies!', twoWeeks: '📅 Calendarium expires in 14 days.', week: '📅 Calendarium expires in one week!', expire: '📅 Calendarium expires today. Craft a new one in January!' },
                };
                UI.notifyPanel((msgs[lang] || msgs.cs)[warn.key], 'warning');
                Game.save();
            }
        }
    },
};