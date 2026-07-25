const ThemeSystem = {
    themes: {
        'default': 'Klasické Pergamen',
        'dark': 'Temný Mód',
        'night': 'Noční Mód',
        'sunlight': 'Sluneční Mód',
        'spring': 'Jaro',
        'summer': 'Léto',
        'autumn': 'Podzim',
        'winter': 'Zima',
        'auto': 'Automaticky (počasí)'
    },
    
    applyTheme: function(themeName, silent = false) {
        // Remove all theme classes
        document.body.classList.remove('theme-dark', 'theme-night', 'theme-sunlight', 'theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter');
        
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
                'night': 'Noční Mód 🌑',
                'sunlight': 'Sluneční Mód ☀️',
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
        const now = new Date();
        const m = now.getMonth() + 1; // 1-12
        const d = now.getDate();
        
        // Snow always → Winter
        if(currentCode >= 71 && currentCode <= 86) return 'winter';
        
        // Astronomické dělení roku
        if (m === 3 && d >= 20 || m === 4 || m === 5 || m === 6 && d < 21) return 'spring';
        if (m === 6 && d >= 21 || m === 7 || m === 8 || m === 9 && d < 23) return 'summer';
        if (m === 9 && d >= 23 || m === 10 || m === 11 || m === 12 && d < 21) return 'autumn';
        if (m === 12 && d >= 21 || m === 1 || m === 2 || m === 3 && d < 20) return 'winter';
        
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
    
    applyDesignStyle: function(styleName, silent = false) {
        if (styleName !== 'pokorna' && styleName !== 'marniva') {
            styleName = 'marniva';
        }
        
        document.body.classList.remove('design-pokorna', 'design-marniva');
        document.body.classList.add('design-' + styleName);
        
        const oldStyle = GameState.settings.designStyle;
        GameState.settings.designStyle = styleName;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        
        if (!silent && styleName !== oldStyle) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const label = styleName === 'pokorna' 
                ? (lang === 'en' ? 'Style: Humble 🪨' : 'Vzhled: Pokorná 🪨')
                : (lang === 'en' ? 'Style: Vanity ✨' : 'Vzhled: Marnivá ✨');
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(label);
        }
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

        // Apply saved design style (default: marniva)
        const savedDesign = GameState.settings.designStyle || 'marniva';
        this.applyDesignStyle(savedDesign, true);
    }
};
