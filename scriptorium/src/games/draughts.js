// ═══════════════════════════════════════════════════════════════════════════════
// DÁMA (DRAUGHTS) — Z arabského Alquerque (10. stol.)
// 8×8 deska, 12 kamenů každý, diagonální pohyb, povinné skákání.
// AI: 3 úrovně — náhodná / greedy / minimax (hloubka 4)
// ═══════════════════════════════════════════════════════════════════════════════

const DraughtsGame = {
    gameActive: false,
    currentTurn: 'player', // 'player' (bílý, jde nahoru) | 'ai' (černý, jde dolů)
    selectedCell: null,
    mustJump: false,       // povinné skákání
    lastMessage: '',
    difficulty: 1,         // 1=náhodná, 2=greedy, 3=minimax
    playerCaptured: 0,
    aiCaptured: 0,

    // board[row][col]: null | { owner:'player'|'ai', king:bool }
    board: [],

    ROWS: 8,
    COLS: 8,

    start: function(difficulty) {
        if (!GameState.inventory.draughts_board || GameState.inventory.draughts_board < 1) {
            UI.notify(t('games.draughtsNeedBoard'), true);
            return;
        }
        this.difficulty = difficulty || 1;
        this.gameActive = true;
        this.currentTurn = 'player';
        this.selectedCell = null;
        this.mustJump = false;
        this.lastMessage = t('games.draughtsLabelYourTurn');
        this.playerCaptured = 0;
        this.aiCaptured = 0;
        this.initBoard();
        this.render();
    },

    initBoard: function() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        // AI (černý) — horní 3 řady (řady 0–2)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) {
                    this.board[r][c] = { owner: 'ai', king: false };
                }
            }
        }
        // Hráč (bílý) — dolní 3 řady (řady 5–7)
        for (let r = 5; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) {
                    this.board[r][c] = { owner: 'player', king: false };
                }
            }
        }
    },

    // ── Pohyb hráče ───────────────────────────────────────────────────────────
    selectCell: function(row, col) {
        if (!this.gameActive || this.currentTurn !== 'player') return;
        const cell = this.board[row][col];

        if (this.selectedCell) {
            const [sr, sc] = this.selectedCell;
            if (row === sr && col === sc) {
                this.selectedCell = null;
                this.render();
                return;
            }
            // Pokus o tah
            const moves = this.getMovesFor(sr, sc);
            const move = moves.find(m => m.toR === row && m.toC === col);
            if (move) {
                this.executeMove(move, 'player');
                return;
            }
        }

        // Výběr kamene
        if (cell && cell.owner === 'player') {
            // Pokud je povinné skákání, vyber jen kameny co mohou skákat
            const jumps = this.getAllJumps('player');
            if (jumps.length > 0 && !jumps.some(m => m.fromR === row && m.fromC === col)) {
                this.lastMessage = '⚠️ Musíš skočit! Vyber jiný kámen.';
                this.render();
                return;
            }
            this.selectedCell = [row, col];
        }
        this.render();
    },

    executeMove: function(move, side) {
        const { fromR, fromC, toR, toC, captures } = move;
        const piece = this.board[fromR][fromC];

        this.board[toR][toC] = piece;
        this.board[fromR][fromC] = null;

        // Odeber zajmuté kameny
        if (captures) {
            captures.forEach(([cr, cc]) => {
                this.board[cr][cc] = null;
                if (side === 'player') this.playerCaptured++;
                else this.aiCaptured++;
            });
        }

        // Povýšení na dámu
        if (side === 'player' && toR === 0) {
            piece.king = true;
            this.lastMessage = t('games.draughtsPromoted');
        }
        if (side === 'ai' && toR === 7) {
            piece.king = true;
        }

        this.selectedCell = null;

        // Vícenásobné skákání — pokud je možné, hráč pokračuje stejným kamenem
        if (captures && captures.length > 0) {
            const furtherJumps = this.getJumpsFor(toR, toC, side).filter(m => m.captures && m.captures.length > 0);
            if (furtherJumps.length > 0 && side === 'player') {
                this.selectedCell = [toR, toC];
                this.mustJump = true;
                this.lastMessage = '⚔️ Další skok možný!';
                this.render();
                return;
            }
        }

        this.mustJump = false;
        this.checkWin(side);
        if (!this.gameActive) { this.render(); return; }
        this.endTurn(side);
    },

    endTurn: function(side) {
        if (side === 'player') {
            this.currentTurn = 'ai';
            this.lastMessage = t('games.draughtsLabelAiTurn');
            this.render();
            setTimeout(() => this.aiTurn(), 600);
        } else {
            this.currentTurn = 'player';
            this.lastMessage = t('games.draughtsLabelYourTurn');
            this.render();
        }
    },

    // ── Tahy ─────────────────────────────────────────────────────────────────
    getMovesFor: function(row, col) {
        // Povinné skákání — pokud existuje skok, vrať pouze skoky
        const jumps = this.getAllJumps('player');
        if (jumps.length > 0) {
            return jumps.filter(m => m.fromR === row && m.fromC === col);
        }
        return this.getSimpleMovesFor(row, col, 'player');
    },

    getSimpleMovesFor: function(row, col, side) {
        const piece = this.board[row][col];
        if (!piece) return [];
        const dirs = this.getDirs(piece);
        const moves = [];
        dirs.forEach(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            if (this.inBounds(nr, nc) && !this.board[nr][nc]) {
                moves.push({ fromR: row, fromC: col, toR: nr, toC: nc, captures: [] });
            }
        });
        return moves;
    },

    getJumpsFor: function(row, col, side) {
        const piece = this.board[row][col];
        if (!piece) return [];
        const opp = side === 'player' ? 'ai' : 'player';
        const dirs = this.getDirs(piece);
        const jumps = [];
        dirs.forEach(([dr, dc]) => {
            const mr = row + dr, mc = col + dc;   // mid (soupeřův kámen)
            const jr = row + dr*2, jc = col + dc*2; // jump cíl
            if (this.inBounds(jr, jc) && this.board[mr] && this.board[mr][mc] &&
                this.board[mr][mc].owner === opp && !this.board[jr][jc]) {
                jumps.push({ fromR: row, fromC: col, toR: jr, toC: jc, captures: [[mr, mc]] });
            }
        });
        return jumps;
    },

    getAllJumps: function(side) {
        const jumps = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.owner === side) {
                    jumps.push(...this.getJumpsFor(r, c, side));
                }
            }
        }
        return jumps;
    },

    getAllMoves: function(side) {
        const jumps = this.getAllJumps(side);
        if (jumps.length > 0) return jumps;
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.owner === side) {
                    moves.push(...this.getSimpleMovesFor(r, c, side));
                }
            }
        }
        return moves;
    },

    getDirs: function(piece) {
        if (piece.king) return [[-1,-1],[-1,1],[1,-1],[1,1]];
        return piece.owner === 'player' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
    },

    inBounds: function(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    },

    // ── Výhra ─────────────────────────────────────────────────────────────────
    checkWin: function(lastSide) {
        const playerMoves = this.getAllMoves('player');
        const aiMoves = this.getAllMoves('ai');

        const playerPieces = this.countPieces('player');
        const aiPieces = this.countPieces('ai');

        if (aiPieces === 0 || (lastSide === 'player' && aiMoves.length === 0)) {
            this.endGame('player');
        } else if (playerPieces === 0 || (lastSide === 'ai' && playerMoves.length === 0)) {
            this.endGame('ai');
        }
    },

    countPieces: function(side) {
        let count = 0;
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++)
                if (this.board[r][c] && this.board[r][c].owner === side) count++;
        return count;
    },

    endGame: function(winner) {
        this.gameActive = false;
        const reward = 4;
        if (winner === 'player') {
            Game.addItem('research', reward);
            if (GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            this.lastMessage = t('games.draughtsWin').replace('{reward}', reward);
            UI.notify(this.lastMessage);
        } else {
            if (GameState.achievements) GameState.achievements.stats.totalGamesPlayed++;
            this.lastMessage = t('games.draughtsLoss');
            UI.notify(this.lastMessage, true);
        }
        Game.save();
    },

    // ── AI ────────────────────────────────────────────────────────────────────
    aiTurn: function() {
        if (!this.gameActive || this.currentTurn !== 'ai') return;

        const moves = this.getAllMoves('ai');
        if (moves.length === 0) { this.endGame('player'); this.render(); return; }

        let chosen;
        if (this.difficulty === 1) {
            chosen = moves[Math.floor(Math.random() * moves.length)];
        } else if (this.difficulty === 2) {
            // Greedy — maximalizuje počet zajmutých kamenů
            moves.sort((a, b) => (b.captures ? b.captures.length : 0) - (a.captures ? a.captures.length : 0));
            chosen = moves[0];
        } else {
            // Minimax hloubka 4
            chosen = this.minimaxMove();
        }

        this.executeMove(chosen, 'ai');
    },

    minimaxMove: function() {
        const moves = this.getAllMoves('ai');
        let best = null, bestScore = -Infinity;
        moves.forEach(move => {
            const saved = this.applyTempMove(move, 'ai');
            const score = this.minimax(3, false, -Infinity, Infinity);
            this.undoTempMove(saved);
            if (score > bestScore) { bestScore = score; best = move; }
        });
        return best || moves[0];
    },

    minimax: function(depth, isMax, alpha, beta) {
        if (depth === 0) return this.evaluate();
        const side = isMax ? 'ai' : 'player';
        const moves = this.getAllMoves(side);
        if (moves.length === 0) return isMax ? -1000 : 1000;

        if (isMax) {
            let best = -Infinity;
            for (const move of moves) {
                const saved = this.applyTempMove(move, 'ai');
                best = Math.max(best, this.minimax(depth - 1, false, alpha, beta));
                this.undoTempMove(saved);
                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
            return best;
        } else {
            let best = Infinity;
            for (const move of moves) {
                const saved = this.applyTempMove(move, 'player');
                best = Math.min(best, this.minimax(depth - 1, true, alpha, beta));
                this.undoTempMove(saved);
                beta = Math.min(beta, best);
                if (beta <= alpha) break;
            }
            return best;
        }
    },

    evaluate: function() {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (!p) continue;
                const val = p.king ? 3 : 1;
                if (p.owner === 'ai') score += val;
                else score -= val;
            }
        }
        return score;
    },

    applyTempMove: function(move, side) {
        const saved = {
            board: this.board.map(r => r.map(c => c ? { ...c } : null)),
            move
        };
        const piece = this.board[move.fromR][move.fromC];
        this.board[move.toR][move.toC] = piece;
        this.board[move.fromR][move.fromC] = null;
        if (move.captures) move.captures.forEach(([r, c]) => { this.board[r][c] = null; });
        if (side === 'ai' && move.toR === 7) piece.king = true;
        if (side === 'player' && move.toR === 0) piece.king = true;
        return saved;
    },

    undoTempMove: function(saved) {
        this.board = saved.board;
    },

    // ── Render ────────────────────────────────────────────────────────────────
    render: function() {
        let modal = document.getElementById('draughts-modal');
        if (!this.gameActive && !modal) return;

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'draughts-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content" style="max-width:560px;">
                    <button class="game-modal-close" onclick="DraughtsGame.close()">×</button>
                    <div id="draughts-content"></div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) DraughtsGame.close(); });
        }

        const container = document.getElementById('draughts-content');
        if (!container) return;

        // Responzivní velikost buněk
        const isMobile = window.innerWidth <= 500;
        const cellSize = isMobile ? 38 : 52;
        const pieceSize = isMobile ? 28 : 40;
        const pieceFontSize = isMobile ? '0.8rem' : '1.1rem';

        let h = `<div style="background:var(--bg-card); padding:15px; border-radius:8px;">`;
        h += `<h3 style="margin:0 0 8px; color:var(--ink-primary);">${t('games.draughtsTitle')}</h3>`;

        if (!this.gameActive && this.playerCaptured === 0 && this.aiCaptured === 0) {
            h += `<p style="opacity:0.8; margin:10px 0;">${t('games.draughtsSubtitle')}</p>`;
            h += `<button class="craft-btn" onclick="DraughtsGame.start(1)" style="margin-right:6px;">Hrát (Snadná)</button>`;
            h += `<button class="craft-btn" onclick="DraughtsGame.start(2)" style="margin-right:6px; background:var(--accent-wax);">Hrát (Střední)</button>`;
            h += `<button class="craft-btn" onclick="DraughtsGame.start(3)" style="background:var(--ink-primary); color:var(--bg-parchment);">Hrát (Těžká)</button>`;
        } else {
            // Status
            h += `<div style="display:flex; justify-content:space-between; margin-bottom:8px; padding:6px 10px; background:rgba(197,160,89,0.1); border-radius:6px; font-size:0.82rem;">`;
            h += `<span>⚪ ${t('games.draughtsLabelYou')}: zajato ${this.playerCaptured}</span>`;
            h += `<span style="font-style:italic; opacity:0.8;">${this.lastMessage}</span>`;
            h += `<span>⚫ AI: zajato ${this.aiCaptured}</span>`;
            h += `</div>`;

            // Deska
            h += `<div style="display:inline-block; border:3px solid #5d3a1a; border-radius:4px; overflow:hidden;">`;
            for (let r = 0; r < 8; r++) {
                h += `<div style="display:flex;">`;
                for (let c = 0; c < 8; c++) {
                    const isDark = (r + c) % 2 === 1;
                    const piece = this.board[r][c];
                    const isSel = this.selectedCell && this.selectedCell[0] === r && this.selectedCell[1] === c;

                    // Highlight validních tahů
                    let isValidTarget = false;
                    if (this.selectedCell && this.currentTurn === 'player') {
                        const [sr, sc] = this.selectedCell;
                        const moves = this.getMovesFor(sr, sc);
                        isValidTarget = moves.some(m => m.toR === r && m.toC === c);
                    }

                    let bg = isDark ? '#5d3a1a' : '#f5deb3';
                    if (isSel) bg = 'rgba(197,160,89,0.9)';
                    else if (isValidTarget) bg = 'rgba(76,175,80,0.4)';

                    const clickable = isDark && this.currentTurn === 'player' && this.gameActive;

                    h += `<div onclick="${clickable ? `DraughtsGame.selectCell(${r},${c})` : ''}"
                        style="width:${cellSize}px; height:${cellSize}px; background:${bg}; display:flex; align-items:center; justify-content:center; cursor:${clickable ? 'pointer' : 'default'};">`;

                    if (piece) {
                        const isPlayer = piece.owner === 'player';
                        const bg2 = isPlayer ? 'radial-gradient(circle, #fff 60%, #ddd 100%)' : 'radial-gradient(circle, #333 60%, #111 100%)';
                        const shadow = isSel ? '0 0 8px 3px var(--accent-gold)' : '0 2px 4px rgba(0,0,0,0.4)';
                        h += `<div style="width:${pieceSize}px; height:${pieceSize}px; border-radius:50%; background:${bg2}; box-shadow:${shadow}; display:flex; align-items:center; justify-content:center; font-size:${pieceFontSize};">`;
                        if (piece.king) h += `👑`;
                        h += `</div>`;
                    }

                    h += `</div>`;
                }
                h += `</div>`;
            }
            h += `</div>`;

            // Tlačítka
            h += `<div style="margin-top:10px;">`;
            if (this.gameActive) {
                h += `<button class="craft-btn" onclick="DraughtsGame.start(${this.difficulty})" style="background:var(--accent-wax); font-size:0.8rem;">${t('games.draughtsBtnNew')}</button>`;
            } else {
                h += `<button class="craft-btn" onclick="DraughtsGame.start(1)" style="margin-right:6px;">Nová (Snadná)</button>`;
                h += `<button class="craft-btn" onclick="DraughtsGame.start(2)" style="margin-right:6px; background:var(--accent-wax);">Nová (Střední)</button>`;
                h += `<button class="craft-btn" onclick="DraughtsGame.start(3)" style="background:var(--ink-primary); color:var(--bg-parchment);">Nová (Těžká)</button>`;
            }
            h += `</div>`;
        }

        h += `</div>`;
        container.innerHTML = h;
    },

    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('draughts-modal');
        if (modal) modal.remove();
    },

    showRules: function() {
        let modal = document.getElementById('draughts-rules-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'draughts-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        }
        let h = '<div class="game-modal-content" style="max-width:600px;">';
        h += `<button class="game-modal-close" onclick="document.getElementById('draughts-rules-modal').remove()">×</button>`;
        h += `<div style="background:var(--bg-card); padding:20px; border-radius:8px;">`;
        h += `<h2 style="margin-bottom:15px; color:var(--ink-primary);">${t('games.draughtsRulesTitle')}</h2>`;
        h += `<h3 style="margin-top:15px;">${t('games.draughtsRulesHistoryTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.draughtsRulesHistoryText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.draughtsRulesGoalTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.draughtsRulesGoalText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.draughtsRulesMoveTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.draughtsRulesMoveText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.draughtsRulesKingTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.draughtsRulesKingText')}</p>`;
        h += `</div></div>`;
        modal.innerHTML = h;
    }
};