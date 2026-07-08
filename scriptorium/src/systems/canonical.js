// ═══════════════════════════════════════════════════════════════════
// CANONICAL HOURS — Benediktinské kanonické hodiny
// 7× denně triggered modlitby s gameplay buffy
// ═══════════════════════════════════════════════════════════════════

const CanonicalHours = {
    hours: [
        { 
            id: 'vigilie', 
            name: 'Vigilie', 
            nameEN: 'Vigils',
            time: 0.5,  // 00:30
            buff: 'alchemy',
            buffValue: 1.10,  // +10% alchemy success
            icon: '🌙',
            desc: 'Půlnoční vigilování',
            descEN: 'Midnight vigil'
        },
        { 
            id: 'laudes', 
            name: 'Laudes', 
            nameEN: 'Lauds',
            time: 6,    // 06:00
            buff: 'crafting',
            buffValue: 1.25,  // +25% crafting speed (BEST!)
            icon: '🌅',
            desc: 'Chvály úsvitu',
            descEN: 'Dawn praises'
        },
        { 
            id: 'prima', 
            name: 'Prima', 
            nameEN: 'Prime',
            time: 9,    // 09:00
            buff: 'dailyQuest',
            buffValue: 1.0,
            icon: '☀️',
            desc: 'První hodina dne',
            descEN: 'First hour of the day'
        },
        { 
            id: 'sexta', 
            name: 'Sexta', 
            nameEN: 'Sext',
            time: 12,   // 12:00
            buff: 'garden',
            buffValue: 1.0,
            icon: '🌞',
            desc: 'Poledne',
            descEN: 'Midday'
        },
        { 
            id: 'nona', 
            name: 'Nona', 
            nameEN: 'None',
            time: 15,   // 15:00
            buff: 'foraging',
            buffValue: 1.15,  // +15% foraging yield
            icon: '🌤️',
            desc: 'Devátá hodina',
            descEN: 'Ninth hour'
        },
        { 
            id: 'vesperae', 
            name: 'Vesperae', 
            nameEN: 'Vespers',
            time: 18,   // 18:00
            buff: 'darknessWarning',
            buffValue: 1.0,
            icon: '🌇',
            desc: 'Večerní modlitba',
            descEN: 'Evening prayer'
        },
        { 
            id: 'completorium', 
            name: 'Completorium', 
            nameEN: 'Compline',
            time: 21,   // 21:00
            buff: 'research',
            buffValue: 1.20,  // +20% research
            icon: '🕯️',
            desc: 'Nocleh',
            descEN: 'Night prayer'
        }
    ],
    
    enabled: false,           // Unlock via tech_canonical_hours
    currentHour: null,        // Currently active hour object
    lastTriggeredHour: null,  // Last triggered hour ID (prevent double trigger)
    activeBuff: null,         // Currently active buff type
    
    // ────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ────────────────────────────────────────────────────────────────
    init: function() {
        // Check if tech is unlocked
        if (GameState.researchedTechs && GameState.researchedTechs.includes('tech_canonical_hours')) {
            this.enabled = true;
        }
        
        // Check current hour immediately
        this.checkCurrentHour();
    },
    
    // ────────────────────────────────────────────────────────────────
    // CORE LOGIC — Called every 1s from TimeSys.update()
    // ────────────────────────────────────────────────────────────────
    checkCurrentHour: function() {
        if (!this.enabled) return;
        
        const currentTime = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour(true) : (new Date().getHours() + new Date().getMinutes() / 60);  // e.g. 6:30 = 6.5, Prague-anchored
        
        // Find which canonical hour we're in
        let activeHour = null;
        for (let i = 0; i < this.hours.length; i++) {
            const hour = this.hours[i];
            const nextHour = this.hours[(i + 1) % this.hours.length];
            
            // Calculate time window (handle midnight wraparound)
            let startTime = hour.time;
            let endTime = nextHour.time;
            
            if (endTime < startTime) {
                // Wraparound case (e.g. Completorium 21:00 → Vigilie 00:30)
                if (currentTime >= startTime || currentTime < endTime) {
                    activeHour = hour;
                    break;
                }
            } else {
                // Normal case
                if (currentTime >= startTime && currentTime < endTime) {
                    activeHour = hour;
                    break;
                }
            }
        }
        
        // Check if we just entered a new hour (trigger notification)
        if (activeHour && activeHour.id !== this.lastTriggeredHour) {
            // Check if we're within 5 minutes of the hour start
            const minutesSinceHourStart = (currentTime - activeHour.time) * 60;
            if (minutesSinceHourStart >= 0 && minutesSinceHourStart <= 5) {
                this.triggerHour(activeHour);
            }
        }
        
        // Update current state
        this.currentHour = activeHour;
        this.activeBuff = activeHour ? activeHour.buff : null;
        
        // Update UI
        this.renderUI();
    },
    
    // ────────────────────────────────────────────────────────────────
    // TRIGGER — When entering a new canonical hour
    // ────────────────────────────────────────────────────────────────
    triggerHour: function(hour) {
        this.lastTriggeredHour = hour.id;
        
        // Bell notification 🔔
        const hourName = GameState.settings.language === 'en' ? hour.nameEN : hour.name;
        const desc = GameState.settings.language === 'en' ? hour.descEN : hour.desc;
        
        UI.notify(`🔔 ${hourName} — ${desc}`, false);
        if (typeof NotificationSystem !== 'undefined') NotificationSystem.panel(`🔔 ${hourName} — ${desc}`, 'system');
        
        // Special actions per hour
        switch(hour.buff) {
            case 'dailyQuest':
                // Prima: Check daily quest
                // (Placeholder - implement when daily quests exist)
                break;
                
            case 'garden':
                // Sexta: Auto-check garden
                if (typeof UI !== 'undefined' && typeof UI.renderGarden === 'function') {
                    UI.renderGarden();
                }
                break;
                
            case 'darknessWarning':
                // Vesperae: Darkness warning
                if (!TimeSys.isDaytime()) {
                    UI.notify('⚠️ ' + t('canonical.vesperae_warning'), true);
                }
                break;
        }
        
        // Play bell sound (optional - if AudioSystem exists)
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playBell) {
            AudioSystem.playBell();
        }
        
        // Analytics
        if (typeof Analytics !== 'undefined') {
            Analytics.event('canonical_hour_triggered', {
                hour_id: hour.id,
                hour_name: hourName,
                buff_type: hour.buff
            });
        }
    },
    
    // ────────────────────────────────────────────────────────────────
    // BUFF MULTIPLIERS — Used by crafting/research/foraging systems
    // ────────────────────────────────────────────────────────────────
    getCraftingSpeedMultiplier: function() {
        if (!this.enabled || !this.currentHour) return 1.0;
        if (this.currentHour.buff === 'crafting') {
            return this.currentHour.buffValue;  // 1.25 during Laudes
        }
        return 1.0;
    },
    
    getResearchMultiplier: function() {
        if (!this.enabled || !this.currentHour) return 1.0;
        if (this.currentHour.buff === 'research') {
            return this.currentHour.buffValue;  // 1.20 during Completorium
        }
        return 1.0;
    },
    
    getForagingMultiplier: function() {
        if (!this.enabled || !this.currentHour) return 1.0;
        if (this.currentHour.buff === 'foraging') {
            return this.currentHour.buffValue;  // 1.15 during Nona
        }
        return 1.0;
    },
    
    getAlchemySuccessBonus: function() {
        if (!this.enabled || !this.currentHour) return 0;
        if (this.currentHour.buff === 'alchemy') {
            return 0.10;  // +10% success during Vigilie
        }
        return 0;
    },
    
    // ────────────────────────────────────────────────────────────────
    // UI RENDERING
    // ────────────────────────────────────────────────────────────────
    renderUI: function() {
        const container = document.getElementById('canonical-badge');
        if (!container) return;  // Element doesn't exist yet
        
        if (!this.enabled) {
            container.style.display = 'none';
            return;
        }
        
        if (!this.currentHour) {
            container.style.display = 'none';
            return;
        }
        
        // Show container
        container.style.display = 'flex';
        
        const hour = this.currentHour;
        const hourName = GameState.settings.language === 'en' ? hour.nameEN : hour.name;
        
        // Build buff description
        let buffText = '';
        switch(hour.buff) {
            case 'crafting':
                buffText = t('canonical.buff_crafting').replace('{percent}', '25');
                break;
            case 'research':
                buffText = t('canonical.buff_research').replace('{percent}', '20');
                break;
            case 'foraging':
                buffText = t('canonical.buff_foraging').replace('{percent}', '15');
                break;
            case 'alchemy':
                buffText = t('canonical.buff_alchemy').replace('{percent}', '10');
                break;
            case 'garden':
                buffText = t('canonical.buff_garden');
                break;
            case 'dailyQuest':
                buffText = t('canonical.buff_quest');
                break;
            case 'darknessWarning':
                buffText = t('canonical.buff_darkness');
                break;
        }
        
        // Update existing child elements
        const iconEl = container.querySelector('.canonical-icon');
        const nameEl = container.querySelector('.canonical-name');
        const buffEl = container.querySelector('.canonical-buff');
        
        if (iconEl) iconEl.textContent = hour.icon;
        if (nameEl) nameEl.textContent = hourName;
        if (buffEl) buffEl.textContent = buffText;
        
        // Tooltip
        const desc = GameState.settings.language === 'en' ? hour.descEN : hour.desc;
        container.title = `${hourName} — ${desc}`;
    },
    
    // ────────────────────────────────────────────────────────────────
    // HOUR CHIME SYSTEM
    // ────────────────────────────────────────────────────────────────
    
    /**
     * Check if current time is within quiet hours
     * @returns {boolean}
     */
    isQuietHours: function() {
        if (!GameState.settings.quietHoursEnabled) return false;
        
        const currentHour = new Date().getHours();
        const start = GameState.settings.quietHoursStart || 22;
        const end = GameState.settings.quietHoursEnd || 6;
        
        // Handle overnight range (e.g., 22:00-06:00)
        if (start > end) {
            return currentHour >= start || currentHour < end;
        } else {
            return currentHour >= start && currentHour < end;
        }
    },
    
    /**
     * Get bell type for a specific hour (auto mode)
     * @param {number} hour - Hour of day (0-23)
     * @returns {string} Bell type ID
     */
    getBellForHour: function(hour) {
        const mapping = {
            0: 'sanctus',       // Vigilie (midnight) - high bell
            6: 'avemaria',      // Laudes (dawn) - triple bell
            9: 'sanctus',       // Prima (morning) - high bell
            12: 'avemaria',     // Sexta (midday) - triple bell
            15: 'deathknell',   // Nona (3pm) - memento mori
            18: 'avemaria',     // Vesperae (evening) - triple bell
            21: 'compline'      // Completorium (night) - deep double bell
        };
        
        return mapping[hour] || 'cink';  // Other hours default to basic cink
    },
    
    /**
     * Play hour chime sound (called from TimeSys.update() at XX:00:00)
     * @param {number} hour - Current hour (0-23)
     */
    playHourChime: function(hour) {
        // Check if audio system exists
        if (typeof audioSys === 'undefined' || !audioSys) {
            console.log('🔕 Audio system not initialized');
            return;
        }
        
        // Check quiet hours
        if (this.isQuietHours()) {
            console.log('🌙 Quiet hours active - chime suppressed');
            return;
        }
        
        // PRE-TECH: Basic cink only
        if (!this.enabled) {
            if (GameState.settings.hourChimeBasic !== false) {
                audioSys.playCink();
                console.log(`🔔 ${hour}:00 - Basic chime (cink)`);
            }
            return;
        }
        
        // POST-TECH: Canonical bells
        const mode = GameState.settings.hourChimeMode || 'auto';
        const customSound = GameState.settings.hourChimeSound || 'avemaria';
        
        // Check if chimes are disabled
        if (customSound === 'off') {
            console.log('🔕 Hour chimes disabled');
            return;
        }
        
        // Determine which bell to play
        let bellType;
        if (mode === 'auto') {
            bellType = this.getBellForHour(hour);
        } else {
            bellType = customSound;
        }
        
        // Play the bell
        if (bellType === 'cink') {
            audioSys.playCink();
        } else {
            audioSys.playChurchBell(bellType);
        }
        
        console.log(`🔔 ${hour}:00 - ${mode} mode: ${bellType}`);
    }
};