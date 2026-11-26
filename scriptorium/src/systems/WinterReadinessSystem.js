// ═══════════════════════════════════════════════════════════════════════════
// WinterReadinessSystem — read-only "Winter" card in the Cellarium
// (winter-readiness-mrd-2026-11-25, part C / O48, approved 25.11.2026).
//
// RULES
//  - NEVER writes GameState. Every number is computed on render from existing
//    functions and constants (ScavengeManager._availability, ConversiManager
//    REFECTORY_FOODS / _brotherPortion, FireplaceSystem.FUEL_VALUES, WellSystem.isFrozen).
//  - No new timer: the card is redrawn by the existing Cellarium render path.
//  - Not a historical claim: it only reports game state. Dates such as "1 March" are
//    game parameters, not historical data.
//  - Visible 15 Oct - 31 Mar (CellariumSystem lists the tab only when isVisible()).
// ═══════════════════════════════════════════════════════════════════════════
const WinterReadinessSystem = {
    // Fruit items that HealthcareManager counts against scurvy (Feb-Mar, fewer than 3 pieces).
    // Keep this list identical to HealthcareManager.healthConditionsDailyTick.
    FRUIT_IDS: ['berries', 'dried_wild_fruit', 'apple', 'pear'],
    FRUIT_NEEDED: 3,
    // Fuel items that FireplaceSystem.FUEL_VALUES prices in burning hours.
    FUEL_IDS: ['stick', 'wood', 'log', 'charcoal'],
    MONTHS_EN: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    _lang: function () {
        return (GameState.settings && GameState.settings.language) === 'en' ? 'en' : 'cs';
    },
    _tt: function (key, vars) {
        let s = t('winterReadiness.' + key);
        if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(String(vars[k])); });
        return s;
    },
    _num: function (n) {
        // one decimal at most, decimal comma in Czech
        const r = Math.round(n * 10) / 10;
        return this._lang() === 'cs' ? String(r).replace('.', ',') : String(r);
    },
    _fmtDate: function (ms) {
        const d = new Date(ms);
        return this._lang() === 'cs' ? (d.getDate() + '. ' + (d.getMonth() + 1) + '.') : (d.getDate() + ' ' + this.MONTHS_EN[d.getMonth()]);
    },

    // 15 Oct - 31 Mar (inclusive).
    isVisible: function (atMs) {
        const d = new Date(typeof atMs === 'number' ? atMs : Date.now());
        const m = d.getMonth();
        return (m === 9 && d.getDate() >= 15) || m >= 10 || m <= 2;
    },

    // Year in which the current winter started (Jan-Mar belong to the previous year's winter).
    _winterYear: function (now) {
        return now.getMonth() <= 2 ? now.getFullYear() - 1 : now.getFullYear();
    },

    // Scans noon of every day 15 Oct - 31 Mar of the winter. Returns the first and last day on
    // which the action is closed (availability below ScavengeManager.AVAILABILITY_CLOSED_BELOW)
    // and the lowest availability in the window. Nothing is hard-coded: the dates come from the
    // same _availability the actions use.
    _scan: function (type, winterYear) {
        let first = null, last = null, min = Infinity;
        const end = new Date(winterYear + 1, 2, 31, 12).getTime();
        for (let i = 0; ; i++) {
            const at = new Date(winterYear, 9, 15 + i, 12).getTime();
            if (at > end) break;
            const v = ScavengeManager._availability(type, at);
            if (v < min) min = v;
            if (v < ScavengeManager.AVAILABILITY_CLOSED_BELOW) { if (first === null) first = at; last = at; }
        }
        return { first: first, last: last, min: min };
    },

    // Whole days from today to 1 March of this winter (0 once March has begun).
    _daysToSpring: function (now) {
        const springYear = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
        const spring = new Date(springYear, 2, 1).getTime();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return Math.max(0, Math.round((spring - today) / 86400000));
    },

    // Refectory forecast. Stock = portions of REFECTORY_FOODS; demand per day = every lay brother
    // (1 portion) + every monk's fraction (ConversiManager._brotherPortion). The forecast is a
    // conservative lower bound (measured on 400 profiles: the real first hungry day is never
    // earlier), because monks accumulate fractional portions into whole meals.
    refectory: function (now) {
        const CM = ConversiManager;
        const inv = GameState.inventory || {};
        const stock = CM.REFECTORY_FOODS.reduce((s, f) => s + (inv[f] || 0), 0);
        const lay = (GameState.conversi || []).length;
        const brothers = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
        const demand = lay + brothers.reduce((s, b) => s + CM._brotherPortion(b), 0);
        if (demand <= 0) return null;
        const days = Math.floor(stock / demand);
        const left = this._daysToSpring(now);
        return { stock: stock, demand: demand, days: days, left: left, warn: left > 0 && days < left };
    },

    // Burning hours in stock: fuel items plus what is already in the hearth.
    fuel: function () {
        const inv = GameState.inventory || {};
        const FV = (typeof FireplaceSystem !== 'undefined' && FireplaceSystem.FUEL_VALUES) ? FireplaceSystem.FUEL_VALUES : {};
        let ms = this.FUEL_IDS.reduce((s, id) => s + (inv[id] || 0) * (FV[id] || 0), 0);
        if (GameState.fire && GameState.fire.active && GameState.fire.fuelMs > 0) ms += GameState.fire.fuelMs;
        return { hours: ms / 3600000 };
    },

    fruitCount: function () {
        const inv = GameState.inventory || {};
        return this.FRUIT_IDS.reduce((s, id) => s + (inv[id] || 0), 0);
    },

    // True when any animal pen holds animals (the card then points to the Farmyard).
    hasAnimals: function () {
        const g = GameState;
        const len = a => Array.isArray(a) ? a.length : 0;
        return len(g.sheepfold && g.sheepfold.sheep) + len(g.rabbitry && g.rabbitry.animals) + len(g.goatpen && g.goatpen.animals)
            + len(g.henhouse && g.henhouse.hens) + len(g.pigsty && g.pigsty.animals) + len(g.cowbyre && g.cowbyre.animals)
            + len(g.donkeyStall && g.donkeyStall.animals) + len(g.stable && g.stable.animals) > 0;
    },

    _row: function (txt) {
        return '<div style="font-size:0.85rem; margin:4px 0; color:var(--ink-primary);">' + txt + '</div>';
    },
    // Warnings always carry the icon and the words, so colour is never the only signal.
    _warn: function (txt) {
        return '<div style="font-size:0.85rem; margin:2px 0 8px; color:#c0392b;">' + txt + '</div>';
    },
    _title: function (txt) {
        return '<div style="font-size:0.9rem; font-weight:bold; margin:12px 0 4px; color:var(--ink-primary);">' + txt + '</div>';
    },

    render: function () {
        if (!this.isVisible()) return '';
        const now = new Date();
        const wy = this._winterYear(now);
        const tt = (k, v) => this._tt(k, v);
        let h = '<div id="winter-readiness-card" style="padding:15px; background:rgba(0,0,0,0.03); border-radius:8px; border-left:3px solid var(--accent-gold);">';
        h += '<div style="font-size:1rem; font-weight:bold; color:var(--ink-primary);">❄️ ' + tt('title') + '</div>';
        h += '<div style="font-size:0.85rem; opacity:0.75; font-style:italic; margin:4px 0 8px;">' + tt('intro') + '</div>';

        // ── Block 1: what winter closes (every player) ──
        h += this._title(tt('closedTitle'));
        const field = this._scan('foraging', wy);
        if (field.first !== null) h += this._row(tt('closedField', { from: this._fmtDate(field.first), to: this._fmtDate(field.last) }));
        const fish = this._scan('fishing', wy);
        if (fish.first !== null) h += this._row(tt('closedFishing', { from: this._fmtDate(fish.first), to: this._fmtDate(fish.last) }));
        const herbs = this._scan('nature', wy);
        if (herbs.min < 0.995) h += this._row(tt('herbs', { pct: Math.round(herbs.min * 100) }));
        const hunt = this._scan('hunt', wy);
        if (hunt.min >= 0.995) h += this._row(tt('huntFull'));
        else h += this._row(tt('hunt', { pct: Math.round(hunt.min * 100) }));

        // ── Block 2: the player's stores (a row appears only when it concerns the player) ──
        h += this._title(tt('stocksTitle'));
        const ref = this.refectory(now);
        if (ref) {
            h += this._row(tt(ref.left > 0 ? 'refectory' : 'refectoryNoDate', { stock: ref.stock, demand: this._num(ref.demand), days: ref.days, left: ref.left }));
            if (ref.warn) h += this._warn(tt('refectoryWarn'));
        }
        const fuel = this.fuel();
        if (fuel.hours < 0.05) {
            h += this._warn(tt('fuelNone'));
        } else {
            h += this._row(tt('fuel', { hours: this._num(fuel.hours), days: this._num(fuel.hours / 24) }));
        }
        const water = (GameState.inventory && GameState.inventory.water) || 0;
        const wellFrozen = !!(GameState.well && GameState.well.built && typeof WellSystem !== 'undefined' && WellSystem.isFrozen());
        h += this._row(tt('water', { n: water }) + (wellFrozen ? ' ' + tt('wellFrozen') : ''));
        if (water <= 0) h += this._warn(tt('waterNone'));
        const month = now.getMonth();
        if (month === 11 || month <= 2) {
            const fruit = this.fruitCount();
            h += this._row(tt('fruit', { n: Math.min(fruit, this.FRUIT_NEEDED) }));
            if (fruit < this.FRUIT_NEEDED) h += this._warn(tt('fruitWarn'));
        }
        if (this.hasAnimals()) h += this._row(tt('yard'));
        h += '</div>';
        return h;
    },
};
