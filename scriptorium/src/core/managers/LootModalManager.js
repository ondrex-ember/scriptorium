// ═══ src/core/managers/LootModalManager.js ═══
// Extrakce z game.js (Krok 2 / D2, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: krb (rozehnutí) + scavenge-loot modaly (Easter eggs).
// Původně metody Game.* na řádcích 1276–1970 (HEAD 5df8537). Chování beze
// změny — pouze přesun + přepsání this.removeItem → Game.removeItem
// (jediná cross-doménová závislost nalezená v bloku).
const LootModalManager = {
    // ⚠️ nevoláno nikde v repu (ověřeno gtřepem 19.8.2026, audit před extrakcí D2) — ponecháno, ne mažeme neschváleně
    igniteFireplace: function () {
        if (!GameState.inventory['tinderbox']) { UI.notify(t('game.noTinderbox'), true); return; }
        Game.removeItem('tinderbox', 1);
        const isFirstTime = !GameState.achievements?.stats?.fireplaceCount;
        GameState.flags.fireplaceLit = true;
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.resolvePendingEvent) NotificationSystem.resolvePendingEvent('fireout');
        GameState.flags.forceDark = false;
        if (GameState.achievements) GameState.achievements.stats.fireplaceCount++;
        if (typeof FireplaceSystem !== 'undefined') {
            if (!GameState.fire) GameState.fire = { active: false, fuelMs: 0, lastUpdate: Date.now() };
            GameState.fire.active = true;
            GameState.fire.fuelMs = 4 * 60 * 60 * 1000; // Úvodní zážeh: 4 hodiny
            GameState.fire.lastUpdate = Date.now();
        }
        UI.notifyPanel(t('game.fireKindled'), 'system');
        if (!audioSys) { try { audioSys = new AudioSystem(); audioSys.start(); } catch (e) { } }
        if (audioSys) audioSys.startFireLoop(false);
        Analytics.fireplaceIgnited(isFirstTime);
        Game.save(); Game.checkEnvironment();
    },
    // ⚠️ nevoláno nikde v repu (ověřeno gtřepem 19.8.2026, audit před extrakcí D2) — ponecháno, ne mažeme neschváleně
    lightSource: function (type) {
        if (!GameState.flags.fireplaceLit) { UI.notify(t('game.needFire'), true); return; }
        // Louč: preferuj smolovou (torch_resin), pak lojovou (torch_tallow), jinak nouzová tuková (primitive_torch)
        // Svíčka: stejná kaskáda — voskavka (candle_wax), pak lojová (candle_tallow), jinak tuková (candle)
        // svitidla-mrd (16.8.2026), mirror torch vzoru přesně.
        let item = (type === 'candle')
            ? ((GameState.inventory['candle_wax'] || 0) > 0 ? 'candle_wax' : ((GameState.inventory['candle_tallow'] || 0) > 0 ? 'candle_tallow' : 'candle'))
            : ((GameState.inventory['torch_resin'] || 0) > 0 ? 'torch_resin' : ((GameState.inventory['torch_tallow'] || 0) > 0 ? 'torch_tallow' : 'primitive_torch'));
        if (!GameState.inventory[item]) { UI.notify(t('game.missingItem').replace('{item}', ItemsDB[item].name), true); return; }

        if (type === 'candle') {
            GameState.flags.torchLit = false;
            GameState.flags.candleLit = true;
            GameState.candleStart = Date.now();
            GameState.candleItemId = item;

            // Track candles lit
            if (GameState.achievements) {
                GameState.achievements.stats.candlesLit++;
            }
        }
        else {
            GameState.flags.candleLit = false;
            GameState.flags.torchLit = true;
            GameState.torchStart = Date.now();
            GameState.torchItemId = item;
        }

        Game.removeItem(item, 1);
        UI.notify(t('game.itemIgnited').replace('{item}', ItemsDB[item].name));
        Game.save(); Game.checkEnvironment();
    },
    // ── Ztracené klíče — modal ───────────────────────────────────────────────
    // coquina-kotlik-mrd (9.8.2026): modal pro Zrezlý kotlík — nabídne
    // vyčištění přímo (spotřebuje crushed_stone+water, vrátí Kotlík tier 2),
    // mirror stylu showLostKeyModal/showHempPouchModal.
    showRustyPotModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';
        const qty = GameState.inventory['zrezly_kotlik'] || 0;
        const haveStone = GameState.inventory['crushed_stone'] || 0;
        const haveWater = GameState.inventory['water'] || 0;
        const needStone = 2, needWater = 1;
        const canClean = haveStone >= needStone && haveWater >= needWater;

        NotificationSystem.modal({
            icon: '🍂',
            title: isEn ? 'Rusty Pot' : 'Zrezlý kotlík',
            text: (isEn
                ? '<em>An old metal pot, thick with rust. It needs a thorough scouring before anything can be cooked in it.</em>'
                : '<em>Starý kovový kotlík, celý ve rzi. Než se v něm dá vařit, musí se pořádně vydrhnout.</em>')
                + '<br><br>' + (isEn ? 'In stock' : 'Na skladě') + ': <strong>' + qty + '</strong>'
                + '<br>' + (isEn ? 'Needed' : 'Potřeba') + ': ' + needStone + '× ' + (typeof iName === 'function' ? iName('crushed_stone') : 'Drcený kámen')
                + ' (' + haveStone + '/' + needStone + '), ' + needWater + '× ' + (typeof iName === 'function' ? iName('water') : 'Voda') + ' (' + haveWater + '/' + needWater + ')'
                + (!canClean ? '<br><small style="color:#c0392b;">⚠️ ' + (isEn ? 'Not enough materials' : 'Nedostatek surovin') + '</small>' : ''),
            choices: [
                {
                    label: isEn ? '🧽 Scour clean' : '🧽 Vydrhnout',
                    type: canClean ? 'primary' : 'default',
                    effect: canClean ? function () {
                        Game.craft('vycistit_kotlik');
                    } : function () {
                        UI.notify(isEn ? '⚠️ Not enough materials.' : '⚠️ Nedostatek surovin.', true);
                    }
                },
                { label: isEn ? 'Close' : 'Zavřít', type: 'default', effect: function () { } }
            ]
        });
    },

    showLostKeyModal: function (keyId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'en';
        const item = typeof ItemsDB !== 'undefined' ? ItemsDB[keyId] : null;
        const name = item ? (cs ? (item.name_en || item.name) : item.name) : keyId;
        const qty = GameState.inventory[keyId] || 0;
        const researchCost = 7;
        const hasResearch = (GameState.inventory['research'] || 0) >= researchCost;
        const isScroll = keyId.indexOf('lost_scroll_') === 0;

        // Zjistit jestli klíč/svitek byl už prozkoumán
        if (!GameState.flags) GameState.flags = {};
        const exploredFlag = 'key_explored_' + keyId;
        const alreadyExplored = !!GameState.flags[exploredFlag];

        const examineLabel = cs
            ? '🔍 Examine (-' + researchCost + ' notes)'
            : '🔍 Prozkoumat (-' + researchCost + ' zápisků)';
        const examineDisabled = !hasResearch;

        NotificationSystem.modal({
            icon: isScroll ? '📜' : '🗝️',
            title: name,
            text: alreadyExplored
                ? (cs ? '<em>Already examined. Its purpose is known.</em>' : '<em>Již prozkoumán. Jeho účel je znám.</em>')
                + '<br><br>' + (cs ? 'In stock' : 'Na skladě') + ': <strong>' + qty + '</strong>'
                : (isScroll
                    ? (cs
                        ? '<em>An old scroll covered in faded ink. What was written here before time erased the words? You will need to examine it carefully — that takes time and knowledge.</em>'
                        : '<em>Starý svitek popsaný vybledlým inkoustem. Co tu stálo psáno, než ho čas smazal? Bude třeba ho pečlivě prozkoumat — to chce čas a zápisky.</em>')
                    : (cs
                        ? '<em>An old rusty key. Where does it fit? You will need to examine it carefully — that takes time and knowledge.</em>'
                        : '<em>Starý rezavý klíč. Kam pasuje? Bude třeba ho pečlivě prozkoumat — to chce čas a zápisky.</em>'))
                + '<br><br>' + (cs ? 'In stock' : 'Na skladě') + ': <strong>' + qty + '</strong>'
                + (!hasResearch ? '<br><small style="color:#c0392b;">⚠️ ' + (cs ? 'Need ' + researchCost + ' notes' : 'Potřeba ' + researchCost + ' zápisků') + '</small>' : ''),
            choices: alreadyExplored ? [
                { label: cs ? 'Close' : 'Zavřít', type: 'default', effect: function () { } }
            ] : [
                {
                    label: examineLabel,
                    type: examineDisabled ? 'default' : 'primary',
                    effect: examineDisabled ? function () { UI.notify(cs ? '⚠️ Not enough notes.' : '⚠️ Nedostatek zápisků.', true); } : function () {
                        Game.removeItem('research', researchCost);
                        GameState.flags[exploredFlag] = true;
                        if (isScroll) {
                            LootModalManager._applyLostScrollEffect(keyId, cs);
                        } else {
                            LootModalManager._applyLostKeyEffect(keyId, cs);
                        }
                        Game.save();
                    }
                },
                { label: cs ? '🗃️ Keep' : '🗃️ Uchovat', type: 'default', effect: function () { } }
            ]
        });
    },

    _applyLostKeyEffect: function (keyId, cs) {
        // Klíče 4× — odemknou postupně všechna folia Scrinia (dynamicky, roste s obsahem)
        const key4Folios = (typeof ScriniumDB !== 'undefined') ? ScriniumDB.folios.map(f => f.id) : ['folio_epistola', 'folio_fausto', 'folio_palimpsest', 'folio_titivillus'];

        if (keyId === 'lost_key_1') {
            // Athanor
            if (!GameState.secrets) GameState.secrets = {};
            if (!GameState.secrets.laboratoryUnlocked) {
                GameState.secrets.laboratoryUnlocked = true;
                UI.notify(cs ? '🔥 Key fits! The Athanor laboratory is now accessible.' : '🔥 Klíč pasuje! Laboratoř Athanoru je nyní přístupná.');
                UI.notifyPanel(cs ? '🗝️ Lost Key #1 unlocked the Athanor.' : '🗝️ Klíč č.1 odemkl Athanor.', 'system');
            } else {
                UI.notify(cs ? '🗝️ The Athanor is already unlocked.' : '🗝️ Athanor je již odemčen.');
            }
        } else if (keyId === 'lost_key_2') {
            // Scrinium
            if (!GameState.secrets) GameState.secrets = {};
            if (!GameState.secrets.forbiddenUnlocked) {
                GameState.secrets.forbiddenUnlocked = true;
                UI.notify(cs ? '📕 Key fits! Scrinium Abbatis is now accessible.' : '📕 Klíč pasuje! Scrinium Abbatis je nyní přístupné.');
                UI.notifyPanel(cs ? '🗝️ Lost Key #2 unlocked the Scrinium.' : '🗝️ Klíč č.2 odemkl Scrinium.', 'system');
            } else {
                UI.notify(cs ? '🗝️ The Scrinium is already unlocked.' : '🗝️ Scrinium je již odemčeno.');
            }
        } else if (keyId === 'lost_key_3') {
            // Stopa ke Starym sklepum — flag pro budouci system "Sklepni prostory" (Propadla podlaha event chain)
            if (!GameState.secrets) GameState.secrets = {};
            if (!GameState.secrets.oldCellarsHinted) {
                GameState.secrets.oldCellarsHinted = true;
                UI.notify(cs ? '🗝️ The key fits no door you know — but you sense something deeper in the cellars. The way there is still walled off.' : '🗝️ Klíč nepasuje do žádných dveří, co znáš — ale tušíš, že někde hlouběji ve sklepích čeká zapomenutý prostor. Cesta tam je zatím zazděná.');
                UI.notifyPanel(cs ? '🗝️ Lost Key #3: something stirs beneath the cellars.' : '🗝️ Klíč č.3: něco se probouzí pod sklepy.', 'system');
            } else {
                UI.notify(cs ? '🗝️ You already sense what waits beneath the cellars.' : '🗝️ Už tušíš, co čeká pod sklepy.');
            }
        } else if (keyId === 'lost_key_4') {
            // Odemknout první nenalezené folio ze sady
            if (!GameState.scrinium) GameState.scrinium = { activeSubtab: 'tajne_spisy', folios: {} };
            const nextFolio = key4Folios.find(fid => !GameState.scrinium.folios[fid] || !GameState.scrinium.folios[fid].found);
            if (nextFolio && typeof SecretsSystem !== 'undefined') {
                SecretsSystem.unlockFolioById(nextFolio);
                UI.notify(cs ? '📜 Key fits! A folio was found in Scrinium.' : '📜 Klíč pasuje! Ve Scrinium nalezeno folio.');
            } else {
                UI.notify(cs ? '🗝️ All folios in this set are already found.' : '🗝️ Všechna folia v této sadě jsou již nalezena.');
            }
        } else if (keyId === 'lost_key_5') {
            // Deep unknown
            UI.notify(cs ? '🗝️ The key hums faintly when held. It fits somewhere... but where?' : '🗝️ Klíč slabě vibruje v ruce. Někam pasuje... ale kam?');
            UI.notifyPanel(cs ? '🗝️ Lost Key #5: something stirs.' : '🗝️ Klíč č.5: něco se probouzí.', 'system');
        } else if (keyId === 'key_large_1') {
            // Hospoda — trvale otevřená
            if (!GameState.secrets) GameState.secrets = {};
            if (!GameState.secrets.tavernAlwaysOpen) {
                GameState.secrets.tavernAlwaysOpen = true;
                UI.notify(cs ? '🍺 The key fits the Tavern door. It is now open day and night.' : '🍺 Klíč pasuje do dveří Hospody. Je odteď otevřená dnem i nocí.');
                UI.notifyPanel(cs ? '🔑 Large Key #1 unlocked the Tavern, always.' : '🔑 Velký klíč č.1 trvale odemkl Hospodu.', 'system');
            } else {
                UI.notify(cs ? '🔑 The Tavern is already open day and night.' : '🔑 Hospoda už je otevřená dnem i nocí.');
            }
        } else if (keyId === 'key_large_2') {
            // Obchod — trvale otevřený
            if (!GameState.secrets) GameState.secrets = {};
            if (!GameState.secrets.shopAlwaysOpen) {
                GameState.secrets.shopAlwaysOpen = true;
                UI.notify(cs ? '🏪 The key fits the Shop door. It is now open every day.' : '🏪 Klíč pasuje do dveří Obchodu. Je odteď otevřený každý den.');
                UI.notifyPanel(cs ? '🔑 Large Key #2 unlocked the Shop, always.' : '🔑 Velký klíč č.2 trvale odemkl Obchod.', 'system');
            } else {
                UI.notify(cs ? '🔑 The Shop is already open every day.' : '🔑 Obchod už je otevřený každý den.');
            }
        } else if (keyId === 'key_large_3') {
            // I-Ching — alternativní odemčení bez tech_iching i bez craftované knihy
            if (!GameState.secrets) GameState.secrets = {};
            const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_iching');
            const hasBook = (GameState.inventory['iching_book'] || 0) > 0;
            if (!hasTech && !GameState.secrets.ichingUnlocked) {
                GameState.secrets.ichingUnlocked = true;
                if (!hasBook) Game.addItem('iching_book', 1);
                UI.notify(cs ? '☯️ The key opens a hidden chamber. The I-Ching is revealed.' : '☯️ Klíč otevírá skrytou komnatu. I-Ching je odhalen.');
                UI.notifyPanel(cs ? '🔑 Large Key #3 unlocked the I-Ching.' : '🔑 Velký klíč č.3 odemkl I-Ching.', 'system');
            } else {
                UI.notify(cs ? '🔑 The I-Ching is already known to you.' : '🔑 I-Ching už znáš.');
            }
        }
    },

    // ── Ztracené svitky — odhalí náhodnou neobjevenou kombinaci Athanoru ──────
    _applyLostScrollEffect: function (scrollId, cs) {
        if (!GameState.secrets) GameState.secrets = {};
        if (!GameState.athanor) GameState.athanor = { discovered: [] };
        if (!GameState.athanor.discovered) GameState.athanor.discovered = [];

        const athanorOpen = !!GameState.secrets.laboratoryUnlocked;
        if (!athanorOpen) {
            UI.notify(cs
                ? '📜 The scroll is covered in strange marks and formulas — without a furnace to perform them, they make no sense. Find the Athanor first.'
                : '📜 Svitek je popsán podivnými značkami a formulemi — bez pece, která by je provedla, nedávají smysl. Najdi nejdřív Athanor.');
            UI.notifyPanel(cs ? '📜 An old scroll, unreadable for now.' : '📜 Starý svitek, zatím nečitelný.', 'system');
            return;
        }

        const allKeys = (typeof AthanorDB !== 'undefined' && AthanorDB.combinations) ? Object.keys(AthanorDB.combinations) : [];
        const undiscovered = allKeys.filter(k => !GameState.athanor.discovered.includes(k));

        if (undiscovered.length === 0) {
            UI.notify(cs
                ? '📜 The scroll holds a recipe you already know by heart. The Athanor has no more secrets for you.'
                : '📜 Svitek obsahuje recept, který už znáš zpaměti. Athanor pro tebe nemá další tajemství.');
            return;
        }

        const pickKey = undiscovered[Math.floor(Math.random() * undiscovered.length)];
        GameState.athanor.discovered.push(pickKey);

        const combo = AthanorDB.combinations[pickKey];
        const parts = pickKey.split(':');
        const procId = parts[1];
        const ingIds = parts[0].split('+');
        const ingNames = ingIds.map(function (id) {
            const ing = AthanorDB.ingredients.find(function (i) { return i.id === id; });
            return ing ? ing.name_lat : id;
        });
        const proc = AthanorDB.processes.find(function (p) { return p.id === procId; });

        UI.notify(cs
            ? '📜 The scroll reveals an old recipe: ' + combo.name_lat + '. Ingredients: ' + ingNames.join(' + ') + '. Process: ' + (proc ? proc.name : procId) + '.'
            : '📜 Svitek odhaluje starý recept: ' + combo.name + ' (' + combo.name_lat + '). Ingredience: ' + ingNames.join(' + ') + '. Proces: ' + (proc ? proc.name_cs : procId) + '.');
        UI.notifyPanel(cs ? '📜 An old scroll revealed an Athanor recipe.' : '📜 Starý svitek odhalil recept Athanoru.', 'system');
    },

    // ── Svazek sušených bylin — modal ────────────────────────────────────────
    showDriedHerbsModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'en';
        const qty = GameState.inventory['dried_herbs_bundle'] || 0;
        NotificationSystem.modal({
            icon: '🌿',
            title: cs ? 'Dried Herbs Bundle' : 'Svazek sušených bylin',
            text: cs
                ? '<em>A bundle of dried herbs tied with twine. Smells of chamomile and mint.</em><br><br>In stock: <strong>' + qty + '</strong>'
                : '<em>Svazek sušených bylin svázaný provázkem. Voní heřmánkem a mátohou.</em><br><br>Na skladě: <strong>' + qty + '</strong>',
            choices: [
                {
                    label: cs ? '🌿 Unbundle (random herbs)' : '🌿 Rozbalit (náhodné byliny)',
                    type: 'primary',
                    effect: function () {
                        if ((GameState.inventory['dried_herbs_bundle'] || 0) < 1) return;
                        Game.removeItem('dried_herbs_bundle', 1);
                        // Náhodný výběr 2-3 bylin
                        const herbPool = ['chamomile', 'thyme', 'mint', 'st_johns_wort', 'linden_blossom', 'sage', 'yarrow', 'hyssop'];
                        const count = Math.random() < 0.5 ? 3 : 2;
                        const shuffled = herbPool.sort(() => Math.random() - 0.5).slice(0, count);
                        shuffled.forEach(h => Game.addItem(h, 1));
                        const names = shuffled.map(h => typeof ItemsDB !== 'undefined' && ItemsDB[h] ? (cs ? (ItemsDB[h].name_en || ItemsDB[h].name) : ItemsDB[h].name) : h).join(', ');
                        UI.notify('🌿 ' + (cs ? 'Found: ' : 'Nalezeno: ') + names);
                        Game.save();
                    }
                },
                { label: cs ? '🗃️ Keep' : '🗃️ Uchovat', type: 'default', effect: function () { } }
            ]
        });
    },

    // ── Váček s konopím — modal ───────────────────────────────────────────────
    showHempPouchModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'en';
        const qty = GameState.inventory['hemp_pouch'] || 0;
        NotificationSystem.modal({
            icon: '👝',
            title: cs ? 'Hemp Pouch' : 'Váček s konopím',
            text: cs
                ? '<em>A small linen pouch with hemp seeds and some fibre inside.</em><br><br>In stock: <strong>' + qty + '</strong>'
                : '<em>Malý plátěný váček. Uvnitř semínka konopí a trocha vlákna.</em><br><br>Na skladě: <strong>' + qty + '</strong>',
            choices: [
                {
                    label: cs ? '👝 Open (+seeds_nettle +fiber)' : '👝 Otevřít (+semínka kopřivy +vlákno)',
                    type: 'primary',
                    effect: function () {
                        if ((GameState.inventory['hemp_pouch'] || 0) < 1) return;
                        Game.removeItem('hemp_pouch', 1);
                        Game.addItem('seeds_nettle', 2);
                        Game.addItem('fiber', 3);
                        UI.notify(cs ? '👝 Pouch opened. +2 nettle seeds, +3 fibre.' : '👝 Váček otevřen. +2 semínka kopřivy, +3 vlákno.');
                        Game.save();
                    }
                },
                { label: cs ? '🗃️ Keep' : '🗃️ Uchovat', type: 'default', effect: function () { } }
            ]
        });
    },

    // ── Záhadný kořen — modal ────────────────────────────────────────────────
    showMysteriousBulbModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'en';
        const qty = GameState.inventory['mysterious_bulb'] || 0;
        const hasHortus = GameState.researchedTechs && GameState.researchedTechs.includes('tech_hortus_conclusus');
        NotificationSystem.modal({
            icon: '🧅',
            title: cs ? 'Mysterious Bulb' : 'Záhadný kořen',
            text: cs
                ? '<em>A bulbous root of unknown origin. Could be mandrake, belladonna, or something else entirely. Only the garden will reveal the truth.</em><br><br>In stock: <strong>' + qty + '</strong>'
                + (!hasHortus ? '<br><small style="color:#c0392b;">⚠️ ' + (cs ? 'Requires: Hortus Conclusus' : 'Vyžaduje: Hortus Conclusus') + '</small>' : '')
                : '<em>Cibulovitý kořen neznámého původu. Možná mandragora, rulík, nebo něco úplně jiného. Jen zahrada odhalí pravdu.</em><br><br>Na skladě: <strong>' + qty + '</strong>'
                + (!hasHortus ? '<br><small style="color:#c0392b;">⚠️ Vyžaduje: Hortus Conclusus</small>' : ''),
            choices: [
                {
                    label: cs ? '🌱 Plant in special plot' : '🌱 Zasadit do special záhonu',
                    type: hasHortus ? 'primary' : 'default',
                    effect: function () {
                        if (!hasHortus) { UI.notify(cs ? '⚠️ Requires Hortus Conclusus.' : '⚠️ Vyžaduje Hortus Conclusus.', true); return; }
                        if ((GameState.inventory['mysterious_bulb'] || 0) < 1) return;
                        // Najít volný special záhon (state=1)
                        const plot = GameState.garden.find((p, i) => !p.locked && p.cropType === 'special' && p.state === 1);
                        if (!plot) { UI.notify(cs ? '⚠️ No prepared special plot available. Fertilize one first.' : '⚠️ Žádný připravený special záhon. Nejdříve zúrodni.', true); return; }
                        // Náhodně mandrake nebo belladonna
                        const special = Math.random() < 0.5 ? 'mandrake' : 'belladonna';
                        Game.removeItem('mysterious_bulb', 1);
                        plot.state = 2;
                        plot.crop = special;
                        plot.plantedAt = Date.now();
                        plot.water = false;
                        const sName = typeof ItemsDB !== 'undefined' && ItemsDB[special] ? (cs ? (ItemsDB[special].name_en || ItemsDB[special].name) : ItemsDB[special].name) : special;
                        UI.notify('🌱 ' + (cs ? 'Planted: ' : 'Zasazeno: ') + sName + (cs ? ' (maybe...)' : ' (možná...)'));
                        Game.save();
                        if (typeof GardenSystem !== 'undefined') GardenSystem.renderGarden();
                    }
                },
                { label: cs ? '🗃️ Keep' : '🗃️ Uchovat', type: 'default', effect: function () { } }
            ]
        });
    },

    // ── Pečetní vosk — modal ─────────────────────────────────────────────────
    showWaxSealModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'en';
        const qty = GameState.inventory['wax_seal'] || 0;
        NotificationSystem.modal({
            icon: '🔴',
            title: cs ? 'Wax Seal' : 'Pečetní vosk',
            text: cs
                ? '<em>An old seal broken from a letter. A heraldic device — but whose? The wax can be remelted and used again.</em><br><br>In stock: <strong>' + qty + '</strong>'
                : '<em>Stará pečeť odlomená od dopisu. Heraldický znak — ale čí? Vosk lze přetavit a znovu použít.</em><br><br>Na skladě: <strong>' + qty + '</strong>',
            choices: [
                {
                    label: cs ? '🕯️ Remelt (+1 beeswax)' : '🕯️ Přetavit (+1 včelí vosk)',
                    type: 'primary',
                    effect: function () {
                        if ((GameState.inventory['wax_seal'] || 0) < 1) return;
                        Game.removeItem('wax_seal', 1);
                        Game.addItem('beeswax', 1);
                        UI.notify(cs ? '🔴 Wax seal remelted. +1 beeswax.' : '🔴 Pečeť přetavena. +1 včelí vosk.');
                        Game.save();
                    }
                },
                {
                    label: cs ? '🗃️ Keep' : '🗃️ Uchovat',
                    type: 'default',
                    effect: function () { }
                }
            ]
        });
    },

    // ── Útržek pergamenu — modal ─────────────────────────────────────────────
    showTornPageModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'en';
        const qty = GameState.inventory['torn_page'] || 0;
        NotificationSystem.modal({
            icon: '📄',
            title: cs ? 'Torn Page' : 'Útržek pergamenu',
            text: cs
                ? '<em>A torn leaf with barely legible Latin text. Fragments of a prayer? A recipe? A letter? Hard to say.</em><br><br>In stock: <strong>' + qty + '</strong>'
                : '<em>Potrhaný list s nečitelným latinským textem. Fragment modlitby? Recept? Dopis? Těžko říct.</em><br><br>Na skladě: <strong>' + qty + '</strong>',
            choices: [
                {
                    label: cs ? '📖 Study (+5 notes)' : '📖 Prostudovat (+5 zápisků)',
                    type: 'primary',
                    effect: function () {
                        if ((GameState.inventory['torn_page'] || 0) < 1) return;
                        Game.removeItem('torn_page', 1);
                        Game.addItem('research', 5);
                        UI.notify(cs ? '📄 Page studied. +5 notes.' : '📄 Útržek prostudován. +5 zápisků.');
                        Game.save();
                    }
                },
                {
                    label: cs ? '🗃️ Keep' : '🗃️ Uchovat',
                    type: 'default',
                    effect: function () { }
                }
            ]
        });
    },

    // ── Staré mince — modal při nalezení nebo kliknutí ─────────────────────
    showCoinModal: function (itemId, value) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'en';
        const item = typeof ItemsDB !== 'undefined' ? ItemsDB[itemId] : null;
        const name = item ? (cs ? (item.name_en || item.name) : item.name) : itemId;
        const desc = item ? (cs ? (item.desc_en || item.desc) : item.desc) : '';
        const qty = GameState.inventory[itemId] || 0;
        NotificationSystem.modal({
            icon: item ? item.icon : '🪙',
            title: name,
            text: desc + '<br><br>' + (cs ? 'In stock' : 'Na skladě') + ': <strong>' + qty + '</strong>',
            choices: [
                {
                    label: cs ? '💰 Sell to Giacomo (+' + value + ' gr.)' : '💰 Prodat Giacomovi (+' + value + ' gr.)',
                    type: 'primary',
                    effect: function () {
                        if ((GameState.inventory[itemId] || 0) < 1) return;
                        Game.removeItem(itemId, 1);
                        Game.addItem('grosze', value);
                        UI.notify(cs ? '💰 Sold for ' + value + ' groschen.' : '💰 Prodáno za ' + value + ' grošů.');
                        Game.save();
                    }
                },
                {
                    label: cs ? '🗃️ Keep' : '🗃️ Uchovat',
                    type: 'default',
                    effect: function () { }
                }
            ]
        });
    },

    // ── Netolického pozůstalost — modal při nalezení nebo kliknutí ──────────
    showNetolickyModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'en';
        // Pokud hráč nemá item v inventáři, modal se nespustí
        NotificationSystem.modal({
            icon: '📜',
            title: cs ? "Netolický\'s Legacy" : 'Netolického pozůstalost',
            text: cs
                ? '<em>You break the old wax seal. The smell of the sixteenth century escapes — dust, ink, and something burnt.</em><br><br>"Brother Bartoloměj Netolický! For God\'s sake, come to thy senses! This gloomy day is thy very last chance..."<br><br><small>A half-charred document found beneath the floor of an old printing house on the Lesser Town.</small>'
                : '<em>Rozlomíš starou voskovou pečeť. Uniká zatuchlina šestnáctého století — prach, inkoust a něco spáleného.</em><br><br>„Bratře Bartoloměji Netolický! Probůh, vzpamatuj se! Dnešní pochmurný den je tvou naprosto poslední šancí..."<br><br><small>Napůl sežehlý dokument, nalezený pod podlahou staré tiskárny na Malé Straně.</small>',
            choices: [
                {
                    label: cs ? '📖 Study (+30 notes, unlock 7 scrolls)' : '📖 Prostudovat (+30 zápisků, 7 svitků)',
                    type: 'primary',
                    effect: function () {
                        Game.removeItem('netolicky_legacy', 1);
                        Game.addItem('research', 30);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockNetolickyFolios();
                        if (!GameState.unlockedRecipes) GameState.unlockedRecipes = [];
                        if (!GameState.unlockedRecipes.includes('ink_netolicky')) GameState.unlockedRecipes.push('ink_netolicky');
                        UI.notify(cs ? '📜 Netolický\'s legacy studied. +30 notes.' : '📜 Pozůstalost prostudována. +30 zápisků.');
                        Game.save();
                    }
                },
                {
                    label: cs ? '💰 Sell to Giacomo (+50 groschen)' : '💰 Prodat Giacomovi (+50 grošů)',
                    type: 'default',
                    effect: function () {
                        Game.removeItem('netolicky_legacy', 1);
                        Game.addItem('grosze', 50);
                        UI.notify(cs ? '💰 Giacomo paid 50 groschen for the document.' : '💰 Giacomo zaplatil 50 grošů za dokument.');
                        Game.save();
                    }
                },
                {
                    label: cs ? '🗃️ Keep for now' : '🗃️ Zatím uchovat',
                    type: 'default',
                    effect: function () { }
                }
            ]
        });
    },

    // ── Titivillus spis (Bestiář, Cesta B) — modal při nalezení nebo kliknutí ──
    showTitivillusSpisModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';
        NotificationSystem.modal({
            icon: '📜',
            title: isEn ? 'A Strange Note' : 'Podivný spis',
            text: isEn
                ? 'Among the clutter of the farmyard you find a half-decayed leaf. A sketch of a horned creature, a few Latin verses, a note in the margin — it looks like an old bestiary entry.'
                : 'Mezi haraburdím při úklidu hospodářství jsi narazil na polozetlelý list. Skica rohatého tvora, latinské verše, poznámka na okraji — vypadá to na starý bestiářský zápis.',
            choices: [
                {
                    label: isEn ? '📖 Open' : '📖 Otevřít',
                    type: 'primary',
                    effect: function () { LootModalManager.showTitivillusSpisContentModal(); }
                },
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'default',
                    effect: function () {
                        Game.removeItem('titivillus_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_titivillus_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                }
            ]
        });
    },

    // ── Obsah spisu (List 1+2 = folio lectio) — otevřeno z showTitivillusSpisModal ──
    showTitivillusSpisContentModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';
        NotificationSystem.modal({
            icon: '🐐',
            title: 'Titivillus',
            image: '/bestiary/titivillus.jpg',
            text: t('scrinium.folios.titivillus_bestiar.lectio'),
            choices: [
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'primary',
                    effect: function () {
                        Game.removeItem('titivillus_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_titivillus_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                },
                {
                    label: isEn ? '🗃️ Keep in storage' : '🗃️ Uchovat ve skladu',
                    type: 'default',
                    effect: function () { }
                }
            ]
        });
    },

    // ── Acedia spis (Bestiář, Cesta B) — modal při nalezení nebo kliknutí ──
    showAcediaSpisModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';
        NotificationSystem.modal({
            icon: '📜',
            title: isEn ? 'A Damp Page' : 'Vlhký list',
            text: isEn
                ? 'Wedged in the wattle wall, half-swollen with damp, you find a folded page you never put there. Someone once wrote down what it feels like when the day will not end.'
                : 'Zastrčený ve spáře proutěné stěny, napůl zvlhlý, ležel list, co jsi tam nedal ty. Někdo si kdysi zapsal, jaké to je, když den nechce skončit.',
            choices: [
                {
                    label: isEn ? '📖 Open' : '📖 Otevřít',
                    type: 'primary',
                    effect: function () { LootModalManager.showAcediaSpisContentModal(); }
                },
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'default',
                    effect: function () {
                        Game.removeItem('acedia_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_acedia_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                }
            ]
        });
    },

    showAcediaSpisContentModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';
        NotificationSystem.modal({
            icon: '😴',
            title: isEn ? 'Daemon Meridianus' : 'Daemon meridianus',
            image: '/bestiary/acedia.jpg',
            text: t('scrinium.folios.acedia_bestiar.lectio'),
            choices: [
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'primary',
                    effect: function () {
                        Game.removeItem('acedia_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_acedia_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                },
                {
                    label: isEn ? '🗃️ Keep in storage' : '🗃️ Uchovat ve skladu',
                    type: 'default',
                    effect: function () { }
                }
            ]
        });
    },

    // ── Belzebub spis (Bestiář, Cesta B) — modal při nalezení nebo kliknutí ──
    showBelzebubSpisModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';
        NotificationSystem.modal({
            icon: '🪰',
            title: isEn ? 'Among the Spoiled Stores' : 'Mezi zkaženými zásobami',
            text: isEn
                ? 'Amid the rot and the buzzing you find a page, stained but legible. Someone once wrote down what it means when neglect draws a swarm.'
                : 'Mezi hnilobou a bzučením ležel list, potřísněný, ale čitelný. Někdo si kdysi zapsal, co znamená, když zanedbání přivolá roj.',
            choices: [
                {
                    label: isEn ? '📖 Open' : '📖 Otevřít',
                    type: 'primary',
                    effect: function () { LootModalManager.showBelzebubSpisContentModal(); }
                },
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'default',
                    effect: function () {
                        Game.removeItem('belzebub_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_belzebub_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                }
            ]
        });
    },

    showBelzebubSpisContentModal: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';
        NotificationSystem.modal({
            icon: '🪰',
            title: isEn ? 'Beelzebub' : 'Belzebub',
            image: '/bestiary/belzebub.jpg',
            text: t('scrinium.folios.belzebub_bestiar.lectio'),
            choices: [
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'primary',
                    effect: function () {
                        Game.removeItem('belzebub_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_belzebub_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                },
                {
                    label: isEn ? '🗃️ Keep in storage' : '🗃️ Uchovat ve skladu',
                    type: 'default',
                    effect: function () { }
                }
            ]
        });
    },

    // MRD zahony-tiers — zasadit rovnou bez hnojiva, early-game friendly, nižší výnos (tier 0)
};