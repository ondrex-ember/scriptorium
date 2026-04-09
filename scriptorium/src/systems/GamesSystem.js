// ═══════════════════════════════════════════════════════════════════════════════
// GAMES SYSTEM — Aula Ludi
// Renders mini-games tab in Library (tech_games required)
// ═══════════════════════════════════════════════════════════════════════════════

const GamesSystem = {

    render: function() {
        const el = document.getElementById('library-games-content');
        if (!el) return;

        // Check tech unlock
        const hasTech = GameState.researchedTechs.includes('tech_games');

        if (!hasTech) {
            el.innerHTML = `<div style="padding:20px; background:rgba(0,0,0,0.05); border-radius:8px; text-align:center;">
                <div style="font-size:3rem; opacity:0.3; margin-bottom:10px;">🔒</div>
                <strong>${t('library.locked')}</strong>
                <p style="margin-top:10px; opacity:0.7;">${t('library.records_hint')}</p>
            </div>`;
            return;
        }

        let h = '';
        h += `<h2 style="margin-bottom: 20px; color: var(--ink-primary);">${t('games.title')}</h2>`;
        h += '<div class="games-grid">';

        // Memory Game
        const hasCards = GameState.inventory['playing_cards'] > 0;
        h += `<div class="game-card">`;
        h += `<span class="game-icon">🎴</span>`;
        h += `<div class="game-title">${t('games.memoryName')}</div>`;
        h += `<div class="game-desc">${t('games.memoryDesc')}</div>`;
        if (hasCards) {
            h += `<button class="craft-btn" onclick="MemoryGame.start()">${t('games.btnPlay')}</button>`;
        } else {
            h += `<div class="game-unlock-text">${t('games.memoryCraft')}</div>`;
        }
        h += `</div>`;

        // Royal Game of Ur
        const hasUrBoard = GameState.inventory['ur_board'] > 0;
        const hasUrTech = GameState.researchedTechs.includes('tech_ur_game');
        h += `<div class="game-card ${hasUrTech ? '' : 'locked'}">`;
        if (!hasUrTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🎲</span>`;
        h += `<div class="game-title">${t('games.urName')}</div>`;
        h += `<div class="game-desc">${t('games.urDesc')}</div>`;
        if (!hasUrTech) {
            h += `<div class="game-unlock-text">${t('games.urTech')}</div>`;
        } else if (!hasUrBoard) {
            h += `<div class="game-unlock-text">${t('games.urCraft')}</div>`;
        } else {
            h += `<button class="craft-btn" onclick="RoyalGameOfUr.start()">${t('games.urPlayVsAI')}</button>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.start()" style="background: var(--accent-gold);">${t('games.urPlaySolo')}</button>`;
        }
        h += `</div>`;

        // Primero
        const hasPrimero = GameState.inventory['primero_deck'] > 0;
        const hasPrimeroTech = GameState.researchedTechs.includes('tech_primero');
        h += `<div class="game-card ${hasPrimeroTech ? '' : 'locked'}">`;
        if (!hasPrimeroTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🃏</span>`;
        h += `<div class="game-title">${t('games.primeroName')}</div>`;
        h += `<div class="game-desc">${t('games.primeroDesc')}</div>`;
        if (!hasPrimeroTech) {
            h += `<div class="game-unlock-text">${t('games.primeroTech')}</div>`;
        } else if (!hasPrimero) {
            h += `<div class="game-unlock-text">${t('games.primeroCraft')}</div>`;
        } else {
            h += `<button class="craft-btn" onclick="PrimeroGame.start()">${t('games.btnPlay')}</button>`;
        }
        h += `</div>`;

        // Karnöffel
        const hasKarnoffel = GameState.inventory['karnoffel_deck'] > 0;
        const hasKarnoffelTech = GameState.researchedTechs.includes('tech_karnoffel');
        h += `<div class="game-card ${hasKarnoffelTech ? '' : 'locked'}">`;
        if (!hasKarnoffelTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🎴</span>`;
        h += `<div class="game-title">${t('games.karnoffelName')}</div>`;
        h += `<div class="game-desc">${t('games.karnoffelDesc')}</div>`;
        if (!hasKarnoffelTech) {
            h += `<div class="game-unlock-text">${t('games.karnoffelTech')}</div>`;
        } else if (!hasKarnoffel) {
            h += `<div class="game-unlock-text">${t('games.karnoffelCraft')}</div>`;
        } else {
            h += `<button class="craft-btn" onclick="KarnoffelGame.start()">${t('games.btnPlay')}</button>`;
        }
        h += `</div>`;

        // FreeCell
        const hasFrenchDeck = GameState.inventory['french_deck'] > 0;
        const hasFreeCellTech = GameState.researchedTechs.includes('tech_freecell');
        h += `<div class="game-card ${hasFreeCellTech ? '' : 'locked'}">`;
        if (!hasFreeCellTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🂡</span>`;
        h += `<div class="game-title">${t('games.freecellName')}</div>`;
        h += `<div class="game-desc">${t('games.freecellDesc')}</div>`;
        if (!hasFreeCellTech) {
            h += `<div class="game-unlock-text">${t('games.freecellTech')}</div>`;
        } else if (!hasFrenchDeck) {
            h += `<div class="game-unlock-text">${t('games.freecellCraft')}</div>`;
        } else {
            h += `<button class="craft-btn" onclick="FreeCellGame.start()">${t('games.btnPlay')}</button>`;
        }
        h += `</div>`;

        // Rithmomachia
        const hasRithmo = GameState.inventory['rithmomachia_board'] > 0;
        const hasRithmoTech = GameState.researchedTechs.includes('tech_rithmomachia');
        h += `<div class="game-card ${hasRithmoTech ? '' : 'locked'}">`;
        if (!hasRithmoTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🔢</span>`;
        h += `<div class="game-title">${t('games.rithmoName')}</div>`;
        h += `<div class="game-desc">${t('games.rithmoDesc')}</div>`;
        if (!hasRithmoTech) {
            h += `<div class="game-unlock-text">${t('games.rithmoTech')}</div>`;
        } else if (!hasRithmo) {
            h += `<div class="game-unlock-text">${t('games.rithmoCraft')}</div>`;
        } else {
            h += `<button class="craft-btn" onclick="Rithmomachia.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="Rithmomachia.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        h += '</div>'; // Close games-grid
        el.innerHTML = h;

        // Initialize game renders if active
        if (hasUrBoard) {
            if (RoyalGameOfUr.gameActive) RoyalGameOfUr.render();
            if (RoyalGameOfUrSolo.gameActive) RoyalGameOfUrSolo.render();
        }
        if (hasPrimero && PrimeroGame.gameActive) PrimeroGame.render();
        if (hasKarnoffel && KarnoffelGame.gameActive) KarnoffelGame.render();
        if (hasFrenchDeck && FreeCellGame.gameActive) FreeCellGame.render();
        if (hasRithmo && Rithmomachia.gameActive) Rithmomachia.render();
    }
};