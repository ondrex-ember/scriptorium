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
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=2`;
            
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
        
        // Tomorrow's forecast
        const tomorrowMaxTemp = Math.round(data.daily.temperature_2m_max[1]);
        const tomorrowMinTemp = Math.round(data.daily.temperature_2m_min[1]);
        const tomorrowCode = data.daily.weather_code[1];
        const tomorrowEmoji = this.getWeatherEmoji(tomorrowCode);
        
        tomorrowEl.innerHTML = `${tomorrowEmoji}${tomorrowMaxTemp}°/${tomorrowMinTemp}°`;
        tomorrowEl.title = `Zítra v Praze: max ${tomorrowMaxTemp}°C, min ${tomorrowMinTemp}°C (klikni pro refresh)`;
        
        // Update auto theme if enabled
        if(GameState.settings.autoTheme) {
            ThemeSystem.updateAutoTheme();
        }
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

