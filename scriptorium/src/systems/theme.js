const ThemeSystem = {
    themes: {
        'default': 'Klasické Pergamen',
        'dark': 'Temný Mód',
        'spring': 'Jaro',
        'summer': 'Léto',
        'autumn': 'Podzim',
        'winter': 'Zima',
        'auto': 'Automaticky (počasí)'
    },
    
    applyTheme: function(themeName, silent = false) {
        // Remove all theme classes
        document.body.classList.remove('theme-dark', 'theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter');
        
        // Apply new theme
        if(themeName !== 'default' && themeName !== 'auto') {
            document.body.classList.add('theme-' + themeName);
        }
        
        const oldTheme = GameState.settings.theme;
        
        // Save preference
        GameState.settings.theme = themeName;
        Game.save();
        
        // Notify user on manual change
        if(!silent && themeName !== oldTheme) {
            const themeNames = {
                'default': 'Klasické Pergamen',
                'dark': 'Temný Mód 🌙',
                'spring': 'Jaro 🌸',
                'summer': 'Léto ☀️',
                'autumn': 'Podzim 🍂',
                'winter': 'Zima ❄️'
            };
            UI.notify(`Téma: ${themeNames[themeName] || themeName}`);
        }
    },
    
    getWeatherBasedTheme: function() {
        if(!WeatherSystem.cache) return 'default';
        
        const currentCode = WeatherSystem.cache.current.weather_code;
        const currentTemp = WeatherSystem.cache.current.temperature_2m;
        const month = new Date().getMonth(); // 0-11
        
        // Snow always → Winter
        if(currentCode >= 71 && currentCode <= 86) return 'winter';
        
        // Month-based seasons (primary)
        // Winter: Dec, Jan, Feb (11, 0, 1)
        if(month === 11 || month === 0 || month === 1) {
            return 'winter';
        }
        // Spring: Mar, Apr, May (2, 3, 4)
        else if(month >= 2 && month <= 4) {
            return 'spring';
        }
        // Summer: Jun, Jul, Aug (5, 6, 7)
        else if(month >= 5 && month <= 7) {
            return 'summer';
        }
        // Autumn: Sep, Oct, Nov (8, 9, 10)
        else if(month >= 8 && month <= 10) {
            return 'autumn';
        }
        
        // Fallback: temperature-based
        if(currentTemp < 5) return 'winter';
        if(currentTemp < 15) return 'spring';
        if(currentTemp < 25) return 'summer';
        return 'autumn';
    },
    
    updateAutoTheme: function() {
        if(!GameState.settings.autoTheme) return;
        
        const weatherTheme = this.getWeatherBasedTheme();
        this.applyTheme(weatherTheme, true); // Silent auto-update
    },
    
    init: function() {
        // Apply saved theme (silent on init)
        const savedTheme = GameState.settings.theme || 'default';
        
        if(savedTheme === 'auto') {
            GameState.settings.autoTheme = true;
            this.updateAutoTheme();
        } else {
            this.applyTheme(savedTheme, true);
        }
    }
};

