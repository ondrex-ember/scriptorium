// ═══════════════════════════════════════════════════════════════════════════
// FIREPLACE SYSTEM — Teplo domova
// Krb sám (ignite/dead/lit) je odemčen od začátku — beze změny.
// FireplaceSystem rozšiřuje správu o palivo (fuel panel), gated tech_meteorologica.
// Subtab: Pracovna → FOCULUS (home-foculus-content)
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────
// FireAnimationSystem — animovaný krb (sprite sheet hearth_animated.png)
// 5 fuel úrovní × 14 framů plápolání = 70 framů, každý 351×374
// ───────────────────────────────────────────────────────────────────────────
const FireAnimationSystem = {
    SHEET: '/img/hearth_animated.png',
    FRAME_W: 351,
    FRAME_H: 374,
    FRAMES_PER_LEVEL: 14,
    LEVELS: 5,
    FPS: 9,

    _timer: null,
    _curLevel: -1,
    _frame: 0,

    // pct (0..1) → index úrovně 0..4 (0 = plný, 4 = jiskra)
    _levelFromPct: function(pct) {
        if (pct > 0.80) return 0;
        if (pct > 0.60) return 1;
        if (pct > 0.40) return 2;
        if (pct > 0.20) return 3;
        return 4;
    },

    // elId = div element; active = krb hoří; fuelMs/maxMs = palivo
    render: function(elId, fuelMs, maxMs, active) {
        const el = document.getElementById(elId);
        if (!el) return;

        if (!active || fuelMs <= 0) {
            // krb nehoří → statický dead obrázek
            this._stop();
            el.style.backgroundImage = "url('/img/hearth_base_dead.png')";
            el.style.backgroundSize = '100% 100%';
            el.style.backgroundPosition = '0 0';
            return;
        }

        const pct = Math.max(0, Math.min(1, fuelMs / maxMs));
        const level = this._levelFromPct(pct);

        el.style.backgroundImage = `url('${this.SHEET}')`;
        el.style.backgroundRepeat = 'no-repeat';
        // sheet je LEVELS*FRAMES_PER_LEVEL framů široký; element ukazuje 1 frame
        const totalFrames = this.LEVELS * this.FRAMES_PER_LEVEL;
        el.style.backgroundSize = (totalFrames * 100) + '% 100%';

        if (level !== this._curLevel) {
            this._curLevel = level;
            this._frame = 0;
        }
        this._startLoop(el, level);
    },

    _startLoop: function(el, level) {
        if (this._timer) return; // už běží — level se aktualizuje v render()
        const totalFrames = this.LEVELS * this.FRAMES_PER_LEVEL;
        const tick = () => {
            const frameIndex = this._curLevel * this.FRAMES_PER_LEVEL + (this._frame % this.FRAMES_PER_LEVEL);
            // background-position v procentech: frame i z totalFrames
            const pctX = (frameIndex / (totalFrames - 1)) * 100;
            el.style.backgroundPosition = pctX + '% 0%';
            this._frame++;
            this._timer = setTimeout(tick, 1000 / this.FPS);
        };
        tick();
    },

    _stop: function() {
        if (this._timer) { clearTimeout(this._timer); this._timer = null; }
        this._curLevel = -1;
        this._frame = 0;
    }
};

const FireplaceSystem = {
    MAX_FUEL_MS: 24 * 60 * 60 * 1000, // Maximální kapacita krbu: 24 hodin

    // Kolik času přidá dané palivo
    FUEL_VALUES: {
        'stick': 1 * 60 * 60 * 1000,   // Větev: +1 hodina
        'log': 4 * 60 * 60 * 1000,     // Poleno: +4 hodiny
        'charcoal': 8 * 60 * 60 * 1000 // Dřevěné uhlí: +8 hodin
    },

    // ── Čajový rituál (Foculus) ──────────────────────────────────────────
    TEA_BREW_MS: 43 * 1000, // 43 s reálného času
    // Priorita bylin → výsledný čaj (mata nemá recept, vynechána)
    TEA_HERBS: [
        { herb: 'chamomile',     tea: 'herbal_tea' },
        { herb: 'thyme',         tea: 'herbal_tea' },
        { herb: 'linden_blossom', tea: 'linden_tea' }
    ],
    _teaInterval: null,

    // ── Kávovinový rituál (Foculus) — žaludovka/cikorka, odděleně od čaje ──
    COFFEE_BREW_MS: 43 * 1000, // 43 s reálného času — stejně jako čaj
    // Priorita pražených surovin → výsledná kávovina
    COFFEE_HERBS: [
        { herb: 'acorn_roasted',   tea: 'acorn_brew' },
        { herb: 'chicory_roasted', tea: 'chicory_drink' }
    ],
    _coffeeInterval: null,

    hasMeteorologica: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_meteorologica'));
    },

    _ensureState: function() {
        if (!GameState.fire) {
            GameState.fire = {
                active: GameState.flags.fireplaceLit || false,
                fuelMs: GameState.flags.fireplaceLit ? (6 * 60 * 60 * 1000) : 0, // Pro staré savy: dostanou 6h do začátku
                lastUpdate: Date.now(),
                lastSweep: 0
            };
        }
        if (GameState.fire.lastSweep === undefined) GameState.fire.lastSweep = 0;
    },

    addFuel: function(itemId) {
        this._ensureState();
        if (!GameState.fire.active) return;

        const fuelAmount = this.FUEL_VALUES[itemId];
        if (!fuelAmount) return;

        if ((GameState.inventory[itemId] || 0) < 1) {
            const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
            UI.notify(t('fireplace.notEnough').replace('{item}', itemName), true);
            return;
        }

        if (GameState.fire.fuelMs + fuelAmount > this.MAX_FUEL_MS) {
            UI.notify(t('fireplace.full'), true);
            return;
        }

        Game.removeItem(itemId, 1);
        GameState.fire.fuelMs += fuelAmount;
        Game.save();
        this.render();

        UI.notify(t('fireplace.fuelAdded'));
    },

    tick: function() {
        this._ensureState();
        if (!GameState.fire.active) return;

        const now = Date.now();
        const delta = now - GameState.fire.lastUpdate; // Započítá i čas, kdy byl hráč offline!
        GameState.fire.lastUpdate = now;

        GameState.fire.fuelMs -= delta;

        if (GameState.fire.fuelMs <= 0) {
            this.dieOut();
        } else {
            this.render();
        }
    },

    dieOut: function() {
        GameState.fire.active = false;
        GameState.fire.fuelMs = 0;
        GameState.flags.fireplaceLit = false;
        GameState.flags.candleLit = false;
        GameState.flags.torchLit = false;

        if ((GameState.inventory['tinderbox'] || 0) <= 0) {
            GameState.inventory['tinderbox'] = 1;
        }

        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.panel(t('fireplace.diedOut'), 'warning');
        }

        Game.save();
        if (typeof Game.checkEnvironment === 'function') Game.checkEnvironment();
        this.render();
    },

    // Slovní vyjádření času do vyhasnutí (palivo běží v reálném čase).
    // MAX palivo = 24h → výsledek je vždy "dnes" nebo "zítra" + denní doba.
    _wordedBurnout: function(fuelMs) {
        if (fuelMs <= 0) return t('fireplace.burnNow');
        if (fuelMs < 30 * 60 * 1000) return t('fireplace.burnSoon');

        const now = new Date();
        const burnAt = new Date(now.getTime() + fuelMs);

        const h = burnAt.getHours();
        let partKey;
        if (h >= 5 && h < 11) partKey = 'fireplace.partMorning';
        else if (h >= 11 && h < 17) partKey = 'fireplace.partAfternoon';
        else if (h >= 17 && h < 22) partKey = 'fireplace.partEvening';
        else partKey = 'fireplace.partNight';

        const sameDay = burnAt.getDate() === now.getDate()
            && burnAt.getMonth() === now.getMonth()
            && burnAt.getFullYear() === now.getFullYear();

        const tmpl = sameDay ? 'fireplace.burnToday' : 'fireplace.burnTomorrow';
        return t(tmpl).replace('{part}', t(partKey));
    },

    // Centrální dashboard pod fuel panelem — stack section-karet, čte existující systémy (render-only).
    _renderDashboard: function() {
        const ds = (typeof DecaySystem !== 'undefined') ? DecaySystem : null;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const card = `background:rgba(0,0,0,0.05);padding:16px;border-radius:10px;border-left:3px solid var(--accent-gold);margin-bottom:12px;`;
        const row = `display:flex;justify-content:space-between;margin-bottom:6px;`;
        let h = '';

        // ── Sekce Vigor (sytost/únava/vigor + Nona + Meditace + jíst/pít) ──
        if (typeof VigorSystem !== 'undefined' && VigorSystem.renderFullDisplay) {
            h += VigorSystem.renderFullDisplay();
        }

        // ── Sekce Valetudo (rychlý přehled aktivních neduhů, jen když nějaké jsou) ──
        const activeHealth = (GameState.health && GameState.health.active) || {};
        const healthIds = Object.keys(activeHealth);
        if (healthIds.length > 0 && typeof HealthConditionsDB !== 'undefined') {
            const icons = healthIds.map(id => (HealthConditionsDB[id] ? HealthConditionsDB[id].icon : '')).join(' ');
            h += `<div style="${card}"><div style="${row}; margin-bottom:0;">
                <span>${icons} ${lang==='en' ? `${healthIds.length} active ailment(s)` : `${healthIds.length} aktivní neduh(y)`}</span>
                <span style="opacity:0.6; font-size:0.85rem;">→ Persona</span>
            </div></div>`;
        }

        // ── Sekce Stav (zápisky / groše / rank / techy / poslední kronika) ──
        let stav = `<div style="${card}"><h4 style="margin:0 0 10px 0;color:var(--ink-primary);">📊 ${t('fireplace.dashStav')}</h4>`;
        const notes = (GameState.inventory && GameState.inventory['research']) || 0;
        stav += `<div style="${row}"><span>📜 ${t('fireplace.dashNotes')}</span><strong>${notes}</strong></div>`;
        const grose = (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) ? CellariumSystem.getGrose() : ((GameState.treasury && GameState.treasury.grose) || 0);
        stav += `<div style="${row}"><span>🪙 ${t('fireplace.dashCoins')}</span><strong>${grose}</strong></div>`;
        if (typeof RankSystem !== 'undefined' && RankSystem.getCurrentSecularRank) {
            const rk = RankSystem.getCurrentSecularRank();
            stav += `<div style="${row}"><span>🎖️ ${t('fireplace.dashRank')}</span><strong>${rk.icon || ''} ${RankSystem.getRankNameShort(rk.id)}</strong></div>`;
        }
        const techDone = (GameState.researchedTechs || []).length;
        const techTotal = (typeof TechTree !== 'undefined') ? TechTree.length : 96;
        stav += `<div style="${row}"><span>🔬 ${t('fireplace.dashTech')}</span><strong>${techDone} / ${techTotal}</strong></div>`;
        const kron = (GameState.kronika && GameState.kronika.length) ? GameState.kronika[GameState.kronika.length - 1] : '';
        if (kron) {
            const kronTxt = (typeof kron === 'string') ? kron : (kron.text || kron.msg || '');
            if (kronTxt) stav += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(197,160,89,0.2);font-size:0.78rem;opacity:0.75;"><span style="opacity:0.55;">📖 ${t('fireplace.dashKronika')}:</span> ${kronTxt}</div>`;
        }
        stav += `</div>`;
        h += stav;

        // ── Sekce Čas & Kalendář (čas / datum / luna / hora + bonus) ──
        let cal = `<div style="${card}"><h4 style="margin:0 0 10px 0;color:var(--ink-primary);">🗓️ ${t('fireplace.dashTime')}</h4>`;
        if (typeof TimeSys !== 'undefined' && TimeSys.getPhase) {
            cal += `<div style="${row}"><span>🕐 ${t('fireplace.dashTimeLabel')}</span><strong>${TimeSys.getPhase()}</strong></div>`;
        }
        const now = new Date();
        if (typeof CalendarSystem !== 'undefined' && CalendarSystem.MONTHS_CS) {
            const mArr = lang === 'en' ? CalendarSystem.MONTHS_EN : CalendarSystem.MONTHS_CS;
            cal += `<div style="${row}"><span>📅 ${t('fireplace.dashDate')}</span><strong>${now.getDate()}. ${mArr[now.getMonth()]}</strong></div>`;
            if (CalendarSystem.getLunarForDay) {
                const moon = CalendarSystem.getLunarForDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
                if (moon) cal += `<div style="${row}"><span>🌙 ${t('fireplace.dashMoon')}</span><strong>${moon}</strong></div>`;
            }
        }
        if (GameState.researchedTechs && GameState.researchedTechs.includes('tech_canonical_hours')
            && typeof CanonicalHours !== 'undefined' && CanonicalHours.currentHour) {
            const ch = CanonicalHours.currentHour;
            let bonus = '';
            if (ch.buffValue && ch.buffValue > 1) bonus = ` <span style="color:var(--accent-gold);">+${Math.round((ch.buffValue - 1) * 100)}% ${ch.buff || ''}</span>`;
            cal += `<div style="${row}"><span>⛪ ${t('fireplace.dashHora')}</span><strong>${ch.icon || ''} ${ch.name || ''}${bonus}</strong></div>`;
        }
        cal += `</div>`;
        h += cal;

        // ── Sekce Prostředí (počasí + forecast + kočka + myši) ──
        let env = `<div style="${card}"><h4 style="margin:0 0 10px 0;color:var(--ink-primary);">🌿 ${t('fireplace.dashEnviron')}</h4>`;

        // Počasí teď
        let wtxt = t('fireplace.dashWeatherNA');
        if (typeof WeatherSystem !== 'undefined' && WeatherSystem.cache && WeatherSystem.cache.current) {
            const c = WeatherSystem.cache.current;
            wtxt = `${WeatherSystem.getWeatherEmoji(c.weather_code)} ${Math.round(c.temperature_2m)}°`;
        }
        env += `<div style="${row}"><span>🌡️ ${t('fireplace.dashWeather')}</span><strong>${wtxt}</strong></div>`;

        // Předpověď (dnes + další dny)
        if (typeof WeatherSystem !== 'undefined' && WeatherSystem.cache && WeatherSystem.cache.daily && WeatherSystem.getDailyIndex) {
            const d = WeatherSystem.cache.daily;
            const DAYS = lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
            let rows = '';
            for (let off = 0; off <= 4; off++) {
                const idx = WeatherSystem.getDailyIndex(off);
                if (!d.time || idx < 0 || idx >= d.time.length || d.temperature_2m_max[idx] == null) continue;
                const dt = new Date(d.time[idx] + 'T12:00:00');
                const label = off === 0 ? (lang === 'en' ? 'Today' : 'Dnes')
                    : off === 1 ? (lang === 'en' ? 'Tomorrow' : 'Zítra')
                    : DAYS[dt.getDay()];
                const emoji = WeatherSystem.getWeatherEmoji(d.weather_code[idx]);
                const tmax = Math.round(d.temperature_2m_max[idx]);
                const tmin = Math.round(d.temperature_2m_min[idx]);
                const ps = (d.precipitation_sum && d.precipitation_sum[idx] > 0.1) ? ` 💧${d.precipitation_sum[idx].toFixed(1)}` : '';
                rows += `<div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-top:3px;"><span style="opacity:0.8;">${label}</span><span>${emoji} ${tmax}°/${tmin}°${ps}</span></div>`;
            }
            if (rows) {
                env += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(197,160,89,0.2);font-size:0.7rem;opacity:0.55;text-transform:uppercase;letter-spacing:0.05em;">${t('fireplace.dashForecast')}</div>`;
                env += rows;
            }
        }

        // Kočka (gate tech_cura_felium)
        if (GameState.researchedTechs && GameState.researchedTechs.includes('tech_cura_felium')) {
            const cat = GameState.cat || {};
            const title = (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.getTitle) ? ScriptoriumCat.getTitle() : '';
            const state = (cat.satiety !== undefined && cat.satiety < 30) ? t('dvur.catHunting') : t('dvur.catFed');
            env += `<div style="${row}margin-top:8px;"><span>🐈‍⬛ ${cat.name || ''} <span style="opacity:0.6;">(${title})</span></span><span style="opacity:0.85;">${state}</span></div>`;
        }

        // Myši
        const miceTxt = ds ? ds.miceFuzzyShort()
            : (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.miceFuzzy ? ScriptoriumCat.miceFuzzy() : '');
        if (miceTxt) env += `<div style="display:flex;justify-content:space-between;"><span>🐭</span><span style="opacity:0.85;">${miceTxt}</span></div>`;

        // Mouchy (monastery-decay-mrd)
        const fliesTxt = ds && ds.fliesFuzzyShort ? ds.fliesFuzzyShort() : '';
        if (fliesTxt) env += `<div style="display:flex;justify-content:space-between;"><span>🪰</span><span style="opacity:0.85;">${fliesTxt}</span></div>`;

        env += `</div>`;
        h += env;

        return h;
    },

    // ── Čajový rituál: stavový automat idle → brewing(43s) → ready → idle ──
    _ensureTeaState: function() {
        if (!GameState.fire) this._ensureState();
        if (!GameState.fire.tea) GameState.fire.tea = { state: 'idle', start: 0, teaId: '' };
    },

    _teaHerb: function() {
        for (const e of this.TEA_HERBS) {
            if ((GameState.inventory[e.herb] || 0) > 0) return e;
        }
        return null;
    },

    // Dokončí vaření, pokud uplynul čas. Vrací true při dokončení.
    _checkTeaDone: function() {
        if (!GameState.fire || !GameState.fire.tea) return false;
        const tea = GameState.fire.tea;
        if (tea.state === 'brewing' && (Date.now() - tea.start) >= this.TEA_BREW_MS) {
            tea.state = 'ready';            // flip PŘED addItem — addItem re-rendruje a re-entrantně volá _checkTeaDone
            Game.addItem(tea.teaId || 'herbal_tea', 1);
            Game.save();
            return true;
        }
        return false;
    },

    _ensureTeaInterval: function() {
        if (this._teaInterval) return;
        if (!GameState.fire || !GameState.fire.tea || GameState.fire.tea.state !== 'brewing') return;
        this._teaInterval = setInterval(() => {
            if (!GameState.fire || !GameState.fire.tea || GameState.fire.tea.state !== 'brewing') {
                clearInterval(this._teaInterval); this._teaInterval = null; return;
            }
            const done = this._checkTeaDone();
            this.render();
            if (done) { clearInterval(this._teaInterval); this._teaInterval = null; }
        }, 1000);
    },

    brewTea: function() {
        this._ensureState(); this._ensureTeaState();
        const tea = GameState.fire.tea;
        if (tea.state !== 'idle') return;
        if ((GameState.inventory['tea_kettle'] || 0) <= 0) { UI.notify(t('fireplace.teaNeedKettle'), true); return; }
        if (!GameState.fire.active) { UI.notify(t('fireplace.teaNeedFire'), true); return; }
        const herb = this._teaHerb();
        if (!herb) { UI.notify(t('fireplace.teaNeedHerb'), true); return; }
        if ((GameState.inventory['water'] || 0) <= 0) { UI.notify(t('fireplace.teaNeedWater'), true); return; }

        Game.removeItem(herb.herb, 1);
        Game.removeItem('water', 1);
        GameState.fire.tea = { state: 'brewing', start: Date.now(), teaId: herb.tea };
        Game.save();
        this.render();
        this._ensureTeaInterval();
    },

    drinkTea: function() {
        this._ensureTeaState();
        const tea = GameState.fire.tea;
        if (tea.state !== 'ready') return;
        const teaId = tea.teaId || 'herbal_tea';
        GameState.fire.tea = { state: 'idle', start: 0, teaId: '' };
        if ((GameState.inventory[teaId] || 0) > 0 && typeof Game.eat === 'function') {
            Game.eat(teaId); // aplikuje efekt + odebere 1 + renderAll
        } else {
            Game.save();
        }
        this.render();
    },

    // ── Dýmka (Foculus) — pack/smoke, 3 náhodné efekty, rauš max 8 min ──────
    DYMKA_MS: 8 * 60 * 1000,

    PIPE_HERETICAL_THOUGHTS: [
        { cs: "Co když je nekvašená hostie urážkou Božího stvoření? Bůh by z ní udělal spíš teplý bochník s husím sádlem a medem.", en: "What if unleavened bread insults God's creation? He'd have made a warm loaf with goose fat and honey instead." },
        { cs: "Není náš půst vlastně pohrdáním Božím štědrým darem? Není obžerství jen intenzivní formou chvály?", en: "Isn't our fasting a scorn of God's generous gift? Isn't gluttony just an intense form of praise?" },
        { cs: "Zvonili na nešpory před chvílí, nebo před staletím? Co když věčnost je tady a teď?", en: "Did the vespers bell ring moments ago, or centuries ago? What if eternity is right here, right now?" },
        { cs: "Jak může papež mít klíče od nebe, když nebe je zjevně jen stav mysli?", en: "How can the pope hold the keys to heaven, when heaven is clearly just a state of mind?" },
        { cs: "Andělé v nebi vůbec nemluví latinsky. Dorozumívají se jen čistými barvami.", en: "The angels in heaven don't speak Latin at all. They speak only in pure colour." },
        { cs: "Ten spodní tón bratra Gregora — to nezpívá on, to rezonuje samotná klenba.", en: "That low tone from Brother Gregor — it isn't him singing, it's the vault itself resonating." },
        { cs: "Bůh není stvořitel. Bůh JE to stvoření. Je všude — i v hlíně za nehty.", en: "God is not the creator. God IS the creation. He is everywhere — even in the dirt under my nails." },
        { cs: "Ta moucha nemá žádný hřích, nepotřebuje křest. Proč by měl být člověk od narození zatracen?", en: "That fly has no sin, needs no baptism. Why should man be damned from birth?" },
        { cs: "Ti chrliči v křížové chodbě se na mě dívají. Vědí, co jsem udělal.", en: "Those gargoyles in the cloister are watching me. They know what I did." },
        { cs: "Co když celý náš řád slouží Ďáblovi, aniž bychom to věděli?", en: "What if our whole order serves the Devil without knowing it?" },
        { cs: "Bůh musel stvořit pštrosa a opice — má zjevně smysl pro humor. Smát se v kostele je možná ta nejupřímnější modlitba.", en: "God must have made the ostrich and the ape — He clearly has a sense of humour. Laughing in church may be the most honest prayer." },
    ],

    PIPE_PARANOIA_FLASHES: [
        { cs: "Opat na tebe zírá skrze klíčovou dírku.", en: "The Abbot is watching you through the keyhole." },
        { cs: "Pergamen na tebe dýchá.", en: "The parchment is breathing at you." },
        { cs: "Něco se pohnulo ve stínu za regálem.", en: "Something moved in the shadow behind the shelf." },
        { cs: "Svíce mrkla — nebo jsi mrkl ty?", en: "The candle blinked — or did you?" },
        { cs: "Bratr Bernard tě sleduje z chodby. Nebo tam ani není.", en: "Brother Bernard is watching from the hallway. Or he isn't there at all." },
        { cs: "Zdálo se ti, že zvon odbil, ale ještě není čas.", en: "You could swear the bell just rang, but it isn't time yet." },
    ],

    _dymkaSlowMult: function() {
        const active = GameState.flags && GameState.flags.dymkaEffectUntil && Date.now() < GameState.flags.dymkaEffectUntil;
        return active ? 0.5 : 1;
    },

    _ensurePipeState: function() {
        this._ensureState();
        if (!GameState.fire.pipe) GameState.fire.pipe = { state: 'idle' };
    },

    packPipe: function() {
        this._ensurePipeState();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const pipe = GameState.fire.pipe;
        if (pipe.state !== 'idle') return;
        const hasPipe = (GameState.inventory['pipe_large'] || 0) > 0 || (GameState.inventory['pipe_small'] || 0) > 0;
        if (!hasPipe) { UI.notify(lang === 'en' ? 'You need a pipe.' : 'Potřebuješ dýmku.', true); return; }
        if (!GameState.fire.active) { UI.notify(lang === 'en' ? 'The hearth must be lit.' : 'Krb musí hořet.', true); return; }
        if ((GameState.inventory['dried_cannabis'] || 0) <= 0) { UI.notify(lang === 'en' ? 'Need dried hemp.' : 'Potřebuješ sušené konopí.', true); return; }
        Game.removeItem('dried_cannabis', 1);
        pipe.state = 'packed';
        Game.save();
        this.render();
    },

    smokePipe: function() {
        this._ensurePipeState();
        const pipe = GameState.fire.pipe;
        if (pipe.state !== 'packed') return;
        pipe.state = 'idle';

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const roll = Math.floor(Math.random() * 3);
        if (!GameState.flags) GameState.flags = {};
        GameState.flags.dymkaEffectUntil = Date.now() + this.DYMKA_MS;

        // Kosmetická vrstva (nezávislá na tom, který ze 3 efektů padl) —
        // zpomalení: toast + Zprávy z kláštera hned; paranoia: 1 náhodná
        // linka v polovině okna.
        UI.notifyPanel(lang === 'en'
            ? '⏳ Time feels like it is dragging...'
            : '⏳ Zdá se ti, že čas plyne pomaleji...', 'system');
        setTimeout(() => {
            if (!(GameState.flags && GameState.flags.dymkaEffectUntil && Date.now() < GameState.flags.dymkaEffectUntil)) return;
            const flash = this.PIPE_PARANOIA_FLASHES[Math.floor(Math.random() * this.PIPE_PARANOIA_FLASHES.length)];
            UI.notifyPanel('👁️ ' + (lang === 'en' ? flash.en : flash.cs), 'system');
        }, Math.round(this.DYMKA_MS * (0.25 + Math.random() * 0.25)));

        if (roll === 0) {
            // Flow state — Vigor/craft bonus (viz core/game.js craft_speed hook), jednorázový hlad
            GameState.flags.dymkaEffectType = 'flow';
            GameState.satiety = Math.max(0, (GameState.satiety || 0) - 15);
            UI.notifyPanel(lang === 'en'
                ? '🌀 Flow state — the words come easy, but the munchies hit hard.'
                : '🌀 Stav toku — psaní jde snadno, ale hlad udeřil tvrdě.', 'system');
        } else if (roll === 1) {
            // Pain relief — okamžité vyléčení, pokud je co
            GameState.flags.dymkaEffectType = 'pain';
            const targets = ['writers_cramp', 'cold', 'rheumatism'];
            let cured = null;
            for (const id of targets) {
                if (typeof HealthSystem !== 'undefined' && HealthSystem.isActive(id)) {
                    HealthSystem.removeCondition(id, true);
                    cured = id;
                    break;
                }
            }
            UI.notifyPanel(cured
                ? (lang === 'en' ? '💨 The ache melts away.' : '💨 Bolest odplouvá pryč.')
                : (lang === 'en' ? '💨 A calm settles over you — nothing to heal today.' : '💨 Zahalí tě klid — dnes není co léčit.'), 'system');
        } else {
            // Kacířské vize — cena Zbožnost, žádná surovina, jen myšlenka
            GameState.flags.dymkaEffectType = 'vision';
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(-8);
            const thought = this.PIPE_HERETICAL_THOUGHTS[Math.floor(Math.random() * this.PIPE_HERETICAL_THOUGHTS.length)];
            UI.notifyPanel('🌀 ' + (lang === 'en' ? thought.en : thought.cs), 'system');
        }

        Game.save();
        this.render();
    },

    _renderPipe: function() {
        const hasAnyPipe = (GameState.inventory['pipe_large'] || 0) > 0 || (GameState.inventory['pipe_small'] || 0) > 0;
        if (!hasAnyPipe) return '';
        this._ensurePipeState();
        const pipe = GameState.fire.pipe;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const card = `background:rgba(0,0,0,0.05);padding:14px;border-radius:10px;border-left:3px solid var(--accent-gold);margin-bottom:12px;`;
        let h = `<div style="${card}"><h4 style="margin:0 0 10px 0;color:var(--ink-primary);">🪈 ${lang === 'en' ? 'Pipe' : 'Dýmka'}</h4>`;

        const btn = (label, onclick, disabled) =>
            `<button onclick="${onclick}" ${disabled ? 'disabled' : ''} style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--accent-gold);background:${disabled ? 'rgba(197,160,89,0.07)' : 'rgba(197,160,89,0.15)'};color:var(--accent-gold);cursor:${disabled ? 'default' : 'pointer'};font-size:0.85rem;opacity:${disabled ? '0.5' : '1'};">${label}</button>`;

        const effectActive = GameState.flags && GameState.flags.dymkaEffectUntil && Date.now() < GameState.flags.dymkaEffectUntil;
        if (effectActive) {
            const remainMin = Math.max(0, Math.ceil((GameState.flags.dymkaEffectUntil - Date.now()) / 60000));
            h += `<div style="text-align:center;font-size:1.8rem;">💨</div>`;
            h += `<div style="text-align:center;font-size:0.85rem;color:var(--accent-gold);margin-top:4px;">${lang === 'en' ? remainMin + ' min left' : 'zbývá ' + remainMin + ' min'}</div>`;
            h += `<div style="text-align:center;font-size:0.72rem;opacity:0.6;margin-top:4px;font-style:italic;">${lang === 'en' ? 'It seems to you... time is dragging.' : 'Zdá se ti... že čas plyne pomaleji.'}</div>`;
        } else if (pipe.state === 'packed') {
            h += btn('💨 ' + (lang === 'en' ? 'Smoke' : 'Vykouřit'), 'FireplaceSystem.smokePipe()', false);
        } else {
            const hasDried = (GameState.inventory['dried_cannabis'] || 0) > 0;
            const fireOk = !!GameState.fire.active;
            const can = hasDried && fireOk;
            h += btn('🌿 ' + (lang === 'en' ? 'Pack pipe' : 'Napěchovat dýmku'), 'FireplaceSystem.packPipe()', !can);
            let hint = '';
            if (!fireOk) hint = lang === 'en' ? 'Hearth must be lit' : 'Krb musí hořet';
            else if (!hasDried) hint = lang === 'en' ? 'Need dried hemp' : 'Potřeba sušené konopí';
            if (hint) h += `<div style="font-size:0.72rem;opacity:0.55;margin-top:6px;text-align:center;">${hint}</div>`;
        }
        h += `</div>`;
        return h;
    },

    // ── Kávovinový rituál: stavový automat idle → brewing(43s) → ready → idle ──
    _ensureCoffeeState: function() {
        if (!GameState.fire) this._ensureState();
        if (!GameState.fire.coffee) GameState.fire.coffee = { state: 'idle', start: 0, teaId: '' };
    },

    _coffeeHerb: function() {
        for (const e of this.COFFEE_HERBS) {
            if ((GameState.inventory[e.herb] || 0) > 0) return e;
        }
        return null;
    },

    // Dokončí vaření, pokud uplynul čas. Vrací true při dokončení.
    _checkCoffeeDone: function() {
        if (!GameState.fire || !GameState.fire.coffee) return false;
        const coffee = GameState.fire.coffee;
        if (coffee.state === 'brewing' && (Date.now() - coffee.start) >= this.COFFEE_BREW_MS) {
            coffee.state = 'ready';          // flip PŘED addItem — addItem re-rendruje a re-entrantně volá _checkCoffeeDone
            Game.addItem(coffee.teaId || 'acorn_brew', 1);
            Game.save();
            return true;
        }
        return false;
    },

    _ensureCoffeeInterval: function() {
        if (this._coffeeInterval) return;
        if (!GameState.fire || !GameState.fire.coffee || GameState.fire.coffee.state !== 'brewing') return;
        this._coffeeInterval = setInterval(() => {
            if (!GameState.fire || !GameState.fire.coffee || GameState.fire.coffee.state !== 'brewing') {
                clearInterval(this._coffeeInterval); this._coffeeInterval = null; return;
            }
            const done = this._checkCoffeeDone();
            this.render();
            if (done) { clearInterval(this._coffeeInterval); this._coffeeInterval = null; }
        }, 1000);
    },

    brewCoffee: function() {
        this._ensureState(); this._ensureCoffeeState();
        const coffee = GameState.fire.coffee;
        if (coffee.state !== 'idle') return;
        if ((GameState.inventory['tea_kettle'] || 0) <= 0) { UI.notify(t('fireplace.coffeeNeedKettle'), true); return; }
        if (!GameState.fire.active) { UI.notify(t('fireplace.coffeeNeedFire'), true); return; }
        const herb = this._coffeeHerb();
        if (!herb) { UI.notify(t('fireplace.coffeeNeedHerb'), true); return; }
        if ((GameState.inventory['water'] || 0) <= 0) { UI.notify(t('fireplace.coffeeNeedWater'), true); return; }

        Game.removeItem(herb.herb, 1);
        Game.removeItem('water', 1);
        GameState.fire.coffee = { state: 'brewing', start: Date.now(), teaId: herb.tea };
        Game.save();
        this.render();
        this._ensureCoffeeInterval();
    },

    drinkCoffee: function() {
        this._ensureCoffeeState();
        const coffee = GameState.fire.coffee;
        if (coffee.state !== 'ready') return;
        const teaId = coffee.teaId || 'acorn_brew';
        GameState.fire.coffee = { state: 'idle', start: 0, teaId: '' };
        if ((GameState.inventory[teaId] || 0) > 0 && typeof Game.eat === 'function') {
            Game.eat(teaId); // aplikuje efekt + odebere 1 + renderAll
        } else {
            Game.save();
        }
        this.render();
    },

    _renderTea: function() {
        this._ensureTeaState();
        const tea = GameState.fire.tea;
        const card = `background:rgba(0,0,0,0.05);padding:14px;border-radius:10px;border-left:3px solid var(--accent-gold);margin-bottom:12px;`;
        let h = `<div style="${card}"><h4 style="margin:0 0 10px 0;color:var(--ink-primary);">🍵 ${t('fireplace.teaTitle')}</h4>`;

        if ((GameState.inventory['tea_kettle'] || 0) <= 0) {
            h += `<div style="font-size:0.8rem;opacity:0.6;">🫖 ${t('fireplace.teaNeedKettle')}</div></div>`;
            return h;
        }

        const btn = (label, onclick, disabled) =>
            `<button onclick="${onclick}" ${disabled ? 'disabled' : ''} style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--accent-gold);background:${disabled ? 'rgba(197,160,89,0.07)' : 'rgba(197,160,89,0.15)'};color:var(--accent-gold);cursor:${disabled ? 'default' : 'pointer'};font-size:0.85rem;opacity:${disabled ? '0.5' : '1'};">${label}</button>`;

        if (tea.state === 'brewing') {
            const elapsed = (Date.now() - tea.start) * this._dymkaSlowMult();
            const remain = Math.max(0, Math.ceil((this.TEA_BREW_MS - elapsed) / 1000));
            h += `<div style="text-align:center;font-size:1.8rem;">♨️</div>`;
            h += `<div style="text-align:center;font-size:0.85rem;color:var(--accent-gold);margin-top:4px;">${t('fireplace.teaBrewing').replace('{s}', remain)}</div>`;
        } else if (tea.state === 'ready') {
            h += btn('🍵 ' + t('fireplace.teaDrink'), 'FireplaceSystem.drinkTea()', false);
        } else {
            const fireOk = !!GameState.fire.active;
            const herb = this._teaHerb();
            const water = (GameState.inventory['water'] || 0) > 0;
            let hint = '';
            if (!fireOk) hint = t('fireplace.teaNeedFire');
            else if (!herb) hint = t('fireplace.teaNeedHerb');
            else if (!water) hint = t('fireplace.teaNeedWater');
            const can = fireOk && herb && water;
            h += btn('🫖 ' + t('fireplace.teaBrew'), 'FireplaceSystem.brewTea()', !can);
            if (hint) h += `<div style="font-size:0.72rem;opacity:0.55;margin-top:6px;text-align:center;">${hint}</div>`;
        }

        h += `</div>`;
        return h;
    },

    _renderCoffee: function() {
        this._ensureCoffeeState();
        const coffee = GameState.fire.coffee;
        const card = `background:rgba(0,0,0,0.05);padding:14px;border-radius:10px;border-left:3px solid var(--accent-gold);margin-bottom:12px;`;
        let h = `<div style="${card}"><h4 style="margin:0 0 10px 0;color:var(--ink-primary);">☕ ${t('fireplace.coffeeTitle')}</h4>`;

        if ((GameState.inventory['tea_kettle'] || 0) <= 0) {
            h += `<div style="font-size:0.8rem;opacity:0.6;">🫖 ${t('fireplace.coffeeNeedKettle')}</div></div>`;
            return h;
        }

        const btn = (label, onclick, disabled) =>
            `<button onclick="${onclick}" ${disabled ? 'disabled' : ''} style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--accent-gold);background:${disabled ? 'rgba(197,160,89,0.07)' : 'rgba(197,160,89,0.15)'};color:var(--accent-gold);cursor:${disabled ? 'default' : 'pointer'};font-size:0.85rem;opacity:${disabled ? '0.5' : '1'};">${label}</button>`;

        if (coffee.state === 'brewing') {
            const elapsed = (Date.now() - coffee.start) * this._dymkaSlowMult();
            const remain = Math.max(0, Math.ceil((this.COFFEE_BREW_MS - elapsed) / 1000));
            h += `<div style="text-align:center;font-size:1.8rem;">♨️</div>`;
            h += `<div style="text-align:center;font-size:0.85rem;color:var(--accent-gold);margin-top:4px;">${t('fireplace.coffeeBrewing').replace('{s}', remain)}</div>`;
        } else if (coffee.state === 'ready') {
            h += btn('☕ ' + t('fireplace.coffeeDrink'), 'FireplaceSystem.drinkCoffee()', false);
        } else {
            const fireOk = !!GameState.fire.active;
            const herb = this._coffeeHerb();
            const water = (GameState.inventory['water'] || 0) > 0;
            let hint = '';
            if (!fireOk) hint = t('fireplace.coffeeNeedFire');
            else if (!herb) hint = t('fireplace.coffeeNeedHerb');
            else if (!water) hint = t('fireplace.coffeeNeedWater');
            const can = fireOk && herb && water;
            h += btn('🫖 ' + t('fireplace.coffeeBrew'), 'FireplaceSystem.brewCoffee()', !can);
            if (hint) h += `<div style="font-size:0.72rem;opacity:0.55;margin-top:6px;text-align:center;">${hint}</div>`;
        }

        h += `</div>`;
        return h;
    },

    // ── Sweep / Vymést — 1×/24h po prvním zapálení ──────────────────────────
    SWEEP_MS: 24 * 60 * 60 * 1000,
    SWEEP_ASH: 4,

    sweepAsh: function() {
        this._ensureState();
        const fire = GameState.fire;
        const now = Date.now();
        if (!fire.lastSweep && !fire.active && fire.fuelMs === 0) {
            UI.notify(t('fireplace.sweepNeedFire'), true); return;
        }
        if ((now - (fire.lastSweep || 0)) < this.SWEEP_MS) {
            UI.notify(t('fireplace.sweepCooldown'), true); return;
        }
        fire.lastSweep = now;
        Game.addItem('ash', this.SWEEP_ASH);
        Game.addItem('carbon_black', 4);
        Game.save();
        this.render();
        UI.notify(t('fireplace.sweepDone').replace('{n}', this.SWEEP_ASH));
    },

    _renderSweep: function() {
        this._ensureState();
        const fire = GameState.fire;
        const now = Date.now();
        const sinceLastSweep = now - (fire.lastSweep || 0);
        const ready = sinceLastSweep >= this.SWEEP_MS;
        const card = `background:rgba(0,0,0,0.05);padding:14px;border-radius:10px;border-left:3px solid var(--accent-gold);margin-bottom:12px;`;
        let h = `<div style="${card}">`;
        if (ready) {
            h += `<button onclick="FireplaceSystem.sweepAsh()" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.15);color:var(--accent-gold);cursor:pointer;font-size:0.85rem;">🧹 ${t('fireplace.sweepReady')}</button>`;
        } else {
            const remainH = Math.ceil((this.SWEEP_MS - sinceLastSweep) / 3600000);
            h += `<button disabled style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--accent-gold);background:rgba(197,160,89,0.07);color:var(--accent-gold);cursor:default;font-size:0.85rem;opacity:0.5;">🧹 ${t('fireplace.sweepWait').replace('{h}', remainH)}</button>`;
        }
        h += `</div>`;
        return h;
    },

    // Volá se z Game.checkEnvironment() — synchronizuje stav po ignite/dieOut
    render: function() {
        this._ensureState();

        const panel = document.getElementById('fireplace-fuel-panel');
        if (!panel) return; // Foculus subtab není v DOM (jiný subtab aktivní) — nic k vykreslení

        const lockedView = document.getElementById('foculus-locked');
        const unlockedView = document.getElementById('foculus-unlocked');

        const isFireActive = !!(GameState.fire && GameState.fire.active) || !!(GameState.flags && GameState.flags.fireplaceLit);
        const hasTech = this.hasMeteorologica();

        if (!isFireActive && !hasTech) {
            if (lockedView) lockedView.style.display = 'block';
            if (unlockedView) unlockedView.style.display = 'none';
            return;
        }

        if (lockedView) lockedView.style.display = 'none';
        if (unlockedView) unlockedView.style.display = 'block';

        const visualFoculus = document.getElementById('fireplace-visual-foculus');
        if (visualFoculus) {
            FireAnimationSystem.render('fireplace-visual-foculus', GameState.fire.fuelMs, this.MAX_FUEL_MS, GameState.fire.active);
        }

        if (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.renderFoculusVisit) {
            ScriptoriumCat.renderFoculusVisit();
        }

        const btnStick = document.getElementById('btn-fuel-stick');
        const btnLog = document.getElementById('btn-fuel-log');
        const bar = document.getElementById('fireplace-fuel-bar');
        const timeText = document.getElementById('fireplace-time-left');
        const statusText = document.getElementById('fireplace-status-text');

        if (!bar || !timeText) return;

        if (GameState.fire.active) {
            panel.style.display = 'block';
            if (statusText) statusText.textContent = t('fireplace.lit');

            let pct = (GameState.fire.fuelMs / this.MAX_FUEL_MS) * 100;
            if (pct > 100) pct = 100;
            if (pct < 0) pct = 0;
            bar.style.width = pct + '%';

            if (pct > 50) bar.style.backgroundColor = '#4ade80';
            else if (pct > 20) bar.style.backgroundColor = '#ffbd40';
            else bar.style.backgroundColor = '#ef4444';

            timeText.textContent = this._wordedBurnout(GameState.fire.fuelMs);
            timeText.title = `${Math.floor(GameState.fire.fuelMs / 3600000)}h ${Math.floor((GameState.fire.fuelMs % 3600000) / 60000)}m`;

            const hasStick = (GameState.inventory['stick'] || 0) > 0;
            const hasLog = (GameState.inventory['log'] || 0) > 0;
            const canFitStick = (GameState.fire.fuelMs + this.FUEL_VALUES['stick']) <= this.MAX_FUEL_MS;
            const canFitLog = (GameState.fire.fuelMs + this.FUEL_VALUES['log']) <= this.MAX_FUEL_MS;

            if (btnStick) {
                btnStick.disabled = !hasStick || !canFitStick;
                btnStick.style.opacity = (!hasStick || !canFitStick) ? '0.5' : '1';
                const sQty = GameState.inventory['stick'] || 0;
                btnStick.textContent = `+ ${iName('stick')} (${sQty})`;
            }
            if (btnLog) {
                btnLog.disabled = !hasLog || !canFitLog;
                btnLog.style.opacity = (!hasLog || !canFitLog) ? '0.5' : '1';
                const lQty = GameState.inventory['log'] || 0;
                btnLog.textContent = `+ ${iName('log')} (${lQty})`;
            }
        } else {
            panel.style.display = 'block';
            if (statusText) statusText.textContent = t('fireplace.diedOutShort');
            bar.style.width = '0%';
            timeText.textContent = '';
            if (btnStick) { btnStick.disabled = true; btnStick.style.opacity = '0.5'; btnStick.textContent = `+ ${iName('stick')}`; }
            if (btnLog) { btnLog.disabled = true; btnLog.style.opacity = '0.5'; btnLog.textContent = `+ ${iName('log')}`; }
        }

        const techNotice = document.getElementById('foculus-tech-locked');
        const dash = document.getElementById('foculus-dashboard');
        const teaEl = document.getElementById('foculus-tea');

        if (hasTech) {
            if (techNotice) techNotice.style.display = 'none';
            if (dash) {
                dash.innerHTML = this._renderDashboard();
                dash.style.display = 'block';
            }
            if (teaEl) {
                this._ensureTeaState();
                this._checkTeaDone();
                this._ensureCoffeeState();
                this._checkCoffeeDone();
                teaEl.innerHTML = this._renderTea() + this._renderCoffee() + this._renderSweep()
                    + (typeof DryingSystem !== 'undefined' ? DryingSystem.renderFoculus() : '')
                    + this._renderPipe();
                teaEl.style.display = 'block';
                this._ensureTeaInterval();
                this._ensureCoffeeInterval();
            }
            if (typeof IncenseSystem !== 'undefined') IncenseSystem.render();
        } else {
            if (techNotice) techNotice.style.display = 'block';
            if (dash) dash.style.display = 'none';
            if (teaEl) teaEl.style.display = 'none';
            const incenseEl = document.getElementById('incense-panel');
            if (incenseEl) incenseEl.style.display = 'none';
        }
    }
};
