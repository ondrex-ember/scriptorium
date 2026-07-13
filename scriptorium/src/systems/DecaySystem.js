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
    // flies:true → položka podléhá mouchovému multiplikátoru (viz fliesMult)
    DECAY_RATES: {
        milk:         { rate: 0.30 },
        goat_milk:    { rate: 0.30 },
        cream:        { rate: 0.30 },
        meat:         { rate: 0.20, flies: true },
        fish:         { rate: 0.20, flies: true },
        carp:         { rate: 0.20, flies: true },
        chicken_meat: { rate: 0.20, flies: true },
        cooked_meat:  { rate: 0.15, flies: true },
        cooked_fish:  { rate: 0.15, flies: true },
        bread:        { rate: 0.10, mice: true },
        stew:         { rate: 0.15, flies: true },
        butter:       { rate: 0.08 },
        buttermilk:   { rate: 0.08 },
        berries:      { rate: 0.15 },
        mushroom:     { rate: 0.15 },
        egg:          { rate: 0.05 },
        cheese:       { rate: 0.03, mice: true, flies: true },
        cured_meat:   { rate: 0.01, mice: true },
        lard:         { rate: 0.01 },
        rye_grain:    { rate: 0.005, mice: true },
        rye_grain_1:  { rate: 0.005, mice: true },
        rye_grain_2:  { rate: 0.005, mice: true },
        wheat_grain:  { rate: 0.005, mice: true },
        wheat_grain_1: { rate: 0.005, mice: true },
        wheat_grain_2: { rate: 0.005, mice: true },
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

    // Mouchový multiplikátor (jen pro flies:true položky, monastery-decay-mrd).
    // Aktivní hlavně v teplém období (květen–září). Hlavní faktor: postavené
    // Dvůr budovy + neuklizený hnůj (manure) ve skladu — vysoký stav manure
    // znamená, že hráč dlouho needlil chlévy. Vedlejší faktor: syrové maso/
    // ryby/sýr v inventáři (flies:true položky), menší váha.
    FLIES_FARMYARD_BUILDINGS: ['henhouse', 'sheepfold', 'cowbyre', 'pigsty', 'goatpen', 'rabbitry', 'stable', 'donkeyStall'],
    FLIES_MANURE_THRESHOLD: 20, // manure ve skladu, při kterém je penFactor na maximu
    fliesMult: function() {
        const month = new Date().getMonth() + 1; // 1–12
        const isFlySeason = (month >= 5 && month <= 9);
        if (!isFlySeason) return 1;

        const s = GameState.storage || {};
        let builtPens = 0;
        this.FLIES_FARMYARD_BUILDINGS.forEach(key => {
            if (GameState[key] && GameState[key].built) builtPens++;
        });
        const manureStock = (GameState.inventory && GameState.inventory['manure']) || 0;

        // Budovy + neuklizený hnůj — společný hlavní faktor (0–0.6)
        const penFactor = Math.min(1, builtPens / this.FLIES_FARMYARD_BUILDINGS.length) * 0.3;
        const manureFactor = Math.min(1, manureStock / this.FLIES_MANURE_THRESHOLD) * 0.3;
        // Syrové maso/ryby/sýr v inventáři — vedlejší faktor (0–0.4)
        let rawFoodStock = 0;
        Object.entries(this.DECAY_RATES).forEach(([id, def]) => {
            if (def.flies) rawFoodStock += (GameState.inventory && GameState.inventory[id]) || 0;
        });
        const rawFoodFactor = Math.min(1, rawFoodStock / 15) * 0.4;

        // Mucholapky (skleněná i papírová, funkčně stejné) — snižují výsledný
        // faktor, cap 3 aktivní (po vzoru mousetrap v miceTick), diminishing
        // returns na dalších kusech.
        const traps = ((GameState.inventory && GameState.inventory['fly_trap_glass']) || 0)
            + ((GameState.inventory && GameState.inventory['fly_trap_paper']) || 0);
        const trapReduction = Math.min(3, traps) * 0.15; // až −0.45 s 3+ pastmi

        return Math.max(1, 1 + penFactor + manureFactor + rawFoodFactor - trapReduction); // rozsah 1.0–2.0
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
        if (s.old_cellars && s.old_cellars.built) cap += 500;
        return cap;       // max 3900
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
        const MICE_FOOD = ['rye_grain', 'rye_grain_1', 'rye_grain_2', 'wheat_grain', 'wheat_grain_1', 'wheat_grain_2', 'barley', 'oats', 'millet', 'peas', 'grain', 'bread', 'cheese', 'cured_meat'];
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
        const fMult = this.fliesMult();
        const sRed = this.storageReduction();
        const oMult = this.isOverflow() ? 2 : 1;

        // Bestiář — Belzebub, Cesta A: mouchy poprvé dosáhnou nejhoršího
        // stupně ("many", fliesMult > 1.7) → auto-odemkne. Idempotentní.
        if (fMult > 1.7 && typeof SecretsSystem !== 'undefined') {
            SecretsSystem.unlockFolioById('folio_belzebub_bestiar');
        }

        const losses = [];
        for (const [id, def] of Object.entries(this.DECAY_RATES)) {
            const count = inv[id] || 0;
            if (count <= 0) continue;
            let rate = def.rate * sRed * oMult;
            if (def.mice) rate *= mMult;
            if (def.flies) rate *= fMult;
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

        // Bestiář — Belzebub, Cesta B: nález mezi zkaženými zásobami, jen
        // když si k tomu reálně kažení dnes vzalo něco (losses.length > 0).
        if (losses.length > 0) {
            const alreadyFolio = GameState.scrinium && GameState.scrinium.folios
                && GameState.scrinium.folios['folio_belzebub_bestiar'] && GameState.scrinium.folios['folio_belzebub_bestiar'].found;
            const alreadyHeld = (GameState.inventory['belzebub_spis'] || 0) > 0;
            if (!alreadyFolio && !alreadyHeld && Math.random() < 0.06) {
                if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('belzebub_spis', 1);
                if (typeof Game !== 'undefined' && Game.showBelzebubSpisModal) setTimeout(function () { Game.showBelzebubSpisModal(); }, 300);
            }
        }

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
        if (def.flies) rate *= this.fliesMult();
        return Math.min(0.9, rate);
    },

    miceFuzzyShort: function() {
        const n = (GameState.mice && GameState.mice.count) || 0;
        if (n <= 1)  return t('decay.miceNone');
        if (n <= 6)  return t('decay.miceFew');
        if (n <= 15) return t('decay.miceSome');
        return t('decay.miceMany');
    },

    // Fuzzy text pro mouchy (monastery-decay-mrd) — na škále fliesMult (1.0–2.0)
    fliesFuzzyShort: function() {
        const m = this.fliesMult();
        if (m <= 1.05) return t('decay.fliesNone');
        if (m <= 1.4)  return t('decay.fliesFew');
        if (m <= 1.7)  return t('decay.fliesSome');
        return t('decay.fliesMany');
    },
};