const MemoryGame = {
    gameActive: false,
    cards: [],
    flipped: [],
    matched: [],
    moves: 0,
    
    start: function() {
        if(this.gameActive) return;
        
        // Get discovered items (min 4, max 12 pairs)
        const discovered = GameState.discoveredLore.slice();
        if(discovered.length < 4) {
            UI.notify(t('minigames.memory.need_items'), true);
            return;
        }
        
        // Select random items for pairs
        const pairCount = Math.min(Math.floor(discovered.length / 2), 12);
        const selected = [];
        for(let i = 0; i < pairCount; i++) {
            const randomIndex = Math.floor(Math.random() * discovered.length);
            selected.push(discovered.splice(randomIndex, 1)[0]);
        }
        
        // Create pairs and shuffle
        this.cards = [];
        selected.forEach(itemId => {
            this.cards.push({ id: itemId, matched: false });
            this.cards.push({ id: itemId, matched: false });
        });
        this.shuffle(this.cards);
        
        this.flipped = [];
        this.matched = [];
        this.moves = 0;
        this.gameActive = true;
        
        this.render();
    },
    
    shuffle: function(array) {
        for(let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },
    
    flip: function(index) {
        if(!this.gameActive) return;
        if(this.flipped.length >= 2) return;
        if(this.flipped.includes(index)) return;
        if(this.cards[index].matched) return;
        
        this.flipped.push(index);
        this.render();
        
        if(this.flipped.length === 2) {
            this.moves++;
            setTimeout(() => this.checkMatch(), 600);
        }
    },
    
    checkMatch: function() {
        const [idx1, idx2] = this.flipped;
        const card1 = this.cards[idx1];
        const card2 = this.cards[idx2];
        
        if(card1.id === card2.id) {
            // Match!
            card1.matched = true;
            card2.matched = true;
            this.matched.push(card1.id);
            
            // Check if game complete
            if(this.matched.length === this.cards.length / 2) {
                setTimeout(() => this.complete(), 300);
            }
        }
        
        this.flipped = [];
        this.render();
    },
    
    complete: function() {
        this.gameActive = false;
        
        // Calculate reward based on moves
        const perfectMoves = this.cards.length / 2;
        let reward = 1;
        if(this.moves <= perfectMoves) reward = 3;
        else if(this.moves <= perfectMoves * 1.5) reward = 2;
        
        Game.addItem('research', reward);
        
        // Track stats
        if(GameState.achievements) {
            GameState.achievements.stats.memoryGamesWon++;
            GameState.achievements.stats.totalGamesPlayed++;
            GameState.achievements.stats.totalResearchGained += reward;
        }
        
        let winMsg = t('minigames.memory.win')
            .replace('{reward}', reward)
            .replace('{moves}', this.moves);
        UI.notify(winMsg);
        
        // Počkáme 1.5 vteřiny, než se ukáže vítězná obrazovka uvnitř modalu
        setTimeout(() => {
            this.render(); // Překreslí modal na vítěznou obrazovku
            if (typeof UI.renderAll === 'function') {
                UI.renderAll(); // Aktualizuje resource bary v pozadí
            }
        }, 1500);
    },
    
    render: function() {
        let modal = document.getElementById('memory-game-modal');
        
        // Vytvoření okna, pokud neexistuje
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'memory-game-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content">
                    <button class="game-modal-close" onclick="MemoryGame.close()">×</button>
                    <div id="memory-game-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) MemoryGame.close();
            });
        }
        
        const container = document.getElementById('memory-game-content');
        if(!container) return;
        
        let h = '<div style="background: var(--bg-card); padding: 15px; border-radius: 8px;">';
        
        if (!this.gameActive) {
            // ÚVODNÍ NEBO VÍTĚZNÁ OBRAZOVKA
            h += `<h3 style="text-align: center; margin-top: 0;">🧠 Memory Game</h3>`;
            if (this.moves > 0) {
                h += `<div style="text-align: center; padding: 20px; margin: 15px 0; background: rgba(76,175,80,0.2); border: 2px solid #4CAF50; border-radius: 8px;">`;
                h += `<strong>Skvělá práce!</strong><br><br>`;
                h += `Dokončeno na <strong>${this.moves}</strong> ${t('minigames.memory.moves').toLowerCase()}.`;
                h += `</div>`;
            } else {
                h += `<p style="text-align: center; margin: 20px 0; opacity: 0.8;">Nalezněte všechny dvojice.</p>`;
            }
            h += `<button class="craft-btn" onclick="MemoryGame.start()" style="width: 100%; padding: 15px; font-size: 1.1rem;">${t('minigames.memory.new_game')}</button>`;
        } else {
            // SAMOTNÁ HRA
            h += `<div style="display:flex; justify-content:space-between; margin-bottom:10px;">`;
            h += `<strong>Memory Game</strong>`;
            h += `<span>${t('minigames.memory.moves')}: ${this.moves}</span>`;
            h += `</div>`;
            
            h += `<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">`;
            this.cards.forEach((card, idx) => {
                const isFlipped = this.flipped.includes(idx) || card.matched;
                const item = ItemsDB[card.id];
                
                if(isFlipped) {
                    h += `<div style="padding:15px; background:var(--bg-card); border:2px solid var(--accent-gold); border-radius:4px; cursor:pointer; text-align:center; font-size:1.5rem;" onclick="MemoryGame.flip(${idx})">`;
                    h += item.icon;
                    h += `</div>`;
                } else {
                    h += `<div style="padding:15px; background:var(--accent-wax); border:2px solid var(--border-color); border-radius:4px; cursor:pointer; text-align:center; font-size:1.5rem;" onclick="MemoryGame.flip(${idx})">`;
                    h += `🎴`;
                    h += `</div>`;
                }
            });
            h += `</div>`;
            
            h += `<button class="craft-btn" onclick="MemoryGame.start()" style="margin-top:10px;">${t('minigames.memory.new_game')}</button>`;
        }
        
        h += `</div>`;
        container.innerHTML = h;
    },
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('memory-game-modal');
        if(modal) modal.remove();
    }
};