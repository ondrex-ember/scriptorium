const Game = {
    // ═══ D7: Scavenge/core actions — extrahováno do ScavengeManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)


    init: function () {
        Game.load();

        // Sync header sound icon s uloženým stavem (soundMuted) — bez tohoto
        // ikonka lhala po restartu, dokud hráč neklikl (viz toggleMute v audio.js)
        (function () {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const muted = !!(GameState.settings && GameState.settings.soundMuted);
            const btnBar = document.getElementById('sound-toggle-btn');
            if (btnBar) {
                btnBar.textContent = muted ? '🔇' : '🔊';
                btnBar.title = lang === 'en' ? 'Sound ON/OFF' : 'Zvuk ON/OFF';
            }
            const btnPill = document.getElementById('sound-toggle-pill-icon');
            if (btnPill) btnPill.textContent = muted ? '🔇' : '🔊';
        })();

        // --- INJEKCE CSS PRO HINT BTN-IGNITE ---
        (function () {
            const style = document.createElement('style');
            style.textContent = [
                '#btn-ignite.btn-ignite--hint, #btn-ignite-overlay.btn-ignite--hint {',
                '  position: relative;',
                '}',
                '#btn-ignite.btn-ignite--hint::after, #btn-ignite-overlay.btn-ignite--hint::after {',
                '  content: "\ud83d\udd25";',
                '  margin-left: 0.4em;',
                '  font-style: normal;',
                '  animation: hint-pulse 1.4s ease-in-out infinite;',
                '}',
                '@keyframes hint-pulse {',
                '  0%, 100% { opacity: 1; transform: scale(1); }',
                '  50%      { opacity: 0.55; transform: scale(1.25); }',
                '}'
            ].join('\n');
            document.head.appendChild(style);
        })();

        // --- 0. PRVNÍ NÁVŠTĚVA + VRACEJÍCÍ SE HRÁČ ---
        // Inicializace chybějících flagů pro staré savy
        if (GameState.flags.firstVisit === undefined) {
            // Starý save – hráč hrál dříve, není to první návštěva
            GameState.flags.firstVisit = false;
        }
        // Starý save – forceDark nemá smysl, hráč už hrál
        if (GameState.flags.forceDark === undefined) {
            GameState.flags.forceDark = false;
        }
        if (!GameState.lastSeen) {
            GameState.lastSeen = 0;
        }

        // Přejmenování mlyn→mill (16.8.2026, anglifikace názvů) — OPRAVA:
        // dřív žilo uvnitř buildStorage(type), co se spustí jen při KLIKNUTÍ
        // na stavbu — u už hotovýho mlýna se to nikdy nezavolalo, migrace
        // nikdy neproběhla. Teď běží tady, mirror firstVisit/forceDark vzoru
        // výš — jednou za načtení hry, bez ohledu na hráčovu akci.
        if (!GameState.storage) GameState.storage = {};
        if (GameState.storage.mlyn && !GameState.storage.mill) {
            const oldMlyn = GameState.storage.mlyn;
            GameState.storage.mill = {
                tier: oldMlyn.tier,
                buildUntil: oldMlyn.buildUntil,
                buildTargetTier: oldMlyn.buildTargetTier,
                millwrightHireUntil: oldMlyn.sekernikHireUntil,
                millwrightReadyForTier: oldMlyn.sekernikReadyForTier,
                millwrightHireForTier: oldMlyn.sekernikHireForTier,
            };
            delete GameState.storage.mlyn;
        }

        // Oprava duplicitních bratrů (18.8.2026) — Dormitorium III má kapacitu
        // 10, ale roster měl dřív jen 5 postav. hireBrother() při vyčerpání
        // rosteru fallback povolil duplicitu (bratr #6-10 dostal jméno/lore
        // už najatého bratra). Roster teď má 10 unikátů — tahle migrace jen
        // PŘEJMENUJE existující duplicity na volné rosterId, jednou za
        // načtení, idempotentní (druhý běh nenajde co opravovat). Traits/xp/
        // fatigue/loyalty/assignedTab beze změny — mění se jen identita
        // (rosterId+name), ne nahraná herní čísla.
        if (GameState.dormitorium && Array.isArray(GameState.dormitorium.brothers)
            && typeof DormitoriumRosterDB !== 'undefined') {
            const brothers = GameState.dormitorium.brothers;
            const usedIds = new Set(brothers.map(b => b.rosterId).filter(Boolean));
            const seen = new Set();
            const byHireOrder = brothers.filter(b => b.rosterId).sort((a, b) => (a.hiredAt || 0) - (b.hiredAt || 0));
            byHireOrder.forEach(b => {
                if (!seen.has(b.rosterId)) {
                    seen.add(b.rosterId); // nejstarší nositel jména si ho drží
                } else {
                    const freeId = Object.keys(DormitoriumRosterDB).find(rid => !usedIds.has(rid));
                    if (freeId) {
                        usedIds.add(freeId);
                        b.rosterId = freeId;
                        b.name = DormitoriumRosterDB[freeId].name;
                    }
                }
            });
        }

        const _nowInit = Date.now();
        const _daysSinceLastSeen = GameState.lastSeen > 0
            ? (_nowInit - GameState.lastSeen) / (1000 * 60 * 60 * 24)
            : 0;

        if (GameState.flags.firstVisit) {
            // NOVÝ HRÁČ – nejdřív výběr jazyka (pokud ještě nebyl zvolen)
            if (!GameState.settings.langChosen) {
                // Lang picker se zobrazí — init pokračuje dál (renderAll atd.)
                // Modal chain (consent + welcome) spustí pickLanguage() → afterLangPicked()
                setTimeout(() => UI.showLangPicker(), 300);
                // NEPŘERUŠUJEME — init musí doběhnout (zápisníky, theme, renderAll...)
            } else {
                // Jazyk byl zvolen – consent banner řídí ConsentManager._afterDecision()
                const consent = localStorage.getItem('scriptorium_consent');
                if (consent !== null) {
                    // Consent již rozhodnut – spustit intro normálně
                    setTimeout(() => {
                        UI.showWelcomeModal();
                        GameState.flags.firstVisit = false;
                        Game.save();
                    }, 800);
                }
                // Pokud consent === null – banner se zobrazí, intro počká na _afterDecision()
            }

        } else if (_daysSinceLastSeen >= 3 && GameState.flags.fireplaceLit) {
            // VRACEJÍCÍ SE PO 3+ DNECH – krb vyhasíná
            GameState.flags.fireplaceLit = false;
            GameState.flags.candleLit = false;
            GameState.flags.torchLit = false;
            // Přidat troud pokud ho nemá (aby mohl znovu zapálit)
            if ((GameState.inventory['tinderbox'] || 0) <= 0) {
                GameState.inventory['tinderbox'] = 1;
            }
            setTimeout(() => UI.showFireoutModal(_daysSinceLastSeen), 600);
        }

        // --- 0b. KRONIKA (init guard) ---
        if (!GameState.kronika) GameState.kronika = [];
        if (GameState.flags.firstVisit && GameState.kronika.length === 0) {
            Game.addKronikaEntry('important',
                'Scriptorium fundatum est.',
                'The scriptorium has been founded.',
                'Scriptorium fundatum est.'
            );
        }

        // --- 0c. KRONIKA buffer init + denní flush ---
        if (!GameState.kronikaCraftBuffer) GameState.kronikaCraftBuffer = { date: '', crafts: {} };
        if (!GameState.kronikaDailyBuffer) GameState.kronikaDailyBuffer = { date: '', gains: {} };
        const _todayStr = new Date().toISOString().slice(0, 10);
        if (GameState.kronikaDailyBuffer.date && GameState.kronikaDailyBuffer.date !== _todayStr) {
            Game.kronikaFlushBuffer(); // Nový den — zapsat včerejší gains
            Game.kronikaCraftFlushBuffer(); // Nový den — zapsat včerejší crafty
        }
        if (!GameState.kronikaDailyBuffer.date) GameState.kronikaDailyBuffer.date = _todayStr;

        // --- 1. ZÁPISNÍKY (Přidání do hlavního savu) ---
        if (!GameState.notebooks) {
            GameState.notebooks = {
                migrated: false,
                tabula: [],
                adversaria: [],
                vademecum: [],
                florilegium: [],
                enchiridion: { recipes: [], strategies: [], journal: [], goals: [] }
            };
        }
        GameState.notebooks.tabula = []; // Vosková destička se smaže vždy po probuzení

        // --- 2. I-CHING (Sjednocení dat) ---
        if (!GameState.iching) {
            GameState.iching = {
                lastCast: 0,
                effect: null,
                lastHexagram: null
            };
        }
        if (!GameState.flags.fireplaceLit && (GameState.inventory['tinderbox'] || 0) <= 0) {
            GameState.inventory['tinderbox'] = 1;
        }

        // Migrace hunger → Vigor systém v2
        if (GameState.hunger && typeof GameState.satiety === 'undefined') {
            GameState.satiety = GameState.hunger.fed ? 70 : 20;
        }
        if (GameState.hunger) delete GameState.hunger;
        if (typeof GameState.satiety === 'undefined') GameState.satiety = 80;
        if (typeof GameState.fatigue === 'undefined') GameState.fatigue = 0;

        // Migrace wheat_grain/rye_grain → _2 varianta (systém kvality zrna)
        if (GameState.inventory['wheat_grain']) {
            GameState.inventory['wheat_grain_2'] = (GameState.inventory['wheat_grain_2'] || 0) + GameState.inventory['wheat_grain'];
            delete GameState.inventory['wheat_grain'];
        }
        if (GameState.inventory['rye_grain']) {
            GameState.inventory['rye_grain_2'] = (GameState.inventory['rye_grain_2'] || 0) + GameState.inventory['rye_grain'];
            delete GameState.inventory['rye_grain'];
        }

        // Migrace zahrady na novou strukturu (14 slotů)
        // Starý save (≤4 sloty) → doplnit na novou strukturu
        const _gardenTarget = [
            { cropType: 'herb' }, { cropType: 'herb' },
            { cropType: 'herb', locked: true }, { cropType: 'herb', locked: true },
            { cropType: 'vegetable', locked: true }, { cropType: 'vegetable', locked: true },
            { cropType: 'vegetable', locked: true }, { cropType: 'vegetable', locked: true },
            { cropType: 'special', locked: true }, { cropType: 'special', locked: true },
            { cropType: 'vegetable', locked: true }, { cropType: 'vegetable', locked: true },
            { cropType: 'vegetable', locked: true }, { cropType: 'vegetable', locked: true },
        ];
        while (GameState.garden.length < _gardenTarget.length) {
            const tpl = _gardenTarget[GameState.garden.length];
            GameState.garden.push({ state: 0, water: false, crop: null, plantedAt: 0, cropType: tpl.cropType, locked: !!tpl.locked });
        }

        // Add cropType to existing plots if missing
        GameState.garden.forEach((plot, idx) => {
            if (!plot.cropType) {
                if (idx === 0 || idx === 1) plot.cropType = 'herb';
                else if (idx === 2) plot.cropType = 'vegetable';
                else if (idx === 3) plot.cropType = 'special';
                else if (idx === 4 || idx === 5) plot.cropType = 'herb';
                else plot.cropType = 'vegetable';
            }
            if (plot.locked === undefined) {
                plot.locked = (idx >= 2);
            }
        });

        // Initialize discoveredLore if not present
        if (!GameState.discoveredLore) {
            GameState.discoveredLore = [];
        }

        // Initialize dailyRewards if not present
        if (!GameState.dailyRewards) {
            GameState.dailyRewards = {
                lastLogin: 0,
                streak: 0,
                lastBonusClaimed: 0,
                totalLogins: 0
            };
        }

        // Initialize achievements if not present
        if (!GameState.achievements) {
            GameState.achievements = {
                unlocked: [],
                stats: {
                    // Crafting & Resources
                    itemsCrafted: 0,
                    itemsDiscovered: 0,
                    harvests: 0,
                    researchCount: 0,
                    totalResearchGained: 0,

                    // Survival
                    fireplaceCount: 0,
                    daysWithFire: 0,
                    daysWithoutHunger: 0,
                    mealsEaten: 0,
                    candlesLit: 0,

                    // Actions
                    actionsCompleted: 0,
                    actionsFailed: 0,

                    // Games
                    memoryGamesWon: 0,
                    urGamesWon: 0,
                    primeroGamesWon: 0,
                    karnoffelGamesWon: 0,
                    freecellGamesWon: 0,
                    rithmoGamesWon: 0,
                    totalGamesPlayed: 0,

                    // Spiritual
                    hoursAttended: 0,
                    ichingCasts: 0,

                    // Well
                    wellUses: 0,
                    wellCleans: 0,

                    // Max Values
                    maxInventoryItems: 0,
                    maxResearchHeld: 0,
                    longestStreak: 0
                }
            };
        }

        // Migration for old saves
        if (GameState.achievements && !GameState.achievements.stats.totalGamesPlayed) {
            Object.assign(GameState.achievements.stats, {
                totalResearchGained: GameState.achievements.stats.researchCount || 0,
                mealsEaten: 0,
                candlesLit: 0,
                actionsCompleted: 0,
                actionsFailed: 0,
                memoryGamesWon: 0,
                urGamesWon: 0,
                primeroGamesWon: 0,
                karnoffelGamesWon: 0,
                freecellGamesWon: 0,
                rithmoGamesWon: 0,
                totalGamesPlayed: 0,
                hoursAttended: 0,
                ichingCasts: 0,
                wellUses: 0,
                wellCleans: 0,
                maxInventoryItems: 0,
                maxResearchHeld: 0,
                longestStreak: GameState.dailyRewards?.streak || 0
            });
        }

        // Initialize library if not present
        if (!GameState.library) {
            GameState.library = {
                startDate: Date.now(),
                unlockedBooks: [],
                readBooks: [],
                acquisitionDates: {},
                protection: {},
                bookCondition: {},
                conditionLastTick: 0,
                loanedBooks: {},
                loanHistory: [],
                scribeState: {
                    visited: false,
                    totalTrades: 0,
                    lastTrade: 0,
                    lastTopicAt: 0,
                    askedTopics: [],
                    aiQuota: { count: 0, resetAt: 0 }
                }
            };
        }
        // Migrace: existující save nemá readingTimer (eye_strain, monastery-decay-mrd)
        if (typeof GameState.library.readingTimer === 'undefined') GameState.library.readingTimer = null;
        // Migrace: existující save nemá lastTopicAt/askedTopics (Bartoloměj — 30 témat, MRD krok 4/5)
        if (GameState.library.scribeState && typeof GameState.library.scribeState.lastTopicAt === 'undefined') {
            GameState.library.scribeState.lastTopicAt = 0;
        }
        if (GameState.library.scribeState && !GameState.library.scribeState.askedTopics) {
            GameState.library.scribeState.askedTopics = [];
        }
        // Migrace: existující save nemá aiQuota (Bartoloměj — živý rozhovor, AI guardrails MRD)
        if (GameState.library.scribeState && !GameState.library.scribeState.aiQuota) {
            GameState.library.scribeState.aiQuota = { count: 0, resetAt: 0 };
        }
        // Migrace: existující save nemá infirmaryTimer (titivillus-infirmary-mrd)
        if (typeof GameState.infirmaryTimer === 'undefined') GameState.infirmaryTimer = null;
        // Initialize well if not present (přesun do WellSystem._ensureState)
        WellSystem._ensureState();

        // Initialize storage buildings
        if (!GameState.storage) {
            GameState.storage = { almarium: { built: false }, cella: { built: false }, horreum: { built: false } };
        }

        // Initialize feeding system
        if (!GameState.feeding) GameState.feeding = {};

        // Migrace abbotPetition (nové savy + staré savy)
        if (!GameState.abbotPetition) {
            GameState.abbotPetition = {
                fodina: { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false },
                fornax: { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false },
            };
        }
        if (!GameState.abbotPetition.fodina) GameState.abbotPetition.fodina = { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false };
        if (!GameState.abbotPetition.fornax) GameState.abbotPetition.fornax = { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false };
        if (!GameState.abbotPetition.domus_ii) GameState.abbotPetition.domus_ii = { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false };
        // dilny-pozemky-mrd.md v0.3 — Furnus, první ze čtyř dílen (25.8.2026)
        if (!GameState.abbotPetition.furnus) GameState.abbotPetition.furnus = { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false };
        if (!GameState.abbotPetition.land_dvur_pekarsky) GameState.abbotPetition.land_dvur_pekarsky = { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false };
        if (!GameState.ubytovnaPetition) GameState.ubytovnaPetition = {};
        // Vyhodnotit čekající žádosti po načtení
        Game.checkAbbotPetitions();
        Game.checkUbytovnaPetitions();
        Game.checkGuildPetitions();
        // Dashboard historie/vývoj/šipky (MRD v0.5 §2) — denní snapshot vztahu.
        // Vlastní dedup uvnitř (last.day === gameDay), bezpečné volat víckrát/den.
        if (typeof recordGuildRelationSnapshot === 'function') {
            recordGuildRelationSnapshot(new Date().toISOString().slice(0, 10));
        }
        Game.checkLandParcels();
        Game.checkMillBuildComplete();
        Game.checkMillwrightHireComplete();
        // Krok B — vážený denní report Clientela↔Chronicon vztahů (mirror registrum)
        if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._reportContactRelationIfNewDay) {
            ChroniconSystem._reportContactRelationIfNewDay();
        }

        // CONVERSI — holý skelet (jméno + slot, bez úkolů zatím)
        if (!GameState.conversi) GameState.conversi = [];

        // DORMITORIUM — bratři (mniši/skriptoři, manažerská vrstva nad Conversi)
        if (!GameState.dormitorium) GameState.dormitorium = { brothers: [] };
        if (!GameState.dormitorium.brothers) GameState.dormitorium.brothers = [];
        // Migrace: bratři najatí před monk-attributes-mrd nemají traits/mood/
        // loyalty/stress/temptation — doplnit start hodnotou 0 (konzistentně
        // s hireBrother — všichni bratři začínají na 0, rostou jen prací).
        GameState.dormitorium.brothers.forEach(b => {
            if (typeof b.mood !== 'number') b.mood = 60;
            if (typeof b.loyalty !== 'number') b.loyalty = 30;
            if (typeof b.stress !== 'number') b.stress = 0;
            if (typeof b.temptation !== 'number') b.temptation = 0;
            // monk-hunger-mrd — mniši teď taky jedí (0.5x konvrš, dle Askeze).
            if (typeof b.mealAccumulator !== 'number') b.mealAccumulator = 0;
            if (typeof b.unfedStreak !== 'number') b.unfedStreak = 0;
            if (!b.traits) {
                b.traits = {
                    piety: 0, obedience: 0, asceticism: 0, erudition: 0,
                    focus: 0, craftsmanship: 0, eloquence: 0, vigor: 0,
                };
            }
            // Jednorázová oprava: bratři z KRÁTKÉHO mezidobí, kdy migrace
            // nastavovala start na 40 místo 0 (způsobovalo start rovnou na
            // úrovni 2/4 kvůli prahu 30) — pokud má bratr VŠECH 8 vlastností
            // přesně 40 (tedy nenapracovaných, jen z té staré migrace) a
            // zároveň neprošel XP migrací níže, vrátit na 0.
            if (!b.traits40FixApplied) {
                b.traits40FixApplied = true;
                const allDefault40 = Object.values(b.traits).every(v => v === 40);
                if (allDefault40 && !b.xpMigratedToTraits) {
                    Object.keys(b.traits).forEach(k => { b.traits[k] = 0; });
                }
            }
            // Jednorázová migrace starého xp[tabId] (dormitoriumAddXp, +1/tick)
            // na body primární vlastnosti (nový systém, +2/tick) — proveden JEN
            // jednou (flag xpMigratedToTraits), ať se při každém načtení hry
            // znovu nesčítá. Bezpečné i pro bratry bez xp (forEach na {} je no-op).
            if (!b.xpMigratedToTraits) {
                b.xpMigratedToTraits = true;
                if (b.xp && this.DORMITORIUM_TAB_TRAITS) {
                    Object.keys(b.xp).forEach(tabId => {
                        const map = this.DORMITORIUM_TAB_TRAITS[tabId];
                        const oldXp = b.xp[tabId] || 0;
                        if (map && oldXp > 0 && (b.traits[map.primary] === 40 || b.traits[map.primary] === 0)) {
                            // Starý +1/tick → nový systém +2/tick primární, +1/tick sekundární
                            // (báze 0, ne 40 — konzistentní s opravenou startovní hodnotou)
                            b.traits[map.primary] = Math.min(100, b.traits[map.primary] + oldXp * 2);
                            if (typeof b.traits[map.secondary] === 'number') {
                                b.traits[map.secondary] = Math.min(100, b.traits[map.secondary] + oldXp);
                            }
                        }
                    });
                }
            }
        });

        // Initialize tool uses tracking
        if (!GameState.toolUses) GameState.toolUses = {};

        // pyl-bee-bread-mrd (20.8.2026): úl teď dává rovnou Bee bread místo
        // Pylu — jednorázově převeď nahromaděný Pyl u existujících hráčů
        // poměrem 10:1 (stejný poměr jako recept bee_bread_from_pollen).
        if (!GameState.flags.pollenToBeeBreadMigrated) {
            GameState.flags.pollenToBeeBreadMigrated = true;
            const oldPollen = GameState.inventory['pollen'] || 0;
            if (oldPollen > 0) {
                const converted = Math.floor(oldPollen / 10);
                if (converted > 0) GameState.inventory['bee_bread'] = (GameState.inventory['bee_bread'] || 0) + converted;
                GameState.inventory['pollen'] = oldPollen % 10;
            }
        }

        // Migrate guard — doplnit chybějící unlocks ze všech již odemčených techů
        if (typeof TechTree !== 'undefined' && GameState.researchedTechs) {
            GameState.researchedTechs.forEach(techId => {
                const tech = TechTree.find(t => t.id === techId);
                if (!tech || !tech.unlocks) return;
                tech.unlocks.forEach(rid => {
                    if (!GameState.unlockedRecipes.includes(rid)) {
                        GameState.unlockedRecipes.push(rid);
                    }
                });
            });
        }

        // Initialize henhouse (Gallinarium)
        if (!GameState.henhouse) {
            GameState.henhouse = {
                built: false,
                hens: [],
                rooster: false,
                nesting: null,
                chickPool: 0,
                lastEggAt: 0,
                lastFeatherAt: 0,
                lastFedAt: 0
            };
        }

        // Initialize sheepfold (Ovile)
        if (!GameState.sheepfold) {
            GameState.sheepfold = {
                built: false,
                sheep: 0,
                breeding: null,
                lambPool: 0,
                lastMilkAt: 0,
                lastWoolAt: 0,
                lastFedAt: 0,
                lastWateredAt: 0
            };
        }

        // Initialize piscina (Rybník)
        if (!GameState.piscina) {
            GameState.piscina = {
                tier: 0,
                fish: [],
                fry: 0,
                youngCarp: 0,
                carp: 0,
                lastFedAt: 0,
                fryAddedAt: 0,
                youngAddedAt: 0,
                lastFryProductionAt: 0,
                pendingFry: 0,
            };
        }

        // Migrace na entitní model rybníku (Piscina rework Sprint 1) —
        // staré save nemají fish[], převedeme dosavadní počty na řádky.
        if (GameState.piscina && !GameState.piscina.fish) {
            GameState.piscina.fish = [];
            const migNow = Date.now();
            if (GameState.piscina.fry > 0) {
                GameState.piscina.fish.push({ id: 'mig_fry', species: 'kapr', stage: 'fry', qty: GameState.piscina.fry, enteredStageAt: GameState.piscina.fryAddedAt || migNow });
            }
            if (GameState.piscina.youngCarp > 0) {
                GameState.piscina.fish.push({ id: 'mig_young', species: 'kapr', stage: 'young', qty: GameState.piscina.youngCarp, enteredStageAt: GameState.piscina.youngAddedAt || migNow });
            }
            if (GameState.piscina.carp > 0) {
                GameState.piscina.fish.push({ id: 'mig_adult', species: 'kapr', stage: 'adult', qty: GameState.piscina.carp, enteredStageAt: migNow });
            }
        }

        // Initialize theme settings if not present
        if (!GameState.settings.theme) {
            GameState.settings.theme = 'default';
        }
        if (GameState.settings.autoTheme === undefined) {
            GameState.settings.autoTheme = false;
        }

        // Fire volume default (v7.9)
        if (GameState.settings.fireVolume === undefined) {
            GameState.settings.fireVolume = 0.5;  // 50% default
        }

        // Music defaults (v8.x)
        if (GameState.settings.musicEnabled === undefined) {
            GameState.settings.musicEnabled = true;
        }
        if (GameState.settings.musicVolume === undefined) {
            GameState.settings.musicVolume = 0.5;
        }

        // Language default + URL param detection (i18n)
        if (!GameState.settings.language) {
            GameState.settings.language = 'cs';
        }
        if (GameState.settings.langChosen === undefined) {
            // Starý save = hráč hrál v CZ, považujeme za zvoleno
            GameState.settings.langChosen = !GameState.flags.firstVisit;
        }
        // ?lang=en in URL overrides saved setting (bookmarkable EN link)
        const _urlLang = new URLSearchParams(window.location.search).get('lang');
        if (_urlLang === 'en' || _urlLang === 'cs') {
            GameState.settings.language = _urlLang;
            GameState.settings.langChosen = true;
        }
        LangSystem.apply(GameState.settings.language);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (el) el.innerHTML = t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            if (el) el.title = t(el.getAttribute('data-i18n-title'));
        });

        // Initialize weather system FIRST (needed by auto-theme)
        WeatherSystem.init();

        // Initialize theme system (may depend on weather)
        ThemeSystem.init();
        HeaderImageSystem.init();

        // Initialize notebook system
        NotebookSystem.init();

        // v7.5: Initialize Canonical Hours system
        CanonicalHours.init();

        // v8.0: Initialize new systems BEFORE renderAll (GameState must be ready)
        RankSystem.init();
        VigorSystem.init();
        if (typeof IncenseSystem !== 'undefined') IncenseSystem.init();
        CellariumSystem.init();
        PersonaSystem.init();
        SecretsSystem.init();
        AthanorSystem.init();
        NotificationSystem.init();
        if (typeof TutorialSystem !== 'undefined') TutorialSystem.init();
        // ChroniconSystem startuje fetch jen pokud je jazyk už definitivně
        // zvolen (vracející se hráč). Pro nového hráče se spustí až po
        // kliknutí v jazykovém pickeru (viz UI.pickLanguage) — jinak by
        // fetch mohl doběhnout dřív/později než volba jazyka a vznikl by
        // nedeterministický mix CS/EN textů v kanálu zpráv.
        if (GameState.settings.langChosen) {
            ChroniconSystem.init();
        }

        // NOW render UI (after theme is set and all systems initialized)
        UI.renderAll();
        if (typeof AbbotSystem !== 'undefined' && AbbotSystem.renderPill) AbbotSystem.renderPill();
        Game.checkEnvironment();
        // Templum — viditelnost tabu hned při loadu (dřív jen po kliku na jiný tab / až 60s tick)
        if (typeof TemplumSystem !== 'undefined' && TemplumSystem.updateTabVisibility) TemplumSystem.updateTabVisibility();
        // Infirmarium — viditelnost tabu hned při loadu
        if (typeof InfirmariumSystem !== 'undefined' && InfirmariumSystem.updateTabVisibility) InfirmariumSystem.updateTabVisibility();

        VigorSystem.renderMiniDisplay();

        // Consent banner – musí být až po načtení UI
        ConsentManager.init();

        // Update time display AFTER UI is rendered
        TimeSys.update();

        // Check daily reward AFTER UI render (only from 2nd session onwards)
        setTimeout(() => {
            if (!GameState.flags.firstVisit) {
                Game.checkDailyReward();
            }
            if (typeof CalendarSystem !== 'undefined') CalendarSystem.checkCalendarEvents();
            if (typeof CalendarSystem !== 'undefined' && CalendarSystem.renderPill) CalendarSystem.renderPill();
        }, 500);

        document.body.addEventListener('click', () => {
            if (!audioSys) audioSys = new AudioSystem();
            audioSys.start(); // resume + fire + music handled in _startAfterResume()

            // Sync music UI controls (DOM — nepotřebuje čekat na audio resume)
            const musicChk = document.getElementById('music-enabled-checkbox');
            if (musicChk) musicChk.checked = (GameState.settings.musicEnabled !== false);
            const musicSlider = document.getElementById('music-volume-slider');
            if (musicSlider) musicSlider.value = Math.round((GameState.settings.musicVolume ?? 0.5) * 100);
        }, { once: true });

        // ========== NEW: Hour chime event listeners ==========
        const hourChimeBasic = document.getElementById('hour-chime-basic');
        if (hourChimeBasic) {
            hourChimeBasic.addEventListener('change', (e) => {
                GameState.settings.hourChimeBasic = e.target.checked;
                Game.save();
            });
        }

        document.querySelectorAll('input[name="chimeMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                GameState.settings.hourChimeMode = e.target.value;
                Game.save();
            });
        });

        const chimeSound = document.getElementById('chime-sound');
        if (chimeSound) {
            chimeSound.addEventListener('change', (e) => {
                GameState.settings.hourChimeSound = e.target.value;
                Game.save();
            });
        }

        const quietEnabled = document.getElementById('quiet-hours-enabled');
        if (quietEnabled) {
            quietEnabled.addEventListener('change', (e) => {
                GameState.settings.quietHoursEnabled = e.target.checked;
                Game.save();
            });
        }

        const quietStart = document.getElementById('quiet-hours-start');
        if (quietStart) {
            quietStart.addEventListener('change', (e) => {
                GameState.settings.quietHoursStart = parseInt(e.target.value);
                Game.save();
            });
        }

        const quietEnd = document.getElementById('quiet-hours-end');
        if (quietEnd) {
            quietEnd.addEventListener('change', (e) => {
                GameState.settings.quietHoursEnd = parseInt(e.target.value);
                Game.save();
            });
        }

        // Time update with error protection
        let _tickCounter = 0;
        setInterval(() => {
            try {
                TimeSys.update();
                if (typeof FireplaceSystem !== 'undefined') FireplaceSystem.tick();
                if (typeof ScriptoriumCat !== 'undefined') ScriptoriumCat.warmthTick();
                if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem.localWorldTick) ChroniconSystem.localWorldTick();
                Game.checkEnvironment();

                // Anti-grind cooldown countdown — obnov scavenge/mine tlačítka jen
                // dokud cooldown běží (levné, žádný dopad mimo tento stav).
                if (GameState.scavengeCooldownUntil) {
                    if (Date.now() < GameState.scavengeCooldownUntil) {
                        if (typeof UI !== 'undefined' && UI.renderActions) UI.renderActions();
                        if (typeof UI !== 'undefined' && UI.renderMineActions) UI.renderMineActions();
                    } else {
                        GameState.scavengeCooldownUntil = null;
                        if (typeof UI !== 'undefined' && UI.renderActions) UI.renderActions();
                        if (typeof UI !== 'undefined' && UI.renderMineActions) UI.renderMineActions();
                    }
                }

                // eye_strain — 6h čtecí odpočet countdown (monastery-decay-mrd).
                // Jen re-render, dokud timer běží a Knihovna je zrovna otevřená
                // (element existuje) — levné, žádný dopad mimo tento stav.
                if (GameState.library && GameState.library.readingTimer) {
                    if (document.getElementById('library-books-content') && typeof UI !== 'undefined' && UI.renderLibrary) {
                        UI.renderLibrary();
                    }
                }

                // Vodní mlýn — mletí countdown (mlynar-vlastni-mlyn-mrd.md §4.10,
                // 19.8.2026). Stejný vzor jako eye_strain výš: re-render jen dokud
                // zakázka běží a panel je zrovna otevřenej.
                if (GameState.storage && GameState.storage.mill && GameState.storage.mill.grindOrder) {
                    const _millEl = document.getElementById('home-mill-content');
                    if (_millEl && typeof MillSystem !== 'undefined' && MillSystem.render) {
                        _millEl.innerHTML = MillSystem.render();
                    }
                }

                // Infirmerie — 24h léčebný odpočet (titivillus-infirmary-mrd).
                // Self-guarded uvnitř checkInfirmaryTimer, jen kontroluje čas.
                if (typeof HealthSystem !== 'undefined' && HealthSystem.checkInfirmaryTimer) {
                    HealthSystem.checkInfirmaryTimer();
                    // Countdown tick — re-render Valetudo, jen když je zrovna
                    // otevřený (viditelný), levné, žádný dopad mimo tento stav.
                    if (GameState.infirmaryTimer) {
                        const valetudoEl = document.getElementById('persona-subtab-valetudo');
                        if (valetudoEl && valetudoEl.style.display !== 'none'
                            && typeof PersonaSystem !== 'undefined' && PersonaSystem.render) {
                            PersonaSystem.render();
                        }
                    }
                }

                // Terrain — regen únavy krajiny (self-guarded 10 min)
                if (typeof TerrainSystem !== 'undefined') TerrainSystem.tick();
                if (typeof CuriaSystem !== 'undefined') CuriaSystem.tick();
                if (typeof MineSystem !== 'undefined') MineSystem.tick();
                // Obnova countdown zobrazení u Terrain/Curia ukazatelů (jen když je Pracovna
                // otevřená a regen skutečně běží — levné, žádný dopad mimo tento stav).
                if (document.getElementById('workspace-actions')) {
                    const _tf = (GameState.terrain && GameState.terrain.fatigue) || 0;
                    const _cf = (GameState.curia && GameState.curia.fatigue) || 0;
                    if (_tf > 20 || _cf > 20) {
                        if (typeof UI !== 'undefined' && UI.renderActions) UI.renderActions();
                    }
                }
                // Totéž pro Mine ukazatel (Doly — oddělený panel od workspace-actions)
                if (document.getElementById('mine-actions')) {
                    const _mf = (GameState.mine && GameState.mine.fatigue) || 0;
                    if (_mf > 20) {
                        if (typeof UI !== 'undefined' && UI.renderMineActions) UI.renderMineActions();
                    }
                }
                // Obnova countdown zobrazení u probíhající akce (scavenge i mine) —
                // renderActions/renderMineActions se jinak volají jen po kliku,
                // countdown by jinak zůstal zamrzlý do dalšího přepnutí tabu.
                // MUSÍ být v sekundovém scope (ne v _tickCounter>=60 bloku),
                // jinak se countdown hýbe jen jednou za minutu.
                if (GameState.activeAction) {
                    if (document.getElementById('workspace-actions') && typeof UI !== 'undefined' && UI.renderActions) UI.renderActions();
                    if (document.getElementById('mine-actions') && typeof UI !== 'undefined' && UI.renderMineActions) UI.renderMineActions();
                }

                // Obnova progress baru u rozjetých Vaření procesů — CookingSystem.render()
                // se jinak volá jen po kliku/přepnutí tabu, % a "zbývá Xh" by jinak
                // zůstaly zamrzlé do dalšího přepnutí. Stejný vzor jako activeAction výše.
                if (GameState.cookingInstances && GameState.cookingInstances.length > 0) {
                    const _cookEl = document.getElementById('home-cooking-content');
                    if (_cookEl && _cookEl.offsetParent !== null && typeof CookingSystem !== 'undefined' && CookingSystem.render) {
                        _cookEl.innerHTML = CookingSystem.render();
                    }
                }

                // v7.5: Check canonical hours
                CanonicalHours.checkCurrentHour();
                // Kalendářní eventy: CalendarSystem.checkCalendarEvents() (game.js:652)
                // je jediná autorita — EventsSystem.checkEvents() zrušeno (kalendar-widget-mrd.md §0)
                // CHRONICON advisory eventy — stejná kadence
                if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem.checkPendingAdvisory) ChroniconSystem.checkPendingAdvisory();
                // v8.1: Giacomo weekly check (once per minute)
                _tickCounter++;
                if (_tickCounter >= 60) {
                    _tickCounter = 0;
                    CellariumSystem.checkGiacomoEvent();
                    CellariumSystem.checkStationariusEvent();
                    CellariumSystem.checkCowRestock();
                    // v8.x: Orchard growing → mature transition
                    Game.checkOrchardGrowth();
                    if (typeof GardenSystem !== 'undefined') GardenSystem.checkFieldGrowth();
                    if (typeof GardenSystem !== 'undefined') GardenSystem.checkVineaGrowth();
                    // Felis Monastica — denní tick (self-guarded 24h)
                    if (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.dailyTick) ScriptoriumCat.dailyTick();
                    // FarmyardSystem — mood tick (self-guarded 24h)
                    if (typeof FarmyardSystem !== 'undefined' && FarmyardSystem.moodTick) FarmyardSystem.moodTick();
                    // Volné stádo — denní ubývání nasyslených/neumístěných zvířat (self-guarded 24h)
                    if (typeof FarmyardSystem !== 'undefined' && FarmyardSystem.looseHerdDailyTick) FarmyardSystem.looseHerdDailyTick();
                    // Cestující opat — self-guarded ~3 dny (abbot-travel-mrd, 9.8.2026)
                    if (typeof AbbotSystem !== 'undefined' && AbbotSystem.locationTick) AbbotSystem.locationTick();
                    // Nástupnictví opata — detekce změny identity z Chronicon snapshotu (opat-nastupnictvi-mrd, 15.8.2026)
                    if (typeof AbbotSystem !== 'undefined' && AbbotSystem.checkSuccession) AbbotSystem.checkSuccession();
                    // Myší populace — denní tick spawn/mortality/scraps (self-guarded 24h)
                    if (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.miceTick) ScriptoriumCat.miceTick();
                    // Decay — denní kažení zásob (self-guarded 24h, gate tech_inventarium)
                    if (typeof DecaySystem !== 'undefined' && DecaySystem.dailyTick) DecaySystem.dailyTick();
                    // Vitrea — startovní pool (jednorázově) + denní opotřebení vybavení (self-guarded 24h)
                    if (typeof Game !== 'undefined' && Game.vitreaGrantStartPool) { Game.vitreaGrantStartPool(); Game.vitreaWearTick(); }
                    // Templum — viditelnost tabu dle mnišského ranku (levný DOM check)
                    if (typeof TemplumSystem !== 'undefined' && TemplumSystem.updateTabVisibility) TemplumSystem.updateTabVisibility();
                    // Infirmarium — viditelnost tabu dle tech_infirmarium (levný DOM check)
                    if (typeof InfirmariumSystem !== 'undefined' && InfirmariumSystem.updateTabVisibility) InfirmariumSystem.updateTabVisibility();
                    // Templum — denní chod kostela (self-guarded 24h, gate frater+)
                    if (typeof Game !== 'undefined' && Game.templumDailyTick) Game.templumDailyTick();
                    // Templum — týdenní zpověď (self-guarded, gate frater+)
                    if (typeof Game !== 'undefined' && Game.templumConfessionTick) Game.templumConfessionTick();
                    // monastery-decay-mrd — denní kontrola nemocí (rheumatism/scurvy/gout/lice/scabies)
                    if (typeof Game !== 'undefined' && Game.healthConditionsDailyTick) Game.healthConditionsDailyTick();
                    // Visitatio — biskupská vizitace (guard na flags.visitatioAt)
                    if (typeof Game !== 'undefined' && Game.visitatioTick) Game.visitatioTick();
                    // Rank — mnišský postup (pure čtení podmínek, levné)
                    if (typeof RankSystem !== 'undefined' && RankSystem.checkMonasticProgress) RankSystem.checkMonasticProgress();
                    // Rank — světský postup (stejný vzor, dřív jen na boot)
                    if (typeof RankSystem !== 'undefined' && RankSystem.checkSecularProgress) RankSystem.checkSecularProgress();
                    // Templum — poutníci (self-guarded 7 d, gate frater+ a canonical hours)
                    if (typeof Game !== 'undefined' && Game.pilgrimTick) Game.pilgrimTick();
                    // Probošt — životní události farních rodin (self-guarded 7 d, gate rank.probost)
                    if (typeof Game !== 'undefined' && Game.parishEventTick) Game.parishEventTick();
                    // Krok C (zakazky-3-kandidati.md) — zakázky od propojených aktérů (sklář první)
                    if (typeof CommitmentsSystem !== 'undefined' && CommitmentsSystem.akterZakazkyTick) CommitmentsSystem.akterZakazkyTick();
                    if (typeof CommitmentsSystem !== 'undefined' && CommitmentsSystem.klientelaATick) CommitmentsSystem.klientelaATick();
                    if (typeof CommitmentsSystem !== 'undefined' && CommitmentsSystem.vrchnostZakazkyTick) CommitmentsSystem.vrchnostZakazkyTick();
                    // Kategorie C/D (zakazky-rozsireni-ctyri-kategorie-mrd.md, 9.8.2026)
                    if (typeof CommitmentsSystem !== 'undefined' && CommitmentsSystem.kacirskaZakazkyTick) CommitmentsSystem.kacirskaZakazkyTick();
                    if (typeof CommitmentsSystem !== 'undefined' && CommitmentsSystem.cirkevniZakazkyTick) CommitmentsSystem.cirkevniZakazkyTick();
                    // Cechy (cechy-a-prava-mrd.md §3.0, K3 Cesta A, 16.8.2026)
                    if (typeof CommitmentsSystem !== 'undefined' && CommitmentsSystem.cechZakazkyTick) CommitmentsSystem.cechZakazkyTick();
                    // Caseus — denní zrání sýra (self-guarded 24h, gate tech_caseus)
                    if (typeof CheeseSystem !== 'undefined' && CheeseSystem.dailyTick) CheeseSystem.dailyTick();
                    // Calcaria — denní zrání vápna (self-guarded 24h, gate tech_calcaria)
                    if (typeof LimeSystem !== 'undefined' && LimeSystem.dailyTick) LimeSystem.dailyTick();
                    // Susarna — denní sušení konopí (self-guarded 24h, gate tech_susarna)
                    if (typeof DryingSystem !== 'undefined' && DryingSystem.dailyTick) DryingSystem.dailyTick();
                    // Vaření/Udírna — self-guarded 5 min (kratší časy, hodiny ne dny), gate tech_udirna
                    if (typeof CookingSystem !== 'undefined' && CookingSystem.tick) CookingSystem.tick();
                    // Opatovy petice — dřív jen při načtení stránky, proto se hráč musel refreshovat
                    // (7.8.2026 fix). Funkce jsou už interně self-guarded (kontrola per-petici).
                    if (typeof Game !== 'undefined' && Game.checkAbbotPetitions) Game.checkAbbotPetitions();
                    if (typeof Game !== 'undefined' && Game.checkUbytovnaPetitions) Game.checkUbytovnaPetitions();
                    if (typeof Game !== 'undefined' && Game.checkGuildPetitions) Game.checkGuildPetitions();
                    if (typeof Game !== 'undefined' && Game.checkLandParcels) Game.checkLandParcels();
                    if (typeof Game !== 'undefined' && Game.checkMillBuildComplete) Game.checkMillBuildComplete();
                    if (typeof Game !== 'undefined' && Game.checkMillwrightHireComplete) Game.checkMillwrightHireComplete();
                    // Columbarium — denní riziko predátora (self-guarded 24h, jen level 1)
                    if (typeof FarmyardSystem !== 'undefined' && FarmyardSystem.columbariumPredatorTick) FarmyardSystem.columbariumPredatorTick();
                    // Columbarium — pasivní přírůstek do stropu 13 (self-guarded 24h, holubnik-mrd)
                    if (typeof FarmyardSystem !== 'undefined' && FarmyardSystem.columbariumRegrowTick) FarmyardSystem.columbariumRegrowTick();
                    // Columbarium — dokončení výcviku (self-guarded přes readyAt, holubnik-mrd)
                    if (typeof FarmyardSystem !== 'undefined' && FarmyardSystem.checkTrainingColumbarium) FarmyardSystem.checkTrainingColumbarium();
                    // Conversi — automatické úklidové úkoly (self-guarded 24h přes cleanPen)
                    if (typeof Game !== 'undefined' && Game.checkConversiChores) Game.checkConversiChores();
                    // Conversi — denní riziko zranění/nákazy u away:false tasků (Dvůr, Pole, Coquus...)
                    if (typeof Game !== 'undefined' && Game.checkConversiTaskRisk) Game.checkConversiTaskRisk();
                    // Conversi — denní kontrola dozrání obláta na konvrše
                    if (typeof Game !== 'undefined' && Game._checkOblatMaturation) Game._checkOblatMaturation();
                    // Chirurgus — týdenní mzda
                    if (typeof Game !== 'undefined' && Game.checkChirurgusWage) Game.checkChirurgusWage();
                    // Conversi — návraty ze Scavenge/Dolů (riziko + výnos)
                    if (typeof Game !== 'undefined' && Game.checkConversiReturns) Game.checkConversiReturns();
                    // Studna — časová degradace (self-guarded 24h, grace 5 dní)
                    if (typeof WellSystem !== 'undefined' && WellSystem.dailyTick) WellSystem.dailyTick();
                    // Persona — influence decay (self-guarded 7 dní)
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.tickDecay) PersonaSystem.tickDecay();
                    Game.checkFarmyardProduction();
                    Game.checkPiscinaGrowth();
                    Game.checkPiscinaPredation();
                    Game.checkSadkyAging();
                    Game.checkVylovStatus();
                    // Save info — refresh "Poslední uložení" v Settings
                    const _saveEl = document.getElementById('save-last-time');
                    if (_saveEl && Game._saveHint.lastSaveTime > 0) {
                        const _minAgo = Math.floor((Date.now() - Game._saveHint.lastSaveTime) / 60000);
                        const _lang = (GameState.settings && GameState.settings.language) || 'cs';
                        _saveEl.textContent = _minAgo === 0
                            ? (_lang === 'en' ? 'just now' : 'právě teď')
                            : (_lang === 'en' ? `${_minAgo} min ago` : `před ${_minAgo} min`);
                    }
                }
            } catch (e) {
                console.error('Time update error:', e);
            }
        }, 1000);

        // beforeunload — emergency save on tab/browser close (desktop)
        window.addEventListener('beforeunload', function () {
            Game.save();
        });

    },
    // === IndexedDB helpers (dual-write backup) ===
    // ═══ D1: Save/Settings (1/2) — extrahováno do SaveManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    _idbOpen: function () { return SaveManager._idbOpen(); },
    _idbSave: function (data) { return SaveManager._idbSave(data); },
    _idbLoad: function () { return SaveManager._idbLoad(); },
    _idbClear: function () { return SaveManager._idbClear(); },


    // ── Save hint systém (ephemeral — nepersistuje, reset při každém page load) ──
    _saveHint: { actions: 0, lastSaveTime: 0, lastHintTime: 0 },

    _checkSaveHint: function () { return SaveManager._checkSaveHint(); },
    save: function () { return SaveManager.save(); },
    _seedHistoricalGraves: function () { return SaveManager._seedHistoricalGraves(); },
    load: function () { return SaveManager.load(); },
    resetSave: function () { return SaveManager.resetSave(); },
    syncTechUnlocks: function () { return SaveManager.syncTechUnlocks(); },
    setVolume: function (val) { return SaveManager.setVolume(val); },
    setFireVolume: function (val) { return SaveManager.setFireVolume(val); },
    setMusicEnabled: function (enabled) { return SaveManager.setMusicEnabled(enabled); },
    toggleSound: function () { return SaveManager.toggleSound(); },
    setMusicVolume: function (val) { return SaveManager.setMusicVolume(val); },
    setMusicTier: function (tier) { return SaveManager.setMusicTier(tier); },
    setTheme: function (themeName) { return SaveManager.setTheme(themeName); },
    setDesignStyle: function (styleName) { return SaveManager.setDesignStyle(styleName); },
    setLanguage: function (lang) { return SaveManager.setLanguage(lang); },
    setDuration: function (min, btn) { return SaveManager.setDuration(min, btn); },
    setMineDuration: function (min, btn) { return SaveManager.setMineDuration(min, btn); },

    // ═══ D2: Fireplace/Loot modály — extrahováno do LootModalManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    igniteFireplace: function () { return LootModalManager.igniteFireplace(); },
    lightSource: function (type) { return LootModalManager.lightSource(type); },
    showRustyPotModal: function () { return LootModalManager.showRustyPotModal(); },
    showLostKeyModal: function (keyId) { return LootModalManager.showLostKeyModal(keyId); },
    showDriedHerbsModal: function () { return LootModalManager.showDriedHerbsModal(); },
    showHempPouchModal: function () { return LootModalManager.showHempPouchModal(); },
    showMysteriousBulbModal: function () { return LootModalManager.showMysteriousBulbModal(); },
    showWaxSealModal: function () { return LootModalManager.showWaxSealModal(); },
    showTornPageModal: function () { return LootModalManager.showTornPageModal(); },
    showCoinModal: function (itemId, value) { return LootModalManager.showCoinModal(itemId, value); },
    showNetolickyModal: function () { return LootModalManager.showNetolickyModal(); },
    showTitivillusSpisModal: function () { return LootModalManager.showTitivillusSpisModal(); },
    showTitivillusSpisContentModal: function () { return LootModalManager.showTitivillusSpisContentModal(); },
    showAcediaSpisModal: function () { return LootModalManager.showAcediaSpisModal(); },
    showAcediaSpisContentModal: function () { return LootModalManager.showAcediaSpisContentModal(); },
    showBelzebubSpisModal: function () { return LootModalManager.showBelzebubSpisModal(); },
    showBelzebubSpisContentModal: function () { return LootModalManager.showBelzebubSpisContentModal(); },

    // MRD zahony-tiers — zasadit rovnou bez hnojiva, early-game friendly, nižší výnos (tier 0)
    // ═══ D3: Zahony/Sad — extrahováno do GardenManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    skipFertilize: function (plotIdx) { return GardenManager.skipFertilize(plotIdx); },
    fertilizeDuringGrowth: function (plotIdx) { return GardenManager.fertilizeDuringGrowth(plotIdx); },
    farmAction: function (plotIdx) { return GardenManager.farmAction(plotIdx); },
    plantTree: function (slotIdx, seedId) { return GardenManager.plantTree(slotIdx, seedId); },
    harvestTree: function (slotIdx) { return GardenManager.harvestTree(slotIdx); },
    fellTree: function (slotIdx) { return GardenManager.fellTree(slotIdx); },


    // ═══════════════════════════════════════════════════════════════════════════
    // APIARIUM (Včelín) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Pomocná: vrátí sezónu dle reálného měsíce ─────────────────────────────
    // ═══ D4: Apiarium (včelíny) — extrahováno do ApiaryManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    _getApiarySeason: function () { return ApiaryManager._getApiarySeason(); },
    _randomQueenName: function () { return ApiaryManager._randomQueenName(); },
    _apiaryWeatherMod: function () { return ApiaryManager._apiaryWeatherMod(); },
    buildHive: function (slotIdx) { return ApiaryManager.buildHive(slotIdx); },
    buildGrandHive: function (slotIdx) { return ApiaryManager.buildGrandHive(slotIdx); },
    addQueen: function (slotIdx) { return ApiaryManager.addQueen(slotIdx); },
    breedQueen: function (slotIdx) { return ApiaryManager.breedQueen(slotIdx); },
    startTinkturaAging: function (amount) { return ApiaryManager.startTinkturaAging(amount); },
    collectTinkturaAging: function () { return ApiaryManager.collectTinkturaAging(); },
    cutQueenCells: function (slotIdx) { return ApiaryManager.cutQueenCells(slotIdx); },
    makeNuc: function (sourceIdx) { return ApiaryManager.makeNuc(sourceIdx); },
    inspectHive: function (slotIdx) { return ApiaryManager.inspectHive(slotIdx); },
    collectHive: function (slotIdx) { return ApiaryManager.collectHive(slotIdx); },
    feedHive: function (slotIdx) { return ApiaryManager.feedHive(slotIdx); },
    treatVarroa: function (slotIdx) { return ApiaryManager.treatVarroa(slotIdx); },
    checkApiaryWinter: function () { return ApiaryManager.checkApiaryWinter(); },
    triggerVarroa: function (slotIdx) { return ApiaryManager.triggerVarroa(slotIdx); },


    // ═══════════════════════════════════════════════════════════════════════════
    // PISCINA (Rybník) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    // Unikátní id pro nový řádek v GameState.piscina.fish
    // ═══ D5: Piscina (rybník) — extrahováno do PiscinaManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    _piscinaNextId: function () { return PiscinaManager._piscinaNextId(); },
    _piscinaSyncAggregates: function () { return PiscinaManager._piscinaSyncAggregates(); },
    stockFish: function (species, qty) { return PiscinaManager.stockFish(species, qty); },
    buildPiscina: function (tier) { return PiscinaManager.buildPiscina(tier); },
    addFry: function (qty) { return PiscinaManager.addFry(qty); },
    feedPiscina: function () { return PiscinaManager.feedPiscina(); },
    transferFry: function () { return PiscinaManager.transferFry(); },
    harvestCarp: function (qty) { return PiscinaManager.harvestCarp(qty); },
    checkPiscinaGrowth: function () { return PiscinaManager.checkPiscinaGrowth(); },
    checkPiscinaPredation: function () { return PiscinaManager.checkPiscinaPredation(); },
    catchPike: function (qty) { return PiscinaManager.catchPike(qty); },
    stockCaughtFish: function (invSpecies, qty) { return PiscinaManager.stockCaughtFish(invSpecies, qty); },
    moveToSadky: function (species, qty) { return PiscinaManager.moveToSadky(species, qty); },
    checkSadkyAging: function () { return PiscinaManager.checkSadkyAging(); },
    startVylov: function () { return PiscinaManager.startVylov(); },
    checkVylovStatus: function () { return PiscinaManager.checkVylovStatus(); },
    harvestVylov: function () { return PiscinaManager.harvestVylov(); },


    // ═══ D3: Sad (checkOrchardGrowth) — extrahováno do GardenManager.js ═══
    checkOrchardGrowth: function () { return GardenManager.checkOrchardGrowth(); },


    // ═══════════════════════════════════════════════════════════════════════════
    // GALLINARIUM (Kurník) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    buildHenhouse: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.buildHenhouse(...args); },

    addHen: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.addHen(...args); },

    startNesting: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.startNesting(...args); },

    slaughterChick: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterChick(...args); },

    slaughterHen: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterHen(...args); },

    collectHenhouse: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.collectHenhouse(...args); },

    feedHenhouse: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.feedHenhouse(...args); },

    // ═══════════════════════════════════════════════════════════════════════════
    // OVILE (Chlév) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    buildSheepfold: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.buildSheepfold(...args); },

    addSheep: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.addSheep(...args); },

    startBreeding: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.startBreeding(...args); },

    slaughterLamb: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterLamb(...args); },

    slaughterSheep: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterSheep(...args); },

    collectSheepfold: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.collectSheepfold(...args); },

    feedSheepfold: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.feedSheepfold(...args); },

    // ═══════════════════════════════════════════════════════════════════════════
    // FARMYARD PRODUCTION TICK — volán každou minutu
    // ═══════════════════════════════════════════════════════════════════════════

    checkFarmyardProduction: function (...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.checkFarmyardProduction(...args); },

    // coquina-kotlik-mrd (9.8.2026): pity systém pro nález zrezlého kotlíku
    // v Průzkumu okolí (basic) a Úklidu hospodářství (yard_cleanup). Šance
    // roste s každou kombinovanou akcí, tvrdá garance jako pojistka proti
    // smůle (4× basic, nebo 3× yard_cleanup, nebo 9× kombinovaně). Přestane
    // rolovat, jakmile hráč cokoliv k vaření vlastní.
    // ═══ D7 (pokr.) ═══
    scavenge: function (type) { return ScavengeManager.scavenge(type); },
    checkEnvironment: function () { return ScavengeManager.checkEnvironment(); },

    // ═══ D8: Inventory/Crafting — extrahováno do InventoryManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    addItem: function (id, qty) { return InventoryManager.addItem(id, qty); },
    removeItem: function (id, qty) { return InventoryManager.removeItem(id, qty); },
    craft: function (id) { return InventoryManager.craft(id); },
    study: function (id) { return InventoryManager.study(id); },
    eat: function (foodId) { return InventoryManager.eat(foodId); },
    drink: function (itemId) { return InventoryManager.drink(itemId); },
    checkDailyReward: function () { return InventoryManager.checkDailyReward(); },
    checkAchievements: function () { return InventoryManager.checkAchievements(); },
    checkAnimalFeeding: function () { return InventoryManager.checkAnimalFeeding(); },
    useToolCharge: function (itemId) { return InventoryManager.useToolCharge(itemId); },
    buildStorage: function (type) { return InventoryManager.buildStorage(type); },
    checkCalendarium: function () { return InventoryManager.checkCalendarium(); },


    // === BACKUP SYSTEM === (přidat před konec Game objektu)

    // ═══ D1: Save/Settings (2/2) — extrahováno do SaveManager.js ═══
    exportSave: function () { return SaveManager.exportSave(); },
    importSave: function (file) { return SaveManager.importSave(file); },
    triggerImport: function () { return SaveManager.triggerImport(); },


    // ─── KRONIKA ─────────────────────────────────────────────────────
    // ═══ D9: Kronika — extrahováno do ChronicleManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    kronikaCraftFlushBuffer: function () { return ChronicleManager.kronikaCraftFlushBuffer(); },
    kronikaFlushBuffer: function () { return ChronicleManager.kronikaFlushBuffer(); },


    // ── ABBOT PETITION SYSTEM ────────────────────────────────────────────────

    // Vrací null pokud všechny podmínky splněny, jinak klíč zamítnutí (denied_*)
    // ═══ D10 (1/12) — extrahováno do PetitionManager.js ═══
    submitAbbotPetition: function (type) { return PetitionManager.submitAbbotPetition(type); },


    // ── TEMPLUM T6-V1: Poutníci — týdenní šance návštěvy; relikvie = magnet (MRD templum/visitatio) ──
    // ═══ D11: Templum (1/3) — extrahováno do TemplumManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 20.8.2026)
    // OPRAVA REGRESE 20.8.: vitreaGrantStartPool/vitreaWearTick neměly
    // stub vůbec (omylem sebrány do PetitionManager.js bez delegace u D10,
    // 19.8. — init() guard řádek 811 je od tý doby tiše přeskakoval).
    vitreaGrantStartPool: function () { return TemplumManager.vitreaGrantStartPool(); },
    vitreaWearTick: function () { return TemplumManager.vitreaWearTick(); },
    pilgrimTick: function () { return TemplumManager.pilgrimTick(); },
    // PARISH_SURNAMES čtena i z CommitmentsSystem.js/ChroniconSystem.js — alias, ne kopie.
    PARISH_SURNAMES: TemplumManager.PARISH_SURNAMES,
    parishEventTick: function () { return TemplumManager.parishEventTick(); },
    reopenParishEvent: function () { return TemplumManager.reopenParishEvent(); },
    _showParishModal: function (type, surname, id) { return TemplumManager._showParishModal(type, surname, id); },
    visitatioTick: function () { return TemplumManager.visitatioTick(); },
    templumPenance: function (tier) { return TemplumManager.templumPenance(tier); },
    templumDonate: function (itemId) { return TemplumManager.templumDonate(itemId); },
    _templumLog: function (entry) { return TemplumManager._templumLog(entry); },
    templumConfessionTick: function () { return TemplumManager.templumConfessionTick(); },
    reopenConfession: function () { return TemplumManager.reopenConfession(); },
    _showConfessionModal: function (id, pendingId) { return TemplumManager._showConfessionModal(id, pendingId); },
    _rollAbbotStrict: function () { return TemplumManager._rollAbbotStrict(); },
    confessHeresy: function () { return TemplumManager.confessHeresy(); },
    confessGambling: function () { return TemplumManager.confessGambling(); },
    _gatherConfessorContext: function () { return TemplumManager._gatherConfessorContext(); },
    confessorAISend: function () { return TemplumManager.confessorAISend(); },


    // ── monastery-decay-mrd, Vrstva 1 — denní trigger kontrola pro nemoci,
    // které nejsou vázané na konkrétní akci (rheumatism, scurvy, gout, lice,
    // scabies). dysentery (studna) a ergot_fire (chléb) jsou u svých akcí. ──
    // ═══ D13: Zdraví/Infirmarium (1/3) — extrahováno do HealthCareManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    healthConditionsDailyTick: function () { return HealthCareManager.healthConditionsDailyTick(); },



    // ═══ D11 (2/3) ═══
    serveMass: function () { return TemplumManager.serveMass(); },
    giveAlms: function () { return TemplumManager.giveAlms(); },
    upgradeFabrica: function () { return TemplumManager.upgradeFabrica(); },
    // FABRICA_TIERS čtena i z TemplumSystem.js — alias, ne kopie.
    FABRICA_TIERS: TemplumManager.FABRICA_TIERS,


    // ═══ D12: Mlýn — extrahováno do MillManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 19.8.2026)
    upgradeMillTier: function () { return MillManager.upgradeMillTier(); },
    checkMillBuildComplete: function () { return MillManager.checkMillBuildComplete(); },
    hireMillwright: function () { return MillManager.hireMillwright(); },
    checkMillwrightHireComplete: function () { return MillManager.checkMillwrightHireComplete(); },
    // Datové konstanty čtené i mimo game.js (CellariumSystem.js renderBuildings)
    // — alias, ne kopie, ukazuje na stejný objekt v MillManager (build.js
    // pořadí zaručuje, že MillManager existuje dřív než se Game vyhodnotí).
    // Nalezeno a opraveno 19.8.2026 po crash reportu (Bouvard, Cellarium tab).
    MILL_TIERS: MillManager.MILL_TIERS,
    MILLWRIGHT_COST: MillManager.MILLWRIGHT_COST,


    // ═══ D11 (3/3) ═══
    buildNahrobek: function (ts) { return TemplumManager.buildNahrobek(ts); },
    showGraveDetail: function (ts, source) { return TemplumManager.showGraveDetail(ts, source); },
    repairFabrica: function () { return TemplumManager.repairFabrica(); },
    templumDailyTick: function () { return TemplumManager.templumDailyTick(); },


    // ═══ D7 (dokončení) ═══
    setSnare: function () { return ScavengeManager.setSnare(); },
    collectSnares: function () { return ScavengeManager.collectSnares(); },
    processCaughtGame: function () { return ScavengeManager.processCaughtGame(); },


    // ═══ D10 (3/12) ═══
    checkAbbotPetitions: function () { return PetitionManager.checkAbbotPetitions(); },


    // ═══ D14+D15: Conversi/Dormitorium/Manufaktura (1/4) — extrahováno do ConversiManager.js ═══
    // (Krok 2, refactoring-audit-mrd-19-8-2026.md §2, 20.8.2026)
    // KONVRS_NAMES čtena i z ChroniconSystem.js — alias, ne kopie.
    KONVRS_NAMES: ConversiManager.KONVRS_NAMES,
    conversiCapacity: function () { return ConversiManager.conversiCapacity(); },
    conversiEfficiency: function (k) { return ConversiManager.conversiEfficiency(k); },


    // ═══ D10: Ubytovna/Cechy/Pozemky (2/12) — extrahováno do PetitionManager.js ═══
    ubytovnaCapacity: function () { return PetitionManager.ubytovnaCapacity(); },
    submitUbytovnaPetition: function (tier) { return PetitionManager.submitUbytovnaPetition(tier); },
    submitGuildPhase0Petition: function (guildId, matterKey) { return PetitionManager.submitGuildPhase0Petition(guildId, matterKey); },
    submitGuildPetition: function (guildId, matterKey) { return PetitionManager.submitGuildPetition(guildId, matterKey); },
    sendGuildGift: function (guildId) { return PetitionManager.sendGuildGift(guildId); },
    askAbbotAboutLand: function () { return PetitionManager.askAbbotAboutLand(); },
    buildUbytovnaTier: function (tier) { return PetitionManager.buildUbytovnaTier(tier); },
    checkUbytovnaPetitions: function () { return PetitionManager.checkUbytovnaPetitions(); },
    checkGuildPetitions: function () { return PetitionManager.checkGuildPetitions(); },
    buyLandParcel: function (parcelId) { return PetitionManager.buyLandParcel(parcelId); },
    checkLandParcels: function () { return PetitionManager.checkLandParcels(); },
    // Datové konstanty čtené i mimo game.js (CellariumSystem.js) — alias,
    // ne kopie. Nalezeno a opraveno 19.8.2026 po crash reportu (Bouvard).
    UBYTOVNA_TIER_COSTS: PetitionManager.UBYTOVNA_TIER_COSTS,
    GUILD_GIFT_RELATION: PetitionManager.GUILD_GIFT_RELATION,
    GUILD_GIFT_COOLDOWN_MS: PetitionManager.GUILD_GIFT_COOLDOWN_MS,



    // ═══ D14 (2/4) ═══
    dormitoriumCapacity: function () { return ConversiManager.dormitoriumCapacity(); },
    // DORMITORIUM_TAB_TRAITS čtena i z init() (game.js samotném) — alias.
    DORMITORIUM_TAB_TRAITS: ConversiManager.DORMITORIUM_TAB_TRAITS,
    dormitoriumBrotherLevel: function (brother, tabId) { return ConversiManager.dormitoriumBrotherLevel(brother, tabId); },
    dormitoriumBrotherMult: function (brother, tabId) { return ConversiManager.dormitoriumBrotherMult(brother, tabId); },
    _workCredit: function (brother, konvrs) { return ConversiManager._workCredit(brother, konvrs); },
    dormitoriumAddXp: function (brother, tabId) { return ConversiManager.dormitoriumAddXp(brother, tabId); },
    assignBrotherTab: function (brotherId, tabId) { return ConversiManager.assignBrotherTab(brotherId, tabId); },
    hireBrother: function () { return ConversiManager.hireBrother(); },
    conversiTaskGate: function (taskId) { return ConversiManager.conversiTaskGate(taskId); },
    conversiTaskCount: function (taskId, excludeId) { return ConversiManager.conversiTaskCount(taskId, excludeId); },
    assignConversiTask: function (konvrsId, taskId) { return ConversiManager.assignConversiTask(konvrsId, taskId); },
    checkConversiReturns: function () { return ConversiManager.checkConversiReturns(); },
    checkConversiTaskRisk: function () { return ConversiManager.checkConversiTaskRisk(); },


    // Famulus — sezónní síla, žádná trvalá vazba. 4g/týden, bez loajality,
    // okamžitej odchod při neplacení (viz upravená mzdová smyčka výš).
    // Chirurgus/Rasor — hybrid hire: nejdřív Clientela vztah (relation >= 30),
    // pak funguje jako Famulus (3g/týden, bez loajality, okamžitej odchod).
    // Uspávací houba — zkrátí injuredUntil konvrše (24h → 4h), spotřebuje 1× item.
    // ═══ D13 (2/3) ═══
    applySpongiaToInjured: function (entityId) { return HealthCareManager.applySpongiaToInjured(entityId); },
    hearConfession: function (entityId, isBrother) { return HealthCareManager.hearConfession(entityId, isBrother); },
    hireChirurgus: function () { return HealthCareManager.hireChirurgus(); },
    checkChirurgusWage: function () { return HealthCareManager.checkChirurgusWage(); },
    performFlebotomie: function (entityId, isBrother) { return HealthCareManager.performFlebotomie(entityId, isBrother); },


    // ═══ D14 (3/4) ═══
    hireFamulus: function () { return ConversiManager.hireFamulus(); },
    hireOblat: function () { return ConversiManager.hireOblat(); },
    _checkOblatMaturation: function () { return ConversiManager._checkOblatMaturation(); },
    hireKonvrs: function () { return ConversiManager.hireKonvrs(); },
    dismissKonvrs: function (id, variant) { return ConversiManager.dismissKonvrs(id, variant); },
    isOfficiumHours: function () { return ConversiManager.isOfficiumHours(); },
    conversiDayBlock: function () { return ConversiManager.conversiDayBlock(); },
    _brotherPortion: function (b) { return ConversiManager._brotherPortion(b); },
    _konvrsTraits: function (k) { return ConversiManager._konvrsTraits(k); },
    reopenKapitula: function () { return ConversiManager.reopenKapitula(); },
    _showKapitulaModal: function (pairKey) { return ConversiManager._showKapitulaModal(pairKey); },
    // CONVERSI_TASKS a REFECTORY_FOODS čtený i ze SaeculumSystem.js — alias.
    CONVERSI_TASKS: ConversiManager.CONVERSI_TASKS,
    REFECTORY_FOODS: ConversiManager.REFECTORY_FOODS,
    manufacturaCollect: function (tabKey) { return ConversiManager.manufacturaCollect(tabKey); },
    manufacturaStatus: function (tabKey) { return ConversiManager.manufacturaStatus(tabKey); },


    // onlyTab — volitelné, pro izolovaný manuální Collect (Manufaktura).
    // Bez argumentu (automatický tick na pozadí) běží přesně jako dřív —
    // zpracuje všech 9 tabů. S argumentem přeskočí všechny ostatní.
    // ═══ D13 (3/3) — pozor, _npcHealthTick volané i mimo tento blok (D14) ═══
    _npcHealthTick: function () { return HealthCareManager._npcHealthTick(); },
    admitToInfirmarium: function (entityId, isBrother) { return HealthCareManager.admitToInfirmarium(entityId, isBrother); },
    dischargeFromInfirmarium: function (entityId, isBrother) { return HealthCareManager.dischargeFromInfirmarium(entityId, isBrother); },
    administerCure: function (entityId, isBrother, itemId) { return HealthCareManager.administerCure(entityId, isBrother, itemId); },


    // ═══ D14 (4/4) ═══
    // DORMITORIUM_ROSTER_TRAIT_BONUS čtena i z HealthCareManager.js — alias.
    DORMITORIUM_ROSTER_TRAIT_BONUS: ConversiManager.DORMITORIUM_ROSTER_TRAIT_BONUS,
    checkConversiChores: function (onlyTab) { return ConversiManager.checkConversiChores(onlyTab); },


    // ═══ D9: Kronika (addKronikaEntry) — extrahováno do ChronicleManager.js ═══
    addKronikaEntry: function (type, cs, en, la) { return ChronicleManager.addKronikaEntry(type, cs, en, la); },


};