const FreeCellGame = {
    gameActive: false,
    deck: [],
    tableau: [],
    foundations: [[], [], [], []],
    freeCells: [null, null, null, null],
    selected: null,
    moves: 0,
    
    suits: ['♠️', '♥️', '♣️', '♦️'],
    ranks: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    
    start: function() {
        if (!GameState.inventory.french_deck || GameState.inventory.french_deck < 1) {
            UI.notify(t('games.freecellNeedDeck'), true);
            return;
        }
        
        this.gameActive = true;
        this.moves = 0;
        this.selected = null;
        this.foundations = [[], [], [], []];
        this.freeCells = [null, null, null, null];
        
        this.createDeck();
        this.dealTableau();
        this.render();
    },
    
    createDeck: function() {
        this.deck = [];
        this.suits.forEach(suit => {
            this.ranks.forEach((rank, idx) => {
                this.deck.push({ 
                    suit, 
                    rank, 
                    value: idx + 1,
                    color: (suit === '♥️' || suit === '♦️') ? 'red' : 'black'
                });
            });
        });
        this.shuffle(this.deck);
    },
    
    shuffle: function(array) {
        for(let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },
    
    dealTableau: function() {
        this.tableau = [[], [], [], [], [], [], [], []];
        
        let colIndex = 0;
        while(this.deck.length > 0) {
            this.tableau[colIndex].push(this.deck.pop());
            colIndex = (colIndex + 1) % 8;
        }
    },
    
    selectCard: function(location, index) {
        this.selected = { location, index };
        this.render();
    },
    
    moveToFoundation: function(foundationIndex) {
        if(!this.selected) return;
        
        const card = this.getCardAtSelection();
        if(!card) return;
        
        const foundation = this.foundations[foundationIndex];
        
        if(foundation.length === 0 && card.rank !== 'A') {
            UI.notify(t('games.freecellErrAce'), true);
            return;
        }
        
        if(foundation.length > 0) {
            const topCard = foundation[foundation.length - 1];
            if(topCard.suit !== card.suit || topCard.value + 1 !== card.value) {
                UI.notify(t('games.freecellErrInvalid'), true);
                return;
            }
        }
        
        this.removeCardFromSelection();
        foundation.push(card);
        this.moves++;
        this.selected = null;
        
        if(this.foundations.every(f => f.length === 13)) {
            this.win();
        }
        
        this.render();
    },
    
    moveToTableau: function(colIndex) {
        if(!this.selected) return;
        
        const card = this.getCardAtSelection();
        if(!card) return;
        
        const column = this.tableau[colIndex];
        
        if(column.length === 0) {
            // OK
        } else {
            const topCard = column[column.length - 1];
            if(topCard.color === card.color || topCard.value !== card.value + 1) {
                UI.notify(t('games.freecellErrColorVal'), true);
                return;
            }
        }
        
        this.removeCardFromSelection();
        column.push(card);
        this.moves++;
        this.selected = null;
        this.render();
    },
    
    moveToFreeCell: function(cellIndex) {
        if(!this.selected) return;
        if(this.freeCells[cellIndex] !== null) {
            UI.notify(t('games.freecellErrCellFull'), true);
            return;
        }
        
        const card = this.getCardAtSelection();
        if(!card) return;
        
        this.removeCardFromSelection();
        this.freeCells[cellIndex] = card;
        this.moves++;
        this.selected = null;
        this.render();
    },
    
    getCardAtSelection: function() {
        if(!this.selected) return null;
        
        if(this.selected.location === 'tableau') {
            const col = this.tableau[this.selected.index];
            return col[col.length - 1];
        } else if(this.selected.location === 'freecell') {
            return this.freeCells[this.selected.index];
        }
        return null;
    },
    
    removeCardFromSelection: function() {
        if(!this.selected) return;
        
        if(this.selected.location === 'tableau') {
            this.tableau[this.selected.index].pop();
        } else if(this.selected.location === 'freecell') {
            this.freeCells[this.selected.index] = null;
        }
    },
    
    win: function() {
        this.gameActive = false;
        
        let reward = 5;
        if(this.moves < 100) reward = 8;
        if(this.moves < 80) reward = 10;
        
        Game.addItem('research', reward);
        
        // Track stats
        if(GameState.achievements) {
            GameState.achievements.stats.freecellGamesWon++;
            GameState.achievements.stats.totalGamesPlayed++;
            GameState.achievements.stats.totalResearchGained += reward;
        }
        
        UI.notify(t('games.freecellWin').replace('{reward}', reward).replace('{moves}', this.moves));
        
        setTimeout(() => this.render(), 2000);
    },
    
    render: function() {
        let modal = document.getElementById('freecell-modal');
        
        if(!this.gameActive) {
            if(modal) modal.remove();
            return;
        }
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'freecell-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content">
                    <button class="game-modal-close" onclick="FreeCellGame.close()">×</button>
                    <div id="freecell-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) FreeCellGame.close();
            });
        }
        
        const container = document.getElementById('freecell-content');
        if(!container) return;
        
        const isMobile = window.innerWidth <= 500;
        const cardPad = isMobile ? '4px 2px' : '10px';
        const cardFontSize = isMobile ? '0.65rem' : '0.9rem';
        const cardMinH = isMobile ? '28px' : '40px';
        const colMinH = isMobile ? '100px' : '150px';
        const cardItemFontSize = isMobile ? '0.6rem' : '0.7rem';

        let h = '<div style="background: var(--bg-card); padding: 15px; border-radius: 8px;">';
        h += `<h3>${t('games.freecellTitle')}</h3>`;
        
        if(!this.gameActive && this.tableau.length === 0) {
            h += `<p style="margin: 10px 0;">${t('games.freecellSubtitle')}</p>`;
            h += `<button class="craft-btn" onclick="FreeCellGame.start()" style="margin-top: 10px;">${t('games.freecellBtnPlay')}</button>`;
        } else {
            h += `<div style="margin-bottom: 10px;"><strong>${t('games.freecellLabelMoves').replace('{moves}', this.moves)}</strong></div>`;
            
            h += `<div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; margin-bottom: 10px;">`;
            
            for(let i = 0; i < 4; i++) {
                const card = this.freeCells[i];
                const isSelected = this.selected && this.selected.location === 'freecell' && this.selected.index === i;
                const textColor = card ? card.color : 'inherit';
                h += `<div style="padding: ${cardPad}; background: ${isSelected ? 'gold' : 'rgba(0,0,0,0.1)'}; border: 2px dashed var(--border-color); border-radius: 4px; min-height: ${cardMinH}; text-align: center; cursor: pointer; font-size: ${cardFontSize}; color: ${textColor}; display:flex; flex-direction:column; align-items:center; justify-content:center;" onclick="FreeCellGame.${card ? `selectCard('freecell', ${i})` : `moveToFreeCell(${i})`}">`;
                if(card) h += `${card.rank}${card.suit}`;
                else h += `💠`;
                h += `</div>`;
            }
            
            for(let i = 0; i < 4; i++) {
                const foundation = this.foundations[i];
                const topCard = foundation[foundation.length - 1];
                const textColor = topCard ? topCard.color : 'inherit';
                h += `<div style="padding: ${cardPad}; background: rgba(197,160,89,0.2); border: 2px solid var(--accent-gold); border-radius: 4px; min-height: ${cardMinH}; text-align: center; cursor: pointer; font-size: ${cardFontSize}; color: ${textColor}; display:flex; flex-direction:column; align-items:center; justify-content:center;" onclick="FreeCellGame.moveToFoundation(${i})">`;
                if(topCard) h += `${topCard.rank}${topCard.suit}`;
                else h += `🏆`;
                h += `</div>`;
            }
            
            h += `</div>`;
            
            h += `<div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px;">`;
            for(let i = 0; i < 8; i++) {
                const col = this.tableau[i];
                h += `<div style="min-height: ${colMinH}; background: rgba(0,0,0,0.05); border-radius: 4px; padding: 3px; cursor: pointer;" onclick="FreeCellGame.moveToTableau(${i})">`;
                
                col.forEach((card, cardIdx) => {
                    const isTop = cardIdx === col.length - 1;
                    const isSelected = this.selected && this.selected.location === 'tableau' && this.selected.index === i && isTop;
                    h += `<div style="padding: 2px 1px; background: ${isSelected ? 'gold' : 'white'}; border: 1px solid var(--border-color); border-radius: 2px; margin-bottom: 2px; font-size: ${cardItemFontSize}; text-align: center; cursor: pointer; color: ${card.color}; display:flex; flex-direction:column; align-items:center; line-height:1.1;" onclick="event.stopPropagation(); ${isTop ? `FreeCellGame.selectCard('tableau', ${i})` : 'void(0)'}">`;
                    h += `<span>${card.rank}</span><span>${card.suit}</span>`;
                    h += `</div>`;
                });
                
                h += `</div>`;
            }
            h += `</div>`;
            
            h += `<button class="craft-btn" onclick="FreeCellGame.start()" style="margin-top: 10px;">${t('games.freecellBtnNew')}</button>`;
        }
        
        h += '</div>';
        container.innerHTML = h;
    },
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('freecell-modal');
        if(modal) modal.remove();
    },
    
    showRules: function() {
        let modal = document.getElementById('freecell-rules-modal');
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'freecell-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        let h = '<div class="game-modal-content" style="max-width: 600px;">';
        h += '<button class="game-modal-close" onclick="document.getElementById(\'freecell-rules-modal\').remove()">×</button>';
        h += '<div style="background: var(--bg-card); padding: 20px; border-radius: 8px;">';
        
        h += `<h2 style="margin-bottom: 15px; color: var(--ink-primary);">${t('games.freecellRulesTitle')}</h2>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.freecellRulesHistory')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.freecellRulesHistoryText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.freecellRulesGoal')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.freecellRulesGoalText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.freecellRulesFreeCells')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.freecellRulesFreeCellsText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.freecellRulesTableau')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.freecellRulesTableauText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.freecellRulesStrategy')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.freecellRulesStrategyText')}</p>`;
        
        h += '</div></div>';
        modal.innerHTML = h;
    }
};