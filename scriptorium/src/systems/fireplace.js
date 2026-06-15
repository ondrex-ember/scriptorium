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

    hasMeteorologica: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_meteorologica'));
    },

    _ensureState: function() {
        if (!GameState.fire) {
            GameState.fire = {
                active: GameState.flags.fireplaceLit || false,
                fuelMs: GameState.flags.fireplaceLit ? (6 * 60 * 60 * 1000) : 0, // Pro staré savy: dostanou 6h do začátku
                lastUpdate: Date.now()
            };
        }
    },

    addFuel: function(itemId) {
        this._ensureState();
        if (!GameState.fire.active) return;
        if (!this.hasMeteorologica()) return;

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

        // ── Sekce Stav (zápisky / groše / rank / techy / poslední kronika) ──
        let stav = `<div style="${card}"><h4 style="margin:0 0 10px 0;color:var(--ink-primary);">📊 ${t('fireplace.dashStav')}</h4>`;
        const notes = (GameState.achievements && GameState.achievements.stats && GameState.achievements.stats.researchCount) || 0;
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

        env += `</div>`;
        h += env;

        return h;
    },

    // Volá se z Game.checkEnvironment() — synchronizuje stav po ignite/dieOut
    render: function() {
        this._ensureState();

        const panel = document.getElementById('fireplace-fuel-panel');
        if (!panel) return; // Foculus subtab není v DOM (jiný subtab aktivní) — nic k vykreslení

        const lockedView = document.getElementById('foculus-locked');
        const unlockedView = document.getElementById('foculus-unlocked');

        if (!this.hasMeteorologica()) {
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

        const dash = document.getElementById('foculus-dashboard');
        if (dash) {
            dash.innerHTML = this._renderDashboard();
            dash.style.display = 'block';
        }
    }
};