// ═══════════════════════════════════════════════════════════════════════════════
// VIGOR SYSTEM v8.0 — FINAL ITERATION
// Minimalistic header + Full detail in Games & Records
// ═══════════════════════════════════════════════════════════════════════════════

const VigorSystem = {
  
  MAX_VIGOR: 100,
  DRAIN_RATE: 1,
  
  VIGOR_COSTS: {
    'paper': 2,          // Jen najedený, ale skoro nic
    'ink': 3,
    'tinderbox': 2,
    'candle': 5,
    'research': 8,
    'codex_common': 10,
    'gallic_ink': 15,
    'quill': 12,
    'vellum': 20,
    'codex_luxury': 25,
    'illuminated_page': 30,
    'vellum_codex': 35,
    'printing_type': 40
  },
  
  FOOD_RESTORE: {
    'cooked_meat': 25,
    'stew': 40,
    'bread': 30,
    'porridge': 20,
    'fish': 35
  },
  
  init: function() {
    if (!GameState.vigor) {
      GameState.vigor = {
        current: 100,
        max: 100,
        lastMeal: Date.now(),
        lastDrain: Date.now()
      };
    }
    this.startAutoDrain();
  },
  
  startAutoDrain: function() {
    setInterval(() => {
      const now = Date.now();
      const hoursPassed = (now - GameState.vigor.lastDrain) / (60 * 60 * 1000);
      
      if (hoursPassed >= 1) {
        this.drain(this.DRAIN_RATE * Math.floor(hoursPassed));
        GameState.vigor.lastDrain = now;
      }
    }, 60000);
  },
  
  canCraft: function(itemId) {
    const cost = this.VIGOR_COSTS[itemId] || 0;
    return GameState.vigor.current >= cost;
  },
  
  drain: function(amount) {
    GameState.vigor.current = Math.max(0, GameState.vigor.current - amount);
    this.checkThresholds();
    this.renderMiniDisplay();
    Game.save();
  },
  
  restore: function(foodId) {
    const amount = this.FOOD_RESTORE[foodId] || 20;
    GameState.vigor.current = Math.min(this.MAX_VIGOR, GameState.vigor.current + amount);
    GameState.vigor.lastMeal = Date.now();
    
    UI.notify(`✨ Vigor restauratus! +${amount}`);
    this.renderMiniDisplay();
    Game.save();
  },
  
  checkThresholds: function() {
    const pct = this.getPercentage();
    
    if (pct === 0) {
      UI.notify('⚠️ Vigor exhaustus! Cibus necesse est.', true);
    } else if (pct < 20 && !GameState.vigor.warnedLow) {
      UI.notify('⚠️ Vigor deficiens...', true);
      GameState.vigor.warnedLow = true;
    } else if (pct > 20) {
      GameState.vigor.warnedLow = false;
    }
  },
  
  getPercentage: function() {
    return Math.round((GameState.vigor.current / this.MAX_VIGOR) * 100);
  },
  
  getTimeSinceLastMeal: function() {
    const diff = Date.now() - GameState.vigor.lastMeal;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MINI DISPLAY (Header)
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderMiniDisplay: function() {
    const el = document.getElementById('vigor-mini');
    if (!el) return;
    
    const pct = this.getPercentage();
    
    let symbol, color;
    if (pct > 80)      { symbol = '◉'; color = 'var(--ink-primary)'; }
    else if (pct > 60) { symbol = '◎'; color = 'var(--ink-secondary)'; }
    else if (pct > 40) { symbol = '○'; color = 'var(--ink-secondary)'; }
    else if (pct > 20) { symbol = '◌'; color = 'var(--accent-wax)'; }
    else               { symbol = '·'; color = '#8a3324'; }
    
    el.innerHTML = `
      <span title="Vigor: ${pct}%" 
            style="font-size: 0.85rem; color: ${color}; cursor: help; line-height: 1;">
        🖋️${symbol}
      </span>
    `;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FULL DISPLAY (Games & Records tab)
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderFullDisplay: function() {
    const pct = this.getPercentage();
    const current = GameState.vigor.current;
    const max = this.MAX_VIGOR;
    const totalDrops = 10;
    const filledDrops = Math.ceil((pct / 100) * totalDrops);
    
    let drops = '';
    for (let i = 0; i < totalDrops; i++) {
      const color = (i < filledDrops) ? 'var(--ink-primary)' : 'rgba(0,0,0,0.15)';
      drops += `<span style="color: ${color}; font-size: 1.3rem;">●</span>`;
    }
    
    return `
      <div style="background: rgba(0,0,0,0.05); padding: 20px; border-radius: 10px; border-left: 3px solid var(--accent-gold);">
        <h4 style="margin: 0 0 15px 0; color: var(--ink-primary);">🖋️ Vigor</h4>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="flex: 1; display: flex; gap: 3px;">
            ${drops}
          </div>
          <strong style="font-size: 1.2rem; color: var(--accent-gold);">${current}/${max}</strong>
        </div>
        
        <div style="font-size: 0.85rem; opacity: 0.7; margin-top: 10px;">
          🍖 Ultimus cibus: ${this.getTimeSinceLastMeal()} ago
        </div>
        
        ${pct < 30 ? `
          <div style="margin-top: 10px; padding: 8px; background: rgba(138,51,36,0.1); border-radius: 5px; font-size: 0.85rem;">
            ⚠️ Vigor deficiens! Consume food to restore energy.
          </div>
        ` : ''}
      </div>
    `;
  },
  
  applyCraftCost: function(itemId) {
    const cost = this.VIGOR_COSTS[itemId] || 0;
    
    if (cost === 0) return true;
    
    if (!this.canCraft(itemId)) {
      UI.notify(t('vigor.insufficient'), true);
      return false;
    }
    
    this.drain(cost);
    return true;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HTML INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/*
// In header (after rank badge):
<div id="vigor-mini"></div>

// In Games & Records renderPersona():
<div id="persona-vigor">
  ${VigorSystem.renderFullDisplay()}
</div>
*/
