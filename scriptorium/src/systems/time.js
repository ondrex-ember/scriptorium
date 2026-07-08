const TimeSys = {
    // Jednotný "herní čas" — vždy Europe/Prague, bez ohledu na časové pásmo zařízení hráče.
    // Používat pro VŠECHNY herní mechaniky vázané na hodinu (Regula, Conversi, kanonické hodiny,
    // trh, Athanor bonus, martyrologium). Kosmetika (téma, header, denní fáze) zůstává na lokálním čase.
    gameHour: function(withMinutes) {
        const now = new Date();
        try {
            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', hour12: false
            }).formatToParts(now);
            const h = parseInt(parts.find(p => p.type === 'hour').value, 10);
            const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
            return withMinutes ? (h + m / 60) : h;
        } catch (e) {
            // Fallback (Intl nedostupné) — lokální čas zařízení, lepší než pád
            return withMinutes ? (now.getHours() + now.getMinutes() / 60) : now.getHours();
        }
    },

    // Den v týdnu (0=Ne...6=So) podle Europe/Prague — pro otvírací dobu (Cellarium)
    gameWeekday: function() {
        const now = new Date();
        try {
            const wd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', weekday: 'short' }).format(now);
            const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
            return map[wd] !== undefined ? map[wd] : now.getDay();
        } catch (e) {
            return now.getDay();
        }
    },

    getPhase: function() {
        const now = new Date();
        const h = now.getHours() + (now.getMinutes() / 60);
        
        if (h >= 5 && h < 7) return `🌅 ${t('time.phase_dawn')}`;
        if (h >= 7 && h < 9) return `🌄 ${t('time.phase_morning')}`;
        if (h >= 9 && h < 11) return `☀️ ${t('time.phase_forenoon')}`;
        if (h >= 11 && h < 13) return `🌞 ${t('time.phase_noon')}`;
        if (h >= 13 && h < 18) return `🌥️ ${t('time.phase_afternoon')}`;
        if (h >= 18 && h < 22) return `🌇 ${t('time.phase_evening')}`;
        if (h >= 22 && h < 23.5) return `🕯️ ${t('time.phase_night')}`;
        if (h >= 23.5 || h < 0.5) return `🌑 ${t('time.phase_midnight')}`;
        return `🌌 ${t('time.phase_deepnight')}`;
    },

    getLunarPhase: function() {
        // Jednoduchý výpočet lunární fáze (synodická perioda 29.53 dní)
        const now = new Date();
        const msPerDay = 86400000;
        // Referenční nový měsíc: 6. ledna 2000 18:14 UTC (J2000.0 nulový bod)
        const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
        const daysSince = (now - knownNewMoon) / msPerDay;
        const phase = ((daysSince % 29.53058867) + 29.53058867) % 29.53058867;
        // 8 fází
        const idx = Math.round(phase / 29.53058867 * 8) % 8;
        return ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'][idx];
    },

    getDateStr: function() {
        const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth(); // 0-11
        const monthsCS = ['LEDNA','ÚNORA','BŘEZNA','DUBNA','KVĚTNA','ČERVNA','ČERVENCE','SRPNA','ZÁŘÍ','ŘÍJNA','LISTOPADU','PROSINCE'];
        const monthsEN = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
        return lang === 'en' ? `${day}. ${monthsEN[month]}` : `${day}. ${monthsCS[month]}`;
    },
    
    isDaytime: function() { 
        const h = new Date().getHours(); 
        return (h >= 5 && h < 18); 
    },
    
    update: function() {
        const timeEl = document.getElementById('time-display');

        // Safety check - DOM might not be ready yet
        if (!timeEl) return;

        const phase = this.getPhase();
        timeEl.innerText = phase;

        // Date display (desktop only, mobile skrytý přes CSS)
        const dateEl = document.getElementById('date-display');
        if (dateEl) dateEl.innerText = this.getDateStr();

        // Lunar phase u počasí
        const lunarEl = document.getElementById('lunar-display');
        if (lunarEl) lunarEl.innerText = this.getLunarPhase();

        // Candle check
        if (GameState.flags && GameState.flags.candleLit) {
            if ((Date.now() - GameState.candleStart) > CONFIG.CANDLE_DURATION) {
                GameState.flags.candleLit = false;
                GameState.candleStart = 0;
                UI.notify(t('game.candleBurnedOut') || 'Svíčka dohořela.');
                Game.checkEnvironment();
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
        
        // ========== NEW: Check canonical hours ==========
        if (typeof CanonicalHours !== 'undefined') {
            CanonicalHours.checkCurrentHour();
        }
        
        // ========== NEW: Hour chime check ==========
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        if (minutes === 0 && seconds === 0 && typeof CanonicalHours !== 'undefined') {
            CanonicalHours.playHourChime(TimeSys.gameHour());
        }
        
        if (typeof UI !== 'undefined' && typeof UI.renderActions === 'function') {
            UI.renderActions();
        }
    }
};