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
                        
                        UI.notify(t("events.swedish_siege.sartorius_notif"));
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
                        
                        UI.notify(t("events.swedish_siege.wall_notif"));
                        return t("events.swedish_siege.wall_res");
                    }
                },
                {
                    labelKey: "events.swedish_siege.nego_btn",
                    descKey: "events.swedish_siege.nego_desc",
                    action: () => {
                        if(GameState.inventory['paper']) Game.addItem('paper', -Math.floor(GameState.inventory['paper'] * 0.6));
                        if(GameState.inventory['common_codex']) Game.addItem('common_codex', -Math.floor(GameState.inventory['common_codex'] * 0.6));
                        
                        UI.notify(t("events.swedish_siege.nego_notif"));
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
                            UI.notify(t("events.hidden_incunabula.compare_notif_ok"));
                            return t("events.hidden_incunabula.compare_res_ok");
                        } else {
                            Game.addItem('research', 2);
                            UI.notify(t("events.hidden_incunabula.compare_notif_fail"));
                            return t("events.hidden_incunabula.compare_res_fail");
                        }
                    }
                },
                {
                    labelKey: "events.hidden_incunabula.ignore_btn",
                    descKey: "events.hidden_incunabula.ignore_desc",
                    action: () => {
                        UI.notify(t("events.hidden_incunabula.ignore_notif"));
                        return t("events.hidden_incunabula.ignore_res");
                    }
                }
            ],
            canTrigger: true
        }
    ],
    
    lastCheck: 0,
    
    checkEvents: function() {
        if(Date.now() - this.lastCheck < 60 * 60 * 1000) return;
        this.lastCheck = Date.now();
        
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
                UI.notify(t("events.swedish_siege.wall_return"));
                Game.save();
            }
        }
    },
    
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
                
                modal.innerHTML = `<h3 style="margin-top:0;">${t('events.ui.result')}</h3>
                <p style="white-space: pre-wrap;">${result}</p>
                <button class="game-btn" onclick="this.parentElement.parentElement.remove(); document.body.querySelector('div[style*=\\'background: rgba\\']').remove(); Game.save(); UI.renderAll();">${t('events.ui.close')}</button>`;
            });
        });
    }
};