// ═══════════════════════════════════════════════════════════════════════════════
// TABLES (BACKGAMMON) — Středověký předchůdce Backgammonu
// 15 kamenů, 24 polí, 2 kostky. Hráč jde 24→1, AI 1→24.
// ═══════════════════════════════════════════════════════════════════════════════

const BackgammonGame = {
    gameActive: false,
    currentTurn: 'player',
    dice: [],           // [d1, d2] aktuální hod
    movesLeft: [],      // zbývající hodnoty k použití
    selectedPoint: -1,  // index pole které hráč kliknul
    lastMessage: '',
    difficulty: 1,      // 1=náhodná AI, 2=taktická AI

    // Deska: 24 polí, index 0=bod 1 (domácí AI), 23=bod 24 (domácí hráče)
    // points[i] = { count: N, owner: 'player'|'ai'|null }
    points: [],
    playerBar: 0,   // hráčovy kameny na baru
    aiBar: 0,       // AI kameny na baru
    playerHome: 0,  // hráčovy snešené kameny
    aiHome: 0,      // AI snešené kameny

    TOTAL_PIECES: 15,

    start: function(difficulty) {
        if (!GameState.inventory.backgammon_board || GameState.inventory.backgammon_board < 1) {
            UI.notify(t('games.backgammonNeedBoard'), true);
            return;
        }
        this.difficulty = difficulty || 1;
        this.gameActive = true;
        this.currentTurn = 'player';
        this.dice = [];
        this.movesLeft = [];
        this.selectedPoint = -1;
        this.playerBar = 0;
        this.aiBar = 0;
        this.playerHome = 0;
        this.aiHome = 0;
        this.lastMessage = t('games.backgammonLabelYourTurn');
        this.setupBoard();
        this.render();
    },

    // ── Startovní pozice (historicky přesná pro Tables) ───────────────────────
    setupBoard: function() {
        this.points = Array(24).fill(null).map(() => ({ count: 0, owner: null }));
        const setup = [
            // [bod-1, počet, owner]  (bod 1 = index 0)
            [0,  2, 'ai'],
            [5,  5, 'player'],
            [7,  3, 'player'],
            [11, 5, 'ai'],
            [12, 5, 'player'],
            [16, 3, 'ai'],
            [18, 5, 'ai'],
            [23, 2, 'player'],
        ];
        setup.forEach(([idx, cnt, owner]) => {
            this.points[idx] = { count: cnt, owner };
        });
    },

    // ── Kostky ────────────────────────────────────────────────────────────────
    rollDice: function() {
        if (!this.gameActive || this.currentTurn !== 'player') return;
        if (this.movesLeft.length > 0) return;

        const d1 = Math.ceil(Math.random() * 6);
        const d2 = Math.ceil(Math.random() * 6);
        this.dice = [d1, d2];
        this.movesLeft = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
        this.lastMessage = t('games.backgammonLabelDice').replace('{d1}', d1).replace('{d2}', d2);

        if (!this.hasAnyMove('player')) {
            this.lastMessage += ' — ' + 'Žádný možný tah!';
            this.movesLeft = [];
            setTimeout(() => this.endTurn(), 1200);
        }
        this.render();
    },

    // ── Pohyb hráče ───────────────────────────────────────────────────────────
    // Hráč: pohybuje se z bodu 24 → bod 1 (index 23 → 0)
    selectPoint: function(pointIdx) {
        if (!this.gameActive || this.currentTurn !== 'player') return;
        if (this.movesLeft.length === 0) return;

        // Pokud má hráč kameny na baru, musí je vrátit první
        if (this.playerBar > 0) {
            this.enterFromBar(pointIdx);
            return;
        }

        const pt = this.points[pointIdx];

        if (this.selectedPoint === -1) {
            // Výběr zdroje
            if (!pt || pt.owner !== 'player' || pt.count === 0) return;
            this.selectedPoint = pointIdx;
        } else {
            // Výběr cíle
            const from = this.selectedPoint;
            this.selectedPoint = -1;

            if (from === pointIdx) { this.render(); return; } // zrušení výběru

            const moved = this.tryMove('player', from, pointIdx);
            if (!moved) {
                this.lastMessage = '⚠️ Neplatný tah!';
            }
        }
        this.render();
    },

    enterFromBar: function(targetIdx) {
        // Hráč vstupuje na pole 18–23 (body 19–24, AI domácí čtvrtina)
        const validEntry = 23 - (this.movesLeft[0] - 1);
        // Zjednodušení: hráč vybere cílový bod
        const diceVal = 24 - targetIdx;
        if (!this.movesLeft.includes(diceVal)) {
            this.lastMessage = '⚠️ Tato hodnota kostky není k dispozici.';
            this.render();
            return;
        }
        const target = this.points[targetIdx];
        if (target && target.owner === 'ai' && target.count >= 2) {
            this.lastMessage = '🛡️ Pole obsazeno AI.';
            this.render();
            return;
        }
        if (target && target.owner === 'ai' && target.count === 1) {
            // Hit — AI jde na bar
            this.aiBar++;
            this.points[targetIdx] = { count: 0, owner: null };
        }
        if (!this.points[targetIdx] || this.points[targetIdx].count === 0) {
            this.points[targetIdx] = { count: 1, owner: 'player' };
        } else {
            this.points[targetIdx].count++;
        }
        this.playerBar--;
        this.useMove(diceVal);
        this.checkTurnEnd();
        this.render();
    },

    tryMove: function(side, from, to) {
        const dir = side === 'player' ? -1 : 1; // hráč jde dolů, AI nahoru
        const dist = (from - to) * (side === 'player' ? 1 : -1);

        if (dist <= 0) return false;
        if (!this.movesLeft.includes(dist)) return false;

        const target = this.points[to];
        const opp = side === 'player' ? 'ai' : 'player';

        if (target && target.owner === opp && target.count >= 2) return false; // blokováno

        // Hit
        if (target && target.owner === opp && target.count === 1) {
            if (side === 'player') this.aiBar++;
            else this.playerBar++;
            this.points[to] = { count: 0, owner: null };
        }

        // Pohyb
        this.points[from].count--;
        if (this.points[from].count === 0) this.points[from].owner = null;

        if (!this.points[to] || this.points[to].count === 0) {
            this.points[to] = { count: 1, owner: side };
        } else {
            this.points[to].count++;
        }

        this.useMove(dist);
        this.checkTurnEnd();
        return true;
    },

    bearOff: function(from) {
        // Snášení kamenů z desky
        if (!this.canBearOff('player')) return;
        const dist = from + 1; // hráč snáší z indexu from (bod from+1)
        if (!this.movesLeft.includes(dist) && !this.movesLeft.some(m => m >= dist)) return;

        const useDice = this.movesLeft.includes(dist) ? dist : this.movesLeft.find(m => m >= dist);
        if (!useDice) return;

        this.points[from].count--;
        if (this.points[from].count === 0) this.points[from].owner = null;
        this.playerHome++;
        this.useMove(useDice);

        if (this.playerHome === this.TOTAL_PIECES) {
            this.win('player');
            return;
        }
        this.checkTurnEnd();
        this.render();
    },

    canBearOff: function(side) {
        // Všechny kameny musí být v domácí čtvrtině
        if (side === 'player') {
            const bar = this.playerBar;
            if (bar > 0) return false;
            const outside = this.points.slice(6).reduce((sum, pt) => {
                return sum + (pt && pt.owner === 'player' ? pt.count : 0);
            }, 0);
            return outside === 0;
        } else {
            if (this.aiBar > 0) return false;
            const outside = this.points.slice(0, 18).reduce((sum, pt) => {
                return sum + (pt && pt.owner === 'ai' ? pt.count : 0);
            }, 0);
            return outside === 0;
        }
    },

    useMove: function(val) {
        const idx = this.movesLeft.indexOf(val);
        if (idx !== -1) this.movesLeft.splice(idx, 1);
    },

    hasAnyMove: function(side) {
        if (side === 'player') {
            if (this.playerBar > 0) {
                return this.movesLeft.some(d => {
                    const to = 24 - d;
                    if (to < 0 || to > 23) return false;
                    const pt = this.points[to];
                    return !pt || pt.owner !== 'ai' || pt.count < 2;
                });
            }
            return this.movesLeft.some(d => {
                return this.points.some((pt, from) => {
                    if (!pt || pt.owner !== 'player' || pt.count === 0) return false;
                    const to = from - d;
                    if (to < 0) return this.canBearOff('player');
                    const tpt = this.points[to];
                    return !tpt || tpt.owner !== 'ai' || tpt.count < 2;
                });
            });
        }
        return true; // zjednodušení pro AI
    },

    checkTurnEnd: function() {
        if (this.movesLeft.length === 0 || !this.hasAnyMove('player')) {
            this.movesLeft = [];
            this.selectedPoint = -1;
            setTimeout(() => this.endTurn(), 600);
        }
    },

    endTurn: function() {
        if (!this.gameActive) return;
        if (this.currentTurn === 'player') {
            this.currentTurn = 'ai';
            this.lastMessage = t('games.backgammonLabelAiTurn');
            this.render();
            setTimeout(() => this.aiTurn(), 800);
        } else {
            this.currentTurn = 'player';
            this.dice = [];
            this.movesLeft = [];
            this.selectedPoint = -1;
            this.lastMessage = t('games.backgammonLabelYourTurn');
            this.render();
        }
    },

    // ── AI ────────────────────────────────────────────────────────────────────
    aiTurn: function() {
        if (!this.gameActive || this.currentTurn !== 'ai') return;

        const d1 = Math.ceil(Math.random() * 6);
        const d2 = Math.ceil(Math.random() * 6);
        this.dice = [d1, d2];
        this.movesLeft = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
        this.lastMessage = `AI: ${d1}+${d2}`;

        this.executeAiMoves();
    },

    executeAiMoves: function() {
        if (!this.gameActive || this.movesLeft.length === 0) {
            this.endTurn();
            return;
        }

        // AI vrátí kameny z baru
        if (this.aiBar > 0) {
            const d = this.movesLeft[0];
            const to = d - 1; // AI vstupuje na pole 0–5 (body 1–6)
            if (to >= 0 && to <= 23) {
                const pt = this.points[to];
                if (!pt || pt.owner !== 'player' || pt.count < 2) {
                    if (pt && pt.owner === 'player' && pt.count === 1) {
                        this.playerBar++;
                        this.points[to] = { count: 0, owner: null };
                    }
                    if (!this.points[to] || this.points[to].count === 0) {
                        this.points[to] = { count: 1, owner: 'ai' };
                    } else {
                        this.points[to].count++;
                    }
                    this.aiBar--;
                    this.useMove(d);
                    this.render();
                    setTimeout(() => this.executeAiMoves(), 500);
                    return;
                }
            }
            this.movesLeft = [];
            this.endTurn();
            return;
        }

        // Snášení
        if (this.canBearOff('ai')) {
            const d = this.movesLeft[0];
            const from = d - 1;
            if (from >= 0 && from <= 5 && this.points[from] && this.points[from].owner === 'ai' && this.points[from].count > 0) {
                this.points[from].count--;
                if (this.points[from].count === 0) this.points[from].owner = null;
                this.aiHome++;
                this.useMove(d);
                if (this.aiHome === this.TOTAL_PIECES) { this.win('ai'); return; }
                this.render();
                setTimeout(() => this.executeAiMoves(), 500);
                return;
            }
        }

        // Normální tah — AI strategie dle difficulty
        let bestMove = null;

        if (this.difficulty === 1) {
            // Náhodná AI
            const moves = this.getAiMoves();
            if (moves.length > 0) bestMove = moves[Math.floor(Math.random() * moves.length)];
        } else {
            // Taktická AI — preferuje hity a rozvoj domácí čtvrtiny
            const moves = this.getAiMoves();
            moves.sort((a, b) => {
                let scoreA = a.to;
                let scoreB = b.to;
                const ptA = this.points[a.to];
                const ptB = this.points[b.to];
                if (ptA && ptA.owner === 'player' && ptA.count === 1) scoreA += 5;
                if (ptB && ptB.owner === 'player' && ptB.count === 1) scoreB += 5;
                return scoreB - scoreA;
            });
            if (moves.length > 0) bestMove = moves[0];
        }

        if (!bestMove) {
            this.movesLeft = [];
            this.endTurn();
            return;
        }

        // Provede tah
        const { from, to, dist } = bestMove;
        const target = this.points[to];
        if (target && target.owner === 'player' && target.count === 1) {
            this.playerBar++;
            this.points[to] = { count: 0, owner: null };
        }
        this.points[from].count--;
        if (this.points[from].count === 0) this.points[from].owner = null;
        if (!this.points[to] || this.points[to].count === 0) {
            this.points[to] = { count: 1, owner: 'ai' };
        } else {
            this.points[to].count++;
        }
        this.useMove(dist);
        this.render();
        setTimeout(() => this.executeAiMoves(), 500);
    },

    getAiMoves: function() {
        const moves = [];
        this.movesLeft.forEach(d => {
            this.points.forEach((pt, from) => {
                if (!pt || pt.owner !== 'ai' || pt.count === 0) return;
                const to = from + d;
                if (to > 23) return;
                const tpt = this.points[to];
                if (tpt && tpt.owner === 'player' && tpt.count >= 2) return;
                moves.push({ from, to, dist: d });
            });
        });
        return moves;
    },

    win: function(side) {
        this.gameActive = false;
        const reward = 6;
        if (side === 'player') {
            Game.addItem('research', reward);
            if (GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            this.lastMessage = t('games.backgammonWin').replace('{reward}', reward);
            UI.notify(this.lastMessage);
        } else {
            if (GameState.achievements) GameState.achievements.stats.totalGamesPlayed++;
            this.lastMessage = t('games.backgammonLoss');
            UI.notify(this.lastMessage, true);
        }
        Game.save();
        this.render();
    },

    // ── Render ────────────────────────────────────────────────────────────────
    render: function() {
        let modal = document.getElementById('backgammon-modal');
        if (!this.gameActive && !modal) return;

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'backgammon-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content" style="max-width:760px;">
                    <button class="game-modal-close" onclick="BackgammonGame.close()">×</button>
                    <div id="backgammon-content"></div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) BackgammonGame.close(); });
        }

        const container = document.getElementById('backgammon-content');
        if (!container) return;

        let h = `<div style="background:var(--bg-card); padding:15px; border-radius:8px;">`;
        h += `<h3 style="margin:0 0 10px; color:var(--ink-primary);">${t('games.backgammonTitle')}</h3>`;

        if (!this.gameActive && this.playerHome === 0 && this.aiHome === 0) {
            // Úvodní obrazovka
            h += `<p style="margin:10px 0; opacity:0.8;">${t('games.backgammonSubtitle')}</p>`;
            h += `<button class="craft-btn" onclick="BackgammonGame.start(1)" style="margin-right:8px;">${t('games.backgammonBtnPlay')} (Snadná AI)</button>`;
            h += `<button class="craft-btn" onclick="BackgammonGame.start(2)" style="background:var(--accent-wax);">${t('games.backgammonBtnPlay')} (Taktická AI)</button>`;
        } else {
            // Skóre / status
            h += `<div style="display:flex; justify-content:space-between; margin-bottom:10px; padding:8px 12px; background:rgba(197,160,89,0.1); border-radius:6px; font-size:0.85rem;">`;
            h += `<span>👤 Ty: ${this.playerHome}/${this.TOTAL_PIECES} snešeno ${this.playerBar > 0 ? `| Bar: ${this.playerBar}` : ''}</span>`;
            h += `<span style="font-style:italic; opacity:0.8;">${this.lastMessage}</span>`;
            h += `<span>🤖 AI: ${this.aiHome}/${this.TOTAL_PIECES} snešeno ${this.aiBar > 0 ? `| Bar: ${this.aiBar}` : ''}</span>`;
            h += `</div>`;

            // Deska
            h += this.renderBoard();

            // Tlačítka
            if (this.gameActive) {
                if (this.currentTurn === 'player' && this.movesLeft.length === 0) {
                    h += `<button class="craft-btn" onclick="BackgammonGame.rollDice()" style="margin-right:8px;">${t('games.backgammonBtnRoll')}</button>`;
                } else if (this.currentTurn === 'player' && this.movesLeft.length > 0) {
                    h += `<div style="display:inline-block; padding:8px 12px; background:rgba(197,160,89,0.15); border-radius:6px; margin-right:8px;">`;
                    h += `🎲 Zbývá: <strong>${this.movesLeft.join(', ')}</strong> — klikni na pole`;
                    h += `</div>`;
                }
                h += `<button class="craft-btn" onclick="BackgammonGame.start(${this.difficulty})" style="background:var(--accent-wax); font-size:0.8rem;">${t('games.backgammonBtnNew')}</button>`;
            } else {
                h += `<button class="craft-btn" onclick="BackgammonGame.start(1)" style="margin-right:8px;">Nová hra (Snadná)</button>`;
                h += `<button class="craft-btn" onclick="BackgammonGame.start(2)" style="background:var(--accent-wax);">Nová hra (Taktická)</button>`;
            }
        }

        h += `</div>`;
        container.innerHTML = h;
    },

    renderBoard: function() {
        // Horní řada: body 13–24 (indexy 12–23), zleva doprava
        // Dolní řada: body 12–1 (indexy 11–0), zleva doprava
        let h = `<div style="background:#5d3a1a; padding:8px; border-radius:6px; margin:10px 0;">`;

        // Horní polovina (body 13–24, AI přichází zleva)
        h += `<div style="display:flex; gap:3px; margin-bottom:4px;">`;
        for (let i = 12; i <= 23; i++) {
            h += this.renderPoint(i, 'top');
            if (i === 17) h += `<div style="width:20px; background:#4a2800; border-radius:3px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.5); font-size:0.7rem;">🏛</div>`;
        }
        h += `</div>`;

        // Dolní polovina (body 12–1, hráč přichází zprava→doleva)
        h += `<div style="display:flex; gap:3px;">`;
        for (let i = 11; i >= 0; i--) {
            h += this.renderPoint(i, 'bottom');
            if (i === 6) h += `<div style="width:20px; background:#4a2800; border-radius:3px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.5); font-size:0.7rem;">🏛</div>`;
        }
        h += `</div>`;

        h += `</div>`;
        return h;
    },

    renderPoint: function(idx, pos) {
        const pt = this.points[idx];
        const isSelected = this.selectedPoint === idx;
        const isPlayerPt = pt && pt.owner === 'player' && pt.count > 0;
        const canSelect = this.currentTurn === 'player' && this.movesLeft.length > 0 && isPlayerPt && this.playerBar === 0;
        const canTarget = this.currentTurn === 'player' && this.selectedPoint !== -1 && this.movesLeft.length > 0;

        let bg = idx % 2 === 0 ? '#8B1A1A' : '#F5F5DC';
        if (isSelected) bg = 'rgba(197,160,89,0.8)';

        let h = `<div onclick="${canSelect || canTarget ? `BackgammonGame.selectPoint(${idx})` : ''}" 
            style="width:42px; min-height:90px; background:${bg}; border-radius:3px; 
            display:flex; flex-direction:${pos === 'top' ? 'column' : 'column-reverse'}; 
            align-items:center; padding:3px; gap:2px; cursor:${canSelect || canTarget ? 'pointer' : 'default'};
            border:${isSelected ? '2px solid var(--accent-gold)' : '1px solid rgba(0,0,0,0.2)'};
            position:relative;">`;
        h += `<div style="font-size:0.55rem; color:rgba(0,0,0,0.5); position:absolute; ${pos==='top'?'top':'bottom'}:2px;">${idx+1}</div>`;

        if (pt && pt.count > 0) {
            const color = pt.owner === 'player' ? 'white' : '#2a1500';
            const border = pt.owner === 'player' ? '#999' : '#8B4513';
            const show = Math.min(pt.count, 5);
            for (let i = 0; i < show; i++) {
                h += `<div style="width:28px; height:28px; border-radius:50%; background:${color}; border:2px solid ${border}; display:flex; align-items:center; justify-content:center; font-size:0.6rem; color:${pt.owner==='player'?'#333':'#f5deb3'}; font-weight:bold;">`;
                if (i === show - 1 && pt.count > 5) h += pt.count;
                h += `</div>`;
            }
        }

        // Snášení — kliknutí na pole v domácí čtvrtině
        if (this.currentTurn === 'player' && this.canBearOff('player') && isPlayerPt && idx <= 5) {
            h = h.replace(`onclick="${canSelect || canTarget ? `BackgammonGame.selectPoint(${idx})` : ''}"`,
                `onclick="BackgammonGame.bearOff(${idx})"`);
        }

        h += `</div>`;
        return h;
    },

    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('backgammon-modal');
        if (modal) modal.remove();
    },

    showRules: function() {
        let modal = document.getElementById('backgammon-rules-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'backgammon-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        }
        let h = '<div class="game-modal-content" style="max-width:600px;">';
        h += `<button class="game-modal-close" onclick="document.getElementById('backgammon-rules-modal').remove()">×</button>`;
        h += `<div style="background:var(--bg-card); padding:20px; border-radius:8px;">`;
        h += `<h2 style="margin-bottom:15px; color:var(--ink-primary);">${t('games.backgammonRulesTitle')}</h2>`;
        h += `<h3 style="margin-top:15px;">${t('games.backgammonRulesHistoryTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.backgammonRulesHistoryText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.backgammonRulesGoalTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.backgammonRulesGoalText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.backgammonRulesMoveTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.backgammonRulesMoveText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.backgammonRulesHitTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.backgammonRulesHitText')}</p>`;
        h += `</div></div>`;
        modal.innerHTML = h;
    }
};
