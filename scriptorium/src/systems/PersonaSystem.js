// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA SYSTEM v8.0 — Character Name + Portrait
// ═══════════════════════════════════════════════════════════════════════════════

const PersonaSystem = {
  
  init: function() {
    if (!GameState.character) {
      GameState.character = {
        nameGiven: '',
        nameReligious: '',
        nameReligiousUnlocked: false, // Unlock in Phase 2 when choose Mnich
        portrait: null,              // Base64 image or null
        portraitStyle: 'ascii'       // 'ascii' or 'image'
      };
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NAME MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  setName: function(name) {
    GameState.character.nameGiven = name.trim();
    Game.save();
    UI.notify('✍️ Nomen conservatum!');
  },
  
  setReligiousName: function(name) {
    if (!GameState.character.nameReligiousUnlocked) {
      UI.notify('⚠️ Nomen religiosum nondum disponibile!', true);
      return;
    }
    GameState.character.nameReligious = name.trim();
    Game.save();
    UI.notify('✝️ Nomen religiosum conservatum!');
  },
  
  unlockReligiousName: function() {
    // Called when player chooses Mnich in Phase 2
    GameState.character.nameReligiousUnlocked = true;
    Game.save();
    UI.notify('✝️ Nomen religiosum nunc disponibile!');
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PORTRAIT — ASCII GENERATOR
  // ═══════════════════════════════════════════════════════════════════════════
  
  generateASCIIPortrait: function(rankId) {
    const portraits = {
      laicus: `  ___
 /   \\
| o o |
|  >  |
 \\___/`,
      
      librarius: `  ___
 / @ \\
| o o |
|  ^  |
 \\___/
  |||`,
  
      antiquarius: `  ___
 /===\\
| O O |
|  -  |
 \\___/
 /||\\`,
  
      rubricator: `  ___
 /🔴\\
| o o |
|  ~  |
 \\___/
  |||
 /|🖌|\\`,
  
      illuminator: `  ___
 /🎨\\
| ◉ ◉ |
|  ^  |
 \\___/
 /|||\\
/|||||\\`,
  
      stationarius: `  ___
 /📦\\
| $ $ |
|  ≡  |
 \\___/
 /|||\\
══════`
    };
    
    return portraits[rankId] || portraits.laicus;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PORTRAIT — IMAGE UPLOAD + STYLIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  uploadPortrait: function(file) {
    if (!file || !file.type.startsWith('image/')) {
      UI.notify('⚠️ Imago invalida!', true);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.stylizeImage(e.target.result);
    };
    reader.readAsDataURL(file);
  },
  
  stylizeImage: function(dataURL) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    const img = new Image();
    img.onload = () => {
      // 1. Draw centered and cropped
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      ctx.drawImage(img, x, y, size, size, 0, 0, 128, 128);
      
      // 2. Get pixel data
      const imageData = ctx.getImageData(0, 0, 128, 128);
      const data = imageData.data;
      
      // Woodcut palette: parchment bg + dark ink
      const PARCHMENT_R = 235, PARCHMENT_G = 215, PARCHMENT_B = 175;
      const INK_R = 28, INK_G = 18, INK_B = 10;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale (luminance)
        const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        
        // Add grain noise
        const noise = (Math.random() - 0.5) * 40;
        const val = lum + noise;
        
        // Threshold — high contrast woodcut
        const threshold = 128;
        if (val > threshold) {
          // Light area → parchment
          data[i]   = PARCHMENT_R;
          data[i+1] = PARCHMENT_G;
          data[i+2] = PARCHMENT_B;
        } else {
          // Dark area → ink (with slight variation for wood texture)
          const grain = Math.floor(Math.random() * 15);
          data[i]   = INK_R + grain;
          data[i+1] = INK_G + grain;
          data[i+2] = INK_B + grain;
        }
        data[i+3] = 255; // full opacity
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // 3. Aged parchment overlay
      ctx.fillStyle = 'rgba(139, 90, 30, 0.08)';
      ctx.fillRect(0, 0, 128, 128);
      
      // 4. Heavy border — dřevěný rám
      ctx.strokeStyle = 'rgba(60, 30, 10, 0.95)';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, 128, 128);
      
      // 5. Inner decorative line
      ctx.strokeStyle = 'rgba(139, 90, 30, 0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 108, 108);
      
      // 6. Corner marks (charakteristické pro středověké dřevoryty)
      ctx.fillStyle = 'rgba(60, 30, 10, 0.9)';
      [[0,0],[118,0],[0,118],[118,118]].forEach(([cx, cy]) => {
        ctx.fillRect(cx, cy, 10, 10);
      });
      
      // Save
      GameState.character.portrait = canvas.toDataURL('image/png');
      GameState.character.portraitStyle = 'image';
      Game.save();
      UI.notify('🎨 Imago conservata!');
      UI.renderAll();
    };
    img.src = dataURL;
  },
  
  removePortrait: function() {
    GameState.character.portrait = null;
    GameState.character.portraitStyle = 'ascii';
    Game.save();
    UI.notify('🗑️ Imago deleta!');
    UI.renderAll();
  },
  
  togglePortraitStyle: function() {
    if (!GameState.character.portrait) {
      UI.notify('⚠️ Nulla imago!', true);
      return;
    }
    
    GameState.character.portraitStyle = 
      (GameState.character.portraitStyle === 'ascii') ? 'image' : 'ascii';
    Game.save();
    UI.renderAll();
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UI RENDERING
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderPersonaSection: function() {
    const char = GameState.character;
    const currentRank = RankSystem.getCurrentSecularRank();
    
    let h = `<div style="background: rgba(0,0,0,0.05); padding: 20px; border-radius: 10px; margin-bottom: 20px;">`;
    h += `<h3 style="margin: 0 0 20px 0;">✍️ Persona</h3>`;
    
    // Portrait + Name side by side
    h += `<div style="display: grid; grid-template-columns: 140px 1fr; gap: 20px;">`;
    
    // LEFT: Portrait
    h += `<div>`;
    if (char.portrait && char.portraitStyle === 'image') {
      h += `<img src="${char.portrait}" style="width: 128px; height: 128px; border: 3px solid var(--accent-gold); border-radius: 5px;">`;
    } else {
      h += `<div style="width: 128px; height: 128px; border: 2px dashed rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 0.65rem; line-height: 1.1; white-space: pre;">`;
      h += this.generateASCIIPortrait(currentRank.id);
      h += `</div>`;
    }
    
    // Portrait controls
    h += `<div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">`;
    h += `<label class="craft-btn" style="cursor: pointer; font-size: 0.8rem; padding: 4px 8px;">
            📤 Upload
            <input type="file" accept="image/*" onchange="PersonaSystem.uploadPortrait(this.files[0])" style="display: none;">
          </label>`;
    if (char.portrait) {
      h += `<button onclick="PersonaSystem.removePortrait()" class="craft-btn" style="font-size: 0.8rem; padding: 4px 8px;">🗑️</button>`;
      h += `<button onclick="PersonaSystem.togglePortraitStyle()" class="craft-btn" style="font-size: 0.8rem; padding: 4px 8px;">🔄</button>`;
    }
    h += `</div>`;
    h += `</div>`;
    
    // RIGHT: Name inputs
    h += `<div>`;
    
    // Given name
    h += `<div style="margin-bottom: 15px;">`;
    h += `<label style="display: block; margin-bottom: 5px; font-weight: bold;">Nomen:</label>`;
    h += `<div style="display: flex; gap: 5px;">`;
    h += `<input type="text" id="char-name-input" value="${char.nameGiven || ''}" 
                 placeholder="Johannes de Praga" 
                 style="flex: 1; padding: 8px; border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; font-family: 'Cinzel', serif;">`;
    h += `<button onclick="PersonaSystem.setName(document.getElementById('char-name-input').value)" class="craft-btn" style="padding: 8px 15px;">💾</button>`;
    h += `</div>`;
    h += `</div>`;
    
    // Religious name (only if unlocked)
    if (char.nameReligiousUnlocked) {
      h += `<div style="margin-bottom: 15px;">`;
      h += `<label style="display: block; margin-bottom: 5px; font-weight: bold;">✝️ Nomen religiosum:</label>`;
      h += `<div style="display: flex; gap: 5px;">`;
      h += `<input type="text" id="char-name-religious-input" value="${char.nameReligious || ''}" 
                   placeholder="Frater Benedictus" 
                   style="flex: 1; padding: 8px; border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; font-family: 'Cinzel', serif;">`;
      h += `<button onclick="PersonaSystem.setReligiousName(document.getElementById('char-name-religious-input').value)" class="craft-btn" style="padding: 8px 15px;">💾</button>`;
      h += `</div>`;
      h += `</div>`;
    }
    
    // Display name (read-only)
    const displayName = char.nameReligious || char.nameGiven || 'Anonymus';
    h += `<div style="margin-top: 20px; padding: 10px; background: rgba(197,160,89,0.1); border-left: 3px solid var(--accent-gold); border-radius: 3px;">`;
    h += `<strong>Nomen completum:</strong><br>`;
    h += `<span style="font-size: 1.1rem; font-family: 'Cinzel', serif;">${displayName}</span>`;
    h += `</div>`;
    
    h += `</div>`; // Close RIGHT
    h += `</div>`; // Close grid
    h += `</div>`; // Close container
    
    return h;
  }
};