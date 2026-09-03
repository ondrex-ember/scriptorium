// ═══════════════════════════════════════════════════════════════════════════════
// SOKOBAN — Knihovní uspořádání (Ars Bibliothecae)
// Středověký logický hlavolam pro Aula Ludi v klášterní knihovně.
// ═══════════════════════════════════════════════════════════════════════════════

const SokobanGame = {
    gameActive: false,
    currentLevel: 0,
    moves: 0,
    pushes: 0,
    score: 0,
    history: [],
    keyboardBound: false,

    // ── Komnaty knihovny ───────────────────────────────────────────────────────
    levels: [
        {
            name: "Komnata I — Skriptorium začátečníků",
            name_en: "Chamber I — Novitiate Scriptorium",
            desc: "Uspořádej základní liturgické a studijní svazky na jejich pulty.",
            desc_en: "Arrange the basic liturgical and study codices onto their lecterns.",
            grid: [
                ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
                ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'floor', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
                ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
            ],
            playerStart: { r: 2, c: 2 },
            books: [
                { id: "b1", title: "Kancionál", icon: "📖", category: "liturgy", r: 2, c: 3 },
                { id: "b2", title: "Žaltář", icon: "📜", category: "theology", r: 3, c: 3 },
                { id: "b3", title: "Herbář", icon: "🌿", category: "herbalism", r: 4, c: 4 },
                { id: "b4", title: "Breviář", icon: "🕯️", category: "history", r: 2, c: 5 }
            ],
            targets: [
                { r: 1, c: 5, icon: "📖", category: "liturgy" },
                { r: 1, c: 6, icon: "📜", category: "theology" },
                { r: 4, c: 5, icon: "🌿", category: "herbalism" },
                { r: 4, c: 6, icon: "🕯️", category: "history" }
            ]
        },
        {
            name: "Komnata II — Knihovní krypta & Herbář",
            name_en: "Chamber II — Monastic Crypt & Herbal Lore",
            desc: "Starobylé sloupy a úzké uličky. Knihy nelze odtahovat od zdi!",
            desc_en: "Ancient pillars and tight aisles. Books cannot be pulled from walls!",
            grid: [
                ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
                ['wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
                ['wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
                ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
            ],
            playerStart: { r: 3, c: 1 },
            books: [
                { id: "b1", title: "Hildegarda", icon: "🌿", category: "herbalism", r: 2, c: 3 },
                { id: "b2", title: "Materia Medica", icon: "📜", category: "theology", r: 3, c: 3 },
                { id: "b3", title: "Geometria", icon: "📐", category: "science", r: 4, c: 3 },
                { id: "b4", title: "Antifonář", icon: "📖", category: "liturgy", r: 3, c: 5 },
                { id: "b5", title: "Chronicon", icon: "🕯️", category: "history", r: 4, c: 5 }
            ],
            targets: [
                { r: 1, c: 7, icon: "🌿", category: "herbalism" },
                { r: 2, c: 7, icon: "📜", category: "theology" },
                { r: 3, c: 7, icon: "📐", category: "science" },
                { r: 4, c: 7, icon: "📖", category: "liturgy" },
                { r: 5, c: 7, icon: "🕯️", category: "history" }
            ]
        },
        {
            name: "Komnata III — Sanctum Arcanum",
            name_en: "Chamber III — Sanctum Arcanum",
            desc: "Nejposvátnější trezor iluminovaných rukopisů. Vyžaduje absolutní soustředění.",
            desc_en: "The most sacred vault of illuminated codices. Requires absolute mastery.",
            grid: [
                ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
                ['wall', 'floor', 'wall', 'wall', 'floor', 'floor', 'wall', 'wall', 'floor', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
                ['wall', 'floor', 'wall', 'floor', 'wall', 'wall', 'floor', 'wall', 'floor', 'wall'],
                ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
                ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
            ],
            playerStart: { r: 3, c: 4 },
            books: [
                { id: "b1", title: "Zlatá Bula", icon: "👑", category: "royalty", r: 3, c: 2 },
                { id: "b2", title: "Codex Gigas", icon: "📖", category: "liturgy", r: 3, c: 3 },
                { id: "b3", title: "Tabulae Alphonsinae", icon: "✨", category: "astronomy", r: 3, c: 6 },
                { id: "b4", title: "Corpus Hermeticum", icon: "📜", category: "theology", r: 3, c: 7 },
                { id: "b5", title: "Ars Magna", icon: "📐", category: "science", r: 1, c: 4 },
                { id: "b6", title: "Florarium Monasticum", icon: "🌿", category: "herbalism", r: 5, c: 4 }
            ],
            targets: [
                { r: 1, c: 1, icon: "👑", category: "royalty" },
                { r: 1, c: 8, icon: "✨", category: "astronomy" },
                { r: 3, c: 1, icon: "📖", category: "liturgy" },
                { r: 3, c: 8, icon: "📜", category: "theology" },
                { r: 5, c: 1, icon: "📐", category: "science" },
                { r: 5, c: 8, icon: "🌿", category: "herbalism" }
            ]
        }
    ],

    // ── Spuštění hry ──────────────────────────────────────────────────────────
    start: function(lvlIdx = 0) {
        // Kontrola inventáře podle zvyklostí Scriptorium
        if (typeof GameState !== 'undefined' && GameState.inventory) {
            if (!GameState.inventory.sokoban_scroll || GameState.inventory.sokoban_scroll < 1) {
                if (typeof UI !== 'undefined' && UI.notify) {
                    UI.notify(typeof t === 'function' ? t('games.sokobanNeedScroll') : 'Nemáš Knihovní plán (sokoban_scroll)!', true);
                }
                return;
            }
        }

        this.gameActive = true;
        this.loadLevel(lvlIdx);
        this.bindKeyboard();
        this.render();
    },

    loadLevel: function(lvlIdx) {
        this.currentLevel = Math.max(0, Math.min(lvlIdx, this.levels.length - 1));
        const lvl = this.levels[this.currentLevel];
        this.playerPos = { ...lvl.playerStart };
        this.playerDir = 'down';
        this.books = lvl.books.map(b => ({ ...b }));
        this.moves = 0;
        this.pushes = 0;
        this.history = [];
    },

    // ── Pohyb mnicha & Tlačení knih ───────────────────────────────────────────
    move: function(dir) {
        if (!this.gameActive) return;

        let dr = 0, dc = 0;
        if (dir === 'up') dr = -1;
        if (dir === 'down') dr = 1;
        if (dir === 'left') dc = -1;
        if (dir === 'right') dc = 1;

        this.playerDir = dir;

        const nextR = this.playerPos.r + dr;
        const nextC = this.playerPos.c + dc;
        const lvl = this.levels[this.currentLevel];
        const grid = lvl.grid;

        // Kontrola hranic
        if (nextR < 0 || nextR >= grid.length || nextC < 0 || nextC >= grid[0].length) return;

        // Zeď před mnichem
        if (grid[nextR][nextC] === 'wall') return;

        // Je na cílovém poli kniha?
        const bookIndex = this.books.findIndex(b => b.r === nextR && b.c === nextC);

        if (bookIndex !== -1) {
            // Pokus o potlačení knihy (TLAČIT, NIKOLI TÁHNOUT)
            const pushR = nextR + dr;
            const pushC = nextC + dc;

            // Kontrola hranic pro knihu
            if (pushR < 0 || pushR >= grid.length || pushC < 0 || pushC >= grid[0].length) return;

            // Zeď za knihou
            if (grid[pushR][pushC] === 'wall') return;

            // Jiná kniha za touto knihou (dvě knihy za sebou nelze tlačit)
            const isBlockedByBook = this.books.some(b => b.r === pushR && b.c === pushC);
            if (isBlockedByBook) return;

            // Ulož stav pro Zpět (Undo)
            this.history.push({
                playerPos: { ...this.playerPos },
                playerDir: this.playerDir,
                books: this.books.map(b => ({ ...b })),
                moves: this.moves,
                pushes: this.pushes
            });

            // Posun knihy i hráče
            this.books[bookIndex].r = pushR;
            this.books[bookIndex].c = pushC;
            this.playerPos = { r: nextR, c: nextC };
            this.moves++;
            this.pushes++;

            this.checkWin();
        } else {
            // Pouhý krok hráče
            this.history.push({
                playerPos: { ...this.playerPos },
                playerDir: this.playerDir,
                books: this.books.map(b => ({ ...b })),
                moves: this.moves,
                pushes: this.pushes
            });

            this.playerPos = { r: nextR, c: nextC };
            this.moves++;
        }

        this.render();
    },

    // ── Návrat tahu (Undo) ───────────────────────────────────────────────────
    undo: function() {
        if (!this.gameActive || this.history.length === 0) return;
        const prev = this.history.pop();
        this.playerPos = prev.playerPos;
        this.playerDir = prev.playerDir;
        this.books = prev.books;
        this.moves = prev.moves;
        this.pushes = prev.pushes;
        this.render();
    },

    // ── Restart komnaty ──────────────────────────────────────────────────────
    reset: function() {
        if (!this.gameActive) return;
        this.loadLevel(this.currentLevel);
        this.render();
    },

    // ── Kontrola vítězství v komnatě ──────────────────────────────────────────
    checkWin: function() {
        const lvl = this.levels[this.currentLevel];
        const allPlaced = this.books.every(b => {
            return lvl.targets.some(t => t.r === b.r && t.c === b.c && t.category === b.category);
        });

        if (allPlaced) {
            setTimeout(() => {
                this.onLevelComplete();
            }, 300);
        }
    },

    onLevelComplete: function() {
        // Vigor regenerace podle Scriptorium standardu
        if (typeof VigorSystem !== 'undefined' && VigorSystem.restFromPlay) {
            VigorSystem.restFromPlay();
        }

        // Zápisky a lore do GameState
        if (typeof GameState !== 'undefined') {
            GameState.notes = (GameState.notes || 0) + 15;
            if (typeof UI !== 'undefined' && UI.notify) {
                const msg = typeof t === 'function' ? t('games.sokobanWon') : 'Komnata uspořádána! +15 Zápisků a zotavení.';
                UI.notify('📚 ' + msg);
            }
        }

        if (this.currentLevel < this.levels.length - 1) {
            if (confirm(`🎉 Komnata ${this.currentLevel + 1} úspěšně roztříděna!\nChceš přejít do další komnaty knihovny?`)) {
                this.loadLevel(this.currentLevel + 1);
                this.render();
            }
        } else {
            alert(`🏆 Všechny komnaty klášterní knihovny jsou vzorně uspořádány!\nDokončeno celkem na ${this.moves} tahů.\nBratr knihovník vyjadřuje hlubokou úctu tvému důvtipu.`);
            this.close();
        }
    },

    // ── Klávesové ovládání ────────────────────────────────────────────────────
    bindKeyboard: function() {
        if (this.keyboardBound) return;
        this.keyboardBound = true;

        this._keyHandler = (e) => {
            if (!this.gameActive) return;

            // Zákaz scrollování stránky šipkami při hře
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }

            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.move('up');
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.move('down');
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.move('left');
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.move('right');
                    break;
                case 'KeyZ':
                    this.undo();
                    break;
                case 'KeyR':
                    this.reset();
                    break;
                case 'Escape':
                    this.close();
                    break;
            }
        };

        window.addEventListener('keydown', this._keyHandler);
    },

    unbindKeyboard: function() {
        if (this.keyboardBound && this._keyHandler) {
            window.removeEventListener('keydown', this._keyHandler);
            this.keyboardBound = false;
        }
    },

    // ── Vykreslení modálního okna Scriptorium ─────────────────────────────────
    render: function() {
        let modal = document.getElementById('sokoban-modal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sokoban-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content" style="max-width: 680px; width: 95%;">
                    <button class="game-modal-close" onclick="SokobanGame.close()">×</button>
                    <div id="sokoban-game-content"></div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) SokobanGame.close();
            });
        }

        const container = document.getElementById('sokoban-game-content');
        if (!container) return;

        const lvl = this.levels[this.currentLevel];
        const grid = lvl.grid;

        // Spočítat umístěné knihy
        const placedCount = this.books.filter(b => {
            return lvl.targets.some(t => t.r === b.r && t.c === b.c && t.category === b.category);
        }).length;

        let h = '<div style="background: var(--bg-card, #f4ecd6); padding: 18px; border-radius: 8px; color: var(--ink-primary, #2c1a0e);">';

        // Hlavička
        h += `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color, #c5a059); padding-bottom:8px; margin-bottom:12px;">
                <div>
                    <h3 style="margin:0; font-family:'Cinzel',serif; color:var(--ink-primary, #2c1a0e);">📚 ${lvl.name}</h3>
                    <div style="font-size:0.8rem; opacity:0.8; font-style:italic;">${lvl.desc}</div>
                </div>
                <div style="display:flex; gap:12px; font-size:0.9rem; font-weight:bold;">
                    <span>Tahy: ${this.moves}</span>
                    <span style="color:var(--accent-wax, #8b3a2b);">Uloženo: ${placedCount}/${this.books.length}</span>
                </div>
            </div>
        `;

        // Výběr komnaty
        h += '<div style="display:flex; gap:6px; margin-bottom:10px;">';
        this.levels.forEach((l, idx) => {
            const active = idx === this.currentLevel;
            h += `<button class="craft-btn" onclick="SokobanGame.loadLevel(${idx}); SokobanGame.render();" style="flex:1; padding:5px 8px; font-size:0.75rem; ${active ? 'background:var(--accent-gold, #c5a059); font-weight:bold;' : 'opacity:0.75;'}">Komnata ${idx + 1}</button>`;
        });
        h += '</div>';

        // Hrací plocha (Sokoban Grid)
        h += `<div style="display:inline-grid; grid-template-columns: repeat(${grid[0].length}, 42px); grid-template-rows: repeat(${grid.length}, 42px); gap: 2px; margin: 10px auto; padding: 10px; background: rgba(0,0,0,0.08); border: 2px solid var(--accent-gold, #c5a059); border-radius: 8px; justify-content:center; box-shadow:inset 0 0 10px rgba(0,0,0,0.15);">`;

        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[0].length; c++) {
                const cell = grid[r][c];
                const isWall = cell === 'wall';
                const isPlayer = this.playerPos.r === r && this.playerPos.c === c;
                const book = this.books.find(b => b.r === r && b.c === c);
                const target = lvl.targets.find(t => t.r === r && t.c === c);

                let bg = 'rgba(255,255,255,0.4)';
                let border = '1px solid rgba(197,160,89,0.2)';
                let content = '';

                if (isWall) {
                    bg = 'linear-gradient(135deg, #423122, #2a1f16)';
                    border = '1px solid #1a120b';
                    content = '<span style="font-size:16px; opacity:0.35;">🧱</span>';
                } else if (target && !book && !isPlayer) {
                    bg = 'rgba(197,160,89,0.25)';
                    border = '2px dashed var(--accent-gold, #c5a059)';
                    content = `<span style="font-size:18px; opacity:0.85;">${target.icon}</span>`;
                }

                if (book) {
                    const onTarget = target && target.category === book.category;
                    const bookBg = onTarget 
                        ? 'linear-gradient(135deg, #2e7d32, #1b5e20)' 
                        : 'linear-gradient(135deg, #8a3324, #5a1c12)';
                    content = `
                        <div style="width:36px; height:36px; background:${bookBg}; border:1.5px solid #ffd700; border-radius:6px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); color:#fff; font-size:16px;" title="${book.title}">
                            ${book.icon}
                        </div>
                    `;
                } else if (isPlayer) {
                    content = `
                        <div style="width:36px; height:36px; background:linear-gradient(135deg, #c5a059, #8c6d37); border:1.5px solid #fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px #ffd700; font-size:20px;">
                            🧙‍♂️
                        </div>
                    `;
                }

                h += `
                    <div style="width:42px; height:42px; background:${bg}; border:${border}; border-radius:4px; display:flex; align-items:center; justify-content:center; position:relative;">
                        ${content}
                    </div>
                `;
            }
        }
        h += '</div>';

        // Tlačítka tahů & D-Pad
        h += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; gap:10px;">
                <div style="display:flex; gap:6px;">
                    <button class="craft-btn" onclick="SokobanGame.undo()" style="background:var(--accent-gold, #c5a059); padding:6px 12px; font-size:0.85rem;">↩️ Zpět (Z)</button>
                    <button class="craft-btn" onclick="SokobanGame.reset()" style="background:var(--accent-wax, #8b3a2b); padding:6px 12px; font-size:0.85rem;">🔄 Restart (R)</button>
                    <button class="craft-btn" onclick="SokobanGame.showRules()" style="padding:6px 12px; font-size:0.85rem;">📜 Pravidla</button>
                </div>

                <!-- Dotykový D-Pad pro mobily -->
                <div style="display:grid; grid-template-columns:repeat(3, 34px); grid-template-rows:repeat(2, 30px); gap:3px;">
                    <div></div>
                    <button class="craft-btn" onclick="SokobanGame.move('up')" style="padding:0; line-height:28px;">▲</button>
                    <div></div>
                    <button class="craft-btn" onclick="SokobanGame.move('left')" style="padding:0; line-height:28px;">◀</button>
                    <button class="craft-btn" onclick="SokobanGame.move('down')" style="padding:0; line-height:28px;">▼</button>
                    <button class="craft-btn" onclick="SokobanGame.move('right')" style="padding:0; line-height:28px;">▶</button>
                </div>
            </div>
            <div style="font-size:0.75rem; opacity:0.65; margin-top:8px; text-align:center;">
                Klávesy: Šipky / WASD • Krok zpět: Z • Restart komnaty: R • Pozor: knihy lze pouze TLAČIT!
            </div>
        `;

        h += '</div>';
        container.innerHTML = h;
    },

    // ── Zavření modálu ────────────────────────────────────────────────────────
    close: function() {
        this.gameActive = false;
        this.unbindKeyboard();
        const modal = document.getElementById('sokoban-modal');
        if (modal) modal.remove();
    },

    // ── Okno s pravidly ───────────────────────────────────────────────────────
    showRules: function() {
        let modal = document.getElementById('sokoban-rules-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sokoban-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        }

        let h = '<div class="game-modal-content" style="max-width:600px;">';
        h += `<button class="game-modal-close" onclick="document.getElementById('sokoban-rules-modal').remove()">×</button>`;
        h += '<div style="background:var(--bg-card, #f4ecd6); padding:20px; border-radius:8px; color:var(--ink-primary, #2c1a0e);">';
        h += `<h2 style="margin-bottom:15px; color:var(--ink-primary, #2c1a0e); font-family:'Cinzel',serif;">📚 Knihovní uspořádání (Ars Bibliothecae)</h2>`;
        
        h += `<h3 style="margin-top:15px; font-size:1.05rem;">📜 Historie a posvátný úkol</h3>`;
        h += `<p style="opacity:0.9; font-size:0.9rem; line-height:1.4;">V klášterní knihovně se po bouři promíchaly vzácné kodexy, herbáře a liturgické zpěvníky. Bratr knihovník byl pověřen mistrem Pécuchetem, aby každý svazek navrátil na odpovídající osvětlený čtecí pult.</p>`;

        h += `<h3 style="margin-top:15px; font-size:1.05rem;">❓ Lze knihu odtáhnout od zdi?</h3>`;
        h += `<p style="opacity:0.9; font-size:0.9rem; line-height:1.4; background:rgba(138,51,36,0.1); border-left:3px solid var(--accent-wax, #8a3324); padding:8px 12px; border-radius:4px;"><strong>Ne!</strong> Podle starobylých pravidel skladnických hlavolamů (Sokoban) lze těžké vázané kodexy pouze <strong>TLAČIT</strong> před sebou. Pokud knihu natlačíte k rovné stěně nebo do rohu, nelze ji odtáhnout zpět. Kdykoli uvíznete, využijte tlačítko <strong>Zpět (Undo / klávesa Z)</strong> nebo restartujte komnatu (R).</p>`;

        h += `<h3 style="margin-top:15px; font-size:1.05rem;">🎯 Pravidla řazení</h3>`;
        h += `<ul style="opacity:0.9; font-size:0.88rem; line-height:1.5; padding-left:20px;">
            <li>Každá kniha patří na pult se stejným symbolem (📖 Liturgie, 📜 Teologie, 🌿 Herbář, 🕯️ Dějiny, 📐 Vědy, 👑 Výnosy).</li>
            <li>Správně uložená kniha se rozzáří zeleným iluminovaným lemem.</li>
            <li>Nelze tlačit dvě knihy za sebou naráz.</li>
            <li>Po vyřešení komnaty získá bratr odpočinek (regenerace Vigor) a +15 Zápisků.</li>
        </ul>`;

        h += '</div></div>';
        modal.innerHTML = h;
    }
};

if (typeof window !== 'undefined') {
    window.SokobanGame = SokobanGame;
}
