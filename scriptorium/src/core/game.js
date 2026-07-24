const Game = {
    _scavenging: false,

    // Tematické rozdělení lostItem nálezů (viz ItemsDB, lostItem:true) mezi
    // scavenge akce — každá skupina padá jen ze svého tematicky odpovídajícího
    // typu, místo jednoho universálního poolu. yard_cleanup si ponechává
    // přístup ke VŠEM 30 položkám (obecný úklid), ale se sníženou šancí.
    LOST_ITEM_POOLS: {
        basic: ['lost_key_1','lost_key_2','lost_key_3','lost_key_4','lost_key_5',
                'key_large_1','key_large_2','key_large_3',
                'lost_scroll_1','lost_scroll_2',
                'old_coin_1','old_coin_2','old_coin_3'],
        nature: ['flask_cut','clasp_hunter','clasp_monk','clasp_silver','clasp_leather','clasp_bronze',
                  'pipe_large','pipe_small','rosarium','pilgrim_badge','sundial_pocket','inkwell_small'],
        foraging: ['torn_page','wax_seal','dried_herbs_bundle','hemp_pouch','mysterious_bulb'],
    },

    init: function() {
        Game.load();

        // Sync header sound icon s uloženým stavem (soundMuted) — bez tohoto
        // ikonka lhala po restartu, dokud hráč neklikl (viz toggleMute v audio.js)
        (function() {
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
        (function() {
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
        if(!GameState.notebooks) {
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
        if(!GameState.iching) {
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
            {cropType:'herb'}, {cropType:'herb'},
            {cropType:'herb',locked:true}, {cropType:'herb',locked:true},
            {cropType:'vegetable',locked:true}, {cropType:'vegetable',locked:true},
            {cropType:'vegetable',locked:true}, {cropType:'vegetable',locked:true},
            {cropType:'special',locked:true}, {cropType:'special',locked:true},
            {cropType:'vegetable',locked:true}, {cropType:'vegetable',locked:true},
            {cropType:'vegetable',locked:true}, {cropType:'vegetable',locked:true},
        ];
        while (GameState.garden.length < _gardenTarget.length) {
            const tpl = _gardenTarget[GameState.garden.length];
            GameState.garden.push({ state:0, water:false, crop:null, plantedAt:0, cropType:tpl.cropType, locked:!!tpl.locked });
        }
        
        // Add cropType to existing plots if missing
        GameState.garden.forEach((plot, idx) => {
            if(!plot.cropType) {
                if(idx === 0 || idx === 1) plot.cropType = 'herb';
                else if(idx === 2) plot.cropType = 'vegetable';
                else if(idx === 3) plot.cropType = 'special';
                else if(idx === 4 || idx === 5) plot.cropType = 'herb';
                else plot.cropType = 'vegetable';
            }
            if(plot.locked === undefined) {
                plot.locked = (idx >= 2);
            }
        });
        
        // Initialize discoveredLore if not present
        if(!GameState.discoveredLore) {
            GameState.discoveredLore = [];
        }
        
        // Initialize dailyRewards if not present
        if(!GameState.dailyRewards) {
            GameState.dailyRewards = {
                lastLogin: 0,
                streak: 0,
                lastBonusClaimed: 0,
                totalLogins: 0
            };
        }
        
        // Initialize achievements if not present
        if(!GameState.achievements) {
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
        if(GameState.achievements && !GameState.achievements.stats.totalGamesPlayed) {
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
        if(!GameState.library) {
            GameState.library = {
                startDate: Date.now(),
                unlockedBooks: [],
                readBooks: [],
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
		// Vyhodnotit čekající žádosti po načtení
		Game.checkAbbotPetitions();

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
		if(!GameState.henhouse) {
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
		if(!GameState.sheepfold) {
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
		if(!GameState.piscina) {
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
        if(!GameState.settings.theme) {
            GameState.settings.theme = 'default';
        }
        if(GameState.settings.autoTheme === undefined) {
            GameState.settings.autoTheme = false;
        }
        
        // Fire volume default (v7.9)
        if(GameState.settings.fireVolume === undefined) {
            GameState.settings.fireVolume = 0.5;  // 50% default
        }

        // Music defaults (v8.x)
        if(GameState.settings.musicEnabled === undefined) {
            GameState.settings.musicEnabled = true;
        }
        if(GameState.settings.musicVolume === undefined) {
            GameState.settings.musicVolume = 0.5;
        }

        // Language default + URL param detection (i18n)
        if(!GameState.settings.language) {
            GameState.settings.language = 'cs';
        }
        if(GameState.settings.langChosen === undefined) {
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
            if(el) el.innerHTML = t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            if(el) el.title = t(el.getAttribute('data-i18n-title'));
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

                // v7.5: Check canonical hours
                CanonicalHours.checkCurrentHour();
                // v7.5: Check events
                EventsSystem.checkEvents();
                // CHRONICON advisory eventy — stejná kadence
                if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem.checkPendingAdvisory) ChroniconSystem.checkPendingAdvisory();
                // v8.1: Giacomo weekly check (once per minute)
                _tickCounter++;
                if (_tickCounter >= 60) {
                    _tickCounter = 0;
                    CellariumSystem.checkGiacomoEvent();
                    CellariumSystem.checkStationariusEvent();
                    // v8.x: Orchard growing → mature transition
                    Game.checkOrchardGrowth();
                    if (typeof GardenSystem !== 'undefined') GardenSystem.checkFieldGrowth();
                    if (typeof GardenSystem !== 'undefined') GardenSystem.checkVineaGrowth();
                    // Felis Monastica — denní tick (self-guarded 24h)
                    if (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.dailyTick) ScriptoriumCat.dailyTick();
                    // FarmyardSystem — mood tick (self-guarded 24h)
                    if (typeof FarmyardSystem !== 'undefined' && FarmyardSystem.moodTick) FarmyardSystem.moodTick();
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
                    // Infirmarium — hospes recovery/discharge (self-guarded 24h)
                    if (typeof InfirmariumSystem !== 'undefined' && InfirmariumSystem.hospesDailyTick) InfirmariumSystem.hospesDailyTick();
                    // Ubytovna — odchod hostů po plannedDays (self-guarded 24h, ubytovna-mrd.md §8c-B)
                    if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem.ubytovnaDailyTick) ChroniconSystem.ubytovnaDailyTick();
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
                    // Caseus — denní zrání sýra (self-guarded 24h, gate tech_caseus)
                    if (typeof CheeseSystem !== 'undefined' && CheeseSystem.dailyTick) CheeseSystem.dailyTick();
                    // Calcaria — denní zrání vápna (self-guarded 24h, gate tech_calcaria)
                    if (typeof LimeSystem !== 'undefined' && LimeSystem.dailyTick) LimeSystem.dailyTick();
                    // Susarna — denní sušení konopí (self-guarded 24h, gate tech_susarna)
                    if (typeof DryingSystem !== 'undefined' && DryingSystem.dailyTick) DryingSystem.dailyTick();
                    // Columbarium — denní riziko predátora (self-guarded 24h, jen level 1)
                    if (typeof FarmyardSystem !== 'undefined' && FarmyardSystem.columbariumPredatorTick) FarmyardSystem.columbariumPredatorTick();
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
            } catch(e) {
                console.error('Time update error:', e);
            }
        }, 1000);

        // beforeunload — emergency save on tab/browser close (desktop)
        window.addEventListener('beforeunload', function() {
            Game.save();
        });
		
    },
    // === IndexedDB helpers (dual-write backup) ===
    _idbOpen: function() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) { reject('IDB not supported'); return; }
            const req = indexedDB.open('ScriptoriumDB', 1);
            req.onupgradeneeded = function(e) {
                e.target.result.createObjectStore('saves', { keyPath: 'key' });
            };
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    },
    _idbSave: function(data) {
        Game._idbOpen().then(db => {
            const tx = db.transaction('saves', 'readwrite');
            tx.objectStore('saves').put({ key: 'main', data: data, ts: Date.now() });
        }).catch(e => console.warn('IDB save failed:', e));
    },
    _idbLoad: function() {
        return Game._idbOpen().then(db => {
            return new Promise((resolve, reject) => {
                const req = db.transaction('saves', 'readonly').objectStore('saves').get('main');
                req.onsuccess = e => resolve(e.target.result || null);
                req.onerror = e => reject(e.target.error);
            });
        });
    },
    _idbClear: function() {
        Game._idbOpen().then(db => {
            db.transaction('saves', 'readwrite').objectStore('saves').delete('main');
        }).catch(e => console.warn('IDB clear failed:', e));
    },

    // ── Save hint systém (ephemeral — nepersistuje, reset při každém page load) ──
    _saveHint: { actions: 0, lastSaveTime: 0, lastHintTime: 0 },

    _checkSaveHint: function() {
        const h = Game._saveHint;
        const now = Date.now();
        const HINT_COOLDOWN = 10 * 60 * 1000;   // min. 10 min mezi hinty
        const ACTION_WARN   = 50;                 // žlutý hint
        const ACTION_URGENT = 100;                // oranžový hint
        const TIME_WARN_MS  = 30 * 60 * 1000;    // 30 min bez uložení

        if (now - h.lastHintTime < HINT_COOLDOWN) return;

        const timeSinceSave = h.lastSaveTime > 0 ? now - h.lastSaveTime : 0;
        const urgent = h.actions >= ACTION_URGENT || timeSinceSave >= TIME_WARN_MS;
        const warn   = h.actions >= ACTION_WARN;

        if (!urgent && !warn) return;

        h.lastHintTime = now;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const minAgo = h.lastSaveTime > 0 ? Math.floor(timeSinceSave / 60000) : null;
        const timeStr = minAgo !== null
            ? (lang === 'en' ? `${minAgo} min ago` : `před ${minAgo} min`)
            : (lang === 'en' ? 'not yet saved' : 'zatím neuloženo');

        const msg = urgent
            ? (lang === 'en' ? `⚠️ Unsaved progress! Last save: ${timeStr}` : `⚠️ Neuložený postup! Poslední uložení: ${timeStr}`)
            : (lang === 'en' ? `💾 Remember to save! Last save: ${timeStr}` : `💾 Nezapomeň uložit! Poslední uložení: ${timeStr}`);

        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            NotificationSystem.panel(msg, urgent ? 'warning' : 'system');
        }
    },

    save: function() {
        try {
            GameState.lastSeen = Date.now();
            const _sd = JSON.stringify(GameState);
            localStorage.setItem('scriptorium_save_v6_4', _sd);
            Game._idbSave(_sd);
            // Reset save hint counter
            Game._saveHint.actions = 0;
            Game._saveHint.lastSaveTime = Date.now();
            // Update Settings UI
            const _el = document.getElementById('save-last-time');
            if (_el) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                _el.textContent = lang === 'en' ? 'just now' : 'právě teď';
            }
        } catch(e) {}
    },
    // Historický základ — klášter roku 1465 už nějakou dobu stojí, hřbitov
    // ani rajský dvůr by neměly být prázdné od prvního dne. Idempotentní —
    // běží jednou (flag), pak nikdy víc. Přidává k tomu, co už tam je,
    // nepřepisuje. Frekvence: farní úmrtí ~1×/60-100 dní (3 roky zpátky),
    // mnišská/konvršská vzácně ~1×/2-3 roky (odpovídá ERGOT_DEATH_CHANCE).
    _seedHistoricalGraves: function() {
        try {
            if (!GameState.flags) GameState.flags = {};
            if (GameState.flags.historicalGravesSeeded) return;

            if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
            if (!Array.isArray(GameState.cemetery.graves)) GameState.cemetery.graves = [];
            const parishSeed = [
                { surname: 'Novák',     days: 1095 }, { surname: 'Dvořák',    days: 990 },
                { surname: 'Král',      days:  890 }, { surname: 'Procházka', days: 810 },
                { surname: 'Sedlák',    days:  720 }, { surname: 'Novotný',   days: 640 },
                { surname: 'Malý',      days:  560 }, { surname: 'Kovář',     days: 480 },
                { surname: 'Krejčí',    days:  400 }, { surname: 'Novák',     days: 320 },
                { surname: 'Dvořák',    days:  240 }, { surname: 'Sedlák',    days: 160 },
                { surname: 'Král',      days:   90 }, { surname: 'Malý',      days:  30 },
            ];
            parishSeed.forEach(g => GameState.cemetery.graves.push({ surname: g.surname, ts: Date.now() - g.days * 86400000 }));

            if (!GameState.rajskyDvur) GameState.rajskyDvur = { graves: [] };
            if (!Array.isArray(GameState.rajskyDvur.graves)) GameState.rajskyDvur.graves = [];
            const cloisterSeed = [
                { name: 'Bratr Metoděj', wasBrother: true,  days: 2555 },
                { name: 'Bratr Ondřej',  wasBrother: true,  days: 1460 },
                { name: 'Konvrš Blažej', wasBrother: false, days:  400 },
            ];
            cloisterSeed.forEach(g => GameState.rajskyDvur.graves.push({
                name: g.name, wasBrother: g.wasBrother, cause: 'ergot_fire', ts: Date.now() - g.days * 86400000
            }));

            // Flag se nastaví AŽ po úspěšném dokončení obou seedů — kdyby něco
            // vybouchlo uprostřed, příště se to jen zkusí znovu (nanejvýš pár
            // duplicitních hrobů, nikdy pád nebo poškození save).
            GameState.flags.historicalGravesSeeded = true;
            Game.save();
            console.log('🪦 Historický základ hřbitova/rajského dvora doplněn (14 + 3 hrobů).');
        } catch (e) {
            // Cokoliv se tu pokazí, save hráče to nesmí ovlivnit — jen zaloguj.
            console.error('⚠️ _seedHistoricalGraves selhalo (neškodné, zbytek loadu pokračuje):', e);
        }
    },

    load: function() {
        function deepMerge(target, source) {
            for (let key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }

        // STEP 1 — synchronous localStorage load (identical behaviour to pre-IDB)
        let lsTs = 0;
        try {
            const data = localStorage.getItem('scriptorium_save_v6_4');
            if (data) {
                const loadedState = JSON.parse(data);
                deepMerge(GameState, loadedState);
                lsTs = loadedState.lastSeen || 0;
                console.log('✅ Save loaded from localStorage');
                this.syncTechUnlocks();
            }
        } catch(e) {
            console.error('❌ Load error (localStorage):', e);
        }
        Game._seedHistoricalGraves();

        // STEP 2 — async IDB check: if IDB has newer save, patch GameState + re-render
        Game._idbLoad().then(idbRecord => {
            if (!idbRecord) return;
            const idbTs = idbRecord.ts || 0;
            if (idbTs > lsTs) {
                try {
                    const idbState = typeof idbRecord.data === 'string' ? JSON.parse(idbRecord.data) : idbRecord.data;
                    deepMerge(GameState, idbState);
                    // Sync IDB back to localStorage for next load
                    localStorage.setItem('scriptorium_save_v6_4', typeof idbRecord.data === 'string' ? idbRecord.data : JSON.stringify(idbRecord.data));
                    Game.syncTechUnlocks();
                    Game._seedHistoricalGraves();
                    if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
                    console.log('✅ IDB save was newer — patched GameState and re-rendered');
                } catch(e) {
                    console.error('❌ IDB patch error:', e);
                }
            }
        }).catch(e => console.warn('IDB load skipped:', e));
    },
    
    
    resetSave: function() { if(confirm(t('game.confirmReset'))) { try { localStorage.removeItem('scriptorium_save_v6_4'); Game._idbClear(); } catch(e){} location.reload(); } },

    // Retroaktivní sync: každý researchnutý tech musí mít své unlocks v unlockedRecipes
    syncTechUnlocks: function() {
        if (!GameState.researchedTechs || typeof TechTree === 'undefined') return;
        if (!GameState.unlockedRecipes) GameState.unlockedRecipes = [];
        let added = 0;
        GameState.researchedTechs.forEach(tid => {
            const tech = TechTree.find(x => x.id === tid);
            if (!tech || !Array.isArray(tech.unlocks)) return;
            tech.unlocks.forEach(u => {
                if (!GameState.unlockedRecipes.includes(u)) {
                    GameState.unlockedRecipes.push(u);
                    added++;
                }
            });
        });
        if (added) console.log(`🔧 syncTechUnlocks: doplněno ${added} chybějících unlocků.`);
    },

    setVolume: function(val) { if(audioSys) audioSys.setVolume(val); },
    setFireVolume: function(val) { 
        const volume = parseInt(val) / 100;
        GameState.settings.fireVolume = volume;
        if(audioSys) audioSys.setFireVolume(volume);
        this.save();
    },
    setMusicEnabled: function(enabled) {
        GameState.settings.musicEnabled = enabled;
        if(audioSys) audioSys.setMusicEnabled(enabled);
        this.save();
    },
    toggleSound: function() {
        if(audioSys) audioSys.toggleMute();
    },
    setMusicVolume: function(val) {
        const volume = parseInt(val) / 100;
        GameState.settings.musicVolume = volume;
        if(audioSys) audioSys.setMusicVolume(val);
        this.save();
    },
    setMusicTier: function(tier) {
        tier = parseInt(tier);
        GameState.settings.musicTier = tier;
        if(audioSys) audioSys.switchMusicTier(tier);
        this.save();
    },
    setTheme: function(themeName) {
        if(themeName === 'auto') {
            GameState.settings.autoTheme = true;
            ThemeSystem.updateAutoTheme();
        } else {
            GameState.settings.autoTheme = false;
            ThemeSystem.applyTheme(themeName);
        }
    },
	setLanguage: function(lang) {
        if (lang !== 'cs' && lang !== 'en') return;
        const prev = GameState.settings.language || 'cs';
        GameState.settings.language = lang;
        LangSystem.apply(lang);
        Game.checkEnvironment(); // Refresh fireplace/light strings
        
        // MAGICKÝ TRIK PRO STATICKÉ HTML
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.innerHTML = t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });

        UI.notify(t('notify.langSwitched'));
        Analytics.languageSwitched(prev, lang);
        Game.save();
        UI.renderAll(); // <--- TOTO PŘIDAT!
    },
    setDuration: function(min, btn) {
        GameState.selectedDuration = min;
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        UI.renderActions();
    },
    setMineDuration: function(min, btn) {
        GameState.selectedMineDuration = min;
        document.querySelectorAll('.mine-time-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        UI.renderMineActions();
    },
    igniteFireplace: function() {
        if (!GameState.inventory['tinderbox']) { UI.notify(t('game.noTinderbox'), true); return; }
        this.removeItem('tinderbox', 1);
        const isFirstTime = !GameState.achievements?.stats?.fireplaceCount;
        GameState.flags.fireplaceLit = true;
        GameState.flags.forceDark = false;
        if(GameState.achievements) GameState.achievements.stats.fireplaceCount++;
        if (typeof FireplaceSystem !== 'undefined') {
            if (!GameState.fire) GameState.fire = { active: false, fuelMs: 0, lastUpdate: Date.now() };
            GameState.fire.active = true;
            GameState.fire.fuelMs = 4 * 60 * 60 * 1000; // Úvodní zážeh: 4 hodiny
            GameState.fire.lastUpdate = Date.now();
        }
        UI.notifyPanel(t('game.fireKindled'), 'system');
        if (!audioSys) { try { audioSys = new AudioSystem(); audioSys.start(); } catch(e) {} }
        if(audioSys) audioSys.startFireLoop(false);
        Analytics.fireplaceIgnited(isFirstTime);
        Game.save(); Game.checkEnvironment();
    },
    lightSource: function(type) {
        if (!GameState.flags.fireplaceLit) { UI.notify(t('game.needFire'), true); return; }
        let item = (type === 'candle') ? 'candle' : 'primitive_torch';
        if (!GameState.inventory[item]) { UI.notify(t('game.missingItem').replace('{item}', ItemsDB[item].name), true); return; }
        
        if (type === 'candle') { 
            GameState.flags.torchLit = false; 
            GameState.flags.candleLit = true; 
            GameState.candleStart = Date.now();
            
            // Track candles lit
            if(GameState.achievements) {
                GameState.achievements.stats.candlesLit++;
            }
        }
        else { GameState.flags.candleLit = false; GameState.flags.torchLit = true; }
        
        this.removeItem(item, 1);
        UI.notify(t('game.itemIgnited').replace('{item}', ItemsDB[item].name));
        Game.save(); Game.checkEnvironment();
    },
    // ── Ztracené klíče — modal ───────────────────────────────────────────────
    showLostKeyModal: function(keyId) {
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
                { label: cs ? 'Close' : 'Zavřít', type: 'default', effect: function() {} }
            ] : [
                {
                    label: examineLabel,
                    type: examineDisabled ? 'default' : 'primary',
                    effect: examineDisabled ? function() { UI.notify(cs ? '⚠️ Not enough notes.' : '⚠️ Nedostatek zápisků.', true); } : function() {
                        Game.removeItem('research', researchCost);
                        GameState.flags[exploredFlag] = true;
                        if (isScroll) {
                            Game._applyLostScrollEffect(keyId, cs);
                        } else {
                            Game._applyLostKeyEffect(keyId, cs);
                        }
                        Game.save();
                    }
                },
                { label: cs ? '🗃️ Keep' : '🗃️ Uchovat', type: 'default', effect: function() {} }
            ]
        });
    },

    _applyLostKeyEffect: function(keyId, cs) {
        // Klíče 4× — odemknou postupně všechna folia Scrinia (dynamicky, roste s obsahem)
        const key4Folios = (typeof ScriniumDB !== 'undefined') ? ScriniumDB.folios.map(f => f.id) : ['folio_epistola','folio_fausto','folio_palimpsest','folio_titivillus'];

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
    _applyLostScrollEffect: function(scrollId, cs) {
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
        const ingNames = ingIds.map(function(id) {
            const ing = AthanorDB.ingredients.find(function(i) { return i.id === id; });
            return ing ? ing.name_lat : id;
        });
        const proc = AthanorDB.processes.find(function(p) { return p.id === procId; });

        UI.notify(cs
            ? '📜 The scroll reveals an old recipe: ' + combo.name_lat + '. Ingredients: ' + ingNames.join(' + ') + '. Process: ' + (proc ? proc.name : procId) + '.'
            : '📜 Svitek odhaluje starý recept: ' + combo.name + ' (' + combo.name_lat + '). Ingredience: ' + ingNames.join(' + ') + '. Proces: ' + (proc ? proc.name_cs : procId) + '.');
        UI.notifyPanel(cs ? '📜 An old scroll revealed an Athanor recipe.' : '📜 Starý svitek odhalil recept Athanoru.', 'system');
    },

    // ── Svazek sušených bylin — modal ────────────────────────────────────────
    showDriedHerbsModal: function() {
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
                    effect: function() {
                        if ((GameState.inventory['dried_herbs_bundle'] || 0) < 1) return;
                        Game.removeItem('dried_herbs_bundle', 1);
                        // Náhodný výběr 2-3 bylin
                        const herbPool = ['chamomile','thyme','mint','st_johns_wort','linden_blossom','sage','yarrow','hyssop'];
                        const count = Math.random() < 0.5 ? 3 : 2;
                        const shuffled = herbPool.sort(() => Math.random() - 0.5).slice(0, count);
                        shuffled.forEach(h => Game.addItem(h, 1));
                        const names = shuffled.map(h => typeof ItemsDB !== 'undefined' && ItemsDB[h] ? (cs ? (ItemsDB[h].name_en||ItemsDB[h].name) : ItemsDB[h].name) : h).join(', ');
                        UI.notify('🌿 ' + (cs ? 'Found: ' : 'Nalezeno: ') + names);
                        Game.save();
                    }
                },
                { label: cs ? '🗃️ Keep' : '🗃️ Uchovat', type: 'default', effect: function() {} }
            ]
        });
    },

    // ── Váček s konopím — modal ───────────────────────────────────────────────
    showHempPouchModal: function() {
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
                    effect: function() {
                        if ((GameState.inventory['hemp_pouch'] || 0) < 1) return;
                        Game.removeItem('hemp_pouch', 1);
                        Game.addItem('seeds_nettle', 2);
                        Game.addItem('fiber', 3);
                        UI.notify(cs ? '👝 Pouch opened. +2 nettle seeds, +3 fibre.' : '👝 Váček otevřen. +2 semínka kopřivy, +3 vlákno.');
                        Game.save();
                    }
                },
                { label: cs ? '🗃️ Keep' : '🗃️ Uchovat', type: 'default', effect: function() {} }
            ]
        });
    },

    // ── Záhadný kořen — modal ────────────────────────────────────────────────
    showMysteriousBulbModal: function() {
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
                    effect: function() {
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
                        const sName = typeof ItemsDB !== 'undefined' && ItemsDB[special] ? (cs ? (ItemsDB[special].name_en||ItemsDB[special].name) : ItemsDB[special].name) : special;
                        UI.notify('🌱 ' + (cs ? 'Planted: ' : 'Zasazeno: ') + sName + (cs ? ' (maybe...)' : ' (možná...)'));
                        Game.save();
                        if (typeof GardenSystem !== 'undefined') GardenSystem.renderGarden();
                    }
                },
                { label: cs ? '🗃️ Keep' : '🗃️ Uchovat', type: 'default', effect: function() {} }
            ]
        });
    },

    // ── Pečetní vosk — modal ─────────────────────────────────────────────────
    showWaxSealModal: function() {
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
                    effect: function() {
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
                    effect: function() {}
                }
            ]
        });
    },

    // ── Útržek pergamenu — modal ─────────────────────────────────────────────
    showTornPageModal: function() {
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
                    effect: function() {
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
                    effect: function() {}
                }
            ]
        });
    },

    // ── Staré mince — modal při nalezení nebo kliknutí ─────────────────────
    showCoinModal: function(itemId, value) {
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
                    effect: function() {
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
                    effect: function() {}
                }
            ]
        });
    },

    // ── Netolického pozůstalost — modal při nalezení nebo kliknutí ──────────
    showNetolickyModal: function() {
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
                    effect: function() {
                        Game.removeItem('netolicky_legacy', 1);
                        Game.addItem('research', 30);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockNetolickyFolios();
                        UI.notify(cs ? '📜 Netolický\'s legacy studied. +30 notes.' : '📜 Pozůstalost prostudována. +30 zápisků.');
                        Game.save();
                    }
                },
                {
                    label: cs ? '💰 Sell to Giacomo (+50 groschen)' : '💰 Prodat Giacomovi (+50 grošů)',
                    type: 'default',
                    effect: function() {
                        Game.removeItem('netolicky_legacy', 1);
                        Game.addItem('grosze', 50);
                        UI.notify(cs ? '💰 Giacomo paid 50 groschen for the document.' : '💰 Giacomo zaplatil 50 grošů za dokument.');
                        Game.save();
                    }
                },
                {
                    label: cs ? '🗃️ Keep for now' : '🗃️ Zatím uchovat',
                    type: 'default',
                    effect: function() {}
                }
            ]
        });
    },

    // ── Titivillus spis (Bestiář, Cesta B) — modal při nalezení nebo kliknutí ──
    showTitivillusSpisModal: function() {
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
                    effect: function() { Game.showTitivillusSpisContentModal(); }
                },
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'default',
                    effect: function() {
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
    showTitivillusSpisContentModal: function() {
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
                    effect: function() {
                        Game.removeItem('titivillus_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_titivillus_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                },
                {
                    label: isEn ? '🗃️ Keep in storage' : '🗃️ Uchovat ve skladu',
                    type: 'default',
                    effect: function() {}
                }
            ]
        });
    },

    // ── Acedia spis (Bestiář, Cesta B) — modal při nalezení nebo kliknutí ──
    showAcediaSpisModal: function() {
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
                    effect: function() { Game.showAcediaSpisContentModal(); }
                },
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'default',
                    effect: function() {
                        Game.removeItem('acedia_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_acedia_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                }
            ]
        });
    },

    showAcediaSpisContentModal: function() {
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
                    effect: function() {
                        Game.removeItem('acedia_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_acedia_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                },
                {
                    label: isEn ? '🗃️ Keep in storage' : '🗃️ Uchovat ve skladu',
                    type: 'default',
                    effect: function() {}
                }
            ]
        });
    },

    // ── Belzebub spis (Bestiář, Cesta B) — modal při nalezení nebo kliknutí ──
    showBelzebubSpisModal: function() {
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
                    effect: function() { Game.showBelzebubSpisContentModal(); }
                },
                {
                    label: isEn ? '📕 Hand to Scrinium' : '📕 Předat do Scrinia',
                    type: 'default',
                    effect: function() {
                        Game.removeItem('belzebub_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_belzebub_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                }
            ]
        });
    },

    showBelzebubSpisContentModal: function() {
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
                    effect: function() {
                        Game.removeItem('belzebub_spis', 1);
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_belzebub_bestiar');
                        UI.notify(isEn ? '📕 Handed to the Scrinium.' : '📕 Předáno do Scrinia.');
                        Game.save();
                    }
                },
                {
                    label: isEn ? '🗃️ Keep in storage' : '🗃️ Uchovat ve skladu',
                    type: 'default',
                    effect: function() {}
                }
            ]
        });
    },

    // MRD zahony-tiers — zasadit rovnou bez hnojiva, early-game friendly, nižší výnos (tier 0)
    skipFertilize: function(plotIdx) {
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
    fertilizeDuringGrowth: function(plotIdx) {
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
        this.removeItem(fertItem, 1);
        plot.midGrowFertilized = true;
        Game.save();
        UI.renderAll();
        UI.notify(lang === 'en' ? '🌱 Fertilized mid-growth — yield boosted.' : '🌱 Přihnojeno v průběhu růstu — výnos posílen.');
    },

    farmAction: function(plotIdx) {
        const plot = GameState.garden[plotIdx];
        if(plot.locked) { UI.notify(t('game.plotLocked'), true); return; }
        
        if (plot.state === 0) {
            if (!(GameState.inventory['hoe'] > 0)) { UI.notify(t('game.needHoe'), true); return; }
            const fertItem = (GameState.inventory['compost'] > 0) ? 'compost' : 'bonemeal';
            if (!(GameState.inventory[fertItem] > 0)) { UI.notify(t('game.needFertilizer'), true); return; }
            this.removeItem(fertItem, 1); plot.state = 1;
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
                const herbSeeds = ['seeds_herb','seeds_yellow','seeds_blue','seeds_mint','seeds_thyme','seeds_sage','seeds_fennel','seeds_wormwood','seeds_hyssop','seeds_yarrow'];
                seedsNeeded = herbSeeds.find(s => (GameState.inventory[s] || 0) > 0) || 'seeds_herb';
            } else if (plot.cropType === 'vegetable') {
                const vegSeeds = ['seeds_vegetable','seeds_leek','seeds_cabbage','seeds_radish','seeds_turnip','seeds_garlic'];
                seedsNeeded = vegSeeds.find(s => (GameState.inventory[s] || 0) > 0) || 'seeds_vegetable';
            } else if (plot.cropType === 'special') {
                const specSeeds = ['seeds_mandrake','seeds_belladonna','seeds_poppy','seeds_nettle','seeds_hops','seeds_herb'];
                seedsNeeded = specSeeds.find(s => (GameState.inventory[s] || 0) > 0) || '';
            }

            if (!seedsNeeded || !(GameState.inventory[seedsNeeded] > 0)) {
                UI.notify(t('game.needSeeds'), true);
                return;
            }

            this.removeItem(seedsNeeded, 1);
            plot.state = 2;

            // Seed → crop mapping — přes GARDEN_PLANTS_DB pokud možno
            if (typeof GardenSystem !== 'undefined' && GardenSystem.GARDEN_PLANTS_DB) {
                const plantDef = Object.values(GardenSystem.GARDEN_PLANTS_DB).find(p => p.seed === seedsNeeded && p.cropType === plot.cropType);
                if (plantDef) {
                    plot.crop = plantDef.item;
                } else {
                    // Fallback pro seeds_vegetable (náhodná zelenina)
                    const veggies = ['carrot','onion','leek','cabbage','radish','turnip'];
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
            if (usedSpring) this.removeItem('spring_water', 1); else this.removeItem('water', 1);
            plot.water = true;
            UI.notify(t(usedSpring ? 'game.wateredSpring' : 'game.watered'));
        } else if (plot.state === 2 && plot.water) {
            // Calculate growth time with tech bonuses (per-plodina, GARDEN_PLANTS_DB.growHours)
            let growthSpeed = CONFIG.GROWTH_SPEED;
            if(GameState.researchedTechs.includes('tech_advanced_farming')) {
                growthSpeed *= 2.0; // +100% faster growth
            }
            const growHoursForPlot = (typeof GardenSystem !== 'undefined') ? GardenSystem.getGrowHours(plot.crop) : 24;
            const needed = (growHoursForPlot * 3600000) / growthSpeed;
            
            if (Date.now() > plot.plantedAt + needed) {
                plot.state = 0; plot.water = false; 
                const harvestCrop = plot.crop;
                plot.crop = null; 
                
                // Track harvest stat
                if(GameState.achievements) {
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
                    this.addItem(harvestCrop, Math.max(1, Math.round(_gp.yield * _totalMult)));
                    // Šance vrátit semínko (30%) — NEPLATÍ pro druhy s kvetením (zahrada-rust-kveteni-mrd):
                    // u nich jde semínko jen přes GardenSystem.collectSeeds()
                    if (!_gp.canFlower && Math.random() < 0.3) this.addItem(_gp.seed, 1);
                } else if(harvestCrop === 'hops') {
                    this.addItem('hops', Math.max(1, Math.round(2 * _totalMult)));
                    if(Math.random() > 0.6) this.addItem('seeds_hops', 1);
                } else if(['carrot','onion','potato'].includes(harvestCrop)) {
                    this.addItem(harvestCrop, Math.max(1, Math.round(3 * _totalMult)));
                    if(Math.random() > 0.5) this.addItem('seeds_vegetable', 1);
                } else if (harvestCrop) {
                    // fallback pro neznámé plodiny
                    this.addItem(harvestCrop, Math.max(1, Math.round(2 * _totalMult)));
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
                        if (rt >= 1)  SecretsSystem.unlockFolioById('folio_signatura');
                        if (rt >= 5)  SecretsSystem.unlockFolioById('folio_hildegardis');
                        if (rt >= 15) SecretsSystem.unlockFolioById('folio_miasma');
                        if (mt >= 3)  SecretsSystem.unlockFolioById('folio_mandragora');
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

    plantTree: function(slotIdx, seedId) {
        if (!GameState.orchard) return;
        if (!seedId) { UI.notify(t('game.noSeedSelected'), true); return; }
        if (!(GameState.inventory[seedId] > 0)) { UI.notify(t('game.noSeeds'), true); return; }
        const slot = GameState.orchard[slotIdx];
        if (slot.state !== 'empty') { UI.notify(t('game.slotOccupied'), true); return; }
        this.removeItem(seedId, 1);
        slot.state    = 'growing';
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
        const baseQty = (slot.treeType === 'seed_walnut' || slot.treeType === 'seed_sorb') ? 2 : 3;
        const bountiful = Math.random() < 0.2;
        const qty = baseQty + (bountiful ? 1 : 0);
        this.addItem(fruit, qty);
        // Lípa dává navíc lipový květ
        if (slot.treeType === 'seed_linden') this.addItem('linden_blossom', 1);
        // Pyl při každé sklizni
        this.addItem('pollen', 1);
        slot.lastHarvestAt = Date.now();
        Game.save();
        UI.renderOrchard();
        const _lang = (GameState.settings && GameState.settings.language) || 'cs';
        UI.notify((bountiful ? '🍎✨ ' : '🍎 ') + t('game.treeHarvested').replace('{qty}', qty)
            + (bountiful ? (_lang === 'en' ? ' — bountiful harvest!' : ' — bohatá úroda!') : ''));
    },

    fellTree: function(slotIdx) { return GardenSystem.fellTree(slotIdx); },

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

    // ── Pomocná: nektarový modifikátor dle reálného počasí (WMO kód) ──────────
    // Napojeno na WeatherSystem (Open-Meteo, Praha) — žádné vlastní počasí.
    // Chybí-li data (offline/nenačteno), vrací neutrální 1.0 — tiché selhání.
    _apiaryWeatherMod: function() {
        try {
            const code = WeatherSystem && WeatherSystem.cache && WeatherSystem.cache.current
                ? WeatherSystem.cache.current.weather_code : null;
            if (code === null || code === undefined) return 1.0;
            if (code === 0)                          return 1.3;  // jasno — ideální snůška
            if (code === 1)                           return 1.15; // skoro jasno
            if (code === 2)                           return 1.0;  // polojasno
            if (code === 3)                           return 0.8;  // zataženo
            if (code >= 45 && code <= 48)              return 0.7;  // mlha
            if (code >= 51 && code <= 57)              return 0.6;  // mrholení
            if (code >= 61 && code <= 67)              return 0.4;  // déšť
            if (code >= 71 && code <= 77)              return 0.2;  // sníh
            if (code >= 80 && code <= 82)              return 0.4;  // přeháňky
            if (code >= 85 && code <= 86)              return 0.2;  // sněžení
            if (code >= 95 && code <= 99)              return 0.3;  // bouřka
            return 1.0;
        } catch(e) { return 1.0; }
    },

    buildHive: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (hive.built) return;
        if ((GameState.inventory['stick'] || 0) < 10) { UI.notify(t('game.needWood'), true); return; }
        if ((GameState.inventory['rope']  || 0) < 5)  { UI.notify(t('game.needRope'), true); return; }
        this.removeItem('stick', 10);
        this.removeItem('rope', 5);
        hive.built             = true;
        hive.hasQueen          = false;
        hive.queenName         = null;
        hive.queenStrength     = 0;   // produktivita medu, 2–4 hvězdy, nastaví se při usazení matky
        hive.queenVarroaResist = 0;   // odolnost vůči Varroa, 2–4 hvězdy
        hive.queenWinter       = 0;   // zimovatelnost, 2–4 hvězdy — ovlivňuje přežití zimy i šanci na veteránku
        hive.strength          = 0;   // 1–10 síla včelstva
        hive.varroa            = 0;   // 0–100 tlak Varroa, roste tiše v čase
        hive.varroaRevealed    = false; // MRD 5.1 — skrytá Varroa, ukáže se jen po Zkontrolovat/sklizni
        hive.swarmMood         = 0;   // 0–100 rojivá nálada
        hive.lastCollectAt     = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('🪹 ' + t('game.hiveBuilt'));
    },

    // ── Velký úl (Custos Apium, MRD Apiarium II) ──────────────────────────────
    buildGrandHive: function(slotIdx) {
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
        this.removeItem(hasTier2 ? 'velky_ul_2' : 'velky_ul_1', 1);
        hive.built             = true;
        hive.grand             = tier; // 1 nebo 2 — ovlivňuje yield multiplikátor v collectHive()
        hive.hasQueen          = false;
        hive.queenName         = null;
        hive.queenStrength     = 0;
        hive.queenVarroaResist = 0;
        hive.queenWinter       = 0;
        hive.strength          = 0;
        hive.varroa            = 0;
        hive.varroaRevealed    = false; // MRD 5.1 — skrytá Varroa
        hive.swarmMood         = 0;
        hive.lastCollectAt     = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('🛖 ' + (lang === 'en'
            ? `Great Hive (${tier === 2 ? 'II' : 'I'}) built!`
            : `Velký úl (${tier === 2 ? 'II' : 'I'}) postaven!`));
    },

    addQueen: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || hive.hasQueen) return;
        if (!(GameState.inventory['queen_bee'] > 0)) { UI.notify(t('game.needQueen'), true); return; }
        this.removeItem('queen_bee', 1);
        hive.hasQueen          = true;
        hive.queenName         = this._randomQueenName();
        hive.queenStrength     = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy (náhoda)
        hive.queenVarroaResist = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy
        hive.queenWinter       = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy
        hive.queenMildness     = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy — MRD 5.2, tlumí růst rojivé nálady
        hive.queenSwarm        = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy — MRD 5.2, žene rojivou náladu
        hive.strength          = 3; // začíná na střední síle
        hive.varroa            = 0;
        hive.varroaRevealed    = false; // MRD 5.1 — nová matka, nová neznámá
        hive.swarmMood         = 0;
        hive.lastCollectAt     = Date.now();
        hive.lastCutAt         = 0; // MRD 5.3 — řez matečníků, cooldown počítadlo
        Game.save();
        UI.renderApiary();
        UI.notify('🐝 ' + t('game.queenAdded') + ' — ' + hive.queenName);
    },

    // MRD 5.7 — chov matek: vysloužilá matka (z rojení, 280g na trhu) dá potomka
    // se zděděnou silou a zimovatelností (přesně dle popisu itemu veteran_queen)
    breedQueen: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || hive.hasQueen) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!(GameState.inventory['veteran_queen'] > 0)) {
            UI.notify(lang === 'en' ? 'Requires a veteran queen.' : 'Vyžaduje vysloužilou matku.', true);
            return;
        }
        this.removeItem('veteran_queen', 1);
        hive.hasQueen          = true;
        hive.queenName         = this._randomQueenName();
        hive.queenStrength     = Math.floor(Math.random() * 3) + 3; // 3–5 hvězdy — zděděná síla
        hive.queenVarroaResist = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy, normální rozptyl
        hive.queenWinter       = Math.floor(Math.random() * 3) + 3; // 3–5 hvězdy — zděděná zimovatelnost
        hive.queenMildness     = Math.floor(Math.random() * 3) + 2;
        hive.queenSwarm        = Math.floor(Math.random() * 3) + 2;
        hive.strength          = 3;
        hive.varroa            = 0;
        hive.varroaRevealed    = false;
        hive.swarmMood         = 0;
        hive.lastCollectAt     = Date.now();
        hive.lastCutAt         = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('👑 ' + (lang === 'en'
            ? `A bred queen — "${hive.queenName}" — inherits her mother's strength.`
            : `Chovná matka — „${hive.queenName}" — zdědila sílu své matky.`));
    },

    // MRD 5.6 — stárnutí propolisové tinktury (vzor: Foudres/foudresBarrel), jedna běžící dávka
    startTinkturaAging: function(amount) {
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
        this.removeItem('propolis_tinktura', amount);
        GameState.apiaryTinkturaAging = {
            amount: amount,
            startedAt: Date.now(),
            readyAt: Date.now() + 10 * 86400000, // 10 dní zrání
        };
        Game.save();
        UI.renderApiary();
        UI.notify('🏺 ' + (lang === 'en' ? 'Tincture set to age.' : 'Tinktura uložena ke zrání.'));
    },

    collectTinkturaAging: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const batch = GameState.apiaryTinkturaAging;
        if (!batch) return;
        if (Date.now() < batch.readyAt) {
            UI.notify(lang === 'en' ? 'Not ready yet.' : 'Ještě nezraje.', true);
            return;
        }
        this.addItem('propolis_tinktura_vyzrala', batch.amount);
        GameState.apiaryTinkturaAging = null;
        Game.save();
        UI.renderApiary();
        UI.notify('🏺 ' + (lang === 'en' ? 'Aged tincture collected.' : 'Vyzrálá tinktura vyzvednuta.'));
    },

    // MRD 5.3 — aktivní správa roje: řez matečníků, ~75% šance sníží rojivou náladu na 0
    cutQueenCells: function(slotIdx) {
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
    makeNuc: function(sourceIdx) {
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
        nuc.built             = true;
        nuc.hasQueen           = true;
        nuc.queenName          = this._randomQueenName();
        nuc.queenStrength      = Math.floor(Math.random() * 3) + 2;
        nuc.queenVarroaResist  = Math.floor(Math.random() * 3) + 2;
        nuc.queenWinter        = Math.floor(Math.random() * 3) + 2;
        nuc.queenMildness      = Math.floor(Math.random() * 3) + 2;
        nuc.queenSwarm         = Math.floor(Math.random() * 3) + 2;
        nuc.strength           = 2; // mladé včelstvo, začíná slabší než nákup nové matky
        nuc.varroa             = 0;
        nuc.varroaRevealed     = false;
        nuc.swarmMood          = 0;
        nuc.lastCollectAt      = Date.now();
        nuc.lastCutAt          = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('🐣 ' + (lang === 'en'
            ? `Nuc created — new colony "${nuc.queenName}" in a fresh slot.`
            : `Oddělek vytvořen — nové včelstvo „${nuc.queenName}“ v novém slotu.`));
    },

    // MRD 5.1 — bezplatná kontrola stavu Varroa kdykoliv, nezávisle na sklizni
    inspectHive: function(slotIdx) {
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

    collectHive: function(slotIdx) {
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
        const elapsedH     = (now - hive.lastCollectAt) / 3600000;
        const varroaResist = hive.queenVarroaResist || 3;
        const varroaGrowth = Math.max(1, Math.round((elapsedH / 8) * (5 - varroaResist)));
        hive.varroa = Math.min(100, (hive.varroa || 0) + varroaGrowth);
        hive.varroaRevealed = true; // MRD 5.1 — sklizeň odhalí skutečný stav
        const varroaPenalty = hive.varroa >= 70 ? 0.5 : hive.varroa >= 40 ? 0.8 : 1.0;

        // Produkce dle sezóny, síly včelstva, produktivity matky, počasí a stavu Varroa
        const strengthMod = (hive.strength || 3) / 5; // 0.2–2.0
        const queenMod     = (hive.queenStrength || 3) / 3; // 0.67–1.33
        const weatherMod   = this._apiaryWeatherMod();
        // Velký úl (MRD 5.9) — čistý multiplikátor navrch, žádnej jinej vzorec se neupravuje
        const grandMult    = hive.grand === 2 ? 1.5 : hive.grand === 1 ? 1.2 : 1.0;
        const honeyBase   = { spring: 1, summer: 3, autumn: 1 };
        const waxBase     = { spring: 1, summer: 1, autumn: 2 };
        const honeyYield  = Math.max(1, Math.round(honeyBase[season] * strengthMod * queenMod * weatherMod * varroaPenalty * grandMult));
        const waxYield    = Math.max(1, Math.round(waxBase[season] * strengthMod * varroaPenalty * grandMult));

        this.addItem('honey', honeyYield);
        this.addItem('beeswax', waxYield);

        // Celoživotní statistiky — "high stats" pro Včelařův přehled
        if (!GameState.apiaryStats) GameState.apiaryStats = { totalHoney: 0, totalWax: 0, totalPropolis: 0, totalPollen: 0, totalCollections: 0 };
        GameState.apiaryStats.totalHoney += honeyYield;
        GameState.apiaryStats.totalWax += waxYield;
        GameState.apiaryStats.totalCollections += 1;

        // Pyl bonus — jen léto, jen pokud kvetou záhony nebo sad
        if (season === 'summer') {
            const hasFlowers = GameState.garden && GameState.garden.some(p => p.state === 2 && p.water);
            const hasTrees   = GameState.orchard && GameState.orchard.some(s => s.state === 'mature');
            if (hasFlowers || hasTrees) { this.addItem('pollen', 1); GameState.apiaryStats.totalPollen += 1; }
        }

        // Propolis — vzácnější drobná šance při každé sklizni (MRD 5.5), Velký úl ji zdvojí
        const propolisChance = hive.grand ? 0.3 : 0.15;
        if (Math.random() < propolisChance) { this.addItem('propolis', 1); GameState.apiaryStats.totalPropolis += 1; }

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
            if (isVeteran) this.addItem('veteran_queen', 1);
            hive.hasQueen  = false;
            hive.queenName = null;
            hive.strength  = 0;
            hive.varroa    = 0;
            hive.swarmMood = 0;
            Game.save();
            UI.renderApiary();
            UI.notify(isVeteran
                ? '👑 ' + (lang==='en' ? 'The queen survived the swarm — a veteran, worth a fortune!' : 'Matka roj přežila — vysloužilá, cenná k prodeji!')
                : '🐝 ' + t('game.hiveRojivy'));
            return;
        }

        hive.lastCollectAt = now;
        Game.save();
        UI.renderApiary();
        UI.notify('🍯 ' + t('game.hiveCollected') + ' (' + honeyYield + '× med, ' + waxYield + '× vosk)');
    },

    // ── Zimní přikrmení ────────────────────────────────────────────────────────
    feedHive: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        const season = this._getApiarySeason();
        if (season !== 'winter') { UI.notify(t('game.hiveFeedOnlyWinter'), true); return; }
        if ((GameState.inventory['honey'] || 0) < 1) { UI.notify(t('game.hiveNeedHoney'), true); return; }
        this.removeItem('honey', 1);
        // Přikrmení zachová sílu nebo ji zvýší
        hive.strength = Math.min(10, (hive.strength || 3) + 1);
        Game.save();
        UI.renderApiary();
        UI.notify('🍯 ' + t('game.hiveFed'));
    },

    // ── Léčba Varroa ──────────────────────────────────────────────────────────
    treatVarroa: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((hive.varroa || 0) <= 0) { UI.notify(lang==='en' ? 'No Varroa pressure right now.' : 'Žádný tlak Varroa teď není.', true); return; }
        if ((GameState.inventory['thyme'] || 0) < 1) { UI.notify(t('game.hiveNeedThyme'), true); return; }
        this.removeItem('thyme', 1);
        const reduction = 30 + (hive.queenVarroaResist || 3) * 5; // 40–50 dle odolnosti matky
        hive.varroa   = Math.max(0, (hive.varroa || 0) - reduction);
        hive.strength = Math.max(1, (hive.strength || 3) - 1); // léčba stojí trochu síly
        Game.save();
        UI.renderApiary();
        UI.notify('🌿 ' + t('game.hiveTreated') + ' (-' + reduction + ' Varroa)');
    },

    // ── Zimní check (volá se 1× denně nebo při otevření Apiary) ───────────────
    checkApiaryWinter: function() {
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
                if (isVeteran) this.addItem('veteran_queen', 1);
                hive.hasQueen  = false;
                hive.queenName = null;
                hive.strength  = 0;
                hive.varroa    = 0;
                hive.swarmMood = 0;
                changed = true;
                UI.notify(isVeteran
                    ? '👑 ' + (lang==='en' ? 'She did not survive the hive, but the veteran queen herself lived on!' : 'Včelstvo zimu nepřežilo, ale vysloužilá matka sama ano!')
                    : '💀 ' + t('game.hiveDied'));
            }
        });
        if (changed) { Game.save(); UI.renderApiary(); }
    },

    // ── Náhodný Varroa event (volá se z EventsSystem nebo manuálně) ──────────
    triggerVarroa: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen) return;
        hive.varroa   = Math.min(100, (hive.varroa || 0) + 25);
        hive.strength = Math.max(1, (hive.strength || 3) - 2);
        Game.save();
        UI.renderApiary();
        UI.notify('⚠️ ' + t('game.hiveVarroa'));
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PISCINA (Rybník) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    // Unikátní id pro nový řádek v GameState.piscina.fish
    _piscinaNextId: function() {
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
    _piscinaSyncAggregates: function() {
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
    stockFish: function(species, qty) {
        const p = GameState.piscina;
        if (p.tier < 3) { UI.notify(t('game.needPiscina1'), true); return; }
        if ((GameState.inventory[species] || 0) < qty) { UI.notify(t('game.missingItem').replace('{item}', ItemsDB[species] ? ItemsDB[species].name : species), true); return; }
        this.removeItem(species, qty);
        p.fish = p.fish || [];
        p.fish.push({ id: Game._piscinaNextId(), species: species, stage: 'adult', qty: qty, enteredStageAt: Date.now() });
        Game._piscinaSyncAggregates();
        Game.save(); UI.renderPiscina();
        const name = (typeof iName === 'function') ? iName(species) : species;
        UI.notify('🎣 ' + name + ' ×' + qty + ' → Piscina');
    },

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
        this.removeItem('rock', cost.rock);
        this.removeItem('stick', cost.stick);
        if (cost.rope) this.removeItem('rope', cost.rope);
        p.tier = tier;
        Game.save(); UI.renderPiscina();
        UI.notify('🐟 ' + t('game.piscinaBuilt').replace('{tier}', tier));
    },

    addFry: function(qty) {
        const p = GameState.piscina;
        if (p.tier < 1) { UI.notify(t('game.needPiscina1'), true); return; }
        if ((GameState.inventory['fry']||0) < qty) { UI.notify(t('game.noFry'), true); return; }
        this.removeItem('fry', qty);
        p.fish = p.fish || [];
        p.fish.push({ id: Game._piscinaNextId(), species: 'kapr', stage: 'fry', qty: qty, enteredStageAt: Date.now() });
        Game._piscinaSyncAggregates();
        Game.save(); UI.renderPiscina();
        UI.notify('🫧 ' + t('game.fryAdded').replace('{qty}', qty));
    },

    feedPiscina: function() {
        const p = GameState.piscina;
        if (p.tier < 1) return;
        const feedNeeded = p.fry + p.youngCarp + p.carp;
        if (feedNeeded === 0) { UI.notify(t('game.piscinaEmpty'), true); return; }
        if ((GameState.inventory['fiber']||0) < feedNeeded) { UI.notify(t('game.needFeedFish') + ` (${feedNeeded})`, true); return; }
        this.removeItem('fiber', feedNeeded);
        p.lastFedAt = Date.now();
        Game.save(); UI.renderPiscina();
        UI.notify('🌿 ' + t('game.piscinaFed'));
    },

    transferFry: function() {
        const p = GameState.piscina;
        if (!p || (p.pendingFry||0) <= 0) { UI.notify(t('game.noFryPending'), true); return; }
        if (p.tier < 1) { UI.notify(t('game.needPiscina1'), true); return; }
        const qty = p.pendingFry;
        p.fish = p.fish || [];
        p.fish.push({ id: Game._piscinaNextId(), species: 'kapr', stage: 'fry', qty: qty, enteredStageAt: Date.now() });
        p.pendingFry = 0;
        Game._piscinaSyncAggregates();
        Game.save(); UI.renderPiscina();
        UI.notify('🫧 ' + t('game.fryTransferred').replace('{qty}', qty));
    },

    harvestCarp: function(qty) {
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
        Game._piscinaSyncAggregates();
        this.addItem('carp', qty);
        Game.save(); UI.renderPiscina();
        UI.notify('🐠 ' + t('game.carpHarvested').replace('{qty}', qty));
    },

    checkPiscinaGrowth: function() {
        const p = GameState.piscina;
        if (!p || p.tier < 1) return;
        p.fish = p.fish || [];
        const now = Date.now();
        const WEEK  = 7  * 24 * 3600000;
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
            Game._piscinaSyncAggregates();
            Game.save();
        }
    },

    // Štika — přirozená kontrola hejna (historicky doloženo, viz MRD sekce 4).
    // Týdně sežere 1 kus na štiku, vždy nejmladší dostupný řádek nekaprodravce
    // (young má přednost před fry — proxy za "nejslabší", bez simulace zdraví).
    // Nikdy nesahá na dospělé/tržní kusy — štika loví jen mezi dorůstajícími.
    checkPiscinaPredation: function() {
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
        Game._piscinaSyncAggregates();
        Game.save();
    },

    // Úlovek štiky — VÝHRADNĚ hráčem/mnichem, nikdy konvršem. Konvrš přiřazený
    // do Piscina Manufaktura sklízí jen kapra (viz oprava v auto-collect bloku
    // níže) — tahle funkce se odtud nikdy nevolá, štika se musí lovit ručně.
    catchPike: function(qty) {
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
        Game._piscinaSyncAggregates();
        this.addItem('stika', qty);
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
    moveToSadky: function(species, qty) {
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
        Game._piscinaSyncAggregates();

        if (!GameState.piscinaSadky) GameState.piscinaSadky = [];
        GameState.piscinaSadky.push({ id: Game._piscinaNextId(), species: species, qty: qty, enteredAt: Date.now(), phase: 'fresh' });
        this.addItem(species + '_sadky_fresh', qty);
        Game.save(); UI.renderPiscina();
        const name = (typeof iName === 'function') ? iName(species) : species;
        UI.notify('🪣 ' + name + ' ×' + qty + ' → ' + (lang === 'en' ? 'holding tank' : 'sádky'));
    },

    // Denní tick (self-guarded, volaný z tick smyčky vedle checkPiscinaGrowth).
    checkSadkyAging: function() {
        if (!GameState.piscinaSadky || !GameState.piscinaSadky.length) return;
        const now = Date.now();
        const DAY = 24 * 3600000;
        let advanced = 0;
        GameState.piscinaSadky.forEach(inst => {
            if (inst.phase === 'fresh' && inst.qty > 0 && now >= inst.enteredAt + Game.SADKY_PURIFY_DAYS * DAY) {
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

    startVylov: function() {
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
        GameState.piscinaVylov = { active: true, startedAt: Date.now(), readyAt: Date.now() + Game.VYLOV_DRAIN_DAYS * DAY, notifiedReady: false };
        Game.save(); UI.renderPiscina();
        UI.notify(lang === 'en' ? '🚰 Sluices opened — the pond is draining.' : '🚰 Stavidla otevřena — rybník se vypouští.');
    },

    // Denní tick (volaný z tick smyčky) — jen jednorázová notifikace, jakmile
    // vypouštění doběhne. Samotná sklizeň čeká na ruční harvestVylov().
    checkVylovStatus: function() {
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

    harvestVylov: function() {
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
        if (carpQty > 0) this.addItem('carp', carpQty);

        // Plevelná ryba/drobní — malý vedlejší výnos, prodá se rovnou chudině (charita, dle historického materiálu)
        const smallFishCoin = 2 + Math.floor(Math.random() * 4);
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(smallFishCoin);
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 1);

        Game._piscinaSyncAggregates();
        GameState.piscinaVylov = { active: false, startedAt: 0, readyAt: 0, notifiedReady: false };
        Game.save(); UI.renderPiscina();

        const msg = lang === 'en'
            ? `🎣 Autumn harvest: ${carpQty}× carp brought in${hasHelp ? ' (net-haulers\' help)' : ''}. Small fish sold to the poor for ${smallFishCoin} g. Pike remain in the pond — catch them separately.`
            : `🎣 Podzimní výlov: ${carpQty}× kapr sklizen${hasHelp ? ' (s pomocí sítětařů)' : ''}. Drobná ryba prodána chudině za ${smallFishCoin} g. Štiky zůstávají v rybníce — ulov je zvlášť.`;
        UI.notify(msg);
    },

    checkOrchardGrowth: function() {
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

    // ═══════════════════════════════════════════════════════════════════════════
    // GALLINARIUM (Kurník) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    buildHenhouse: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.buildHenhouse(...args); },

    addHen: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.addHen(...args); },

    startNesting: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.startNesting(...args); },

    slaughterChick: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterChick(...args); },

    slaughterHen: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterHen(...args); },

    collectHenhouse: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.collectHenhouse(...args); },

    feedHenhouse: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.feedHenhouse(...args); },

    // ═══════════════════════════════════════════════════════════════════════════
    // OVILE (Chlév) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

    buildSheepfold: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.buildSheepfold(...args); },

    addSheep: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.addSheep(...args); },

    startBreeding: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.startBreeding(...args); },

    slaughterLamb: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterLamb(...args); },

    slaughterSheep: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.slaughterSheep(...args); },

    collectSheepfold: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.collectSheepfold(...args); },

    feedSheepfold: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.feedSheepfold(...args); },

    // ═══════════════════════════════════════════════════════════════════════════
    // FARMYARD PRODUCTION TICK — volán každou minutu
    // ═══════════════════════════════════════════════════════════════════════════

    checkFarmyardProduction: function(...args) { if (typeof FarmyardSystem !== 'undefined') FarmyardSystem.checkFarmyardProduction(...args); },

    scavenge: function(type) {
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
                quarry_stone:      { 2.5: [10, 12], 5: [20, 30], 10: [45, 55], 20: [130, 160], 30: [240, 300] },
                mine_iron_ore:     { 2.5: [1, 1],   5: [1, 3],   10: [3, 5],   20: [6, 10],     30: [10, 15] },
                quarry_limestone:  { 2.5: [8, 10],  5: [16, 24], 10: [36, 44], 20: [100, 130],  30: [190, 240] },
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
                    this.addItem('rock', Math.max(1, Math.round(qty * _mMultC * _freshMult)));
                    if (Math.random() < 0.15) this.addItem('cut_stone', 1);
                    if (Math.random() < 0.05) this.addItem('clay', 1);
                    if (_hasPalice && Math.random() < 0.05) this.addItem('vapenec', 1);
                } else if (type === 'mine_iron_ore') {
                    const range = MINE_YIELD.mine_iron_ore[_tier] || MINE_YIELD.mine_iron_ore[5];
                    const qty = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
                    this.addItem('iron_ore', Math.max(1, Math.round(qty * _mMultC * _freshMult)));
                    if (Math.random() < 0.20) this.addItem('charcoal', 1);
                    if (Math.random() < 0.05) this.addItem('rock', 2);
                    if (_hasPalice && Math.random() < 0.08) this.addItem('vapenec', 1);
                } else if (type === 'quarry_limestone') {
                    const range = MINE_YIELD.quarry_limestone[_tier] || MINE_YIELD.quarry_limestone[5];
                    const qty = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
                    this.addItem('vapenec', Math.max(1, Math.round(qty * _mMultC * _freshMult)));
                }
                const _tgains = {};
                for (const k of Object.keys(GameState.inventory)) {
                    const diff = (GameState.inventory[k] || 0) - (_invBefore[k] || 0);
                    if (diff > 0) _tgains[k] = diff;
                }
                if (Object.keys(_tgains).length > 0) UI.notifyAccum(_tgains);
                if (_mFoundC) this.useToolCharge(_mFoundC.item);
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
            const _horseCount = (GameState.stable && GameState.stable.animals) ? GameState.stable.animals.length : 0;
            const _horseTimeMult = _horseCount >= 2 ? 0.5 : _horseCount === 1 ? 0.75 : 1.0;
            const _mineMs = Math.round(_tierStart * 60 * 1000 * _horseTimeMult);
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
        Game._scavenging = true;
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
            if(GameState.achievements) {
                GameState.achievements.stats.actionsCompleted++;
            }
            
            Game._scavenging = true;
            const _invBefore = {};
            for (const k of Object.keys(GameState.inventory)) _invBefore[k] = GameState.inventory[k] || 0;
            let total = 0;
            for(let i=0; i<count; i++) {
                let r = Math.random();
                if (type === 'hunt') { 
                    this.addItem('fat', 1); 
                    this.addItem('meat', 1); 
                    if (r > 0.4) this.addItem('bone', 1);
                    // v7.5: NEW DROPS
                    if (r > 0.5) this.addItem('hide', 1); // 50% chance - wild hide, needs processing into raw_hide or wild_leather
                    if (r > 0.7) this.addItem('feather', 1); // 30% chance - for quill
                }
                else if (type === 'nature') { 
                    if(r<0.08) this.addItem('herb_red',1);
                    else if(r<0.12) this.addItem('herb_yellow',1);
                    else if(r<0.16) this.addItem('herb_blue',1);
                    else if(r<0.2) this.addItem('mint',1);
                    else if(r<0.5) this.addItem('fiber',2);
                    else if(r<0.7) this.addItem('water',1);
                    else if(r<0.8) this.addItem('seeds_herb',1);
                    else if(r<0.9) this.addItem('seeds_yellow',1);
                    else if(r<0.95) this.addItem('seeds_blue',1);
                    else this.addItem('seeds_mint',1);
                    
                    // v7.5: NEW DROP - gall_nut for gallic ink
                    if(Math.random() < 0.06) this.addItem('gall_nut', 1); // 6% chance
                    // hadry — základ hadrového papíru
                    if(Math.random() < 0.35) this.addItem('rags', 1);
                    // Athanor: byliny
                    if(Math.random() < 0.08) this.addItem('chamomile', 1);
                    if(Math.random() < 0.08) this.addItem('plantain', 1);
                    if(Math.random() < 0.05) this.addItem('st_johns_wort', 1);
                    if(Math.random() < 0.04) this.addItem('thyme', 1);
                    if(Math.random() < 0.03) this.addItem('seeds_thyme', 1);
                    if(Math.random() < 0.02) this.addItem('hops', 1);
                    if(Math.random() < 0.01) this.addItem('seeds_hops', 1);
                    // v8.x: Nové byliny — šalvěj, fenykl, pelyněk, yzop, řebříček
                    if(Math.random() < 0.03) this.addItem('sage', 1);
                    if(Math.random() < 0.02) this.addItem('fennel', 1);
                    if(Math.random() < 0.03) this.addItem('wormwood', 1);
                    if(Math.random() < 0.04) this.addItem('yarrow', 1);
                    if(Math.random() < 0.02) this.addItem('hyssop', 1);
                    // Titivillus-infirmary-mrd — kostival, jalovec, rozmarýn (na mast proti revma/křeči)
                    if(Math.random() < 0.03) this.addItem('comfrey', 1);
                    if(Math.random() < 0.02) this.addItem('juniper', 1);
                    if(Math.random() < 0.03) this.addItem('rosemary', 1);
                    // Semena nových bylin — vzácnější
                    if(Math.random() < 0.015) this.addItem('seeds_sage', 1);
                    if(Math.random() < 0.010) this.addItem('seeds_wormwood', 1);
                    if(Math.random() < 0.020) this.addItem('seeds_yarrow', 1);
                    // Rare drop - Netolického pozůstalost (0.1% chance)
                    if(Math.random() < 0.001) {
                        this.addItem('netolicky_legacy', 1);
                        UI.notifyPanel('📜 ' + (typeof t === 'function' ? t('game.rareFind') : 'Vzácný nález!'), 'system');
                        setTimeout(function() { Game.showNetolickyModal(); }, 300);
                    }
                    // 0.16% — spony/dýmky/drobnosti (viz LOST_ITEM_POOLS.nature)
                    if(Math.random() < 0.0016) {
                        const pool = this.LOST_ITEM_POOLS.nature;
                        const found = pool[Math.floor(Math.random() * pool.length)];
                        this.addItem(found, 1);
                        UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                    }
                    // Alchymický symbol vyrytý do kamene/kůry — 4. cesta k Athanoru (laboratoryClues, 3 potřeba)
                    if (GameState.secrets && !GameState.secrets.laboratoryUnlocked && (GameState.secrets.laboratoryClues || 0) < 3 && Math.random() < 0.0016) {
                        if (typeof SecretsSystem !== 'undefined') SecretsSystem.addLaboratoryClue();
                    }
                    // v8.x: Sad & Apiarium drops
                    if(Math.random() < 0.04) this.addItem('pollen', 1);          // 4% — pyl z luk
                    if(Math.random() < 0.03) this.addItem('linden_blossom', 1);  // 3% — lipový květ
                    // Semena stromů — vzácné nálezy při sběru v přírodě
                    const treeSeedRoll = Math.random();
                    if(treeSeedRoll < 0.015)      this.addItem('seed_apple', 1);
                    else if(treeSeedRoll < 0.025) this.addItem('seed_pear', 1);
                    else if(treeSeedRoll < 0.034) this.addItem('seed_plum', 1);
                    else if(treeSeedRoll < 0.040) this.addItem('seed_cherry', 1);
                    else if(treeSeedRoll < 0.043) this.addItem('seed_rowan', 1);
                    // Plané ovoce a šípky — podzim (Cultus Herbarum)
                    if(Math.random() < 0.06) this.addItem('rosehip', 1);
                    if(Math.random() < 0.05) this.addItem('wild_fruit', 1);
                    if(Math.random() < 0.04) this.addItem('cornel_cherry', 1);
                    if(Math.random() < 0.03) this.addItem('sloe', 1);
                    if(Math.random() < 0.03) this.addItem('bracket_fungus', 1);
                }
                else if (type === 'basic') {
                    this.addItem((r<0.4?'rock':'stick'), 1);
                    if(Math.random() < 0.05) this.addItem('carbon_black', 1);
                    if(Math.random() < 0.04) this.addItem('ochre', 1);
                    if(Math.random() < 0.10) this.addItem('chalk', 1);
                    if(Math.random() < 0.35) this.addItem('rags', 1);
                    // Iron ore — vzácný nález (3%) po odemčení kovařiny
                    if(Math.random() < 0.03 && GameState.researchedTechs && GameState.researchedTechs.includes('tech_kovarina')) {
                        this.addItem('iron_ore', 1);
                    }
                    // 0.17% — klíče/svitky/mince (viz LOST_ITEM_POOLS.basic)
                    if(Math.random() < 0.0017) {
                        const pool = this.LOST_ITEM_POOLS.basic;
                        const found = pool[Math.floor(Math.random() * pool.length)];
                        this.addItem(found, 1);
                        UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                    }
                }
                else if (type === 'bark') { if (Math.random() < 0.15) this.addItem('vrbova_kura', 1); else if (Math.random() < 0.15) this.addItem('oak_bark', 1); else this.addItem('bark', 2); }
                else if (type === 'fishing') { this.addItem('fish', r<0.3?2:1); if(r>0.8) this.addItem('water', 1); }
                else if (type === 'foraging') { 
                    if(r<0.25) this.addItem('mushroom', 2);
                    else if(r<0.45) this.addItem('berries', 2);
                    else if(r<0.55) this.addItem('mushroom_poison', 1);
                    else if(r<0.7) this.addItem('roots', 1);
                    else if(r<0.8) this.addItem('seeds_vegetable', 1);
                    else if(r<0.9) this.addItem('nightshade', 1);
                    else this.addItem('fiber', 1);
                    if(Math.random() < 0.02) this.addItem('viticis_baco', 1);
                    // v8.x: Zelenina a koření při sběru potravy
                    if(Math.random() < 0.05) this.addItem('garlic', 1);
                    if(Math.random() < 0.04) this.addItem('leek', 1);
                    if(Math.random() < 0.04) this.addItem('nettle', 1);
                    if(Math.random() < 0.04) this.addItem('galium', 1);
                    if(Math.random() < 0.03) this.addItem('seeds_garlic', 1);
                    if(Math.random() < 0.02) this.addItem('seeds_nettle', 1);
                    // Žaludy — podzimní nález
                    if(Math.random() < 0.12) this.addItem('acorn', 1);
                    // Hlemýždi — vyšší šance po dešti
                    const _snailWet = (typeof WeatherSystem !== 'undefined') ? WeatherSystem.countWetDays(3) : { wet: 0 };
                    if(Math.random() < (_snailWet.wet >= 2 ? 0.15 : 0.05)) this.addItem('snail', 1);
                    // Divoké byliny a kořeny (Cultus Herbarum)
                    if(Math.random() < 0.06) this.addItem('ground_elder', 1);
                    if(Math.random() < 0.05) this.addItem('goosefoot', 1);
                    if(Math.random() < 0.05) this.addItem('sorrel', 1);
                    if(Math.random() < 0.04) this.addItem('dandelion', 1);
                    if(Math.random() < 0.05) this.addItem('burdock_root', 1);
                    if(Math.random() < 0.05) this.addItem('couch_grass', 1);
                    // Titivillus-infirmary-mrd — jalovec roste v lesích/na mezích
                    if(Math.random() < 0.03) this.addItem('juniper', 1);
                    // Bukvice — podzim, spolu se žaludy
                    if(Math.random() < 0.08) this.addItem('beechnut', 1);
                    // Vzácnější houby (Cultus Herbarum)
                    if(Math.random() < 0.03) this.addItem('morel', 1);
                    if(Math.random() < 0.04) this.addItem('saffron_milk_cap', 1);
                    if(Math.random() < 0.03) this.addItem('porcini', 1);
                    // 0.07% — útržky, pečeť, byliny/váček zapomenuté v přírodě (viz LOST_ITEM_POOLS.foraging)
                    if(Math.random() < 0.0007) {
                        const pool = this.LOST_ITEM_POOLS.foraging;
                        const found = pool[Math.floor(Math.random() * pool.length)];
                        this.addItem(found, 1);
                        UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                    }
                }
                else if (type === 'wetlands') {
                    if(r<0.4) this.addItem('frog', 1);
                    else if(r<0.7) this.addItem('slug', 2);
                    else if(r<0.85) this.addItem('water', 2);
                    else this.addItem('fiber', 1);
                    // v8.x: plůdek — vzácný nález v mokřadu
                    if(Math.random() < 0.08) this.addItem('fry', 1);
                    // Raci — vzácnější nález v mokřadu
                    if(Math.random() < 0.15) this.addItem('crayfish', 1);
                    // Orobinec — kořen z mokřadu
                    if(Math.random() < 0.06) this.addItem('cattail_root', 1);
                    // Proutí — vrbové pruty u mokřadu, běžný stavební materiál (Columbarium)
                    if(Math.random() < 0.20) this.addItem('wicker', 2);
                }
                else if (type === 'resin_harvest') {
                    if(r<0.5) this.addItem('resin', 1);
                    else if(r<0.7) this.addItem('honey', 1);
                    else this.addItem('bark', 1);
                    if(Math.random() < 0.20) this.addItem('beeswax', 1);
                    if(Math.random() < 0.05) this.addItem('linden_blossom', 1);
                    if(Math.random() < 0.03) this.addItem('pollen', 1);
                    if(Math.random() < 0.03) this.addItem('viticis_baco', 1);
                    // Kadidlo: smrková a borová pryskyřice
                    if(Math.random() < 0.40) this.addItem('resin_spruce', 1);
                    if(Math.random() < 0.25) this.addItem('resin_pine', 1);
                }
                else if (type === 'grass_gather') {
                    this.addItem('grass', Math.random() < 0.5 ? 3 : 2);
                    this.addItem('fiber', Math.random() < 0.5 ? 3 : 2);
                    if(Math.random() < 0.30) this.addItem('linden_blossom', 1);
                    if(Math.random() < 0.20) this.addItem('chamomile', 1);
                    if(Math.random() < 0.10) this.addItem('thyme', 1);
                    if(Math.random() < 0.08) this.addItem('yarrow', 1);
                    if(Math.random() < 0.05) this.addItem('wormwood', 1);
                    if(Math.random() < 0.04) this.addItem('sage', 1);
                    if(Math.random() < 0.02) this.addItem('plantain', 1);
                    // Titivillus-infirmary-mrd — kostival a rozmarýn rostou mezi trávou (jalovec je keř, viz jinde)
                    if(Math.random() < 0.03) this.addItem('comfrey', 1);
                    if(Math.random() < 0.02) this.addItem('rosemary', 1);
                    // Divoke obili mezi travou
                    if(Math.random() < 0.04) this.addItem('seeds_rye', 1);
                    if(Math.random() < 0.03) this.addItem('seeds_wheat', 1);
                    if(Math.random() < 0.03) this.addItem('seeds_barley', 1);
                    if(Math.random() < 0.03) this.addItem('seeds_oats', 1);
                    if(Math.random() < 0.02) this.addItem('seeds_millet', 1);
                    if(Math.random() < 0.02) this.addItem('seeds_peas', 1);
                    if(Math.random() < 0.015) this.addItem('seeds_flax', 1);
                }
                else if (type === 'wood_harvest') {
                    this.addItem('log', Math.random() < 0.4 ? 2 : 1);
                    if(Math.random() < 0.60) this.addItem('stick', 2);
                    if(Math.random() < 0.20) this.addItem('bark', 1);
                    if(Math.random() < 0.10) this.addItem('resin', 1);
                    if(Math.random() < 0.05) this.addItem('charcoal', 1);
                }
                else if (type === 'worms_dig') {
                    this.addItem('worms', Math.random() < 0.5 ? 3 : 2);
                    if(Math.random() < 0.40) this.addItem('rock', 1);
                    if(Math.random() < 0.20) this.addItem('clay', 1);
                    if(Math.random() < 0.10) this.addItem('seeds_herb', 1);
                }
                else if (type === 'dig_clay') {
                    this.addItem('clay', Math.random() < 0.5 ? 3 : 2);
                    if(Math.random() < 0.30) this.addItem('rock', 1);
                    if(Math.random() < 0.10) this.addItem('worms', 1);
                }
                else if (type === 'yard_cleanup') {
                    this.addItem('scraps', Math.random() < 0.5 ? 2 : 1);
                    if(Math.random() < 0.40) this.addItem('feather_hen', 1);
                    if(Math.random() < 0.30) this.addItem('wool', 1);
                    if(Math.random() < 0.20) this.addItem('egg', 1);
                    if(Math.random() < 0.10) this.addItem('pollen', 1);
                    if(Math.random() < 0.05) this.addItem('bone', 1);
                    this.addItem('rags', 1);                             // staré hadry z hospodářství
                    if(Math.random() < 0.35) this.addItem('rags', 1);   // bonus
                    // 0.2% — náhodný lostItem z CELÉHO poolu (obecný úklid, snížené
                    // z 0.5% při rozdělení dalších skupin do basic/nature/foraging)
                    if(Math.random() < 0.002) {
                        const lostPool = Object.entries(ItemsDB).filter(([id, i]) => i.lostItem).map(([id]) => id);
                        if(lostPool.length > 0) {
                            const found = lostPool[Math.floor(Math.random() * lostPool.length)];
                            this.addItem(found, 1);
                            UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                        }
                    }
                }
                else if (type === 'quarry_stone') {
                    const qty = Math.random() < 0.4 ? 6 : (Math.random() < 0.6 ? 4 : 3);
                    this.addItem('rock', Math.round(qty * _toolMult));
                    if(Math.random() < 0.15) this.addItem('cut_stone', 1);
                    if(Math.random() < 0.05) this.addItem('clay', 1);
                }
                else if (type === 'mine_iron_ore') {
                    const qty = Math.random() < 0.4 ? 3 : (Math.random() < 0.6 ? 2 : 1);
                    this.addItem('iron_ore', Math.round(qty * _toolMult));
                    if(Math.random() < 0.20) this.addItem('charcoal', 1);
                    if(Math.random() < 0.05) this.addItem('rock', 2);
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
            Game._scavenging = false;
            if (_usedToolId) Game.useToolCharge(_usedToolId);
            Game.save(); UI.renderAll(); return;
        }
        if (GameState.activeAction && (type === 'basic' || type === 'nature')) {
            // Únava hospodářství platí i tady — jinak jde o grindovací díru
            // (timed akce běží jinde, ale RYCHLE! by jinak bylo bez postihu).
            if (typeof CuriaSystem !== 'undefined') CuriaSystem.onScavenge(0);
            let r = Math.random();
            if (type === 'nature') { 
                if(r<0.08) this.addItem('herb_red',1);
                else if(r<0.12) this.addItem('herb_yellow',1);
                else if(r<0.16) this.addItem('herb_blue',1);
                else if(r<0.2) this.addItem('mint',1);
                else if(r<0.5) this.addItem('fiber',2);
                else if(r<0.7) this.addItem('water',1);
                else if(r<0.8) this.addItem('seeds_herb',1);
                else if(r<0.9) this.addItem('seeds_yellow',1);
                else if(r<0.95) this.addItem('seeds_blue',1);
                else this.addItem('seeds_mint',1);
                
                // v7.5: NEW DROP - gall_nut for gallic ink
                if(Math.random() < 0.06) this.addItem('gall_nut', 1); // 6% chance
                // hadry — základ hadrového papíru
                if(Math.random() < 0.35) this.addItem('rags', 1);
                
                // Rare drop - Netolického pozůstalost (0.1% chance)
                if(Math.random() < 0.001) {
                    this.addItem('netolicky_legacy', 1);
                    UI.notifyPanel('📜 ' + (typeof t === 'function' ? t('game.rareFind') : 'Vzácný nález!'), 'system');
                    setTimeout(function() { Game.showNetolickyModal(); }, 300);
                }
                if(Math.random() < 0.0016) {
                    const pool = this.LOST_ITEM_POOLS.nature;
                    const found = pool[Math.floor(Math.random() * pool.length)];
                    this.addItem(found, 1);
                    UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                }
            }
            else if (type === 'basic') { 
                this.addItem((r<0.4?'rock':'stick'), 1); 
                if(Math.random() < 0.10) this.addItem('chalk', 1);
                if(Math.random() < 0.35) this.addItem('rags', 1);
                if(Math.random() < 0.0017) {
                    const pool = this.LOST_ITEM_POOLS.basic;
                    const found = pool[Math.floor(Math.random() * pool.length)];
                    this.addItem(found, 1);
                    UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                }
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
            Game._scavenging = false;
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
            Game._scavenging = true;
            const _s0before = {};
            for (const k of Object.keys(GameState.inventory)) _s0before[k] = GameState.inventory[k] || 0;
            let r = Math.random();
            if (type === 'hunt') { 
                this.addItem('fat', 1); 
                this.addItem('meat', 1); 
                if (r > 0.4) this.addItem('bone', 1);
                // v7.5: NEW DROPS
                if (r > 0.5) this.addItem('hide', 1); // 50% chance
                if (r > 0.7) this.addItem('feather', 1); // 30% chance
            }
            else if (type === 'nature') { 
                if(r<0.08) this.addItem('herb_red',1);
                else if(r<0.12) this.addItem('herb_yellow',1);
                else if(r<0.16) this.addItem('herb_blue',1);
                else if(r<0.2) this.addItem('mint',1);
                else if(r<0.5) this.addItem('fiber',2);
                else if(r<0.7) this.addItem('water',1);
                else if(r<0.8) this.addItem('seeds_herb',1);
                else if(r<0.9) this.addItem('seeds_yellow',1);
                else if(r<0.95) this.addItem('seeds_blue',1);
                else this.addItem('seeds_mint',1);
                
                // v7.5: NEW DROP - gall_nut for gallic ink
                if(Math.random() < 0.06) this.addItem('gall_nut', 1); // 6% chance
                // hadry — základ hadrového papíru
                if(Math.random() < 0.35) this.addItem('rags', 1);
                // Athanor: byliny
                if(Math.random() < 0.08) this.addItem('chamomile', 1);
                if(Math.random() < 0.08) this.addItem('plantain', 1);
                if(Math.random() < 0.05) this.addItem('st_johns_wort', 1);
                if(Math.random() < 0.04) this.addItem('thyme', 1);
                if(Math.random() < 0.03) this.addItem('seeds_thyme', 1);
                if(Math.random() < 0.02) this.addItem('hops', 1);
                if(Math.random() < 0.01) this.addItem('seeds_hops', 1);
                // v8.x: Nové byliny
                if(Math.random() < 0.03) this.addItem('sage', 1);
                if(Math.random() < 0.02) this.addItem('fennel', 1);
                if(Math.random() < 0.03) this.addItem('wormwood', 1);
                if(Math.random() < 0.04) this.addItem('yarrow', 1);
                if(Math.random() < 0.02) this.addItem('hyssop', 1);
                // Titivillus-infirmary-mrd — kostival, jalovec, rozmarýn
                if(Math.random() < 0.03) this.addItem('comfrey', 1);
                if(Math.random() < 0.02) this.addItem('juniper', 1);
                if(Math.random() < 0.03) this.addItem('rosemary', 1);
                if(Math.random() < 0.015) this.addItem('seeds_sage', 1);
                if(Math.random() < 0.010) this.addItem('seeds_wormwood', 1);
                if(Math.random() < 0.020) this.addItem('seeds_yarrow', 1);
                // Rare drop - Netolického pozůstalost (0.1% chance)
                if(Math.random() < 0.001) {
                    this.addItem('netolicky_legacy', 1);
                    UI.notifyPanel('📜 ' + (typeof t === 'function' ? t('game.rareFind') : 'Vzácný nález!'), 'system');
                    setTimeout(function() { Game.showNetolickyModal(); }, 300);
                }
                if(Math.random() < 0.0016) {
                    const pool = this.LOST_ITEM_POOLS.nature;
                    const found = pool[Math.floor(Math.random() * pool.length)];
                    this.addItem(found, 1);
                    UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                }
                // Plané ovoce a šípky — podzim (Cultus Herbarum)
                if(Math.random() < 0.06) this.addItem('rosehip', 1);
                if(Math.random() < 0.05) this.addItem('wild_fruit', 1);
                if(Math.random() < 0.04) this.addItem('cornel_cherry', 1);
                if(Math.random() < 0.03) this.addItem('sloe', 1);
                if(Math.random() < 0.03) this.addItem('bracket_fungus', 1);
            }
            else if (type === 'basic') {
                this.addItem((r<0.4?'rock':'stick'), 1);
                if(Math.random() < 0.05) this.addItem('carbon_black', 1);
                if(Math.random() < 0.04) this.addItem('ochre', 1);
                if(Math.random() < 0.10) this.addItem('chalk', 1); // Křídová pánev — lokálně dostupná
                if(Math.random() < 0.35) this.addItem('rags', 1);
                if(Math.random() < 0.0017) {
                    const pool = this.LOST_ITEM_POOLS.basic;
                    const found = pool[Math.floor(Math.random() * pool.length)];
                    this.addItem(found, 1);
                    UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                }
            }
            else if (type === 'bark') { if (Math.random() < 0.15) this.addItem('vrbova_kura', 1); else if (Math.random() < 0.15) this.addItem('oak_bark', 1); else this.addItem('bark', 2); }
            else if (type === 'fishing') { this.addItem('fish', r<0.3?2:1); if(r>0.8) this.addItem('water', 1); }
            else if (type === 'foraging') { 
                if(r<0.25) this.addItem('mushroom', 2);
                else if(r<0.45) this.addItem('berries', 2);
                else if(r<0.55) this.addItem('mushroom_poison', 1);
                else if(r<0.7) this.addItem('roots', 1);
                else if(r<0.8) this.addItem('seeds_vegetable', 1);
                else if(r<0.9) this.addItem('nightshade', 1);
                else this.addItem('fiber', 1);
                if(Math.random() < 0.02) this.addItem('viticis_baco', 1);
                // v8.x: Zelenina a koření
                if(Math.random() < 0.05) this.addItem('garlic', 1);
                if(Math.random() < 0.04) this.addItem('leek', 1);
                if(Math.random() < 0.04) this.addItem('nettle', 1);
                if(Math.random() < 0.04) this.addItem('galium', 1);
                if(Math.random() < 0.03) this.addItem('seeds_garlic', 1);
                if(Math.random() < 0.02) this.addItem('seeds_nettle', 1);
                // Žaludy
                if(Math.random() < 0.12) this.addItem('acorn', 1);
                // Hlemýždi — vyšší šance po dešti
                const _snailWet2 = (typeof WeatherSystem !== 'undefined') ? WeatherSystem.countWetDays(3) : { wet: 0 };
                if(Math.random() < (_snailWet2.wet >= 2 ? 0.15 : 0.05)) this.addItem('snail', 1);
                // Divoké byliny a kořeny (Cultus Herbarum)
                if(Math.random() < 0.06) this.addItem('ground_elder', 1);
                if(Math.random() < 0.05) this.addItem('goosefoot', 1);
                if(Math.random() < 0.05) this.addItem('sorrel', 1);
                if(Math.random() < 0.04) this.addItem('dandelion', 1);
                if(Math.random() < 0.05) this.addItem('burdock_root', 1);
                if(Math.random() < 0.05) this.addItem('couch_grass', 1);
                // Titivillus-infirmary-mrd — jalovec
                if(Math.random() < 0.03) this.addItem('juniper', 1);
                // Bukvice — podzim, spolu se žaludy
                if(Math.random() < 0.08) this.addItem('beechnut', 1);
                // Vzácnější houby (Cultus Herbarum)
                if(Math.random() < 0.03) this.addItem('morel', 1);
                if(Math.random() < 0.04) this.addItem('saffron_milk_cap', 1);
                if(Math.random() < 0.03) this.addItem('porcini', 1);
                if(Math.random() < 0.0007) {
                    const pool = this.LOST_ITEM_POOLS.foraging;
                    const found = pool[Math.floor(Math.random() * pool.length)];
                    this.addItem(found, 1);
                    UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                }
            }
            else if (type === 'wetlands') {
                if(r<0.4) this.addItem('frog', 1);
                else if(r<0.7) this.addItem('slug', 2);
                else if(r<0.85) this.addItem('water', 2);
                else this.addItem('fiber', 1);
                // v8.x: plůdek — vzácný nález v mokřadu
                if(Math.random() < 0.08) this.addItem('fry', 1);
                // Raci — vzácnější nález v mokřadu
                if(Math.random() < 0.15) this.addItem('crayfish', 1);
                // Orobinec — kořen z mokřadu
                if(Math.random() < 0.06) this.addItem('cattail_root', 1);
                // Proutí — vrbové pruty u mokřadu, běžný stavební materiál (Columbarium)
                if(Math.random() < 0.20) this.addItem('wicker', 2);
            }
            else if (type === 'resin_harvest') {
                if(r<0.5) this.addItem('resin', 1);
                else if(r<0.7) this.addItem('honey', 1);
                else this.addItem('bark', 1);
                if(Math.random() < 0.15) this.addItem('beeswax', 1);
                if(Math.random() < 0.03) this.addItem('viticis_baco', 1);
                // Kadidlo: smrková a borová pryskyřice
                if(Math.random() < 0.40) this.addItem('resin_spruce', 1);
                if(Math.random() < 0.25) this.addItem('resin_pine', 1);
            }
            else if (type === 'grass_gather') {
                this.addItem('grass', Math.random() < 0.5 ? 3 : 2);
                this.addItem('fiber', Math.random() < 0.5 ? 3 : 2);
                if(Math.random() < 0.30) this.addItem('linden_blossom', 1);
                if(Math.random() < 0.20) this.addItem('chamomile', 1);
                if(Math.random() < 0.10) this.addItem('thyme', 1);
                if(Math.random() < 0.08) this.addItem('yarrow', 1);
                if(Math.random() < 0.05) this.addItem('wormwood', 1);
                if(Math.random() < 0.04) this.addItem('sage', 1);
                if(Math.random() < 0.02) this.addItem('plantain', 1);
                // Titivillus-infirmary-mrd — kostival a rozmarýn
                if(Math.random() < 0.03) this.addItem('comfrey', 1);
                if(Math.random() < 0.02) this.addItem('rosemary', 1);
                // Divoke obili mezi travou
                if(Math.random() < 0.04) this.addItem('seeds_rye', 1);
                if(Math.random() < 0.03) this.addItem('seeds_wheat', 1);
                if(Math.random() < 0.03) this.addItem('seeds_barley', 1);
                if(Math.random() < 0.03) this.addItem('seeds_oats', 1);
                if(Math.random() < 0.02) this.addItem('seeds_millet', 1);
                if(Math.random() < 0.02) this.addItem('seeds_peas', 1);
                if(Math.random() < 0.015) this.addItem('seeds_flax', 1);
            }
            else if (type === 'wood_harvest') {
                this.addItem('log', Math.random() < 0.4 ? 2 : 1);
                if(Math.random() < 0.60) this.addItem('stick', 2);
                if(Math.random() < 0.20) this.addItem('bark', 1);
                if(Math.random() < 0.10) this.addItem('resin', 1);
                if(Math.random() < 0.05) this.addItem('charcoal', 1);
            }
            else if (type === 'worms_dig') {
                this.addItem('worms', Math.random() < 0.5 ? 3 : 2);
                if(Math.random() < 0.40) this.addItem('rock', 1);
                if(Math.random() < 0.20) this.addItem('clay', 1);
                if(Math.random() < 0.10) this.addItem('seeds_herb', 1);
            }
            else if (type === 'dig_clay') {
                this.addItem('clay', Math.random() < 0.5 ? 3 : 2);
                if(Math.random() < 0.30) this.addItem('rock', 1);
                if(Math.random() < 0.10) this.addItem('worms', 1);
            }
            else if (type === 'yard_cleanup') {
                this.addItem('scraps', Math.random() < 0.5 ? 2 : 1);
                if(Math.random() < 0.40) this.addItem('feather_hen', 1);
                if(Math.random() < 0.30) this.addItem('wool', 1);
                if(Math.random() < 0.20) this.addItem('egg', 1);
                if(Math.random() < 0.10) this.addItem('pollen', 1);
                if(Math.random() < 0.05) this.addItem('bone', 1);
                this.addItem('rags', 1);                             // staré hadry z hospodářství
                if(Math.random() < 0.35) this.addItem('rags', 1);   // bonus
                // 0.2% — viz vysvětlení u instant varianty výše
                if(Math.random() < 0.002) {
                    const lostPool = Object.entries(ItemsDB).filter(([id, i]) => i.lostItem).map(([id]) => id);
                    if(lostPool.length > 0) {
                        const found = lostPool[Math.floor(Math.random() * lostPool.length)];
                        this.addItem(found, 1);
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
                        this.addItem('titivillus_spis', 1);
                        setTimeout(function() { Game.showTitivillusSpisModal(); }, 300);
                    }
                }
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
            Game._scavenging = false;
            if (_usedToolId) Game.useToolCharge(_usedToolId);
            Game.save(); UI.renderAll(); return;
        } else {
            // TIMED scavenge — tabulka výnosů dle délky. Přepočítáno, aby delší
            // akce dávaly citelně lepší poměr výnos/minuta než rychlé klikání
            // (viz Game.scavenge anti-grind okno) — motivace nechat hru běžet
            // na pozadí místo opakovaného klikání. 15min je nová volba.
            let multiplier = durationMin === 1  ? 6
                           : durationMin === 5  ? 40
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
    checkEnvironment: function() {
        if (typeof FireplaceSystem !== 'undefined') FireplaceSystem.render();
        const container = document.getElementById('game-container');
        const fpCard = document.getElementById('card-fireplace');
        const fpCardOverlay = document.getElementById('card-fireplace-overlay');
        const navHome = document.getElementById('nav-home');
        const btnIgnite = document.getElementById('btn-ignite');
        const btnIgniteOverlay = document.getElementById('btn-ignite-overlay');
        if (GameState.flags.fireplaceLit) {
            fpCard.classList.add('fireplace-active'); navHome.classList.add('nav-fire-active');
            document.getElementById('fireplace-title').innerText = t('fireplace.lit');
            document.getElementById('fireplace-desc').innerText = t('fireplace.litDesc');
            btnIgnite.style.display = 'none';
            const fpVisualLit = document.getElementById('fireplace-visual');
            if (fpVisualLit) fpVisualLit.src = '/img/hearth_base_red.png';
            // Overlay: zhasnout, krb hoří — overlay nepotřebný
            if (fpCardOverlay) fpCardOverlay.style.display = 'none';
        } else {
            // Hint pro nové hráče: krb nebyl nikdy rozžéhnut
            const neverLit = !(GameState.achievements?.stats?.fireplaceCount);
            btnIgnite.classList.toggle('btn-ignite--hint', neverLit);
            const fpVisualDead = document.getElementById('fireplace-visual');
            if (fpVisualDead) fpVisualDead.src = '/img/hearth_base_dead.png';
            // Overlay: zrcadlí primární kartu, viditelný jen na Pracovna/main tabu
            if (fpCardOverlay) {
                document.getElementById('fireplace-title-overlay').innerText = document.getElementById('fireplace-title').innerText;
                document.getElementById('fireplace-desc-overlay').innerText = document.getElementById('fireplace-desc').innerText;
                document.getElementById('fireplace-visual-overlay').src = '/img/hearth_base_dead.png';
                if (btnIgniteOverlay) btnIgniteOverlay.classList.toggle('btn-ignite--hint', neverLit);
                const onHomeMain = (UI.currentScreen === 'home') &&
                    (!document.getElementById('home-tab-main') || document.getElementById('home-tab-main').classList.contains('active'));
                fpCardOverlay.style.display = onHomeMain ? 'flex' : 'none';
            }
        }
        const isDark = GameState.flags.forceDark || (!TimeSys.isDaytime() && !GameState.flags.fireplaceLit && !GameState.flags.candleLit && !GameState.flags.torchLit);
        if (isDark) container.classList.add('mode-frozen');
        else container.classList.remove('mode-frozen');
        
        const lightCard = document.getElementById('card-light-source');
        const navLore = document.getElementById('nav-lore');
        const loreOverlay = document.getElementById('lore-overlay');
        const loreWrap = document.getElementById('lore-content-wrapper');
        const btnCandle = document.getElementById('btn-light-candle');
        const btnTorch = document.getElementById('btn-light-torch');
        const lightDesc = document.getElementById('light-desc'); // Přidáno pro popisek
        
        lightCard.classList.remove('candle-active', 'torch-active');
        navLore.classList.remove('nav-candle-active', 'nav-torch-active');
        lightCard.style.opacity = GameState.flags.fireplaceLit ? "1" : "0.5";
        
        if (GameState.flags.candleLit) {
            document.getElementById('light-icon').innerText = "🕯️"; 
            document.getElementById('light-title').innerText = t('light.candle');
            if (lightDesc) lightDesc.innerText = t('light.candleDesc'); // Aktualizace popisku
            navLore.classList.add('nav-candle-active'); 
            btnCandle.style.display = 'none'; btnTorch.style.display = 'inline-block';
            loreOverlay.style.display = 'none'; loreWrap.classList.remove('lore-darkness');
        } else if (GameState.flags.torchLit) {
            document.getElementById('light-icon').innerText = "🔥"; 
            document.getElementById('light-title').innerText = t('light.torch');
            if (lightDesc) lightDesc.innerText = t('light.torchDesc'); // Aktualizace popisku
            navLore.classList.add('nav-torch-active'); 
            btnTorch.style.display = 'none'; btnCandle.style.display = 'inline-block';
            loreOverlay.style.display = 'none'; loreWrap.classList.remove('lore-darkness');
        } else {
            document.getElementById('light-icon').innerText = "🌑"; 
            document.getElementById('light-title').innerText = t('light.none');
            if (lightDesc) lightDesc.innerText = t('light.noneDesc'); // Aktualizace popisku
            const hasC = (GameState.inventory['candle'] || 0) > 0; 
            const hasT = (GameState.inventory['primitive_torch'] || 0) > 0;
            btnCandle.style.display = (GameState.flags.fireplaceLit && hasC) ? 'inline-block' : 'none';
            btnTorch.style.display = (GameState.flags.fireplaceLit && hasT) ? 'inline-block' : 'none';
            loreOverlay.style.display = 'block'; loreWrap.classList.add('lore-darkness');
        }
        btnCandle.disabled = !GameState.flags.fireplaceLit; btnTorch.disabled = !GameState.flags.fireplaceLit;
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
    addItem: function(id, qty) {
        const isFirstTime = !GameState.inventory[id] || GameState.inventory[id] === 0;
        
        if(!GameState.inventory[id]) GameState.inventory[id] = 0;
        GameState.inventory[id] += qty; 
        
        // Stats tracking
        if(GameState.achievements) {
            GameState.achievements.stats.itemsCrafted += qty;
            if(id === 'research') {
                GameState.achievements.stats.researchCount += qty;
            }
        }
        
        // Discovery mechanika
        if(isFirstTime && LoreDB[id] && !GameState.discoveredLore.includes(id)) {
            GameState.discoveredLore.push(id);
            if(GameState.achievements) GameState.achievements.stats.itemsDiscovered++;
            UI.notifyPanel(t('game.newCodexEntry'), 'system');
            Game.addKronikaEntry('important', '📜 Nový zápis v Codexu.', '📜 New entry in the Codex.', '📜 Nova inscriptio in Codice.');
            setTimeout(() => UI.notify(t('game.itemAdded').replace('{qty}', qty).replace('{item}', iName(id))), 500);
        } else {
            if (!Game._scavenging) UI.notify(t('game.itemAdded').replace('{qty}', qty).replace('{item}', iName(id)));
        }
        
        if (!Game._scavenging) {
            Game.save(); Game.checkEnvironment(); UI.renderAll();
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.render) PersonaSystem.render();
        }
        Game.checkAchievements();
    },
    removeItem: function(id, qty) {
        if(GameState.inventory[id] >= qty) {
            GameState.inventory[id] -= qty; if(GameState.inventory[id] <= 0) delete GameState.inventory[id];
            Game.save(); Game.checkEnvironment(); UI.renderAll(); return true;
        } return false;
    },
    craft: function(id) {
        const r = RecipesDB.find(x => x.id === id);
        if(!GameState.flags.fireplaceLit && !r.blind) { UI.notify(t('game.frozenHands'), true); return; }

        // Save hint tracking
        Game._saveHint.actions++;
        Game._checkSaveHint();
        if (typeof EventsSystem !== 'undefined') EventsSystem.onAction();

        // Vigor check — těžké recepty vyžadují Vigor >= 25, lehké >= 10
        if (typeof VigorSystem !== 'undefined') {
            if (!VigorSystem.canAct()) { UI.notify(t('game.vigor.exhausted'), true); return; }
            const heavyItems = ['vellum','codex_luxury','illuminated_page','vellum_codex','printing_type','ink_gallic'];
            const isHeavy = heavyItems.includes(r.output);
            const isLight = ['paper','ink','candle','tinderbox','quill','tallow_candle'].includes(r.output);
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

        for(let [item, amt] of Object.entries(r.req)) {
            if(amt > 0 && (!GameState.inventory[item] || GameState.inventory[item] < amt)) { UI.notify(t('game.missingMats'), true); return; }
            if(amt === 0 && !GameState.inventory[item]) { UI.notify(`${t('game.required2')} ${iName(item)}`, true); return; }
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

        for(let [item, amt] of Object.entries(r.req)) if(amt > 0) this.removeItem(item, amt);
        if (_foundTool) this.useToolCharge(_foundTool.item);

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

        // ── RESEARCH: diminishing returns ────────────────────────────────────
        if (r.output === 'research') {
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
        this.addItem(r.output, craftQty);
        if (typeof UI !== 'undefined' && UI.spawnFloatingGain) UI.spawnFloatingGain(r.id, craftQty);

        // Vigor — přidat Fatigue dle výstupu
        if (typeof VigorSystem !== 'undefined') VigorSystem.onCraft(r.output);
        // Byproduct — vedlejší produkt receptu (např. stloukání másla → podmáslí)
        if (r.byproduct && r.byproduct.id) {
            this.addItem(r.byproduct.id, r.byproduct.qty || 1);
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
                this.removeItem(r.output, r.qty); // ukradne výstup
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
    study: function(id) {
        const tech = TechTree.find(x => x.id === id);
        if (typeof VigorSystem !== 'undefined' && !VigorSystem.canResearch()) { UI.notify(t('game.vigor.researchBlock'), true); return; }
        if((GameState.inventory['research'] || 0) < tech.cost) { UI.notify(t('game.notEnoughResearch'), true); return; }

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
        if(tech.requires) {
            const missing = tech.requires.find(req => !GameState.researchedTechs.includes(req));
            if(missing) {
                const reqTech = TechTree.find(x => x.id === missing);
                UI.notify(`${t('game.techRequired')} ${reqTech.name}`, true); 
                return;
            }
        }
        
        this.removeItem('research', tech.cost); GameState.researchedTechs.push(id);
        Game.addKronikaEntry('important',
            `Poznáno: ${tech.name}`,
            `Discovered: ${tech.name_en || tech.name}`,
            `Cognitum: ${tech.name}`
        );
        tech.unlocks.forEach(rid => {
            if(!GameState.unlockedRecipes.includes(rid)) {
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
        if(id === 'tech_garden_expand') {
            // Odemkne herb sloty 2-3
            if(GameState.garden[2]) GameState.garden[2].locked = false;
            if(GameState.garden[3]) GameState.garden[3].locked = false;
        }
        if(id === 'tech_horticulture') {
            // Odemkne 4x vegetable + 2x special (sloty 4-9)
            for(let i = 4; i <= 9; i++) { if(GameState.garden[i]) GameState.garden[i].locked = false; }
        }
        if(id === 'tech_advanced_farming') {
            // Odemkne 4x vegetable navíc (sloty 10-13)
            for(let i = 10; i <= 13; i++) { if(GameState.garden[i]) GameState.garden[i].locked = false; }
        }
        if(id === 'tech_porta') {
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
        UI.notifyPanel(`📜 ${t('game.crafted')} ${_slang==='en'?(tech.name_en||tech.name):tech.name}`, 'system');

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
    eat: function(foodId) {
        const item = ItemsDB[foodId];
        const _potionCures = ['antidote', 'potion_heal', 'sleep_potion', 'stamina_tonic', 'unguentum_calidum', 'cannabis_poultice', 'odvar_z_dubenek', 'mast_ze_lneneho_oleje', 'odvar_z_vrby', 'elixir_purgationis'];
        const _isPotionCure = _potionCures.includes(foodId);
        // Syrové ovoce/zelenina (food_raw), co lze sníst přímo — viz VigorSystem.RAW_EDIBLE_FOOD
        const _isRawEdible = (typeof VigorSystem !== 'undefined' && VigorSystem.RAW_EDIBLE_FOOD && VigorSystem.RAW_EDIBLE_FOOD.includes(foodId));
        if(!item || (item.type !== 'food' && !_isPotionCure && !_isRawEdible)) { UI.notify(t('game.notFood'), true); return; }
        if(!(GameState.inventory[foodId] > 0)) { UI.notify(t('game.noFood'), true); return; }

        this.removeItem(foodId, 1);

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
        if(GameState.achievements && GameState.achievements.stats) {
            GameState.achievements.stats.mealsEaten = (GameState.achievements.stats.mealsEaten || 0) + 1;
        }

        Game.save();
        UI.renderAll();
    },

    // Pití vody (water = mat type, proto vlastní funkce)
    drink: function(itemId) {
        const drinkable = ['water', 'spring_water', 'holy_water'];
        if (!drinkable.includes(itemId)) { UI.notify(t('game.notFood'), true); return; }
        if (!(GameState.inventory[itemId] > 0)) { UI.notify(t('game.noFood'), true); return; }
        this.removeItem(itemId, 1);
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

    checkDailyReward: function() {
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
        if(GameState.achievements) {
            if(GameState.flags.fireplaceLit) {
                GameState.achievements.stats.daysWithFire++;
            }
            // Vigor v2: "fed" = Vigor >= 25
            if(typeof VigorSystem !== 'undefined' && VigorSystem.getVigor() >= 25) {
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
            rewards.push({item:'research', qty:10}, {item:'vellum', qty:1});
            bonusText = lang==='en' ? '+10 Research + Vellum (100 days!) — "The Chronicler writes your name. Not as a visitor — as a brother."'
                                    : '+10 Zápisků + Pergamen (100 dní!) — "Kronikář zapíše tvé jméno. Ne jako hosta — jako bratra."';
            streakBonus = true;
        } else if (streak === 60) {
            const pool = ['lapis_lazuli','cinnabar'];
            const rare = pool[Math.floor(Math.random() * pool.length)];
            rewards.push({item:'research', qty:5}, {item:rare, qty:1});
            bonusText = lang==='en' ? '+5 Research + rare find (60 days!) — "The Elder Scribe comes with a small pouch."'
                                    : '+5 Zápisků + vzácná surovina (60 dní!) — "Starý Písař přichází s váčkem."';
            streakBonus = true;
        } else if (streak === 30) {
            rewards.push({item:'research', qty:5}, {item:'candle', qty:1});
            bonusText = lang==='en' ? '+5 Research + Candle (30 days!) — "The Abbot has taken notice."'
                                    : '+5 Zápisků + Svíčka (30 dní!) — "Měsíc věrnosti. Opat si tě všiml."';
            streakBonus = true;
        } else if (streak === 14) {
            rewards.push({item:'research', qty:2}, {item:'paper', qty:1}, {item:'candle', qty:1});
            bonusText = lang==='en' ? '+2 Research + Paper + Candle (14 days!) — "The manuscript takes shape."'
                                    : '+2 Zápisky + Papír + Svíčka (14 dní!) — "Rukopis se začíná rýsovat."';
            streakBonus = true;
        } else {
            // Cyklus dní 1–7 (opakuje se mezi milníky)
            const cycleDay = ((streak - 1) % 7) + 1;
            if (cycleDay === 1) {
                bonusText = lang==='en' ? '"First day in the cycle. Be silent and observe."'
                                        : '"Mlč a pozoruj. Dnes pero odpočívá."';
            } else if (cycleDay === 2) {
                rewards.push({item:'paper', qty:1});
                bonusText = lang==='en' ? '+1 Paper — "You found a sheet behind the altar."'
                                        : '+1 Papír — "Nalezl jsi arch za oltářem."';
            } else if (cycleDay === 3) {
                if (Math.random() < 0.5) { rewards.push({item:'paper', qty:1}); bonusText = lang==='en'?'+1 Paper':'+1 Papír'; }
                else { rewards.push({item:'ink', qty:1}); bonusText = lang==='en'?'+1 Ink':'+1 Inkoust'; }
                bonusText += lang==='en' ? ' — "The Elder Scribe left something on the lectern."'
                                         : ' — "Starý Písař něco nechal na pulpitu."';
            } else if (cycleDay === 4) {
                rewards.push({item:'research', qty:1});
                bonusText = lang==='en' ? '+1 Research — "A quiet hour for study."'
                                        : '+1 Zápisek — "Tichá hodina ke studiu."';
            } else if (cycleDay === 5) {
                rewards.push({item:'paper', qty:1});
                bonusText = lang==='en' ? '+1 Paper — "The papermaker was generous."'
                                        : '+1 Papír — "Papírník byl štědrý."';
            } else if (cycleDay === 6) {
                const r = Math.random();
                if (r < 0.34) { rewards.push({item:'paper', qty:1}); bonusText = lang==='en'?'+1 Paper':'+1 Papír'; }
                else if (r < 0.67) { rewards.push({item:'ink', qty:1}); bonusText = lang==='en'?'+1 Ink':'+1 Inkoust'; }
                else { rewards.push({item:'research', qty:1}); bonusText = lang==='en'?'+1 Research':'+1 Zápisek'; }
                bonusText += lang==='en' ? ' — "A good day at the desk."'
                                         : ' — "Dobrý den u pultu."';
            } else { // cycleDay === 7
                rewards.push({item:'research', qty:1}, {item:'paper', qty:1});
                bonusText = lang==='en' ? '+1 Research +1 Paper — "A week of faithful work."'
                                        : '+1 Zápisek +1 Papír — "Týden věrné práce."';
            }
        }

        // Canonical hours buff — jen na research složku
        let canonMult = 1;
        if (typeof CanonicalHours !== 'undefined') canonMult = CanonicalHours.getResearchMultiplier();
        rewards.forEach(r => {
            let qty = r.qty;
            if (r.item === 'research' && canonMult !== 1) qty = Math.floor(qty * canonMult);
            if (qty > 0) this.addItem(r.item, qty);
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
            NotificationSystem.panel('🎁 ' + (_dlang==='en' ? 'Daily reward: ' : 'Denní odměna: ') + bonusText + ' · streak: ' + GameState.dailyRewards.streak, 'system');
        }
        UI.updateStreak();
        Analytics.dailyRewardClaimed(GameState.dailyRewards.streak);
        Analytics.sessionStart(GameState.dailyRewards.totalLogins, daysSinceLastLogin);
        
        Game.save();
        Game.checkAchievements();
        Game.checkAnimalFeeding();
    },
    checkAchievements: function() {
        if(!GameState.achievements) return;
        
        let newUnlocks = [];
        
        AchievementsDB.forEach(ach => {
            // Skip if already unlocked
            if(GameState.achievements.unlocked.includes(ach.id)) return;
            
            // Check condition
            if(ach.condition()) {
                GameState.achievements.unlocked.push(ach.id);
                newUnlocks.push(ach);
                
                // Grant reward
                if(ach.reward.research) {
                    this.addItem('research', ach.reward.research);
                }
            }
        });
        
        // Show notifications — přeskočit při prvním spuštění (jazyk ještě není zvolen)
        if(newUnlocks.length > 0 && !GameState.flags.firstVisit) {
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
        if(typeof LibraryHelpers !== 'undefined') {
            LibraryHelpers.checkEasterEggs();
        }
    },
	
	// === WELL SYSTEM === (PŘIDAT před poslední } objektu Game)

	// ─── KRMNÝ SYSTÉM ──────────────────────────────────────────────────────────
	checkAnimalFeeding: function() {
		const lang = (GameState.settings && GameState.settings.language) || 'cs';
		const now = Date.now();
		if (!GameState.feeding) GameState.feeding = {};
		// Krmení aktivuje až Horreum (sýpka skladuje krmivo) — do té doby se zvířata pasou sama
		if (!(GameState.storage && GameState.storage.horreum && GameState.storage.horreum.built)) return;
		const animals = [
			{ key: 'henhouse',  built: GameState.henhouse && GameState.henhouse.built && GameState.henhouse.hens && GameState.henhouse.hens.length > 0, feedChain: ['grain', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Hens':'Slepice', v2: true },
			{ key: 'sheepfold', built: GameState.sheepfold && GameState.sheepfold.built && GameState.sheepfold.sheep && GameState.sheepfold.sheep.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Sheep':'Ovce', v2: true },
			{ key: 'piscina',   built: GameState.piscina && GameState.piscina.tier > 0, feedChain: ['worms'], feedAmt: 1, name: lang==='en'?'Fish':'Ryby', v2: false },
			{ key: 'rabbitry',  built: GameState.rabbitry && GameState.rabbitry.built && GameState.rabbitry.animals && GameState.rabbitry.animals.length > 0, feedChain: ['scraps', 'hay'], feedAmt: 1, name: lang==='en'?'Rabbits':'Králíci', v2: true },
			{ key: 'goatpen',   built: GameState.goatpen && GameState.goatpen.built && GameState.goatpen.animals && GameState.goatpen.animals.length > 0, feedChain: ['hay', 'scraps', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Goats':'Kozy', v2: true },
			{ key: 'cowbyre',   built: GameState.cowbyre && GameState.cowbyre.built && GameState.cowbyre.animals && GameState.cowbyre.animals.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Cattle':'Skot', v2: true },
			{ key: 'pigsty',    built: GameState.pigsty && GameState.pigsty.built && GameState.pigsty.animals && GameState.pigsty.animals.length > 0, feedChain: ['scraps', 'feed_meal', 'grain', 'hay'], feedAmt: 2, name: lang==='en'?'Pigs':'Prasata', v2: true },
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
					UI.notify(lang==='en' ? a.name+' fed automatically.' : a.name+' nakrmeny automaticky.');
					if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
						NotificationSystem.panel('🌾 ' + (lang==='en' ? a.name+' fed automatically ('+useFeed+').' : a.name+' automaticky nakrmeny ('+useFeed+').'), 'system');
					}
					Game.addKronikaEntry('minor',
						'🌾 ' + a.name + ' automaticky nakrmeny (' + useFeed + ').',
						'🌾 ' + a.name + ' fed automatically (' + useFeed + ').',
						'🌾 Animalia pasta sunt.');
				} else {
					UI.notify((lang==='en' ? a.name+' hungry! No '+a.feedChain[0]+' in Horreum.' : a.name+' hladoví! Chybí '+a.feedChain[0]+' v sýpce.'), true);
					if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
						NotificationSystem.panel('⚠️ ' + (lang==='en' ? a.name+' hungry — no '+a.feedChain[0]+'.' : a.name+' hladoví — chybí '+a.feedChain[0]+'.'), 'warning');
					}
					Game.addKronikaEntry('warning', a.name+' hladovi — chybi '+a.feedChain[0]+'.', a.name+' hungry — no '+a.feedChain[0]+'.', a.name+' esuriunt.');
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
					UI.notify(lang==='en' ? a.name+' fed automatically.' : a.name+' nakrmeny automaticky.');
					if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
						NotificationSystem.panel('🌾 ' + (lang==='en' ? a.name+' fed automatically ('+useFeed+').' : a.name+' automaticky nakrmeny ('+useFeed+').'), 'system');
					}
					Game.addKronikaEntry('minor',
						'🌾 ' + a.name + ' automaticky nakrmeny (' + useFeed + ').',
						'🌾 ' + a.name + ' fed automatically (' + useFeed + ').',
						'🌾 Animalia pasta sunt.');
				} else {
					GameState.feeding[a.key].hunger = Math.min(3, (GameState.feeding[a.key].hunger || 0) + 1);
					const penalty = GameState.feeding[a.key].hunger >= 3 ? 75 : GameState.feeding[a.key].hunger >= 2 ? 50 : 25;
					UI.notify((lang==='en' ? a.name+' hungry! Production -' : a.name+' hladovi! Produkce -')+penalty+'%', true);
					if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
						NotificationSystem.panel('⚠️ ' + (lang==='en' ? a.name+' hungry — no '+a.feedChain[0]+'. Production -'+penalty+'%.' : a.name+' hladoví — chybí '+a.feedChain[0]+'. Produkce -'+penalty+'%.'), 'warning');
					}
					Game.addKronikaEntry('warning', a.name+' hladovi — chybi '+a.feedChain[0]+'.', a.name+' hungry — no '+a.feedChain[0]+'.', a.name+' esuriunt.');
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
				this.removeItem(itemId, 1);
				delete GameState.toolUses[itemId];
				UI.notify((lang==='en' ? '💀 ' + name + ' destroyed beyond repair.' : '💀 ' + name + ' — nenávratně zničena.'), true);
				if (typeof NotificationSystem !== 'undefined') {
					NotificationSystem.panel((lang==='en' ? '💀 ' + name + ' destroyed. Craft new tools.' : '💀 ' + name + ' zničena. Vykov nové nástroje.'), 'warning');
				}
			} else if (item.tier === 'iron' && ItemsDB[wornId]) {
				// Iron → degradace na worn
				this.removeItem(itemId, 1);
				this.addItem(wornId, 1);
				delete GameState.toolUses[itemId];
				UI.notify((lang==='en' ? name + ' worn out — repair it.' : name + ' se opotřebovala — oprav ji.'), true);
				if (typeof NotificationSystem !== 'undefined') {
					NotificationSystem.panel((lang==='en' ? '🔧 ' + name + ' worn out. Needs repair.' : '🔧 ' + name + ' opotřebována. Potřebuje opravu.'), 'system');
				}
			} else {
				// Stone → smazat
				this.removeItem(itemId, 1);
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
		if (!GameState.storage) GameState.storage = { almarium: {built:false}, cella: {built:false}, horreum: {built:false}, fabrica: {built:false}, sulci: {built:false}, humno: {built:false} };
		if (!GameState.storage.fabrica)           GameState.storage.fabrica           = {built:false};
		if (!GameState.storage.sulci)             GameState.storage.sulci             = {built:false};
		if (!GameState.storage.humno)             GameState.storage.humno             = {built:false};
		if (!GameState.storage.vinea)             GameState.storage.vinea             = {built:false};
		if (!GameState.storage.prelum)            GameState.storage.prelum            = {built:false};
		if (!GameState.storage.cella_fermentaria) GameState.storage.cella_fermentaria = {built:false};
		if (!GameState.storage.foudres)           GameState.storage.foudres           = {built:false};
		if (!GameState.storage.cellarium_vini)    GameState.storage.cellarium_vini    = {built:false};
		if (!GameState.storage.uvarium)           GameState.storage.uvarium           = {built:false};
		if (!GameState.storage.prelum_olei)       GameState.storage.prelum_olei       = {built:false};
		if (!GameState.storage.fodina)             GameState.storage.fodina             = {built:false};
		if (!GameState.storage.fornax_ferraria)    GameState.storage.fornax_ferraria    = {built:false};
		if (!GameState.storage.vapenice)           GameState.storage.vapenice           = {built:false};
		if (!GameState.storage.old_cellars)        GameState.storage.old_cellars        = {built:false};
		if (!GameState.storage.domus_conversorum_i) GameState.storage.domus_conversorum_i = {built:false};
		if (!GameState.storage.domus_conversorum_ii) GameState.storage.domus_conversorum_ii = {built:false};
		if (!GameState.storage.dormitorium_i)   GameState.storage.dormitorium_i   = {built:false};
		if (!GameState.storage.dormitorium_ii)  GameState.storage.dormitorium_ii  = {built:false};
		if (!GameState.storage.dormitorium_iii) GameState.storage.dormitorium_iii = {built:false};
		if (!GameState.storage.transactions) GameState.storage.transactions = [];
		// Prereq checks — storage buildings
		if (type === 'cella' && !GameState.storage.almarium.built) {
			UI.notify(lang==='en' ? 'Build Almarium first.' : 'Nejprve postav Almarium.', true); return;
		}
		if (type === 'horreum' && !GameState.storage.cella.built) {
			UI.notify(lang==='en' ? 'Build Cella first.' : 'Nejprve postav Cellu.', true); return;
		}
		// Prereq checks — Vinohrad buildings
		if (type === 'vinea' && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_vinohrad'))) {
			UI.notify(lang==='en' ? 'Research Vinea first.' : 'Nejprve prozkoumej tech Vinea.', true); return;
		}
		if (type === 'prelum' && !GameState.storage.vinea.built) {
			UI.notify(lang==='en' ? 'Build Vinea first.' : 'Nejprve postav Vinohrad (Vinea).', true); return;
		}
		if (type === 'cella_fermentaria' && !GameState.storage.prelum.built) {
			UI.notify(lang==='en' ? 'Build Prelum first.' : 'Nejprve postav Prelum (Lis).', true); return;
		}
		if (type === 'foudres' && !GameState.storage.cella_fermentaria.built) {
			UI.notify(lang==='en' ? 'Build Cella fermentaria first.' : 'Nejprve postav Cella fermentaria.', true); return;
		}
		if (type === 'cellarium_vini' && !GameState.storage.foudres.built) {
			UI.notify(lang==='en' ? 'Build Foudres first.' : 'Nejprve postav Foudres.', true); return;
		}
		if (type === 'uvarium' && !GameState.storage.foudres.built) {
			UI.notify(lang==='en' ? 'Build Foudres first.' : 'Nejprve postav Foudres.', true); return;
		}
		if (type === 'prelum_olei' && !(GameState.storage.sulci && GameState.storage.sulci.built)) {
			UI.notify(lang==='en' ? 'Build Sulci first.' : 'Nejprve postav Brázdy (Sulci).', true); return;
		}
		if (type === 'fornax_ferraria') {
			if (!(GameState.abbotPetition && GameState.abbotPetition.fornax && GameState.abbotPetition.fornax.status === 'approved')) {
				UI.notify(lang==='en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
			}
		}
		if (type === 'old_cellars') {
			const unlocked = (GameState.researchedTechs && GameState.researchedTechs.includes('tech_conventual_spaces')) || GameState.oldCellarsFound;
			if (!unlocked) {
				UI.notify(lang==='en' ? 'The old vaults have not yet been found.' : 'Staré klenby ještě nebyly objeveny.', true); return;
			}
		}
		if (type === 'dormitorium_ii' && !(GameState.storage.dormitorium_i && GameState.storage.dormitorium_i.built)) {
			UI.notify(lang==='en' ? 'Build Dormitorium I first.' : 'Nejprve postav Dormitorium I.', true); return;
		}
		if (type === 'dormitorium_iii' && !(GameState.storage.dormitorium_ii && GameState.storage.dormitorium_ii.built)) {
			UI.notify(lang==='en' ? 'Build Dormitorium II first.' : 'Nejprve postav Dormitorium II.', true); return;
		}
		if (type === 'domus_conversorum_i' && !(GameState.storage.old_cellars && GameState.storage.old_cellars.built)) {
			UI.notify(lang==='en' ? 'Clear the Old Cellars first.' : 'Nejprve vyklidit Staré sklepy.', true); return;
		}
		if (type === 'domus_conversorum_ii') {
			if (!(GameState.abbotPetition && GameState.abbotPetition.domus_ii && GameState.abbotPetition.domus_ii.status === 'approved')) {
				UI.notify(lang==='en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
			}
		}
		if (type === 'vapenice' && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_calcaria'))) {
			UI.notify(lang==='en' ? 'Research Calcaria first.' : 'Nejprve prozkoumej tech Calcaria.', true); return;
		}
		if (GameState.storage[type] && GameState.storage[type].built) {
			UI.notify(lang==='en' ? 'Already built.' : 'Jiz postaveno.', true); return;
		}
		const costs = {
			almarium:          { plank: 6,  rope: 3,  leather: 2 },
			cella:             { cut_stone: 12, rope: 5, chalk: 4 },
			horreum:           { cut_stone: 20, plank: 10, glue: 4, rope: 6 },
			fabrica:           { rock: 30,  plank: 15, charcoal: 10, anvil: 1 },
			sulci:             { plank: 8,  rope: 4,  stick: 10 },
			humno:             { cut_stone: 8, plank: 6, rope: 3 },
			vinea:             { plank: 12, rope: 6,  rock: 6 },
			prelum:            { plank: 8,  rope: 4,  rock: 6,  iron_ingot: 2 },
			cella_fermentaria: { plank: 10, rock: 8,  rope: 3,  clay: 4 },
			foudres:           { plank: 15, rope: 6,  iron_ingot: 3 },
			cellarium_vini:    { cut_stone: 10, plank: 6, rope: 4 },
			uvarium:           { plank: 8,  rock: 4,  rope: 3 },
			prelum_olei:       { plank: 10, rope: 4,  rock: 4,  iron_ingot: 1 },
			fornax_ferraria:   { rock: 40, cut_stone: 15, clay: 20, plank: 20, charcoal: 15 },
			vapenice:          { plank: 15, cut_stone: 20, clay: 20 },
			old_cellars:       { cut_stone: 15, plank: 10, rope: 5 },
			domus_conversorum_i: { cut_stone: 40, plank: 25, rope: 10 },
			domus_conversorum_ii: { cut_stone: 150, plank: 90, rope: 35 },
			dormitorium_i:   { cut_stone: 30, plank: 20, rope: 8 },
			dormitorium_ii:  { cut_stone: 90,  plank: 60, rope: 25, iron_ingot: 2, glass_stopper: 6 },
			dormitorium_iii: { cut_stone: 200, plank: 130, rope: 50, iron_ingot: 6, glass_stopper: 10, glass_tankard: 10 },
		};
		// Volitelný groše náklad navíc k materiálu — dnes jen Domus Conversorum I/II.
		// Cokoliv chybí v costsGrose má groseNeeded=0, tedy nulový dopad na stávající budovy.
		const costsGrose = {
			domus_conversorum_i: 25,
			domus_conversorum_ii: 50,
			dormitorium_i: 15,
			dormitorium_ii: 35,
			dormitorium_iii: 70,
		};
		const cost = costs[type];
		if (!cost) return;
		const groseNeeded = costsGrose[type] || 0;
		if (groseNeeded > 0 && (typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < groseNeeded) {
			UI.notify((lang==='en'?'Not enough groats: ':'Nedostatek grošů: ')+groseNeeded, true); return;
		}
		for (const [item, amt] of Object.entries(cost)) {
			if ((GameState.inventory[item] || 0) < amt) {
				const itemName = (typeof iName === 'function') ? iName(item) : item;
				UI.notify((lang==='en'?'Not enough: ':'Nedostatek: ')+itemName+' x'+amt, true); return;
			}
		}
		for (const [item, amt] of Object.entries(cost)) { this.removeItem(item, amt); }
		if (groseNeeded > 0 && typeof CellariumSystem !== 'undefined') CellariumSystem.addGrose(-groseNeeded);
		GameState.storage[type].built = true;
		Game.save();
		const names = {
			almarium: 'Almarium', cella: 'Cella', horreum: 'Horreum',
			fabrica: 'Fabrica', sulci: 'Sulci', humno: 'Humno',
			vinea: 'Vinea', prelum: 'Prelum', cella_fermentaria: 'Cella fermentaria',
			foudres: 'Foudres', cellarium_vini: 'Cellarium Vini',
			uvarium: 'Uvarium', prelum_olei: 'Prelum Olei',
			fornax_ferraria: 'Fornax Ferraria',
			vapenice: 'Vápenice',
			old_cellars: 'Staré sklepy',
			domus_conversorum_i: 'Domus Conversorum I',
			domus_conversorum_ii: 'Domus Conversorum II',
			dormitorium_i: 'Dormitorium I',
			dormitorium_ii: 'Dormitorium II',
			dormitorium_iii: 'Dormitorium III',
		};
		const n = names[type] || type;
		UI.notifyPanel('🏗️ ' + (lang==='en' ? n+' built.' : n+' postaveno.'), 'system');
		Game.addKronikaEntry('important', n+' postaveno.', n+' built.', n+' aedificatum est.');
		// Discovery: tech_prelum_olei při stavbě Sulci
		if (type === 'sulci' && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_prelum_olei'))) {
			const techObj = typeof TechTree !== 'undefined' ? TechTree.find(x => x.id === 'tech_prelum_olei') : null;
			if (techObj) {
				// Jen odemknout jako dostupný k výzkumu — ne přidat rovnou
				NotificationSystem.panel('📜 ' + (lang==='en'
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

	checkCalendarium: function() {
		// Spustit jen 1× za den
		if (!GameState.flags) GameState.flags = {};
		const today = new Date().toISOString().slice(0,10);
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
				{ day: 1,  key: 'month' },
				{ day: 17, key: 'twoWeeks' },
				{ day: 24, key: 'week' },
				{ day: 31, key: 'expire' },
			];
			const warn = warnings.find(w => w.day === day);
			if (warn && !GameState.flags[`calWarn_${warn.key}_${now.getFullYear()}`]) {
				GameState.flags[`calWarn_${warn.key}_${now.getFullYear()}`] = true;
				const msgs = {
					cs: { month:'📅 Calendarium vyprší za měsíc. Připrav zásoby!', twoWeeks:'📅 Calendarium vyprší za 14 dní.', week:'📅 Calendarium vyprší za týden!', expire:'📅 Calendarium dnes vyprší. Vyroб nový v lednu!' },
					en: { month:'📅 Calendarium expires in one month. Prepare supplies!', twoWeeks:'📅 Calendarium expires in 14 days.', week:'📅 Calendarium expires in one week!', expire:'📅 Calendarium expires today. Craft a new one in January!' },
				};
				UI.notifyPanel((msgs[lang] || msgs.cs)[warn.key], 'warning');
				Game.save();
			}
		}
	},

	// === BACKUP SYSTEM === (přidat před konec Game objektu)

	exportSave: function() {
		try {
			const saveData = JSON.stringify(GameState, null, 2); // Pretty print
			const blob = new Blob([saveData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			
			// Generate filename with timestamp
			const now = new Date();
			const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
			const filename = `scriptorium_save_${timestamp}.json`;
			
			// Create download link
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			UI.notify(t('game.saveExportedFile').replace('{file}', filename));
		} catch(e) {
			UI.notify(t('game.saveExportFail'), true);
			console.error('Export error:', e);
		}
	},

	importSave: function(file) {
		if (!file) {
			UI.notify(t('game.saveNoFile'), true);
			return;
		}
		
		const reader = new FileReader();
		
		reader.onload = function(e) {
			try {
				const importedData = JSON.parse(e.target.result);
				
				// Validation - check if it looks like valid save
				if (!importedData.inventory || !importedData.flags) {
					UI.notify(t('game.saveImportFail'), true);
					return;
				}
				
				// Confirm before overwriting
				if (!confirm(t('game.overwriteSave'))) {
					UI.notify(t('game.saveImportCancelled'));
					return;
				}
				
				// Import data
				Object.assign(GameState, importedData);
				
				// Save to localStorage
				Game.save();
				
				UI.notify(t('game.successImport'));
				
				// Auto-refresh after 2 seconds
				setTimeout(() => location.reload(), 2000);
				
			} catch(e) {
				UI.notify(t('game.errorImport'), true);
				console.error('Import error:', e);
			}
		};
		
		reader.onerror = function() {
			UI.notify(t('game.errorRead'), true);
		};
		
		reader.readAsText(file);
	},

	triggerImport: function() {
		// Create hidden file input
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		
		input.onchange = function(e) {
			const file = e.target.files[0];
			if (file) {
				Game.importSave(file);
			}
		};
		
		input.click();
	},

    // ─── KRONIKA ─────────────────────────────────────────────────────
    kronikaCraftFlushBuffer: function() {
        if (!GameState.kronikaCraftBuffer) return;
        const buf = GameState.kronikaCraftBuffer;
        if (!buf.date || Object.keys(buf.crafts).length === 0) return;
        const craftList = Object.entries(buf.crafts).map(([id, qty]) => {
            const item = (typeof ItemsDB !== 'undefined' && ItemsDB[id]) ? ItemsDB[id] : null;
            const name = item ? item.name : id;
            const nameEn = item ? (item.name_en || item.name) : id;
            return { cs: `${qty}× ${name}`, en: `${qty}× ${nameEn}` };
        });
        if (craftList.length === 0) return;
        const cs = 'Vyrobeno: ' + craftList.map(g => g.cs).join(', ');
        const en = 'Crafted: ' + craftList.map(g => g.en).join(', ');
        const la = 'Facta: ' + craftList.map(g => g.cs).join(', ');
        Game.addKronikaEntry('normal', cs, en, la);
        GameState.kronikaCraftBuffer = { date: buf.date, crafts: {} };
    },

    kronikaFlushBuffer: function() {
        if (!GameState.kronikaDailyBuffer) GameState.kronikaDailyBuffer = { date: '', gains: {} };
        const buf = GameState.kronikaDailyBuffer;
        if (!buf.date || Object.keys(buf.gains).length === 0) return;
        // Sestavit text ze získaných položek
        const gainList = Object.entries(buf.gains)
            .map(([id, qty]) => {
                const item = (typeof ItemsDB !== 'undefined' && ItemsDB[id]) ? ItemsDB[id] : null;
                const name = item ? item.name : id;
                const nameEn = item ? (item.name_en || item.name) : id;
                return { cs: `${qty}× ${name}`, en: `${qty}× ${nameEn}` };
            });
        if (gainList.length === 0) return;
        const cs = 'Sesbíráno: ' + gainList.map(g => g.cs).join(', ');
        const en = 'Gathered: ' + gainList.map(g => g.en).join(', ');
        const la = 'Collectum: ' + gainList.map(g => g.cs).join(', ');
        Game.addKronikaEntry('normal', cs, en, la);
        // Reset buffer
        GameState.kronikaDailyBuffer = { date: buf.date, gains: {} };
    },

    // ── ABBOT PETITION SYSTEM ────────────────────────────────────────────────

    // Vrací null pokud všechny podmínky splněny, jinak klíč zamítnutí (denied_*)
    _checkDomusIIConditions: function() {
        if (!(GameState.storage && GameState.storage.domus_conversorum_i && GameState.storage.domus_conversorum_i.built)) {
            return 'denied_phase2';
        }
        const influence = (GameState.persona && GameState.persona.influence && GameState.persona.influence.abbot) || 0;
        if (influence < 40) return 'denied_influence';

        let foodTotal = 0;
        for (const [id, qty] of Object.entries(GameState.inventory || {})) {
            const item = (typeof ItemsDB !== 'undefined') ? ItemsDB[id] : null;
            if (item && item.type === 'food' && typeof qty === 'number') foodTotal += qty;
        }
        if (foodTotal < 50) return 'denied_food';

        const grose = (typeof CellariumSystem !== 'undefined') ? CellariumSystem.getGrose() : 0;
        const txs = (GameState.treasury && GameState.treasury.transactions) || [];
        const ledgerBalance = txs.filter(t => t.type === 'sell').reduce((s, t) => s + t.total, 0)
                             - txs.filter(t => t.type === 'buy').reduce((s, t) => s + t.total, 0);
        if (grose < 100 && ledgerBalance <= 0) return 'denied_economy';

        const drinkIds = ['vinum', 'vinum_rubrum', 'vinum_obscurum', 'vinum_baci', 'vinum_praeclarum', 'prima_cervisia', 'cervisia_nigra', 'honey'];
        const hasDrink = drinkIds.some(id => (GameState.inventory[id] || 0) > 0);
        if (!hasDrink) return 'denied_drink';

        if (!(GameState.rank && GameState.rank.monastic === 'prior')) return 'denied_rank';

        return null;
    },

    submitAbbotPetition: function(type) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'cs';
        if (!GameState.abbotPetition) GameState.abbotPetition = {};
        if (!GameState.abbotPetition[type]) {
            GameState.abbotPetition[type] = { status: 'none', submittedAt: null, deniedReason: null, inspectionPending: false };
        }
        const pet = GameState.abbotPetition[type];

        // Již odesláno nebo schváleno
        if (pet.status === 'pending') {
            UI.notify(cs ? '⏳ Žádost již byla odeslána. Čekej na odpověď opata.' : '⏳ Petition already submitted. Await the Abbot\'s reply.', true);
            return;
        }
        if (pet.status === 'approved') {
            UI.notify(cs ? '✅ Opat již schválil tuto žádost.' : '✅ The Abbot has already approved this petition.', true);
            return;
        }

        // Validace podmínek — pro fodinu
        if (type === 'fodina') {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fodina'))) {
                UI.notify(t('abbotPetition.fodina.denied_tech'), true); return;
            }
            if (!(GameState.storage && GameState.storage.fabrica && GameState.storage.fabrica.built)) {
                UI.notify(t('abbotPetition.fodina.denied_fabrica'), true); return;
            }
            if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 50) {
                UI.notify(t('abbotPetition.fodina.denied_groats'), true); return;
            }
            const hasPickaxe = (GameState.inventory['iron_pickaxe'] > 0) || (GameState.inventory['stone_pickaxe'] > 0)
                || (GameState.inventory['worn_iron_pickaxe'] > 0);
            if (!hasPickaxe) {
                UI.notify(t('abbotPetition.fodina.denied_pickaxe'), true); return;
            }
        }

        // Validace podmínek — pro fornax
        if (type === 'fornax') {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fornax'))) {
                UI.notify(t('abbotPetition.fornax.denied_tech'), true); return;
            }
            if (!(GameState.abbotPetition.fodina && GameState.abbotPetition.fodina.status === 'approved')) {
                UI.notify(t('abbotPetition.fornax.denied_fodina'), true); return;
            }
            if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 80) {
                UI.notify(t('abbotPetition.fornax.denied_groats'), true); return;
            }
            if ((GameState.inventory['charcoal'] || 0) < 15) {
                UI.notify(t('abbotPetition.fornax.denied_charcoal'), true); return;
            }
        }

        // Validace podmínek — pro Columbarium (Porta)
        if (type === 'columbarium') {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_porta'))) {
                UI.notify(t('abbotPetition.columbarium.denied_tech'), true); return;
            }
            if (!(GameState.columbarium && GameState.columbarium.built)) {
                UI.notify(t('abbotPetition.columbarium.denied_build'), true); return;
            }
        }

        // Validace podmínek — pro Domus Conversorum II
        if (type === 'domus_ii') {
            const deniedKey = this._checkDomusIIConditions();
            if (deniedKey) {
                UI.notify(t('abbotPetition.domus_ii.' + deniedKey), true); return;
            }
        }

        // Validace podmínek — pro Probošta (endgame-branches-reference.md sekce 4.3)
        if (type === 'probost') {
            const fTier = (GameState.templum && GameState.templum.fabricaTier) || 0;
            if (fTier < 1) {
                UI.notify(t('abbotPetition.probost.denied_fabrica'), true); return;
            }
            if (!['armarius', 'prior'].includes(GameState.rank && GameState.rank.monastic)) {
                UI.notify(t('abbotPetition.probost.denied_rank'), true); return;
            }
        }

        // Vše OK — odeslat žádost
        pet.status = 'pending';
        pet.submittedAt = Date.now();
        pet.deniedReason = null;

        const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
        const submitDate = _toGameDate(Date.now()).toLocaleDateString(cs ? 'cs-CZ' : 'en-GB');
        const responseDate = _toGameDate(Date.now() + 86400000).toLocaleDateString(cs ? 'cs-CZ' : 'en-GB');

        const kronikaCs = t('abbotPetition.' + type + '.kronika_submit')
            .replace('{responseDate}', responseDate);
        const kronikaEn = (lang === 'en' ? t('abbotPetition.' + type + '.kronika_submit') : '')
            .replace('{responseDate}', responseDate);

        UI.notifyPanel('📜 ' + (cs
            ? 'Žádost odeslána opatovi. Odpověď očekávána ' + responseDate + '.'
            : 'Petition submitted to the Abbot. Reply expected by ' + responseDate + '.'), 'system');

        Game.addKronikaEntry('important',
            kronikaCs,
            'Petition submitted. Reply expected by ' + responseDate + '.',
            'Petitio ad abbatem missa. Responsum ' + responseDate + ' exspectatur.'
        );

        Game.save();
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    },

    // ── VITREA V1: startovní pool + denní opotřebení (MRD vitrea-equipment-reference.md) ──
    VITREA_BREAKABLE: ['glass_stopper','glass_flask','fly_trap_glass','glass_goblet','glass_tankard','glass_jug','glass_bowl','glass_pitcher','glass_vase','window_roundel','paternoster_beads','alembic','glass_mirror'],

    vitreaGrantStartPool: function() {
        if (GameState.vitreaGranted) return;
        GameState.vitreaGranted = true;
        // Klášter začíná s vybavením (~18 ks); alembik záměrně NE — hard gate přes Skláře
        this.addItem('glass_bowl', 3);
        this.addItem('glass_jug', 3);
        this.addItem('glass_goblet', 4);
        this.addItem('glass_pitcher', 1);
        this.addItem('glass_stopper', 5);
        this.addItem('glass_flask', 2);
        Game.save();
    },

    vitreaWearTick: function() {
        const last = GameState.vitreaLastWear || 0;
        if (Date.now() - last < 24 * 60 * 60 * 1000) return;
        GameState.vitreaLastWear = Date.now();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const conversiCnt = (GameState.conversi || []).length;
        const jilji = (GameState.conversi || []).some(k => k.rosterId === 'k_jilji');
        const chance = Math.min(0.35, 0.05 + 0.02 * conversiCnt + (jilji ? 0.05 : 0));
        if (Math.random() >= chance) { Game.save(); return; }
        const owned = this.VITREA_BREAKABLE.filter(id => (GameState.inventory[id] || 0) > 0);
        if (!owned.length) { Game.save(); return; }
        const victim = owned[Math.floor(Math.random() * owned.length)];
        this.removeItem(victim, 1);
        GameState.vitreaLastBroken = { id: victim, ts: Date.now() };
        const itemName = (typeof iName === 'function') ? iName(victim) : victim;
        const blameJilji = jilji && Math.random() < 0.5;
        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            UI.notifyPanel('💥 ' + (lang==='en'
                ? itemName + ' broke' + (blameJilji ? ' — Jiljí swears it slipped by itself.' : '.')
                : itemName + ' se rozbil' + (blameJilji ? ' — Jiljí přísahá, že to vyklouzlo samo.' : '.')), 'warning');
        }
        Game.addKronikaEntry('minor',
            '💥 Rozbil se kus vybavení: ' + itemName + (blameJilji ? '. Jiljí u toho byl. Samozřejmě.' : '.'),
            '💥 A piece of equipment broke: ' + itemName + (blameJilji ? '. Jiljí was there. Of course.' : '.'),
            '💥 Vas fractum est.');
        Game.save();
    },

    // ── TEMPLUM T6-V1: Poutníci — týdenní šance návštěvy; relikvie = magnet (MRD templum/visitatio) ──
    pilgrimTick: function() {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (!(GameState.researchedTechs || []).includes('tech_canonical_hours')) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        if (!t.lastMass) return; // mrtvý kostel poutníky nemá
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!t.nextPilgrims) { t.nextPilgrims = Date.now() + Math.round(WEEK * 0.375); Game.save(); return; } // offset ~2,6 d
        if (Date.now() < t.nextPilgrims) return;
        t.nextPilgrims = Date.now() + WEEK;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const hasRelic = (GameState.inventory['reliquia'] || 0) >= 1;
        const snap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
        const feast = !!(snap && snap.feast && snap.feast.active);
        const chance = Math.min(0.7, 0.4 + (hasRelic ? 0.2 : 0) + (feast ? 0.1 : 0));
        if (Math.random() >= chance) { Game.save(); return; } // ticho — žádný spam

        const infl = (GameState.persona && GameState.persona.influence) || {};
        const grose = 3 + Math.floor(Math.random() * 6) + Math.floor((infl.church || 0) / 10);
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(grose);
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 1);
        t.lastPilgrims = { ts: Date.now(), grose: grose };
        Game._templumLog({ type: 'pilgrims', grose: grose });
        // T6-V2: poutní cesty = přenašeči — 10% šance nachlazení (existující nemoc, žádný nový obsah)
        let caughtCold = false;
        if (typeof HealthSystem !== 'undefined' && HealthSystem.addCondition && Math.random() < 0.10) {
            HealthSystem.addCondition('cold');
            caughtCold = true;
        }
        Game.save();

        const flavors = [
            ['🚶 Poutníci z kraje se zastavili u kostela. Ofěra: ' + grose + ' grošů.', '🚶 Pilgrims from the countryside stopped at the church. Offering: ' + grose + ' groschen.'],
            ['🚶 Skupinka poutníků klečela u oltáře do soumraku. V misce zůstalo ' + grose + ' grošů.', '🚶 A band of pilgrims knelt at the altar till dusk. ' + grose + ' groschen remained in the bowl.'],
            ['🚶 Poutníci prosili o požehnání na cestu' + (hasRelic ? ' — a chtěli spatřit relikvii' : '') + '. Ofěra ' + grose + ' grošů.', '🚶 Pilgrims asked a blessing for the road' + (hasRelic ? ' — and wished to see the relic' : '') + '. Offering of ' + grose + ' groschen.'],
        ];
        const f = flavors[Math.floor(Math.random() * flavors.length)];
        const coldNote = caughtCold ? (lang === 'en' ? ' One of the pilgrims coughed through the whole mass.' : ' Jeden z poutníků kašlal celou mši.') : '';
        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel((lang === 'en' ? f[1] : f[0]) + coldNote, 'success');
        Game.addKronikaEntry('minor', f[0] + (caughtCold ? ' Jeden z poutníků kašlal celou mši.' : ''), f[1] + (caughtCold ? ' One of the pilgrims coughed through the whole mass.' : ''), '🚶 Peregrini venerunt.');

        // T6-V2: poutní cesty přenášejí — 10% šance nachlazení (ofěra přišla tak jako tak; riziko = cena otevřených dveří)
        if (typeof HealthSystem !== 'undefined' && HealthSystem.addCondition && Math.random() < 0.10) {
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                UI.notifyPanel(lang === 'en'
                    ? '🤧 One of the pilgrims coughed through the whole mass…'
                    : '🤧 Jeden z poutníků kašlal celou mši…', 'warning');
            }
            HealthSystem.addCondition('cold');
        }
    },

    // ── TEMPLUM Probošt: životní události farních rodin (endgame-branches-reference.md sekce 4.3) ──
    PARISH_SURNAMES: ['Novák', 'Dvořák', 'Král', 'Procházka', 'Sedlák', 'Novotný', 'Malý', 'Kovář', 'Krejčí'],

    parishEventTick: function() {
        if (!(GameState.rank && GameState.rank.probost)) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!t.nextParishEvent) { t.nextParishEvent = Date.now() + Math.round(WEEK * 0.5); Game.save(); return; }
        if (Date.now() < t.nextParishEvent) return;
        t.nextParishEvent = Date.now() + WEEK;
        if (Math.random() >= 0.5) { Game.save(); return; } // ne každý týden — tichý farní klid

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const types = ['baptism', 'wedding', 'funeral'];
        const type = types[Math.floor(Math.random() * types.length)];
        const surname = this.PARISH_SURNAMES[Math.floor(Math.random() * this.PARISH_SURNAMES.length)];
        const titleMap = { baptism: ['Křest', 'Baptism'], wedding: ['Svatba', 'Wedding'], funeral: ['Pohřeb', 'Funeral'] };
        const descMap = {
            baptism: ['Rodina ' + surname + ' žádá o křest dítěte.', 'The ' + surname + ' family asks for a christening.'],
            wedding: ['Rodina ' + surname + ' žádá o oddání.', 'The ' + surname + ' family asks to be wed.'],
            funeral: ['Rodina ' + surname + ' žádá o pohřeb.', 'The ' + surname + ' family asks for a funeral rite.'],
        };
        Game.save();

        const rerender = () => {
            const el = document.getElementById('home-templum-content');
            if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
        };

        NotificationSystem.modal({
            icon: type === 'baptism' ? '👶' : type === 'wedding' ? '💍' : '⚰️',
            title: (lang === 'en' ? titleMap[type][1] : titleMap[type][0]) + ' — ' + surname,
            text: `<div style="font-size:0.82rem; line-height:1.45;">${lang==='en' ? descMap[type][1] : descMap[type][0]}</div>`,
            choices: [
                { label: (lang==='en'?'✝️ Officiate':'✝️ Vykonat obřad'), effect: () => {
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                        PersonaSystem.addInfluence('church', 2);
                        PersonaSystem.addInfluence('village', 2);
                    }
                    if (type === 'wedding' && typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                        CellariumSystem.addGrose(5 + Math.floor(Math.random() * 10));
                    }
                    if (type === 'funeral') {
                        if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
                        GameState.cemetery.graves.push({ surname: surname, ts: Date.now() });
                        // Bestiář: první hrob na hřbitově odemkne Kostelního grima —
                        // legenda praví, že první pohřbený musí navždy hlídat bránu.
                        if (GameState.cemetery.graves.length === 1 && typeof SecretsSystem !== 'undefined') {
                            SecretsSystem.unlockFolioById('folio_grim_bestiar');
                        }
                    }
                    Game._templumLog({ type: 'parish', eventType: type, surname: surname, officiated: true });
                    Game.addKronikaEntry('minor',
                        '✝️ ' + titleMap[type][0] + ': rodina ' + surname + ' — obřad vykonán.',
                        '✝️ ' + titleMap[type][1] + ': the ' + surname + ' family — rite performed.',
                        '✝️ Ritus peractus est.');
                    Game.save(); rerender();
                }},
                { label: (lang==='en'?'🚪 Decline':'🚪 Odmítnout'), effect: () => {
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', -2);
                    Game._templumLog({ type: 'parish', eventType: type, surname: surname, officiated: false });
                    Game.addKronikaEntry('minor',
                        '🚪 ' + titleMap[type][0] + ': rodina ' + surname + ' odmítnuta.',
                        '🚪 ' + titleMap[type][1] + ': the ' + surname + ' family turned away.',
                        '🚪 Petitio recusata est.');
                    Game.save(); rerender();
                }}
            ]
        });
    },

    // ── VISITATIO V1: biskupská vizitace — checklist z žitých systémů (MRD visitatio-reference.md) ──
    visitatioTick: function() {
        const at = GameState.flags && GameState.flags.visitatioAt;
        if (!at || Date.now() < at) return;
        if (typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        const t = GameState.templum || {};
        const inv = GameState.inventory || {};
        const infl = (GameState.persona && GameState.persona.influence) || {};

        // Checklist (MRD sekce 3)
        const rows = [];
        const item = (ok, pts, cs, en) => { rows.push({ ok: ok, pts: ok ? pts : 0, cs: cs, en: en }); return ok ? pts : 0; };
        let score = 0;
        score += item((t.litUntil || 0) > now, 1, 'Kostel svítí', 'Church is lit');
        score += item((t.cleanUntil || 0) > now, 1, 'Kostel čistý', 'Church is clean');
        score += item(!!(t.lastMass && now - t.lastMass.ts < 8 * 24 * 3600000), 2, 'Mše slouženy pravidelně', 'Mass held regularly');
        score += item((infl.church || 0) >= 40, 2, 'Ecclesia vliv ≥ 40', 'Ecclesia influence ≥ 40');
        const hasIncense = ['incense_olibanum','incense_styrax','incense_pine','incense_spruce'].some(id => (inv[id] || 0) > 0);
        score += item((inv['candle'] || 0) >= 2 && ((inv['vinum'] || 0) + (inv['wine'] || 0)) >= 1 && hasIncense && (inv['hostia'] || 0) >= 3, 1, 'Zásoba na mši skladem', 'Mass supplies in store');
        score += item(!!t.lastConfession, 1, 'Zpovědní služba běží', 'Confession service kept');
        const mis = GameState.flags.bishopMissal;
        const misPts = mis === 'delivered' ? 2 : mis === 'failed' ? -2 : mis === 'refused_final' ? -1 : 0;
        rows.push({ ok: misPts > 0, pts: misPts, cs: 'Misálová pověst', en: 'Missal reputation' });
        score += misPts;

        // Pásma
        const band = score >= 7 ? 'laudatio' : score >= 3 ? 'neutrum' : 'correctio';
        let victim = null;
        if (band === 'laudatio') {
            // V3-A: relikvie jen při prvním Laudatiu; opakované = Ecclesia +12 místo ní
            const hasRelic = (GameState.inventory['reliquia'] || 0) >= 1;
            if (hasRelic) {
                if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 12);
            } else {
                this.addItem('reliquia', 1);
                if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 10);
            }
            GameState.flags.visitatioLaudatio = true;
            if (GameState.rank) GameState.rank.priorNomination = true; // MRD 6.5: biskupova chvála = jmenovací akt (Prior)
        } else if (band === 'neutrum') {
            if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 3);
        } else {
            if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', -5);
            // Jednotlivec, ne plošný trest: biskup jmenuje jednoho „nedbalého" bratra (MRD 6.6)
            const pool = (GameState.conversi || []).filter(k => !(k.penanceUntil && k.penanceUntil > now));
            if (pool.length) {
                victim = pool[Math.floor(Math.random() * pool.length)];
                victim.penanceUntil = now + 2 * 24 * 3600000;
            }
        }
        GameState.flags.visitatioAt = null;
        GameState.flags.visitatioDone = now;
        // V3-A: re-arm ohlašovacího dopisu (PortaSystem readIds je jinak navždy) — archiv historii vizitací kumuluje
        if (GameState.letters && GameState.letters.readIds) {
            delete GameState.letters.readIds['l11_visitatio_ohlaseni'];
            if (GameState.letters.firstSeen) delete GameState.letters.firstSeen['l11_visitatio_ohlaseni'];
        }
        Game.save();

        // Kronika
        const kCs = band === 'laudatio' ? '✨ Vizitace: Jeho Milost chválila dům a darovala relikvii. Laudatio!'
                 : band === 'neutrum' ? '🔔 Vizitace: Jeho Milost přikývla. „Příště více," pravila kancelář.'
                 : '⚖️ Vizitace: napomenutí domu.' + (victim ? ' Bratr ' + victim.name + ' jmenován nedbalým — dva dny pokání.' : '');
        const kEn = band === 'laudatio' ? '✨ Visitation: His Grace praised the house and bestowed a relic. Laudatio!'
                 : band === 'neutrum' ? '🔔 Visitation: His Grace nodded. "More, next time," said the chancery.'
                 : '⚖️ Visitation: the house admonished.' + (victim ? ' Brother ' + victim.name + ' named negligent — two days of penance.' : '');
        Game.addKronikaEntry('important', kCs, kEn, '✝️ Visitatio canonica peracta est.');

        // Modal s rozpisem — hráč vidí, ZA CO
        let html = rows.map(r => `<div style="display:flex; justify-content:space-between; font-size:0.78rem; ${r.ok ? '' : 'color:#c0392b;'}"><span>${r.ok ? '✓' : '✗'} ${lang==='en'?r.en:r.cs}</span><strong>${r.pts > 0 ? '+' + r.pts : r.pts}</strong></div>`).join('');
        html += `<div style="border-top:1px solid rgba(0,0,0,0.15); margin-top:6px; padding-top:6px; display:flex; justify-content:space-between; font-size:0.82rem; font-weight:bold;"><span>${lang==='en'?'Total':'Celkem'}</span><span>${score} b</span></div>`;
        const verdictCs = band === 'laudatio' ? '✨ LAUDATIO — relikvie darována, Ecclesia +10.'
                       : band === 'neutrum' ? '🔔 Zdvořilé přikývnutí. Ecclesia +3.'
                       : '⚖️ CORRECTIO — Ecclesia −5.' + (victim ? ' Bratr ' + victim.name + ': 2 dny pokání.' : '');
        const verdictEn = band === 'laudatio' ? '✨ LAUDATIO — a relic bestowed, Ecclesia +10.'
                       : band === 'neutrum' ? '🔔 A courteous nod. Ecclesia +3.'
                       : '⚖️ CORRECTIO — Ecclesia −5.' + (victim ? ' Brother ' + victim.name + ': 2 days of penance.' : '');
        html += `<div style="margin-top:8px; font-size:0.82rem;">${lang==='en'?verdictEn:verdictCs}</div>`;
        NotificationSystem.modal({
            icon: '✝️',
            title: lang==='en' ? 'The Bishop\'s Visitation' : 'Biskupská vizitace',
            text: html,
            choices: [{ label: lang==='en' ? '🙏 So be it' : '🙏 Staň se', effect: () => {
                const el = document.getElementById('home-templum-content');
                if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
            } }]
        });
    },

    // ── TEMPLUM T5: Dary — páteříky/vosk → Ecclesia (bez cooldownu; decay reguluje sám) ──
    TEMPLUM_DONATIONS: {
        paternoster_beads: { qty: 1, influence: 5 },
        beeswax:           { qty: 5, influence: 2 },
        crayfish_boiled:   { qty: 1, influence: 3 },
        // TODO: relikvie — item přijde s vizitací / Porta biskupským řetězem
    },

    templumDonate: function(itemId) {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        const d = this.TEMPLUM_DONATIONS[itemId];
        if (!d) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((GameState.inventory[itemId] || 0) < d.qty) { UI.notify('⚠️ Non habes sufficiens!', true); return; }
        this.removeItem(itemId, d.qty);
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
            PersonaSystem.addInfluence('church', d.influence);
        }
        // Zbožnost — Avaritia/štědrost (endgame-branches-reference.md sekce 9)
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
        if (!GameState.templum) GameState.templum = {};
        const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
        GameState.templum.lastDonation = { id: itemId, ts: Date.now() };
        Game._templumLog({ type: 'donation', itemId: itemId, influence: d.influence });
        Game.save();
        UI.notify('📿 ' + (lang==='en'
            ? 'Offering accepted: ' + itemName + ' — Ecclesia +' + d.influence + '.'
            : 'Dar přijat: ' + itemName + ' — Ecclesia +' + d.influence + '.'));
        Game.addKronikaEntry('minor',
            '📿 Kostelu darováno: ' + itemName + '.',
            '📿 Offered to the church: ' + itemName + '.',
            '📿 Donum ecclesiae oblatum est.');
        const el = document.getElementById('home-templum-content');
        if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
    },

    // ── TEMPLUM: sdílený log pro dashboard (Confession/Mass/Offerings/
    // Pilgrims/Parish karty si z něj filtrují vlastní typ). Max 50 záznamů,
    // nejnovější první. Aditivní vedle stávajících t.lastX snapshotů —
    // ty se nemění, log se jen navíc plní.
    _templumLog: function(entry) {
        if (!GameState.templum) GameState.templum = {};
        if (!Array.isArray(GameState.templum.log)) GameState.templum.log = [];
        GameState.templum.log.unshift(Object.assign({ ts: Date.now() }, entry));
        if (GameState.templum.log.length > 50) GameState.templum.log.length = 50;
    },

    // ── TEMPLUM T4: Zpověď — 1×/7 d, náhodný ODEMČENÝ Clientela kontakt; osy se perou ──
    templumConfessionTick: function() {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (typeof ContactsDB === 'undefined' || typeof NotificationSystem === 'undefined') return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!t.nextConfession) { t.nextConfession = Date.now() + Math.round(WEEK * 0.75); Game.save(); return; } // offset ~5 d proti výplatě/Kapitule
        if (Date.now() < t.nextConfession) return;

        const researched = GameState.researchedTechs || [];
        const readBooks = (GameState.library && GameState.library.readBooks) || [];
        const unlocked = Object.keys(ContactsDB).filter(id => {
            const c = ContactsDB[id];
            return (!c.unlockTech || researched.includes(c.unlockTech))
                && (!c.unlockBook || readBooks.includes(c.unlockBook));
        });
        t.nextConfession = Date.now() + WEEK;
        if (!unlocked.length) { Game.save(); return; } // nikdo se nezná — zpověď odpadá

        const id = unlocked[Math.floor(Math.random() * unlocked.length)];
        const c = ContactsDB[id];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cName = lang === 'en' ? c.name_en : c.name;
        const sin = lang === 'en' ? (c.confession_en || '') : (c.confession || '');
        Game.save();

        // Osa a váha — Přísné pokání/Shovívavost teď platí/vydělávají na OSE
        // toho konkrétního kontaktu, ne vždycky na Church. Sekundární osa
        // (je-li) dostane poměrnou část dle její weight.
        const axis = c.primaryAxis || 'village';
        const secAxis = c.secondaryAxis && c.secondaryAxis.axis;
        const secWeight = c.secondaryAxis ? c.secondaryAxis.weight : 0;

        // Gated kontakty (mají minRelation práh na zboží/zakázky) riskují víc
        // při přísném pokání — formální vztah, hůř snáší tvrdost.
        const isGated = (c.buyOffer && Object.values(c.buyOffer.items || {}).some(o => o.minRelation))
                     || (c.glassOrders && Object.values(c.glassOrders).some(o => o.minRelation));
        const strictPenalty = isGated ? -5 : -3;
        const curRelation = (GameState.contactRelation && GameState.contactRelation[id]) || 0;
        const gateWarning = isGated
            ? `<div style="margin-top:6px; font-size:0.72rem; color:#c0392b;">⚠️ ${lang==='en'
                ? 'A formal relationship — harsh judgment risks more here (current relation: '+curRelation+').'
                : 'Formální vztah — přísnost tu riskuje víc (aktuální vztah: '+curRelation+').'}</div>`
            : '';

        const rerender = () => {
            const el = document.getElementById('home-templum-content');
            if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
        };
        const record = (choice) => {
            t.lastConfession = { id: id, name: cName, choice: choice, ts: Date.now() };
            Game._templumLog({ type: 'confession', name: cName, choice: choice });
        };

        NotificationSystem.modal({
            icon: '🙏',
            title: (lang==='en' ? 'Confession — ' : 'Zpověď — ') + cName,
            text: `<div style="font-size:0.82rem; line-height:1.45;">${c.icon} <span style="font-style:italic; opacity:0.85;">${sin}</span><br><br>${lang==='en'?'He kneels and waits for your word.':'Klečí a čeká na tvé slovo.'}</div>${gateWarning}`,
            choices: [
                { label: (lang==='en'?'⚖️ Strict penance':'⚖️ Přísné pokání'), type: 'danger', effect: () => {
                    if (typeof PersonaSystem !== 'undefined') {
                        PersonaSystem.addInfluence(axis, 3);
                        if (secAxis) PersonaSystem.addInfluence(secAxis, Math.round(3 * secWeight * 10) / 10);
                        if (PersonaSystem.addZboznost) PersonaSystem.addZboznost(2);
                    }
                    if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.addContactRelation(id, strictPenalty);
                    record('strict');
                    Game.addKronikaEntry('minor',
                        '🙏 Zpověď: ' + cName + ' dostal přísné pokání. Bylo to k něčímu prospěchu — jemu ne.',
                        '🙏 Confession: ' + cName + ' received strict penance. Someone benefits from it — he does not.',
                        '🙏 Poenitentia severa imposita est.');
                    Game.save(); rerender();
                }},
                { label: (lang==='en'?'🕊️ Leniency':'🕊️ Shovívavost'), effect: () => {
                    if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.addContactRelation(id, 3);
                    if (typeof PersonaSystem !== 'undefined') {
                        PersonaSystem.addInfluence(axis, 1);
                        if (secAxis) PersonaSystem.addInfluence(secAxis, Math.round(1 * secWeight * 10) / 10);
                    }
                    record('lenient');
                    Game.addKronikaEntry('minor',
                        '🙏 Zpověď: ' + cName + ' odešel s lehkým pokáním a lehčím srdcem.',
                        '🙏 Confession: ' + cName + ' left with a light penance and a lighter heart.',
                        '🙏 Misericordia praevaluit.');
                    Game.save(); rerender();
                }},
                { label: (lang==='en'?'🚪 Turn him away':'🚪 Odmítnout'), effect: () => {
                    record('refused');
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(-1);
                    if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.addContactRelation(id, -2);
                    Game.addKronikaEntry('minor',
                        '🙏 Zpověď: ' + cName + ' odešel nevyslyšen — a nezapomene na to.',
                        '🙏 Confession: ' + cName + ' left unheard — and will not forget it.',
                        '🙏 Confessio recusata est.');
                    Game.save(); rerender();
                }},
            ]
        });
    },

    // ── Haeresis Occulta MRD — Cesta B (pokání). Dedikovaná akce, VÝSLOVNĚ
    // oddělená od templumConfessionTick nahoře (ten řeší cizí hříchy
    // villagerů/kontaktů, ne bratrův vlastní blud). Volá se z tlačítka
    // ve Valetudo tabu (PersonaSystem._renderValetudo), jen když je
    // haeresis_occulta aktivní. Léčí okamžitě (žádný item), ale sráží
    // inquisitionHeat víc než Cesta A (Elixir Purgationis).
    confessHeresy: function() {
        if (!(GameState.health && GameState.health.active && GameState.health.active['haeresis_occulta'])) return;
        if (typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cool = (amount) => { if (GameState.secrets) GameState.secrets.inquisitionHeat = Math.max(0, (GameState.secrets.inquisitionHeat || 0) - amount); };

        NotificationSystem.modal({
            icon: '🙏',
            title: lang === 'en' ? 'Confess to the Abbot' : 'Vyznat se opatovi',
            text: lang === 'en'
                ? 'The thought that crept in with the draught does not belong to you. Kneel and confess it before it takes root.'
                : 'Myšlenka, co přišla s douškem, ti nepatří. Poklekni a vyznej ji, než zapustí kořeny.',
            choices: [
                { label: (lang === 'en' ? '⚖️ Strict penance' : '⚖️ Přísné pokání'), type: 'danger', effect: () => {
                    HealthSystem.removeCondition('haeresis_occulta', true);
                    if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 8);
                    cool(20);
                    Game.addKronikaEntry('minor',
                        '🙏 Vyznal ses opatovi z kacířského bludu. Přísné pokání — bolestivé, ale důkladné.',
                        '🙏 You confessed the heretical delusion to the Abbot. Strict penance — painful, but thorough.',
                        '🙏 Confessio facta est. Poenitentia severa.');
                    Game.save();
                    if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
                }},
                { label: (lang === 'en' ? '🕊️ Ask for leniency' : '🕊️ Prosit o shovívavost'), effect: () => {
                    HealthSystem.removeCondition('haeresis_occulta', true);
                    if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 3);
                    cool(12);
                    Game.addKronikaEntry('minor',
                        '🙏 Vyznal ses opatovi z kacířského bludu. Shovívavost — lehčí srdce, menší klid.',
                        '🙏 You confessed the heretical delusion to the Abbot. Leniency — a lighter heart, a smaller peace.',
                        '🙏 Confessio facta est. Misericordia data.');
                    Game.save();
                    if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
                }}
            ]
        });
    },

    // ── monastery-decay-mrd, Vrstva 1 — denní trigger kontrola pro nemoci,
    // které nejsou vázané na konkrétní akci (rheumatism, scurvy, gout, lice,
    // scabies). dysentery (studna) a ergot_fire (chléb) jsou u svých akcí. ──
    healthConditionsDailyTick: function() {
        if (typeof HealthSystem === 'undefined') return;
        if (!GameState.healthTick) GameState.healthTick = { lastCheck: 0 };
        const DAY = 24 * 60 * 60 * 1000;
        if (Date.now() - (GameState.healthTick.lastCheck || 0) < DAY) return;
        GameState.healthTick.lastCheck = Date.now();

        const month = new Date().getMonth() + 1; // 1–12
        const isWinter = (month === 12 || month === 1 || month === 2);
        const isLateWinter = (month === 2 || month === 3); // scurvy

        // Revma z klečení — zima, mírná šance po Officiu/Kapitule
        if (isWinter && !HealthSystem.isActive('rheumatism') && Math.random() < 0.015) {
            HealthSystem.addCondition('rheumatism');
        }

        // Kurděje — pozdní zima, nedostatek ovoce v inventáři (méně než 3 kusy)
        if (isLateWinter && !HealthSystem.isActive('scurvy')) {
            const fruitStock = (GameState.inventory['berries'] || 0) + (GameState.inventory['dried_wild_fruit'] || 0)
                + (GameState.inventory['apple'] || 0) + (GameState.inventory['pear'] || 0);
            if (fruitStock < 3 && Math.random() < 0.03) {
                HealthSystem.addCondition('scurvy');
            }
        }

        // Vši/Svrab — vyšší šance, pokud je aktivní konvrš na Dvoře (kontakt
        // s laickými pracovníky a zvířaty)
        const hasDvurWorker = GameState.conversi && GameState.conversi.some(k => k.task === 'dvur');
        if (hasDvurWorker) {
            if (!HealthSystem.isActive('lice') && Math.random() < 0.01) HealthSystem.addCondition('lice');
            if (!HealthSystem.isActive('scabies') && Math.random() < 0.008) HealthSystem.addCondition('scabies');
        }

        // Dna — přemíra masa/vína za poslední týden
        if (!HealthSystem.isActive('gout') && typeof VigorSystem !== 'undefined' && VigorSystem.goutWeeklyScore) {
            const score = VigorSystem.goutWeeklyScore();
            if (score >= 8 && Math.random() < 0.05) {
                HealthSystem.addCondition('gout');
            }
        }
    },


    MASS_INCENSE_TIER: { incense_spruce: 0, incense_pine: 1, incense_styrax: 2, incense_olibanum: 3 },

    serveMass: function() {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const now = Date.now();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((t.nextMass || 0) > now) return;
        const inv = GameState.inventory;

        if ((inv['candle'] || 0) < 2) { UI.notify('⚠️ ' + (lang==='en'?'Mass needs 2 candles.':'Mše potřebuje 2 svíce.'), true); return; }
        const wineId = (inv['vinum'] || 0) > 0 ? 'vinum' : ((inv['wine'] || 0) > 0 ? 'wine' : null);
        if (!wineId) { UI.notify('⚠️ ' + (lang==='en'?'Mass needs wine.':'Mše potřebuje víno.'), true); return; }
        // Nejlepší dostupné kadidlo — mši náleží to nejlepší (historicky věrné, tier bonus funguje)
        const incenseId = ['incense_olibanum','incense_styrax','incense_pine','incense_spruce'].find(id => (inv[id] || 0) > 0);
        if (!incenseId) { UI.notify('⚠️ ' + (lang==='en'?'Mass needs incense.':'Mše potřebuje kadidlo.'), true); return; }
        if ((inv['hostia'] || 0) < 3) { UI.notify('⚠️ ' + (lang==='en'?'Mass needs 3 host wafers.':'Mše potřebuje 3 hostie.'), true); return; }

        this.removeItem('candle', 2);
        this.removeItem(wineId, 1);
        this.removeItem(incenseId, 1);
        this.removeItem('hostia', 3);

        // Mešní nádobí (od Katedrály): křehké sklo se občas rozbije, spotřeba jen pokud je skladem
        let brokenGlass = null;
        if ((t.fabricaTier || 0) >= 3 && Math.random() < 0.08) {
            const glassOrder = Math.random() < 0.5 ? ['glass_goblet', 'glass_bowl'] : ['glass_bowl', 'glass_goblet'];
            const glassId = glassOrder.find(id => (inv[id] || 0) > 0);
            if (glassId) { this.removeItem(glassId, 1); brokenGlass = glassId; }
        }

        // Stav kostela (T2 payoff): zhasnuto nebo zaprášeno → poloviční efekt
        const lit = (t.litUntil || 0) > now;
        const clean = (t.cleanUntil || 0) > now;
        const degraded = !lit || !clean;
        // Vestment-sezóna: liturgická barva musí sedět, jinak stejná penalizace jako degraded
        const VESTMENT_BY_COLOR = { white: 'roucho_bile', purple: 'roucho_fialove', green: 'roucho_zelene', red: 'roucho_cervene' };
        const liturgicalColor = (typeof CalendarSystem !== 'undefined' && CalendarSystem.getLiturgicalColor) ? CalendarSystem.getLiturgicalColor(new Date()) : null;
        const vestmentId = liturgicalColor ? VESTMENT_BY_COLOR[liturgicalColor] : null;
        const wrongVestment = vestmentId ? (inv[vestmentId] || 0) < 1 : false;
        let eccl = 5 + (this.MASS_INCENSE_TIER[incenseId] || 0);
        // Visitatio V2: vystavená relikvie — mše nese větší milost (základ, PŘED degradací i svátkem)
        if ((GameState.inventory['reliquia'] || 0) >= 1) eccl += 1;
        let vill = 3;
        if (degraded) { eccl = Math.max(1, Math.floor(eccl / 2)); vill = Math.max(1, Math.floor(vill / 2)); }
        if (wrongVestment) { eccl = Math.max(1, Math.floor(eccl / 2)); vill = Math.max(1, Math.floor(vill / 2)); }
        // Svátkový násobič (Chronicon feast flag) — PO degradaci; defenzivní no-op bez snapshotu
        let feastName = null;
        const _snap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
        if (_snap && _snap.feast && _snap.feast.active) {
            feastName = (lang === 'en' ? (_snap.feast.name_en || _snap.feast.name_cs) : _snap.feast.name_cs) || null;
            eccl *= 2;
            vill *= 2;
        }

        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
            PersonaSystem.addInfluence('church', eccl);
            PersonaSystem.addInfluence('village', vill);
        }
        // Zbožnost — osobní kotva (endgame-branches-reference.md sekce 9, Superbia/pravidelnost)
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
        t.nextMass = now + 7 * 24 * 60 * 60 * 1000;
        t.lastMass = { ts: now, incense: incenseId, degraded: degraded };
        Game._templumLog({ type: 'mass', incense: incenseId, degraded: degraded, feastName: feastName, eccl: eccl });
        // R1: odsloužená mše = držený kanonický rytmus (frater vyžaduje streak ≥ 7)
        if (GameState.rank) {
            GameState.rank.canonicalStreak = (GameState.rank.canonicalStreak || 0) + 1;
            if (typeof RankSystem !== 'undefined' && RankSystem.checkMonasticProgress) RankSystem.checkMonasticProgress();
        }
        Game.save();

        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            const feastPart = feastName ? (lang==='en' ? ' Feast of ' + feastName + ' — twofold grace!' : ' Svátek ' + feastName + ' — dvojnásobná milost!') : '';
            const vestmentPart = wrongVestment ? (lang==='en' ? ' Wrong vestment colour — impact reduced.' : ' Špatná barva roucha — dopad snížen.') : '';
            const glassPart = brokenGlass ? (lang==='en' ? ' Fragile glass broke during mass.' : ' Křehké sklo při mši prasklo.') : '';
            UI.notifyPanel('⛪ ' + (degraded
                ? (lang==='en' ? 'Mass held in gloom and dust. Ecclesia +'+eccl+', village +'+vill+'.' : 'Mše v šeru a prachu. Ecclesia +'+eccl+', vesnice +'+vill+'.')
                : (lang==='en' ? 'Mass held. Ecclesia +'+eccl+', village +'+vill+'.' : 'Mše odsloužena. Ecclesia +'+eccl+', vesnice +'+vill+'.')) + feastPart + vestmentPart + glassPart, (degraded || wrongVestment) ? 'warning' : 'success');
        }
        Game.addKronikaEntry('important',
            feastName ? '⛪ Mše o svátku ' + feastName + ' — kostel praskal ve švech.' : (degraded ? '⛪ Mše sloužena v šeru a prachu — kostel volá po péči.' : '⛪ Mše slavnostně odsloužena. Kraj naslouchal.'),
            feastName ? '⛪ Mass on the feast of ' + feastName + ' — the church was full to bursting.' : (degraded ? '⛪ Mass held in gloom and dust — the church calls for care.' : '⛪ Mass solemnly celebrated. The countryside listened.'),
            '⛪ Missa celebrata est.');
        const el = document.getElementById('home-templum-content');
        if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
    },

    // ── TEMPLUM Fabrica Ecclesiae — 4 stavební úrovně (endgame-branches-reference.md sekce 4.2) ──
    FABRICA_TIERS: [
        { name: 'Kaple',     name_en: 'Chapel',    cost: 0,   req: null, decayMult: 1.00, repairEff: 1.00 },
        { name: 'Kostel',    name_en: 'Church',    cost: 150, req: { ecclesia: 15, condition: 60, organ: true }, decayMult: 1.10, repairEff: 1.10 },
        { name: 'Chrám',     name_en: 'Temple',    cost: 400, req: { ecclesia: 35, zboznost: 25, condition: 70, materials: { cut_stone: 150, plank: 80, iron_ingot: 4, glass_stopper: 8 } }, decayMult: 1.20, repairEff: 1.25, buildDays: 10, repairCost: 20, repairMaterials: { cut_stone: 5 } },
        { name: 'Katedrála', name_en: 'Cathedral', cost: 900, req: { ecclesia: 60, zboznost: 50, condition: 80, materials: { cut_stone: 350, plank: 200, iron_ingot: 12, glass_stopper: 20, glass_goblet: 3, glass_bowl: 3, chrlic: 4 } }, decayMult: 1.35, repairEff: 1.40, buildDays: 14, repairCost: 30, repairMaterials: { cut_stone: 8, glass_bowl: 1 } },
    ],

    fabricaMeetsRequirements: function(req) {
        if (!req) return true;
        const p = GameState.persona || {};
        const cond = (GameState.templum && GameState.templum.condition != null) ? GameState.templum.condition : 100;
        if (req.condition && cond < req.condition) return false;
        if (req.ecclesia && ((p.influence && p.influence.church) || 0) < req.ecclesia) return false;
        if (req.zboznost && (p.zboznost || 0) < req.zboznost) return false;
        if (req.organ && (GameState.inventory['organ'] || 0) < 1) return false;
        if (req.materials) {
            for (const matId in req.materials) {
                if ((GameState.inventory[matId] || 0) < req.materials[matId]) return false;
            }
        }
        return true;
    },

    upgradeFabrica: function() {
        if (typeof CellariumSystem === 'undefined') return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const tier = t.fabricaTier || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (tier >= this.FABRICA_TIERS.length - 1) return;
        if (t.fabricaBuildUntil) { UI.notify('⚠️ ' + (lang==='en'?'Construction already underway.':'Stavba už probíhá.'), true); return; }
        const next = this.FABRICA_TIERS[tier + 1];
        if (!this.fabricaMeetsRequirements(next.req)) { UI.notify('⚠️ ' + (lang==='en'?'Requirements not met.':'Podmínky nesplněny.'), true); return; }
        if (CellariumSystem.getGrose() < next.cost) { UI.notify('⚠️ ' + (lang==='en'?'Not enough groschen.':'Nedostatek grošů.'), true); return; }
        CellariumSystem.spendGrose(next.cost);
        const mats = (next.req && next.req.materials) || {};
        for (const matId in mats) this.removeItem(matId, mats[matId]);
        const name = lang==='en' ? next.name_en : next.name;
        if (next.buildDays) {
            t.fabricaBuildUntil = Date.now() + next.buildDays * 24 * 60 * 60 * 1000;
            t.fabricaBuildTargetTier = tier + 1;
            Game.save();
            UI.notifyPanel('🏗️ ' + (lang==='en'?'Construction begins: ':'Stavba začíná: ') + name + '.', 'success');
            Game.addKronikaEntry('important',
                '🏗️ Fabrica: stavba ' + name + ' zahájena. Potrvá ' + next.buildDays + ' dní.',
                '🏗️ Fabrica: construction of ' + name + ' begun. Will take ' + next.buildDays + ' days.',
                '🏗️ Fabrica ecclesiae aedificatur.');
        } else {
            t.fabricaTier = tier + 1;
            Game.save();
            UI.notifyPanel('🏛️ ' + (lang==='en'?'The church rises: ':'Kostel roste: ') + name + '.', 'success');
            Game.addKronikaEntry('important',
                '🏛️ Fabrica: kostel povýšen na ' + name + '.',
                '🏛️ Fabrica: the church raised to ' + name + '.',
                '🏛️ Fabrica ecclesiae aucta est.');
        }
        const el2 = document.getElementById('home-templum-content');
        if (el2 && typeof TemplumSystem !== 'undefined') el2.innerHTML = TemplumSystem.renderTemplumTab();
    },

    checkFabricaBuildComplete: function() {
        if (!GameState.templum) return;
        const t = GameState.templum;
        if (!t.fabricaBuildUntil || Date.now() < t.fabricaBuildUntil) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const targetTier = t.fabricaBuildTargetTier;
        const def = this.FABRICA_TIERS[targetTier];
        t.fabricaTier = targetTier;
        t.fabricaBuildUntil = null;
        t.fabricaBuildTargetTier = null;
        const name = lang==='en' ? def.name_en : def.name;
        Game.save();
        UI.notifyPanel('🏛️ ' + (lang==='en'?'Construction complete: ':'Stavba dokončena: ') + name + '.', 'success');
        Game.addKronikaEntry('important',
            '🏛️ Fabrica: ' + name + ' dokončena.',
            '🏛️ Fabrica: ' + name + ' completed.',
            '🏛️ Fabrica ecclesiae perfecta est.');
    },

    buildNahrobek: function(ts) {
        if (!GameState.cemetery) return;
        const grave = (GameState.cemetery.graves || []).find(g => g.ts === ts);
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!grave || grave.nahrobek) return;
        if ((GameState.inventory['nahrobek'] || 0) < 1) { UI.notify('⚠️ ' + (lang==='en'?'No gravestone in store.':'Nemáš náhrobek na skladě.'), true); return; }
        this.removeItem('nahrobek', 1);
        grave.nahrobek = true;
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
        Game.save();
        UI.notify('🪦 ' + (lang==='en'?'Gravestone set.':'Náhrobek postaven.'));
        const el = document.getElementById('home-templum-content');
        if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
    },

    repairFabrica: function() {
        if (typeof CellariumSystem === 'undefined') return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const tierDef = this.FABRICA_TIERS[t.fabricaTier || 0];
        const cost = tierDef.repairCost || 20;
        const mats = tierDef.repairMaterials || {};
        if (CellariumSystem.getGrose() < cost) { UI.notify('⚠️ ' + (lang==='en'?'Not enough groschen.':'Nedostatek grošů.'), true); return; }
        for (const matId in mats) {
            if ((GameState.inventory[matId] || 0) < mats[matId]) {
                const matName = (typeof iName === 'function') ? iName(matId) : matId;
                UI.notify('⚠️ ' + (lang==='en'?'Missing material: ':'Chybí materiál: ') + matName + '.', true);
                return;
            }
        }
        CellariumSystem.spendGrose(cost);
        for (const matId in mats) this.removeItem(matId, mats[matId]);
        t.condition = Math.min(100, (t.condition != null ? t.condition : 100) + 15 * tierDef.repairEff);
        Game.save();
        UI.notify('🔧 ' + (lang==='en'?'Repairs made.':'Opraveno.'));
        const el3 = document.getElementById('home-templum-content');
        if (el3 && typeof TemplumSystem !== 'undefined') el3.innerHTML = TemplumSystem.renderTemplumTab();
    },
    templumDailyTick: function() {
        if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        this.checkFabricaBuildComplete();
        if (now - (t.lastTick || 0) < DAY) return;
        t.lastTick = now;

        // Svíce: kostel spotřebuje 1 svíci denně (Voskařova smyčka); bez svíce zhasnuto
        if ((GameState.inventory['candle'] || 0) > 0) {
            this.removeItem('candle', 1);
            t.litUntil = now + DAY;
        }

        // Úklid: konvrš PŘIŘAZENÝ na Kostel a/nebo bratr (Kostelník) dohlížející —
        // stejný combo vzor jako Manufaktura (dormitoriumBrotherMult, _workCredit).
        // Buď může uklízet sám; s oběma se čisto drží déle.
        const kostelBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'kostel');
        const cleaner = (GameState.conversi || [])
            .filter(k => k.task === 'kostel'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > now)
                      && !(k.injuredUntil && k.injuredUntil > now)
                      && !(k.awayUntil && k.awayUntil > now))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (cleaner || kostelBrother) {
            const brotherMult = kostelBrother ? this.dormitoriumBrotherMult(kostelBrother, 'kostel') : 1.0;
            if (cleaner) cleaner.fatigue = Math.min(100, cleaner.fatigue + 5);
            if (kostelBrother) {
                this.dormitoriumAddXp(kostelBrother, 'kostel');
                kostelBrother.fatigue = Math.min(100, (kostelBrother.fatigue || 0) + 5);
            }
            t.cleanUntil = now + Math.round(48 * 60 * 60 * 1000 * brotherMult);
            t.lastCleaner = this._workCredit(kostelBrother, cleaner);
        }
        // Fabrica: strukturální stav budovy pomalu chátrá, rychleji u vyšších úrovní
        const fTier = this.FABRICA_TIERS[t.fabricaTier || 0];
        t.condition = Math.max(0, (t.condition != null ? t.condition : 100) - 0.3 * fTier.decayMult);

        // Hřbitov: konvrš přiřazený na Hřbitov a/nebo bratr Kostelník dohlížející.
        // Bratr NENÍ samostatná "hrbitov" specializace — jeden Kostelník
        // (assignedTab === 'kostel') dohlíží na celý Templum, hřbitov nevyjímaje.
        // Rozlišení kostel/hřbitov je jen na úrovni konvršů (fyzická práce),
        // ne na úrovni dohlížejícího bratra.
        if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
        const cem = GameState.cemetery;
        const templumBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'kostel');
        const cemCleaner = (GameState.conversi || [])
            .filter(k => k.task === 'hrbitov'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > now)
                      && !(k.injuredUntil && k.injuredUntil > now)
                      && !(k.awayUntil && k.awayUntil > now))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (cemCleaner || templumBrother) {
            const brotherMult = templumBrother ? this.dormitoriumBrotherMult(templumBrother, 'kostel') : 1.0;
            if (cemCleaner) cemCleaner.fatigue = Math.min(100, cemCleaner.fatigue + 5);
            if (templumBrother) {
                this.dormitoriumAddXp(templumBrother, 'kostel');
                templumBrother.fatigue = Math.min(100, (templumBrother.fatigue || 0) + 5);
            }
            cem.condition = Math.min(100, cem.condition + 5 * brotherMult);
            cem.lastCleaner = this._workCredit(templumBrother, cemCleaner);
        }
        cem.condition = Math.max(0, cem.condition - 1); // pomalé zarůstání bez péče

        // Bestiář: Revenanti — hřbitov dlouhodobě zanedbaný (<30 %, se hroby)
        // odemkne legendu o neklidných mrtvých. Mirror Acedia vzoru (nízký
        // Vigor dlouho = eroze); tady nízký condition dlouho = nález.
        if (cem.condition < 30 && cem.graves.length > 0 && typeof SecretsSystem !== 'undefined') {
            SecretsSystem.unlockFolioById('folio_revenanti_bestiar');
        }

        // Persona influence — zanedbání se tiše propíše do vztahů, ne jen
        // do čísla stavu. Fabrica (fyzická stavba kostela) je věc hierarchie
        // → Church osa. Hřbitov (hroby vesnických rodin) je věc obce →
        // Village osa. Malý denní úbytek, jen pod prahem 40 %.
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
            if (t.condition < 40) {
                PersonaSystem.addInfluence('church', -0.3);
                if (!t.neglectWarnedChurch) {
                    t.neglectWarnedChurch = true;
                    Game.addKronikaEntry('important',
                        '⚠️ Sešlý kostel neujde pozornosti hierarchie. Vztah s Církví tiše klesá.',
                        '⚠️ A dilapidated church does not escape the notice of the hierarchy. Relations with the Church are quietly slipping.', '');
                }
            } else {
                t.neglectWarnedChurch = false;
            }
            if (cem.condition < 40) {
                PersonaSystem.addInfluence('village', -0.3);
                if (!GameState.cemetery.neglectWarnedVillage) {
                    GameState.cemetery.neglectWarnedVillage = true;
                    Game.addKronikaEntry('important',
                        '⚠️ Zarostlý hřbitov si vesničané všimli — jsou to jejich mrtví. Vztah s Vsí tiše klesá.',
                        '⚠️ The overgrown churchyard has not gone unnoticed by the villagers — these are their dead. Relations with the Village are quietly slipping.', '');
                }
            } else {
                GameState.cemetery.neglectWarnedVillage = false;
            }
        }

        Game.save();
    },

    // ── L3b: Oka na drobnou zvěř (Lovec řetěz). Paralelní k noži — aktivní lov (tuk gate) NEDOTČEN. ──
    SNARE_MS: 12 * 60 * 60 * 1000,
    SNARE_BREAK_CHANCE: 0.4,

    setSnare: function() {
        if ((GameState.inventory['snare'] || 0) <= 0) { UI.notify('⚠️ Nemáš žádné oko.', true); return; }
        if (!GameState.snareTraps) GameState.snareTraps = [];
        if (GameState.snareTraps.length >= 3) { UI.notify('⚠️ Víc než 3 oka najednou nelíčíš.', true); return; }
        this.removeItem('snare', 1);
        GameState.snareTraps.push({ readyAt: Date.now() + this.SNARE_MS });
        Game.save();
        UI.notify('🪤 Oko nalíčeno. Vrať se za 12 hodin.');
        UI.renderScavengeActions();
    },

    collectSnares: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.snareTraps) GameState.snareTraps = [];
        const now = Date.now();
        const ready = GameState.snareTraps.filter(s => now >= s.readyAt);
        if (!ready.length) return;
        GameState.snareTraps = GameState.snareTraps.filter(s => now < s.readyAt);
        let caught = 0, returned = 0, broken = 0;
        ready.forEach(() => {
            caught++;
            this.addItem('caught_small_game', 1);
            if (Math.random() < this.SNARE_BREAK_CHANCE) broken++;
            else { returned++; this.addItem('snare', 1); }
        });
        Game.save();
        UI.notify('🐿️ ' + (lang==='en'
            ? 'Snares: ' + caught + ' catch(es), ' + broken + ' snare(s) broken.'
            : 'Oka: úlovky ' + caught + ', zničená oka ' + broken + '.'));
        UI.renderScavengeActions();
    },

    processCaughtGame: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((GameState.inventory['caught_small_game'] || 0) <= 0) return;
        if ((GameState.inventory['stone_knife'] || 0) <= 0) { UI.notify('⚠️ ' + (lang==='en'?'You need a knife.':'Potřebuješ nůž.'), true); return; }
        this.removeItem('caught_small_game', 1);
        this.addItem('meat', 1);      // Divoké maso
        this.addItem('fat', 1);
        this.addItem('scraps', 1);    // zbytky — krmivo (B3 vazba)
        if (Math.random() < 0.5) this.addItem('bone', 1);
        Game.save();
        UI.notify('🔪 ' + (lang==='en' ? 'Dressed: wild meat, fat, scraps.' : 'Zpracováno: divoké maso, tuk, zbytky.'));
        UI.renderScavengeActions();
    },

    checkAbbotPetitions: function() {
        if (!GameState.abbotPetition) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'cs';
        const now = Date.now();
        const DAY_MS = 86400000;

        ['fodina', 'fornax', 'domus_ii', 'probost'].forEach(type => {
            const pet = GameState.abbotPetition[type];
            if (!pet || pet.status !== 'pending') return;
            if (now - pet.submittedAt < DAY_MS) return;

            // 24h uplynulo — vyhodnotit
            let deniedKey = null;

            if (type === 'fodina') {
                if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fodina'))) deniedKey = 'denied_tech';
                else if (!(GameState.storage && GameState.storage.fabrica && GameState.storage.fabrica.built)) deniedKey = 'denied_fabrica';
                else if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 50) deniedKey = 'denied_groats';
                else {
                    const hasPickaxe = (GameState.inventory['iron_pickaxe'] > 0) || (GameState.inventory['stone_pickaxe'] > 0)
                        || (GameState.inventory['worn_iron_pickaxe'] > 0);
                    if (!hasPickaxe) deniedKey = 'denied_pickaxe';
                }
            }

            if (type === 'fornax') {
                if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fornax'))) deniedKey = 'denied_tech';
                else if (!(GameState.abbotPetition.fodina && GameState.abbotPetition.fodina.status === 'approved')) deniedKey = 'denied_fodina';
                else if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 80) deniedKey = 'denied_groats';
                else if ((GameState.inventory['charcoal'] || 0) < 15) deniedKey = 'denied_charcoal';
            }

            if (type === 'columbarium') {
                if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_porta'))) deniedKey = 'denied_tech';
                else if (!(GameState.columbarium && GameState.columbarium.built)) deniedKey = 'denied_build';
            }

            if (type === 'domus_ii') {
                deniedKey = this._checkDomusIIConditions();
            }

            if (type === 'probost') {
                const fTier = (GameState.templum && GameState.templum.fabricaTier) || 0;
                if (fTier < 1) deniedKey = 'denied_fabrica';
                else if (!['armarius', 'prior'].includes(GameState.rank && GameState.rank.monastic)) deniedKey = 'denied_rank';
            }

            if (deniedKey) {
                // Zamítnout
                pet.status = 'denied';
                pet.deniedReason = deniedKey;
                const reason = t('abbotPetition.' + type + '.' + deniedKey);
                UI.notifyPanel('❌ ' + (cs ? 'Opat zamítl žádost.' : 'The Abbot denied the petition.') + ' ' + reason, 'warning');
                Game.addKronikaEntry('important',
                    t('abbotPetition.' + type + '.kronika_denied').replace('{reason}', reason),
                    'The Abbot denied the petition. Reason: ' + reason,
                    'Abbas petitionem negavit.'
                );
                // Reset na none — hráč může zkusit znovu
                setTimeout(() => { pet.status = 'none'; pet.submittedAt = null; Game.save(); }, 3000);
            } else {
                // Schválit
                pet.status = 'approved';
                pet.inspectionPending = true;
                if (type === 'probost') {
                    if (!GameState.rank) GameState.rank = {};
                    GameState.rank.probost = true;
                }
                if (type === 'columbarium') {
                    if (typeof FarmyardSystem !== 'undefined') FarmyardSystem._ensureAnimals();
                    const _cfg = (typeof FarmyardSystem !== 'undefined') ? FarmyardSystem.COLUMBARIUM_CFG : null;
                    GameState.columbarium.count = _cfg ? _cfg.startCount : 20;
                    GameState.columbarium.lastEggAt = Date.now();
                    GameState.columbarium.lastFeatherAt = Date.now();
                    // PortaSystem engine gate — dopisy/pošta ožívají až s holuby
                    if (!GameState.flags) GameState.flags = {};
                    GameState.flags.porta_active = true;
                }
                UI.notifyPanel('✅ ' + t('abbotPetition.' + type + '.approved'), 'success');
                UI.notifyPanel('🔍 ' + t('abbotPetition.' + type + '.inspect_hint'), 'info');
                Game.addKronikaEntry('important',
                    t('abbotPetition.' + type + '.kronika_approved'),
                    type === 'fodina' ? 'The Abbot granted mining rights (Fodina).' : 'The Abbot approved the Fornax Ferraria.',
                    'Abbas petitionem approbavit.'
                );
            }
            Game.save();
            if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        });
    },

    // ── CONVERSI — holý skelet (jméno + slot) ───────────────────────────────
    KONVRS_NAMES: ['Jakub', 'Matěj', 'Ondřej', 'Šimon', 'Tomáš', 'Vojtěch', 'Blažej', 'Havel', 'Prokop', 'Bartoloměj', 'Jiljí', 'Řehoř', 'Vít', 'Bonifác', 'Kliment'],

    conversiCapacity: function() {
        const s = GameState.storage || {};
        if (s.domus_conversorum_ii && s.domus_conversorum_ii.built) return 5;
        if (s.domus_conversorum_i  && s.domus_conversorum_i.built)  return 2;
        return 0;
    },

    // ── DORMITORIUM — kapacita bratrů (mniši/skriptoři, manažerská vrstva) ──
    dormitoriumCapacity: function() {
        const s = GameState.storage || {};
        if (s.dormitorium_iii && s.dormitorium_iii.built) return 10;
        if (s.dormitorium_ii  && s.dormitorium_ii.built)  return 6;
        if (s.dormitorium_i   && s.dormitorium_i.built)   return 3;
        return 0;
    },

    // ── DORMITORIUM — XP/úroveň specializace (odvozená z assignedTab) ──
    // Úroveň se nově počítá z PRIMÁRNÍ vlastnosti pro daný tab (viz
    // DORMITORIUM_TAB_TRAITS), ne z odděleného xp[tabId] čítače — jeden zdroj
    // pravdy. Škála prahů zdvojnásobena oproti starému [0,15,50,120], protože
    // primární vlastnost roste +2/tick (dormitoriumAddXp), staré XP jen +1/tick.
    // Fallback na starý xp[tabId] systém zůstává pro jistotu, kdyby tab neměl
    // definovanou primární vlastnost v DORMITORIUM_TAB_TRAITS.
    DORMITORIUM_XP_THRESHOLDS: [0, 30, 100, 240], // index = level-1 (1-4), škála traits (0-100 cap ale růst neomezený zde)
    DORMITORIUM_LEVEL_MULT:    [1.0, 1.10, 1.20, 1.30],

    dormitoriumBrotherLevel: function(brother, tabId) {
        const map = this.DORMITORIUM_TAB_TRAITS[tabId];
        const th = this.DORMITORIUM_XP_THRESHOLDS;
        let value;
        if (map && brother.traits && typeof brother.traits[map.primary] === 'number') {
            value = brother.traits[map.primary];
        } else {
            // Fallback — starý systém, pro taby bez definované primární vlastnosti
            value = (brother.xp && brother.xp[tabId]) || 0;
        }
        let level = 1;
        for (let i = th.length - 1; i >= 0; i--) {
            if (value >= th[i]) { level = i + 1; break; }
        }
        return level;
    },

    dormitoriumBrotherMult: function(brother, tabId) {
        const level = this.dormitoriumBrotherLevel(brother, tabId);
        let mult = this.DORMITORIUM_LEVEL_MULT[level - 1];
        // Nemoc snižuje výkon přímo — mimo fatigue navíc (co ho stejně
        // vyřadí z výběru přes existující filtry), i aktivní bratr pracuje hůř.
        if (brother.conditions && Object.keys(brother.conditions).length > 0) mult *= 0.7;
        return mult;
    },

    // Mapování tab → (primární vlastnost +2, sekundární +1) — monk-attributes-mrd.
    // Zbožnost/Pokora/Askeze/Výřečnost prací NEROSTOU — rostou denním rytmem
    // (Officium/Kapitula), řešeno jinde, ne zde.
    DORMITORIUM_TAB_TRAITS: {
        athanor:     { primary: 'erudition',     secondary: 'focus' },
        scriptorium: { primary: 'erudition',     secondary: 'focus' },
        zahony:      { primary: 'craftsmanship', secondary: 'vigor' },
        sad:         { primary: 'craftsmanship', secondary: 'vigor' },
        pole:        { primary: 'craftsmanship', secondary: 'vigor' },
        vinohrad:    { primary: 'craftsmanship', secondary: 'vigor' },
        apiarium:    { primary: 'craftsmanship', secondary: 'vigor' },
        piscina:     { primary: 'craftsmanship', secondary: 'vigor' },
        dvur:        { primary: 'vigor',         secondary: 'craftsmanship' },
        kostel:      { primary: 'piety',         secondary: 'obedience' },
    },

    // Individualizace rosteru (monk-attributes-mrd, krok 5) — malý startovní
    // náznak charakteru per postava, +10 v uvedených 2 vlastnostech při
    // najmutí. Odvozeno z origin textů v DormitoriumRosterDB — jemný odraz
    // povahy, ne mechanicky rozhodující rozdíl mezi postavami.
    DORMITORIUM_ROSTER_TRAIT_BONUS: {
        b_bonaventura: ['craftsmanship', 'asceticism'],   // Zahradník — trpělivý, mluví s rostlinami
        b_kolumban:    ['craftsmanship', 'vigor'],         // Chovatel — pozná nemocné zvíře, věrný stádu
        b_prokulus:    ['erudition', 'focus'],             // Skriptor — ruka se netřese, pyšný na řemeslo
        b_teofil:      ['erudition', 'focus'],             // Alchymista — tajemný, přemýšlivý
        b_radim:       ['erudition', 'eloquence'],         // Knihovník — nejstarší, vřelost k mladším
    },

    // Sestaví jméno pro _reportWork hlášku — když bratr i konvrš pracují
    // spolu (combo bonus se ve výnosu už projevuje), zmíní oba; jinak jen
    // toho, kdo tam skutečně je.
    _workCredit: function(brother, konvrs) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (brother && konvrs) {
            return brother.name + (lang === 'en' ? ' (with ' + konvrs.name + ')' : ' (s pomocí ' + konvrs.name + ')');
        }
        return brother ? brother.name : (konvrs ? konvrs.name : '');
    },

    dormitoriumAddXp: function(brother, tabId) {
        if (!brother.xp) brother.xp = {};
        const levelBefore = this.dormitoriumBrotherLevel(brother, tabId);
        brother.xp[tabId] = (brother.xp[tabId] || 0) + 1;

        // Stress — přepracování. Kontrola PŘED touhle prací přidanou únavou
        // (representuje "už teď je vyčerpaný"), ne po ní.
        if (typeof brother.fatigue === 'number' && brother.fatigue >= 70) {
            brother.stress = Math.min(100, (brother.stress || 0) + 3);
        }

        // Vedlejší přírůstek do traits — zatím NEnahrazuje výše uvedený
        // xp[tabId] čítač (ten dál řídí dormitoriumBrotherLevel/Mult), jen
        // ho doplňuje. Přepočítání levelu na traits je samostatný krok
        // (monk-attributes-mrd, sekce 6, bod 3) — zatím neproveden.
        const map = this.DORMITORIUM_TAB_TRAITS[tabId];
        if (map && brother.traits) {
            if (typeof brother.traits[map.primary] === 'number') {
                brother.traits[map.primary] = Math.min(100, brother.traits[map.primary] + 2);
            }
            if (typeof brother.traits[map.secondary] === 'number') {
                brother.traits[map.secondary] = Math.min(100, brother.traits[map.secondary] + 1);
            }
        }

        // Level-up hlášení — dřív se počítal a používal (Manufaktura dashboard),
        // ale hráč se o postupu nikde aktivně nedozvěděl.
        const levelAfter = this.dormitoriumBrotherLevel(brother, tabId);
        if (levelAfter > levelBefore) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const spec = (typeof DormitoriumSpecializationDB !== 'undefined') ? DormitoriumSpecializationDB[tabId] : null;
            const specName = spec ? (lang === 'en' ? spec.name_en : spec.name) : tabId;
            const mult = this.dormitoriumBrotherMult(brother, tabId);
            UI.notifyPanel('📈 ' + (lang === 'en'
                ? brother.name + ' reached level ' + levelAfter + '/4 in ' + specName + ' (×' + mult.toFixed(2) + ' yield).'
                : brother.name + ' dosáhl úrovně ' + levelAfter + '/4 v oboru ' + specName + ' (×' + mult.toFixed(2) + ' výnos).'), 'success');
            this.addKronikaEntry('minor',
                '📈 ' + brother.name + ' dosáhl úrovně ' + levelAfter + '/4 (' + specName + ').',
                '📈 ' + brother.name + ' reached level ' + levelAfter + '/4 (' + specName + ').',
                '');
        }
    },

    // Přiřadí bratra na tab (max 1 bratr per tab). tabId === null odebere.
    assignBrotherTab: function(brotherId, tabId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const b = (GameState.dormitorium && GameState.dormitorium.brothers || []).find(x => x.id === brotherId);
        if (!b) return;
        if (tabId === null) { b.assignedTab = null; Game.save(); if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('dormitorium'); return; }

        if (tabId.indexOf('infirmarium_') === 0 && !(GameState.researchedTechs && GameState.researchedTechs.includes('tech_infirmarium'))) {
            UI.notify(lang==='en' ? 'This role is not open yet.' : 'Tato role ještě není otevřená.', true); return;
        }

        const taken = GameState.dormitorium.brothers.find(x => x.assignedTab === tabId && x.id !== b.id);
        if (taken) {
            UI.notify(lang==='en' ? taken.name+' already manages this section.' : taken.name+' už tuto sekci řídí.', true); return;
        }

        b.assignedTab = tabId;
        Game.save();
        const spec = (typeof DormitoriumSpecializationDB !== 'undefined') ? DormitoriumSpecializationDB[tabId] : null;
        const specName = spec ? (lang==='en' ? spec.name_en : spec.name) : tabId;
        UI.notifyPanel('📿 ' + (lang==='en' ? b.name+' now oversees: '+specName : b.name+' nyní řídí: '+specName), 'system');
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('dormitorium');
    },

    // ── DORMITORIUM — najmutí bratra (mnicha/skriptora) ──
    // Bez rank/vztah gate (na rozdíl od Conversi) — jen kapacita budovy + groše.
    hireBrother: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.dormitorium) GameState.dormitorium = { brothers: [] };
        if (!GameState.dormitorium.brothers) GameState.dormitorium.brothers = [];
        const cap = this.dormitoriumCapacity();
        if (cap === 0) {
            UI.notify(lang==='en' ? 'Build Dormitorium first.' : 'Nejprve postav Dormitorium.', true); return;
        }
        if (GameState.dormitorium.brothers.length >= cap) {
            UI.notify(lang==='en' ? 'No free beds in the Dormitorium.' : 'V Dormitoriu není volné lůžko.', true); return;
        }
        const HIRE_COST = 30;
        if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < HIRE_COST) {
            UI.notify(lang==='en' ? 'Not enough groats.' : 'Nedostatek grošů.', true); return;
        }

        let rosterId = null, name, hireQuote = '';
        const rosterOk = (typeof DormitoriumRosterDB !== 'undefined') && Object.keys(DormitoriumRosterDB).length > 0;
        if (rosterOk) {
            const hiredIds = GameState.dormitorium.brothers.map(b => b.rosterId).filter(Boolean);
            const availIds = Object.keys(DormitoriumRosterDB).filter(rid => !hiredIds.includes(rid));
            const poolIds = availIds.length ? availIds : Object.keys(DormitoriumRosterDB);
            rosterId = poolIds[Math.floor(Math.random() * poolIds.length)];
            const rec = DormitoriumRosterDB[rosterId];
            name = rec.name;
            const hq = rec.quotes && rec.quotes.hire;
            if (hq) hireQuote = (lang === 'en' ? hq.en : hq.cs);
        } else {
            name = lang === 'en' ? 'Brother' : 'Bratr';
        }

        CellariumSystem.addGrose(-HIRE_COST);

        // Duchovní/intelektuální/praktické vlastnosti (monk-attributes-mrd) —
        // start: 0, roste jen prací (viz dormitoriumAddXp). Bez náhodné variace
        // na startu — každý bratr začíná na úrovni 1/4 ve všech tabech.
        const brother = {
            id: 'brother_' + Date.now(),
            rosterId, name,
            hiredAt: Date.now(),
            assignedTab: null,
            xp: {},
            fatigue: 0,
            mood: 60,
            loyalty: 30,
            stress: 0,
            temptation: 0,
            traits: {
                piety: 0,          // Zbožnost
                obedience: 0,      // Pokora/Poslušnost
                asceticism: 0,     // Askeze
                erudition: 0,      // Učenost
                focus: 0,          // Soustředění
                craftsmanship: 0,  // Řemeslná zručnost
                eloquence: 0,      // Výřečnost
                vigor: 0,          // Tělesná zdatnost
            },
        };

        // Individualizace rosteru (monk-attributes-mrd, krok 5) — malý
        // startovní náznak charakteru podle postavy (+10 ve 2 vlastnostech,
        // ne extrémní rozdíl, jen jemný odraz origin textu). Bratři mimo
        // roster (fallback "Bratr") nedostávají žádný bonus.
        const rosterBonus = this.DORMITORIUM_ROSTER_TRAIT_BONUS[rosterId];
        if (rosterBonus) {
            rosterBonus.forEach(key => {
                if (typeof brother.traits[key] === 'number') {
                    brother.traits[key] = Math.min(100, brother.traits[key] + 10);
                }
            });
        }

        GameState.dormitorium.brothers.push(brother);

        UI.notifyPanel('📿 ' + (lang==='en' ? name+' has joined as a brother.' : name+' se připojil jako bratr.') + (hireQuote ? ' „' + hireQuote + '“' : ''), 'success');
        Game.addKronikaEntry('important',
            '📿 ' + name + ' se připojil ke klášteru jako bratr Dormitoria.',
            '📿 ' + name + ' has joined the monastery as a brother of the Dormitorium.',
            '📿 ' + name + ' frater factus est.'
        );
        Game.save();
    },

    // Hlášení odvedené práce (Conversi/Dormitorium) — Kronika + Zprávy z
    // kláštera + přehled za poslední tick (GameState.lastTickReport).
    _reportWork: function(text_cs, text_en) {
        if (!GameState.lastTickReport) GameState.lastTickReport = [];
        GameState.lastTickReport.push({ ts: Date.now(), cs: text_cs, en: text_en });

        this.addKronikaEntry('minor', text_cs, text_en, '');
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            NotificationSystem.panel(lang === 'en' ? text_en : text_cs, 'system');
        }
    },

    // ── CONVERSI — přiřazování úkolů (M1) ───────────────────────────────────
    CONVERSI_TASKS: {
        dvur:     { icon: '🏚️', away: false, dailyRiskPct: 8, injuryKind: 'physical' },
        zahony:   { icon: '🌿', away: false, dailyRiskPct: 2, injuryKind: 'physical' },
        sad:      { icon: '🍎', away: false, dailyRiskPct: 7, injuryKind: 'physical' },
        apiarium: { icon: '🐝', away: false, dailyRiskPct: 5, injuryKind: 'sting', injuryHours: 6 },
        piscina:  { icon: '🐟', away: false, dailyRiskPct: 5, injuryKind: 'physical' },
        pole:     { icon: '🌾', away: false, dailyRiskPct: 7, injuryKind: 'physical' },
        vinohrad: { icon: '🍇', away: false, dailyRiskPct: 6, injuryKind: 'physical' },
        scavenge: { icon: '🌾', away: true,  durationMs: 8  * 60 * 60 * 1000, riskPct: 12 },
        doly:     { icon: '⛏️', away: true,  durationMs: 20 * 60 * 60 * 1000, riskPct: 20 },
        kostel:   { icon: '🕍', away: false, dailyRiskPct: 3, injuryKind: 'physical' },
        hrbitov:  { icon: '⚰️', away: false, dailyRiskPct: 6, injuryKind: 'physical' },
        servitor:   { icon: '🩺', away: false, dailyRiskPct: 6, injuryKind: 'illness' },
        coquus:     { icon: '🍲', away: false, dailyRiskPct: 7, injuryKind: 'physical' },
        hortulanus: { icon: '🌿', away: false, dailyRiskPct: 2, injuryKind: 'physical' },
        balneator:  { icon: '🔥', away: false, dailyRiskPct: 7, injuryKind: 'physical' },
    },
    CONVERSI_TASK_SLOTS: 2,

    // Vrací {locked, reasonKey} — reasonKey pro i18n hint na dlaždici
    conversiTaskGate: function(taskId) {
        if (taskId === 'doly') {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_fodina'))) {
                return { locked: true, reasonKey: 'gate_fodina_tech' };
            }
            if (!(GameState.abbotPetition && GameState.abbotPetition.fodina && GameState.abbotPetition.fodina.status === 'approved')) {
                return { locked: true, reasonKey: 'gate_fodina_approval' };
            }
            return { locked: false };
        }
        if (taskId === 'kostel') {
            if (!(typeof TemplumSystem !== 'undefined' && TemplumSystem.isUnlocked())) {
                return { locked: true, reasonKey: 'gate_frater' };
            }
            return { locked: false };
        }
        const INFIRMARIUM_SUBTECH = {
            servitor: 'tech_infirmarium_servitor',
            coquus: 'tech_infirmarium_coquus',
            hortulanus: 'tech_infirmarium_hortulanus',
            balneator: 'tech_infirmarium_balneator'
        };
        if (INFIRMARIUM_SUBTECH[taskId]) {
            if (!(GameState.researchedTechs && GameState.researchedTechs.includes(INFIRMARIUM_SUBTECH[taskId]))) {
                return { locked: true, reasonKey: 'gate_infirmarium_tech' };
            }
            return { locked: false };
        }
        return { locked: false }; // dvur, scavenge — bez gate
    },

    conversiTaskCount: function(taskId, excludeId) {
        return (GameState.conversi || []).filter(k => k.task === taskId && k.id !== excludeId).length;
    },

    // Přiřadí konvrše na úkol; taskId === null odebere z fronty. Validuje gate + sloty.
    assignConversiTask: function(konvrsId, taskId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const k = (GameState.conversi || []).find(x => x.id === konvrsId);
        if (!k) return;
        if (k.awayUntil && k.awayUntil > Date.now()) {
            UI.notify(lang==='en' ? 'He is away — wait for his return.' : 'Je pryč — počkej na návrat.', true); return;
        }
        if (taskId === null) { k.task = null; Game.save(); if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('conversi'); return; }

        const gate = this.conversiTaskGate(taskId);
        if (gate.locked) {
            UI.notify(lang==='en' ? 'This task is not open yet.' : 'Tento úkol ještě není otevřený.', true); return;
        }
        if (this.conversiTaskCount(taskId, k.id) >= this.CONVERSI_TASK_SLOTS) {
            UI.notify(lang==='en' ? 'No free slot for this task.' : 'Žádný volný slot na tento úkol.', true); return;
        }

        k.task = taskId;
        const cfg = this.CONVERSI_TASKS[taskId];
        if (cfg && cfg.away) {
            k.awayTask = taskId;
            k.awayUntil = Date.now() + cfg.durationMs;
            UI.notifyPanel('🚶 ' + (lang==='en' ? k.name+' left for '+taskId+'.' : k.name+' odešel na úkol: '+taskId+'.'), 'system');
        } else if (this.conversiDayBlock() !== 'work') {
            UI.notify(lang==='en' ? 'Assigned — he\'ll begin work at the next work block.' : 'Přiřazeno — konvrš se pustí do práce až v dalším pracovním bloku.', false);
        }
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('conversi');
    },

    // Vyřeší návraty z Scavenge/Dolů — riziko, výnos, hláška. Volat z periodického ticku.
    CONVERSI_SCAVENGE_LOOT: ['mushroom', 'berries', 'thyme', 'st_johns_wort', 'wood', 'clay', 'rose', 'cornu_cervi', 'gentian'],
    checkConversiReturns: function() {
        if (!GameState.conversi || !GameState.conversi.length) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        GameState.conversi.forEach(k => {
            if (!k.awayUntil || k.awayUntil > now) return;
            const taskId = k.awayTask;
            const cfg = this.CONVERSI_TASKS[taskId];
            k.awayUntil = null;
            k.awayTask = null;
            k.task = null; // po návratu čeká na nové přiřazení

            const rec = (k.rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[k.rosterId] : null;
            const roll = Math.random() * 100;
            const risky = cfg && roll < cfg.riskPct;

            let yieldTxt = '';
            if (taskId === 'doly') {
                if (risky) {
                    k.injuredUntil = now + 24 * 60 * 60 * 1000;
                    k.fatigue = Math.min(100, k.fatigue + 20);
                    UI.notifyPanel('⚠️ ' + (lang==='en' ? k.name+' was hurt in the mine. Resting 24h.' : k.name+' se zranil v dole. Odpočívá 24h.'), 'warning');
                    Game.addKronikaEntry('minor', '⚠️ '+k.name+' se zranil v dole.', '⚠️ '+k.name+' was hurt in the mine.', '⚠️ '+k.name+' in fodina vulneratus est.');
                } else {
                    const qty = 2 + Math.floor(Math.random() * 3);
                    this.addItem('iron_ore', qty);
                    k.fatigue = Math.min(100, k.fatigue + 15);
                    yieldTxt = qty + '× iron_ore';
                    // Fix 3B (athanor-integrity-audit.md §3) — vzácný byproduct z hlubších štol
                    // Vlna 2 (media-materia-konsolidace.md §3) — sal_petrae/arsenicum doplněny do poolu
                    if (Math.random() < 0.15) {
                        const rarePool = ['vitriol', 'malachite', 'sal_petrae', 'arsenicum'];
                        const bonusId = rarePool[Math.floor(Math.random() * rarePool.length)];
                        this.addItem(bonusId, 1);
                        yieldTxt += ' + 1× ' + bonusId;
                    }
                    // Vlna 1 (media-materia-konsolidace.md §3) — základní kovy častější
                    // než vzácné minerály nahoře, samostatný roll.
                    if (Math.random() < 0.4) {
                        const metalPool = ['lead', 'copper', 'tin'];
                        const metalId = metalPool[Math.floor(Math.random() * metalPool.length)];
                        this.addItem(metalId, 1);
                        yieldTxt += ' + 1× ' + metalId;
                    }
                    UI.notifyPanel('⛏️ ' + (lang==='en' ? k.name+' returned from the mine with '+yieldTxt+'.' : k.name+' se vrátil z dolu s '+yieldTxt+'.'), 'success');
                    Game.addKronikaEntry('minor', '⛏️ '+k.name+' přinesl z dolu '+yieldTxt+'.', '⛏️ '+k.name+' brought '+yieldTxt+' from the mine.', '⛏️ '+k.name+' e fodina rediit.');
                }
            } else if (taskId === 'scavenge') {
                if (risky) {
                    const lost = Math.min(3, Math.floor(Math.random() * 3) + 1);
                    UI.notifyPanel('🏴 ' + (lang==='en' ? 'Robbers took '+k.name+"'s haul on the road." : 'Lapkové oloupili '+k.name+' na cestě.'), 'warning');
                    Game.addKronikaEntry('minor', '🏴 Lapkové oloupili '+k.name+' na zpáteční cestě.', '🏴 Robbers waylaid '+k.name+' on the road home.', '🏴 Latrones '+k.name+' spoliaverunt.');
                } else {
                    const itemId = this.CONVERSI_SCAVENGE_LOOT[Math.floor(Math.random() * this.CONVERSI_SCAVENGE_LOOT.length)];
                    const qty = 1 + Math.floor(Math.random() * 3);
                    this.addItem(itemId, qty);
                    k.fatigue = Math.min(100, k.fatigue + 10);
                    yieldTxt = qty + '× ' + itemId;
                    UI.notifyPanel('🌾 ' + (lang==='en' ? k.name+' returned from scavenging with '+yieldTxt+'.' : k.name+' se vrátil ze scavenge s '+yieldTxt+'.'), 'success');
                    Game.addKronikaEntry('minor', '🌾 '+k.name+' přinesl ze scavenge '+yieldTxt+'.', '🌾 '+k.name+' brought '+yieldTxt+' from scavenging.', '🌾 '+k.name+' rediit.');
                }
            }
        });
        Game.save();
    },

    // Denní riziko zranění/nákazy u away:false konvrší úkolů (Dvůr, Pole, Coquus...).
    // Nezávislé na checkConversiChores — čistě aditivní, nesahá na výnosovou logiku.
    // Princip: NIKDY nesmí vyžadovat Infirmarium k vyřešení — čas vždy stačí sám,
    // Infirmarium/Apothecarius je jen akcelerátor (viz infirmariumCareModifier).
    checkConversiTaskRisk: function() {
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        if (!GameState.conversiNextRiskCheck) { GameState.conversiNextRiskCheck = now + DAY; return; } // první den bez rizika
        if (now < GameState.conversiNextRiskCheck) return;
        GameState.conversiNextRiskCheck = now + DAY;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        (GameState.conversi || []).forEach(k => {
            if (!k.task) return;
            if (k.injuredUntil && k.injuredUntil > now) return;
            if (k.admittedToInfirmarium) return;
            if (k.awayUntil && k.awayUntil > now) return;
            if (k.penanceUntil && k.penanceUntil > now) return;
            const cfg = this.CONVERSI_TASKS[k.task];
            if (!cfg || !cfg.dailyRiskPct) return;
            if (Math.random() * 100 >= cfg.dailyRiskPct) return;

            if (cfg.injuryKind === 'illness') {
                // Servitor — nákaza od právě léčenýho pacienta, ne injuredUntil
                const inf = GameState.infirmarium || { patients: [] };
                const patientConditions = [];
                (inf.patients || []).forEach(p => {
                    const pool = p.isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
                    const patient = pool.find(e => e.id === p.entityId);
                    if (patient && patient.conditions) {
                        Object.keys(patient.conditions).forEach(cid => { if (!patientConditions.includes(cid)) patientConditions.push(cid); });
                    }
                });
                if (!patientConditions.length) return; // nikdo nemocnej, není co chytit
                const caughtId = patientConditions[Math.floor(Math.random() * patientConditions.length)];
                if (!k.conditions) k.conditions = {};
                if (k.conditions[caughtId]) return; // už to má
                const def = HealthConditionsDB[caughtId];
                if (!def) return;
                k.conditions[caughtId] = { startedAt: now, expiresAt: now + def.durationHours * 3600000 };
                const condName = lang==='en' ? def.name_en : def.name;
                UI.notifyPanel('🤒 ' + (lang==='en' ? k.name+' caught '+condName+' from a patient.' : k.name+' se nakazil od pacienta: '+condName+'.'), 'warning');
                this.addKronikaEntry('minor', '🤒 '+k.name+' se v Infirmariu nakazil: '+condName+'.', '🤒 '+k.name+' caught '+condName+' at the infirmary.', '🤒 '+k.name+' aegrotavit.');
            } else {
                const hours = cfg.injuryHours || 24;
                k.injuredUntil = now + hours * 60 * 60 * 1000;
                k.fatigue = Math.min(100, (k.fatigue || 0) + (cfg.injuryKind === 'sting' ? 10 : 20));
                const kindMsg = cfg.injuryKind === 'sting'
                    ? (lang==='en' ? k.name+' was stung repeatedly. Swelling for '+hours+'h.' : k.name+' dostal několik žihadel. Otok na '+hours+'h.')
                    : (lang==='en' ? k.name+' was hurt at work. Resting '+hours+'h.' : k.name+' se zranil při práci. Odpočívá '+hours+'h.');
                UI.notifyPanel('⚠️ ' + kindMsg, 'warning');
                this.addKronikaEntry('minor', '⚠️ '+k.name+' se zranil při práci.', '⚠️ '+k.name+' was hurt at work.', '⚠️ '+k.name+' vulneratus est.');
            }
        });
        Game.save();
    },

    // Famulus — sezónní síla, žádná trvalá vazba. 4g/týden, bez loajality,
    // okamžitej odchod při neplacení (viz upravená mzdová smyčka výš).
    // Chirurgus/Rasor — hybrid hire: nejdřív Clientela vztah (relation >= 30),
    // pak funguje jako Famulus (3g/týden, bez loajality, okamžitej odchod).
    // Uspávací houba — zkrátí injuredUntil konvrše (24h → 4h), spotřebuje 1× item.
    applySpongiaToInjured: function(entityId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const k = (GameState.conversi || []).find(x => x.id === entityId);
        if (!k) return;
        const now = Date.now();
        if (!k.injuredUntil || k.injuredUntil <= now) {
            UI.notify(lang==='en' ? 'Not injured.' : 'Není zraněnej.', true); return;
        }
        if ((GameState.inventory['spongia_somnifera'] || 0) < 1) {
            UI.notify(lang==='en' ? 'You have none in stock.' : 'Nemáš to na skladě.', true); return;
        }
        this.removeItem('spongia_somnifera', 1);
        const shortened = now + 4 * 60 * 60 * 1000;
        if (shortened < k.injuredUntil) k.injuredUntil = shortened;
        UI.notifyPanel('🧽 ' + (lang==='en' ? k.name+"'s pain is eased — back on his feet sooner." : k.name+'ovi ulevila bolest — brzy na nohou.'), 'success');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity('conversi');
    },

    // Capellanus — duchovní útěcha pacientovi, jednou za pobyt. Jinej efekt než
    // Infirmarius (stress/temptation u bratra, mood u konvrše) — ne další
    // vrstva do infirmariumCareModifier, ať se role nescvaknou do jednoho čísla.
    hearConfession: function(entityId, isBrother) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (!entity || !entity.admittedToInfirmarium) return;
        const hasCapellanus = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_capellanus');
        if (!hasCapellanus) {
            UI.notify(lang==='en' ? 'No Capellanus to hear confession.' : 'Není Capellanus, kdo by vyslechl zpověď.', true); return;
        }
        if (entity.confessedThisStay) return;
        entity.confessedThisStay = true;
        if (isBrother) {
            entity.stress = Math.max(0, (entity.stress || 0) - 20);
            entity.temptation = Math.max(0, (entity.temptation || 0) - 20);
        } else {
            entity.mood = Math.min(100, (entity.mood || 0) + 15);
        }
        UI.notifyPanel('🙏 ' + (lang==='en' ? entity.name+' finds peace in confession.' : entity.name+' nalezl klid ve zpovědi.'), 'success');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
    },

    hireChirurgus: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const relation = (GameState.contactRelation && GameState.contactRelation['chirurgus']) || 0;
        if (relation < 30) {
            UI.notify(lang==='en' ? 'Not enough trust yet.' : 'Zatím nedostatečná důvěra.', true); return;
        }
        if (GameState.chirurgus && GameState.chirurgus.hired) return;
        GameState.chirurgus = { hired: true, wageOwed: 0, nextWage: Date.now() + 7 * 24 * 60 * 60 * 1000 };
        UI.notifyPanel('🩹 ' + (lang==='en' ? 'The Chirurgus now serves the monastery.' : 'Chirurgus teď slouží klášteru.'), 'success');
        Game.addKronikaEntry('minor', '🩹 Chirurgus najat.', '🩹 Chirurgus hired.', '🩹 Chirurgus conductus est.');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.render();
    },

    // Denní kontrola týdenní mzdy Chirurga — samostatná od Conversi mzdový smyčky
    // (Chirurgus není v GameState.conversi, je externí Clientela kontakt).
    checkChirurgusWage: function() {
        if (!GameState.chirurgus || !GameState.chirurgus.hired) return;
        if (Date.now() < GameState.chirurgus.nextWage) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const due = 3 + (GameState.chirurgus.wageOwed || 0);
        const grose = (typeof CellariumSystem !== 'undefined') ? CellariumSystem.getGrose() : 0;
        if (grose >= due) {
            CellariumSystem.addGrose(-due);
            GameState.chirurgus.wageOwed = 0;
            UI.notifyPanel('💰 ' + (lang==='en' ? 'Chirurgus paid: '+due+' g.' : 'Chirurgus vyplacen: '+due+' g.'), 'system');
        } else {
            GameState.chirurgus.hired = false;
            GameState.chirurgus.wageOwed = 0;
            UI.notifyPanel('🚪 ' + (lang==='en' ? 'The Chirurgus left, unpaid.' : 'Chirurgus odešel, neplacen.'), 'warning');
            Game.addKronikaEntry('minor', '🚪 Chirurgus opustil klášter, neplacen.', '🚪 The Chirurgus left the monastery, unpaid.', '');
        }
        GameState.chirurgus.nextWage = Date.now() + 7 * 24 * 60 * 60 * 1000;
        Game.save();
    },

    // Flebotomie — pouštění žilou. Homo Signorum: nebezpečnej den = úplněk NEBO
    // měsíc ve vodním znamení (Rak/Štír/Ryby — přebytek vlhkosti). Cooldown 21
    // dní/osobu (dobově 4-5×/rok = zhruba jednou za ~10 týdnů, 21 dní je spodní hranice).
    performFlebotomie: function(entityId, isBrother) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.chirurgus || !GameState.chirurgus.hired) {
            UI.notify(lang==='en' ? 'No Chirurgus hired.' : 'Chirurgus není najatej.', true); return;
        }
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (!entity) return;
        const now = Date.now();
        const COOLDOWN = 21 * 24 * 60 * 60 * 1000;
        if (entity.lastFlebotomie && now - entity.lastFlebotomie < COOLDOWN) {
            const daysLeft = Math.ceil((COOLDOWN - (now - entity.lastFlebotomie)) / (24*60*60*1000));
            UI.notify(lang==='en' ? 'Too soon — '+daysLeft+'d until safe again.' : 'Ještě brzy — bezpečný za '+daysLeft+' d.', true); return;
        }
        const d = new Date();
        const moonPhase = (typeof CalendarSystem !== 'undefined') ? CalendarSystem.getLunarForDay(d.getFullYear(), d.getMonth()+1, d.getDate()) : '🌗';
        const zodiacIdx = (typeof CalendarSystem !== 'undefined' && CalendarSystem.getZodiacForMoonDay) ? CalendarSystem.getZodiacForMoonDay(d.getFullYear(), d.getMonth()+1, d.getDate()) : 0;
        const zodiac = (typeof CalendarSystem !== 'undefined' && CalendarSystem.ZODIAC_SIGNS) ? CalendarSystem.ZODIAC_SIGNS[zodiacIdx] : null;
        const zodiacUnsafe = (typeof CalendarSystem !== 'undefined' && CalendarSystem.ZODIAC_UNSAFE_IDX) ? CalendarSystem.ZODIAC_UNSAFE_IDX.includes(zodiacIdx) : false;
        const unsafe = moonPhase === '🌕' || zodiacUnsafe;
        const zodiacName = zodiac ? (lang==='en' ? zodiac.en : zodiac.cs) : '';
        const bodyPart = zodiac ? (lang==='en' ? zodiac.bodyPart_en : zodiac.bodyPart_cs) : '';
        entity.lastFlebotomie = now;
        if (unsafe) {
            entity.fatigue = Math.min(100, (entity.fatigue || 0) + 15);
            UI.notifyPanel((zodiac ? zodiac.icon : '🌕') + ' ' + (lang==='en'
                ? entity.name+' was bled under '+zodiacName+' ('+bodyPart+') — worse for it.'
                : entity.name+' pouštěn žilou ve znamení '+zodiacName+' ('+bodyPart+') — na škodu.'), 'warning');
        } else {
            entity.fatigue = Math.max(0, (entity.fatigue || 0) - 15);
            UI.notifyPanel('🩸 ' + (lang==='en'
                ? entity.name+' was bled under '+zodiacName+' — fatigue eased.'
                : entity.name+' pouštěn žilou ve znamení '+zodiacName+' — únava ulevena.'), 'success');
        }
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
    },

    hireFamulus: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.conversi) GameState.conversi = [];
        if (!GameState.researchedTechs || !GameState.researchedTechs.includes('tech_magister')) {
            UI.notify(lang==='en' ? 'Requires the Magister tech.' : 'Vyžaduje tech Magister.', true); return;
        }
        const cap = this.conversiCapacity();
        if (GameState.conversi.length >= cap) {
            UI.notify(lang==='en' ? 'No free beds in the Domus.' : 'V Domu není volné lůžko.', true); return;
        }
        const usedNames = GameState.conversi.map(k => k.name);
        const available = this.KONVRS_NAMES.filter(n => !usedNames.includes(n));
        const pool = available.length ? available : this.KONVRS_NAMES;
        const name = pool[Math.floor(Math.random() * pool.length)];
        const famulus = { id: 'famulus_' + Date.now(), rosterId: null, name: name, type: 'famulus', hiredAt: Date.now(), fatigue: 0, mood: 60, wageOwed: 0 };
        GameState.conversi.push(famulus);
        UI.notifyPanel('💼 ' + (lang==='en' ? name+' has joined as a famulus — a seasonal hand.' : name+' se připojil jako famulus — sezónní síla.'), 'success');
        Game.addKronikaEntry('minor', '💼 '+name+' najat jako famulus.', '💼 '+name+' hired as a famulus.', '💼 '+name+' famulus conductus est.');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
    },

    // Oblát — dítě/mladík vstupující do kláštera, dozrává na konvrše po 30
    // reálných dnech (_checkOblatMaturation, denní tick). Bez mzdy do dozrání.
    hireOblat: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.conversi) GameState.conversi = [];
        if (!GameState.researchedTechs || !GameState.researchedTechs.includes('tech_magister')) {
            UI.notify(lang==='en' ? 'Requires the Magister tech.' : 'Vyžaduje tech Magister.', true); return;
        }
        const cap = this.conversiCapacity();
        if (GameState.conversi.length >= cap) {
            UI.notify(lang==='en' ? 'No free beds in the Domus.' : 'V Domu není volné lůžko.', true); return;
        }
        if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 5) {
            UI.notify(lang==='en' ? 'Not enough groats.' : 'Nedostatek grošů.', true); return;
        }
        const usedNames = GameState.conversi.map(k => k.name);
        const available = this.KONVRS_NAMES.filter(n => !usedNames.includes(n));
        const pool = available.length ? available : this.KONVRS_NAMES;
        const name = pool[Math.floor(Math.random() * pool.length)];
        CellariumSystem.addGrose(-5);
        const oblat = { id: 'oblat_' + Date.now(), rosterId: null, name: name, type: 'oblat', hiredAt: Date.now(), fatigue: 0, mood: 60, matureAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
        GameState.conversi.push(oblat);
        UI.notifyPanel('🌱 ' + (lang==='en' ? name+' has been taken in as an oblate.' : name+' byl přijat jako oblát.'), 'success');
        Game.addKronikaEntry('minor', '🌱 '+name+' přijat jako oblát.', '🌱 '+name+' taken in as an oblate.', '🌱 '+name+' oblatus susceptus est.');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
    },

    // Denní kontrola dozrání obláta na konvrše — volat z denního ticku.
    _checkOblatMaturation: function() {
        if (!GameState.conversi) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        GameState.conversi.forEach(k => {
            if (k.type !== 'oblat' || !k.matureAt || k.matureAt > now) return;
            k.type = null;
            delete k.matureAt;
            if (typeof k.loyalty !== 'number') k.loyalty = 30;
            if (typeof k.wageOwed !== 'number') k.wageOwed = 0;
            UI.notifyPanel('✝️ ' + (lang==='en' ? k.name+' has matured into a full lay brother.' : k.name+' dozrál na plnýho konvrše.'), 'success');
            Game.addKronikaEntry('minor', '✝️ '+k.name+' dozrál z obláta na konvrše.', '✝️ '+k.name+' has matured from oblate to lay brother.', '✝️ '+k.name+' conversus factus est.');
        });
        Game.save();
    },

    hireKonvrs: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.conversi) GameState.conversi = [];
        const cap = this.conversiCapacity();
        if (cap === 0) {
            UI.notify(lang==='en' ? 'Build Domus Conversorum first.' : 'Nejprve postav Domus Conversorum.', true); return;
        }
        if (GameState.conversi.length >= cap) {
            UI.notify(lang==='en' ? 'No free beds in the Domus.' : 'V Domu není volné lůžko.', true); return;
        }
        const monasticOk = ['frater', 'armarius', 'prior'].includes(GameState.rank && GameState.rank.monastic);
        if (!monasticOk) {
            UI.notify(lang==='en' ? 'Requires the rank of Frater or higher.' : 'Vyžaduje hodnost Frater nebo vyšší.', true); return;
        }
        const village = (GameState.persona && GameState.persona.influence && GameState.persona.influence.village) || 0;
        if (village < 15) {
            UI.notify(lang==='en' ? 'Not enough standing with the village.' : 'Nedostatečná vážnost u vesnice.', true); return;
        }
        if ((typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) < 10) {
            UI.notify(lang==='en' ? 'Not enough groats.' : 'Nedostatek grošů.', true); return;
        }

        // Nábor z rosteru (ConversiRosterDB); fallback na KONVRS_NAMES, pokud roster nedostupný.
        // Náklady se strhávají až PO výběru kandidáta — odmítnutí (tenze) je zdarma.
        let rosterId = null, name, hireQuote = '';
        const rosterOk = (typeof ConversiRosterDB !== 'undefined') && Object.keys(ConversiRosterDB).length > 0;
        if (rosterOk) {
            const hiredIds = GameState.conversi.map(k => k.rosterId).filter(Boolean);
            const availIds = Object.keys(ConversiRosterDB).filter(rid => !hiredIds.includes(rid));
            const poolIds = availIds.length ? availIds : Object.keys(ConversiRosterDB);
            rosterId = poolIds[Math.floor(Math.random() * poolIds.length)];
            const rec = ConversiRosterDB[rosterId];
            name = rec.name;

            // Tenze s někým už najatým → kandidát odmítne (deterministicky), bez nákladů
            if (typeof ConversiBondsDB !== 'undefined') {
                const enemyBond = ConversiBondsDB.find(bd => bd.type === 'tension' &&
                    ((bd.a === rosterId && hiredIds.includes(bd.b)) ||
                     (bd.b === rosterId && hiredIds.includes(bd.a))));
                if (enemyBond) {
                    const enemyId = (enemyBond.a === rosterId) ? enemyBond.b : enemyBond.a;
                    const enemyName = (ConversiRosterDB[enemyId] && ConversiRosterDB[enemyId].name) || '?';
                    const rq = rec.quotes && rec.quotes.refuse;
                    const refuseQuote = rq ? (lang === 'en' ? rq.en : rq.cs) : '';
                    UI.notifyPanel('🚫 ' + (lang==='en'
                        ? name + ' refuses to join while ' + enemyName + ' lives here.'
                        : name + ' odmítá vstoupit, dokud tu žije ' + enemyName + '.')
                        + (refuseQuote ? ' „' + refuseQuote + '“' : ''), 'warning');
                    Game.addKronikaEntry('minor',
                        '🚫 ' + name + ' odmítl vstoupit do kláštera — nevychází s bratrem jménem ' + enemyName + '.',
                        '🚫 ' + name + ' refused to join the monastery — he does not get along with brother ' + enemyName + '.',
                        '🚫 ' + name + ' intrare recusavit.'
                    );
                    return;
                }
            }

            const hq = rec.quotes && rec.quotes.hire;
            if (hq) hireQuote = (lang === 'en' ? hq.en : hq.cs);
        } else {
            const usedNames = GameState.conversi.map(k => k.name);
            const available = this.KONVRS_NAMES.filter(n => !usedNames.includes(n));
            const pool = available.length ? available : this.KONVRS_NAMES;
            name = pool[Math.floor(Math.random() * pool.length)];
        }

        GameState.persona.influence.village -= 15;
        CellariumSystem.addGrose(-10);

        const konvrs = { id: 'konvrs_' + Date.now(), rosterId, name, hiredAt: Date.now(), fatigue: 0 };
        GameState.conversi.push(konvrs);

        UI.notifyPanel('✝️ ' + (lang==='en' ? name+' has joined as a lay brother.' : name+' se připojil jako konvrš.') + (hireQuote ? ' „' + hireQuote + '“' : ''), 'success');
        Game.addKronikaEntry('important',
            '✝️ ' + name + ' se připojil ke klášteru jako konvrš.',
            '✝️ ' + name + ' has joined the monastery as a lay brother.',
            '✝️ ' + name + ' conversus factus est.'
        );
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern');
    },

    // Officium — konvrši nedostupní mezi Laudes (6:00) a Prima (9:00), reálný čas
    isOfficiumHours: function() {
        const h = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour() : new Date().getHours();
        return h >= 6 && h < 9;
    },

    // Denní režim (Regula): blok dne podle Europe/Prague (ne lokální čas zařízení hráče)
    conversiDayBlock: function() {
        const h = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour() : new Date().getHours();
        if (h >= 6 && h < 9)   return 'officium'; // modlitba
        if (h >= 12 && h < 13) return 'lunch';    // oběd v refektáři
        if (h >= 18 && h < 19) return 'vespers';  // nešpory
        if (h >= 22 || h < 5)  return 'night';    // spánek
        return 'work';
    },

    // Refektář: prostá strava, priorita od nejlevnější; luxus (koláče, pečeně) se NIKDY nebere
    REFECTORY_FOODS: ['spring_herb_porridge', 'famine_bread', 'burdock_root_baked', 'berries', 'mushroom', 'bread', 'mushroom_soup', 'cooked_fish', 'cooked_meat', 'stew'],

    _runRefectory: function() {
        const lastMeal = GameState.conversiLastMeal || 0;
        if (Date.now() - lastMeal < 24 * 60 * 60 * 1000) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const inv = GameState.inventory || {};
        // V2: nádobí = kapacita (nespotřebovává se). Sklo/keramika = plný efekt, dřevo = základ, bez nádobí = minimum.
        const TABLE_GLASS = ['glass_goblet','glass_tankard','glass_jug','glass_bowl','glass_pitcher'];
        const glassCap = TABLE_GLASS.reduce((s, id) => s + (inv[id] || 0), 0);
        const woodCap  = inv['wooden_bowl'] || 0;
        const fed = [], unfed = [];
        const dish = { glass: 0, wood: 0, none: 0 };
        let servedIdx = 0;
        GameState.conversi.forEach(k => {
            const foodId = this.REFECTORY_FOODS.find(f => (inv[f] || 0) > 0);
            if (foodId) {
                inv[foodId] -= 1;
                if (servedIdx < glassCap) {
                    k.fatigue = Math.max(0, k.fatigue - 10);
                    k.mood = Math.min(100, k.mood + 3);
                    dish.glass++;
                } else if (servedIdx < glassCap + woodCap) {
                    k.fatigue = Math.max(0, k.fatigue - 5);
                    k.mood = Math.min(100, k.mood + 2);
                    dish.wood++;
                } else {
                    k.fatigue = Math.max(0, k.fatigue - 3);
                    dish.none++;
                }
                servedIdx++;
                fed.push(k.name);
            } else {
                k.mood = Math.max(0, k.mood - 8);
                k.loyalty = Math.max(0, k.loyalty - 2);
                unfed.push(k.name);
            }
        });
        GameState.conversiMealLog = { ts: Date.now(), fed: fed, unfed: unfed, dish: dish };
        GameState.conversiLastMeal = Date.now();
        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            if (unfed.length === 0) {
                const handNote = dish.none > 0 ? (lang==='en' ? ' Some ate from their hands — dishes are short.' : ' Část jedla z ruky — nádobí nestačí.') : '';
                UI.notifyPanel('🍲 ' + (lang==='en' ? 'The refectory served all the brothers.' : 'Refektář nasytil všechny bratry.') + handNote, dish.none > 0 ? 'warning' : 'success');
            } else {
                UI.notifyPanel('🍲 ' + (lang==='en'
                    ? 'The refectory is short of food — hungry: ' + unfed.join(', ')
                    : 'V refektáři nebylo dost jídla — hladoví: ' + unfed.join(', ')), 'warning');
            }
        }
        Game.addKronikaEntry('minor',
            unfed.length === 0 ? '🍲 Refektář: všichni bratři nasyceni.' : '🍲 Refektář: nedostatek jídla, hladoví — ' + unfed.join(', ') + '.',
            unfed.length === 0 ? '🍲 Refectory: all brothers fed.' : '🍲 Refectory: food shortage, hungry — ' + unfed.join(', ') + '.',
            unfed.length === 0 ? '🍲 Refectorium: omnes saturati.' : '🍲 Refectorium: fames.');
        Game.save();
    },

    // Traity konvrše z rosteru (fallback prázdné pole)
    _konvrsTraits: function(k) {
        if (!k || !k.rosterId || typeof ConversiRosterDB === 'undefined') return [];
        const rec = ConversiRosterDB[k.rosterId];
        return (rec && rec.traits) ? rec.traits : [];
    },

    // Kapitula — týdenní shromáždění konvršů: konflikt (tenze) / bonus (svornost) / ticho
    _runKapitula: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const list = GameState.conversi || [];
        const hiredIds = list.map(k => k.rosterId).filter(Boolean);

        // Aktivní tenze: oba z páru najatí
        let conflict = null;
        if (typeof ConversiBondsDB !== 'undefined') {
            const bond = ConversiBondsDB.find(bd => bd.type === 'tension' && hiredIds.includes(bd.a) && hiredIds.includes(bd.b));
            if (bond) {
                const ka = list.find(k => k.rosterId === bond.a);
                const kb = list.find(k => k.rosterId === bond.b);
                if (ka && kb) conflict = { bond, ka, kb };
            }
        }

        if (conflict) {
            const { bond, ka, kb } = conflict;
            // Napětí v komunitě — i bratři v Dormitoriu ho cítí, ne jen dva
            // konvrši v konfliktu. Malý plošný bump, nezávislý na volbě řešení.
            (GameState.dormitorium && GameState.dormitorium.brothers || []).forEach(b => {
                if (b.assignedTab) b.stress = Math.min(100, (b.stress || 0) + 5);
            });
            // Bestiář: první reálný konflikt na Kapitule odemkne Titivillovu
            // "druhou tvář" — týž démon, tentokrát poslouchající klevety
            // místo opisovačských chyb. unlockFolioById je idempotentní.
            if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_titivillus_secunda');
            // Viník = nižší loajalita; druhý = poškozený
            const victim = (ka.loyalty <= kb.loyalty) ? ka : kb;
            const other  = (victim === ka) ? kb : ka;
            const bondText = lang === 'en' ? bond.desc_en : bond.desc_cs;
            const rerender = () => { if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(GameState.ui.saeculumEntity || 'tavern'); };
            NotificationSystem.modal({
                icon: '⚖️',
                title: (lang==='en' ? 'Chapter — a dispute among the brothers' : 'Kapitula — spor mezi bratry'),
                text: `<div style="font-size:0.82rem; line-height:1.45;"><strong>${ka.name}</strong> × <strong>${kb.name}</strong><br><span style="opacity:0.75; font-style:italic;">${bondText}</span><br><br>${lang==='en'?'The chapter awaits your judgement.':'Kapitula čeká na tvůj soud.'}</div>`,
                choices: [
                    { label: (lang==='en'?'🕊️ Reconcile them':'🕊️ Rozsoudit smírně'), effect: () => {
                        ka.mood = Math.min(100, ka.mood + 5);
                        kb.mood = Math.min(100, kb.mood + 5);
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
                        Game.addKronikaEntry('minor',
                            '⚖️ Kapitula: spor mezi bratry ' + ka.name + ' a ' + kb.name + ' urovnán smírem.',
                            '⚖️ Chapter: the dispute between ' + ka.name + ' and ' + kb.name + ' was settled peacefully.',
                            '⚖️ Capitulum: lis composita est.');
                        Game.save(); rerender();
                    }},
                    { label: (lang==='en'?'⚖️ Impose penance on '+victim.name:'⚖️ Uložit Pokání — '+victim.name), type: 'danger', effect: () => {
                        victim.penanceUntil = Date.now() + 2 * 24 * 60 * 60 * 1000;
                        victim.loyalty = Math.max(0, victim.loyalty - 5);
                        other.mood = Math.min(100, other.mood + 8);
                        UI.notifyPanel('⚖️ ' + (lang==='en' ? victim.name+' was given two days of penance.' : victim.name+' dostal dva dny Pokání.'), 'warning');
                        Game.addKronikaEntry('important',
                            '⚖️ Kapitula: bratr ' + victim.name + ' dostal dva dny Pokání za spor s bratrem jménem ' + other.name + '.',
                            '⚖️ Chapter: brother ' + victim.name + ' received two days of penance over the dispute with brother ' + other.name + '.',
                            '⚖️ Capitulum: ' + victim.name + ' poenitentiam accepit.');
                        Game.save(); rerender();
                    }},
                    { label: (lang==='en'?'🤐 Let it be':'🤐 Nechat být'), effect: () => {
                        ka.mood = Math.max(0, ka.mood - 5);
                        kb.mood = Math.max(0, kb.mood - 5);
                        Game.addKronikaEntry('minor',
                            '⚖️ Kapitula: spor mezi bratry zůstal nevyřešen. Hnisá dál.',
                            '⚖️ Chapter: the dispute among the brothers remains unresolved. It festers on.',
                            '⚖️ Capitulum: lis manet.');
                        Game.save(); rerender();
                    }}
                ]
            });
            return;
        }

        // Bez konfliktu: svorná parta (průměrný mood ≥ 65) → bonus
        const avgMood = list.reduce((s, k) => s + (k.mood || 60), 0) / list.length;
        if (avgMood >= 65) {
            list.forEach(k => {
                k.fatigue = Math.max(0, k.fatigue - 5);
                k.mood = Math.min(100, k.mood + 3);
            });
            // Zrcadlí úlevu i pro bratry — jediná odventilovací chvíle pro Stress,
            // který jinak jen roste (fatigue/konflikt/ztráta parťáka).
            (GameState.dormitorium && GameState.dormitorium.brothers || []).forEach(b => {
                if (b.assignedTab) b.stress = Math.max(0, (b.stress || 0) - 5);
            });
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                UI.notifyPanel('⚖️ ' + (lang==='en' ? 'The chapter passed in peace and concord. The brothers work with lighter hearts.' : 'Kapitula proběhla v pokoji a svornosti. Bratři pracují s lehčím srdcem.'), 'success');
            }
            Game.addKronikaEntry('minor',
                '⚖️ Kapitula proběhla v pokoji a svornosti.',
                '⚖️ The chapter passed in peace and concord.',
                '⚖️ Capitulum in pace actum est.');
        } else {
            Game.addKronikaEntry('minor',
                '⚖️ Kapitula proběhla bez zvláštních událostí.',
                '⚖️ The chapter passed without notable events.',
                '⚖️ Capitulum sine eventu.');
        }
    },

    // ═══════════════════════════════════════════════════════════════════
    // MANUFAKTURA — dashboard vrstva nad Dormitorium/Conversi produkcí.
    // Nemění žádnou výnosovou logiku uvnitř checkConversiChores() —
    // manufacturaCollect() jen dočasně odemkne 24h gate pro JEDEN tab
    // a zavolá existující funkci beze změny. dvur nemá pole (údržba —
    // úklid/krmení po jednotlivých chlévech, ne jednorázový sběr).
    // athanor/scriptorium nejsou v CONVERSI_TASKS — jen bratr, bez konvrše.
    // ═══════════════════════════════════════════════════════════════════
    MANUFACTURA_LASTTICK_FIELD: {
        zahony:      'conversiGardenLastTick',
        sad:         'conversiOrchardLastTick',
        apiarium:    'conversiApiaryLastTick',
        piscina:     'conversiPiscinaLastTick',
        pole:        'conversiFieldLastTick',
        vinohrad:    'conversiVineaLastTick',
        athanor:     'conversiAthanorLastTick',
        scriptorium: 'conversiScriptoriumLastTick',
    },

    manufacturaCollect: function(tabKey) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const field = this.MANUFACTURA_LASTTICK_FIELD[tabKey];
        if (!field) return; // dvur — údržba, nic ke collectu
        const DAY = 24 * 60 * 60 * 1000;
        const last = GameState[field] || 0;
        if (Date.now() - last < DAY) {
            UI.notify(lang === 'en' ? '⏳ Not ready yet.' : '⏳ Ještě není připraveno.', true);
            return;
        }
        GameState[field] = 0; // odemkne gate — checkConversiChores tenhle tab zpracuje beze změny
        this.checkConversiChores(tabKey);
        Game.save();
        // checkConversiChores(tabKey) teď zpracuje JEN tenhle jeden tab
        // (onlyTab parametr) — ostatní ready taby zůstanou nedotčené, dokud
        // je hráč sám nesebere. Verifikace zůstává jako pojistka (např. build
        // chybí nebo nikdo nepracuje → LastTick zůstane na 0, nic se nestalo).
        if (GameState[field] > 0) {
            UI.notify(lang === 'en' ? '🧺 Collected.' : '🧺 Sebráno.', false);
        } else {
            UI.notify(lang === 'en'
                ? 'ℹ️ Nothing collected — check that someone is assigned and working here.'
                : 'ℹ️ Nic nesebráno — zkontroluj, že tam někdo je přiřazený a pracuje.', true);
        }
        // switchEntity() cílilo přímo na #cellarium-content, ale nad ním je
        // v shell.html obalový #home-cellarium-content s vlastním dirty-flag
        // systémem — bez nastavení UI._dirty.cellarium se refresh nepromítne
        // hned (musel se počkat na nějaký JINÝ trigger, odtud dojem "funguje
        // až na druhý klik"). Přepojeno na stejný ověřený vzor jako well.js.
        if (typeof UI !== 'undefined') {
            if (!UI._dirty) UI._dirty = {};
            UI._dirty.cellarium = true;
            UI.renderAll();
        }
    },

    // Jen čte, nic nemění. Pro dashboard kartu jednoho tabu.
    manufacturaStatus: function(tabKey) {
        const DAY = 24 * 60 * 60 * 1000;
        const field = this.MANUFACTURA_LASTTICK_FIELD[tabKey];
        // Hřbitov nemá vlastní bratr-specializaci — dohlíží na něj stejný
        // Kostelník jako na kostel (jeden bratr, celý Templum). XP/level se
        // proto čte pod 'kostel', ne pod 'hrbitov'.
        const brotherTabKey = tabKey === 'hrbitov' ? 'kostel' : tabKey;
        const brother = (GameState.dormitorium && GameState.dormitorium.brothers || []).find(b => b.assignedTab === brotherTabKey);
        const konvrs = (GameState.conversi || []).find(k => k.task === tabKey);
        let ready = false, hoursLeft = null;
        if (field) {
            const elapsed = Date.now() - (GameState[field] || 0);
            ready = elapsed >= DAY;
            hoursLeft = ready ? 0 : Math.ceil((DAY - elapsed) / 3600000);
        }
        return {
            tabKey, brother, konvrs, hasField: !!field, ready, hoursLeft,
            level: brother ? this.dormitoriumBrotherLevel(brother, brotherTabKey) : null,
            mult:  brother ? this.dormitoriumBrotherMult(brother, brotherTabKey) : null,
            xp:    brother ? ((brother.xp && brother.xp[brotherTabKey]) || 0) : null,
            combo: !!(brother && konvrs),
        };
    },

    // onlyTab — volitelné, pro izolovaný manuální Collect (Manufaktura).
    // Bez argumentu (automatický tick na pozadí) běží přesně jako dřív —
    // zpracuje všech 9 tabů. S argumentem přeskočí všechny ostatní.
    // ── Valetudo pro Conversi/Dormitorium ────────────────────────────────
    // Task/tab → nemoci, na které je ta práce riziková (skupina C).
    NPC_HEALTH_RISK: {
        zahony: 'cold', sad: 'cold', pole: 'cold', vinohrad: 'cold',
        apiarium: 'cold', piscina: 'cold',
        dvur: 'lice', hrbitov: 'lice',
        kostel: 'rheumatism',
        athanor: 'eye_strain', scriptorium: 'eye_strain',
    },
    // Sdílený zdroj (skupina B) — voda/úplavice škálují s GameState.well.purity
    // (stejný signál jako hráčova mouchová/nemocná mechanika ve WellSystem);
    // Oheň sv. Antonína/Kurděje zůstávají plochá aproximace (žádný centrální
    // čítač kvality žita/ovoce po ruce).
    NPC_SHARED_RISK: ['water_sickness', 'dysentery', 'ergot_fire', 'scurvy'],
    // Nákazlivé (skupina A) — šíří se uvnitř vlastního poolu (conversi mezi
    // sebou / bratři mezi sebou), sdílený dormitář a nářadí.
    NPC_CONTAGIOUS: ['scabies', 'lice'],

    _npcHealthTick: function() {
        const conversi = GameState.conversi || [];
        const brothers = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
        const month = new Date().getMonth() + 1;
        const isSummer = month >= 5 && month <= 9;
        const isWinter = month === 12 || month <= 2;
        const isLateWinter = month === 2 || month === 3; // shodné s hráčovým healthConditionsDailyTick
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        const applyTick = (entity, isBrother) => {
            if (!entity.conditions) entity.conditions = {};
            Object.keys(entity.conditions).forEach(id => {
                const inst = entity.conditions[id];
                const def = HealthConditionsDB[id];
                if (!def || !inst) { delete entity.conditions[id]; return; }
                if (Date.now() >= inst.expiresAt) {
                    delete entity.conditions[id];
                    // Oheň sv. Antonína — jediná neduhová (bez léku), vzácná a nebezpečná;
                    // jediný spouštěč úmrtí NPC. Infirmarium teď vnáší modifikátor
                    // podle kvality péče — viz _checkErgotDeath/infirmariumCareModifier.
                    if (id === 'ergot_fire') this._checkErgotDeath(entity, isBrother);
                    // Uzdraven — pokud byl v péči Infirmaria a už nemá žádný neduh, propustit.
                    if (entity.admittedToInfirmarium && !Object.keys(entity.conditions).length) {
                        entity.admittedToInfirmarium = false;
                        if (GameState.infirmarium) {
                            GameState.infirmarium.patients = (GameState.infirmarium.patients || []).filter(p => p.entityId !== entity.id);
                        }
                    }
                    return;
                }
                // Denní tick = 24h najednou; NPC tlumeněji než hráč (0.3×),
                // ať se nerozpadnou po jednom dni smůly.
                // V péči Infirmaria (lůžko, teplo, strava) se dopad neduhu tlumí na polovinu.
                const careHalf = entity.admittedToInfirmarium ? 0.5 : 1;
                if (def.tickHour && typeof def.tickHour.fatigue === 'number') {
                    entity.fatigue = Math.min(100, (entity.fatigue || 0) + def.tickHour.fatigue * 24 * 0.3 * careHalf);
                }
                if (def.tickHour && typeof def.tickHour.satiety === 'number' && typeof entity.mood === 'number') {
                    entity.mood = Math.max(0, entity.mood - Math.abs(def.tickHour.satiety) * 24 * 0.1 * careHalf);
                }
            });
        };

        const tryInfect = (entity, id, chance) => {
            if (!entity.conditions) entity.conditions = {};
            if (entity.conditions[id]) return false;
            if (Math.random() >= chance) return false;
            const def = HealthConditionsDB[id];
            if (!def) return false;
            entity.conditions[id] = { startedAt: Date.now(), expiresAt: Date.now() + def.durationHours * 3600000 };
            if (def.onApply) {
                if (typeof def.onApply.fatigue === 'number') entity.fatigue = Math.min(100, (entity.fatigue || 0) + def.onApply.fatigue);
                if (typeof def.onApply.satiety === 'number' && typeof entity.mood === 'number') entity.mood = Math.max(0, entity.mood + def.onApply.satiety * 0.5);
            }
            const name = lang === 'en' ? def.name_en : def.name;
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                UI.notifyPanel('🤒 ' + entity.name + ' — ' + name + '.', 'warning');
            }
            return true;
        };

        [conversi, brothers].forEach(pool => {
            // Nákaza — pokud už v poolu někdo aktivní má, ostatní mají zvýšené riziko.
            this.NPC_CONTAGIOUS.forEach(id => {
                const infected = pool.filter(e => e.conditions && e.conditions[id]).length;
                pool.forEach(entity => {
                    applyTick(entity, pool === brothers);
                    const task = entity.task || entity.assignedTab;
                    const taskRisk = this.NPC_HEALTH_RISK[task] === id ? 0.02 : 0;
                    // Svrab nemá task-vazbu (na rozdíl od Vší/dvur) — "sdílený
                    // dormitář a nářadí" platí pro kohokoliv aktivního v poolu,
                    // proto malá základní šance, ne jen nákaza od nuly nikdy nevznikne.
                    const baseline = (id === 'scabies' && task) ? 0.004 : 0;
                    const contagionBonus = infected > 0 && !entity.conditions[id] ? 0.03 * infected : 0;
                    tryInfect(entity, id, Math.min(0.25, taskRisk + baseline + contagionBonus));
                });
            });
        });

        // Ostatní task-vázané (skupina C) — mimo nákazlivé, řešené výš
        [...conversi, ...brothers].forEach(entity => {
            const task = entity.task || entity.assignedTab;
            if (!task) return;
            const riskId = this.NPC_HEALTH_RISK[task];
            if (riskId && !this.NPC_CONTAGIOUS.includes(riskId)) {
                let chance = 0.02;
                if (riskId === 'cold' && isWinter) chance = 0.04;
                tryInfect(entity, riskId, chance);
            }
            if (task === 'apiarium' || task === 'piscina') {
                if (isSummer) tryInfect(entity, 'mosquito_bites', 0.03);
            }
            if (task === 'scriptorium') {
                tryInfect(entity, 'writers_cramp', 0.015);
                tryInfect(entity, 'saturnismus', 0.008);
                tryInfect(entity, 'acedia', 0.01);
            }
            if (task === 'piscina') tryInfect(entity, 'ague', isSummer ? 0.02 : 0.01);
        });

        // Nespavost — jen konvrši, zvýšená pokud je v partě 'chrapoun'.
        const snorerPresent = conversi.some(k => this._konvrsTraits(k).includes('chrapoun'));
        conversi.forEach(k => {
            tryInfect(k, 'insomnia', snorerPresent ? 0.05 : 0.015);
        });

        // Dna — hráč to sleduje přes goutLog (jednotlivé konzumace), NPC
        // jednotlivě nejedí — proxy: jsou-li klášterní zásoby masa/vína
        // aktuálně bohaté, hodovalo se, riziko roste. Sdílí GOUT_*_ITEMS
        // seznam z VigorSystem, ať to není nezávislé číslo.
        {
            let meatStock = 0, wineStock = 0;
            if (typeof VigorSystem !== 'undefined') {
                (VigorSystem.GOUT_MEAT_ITEMS || []).forEach(id => { meatStock += (GameState.inventory[id] || 0); });
                (VigorSystem.GOUT_WINE_ITEMS || []).forEach(id => { wineStock += (GameState.inventory[id] || 0); });
            }
            const feasting = meatStock >= 10 && wineStock >= 5;
            [...conversi, ...brothers].forEach(entity => {
                tryInfect(entity, 'gout', feasting ? 0.03 : 0.005);
            });
        }

        // Sdílený zdroj (skupina B) — voda/úplavice škálují s purity studny.
        const wellPurity = (GameState.well && typeof GameState.well.purity === 'number') ? GameState.well.purity : 100;
        const fruitStock = (GameState.inventory['berries'] || 0) + (GameState.inventory['dried_wild_fruit'] || 0)
            + (GameState.inventory['apple'] || 0) + (GameState.inventory['pear'] || 0);
        [...conversi, ...brothers].forEach(entity => {
            const task = entity.task || entity.assignedTab;
            if (!task) return;
            const id = this.NPC_SHARED_RISK[Math.floor(Math.random() * this.NPC_SHARED_RISK.length)];
            // Kurděje: shodné okno s hráčem (pozdní zima + sklad ovoce <3 ks — sdílené
            // zásoby, funguje 1:1 i pro NPC na rozdíl od gutu, viz níž).
            if (id === 'scurvy' && (!isLateWinter || fruitStock >= 3)) return;
            let chance = 0.008;
            if (id === 'water_sickness' || id === 'dysentery') {
                chance = wellPurity < 30 ? 0.02 : wellPurity < 70 ? 0.01 : 0.002;
                if (id === 'dysentery') chance *= 0.4; // těžší varianta, vzácnější
            }
            tryInfect(entity, id, chance);
        });

        Game.save();
    },

    // Riziko úmrtí na Oheň sv. Antonína — jediná neduhová bez léku (rare & dangerous).
    // Mnich má nižší riziko (teplo, lepší strava) než konvrš. Plochá čísla zatím —
    // Infirmarium (Medicus/Apothecarius péče) sem časem přidá modifikátor kvality.
    ERGOT_DEATH_CHANCE: { brother: 0.08, konvrs: 0.18 },

    _checkErgotDeath: function(entity, isBrother) {
        let chance = isBrother ? this.ERGOT_DEATH_CHANCE.brother : this.ERGOT_DEATH_CHANCE.konvrs;
        if (entity.admittedToInfirmarium) chance *= this.infirmariumCareModifier();
        if (Math.random() >= chance) return;
        this._npcDies(entity, isBrother, 'ergot_fire');
    },

    // Kvalita péče Infirmaria — násobitel (nižší = lepší) na death chance
    // a další budoucí healing výpočty. Tři sčítající se vrstvy:
    // (1) samotné lůžko/teplo/klid, (2) obsazení Servitor/Coquus/Balneator
    // (Hortulanus se nepočítá — ten krmí až budoucí Apothecarius řetěz),
    // (3) CHRONICON — komunita se už dřív rozhodla bdít nad nemocnými.
    infirmariumCareModifier: function() {
        let mod = 1.0;
        mod -= 0.15; // lůžko samo o sobě
        ['servitor', 'coquus', 'balneator'].forEach(taskId => {
            if ((GameState.conversi || []).some(k => k.task === taskId)) mod -= 0.10;
        });
        // Infirmarius (mnišský dohled) — jediná ze 4 mnišských rolí s funkcí zatím;
        // Medicus/Apothecarius/Capellanus jsou vědomej stub, čekají na diagnostiku/
        // produkční řetězec/zpověď v dalších sprintech.
        if ((GameState.dormitorium && GameState.dormitorium.brothers || []).some(b => b.assignedTab === 'infirmarium_infirmarius')) mod -= 0.10;
        if (GameState.flags && GameState.flags.chroniconPlagueBolstered) mod -= 0.10;
        return Math.max(0.2, mod); // floor — nikdy úplně zadarmo
    },

    // Přijetí nemocného mnicha/konvrše do Infirmaria — stahuje z práce,
    // výměnou za lepší šanci na uzdravení (viz infirmariumCareModifier).
    admitToInfirmarium: function(entityId, isBrother) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.infirmarium) GameState.infirmarium = { beds: 3, patients: [] };
        const inf = GameState.infirmarium;
        if (inf.patients.length >= inf.beds) {
            UI.notify(lang==='en' ? 'No free bed.' : 'Žádná volná postel.', true); return;
        }
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (!entity) return;
        if (!entity.conditions || !Object.keys(entity.conditions).length) {
            UI.notify(lang==='en' ? 'Nothing to treat.' : 'Není co léčit.', true); return;
        }
        if (entity.admittedToInfirmarium) return;
        entity.admittedToInfirmarium = true;
        entity.confessedThisStay = false;
        if (isBrother) entity.assignedTab = null; else entity.task = null;
        inf.patients.push({ entityId: entityId, isBrother: isBrother, admittedAt: Date.now() });
        UI.notifyPanel('🩺 ' + (lang==='en' ? entity.name+' admitted to the infirmary.' : entity.name+' přijat do Infirmaria.'), 'system');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
    },

    dischargeFromInfirmarium: function(entityId, isBrother) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.infirmarium) GameState.infirmarium = { beds: 3, patients: [] };
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (entity) entity.admittedToInfirmarium = false;
        GameState.infirmarium.patients = (GameState.infirmarium.patients || []).filter(p => p.entityId !== entityId);
        if (entity) UI.notifyPanel('🩺 ' + (lang==='en' ? entity.name+' discharged from the infirmary.' : entity.name+' propuštěn z Infirmaria.'), 'system');
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
    },

    // Apothecarius podá lék admitted pacientovi — spotřebuje 1× item z inventáře,
    // vyléčí přesně ten neduh, kterej ho v cures[] uvádí (viz health.js).
    // Bez přiřazenýho Apothecaria (mnišská role) tahle akce vůbec nejde spustit.
    administerCure: function(entityId, isBrother, itemId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === entityId);
        if (!entity || !entity.conditions) return;
        const hasApothecarius = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_apothecarius');
        if (!hasApothecarius) {
            UI.notify(lang==='en' ? 'No Apothecarius to prepare the dose.' : 'Není Apothecarius, kdo by dávku připravil.', true); return;
        }
        const conditionId = Object.keys(entity.conditions).find(id => {
            const def = HealthConditionsDB[id];
            return def && def.cures && def.cures.includes(itemId);
        });
        if (!conditionId) {
            UI.notify(lang==='en' ? 'This remedy does not match any ailment here.' : 'Tenhle lék na nic z toho nesedí.', true); return;
        }
        if ((GameState.inventory[itemId] || 0) < 1) {
            UI.notify(lang==='en' ? 'You have none of this in stock.' : 'Nemáš to na skladě.', true); return;
        }
        this.removeItem(itemId, 1);
        delete entity.conditions[conditionId];
        const condDef = HealthConditionsDB[conditionId];
        const condName = condDef ? (lang==='en' ? condDef.name_en : condDef.name) : conditionId;
        UI.notifyPanel('⚕️ ' + (lang==='en' ? entity.name+' cured of '+condName+'.' : entity.name+' vyléčen z '+condName+'.'), 'system');
        if (entity.admittedToInfirmarium && !Object.keys(entity.conditions).length) {
            entity.admittedToInfirmarium = false;
            if (GameState.infirmarium) {
                GameState.infirmarium.patients = (GameState.infirmarium.patients || []).filter(p => p.entityId !== entity.id);
            }
        }
        Game.save();
        if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.switchEntity(isBrother ? 'dormitorium' : 'conversi');
    },

    // Trvalé úmrtí — Rajský dvůr (vnitřní pohřebiště komunity), NE farní Hřbitov
    // (ten je jen pro farní rodiny přes parishEventTick — historicky odlišené prostory).
    // Okamžitá náhrada stejnou postavou z rosteru (Bouvard: "vlastní variace do rosteru").
    _npcDies: function(entity, isBrother, cause) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const name = entity.name;
        const rosterId = entity.rosterId || null;

        if (isBrother) {
            GameState.dormitorium.brothers = (GameState.dormitorium.brothers || []).filter(b => b !== entity);
        } else {
            GameState.conversi = (GameState.conversi || []).filter(k => k !== entity);
        }

        if (!GameState.rajskyDvur) GameState.rajskyDvur = { graves: [] };
        GameState.rajskyDvur.graves.push({ name: name, rosterId: rosterId, ts: Date.now(), cause: cause, wasBrother: isBrother });

        // Officium defunctorum — krátký komunitní stav, žádná nová role potřeba
        if (!GameState.flags) GameState.flags = {};
        GameState.flags.officiumDefunctorumUntil = Date.now() + 3 * 24 * 60 * 60 * 1000;

        UI.notifyPanel('☦️ ' + (lang==='en' ? name+' has died.' : name+' zemřel.'), 'warning');
        Game.addKronikaEntry('important',
            '☦️ ' + name + ' zemřel. Requiescat in pace.',
            '☦️ ' + name + ' has died. Requiescat in pace.',
            '☦️ Frater migravit ad Dominum.');

        if (isBrother) this._respawnBrother(rosterId); else this._respawnKonvrs(rosterId);
        Game.save();
    },

    _respawnBrother: function(rosterId) {
        if (!GameState.dormitorium) GameState.dormitorium = { brothers: [] };
        if (!GameState.dormitorium.brothers) GameState.dormitorium.brothers = [];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const rec = (rosterId && typeof DormitoriumRosterDB !== 'undefined') ? DormitoriumRosterDB[rosterId] : null;
        const name = rec ? rec.name : (lang === 'en' ? 'Brother' : 'Bratr');
        const brother = {
            id: 'brother_' + Date.now(), rosterId: rosterId, name: name, hiredAt: Date.now(),
            assignedTab: null, xp: {}, fatigue: 0, mood: 60, loyalty: 30, stress: 0, temptation: 0,
            traits: { piety: 0, obedience: 0, asceticism: 0, erudition: 0, focus: 0, craftsmanship: 0, eloquence: 0, vigor: 0 },
        };
        const rosterBonus = this.DORMITORIUM_ROSTER_TRAIT_BONUS[rosterId];
        if (rosterBonus) rosterBonus.forEach(key => { if (typeof brother.traits[key] === 'number') brother.traits[key] = Math.min(100, brother.traits[key] + 10); });
        GameState.dormitorium.brothers.push(brother);
        UI.notifyPanel('📿 ' + (lang==='en' ? name+' has taken his vows anew and joined the community.' : name+' znovu složil sliby a připojil se ke komunitě.'), 'success');
    },

    _respawnKonvrs: function(rosterId) {
        if (!GameState.conversi) GameState.conversi = [];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const rec = (rosterId && typeof ConversiRosterDB !== 'undefined') ? ConversiRosterDB[rosterId] : null;
        const name = rec ? rec.name : (lang === 'en' ? 'Lay brother' : 'Konvrš');
        const konvrs = { id: 'konvrs_' + Date.now(), rosterId: rosterId, name: name, hiredAt: Date.now(), fatigue: 0 };
        GameState.conversi.push(konvrs);
        UI.notifyPanel('✝️ ' + (lang==='en' ? name+' has taken his vows anew and joined the community.' : name+' znovu složil sliby a připojil se ke komunitě.'), 'success');
    },

    checkConversiChores: function(onlyTab) {
        // POZOR: dřív zde bylo `if (!GameState.conversi || length===0) return;`,
        // což při absenci JAKÉHOKOLIV konvrše zablokovalo i Dormitorium bratry
        // (ti fungují nezávisle na Conversi). Nahrazeno bezpečnou inicializací.
        if (!GameState.conversi) GameState.conversi = [];

        // Přehled práce za poslední tick — vyčistit na začátku, naplní ho
        // jednotlivé sekce (_reportWork) při odvedené práci.
        GameState.lastTickReport = [];

        // Migrace: sdílená conversiFatigue → per-konvrš fatigue (varianta A: rozdat hodnotu)
        const legacyFatigue = (typeof GameState.conversiFatigue === 'number') ? GameState.conversiFatigue : 0;
        GameState.conversi.forEach(k => {
            if (typeof k.fatigue !== 'number') k.fatigue = legacyFatigue;
            if (typeof k.mood !== 'number') k.mood = 60;
            if (typeof k.loyalty !== 'number') k.loyalty = 30;
            // Migrace: starý save bez rosterId → dohledat podle jména; mimo roster = null (běží dál bez hlášek)
            if (k.rosterId === undefined && typeof ConversiRosterDB !== 'undefined') {
                const rid = Object.keys(ConversiRosterDB).find(r => ConversiRosterDB[r].name === k.name);
                k.rosterId = rid || null;
            }
        });
        if (typeof GameState.conversiFatigue === 'number') delete GameState.conversiFatigue;

        // ── Mzda: 2 groše/konvrš, výplatní den 1×/7 reálných dní ──
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!GameState.conversiNextWage) GameState.conversiNextWage = Date.now() + WEEK; // první výplata za týden, žádný zpětný dluh
        if (Date.now() >= GameState.conversiNextWage && GameState.conversi.length > 0) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const leavers = [];
            let paidCount = 0, paidTotal = 0;
            GameState.conversi.forEach(k => {
                if (k.type === 'oblat') return; // dozrává, ještě nebere mzdu
                if (typeof k.wageOwed !== 'number') k.wageOwed = 0;
                const wageBase = k.type === 'famulus' ? 4 : 2;
                const due = wageBase + k.wageOwed;
                const grose = (typeof CellariumSystem !== 'undefined') ? CellariumSystem.getGrose() : 0;
                if (grose >= due) {
                    CellariumSystem.addGrose(-due);
                    if (k.wageOwed > 0 && k.type !== 'famulus') k.loyalty = Math.min(100, k.loyalty + 2); // splacený dluh = usmíření
                    k.wageOwed = 0;
                    paidCount++;
                    paidTotal += due;
                } else if (k.type === 'famulus') {
                    // Famulus — žádná trvalá vazba, při neplacení odchází okamžitě (ne gradual loyalty decay)
                    leavers.push(k);
                } else {
                    k.wageOwed += wageBase;
                    k.loyalty = Math.max(0, k.loyalty - 5);
                    k.mood = Math.max(0, k.mood - 5);
                    if (k.loyalty <= 0) leavers.push(k);
                }
            });
            // Souhrnná hláška za týden — jedna zpráva, ne per-konvrš spam.
            if (paidCount > 0) {
                if (typeof UI !== 'undefined' && UI.notifyPanel) {
                    UI.notifyPanel('💰 ' + (lang === 'en'
                        ? 'Wages paid: ' + paidCount + ' lay brother(s), ' + paidTotal + ' g.'
                        : 'Mzda vyplacena: ' + paidCount + ' konvrš(ů), ' + paidTotal + ' g.'), 'system');
                }
                this.addKronikaEntry('minor',
                    '💰 Mzda vyplacena: ' + paidCount + ' konvrš(ů), ' + paidTotal + ' g.',
                    '💰 Wages paid: ' + paidCount + ' lay brother(s), ' + paidTotal + ' g.',
                    '');
            }
            leavers.forEach(k => {
                GameState.conversi = GameState.conversi.filter(x => x.id !== k.id);
                // Ztráta pracovního parťáka — bratr na stejném tabu to nese těžce.
                if (k.task) {
                    const partnerBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
                        .find(b => b.assignedTab === k.task);
                    if (partnerBrother) partnerBrother.stress = Math.min(100, (partnerBrother.stress || 0) + 8);
                }
                if (typeof UI !== 'undefined' && UI.notifyPanel) {
                    UI.notifyPanel('🚪 ' + (lang==='en'
                        ? k.name + ' has left the monastery — unpaid and forgotten.'
                        : k.name + ' opustil klášter — neplacen a zapomenut.'), 'warning');
                }
                Game.addKronikaEntry('important',
                    '🚪 ' + k.name + ' opustil klášter. Mzda zůstala nevyplacena příliš dlouho.',
                    '🚪 ' + k.name + ' left the monastery. His wages went unpaid too long.',
                    '🚪 ' + k.name + ' monasterium reliquit.'
                );
            });
            GameState.conversiNextWage = Date.now() + WEEK;
            Game.save();
        }

        // ── Kapitula: týdenní shromáždění (první za ~3,5 dne — střídá se s výplatou) ──
        if (!GameState.conversiNextKapitula) GameState.conversiNextKapitula = Date.now() + Math.round(WEEK / 2);
        if (Date.now() >= GameState.conversiNextKapitula && GameState.conversi.length > 0) {
            GameState.conversiNextKapitula = Date.now() + WEEK;
            this._runKapitula();
            Game.save();
        }

        // ── Temptation: denní drift podle Zbožnosti opata (persona.zboznost).
        // Nízká Zbožnost v komunitě = víc pokušení pro bratry; zdravá Zbožnost
        // ho naopak pomalu odplavuje (stejná "eroduje potichu" filozofie jako
        // Zbožnost/Vigor jinde ve hře). Self-guard 24h, nezávislé na Kapitule/mzdě.
        const DAY = 24 * 60 * 60 * 1000;
        if (!GameState.dormitoriumTemptationLastTick) GameState.dormitoriumTemptationLastTick = 0;
        if (Date.now() - GameState.dormitoriumTemptationLastTick >= DAY) {
            GameState.dormitoriumTemptationLastTick = Date.now();
            const brothers = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
            if (brothers.length > 0) {
                const zboznost = (GameState.persona && typeof GameState.persona.zboznost === 'number') ? GameState.persona.zboznost : 50;
                const delta = zboznost < 15 ? 4 : zboznost < 30 ? 2 : zboznost >= 70 ? -2 : 0;
                if (delta !== 0) {
                    brothers.forEach(b => {
                        b.temptation = Math.max(0, Math.min(100, (b.temptation || 0) + delta));
                    });
                    Game.save();
                }
            }
        }

        // ── Bestiář: Marginalie — uzavírací meta-karta. Odemkne se, jakmile
        // jsou nalezeny všechny předchozí bestie (jediná, co nemá teologa —
        // proto přichází poslední, ne nezávisle jako ostatní). Self-guard 24h.
        if (!GameState.marginalieCheckLastTick) GameState.marginalieCheckLastTick = 0;
        if (Date.now() - GameState.marginalieCheckLastTick >= DAY) {
            GameState.marginalieCheckLastTick = Date.now();
            const prereq = ['folio_titivillus_bestiar', 'folio_titivillus_secunda', 'folio_acedia_bestiar',
                             'folio_belzebub_bestiar', 'folio_grim_bestiar', 'folio_revenanti_bestiar'];
            const folios = (GameState.scrinium && GameState.scrinium.folios) || {};
            const allFound = prereq.every(id => folios[id] && folios[id].found);
            if (allFound && typeof SecretsSystem !== 'undefined') {
                SecretsSystem.unlockFolioById('folio_marginalie_bestiar');
            }
        }

        // ── Valetudo pro Conversi/Dormitorium — jeden sdílený denní tick.
        // Mirror HealthSystem.js enginu (stejné HealthConditionsDB, stejný
        // onApply/tickHour tvar), jen NPC verze místo GameState.satiety/fatigue.
        // Výkonový postih: nemoc přidává fatigue navíc (přirozeně vyřadí z
        // výběru přes existující fatigue<80/90 filtry) + dormitoriumBrotherMult
        // má přímý ×0.7 postih (viz výš).
        if (!GameState.npcHealthLastTick) GameState.npcHealthLastTick = 0;
        if (Date.now() - GameState.npcHealthLastTick >= DAY && typeof HealthConditionsDB !== 'undefined') {
            GameState.npcHealthLastTick = Date.now();
            this._npcHealthTick();
        }

        // ── Denní režim (Regula) ──
        const dayBlock = this.conversiDayBlock();


        // Officium (6–9): odpočinek + denní mood/loyalty tick — jednou za 24h
        if (dayBlock === 'officium') {
            const lastRest = GameState.conversiLastRest || 0;
            if (Date.now() - lastRest >= 24 * 60 * 60 * 1000) {
                const snorerPresent = GameState.conversi.some(k => this._konvrsTraits(k).includes('chrapoun'));
                const hiredIds = GameState.conversi.map(k => k.rosterId).filter(Boolean);
                GameState.conversi.forEach(k => {
                    const tr = this._konvrsTraits(k);
                    let rest = 10;
                    if (tr.includes('trpelivy')) rest = 15;
                    if (snorerPresent && !tr.includes('chrapoun')) rest = Math.min(rest, 7);
                    k.fatigue = Math.max(0, k.fatigue - rest);

                    // Mood: vazby mezi najatými (afinita +3, tenze -3); bez vazeb drift +2 k 60
                    let moodDelta = 0, hasBond = false;
                    if (k.rosterId && typeof ConversiBondsDB !== 'undefined') {
                        ConversiBondsDB.forEach(bd => {
                            const other = (bd.a === k.rosterId) ? bd.b : (bd.b === k.rosterId ? bd.a : null);
                            if (other && hiredIds.includes(other)) {
                                hasBond = true;
                                moodDelta += (bd.type === 'affinity') ? 3 : -3;
                            }
                        });
                    }
                    if (!hasBond && k.mood < 60) moodDelta += 2;
                    k.mood = Math.max(0, Math.min(100, (k.mood || 60) + moodDelta));
                    if (tr.includes('mrzout')) k.mood = Math.min(k.mood, 70);

                    // Loyalty: +1/den služby, zbožný +2
                    k.loyalty = Math.min(100, (k.loyalty || 30) + (tr.includes('zbozny') ? 2 : 1));
                });
                GameState.conversiLastRest = Date.now();
                Game.save();
            }
            if (!onlyTab) return; // na Officiu, automatický tick nedostupný pro úkoly (ruční Collect smí projít)
        }

        // Oběd (12–13): refektář — jídlo z klášterních zásob, jednou za 24h
        if (dayBlock === 'lunch') {
            this._runRefectory();
            if (!onlyTab) return; // u oběda, automatický tick nedostupný pro úkoly (ruční Collect smí projít)
        }

        // Nešpory (18–19): večerní modlitba — loyalty +1, jednou za 24h
        if (dayBlock === 'vespers') {
            const lastVespers = GameState.conversiLastVespers || 0;
            if (Date.now() - lastVespers >= 24 * 60 * 60 * 1000) {
                GameState.conversi.forEach(k => {
                    k.loyalty = Math.min(100, (k.loyalty || 30) + 1);
                });
                GameState.conversiLastVespers = Date.now();
                Game.save();
            }
            if (!onlyTab) return; // na nešporách, automatický tick nedostupný pro úkoly (ruční Collect smí projít)
        }

        // Noc (22–5): spánek
        if (dayBlock === 'night' && !onlyTab) return; // spánek — automatický tick nedostupný, ruční Collect smí projít

        // Práci dělá nejméně unavený dostupný konvrš PŘIŘAZENÝ na Dvůr (M1: přiřazení nahrazuje "kdo je volný")
        const worker = GameState.conversi
            .filter(k => k.task === 'dvur'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        // POZOR: dřív zde bylo `if (!worker) return;`, což při absenci konvrše
        // na Dvoru zablokovalo ÚPLNĚ VŠECHNY následující sekce (Záhony, Sad,
        // Apiarium, Piscina, Pole, Vinohrad, Athanor) — každá má svůj vlastní
        // worker-filtr, takže na tomhle `return` nezávisí. Opraveno na
        // `if (worker || dvurBrother) { ... }`, aby zbytek funkce běžel bez
        // ohledu na obsazenost Dvora, a aby i samotný Dvůr fungoval s bratrem
        // bez přiřazeného konvrše (stejný vzor jako ostatní taby).
        const dvurBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'dvur');
        if ((!onlyTab || onlyTab === 'dvur') && (worker || dvurBrother)) {
            if (typeof FarmyardSystem === 'undefined') return;
            // Mapování: (argument pro cleanPen) → (klíč v GameState, kde se hlídá .built)
            const pens = [
                { arg: 'kurnik',      state: 'henhouse' },
                { arg: 'kosar',       state: 'sheepfold' },
                { arg: 'cowbyre',     state: 'cowbyre' },
                { arg: 'pigsty',      state: 'pigsty' },
                { arg: 'goatpen',     state: 'goatpen' },
                { arg: 'rabbitry',    state: 'rabbitry' },
                { arg: 'stable',      state: 'stable' },
                { arg: 'donkeyStall', state: 'donkeyStall' },
            ];
            let cleanedAny = false;
            const DAY = 24 * 60 * 60 * 1000;
            pens.forEach(p => {
                const st = GameState[p.state];
                if (st && st.built) {
                    // Pojistka: chlév v cooldownu přeskočit tiše — cleanPen by toastoval "uklidíte až zítra"
                    if (Date.now() - (st.lastCleanMs || 0) < DAY) return;
                    const before = st.lastCleanMs || 0;
                    FarmyardSystem.cleanPen(p.arg);
                    if ((st.lastCleanMs || 0) > before) cleanedAny = true;
                }
            });

            // Krmení — jen dokud NENÍ Horreum (pak přebírá Game.checkAnimalFeeding()
            // automaticky, nezávisle na konvrši/bratrovi, aby se krmivo nespotřebovávalo 2×)
            let fedAny = false;
            const hasHorreum = GameState.storage && GameState.storage.horreum && GameState.storage.horreum.built;
            if (!hasHorreum) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                const animals = [
                    { key: 'henhouse',  built: GameState.henhouse && GameState.henhouse.built && GameState.henhouse.hens && GameState.henhouse.hens.length > 0, feedChain: ['grain', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Hens':'Slepice' },
                    { key: 'sheepfold', built: GameState.sheepfold && GameState.sheepfold.built && GameState.sheepfold.sheep && GameState.sheepfold.sheep.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Sheep':'Ovce' },
                    { key: 'rabbitry',  built: GameState.rabbitry && GameState.rabbitry.built && GameState.rabbitry.animals && GameState.rabbitry.animals.length > 0, feedChain: ['scraps', 'hay'], feedAmt: 1, name: lang==='en'?'Rabbits':'Králíci' },
                    { key: 'goatpen',   built: GameState.goatpen && GameState.goatpen.built && GameState.goatpen.animals && GameState.goatpen.animals.length > 0, feedChain: ['hay', 'scraps', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Goats':'Kozy' },
                    { key: 'cowbyre',   built: GameState.cowbyre && GameState.cowbyre.built && GameState.cowbyre.animals && GameState.cowbyre.animals.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Cattle':'Skot' },
                    { key: 'pigsty',    built: GameState.pigsty && GameState.pigsty.built && GameState.pigsty.animals && GameState.pigsty.animals.length > 0, feedChain: ['scraps', 'feed_meal', 'grain', 'hay'], feedAmt: 2, name: lang==='en'?'Pigs':'Prasata' },
                ];
                animals.forEach(a => {
                    if (!a.built) return;
                    // v2: lastFedAt přímo na GameState[pen] — stejné pole jako getMood()/manuální Feed
                    const hoursSinceFed = (Date.now() - (GameState[a.key].lastFedAt || 0)) / 3600000;
                    if (hoursSinceFed < 24) return;
                    const useFeed = a.feedChain.find(f => (GameState.inventory[f] || 0) >= a.feedAmt);
                    if (useFeed) {
                        this.removeItem(useFeed, a.feedAmt);
                        GameState[a.key].lastFedAt = Date.now();
                        fedAny = true;
                    }
                });
            }

            if (cleanedAny || fedAny) {
                if (worker) {
                    const workGain = this._konvrsTraits(worker).includes('silak') ? 10 : 15;
                    worker.fatigue = Math.min(100, worker.fatigue + workGain);
                }
                if (dvurBrother) {
                    this.dormitoriumAddXp(dvurBrother, 'dvur');
                    dvurBrother.fatigue = Math.min(100, (dvurBrother.fatigue || 0) + 10);
                }
                const who = this._workCredit(dvurBrother, worker);
                const parts_cs = [], parts_en = [];
                if (cleanedAny) { parts_cs.push('uklidil chlévy'); parts_en.push('cleaned the pens'); }
                if (fedAny) { parts_cs.push('nakrmil zvířata'); parts_en.push('fed the animals'); }
                if (typeof this._reportWork === 'function') {
                    this._reportWork(
                        `🏚️ ${who} (Dvůr): ${parts_cs.join(', ')}.`,
                        `🏚️ ${who} (Farmyard): ${parts_en.join(', ')}.`
                    );
                }
                Game.save();
            }
        }

        // ── Záhony (L1): přiřazený konvrš zalévá a sklízí, self-guarded 24h.
        //    Přiřazený bratr (Dormitorium) dělá totéž SÁM i bez konvrše;
        //    pokud je konvrš přítomen zároveň, bratr násobí jeho výnos podle
        //    své úrovně specializace "Zahradník". ──
        const gardener = GameState.conversi
            .filter(k => k.task === 'zahony'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const gardenBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'zahony');
        if ((!onlyTab || onlyTab === 'zahony') && (gardener || gardenBrother) && GameState.garden) {
            if (!GameState.conversiGardenLastTick) GameState.conversiGardenLastTick = 0;
            if (Date.now() - GameState.conversiGardenLastTick >= DAY) {
                GameState.conversiGardenLastTick = Date.now();
                let didWork = false;

                let growthSpeed = CONFIG.GROWTH_SPEED;
                if (GameState.researchedTechs.includes('tech_advanced_farming')) growthSpeed *= 2.0;
                const brotherMult = gardenBrother ? this.dormitoriumBrotherMult(gardenBrother, 'zahony') : 1.0;
                const harvested = {};

                GameState.garden.forEach(plot => {
                    if (plot.locked || plot.state !== 2) return;
                    const growHoursForPlot = (typeof GardenSystem !== 'undefined') ? GardenSystem.getGrowHours(plot.crop) : 24;
                    const needed = (growHoursForPlot * 3600000) / growthSpeed;

                    // Zalít, pokud suché a je voda na skladě
                    if (!plot.water) {
                        if ((GameState.inventory['water'] || 0) > 0) {
                            this.removeItem('water', 1);
                            plot.water = true;
                            didWork = true;
                        }
                        return;
                    }

                    // Sklidit, pokud dozrálo — stejná logika výnosu jako farmAction, záhon zůstane prázdný
                    if (Date.now() > plot.plantedAt + needed) {
                        const harvestCrop = plot.crop;
                        const _wasFertStage = plot.fertStage;
                        const _wasFertQuality = plot.fertQuality;
                        const _wasMidGrowFertilized = plot.midGrowFertilized;
                        plot.state = 0; plot.water = false; plot.crop = null;
                        plot.fertStage = 0; plot.fertQuality = 0; plot.midGrowFertilized = false;
                        didWork = true;

                        if (GameState.achievements) GameState.achievements.stats.harvests++;
                        const _gp = (typeof GardenSystem !== 'undefined')
                            ? Object.values(GardenSystem.GARDEN_PLANTS_DB).find(p => p.item === harvestCrop)
                            : null;
                        const _yieldMult = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('herb_yield') : 1.0;
                        // MRD zahony-tiers — stejný vzorec jako farmAction
                        let _fertMultAuto = 0.6;
                        if (_wasFertStage >= 1) _fertMultAuto = (_wasFertQuality === 2) ? 1.15 : 1.0;
                        if (_wasMidGrowFertilized) _fertMultAuto = 1.3;
                        const totalMult = _yieldMult * brotherMult * _fertMultAuto;
                        const track = (id, qty) => { harvested[id] = (harvested[id] || 0) + qty; };
                        if (_gp) {
                            const q = Math.max(1, Math.round(_gp.yield * totalMult));
                            this.addItem(harvestCrop, q); track(harvestCrop, q);
                            if (!_gp.canFlower && Math.random() < 0.3) this.addItem(_gp.seed, 1);
                        } else if (harvestCrop === 'hops') {
                            const q = Math.max(1, Math.round(2 * totalMult));
                            this.addItem('hops', q); track('hops', q);
                            if (Math.random() > 0.6) this.addItem('seeds_hops', 1);
                        } else if (['carrot', 'onion', 'potato'].includes(harvestCrop)) {
                            const q = Math.max(1, Math.round(3 * totalMult));
                            this.addItem(harvestCrop, q); track(harvestCrop, q);
                            if (Math.random() > 0.5) this.addItem('seeds_vegetable', 1);
                        } else if (harvestCrop) {
                            const q = Math.max(1, Math.round(2 * totalMult));
                            this.addItem(harvestCrop, q); track(harvestCrop, q);
                        }
                    }
                });

                if (didWork) {
                    if (gardener) {
                        const workGain = this._konvrsTraits(gardener).includes('silak') ? 10 : 15;
                        gardener.fatigue = Math.min(100, gardener.fatigue + workGain);
                    }
                    if (gardenBrother) {
                        this.dormitoriumAddXp(gardenBrother, 'zahony');
                        gardenBrother.fatigue = Math.min(100, (gardenBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(gardenBrother, gardener);
                    const harvestKeys = Object.keys(harvested);
                    if (harvestKeys.length) {
                        const listStr = harvestKeys.map(id => `${harvested[id]}× ${(typeof iName==='function')?iName(id):id}`).join(', ');
                        this._reportWork(`🌿 ${who} (Záhony) sklidil: ${listStr}.`, `🌿 ${who} (Garden) harvested: ${listStr}.`);
                    } else {
                        this._reportWork(`🌿 ${who} (Záhony) zaléval.`, `🌿 ${who} (Garden) watered.`);
                    }
                    Game.checkAchievements();
                    Game.save();
                }
            }
        }

        // ── Sad (L1): přiřazený konvrš sklízí dozrálé stromy, self-guarded 24h.
        //    Přiřazený bratr (specializace "Sadař") dělá totéž sám i bez
        //    konvrše; s konvršem násobí jeho výnos. ──
        const orchardKeeper = GameState.conversi
            .filter(k => k.task === 'sad'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const orchardBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'sad');
        if ((!onlyTab || onlyTab === 'sad') && (orchardKeeper || orchardBrother) && GameState.orchard) {
            if (!GameState.conversiOrchardLastTick) GameState.conversiOrchardLastTick = 0;
            if (Date.now() - GameState.conversiOrchardLastTick >= DAY) {
                GameState.conversiOrchardLastTick = Date.now();
                let didHarvest = false;
                const brotherMult = orchardBrother ? this.dormitoriumBrotherMult(orchardBrother, 'sad') : 1.0;
                const harvested = {};

                const TREE_DATA = {
                    seed_apple:    { harvestHours: 24 }, seed_pear:     { harvestHours: 24 },
                    seed_plum:     { harvestHours: 20 }, seed_cherry:   { harvestHours: 18 },
                    seed_walnut:   { harvestHours: 48 }, seed_mulberry: { harvestHours: 24 },
                    seed_quince:   { harvestHours: 36 }, seed_sorb:     { harvestHours: 48 },
                    seed_rowan:    { harvestHours: 24 }, seed_linden:   { harvestHours: 36 },
                };
                const TREE_FRUITS = {
                    seed_apple: 'apple', seed_pear: 'pear', seed_plum: 'plum',
                    seed_cherry: 'cherry', seed_walnut: 'walnut', seed_mulberry: 'mulberry',
                    seed_quince: 'quince', seed_sorb: 'sorb', seed_rowan: 'rowan',
                    seed_linden: 'linden_fruit',
                };

                (GameState.orchard || []).forEach(slot => {
                    if (slot.state !== 'mature') return;
                    const td = TREE_DATA[slot.treeType];
                    const fruitAt = slot.lastHarvestAt + (td ? td.harvestHours * 3600000 : 86400000);
                    if (Date.now() < fruitAt) return; // ještě neplodí — čeká na cooldown, stejně jako u ruční sklizně

                    const fruit = TREE_FRUITS[slot.treeType];
                    if (!fruit) return;
                    const baseQty = (slot.treeType === 'seed_walnut' || slot.treeType === 'seed_sorb') ? 2 : 3;
                    const qty = Math.max(1, Math.round(baseQty * brotherMult));
                    this.addItem(fruit, qty);
                    harvested[fruit] = (harvested[fruit] || 0) + qty;
                    if (slot.treeType === 'seed_linden') this.addItem('linden_blossom', 1);
                    this.addItem('pollen', 1);
                    slot.lastHarvestAt = Date.now();
                    didHarvest = true;
                });

                if (didHarvest) {
                    if (orchardKeeper) {
                        const workGain = this._konvrsTraits(orchardKeeper).includes('silak') ? 10 : 15;
                        orchardKeeper.fatigue = Math.min(100, orchardKeeper.fatigue + workGain);
                    }
                    if (orchardBrother) {
                        this.dormitoriumAddXp(orchardBrother, 'sad');
                        orchardBrother.fatigue = Math.min(100, (orchardBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(orchardBrother, orchardKeeper);
                    const listStr = Object.keys(harvested).map(id => `${harvested[id]}× ${(typeof iName==='function')?iName(id):id}`).join(', ');
                    this._reportWork(`🍎 ${who} (Sad) sklidil: ${listStr}.`, `🍎 ${who} (Orchard) harvested: ${listStr}.`);
                    Game.save();
                }
            }
        }

        // ── Apiarium (L1): přiřazený konvrš sklízí med/vosk, přikrmuje v zimě
        //    a léčí Varroa — self-guarded 24h. Přiřazený bratr (specializace
        //    "Včelař") dělá totéž sám i bez konvrše; s konvršem násobí výnos
        //    sklizně (Varroa léčba a zimní přikrmení jsou binární, bez bonusu). ──
        const beekeeper = GameState.conversi
            .filter(k => k.task === 'apiarium'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const apiaryBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'apiarium');
        if ((!onlyTab || onlyTab === 'apiarium') && (beekeeper || apiaryBrother) && GameState.apiary && typeof GardenSystem !== 'undefined') {
            if (!GameState.conversiApiaryLastTick) GameState.conversiApiaryLastTick = 0;
            if (Date.now() - GameState.conversiApiaryLastTick >= DAY) {
                GameState.conversiApiaryLastTick = Date.now();
                let didWork = false;
                const season = this._getApiarySeason();
                const now = Date.now();
                const weatherMod  = this._apiaryWeatherMod();
                const brotherMult = apiaryBrother ? this.dormitoriumBrotherMult(apiaryBrother, 'apiarium') : 1.0;
                let honeyGained = 0, waxGained = 0, varroaTreated = 0, fedHives = 0, veteranQueens = 0;

                GameState.apiary.forEach(hive => {
                    if (!hive.built || !hive.hasQueen) return;

                    // Varroa roste tiše s časem — konvrš ji sleduje a léčí, jakmile je vysoká
                    const elapsedH     = (now - hive.lastCollectAt) / 3600000;
                    const varroaResist = hive.queenVarroaResist || 3;
                    hive.varroa = Math.min(100, (hive.varroa || 0) + Math.max(1, Math.round((elapsedH / 8) * (5 - varroaResist))));

                    // Léčba Varroa má přednost — riziko hrozí kdykoliv v roce
                    if (hive.varroa >= 40) {
                        if ((GameState.inventory['thyme'] || 0) > 0) {
                            this.removeItem('thyme', 1);
                            hive.varroa   = Math.max(0, hive.varroa - (30 + varroaResist * 5));
                            hive.strength = Math.max(1, (hive.strength || 3) - 1);
                            didWork = true;
                            varroaTreated++;
                        }
                        return;
                    }

                    if (season === 'winter') {
                        // Zimní přikrmení — jen pokud síla není už na maximu
                        if (hive.strength < 10 && (GameState.inventory['honey'] || 0) > 0) {
                            this.removeItem('honey', 1);
                            hive.strength = Math.min(10, (hive.strength || 3) + 1);
                            didWork = true;
                            fedHives++;
                        }
                        return;
                    }

                    // Sklizeň — stejná gate logika jako ruční collectHive
                    const COLLECT_HOURS = { spring: 16, summer: 8, autumn: 20 };
                    const hours = COLLECT_HOURS[season] || 12;
                    if (now < hive.lastCollectAt + (hours * 3600000)) return;

                    const varroaPenalty = hive.varroa >= 70 ? 0.5 : hive.varroa >= 40 ? 0.8 : 1.0;
                    const strengthMod = (hive.strength || 3) / 5;
                    const queenMod    = (hive.queenStrength || 3) / 3;
                    const honeyBase = { spring: 1, summer: 3, autumn: 1 };
                    const waxBase   = { spring: 1, summer: 1, autumn: 2 };
                    const hQty = Math.max(1, Math.round(honeyBase[season] * strengthMod * queenMod * weatherMod * varroaPenalty * brotherMult));
                    const wQty = Math.max(1, Math.round(waxBase[season] * strengthMod * varroaPenalty * brotherMult));
                    this.addItem('honey', hQty);
                    this.addItem('beeswax', wQty);
                    honeyGained += hQty; waxGained += wQty;

                    if (season === 'summer') {
                        const hasFlowers = GameState.garden && GameState.garden.some(p => p.state === 2 && p.water);
                        const hasTrees   = GameState.orchard && GameState.orchard.some(s => s.state === 'mature');
                        if (hasFlowers || hasTrees) this.addItem('pollen', 1);
                    }

                    hive.strength = Math.min(10, (hive.strength || 3) + 1);

                    // Rojivá nálada — konvrš díky pravidelné 24h péči nálada roste pomaleji,
                    // ale odlet je pořád možný (pravděpodobnostně, ne pevný práh)
                    if (hive.strength >= 8) {
                        hive.swarmMood = Math.min(100, (hive.swarmMood || 0) + 4);
                    } else {
                        hive.swarmMood = Math.max(0, (hive.swarmMood || 0) - 5);
                    }
                    if (hive.swarmMood >= 60 && Math.random() < 0.35) {
                        const veteranChance = 0.08 + (hive.queenWinter || 3) * 0.04;
                        if (Math.random() < veteranChance) { this.addItem('veteran_queen', 1); veteranQueens++; }
                        hive.hasQueen  = false;
                        hive.queenName = null;
                        hive.strength  = 0;
                        hive.varroa    = 0;
                        hive.swarmMood = 0;
                        didWork = true;
                        return;
                    }
                    hive.lastCollectAt = now;
                    didWork = true;
                });

                if (didWork) {
                    if (beekeeper) {
                        const workGain = this._konvrsTraits(beekeeper).includes('silak') ? 10 : 15;
                        beekeeper.fatigue = Math.min(100, beekeeper.fatigue + workGain);
                    }
                    if (apiaryBrother) {
                        this.dormitoriumAddXp(apiaryBrother, 'apiarium');
                        apiaryBrother.fatigue = Math.min(100, (apiaryBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(apiaryBrother, beekeeper);
                    const parts_cs = [], parts_en = [];
                    if (honeyGained || waxGained) { parts_cs.push(`sklidil ${honeyGained}× med, ${waxGained}× vosk`); parts_en.push(`harvested ${honeyGained}× honey, ${waxGained}× wax`); }
                    if (varroaTreated) { parts_cs.push(`ošetřil ${varroaTreated} úl(y) proti Varroa`); parts_en.push(`treated ${varroaTreated} hive(s) for Varroa`); }
                    if (fedHives) { parts_cs.push(`přikrmil ${fedHives} úl(y)`); parts_en.push(`fed ${fedHives} hive(s)`); }
                    if (veteranQueens) { parts_cs.push(`zachránil ${veteranQueens} vysloužilou matku z roje`); parts_en.push(`saved ${veteranQueens} veteran queen from a swarm`); }
                    this._reportWork(
                        `🐝 ${who} (Apiarium): ${parts_cs.join(', ')}.`,
                        `🐝 ${who} (Apiary): ${parts_en.join(', ')}.`
                    );
                    Game.save();
                }
            }
        }

        // ── Piscina (L1): přiřazený konvrš krmí ryby, přesouvá čekající plůdek
        //    a sklízí dospělé kapry — self-guarded 24h. Přiřazený bratr
        //    (specializace "Rybář") dělá totéž sám i bez konvrše; s konvršem
        //    násobí sklizený počet kaprů (krmení/přesun plůdku beze změny). ──
        const fisherman = GameState.conversi
            .filter(k => k.task === 'piscina'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const piscinaBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'piscina');
        if ((!onlyTab || onlyTab === 'piscina') && (fisherman || piscinaBrother) && GameState.piscina && GameState.piscina.tier >= 1) {
            if (!GameState.conversiPiscinaLastTick) GameState.conversiPiscinaLastTick = 0;
            if (Date.now() - GameState.conversiPiscinaLastTick >= DAY) {
                GameState.conversiPiscinaLastTick = Date.now();
                const p = GameState.piscina;
                let didWork = false;
                const brotherMult = piscinaBrother ? this.dormitoriumBrotherMult(piscinaBrother, 'piscina') : 1.0;
                let didFeed = false, didTransfer = false, carpCaught = 0;

                // Krmení — spotřebuje fiber podle počtu ryb všech stupňů
                const feedNeeded = (p.fry || 0) + (p.youngCarp || 0) + (p.carp || 0);
                if (feedNeeded > 0 && (GameState.inventory['fiber'] || 0) >= feedNeeded) {
                    this.removeItem('fiber', feedNeeded);
                    p.lastFedAt = Date.now();
                    didWork = true; didFeed = true;
                }

                // Přesun čekajícího plůdku do prvního stupně — vlastní řádek
                if ((p.pendingFry || 0) > 0) {
                    p.fish = p.fish || [];
                    p.fish.push({ id: Game._piscinaNextId(), species: 'kapr', stage: 'fry', qty: p.pendingFry, enteredStageAt: Date.now() });
                    p.pendingFry = 0;
                    didWork = true; didTransfer = true;
                }

                // Sklizeň všech dospělých kaprů — bratr násobí ulovené množství.
                // Filtr na species:'kapr' záměrně — jiné druhy (štika a další
                // z Trhu/Clientely) tímhle automatem NEsmí projít, jinak by se
                // sklidily jako 'carp' bez ohledu na skutečný druh (viz Sprint 4).
                const carpTotal = (p.fish || []).filter(r => r.stage === 'adult' && r.species === 'kapr').reduce((s, r) => s + r.qty, 0);
                if (carpTotal > 0) {
                    const qty = Math.max(carpTotal, Math.round(carpTotal * brotherMult));
                    (p.fish || []).forEach(r => { if (r.stage === 'adult' && r.species === 'kapr') r.qty = 0; });
                    this.addItem('carp', qty);
                    didWork = true; carpCaught = qty;
                }

                Game._piscinaSyncAggregates();

                if (didWork) {
                    if (fisherman) {
                        const workGain = this._konvrsTraits(fisherman).includes('silak') ? 10 : 15;
                        fisherman.fatigue = Math.min(100, fisherman.fatigue + workGain);
                    }
                    if (piscinaBrother) {
                        this.dormitoriumAddXp(piscinaBrother, 'piscina');
                        piscinaBrother.fatigue = Math.min(100, (piscinaBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(piscinaBrother, fisherman);
                    const parts_cs = [], parts_en = [];
                    if (didFeed) { parts_cs.push('nakrmil ryby'); parts_en.push('fed the fish'); }
                    if (didTransfer) { parts_cs.push('přesunul plůdek'); parts_en.push('moved the fry'); }
                    if (carpCaught) { parts_cs.push(`vylovil ${carpCaught}× kapra`); parts_en.push(`caught ${carpCaught}× carp`); }
                    this._reportWork(
                        `🐟 ${who} (Piscina): ${parts_cs.join(', ')}.`,
                        `🐟 ${who} (Fishpond): ${parts_en.join(', ')}.`
                    );
                    Game.save();
                }
            }
        }

        // ── Pole (L1): přiřazený konvrš zalévá rostoucí pole a sklízí dozrálá,
        //    self-guarded 24h. Volá přímo GardenSystem.waterField/harvestField —
        //    výpočet výnosu (počasí, kvalita zrna, sláma) je tam příliš složitý
        //    na bezpečné duplikování zvlášť. Přiřazený bratr (specializace
        //    "Rolník") dělá totéž sám i bez konvrše; s konvršem násobí výnos —
        //    bonus se dopočítává porovnáním stavu inventáře před/po sklizni. ──
        const plowman = GameState.conversi
            .filter(k => k.task === 'pole'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const fieldBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'pole');
        if ((!onlyTab || onlyTab === 'pole') && (plowman || fieldBrother) && GameState.fields && typeof GardenSystem !== 'undefined') {
            if (!GameState.conversiFieldLastTick) GameState.conversiFieldLastTick = 0;
            if (Date.now() - GameState.conversiFieldLastTick >= DAY) {
                GameState.conversiFieldLastTick = Date.now();
                let didWork = false;
                const techs = GameState.researchedTechs || [];
                const waterCost = techs.includes('tech_field_irrigation') ? 1 : 2;
                const brotherMult = fieldBrother ? this.dormitoriumBrotherMult(fieldBrother, 'pole') : 1.0;
                const harvested = {};

                GameState.fields.forEach((field, idx) => {
                    if (field.locked || field.state !== 'growing') return;

                    if (!field.watered) {
                        if ((GameState.inventory['water'] || 0) >= waterCost) {
                            GardenSystem.waterField(idx);
                            didWork = true;
                        }
                        return;
                    }
                    if (field.phase >= 3) {
                        const before = Object.assign({}, GameState.inventory);
                        GardenSystem.harvestField(idx);
                        didWork = true;
                        Object.keys(GameState.inventory).forEach(itemId => {
                            let gained = (GameState.inventory[itemId] || 0) - (before[itemId] || 0);
                            if (gained <= 0) return;
                            if (brotherMult > 1.0) {
                                const bonus = Math.round(gained * (brotherMult - 1.0));
                                if (bonus > 0) { this.addItem(itemId, bonus); gained += bonus; }
                            }
                            harvested[itemId] = (harvested[itemId] || 0) + gained;
                        });
                    }
                });

                if (didWork) {
                    if (plowman) {
                        const workGain = this._konvrsTraits(plowman).includes('silak') ? 10 : 15;
                        plowman.fatigue = Math.min(100, plowman.fatigue + workGain);
                    }
                    if (fieldBrother) {
                        this.dormitoriumAddXp(fieldBrother, 'pole');
                        fieldBrother.fatigue = Math.min(100, (fieldBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(fieldBrother, plowman);
                    const harvestKeys = Object.keys(harvested);
                    if (harvestKeys.length) {
                        const listStr = harvestKeys.map(id => `${harvested[id]}× ${(typeof iName==='function')?iName(id):id}`).join(', ');
                        this._reportWork(`🌾 ${who} (Pole) sklidil: ${listStr}.`, `🌾 ${who} (Field) harvested: ${listStr}.`);
                    } else {
                        this._reportWork(`🌾 ${who} (Pole) zaléval.`, `🌾 ${who} (Field) watered.`);
                    }
                    Game.save();
                }
            }
        }

        // ── Vinohrad (L1): přiřazený konvrš zalévá, prořezává (i mimo sezónu —
        //    specialista, na rozdíl od hráče gate neplatí) a sklízí dozrálou révu,
        //    self-guarded 24h. Přiřazený bratr (specializace "Vinař") dělá totéž
        //    sám i bez konvrše; s konvršem násobí výnos sklizně (prořez/cuttings
        //    beze změny). ──
        const vintner = GameState.conversi
            .filter(k => k.task === 'vinohrad'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        const vineaBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'vinohrad');
        if ((!onlyTab || onlyTab === 'vinohrad') && (vintner || vineaBrother) && GameState.vinea && typeof GardenSystem !== 'undefined') {
            if (!GameState.conversiVineaLastTick) GameState.conversiVineaLastTick = 0;
            if (Date.now() - GameState.conversiVineaLastTick >= DAY) {
                GameState.conversiVineaLastTick = Date.now();
                let didWork = false;
                const techs = GameState.researchedTechs || [];
                const waterCost = techs.includes('tech_field_irrigation') ? 1 : 2;
                const brotherMult = vineaBrother ? this.dormitoriumBrotherMult(vineaBrother, 'vinohrad') : 1.0;
                let prunedCount = 0;
                const harvested = {};

                GameState.vinea.forEach((slot, idx) => {
                    if (!slot || slot.state === 'empty' || slot.state === 'dormant') return;

                    // Prořez — konvrš specialista obchází sezónní gate (na rozdíl od hráče)
                    if (!slot.pruned && (slot.state === 'planted' || slot.state === 'growing')) {
                        const variety = slot.variety ? GardenSystem.VINEA_DB[slot.variety] : null;
                        if (variety) {
                            slot.pruned = true;
                            const cuttings = Math.random() < 0.5 ? 2 : 1;
                            slot.cuttingsAvailable = cuttings;
                            this.addItem(variety.viticis, cuttings);
                            didWork = true;
                            prunedCount++;
                        }
                    }

                    // Zalévání — mimo dormant/empty, jen pokud je voda na skladě
                    if ((GameState.inventory['water'] || 0) >= waterCost) {
                        GardenSystem.waterVine(idx);
                        didWork = true;
                    }

                    // Sklizeň dozrálé révy
                    if (slot.state === 'ripe') {
                        const before = Object.assign({}, GameState.inventory);
                        GardenSystem.harvestVine(idx);
                        didWork = true;
                        Object.keys(GameState.inventory).forEach(itemId => {
                            let gained = (GameState.inventory[itemId] || 0) - (before[itemId] || 0);
                            if (gained <= 0) return;
                            if (brotherMult > 1.0) {
                                const bonus = Math.round(gained * (brotherMult - 1.0));
                                if (bonus > 0) { this.addItem(itemId, bonus); gained += bonus; }
                            }
                            harvested[itemId] = (harvested[itemId] || 0) + gained;
                        });
                    }
                });

                if (didWork) {
                    if (vintner) {
                        const workGain = this._konvrsTraits(vintner).includes('silak') ? 10 : 15;
                        vintner.fatigue = Math.min(100, vintner.fatigue + workGain);
                    }
                    if (vineaBrother) {
                        this.dormitoriumAddXp(vineaBrother, 'vinohrad');
                        vineaBrother.fatigue = Math.min(100, (vineaBrother.fatigue || 0) + 10);
                    }
                    const who = this._workCredit(vineaBrother, vintner);
                    const parts_cs = [], parts_en = [];
                    if (prunedCount) { parts_cs.push(`prořezal ${prunedCount} keř(ů)`); parts_en.push(`pruned ${prunedCount} vine(s)`); }
                    const harvestKeys = Object.keys(harvested);
                    if (harvestKeys.length) {
                        const listStr = harvestKeys.map(id => `${harvested[id]}× ${(typeof iName==='function')?iName(id):id}`).join(', ');
                        parts_cs.push(`sklidil: ${listStr}`);
                        parts_en.push(`harvested: ${listStr}`);
                    }
                    if (!parts_cs.length) { parts_cs.push('zaléval'); parts_en.push('watered'); }
                    this._reportWork(
                        `🍇 ${who} (Vinohrad): ${parts_cs.join(', ')}.`,
                        `🍇 ${who} (Vineyard): ${parts_en.join(', ')}.`
                    );
                    Game.save();
                }
            }
        }

        // ── Athanor (L1, Dormitorium MRD Fáze 1): přiřazený bratr (specializace
        //    "Alchymista") sám vybírá ingredience a vaří, self-guarded 24h.
        //    Žádný Conversi task pro Athanor neexistuje — čistě bratrovská role.
        //    Heuristika výběru: bratr vaří POUZE již objevené kombinace
        //    (state.discovered[]), aby neplýtval vzácné suroviny na neznámé
        //    pokusy. Pokud žádnou známou kombinaci nemá po ruce, nedělá nic. ──
        const athanorBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'athanor');
        if ((!onlyTab || onlyTab === 'athanor') && athanorBrother && GameState.athanor && typeof AthanorDB !== 'undefined' && typeof CombinationEngine !== 'undefined') {
            if (!GameState.conversiAthanorLastTick) GameState.conversiAthanorLastTick = 0;
            if (Date.now() - GameState.conversiAthanorLastTick >= DAY) {
                GameState.conversiAthanorLastTick = Date.now();
                const state = GameState.athanor;

                // Bratr nezasahuje do hráčova právě probíhajícího vaření
                if (!state.brewing && state.discovered && state.discovered.length > 0) {
                    // Najdi první objevenou kombinaci, na kterou má bratr suroviny
                    let chosen = null;
                    for (const key of state.discovered) {
                        const sepIdx = key.lastIndexOf(':');
                        if (sepIdx < 0) continue;
                        const ingPart = key.slice(0, sepIdx);
                        const processId = key.slice(sepIdx + 1);
                        const slotIds = ingPart.split('+');

                        const counts = {};
                        slotIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
                        const hasAll = Object.entries(counts).every(([id, qty]) => (GameState.inventory[id] || 0) >= qty);
                        if (hasAll) { chosen = { slotIds, processId }; break; }
                    }

                    if (chosen) {
                        // Destilace vyžaduje alembik + baňku, stejně jako u hráče
                        const needsVitrea = chosen.processId === 'destillatio';
                        const hasAlembic = (GameState.inventory['alembic'] || 0) > 0;
                        const hasFlask = (GameState.inventory['glass_flask'] || 0) > 0;
                        if (!needsVitrea || (hasAlembic && hasFlask)) {
                            chosen.slotIds.forEach(id => this.removeItem(id, 1));
                            if (needsVitrea) this.removeItem('glass_flask', 1);

                            const result = CombinationEngine.evaluate(chosen.slotIds, chosen.processId);
                            if (result.success) {
                                const { combo, isCritical } = result;
                                const qty = combo.result.qty + (isCritical ? 1 : 0);
                                this.addItem(combo.result.id, qty);
                                if (combo.effect && typeof AthanorSystem !== 'undefined' && AthanorSystem.applyEffect) {
                                    AthanorSystem.applyEffect(combo.effect, combo.name);
                                }
                                this._reportWork(
                                    `⚗️ ${athanorBrother.name} (Athanor) uvařil: ${qty}× ${combo.name}${isCritical ? ' ✨' : ''}.`,
                                    `⚗️ ${athanorBrother.name} (Athanor) brewed: ${qty}× ${combo.name}${isCritical ? ' ✨' : ''}.`
                                );
                            } else {
                                this._reportWork(
                                    `⚗️ ${athanorBrother.name} (Athanor) neuspěl při vaření — suroviny přišly vniveč.`,
                                    `⚗️ ${athanorBrother.name} (Athanor) failed the brew — ingredients wasted.`
                                );
                            }

                            this.dormitoriumAddXp(athanorBrother, 'athanor');
                            athanorBrother.fatigue = Math.min(100, (athanorBrother.fatigue || 0) + 10);
                            Game.save();

                            if (typeof AthanorSystem !== 'undefined' && AthanorSystem.refreshIfOpen) {
                                AthanorSystem.refreshIfOpen();
                            }
                        }
                    }
                }
            }
        }

        // ── Scriptorium (L1): přiřazený bratr (specializace "Skriptor") čte
        //    za hráče odemčené, ale dosud nepřečtené knihy — jedna kniha za
        //    24h tick, self-guarded. Scriptorium je čtenářský tab (LibraryDB),
        //    ne výrobní — žádný Conversi task pro něj neexistuje, čistě
        //    bratrovská role, stejně jako Athanor. ──
        const scriptoriumBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'scriptorium');
        if ((!onlyTab || onlyTab === 'scriptorium') && scriptoriumBrother && GameState.library && typeof LibraryDB !== 'undefined' && typeof LibraryHelpers !== 'undefined') {
            if (!GameState.conversiScriptoriumLastTick) GameState.conversiScriptoriumLastTick = 0;
            if (Date.now() - GameState.conversiScriptoriumLastTick >= DAY) {
                GameState.conversiScriptoriumLastTick = Date.now();

                const unread = LibraryDB.books.find(b =>
                    GameState.library.unlockedBooks.includes(b.id) &&
                    !GameState.library.readBooks.includes(b.id)
                );

                if (unread) {
                    LibraryHelpers.readBook(unread.id);
                    this.dormitoriumAddXp(scriptoriumBrother, 'scriptorium');
                    scriptoriumBrother.fatigue = Math.min(100, (scriptoriumBrother.fatigue || 0) + 10);
                    const title = unread.title || unread.id;
                    this._reportWork(
                        `📜 ${scriptoriumBrother.name} (Scriptorium) přečetl: „${title}“.`,
                        `📜 ${scriptoriumBrother.name} (Scriptorium) read: "${title}".`
                    );
                    Game.save();
                }
            }
        }
    },

    addKronikaEntry: function(type, cs, en, la) {
        if (!GameState.kronika) GameState.kronika = [];
        GameState.kronika.push({
            ts:   Date.now(),
            type: type,
            cs:   cs,
            en:   en,
            la:   la
        });
        if (GameState.kronika.length > 500) {
            GameState.kronika = GameState.kronika.slice(-500);
        }
    },

};