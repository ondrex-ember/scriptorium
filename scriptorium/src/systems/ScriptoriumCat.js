// ═══════════════════════════════════════════════════════════════════════════
// SCRIPTORIUM CAT — Felis Monastica
// Animated pixel cat dwelling on ONE garden subtab at a time.
// Player sees her only on the subtab where she currently resides.
// Relocates to another subtab every 3–8 minutes (locked tabs included).
// Sprites: /cat/Cat-2-*.png, frame size 50×50px
// ═══════════════════════════════════════════════════════════════════════════

const ScriptoriumCat = {

    // ── Konfigurace ───────────────────────────────────────────────────────
    FRAME_SIZE: 50,
    SCALE: 2,           // zobrazit 100×100px
    BASE_PATH: '/cat/',
    RELOCATE_MIN_MS: 3 * 60 * 1000,   // 3 min
    RELOCATE_MAX_MS: 8 * 60 * 1000,   // 8 min

    SPRITES: {
        idle:      { file: 'Cat-2-Idle.png',       frames: 10, fps: 8 },
        walk:      { file: 'Cat-2-Walk.png',       frames: 8,  fps: 10 },
        sitting:   { file: 'Cat-2-Sitting.png',    frames: 1,  fps: 1 },
        sleeping:  { file: 'Cat-2-Sleeping1.png',  frames: 1,  fps: 1 },
        laying:    { file: 'Cat-2-Laying.png',     frames: 8,  fps: 6 },
        meow:      { file: 'Cat-2-Meow.png',       frames: 4,  fps: 8 },
        stretching:{ file: 'Cat-2-Stretching.png', frames: 13, fps: 8 },
    },

    // ── State ─────────────────────────────────────────────────────────────
    el: null,
    state: 'idle',
    currentFrame: 0,
    frameTimer: null,
    moveTimer: null,       // mini-pohyby v rámci subtabu
    relocateTimer: null,   // stěhování mezi subtaby
    currentTab: null,      // id subtabu kde kočka sídlí, např. 'garden-tab-sad'
    posX: 100,
    posY: 100,
    facingLeft: false,
    _initialized: false,
    _relocating: false,

    // ── Init ──────────────────────────────────────────────────────────────
    init: function() {
        if (this._initialized) return;
        this._initialized = true;

        if (!GameState.cat) GameState.cat = { name: 'Bezejmenný myšilov' };

        this.currentTab = this._pickRandomTab();
        this._createEl();
        this._startFrameLoop();
        this._scheduleMove();
        this._scheduleRelocate();
    },

    // ── Subtab helpers ────────────────────────────────────────────────────
    _allTabs: function() {
        const screen = document.getElementById('screen-garden');
        if (!screen) return [];
        return Array.from(screen.querySelectorAll('div[id^="garden-tab-"]'));
    },

    _pickRandomTab: function(excludeId) {
        const tabs = this._allTabs().filter(t => t.id !== excludeId);
        if (!tabs.length) return null;
        return tabs[Math.floor(Math.random() * tabs.length)].id;
    },

    _activeTabEl: function() {
        // Viditelný subtab (display !== 'none')
        return this._allTabs().find(t => t.style.display !== 'none') || null;
    },

    _isCatTabActive: function() {
        const active = this._activeTabEl();
        return !!(active && this.currentTab && active.id === this.currentTab);
    },

    _createEl: function() {
        if (document.getElementById('scriptorium-cat')) return;

        const el = document.createElement('div');
        el.id = 'scriptorium-cat';
        el.title = GameState.cat.name || 'Bezejmenný myšilov';
        el.style.cssText = `
            position: absolute;
            width: ${this.FRAME_SIZE * this.SCALE}px;
            height: ${this.FRAME_SIZE * this.SCALE}px;
            background-repeat: no-repeat;
            background-size: auto ${this.FRAME_SIZE * this.SCALE}px;
            image-rendering: pixelated;
            cursor: pointer;
            z-index: 50;
            left: ${this.posX}px;
            top: ${this.posY}px;
            transition: left 2.5s ease-in-out, top 2.5s ease-in-out;
            pointer-events: none;
            display: none;
        `;

        // Menší hitbox — jen tělo kočky (~50×60px), průhledné okraje spritu neblokují UI
        const hit = document.createElement('div');
        hit.style.cssText = `
            position: absolute;
            left: 25px; top: 30px;
            width: 50px; height: 60px;
            pointer-events: auto;
            cursor: pointer;
        `;
        hit.addEventListener('click', () => this._onCatClick());
        el.appendChild(hit);

        const screen = document.getElementById('screen-garden');
        if (screen) {
            screen.style.position = 'relative';
            screen.appendChild(el);
        }

        this.el = el;
        this._updateSprite();
    },

    // ── Sprite rendering ──────────────────────────────────────────────────
    _updateSprite: function() {
        if (!this.el) return;
        const s = this.SPRITES[this.state] || this.SPRITES.idle;
        const frameX = this.currentFrame * this.FRAME_SIZE * this.SCALE;
        this.el.style.backgroundImage = `url('${this.BASE_PATH}${s.file}')`;
        this.el.style.backgroundPosition = `-${frameX}px 0px`;
        this.el.style.transform = this.facingLeft ? 'scaleX(-1)' : 'scaleX(1)';
    },

    _startFrameLoop: function() {
        const tick = () => {
            const s = this.SPRITES[this.state] || this.SPRITES.idle;
            const delay = 1000 / s.fps;

            this.currentFrame = (this.currentFrame + 1) % s.frames;
            this._updateSprite();

            this.frameTimer = setTimeout(tick, delay);
        };
        this.frameTimer = setTimeout(tick, 120);
    },

    // ── Mini-pohyby v rámci subtabu ───────────────────────────────────────
    _scheduleMove: function() {
        const delay = 45000 + Math.random() * 45000; // 45–90s
        this.moveTimer = setTimeout(() => {
            this._moveTo();
            this._scheduleMove();
        }, delay);
    },

    _moveTo: function() {
        // Pohybuj se jen pokud je kočka právě vidět (její subtab je aktivní)
        if (this._relocating || !this._isCatTabActive()) return;
        const screen = document.getElementById('screen-garden');
        if (!screen || screen.style.display === 'none') return;

        const pos = this._randomPosInTab(this._activeTabEl());
        if (!pos) return;

        this.facingLeft = pos.x < this.posX;
        this.posX = pos.x;
        this.posY = pos.y;

        this._setState('walk');
        if (this.el) {
            this.el.style.left = pos.x + 'px';
            this.el.style.top  = pos.y + 'px';
        }

        setTimeout(() => {
            this._setState('idle');
            setTimeout(() => {
                const r = Math.random();
                if (r < 0.4)      this._setState('sitting');
                else if (r < 0.7) this._setState('laying');
            }, 5000);
        }, 3000);
    },

    // Náhodná pozice v rámci daného subtab elementu (souřadnice vůči screen-garden)
    _randomPosInTab: function(tabEl) {
        const screen = document.getElementById('screen-garden');
        if (!screen || !tabEl) return null;

        const screenRect = screen.getBoundingClientRect();
        const tabRect = tabEl.getBoundingClientRect();
        if (tabRect.width < 20 || tabRect.height < 20) return null;

        const offTop  = tabRect.top  - screenRect.top  + screen.scrollTop;
        const offLeft = tabRect.left - screenRect.left;
        const size = this.FRAME_SIZE * this.SCALE;

        const x = offLeft + 10 + Math.random() * Math.max(10, tabRect.width  - size - 20);
        const y = offTop  + 10 + Math.random() * Math.max(10, tabRect.height - size - 10);
        return { x: x, y: y };
    },

    // ── Stěhování mezi subtaby ────────────────────────────────────────────
    _scheduleRelocate: function() {
        const delay = this.RELOCATE_MIN_MS + Math.random() * (this.RELOCATE_MAX_MS - this.RELOCATE_MIN_MS);
        this.relocateTimer = setTimeout(() => {
            this._relocate();
            this._scheduleRelocate();
        }, delay);
    },

    _relocate: function() {
        const newTab = this._pickRandomTab(this.currentTab);
        if (!newTab) return;

        if (this._isCatTabActive() && this.el && this.el.style.display !== 'none') {
            // Hráč se dívá → odejde walk animací k okraji a zmizí
            this._relocating = true;
            this._setState('walk');
            const screen = document.getElementById('screen-garden');
            const goRight = Math.random() < 0.5;
            this.facingLeft = !goRight;
            const exitX = goRight ? (screen ? screen.clientWidth : this.posX + 300) : -this.FRAME_SIZE * this.SCALE;
            this.el.style.left = exitX + 'px';
            setTimeout(() => {
                this._relocating = false;
                this.currentTab = newTab;
                if (this.el) this.el.style.display = 'none';
                this._settleInCurrentTab();
            }, 2600);
        } else {
            // Nikdo se nedívá → tiché přemístění
            this.currentTab = newTab;
            this._settleInCurrentTab();
            this.onTabSwitch();
        }
    },

    // Usadí kočku na náhodné pozici v jejím (možná skrytém) subtabu — bez animace
    _settleInCurrentTab: function() {
        const tabEl = document.getElementById(this.currentTab);
        const pos = this._randomPosInTab(tabEl);
        if (pos && this.el) {
            this.el.style.transition = 'none';
            this.posX = pos.x;
            this.posY = pos.y;
            this.el.style.left = pos.x + 'px';
            this.el.style.top  = pos.y + 'px';
            // force reflow, pak vrátit transition pro budoucí walk
            void this.el.offsetWidth;
            this.el.style.transition = 'left 2.5s ease-in-out, top 2.5s ease-in-out';
        }
    },

    // ── Reakce na přepnutí garden subtabu ─────────────────────────────────
    onTabSwitch: function() {
        if (!this._initialized || !this.el || this._relocating) return;

        if (this._isCatTabActive()) {
            // Kočka sídlí na právě otevřeném subtabu → ukázat
            // Pokud nemá platnou pozici v rámci tabu, usadit
            const tabEl = document.getElementById(this.currentTab);
            const screen = document.getElementById('screen-garden');
            if (tabEl && screen) {
                const screenRect = screen.getBoundingClientRect();
                const tabRect = tabEl.getBoundingClientRect();
                const offTop = tabRect.top - screenRect.top + screen.scrollTop;
                const inTab = this.posY >= offTop - 5 && this.posY <= offTop + tabRect.height;
                if (!inTab) this._settleInCurrentTab();
            }
            this.el.style.display = 'block';
            this._setState('idle');
        } else {
            this.el.style.display = 'none';
        }
    },

    _setState: function(state) {
        if (!this.SPRITES[state]) return;
        const hour = new Date().getHours();
        // V noci → sleeping
        if ((hour >= 21 || hour < 6) && state === 'idle') state = 'sleeping';
        this.state = state;
        this.currentFrame = 0;
        this._updateSprite();
    },

    // ── Interakce ─────────────────────────────────────────────────────────
    _onCatClick: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const name = (GameState.cat && GameState.cat.name) || 'Bezejmenný myšilov';

        this._setState('meow');
        setTimeout(() => this._setState('idle'), 2000);

        const msgs = lang === 'en'
            ? [`${name} says: Meow!`, `${name} purrs contentedly.`, `${name} blinks slowly at you.`]
            : [`${name} říká: Mňau!`, `${name} spokojeně přede.`, `${name} na tebe pomalu mrkne.`];

        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        if (typeof UI !== 'undefined' && UI.notify) UI.notify('🐈‍⬛ ' + msg);
    },

    // ── Zobrazit/skrýt (vstup/odchod ze Zahrady) ──────────────────────────
    show: function() {
        if (!this._initialized) { this.init(); this.onTabSwitch(); return; }
        if (!this.moveTimer) this._scheduleMove();
        if (!this.relocateTimer) this._scheduleRelocate();
        this.onTabSwitch();
    },

    hide: function() {
        if (this.el) this.el.style.display = 'none';
        if (this.moveTimer)     { clearTimeout(this.moveTimer);     this.moveTimer = null; }
        if (this.relocateTimer) { clearTimeout(this.relocateTimer); this.relocateTimer = null; }
    },

    // ── Přejmenovat ───────────────────────────────────────────────────────
    rename: function(newName) {
        if (!newName || !newName.trim()) return;
        if (!GameState.cat) GameState.cat = {};
        GameState.cat.name = newName.trim();
        if (this.el) this.el.title = newName.trim();
        if (typeof Game !== 'undefined') Game.save();
    },
};