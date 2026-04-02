const CanonicalHours = {
    hours: [
        { name: "Vigilie", time: 0.5, icon: "🌑", buff: "alchemy", value: 1.10, desc: "+10% alchemy (noční koncentrace)" },
        { name: "Laudes", time: 6, icon: "🌅", buff: "crafting", value: 1.25, desc: "+25% crafting speed (ranní světlo!)" },
        { name: "Prima", time: 9, icon: "☀️", buff: "dailyQuest", value: true, desc: "Daily quests dostupné" },
        { name: "Sexta", time: 12, icon: "🌞", buff: "garden", value: true, desc: "Garden growth check" },
        { name: "Nona", time: 15, icon: "🌥️", buff: "foraging", value: 1.15, desc: "+15% foraging yield" },
        { name: "Vesperae", time: 18, icon: "🌇", buff: "darkness", value: true, desc: "Darkness start warning" },
        { name: "Completorium", time: 21, icon: "🕯️", buff: "research", value: 1.20, desc: "+20% research (svíčka)" }
    ],
    
    enabled: false, // Odemkne se přes tech_canonical_hours
    lastHourTriggered: -1,
    activeBuffs: {},
    
    init: function() {
        this.enabled = GameState.researchedTechs.includes('tech_canonical_hours');
        if(!this.enabled) return;
        
        // Check which hour is active now
        this.checkCurrentHour();
    },
    
    checkCurrentHour: function() {
        if(!this.enabled) return;
        
        const now = new Date();
        const currentHour = now.getHours() + (now.getMinutes() / 60);
        
        // Find matching hour
        for(let i = 0; i < this.hours.length; i++) {
            const hour = this.hours[i];
            const hourTime = hour.time;
            const nextHourTime = (i < this.hours.length - 1) ? this.hours[i + 1].time : 24;
            
            // Check if we're in this hour's window (±30 min)
            if(currentHour >= hourTime && currentHour < (hourTime + 1)) {
                if(this.lastHourTriggered !== i) {
                    this.triggerHour(hour, i);
                }
                return;
            }
        }
    },
    
    triggerHour: function(hour, index) {
        this.lastHourTriggered = index;
        
        // Play bell sound (🔔)
        UI.notify(`🔔 ${hour.name} - ${hour.desc}`);
        
        // Apply buff
        if(hour.buff === 'crafting') {
            this.activeBuffs.craftingSpeed = hour.value;
        } else if(hour.buff === 'alchemy') {
            this.activeBuffs.alchemyBonus = hour.value;
        } else if(hour.buff === 'foraging') {
            this.activeBuffs.foragingYield = hour.value;
        } else if(hour.buff === 'research') {
            this.activeBuffs.researchBonus = hour.value;
        }
        
        // Clear buff after 1 hour
        setTimeout(() => {
            delete this.activeBuffs[hour.buff + 'Bonus'];
            delete this.activeBuffs[hour.buff + 'Speed'];
            delete this.activeBuffs[hour.buff + 'Yield'];
        }, 60 * 60 * 1000);
        
        Game.save();
    },
    
    getCraftingSpeedMultiplier: function() {
        return this.activeBuffs.craftingSpeed || 1.0;
    },
    
    getAlchemyBonus: function() {
        return this.activeBuffs.alchemyBonus || 1.0;
    },
    
    getForagingYield: function() {
        return this.activeBuffs.foragingYield || 1.0;
    },
    
    getResearchBonus: function() {
        return this.activeBuffs.researchBonus || 1.0;
    },
    
    renderUI: function() {
        if(!this.enabled) return "";
        
        const now = new Date();
        const currentHour = now.getHours() + (now.getMinutes() / 60);
        
        let html = `<div style="margin-top:15px; padding:10px; background:#f5f5dc; border-radius:8px; border:2px solid #8b4513;">`;
        html += `<h4 style="margin:0 0 10px 0;">🔔 Kanonické Hodiny</h4>`;
        
        for(let hour of this.hours) {
            const isActive = (currentHour >= hour.time && currentHour < (hour.time + 1));
            const style = isActive ? 'font-weight:bold; color:#d32f2f;' : '';
            html += `<div style="${style}">${hour.icon} ${hour.name} (${hour.time}:00) - ${hour.desc}</div>`;
        }
        
        html += `</div>`;
        return html;
    }
};

// ========== v7.5 EVENTS SYSTEM ==========
// Historical events based on real stories (Swedish siege, hidden incunabula, etc.)
