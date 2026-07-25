// ═══════════════════════════════════════════════════════════════════════════════
// TUTORIAL SYSTEM — Průvodce prvním dnem v klášteře
// Nenucený: nic neblokuje, hráč může kdykoliv přepnout tab/obrazovku.
// Overlay jen "čeká" na cílovém prvku, dokud se hráč nevrátí.
// Ovládání: btn-toggle-tutorial / btn-reset-tutorial v about-modalu (shell.html).
// Stav: GameState.tutorial = { active, step, completed } — persistováno v save.
// ═══════════════════════════════════════════════════════════════════════════════

const TutorialSystem = {

    // Pořadí kroků dle popisku v about-modalu: sběr surovin → nůž → lov tuku
    // → svíčka (výroba+rozsvícení) → první výzkum ve Scriptoriu.
    STEPS: [
        {
            id: 'gather',
            navTarget: '#nav-home',
            target: '#home-scavenge-content',
            text_cs: 'Začni ve Dvoře — nasbírej dřevo a klestí ve výběru akcí níže.',
            text_en: 'Start in the Yard — gather wood and brushwood from the actions below.',
            isDone: function () { return (GameState.inventory['wood'] || 0) >= 5; }
        },
        {
            id: 'knife',
            navTarget: '#nav-craft',
            target: '#craft-filter-stone',
            text_cs: 'Ve Výrobě si vyrob první nůž (Nůž) — budeš ho potřebovat na lov.',
            text_en: 'In Crafting, make your first Stone Knife — you\'ll need it for hunting.',
            isDone: function () { return (GameState.inventory['stone_knife'] || 0) >= 1; }
        },
        {
            id: 'hunt',
            navTarget: '#nav-home',
            target: '#home-scavenge-content',
            text_cs: 'Nastav oko na drobnou zvěř a po úlovku ho zpracuj nožem — získáš tuk.',
            text_en: 'Set a snare for small game, then dress the catch with your knife to get fat.',
            isDone: function () { return (GameState.inventory['fat'] || 0) >= 1; }
        },
        {
            id: 'candle',
            navTarget: '#nav-craft',
            target: '#btn-light-candle',
            text_cs: 'Vyrob svíčku z tuku a provazu, pak ji rozsviť.',
            text_en: 'Craft a candle from fat and rope, then light it.',
            isDone: function () { return !!(GameState.flags && GameState.flags.candleLit); }
        },
        {
            id: 'research',
            navTarget: '#nav-lore',
            target: '#lore-research-content',
            text_cs: 'Otevři Scriptorium a zahaj svůj první výzkum.',
            text_en: 'Open the Scriptorium and start your first research.',
            isDone: function () { return (GameState.researchedTechs || []).length >= 1; }
        }
    ],

    POLL_MS: 1500,
    _pollHandle: null,

    init: function () {
        if (!GameState.tutorial) GameState.tutorial = { active: false, step: 0, completed: false };
        if (GameState.tutorial.active) this._startPolling();
    },

    startTutorialFromModal: function () {
        if (!GameState.tutorial) GameState.tutorial = { active: false, step: 0, completed: false };
        if (GameState.tutorial.completed) {
            GameState.tutorial.step = 0;
            GameState.tutorial.completed = false;
        }
        GameState.tutorial.active = true;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.closeAboutModal) UI.closeAboutModal();
        this._startPolling();
        this.render();
    },

    stopTutorial: function () {
        if (!GameState.tutorial) return;
        GameState.tutorial.active = false;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this._stopPolling();
        this._removeOverlay();
    },

    resetTutorial: function () {
        GameState.tutorial = { active: false, step: 0, completed: false };
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this._stopPolling();
        this._removeOverlay();
        if (typeof UI !== 'undefined' && UI.openAboutModal) UI.openAboutModal();
    },

    _startPolling: function () {
        if (this._pollHandle) return;
        this._pollHandle = setInterval(() => this._tick(), this.POLL_MS);
        this._tick();
    },

    _stopPolling: function () {
        if (this._pollHandle) { clearInterval(this._pollHandle); this._pollHandle = null; }
    },

    _tick: function () {
        if (!GameState.tutorial || !GameState.tutorial.active) return;
        const step = this.STEPS[GameState.tutorial.step];
        if (!step) { this._complete(); return; }
        if (step.isDone()) {
            GameState.tutorial.step++;
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            if (GameState.tutorial.step >= this.STEPS.length) { this._complete(); return; }
        }
        this.render();
    },

    _complete: function () {
        GameState.tutorial.active = false;
        GameState.tutorial.completed = true;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this._stopPolling();
        this._removeOverlay();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (typeof UI !== 'undefined' && UI.notify) {
            UI.notify(lang === 'en' ? '🧭 Tutorial complete!' : '🧭 Tutoriál dokončen!');
        }
    },

    render: function () {
        if (!GameState.tutorial || !GameState.tutorial.active) { this._removeOverlay(); return; }
        const step = this.STEPS[GameState.tutorial.step];
        if (!step) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const text = lang === 'en' ? step.text_en : step.text_cs;

        let el = document.getElementById('tutorial-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'tutorial-overlay';
            document.body.appendChild(el);
        }

        // Cíl na aktuální obrazovce má přednost; pokud není vidět (jiná
        // obrazovka/tab), ukážeme šipku na nav tlačítko, který tam vede.
        const inScreenEl = document.querySelector(step.target);
        const isVisible = inScreenEl && inScreenEl.offsetParent !== null;
        const anchorEl = isVisible ? inScreenEl : document.querySelector(step.navTarget);

        if (!anchorEl) { el.innerHTML = ''; return; }
        const rect = anchorEl.getBoundingClientRect();
        const bubbleTop = rect.bottom + 14;
        const arrowLeft = rect.left + rect.width / 2;
        const bubbleLeft = Math.max(10, Math.min(window.innerWidth - 270, arrowLeft - 130));

        el.innerHTML = `
            <div style="position:fixed; left:${rect.left - 4}px; top:${rect.top - 4}px; width:${rect.width + 8}px; height:${rect.height + 8}px;
                        border:3px solid #ffd700; border-radius:8px; box-shadow:0 0 0 3000px rgba(0,0,0,0.55), 0 0 16px #ffd700;
                        pointer-events:none; z-index:2000; animation: tutorialPulse 1.4s ease-in-out infinite;"></div>
            <div style="position:fixed; left:${arrowLeft - 10}px; top:${rect.bottom}px; width:0; height:0; z-index:2001;
                        border-left:10px solid transparent; border-right:10px solid transparent; border-bottom:12px solid #ffd700;
                        pointer-events:none;"></div>
            <div style="position:fixed; left:${bubbleLeft}px; top:${Math.min(window.innerHeight - 100, bubbleTop)}px; width:260px; z-index:2001;
                        background:#2b2219; color:#f5e6c8; border:2px solid #ffd700; border-radius:8px; padding:12px 14px;
                        font-size:0.85rem; line-height:1.4; box-shadow:0 6px 20px rgba(0,0,0,0.6); font-family:inherit;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <div>${text}</div>
                    <span onclick="TutorialSystem.stopTutorial()" title="${lang === 'en' ? 'Close' : 'Zavřít'}"
                          style="cursor:pointer; opacity:0.7; font-weight:bold;">✕</span>
                </div>
                <div style="margin-top:8px; font-size:0.7rem; opacity:0.6;">${GameState.tutorial.step + 1} / ${this.STEPS.length}</div>
            </div>
            <style>
                @keyframes tutorialPulse {
                    0%, 100% { box-shadow:0 0 0 3000px rgba(0,0,0,0.55), 0 0 10px #ffd700; }
                    50%      { box-shadow:0 0 0 3000px rgba(0,0,0,0.55), 0 0 24px #ffd700; }
                }
            </style>
        `;
    },

    _removeOverlay: function () {
        const el = document.getElementById('tutorial-overlay');
        if (el) el.innerHTML = '';
    }
};
