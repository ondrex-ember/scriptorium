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
    VIGOR_THRESHOLD_RESEARCH: 20,  // výzkum (study)

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

    // Syrové food_raw položky, které lze sníst přímo (bez vaření).
    // Game.eat() proti tomuto seznamu whitelistuje food_raw položky.
    // cream/butter jsou type:"mat" (crafting surovina) — zůstává tak kvůli
    // sýr/máslo řetězům, whitelist jen povoluje přímou konzumaci navíc.
    RAW_EDIBLE_FOOD: [
        'apple', 'pear', 'plum', 'cherry', 'mulberry', 'cornel_cherry',
        'carrot', 'cabbage', 'radish', 'turnip',
        'sorrel', 'dandelion', 'ground_elder', 'goosefoot',
        'walnut', 'cream', 'butter',
    ],

    // Satiety z jídla
    FOOD_SATIETY: {
        berries:        5,
        mushroom:       8,
        spring_herb_porridge: 15,
        burdock_root_baked: 10,
        rosehip_sauce: 12,
        famine_bread: 22,
        dried_wild_fruit: 8,
        sloe_jam: 6,
        morel_stuffed: 18,
        pickled_mushrooms: 10,
        roots:          5,
        fish:           15,
        // Syrové ovoce a zelenina (RAW_EDIBLE_FOOD — jíst přímo, bez vaření)
        apple:          4,
        pear:           4,
        plum:           4,
        cherry:         5,
        mulberry:       4,
        cornel_cherry:  4,
        carrot:         4,
        cabbage:        4,
        radish:         3,
        turnip:         3,
        sorrel:         3,
        dandelion:      3,
        ground_elder:   3,
        goosefoot:      3,
        walnut:         6,
        cooked_fish:    20,
        porridge:       18,
        bread:          20,
        bread_fine:     28,
        bread_fine_1:   35,
        berry_pie:      20,
        berry_pie_koreni: 27,
        berry_pie_fine:   28,
        berry_pie_fine_1: 35,
        cooked_meat:    25,
        crayfish_boiled: 18,
        snails_black_sauce: 20,
        frog_legs_fried: 20,
        stew:           35,
        stew_koreni:    42,
        cheese:         12,
        egg:            10,
        cream:          6,
        butter:         8,
        honey:          8,
        beer:           5,
        wine:           3,
        // Maso a drůbež z Dvora (syrové meat/beef/mutton/chicken_meat/rabbit_meat = food_raw, nejedí se přímo)
        cured_meat:     30,
        cured_beef:     30,
        cooked_beef:    28,
        cooked_mutton:  25,
        cooked_chicken: 25,
        cooked_rabbit:  25,
        roast_beef:     32,
        braised_beef:   32,
        roast_rabbit_dish: 30,
        mushroom_soup:  30,
        smazenice:      28,
        // Víno a hrozny
        mustum:         5,
        pryk:           5,
        vinum:          6,
        vinum_rubrum:   6,
        vinum_obscurum: 6,
        vinum_baci:     6,
        vinum_praeclarum: 8,
        raisins:        6,
        grapes_belina:      3,
        grapes_klevner:     3,
        grapes_frankovka:   3,
        grapes_tramin:      3,
        grapes_modry_janek: 3,
        grapes_baco:        3,
        // Klášterní pivo
        prima_cervisia: 8,
        cervisia_nigra: 10,
        // Bylinné nápoje
        herbal_tea:     5,
        hildegard_tisane: 8,
        acorn_brew:     3,
        chicory_drink:  3,
        linden_tea:     8,
        // Voda
        water:          1,
        spring_water:   5,
        holy_water:     8,
    },

    // Fatigue z jídla (záporné = snižuje únavu)
    FOOD_FATIGUE: {
        stew:           -10,
        herbal_tea:     -15,
        hildegard_tisane: -20,
        acorn_brew:     -10,
        chicory_drink:  -12,
        linden_tea:     -8,
        beer:           10,
        wine:           8,
        cured_meat:     5,
        cured_beef:     5,
        mushroom_soup: -5,
        smazenice:      2,
        pryk:           5,
        vinum:          7,
        vinum_rubrum:   7,
        vinum_obscurum: 7,
        vinum_baci:     7,
        vinum_praeclarum: 7,
        prima_cervisia: 8,
        cervisia_nigra: 6,
        // Voda
        water:          -1,
        spring_water:   -15,
        holy_water:     -20,
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
                meditateUsed: 0,   // timestamp posledního použití meditace (cooldown)
                nonaStart:    0,   // timestamp začátku odpočinku Nona (0 = nečeká)
                meditateStart: 0,  // timestamp začátku meditace (0 = nečeká)
            };
        }
        // Migrace — přidat meditateUsed pokud chybí
        if (typeof GameState.vigorMeta.meditateUsed === 'undefined') {
            GameState.vigorMeta.meditateUsed = 0;
        }
        if (typeof GameState.vigorMeta.nonaStart === 'undefined') {
            GameState.vigorMeta.nonaStart = 0;
        }
        if (typeof GameState.vigorMeta.meditateStart === 'undefined') {
            GameState.vigorMeta.meditateStart = 0;
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

        // Valetudo — průběžný tik aktivních neduhů (stejné elapsed, převedeno zpět na ms)
        if (typeof HealthSystem !== 'undefined') HealthSystem.tickAll(elapsed * 3600000);

        // Haeresis Occulta MRD — inquisitionHeat roste, dokud blud trvá (stejné elapsed, v hodinách)
        if (typeof SecretsSystem !== 'undefined' && SecretsSystem.tickInquisitionHeat) SecretsSystem.tickInquisitionHeat(elapsed);

        // ── Timer check: Nona odpočinek (60s) ────────────────────────────────
        if (meta.nonaStart > 0 && now - meta.nonaStart >= 60000) {
            GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - 20);
            const today = new Date().toISOString().slice(0, 10);
            meta.nonaUsed = today;
            meta.nonaStart = 0;
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const vigorAfter = this.getVigor();
            const msg = lang === 'en'
                ? `😴 Nona rest complete. Fatigue −20. Vigor: ${vigorAfter}%.`
                : `😴 Odpočinek při Nóně dokončen. Únava −20. Vigor: ${vigorAfter}%.`;
            if (typeof UI !== 'undefined') {
                if (UI.notify) UI.notify(msg);
                if (UI.notifyPanel) UI.notifyPanel(msg, 'system');
            }
            if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
        }

        // ── Timer check: Meditace (180s) ─────────────────────────────────────
        if (meta.meditateStart > 0 && now - meta.meditateStart >= 180000) {
            GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - 50);
            meta.meditateUsed = now;
            meta.meditateStart = 0;
            this._closeMeditationOverlay();
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const msg = lang === 'en'
                ? `🧘 Lectio et meditatio complete. Fatigue -50. Vigor: ${this.getVigor()}.`
                : `🧘 Lectio et meditatio dokončena. Únava -50. Vigor: ${this.getVigor()}.`;
            if (typeof UI !== 'undefined') {
                if (UI.notify) UI.notify(msg);
                if (UI.notifyPanel) UI.notifyPanel(msg, 'system');
            }
            if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
        }

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
    onScavenge: function(type, durationMin) {
        const cost = (type === 'mine' || type === 'quarry_stone' || type === 'mine_iron_ore')
            ? this.FATIGUE_COSTS.mine
            : (durationMin && durationMin > 0)
                ? this.FATIGUE_COSTS.scavenge          // timed výprava — beze změny, už dnes výhodná
                : this.FATIGUE_COSTS.scavenge * 3;      // instant klik — dráž, ať se timed vyplatí i na Vigoru
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

    canResearch: function() {
        return this.getVigor() >= this.VIGOR_THRESHOLD_RESEARCH;
    },

    // Spodní práh: při Vigor 0 (vyčerpán) není možná žádná akce.
    canAct: function() {
        return this.getVigor() > 0;
    },

    // ── Jídlo ────────────────────────────────────────────────────────────────
    // Maso a víno pro gout tracking (monastery-decay-mrd) — dna z přemíry
    // hodování. Pivo záměrně vynecháno (obyčejný klášterní nápoj, ne
    // "přemíra"). Log v GameState.goutLog[] (timestampy), viz goutWeeklyScore().
    GOUT_MEAT_ITEMS: ['cooked_meat', 'cured_meat', 'cured_beef', 'cooked_beef',
                       'cooked_mutton', 'cooked_chicken', 'cooked_rabbit',
                       'roast_beef', 'braised_beef', 'roast_rabbit_dish'],
    GOUT_WINE_ITEMS: ['wine', 'vinum', 'vinum_rubrum', 'vinum_obscurum',
                       'vinum_baci', 'vinum_praeclarum', 'mustum'],

    // Váha zkonzumovaného masa/vína za posledních 7 dní (počet položek, ne
    // pouze počet kusů — jeden záznam = jedna konzumační akce). Používá
    // HealthConditionsDB.gout trigger (viz data/health.js).
    goutWeeklyScore: function() {
        if (!GameState.goutLog) return 0;
        const weekAgo = Date.now() - 7 * 24 * 3600000;
        GameState.goutLog = GameState.goutLog.filter(e => e.ts >= weekAgo); // průběžný úklid starých záznamů
        return GameState.goutLog.length;
    },

    eat: function(foodId) {
        let satGain = this.FOOD_SATIETY[foodId] || 10;
        // Professio: Zahradník (vigor_food) — jídlo sytí víc
        const roleMult = (typeof RankSystem !== 'undefined') ? RankSystem.getActiveBonus('vigor_food') : 1.0;
        satGain = Math.round(satGain * roleMult);
        const fatChange = this.FOOD_FATIGUE[foodId] || 0;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Gout tracking (monastery-decay-mrd) — zaznamenat konzumaci masa/vína
        if (this.GOUT_MEAT_ITEMS.includes(foodId) || this.GOUT_WINE_ITEMS.includes(foodId)) {
            if (!GameState.goutLog) GameState.goutLog = [];
            GameState.goutLog.push({ ts: Date.now(), foodId });
            // Bezpečnostní cap (po vzoru Game.addKronikaEntry) — i když se stará
            // data čistí v goutWeeklyScore(), pojistka proti neomezenému růstu
            // mezi voláními (např. hráč jí hodně, ale nikdy neotevře stat panel).
            if (GameState.goutLog.length > 200) {
                GameState.goutLog = GameState.goutLog.slice(-200);
            }
        }

        // Oheň sv. Antonína (monastery-decay-mrd) — vzácná otrava námelem.
        // bread recept je univerzální (fiber, ne konkrétně žito), proto jako
        // proxy "peče se ze žita" bereme přítomnost žitného zrní ve skladu.
        if (foodId === 'bread' && typeof HealthSystem !== 'undefined' && !HealthSystem.isActive('ergot_fire')) {
            const hasRye = (GameState.inventory['rye_grain'] || 0) > 0
                || (GameState.inventory['rye_grain_1'] || 0) > 0
                || (GameState.inventory['rye_grain_2'] || 0) > 0;
            if (hasRye && Math.random() < 0.004) {
                HealthSystem.addCondition('ergot_fire');
            }
        }

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
        if (GameState.vigorMeta.nonaStart > 0) {
            if (typeof UI !== 'undefined' && UI.notify)
                UI.notify(lang === 'en' ? '😴 Already resting...' : '😴 Již odpočíváš...', true);
            return;
        }
        if ((GameState.vigorMeta.meditateStart || 0) > 0) {
            if (typeof UI !== 'undefined' && UI.notify)
                UI.notify(lang === 'en' ? '🧘 Complete meditation first.' : '🧘 Nejprve dokonči meditaci.', true);
            return;
        }

        // Spustit timer (60s real time)
        GameState.vigorMeta.nonaStart = Date.now();
        const msg = lang === 'en'
            ? '😴 Nona rest started. Rest for 60 seconds...'
            : '😴 Odpočinek začal. Odpočívej 60 sekund...';
        if (typeof UI !== 'undefined') {
            if (UI.notify) UI.notify(msg);
        }
        this.renderPill();
        if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
        if (typeof Game !== 'undefined' && Game.save) Game.save();

        // Sekundový interval — živý odpočet + auto-dokončení
        if (this._nonaInterval) clearInterval(this._nonaInterval);
        this._nonaInterval = setInterval(() => {
            const meta = GameState.vigorMeta;
            if (!meta) { clearInterval(this._nonaInterval); return; }
            if (meta.nonaStart === 0) {
                clearInterval(this._nonaInterval); this._nonaInterval = null;
                if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
                return;
            }
            const remaining = Math.max(0, this.NONA_DURATION - (Date.now() - meta.nonaStart));
            if (remaining === 0) {
                clearInterval(this._nonaInterval); this._nonaInterval = null;
                VigorSystem._completeNona();
                return;
            }
            // Živý update countdown elementu bez full re-renderu
            const el = document.getElementById('vigor-nona-status');
            if (el) {
                const pct = Math.round((1 - remaining / this.NONA_DURATION) * 100);
                el.innerHTML = `😴 ${lang === 'en' ? `Resting... ${Math.ceil(remaining/1000)}s` : `Odpočíváš... ${Math.ceil(remaining/1000)}s`}
                    <div style="height:3px;background:rgba(197,160,89,0.15);border-radius:2px;margin-top:4px;">
                        <div style="height:3px;background:var(--accent-gold);border-radius:2px;width:${pct}%;transition:width 1s;"></div>
                    </div>`;
            }
        }, 1000);
    },

    // ── Dokončení Nona odpočinku ──────────────────────────────────────────────
    _completeNona: function() {
        const meta = GameState.vigorMeta;
        if (!meta || meta.nonaStart === 0) return; // guard proti double-fire
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Aplikuj efekt
        const vigorBefore = this.getVigor();
        GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - 20);
        const today = new Date().toISOString().slice(0, 10);
        meta.nonaUsed  = today;
        meta.nonaStart = 0;
        const vigorAfter = this.getVigor();

        // Toast + Tidings
        const msg = lang === 'en'
            ? `😴 Nona rest complete. Fatigue −20. Vigor: ${vigorBefore}% → ${vigorAfter}%.`
            : `😴 Odpočinek při Nóně dokončen. Únava −20. Vigor: ${vigorBefore}% → ${vigorAfter}%.`;
        if (typeof UI !== 'undefined') {
            if (UI.notify) UI.notify(msg);
            if (UI.notifyPanel) UI.notifyPanel(msg, 'system');
        }
        this.renderPill();
        if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    MEDITATE_DURATION: 180000,  // 3 min v ms
    NONA_DURATION:     60000,   // 60s v ms

    meditate: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const meta = GameState.vigorMeta;
        if (!meta) return;

        const now = Date.now();
        const cooldown = 12 * 3600000;
        const elapsed = now - (meta.meditateUsed || 0);

        if (elapsed < cooldown) {
            const remainH = Math.ceil((cooldown - elapsed) / 3600000);
            const msg = lang === 'en'
                ? `🧘 Meditation available in ~${remainH}h.`
                : `🧘 Meditace dostupná za ~${remainH}h.`;
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(msg, true);
            return;
        }
        if (meta.meditateStart > 0) {
            if (typeof UI !== 'undefined' && UI.notify)
                UI.notify(lang === 'en' ? '🧘 Already meditating...' : '🧘 Již meditujete...', true);
            return;
        }
        if ((meta.nonaStart || 0) > 0) {
            if (typeof UI !== 'undefined' && UI.notify)
                UI.notify(lang === 'en' ? '😴 Complete rest first.' : '😴 Nejprve dokonči odpočinek.', true);
            return;
        }

        // Spustit timer + zobrazit overlay
        meta.meditateStart = now;
        this._openMeditationOverlay();
        this.renderPill();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // ── Mandala overlay ───────────────────────────────────────────────────────
    _openMeditationOverlay: function() {
        if (document.getElementById('vigor-meditation-overlay')) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const dur  = this.MEDITATE_DURATION / 1000; // 180s
        const overlay = document.createElement('div');
        overlay.id = 'vigor-meditation-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(5,4,20,0.92);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div id="vigor-meditate-mandala" style="width:280px;height:280px;position:relative;">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
                    <rect width="200" height="200" fill="#040410"/>

                    <!-- Progress ring: r=94, obvod=591 — plní se přes ${dur}s -->
                    <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(197,160,89,0.12)" stroke-width="1.5"/>
                    <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(197,160,89,0.85)" stroke-width="2.5"
                        stroke-dasharray="591" stroke-dashoffset="591" stroke-linecap="round"
                        transform="rotate(-90 100 100)">
                        <animate attributeName="stroke-dashoffset" from="591" to="0" dur="${dur}s" fill="freeze"/>
                    </circle>

                    <!-- L1: Hexagram (2s → 42s) -->
                    <polygon points="100,14 183,57 183,143 100,186 17,143 17,57"
                        fill="none" stroke="rgba(201,168,76,.65)" stroke-width="1"
                        stroke-dasharray="520" stroke-dashoffset="520">
                        <animate attributeName="stroke-dashoffset" from="520" to="0" dur="40s" begin="2s" fill="freeze"/>
                    </polygon>
                    <polygon points="100,186 183,143 17,143" fill="none" stroke="rgba(201,168,76,.38)" stroke-width=".8"
                        stroke-dasharray="340" stroke-dashoffset="340">
                        <animate attributeName="stroke-dashoffset" from="340" to="0" dur="20s" begin="22s" fill="freeze"/>
                    </polygon>
                    <polygon points="100,14 183,57 17,57" fill="none" stroke="rgba(201,168,76,.38)" stroke-width=".8"
                        stroke-dasharray="340" stroke-dashoffset="340">
                        <animate attributeName="stroke-dashoffset" from="340" to="0" dur="20s" begin="32s" fill="freeze"/>
                    </polygon>

                    <!-- L2: Pentagon (55s → 95s) -->
                    <polygon points="100,22 170,74 144,156 56,156 30,74"
                        fill="none" stroke="rgba(139,111,255,.6)" stroke-width=".9"
                        stroke-dasharray="440" stroke-dashoffset="440">
                        <animate attributeName="stroke-dashoffset" from="440" to="0" dur="40s" begin="55s" fill="freeze"/>
                    </polygon>

                    <!-- Pentagram lines (80s → 140s, 12s každá) -->
                    <line x1="100" y1="22"  x2="144" y2="156" stroke="rgba(139,111,255,.38)" stroke-width=".7" stroke-dasharray="145" stroke-dashoffset="145">
                        <animate attributeName="stroke-dashoffset" from="145" to="0" dur="12s" begin="80s" fill="freeze"/>
                    </line>
                    <line x1="100" y1="22"  x2="56"  y2="156" stroke="rgba(139,111,255,.38)" stroke-width=".7" stroke-dasharray="145" stroke-dashoffset="145">
                        <animate attributeName="stroke-dashoffset" from="145" to="0" dur="12s" begin="92s" fill="freeze"/>
                    </line>
                    <line x1="170" y1="74"  x2="56"  y2="156" stroke="rgba(139,111,255,.38)" stroke-width=".7" stroke-dasharray="145" stroke-dashoffset="145">
                        <animate attributeName="stroke-dashoffset" from="145" to="0" dur="12s" begin="104s" fill="freeze"/>
                    </line>
                    <line x1="170" y1="74"  x2="30"  y2="74"  stroke="rgba(139,111,255,.38)" stroke-width=".7" stroke-dasharray="145" stroke-dashoffset="145">
                        <animate attributeName="stroke-dashoffset" from="145" to="0" dur="12s" begin="116s" fill="freeze"/>
                    </line>
                    <line x1="144" y1="156" x2="30"  y2="74"  stroke="rgba(139,111,255,.38)" stroke-width=".7" stroke-dasharray="145" stroke-dashoffset="145">
                        <animate attributeName="stroke-dashoffset" from="145" to="0" dur="12s" begin="128s" fill="freeze"/>
                    </line>

                    <!-- L3: Vnitřní kruhy (120s, 140s) -->
                    <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(201,168,76,.35)" stroke-width=".7"
                        stroke-dasharray="252" stroke-dashoffset="252">
                        <animate attributeName="stroke-dashoffset" from="252" to="0" dur="22s" begin="120s" fill="freeze"/>
                    </circle>
                    <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(139,111,255,.45)" stroke-width=".7"
                        stroke-dasharray="126" stroke-dashoffset="126">
                        <animate attributeName="stroke-dashoffset" from="126" to="0" dur="18s" begin="140s" fill="freeze"/>
                    </circle>

                    <!-- Rotující body na kardinálních osách (60s, 30s otáčení) -->
                    <g opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="4s" begin="60s" fill="freeze"/>
                        <g>
                            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="30s" begin="60s" repeatCount="indefinite"/>
                            <circle cx="100" cy="8"   r="3"   fill="rgba(201,168,76,.7)"/>
                            <circle cx="192" cy="100" r="2.5" fill="rgba(139,111,255,.6)"/>
                            <circle cx="100" cy="192" r="3"   fill="rgba(201,168,76,.7)"/>
                            <circle cx="8"   cy="100" r="2.5" fill="rgba(139,111,255,.6)"/>
                        </g>
                    </g>

                    <!-- Planetární glyfé — 5 planet, různé orbity, nástup od 40s -->
                    <!-- ☉ Slunce — orbit r=62, nástup 40s, rychlost 55s -->
                    <g opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="5s" begin="40s" fill="freeze"/>
                        <g>
                            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="55s" begin="40s" repeatCount="indefinite"/>
                            <g transform="translate(100,38)">
                                <circle r="7" fill="rgba(8,8,20,.9)" stroke="rgba(201,168,76,.8)" stroke-width=".9"/>
                                <text font-size="8" fill="rgba(201,168,76,.95)" text-anchor="middle" dominant-baseline="central" font-family="serif">☉</text>
                            </g>
                        </g>
                    </g>
                    <!-- ☽ Měsíc — orbit r=52 (vnitřní), nástup 48s, rychlost 42s -->
                    <g opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="5s" begin="48s" fill="freeze"/>
                        <g>
                            <animateTransform attributeName="transform" type="rotate" from="72 100 100" to="432 100 100" dur="42s" begin="48s" repeatCount="indefinite"/>
                            <g transform="translate(100,48)">
                                <circle r="6.5" fill="rgba(8,8,20,.9)" stroke="rgba(139,111,255,.85)" stroke-width=".9"/>
                                <text font-size="8" fill="rgba(139,111,255,.95)" text-anchor="middle" dominant-baseline="central" font-family="serif">☽</text>
                            </g>
                        </g>
                    </g>
                    <!-- ☿ Merkur — orbit r=70 (vnější), nástup 56s, rychlost 68s -->
                    <g opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="5s" begin="56s" fill="freeze"/>
                        <g>
                            <animateTransform attributeName="transform" type="rotate" from="144 100 100" to="504 100 100" dur="68s" begin="56s" repeatCount="indefinite"/>
                            <g transform="translate(100,30)">
                                <circle r="6" fill="rgba(8,8,20,.9)" stroke="rgba(69,162,158,.85)" stroke-width=".9"/>
                                <text font-size="8" fill="rgba(69,162,158,.95)" text-anchor="middle" dominant-baseline="central" font-family="serif">☿</text>
                            </g>
                        </g>
                    </g>
                    <!-- ♄ Saturn — orbit r=57 (střední), nástup 64s, rychlost 80s -->
                    <g opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="5s" begin="64s" fill="freeze"/>
                        <g>
                            <animateTransform attributeName="transform" type="rotate" from="216 100 100" to="576 100 100" dur="80s" begin="64s" repeatCount="indefinite"/>
                            <g transform="translate(100,43)">
                                <circle r="6.5" fill="rgba(8,8,20,.9)" stroke="rgba(197,160,89,.9)" stroke-width=".9"/>
                                <text font-size="8" fill="rgba(197,160,89,.95)" text-anchor="middle" dominant-baseline="central" font-family="serif">♄</text>
                            </g>
                        </g>
                    </g>
                    <!-- ♃ Jupiter — orbit r=65 (vnější střední), nástup 72s, rychlost 72s -->
                    <g opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="5s" begin="72s" fill="freeze"/>
                        <g>
                            <animateTransform attributeName="transform" type="rotate" from="288 100 100" to="648 100 100" dur="72s" begin="72s" repeatCount="indefinite"/>
                            <g transform="translate(100,35)">
                                <circle r="7" fill="rgba(8,8,20,.9)" stroke="rgba(220,130,80,.85)" stroke-width=".9"/>
                                <text font-size="8" fill="rgba(220,130,80,.95)" text-anchor="middle" dominant-baseline="central" font-family="serif">♃</text>
                            </g>
                        </g>
                    </g>

                    <!-- Střed (155s) -->
                    <circle cx="100" cy="100" r="5" fill="rgba(139,111,255,.9)" opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="5s" begin="155s" fill="freeze"/>
                    </circle>
                    <circle cx="100" cy="100" r="2.5" fill="#040408" opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="5s" begin="155s" fill="freeze"/>
                    </circle>
                    <circle cx="103" cy="97" r="1.2" fill="rgba(255,255,255,.7)" opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="5s" begin="155s" fill="freeze"/>
                    </circle>
                </svg>
            </div>
            <div id="vigor-meditate-timer" style="color:#c5a059;font-family:serif;font-size:2rem;margin-top:16px;letter-spacing:4px;">3:00</div>
            <div style="color:#7F77DD;font-family:serif;font-size:0.75rem;letter-spacing:3px;margin-top:8px;opacity:0.8;">LECTIO ET MEDITATIO</div>
            <div id="vigor-meditate-gain" style="display:none;text-align:center;margin-top:12px;padding:10px 20px;border:1px solid rgba(175,169,236,0.25);border-radius:8px;background:rgba(83,74,183,0.1);"></div>
            <div style="max-width:300px;margin-top:20px;text-align:center;line-height:1.8;border-top:1px solid rgba(197,160,89,0.15);padding-top:16px;">
                <div style="color:rgba(197,160,89,0.5);font-size:0.6rem;letter-spacing:2px;margin-bottom:10px;">✦ NOTE BY ONDREX ✦</div>
                <div style="color:#c5a059;font-family:serif;font-size:0.85rem;font-style:italic;opacity:0.9;">
                    Tak odlož stroj a dívej se ven, do zahrady duše či světa. Uvolni mysl a oči.
                </div>
                <div style="color:#AFA9EC;font-family:serif;font-size:0.78rem;font-style:italic;margin-top:8px;opacity:0.7;">
                    Set down the machine and look outward, into the garden of the soul or of the world. Free your mind and eyes.
                </div>
                <div style="color:#7F77DD;font-family:serif;font-size:0.72rem;font-style:italic;margin-top:8px;opacity:0.55;">
                    Pone machinam et intuere, in hortum animae vel mundi. Libera mentem et oculos.
                </div>
            </div>
            <button id="vigor-meditate-btn" onclick="VigorSystem.cancelMeditation()" style="margin-top:20px;background:transparent;border:1px solid rgba(197,160,89,0.2);color:rgba(197,160,89,0.45);padding:6px 20px;border-radius:6px;cursor:pointer;font-size:0.68rem;font-style:italic;">
                ${lang === 'en' ? 'Interrupt meditation (no effect)' : 'Přerušit meditaci (efekt se ztratí)'}
            </button>
        `;
        document.body.appendChild(overlay);
        // Timer tick — každou sekundu
        this._meditateInterval = setInterval(() => {
            const meta = GameState.vigorMeta;
            if (!meta) { clearInterval(this._meditateInterval); return; }
            // Dokončeno externě (_tick) — jen zavři interval
            if (meta.meditateStart === 0) { clearInterval(this._meditateInterval); this._meditateInterval = null; return; }
            const remaining = Math.max(0, this.MEDITATE_DURATION - (Date.now() - meta.meditateStart));
            if (remaining === 0) {
                clearInterval(this._meditateInterval);
                this._meditateInterval = null;
                VigorSystem._completeMeditation();
                return;
            }
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            const timerEl = document.getElementById('vigor-meditate-timer');
            if (timerEl) timerEl.textContent = m + ':' + String(s).padStart(2, '0');
        }, 1000);
    },

    // ── Dokončení meditace — efekt + overlay update ───────────────────────────
    _completeMeditation: function() {
        const meta = GameState.vigorMeta;
        if (!meta) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Aplikuj efekt
        const vigorBefore = this.getVigor();
        GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - 50);
        meta.meditateStart = 0;
        meta.meditateUsed = Date.now();
        const vigorAfter = this.getVigor();

        // Timer → ✓
        const timerEl = document.getElementById('vigor-meditate-timer');
        if (timerEl) {
            timerEl.textContent = lang === 'en' ? '✓ Complete' : '✓ Dokončeno';
            timerEl.style.fontSize = '1.3rem';
            timerEl.style.color = '#AFA9EC';
            timerEl.style.letterSpacing = '3px';
        }

        // Gain info
        const gainEl = document.getElementById('vigor-meditate-gain');
        if (gainEl) {
            gainEl.style.display = 'block';
            gainEl.innerHTML = `
                <div style="color:#c5a059;font-size:1rem;margin-bottom:4px;">⚡ Vigor: ${vigorBefore}% → <strong style="color:#AFA9EC;">${vigorAfter}%</strong></div>
                <div style="color:#7F77DD;font-size:0.72rem;opacity:0.8;">${lang === 'en' ? '💤 Fatigue −50' : '💤 Únava −50'}</div>
            `;
        }

        // Tlačítko → Zavřít
        const btnEl = document.getElementById('vigor-meditate-btn');
        if (btnEl) {
            btnEl.textContent = lang === 'en' ? 'Close ✓' : 'Zavřít ✓';
            btnEl.style.borderColor = 'rgba(175,169,236,0.5)';
            btnEl.style.color = '#AFA9EC';
            btnEl.style.fontStyle = 'normal';
            btnEl.onclick = function() { VigorSystem._closeMeditationOverlay(); PersonaSystem && PersonaSystem.render(); };
        }

        // Notify
        const msg = lang === 'en'
            ? `🧘 Lectio et meditatio complete. Fatigue −50. Vigor: ${vigorAfter}%.`
            : `🧘 Lectio et meditatio dokončena. Únava −50. Vigor: ${vigorAfter}%.`;
        if (typeof UI !== 'undefined') {
            if (UI.notify) UI.notify(msg);
            if (UI.notifyPanel) UI.notifyPanel(msg, 'system');
        }
        if (typeof PersonaSystem !== 'undefined') PersonaSystem.render();
        this.renderPill();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    _closeMeditationOverlay: function() {
        if (this._meditateInterval) { clearInterval(this._meditateInterval); this._meditateInterval = null; }
        const overlay = document.getElementById('vigor-meditation-overlay');
        if (overlay) overlay.remove();
    },

    cancelMeditation: function() {
        if (!GameState.vigorMeta) return;
        GameState.vigorMeta.meditateStart = 0;
        this._closeMeditationOverlay();
        this.renderPill();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // ── Audio stub pro budoucí meditační melodii ──────────────────────────────
    startMeditationAudio: function() { /* placeholder — implementovat v audio.js */ },
    stopMeditationAudio:  function() { /* placeholder — implementovat v audio.js */ },


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

        // Organický trigger pro Athanor Tier I (MRD: athanor-tiers)
        if (typeof SecretsSystem !== 'undefined' && SecretsSystem.checkOrganicAthanorUnlock) {
            SecretsSystem.checkOrganicAthanorUnlock();
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

        // Titivillus varování (folio_titivillus odměna, GameState.flags.titivillus_awareness) —
        // trvale viditelný indikátor, když jsou podmínky pro krádež výstupu nebezpečné
        // (noc + bez světla) — přesně stejná podmínka jako v Game.craftItem Titivillus checku.
        const titivillusWarn = document.getElementById('pill-titivillus-warn');
        if (titivillusWarn) {
            const hasAwareness = GameState.flags && GameState.flags.titivillus_awareness;
            const isNight = typeof TimeSys !== 'undefined' && !TimeSys.isDaytime();
            const noLight = GameState.flags && !GameState.flags.candleLit && !GameState.flags.torchLit;
            const isDanger = hasAwareness && isNight && noLight;
            titivillusWarn.style.display = isDanger ? 'inline' : 'none';
            if (isDanger) {
                titivillusWarn.title = lang === 'en'
                    ? 'Titivillus lurks in the dark — light a candle before writing.'
                    : 'Titivillus číhá ve tmě — zapal svíci, než se pustíš do psaní.';
            }
        }

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
        const meta12 = GameState.vigorMeta || {};
        const nonaAvail = !meta12.nonaUsed || meta12.nonaUsed !== today;
        const nonaActive = (meta12.nonaStart || 0) > 0;
        const nonaRemainS = nonaActive ? Math.max(0, Math.ceil((60000 - (Date.now() - meta12.nonaStart)) / 1000)) : 0;
        const nonaUsedToday = meta12.nonaUsed === today && !nonaActive;
        const nonaBtn = nonaActive
            ? `<div style="margin-top:8px;font-size:0.7rem;color:var(--accent-gold);opacity:0.8;">😴 ${lang === 'en' ? `Resting... ${nonaRemainS}s` : `Odpočíváš... ${nonaRemainS}s`}<div style="height:3px;background:rgba(197,160,89,0.15);border-radius:2px;margin-top:4px;"><div style="height:3px;background:var(--accent-gold);border-radius:2px;width:${Math.round((1-nonaRemainS/60)*100)}%;transition:width 1s;"></div></div></div>`
            : nonaUsedToday
            ? `<div style="font-size:0.7rem;opacity:0.5;margin-top:6px;">${lang === 'en' ? 'Nona rest used today.' : 'Dnes již odpočinut.'}</div>`
            : `<button onclick="VigorSystem.restNona()" style="margin-top:8px;width:100%;padding:4px 8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.75rem;">
                😴 ${lang === 'en' ? 'Nona rest (-20 Fatigue, 1×/day)' : 'Odpočinek při Nóně (-20 Únava, 1×/den)'}
               </button>`;

        const now12 = Date.now();
        const meditCooldown = 12 * 3600000;
        const meditElapsed = now12 - (meta12.meditateUsed || 0);
        const meditAvail = meditElapsed >= meditCooldown;
        const meditActive = (meta12.meditateStart || 0) > 0;
        const meditRemainH = meditAvail ? 0 : Math.ceil((meditCooldown - meditElapsed) / 3600000);
        const meditBtn = meditActive
            ? `<div style="margin-top:6px;font-size:0.7rem;color:var(--accent-gold);opacity:0.8;">🧘 ${lang === 'en' ? 'Meditating...' : 'Meditace probíhá...'}</div>`
            : meditAvail
            ? `<button onclick="VigorSystem.meditate()" style="margin-top:6px;width:100%;padding:4px 8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.75rem;">
                🧘 ${lang === 'en' ? 'Meditate (-50 Fatigue, 1×/12h)' : 'Meditace (-50 Únava, 1×/12h)'}
               </button>`
            : `<div style="font-size:0.7rem;opacity:0.5;margin-top:4px;">🧘 ${lang === 'en' ? `Meditation in ~${meditRemainH}h` : `Meditace za ~${meditRemainH}h`}</div>`;

        const activeHealthIds = (GameState.health && GameState.health.active) ? Object.keys(GameState.health.active) : [];
        const healthText = activeHealthIds.length === 0
            ? (lang === 'en' ? 'Healthy' : 'Zdráv/a')
            : activeHealthIds.map(id => (HealthConditionsDB[id] ? (lang === 'en' ? HealthConditionsDB[id].name_en : HealthConditionsDB[id].name) : id)).join(', ');
        const healthColor = activeHealthIds.length === 0 ? 'var(--accent-gold)' : '#c0392b';

        panel.innerHTML = `
            <div class="pp-row">
                <span class="pp-label">🍎 ${lang === 'en' ? 'Satiety' : 'Sytost'}</span>
                <span class="pp-val">${satiety}/100</span>
            </div>
            <div class="pp-row">
                <span class="pp-label">💤 ${lang === 'en' ? 'Fatigue' : 'Únava'}</span>
                <span class="pp-val">${fatigue}/100</span>
            </div>
            <div class="pp-row">
                <span class="pp-label">🩺 ${lang === 'en' ? 'Health' : 'Zdraví'}</span>
                <span class="pp-val" style="color:${healthColor};">${healthText}</span>
            </div>
            <div class="pp-row" style="border-top:1px solid rgba(197,160,89,0.2);margin-top:4px;padding-top:4px;">
                <span class="pp-label">⚡ Vigor</span>
                <span class="pp-val" style="color:${vigor >= 25 ? 'var(--accent-gold)' : vigor >= 10 ? '#e67e22' : '#c0392b'};">${vigor}%</span>
            </div>
            <div style="font-size:0.7rem;opacity:0.6;margin-top:4px;">${recovText}</div>
            ${nonaBtn}
            ${meditBtn}
            <div style="border-top:1px solid rgba(197,160,89,0.15);margin-top:8px;padding-top:6px;font-size:0.7rem;opacity:0.65;display:flex;justify-content:space-between;">
                <span>${(typeof RankSystem !== 'undefined' && GameState.rank) ? (RankSystem.getCurrentSecularRank().icon + ' ' + RankSystem.getRankNameShort(GameState.rank.secular)) : '–'}</span>
                <span style="font-style:italic;">${GameState.persona && GameState.persona.role ? '⚒️ ' + GameState.persona.role : (lang === 'en' ? 'no role' : 'bez role')}</span>
            </div>
        `;
    },

    // ── Legacy kompatibilita ─────────────────────────────────────────────────
    renderMiniDisplay: function() {
        this.renderPill();
    },

    // Po akcích z Vigor bloku obnov pohledy, kde se zobrazuje (Persona i Foculus dashboard).
    refreshViews: function() {
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.render) PersonaSystem.render();
        if (typeof FireplaceSystem !== 'undefined' && FireplaceSystem.render) FireplaceSystem.render();
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
        const metaFd = GameState.vigorMeta || {};
        const nonaActiveFd = (metaFd.nonaStart || 0) > 0;
        const nonaRemainSFd = nonaActiveFd ? Math.max(0, Math.ceil((60000 - (Date.now() - metaFd.nonaStart)) / 1000)) : 0;
        const nonaUsedTodayFd = metaFd.nonaUsed === today && !nonaActiveFd;
        const nonaBtn = nonaActiveFd
            ? `<div id="vigor-nona-status" style="margin-top:8px;font-size:0.7rem;color:var(--accent-gold);opacity:0.8;">😴 ${lang === 'en' ? `Resting... ${nonaRemainSFd}s` : `Odpočíváš... ${nonaRemainSFd}s`}<div style="height:3px;background:rgba(197,160,89,0.15);border-radius:2px;margin-top:4px;"><div style="height:3px;background:var(--accent-gold);border-radius:2px;width:${Math.round((1-nonaRemainSFd/60)*100)}%;"></div></div></div>`
            : nonaUsedTodayFd
            ? `<div style="font-size:0.7rem;opacity:0.5;margin-top:6px;">${lang === 'en' ? 'Nona rest used today.' : 'Dnes již odpočinut.'}</div>`
            : `<button onclick="VigorSystem.restNona();VigorSystem.refreshViews();" style="margin-top:8px;width:100%;padding:4px 8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.75rem;">
                😴 ${lang === 'en' ? 'Nona rest (-20 Fatigue, 1×/day)' : 'Odpočinek při Nóně (-20 Únava, 1×/den)'}
               </button>`;

        const now12fd = Date.now();
        const meditCooldownFd = 12 * 3600000;
        const meditElapsedFd = now12fd - (metaFd.meditateUsed || 0);
        const meditAvailFd = meditElapsedFd >= meditCooldownFd;
        const meditActiveFd = (metaFd.meditateStart || 0) > 0;
        const meditRemainHFd = meditAvailFd ? 0 : Math.ceil((meditCooldownFd - meditElapsedFd) / 3600000);
        const meditBtnFd = meditActiveFd
            ? `<div style="margin-top:6px;font-size:0.7rem;color:var(--accent-gold);opacity:0.8;">🧘 ${lang === 'en' ? 'Meditating...' : 'Meditace probíhá...'}</div>`
            : meditAvailFd
            ? `<button onclick="VigorSystem.meditate();VigorSystem.refreshViews();" style="margin-top:6px;width:100%;padding:4px 8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.75rem;">
                🧘 ${lang === 'en' ? 'Meditate (-50 Fatigue, 1×/12h)' : 'Meditace (-50 Únava, 1×/12h)'}
               </button>`
            : `<div style="font-size:0.7rem;opacity:0.5;margin-top:4px;">🧘 ${lang === 'en' ? `Meditation in ~${meditRemainHFd}h` : `Meditace za ~${meditRemainHFd}h`}</div>`;

        // Jídlo & pití z inventáře
        const FOOD_ITEMS = ['bread','berry_pie','stew','cooked_fish','cooked_meat','porridge',
                            'cheese','egg','honey','berries','mushroom',
                            'herbal_tea','hildegard_tisane','linden_tea','chicory_drink','acorn_brew',
                            'beer','wine','spring_water',
                            ...VigorSystem.RAW_EDIBLE_FOOD];
        const DRINK_ITEMS = ['water','spring_water','holy_water'];

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
                        return `<button style="${btnStyle}" onclick="Game.eat('${id}');VigorSystem.refreshViews();">
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
                        return `<button style="${btnStyle}" onclick="${fn};VigorSystem.refreshViews();">
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
