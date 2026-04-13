const Rithmomachia = {
    gameActive: false,
    
    // Board state (8×8)
    board: [],
    
    // Pieces
    whitePieces: [],
    blackPieces: [],
    
    currentTurn: 'white',
    selectedPiece: null,
    validMoves: [],
    
    // Victory tracking
    points: {
        white: 0,
        black: 0
    },
    
    captured: {
        white: [],
        black: []
    },
    
    // Simplified piece setup
    pieceTypes: {
        circle: { symbol: '○', movement: 1, shape: 'orthogonal' },
        triangle: { symbol: '△', movement: 2, shape: 'diagonal' },
        square: { symbol: '□', movement: 3, shape: 'any' }
    },
    
    // Starting positions (simplified)
    startingSetup: {
        white: [
            // Row 0 (back)
            { type: 'square', value: 4, pos: [1, 0] },
            { type: 'triangle', value: 9, pos: [2, 0] },
            { type: 'square', value: 9, pos: [3, 0] },
            { type: 'triangle', value: 16, pos: [4, 0] },
            { type: 'square', value: 16, pos: [5, 0] },
            
            // Row 1 (front)
            { type: 'circle', value: 2, pos: [0, 1] },
            { type: 'circle', value: 4, pos: [1, 1] },
            { type: 'circle', value: 6, pos: [2, 1] },
            { type: 'circle', value: 8, pos: [3, 1] },
            { type: 'circle', value: 10, pos: [4, 1] },
            { type: 'circle', value: 12, pos: [5, 1] },
            { type: 'circle', value: 14, pos: [6, 1] }
        ],
        black: [
            // Row 7 (back)
            { type: 'square', value: 1, pos: [1, 7] },
            { type: 'triangle', value: 9, pos: [2, 7] },
            { type: 'square', value: 4, pos: [3, 7] },
            { type: 'triangle', value: 25, pos: [4, 7] },
            { type: 'square', value: 9, pos: [5, 7] },
            
            // Row 6 (front)
            { type: 'circle', value: 1, pos: [0, 6] },
            { type: 'circle', value: 3, pos: [1, 6] },
            { type: 'circle', value: 5, pos: [2, 6] },
            { type: 'circle', value: 7, pos: [3, 6] },
            { type: 'circle', value: 9, pos: [4, 6] },
            { type: 'circle', value: 11, pos: [5, 6] },
            { type: 'circle', value: 13, pos: [6, 6] }
        ]
    },
    
    // ========== INITIALIZATION ==========
    
    start: function() {
        if (!GameState.inventory.rithmomachia_board || GameState.inventory.rithmomachia_board < 1) {
            UI.notify(t('games.rithmoNeedBoard'), true);
            return;
        }
        
        this.gameActive = true;
        this.currentTurn = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        
        // Initialize board (8×8)
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Setup pieces
        this.whitePieces = JSON.parse(JSON.stringify(this.startingSetup.white));
        this.blackPieces = JSON.parse(JSON.stringify(this.startingSetup.black));
        
        // Add IDs
        this.whitePieces.forEach((p, i) => { p.id = i; p.player = 'white'; });
        this.blackPieces.forEach((p, i) => { p.id = i; p.player = 'black'; });
        
        // Place on board
        this.whitePieces.forEach(p => {
            this.board[p.pos[1]][p.pos[0]] = p;
        });
        this.blackPieces.forEach(p => {
            this.board[p.pos[1]][p.pos[0]] = p;
        });
        
        // Reset tracking
        this.points = { white: 0, black: 0 };
        this.captured = { white: [], black: [] };
        
        this.render();
        this.showTutorial();
    },
    
    showTutorial: function() {
        UI.notify(t('games.rithmoTutMsg'));
    },
    
    // ========== PIECE SELECTION ==========
    
    selectPiece: function(x, y) {
        if (!this.gameActive) return;
        if (this.currentTurn !== 'white') return; // Only player turn
        
        const piece = this.board[y][x];
        
        if (!piece) {
            // Clicked empty square - try to move if piece selected
            if (this.selectedPiece) {
                this.attemptMove(x, y);
            }
            return;
        }
        
        if (piece.player !== 'white') {
            UI.notify(t('games.rithmoErrNotYours'), true);
            return;
        }
        
        // Select piece
        this.selectedPiece = piece;
        this.validMoves = this.calculateValidMoves(piece);
        this.render();
        
        if (this.validMoves.length === 0) {
            UI.notify(t('games.rithmoErrNoMove'), true);
        }
    },
    
    // ========== MOVEMENT CALCULATION ==========
    
    calculateValidMoves: function(piece) {
        const moves = [];
        const [px, py] = piece.pos;
        const pieceInfo = this.pieceTypes[piece.type];
        const range = pieceInfo.movement;
        
        if (pieceInfo.shape === 'orthogonal') {
            // Circle: N, S, E, W
            const dirs = [[0, -1], [0, 1], [1, 0], [-1, 0]];
            dirs.forEach(([dx, dy]) => {
                for (let i = 1; i <= range; i++) {
                    const nx = px + dx * i;
                    const ny = py + dy * i;
                    if (this.isValidPosition(nx, ny)) {
                        const target = this.board[ny][nx];
                        if (!target) {
                            moves.push([nx, ny]);
                        } else {
                            break; // Blocked
                        }
                    }
                }
            });
        } else if (pieceInfo.shape === 'diagonal') {
            // Triangle: diagonals
            const dirs = [[1, -1], [1, 1], [-1, -1], [-1, 1]];
            dirs.forEach(([dx, dy]) => {
                for (let i = 1; i <= range; i++) {
                    const nx = px + dx * i;
                    const ny = py + dy * i;
                    if (this.isValidPosition(nx, ny)) {
                        const target = this.board[ny][nx];
                        if (!target) {
                            moves.push([nx, ny]);
                        } else {
                            break;
                        }
                    }
                }
            });
        } else {
            // Square: any direction
            const dirs = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [1, 1], [-1, -1], [-1, 1]];
            dirs.forEach(([dx, dy]) => {
                for (let i = 1; i <= range; i++) {
                    const nx = px + dx * i;
                    const ny = py + dy * i;
                    if (this.isValidPosition(nx, ny)) {
                        const target = this.board[ny][nx];
                        if (!target) {
                            moves.push([nx, ny]);
                        } else {
                            break;
                        }
                    }
                }
            });
        }
        
        return moves;
    },
    
    isValidPosition: function(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    },
    
    // ========== MOVEMENT EXECUTION ==========
    
    attemptMove: function(x, y) {
        if (!this.selectedPiece) return;
        
        // Check if valid move
        const isValid = this.validMoves.some(([mx, my]) => mx === x && my === y);
        if (!isValid) {
            UI.notify(t('games.rithmoErrInvalid'), true);
            return;
        }
        
        // Execute move
        const [oldX, oldY] = this.selectedPiece.pos;
        this.board[oldY][oldX] = null;
        this.board[y][x] = this.selectedPiece;
        this.selectedPiece.pos = [x, y];
        
        // Check for captures after move
        this.checkCaptures(this.selectedPiece);
        
        this.selectedPiece = null;
        this.validMoves = [];
        
        // Check victory
        if (this.checkVictory()) return;
        
        // AI turn
        this.endTurn();
    },
    
    // ========== CAPTURE MECHANICS ==========
    
    checkCaptures: function(piece) {
        // Simplified capture: Adjacent enemies that sum to piece value
        const [px, py] = piece.pos;
        const dirs = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [1, 1], [-1, -1], [-1, 1]];
        
        const adjacentEnemies = [];
        dirs.forEach(([dx, dy]) => {
            const nx = px + dx;
            const ny = py + dy;
            if (this.isValidPosition(nx, ny)) {
                const target = this.board[ny][nx];
                if (target && target.player !== piece.player) {
                    adjacentEnemies.push(target);
                }
            }
        });
        
        // Try to capture by summing adjacent friendly pieces
        adjacentEnemies.forEach(enemy => {
            let sum = piece.value;
            
            // Add other adjacent friendly pieces
            dirs.forEach(([dx, dy]) => {
                const nx = px + dx;
                const ny = py + dy;
                if (this.isValidPosition(nx, ny)) {
                    const ally = this.board[ny][nx];
                    if (ally && ally.player === piece.player && ally !== piece) {
                        sum += ally.value;
                    }
                }
            });
            
            // If sum equals enemy value, capture!
            if (sum === enemy.value) {
                this.capturePiece(enemy);
            }
        });
    },
    
    capturePiece: function(piece) {
        const [x, y] = piece.pos;
        this.board[y][x] = null;
        
        if (piece.player === 'white') {
            const idx = this.whitePieces.findIndex(p => p.id === piece.id);
            if (idx >= 0) {
                this.whitePieces.splice(idx, 1);
                this.captured.black.push(piece);
                this.points.black += piece.value;
            }
        } else {
            const idx = this.blackPieces.findIndex(p => p.id === piece.id);
            if (idx >= 0) {
                this.blackPieces.splice(idx, 1);
                this.captured.white.push(piece);
                this.points.white += piece.value;
            }
        }
        
        UI.notify(t('games.rithmoCapture').replace('{value}', piece.value));
    },
    
    // ========== AI OPPONENT ==========
    
    aiTurn: function() {
        if (!this.gameActive) return;
        
        // Simple greedy AI
        let bestMove = null;
        let bestScore = -Infinity;
        
        this.blackPieces.forEach(piece => {
            const moves = this.calculateValidMoves(piece);
            moves.forEach(([x, y]) => {
                let score = 0;
                
                // Prefer forward movement
                score += (7 - y) * 2;
                
                // Prefer capturing triangles
                if (piece.type === 'triangle') score += 10;
                
                // Random factor
                score += Math.random() * 5;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { piece, x, y };
                }
            });
        });
        
        if (bestMove) {
            const { piece, x, y } = bestMove;
            const [oldX, oldY] = piece.pos;
            this.board[oldY][oldX] = null;
            this.board[y][x] = piece;
            piece.pos = [x, y];
            
            this.checkCaptures(piece);
            UI.notify(t('games.rithmoAiMove').replace('{type}', piece.type).replace('{x}', x).replace('{y}', y));
        }
        
        this.checkVictory();
        this.endTurn();
    },
    
    endTurn: function() {
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.render();
        
        if (this.currentTurn === 'black') {
            setTimeout(() => this.aiTurn(), 1000);
        }
    },
    
    // ========== VICTORY CONDITIONS ==========
    
    checkVictory: function() {
        // Condition 1: Captured all enemy triangles
        const whiteTriangles = this.whitePieces.filter(p => p.type === 'triangle').length;
        const blackTriangles = this.blackPieces.filter(p => p.type === 'triangle').length;
        
        if (whiteTriangles === 0) {
            this.endGame('black', t('games.rithmoWinWhitePyr'));
            return true;
        }
        
        if (blackTriangles === 0) {
            this.endGame('white', t('games.rithmoWinBlackPyr'));
            return true;
        }
        
        // Condition 2: Reached 100 points
        if (this.points.white >= 100) {
            this.endGame('white', t('games.rithmoWinPoints'));
            return true;
        }
        
        if (this.points.black >= 100) {
            this.endGame('black', t('games.rithmoWinPoints'));
            return true;
        }
        
        return false;
    },
    
    endGame: function(winner, reason) {
        this.gameActive = false;
        
        if (winner === 'white') {
            const reward = 8;
            Game.addItem('research', reward);
            
            // Track stats
            if(GameState.achievements) {
                GameState.achievements.stats.rithmoGamesWon++;
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            
            UI.notify(t('games.rithmoWin').replace('{reason}', reason).replace('{reward}', reward));
        } else {
            // Track played (even if lost)
            if(GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
            }
            
            UI.notify(t('games.rithmoLoss').replace('{reason}', reason));
        }
        
        setTimeout(() => this.render(), 2000);
    },
    
    // ========== RENDERING ==========
    
    render: function() {
        let modal = document.getElementById('rithmomachia-modal');
        
        if(!this.gameActive) {
            if(modal) modal.remove();
            return;
        }
        
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'rithmomachia-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content">
                    <button class="game-modal-close" onclick="Rithmomachia.close()">×</button>
                    <div id="rithmomachia-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if(e.target === modal) Rithmomachia.close();
            });
        }
        
        const container = document.getElementById('rithmomachia-content');
        if (!container) return;
        
        let h = '<div style="background: var(--bg-card); padding: 15px; border-radius: 8px;">';
        h += `<h3>${t('games.rithmoTitle')}</h3>`;
        
        if (!this.gameActive) {
            h += `<p style="margin: 10px 0;">${t('games.rithmoSubtitle')}</p>`;
            h += `<p style="font-size: 0.9rem; opacity: 0.8; margin: 10px 0;">`;
            h += t('games.rithmoVictoryCond');
            h += `</p>`;
            h += `<button class="craft-btn" onclick="Rithmomachia.start()" style="margin-top: 10px;">${t('games.rithmoBtnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="Rithmomachia.showRules()" style="margin-top: 10px; background: var(--accent-gold);">${t('games.rithmoBtnRules')}</button>`;
        } else {
            // Score
            h += `<div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px; font-size: 0.9rem;">`;
            h += `<div>${t('games.rithmoLabelYou')}: ${this.points.white} ${t('games.rithmoLabelPoints')}</div>`;
            h += `<div>${this.currentTurn === 'white' ? t('games.rithmoLabelYourTurn') : t('games.rithmoLabelAiTurn')}</div>`;
            h += `<div>${t('games.rithmoLabelAi')}: ${this.points.black} ${t('games.rithmoLabelPoints')}</div>`;
            h += `</div>`;
            
            // Board
            h += this.renderBoard();
            
            // Legend
            h += `<div style="margin-top: 10px; font-size: 0.85rem; opacity: 0.8;">`;
            h += t('games.rithmoLegend');
            h += `</div>`;
        }
        
        h += '</div>';
        container.innerHTML = h;
    },
    
    renderBoard: function() {
        const isMobile = window.innerWidth <= 500;
        const cellMin = isMobile ? 36 : 45;
        const pieceSize = isMobile ? 26 : 35;
        const pieceFontSize = isMobile ? '0.55rem' : '0.7rem';
        const symbolSize = isMobile ? '0.75rem' : '1rem';
        const maxW = isMobile ? '310px' : '400px';
        let h = '<div style="margin: 15px 0;">';
        h += `<div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; max-width: ${maxW}; margin: 0 auto;">`;
        
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                h += this.renderSquare(x, y);
            }
        }
        
        h += '</div></div>';
        return h;
    },
    
    renderSquare: function(x, y) {
        const isMobile = window.innerWidth <= 500;
        const cellMin = isMobile ? 36 : 45;
        const pieceSize = isMobile ? 26 : 35;
        const pieceFontSize = isMobile ? '0.55rem' : '0.7rem';
        const symbolSize = isMobile ? '0.75rem' : '1rem';
        const piece = this.board[y][x];
        const isSelected = this.selectedPiece && this.selectedPiece.pos[0] === x && this.selectedPiece.pos[1] === y;
        const isValidMove = this.validMoves.some(([mx, my]) => mx === x && my === y);
        
        let bgColor = (x + y) % 2 === 0 ? 'rgba(139,100,52,0.2)' : 'rgba(92,77,60,0.1)';
        if (isSelected) bgColor = 'gold';
        if (isValidMove) bgColor = 'rgba(76,175,80,0.3)';
        
        let content = '';
        if (piece) {
            const symbol = this.pieceTypes[piece.type].symbol;
            const color = piece.player === 'white' ? '#fff' : '#000';
            const textColor = piece.player === 'white' ? '#000' : '#fff';
            content = `<div style="background: ${color}; color: ${textColor}; border-radius: 50%; width: ${pieceSize}px; height: ${pieceSize}px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: ${pieceFontSize}; border: 1px solid var(--border-color);">`;
            content += `<div style="font-size: ${symbolSize};">${symbol}</div>`;
            content += `<div style="font-size: ${pieceFontSize};">${piece.value}</div>`;
            content += `</div>`;
        }
        
        let h = `<div style="padding: 3px; background: ${bgColor}; border: 1px solid var(--border-color); min-height: ${cellMin}px; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="Rithmomachia.selectPiece(${x}, ${y})">`;
        h += content;
        h += '</div>';
        
        return h;
    },
    
    showRules: function() {
        let modal = document.getElementById('rithmomachia-rules-modal');

        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'rithmomachia-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if(e.target === modal) modal.remove();
            });
        }

        let h = '<div class="game-modal-content" style="max-width: 600px;">';
        h += '<button class="game-modal-close" onclick="document.getElementById(\'rithmomachia-rules-modal\').remove()">×</button>';
        h += '<div style="background: var(--bg-card); padding: 20px; border-radius: 8px;">';

        h += `<h2 style="margin-bottom: 15px; color: var(--ink-primary);">${t('games.rithmoRulesTitle')}</h2>`;

        h += `<h3 style="margin-top: 15px;">${t('games.rithmoRulesMovementTitle')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.rithmoRulesMovementText')}</p>`;

        h += `<h3 style="margin-top: 15px;">${t('games.rithmoRulesCaptureTitle')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.rithmoRulesCaptureText')}</p>`;

        h += `<h3 style="margin-top: 15px;">${t('games.rithmoRulesVictoryTitle')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.rithmoRulesVictoryText')}</p>`;

        h += `<h3 style="margin-top: 15px;">${t('games.rithmoRulesHistoryTitle')}</h3>`;
        h += `<p style="opacity: 0.9;">${t('games.rithmoRulesHistoryText')}</p>`;

        h += '</div></div>';
        modal.innerHTML = h;
    }
,
    
    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('rithmomachia-modal');
        if(modal) modal.remove();
    }
};