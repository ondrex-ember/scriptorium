const KarnoffelGame = {
    gameActive: false,
    deck: [],
    playerHand: [],
    opponentHand: [],
    playerTricks: 0,
    opponentTricks: 0,
    trump: null,
    currentTrick: [],
    
    suits: ['🍃', '🔔', '❤️', '🎯'],
    ranks: ['6', '7', '8', '9', '10', 'U', 'O', 'K'],
    
    start: function() {
        if (!GameState.inventory.karnoffel_deck || GameState.inventory.karnoffel_deck < 1) {
            UI.notify(t('games.karnoffelNeedDeck'), true);
            return;
        }
        
        this.gameActive = true;
        this.playerTricks = 0;
        this.opponentTricks = 0;
        this.currentTrick = [];
        
        this.createDeck();
        this.trump = this.suits[Math.floor(Math.random() * this.suits.length)];
        this.dealCards();
        this.render();
    },
    
    createDeck: function() {
        this.deck = [];
        this.suits.forEach(suit => {
            this.ranks.forEach(rank => {
                this.deck.push({ suit, rank, power: this.getPower(rank, suit) });
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
    
    getPower: function(rank, suit) {
        const basePower = {
            '6': 1, '7': 2, '8': 3, '9': 4, '10': 5,
            'U': 6, 'O': 7, 'K': 8
        };
        
        let power = basePower[rank];
        if(suit === this.trump) power += 10;
        
        return power;
    },
    
    dealCards: function() {
        this.playerHand = [];
        this.opponentHand = [];
        
        for(let i = 0; i < 5; i++) {
            this.playerHand.push(this.deck.pop());
            this.opponentHand.push(this.deck.pop());
        }
    },
    
    playCard: function(index) {
        if(!this.gameActive) return;
        if(this.currentTrick.length >= 2) return;
        
        const card = this.playerHand.splice(index, 1)[0];
        this.currentTrick.push({ card, player: 'you' });
        
        setTimeout(() => {
            const oppCard = this.opponentHand.pop();
            this.currentTrick.push({ card: oppCard, player: 'opp' });
            
            setTimeout(() => this.resolveTrick(), 1000);
        }, 500);
        
        this.render();
    },
    
    resolveTrick: function() {
        const [play1, play2] = this.currentTrick;
        
        let winner;
        if(play1.card.power > play2.card.power) {
            winner = play1.player;
        } else {
            winner = play2.player;
        }
        
        if(winner === 'you') {
            this.playerTricks++;
            UI.notify(t('games.karnoffelTrickWin'));
        } else {
            this.opponentTricks++;
            UI.notify(t('games.karnoffelTrickLoss'));
        }
        
        this.currentTrick = [];
        
        if(this.playerHand.length === 0) {
            setTimeout(() => this.endGame(), 1500);
        } else {
            setTimeout(() => this.render(), 1500);
        }
    },
    
    endGame: function() {
        this.gameActive = false;
        
        if(this.playerTricks > this.opponentTricks) {
            const reward = 3;
            Game.addItem('research', reward);
            
            if(GameState.achievements) {
                GameState.achievements.stats.karnoffelGamesWon++;
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            
            UI.notify(t('games.karnoffelGameWin').replace('{reward}', reward));
        } else {
            if(GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
            }
            
            UI.notify(t('games.karnoffelGameLoss'));
        }
        
        setTimeout(() => this.render(), 1500);
    },
    
    render: function() {
        let modal = document.getElementById('karnoffel-modal');
        
        if(!this.gameActive) {
            if(modal) modal.remove();
            return;
        }
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'karnoffel-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content">
                    <button class="game-modal-close" onclick="KarnoffelGame.close()">×</button>
                    <div id="karnoffel-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) KarnoffelGame.close();
            });
        }
        
        const container = document.getElementById('karnoffel-content');
        if(!container) return;
        
        let h = '<div style="background: var(--bg-card); padding: 15px; border-radius: 8px;">';
        h += `<h3>${t('games.karnoffelTitle')}</h3>`;
        
        if(!this.gameActive) {
            h += `<p style="margin: 10px 0;">${t('games.karnoffelSubtitle')}</p>`;
            h += `<button class="craft-btn" onclick="KarnoffelGame.start()" style="margin-top: 10px;">${t('games.karnoffelBtnPlay')}</button>`;
        } else {
            h += `<div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px;">`;
            h += `<div>${t('games.karnoffelLabelYourTricks')}: ${this.playerTricks}</div>`;
            h += `<div>${t('games.karnoffelLabelTrump')}: ${this.trump}</div>`;
            h += `<div>${t('games.karnoffelLabelOpponent')}: ${this.opponentTricks}</div>`;
            h += `</div>`;
            
            if(this.currentTrick.length > 0) {
                h += `<div style="margin: 15px 0; padding: 10px; background: rgba(197,160,89,0.2); border-radius: 4px;">`;
                h += `<strong>${t('games.karnoffelLabelCurrentTrick')}</strong><div style="display: flex; gap: 10px; margin-top: 5px; justify-content: center;">`;
                this.currentTrick.forEach(play => {
                    h += `<div style="padding: 10px; background: white; border: 2px solid var(--accent-gold); border-radius: 4px; text-align: center; color: black;">`;
                    h += `${play.card.rank}${play.card.suit}`;
                    h += `</div>`;
                });
                h += `</div></div>`;
            }
            
            h += `<div style="margin: 15px 0;">`;
            h += `<strong>${t('games.karnoffelLabelYourCards')}</strong>`;
            h += `<div style="display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap;">`;
            this.playerHand.forEach((card, idx) => {
                const isTrump = card.suit === this.trump;
                h += `<div style="padding: 10px; background: ${isTrump ? 'gold' : 'white'}; border: 2px solid var(--border-color); border-radius: 4px; text-align: center; min-width: 40px; cursor: pointer; color: black;" onclick="KarnoffelGame.playCard(${idx})">`;
                h += `${card.rank}${card.suit}`;
                h += `</div>`;
            });
            h += `</div></div>`;
        }
        
        h += '</div>';
        container.innerHTML = h;
    },
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('karnoffel-modal');
        if(modal) modal.remove();
    },
    
    showRules: function() {
        let modal = document.getElementById('karnoffel-rules-modal');
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'karnoffel-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        let h = '<div class="game-modal-content" style="max-width: 600px;">';
        h += '<button class="game-modal-close" onclick="document.getElementById(\'karnoffel-rules-modal\').remove()">×</button>';
        h += '<div style="background: var(--bg-card); padding: 20px; border-radius: 8px;">';
        
        h += `<h2 style="margin-bottom: 15px; color: var(--ink-primary);">${t('games.karnoffelRulesTitle')}</h2>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.karnoffelRulesHistory')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.karnoffelRulesHistoryText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.karnoffelRulesDeck')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.karnoffelRulesDeckText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.karnoffelRulesGoal')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.karnoffelRulesGoalText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.karnoffelRulesTrump')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.karnoffelRulesTrumpText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.karnoffelRulesPlay')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.karnoffelRulesPlayText')}</p>`;
        
        h += '</div></div>';
        modal.innerHTML = h;
    }
};