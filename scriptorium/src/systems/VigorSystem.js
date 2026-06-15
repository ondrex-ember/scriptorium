// ═══════════════════════════════════════════════════════════════════════════════
// VIGOR SYSTEM v2.0 — Satiety + Fatigue → computed Vigor
// Vigor = max(0, Satiety - Fatigue)
// ═══════════════════════════════════════════════════════════════════════════════

const VigorSystem = {

    // ── Konstanty ─────────────────────────────────────────────────────────────
    MAX_SATIETY: 100,
    MAX_FATIGUE: 100,

    // Pasivní Satiety drain per hodina
    SATIETY_DRAIN_PER_HOUR: 0.5,   // 100→0 za ~8.3 dne (ve dne)
    SATIETY_DRAIN_NIGHT: 0.1,      // 21–7h: téměř žádný hlad při spánku

    // Fatigue recovery per hodina (záporné = klesá)
    FATIGUE_RECOVERY_DAY:   4,     // 7–21h: -4/h
    FATIGUE_RECOVERY_NIGHT: 8,     // 21–7h: -8/h (spánek)
    FATIGUE_RECOVERY_HORA:  10,    // Completorium/Vigilie: -10/h

    // Noční spánek: 8h+ neaktivity → plný reset únavy
    SLEEP_HOURS_FOR_FULL_REST: 8,

    // Vigor thresholdy
    VIGOR_THRESHOLD_HEAVY: 25,     // těžký craft, research
    VIGOR_THRESHOLD_LIGHT: 10,     // lehký craft

    // Fatigue náklady akcí
    FATIGUE_COSTS: {
        // Scavenge
        scavenge:       0.1,
        mine:           0.5,
        // Craft — lehký
        paper:          2,
        ink:            2,
        candle:         2,
        tinderbox:      2,
        quill:          3,
        // Craft — střední
        ink_gallic:     5,
        codex_common:   8,
        // Craft — těžký
        vellum:         15,
        codex_luxury:   20,
        illuminated_page: 25,
        vellum_codex:   30,
        printing_type:  35,
        // Research
        research:       1.5,
        // Athanor
        athanor:        12,
    },

    // Satiety z jídla
    FOOD_SATIETY: {
        berries:        5,
        mushroom:       8,
        roots:          5,
        fish:           15,
        cooked_fish:    20,
        porridge:       18,
        bread:          20,
        berry_pie:      20,
        cooked_meat:    25,
        stew:           35,
        cheese:         12,
        egg:            10,
        honey:          8,
        beer:           5,
        wine:           3,
        // Bylinné nápoje
        herbal_tea:     5,
        acorn_brew:     3,
        chicory_drink:  3,
        linden_tea:     8,
        // Voda
        water:          3,
        spring_water:   5,
    },

    // Fatigue z jídla (záporné = snižuje únavu)
    FOOD_FATIGUE: {
        stew:           -10,
        herbal_tea:     -15,
        acorn_brew:     -10,
        chicory_drink:  -12,
        linden_tea:     -8,
        beer:           10,
        wine:           8,
        // Voda
        water:          -5,
        spring_water:   -15,
    },

    // ── Init ──────────────────────────────────────────────────────────────────
    init: function() {
        // Migrace starého hunger systému
        if (GameState.hunger && !GameState.satiety) {
            GameState.satiety = GameState.hunger.fed ? 70 : 20;
            delete GameState.hunger;
        }

        // Defaultní state
        if (typeof GameState.satiety !== 'number') GameState.satiety = 80;
        if (typeof GameState.fatigue !== 'number') GameState.fatigue = 0;
        if (!GameState.vigorMeta) {
            GameState.vigorMeta = {
                lastTick:    Date.now(),
                lastNonRest: Date.now(),
                warnedLow:   false,
                nonaUsed:    '',   // datum posledního odpočinku při Nóně (YYYY-MM-DD)
                meditateUsed: 0,   // timestamp posledního použití meditace
            };
        }
        // Migrace — přidat meditateUsed pokud chybí
        if (typeof GameState.vigorMeta.meditateUsed === 'undefined') {
            GameState.vigorMeta.meditateUsed = 0;
        }

        this._applyOfflineDelta();
        this.startTick();
        this.renderPill();
    },

    // ── Computed Vigor ────────────────────────────────────────────────────────
    getVigor: function() {
        const s = GameState.satiety || 0;
        const f = GameState.fatigue || 0;
        return Math.max(0, Math.round(s - f));
    },

    getVigorPct: function() {
        return Math.round((this.getVigor() / this.MAX_SATIETY) * 100);
    },

    // ── Offline delta při load ────────────────────────────────────────────────
    _isNightHour: function(h) {
        return h >= 21 || h < 7;
    },

    _applyOfflineDelta: function() {
        if (!GameState.vigorMeta) return;
        const now = Date.now();
        const elapsed = now - (GameState.vigorMeta.lastTick || now);
        const hoursElapsed = elapsed / 3600000;
        if (hoursElapsed < 0.016) return; // < 1 minuta — přeskočit

        // Detekce nočního spánku: 8h+ neaktivity a čas byl v nočním okně
        const startHour = new Date(GameState.vigorMeta.lastTick || now).getHours();
        const endHour   = new Date(now).getHours();
        const couldBeSleep = hoursElapsed >= this.SLEEP_HOURS_FOR_FULL_REST
            && (this._isNightHour(startHour) || this._isNightHour(endHour));

        if (couldBeSleep) {
            // Noční spánek → plný reset únavy, minimální hlad
            GameState.fatigue = 0;
            const nightDrain = hoursElapsed * this.SATIETY_DRAIN_NIGHT;
            GameState.satiety = Math.max(0, (GameState.satiety || 80) - nightDrain);
        } else {
            // Normální offline delta
            // Satiety drain — dle denní doby (aproximace středem intervalu)
            const midHour = new Date((GameState.vigorMeta.lastTick || now) + elapsed / 2).getHours();
            const drain = this._isNightHour(midHour)
                ? this.SATIETY_DRAIN_NIGHT
                : this.SATIETY_DRAIN_PER_HOUR;
            const satDrain = hoursElapsed * drain;
            GameState.satiety = Math.max(0, (GameState.satiety || 80) - satDrain);

            // Fatigue recovery — průměr dne/noci pro offline
            const avgRecovery = (this.FATIGUE_RECOVERY_DAY + this.FATIGUE_RECOVERY_NIGHT) / 2;
            const fatRecovery = hoursElapsed * avgRecovery;
            GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - fatRecovery);
        }

        GameState.vigorMeta.lastTick = now;
    },

    // ── Tick (každou minutu) ──────────────────────────────────────────────────
    startTick: function() {
        setInterval(() => { this._tick(); }, 60000);
    },

    _tick: function() {
        const now = Date.now();
        const meta = GameState.vigorMeta;
        if (!meta) return;
        const elapsed = (now - meta.lastTick) / 3600000; // v hodinách
        if (elapsed < 0.01) return;

        // Satiety drain — v noci minimální
        const hour = new Date().getHours();
        const isNight = this._isNightHour(hour);
        const drainRate = isNight ? this.SATIETY_DRAIN_NIGHT : this.SATIETY_DRAIN_PER_HOUR;
        const satDrain = elapsed * drainRate;
        GameState.satiety = Math.max(0, (GameState.satiety || 80) - satDrain);

        // Fatigue recovery dle denní doby
        let recovery = isNight ? this.FATIGUE_RECOVERY_NIGHT : this.FATIGUE_RECOVERY_DAY;
        // Kanonické hodiny bonus
        if (hour === 21 || hour === 22 || hour === 0 || hour === 1 || hour === 2) {
            recovery = this.FATIGUE_RECOVERY_HORA;
        }
        // Pokud je Vigor < 10 — zrychlený odpočinek
        if (this.getVigor() < 10) recovery = Math.max(recovery, this.FATIGUE_RECOVERY_HORA);

        const fatRecovery = elapsed * recovery;
        GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - fatRecovery);

        meta.lastTick = now;
        this._checkThresholds();
        this.renderPill();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // ── Fatigue přidat (akce) ─────────────────────────────────────────────────
    addFatigue: function(amount) {
        GameState.fatigue = Math.min(this.MAX_FATIGUE, (GameState.fatigue || 0) + amount);
        this.renderPill();
    },

    // ── Scavenge hook ─────────────────────────────────────────────────────────
    onScavenge: function(type) {
        const cost = (type === 'mine' || type === 'quarry_stone' || type === 'mine_iron_ore')
            ? this.FATIGUE_COSTS.mine
            : this.FATIGUE_COSTS.scavenge;
        this.addFatigue(cost);
    },

    // ── Craft hook ────────────────────────────────────────────────────────────
    onCraft: function(itemId) {
        const cost = this.FATIGUE_COSTS[itemId] || 2; // default lehký craft
        this.addFatigue(cost);
    },

    // ── Research hook ─────────────────────────────────────────────────────────
    onResearch: function() {
        this.addFatigue(this.FATIGUE_COSTS.research);
    },

    // ── Athanor hook ──────────────────────────────────────────────────────────
    onAthanor: function() {
        this.addFatigue(this.FATIGUE_COSTS.athanor);
    },

    // ── Can perform checks ────────────────────────────────────────────────────
    canHeavy: function() {
        return this.getVigor() >= this.VIGOR_THRESHOLD_HEAVY;
    },

    canLight: function() {
        return this.getVigor() >= this.VIGOR_THRESHOLD_LIGHT;
    },

    // ── Jídlo ────────────────────────────────────────────────────────────────
    eat: function(foodId) {
        const satGain   = this.FOOD_SATIETY[foodId] || 10;
        const fatChange = this.FOOD_FATIGUE[foodId] || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        GameState.satiety = Math.min(this.MAX_SATIETY, (GameState.satiety || 0) + satGain);
        if (fatChange !== 0) {
            GameState.fatigue = Math.max(0, Math.min(this.MAX_FATIGUE,
                (GameState.fatigue || 0) + fatChange));
        }

        const vigor = this.getVigor();
        const iname = (typeof iName === 'function') ? iName(foodId) : foodId;

        let msg = lang === 'en'
            ? `🍖 ${iname} consumed. +${satGain} Satiety.`
            : `🍖 ${iname} snědeno. +${satGain} Sytost.`;

        if (fatChange < 0) {
            msg += lang === 'en'
                ? ` 💤 Fatigue ${fatChange}.`
                : ` 💤 Únava ${fatChange}.`;
        } else if (fatChange > 0) {
            msg += lang === 'en'
                ? ` ⚠️ Fatigue +${fatChange} (beware!)`
                : ` ⚠️ Únava +${fatChange} (pozor!)`;
        }
        msg += lang === 'en' ? ` ⚡ Vigor: ${vigor}.` : ` ⚡ Vigor: ${vigor}.`;

        if (typeof UI !== 'undefined') {
            if (UI.notify) UI.notify(msg);
            if (UI.notifyPanel) UI.notifyPanel(msg, 'system');
        }

        if (typeof GameState.vigorMeta !== 'undefined') GameState.vigorMeta.lastNonRest = Date.now();
        this.renderPill();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // ── Odpočinek při Nóně (1×/den) ──────────────────────────────────────────
    restNona: function() {
        const today = new Date().toISOString().slice(0, 10);
        const lang  = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.vigorMeta) return;

        if (GameState.vigorMeta.nonaUsed === today) {
            if (typeof UI !== 'undefined' && UI.notify)
                UI.notify(lang === 'en' ? '⚠️ You have already rested today.' : '⚠️ Dnes jsi již odpočíval.', true);
            return;
        }

        GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - 20);
        GameState.vigorMeta.nonaUsed = today;

        const msg = lang === 'en'
            ? `😴 Nona rest. Fatigue -20. Vigor: ${this.getVigor()}.`
            : `😴 Odpočinek při Nóně. Únava -20. Vigor: ${this.getVigor()}.`;
        if (typeof UI !== 'undefined') {
            if (UI.notify) UI.notify(msg);
            if (UI.notifyPanel) UI.notifyPanel(msg, 'system');
        }
        this.renderPill();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // ── Meditace (1× za 12h) ─────────────────────────────────────────────────
    meditate: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const meta = GameState.vigorMeta;
        if (!meta) return;

        const now = Date.now();
        const cooldown = 12 * 3600000; // 12h v ms
        const elapsed = now - (meta.meditateUsed || 0);

        if (elapsed < cooldown) {
            const remainH = Math.ceil((cooldown - elapsed) / 3600000);
            const msg = lang === 'en'
                ? `🧘 Meditation available in ~${remainH}h.`
                : `🧘 Meditace dostupná za ~${remainH}h.`;
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(msg, true);
            return;
        }

        GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - 50);
        meta.meditateUsed = now;

        const msg = lang === 'en'
            ? `🧘 Lectio et meditatio. Fatigue -50. Vigor: ${this.getVigor()}.`
            : `🧘 Lectio et meditatio. Únava -50. Vigor: ${this.getVigor()}.`;
        if (typeof UI !== 'undefined') {
            if (UI.notify) UI.notify(msg);
            if (UI.notifyPanel) UI.notifyPanel(msg, 'system');
        }
        this.renderPill();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },


    _checkThresholds: function() {
        const vigor = this.getVigor();
        const lang  = (GameState.settings && GameState.settings.language) || 'cs';
        const meta  = GameState.vigorMeta || {};

        if (vigor === 0 && !meta.warnedExhausted) {
            meta.warnedExhausted = true;
            if (typeof NotificationSystem !== 'undefined')
                NotificationSystem.panel(
                    lang === 'en'
                        ? '😵 The scribe is utterly exhausted. Find food before continuing.'
                        : '😵 Písař je zcela vyčerpán. Než budeš pokračovat, najez se.',
                    'warning');
        } else if (vigor < 10 && !meta.warnedLow) {
            meta.warnedLow = true;
            if (typeof NotificationSystem !== 'undefined')
                NotificationSystem.panel(
                    lang === 'en'
                        ? '⚠️ Vigor deficiens. Only light tasks available.'
                        : '⚠️ Vigor deficiens. Dostupné jen lehké akce.',
                    'warning');
        } else if (vigor >= 10) {
            meta.warnedLow = false;
            meta.warnedExhausted = false;
        }
    },

    // ── Recovery time estimate ────────────────────────────────────────────────
    _recoveryHours: function() {
        const fatigue = GameState.fatigue || 0;
        if (fatigue <= 0) return 0;
        const hour = new Date().getHours();
        const rate = (hour < 6 || hour >= 18) ? this.FATIGUE_RECOVERY_NIGHT : this.FATIGUE_RECOVERY_DAY;
        return Math.ceil(fatigue / rate);
    },

    // ── Pill render ───────────────────────────────────────────────────────────
    renderPill: function() {
        const satiety = Math.round(GameState.satiety || 0);
        const fatigue = Math.round(GameState.fatigue || 0);
        const vigor   = this.getVigor();
        const lang    = (GameState.settings && GameState.settings.language) || 'cs';

        // Icon dle Vigoru
        const icon = vigor >= 75 ? '⚡' : vigor >= 40 ? '🟡' : vigor >= 10 ? '🔴' : '💀';

        // Pill label
        const vigVal = document.getElementById('pill-vigor-val');
        const vigIcon = document.getElementById('pill-vigor-icon');
        if (vigVal) vigVal.textContent = vigor + '%';
        if (vigIcon) vigIcon.textContent = icon;

        // vigor-mini (legacy support)
        const mini = document.getElementById('vigor-mini');
        if (mini) mini.setAttribute('data-vigor', vigor);

        // Pill panel detail (pokud otevřený)
        const panel = document.getElementById('pill-panel-body');
        if (panel && document.getElementById('pill-panel') &&
            document.getElementById('pill-panel').style.display !== 'none') {
            const activePill = document.querySelector('.hpill.active');
            if (activePill && activePill.id === 'pill-vigor') {
                this.renderPillDetail(panel, satiety, fatigue, vigor, lang);
            }
        }
    },

    renderPillDetail: function(panel, satiety, fatigue, vigor, lang) {
        const recovH = this._recoveryHours();
        const recovText = recovH > 0
            ? (lang === 'en' ? `Full rest in ~${recovH}h` : `Plný odpočinek za ~${recovH}h`)
            : (lang === 'en' ? 'Well rested' : 'Odpočatý');

        const today = new Date().toISOString().slice(0, 10);
        const nonaAvail = !GameState.vigorMeta || GameState.vigorMeta.nonaUsed !== today;
        const nonaBtn = nonaAvail
            ? `<button onclick="VigorSystem.restNona()" style="margin-top:8px;width:100%;padding:4px 8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.75rem;">
                😴 ${lang === 'en' ? 'Nona rest (-20 Fatigue, 1×/day)' : 'Odpočinek při Nóně (-20 Únava, 1×/den)'}
               </button>`
            : `<div style="font-size:0.7rem;opacity:0.5;margin-top:6px;">${lang === 'en' ? 'Nona rest used today.' : 'Dnes již odpočinut.'}</div>`;

        const now12 = Date.now();
        const meditCooldown = 12 * 3600000;
        const meditElapsed = now12 - (GameState.vigorMeta ? (GameState.vigorMeta.meditateUsed || 0) : 0);
        const meditAvail = meditElapsed >= meditCooldown;
        const meditRemainH = meditAvail ? 0 : Math.ceil((meditCooldown - meditElapsed) / 3600000);
        const meditBtn = meditAvail
            ? `<button onclick="VigorSystem.meditate()" style="margin-top:6px;width:100%;padding:4px 8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.75rem;">
                🧘 ${lang === 'en' ? 'Meditate (-50 Fatigue, 1×/12h)' : 'Meditace (-50 Únava, 1×/12h)'}
               </button>`
            : `<div style="font-size:0.7rem;opacity:0.5;margin-top:4px;">🧘 ${lang === 'en' ? `Meditation in ~${meditRemainH}h` : `Meditace za ~${meditRemainH}h`}</div>`;

        panel.innerHTML = `
            <div class="pp-row">
                <span class="pp-label">🍎 ${lang === 'en' ? 'Satiety' : 'Sytost'}</span>
                <span class="pp-val">${satiety}/100</span>
            </div>
            <div class="pp-row">
                <span class="pp-label">💤 ${lang === 'en' ? 'Fatigue' : 'Únava'}</span>
                <span class="pp-val">${fatigue}/100</span>
            </div>
            <div class="pp-row" style="border-top:1px solid rgba(197,160,89,0.2);margin-top:4px;padding-top:4px;">
                <span class="pp-label">⚡ Vigor</span>
                <span class="pp-val" style="color:${vigor >= 25 ? 'var(--accent-gold)' : vigor >= 10 ? '#e67e22' : '#c0392b'};">${vigor}%</span>
            </div>
            <div style="font-size:0.7rem;opacity:0.6;margin-top:4px;">${recovText}</div>
            ${nonaBtn}
            ${meditBtn}
        `;
    },

    // ── Legacy kompatibilita ─────────────────────────────────────────────────
    renderMiniDisplay: function() {
        this.renderPill();
    },

    // renderFullDisplay — volá PersonaSystem pro Vigor blok
    renderFullDisplay: function() {
        const satiety = Math.round(GameState.satiety || 0);
        const fatigue = Math.round(GameState.fatigue || 0);
        const vigor   = this.getVigor();
        const lang    = (GameState.settings && GameState.settings.language) || 'cs';
        const recovH  = this._recoveryHours();
        const recovText = recovH > 0
            ? (lang === 'en' ? `Full rest in ~${recovH}h` : `Plný odpočinek za ~${recovH}h`)
            : (lang === 'en' ? 'Well rested' : 'Odpočatý');

        const today = new Date().toISOString().slice(0, 10);
        const nonaAvail = !GameState.vigorMeta || GameState.vigorMeta.nonaUsed !== today;
        const nonaBtn = nonaAvail
            ? `<button onclick="VigorSystem.restNona();PersonaSystem.render();" style="margin-top:8px;width:100%;padding:4px 8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.75rem;">
                😴 ${lang === 'en' ? 'Nona rest (-20 Fatigue, 1×/day)' : 'Odpočinek při Nóně (-20 Únava, 1×/den)'}
               </button>`
            : `<div style="font-size:0.7rem;opacity:0.5;margin-top:6px;">${lang === 'en' ? 'Nona rest used today.' : 'Dnes již odpočinut.'}</div>`;

        const now12fd = Date.now();
        const meditCooldownFd = 12 * 3600000;
        const meditElapsedFd = now12fd - (GameState.vigorMeta ? (GameState.vigorMeta.meditateUsed || 0) : 0);
        const meditAvailFd = meditElapsedFd >= meditCooldownFd;
        const meditRemainHFd = meditAvailFd ? 0 : Math.ceil((meditCooldownFd - meditElapsedFd) / 3600000);
        const meditBtnFd = meditAvailFd
            ? `<button onclick="VigorSystem.meditate();PersonaSystem.render();" style="margin-top:6px;width:100%;padding:4px 8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.75rem;">
                🧘 ${lang === 'en' ? 'Meditate (-50 Fatigue, 1×/12h)' : 'Meditace (-50 Únava, 1×/12h)'}
               </button>`
            : `<div style="font-size:0.7rem;opacity:0.5;margin-top:4px;">🧘 ${lang === 'en' ? `Meditation in ~${meditRemainHFd}h` : `Meditace za ~${meditRemainHFd}h`}</div>`;

        // Jídlo & pití z inventáře
        const FOOD_ITEMS = ['bread','berry_pie','stew','cooked_fish','cooked_meat','porridge',
                            'cheese','egg','honey','berries','mushroom',
                            'herbal_tea','linden_tea','chicory_drink','acorn_brew',
                            'beer','wine','spring_water'];
        const DRINK_ITEMS = ['water','spring_water'];

        const inv = GameState.inventory || {};
        const availableFood = FOOD_ITEMS.filter(id => inv[id] > 0 && id !== 'spring_water');
        const availableDrink = [...new Set([...DRINK_ITEMS, 'spring_water'])].filter(id => inv[id] > 0);

        const btnStyle = `padding:4px 8px;border-radius:5px;border:1px solid rgba(197,160,89,0.4);background:rgba(197,160,89,0.1);color:var(--ink-primary);cursor:pointer;font-size:0.72rem;white-space:nowrap;`;

        let foodBtns = '';
        if (availableFood.length > 0) {
            foodBtns = `<div style="margin-top:10px;">
                <div style="font-size:0.7rem;opacity:0.55;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">${lang === 'en' ? 'Eat' : 'Jíst'}</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px;">
                    ${availableFood.map(id => {
                        const item = (typeof ItemsDB !== 'undefined' && ItemsDB[id]) || {};
                        const iname = lang === 'en' ? (item.name_en || id) : (item.name || id);
                        return `<button style="${btnStyle}" onclick="Game.eat('${id}');PersonaSystem.render();">
                            ${item.icon || '🍖'} ${iname} <span style="opacity:0.5;">(${inv[id]})</span>
                        </button>`;
                    }).join('')}
                </div>
            </div>`;
        }

        let drinkBtns = '';
        if (availableDrink.length > 0) {
            drinkBtns = `<div style="margin-top:8px;">
                <div style="font-size:0.7rem;opacity:0.55;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">${lang === 'en' ? 'Drink' : 'Pít'}</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px;">
                    ${availableDrink.map(id => {
                        const item = (typeof ItemsDB !== 'undefined' && ItemsDB[id]) || {};
                        const iname = lang === 'en' ? (item.name_en || id) : (item.name || id);
                        const fn = (id === 'water') ? `Game.drink('${id}')` : `Game.eat('${id}')`;
                        return `<button style="${btnStyle}" onclick="${fn};PersonaSystem.render();">
                            ${item.icon || '💧'} ${iname} <span style="opacity:0.5;">(${inv[id]})</span>
                        </button>`;
                    }).join('')}
                </div>
            </div>`;
        }

        return `
        <div style="background:rgba(0,0,0,0.05);padding:16px;border-radius:10px;border-left:3px solid var(--accent-gold);margin-bottom:12px;">
            <h4 style="margin:0 0 12px 0;color:var(--ink-primary);">⚡ Vigor</h4>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span>🍎 ${lang === 'en' ? 'Satiety' : 'Sytost'}</span>
                <strong>${satiety}/100</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span>💤 ${lang === 'en' ? 'Fatigue' : 'Únava'}</span>
                <strong>${fatigue}/100</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(197,160,89,0.2);">
                <span>⚡ Vigor</span>
                <strong style="color:${vigor >= 25 ? 'var(--accent-gold)' : vigor >= 10 ? '#e67e22' : '#c0392b'};">${vigor}%</strong>
            </div>
            <div style="font-size:0.8rem;opacity:0.6;margin-top:6px;">${recovText}</div>
            ${nonaBtn}
            ${meditBtnFd}
            ${foodBtns}
            ${drinkBtns}
        </div>`;
    },
};