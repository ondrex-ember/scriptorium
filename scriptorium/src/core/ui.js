const UI = {
    currentInvFilter: 'all',
    currentFilter: 'all',
    currentScreen: 'home',
    _dirty: { home: false, inv: false, craft: false, lore: false, garden: false, cellarium: false },
    _hashInv: '', _hashCraft: '', _hashActions: '',
    switchScreen: function (name, btn) {
        document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
        document.getElementById('screen-' + name).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.currentScreen = name;
        if (this._dirty[name]) {
            this._dirty[name] = false;
            if (name === 'inv') { this.renderInventory(); }
            if (name === 'craft') { this.renderCrafting(); }
            if (name === 'lore') { this.renderScriptorium(); }
            if (name === 'garden') { this.renderGarden(); }
            if (name === 'home') { this.renderActions(); this.renderWell(); }
        }
        if (name === 'home') {
            const celEl = document.getElementById('home-cellarium-content');
            if (this._dirty.cellarium && celEl && celEl.style.display !== 'none') {
                this._dirty.cellarium = false;
                celEl.innerHTML = CellariumSystem.renderCellariumTab();
            }
        }
        if (name === 'garden') this.renderGarden();
        if (name === 'inv') this._updateInvFilterBar();
        if (name === 'library') {
            // Aktivovat výchozí tab Knihy
            const defaultBtn = document.querySelector('#screen-library .filter-btn');
            this.switchLibraryTab('books', defaultBtn);
        }
        if (name === 'settings') {
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                themeSelector.value = GameState.settings.theme || 'default';
            }

            // Load fire volume slider
            const fireVolumeSlider = document.getElementById('fire-volume-slider');
            if (fireVolumeSlider) {
                fireVolumeSlider.value = (GameState.settings.fireVolume || 0.5) * 100;
            }

            // Music track selector — zobrazit dle odemčených tierů
            const techs = GameState.researchedTechs || [];
            const secrets = GameState.secrets || {};
            const tier1 = techs.includes('tech_neuma_notation');
            const tier2 = techs.includes('tech_schola_cantorum');
            const tier3 = secrets.cellariumUnlocked || techs.includes('tech_cellarium');

            const trackSelector = document.getElementById('music-track-selector');
            const tier2Option = document.getElementById('music-tier2-option');
            const tier3Option = document.getElementById('music-tier3-option');

            if (trackSelector) {
                // Zobrazit selector pokud jsou odemčeny 2+ tiery
                const multiTier = (tier1 && tier2) || (tier1 && tier3) || (tier2 && tier3);
                trackSelector.style.display = multiTier ? 'block' : 'none';
            }
            if (tier2Option) tier2Option.style.display = tier2 ? 'flex' : 'none';
            if (tier3Option) tier3Option.style.display = tier3 ? 'flex' : 'none';

            // Nastavit aktuálně vybraný radio button
            const currentTier = (typeof audioSys !== 'undefined') ? audioSys.musicTier : (GameState.settings.musicTier || 1);
            const tierRadio = document.querySelector(`input[name="musicTier"][value="${currentTier}"]`);
            if (tierRadio) tierRadio.checked = true;

            // Music volume slider
            const musicVolumeSlider = document.getElementById('music-volume-slider');
            if (musicVolumeSlider) {
                musicVolumeSlider.value = (GameState.settings.musicVolume ?? 0.5) * 100;
            }

            // Music enabled checkbox
            const musicCheckbox = document.getElementById('music-enabled-checkbox');
            if (musicCheckbox) {
                musicCheckbox.checked = GameState.settings.musicEnabled !== false;
            }

            // Update hour chime settings visibility
            const canonicalUnlocked = GameState.researchedTechs.includes('tech_canonical_hours');
            const canonicalSection = document.getElementById('canonical-chime-section');
            const basicSection = document.getElementById('basic-chime-section');

            if (canonicalSection && basicSection) {
                if (canonicalUnlocked) {
                    canonicalSection.style.display = 'block';
                    basicSection.style.display = 'none';

                    // Set current values
                    const mode = GameState.settings.hourChimeMode || 'auto';
                    document.querySelector(`input[name="chimeMode"][value="${mode}"]`).checked = true;

                    const sound = GameState.settings.hourChimeSound || 'avemaria';
                    document.getElementById('chime-sound').value = sound;
                } else {
                    canonicalSection.style.display = 'none';
                    basicSection.style.display = 'block';

                    // Set basic checkbox
                    const basicEnabled = GameState.settings.hourChimeBasic !== false;
                    document.getElementById('hour-chime-basic').checked = basicEnabled;
                }
            }

            // Set quiet hours values
            const quietEnabled = document.getElementById('quiet-hours-enabled');
            if (quietEnabled) {
                quietEnabled.checked = GameState.settings.quietHoursEnabled || false;
            }

            const quietStart = document.getElementById('quiet-hours-start');
            if (quietStart) {
                quietStart.value = (GameState.settings.quietHoursStart || 22).toString();
            }

            const quietEnd = document.getElementById('quiet-hours-end');
            if (quietEnd) {
                quietEnd.value = (GameState.settings.quietHoursEnd || 6).toString();
            }
        }
    },
    renderAll: function () {
        const s = this.currentScreen || 'home';
        if (s === 'home') {
            this.renderActions();
            if (document.getElementById('home-mine-content') &&
                document.getElementById('home-mine-content').style.display !== 'none') {
                this.renderMineActions();
            }
            this.renderWell();
            this.updateStreak();
            const celEl = document.getElementById('home-cellarium-content');
            if (this._dirty.cellarium && celEl && celEl.style.display !== 'none') {
                this._dirty.cellarium = false;
                celEl.innerHTML = CellariumSystem.renderCellariumTab();
            }
        } else if (s === 'inv') { this.renderInventory(); }
        else if (s === 'craft') { this.renderCrafting(); }
        else if (s === 'lore') { this.renderScriptorium(); }
        else if (s === 'garden') { this.renderGarden(); }
        this.renderRecords();
        this.renderGamesTab();
        const allScreens = ['home', 'inv', 'craft', 'lore', 'garden'];
        allScreens.forEach(sc => { if (sc !== s) this._dirty[sc] = true; });
        this._dirty.cellarium = true;
    },

    showItemModal: function (id) {
        // Speciální rare items — vlastní modal
        if (id === 'netolicky_legacy') {
            if (typeof Game !== 'undefined' && Game.showNetolickyModal) Game.showNetolickyModal();
            return;
        }
        const _coinValues = { old_coin_1: 6, old_coin_2: 8, old_coin_3: 12 };
        if (_coinValues[id] !== undefined) {
            if (typeof Game !== 'undefined' && Game.showCoinModal) Game.showCoinModal(id, _coinValues[id]);
            return;
        }
        if (id === 'torn_page') {
            if (typeof Game !== 'undefined' && Game.showTornPageModal) Game.showTornPageModal();
            return;
        }
        if (id === 'wax_seal') {
            if (typeof Game !== 'undefined' && Game.showWaxSealModal) Game.showWaxSealModal();
            return;
        }
        if (['lost_key_1', 'lost_key_2', 'lost_key_3', 'lost_key_4', 'lost_key_5', 'key_large_1', 'key_large_2', 'key_large_3', 'lost_scroll_1', 'lost_scroll_2'].includes(id)) {
            if (typeof Game !== 'undefined' && Game.showLostKeyModal) Game.showLostKeyModal(id);
            return;
        }
        if (id === 'dried_herbs_bundle') {
            if (typeof Game !== 'undefined' && Game.showDriedHerbsModal) Game.showDriedHerbsModal();
            return;
        }
        if (id === 'hemp_pouch') {
            if (typeof Game !== 'undefined' && Game.showHempPouchModal) Game.showHempPouchModal();
            return;
        }
        if (id === 'mysterious_bulb') {
            if (typeof Game !== 'undefined' && Game.showMysteriousBulbModal) Game.showMysteriousBulbModal();
            return;
        }
        const item = ItemsDB[id];
        if (!item) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const qty = GameState.inventory[id] || 0;
        const name = (typeof iName === 'function') ? iName(id) : (item.name || id);
        const desc = (typeof iDesc === 'function') ? iDesc(id) : (lang === 'en' ? (item.desc_en || item.desc) : item.desc);

        // Decay info
        const decayMap = {
            milk: { h: 24 }, egg: { h: 120 }, raw_fish: { h: 24 }, cooked_fish: { h: 48 },
            cooked_meat: { h: 48 }, thyme: { h: 720 }, chamomile: { h: 720 }, st_johns_wort: { h: 720 },
            linden_blossom: { h: 720 }, hay: { h: 336 }, grass: { h: 48 }, worms: { h: 24 }
        };
        const decay = decayMap[id];
        const hasCella = GameState.researchedTechs && GameState.researchedTechs.includes('tech_cella');
        let decayHtml = '';
        if (decay) {
            const h = hasCella ? Math.round(decay.h * 2.5) : decay.h;
            const days = Math.round(h / 24 * 10) / 10;
            const cellaNote = hasCella ? ' (Cella x2.5)' : '';
            decayHtml = `<div style="margin:10px 0;padding:8px 12px;background:rgba(192,57,43,0.08);border-radius:6px;border-left:3px solid #c0392b;font-size:0.85rem;">
                ⏳ ${lang === 'en' ? 'Expires in' : 'Vyprší za'}: <strong>${days} ${lang === 'en' ? 'days' : 'dní'}${cellaNote}</strong></div>`;
        } else if (item.type !== 'animal' && item.type !== 'key') {
            decayHtml = `<div style="margin:10px 0;padding:8px 12px;background:rgba(90,154,90,0.08);border-radius:6px;border-left:3px solid #5a9a5a;font-size:0.85rem;">∞ ${lang === 'en' ? 'Does not expire' : 'Nevyprší'}</div>`;
        }

        // Kde se item používá
        let usedIn = '';
        if (typeof RecipesDB !== 'undefined') {
            const recipes = RecipesDB.filter(r => r.req && Object.keys(r.req).includes(id));
            if (recipes.length > 0) {
                const list = recipes.slice(0, 6).map(r => {
                    const out = ItemsDB[r.output];
                    const outName = out ? (lang === 'en' ? (out.name_en || out.name) : out.name) : r.output;
                    return `<span style="display:inline-block;margin:2px 4px;padding:2px 8px;background:rgba(197,160,89,0.15);border-radius:10px;font-size:0.8rem;">${outName}</span>`;
                }).join('');
                usedIn = `<div style="margin-top:10px;"><div style="font-size:0.75rem;opacity:0.6;margin-bottom:4px;">${lang === 'en' ? 'Used in:' : 'Používá se v:'}</div><div>${list}</div></div>`;
            }
        }

        // Vlastnosti
        const props = [];
        if (item.tier === 'stone') props.push('🪨 ' + (lang === 'en' ? 'Stone tier' : 'Kamenný tier'));
        if (item.tier === 'iron') props.push('⚙️ ' + (lang === 'en' ? 'Iron tier' : 'Železný tier'));
        if (item.lostItem) props.push('🔍 ' + (lang === 'en' ? 'Found item' : 'Nalezený předmět'));
        if (item.type === 'tool') props.push('🔨 ' + (lang === 'en' ? 'Tool (not consumed)' : 'Nástroj (nespotřebovává se)'));
        if (item.type === 'key') props.push('🗝️ ' + (lang === 'en' ? 'Key' : 'Klíč'));
        const propsHtml = props.length > 0
            ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">${props.map(p => `<span style="padding:2px 8px;background:rgba(197,160,89,0.2);border-radius:10px;font-size:0.75rem;">${p}</span>`).join('')}</div>`
            : '';

        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.modal({
                icon: item.icon || '📦',
                title: name,
                text: desc + '\n\n' + (lang === 'en' ? 'In stock' : 'Na skladě') + ': ' + qty,
                choices: [{ label: lang === 'en' ? 'Close' : 'Zavřít', type: 'primary', effect: () => { } }]
            });
            setTimeout(() => {
                const body = document.querySelector('.ns-modal-body');
                if (body) {
                    const extra = decayHtml + propsHtml + usedIn;
                    if (extra) body.insertAdjacentHTML('afterend', `<div style="padding:0 28px 8px;">${extra}</div>`);
                }
            }, 20);
        }
    },

    renderActions: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const _hAct = JSON.stringify(GameState.inventory) + lang + (GameState.selectedDuration || 0) + (GameState.activeAction ? GameState.activeAction.id + GameState.activeAction.endTime : '') + (GameState.flags.fireplaceLit ? '1' : '0') + (GameState.activeAction ? Math.floor(Date.now() / 1000) : '');
        if (_hAct === this._hashActions) return;
        this._hashActions = _hAct;
        const el = document.getElementById('workspace-actions');
        // Karty se sbírají do bloků dle systému, který je ovlivňuje (Krajina/Studna/Hospodářství),
        // aby hráč viděl, na co se který ukazatel únavy vztahuje — místo jedné nerozlišené mřížky.
        let terrainCards = '';
        let wellCards = '';
        let otherCards = '';
        ActionsDB.filter(act => act.cat !== 'mine').forEach(act => {
            // === SPECIAL HANDLING FOR WELL (MUST BE FIRST!) ===
            if (act.id === 'well_water') {
                const hasWell = GameState.well && GameState.well.built;
                if (!hasWell) return; // Skip if no well

                const hasPot = GameState.inventory.cooking_pot && GameState.inventory.cooking_pot > 0;
                const hasBucket = GameState.inventory.bucket && GameState.inventory.bucket > 0;

                if (!hasPot && !hasBucket) return; // Skip if no container

                // Timed mode — well nepodporuje časované scavenge
                if (GameState.selectedDuration > 0) {
                    const msg = lang === 'en' ? 'Instant only — well cannot be timed' : 'Jen okamžitě — studna nepodporuje časovaný sběr';
                    wellCards += `<div class="action-card" style="opacity:0.5;">
                        <div class="action-header"><span class="action-icon">🚰</span>
                        <div class="action-info"><div class="action-name">${lang==='en'?'Draw water':'Jít pro vodu'}</div>
                        <div class="action-desc" style="font-style:italic;">${msg}</div></div></div>
                        <button class="craft-btn" disabled>⏱️ ${lang==='en'?'Instant only':'Jen okamžitě'}</button></div>`;
                    return;
                }

                // Well action passes checks - continue to render it below
            } else {
                // NORMAL REQUIREMENT CHECK - ONLY FOR NON-WELL ACTIONS
                if (act.req) {
                    if (Array.isArray(act.req)) {
                        // Pole req — zobrazit pokud hráč má alespoň jeden nástroj
                        const hasAny = act.req.some(r => GameState.inventory[r.item] > 0);
                        if (!hasAny) return;
                    } else {
                        if (!(GameState.inventory[act.req] > 0)) return;
                    }
                }
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

            const cardHtml = `<div class="card"><div class="item-icon">${act.icon}</div><div><strong>${actName}</strong><div class="text-sm">${infoText}</div></div><button class="${btnClass}" onclick="Game.scavenge('${act.id}')" ${btnDisabled}>${btnText}</button></div>`;

            if (act.id === 'well_water') {
                wellCards += cardHtml;
            } else if (typeof TerrainSystem !== 'undefined' && TerrainSystem.isTerrainAction(act.id)) {
                terrainCards += cardHtml;
            } else {
                otherCards += cardHtml;
            }
        });

        const groupTitleStyle = 'font-size:0.72rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin:14px 0 8px 0;';
        let newHTML = '';
        if (terrainCards) {
            newHTML += `<div style="${groupTitleStyle}">🌲 ${lang==='en'?'Terrain':'Krajina'}</div>`;
            if (typeof TerrainSystem !== 'undefined') newHTML += TerrainSystem.renderIndicator();
            newHTML += terrainCards;
        }
        if (wellCards) {
            newHTML += `<div style="${groupTitleStyle}">🚰 ${lang==='en'?'Well':'Studna'}</div>`;
            newHTML += wellCards;
        }
        if (otherCards) {
            newHTML += `<div style="${groupTitleStyle}">🏡 ${lang==='en'?'Household':'Hospodářství'}</div>`;
            newHTML += otherCards;
        }

        if (el.innerHTML !== newHTML) el.innerHTML = newHTML;
    },

    renderInventory: function () {
        const _hInv = JSON.stringify(GameState.inventory) + (this.currentInvFilter || 'all');
        if (_hInv === this._hashInv) { this._updateInvFilterBar(); return; }
        this._hashInv = _hInv;
        const el = document.getElementById('inventory-grid'); el.innerHTML = "";
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const _hasMateria = GameState.researchedTechs && GameState.researchedTechs.includes('tech_materia_prima');

        // Skupiny filtrů — více type hodnot mapovaných na jeden tab
        const filterGroups = {
            mat: ['mat', 'herb'],
            tool: ['tool'],
            food: ['food', 'food_raw'],
            alchemy: ['alchemy', 'potion', 'alchemy_ing'],
            lore: ['lore'],
            animal: ['animal'],
            key: ['key'],
            currency: ['currency'],
        };

        const renderItem = (id, qty) => {
            const item = ItemsDB[id];
            if (!item) return '';
            const _isRareModal = (id === 'netolicky_legacy') || id === 'old_coin_1' || id === 'old_coin_2' || id === 'old_coin_3' || id === 'torn_page' || id === 'wax_seal' || ['lost_key_1', 'lost_key_2', 'lost_key_3', 'lost_key_4', 'lost_key_5', 'key_large_1', 'key_large_2', 'key_large_3', 'lost_scroll_1', 'lost_scroll_2'].includes(id) || ['dried_herbs_bundle', 'hemp_pouch', 'mysterious_bulb'].includes(id);
            const _click = (_hasMateria || _isRareModal) ? `onclick="UI.showItemModal('${id}')" style="cursor:pointer;"` : '';
            let actionBtn = '';
            if (item.type === 'food') {
                actionBtn = `<button class="craft-btn" onclick="Game.eat('${id}')" style="margin-left:auto;">${t('game.eat')}</button>`;
            } else if (item.type === 'potion' || item.type === 'alchemy') {
                actionBtn = `<button class="craft-btn" onclick="Game.eat('${id}')" style="margin-left:auto;">${t('game.eat')}</button>`;
            }
            return `<div class="card" ${_click}><div class="item-icon">${item.icon}</div><div><strong>${iName(id)}</strong> x${qty}<div class="text-sm">${iDesc(id)}</div></div>${actionBtn}</div>`;
        };

        // Všechny items s qty > 0, seřazené qty desc
        const allItems = Object.entries(GameState.inventory)
            .filter(([, qty]) => qty > 0)
            .sort(([, a], [, b]) => b - a);

        const filter = this.currentInvFilter || 'all';

        if (filter !== 'all') {
            // Filtrovaný pohled — jen odpovídající typy
            const tierFilters = ['stone', 'iron', 'wood', 'fire'];
            const allowed = filterGroups[filter] || [filter];
            allItems.forEach(([id, qty]) => {
                const item = ItemsDB[id];
                if (!item) return;
                if (tierFilters.includes(filter)) {
                    if (item.tier !== filter) return;
                } else if (!allowed.includes(item.type)) return;
                el.innerHTML += renderItem(id, qty);
            });
        } else {
            // Vše — akční items (food/potion) nahoru, pak sekce podle kategorií
            const catOrder = ['food', 'tool', 'mat', 'alchemy', 'lore', 'animal', 'key', 'currency'];
            const catLabels = {
                food: lang === 'en' ? '🍖 Food & Drink' : '🍖 Jídlo & Nápoje',
                tool: lang === 'en' ? '🔨 Tools' : '🔨 Nástroje',
                mat: lang === 'en' ? '🌾 Materials' : '🌾 Suroviny',
                alchemy: lang === 'en' ? '⚗️ Alchemy' : '⚗️ Alchymie & Lektvary',
                lore: lang === 'en' ? '📜 Knowledge' : '📜 Písemnosti & Hry',
                animal: lang === 'en' ? '🐄 Animals' : '🐄 Zvířata & Produkty',
                key: lang === 'en' ? '🗝️ Keys' : '🗝️ Klíče',
                currency: lang === 'en' ? '🪙 Coins' : '🪙 Mince',
            };
            // Skupiny typů per sekce
            const sectionTypes = {
                food: ['food', 'food_raw'],
                tool: ['tool'],
                mat: ['mat', 'herb'],
                alchemy: ['alchemy', 'potion', 'alchemy_ing'],
                lore: ['lore'],
                animal: ['animal'],
                key: ['key'],
                currency: ['currency'],
            };

            catOrder.forEach(cat => {
                const types = sectionTypes[cat];
                const group = allItems.filter(([id]) => {
                    const item = ItemsDB[id];
                    return item && types.includes(item.type);
                });
                if (group.length === 0) return;
                el.innerHTML += `<div style="grid-column:1/-1; margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35);"><span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${catLabels[cat]}</span></div>`;
                group.forEach(([id, qty]) => { el.innerHTML += renderItem(id, qty); });
            });

            // Záchranná síť — cokoliv s type, co není v žádné sekci výše, ať nikdy tiše nezmizí
            const knownTypes = Object.values(sectionTypes).flat();
            const leftover = allItems.filter(([id]) => {
                const item = ItemsDB[id];
                return item && !knownTypes.includes(item.type);
            });
            if (leftover.length > 0) {
                el.innerHTML += `<div style="grid-column:1/-1; margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35);"><span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${lang === 'en' ? '📦 Other' : '📦 Ostatní'}</span></div>`;
                leftover.forEach(([id, qty]) => { el.innerHTML += renderItem(id, qty); });
            }
        }
        this._updateInvFilterBar();
    },
    filterCrafting: function (cat, btn) {
        this.currentFilter = cat;
        if (btn) { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
        this.renderCrafting();
    },
    filterInventory: function (cat, btn) {
        this.currentInvFilter = cat;
        const container = document.getElementById('inv-filter-bar');
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.renderInventory();
    },

    _updateInvFilterBar: function () {
        const bar = document.getElementById('inv-filter-bar');
        if (!bar) return;
        const techs = GameState.researchedTechs || [];
        const hasL1 = techs.includes('tech_commonplace');
        const hasL2 = techs.includes('tech_inventarium');

        // Zobrazit/skrýt celý bar
        bar.style.display = hasL1 ? 'flex' : 'none';
        if (!hasL1) return;

        // Úroveň 2 filtry — zobrazit jen s tech_inventarium
        const l2 = ['inv-filter-food', 'inv-filter-alchemy', 'inv-filter-stone', 'inv-filter-iron', 'inv-filter-fire'];
        l2.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = hasL2 ? 'inline-flex' : 'none';
        });
    },
    renderCrafting: function () {
        const _hCraft = JSON.stringify(GameState.unlockedRecipes) + JSON.stringify(GameState.inventory) + (this.currentFilter || 'all');
        if (_hCraft === this._hashCraft) return;
        this._hashCraft = _hCraft;
        const el = document.getElementById('crafting-list'); el.innerHTML = "";
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        const renderRecipe = (r) => {
            const prod = ItemsDB[r.output]; let reqStr = ""; let can = true;
            for (let [id, amt] of Object.entries(r.req)) {
                const has = GameState.inventory[id] || 0; if ((amt > 0 && has < amt) || (amt === 0 && !has)) can = false;
                reqStr += `<span class="${(amt > 0 && has < amt) || (amt === 0 && !has) ? 'text-danger' : ''}">${amt === 0 ? t('game.required') : amt + 'x'} ${iName(id)}</span>, `;
            }
            const blindIcon = r.blind ? " 🌑" : "";
            const blindClass = r.blind ? " blind-recipe" : "";
            const owned = GameState.inventory[r.output] || 0;
            const ownedStr = owned > 0 ? ` <span style="opacity:0.6; font-size:0.85em;">(${lang === 'en' ? 'have' : 'máš'}: ${owned})</span>` : '';

            // Research efficiency indicator
            let researchBadge = '';
            if (r.output === 'research') {
                const rh = GameState.researchHour || { count: 0 };
                const cnt = rh.count || 0;
                let effPct, effColor, effLabel;
                if (cnt <= 10) {
                    effPct = 100; effColor = '#4caf50';
                    effLabel = lang === 'en' ? 'Efficiency: 100%' : 'Efektivita: 100%';
                } else if (cnt <= 20) {
                    effPct = 50; effColor = '#ff9800';
                    effLabel = lang === 'en' ? 'Efficiency: 50% (tired mind)' : 'Efektivita: 50% (unavená mysl)';
                } else {
                    effPct = 25; effColor = '#f44336';
                    effLabel = lang === 'en' ? 'Efficiency: 25% (exhausted)' : 'Efektivita: 25% (vyčerpán)';
                }
                // Vigor warning
                const vigorOk = typeof VigorSystem === 'undefined' || VigorSystem.canResearch();
                const vigorBadge = !vigorOk
                    ? `<div style="color:#f44336; font-size:0.75rem; margin-top:3px;">⚠️ ${lang === 'en' ? 'Vigor too low to write' : 'Vigor příliš nízký na psaní'}</div>`
                    : '';
                researchBadge = `<div style="margin-top:4px; font-size:0.75rem; color:${effColor};">✍️ ${effLabel} (${cnt}/hod)</div>${vigorBadge}`;
            }

            return `<div class="card${blindClass}" data-recipe-id="${r.id}" style="opacity:${can ? 1 : 0.6}; position:relative;"><div class="item-icon">${prod.icon}</div><div style="flex:1"><strong>${iName(r.output)}${blindIcon}${ownedStr}</strong><div class="text-sm">${reqStr.slice(0, -2)}</div>${researchBadge}</div><button class="craft-btn" onclick="Game.craft('${r.id}')" ${can ? '' : 'disabled'}>${r.id.startsWith('repair_') ? t('craft.repair') : t('craft.btn')}</button></div>`;
        };

        const visible = RecipesDB.filter(r => {
            if (r.cat === 'alchemy_ing') return false;
            if (r.locked && !GameState.unlockedRecipes.includes(r.id)) return false;
            if (this.currentFilter !== 'all' && r.cat !== this.currentFilter) return false;
            return true;
        });

        if (this.currentFilter !== 'all') {
            // Jednoduchý seznam bez nadpisů
            visible.forEach(r => { el.innerHTML += renderRecipe(r); });
        } else {
            // Seskupení podle kategorií s nadpisy
            const catOrder = ['stone', 'iron', 'craft', 'fire', 'parchment', 'codex', 'food', 'alchemy', 'lore'];
            const catLabels = {
                stone: lang === 'en' ? '🪨 Stone Tools' : '🪨 Kamenné nástroje',
                iron: lang === 'en' ? '⚒️ Iron Tools' : '⚒️ Železné nástroje',
                craft: lang === 'en' ? '🪵 Crafting' : '🪵 Řemeslo',
                fire: lang === 'en' ? '🕯️ Fire & Light' : '🕯️ Oheň & Světlo',
                parchment: lang === 'en' ? '📜 Parchment' : '📜 Pergamen & Inkoust',
                codex: lang === 'en' ? '📖 Codex' : '📖 Kodex & Tisk',
                food: lang === 'en' ? '🍖 Food' : '🍖 Jídlo',
                alchemy: lang === 'en' ? '⚗️ Alchemy' : '⚗️ Alchymie',
                lore: lang === 'en' ? '🎲 Knowledge' : '🎲 Vědění & Hry',
            };
            catOrder.forEach(cat => {
                const group = visible.filter(r => r.cat === cat);
                if (group.length === 0) return;
                el.innerHTML += `<div style="grid-column:1/-1; margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35);"><span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${catLabels[cat]}</span></div>`;
                group.forEach(r => { el.innerHTML += renderRecipe(r); });
            });
        }
    },

    spawnFloatingGain: function (recipeId, qty) {
        if (!qty || qty <= 0) return;
        const card = document.querySelector(`.card[data-recipe-id="${recipeId}"]`);
        if (!card) return;
        let span = card.querySelector('.floating-gain');
        if (span) {
            const cur = parseInt(span.dataset.qty || '0', 10);
            const next = cur + qty;
            span.dataset.qty = next;
            span.textContent = '+' + next;
            span.style.animation = 'none';
            requestAnimationFrame(() => {
                span.style.animation = '';
                void span.offsetWidth;
                span.style.animation = 'float-up-fade 1.2s ease-out forwards';
            });
        } else {
            span = document.createElement('span');
            span.className = 'floating-gain';
            span.dataset.qty = qty;
            span.textContent = '+' + qty;
            span.style.top = '6px';
            span.style.right = '8px';
            card.appendChild(span);
            span.addEventListener('animationend', () => span.remove());
        }
    },

    // === RENDER WELL UI === (PŘIDAT na konec UI.renderCraft nebo vytvoř novou funkci)

    renderWell: function () {
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
                const levelKeys = {
                    "basic": 'wellUI.levelBasic',
                    "stone": 'wellUI.levelStone',
                    "blessed": 'wellUI.levelBlessed'
                };
                levelText.textContent = t(levelKeys[GameState.well.level] || 'wellUI.levelUnknown');
            }

            // Update condition
            const condText = document.getElementById('well-condition-text');
            if (condText) {
                if (GameState.well.condition === "clean") {
                    condText.textContent = t('wellUI.condClean');
                    condText.style.color = "#4ade80";
                } else if (GameState.well.condition === "dirty") {
                    condText.textContent = t('wellUI.condDirty');
                    condText.style.color = "#fbbf24";
                } else {
                    condText.textContent = t('wellUI.condBroken');
                    condText.style.color = "#f87171";
                }
            }

            // Show/hide buttons (build/upgrade přesunuto do Cellarium → Budovy)
            const btnClean = document.getElementById('btn-clean-well');
            const btnRepair = document.getElementById('btn-repair-well');

            if (btnClean) btnClean.style.display = GameState.well.condition === "dirty" ? "inline-block" : "none";
            if (btnRepair) btnRepair.style.display = GameState.well.condition === "broken" ? "inline-block" : "none";

            // Purity bar (% + barva + pásmo)
            const purity = (typeof GameState.well.purity === 'number') ? GameState.well.purity : 100;
            const pBar = document.getElementById('well-purity-bar');
            const pText = document.getElementById('well-purity-text');
            if (pBar && pText) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                let color, band;
                if (purity <= 0) { color = '#f87171'; band = t('wellUI.bandDead'); }
                else if (purity < 40) { color = '#f59e0b'; band = t('wellUI.bandClogged'); }
                else if (purity < 70) { color = '#fbbf24'; band = t('wellUI.bandMurky'); }
                else { color = '#4ade80'; band = t('wellUI.bandAlive'); }
                pBar.style.width = Math.max(0, purity) + '%';
                pBar.style.background = color;
                pText.textContent = Math.round(purity) + ' % · ' + band;
                pText.style.color = color;
            }

            // Water level bar (zatím statické, rozhýbe počasí)
            const wl = (typeof GameState.well.level_water === 'number') ? GameState.well.level_water : 100;
            const wlBar = document.getElementById('well-waterlevel-bar');
            const wlText = document.getElementById('well-waterlevel-text');
            if (wlBar && wlText) {
                wlBar.style.width = Math.max(0, wl) + '%';
                wlText.textContent = Math.round(wl) + ' %';
            }

            // Frozen indicator
            const frozenEl = document.getElementById('well-frozen');
            if (frozenEl) frozenEl.style.display = GameState.well.frozen ? 'block' : 'none';

            // Water consumers
            const consEl = document.getElementById('well-consumers');
            if (consEl && typeof WellSystem !== 'undefined' && WellSystem.waterConsumers) {
                const list = WellSystem.waterConsumers();
                consEl.textContent = '💧 ' + t('wellUI.consumers') + ' ' + list.join(', ');
            }

            // Extra report info
            const extraEl = document.getElementById('well-extra');
            if (extraEl && typeof WellSystem !== 'undefined' && WellSystem.reportInfo) {
                const info = WellSystem.reportInfo();
                const rows = [];
                // Aktuální výnos
                rows.push('🪣 ' + t('wellUI.yieldNow') + ' <strong>' + info.yieldNow + '</strong>'
                    + ' <span style="opacity:0.6;">(' + t('wellUI.yieldBase') + ' ' + info.yieldBase + ')</span>');
                // Grace
                if (info.graceLeft > 0) {
                    rows.push('🛡️ ' + t('wellUI.graceLeft').replace('{n}', info.graceLeft));
                }
                // Předpověď počasí
                if (info.forecast) {
                    rows.push('🌦️ ' + t('wellUI.forecast')
                        .replace('{dry}', info.forecast.dry)
                        .replace('{rainy}', info.forecast.rainy));
                }
                // Počítadla
                rows.push('📊 ' + t('wellUI.statsUses').replace('{uses}', info.uses).replace('{cleans}', info.cleans));
                extraEl.innerHTML = rows.join('<br>');
            }
        }
    },


    renderScriptorium: function () {
        const el = document.getElementById('lore-research-content'); const res = GameState.inventory['research'] || 0;
        const _t = window.t || t;
        const _lang = (GameState.settings && GameState.settings.language) || 'cs';
        const notesLabel = _lang === 'en' ? 'Notes:' : 'Zápisky:';
        let h = `<div style="text-align:center;margin-bottom:15px;border:1px solid var(--accent-gold);padding:10px;">${notesLabel} <strong>${res}</strong> 📜</div>`;
        TechTree.forEach(tech => {
            const done = GameState.researchedTechs.includes(tech.id);
            let canResearch = res >= tech.cost;
            let reqText = "";
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const displayName = (lang !== 'cs' && tech.name_en) ? tech.name_en : tech.name;
            const displayDesc = (lang !== 'cs' && tech.desc_en) ? tech.desc_en : tech.desc;

            // Check requirements
            if (tech.requires && !done) {
                const missing = tech.requires.find(req => !GameState.researchedTechs.includes(req));
                if (missing) {
                    canResearch = false;
                    const reqTech = TechTree.find(x => x.id === missing);
                    const reqName = (lang !== 'cs' && reqTech.name_en) ? reqTech.name_en : reqTech.name;
                    reqText = `<div class="text-sm text-danger">${_t('game.techRequired')} ${reqName}</div>`;
                }
            }

            h += `<div class="card" style="border-color:${done ? 'var(--accent-gold)' : 'var(--ink-secondary)'};flex-wrap:wrap;" onclick="(function(el){var f=el.querySelector('.tech-lore-full');if(f)f.style.display=f.style.display==='block'?'none':'block'})(this)">
                <div class="item-icon" style="background:${done ? '#c5a059' : '#e8dec0'};flex-shrink:0">${done ? '🎓' : '📖'}</div>
                <div style="flex:1;min-width:0">
                    <strong>${displayName}</strong>
                    <div class="text-sm">${displayDesc}</div>
                    ${reqText}
                    ${typeof TechLoreDB !== 'undefined' && TechLoreDB[tech.id] ? `<div class="text-sm" style="margin-top:6px;font-style:italic;opacity:0.75;">${TechLoreDB[tech.id].replace(/<[^>]*>/g, '').split(' ').slice(0, 8).join(' ')}… <div class="tech-lore-full" style="display:none;margin-top:6px;padding:8px;background:rgba(197,160,89,0.1);border-left:3px solid var(--accent-gold);font-style:italic;">${TechLoreDB[tech.id]}</div></div>` : ''}
                </div>
                <div style="flex-shrink:0;align-self:flex-end;padding-left:8px;margin-top:6px;">
                    ${done ? `<span style="font-weight:bold;color:var(--accent-gold)">${_t('game.techDone')}</span>` : `<button class="craft-btn" onclick="event.stopPropagation();Game.study('${tech.id}')" ${canResearch ? '' : 'disabled'}>${_t('game.techStudy')} (${tech.cost} 📜)</button>`}
                </div>
            </div>`;
        });
        el.innerHTML = h;
    },
    renderCodex: function () {
        const el = document.getElementById('lore-codex-content');
        if (!el) return;

        const discovered = GameState.discoveredLore.length;
        const total = Object.keys(LoreDB).length;
        const _lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Lokalizace štítků
        const discoveredLabel = _lang === 'en' ? 'Discovered:' : 'Objeveno:';
        const undiscoveredLabel = _lang === 'en' ? 'Undiscovered' : 'Neobjeveno';

        let h = `<div style="text-align:center;margin-bottom:15px;border:1px solid var(--accent-gold);padding:10px;">${discoveredLabel} <strong>${discovered}/${total}</strong> 📚</div>`;

        // Seskupení podle kategorií
        const categories = {};
        Object.keys(LoreDB).forEach(id => {
            const cat = LoreDB[id].category;
            // Pokud byste v budoucnu přidali 'category_en' do LoreDB, rovnou se to přeloží
            const catName = (_lang === 'en' && LoreDB[id].category_en) ? LoreDB[id].category_en : cat;

            if (!categories[catName]) categories[catName] = [];
            categories[catName].push(id);
        });

        Object.keys(categories).sort().forEach(cat => {
            h += `<h3 style="margin-top:20px; margin-bottom:10px; font-size:1.1rem; color:var(--accent-gold);">${cat}</h3>`;
            categories[cat].forEach(id => {
                const lore = LoreDB[id];
                const isDiscovered = GameState.discoveredLore.includes(id);
                const item = ItemsDB[id] || {};
                const icon = item.icon || '📜'; // Fallback ikonka

                if (isDiscovered) {
                    // Magie překladu: Pokud nemá LoreDB vlastní title_en, sáhne si to na iName(id) z ItemsDB!
                    const title = _lang === 'en' ? (lore.title_en || (typeof iName === 'function' ? iName(id) : lore.title)) : lore.title;
                    const text = _lang === 'en' ? (lore.text_en || (typeof iDesc === 'function' ? iDesc(id) : lore.text)) : lore.text;

                    h += `<div class="card" style="flex-direction:column; align-items:flex-start; border-color:var(--accent-gold); background:rgba(197,160,89,0.1);">`;
                    h += `<div style="display:flex; align-items:center; gap:12px; width:100%; margin-bottom:8px;">`;
                    h += `<div class="item-icon">${icon}</div>`;
                    h += `<strong style="flex:1;">${title}</strong>`;
                    h += `</div>`;
                    h += `<div class="text-sm" style="white-space:pre-line; line-height:1.6;">${text}</div>`;
                    h += `</div>`;
                } else {
                    h += `<div class="card" style="opacity:0.4;">`;
                    h += `<div class="item-icon">❓</div>`;
                    h += `<div><strong>???</strong><div class="text-sm">${undiscoveredLabel}</div></div>`;
                    h += `</div>`;
                }
            });
        });

        el.innerHTML = h;
    },

    switchLoreTab: function (tab, btn) {
        // Hide all tabs
        document.getElementById('lore-research-content').style.display = 'none';
        document.getElementById('lore-codex-content').style.display = 'none';
        document.getElementById('lore-notebooks-content').style.display = 'none';
        document.getElementById('lore-achievements-content').style.display = 'none';
        const _lichEl = document.getElementById('lore-iching-content'); if (_lichEl) _lichEl.style.display = 'none';
        const _lcalEl = document.getElementById('lore-calendarium-content'); if (_lcalEl) _lcalEl.style.display = 'none';
        const _lperEl = document.getElementById('lore-persona-content'); if (_lperEl) _lperEl.style.display = 'none';

        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        // Show selected tab
        if (tab === 'research') {
            document.getElementById('lore-research-content').style.display = 'block';
            UI.renderScriptorium();
        } else if (tab === 'codex') {
            document.getElementById('lore-codex-content').style.display = 'block';
            UI.renderCodex();
        } else if (tab === 'notebooks') {
            document.getElementById('lore-notebooks-content').style.display = 'block';
            UI.renderNotebooks();
        } else if (tab === 'achievements') {
            document.getElementById('lore-achievements-content').style.display = 'block';
            UI.renderAchievements();
        } else if (tab === 'iching') {
            const el = document.getElementById('lore-iching-content');
            if (el) { el.style.display = 'block'; UI.renderIChing(); }
        } else if (tab === 'calendarium') {
            if (_lcalEl) { _lcalEl.style.display = 'block'; CalendarSystem.render(); }
        } else if (tab === 'persona') {
            if (_lperEl) { _lperEl.style.display = 'block'; if (typeof PersonaSystem !== 'undefined') PersonaSystem.render(); }
        }
    },

    switchLibraryTab: function (tab, btn) {
        // Hide all library tabs
        const tabs = ['books', 'games', 'news', 'scrinium', 'kronika'];
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
        } else if (tab === 'games') {
            const el = document.getElementById('library-games-content');
            if (el) { el.style.display = 'block'; UI.renderGamesTab(); }
        } else if (tab === 'news') {
            const el = document.getElementById('library-news-content');
            if (el) { el.style.display = 'block'; UI.renderLibraryNews(); }
        } else if (tab === 'scrinium') {
            const el = document.getElementById('library-scrinium-content');
            if (el) { el.style.display = 'block'; SecretsSystem.renderScriniumScreen('library-scrinium-content'); }
        } else if (tab === 'kronika') {
            const el = document.getElementById('library-kronika-content');
            if (el) { el.style.display = 'block'; UI.renderKronika(); }
        }
    },

    switchHomeTab: function (tab, btn) {
        document.getElementById('home-main-content').style.display = tab === 'main' ? 'block' : 'none';
        document.getElementById('home-athanor-content').style.display = tab === 'athanor' ? 'block' : 'none';
        const celEl = document.getElementById('home-cellarium-content');
        if (celEl) celEl.style.display = tab === 'cellarium' ? 'block' : 'none';
        const saecEl = document.getElementById('home-saeculum-content');
        if (saecEl) saecEl.style.display = tab === 'saeculum' ? 'block' : 'none';
        const focEl = document.getElementById('home-foculus-content');
        if (focEl) focEl.style.display = tab === 'foculus' ? 'block' : 'none';
        document.querySelectorAll('#screen-home .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (tab === 'athanor') AthanorSystem.render('home-athanor-content');
        if (tab === 'cellarium' && celEl) celEl.innerHTML = CellariumSystem.renderCellariumTab();
        if (tab === 'saeculum' && saecEl && typeof SaeculumSystem !== 'undefined') saecEl.innerHTML = SaeculumSystem.renderSaeculumTab();
        if (tab === 'foculus' && typeof FireplaceSystem !== 'undefined') FireplaceSystem.render();
        // Reset sub-tab to scavenge when switching back to main
        if (tab === 'main') this.switchHomeSubTab('scavenge', document.getElementById('home-sub-scavenge'));
    },

    switchHomeSubTab: function (tab, btn) {
        const scav = document.getElementById('home-scavenge-content');
        const mine = document.getElementById('home-mine-content');
        if (scav) scav.style.display = tab === 'scavenge' ? 'block' : 'none';
        if (mine) mine.style.display = tab === 'mine' ? 'block' : 'none';
        document.querySelectorAll('#home-main-content .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (tab === 'mine') this.renderMineActions();
    },

    renderMineActions: function () {
        const el = document.getElementById('mine-actions');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const mineActions = ActionsDB.filter(a => a.cat === 'mine');
        let h = '';
        mineActions.forEach(act => {
            // Req check — zobrazit jen pokud má pickaxe
            if (act.req && Array.isArray(act.req)) {
                const hasAny = act.req.some(r => (GameState.inventory[r.item] > 0) ||
                    (GameState.inventory['worn_' + r.item] > 0));
                if (!hasAny) return;
            }
            const actName = (lang === 'en' && act.name_en) ? act.name_en : act.name;
            const actDesc = (lang === 'en' && act.desc_en) ? act.desc_en : act.desc;
            let btnText, btnClass = 'craft-btn', btnDisabled = '', infoText = actDesc;

            if (GameState.activeAction && GameState.activeAction.id === act.id) {
                const remaining = Math.max(0, Math.ceil((GameState.activeAction.endTime - Date.now()) / 1000));
                if (remaining > 0) {
                    const m = Math.floor(remaining / 60), s = remaining % 60;
                    btnText = `${t('actions.cancel')} (${m}:${s < 10 ? '0' : ''}${s})`;
                    btnClass += ' cancel';
                    infoText = `${t('actions.remaining')} ${m}:${s < 10 ? '0' : ''}${s}`;
                } else {
                    btnText = lang === 'en' ? '⛏️ Collect' : '⛏️ Sbírat';
                    btnClass += ' claim';
                    infoText = t('actions.done');
                }
            } else if (GameState.activeAction) {
                btnDisabled = 'disabled';
                infoText = t('actions.waiting');
                btnText = lang === 'en' ? '⛏️ Mine' : '⛏️ Těžit';
            } else {
                btnText = lang === 'en' ? '⛏️ Mine' : '⛏️ Těžit';
            }
            h += `<div class="card"><div class="item-icon">${act.icon}</div><div><strong>${actName}</strong><div class="text-sm">${infoText}</div></div><button class="${btnClass}" onclick="Game.scavenge('${act.id}')" ${btnDisabled}>${btnText}</button></div>`;
        });
        if (!h) h = `<div style="padding:20px;opacity:0.6;text-align:center">${lang === 'en' ? '🔒 Requires a pickaxe.' : '🔒 Vyžaduje krumpáč.'}</div>`;
        el.innerHTML = h;
    },

    renderLibraryNews: function () {
        const el = document.getElementById('library-news-content');
        if (!el) return;

        // ── Herní den a sezóna ───────────────────────────────────────────
        const day = GameState.library
            ? Math.floor((Date.now() - new Date(GameState.library.startDate).getTime()) / 86400000)
            : 0;
        const season = (typeof Game !== 'undefined' && Game._getApiarySeason) ? Game._getApiarySeason() : 'spring';

        // ── TidingsDB — plná databáze zpráv ─────────────────────────────
        // trigger: 'day'     → minDay podmínka
        // trigger: 'flag'    → condition() musí vrátit true
        // trigger: 'season'  → season podmínka
        const TidingsDB = [
            // Denní zprávy
            { id: 'news_0', trigger: 'day', minDay: 0, icon: '✉️', sender: 'scribe', condition: null },
            { id: 'news_3', trigger: 'day', minDay: 3, icon: '📜', sender: 'unknown', condition: null },
            { id: 'news_7', trigger: 'day', minDay: 7, icon: '✉️', sender: 'scribe', condition: null },
            { id: 'news_10', trigger: 'day', minDay: 10, icon: '🔔', sender: 'monastery', condition: null },
            { id: 'news_15', trigger: 'day', minDay: 15, icon: '📜', sender: 'unknown', condition: null },
            { id: 'news_20', trigger: 'day', minDay: 20, icon: '✉️', sender: 'scribe', condition: null },
            { id: 'news_25', trigger: 'day', minDay: 25, icon: '🔔', sender: 'monastery', condition: null },
            { id: 'news_28', trigger: 'day', minDay: 28, icon: '✉️', sender: 'scribe', condition: null },

            // Sezónní zprávy
            { id: 'season_spring', trigger: 'season', season: 'spring', icon: '🌸', sender: 'scribe', condition: null },
            { id: 'season_summer', trigger: 'season', season: 'summer', icon: '☀️', sender: 'scribe', condition: null },
            { id: 'season_autumn', trigger: 'season', season: 'autumn', icon: '🍂', sender: 'cellar', condition: null },
            { id: 'season_winter', trigger: 'season', season: 'winter', icon: '❄️', sender: 'medicus', condition: null },

            // Flag zprávy — Athanor
            { id: 'flag_athanor', trigger: 'flag', icon: '⚗️', sender: 'unknown', condition: () => GameState.secrets && GameState.secrets.laboratoryUnlocked },
            { id: 'flag_athanor_nigredo', trigger: 'flag', icon: '🔥', sender: 'medicus', condition: () => GameState.athanor && (GameState.athanor.discovered || []).length > 0 },
            { id: 'flag_prima_cervisia', trigger: 'flag', icon: '🍺', sender: 'cellar', condition: () => (GameState.inventory['prima_cervisia'] || 0) > 0 || (GameState.craftedItems && GameState.craftedItems['prima_cervisia'] > 0) },

            // Flag zprávy — Dvůr
            { id: 'flag_henhouse', trigger: 'flag', icon: '🐔', sender: 'porter', condition: () => GameState.henhouse && GameState.henhouse.built },
            { id: 'flag_sheepfold', trigger: 'flag', icon: '🐑', sender: 'porter', condition: () => GameState.sheepfold && GameState.sheepfold.built },
            { id: 'flag_piscina', trigger: 'flag', icon: '🐟', sender: 'medicus', condition: () => GameState.piscina && GameState.piscina.tier > 0 },

            // Flag zprávy — Knihtisk
            { id: 'flag_printing', trigger: 'flag', icon: '📰', sender: 'unknown', condition: () => GameState.researchedTechs && GameState.researchedTechs.includes('tech_printing_basics') },
            { id: 'flag_zaltar', trigger: 'flag', icon: '📖', sender: 'scribe', condition: () => GameState.craftedItems && GameState.craftedItems['zaltar'] > 0 },

            // Flag zprávy — Scrinium
            { id: 'flag_scrinium', trigger: 'flag', icon: '🔒', sender: 'unknown', condition: () => GameState.secrets && GameState.secrets.forbiddenUnlocked },
            { id: 'flag_epistola', trigger: 'flag', icon: '📜', sender: 'unknown', condition: () => GameState.scrinium && GameState.scrinium.folios && GameState.scrinium.folios['folio_epistola'] && GameState.scrinium.folios['folio_epistola'].found },

            // Záhadné zprávy
            { id: 'mystery_1', trigger: 'day', minDay: 5, icon: '🕯️', sender: 'unknown', condition: null },
            { id: 'mystery_2', trigger: 'day', minDay: 12, icon: '🕯️', sender: 'unknown', condition: null },
            { id: 'mystery_3', trigger: 'day', minDay: 18, icon: '🕯️', sender: 'unknown', condition: null },
            { id: 'mystery_4', trigger: 'day', minDay: 35, icon: '🕯️', sender: 'unknown', condition: null },
        ];

        // ── Filtrovat dostupné zprávy ────────────────────────────────────
        const available = TidingsDB.filter(n => {
            if (n.trigger === 'day') return day >= n.minDay;
            if (n.trigger === 'season') return season === n.season;
            if (n.trigger === 'flag') return n.condition && n.condition();
            return false;
        });

        // ── Stav přečtení ────────────────────────────────────────────────
        if (!GameState.library) GameState.library = {};
        if (!GameState.library.tidingsRead) GameState.library.tidingsRead = [];
        if (!GameState.library.tidingsNotified) GameState.library.tidingsNotified = [];

        // Nové Tidings → panel (jednou per tiding)
        const _tlang = (GameState.settings && GameState.settings.language) || 'cs';
        available.forEach(n => {
            if (!GameState.library.tidingsNotified.includes(n.id)) {
                GameState.library.tidingsNotified.push(n.id);
                const senderName = t('tidings.senders.' + n.sender) || n.sender;
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.panel(n.icon + ' ' + (_tlang === 'en' ? 'New letter from ' : 'Nová zpráva od ') + senderName, 'tidings');
                }
            }
        });

        // Badge na záložce
        const unreadCount = available.filter(n => !GameState.library.tidingsRead.includes(n.id)).length;
        const tabEl = document.getElementById('lib-tab-news');
        if (tabEl) {
            const badge = unreadCount > 0 ? ` <span style="background:#c0392b;color:#fff;font-size:0.65rem;border-radius:10px;padding:1px 5px;vertical-align:middle;">${unreadCount}</span>` : '';
            tabEl.innerHTML = t('library.tabNews') + badge;
        }

        // ── Render ───────────────────────────────────────────────────────
        if (available.length === 0) {
            el.innerHTML = `<div style="text-align:center;padding:30px;opacity:0.6;">
                <div style="font-size:2rem;">📭</div>
                <p>${t('tidings.empty')}</p>
            </div>`;
            return;
        }

        let h = `<div style="margin-bottom:14px;font-style:italic;opacity:0.7;font-size:0.85rem;">${t('tidings.subtitle')}</div>`;

        // Nejnovější nahoře — záhadné a flag zprávy na začátek, pak denní sestupně
        const sorted = [...available].sort((a, b) => {
            if (a.trigger === 'flag' && b.trigger !== 'flag') return -1;
            if (b.trigger === 'flag' && a.trigger !== 'flag') return 1;
            if (a.trigger === 'season' && b.trigger !== 'season') return -1;
            if (b.trigger === 'season' && a.trigger !== 'season') return 1;
            return (b.minDay || 0) - (a.minDay || 0);
        });

        sorted.forEach(n => {
            const isRead = GameState.library.tidingsRead.includes(n.id);
            const fromText = t('tidings.senders.' + n.sender) || n.sender;
            const fullText = t('tidings.' + n.id);
            const preview = fullText.length > 120 ? fullText.substring(0, 120) + '…' : fullText;
            const unreadDot = !isRead ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#c0392b;margin-right:6px;vertical-align:middle;"></span>' : '';

            h += `<div class="tiding-card ${isRead ? 'tiding-read' : 'tiding-unread'}"
                       style="margin-bottom:12px;padding:12px 14px;background:var(--bg-card);
                              border:1px solid var(--border-color);border-radius:4px;cursor:pointer;
                              opacity:${isRead ? '0.7' : '1'};"
                       onclick="UI._toggleTiding(this, '${n.id}')">
                <div style="font-size:0.75rem;opacity:0.7;margin-bottom:6px;">
                    ${unreadDot}${n.icon} ${t('tidings.from')} <strong>${fromText}</strong>
                </div>
                <div class="tiding-preview" style="font-size:0.9rem;font-style:italic;line-height:1.5;">"${preview}"</div>
                <div class="tiding-full" style="display:none;font-size:0.9rem;font-style:italic;line-height:1.6;margin-top:6px;">"${fullText}"</div>
            </div>`;
        });

        el.innerHTML = h;
    },

    // ── Rozbalit/sbalit tiding + označit jako přečtené ───────────────────
    _toggleTiding: function (card, id) {
        const preview = card.querySelector('.tiding-preview');
        const full = card.querySelector('.tiding-full');
        if (!preview || !full) return;

        const isOpen = full.style.display !== 'none';
        preview.style.display = isOpen ? '' : 'none';
        full.style.display = isOpen ? 'none' : '';

        // Označit jako přečtené
        if (!GameState.library.tidingsRead) GameState.library.tidingsRead = [];
        if (!GameState.library.tidingsRead.includes(id)) {
            GameState.library.tidingsRead.push(id);
            Game.save();
            // Aktualizovat badge
            const tabEl = document.getElementById('lib-tab-news');
            if (tabEl) UI.renderLibraryNews();
        }

        // Aktualizovat vizuál
        card.style.opacity = '0.7';
        const dot = card.querySelector('span[style*="border-radius:50%"]');
        if (dot) dot.remove();
    },

    renderLibrary: function () {
        const el = document.getElementById('library-books-content');

        // Check unlocks
        if (typeof LibraryHelpers !== 'undefined') {
            LibraryHelpers.checkLibraryUnlocks();
        }

        const unlocked = GameState.library ? GameState.library.unlockedBooks.length : 0;
        const total = typeof LibraryDB !== 'undefined' ? LibraryDB.books.length : 0;
        const read = GameState.library ? GameState.library.readBooks.length : 0;

        let h = `
            <div style="text-align:center;margin-bottom:15px;border:1px solid var(--accent-gold);padding:10px;">
                📚 ${t('library_lore.lib_title')}: <strong>${unlocked}/${total}</strong> ${t('library_lore.lib_unlocked')} | 
                📖 ${t('library_lore.lib_read')}: <strong>${read}/${total}</strong>
            </div>
            
            <div style="margin-bottom:20px;padding:15px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:5px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <div style="font-size:2rem;">🖋️</div>
                    <div style="flex:1;">
                        <strong>${t('library_lore.npc_scribe.name')}</strong>
                        <div class="text-sm" style="color:var(--ink-secondary);">
                            ${t('library_lore.npc_scribe.scribe_short')}
                        </div>
                    </div>
                    <button class="craft-btn" onclick="LibraryHelpers.scribeTrade()">
                        ${t('library_lore.npc_scribe.opt_trade')}
                    </button>
                </div>
            </div>
        `;

        if (typeof LibraryDB === 'undefined' || typeof GameState.library === 'undefined') {
            el.innerHTML = h + `<p>${t('library_lore.lib_not_avail')}</p>`;
            return;
        }

        // Group by category
        Object.entries(LibraryDB.categories).forEach(([catId, catData]) => {
            const books = LibraryDB.books.filter(b => b.category === catId);
            const unlockedInCat = books.filter(b => GameState.library.unlockedBooks.includes(b.id));
            const catName = t(`library_lore.categories.${catId}`); // Získáme přeložený název kategorie

            h += `<div style="margin-top:20px;">`;
            h += `<h3 style="color:var(--accent-gold);border-bottom:2px solid var(--accent-gold);padding-bottom:5px;">
                    ${catData.icon} ${catName} (${unlockedInCat.length}/${books.length})
                  </h3>`;

            books.forEach(book => {
                const isUnlocked = GameState.library.unlockedBooks.includes(book.id);
                const isRead = GameState.library.readBooks.includes(book.id);

                if (isUnlocked) {
                    const currentLang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
                    const dict = currentLang === 'en' ? STRINGS_en : STRINGS_cs;

                    // Robustní fallback: STRINGS_en → book._en pole → STRINGS_cs → LibraryDB
                    const bookTitle = dict.library_lore?.books?.[book.id]?.title ||
                        (currentLang === 'en' && book.title_en) ||
                        STRINGS_cs.library_lore?.books?.[book.id]?.title ||
                        book.title;
                    const bookAuthor = dict.library_lore?.books?.[book.id]?.author ||
                        (currentLang === 'en' && book.author_en) ||
                        STRINGS_cs.library_lore?.books?.[book.id]?.author ||
                        book.author;

                    h += `
                        <div class="card" style="border-color:${isRead ? 'var(--accent-gold)' : 'var(--ink-secondary)'};">
                            <div class="item-icon" style="background:${isRead ? '#c5a059' : '#e8dec0'}">
                                ${book.icon}
                            </div>
                            <div style="flex:1;">
                                <strong>${bookTitle}</strong> ${isRead ? '✓' : ''}
                                <div class="text-sm">${bookAuthor} (${book.year})</div>
                            </div>
                            <button class="craft-btn" onclick="LibraryHelpers.readBook('${book.id}')">
                                ${isRead ? t('library_lore.btn_read_again') : t('library_lore.btn_read')}
                            </button>
                        </div>
                    `;
                } else if (book.unlockDay > 0) {
                    const daysToUnlock = book.unlockDay - Math.floor(
                        (Date.now() - GameState.library.startDate) / (24 * 60 * 60 * 1000)
                    );
                    const currentLang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
                    const researchBtn = book.unlockResearch
                        ? `<button class="craft-btn" style="font-size:0.78rem;" onclick="LibraryHelpers.unlockBookByResearch('${book.id}')">
                               🔬 ${currentLang === 'en' ? 'Unlock' : 'Odemknout'} (${book.unlockResearch} ⚗️)
                           </button>`
                        : '';

                    h += `
                        <div class="card" style="opacity:0.6;">
                            <div class="item-icon" style="background:#666;">🔒</div>
                            <div style="flex:1;">
                                <strong>???</strong>
                                <div class="text-sm">${t('library_lore.lib_unlocks_in')} ${daysToUnlock} ${t('library_lore.lib_days')}</div>
                            </div>
                            ${researchBtn}
                        </div>
                    `;
                }
                // else: book.unlockDay <= 0 → secret/hidden book (e.g. book_faust_secret),
                // unlocks only via a hidden Easter egg condition, never by day count.
                // Intentionally renders nothing here until GameState.library.unlockedBooks
                // contains it — showing a "🔒 ??? unlocks in -N days" card was the bug.
            });

            h += `</div>`;
        });

        el.innerHTML = h;
    },
    showBookModal: function (book) {
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

        const currentLang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
        const dict = currentLang === 'en' ? STRINGS_en : STRINGS_cs;

        // Robustní fallback: STRINGS_en → book._en pole → STRINGS_cs → LibraryDB
        const bookTitle = dict.library_lore?.books?.[book.id]?.title ||
            (currentLang === 'en' && book.title_en) ||
            STRINGS_cs.library_lore?.books?.[book.id]?.title ||
            book.title;
        const bookAuthor = dict.library_lore?.books?.[book.id]?.author ||
            (currentLang === 'en' && book.author_en) ||
            STRINGS_cs.library_lore?.books?.[book.id]?.author ||
            book.author;
        const bookContent = dict.library_lore?.books?.[book.id]?.content ||
            (currentLang === 'en' && book.content_en) ||
            STRINGS_cs.library_lore?.books?.[book.id]?.content ||
            book.content;

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
                    <h2 style="margin:0;color:var(--accent-gold);">${bookTitle}</h2>
                    <div style="color:var(--ink-secondary);margin-top:5px;">
                        ${bookAuthor} | ${book.year}
                    </div>
                </div>
                
                <div style="
                    font-family: 'Crimson Text', serif;
                    font-size: 1.1rem;
                    line-height: 1.8;
                    white-space: pre-wrap;
                ">
                    ${bookContent}
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
    renderAchievements: function () {
        const el = document.getElementById('lore-achievements-content');
        if (!GameState.achievements) {
            el.innerHTML = '<p>Achievements nejsou dostupné.</p>';
            return;
        }
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const unlocked = GameState.achievements.unlocked.length;
        const total = AchievementsDB.length;
        const progress = Math.floor((unlocked / total) * 100);
        const unlockedLabel = lang === 'en' ? 'Achievements unlocked' : 'Achievementy odemčeny';
        const hiddenLabel = lang === 'en' ? 'Hidden' : 'Neobjeveno';
        const rewardLabel = lang === 'en' ? 'Reward:' : 'Odměna:';

        let h = `<div style="text-align:center;margin-bottom:20px;border:1px solid var(--accent-gold);padding:15px;">`;
        h += `<div style="font-size:1.2rem; font-weight:bold; color:var(--accent-gold);">🏆 ${unlocked}/${total} (${progress}%)</div>`;
        h += `<div class="text-sm" style="margin-top:5px;">${unlockedLabel}</div>`;
        h += `</div>`;

        const categories = {};
        AchievementsDB.forEach(ach => {
            if (!categories[ach.category]) categories[ach.category] = [];
            categories[ach.category].push(ach);
        });

        Object.keys(categories).forEach(cat => {
            h += `<h3 style="margin-top:20px; margin-bottom:10px; font-size:1.1rem; color:var(--accent-gold);">${cat}</h3>`;
            categories[cat].forEach(ach => {
                const isUnlocked = GameState.achievements.unlocked.includes(ach.id);
                const borderColor = isUnlocked ? 'var(--accent-gold)' : 'var(--ink-secondary)';
                const bgColor = isUnlocked ? 'rgba(197,160,89,0.1)' : 'rgba(0,0,0,0.02)';
                const opacity = isUnlocked ? '1' : '0.5';
                const achName = (lang === 'en' && ach.name_en) ? ach.name_en : ach.name;
                const achDesc = (lang === 'en' && ach.desc_en) ? ach.desc_en : ach.desc;

                h += `<div class="card" style="border-color:${borderColor}; background:${bgColor}; opacity:${opacity};">`;
                h += `<div class="item-icon" style="background:${isUnlocked ? '#c5a059' : '#e8dec0'}">${ach.icon}</div>`;
                h += `<div style="flex:1;">`;
                h += `<strong>${isUnlocked ? achName : '???'}</strong>`;
                h += `<div class="text-sm">${isUnlocked ? achDesc : hiddenLabel}</div>`;
                if (isUnlocked && ach.reward.research) {
                    h += `<div class="text-sm" style="color:var(--accent-gold); margin-top:4px;">${rewardLabel} +${ach.reward.research} 📜</div>`;
                }
                h += `</div>`;
                if (isUnlocked) {
                    h += `<div style="font-size:1.5rem;">✅</div>`;
                } else {
                    h += `<div style="font-size:1.5rem; opacity:0.3;">🔒</div>`;
                }
                h += `</div>`;
            });
        });

        el.innerHTML = h;
    },
    renderNotebooks: function () {
        const el = document.getElementById('lore-notebooks-content');

        const hasAny = (GameState.unlockedRecipes || []).includes('tabula') ||
            (GameState.unlockedRecipes || []).includes('adversaria') ||
            (GameState.unlockedRecipes || []).includes('vademecum') ||
            (GameState.unlockedRecipes || []).includes('florilegium') ||
            (GameState.unlockedRecipes || []).includes('enchiridion');

        if (!hasAny) {
            let h = `<div style="padding:20px; background:rgba(0,0,0,0.05); border-radius:8px; text-align:center;">
                <div style="font-size:3rem; opacity:0.3; margin-bottom:10px;">🔒</div>
                <strong>${t('lore.notebooks_empty')}</strong>
                <p style="margin-top:10px; opacity:0.7;">
                    ${t('lore.notebooks_hint')}
                </p>
            </div>`;
            el.innerHTML = h;
            return;
        }

        // Render selector buttons
        let h = '<div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">';
        const types = [
            { id: 'tabula', icon: '📋', name: 'Tabula' },
            { id: 'adversaria', icon: '📔', name: 'Adversaria' },
            { id: 'vademecum', icon: '📘', name: 'Vademecum' },
            { id: 'florilegium', icon: '🌸', name: 'Florilegium' },
            { id: 'enchiridion', icon: '📖', name: 'Enchiridion' }
        ];
        types.forEach(t => {
            if ((GameState.unlockedRecipes || []).includes(t.id)) {
                h += `<button onclick="UI.renderNotebookInline('${t.id}')" class="craft-btn">${t.icon} ${t.name}</button>`;
            }
        });
        h += '</div>';
        h += '<div id="notebook-content-inline"></div>';

        el.innerHTML = h;

        // Auto-select first owned
        setTimeout(() => {
            const _ur = GameState.unlockedRecipes || [];
            if (_ur.includes('tabula')) this.renderNotebookInline('tabula');
            else if (_ur.includes('adversaria')) this.renderNotebookInline('adversaria');
            else if (_ur.includes('vademecum')) this.renderNotebookInline('vademecum');
            else if (_ur.includes('florilegium')) this.renderNotebookInline('florilegium');
            else if (_ur.includes('enchiridion')) this.renderNotebookInline('enchiridion');
        }, 0);

    },
    renderNotebookInline: function (type) {
        // Simply call NotebookSystem.render with inline container
        NotebookSystem.render(type, 'notebook-content-inline');
    },


    // ========== HTML/RENDERING UPDATE pro UI.renderRecords() ==========

    renderGamesTab: function () {
        const el = document.getElementById('library-games-content');
        if (!el) return;

        // Check tech unlock
        const hasTech = GameState.researchedTechs.includes('tech_games');

        if (!hasTech) {
            el.innerHTML = `<div style="padding:20px; background:rgba(0,0,0,0.05); border-radius:8px; text-align:center;">
            <div style="font-size:3rem; opacity:0.3; margin-bottom:10px;">🔒</div>
            <strong>${t('library.locked')}</strong>
            <p style="margin-top:10px; opacity:0.7;">${t('library.records_hint')}</p>
        </div>`;
            return;
        }

        let h = '';
        h += `<h2 style="margin-bottom: 20px; color: var(--ink-primary);">${t('games.title')}</h2>`;
        h += '<div class="games-grid">';

        // Memory Game
        const hasCards = GameState.inventory['playing_cards'] > 0;
        h += `<div class="game-card">`;
        h += `<span class="game-icon">🎴</span>`;
        h += `<div class="game-title">${t('games.memoryName')}</div>`;
        h += `<div class="game-desc">${t('games.memoryDesc')}</div>`;
        if (hasCards) {
            h += `<button class="craft-btn" onclick="MemoryGame.start()">${t('games.btnPlay')}</button>`;
        } else {
            h += `<div class="game-unlock-text">${t('games.memoryCraft')}</div>`;
        }
        h += `</div>`;

        // Royal Game of Ur
        const hasUrBoard = GameState.inventory['ur_board'] > 0;
        const hasUrTech = GameState.researchedTechs.includes('tech_ur_game');
        h += `<div class="game-card ${hasUrTech ? '' : 'locked'}">`;
        if (!hasUrTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🎲</span>`;
        h += `<div class="game-title">${t('games.urName')}</div>`;
        h += `<div class="game-desc">${t('games.urDesc')}</div>`;
        if (!hasUrTech) {
            h += `<div class="game-unlock-text">${t('games.urTech')}</div>`;
        } else if (!hasUrBoard) {
            h += `<div class="game-unlock-text">${t('games.urCraft')}</div>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUr.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="RoyalGameOfUr.start()">${t('games.urPlayVsAI')}</button>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUrSolo.start()" style="background: var(--accent-gold);">${t('games.urPlaySolo')}</button>`;
            h += `<button class="craft-btn" onclick="RoyalGameOfUr.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        // Primero
        const hasPrimero = GameState.inventory['primero_deck'] > 0;
        const hasPrimeroTech = GameState.researchedTechs.includes('tech_primero');
        h += `<div class="game-card ${hasPrimeroTech ? '' : 'locked'}">`;
        if (!hasPrimeroTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🃏</span>`;
        h += `<div class="game-title">${t('games.primeroName')}</div>`;
        h += `<div class="game-desc">${t('games.primeroDesc')}</div>`;
        if (!hasPrimeroTech) {
            h += `<div class="game-unlock-text">${t('games.primeroTech')}</div>`;
        } else if (!hasPrimero) {
            h += `<div class="game-unlock-text">${t('games.primeroCraft')}</div>`;
            h += `<button class="craft-btn" onclick="PrimeroGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="PrimeroGame.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="PrimeroGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        // Karnöffel
        const hasKarnoffel = GameState.inventory['karnoffel_deck'] > 0;
        const hasKarnoffelTech = GameState.researchedTechs.includes('tech_karnoffel');
        h += `<div class="game-card ${hasKarnoffelTech ? '' : 'locked'}">`;
        if (!hasKarnoffelTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🎴</span>`;
        h += `<div class="game-title">${t('games.karnoffelName')}</div>`;
        h += `<div class="game-desc">${t('games.karnoffelDesc')}</div>`;
        if (!hasKarnoffelTech) {
            h += `<div class="game-unlock-text">${t('games.karnoffelTech')}</div>`;
        } else if (!hasKarnoffel) {
            h += `<div class="game-unlock-text">${t('games.karnoffelCraft')}</div>`;
            h += `<button class="craft-btn" onclick="KarnoffelGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="KarnoffelGame.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="KarnoffelGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        // FreeCell
        const hasFrenchDeck = GameState.inventory['french_deck'] > 0;
        const hasFreeCellTech = GameState.researchedTechs.includes('tech_freecell');
        h += `<div class="game-card ${hasFreeCellTech ? '' : 'locked'}">`;
        if (!hasFreeCellTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🂡</span>`;
        h += `<div class="game-title">${t('games.freecellName')}</div>`;
        h += `<div class="game-desc">${t('games.freecellDesc')}</div>`;
        if (!hasFreeCellTech) {
            h += `<div class="game-unlock-text">${t('games.freecellTech')}</div>`;
        } else if (!hasFrenchDeck) {
            h += `<div class="game-unlock-text">${t('games.freecellCraft')}</div>`;
            h += `<button class="craft-btn" onclick="FreeCellGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="FreeCellGame.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="FreeCellGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        // Rithmomachia
        const hasRithmo = GameState.inventory['rithmomachia_board'] > 0;
        const hasRithmoTech = GameState.researchedTechs.includes('tech_rithmomachia');
        h += `<div class="game-card ${hasRithmoTech ? '' : 'locked'}">`;
        if (!hasRithmoTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🔢</span>`;
        h += `<div class="game-title">${t('games.rithmoName')}</div>`;
        h += `<div class="game-desc">${t('games.rithmoDesc')}</div>`;
        if (!hasRithmoTech) {
            h += `<div class="game-unlock-text">${t('games.rithmoTech')}</div>`;
        } else if (!hasRithmo) {
            h += `<div class="game-unlock-text">${t('games.rithmoCraft')}</div>`;
            h += `<button class="craft-btn" onclick="Rithmomachia.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="Rithmomachia.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="Rithmomachia.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        // Senet
        const hasSenet = GameState.inventory['senet_board'] > 0;
        const hasSenetTech = GameState.researchedTechs.includes('tech_senet');
        h += `<div class="game-card ${hasSenetTech ? '' : 'locked'}">`;
        if (!hasSenetTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">𓂀</span>`;
        h += `<div class="game-title">${t('games.senetName')}</div>`;
        h += `<div class="game-desc">${t('games.senetDesc')}</div>`;
        if (!hasSenetTech) {
            h += `<div class="game-unlock-text">${t('games.senetTech')}</div>`;
        } else if (!hasSenet) {
            h += `<div class="game-unlock-text">${t('games.senetCraft')}</div>`;
            h += `<button class="craft-btn" onclick="SenetGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="SenetGame.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="SenetGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        // Tables (Backgammon)
        const hasBackgammon = GameState.inventory['backgammon_board'] > 0;
        const hasBackgammonTech = GameState.researchedTechs.includes('tech_backgammon');
        h += `<div class="game-card ${hasBackgammonTech ? '' : 'locked'}">`;
        if (!hasBackgammonTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">🎯</span>`;
        h += `<div class="game-title">${t('games.backgammonName')}</div>`;
        h += `<div class="game-desc">${t('games.backgammonDesc')}</div>`;
        if (!hasBackgammonTech) {
            h += `<div class="game-unlock-text">${t('games.backgammonTech')}</div>`;
        } else if (!hasBackgammon) {
            h += `<div class="game-unlock-text">${t('games.backgammonCraft')}</div>`;
            h += `<button class="craft-btn" onclick="BackgammonGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="BackgammonGame.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="BackgammonGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        // Dama (Draughts)
        const hasDraughts = GameState.inventory['draughts_board'] > 0;
        const hasDraughtsTech = GameState.researchedTechs.includes('tech_draughts');
        h += `<div class="game-card ${hasDraughtsTech ? '' : 'locked'}">`;
        if (!hasDraughtsTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">⚫</span>`;
        h += `<div class="game-title">${t('games.draughtsName')}</div>`;
        h += `<div class="game-desc">${t('games.draughtsDesc')}</div>`;
        if (!hasDraughtsTech) {
            h += `<div class="game-unlock-text">${t('games.draughtsTech')}</div>`;
        } else if (!hasDraughts) {
            h += `<div class="game-unlock-text">${t('games.draughtsCraft')}</div>`;
            h += `<button class="craft-btn" onclick="DraughtsGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="DraughtsGame.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="DraughtsGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        // Hnefatafl
        const hasHnefatafl = GameState.inventory['hnefatafl_board'] > 0;
        const hasHnefataflTech = GameState.researchedTechs.includes('tech_hnefatafl');
        h += `<div class="game-card ${hasHnefataflTech ? '' : 'locked'}">`;
        if (!hasHnefataflTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">♟️</span>`;
        h += `<div class="game-title">${t('games.hnefataflName')}</div>`;
        h += `<div class="game-desc">${t('games.hnefataflDesc')}</div>`;
        if (!hasHnefataflTech) {
            h += `<div class="game-unlock-text">${t('games.hnefataflTech')}</div>`;
        } else if (!hasHnefatafl) {
            h += `<div class="game-unlock-text">${t('games.hnefataflCraft')}</div>`;
            h += `<button class="craft-btn" onclick="HnefataflGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="HnefataflGame.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="HnefataflGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        }
        h += `</div>`;

        h += '</div>'; // Close games-grid
        el.innerHTML = h;

        // Initialize game renders if active
        if (hasUrBoard) {
            if (RoyalGameOfUr.gameActive) RoyalGameOfUr.render();
            if (RoyalGameOfUrSolo.gameActive) RoyalGameOfUrSolo.render();
        }
        if (hasPrimero && PrimeroGame.gameActive) PrimeroGame.render();
        if (hasKarnoffel && KarnoffelGame.gameActive) KarnoffelGame.render();
        if (hasFrenchDeck && FreeCellGame.gameActive) FreeCellGame.render();
        if (hasRithmo && Rithmomachia.gameActive) Rithmomachia.render();
        if (hasSenet && SenetGame.gameActive) SenetGame.render();
        if (hasBackgammon && BackgammonGame.gameActive) BackgammonGame.render();
        if (hasDraughts && DraughtsGame.gameActive) DraughtsGame.render();
        if (hasHnefatafl && HnefataflGame.gameActive) HnefataflGame.render();
    },

    renderRecords: function () {
        const el = document.getElementById('library-records-content');
        if (!el) return;

        // Game inventory checks (needed for render at bottom)
        const hasUrBoard = (GameState.inventory['ur_board'] || 0) > 0;
        const hasPrimero = (GameState.inventory['primero_deck'] || 0) > 0;
        const hasKarnoffel = (GameState.inventory['karnoffel_deck'] || 0) > 0;
        const hasFrenchDeck = (GameState.inventory['french_deck'] || 0) > 0;
        const hasRithmo = (GameState.inventory['rithmomachia_board'] || 0) > 0;

        let h = '';

        // ========== PROGRESSION SUMMARY ==========
        const currentRank = RankSystem.getCurrentSecularRank();

        const currentTier = RankSystem.getSecularRankTier();
        const nextRank = RankSystem.secular[currentTier]; // next rank in array
        const currentResearch = GameState.achievements?.stats?.researchCount || 0;

        h += `<div style="margin-top: 40px; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, rgba(197,160,89,0.1) 0%, rgba(138,51,36,0.1) 100%); border-radius: 8px; border: 2px solid var(--accent-gold);">`;
        h += `<h2 style="margin: 0 0 15px 0; color: var(--accent-gold); display: flex; align-items: center; gap: 10px;">`;
        h += `${currentRank.icon} <span>${t('rank.current')}: ${RankSystem.getRankName(currentRank.id)}</span>`;
        h += `</h2>`;

        if (nextRank) {
            // Parse requirements from rank i18n strings
            const requirementText = RankSystem.getRankRequirement(nextRank.id);
            const researchMatch = requirementText.match(/(\d+)\s*(?:×\s*)?research/i);
            const requiredResearch = researchMatch ? parseInt(researchMatch[1]) : 0;
            const researchLeft = Math.max(0, requiredResearch - currentResearch);

            const techMatch = requirementText.match(/(\d+)\s+tech/i);
            const requiredTechs = techMatch ? parseInt(techMatch[1]) : 0;
            const techCount = GameState.researchedTechs?.length || 0;
            const techsLeft = Math.max(0, requiredTechs - techCount);

            h += `<div style="margin-top: 10px; padding: 12px; background: rgba(0,0,0,0.1); border-radius: 5px;">`;
            h += `<strong style="color: var(--ink-primary);">${t('rank.next')}: ${nextRank.icon} ${RankSystem.getRankName(nextRank.id)}</strong>`;
            h += `<div style="margin-top: 8px; font-size: 0.9rem; color: var(--ink-secondary);">`;

            // Research requirement
            if (requiredResearch > 0) {
                if (researchLeft > 0) {
                    h += `<div>📜 Research: ${currentResearch}/${requiredResearch} <span style="color: var(--accent-wax);">(${t('rank.remaining')}: ${researchLeft})</span></div>`;
                } else {
                    h += `<div>📜 Research: <span style="color: #4caf50;">✓ ${requiredResearch}</span></div>`;
                }
            }

            // Tech requirement
            if (requiredTechs > 0) {
                if (techsLeft > 0) {
                    h += `<div>👑 Tech: ${techCount}/${requiredTechs} <span style="color: var(--accent-wax);">(${t('rank.remaining')}: ${techsLeft})</span></div>`;
                } else {
                    h += `<div>👑 Tech: <span style="color: #4caf50;">✓ ${requiredTechs}</span></div>`;
                }
            }

            // Special item requirements (check requirement text for keywords)
            const desc = requirementText.toLowerCase();

            if (desc.includes('gallic_ink')) {
                const hasItem = (GameState.inventory['gallic_ink'] || 0) > 0;
                if (!hasItem) {
                    h += `<div>🖋️ Gallic Ink: <span style="color: var(--accent-wax);">${t('rank.needCreate')}</span></div>`;
                } else {
                    h += `<div>🖋️ Gallic Ink: <span style="color: #4caf50;">✓</span></div>`;
                }
            }

            if (desc.includes('vellum_codex')) {
                const hasItem = (GameState.inventory['vellum_codex'] || 0) > 0;
                if (!hasItem) {
                    h += `<div>📘 Vellum Codex: <span style="color: var(--accent-wax);">${t('rank.needCreate')}</span></div>`;
                } else {
                    h += `<div>📘 Vellum Codex: <span style="color: #4caf50;">✓</span></div>`;
                }
            }

            if (desc.includes('bishop_seal')) {
                const hasItem = (GameState.inventory['bishop_seal'] || 0) > 0;
                if (!hasItem) {
                    h += `<div>🏛️ Bishop Seal: <span style="color: var(--accent-wax);">${t('rank.needObtain')}</span></div>`;
                } else {
                    h += `<div>🏛️ Bishop Seal: <span style="color: #4caf50;">✓</span></div>`;
                }
            }

            h += `</div></div>`;
        } else {
            // Max rank reached
            h += `<div style="margin-top: 10px; padding: 12px; background: rgba(76,175,80,0.2); border-radius: 5px; color: #4caf50; font-weight: bold;">`;
            h += `🎓 ${t('rank.maxReached')}`;
            h += `</div>`;
        }

        h += `</div>`;

        // ========== PERSONA + VIGOR ==========
        if (typeof PersonaSystem !== 'undefined' && typeof PersonaSystem.render === 'function') {
            // Persona je nyní v Scriptoriu — zde jen Vigor
        }
        if (typeof VigorSystem !== 'undefined') h += VigorSystem.renderFullDisplay();

        // ========== PERSONAL STATISTICS ==========
        h += `<h2 style="margin-top: 20px; margin-bottom: 20px; color: var(--ink-primary);">${t('records.stats')}</h2>`;
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
            <strong>📖 Discovered</strong><div style="font-size:1.2rem; margin-top:4px;">${GameState.discoveredLore.length}/${typeof LoreDB !== 'undefined' ? Object.keys(LoreDB).length : 64}</div>
          </div>`;

        // Row 2
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-wax);">
            <strong>⚒️ Crafts</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.itemsCrafted}</div>
          </div>`;
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-wax);">
            <strong>${t('records.harvests')}</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.harvests}</div>
          </div>`;

        // Row 3
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">
            <strong>${t('records.researchGained')}</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.totalResearchGained || stats.researchCount}</div>
          </div>`;
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold);">
            <strong>👑 Tech</strong><div style="font-size:1.2rem; margin-top:4px;">${totalTech}/${typeof TechTree !== 'undefined' ? TechTree.length : 27}</div>
          </div>`;

        // Row 4 - Library Stats
        const booksRead = GameState.library?.readBooks?.length || 0;
        const booksUnlocked = GameState.library?.unlockedBooks?.length || 0;
        const totalBooks = 17; // 16 normal + 1 secret

        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #8e44ad;">
            <strong>${t('records.booksRead')}</strong><div style="font-size:1.2rem; margin-top:4px;">${booksRead}/${totalBooks}</div>
          </div>`;
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #8e44ad;">
            <strong>${t('records.booksUnlocked')}</strong><div style="font-size:1.2rem; margin-top:4px;">${booksUnlocked}/${totalBooks}</div>
          </div>`;

        // Row 5 - Games/Meals
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #8a3324;">
            <strong>${t('records.gamesWon')}</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.totalGamesPlayed || 0}</div>
          </div>`;
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #4caf50;">
            <strong>${t('records.mealsEaten')}</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.mealsEaten || 0}</div>
          </div>`;

        // Row 6 - Candles/Well
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #fbbf24;">
            <strong>${t('records.candlesLit')}</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.candlesLit || 0}</div>
          </div>`;
        h += `<div style="padding:8px; background:rgba(0,0,0,0.05); border-left:3px solid #06b6d4;">
            <strong>💧 Well</strong><div style="font-size:1.2rem; margin-top:4px;">${stats.wellUses || 0}</div>
          </div>`;

        // Row 7 - Streak (Full width)
        h += `<div style="grid-column:1/-1; padding:8px; background:rgba(197,160,89,0.1); border-left:3px solid var(--accent-gold);">
            <strong>${t('records.streak')}</strong><div style="font-size:1.2rem; margin-top:4px;">${GameState.dailyRewards.streak} ${t('records.days')} (${t('records.max')}: ${stats.longestStreak || 0})</div>
          </div>`;

        h += `</div></div>`;

        // ========== BACKUP SECTION ==========
        h += `
        <div style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 10px;">
            <h3>${t('records.backupTitle')}</h3>
            <p style="font-size: 13px; opacity: 0.8; margin-bottom: 15px;">
                ${t('records.backupDesc')}
            </p>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="Game.exportSave()" class="craft-btn" style="background: #4a7c59;">
                    ${t('records.btnDownload')}
                </button>
                
                <button onclick="Game.triggerImport()" class="craft-btn" style="background: #7c594a;">
                    ${t('records.btnUpload')}
                </button>
            </div>
            
            <p style="font-size: 11px; opacity: 0.6; margin-top: 10px;">
                ${t('records.backupNote')}
            </p>
        </div>
    `;

        el.innerHTML = h;

        // Initialize game renders if active
        if (hasUrBoard) {
            if (RoyalGameOfUr.gameActive) RoyalGameOfUr.render();
            if (RoyalGameOfUrSolo.gameActive) RoyalGameOfUrSolo.render();
        }
        if (hasPrimero && PrimeroGame.gameActive) PrimeroGame.render();
        if (hasKarnoffel && KarnoffelGame.gameActive) KarnoffelGame.render();
        if (hasFrenchDeck && FreeCellGame.gameActive) FreeCellGame.render();
        if (hasRithmo && Rithmomachia.gameActive) Rithmomachia.render();
    },


    // ─── Garden/Farmyard render — přesunuto do GardenSystem.js ────────────
    switchGardenTab: function (tab, btn) { return GardenSystem.switchGardenTab(tab, btn); },
    renderFarmyard: function () { return GardenSystem.renderFarmyard(); },
    renderPiscina: function () { return GardenSystem.renderPiscina(); },
    renderOrchard: function () { return GardenSystem.renderOrchard(); },
    renderApiary: function () { return GardenSystem.renderApiary(); },
    renderGarden: function () { return GardenSystem.renderGarden(); },
    notify: function (m, e) { const area = document.getElementById('notification-area'); if (!area) return; if (area.children.length >= 3) return; const n = document.createElement('div'); n.className = 'toast'; n.innerText = m; if (e) n.style.borderColor = 'red'; area.appendChild(n); setTimeout(() => n.remove(), 2600); },
    notifyPanel: function (m, category, e) {
        this.notify(m, e);
        if (typeof NotificationSystem !== 'undefined') NotificationSystem.panel(m, category || 'system');
    },

    // ─── AKUMULAČNÍ TOAST pro scavenge gains → deleguje na NotificationSystem ──
    _accumToast: null,
    _accumTimer: null,
    _accumData: {},

    notifyAccum: function (gains) {
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.toastAccum(gains);
        }
    },

    showFontSpecimenModal: function (techName, spec) {
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

    showLangPicker: function () {
        const modal = document.getElementById('lang-picker-modal');
        if (modal) modal.style.display = 'flex';
    },

    pickLanguage: function (lang) {
        // 1. Zavřít lang picker
        const picker = document.getElementById('lang-picker-modal');
        if (picker) picker.style.display = 'none';

        // 2. Uložit volbu
        GameState.settings.language = lang;
        GameState.settings.langChosen = true;

        // 2b. Jazyk je teď definitivní — bezpečné spustit CHRONICON fetch
        if (typeof ChroniconSystem !== 'undefined') {
            ChroniconSystem.init();
        }

        // 3. Aplikovat překlad na UI
        LangSystem.apply(lang);
        this._hashActions = null; // invalidate scavenge cache — force re-render in new lang
        if (document.getElementById('workspace-actions')) this.renderAll();

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

    afterLangPicked: function () {
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

    showWelcomeModal: function () {
        const L = STRINGS[GameState.settings.language || 'cs'];
        const el = document.getElementById('welcome-text');
        if (el) el.innerHTML = L.welcome.text;
        const btn = document.getElementById('welcome-btn');
        if (btn) btn.textContent = L.welcome.btn;
        const modal = document.getElementById('welcome-modal');
        if (modal) modal.style.display = 'flex';
    },

    closeWelcomeModal: function () {
        const modal = document.getElementById('welcome-modal');
        if (modal) modal.style.display = 'none';
        Analytics.welcomeModalClosed();
        setTimeout(() => UI.notify(t('notify.kindleHint')), 400);
        setTimeout(() => Game.checkDailyReward(), 600);
    },

    showFireoutModal: function (daysSince) {
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
        const btnEl = document.getElementById('fireout-btn');

        if (headEl) headEl.textContent = fo.heading;
        if (textEl) textEl.innerHTML = texts[Math.floor(Math.random() * texts.length)];
        if (daysEl) daysEl.innerHTML = `${fo.absence} <strong>${days} ${dayWord}</strong>`;
        if (btnEl) btnEl.textContent = fo.btn;

        const modal = document.getElementById('fireout-modal');
        if (modal) modal.style.display = 'flex';
    },

    closeFireoutModal: function () {
        const modal = document.getElementById('fireout-modal');
        if (modal) modal.style.display = 'none';
        // Re-render aby krb ukázal vyhaslý stav
        Game.checkEnvironment();
        UI.renderAll();
    },
    showDailyRewardModal: function (bonusText, streak, fact, isStreakBonus) {
        const modal = document.getElementById('daily-reward-modal');
        const content = document.getElementById('daily-reward-content');
        const factEl = document.getElementById('daily-fact');
        const titleEl = document.getElementById('daily-reward-title');
        const btnEl = document.getElementById('daily-reward-btn');
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        if (titleEl) titleEl.textContent = lang === 'en' ? 'Daily Reward!' : 'Denní Odměna!';
        if (btnEl) btnEl.textContent = (lang === 'en' ? 'Thank you!' : 'Děkuji!') + ' ✨';

        const streakWord = lang === 'en'
            ? (streak === 1 ? 'day' : 'days')
            : (streak === 1 ? 'den' : (streak < 5 ? 'dny' : 'dní'));

        let html = `<div style="font-size:1.5rem; font-weight:bold; color:var(--accent-gold); margin-bottom:10px;">${bonusText}</div>`;
        html += `<div style="font-size:0.9rem; color:var(--ink-secondary);">Streak: ${streak} ${streakWord} 🔥</div>`;

        if (isStreakBonus) {
            html += `<div style="margin-top:15px; padding:10px; background:rgba(197,160,89,0.2); border:1px solid var(--accent-gold); border-radius:4px; font-weight:bold;">🎉 ${lang === 'en' ? 'Loyalty bonus!' : 'Bonus za věrnost!'}</div>`;
        }

        content.innerHTML = html;
        factEl.innerHTML = `<strong>${lang === 'en' ? '📜 Daily fact:' : '📜 Dnešní fakt:'}</strong><br><br>${fact}`;

        modal.style.display = 'flex';
    },
    closeDailyRewardModal: function () {
        document.getElementById('daily-reward-modal').style.display = 'none';
    },
    updateStreak: function () {
        const streakEl = document.getElementById('streak-display');
        const streakNum = document.getElementById('streak-number');
        const streak = GameState.dailyRewards.streak || 0;

        if (streak > 0) {
            streakNum.innerText = streak;
            streakEl.style.display = 'inline';
            streakEl.title = `Denní streak: ${streak} ${streak === 1 ? 'den' : (streak < 5 ? 'dny' : 'dní')} za sebou!`;
        } else {
            streakEl.style.display = 'none';
        }
    },

    openAboutModal: function () {
        document.getElementById('about-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    },

    closeAboutModal: function () {
        document.getElementById('about-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    // ─── KRONIKA ─────────────────────────────────────────────────────
    _kronikaPage:   0,
    _kronikaFilter: 'all',  // 'all' | 'local' | 'chronicon'

    renderKronika: function (page) {
        const el = document.getElementById('library-kronika-content');
        if (!el) return;

        if (!GameState.kronika) GameState.kronika = [];
        if (!GameState.kronikaSavedLang) GameState.kronikaSavedLang = 'cs';

        const hasArsChr = (GameState.researchedTechs || []).includes('tech_ars_chronicae');
        if (!hasArsChr) {
            el.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:var(--ink-secondary);">
                    <div style="font-size:3rem; margin-bottom:20px;">📖</div>
                    <p><em>${t('kronika.locked')}</em></p>
                    <p style="font-size:0.9rem; margin-top:8px;">${t('kronika.lockedHint')}</p>
                </div>`;
            return;
        }

        const PER_PAGE = 20;
        const lang = GameState.kronikaSavedLang || 'cs';
        if (page !== undefined) UI._kronikaPage = page;

        // Filtrování
        const allEntries = [...GameState.kronika].reverse();
        const entries = UI._kronikaFilter === 'chronicon'
            ? allEntries.filter(e => e.type === 'chronicon')
            : UI._kronikaFilter === 'local'
                ? allEntries.filter(e => e.type !== 'chronicon')
                : allEntries;
        const total = Math.max(1, Math.ceil(entries.length / PER_PAGE));
        if (UI._kronikaPage >= total) UI._kronikaPage = total - 1;
        if (UI._kronikaPage < 0) UI._kronikaPage = 0;
        const slice = entries.slice(UI._kronikaPage * PER_PAGE, (UI._kronikaPage + 1) * PER_PAGE);

        const MONTHS_LA = ['Ianuarii', 'Februarii', 'Martii', 'Aprilis', 'Maii', 'Iunii',
            'Iulii', 'Augusti', 'Septembris', 'Octobris', 'Novembris', 'Decembris'];
        const MONTHS_CS = ['ledna', 'února', 'března', 'dubna', 'května', 'června',
            'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
        const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        function formatDate(ts, lang) {
            const d = new Date(ts);
            const day = d.getDate();
            const m = d.getMonth();
            if (lang === 'la') return `Die ${day}. ${MONTHS_LA[m]}`;
            if (lang === 'en') return `${day} ${MONTHS_EN[m]}`;
            return `${day}. ${MONTHS_CS[m]}`;
        }

        function getText(entry, lang) {
            if (lang === 'la') return entry.la || entry.cs;
            if (lang === 'en') return entry.en || entry.cs;
            return entry.cs;
        }

        const langBtns = ['cs', 'en', 'la'].map(l => `
            <button onclick="GameState.kronikaSavedLang='${l}'; Game.save(); UI.renderKronika();"
                style="padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;
                       background:${lang === l ? 'var(--btn-active, #5a3e1b)' : 'transparent'};
                       color:${lang === l ? '#fff' : 'var(--ink-secondary)'};
                       border:1px solid var(--border-color, #c9b48a);">
                ${t('kronika.lang' + l.charAt(0).toUpperCase() + l.slice(1))}
            </button>`).join('');

        const CHRONICON_SOURCE_LABEL = {
            local_events:       t('kronika.chroniconSrc.local_events'),
            distant_events:     t('kronika.chroniconSrc.distant_events'),
            monastery_internal: t('kronika.chroniconSrc.monastery_internal'),
            engine:             t('kronika.chroniconSrc.engine'),
            gm:                 t('kronika.chroniconSrc.gm'),
        };

        const entriesHtml = slice.length === 0
            ? `<p style="color:var(--ink-secondary); font-style:italic;">${t('kronika.empty')}</p>`
            : slice.map(e => {
                const isImportant  = e.type === 'important';
                const isChronicon  = e.type === 'chronicon';

                if (isChronicon) {
                    const srcLabel = CHRONICON_SOURCE_LABEL[e.source] || '☩';
                    const icon     = e.icon ? e.icon + ' ' : '☩ ';
                    return `<div style="
                        display:flex; gap:12px; align-items:baseline;
                        padding:8px 0 8px 8px;
                        border-bottom:1px solid var(--border-color, #e8dcc8);
                        border-left:3px solid var(--accent-gold, #c8a96e);
                        margin-left:-8px;
                        opacity:0.92;">
                        <span style="font-size:0.78rem; color:var(--accent-gold,#c8a96e); white-space:nowrap; min-width:90px;">
                            ☩ ${srcLabel}
                        </span>
                        <span style="flex:1;">
                            <span style="font-size:0.82rem; color:var(--ink-secondary); margin-right:4px;">${icon}</span>${getText(e, lang)}
                        </span>
                    </div>`;
                }

                return `<div style="
                    display:flex; gap:12px; align-items:baseline;
                    padding:8px 0;
                    border-bottom:1px solid var(--border-color, #e8dcc8);
                    ${isImportant ? 'font-weight:600;' : 'opacity:0.85;'}">
                    <span style="font-size:0.78rem; color:var(--ink-secondary); white-space:nowrap; min-width:90px;">
                        ${isImportant ? '★ ' : ''}${formatDate(e.ts, lang)}
                    </span>
                    <span>${getText(e, lang)}</span>
                </div>`;
            }).join('');

        const pageLabel = t('kronika.pageOf')
            .replace('{cur}', UI._kronikaPage + 1)
            .replace('{total}', total);
        const paginationHtml = total > 1 ? `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; font-size:0.85rem;">
                <button onclick="UI.renderKronika(${UI._kronikaPage - 1})"
                    ${UI._kronikaPage === 0 ? 'disabled' : ''}
                    style="padding:4px 10px; cursor:pointer; border-radius:4px; border:1px solid var(--border-color,#c9b48a); background:transparent;">
                    ${t('kronika.prev')}
                </button>
                <span style="color:var(--ink-secondary);">${pageLabel}</span>
                <button onclick="UI.renderKronika(${UI._kronikaPage + 1})"
                    ${UI._kronikaPage >= total - 1 ? 'disabled' : ''}
                    style="padding:4px 10px; cursor:pointer; border-radius:4px; border:1px solid var(--border-color,#c9b48a); background:transparent;">
                    ${t('kronika.next')}
                </button>
            </div>` : '';

        const filterBtns = ['all', 'local', 'chronicon'].map(f => {
            const labels = { all: t('kronika.filterAll'), local: t('kronika.filterLocal'), chronicon: t('kronika.filterChronicon') };
            const active = UI._kronikaFilter === f;
            return `<button onclick="UI._kronikaFilter='${f}'; UI.renderKronika(0);"
                style="padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;
                       background:${active ? 'var(--btn-active, #5a3e1b)' : 'transparent'};
                       color:${active ? '#fff' : 'var(--ink-secondary)'};
                       border:1px solid var(--border-color, #c9b48a);">
                ${labels[f]}
            </button>`;
        }).join('');

        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                <h3 style="margin:0; font-family:var(--font-display,'Cinzel');">📖 ${t('kronika.title')}</h3>
                <div style="display:flex; gap:6px;">${langBtns}</div>
            </div>
            <div style="display:flex; gap:6px; margin-bottom:12px;">${filterBtns}</div>
            <div>${entriesHtml}</div>
            ${paginationHtml}
        `;
    },

};

// ===============================================
// NOTEBOOK SYSTEM - LOCAL ONLY (NO CLOUD)
// ===============================================
