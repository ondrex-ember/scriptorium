const PrimeroGame = {
    gameActive: false,
    deck: [],
    playerHand: [],
    opponentHand: [],
    playerScore: 0,
    opponentScore: 0,
    round: 1,
    bet: 5,
    
    suits: ['♠️', '♥️', '♣️', '♦️'],
    ranks: ['1', '2', '3', '4', '5', '6', '7', 'J', 'K', 'Q'],
    
    start: function() {
        if (!GameState.inventory.primero_deck || GameState.inventory.primero_deck < 1) {
            UI.notify(t('games.primeroNeedDeck'), true);
            return;
        }
        
        if (!GameState.inventory.research || GameState.inventory.research < this.bet) {
            UI.notify(t('games.primeroNeedBet').replace('{bet}', this.bet), true);
            return;
        }
        
        Game.addItem('research', -this.bet);
        
        this.gameActive = true;
        this.round = 1;
        this.playerScore = 0;
        this.opponentScore = 0;
        
        this.createDeck();
        this.dealCards();
        this.render();
    },
    
    createDeck: function() {
        this.deck = [];
        this.suits.forEach(suit => {
            this.ranks.forEach(rank => {
                this.deck.push({ suit, rank });
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
    
    dealCards: function() {
        this.playerHand = [];
        this.opponentHand = [];
        
        for(let i = 0; i < 4; i++) {
            this.playerHand.push(this.deck.pop());
            this.opponentHand.push(this.deck.pop());
        }
    },
    
    evaluateHand: function(hand) {
        const suits = {};
        const ranks = {};
        
        hand.forEach(card => {
            suits[card.suit] = (suits[card.suit] || 0) + 1;
            ranks[card.rank] = (ranks[card.rank] || 0) + 1;
        });
        
        let score = 0;
        
        if(Object.keys(suits).length === 1) score += 40;
        
        Object.values(ranks).forEach(count => {
            if(count === 2) score += 10;
            if(count === 3) score += 30;
            if(count === 4) score += 50;
        });
        
        hand.forEach(card => {
            if(card.rank === 'K') score += 5;
            if(card.rank === 'Q') score += 4;
            if(card.rank === 'J') score += 3;
        });
        
        return score;
    },
    
    playRound: function() {
        const playerValue = this.evaluateHand(this.playerHand);
        const opponentValue = this.evaluateHand(this.opponentHand);
        
        let result = '';
        if(playerValue > opponentValue) {
            this.playerScore++;
            result = t('games.primeroRoundWin')
                        .replace('{player}', playerValue)
                        .replace('{opponent}', opponentValue);
        } else if(opponentValue > playerValue) {
            this.opponentScore++;
            result = t('games.primeroRoundLoss')
                        .replace('{player}', playerValue)
                        .replace('{opponent}', opponentValue);
        } else {
            result = t('games.primeroRoundDraw').replace('{player}', playerValue);
        }
        
        UI.notify(result);
        
        if(this.round < 3) {
            this.round++;
            setTimeout(() => {
                this.dealCards();
                this.render();
            }, 2000);
        } else {
            setTimeout(() => this.endGame(), 2000);
        }
    },
    
    endGame: function() {
        this.gameActive = false;
        
        if(this.playerScore > this.opponentScore) {
            const reward = this.bet * 2;
            Game.addItem('research', reward);
            
            // Track stats
            if(GameState.achievements) {
                GameState.achievements.stats.primeroGamesWon++;
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            
            UI.notify(t('games.primeroGameWin').replace('{reward}', reward));
        } else if(this.playerScore < this.opponentScore) {
            // Track played (even if lost)
            if(GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
            }
            
            UI.notify(t('games.primeroGameLoss').replace('{bet}', this.bet));
        } else {
            Game.addItem('research', this.bet);
            
            // Track draw
            if(GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += this.bet;
            }
            
            UI.notify(t('games.primeroGameDraw').replace('{bet}', this.bet));
        }
        
        setTimeout(() => this.render(), 1500);
    },
    
    render: function() {
        let modal = document.getElementById('primero-modal');
        
        if(!this.gameActive) {
            if(modal) modal.remove();
            return;
        }
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'primero-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content">
                    <button class="game-modal-close" onclick="PrimeroGame.close()">×</button>
                    <div id="primero-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) PrimeroGame.close();
            });
        }
        
        const container = document.getElementById('primero-content');
        if(!container) return;
        
        let h = '<div style="background: var(--bg-card); padding: 15px; border-radius: 8px;">';
        h += `<h3>${t('games.primeroTitle')}</h3>`;
        
        if(!this.gameActive) {
            h += `<p style="margin: 10px 0;">${t('games.primeroSubtitle')}</p>`;
            h += `<p style="opacity: 0.8; font-size: 0.9rem;">${t('games.primeroBetInfo').replace('{bet}', this.bet)}</p>`;
            h += `<button class="craft-btn" onclick="PrimeroGame.start()" style="margin-top: 10px;">${t('games.primeroBtnPlay')}</button>`;
        } else {
            h += `<div style="display: flex; justify-content: space-between; margin: 10px 0;">`;
            h += `<div>${t('games.primeroLabelYou')}: ${this.playerScore}</div>`;
            h += `<div>${t('games.primeroLabelRound')}: ${this.round}/3</div>`;
            h += `<div>${t('games.primeroLabelOpponent')}: ${this.opponentScore}</div>`;
            h += `</div>`;
            
            h += `<div style="margin: 15px 0;">`;
            h += `<strong>${t('games.primeroLabelYourCards')}</strong>`;
            h += `<div style="display: flex; gap: 5px; margin-top: 5px;">`;
            this.playerHand.forEach(card => {
                h += `<div style="padding: 10px; background: white; border: 2px solid var(--border-color); border-radius: 4px; text-align: center; min-width: 40px; color: black;">`;
                h += `${card.rank}${card.suit}`;
                h += `</div>`;
            });
            h += `</div></div>`;
            
            h += `<div style="margin: 15px 0;">`;
            h += `<strong>${t('games.primeroLabelOpponent')}</strong>`;
            h += `<div style="display: flex; gap: 5px; margin-top: 5px;">`;
            this.opponentHand.forEach(() => {
                h += `<div style="padding: 10px; background: var(--accent-wax); border: 2px solid var(--border-color); border-radius: 4px; text-align: center; min-width: 40px;">`;
                h += `🎴`;
                h += `</div>`;
            });
            h += `</div></div>`;
            
            h += `<button class="craft-btn" onclick="PrimeroGame.playRound()" style="margin-top: 10px;">${t('games.primeroBtnReveal')}</button>`;
        }
        
        h += '</div>';
        container.innerHTML = h;
    },
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('primero-modal');
        if(modal) modal.remove();
    },
    
    showRules: function() {
        let modal = document.getElementById('primero-rules-modal');
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'primero-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        let h = '<div class="game-modal-content" style="max-width: 600px;">';
        h += '<button class="game-modal-close" onclick="document.getElementById(\'primero-rules-modal\').remove()">×</button>';
        h += '<div style="background: var(--bg-card); padding: 20px; border-radius: 8px;">';
        
        h += `<h2 style="margin-bottom: 15px; color: var(--ink-primary);">${t('games.primeroRulesTitle')}</h2>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.primeroRulesHistory')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.primeroRulesHistoryText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.primeroRulesDeck')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.primeroRulesDeckText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.primeroRulesGoal')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.primeroRulesGoalText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.primeroRulesScoring')}</h3>`;
        h += `<div style="opacity: 0.9; line-height: 1.6;">`;
        h += `${t('games.primeroRulesScoringFlux')}<br>`;
        h += `${t('games.primeroRulesScoringFour')}<br>`;
        h += `${t('games.primeroRulesScoringThree')}<br>`;
        h += `${t('games.primeroRulesScoringPair')}<br>`;
        h += `${t('games.primeroRulesScoringFace')}`;
        h += `</div>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.primeroRulesHowTo')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.primeroRulesHowToText')}</p>`;
        
        h += '</div></div>';
        modal.innerHTML = h;
    }
  };