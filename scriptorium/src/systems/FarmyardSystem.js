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
        rabbitry: {
            itemId: ['rabbit_m', 'rabbit_f'], cap: 6,
            build: { plank: 10, stick: 5, rope: 2 },
            breedMs: 7 * 24 * 60 * 60 * 1000
        },
        goatpen: {
            itemId: 'goat', cap: 3,
            build: { plank: 12, rock: 8, rope: 3 },
            milkMs: 12 * 60 * 60 * 1000
        },
        cowbyre: {
            itemId: 'cow', cap: 3,
            build: { cut_stone: 50, plank: 30, rope: 15 },
            milkMs: 12 * 60 * 60 * 1000
        },
        pigsty: {
            itemId: 'piglet', cap: 3,
            build: { cut_stone: 15, plank: 10 },
            growMs: 60 * 24 * 60 * 60 * 1000,
            acornBoostMs: 5 * 24 * 60 * 60 * 1000
        },
        stable: {
            itemId: 'horse', cap: 4,
            build: { cut_stone: 20, plank: 15, rope: 6 },
            milkMs: 0
        },   // koně: tažná síla, žádná produkce v1
        donkeyStall: {
            itemId: 'donkey', cap: 2,
            build: { plank: 10, rock: 8, rope: 3 },
            fieldBonus: 0.15
        },   // +15% pole yield
    },

    // ── Columbarium config ──────────────────────────────────────────────
    // VĚDOMĚ MIMO ANIMAL_CFG/ALL_PENS — Columbarium nemá individuální
    // zvířata (žádné animals[] pole, žádný mood/breeding tick). Jen
    // agregovaný count. Nikdy nepřidávat 'columbarium' do ALL_PENS ani
    // do ANIMAL_CFG — moodTick/buildAnimalPen/placeAnimal počítají
    // s jiným state shape a Columbarium by je rozbilo.
    COLUMBARIUM_CFG: {
        build: { cut_stone: 60, plank: 25, log: 15, wicker: 20, rope: 10 },
        startCount: 20,
        eggIntervalMs: 24 * 60 * 60 * 1000,
        featherIntervalMs: 24 * 60 * 60 * 1000,
        eggYield: 5,   // fixní strop, nezávislé na count
        featherYield: 3,  // fixní strop, nezávislé na count
    },

    // MRD Columbarium II — kapacita podle capacityTier (level 1 = start, level 2 = Columbaria Interna)
    // POZOR: samostatné pole od `level` (to znamená vybílení vápnem, viz whitewashColumbarium)
    COLUMBARIUM_CAPACITY_BY_LEVEL: { 1: 20, 2: 40 },
    COLUMBARIUM_UPGRADE_COST: { cut_stone: 30, plank: 10, vapno_hasene_mature: 5 },

    columbariumCapacity: function () {
        const tier = (GameState.columbarium && GameState.columbarium.capacityTier) || 1;
        return this.COLUMBARIUM_CAPACITY_BY_LEVEL[tier] || 20;
    },

    // Mood thresholds → produkční multiplikátor
    MOOD_MULT: function (mood) {
        if (mood >= 70) return 1.0;
        if (mood >= 50) return 0.8;
        if (mood >= 30) return 0.6;
        return 0.3;
    },

    MOOD_ICON: function (mood) {
        if (mood >= 70) return '😊';
        if (mood >= 50) return '😐';
        if (mood >= 30) return '😟';
        return '😤';
    },

    // ── Nálada v2 — odvozená z hladu (lastFedAt) + hygieny (lastCleanMs) ───
    // Nahrazuje starý mutovaný a.mood. Sdílená za celý výběh (zvířata v něm
    // se dnes stejně vždy krmí/uklízí společně). Self-healing: pokud
    // lastFedAt/lastCleanMs chybí nebo je 0 (staré save, nebo čerstvě
    // postavený výběh), nastaví se na "teď" — dá grace period místo
    // okamžitého propadu na 0.
    // Rozsah v2: rabbitry, henhouse, sheepfold, goatpen, cowbyre, pigsty.
    // Jen hlad (0-100) — pro disabled-guard na Feed tlačítku. Self-healing
    // stejně jako getMood.
    getHunger: function (pen) {
        const penKey = pen === 'kurnik' ? 'henhouse' : pen === 'kosar' ? 'sheepfold' : pen;
        const st = GameState[penKey];
        if (!st || !st.built) return 100;
        const now = Date.now();
        if (!st.lastFedAt) st.lastFedAt = now;
        const hoursSinceFed = (now - st.lastFedAt) / 3600000;
        return Math.max(0, Math.min(100, 100 - hoursSinceFed * (100 / 72)));
    },

    getMood: function (pen) {
        const penKey = pen === 'kurnik' ? 'henhouse' : pen === 'kosar' ? 'sheepfold' : pen;
        const st = GameState[penKey];
        if (!st || !st.built) return 80;

        let count, cap;
        if (penKey === 'henhouse') {
            count = Array.isArray(st.hens) ? st.hens.length : 0;
            cap = 10;
        } else if (penKey === 'sheepfold') {
            count = typeof st.sheep === 'number' ? st.sheep : 0;
            cap = 8;
        } else {
            count = Array.isArray(st.animals) ? st.animals.length : 0;
            cap = (this.ANIMAL_CFG[penKey] && this.ANIMAL_CFG[penKey].cap) || 6;
        }
        if (count === 0) return 80;

        const hunger = this.getHunger(penKey);

        const now = Date.now();
        if (!st.lastCleanMs) st.lastCleanMs = now;
        const hoursSinceClean = (now - st.lastCleanMs) / 3600000;
        const overcrowded = count > cap * 0.75;
        const hygiene = Math.max(0, Math.min(100, 100 - hoursSinceClean * (100 / 96) - (overcrowded ? 20 : 0)));

        return Math.round(hunger * 0.6 + hygiene * 0.4);
    },

    // Všechna zvířata ve všech výbězích pro mood tick
    ALL_PENS: ['rabbitry', 'goatpen', 'pigsty', 'donkeyStall', 'cowbyre'],
    // v2 mood systém (hunger+hygiene přes getMood) — tyhle výběhy už nemají
    // pasivní decay mutující a.mood. Mimo v2: donkeyStall, stable.
    MOOD_V2_PENS: ['rabbitry', 'henhouse', 'sheepfold', 'goatpen', 'cowbyre', 'pigsty'],

    // ── Lazy init ─────────────────────────────────────────────────────────
    _ensureAnimals: function () {
        if (!GameState.rabbitry) GameState.rabbitry = { built: false, animals: [], lastBreed: 0 };
        if (!GameState.goatpen) GameState.goatpen = { built: false, animals: [] };
        if (!GameState.cowbyre) GameState.cowbyre = { built: false, animals: [] };
        if (!GameState.pigsty) GameState.pigsty = { built: false, animals: [] };
        if (!GameState.donkeyStall) GameState.donkeyStall = { built: false, animals: [], lastCleanMs: 0 };
        if (!GameState.stable) GameState.stable = { built: false, animals: [], lastCleanMs: 0 };
        if (!GameState.columbarium) GameState.columbarium = { built: false, count: 0, lastEggAt: 0, lastFeatherAt: 0, lastCleanMs: 0, level: 1, lastPredatorTick: 0, nesting: null, squabPool: 0, capacityTier: 1 };
        if (GameState.columbarium.level === undefined) GameState.columbarium.level = 1;
        if (GameState.columbarium.lastPredatorTick === undefined) GameState.columbarium.lastPredatorTick = 0;
        if (GameState.columbarium.nesting === undefined) GameState.columbarium.nesting = null;
        if (GameState.columbarium.squabPool === undefined) GameState.columbarium.squabPool = 0;
        if (GameState.columbarium.capacityTier === undefined) GameState.columbarium.capacityTier = 1;
        if (!GameState.loanMale) GameState.loanMale = {};  // {type, returnsAt}
    },

    // Lazy-upgrade starých animal objektů na v2
    _ensureAnimalFields: function (a) {
        if (a.sex === undefined) a.sex = 'f';
        if (a.mood === undefined) a.mood = 80;
        if (a.lastCleaned === undefined) a.lastCleaned = 0;
        if (a.mature === undefined) a.mature = true;
        if (a.bornAt === undefined) a.bornAt = a.placedAt || Date.now();
        return a;
    },

    _upgradePenAnimals: function (pen) {
        const st = GameState[pen];
        if (st && Array.isArray(st.animals)) st.animals.forEach(a => this._ensureAnimalFields(a));
    },

    // ── Mood denní tick (voláno z DecaySystem/game.js) ───────────────────
    moodTick: function () {
        if (!GameState._farmyardMoodTick) GameState._farmyardMoodTick = 0;
        const now = Date.now();
        if (now - GameState._farmyardMoodTick < this.DAY_MS) return;
        GameState._farmyardMoodTick = now;
        this._ensureAnimals();
        this.ALL_PENS.forEach(pen => {
            if (this.MOOD_V2_PENS.includes(pen)) return; // v2: nálada z getMood(), ne z pasivního decay
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
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // ── UKLIDIT ───────────────────────────────────────────────────────────
    cleanPen: function (pen) {
        this._ensureAnimals();
        const penKey = pen === 'kurnik' ? 'henhouse' : pen === 'kosar' ? 'sheepfold' : pen;
        const st = GameState[penKey] || GameState[pen];
        const now = Date.now();

        // cooldown 24h
        const lastCleaned = st.lastCleanMs || 0;
        if (now - lastCleaned < this.DAY_MS) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('farmyard.cleanCooldown'), true);
            return;
        }
        st.lastCleanMs = now;

        // Mood +30 všem zvířatům — jen pro chlévy MIMO v2 (donkeyStall/stable).
        // v2 pens (rabbitry/henhouse/sheepfold/goatpen/cowbyre/pigsty) mají
        // náladu odvozenou z lastCleanMs přes getMood() — lastCleanMs výše
        // už je nastaven, žádná další mutace potřeba.
        // Ovčinec (sheepfold) drží jen POČET (st.sheep = číslo), ne pole —
        // Array.isArray hlídá, aby (číslo).forEach nespadlo (bug: shazovalo
        // celou checkConversiChores() a s ní i Zahony/Sad/atd. za Dvorem).
        const animalsRaw = st.animals || st.hens;
        const animals = Array.isArray(animalsRaw) ? animalsRaw : [];
        if (!this.MOOD_V2_PENS.includes(penKey)) {
            animals.forEach(a => {
                if (typeof a === 'object') {
                    this._ensureAnimalFields(a);
                    a.mood = Math.min(100, a.mood + 30);
                }
            });
        }

        // Generovat hnůj: 1–3 ks dle počtu zvířat (pole → .length, sheepfold → st.sheep)
        const animalCount = Array.isArray(animalsRaw) ? animalsRaw.length : (typeof st.sheep === 'number' ? st.sheep : 0);
        const n = Math.max(1, Math.min(3, Math.ceil(animalCount / 2)));
        const inv = GameState.inventory;
        inv['manure'] = (inv['manure'] || 0) + n;

        // Bestiář — Acedia. Nález vázaný na skutečné zanedbání: čím déle
        // tenhle chlév ležel neuklizený a čím víc dalšího je taky
        // zanedbáno (nízký Vigor, zaseklé Manufaktura taby), tím vyšší
        // šance najít spis přímo ve chvíli, kdy z toho zanedbání vylézáš.
        {
            const neglectDays = (now - lastCleaned) / this.DAY_MS;
            if (neglectDays >= 3) {
                const alreadyFolio = GameState.scrinium && GameState.scrinium.folios
                    && GameState.scrinium.folios['folio_acedia_bestiar'] && GameState.scrinium.folios['folio_acedia_bestiar'].found;
                const alreadyHeld = (GameState.inventory['acedia_spis'] || 0) > 0;
                if (!alreadyFolio && !alreadyHeld) {
                    let chance = 0.03;
                    if (typeof VigorSystem !== 'undefined' && VigorSystem.getVigorPct && VigorSystem.getVigorPct() < 30) chance += 0.05;
                    const staleFields = ['conversiGardenLastTick', 'conversiOrchardLastTick', 'conversiApiaryLastTick',
                                          'conversiPiscinaLastTick', 'conversiFieldLastTick', 'conversiVineaLastTick',
                                          'conversiAthanorLastTick', 'conversiScriptoriumLastTick'];
                    const DAY2 = 2 * this.DAY_MS;
                    const staleCount = staleFields.filter(f => GameState[f] > 0 && (now - GameState[f]) >= DAY2).length;
                    chance = Math.min(0.25, chance + staleCount * 0.02);
                    if (Math.random() < chance) {
                        if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('acedia_spis', 1);
                        if (typeof Game !== 'undefined' && Game.showAcediaSpisModal) setTimeout(function () { Game.showAcediaSpisModal(); }, 300);
                    }
                }
            }
        }

        if (typeof UI !== 'undefined' && UI.notify) UI.notify('💩 ' + t('farmyard.cleanDone').replace('{n}', n));
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this.renderFarmyard();
    },

    cleanColumbarium: function () {
        this._ensureAnimals();
        const c = GameState.columbarium;
        if (!c || !c.built) return;
        const now = Date.now();

        // cooldown 24h
        const lastCleaned = c.lastCleanMs || 0;
        if (now - lastCleaned < this.DAY_MS) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('farmyard.cleanCooldown'), true);
            return;
        }
        c.lastCleanMs = now;

        // Generovat hnůj: stejný vzorec jako cleanPen, 1–3 ks dle počtu ptáků
        // MRD Columbarium II — specificky pigeon_dung (guáno), ne obecný manure
        const n = Math.max(1, Math.min(3, Math.ceil(c.count / 2)));
        const inv = GameState.inventory;
        inv['pigeon_dung'] = (inv['pigeon_dung'] || 0) + n;

        if (typeof UI !== 'undefined' && UI.notify) UI.notify('💩 ' + t('farmyard.cleanDone').replace('{n}', n));
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this.renderFarmyard();
    },

    // ── Výpůjčka samce ────────────────────────────────────────────────────
    // Voláno z CellariumSystem "Kontakt se Vsí"
    borrowMale: function (type, costG) {
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
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
            const _dest = { ram: ['Ovile', 'Ovile'], billy_goat: ['Caprile', 'Caprile'], boar: ['Suile', 'Suile'] }[type] || ['', ''];
            Game.addKronikaEntry('important',
                '🐑 Forum Pecuarium: ' + t('farmyard.borrowDone_' + type) + ' Zamiř do ' + _dest[0] + ' a začni s plemenitbou, dokud výpůjčka trvá (3 dny).',
                '🐑 Forum Pecuarium: ' + t('farmyard.borrowDone_' + type) + ' Head to the ' + _dest[1] + ' and start breeding while the loan lasts (3 days).',
                '🐑 Forum Pecuarium: animal mutuo acceptum.'
            );
        }
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        return true;
    },

    loanMaleActive: function (type) {
        const l = GameState.loanMale;
        return !!(l && l.type === type && Date.now() < l.returnsAt);
    },

    loanMaleRemainingH: function () {
        const l = GameState.loanMale;
        if (!l || Date.now() >= l.returnsAt) return 0;
        return Math.ceil((l.returnsAt - Date.now()) / (60 * 60 * 1000));
    },

    // ── Osel (Oslárna) ────────────────────────────────────────────────────
    _ensureDonkey: function () {
        if (!GameState.donkeyStall) GameState.donkeyStall = { built: false, animals: [], lastCleanMs: 0 };
    },

    buildDonkeyStall: function () {
        this._ensureDonkey();
        const cfg = this.ANIMAL_CFG.donkeyStall;
        const inv = GameState.inventory;
        if (!this._animalCanBuild(cfg.build)) { if (typeof UI !== 'undefined') UI.notify(t('dvur.notEnough'), true); return; }
        if (GameState.donkeyStall.built) return;
        Object.entries(cfg.build).forEach(([id, n]) => { inv[id] -= n; });
        GameState.donkeyStall.built = true;
        if (typeof UI !== 'undefined') UI.notify('🏗️ ' + t('farmyard.donkeyStallBuilt'));
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    placeDonkey: function () {
        this._ensureDonkey();
        const st = GameState.donkeyStall;
        const cfg = this.ANIMAL_CFG.donkeyStall;
        if (!st.built) return;
        if (st.animals.length >= cfg.cap) { if (typeof UI !== 'undefined') UI.notify(t('dvur.penFull'), true); return; }
        if ((GameState.inventory['donkey'] || 0) < 1) { if (typeof UI !== 'undefined') UI.notify(t('dvur.noAnimal'), true); return; }
        GameState.inventory['donkey'] -= 1;
        const a = { sex: 'n', mood: 80, bornAt: Date.now(), mature: true, lastCleaned: 0, name: null };
        // Default jméno Ouško pro prvního osla
        if (st.animals.length === 0) a.name = 'Ouško';
        st.animals.push(a);
        if (typeof UI !== 'undefined') UI.notify('🫏 ' + t('farmyard.donkeyPlaced'));
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    renameDonkey: function (idx) {
        this._ensureDonkey();
        const a = GameState.donkeyStall.animals[idx];
        if (!a) return;
        const newName = prompt(t('farmyard.donkeyRename'), a.name || 'Ouško');
        if (newName && newName.trim()) {
            a.name = newName.trim();
            if (typeof Game !== 'undefined') Game.save();
            this.renderFarmyard();
        }
    },

    // Stubborn check — 10% šance odmítnutí
    donkeyWorking: function () {
        const st = GameState.donkeyStall;
        if (!st || !st.built || !st.animals.length) return false;
        const donkey = st.animals[0];
        if (!donkey || donkey.mood < 20) return false;
        // Stubborn flag resets daily
        const today = new Date().setHours(0, 0, 0, 0);
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
    getFieldBonus: function () {
        return this.donkeyWorking() ? this.ANIMAL_CFG.donkeyStall.fieldBonus : 0;
    },

    // ── Render Oslárna ────────────────────────────────────────────────────
    renderDonkeyStall: function () {
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
                        ${working ? `<span style="font-size:0.72rem; color:#5a9a5a; margin-left:4px;">⚡ +${Math.round(cfg.fieldBonus * 100)}% ${lang === 'en' ? 'field yield' : 'výnos pole'}</span>` : `<span style="font-size:0.72rem; color:#a0722d; margin-left:4px;">${t('farmyard.donkeyStubborn').replace('{name}', '')}</span>`}
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
    _animalCanBuild: function (cost) {
        const inv = GameState.inventory || {};
        return Object.entries(cost).every(([id, n]) => (inv[id] || 0) >= n);
    },

    // Tvrdý blok (dojení kozy/krávy, rozmnožování králíků) jen při kriticky
    // nízké náladě. Nad tím produkci škáluje MOOD_MULT samo.
    _penHungry: function (key) {
        return this.getMood(key) < 20;
    },

    // ── Krmná voda — užitková primárně, pramenitá jako záloha ────────────────
    // Vrací {ok, fromWater, fromSpring} bez konzumace (dry-run), pokud consume=false.
    _checkFeedWater: function (needed, consume) {
        const haveWater = GameState.inventory['water'] || 0;
        const fromWater = Math.min(needed, haveWater);
        const remaining = needed - fromWater;
        const haveSpring = GameState.inventory['spring_water'] || 0;
        const fromSpring = Math.min(remaining, haveSpring);
        const ok = (fromWater + fromSpring) >= needed;
        if (ok && consume) {
            if (fromWater > 0) Game.removeItem('water', fromWater);
            if (fromSpring > 0) Game.removeItem('spring_water', fromSpring);
        }
        return { ok: ok, fromWater: fromWater, fromSpring: fromSpring };
    },

    // ── Krátký údaj o zdrojích vody pro popisek u tlačítka Krmit ─────────────
    _feedWaterHint: function (needed, lang) {
        const haveWater = GameState.inventory['water'] || 0;
        const haveSpring = GameState.inventory['spring_water'] || 0;
        const low = haveWater < needed;
        const color = low ? '#c0392b' : 'inherit';
        return `<span style="color:${color};">💧${haveWater}${haveSpring > 0 ? ' 🫧' + haveSpring : ''}</span>`;
    },

    _pigMature: function (a) {
        return Date.now() - a.placedAt >= this.ANIMAL_CFG.pigsty.growMs;
    },

    // ── Columbarium (holubník) — bespoke build, mimo ANIMAL_CFG pattern ──
    buildColumbarium: function () {
        this._ensureAnimals();
        if (GameState.columbarium.built) return;
        if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_porta'))) {
            if (typeof UI !== 'undefined') UI.notify(t('dvur.lockedPrefix') + ' Porta', true);
            return;
        }
        const cfg = this.COLUMBARIUM_CFG;
        const can = Object.entries(cfg.build).every(([id, n]) => (GameState.inventory[id] || 0) >= n);
        if (!can) { if (typeof UI !== 'undefined') UI.notify(t('dvur.notEnough'), true); return; }
        Object.entries(cfg.build).forEach(([id, n]) => { GameState.inventory[id] -= n; });
        GameState.columbarium.built = true;
        // count zůstává 0 — holubi dorazí teprve po schválené petition 'columbarium'
        if (typeof UI !== 'undefined') UI.notify('🏗️ ' + t('farmyard.columbariumBuilt'));
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    collectColumbarium: function () {
        const c = GameState.columbarium;
        if (!c || !c.built || c.count <= 0) return;
        const cfg = this.COLUMBARIUM_CFG;
        const now = Date.now();
        let collected = false;
        if (now >= (c.lastEggAt || 0) + cfg.eggIntervalMs) {
            Game.addItem('egg', cfg.eggYield);
            c.lastEggAt = now;
            collected = true;
        }
        if (now >= (c.lastFeatherAt || 0) + cfg.featherIntervalMs) {
            Game.addItem('feather_hen', cfg.featherYield);
            c.lastFeatherAt = now;
            collected = true;
        }
        if (collected) { Game.save(); FarmyardSystem.renderFarmyard(); UI.notify('🥚 ' + t('farmyard.columbariumCollected')); }
        else UI.notify(t('game.penNotReady'), true);
    },

    // MRD Columbarium II — líheň. Mirror startNesting()/startBreeding() vzoru (Kurník/Chlév).
    startNestingColumbarium: function () {
        this._ensureAnimals();
        const c = GameState.columbarium;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!c || !c.built || (c.count || 0) < 2) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Needs at least 2 pigeons to nest.' : 'Ke hnízdění je potřeba aspoň pár holubů.', true);
            return;
        }
        if (c.nesting) {
            if (typeof UI !== 'undefined') UI.notify(t('game.nestingActive'), true);
            return;
        }
        const now = Date.now();
        let hatchMs = 72 * 60 * 60 * 1000; // 72h základ
        // Vikev — spotřebuje se, +25% rychlosti (přímo z Palladia: hrách a vikev)
        let usedVetch = false;
        if ((GameState.inventory['vikev'] || 0) > 0) {
            GameState.inventory['vikev']--;
            hatchMs = Math.round(hatchMs * 0.75);
            usedVetch = true;
        }
        c.nesting = { state: 'nesting', startedAt: now, hatchAt: now + hatchMs };
        Game.save();
        this.renderFarmyard();
        UI.notify('🕊️ ' + (lang === 'en'
            ? `Nesting begun.${usedVetch ? ' Vetch feed speeds the brood.' : ''}`
            : `Hnízdění zahájeno.${usedVetch ? ' Vikev urychlí odchov.' : ''}`));
    },

    // Squab pool → tři cesty (MRD): doplnit hejno / porazit na maso / rovnou do inventáře k prodeji
    populateSquabsColumbarium: function (qty) {
        this._ensureAnimals();
        const c = GameState.columbarium;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!c || (c.squabPool || 0) <= 0) return;
        const cap = this.columbariumCapacity();
        const space = Math.max(0, cap - (c.count || 0));
        const n = Math.max(0, Math.min(qty || c.squabPool, c.squabPool, space));
        if (n <= 0) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'The dovecote is at full capacity.' : 'Holubník je na plné kapacitě.', true);
            return;
        }
        c.squabPool -= n;
        c.count = (c.count || 0) + n;
        Game.save();
        this.renderFarmyard();
        UI.notify('🕊️ ' + (lang === 'en' ? `+${n} pigeons joined the flock.` : `+${n} holubů přibylo do hejna.`));
    },

    slaughterSquabColumbarium: function (qty) {
        this._ensureAnimals();
        const c = GameState.columbarium;
        if (!c) return;
        const n = Math.max(0, Math.min(qty || 1, c.squabPool || 0));
        if (n <= 0) return;
        c.squabPool -= n;
        Game.addItem('pigeon_squab', n);
        Game.save();
        this.renderFarmyard();
        UI.notify('🍗 +' + n + ' × ' + (typeof iName === 'function' ? iName('pigeon_squab') : 'pigeon_squab'));
    },

    slaughterAdultColumbarium: function (qty) {
        this._ensureAnimals();
        const c = GameState.columbarium;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!c) return;
        const n = Math.max(0, Math.min(qty || 1, c.count || 0));
        if (n <= 0) return;
        if (typeof confirm === 'function' && !confirm(lang === 'en'
            ? `Slaughter ${n} pigeon(s) from the flock? This permanently reduces the population.`
            : `Porazit ${n} holuba/holubů z hejna? Trvale to sníží populaci.`)) return;
        c.count -= n;
        Game.addItem('pigeon_meat', n);
        Game.save();
        this.renderFarmyard();
        UI.notify('🍖 +' + n + ' × ' + (typeof iName === 'function' ? iName('pigeon_meat') : 'pigeon_meat'));
    },

    // MRD Columbarium II — kapacita 40. Kniha (requiresBook přes tech) + tech + materiál + vápno.
    upgradeColumbariumCapacity: function () {
        this._ensureAnimals();
        const c = GameState.columbarium;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!c || !c.built) return;
        if ((c.capacityTier || 1) >= 2) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Already upgraded.' : 'Už vylepšeno.', true);
            return;
        }
        if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_columbaria_interna'))) {
            if (typeof UI !== 'undefined') UI.notify(t('dvur.lockedPrefix') + ' Columbaria Interna', true);
            return;
        }
        const cost = this.COLUMBARIUM_UPGRADE_COST;
        const can = Object.entries(cost).every(([id, n]) => (GameState.inventory[id] || 0) >= n);
        if (!can) { if (typeof UI !== 'undefined') UI.notify(t('dvur.notEnough'), true); return; }
        Object.entries(cost).forEach(([id, n]) => { GameState.inventory[id] -= n; });
        c.capacityTier = 2;
        Game.save();
        this.renderFarmyard();
        UI.notify('🏗️ ' + (lang === 'en' ? 'Columbaria Interna built — capacity 40.' : 'Vnitřní kolumbária postavena — kapacita 40.'));
    },

    // ── Level 2 — nabílení vápnem (tech_calcaria), odstraní riziko predátora ──
    WHITEWASH_COST: { vapno_hasene_mature: 3 },
    whitewashColumbarium: function () {
        this._ensureAnimals();
        const c = GameState.columbarium;
        if (!c.built || c.level >= 2) return;
        if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_calcaria'))) {
            if (typeof UI !== 'undefined') UI.notify(t('dvur.lockedPrefix') + ' Calcaria', true);
            return;
        }
        const can = Object.entries(this.WHITEWASH_COST).every(([id, n]) => (GameState.inventory[id] || 0) >= n);
        if (!can) { if (typeof UI !== 'undefined') UI.notify(t('dvur.notEnough'), true); return; }
        Object.entries(this.WHITEWASH_COST).forEach(([id, n]) => { GameState.inventory[id] -= n; });
        c.level = 2;
        if (typeof UI !== 'undefined') UI.notify('⬜ ' + t('farmyard.columbariumWhitewashed'));
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    // ── Predátor — denní kontrola (self-guarded 24h, jen level 1) ───────────
    // Kuna/had loví jen dokud jsou zdi nenabílené (historicky doloženo —
    // hladké nabílené zdi znemožňovaly šplhání). Level 2 = imunita.
    PREDATOR_CHANCE: 0.08,
    PREDATOR_LOSS_MIN: 1,
    PREDATOR_LOSS_MAX: 2,
    columbariumPredatorTick: function () {
        this._ensureAnimals();
        const c = GameState.columbarium;
        if (!c.built || c.count <= 0 || c.level >= 2) return;
        const now = Date.now();
        if (now - (c.lastPredatorTick || 0) < this.DAY_MS) return;
        c.lastPredatorTick = now;
        if (Math.random() < this.PREDATOR_CHANCE) {
            const loss = this.PREDATOR_LOSS_MIN + Math.floor(Math.random() * (this.PREDATOR_LOSS_MAX - this.PREDATOR_LOSS_MIN + 1));
            const actualLoss = Math.min(loss, c.count);
            c.count -= actualLoss;
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                NotificationSystem.panel('🦡 ' + (lang === 'en'
                    ? `A marten struck the dovecote — ${actualLoss} pigeon(s) lost.`
                    : `Kuna se dostala do holubníku — ztraceno ${actualLoss} holub(ů).`), 'warning');
            }
            if (typeof Game !== 'undefined') Game.save();
        }
    },

    // ── Animal pen actions (delegated by GardenSystem stubs) ─────────────
    buildAnimalPen: function (pen) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        if (!cfg || GameState[pen].built) return;
        if (!this._animalCanBuild(cfg.build)) { if (typeof UI !== 'undefined') UI.notify(t('dvur.notEnough'), true); return; }
        Object.entries(cfg.build).forEach(([id, n]) => { GameState.inventory[id] -= n; });
        GameState[pen].built = true;
        if (typeof UI !== 'undefined') UI.notify('🏗️ ' + t('dvur.built_' + pen));
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    // Sex ze suffixu itemId: rabbit_m→m, rabbit_f→f, jinak default
    _sexFromItem: function (itemId, pen) {
        if (itemId && itemId.endsWith('_m')) return 'm';
        if (itemId && itemId.endsWith('_f')) return 'f';
        if (pen === 'stable') return 'f';  // klisna default
        return 'f';
    },

    placeAnimal: function (pen, itemId) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        const st = GameState[pen];
        if (!cfg || !st.built) return;
        if (st.animals.length >= cfg.cap) { if (typeof UI !== 'undefined') UI.notify(t('dvur.penFull'), true); return; }
        // itemId může být string nebo přijít z parametru (pohlavní varianty)
        const useItemId = itemId || (Array.isArray(cfg.itemId) ? cfg.itemId[0] : cfg.itemId);
        if ((GameState.inventory[useItemId] || 0) < 1) { if (typeof UI !== 'undefined') UI.notify(t('dvur.noAnimal'), true); return; }
        GameState.inventory[useItemId] -= 1;
        const sex = this._sexFromItem(useItemId, pen);
        const a = { sex, mood: 80, mature: true, bornAt: Date.now(), lastCleaned: 0 };
        if (pen === 'goatpen') a.lastMilk = Date.now();
        st.animals.push(a);
        if (typeof UI !== 'undefined') UI.notify(t('dvur.placed_' + pen));
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    _rabbitBreedCheck: function () {
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
                st.animals.push({ sex, mood: 80, mature: false, bornAt: now, lastCleaned: 0 });
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

    slaughterRabbit: function () {
        const st = GameState.rabbitry;
        if (!st || !st.built || !st.animals.length) return;
        st.animals.pop();
        GameState.inventory['rabbit_meat'] = (GameState.inventory['rabbit_meat'] || 0) + 1;
        GameState.inventory['rabbit_pelt'] = (GameState.inventory['rabbit_pelt'] || 0) + 1;
        if (typeof UI !== 'undefined') UI.notify('🍖 ' + t('dvur.rabbitSlaughtered'));
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    collectGoatMilk: function () {
        const st = GameState.goatpen, cfg = this.ANIMAL_CFG.goatpen;
        if (!st || !st.built) return;
        if (this._penHungry('goatpen')) { if (typeof UI !== 'undefined') UI.notify(t('dvur.goatsHungry'), true); return; }
        const now = Date.now();
        const moodMult = this.MOOD_MULT(this.getMood('goatpen'));
        let milk = 0;
        st.animals.forEach(a => {
            this._ensureAnimalFields(a);
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
            this.renderFarmyard();
        } else {
            if (typeof UI !== 'undefined') UI.notify(t('dvur.goatNotReady'), true);
        }
    },

    collectCowMilk: function () {
        const st = GameState.cowbyre, cfg = this.ANIMAL_CFG.cowbyre;
        if (!st || !st.built) return;
        if (this._penHungry('cowbyre')) { if (typeof UI !== 'undefined') UI.notify(t('dvur.cowsHungry'), true); return; }
        const now = Date.now();
        const moodMult = this.MOOD_MULT(this.getMood('cowbyre'));
        let milk = 0;
        st.animals.forEach(a => {
            this._ensureAnimalFields(a);
            if (now - (a.lastMilk || a.bornAt) >= cfg.milkMs) {
                if (Math.random() < moodMult) { milk += 4 + Math.floor(Math.random() * 3); } // 4-6
                a.lastMilk = now;
            }
        });
        if (milk) {
            GameState.inventory['cow_milk'] = (GameState.inventory['cow_milk'] || 0) + milk;
            if (typeof UI !== 'undefined') UI.notify('🥛 ' + t('dvur.cowMilked').replace('{n}', milk));
            if (typeof Game !== 'undefined') Game.save();
            this.renderFarmyard();
        } else {
            if (typeof UI !== 'undefined') UI.notify(t('dvur.cowNotReady'), true);
        }
    },

    feedAcorn: function (idx) {
        const st = GameState.pigsty, cfg = this.ANIMAL_CFG.pigsty;
        const a = st.animals[idx];
        if (!a) return;
        if ((GameState.inventory['acorn'] || 0) < 1) { if (typeof UI !== 'undefined') UI.notify(t('dvur.noAcorn'), true); return; }
        GameState.inventory['acorn'] -= 1;
        a.placedAt = (a.placedAt || a.bornAt || Date.now()) - cfg.acornBoostMs;
        if (typeof UI !== 'undefined') UI.notify('🌰 ' + t('dvur.acornFed'));
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    slaughterPig: function (idx) {
        const st = GameState.pigsty;
        const a = st.animals[idx];
        if (!a || !this._pigMature(a)) return;
        st.animals.splice(idx, 1);
        const inv = GameState.inventory;
        inv['meat'] = (inv['meat'] || 0) + 4;
        inv['lard'] = (inv['lard'] || 0) + 3;
        inv['cured_meat'] = (inv['cured_meat'] || 0) + 2;
        if (typeof UI !== 'undefined') UI.notify('🔪 ' + t('dvur.pigSlaughtered'));
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important', '🐖 Zabijačka! Klášterní spižírna se naplnila masem, sádlem a špekem.', '🐖 Pig slaughter! The monastery larder filled with meat, lard and cured meat.', '🐖 Porcus mactatus est.');
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    slaughterCow: function (idx) {
        const st = GameState.cowbyre;
        const a = st.animals[idx];
        if (!a) return;
        st.animals.splice(idx, 1);
        const inv = GameState.inventory;
        inv['beef'] = (inv['beef'] || 0) + 5;
        inv['cured_beef'] = (inv['cured_beef'] || 0) + 2;
        inv['raw_hide'] = (inv['raw_hide'] || 0) + 2;
        if (typeof UI !== 'undefined') UI.notify('🔪 ' + t('dvur.cowSlaughtered'));
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important', '🐄 Zabijačka! Klášterní spižírna se naplnila hovězím masem.', '🐄 Cattle slaughter! The monastery larder filled with beef.', '🐄 Bos mactatus est.');
        if (typeof Game !== 'undefined') Game.save();
        this.renderFarmyard();
    },

    // ── Render animal pen (generic) ───────────────────────────────────────
    renderAnimalPen: function (pen) {
        this._ensureAnimals();
        const cfg = this.ANIMAL_CFG[pen];
        if (!cfg) return '';
        const st = GameState[pen];
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const icons = { rabbitry: '🐇', goatpen: '🐐', pigsty: '🐖', cowbyre: '🐄' };
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

        if (pen === 'rabbitry' && st.built) {
            const fedAgoR = st.lastFedAt ? Math.floor((Date.now() - st.lastFedAt) / 3600000) : null;
            const fedTxtR = fedAgoR === null ? (lang === 'en' ? 'Never' : 'Nikdy') : fedAgoR < 1 ? (lang === 'en' ? '< 1h ago' : 'před < 1h') : (lang === 'en' ? '~' + fedAgoR + 'h ago' : 'před ~' + fedAgoR + 'h');
            h += `<div style="font-size:0.82rem; margin-bottom:8px;">🌿 ${lang==='en'?'Last fed':'Krmeno'}: <strong>${fedTxtR}</strong></div>`;
        }

        if (this._penHungry(pen)) {
            h += `<div style="font-size:0.78rem; color:#c0392b; margin-bottom:8px;">⚠️ ${t('dvur.penHungry')}</div>`;
        }

        if (Array.isArray(cfg.itemId)) {
            // Pohlavní varianty — zobrazit tlačítko pro každý itemId
            let anyAvail = false;
            h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">';
            cfg.itemId.forEach(function (iid) {
                var haveI = GameState.inventory[iid] || 0;
                var nm = typeof iName === 'function' ? iName(iid) : iid;
                var canAdd = haveI > 0 && st.animals.length < cfg.cap;
                if (haveI > 0) anyAvail = true;
                h += '<button class="craft-btn" style="margin-bottom:4px;" onclick="FarmyardSystem.placeAnimal(\'' + pen + '\',\'' + iid + '\')" ' + (canAdd ? '' : 'disabled') + '>➕ ' + nm + ' (' + (typeof t === 'function' ? t('dvur.have') : 'máš') + ': ' + haveI + ')</button>';
            });
            h += '</div>';
            if (!anyAvail && st.animals.length < cfg.cap) h += '<div style="font-size:0.74rem;opacity:0.6;font-style:italic;margin-bottom:10px;">' + t('dvur.buyAtMarket') + '</div>';
        } else {
            var haveItem = GameState.inventory[cfg.itemId] || 0;
            h += '<button class="craft-btn" style="margin-bottom:10px;" onclick="FarmyardSystem.placeAnimal(\'' + pen + '\')" ' + (haveItem > 0 && st.animals.length < cfg.cap ? '' : 'disabled') + '>➕ ' + t('dvur.place_' + pen) + ' (' + t('dvur.have') + ': ' + haveItem + ')</button>';
            if (haveItem === 0 && st.animals.length < cfg.cap) h += '<div style="font-size:0.74rem;opacity:0.6;font-style:italic;margin-bottom:10px;">' + t('dvur.buyAtMarket') + '</div>';
        }

        // Animals list with mood
        if (st.animals.length) {
            const isV2Mood = this.MOOD_V2_PENS.includes(pen);
            const penMood = isV2Mood ? this.getMood(pen) : null;
            h += `<div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">`;
            st.animals.forEach((a, i) => {
                this._ensureAnimalFields(a);
                const moodVal = isV2Mood ? penMood : a.mood;
                const mIcon = this.MOOD_ICON(moodVal);
                const sexLabel = a.sex === 'm' ? (lang === 'en' ? '♂ male' : '♂ samec') : a.sex === 'f' ? (lang === 'en' ? '♀ female' : '♀ samice') : '';
                const isKid = a.mature === false;
                h += `<div style="padding:5px 8px; background:rgba(0,0,0,0.04); border-radius:5px; display:flex; align-items:center; gap:8px; font-size:0.78rem;">
                    <span>${icons[pen] || '🐾'}${isKid ? '🐣' : ''}</span>
                    <span style="opacity:0.7;">${sexLabel}</span>
                    <span>${mIcon} ${moodVal}/100</span>
                </div>`;
            });
            h += `</div>`;
        }

        // ── Actions per pen ──────────────────────────────────────────────
        var _selfAct = this;
        if (pen === 'rabbitry' && st.animals.length) {
            var malesR = st.animals.filter(function (a) { return a.sex === 'm' && a.mature !== false; }).length;
            var femalesR = st.animals.filter(function (a) { return a.sex === 'f' && a.mature !== false; }).length;
            var kidsR = st.animals.filter(function (a) { return a.mature === false; }).length;
            h += '<div style="font-size:0.8rem;margin-bottom:8px;">♂ ' + malesR + ' · ♀ ' + femalesR + (kidsR ? ' · 🐣 ' + kidsR : '') + '</div>';
            if (malesR >= 1 && femalesR >= 1 && st.animals.length < cfg.cap && !this._penHungry('rabbitry')) {
                h += '<div style="font-size:0.78rem;opacity:0.7;margin-bottom:8px;">💕 ' + t('dvur.breeding') + '</div>';
            }
            var matureRabs = st.animals.filter(function (a) { return a.mature !== false; }).length;
            var canCleanR = Date.now() - (st.lastCleanMs || 0) >= 86400000;
            var cleanQR = Math.max(1, Math.ceil(st.animals.length / 3));
            var waterNeededR = st.animals.length;
            var canFeedR = this.getHunger('rabbitry') < 90;
            h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">';
            h += '<button class="craft-btn" onclick="FarmyardSystem.feedRabbitry()" ' + (canFeedR ? '' : 'disabled') + ' style="background:#4a7c59;">🌿 ' + t('farmyard.feed') + '<br><span style="font-size:0.68rem;">' + this._feedWaterHint(waterNeededR, lang) + '</span></button>';
            h += '<button class="craft-btn" onclick="FarmyardSystem.slaughterRabbit()" ' + (matureRabs > 0 ? '' : 'disabled') + '>🔪 ' + t('dvur.slaughterRabbit') + '</button>';
            h += '<button class="craft-btn" onclick="FarmyardSystem.cleanPen(\'rabbitry\')" style="background:rgba(90,154,90,0.85);">' + (canCleanR ? '🧹 ' + t('farmyard.clean') + ' (💩 +' + cleanQR + ')' : '🧹 ' + t('farmyard.cleanTomorrow')) + '</button>';
            h += '</div>';
        }

        if (pen === 'goatpen' && st.animals.length) {
            var now2 = Date.now();
            var moodGAvg = this.getMood('goatpen');
            var moodGMul = this.MOOD_MULT(moodGAvg);
            var _billyActive = this.loanMaleActive('billy_goat');
            var _billyH = _billyActive ? this.loanMaleRemainingH() : 0;
            var readyG = st.animals.filter(function (a) { return a.mature !== false && now2 - (a.lastMilk || a.bornAt) >= cfg.milkMs; }).length;
            var milkYieldG = Math.floor(readyG * moodGMul);
            h += '<div style="font-size:0.8rem;margin-bottom:8px;">🐐 ' + this.MOOD_ICON(moodGAvg) + ' ' + moodGAvg + '/100 · 🐐♂ <strong style="color:' + (_billyActive ? '#5a9a5a' : '#c0392b') + ';">' + (_billyActive ? '✓ ' + _billyH + 'h' : (lang === 'en' ? 'No loan' : 'Výpůjčka')) + '</strong></div>';
            var canCleanG = Date.now() - (st.lastCleanMs || 0) >= 86400000;
            var cleanQG = Math.max(1, Math.ceil(st.animals.length / 2));
            h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">';
            h += '<button class="craft-btn" onclick="FarmyardSystem.collectGoatMilk()" ' + (readyG ? '' : 'disabled') + '>🥛 ' + t('dvur.milkGoats') + ' (' + readyG + ' → ' + milkYieldG + ')</button>';
            h += '<button class="craft-btn" onclick="FarmyardSystem.cleanPen(\'goatpen\')" style="background:rgba(90,154,90,0.85);">' + (canCleanG ? '🧹 ' + t('farmyard.clean') + ' (💩 +' + cleanQG + ')' : '🧹 ' + t('farmyard.cleanTomorrow')) + '</button>';
            h += '</div>';
        }

        if (pen === 'cowbyre' && st.animals.length) {
            var now3 = Date.now();
            var moodCAvg = this.getMood('cowbyre');
            var readyC = st.animals.filter(function (a) { return a.mature !== false && now3 - (a.lastMilk || a.bornAt) >= cfg.milkMs; }).length;
            h += '<div style="font-size:0.8rem;margin-bottom:8px;">🐄 ' + this.MOOD_ICON(moodCAvg) + ' ' + moodCAvg + '/100</div>';
            var canCleanC = Date.now() - (st.lastCleanMs || 0) >= 86400000;
            var cleanQC = Math.max(1, Math.ceil(st.animals.length / 2));
            h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">';
            h += '<button class="craft-btn" onclick="FarmyardSystem.collectCowMilk()" ' + (readyC ? '' : 'disabled') + '>🥛 ' + t('dvur.milkCow') + ' (' + readyC + ')</button>';
            h += '<button class="craft-btn" onclick="FarmyardSystem.slaughterCow(' + (st.animals.length - 1) + ')" style="background:#8b4a3a;">🔪 ' + t('dvur.slaughterCow') + '</button>';
            h += '<button class="craft-btn" onclick="FarmyardSystem.cleanPen(\'cowbyre\')" style="background:rgba(90,154,90,0.85);">' + (canCleanC ? '🧹 ' + t('farmyard.clean') + ' (💩 +' + cleanQC + ')' : '🧹 ' + t('farmyard.cleanTomorrow')) + '</button>';
            h += '</div>';
        }

        if (pen === 'pigsty' && st.animals.length) {
            var _boarActive = this.loanMaleActive('boar');
            var _boarH = _boarActive ? this.loanMaleRemainingH() : 0;
            h += '<div style="font-size:0.8rem;margin-bottom:8px;">🐖♂ <strong style="color:' + (_boarActive ? '#5a9a5a' : '#c0392b') + ';">' + (_boarActive ? '✓ ' + _boarH + 'h' : (lang === 'en' ? 'No loan' : 'Výpůjčka')) + '</strong></div>';
            h += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;">';
            st.animals.forEach(function (a, i) {
                var mature = _selfAct._pigMature(a);
                var pct = Math.min(100, Math.round((Date.now() - (a.placedAt || a.bornAt || Date.now())) / _selfAct.ANIMAL_CFG.pigsty.growMs * 100));
                h += '<div style="padding:8px 10px;background:rgba(0,0,0,0.04);border-radius:6px;display:flex;align-items:center;gap:8px;">';
                h += '<span style="font-size:1.2rem;">' + (mature ? '🐖' : '🐷') + '</span>';
                h += '<div style="flex:1;"><div style="font-size:0.78rem;">' + (mature ? t('dvur.pigMature') : t('dvur.pigGrowing') + ' ' + pct + '%') + '</div>';
                h += '<div style="height:5px;background:rgba(0,0,0,0.1);border-radius:3px;margin-top:3px;"><div style="height:100%;width:' + pct + '%;background:var(--accent-gold);border-radius:3px;"></div></div></div>';
                if (mature) {
                    h += '<button class="craft-btn" style="padding:4px 8px;font-size:0.72rem;" onclick="FarmyardSystem.slaughterPig(' + i + ')">🔪 ' + t('dvur.slaughterPig') + '</button>';
                } else {
                    h += '<button class="craft-btn" style="padding:4px 8px;font-size:0.72rem;" onclick="FarmyardSystem.feedAcorn(' + i + ')" ' + (GameState.inventory['acorn'] > 0 ? '' : 'disabled') + '>🌰 ' + t('dvur.feedAcorn') + '</button>';
                }
                h += '</div>';
            });
            h += '</div>';
            var canCleanP = Date.now() - (st.lastCleanMs || 0) >= 86400000;
            var cleanQP = Math.max(1, st.animals.length);
            h += '<button class="craft-btn" onclick="FarmyardSystem.cleanPen(\'pigsty\')" style="background:rgba(90,154,90,0.85);">' + (canCleanP ? '🧹 ' + t('farmyard.clean') + ' (💩 +' + cleanQP + ')' : '🧹 ' + t('farmyard.cleanTomorrow')) + '</button>';
        }

        if (pen === 'stable' && st.animals.length) {
            h += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">';
            st.animals.forEach(function (a) {
                _selfAct._ensureAnimalFields(a);
                var mi = _selfAct.MOOD_ICON(a.mood);
                var sx = a.sex === 'm' ? (lang === 'en' ? '♂ Stallion' : '♂ Hřebec') : (lang === 'en' ? '♀ Mare' : '♀ Klisna');
                h += '<div style="padding:6px 10px;background:rgba(0,0,0,0.04);border-radius:6px;display:flex;align-items:center;gap:8px;font-size:0.8rem;"><span style="font-size:1.3rem;">🐎</span><div style="flex:1;"><strong>' + (a.name || sx) + '</strong> <span style="opacity:0.6;">' + mi + ' ' + a.mood + '/100</span></div></div>';
            });
            h += '</div>';
            var hasMale = st.animals.some(function (a) { return a.sex === 'm'; });
            var hasFemale = st.animals.some(function (a) { return a.sex === 'f'; });
            if (hasMale && hasFemale) h += '<div style="font-size:0.78rem;color:#5a9a5a;margin-bottom:8px;">🐎 ' + (lang === 'en' ? 'Foal possible — breeding (v2)' : 'Hříbě možné — odchov (v2)') + '</div>';
            var canCleanS = Date.now() - (st.lastCleanMs || 0) >= 86400000;
            var cleanQS = Math.max(1, st.animals.length);
            h += '<button class="craft-btn" onclick="FarmyardSystem.cleanPen(\'stable\')" style="background:rgba(90,154,90,0.85);">' + (canCleanS ? '🧹 ' + t('farmyard.clean') + ' (💩 +' + cleanQS + ')' : '🧹 ' + t('farmyard.cleanTomorrow')) + '</button>';
        }

        h += '</div>';
        return h;
    },

    // ── Dvůr render (main) ────────────────────────────────────────────────
    _dvurTab: 'kurnik',

    DVUR_TABS: [
        { id: 'kurnik', icon: '🐔', tech: null },
        { id: 'kosar', icon: '🐑', tech: null },
        { id: 'kotce', icon: '🐇', tech: 'tech_cuniculi' },
        { id: 'chlevy', icon: '🏚️', tech: null },
        { id: 'mastal', icon: '🐎', tech: 'tech_stabulum' },
        { id: 'studna', icon: '🚰', tech: null },
        { id: 'columbarium', icon: '🕊️', tech: null, flag: 'columbarium_available' },
    ],

    switchDvurTab: function (tab) {
        this._dvurTab = tab;
        this.renderFarmyard();
    },

    renderFarmyard: function () {
        const el = document.getElementById('farmyard-container');
        if (!el) return;
        const h = GameState.henhouse || {};
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
                const hens = h.hens || [];
                const hensCount = hens.length;
                hens.forEach(function (a) { if (typeof a === 'object') { if (a.mood === undefined) a.mood = 80; if (a.sex === undefined) a.sex = 'f'; if (a.lastCleaned === undefined) a.lastCleaned = 0; } });
                var moodAvgHen = this.getMood('henhouse');
                var moodMultHen = this.MOOD_MULT(moodAvgHen);
                var moodIconHen = this.MOOD_ICON(moodAvgHen);
                var eggReady = now >= (h.lastEggAt || 0) + 28800000;
                var feathReady = now >= (h.lastFeatherAt || 0) + 86400000;
                var eggYield = Math.floor(hensCount * (h.rooster ? 1.2 : 1.0) * moodMultHen);
                html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;font-size:0.82rem;">';
                html += '<div>🐔 ' + t('farmyard.hens') + ': <strong>' + hensCount + '/10</strong></div>';
                html += '<div>🐓 ' + t('farmyard.rooster') + ': <strong>' + (h.rooster ? '✓' : '✗') + '</strong></div>';
                html += '<div>' + moodIconHen + ' ' + (lang === 'en' ? 'Mood' : 'Nálada') + ': <strong>' + moodAvgHen + '/100</strong></div>';
                html += '<div>🥚 ' + t('farmyard.eggs') + ': <strong>' + (eggReady ? t('farmyard.ready') + ' (' + eggYield + ')' : Math.ceil(((h.lastEggAt || 0) + 28800000 - now) / 3600000) + 'h') + '</strong></div>';
                html += '<div>🪶 ' + t('farmyard.feathers') + ': <strong>' + (feathReady ? t('farmyard.ready') : Math.ceil(((h.lastFeatherAt || 0) + 86400000 - now) / 3600000) + 'h') + '</strong></div>';
                html += moodAvgHen < 50 ? '<div style="color:#c0392b;font-size:0.75rem;">⚠️ ' + (lang === 'en' ? 'Low mood — eggs reduced' : 'Nízká nálada — méně vajec') + '</div>' : '<div></div>';
                // Krmení + slug bonus
                const fedAgo = h.lastFedAt ? Math.floor((now - h.lastFedAt) / 3600000) : null;
                const fedTxt = fedAgo === null ? (lang === 'en' ? 'Never' : 'Nikdy') : fedAgo < 1 ? (lang === 'en' ? '< 1h ago' : 'před < 1h') : (lang === 'en' ? '~' + fedAgo + 'h ago' : 'před ~' + fedAgo + 'h');
                html += '<div style="grid-column:1/3;">🌾 ' + (lang === 'en' ? 'Last fed' : 'Krmeno') + ': <strong>' + fedTxt + '</strong></div>';
                const slugActive = h.slugFedAt && (now - h.slugFedAt) < 28800000;
                const slugRemH = slugActive ? Math.ceil((h.slugFedAt + 28800000 - now) / 3600000) : 0;
                html += '<div style="color:' + (slugActive ? '#4a7c59' : 'inherit') + ';">🐌 ' + t('farmyard.slugBonus') + ': <strong>' + (slugActive ? (lang === 'en' ? '+25% eggs (' + slugRemH + 'h)' : '+25% vajec (' + slugRemH + 'h)') : '—') + '</strong></div>';
                html += '</div>';
                if (hensCount > 0) {
                    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
                    hens.forEach(function (a) {
                        var ic = typeof a === 'object' && a.type === 'hen_black' ? '🐓' : typeof a === 'object' && a.type === 'hen_colored' ? '🐣' : '🐔';
                        html += '<span style="font-size:1rem;cursor:default;" title="' + moodIconHen + '">' + ic + moodIconHen + '</span>';
                    });
                    html += '</div>';
                }
                html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">';
                if (!h.rooster) {
                    var hasR = (GameState.inventory['rooster'] || 0) > 0;
                    html += '<button class="craft-btn" onclick="FarmyardSystem.addHen(\'rooster\')" ' + (hasR ? '' : 'disabled') + ' style="font-size:0.75rem;">🐓 ' + t('farmyard.addRooster') + '</button>';
                }
                ['hen_white', 'hen_black', 'hen_colored'].forEach(function (type) {
                    var has = (GameState.inventory[type] || 0) > 0;
                    var icon2 = type === 'hen_white' ? '🐔' : type === 'hen_black' ? '🐓' : '🐣';
                    html += '<button class="craft-btn" onclick="FarmyardSystem.addHen(\'' + type + '\')" ' + (has && hensCount < 10 ? '' : 'disabled') + ' style="font-size:0.75rem;">' + icon2 + ' ' + iName(type) + '</button>';
                });
                html += '</div>';
                html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">';
                html += '<button class="craft-btn" onclick="FarmyardSystem.collectHenhouse()" ' + (hensCount > 0 ? '' : 'disabled') + '>🥚 ' + t('farmyard.collect') + '</button>';
                var canFeedHen = this.getHunger('henhouse') < 90;
                html += '<button class="craft-btn" onclick="FarmyardSystem.feedHenhouse()" ' + (hensCount > 0 && canFeedHen ? '' : 'disabled') + ' style="background:#4a7c59;">🌾 ' + t('farmyard.feed') + '</button>';
                var slugNeeded = hensCount * 2;
                var hasSlug = (GameState.inventory['slug'] || 0) >= slugNeeded;
                html += '<button class="craft-btn" onclick="FarmyardSystem.feedHenhouseSlug()" ' + (hensCount > 0 && hasSlug && canFeedHen ? '' : 'disabled') + ' style="background:#5a7c3a;" title="' + slugNeeded + '× ' + (lang === 'en' ? 'slug' : 'slimák') + '">🐌 ' + t('farmyard.feedSlug') + '</button>';
                var canCleanHen = Date.now() - (GameState.henhouse.lastCleanMs || 0) >= 86400000;
                var cleanQtyHen = Math.max(1, Math.ceil(hensCount / 3));
                html += '<button class="craft-btn" onclick="FarmyardSystem.cleanPen(\'kurnik\')" style="background:rgba(90,154,90,0.85);">' + (canCleanHen ? '🧹 ' + t('farmyard.clean') + ' (💩 +' + cleanQtyHen + ')' : '🧹 ' + t('farmyard.cleanTomorrow')) + '</button>';
                html += '</div>';
                html += `<div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.06); border-radius:8px;">`;
                html += `<strong style="font-size:0.85rem;">🥚 ${t('farmyard.nesting')}</strong><br>`;
                if (!h.nesting) {
                    const canNest = h.rooster && hensCount > 0;
                    html += `<button class="craft-btn" onclick="FarmyardSystem.startNesting()" ${canNest ? '' : 'disabled'} style="margin-top:6px; font-size:0.78rem;">${t('farmyard.startNesting')}</button>`;
                } else if (h.nesting.state === 'nesting') {
                    const left = Math.max(0, Math.ceil((h.nesting.hatchAt - now) / 3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐣 ${t('farmyard.nestingProgress')} — ${left}h</p>`;
                } else if (h.nesting.state === 'growing') {
                    const left = Math.max(0, Math.ceil((h.nesting.grownAt - now) / 3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐥 ${t('farmyard.chicksGrowing').replace('{n}', h.nesting.chicks)} — ${left}h</p>`;
                }
                if ((h.chickPool || 0) > 0) {
                    html += `<div style="margin-top:8px; font-size:0.82rem;">🐓 ${t('farmyard.chickPool')}: <strong>${h.chickPool}</strong>
                        <button class="craft-btn" onclick="FarmyardSystem.slaughterChick(1)" style="margin-left:8px; font-size:0.72rem; background:#8b4a3a;">🍗 x1</button>
                        <button class="craft-btn" onclick="FarmyardSystem.slaughterChick(${h.chickPool})" style="margin-left:4px; font-size:0.72rem; background:#8b4a3a;">🍗 ${lang === 'en' ? 'All' : 'Vše'}</button></div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        } else if (tab === 'kosar') {
            // OVILE
            const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_de_re_rustica');
            html += `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid ${hasTech ? 'var(--accent-gold)' : 'rgba(0,0,0,0.2)'};">`;
            html += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🐑 ${t('farmyard.ovile')}</h3>`;
            if (!hasTech) {
                html += `<p class="text-sm" style="opacity:0.6; font-style:italic;">${t('farmyard.ovileLocked')}</p>`;
            } else if (!s.built) {
                html += `<p class="text-sm" style="opacity:0.7; margin-bottom:10px;">${t('farmyard.sheepfoldBuildDesc')}</p>`;
                html += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            } else {
                var sheepObjs = s.sheepObjs || [];
                var sheepCount = s.sheep || 0;
                while (sheepObjs.length < sheepCount) sheepObjs.push({ sex: 'f', mood: 80, bornAt: Date.now(), lastCleaned: 0 });
                if (!s.sheepObjs) s.sheepObjs = sheepObjs;
                var moodAvgSh = this.getMood('sheepfold');
                var moodMultSh = this.MOOD_MULT(moodAvgSh);
                var moodIconSh = this.MOOD_ICON(moodAvgSh);
                var _month = new Date().getMonth();
                var _milkSeason = _month >= 2 && _month <= 10;
                var milkReady = _milkSeason && now >= (s.lastMilkAt || 0) + 43200000;
                var woolReady = now >= (s.lastWoolAt || 0) + 172800000;
                var milkYield = Math.floor(sheepCount * moodMultSh);
                var woolYield = Math.floor(sheepCount * moodMultSh);
                var _ramActive = this.loanMaleActive('ram');
                var _ramH = _ramActive ? this.loanMaleRemainingH() : 0;
                html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;font-size:0.82rem;">';
                html += '<div>🐑 ' + t('farmyard.sheep') + ': <strong>' + sheepCount + '/6</strong></div>';
                html += '<div>' + moodIconSh + ' ' + (lang === 'en' ? 'Mood' : 'Nálada') + ': <strong>' + moodAvgSh + '/100</strong></div>';
                html += '<div>🐏 ' + (lang === 'en' ? 'Ram' : 'Beran') + ': <strong style="color:' + (_ramActive ? '#5a9a5a' : '#c0392b') + ';">' + (_ramActive ? '✓ ' + _ramH + 'h' : (lang === 'en' ? 'No loan' : 'Výpůjčka')) + '</strong></div>';
                html += '<div>🥛 ' + t('farmyard.milk') + ': <strong>' + (milkReady ? t('farmyard.ready') + '(' + milkYield + ')' : !_milkSeason ? (lang === 'en' ? 'Winter' : 'Zima') : Math.ceil(((s.lastMilkAt || 0) + 43200000 - now) / 3600000) + 'h') + '</strong></div>';
                html += '<div>🧶 ' + t('farmyard.wool') + ': <strong>' + (woolReady ? t('farmyard.ready') + '(' + woolYield + ')' : Math.ceil(((s.lastWoolAt || 0) + 172800000 - now) / 3600000) + 'h') + '</strong></div>';
                var fedAgoSh = s.lastFedAt ? Math.floor((now - s.lastFedAt) / 3600000) : null;
                var fedTxtSh = fedAgoSh === null ? (lang === 'en' ? 'Never' : 'Nikdy') : fedAgoSh < 1 ? (lang === 'en' ? '< 1h ago' : 'před < 1h') : (lang === 'en' ? '~' + fedAgoSh + 'h ago' : 'před ~' + fedAgoSh + 'h');
                html += '<div>🌿 ' + (lang === 'en' ? 'Last fed' : 'Krmeno') + ': <strong>' + fedTxtSh + '</strong></div>';
                html += '</div>';
                if (sheepCount > 0) {
                    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
                    sheepObjs.slice(0, sheepCount).forEach(function () {
                        html += '<span style="font-size:1rem;cursor:default;" title="♀ ' + moodIconSh + ' ' + moodAvgSh + '/100">🐑' + moodIconSh + '</span>';
                    });
                    if (_ramActive) html += '<span style="font-size:1rem;" title="' + (lang === "en" ? "Ram on loan" : "Beran na výpůjčku") + '">🐏⏱</span>';
                    html += '</div>';
                }
                html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">';
                var hasSheepItem = (GameState.inventory['sheep'] || 0) > 0;
                html += '<button class="craft-btn" onclick="FarmyardSystem.addSheep()" ' + (hasSheepItem && sheepCount < 6 ? '' : 'disabled') + '>🐑 ' + t('farmyard.addSheep') + '</button>';
                html += '<button class="craft-btn" onclick="FarmyardSystem.collectSheepfold()" ' + (sheepCount > 0 ? '' : 'disabled') + '>🥛🧶 ' + t('farmyard.collect') + '</button>';
                var waterNeededSh = sheepCount + (s.breeding && s.breeding.state === 'growing' ? 1 : 0);
                var canFeedSh = this.getHunger('sheepfold') < 90;
                html += '<button class="craft-btn" onclick="FarmyardSystem.feedSheepfold()" ' + (sheepCount > 0 && canFeedSh ? '' : 'disabled') + ' style="background:#4a7c59;">🌿 ' + t('farmyard.feed') + '<br><span style="font-size:0.68rem;">' + this._feedWaterHint(waterNeededSh, lang) + '</span></button>';
                var canCleanSh = Date.now() - (GameState.sheepfold.lastCleanMs || 0) >= 86400000;
                var cleanQtySh = Math.max(1, Math.ceil(sheepCount / 2));
                if (sheepCount > 0) html += '<button class="craft-btn" onclick="FarmyardSystem.cleanPen(\'kosar\')" style="background:rgba(90,154,90,0.85);">' + (canCleanSh ? '🧹 ' + t('farmyard.clean') + ' (💩 +' + cleanQtySh + ')' : '🧹 ' + t('farmyard.cleanTomorrow')) + '</button>';
                if (sheepCount > 0) html += '<button class="craft-btn" onclick="FarmyardSystem.slaughterSheep()" style="background:#8b4a3a;font-size:0.78rem;">🥩 ' + t('farmyard.slaughterSheep') + '</button>';
                html += '</div>';
                html += `<div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.06); border-radius:8px;">`;
                html += `<strong style="font-size:0.85rem;">🐑 ${t('farmyard.breeding')}</strong><br>`;
                if (!s.breeding) {
                    var canBreed = sheepCount >= 2 && _ramActive;
                    var breedLabel = !_ramActive ? (lang === 'en' ? 'Needs ram (Cellarium)' : 'Potřeba berana (Cellarium)') : t('farmyard.startBreeding');
                    html += '<button class="craft-btn" onclick="FarmyardSystem.startBreeding()" ' + (canBreed ? '' : 'disabled') + ' style="margin-top:6px;font-size:0.78rem;">' + breedLabel + '</button>';
                } else if (s.breeding.state === 'gestating') {
                    const left = Math.max(0, Math.ceil((s.breeding.bornAt - now) / 3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🤰 ${t('farmyard.gestating')} — ${left}h</p>`;
                } else if (s.breeding.state === 'growing') {
                    const left = Math.max(0, Math.ceil((s.breeding.grownAt - now) / 3600000));
                    html += `<p class="text-sm" style="margin:6px 0;">🐑 ${t('farmyard.lambGrowing')} — ${left}h</p>`;
                }
                if ((s.lambPool || 0) > 0) {
                    html += `<div style="margin-top:8px; font-size:0.82rem;">🐑 ${t('farmyard.lambPool')}: <strong>${s.lambPool}</strong>
                        <button class="craft-btn" onclick="FarmyardSystem.slaughterLamb(1)" style="margin-left:8px; font-size:0.72rem; background:#8b4a3a;">🥩 x1</button>
                        <button class="craft-btn" onclick="FarmyardSystem.slaughterLamb(${s.lambPool})" style="margin-left:4px; font-size:0.72rem; background:#8b4a3a;">🥩 ${lang === 'en' ? 'All' : 'Vše'}</button></div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        } else if (tab === 'kotce' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_cuniculi')) {
            html += this.renderAnimalPen('rabbitry');
        } else if (tab === 'chlevy') {
            html += this._renderChlevy();
        } else if (tab === 'mastal' && GameState.researchedTechs && GameState.researchedTechs.includes('tech_stabulum')) {
            html += this._renderMastal();
        } else if (tab === 'columbarium' && GameState.flags && GameState.flags.columbarium_available) {
            html += this._renderColumbarium();
        } else if (tab !== 'studna') {
            html += this._renderDvurLocked(tab);
        }

        el.innerHTML = html;
        // Studna — statický blok v shell.html, jen show/hide dle subtabu
        const wellEl = document.getElementById('well-management');
        if (wellEl) wellEl.style.display = (tab === 'studna') ? 'block' : 'none';
    },

    _renderDvurTabs: function (active) {
        let h = `<div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px;">`;
        this.DVUR_TABS.forEach(tb => {
            // Flag-gated taby (např. Columbarium) — NEVIDITELNÉ dokud flag chybí, ne jen zamčené
            if (tb.flag && !(GameState.flags && GameState.flags[tb.flag])) return;
            const isActive = tb.id === active;
            const researched = !tb.tech || (GameState.researchedTechs && GameState.researchedTechs.includes(tb.tech));
            const lock = researched ? '' : ' 🔒';
            h += `<button class="filter-btn ${isActive ? 'active' : ''}" style="font-size:0.78rem; padding:5px 9px; ${researched ? '' : 'opacity:0.55;'}"
                onclick="FarmyardSystem.switchDvurTab('${tb.id}')">${tb.icon} ${t('dvur.tab_' + tb.id)}${lock}</button>`;
        });
        h += `</div>`;
        return h;
    },

    _renderDvurDashboard: function () {
        const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;
        const cat = GameState.cat || {};
        const hasCatTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_cura_felium');
        const miceN = (GameState.mice && GameState.mice.count) || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        let h = `<div style="position:relative; margin-bottom:14px; padding:10px 12px; background:rgba(197,160,89,0.07); border:1px solid rgba(197,160,89,0.25); border-radius:8px; display:flex; flex-direction:column; gap:5px;">`;
        h += `<span style="position:absolute; top:10px; right:12px; font-size:0.72rem; cursor:pointer; opacity:0.75;" onclick="GardenSystem.showZahradaDetail()">📦 ${lang==='en'?'Overview':'Přehled'}</span>`;
        h += `<div style="font-size:0.68rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; opacity:0.55;">${t('dvur.dashTitle')}</div>`;

        const miceTxt = ds ? ds.miceFuzzyShort() : (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.miceFuzzy ? ScriptoriumCat.miceFuzzy() : '');
        h += `<div style="font-size:0.8rem;">🐭 ${miceTxt}</div>`;

        // Mouchy (monastery-decay-mrd) — primární info místo, Dvůr
        const fliesTxt = ds && ds.fliesFuzzyShort ? ds.fliesFuzzyShort() : '';
        if (fliesTxt) h += `<div style="font-size:0.8rem;">🪰 ${fliesTxt}</div>`;

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
            h += `<div style="font-size:0.8rem;">🫏 ${d.name || 'Osel'} — ${working ? `⚡ +${Math.round(this.ANIMAL_CFG.donkeyStall.fieldBonus * 100)}% ${lang === 'en' ? 'field yield' : 'výnos pole'}` : t('farmyard.donkeyStubborn').replace('{name}', '')}</div>`;
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
                const low = (hayPens && Math.floor((GameState.inventory['hay'] || 0) / hayPens) < 3) || (grainPens && Math.floor((GameState.inventory['grain'] || 0) / grainPens) < 3);
                h += `<div style="font-size:0.8rem; ${low ? 'color:#c0392b;' : ''}">🌾 ${t('dvur.feedStock')}: ${parts.join(' \u00b7 ')}</div>`;
            }

            // Poslední krmení — přehled za všechny výběhy zvlášť, každý ze svého
            // vlastního st.lastFedAt (stejný zdroj, jaký používá detail chlívu
            // samotného). Dřívější verze četla GameState.feeding — oddělený
            // auto-tick tracker, který se neaktualizoval kliknutím na Feed;
            // proto ukazovala starý/nesouvisející záznam.
            // Scope: jen henhouse/sheepfold/rabbitry — jediné 3 chlévy s
            // vlastním Feed tlačítkem a lastFedAt polem. Goatpen/Byre/Stable
            // ho nemají vůbec, vynecháno (ne "Nikdy" navždy).
            {
                const feedPens = [
                    { label: lang === 'en' ? 'Hens' : 'Slepice', icon: '🌾', st: GameState.henhouse, hasAnimals: ((GameState.henhouse && GameState.henhouse.hens) || []).length > 0 },
                    { label: lang === 'en' ? 'Sheep' : 'Ovce', icon: '🌿', st: GameState.sheepfold, hasAnimals: ((GameState.sheepfold && GameState.sheepfold.sheep) || 0) > 0 },
                    { label: lang === 'en' ? 'Rabbits' : 'Králíci', icon: '🌿', st: GameState.rabbitry, hasAnimals: ((GameState.rabbitry && GameState.rabbitry.animals) || []).length > 0 },
                ].filter(p => p.st && p.st.built && p.hasAnimals);

                if (feedPens.length) {
                    const parts = feedPens.map(p => {
                        const fedAgo = p.st.lastFedAt ? Math.floor((Date.now() - p.st.lastFedAt) / 3600000) : null;
                        const fedTxt = fedAgo === null ? (lang === 'en' ? 'Never' : 'Nikdy') : fedAgo < 1 ? (lang === 'en' ? '< 1h' : '< 1h') : ('~' + fedAgo + 'h');
                        const hungry = fedAgo === null || fedAgo >= 24;
                        return `<span style="${hungry ? 'color:#c0392b;' : ''}">${p.icon} ${p.label}: <strong>${fedTxt}</strong></span>`;
                    });
                    h += `<div style="font-size:0.76rem; opacity:0.85;">${lang === 'en' ? 'Last fed' : 'Krmeno'} — ${parts.join(' · ')}</div>`;
                }
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

    _renderMastal: function () {
        var h = '';
        var lang = (GameState.settings && GameState.settings.language) || 'cs';
        var hasAsinus = GameState.researchedTechs && GameState.researchedTechs.includes('tech_asinus');

        // Konírna
        h += '<div style="font-size:0.72rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin-bottom:8px;">🐎 ' + (lang === 'en' ? 'Stable (Konírna)' : 'Konírna (Stabulum)') + '</div>';
        h += this.renderAnimalPen('stable');

        // Oslárna — jen s tech_asinus
        h += '<div style="margin-top:16px;">';
        h += '<div style="font-size:0.72rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin-bottom:8px;">🫏 ' + (lang === 'en' ? 'Donkey Stall (Oslárna)' : 'Oslárna (Asinus)') + '</div>';
        if (hasAsinus) {
            h += this.renderDonkeyStall();
        } else {
            var techNm = typeof tName === 'function' ? tName('tech_asinus') : 'tech_asinus';
            h += '<div style="padding:12px;opacity:0.6;font-size:0.85rem;">🔒 ' + t('dvur.lockedPrefix') + ' ' + techNm + '</div>';
        }
        h += '</div>';
        return h;
    },

    _renderColumbarium: function () {
        this._ensureAnimals();
        const c = GameState.columbarium;
        const cfg = this.COLUMBARIUM_CFG;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        let h = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        h += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🕊️ ${t('farmyard.columbarium')}</h3>`;

        if (!c.built) {
            h += `<p style="font-size:0.82rem; opacity:0.7; margin-bottom:10px;">${t('farmyard.columbariumBuildDesc')}</p>`;
            h += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">🏗️ ${t('dvur.buildInCellarium')}</div>`;
            h += `</div>`;
            return h;
        }

        // Postaveno, ale holubi ještě nedorazili — petition UI
        if (c.count <= 0) {
            const pet = (GameState.abbotPetition && GameState.abbotPetition.columbarium) || { status: 'none' };
            h += `<p style="font-size:0.82rem; opacity:0.7; margin-bottom:10px;">${lang === 'en' ? 'The tower stands empty, awaiting pigeons from the abbey.' : 'Věž stojí prázdná, čeká na holuby z opatství.'}</p>`;
            if (pet.status === 'pending') {
                const cs = lang !== 'en';
                const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
                const submitDate = pet.submittedAt ? _toGameDate(pet.submittedAt).toLocaleDateString(cs ? 'cs-CZ' : 'en-GB') : '?';
                const responseDate = pet.submittedAt ? _toGameDate(pet.submittedAt + 86400000).toLocaleDateString(cs ? 'cs-CZ' : 'en-GB') : '?';
                const pendingText = t('abbotPetition.columbarium.pending').replace('{date}', submitDate).replace('{responseDate}', responseDate);
                h += `<div style="font-size:0.8rem; opacity:0.7; font-style:italic;">⏳ ${pendingText}</div>`;
            } else {
                h += `<button class="craft-btn" onclick="Game.submitAbbotPetition('columbarium')">🕊️ ${t('abbotPetition.columbarium.submit_btn')}</button>`;
            }
            h += `</div>`;
            return h;
        }

        const eggReady = now >= (c.lastEggAt || 0) + cfg.eggIntervalMs;
        const featherReady = now >= (c.lastFeatherAt || 0) + cfg.featherIntervalMs;
        const cap = this.columbariumCapacity();
        h += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:12px; font-size:0.82rem;">`;
        h += `<div>🕊️ ${lang === 'en' ? 'Pigeons' : 'Holubi'}: <strong>${c.count}/${cap}</strong></div>`;
        h += `<div>🥚 ${t('farmyard.eggs')}: <strong>${eggReady ? t('farmyard.ready') + ' (' + cfg.eggYield + ')' : Math.ceil(((c.lastEggAt || 0) + cfg.eggIntervalMs - now) / 3600000) + 'h'}</strong></div>`;
        h += `<div>🪶 ${t('farmyard.feathers')}: <strong>${featherReady ? t('farmyard.ready') + ' (' + cfg.featherYield + ')' : Math.ceil(((c.lastFeatherAt || 0) + cfg.featherIntervalMs - now) / 3600000) + 'h'}</strong></div>`;
        h += `</div>`;

        // MRD Columbarium II — kapacita 40 (Columbaria Interna)
        if ((c.capacityTier || 1) < 2) {
            const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_columbaria_interna');
            if (hasTech) {
                const upCost = this.COLUMBARIUM_UPGRADE_COST;
                const canUp = Object.entries(upCost).every(([id, n]) => (GameState.inventory[id] || 0) >= n);
                const costStr = Object.entries(upCost).map(([id, n]) => `${n}× ${typeof iName === 'function' ? iName(id) : id}`).join(', ');
                h += `<button class="craft-btn" onclick="FarmyardSystem.upgradeColumbariumCapacity()" style="font-size:0.76rem; margin-bottom:8px;" ${canUp ? '' : 'disabled'}>🏗️ ${lang === 'en' ? 'Build Columbaria Interna' : 'Postavit Vnitřní kolumbária'} (${costStr})</button>`;
            }
        }

        // MRD Columbarium II — líheň a squab pool
        if (c.nesting) {
            const hoursLeft = Math.max(0, Math.ceil((c.nesting.hatchAt - now) / 3600000));
            h += `<div style="font-size:0.78rem; opacity:0.75; margin-bottom:8px;">🥚 ${lang === 'en' ? 'Nesting' : 'Hnízdění'} — ${hoursLeft}h</div>`;
        } else {
            const canNest = (c.count || 0) >= 2;
            h += `<button class="craft-btn" onclick="FarmyardSystem.startNestingColumbarium()" style="font-size:0.78rem; margin-bottom:8px;" ${canNest ? '' : 'disabled'}>🥚 ${lang === 'en' ? 'Start nesting' : 'Zahájit hnízdění'}</button>`;
        }
        if ((c.squabPool || 0) > 0) {
            h += `<div style="font-size:0.82rem; margin-bottom:6px;">🐣 ${lang === 'en' ? 'Squabs' : 'Holoubata'}: <strong>${c.squabPool}</strong></div>`;
            h += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">`;
            h += `<button class="craft-btn" onclick="FarmyardSystem.populateSquabsColumbarium(${c.squabPool})" style="font-size:0.72rem;">🕊️ ${lang === 'en' ? 'Add to flock' : 'Do hejna'}</button>`;
            h += `<button class="craft-btn" onclick="FarmyardSystem.slaughterSquabColumbarium(${c.squabPool})" style="font-size:0.72rem; background:rgba(140,80,60,0.85);">🍗 ${lang === 'en' ? 'Slaughter for meat' : 'Porazit na maso'}</button>`;
            h += `</div>`;
        }
        if ((c.count || 0) > 2) {
            h += `<button class="craft-btn" onclick="FarmyardSystem.slaughterAdultColumbarium(1)" style="font-size:0.72rem; margin-bottom:8px; background:rgba(140,80,60,0.7);">🍖 ${lang === 'en' ? 'Slaughter 1 adult' : 'Porazit 1 dospělého'}</button>`;
        }

        // Level 2 — nabílení vápnem, imunita proti predátorům
        if (c.level >= 2) {
            h += `<div style="font-size:0.78rem; color:#5a9a5a; margin-bottom:8px;">⬜ ${t('farmyard.columbariumWhitewashed')}</div>`;
        } else {
            const hasCalc = GameState.researchedTechs && GameState.researchedTechs.includes('tech_calcaria');
            const canWhitewash = hasCalc && (GameState.inventory['vapno_hasene_mature'] || 0) >= this.WHITEWASH_COST.vapno_hasene_mature;
            h += `<div style="font-size:0.78rem; opacity:0.75; margin-bottom:8px;">🦡 ${t('farmyard.columbariumPredatorRisk')}</div>`;
            if (hasCalc) {
                h += `<button class="craft-btn" onclick="FarmyardSystem.whitewashColumbarium()" style="font-size:0.78rem; margin-bottom:8px;" ${canWhitewash ? '' : 'disabled'}>⬜ ${t('farmyard.columbariumWhitewash_btn')} (${this.WHITEWASH_COST.vapno_hasene_mature}× ${typeof iName === 'function' ? iName('vapno_hasene_mature') : 'vápno'})</button>`;
            }
        }

        const canClean = now - (c.lastCleanMs || 0) >= this.DAY_MS;
        h += `<div style="display:flex; gap:6px; flex-wrap:wrap;">`;
        h += `<button class="craft-btn" onclick="FarmyardSystem.collectColumbarium()">🥚 ${t('farmyard.collect')}</button>`;
        h += `<button class="craft-btn" onclick="FarmyardSystem.cleanColumbarium()" style="background:rgba(90,154,90,0.85);">${canClean ? '🧹 ' + t('farmyard.clean') : '🧹 ' + t('farmyard.cleanTomorrow')}</button>`;
        h += `</div>`;
        h += `</div>`;
        return h;
    },

    _renderChlevy: function () {
        var h = '';
        var lang = (GameState.settings && GameState.settings.language) || 'cs';
        var hasCaprile = GameState.researchedTechs && GameState.researchedTechs.includes('tech_caprile');
        var hasSuile = GameState.researchedTechs && GameState.researchedTechs.includes('tech_suile');
        var hasArmentum = GameState.researchedTechs && GameState.researchedTechs.includes('tech_armentum');

        // Kozín
        h += '<div style="font-size:0.72rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin-bottom:8px;">🐐 ' + (lang === 'en' ? 'Goat Pen (Caprile)' : 'Kozín (Caprile)') + '</div>';
        if (hasCaprile) {
            h += this.renderAnimalPen('goatpen');
        } else {
            var techNm1 = typeof tName === 'function' ? tName('tech_caprile') : 'tech_caprile';
            h += '<div style="padding:12px;opacity:0.6;font-size:0.85rem;">🔒 ' + t('dvur.lockedPrefix') + ' ' + techNm1 + '</div>';
        }

        // Vepřín
        h += '<div style="margin-top:16px;">';
        h += '<div style="font-size:0.72rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin-bottom:8px;">🐖 ' + (lang === 'en' ? 'Piggery (Suile)' : 'Vepřín (Suile)') + '</div>';
        if (hasSuile) {
            h += this.renderAnimalPen('pigsty');
        } else {
            var techNm2 = typeof tName === 'function' ? tName('tech_suile') : 'tech_suile';
            h += '<div style="padding:12px;opacity:0.6;font-size:0.85rem;">🔒 ' + t('dvur.lockedPrefix') + ' ' + techNm2 + '</div>';
        }
        h += '</div>';

        // Kravín
        h += '<div style="margin-top:16px;">';
        h += '<div style="font-size:0.72rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin-bottom:8px;">🐄 ' + (lang === 'en' ? 'Cow Byre (Armentum)' : 'Kravín (Armentum)') + '</div>';
        if (hasArmentum) {
            h += this.renderAnimalPen('cowbyre');
        } else {
            var techNm3 = typeof tName === 'function' ? tName('tech_armentum') : 'tech_armentum';
            h += '<div style="padding:12px;opacity:0.6;font-size:0.85rem;">🔒 ' + t('dvur.lockedPrefix') + ' ' + techNm3 + '</div>';
        }
        h += '</div>';

        return h;
    },

    _renderDvurLocked: function (tab) {
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

    buildHenhouse: function () {
        const h = GameState.henhouse;
        if (h.built) return;
        if ((GameState.inventory['rock'] || 0) < 15) { UI.notify(t('game.needStone') + ' (15)', true); return; }
        if ((GameState.inventory['stick'] || 0) < 10) { UI.notify(t('game.needWood') + ' (10)', true); return; }
        if ((GameState.inventory['rope'] || 0) < 3) { UI.notify(t('game.needRope') + ' (3)', true); return; }
        Game.removeItem('rock', 15); Game.removeItem('stick', 10); Game.removeItem('rope', 3);
        h.built = true;
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🐔 ' + t('game.hennhouseBuilt'));
    },

    addHen: function (type) {
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
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🐔 ' + t('game.henAdded'));
    },

    startNesting: function () {
        const h = GameState.henhouse;
        if (!h.built || !h.rooster || h.hens.length === 0) { UI.notify(t('game.nestingReq'), true); return; }
        if (h.nesting) { UI.notify(t('game.nestingActive'), true); return; }
        const now = Date.now();
        h.nesting = { state: 'nesting', startedAt: now, hatchAt: now + 86400000 };
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🥚 ' + t('game.nestingStarted'));
    },

    slaughterChick: function (qty) {
        const h = GameState.henhouse;
        qty = Math.min(qty, h.chickPool);
        if (qty <= 0) { UI.notify(t('game.noChicks'), true); return; }
        h.chickPool -= qty;
        Game.addItem('chicken_meat', qty);
        Game.addItem('feather_hen', qty * 2);
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🍗 ' + t('game.slaughtered').replace('{qty}', qty));
    },

    slaughterHen: function (idx) {
        const h = GameState.henhouse;
        if (!h.hens[idx]) return;
        h.hens.splice(idx, 1);
        Game.addItem('chicken_meat', 2);
        Game.addItem('feather_hen', 3);
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🍗 ' + t('game.henSlaughtered'));
    },

    collectHenhouse: function () {
        const h = GameState.henhouse;
        if (!h.built || h.hens.length === 0) return;
        const now = Date.now();
        const EGG_INTERVAL = 8 * 3600000;
        const FEATH_INTERVAL = 24 * 3600000;
        let collected = false;
        if (now >= (h.lastEggAt || 0) + EGG_INTERVAL) {
            const moodMult = this.MOOD_MULT(this.getMood('henhouse'));
            const slugBonus = (h.slugFedAt && (now - h.slugFedAt) < 28800000) ? 1.25 : 1.0;
            const mult = (h.rooster ? 1.2 : 1.0) * moodMult * slugBonus;
            const eggs = Math.floor(h.hens.length * mult);
            if (eggs > 0) { Game.addItem('egg', eggs); h.lastEggAt = now; collected = true; }
        }
        if (now >= (h.lastFeatherAt || 0) + FEATH_INTERVAL) {
            Game.addItem('feather_hen', h.hens.length);
            h.lastFeatherAt = now; collected = true;
        }
        if (collected) { Game.save(); FarmyardSystem.renderFarmyard(); UI.notify('🥚 ' + t('game.hennouseCollected')); }
        else UI.notify(t('game.penNotReady'), true);
    },

    feedHenhouse: function () {
        const h = GameState.henhouse;
        if (!h.built || h.hens.length === 0) return;
        const chickFeed = h.nesting && h.nesting.state === 'growing' ? Math.ceil(h.nesting.chicks / 2) : 0;
        const totalFeed = h.hens.length + chickFeed;
        const inv = GameState.inventory;

        // Priorita krmiva: zrní (plná porce)
        // Nouzové: semínka — 4 semínka = 1 porce pro 1 slepici
        const GRAINS = ['grain', 'oats', 'barley', 'millet', 'rye_grain', 'rye_grain_1', 'rye_grain_2', 'wheat_grain', 'wheat_grain_1', 'wheat_grain_2'];
        let grainItem = null, grainHave = 0;
        GRAINS.forEach(function (g) { const n = inv[g] || 0; if (n > grainHave) { grainHave = n; grainItem = g; } });

        if (grainItem && grainHave >= totalFeed) {
            // Plné krmení zrním
            Game.removeItem(grainItem, totalFeed);
            h.lastFedAt = Date.now();
            Game.save(); FarmyardSystem.renderFarmyard();
            UI.notify('🌾 ' + t('game.henFed'));
            return;
        }

        // Nouzové krmení semínky (4 semínka = 1/4 porce pro 1 slepici)
        const SEEDS = ['seeds_herb', 'seeds_vegetable'];
        let seedItem = null, seedHave = 0;
        SEEDS.forEach(function (s) { const n = inv[s] || 0; if (n > seedHave) { seedHave = n; seedItem = s; } });
        const seedNeeded = totalFeed * 4;
        if (seedItem && seedHave >= seedNeeded) {
            Game.removeItem(seedItem, seedNeeded);
            h.lastFedAt = Date.now();
            Game.save(); FarmyardSystem.renderFarmyard();
            UI.notify('🌱 ' + t('game.henFedSeeds') + ' (1/4)');
            return;
        }

        // Nic k dispozici
        const needed = grainItem ? totalFeed + 'x ' + (typeof iName === 'function' ? iName(grainItem) : grainItem) : totalFeed * 4 + 'x ' + t('game.seeds');
        UI.notify(t('game.needFeedHen') + ' (' + needed + ')', true);
    },

    feedHenhouseSlug: function () {
        const h = GameState.henhouse;
        if (!h.built || h.hens.length === 0) return;
        const needed = h.hens.length * 2;
        if ((GameState.inventory['slug'] || 0) < needed) {
            UI.notify(t('farmyard.needSlug') + ' (' + needed + ')', true); return;
        }
        Game.removeItem('slug', needed);
        h.lastFedAt = Date.now();
        h.slugFedAt = Date.now();
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🐌 ' + t('farmyard.slugFed'));
    },

    // ═══════════════════════════════════════════════════════════════════════
    // OVILE — Ovčín akce (přesunuto z game.js)
    // ═══════════════════════════════════════════════════════════════════════

    buildSheepfold: function () {
        const s = GameState.sheepfold;
        if (s.built) return;
        if (!GameState.researchedTechs.includes('tech_de_re_rustica')) { UI.notify(t('game.needDeReRustica'), true); return; }
        if ((GameState.inventory['rock'] || 0) < 20) { UI.notify(t('game.needStone') + ' (20)', true); return; }
        if ((GameState.inventory['stick'] || 0) < 15) { UI.notify(t('game.needWood') + ' (15)', true); return; }
        if ((GameState.inventory['rope'] || 0) < 5) { UI.notify(t('game.needRope') + ' (5)', true); return; }
        Game.removeItem('rock', 20); Game.removeItem('stick', 15); Game.removeItem('rope', 5);
        s.built = true;
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🐑 ' + t('game.sheepfoldBuilt'));
    },

    addSheep: function () {
        const s = GameState.sheepfold;
        if (!s.built) return;
        if (s.sheep >= 6) { UI.notify(t('game.sheepFull'), true); return; }
        if (!(GameState.inventory['sheep'] > 0)) { UI.notify(t('game.needSheep'), true); return; }
        Game.removeItem('sheep', 1);
        s.sheep++;
        if (!Array.isArray(s.sheepObjs)) s.sheepObjs = [];
        s.sheepObjs.push({ sex: 'f', mood: 80, bornAt: Date.now(), lastCleaned: 0 });
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🐑 ' + t('game.sheepAdded'));
    },

    startBreeding: function () {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep < 2) { UI.notify(t('game.breedingReq'), true); return; }
        if (s.breeding) { UI.notify(t('game.breedingActive'), true); return; }
        // Loan male check — beran ze vsi
        if (!this.loanMaleActive('ram')) { UI.notify(t('farmyard.needRam'), true); return; }
        const now = Date.now();
        s.breeding = { state: 'gestating', startedAt: now, bornAt: now + 172800000 };
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🐑 ' + t('game.breedingStarted'));
    },

    slaughterLamb: function (qty) {
        const s = GameState.sheepfold;
        qty = Math.min(qty, s.lambPool);
        if (qty <= 0) { UI.notify(t('game.noLambs'), true); return; }
        s.lambPool -= qty;
        Game.addItem('mutton', qty * 2);
        Game.addItem('lamb_hide', qty);
        Game.addItem('rennet', qty);
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🥩 ' + t('game.lambSlaughtered').replace('{qty}', qty));
    },

    slaughterSheep: function () {
        const s = GameState.sheepfold;
        if (s.sheep <= 0) return;
        s.sheep--;
        if (Array.isArray(s.sheepObjs) && s.sheepObjs.length) s.sheepObjs.pop();
        Game.addItem('mutton', 3);
        Game.addItem('raw_hide', 1);
        if (Math.random() < 0.5) Game.addItem('rennet', 1);
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🥩 ' + t('game.sheepSlaughtered'));
    },

    collectSheepfold: function () {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep === 0) return;
        const now = Date.now();
        const MILK_INTERVAL = 12 * 3600000;
        const WOOL_INTERVAL = 48 * 3600000;
        // Sezóna — mléko jaro/léto/podzim (ne zima)
        const month = new Date().getMonth(); // 0-based
        const milkSeason = month >= 2 && month <= 10; // březem–říjen
        let collected = false;
        const moodMult = this.MOOD_MULT(this.getMood('sheepfold'));
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
        if (collected) { Game.save(); FarmyardSystem.renderFarmyard(); UI.notify('🐑 ' + t('game.sheepCollected')); }
        else UI.notify(t('game.penNotReady'), true);
    },

    feedRabbitry: function () {
        const st = GameState.rabbitry;
        if (!st || !st.built || st.animals.length === 0) return;
        const fiberNeeded = st.animals.length;
        const waterNeeded = st.animals.length;
        if ((GameState.inventory['fiber'] || 0) < fiberNeeded) { UI.notify(t('game.needFeedSheep') + ' (' + fiberNeeded + ')', true); return; }
        if (!this._checkFeedWater(waterNeeded, false).ok) { UI.notify(t('game.needWater'), true); return; }
        Game.removeItem('fiber', fiberNeeded);
        this._checkFeedWater(waterNeeded, true);
        st.lastFedAt = Date.now();
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🌿 ' + t('game.sheepFed'));
    },

    feedSheepfold: function () {
        const s = GameState.sheepfold;
        if (!s.built || s.sheep === 0) return;
        const lambFeed = s.breeding && s.breeding.state === 'growing' ? 1 : 0;
        const fiberNeeded = s.sheep * 2 + lambFeed;
        const waterNeeded = s.sheep + (lambFeed > 0 ? 1 : 0);
        if ((GameState.inventory['fiber'] || 0) < fiberNeeded) { UI.notify(t('game.needFeedSheep') + ' (' + fiberNeeded + ')', true); return; }
        if (!this._checkFeedWater(waterNeeded, false).ok) { UI.notify(t('game.needWater'), true); return; }
        Game.removeItem('fiber', fiberNeeded);
        this._checkFeedWater(waterNeeded, true);
        s.lastFedAt = Date.now();
        Game.save(); FarmyardSystem.renderFarmyard();
        UI.notify('🌿 ' + t('game.sheepFed'));
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PRODUCTION TICK — kurník/ovčín líhnutí a dorůstání (přesunuto z game.js)
    // ═══════════════════════════════════════════════════════════════════════

    checkFarmyardProduction: function () {
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
        if (s && s.healerPending && now >= s.healerPending.readyAt) {
            s.healerPending = null;
            if (Math.random() < 0.95) {
                if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('events.curia_sheep_disease.healer_notif'));
                if (typeof EventsSystem !== 'undefined' && EventsSystem._addKronika) EventsSystem._addKronika(t('events.curia_sheep_disease.healer_notif'));
            } else {
                s.sheep = Math.max(0, s.sheep - 1);
                if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('events.curia_sheep_disease.healer_notif_fail'), true);
            }
            changed = true;
        }
        // MRD Columbarium II — líheň, jednostupňová (hnízdění → rovnou squabPool, žádná mezifáze "growing")
        const cb = GameState.columbarium;
        if (cb && cb.nesting && cb.nesting.state === 'nesting' && now >= cb.nesting.hatchAt) {
            const yieldN = 1 + Math.floor(Math.random() * 2); // 1–2 holoubata
            cb.squabPool = (cb.squabPool || 0) + yieldN;
            cb.nesting = null;
            changed = true;
        }
        if (changed) Game.save();
    },


};