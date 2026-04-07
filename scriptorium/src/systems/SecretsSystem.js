// ═══════════════════════════════════════════════════════════════════════════════
// EASTER EGG SYSTEM v8.0 — Locked Secret Tabs
// Scrinium Abbatis (Forbidden Library) + Athanor Secretus (Secret Laboratory)
// ═══════════════════════════════════════════════════════════════════════════════

const SecretsSystem = {
  
  init: function() {
    if (!GameState.secrets) {
      GameState.secrets = {
        // Current unlock state
        forbiddenUnlocked: false,     // Scrinium Abbatis
        laboratoryUnlocked: false,    // Athanor Secretus
        
        // Dev access
        devPassword: 'exordium',
        
        // Future unlock conditions (prepared but not active)
        forbiddenBooksRead: 0,        // Read all 17 library books
        laboratoryClues: 0,           // Find 3 alchemical symbols
        inquisitionHeat: 0            // 0-100, raids at 80+
      };
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UNLOCK CHECKS (Future implementation)
  // ═══════════════════════════════════════════════════════════════════════════
  
  checkForbiddenUnlock: function() {
    // Future: Auto-unlock when read all books
    const totalBooks = LibraryDB.books.length;
    const readBooks = GameState.library.readBooks.length;
    
    if (readBooks >= totalBooks && !GameState.secrets.forbiddenUnlocked) {
      GameState.secrets.forbiddenUnlocked = true;
      Game.save();
      UI.notify('📕 Scrinium Abbatis apertum est!');
      return true;
    }
    return false;
  },
  
  checkLaboratoryUnlock: function() {
    // Future: Auto-unlock when find 3 alchemical clues
    if (GameState.secrets.laboratoryClues >= 3 && !GameState.secrets.laboratoryUnlocked) {
      GameState.secrets.laboratoryUnlocked = true;
      Game.save();
      UI.notify('🔬 Athanor Secretus apertum est!');
      return true;
    }
    return false;
  },
  
  addLaboratoryClue: function() {
    // Called when player discovers alchemical symbol in lore
    GameState.secrets.laboratoryClues++;
    Game.save();
    UI.notify(`🔍 Symbolum alchemicum inventum! (${GameState.secrets.laboratoryClues}/3)`);
    this.checkLaboratoryUnlock();
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DEV TOOLS (Password gate for testing)
  // ═══════════════════════════════════════════════════════════════════════════
  
  promptDevPassword: function() {
    const pw = prompt('🔓 Password (dev only):');
    
    if (!pw) return;
    
    if (pw === GameState.secrets.devPassword) {
      GameState.secrets.forbiddenUnlocked = true;
      GameState.secrets.laboratoryUnlocked = true;
      Game.save();
      UI.notify('🔓 Omnes ianuae apertae sunt! (All doors opened)');
      setTimeout(() => location.reload(), 1000);
    } else {
      UI.notify('❌ Password incorrectum!', true);
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TAB RENDERING
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderScriniumTab: function() {
    let h = '<div id="scrinium-tab" style="padding: 40px; text-align: center;">';
    h += '<h2 style="margin-bottom: 20px;">📕 Scrinium Abbatis</h2>';
    h += '<p style="font-style: italic; opacity: 0.8; margin-bottom: 30px;">(Abbot\'s Private Library)</p>';
    
    h += '<div style="max-width: 500px; margin: 0 auto; padding: 50px; background: rgba(0,0,0,0.03); border-radius: 10px; border: 2px dashed rgba(0,0,0,0.2);">';
    h += '<div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🔒</div>';
    h += '<p style="font-style: italic; line-height: 1.6; margin-bottom: 20px;">';
    h += '"Hic iacent libri vetiti, quos Inquisitio prohibet..."<br>';
    h += '<span style="font-size: 0.85rem; opacity: 0.7;">(Here lie the forbidden books, which the Inquisition prohibits...)</span>';
    h += '</p>';
    h += '<div style="margin-top: 30px; padding: 15px; background: rgba(138,51,36,0.1); border-radius: 5px;">';
    h += '<p style="font-size: 0.85rem; margin: 0;">🚧 <strong>In constructione</strong></p>';
    h += '<p style="font-size: 0.75rem; opacity: 0.7; margin-top: 5px;">Under construction</p>';
    h += '</div>';
    h += '</div>';
    
    h += '</div>';
    return h;
  },
  
  renderAthanorTab: function() {
    let h = '<div id="athanor-tab" style="padding: 40px; text-align: center;">';
    h += '<h2 style="margin-bottom: 20px;">🔬 Athanor Secretus</h2>';
    h += '<p style="font-style: italic; opacity: 0.8; margin-bottom: 30px;">(Secret Furnace / Laboratory)</p>';
    
    h += '<div style="max-width: 500px; margin: 0 auto; padding: 50px; background: rgba(0,0,0,0.03); border-radius: 10px; border: 2px dashed rgba(0,0,0,0.2);">';
    h += '<div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🧪</div>';
    h += '<p style="font-style: italic; line-height: 1.6; margin-bottom: 20px;">';
    h += '"Ignis perpetuus ardet, transmutatio incipit..."<br>';
    h += '<span style="font-size: 0.85rem; opacity: 0.7;">(The eternal fire burns, transmutation begins...)</span>';
    h += '</p>';
    h += '<div style="margin-top: 30px; padding: 15px; background: rgba(138,51,36,0.1); border-radius: 5px;">';
    h += '<p style="font-size: 0.85rem; margin: 0;">🚧 <strong>In constructione</strong></p>';
    h += '<p style="font-size: 0.75rem; opacity: 0.7; margin-top: 5px;">Under construction</p>';
    h += '</div>';
    h += '</div>';
    
    h += '</div>';
    return h;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DEV BUTTON (Hidden in Settings)
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderDevButton: function() {
    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.1);">
        <button onclick="SecretsSystem.promptDevPassword()" 
                style="opacity: 0.3; font-size: 0.7rem; padding: 5px 10px; background: none; border: 1px solid rgba(0,0,0,0.2); cursor: pointer;">
          🔓 Secretum
        </button>
      </div>
    `;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// UI INTEGRATION (Main Tab System)
// ═══════════════════════════════════════════════════════════════════════════

/*
// In UI.renderTabs() — add conditional tabs:

const tabs = [
  { id: 'fireplace', icon: '🔥', label: 'Krb' },
  { id: 'scriptorium', icon: '✍️', label: 'Scriptorium' },
  { id: 'garden', icon: '🌿', label: 'Zahrada' },
  { id: 'library', icon: '📚', label: 'Knihovna' }
];

// Conditional easter egg tabs
if (GameState.secrets.forbiddenUnlocked) {
  tabs.push({
    id: 'scrinium',
    icon: '📕',
    label: 'Scrinium',
    tooltip: 'Scrinium Abbatis (Forbidden Library)'
  });
}

if (GameState.secrets.laboratoryUnlocked) {
  tabs.push({
    id: 'athanor',
    icon: '🔬',
    label: 'Athanor',
    tooltip: 'Athanor Secretus (Secret Laboratory)'
  });
}

tabs.push({ id: 'settings', icon: '⚙️', label: 'Nastavení' });

// In switch(currentTab):
case 'scrinium':
  return SecretsSystem.renderScriniumTab();
case 'athanor':
  return SecretsSystem.renderAthanorTab();

// In Settings tab, at bottom:
${SecretsSystem.renderDevButton()}
*/

// ═══════════════════════════════════════════════════════════════════════════
// FUTURE UNLOCK CONDITIONS (Prepared, not active)
// ═══════════════════════════════════════════════════════════════════════════

/*
// In LibrarySystem, when book read:
if (GameState.library.readBooks.length === LibraryDB.books.length) {
  SecretsSystem.checkForbiddenUnlock();
}

// In LoreDB, add hidden alchemical symbols in 3 entries:
// When viewing lore entry, check for:
if (loreEntry.id === 'hidden_symbol_1' && !GameState.secrets.symbol1Found) {
  GameState.secrets.symbol1Found = true;
  SecretsSystem.addLaboratoryClue();
}
*/
