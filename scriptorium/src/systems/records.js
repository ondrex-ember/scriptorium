const PersonalRecords = {
    render: function() {
        const el = document.getElementById('records-content');
        if(!el) return;
        
        const stats = GameState.achievements.stats;
        const totalItems = Object.keys(GameState.inventory).length;
        const totalTech = GameState.researchedTechs.length;
        
        let h = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.9rem;">`;
        
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">`;
        h += `<strong>📦 Items vlastněno</strong><div style="font-size:1.2rem; margin-top:4px;">${totalItems}</div>`;
        h += `</div>`;
        
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">`;
        h += `<strong>📖 Discovered</strong><div style="font-size:1.2rem; margin-top:4px;">${GameState.discoveredLore.length}/64</div>`;
        h += `</div>`;
        
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-wax);">`;
        h += `<strong>⚒️ Total Crafts</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.itemsCrafted}</div>`;
        h += `</div>`;
        
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-wax);">`;
        h += `<strong>🌿 Sklizně</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.harvests}</div>`;
        h += `</div>`;
        
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">`;
        h += `<strong>📜 Research získáno</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.researchCount}</div>`;
        h += `</div>`;
        
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">`;
        h += `<strong>👑 Technologie</strong><div style="font-size:1.2rem; margin-top:4px;">${totalTech}/22</div>`;
        h += `</div>`;
        
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #8a3324;">`;
        h += `<strong>🔥 Dny s krbem</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.daysWithFire}</div>`;
        h += `</div>`;
        
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #4caf50;">`;
        h += `<strong>🍖 Dny bez hladu</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.daysWithoutHunger}</div>`;
        h += `</div>`;
        
        h += `<div style="grid-column:1/-1; padding:8px; background:rgba(197,160,89,0.1); border-left:3px solid var(--accent-gold);">`;
        h += `<strong>🔥 Longest Streak</strong><div style="font-size:1.2rem; margin-top:4px;">${GameState.dailyRewards.streak} dní</div>`;
        h += `</div>`;
        
        h += `<div style="grid-column:1/-1; padding:8px; background:rgba(197,160,89,0.1); border-left:3px solid var(--accent-gold);">`;
        h += `<strong>📅 Total Logins</strong><div style="font-size:1.2rem; margin-top:4px;">${GameState.dailyRewards.totalLogins}</div>`;
        h += `</div>`;
        
        h += `</div>`;
        
        el.innerHTML = h;
    }
};

