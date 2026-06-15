// ═══════════════════════════════════════════════════════════════════════════
// DECAY SYSTEM v1 (B2 — simplified)
// Denní kažení zásob. Gate: tech_inventarium.
// Model: %/den z počtu kusů (bez timestampů per kus).
// Modifikátory: myši (zrní/chléb/sýr), sklady (redukce), overflow (×2).
// v2 plán: per-instance stáří, konzervace, sezónní vlivy.
// ═══════════════════════════════════════════════════════════════════════════

const DecaySystem = {

    DAY_MS: 24 * 60 * 60 * 1000,
    MICE_CAP: 30,   // max myší populace (30 myší = ×1.75 decay mult)

    // ── Sazby kažení (podíl/den) — single source of truth ────────────────
    // mice:true → položka podléhá myšímu multiplikátoru
    DECAY_RATES: {
        milk:         { rate: 0.30 },
        goat_milk:    { rate: 0.30 },
        cream:        { rate: 0.30 },
        meat:         { rate: 0.20 },
        fish:         { rate: 0.20 },
        carp:         { rate: 0.20 },
        chicken_meat: { rate: 0.20 },
        cooked_meat:  { rate: 0.15 },
        cooked_fish:  { rate: 0.15 },
        bread:        { rate: 0.10, mice: true },
        stew:         { rate: 0.15 },
        butter:       { rate: 0.08 },
        buttermilk:   { rate: 0.08 },
        berries:      { rate: 0.15 },
        mushroom:     { rate: 0.15 },
        egg:          { rate: 0.05 },
        cheese:       { rate: 0.03, mice: true },
        cured_meat:   { rate: 0.01, mice: true },
        lard:         { rate: 0.01 },
        rye_grain:    { rate: 0.005, mice: true },
        wheat_grain:  { rate: 0.005, mice: true },
        barley:       { rate: 0.005, mice: true },
        oats:         { rate: 0.005, mice: true },
        millet:       { rate: 0.005, mice: true },
        peas:         { rate: 0.005, mice: true },
    },

    // ── Gate ──────────────────────────────────────────────────────────────
    isActive: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_inventarium'));
    },

    _ensureState: function() {
        if (!GameState.decay) GameState.decay = { lastTick: 0, lastLosses: [] };
        return GameState.decay;
    },

    // ── Modifikátory ──────────────────────────────────────────────────────
    // Myší multiplikátor (jen pro mice:true položky)
    miceMult: function() {
        const n = (GameState.mice && GameState.mice.count) || 0;
        return 1 + n / 40;   // mírné: 30 myší = ×1.75
    },

    // Redukce dle nejlepšího postaveného skladu
    storageReduction: function() {
        const s = GameState.storage || {};
        if (s.horreum  && s.horreum.built)  return 0.30;  // −70 %
        if (s.cella    && s.cella.built)    return 0.50;  // −50 %
        if (s.almarium && s.almarium.built) return 0.70;  // −30 %
        return 1.0;
    },

    // Celková kapacita skladů (sjednoceno s renderBuildings logikou)
    totalCapacity: function() {
        const s = GameState.storage || {};
        let cap = 1000;   // base
        if (s.almarium && s.almarium.built) cap += 200;
        if (s.cella    && s.cella.built)    cap += 600;
        if (s.horreum  && s.horreum.built)  cap += 1600;
        return cap;       // max 3400
    },

    // Typy nepočítané do kapacity (nástroje na zdi, zvířata ve chlévě, knihy v knihovně)
    CAP_EXEMPT_TYPES: ['tool', 'animal', 'lore'],

    countsTowardCap: function(id) {
        const item = (typeof ItemsDB !== 'undefined') ? ItemsDB[id] : null;
        if (!item) return true;
        return !this.CAP_EXEMPT_TYPES.includes(item.type);
    },

    totalStock: function() {
        const inv = GameState.inventory || {};
        let s = 0;
        for (const [id, v] of Object.entries(inv)) {
            if (typeof v === 'number' && v > 0 && this.countsTowardCap(id)) s += v;
        }
        return s;
    },

    isOverflow: function() {
        return this.totalStock() > this.totalCapacity();
    },

    // ── Myší populace — denní tick (běží VŽDY, i bez tech) ────────────────
    miceTick: function() {
        if (!GameState.mice) GameState.mice = { count: 3, lastTick: 0 };
        const m = GameState.mice;
        const now = Date.now();
        if (now - (m.lastTick || 0) < this.DAY_MS) return;
        m.lastTick = now;

        // Spawn ∝ zásoby jídla/zrní; podzim+zima ×1.5 (myši táhnou do tepla)
        let foodStock = 0;
        const MICE_FOOD = ['rye_grain', 'wheat_grain', 'barley', 'oats', 'millet', 'peas', 'grain', 'bread', 'cheese', 'cured_meat'];
        MICE_FOOD.forEach(id => { foodStock += (GameState.inventory[id] || 0); });
        let spawn = Math.min(4, Math.floor(foodStock / 25) + 1);
        const month = new Date().getMonth();           // 0=led
        if (month >= 8 || month <= 1) spawn = Math.ceil(spawn * 1.5);   // září–únor
        m.count = Math.min(this.MICE_CAP, m.count + spawn);

        // Pastičky: každá −1 myš/den, 10% šance rozbití
        let traps = GameState.inventory['mousetrap'] || 0;
        if (traps > 0 && m.count > 0) {
            const effective = Math.min(3, traps);       // cap 3 aktivní pasti
            const caught = Math.min(m.count, effective);
            m.count -= caught;
            let broken = 0;
            for (let i = 0; i < effective; i++) if (Math.random() < 0.10) broken++;
            if (broken) {
                GameState.inventory['mousetrap'] = Math.max(0, traps - broken);
                if (typeof UI !== 'undefined' && UI.notify) UI.notify('🪤 ' + t('decay.trapBroken').replace('{n}', broken), true);
            }
        }

        // Přirozená úmrtnost
        if (m.count > 5 && Math.random() < 0.3) m.count -= 1;
    },

    // ── Denní tick (volán z game.js, self-guarded 24h) ────────────────────
    dailyTick: function() {
        this.miceTick();                       // myši žijí vždy
        if (!this.isActive()) return;          // decay až za tech_inventarium
        const st = this._ensureState();
        const now = Date.now();
        if (now - st.lastTick < this.DAY_MS) return;
        st.lastTick = now;

        const inv = GameState.inventory || {};
        const mMult = this.miceMult();
        const sRed = this.storageReduction();
        const oMult = this.isOverflow() ? 2 : 1;

        const losses = [];
        for (const [id, def] of Object.entries(this.DECAY_RATES)) {
            const count = inv[id] || 0;
            if (count <= 0) continue;
            let rate = def.rate * sRed * oMult;
            if (def.mice) rate *= mMult;
            rate = Math.min(0.9, rate);

            const exact = count * rate;
            let lost = Math.floor(exact);
            if (Math.random() < (exact - lost)) lost += 1;   // pravděpodobnostní zbytek
            if (lost <= 0) continue;

            inv[id] = Math.max(0, count - lost);
            losses.push({ id, lost });
        }

        st.lastLosses = losses;
        if (losses.length) this._notifyLosses(losses, oMult > 1);
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    _notifyLosses: function(losses, overflow) {
        const parts = losses.map(l => {
            const nm = (typeof iName === 'function') ? iName(l.id) : l.id;
            return `${l.lost}× ${nm}`;
        });
        let msg = t('decay.lossMsg').replace('{items}', parts.join(', '));
        if (overflow) msg += ' ' + t('decay.overflowNote');
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            NotificationSystem.panel('📦 ' + msg, 'warning');
        } else if (typeof UI !== 'undefined' && UI.notify) {
            UI.notify('📦 ' + msg, true);
        }
    },

    // ── Helpers pro Inventarium UI ────────────────────────────────────────
    // Efektivní denní sazba položky (po modifikátorech), null = nekazí se
    effectiveRate: function(id) {
        const def = this.DECAY_RATES[id];
        if (!def) return null;
        let rate = def.rate * this.storageReduction() * (this.isOverflow() ? 2 : 1);
        if (def.mice) rate *= this.miceMult();
        return Math.min(0.9, rate);
    },

    miceFuzzyShort: function() {
        const n = (GameState.mice && GameState.mice.count) || 0;
        if (n <= 1)  return t('decay.miceNone');
        if (n <= 6)  return t('decay.miceFew');
        if (n <= 15) return t('decay.miceSome');
        return t('decay.miceMany');
    },
};