const EventsSystem = {
    events: [
        {
            id: 'pellinga_swedish_siege',
            titleKey: 'events.swedish_siege.title',
            textKey: 'events.swedish_siege.text',
            trigger: () => {
                const totalBooks = (GameState.inventory['paper'] || 0) + 
                                  (GameState.inventory['research'] || 0) + 
                                  (GameState.inventory['common_codex'] || 0) + 
                                  (GameState.inventory['luxury_codex'] || 0) + 
                                  (GameState.inventory['vellum_codex'] || 0);
                return totalBooks >= 20 && Math.random() < 0.02;
            },
            choices: [
                {
                    labelKey: "events.swedish_siege.sartorius_btn",
                    descKey: "events.swedish_siege.sartorius_desc",
                    action: () => {
                        if(GameState.inventory['paper']) Game.addItem('paper', -Math.floor(GameState.inventory['paper'] * 0.4));
                        if(GameState.inventory['research']) Game.addItem('research', -Math.floor(GameState.inventory['research'] * 0.4));
                        if(GameState.inventory['common_codex']) Game.addItem('common_codex', -Math.floor(GameState.inventory['common_codex'] * 0.4));
                        
                        UI.notifyPanel(t("events.swedish_siege.sartorius_notif"), 'system');
                        return t("events.swedish_siege.sartorius_res");
                    }
                },
                {
                    labelKey: "events.swedish_siege.wall_btn",
                    descKey: "events.swedish_siege.wall_desc",
                    action: () => {
                        GameState.eventData = GameState.eventData || {};
                        GameState.eventData.walledBooks = {
                            paper: GameState.inventory['paper'] || 0,
                            research: GameState.inventory['research'] || 0,
                            common_codex: GameState.inventory['common_codex'] || 0,
                            luxury_codex: GameState.inventory['luxury_codex'] || 0,
                            vellum_codex: GameState.inventory['vellum_codex'] || 0,
                            returnTime: Date.now() + (48 * 60 * 60 * 1000)
                        };
                        Game.addItem('paper', -(GameState.inventory['paper'] || 0));
                        Game.addItem('research', -(GameState.inventory['research'] || 0));
                        Game.addItem('common_codex', -(GameState.inventory['common_codex'] || 0));
                        Game.addItem('luxury_codex', -(GameState.inventory['luxury_codex'] || 0));
                        Game.addItem('vellum_codex', -(GameState.inventory['vellum_codex'] || 0));
                        
                        UI.notifyPanel(t("events.swedish_siege.wall_notif"), 'system');
                        return t("events.swedish_siege.wall_res");
                    }
                },
                {
                    labelKey: "events.swedish_siege.nego_btn",
                    descKey: "events.swedish_siege.nego_desc",
                    action: () => {
                        if(GameState.inventory['paper']) Game.addItem('paper', -Math.floor(GameState.inventory['paper'] * 0.6));
                        if(GameState.inventory['common_codex']) Game.addItem('common_codex', -Math.floor(GameState.inventory['common_codex'] * 0.6));
                        
                        UI.notifyPanel(t("events.swedish_siege.nego_notif"), 'system');
                        return t("events.swedish_siege.nego_res");
                    }
                }
            ],
            canTrigger: true
        },
        {
            id: 'hidden_incunabula',
            titleKey: 'events.hidden_incunabula.title',
            textKey: 'events.hidden_incunabula.text',
            trigger: () => {
                const hasBook = GameState.library && GameState.library.readBooks.includes('book_kutnohorska_bible');
                const hasLuxury = (GameState.inventory['luxury_codex'] || 0) > 0;
                return hasBook && hasLuxury && Math.random() < 0.01;
            },
            choices: [
                {
                    labelKey: "events.hidden_incunabula.compare_btn",
                    descKey: "events.hidden_incunabula.compare_desc",
                    action: () => {
                        if(Math.random() > 0.3) {
                            Game.addItem('research', 10);
                            Game.addItem('luxury_codex', 1);
                            UI.notifyPanel(t("events.hidden_incunabula.compare_notif_ok"), 'system');
                            return t("events.hidden_incunabula.compare_res_ok");
                        } else {
                            Game.addItem('research', 2);
                            UI.notifyPanel(t("events.hidden_incunabula.compare_notif_fail"), 'system');
                            return t("events.hidden_incunabula.compare_res_fail");
                        }
                    }
                },
                {
                    labelKey: "events.hidden_incunabula.ignore_btn",
                    descKey: "events.hidden_incunabula.ignore_desc",
                    action: () => {
                        UI.notifyPanel(t("events.hidden_incunabula.ignore_notif"), 'system');
                        return t("events.hidden_incunabula.ignore_res");
                    }
                }
            ],
            canTrigger: true
        }
    ],
    
    lastCheck: 0,
    actionCount: 0,
    ACTION_THRESHOLD: 50,

    // ── Volá se z Game loop při každé akci hráče ─────────────────────────────
    onAction: function() {
        this.actionCount++;
        if (this.actionCount >= this.ACTION_THRESHOLD) {
            this.actionCount = 0;
            this.checkRandomEvents();
        }
    },

    // ── Náhodné eventy (akce-based, max 1/24h) ────────────────────────────────
    checkRandomEvents: function() {
        if (!GameState.events) GameState.events = {};
        const now = Date.now();
        const last = GameState.events.lastRandomEvent || 0;
        if (now - last < 24 * 3600000) return; // max 1 za 24h

        for (let event of this.events) {
            if (!event.canTrigger) continue;
            if (event.trigger()) {
                this.showEvent(event);
                event.canTrigger = false;
                GameState.events.lastRandomEvent = now;
                Game.save();
                break;
            }
        }
    },

    // ── Kalendářní eventy (1× za den, jen dnešní datum) ───────────────────────
    checkCalendarEvents: function() {
        if (!GameState.events) GameState.events = {};
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
        if (GameState.events.lastCalendarDate === todayStr) return; // už zobrazeno dnes
        GameState.events.lastCalendarDate = todayStr;
        Game.save();

        const month = today.getMonth() + 1; // 1-12
        const day   = today.getDate();

        // Velikonoce — pohyblivé datum (přibližný výpočet)
        const easter = this._getEaster(today.getFullYear());
        const ashWed = new Date(easter); ashWed.setDate(ashWed.getDate() - 46);
        const isAshWed   = month === ashWed.getMonth()+1 && day === ashWed.getDate();
        const isEaster   = month === easter.getMonth()+1 && day === easter.getDate();

        // Advent — 1.12 až 23.12
        const isAdvent = month === 12 && day >= 1 && day <= 23;

        let calEvent = null;

        if (isAshWed)                        calEvent = this.calendarEvents.find(e => e.id === 'cal_ash_wednesday');
        else if (isEaster)                   calEvent = this.calendarEvents.find(e => e.id === 'cal_easter');
        else if (month === 4 && day === 30)  calEvent = this.calendarEvents.find(e => e.id === 'cal_walpurgis');
        else if (month === 5 && day === 1)   calEvent = this.calendarEvents.find(e => e.id === 'cal_may_day');
        else if (month === 6 && day === 24)  calEvent = this.calendarEvents.find(e => e.id === 'cal_midsummer');
        else if (month === 11 && day === 2)  calEvent = this.calendarEvents.find(e => e.id === 'cal_all_souls');
        else if (isAdvent)                   calEvent = this.calendarEvents.find(e => e.id === 'cal_advent');
        else if (month === 12 && day === 24) calEvent = this.calendarEvents.find(e => e.id === 'cal_christmas');
        else if (month === 12 && day === 31) calEvent = this.calendarEvents.find(e => e.id === 'cal_new_year');
        else if (month === 1  && day === 1)  calEvent = this.calendarEvents.find(e => e.id === 'cal_new_year');

        if (!calEvent) return;

        if (calEvent.choices && calEvent.choices.length > 0) {
            this.showEvent(calEvent);
        } else {
            this.applyAutoEffect(calEvent);
        }
    },

    // ── Výpočet Velikonoc (Anonymní Gregorian) ────────────────────────────────
    _getEaster: function(year) {
        const a = year % 19, b = Math.floor(year/100), c = year % 100;
        const d = Math.floor(b/4), e = b % 4, f = Math.floor((b+8)/25);
        const g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15) % 30;
        const i = Math.floor(c/4), k = c % 4;
        const l = (32+2*e+2*i-h-k) % 7;
        const m = Math.floor((a+11*h+22*l)/451);
        const month = Math.floor((h+l-7*m+114)/31);
        const day   = ((h+l-7*m+114) % 31) + 1;
        return new Date(year, month-1, day);
    },

    // ── Automatický efekt bez modalu ──────────────────────────────────────────
    applyAutoEffect: function(event) {
        if (!event.effect) return;
        event.effect();
        if (event.notifyKey) UI.notifyPanel(t(event.notifyKey), 'system');
    },

    // ── Starý checkEvents zachován pro zpětnou kompatibilitu ─────────────────
    checkEvents: function() {
        if(Date.now() - this.lastCheck < 60 * 60 * 1000) return;
        this.lastCheck = Date.now();

        this.checkCalendarEvents();

        for(let event of this.events) {
            if(!event.canTrigger) continue;
            if(event.trigger()) {
                this.showEvent(event);
                event.canTrigger = false;
                break;
            }
        }
        
        if(GameState.eventData && GameState.eventData.walledBooks) {
            const data = GameState.eventData.walledBooks;
            if(Date.now() >= data.returnTime) {
                Game.addItem('paper', Math.floor(data.paper * 0.8));
                Game.addItem('research', Math.floor(data.research * 0.8));
                Game.addItem('common_codex', Math.floor(data.common_codex * 0.8));
                Game.addItem('luxury_codex', Math.floor(data.luxury_codex * 0.8));
                Game.addItem('vellum_codex', Math.floor(data.vellum_codex * 0.8));
                delete GameState.eventData.walledBooks;
                
                // Dynamický překlad notifikace
                UI.notifyPanel(t("events.swedish_siege.wall_return"), 'system');
                Game.save();
            }
        }
    },
    
    // ── KALENDÁŘNÍ EVENTY ────────────────────────────────────────────────────
    calendarEvents: [

        // A1 — Popeleční středa (automatický)
        {
            id: 'cal_ash_wednesday',
            titleKey: 'events.cal_ash_wednesday.title',
            textKey:  'events.cal_ash_wednesday.text',
            notifyKey: 'events.cal_ash_wednesday.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.ashWednesday = Date.now() + (3 * 24 * 3600000);
                Game.save();
            }
        },

        // A2 — Filipojakubská noc (s volbou)
        {
            id: 'cal_walpurgis',
            titleKey: 'events.cal_walpurgis.title',
            textKey:  'events.cal_walpurgis.text',
            choices: [
                {
                    labelKey: 'events.cal_walpurgis.athanor_btn',
                    descKey:  'events.cal_walpurgis.athanor_desc',
                    action: () => {
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.walpurgisAthanor = Date.now() + (8 * 3600000);
                        // 40% šance inkvizitor druhý den
                        if (Math.random() < 0.4) {
                            GameState.flags.inquisitorComing = true;
                        }
                        Game.save();
                        UI.notifyPanel(t('events.cal_walpurgis.athanor_notif'), 'system');
                        return t('events.cal_walpurgis.athanor_res');
                    }
                },
                {
                    labelKey: 'events.cal_walpurgis.pray_btn',
                    descKey:  'events.cal_walpurgis.pray_desc',
                    action: () => {
                        Game.addItem('vigor_point', 10);
                        UI.notifyPanel(t('events.cal_walpurgis.pray_notif'), 'system');
                        return t('events.cal_walpurgis.pray_res');
                    }
                },
                {
                    labelKey: 'events.cal_walpurgis.herbs_btn',
                    descKey:  'events.cal_walpurgis.herbs_desc',
                    action: () => {
                        Game.addItem('thyme', 3);
                        Game.addItem('st_johns_wort', 2);
                        Game.addItem('chamomile', 1);
                        UI.notifyPanel(t('events.cal_walpurgis.herbs_notif'), 'system');
                        return t('events.cal_walpurgis.herbs_res');
                    }
                }
            ]
        },

        // A3 — Velikonoce (automatický)
        {
            id: 'cal_easter',
            titleKey:  'events.cal_easter.title',
            textKey:   'events.cal_easter.text',
            notifyKey: 'events.cal_easter.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.easterBonus = true;
                Game.addItem('honey', 2);
                Game.save();
            }
        },

        // A4 — Máj (automatický)
        {
            id: 'cal_may_day',
            titleKey:  'events.cal_may_day.title',
            textKey:   'events.cal_may_day.text',
            notifyKey: 'events.cal_may_day.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.mayDayBonus = Date.now() + (24 * 3600000);
                Game.save();
            }
        },

        // A5 — Slunovrat / Svatý Jan (s volbou)
        {
            id: 'cal_midsummer',
            titleKey: 'events.cal_midsummer.title',
            textKey:  'events.cal_midsummer.text',
            choices: [
                {
                    labelKey: 'events.cal_midsummer.herbs_btn',
                    descKey:  'events.cal_midsummer.herbs_desc',
                    action: () => {
                        Game.addItem('st_johns_wort', 3);
                        Game.addItem('thyme', 2);
                        Game.addItem('pollen', 1);
                        UI.notifyPanel(t('events.cal_midsummer.herbs_notif'), 'system');
                        return t('events.cal_midsummer.herbs_res');
                    }
                },
                {
                    labelKey: 'events.cal_midsummer.work_btn',
                    descKey:  'events.cal_midsummer.work_desc',
                    action: () => {
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.midsummerWork = true;
                        Game.save();
                        UI.notifyPanel(t('events.cal_midsummer.work_notif'), 'system');
                        return t('events.cal_midsummer.work_res');
                    }
                }
            ]
        },

        // A6 — Dušičky (automatický)
        {
            id: 'cal_all_souls',
            titleKey:  'events.cal_all_souls.title',
            textKey:   'events.cal_all_souls.text',
            notifyKey: 'events.cal_all_souls.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.allSoulsNight = Date.now() + (24 * 3600000);
                Game.save();
            }
        },

        // A7 — Advent (automatický, jen 1. prosince)
        {
            id: 'cal_advent',
            titleKey:  'events.cal_advent.title',
            textKey:   'events.cal_advent.text',
            notifyKey: 'events.cal_advent.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.adventSeason = true;
                Game.save();
            }
        },

        // A8 — Štědrý den (automatický)
        {
            id: 'cal_christmas',
            titleKey:  'events.cal_christmas.title',
            textKey:   'events.cal_christmas.text',
            notifyKey: 'events.cal_christmas.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.christmasDay = true;
                GameState.flags.adventSeason = false;
                Game.save();
            }
        },

        // A9 — Silvestr / Nový rok (automatický)
        {
            id: 'cal_new_year',
            titleKey:  'events.cal_new_year.title',
            textKey:   'events.cal_new_year.text',
            notifyKey: 'events.cal_new_year.notify',
            choices: [],
            effect: () => {
                // Reset canTrigger všech náhodných eventů
                EventsSystem.events.forEach(e => { e.canTrigger = true; });
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.christmasDay = false;
                Game.save();
            }
        },

    ], // konec calendarEvents

    showEvent: function(event) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #f5f5dc; border: 3px solid #8b4513; border-radius: 10px;
            padding: 20px; max-width: 500px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        // Dynamické načtení textů přes t()
        let html = `<h3 style="margin-top:0;">${t(event.titleKey)}</h3>`;
        html += `<p style="white-space: pre-wrap;">${t(event.textKey)}</p>`;
        html += `<div style="margin-top:20px;">`;
        
        for(let choice of event.choices) {
            html += `<button class="game-btn" style="display:block; width:100%; margin-bottom:10px; text-align:left;" data-choice="${event.choices.indexOf(choice)}">
                ${t(choice.labelKey)}<br>
                <small style="opacity:0.7;">${t(choice.descKey)}</small>
            </button>`;
        }
        
        html += `</div>`;
        modal.innerHTML = html;
        
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999;`;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        modal.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIdx = parseInt(e.currentTarget.dataset.choice);
                const choice = event.choices[choiceIdx];
                const result = choice.action();
                Game.save();

                modal.innerHTML = `<h3 style="margin-top:0;">${t('events.ui.result')}</h3>
                <p style="white-space: pre-wrap;">${result}</p>
                <button class="game-btn" id="event-close-btn">${t('events.ui.close')}</button>`;

                document.getElementById('event-close-btn').addEventListener('click', () => {
                    modal.remove();
                    if (backdrop && backdrop.parentElement) backdrop.remove();
                    if (typeof UI !== 'undefined' && typeof UI.renderAll === 'function') UI.renderAll();
                });
            });
        });
    }
};