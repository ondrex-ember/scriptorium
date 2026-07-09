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
                    // Vitrea — startovní pool (jednorázově) + denní opotřebení vybavení (self-guarded 24h)
                    if (typeof Game !== 'undefined' && Game.vitreaGrantStartPool) { Game.vitreaGrantStartPool(); Game.vitreaWearTick(); }
                    // Templum — viditelnost tabu dle mnišského ranku (levný DOM check)
                    if (typeof TemplumSystem !== 'undefined' && TemplumSystem.updateTabVisibility) TemplumSystem.updateTabVisibility();
                    // Templum — denní chod kostela (self-guarded 24h, gate frater+)
                    if (typeof Game !== 'undefined' && Game.templumDailyTick) Game.templumDailyTick();
                    // Templum — týdenní zpověď (self-guarded, gate frater+)
                    if (typeof Game !== 'undefined' && Game.templumConfessionTick) Game.templumConfessionTick();
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
                    // Conversi — automatické úklidové úkoly (self-guarded 24h přes cleanPen)
                    if (typeof Game !== 'undefined' && Game.checkConversiChores) Game.checkConversiChores();
                    // Conversi — návraty ze Scavenge/Dolů (riziko + výnos)
                    if (typeof Game !== 'undefined' && Game.checkConversiReturns) Game.checkConversiReturns();
                    // Studna — časová degradace (self-guarded 24h, grace 5 dní)
                    if (typeof WellSystem !== 'undefined' && WellSystem.dailyTick) WellSystem.dailyTick();
                    // Persona — influence decay (self-guarded 7 dní)
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.tickDecay) PersonaSystem.tickDecay();
                    // Terrain — regen únavy krajiny (self-guarded 10 min)
                    if (typeof TerrainSystem !== 'undefined') TerrainSystem.tick();
                    Game.checkFarmyardProduction();
                    Game.checkPiscinaGrowth();
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
                // Role Zahradník: herb_yield bonus (1.20 = +20%)
                const _yieldMult = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('herb_yield') : 1.0;
                if (_gp) {
                    this.addItem(harvestCrop, Math.max(1, Math.round(_gp.yield * _yieldMult)));
                    // Šance vrátit semínko (30%)
                    if (Math.random() < 0.3) this.addItem(_gp.seed, 1);
                } else if(harvestCrop === 'hops') {
                    this.addItem('hops', Math.max(1, Math.round(2 * _yieldMult)));
                    if(Math.random() > 0.6) this.addItem('seeds_hops', 1);
                } else if(['carrot','onion','potato'].includes(harvestCrop)) {
                    this.addItem(harvestCrop, Math.max(1, Math.round(3 * _yieldMult)));
                    if(Math.random() > 0.5) this.addItem('seeds_vegetable', 1);
                } else if (harvestCrop) {
                    // fallback pro neznámé plodiny
                    this.addItem(harvestCrop, Math.max(1, Math.round(2 * _yieldMult)));
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
                    const qty = 20 + Math.floor(Math.random() * 11);
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
                    // Bukvice — podzim, spolu se žaludy
                    if(Math.random() < 0.08) this.addItem('beechnut', 1);
                    // Vzácnější houby (Cultus Herbarum)
                    if(Math.random() < 0.03) this.addItem('morel', 1);
                    if(Math.random() < 0.04) this.addItem('saffron_milk_cap', 1);
                    if(Math.random() < 0.03) this.addItem('porcini', 1);
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
                    if(Math.random() < 0.30) this.addItem('linden_blossom', 1);
                    if(Math.random() < 0.20) this.addItem('chamomile', 1);
                    if(Math.random() < 0.10) this.addItem('thyme', 1);
                    if(Math.random() < 0.08) this.addItem('yarrow', 1);
                    if(Math.random() < 0.05) this.addItem('wormwood', 1);
                    if(Math.random() < 0.04) this.addItem('sage', 1);
                    if(Math.random() < 0.02) this.addItem('plantain', 1);
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
                // hadry — základ hadrového papíru
                if(Math.random() < 0.35) this.addItem('rags', 1);
                
                // Rare drop - Netolického pozůstalost (0.1% chance)
                if(Math.random() < 0.001) {
                    this.addItem('netolicky_legacy', 1);
                    UI.notifyPanel('📜 ' + (typeof t === 'function' ? t('game.rareFind') : 'Vzácný nález!'), 'system');
                    setTimeout(function() { Game.showNetolickyModal(); }, 300);
                }
            }
            else if (type === 'basic') { 
                this.addItem((r<0.4?'rock':'stick'), 1); 
                if(Math.random() < 0.10) this.addItem('chalk', 1);
                if(Math.random() < 0.35) this.addItem('rags', 1);
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
                if(Math.random() < 0.015) this.addItem('seeds_sage', 1);
                if(Math.random() < 0.010) this.addItem('seeds_wormwood', 1);
                if(Math.random() < 0.020) this.addItem('seeds_yarrow', 1);
                // Rare drop - Netolického pozůstalost (0.1% chance)
                if(Math.random() < 0.001) {
                    this.addItem('netolicky_legacy', 1);
                    UI.notifyPanel('📜 ' + (typeof t === 'function' ? t('game.rareFind') : 'Vzácný nález!'), 'system');
                    setTimeout(function() { Game.showNetolickyModal(); }, 300);
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
                // Bukvice — podzim, spolu se žaludy
                if(Math.random() < 0.08) this.addItem('beechnut', 1);
                // Vzácnější houby (Cultus Herbarum)
                if(Math.random() < 0.03) this.addItem('morel', 1);
                if(Math.random() < 0.04) this.addItem('saffron_milk_cap', 1);
                if(Math.random() < 0.03) this.addItem('porcini', 1);
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
                if(Math.random() < 0.30) this.addItem('linden_blossom', 1);
                if(Math.random() < 0.20) this.addItem('chamomile', 1);
                if(Math.random() < 0.10) this.addItem('thyme', 1);
                if(Math.random() < 0.08) this.addItem('yarrow', 1);
                if(Math.random() < 0.05) this.addItem('wormwood', 1);
                if(Math.random() < 0.04) this.addItem('sage', 1);
                if(Math.random() < 0.02) this.addItem('plantain', 1);
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
        const _potionCures = ['antidote', 'potion_heal', 'sleep_potion', 'stamina_tonic'];
        const _isPotionCure = _potionCures.includes(foodId);
        if(!item || (item.type !== 'food' && !_isPotionCure)) { UI.notify(t('game.notFood'), true); return; }
        if(!(GameState.inventory[foodId] > 0)) { UI.notify(t('game.noFood'), true); return; }

        this.removeItem(foodId, 1);

        // Vigor systém v2 — VigorSystem.eat() zpracuje Satiety + Fatigue (jen skutečné 'food' položky)
        if (item.type === 'food' && typeof VigorSystem !== 'undefined') {
            VigorSystem.eat(foodId);
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
        if (itemId === 'water' && typeof HealthSystem !== 'undefined' && !HealthSystem.isActive('water_sickness') && Math.random() < 0.007) {
            HealthSystem.addCondition('water_sickness');
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
			{ key: 'henhouse',  built: GameState.henhouse && GameState.henhouse.built && GameState.henhouse.hens && GameState.henhouse.hens.length > 0, feedChain: ['grain', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Hens':'Slepice' },
			{ key: 'sheepfold', built: GameState.sheepfold && GameState.sheepfold.built && GameState.sheepfold.sheep && GameState.sheepfold.sheep.length > 0, feedChain: ['hay', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Sheep':'Ovce' },
			{ key: 'piscina',   built: GameState.piscina && GameState.piscina.tier > 0, feedChain: ['worms'], feedAmt: 1, name: lang==='en'?'Fish':'Ryby' },
			{ key: 'rabbitry',  built: GameState.rabbitry && GameState.rabbitry.built && GameState.rabbitry.animals && GameState.rabbitry.animals.length > 0, feedChain: ['scraps', 'hay'], feedAmt: 1, name: lang==='en'?'Rabbits':'Králíci' },
			{ key: 'goatpen',   built: GameState.goatpen && GameState.goatpen.built && GameState.goatpen.animals && GameState.goatpen.animals.length > 0, feedChain: ['hay', 'scraps', 'feed_meal'], feedAmt: 1, name: lang==='en'?'Goats':'Kozy' },
			{ key: 'pigsty',    built: GameState.pigsty && GameState.pigsty.built && GameState.pigsty.animals && GameState.pigsty.animals.length > 0, feedChain: ['scraps', 'feed_meal', 'grain', 'hay'], feedAmt: 2, name: lang==='en'?'Pigs':'Prasata' },
		];
		animals.forEach(a => {
			if (!a.built) return;
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
		if (!GameState.storage.fodina)             GameState.storage.fodina             = {built:false};
		if (!GameState.storage.fornax_ferraria)    GameState.storage.fornax_ferraria    = {built:false};
		if (!GameState.storage.old_cellars)        GameState.storage.old_cellars        = {built:false};
		if (!GameState.storage.domus_conversorum_i) GameState.storage.domus_conversorum_i = {built:false};
		if (!GameState.storage.domus_conversorum_ii) GameState.storage.domus_conversorum_ii = {built:false};
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
		if (type === 'domus_conversorum_i' && !(GameState.storage.old_cellars && GameState.storage.old_cellars.built)) {
			UI.notify(lang==='en' ? 'Clear the Old Cellars first.' : 'Nejprve vyklidit Staré sklepy.', true); return;
		}
		if (type === 'domus_conversorum_ii') {
			if (!(GameState.abbotPetition && GameState.abbotPetition.domus_ii && GameState.abbotPetition.domus_ii.status === 'approved')) {
				UI.notify(lang==='en' ? '❌ Abbot approval required. Submit a petition first.' : '❌ Vyžaduje souhlas opata. Nejprve zašli žádost.', true); return;
			}
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
			old_cellars:       { cut_stone: 15, plank: 10, rope: 5 },
			domus_conversorum_i: { cut_stone: 40, plank: 25, rope: 10 },
			domus_conversorum_ii: { cut_stone: 150, plank: 90, rope: 35 },
		};
		// Volitelný groše náklad navíc k materiálu — dnes jen Domus Conversorum I/II.
		// Cokoliv chybí v costsGrose má groseNeeded=0, tedy nulový dopad na stávající budovy.
		const costsGrose = {
			domus_conversorum_i: 25,
			domus_conversorum_ii: 50,
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
			old_cellars: 'Staré sklepy',
			domus_conversorum_i: 'Domus Conversorum I',
			domus_conversorum_ii: 'Domus Conversorum II',
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
                    Game.addKronikaEntry('minor',
                        '✝️ ' + titleMap[type][0] + ': rodina ' + surname + ' — obřad vykonán.',
                        '✝️ ' + titleMap[type][1] + ': the ' + surname + ' family — rite performed.',
                        '✝️ Ritus peractus est.');
                    Game.save(); rerender();
                }},
                { label: (lang==='en'?'🚪 Decline':'🚪 Odmítnout'), effect: () => {
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', -2);
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

        const rerender = () => {
            const el = document.getElementById('home-templum-content');
            if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab();
        };
        const record = (choice) => { t.lastConfession = { id: id, name: cName, choice: choice, ts: Date.now() }; };

        NotificationSystem.modal({
            icon: '🙏',
            title: (lang==='en' ? 'Confession — ' : 'Zpověď — ') + cName,
            text: `<div style="font-size:0.82rem; line-height:1.45;">${c.icon} <span style="font-style:italic; opacity:0.85;">${sin}</span><br><br>${lang==='en'?'He kneels and waits for your word.':'Klečí a čeká na tvé slovo.'}</div>`,
            choices: [
                { label: (lang==='en'?'⚖️ Strict penance':'⚖️ Přísné pokání'), type: 'danger', effect: () => {
                    if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 3);
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(2);
                    if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.addContactRelation(id, -3);
                    record('strict');
                    Game.addKronikaEntry('minor',
                        '🙏 Zpověď: ' + cName + ' dostal přísné pokání. Církev to ocení, on méně.',
                        '🙏 Confession: ' + cName + ' received strict penance. The Church approves; he does not.',
                        '🙏 Poenitentia severa imposita est.');
                    Game.save(); rerender();
                }},
                { label: (lang==='en'?'🕊️ Leniency':'🕊️ Shovívavost'), effect: () => {
                    if (typeof SaeculumSystem !== 'undefined') SaeculumSystem.addContactRelation(id, 3);
                    if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 1);
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
                    Game.addKronikaEntry('minor',
                        '🙏 Zpověď: ' + cName + ' odešel nevyslyšen.',
                        '🙏 Confession: ' + cName + ' left unheard.',
                        '🙏 Confessio recusata est.');
                    Game.save(); rerender();
                }}
            ]
        });
    },

    // ── TEMPLUM T3: Mše — týdenní, spotřebuje 2 svíce + víno + kadidlo + 3 hostie → vliv ──
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
        // R1: odsloužená mše = držený kanonický rytmus (frater vyžaduje streak ≥ 7)
        if (GameState.rank) {
            GameState.rank.canonicalStreak = (GameState.rank.canonicalStreak || 0) + 1;
            if (typeof RankSystem !== 'undefined' && RankSystem.checkMonasticProgress) RankSystem.checkMonasticProgress();
        }
        Game.save();

        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            const feastPart = feastName ? (lang==='en' ? ' Feast of ' + feastName + ' — twofold grace!' : ' Svátek ' + feastName + ' — dvojnásobná milost!') : '';
            const vestmentPart = wrongVestment ? (lang==='en' ? ' Wrong vestment colour — impact reduced.' : ' Špatná barva roucha — dopad snížen.') : '';
            UI.notifyPanel('⛪ ' + (degraded
                ? (lang==='en' ? 'Mass held in gloom and dust. Ecclesia +'+eccl+', village +'+vill+'.' : 'Mše v šeru a prachu. Ecclesia +'+eccl+', vesnice +'+vill+'.')
                : (lang==='en' ? 'Mass held. Ecclesia +'+eccl+', village +'+vill+'.' : 'Mše odsloužena. Ecclesia +'+eccl+', vesnice +'+vill+'.')) + feastPart + vestmentPart, (degraded || wrongVestment) ? 'warning' : 'success');
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
        { name: 'Chrám',     name_en: 'Temple',    cost: 400, req: { ecclesia: 35, zboznost: 25, condition: 70 }, decayMult: 1.20, repairEff: 1.25 },
        { name: 'Katedrála', name_en: 'Cathedral', cost: 900, req: { ecclesia: 60, zboznost: 50, condition: 80 }, decayMult: 1.35, repairEff: 1.40 },
    ],

    fabricaMeetsRequirements: function(req) {
        if (!req) return true;
        const p = GameState.persona || {};
        const cond = (GameState.templum && GameState.templum.condition != null) ? GameState.templum.condition : 100;
        if (req.condition && cond < req.condition) return false;
        if (req.ecclesia && ((p.influence && p.influence.church) || 0) < req.ecclesia) return false;
        if (req.zboznost && (p.zboznost || 0) < req.zboznost) return false;
        if (req.organ && (GameState.inventory['organ'] || 0) < 1) return false;
        return true;
    },

    upgradeFabrica: function() {
        if (typeof CellariumSystem === 'undefined') return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const tier = t.fabricaTier || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (tier >= this.FABRICA_TIERS.length - 1) return;
        const next = this.FABRICA_TIERS[tier + 1];
        if (!this.fabricaMeetsRequirements(next.req)) { UI.notify('⚠️ ' + (lang==='en'?'Requirements not met.':'Podmínky nesplněny.'), true); return; }
        if (CellariumSystem.getGrose() < next.cost) { UI.notify('⚠️ ' + (lang==='en'?'Not enough groschen.':'Nedostatek grošů.'), true); return; }
        CellariumSystem.spendGrose(next.cost);
        t.fabricaTier = tier + 1;
        const name = lang==='en' ? next.name_en : next.name;
        Game.save();
        UI.notifyPanel('🏛️ ' + (lang==='en'?'The church rises: ':'Kostel roste: ') + name + '.', 'success');
        Game.addKronikaEntry('important',
            '🏛️ Fabrica: kostel povýšen na ' + name + '.',
            '🏛️ Fabrica: the church raised to ' + name + '.',
            '🏛️ Fabrica ecclesiae aucta est.');
        const el2 = document.getElementById('home-templum-content');
        if (el2 && typeof TemplumSystem !== 'undefined') el2.innerHTML = TemplumSystem.renderTemplumTab();
    },

    repairFabrica: function() {
        if (typeof CellariumSystem === 'undefined') return;
        if (!GameState.templum) GameState.templum = {};
        const t = GameState.templum;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cost = 20;
        if (CellariumSystem.getGrose() < cost) { UI.notify('⚠️ ' + (lang==='en'?'Not enough groschen.':'Nedostatek grošů.'), true); return; }
        CellariumSystem.spendGrose(cost);
        const tierDef = this.FABRICA_TIERS[t.fabricaTier || 0];
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
        if (now - (t.lastTick || 0) < DAY) return;
        t.lastTick = now;

        // Svíce: kostel spotřebuje 1 svíci denně (Voskařova smyčka); bez svíce zhasnuto
        if ((GameState.inventory['candle'] || 0) > 0) {
            this.removeItem('candle', 1);
            t.litUntil = now + DAY;
        }

        // Úklid: dostupný konvrš PŘIŘAZENÝ na Kostel (M1: přiřazení nahrazuje "kdo je volný") — +5 únavy, čisto na 48 h
        const cleaner = (GameState.conversi || [])
            .filter(k => k.task === 'kostel'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > now)
                      && !(k.injuredUntil && k.injuredUntil > now)
                      && !(k.awayUntil && k.awayUntil > now))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (cleaner) {
            cleaner.fatigue = Math.min(100, cleaner.fatigue + 5);
            t.cleanUntil = now + 48 * 60 * 60 * 1000;
            t.lastCleaner = cleaner.name;
        }
        // Fabrica: strukturální stav budovy pomalu chátrá, rychleji u vyšších úrovní
        const fTier = this.FABRICA_TIERS[t.fabricaTier || 0];
        t.condition = Math.max(0, (t.condition != null ? t.condition : 100) - 0.3 * fTier.decayMult);
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

    // ── CONVERSI — přiřazování úkolů (M1) ───────────────────────────────────
    CONVERSI_TASKS: {
        dvur:     { icon: '🏚️', away: false },
        zahony:   { icon: '🌿', away: false },
        sad:      { icon: '🍎', away: false },
        apiarium: { icon: '🐝', away: false },
        piscina:  { icon: '🐟', away: false },
        pole:     { icon: '🌾', away: false },
        scavenge: { icon: '🌾', away: true,  durationMs: 8  * 60 * 60 * 1000, riskPct: 12 },
        doly:     { icon: '⛏️', away: true,  durationMs: 20 * 60 * 60 * 1000, riskPct: 20 },
        kostel:   { icon: '🕍', away: false },
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
    CONVERSI_SCAVENGE_LOOT: ['mushroom', 'berries', 'thyme', 'st_johns_wort', 'wood', 'clay'],
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

    checkConversiChores: function() {
        if (!GameState.conversi || GameState.conversi.length === 0) return;

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
            GameState.conversi.forEach(k => {
                if (typeof k.wageOwed !== 'number') k.wageOwed = 0;
                const due = 2 + k.wageOwed;
                const grose = (typeof CellariumSystem !== 'undefined') ? CellariumSystem.getGrose() : 0;
                if (grose >= due) {
                    CellariumSystem.addGrose(-due);
                    if (k.wageOwed > 0) k.loyalty = Math.min(100, k.loyalty + 2); // splacený dluh = usmíření
                    k.wageOwed = 0;
                } else {
                    k.wageOwed += 2;
                    k.loyalty = Math.max(0, k.loyalty - 5);
                    k.mood = Math.max(0, k.mood - 5);
                    if (k.loyalty <= 0) leavers.push(k);
                }
            });
            leavers.forEach(k => {
                GameState.conversi = GameState.conversi.filter(x => x.id !== k.id);
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
            return; // na Officiu, nedostupní pro úkoly
        }

        // Oběd (12–13): refektář — jídlo z klášterních zásob, jednou za 24h
        if (dayBlock === 'lunch') {
            this._runRefectory();
            return; // u oběda, nedostupní pro úkoly
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
            return; // na nešporách, nedostupní pro úkoly
        }

        // Noc (22–5): spánek
        if (dayBlock === 'night') return;

        // Práci dělá nejméně unavený dostupný konvrš PŘIŘAZENÝ na Dvůr (M1: přiřazení nahrazuje "kdo je volný")
        const worker = GameState.conversi
            .filter(k => k.task === 'dvur'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (!worker) return; // nikdo nepřiřazený na Dvůr, všichni unavení, bez nálady, nebo v Pokání

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
        if (cleanedAny) {
            const workGain = this._konvrsTraits(worker).includes('silak') ? 10 : 15;
            worker.fatigue = Math.min(100, worker.fatigue + workGain);
            Game.save();
        }

        // ── Záhony (L1): přiřazený konvrš zalévá a sklízí, self-guarded 24h ──
        const gardener = GameState.conversi
            .filter(k => k.task === 'zahony'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (gardener && GameState.garden) {
            if (!GameState.conversiGardenLastTick) GameState.conversiGardenLastTick = 0;
            if (Date.now() - GameState.conversiGardenLastTick >= DAY) {
                GameState.conversiGardenLastTick = Date.now();
                let didWork = false;

                let growthSpeed = CONFIG.GROWTH_SPEED;
                if (GameState.researchedTechs.includes('tech_advanced_farming')) growthSpeed *= 2.0;
                const needed = CONFIG.BASE_GROWTH_TIME / growthSpeed;

                GameState.garden.forEach(plot => {
                    if (plot.locked || plot.state !== 2) return;

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
                        plot.state = 0; plot.water = false; plot.crop = null;
                        didWork = true;

                        if (GameState.achievements) GameState.achievements.stats.harvests++;
                        const _gp = (typeof GardenSystem !== 'undefined')
                            ? Object.values(GardenSystem.GARDEN_PLANTS_DB).find(p => p.item === harvestCrop)
                            : null;
                        const _yieldMult = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('herb_yield') : 1.0;
                        if (_gp) {
                            this.addItem(harvestCrop, Math.max(1, Math.round(_gp.yield * _yieldMult)));
                            if (Math.random() < 0.3) this.addItem(_gp.seed, 1);
                        } else if (harvestCrop === 'hops') {
                            this.addItem('hops', Math.max(1, Math.round(2 * _yieldMult)));
                            if (Math.random() > 0.6) this.addItem('seeds_hops', 1);
                        } else if (['carrot', 'onion', 'potato'].includes(harvestCrop)) {
                            this.addItem(harvestCrop, Math.max(1, Math.round(3 * _yieldMult)));
                            if (Math.random() > 0.5) this.addItem('seeds_vegetable', 1);
                        } else if (harvestCrop) {
                            this.addItem(harvestCrop, Math.max(1, Math.round(2 * _yieldMult)));
                        }
                    }
                });

                if (didWork) {
                    const workGain = this._konvrsTraits(gardener).includes('silak') ? 10 : 15;
                    gardener.fatigue = Math.min(100, gardener.fatigue + workGain);
                    Game.checkAchievements();
                    Game.save();
                }
            }
        }

        // ── Sad (L1): přiřazený konvrš sklízí dozrálé stromy, self-guarded 24h ──
        const orchardKeeper = GameState.conversi
            .filter(k => k.task === 'sad'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (orchardKeeper && GameState.orchard) {
            if (!GameState.conversiOrchardLastTick) GameState.conversiOrchardLastTick = 0;
            if (Date.now() - GameState.conversiOrchardLastTick >= DAY) {
                GameState.conversiOrchardLastTick = Date.now();
                let didHarvest = false;

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
                    const qty = (slot.treeType === 'seed_walnut' || slot.treeType === 'seed_sorb') ? 2 : 3;
                    this.addItem(fruit, qty);
                    if (slot.treeType === 'seed_linden') this.addItem('linden_blossom', 1);
                    this.addItem('pollen', 1);
                    slot.lastHarvestAt = Date.now();
                    didHarvest = true;
                });

                if (didHarvest) {
                    const workGain = this._konvrsTraits(orchardKeeper).includes('silak') ? 10 : 15;
                    orchardKeeper.fatigue = Math.min(100, orchardKeeper.fatigue + workGain);
                    Game.save();
                }
            }
        }

        // ── Apiarium (L1): přiřazený konvrš sklízí med/vosk, přikrmuje v zimě
        //    a léčí Varroa — self-guarded 24h ──
        const beekeeper = GameState.conversi
            .filter(k => k.task === 'apiarium'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (beekeeper && GameState.apiary && typeof GardenSystem !== 'undefined') {
            if (!GameState.conversiApiaryLastTick) GameState.conversiApiaryLastTick = 0;
            if (Date.now() - GameState.conversiApiaryLastTick >= DAY) {
                GameState.conversiApiaryLastTick = Date.now();
                let didWork = false;
                const season = GardenSystem._getApiarySeason();
                const now = Date.now();

                GameState.apiary.forEach(hive => {
                    if (!hive.built || !hive.hasQueen) return;

                    // Léčba Varroa má přednost — riziko hrozí kdykoliv v roce
                    if (hive.varroaRisk) {
                        if ((GameState.inventory['thyme'] || 0) > 0) {
                            this.removeItem('thyme', 1);
                            hive.varroaRisk = false;
                            hive.strength = Math.max(1, (hive.strength || 3) - 1);
                            didWork = true;
                        }
                        return;
                    }

                    if (season === 'winter') {
                        // Zimní přikrmení — jen pokud síla není už na maximu
                        if (hive.strength < 10 && (GameState.inventory['honey'] || 0) > 0) {
                            this.removeItem('honey', 1);
                            hive.strength = Math.min(10, (hive.strength || 3) + 1);
                            didWork = true;
                        }
                        return;
                    }

                    // Sklizeň — stejná gate logika jako ruční collectHive
                    const COLLECT_HOURS = { spring: 16, summer: 8, autumn: 20 };
                    const hours = COLLECT_HOURS[season] || 12;
                    if (now < hive.lastCollectAt + (hours * 3600000)) return;

                    const strengthMod = (hive.strength || 3) / 5;
                    const honeyBase = { spring: 1, summer: 3, autumn: 1 };
                    const waxBase   = { spring: 1, summer: 1, autumn: 2 };
                    this.addItem('honey', Math.max(1, Math.round(honeyBase[season] * strengthMod)));
                    this.addItem('beeswax', Math.max(1, Math.round(waxBase[season] * strengthMod)));

                    if (season === 'summer') {
                        const hasFlowers = GameState.garden && GameState.garden.some(p => p.state === 2 && p.water);
                        const hasTrees   = GameState.orchard && GameState.orchard.some(s => s.state === 'mature');
                        if (hasFlowers || hasTrees) this.addItem('pollen', 1);
                    }

                    hive.strength = Math.min(10, (hive.strength || 3) + 1);

                    // Rojivá nálada — stejné riziko jako u ruční sklizně, konvrš ho ale
                    // díky pravidelné 24h péči prakticky nikdy nedovolí nastat
                    if (hive.strength >= 9 && now > hive.lastCollectAt + (hours * 2 * 3600000)) {
                        hive.hasQueen = false;
                        hive.queenName = null;
                        hive.strength = 0;
                        didWork = true;
                        return;
                    }
                    hive.lastCollectAt = now;
                    didWork = true;
                });

                if (didWork) {
                    const workGain = this._konvrsTraits(beekeeper).includes('silak') ? 10 : 15;
                    beekeeper.fatigue = Math.min(100, beekeeper.fatigue + workGain);
                    Game.save();
                }
            }
        }

        // ── Piscina (L1): přiřazený konvrš krmí ryby, přesouvá čekající plůdek
        //    a sklízí dospělé kapry — self-guarded 24h ──
        const fisherman = GameState.conversi
            .filter(k => k.task === 'piscina'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (fisherman && GameState.piscina && GameState.piscina.tier >= 1) {
            if (!GameState.conversiPiscinaLastTick) GameState.conversiPiscinaLastTick = 0;
            if (Date.now() - GameState.conversiPiscinaLastTick >= DAY) {
                GameState.conversiPiscinaLastTick = Date.now();
                const p = GameState.piscina;
                let didWork = false;

                // Krmení — spotřebuje fiber podle počtu ryb všech stupňů
                const feedNeeded = (p.fry || 0) + (p.youngCarp || 0) + (p.carp || 0);
                if (feedNeeded > 0 && (GameState.inventory['fiber'] || 0) >= feedNeeded) {
                    this.removeItem('fiber', feedNeeded);
                    p.lastFedAt = Date.now();
                    didWork = true;
                }

                // Přesun čekajícího plůdku do prvního stupně
                if ((p.pendingFry || 0) > 0) {
                    p.fry = (p.fry || 0) + p.pendingFry;
                    if (!p.fryAddedAt || p.fryAddedAt === 0) p.fryAddedAt = Date.now();
                    p.pendingFry = 0;
                    didWork = true;
                }

                // Sklizeň všech dospělých kaprů
                if ((p.carp || 0) > 0) {
                    const qty = p.carp;
                    p.carp = 0;
                    this.addItem('carp', qty);
                    didWork = true;
                }

                if (didWork) {
                    const workGain = this._konvrsTraits(fisherman).includes('silak') ? 10 : 15;
                    fisherman.fatigue = Math.min(100, fisherman.fatigue + workGain);
                    Game.save();
                }
            }
        }

        // ── Pole (L1): přiřazený konvrš zalévá rostoucí pole a sklízí dozrálá,
        //    self-guarded 24h. Volá přímo GardenSystem.waterField/harvestField —
        //    výpočet výnosu (počasí, kvalita zrna, sláma) je tam příliš složitý
        //    na bezpečné duplikování zvlášť. ──
        const plowman = GameState.conversi
            .filter(k => k.task === 'pole'
                      && k.fatigue < (this._konvrsTraits(k).includes('pilny') ? 90 : 80)
                      && (typeof k.mood !== 'number' || k.mood >= 30)
                      && !(k.penanceUntil && k.penanceUntil > Date.now())
                      && !(k.injuredUntil && k.injuredUntil > Date.now())
                      && !(k.awayUntil && k.awayUntil > Date.now()))
            .sort((a, b) => a.fatigue - b.fatigue)[0];
        if (plowman && GameState.fields && typeof GardenSystem !== 'undefined') {
            if (!GameState.conversiFieldLastTick) GameState.conversiFieldLastTick = 0;
            if (Date.now() - GameState.conversiFieldLastTick >= DAY) {
                GameState.conversiFieldLastTick = Date.now();
                let didWork = false;
                const techs = GameState.researchedTechs || [];
                const waterCost = techs.includes('tech_field_irrigation') ? 1 : 2;

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
                        GardenSystem.harvestField(idx);
                        didWork = true;
                    }
                });

                if (didWork) {
                    const workGain = this._konvrsTraits(plowman).includes('silak') ? 10 : 15;
                    plowman.fatigue = Math.min(100, plowman.fatigue + workGain);
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
