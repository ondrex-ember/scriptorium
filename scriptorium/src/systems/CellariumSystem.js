// ═══════════════════════════════════════════════════════════════════════════════
// CELLARIUM SYSTEM v8.0 — Treasury + Barter
// Monastic economy management (Arca Communis + Mercator Senex)
// ═══════════════════════════════════════════════════════════════════════════════

const CellariumSystem = {
  
  init: function() {
    if (!GameState.treasury) {
      GameState.treasury = {
        silver: 0,    // 🪙 Argentum
        wine: 0,      // 🍷 Vinum (bottles)
        grain: 0      // 🌾 Granum (sacks)
      };
    }
    
    if (!GameState.barter) {
      GameState.barter = {
        lastTradeDay: 0,
        tradesThisWeek: 0
      };
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TREASURY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  addResource: function(type, amount) {
    if (GameState.treasury[type] !== undefined) {
      GameState.treasury[type] += amount;
      Game.save();
      this.renderArcaDisplay();
    }
  },
  
  hasResource: function(type, amount) {
    return GameState.treasury[type] >= amount;
  },
  
  spendResource: function(type, amount) {
    if (!this.hasResource(type, amount)) return false;
    GameState.treasury[type] -= amount;
    Game.save();
    this.renderArcaDisplay();
    return true;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BARTER TRADES
  // ═══════════════════════════════════════════════════════════════════════════
  
  TRADES: [
    // Sell items for silver
    {
      id: 'sell_paper',
      offer: { item: 'paper', qty: 5 },
      receive: { resource: 'silver', qty: 1 },
      label: '📜 → 🪙',
      desc: '5× Paper → 1 Silver'
    },
    {
      id: 'sell_codex_common',
      offer: { item: 'codex_common', qty: 1 },
      receive: { resource: 'silver', qty: 3 },
      label: '📖 → 🪙',
      desc: 'Codex (common) → 3 Silver'
    },
    {
      id: 'sell_codex_luxury',
      offer: { item: 'codex_luxury', qty: 1 },
      receive: { resource: 'silver', qty: 10 },
      label: '📕 → 🪙',
      desc: 'Codex (luxury) → 10 Silver'
    },
    
    // Buy rare materials with silver
    {
      id: 'buy_rare_pigment',
      offer: { resource: 'silver', qty: 5 },
      receive: { item: 'rare_pigment', qty: 1 },
      label: '🪙 → 🎨',
      desc: '5 Silver → Rare Pigment',
      unlock: () => GameState.researchedTechs.includes('tech_illumination')
    },
    {
      id: 'buy_gold_leaf',
      offer: { resource: 'silver', qty: 8 },
      receive: { item: 'gold_leaf', qty: 1 },
      label: '🪙 → ✨',
      desc: '8 Silver → Gold Leaf',
      unlock: () => GameState.researchedTechs.includes('tech_illumination')
    },
    
    // Wine trades
    {
      id: 'buy_wine',
      offer: { resource: 'silver', qty: 2 },
      receive: { resource: 'wine', qty: 1 },
      label: '🪙 → 🍷',
      desc: '2 Silver → 1 Wine bottle'
    },
    
    // Early book unlock (existing)
    {
      id: 'unlock_book_early',
      offer: { item: 'paper', qty: 3 },
      receive: { type: 'book_unlock' },
      label: '📜 → 📚',
      desc: '3× Paper → Unlock next book early',
      condition: () => {
        const lib = GameState.library;
        const day = Math.floor((Date.now() - lib.startDate) / (24 * 60 * 60 * 1000)) + 1;
        return lib.unlockedBooks.length < LibraryDB.books.length && 
               lib.unlockedBooks.length < day;
      }
    }
  ],
  
  canTrade: function(trade) {
    // Check unlock condition
    if (trade.unlock && !trade.unlock()) return false;
    if (trade.condition && !trade.condition()) return false;
    
    // Check offer
    if (trade.offer.item) {
      if (!Game.hasItems(trade.offer.item, trade.offer.qty)) return false;
    }
    if (trade.offer.resource) {
      if (!this.hasResource(trade.offer.resource, trade.offer.qty)) return false;
    }
    
    return true;
  },
  
  executeTrade: function(trade) {
    if (!this.canTrade(trade)) {
      UI.notify('⚠️ Non habes sufficiens!', true);
      return;
    }
    
    // Deduct offer
    if (trade.offer.item) {
      Game.addItem(trade.offer.item, -trade.offer.qty);
    }
    if (trade.offer.resource) {
      this.spendResource(trade.offer.resource, trade.offer.qty);
    }
    
    // Add received
    if (trade.receive.item) {
      Game.addItem(trade.receive.item, trade.receive.qty);
      UI.notify(`✨ Accipis: ${trade.receive.qty}× ${ItemsDB[trade.receive.item].name}!`);
    }
    if (trade.receive.resource) {
      this.addResource(trade.receive.resource, trade.receive.qty);
      UI.notify(`✨ Accipis: ${trade.receive.qty}× ${trade.receive.resource}!`);
    }
    if (trade.receive.type === 'book_unlock') {
      // Unlock next book early (existing logic)
      const nextBook = LibraryDB.books.find(b => !GameState.library.unlockedBooks.includes(b.id));
      if (nextBook) {
        GameState.library.unlockedBooks.push(nextBook.id);
        UI.notify(`📚 Liber apertus: ${nextBook.title || nextBook.id}!`);
      }
    }
    
    GameState.barter.tradesThisWeek++;
    Game.save();
    UI.renderAll();
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UI RENDERING
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderArcaDisplay: function() {
    const el = document.getElementById('arca-display');
    if (!el) return;
    
    const t = GameState.treasury;
    
    el.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        <div style="text-align: center; padding: 15px; background: rgba(197,160,89,0.1); border-radius: 8px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">🪙</div>
          <div style="font-weight: bold; font-size: 1.2rem;">${t.silver}</div>
          <div style="font-size: 0.8rem; opacity: 0.7;">Argentum</div>
        </div>
        
        <div style="text-align: center; padding: 15px; background: rgba(138,51,36,0.1); border-radius: 8px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">🍷</div>
          <div style="font-weight: bold; font-size: 1.2rem;">${t.wine}</div>
          <div style="font-size: 0.8rem; opacity: 0.7;">Vinum</div>
        </div>
        
        <div style="text-align: center; padding: 15px; background: rgba(139,69,19,0.1); border-radius: 8px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">🌾</div>
          <div style="font-weight: bold; font-size: 1.2rem;">${t.grain}</div>
          <div style="font-size: 0.8rem; opacity: 0.7;">Granum</div>
        </div>
      </div>
    `;
  },
  
  renderBarterOptions: function() {
    let h = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">';
    
    this.TRADES.forEach(trade => {
      const canTrade = this.canTrade(trade);
      const opacity = canTrade ? 1 : 0.5;
      
      h += `<div style="padding: 15px; background: rgba(0,0,0,0.03); border-radius: 8px; opacity: ${opacity}; border-left: 3px solid ${canTrade ? 'var(--accent-gold)' : 'rgba(0,0,0,0.2)'};">`;
      h += `<div style="font-size: 1.5rem; margin-bottom: 10px; text-align: center;">${trade.label}</div>`;
      h += `<div style="font-size: 0.85rem; margin-bottom: 10px; text-align: center;">${trade.desc}</div>`;
      h += `<button onclick="CellariumSystem.executeTrade(CellariumSystem.TRADES.find(t => t.id === '${trade.id}'))" 
                    class="craft-btn" 
                    ${canTrade ? '' : 'disabled'}
                    style="width: 100%; margin-top: 5px;">
              ${canTrade ? '✅ Commercium' : '🔒 Clausum'}
            </button>`;
      h += `</div>`;
    });
    
    h += '</div>';
    return h;
  },
  
  renderCellariumTab: function() {
    let h = '<div id="cellarium-tab" style="padding: 20px;">';
    h += '<h2 style="margin-bottom: 20px;">🏛️ Cellarium</h2>';
    
    // Arca Communis
    h += '<div style="background: rgba(197,160,89,0.05); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid var(--accent-gold);">';
    h += '<h3 style="margin: 0 0 15px 0;">💰 Arca Communis</h3>';
    h += '<p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 15px; font-style: italic;">"Omnia communia" — All things are common property</p>';
    h += '<div id="arca-display"></div>';
    h += '</div>';
    
    // Starý Písař Barter
    h += '<div style="background: rgba(138,51,36,0.05); padding: 20px; border-radius: 10px; border-left: 4px solid var(--accent-wax);">';
    h += '<h3 style="margin: 0 0 10px 0;">📜 Mercator Senex (Starý Písař)</h3>';
    h += '<p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px; font-style: italic;">"Quid offers? Quid quaeris?" — What do you offer? What do you seek?</p>';
    h += this.renderBarterOptions();
    h += '</div>';
    
    h += '</div>';
    return h;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// UI INTEGRATION (in ui.js renderScriptorium())
// ═══════════════════════════════════════════════════════════════════════════

/*
// Add subtab button
<button onclick="UI.showScriptoriumSection('cellarium')" 
        class="${GameState.ui.scriptoriumSection === 'cellarium' ? 'active' : ''}">
  🏛️ Cellarium
</button>

// Add section div
<div id="scriptorium-cellarium" style="${GameState.ui.scriptoriumSection === 'cellarium' ? '' : 'display:none'}">
  ${CellariumSystem.renderCellariumTab()}
</div>

// After rendering, populate Arca
setTimeout(() => CellariumSystem.renderArcaDisplay(), 0);
*/
