const Game = {
    _scavenging: false,
    init: function() {
        Game.load();

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
                    lastTrade: 0
                }
            };
        }
		// Initialize well if not present (přesun do WellSystem._ensureState)
		WellSystem._ensureState();

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
                    // Studna — časová degradace (self-guarded 24h, grace 5 dní)
                    if (typeof WellSystem !== 'undefined' && WellSystem.dailyTick) WellSystem.dailyTick();
                    // Terrain — regen únavy krajiny (self-guarded 10 min)
                    if (typeof TerrainSystem !== 'undefined') TerrainSystem.tick();
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

            // Sync: retroaktivně doplnit unlocks z hotových techů (řeší unlocks přidané po researchi)
            this.syncTechUnlocks();
            
        } catch(e) {
            console.error('❌ Load error:', e);
        }
    },
    
    
    resetSave: function() { if(confirm(t('game.confirmReset'))) { try { localStorage.removeItem('scriptorium_save_v6_4'); } 	catch(e){} location.reload(); } },

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
        // Klíče 4× — odemknou folia epistola/fausto/palimpsest/titivillus postupně
        const key4Folios = ['folio_epistola','folio_fausto','folio_palimpsest','folio_titivillus'];

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

    farmAction: function(plotIdx) {
        const plot = GameState.garden[plotIdx];
        if(plot.locked) { UI.notify(t('game.plotLocked'), true); return; }
        
        if (plot.state === 0) {
            if (!(GameState.inventory['hoe'] > 0)) { UI.notify(t('game.needHoe'), true); return; }
            const fertItem = (GameState.inventory['compost'] > 0) ? 'compost' : 'bonemeal';
            if (!(GameState.inventory[fertItem] > 0)) { UI.notify(t('game.needFertilizer'), true); return; }
            this.removeItem(fertItem, 1); plot.state = 1;
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
            if (!(GameState.inventory['water'] > 0)) { UI.notify(t('game.needWater'), true); return; }
            this.removeItem('water', 1); plot.water = true;
        } else if (plot.state === 2 && plot.water) {
            // Calculate growth time with tech bonuses
            let growthSpeed = CONFIG.GROWTH_SPEED;
            if(GameState.researchedTechs.includes('tech_advanced_farming')) {
                growthSpeed *= 2.0; // +100% faster growth (24h → 12h)
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
                
                // Harvest yields — via GARDEN_PLANTS_DB
                const _gp = typeof GardenSystem !== 'undefined'
                    ? Object.values(GardenSystem.GARDEN_PLANTS_DB).find(p => p.item === harvestCrop)
                    : null;
                if (_gp) {
                    this.addItem(harvestCrop, _gp.yield);
                    // Šance vrátit semínko (30%)
                    if (Math.random() < 0.3) this.addItem(_gp.seed, 1);
                } else if(harvestCrop === 'hops') {
                    this.addItem('hops', 2);
                    if(Math.random() > 0.6) this.addItem('seeds_hops', 1);
                } else if(['carrot','onion','potato'].includes(harvestCrop)) {
                    this.addItem(harvestCrop, 3);
                    if(Math.random() > 0.5) this.addItem('seeds_vegetable', 1);
                } else if (harvestCrop) {
                    // fallback pro neznámé plodiny
                    this.addItem(harvestCrop, 2);
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
        // Vigor — Fatigue z akce (scavenge vždy dostupné, jen malý cost)
        if (typeof VigorSystem !== 'undefined') VigorSystem.onScavenge(type);

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
                const _invBefore = {};
                for (const k of Object.keys(GameState.inventory)) _invBefore[k] = GameState.inventory[k] || 0;
                if (type === 'quarry_stone') {
                    const qty = Math.random() < 0.4 ? 6 : (Math.random() < 0.6 ? 4 : 3);
                    this.addItem('rock', Math.round(qty * _mMultC));
                    if (Math.random() < 0.15) this.addItem('cut_stone', 1);
                    if (Math.random() < 0.05) this.addItem('clay', 1);
                } else if (type === 'mine_iron_ore') {
                    const qty = Math.random() < 0.4 ? 3 : (Math.random() < 0.6 ? 2 : 1);
                    this.addItem('iron_ore', Math.round(qty * _mMultC));
                    if (Math.random() < 0.20) this.addItem('charcoal', 1);
                    if (Math.random() < 0.05) this.addItem('rock', 2);
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
                UI.notify(lang === 'en' ? '❌ Requires a pickaxe.' : '❌ Vyžaduje krumpáč.', true);
                return;
            }
            const _mMult = (_mFound && _mFound.mult) ? _mFound.mult : 1.0;
            const _mMultiplier = Math.round(8 * _mMult);
            // Koně zrychlují Mine (tažná síla při dopravě rubaniny)
            const _horseCount = (GameState.stable && GameState.stable.animals) ? GameState.stable.animals.length : 0;
            const _horseTimeMult = _horseCount >= 2 ? 0.5 : _horseCount === 1 ? 0.75 : 1.0;
            const _mineMs = Math.round(5 * 60 * 1000 * _horseTimeMult);
            GameState.activeAction = { id: type, startTime: Date.now(), endTime: Date.now() + _mineMs, multiplier: _mMultiplier };
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
                    // v8.x: Nové byliny — šalvěj, fenykl, pelyněk, yzop, řebříček
                    if(Math.random() < 0.03) this.addItem('sage', 1);
                    if(Math.random() < 0.02) this.addItem('fennel', 1);
                    if(Math.random() < 0.03) this.addItem('wormwood', 1);
                    if(Math.random() < 0.04) this.addItem('yarrow', 1);
                    if(Math.random() < 0.02) this.addItem('hyssop', 1);
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
                    if(Math.random() < 0.02) this.addItem('viticis_baco', 1);
                    // v8.x: Zelenina a koření při sběru potravy
                    if(Math.random() < 0.05) this.addItem('garlic', 1);
                    if(Math.random() < 0.04) this.addItem('leek', 1);
                    if(Math.random() < 0.04) this.addItem('nettle', 1);
                    if(Math.random() < 0.03) this.addItem('seeds_garlic', 1);
                    if(Math.random() < 0.02) this.addItem('seeds_nettle', 1);
                    // Žaludy — podzimní nález
                    if(Math.random() < 0.12) this.addItem('acorn', 1);
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
                    if(Math.random() < 0.03) this.addItem('viticis_baco', 1);
                }
                else if (type === 'grass_gather') {
                    this.addItem('grass', Math.random() < 0.5 ? 3 : 2);
                    if(Math.random() < 0.30) this.addItem('linden_blossom', 1);
                    if(Math.random() < 0.20) this.addItem('chamomile', 1);
                    if(Math.random() < 0.10) this.addItem('thyme', 1);
                    if(Math.random() < 0.08) this.addItem('yarrow', 1);
                    if(Math.random() < 0.05) this.addItem('wormwood', 1);
                    if(Math.random() < 0.04) this.addItem('sage', 1);
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
                    UI.notifyPanel('📜 ' + (typeof t === 'function' ? t('game.rareFind') : 'Vzácný nález!'), 'system');
                    setTimeout(function() { Game.showNetolickyModal(); }, 300);
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
        
        const durationMin = action.collectMode ? 5 : GameState.selectedDuration;
        if (durationMin === 0) {
            // Únava krajiny — instant klik (jen terénní akce)
            if (typeof TerrainSystem !== 'undefined' && TerrainSystem.isTerrainAction(type)) TerrainSystem.onScavenge(0);
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
                // v8.x: Nové byliny
                if(Math.random() < 0.03) this.addItem('sage', 1);
                if(Math.random() < 0.02) this.addItem('fennel', 1);
                if(Math.random() < 0.03) this.addItem('wormwood', 1);
                if(Math.random() < 0.04) this.addItem('yarrow', 1);
                if(Math.random() < 0.02) this.addItem('hyssop', 1);
                if(Math.random() < 0.015) this.addItem('seeds_sage', 1);
                if(Math.random() < 0.010) this.addItem('seeds_wormwood', 1);
                if(Math.random() < 0.020) this.addItem('seeds_yarrow', 1);
                // Rare drop - Netolického pozůstalost (0.1% chance)
                if(Math.random() < 0.001) {
                    this.addItem('netolicky_legacy', 1);
                    UI.notifyPanel('📜 ' + (typeof t === 'function' ? t('game.rareFind') : 'Vzácný nález!'), 'system');
                    setTimeout(function() { Game.showNetolickyModal(); }, 300);
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
                if(Math.random() < 0.02) this.addItem('viticis_baco', 1);
                // v8.x: Zelenina a koření
                if(Math.random() < 0.05) this.addItem('garlic', 1);
                if(Math.random() < 0.04) this.addItem('leek', 1);
                if(Math.random() < 0.04) this.addItem('nettle', 1);
                if(Math.random() < 0.03) this.addItem('seeds_garlic', 1);
                if(Math.random() < 0.02) this.addItem('seeds_nettle', 1);
                // Žaludy
                if(Math.random() < 0.12) this.addItem('acorn', 1);
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
                if(Math.random() < 0.03) this.addItem('viticis_baco', 1);
            }
            else if (type === 'grass_gather') {
                this.addItem('grass', Math.random() < 0.5 ? 3 : 2);
                if(Math.random() < 0.30) this.addItem('linden_blossom', 1);
                if(Math.random() < 0.20) this.addItem('chamomile', 1);
                if(Math.random() < 0.10) this.addItem('thyme', 1);
                if(Math.random() < 0.08) this.addItem('yarrow', 1);
                if(Math.random() < 0.05) this.addItem('wormwood', 1);
                if(Math.random() < 0.04) this.addItem('sage', 1);
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
                const _terrainMult = (typeof TerrainSystem !== 'undefined' && TerrainSystem.isTerrainAction(type)) ? TerrainSystem.getMult() : 1.0;
                const _prevTier = (GameState.terrain && GameState.terrain.lastToastTier) || 0;
                for (const k of Object.keys(GameState.inventory)) {
                    const diff = (GameState.inventory[k] || 0) - (_s0before[k] || 0);
                    if (diff > 0) {
                        // Aplikovat terrain mult — min 1 aby hráč vždy něco dostal
                        const reduced = _terrainMult >= 1.0 ? diff : Math.max(1, Math.round(diff * _terrainMult));
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
                // Reset tier při zotavení (regen sníží fatigue)
                if (typeof TerrainSystem !== 'undefined' && _terrainMult >= 1.0 && _prevTier > 0) {
                    if (GameState.terrain) GameState.terrain.lastToastTier = 0;
                }
                if (Object.keys(_s0gains).length > 0) UI.notifyAccum(_s0gains);
            }
            Game._scavenging = false;
            if (_usedToolId) Game.useToolCharge(_usedToolId);
            Game.save(); UI.renderAll(); return;
        } else {
            // TIMED scavenge — tabulka výnosů dle délky
            let multiplier = durationMin === 1  ? 8
                           : durationMin === 5  ? 30
                           : durationMin === 10 ? 50
                           : durationMin === 20 ? 90
                           : durationMin === 30 ? 120
                           : 8;

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

        // ── RESEARCH: Vigor gate (před odebráním surovin) ───────────────────
        if (r.output === 'research') {
            if (typeof VigorSystem !== 'undefined' && !VigorSystem.canResearch()) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notify(lang === 'en'
                    ? '😵 Too tired to write. Eat something or rest first. (Vigor < 20)'
                    : '😵 Příliš unaven na psaní. Nejdříve se najedz nebo odpočiň. (Vigor < 20)', true);
                return;
            }
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
        if (typeof VigorSystem !== 'undefined' && !VigorSystem.canResearch()) { UI.notify(t('game.vigor.researchBlock'), true); return; }
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
        if(!item || item.type !== 'food') { UI.notify(t('game.notFood'), true); return; }
        if(!(GameState.inventory[foodId] > 0)) { UI.notify(t('game.noFood'), true); return; }

        this.removeItem(foodId, 1);

        // Vigor systém v2 — VigorSystem.eat() zpracuje Satiety + Fatigue
        if (typeof VigorSystem !== 'undefined') {
            VigorSystem.eat(foodId);
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
        const drinkable = ['water', 'spring_water'];
        if (!drinkable.includes(itemId)) { UI.notify(t('game.notFood'), true); return; }
        if (!(GameState.inventory[itemId] > 0)) { UI.notify(t('game.noFood'), true); return; }
        this.removeItem(itemId, 1);
        if (typeof VigorSystem !== 'undefined') VigorSystem.eat(itemId);
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
			{ key: 'henhouse',  built: GameState.henhouse && GameState.henhouse.built && GameState.henhouse.hens && GameState.henhouse.hens.length > 0, feed: 'grain', feedAmt: 1, name: lang==='en'?'Hens':'Slepice' },
			{ key: 'sheepfold', built: GameState.sheepfold && GameState.sheepfold.built && GameState.sheepfold.sheep && GameState.sheepfold.sheep.length > 0, feed: 'hay', feedAmt: 1, name: lang==='en'?'Sheep':'Ovce' },
			{ key: 'piscina',   built: GameState.piscina && GameState.piscina.tier > 0, feed: 'worms', feedAmt: 1, name: lang==='en'?'Fish':'Ryby' },
			{ key: 'rabbitry',  built: GameState.rabbitry && GameState.rabbitry.built && GameState.rabbitry.animals && GameState.rabbitry.animals.length > 0, feed: 'scraps', fallback: 'hay', feedAmt: 1, name: lang==='en'?'Rabbits':'Králíci' },
			{ key: 'goatpen',   built: GameState.goatpen && GameState.goatpen.built && GameState.goatpen.animals && GameState.goatpen.animals.length > 0, feed: 'hay', fallback: 'scraps', feedAmt: 1, name: lang==='en'?'Goats':'Kozy' },
			{ key: 'pigsty',    built: GameState.pigsty && GameState.pigsty.built && GameState.pigsty.animals && GameState.pigsty.animals.length > 0, feed: 'scraps', fallback: 'grain', feedAmt: 2, name: lang==='en'?'Pigs':'Prasata' },
		];
		animals.forEach(a => {
			if (!a.built) return;
			if (!GameState.feeding[a.key]) GameState.feeding[a.key] = { lastFed: now, hunger: 0 };
			const hoursSinceFed = (now - GameState.feeding[a.key].lastFed) / 3600000;
			if (hoursSinceFed >= 24) {
				// Zkus primární krmivo, pak fallback
				const primaryHave = GameState.inventory[a.feed] || 0;
				const fallbackHave = a.fallback ? (GameState.inventory[a.fallback] || 0) : 0;
				const useFeed = primaryHave >= a.feedAmt ? a.feed : (a.fallback && fallbackHave >= a.feedAmt ? a.fallback : null);
				if (useFeed) {
					Game.removeItem(useFeed, a.feedAmt);
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
		const names = {
			almarium: 'Almarium', cella: 'Cella', horreum: 'Horreum',
			fabrica: 'Fabrica', sulci: 'Sulci', humno: 'Humno',
			vinea: 'Vinea', prelum: 'Prelum', cella_fermentaria: 'Cella fermentaria',
			foudres: 'Foudres', cellarium_vini: 'Cellarium Vini',
			uvarium: 'Uvarium', prelum_olei: 'Prelum Olei',
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