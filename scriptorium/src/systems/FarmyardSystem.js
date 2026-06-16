// ═══════════════════════════════════════════════════════════════════════════
// FARMYARD SYSTEM — Dvůr v3
// Extrahováno z GardenSystem.js, rozšířeno o:
//   • Animal object v2 (sex, age, mood, lastCleaned)
//   • Mood systém (decay, UKLIDIT, produkční multiplikátor)
//   • Manure produkce
//   • Donkey/Osel (Oslárna)
//   • Loan males (Beran/Kanec/Kozel via Cellarium — Kontakt se vsí)
//   • Pohlavní systém — základ pro Dvůr v3+
// ═══════════════════════════════════════════════════════════════════════════

const FarmyardSystem = {

    DAY_MS: 24 * 60 * 60 * 1000,

    // ── Animal config ─────────────────────────────────────────────────────
    ANIMAL_CFG: {
        rabbitry: { itemId: 'rabbit', cap: 6,
            build: { plank: 10, stick: 5, rope: 2 },
            breedMs: 7 * DAY_MS },
        goatpen:  { itemId: 'goat', cap: 3,
            build: { plank: 12, rock: 8, rope: 3 },
            milkMs: 12 * 60 * 60 * 1000 },
        pigsty:   { itemId: 'piglet', cap: 3,
            build: { cut_stone: 15, plank: 10 },
            growMs: 60 * DAY_MS,
            acornBoostMs: 5 * DAY_MS },
        donkeyStall: { itemId: 'donkey', cap: 2,
            build: { plank: 10, rock: 8, rope: 3 },
            fieldBonus: 0.15 },   // +15% pole yield
    },

    // Mood thresholds → produkční multiplikátor
    MOOD_MULT: function(mood) {
        if (mood >= 70) return 1.0;
        if (mood >= 50) return 0.8;
        if (mood >= 30) return 0.6;
        return 0.3;
    },

    MOOD_ICON: function(mood) {
        if (mood >= 70) return '😊';
        if (mood >= 50) return '😐';
        if (mood >= 30) return '😟';
        return '😤';
    },

    // Všechna zvířata ve všech výbězích pro mood tick
    ALL_PENS: ['rabbitry','goatpen','pigsty','donkeyStall'],

    // ── Lazy init ─────────────────────────────────────────────────────────
    _ensureAnimals: function() {
        if (!GameState.rabbitry)    GameState.rabbitry    = { built: false, animals: [], lastBreed: 0 };
        if (!GameState.goatpen)     GameState.goatpen     = { built: false, animals: [] };
        if (!GameState.pigsty)      GameState.pigsty      = { built: false, animals: [] };
        if (!GameState.donkeyStall) GameState.donkeyStall = { built: false, animals: [], lastCleanMs: 0 };
        if (!GameState.loanMale)    GameState.loanMale    = {};  // {type, returnsAt}
    },

    // Lazy-upgrade starých animal objektů na v2
    _ensureAnimalFields: function(a) {
        if (a.sex      === undefined) a.sex      = 'f';
        if (a.mood     === undefined) a.mood     = 80;
        if (a.lastCleaned === undefined) a.lastCleaned = 0;
        if (a.mature   === undefined) a.mature   = true;
        if (a.bornAt   === undefined) a.bornAt   = a.placedAt || Date.now();
        return a;
    },

    _upgradePenAnimals: function(pen) {
        const st = GameState[pen];
        if (st && Array.isArray(st.animals)) st.animals.forEach(a => this._ensureAnimalFields(a));
    },

    // ── Mood denní tick (voláno z DecaySystem/game.js) ───────────────────
    moodTick: function() {
        if (!GameState._farmyardMoodTick) GameState._farmyardMoodTick = 0;
        const now = Date.now();
        if (now - GameState._farmyardMoodTick < this.DAY_MS) return;
        GameState._farmyardMoodTick = now;
        this._ensureAnimals();
        this.ALL_PENS.forEach(pen => {
            const st = GameState[pen];
            if (!st || !st.built) return;
            st.animals.forEach(a => {
                this._ensureAnimalFields(a);
                // Pasivní decay −5/den; přeplněný výběh −10 navíc
                let decay = 5;
                const cap = this.ANIMAL_CFG[pen] ? this.ANIMAL_CFG[pen].cap : 6;
                if (st.animals.length > cap * 0.75) decay += 10;
                a.mood = Math.max(0, a.mood - decay);
            });
        });
        // Kurník + Ovčín (v GardenSystem state)
        this._moodTickLegacyPen('henhouse', 'hens');
        this._moodTickLegacyPen('sheepfold', 'sheep');
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    _moodTickLegacyPen: function(penKey, arrayKey) {
        const st = GameState[penKey];
        if (!st || !st.built || !Array.isArray(st[arrayKey])) return;
        const cap = arrayKey === 'hens' ? 10 : 8;
        const overFull = st[arrayKey].length > cap * 0.75;
        st[arrayKey].forEach(a => {
            if (typeof a !== 'object') return;
            this._ensureAnimalFields(a);
            let decay = 5;
            if (overFull) decay += 10;
            a.mood = Math.max(0, a.mood - decay);
        });
    },

    // ── UKLIDIT ───────────────────────────────────────────────────────────
    cleanPen: function(pen) {
        this._ensureAnimals();
        const st = GameState[pen] || GameState[pen === 'kurnik' ? 'henhouse' : pen === 'ovcin' ? 'sheepfold' : pen];
        const now = Date.now();

        // cooldown 24h
        const lastCleaned = st.lastCleanMs || 0;
        if (now - lastCleaned < this.DAY_MS) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('farmyard.cleanCooldown'), true);
            return;
        }
        st.lastCleanMs = now;

        // Mood +30 všem zvířatům
        const animals = st.animals || st.hens || st.sheep || [];
        animals.forEach(a => {
            if (typeof a === 'object') {
                this._ensureAnimalFields(a);
                a.mood = Math.min(100, a.mood + 30);
            }
        });

        // Generovat hnůj: 1–3 ks dle počtu zvířat
        const n = Math.max(1, Math.min(3, Math.ceil(animals.length / 2)));
        const inv = GameState.inventory;
        inv['manure'] = (inv['manure'] || 0) + n;

        if (typeof UI !== 'undefined' && UI.notify) UI.notify('💩 ' + t('farmyard.cleanDone').replace('{n}', n));
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
    },

    // ── Výpůjčka samce ────────────────────────────────────────────────────
    // Voláno z CellariumSystem "Kontakt se Vsí"
    borrowMale: function(type, costG) {
        if ((GameState.inventory['groše'] || 0) < costG && (GameState.inventory['grose'] || GameState.grose || 0) < costG) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('farmyard.borrowNoGold'), true);
            return false;
        }
        if (!GameState.loanMale) GameState.loanMale = {};
        if (GameState.loanMale.type && Date.now() < GameState.loanMale.returnsAt) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('farmyard.borrowActive'), true);
            return false;
        }
        // Odečíst groše (vzor CellariumSystem)
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) {
            const have = CellariumSystem.getGrose();
            if (have < costG) { if (typeof UI !== 'undefined') UI.notify(t('farmyard.borrowNoGold'), true); return false; }
            CellariumSystem.addGrose(-costG);
        }
        GameState.loanMale = { type, returnsAt: Date.now() + 3 * this.DAY_MS, cost: costG };
        if (typeof UI !== 'undefined' && UI.notify) UI.notify('🐏 ' + t('farmyard.borrowDone_' + type));
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        return true;
    },

    loanMaleActive: function(type) {
        const l = GameState.loanMale;
        return !!(l && l.type === type && Date.now() < l.returnsAt);
    },

    loanMaleRemainingH: function() {
        const l = GameState.loanMale;
        if (!l || Date.now() >= l.returnsAt) return 0;
        return Math.ceil((l.returnsAt - Date.now()) / (60 * 60 * 1000));
    },

    // ── Osel (Oslárna) ────────────────────────────────────────────────────
    _ensureDonkey: function() {
        if (!GameState.donkeyStall) GameState.donkeyStall = { built: false, animals: [], lastCleanMs: 0 };
    },

    buildDonkeyStall: function() {
        this._ensureDonkey();
        const cfg = this.ANIMAL_CFG.donkeyStall;
        const inv = GameState.inventory;
        if (!this._animalCanBuild(cfg.build)) { if (typeof UI !== 'undefined') UI.notify(t('dvur.notEnough'), true); return; }
        if (GameState.donkeyStall.built) return;
        Object.entries(cfg.build).forEach(([id, n]) => { inv[id] -= n; });
        GameState.donkeyStall.built = true;
        if (typeof UI !== 'undefined') UI.notify('🏗️ ' + t('farmyard.donkeyStallBuilt'));
        if (typeof Game !== 'undefined') Game.save();
        if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
    },

    placeDonkey: function() {
        this._ensureDonkey();
        const st = GameState.donkeyStall;
        const cfg = this.ANIMAL_CFG.donkeyStall;
        if (!st.built) return;
        if (st.animals.length >= cfg.cap) { if (typeof UI !== 'undefined') UI.notify(t('dvur.penFull'), true); return; }
        if ((GameState.inventory['donkey'] || 0) < 1) { if (typeof UI !== 'undefined') UI.notify(t('dvur.noAnimal'), true); return; }
        GameState.inventory['donkey'] -= 1;
        const a = { sex:'n', mood:80, bornAt:Date.now(), mature:true, lastCleaned:0, name:null };
        // Default jméno Ouško pro prvního osla
        if (st.animals.length === 0) a.name = 'Ouško';
        st.animals.push(a);
        if (typeof UI !== 'undefined') UI.notify('🫏 ' + t('farmyard.donkeyPlaced'));
        if (typeof Game !== 'undefined') Game.save();
        if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
    },

    renameDonkey: function(idx) {
        this._ensureDonkey();
        const a = GameState.donkeyStall.animals[idx];
        if (!a) return;
        const newName = prompt(t('farmyard.donkeyRename'), a.name || 'Ouško');
        if (newName && newName.trim()) {
            a.name = newName.trim();
            if (typeof Game !== 'undefined') Game.save();
            if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
        }
    },

    // Stubborn check — 10% šance odmítnutí
    donkeyWorking: function() {
        const st = GameState.donkeyStall;
        if (!st || !st.built || !st.animals.length) return false;
        const donkey = st.animals[0];
        if (!donkey || donkey.mood < 20) return false;
        // Stubborn flag resets daily
        const today = new Date().setHours(0,0,0,0);
        if (!st._stubbornDay || st._stubbornDay !== today) {
            st._stubbornDay = today;
            st._stubbornRefused = Math.random() < 0.10;
            if (st._stubbornRefused && typeof UI !== 'undefined') {
                UI.notify('🫏 ' + t('farmyard.donkeyStubborn').replace('{name}', donkey.name || 'Osel'));
            }
        }
        return !st._stubbornRefused;
    },

    // Field bonus — +15% pokud osel pracuje
    getFieldBonus: function() {
        return this.donkeyWorking() ? this.ANIMAL_CFG.donkeyStall.fieldBonus : 0;
    },

    // ── Render Oslárna ────────────────────────────────────────────────────
    renderDonkeyStall: function() {
        this._ensureDonkey();
        const st = GameState.donkeyStall;
        const cfg = this.ANIMAL_CFG.donkeyStall;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        let h = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        h += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🫏 ${t('farmyard.donkeyStallTitle')}</h3>`;

        if (!st.built) {
            const can = this._animalCanBuild(cfg.build);
            const costTxt = Object.entries(cfg.build).map(([id, n]) => `${n}× ${typeof iName === 'function' ? iName(id) : id}`).join(', ');
            h += `<p style="font-size:0.82rem; opacity:0.7; margin-bottom:10px;">${t('farmyard.donkeyBuildDesc')}</p>`;
            h += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic; margin-bottom:8px;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            h += `</div>`;
            return h;
        }

        h += `<div style="font-size:0.82rem; margin-bottom:10px;">${t('dvur.occupancy')}: <strong>${st.animals.length} / ${cfg.cap}</strong></div>`;
        const haveD = GameState.inventory['donkey'] || 0;
        h += `<button class="craft-btn" style="margin-bottom:10px;" onclick="FarmyardSystem.placeDonkey()"
            ${haveD > 0 && st.animals.length < cfg.cap ? '' : 'disabled'}>➕ ${t('farmyard.addDonkey')} (${t('dvur.have')}: ${haveD})</button>`;
        if (haveD === 0 && st.animals.length < cfg.cap) {
            h += `<div style="font-size:0.74rem; opacity:0.6; font-style:italic; margin-bottom:10px;">${t('dvur.buyAtMarket')}</div>`;
        }

        if (st.animals.length) {
            const working = this.donkeyWorking();
            h += `<div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.04); border-radius:8px;">`;
            h += `<div style="font-size:0.88rem; font-weight:bold; margin-bottom:6px;">`;
            st.animals.forEach((a, i) => {
                this._ensureAnimalFields(a);
                const mIcon = this.MOOD_ICON(a.mood);
                h += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style="font-size:1.4rem;">🫏</span>
                    <div style="flex:1;">
                        <span style="font-weight:bold;">${a.name || t('farmyard.donkeyDefault')}</span>
                        <span style="font-size:0.75rem; opacity:0.6; margin-left:6px;">${mIcon} ${a.mood}/100</span>
                        ${working ? `<span style="font-size:0.72rem; color:#5a9a5a; margin-left:4px;">⚡ +${Math.round(cfg.fieldBonus*100)}% ${lang==='en'?'field yield':'výnos pole'}</span>` : `<span style="font-size:0.72rem; color:#a0722d; margin-left:4px;">${t('farmyard.donkeyStubborn').replace('{name}','')}</span>`}
                    </div>
                    <button class="craft-btn" style="padding:3px 7px; font-size:0.7rem;" onclick="FarmyardSystem.renameDonkey(${i})">✏️</button>
                </div>`;
            });
            h += `</div>`;

            // UKLIDIT
            const canClean = Date.now() - (st.lastCleanMs || 0) >= this.DAY_MS;
            h += `<button class="craft-btn" style="margin-top:6px;" onclick="FarmyardSystem.cleanPen('donkeyStall')" ${canClean ? '' : 'disabled'}>
                🧹 ${t('farmyard.clean')} ${canClean ? '' : `(${t('farmyard.cleanCooldown')})`}
            </button>`;
            h += `</div>`;
        }

        h += `</div>`;
        return h;
    },

    // ── Shared helpers (moved from GardenSystem) ──────────────────────────
    _animalCanBuild: function(cost) {
        const inv = GameState.inventory || {};
        return Object.entries(cost).every(([id, n]) => (inv[id] || 0) >= n);
    },

    _penHungry: function(key) {
        const f = GameState.feeding && GameState.feeding[key];
        return !!(f && f.hunger > 0);
    },

    _pigMature: function(a) {
        return Date.now() - a.placedAt >= this.ANIMAL_CFG.pigsty.growMs;
    },

    // ── Animal pen actions (delegated by GardenSystem stubs) ─────────────
    buildAnimalPen: function(pen) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        if (!cfg || GameState[pen].built) return;
        if (!this._animalCanBuild(cfg.build)) { if (typeof UI !== 'undefined') UI.notify(t('dvur.notEnough'), true); return; }
        Object.entries(cfg.build).forEach(([id, n]) => { GameState.inventory[id] -= n; });
        GameState[pen].built = true;
        if (typeof UI !== 'undefined') UI.notify('🏗️ ' + t('dvur.built_' + pen));
        if (typeof Game !== 'undefined') Game.save();
        if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
    },

    placeAnimal: function(pen) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        const st = GameState[pen];
        if (!cfg || !st.built) return;
        if (st.animals.length >= cfg.cap) { if (typeof UI !== 'undefined') UI.notify(t('dvur.penFull'), true); return; }
        if ((GameState.inventory[cfg.itemId] || 0) < 1) { if (typeof UI !== 'undefined') UI.notify(t('dvur.noAnimal'), true); return; }
        GameState.inventory[cfg.itemId] -= 1;
        const sex = (pen === 'rabbitry') ? (st.animals.length % 2 === 0 ? 'f' : 'm') : 'f';
        const a = { sex, mood:80, mature:true, bornAt:Date.now(), lastCleaned:0 };
        if (pen === 'goatpen') a.lastMilk = Date.now();
        st.animals.push(a);
        if (typeof UI !== 'undefined') UI.notify(t('dvur.placed_' + pen));
        if (typeof Game !== 'undefined') Game.save();
        if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
    },

    _rabbitBreedCheck: function() {
        const st = GameState.rabbitry, cfg = this.ANIMAL_CFG.rabbitry;
        if (!st || !st.built || !st.animals.length) return;
        if (this._penHungry('rabbitry')) { st.lastBreed = Date.now(); return; }
        const males = st.animals.filter(a => a.sex === 'm');
        const females = st.animals.filter(a => a.sex === 'f' && a.mature);
        if (!males.length || !females.length || st.animals.length >= cfg.cap) return;
        const now = Date.now();
        if (!st.lastBreed) { st.lastBreed = now; return; }
        let births = 0;
        while (now - st.lastBreed >= cfg.breedMs && st.animals.length < cfg.cap) {
            st.lastBreed += cfg.breedMs;
            if (Math.random() < 0.6) {
                const sex = Math.random() < 0.5 ? 'm' : 'f';
                st.animals.push({ sex, mood:80, mature:false, bornAt:now, lastCleaned:0 });
                births++;
            }
        }
        if (now - st.lastBreed >= cfg.breedMs) st.lastBreed = now;
        if (births) {
            if (typeof UI !== 'undefined') UI.notify('🐇 ' + t('dvur.rabbitBorn'));
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('event', '🐇 V králíkárně přibylo mládě.', '🐇 A kit was born in the rabbit hutch.', '🐇 Cuniculus natus est.');
            if (typeof Game !== 'undefined') Game.save();
        }
    },

    slaughterRabbit: function() {
        const st = GameState.rabbitry;
        if (!st || !st.built || !st.animals.length) return;
        st.animals.pop();
        GameState.inventory['rabbit_meat'] = (GameState.inventory['rabbit_meat'] || 0) + 1;
        GameState.inventory['rabbit_pelt'] = (GameState.inventory['rabbit_pelt'] || 0) + 1;
        if (typeof UI !== 'undefined') UI.notify('🍖 ' + t('dvur.rabbitSlaughtered'));
        if (typeof Game !== 'undefined') Game.save();
        if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
    },

    collectGoatMilk: function() {
        const st = GameState.goatpen, cfg = this.ANIMAL_CFG.goatpen;
        if (!st || !st.built) return;
        if (this._penHungry('goatpen')) { if (typeof UI !== 'undefined') UI.notify(t('dvur.goatsHungry'), true); return; }
        const now = Date.now();
        let milk = 0;
        st.animals.forEach(a => {
            this._ensureAnimalFields(a);
            const moodMult = this.MOOD_MULT(a.mood);
            if (now - (a.lastMilk || a.bornAt) >= cfg.milkMs) {
                if (Math.random() < moodMult) { milk++; }
                a.lastMilk = now;
                if (Math.random() < 0.05) GameState.inventory['goat_hide'] = (GameState.inventory['goat_hide'] || 0) + 1;
            }
        });
        if (milk) {
            GameState.inventory['goat_milk'] = (GameState.inventory['goat_milk'] || 0) + milk;
            if (typeof UI !== 'undefined') UI.notify('🥛 ' + t('dvur.goatMilked').replace('{n}', milk));
            if (typeof Game !== 'undefined') Game.save();
            if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
        } else {
            if (typeof UI !== 'undefined') UI.notify(t('dvur.goatNotReady'), true);
        }
    },

    feedAcorn: function(idx) {
        const st = GameState.pigsty, cfg = this.ANIMAL_CFG.pigsty;
        const a = st.animals[idx];
        if (!a) return;
        if ((GameState.inventory['acorn'] || 0) < 1) { if (typeof UI !== 'undefined') UI.notify(t('dvur.noAcorn'), true); return; }
        GameState.inventory['acorn'] -= 1;
        a.placedAt = (a.placedAt || a.bornAt || Date.now()) - cfg.acornBoostMs;
        if (typeof UI !== 'undefined') UI.notify('🌰 ' + t('dvur.acornFed'));
        if (typeof Game !== 'undefined') Game.save();
        if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
    },

    slaughterPig: function(idx) {
        const st = GameState.pigsty;
        const a = st.animals[idx];
        if (!a || !this._pigMature(a)) return;
        st.animals.splice(idx, 1);
        const inv = GameState.inventory;
        inv['meat']       = (inv['meat'] || 0) + 4;
        inv['lard']       = (inv['lard'] || 0) + 3;
        inv['cured_meat'] = (inv['cured_meat'] || 0) + 2;
        if (typeof UI !== 'undefined') UI.notify('🔪 ' + t('dvur.pigSlaughtered'));
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important', '🐖 Zabijačka! Klášterní spižírna se naplnila masem, sádlem a špekem.', '🐖 Pig slaughter! The monastery larder filled with meat, lard and cured meat.', '🐖 Porcus mactatus est.');
        if (typeof Game !== 'undefined') Game.save();
        if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard();
    },

    // ── Render animal pen (generic) ───────────────────────────────────────
    renderAnimalPen: function(pen) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        if (!cfg) return '';
        const st = GameState[pen];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const icons = { rabbitry:'🐇', goatpen:'🐐', pigsty:'🐖' };
        let h = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        h += `<h3 style="margin:0 0 12px 0; font-size:1rem;">${icons[pen] || '🐾'} ${t('dvur.title_' + pen)}</h3>`;

        if (!st.built) {
            h += `<p style="font-size:0.82rem; opacity:0.7; margin-bottom:10px;">${t('dvur.buildDesc_' + pen)}</p>`;
            h += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            h += `</div>`;
            return h;
        }

        if (pen === 'rabbitry') this._rabbitBreedCheck();

        h += `<div style="font-size:0.82rem; margin-bottom:10px;">${t('dvur.occupancy')}: <strong>${st.animals.length} / ${cfg.cap}</strong></div>`;

        if (this._penHungry(pen)) {
            h += `<div style="font-size:0.78rem; color:#c0392b; margin-bottom:8px;">⚠️ ${t('dvur.penHungry')}</div>`;
        }

        const haveItem = GameState.inventory[cfg.itemId] || 0;
        h += `<button class="craft-btn" style="margin-bottom:10px;" onclick="FarmyardSystem.placeAnimal('${pen}')"
            ${haveItem > 0 && st.animals.length < cfg.cap ? '' : 'disabled'}>➕ ${t('dvur.place_' + pen)} (${t('dvur.have')}: ${haveItem})</button>`;
        if (haveItem === 0 && st.animals.length < cfg.cap) {
            h += `<div style="font-size:0.74rem; opacity:0.6; font-style:italic; margin-bottom:10px;">${t('dvur.buyAtMarket')}</div>`;
        }

        // Animals list with mood
        if (st.animals.length) {
            h += `<div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">`;
            st.animals.forEach((a, i) => {
                this._ensureAnimalFields(a);
                const mIcon = this.MOOD_ICON(a.mood);
                const sexLabel = a.sex === 'm' ? (lang==='en'?'♂ male':'♂ samec') : a.sex === 'f' ? (lang==='en'?'♀ female':'♀ samice') : '';
                const isKid = a.mature === false;
                h += `<div style="padding:5px 8px; background:rgba(0,0,0,0.04); border-radius:5px; display:flex; align-items:center; gap:8px; font-size:0.78rem;">
                    <span>${icons[pen] || '🐾'}${isKid ? '🐣' : ''}</span>
                    <span style="opacity:0.7;">${sexLabel}</span>
                    <span>${mIcon} ${a.mood}/100</span>
                </div>`;
            });
            h += `</div>`;
        }

        // Actions
        if (pen === 'rabbitry' && st.animals.length) {
            const males = st.animals.filter(a => a.sex === 'm').length;
            const females = st.animals.filter(a => a.sex === 'f' && a.mature).length;
            if (males >= 1 && females >= 1 && st.animals.length < cfg.cap && !this._penHungry('rabbitry')) {
                h += `<div style="font-size:0.78rem; opacity:0.7; margin-bottom:8px;">💕 ${t('dvur.breeding')}</div>`;
            }
            h += `<button class="craft-btn" onclick="FarmyardSystem.slaughterRabbit()">🔪 ${t('dvur.slaughterRabbit')}</button>`;
        }

        if (pen === 'goatpen' && st.animals.length) {
            const now = Date.now();
            const ready = st.animals.filter(a => a.mature !== false && now - (a.lastMilk || a.bornAt) >= cfg.milkMs).length;
            h += `<button class="craft-btn" onclick="FarmyardSystem.collectGoatMilk()" ${ready ? '' : 'disabled'}>🥛 ${t('dvur.milkGoats')} (${ready})</button>`;
        }

        if (pen === 'pigsty' && st.animals.length) {
            h += `<div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">`;
            st.animals.forEach((a, i) => {
                const mature = this._pigMature(a);
                const pct = Math.min(100, Math.round((Date.now() - (a.placedAt || a.bornAt || Date.now())) / cfg.growMs * 100));
                h += `<div style="padding:8px 10px; background:rgba(0,0,0,0.04); border-radius:6px; display:flex; align-items:center; gap:8px;">
                    <span style="font-size:1.2rem;">${mature ? '🐖' : '🐷'}</span>
                    <div style="flex:1;">
                        <div style="font-size:0.78rem;">${mature ? t('dvur.pigMature') : t('dvur.pigGrowing') + ' ' + pct + '%'}</div>
                        <div style="height:5px; background:rgba(0,0,0,0.1); border-radius:3px; margin-top:3px;">
                            <div style="height:100%; width:${pct}%; background:var(--accent-gold); border-radius:3px;"></div>
                        </div>
                    </div>
                    ${mature
                        ? `<button class="craft-btn" style="padding:4px 8px; font-size:0.72rem;" onclick="FarmyardSystem.slaughterPig(${i})">🔪 ${t('dvur.slaughterPig')}</button>`
                        : `<button class="craft-btn" style="padding:4px 8px; font-size:0.72rem;" onclick="FarmyardSystem.feedAcorn(${i})" ${(GameState.inventory['acorn']||0)?'':'disabled'}>🌰 ${t('dvur.feedAcorn')}</button>`}
                </div>`;
            });
            h += `</div>`;
        }

        // UKLIDIT (všechny peny)
        const canClean = Date.now() - (st.lastCleanMs || 0) >= this.DAY_MS;
        if (st.animals.length) {
            h += `<button class="craft-btn" style="margin-top:10px; background:rgba(90,154,90,0.85);" onclick="FarmyardSystem.cleanPen('${pen}')" ${canClean ? '' : 'disabled'}>
                🧹 ${t('farmyard.clean')} ${canClean ? `(💩 +${Math.max(1,Math.min(3,Math.ceil(st.animals.length/2)))})` : `(${t('farmyard.cleanTomorrow')})`}
            </button>`;
        }

        h += `</div>`;
        return h;
    },

    // ── Dvůr render (main) ────────────────────────────────────────────────
    _dvurTab: 'kurnik',

    DVUR_TABS: [
        { id: 'kurnik',     icon: '🐔', tech: null },
        { id: 'ovcin',      icon: '🐑', tech: null },
        { id: 'kralikarna', icon: '🐇', tech: 'tech_cuniculi' },
        { id: 'kozi',       icon: '🐐', tech: 'tech_caprile' },
        { id: 'chlev',      icon: '🐖', tech: 'tech_suile' },
        { id: 'staj',       icon: '🐎', tech: 'tech_stabulum' },
        { id: 'oslarna',    icon: '🫏', tech: 'tech_asinus' },
        { id: 'studna',     icon: '🚰', tech: null },
    ],

    switchDvurTab: function(tab) {
        this._dvurTab = tab;
        this.renderFarmyard();
    },

    renderFarmyard: function() {
        const el = document.getElementById('farmyard-container');
        if (!el) return;
        const h = GameState.henhouse  || {};
        const s = GameState.sheepfold || {};
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        let html = '';

        // GALLINARIUM
        html += `<div style="margin-bottom:24px; padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        // ── Dvůr v2: dashboard + subtaby ──────────────────────────────────
        const tab = this._dvurTab || 'kurnik';
        html += this._renderDvurDashboard();
        html += this._renderDvurTabs(tab);

        if (tab === 'kurnik') {
            html += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🐔 ${t('farmyard.gallinarium')}</h3>`;
            if (!h.built) {
                html += `<p class="text-sm" style="opacity:0.7; margin-bottom:10px;">${t('farmyard.hennhouseBuildDesc')}</p>`;
                html += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            } else {
                const hensCount = (h.hens||[]).length;
                html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; font-size:0.82rem;">`;
                html += `<div>🐔 ${t('farmyard.hens')}: <strong>${hensCount}/10</strong></div>`;
                html += `<div>🐓 ${t('farmyard.rooster')}: <strong>${h.rooster ? '✓' : '✗'}</strong></div>`;
                const eggReady  = now >= (h.lastEggAt||0) + 28800000;
                const feathReady = now >= (h.lastFeatherAt||0) + 86400000;
                html += `<div>🥚 ${t('farmyard.eggs')}: <strong>${eggReady ? t('farmyard.ready') : Math.ceil(((h.lastEggAt||0)+28800000-now)/3600000)+'h'}</strong></div>`;
                html += `<div>🪶 ${t('farmyard.feathers')}: <strong>${feathReady ? t('farmyard.ready') : Math.ceil(((h.lastFeatherAt||0)+86400000-now)/3600000)+'h'}</strong></div>`;
                html += `</div>`;
                html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">`;
                if (!h.rooster) {
                    const hasR = (GameState.inventory['rooster']||0) > 0;
                    html += `<button class="craft-btn" onclick="Game.addHen('rooster')" ${hasR?'':'disabled'} style="font-size:0.75rem;">🐓 ${t('farmyard.addRooster')}</button>`;
                }
                ['hen_white','hen_black','hen_colored'].forEach(type => {
                    const has = (GameState.inventory[type]||0) > 0;
                    const icon = type==='hen_white'?'🐔':type==='hen_black'?'🐓':'🐣';
                    html += `<button class="craft-btn" onclick="Game.addHen('${type}')" ${has&&hensCount<10?'':'disabled'} style="font-size:0.75rem; white-space:normal; word-break:break-word;">${icon} ${iName(type)}</button>`;
                });
                html += `</div>`;
                html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">`;
                html += `<button class="craft-btn" onclick="Game.collectHenhouse()" ${hensCount>0?'':'disabled'}>🥚 ${t('farmyard.collect')}</button>`;
                html += `<button class="craft-btn" onclick="Game.feedHenhouse()" \${hensCount>0?'':'disabled'} style="background:#4a7c59;">🌾 \${t('farmyard.feed')}</button>`;
                html += `<button class="craft-btn" onclick="FarmyardSystem.cleanPen('kurnik')" style="background:rgba(90,154,90,0.85);">\${Date.now()-(GameState.henhouse.lastCleanMs||0)>=86400000 ? '🧹 '+t('farmyard.clean')+' (💩 +'+Math.max(1,Math.ceil(((GameState.henhouse.hens||[]).length)/3))+')' : '🧹 '+t('farmyard.cleanTomorrow')}</button>`;
                html += `</div>`;
                html += `<div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.06); border-radius:8px;">`;
                html += `<strong style="font-size:0.85rem;">🥚 ${t('farmyard.nesting')}</strong><br>`;
                if (!h.nesting) {
                    const canNest = h.rooster && hensCount > 0;
                    html += `<button class="craft-btn" onclick="Game.startNesting()" ${canNest?'':'disabled'} style="margin-top:6px; font-size:0.78rem;">${t('farmyard.startNesting')}</button>`;
                } else if (h.nesting.state === 'nesting') {
                    const left = Math.max(0, Math.ceil((h.nesting.hatchAt - now)/3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐣 ${t('farmyard.nestingProgress')} — ${left}h</p>`;
                } else if (h.nesting.state === 'growing') {
                    const left = Math.max(0, Math.ceil((h.nesting.grownAt - now)/3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐥 ${t('farmyard.chicksGrowing').replace('{n}', h.nesting.chicks)} — ${left}h</p>`;
                }
                if ((h.chickPool||0) > 0) {
                    html += `<div style="margin-top:8px; font-size:0.82rem;">🐓 ${t('farmyard.chickPool')}: <strong>${h.chickPool}</strong>
                        <button class="craft-btn" onclick="Game.slaughterChick(1)" style="margin-left:8px; font-size:0.72rem; background:#8b4a3a;">🍗 x1</button>
                        <button class="craft-btn" onclick="Game.slaughterChick(${h.chickPool})" style="margin-left:4px; font-size:0.72rem; background:#8b4a3a;">🍗 ${lang==='en'?'All':'Vše'}</button></div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        } else if (tab === 'ovcin') {
            // OVILE
            const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_de_re_rustica');
            html += `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid ${hasTech?'var(--accent-gold)':'rgba(0,0,0,0.2)'};">`;
            html += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🐑 ${t('farmyard.ovile')}</h3>`;
            if (!hasTech) {
                html += `<p class="text-sm" style="opacity:0.6; font-style:italic;">${t('farmyard.ovileLocked')}</p>`;
            } else if (!s.built) {
                html += `<p class="text-sm" style="opacity:0.7; margin-bottom:10px;">${t('farmyard.sheepfoldBuildDesc')}</p>`;
                html += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            } else {
                html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; font-size:0.82rem;">`;
                html += `<div>🐑 ${t('farmyard.sheep')}: <strong>${s.sheep||0}/6</strong></div>`;
                const milkReady = now >= (s.lastMilkAt||0) + 43200000;
                const woolReady = now >= (s.lastWoolAt||0) + 172800000;
                html += `<div>🥛 ${t('farmyard.milk')}: <strong>${milkReady ? t('farmyard.ready') : Math.ceil(((s.lastMilkAt||0)+43200000-now)/3600000)+'h'}</strong></div>`;
                html += `<div>🧶 ${t('farmyard.wool')}: <strong>${woolReady ? t('farmyard.ready') : Math.ceil(((s.lastWoolAt||0)+172800000-now)/3600000)+'h'}</strong></div>`;
                html += `</div>`;
                html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">`;
                const hasSheepItem = (GameState.inventory['sheep']||0) > 0;
                html += `<button class="craft-btn" onclick="Game.addSheep()" ${hasSheepItem&&(s.sheep||0)<6?'':'disabled'}>🐑 ${t('farmyard.addSheep')}</button>`;
                html += `<button class="craft-btn" onclick="Game.collectSheepfold()" ${(s.sheep||0)>0?'':'disabled'}>🥛 ${t('farmyard.collect')}</button>`;
                html += `<button class="craft-btn" onclick="Game.feedSheepfold()" ${(s.sheep||0)>0?'':'disabled'} style="background:#4a7c59;">🌿 ${t('farmyard.feed')}</button>`;
                if ((s.sheep||0) > 0) {
                    html += `<button class="craft-btn" onclick="Game.slaughterSheep()" style="background:#8b4a3a; font-size:0.78rem;">🥩 ${t('farmyard.slaughterSheep')}</button>`;
                }
                html += `</div>`;
                html += `<div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.06); border-radius:8px;">`;
                html += `<strong style="font-size:0.85rem;">🐑 ${t('farmyard.breeding')}</strong><br>`;
                if (!s.breeding) {
                    const canBreed = (s.sheep||0) >= 2;
                    html += `<button class="craft-btn" onclick="Game.startBreeding()" ${canBreed?'':'disabled'} style="margin-top:6px; font-size:0.78rem;">${t('farmyard.startBreeding')}</button>`;
                } else if (s.breeding.state === 'gestating') {
                    const left = Math.max(0, Math.ceil((s.breeding.bornAt - now)/3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🤰 ${t('farmyard.gestating')} — ${left}h</p>`;
                } else if (s.breeding.state === 'growing') {
                    const left = Math.max(0, Math.ceil((s.breeding.grownAt - now)/3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐑 ${t('farmyard.lambGrowing')} — ${left}h</p>`;
                }
                if ((s.lambPool||0) > 0) {
                    html += `<div style="margin-top:8px; font-size:0.82rem;">🐑 ${t('farmyard.lambPool')}: <strong>${s.lambPool}</strong>
                        <button class="craft-btn" onclick="Game.slaughterLamb(1)" style="margin-left:8px; font-size:0.72rem; background:#8b4a3a;">🥩 x1</button>
                        <button class="craft-btn" onclick="Game.slaughterLamb(${s.lambPool})" style="margin-left:4px; font-size:0.72rem; background:#8b4a3a;">🥩 ${lang==='en'?'All':'Vše'}</button></div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        } else if (tab === 'kralikarna' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_cuniculi')) {
            html += this.renderAnimalPen('rabbitry');
        } else if (tab === 'kozi' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_caprile')) {
            html += this.renderAnimalPen('goatpen');
        } else if (tab === 'chlev' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_suile')) {
            html += this.renderAnimalPen('pigsty');
        } else if (tab === 'staj' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_stabulum')) {
            html += this.renderAnimalPen('stable');
        } else if (tab !== 'studna') {
            html += this._renderDvurLocked(tab);
        }

        el.innerHTML = html;
        // Studna — statický blok v shell.html, jen show/hide dle subtabu
        const wellEl = document.getElementById('well-management');
        if (wellEl) wellEl.style.display = (tab === 'studna') ? 'block' : 'none';
    },

    _renderDvurTabs: function(active) {
        let h = `<div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px;">`;
        this.DVUR_TABS.forEach(tb => {
            const isActive = tb.id === active;
            const researched = !tb.tech || (GameState.researchedTechs && GameState.researchedTechs.includes(tb.tech));
            const lock = researched ? '' : ' 🔒';
            h += `<button class="filter-btn ${isActive ? 'active' : ''}" style="font-size:0.78rem; padding:5px 9px; ${researched ? '' : 'opacity:0.55;'}"
                onclick="FarmyardSystem.switchDvurTab('${tb.id}')">${tb.icon} ${t('dvur.tab_' + tb.id)}${lock}</button>`;
        });
        h += `</div>`;
        return h;
    },

    _renderDvurDashboard: function() {
        const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;
        const cat = GameState.cat || {};
        const hasCatTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_cura_felium');
        const miceN = (GameState.mice && GameState.mice.count) || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        let h = `<div style="margin-bottom:14px; padding:10px 12px; background:rgba(197,160,89,0.07); border:1px solid rgba(197,160,89,0.25); border-radius:8px; display:flex; flex-direction:column; gap:5px;">`;
        h += `<div style="font-size:0.68rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; opacity:0.55;">${t('dvur.dashTitle')}</div>`;

        const miceTxt = ds ? ds.miceFuzzyShort() : (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.miceFuzzy ? ScriptoriumCat.miceFuzzy() : '');
        h += `<div style="font-size:0.8rem;">🐭 ${miceTxt}</div>`;

        if (hasCatTech) {
            const title = (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.getTitle) ? ScriptoriumCat.getTitle() : '';
            const state = (cat.satiety !== undefined && cat.satiety < 30) ? t('dvur.catHunting') : t('dvur.catFed');
            h += `<div style="font-size:0.8rem;">🐈‍⬛ ${cat.name || ''} <span style="opacity:0.6;">(${title})</span> — ${state}</div>`;
        }

        // Osel dashboard row
        this._ensureDonkey();
        if (GameState.donkeyStall.built && GameState.donkeyStall.animals.length) {
            const d = GameState.donkeyStall.animals[0];
            this._ensureAnimalFields(d);
            const working = this.donkeyWorking();
            h += `<div style="font-size:0.8rem;">🫏 ${d.name || 'Osel'} — ${working ? `⚡ +${Math.round(this.ANIMAL_CFG.donkeyStall.fieldBonus*100)}% ${lang==='en'?'field yield':'výnos pole'}` : t('farmyard.donkeyStubborn').replace('{name}','')}</div>`;
        }

        if (GameState.storage && GameState.storage.horreum && GameState.storage.horreum.built) {
            const hayPens = [(GameState.sheepfold && GameState.sheepfold.sheep || []).length > 0,
                             (GameState.rabbitry && GameState.rabbitry.animals || []).length > 0,
                             (GameState.goatpen && GameState.goatpen.animals || []).length > 0].filter(Boolean).length;
            const grainPens = [(GameState.henhouse && GameState.henhouse.hens || []).length > 0,
                               (GameState.pigsty && GameState.pigsty.animals || []).length > 0].filter(Boolean).length;
            const parts = [];
            if (hayPens) parts.push(`${t('dvur.feedHay')}: ${Math.floor((GameState.inventory['hay'] || 0) / hayPens)} ${t('dvur.days')}`);
            if (grainPens) parts.push(`${t('dvur.feedGrain')}: ${Math.floor((GameState.inventory['grain'] || 0) / grainPens)} ${t('dvur.days')}`);
            if (parts.length) {
                const low = (hayPens && Math.floor((GameState.inventory['hay']||0)/hayPens) < 3) || (grainPens && Math.floor((GameState.inventory['grain']||0)/grainPens) < 3);
                h += `<div style="font-size:0.8rem; ${low ? 'color:#c0392b;' : ''}">🌾 ${t('dvur.feedStock')}: ${parts.join(' \u00b7 ')}</div>`;
            }
        }

        if (GameState.loanMale && GameState.loanMale.type && Date.now() < GameState.loanMale.returnsAt) {
            const h_rem = this.loanMaleRemainingH();
            h += `<div style="font-size:0.78rem; color:#5a9a5a;">🐏 ${t('farmyard.loanActive_' + GameState.loanMale.type)} (${h_rem}h)</div>`;
        }

        if (ds && ds.isActive() && miceN > 6) {
            h += `<div style="font-size:0.76rem; color:#a0722d;">⚠️ ${t('dvur.decayImpact')}</div>`;
        }

        h += `</div>`;
        return h;
    },

    _renderDvurLocked: function(tab) {
        const def = this.DVUR_TABS.find(tb => tb.id === tab);
        const researched = def && (!def.tech || (GameState.researchedTechs && GameState.researchedTechs.includes(def.tech)));
        if (researched) {
            return `<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic; font-size:0.85rem;">${def ? def.icon : ''} ${t('dvur.comingSoon')}</div>`;
        }
        const techNm = def && def.tech && typeof tName === 'function' ? tName(def.tech) : '';
        return `<div style="padding:20px; text-align:center; opacity:0.6; font-size:0.85rem;">🔒 <em>${t('dvur.lockedPrefix')} ${techNm}</em></div>`;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // GALLINARIUM — Kurník akce (přesunuto z game.js)
    // ═══════════════════════════════════════════════════════════════════════

    buildHenhouse: function() {
        const h = GameState.henhouse;
        if (h.built) return;
        if ((GameState.inventory['rock'] || 0) < 15)  { UI.notify(t('game.needStone') + ' (15)', true); return; }
        if ((GameState.inventory['stick'] || 0) < 10) { UI.notify(t('game.needWood')  + ' (10)', true); return; }
        if ((GameState.inventory['rope'] || 0) < 3)   { UI.notify(t('game.needRope')  + ' (3)',  true); return; }
        Game.removeItem('rock', 15); Game.removeItem('stick', 10); Game.removeItem('rope', 3);
        h.built = true;
        Game.save(); UI.renderFarmyard();
        UI.notify('🐔 ' + t('game.hennhouseBuilt'));
    },

    addHen: function(type) {
        const h = GameState.henhouse;
        if (!h.built) return;
        if (type === 'rooster') {
            if (h.rooster) { UI.notify(t('game.roosterAlready'), true); return; }
            if (!(GameState.inventory['rooster'] > 0)) { UI.notify(t('game.needRooster'), true); return; }
            Game.removeItem('rooster', 1);
            h.rooster = true;
        } else {
            if (h.hens.length >= 10) { UI.notify(t('game.hennsFull'), true); return; }
            if (!(GameState.inventory[type] > 0)) { UI.notify(t('game.needHen'), true); return; }
            Game.removeItem(type, 1);
            const sex = 'f';
            const mood = 80;
            h.hens.push({ type, sex, mood, addedAt: Date.now(), lastCleaned: 0 });
        }
        Game.save(); UI.renderFarmyard();
        UI.notify('🐔 ' + t('game.henAdded'));
    },

    startNesting: function() {
        const h = GameState.henhouse;
        if (!h.built || !h.rooster || h.hens.length === 0) { UI.notify(t('game.nestingReq'), true); return; }
        if (h.nesting) { UI.notify(t('game.nestingActive'), true); return; }
        const now = Date.now();
        h.nesting = { state: 'nesting', startedAt: now, hatchAt: now + 86400000 };
        Game.save(); UI.renderFarmyard();
        UI.notify('🥚 ' + t('game.nestingStarted'));
    },

    slaughterChick: function(qty) {
        const h = GameState.henhouse;
        qty = Math.min(qty, h.chickPool);
        if (qty <= 0) { UI.notify(t('game.noChicks'), true); return; }
        h.chickPool -= qty;
        Game.addItem('chicken_meat', qty);
        Game.addItem('feather_hen', qty * 2);
        Game.save(); UI.renderFarmyard();
        UI.notify('🍗 ' + t('game.slaughtered').replace('{qty}', qty));
    },

    slaughterHen: function(idx) {
        const h = GameState.henhouse;
        if (!h.hens[idx]) return;
        h.hens.splice(idx, 1);
        Game.addItem('chicken_meat', 2);
        Game.addItem('feather_hen', 3);
        Game.save(); UI.renderFarmyard();
        UI.notify('🍗 ' + t('game.henSlaughtered'));
    },

    collectHenhouse: function() {
        const h = GameState.henhouse;
        if (!h.built || h.hens.length === 0) return;
        const now = Date.now();
        const EGG_INTERVAL   = 8  * 3600000;
        const FEATH_INTERVAL = 24 * 3600000;
        let collected = false;
        if (now >= (h.lastEggAt || 0) + EGG_INTERVAL) {
            const moodAvg = h.hens.reduce((s, a) => s + ((typeof a === 'object' && a.mood) || 80), 0) / h.hens.length;
            const moodMult = this.MOOD_MULT(moodAvg);
            const mult = (h.rooster ? 1.2 : 1.0) * moodMult;
            const eggs = Math.floor(h.hens.length * mult);
            if (eggs > 0) { Game.addItem('egg', eggs); h.lastEggAt = now; collected = true; }
        }
        if (now >= (h.lastFeatherAt || 0) + FEATH_INTERVAL) {
            Game.addItem('feather_hen', h.hens.length);
            h.lastFeatherAt = now; collected = true;
        }
        if (collected) { Game.save(); UI.renderFarmyard(); UI.notify('🥚 ' + t('game.hennouseCollected')); }
        else UI.notify(t('game.hiveNotReady'), true);
    },

    feedHenhouse: function() {
        const h = GameState.henhouse;
        if (!h.built || h.hens.length === 0) return;
        const chickFeed = h.nesting && h.nesting.state === 'growing' ? Math.ceil(h.nesting.chicks / 2) : 0;
        const totalFeed = h.hens.length + chickFeed;
        const feedItem = (GameState.inventory['seeds_herb'] || 0) >= totalFeed ? 'seeds_herb' : 'seeds_vegetable';
        if ((GameState.inventory[feedItem] || 0) < totalFeed) { UI.notify(t('game.needFeedHen') + ' (' + totalFeed + ')', true); return; }
        Game.removeItem(feedItem, totalFeed);
        h.lastFedAt = Date.now();
        const hens = h.hens;
        if (Array.isArray(hens)) hens.forEach(a => { if (typeof a === 'object') a.mood = Math.min(100, (a.mood || 80) + 10); });
        Game.save(); UI.renderFarmyard();
        UI.notify('🌾 ' + t('game.henFed'));
    },

    // ═══════════════════════════════════════════════════════════════════════
    // OVILE — Ovčín akce (přesunuto z game.js)
    // ═══════════════════════════════════════════════════════════════════════

    buildSheepfold: function() {
        const s = GameState.sheepfold;
        if (s.built) return;
        if (!GameState.researchedTechs.includes('tech_de_re_rustica')) { UI.notify(t('game.needDeReRustica'), true); return; }
        if ((GameState.inventory['rock'] || 0) < 20)  { UI.notify(t('game.needStone') + ' (20)', true); return; }
        if ((GameState.inventory['stick'] || 0) < 15) { UI.notify(t('game.needWood')  + ' (15)', true); return; }
        if ((GameState.inventory['rope'] || 0) < 5)   { UI.notify(t('game.needRope')  + ' (5)',  true); return; }
        Game.removeItem('rock', 20); Game.removeItem('stick', 15); Game.removeItem('rope', 5);
        s.built = true;
        Game.save(); UI.renderFarmyard();
        UI.notify('🐑 ' + t('game.sheepfoldBuilt'));
    },

    addSheep: function() {
        const s = GameState.sheepfold;
        if (!s.built) return;
        if (s.sheep >= 6) { UI.notify(t('game.sheepFull'), true); return; }
        if (!(GameState.inventory['sheep'] > 0)) { UI.notify(t('game.needSheep'), true); return; }
        Game.removeItem('sheep', 1);
        s.sheep++;
        if (!Array.isArray(s.sheepObjs)) s.sheepObjs = [];
        s.sheepObjs.push({ sex: 'f', mood: 80, bornAt: Date.now(), lastCleaned: 0 });
        Game.save(); UI.renderFarmyard();
        UI.notify('🐑 ' + t('game.sheepAdded'));
    },

    startBreeding: function() {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep < 2) { UI.notify(t('game.breedingReq'), true); return; }
        if (s.breeding) { UI.notify(t('game.breedingActive'), true); return; }
        // Loan male check — beran ze vsi
        if (!this.loanMaleActive('ram')) { UI.notify(t('farmyard.needRam'), true); return; }
        const now = Date.now();
        s.breeding = { state: 'gestating', startedAt: now, bornAt: now + 172800000 };
        Game.save(); UI.renderFarmyard();
        UI.notify('🐑 ' + t('game.breedingStarted'));
    },

    slaughterLamb: function(qty) {
        const s = GameState.sheepfold;
        qty = Math.min(qty, s.lambPool);
        if (qty <= 0) { UI.notify(t('game.noLambs'), true); return; }
        s.lambPool -= qty;
        Game.addItem('mutton', qty * 2);
        Game.addItem('lamb_hide', qty);
        Game.save(); UI.renderFarmyard();
        UI.notify('🥩 ' + t('game.lambSlaughtered').replace('{qty}', qty));
    },

    slaughterSheep: function() {
        const s = GameState.sheepfold;
        if (s.sheep <= 0) return;
        s.sheep--;
        if (Array.isArray(s.sheepObjs) && s.sheepObjs.length) s.sheepObjs.pop();
        Game.addItem('mutton', 3);
        Game.addItem('raw_hide', 1);
        Game.save(); UI.renderFarmyard();
        UI.notify('🥩 ' + t('game.sheepSlaughtered'));
    },

    collectSheepfold: function() {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep === 0) return;
        const now = Date.now();
        const MILK_INTERVAL = 12 * 3600000;
        const WOOL_INTERVAL = 48 * 3600000;
        // Sezóna — mléko jaro/léto/podzim (ne zima)
        const month = new Date().getMonth(); // 0-based
        const milkSeason = month >= 2 && month <= 10; // březem–říjen
        let collected = false;
        const moodAvg = Array.isArray(s.sheepObjs) && s.sheepObjs.length
            ? s.sheepObjs.reduce((sum, a) => sum + (a.mood || 80), 0) / s.sheepObjs.length : 80;
        const moodMult = this.MOOD_MULT(moodAvg);
        if (milkSeason && now >= (s.lastMilkAt || 0) + MILK_INTERVAL) {
            const milkQty = Math.floor(s.sheep * moodMult);
            if (milkQty > 0) { Game.addItem('milk', milkQty); }
            s.lastMilkAt = now; collected = true;
        }
        if (now >= (s.lastWoolAt || 0) + WOOL_INTERVAL) {
            const woolQty = Math.floor(s.sheep * moodMult);
            if (woolQty > 0) { Game.addItem('wool', woolQty); }
            s.lastWoolAt = now; collected = true;
        }
        if (collected) { Game.save(); UI.renderFarmyard(); UI.notify('🐑 ' + t('game.sheepCollected')); }
        else UI.notify(t('game.hiveNotReady'), true);
    },

    feedSheepfold: function() {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep === 0) return;
        const lambFeed = s.breeding && s.breeding.state === 'growing' ? 1 : 0;
        const fiberNeeded = s.sheep * 2 + lambFeed;
        const waterNeeded = s.sheep + (lambFeed > 0 ? 1 : 0);
        if ((GameState.inventory['fiber'] || 0) < fiberNeeded) { UI.notify(t('game.needFeedSheep') + ' (' + fiberNeeded + ')', true); return; }
        if ((GameState.inventory['water'] || 0) < waterNeeded) { UI.notify(t('game.needWater'), true); return; }
        Game.removeItem('fiber', fiberNeeded);
        Game.removeItem('water', waterNeeded);
        s.lastFedAt = Date.now();
        if (Array.isArray(s.sheepObjs)) s.sheepObjs.forEach(a => { a.mood = Math.min(100, (a.mood || 80) + 10); });
        Game.save(); UI.renderFarmyard();
        UI.notify('🌿 ' + t('game.sheepFed'));
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PRODUCTION TICK — kurník/ovčín líhnutí a dorůstání (přesunuto z game.js)
    // ═══════════════════════════════════════════════════════════════════════

    checkFarmyardProduction: function() {
        const now = Date.now();
        let changed = false;
        const h = GameState.henhouse;
        if (h && h.nesting) {
            if (h.nesting.state === 'nesting' && now >= h.nesting.hatchAt) {
                const count = 2 + Math.floor(Math.random() * 3);
                h.nesting.state = 'growing'; h.nesting.chicks = count;
                h.nesting.hatchedAt = now; h.nesting.grownAt = now + 172800000;
                changed = true;
            }
            if (h.nesting.state === 'growing' && now >= h.nesting.grownAt) {
                const space = 10 - (h.chickPool || 0);
                h.chickPool = (h.chickPool || 0) + Math.min(h.nesting.chicks, space);
                h.nesting = null; changed = true;
            }
        }
        const s = GameState.sheepfold;
        if (s && s.breeding) {
            if (s.breeding.state === 'gestating' && now >= s.breeding.bornAt) {
                s.breeding.state = 'growing';
                s.breeding.lambAt = now; s.breeding.grownAt = now + 172800000;
                changed = true;
            }
            if (s.breeding.state === 'growing' && now >= s.breeding.grownAt) {
                const space = 6 - (s.lambPool || 0);
                if (space > 0) s.lambPool = (s.lambPool || 0) + 1;
                s.breeding = null; changed = true;
            }
        }
        if (changed) Game.save();
    },


};
