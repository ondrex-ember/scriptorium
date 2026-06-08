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
        
        // ==========================================
        // 1. KONTROLY STAVU (Provádí se před UI)
        // ==========================================
        
        // Hunger check
        if (GameState.hunger.fed) {
            const elapsed = Date.now() - GameState.hunger.lastMeal;
            if (elapsed >= GameState.hunger.duration) {
                GameState.hunger.fed = false;
                UI.notify(t('hunger.notified'), true);
                Game.save();
            }
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

        // ==========================================
        // 2. VYKRESLENÍ UI
        // ==========================================
        
        // Hunger display - VÝRAZNÝ progresivní indikátor
        hungerEl.style.color = ""; // Reset color
        
        if(GameState.hunger.fed) {
            const elapsed = Date.now() - GameState.hunger.lastMeal;
            const remaining = Math.max(0, GameState.hunger.duration - elapsed);
            const percentRemaining = remaining / GameState.hunger.duration;
            
            // Různá emoji podle stavu
            let icon = "🍖";
            let tooltip = "";
            
            const hoursLeft = Math.floor(remaining / (60 * 60 * 1000));
            // Přidáno padStart pro úhledné zobrazení minut (např. 05m)
            const minutesLeft = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000)).toString().padStart(2, '0');
            
            if(percentRemaining > 0.75) {
                // 100-75% = plně nasycen
                icon = "🍖";
                tooltip = t('hunger.full').replace('{h}', hoursLeft).replace('{m}', minutesLeft);
                hungerEl.style.filter = "drop-shadow(0 0 3px #4caf50)";
                hungerEl.style.transform = "scale(1.1)";
                hungerEl.style.animation = "none";
            } else if(percentRemaining > 0.5) {
                // 75-50% = lehký hlad
                icon = "🥩";
                tooltip = t('hunger.light').replace('{h}', hoursLeft).replace('{m}', minutesLeft);
                hungerEl.style.filter = "drop-shadow(0 0 2px #ff9800)";
                hungerEl.style.transform = "scale(1.05)";
                hungerEl.style.animation = "none";
            } else if(percentRemaining > 0.25) {
                // 50-25% = střední hlad
                icon = "🦴";
                tooltip = t('hunger.medium').replace('{h}', hoursLeft).replace('{m}', minutesLeft);
                hungerEl.style.filter = "drop-shadow(0 0 2px #ff5722)";
                hungerEl.style.transform = "scale(1)";
                hungerEl.style.animation = "none";
            } else {
                // 25-0% = velký hlad (bliká!)
                icon = "☠️";
                tooltip = t('hunger.heavy').replace('{h}', hoursLeft).replace('{m}', minutesLeft);
                hungerEl.style.filter = "drop-shadow(0 0 4px #f44336)";
                hungerEl.style.transform = "scale(1)";
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
            hungerEl.style.transform = "scale(1)";
            hungerEl.style.animation = "pulse 0.8s ease-in-out infinite";
            hungerEl.title = t('hunger.starving');
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
        
        // ========== NEW: Update header background ==========
        if (typeof HeaderBG !== 'undefined') {
            HeaderBG.update();
        }
        
        // ========== NEW: Check canonical hours ==========
        if (typeof CanonicalHours !== 'undefined') {
            CanonicalHours.checkCurrentHour();
        }
        
        // ========== NEW: Hour chime check ==========
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        if (minutes === 0 && seconds === 0 && typeof CanonicalHours !== 'undefined') {
            CanonicalHours.playHourChime(now.getHours());
        }
        
        if (typeof UI !== 'undefined' && typeof UI.renderActions === 'function') {
            UI.renderActions();
        }
    }
};

// ========== HEADER BACKGROUND SYSTEM ==========
// Dynamic seasonal and weather-based header images

const HeaderBG = {
    basePath: '/header/',
    
    // Image mappings (season_weather format)
    images: {
        // Seasonal bases (clear weather)
        spring_clear: 'spring.jpg',
        summer_clear: 'summer.jpg',
        autumn_clear: 'autumn.jpg',
        winter_clear: 'winter.jpg',
        
        // Weather variants (Phase 1: Spring only)
        spring_rain: 'spring-rain.jpg',
        spring_storm: 'spring-storm.jpg',
        
        // TODO Phase 2: Add remaining 6 images
        // summer_rain: 'summer-rain.jpg',
        // summer_storm: 'summer-storm.jpg',
        // autumn_rain: 'autumn-rain.jpg',
        // autumn_storm: 'autumn-storm.jpg',
        // winter_snow: 'winter-snow.jpg',
        // winter_storm: 'winter-storm.jpg',
        
        // Fallback
        fallback: 'base-universal.jpg'
    },
    
    currentKey: null,
    
    init: function() {
        this.update();
    },
    
    update: function() {
        const season = this.getSeason();
        const weather = this.getWeather();
        const key = `${season}_${weather}`;
        
        // Skip if no change (performance optimization)
        if (key === this.currentKey) return;
        this.currentKey = key;
        
        // Fallback chain: try exact match → seasonal base → universal
        const imageFile = this.images[key] 
                       || this.images[`${season}_clear`] 
                       || this.images.fallback;
        
        const imagePath = this.basePath + imageFile;
        
        // Update background layer
        const layer = document.querySelector('.header-bg-layer');
        if (layer) {
            // Update only the image URL, keep the gradient overlay
            layer.style.backgroundImage = `
                linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%),
                url('${imagePath}')
            `;
        }
    },
    
    getSeason: function() {
        const now = new Date();
        const m = now.getMonth() + 1; // 1-12
        const d = now.getDate();
        // Astronomické dělení roku
        if (m === 3 && d >= 20 || m === 4 || m === 5 || m === 6 && d < 21) return 'spring';
        if (m === 6 && d >= 21 || m === 7 || m === 8 || m === 9 && d < 23) return 'summer';
        if (m === 9 && d >= 23 || m === 10 || m === 11 || m === 12 && d < 21) return 'autumn';
        return 'winter';
    },
    
    getWeather: function() {
        // Integrate with WeatherSystem (if available)
        if (typeof WeatherSystem === 'undefined' || !WeatherSystem.cache || !WeatherSystem.cache.current) {
            return 'clear'; // Default when API not available
        }
        
        const code = WeatherSystem.cache.current.weather_code;
        
        // WMO Weather interpretation codes
        // Reference: https://open-meteo.com/en/docs
        if (code === undefined || code <= 3) return 'clear';      // 0-3 = Clear/partly cloudy
        if (code >= 61 && code <= 65) return 'rain';             // 61-65 = Rain
        if (code >= 71 && code <= 77) return 'snow';             // 71-77 = Snow
        if (code >= 80) return 'storm';                          // 80+ = Storms/showers
        
        return 'clear'; // Fallback
    }
};