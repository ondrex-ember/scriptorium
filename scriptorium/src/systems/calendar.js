// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR SYSTEM — Perpetuum Calendarium
// Scriptorium tab: Calendarium (requires tech_astronomy + perpetuum_calendarium)
// ═══════════════════════════════════════════════════════════════════════════════

const CalendarSystem = {

    // ── Latinské názvy ────────────────────────────────────────────────────────
    MONTHS_LAT: ['Ianuarius', 'Februarius', 'Martius', 'Aprilis', 'Maius', 'Iunius',
        'Iulius', 'Augustus', 'September', 'October', 'November', 'December'],
    MONTHS_CS: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
    MONTHS_EN: ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],
    DAYS_LAT: ['Lun', 'Mar', 'Mer', 'Iov', 'Ven', 'Sat', 'Sol'],
    DAYS_CS: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
    DAYS_EN: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

    // ── Výpočet Velikonoc (algoritmus Meeuse/Jones/Butcher) ──────────────────
    getEaster: function (year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-indexed
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return { month, day }; // month = 1-12
    },

    // ── Sváteční databáze (fixní + pohyblivé) ────────────────────────────────
    getFeastsForMonth: function (month, year) {
        const feasts = [];
        const easter = this.getEaster(year);
        // Popeleční středa = Velikonoce - 46 dní
        const easterDate = new Date(year, easter.month - 1, easter.day);
        const ashDate = new Date(easterDate); ashDate.setDate(easterDate.getDate() - 46);
        // Filipojakub
        if (month === 4) feasts.push({ day: 30, key: 'cal_walpurgis', icon: '🔥', nameCS: 'Filipojakubská noc', nameEN: 'Walpurgis Night', nameLAT: 'Nox Philippi et Iacobi' });
        if (month === 5) feasts.push({ day: 1, key: 'cal_may_day', icon: '🌿', nameCS: 'Svátek máje', nameEN: 'May Day', nameLAT: 'Calendae Maiae' });
        if (month === 6) feasts.push({ day: 24, key: 'cal_midsummer', icon: '🌞', nameCS: 'Sv. Jan / Slunovrat', nameEN: 'St. John / Midsummer', nameLAT: 'Nativitas Sancti Ioannis' });
        if (month === 11) feasts.push({ day: 2, key: 'cal_all_souls', icon: '🕯️', nameCS: 'Dušičky', nameEN: 'All Souls', nameLAT: 'Commemoratio Omnium Fidelium Defunctorum' });
        if (month === 12) feasts.push({ day: 24, key: 'cal_christmas', icon: '⭐', nameCS: 'Štědrý den', nameEN: 'Christmas Eve', nameLAT: 'Vigilia Nativitatis Domini' });
        if (month === 12) feasts.push({ day: 31, key: 'cal_new_year', icon: '🎉', nameCS: 'Silvestr', nameEN: 'New Year\'s Eve', nameLAT: 'Ultima Dies Anni' });
        if (month === 1) feasts.push({ day: 1, key: 'cal_new_year', icon: '🎉', nameCS: 'Nový rok', nameEN: 'New Year', nameLAT: 'Calendae Ianuariae' });
        // Advent (1.–24. 12.)
        if (month === 12) {
            for (let d = 1; d <= 24; d++) feasts.push({ day: d, key: 'cal_advent', icon: '✝️', nameCS: 'Advent', nameEN: 'Advent', nameLAT: 'Tempus Adventus', subtle: true });
        }
        // Pohyblivé svátky
        if (ashDate.getMonth() + 1 === month) feasts.push({ day: ashDate.getDate(), key: 'cal_ash_wednesday', icon: '✝️', nameCS: 'Popeleční středa', nameEN: 'Ash Wednesday', nameLAT: 'Feria IV Cinerum' });
        if (easter.month === month) feasts.push({ day: easter.day, key: 'cal_easter', icon: '✝️', nameCS: 'Velikonoce', nameEN: 'Easter', nameLAT: 'Pascha' });
        return feasts;
    },

    // ── Lunární fáze pro den ──────────────────────────────────────────────────
    getLunarForDay: function (year, month, day) {
        const d = new Date(year, month - 1, day);
        const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
        const daysSince = (d - knownNewMoon) / 86400000;
        const phase = ((daysSince % 29.53058867) + 29.53058867) % 29.53058867;
        const idx = Math.round(phase / 29.53058867 * 8) % 8;
        return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][idx];
    },

    // ── Navigace ─────────────────────────────────────────────────────────────
    GAME_YEAR: 1465,

    getViewState: function () {
        if (!GameState.ui) GameState.ui = {};
        const now = new Date();
        if (!GameState.ui.calViewMonth) GameState.ui.calViewMonth = now.getMonth() + 1;
        if (!GameState.ui.calViewYear || GameState.ui.calViewYear > 1500) GameState.ui.calViewYear = this.GAME_YEAR;
        return { month: GameState.ui.calViewMonth, year: GameState.ui.calViewYear };
    },

    navigateTo: function (month, year) {
        // Limit: 6 měsíců zpět, 12 vpřed od herního roku 1465
        const now = new Date();
        const baseYear = this.GAME_YEAR;
        const baseMonth = now.getMonth() + 1;
        // Převod na absolutní měsíce pro porovnání
        const baseAbs = baseYear * 12 + baseMonth;
        const minAbs = baseAbs - 6;
        const maxAbs = baseAbs + 12;
        const targetAbs = year * 12 + month;
        if (targetAbs < minAbs || targetAbs > maxAbs) return;
        if (!GameState.ui) GameState.ui = {};
        GameState.ui.calViewMonth = month;
        GameState.ui.calViewYear = year;
        this.render();
    },

    prevMonth: function () {
        const { month, year } = this.getViewState();
        if (month === 1) this.navigateTo(12, year - 1);
        else this.navigateTo(month - 1, year);
    },

    nextMonth: function () {
        const { month, year } = this.getViewState();
        if (month === 12) this.navigateTo(1, year + 1);
        else this.navigateTo(month + 1, year);
    },

    // ── Klik na den — detail modal ────────────────────────────────────────────
    showDayDetail: function (day, month, year) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const feasts = this.getFeastsForMonth(month, year).filter(f => f.day === day && !f.subtle);
        const moonPhase = this.getLunarForDay(year, month, day);
        const monthName = lang === 'en' ? this.MONTHS_EN[month - 1] : this.MONTHS_CS[month - 1];

        let body = `<div style="text-align:center; margin-bottom:12px; font-size:1.5rem;">${moonPhase}</div>`;
        body += `<p style="text-align:center; opacity:0.7; font-style:italic; font-size:0.85rem; margin-bottom:16px;">${this.MONTHS_LAT[month - 1]} ${day}, Anno Domini ${year}</p>`;

        if (feasts.length > 0) {
            feasts.forEach(f => {
                const name = lang === 'en' ? f.nameEN : f.nameCS;
                body += `<div style="padding:8px 12px; margin:6px 0; background:rgba(197,160,89,0.1); border-left:3px solid var(--accent-gold); border-radius:4px;">`;
                body += `<strong>${f.icon} ${name}</strong>`;
                body += `<div style="font-size:0.78rem; opacity:0.6; font-style:italic; margin-top:2px;">${f.nameLAT}</div>`;
                body += `</div>`;
            });
        } else {
            const noFeast = lang === 'en' ? 'No feast day.' : 'Žádný svátek.';
            body += `<p style="opacity:0.5; font-style:italic;">${noFeast}</p>`;
        }

        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.modal({
                title: `${day}. ${monthName}`,
                text: body,
                choices: [{ label: lang === 'en' ? 'Close' : 'Zavřít', type: 'default', effect: () => { } }]
            });
        }
    },

    // ── Hlavní render ─────────────────────────────────────────────────────────
    render: function () {
        const el = document.getElementById('lore-calendarium-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Gate check
        const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_astronomy');
        const hasCal = (GameState.inventory && (GameState.inventory['perpetuum_calendarium'] || 0) > 0);

        if (!hasTech) {
            el.innerHTML = `<div style="padding:20px; text-align:center; opacity:0.6;">
                <div style="font-size:2rem; margin-bottom:8px;">🔒</div>
                <strong>${lang === 'en' ? 'Research Computus — Celestial Mechanics to unlock.' : 'Prostuduj Computus — Nebeská Mechanika pro odemčení.'}</strong>
            </div>`;
            return;
        }

        if (!hasCal) {
            el.innerHTML = `<div style="padding:20px; text-align:center; opacity:0.7;">
                <div style="font-size:2rem; margin-bottom:8px;">📅</div>
                <strong>${lang === 'en' ? 'Craft a Perpetuum Calendarium to access this tab.' : 'Vytvoř Perpetuum Calendarium pro přístup k záložce.'}</strong>
                <p style="font-size:0.85rem; opacity:0.6; margin-top:8px; font-style:italic;">${lang === 'en' ? 'Recipe: 3× Paper, 2× Ink, 1× Vellum' : 'Recept: 3× Papír, 2× Inkoust, 1× Vellum'}</p>
            </div>`;
            return;
        }

        const { month, year } = this.getViewState();
        const now = new Date();
        const isCurrentMonth = (month === now.getMonth() + 1 && year === now.getFullYear());
        const today = now.getDate();

        const feasts = this.getFeastsForMonth(month, year);
        const feastMap = {};
        feasts.forEach(f => {
            if (!feastMap[f.day]) feastMap[f.day] = [];
            feastMap[f.day].push(f);
        });

        // Dny v týdnu (Pondělí = 0)
        const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
        const startOffset = (firstDay === 0) ? 6 : firstDay - 1; // Pondělí = 0
        const daysInMonth = new Date(year, month, 0).getDate();
        let monthHasAdvent = false;

        const monthNameLat = this.MONTHS_LAT[month - 1];
        const monthNameLocal = lang === 'en' ? this.MONTHS_EN[month - 1] : this.MONTHS_CS[month - 1];
        const dayNames = this.DAYS_LAT;

        // Navigation limits
        const minDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const maxDate = new Date(now.getFullYear(), now.getMonth() + 12, 1);
        const prevDate = month === 1 ? new Date(year - 1, 11, 1) : new Date(year, month - 2, 1);
        const nextDate = month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1);
        const canPrev = prevDate >= minDate;
        const canNext = nextDate <= maxDate;

        let h = `
        <div style="font-family:'Cinzel'; text-align:center; margin-bottom:20px;">
            <div style="font-size:0.7rem; opacity:0.5; letter-spacing:2px; text-transform:uppercase; margin-bottom:4px;">Anno Domini ${year}</div>
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
                <button onclick="CalendarSystem.prevMonth()" style="background:none; border:1px solid var(--accent-gold); color:var(--accent-gold); padding:4px 10px; border-radius:4px; cursor:pointer; font-family:'Cinzel'; font-size:0.8rem;" ${canPrev ? '' : 'disabled style="opacity:0.3; cursor:default;"'}>◀</button>
                <div>
                    <div style="font-size:1.2rem; font-weight:600; color:var(--accent-gold);">${monthNameLat}</div>
                    <div style="font-size:0.75rem; opacity:0.6;">${monthNameLocal}</div>
                </div>
                <button onclick="CalendarSystem.nextMonth()" style="background:none; border:1px solid var(--accent-gold); color:var(--accent-gold); padding:4px 10px; border-radius:4px; cursor:pointer; font-family:'Cinzel'; font-size:0.8rem;" ${canNext ? '' : 'disabled style="opacity:0.3; cursor:default;"'}>▶</button>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:4px;">
            ${dayNames.map(d => `<div style="text-align:center; font-size:0.65rem; font-family:'Cinzel'; opacity:0.5; letter-spacing:1px; padding:4px 0;">${d}</div>`).join('')}
        </div>
        <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px;">
        `;

        // Prázdné buňky před 1.
        for (let i = 0; i < startOffset; i++) {
            h += `<div style="padding:6px; min-height:44px;"></div>`;
        }

        // Dny
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = isCurrentMonth && d === today;
            const dayFeasts = feastMap[d] || [];
            const mainFeast = dayFeasts.find(f => !f.subtle);
            const isAdvent = dayFeasts.some(f => f.subtle && f.key === 'cal_advent');
            if (isAdvent) monthHasAdvent = true;
            const moon = (d === 1 || d === 8 || d === 15 || d === 22 || d === 29) ? this.getLunarForDay(year, month, d) : '';

            let bg = 'rgba(0,0,0,0.03)';
            if (isToday) bg = 'rgba(197,160,89,0.25)';
            else if (mainFeast) bg = 'rgba(197,160,89,0.12)';
            else if (isAdvent) bg = 'rgba(100,80,150,0.08)';

            const border = isToday ? '2px solid var(--accent-gold)' : mainFeast ? '1px solid rgba(197,160,89,0.4)' : '1px solid rgba(0,0,0,0.06)';

            h += `<div onclick="CalendarSystem.showDayDetail(${d},${month},${year})"
                style="padding:5px 4px; min-height:44px; background:${bg}; border:${border}; border-radius:4px; cursor:pointer; position:relative; transition:background 0.15s;"
                onmouseover="this.style.background='rgba(197,160,89,0.18)'" onmouseout="this.style.background='${bg}'">
                <div style="font-size:0.75rem; font-family:'Cinzel'; ${isToday ? 'color:var(--accent-gold);font-weight:700;' : ''}">${d}</div>
                ${moon ? `<div style="font-size:0.7rem; line-height:1;">${moon}</div>` : ''}
                ${mainFeast ? `<div style="font-size:0.8rem; line-height:1; margin-top:2px;" title="${mainFeast.nameLAT}">${mainFeast.icon}</div>` : ''}
                ${isAdvent && !mainFeast ? `<div style="font-size:0.6rem; opacity:0.4; font-style:italic;">adv</div>` : ''}
            </div>`;
        }

        h += `</div>`;

        // Legenda
        h += `<div style="margin-top:16px; padding:12px; background:rgba(0,0,0,0.04); border-radius:6px; font-size:0.78rem; opacity:0.7;">`;
        h += `<strong style="font-family:'Cinzel'; font-size:0.7rem; letter-spacing:1px;">${lang === 'en' ? 'LEGEND' : 'LEGENDA'}</strong>`;
        const legend = feasts.filter(f => !f.subtle).filter((f, i, a) => a.findIndex(x => x.key === f.key) === i);
        if (legend.length > 0) {
            legend.forEach(f => {
                const name = lang === 'en' ? f.nameEN : f.nameCS;
                h += `<div style="margin-top:4px;">${f.icon} <strong>${name}</strong> <span style="opacity:0.6; font-style:italic;">— ${f.nameLAT}</span></div>`;
            });
        } else {
            h += `<div style="margin-top:4px; font-style:italic; opacity:0.6;">${lang === 'en' ? 'No feast days this month.' : 'V tomto měsíci žádné svátky.'}</div>`;
        }
        if (monthHasAdvent) {
            h += `<div style="margin-top:4px;">✝️ <strong>${lang === 'en' ? 'Advent' : 'Advent'}</strong> <span style="opacity:0.6; font-style:italic;">— Tempus Adventus</span></div>`;
        }
        h += `</div>`;

        el.innerHTML = h;
    },

    // ── Kalendářní eventy A1-A9 — denní check ─────────────────────────────────
    checkCalendarEvents: function () {
        const today = new Date().toISOString().slice(0, 10);
        if (!GameState.flags) GameState.flags = {};
        if (GameState.flags.calEventChecked === today) return;
        GameState.flags.calEventChecked = today;

        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const year = now.getFullYear();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const L = (key) => t('events.' + key);
        const easter = this.getEaster(year);
        const easterDate = new Date(year, easter.month - 1, easter.day);
        const ashDate = new Date(easterDate); ashDate.setDate(easterDate.getDate() - 46);

        const flagKey = (id) => `calEvent_${id}_${year}`;
        const done = (id) => !!GameState.flags[flagKey(id)];
        const mark = (id) => { GameState.flags[flagKey(id)] = true; };

        // ── A1: Popeleční středa ───────────────────────────────────────────
        if (ashDate.getMonth() + 1 === month && ashDate.getDate() === day && !done('cal_ash_wednesday')) {
            mark('cal_ash_wednesday');
            NotificationSystem.panel(L('cal_ash_wednesday.notify'), 'system');
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.ashWednesdayUntil = Date.now() + 3 * 24 * 3600 * 1000;
            Game.save();
        }

        // ── A2: Filipojakubská noc ─────────────────────────────────────────
        if (month === 4 && day === 30 && !done('cal_walpurgis')) {
            mark('cal_walpurgis');
            NotificationSystem.panel(L('cal_walpurgis.athanor_notif'), 'system');
            NotificationSystem.modal({
                title: L('cal_walpurgis.title'),
                text: L('cal_walpurgis.text'),
                icon: '🔥',
                choices: [
                    {
                        label: L('cal_walpurgis.athanor_btn'), type: 'primary', effect: () => {
                            if (!GameState.eventFlags) GameState.eventFlags = {};
                            GameState.eventFlags.walpurgisBonus = true;
                            GameState.eventFlags.inquisitorRisk = (Math.random() < 0.4);
                            NotificationSystem.panel(L('cal_walpurgis.athanor_res'), 'system');
                            Game.save();
                        }
                    },
                    {
                        label: L('cal_walpurgis.pray_btn'), type: 'default', effect: () => {
                            if (typeof VigorSystem !== 'undefined') VigorSystem.add(10);
                            NotificationSystem.panel(L('cal_walpurgis.pray_res'), 'system');
                            Game.save();
                        }
                    },
                    {
                        label: L('cal_walpurgis.herbs_btn'), type: 'default', effect: () => {
                            Game.addItem('thyme', 3);
                            Game.addItem('st_johns_wort', 2);
                            Game.addItem('chamomile', 1);
                            NotificationSystem.panel(L('cal_walpurgis.herbs_res'), 'system');
                            Game.save();
                        }
                    },
                ]
            });
        }

        // ── A3: Velikonoce ─────────────────────────────────────────────────
        if (easter.month === month && easter.day === day && !done('cal_easter')) {
            mark('cal_easter');
            NotificationSystem.panel(L('cal_easter.notify'), 'system');
            if (typeof VigorSystem !== 'undefined') VigorSystem.add(30);
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.easterToday = true;
            Game.save();
        }

        // ── A4: Máj ────────────────────────────────────────────────────────
        if (month === 5 && day === 1 && !done('cal_may_day')) {
            mark('cal_may_day');
            NotificationSystem.panel(L('cal_may_day.notify'), 'system');
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.mayDayBonus = true;
            Game.save();
        }

        // ── A5: Noc sv. Jana / Slunovrat ──────────────────────────────────
        if (month === 6 && day === 24 && !done('cal_midsummer')) {
            mark('cal_midsummer');
            NotificationSystem.panel(L('cal_midsummer.herbs_notif'), 'system');
            NotificationSystem.modal({
                title: L('cal_midsummer.title'),
                text: L('cal_midsummer.text'),
                icon: '🌞',
                choices: [
                    {
                        label: L('cal_midsummer.herbs_btn'), type: 'primary', effect: () => {
                            Game.addItem('st_johns_wort', 3);
                            Game.addItem('thyme', 2);
                            Game.addItem('pollen', 1);
                            if (typeof VigorSystem !== 'undefined') VigorSystem.add(-10);
                            NotificationSystem.panel(L('cal_midsummer.herbs_res'), 'system');
                            Game.save();
                        }
                    },
                    {
                        label: L('cal_midsummer.work_btn'), type: 'default', effect: () => {
                            if (!GameState.eventFlags) GameState.eventFlags = {};
                            GameState.eventFlags.midsummerCandleBonus = true;
                            NotificationSystem.panel(L('cal_midsummer.work_res'), 'system');
                            Game.save();
                        }
                    },
                ]
            });
        }

        // ── A6: Dušičky ────────────────────────────────────────────────────
        if (month === 11 && day === 2 && !done('cal_all_souls')) {
            mark('cal_all_souls');
            NotificationSystem.panel(L('cal_all_souls.notify'), 'system');
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.titivillusActive = true;
            GameState.eventFlags.nigredoBonus = true;
            Game.save();
        }

        // ── A7: Advent (1. 12.) ────────────────────────────────────────────
        if (month === 12 && day === 1 && !done('cal_advent')) {
            mark('cal_advent');
            NotificationSystem.panel(L('cal_advent.notify'), 'system');
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.adventActive = true;
            Game.save();
        }

        // ── A8: Štědrý večer ───────────────────────────────────────────────
        if (month === 12 && day === 24 && !done('cal_christmas')) {
            mark('cal_christmas');
            NotificationSystem.panel(L('cal_christmas.notify'), 'system');
            if (typeof VigorSystem !== 'undefined') VigorSystem.add(50);
            Game.save();
        }

        // ── A9: Silvestr ───────────────────────────────────────────────────
        if (month === 12 && day === 31 && !done('cal_new_year')) {
            mark('cal_new_year');
            NotificationSystem.panel(L('cal_new_year.notify'), 'system');
            Game.addKronikaEntry('important',
                `Rok ${year} uzavřen. Calendarium se obnovuje.`,
                `Year ${year} closed. The Calendarium renews.`,
                `Annus ${year} clausus est.`
            );
            Game.save();
        }
    }
};