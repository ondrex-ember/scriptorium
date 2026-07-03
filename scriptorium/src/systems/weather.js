const WeatherSystem = {
    cache: null,
    cacheTime: 0,
    cacheDuration: 30 * 60 * 1000, // 30 minut
    
    // Prague coordinates
    lat: 50.0755,
    lon: 14.4378,
    
    // WMO Weather codes → emoji mapping
    getWeatherEmoji: function(code) {
        // WMO codes: https://www.noaa.gov/weather
        if (code === 0) return '☀️'; // Clear sky
        if (code === 1) return '🌤️'; // Mainly clear
        if (code === 2) return '⛅'; // Partly cloudy
        if (code === 3) return '☁️'; // Overcast
        if (code >= 45 && code <= 48) return '🌫️'; // Fog
        if (code >= 51 && code <= 57) return '🌦️'; // Drizzle
        if (code >= 61 && code <= 67) return '🌧️'; // Rain
        if (code >= 71 && code <= 77) return '🌨️'; // Snow
        if (code >= 80 && code <= 82) return '🌧️'; // Rain showers
        if (code >= 85 && code <= 86) return '🌨️'; // Snow showers
        if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
        return '🌍'; // Unknown
    },
    
    fetchWeather: async function(forceRefresh = false) {
        // Check cache
        const now = Date.now();
        if (!forceRefresh && this.cache && (now - this.cacheTime) < this.cacheDuration) {
            this.updateDisplay(this.cache);
            return;
        }
        
        // Show loading
        const todayEl = document.getElementById('weather-today');
        const tomorrowEl = document.getElementById('weather-tomorrow');
        todayEl.innerHTML = '⏳';
        tomorrowEl.innerHTML = '⏳';
        
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,sunrise,sunset&timezone=auto&past_days=7&forecast_days=7`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Weather API error');
            
            const data = await response.json();
            
            // Cache data
            this.cache = data;
            this.cacheTime = now;
            
            // Save to localStorage
            try {
                localStorage.setItem('weather_cache', JSON.stringify({ data, time: now }));
            } catch(e) {}
            
            this.updateDisplay(data);
        } catch (error) {
            console.error('Weather fetch error:', error);
            
            // Try to load from localStorage
            try {
                const cached = localStorage.getItem('weather_cache');
                if (cached) {
                    const { data, time } = JSON.parse(cached);
                    if ((now - time) < 24 * 60 * 60 * 1000) { // Use cache if < 24h old
                        this.cache = data;
                        this.cacheTime = time;
                        this.updateDisplay(data);
                        return;
                    }
                }
            } catch(e) {}
            
            // Fallback - show error
            todayEl.innerHTML = '❌';
            tomorrowEl.innerHTML = '❌';
            todayEl.title = 'Chyba načítání počasí (klikni pro retry)';
            tomorrowEl.title = 'Chyba načítání počasí (klikni pro retry)';
        }
    },
    
    updateDisplay: function(data) {
        if (!data) return;
        
        const todayEl = document.getElementById('weather-today');
        const tomorrowEl = document.getElementById('weather-tomorrow');
        
        // Current weather
        const currentTemp = Math.round(data.current.temperature_2m);
        const currentCode = data.current.weather_code;
        const currentEmoji = this.getWeatherEmoji(currentCode);
        
        todayEl.innerHTML = `${currentEmoji}${currentTemp}°`;
        todayEl.title = `Aktuálně v Praze: ${currentTemp}°C (klikni pro refresh)`;
        
        // Tomorrow's forecast (past_days posouvá pole → najdi dnešek)
        const tIdx = this.getDailyIndex(1);
        const tomorrowMaxTemp = Math.round(data.daily.temperature_2m_max[tIdx]);
        const tomorrowMinTemp = Math.round(data.daily.temperature_2m_min[tIdx]);
        const tomorrowCode = data.daily.weather_code[tIdx];
        const tomorrowEmoji = this.getWeatherEmoji(tomorrowCode);
        
        tomorrowEl.innerHTML = `${tomorrowEmoji}${tomorrowMaxTemp}°/${tomorrowMinTemp}°`;
        tomorrowEl.title = `Zítra v Praze: max ${tomorrowMaxTemp}°C, min ${tomorrowMinTemp}°C (klikni pro refresh)`;
        
        // Update auto theme if enabled
        if(GameState.settings.autoTheme) {
            ThemeSystem.updateAutoTheme();
        }

        // Update header background image (season + time + weather)
        if(typeof HeaderImageSystem !== 'undefined') {
            HeaderImageSystem.update();
        }
    },
    
    // ─── Daily index helpers (past_days posouvá daily pole) ──────────────
    // Najde index "dneška" v daily.time; vrátí idx+offset.
    // Fallback = offset (staré chování) když time chybí / dnešek nenalezen.
    getDailyIndex: function(offset = 0) {
        try {
            const t = this.cache && this.cache.daily && this.cache.daily.time;
            if (Array.isArray(t) && t.length) {
                const d = new Date();
                const today = d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
                const idx = t.indexOf(today);
                if (idx >= 0) return idx + offset;
            }
        } catch (e) {}
        return offset;
    },

    // Počet suchých dní (< 0.1 mm) v okně [dnes−daysBack … dnes] včetně.
    countDryDays: function(daysBack = 3) {
        const out = { dry: 0, total: 0 };
        try {
            const ps = this.cache && this.cache.daily && this.cache.daily.precipitation_sum;
            if (!Array.isArray(ps) || !ps.length) return out;
            const todayIdx = this.getDailyIndex(0);
            const start = Math.max(0, todayIdx - daysBack);
            const end = Math.min(ps.length - 1, todayIdx);
            for (let i = start; i <= end; i++) {
                out.total++;
                if ((ps[i] || 0) < 0.1) out.dry++;
            }
        } catch (e) {}
        return out;
    },

    // Počet vlhkých dní (≥ 1.0 mm) v okně [dnes−daysBack … dnes] včetně.
    // Vzor identický s countDryDays, jen invertovaný práh — pro riziko paličkovice u žita.
    countWetDays: function(daysBack = 3) {
        const out = { wet: 0, total: 0 };
        try {
            const ps = this.cache && this.cache.daily && this.cache.daily.precipitation_sum;
            if (!Array.isArray(ps) || !ps.length) return out;
            const todayIdx = this.getDailyIndex(0);
            const start = Math.max(0, todayIdx - daysBack);
            const end = Math.min(ps.length - 1, todayIdx);
            for (let i = start; i <= end; i++) {
                out.total++;
                if ((ps[i] || 0) >= 1.0) out.wet++;
            }
        } catch (e) {}
        return out;
    },

    init: function() {
        // Try to load from cache first (instant display)
        try {
            const cached = localStorage.getItem('weather_cache');
            if (cached) {
                const { data, time } = JSON.parse(cached);
                const now = Date.now();
                if ((now - time) < this.cacheDuration) {
                    this.cache = data;
                    this.cacheTime = time;
                    this.updateDisplay(data);
                }
            }
        } catch(e) {}
        
        // Initial fetch
        this.fetchWeather();
        
        // Update every 30 minutes
        setInterval(() => {
            this.fetchWeather();
        }, this.cacheDuration);
    }
};