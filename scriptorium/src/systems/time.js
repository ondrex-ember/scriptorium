const TimeSys = {
    getPhase: function() {
        const now = new Date();
        // Přičteme minuty jako desetinné místo (např. 23:30 = 23.5)
        const h = now.getHours() + (now.getMinutes() / 60);
        
        if (h >= 5 && h < 7) return `🌅 ${t('time.phase_dawn')}`;
        if (h >= 7 && h < 9) return `🌄 ${t('time.phase_morning')}`;
        if (h >= 9 && h < 11) return `☀️ ${t('time.phase_forenoon')}`;
        if (h >= 11 && h < 13) return `🌞 ${t('time.phase_noon')}`;
        if (h >= 13 && h < 18) return `🌥️ ${t('time.phase_afternoon')}`;
        if (h >= 18 && h < 22) return `🌇 ${t('time.phase_evening')}`;
        if (h >= 22 && h < 23.5) return `🕯️ ${t('time.phase_night')}`;
        if (h >= 23.5 || h < 0.5) return `🌑 ${t('time.phase_midnight')}`; // Půlnoc
        return `🌌 ${t('time.phase_deepnight')}`;
    },
    
    isDaytime: function() { 
        const h = new Date().getHours(); 
        return (h >= 5 && h < 18); 
    },
    
    update: function() {
        const timeEl = document.getElementById('time-display');
        const hungerEl = document.getElementById('hunger-display');
        
        // Safety check - DOM might not be ready yet
        if(!timeEl || !hungerEl) {
            return;
        }
        
        const phase = this.getPhase();
        timeEl.innerText = phase;
        
        // Hunger display - VÝRAZNÝ progresivní indikátor
        hungerEl.style.color = ""; // Reset color
        
        if(GameState.hunger.fed) {
            const elapsed = Date.now() - GameState.hunger.lastMeal;
            const remaining = GameState.hunger.duration - elapsed;
            const percentRemaining = Math.max(0, remaining / GameState.hunger.duration);
            
            // Různá emoji podle stavu
            let icon = "🍖";
            let tooltip = "";
            
            const hoursLeft = Math.floor(remaining / (60 * 60 * 1000));
            const minutesLeft = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            
            if(percentRemaining > 0.75) {
                // 100-75% = plně nasycen
                icon = "🍖";
                tooltip = t('hunger.full').replace('{h}', hoursLeft).replace('{m}', minutesLeft);
                hungerEl.style.filter = "drop-shadow(0 0 3px #4caf50)";
                hungerEl.style.transform = "scale(1.1)";
                hungerEl.style.animation = "";
            } else if(percentRemaining > 0.5) {
                // 75-50% = lehký hlad
                icon = "🥩";
                tooltip = t('hunger.light').replace('{h}', hoursLeft).replace('{m}', minutesLeft);
                hungerEl.style.filter = "drop-shadow(0 0 2px #ff9800)";
                hungerEl.style.transform = "scale(1.05)";
                hungerEl.style.animation = "";
            } else if(percentRemaining > 0.25) {
                // 50-25% = střední hlad
                icon = "🦴";
                tooltip = t('hunger.medium').replace('{h}', hoursLeft).replace('{m}', minutesLeft);
                hungerEl.style.filter = "drop-shadow(0 0 2px #ff5722)";
                hungerEl.style.transform = "scale(1)";
                hungerEl.style.animation = "";
            } else {
                // 25-0% = velký hlad (bliká!)
                icon = "☠️";
                tooltip = t('hunger.heavy').replace('{h}', hoursLeft).replace('{m}', minutesLeft);
                hungerEl.style.filter = "drop-shadow(0 0 4px #f44336)";
                hungerEl.style.transform = "";
                hungerEl.style.animation = "pulse 1s ease-in-out infinite";
            }
            
            hungerEl.innerText = icon;
            hungerEl.style.opacity = "1";
            hungerEl.title = tooltip;
        } else {
            // Hladový = lebka (červená, blikající)
            hungerEl.innerText = "💀";
            hungerEl.style.filter = "drop-shadow(0 0 5px #f44336)";
            hungerEl.style.opacity = "1";
            hungerEl.style.transform = "";
            hungerEl.style.animation = "pulse 0.8s ease-in-out infinite";
            hungerEl.title = t('hunger.starving');
        }
        
        // Candle check
        if (GameState.flags.candleLit) {
            if ((Date.now() - GameState.candleStart) > CONFIG.CANDLE_DURATION) {
                GameState.flags.candleLit = false;
                GameState.candleStart = 0;
                // Fallback na natvrdo napsaný řetězec, pokud klíč chybí
                UI.notify(t('game.candleBurnedOut') || 'Svíčka dohořela.', true);
                Game.checkEnvironment(); 
                Game.save();
            }
        }
        
        // Hunger check
        if (GameState.hunger.fed) {
            const elapsed = Date.now() - GameState.hunger.lastMeal;
            if (elapsed > GameState.hunger.duration) {
                GameState.hunger.fed = false;
                UI.notify(t('hunger.notified'), true);
                Game.save();
            }
        }
        
        const researchCount = GameState.inventory.research || 0;
        const researchEl = document.getElementById('research-count');
        if (researchEl) {
            researchEl.textContent = researchCount;
            
            // Optional: Color coding
            if (researchCount === 0) {
                researchEl.style.color = '#999'; // Šedá
            } else if (researchCount < 5) {
                researchEl.style.color = '#fbbf24'; // Žlutá
            } else {
                researchEl.style.color = '#4ade80'; // Zelená
            }
        }
        
        // Check library unlocks (daily)
        if(GameState.library && typeof LibraryHelpers !== 'undefined') {
            LibraryHelpers.checkLibraryUnlocks();
        }
        
        if (typeof UI !== 'undefined' && typeof UI.renderActions === 'function') {
            UI.renderActions();
        }
    }
};

// ========== v7.5 CANONICAL HOURS SYSTEM ==========
// Benediktinský denní řád - 8 modlitebních hodin s časovými buffy