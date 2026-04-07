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
        
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours + (minutes / 60);  // e.g. 6:30 = 6.5
        
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
    }
};
