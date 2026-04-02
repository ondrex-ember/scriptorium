const RoyalGameOfUr = {
    gameActive: false,
    mode: 'ai',
    
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
            UI.notify("❌ Potřebuješ Královskou Desku z Uru!", true);
            return;
        }
        
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
            UI.notify("❌ Nejprve proveď tah!", true);
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
                    UI.notify("💀 Hod 0 - přeskakuješ!");
                } else {
                    UI.notify("❌ Žádné platné tahy!");
                }
                setTimeout(() => this.endTurn(), 1500);
            } else {
                this.canMove = true;
                UI.notify(`🎲 Hodil jsi ${this.diceRoll}! Vyber žeton.`);
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
            UI.notify("❌ Neplatný tah!", true);
            return;
        }
        
        this.executeMoveForPlayer(pieceIndex, newPos, 'player');
        
        if(this.rosettes.includes(newPos)) {
            UI.notify("✨ Roseta! Hraj znovu!");
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
                UI.notify(`⚔️ Vyhodil jsi soupeře!`);
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
                UI.notify("🤖 AI hodil 0");
            } else {
                UI.notify("🤖 AI nemůže táhnout");
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
            
            UI.notify(`🤖 AI táhl na pole ${newPos}`);
            
            if(this.rosettes.includes(newPos)) {
                UI.notify("✨ AI trefil rosetu!");
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
            
            // Track stats
            if(GameState.achievements) {
                GameState.achievements.stats.urGamesWon++;
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            
            UI.notify(`🏆 VÝHRA! +${reward} Research`);
            setTimeout(() => this.render(), 2000);
        } else if(this.stats.aiFinished === 7) {
            this.gameActive = false;
            
            // Track played (even if lost)
            if(GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
            }
            
            UI.notify(`💀 Prohra! AI vyhrál.`);
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
        h += '<h3>🎲 Královská Hra z Uru (2600 př.n.l.)</h3>';
        
        if(!this.gameActive) {
            h += `<p style="margin: 10px 0;">Nejstarší desková hra světa!</p>`;
            h += `<p style="font-size: 0.9rem; opacity: 0.8;">Závoď s AI, kdo první dostane 7 žetonů do cíle.</p>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUr.start()" style="margin-top: 10px;">Hrát vs AI 🎮</button>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.start()" style="margin-top: 10px; background: var(--accent-gold);">Solo Puzzle 🧩</button>`;
        } else {
            h += `<div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px;">`;
            h += `<div>Ty: ${this.stats.playerFinished}/7</div>`;
            h += `<div>Tahy: ${this.stats.moves}</div>`;
            h += `<div>AI: ${this.stats.aiFinished}/7</div>`;
            h += `</div>`;
            
            if(this.currentTurn === 'player' && !this.canMove) {
                h += `<button class="craft-btn" onclick="RoyalGameOfUr.rollDice()" style="margin: 10px 0; width: 100%;">🎲 Hodit kostky</button>`;
            } else if(this.diceRoll > 0) {
                h += `<div style="text-align: center; margin: 10px 0; padding: 10px; background: gold; border-radius: 4px; font-size: 1.2rem;">`;
                h += `🎲 Hod: ${this.diceRoll}`;
                h += `</div>`;
            }
            
            h += this.renderBoard();
            
            const playerOffBoard = this.playerPieces.filter(p => p.position === -1);
            if(playerOffBoard.length > 0 && this.canMove) {
                h += `<div style="margin-top: 15px;">`;
                h += `<strong>Tvé žetony mimo desku (${playerOffBoard.length}):</strong>`;
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
    }
,
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('ur-game-modal');
        if(modal) modal.remove();
    }
};

// ========== ROYAL GAME OF UR - SOLO PUZZLE ==========

const RoyalGameOfUrSolo = {
    gameActive: false,
    
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
            UI.notify("❌ Potřebuješ Královskou Desku z Uru!", true);
            return;
        }
        
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
            UI.notify("❌ Nejprve proveď tah!", true);
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
                UI.notify("💀 Hod 0 - zkus znovu!");
            } else {
                UI.notify("❌ Žádné platné tahy!");
            }
            this.diceRoll = 0;
        } else {
            this.canMove = true;
            UI.notify(`🎲 Hodil jsi ${this.diceRoll}! Vyber žeton.`);
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
            UI.notify("❌ Neplatný tah!", true);
            return;
        }
        
        this.executeMoveForPiece(pieceIndex, newPos);
        this.stats.moves++;
        
        if(this.rosettes.includes(newPos)) {
            UI.notify("✨ Roseta! Hraj znovu!");
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
            let grade = 'OK';
            
            if(this.stats.rollsUsed <= this.targets.perfect) {
                reward = 6;
                grade = 'PERFEKTNÍ';
            } else if(this.stats.rollsUsed <= this.targets.good) {
                reward = 4;
                grade = 'VÝBORNÝ';
            } else if(this.stats.rollsUsed <= this.targets.ok) {
                reward = 3;
                grade = 'DOBRÝ';
            }
            
            Game.addItem('research', reward);
            
            // Track stats (solo puzzle counts as Ur game)
            if(GameState.achievements) {
                GameState.achievements.stats.urGamesWon++;
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            
            UI.notify(`🏆 ${grade}! +${reward} Research (${this.stats.rollsUsed} hodů)`);
            
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
        h += '<h3>🧩 Královská Hra z Uru - Solo Puzzle</h3>';
        
        if(!this.gameActive) {
            h += `<p style="margin: 10px 0;">Dostaň všech 7 žetonů do cíle!</p>`;
            h += `<div style="font-size: 0.85rem; opacity: 0.8; margin: 10px 0;">`;
            h += `<strong>Hodnocení:</strong><br>`;
            h += `🏆 Perfektní: ≤${this.targets.perfect} hodů (6 Research)<br>`;
            h += `⭐ Výborný: ≤${this.targets.good} hodů (4 Research)<br>`;
            h += `✓ Dobrý: ≤${this.targets.ok} hodů (3 Research)<br>`;
            h += `○ OK: ${this.targets.ok}+ hodů (2 Research)`;
            h += `</div>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.start()" style="margin-top: 10px;">Hrát Solo 🧩</button>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUr.start()" style="margin-top: 10px; background: var(--accent-wax);">Zpět na VS AI 🤖</button>`;
        } else {
            h += `<div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px;">`;
            h += `<div>Dokončeno: ${this.stats.finished}/7</div>`;
            h += `<div>Hody: ${this.stats.rollsUsed}</div>`;
            h += `<div>Tahy: ${this.stats.moves}</div>`;
            h += `</div>`;
            
            let targetColor = '#999';
            let targetText = 'OK';
            if(this.stats.rollsUsed <= this.targets.perfect) {
                targetColor = 'gold';
                targetText = 'PERFEKTNÍ';
            } else if(this.stats.rollsUsed <= this.targets.good) {
                targetColor = '#4ade80';
                targetText = 'VÝBORNÝ';
            } else if(this.stats.rollsUsed <= this.targets.ok) {
                targetColor = '#60a5fa';
                targetText = 'DOBRÝ';
            }
            
            h += `<div style="text-align: center; margin: 5px 0; padding: 5px; background: ${targetColor}; color: white; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">`;
            h += `Aktuální tempo: ${targetText}`;
            h += `</div>`;
            
            if(!this.canMove) {
                h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.rollDice()" style="margin: 10px 0; width: 100%;">🎲 Hodit kostky</button>`;
            } else if(this.diceRoll > 0) {
                h += `<div style="text-align: center; margin: 10px 0; padding: 10px; background: gold; border-radius: 4px; font-size: 1.2rem;">`;
                h += `🎲 Hod: ${this.diceRoll}`;
                h += `</div>`;
            }
            
            h += this.renderBoard();
            
            const offBoard = this.playerPieces.filter(p => p.position === -1);
            if(offBoard.length > 0 && this.canMove) {
                h += `<div style="margin-top: 15px;">`;
                h += `<strong>Žetony mimo desku (${offBoard.length}):</strong>`;
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
        h += '<strong style="display: block; margin-bottom: 5px;">Herní dráha:</strong>';
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
    }
,
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('ur-solo-modal');
        if(modal) modal.remove();
    }
};

// ========== KARNÖFFEL GAME ==========

