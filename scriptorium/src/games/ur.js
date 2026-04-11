const RoyalGameOfUr = {
    gameActive: false,
    mode: 'ai',
     lastMessage: '',
    
    board: [],
    playerPieces: [],
    aiPieces: [],
    
    currentTurn: 'player',
    diceRoll: 0,
    canMove: false,
    selectedPiece: null,
    
    rosettes: [3, 7, 13, 17],
    sharedSquares: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    
    stats: {
        playerFinished: 0,
        aiFinished: 0,
        moves: 0,
        captures: 0
    },
    
    start: function() {
        if (!GameState.inventory.ur_board || GameState.inventory.ur_board < 1) {
            this.lastMessage = t('games.urNeedBoard'), true; this.render();
            return;
        }
        
        this.lastMessage = ''; // Clear previous message
        
        this.gameActive = true;
        this.mode = 'ai';
        this.currentTurn = 'player';
        this.diceRoll = 0;
        this.canMove = false;
        this.selectedPiece = null;
        
        this.playerPieces = [];
        this.aiPieces = [];
        for(let i = 0; i < 7; i++) {
            this.playerPieces.push({ id: i, position: -1 });
            this.aiPieces.push({ id: i, position: -1 });
        }
        
        this.board = Array(20).fill(null);
        
        this.stats = {
            playerFinished: 0,
            aiFinished: 0,
            moves: 0,
            captures: 0
        };
        
        this.render();
    },
    
    rollDice: function() {
        if(!this.gameActive) return;
        if(this.canMove) {
            this.lastMessage = t('games.urErrMoveFirst'), true; this.render();
            return;
        }
        
        let total = 0;
        for(let i = 0; i < 4; i++) {
            total += Math.random() < 0.5 ? 1 : 0;
        }
        
        this.diceRoll = total;
        this.stats.moves++;
        
        if(this.currentTurn === 'player') {
            const validMoves = this.getValidMoves('player');
            if(validMoves.length === 0) {
                if(this.diceRoll === 0) {
                    this.lastMessage = t('games.urRollZeroSkip'); this.render();
                } else {
                    this.lastMessage = t('games.urErrNoMoves'); this.render();
                }
                setTimeout(() => this.endTurn(), 1500);
            } else {
                this.canMove = true;
                this.lastMessage = t('games.urRollSuccess').replace('{roll}', this.diceRoll); this.render();
            }
        } else {
            setTimeout(() => this.aiMove(), 1000);
        }
        
        this.render();
    },
    
    getValidMoves: function(player) {
        const pieces = player === 'player' ? this.playerPieces : this.aiPieces;
        const valid = [];
        
        pieces.forEach((piece, idx) => {
            const newPos = this.calculateNewPosition(piece.position, this.diceRoll, player);
            
            if(newPos !== null && this.isValidMove(piece.position, newPos, player)) {
                valid.push(idx);
            }
        });
        
        return valid;
    },
    
    calculateNewPosition: function(currentPos, roll, player) {
        if(roll === 0) return null;
        
        if(currentPos === -1) {
            return player === 'player' ? roll - 1 : 14 + roll - 1;
        }
        
        if(currentPos === 20) return null;
        
        let newPos;
        if(player === 'player') {
            if(currentPos < 4) {
                newPos = currentPos + roll;
            } else if(currentPos < 13) {
                newPos = currentPos + roll;
            } else if(currentPos === 13) {
                if(roll === 1) newPos = 20;
                else return null;
            } else {
                return null;
            }
        } else {
            if(currentPos < 18) {
                newPos = currentPos + roll;
                if(newPos >= 18) {
                    newPos = 12 - (newPos - 18);
                }
            } else if(currentPos >= 4 && currentPos <= 12) {
                newPos = currentPos - roll;
            } else if(currentPos === 18) {
                if(roll === 1) newPos = 20;
                else return null;
            } else {
                return null;
            }
        }
        
        if(newPos < 0 || (newPos > 19 && newPos !== 20)) return null;
        
        return newPos;
    },
    
    isValidMove: function(oldPos, newPos, player) {
        if(newPos === null) return false;
        if(newPos === 20) return true;
        
        const occupant = this.board[newPos];
        
        if(!occupant) return true;
        
        if(occupant.player === player) return false;
        
        if(this.rosettes.includes(newPos)) return false;
        if(!this.sharedSquares.includes(newPos)) return false;
        
        return true;
    },
    
    movePiece: function(pieceIndex) {
        if(!this.canMove) return;
        if(this.currentTurn !== 'player') return;
        
        const piece = this.playerPieces[pieceIndex];
        const newPos = this.calculateNewPosition(piece.position, this.diceRoll, 'player');
        
        if(!this.isValidMove(piece.position, newPos, 'player')) {
            this.lastMessage = t('games.urErrInvalid'), true; this.render();
            return;
        }
        
        this.executeMoveForPlayer(pieceIndex, newPos, 'player');
        
        if(this.rosettes.includes(newPos)) {
            this.lastMessage = t('games.urRosette'); this.render();
            this.canMove = false;
            this.diceRoll = 0;
        } else {
            this.endTurn();
        }
        
        this.checkWin();
        this.render();
    },
    
    executeMoveForPlayer: function(pieceIndex, newPos, player) {
        const pieces = player === 'player' ? this.playerPieces : this.aiPieces;
        const piece = pieces[pieceIndex];
        const oldPos = piece.position;
        
        if(oldPos >= 0 && oldPos < 20) {
            this.board[oldPos] = null;
        }
        
        if(newPos < 20 && this.board[newPos]) {
            const captured = this.board[newPos];
            if(captured.player !== player) {
                const enemyPieces = captured.player === 'player' ? this.playerPieces : this.aiPieces;
                enemyPieces[captured.pieceId].position = -1;
                this.stats.captures++;
                this.lastMessage = t('games.urCapture'); this.render();
            }
        }
        
        piece.position = newPos;
        
        if(newPos === 20) {
            if(player === 'player') this.stats.playerFinished++;
            else this.stats.aiFinished++;
        } else {
            this.board[newPos] = { player, pieceId: pieceIndex };
        }
    },
    
    endTurn: function() {
        this.canMove = false;
        this.diceRoll = 0;
        this.selectedPiece = null;
        
        this.currentTurn = this.currentTurn === 'player' ? 'ai' : 'player';
        
        if(this.currentTurn === 'ai') {
            setTimeout(() => this.rollDice(), 1000);
        }
        
        this.render();
    },
    
    aiMove: function() {
        if(!this.gameActive) return;
        
        const validMoves = this.getValidMoves('ai');
        
        if(validMoves.length === 0) {
            if(this.diceRoll === 0) {
                this.lastMessage = t('games.urAiRollZero'); this.render();
            } else {
                this.lastMessage = t('games.urAiNoMoves'); this.render();
            }
            setTimeout(() => this.endTurn(), 1500);
            return;
        }
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        validMoves.forEach(pieceIdx => {
            const piece = this.aiPieces[pieceIdx];
            const newPos = this.calculateNewPosition(piece.position, this.diceRoll, 'ai');
            let score = 0;
            
            if(newPos === 20) score += 1000;
            
            if(newPos < 20 && this.board[newPos] && this.board[newPos].player === 'player') {
                score += 500;
            }
            
            if(this.rosettes.includes(newPos)) score += 300;
            
            score += newPos;
            
            if(score > bestScore) {
                bestScore = score;
                bestMove = pieceIdx;
            }
        });
        
        if(bestMove !== null) {
            const newPos = this.calculateNewPosition(this.aiPieces[bestMove].position, this.diceRoll, 'ai');
            this.executeMoveForPlayer(bestMove, newPos, 'ai');
            
            this.lastMessage = t('games.urAiMove').replace('{pos}', newPos); this.render();
            
            if(this.rosettes.includes(newPos)) {
                this.lastMessage = t('games.urAiRosette'); this.render();
                setTimeout(() => this.rollDice(), 1500);
            } else {
                setTimeout(() => this.endTurn(), 1500);
            }
        }
        
        this.checkWin();
        this.render();
    },
    
    checkWin: function() {
        if(this.stats.playerFinished === 7) {
            this.gameActive = false;
            const reward = 4;
            Game.addItem('research', reward);
            
            if(GameState.achievements) {
                GameState.achievements.stats.urGamesWon++;
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            
            this.lastMessage = t('games.urWinVs').replace('{reward}', reward); this.render();
            setTimeout(() => this.render(), 2000);
        } else if(this.stats.aiFinished === 7) {
            this.gameActive = false;
            
            if(GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
            }
            
            this.lastMessage = t('games.urLossVs'); this.render();
            setTimeout(() => this.render(), 2000);
        }
    },
    
    render: function() {
        let modal = document.getElementById('ur-game-modal');
        
        if(!this.gameActive) {
            if(modal) modal.remove();
            return;
        }
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'ur-game-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content">
                    <button class="game-modal-close" onclick="RoyalGameOfUr.close()">×</button>
                    <div id="ur-game-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) RoyalGameOfUr.close();
            });
        }
        
        const container = document.getElementById('ur-game-content');
        if(!container) return;
        
        let h = '<div style="background: var(--bg-card); padding: 15px; border-radius: 8px;">';
        h += `<h3>${t('games.urTitleVs')}</h3>`;
        
        if(!this.gameActive) {
            h += `<p style="margin: 10px 0;">${t('games.urSubtitleVs')}</p>`;
            h += `<p style="font-size: 0.9rem; opacity: 0.8;">${t('games.urDescVs')}</p>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUr.start()" style="margin-top: 10px;">${t('games.urBtnVsAi')}</button>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.start()" style="margin-top: 10px; background: var(--accent-gold);">${t('games.urBtnSolo')}</button>`;
        } else {
            h += `<div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px;">`;
            h += `<div>${t('games.urLabelYou')}: ${this.stats.playerFinished}/7</div>`;
            h += `<div>${t('games.urLabelMoves')}: ${this.stats.moves}</div>`;
            h += `<div>${t('games.urLabelAi')}: ${this.stats.aiFinished}/7</div>`;
            h += `</div>`;
            
            if(this.lastMessage) {
                h += `<div style="text-align: center; margin: 10px 0; padding: 10px; background: rgba(197,160,89,0.3); border: 2px solid var(--accent-gold); border-radius: 4px; font-size: 0.95rem; color: var(--ink-primary);">`;
                h += this.lastMessage;
                h += `</div>`;
            }
            
            if(this.currentTurn === 'player' && !this.canMove) {
                h += `<button class="craft-btn" onclick="RoyalGameOfUr.rollDice()" style="margin: 10px 0; width: 100%;">${t('games.urBtnRoll')}</button>`;
            } else if(this.diceRoll > 0) {
                h += `<div style="text-align: center; margin: 10px 0; padding: 10px; background: gold; border-radius: 4px; font-size: 1.2rem; color: black;">`;
                h += t('games.urLabelRoll').replace('{roll}', this.diceRoll);
                h += `</div>`;
            }
            
            h += this.renderBoard();
            
            const playerOffBoard = this.playerPieces.filter(p => p.position === -1);
            if(playerOffBoard.length > 0 && this.canMove) {
                h += `<div style="margin-top: 15px;">`;
                h += `<strong>${t('games.urLabelOffboard').replace('{count}', playerOffBoard.length)}</strong>`;
                h += `<div style="display: flex; gap: 5px; margin-top: 5px;">`;
                playerOffBoard.forEach(piece => {
                    h += `<button class="craft-btn" onclick="RoyalGameOfUr.movePiece(${piece.id})" style="padding: 8px;">`;
                    h += `🔵${piece.id + 1}`;
                    h += `</button>`;
                });
                h += `</div></div>`;
            }
        }
        
        h += '</div>';
        container.innerHTML = h;
    },
    
    renderBoard: function() {
        let h = '<div style="margin: 15px 0;">';
        h += '<div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 3px; font-size: 0.8rem;">';
        
        for(let i = 0; i < 4; i++) {
            h += this.renderSquare(i, 'player');
        }
        h += '<div></div><div></div><div></div><div></div>';
        
        for(let i = 4; i <= 12; i++) {
            h += this.renderSquare(i, 'shared');
        }
        
        h += this.renderSquare(13, 'player');
        for(let i = 14; i < 18; i++) {
            h += this.renderSquare(i, 'ai');
        }
        h += this.renderSquare(18, 'ai');
        h += '<div></div><div></div>';
        
        h += '</div></div>';
        return h;
    },
    
    renderSquare: function(index, type) {
        const isRosette = this.rosettes.includes(index);
        const occupant = this.board[index];
        
        let bgColor = 'rgba(139,100,52,0.2)';
        if(type === 'shared') bgColor = 'rgba(138,51,36,0.2)';
        if(isRosette) bgColor = 'rgba(197,160,89,0.3)';
        
        let content = isRosette ? '✿' : index;
        if(occupant) {
            content = occupant.player === 'player' ? '🔵' : '🔴';
        }
        
        const clickable = this.canMove && occupant && occupant.player === 'player';
        
        let h = `<div style="padding: 8px; background: ${bgColor}; border: 1px solid var(--border-color); border-radius: 3px; text-align: center; min-height: 35px; display: flex; align-items: center; justify-content: center; ${clickable ? 'cursor: pointer;' : ''}" ${clickable ? `onclick="RoyalGameOfUr.movePieceByPosition(${index})"` : ''}>`;
        h += content;
        h += '</div>';
        
        return h;
    },
    
    movePieceByPosition: function(position) {
        const pieceIdx = this.playerPieces.findIndex(p => p.position === position);
        if(pieceIdx >= 0) {
            this.movePiece(pieceIdx);
        }
    },
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('ur-game-modal');
        if(modal) modal.remove();
    },
    
    showRules: function() {
        let modal = document.getElementById('ur-rules-modal');
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'ur-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        let h = '<div class="game-modal-content" style="max-width: 600px;">';
        h += '<button class="game-modal-close" onclick="document.getElementById(\'ur-rules-modal\').remove()">×</button>';
        h += '<div style="background: var(--bg-card); padding: 20px; border-radius: 8px;">';
        
        h += `<h2 style="margin-bottom: 15px; color: var(--ink-primary);">${t('games.urRulesTitle')}</h2>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.urRulesHistory')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.urRulesHistoryText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.urRulesGoal')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.urRulesGoalText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.urRulesDice')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.urRulesDiceText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.urRulesRosettes')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.urRulesRosettesText')}</p>`;
        
        h += `<h3 style="margin-top: 15px;">${t('games.urRulesCapture')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.urRulesCaptureText')}</p>`;
        
        h += '</div></div>';
        modal.innerHTML = h;
    }
};

// ========== ROYAL GAME OF UR - SOLO PUZZLE ==========

const RoyalGameOfUrSolo = {
    gameActive: false,
     lastMessage: '',
    
    board: [],
    playerPieces: [],
    
    diceRoll: 0,
    canMove: false,
    selectedPiece: null,
    
    rosettes: [3, 7, 13],
    
    stats: {
        finished: 0,
        moves: 0,
        rollsUsed: 0
    },
    
    targets: {
        perfect: 35,
        good: 45,
        ok: 60
    },
    
    start: function() {
        if (!GameState.inventory.ur_board || GameState.inventory.ur_board < 1) {
            this.lastMessage = t('games.urNeedBoard'), true; this.render();
            return;
        }
        
        this.lastMessage = ''; // Clear previous message
        
        this.gameActive = true;
        this.diceRoll = 0;
        this.canMove = false;
        this.selectedPiece = null;
        
        this.playerPieces = [];
        for(let i = 0; i < 7; i++) {
            this.playerPieces.push({ id: i, position: -1 });
        }
        
        this.board = Array(14).fill(null);
        
        this.stats = {
            finished: 0,
            moves: 0,
            rollsUsed: 0
        };
        
        this.render();
    },
    
    rollDice: function() {
        if(!this.gameActive) return;
        if(this.canMove) {
            this.lastMessage = t('games.urErrMoveFirst'), true; this.render();
            return;
        }
        
        let total = 0;
        for(let i = 0; i < 4; i++) {
            total += Math.random() < 0.5 ? 1 : 0;
        }
        
        this.diceRoll = total;
        this.stats.rollsUsed++;
        
        const validMoves = this.getValidMoves();
        if(validMoves.length === 0) {
            if(this.diceRoll === 0) {
                this.lastMessage = t('games.urRollZeroRetry'); this.render();
            } else {
                this.lastMessage = t('games.urErrNoMoves'); this.render();
            }
            this.diceRoll = 0;
        } else {
            this.canMove = true;
            this.lastMessage = t('games.urRollSuccess').replace('{roll}', this.diceRoll); this.render();
        }
        
        this.render();
    },
    
    getValidMoves: function() {
        const valid = [];
        
        this.playerPieces.forEach((piece, idx) => {
            const newPos = this.calculateNewPosition(piece.position, this.diceRoll);
            
            if(newPos !== null && this.isValidMove(piece.position, newPos)) {
                valid.push(idx);
            }
        });
        
        return valid;
    },
    
    calculateNewPosition: function(currentPos, roll) {
        if(roll === 0) return null;
        
        if(currentPos === -1) {
            return roll - 1;
        }
        
        if(currentPos === 20) return null;
        
        let newPos = currentPos + roll;
        
        if(currentPos === 13) {
            if(roll === 1) return 20;
            else return null;
        }
        
        if(newPos > 13 && newPos !== 20) return null;
        
        return newPos;
    },
    
    isValidMove: function(oldPos, newPos) {
        if(newPos === null) return false;
        if(newPos === 20) return true;
        
        const occupant = this.board[newPos];
        if(occupant) return false;
        
        return true;
    },
    
    movePiece: function(pieceIndex) {
        if(!this.canMove) return;
        
        const piece = this.playerPieces[pieceIndex];
        const newPos = this.calculateNewPosition(piece.position, this.diceRoll);
        
        if(!this.isValidMove(piece.position, newPos)) {
            this.lastMessage = t('games.urErrInvalid'), true; this.render();
            return;
        }
        
        this.executeMoveForPiece(pieceIndex, newPos);
        this.stats.moves++;
        
        if(this.rosettes.includes(newPos)) {
            this.lastMessage = t('games.urRosette'); this.render();
            this.canMove = false;
            this.diceRoll = 0;
        } else {
            this.canMove = false;
            this.diceRoll = 0;
        }
        
        this.checkWin();
        this.render();
    },
    
    executeMoveForPiece: function(pieceIndex, newPos) {
        const piece = this.playerPieces[pieceIndex];
        const oldPos = piece.position;
        
        if(oldPos >= 0 && oldPos < 14) {
            this.board[oldPos] = null;
        }
        
        piece.position = newPos;
        
        if(newPos === 20) {
            this.stats.finished++;
        } else {
            this.board[newPos] = { pieceId: pieceIndex };
        }
    },
    
    checkWin: function() {
        if(this.stats.finished === 7) {
            this.gameActive = false;
            
            let reward = 2;
            let gradeKey = 'grade_pass';
            
            if(this.stats.rollsUsed <= this.targets.perfect) {
                reward = 6;
                gradeKey = 'grade_perfect';
            } else if(this.stats.rollsUsed <= this.targets.good) {
                reward = 4;
                gradeKey = 'grade_good';
            } else if(this.stats.rollsUsed <= this.targets.ok) {
                reward = 3;
                gradeKey = 'grade_ok';
            }
            
            const translatedGrade = t('minigames.ur.' + gradeKey);
            
            Game.addItem('research', reward);
            
            if(GameState.achievements) {
                GameState.achievements.stats.urGamesWon++;
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            
            let winMsg = t('games.urWinSolo')
                .replace('{grade}', translatedGrade)
                .replace('{reward}', reward)
                .replace('{rolls}', this.stats.rollsUsed);
            
            this.lastMessage = winMsg; this.render();
            
            setTimeout(() => this.render(), 2000);
        }
    },
    
    render: function() {
        let modal = document.getElementById('ur-solo-modal');
        
        if(!this.gameActive) {
            if(modal) modal.remove();
            return;
        }
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'ur-solo-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content">
                    <button class="game-modal-close" onclick="RoyalGameOfUrSolo.close()">×</button>
                    <div id="ur-solo-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) RoyalGameOfUrSolo.close();
            });
        }
        
        const container = document.getElementById('ur-solo-content');
        if(!container) return;
        
        let h = '<div style="background: var(--bg-card); padding: 15px; border-radius: 8px;">';
        h += `<h3>${t('games.urTitleSolo')}</h3>`;
        
        if(!this.gameActive) {
            h += `<p style="margin: 10px 0;">${t('games.urSubtitleSolo')}</p>`;
            h += `<div style="font-size: 0.85rem; opacity: 0.8; margin: 10px 0;">`;
            h += `<strong>${t('games.urLabelRating')}</strong><br>`;
            h += `${t('games.urRatingPerfect').replace('{target}', this.targets.perfect)}<br>`;
            h += `${t('games.urRatingGood').replace('{target}', this.targets.good)}<br>`;
            h += `${t('games.urRatingOk').replace('{target}', this.targets.ok)}<br>`;
            h += `${t('games.urRatingPass').replace('{target}', this.targets.ok)}`;
            h += `</div>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.start()" style="margin-top: 10px;">${t('games.urBtnPlaySolo')}</button>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUr.start()" style="margin-top: 10px; background: var(--accent-wax);">${t('games.urBtnBackVs')}</button>`;
        } else {
            h += `<div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px;">`;
            h += `<div>${t('games.urLabelFinished')}: ${this.stats.finished}/7</div>`;
            h += `<div>${t('games.urLabelRolls')}: ${this.stats.rollsUsed}</div>`;
            h += `<div>${t('games.urLabelMoves')}: ${this.stats.moves}</div>`;
            h += `</div>`;
            
            if(this.lastMessage) {
                h += `<div style="text-align: center; margin: 10px 0; padding: 10px; background: rgba(197,160,89,0.3); border: 2px solid var(--accent-gold); border-radius: 4px; font-size: 0.95rem; color: var(--ink-primary);">`;
                h += this.lastMessage;
                h += `</div>`;
            }
            
            let targetColor = '#999';
            let targetText = 'OK';
            if(this.stats.rollsUsed <= this.targets.perfect) {
                targetColor = 'gold';
                targetText = t('games.urGradePerfect');
            } else if(this.stats.rollsUsed <= this.targets.good) {
                targetColor = '#4ade80';
                targetText = t('games.urGradeGood');
            } else if(this.stats.rollsUsed <= this.targets.ok) {
                targetColor = '#60a5fa';
                targetText = t('games.urGradeOk');
            } else {
                targetText = t('games.urGradePass');
            }
            
            h += `<div style="text-align: center; margin: 5px 0; padding: 5px; background: ${targetColor}; color: white; border-radius: 4px; font-size: 0.85rem; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">`;
            h += t('games.urLabelPace').replace('{grade}', targetText);
            h += `</div>`;
            
            if(!this.canMove) {
                h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.rollDice()" style="margin: 10px 0; width: 100%;">${t('games.urBtnRoll')}</button>`;
            } else if(this.diceRoll > 0) {
                h += `<div style="text-align: center; margin: 10px 0; padding: 10px; background: gold; color: black; border-radius: 4px; font-size: 1.2rem;">`;
                h += t('games.urLabelRoll').replace('{roll}', this.diceRoll);
                h += `</div>`;
            }
            
            h += this.renderBoard();
            
            const offBoard = this.playerPieces.filter(p => p.position === -1);
            if(offBoard.length > 0 && this.canMove) {
                h += `<div style="margin-top: 15px;">`;
                h += `<strong>${t('games.urLabelOffboardSolo').replace('{count}', offBoard.length)}</strong>`;
                h += `<div style="display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap;">`;
                offBoard.forEach(piece => {
                    h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.movePiece(${piece.id})" style="padding: 8px;">`;
                    h += `🔵${piece.id + 1}`;
                    h += `</button>`;
                });
                h += `</div></div>`;
            }
        }
        
        h += '</div>';
        container.innerHTML = h;
    },
    
    renderBoard: function() {
        let h = '<div style="margin: 15px 0;">';
        h += `<strong style="display: block; margin-bottom: 5px;">${t('games.urLabelTrack')}</strong>`;
        h += '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; font-size: 0.8rem;">';
        
        for(let i = 0; i < 7; i++) {
            h += this.renderSquare(i);
        }
        
        for(let i = 7; i <= 13; i++) {
            h += this.renderSquare(i);
        }
        
        h += '</div></div>';
        return h;
    },
    
    renderSquare: function(index) {
        const isRosette = this.rosettes.includes(index);
        const occupant = this.board[index];
        
        let bgColor = 'rgba(139,100,52,0.2)';
        if(isRosette) bgColor = 'rgba(197,160,89,0.3)';
        
        let content = isRosette ? '✿' : index;
        if(occupant) {
            content = '🔵';
        }
        
        const clickable = this.canMove && occupant;
        
        let h = `<div style="padding: 10px; background: ${bgColor}; border: 1px solid var(--border-color); border-radius: 3px; text-align: center; min-height: 40px; display: flex; align-items: center; justify-content: center; ${clickable ? 'cursor: pointer;' : ''}" ${clickable ? `onclick="RoyalGameOfUrSolo.movePieceByPosition(${index})"` : ''}>`;
        h += content;
        h += '</div>';
        
        return h;
    },
    
    movePieceByPosition: function(position) {
        const pieceIdx = this.playerPieces.findIndex(p => p.position === position);
        if(pieceIdx >= 0) {
            this.movePiece(pieceIdx);
        }
    },
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('ur-solo-modal');
        if(modal) modal.remove();
    }
};