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

    // ── Interakce: 1. klik → útěk, 2. klik do 8s → pohlazení ─────────────
    _fleeUntil: 0,

    _onCatClick: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const c = (typeof this._ensureCatState === 'function') ? this._ensureCatState() : (GameState.cat || {});
        const name = c.name || 'Bezejmenný myšilov';
        const now = Date.now();

        // Bez tech_cura_felium → jen meow (původní chování)
        if (!this.hasFelisTech || !this.hasFelisTech()) {
            this._meowAndToast(name, lang);
            return;
        }

        const trusting = (c.affection || 0) >= 70 && Math.random() < 0.5; // vysoká přízeň → občas neuteče
        const inFleeWindow = now < this._fleeUntil;

        if (!inFleeWindow && !trusting) {
            // 1. klik → uteče jinam v rámci tabu
            this._fleeUntil = now + 8000;
            this._flee();
        } else {
            // 2. klik (nebo důvěřivá kočka) → pohlazení
            this._fleeUntil = 0;
            c.affection = Math.min(100, (c.affection || 0) + 3);
            const today = new Date().setHours(0, 0, 0, 0);
            const petDay = new Date(c.lastPet || 0).setHours(0, 0, 0, 0);
            let vigorMsg = '';
            if (today !== petDay) {
                c.lastPet = now;
                this._addVigor(1);
                vigorMsg = lang === 'en' ? ' (+1 Vigor)' : ' (+1 Vigor)';
            }
            this._setState('meow');
            setTimeout(() => this._setState('idle'), 2000);
            const msgs = lang === 'en'
                ? [`${name} lets you stroke her. She purrs deeply.${vigorMsg}`, `${name} rubs against your hand.${vigorMsg}`]
                : [`${name} se nechala pohladit. Hluboce přede.${vigorMsg}`, `${name} se otírá o tvou ruku.${vigorMsg}`];
            if (typeof UI !== 'undefined' && UI.notify) UI.notify('🐈‍⬛ ' + msgs[Math.floor(Math.random() * msgs.length)]);
            if (typeof Game !== 'undefined' && Game.save) Game.save();
        }
    },

    _flee: function() {
        const tabEl = this._activeTabEl && this._activeTabEl();
        const pos = tabEl && this._randomPosInTab ? this._randomPosInTab(tabEl) : null;
        this._setState('walk');
        if (pos && this.el) {
            this.facingLeft = pos.x < this.posX;
            this.posX = pos.x; this.posY = pos.y;
            this.el.style.left = pos.x + 'px';
            this.el.style.top = pos.y + 'px';
        }
        setTimeout(() => this._setState('idle'), 2600);
    },

    _meowAndToast: function(name, lang) {
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

// ═══════════════════════════════════════════════════════════════════════════
// FELIS MONASTICA — logická vrstva (tech_cura_felium)
// Sytost, přízeň, lov myší, krádeže, krmení, hlazení
// ═══════════════════════════════════════════════════════════════════════════

Object.assign(ScriptoriumCat, {

    // Co kočka žere: { satiety, affection }
    FEED_TABLE: {
        cream:        { satiety: 30, affection: 15 },
        fish:         { satiety: 25, affection: 12 },
        carp:         { satiety: 25, affection: 12 },
        meat:         { satiety: 25, affection: 8  },
        cured_meat:   { satiety: 20, affection: 10 },
        cooked_fish:  { satiety: 20, affection: 10 },
        cooked_meat:  { satiety: 20, affection: 8  },
        chicken_meat: { satiety: 20, affection: 8  },
        mouse:        { satiety: 20, affection: 5  },
        milk:         { satiety: 15, affection: 8  },
        goat_milk:    { satiety: 15, affection: 8  },
        cheese:       { satiety: 15, affection: 6  },
        lard:         { satiety: 15, affection: 4  },
        buttermilk:   { satiety: 12, affection: 6  },
        butter:       { satiety: 10, affection: 8  },
        fat:          { satiety: 10, affection: 3  },
    },

    // Potraviny, které hladová kočka krade ze zásob
    STEALABLE: ['cured_meat', 'lard', 'fish', 'carp', 'meat', 'cheese', 'butter', 'cream', 'chicken_meat', 'cooked_fish', 'cooked_meat'],

    DAY_MS: 24 * 60 * 60 * 1000,

    hasFelisTech: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_cura_felium'));
    },

    _ensureCatState: function() {
        if (!GameState.cat) GameState.cat = {};
        const c = GameState.cat;
        if (c.name === undefined)      c.name = 'Bezejmenný myšilov';
        if (c.satiety === undefined)   c.satiety = 50;
        if (c.affection === undefined) c.affection = 20;
        if (c.caught === undefined)    c.caught = 0;
        if (!Array.isArray(c.stolen))  c.stolen = [];
        if (!c.bornAt)                 c.bornAt = Date.now();
        if (c.lastPet === undefined)   c.lastPet = 0;
        if (c.lastTick === undefined)  c.lastTick = 0;
        if (!GameState.mice) GameState.mice = { count: 3, lastTick: 0 };
        return c;
    },

    _lang: function() {
        return (GameState.settings && GameState.settings.language) || 'cs';
    },

    // ── Denní tick (volán z game.js intervalu, self-guarded) ─────────────
    dailyTick: function() {
        if (!this.hasFelisTech()) return;
        const c = this._ensureCatState();
        const now = Date.now();
        if (now - c.lastTick < this.DAY_MS) return;
        c.lastTick = now;

        const lang = this._lang();
        const hungry = c.satiety < 30;

        // 1) Sytost klesá (denní úbytek)
        c.satiety = Math.max(0, c.satiety - 25);
        // 2) Přízeň pomalu eroduje
        c.affection = Math.max(0, c.affection - 2);

        // 3) Hladová kočka → loví myši + krade
        if (hungry) {
            const mice = GameState.mice;
            if (mice.count > 0) {
                const hunted = Math.min(mice.count, 1 + Math.floor(Math.random() * 3)); // 1–3
                mice.count -= hunted;
                c.caught += hunted;
                c.satiety = Math.min(100, c.satiety + hunted * 15); // nažere se myšmi
                const msg = lang === 'en'
                    ? `🐈‍⬛ ${c.name} caught ${hunted} ${hunted === 1 ? 'mouse' : 'mice'} in the night.`
                    : `🐈‍⬛ ${c.name} v noci ${hunted === 1 ? 'chytila myš' : 'chytila ' + hunted + ' myši'}.`;
                if (typeof UI !== 'undefined' && UI.notify) UI.notify(msg);
                // Občas přinese myš jako dar (vysoká přízeň)
                if (c.affection >= 60 && Math.random() < 0.3) {
                    GameState.inventory['mouse'] = (GameState.inventory['mouse'] || 0) + 1;
                    if (typeof UI !== 'undefined' && UI.notify) UI.notify(lang === 'en'
                        ? `🐭 ${c.name} left a mouse at your door. A gift.`
                        : `🐭 ${c.name} ti přinesla myš ke dveřím. Dar.`);
                }
            }
            // Krádež ze zásob (7%)
            if (Math.random() < 0.07) {
                const candidates = this.STEALABLE.filter(id => (GameState.inventory[id] || 0) > 0);
                if (candidates.length) {
                    const id = candidates[Math.floor(Math.random() * candidates.length)];
                    GameState.inventory[id] -= 1;
                    c.stolen.push({ item: id, ts: now });
                    if (c.stolen.length > 20) c.stolen.shift();
                    c.satiety = Math.min(100, c.satiety + 15);
                    const iname = (typeof iName === 'function') ? iName(id) : id;
                    const msg = lang === 'en'
                        ? `😼 ${c.name} stole ${iname} from the stores!`
                        : `😼 ${c.name} ukradla ze zásob: ${iname}!`;
                    if (typeof UI !== 'undefined' && UI.notify) UI.notify(msg, true);
                    if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                        Game.addKronikaEntry('important',
                            `😼 Kočka ${c.name} ukradla ze zásob: ${iname}.`,
                            `😼 The cat ${c.name} stole ${iname} from the stores.`,
                            `😼 Felis ${c.name} furata est.`);
                    }
                }
            }
        }

        // Myší spawn řeší DecaySystem.miceTick (skladová mechanika)

        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // Fuzzy popis myší populace (přesné číslo hra neukazuje)
    miceFuzzy: function() {
        const n = (GameState.mice && GameState.mice.count) || 0;
        const lang = this._lang();
        if (n <= 1)  return lang === 'en' ? 'The cloister is quiet. No scurrying to be heard.' : 'V klášteře je ticho. Žádný šramot.';
        if (n <= 6)  return lang === 'en' ? 'A faint scurrying in the walls at night...' : 'V noci je za zdmi slyšet slabý šramot...';
        if (n <= 15) return lang === 'en' ? 'Mice have been seen near the granary. The cellarius frowns.' : 'U sýpky byly vidět myši. Cellarius se mračí.';
        return lang === 'en' ? 'A mouse paradise! Droppings in the flour, holes in the sacks.' : 'Myší ráj! Trus v mouce, díry v pytlích.';
    },

    // ── Krmení ────────────────────────────────────────────────────────────
    feed: function(itemId) {
        if (!this.hasFelisTech()) return false;
        const entry = this.FEED_TABLE[itemId];
        if (!entry) return false;
        if ((GameState.inventory[itemId] || 0) < 1) return false;

        const c = this._ensureCatState();
        GameState.inventory[itemId] -= 1;
        c.satiety = Math.min(100, c.satiety + entry.satiety);
        c.affection = Math.min(100, c.affection + entry.affection);

        const lang = this._lang();
        const iname = (typeof iName === 'function') ? iName(itemId) : itemId;
        if (typeof UI !== 'undefined' && UI.notify) UI.notify(lang === 'en'
            ? `🐈‍⬛ ${c.name} devoured the ${iname} and purrs.`
            : `🐈‍⬛ ${c.name} zhltla: ${iname}. Spokojeně přede.`);

        if (this.el && this.el.style.display !== 'none') {
            this._setState('meow');
            setTimeout(() => this._setState('idle'), 2000);
        }
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.rerenderIfOpen) PersonaSystem.rerenderIfOpen();
        return true;
    },

    // ── Titul dle přízně a úlovků ─────────────────────────────────────────
    getTitle: function() {
        const c = this._ensureCatState();
        const lang = this._lang();
        if (c.affection >= 80 && c.caught >= 50) return 'Custos Penarii';
        if (c.affection >= 60 || c.caught >= 25) return 'Felis Monastica';
        if (c.caught >= 5) return lang === 'en' ? 'Mouser' : 'Myšilov';
        return 'Felis Vagans';
    },

    // ── Vigor helper ──────────────────────────────────────────────────────
    // ── Warmth systém ─────────────────────────────────────────────────────
    warmthTick: function() {
        const c = this._ensureCatState ? this._ensureCatState() : (GameState.cat || {});
        if (typeof c.warmth === 'undefined') c.warmth = 50;

        const foculusActive = document.getElementById('home-foculus-content') &&
            document.getElementById('home-foculus-content').style.display !== 'none';
        const onFire = foculusActive && GameState.flags && GameState.flags.fireplaceLit;

        if (onFire) {
            c.warmth = Math.min(100, c.warmth + 2);
        } else {
            c.warmth = Math.max(0, c.warmth - 1);
        }

        // Přehřátá → odejde od ohně do zahrady
        if (c.warmth >= 90 && document.getElementById('cat-by-fire') &&
            document.getElementById('cat-by-fire').style.display !== 'none') {
            this._foculusLeave();
        }

        // Vychladlá + hoří → přijde od zahrady k ohni
        if (c.warmth <= 20 && GameState.flags && GameState.flags.fireplaceLit) {
            if (this.el) this.el.style.display = 'none';
            if (this.moveTimer) { clearTimeout(this.moveTimer); this.moveTimer = null; }
        }

        this.syncCatPill();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    _foculusLeave: function() {
        const el = document.getElementById('cat-by-fire');
        const lane = document.getElementById('cat-lane-top');
        if (el) {
            // Walk vpravo a zmizí
            this.foculusFacingLeft = false;
            this._foculusSetState('walk');
            const laneWidth = lane ? lane.clientWidth : 600;
            el.style.left = (laneWidth + 20) + 'px';
            setTimeout(() => {
                if (el) el.style.display = 'none';
                if (this.foculusMoveTimer) { clearTimeout(this.foculusMoveTimer); this.foculusMoveTimer = null; }
                if (this.foculusFrameTimer) { clearTimeout(this.foculusFrameTimer); this.foculusFrameTimer = null; }
                // Spustit zahradní roaming
                if (!this._initialized) this.init();
                this.show();
            }, 2600);
        }
    },

    // ── Cat Pill ──────────────────────────────────────────────────────────
    _warmthEmoji: function(warmth) {
        if (warmth >= 80) return '🔥';
        if (warmth >= 50) return '😺';
        if (warmth >= 25) return '🐱';
        return '🥶';
    },

    syncCatPill: function() {
        const pill = document.getElementById('cat-pill');
        if (!pill) return;
        const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_cura_felium');
        if (!hasTech) { pill.style.display = 'none'; return; }
        pill.style.display = 'flex';

        const c = this._ensureCatState ? this._ensureCatState() : (GameState.cat || {});
        const warmth = typeof c.warmth === 'number' ? c.warmth : 50;
        const emoji = this._warmthEmoji(warmth);
        const name = c.name || 'Felis';

        const label = document.getElementById('cat-pill-label');
        const bar = document.getElementById('cat-pill-warmth-bar');
        if (label) label.textContent = emoji + ' ' + name;
        if (bar) bar.style.width = warmth + '%';
    },

    renderCatPillDetail: function() {
        const panel = document.getElementById('pill-panel-body');
        if (!panel) return;
        const c = this._ensureCatState ? this._ensureCatState() : (GameState.cat || {});
        const lang = this._lang ? this._lang() : 'cs';
        const warmth = typeof c.warmth === 'number' ? c.warmth : 50;
        const warmthLabel = lang === 'en'
            ? ['Freezing','Cold','Comfortable','Warm','Very warm','Roasting']
            : ['Zmrzlá','Zima','Pohoda','Teplo','Velmi teplo','Úplně rozpálená'];
        const wi = Math.min(5, Math.floor(warmth / 20));
        panel.innerHTML = `
            <div style="font-weight:bold; margin-bottom:6px;">🐈 ${c.name || 'Felis'}</div>
            <div style="font-size:0.8rem; margin-bottom:4px;">
                ${lang==='en'?'Warmth':'Teplo'}: ${this._warmthEmoji(warmth)} ${warmthLabel[wi]} (${warmth}/100)
            </div>
            <div style="height:5px; background:rgba(0,0,0,0.15); border-radius:3px; margin-bottom:8px;">
                <div style="height:100%; width:${warmth}%; background:${warmth>=80?'#ef4444':warmth>=40?'#ffbd40':'#60a5fa'}; border-radius:3px; transition:width 0.5s;"></div>
            </div>
            <div style="font-size:0.78rem; opacity:0.75;">
                ${lang==='en'?'Affection':'Přízeň'}: ${'❤️'.repeat(Math.round((c.affection||0)/20))} (${c.affection||0}/100)<br>
                ${lang==='en'?'Mice caught':'Myší chyceno'}: ${c.caught||0}
            </div>
        `;
    },

    _addVigor: function(n) {
        try {
            if (typeof VigorSystem === 'undefined' || !GameState.vigor) return;
            GameState.vigor.current = Math.min(VigorSystem.MAX_VIGOR, GameState.vigor.current + n);
            VigorSystem.renderMiniDisplay();
        } catch (e) { /* no-op */ }
    },

    // ── Návštěva u ohně (Ohniště/Foculus) ──────────────────────────────────
    // Nezávislé na zahradním roamingu — samostatný element, viditelný jen
    // když je krb hořící a Foculus subtab je aktivní.
    // ── Návštěva u ohně (Ohniště/Foculus) ──────────────────────────────────
    FOCULUS_SCALE: 3,
    foculusState: 'idle',
    foculusFrame: 0,
    foculusFrameTimer: null,
    foculusMoveTimer: null,
    foculusFacingLeft: false,
    foculusPosX: 10,
    _foculusInitialized: false,

    _foculusFrameSize: function() {
        return this.FRAME_SIZE * this.FOCULUS_SCALE;
    },

    _foculusUpdateSprite: function() {
        const el = document.getElementById('cat-by-fire');
        if (!el) return;
        const s = this.SPRITES[this.foculusState] || this.SPRITES.idle;
        const size = this._foculusFrameSize();
        const frameX = this.foculusFrame * size;
        el.style.backgroundImage = `url('${this.BASE_PATH}${s.file}')`;
        el.style.backgroundPosition = `-${frameX}px 0px`;
        el.style.transform = this.foculusFacingLeft ? 'scaleX(-1)' : 'scaleX(1)';
    },

    _foculusSetState: function(state) {
        if (!this.SPRITES[state]) return;
        this.foculusState = state;
        this.foculusFrame = 0;
        this._foculusUpdateSprite();
    },

    _foculusStartFrameLoop: function() {
        if (this.foculusFrameTimer) return;
        const tick = () => {
            const el = document.getElementById('cat-by-fire');
            if (!el || el.style.display === 'none') {
                this.foculusFrameTimer = setTimeout(tick, 500);
                return;
            }
            const s = this.SPRITES[this.foculusState] || this.SPRITES.idle;
            this.foculusFrame = (this.foculusFrame + 1) % s.frames;
            this._foculusUpdateSprite();
            this.foculusFrameTimer = setTimeout(tick, 1000 / s.fps);
        };
        tick();
    },

    _foculusScheduleMove: function() {
        if (this.foculusMoveTimer) return;
        const delay = 8000 + Math.random() * 12000; // 8-20s
        this.foculusMoveTimer = setTimeout(() => {
            this.foculusMoveTimer = null;
            this._foculusMove();
            this._foculusScheduleMove();
        }, delay);
    },

    _foculusMove: function() {
        const el = document.getElementById('cat-by-fire');
        const lane = document.getElementById('cat-lane-top');
        if (!el || !lane || el.style.display === 'none') return;

        const laneWidth = lane.clientWidth || 300;
        const size = this._foculusFrameSize();
        const maxX = Math.max(10, laneWidth - size - 10);
        const newX = 10 + Math.random() * maxX;

        this.foculusFacingLeft = newX < this.foculusPosX;
        this.foculusPosX = newX;

        this._foculusSetState('walk');
        el.style.left = newX + 'px';

        setTimeout(() => {
            const r = Math.random();
            if (r < 0.4)      this._foculusSetState('laying');
            else if (r < 0.7) this._foculusSetState('sitting');
            else              this._foculusSetState('idle');
        }, 2500);
    },

    renderFoculusVisit: function() {
        const lane = document.getElementById('cat-lane-top');
        let el = document.getElementById('cat-by-fire');

        if (!lane || !GameState.flags || !GameState.flags.fireplaceLit) {
            if (el) el.style.display = 'none';
            if (this.foculusMoveTimer)  { clearTimeout(this.foculusMoveTimer);  this.foculusMoveTimer = null; }
            if (this.foculusFrameTimer) { clearTimeout(this.foculusFrameTimer); this.foculusFrameTimer = null; }
            return;
        }

        const size = this._foculusFrameSize();

        if (!el) {
            el = document.createElement('div');
            el.id = 'cat-by-fire';
            el.title = (GameState.cat && GameState.cat.name) || 'Bezejmenný myšilov';
            el.style.cssText = `
                position: absolute;
                bottom: 4px;
                left: ${this.foculusPosX}px;
                width: ${size}px;
                height: ${size}px;
                background-repeat: no-repeat;
                background-size: auto ${size}px;
                image-rendering: pixelated;
                cursor: pointer;
                z-index: 10;
                transition: left 2.5s ease-in-out;
            `;
            el.addEventListener('click', () => this._onCatClick());
            lane.appendChild(el);
            this._foculusSetState('laying');
        }

        el.style.display = 'block';
        this._foculusStartFrameLoop();
        this._foculusScheduleMove();
    },
});