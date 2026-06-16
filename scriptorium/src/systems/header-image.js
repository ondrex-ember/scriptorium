const HeaderImageSystem = {

    // Base path for header images
    basePath: '/header/',

    // Time slot detection
    getTimeSlot: function() {
        const h = new Date().getHours();
        if (h >= 5  && h <= 9)  return 'morning';
        if (h >= 10 && h <= 17) return 'day';
        if (h >= 18 && h <= 20) return 'evening';
        if (h >= 21 || h === 0) return 'night';
        // 1:00 – 4:59
        return 'night-late';
    },

    // Weather condition detection from WMO code
    getWeatherCondition: function(weatherCode) {
        if (weatherCode === null || weatherCode === undefined) return 'clear';
        if (weatherCode >= 95) return 'rain'; // Thunderstorm → fallback to rain
        if (weatherCode >= 51 && weatherCode <= 82) return 'rain';
        return 'clear';
    },

    // Build filename from parts with fallback cascade
    resolveImage: function(season, timeSlot, condition) {
        const candidates = [];

        // Build suffix from time slot
        const timeSuffix = timeSlot === 'day' ? '' : `-${timeSlot}`;

        // Primary candidate
        if (condition === 'rain') {
            candidates.push(`${season}${timeSuffix}-rain`);
        }
        // Clear or rain fallbacks
        candidates.push(`${season}${timeSuffix}`);

        // Rain fallback to generic rain
        if (condition === 'rain') {
            candidates.push(`${season}-rain`);
        }

        // Season day fallback
        candidates.push(season);

        // Final fallback
        candidates.push('base-universal');

        return candidates;
    },

    // Find first existing image from candidates list
    findExisting: async function(candidates) {
        for (const name of candidates) {
            const url = `${this.basePath}${name}.jpg`;
            try {
                const res = await fetch(url, { method: 'HEAD' });
                if (res.ok) return url;
            } catch (e) {
                // continue
            }
        }
        return `${this.basePath}base-universal.jpg`;
    },

    // Main update function — call this after weather data is available
    update: async function() {
        const layer = document.querySelector('.header-bg-layer');
        if (!layer) return;

        // Determine season
        let season = 'spring';
        // Astronomické dělení roku — základ vždy
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        if ((m === 3 && d >= 20) || m === 4 || m === 5 || (m === 6 && d < 21)) season = 'spring';
        else if ((m === 6 && d >= 21) || m === 7 || m === 8 || (m === 9 && d < 23)) season = 'summer';
        else if ((m === 9 && d >= 23) || m === 10 || m === 11 || (m === 12 && d < 21)) season = 'autumn';
        else season = 'winter';

        // ThemeSystem může vrátit validní roční období — použít jen pokud je to skutečná roční doba
        if (typeof ThemeSystem !== 'undefined' && WeatherSystem.cache) {
            const weatherTheme = ThemeSystem.getWeatherBasedTheme();
            if (['spring', 'summer', 'autumn', 'winter'].includes(weatherTheme)) {
                season = weatherTheme;
            }
            // 'default', 'dark' ignorujeme — zůstane astronomický season
        }

        const timeSlot = this.getTimeSlot();
        const weatherCode = WeatherSystem.cache
            ? WeatherSystem.cache.current.weather_code
            : null;
        const condition = this.getWeatherCondition(weatherCode);

        // Snow → force winter season (WMO 71–77 = snow, 85–86 = snow showers)
        // Excludes 80–82 (rain showers) and 83–84 (rain+snow mix) which are NOT snow
        if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
            season = 'winter';
        }

        const candidates = this.resolveImage(season, timeSlot, condition);
        const imageUrl = await this.findExisting(candidates);

        // Apply with smooth transition
        layer.style.backgroundImage = `
            linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%),
            url('${imageUrl}')
        `;

        // Debug log (remove in production)
        console.log(`[HeaderImage] season=${season} time=${timeSlot} condition=${condition} → ${imageUrl}`);
    },

    init: function() {
        // Initial update (may run without weather data — uses month fallback)
        this.update();
    }
};
