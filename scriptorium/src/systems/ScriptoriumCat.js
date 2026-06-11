// ═══════════════════════════════════════════════════════════════════════════
// SCRIPTORIUM CAT — Felis Monastica
// Animated pixel cat roaming the Garden screen
// Sprites: /cat/Cat-2-*.png, frame size 50×50px
// ═══════════════════════════════════════════════════════════════════════════

const ScriptoriumCat = {

    // ── Konfigurace ───────────────────────────────────────────────────────
    FRAME_SIZE: 50,
    SCALE: 2,           // zobrazit 100×100px
    BASE_PATH: '/cat/',

    SPRITES: {
        idle:      { file: 'Cat-2-Idle.png',      frames: 10, fps: 8 },
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
    moveTimer: null,
    posX: 100,
    posY: 100,
    targetX: 100,
    targetY: 100,
    facingLeft: false,
    _initialized: false,
    _idleTime: 0,

    // ── Init ──────────────────────────────────────────────────────────────
    init: function() {
        if (this._initialized) return;
        this._initialized = true;

        if (!GameState.cat) GameState.cat = { name: 'Bezejmenný myšilov' };

        this._createEl();
        this._startFrameLoop();
        this._scheduleMove();
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
            pointer-events: auto;
        `;

        el.addEventListener('click', () => this._onCatClick());

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

    // ── Pohyb ─────────────────────────────────────────────────────────────
    _scheduleMove: function() {
        const delay = 45000 + Math.random() * 45000; // 45–90s
        this.moveTimer = setTimeout(() => {
            this._moveTo();
            this._scheduleMove();
        }, delay);
    },

    _moveTo: function() {
        const screen = document.getElementById('screen-garden');
        if (!screen || screen.style.display === 'none') return;

        // Vyber náhodný garden subtab (i zamčený/skrytý)
        const tabs = screen.querySelectorAll('div[id^="garden-tab-"]');
        if (!tabs.length) return;
        const tab = tabs[Math.floor(Math.random() * tabs.length)];

        // Spočítej offset tabulátoru relativně k screen-garden
        const screenRect = screen.getBoundingClientRect();
        const tabRect = tab.getBoundingClientRect();
        const tabOffsetTop = tabRect.top - screenRect.top + screen.scrollTop;
        const tabOffsetLeft = tabRect.left - screenRect.left;

        const tabW = Math.max(100, tabRect.width);
        const tabH = Math.max(60,  tabRect.height);

        const newX = tabOffsetLeft + 10 + Math.random() * Math.max(10, tabW - this.FRAME_SIZE * this.SCALE - 20);
        const newY = tabOffsetTop  + 10 + Math.random() * Math.max(10, tabH - this.FRAME_SIZE * this.SCALE - 10);

        this.facingLeft = newX < this.posX;
        this.posX = newX;
        this.posY = newY;

        this._setState('walk');
        if (this.el) {
            this.el.style.left = newX + 'px';
            this.el.style.top  = newY + 'px';
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

    // ── Zobrazit/skrýt ────────────────────────────────────────────────────
    show: function() {
        if (!this._initialized) { this.init(); return; }
        if (this.el) this.el.style.display = 'block';
        if (!this.moveTimer) this._scheduleMove();
    },

    hide: function() {
        if (this.el) this.el.style.display = 'none';
        if (this.moveTimer) { clearTimeout(this.moveTimer); this.moveTimer = null; }
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