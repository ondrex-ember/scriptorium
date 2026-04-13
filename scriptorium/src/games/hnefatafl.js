// ═══════════════════════════════════════════════════════════════════════════════
// HNEFATAFL — Královská hra Vikingů (400–1100 n.l.)
// 11×11 deska (Tablut varianta), asymetrická: Král + 12 obránců vs. 24 útočníků
// Hráč = obránci (bílý), AI = útočníci (černý)
// Výhra obránců: Král dosáhne rohového pole
// Výhra útočníků: Král obklíčen ze 4 stran (nebo 3 + okraj)
// ═══════════════════════════════════════════════════════════════════════════════

const HnefataflGame = {
    gameActive: false,
    currentTurn: 'player', // 'player' (obránci) | 'ai' (útočníci)
    selectedCell: null,
    lastMessage: '',
    difficulty: 1, // 1=náhodná, 2=taktická

    // board[row][col]: null | { type:'attacker'|'defender'|'king', owner:'player'|'ai' }
    board: [],
    SIZE: 11,

    // Speciální pole
    THRONE: [5, 5],           // trůn — střed desky
    CORNERS: [[0,0],[0,10],[10,0],[10,10]], // rohová pole — cíl krále

    start: function(difficulty) {
        if (!GameState.inventory.hnefatafl_board || GameState.inventory.hnefatafl_board < 1) {
            UI.notify(t('games.hnefataflNeedBoard'), true);
            return;
        }
        this.difficulty = difficulty || 1;
        this.gameActive = true;
        this.currentTurn = 'player';
        this.selectedCell = null;
        this.lastMessage = t('games.hnefataflLabelYourTurn');
        this.initBoard();
        this.render();
    },

    // ── Startovní pozice (Tablut — historická švédská varianta) ───────────────
    initBoard: function() {
        const S = this.SIZE;
        this.board = Array(S).fill(null).map(() => Array(S).fill(null));

        // Útočníci (AI — černý) — 24 kamenů
        const attackerPos = [
            [0,3],[0,4],[0,5],[0,6],[0,7],
            [1,5],
            [3,0],[4,0],[5,0],[6,0],[7,0],
            [5,1],
            [3,10],[4,10],[5,10],[6,10],[7,10],
            [5,9],
            [10,3],[10,4],[10,5],[10,6],[10,7],
            [9,5],
        ];
        attackerPos.forEach(([r,c]) => {
            this.board[r][c] = { type: 'attacker', owner: 'ai' };
        });

        // Obránci (hráč — bílý) — 12 kamenů
        const defenderPos = [
            [3,5],[4,5],
            [5,3],[5,4],[5,6],[5,7],
            [6,5],[7,5],
            [4,4],[4,6],[6,4],[6,6],
        ];
        defenderPos.forEach(([r,c]) => {
            this.board[r][c] = { type: 'defender', owner: 'player' };
        });

        // Král — střed (trůn)
        this.board[5][5] = { type: 'king', owner: 'player' };
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
            // Pokus o tah na cílové pole
            const moves = this.getMovesFor(sr, sc);
            const move = moves.find(m => m.toR === row && m.toC === col);
            if (move) {
                this.executeMove(move, 'player');
                return;
            }
            // Přepnutí výběru na jiný vlastní kámen
            if (cell && cell.owner === 'player') {
                this.selectedCell = [row, col];
                this.render();
                return;
            }
            this.selectedCell = null;
            this.render();
            return;
        }

        if (cell && cell.owner === 'player') {
            this.selectedCell = [row, col];
        }
        this.render();
    },

    // ── Pohybová logika ───────────────────────────────────────────────────────
    // Všechny figurky se pohybují jako věž v šachu (libovolně v přímé linii)
    getMovesFor: function(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        const moves = [];
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

        dirs.forEach(([dr, dc]) => {
            let r = row + dr, c = col + dc;
            while (this.inBounds(r, c)) {
                // Blokování — jiná figurka
                if (this.board[r][c]) break;
                // Trůn — může vstoupit jen Král
                if (r === this.THRONE[0] && c === this.THRONE[1] && piece.type !== 'king') break;
                // Rohová pole — může vstoupit jen Král
                if (this.isCorner(r, c) && piece.type !== 'king') break;
                moves.push({ fromR: row, fromC: col, toR: r, toC: c });
                r += dr; c += dc;
            }
        });
        return moves;
    },

    getAllMoves: function(side) {
        const moves = [];
        for (let r = 0; r < this.SIZE; r++) {
            for (let c = 0; c < this.SIZE; c++) {
                const p = this.board[r][c];
                if (p && p.owner === side) {
                    moves.push(...this.getMovesFor(r, c));
                }
            }
        }
        return moves;
    },

    isCorner: function(r, c) {
        return this.CORNERS.some(([cr, cc]) => cr === r && cc === c);
    },

    inBounds: function(r, c) {
        return r >= 0 && r < this.SIZE && c >= 0 && c < this.SIZE;
    },

    // ── Provést tah ──────────────────────────────────────────────────────────
    executeMove: function(move, side) {
        const { fromR, fromC, toR, toC } = move;
        const piece = this.board[fromR][fromC];

        this.board[toR][toC] = piece;
        this.board[fromR][fromC] = null;
        this.selectedCell = null;

        // Kontrola zajmutí soupeřových kamenů
        this.checkCaptures(toR, toC, side);

        // Kontrola výhry
        if (this.checkWin(toR, toC, side)) {
            this.render();
            return;
        }

        this.endTurn(side);
    },

    // ── Zajímání ─────────────────────────────────────────────────────────────
    // Kámen je zajat obklíčením ze dvou protilehlých stran
    checkCaptures: function(movedR, movedC, side) {
        const opp = side === 'player' ? 'ai' : 'player';
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

        dirs.forEach(([dr, dc]) => {
            const mr = movedR + dr, mc = movedC + dc;   // potenciálně zajatý
            const br = movedR + dr*2, bc = movedC + dc*2; // druhá strana

            if (!this.inBounds(mr, mc)) return;
            const target = this.board[mr][mc];
            if (!target || target.owner !== opp) return;
            if (target.type === 'king') return; // Krále nelze takto zajmout

            // Druhá strana — vlastní figurka nebo rohové pole nebo trůn
            const secondSide = this.inBounds(br, bc) && (
                (this.board[br][bc] && this.board[br][bc].owner === side) ||
                this.isCorner(br, bc) ||
                (br === this.THRONE[0] && bc === this.THRONE[1])
            );
            // Nebo okraj desky (pro útočníky zajímající obránce u okraje)
            const edgeCapture = !this.inBounds(br, bc);

            if (secondSide || edgeCapture) {
                this.board[mr][mc] = null;
                this.lastMessage = `⚔️ Zajmutí na [${mr+1},${mc+1}]!`;
            }
        });
    },

    // Král je zajat ze 4 stran (nebo 3 + okraj/trůn)
    isKingCaptured: function(kr, kc) {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        let surrounded = 0;
        dirs.forEach(([dr, dc]) => {
            const r = kr + dr, c = kc + dc;
            if (!this.inBounds(r, c)) { surrounded++; return; } // okraj
            const cell = this.board[r][c];
            if ((cell && cell.owner === 'ai') ||
                this.isCorner(r, c) ||
                (r === this.THRONE[0] && c === this.THRONE[1])) {
                surrounded++;
            }
        });
        return surrounded >= 4;
    },

    // ── Výhra ─────────────────────────────────────────────────────────────────
    checkWin: function(movedR, movedC, side) {
        const piece = this.board[movedR][movedC];
        if (!piece) return false;

        // Král dosáhl rohu — obránci vyhrávají
        if (piece.type === 'king' && this.isCorner(movedR, movedC)) {
            this.endGame('player', 'king_escaped');
            return true;
        }

        // Zkontroluj jestli je Král zajat
        const kingPos = this.findKing();
        if (kingPos && this.isKingCaptured(kingPos[0], kingPos[1])) {
            this.endGame('ai', 'king_captured');
            return true;
        }

        // Žádné tahy pro soupeře
        const nextSide = side === 'player' ? 'ai' : 'player';
        if (this.getAllMoves(nextSide).length === 0) {
            this.endGame(side === 'player' ? 'player' : 'ai', 'no_moves');
            return true;
        }

        return false;
    },

    findKing: function() {
        for (let r = 0; r < this.SIZE; r++)
            for (let c = 0; c < this.SIZE; c++)
                if (this.board[r][c] && this.board[r][c].type === 'king') return [r, c];
        return null;
    },

    endGame: function(winner, reason) {
        this.gameActive = false;
        const reward = 8;
        if (winner === 'player') {
            Game.addItem('research', reward);
            if (GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            this.lastMessage = t('games.hnefataflKingEscaped').replace('{reward}', reward);
            UI.notify(this.lastMessage);
        } else {
            if (GameState.achievements) GameState.achievements.stats.totalGamesPlayed++;
            this.lastMessage = t('games.hnefataflKingCaptured');
            UI.notify(this.lastMessage, true);
        }
        Game.save();
    },

    endTurn: function(side) {
        if (side === 'player') {
            this.currentTurn = 'ai';
            this.lastMessage = t('games.hnefataflLabelAiTurn');
            this.render();
            setTimeout(() => this.aiTurn(), 700);
        } else {
            this.currentTurn = 'player';
            this.lastMessage = t('games.hnefataflLabelYourTurn');
            this.render();
        }
    },

    // ── AI ────────────────────────────────────────────────────────────────────
    aiTurn: function() {
        if (!this.gameActive || this.currentTurn !== 'ai') return;

        const moves = this.getAllMoves('ai');
        if (moves.length === 0) { this.endGame('player', 'no_moves'); this.render(); return; }

        let chosen;
        if (this.difficulty === 1) {
            chosen = moves[Math.floor(Math.random() * moves.length)];
        } else {
            // Taktická AI — prioritizuje:
            // 1. Tahy co zajmou obránce nebo Krále
            // 2. Tahy co obklíčí Krále
            // 3. Blokování rohů
            chosen = this.tacticalAiMove(moves);
        }

        this.executeMove(chosen, 'ai');
    },

    tacticalAiMove: function(moves) {
        const kingPos = this.findKing();
        let best = null, bestScore = -Infinity;

        moves.forEach(move => {
            let score = 0;
            const { toR, toC } = move;

            // Blokování rohů
            if (this.isCorner(toR, toC)) score -= 5; // útočníci nesmí na rohy

            // Přiblížení ke Králi
            if (kingPos) {
                const dist = Math.abs(toR - kingPos[0]) + Math.abs(toC - kingPos[1]);
                score += (10 - dist);
            }

            // Simulace zajmutí
            const saved = this.saveBoardState();
            this.board[move.toR][move.toC] = this.board[move.fromR][move.fromC];
            this.board[move.fromR][move.fromC] = null;
            this.checkCaptures(move.toR, move.toC, 'ai');
            const kp = this.findKing();
            if (kp && this.isKingCaptured(kp[0], kp[1])) score += 100; // výherní tah!
            // Počet zajatých obránců
            let captured = 0;
            for (let r = 0; r < this.SIZE; r++)
                for (let c = 0; c < this.SIZE; c++)
                    if (saved[r][c] && saved[r][c].owner === 'player' && !this.board[r][c]) captured++;
            score += captured * 5;
            this.restoreBoardState(saved);

            if (score > bestScore) { bestScore = score; best = move; }
        });

        return best || moves[Math.floor(Math.random() * moves.length)];
    },

    saveBoardState: function() {
        return this.board.map(r => r.map(c => c ? { ...c } : null));
    },

    restoreBoardState: function(saved) {
        this.board = saved.map(r => r.map(c => c ? { ...c } : null));
    },

    // ── Render ────────────────────────────────────────────────────────────────
    render: function() {
        let modal = document.getElementById('hnefatafl-modal');
        if (!this.gameActive && !modal) return;

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'hnefatafl-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content" style="max-width:640px;">
                    <button class="game-modal-close" onclick="HnefataflGame.close()">×</button>
                    <div id="hnefatafl-content"></div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) HnefataflGame.close(); });
        }

        const container = document.getElementById('hnefatafl-content');
        if (!container) return;

        // Responzivní velikost buněk
        const isMobile = window.innerWidth <= 500;
        const cellSize = isMobile ? 30 : 44;
        const kingSize = isMobile ? 24 : 36;
        const pieceSize = isMobile ? 21 : 32;
        const pieceFontSize = isMobile ? '0.75rem' : '1.1rem';
        const smallFontSize = isMobile ? '0.5rem' : '0.65rem';

        let h = `<div style="background:var(--bg-card); padding:15px; border-radius:8px;">`
        h += `<h3 style="margin:0 0 8px; color:var(--ink-primary);">${t('games.hnefataflTitle')} <span style="font-size:0.65em; opacity:0.5;">— ${t('games.hnefataflSubtitle')}</span></h3>`;

        if (!this.gameActive && !this.findKing()) {
            h += `<p style="opacity:0.8; margin:10px 0;">Asymetrická vikingská hra. Ty hraješ obránce (bílý) — chraň Krále a dostaň ho do rohu!</p>`;
            h += `<button class="craft-btn" onclick="HnefataflGame.start(1)" style="margin-right:8px;">Hrát (Snadná AI)</button>`;
            h += `<button class="craft-btn" onclick="HnefataflGame.start(2)" style="background:var(--accent-wax);">Hrát (Taktická AI)</button>`;
        } else {
            // Status
            const defCount = this.countPieces('player');
            const attCount = this.countPieces('ai');
            h += `<div style="display:flex; justify-content:space-between; margin-bottom:8px; padding:6px 10px; background:rgba(197,160,89,0.1); border-radius:6px; font-size:0.82rem;">`;
            h += `<span>⚪ Obránci: ${defCount}</span>`;
            h += `<span style="font-style:italic; opacity:0.8;">${this.lastMessage}</span>`;
            h += `<span>⚫ Útočníci: ${attCount}</span>`;
            h += `</div>`;

            // Deska 11×11
            h += `<div style="display:inline-block; border:3px solid #5d3a1a; border-radius:4px; overflow:hidden;">`;
            for (let r = 0; r < this.SIZE; r++) {
                h += `<div style="display:flex;">`;
                for (let c = 0; c < this.SIZE; c++) {
                    const piece = this.board[r][c];
                    const isSel = this.selectedCell && this.selectedCell[0] === r && this.selectedCell[1] === c;
                    const isThrone = r === this.THRONE[0] && c === this.THRONE[1];
                    const isCorner = this.isCorner(r, c);

                    // Highlight validních tahů
                    let isValidTarget = false;
                    if (this.selectedCell && this.currentTurn === 'player') {
                        const [sr, sc] = this.selectedCell;
                        isValidTarget = this.getMovesFor(sr, sc).some(m => m.toR === r && m.toC === c);
                    }

                    let bg = (r + c) % 2 === 0 ? '#d4a96a' : '#c4914a';
                    if (isThrone) bg = '#8B1A1A';
                    if (isCorner) bg = '#2d5a1b';
                    if (isSel) bg = 'rgba(197,160,89,0.95)';
                    else if (isValidTarget) bg = 'rgba(76,175,80,0.5)';

                    const clickable = this.currentTurn === 'player' && this.gameActive;
                    h += `<div onclick="${clickable ? `HnefataflGame.selectCell(${r},${c})` : ''}"
                        style="width:${cellSize}px; height:${cellSize}px; background:${bg}; display:flex; align-items:center; justify-content:center;
                        cursor:${clickable ? 'pointer' : 'default'}; position:relative; border:1px solid rgba(0,0,0,0.1);">`;

                    // Speciální symboly pro prázdná pole
                    if (!piece) {
                        if (isThrone) h += `<span style="font-size:1rem; opacity:0.6;">⊕</span>`;
                        else if (isCorner) h += `<span style="font-size:0.9rem; opacity:0.7;">🏰</span>`;
                    }

                    if (piece) {
                        if (piece.type === 'king') {
                            h += `<div style="width:${kingSize}px; height:${kingSize}px; border-radius:50%; background:radial-gradient(circle, #ffd700 50%, #b8860b 100%); border:2px solid #8B6914; display:flex; align-items:center; justify-content:center; font-size:${pieceFontSize}; box-shadow:${isSel?'0 0 8px 3px gold':'0 2px 4px rgba(0,0,0,0.4)'};">👑</div>`;
                        } else if (piece.type === 'defender') {
                            h += `<div style="width:${pieceSize}px; height:${pieceSize}px; border-radius:50%; background:radial-gradient(circle, #fff 60%, #ccc 100%); border:2px solid #999; box-shadow:${isSel?'0 0 8px 3px var(--accent-gold)':'0 2px 3px rgba(0,0,0,0.3)'}; display:flex; align-items:center; justify-content:center;">⚪</div>`;
                        } else {
                            h += `<div style="width:${pieceSize}px; height:${pieceSize}px; border-radius:50%; background:radial-gradient(circle, #444 60%, #111 100%); border:2px solid #8B4513; box-shadow:0 2px 3px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.6); font-size:${smallFontSize};">⚫</div>`;
                        }
                    }

                    h += `</div>`;
                }
                h += `</div>`;
            }
            h += `</div>`;

            // Legenda
            h += `<div style="font-size:0.7rem; opacity:0.6; margin:6px 0 8px;">`;
            h += `🏰 Rohová pole (cíl Krále) &nbsp;|&nbsp; ⊕ Trůn (jen pro Krále) &nbsp;|&nbsp; 👑 Král &nbsp;|&nbsp; ⚪ Obránce (ty) &nbsp;|&nbsp; ⚫ Útočník (AI)`;
            h += `</div>`;

            // Tlačítka
            if (this.gameActive) {
                if (this.currentTurn === 'ai') {
                    h += `<div style="display:inline-block; padding:6px 12px; background:rgba(0,0,0,0.07); border-radius:6px; opacity:0.7; margin-right:8px;">⏳ ${t('games.hnefataflLabelAiTurn')}</div>`;
                }
                h += `<button class="craft-btn" onclick="HnefataflGame.start(${this.difficulty})" style="background:var(--accent-wax); font-size:0.8rem;">${t('games.hnefataflBtnNew')}</button>`;
            } else {
                h += `<button class="craft-btn" onclick="HnefataflGame.start(1)" style="margin-right:8px;">Nová (Snadná)</button>`;
                h += `<button class="craft-btn" onclick="HnefataflGame.start(2)" style="background:var(--accent-wax);">Nová (Taktická)</button>`;
            }
        }

        h += `</div>`;
        container.innerHTML = h;
    },

    countPieces: function(side) {
        let n = 0;
        for (let r = 0; r < this.SIZE; r++)
            for (let c = 0; c < this.SIZE; c++)
                if (this.board[r][c] && this.board[r][c].owner === side) n++;
        return n;
    },

    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('hnefatafl-modal');
        if (modal) modal.remove();
    },

    showRules: function() {
        let modal = document.getElementById('hnefatafl-rules-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'hnefatafl-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        }
        let h = '<div class="game-modal-content" style="max-width:600px;">';
        h += `<button class="game-modal-close" onclick="document.getElementById('hnefatafl-rules-modal').remove()">×</button>`;
        h += `<div style="background:var(--bg-card); padding:20px; border-radius:8px;">`;
        h += `<h2 style="margin-bottom:15px; color:var(--ink-primary);">${t('games.hnefataflRulesTitle')}</h2>`;
        h += `<h3 style="margin-top:15px;">${t('games.hnefataflRulesHistoryTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.hnefataflRulesHistoryText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.hnefataflRulesGoalTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.hnefataflRulesGoalText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.hnefataflRulesMoveTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.hnefataflRulesMoveText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.hnefataflRulesCaptureTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.hnefataflRulesCaptureText')}</p>`;
        h += `</div></div>`;
        modal.innerHTML = h;
    }
};