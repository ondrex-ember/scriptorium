const Game = {
    init: function() {
        Game.load(); 

        // --- 0. PRVNÍ NÁVŠTĚVA + VRACEJÍCÍ SE HRÁČ ---
        if (GameState.flags.firstVisit === undefined) {
            GameState.flags.firstVisit = false;
        }
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
            if (!GameState.settings.langChosen) {
                setTimeout(() => UI.showLangPicker(), 300);
            } else {
                const consent = localStorage.getItem('scriptorium_consent');
                if (consent !== null) {
                    setTimeout(() => {
                        UI.showWelcomeModal();
                        GameState.flags.firstVisit = false;
                        Game.save();
                    }, 800);
                }
            }
        } else if (_daysSinceLastSeen >= 3 && GameState.flags.fireplaceLit) {
            GameState.flags.fireplaceLit = false;
            GameState.flags.candleLit = false;
            GameState.flags.torchLit = false;
            if ((GameState.inventory['tinderbox'] || 0) <= 0) {
                GameState.inventory['tinderbox'] = 1;
            }
            setTimeout(() => UI.showFireoutModal(_daysSinceLastSeen), 600);
        }

        // --- 1. ZÁPISNÍKY ---
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
        GameState.notebooks.tabula = []; 

        // --- 2. I-CHING ---
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
        
        if(!GameState.hunger) {
            GameState.hunger = { fed: true, lastMeal: Date.now(), duration: 24 * 60 * 60 * 1000 };
        }
        
        if(GameState.garden.length === 2) {
            GameState.garden.push({ state: 0, water: false, crop: null, plantedAt: 0, cropType: 'vegetable', locked: true });
            GameState.garden.push({ state: 0, water: false, crop: null, plantedAt: 0, cropType: 'special', locked: true });
        }
        
        GameState.garden.forEach((plot, idx) => {
            if(!plot.cropType) {
                if(idx === 0 || idx === 1) plot.cropType = 'herb';
                else if(idx === 2) plot.cropType = 'vegetable';
                else if(idx === 3) plot.cropType = 'special';
            }
            if(plot.locked === undefined) {
                plot.locked = (idx >= 2);
            }
        });
        
        if(!GameState.discoveredLore) GameState.discoveredLore = [];
        if(!GameState.dailyRewards) {
            GameState.dailyRewards = { lastLogin: 0, streak: 0, lastBonusClaimed: 0, totalLogins: 0 };
        }
        
        if(!GameState.achievements) {
            GameState.achievements = {
                unlocked: [],
                stats: {
                    itemsCrafted: 0, itemsDiscovered: 0, harvests: 0, researchCount: 0,
                    totalResearchGained: 0, daysWithFire: 0, daysWithoutHunger: 0,
                    mealsEaten: 0, candlesLit: 0, actionsCompleted: 0, actionsFailed: 0,
                    totalGamesPlayed: 0, hoursAttended: 0, ichingCasts: 0, wellUses: 0,
                    wellCleans: 0, maxInventoryItems: 0, maxResearchHeld: 0, longestStreak: 0
                }
            };
        }
        
        if(!GameState.library) {
            GameState.library = {
                startDate: Date.now(), unlockedBooks: [], readBooks: [],
                scribeState: { visited: false, totalTrades: 0, lastTrade: 0 }
            };
        }
        if(!GameState.well) {
            GameState.well = { built: false, level: "none", condition: "clean", lastUse: 0 };
        }
        
        if(!GameState.settings.language) GameState.settings.language = 'cs';
        LangSystem.apply(GameState.settings.language);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            if(el) el.innerHTML = t(el.getAttribute('data-i18n'));
        });
        
        WeatherSystem.init();
        ThemeSystem.init();
        NotebookSystem.init();
        CanonicalHours.init();
        UI.renderAll(); 
        Game.checkEnvironment(); 
        RankSystem.init();
        ConsentManager.init();
        TimeSys.update();
        
        setTimeout(() => {
            if(GameState.dailyRewards.totalLogins > 0) Game.checkDailyReward();
        }, 500);
        
        document.body.addEventListener('click', () => { 
            if (!audioSys) { audioSys = new AudioSystem(); audioSys.start(); } 
        }, { once: true });
        
        setInterval(() => { 
            try {
                TimeSys.update(); 
                Game.checkEnvironment();
                CanonicalHours.checkCurrentHour();
                EventsSystem.checkEvents();
            } catch(e) {}
        }, 1000);
    },

    save: function() { 
        try { 
            GameState.lastSeen = Date.now(); 
            localStorage.setItem('scriptorium_save_v6_4', JSON.stringify(GameState)); 
        } catch(e){} 
    },

    addItem: function(id, qty) {
        const isFirstTime = !GameState.inventory[id] || GameState.inventory[id] === 0;
        if(!GameState.inventory[id]) GameState.inventory[id] = 0;
        GameState.inventory[id] += qty; 
        
        if(GameState.achievements) {
            GameState.achievements.stats.itemsCrafted += qty;
            if(id === 'research') GameState.achievements.stats.researchCount += qty;
        }
        
        if(isFirstTime && LoreDB[id] && !GameState.discoveredLore.includes(id)) {
            GameState.discoveredLore.push(id);
            if(GameState.achievements) GameState.achievements.stats.itemsDiscovered++;
            UI.notify(t('game.newCodexEntry'));
            // OPRAVA: iName pro notifikaci
            setTimeout(() => UI.notify(t('game.itemAdded').replace('{qty}', qty).replace('{item}', iName(id))), 500);
        } else {
            // OPRAVA: iName pro notifikaci
            UI.notify(t('game.itemAdded').replace('{qty}', qty).replace('{item}', iName(id)));
        }
        
        Game.save(); Game.checkEnvironment(); UI.renderAll();
        Game.checkAchievements();
    },removeItem: function(id, qty) {
        if(GameState.inventory[id] >= qty) {
            GameState.inventory[id] -= qty; 
            if(GameState.inventory[id] <= 0) delete GameState.inventory[id];
            Game.save(); Game.checkEnvironment(); UI.renderAll(); return true;
        } return false;
    },

    craft: function(id) {
        const r = RecipesDB.find(x => x.id === id);
        if(!GameState.flags.fireplaceLit && !r.blind) { UI.notify(t('game.frozenHands'), true); return; }
        
        // OPRAVA: Smyčka je nyní syntakticky správně [item, amt]
        for(let [item, amt] of Object.entries(r.req)) {
            if(amt > 0 && (!GameState.inventory[item] || GameState.inventory[item] < amt)) { 
                UI.notify(t('game.missingMats'), true); 
                return; 
            }
            // OPRAVA: Použití iName pro název vyžadovaného nástroje
            if(amt === 0 && !GameState.inventory[item]) { 
                UI.notify(`${t('game.required2')} ${iName(item)}`, true); 
                return; 
            }
        }
        
        for(let [item, amt] of Object.entries(r.req)) if(amt > 0) this.removeItem(item, amt);
        this.addItem(r.output, r.qty);
        
        // Analytics
        const craftedItem = ItemsDB[r.output];
        if (craftedItem) Analytics.itemCrafted(r.output, craftedItem.name, craftedItem.type);
        if (r.output === 'research') {
            Analytics.researchCrafted((GameState.inventory['research'] || 0) + r.qty);
        }

        // 👿 TITIVILLUS – Démon překlepů (vložen správně dovnitř funkce craft)
        if (['paper', 'ink', 'research'].includes(r.output)) {
            const isNight = !TimeSys.isDaytime();
            const noLight = !GameState.flags.candleLit && !GameState.flags.torchLit;
            const chance = (isNight && noLight) ? 0.08 : 0.03;
            if (Math.random() < chance) {
                this.removeItem(r.output, r.qty); // Démon krade výstup
                Analytics.titivillusStruck(r.output, isNight && noLight);
                const quotes = t('titivillus');
                UI.notify(quotes[Math.floor(Math.random() * quotes.length)], true);
                Game.save(); UI.renderAll();
                return;
            }
        }

        Game.save();
        UI.renderAll();
    },

    scavenge: function(type) {
        // === SPECIAL HANDLING FOR WELL ===
        if (type === 'well_water') {
            if (!GameState.well.built) {
                UI.notify(t('game.needWell'), true);
                return;
            }
            const hasBucket = GameState.inventory.bucket && GameState.inventory.bucket > 0;
            this.drawWater(hasBucket);
            return;
        }

        if (GameState.activeAction && GameState.activeAction.id === type) {
            const now = Date.now();
            const totalDur = GameState.activeAction.endTime - GameState.activeAction.startTime;
            const elapsed = now - GameState.activeAction.startTime;
            const multiplier = GameState.activeAction.multiplier;
            let count = 0; let msg = "";
            
            // OPRAVA: Překlad stavů Hotovo / Přerušeno
            if (now >= GameState.activeAction.endTime) { 
                count = multiplier; 
                msg = t('game.done'); 
            } else { 
                const ratio = elapsed / totalDur; 
                count = Math.floor(multiplier * ratio); 
                msg = t('game.interrupted'); 
            }

            GameState.activeAction = null;
            if(GameState.achievements) {
                GameState.achievements.stats.actionsCompleted++;
            }
            
            let total = 0;
            // Logika šancí na loot (addItem už je opravené v Části 1, takže tohle bude mluvit anglicky)
            for(let i=0; i<count; i++) {
                let r = Math.random();
                if (type === 'hunt') { 
                    this.addItem('fat', 1); this.addItem('meat', 1); 
                    if (r > 0.4) this.addItem('bone', 1);
                    if (r > 0.7) this.addItem('leather', 1);
                    if (r > 0.5) this.addItem('hide', 1);
                    if (r > 0.7) this.addItem('feather', 1);
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
                    if(Math.random() < 0.06) this.addItem('gall_nut', 1);
                    if(Math.random() < 0.001) {
                        this.addItem('netolicky_legacy', 1);
                        UI.notify(t('game.rareFind'));
                    }
                }
                else if (type === 'basic') { this.addItem((r<0.5?'rock':'stick'), 1); }
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
                }
                total++;
            }

            // OPRAVA: Notifikace výsledku sběru pomocí t()
            if(total > 0) {
                UI.notify(t('game.scavengeResult').replace('{msg}', msg).replace('{total}', total));
            } else {
                UI.notify(t('game.scavengeNothing').replace('{msg}', msg));
            }
            Game.save(); UI.renderAll(); return;
        }
        // Pokračování funkce scavenge (okamžitý sběr nature/basic)
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
                
                if(Math.random() < 0.06) this.addItem('gall_nut', 1);
                
                if(Math.random() < 0.001) {
                    this.addItem('netolicky_legacy', 1);
                    UI.notify(t('game.rareFind'));
                }
            }
            else if (type === 'basic') { this.addItem((r<0.5?'rock':'stick'), 1); }
            UI.notify(t('game.quickScavenge'));
            Game.save(); UI.renderAll(); return;
        }

        if (GameState.activeAction) { UI.notify(t('game.busy'), true); return; }
        
        // Kontrola požadavků (nástrojů)
        const action = ActionsDB.find(a => a.id === type);
        if (action && action.req && !(GameState.inventory[action.req] > 0)) { 
            // OPRAVA: iName pro název chybějícího nástroje
            UI.notify(t('game.missingItem').replace('{item}', iName(action.req)), true); 
            return; 
        }
        
        const durationMin = GameState.selectedDuration;
        if (durationMin === 0) {
            // Logika pro okamžitý sběr (Quick Scavenge)
            let r = Math.random();
            if (type === 'hunt') { 
                this.addItem('fat', 1); this.addItem('meat', 1); 
                if (r > 0.4) this.addItem('bone', 1);
                if (r > 0.7) this.addItem('leather', 1);
                if (r > 0.5) this.addItem('hide', 1);
                if (r > 0.7) this.addItem('feather', 1);
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
            }
            else if (type === 'basic') { this.addItem((r<0.5?'rock':'stick'), 1); }
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
            }
            UI.notify(t('game.quickScavenge'));
        } else {
            // Startování dlouhé akce (Idle)
            const multiplier = durationMin === 1 ? 10 : (durationMin === 5 ? 50 : 100);
            GameState.activeAction = { id: type, startTime: Date.now(), endTime: Date.now() + (durationMin * 60 * 1000), multiplier: multiplier };
            Game.save(); UI.renderActions();
        }
    },

    checkEnvironment: function() {
        const container = document.getElementById('game-container');
        const fpCard = document.getElementById('card-fireplace');
        const navHome = document.getElementById('nav-home');
        
        if (GameState.flags.fireplaceLit) {
            fpCard.classList.add('fireplace-active'); 
            navHome.classList.add('nav-fire-active');
            // OPRAVA: Překlad popisků krbu
            document.getElementById('fireplace-title').innerText = t('fireplace.lit');
            document.getElementById('fireplace-desc').innerText = t('fireplace.litDesc');
            document.getElementById('btn-ignite').style.display = 'none';
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
        const lightDesc = document.getElementById('light-desc'); 
        
        lightCard.classList.remove('candle-active', 'torch-active');
        navLore.classList.remove('nav-candle-active', 'nav-torch-active');
        lightCard.style.opacity = GameState.flags.fireplaceLit ? "1" : "0.5";
        
        if (GameState.flags.candleLit) {
            document.getElementById('light-icon').innerText = "🕯️"; 
            document.getElementById('light-title').innerText = t('light.candle');
            if (lightDesc) lightDesc.innerText = t('light.candleDesc'); 
            navLore.classList.add('nav-candle-active'); 
            btnCandle.style.display = 'none'; btnTorch.style.display = 'inline-block';
            loreOverlay.style.display = 'none'; loreWrap.classList.remove('lore-darkness');
        } else if (GameState.flags.torchLit) {
            document.getElementById('light-icon').innerText = "🔥"; 
            document.getElementById('light-title').innerText = t('light.torch');
            if (lightDesc) lightDesc.innerText = t('light.torchDesc'); 
            navLore.classList.add('nav-torch-active'); 
            btnTorch.style.display = 'none'; btnCandle.style.display = 'inline-block';
            loreOverlay.style.display = 'none'; loreWrap.classList.remove('lore-darkness');
        } else {
            document.getElementById('light-icon').innerText = "🌑"; 
            document.getElementById('light-title').innerText = t('light.none');
            if (lightDesc) lightDesc.innerText = t('light.noneDesc'); 
            const hasC = (GameState.inventory['candle'] || 0) > 0; 
            const hasT = (GameState.inventory['primitive_torch'] || 0) > 0;
            btnCandle.style.display = (GameState.flags.fireplaceLit && hasC) ? 'inline-block' : 'none';
            btnTorch.style.display = (GameState.flags.fireplaceLit && hasT) ? 'inline-block' : 'none';
            loreOverlay.style.display = 'block'; loreWrap.classList.add('lore-darkness');
        }
        btnCandle.disabled = !GameState.flags.fireplaceLit; 
        btnTorch.disabled = !GameState.flags.fireplaceLit;
        UI.renderActions(); 
    },

    study: function(id) {
        const tech = TechTree.find(x => x.id === id);
        if((GameState.inventory['research'] || 0) < tech.cost) { 
            UI.notify(t('game.notEnoughResearch'), true); 
            return; 
        }
        
        if(tech.requires) {
            const missing = tech.requires.find(req => !GameState.researchedTechs.includes(req));
            if(missing) {
                const reqTech = TechTree.find(x => x.id === missing);
                UI.notify(`${t('game.techRequired')} ${reqTech.name}`, true); 
                return;
            }
        }
        
        this.removeItem('research', tech.cost); 
        GameState.researchedTechs.push(id);
        tech.unlocks.forEach(rid => { 
            if(!GameState.unlockedRecipes.includes(rid)) GameState.unlockedRecipes.push(rid); 
        });
        
        Analytics.techUnlocked(id, tech.name, tech.cost);
        
        if(id === 'tech_garden_expand') {
            GameState.garden[2].locked = false;
            GameState.garden[3].locked = false;
        }
        
        UI.notify(`${t('game.crafted')} ${tech.name}`);
        Game.save(); UI.renderAll(); Game.checkEnvironment();
        Game.checkAchievements();

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
        
        if(GameState.researchedTechs.includes('tech_preservation')) {
            hungerHours *= 2;
        }
        
        GameState.hunger.fed = true;
        GameState.hunger.lastMeal = Date.now();
        GameState.hunger.duration = hungerHours * 60 * 60 * 1000;
        
        if(GameState.achievements) GameState.achievements.stats.mealsEaten++;
        
        const bonusText = GameState.researchedTechs.includes('tech_preservation') ? ' (2x konzervace!)' : '';
        UI.notify(t('game.fed').replace('{hours}', hungerHours).replace('{bonus}', bonusText));
        Game.save(); UI.renderAll();
    },
    checkDailyReward: function() {
        const now = Date.now();
        const today = new Date(now).setHours(0, 0, 0, 0);
        const lastLoginDay = new Date(GameState.dailyRewards.lastLogin).setHours(0, 0, 0, 0);
        const daysSinceLastLogin = Math.floor((today - lastLoginDay) / (24 * 60 * 60 * 1000));
        
        const lastClaimDay = new Date(GameState.dailyRewards.lastBonusClaimed).setHours(0, 0, 0, 0);
        if (today === lastClaimDay) return; 
        
        GameState.dailyRewards.lastLogin = now;
        GameState.dailyRewards.totalLogins++;
        
        if(GameState.achievements) {
            if(GameState.flags.fireplaceLit) GameState.achievements.stats.daysWithFire++;
            if(GameState.hunger.fed) GameState.achievements.stats.daysWithoutHunger++;
            else GameState.achievements.stats.daysWithoutHunger = 0; 
        }
        
        if (daysSinceLastLogin === 1) GameState.dailyRewards.streak++;
        else if (daysSinceLastLogin > 1) GameState.dailyRewards.streak = 1;
        else if (daysSinceLastLogin === 0 && GameState.dailyRewards.streak === 0) GameState.dailyRewards.streak = 1;
        
        let bonus = 1;
        let bonusText = "+1 Research";
        let streakBonus = false;
        
        // OPRAVA: Překlady bonusových hlášek
        if (GameState.dailyRewards.streak === 3) {
            bonus = 2;
            bonusText = `+2 Research (${t('daily.streak3')})`;
            streakBonus = true;
        } else if (GameState.dailyRewards.streak === 7) {
            bonus = 3;
            bonusText = `+3 Research (${t('daily.streak7')})`;
            streakBonus = true;
        } else if (GameState.dailyRewards.streak >= 10) {
            bonus = 3;
            bonusText = `+3 Research (${t('daily.streakMaster')})`;
            streakBonus = true;
        }
        
        this.addItem('research', bonus);
        GameState.dailyRewards.lastBonusClaimed = now;
        
        const factIndex = GameState.dailyRewards.totalLogins % DailyFactsDB.length;
        const fact = DailyFactsDB[factIndex];
        
        UI.showDailyRewardModal(bonusText, GameState.dailyRewards.streak, fact, streakBonus);
        UI.updateStreak();
        Analytics.dailyRewardClaimed(GameState.dailyRewards.streak);
        
        Game.save();
        Game.checkAchievements();
    },

    checkAchievements: function() {
        if(!GameState.achievements) return;
        let newUnlocks = [];
        
        AchievementsDB.forEach(ach => {
            if(GameState.achievements.unlocked.includes(ach.id)) return;
            if(ach.condition()) {
                GameState.achievements.unlocked.push(ach.id);
                newUnlocks.push(ach);
                if(ach.reward.research) this.addItem('research', ach.reward.research);
            }
        });
        
        if(newUnlocks.length > 0) {
            newUnlocks.forEach(ach => {
                setTimeout(() => {
                    // OPRAVA: Překlad názvu achievementu (pokud máte ach.name_en)
                    const _lang = GameState.settings.language || 'cs';
                    const name = (_lang === 'en' && ach.name_en) ? ach.name_en : ach.name;
                    UI.notify(`🏆 Achievement: ${name}!`);
                    Analytics.achievementUnlocked(ach.id, name);
                }, 300);
            });
            Game.save();
            UI.renderAll();
        }
        if(typeof LibraryHelpers !== 'undefined') LibraryHelpers.checkEasterEggs();
    },

    // === WELL SYSTEM ===

    drawWater: function(useBucket = false) {
        if (!GameState.well.built) {
            UI.notify(t('game.wellNoWell'), true);
            return;
        }
        if (GameState.well.condition === "broken") {
            UI.notify(t('game.wellBroken'), true);
            return;
        }
        
        const tool = useBucket ? "bucket" : "cooking_pot";
        if (!GameState.inventory[tool] || GameState.inventory[tool] <= 0) {
            // OPRAVA: Použití iName pro nástroj k nabírání vody
            UI.notify(t('game.needItemAmt').replace('{amt}', 1).replace('{item}', iName(tool)), true);
            return;
        }
        
        const stats = this.getWellStats(GameState.well.level);
        let waterAmount = useBucket ? stats.waterPerUseBucket : stats.waterPerUse;
        
        if (GameState.well.condition === "dirty") {
            waterAmount = Math.floor(waterAmount * 0.5);
            UI.notify(t('game.wellMurky'));
        }
        
        if (GameState.well.level === "blessed" && Math.random() < 0.2) {
            this.addItem("holy_water", 1);
            UI.notify(t('game.wellHolyWater'));
        } else {
            this.addItem("water", waterAmount);
            UI.notify(t('game.waterDrawn').replace('{amt}', waterAmount));
        }
        
        this.checkWellDegradation();
        GameState.well.lastUse = Date.now();
        if(GameState.achievements) GameState.achievements.stats.wellUses++;
        
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
        this.removeItem("purification_powder", 1);
        GameState.well.condition = "clean";
        if(GameState.achievements) GameState.achievements.stats.wellCleans++;
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
        this.removeItem("repair_kit", 1);
        GameState.well.condition = "clean";
        UI.notify(t('game.wellRepaired'));
        this.save();
        UI.renderAll();
    },

    upgradeWell: function(toLevel) {
        if (toLevel === "basic" && GameState.well.built) {
            UI.notify(t('game.wellAlreadyBuilt'), true);
            return;
        }
        if (toLevel === "stone" && GameState.well.level !== "basic") {
            UI.notify(t('game.wellNeedBasic'), true);
            return;
        }
        
        const cost = toLevel === "basic" ? { rock: 20, stick: 10, rope: 3 } : { rock: 30, rope: 5, charcoal: 10 };
        
        for (let [item, amt] of Object.entries(cost)) {
            if (!GameState.inventory[item] || GameState.inventory[item] < amt) {
                UI.notify(t('game.needItemAmt').replace('{amt}', amt).replace('{item}', iName(item)), true);
                return;
            }
        }
        
        for (let [item, amt] of Object.entries(cost)) this.removeItem(item, amt);
        
        GameState.well.built = true;
        GameState.well.level = toLevel;
        GameState.well.condition = "clean";
        UI.notify(toLevel === "basic" ? t('game.wellBuilt') : t('game.wellUpgraded'));
        this.save();
        UI.renderAll();
    },

    checkWellDegradation: function() {
        const stats = this.getWellStats(GameState.well.level);
        if (GameState.well.condition === "clean" && Math.random() < stats.degradeChance) {
            GameState.well.condition = "dirty";
            UI.notify(t('game.wellTurningGreen'), true);
        }
        if (GameState.well.condition === "dirty" && Math.random() < stats.breakChance) {
            GameState.well.condition = "broken";
            UI.notify(t('game.wellCollapsed'), true);
        }
    },

    getWellStats: function(level) {
        const stats = {
            "none": { waterPerUse: 0, waterPerUseBucket: 0, degradeChance: 0, breakChance: 0 },
            "basic": { waterPerUse: 3, waterPerUseBucket: 5, degradeChance: 0.15, breakChance: 0.05 },
            "stone": { waterPerUse: 4, waterPerUseBucket: 8, degradeChance: 0.05, breakChance: 0.02 },
            "blessed": { waterPerUse: 5, waterPerUseBucket: 10, degradeChance: 0.01, breakChance: 0.0 }
        };
        return stats[level] || stats["basic"];
    },
    setDuration: function(min, btn) {
        GameState.selectedDuration = min;
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        UI.renderActions();
    },

    igniteFireplace: function() {
        if (!GameState.inventory['tinderbox']) { 
            UI.notify(t('game.noTinderbox'), true); 
            return; 
        }
        this.removeItem('tinderbox', 1);
        const isFirstTime = !GameState.achievements?.stats?.fireplaceCount;
        GameState.flags.fireplaceLit = true;
        GameState.flags.forceDark = false;
        
        UI.notify(t('game.fireKindled'));
        if(audioSys) audioSys.startFireLoop(false);
        
        Analytics.fireplaceIgnited(isFirstTime);
        Game.save(); 
        Game.checkEnvironment();
    },

    lightSource: function(type) {
        if (!GameState.flags.fireplaceLit) { 
            UI.notify(t('game.needFire'), true); 
            return; 
        }
        let item = (type === 'candle') ? 'candle' : 'primitive_torch';
        
        if (!GameState.inventory[item]) { 
            // OPRAVA: Použití iName pro chybějící svíčku/louč
            UI.notify(t('game.missingItem').replace('{item}', iName(item)), true); 
            return; 
        }
        
        if (type === 'candle') { 
            GameState.flags.torchLit = false; 
            GameState.flags.candleLit = true; 
            GameState.candleStart = Date.now();
            if(GameState.achievements) GameState.achievements.stats.candlesLit++;
        } else { 
            GameState.flags.candleLit = false; 
            GameState.flags.torchLit = true; 
        }
        
        this.removeItem(item, 1);
        // OPRAVA: Použití iName pro potvrzení zapálení
        UI.notify(t('game.itemIgnited').replace('{item}', iName(item)));
        Game.save(); 
        Game.checkEnvironment();
    },

    farmAction: function(plotIdx) {
        const plot = GameState.garden[plotIdx];
        if(plot.locked) { UI.notify(t('game.plotLocked'), true); return; }
        
        // 1. PŘÍPRAVA PŮDY (Zúrodnění)
        if (plot.state === 0) {
            if (!(GameState.inventory['hoe'] > 0)) { 
                UI.notify(t('game.needHoe'), true); 
                return; 
            }
            const fertItem = (GameState.inventory['compost'] > 0) ? 'compost' : 'bonemeal';
            if (!(GameState.inventory[fertItem] > 0)) { 
                UI.notify(t('game.needFertilizer'), true); 
                return; 
            }
            this.removeItem(fertItem, 1); 
            plot.state = 1;
            UI.notify(t('garden.fertilized')); // Přidána notifikace

        // 2. SÁZENÍ
        } else if (plot.state === 1) {
            let seedsNeeded = '';
            if(plot.cropType === 'herb') seedsNeeded = 'seeds_herb';
            else if(plot.cropType === 'vegetable') seedsNeeded = 'seeds_vegetable';
            else if(plot.cropType === 'special') {
                const available = ['seeds_yellow', 'seeds_blue', 'seeds_mint', 'seeds_herb'].find(s => GameState.inventory[s] > 0);
                if(available) seedsNeeded = available;
            }
            
            if(!seedsNeeded || !(GameState.inventory[seedsNeeded] > 0)) { 
                UI.notify(t('game.needSeeds'), true); 
                return; 
            }
            
            this.removeItem(seedsNeeded, 1); 
            plot.state = 2; 
            
            // Určení plodiny
            if(seedsNeeded === 'seeds_herb') plot.crop = 'herb_red';
            else if(seedsNeeded === 'seeds_vegetable') {
                const veggies = ['carrot', 'onion', 'potato'];
                plot.crop = veggies[Math.floor(Math.random() * veggies.length)];
            }
            else if(seedsNeeded === 'seeds_yellow') plot.crop = 'herb_yellow';
            else if(seedsNeeded === 'seeds_blue') plot.crop = 'herb_blue';
            else if(seedsNeeded === 'seeds_mint') plot.crop = 'mint';
            
            plot.plantedAt = Date.now();
            UI.notify(t('garden.planted'));

        // 3. ZALÉVÁNÍ
        } else if (plot.state === 2 && !plot.water) {
            if (!(GameState.inventory['water'] > 0)) { 
                UI.notify(t('game.needWater'), true); 
                return; 
            }
            this.removeItem('water', 1); 
            plot.water = true;
            UI.notify(t('garden.watered'));

        // 4. SKLIZEŇ
        } else if (plot.state === 2 && plot.water) {
            let growthSpeed = CONFIG.GROWTH_SPEED || 1;
            if(GameState.researchedTechs.includes('tech_advanced_farming')) growthSpeed *= 1.5;
            
            const needed = (CONFIG.BASE_GROWTH_TIME || 300000) / growthSpeed;
            
            if (Date.now() > plot.plantedAt + needed) {
                const harvestCrop = plot.crop;
                plot.state = 0; 
                plot.water = false; 
                plot.crop = null; 
                
                if(GameState.achievements) GameState.achievements.stats.harvests++;
                
                // Výnosy
                if(['herb_red','herb_yellow','herb_blue','mint'].includes(harvestCrop)) {
                    this.addItem(harvestCrop, 2);
                } else if(['carrot','onion','potato'].includes(harvestCrop)) {
                    this.addItem(harvestCrop, 3);
                    if(Math.random() > 0.5) this.addItem('seeds_vegetable', 1);
                }
                
                Game.checkAchievements();
            } else {
                UI.notify(t('game.growing'), true);
            }
        }
        Game.save(); 
        UI.renderAll();
    },

    setVolume: function(val) { 
        if(GameState.settings) GameState.settings.volume = val;
        if(audioSys) audioSys.setVolume(val); 
    },

    setTheme: function(themeName) {
        if(themeName === 'auto') {
            GameState.settings.autoTheme = true;
            ThemeSystem.updateAutoTheme();
        } else {
            GameState.settings.autoTheme = false;
            ThemeSystem.applyTheme(themeName);
        }
        Game.save();
    },
    // === SYSTÉM ZÁLOHOVÁNÍ A SPRÁVY DAT ===

    exportSave: function() {
        try {
            const saveData = JSON.stringify(GameState, null, 2);
            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `scriptorium_save_${timestamp}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            UI.notify(t('game.saveExported'));
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
                
                // Validace dat
                if (!importedData.inventory || !importedData.flags) {
                    UI.notify(t('game.saveImportFail'), true);
                    return;
                }
                
                // Potvrzení přepsání
                if (!confirm(t('game.overwriteSave'))) {
                    return;
                }
                
                // Import a uložení
                Object.assign(GameState, importedData);
                Game.save();
                
                UI.notify(t('game.saveImported'));
                
                // Čistý restart pro načtení všech systémů
                setTimeout(() => location.reload(), 1500);
                
            } catch(e) {
                UI.notify(t('game.errorImport'), true);
                console.error('Import error:', e);
            }
        };
        reader.readAsText(file);
    },

    triggerImport: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) this.importSave(file);
        };
        input.click();
    },

    resetSave: function() {
        if (confirm(t('game.confirmReset'))) {
            try {
                localStorage.removeItem('scriptorium_save_v6_4');
                location.reload();
            } catch(e) {
                console.error('Reset error:', e);
            }
        }
    }
}; // KONEC OBJEKTU GAME

// Inicializace hry po načtení okna
window.onload = () => {
    Game.init();
};