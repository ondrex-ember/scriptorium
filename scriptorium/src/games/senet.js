// ═══════════════════════════════════════════════════════════════════════════════
// SENET — Hra Faraonů (3100 př.n.l.)
// Nejstarší desková hra světa. 30 polí, 5 kamenů, 4 hůlky-kostky.
// ═══════════════════════════════════════════════════════════════════════════════

const SenetGame = {
    gameActive: false,
    currentTurn: 'player', // 'player' | 'ai'
    diceRoll: 0,
    canMove: false,
    selectedPiece: null,
    lastMessage: '',

    // 5 kamenů pro každého hráče, pozice -1 = ještě nevstoupilo
    playerPieces: [], // pozice 0–29, 30 = venku
    aiPieces: [],

    // Speciální pole (0-indexed)
    HOUSE_OF_REBIRTH: 14,   // pole 15 — kámen se musí zastavit
    DANGER_SQUARES: [26, 27, 28], // pole 27–29 — návrat na start
    EXIT_SQUARE: 29,        // pole 30 — výstup

    start: function() {
        if (!GameState.inventory.senet_board || GameState.inventory.senet_board < 1) {
            UI.notify(t('games.senetNeedBoard'), true);
            return;
        }

        this.gameActive = true;
        this.currentTurn = 'player';
        this.diceRoll = 0;
        this.canMove = false;
        this.selectedPiece = null;
        this.lastMessage = t('games.senetLabelYourTurn');

        this.playerPieces = [];
        this.aiPieces = [];
        for (let i = 0; i < 5; i++) {
            // Střídavé startovní pozice (historicky přesné)
            this.playerPieces.push({ id: i, pos: i * 2, out: false });
            this.aiPieces.push({ id: i, pos: i * 2 + 1, out: false });
        }

        this.render();
    },

    // ── Hůlky-kostky ──────────────────────────────────────────────────────────
    // 4 hůlky: každá bílá=1, tmavá=0. Součet bílých = kroky.
    // Výjimka: 0 bílých = 5 kroků (historické pravidlo)
    rollSticks: function() {
        if (!this.gameActive || this.currentTurn !== 'player') return;
        if (this.canMove) return; // čekáme na výběr kamene

        const sticks = [0, 0, 0, 0].map(() => Math.random() < 0.5 ? 1 : 0);
        const whites = sticks.reduce((a, b) => a + b, 0);
        this.diceRoll = whites === 0 ? 5 : whites;
        this.canMove = true;
        this.lastMessage = `🎲 ${this.diceRoll} ${this.diceRoll === 5 ? '(4 tmavé = 5!)' : ''}`;

        // Zkontroluj jestli má hráč možný tah
        if (!this.hasValidMove('player')) {
            this.lastMessage += ' — Žádný možný tah, přechází na AI.';
            this.canMove = false;
            setTimeout(() => this.aiTurn(), 1200);
        }

        this.render();
    },

    castValue: function() {
        const whites = [0,0,0,0].map(() => Math.random() < 0.5 ? 1 : 0).reduce((a,b) => a+b, 0);
        return whites === 0 ? 5 : whites;
    },

    // ── Pohyb ─────────────────────────────────────────────────────────────────
    selectPiece: function(pieceId) {
        if (!this.gameActive || !this.canMove || this.currentTurn !== 'player') return;

        const piece = this.playerPieces.find(p => p.id === pieceId);
        if (!piece || piece.out) return;

        const newPos = piece.pos + this.diceRoll;

        if (!this.isValidMove(piece, newPos, 'player')) {
            this.lastMessage = '⚠️ ' + t('games.senetRulesSpecialText').substring(0, 30) + '...';
            this.render();
            return;
        }

        this.movePiece(piece, newPos, 'player');
    },

    isValidMove: function(piece, newPos, side) {
        if (newPos > 30) return false; // přestřelení

        // Pole 15 (HOUSE_OF_REBIRTH) — musí se zastavit
        if (piece.pos < this.HOUSE_OF_REBIRTH && newPos > this.HOUSE_OF_REBIRTH) return false;

        // Cílové pole obsazené vlastním kamenem?
        const ownPieces = side === 'player' ? this.playerPieces : this.aiPieces;
        if (newPos < 30 && ownPieces.some(p => p.pos === newPos && !p.out)) return false;

        return true;
    },

    hasValidMove: function(side) {
        const pieces = side === 'player' ? this.playerPieces : this.aiPieces;
        return pieces.some(p => !p.out && this.isValidMove(p, p.pos + this.diceRoll, side));
    },

    movePiece: function(piece, newPos, side) {
        const oppPieces = side === 'player' ? this.aiPieces : this.playerPieces;

        // Výstup z desky
        if (newPos === 30) {
            piece.out = true;
            piece.pos = 30;
            this.lastMessage = `✅ Kámen ${piece.id + 1} opustil desku!`;
            this.checkWin();
            if (this.gameActive) this.endTurn(side);
            this.render();
            return;
        }

        // Nebezpečná pole — návrat na start (pole 0)
        if (this.DANGER_SQUARES.includes(newPos)) {
            piece.pos = newPos;
            // Pokud na nebezpečném poli stojí soupeř, prohodí se
            const opp = oppPieces.find(p => p.pos === newPos && !p.out);
            if (opp) {
                opp.pos = piece.pos; // soupeř jde na původní pozici
                this.lastMessage = `⚔️ Výměna kamenů na nebezpečném poli!`;
            } else {
                // Bez soupeře — nebezpečné pole pošle zpět na HOUSE_OF_REBIRTH
                piece.pos = this.HOUSE_OF_REBIRTH;
                this.lastMessage = `💀 Nebezpečné pole! Kámen se vrací na pole 15.`;
            }
            this.endTurn(side);
            this.render();
            return;
        }

        // Obsazené pole soupeřem — výměna (pokud není chráněné = dva vedle sebe)
        const opp = oppPieces.find(p => p.pos === newPos && !p.out);
        if (opp) {
            const oppProtected = oppPieces.filter(p => !p.out).some(p => 
                p.id !== opp.id && Math.abs(p.pos - opp.pos) === 1
            );
            if (!oppProtected) {
                opp.pos = piece.pos; // výměna
                this.lastMessage = `⚔️ Zajmutí! Soupeřův kámen odeslán zpět.`;
            } else {
                this.lastMessage = '🛡️ Soupeřův kámen je chráněn!';
                this.render();
                return;
            }
        }

        piece.pos = newPos;
        if (!this.lastMessage.includes('⚔️')) this.lastMessage = `→ Kámen přesunut na pole ${newPos + 1}.`;

        this.endTurn(side);
        this.render();
    },

    endTurn: function(side) {
        this.canMove = false;
        this.diceRoll = 0;
        this.selectedPiece = null;

        if (!this.gameActive) return;

        if (side === 'player') {
            this.currentTurn = 'ai';
            this.lastMessage = t('games.senetLabelAiTurn');
            setTimeout(() => this.aiTurn(), 1000);
        } else {
            this.currentTurn = 'player';
            this.lastMessage = t('games.senetLabelYourTurn');
        }
    },

    // ── AI ────────────────────────────────────────────────────────────────────
    aiTurn: function() {
        if (!this.gameActive || this.currentTurn !== 'ai') return;

        const roll = this.castValue();
        this.diceRoll = roll;

        const validPieces = this.aiPieces.filter(p => 
            !p.out && this.isValidMove(p, p.pos + roll, 'ai')
        );

        if (validPieces.length === 0) {
            this.lastMessage = `AI hodilo ${roll} — žádný tah, přechod na hráče.`;
            this.currentTurn = 'player';
            this.diceRoll = 0;
            setTimeout(() => { this.lastMessage = t('games.senetLabelYourTurn'); this.render(); }, 800);
            return;
        }

        // AI strategie: preferovat kameny co jsou nejdál (blíž k výstupu)
        // sekundárně: vyhýbat se nebezpečným polím
        validPieces.sort((a, b) => {
            const newA = a.pos + roll;
            const newB = b.pos + roll;
            // Penalizace nebezpečných polí
            const dangerA = this.DANGER_SQUARES.includes(newA) ? -10 : 0;
            const dangerB = this.DANGER_SQUARES.includes(newB) ? -10 : 0;
            return (newB + dangerB) - (newA + dangerA);
        });

        const chosen = validPieces[0];
        const newPos = chosen.pos + roll;
        this.lastMessage = `AI hodilo ${roll}, táhne kámen z pole ${chosen.pos + 1}.`;
        this.render();

        setTimeout(() => {
            this.movePiece(chosen, newPos, 'ai');
        }, 800);
    },

    // ── Výhra ─────────────────────────────────────────────────────────────────
    checkWin: function() {
        if (this.playerPieces.every(p => p.out)) {
            this.gameActive = false;
            const reward = 5;
            Game.addItem('research', reward);
            if (GameState.achievements) {
                GameState.achievements.stats.totalGamesPlayed++;
                GameState.achievements.stats.totalResearchGained += reward;
            }
            this.lastMessage = t('games.senetWin').replace('{reward}', reward);
            UI.notify(this.lastMessage);
            Game.save();
            return;
        }
        if (this.aiPieces.every(p => p.out)) {
            this.gameActive = false;
            if (GameState.achievements) GameState.achievements.stats.totalGamesPlayed++;
            this.lastMessage = t('games.senetLoss');
            UI.notify(this.lastMessage, true);
            Game.save();
        }
    },

    // ── Render ────────────────────────────────────────────────────────────────
    render: function() {
        let modal = document.getElementById('senet-modal');

        if (!this.gameActive && !modal) return;

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'senet-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content" style="max-width:680px;">
                    <button class="game-modal-close" onclick="SenetGame.close()">×</button>
                    <div id="senet-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) SenetGame.close(); });
        }

        const container = document.getElementById('senet-content');
        if (!container) return;

        let h = `<div style="background:var(--bg-card); padding:15px; border-radius:8px;">`;
        h += `<h3 style="margin:0 0 10px; color:var(--ink-primary);">${t('games.senetTitle')} <span style="font-size:0.7em; opacity:0.6;">— ${t('games.senetSubtitle')}</span></h3>`;

        if (!this.gameActive) {
            h += `<p style="margin:20px 0; opacity:0.8;">${t('games.senetSubtitle')}</p>`;
            h += `<button class="craft-btn" onclick="SenetGame.start()">${t('games.senetBtnPlay')}</button>`;
        } else {
            // Skóre
            const pOut = this.playerPieces.filter(p => p.out).length;
            const aOut = this.aiPieces.filter(p => p.out).length;
            h += `<div style="display:flex; justify-content:space-between; margin-bottom:10px; padding:8px 12px; background:rgba(197,160,89,0.1); border-radius:6px;">`;
            h += `<span>👤 ${t('games.senetLabelYou')}: ${pOut}/5 venku</span>`;
            h += `<span style="font-style:italic; opacity:0.8;">${this.lastMessage}</span>`;
            h += `<span>🤖 AI: ${aOut}/5 venku</span>`;
            h += `</div>`;

            // Deska — 30 polí ve třech řadách po 10 (jako historický Senet)
            // Řada 1: pole 0–9 (zleva doprava)
            // Řada 2: pole 10–19 (zprava doleva — had)
            // Řada 3: pole 20–29 (zleva doprava)
            h += `<div style="display:flex; flex-direction:column; gap:4px; margin:10px 0;">`;

            const rows = [
                [0,1,2,3,4,5,6,7,8,9],
                [19,18,17,16,15,14,13,12,11,10],
                [20,21,22,23,24,25,26,27,28,29]
            ];

            rows.forEach(row => {
                h += `<div style="display:flex; gap:4px;">`;
                row.forEach(sq => {
                    const pHere = this.playerPieces.filter(p => p.pos === sq && !p.out);
                    const aHere = this.aiPieces.filter(p => p.pos === sq && !p.out);

                    // Barva pole
                    let bg = 'rgba(0,0,0,0.05)';
                    let border = '1px solid var(--border-color)';
                    if (sq === this.HOUSE_OF_REBIRTH) { bg = 'rgba(76,175,80,0.2)'; border = '2px solid #4CAF50'; }
                    else if (this.DANGER_SQUARES.includes(sq)) { bg = 'rgba(244,67,54,0.15)'; border = '2px solid #f44336'; }
                    else if (sq === this.EXIT_SQUARE) { bg = 'rgba(197,160,89,0.25)'; border = '2px solid var(--accent-gold)'; }

                    h += `<div style="width:52px; height:52px; ${bg ? `background:${bg};` : ''} border:${border}; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:0.65rem; position:relative;">`;
                    h += `<div style="opacity:0.4; font-size:0.6rem; position:absolute; top:2px; left:3px;">${sq+1}</div>`;

                    // Speciální symboly
                    if (sq === this.HOUSE_OF_REBIRTH) h += `<div style="font-size:0.9rem;">☥</div>`;
                    else if (this.DANGER_SQUARES.includes(sq)) h += `<div style="font-size:0.9rem;">☠</div>`;
                    else if (sq === this.EXIT_SQUARE) h += `<div style="font-size:0.9rem;">🌟</div>`;

                    // Kameny hráče
                    if (pHere.length > 0) {
                        h += `<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:1px;">`;
                        pHere.forEach(p => {
                            const sel = this.selectedPiece === p.id;
                            const clickable = this.canMove && this.currentTurn === 'player' && 
                                             this.isValidMove(p, p.pos + this.diceRoll, 'player');
                            h += `<div onclick="${clickable ? `SenetGame.selectPiece(${p.id})` : ''}" 
                                style="width:14px; height:14px; border-radius:50%; 
                                background:${sel ? 'var(--accent-gold)' : 'white'}; 
                                border:2px solid ${clickable ? 'var(--accent-gold)' : '#999'};
                                cursor:${clickable ? 'pointer' : 'default'};
                                box-shadow:${clickable ? '0 0 4px var(--accent-gold)' : 'none'};"></div>`;
                        });
                        h += `</div>`;
                    }

                    // Kameny AI
                    if (aHere.length > 0) {
                        h += `<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:1px;">`;
                        aHere.forEach(() => {
                            h += `<div style="width:14px; height:14px; border-radius:50%; background:#4a2800; border:2px solid #8B4513;"></div>`;
                        });
                        h += `</div>`;
                    }

                    h += `</div>`;
                });
                h += `</div>`;
            });
            h += `</div>`;

            // Legenda
            h += `<div style="font-size:0.72rem; opacity:0.6; margin:6px 0 10px;">`;
            h += `☥ Dům znovuzrození (pole 15) &nbsp;|&nbsp; ☠ Nebezpečná pole (27–29) &nbsp;|&nbsp; 🌟 Výstup (pole 30)`;
            h += `</div>`;

            // Tlačítko hodu
            if (this.currentTurn === 'player' && !this.canMove) {
                h += `<button class="craft-btn" onclick="SenetGame.rollSticks()" style="margin-right:8px;">${t('games.senetBtnRoll')}</button>`;
            } else if (this.currentTurn === 'player' && this.canMove) {
                h += `<div style="padding:8px 12px; background:rgba(197,160,89,0.15); border-radius:6px; display:inline-block; margin-right:8px;">`;
                h += `🎲 ${t('games.senetBtnRoll')}: <strong>${this.diceRoll}</strong> — klikni na svůj kámen`;
                h += `</div>`;
            } else {
                h += `<div style="padding:8px 12px; background:rgba(0,0,0,0.07); border-radius:6px; display:inline-block; margin-right:8px; opacity:0.7;">`;
                h += `⏳ ${t('games.senetLabelAiTurn')}`;
                h += `</div>`;
            }
            h += `<button class="craft-btn" onclick="SenetGame.start()" style="background:var(--accent-wax); font-size:0.8rem;">${t('games.senetBtnNew')}</button>`;
        }

        h += `</div>`;
        container.innerHTML = h;
    },

    close: function() {
        this.gameActive = false;
        const modal = document.getElementById('senet-modal');
        if (modal) modal.remove();
    },

    showRules: function() {
        let modal = document.getElementById('senet-rules-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'senet-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        }

        let h = '<div class="game-modal-content" style="max-width:600px;">';
        h += `<button class="game-modal-close" onclick="document.getElementById('senet-rules-modal').remove()">×</button>`;
        h += `<div style="background:var(--bg-card); padding:20px; border-radius:8px;">`;
        h += `<h2 style="margin-bottom:15px; color:var(--ink-primary);">${t('games.senetRulesTitle')}</h2>`;
        h += `<h3 style="margin-top:15px;">${t('games.senetRulesHistoryTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.senetRulesHistoryText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.senetRulesGoalTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.senetRulesGoalText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.senetRulesDiceTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.senetRulesDiceText')}</p>`;
        h += `<h3 style="margin-top:15px;">${t('games.senetRulesSpecialTitle')}</h3>`;
        h += `<p style="opacity:0.9;">${t('games.senetRulesSpecialText')}</p>`;
        h += `</div></div>`;
        modal.innerHTML = h;
    }
};
