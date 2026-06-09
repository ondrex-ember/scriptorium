const Game = {
    _scavenging: false,
    init: function() {
        Game.load();

        // --- INJEKCE CSS PRO HINT BTN-IGNITE ---
        (function() {
            const style = document.createElement('style');
            style.textContent = [
                '#btn-ignite.btn-ignite--hint {',
                '  position: relative;',
                '}',
                '#btn-ignite.btn-ignite--hint::after {',
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
        
        // Initialize hunger if not present
        if(!GameState.hunger) {
            GameState.hunger = { fed: true, lastMeal: Date.now(), duration: 24 * 60 * 60 * 1000 };
        }
        
        // Initialize garden locked states if upgrading from old version
        if(GameState.garden.length === 2) {
            GameState.garden.push({ state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true });
            GameState.garden.push({ state: 0, water: false, crop: null, plantedAt: 0, cropType: 'special', locked: true });
        }
        // Migrace na 8 záhonů — přidat chybějící
        while(GameState.garden.length < 8) {
            GameState.garden.push({ state: 0, water: false, crop: null, plantedAt: 0, cropType: 'herb', locked: true });
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
                    lastTrade: 0
                }
            };
        }
		// Initialize well if not present (PŘIDAT po library init)
		if(!GameState.well) {
			GameState.well = {
				built: false,
				level: "none",
				condition: "clean",
				lastUse: 0
			};
		}

		// Initialize storage buildings
		if (!GameState.storage) {
			GameState.storage = { almarium: { built: false }, cella: { built: false }, horreum: { built: false } };
		}

		// Initialize feeding system
		if (!GameState.feeding) GameState.feeding = {};

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
        CellariumSystem.init();
        PersonaSystem.init();
        SecretsSystem.init();
        AthanorSystem.init();
        NotificationSystem.init();
        
        // NOW render UI (after theme is set and all systems initialized)
        UI.renderAll(); 
        Game.checkEnvironment();
        
        VigorSystem.renderMiniDisplay();

        // Consent banner – musí být až po načtení UI
        ConsentManager.init();
        
        // Update time display AFTER UI is rendered
        TimeSys.update();
        
        // Check daily reward AFTER UI render (only from 2nd session onwards)
        setTimeout(() => {
            Game.checkDailyReward();
        }, 500);
        
        document.body.addEventListener('click', () => { 
            if (!audioSys) { 
                audioSys = new AudioSystem(); 
                audioSys.start(); 
            }
            
            // Auto-start fire if lit (after F5 refresh)
            if (GameState.flags.fireplaceLit && !audioSys.isPlaying) {
                audioSys.startFireLoop(true);
            }

            // Restore music settings to AudioSystem
            audioSys.setMusicEnabled(GameState.settings.musicEnabled !== false);
            audioSys.setMusicVolume((GameState.settings.musicVolume ?? 0.5) * 100);

            // Sync music UI controls
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
                Game.checkEnvironment();
                // v7.5: Check canonical hours
                CanonicalHours.checkCurrentHour();
                // v7.5: Check events
                EventsSystem.checkEvents();
                // v8.1: Giacomo weekly check (once per minute)
                _tickCounter++;
                if (_tickCounter >= 60) {
                    _tickCounter = 0;
                    CellariumSystem.checkGiacomoEvent();
                    // v8.x: Orchard growing → mature transition
                    Game.checkOrchardGrowth();
                    Game.checkFarmyardProduction();
                    Game.checkPiscinaGrowth();
                }
            } catch(e) {
                console.error('Time update error:', e);
            }
        }, 1000);
		
    },
    save: function() { try { GameState.lastSeen = Date.now(); localStorage.setItem('scriptorium_save_v6_4', JSON.stringify(GameState)); } catch(e){} },
    load: function() {
        try {
            const data = localStorage.getItem('scriptorium_save_v6_4');
            if (!data) return;
            
            const loadedState = JSON.parse(data);
            
            // Deep merge instead of Object.assign
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
            
            deepMerge(GameState, loadedState);
            console.log('✅ Save loaded successfully!');
            
        } catch(e) {
            console.error('❌ Load error:', e);
        }
    },
    
    exportSave: function() {
        try {
            const saveData = JSON.stringify(GameState, null, 2);
            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
            const filename = `scriptorium_save_${timestamp}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
            UI.notify(t('game.saveExported'));
            Game.addKronikaEntry('important', '💾 Hra uložena (export).', '💾 Game exported.', '💾 Opus conservatum est.');
            
        } catch(e) {
            UI.notify(t('game.saveExportFail'), true);
            console.error(e);
        }
    },
    
    importSave: function(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedState = JSON.parse(e.target.result);
                
                if(!importedState.inventory || !importedState.unlockedRecipes) {
                    throw new Error('Invalid save!');
                }
                
                if(!confirm(t('game.overwriteSave'))) {
                    return;
                }
                
                Object.assign(GameState, importedState);
                Game.save();
                
                UI.notify(t('game.saveImported'));
                    Game.addKronikaEntry('important', '📂 Hra načtena (import).', '📂 Game imported.', '📂 Opus recuperatum est.');
                setTimeout(() => location.reload(), 1500);
                
            } catch(err) {
                UI.notify(t('game.saveImportFail'), true);
                console.error(err);
            }
        };
        
        reader.readAsText(file);
    },
    
    triggerImport: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            if(e.target.files[0]) {
                Game.importSave(e.target.files[0]);
            }
        };
        input.click();
    },
    
    resetSave: function() { if(confirm(t('game.confirmReset'))) { try { localStorage.removeItem('scriptorium_save_v6_4'); } 	catch(e){} location.reload(); } },
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
    igniteFireplace: function() {
        if (!GameState.inventory['tinderbox']) { UI.notify(t('game.noTinderbox'), true); return; }
        this.removeItem('tinderbox', 1);
        const isFirstTime = !GameState.achievements?.stats?.fireplaceCount;
        GameState.flags.fireplaceLit = true;
        GameState.flags.forceDark = false;
        if(GameState.achievements) GameState.achievements.stats.fireplaceCount++;
        UI.notifyPanel(t('game.fireKindled'), 'system');
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
    farmAction: function(plotIdx) {
        const plot = GameState.garden[plotIdx];
        if(plot.locked) { UI.notify(t('game.plotLocked'), true); return; }
        
        if (plot.state === 0) {
            if (!(GameState.inventory['hoe'] > 0)) { UI.notify(t('game.needHoe'), true); return; }
            const fertItem = (GameState.inventory['compost'] > 0) ? 'compost' : 'bonemeal';
            if (!(GameState.inventory[fertItem] > 0)) { UI.notify(t('game.needFertilizer'), true); return; }
            this.removeItem(fertItem, 1); plot.state = 1;
        } else if (plot.state === 1) {
            // Determine what seeds to use based on cropType
            let seedsNeeded = '';
            if(plot.cropType === 'herb') seedsNeeded = 'seeds_herb';
            else if(plot.cropType === 'vegetable') seedsNeeded = 'seeds_vegetable';
            else if(plot.cropType === 'special') {
                // Special plot - can grow any herb type
                const available = ['seeds_yellow', 'seeds_blue', 'seeds_mint', 'seeds_thyme', 'seeds_hops', 'seeds_herb'].find(s => GameState.inventory[s] > 0);
                if(available) seedsNeeded = available;
            }
            
            if(!seedsNeeded || !(GameState.inventory[seedsNeeded] > 0)) { 
                UI.notify(t('game.needSeeds'), true); 
                return; 
            }
            
            this.removeItem(seedsNeeded, 1); 
            plot.state = 2; 
            
            // Determine crop based on seeds
            if(seedsNeeded === 'seeds_herb') plot.crop = 'herb_red';
            else if(seedsNeeded === 'seeds_vegetable') {
                const veggies = ['carrot', 'onion', 'potato'];
                plot.crop = veggies[Math.floor(Math.random() * veggies.length)];
            }
            else if(seedsNeeded === 'seeds_yellow') plot.crop = 'herb_yellow';
            else if(seedsNeeded === 'seeds_blue') plot.crop = 'herb_blue';
            else if(seedsNeeded === 'seeds_mint') plot.crop = 'mint';
            else if(seedsNeeded === 'seeds_thyme') plot.crop = 'thyme';
            else if(seedsNeeded === 'seeds_hops') plot.crop = 'hops';
            
            plot.plantedAt = Date.now();
        } else if (plot.state === 2 && !plot.water) {
            if (!(GameState.inventory['water'] > 0)) { UI.notify(t('game.needWater'), true); return; }
            this.removeItem('water', 1); plot.water = true;
        } else if (plot.state === 2 && plot.water) {
            // Calculate growth time with tech bonuses
            let growthSpeed = CONFIG.GROWTH_SPEED;
            if(GameState.researchedTechs.includes('tech_advanced_farming')) {
                growthSpeed *= 1.5; // +50% faster growth
            }
            const needed = CONFIG.BASE_GROWTH_TIME / growthSpeed;
            
            if (Date.now() > plot.plantedAt + needed) {
                plot.state = 0; plot.water = false; 
                const harvestCrop = plot.crop;
                plot.crop = null; 
                
                // Track harvest stat
                if(GameState.achievements) {
                    GameState.achievements.stats.harvests++;
                }
                
                // Harvest yields
                if(harvestCrop === 'herb_red') this.addItem('herb_red', 2);
                else if(harvestCrop === 'herb_yellow') this.addItem('herb_yellow', 2);
                else if(harvestCrop === 'herb_blue') this.addItem('herb_blue', 2);
                else if(harvestCrop === 'mint') this.addItem('mint', 2);
                else if(harvestCrop === 'thyme') this.addItem('thyme', 2);
                else if(harvestCrop === 'hops') { this.addItem('hops', 2); if(Math.random() > 0.6) this.addItem('seeds_hops', 1); }
                else if(['carrot','onion','potato'].includes(harvestCrop)) {
                    this.addItem(harvestCrop, 3);
                    // Chance to get seeds back
                    if(Math.random() > 0.5) this.addItem('seeds_vegetable', 1);
                }
                
                Game.checkAchievements();
            } else UI.notify(t('game.growing'), true);
        }
        Game.save(); UI.renderAll();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SAD (Pomarium) — herní logika
    // ═══════════════════════════════════════════════════════════════════════════

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
        const qty = (slot.treeType === 'seed_walnut' || slot.treeType === 'seed_sorb') ? 2 : 3;
        this.addItem(fruit, qty);
        // Lípa dává navíc lipový květ
        if (slot.treeType === 'seed_linden') this.addItem('linden_blossom', 1);
        // Pyl při každé sklizni
        this.addItem('pollen', 1);
        slot.lastHarvestAt = Date.now();
        Game.save();
        UI.renderOrchard();
        UI.notify('🍎 ' + t('game.treeHarvested').replace('{qty}', qty));
    },

    fellTree: function(slotIdx) {
        if (!GameState.orchard) return;
        const slot = GameState.orchard[slotIdx];
        if (slot.state === 'empty') return;
        // Kácení dá dřevo
        const woodQty = (slot.state === 'mature') ? 5 : 2;
        this.addItem('stick', woodQty);
        slot.state = 'empty';
        slot.treeType = null;
        slot.plantedAt = 0;
        slot.lastHarvestAt = 0;
        Game.save();
        UI.renderOrchard();
        UI.notify('🪓 ' + t('game.treeFelled').replace('{qty}', woodQty));
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
        this.removeItem('stick', 10);
        this.removeItem('rope', 5);
        hive.built          = true;
        hive.hasQueen       = false;
        hive.queenName      = null;
        hive.queenStrength  = 0;   // 1–5 hvězd, nastaví se při usazení matky
        hive.strength       = 0;   // 1–10 síla včelstva
        hive.varroaRisk     = false;
        hive.lastCollectAt  = 0;
        Game.save();
        UI.renderApiary();
        UI.notify('🪹 ' + t('game.hiveBuilt'));
    },

    addQueen: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || hive.hasQueen) return;
        if (!(GameState.inventory['queen_bee'] > 0)) { UI.notify(t('game.needQueen'), true); return; }
        this.removeItem('queen_bee', 1);
        hive.hasQueen      = true;
        hive.queenName     = this._randomQueenName();
        hive.queenStrength = Math.floor(Math.random() * 3) + 2; // 2–4 hvězdy (náhoda)
        hive.strength      = 3; // začíná na střední síle
        hive.varroaRisk    = false;
        hive.lastCollectAt = Date.now();
        Game.save();
        UI.renderApiary();
        UI.notify('🐝 ' + t('game.queenAdded') + ' — ' + hive.queenName);
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

        // Produkce dle sezóny a síly včelstva
        const strengthMod = (hive.strength || 3) / 5; // 0.2–2.0
        const honeyBase   = { spring: 1, summer: 3, autumn: 1 };
        const waxBase     = { spring: 1, summer: 1, autumn: 2 };
        const honeyYield  = Math.max(1, Math.round(honeyBase[season] * strengthMod));
        const waxYield    = Math.max(1, Math.round(waxBase[season] * strengthMod));

        this.addItem('honey', honeyYield);
        this.addItem('beeswax', waxYield);

        // Pyl bonus — jen léto, jen pokud kvetou záhony nebo sad
        if (season === 'summer') {
            const hasFlowers = GameState.garden && GameState.garden.some(p => p.state === 2 && p.water);
            const hasTrees   = GameState.orchard && GameState.orchard.some(s => s.state === 'mature');
            if (hasFlowers || hasTrees) this.addItem('pollen', 1);
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
            UI.renderApiary();
            UI.notify('🐝 ' + t('game.hiveRojivy'));
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
        if (!hive.built || !hive.hasQueen || !hive.varroaRisk) return;
        if ((GameState.inventory['thyme'] || 0) < 1) { UI.notify(t('game.hiveNeedThyme'), true); return; }
        this.removeItem('thyme', 1);
        hive.varroaRisk = false;
        hive.strength   = Math.max(1, (hive.strength || 3) - 1); // léčba stojí trochu síly
        Game.save();
        UI.renderApiary();
        UI.notify('🌿 ' + t('game.hiveTreated'));
    },

    // ── Zimní check (volá se 1× denně nebo při otevření Apiary) ───────────────
    checkApiaryWinter: function() {
        if (!GameState.apiary) return;
        const season = this._getApiarySeason();
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
        if (changed) { Game.save(); UI.renderApiary(); }
    },

    // ── Náhodný Varroa event (volá se z EventsSystem nebo manuálně) ──────────
    triggerVarroa: function(slotIdx) {
        if (!GameState.apiary) return;
        const hive = GameState.apiary[slotIdx];
        if (!hive.built || !hive.hasQueen || hive.varroaRisk) return;
        hive.varroaRisk = true;
        hive.strength   = Math.max(1, (hive.strength || 3) - 2);
        Game.save();
        UI.renderApiary();
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
        p.fry += qty;
        p.fryAddedAt = p.fryAddedAt || Date.now();
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
        p.fry = (p.fry||0) + qty;
        p.pendingFry = 0;
        if (!p.fryAddedAt || p.fryAddedAt === 0) p.fryAddedAt = Date.now();
        Game.save(); UI.renderPiscina();
        UI.notify('🫧 ' + t('game.fryTransferred').replace('{qty}', qty));
    },

    harvestCarp: function(qty) {
        const p = GameState.piscina;
        qty = Math.min(qty, p.carp);
        if (qty <= 0) { UI.notify(t('game.noCarp'), true); return; }
        p.carp -= qty;
        this.addItem('carp', qty);
        Game.save(); UI.renderPiscina();
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
        this.removeItem('rock', 15);
        this.removeItem('stick', 10);
        this.removeItem('rope', 3);
        h.built = true;
        Game.save(); UI.renderFarmyard();
        UI.notify('🐔 ' + t('game.hennhouseBuilt'));
    },

    addHen: function(type) {
        const h = GameState.henhouse;
        if (!h.built) return;
        if (type === 'rooster') {
            if (h.rooster) { UI.notify(t('game.roosterAlready'), true); return; }
            if (!(GameState.inventory['rooster'] > 0)) { UI.notify(t('game.needRooster'), true); return; }
            this.removeItem('rooster', 1);
            h.rooster = true;
        } else {
            if (h.hens.length >= 10) { UI.notify(t('game.hennsFull'), true); return; }
            if (!(GameState.inventory[type] > 0)) { UI.notify(t('game.needHen'), true); return; }
            this.removeItem(type, 1);
            h.hens.push({ type, addedAt: Date.now() });
        }
        Game.save(); UI.renderFarmyard();
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
        Game.save(); UI.renderFarmyard();
        UI.notify('🥚 ' + t('game.nestingStarted'));
    },

    slaughterChick: function(qty) {
        const h = GameState.henhouse;
        qty = Math.min(qty, h.chickPool);
        if (qty <= 0) { UI.notify(t('game.noChicks'), true); return; }
        h.chickPool -= qty;
        this.addItem('chicken_meat', qty);
        this.addItem('feather_hen', qty * 2);
        Game.save(); UI.renderFarmyard();
        UI.notify('🍗 ' + t('game.slaughtered').replace('{qty}', qty));
    },

    slaughterHen: function(idx) {
        const h = GameState.henhouse;
        if (!h.hens[idx]) return;
        h.hens.splice(idx, 1);
        this.addItem('chicken_meat', 2);
        this.addItem('feather_hen', 3);
        Game.save(); UI.renderFarmyard();
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
            if (eggs > 0) { this.addItem('egg', eggs); h.lastEggAt = now; collected = true; }
        }
        if (now >= h.lastFeatherAt + FEATH_INTERVAL) {
            this.addItem('feather_hen', h.hens.length);
            h.lastFeatherAt = now; collected = true;
        }
        if (collected) { Game.save(); UI.renderFarmyard(); UI.notify('🥚 ' + t('game.hennouseCollected')); }
        else UI.notify(t('game.hiveNotReady'), true);
    },

    feedHenhouse: function() {
        const h = GameState.henhouse;
        if (!h.built || h.hens.length === 0) return;
        const chickFeed = h.nesting && h.nesting.state === 'growing' ? Math.ceil(h.nesting.chicks / 2) : 0;
        const totalFeed = h.hens.length + chickFeed;
        const feedItem = (GameState.inventory['seeds_herb'] || 0) >= totalFeed ? 'seeds_herb' : 'seeds_vegetable';
        if ((GameState.inventory[feedItem] || 0) < totalFeed) { UI.notify(t('game.needFeedHen') + ' (' + totalFeed + ')', true); return; }
        this.removeItem(feedItem, totalFeed);
        h.lastFedAt = Date.now();
        Game.save(); UI.renderFarmyard();
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
        this.removeItem('rock', 20);
        this.removeItem('stick', 15);
        this.removeItem('rope', 5);
        s.built = true;
        Game.save(); UI.renderFarmyard();
        UI.notify('🐑 ' + t('game.sheepfoldBuilt'));
    },

    addSheep: function() {
        const s = GameState.sheepfold;
        if (!s.built) return;
        if (s.sheep >= 6) { UI.notify(t('game.sheepFull'), true); return; }
        if (!(GameState.inventory['sheep'] > 0)) { UI.notify(t('game.needSheep'), true); return; }
        this.removeItem('sheep', 1);
        s.sheep++;
        Game.save(); UI.renderFarmyard();
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
        Game.save(); UI.renderFarmyard();
        UI.notify('🐑 ' + t('game.breedingStarted'));
    },

    slaughterLamb: function(qty) {
        const s = GameState.sheepfold;
        qty = Math.min(qty, s.lambPool);
        if (qty <= 0) { UI.notify(t('game.noLambs'), true); return; }
        s.lambPool -= qty;
        this.addItem('mutton', qty * 2);
        this.addItem('lamb_hide', qty);
        Game.save(); UI.renderFarmyard();
        UI.notify('🥩 ' + t('game.lambSlaughtered').replace('{qty}', qty));
    },

    slaughterSheep: function() {
        const s = GameState.sheepfold;
        if (s.sheep <= 0) return;
        s.sheep--;
        this.addItem('mutton', 3);
        this.addItem('raw_hide', 1);
        Game.save(); UI.renderFarmyard();
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
            this.addItem('milk', s.sheep);
            s.lastMilkAt = now; collected = true;
        }
        if (now >= s.lastWoolAt + WOOL_INTERVAL) {
            this.addItem('wool', s.sheep);
            s.lastWoolAt = now; collected = true;
        }
        if (collected) { Game.save(); UI.renderFarmyard(); UI.notify('🐑 ' + t('game.sheepCollected')); }
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
        this.removeItem('fiber', fiberNeeded);
        this.removeItem('water', waterNeeded);
        s.lastFedAt = Date.now();
        s.lastWateredAt = Date.now();
        Game.save(); UI.renderFarmyard();
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

    scavenge: function(type) {
	    // === SPECIAL HANDLING FOR WELL === (PŘIDAT NA ZAČÁTEK)
		if (type === 'well_water') {
			// Check if well exists
			if (!GameState.well.built) {
				UI.notify(t('game.needWell'), true);
				return;
			}
			
			// Draw water with pot (default) or bucket
			const hasBucket = GameState.inventory.bucket && GameState.inventory.bucket > 0;
			this.drawWater(hasBucket);
			return;
		}
    // === END WELL HANDLING ===
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
                    if (r > 0.7) this.addItem('leather', 1); // 30% chance
                    // v7.5: NEW DROPS
                    if (r > 0.5) this.addItem('hide', 1); // 50% chance - for vellum
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
                    // Athanor: byliny
                    if(Math.random() < 0.08) this.addItem('chamomile', 1);
                    if(Math.random() < 0.05) this.addItem('st_johns_wort', 1);
                    if(Math.random() < 0.04) this.addItem('thyme', 1);
                    if(Math.random() < 0.03) this.addItem('seeds_thyme', 1);
                    if(Math.random() < 0.02) this.addItem('hops', 1);
                    if(Math.random() < 0.01) this.addItem('seeds_hops', 1);
                    
                    // Rare drop - Netolického pozůstalost (0.1% chance)
                    if(Math.random() < 0.001) {
                        this.addItem('netolicky_legacy', 1);
                        UI.notify(t('game.rareFind'));
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
                }
                else if (type === 'basic') {
                    this.addItem((r<0.5?'rock':'stick'), 1);
                    if(Math.random() < 0.05) this.addItem('carbon_black', 1);
                    if(Math.random() < 0.04) this.addItem('ochre', 1);
                    if(Math.random() < 0.10) this.addItem('chalk', 1);
                    // Iron ore — vzácný nález (3%) po odemčení kovařiny
                    if(Math.random() < 0.03 && GameState.researchedTechs && GameState.researchedTechs.includes('tech_kovarina')) {
                        this.addItem('iron_ore', 1);
                    }
                }
                else if (type === 'bark') { this.addItem('bark', 2); }
                else if (type === 'fishing') { this.addItem('fish', r<0.3?2:1); if(r>0.8) this.addItem('water', 1); }
                else if (type === 'foraging') { 
                    if(r<0.25) this.addItem('mushroom', 2);
                    else if(r<0.45) this.addItem('berries', 2);
                    else if(r<0.55) this.addItem('mushroom_poison', 1);
                    else if(r<0.7) this.addItem('roots', 1);
                    else if(r<0.8) this.addItem('seeds_vegetable', 1);
                    else if(r<0.9) this.addItem('nightshade', 1);
                    else this.addItem('fiber', 1);
                }
                else if (type === 'wetlands') {
                    if(r<0.4) this.addItem('frog', 1);
                    else if(r<0.7) this.addItem('slug', 2);
                    else if(r<0.85) this.addItem('water', 2);
                    else this.addItem('fiber', 1);
                    // v8.x: plůdek — vzácný nález v mokřadu
                    if(Math.random() < 0.08) this.addItem('fry', 1);
                }
                else if (type === 'resin_harvest') {
                    if(r<0.5) this.addItem('resin', 1);
                    else if(r<0.7) this.addItem('honey', 1);
                    else this.addItem('bark', 1);
                    if(Math.random() < 0.20) this.addItem('beeswax', 1);
                    if(Math.random() < 0.05) this.addItem('linden_blossom', 1);
                    if(Math.random() < 0.03) this.addItem('pollen', 1);
                }
                else if (type === 'grass_gather') {
                    this.addItem('grass', Math.random() < 0.5 ? 3 : 2);
                    if(Math.random() < 0.30) this.addItem('linden_blossom', 1);
                    if(Math.random() < 0.20) this.addItem('chamomile', 1);
                    if(Math.random() < 0.10) this.addItem('thyme', 1);
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
                else if (type === 'yard_cleanup') {
                    this.addItem('scraps', Math.random() < 0.5 ? 2 : 1);
                    if(Math.random() < 0.40) this.addItem('feather_hen', 1);
                    if(Math.random() < 0.30) this.addItem('wool', 1);
                    if(Math.random() < 0.20) this.addItem('egg', 1);
                    if(Math.random() < 0.10) this.addItem('pollen', 1);
                    if(Math.random() < 0.05) this.addItem('bone', 1);
                    // 0.5% — náhodný lostItem
                    if(Math.random() < 0.005) {
                        const lostPool = Object.entries(ItemsDB).filter(([id, i]) => i.lostItem).map(([id]) => id);
                        if(lostPool.length > 0) {
                            const found = lostPool[Math.floor(Math.random() * lostPool.length)];
                            this.addItem(found, 1);
                            UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                        }
                    }
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
                
                // Rare drop - Netolického pozůstalost (0.1% chance)
                if(Math.random() < 0.001) {
                    this.addItem('netolicky_legacy', 1);
                    UI.notify(t('game.rareFind'));
                }
            }
            else if (type === 'basic') { 
                this.addItem((r<0.5?'rock':'stick'), 1); 
                if(Math.random() < 0.10) this.addItem('chalk', 1);
            }
            // ── notifyAccum: quick scavenge ──
            {
                const _qgains = {};
                for (const k of Object.keys(GameState.inventory)) {
                    const diff = (GameState.inventory[k] || 0) - (_qbefore[k] || 0);
                    if (diff > 0) _qgains[k] = diff;
                }
                if (Object.keys(_qgains).length > 0) UI.notifyAccum(_qgains);
                else UI.notify(t('game.quickScavenge'));
            }
            Game._scavenging = false;
            Game.save(); UI.renderAll(); return;
        }
        if (GameState.activeAction) { UI.notify(t('game.busy'), true); return; }
        
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
        
        const durationMin = GameState.selectedDuration;
        if (durationMin === 0) {
            // ── snapshot pro single scavenge ──
            Game._scavenging = true;
            const _s0before = {};
            for (const k of Object.keys(GameState.inventory)) _s0before[k] = GameState.inventory[k] || 0;
            let r = Math.random();
            if (type === 'hunt') { 
                this.addItem('fat', 1); 
                this.addItem('meat', 1); 
                if (r > 0.4) this.addItem('bone', 1);
                if (r > 0.7) this.addItem('leather', 1); // 30% chance
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
                // Athanor: byliny
                if(Math.random() < 0.08) this.addItem('chamomile', 1);
                if(Math.random() < 0.05) this.addItem('st_johns_wort', 1);
                if(Math.random() < 0.04) this.addItem('thyme', 1);
                if(Math.random() < 0.03) this.addItem('seeds_thyme', 1);
                if(Math.random() < 0.02) this.addItem('hops', 1);
                if(Math.random() < 0.01) this.addItem('seeds_hops', 1);
                
                // Rare drop - Netolického pozůstalost (0.1% chance)
                if(Math.random() < 0.001) {
                    this.addItem('netolicky_legacy', 1);
                    UI.notify(t('game.rareFind'));
                }
            }
            else if (type === 'basic') {
                this.addItem((r<0.5?'rock':'stick'), 1);
                if(Math.random() < 0.05) this.addItem('carbon_black', 1);
                if(Math.random() < 0.04) this.addItem('ochre', 1);
                if(Math.random() < 0.10) this.addItem('chalk', 1); // Křídová pánev — lokálně dostupná
            }
            else if (type === 'bark') { this.addItem('bark', 2); }
            else if (type === 'fishing') { this.addItem('fish', r<0.3?2:1); if(r>0.8) this.addItem('water', 1); }
            else if (type === 'foraging') { 
                if(r<0.25) this.addItem('mushroom', 2);
                else if(r<0.45) this.addItem('berries', 2);
                else if(r<0.55) this.addItem('mushroom_poison', 1);
                else if(r<0.7) this.addItem('roots', 1);
                else if(r<0.8) this.addItem('seeds_vegetable', 1);
                else if(r<0.9) this.addItem('nightshade', 1);
                else this.addItem('fiber', 1);
            }
            else if (type === 'wetlands') {
                if(r<0.4) this.addItem('frog', 1);
                else if(r<0.7) this.addItem('slug', 2);
                else if(r<0.85) this.addItem('water', 2);
                else this.addItem('fiber', 1);
            }
            else if (type === 'resin_harvest') {
                if(r<0.5) this.addItem('resin', 1);
                else if(r<0.7) this.addItem('honey', 1);
                else this.addItem('bark', 1);
                if(Math.random() < 0.15) this.addItem('beeswax', 1);
            }
            else if (type === 'grass_gather') {
                this.addItem('grass', Math.random() < 0.5 ? 3 : 2);
                if(Math.random() < 0.30) this.addItem('linden_blossom', 1);
                if(Math.random() < 0.20) this.addItem('chamomile', 1);
                if(Math.random() < 0.10) this.addItem('thyme', 1);
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
            else if (type === 'yard_cleanup') {
                this.addItem('scraps', Math.random() < 0.5 ? 2 : 1);
                if(Math.random() < 0.40) this.addItem('feather_hen', 1);
                if(Math.random() < 0.30) this.addItem('wool', 1);
                if(Math.random() < 0.20) this.addItem('egg', 1);
                if(Math.random() < 0.10) this.addItem('pollen', 1);
                if(Math.random() < 0.05) this.addItem('bone', 1);
                if(Math.random() < 0.005) {
                    const lostPool = Object.entries(ItemsDB).filter(([id, i]) => i.lostItem).map(([id]) => id);
                    if(lostPool.length > 0) {
                        const found = lostPool[Math.floor(Math.random() * lostPool.length)];
                        this.addItem(found, 1);
                        UI.notify('🔍 ' + (iName ? iName(found) : found) + '!');
                    }
                }
            }
            // ── notifyAccum: single scavenge ──
            {
                const _s0gains = {};
                for (const k of Object.keys(GameState.inventory)) {
                    const diff = (GameState.inventory[k] || 0) - (_s0before[k] || 0);
                    if (diff > 0) _s0gains[k] = diff;
                }
                if (Object.keys(_s0gains).length > 0) UI.notifyAccum(_s0gains);
            }
            Game._scavenging = false;
            if (_usedToolId) Game.useToolCharge(_usedToolId);
            Game.save(); UI.renderAll(); return;
            
            // Apply tool multiplier
            if (_toolMult !== 1.0) multiplier = Math.round(multiplier * _toolMult);

            // ========== NEW: Apply canonical hours foraging buff ==========
            if (typeof CanonicalHours !== 'undefined') {
                const foragingMult = CanonicalHours.getForagingMultiplier();
                multiplier = Math.floor(multiplier * foragingMult);
            }
            
            GameState.activeAction = { id: type, startTime: Date.now(), endTime: Date.now() + (durationMin * 60 * 1000), multiplier: multiplier };
            Game.save(); UI.renderActions();
        }
    },
    checkEnvironment: function() {
        const container = document.getElementById('game-container');
        const fpCard = document.getElementById('card-fireplace');
        const navHome = document.getElementById('nav-home');
        const btnIgnite = document.getElementById('btn-ignite');
        if (GameState.flags.fireplaceLit) {
            fpCard.classList.add('fireplace-active'); navHome.classList.add('nav-fire-active');
            document.getElementById('fireplace-title').innerText = t('fireplace.lit');
            document.getElementById('fireplace-desc').innerText = t('fireplace.litDesc');
            btnIgnite.style.display = 'none';
        } else {
            // Hint pro nové hráče: krb nebyl nikdy rozžéhnut
            const neverLit = !(GameState.achievements?.stats?.fireplaceCount);
            btnIgnite.classList.toggle('btn-ignite--hint', neverLit);
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
            UI.notify(t('game.newCodexEntry'));
            Game.addKronikaEntry('important', '📜 Nový zápis v Codexu.', '📜 New entry in the Codex.', '📜 Nova inscriptio in Codice.');
            setTimeout(() => UI.notify(t('game.itemAdded').replace('{qty}', qty).replace('{item}', iName(id))), 500);
        } else {
            if (!Game._scavenging) UI.notify(t('game.itemAdded').replace('{qty}', qty).replace('{item}', iName(id)));
        }
        
        if (!Game._scavenging) { Game.save(); Game.checkEnvironment(); UI.renderAll(); }
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

        // maxStack check — iron nástroje max 1 ks
        const outItem = ItemsDB[r.output];
        if (outItem && outItem.maxStack) {
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
        for(let [item, amt] of Object.entries(r.req)) if(amt > 0) this.removeItem(item, amt);

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
        // Analytics – zaznamenej craft
        const craftedItem = ItemsDB[r.output];
        if (craftedItem) Analytics.itemCrafted(r.output, craftedItem.name, craftedItem.type);
        // Speciálně pro research
        if (r.output === 'research') {
            Analytics.researchCrafted((GameState.inventory['research'] || 0) + craftQty);
        }

        // 👿 TITIVILLUS – démon překlepů
        // Sbírá chyby z lore itemů (papír, inkoust, zápisky)
        // Vyšší šance v noci bez světla
        if (['paper', 'ink', 'research'].includes(r.output)) {
            const isNight = !TimeSys.isDaytime();
            const noLight = !GameState.flags.candleLit && !GameState.flags.torchLit;
            const chance = (isNight && noLight) ? 0.08 : 0.03;
            if (Math.random() < chance) {
                this.removeItem(r.output, r.qty); // ukradne výstup
                Analytics.titivillusStruck(r.output, isNight && noLight);
                const quotes = t('titivillus');
                UI.notify(quotes[Math.floor(Math.random() * quotes.length)], true);
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
        if((GameState.inventory['research'] || 0) < tech.cost) { UI.notify(t('game.notEnoughResearch'), true); return; }
        
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
                const _rn = _ri ? _ri.name : rid;
                const _rne = _ri ? (_ri.name_en || _ri.name) : rid;
                Game.addKronikaEntry('important', `📋 Nová receptura: ${_rn}`, `📋 New recipe: ${_rne}`, `📋 Nova formula: ${_rn}`);
            }
        });
        Analytics.techUnlocked(id, tech.name, tech.cost);
        
        // Special unlocks
        if(id === 'tech_garden_expand') {
            GameState.garden[2].locked = false;
            GameState.garden[3].locked = false;
        }
        if(id === 'tech_garden_expand_2') {
            if(GameState.garden[4]) GameState.garden[4].locked = false;
            if(GameState.garden[5]) GameState.garden[5].locked = false;
        }
        if(id === 'tech_garden_expand_3') {
            if(GameState.garden[6]) GameState.garden[6].locked = false;
            if(GameState.garden[7]) GameState.garden[7].locked = false;
        }
        
        UI.notifyPanel(`📜 ${t('game.crafted')} ${lang==='en'?(tech.name_en||tech.name):tech.name}`, 'system');
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
        if(!item || item.type !== 'food') { UI.notify(t('game.notFood'), true); return; }
        if(!(GameState.inventory[foodId] > 0)) { UI.notify(t('game.noFood'), true); return; }
        
        this.removeItem(foodId, 1);
        let hungerHours = item.hunger || 6;
        
        // Tech bonus: Preservation doubles food duration
        if(GameState.researchedTechs.includes('tech_preservation')) {
            hungerHours *= 2;
        }
        
        GameState.hunger.fed = true;
        GameState.hunger.lastMeal = Date.now();
        GameState.hunger.duration = hungerHours * 60 * 60 * 1000;
        
        // Track meals eaten
        if(GameState.achievements) {
            GameState.achievements.stats.mealsEaten++;
        }
        
        const bonusText = GameState.researchedTechs.includes('tech_preservation') ? ' (2x konzervace!)' : '';
        UI.notify(t('game.fed').replace('{hours}', hungerHours).replace('{bonus}', bonusText));
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
            if(GameState.hunger.fed) {
                GameState.achievements.stats.daysWithoutHunger++;
            } else {
                GameState.achievements.stats.daysWithoutHunger = 0; // Reset streak
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
        
        // Calculate bonus
        let bonus = 1; // Base daily bonus
        let bonusText = "+1 Research";
        let streakBonus = false;
        
        if (GameState.dailyRewards.streak === 3) {
            bonus = 2;
            bonusText = "+2 Research (3 dny streak!)";
            streakBonus = true;
        } else if (GameState.dailyRewards.streak === 7) {
            bonus = 3;
            bonusText = "+3 Research (7 dní streak! 🎉)";
            streakBonus = true;
        } else if (GameState.dailyRewards.streak >= 10) {
            bonus = 3;
            bonusText = "+3 Research (Mistr věrnosti!)";
            streakBonus = true;
        }
        
        // Grant bonus
        // ========== NEW: Apply canonical hours research buff ==========
        if (typeof CanonicalHours !== 'undefined') {
            const researchMult = CanonicalHours.getResearchMultiplier();
            bonus = Math.floor(bonus * researchMult);
        }
        
        this.addItem('research', bonus);
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
        
        // Show notifications for new achievements
        if(newUnlocks.length > 0) {
            newUnlocks.forEach(ach => {
                setTimeout(() => {
                    UI.notifyPanel(`🏆 Achievement: ${_an}!`, 'system');
                    Analytics.achievementUnlocked(ach.id, ach.name);
                    const _an = typeof LangSystem !== 'undefined' && LangSystem.current === 'en' ? (ach.name_en || ach.name) : ach.name;
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

	drawWater: function(useBucket = false) {
		if (!GameState.well.built) {
			UI.notify(t('game.wellNoWell'), true);
			return;
		}
		
		if (GameState.well.condition === "broken") {
			UI.notify(t('game.wellBroken'), true);
			return;
		}
		
		// Check tool
		const tool = useBucket ? "bucket" : "cooking_pot";
		if (!GameState.inventory[tool] || GameState.inventory[tool] <= 0) {
			UI.notify(t('game.needItemAmt').replace('{amt}', 1).replace('{item}', ItemsDB[tool].name), true);
			return;
		}
		
		// Get water amount
		const level = GameState.well.level;
		const stats = this.getWellStats(level);
		let waterAmount = useBucket ? stats.waterPerUseBucket : stats.waterPerUse;
		
		// Dirty penalty
		if (GameState.well.condition === "dirty") {
			waterAmount = Math.floor(waterAmount * 0.5);
			UI.notify(t('game.wellMurky'));
		}
		
		// Special: Blessed well může dát holy water
		if (level === "blessed" && Math.random() < 0.2) {
			this.addItem("holy_water", 1);
			UI.notify(t('game.wellHolyWater'));
		} else {
			this.addItem("water", waterAmount);
			UI.notify(t('game.waterDrawn').replace('{amt}', waterAmount));
		}
		
		// Degradace check
		this.checkWellDegradation();
		GameState.well.lastUse = Date.now();
		
		// Track well uses
		if(GameState.achievements) {
			GameState.achievements.stats.wellUses++;
		}
		
		this.save();
		UI.renderAll();
	},

	cleanWell: function() {
		if (GameState.well.condition !== "dirty") {
			UI.notify(t('game.wellNotDirty'), true);
			return;
		}
		
		if (!GameState.inventory.purification_powder || GameState.inventory.purification_powder < 1) {
			UI.notify(t('game.wellNoPowder'), true);
			return;
		}
		
		this.addItem("purification_powder", -1);
		GameState.well.condition = "clean";
		
		// Track well cleans
		if(GameState.achievements) {
			GameState.achievements.stats.wellCleans++;
		}
		
		UI.notify(t('game.wellCleaned'));
		this.save();
		UI.renderAll();
	},

	repairWell: function() {
		if (GameState.well.condition !== "broken") {
			UI.notify(t('game.wellNotBroken'), true);
			return;
		}
		
		if (!GameState.inventory.repair_kit || GameState.inventory.repair_kit < 1) {
			UI.notify(t('game.wellNoKit'), true);
			return;
		}
		
		this.addItem("repair_kit", -1);
		GameState.well.condition = "clean";
		UI.notify(t('game.wellRepaired'));
		Game.addKronikaEntry('important', '🪣 Studna opravena.', '🪣 The well has been repaired.', '🪣 Puteus reparatus est.');
		this.save();
		UI.renderAll();
	},

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
		if (!GameState.storage) GameState.storage = { almarium: {built:false}, cella: {built:false}, horreum: {built:false} };
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
		};
		const cost = costs[type];
		if (!cost) return;
		for (const [item, amt] of Object.entries(cost)) {
			if ((GameState.inventory[item] || 0) < amt) {
				const itemName = (typeof iName === 'function') ? iName(item) : item;
				UI.notify((lang==='en'?'Not enough: ':'Nedostatek: ')+itemName+' x'+amt, true); return;
			}
		}
		for (const [item, amt] of Object.entries(cost)) { this.removeItem(item, amt); }
		GameState.storage[type].built = true;
		Game.save();
		const names = { almarium: 'Almarium', cella: 'Cella', horreum: 'Horreum' };
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

	upgradeWell: function(toLevel) {
		const recipeMap = {
			"basic": "well_basic",
			"stone": "well_upgrade_stone"
		};
		
		const recipeId = recipeMap[toLevel];
		if (!recipeId) return;
		
		// Check if we can build/upgrade
		if (toLevel === "basic" && GameState.well.built) {
			UI.notify(t('game.wellAlreadyBuilt'), true);
			return;
		}
		
		if (toLevel === "stone" && GameState.well.level !== "basic") {
			UI.notify(t('game.wellNeedBasic'), true);
			return;
		}
		
		// Build basic well
		if (toLevel === "basic") {
			const cost = { rock: 20, stick: 10, rope: 3 };
			
			for (let [item, amt] of Object.entries(cost)) {
				if (!GameState.inventory[item] || GameState.inventory[item] < amt) {
					UI.notify(t('game.needItemAmt').replace('{amt}', amt).replace('{item}', ItemsDB[item].name), true);
					return;
				}
			}
			
			// Consume materials
			for (let [item, amt] of Object.entries(cost)) {
				this.addItem(item, -amt);
			}
			
			GameState.well.built = true;
			GameState.well.level = "basic";
			GameState.well.condition = "clean";
			UI.notify(t('game.wellBuilt'));
			Game.addKronikaEntry('important', '🪣 Studna postavena.', '🪣 The well has been built.', '🪣 Puteus aedificatus est.');
			this.save();
			UI.renderAll();
			return;
		}
		
		// Upgrade to stone
		if (toLevel === "stone") {
			const cost = { rock: 30, rope: 5, charcoal: 10 };
			
			for (let [item, amt] of Object.entries(cost)) {
				if (!GameState.inventory[item] || GameState.inventory[item] < amt) {
					UI.notify(t('game.needItemAmt').replace('{amt}', amt).replace('{item}', ItemsDB[item].name), true);
					return;
				}
			}
			
			for (let [item, amt] of Object.entries(cost)) {
				this.addItem(item, -amt);
			}
			
			GameState.well.level = "stone";
			UI.notify(t('game.wellUpgraded'));
			this.save();
			UI.renderAll();
		}
	},

	checkWellDegradation: function() {
		const stats = this.getWellStats(GameState.well.level);
		
		// Dirty check
		if (GameState.well.condition === "clean" && Math.random() < stats.degradeChance) {
			GameState.well.condition = "dirty";
			UI.notify(t('game.wellTurningGreen'), true);
		}
		
		// Break check (pouze pokud už je dirty)
		if (GameState.well.condition === "dirty" && Math.random() < stats.breakChance) {
			GameState.well.condition = "broken";
			Game.addKronikaEntry('important', '🪣 Studna se zřítila!', '🪣 The well has collapsed!', '🪣 Puteus corruit!');
			UI.notify(t('game.wellCollapsed'), true);
		}
	},

	getWellStats: function(level) {
		const defaultStats = {
			waterPerUse: 3,
			waterPerUseBucket: 5,
			degradeChance: 0.08,
			breakChance: 0.03
		};
		
		const stats = {
			"basic": {
				waterPerUse: 3,
				waterPerUseBucket: 5,
				degradeChance: 0.15,
				breakChance: 0.05
			},
			"stone": {
				waterPerUse: 4,
				waterPerUseBucket: 8,
				degradeChance: 0.05,
				breakChance: 0.02
			},
			"blessed": {
				waterPerUse: 5,
				waterPerUseBucket: 10,
				degradeChance: 0.01,
				breakChance: 0.0,
				holyWaterChance: 0.2
			}
		};
		
		return stats[level] || defaultStats;
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