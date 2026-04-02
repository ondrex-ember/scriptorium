const UI = {
    currentInvFilter: 'all',
    currentFilter: 'all',
    switchScreen: function(name, btn) {
        document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
        document.getElementById('screen-'+name).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'));
        if(btn) btn.classList.add('active');
        if(name === 'garden') this.renderGarden();
        if(name === 'library') {
            // Aktivovat výchozí tab Knihy
            const defaultBtn = document.querySelector('#screen-library .filter-btn');
            this.switchLibraryTab('books', defaultBtn);
        }
        if(name === 'settings') {
            const themeSelector = document.getElementById('theme-selector');
            if(themeSelector) {
                themeSelector.value = GameState.settings.theme || 'default';
            }
        }
    },
	renderAll: function() { 
		this.renderInventory(); 
		this.renderCrafting(); 
		this.renderScriptorium(); 
		this.renderGarden(); 
		this.renderActions(); 
		this.updateStreak(); 
		this.renderWell(); 
	},
		
renderActions: function() {
    const el = document.getElementById('workspace-actions');
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    let newHTML = "";
    ActionsDB.forEach(act => {
        // === SPECIAL HANDLING FOR WELL (MUST BE FIRST!) ===
        if (act.id === 'well_water') {
            const hasWell = GameState.well && GameState.well.built;
            if (!hasWell) return; // Skip if no well
            
            const hasPot = GameState.inventory.cooking_pot && GameState.inventory.cooking_pot > 0;
            const hasBucket = GameState.inventory.bucket && GameState.inventory.bucket > 0;
            
            if (!hasPot && !hasBucket) return; // Skip if no container
            
            // Well action passes checks - continue to render it below
        } else {
            // NORMAL REQUIREMENT CHECK - ONLY FOR NON-WELL ACTIONS
            if (act.req && !(GameState.inventory[act.req] > 0)) return;
        }
        // === END WELL HANDLING ===

        const actName = (lang === 'en' && act.name_en) ? act.name_en : act.name;
        const actDesc = (lang === 'en' && act.desc_en) ? act.desc_en : act.desc;

        let btnText = act.id === 'hunt' ? t('actions.hunt') : act.id === 'bark' ? t('actions.bark') : t('actions.default');
        let btnClass = "craft-btn"; 
        let btnDisabled = ""; 
        let infoText = actDesc;
        
        if (GameState.activeAction) {
            if (GameState.activeAction.id === act.id) {
                const elapsed = Date.now() - GameState.activeAction.startTime;
                const totalDur = GameState.activeAction.endTime - GameState.activeAction.startTime;
                const remaining = Math.max(0, Math.ceil((GameState.activeAction.endTime - Date.now()) / 1000));
                if (remaining > 0) {
                    const m = Math.floor(remaining / 60); 
                    const s = remaining % 60;
                    const currentLoot = Math.floor(GameState.activeAction.multiplier * (elapsed / totalDur));
                    btnText = `${t('actions.cancel')} (${currentLoot}/${GameState.activeAction.multiplier})`; 
                    btnClass += " cancel";
                    infoText = `${t('actions.remaining')} ${m}:${s < 10 ? '0' : ''}${s}`;
                } else { 
                    btnText = t('actions.claim'); 
                    btnClass += " claim"; 
                    infoText = t('actions.done'); 
                }
            } else {
                if (act.id === 'basic' || act.id === 'nature') { 
                    btnText = t('actions.quick'); 
                    btnClass += " instant"; 
                    infoText = t('actions.quickDesc'); 
                } else { 
                    btnDisabled = "disabled"; 
                    infoText = t('actions.waiting'); 
                }
            }
        } else if (GameState.selectedDuration > 0) {
            btnText += ` (${GameState.selectedDuration}m)`;
        }
        
        newHTML += `<div class="card"><div class="item-icon">${act.icon}</div><div><strong>${actName}</strong><div class="text-sm">${infoText}</div></div><button class="${btnClass}" onclick="Game.scavenge('${act.id}')" ${btnDisabled}>${btnText}</button></div>`;
    });
    
    if (el.innerHTML !== newHTML) el.innerHTML = newHTML;
},

    renderInventory: function() {
        const el = document.getElementById('inventory-grid'); el.innerHTML = "";
        Object.entries(GameState.inventory).forEach(([id, qty]) => {
            const item = ItemsDB[id];
            if (this.currentInvFilter !== 'all' && item.type !== this.currentInvFilter) return;
            
            let eatBtn = "";
            if(item.type === 'food') {
                eatBtn = `<button class="craft-btn" onclick="Game.eat('${id}')" style="margin-left:auto;">${t('game.eat')}</button>`;
            }
            
            el.innerHTML += `<div class="card"><div class="item-icon">${item.icon}</div><div><strong>${iName(id)}</strong> x${qty}<div class="text-sm">${iDesc(id)}</div></div>${eatBtn}</div>`;
        });
    },
    filterInventory: function(cat, btn) {
        this.currentInvFilter = cat;
        const container = document.getElementById('inv-filter-bar');
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); this.renderInventory();
    },
    renderCrafting: function() {
        const el = document.getElementById('crafting-list'); el.innerHTML = "";
        RecipesDB.forEach(r => {
            if(r.locked && !GameState.unlockedRecipes.includes(r.id)) return;
            if(this.currentFilter !== 'all' && r.cat !== this.currentFilter) return;
            const prod = ItemsDB[r.output]; let reqStr = ""; let can = true;
            for(let [id, amt] of Object.entries(r.req)) {
                const has = GameState.inventory[id] || 0; if((amt > 0 && has < amt) || (amt === 0 && !has)) can = false;
                reqStr += `<span class="${(amt>0&&has<amt)||(amt===0&&!has)?'text-danger':''}">${amt===0?t('game.required'):amt+'x'} ${iName(id)}</span>, `;
            }
            const blindIcon = r.blind ? " 🌑" : "";
            const blindClass = r.blind ? " blind-recipe" : "";
            el.innerHTML += `<div class="card${blindClass}" style="opacity:${can?1:0.6}"><div class="item-icon">${prod.icon}</div><div style="flex:1"><strong>${iName(r.output)}${blindIcon}</strong><div class="text-sm">${reqStr.slice(0,-2)}</div></div><button class="craft-btn" onclick="Game.craft('${r.id}')" ${can?'':'disabled'}>${t('craft.btn')}</button></div>`;
        });

    },
	
	// === RENDER WELL UI === (PŘIDAT na konec UI.renderCraft nebo vytvoř novou funkci)

	renderWell: function() {
		const hasWell = GameState.well && GameState.well.built;
		
		const notBuilt = document.getElementById('well-not-built');
		const built = document.getElementById('well-built');
		
		if (!notBuilt || !built) return; // Element not in DOM yet
		
		if (!hasWell) {
			notBuilt.style.display = 'block';
			built.style.display = 'none';
		} else {
			notBuilt.style.display = 'none';
			built.style.display = 'block';
			
			// Update level text
			const levelText = document.getElementById('well-level-text');
			if (levelText) {
				const levelNames = {
					"basic": "Základní",
					"stone": "Kamenná",
					"blessed": "Posvěcená"
				};
				levelText.textContent = levelNames[GameState.well.level] || "Neznámá";
			}
			
			// Update condition
			const condText = document.getElementById('well-condition-text');
			if (condText) {
				if (GameState.well.condition === "clean") {
					condText.textContent = "✓ Čistá";
					condText.style.color = "#4ade80";
				} else if (GameState.well.condition === "dirty") {
					condText.textContent = "⚠️ Znečištěná";
					condText.style.color = "#fbbf24";
				} else {
					condText.textContent = "💥 Rozbitá";
					condText.style.color = "#f87171";
				}
			}
			
			// Show/hide buttons
			const btnClean = document.getElementById('btn-clean-well');
			const btnRepair = document.getElementById('btn-repair-well');
			const btnUpgrade = document.getElementById('btn-upgrade-stone');
			
			if (btnClean) btnClean.style.display = GameState.well.condition === "dirty" ? "inline-block" : "none";
			if (btnRepair) btnRepair.style.display = GameState.well.condition === "broken" ? "inline-block" : "none";
			if (btnUpgrade) {
				const canUpgrade = GameState.well.level === "basic" && 
								  GameState.researchedTechs.includes("tech_well_stone");
				btnUpgrade.style.display = canUpgrade ? "inline-block" : "none";
			}
		}
	},
	
	
    renderScriptorium: function() {
        const el = document.getElementById('lore-research-content'); const res = GameState.inventory['research'] || 0;
        let h = `<div style="text-align:center;margin-bottom:15px;border:1px solid var(--accent-gold);padding:10px;">Zápisky: <strong>${res}</strong> 📜</div>`;
        TechTree.forEach(t => {
            const done = GameState.researchedTechs.includes(t.id);
            let canResearch = res >= t.cost;
            let reqText = "";
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const displayName = (lang !== 'cs' && t.name_en) ? t.name_en : t.name;
            const displayDesc = (lang !== 'cs' && t.desc_en) ? t.desc_en : t.desc;

            // Check requirements
            if(t.requires && !done) {
                const missing = t.requires.find(req => !GameState.researchedTechs.includes(req));
                if(missing) {
                    canResearch = false;
                    const reqTech = TechTree.find(x => x.id === missing);
                    const reqName = (lang !== 'cs' && reqTech.name_en) ? reqTech.name_en : reqTech.name;
                    reqText = `<div class="text-sm text-danger">${t('game.techRequired')} ${reqName}</div>`;
                }
            }

            h += `<div class="card" style="border-color:${done?'var(--accent-gold)':'var(--ink-secondary)'}"><div class="item-icon" style="background:${done?'#c5a059':'#e8dec0'}">${done?'🎓':'📖'}</div><div style="flex:1"><strong>${displayName}</strong><div class="text-sm">${displayDesc}</div>${typeof TechLoreDB !== 'undefined' && TechLoreDB[t.id] ? `<div class="text-sm" style="margin-top:8px;padding:8px;background:rgba(197,160,89,0.1);border-left:3px solid var(--accent-gold);font-style:italic;">${TechLoreDB[t.id]}</div>` : ''}${reqText}</div>${done?`<span style="font-weight:bold;color:var(--accent-gold)">${t('game.techDone')}</span>`:`<button class="craft-btn" onclick="Game.study('${t.id}')" ${canResearch?'':'disabled'}>${t('game.techStudy')} (${t.cost} 📜)</button>`}</div>`;
        });
        el.innerHTML = h;
    },
    renderCodex: function() {
        const el = document.getElementById('lore-codex-content');
        const discovered = GameState.discoveredLore.length;
        const total = Object.keys(LoreDB).length;
        
        let h = `<div style="text-align:center;margin-bottom:15px;border:1px solid var(--accent-gold);padding:10px;">Objeveno: <strong>${discovered}/${total}</strong> 📚</div>`;
        
        // Group by category
        const categories = {};
        Object.keys(LoreDB).forEach(id => {
            const cat = LoreDB[id].category;
            if(!categories[cat]) categories[cat] = [];
            categories[cat].push(id);
        });
        
        Object.keys(categories).sort().forEach(cat => {
            h += `<h3 style="margin-top:20px; margin-bottom:10px; font-size:1.1rem; color:var(--accent-gold);">${cat}</h3>`;
            categories[cat].forEach(id => {
                const lore = LoreDB[id];
                const isDiscovered = GameState.discoveredLore.includes(id);
                const item = ItemsDB[id];
                
                if(isDiscovered) {
                    h += `<div class="card" style="flex-direction:column; align-items:flex-start; border-color:var(--accent-gold); background:rgba(197,160,89,0.1);">`;
                    h += `<div style="display:flex; align-items:center; gap:12px; width:100%; margin-bottom:8px;">`;
                    h += `<div class="item-icon">${item.icon}</div>`;
                    h += `<strong style="flex:1;">${lore.title}</strong>`;
                    h += `</div>`;
                    h += `<div class="text-sm" style="white-space:pre-line; line-height:1.6;">${lore.text}</div>`;
                    h += `</div>`;
                } else {
                    h += `<div class="card" style="opacity:0.4;">`;
                    h += `<div class="item-icon">❓</div>`;
                    h += `<div><strong>???</strong><div class="text-sm">Neobjeveno</div></div>`;
                    h += `</div>`;
                }
            });
        });
        
        el.innerHTML = h;
    },

	switchLoreTab: function(tab, btn) {
		// Hide all tabs
		document.getElementById('lore-research-content').style.display = 'none';
		document.getElementById('lore-codex-content').style.display = 'none';
		document.getElementById('lore-notebooks-content').style.display = 'none';
		document.getElementById('lore-achievements-content').style.display = 'none';

		// Remove active class from all buttons
		document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
		if (btn) btn.classList.add('active');

		// Show selected tab
		if (tab === 'research') {
			document.getElementById('lore-research-content').style.display = 'block';
			UI.renderResearch();
		} else if (tab === 'codex') {
			document.getElementById('lore-codex-content').style.display = 'block';
			UI.renderCodex();
		} else if (tab === 'notebooks') {
			document.getElementById('lore-notebooks-content').style.display = 'block';
			UI.renderNotebooks();
		} else if (tab === 'achievements') {
			document.getElementById('lore-achievements-content').style.display = 'block';
			UI.renderAchievements();
		}
	},

	switchLibraryTab: function(tab, btn) {
		// Hide all library tabs
		const tabs = ['books', 'records', 'iching', 'news'];
		tabs.forEach(t => {
			const el = document.getElementById('library-' + t + '-content');
			if (el) el.style.display = 'none';
		});

		// Remove active from all filter buttons in library screen
		const wrapper = document.getElementById('library-content-wrapper');
		if (wrapper) wrapper.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
		if (btn) btn.classList.add('active');

		// Show selected tab
		if (tab === 'books') {
			const el = document.getElementById('library-books-content');
			if (el) { el.style.display = 'block'; UI.renderLibrary(); }
		} else if (tab === 'records') {
			const el = document.getElementById('library-records-content');
			if (el) { el.style.display = 'block'; UI.renderRecords(); }
		} else if (tab === 'iching') {
			const el = document.getElementById('library-iching-content');
			if (el) { el.style.display = 'block'; UI.renderIChing(); }
		} else if (tab === 'news') {
			const el = document.getElementById('library-news-content');
			if (el) { el.style.display = 'block'; UI.renderLibraryNews(); }
		}
	},

	renderLibraryNews: function() {
		const el = document.getElementById('library-news-content');
		if (!el) return;
		const day = GameState.library ? Math.floor((Date.now() - new Date(GameState.library.startDate).getTime()) / 86400000) : 0;

		// Narativní kotvy pro volbu role — rostou postupně s dny
		const newsItems = [
			{ minDay: 0,  icon: '✉️', from: 'Starý Písař', text: 'Víš, že v klášteře za kopcem opisují celé noci? Prý mají pergamen z vlastních ovcí.' },
			{ minDay: 3,  icon: '📜', from: 'Neznámý',     text: 'Byl jsem v refektáři. Četli tam rukopis který nikdo z nás nikdy neviděl. Říkali mu Regula.' },
			{ minDay: 7,  icon: '✉️', from: 'Starý Písař', text: 'Hledají zkušeného písaře do kláštera sv. Prokopa. Práce pro Boha, ne pro trh. Přemýšlím.' },
			{ minDay: 10, icon: '🔔', from: 'Z kláštera',  text: 'Slyšel jsi ranní zvony? Oni píší od Matutina. My píšeme jen za denního světla. Možná nám něco uniká.' },
			{ minDay: 15, icon: '📜', from: 'Neznámý',     text: 'Zákazník přinesl stránku z Mohuče. Říká tomu Druk. Rychlé. Bez duše. Ale levné.' },
			{ minDay: 20, icon: '✉️', from: 'Starý Písař', text: 'Přišel za mnou bratr z kláštera. Nabídl výměnu — naše papíry za jejich pergamen. Dobrý obchod?' },
			{ minDay: 25, icon: '🔔', from: 'Z kláštera',  text: 'Opat hledá písaře který zná galický inkoust. Prý pro zvláštní zakázku. Biskupa.' },
			{ minDay: 28, icon: '✉️', from: 'Starý Písař', text: 'Rozhodl ses kdo jsi? Řemeslník — nebo služebník? Obě cesty jsou čestné. Ale nejsou stejné.' },
		].filter(n => day >= n.minDay);

		if (newsItems.length === 0) {
			el.innerHTML = `<div style="text-align:center;padding:30px;opacity:0.6;">
				<div style="font-size:2rem;">📭</div>
				<p>Zatím žádné zprávy. Pokračuj v práci.</p>
			</div>`;
			return;
		}

		let h = `<div style="margin-bottom:10px;font-style:italic;opacity:0.7;font-size:0.85rem;">Dopisy a zprávy které přišly do skriptoria...</div>`;
		// Nejnovější nahoře
		[...newsItems].reverse().forEach(n => {
			h += `<div style="margin-bottom:12px;padding:12px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:4px;">
				<div style="font-size:0.75rem;opacity:0.6;margin-bottom:4px;">${n.icon} Od: <strong>${n.from}</strong></div>
				<div style="font-size:0.9rem;font-style:italic;">"${n.text}"</div>
			</div>`;
		});
		el.innerHTML = h;
	},

    renderLibrary: function() {
        const el = document.getElementById('library-books-content');
        
        // Check unlocks
        if(typeof LibraryHelpers !== 'undefined') {
            LibraryHelpers.checkLibraryUnlocks();
        }
        
        const unlocked = GameState.library ? GameState.library.unlockedBooks.length : 0;
        const total = typeof LibraryDB !== 'undefined' ? LibraryDB.books.length : 0;
        const read = GameState.library ? GameState.library.readBooks.length : 0;
        
        let h = `
            <div style="text-align:center;margin-bottom:15px;border:1px solid var(--accent-gold);padding:10px;">
                📚 Knihovna: <strong>${unlocked}/${total}</strong> odemčeno | 
                📖 Přečteno: <strong>${read}/${total}</strong>
            </div>
            
            <div style="margin-bottom:20px;padding:15px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:5px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <div style="font-size:2rem;">🖋️</div>
                    <div style="flex:1;">
                        <strong>Starý Písař</strong>
                        <div class="text-sm" style="color:var(--ink-secondary);">
                            "Za 3x Papír ti odkryji jednu knihu předčasně..."
                        </div>
                    </div>
                    <button class="craft-btn" onclick="LibraryHelpers.scribeTrade()">
                        Obchod (3x 📄)
                    </button>
                </div>
            </div>
        `;
        
        if(typeof LibraryDB === 'undefined' || typeof GameState.library === 'undefined') {
            el.innerHTML = h + '<p>Knihovna není dostupná.</p>';
            return;
        }
        
        // Group by category
        Object.entries(LibraryDB.categories).forEach(([catId, catData]) => {
            const books = LibraryDB.books.filter(b => b.category === catId);
            const unlockedInCat = books.filter(b => GameState.library.unlockedBooks.includes(b.id));
            
            h += `<div style="margin-top:20px;">`;
            h += `<h3 style="color:var(--accent-gold);border-bottom:2px solid var(--accent-gold);padding-bottom:5px;">
                    ${catData.icon} ${catData.name} (${unlockedInCat.length}/${books.length})
                  </h3>`;
            
            books.forEach(book => {
                const isUnlocked = GameState.library.unlockedBooks.includes(book.id);
                const isRead = GameState.library.readBooks.includes(book.id);
                
                if (isUnlocked) {
                    h += `
                        <div class="card" style="border-color:${isRead?'var(--accent-gold)':'var(--ink-secondary)'};">
                            <div class="item-icon" style="background:${isRead?'#c5a059':'#e8dec0'}">
                                ${book.icon}
                            </div>
                            <div style="flex:1;">
                                <strong>${book.title}</strong> ${isRead?'✓':''}
                                <div class="text-sm">${book.author} (${book.year})</div>
                            </div>
                            <button class="craft-btn" onclick="LibraryHelpers.readBook('${book.id}')">
                                ${isRead?'Přečíst znovu':'Číst'}
                            </button>
                        </div>
                    `;
                } else {
                    const daysToUnlock = book.unlockDay - Math.floor(
                        (Date.now() - GameState.library.startDate) / (24 * 60 * 60 * 1000)
                    );
                    
                    h += `
                        <div class="card" style="opacity:0.5;">
                            <div class="item-icon" style="background:#666;">🔒</div>
                            <div style="flex:1;">
                                <strong>???</strong>
                                <div class="text-sm">Odemkne se za ${daysToUnlock} dní</div>
                            </div>
                        </div>
                    `;
                }
            });
            
            h += `</div>`;
        });
        
        el.innerHTML = h;
    },
    showBookModal: function(book) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--bg-parchment);
                color: var(--ink-primary);
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                padding: 30px;
                border: 2px solid var(--accent-gold);
                border-radius: 5px;
                position: relative;
            ">
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="position:absolute;top:10px;right:10px;background:var(--accent-wax);color:white;border:none;padding:5px 10px;cursor:pointer;border-radius:3px;">
                    ✕
                </button>
                
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="font-size:3rem;margin-bottom:10px;">${book.icon}</div>
                    <h2 style="margin:0;color:var(--accent-gold);">${book.title}</h2>
                    <div style="color:var(--ink-secondary);margin-top:5px;">
                        ${book.author} | ${book.year}
                    </div>
                </div>
                
                <div style="
                    font-family: 'Crimson Text', serif;
                    font-size: 1.1rem;
                    line-height: 1.8;
                    white-space: pre-wrap;
                ">
                    ${book.content}
                </div>

                ${(() => {
                    const spec = FontSpecimensDB.books[book.id];
                    if (!spec) return '';
                    return `
                    <div class="font-specimen">
                        <div class="font-specimen-label">✒️ Písmo té doby</div>
                        <div class="font-specimen-name">${spec.fontName}</div>
                        <div class="font-specimen-text ${spec.fontClass}">${spec.sample}</div>
                        <div class="font-specimen-context">${spec.context}</div>
                    </div>`;
                })()}
                
                <div style="text-align:center;margin-top:30px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="craft-btn">
                        Zavřít
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    renderAchievements: function() {
        const el = document.getElementById('lore-achievements-content');
        if(!GameState.achievements) {
            el.innerHTML = '<p>Achievements nejsou dostupné.</p>';
            return;
        }
        
        const unlocked = GameState.achievements.unlocked.length;
        const total = AchievementsDB.length;
        const progress = Math.floor((unlocked / total) * 100);
        
        let h = `<div style="text-align:center;margin-bottom:20px;border:1px solid var(--accent-gold);padding:15px;">`;
        h += `<div style="font-size:1.2rem; font-weight:bold; color:var(--accent-gold);">🏆 ${unlocked}/${total} (${progress}%)</div>`;
        h += `<div class="text-sm" style="margin-top:5px;">Achievementy odemčeny</div>`;
        h += `</div>`;
        
        // Group by category
        const categories = {};
        AchievementsDB.forEach(ach => {
            if(!categories[ach.category]) categories[ach.category] = [];
            categories[ach.category].push(ach);
        });
        
        Object.keys(categories).forEach(cat => {
            h += `<h3 style="margin-top:20px; margin-bottom:10px; font-size:1.1rem; color:var(--accent-gold);">${cat}</h3>`;
            categories[cat].forEach(ach => {
                const isUnlocked = GameState.achievements.unlocked.includes(ach.id);
                const borderColor = isUnlocked ? 'var(--accent-gold)' : 'var(--ink-secondary)';
                const bgColor = isUnlocked ? 'rgba(197,160,89,0.1)' : 'rgba(0,0,0,0.02)';
                const opacity = isUnlocked ? '1' : '0.5';
                
                h += `<div class="card" style="border-color:${borderColor}; background:${bgColor}; opacity:${opacity};">`;
                h += `<div class="item-icon" style="background:${isUnlocked ? '#c5a059' : '#e8dec0'}">${ach.icon}</div>`;
                h += `<div style="flex:1;">`;
                h += `<strong>${isUnlocked ? ach.name : '???'}</strong>`;
                h += `<div class="text-sm">${isUnlocked ? ach.desc : 'Neobjeveno'}</div>`;
                if(isUnlocked && ach.reward.research) {
                    h += `<div class="text-sm" style="color:var(--accent-gold); margin-top:4px;">Odměna: +${ach.reward.research} 📜</div>`;
                }
                h += `</div>`;
                if(isUnlocked) {
                    h += `<div style="font-size:1.5rem;">✅</div>`;
                } else {
                    h += `<div style="font-size:1.5rem; opacity:0.3;">🔒</div>`;
                }
                h += `</div>`;
            });
        });
        
        el.innerHTML = h;
    },
    renderNotebooks: function() {
        const el = document.getElementById('lore-notebooks-content');
        
        const hasAny = GameState.inventory['tabula'] > 0 ||
                       GameState.inventory['adversaria'] > 0 ||
                       GameState.inventory['vademecum'] > 0 ||
                       GameState.inventory['florilegium'] > 0 ||
                       GameState.inventory['enchiridion'] > 0;
        
        if(!hasAny) {
            let h = `<div style="padding:20px; background:rgba(0,0,0,0.05); border-radius:8px; text-align:center;">
                <div style="font-size:3rem; opacity:0.3; margin-bottom:10px;">🔒</div>
                <strong>Zatím nemáš žádný zápisník</strong>
                <p style="margin-top:10px; opacity:0.7;">
                    Odemkni tech "Základy Psaní" (3 research) a vycrafti svou první Tabulu!
                </p>
            </div>`;
            el.innerHTML = h;
            return;
        }
        
        // Render selector buttons
        let h = '<div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">';
        const types = [
            {id:'tabula', icon:'📋', name:'Tabula'},
            {id:'adversaria', icon:'📔', name:'Adversaria'},
            {id:'vademecum', icon:'📘', name:'Vademecum'},
            {id:'florilegium', icon:'🌸', name:'Florilegium'},
            {id:'enchiridion', icon:'📖', name:'Enchiridion'}
        ];
        types.forEach(t => {
            if(GameState.inventory[t.id] > 0) {
                h += `<button onclick="UI.renderNotebookInline('${t.id}')" class="craft-btn">${t.icon} ${t.name}</button>`;
            }
        });
        h += '</div>';
        h += '<div id="notebook-content-inline"></div>';
        
        el.innerHTML = h;
        
        // Auto-select first owned
        setTimeout(() => {
		if(GameState.inventory['tabula'] > 0) this.renderNotebookInline('tabula');
        else if(GameState.inventory['adversaria'] > 0) this.renderNotebookInline('adversaria');
        else if(GameState.inventory['vademecum'] > 0) this.renderNotebookInline('vademecum');
        else if(GameState.inventory['florilegium'] > 0) this.renderNotebookInline('florilegium');
        else if(GameState.inventory['enchiridion'] > 0) this.renderNotebookInline('enchiridion');
		}, 0);

    },
    renderNotebookInline: function(type) {
        // Simply call NotebookSystem.render with inline container
        NotebookSystem.render(type, 'notebook-content-inline');
    },
    
	
	// ========== HTML/RENDERING UPDATE pro UI.renderRecords() ==========

renderRecords: function() {
    const el = document.getElementById('library-records-content');
    
    // Check tech unlock
    const hasTech = GameState.researchedTechs.includes('tech_games');
    
    if(!hasTech) {
        let h = `<div style="padding:20px; background:rgba(0,0,0,0.05); border-radius:8px; text-align:center;">
            <div style="font-size:3rem; opacity:0.3; margin-bottom:10px;">🔒</div>
            <strong>Zamčeno</strong>
            <p style="margin-top:10px; opacity:0.7;">
                Odemkni tech "Hry a Záznamy" pro přístup k mini-games a statistikám.
            </p>
        </div>`;
        el.innerHTML = h;
        return;
    }
    
    let h = '';
    
    // ========== GAMES SECTION ==========
    h += '<h2 style="margin-bottom: 20px; color: var(--ink-primary);">🎮 Mini-Games</h2>';
    h += '<div class="games-grid">';
    
    // ========== TIER 1: MEMORY GAME ==========
    const hasCards = GameState.inventory['playing_cards'] > 0;
    
    h += `<div class="game-card">`;
    h += `<span class="game-icon">🎴</span>`;
    h += `<div class="game-title">Memory Game</div>`;
    h += `<div class="game-desc">Najdi páry discovered items!</div>`;
    if(hasCards) {
        h += `<button class="craft-btn" onclick="MemoryGame.start()">Hrát 🎮</button>`;
    } else {
        h += `<div class="game-unlock-text">Vyrobit playing_cards</div>`;
    }
    h += `</div>`;
    
    // ========== TIER 2: ROYAL GAME OF UR ==========
    const hasUrBoard = GameState.inventory['ur_board'] > 0;
    const hasUrTech = GameState.researchedTechs.includes('tech_ur_game');
    
    h += `<div class="game-card ${hasUrTech ? '' : 'locked'}">`;
    if(!hasUrTech) h += `<span class="game-lock-badge">🔒</span>`;
    h += `<span class="game-icon">🎲</span>`;
    h += `<div class="game-title">Royal Game of Ur</div>`;
    h += `<div class="game-desc">Nejstarší hra světa (2600 př.n.l.)</div>`;
    if(!hasUrTech) {
        h += `<div class="game-unlock-text">Tech: Starobylé Hry (6 Research)</div>`;
    } else if(!hasUrBoard) {
        h += `<div class="game-unlock-text">Vyrobit ur_board</div>`;
    } else {
        h += `<button class="craft-btn" onclick="RoyalGameOfUr.start()">VS AI 🤖</button>`;
        h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.start()" style="background: var(--accent-gold);">Solo 🧩</button>`;
    }
    h += `</div>`;
    
    // ========== TIER 3: PRIMERO ==========
    const hasPrimero = GameState.inventory['primero_deck'] > 0;
    const hasPrimeroTech = GameState.researchedTechs.includes('tech_primero');
    
    h += `<div class="game-card ${hasPrimeroTech ? '' : 'locked'}">`;
    if(!hasPrimeroTech) h += `<span class="game-lock-badge">🔒</span>`;
    h += `<span class="game-icon">🃏</span>`;
    h += `<div class="game-title">Primero</div>`;
    h += `<div class="game-desc">Předchůdce pokeru (1530)</div>`;
    if(!hasPrimeroTech) {
        h += `<div class="game-unlock-text">Tech: Primero (10 Research)</div>`;
    } else if(!hasPrimero) {
        h += `<div class="game-unlock-text">Vyrobit primero_deck</div>`;
    } else {
        h += `<button class="craft-btn" onclick="PrimeroGame.start()">Hrát 🎮</button>`;
    }
    h += `</div>`;
    
    // ========== TIER 4: KARNÖFFEL ==========
    const hasKarnoffel = GameState.inventory['karnoffel_deck'] > 0;
    const hasKarnoffelTech = GameState.researchedTechs.includes('tech_karnoffel');
    
    h += `<div class="game-card ${hasKarnoffelTech ? '' : 'locked'}">`;
    if(!hasKarnoffelTech) h += `<span class="game-lock-badge">🔒</span>`;
    h += `<span class="game-icon">🎴</span>`;
    h += `<div class="game-title">Karnöffel</div>`;
    h += `<div class="game-desc">Nejstarší trumfová hra (1426)</div>`;
    if(!hasKarnoffelTech) {
        h += `<div class="game-unlock-text">Tech: Karnöffel (12 Research)</div>`;
    } else if(!hasKarnoffel) {
        h += `<div class="game-unlock-text">Vyrobit karnoffel_deck</div>`;
    } else {
        h += `<button class="craft-btn" onclick="KarnoffelGame.start()">Hrát 🎮</button>`;
    }
    h += `</div>`;
    
    // ========== TIER 5: FREECELL ==========
    const hasFrenchDeck = GameState.inventory['french_deck'] > 0;
    const hasFreeCellTech = GameState.researchedTechs.includes('tech_freecell');
    
    h += `<div class="game-card ${hasFreeCellTech ? '' : 'locked'}">`;
    if(!hasFreeCellTech) h += `<span class="game-lock-badge">🔒</span>`;
    h += `<span class="game-icon">🂡</span>`;
    h += `<div class="game-title">FreeCell Solitaire</div>`;
    h += `<div class="game-desc">Logická karetní hra</div>`;
    if(!hasFreeCellTech) {
        h += `<div class="game-unlock-text">Tech: Solitér Mistryně (15 Research)</div>`;
    } else if(!hasFrenchDeck) {
        h += `<div class="game-unlock-text">Vyrobit french_deck</div>`;
    } else {
        h += `<button class="craft-btn" onclick="FreeCellGame.start()">Hrát 🎮</button>`;
    }
    h += `</div>`;
    
    // ========== TIER 6: RITHMOMACHIA ==========
    const hasRithmo = GameState.inventory['rithmomachia_board'] > 0;
    const hasRithmoTech = GameState.researchedTechs.includes('tech_rithmomachia');
    
    h += `<div class="game-card ${hasRithmoTech ? '' : 'locked'}">`;
    if(!hasRithmoTech) h += `<span class="game-lock-badge">🔒</span>`;
    h += `<span class="game-icon">🔢</span>`;
    h += `<div class="game-title">Rithmomachia</div>`;
    h += `<div class="game-desc">"Šachy Filozofů" (1030)</div>`;
    if(!hasRithmoTech) {
        h += `<div class="game-unlock-text">Tech: Filozofická Matematika (20 Research)</div>`;
    } else if(!hasRithmo) {
        h += `<div class="game-unlock-text">Vyrobit rithmomachia_board</div>`;
    } else {
        h += `<button class="craft-btn" onclick="Rithmomachia.start()">Hrát 🎮</button>`;
        h += `<button class="craft-btn" onclick="Rithmomachia.showRules()" style="background: var(--accent-gold);">📖 Pravidla</button>`;
    }
    h += `</div>`;
    
    h += '</div>'; // Close games-grid
    
    // ========== PERSONAL STATISTICS ==========
    h += `<h2 style="margin-top: 40px; margin-bottom: 20px; color: var(--ink-primary);">📊 Osobní Statistiky</h2>`;
    h += `<div class="card" style="flex-direction:column; align-items:stretch;">`;
    
    const stats = GameState.achievements.stats;
    const totalItems = Object.keys(GameState.inventory).length;
    const totalTech = GameState.researchedTechs.length;
    
    h += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.9rem;">`;
    
    // Row 1
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">
            <strong>📦 Items</strong><div style="font-size:1.2rem; margin-top:4px;">${totalItems}</div>
          </div>`;
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">
            <strong>📖 Discovered</strong><div style="font-size:1.2rem; margin-top:4px;">${GameState.discoveredLore.length}/64</div>
          </div>`;
    
    // Row 2
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-wax);">
            <strong>⚒️ Crafts</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.itemsCrafted}</div>
          </div>`;
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-wax);">
            <strong>🌿 Sklizně</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.harvests}</div>
          </div>`;
    
    // Row 3
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">
            <strong>📜 Research získáno</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.totalResearchGained || stats.researchCount}</div>
          </div>`;
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">
            <strong>👑 Tech</strong><div style="font-size:1.2rem; margin-top:4px;">${totalTech}/27</div>
          </div>`;
    
    // Row 4
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #8a3324;">
            <strong>🎮 Hry vyhráno</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.totalGamesPlayed || 0}</div>
          </div>`;
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #4caf50;">
            <strong>🍖 Jídel</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.mealsEaten || 0}</div>
          </div>`;
    
    // Row 5
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #fbbf24;">
            <strong>🕯️ Svíčky</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.candlesLit || 0}</div>
          </div>`;
    h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #06b6d4;">
            <strong>💧 Well</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.wellUses || 0}</div>
          </div>`;
    
    // Row 6 - Full width
    h += `<div style="grid-column:1/-1; padding:8px; background:rgba(197,160,89,0.1); border-left:3px solid var(--accent-gold);">
            <strong>🔥 Streak</strong><div style="font-size:1.2rem; margin-top:4px;">${GameState.dailyRewards.streak} dní (max: ${stats.longestStreak || 0})</div>
          </div>`;
    
    h += `</div></div>`;
    
    // ========== BACKUP SECTION ==========
    h += `
        <div style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 10px;">
            <h3>💾 Záloha Save</h3>
            <p style="font-size: 13px; opacity: 0.8; margin-bottom: 15px;">
                Exportuj save jako zálohu nebo přenes na jiné zařízení.
            </p>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="Game.exportSave()" class="craft-btn" style="background: #4a7c59;">
                    📥 Stáhnout Save
                </button>
                
                <button onclick="Game.triggerImport()" class="craft-btn" style="background: #7c594a;">
                    📤 Nahrát Save
                </button>
            </div>
            
            <p style="font-size: 11px; opacity: 0.6; margin-top: 10px;">
                💡 Před velkými experimenty doporučujeme stáhnout zálohu!<br>
                Pro reset hry jdi do Nastavení.
            </p>
        </div>
    `;
    
    el.innerHTML = h;
    
    // Initialize game renders if active
    if(hasUrBoard) {
        if(RoyalGameOfUr.gameActive) RoyalGameOfUr.render();
        if(RoyalGameOfUrSolo.gameActive) RoyalGameOfUrSolo.render();
    }
    if(hasPrimero && PrimeroGame.gameActive) PrimeroGame.render();
    if(hasKarnoffel && KarnoffelGame.gameActive) KarnoffelGame.render();
    if(hasFrenchDeck && FreeCellGame.gameActive) FreeCellGame.render();
    if(hasRithmo && Rithmomachia.gameActive) Rithmomachia.render();
},

	
    renderGarden: function() {
        const el = document.getElementById('garden-container'); el.innerHTML = "";
        
        // Calculate growth time with tech bonuses
        let growthSpeed = CONFIG.GROWTH_SPEED;
        if(GameState.researchedTechs.includes('tech_advanced_farming')) {
            growthSpeed *= 1.5; // +50% faster growth
        }
        const needed = CONFIG.BASE_GROWTH_TIME / growthSpeed;
        
        GameState.garden.forEach((plot, idx) => {
            let c = "", b = "", typeLabel = "";
            
            if(plot.locked) {
                c = `<div class="plot-soil" style="opacity:0.2">🔒</div><div class="text-sm">Zamčeno</div>`;
                b = `<button class="craft-btn" disabled>Tech Tree</button>`;
            }
            else if (plot.state === 0) { 
                if(plot.cropType === 'herb') typeLabel = "Byliny";
                else if(plot.cropType === 'vegetable') typeLabel = "Zelenina";
                else if(plot.cropType === 'special') typeLabel = "Speciál";
                c = `<div class="plot-soil" style="opacity:0.3">🟫</div><div class="text-sm">${typeLabel}</div>`; 
                b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">Zúrodnit</button>`; 
            }
            else if (plot.state === 1) { 
                if(plot.cropType === 'herb') typeLabel = "Byliny";
                else if(plot.cropType === 'vegetable') typeLabel = "Zelenina";
                else if(plot.cropType === 'special') typeLabel = "Jakékoliv";
                c = `<div class="plot-soil">🟫</div><div class="text-sm">${typeLabel}</div>`; 
                b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">Zasít</button>`; 
            }
            else if (plot.state === 2) {
                const cropIcon = ItemsDB[plot.crop] ? ItemsDB[plot.crop].icon : '🌱';
                if (!plot.water) { 
                    c = `<div class="plot-soil">${cropIcon}</div><div class="text-sm">Suché</div>`; 
                    b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">Zalít</button>`; 
                }
                else if (Date.now() < plot.plantedAt + needed) { 
                    c = `<div class="plot-soil" style="color:#888">${cropIcon}</div><div class="text-sm">Roste...</div>`; 
                    b = `<button class="craft-btn" disabled>Čekat</button>`; 
                }
                else { 
                    c = `<div class="plot-soil" style="color:#4caf50">${cropIcon}</div><div class="text-sm">Vzrostlé</div>`; 
                    b = `<button class="craft-btn" onclick="Game.farmAction(${idx})">Sklidit</button>`; 
                }
            }
            el.innerHTML += `<div class="garden-plot">${c}<div style="margin-top:auto">${b}</div></div>`;
        });
    },
    filterCrafting: function(cat, btn) { this.currentFilter = cat; if(btn) { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); } this.renderCrafting(); },
    notify: function(m, e) { const n = document.createElement('div'); n.className = 'toast'; n.innerText = m; if(e) n.style.borderColor = 'red'; document.getElementById('notification-area').appendChild(n); setTimeout(() => n.remove(), 2600); },

    showFontSpecimenModal: function(techName, spec) {
        const existing = document.getElementById('font-specimen-modal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'font-specimen-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:1500;display:flex;justify-content:center;align-items:center;';
        modal.innerHTML = `
            <div style="background:var(--bg-parchment);border:2px solid var(--accent-gold);padding:28px;max-width:480px;width:92%;box-shadow:0 0 60px rgba(0,0,0,0.8);animation:fadeIn 0.4s;">
                <div style="text-align:center;margin-bottom:16px;">
                    <div style="font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;color:var(--ink-secondary);">Odemčeno · ${techName}</div>
                    <h3 style="color:var(--accent-gold);margin:8px 0 0 0;font-size:1rem;">✒️ Písmo té doby</h3>
                </div>
                <div class="font-specimen">
                    <div class="font-specimen-name">${spec.fontName}</div>
                    <div class="font-specimen-text ${spec.fontClass}">${spec.sample}</div>
                    <div class="font-specimen-context">${spec.context}</div>
                </div>
                <div style="text-align:center;margin-top:20px;">
                    <button onclick="document.getElementById('font-specimen-modal').remove()" class="craft-btn">Zavřít</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    },

    showLangPicker: function() {
        const modal = document.getElementById('lang-picker-modal');
        if (modal) modal.style.display = 'flex';
    },

    pickLanguage: function(lang) {
        // 1. Zavřít lang picker
        const picker = document.getElementById('lang-picker-modal');
        if (picker) picker.style.display = 'none';

        // 2. Uložit volbu
        GameState.settings.language = lang;
        GameState.settings.langChosen = true;

        // 3. Aplikovat překlad na UI
        LangSystem.apply(lang);

        // 4. Aktualizovat consent banner text na správný jazyk
        const L = STRINGS[lang] || STRINGS.cs;
        const ctEl = document.getElementById('consent-text');
        const cmEl = document.getElementById('consent-more');
        const cgEl = document.getElementById('consent-btn-grant');
        const cdEl = document.getElementById('consent-btn-deny');
        if (ctEl) ctEl.innerHTML = L.consent.text;
        if (cmEl) cmEl.textContent = L.consent.moreInfo;
        if (cgEl) cgEl.textContent = L.consent.grant;
        if (cdEl) cdEl.textContent = L.consent.deny;

        // 5. Uložit + pokračovat v chain
        Game.save();
        this.afterLangPicked();
    },

    afterLangPicked: function() {
        // Pokračuje chain: consent (pokud třeba) → welcome modal
        const consent = localStorage.getItem('scriptorium_consent');
        if (consent === null) {
            // Zobraz consent banner
            const banner = document.getElementById('consent-banner');
            if (banner) banner.style.display = 'block';
            // _afterDecision() zobrazí welcome modal po rozhodnutí
        } else {
            // Consent byl rozhodnut dříve — jdi rovnou na welcome
            if (consent === 'granted') loadGA();
            setTimeout(() => {
                this.showWelcomeModal();
                GameState.flags.firstVisit = false;
                Game.save();
            }, 400);
        }
    },

    showWelcomeModal: function() {
        const L = STRINGS[GameState.settings.language || 'cs'];
        const el = document.getElementById('welcome-text');
        if (el) el.innerHTML = L.welcome.text;
        const btn = document.getElementById('welcome-btn');
        if (btn) btn.textContent = L.welcome.btn;
        const modal = document.getElementById('welcome-modal');
        if (modal) modal.style.display = 'flex';
    },

    closeWelcomeModal: function() {
        const modal = document.getElementById('welcome-modal');
        if (modal) modal.style.display = 'none';
        Analytics.welcomeModalClosed();
        setTimeout(() => UI.notify(t('notify.kindleHint')), 400);
    },

    showFireoutModal: function(daysSince) {
        const days = Math.floor(daysSince);
        const lang = GameState.settings.language || 'cs';
        const L = STRINGS[lang] || STRINGS.cs;
        const fo = L.fireout;

        // dayWord — CS má 3 tvary, EN má jen 2
        let dayWord;
        if (lang === 'cs') {
            dayWord = days === 1 ? fo.dayWord.one : (days < 5 ? fo.dayWord.few : fo.dayWord.many);
        } else {
            dayWord = days === 1 ? fo.dayWord.one : fo.dayWord.many;
        }

        const texts = fo.texts.map(t => t.replace('{days}', days).replace('{dayWord}', dayWord));

        const headEl = document.getElementById('fireout-heading');
        const textEl = document.getElementById('fireout-text');
        const daysEl = document.getElementById('fireout-days');
        const btnEl  = document.getElementById('fireout-btn');

        if (headEl) headEl.textContent = fo.heading;
        if (textEl) textEl.innerHTML = texts[Math.floor(Math.random() * texts.length)];
        if (daysEl) daysEl.innerHTML = `${fo.absence} <strong>${days} ${dayWord}</strong>`;
        if (btnEl)  btnEl.textContent = fo.btn;

        const modal = document.getElementById('fireout-modal');
        if (modal) modal.style.display = 'flex';
    },

    closeFireoutModal: function() {
        const modal = document.getElementById('fireout-modal');
        if (modal) modal.style.display = 'none';
        // Re-render aby krb ukázal vyhaslý stav
        Game.checkEnvironment();
        UI.renderAll();
    },
    showDailyRewardModal: function(bonusText, streak, fact, isStreakBonus) {
        const modal = document.getElementById('daily-reward-modal');
        const content = document.getElementById('daily-reward-content');
        const factEl = document.getElementById('daily-fact');
        
        let html = `<div style="font-size:1.5rem; font-weight:bold; color:var(--accent-gold); margin-bottom:10px;">${bonusText}</div>`;
        html += `<div style="font-size:0.9rem; color:var(--ink-secondary);">Streak: ${streak} ${streak === 1 ? 'den' : (streak < 5 ? 'dny' : 'dní')} 🔥</div>`;
        
        if(isStreakBonus) {
            html += `<div style="margin-top:15px; padding:10px; background:rgba(197,160,89,0.2); border:1px solid var(--accent-gold); border-radius:4px; font-weight:bold;">🎉 Bonus za věrnost!</div>`;
        }
        
        content.innerHTML = html;
        factEl.innerHTML = `<strong>📜 Dnešní fakt:</strong><br><br>${fact}`;
        
        modal.style.display = 'flex';
    },
    closeDailyRewardModal: function() {
        document.getElementById('daily-reward-modal').style.display = 'none';
    },
    updateStreak: function() {
        const streakEl = document.getElementById('streak-display');
        const streakNum = document.getElementById('streak-number');
        const streak = GameState.dailyRewards.streak || 0;
        
        if(streak > 0) {
            streakNum.innerText = streak;
            streakEl.style.display = 'inline';
            streakEl.title = `Denní streak: ${streak} ${streak === 1 ? 'den' : (streak < 5 ? 'dny' : 'dní')} za sebou!`;
        } else {
            streakEl.style.display = 'none';
        }
    },
    
    openAboutModal: function() {
        document.getElementById('about-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    },
    
    closeAboutModal: function() {
        document.getElementById('about-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

	// ===============================================
	// NOTEBOOK SYSTEM - LOCAL ONLY (NO CLOUD)
	// ===============================================
