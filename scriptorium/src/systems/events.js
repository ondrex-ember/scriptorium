const EventsSystem = {
    events: [
        {
            id: 'pellinga_swedish_siege',
            title: '⚔️ Švédové u bran kláštera',
            trigger: () => {
                // Trigger if player has 15+ books
                const totalBooks = (GameState.inventory['paper'] || 0) + 
                                  (GameState.inventory['research'] || 0) + 
                                  (GameState.inventory['common_codex'] || 0) + 
                                  (GameState.inventory['luxury_codex'] || 0) + 
                                  (GameState.inventory['vellum_codex'] || 0);
                return totalBooks >= 20 && Math.random() < 0.02; // 2% per day
            },
            text: `"Jako v Olomouci roku 1642 — vojáci prohledávají klášter. Bratr Pellinga se ptá: Co zachrán
íme?"
            
Student Michael Sartorius našeptává: "Mohu v noci odnášet nejcennější kusy..."

Ale je to riziko. Pokud nás chytí, přijdeme o vše.`,
            choices: [
                {
                    label: "🌙 Schovej tajně (Sartorius metoda)",
                    desc: "Schovává v noci nejcennější kusy",
                    action: () => {
                        // Lose 40% of common books, luxury survive
                        const losses = {};
                        if(GameState.inventory['paper']) {
                            const loss = Math.floor(GameState.inventory['paper'] * 0.4);
                            Game.addItem('paper', -loss);
                            losses['paper'] = loss;
                        }
                        if(GameState.inventory['research']) {
                            const loss = Math.floor(GameState.inventory['research'] * 0.4);
                            Game.addItem('research', -loss);
                            losses['research'] = loss;
                        }
                        if(GameState.inventory['common_codex']) {
                            const loss = Math.floor(GameState.inventory['common_codex'] * 0.4);
                            Game.addItem('common_codex', -loss);
                            losses['common_codex'] = loss;
                        }
                        // Luxury and vellum survive!
                        UI.notify("Sartorius zachránil luxury kodexy! Ztratil jsi běžné knihy.");
                        return `Michael Sartorius to dělal přesně takhle. V noci, po jedné knize. Švédové odešli s vozem papírů, ale ty nejcennější přežily.`;
                    }
                },
                {
                    label: "📦 Zazdít vše",
                    desc: "Noc strávíš zazdíváním",
                    action: () => {
                        // Lose ALL for 48h, then return -20%
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
                        UI.notify("Vše zazděno. Za 48h můžeš vykopat.");
                        return `Jako v Sázavě 1097. Zazdil jsi vše. Švédové nic nenašli. Za 2 dny můžeš vykopat (trochu poškozené).`;
                    }
                },
                {
                    label: "🤝 Vyjednávat",
                    desc: "Nabídneš common místo luxury",
                    action: () => {
                        // Lose 60% common, luxury survive
                        if(GameState.inventory['paper']) Game.addItem('paper', -Math.floor(GameState.inventory['paper'] * 0.6));
                        if(GameState.inventory['common_codex']) Game.addItem('common_codex', -Math.floor(GameState.inventory['common_codex'] * 0.6));
                        UI.notify("Švédové vzali běžné knihy. Luxury přežily!");
                        return `"Vezměte si tyto. Jsou dost dobré." Švédský důstojník kývl. Vozy odjely. Luxury kodexy zůstaly.`;
                    }
                }
            ],
            canTrigger: true
        },
        {
            id: 'hidden_incunabula',
            title: '📖 Podivná kniha v knihovně',
            trigger: () => {
                // Only if player has luxury_codex and has read Kutnohorská bible book
                const hasBook = GameState.library && GameState.library.readBooks.includes('book_kutnohorska_bible');
                const hasLuxury = (GameState.inventory['luxury_codex'] || 0) > 0;
                return hasBook && hasLuxury && Math.random() < 0.01; // 1% per day
            },
            text: `"Listoval jsi starými záznamy. Jedna z knih je vedena jako: 'Benátský tisk, 1506.' 
            
Ale písmo... to není benátské. Ty iniciály, ten rytmus sazby...

Tohle je **české písmo**. A je o 17 let starší, než se myslelo!"`,
            choices: [
                {
                    label: "🔍 Porovnej písmo (minigame)",
                    desc: "Identifikuj pravý původ",
                    action: () => {
                        // Simple success check
                        if(Math.random() > 0.3) { // 70% success
                            Game.addItem('research', 10);
                            Game.addItem('luxury_codex', 1);
                            UI.notify("⭐ Nalezl jsi Kutnohorskou bibli (1489)! +10 research");
                            return `Měl jsi pravdu! Rukopisný doplněk použil JINÉ vydání. Toto je Kutnohorská bible z roku 1489, ne benátský tisk z 1506. 

Právě jsi objevil ztracený poklad. Jako v VKOL roku 2005.`;
                        } else {
                            Game.addItem('research', 2);
                            UI.notify("Nelze určit. +2 research za snahu.");
                            return `Písmo je podobné, ale nemáš referenční materiál. Možná to skutečně je benátský tisk. Nebo ne? Zůstává záhadou.`;
                        }
                    }
                },
                {
                    label: "❌ Ignorovat",
                    desc: "Je to asi jen benátský tisk",
                    action: () => {
                        UI.notify("Možná jsi právě minul objev století.");
                        return `Pravda čeká trpělivě. Někdy staletí.`;
                    }
                }
            ],
            canTrigger: true
        }
    ],
    
    lastCheck: 0,
    
    checkEvents: function() {
        // Check once per hour
        if(Date.now() - this.lastCheck < 60 * 60 * 1000) return;
        this.lastCheck = Date.now();
        
        for(let event of this.events) {
            if(!event.canTrigger) continue;
            if(event.trigger()) {
                this.showEvent(event);
                event.canTrigger = false; // Don't trigger again
                break; // Only one event at a time
            }
        }
        
        // Check walled books return
        if(GameState.eventData && GameState.eventData.walledBooks) {
            const data = GameState.eventData.walledBooks;
            if(Date.now() >= data.returnTime) {
                // Return 80% of books
                Game.addItem('paper', Math.floor(data.paper * 0.8));
                Game.addItem('research', Math.floor(data.research * 0.8));
                Game.addItem('common_codex', Math.floor(data.common_codex * 0.8));
                Game.addItem('luxury_codex', Math.floor(data.luxury_codex * 0.8));
                Game.addItem('vellum_codex', Math.floor(data.vellum_codex * 0.8));
                delete GameState.eventData.walledBooks;
                UI.notify("⭐ Vykopals zazděné knihy! Trochu poškozené, ale většina přežila.");
                Game.save();
            }
        }
    },
    
    showEvent: function(event) {
        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f5f5dc;
            border: 3px solid #8b4513;
            border-radius: 10px;
            padding: 20px;
            max-width: 500px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        let html = `<h3 style="margin-top:0;">${event.title}</h3>`;
        html += `<p style="white-space: pre-wrap;">${event.text}</p>`;
        html += `<div style="margin-top:20px;">`;
        
        for(let choice of event.choices) {
            html += `<button class="game-btn" style="display:block; width:100%; margin-bottom:10px; text-align:left;" data-choice="${event.choices.indexOf(choice)}">
                ${choice.label}<br>
                <small style="opacity:0.7;">${choice.desc}</small>
            </button>`;
        }
        
        html += `</div>`;
        modal.innerHTML = html;
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Handle choice clicks
        modal.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIdx = parseInt(e.currentTarget.dataset.choice);
                const choice = event.choices[choiceIdx];
                const result = choice.action();
                
                // Show result
                modal.innerHTML = `<h3 style="margin-top:0;">Výsledek</h3><p style="white-space: pre-wrap;">${result}</p><button class="game-btn" onclick="this.parentElement.parentElement.remove(); document.body.querySelector('div[style*=\\'background: rgba\\']').remove(); Game.save(); UI.renderAll();">Zavřít</button>`;
            });
        });
    }
};

// ============================================================
// RANK SYSTEM v1.0 – Světská a klášterní kariérní dráha
// Časové zasazení: ~1455–1490 (střet rukopisu a knihtisku)
// ============================================================
