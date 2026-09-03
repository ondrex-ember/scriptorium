const UI = {
    currentInvFilter: 'all',
    currentFilter: 'all',
    currentScreen: 'home',
    _dirty: { home: false, inv: false, craft: false, lore: false, garden: false },
    _hashInv: '', _hashCraft: '', _hashActions: '',
    // vypujcky-notifikace-mrd (29.8.2026) — "Vyřešit" v gate modalu vede
    // sem: přepne na Knihovnu, na subtab Výpůjčky, kde renderVypujckyTab()
    // rovnou nahoře ukáže pult s aktuální čekající žádostí.
    goToLibraryRequest: function () {
        if (!GameState.ui) GameState.ui = {};
        GameState.ui.libraryTab = 'vypujcky';
        UI.switchScreen('library');
    },

    switchScreen: function (name, btn) {
        if (name === 'saeculum') {
            this.navigateToSaeculum();
            return;
        }
        if (name === 'cellarium') {
            this.navigateToCellarium();
            return;
        }
        const screenEl = document.getElementById('screen-' + name);
        if (!screenEl) {
            console.warn('UI.switchScreen: Screen element not found:', name);
            return;
        }
        document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
        screenEl.classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.currentScreen = name;
        this.renderResourceTracker();
        if (this._dirty[name]) {
            this._dirty[name] = false;
            if (name === 'inv') { this.renderInventory(); }
            if (name === 'craft') { this.renderCrafting(); }
            if (name === 'lore') { this.renderScriptorium(); }
            if (name === 'garden') { this.renderGarden(); }
            if (name === 'home') { this.renderActions(); this.renderWell(); }
        }
        // subtab-refresh-manager (25.8.2026): nahrazuje bývalý ad-hoc cellarium/
        // cooking blok (vareni-refresh-fix 9.8.2026 + coquina-visibility-fix).
        // refreshVisibleSubtabs() projde CELOU _SUBTAB_REFRESH_MAP a překreslí
        // jen to, co je aktuálně viditelné (offsetParent test) — pokrývá i
        // sub-taby, kam se dřív vůbec nedívalo (Zakázky, Athanor, Saeculum...).
        this.refreshVisibleSubtabs();
        if (name === 'garden') this.renderGarden();
        if (name === 'inv') this._updateInvFilterBar();
        if (name === 'library') {
            // Respektovat poslední otevřený subtab (stejný vzor jako cellariumEntity/saeculumEntity)
            const lastTab = (GameState.ui && GameState.ui.libraryTab) || 'books';
            const btn = document.getElementById('lib-tab-' + lastTab);
            this.switchLibraryTab(lastTab, btn);
        }
        if (name === 'settings') {
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                themeSelector.value = GameState.settings.theme || 'default';
            }

            const designSelector = document.getElementById('design-style-selector');
            if (designSelector) {
                designSelector.value = GameState.settings.designStyle || 'marniva';
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
            const currentTier = (typeof audioSys !== 'undefined' && audioSys !== null) ? audioSys.musicTier : (GameState.settings?.musicTier || 1);
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

    navigateToSaeculum: function (entity) {
        this.switchScreen('home', document.getElementById('nav-home'));
        const tabBtn = document.getElementById('home-tab-saeculum');
        this.switchHomeTab('saeculum', tabBtn);
        if (entity && typeof SaeculumSystem !== 'undefined') {
            SaeculumSystem.switchEntity(entity);
        }
    },

    navigateToCellarium: function (entity) {
        this.switchScreen('home', document.getElementById('nav-home'));
        const tabBtn = document.getElementById('home-tab-cellarium');
        this.switchHomeTab('cellarium', tabBtn);
        if (entity && typeof CellariumSystem !== 'undefined') {
            CellariumSystem.switchEntity(entity);
        }
    },

    // subtab-refresh-manager (25.8.2026) — konzoliduje ad-hoc re-render výjimky
    // (bývalý _dirty.cellarium blok, vareni-refresh-fix pro cooking, mine
    // visibility case) do jedné tabulky. Symptom co řeší: hráč sedí na
    // sub-tabu (Zakázky, Athanor, Saeculum, Vaření...), pod ním se mezitím
    // změní stav (inventář) jinou akcí, karta zůstane zamrzlá na starých
    // číslech dokud tab neopustí a nevrátí se — protože renderAll() dřív
    // uměl překreslit jen aktivní TOP screen (home/inv/craft/lore/garden),
    // ne konkrétní sub-tab uvnitř něj. Nový vzor: každý sub-tab má tu jeden
    // řádek (elId + render volání), refreshVisibleSubtabs() je zavolá jen
    // pokud je element aktuálně viditelný (offsetParent test — pokrývá i
    // skrytí přes rodiče, ne jen vlastní style.display, mirror
    // coquina-visibility-fix 9.8.2026). Žádná herní mechanika/balance se
    // nemění — čistě rendering infrastruktura.
    _SUBTAB_REFRESH_MAP: [
        // Scriptorium (screen 'lore') — research pokrývá renderScriptorium() přímo
        { elId: 'lore-tasks-content', fn: () => { if (typeof MonasticTasksSystem !== 'undefined') MonasticTasksSystem.render(); else UI.renderMonasticTasks(); } },
        { elId: 'lore-manuscripts-content', fn: () => { if (typeof ManuscriptCopySystem !== 'undefined') ManuscriptCopySystem.renderPage(); else UI.renderManuscriptCopying(); } },
        { elId: 'lore-codex-content', fn: () => UI.renderCodex() },
        { elId: 'lore-notebooks-content', fn: () => UI.renderNotebooks() },
        { elId: 'lore-achievements-content', fn: () => UI.renderAchievements() },
        { elId: 'lore-iching-content', fn: () => UI.renderIChing() },
        { elId: 'lore-calendarium-content', fn: () => { if (typeof CalendarSystem !== 'undefined') CalendarSystem.render(); } },
        { elId: 'lore-persona-content', fn: () => { if (typeof PersonaSystem !== 'undefined') PersonaSystem.render(); } },
        { elId: 'lore-porta-content', fn: () => { if (typeof PortaSystem !== 'undefined') PortaSystem.render(); } },
        { elId: 'lore-commitments-content', fn: () => { if (typeof CommitmentsSystem !== 'undefined') CommitmentsSystem.render(); } },
        // Knihovna (screen 'library') — 'games' pokrývá renderGamesTab() volaný globálně níž
        { elId: 'library-books-content', fn: () => UI.renderLibrary() },
        { elId: 'library-news-content', fn: () => UI.renderLibraryNews() },
        { elId: 'library-scrinium-content', fn: () => { if (typeof SecretsSystem !== 'undefined') SecretsSystem.renderScriniumScreen('library-scrinium-content'); } },
        { elId: 'library-kronika-content', fn: () => UI.renderKronika() },
        { elId: 'library-kraj-content', fn: () => UI.renderChroniconWindow() },
        { elId: 'library-studovna-content', fn: () => { if (typeof StudovnaSystem !== 'undefined') StudovnaSystem.render(); } },
        { elId: 'library-vypujcky-content', fn: () => UI.renderVypujckyTab() },
        { elId: 'library-katalog-content', fn: () => UI.renderCatalogTab() },
        { elId: 'library-opat-content', fn: () => { if (typeof AbbotSystem !== 'undefined') AbbotSystem.render(); } },
        // Home — horní sub-taby
        { elId: 'home-athanor-content', fn: () => { if (typeof AthanorSystem !== 'undefined') AthanorSystem.render('home-athanor-content'); } },
        { elId: 'home-cellarium-content', fn: () => { const el = document.getElementById('home-cellarium-content'); if (el && typeof CellariumSystem !== 'undefined') el.innerHTML = CellariumSystem.renderCellariumTab(); } },
        { elId: 'home-saeculum-content', fn: () => { const el = document.getElementById('home-saeculum-content'); if (el && typeof SaeculumSystem !== 'undefined') el.innerHTML = SaeculumSystem.renderSaeculumTab(); } },
        { elId: 'home-foculus-content', fn: () => { if (typeof FireplaceSystem !== 'undefined') FireplaceSystem.render(); } },
        { elId: 'home-templum-content', fn: () => { const el = document.getElementById('home-templum-content'); if (el && typeof TemplumSystem !== 'undefined') el.innerHTML = TemplumSystem.renderTemplumTab(); } },
        { elId: 'home-infirmarium-content', fn: () => { const el = document.getElementById('home-infirmarium-content'); if (el && typeof InfirmariumSystem !== 'undefined') el.innerHTML = InfirmariumSystem.renderInfirmariumTab(); } },
        // Home — sub-sub-taby uvnitř 'main' (scavenge pokrývá renderActions() přímo)
        { elId: 'home-mine-content', fn: () => { UI.renderMineYieldInfo(); UI.renderFodinaPetitionPanel(); UI.renderMineActions(); } },
        { elId: 'home-cooking-content', fn: () => { const el = document.getElementById('home-cooking-content'); if (el && typeof CookingSystem !== 'undefined') el.innerHTML = CookingSystem.render(); } },
        { elId: 'home-drying-content', fn: () => { const el = document.getElementById('home-drying-content'); if (el && typeof DryingSystem !== 'undefined') el.innerHTML = DryingSystem.renderSusarna(); } },
        { elId: 'home-vapenice-content', fn: () => { const el = document.getElementById('home-vapenice-content'); if (el && typeof LimeSystem !== 'undefined') el.innerHTML = LimeSystem.render(); } },
        { elId: 'home-mill-content', fn: () => { const el = document.getElementById('home-mill-content'); if (el && typeof MillSystem !== 'undefined') el.innerHTML = MillSystem.render(); } },
        { elId: 'home-furnus-content', fn: () => { const el = document.getElementById('home-furnus-content'); if (el && typeof CellariumSystem !== 'undefined') el.innerHTML = CellariumSystem.renderFurnusTab(); } },
        { elId: 'home-kovarna-content', fn: () => { const el = document.getElementById('home-kovarna-content'); if (el && typeof CellariumSystem !== 'undefined') el.innerHTML = CellariumSystem.renderKovarnaTab(); } },
        // Zahrada (screen 'garden') — zahony pokrývá renderGarden() přímo
        { elId: 'garden-tab-dvur', fn: () => { if (typeof GardenSystem !== 'undefined') GardenSystem.renderFarmyard(); } },
        { elId: 'garden-tab-sad', fn: () => { if (typeof GardenSystem !== 'undefined') GardenSystem.renderOrchard(); } },
        { elId: 'garden-tab-apiarium', fn: () => { if (typeof GardenSystem !== 'undefined') GardenSystem.renderApiary(); } },
        { elId: 'garden-tab-piscina', fn: () => { if (typeof GardenSystem !== 'undefined') GardenSystem.renderPiscina(); } },
        { elId: 'garden-tab-pole', fn: () => { if (typeof GardenSystem !== 'undefined') GardenSystem.renderFieldTab(); } },
        { elId: 'garden-tab-vinohrad', fn: () => { if (typeof GardenSystem !== 'undefined') GardenSystem.renderVinohrad(); } },
    ],

    refreshVisibleSubtabs: function () {
        this._SUBTAB_REFRESH_MAP.forEach(entry => {
            const el = document.getElementById(entry.elId);
            if (el && el.offsetParent !== null) entry.fn();
        });
    },

    renderAll: function () {
        // Porta — odhalit tlačítko v navigaci, jakmile GameState.flags.porta_active naskočí (Chronicon most)
        const _portaBtn = document.getElementById('lore-tab-porta');
        if (_portaBtn) _portaBtn.style.display = (GameState.flags && GameState.flags.porta_active) ? '' : 'none';

        // Zakázky — stejná viditelnostní podmínka jako Porta
        const _commitBtn = document.getElementById('lore-tab-commitments');
        if (_commitBtn) _commitBtn.style.display = (GameState.flags && GameState.flags.porta_active) ? '' : 'none';

        // Sušárna — mlynar-vlastni-mlyn-mrd.md §4.5 (16.8.2026), mirror Porta vzoru přesně
        const _dryingBtn = document.getElementById('home-sub-drying');
        if (_dryingBtn) _dryingBtn.style.display = (GameState.researchedTechs && GameState.researchedTechs.includes('tech_susarna_industria')) ? '' : 'none';

        // Vápenice — 16.8.2026. Gate na built, ne na tech (tech_calcaria je už
        // req_tech pro stavbu samotnou v CellariumSystem.js — žádná smysluplná
        // mezera "tech mám, budova ne", na rozdíl od Sušárny).
        const _vapeniceBtn = document.getElementById('home-sub-vapenice');
        if (_vapeniceBtn) _vapeniceBtn.style.display = (GameState.storage && GameState.storage.vapenice && GameState.storage.vapenice.built) ? '' : 'none';

        // Opisování rukopisů — tech-gate (A5 audit fix, 28.8.2026). Mirror
        // Sušárna vzoru přesně. Grandfather klauzule přes
        // _ensureScriptoriumArsMigration(): hráč, co už mechaniku používal
        // (progress/copies/auto), tech dostane automaticky, ať mu funkční
        // věc nezmizí ze savegame pod rukama.
        const _msBtn = document.getElementById('lore-tab-manuscripts');
        if (_msBtn) _msBtn.style.display = UI._ensureScriptoriumArsMigration() ? '' : 'none';

        // Vodní mlýn — gate na tier >= 2 (Mechanismus dokončen), mirror Vápenice.
        // mlynar-vlastni-mlyn-mrd.md §4.7, 16.8.2026.
        const _millBtn = document.getElementById('home-sub-mill');
        if (_millBtn) _millBtn.style.display = (typeof MillSystem !== 'undefined' && MillSystem.isBuilt()) ? '' : 'none';

        // Furnus (Pekárna) — gate na built, mirror Vápenice přesně.
        // dilny-pozemky-mrd.md v0.3, 25.8.2026.
        const _furnusBtn = document.getElementById('home-sub-furnus');
        if (_furnusBtn) _furnusBtn.style.display = (GameState.storage && GameState.storage.furnus && GameState.storage.furnus.built) ? '' : 'none';

        // Kovárna — gate na built, mirror Furnus přesně. kovarna-dilna-mrd.md v0.6, 30.8.2026.
        const _kovarnaBtn = document.getElementById('home-sub-kovarna');
        if (_kovarnaBtn) _kovarnaBtn.style.display = (GameState.storage && GameState.storage.kovarna && GameState.storage.kovarna.built) ? '' : 'none';

        this.renderResourceTracker();

        const s = this.currentScreen || 'home';
        if (s === 'home') {
            this.renderActions();
            this.renderWell();
            this.updateStreak();
        } else if (s === 'inv') { this.renderInventory(); }
        else if (s === 'craft') { this.renderCrafting(); }
        else if (s === 'lore') { this.renderScriptorium(); }
        else if (s === 'garden') { this.renderGarden(); }
        // subtab-refresh-manager (25.8.2026): nahrazuje bývalé ad-hoc case
        // pro mine/cellarium/cooking (vareni-refresh-fix 9.8.2026) — teď jedna
        // tabulka pro VŠECHNY sub-taby napříč home/lore/library/garden, viz
        // _SUBTAB_REFRESH_MAP výše. Řeší symptom: hráč sedí na sub-tabu
        // (např. Zakázky), stav (inventář) se změní jinou akcí, karta zůstane
        // zamrzlá na starých číslech, dokud tab neopustí a nevrátí se.
        this.refreshVisibleSubtabs();
        this.renderRecords();
        this.renderGamesTab();
        const allScreens = ['home', 'inv', 'craft', 'lore', 'garden'];
        allScreens.forEach(sc => { if (sc !== s) this._dirty[sc] = true; });
    },

    toggleResourceTracker: function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (typeof GameState === 'undefined' || !GameState) return;
        if (!GameState.ui) GameState.ui = {};
        GameState.ui.resTrackerCollapsed = !GameState.ui.resTrackerCollapsed;
        this.renderResourceTracker();
    },

    renderResourceTracker: function () {
        const bars = document.querySelectorAll('.resource-tracker-bar');
        if (!bars.length) return;
        if (typeof GameState === 'undefined' || !GameState || !GameState.inventory) {
            bars.forEach(el => { el.innerHTML = ''; });
            return;
        }

        if (!GameState.ui) GameState.ui = {};
        const isCollapsed = !!GameState.ui.resTrackerCollapsed;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isCs = lang === 'cs';
        const sc = this.currentScreen || 'home';

        const inv = GameState.inventory || {};

        let barTitle = isCs ? 'Suroviny:' : 'Supplies:';
        let barIcon = '📦';
        let items = [];

        if (sc === 'home') {
            barTitle = isCs ? 'Suroviny:' : 'Supplies:';
            barIcon = '📦';
            const woodCount = (inv.wood || 0) + (inv.log || 0);
            const branchCount = inv.stick || 0;
            const tallowCount = inv.fat || 0;
            const flakeCount = inv.sharp_stone || 0;
            const rockCount = inv.rock || 0;
            const ropeCount = inv.rope || 0;
            const fiberCount = inv.fiber || 0;

            items = [
                { id: 'wood', icon: '🌲', label: isCs ? 'Dřevo' : 'Wood', count: woodCount, key: 'wood' },
                { id: 'stick', icon: '🌿', label: isCs ? 'Větve' : 'Branches', count: branchCount, key: 'stick' },
                { id: 'fat', icon: '🥩', label: isCs ? 'Tuk' : 'Tallow', count: tallowCount, key: 'fat' },
                { id: 'sharp_stone', icon: '🔪', label: isCs ? 'Úštěpky' : 'Flakes', count: flakeCount, subCount: rockCount, subLabel: isCs ? 'Kameny' : 'Rocks', key: 'sharp_stone' },
                { id: 'rope', icon: '➰', label: isCs ? 'Provaz' : 'Twine', count: ropeCount, subCount: fiberCount, subLabel: isCs ? 'Vlákna' : 'Fibers', key: 'rope' }
            ];
        } else if (sc === 'craft') {
            // coquina-vyroba-mrd (9.8.2026): pill bar podle aktivního filtru Výroby.
            // Data z auditu RecipesDB (spotřeba in-cat + downstream produkce) —
            // ne jen "co recept žere", ale i "co kategorie vyrábí a kam to jde dál"
            // (např. cut_stone se v 'stone' skoro nepoužije, ale je to flagship
            // produkt 'craft' kategorie — proto patří tam, ne do Kamenných).
            barIcon = '📦';
            const flt = this.currentFilter || 'all';
            const g = (id) => inv[id] || 0;
            const barTitles = {
                all: isCs ? 'Suroviny:' : 'Supplies:', stone: isCs ? 'Kamenné:' : 'Stone:',
                iron: isCs ? 'Železné:' : 'Iron:', craft: isCs ? 'Řemeslo:' : 'Crafting:',
                building: isCs ? 'Stavby:' : 'Buildings:', fire: isCs ? 'Oheň:' : 'Fire:',
                parchment: isCs ? 'Pergamen:' : 'Parchment:', codex: isCs ? 'Kodex:' : 'Codex:',
                food: isCs ? 'Jídlo:' : 'Food:', alchemy: isCs ? 'Alchymie:' : 'Alchemy:', lore: isCs ? 'Vědění:' : 'Knowledge:',
            };
            barTitle = barTitles[flt] || barTitles.all;

            const filterItems = {
                stone: [
                    { id: 'stick', icon: '🪵', label: isCs ? 'Větev' : 'Branch', count: g('stick') },
                    { id: 'rock', icon: '🪨', label: isCs ? 'Kámen' : 'Rock', count: g('rock') },
                    { id: 'rope', icon: '➰', label: isCs ? 'Provaz' : 'Rope', count: g('rope'), subCount: g('fiber'), subLabel: isCs ? 'Vlákno' : 'Fiber' },
                    { id: 'sharp_stone', icon: '🔪', label: isCs ? 'Úštěpky' : 'Flakes', count: g('sharp_stone'), subCount: g('rock'), subLabel: isCs ? 'Kámen' : 'Rock' },
                ],
                iron: [
                    { id: 'iron_ingot', icon: '⚙️', label: isCs ? 'Železný ingot' : 'Iron Ingot', count: g('iron_ingot'), subCount: g('iron_ore'), subLabel: isCs ? 'Ruda' : 'Ore' },
                    { id: 'iron_tongs', icon: '🔧', label: isCs ? 'Kleště' : 'Tongs', count: g('iron_tongs') },
                    { id: 'rope', icon: '➰', label: isCs ? 'Provaz' : 'Rope', count: g('rope') },
                    { id: 'wild_leather', icon: '🦴', label: isCs ? 'Hrubá useň' : 'Rawhide', count: g('wild_leather') },
                    { id: 'plank', icon: '🪵', label: isCs ? 'Fošna' : 'Plank', count: g('plank') },
                ],
                craft: [
                    { id: 'rope', icon: '➰', label: isCs ? 'Provaz' : 'Rope', count: g('rope'), subCount: g('fiber'), subLabel: isCs ? 'Vlákno' : 'Fiber' },
                    { id: 'plank', icon: '🪵', label: isCs ? 'Fošna' : 'Plank', count: g('plank') },
                    { id: 'cut_stone', icon: '🧱', label: isCs ? 'Tesaný kámen' : 'Cut Stone', count: g('cut_stone'), subCount: g('rock'), subLabel: isCs ? 'Kámen' : 'Rock' },
                    { id: 'leather', icon: '🦌', label: isCs ? 'Kůže' : 'Leather', count: g('leather') },
                    { id: 'wild_leather', icon: '🦴', label: isCs ? 'Hrubá useň' : 'Rawhide', count: g('wild_leather') },
                ],
                building: [
                    { id: 'rope', icon: '➰', label: isCs ? 'Provaz' : 'Rope', count: g('rope') },
                    { id: 'plank', icon: '🪵', label: isCs ? 'Fošna' : 'Plank', count: g('plank') },
                    { id: 'iron_ingot', icon: '⚙️', label: isCs ? 'Železný ingot' : 'Iron Ingot', count: g('iron_ingot') },
                    { id: 'log', icon: '🪵', label: isCs ? 'Kulatina' : 'Log', count: g('log') },
                ],
                fire: [
                    { id: 'stick', icon: '🪵', label: isCs ? 'Větev' : 'Branch', count: g('stick') },
                    { id: 'charcoal', icon: '⚫', label: isCs ? 'Uhel' : 'Charcoal', count: g('charcoal') },
                    { id: 'fat', icon: '🥩', label: isCs ? 'Tuk' : 'Fat', count: g('fat') },
                    { id: 'resin_spruce', icon: '🌲', label: isCs ? 'Smrk. pryskyřice' : 'Spruce Resin', count: g('resin_spruce') },
                    { id: 'resin_pine', icon: '🌲', label: isCs ? 'Bor. pryskyřice' : 'Pine Resin', count: g('resin_pine') },
                ],
                parchment: [
                    { id: 'paper', icon: '📄', label: isCs ? 'Papír' : 'Paper', count: g('paper'), subCount: g('pulp'), subLabel: isCs ? 'Hadrovina' : 'Pulp' },
                    { id: 'ink', icon: '✒️', label: isCs ? 'Inkoust' : 'Ink', count: g('ink'), subCount: g('charcoal'), subLabel: isCs ? 'Uhel' : 'Charcoal' },
                    { id: 'vellum', icon: '📜', label: isCs ? 'Pergamen' : 'Vellum', count: g('vellum') },
                    { id: 'gall_nut', icon: '🫘', label: isCs ? 'Duběnka' : 'Gall Nut', count: g('gall_nut') },
                    { id: 'rags', icon: '🧻', label: isCs ? 'Hadry' : 'Rags', count: g('rags') },
                ],
                codex: [
                    { id: 'paper', icon: '📄', label: isCs ? 'Papír' : 'Paper', count: g('paper') },
                    { id: 'ink', icon: '✒️', label: isCs ? 'Inkoust' : 'Ink', count: g('ink') },
                    { id: 'vellum', icon: '📜', label: isCs ? 'Pergamen' : 'Vellum', count: g('vellum') },
                    { id: 'leather', icon: '🦌', label: isCs ? 'Kůže' : 'Leather', count: g('leather') },
                    { id: 'preservation_oil', icon: '🫙', label: isCs ? 'Konz. olej' : 'Preserv. Oil', count: g('preservation_oil') },
                ],
                food: [
                    { id: 'water', icon: '💧', label: isCs ? 'Voda' : 'Water', count: g('water') },
                    { id: 'honey', icon: '🍯', label: isCs ? 'Med' : 'Honey', count: g('honey') },
                    { id: 'bread', icon: '🍞', label: isCs ? 'Chléb' : 'Bread', count: g('bread') },
                    { id: 'salt', icon: '🧂', label: isCs ? 'Sůl' : 'Salt', count: g('salt') },
                    { id: 'carrot', icon: '🥕', label: isCs ? 'Mrkev' : 'Carrot', count: g('carrot') },
                    { id: 'onion', icon: '🧅', label: isCs ? 'Cibule' : 'Onion', count: g('onion') },
                ],
                alchemy: [
                    { id: 'ash', icon: '🌫️', label: isCs ? 'Popel' : 'Ash', count: g('ash') },
                    { id: 'herb_blue', icon: '💜', label: isCs ? 'Levandule' : 'Lavender', count: g('herb_blue') },
                    { id: 'honey', icon: '🍯', label: isCs ? 'Med' : 'Honey', count: g('honey') },
                    { id: 'preservation_oil', icon: '🫙', label: isCs ? 'Konz. olej' : 'Preserv. Oil', count: g('preservation_oil') },
                    { id: 'charcoal', icon: '⚫', label: isCs ? 'Uhel' : 'Charcoal', count: g('charcoal') },
                ],
                lore: [
                    { id: 'ink', icon: '✒️', label: isCs ? 'Inkoust' : 'Ink', count: g('ink') },
                    { id: 'paper', icon: '📄', label: isCs ? 'Papír' : 'Paper', count: g('paper') },
                    { id: 'charcoal', icon: '⚫', label: isCs ? 'Uhel' : 'Charcoal', count: g('charcoal') },
                    { id: 'bone', icon: '☠️', label: isCs ? 'Kost' : 'Bone', count: g('bone') },
                    { id: 'stick', icon: '🪵', label: isCs ? 'Větev' : 'Branch', count: g('stick') },
                ],
            };

            if (flt === 'all' || !filterItems[flt]) {
                const woodCount = (inv.wood || 0) + (inv.log || 0);
                items = [
                    { id: 'wood', icon: '🌲', label: isCs ? 'Dřevo' : 'Wood', count: woodCount },
                    { id: 'stick', icon: '🌿', label: isCs ? 'Větve' : 'Branches', count: g('stick') },
                    { id: 'fat', icon: '🥩', label: isCs ? 'Tuk' : 'Tallow', count: g('fat') },
                    { id: 'sharp_stone', icon: '🔪', label: isCs ? 'Úštěpky' : 'Flakes', count: g('sharp_stone'), subCount: g('rock'), subLabel: isCs ? 'Kameny' : 'Rocks' },
                    { id: 'rope', icon: '➰', label: isCs ? 'Provaz' : 'Twine', count: g('rope'), subCount: g('fiber'), subLabel: isCs ? 'Vlákna' : 'Fibers' },
                ];
            } else {
                items = filterItems[flt];
            }
        } else if (sc === 'garden') {
            barTitle = isCs ? 'Zahrada:' : 'Garden:';
            barIcon = '🌱';
            const waterCount = inv.water || 0;
            const herbCount = (inv.herbs || 0) + (inv.seeds || 0);
            const berryCount = (inv.berries || 0) + (inv.apple || 0) + (inv.fruit || 0);
            const ashCount = (inv.ash || 0) + (inv.fertilizer || 0);
            const stickCount = inv.stick || 0;

            items = [
                { id: 'water', icon: '💧', label: isCs ? 'Voda' : 'Water', count: waterCount, key: 'water' },
                { id: 'herbs', icon: '🌱', label: isCs ? 'Sazenice/Byliny' : 'Herbs', count: herbCount, key: 'herbs' },
                { id: 'berries', icon: '🍎', label: isCs ? 'Plody/Úroda' : 'Harvest', count: berryCount, key: 'berries' },
                { id: 'ash', icon: '🔥', label: isCs ? 'Popel/Hnojivo' : 'Ash/Fertilizer', count: ashCount, key: 'ash' },
                { id: 'stick', icon: '🌿', label: isCs ? 'Větve' : 'Branches', count: stickCount, key: 'stick' }
            ];
        } else if (sc === 'inv') {
            barTitle = isCs ? 'Zásoby:' : 'Pantry:';
            barIcon = '🥖';
            const waterCount = inv.water || 0;
            const breadCount = inv.bread || 0;
            const meatCount = (inv.meat || 0) + (inv.fish || 0) + (inv.meat_cooked || 0);
            const pieCount = inv.pie || 0;
            const eggCount = inv.egg || 0;

            items = [
                { id: 'water', icon: '💧', label: isCs ? 'Voda' : 'Water', count: waterCount, key: 'water' },
                { id: 'bread', icon: '🍞', label: isCs ? 'Chléb' : 'Bread', count: breadCount, key: 'bread' },
                { id: 'meat', icon: '🍖', label: isCs ? 'Maso/Ryby' : 'Meat/Fish', count: meatCount, key: 'meat' },
                { id: 'pie', icon: '🥧', label: isCs ? 'Koláč' : 'Pie', count: pieCount, key: 'pie' },
                { id: 'egg', icon: '🥚', label: isCs ? 'Vejce' : 'Eggs', count: eggCount, key: 'egg' }
            ];
        } else if (sc === 'scriptorium' || sc === 'lore') {
            barTitle = isCs ? 'Písařství:' : 'Scribe:';
            barIcon = '🖋️';
            const paperCount = inv.paper || 0;
            const parchmentCount = inv.parchment || 0;
            const inkCount = (inv.ink || 0) + (inv.ink_gall || 0);
            const quillCount = inv.quill || 0;
            const coinCount = GameState.coins || inv.coins || 0;

            items = [
                { id: 'paper', icon: '📄', label: isCs ? 'Papír' : 'Paper', count: paperCount, key: 'paper' },
                { id: 'parchment', icon: '📜', label: isCs ? 'Pergamen' : 'Parchment', count: parchmentCount, key: 'parchment' },
                { id: 'ink', icon: '🖋️', label: isCs ? 'Inkoust' : 'Ink', count: inkCount, key: 'ink' },
                { id: 'quill', icon: '✒️', label: isCs ? 'Brky' : 'Quills', count: quillCount, key: 'quill' },
                { id: 'coins', icon: '💰', label: isCs ? 'Mince' : 'Coins', count: coinCount, key: 'coins' }
            ];
        } else if (sc === 'library') {
            barTitle = isCs ? 'Knihovna:' : 'Library:';
            barIcon = '📚';
            const resPoints = GameState.researchPoints || 0;
            const paperCount = inv.paper || 0;

            let unlockedCount = 0;
            let readCount = 0;
            let totalCount = 0;
            if (typeof LibraryDB !== 'undefined' && LibraryDB.books) {
                totalCount = LibraryDB.books.length;
                const stateLib = GameState.library || {};
                const unlockedArr = stateLib.unlockedBooks || [];
                const readArr = stateLib.readBooks || [];
                unlockedCount = unlockedArr.length;
                readCount = readArr.length;
            }

            items = [
                { id: 'research', icon: '🧠', label: isCs ? 'Výzkum' : 'Research', count: resPoints, key: 'research' },
                { id: 'unlocked', icon: '📚', label: isCs ? 'Odemčeno' : 'Unlocked', count: unlockedCount, subCount: totalCount, subLabel: isCs ? 'Celkem' : 'Total', key: 'unlocked' },
                { id: 'read', icon: '📖', label: isCs ? 'Přečteno' : 'Read', count: readCount, subCount: totalCount, subLabel: isCs ? 'Celkem' : 'Total', key: 'read' },
                { id: 'paper', icon: '📄', label: isCs ? 'Papír' : 'Paper', count: paperCount, key: 'paper' }
            ];
        } else {
            barTitle = isCs ? 'Suroviny:' : 'Supplies:';
            barIcon = '📦';
            const woodCount = (inv.wood || 0) + (inv.log || 0);
            const branchCount = inv.stick || 0;
            const paperCount = inv.paper || 0;
            items = [
                { id: 'wood', icon: '🌲', label: isCs ? 'Dřevo' : 'Wood', count: woodCount, key: 'wood' },
                { id: 'stick', icon: '🌿', label: isCs ? 'Větve' : 'Branches', count: branchCount, key: 'stick' },
                { id: 'paper', icon: '📄', label: isCs ? 'Papír' : 'Paper', count: paperCount, key: 'paper' }
            ];
        }

        if (isCollapsed) {
            const cleanTitle = barTitle.replace(':', '');
            const html = `
                <button class="res-tracker-toggle-btn collapsed-btn" onclick="UI.toggleResourceTracker(event)" title="${isCs ? 'Klikni pro rozbalení' : 'Click to expand'}">
                    ${barIcon} <span class="res-tracker-title-text">${cleanTitle}</span> <span class="res-tracker-icon">➕</span>
                </button>
            `;
            bars.forEach(el => {
                el.classList.add('is-collapsed');
                el.innerHTML = html;
            });
            return;
        }

        bars.forEach(el => { el.classList.remove('is-collapsed'); });

        const clickTarget = sc === 'home' ? 'craft' : sc;

        let html = `
            <div class="res-tracker-container">
                <span class="res-tracker-title" onclick="UI.switchScreen('${clickTarget}')" title="${isCs ? 'Detail' : 'Detail'}">
                    ${barIcon} <span class="res-tracker-title-text">${barTitle}</span>
                </span>
                <div class="res-tracker-pills">
        `;

        items.forEach(item => {
            const isZero = item.count === 0 && (!item.subCount || item.subCount === 0);
            let valStr = `${item.count}`;
            if (item.subCount !== undefined && item.subCount > 0) {
                let subTag = '';
                if (item.id === 'sharp_stone') subTag = '⛰️';
                else if (item.id === 'rope') subTag = '🌾';

                if (item.key === 'unlocked' || item.key === 'read') {
                    valStr = `${item.count}<span class="res-subval" title="${item.subLabel}">/${item.subCount}</span>`;
                } else {
                    valStr += ` <span class="res-subval" title="${item.subLabel}">(${item.subCount}${subTag ? ' ' + subTag : ''})</span>`;
                }
            }
            html += `
                <div class="res-pill ${isZero ? 'res-pill-empty' : ''}" onclick="UI.switchScreen('${clickTarget}')" title="${item.label}">
                    <span class="res-pill-icon">${item.icon}</span>
                    <span class="res-pill-label">${item.label}:</span>
                    <span class="res-pill-val">${valStr}</span>
                </div>
            `;
        });

        html += `
                </div>
                <button class="res-tracker-close-btn" onclick="UI.toggleResourceTracker(event)" title="${isCs ? 'Sbalit' : 'Collapse'}">
                    ✖
                </button>
            </div>
        `;

        bars.forEach(el => { el.innerHTML = html; });
    },

    showItemModal: function (id) {
        // Speciální rare items — vlastní modal
        if (id === 'netolicky_legacy') {
            if (typeof Game !== 'undefined' && Game.showNetolickyModal) Game.showNetolickyModal();
            return;
        }
        if (id === 'titivillus_spis') {
            if (typeof Game !== 'undefined' && Game.showTitivillusSpisModal) Game.showTitivillusSpisModal();
            return;
        }
        if (id === 'acedia_spis') {
            if (typeof Game !== 'undefined' && Game.showAcediaSpisModal) Game.showAcediaSpisModal();
            return;
        }
        if (id === 'belzebub_spis') {
            if (typeof Game !== 'undefined' && Game.showBelzebubSpisModal) Game.showBelzebubSpisModal();
            return;
        }
        // dymka-modal-fix (7.8.2026): klik na dýmku v Zásobách/Truhle otevře
        // stejné akce (napěchovat/vykouřit) jako karta v Ohništi, ne jen popis.
        if (id === 'pipe_large' || id === 'pipe_small') {
            if (typeof FireplaceSystem !== 'undefined' && FireplaceSystem.showPipeModal) FireplaceSystem.showPipeModal();
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
        // coquina-kotlik-mrd (9.8.2026): klik na Zrezlý kotlík v Zásobách/Truhle
        // otevře modal s přímou nabídkou vyčištění, mirror pipe_large/dýmka vzoru.
        if (id === 'zrezly_kotlik') {
            if (typeof Game !== 'undefined' && Game.showRustyPotModal) Game.showRustyPotModal();
            return;
        }
        const item = ItemsDB[id];
        if (!item) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const qty = GameState.inventory[id] || 0;
        const name = (typeof iName === 'function') ? iName(id) : (item.name || id);
        const desc = (typeof iDesc === 'function') ? iDesc(id) : (lang === 'en' ? (item.desc_en || item.desc) : item.desc);

        // Decay info — napojeno na skutečný DecaySystem (dřív samostatná
        // zastaralá decayMap s 11 itemy, driftovala od skutečné tabulky
        // stejně jako scavenge dřív — decay-modal-fix, 9.8.2026).
        let decayHtml = '';
        if (typeof DecaySystem !== 'undefined' && DecaySystem.isActive && DecaySystem.isActive()) {
            const rate = DecaySystem.effectiveRate(id, qty);
            const isDurable = !!DecaySystem.DURABLE_DECAY_RATES[id];
            if (rate === null) {
                decayHtml = `<div style="margin:10px 0;padding:8px 12px;background:rgba(90,154,90,0.08);border-radius:6px;border-left:3px solid #5a9a5a;font-size:0.85rem;">∞ ${lang === 'en' ? 'Does not decay' : 'Nekazí se'}</div>`;
            } else if (rate === 0 && isDurable) {
                decayHtml = `<div style="margin:10px 0;padding:8px 12px;background:rgba(90,154,90,0.08);border-radius:6px;border-left:3px solid #5a9a5a;font-size:0.85rem;">🛡️ ${lang === 'en' ? 'Protected by storage' : 'Chráněno skladem'}</div>`;
            } else {
                const pctStr = (rate * 100).toFixed(rate < 0.01 ? 3 : 1);
                const halfLifeDays = rate > 0 ? Math.round(Math.log(0.5) / Math.log(1 - rate)) : null;
                const durNote = isDurable ? (lang === 'en' ? ' (durable goods — slow erosion)' : ' (trvanlivé zboží — pomalá eroze)') : '';
                decayHtml = `<div style="margin:10px 0;padding:8px 12px;background:rgba(192,57,43,0.08);border-radius:6px;border-left:3px solid #c0392b;font-size:0.85rem;">
                    ⏳ ${lang === 'en' ? 'Losing' : 'Ztrácí'}: <strong>~${pctStr}%/${lang === 'en' ? 'day' : 'den'}</strong>${durNote}
                    ${halfLifeDays ? `<br><small style="opacity:0.7;">${lang === 'en' ? '~half gone in' : '~polovina zmizí za'} ${halfLifeDays} ${lang === 'en' ? 'days' : 'dní'}</small>` : ''}</div>`;
            }
        } else if (item.type !== 'animal' && item.type !== 'key') {
            decayHtml = `<div style="margin:10px 0;padding:8px 12px;background:rgba(90,154,90,0.08);border-radius:6px;border-left:3px solid #5a9a5a;font-size:0.85rem;">∞ ${lang === 'en' ? 'Does not decay yet (research Inventarium)' : 'Zatím se nekazí (vyzkoumej Inventarium)'}</div>`;
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

        // Opotřebení nástroje (maxUses/toolUses) — vlastní zvýrazněný box,
        // mirror stylu decayHtml. Fallback na plnou hodnotu, pokud
        // toolUses[id] ještě není inicializováno (nepoužitý nástroj) —
        // dřív se v tom případě neukazovalo nic.
        let durabilityHtml = '';
        if (item.maxUses) {
            const usesLeft = (GameState.toolUses && GameState.toolUses[id] !== undefined)
                ? GameState.toolUses[id] : item.maxUses;
            const pct = Math.max(0, Math.min(100, Math.round((usesLeft / item.maxUses) * 100)));
            const color = pct > 50 ? '#5a9a5a' : (pct > 20 ? '#c5a059' : '#c0392b');
            const bgTint = pct > 50 ? 'rgba(90,154,90,0.08)' : (pct > 20 ? 'rgba(197,160,89,0.08)' : 'rgba(192,57,43,0.08)');
            durabilityHtml = `<div style="margin:10px 0;padding:8px 12px;background:${bgTint};border-radius:6px;border-left:3px solid ${color};font-size:0.85rem;">
                🔧 ${lang === 'en' ? 'Condition' : 'Stav'}: <strong>${usesLeft}/${item.maxUses}</strong> ${lang === 'en' ? 'uses' : 'použití'} (${pct}%)
                <div style="margin-top:4px;height:5px;background:rgba(0,0,0,0.1);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:${color};"></div>
                </div></div>`;
        }

        // Vlastnosti
        const props = [];
        if (item.tier === 'stone') props.push('🪨 ' + (lang === 'en' ? 'Stone tier' : 'Kamenný tier'));
        if (item.tier === 'iron') props.push('⚙️ ' + (lang === 'en' ? 'Iron tier' : 'Železný tier'));
        if (item.lostItem) props.push('🔍 ' + (lang === 'en' ? 'Found item' : 'Nalezený předmět'));
        if (item.type === 'tool') props.push('🔨 ' + (lang === 'en' ? 'Tool (not consumed)' : 'Nástroj (nespotřebovává se)'));
        if (item.type === 'key') props.push('🗝️ ' + (lang === 'en' ? 'Key' : 'Klíč'));
        // coquina-kotlik-mrd (9.8.2026): Kotlík tier je dynamický (GameState.cookingPotTier),
        // ne statické item.tier pole — jiný mechanismus než stone_axe/iron_axe.
        if (id === 'cooking_pot') {
            const potTierNames = { 1: '🪨 ' + (lang === 'en' ? 'Stone' : 'Kamenný'), 2: '⚙️ ' + (lang === 'en' ? 'Iron' : 'Železný'), 3: '🟠 ' + (lang === 'en' ? 'Bronze' : 'Bronzový') };
            props.push(potTierNames[GameState.cookingPotTier || 1]);
        }
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
                    const extra = decayHtml + durabilityHtml + propsHtml + usedIn;
                    if (extra) body.insertAdjacentHTML('afterend', `<div style="padding:0 28px 8px;">${extra}</div>`);
                }
            }, 20);
        }
    },

    // Katalogizační lístek — mirror stylu showItemModal (NotificationSystem.modal
    // + DOM injekce barevných boxů). Secundo folio i signatura jsou odvozené
    // z existujících dat (content, pozice v kategorii), žádná nová pole pro
    // 73 knih. Gate: jen když je vyzkoumán tech_bibliotheca_catalogus (volající
    // kód v renderLibrary to už ověřuje před vykreslením tlačítka).
    //
    // Signatura = desítková hierarchie (stovka za kategorii, zbytek za pořadí
    // v ní) — Bartolomějova osobní posedlost, ne dobová norma. Číslo nese
    // skutečnou strukturu (mapa BARTOLOMEJ_TRIDA), jméno systému ve hře nikdy
    // nepadne — jen jeho vlastní tvrzení, že na to jednou někdo přijde taky.
    BARTOLOMEJ_TRIDA: { history: 100, innovation: 200, conflict: 300, local: 400, viticis: 500, technical: 600, coquina: 700, valetudo: 800 },

    showCatalogModal: function (book) {
        if (!book) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const dict = lang === 'en' ? STRINGS_en : STRINGS_cs;
        const bookTitle = dict.library_lore?.books?.[book.id]?.title ||
            (lang === 'en' && book.title_en) ||
            STRINGS_cs.library_lore?.books?.[book.id]?.title ||
            book.title;
        const bookAuthor = dict.library_lore?.books?.[book.id]?.author ||
            (lang === 'en' && book.author_en) ||
            STRINGS_cs.library_lore?.books?.[book.id]?.author ||
            book.author;

        // Signatura — stovka dle kategorie + pořadí knihy v ní. Deterministicky
        // spočtené z existujícího pole knih, ne uložené, žádná nová data.
        const catBooks = LibraryDB.books.filter(b => b.category === book.category);
        const idx = catBooks.findIndex(b => b.id === book.id) + 1;
        const trida = this.BARTOLOMEJ_TRIDA[book.category] || 0;
        const signature = String(trida + (idx || 1));

        // Secundo folio — první slova druhého odstavce obsahu, ne ručně psané pole.
        const paras = (book.content || '').split('\n\n').map(p => p.trim()).filter(Boolean);
        let secundoFolio = '';
        if (paras.length > 1) {
            const clean = paras[1].replace(/\*\*/g, '').replace(/^[^\wÀ-ž]+/, '');
            const words = clean.split(/\s+/).slice(0, 6).join(' ');
            secundoFolio = words + '…';
        }

        const isRead = GameState.library.readBooks.includes(book.id);
        const catName = t(`library_lore.categories.${book.category}`);

        // Datum akvizice — údaj služební. Chybí u knih odemčených před
        // zavedením acquisitionDates (starší savy) — u nich se to nedomýšlí.
        const acqTs = GameState.library.acquisitionDates && GameState.library.acquisitionDates[book.id];
        let acqText;
        if (acqTs) {
            const d = new Date(acqTs);
            const monthLat = (typeof CalendarSystem !== 'undefined') ? CalendarSystem.MONTHS_LAT[d.getMonth()] : '';
            const gameYear = (typeof CalendarSystem !== 'undefined') ? CalendarSystem.GAME_YEAR : '';
            acqText = `${monthLat} ${d.getDate()}, Anno Domini ${gameYear}`;
        } else {
            acqText = t('library_lore.catalog_acq_unknown');
        }

        NotificationSystem.modal({
            icon: '📇',
            title: t('library_lore.catalog_title'),
            text: `${bookTitle}\n${bookAuthor}${book.year ? ', ' + book.year : ''}\n${catName}`,
            choices: [{ label: t('library_lore.catalog_close'), type: 'primary', effect: () => { } }]
        });
        setTimeout(() => {
            const body = document.querySelector('.ns-modal-body');
            if (!body) return;
            const statusColor = isRead ? '#5a9a5a' : '#c5a059';
            const statusBg = isRead ? 'rgba(90,154,90,0.08)' : 'rgba(197,160,89,0.08)';
            const statusText = isRead ? t('library_lore.catalog_status_read') : t('library_lore.catalog_status_unread');
            let extra = `<div style="margin:10px 0;padding:8px 12px;background:${statusBg};border-radius:6px;border-left:3px solid ${statusColor};font-size:0.85rem;">
                ${isRead ? '✓' : '📖'} ${statusText}</div>`;
            extra += `<div style="margin:10px 0;padding:8px 12px;background:rgba(139,111,60,0.08);border-radius:6px;border-left:3px solid var(--accent-gold);font-size:0.85rem;">
                🏷️ ${t('library_lore.catalog_signature')}: <strong>${signature}</strong>
                <div style="margin-top:6px;font-size:0.78rem;opacity:0.75;font-style:italic;">${t('library_lore.catalog_signature_note')}</div></div>`;
            if (secundoFolio) {
                extra += `<div style="margin:10px 0;padding:8px 12px;background:rgba(139,111,60,0.08);border-radius:6px;border-left:3px solid var(--accent-gold);font-size:0.85rem;">
                    📜 ${t('library_lore.catalog_secundo_folio')}: <em>"${secundoFolio}"</em>
                    <div style="margin-top:6px;font-size:0.78rem;opacity:0.75;font-style:italic;">${t('library_lore.catalog_secundo_note')}</div></div>`;
            }
            extra += `<div style="margin:10px 0;padding:8px 12px;background:rgba(139,111,60,0.08);border-radius:6px;border-left:3px solid var(--accent-gold);font-size:0.85rem;">
                📅 ${t('library_lore.catalog_acquired')}: <strong>${acqText}</strong><br>
                ✒️ ${t('library_lore.catalog_cataloger')}: <strong>${t('library_lore.catalog_cataloger_name')}</strong></div>`;
            const _modalProt = (typeof LibraryHelpers !== 'undefined' && LibraryHelpers.getBookProtection) ? LibraryHelpers.getBookProtection(book) : null;
            if (_modalProt) {
                const _modalProtIcon = _modalProt === 'secreta' ? '🗝️' : _modalProt === 'catena' ? '⛓️' : '🖋️';
                const _modalProtLabel = _modalProt === 'secreta' ? (lang === 'en' ? 'Libraria Secreta' : 'Libraria Secreta')
                    : _modalProt === 'catena' ? (lang === 'en' ? 'Chained (Catena)' : 'Přikováno (Catena)')
                        : (lang === 'en' ? 'Anathema' : 'Anathema');
                extra += `<div style="margin:10px 0;padding:8px 12px;background:rgba(139,111,60,0.08);border-radius:6px;border-left:3px solid var(--accent-gold);font-size:0.85rem;">
                    ${_modalProtIcon} ${t('library_lore.catalog_protection')}: <strong>${_modalProtLabel}</strong></div>`;
            }
            body.insertAdjacentHTML('afterend', `<div style="padding:0 28px 8px;">${extra}</div>`);
        }, 20);
    },

    renderActions: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const _terrainF = (GameState.terrain && GameState.terrain.fatigue) || 0;
        const _curiaF = (GameState.curia && GameState.curia.fatigue) || 0;
        const _hAct = JSON.stringify(GameState.inventory) + lang + 'd:' + (GameState.selectedDuration ?? 0) + (GameState.activeAction ? GameState.activeAction.id + GameState.activeAction.endTime : '') + (GameState.flags.fireplaceLit ? '1' : '0') + (GameState.activeAction ? Math.floor(Date.now() / 1000) : '') + (GameState.scavengeCooldownUntil ? 'cd:' + Math.floor(Date.now() / 1000) : '') + (_terrainF > 20 ? 'tf:' + Math.floor(Date.now() / 60000) : '') + (_curiaF > 20 ? 'cf:' + Math.floor(Date.now() / 60000) : '');
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
                        <div class="action-info"><div class="action-name">${lang === 'en' ? 'Draw water' : 'Jít pro vodu'}</div>
                        <div class="action-desc" style="font-style:italic;">${msg}</div></div></div>
                        <button class="craft-btn" disabled>⏱️ ${lang === 'en' ? 'Instant only' : 'Jen okamžitě'}</button></div>`;
                    return;
                }

                // Well action passes checks - continue to render it below
            } else {
                // NORMAL REQUIREMENT CHECK - ONLY FOR NON-WELL ACTIONS
                if (act.req) {
                    if (Array.isArray(act.req)) {
                        // Pole req — zobrazit pokud hráč má alespoň jeden nástroj,
                        // ČERSTVÝ NEBO OPOTŘEBENÝ (worn_ varianta) — mirror fallback
                        // logiky v samotném provedení akce (viz ScavengeManager
                        // execute, worn_ + 20% výtěž). Bug fix 29.8.2026: dřív
                        // tlačítko zmizelo úplně, i když worn_ nástroj by akci
                        // reálně umožnil spustit (jen s nižší výtěží).
                        const hasAny = act.req.some(r => (GameState.inventory[r.item] || 0) > 0 || (GameState.inventory['worn_' + r.item] || 0) > 0);
                        if (!hasAny) return;
                    } else {
                        if (!(GameState.inventory[act.req] > 0)) return;
                    }
                }
            }
            // === END WELL HANDLING ===

            const actName = (lang === 'en' && act.name_en) ? act.name_en : act.name;
            const actDesc = (lang === 'en' && act.desc_en) ? act.desc_en : act.desc;

            const _actionBtnKeys = ['hunt', 'bark', 'basic', 'wetlands', 'nature', 'foraging', 'resin_harvest', 'wild_beekeeping', 'fishing', 'well_water', 'grass_gather', 'wood_harvest', 'worms_dig', 'dig_clay', 'yard_cleanup'];
            let btnText = t('actions.' + (_actionBtnKeys.includes(act.id) ? act.id : 'default'));
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
            newHTML += `<div style="${groupTitleStyle}">🌲 ${lang === 'en' ? 'Terrain' : 'Krajina'}</div>`;
            if (typeof TerrainSystem !== 'undefined') newHTML += TerrainSystem.renderIndicator();
            newHTML += terrainCards;
        }
        if (wellCards) {
            newHTML += `<div style="${groupTitleStyle}">🚰 ${lang === 'en' ? 'Well' : 'Studna'}</div>`;
            newHTML += wellCards;
        }
        if (otherCards) {
            newHTML += `<div style="${groupTitleStyle}">🏡 ${lang === 'en' ? 'Household' : 'Hospodářství'}</div>`;
            if (typeof CuriaSystem !== 'undefined') newHTML += CuriaSystem.renderIndicator();
            newHTML += otherCards;
        }

        // ── Oka na drobnou zvěř (L3b, Lovec řetěz) — blok jen když hráč oka má/líčí/má úlovky ──
        const snareInv = GameState.inventory['snare'] || 0;
        const caughtInv = GameState.inventory['caught_small_game'] || 0;
        const traps = GameState.snareTraps || [];
        if (snareInv > 0 || caughtInv > 0 || traps.length > 0) {
            const now = Date.now();
            const readyCnt = traps.filter(s => now >= s.readyAt).length;
            newHTML += `<div style="${groupTitleStyle}">🪤 ${lang === 'en' ? 'Snares' : 'Oka'}</div>`;
            let trapLines = '';
            traps.forEach(s => {
                const remH = Math.max(0, Math.ceil((s.readyAt - now) / 3600000));
                trapLines += `<div class="text-sm">${now >= s.readyAt ? '✅ ' + (lang === 'en' ? 'catch ready' : 'úlovek čeká') : '⏳ ' + remH + ' h'}</div>`;
            });
            newHTML += `<div class="card"><div class="item-icon">🪤</div><div><strong>${lang === 'en' ? 'Set snares' : 'Nalíčená oka'} (${traps.length}/3)</strong>${trapLines || `<div class="text-sm">${lang === 'en' ? 'None set.' : 'Žádné nalíčeno.'}</div>`}</div><div style="display:flex;flex-direction:column;gap:4px;">
                <button class="action-btn" onclick="Game.setSnare()" ${snareInv > 0 && traps.length < 3 ? '' : 'disabled'}>${lang === 'en' ? 'Set' : 'Nalíčit'} (${snareInv})</button>
                <button class="action-btn" onclick="Game.collectSnares()" ${readyCnt > 0 ? '' : 'disabled'}>${lang === 'en' ? 'Collect' : 'Sebrat'} (${readyCnt})</button>
            </div></div>`;
            if (caughtInv > 0) {
                const hasKnife = (GameState.inventory['stone_knife'] || 0) > 0;
                newHTML += `<div class="card"><div class="item-icon">🐿️</div><div><strong>${lang === 'en' ? 'Caught small game' : 'Ulovená drobná zvěř'} (${caughtInv})</strong><div class="text-sm">${lang === 'en' ? 'Dress with a knife: wild meat + fat + scraps (bone by chance). Or sell whole to the Hunter.' : 'Zpracuj nožem: divoké maso + tuk + zbytky (kost s šancí). Nebo prodej vcelku Lovci.'}</div></div><button class="action-btn" onclick="Game.processCaughtGame()" ${hasKnife ? '' : 'disabled'}>🔪 ${lang === 'en' ? 'Dress ×1' : 'Zpracovat ×1'}</button></div>`;
            }
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
            const _isRareModal = (id === 'netolicky_legacy') || id === 'old_coin_1' || id === 'old_coin_2' || id === 'old_coin_3' || id === 'torn_page' || id === 'wax_seal' || ['lost_key_1', 'lost_key_2', 'lost_key_3', 'lost_key_4', 'lost_key_5', 'key_large_1', 'key_large_2', 'key_large_3', 'lost_scroll_1', 'lost_scroll_2'].includes(id) || ['dried_herbs_bundle', 'hemp_pouch', 'mysterious_bulb', 'zrezly_kotlik'].includes(id);
            const _click = (_hasMateria || _isRareModal) ? `onclick="UI.showItemModal('${id}')" style="cursor:pointer;"` : '';
            let actionBtn = '';
            if (id === 'water' || id === 'spring_water' || id === 'holy_water') {
                actionBtn = `<button class="craft-btn" onclick="event.stopPropagation();Game.drink('${id}')" style="margin-left:auto;">${t('game.drink')}</button>`;
            } else if (item.type === 'food' || (typeof VigorSystem !== 'undefined' && VigorSystem.RAW_EDIBLE_FOOD && VigorSystem.RAW_EDIBLE_FOOD.includes(id))) {
                actionBtn = `<button class="craft-btn" onclick="event.stopPropagation();Game.eat('${id}')" style="margin-left:auto;">${t('game.eat')}</button>`;
            } else if (item.type === 'potion' || item.type === 'alchemy') {
                actionBtn = `<button class="craft-btn" onclick="event.stopPropagation();Game.eat('${id}')" style="margin-left:auto;">${t('game.eat')}</button>`;
            }
            return `<div class="card" ${_click}><div class="item-icon">${item.icon}</div><div><strong>${iName(id)}</strong> x${qty}<div class="text-sm">${iDesc(id)}</div></div>${actionBtn}</div>`;
        };

        // Všechny items s qty > 0, seřazené qty desc
        const allItems = Object.entries(GameState.inventory)
            .filter(([, qty]) => qty > 0)
            .sort(([, a], [, b]) => b - a);

        const filter = this.currentInvFilter || 'all';

        if (filter === 'other') {
            // Ostatní — stejná logika jako záchranná síť v pohledu "Vše" (níže),
            // jen jako samostatný filtr: cokoliv s type, které nepokrývá žádná
            // ze skupin filterGroups výše (misc, special, consumable, building, ...).
            const knownTypes = Object.values(filterGroups).flat();
            allItems.forEach(([id, qty]) => {
                const item = ItemsDB[id];
                if (!item || knownTypes.includes(item.type)) return;
                el.innerHTML += renderItem(id, qty);
            });
        } else if (filter !== 'all') {
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

            const hasRegistrum = GameState.researchedTechs && GameState.researchedTechs.includes('tech_backpack_ii');

            catOrder.forEach(cat => {
                const types = sectionTypes[cat];
                const group = allItems.filter(([id]) => {
                    const item = ItemsDB[id];
                    return item && types.includes(item.type);
                });
                if (group.length === 0) return;
                // Sestavit CELÝ blok (nadpis + body + karty) do jednoho stringu před
                // jediným innerHTML += — postupné += by neuzavřený <div id="penum-cat-body-*">
                // samo uzavřelo při každém re-parse a karty by skončily MIMO container
                // (ověřeno: prohlížeč automaticky doplní chybějící uzavírací tag při
                // každém innerHTML += voláním, takže otevřený tag "přežije" jen do
                // konce TOHOTO volání, ne mezi několika voláními).
                let sectionHtml;
                if (hasRegistrum) {
                    // Registrum Cellarii (tech_backpack_ii) — sbalovací nadpis
                    const collapsed = !!(GameState.uiPrefs && GameState.uiPrefs.invCollapsed && GameState.uiPrefs.invCollapsed[cat]);
                    sectionHtml = `<div style="grid-column:1/-1; margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35); cursor:pointer; display:flex; align-items:center; gap:6px;" onclick="UI.toggleInventoryCategory('${cat}')">
                        <span id="penum-cat-chevron-${cat}" style="font-size:0.65rem; display:inline-block; transition:transform 0.15s; transform:rotate(${collapsed ? 0 : 90}deg);">▶</span>
                        <span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${catLabels[cat]}</span>
                    </div>`;
                    sectionHtml += `<div id="penum-cat-body-${cat}" style="display:${collapsed ? 'none' : 'contents'};">`;
                    group.forEach(([id, qty]) => { sectionHtml += renderItem(id, qty); });
                    sectionHtml += `</div>`;
                } else {
                    // Bez Registrum Cellarii — statický nadpis, žádné sbalování
                    sectionHtml = `<div style="grid-column:1/-1; margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35);">
                        <span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${catLabels[cat]}</span>
                    </div>`;
                    group.forEach(([id, qty]) => { sectionHtml += renderItem(id, qty); });
                }
                el.innerHTML += sectionHtml;
            });

            // Záchranná síť — cokoliv s type, co není v žádné sekci výše, ať nikdy tiše nezmizí
            const knownTypes = Object.values(sectionTypes).flat();
            const leftover = allItems.filter(([id]) => {
                const item = ItemsDB[id];
                return item && !knownTypes.includes(item.type);
            });
            if (leftover.length > 0) {
                let otherHtml;
                if (hasRegistrum) {
                    const collapsedOther = !!(GameState.uiPrefs && GameState.uiPrefs.invCollapsed && GameState.uiPrefs.invCollapsed['other']);
                    otherHtml = `<div style="grid-column:1/-1; margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35); cursor:pointer; display:flex; align-items:center; gap:6px;" onclick="UI.toggleInventoryCategory('other')">
                        <span id="penum-cat-chevron-other" style="font-size:0.65rem; display:inline-block; transition:transform 0.15s; transform:rotate(${collapsedOther ? 0 : 90}deg);">▶</span>
                        <span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${lang === 'en' ? '📦 Other' : '📦 Ostatní'}</span>
                    </div>`;
                    otherHtml += `<div id="penum-cat-body-other" style="display:${collapsedOther ? 'none' : 'contents'};">`;
                    leftover.forEach(([id, qty]) => { otherHtml += renderItem(id, qty); });
                    otherHtml += `</div>`;
                } else {
                    otherHtml = `<div style="grid-column:1/-1; margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35);">
                        <span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${lang === 'en' ? '📦 Other' : '📦 Ostatní'}</span>
                    </div>`;
                    leftover.forEach(([id, qty]) => { otherHtml += renderItem(id, qty); });
                }
                el.innerHTML += otherHtml;
            }
        }
        this._updateInvFilterBar();
    },
    filterCrafting: function (cat, btn) {
        this.currentFilter = cat;
        if (btn) { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
        this.renderCrafting();
        this.renderResourceTracker();
    },
    toggleCraftCategory: function (cat) {
        if (!GameState.uiPrefs) GameState.uiPrefs = { craftCollapsed: {} };
        if (!GameState.uiPrefs.craftCollapsed) GameState.uiPrefs.craftCollapsed = {};
        const collapsed = !GameState.uiPrefs.craftCollapsed[cat];
        GameState.uiPrefs.craftCollapsed[cat] = collapsed;
        const body = document.getElementById('craft-cat-body-' + cat);
        if (body) body.style.display = collapsed ? 'none' : 'contents';
        const chevron = document.getElementById('craft-cat-chevron-' + cat);
        if (chevron) chevron.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(90deg)';
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },
    // Sbalovací kategorie v pohledu "Vše" tabu Zásoby/Penum (renderInventory) —
    // stejný vzor jako toggleCraftCategory, vlastní klíč ať nekoliduje.
    toggleInventoryCategory: function (cat) {
        if (!GameState.uiPrefs) GameState.uiPrefs = {};
        if (!GameState.uiPrefs.invCollapsed) GameState.uiPrefs.invCollapsed = {};
        const collapsed = !GameState.uiPrefs.invCollapsed[cat];
        GameState.uiPrefs.invCollapsed[cat] = collapsed;
        const body = document.getElementById('penum-cat-body-' + cat);
        if (body) body.style.display = collapsed ? 'none' : 'contents';
        const chevron = document.getElementById('penum-cat-chevron-' + cat);
        if (chevron) chevron.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(90deg)';
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },
    // Filtr Knihovny (tech_bibliotheca_catalogus) — přegeneruje celý blok,
    // aktivní tlačítko se spočítá znovu z UI.currentLibraryFilter, žádná
    // ruční manipulace tříd netřeba (na rozdíl od filterCrafting výše).
    filterLibrary: function (key) {
        this.currentLibraryFilter = key;
        this.renderLibrary();
    },
    // Sbalovací kategorie v Knihovně — stejný vzor jako toggleInventoryCategory.
    toggleLibraryCategory: function (cat) {
        if (!GameState.uiPrefs) GameState.uiPrefs = {};
        if (!GameState.uiPrefs.libCollapsed) GameState.uiPrefs.libCollapsed = {};
        const collapsed = !GameState.uiPrefs.libCollapsed[cat];
        GameState.uiPrefs.libCollapsed[cat] = collapsed;
        const body = document.getElementById('lib-cat-body-' + cat);
        if (body) body.style.display = collapsed ? 'none' : '';
        const chevron = document.getElementById('lib-cat-chevron-' + cat);
        if (chevron) chevron.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(90deg)';
        if (typeof Game !== 'undefined' && Game.save) Game.save();
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
        const hasL3 = techs.includes('tech_backpack_ii'); // Registrum Cellarii

        // Zobrazit/skrýt celý bar
        bar.style.display = hasL1 ? 'flex' : 'none';
        if (!hasL1) return;

        // Úroveň 2 filtry — zobrazit jen s tech_inventarium
        const l2 = ['inv-filter-food', 'inv-filter-alchemy', 'inv-filter-stone', 'inv-filter-iron', 'inv-filter-fire'];
        l2.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = hasL2 ? 'inline-flex' : 'none';
        });

        // Úroveň 3 (Registrum Cellarii, tech_backpack_ii) — tlačítko "Ostatní"
        // i sbalovací kategorie v pohledu "Vše" jsou podmíněné stejným techem.
        const otherBtn = document.getElementById('inv-filter-other');
        if (otherBtn) otherBtn.style.display = hasL3 ? 'inline-flex' : 'none';
        if (!hasL3 && this.currentInvFilter === 'other') {
            this.currentInvFilter = 'all';
        }
    },
    renderCrafting: function () {
        const _hCraft = JSON.stringify(GameState.unlockedRecipes) + JSON.stringify(GameState.inventory) + JSON.stringify(['cerna_kuchyne', 'udirna', 'velky_hmozdir', 'rozen'].map(b => GameState.storage && GameState.storage[b] && GameState.storage[b].built)) + (this.currentFilter || 'all');
        if (_hCraft === this._hashCraft) return;
        this._hashCraft = _hCraft;
        const el = document.getElementById('crafting-list'); el.innerHTML = "";
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // coquina-vyroba-mrd (9.8.2026): needsBuild — recepty vázané na budovu
        // (Černá kuchyně, Udírna, Velký hmoždíř, Rožeň), mirror COOK_TYPES
        // ve CookingSystem.js. Jméno budov jen pro zobrazení — zdroj pravdy
        // (cost, req_tech) zůstává v CellariumSystem.js, nic se neduplikuje.
        const buildNames = {
            cerna_kuchyne: { cs: 'Černá kuchyně', en: 'Black Kitchen' },
            udirna: { cs: 'Udírna', en: 'Smokehouse' },
            velky_hmozdir: { cs: 'Velký hmoždíř', en: 'Great Mortar' },
            rozen: { cs: 'Rožeň', en: 'Spit' },
        };
        const buildName = (id) => (buildNames[id] && buildNames[id][lang]) || id;
        const hasBuild = (id) => !!(GameState.storage && GameState.storage[id] && GameState.storage[id].built);

        const renderRecipe = (r) => {
            const prod = ItemsDB[r.output]; let reqStr = ""; let can = true;
            for (let [id, amt] of Object.entries(r.req)) {
                const has = GameState.inventory[id] || 0; if ((amt > 0 && has < amt) || (amt === 0 && !has)) can = false;
                reqStr += `<span class="${(amt > 0 && has < amt) || (amt === 0 && !has) ? 'text-danger' : ''}">${amt === 0 ? t('game.required') : amt + 'x'} ${iName(id)}</span>, `;
            }
            if (r.needsBuild) {
                const built = hasBuild(r.needsBuild);
                if (!built) can = false;
                reqStr += `<span class="${built ? '' : 'text-danger'}">+ 🏛️ ${buildName(r.needsBuild)}</span>, `;
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

            const btnLabel = r.id.startsWith('repair_') ? t('craft.repair') : (r.cat === 'food' ? t('craft.cook') : t('craft.btn'));
            return `<div class="card${blindClass}" data-recipe-id="${r.id}" style="opacity:${can ? 1 : 0.6}; position:relative;"><div class="item-icon">${prod.icon}</div><div style="flex:1"><strong>${iName(r.output)}${blindIcon}${ownedStr}</strong><div class="text-sm">${reqStr.slice(0, -2)}</div>${researchBadge}</div><button class="craft-btn" onclick="Game.craft('${r.id}')" ${can ? '' : 'disabled'}>${btnLabel}</button></div>`;
        };

        // Seskupení receptů se stejným výstupem (a stejnou kategorií) do jedné
        // "rodiny" — např. Šrot z různých obilovin. RecipesDB se nemění,
        // jde jen o zobrazení. Rodina s 1 receptem = beze změny chování.
        // fix 29.8.2026 (repair-craft-separation): klíč navíc rozlišuje
        // repair_ vs craft — dřív se "Vykovat sekerku ze surovin" a "Opravit
        // sekerku kleštěmi/brouskem" slily do JEDNÉ karty s jedním tlačítkem,
        // co si samo vybralo variantu (první splnitelnou) — hráč si nemohl
        // vybrat, jestli chce craftit novou, nebo opravit starou. Teď craft
        // a repair(y) dostanou oddělené karty; repair varianty (kleště NEBO
        // brousek) zůstávají spolu jako dřív, protože obě dělají totéž.
        const groupByOutput = (arr) => {
            const map = new Map();
            arr.forEach(r => {
                const key = r.output + '|' + r.cat + '|' + (r.id.startsWith('repair_') ? 'repair' : 'craft');
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(r);
            });
            return Array.from(map.values());
        };

        const renderRecipeFamily = (fam) => {
            if (fam.length === 1) return renderRecipe(fam[0]);
            const prod = ItemsDB[fam[0].output];
            const owned = GameState.inventory[fam[0].output] || 0;
            const ownedStr = owned > 0 ? ` <span style="opacity:0.6; font-size:0.85em;">(${lang === 'en' ? 'have' : 'máš'}: ${owned})</span>` : '';
            const orLabel = lang === 'en' ? 'OR' : 'NEBO';

            let bestId = null;
            let bestR = null;
            const parts = fam.map(r => {
                let can = true; let reqStr = '';
                for (let [id, amt] of Object.entries(r.req)) {
                    const has = GameState.inventory[id] || 0;
                    const missing = (amt > 0 && has < amt) || (amt === 0 && !has);
                    if (missing) can = false;
                    reqStr += `<span class="${missing ? 'text-danger' : ''}">${amt === 0 ? t('game.required') : amt + 'x'} ${iName(id)}</span>, `;
                }
                reqStr = reqStr.slice(0, -2);
                if (r.toolReq) {
                    const hasTool = r.toolReq.some(tr => (GameState.inventory[tr.item] > 0) || (GameState.inventory['worn_' + tr.item] > 0));
                    if (!hasTool) can = false;
                    const toolNames = r.toolReq.map(tr => iName(tr.item)).join('/');
                    reqStr += ` <span class="${hasTool ? '' : 'text-danger'}">+ 🔧 ${toolNames}</span>`;
                }
                if (r.needsBuild) {
                    const built = hasBuild(r.needsBuild);
                    if (!built) can = false;
                    reqStr += ` <span class="${built ? '' : 'text-danger'}">+ 🏛️ ${buildName(r.needsBuild)}</span>`;
                }
                if (r.qty && r.qty !== 1) reqStr += ` <span style="opacity:0.55;">→ ${r.qty}×</span>`;
                if (can && bestId === null) { bestId = r.id; bestR = r; }
                return `<span style="${can ? '' : 'opacity:0.6;'}">${reqStr}</span>`;
            });
            const anyCan = bestId !== null;
            if (!anyCan) { bestId = fam[0].id; bestR = fam[0]; } // cíl pro disabled tlačítko

            const reqBlock = `<div class="text-sm">${parts.join(` <span style="opacity:0.5;">${orLabel}</span> `)}</div>`;
            const btnLabel = bestR && bestR.id.startsWith('repair_') ? t('craft.repair') : (fam[0].cat === 'food' ? t('craft.cook') : t('craft.btn'));
            return `<div class="card" data-recipe-id="${bestId}" style="opacity:${anyCan ? 1 : 0.6}; position:relative;"><div class="item-icon">${prod.icon}</div><div style="flex:1"><strong>${iName(fam[0].output)}${ownedStr}</strong>${reqBlock}</div><button class="craft-btn" onclick="Game.craft('${bestId}')" ${anyCan ? '' : 'disabled'}>${btnLabel}</button></div>`;
        };

        const visible = RecipesDB.filter(r => {
            if (r.cat === 'alchemy_ing') return false;
            if (r.locked && !GameState.unlockedRecipes.includes(r.id)) return false;
            if (this.currentFilter !== 'all' && r.cat !== this.currentFilter) return false;
            return true;
        });

        let _html = '';
        if (this.currentFilter !== 'all') {
            // Jednoduchý seznam bez nadpisů
            groupByOutput(visible).forEach(fam => { _html += renderRecipeFamily(fam); });
        } else {
            // Seskupení podle kategorií s nadpisy
            const catOrder = ['stone', 'iron', 'craft', 'building', 'fire', 'parchment', 'codex', 'food', 'alchemy', 'lore', 'mat'];
            const catLabels = {
                stone: lang === 'en' ? '🪨 Stone Tools' : '🪨 Kamenné nástroje',
                iron: lang === 'en' ? '⚒️ Iron Tools' : '⚒️ Železné nástroje',
                craft: lang === 'en' ? '🪵 Crafting' : '🪵 Řemeslo',
                building: lang === 'en' ? '🏗️ Buildings' : '🏗️ Stavby',
                fire: lang === 'en' ? '🕯️ Fire & Light' : '🕯️ Oheň & Světlo',
                parchment: lang === 'en' ? '📜 Parchment' : '📜 Pergamen & Inkoust',
                codex: lang === 'en' ? '📖 Codex' : '📖 Kodex & Tisk',
                food: lang === 'en' ? '🍖 Food' : '🍖 Jídlo',
                alchemy: lang === 'en' ? '⚗️ Alchemy' : '⚗️ Alchymie',
                lore: lang === 'en' ? '🎲 Knowledge' : '🎲 Vědění & Hry',
                mat: lang === 'en' ? '📦 Materials' : '📦 Materiály',
            };
            catOrder.forEach(cat => {
                const catRecipes = visible.filter(r => r.cat === cat);
                if (catRecipes.length === 0) return;
                const collapsed = !!(GameState.uiPrefs && GameState.uiPrefs.craftCollapsed && GameState.uiPrefs.craftCollapsed[cat]);
                _html += `<div style="grid-column:1/-1; margin:12px 0 6px; padding:4px 0; border-bottom:1px solid rgba(197,160,89,0.35); cursor:pointer; display:flex; align-items:center; gap:6px;" onclick="UI.toggleCraftCategory('${cat}')">
                    <span id="craft-cat-chevron-${cat}" style="font-size:0.65rem; display:inline-block; transition:transform 0.15s; transform:rotate(${collapsed ? 0 : 90}deg);">▶</span>
                    <span style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85;">${catLabels[cat]}</span>
                </div>`;
                _html += `<div id="craft-cat-body-${cat}" style="display:${collapsed ? 'none' : 'contents'};">`;
                groupByOutput(catRecipes).forEach(fam => { _html += renderRecipeFamily(fam); });
                _html += `</div>`;
            });
        }
        el.innerHTML = _html;
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
                // Vysvětlení: proč je výnos snížený (pásmo hladiny)
                if (info.levelBandKey && info.levelBandKey !== 'levelBandFull') {
                    const bandLabel = t('wellUI.' + info.levelBandKey);
                    if (info.levelMod === null || typeof info.levelMod === 'undefined') {
                        rows.push('💧 ' + t('wellUI.levelYieldInfoFixed').replace('{band}', bandLabel).replace('{amt}', info.yieldNow));
                    } else {
                        rows.push('💧 ' + t('wellUI.levelYieldInfo').replace('{band}', bandLabel).replace('{mod}', info.levelMod));
                    }
                }
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


    toggleTechCard: function (el) {
        el.querySelectorAll('.tech-full').forEach(f => { f.style.display = f.style.display === 'block' ? 'none' : 'block'; });
        el.querySelectorAll('.tech-short').forEach(s => { s.style.display = s.style.display === 'none' ? '' : 'none'; });
    },
    filterTech: function (key) {
        this.currentTechFilter = key;
        this.renderScriptorium();
    },
    renderScriptorium: function () {
        const el = document.getElementById('lore-research-content'); const res = GameState.inventory['research'] || 0;
        const _t = window.t || t;
        const _lang = (GameState.settings && GameState.settings.language) || 'cs';
        const notesLabel = _lang === 'en' ? 'Notes:' : 'Zápisky:';
        let h = `<div id="manuscript-copy-widget">${typeof ManuscriptCopySystem !== 'undefined' ? ManuscriptCopySystem.renderWidget() : ''}</div>`;
        h += `<div style="grid-column:1/-1;text-align:center;margin-bottom:15px;border:1px solid var(--accent-gold);padding:10px;">${notesLabel} <strong>${res}</strong> 📜</div>`;

        // tech_scriptorium_catalogus — filtrování Vše/Vyzkoumané/Nevyzkoumané (mirror Knihovna vzoru, tech_bibliotheca_catalogus)
        const hasTechCatalogus = GameState.researchedTechs && GameState.researchedTechs.includes('tech_scriptorium_catalogus');
        const techFilter = hasTechCatalogus ? (this.currentTechFilter || 'all') : 'all';
        const matchesTechFilter = (tech) => {
            if (!hasTechCatalogus) return true;
            const isDone = GameState.researchedTechs.includes(tech.id);
            switch (techFilter) {
                case 'researched': return isDone;
                case 'unresearched': return !isDone;
                default: return true; // 'all'
            }
        };
        if (hasTechCatalogus) {
            const techFilters = [
                { key: 'all', label: _lang === 'en' ? 'All' : 'Vše' },
                { key: 'researched', label: _lang === 'en' ? 'Researched' : 'Vyzkoumané' },
                { key: 'unresearched', label: _lang === 'en' ? 'Unresearched' : 'Nevyzkoumané' },
            ];
            h += `<div style="grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">`;
            techFilters.forEach(f => {
                h += `<button class="filter-btn${techFilter === f.key ? ' active' : ''}" onclick="UI.filterTech('${f.key}')">${f.label}</button>`;
            });
            h += `</div>`;
        }

        TechTree.filter(matchesTechFilter).forEach(tech => {
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

            // NOVÉ: kontrola knihy
            if (tech.requiresBook && !done) {
                const hasRead = GameState.library && GameState.library.readBooks && GameState.library.readBooks.includes(tech.requiresBook);
                if (!hasRead) {
                    canResearch = false;
                    const bookDef = typeof LibraryDB !== 'undefined' ? LibraryDB[tech.requiresBook] : null;
                    const bookName = bookDef ? ((lang !== 'cs' && bookDef.name_en) ? bookDef.name_en : bookDef.name) : tech.requiresBook;
                    reqText += `<div class="text-sm text-danger">📖 ${lang === 'en' ? 'Requires reading:' : 'Vyžaduje přečtení:'} ${bookName}</div>`;
                }
            }

            const DESC_TRUNC = 110;
            const descIsLong = displayDesc.length > DESC_TRUNC;
            const descShort = descIsLong ? displayDesc.slice(0, DESC_TRUNC).replace(/\s+\S*$/, '') + '…' : displayDesc;
            const descHtml = descIsLong
                ? `<span class="tech-short">${descShort}</span><span class="tech-full" style="display:none;">${displayDesc}</span>`
                : displayDesc;

            h += `<div class="card" style="border-color:${done ? 'var(--accent-gold)' : 'var(--ink-secondary)'};flex-wrap:wrap;" onclick="UI.toggleTechCard(this)">
                <div class="item-icon" style="background:${done ? '#c5a059' : '#e8dec0'};flex-shrink:0">${done ? '🎓' : '📖'}</div>
                <div style="flex:1;min-width:0">
                    <strong>${displayName}</strong>
                    <div class="text-sm">${descHtml}</div>
                    ${reqText}
                    ${typeof TechLoreDB !== 'undefined' && TechLoreDB[tech.id] ? `<div class="text-sm" style="margin-top:6px;font-style:italic;opacity:0.75;"><span class="tech-short">${TechLoreDB[tech.id].replace(/<[^>]*>/g, '').split(' ').slice(0, 8).join(' ')}…</span><span class="tech-full" style="display:none;margin-top:6px;padding:8px;background:rgba(197,160,89,0.1);border-left:3px solid var(--accent-gold);">${TechLoreDB[tech.id]}</span></div>` : ''}
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
        if (!btn) btn = document.getElementById('lore-tab-' + tab);
        // Hide all tabs
        document.getElementById('lore-research-content').style.display = 'none';
        document.getElementById('lore-codex-content').style.display = 'none';
        document.getElementById('lore-notebooks-content').style.display = 'none';
        document.getElementById('lore-achievements-content').style.display = 'none';
        const _ltasksEl = document.getElementById('lore-tasks-content'); if (_ltasksEl) _ltasksEl.style.display = 'none';
        const _lmsEl = document.getElementById('lore-manuscripts-content'); if (_lmsEl) _lmsEl.style.display = 'none';
        const _lichEl = document.getElementById('lore-iching-content'); if (_lichEl) _lichEl.style.display = 'none';
        const _lcalEl = document.getElementById('lore-calendarium-content'); if (_lcalEl) _lcalEl.style.display = 'none';
        const _lperEl = document.getElementById('lore-persona-content'); if (_lperEl) _lperEl.style.display = 'none';
        const _lportEl = document.getElementById('lore-porta-content'); if (_lportEl) _lportEl.style.display = 'none';
        const _lcommitEl = document.getElementById('lore-commitments-content'); if (_lcommitEl) _lcommitEl.style.display = 'none';

        // Remove active class from screen-lore filter buttons
        document.querySelectorAll('#screen-lore .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        // Show selected tab
        if (tab === 'research') {
            document.getElementById('lore-research-content').style.display = '';
            UI.renderScriptorium();
        } else if (tab === 'tasks') {
            if (_ltasksEl) { _ltasksEl.style.display = 'block'; if (typeof MonasticTasksSystem !== 'undefined') MonasticTasksSystem.render(); else UI.renderMonasticTasks(); }
        } else if (tab === 'manuscripts') {
            if (_lmsEl) { _lmsEl.style.display = 'block'; if (typeof ManuscriptCopySystem !== 'undefined') ManuscriptCopySystem.renderPage(); else UI.renderManuscriptCopying(); }
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
        } else if (tab === 'porta') {
            if (_lportEl) { _lportEl.style.display = 'block'; if (typeof PortaSystem !== 'undefined') PortaSystem.render(); }
        } else if (tab === 'commitments') {
            if (_lcommitEl) { _lcommitEl.style.display = 'block'; if (typeof CommitmentsSystem !== 'undefined') CommitmentsSystem.render(); }
        }
    },

    switchLibraryTab: function (tab, btn) {
        if (!GameState.ui) GameState.ui = {};
        GameState.ui.libraryTab = tab;

        // Hide all library tabs
        const tabs = ['books', 'games', 'news', 'scrinium', 'kronika', 'kraj', 'studovna', 'vypujcky', 'katalog', 'opat'];
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
        } else if (tab === 'kraj') {
            const el = document.getElementById('library-kraj-content');
            if (el) { el.style.display = 'block'; UI.renderChroniconWindow(); }
        } else if (tab === 'studovna') {
            const el = document.getElementById('library-studovna-content');
            if (el) { el.style.display = 'block'; if (typeof StudovnaSystem !== 'undefined') StudovnaSystem.render(); }
        } else if (tab === 'vypujcky') {
            const el = document.getElementById('library-vypujcky-content');
            if (el) { el.style.display = 'block'; UI.renderVypujckyTab(); }
        } else if (tab === 'katalog') {
            const el = document.getElementById('library-katalog-content');
            if (el) { el.style.display = 'block'; UI.renderCatalogTab(); }
        } else if (tab === 'opat') {
            const el = document.getElementById('library-opat-content');
            if (el) { el.style.display = 'block'; if (typeof AbbotSystem !== 'undefined') AbbotSystem.render(); }
        }
    },

    renderMonasticTasks: function () {
        const el = document.getElementById('lore-tasks-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';

        if (!GameState.tasksState) {
            GameState.tasksState = {
                completedToday: {},
                canonicalCompletedToday: {},
                lastResetDay: GameState.stats ? GameState.stats.day : 1
            };
        }
        if (!GameState.tasksState.canonicalCompletedToday) {
            GameState.tasksState.canonicalCompletedToday = {};
        }

        const currentDay = GameState.stats ? GameState.stats.day : 1;
        const todayDate = new Date().toISOString().slice(0, 10);
        if (GameState.tasksState.lastResetDay !== currentDay || GameState.tasksState.lastResetDate !== todayDate) {
            GameState.tasksState.completedToday = {};
            GameState.tasksState.canonicalCompletedToday = {};
            GameState.tasksState.lastResetDate = todayDate;
            GameState.tasksState.lastResetDay = currentDay;
        }

        const tasksList = [
            { id: 'task_prayer', icon: '⛪', title: isEn ? 'Morning Office & Prayer' : 'Ranní officium a modlitba', desc: isEn ? 'Recite Psalms for spiritual strength (+10 Vigor)' : 'Recitace žalmů pro duchovní sílu (+10 Vigor)' },
            { id: 'task_scriptorium', icon: '✒️', title: isEn ? 'Scriptorium Copying Duty' : 'Služba v skriptoriu', desc: isEn ? 'Write scripture lines (+5 Research)' : 'Napsat 5 řádků písemností (+5 Výzkum)' },
            { id: 'task_garden', icon: '🪴', title: isEn ? 'Herb Garden Tending' : 'Péče o klášterní zahrádku', desc: isEn ? 'Water herbs (+1 Herbs)' : 'Zalít bylinky a plevat plevel (+1 Byliny)' },
            { id: 'task_library', icon: '📖', title: isEn ? 'Library Cataloging' : 'Katalogizace knihovny', desc: isEn ? 'Inspect scroll condition (+3 Research)' : 'Prohlédnout stav svitků (+3 Výzkum)' }
        ];

        let h = `<div style="padding:20px; background:#fbf7ee; border:1px solid #c5a059; border-radius:8px; position:relative; box-shadow:0 4px 12px rgba(0,0,0,0.06);">`;
        // Corner ornaments
        h += `<div style="position:absolute; top:4px; left:4px; width:10px; height:10px; border-top:2px solid #c5a059; border-left:2px solid #c5a059;"></div>`;
        h += `<div style="position:absolute; top:4px; right:4px; width:10px; height:10px; border-top:2px solid #c5a059; border-right:2px solid #c5a059;"></div>`;
        h += `<div style="position:absolute; bottom:4px; left:4px; width:10px; height:10px; border-bottom:2px solid #c5a059; border-left:2px solid #c5a059;"></div>`;
        h += `<div style="position:absolute; bottom:4px; right:4px; width:10px; height:10px; border-bottom:2px solid #c5a059; border-right:2px solid #c5a059;"></div>`;

        h += `<div style="font-size:0.75rem; font-weight:bold; letter-spacing:1.5px; color:#2b6cb0; text-transform:uppercase; margin-bottom:6px;">📜 ${isEn ? 'DAILY SCHEDULE (HORARIUM MONASTICUM)' : 'DENNÍ ŘÁD (HORARIUM MONASTICUM)'}</div>`;
        h += `<div style="font-size:0.85rem; color:#4a5568; margin-bottom:16px;">${isEn ? 'Rule of Saint Benedict: Ora et labora. Fulfill daily duties for spiritual and practical benefit of the monastery.' : 'Řehole svatého Benedikta: Ora et labora. Plň každodenní povinnosti pro duchovní i praktický užitek kláštera.'}</div>`;

        // Canonical Hours Grid matching Horarium
        const canonicalGrid = [
            { id: 'vigilie', name: 'Vigilie', nameEn: 'Vigils', time: '02:00', targetHour: 2, icon: '🌙' },
            { id: 'laudes', name: 'Laudes', nameEn: 'Lauds', time: '06:00', targetHour: 6, icon: '🌅' },
            { id: 'prima', name: 'Prima', nameEn: 'Prime', time: '09:00', targetHour: 9, icon: '☀️' },
            { id: 'sexta', name: 'Sexta', nameEn: 'Sext', time: '12:00', targetHour: 12, icon: '☀️' },
            { id: 'nona', name: 'Nona', nameEn: 'None', time: '15:00', targetHour: 15, icon: '🌤️' },
            { id: 'vesperae', name: 'Vesperae', nameEn: 'Vespers', time: '18:00', targetHour: 18, icon: '🏙️' }
        ];

        const realHour = new Date().getHours();

        h += `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap:8px; margin-bottom:12px;">`;
        canonicalGrid.forEach(ch => {
            const isDone = !!GameState.tasksState.canonicalCompletedToday[ch.id];
            const isOnTime = (realHour === ch.targetHour);
            const name = isEn ? ch.nameEn : ch.name;

            h += `<div onclick="${isDone ? '' : `UI.prayCanonicalHour('${ch.id}')`}" style="padding:10px 6px; background:${isDone ? 'rgba(230,244,234,0.9)' : (isOnTime ? 'rgba(255,248,225,0.95)' : 'rgba(255,255,255,0.7)')}; border:1px solid ${isDone ? 'rgba(76,175,80,0.45)' : (isOnTime ? '#f1c40f' : 'rgba(197,160,89,0.4)')}; border-radius:6px; text-align:center; position:relative; cursor:${isDone ? 'default' : 'pointer'}; ${isOnTime && !isDone ? 'box-shadow:0 0 8px rgba(241,196,15,0.5);' : ''}">
                <div style="font-size:1.3rem; margin-bottom:2px;">${ch.icon}</div>
                <div style="font-weight:bold; font-size:0.8rem; color:#2c3e50;">${name}</div>
                <div style="font-size:0.68rem; opacity:0.65; margin-bottom:4px;">${ch.time}</div>`;

            if (isDone) {
                h += `<div style="color:#27ae60; font-size:0.75rem; font-weight:bold; margin-top:2px;">✔ ${isEn ? 'Completed' : 'Splněno'}</div>`;
            } else {
                h += `<button class="medieval-btn" onclick="event.stopPropagation(); UI.prayCanonicalHour('${ch.id}')" style="padding:2px 6px; font-size:0.72rem; border-radius:4px; font-weight:bold; cursor:pointer; background:${isOnTime ? 'linear-gradient(180deg, #27ae60 0%, #1e8449 100%)' : 'linear-gradient(180deg, #8b4513 0%, #5a2a0a 100%)'}; color:#fff; border:1px solid ${isOnTime ? '#27ae60' : '#d4af37'}; width:100%; margin-top:2px;" title="${isOnTime ? (isEn ? 'Pray now for time bonus!' : 'Pomodlit se nyní včas (+Bonus)') : (isEn ? 'Fulfill outside hour (no bonus)' : 'Splnit mimo čas (bez bonusu)')}">
                    ${isEn ? 'Pray' : 'Splnit'} ${isOnTime ? '⚡' : ''}
                </button>`;
            }
            h += `</div>`;
        });
        h += `</div>`;

        // Completorium card below grid
        const compDone = !!GameState.tasksState.canonicalCompletedToday['completorium'];
        const compOnTime = (realHour === 21);
        const compName = isEn ? 'Compline' : 'Completorium';

        h += `<div style="display:flex; justify-content:center; margin-bottom:20px;">`;
        h += `<div onclick="${compDone ? '' : `UI.prayCanonicalHour('completorium')`}" style="padding:10px 24px; background:${compDone ? 'rgba(230,244,234,0.9)' : (compOnTime ? 'rgba(255,248,225,0.95)' : 'rgba(255,255,255,0.7)')}; border:1px solid ${compDone ? 'rgba(76,175,80,0.45)' : (compOnTime ? '#f1c40f' : 'rgba(197,160,89,0.4)')}; border-radius:6px; text-align:center; min-width:150px; cursor:${compDone ? 'default' : 'pointer'}; ${compOnTime && !compDone ? 'box-shadow:0 0 8px rgba(241,196,15,0.5);' : ''}">
            <div style="font-size:1.3rem; margin-bottom:2px;">🕯️</div>
            <div style="font-weight:bold; font-size:0.8rem; color:#2c3e50;">${compName}</div>
            <div style="font-size:0.68rem; opacity:0.65; margin-bottom:4px;">21:00</div>`;

        if (compDone) {
            h += `<div style="color:#27ae60; font-size:0.75rem; font-weight:bold; margin-top:2px;">✔ ${isEn ? 'Completed' : 'Splněno'}</div>`;
        } else {
            h += `<button class="medieval-btn" onclick="event.stopPropagation(); UI.prayCanonicalHour('completorium')" style="padding:2px 10px; font-size:0.72rem; border-radius:4px; font-weight:bold; cursor:pointer; background:${compOnTime ? 'linear-gradient(180deg, #27ae60 0%, #1e8449 100%)' : 'linear-gradient(180deg, #8b4513 0%, #5a2a0a 100%)'}; color:#fff; border:1px solid ${compOnTime ? '#27ae60' : '#d4af37'}; margin-top:2px;" title="${compOnTime ? (isEn ? 'Pray now for time bonus!' : 'Pomodlit se nyní včas (+Bonus)') : (isEn ? 'Fulfill outside hour (no bonus)' : 'Splnit mimo čas (bez bonusu)')}">
                ${isEn ? 'Pray' : 'Splnit'} ${compOnTime ? '⚡' : ''}
            </button>`;
        }
        h += `</div></div>`;

        // Decorative divider
        h += `<div style="position:relative; height:1px; background:#90cdf4; margin:16px 0 20px 0;">`;
        h += `<div style="position:absolute; top:-3px; left:50%; transform:translateX(-50%) rotate(45deg); width:7px; height:7px; background:#90cdf4;"></div>`;
        h += `</div>`;

        h += `<div style="font-size:0.9rem; font-weight:bold; color:#2c3e50; margin-bottom:12px;">📋 ${isEn ? 'Daily Duties' : 'Denní povinnosti k vyplnění'}</div>`;
        h += `<div style="display:flex; flex-direction:column; gap:10px;">`;
        tasksList.forEach(t => {
            const isDone = !!GameState.tasksState.completedToday[t.id];
            h += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:${isDone ? 'rgba(76,175,80,0.08)' : 'rgba(255,255,255,0.6)'}; border:1px solid ${isDone ? 'rgba(76,175,80,0.35)' : 'rgba(197,160,89,0.35)'}; border-radius:8px;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="font-size:1.6rem;">${t.icon}</div>
                    <div>
                        <div style="font-weight:bold; font-size:0.92rem; color:#2c3e50;">${t.title} ${isDone ? '<span style="color:#27ae60;">✔</span>' : ''}</div>
                        <div style="font-size:0.78rem; opacity:0.75; color:#555;">${t.desc}</div>
                    </div>
                </div>
                <div>
                    <button class="medieval-btn" style="padding:6px 14px; font-size:0.8rem; border-radius:4px; font-weight:bold; cursor:${isDone ? 'default' : 'pointer'}; background:${isDone ? '#e2e8f0' : 'linear-gradient(180deg, #8b4513 0%, #5a2a0a 100%)'}; color:${isDone ? '#718096' : '#fff'}; border:1px solid ${isDone ? '#cbd5e0' : '#d4af37'};" ${isDone ? 'disabled' : `onclick="UI.completeMonasticTask('${t.id}')"`}>
                        ${isDone ? (isEn ? 'Completed' : 'Splněno') : (isEn ? 'Fulfill' : 'Splnit')}
                    </button>
                </div>
            </div>`;
        });
        h += `</div></div>`;
        el.innerHTML = h;
    },

    prayCanonicalHour: function (hourId) {
        if (!GameState.tasksState) {
            GameState.tasksState = {
                completedToday: {},
                canonicalCompletedToday: {},
                lastResetDay: GameState.stats ? GameState.stats.day : 1
            };
        }
        if (!GameState.tasksState.canonicalCompletedToday) {
            GameState.tasksState.canonicalCompletedToday = {};
        }

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';

        if (GameState.tasksState.canonicalCompletedToday[hourId]) {
            UI.notify(isEn ? '🙏 Already prayed this canonical hour today.' : '🙏 Tato modlitba již byla dnes splněna.', true);
            return;
        }

        const prayerWindows = {
            vigilie: { name: 'Vigilie', nameEn: 'Vigils', targetHour: 2, icon: '🌙' },
            laudes: { name: 'Laudes', nameEn: 'Lauds', targetHour: 6, icon: '🌅' },
            prima: { name: 'Prima', nameEn: 'Prime', targetHour: 9, icon: '☀️' },
            sexta: { name: 'Sexta', nameEn: 'Sext', targetHour: 12, icon: '🌞' },
            nona: { name: 'Nona', nameEn: 'None', targetHour: 15, icon: '🌤️' },
            vesperae: { name: 'Vesperae', nameEn: 'Vespers', targetHour: 18, icon: '🌇' },
            completorium: { name: 'Completorium', nameEn: 'Compline', targetHour: 21, icon: '🕯️' }
        };

        const prayer = prayerWindows[hourId];
        if (!prayer) return;

        // Mark completed for today
        GameState.tasksState.canonicalCompletedToday[hourId] = true;

        // Sync with canonicalPrayedKeys
        const today = new Date().toISOString().slice(0, 10);
        const key = today + '_' + hourId;
        if (!GameState.canonicalPrayedKeys) GameState.canonicalPrayedKeys = [];
        if (!GameState.canonicalPrayedKeys.includes(key)) GameState.canonicalPrayedKeys.push(key);

        // Check real time hour window (1 hour window: 2:00-2:59, 6:00-6:59, 9:00-9:59, 12:00-12:59, 15:00-15:59, 18:00-18:59, 21:00-21:59)
        const currentRealHour = new Date().getHours();
        const isOnTime = (currentRealHour === prayer.targetHour);

        const prayerName = isEn ? prayer.nameEn : prayer.name;

        if (isOnTime) {
            // GRANT BONUS ONLY WHEN ON TIME IN REAL 1-HOUR WINDOW
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) {
                PersonaSystem.addZboznost(5);
            }
            if (typeof VigorSystem !== 'undefined' && VigorSystem.addFatigue) {
                VigorSystem.addFatigue(-10);
            }
            if (typeof GameState.rank !== 'undefined') {
                GameState.rank.canonicalStreak = (GameState.rank.canonicalStreak || 0) + 1;
            }

            if (hourId === 'vigilie') {
                UI.notify(isEn ? '🌙 Vigil prayer bonus active (+10% Alchemy success, +5 Piety)' : '🌙 Modlitba Vigilie včas (+10% Alchymie, +5 Zbožnost)');
            } else if (hourId === 'laudes') {
                UI.notify(isEn ? '🌅 Lauds prayer bonus active (+25% Crafting speed, +5 Piety)' : '🌅 Modlitba Laudes včas (+25% Rychlost výroby, +5 Zbožnost)');
            } else if (hourId === 'prima') {
                if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('research', 5);
                UI.notify(isEn ? '☀️ Prime prayer bonus active (+5 Research, +5 Piety)' : '☀️ Modlitba Prima včas (+5 Výzkum, +5 Zbožnost)');
            } else if (hourId === 'sexta') {
                if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('herbs', 2);
                UI.notify(isEn ? '🌞 Sext prayer bonus active (+2 Herbs, +5 Piety)' : '🌞 Modlitba Sexta včas (+2 Byliny, +5 Zbožnost)');
            } else if (hourId === 'nona') {
                UI.notify(isEn ? '🌤️ None prayer bonus active (+15% Foraging yield, +5 Piety)' : '🌤️ Modlitba Nona včas (+15% Výnos sběru, +5 Zbožnost)');
            } else if (hourId === 'vesperae') {
                UI.notify(isEn ? '🌇 Vespers prayer bonus active (+5 Piety, Vigor recovered)' : '🌇 Modlitba Vesperae včas (+5 Zbožnost, zotavení energie)');
            } else if (hourId === 'completorium') {
                if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('research', 10);
                UI.notify(isEn ? '🕯️ Compline prayer bonus active (+10 Research, +20% Study, +5 Piety)' : '🕯️ Modlitba Completorium včas (+10 Výzkum, +20% Studium, +5 Zbožnost)');
            }

            if (Math.random() < 0.25 && typeof Game !== 'undefined' && Game.addItem) {
                Game.addItem('candle', 1);
            }
        } else {
            // NO BONUS WHEN OUTSIDE TIME WINDOW, JUST MARK AS COMPLETED
            const msg = isEn
                ? `🙏 ${prayer.icon} ${prayerName} completed outside canonical window (no bonus).`
                : `🙏 ${prayer.icon} Modlitba ${prayerName} splněna mimo kanonický čas (bez bonusu).`;

            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.panel(msg, 'system');
            } else {
                UI.notify(msg, true);
            }
        }

        if (typeof CanonicalHours !== 'undefined' && typeof CanonicalHours.renderPill === 'function') {
            CanonicalHours.renderPill();
        }

        UI.renderMonasticTasks();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    completeMonasticTask: function (taskId) {
        if (!GameState.tasksState) GameState.tasksState = { completedToday: {}, lastResetDay: 1 };
        if (GameState.tasksState.completedToday[taskId]) return;
        GameState.tasksState.completedToday[taskId] = true;

        if (taskId === 'task_prayer') {
            if (typeof VigorSystem !== 'undefined' && VigorSystem.addFatigue) VigorSystem.addFatigue(-10);
            UI.notify('⛪ Modlitba dokončena (+10 Vigor)');
        } else if (taskId === 'task_scriptorium') {
            GameState.inventory['research'] = (GameState.inventory['research'] || 0) + 5;
            UI.notify('✒️ Služba v skriptoriu (+5 Výzkum)');
        } else if (taskId === 'task_garden') {
            GameState.inventory['herbs'] = (GameState.inventory['herbs'] || 0) + 1;
            UI.notify('🪴 Bylinky sesbírány (+1 Byliny)');
        } else if (taskId === 'task_library') {
            GameState.inventory['research'] = (GameState.inventory['research'] || 0) + 3;
            UI.notify('📖 Katalogizace dokončena (+3 Výzkum)');
        }
        UI.renderMonasticTasks();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    renderManuscriptCopying: function () {
        const el = document.getElementById('lore-manuscripts-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isEn = lang === 'en';

        const MANUSCRIPTS_DB = [
            { id: 'anselm', name: 'Žaltář sv. Anselma', name_en: 'Psalter of St. Anselm', folios: 10 },
            { id: 'benedict', name: 'Řehole sv. Benedikta', name_en: 'Rule of St. Benedict', folios: 20 },
            { id: 'chronica', name: 'Zbraslavská kronika', name_en: 'Zbraslav Chronicle', folios: 35 },
            { id: 'herbar', name: 'Herbář a Lékařství', name_en: 'Herbal & Medicine Codex', folios: 50 },
            { id: 'homiliar', name: 'Homiliář a Kázání', name_en: 'Homiliary & Sermons', folios: 75 },
            { id: 'gigas', name: 'Codex Gigas (opis)', name_en: 'Codex Gigas (a Copy)', folios: 120 }
        ];

        if (!GameState.manuscriptsState) {
            GameState.manuscriptsState = {
                activeId: 'anselm',
                progress: 0,
                auto: false,
                copies: { anselm: 0, benedict: 0, chronica: 0, herbar: 0, homiliar: 0, gigas: 0 }
            };
        }

        const ms = GameState.manuscriptsState;
        if (!ms.copies) ms.copies = {};

        const activeManuscript = MANUSCRIPTS_DB.find(m => m.id === ms.activeId) || MANUSCRIPTS_DB[0];
        const manuscriptName = isEn ? activeManuscript.name_en : activeManuscript.name;
        const totalFolios = activeManuscript.folios;
        const currentProgress = ms.progress || 0;
        const pct = Math.min(100, Math.round((currentProgress / totalFolios) * 100));
        const copiesCount = ms.copies[activeManuscript.id] || 0;

        const paper = GameState.inventory['paper'] || 0;
        const parchment = GameState.inventory['parchment'] || 0;
        const ink = GameState.inventory['ink'] || 0;
        const quill = GameState.inventory['quill'] || 0;

        let h = `<div style="padding:16px; background:rgba(0,0,0,0.03); border-radius:8px; margin-bottom:16px; display:flex; flex-wrap:wrap; gap:16px; font-size:0.85rem; border:1px solid rgba(197,160,89,0.3);">`;
        h += `<div>📜 ${isEn ? 'Paper' : 'Papír'}: <strong>${paper}</strong></div>`;
        h += `<div>📜 ${isEn ? 'Parchment' : 'Pergamen'}: <strong>${parchment}</strong></div>`;
        h += `<div>🖋️ ${isEn ? 'Ink' : 'Inkoust'}: <strong>${ink}</strong></div>`;
        h += `<div>🪶 ${isEn ? 'Quills' : 'Brky'}: <strong>${quill}</strong></div>`;
        h += `</div>`;

        // Dormitorium / Scriptor status card
        const scriptoriumBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'scriptorium');
        const isDormitoriumBuilt = (typeof Game !== 'undefined' && Game.dormitoriumCapacity)
            ? Game.dormitoriumCapacity() > 0
            : false;

        if (scriptoriumBrother) {
            const skLvl = (typeof Game !== 'undefined' && Game.dormitoriumBrotherLevel) ? Game.dormitoriumBrotherLevel(scriptoriumBrother, 'scriptorium') : 1;
            const maxFolios = 1 + skLvl;
            const hasSupplies = ink > 0 && (paper > 0 || parchment > 0);

            h += `<div style="padding:14px 18px; background:#fbf7ee; border:1px solid #c5a059; border-radius:8px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; font-size:0.88rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border-left:4px solid #3182ce;">`;
            h += `<div>`;
            h += `<div style="font-weight:bold; color:#2c3e50; font-family:'Cinzel', serif, Georgia; font-size:0.95rem;">📿 ${isEn ? 'Assigned Scriptor' : 'Přiřazený Skriptor'}: <span style="color:#2b6cb0;">${scriptoriumBrother.name}</span> (${isEn ? 'Level' : 'Úroveň'} ${skLvl}/4)</div>`;
            h += `<div style="font-size:0.8rem; color:#5a4a3a; margin-top:4px;">`;
            if (hasSupplies) {
                h += isEn
                    ? `⚙️ Automatically copies up to <strong>${maxFolios} folios</strong> per day during daily monastery tick (and reads in library).`
                    : `⚙️ Automaticky opisuje až <strong>${maxFolios} folií</strong> za den při denním cyklu kláštera (a čte v knihovně).`;
            } else {
                h += isEn
                    ? `⚠️ Missing supplies! Ink and Paper/Parchment required for automated copying.`
                    : `⚠️ Chybí psací potřeby! Pro automatické opisování je potřeba Inkoust + Papír/Pergamen.`;
            }
            h += `</div></div>`;
            h += `<button class="craft-btn" onclick="UI.navigateToSaeculum('dormitorium')">`;
            h += `🏰 ${isEn ? 'Monk Roster' : 'Správa mnichů'}`;
            h += `</button>`;
            h += `</div>`;
        } else if (isDormitoriumBuilt) {
            h += `<div style="padding:14px 18px; background:#fbf7ee; border:1px dashed #c5a059; border-radius:8px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; font-size:0.88rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border-left:4px solid #c5a059;">`;
            h += `<div>`;
            h += `<div style="font-weight:bold; color:#744210; font-family:'Cinzel', serif, Georgia; font-size:0.95rem;">📿 ${isEn ? 'No Scriptor assigned' : 'V Dormitoriu není přiřazen žádný Skriptor'}</div>`;
            h += `<div style="font-size:0.8rem; color:#5a4a3a; margin-top:4px;">${isEn ? 'Assign a monk to Scriptorium in Saeculum (Dormitorium) for automatic daily manuscript copying.' : 'Přiřaď bratra na pracoviště Scriptorium v Saeculum (Dormitorium) pro automatické denní opisování.'}</div>`;
            h += `</div>`;
            h += `<button class="craft-btn" onclick="UI.navigateToSaeculum('dormitorium')">`;
            h += `🏰 ${isEn ? 'Assign Monk' : 'Přiřadit bratra'}`;
            h += `</button>`;
            h += `</div>`;
        } else {
            h += `<div style="padding:14px 18px; background:#fbf7ee; border:1px dashed #a88a48; border-radius:8px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; font-size:0.88rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border-left:4px solid #8c5319;">`;
            h += `<div>`;
            h += `<div style="font-weight:bold; color:#8c5319; font-family:'Cinzel', serif, Georgia; font-size:0.95rem;">🔒 ${isEn ? 'Dormitorium not built' : 'Dormitorium ještě není postaveno'}</div>`;
            h += `<div style="font-size:0.8rem; color:#5a4a3a; margin-top:4px;">${isEn ? 'To automate manuscript copying, construct the Dormitorium in Cellarium (Buildings) and assign a monk.' : 'Pro automatické opisování rukopisů postav Dormitorium v Cellarium (Budovy) a přiřaď v něm bratra.'}</div>`;
            h += `</div>`;
            h += `<button class="craft-btn" onclick="UI.navigateToCellarium('buildings')">`;
            h += `🏛️ ${isEn ? 'Build Dormitorium' : 'Postavit Dormitorium'}`;
            h += `</button>`;
            h += `</div>`;
        }

        // Golden illuminated parchment container matching Screenshot 3
        h += `<div style="padding:20px; background:#fbf7ee; border:1px solid #c5a059; border-radius:8px; position:relative; box-shadow:0 4px 12px rgba(0,0,0,0.06); margin-bottom:20px;">`;
        // 4 Corner flourishes
        h += `<div style="position:absolute; top:4px; left:4px; width:10px; height:10px; border-top:2px solid #c5a059; border-left:2px solid #c5a059;"></div>`;
        h += `<div style="position:absolute; top:4px; right:4px; width:10px; height:10px; border-top:2px solid #c5a059; border-right:2px solid #c5a059;"></div>`;
        h += `<div style="position:absolute; bottom:4px; left:4px; width:10px; height:10px; border-bottom:2px solid #c5a059; border-left:2px solid #c5a059;"></div>`;
        h += `<div style="position:absolute; bottom:4px; right:4px; width:10px; height:10px; border-bottom:2px solid #c5a059; border-right:2px solid #c5a059;"></div>`;

        // Subheader
        h += `<div style="font-size:0.75rem; font-weight:bold; letter-spacing:1.5px; color:#2b6cb0; text-transform:uppercase; margin-bottom:8px;">✒️ ${isEn ? 'ACTIVE MANUSCRIPT COPYING' : 'AKTIVNÍ OPISOVÁNÍ RUKOPISU'}</div>`;

        // Title row
        h += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">`;
        h += `<div style="font-size:1.15rem; font-weight:bold; color:#2c3e50; font-family:'Cinzel', serif, Georgia;">📖 ${manuscriptName} <span style="font-weight:normal; font-size:0.85rem; opacity:0.75;">(${copiesCount}x ${isEn ? 'copied' : 'opsáno'})</span></div>`;
        h += `<div style="font-size:0.95rem; font-weight:bold; color:#3182ce;">${currentProgress} / ${totalFolios} ${isEn ? 'folios' : 'folií'} (${pct}%)</div>`;
        h += `</div>`;

        // Decorative line divider
        h += `<div style="position:relative; height:1px; background:#90cdf4; margin:10px 0 16px 0;">`;
        h += `<div style="position:absolute; top:-3px; left:50%; transform:translateX(-50%) rotate(45deg); width:7px; height:7px; background:#90cdf4;"></div>`;
        h += `</div>`;

        // Folios squares grid
        h += `<div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin:16px 0 20px 0;">`;
        for (let i = 0; i < totalFolios; i++) {
            if (i < currentProgress) {
                h += `<div style="width:16px; height:16px; background:#3182ce; border:1px solid #2b6cb0; border-radius:3px; box-shadow:inset 0 1px 2px rgba(255,255,255,0.3);" title="Folium ${i + 1}"></div>`;
            } else {
                h += `<div style="width:16px; height:16px; background:rgba(144, 205, 244, 0.25); border:1px solid #7bc5d8; border-radius:3px;" title="Folium ${i + 1}"></div>`;
            }
        }
        h += `</div>`;

        // Buttons row matching Screenshot 3
        h += `<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">`;
        h += `<div style="display:flex; gap:10px; flex-wrap:wrap;">`;
        h += `<button onclick="UI.copyFolium(1)" style="background:linear-gradient(180deg, #8b4513 0%, #5a2a0a 100%); color:#ffffff; border:1px solid #d4af37; padding:8px 16px; border-radius:4px; font-weight:bold; font-family:'Cinzel', serif, Georgia; font-size:0.85rem; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.25); display:flex; align-items:center; gap:6px;">
            ✒️ ${isEn ? 'COPY 1 FOLIUM (1 ✒️)' : 'OPSAT 1 FOLIUM (1 ✒️)'}
        </button>`;
        h += `<button onclick="UI.copyFolium(5)" style="background:linear-gradient(180deg, #8b4513 0%, #5a2a0a 100%); color:#ffffff; border:1px solid #d4af37; padding:8px 16px; border-radius:4px; font-weight:bold; font-family:'Cinzel', serif, Georgia; font-size:0.85rem; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.25); display:flex; align-items:center; gap:6px;">
            📜 ${isEn ? 'COPY 5 FOLIOS' : 'OPSAT 5 FOLÍÍ'}
        </button>`;
        h += `</div>`;

        const isAuto = !!ms.auto;
        h += `<button onclick="UI.toggleManuscriptAutomation()" style="background:linear-gradient(180deg, #2b6cb0 0%, #1a4971 100%); color:#ffffff; border:1px solid #63b3ed; padding:8px 16px; border-radius:4px; font-weight:bold; font-family:'Cinzel', serif, Georgia; font-size:0.85rem; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.25); display:flex; align-items:center; gap:6px;">
            ⚡ ${isEn ? 'AUTOMATION' : 'AUTOMATIKA'}: ${isAuto ? (isEn ? 'ON' : 'ZAP') : (isEn ? 'OFF' : 'VYP')}
        </button>`;
        h += `</div>`;

        h += `</div>`;

        // Manuscript selection list
        h += `<div style="font-size:0.92rem; font-weight:bold; color:#2c3e50; margin-bottom:10px;">📜 ${isEn ? 'Available Manuscripts for Copying' : 'Knižní kodexy k opisování'}</div>`;
        h += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px;">`;
        MANUSCRIPTS_DB.forEach(m => {
            const isSel = m.id === activeManuscript.id;
            const name = isEn ? m.name_en : m.name;
            const cop = ms.copies[m.id] || 0;
            h += `<div onclick="UI.selectManuscript('${m.id}')" style="padding:10px 14px; background:${isSel ? 'rgba(197,160,89,0.18)' : 'rgba(255,255,255,0.6)'}; border:1px solid ${isSel ? '#c5a059' : 'rgba(197,160,89,0.3)'}; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:bold; font-size:0.88rem; color:#2c3e50;">📖 ${name}</div>
                    <div style="font-size:0.75rem; opacity:0.7;">${m.folios} ${isEn ? 'folios' : 'folií'} | ${cop}x ${isEn ? 'copied' : 'opsáno'}</div>
                </div>
                ${isSel ? '<span style="font-size:0.8rem; font-weight:bold; color:#8b4513;">▶ AKTIVNÍ</span>' : ''}
            </div>`;
        });
        h += `</div>`;

        el.innerHTML = h;
    },

    selectManuscript: function (id) {
        if (!GameState.manuscriptsState) GameState.manuscriptsState = { activeId: 'anselm', progress: 0, auto: false, copies: {} };
        if (GameState.manuscriptsState.activeId === id) return;
        GameState.manuscriptsState.activeId = id;
        GameState.manuscriptsState.progress = 0;
        UI.renderManuscriptCopying();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // Grandfather klauzule pro A5 gate (28.8.2026) — samostatná funkce, ne
    // jen inline v renderAll(), aby ji mohly volat i copyFolium/
    // toggleManuscriptAutomation přímo a nespoléhaly na to, že renderAll()
    // už proběhl dřív (automatika běží na vlastním setInterval).
    _ensureScriptoriumArsMigration: function () {
        if (!GameState.researchedTechs) return false;
        if (GameState.researchedTechs.includes('tech_scriptorium_ars')) return true;
        const ms = GameState.manuscriptsState;
        if (ms) {
            const hasUsed = (ms.progress > 0) || (ms.auto === true) ||
                (ms.copies && Object.values(ms.copies).some(c => c > 0));
            if (hasUsed) {
                GameState.researchedTechs.push('tech_scriptorium_ars');
                return true;
            }
        }
        return false;
    },

    copyFolium: function (count = 1) {
        if (!UI._ensureScriptoriumArsMigration()) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            UI.notify(lang === 'en' ? '🔒 Research "Art of the Copy" first.' : '🔒 Nejprve vyzkoumej "Umění opisu".', true);
            return false;
        }
        if (!GameState.manuscriptsState) {
            GameState.manuscriptsState = { activeId: 'anselm', progress: 0, auto: false, copies: {} };
        }
        const ms = GameState.manuscriptsState;
        const MANUSCRIPTS_DB = {
            anselm: 10, benedict: 20, chronica: 35, herbar: 50, homiliar: 75, gigas: 120
        };
        const maxFolios = MANUSCRIPTS_DB[ms.activeId] || 10;

        // scriptorium-mastery-mrd (7.8.2026): navrch RankSystem Scriptor role.
        const mastery = GameState.scriptoriumMastery || 0;
        const vigorPerFolium = Math.max(1, 2 - mastery * 0.05);
        const bonusChance = Math.min(0.25, mastery * 0.01);

        let copiesDone = 0;
        let bonusCopies = 0;
        for (let c = 0; c < count; c++) {
            const paper = GameState.inventory['paper'] || 0;
            const parchment = GameState.inventory['parchment'] || 0;
            const ink = GameState.inventory['ink'] || 0;

            // scriptorium-mastery-mrd: zkušená ruka občas napíše folium
            // "z hlavy" bez spotřeby surovin — šance roste s mastery, strop 25 %.
            const isBonus = mastery > 0 && Math.random() < bonusChance;

            if (!isBonus) {
                if (ink <= 0 || (paper <= 0 && parchment <= 0)) {
                    if (copiesDone === 0) {
                        UI.notify('⚠️ Chybí psací potřeby (Inkoust + Papír/Pergamen)!');
                    }
                    break;
                }
                GameState.inventory['ink'] = ink - 1;
                if (parchment > 0) {
                    GameState.inventory['parchment'] = parchment - 1;
                } else {
                    GameState.inventory['paper'] = paper - 1;
                }
            } else {
                bonusCopies++;
            }

            // opisovani-vigor-audit (7.8.2026): opisování dřív nestálo žádný
            // Vigor — popis About slibuje "trochu energie" za folium, teď to
            // fakt platí. Vždy hráč (Athanor/Scriptorium nejsou v
            // CONVERSI_TASKS), bezpečné bez dalšího rozlišování.
            // scriptorium-mastery-mrd: náklad klesá s masterou (min. 1).
            if (typeof VigorSystem !== 'undefined') VigorSystem.addFatigue(vigorPerFolium);

            ms.progress = (ms.progress || 0) + 1;
            GameState.inventory['research'] = (GameState.inventory['research'] || 0) + 3;
            copiesDone++;

            if (ms.progress >= maxFolios) {
                ms.progress = 0;
                ms.copies[ms.activeId] = (ms.copies[ms.activeId] || 0) + 1;
                GameState.inventory['research'] += 20;
                GameState.inventory['parchment'] = (GameState.inventory['parchment'] || 0) + 2;
                GameState.scriptoriumMastery = (GameState.scriptoriumMastery || 0) + 1;
                UI.notify(`📜 Kodex dokončen! Získáváš +20 Zápisků a 2 Pergamene.`);
                UI.notify(`✍️ Zkušenost roste — trvale snižuje únavu z psaní a dává šanci na folium zdarma.`);
                if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                    Game.addKronikaEntry('minor',
                        '✍️ Bratrova ruka zkušeností zesílila — psaní jde snáz.',
                        '✍️ The brother\'s hand has grown surer with practice — writing comes easier now.',
                        '✍️ Manus fratris usu firmata est.');
                }
                break;
            }
        }

        if (copiesDone > 0) {
            const bonusNote = bonusCopies > 0 ? ` (${bonusCopies}× zdarma, zkušenost)` : '';
            UI.notify(`✒️ Opsáno ${copiesDone} folium (+${copiesDone * 3} Zápisky)${bonusNote}`);
        }

        UI.renderManuscriptCopying();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        return copiesDone > 0;
    },

    toggleManuscriptAutomation: function () {
        if (!UI._ensureScriptoriumArsMigration()) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            UI.notify(lang === 'en' ? '🔒 Research "Art of the Copy" first.' : '🔒 Nejprve vyzkoumej "Umění opisu".', true);
            return;
        }
        if (!GameState.manuscriptsState) {
            GameState.manuscriptsState = { activeId: 'anselm', progress: 0, auto: false, copies: {} };
        }
        GameState.manuscriptsState.auto = !GameState.manuscriptsState.auto;

        if (window._msAutoTimer) {
            clearInterval(window._msAutoTimer);
            window._msAutoTimer = null;
        }

        if (GameState.manuscriptsState.auto) {
            UI.notify('⚡ Automatika opisování zapnuta');
            window._msAutoTimer = setInterval(() => {
                const success = UI.copyFolium(1);
                if (!success) {
                    UI.toggleManuscriptAutomation();
                }
            }, 3600000); // 1 folium/hodinu — realistický tvůrčí čas (dřív 3s, exploit)
        } else {
            UI.notify('⚡ Automatika opisování vypnuta');
        }

        UI.renderManuscriptCopying();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
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
        const tmplEl = document.getElementById('home-templum-content');
        if (tmplEl) tmplEl.style.display = tab === 'templum' ? 'block' : 'none';
        const infEl = document.getElementById('home-infirmarium-content');
        if (infEl) infEl.style.display = tab === 'infirmarium' ? 'block' : 'none';
        document.querySelectorAll('#screen-home .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (typeof TemplumSystem !== 'undefined') TemplumSystem.updateTabVisibility();
        if (typeof InfirmariumSystem !== 'undefined') InfirmariumSystem.updateTabVisibility();
        if (tab === 'athanor') AthanorSystem.render('home-athanor-content');
        if (tab === 'cellarium' && celEl) celEl.innerHTML = CellariumSystem.renderCellariumTab();
        if (tab === 'saeculum' && saecEl && typeof SaeculumSystem !== 'undefined') saecEl.innerHTML = SaeculumSystem.renderSaeculumTab();
        if (tab === 'foculus' && typeof FireplaceSystem !== 'undefined') FireplaceSystem.render();
        if (tab === 'templum' && tmplEl && typeof TemplumSystem !== 'undefined') tmplEl.innerHTML = TemplumSystem.renderTemplumTab();
        if (tab === 'infirmarium' && infEl && typeof InfirmariumSystem !== 'undefined') infEl.innerHTML = InfirmariumSystem.renderInfirmariumTab();
        // Reset sub-tab to scavenge when switching back to main
        if (tab === 'main') this.switchHomeSubTab('scavenge', document.getElementById('home-sub-scavenge'));
    },

    switchHomeSubTab: function (tab, btn) {
        const scav = document.getElementById('home-scavenge-content');
        const mine = document.getElementById('home-mine-content');
        const cooking = document.getElementById('home-cooking-content');
        const drying = document.getElementById('home-drying-content');
        const vapenice = document.getElementById('home-vapenice-content');
        const mill = document.getElementById('home-mill-content');
        const furnus = document.getElementById('home-furnus-content');
        const kovarna = document.getElementById('home-kovarna-content');
        if (scav) scav.style.display = tab === 'scavenge' ? 'block' : 'none';
        if (mine) mine.style.display = tab === 'mine' ? 'block' : 'none';
        if (cooking) cooking.style.display = tab === 'cooking' ? 'block' : 'none';
        if (drying) drying.style.display = tab === 'drying' ? 'block' : 'none';
        if (vapenice) vapenice.style.display = tab === 'vapenice' ? 'block' : 'none';
        if (mill) mill.style.display = tab === 'mill' ? 'block' : 'none';
        if (furnus) furnus.style.display = tab === 'furnus' ? 'block' : 'none';
        if (kovarna) kovarna.style.display = tab === 'kovarna' ? 'block' : 'none';
        document.querySelectorAll('#home-main-content .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (tab === 'mine') { this.renderMineYieldInfo(); this.renderFodinaPetitionPanel(); this.renderMineActions(); }
        if (tab === 'cooking' && cooking && typeof CookingSystem !== 'undefined') {
            // coquina-dashboard-mrd (9.8.2026): Sýrárna teď vlastní panel
            // uvnitř CookingSystem.render() (grid stanic), mirror ostatních
            // stanic — CheeseSystem samostatný systém, ale ne samostatné HTML.
            cooking.innerHTML = CookingSystem.render();
        }
        // Sušárna — mlynar-vlastni-mlyn-mrd.md §4.5, 16.8.2026. Mirror cooking dispatch.
        if (tab === 'drying' && drying && typeof DryingSystem !== 'undefined') {
            drying.innerHTML = DryingSystem.renderSusarna();
        }
        // Vápenice — 16.8.2026, mirror drying dispatch (pec + jáma v LimeSystem.render()).
        if (tab === 'vapenice' && vapenice && typeof LimeSystem !== 'undefined') {
            vapenice.innerHTML = LimeSystem.render();
        }
        // Vodní mlýn — provoz (mlynar-vlastni-mlyn-mrd.md §4.7, 16.8.2026), mirror vapenice dispatch.
        if (tab === 'mill' && mill && typeof MillSystem !== 'undefined') {
            mill.innerHTML = MillSystem.render();
        }
        // Furnus (Pekárna) — dilny-pozemky-mrd.md v0.3, 25.8.2026, mirror vapenice dispatch.
        if (tab === 'furnus' && furnus && typeof CellariumSystem !== 'undefined') {
            furnus.innerHTML = CellariumSystem.renderFurnusTab();
        }
        // Kovárna — kovarna-dilna-mrd.md v0.6, 30.8.2026, mirror furnus dispatch.
        if (tab === 'kovarna' && kovarna && typeof CellariumSystem !== 'undefined') {
            kovarna.innerHTML = CellariumSystem.renderKovarnaTab();
        }
    },

    renderMineYieldInfo: function () {
        // Přesné výnosové rozsahy se hráči záměrně nezobrazují (viz karty
        // jednotlivých akcí níže — jen kategorie, žádná čísla, stejně jako Scavenge).
        const el = document.getElementById('mine-yield-info');
        if (!el) return;
        el.innerHTML = '';
    },

    renderMineActions: function () {
        const el = document.getElementById('mine-actions');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const mineActions = ActionsDB.filter(a => a.cat === 'mine');
        let h = '';

        // Zjistit, jestli je vůbec co zobrazit (aspoň 1 akce s krumpáčem)
        const anyVisible = mineActions.some(act => {
            if (!act.req || !Array.isArray(act.req)) return true;
            return act.req.some(r => (GameState.inventory[r.item] > 0) || (GameState.inventory['worn_' + r.item] > 0));
        });

        if (anyVisible) {
            // ── Volič délky (2.5/5/10/20/30) — koně jen zkracují reálné čekání,
            // výnos zůstává vázán na zvolený tier. Zobrazit obojí zřetelně.
            const _stableAnimalsUI = (GameState.stable && GameState.stable.animals) ? GameState.stable.animals : [];
            const horseCount = _stableAnimalsUI.length;
            const shodHorseCount = _stableAnimalsUI.filter(a => a.shoeDurability > 0).length;
            const horseMult = shodHorseCount >= 2 ? 0.5 : horseCount >= 1 ? 0.75 : 1.0;
            const tiers = [2.5, 5, 10, 20, 30];
            const selected = GameState.selectedMineDuration || 5;
            let tierBtns = '<div class="time-selector">';
            tiers.forEach(tier => {
                const realMin = tier * horseMult;
                const realStr = Number.isInteger(realMin) ? realMin : realMin.toFixed(1);
                const label = horseMult < 1.0 ? `${tier} min <span style="opacity:0.6;font-size:0.85em;">(${realStr})</span>` : `${tier} min`;
                const active = tier === selected ? ' active' : '';
                tierBtns += `<button class="mine-time-btn${active}" onclick="Game.setMineDuration(${tier}, this)">${label}</button>`;
            });
            tierBtns += '</div>';
            if (horseCount > 0) {
                tierBtns += `<div style="font-size:0.72rem;opacity:0.55;margin-bottom:8px;">🐴 ${lang === 'en' ? `${horseCount} horse(s) — real time in parentheses` : `${horseCount} kůň/koně — reálný čas v závorce`}</div>`;
            }
            h += tierBtns;
            if (typeof MineSystem !== 'undefined') h += MineSystem.renderIndicator();
        }

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

    renderFodinaPetitionPanel: function () {
        const el = document.getElementById('fodina-petition-panel');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const cs = lang === 'cs';
        const pet = GameState.abbotPetition && GameState.abbotPetition.fodina;
        const fodinaBuilt = GameState.storage && GameState.storage.fodina && GameState.storage.fodina.built;

        // Fodina postavena — panel skrýt
        if (fodinaBuilt) { el.innerHTML = ''; return; }

        let html = '';
        const boxStyle = 'padding:14px; margin-bottom:12px; background:rgba(197,160,89,0.07); border:1px solid rgba(197,160,89,0.3); border-radius:8px; border-left:4px solid var(--accent-gold);';

        if (!pet || pet.status === 'none') {
            html = `<div style="${boxStyle}">
                <div style="font-weight:bold; margin-bottom:6px;">⛏️ ${cs ? 'Fodina — Klášterní důl' : 'Fodina — Monastic Mine'}</div>
                <div style="font-size:0.82rem; opacity:0.8; margin-bottom:10px;">${t('abbotPetition.fodina.locked_hint')}</div>
                <button class="craft-btn" onclick="Game.submitAbbotPetition('fodina'); UI.renderFodinaPetitionPanel(); UI.renderMineActions();">
                    📜 ${t('abbotPetition.fodina.submit_btn')}
                </button>
            </div>`;
        } else if (pet.status === 'pending') {
            const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
            const submitDate = pet.submittedAt ? _toGameDate(pet.submittedAt).toLocaleDateString(cs ? 'cs-CZ' : 'en-GB') : '?';
            const responseDate = pet.submittedAt ? _toGameDate(pet.submittedAt + 86400000).toLocaleDateString(cs ? 'cs-CZ' : 'en-GB') : '?';
            const pendingText = t('abbotPetition.fodina.pending').replace('{date}', submitDate).replace('{responseDate}', responseDate);
            html = `<div style="${boxStyle}">
                <div style="font-weight:bold; margin-bottom:6px;">⛏️ ${cs ? 'Fodina — Klášterní důl' : 'Fodina — Monastic Mine'}</div>
                <div style="font-size:0.82rem; opacity:0.8;">${pendingText}</div>
            </div>`;
        } else if (pet.status === 'approved') {
            html = `<div style="${boxStyle} border-left-color:#5a9a5a;">
                <div style="font-weight:bold; margin-bottom:6px; color:#5a9a5a;">✅ ${cs ? 'Fodina schválena' : 'Fodina Approved'}</div>
                <div style="font-size:0.82rem; opacity:0.8; margin-bottom:10px;">${t('abbotPetition.fodina.approved')}</div>
            </div>`;
        }

        el.innerHTML = html;
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
            {
                id: 'flag_confectio', trigger: 'flag', icon: '🍯', sender: 'cellar', condition: () => {
                    if (!GameState.athanor || !GameState.athanor.discovered) return false;
                    const ids = ['berries+honey:coctio', 'apple+honey:coctio', 'honey+quince:coctio', 'honey+plum:coctio', 'cornel_cherry+honey:coctio', 'honey+wild_fruit:coctio', 'honey+quince+skorice:coctio'];
                    return ids.some(id => GameState.athanor.discovered.includes(id));
                }
            },

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
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Check unlocks
        if (typeof LibraryHelpers !== 'undefined') {
            LibraryHelpers.checkLibraryUnlocks();
        }

        const unlocked = GameState.library ? GameState.library.unlockedBooks.length : 0;
        const total = typeof LibraryDB !== 'undefined' ? LibraryDB.books.length : 0;
        const read = GameState.library ? GameState.library.readBooks.length : 0;

        // Skryté knihy (easter eggy z EasterEggsDB.achievements, unlockDay:0)
        // nejdou odemknout časem — zobrazit vysvětlení, dokud hráč nemá vše.
        let hiddenBookHints = '';
        if (unlocked < total) {
            const hasFaust = GameState.achievements && GameState.achievements.unlocked && GameState.achievements.unlocked.includes('faust_pact');
            const hasCodexGigas = GameState.achievements && GameState.achievements.unlocked && GameState.achievements.unlocked.includes('codex_gigas_summon');
            const hints = [];
            if (!hasFaust) hints.push(lang === 'en'
                ? 'Hold exactly <strong>666 research</strong> at once.'
                : 'Nasbírej a drž přesně <strong>666 výzkumu</strong> najednou.');
            if (!hasCodexGigas) hints.push(lang === 'en'
                ? 'Play between <strong>midnight and 3 AM</strong> real time with <strong>1000+ research</strong>.'
                : 'Hraj mezi <strong>půlnocí a 3:00</strong> reálného času s <strong>1000+ výzkumu</strong>.');
            if (hints.length) {
                hiddenBookHints = `<div style="text-align:center;margin-bottom:15px;padding:8px 12px;background:rgba(0,0,0,0.03);border-radius:6px;font-size:0.78rem;opacity:0.75;font-style:italic;">
                    ${lang === 'en'
                        ? 'A few books are not unlocked by time, but by unusual conditions:'
                        : 'Několik knih se neodemyká časem, ale neobvyklými podmínkami:'}
                    <br>${hints.join('<br>')}
                </div>`;
            }
        }

        let h = `
            <div style="text-align:center;margin-bottom:15px;border:1px solid var(--accent-gold);padding:10px;">
                📚 ${t('library_lore.lib_title')}: <strong>${unlocked}/${total}</strong> ${t('library_lore.lib_unlocked')} | 
                📖 ${t('library_lore.lib_read')}: <strong>${read}/${total}</strong>
            </div>
            ${hiddenBookHints}
            `;

        // Stationarius — univerzitní dealer knih/psacích potřeb. Vstup jen
        // zde v Knihovně (ne v Saeculum Clientela gridu). Gate: tech +
        // periodický interval (mirror Giacomo — viz checkStationariusEvent).
        {
            const researched = GameState.researchedTechs || [];
            const stat = (typeof ContactsDB !== 'undefined') ? ContactsDB.stationarius : null;
            const unlockedStat = stat && (!stat.unlockTech || researched.includes(stat.unlockTech));
            if (unlockedStat) {
                const present = (typeof CellariumSystem !== 'undefined') && CellariumSystem.isStationariusPresent();
                const activeContact = GameState.ui && GameState.ui.clientelaContact;
                let statusLine;
                if (present) {
                    statusLine = lang === 'en' ? 'In Olomouc now — the book fair caravan has arrived.' : 'Teď v Olomouci — dorazil s knižním veletrhem.';
                } else {
                    const lastVisit = (GameState.library && GameState.library.lastStationariusVisit) || 0;
                    const nextAt = lastVisit + CellariumSystem.STATIONARIUS_INTERVAL_MS;
                    const daysLeft = Math.max(0, Math.ceil((nextAt - Date.now()) / (24 * 3600000)));
                    statusLine = lang === 'en'
                        ? 'On the road between fairs — back in ' + daysLeft + ' d.'
                        : 'Na cestě mezi veletrhy — vrací se za ' + daysLeft + ' dní.';
                }
                h += `<div style="margin-bottom:20px;padding:12px 14px;background:rgba(197,160,89,0.07);border:1px solid rgba(197,160,89,0.3);border-radius:6px;">
                        <div style="display:flex;align-items:center;gap:10px;${present ? '' : 'opacity:0.6;'}">
                          <div style="font-size:1.6rem;">${stat.icon}</div>
                          <div style="flex:1;">
                            <strong>${lang === 'en' ? stat.name_en : stat.name}</strong>
                            <div class="text-sm" style="opacity:0.75;">${statusLine}</div>
                          </div>
                          ${present ? `<button class="craft-btn" onclick="SaeculumSystem.openContact('stationarius'); UI.renderLibrary();">📖 ${lang === 'en' ? 'Meeting' : 'Schůzka'}</button>` : ''}
                        </div>
                        ${(present && activeContact === 'stationarius' && typeof SaeculumSystem !== 'undefined') ? SaeculumSystem.renderContactPanel('stationarius') : ''}
                      </div>`;
            }
        }

        // Fyzická ochrana fondu — cluster-A-mrd (28.8.2026). Jen když je
        // aspoň Anathema vyzkoumaná, jinak by panel ukazoval na nic.
        if (GameState.researchedTechs && GameState.researchedTechs.includes('tech_anathema')) {
            const _protLang = (GameState.settings && GameState.settings.language) || 'cs';
            const prot = (GameState.library && GameState.library.protection) || {};
            const hasCatena = GameState.researchedTechs.includes('tech_catena');
            const hasSecreta = GameState.researchedTechs.includes('tech_libraria_secreta');
            const rank = GameState.rank && GameState.rank.monastic;
            const isArmarius = rank === 'armarius' || rank === 'prior';
            h += `<div style="margin-bottom:20px;padding:12px 14px;background:rgba(139,111,60,0.06);border:1px solid rgba(197,160,89,0.25);border-radius:6px;">
                    <div style="font-weight:bold;font-size:0.85rem;margin-bottom:8px;">${_protLang === 'en' ? '🛡️ Protection of the Fond' : '🛡️ Ochrana fondu'}</div>
                    <div style="display:flex;flex-direction:column;gap:6px;font-size:0.8rem;">
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span>🖋️ ${_protLang === 'en' ? 'Anathema' : 'Anathema'} ${prot.anathema ? '✓' : ''}</span>
                        ${!prot.anathema ? `<button class="craft-btn" style="font-size:0.72rem;padding:3px 8px;min-width:auto;" onclick="LibraryHelpers.applyAnathema();UI.renderLibrary();">${_protLang === 'en' ? 'Write' : 'Napsat'} (${GameState.inventory.anathema_ink || 0}×)</button>` : ''}
                      </div>
                      ${hasCatena ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span>⛓️ ${_protLang === 'en' ? 'Catena' : 'Catena'} ${prot.catena ? '✓ (' + t(`library_lore.categories.${prot.catena}`) + ')' : ''}</span>
                        ${!prot.catena ? `<button class="craft-btn" style="font-size:0.72rem;padding:3px 8px;min-width:auto;" onclick="LibraryHelpers.applyCatena();UI.renderLibrary();">${_protLang === 'en' ? 'Fit' : 'Osadit'} (${GameState.inventory.chain_lock || 0}×)</button>` : ''}
                      </div>` : ''}
                      ${hasSecreta ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <span>🗝️ ${_protLang === 'en' ? 'Libraria Secreta' : 'Libraria Secreta'} ${prot.secreta ? '✓' : ''} ${!isArmarius && !prot.secreta ? '<span style="opacity:0.6;font-style:italic;">(' + (_protLang === 'en' ? 'requires Armarius' : 'vyžaduje Armaria') + ')</span>' : ''}</span>
                        ${!prot.secreta && isArmarius ? `<button class="craft-btn" style="font-size:0.72rem;padding:3px 8px;min-width:auto;" onclick="LibraryHelpers.applyLibrariaSecreta();UI.renderLibrary();">${_protLang === 'en' ? 'Seal' : 'Uzamknout'} (${GameState.inventory.libraria_secreta_kit || 0}×)</button>` : ''}
                      </div>` : ''}
                    </div>
                  </div>`;
        }

        // Knižní nemocnice (D2) + Absenční výpůjčky (C2) — přesunuto do
        // samostatného subtabu "Výpůjčky" (28.8.2026), ať se hlavní seznam
        // knih neplní stavovými panely. Viz UI.renderVypujckyTab().


        const _bartolomejRel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.bartolomej) || 0;
        const _libLang = (GameState.settings && GameState.settings.language) || 'cs';
        const _scribePrice = (typeof LibraryHelpers !== 'undefined' && LibraryHelpers.getScribePrice) ? LibraryHelpers.getScribePrice() : 10;
        h += `
            <div style="margin-bottom:20px;padding:12px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:5px;">
                <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
                    <div style="display:flex;align-items:center;gap:10px;min-width:180px;flex:1;">
                        <div style="font-size:1.8rem;flex-shrink:0;">🖋️</div>
                        <div>
                            <strong>${t('library_lore.npc_scribe.name')}</strong>
                            <div class="text-sm" style="color:var(--ink-secondary);">
                                ${t('library_lore.npc_scribe.scribe_short').replace('{cost}', _scribePrice)}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
                        <button class="craft-btn" style="font-size:0.75rem;padding:4px 8px;min-width:auto;min-height:32px;white-space:nowrap;" onclick="LibraryHelpers.scribeVisit()">
                            ${_libLang === 'en' ? '💬 Talk' : '💬 Promluvit'}
                        </button>
                        <button class="craft-btn" style="font-size:0.75rem;padding:4px 8px;min-width:auto;min-height:32px;white-space:nowrap;" onclick="LibraryHelpers.scribeAskTopic()">
                            ${_libLang === 'en' ? '🗣️ Ask' : '🗣️ Zeptat se'}
                        </button>
                        <button class="craft-btn" style="font-size:0.75rem;padding:4px 8px;min-width:auto;min-height:32px;white-space:nowrap;" onclick="LibraryHelpers.scribeAIChat()">
                            ${_libLang === 'en' ? '🗨️ Chat' : '🗨️ Pokecat'}
                        </button>
                        <button class="craft-btn" style="font-size:0.75rem;padding:4px 8px;min-width:auto;min-height:32px;white-space:nowrap;" onclick="LibraryHelpers.scribeTrade()">
                            ${t('library_lore.npc_scribe.opt_trade').replace('{cost}', _scribePrice)}
                        </button>
                        ${_bartolomejRel >= 25 ? `
                        <button class="craft-btn" style="font-size:0.75rem;padding:4px 8px;min-width:auto;min-height:32px;white-space:nowrap;" onclick="LibraryHelpers.scribeTradeChoice()">
                            ${_libLang === 'en' ? `🖋️ Choose Book (${_scribePrice}x Paper)` : `🖋️ Vybrat knihu (${_scribePrice}x Papír)`}
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;

        if (typeof LibraryDB === 'undefined' || typeof GameState.library === 'undefined') {
            el.innerHTML = h + `<p>${t('library_lore.lib_not_avail')}</p>`;
            return;
        }

        // tech_bibliotheca_catalogus — filtrování + sbalovací kategorie (Penum vzor, ui.js:508+)
        const hasCatalogus = GameState.researchedTechs && GameState.researchedTechs.includes('tech_bibliotheca_catalogus');
        const libFilter = hasCatalogus ? (this.currentLibraryFilter || 'all') : 'all';

        const matchesLibFilter = (book) => {
            if (!hasCatalogus) return true;
            const isUnlocked = GameState.library.unlockedBooks.includes(book.id);
            const isRead = GameState.library.readBooks.includes(book.id);
            switch (libFilter) {
                case 'read': return isUnlocked && isRead;
                case 'toread': return isUnlocked && !isRead;
                case 'locked': return !isUnlocked && book.unlockDay > 0;
                default: return true; // 'all'
            }
        };

        if (hasCatalogus) {
            const libFilters = [
                { key: 'all', label: lang === 'en' ? 'All' : 'Vše' },
                { key: 'read', label: lang === 'en' ? 'Read' : 'Přečteno' },
                { key: 'toread', label: lang === 'en' ? 'To Read' : 'Ke čtení' },
                { key: 'locked', label: lang === 'en' ? 'Unacquired' : 'Bez akvizice' },
            ];
            h += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">`;
            libFilters.forEach(f => {
                h += `<button class="filter-btn${libFilter === f.key ? ' active' : ''}" onclick="UI.filterLibrary('${f.key}')">${f.label}</button>`;
            });
            h += `</div>`;
        }

        // Group by category
        Object.entries(LibraryDB.categories).forEach(([catId, catData]) => {
            const books = LibraryDB.books.filter(b => b.category === catId);
            const unlockedInCat = books.filter(b => GameState.library.unlockedBooks.includes(b.id));
            const visibleBooks = books.filter(matchesLibFilter);
            if (hasCatalogus && visibleBooks.length === 0) return; // prázdná kategorie po filtru — přeskočit
            const catName = t(`library_lore.categories.${catId}`); // Získáme přeložený název kategorie
            const collapsed = hasCatalogus && !!(GameState.uiPrefs && GameState.uiPrefs.libCollapsed && GameState.uiPrefs.libCollapsed[catId]);

            h += `<div style="margin-top:20px;">`;
            if (hasCatalogus) {
                h += `<h3 style="color:var(--accent-gold);border-bottom:2px solid var(--accent-gold);padding-bottom:5px;cursor:pointer;display:flex;align-items:center;gap:8px;" onclick="UI.toggleLibraryCategory('${catId}')">
                        <span id="lib-cat-chevron-${catId}" style="font-size:0.7rem;display:inline-block;transition:transform 0.15s;transform:rotate(${collapsed ? 0 : 90}deg);">▶</span>
                        ${catData.icon} ${catName} (${unlockedInCat.length}/${books.length})
                      </h3>`;
                h += `<div id="lib-cat-body-${catId}" style="display:${collapsed ? 'none' : ''};">`;
            } else {
                h += `<h3 style="color:var(--accent-gold);border-bottom:2px solid var(--accent-gold);padding-bottom:5px;">
                        ${catData.icon} ${catName} (${unlockedInCat.length}/${books.length})
                      </h3>`;
                h += `<div class="lib-cat-body">`;
            }

            visibleBooks.forEach(book => {
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

                    // eye_strain (monastery-decay-mrd) — 6h čtecí odpočet na pozadí
                    const readTimer = GameState.library.readingTimer;
                    let btnLabel = isRead ? t('library_lore.btn_read_again') : t('library_lore.btn_read');
                    let btnDisabled = '';
                    if (readTimer) {
                        if (readTimer.bookId === book.id) {
                            const remainMs = Math.max(0, readTimer.endTime - Date.now());
                            if (remainMs > 0) {
                                const hh = String(Math.floor(remainMs / 3600000)).padStart(2, '0');
                                const mm = String(Math.floor((remainMs % 3600000) / 60000)).padStart(2, '0');
                                const ss = String(Math.floor((remainMs % 60000) / 1000)).padStart(2, '0');
                                btnLabel = `🥴 ${hh}:${mm}:${ss}`;
                            } else {
                                btnLabel = currentLang === 'en' ? '📖 Claim' : '📖 Vyzvednout';
                            }
                        } else {
                            btnLabel = currentLang === 'en' ? '🔒 Locked' : '🔒 Zamčeno';
                            btnDisabled = 'disabled';
                        }
                    }

                    const _bookProt = (typeof LibraryHelpers !== 'undefined' && LibraryHelpers.getBookProtection) ? LibraryHelpers.getBookProtection(book) : null;
                    const _bookProtIcon = _bookProt === 'secreta' ? '🗝️' : _bookProt === 'catena' ? '⛓️' : _bookProt === 'anathema' ? '🖋️' : '';
                    const _bookProtTitle = _bookProt === 'secreta' ? (currentLang === 'en' ? 'Sealed in the Libraria Secreta' : 'Uzamčeno v Libraria Secreta')
                        : _bookProt === 'catena' ? (currentLang === 'en' ? 'Chained to the lectern' : 'Přikováno k pultu')
                            : _bookProt === 'anathema' ? (currentLang === 'en' ? 'Protected by a curse' : 'Chráněno kletbou') : '';
                    const _bookCond = GameState.library.bookCondition && GameState.library.bookCondition[book.id];
                    const _bookDamaged = _bookCond && LibraryHelpers.DAMAGE_THRESHOLD && _bookCond.condition < LibraryHelpers.DAMAGE_THRESHOLD;
                    const _bookLoan = GameState.library.loanedBooks && GameState.library.loanedBooks[book.id];
                    const _bookForgery = GameState.library.suspectedForgery && GameState.library.suspectedForgery[book.id];

                    h += `
                        <div class="card" style="border-color:${isRead ? 'var(--accent-gold)' : 'var(--ink-secondary)'};">
                            <div class="item-icon" style="background:${isRead ? '#c5a059' : '#e8dec0'}">
                                ${book.icon}
                            </div>
                            <div style="flex:1;">
                                <strong>${bookTitle}</strong> ${isRead ? '✓' : ''} ${_bookProt ? `<span title="${_bookProtTitle}">${_bookProtIcon}</span>` : ''} ${_bookDamaged ? '<span title="' + (currentLang === 'en' ? 'Damaged — needs repair' : 'Poškozeno — potřebuje opravu') + '">📕</span>' : ''} ${_bookLoan ? (_bookLoan.internal ? `<span title="${currentLang === 'en' ? 'Being read by ' + _bookLoan.borrowerName : 'Čte si ji ' + _bookLoan.borrowerName}">📖</span>` : `<span title="${currentLang === 'en' ? 'Out on loan to ' + _bookLoan.borrowerName : 'Zapůjčeno: ' + _bookLoan.borrowerName}">📤</span>`) : ''} ${_bookForgery ? `<span title="${currentLang === 'en' ? 'Secundo folio mismatch — possible forgery' : 'Secundo folio nesedí — možný padělek'}">🔍</span>` : ''}
                                <div class="text-sm">${bookAuthor} (${book.year})</div>
                            </div>
                            ${hasCatalogus ? `<button class="craft-btn" style="font-size:0.75rem;padding:4px 8px;min-width:auto;" onclick="UI.showCatalogModal(LibraryDB.books.find(b=>b.id==='${book.id}'))" title="${t('library_lore.btn_catalog')}">📇</button>` : ''}
                            <button class="craft-btn" onclick="LibraryHelpers.readBook('${book.id}')" ${btnDisabled}>
                                ${btnLabel}
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

            h += `</div>`; // konec lib-cat-body-${catId} / .lib-cat-body
            h += `</div>`;
        });

        el.innerHTML = h;
    },
    // ─────────────────────────────────────────────────────────────
    // Chronicle Reader (kronika-nasi-mrd, 28.8.2026; přeformátováno
    // 29.8.2026 — mobil oprava) — dvoustrana s listováním pro Kroniku
    // našeho kláštera. Čte přímo GameState.kronika (existující pole,
    // 120+ volacích míst po hře, viz ChronicleManager), žádný nový
    // obsah negeneruje.
    // Původní verze měla SVG rám s pevným viewBox 900×560 a HTML
    // textovou vrstvu na pevných px souřadnicích nad ním — na úzkém
    // mobilu se SVG zmenšilo, ale text ne, takže přetékal mimo
    // stránky. Teď čisté CSS flexbox (flex-wrap) — obě stránky mají
    // flex-basis, na širokém displeji sedí vedle sebe (spread), na
    // úzkém se samy zalomí pod sebe, žádná JS detekce šířky netřeba.
    // Skin-ready stejně jako předtím — budoucí ilustrovaný podklad
    // jde vyměnit jen za background na .chron-page, textová vrstva
    // (fmtEntry) se nemění.
    // ─────────────────────────────────────────────────────────────
    _chronicleSpread: 0,
    _chronicleEntriesPerPage: 6,

    showChronicleReader: function (book) {
        UI._chronicleSpread = 0;
        UI._chronicleReaderBookId = book.id;
        const overlay = document.createElement('div');
        overlay.id = 'chronicle-reader-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        overlay.innerHTML = UI._renderChronicleSpreadHTML(book);
        document.body.appendChild(overlay);
    },

    _closeChronicleReader: function () {
        const el = document.getElementById('chronicle-reader-overlay');
        if (el) el.remove();
    },

    _refreshChronicleReader: function () {
        const overlay = document.getElementById('chronicle-reader-overlay');
        if (!overlay) return;
        const book = LibraryDB.books.find(b => b.id === UI._chronicleReaderBookId);
        if (!book) return;
        overlay.innerHTML = UI._renderChronicleSpreadHTML(book);
    },

    _renderChronicleSpreadHTML: function (book) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const entries = GameState.kronika || [];
        const perPage = UI._chronicleEntriesPerPage;
        const totalPages = Math.max(1, Math.ceil(entries.length / perPage));
        const totalSpreads = Math.max(1, Math.ceil(totalPages / 2));
        const spread = Math.max(0, Math.min(UI._chronicleSpread || 0, totalSpreads - 1));
        UI._chronicleSpread = spread;

        const leftPageIdx = spread * 2;
        const rightPageIdx = leftPageIdx + 1;
        const getPageEntries = (pageIdx) => {
            if (pageIdx >= totalPages) return [];
            return entries.slice(pageIdx * perPage, pageIdx * perPage + perPage);
        };
        const leftEntries = getPageEntries(leftPageIdx);
        const rightEntries = getPageEntries(rightPageIdx);

        // _toGameDate — rok natvrdo 1465, měsíc/den z reálného timestampu.
        // Mirror vzoru z core/ui.js:2515, PetitionManager.js a 5 dalších
        // souborů (přehlédnuto při prvním psaní readeru, 29.8.2026 fix —
        // hlásil Bouvard, kronika ukazovala reálný rok 2026 místo 1465).
        const _toGameDate = (ts) => { const d = new Date(ts); return new Date(1465, d.getMonth(), d.getDate()); };
        const fmtEntry = (e) => {
            const dateStr = _toGameDate(e.ts).toLocaleDateString(lang === 'en' ? 'en-GB' : 'cs-CZ');
            const txt = (lang === 'en' ? (e.en || e.cs) : e.cs) || '';
            return '<div style="margin-bottom:10px;font-size:0.82rem;line-height:1.4;">' +
                '<span style="opacity:0.5;font-size:0.7rem;">' + dateStr + '</span><br>' + txt +
                '</div>';
        };

        const emptyState = '<div style="opacity:0.5;font-style:italic;text-align:center;margin-top:40px;">' +
            (lang === 'en' ? '(this page is not yet written)' : '(tato stránka ještě není popsána)') +
            '</div>';

        // Custos — první slova stránky, co následuje, dole vpravo na levé.
        let custos = '';
        const nextPageFirst = getPageEntries(rightPageIdx)[0];
        if (nextPageFirst) {
            const nextTxt = (lang === 'en' ? (nextPageFirst.en || nextPageFirst.cs) : nextPageFirst.cs) || '';
            custos = nextTxt.replace(/^[^\wÀ-ž]+/, '').split(/\s+/).slice(0, 3).join(' ');
        }

        const title = lang === 'en' ? (book.title_en || book.title) : book.title;
        const closeLabel = lang === 'en' ? 'Close' : 'Zavřít';
        const prevLabel = lang === 'en' ? '‹ Previous' : '‹ Zpět';
        const nextLabel = lang === 'en' ? 'Next ›' : 'Dál ›';

        const pageStyle = 'flex:1 1 300px;min-width:240px;max-width:420px;box-sizing:border-box;' +
            'background:linear-gradient(180deg,#fbf7ee,#f3ecd9);border-radius:6px;' +
            'border:1px solid rgba(197,160,89,0.4);padding:16px 18px;position:relative;' +
            'max-height:52vh;overflow-y:auto;font-family:\'Cinzel\',serif,Georgia;color:#2c3e50;';

        return `
        <div style="position:relative;max-width:900px;width:100%;">
            <button onclick="UI._closeChronicleReader()" style="position:sticky;top:0;float:right;margin-bottom:8px;background:var(--accent-wax);color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;z-index:1;">✕ ${closeLabel}</button>
            <div style="background:#2c1810;border-radius:10px;padding:14px;box-shadow:0 8px 24px rgba(0,0,0,0.5);clear:both;">
                <div style="display:flex;flex-wrap:wrap;gap:12px;">
                    <div style="${pageStyle}">
                        ${leftPageIdx === 0 ? `<div style="text-align:center;font-weight:bold;margin-bottom:14px;color:#8b4513;">${title}</div>` : ''}
                        ${leftEntries.length ? leftEntries.map(fmtEntry).join('') : (leftPageIdx === 0 ? '' : emptyState)}
                        ${custos ? `<div style="text-align:right;margin-top:10px;font-size:0.68rem;opacity:0.4;font-style:italic;">${custos}</div>` : ''}
                    </div>
                    <div style="${pageStyle}">
                        ${rightEntries.length ? rightEntries.map(fmtEntry).join('') : emptyState}
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
                    <button onclick="UI._chronicleSpread=Math.max(0,(UI._chronicleSpread||0)-1);UI._refreshChronicleReader();" style="background:linear-gradient(180deg,#8b4513,#5a2a0a);color:#fff;border:1px solid #d4af37;padding:8px 18px;border-radius:4px;cursor:pointer;">${prevLabel}</button>
                    <span style="color:#c5a059;font-size:0.8rem;">${spread + 1} / ${totalSpreads}</span>
                    <button onclick="UI._chronicleSpread=Math.min(${totalSpreads - 1},(UI._chronicleSpread||0)+1);UI._refreshChronicleReader();" style="background:linear-gradient(180deg,#8b4513,#5a2a0a);color:#fff;border:1px solid #d4af37;padding:8px 18px;border-radius:4px;cursor:pointer;">${nextLabel}</button>
                </div>
            </div>
        </div>`;
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

    // Subtab "Výpůjčky" (28.8.2026) — konsoliduje Knižní nemocnici (D2) a
    // Absenční výpůjčky (C2) na jedno místo, ať se hlavní seznam knih
    // neplní stavovými panely. Přesunuto z renderLibrary() beze změny
    // logiky, jen onclick reload teď volá renderVypujckyTab() místo
    // renderLibrary().
    // "Výpůjční okénko" — SVG scéna pultu (grafik, 29.8.2026), viewBox
    // 800×400. Text odstraněn z SVG (byl natvrdo česky, i18n neprošlo) —
    // nadpis se vykresluje jako skutečný HTML text přes stejné místo.
    // Výklenky pro tlačítka jsou v SVG prostoru na x=405,w=350 (řádky
    // y=115/177/239/301, h=52/52/52/45) — přepočteno na % z viewBoxu,
    // ať sedí responzivně při libovolné šířce kontejneru (aspect-ratio
    // 2/1 container + position:absolute uvnitř, žádné pevné px).
    _LENDING_WINDOW_NICHES: [
        { left: 50.625, top: 28.75, width: 43.75, height: 13 },
        { left: 50.625, top: 44.25, width: 43.75, height: 13 },
        { left: 50.625, top: 59.75, width: 43.75, height: 13 },
        { left: 50.625, top: 75.25, width: 43.75, height: 11.25 },
    ],

    _lendingWindowSVG: function () {
        return `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:100%;">
  <defs>
    <linearGradient id="lwWoodPlank" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="var(--leather-dark)" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="var(--ink-secondary)" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="var(--leather-dark)" stop-opacity="0.95"/>
    </linearGradient>
    <radialGradient id="lwFireGlow" cx="50%" cy="60%" r="60%">
      <stop offset="0%" stop-color="#ffb066" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="var(--accent-wax)" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="var(--accent-wax)" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lwRoomDark" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#3a2e22" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#1c1610" stop-opacity="0.97"/>
    </radialGradient>
    <linearGradient id="lwMetalHook" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="var(--accent-gold)"/>
      <stop offset="100%" stop-color="var(--ink-secondary)"/>
    </linearGradient>
    <filter id="lwRough" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="4"/>
    </filter>
    <filter id="lwWoodgrain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.09" numOctaves="3" seed="12" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="6"/>
    </filter>
  </defs>

  <g opacity="0.35">
    <path d="M0 20 Q400 5 800 20" stroke="var(--ink-secondary)" stroke-width="1" fill="none" opacity="0.3"/>
    <path d="M0 380 Q400 395 800 380" stroke="var(--ink-secondary)" stroke-width="1" fill="none" opacity="0.3"/>
  </g>

  <g filter="url(#lwWoodgrain)">
    <rect x="15" y="15" width="770" height="370" rx="6" fill="url(#lwWoodPlank)" stroke="var(--ink-primary)" stroke-width="4"/>
    <g stroke="var(--ink-primary)" stroke-width="1.5" opacity="0.5" fill="none">
      <path d="M15 90 Q200 85 400 90 T785 88"/>
      <path d="M15 170 Q220 175 420 168 T785 172"/>
      <path d="M15 300 Q250 295 450 302 T785 298"/>
      <path d="M15 340 Q250 345 450 338 T785 342"/>
    </g>
    <g stroke="var(--ink-secondary)" stroke-width="0.8" opacity="0.4" fill="none">
      <path d="M40 30 Q60 120 45 220 Q35 300 55 375"/>
      <path d="M120 20 Q140 100 125 200 Q115 290 140 380"/>
      <path d="M660 25 Q680 110 665 210 Q655 300 675 375"/>
      <path d="M730 20 Q745 110 735 210 T745 380"/>
    </g>
  </g>

  <g fill="var(--ink-primary)" opacity="0.85">
    <path d="M18 18 L60 18 L60 26 L26 26 L26 60 L18 60 Z"/>
    <path d="M782 18 L740 18 L740 26 L774 26 L774 60 L782 60 Z"/>
    <path d="M18 382 L60 382 L60 374 L26 374 L26 340 L18 340 Z"/>
    <path d="M782 382 L740 382 L740 374 L774 374 L774 340 L782 340 Z"/>
  </g>
  <g fill="var(--accent-gold)" opacity="0.9">
    <circle cx="30" cy="30" r="3.5"/><circle cx="770" cy="30" r="3.5"/>
    <circle cx="30" cy="370" r="3.5"/><circle cx="770" cy="370" r="3.5"/>
  </g>

  <rect x="70" y="70" width="230" height="230" rx="10" fill="url(#lwRoomDark)" stroke="var(--ink-primary)" stroke-width="5" filter="url(#lwRough)"/>
  <ellipse cx="185" cy="230" rx="90" ry="55" fill="url(#lwFireGlow)"/>
  <g opacity="0.85">
    <rect x="95" y="95" width="180" height="90" fill="#241c14" opacity="0.6"/>
    <rect x="140" y="205" width="90" height="70" rx="6" fill="#241a12" stroke="var(--ink-primary)" stroke-width="2"/>
    <rect x="150" y="215" width="70" height="20" rx="3" fill="var(--accent-wax)" opacity="0.55"/>
    <rect x="158" y="217" width="54" height="12" rx="2" fill="#ffae56" opacity="0.85">
      <animate attributeName="opacity" values="0.6;0.95;0.6" dur="3.2s" repeatCount="indefinite"/>
    </rect>
    <rect x="178" y="150" width="14" height="60" fill="#2a2018" stroke="var(--ink-primary)" stroke-width="1"/>
    <circle cx="170" cy="200" r="2" fill="#ffb066" opacity="0.7">
      <animate attributeName="cy" values="200;170;150" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.7;0.3;0" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="200" cy="205" r="1.6" fill="#ffcf8a" opacity="0.6">
      <animate attributeName="cy" values="205;175;155" dur="3s" repeatCount="indefinite" begin="0.6s"/>
      <animate attributeName="opacity" values="0.6;0.25;0" dur="3s" repeatCount="indefinite" begin="0.6s"/>
    </circle>
  </g>

  <g stroke="var(--ink-primary)" stroke-width="6" stroke-linecap="round" filter="url(#lwRough)">
    <line x1="115" y1="70" x2="115" y2="300"/><line x1="185" y1="70" x2="185" y2="300"/><line x1="255" y1="70" x2="255" y2="300"/>
    <line x1="70" y1="130" x2="300" y2="130"/><line x1="70" y1="200" x2="300" y2="200"/><line x1="70" y1="260" x2="300" y2="260"/>
  </g>
  <g fill="var(--accent-gold)" opacity="0.8">
    <circle cx="115" cy="130" r="3"/><circle cx="185" cy="130" r="3"/><circle cx="255" cy="130" r="3"/>
    <circle cx="115" cy="200" r="3"/><circle cx="185" cy="200" r="3"/><circle cx="255" cy="200" r="3"/>
  </g>
  <rect x="60" y="60" width="250" height="250" rx="14" fill="none" stroke="var(--accent-gold)" stroke-width="2.5" opacity="0.55"/>
  <path d="M60 60 Q185 45 310 60" fill="none" stroke="var(--accent-gold)" stroke-width="2" opacity="0.4"/>

  <g transform="translate(345,110)">
    <path d="M0 0 L0 90 Q10 96 22 90 L22 0 Q11 -6 0 0 Z" fill="var(--leather-dark)" stroke="var(--ink-primary)" stroke-width="2.5" filter="url(#lwRough)"/>
    <path d="M11 20 Q40 20 44 45 Q46 60 30 62" fill="none" stroke="url(#lwMetalHook)" stroke-width="6" stroke-linecap="round"/>
    <circle cx="11" cy="15" r="2.5" fill="var(--accent-gold)" opacity="0.8"/>
    <circle cx="11" cy="75" r="2.5" fill="var(--accent-gold)" opacity="0.8"/>
    <ellipse cx="30" cy="63" rx="13" ry="7" fill="none" stroke="var(--ink-primary)" stroke-width="3"/>
    <ellipse cx="30" cy="61" rx="9" ry="4.5" fill="#1a140e" opacity="0.6"/>
    <path d="M25 58 Q30 50 35 58" stroke="var(--ink-secondary)" stroke-width="1" fill="none" opacity="0.5"/>
  </g>

  <g filter="url(#lwWoodgrain)">
    <rect x="60" y="300" width="290" height="26" rx="4" fill="var(--leather-dark)" stroke="var(--ink-primary)" stroke-width="3"/>
    <line x1="70" y1="313" x2="340" y2="313" stroke="var(--ink-primary)" stroke-width="1" opacity="0.4"/>
  </g>
  <g transform="translate(90,297)">
    <circle r="12" fill="var(--accent-wax)" stroke="var(--ink-primary)" stroke-width="1.5"/>
    <path d="M-6 -2 Q0 -8 6 -2 Q3 4 0 2 Q-3 4 -6 -2 Z" fill="var(--accent-gold)" opacity="0.7"/>
  </g>

  <g filter="url(#lwWoodgrain)">
    <rect x="390" y="60" width="380" height="300" rx="10" fill="var(--bg-parchment)" opacity="0.08" stroke="var(--ink-primary)" stroke-width="3"/>
    <rect x="390" y="60" width="380" height="300" rx="10" fill="none" stroke="var(--accent-gold)" stroke-width="1.5" opacity="0.5"/>
  </g>
  <g transform="translate(390,60)">
    <path d="M0 0 L380 0 L380 34 Q190 44 0 34 Z" fill="var(--leather-dark)" opacity="0.5" stroke="var(--ink-primary)" stroke-width="2"/>
  </g>

  <g stroke="var(--ink-primary)" stroke-width="2" fill="none" opacity="0.55" filter="url(#lwRough)">
    <rect x="405" y="115" width="350" height="52" rx="8"/>
    <rect x="405" y="177" width="350" height="52" rx="8"/>
    <rect x="405" y="239" width="350" height="52" rx="8"/>
    <rect x="405" y="301" width="350" height="45" rx="8"/>
  </g>
  <g fill="var(--accent-gold)" opacity="0.6">
    <circle cx="398" cy="141" r="2.5"/><circle cx="762" cy="141" r="2.5"/>
    <circle cx="398" cy="203" r="2.5"/><circle cx="762" cy="203" r="2.5"/>
    <circle cx="398" cy="265" r="2.5"/><circle cx="762" cy="265" r="2.5"/>
    <circle cx="398" cy="323" r="2.5"/><circle cx="762" cy="323" r="2.5"/>
  </g>

  <g stroke="var(--ink-primary)" stroke-width="1" fill="none" opacity="0.25">
    <path d="M40 45 Q45 200 38 355"/><path d="M760 45 Q756 200 762 355"/>
    <path d="M100 65 Q400 55 700 68"/><path d="M100 345 Q400 355 700 342"/>
  </g>
  <g stroke="var(--ink-secondary)" stroke-width="0.6" opacity="0.3">
    <line x1="330" y1="80" x2="360" y2="95"/><line x1="500" y1="90" x2="530" y2="70"/><line x1="600" y1="340" x2="640" y2="355"/>
  </g>
</svg>`;
    },

    // Sestaví celý pult — SVG na pozadí, skutečný HTML nadpis přes vyřezaný
    // pruh, tlačítka přesně ve výklencích (procenta z viewBoxu, responzivní).
    // buttons: [{label, onclick}], max 4 (tolik má SVG výklenků).
    _renderLendingWindow: function (headerText, buttons) {
        const niches = this._LENDING_WINDOW_NICHES;
        let btnHtml = '';
        buttons.slice(0, 4).forEach((b, i) => {
            const n = niches[i];
            btnHtml += `<button class="craft-btn" style="position:absolute;left:${n.left}%;top:${n.top}%;width:${n.width}%;height:${n.height}%;margin:0;font-size:0.8rem;" onclick="${b.onclick}">${b.label}</button>`;
        });
        return `<div style="position:relative;width:100%;max-width:800px;margin:0 auto 20px;aspect-ratio:2/1;">
                  <div style="position:absolute;inset:0;">${this._lendingWindowSVG()}</div>
                  <div style="position:absolute;left:48.75%;top:15%;width:47.5%;height:8.5%;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--accent-gold);font-weight:bold;font-size:clamp(0.6rem,1.6vw,1rem);letter-spacing:1px;padding:0 4%;overflow:hidden;">${headerText}</div>
                  ${btnHtml}
                </div>`;
    },

    renderVypujckyTab: function () {
        const el = document.getElementById('library-vypujcky-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const hasD2 = GameState.researchedTechs && GameState.researchedTechs.includes('tech_conservatio');
        const hasC2 = GameState.researchedTechs && GameState.researchedTechs.includes('tech_absentee_lending');
        const hasInternal = GameState.researchedTechs && GameState.researchedTechs.includes('tech_lenten_reading');
        let h = '';

        // "Pult" — vyřízení konkrétní čekající žádosti, cíl navigace
        // z ChroniconSystem._showRequestGateModal() / "Vyřešit" volby.
        // vypujcky-notifikace-mrd (29.8.2026). Externí (Chronicon) i
        // interní (bratr) sdílí jednu kartu nahoře, ne dvě oddělené.
        // MUSÍ běžet PŘED "nic k správě" early-returnem níž — žádost může
        // dorazit z Chronicon strany nezávisle na tom, jaké techy má
        // hráč prostudované (soft-bounce řeší až samotné _resolveAdvisory).
        const adv = GameState.chroniconAdvisory;
        const extPending = adv && adv.pending && (adv.pending.kind === 'ctenar' || adv.pending.kind === 'vypujcka') ? adv.pending : null;
        const intPending = GameState.library && GameState.library.pendingInternalLoan;
        // Gate-fix (1.9.2026, nahlásil Bouvard) — okénko se v předchozí
        // úpravě omylem zobrazovalo VŽDY, bez ohledu na tech. Porušovalo
        // to vlastní hard rule "gatuj všechno". Bez aspoň jednoho ze tří
        // Výpůjčky-techů (D2/C2/interní) se okénko vůbec nestaví — jen
        // informace, co je potřeba prostudovat.
        if (hasD2 || hasC2 || hasInternal) {
            let contextHtml = '';
            let windowButtons = [];
            if (extPending) {
                const title = lang === 'en' ? (extPending.title_en || extPending.title_cs) : extPending.title_cs;
                const text = lang === 'en' ? (extPending.text_en || extPending.text_cs) : extPending.text_cs;
                contextHtml = `<div style="margin-bottom:10px;"><strong>${title}</strong><div style="font-size:0.85rem;opacity:0.85;margin-top:4px;">${text || ''}</div></div>`;
                windowButtons = (extPending.choices || []).map(c => ({
                    label: lang === 'en' ? (c.label_en || c.label_cs) : c.label_cs,
                    onclick: `ChroniconSystem._resolveAdvisory('${adv.activeId}', '${c.id}', '${lang}');UI.renderVypujckyTab();`,
                }));
            } else if (intPending) {
                const bTitle = lang === 'en' ? `${intPending.borrowerName} asks to read` : `${intPending.borrowerName} žádá o čtení`;
                const bText = lang === 'en' ? `"${intPending.bookTitle}", for ${intPending.days} days.` : `"${intPending.bookTitle}", na ${intPending.days} dní.`;
                contextHtml = `<div style="margin-bottom:10px;"><strong>${bTitle}</strong><div style="font-size:0.85rem;opacity:0.85;margin-top:4px;">${bText}</div></div>`;
                windowButtons = [
                    { label: lang === 'en' ? 'Approve' : 'Schválit', onclick: `LibraryHelpers.resolveInternalLoanRequest('approve');UI.renderVypujckyTab();` },
                    { label: lang === 'en' ? 'Deny' : 'Zamítnout', onclick: `LibraryHelpers.resolveInternalLoanRequest('deny');UI.renderVypujckyTab();` },
                ];
            } else {
                // Klidový stav — okénko je trvalá součást tabu (Bouvard,
                // 29.8.2026: "chci hezký herní design", ne jen podmíněný
                // popup), ne něco, co se objeví jen při žádosti.
                contextHtml = `<div style="margin-bottom:10px;opacity:0.7;font-style:italic;">${lang === 'en' ? 'No one is waiting right now.' : 'Momentálně tu nikdo nečeká.'}</div>`;
            }
            const headerText = lang === 'en' ? 'LENDING WINDOW' : 'VÝPŮJČNÍ OKÉNKO';
            h += `<div style="margin-bottom:20px;">
                    <div style="font-weight:bold;font-size:0.9rem;margin-bottom:8px;">${lang === 'en' ? '🛎️ At the Counter' : '🛎️ Na pultu'}</div>
                    ${contextHtml}
                    ${this._renderLendingWindow(headerText, windowButtons)}
                  </div>`;
        } else {
            h += `<div style="margin-bottom:20px;padding:12px 14px;background:rgba(139,111,60,0.06);border:1px solid rgba(197,160,89,0.25);border-radius:6px;opacity:0.8;">
                    <div style="font-weight:bold;font-size:0.85rem;margin-bottom:6px;">${lang === 'en' ? '🔒 Lending Window' : '🔒 Výpůjční okénko'}</div>
                    <div style="font-size:0.8rem;">${lang === 'en'
                    ? 'Not built yet — research Book Infirmary, Absentee Lending, or Lenten Reading first.'
                    : 'Zatím nestojí — nejdřív vyzkoumej Knižní nemocnici, Výpůjčku mimo klášter, nebo Postní čtení.'}</div>
                  </div>`;
        }

        if (!hasD2 && !hasC2 && !hasInternal) {
            if (h) { el.innerHTML = h; return; } // pult karta existuje i bez techu — ukázat jen ji
            el.innerHTML = `<p style="opacity:0.7;font-style:italic;padding:12px;">${lang === 'en'
                ? 'Nothing to manage here yet — research Book Infirmary or Absentee Lending first.'
                : 'Zatím tu není co spravovat — nejdřív vyzkoumej Knižní nemocnici nebo Výpůjčku mimo klášter.'}</p>`;
            return;
        }

        if (hasD2) {
            const bc = (GameState.library && GameState.library.bookCondition) || {};
            const damaged = Object.keys(bc).filter(id => bc[id].condition < LibraryHelpers.DAMAGE_THRESHOLD);
            const worn = Object.keys(bc).filter(id => bc[id].condition < 100 && bc[id].condition >= LibraryHelpers.DAMAGE_THRESHOLD);
            h += `<div style="margin-bottom:20px;padding:12px 14px;background:rgba(139,111,60,0.06);border:1px solid rgba(197,160,89,0.25);border-radius:6px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
                      <div style="font-weight:bold;font-size:0.85rem;">${lang === 'en' ? '🏥 Book Infirmary' : '🏥 Knižní nemocnice'}</div>
                      <button class="craft-btn" style="font-size:0.72rem;padding:3px 8px;min-width:auto;" onclick="LibraryHelpers.maintainLibrary();UI.renderVypujckyTab();">${lang === 'en' ? 'Air & dust' : 'Vyvětrat a oprášit'} (${GameState.inventory.herb_blue || 0}× 🌿)</button>
                    </div>
                    <div style="font-size:0.78rem;opacity:0.8;">
                      ${damaged.length > 0 ? (lang === 'en' ? `📕 ${damaged.length} damaged, unreadable until repaired` : `📕 ${damaged.length} poškozeno, nelze číst do opravy`) : ''}
                      ${worn.length > 0 ? ` · ${lang === 'en' ? worn.length + ' worn' : worn.length + ' opotřebeno'}` : ''}
                      ${damaged.length === 0 && worn.length === 0 ? (lang === 'en' ? '✓ Fond in good order' : '✓ Fond v pořádku') : ''}
                    </div>
                    ${damaged.length > 0 ? `<div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
                      ${damaged.map(id => {
                const b = LibraryDB.books.find(bk => bk.id === id);
                const title = b ? (lang === 'en' ? (b.title_en || b.title) : b.title) : id;
                return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:0.75rem;">
                          <span>📕 ${title}</span>
                          <button class="craft-btn" style="font-size:0.7rem;padding:2px 6px;min-width:auto;" onclick="LibraryHelpers.repairBook('${id}');UI.renderVypujckyTab();">${lang === 'en' ? 'Repair' : 'Opravit'}</button>
                        </div>`;
            }).join('')}
                    </div>` : ''}
                  </div>`;
        }

        // Secundo Folio audit — Cluster B (knihovna-rozsireni-mrd,
        // 29.8.2026). Trvalá karta, ne popup event — objeví se, jakmile
        // je co řešit, žádné umělé zpoždění/cooldown navíc (Bouvard,
        // 29.8.2026: "chci ten tab, ne modal"). Gate na hasC2 — jen
        // absenční výpůjčky mohou vůbec vyprodukovat podezření.
        if (hasC2) {
            const forgeries = (GameState.library && GameState.library.suspectedForgery) || {};
            const forgeryIds = Object.keys(forgeries);
            if (forgeryIds.length > 0) {
                h += `<div style="margin-bottom:20px;padding:12px 14px;background:rgba(139,111,60,0.06);border:1px solid rgba(197,160,89,0.25);border-radius:6px;">
                        <div style="font-weight:bold;font-size:0.85rem;margin-bottom:8px;">${lang === 'en' ? '🔍 Secundo Folio Audit' : '🔍 Kontrola secundo folia'}</div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                          ${forgeryIds.map(id => {
                    const b = LibraryDB.books.find(bk => bk.id === id);
                    const title = b ? (lang === 'en' ? (b.title_en || b.title) : b.title) : id;
                    const rec = forgeries[id];
                    const note = lang === 'en'
                        ? `Returned from ${rec.borrowerName} — the secundo folio does not quite match. A forgery?`
                        : `Vrácena od ${rec.borrowerName} — secundo folio úplně nesedí. Padělek?`;
                    return `<div style="font-size:0.78rem;">
                              <div style="margin-bottom:4px;">📇 <strong>${title}</strong><br><span style="opacity:0.75;">${note}</span></div>
                              <div style="display:flex;gap:8px;">
                                <button class="craft-btn" style="font-size:0.72rem;padding:3px 8px;min-width:auto;" onclick="LibraryHelpers.confrontForgery('${id}');UI.renderVypujckyTab();">${lang === 'en' ? 'Confront' : 'Konfrontovat'}</button>
                                <button class="craft-btn" style="font-size:0.72rem;padding:3px 8px;min-width:auto;" onclick="LibraryHelpers.ignoreForgery('${id}');UI.renderVypujckyTab();">${lang === 'en' ? 'Let it go' : 'Nechat být'}</button>
                              </div>
                            </div>`;
                }).join('')}
                        </div>
                      </div>`;
            }
        }

        if (hasInternal) {
            const loans = (GameState.library && GameState.library.loanedBooks) || {};
            const internalIds = Object.keys(loans).filter(id => loans[id].internal);
            // konzistence-vypujcky-mrd (29.8.2026) — sekce se dřív schovala
            // úplně, když zrovna nikdo nic nepůjčoval, na rozdíl od "Výpůjčky
            // mimo klášter", co vždy ukazuje "Momentálně nic venku". Teď
            // hlavička + stavový řádek vždy, mirror stejného vzoru.
            h += `<div style="margin-bottom:20px;padding:12px 14px;background:rgba(139,111,60,0.06);border:1px solid rgba(197,160,89,0.25);border-radius:6px;">
                    <div style="font-weight:bold;font-size:0.85rem;margin-bottom:8px;">${lang === 'en' ? '📖 In the Monastery' : '📖 V klášteře'}</div>
                    <div style="font-size:0.78rem;opacity:0.8;${internalIds.length > 0 ? 'margin-bottom:6px;' : ''}">
                      ${internalIds.length > 0 ? (lang === 'en' ? `${internalIds.length} being read` : `${internalIds.length} zapůjčeno`) : (lang === 'en' ? 'No one has borrowed anything at present' : 'Momentálně si nikdo nic nepůjčil')}
                    </div>
                    ${internalIds.length > 0 ? `<div style="display:flex;flex-direction:column;gap:4px;">
                      ${internalIds.map(id => {
                const b = LibraryDB.books.find(bk => bk.id === id);
                const title = b ? (lang === 'en' ? (b.title_en || b.title) : b.title) : id;
                const daysLeft = Math.max(0, Math.ceil((loans[id].dueAt - Date.now()) / (24 * 3600000)));
                return `<div style="font-size:0.75rem;padding:2px 0;">📖 ${title} — <span style="opacity:0.7;">${loans[id].borrowerName}, ${lang === 'en' ? daysLeft + 'd left' : 'zbývá ' + daysLeft + ' dní'}</span></div>`;
            }).join('')}
                    </div>` : ''}
                  </div>`;
        }

        if (hasC2 || hasInternal) {
            const loans = (GameState.library && GameState.library.loanedBooks) || {};
            const lostIds = Object.keys(loans).filter(id => loans[id].lost);
            const outIds = Object.keys(loans).filter(id => !loans[id].lost && !loans[id].internal);
            const history = ((GameState.library && GameState.library.loanHistory) || []).slice(-10).reverse();
            // Bez hasC2 se sekce ukazuje jen když je fakt co (historie z
            // interních půjček) — jinak prázdný orámovaný box (28.8.2026 fix,
            // nahlásil Bouvard — hasInternal samo o sobě netvoří obsah).
            if (hasC2 || history.length > 0) {
                h += `<div style="margin-bottom:20px;padding:12px 14px;background:rgba(139,111,60,0.06);border:1px solid rgba(197,160,89,0.25);border-radius:6px;">
                    ${hasC2 ? `<div style="font-weight:bold;font-size:0.85rem;margin-bottom:8px;">${lang === 'en' ? '📤 Absentee Loans' : '📤 Výpůjčky mimo klášter'}</div>
                    <div style="font-size:0.78rem;opacity:0.8;margin-bottom:6px;">
                      ${outIds.length > 0 ? (lang === 'en' ? `${outIds.length} out on loan` : `${outIds.length} zapůjčeno`) : ''}
                      ${lostIds.length > 0 ? ` · ${lang === 'en' ? lostIds.length + ' unreturned' : lostIds.length + ' nevráceno'}` : ''}
                      ${outIds.length === 0 && lostIds.length === 0 ? (lang === 'en' ? 'Nothing out at present' : 'Momentálně nic venku') : ''}
                    </div>
                    ${outIds.length > 0 ? `<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">
                      ${outIds.map(id => {
                    const b = LibraryDB.books.find(bk => bk.id === id);
                    const title = b ? (lang === 'en' ? (b.title_en || b.title) : b.title) : id;
                    const daysLeft = Math.max(0, Math.ceil((loans[id].dueAt - Date.now()) / (24 * 3600000)));
                    return `<div style="font-size:0.75rem;padding:2px 0;">📤 ${title} — <span style="opacity:0.7;">${loans[id].borrowerName}, ${lang === 'en' ? daysLeft + 'd left' : 'zbývá ' + daysLeft + ' dní'}</span></div>`;
                }).join('')}
                    </div>` : ''}
                    ${lostIds.length > 0 ? `<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">
                      ${lostIds.map(id => {
                    const b = LibraryDB.books.find(bk => bk.id === id);
                    const title = b ? (lang === 'en' ? (b.title_en || b.title) : b.title) : id;
                    const cost = ((typeof LibraryHelpers !== 'undefined' && LibraryHelpers.getScribePrice) ? LibraryHelpers.getScribePrice() : 10) * 2;
                    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:0.75rem;">
                          <span>📕 ${title} <span style="opacity:0.6;">(${loans[id].borrowerName})</span></span>
                          <button class="craft-btn" style="font-size:0.7rem;padding:2px 6px;min-width:auto;" onclick="LibraryHelpers.buybackLoanedBook('${id}');UI.renderVypujckyTab();">${lang === 'en' ? 'Recover' : 'Vykoupit'} (${cost}× 📜)</button>
                        </div>`;
                }).join('')}
                    </div>` : ''}` : ''}
                    ${history.length > 0 ? `<div style="border-top:1px solid rgba(197,160,89,0.2);padding-top:6px;">
                      <div style="font-size:0.72rem;opacity:0.6;margin-bottom:4px;">${lang === 'en' ? 'Recent history' : 'Nedávná historie'}</div>
                      ${history.map(hh => `<div style="font-size:0.7rem;opacity:0.65;padding:1px 0;">${hh.problem ? '⚠️' : (hh.internal ? '📖' : '✓')} ${hh.bookTitle} — ${hh.borrowerName}</div>`).join('')}
                    </div>` : ''}
                  </div>`;
            }
        }

        // Fallback (28.8.2026 fix) — pokud vůbec nic výš nepřidalo obsah
        // (typicky: jen tech_lenten_reading vyzkoumaný, žádná interní půjčka
        // ještě nenastala, žádná historie), ukázat aspoň vysvětlující text
        // místo prázdného orámovaného boxu.
        if (!h) {
            h = `<p style="opacity:0.7;font-style:italic;padding:12px;">${lang === 'en'
                ? 'Nothing to report yet — the brothers have not yet reached for a book on their own.'
                : 'Zatím není co hlásit — bratři si ještě sami od sebe žádnou knihu nevzali.'}</p>`;
        }

        el.innerHTML = h;
    },

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

        // Sokoban — Knihovní uspořádání (Ars Bibliothecae)
        const hasSokobanScroll = GameState.inventory['sokoban_scroll'] > 0;
        const hasSokobanTech = GameState.researchedTechs.includes('tech_sokoban');
        h += `<div class="game-card ${hasSokobanTech ? '' : 'locked'}">`;
        if (!hasSokobanTech) h += `<span class="game-lock-badge">🔒</span>`;
        h += `<span class="game-icon">📚</span>`;
        h += `<div class="game-title">${t('games.sokobanName')}</div>`;
        h += `<div class="game-desc">${t('games.sokobanDesc')}</div>`;
        if (!hasSokobanTech) {
            h += `<div class="game-unlock-text">${t('games.sokobanTech')}</div>`;
        } else if (!hasSokobanScroll) {
            h += `<div class="game-unlock-text">${t('games.sokobanCraft')}</div>`;
            h += `<button class="craft-btn" onclick="SokobanGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
        } else {
            h += `<button class="craft-btn" onclick="SokobanGame.start()">${t('games.btnPlay')}</button>`;
            h += `<button class="craft-btn" onclick="SokobanGame.showRules()" style="background: var(--accent-gold);">${t('games.btnRules')}</button>`;
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
        if (hasSokobanScroll && SokobanGame.gameActive) SokobanGame.render();
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

            if (desc.includes('ink_gallic')) {
                const hasItem = (GameState.inventory['ink_gallic'] || 0) > 0;
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
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            if (typeof TutorialSystem !== 'undefined') {
                const btnToggle = document.getElementById('btn-toggle-tutorial');
                const btnReset = document.getElementById('btn-reset-tutorial');
                const isRunning = GameState.tutorial && GameState.tutorial.active;
                if (btnToggle) {
                    btnToggle.textContent = isRunning ? '⏸️ POZASTAVIT TUTORIAL' : '🚀 SPUSTIT TUTORIAL REŽIM';
                    btnToggle.onclick = function () {
                        if (isRunning) {
                            TutorialSystem.stopTutorial();
                            UI.openAboutModal();
                        } else {
                            TutorialSystem.startTutorialFromModal();
                        }
                    };
                }
                if (btnReset) {
                    btnReset.style.display = (GameState.tutorial && (GameState.tutorial.step > 0 || GameState.tutorial.completed)) ? 'inline-block' : 'none';
                }
            }
        }
    },

    closeAboutModal: function () {
        document.getElementById('about-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    // ─── KRONIKA ─────────────────────────────────────────────────────
    _kronikaPage: 0,
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
            local_events: t('kronika.chroniconSrc.local_events'),
            distant_events: t('kronika.chroniconSrc.distant_events'),
            monastery_internal: t('kronika.chroniconSrc.monastery_internal'),
            engine: t('kronika.chroniconSrc.engine'),
            gm: t('kronika.chroniconSrc.gm'),
        };

        const entriesHtml = slice.length === 0
            ? `<p style="color:var(--ink-secondary); font-style:italic;">${t('kronika.empty')}</p>`
            : slice.map(e => {
                const isImportant = e.type === 'important';
                const isChronicon = e.type === 'chronicon';

                if (isChronicon) {
                    const srcLabel = CHRONICON_SOURCE_LABEL[e.source] || '☩';
                    const icon = e.icon ? e.icon + ' ' : '☩ ';
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

    // Okno do Chroniconu — dashboard (počasí/napětí/aktéři) + chronicle_local/
    // chronicle_distant ze živého snapshotu, ve dvou sloupcích vedle sebe.
    // Žádný nový fetch — ChroniconSystem._snap je už stažený jednou/den.
    _ACTOR_ICONS: {
        vrchnost: '🏰', mlynar: '🌾', kovar: '⚒️', uhlic: '🔥', vorar: '🪵',
        rybnikar: '🐟', prevoznik: '⛴️', valach: '🐑', klaster: '⛪', vcelar: '🐝',
    },

    renderChroniconWindow: function () {
        const el = document.getElementById('library-kraj-content');
        if (!el) return;

        if (typeof ChroniconSystem !== 'undefined') {
            el.innerHTML = ChroniconSystem.renderOverviewHTML('tab');
        } else {
            el.innerHTML = `<div style="text-align:center; padding:40px 20px; opacity:0.6;">
                <div style="font-size:2rem; margin-bottom:10px;">🌫️</div>
                <p><em>Ze světa zatím nedorazila žádná zpráva.</em></p>
            </div>`;
        }
    },

};

// ===============================================
// KATALOGIZACE — Řád bratra Marka (M.A.R.C.), katalogizace-mrd (2.9.2026)
// ===============================================

// INTERAKTIVNÍ KATALOGIZAČNÍ UI & MODÁLY
// ================================================

UI.openCatalogModal = function (bookId, defaultTab) {
    if (!bookId) return;
    const catData = LibraryDB.getBookCatalogData(bookId);
    if (!catData) return;

    const book = LibraryDB.books.find(b => b.id === bookId);
    const lang = (GameState && GameState.settings && GameState.settings.language) || 'cs';
    const isCatalogued = LibraryHelpers.LibraryCatalogSystem.isCatalogued(bookId);
    const record = LibraryHelpers.LibraryCatalogSystem.getCatalogRecord(bookId);

    const activeTab = defaultTab || (isCatalogued ? '1465' : 'measure');

    const modalId = 'catalog-detail-modal';
    let existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(20,15,10,0.82);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;';

    const renderTabsContent = function (tab) {
        if (tab === '1465') {
            // Historický klášterní lístek
            return `
                <div style="background:#f4ecd8;border:2px solid #8b6f3c;padding:20px;border-radius:6px;box-shadow:inset 0 0 15px rgba(139,111,60,0.15);color:#2b1d0c;font-family:serif;">
                    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #8b6f3c;padding-bottom:8px;margin-bottom:14px;align-items:center;">
                        <span style="font-size:1.1rem;font-weight:bold;letter-spacing:1px;">📜 MONASTERIUM OLOMUCENSE • 1465</span>
                        <span style="background:#8b6f3c;color:#fff;padding:3px 8px;border-radius:4px;font-weight:bold;font-size:0.85rem;">${catData.callNumber}</span>
                    </div>

                    <div style="margin-bottom:12px;">
                        <div style="font-size:0.8rem;text-transform:uppercase;color:#7c5f2b;font-weight:bold;">Titulus / Název:</div>
                        <div style="font-size:1.15rem;font-weight:bold;color:#1a0f05;margin-top:2px;">${catData.title}</div>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:14px;background:rgba(139,111,60,0.06);padding:10px;border-radius:4px;">
                        <div>
                            <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Auctor / Původce:</div>
                            <div style="font-weight:bold;">${catData.author}</div>
                        </div>
                        <div>
                            <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Formatum / Archový lom:</div>
                            <div style="font-weight:bold;color:#8b6f3c;">${catData.format.name} (${catData.format.foldDesc})</div>
                        </div>
                        <div>
                            <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Mensura & Folia / Rozměry:</div>
                            <div>${catData.dimensions} • ${catData.folios}</div>
                        </div>
                        <div>
                            <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Vazba & Ochrana:</div>
                            <div>${catData.binding}</div>
                        </div>
                    </div>

                    <div style="margin-bottom:12px;padding:8px 10px;background:rgba(255,255,255,0.6);border-left:3px solid #8b6f3c;font-size:0.85rem;">
                        <strong>Incipit:</strong> <em>"${catData.incipit}"</em><br>
                        <strong>Secundo Folio:</strong> <em>"${catData.secundoFolio}"</em>
                    </div>

                    <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed #8b6f3c;padding-top:10px;font-size:0.8rem;color:#554020;">
                        <div>Regálové uložení: <strong>${record && record.shelfId ? (LibraryDB.shelves[record.shelfId]?.name || record.shelfId) : (record ? '⚠️ nezaloženo (plná police)' : catData.format.shelfName)}</strong></div>
                        <div style="border:2px solid #8b2b2b;color:#8b2b2b;padding:2px 8px;border-radius:3px;font-weight:bold;transform:rotate(-2deg);">
                            ${isCatalogued ? '✓ VERIFICATUM 1465' : 'NEZAEVIDOVÁNO'}
                        </div>
                    </div>
                </div>
            `;
        } else if (tab === 'rda') {
            // "Moderní" rejstřík bratra Marka — vtip schovaný v jméně, ne v textu
            return `
                <div style="background:#202022;border:1px solid #444;padding:18px;border-radius:6px;color:#e0e0e0;font-family:monospace;font-size:0.85rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #555;padding-bottom:8px;margin-bottom:12px;">
                        <span style="color:#60a5fa;font-weight:bold;">REJSTŘÍK BRATRA MARKA</span>
                        <span style="color:#a3e635;background:rgba(163,230,53,0.15);padding:2px 6px;border-radius:3px;">Anno 1465</span>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:8px;line-height:1.4;">
                        <div><strong style="color:#f59e0b;">M.I  </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag084} </div>
                        <div><strong style="color:#f59e0b;">M.II </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag100} <span style="color:#94a3b8;">$e</span> autor</div>
                        <div><strong style="color:#f59e0b;">M.III</strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag245}</div>
                        <div><strong style="color:#f59e0b;">M.IV </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag260}</div>
                        <div><strong style="color:#f59e0b;">M.V  </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag300}</div>
                        <div><strong style="color:#f59e0b;">M.VI </strong> <span style="color:#94a3b8;">$a</span> text </div>
                        <div><strong style="color:#f59e0b;">M.VII</strong> <span style="color:#94a3b8;">$a</span> bez média </div>
                        <div><strong style="color:#f59e0b;">M.VIII</strong> <span style="color:#94a3b8;">$a</span> svazek </div>
                        <div><strong style="color:#f59e0b;">M.IX </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag500}</div>
                        <div><strong style="color:#f59e0b;">M.X  </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag650}</div>
                    </div>

                    <div style="margin-top:14px;border-top:1px solid #444;padding-top:10px;color:#9ca3af;font-size:0.78rem;">
                        💡 Bratr Marek trvá na tom, že tuhle soustavu vymyslel sám, čistě z lásky k pořádku. Nikdo neví proč, ale funguje — a nápadně připomíná něco, co bude mít svět až za pár staletí.
                    </div>
                </div>
            `;
        } else {
            // Měření, formát a regálové uložení
            return `
                <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:16px;border-radius:6px;">
                    <div style="font-weight:bold;font-size:1rem;margin-bottom:8px;color:#fcd34d;">📐 Fyzická inspekce & Formátový regál</div>
                    <div style="font-size:0.85rem;color:#d1d5db;margin-bottom:14px;">
                        Každý svazek v klášterní knihovně je zařazen dle <strong>velikosti a lomu archu</strong>, aby těžká folia nepoškozovala menší traktáty a police unesly jejich váhu.
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:16px;">
                        <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:4px;border-left:3px solid #f59e0b;">
                            <div style="font-size:0.75rem;color:#9ca3af;">Výška hřbetu:</div>
                            <div style="font-size:1.1rem;font-weight:bold;color:#fef3c7;">${catData.dimensions}</div>
                        </div>
                        <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:4px;border-left:3px solid #10b981;">
                            <div style="font-size:0.75rem;color:#9ca3af;">Váha svazku:</div>
                            <div style="font-size:1.1rem;font-weight:bold;color:#d1fae5;">~${catData.weightKg} kg</div>
                        </div>
                        <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:4px;border-left:3px solid #3b82f6;">
                            <div style="font-size:0.75rem;color:#9ca3af;">Doporučený regál:</div>
                            <div style="font-size:0.9rem;font-weight:bold;color:#bfdbfe;">${catData.format.shelfName}</div>
                        </div>
                    </div>

                    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);padding:10px;border-radius:5px;font-size:0.82rem;color:#fde68a;margin-bottom:16px;">
                        📌 <strong>Pravidlo formátového řazení:</strong> ${catData.format.shelvingRule}
                    </div>

                    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                        <button class="craft-btn" style="background:#b45309;color:#fff;border-color:#d97706;padding:8px 14px;font-weight:bold;" onclick="UI.openCataloguingExam('${bookId}')">
                            📇 ${isCatalogued ? 'Přezkoumat a překatalogizovat' : 'Spustit katalogizační zkoušku Armaria'}
                        </button>
                        <button class="craft-btn" style="padding:8px 14px;" onclick="UI.quickShelvePrompt('${bookId}')">
                            🗄️ Přemístit do jiného regálu
                        </button>
                    </div>
                </div>
            `;
        }
    };

    const modalHTML = `
        <div style="background:var(--bg-card, #251d16);border:2px solid var(--accent-gold, #c5a059);border-radius:10px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 12px 30px rgba(0,0,0,0.7);padding:20px;box-sizing:border-box;color:var(--text-main, #eee);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:15px;border-bottom:1px solid rgba(197,160,89,0.3);padding-bottom:10px;">
                <div>
                    <div style="font-size:0.78rem;text-transform:uppercase;color:var(--accent-gold);letter-spacing:1px;">Katalogizační karta svazku</div>
                    <div style="font-size:1.3rem;font-weight:bold;margin-top:2px;">📇 ${catData.title}</div>
                </div>
                <button style="background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer;padding:0 5px;" onclick="document.getElementById('${modalId}').remove()">✕</button>
            </div>

            <!-- Tab Buttons -->
            <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
                <button id="cat-tab-btn-1465" class="craft-btn ${activeTab === '1465' ? 'active' : ''}" style="font-size:0.8rem;padding:5px 10px;" onclick="UI.switchCatalogModalTab('${bookId}', '1465')">
                    📜 Klášterní lístek 1465
                </button>
                <button id="cat-tab-btn-rda" class="craft-btn ${activeTab === 'rda' ? 'active' : ''}" style="font-size:0.8rem;padding:5px 10px;" onclick="UI.switchCatalogModalTab('${bookId}', 'rda')">
                    📇 Rejstřík bratra Marka
                </button>
                <button id="cat-tab-btn-measure" class="craft-btn ${activeTab === 'measure' ? 'active' : ''}" style="font-size:0.8rem;padding:5px 10px;" onclick="UI.switchCatalogModalTab('${bookId}', 'measure')">
                    ⚖️ Měření & Regál (${catData.format.code})
                </button>
            </div>

            <!-- Tab Content -->
            <div id="cat-tab-content-area">
                ${renderTabsContent(activeTab)}
            </div>

            <!-- Footer actions -->
            <div style="margin-top:18px;display:flex;justify-content:flex-end;gap:10px;">
                <button class="craft-btn" style="padding:6px 14px;" onclick="document.getElementById('${modalId}').remove()">Zavřít</button>
            </div>
        </div>
    `;

    overlay.innerHTML = modalHTML;
    document.body.appendChild(overlay);
};

UI.switchCatalogModalTab = function (bookId, tab) {
    const area = document.getElementById('cat-tab-content-area');
    if (!area) return;

    ['1465', 'rda', 'measure'].forEach(t => {
        const btn = document.getElementById(`cat-tab-btn-${t}`);
        if (btn) {
            if (t === tab) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    const catData = LibraryDB.getBookCatalogData(bookId);
    const isCatalogued = LibraryHelpers.LibraryCatalogSystem.isCatalogued(bookId);
    const record = LibraryHelpers.LibraryCatalogSystem.getCatalogRecord(bookId);

    if (tab === '1465') {
        area.innerHTML = `
            <div style="background:#f4ecd8;border:2px solid #8b6f3c;padding:20px;border-radius:6px;box-shadow:inset 0 0 15px rgba(139,111,60,0.15);color:#2b1d0c;font-family:serif;">
                <div style="display:flex;justify-content:space-between;border-bottom:2px solid #8b6f3c;padding-bottom:8px;margin-bottom:14px;align-items:center;">
                    <span style="font-size:1.1rem;font-weight:bold;letter-spacing:1px;">📜 MONASTERIUM OLOMUCENSE • 1465</span>
                    <span style="background:#8b6f3c;color:#fff;padding:3px 8px;border-radius:4px;font-weight:bold;font-size:0.85rem;">${catData.callNumber}</span>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:0.8rem;text-transform:uppercase;color:#7c5f2b;font-weight:bold;">Titulus / Název:</div>
                    <div style="font-size:1.15rem;font-weight:bold;color:#1a0f05;margin-top:2px;">${catData.title}</div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:14px;background:rgba(139,111,60,0.06);padding:10px;border-radius:4px;">
                    <div>
                        <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Auctor / Původce:</div>
                        <div style="font-weight:bold;">${catData.author}</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Formatum / Archový lom:</div>
                        <div style="font-weight:bold;color:#8b6f3c;">${catData.format.name} (${catData.format.foldDesc})</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Mensura & Folia / Rozměry:</div>
                        <div>${catData.dimensions} • ${catData.folios}</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Vazba & Ochrana:</div>
                        <div>${catData.binding}</div>
                    </div>
                </div>
                <div style="margin-bottom:12px;padding:8px 10px;background:rgba(255,255,255,0.6);border-left:3px solid #8b6f3c;font-size:0.85rem;">
                    <strong>Incipit:</strong> <em>"${catData.incipit}"</em><br>
                    <strong>Secundo Folio:</strong> <em>"${catData.secundoFolio}"</em>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed #8b6f3c;padding-top:10px;font-size:0.8rem;color:#554020;">
                    <div>Regálové uložení: <strong>${record && record.shelfId ? (LibraryDB.shelves[record.shelfId]?.name || record.shelfId) : (record ? '⚠️ nezaloženo (plná police)' : catData.format.shelfName)}</strong></div>
                    <div style="border:2px solid #8b2b2b;color:#8b2b2b;padding:2px 8px;border-radius:3px;font-weight:bold;transform:rotate(-2deg);">
                        ${isCatalogued ? '✓ VERIFICATUM 1465' : 'NEZAEVIDOVÁNO'}
                    </div>
                </div>
            </div>
        `;
    } else if (tab === 'rda') {
        area.innerHTML = `
            <div style="background:#202022;border:1px solid #444;padding:18px;border-radius:6px;color:#e0e0e0;font-family:monospace;font-size:0.85rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #555;padding-bottom:8px;margin-bottom:12px;">
                    <span style="color:#60a5fa;font-weight:bold;">REJSTŘÍK BRATRA MARKA</span>
                    <span style="color:#a3e635;background:rgba(163,230,53,0.15);padding:2px 6px;border-radius:3px;">LEADER 01465nam a2200349 c 4500</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;line-height:1.4;">
                    <div><strong style="color:#f59e0b;">M.I  </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag084} </div>
                    <div><strong style="color:#f59e0b;">M.II </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag100} <span style="color:#94a3b8;">$e</span> autor</div>
                    <div><strong style="color:#f59e0b;">M.III</strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag245}</div>
                    <div><strong style="color:#f59e0b;">M.IV </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag260}</div>
                    <div><strong style="color:#f59e0b;">M.V  </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag300}</div>
                    <div><strong style="color:#f59e0b;">M.VI </strong> <span style="color:#94a3b8;">$a</span> text </div>
                    <div><strong style="color:#f59e0b;">M.VII</strong> <span style="color:#94a3b8;">$a</span> bez média </div>
                    <div><strong style="color:#f59e0b;">M.VIII</strong> <span style="color:#94a3b8;">$a</span> svazek </div>
                    <div><strong style="color:#f59e0b;">M.IX </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag500}</div>
                    <div><strong style="color:#f59e0b;">M.X  </strong> <span style="color:#94a3b8;">$a</span> ${catData.marc.tag650}</div>
                </div>
            </div>
        `;
    } else {
        area.innerHTML = `
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:16px;border-radius:6px;">
                <div style="font-weight:bold;font-size:1rem;margin-bottom:8px;color:#fcd34d;">📐 Fyzická inspekce & Formátový regál</div>
                <div style="font-size:0.85rem;color:#d1d5db;margin-bottom:14px;">
                    Každý svazek v klášterní knihovně je zařazen dle <strong>velikosti a lomu archu</strong>, aby těžká folia nepoškozovala menší traktáty a police unesly jejich váhu.
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:16px;">
                    <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:4px;border-left:3px solid #f59e0b;">
                        <div style="font-size:0.75rem;color:#9ca3af;">Výška hřbetu:</div>
                        <div style="font-size:1.1rem;font-weight:bold;color:#fef3c7;">${catData.dimensions}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:4px;border-left:3px solid #10b981;">
                        <div style="font-size:0.75rem;color:#9ca3af;">Váha svazku:</div>
                        <div style="font-size:1.1rem;font-weight:bold;color:#d1fae5;">~${catData.weightKg} kg</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:4px;border-left:3px solid #3b82f6;">
                        <div style="font-size:0.75rem;color:#9ca3af;">Doporučený regál:</div>
                        <div style="font-size:0.9rem;font-weight:bold;color:#bfdbfe;">${catData.format.shelfName}</div>
                    </div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                    <button class="craft-btn" style="background:#b45309;color:#fff;border-color:#d97706;padding:8px 14px;font-weight:bold;" onclick="UI.openCataloguingExam('${bookId}')">
                        📇 ${isCatalogued ? 'Přezkoumat a překatalogizovat' : 'Spustit katalogizační zkoušku Armaria'}
                    </button>
                    <button class="craft-btn" style="padding:8px 14px;" onclick="UI.quickShelvePrompt('${bookId}')">
                        🗄️ Přemístit do jiného regálu
                    </button>
                </div>
            </div>
        `;
    }
};

UI.quickShelvePrompt = function (bookId) {
    const catData = LibraryDB.getBookCatalogData(bookId);
    if (!catData) return;
    const lang = (GameState.settings && GameState.settings.language) || 'cs';

    const shelves = LibraryDB.shelves;
    const shelfState = GameState.library.shelves || {};
    const choices = Object.keys(shelves).map(sKey => {
        const occ = (shelfState[sKey] || []).length;
        const cap = LibraryHelpers.LibraryCatalogSystem.getShelfCapacity(sKey);
        return {
            label: `${shelves[sKey].icon} ${lang === 'en' ? (shelves[sKey].name_en || shelves[sKey].name) : shelves[sKey].name} (${occ}/${cap})`,
            type: 'default',
            effect: () => {
                const res = LibraryHelpers.LibraryCatalogSystem.shelveBook(bookId, sKey);
                UI.notify(res.message, !res.success);
                if (res.success && document.getElementById('catalog-detail-modal')) document.getElementById('catalog-detail-modal').remove();
                UI.renderCatalogTab();
            }
        };
    });

    NotificationSystem.modal({
        icon: '🗄️',
        title: lang === 'en' ? `Shelve "${catData.title}"` : `Založit svazek "${catData.title}"`,
        text: lang === 'en' ? `Choose a shelf or drawer (recommended for this format: ${catData.format.shelfName}).` : `Vyberte polici nebo zásuvku (doporučeno pro tento formát: ${catData.format.shelfName}).`,
        choices: choices,
    });
};

// Interaktivní zkouška katalogizace (Mini-hra)
UI.openCataloguingExam = function (bookId) {
    const catData = LibraryDB.getBookCatalogData(bookId);
    if (!catData) return;

    if (document.getElementById('catalog-detail-modal')) {
        document.getElementById('catalog-detail-modal').remove();
    }

    const examModalId = 'catalog-exam-modal';
    let existing = document.getElementById(examModalId);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = examModalId;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,10,5,0.88);backdrop-filter:blur(5px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;';

    const formats = LibraryDB.formats;
    const categories = LibraryDB.categories;
    const shelves = LibraryDB.shelves;

    // Možnosti pro výběr
    const formatKeys = Object.keys(formats);
    const catKeys = Object.keys(categories);
    const shelfKeys = Object.keys(shelves);
    // UX fix (2.9.2026) — ukázat obsazenost přímo ve výběru, ať hráč vidí
    // plnou polici DŘÍV, než zkoušku odešle, ne až po neúspěchu v razítku.
    const shelfStateForExam = (GameState.library && GameState.library.shelves) || {};

    const examHTML = `
        <div style="background:#261e17;border:2px solid #c5a059;border-radius:10px;max-width:720px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 15px 35px rgba(0,0,0,0.8);padding:22px;box-sizing:border-box;color:#f3eee8;font-family:serif;">
            
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #8b6f3c;padding-bottom:10px;margin-bottom:16px;">
                <div>
                    <span style="font-size:0.75rem;text-transform:uppercase;color:#f59e0b;letter-spacing:1.5px;font-weight:bold;">Katalogizační zkouška Armaria 1465</span>
                    <h3 style="margin:2px 0 0 0;font-size:1.3rem;color:#fef3c7;">📇 Evidence svazku: ${catData.title}</h3>
                </div>
                <button style="background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer;" onclick="document.getElementById('${examModalId}').remove()">✕</button>
            </div>

            <!-- Fyzický náhled a nápověda pro bibliofilské oko -->
            <div style="background:rgba(0,0,0,0.3);border:1px solid #5a4432;border-radius:6px;padding:12px;margin-bottom:16px;font-size:0.85rem;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
                <div style="font-size:2rem;">📖</div>
                <div style="flex:1;">
                    <div style="color:#fcd34d;font-weight:bold;">Fyzická ohledávka na pultu:</div>
                    <div style="color:#d1d5db;margin-top:2px;">
                        Výška hřbetu: <strong>${catData.dimensions}</strong> • Rozsah: <strong>${catData.folios}</strong> • Váha: <strong>~${catData.weightKg} kg</strong><br>
                        Vazba: <em>${catData.binding}</em> • Secundo folio: <em>"${catData.secundoFolio}"</em>
                    </div>
                </div>
            </div>

            <form id="catalog-exam-form" onsubmit="UI.submitCatalogExam(event, '${bookId}')" style="display:flex;flex-direction:column;gap:16px;">
                
                <!-- KROK I: Formát knihy dle archového lomu -->
                <div style="background:rgba(139,111,60,0.1);padding:12px;border-radius:6px;border-left:4px solid #f59e0b;">
                    <label style="display:block;font-weight:bold;font-size:0.92rem;color:#fef3c7;margin-bottom:6px;">
                        I. Urči bibliografický formát (Size-Format) dle výšky a lomu archu:
                    </label>
                    <select id="exam-format" style="width:100%;background:#1c140e;color:#fff;border:1px solid #8b6f3c;padding:8px;border-radius:4px;font-size:0.9rem;" required>
                        <option value="">-- Vyberte formát knihy --</option>
                        ${formatKeys.map(k => `<option value="${k}">${formats[k].name} — ${formats[k].heightRange} (${formats[k].foldDesc})</option>`).join('')}
                    </select>
                </div>

                <!-- KROK II: Autorská autorita (dle bratra Marka) -->
                <div style="background:rgba(139,111,60,0.1);padding:12px;border-radius:6px;border-left:4px solid #3b82f6;">
                    <label style="display:block;font-weight:bold;font-size:0.92rem;color:#fef3c7;margin-bottom:6px;">
                        II. Ověř unifikované autorské záhlaví (dle Markova rejstříku):
                    </label>
                    <input type="text" id="exam-author" value="${catData.author}" style="width:100%;background:#1c140e;color:#fff;border:1px solid #8b6f3c;padding:8px;border-radius:4px;font-size:0.9rem;" required>
                </div>

                <!-- KROK III: Věcný oborový třídník (dle bratra Marka) -->
                <div style="background:rgba(139,111,60,0.1);padding:12px;border-radius:6px;border-left:4px solid #10b981;">
                    <label style="display:block;font-weight:bold;font-size:0.92rem;color:#fef3c7;margin-bottom:6px;">
                        III. Zařaď do klášterního věcného třídníku (dle Markova rejstříku):
                    </label>
                    <select id="exam-category" style="width:100%;background:#1c140e;color:#fff;border:1px solid #8b6f3c;padding:8px;border-radius:4px;font-size:0.9rem;" required>
                        <option value="">-- Vyberte oborovou třídu --</option>
                        ${catKeys.map(k => `<option value="${k}" ${k === catData.category ? 'selected' : ''}>${categories[k].icon} ${categories[k].name} (${categories[k].desc})</option>`).join('')}
                    </select>
                </div>

                <!-- KROK IV: Formátové regálové uložení -->
                <div style="background:rgba(139,111,60,0.1);padding:12px;border-radius:6px;border-left:4px solid #a855f7;">
                    <label style="display:block;font-weight:bold;font-size:0.92rem;color:#fef3c7;margin-bottom:6px;">
                        IV. Zvol správný regál pro bezpečné uložení (Shelving Stacks):
                    </label>
                    <select id="exam-shelf" style="width:100%;background:#1c140e;color:#fff;border:1px solid #8b6f3c;padding:8px;border-radius:4px;font-size:0.9rem;" required>
                        <option value="">-- Vyberte polici nebo skříňku --</option>
                        ${shelfKeys.map(k => {
        const occ = (shelfStateForExam[k] || []).length;
        const cap = LibraryHelpers.LibraryCatalogSystem.getShelfCapacity(k);
        const full = occ >= cap;
        return `<option value="${k}" ${full ? 'disabled' : ''}>${shelves[k].icon} ${shelves[k].name} (${occ}/${cap}${full ? ' — plná' : ''})</option>`;
    }).join('')}
                    </select>
                </div>

                <!-- Tlačítka -->
                <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px;border-top:1px solid #5a4432;padding-top:14px;">
                    <button type="button" class="craft-btn" onclick="document.getElementById('${examModalId}').remove()">Zrušit</button>
                    <button type="submit" class="craft-btn" style="background:#b45309;color:#fff;font-weight:bold;padding:10px 20px;font-size:0.95rem;box-shadow:0 4px 10px rgba(0,0,0,0.4);">
                        📇 Vystavit a orazítkovat katalogizační lístek
                    </button>
                </div>
            </form>
        </div>
    `;

    overlay.innerHTML = examHTML;
    document.body.appendChild(overlay);
};

UI.submitCatalogExam = function (e, bookId) {
    if (e) e.preventDefault();

    const formatSelect = document.getElementById('exam-format');
    const authorInput = document.getElementById('exam-author');
    const catSelect = document.getElementById('exam-category');
    const shelfSelect = document.getElementById('exam-shelf');

    if (!formatSelect || !authorInput || !catSelect || !shelfSelect) return;

    const chosenFormat = formatSelect.value;
    const chosenAuthor = authorInput.value;
    const chosenCat = catSelect.value;
    const chosenShelf = shelfSelect.value;

    const result = LibraryHelpers.LibraryCatalogSystem.submitExam(bookId, chosenFormat, chosenAuthor, chosenCat, chosenShelf);

    if (document.getElementById('catalog-exam-modal')) {
        document.getElementById('catalog-exam-modal').remove();
    }

    // Ochrana proti chybějícímu techu (submitExam vrátí success:false,
    // žádné score/details/ratingTitle) — bez tohohle by šablona níž
    // vypsala "undefined" všude.
    if (!result.success) {
        UI.notify(result.message, true);
        return;
    }

    // Zobrazit slavnostní výsledkové okno s razítkem
    const resModalId = 'catalog-result-modal';
    let existing = document.getElementById(resModalId);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = resModalId;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,5,2,0.85);backdrop-filter:blur(4px);z-index:100001;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;';

    const rankInfo = LibraryHelpers.LibraryCatalogSystem.getCurrentRank();
    // UX fix (2.9.2026, nahlásil Bouvard) — plná police dřív jen jedna
    // věta pohřbená mezi 4 zelenými fajfkami pod slavnostním razítkem;
    // vypadalo to jako úplný úspěch, i když se kniha fyzicky nezaložila.
    // Teď: razítko i nadpis reagují na to, jestli se skutečně založila.
    const notShelved = result.record && !result.record.shelfId;

    const resultHTML = `
        <div style="background:#f4ecd8;border:3px solid #8b6f3c;border-radius:10px;max-width:600px;width:100%;box-shadow:0 15px 40px rgba(0,0,0,0.85);padding:24px;box-sizing:border-box;color:#2b1d0c;font-family:serif;position:relative;">
            
            <!-- Knihovní razítko razítkovací efekt -->
            <div style="position:absolute;top:20px;right:25px;border:3px solid ${notShelved ? '#b45309' : '#991b1b'};color:${notShelved ? '#b45309' : '#991b1b'};padding:6px 14px;font-weight:bold;font-size:1.1rem;letter-spacing:1px;border-radius:6px;transform:rotate(-8deg);box-shadow:0 0 10px rgba(153,27,27,0.2);">
                ${notShelved ? '⚠️ ZAPSÁNO, NEZALOŽENO' : '✓ ZAEVIDOVÁNO 1465'}
            </div>

            <div style="font-size:0.8rem;text-transform:uppercase;color:#7c5f2b;font-weight:bold;letter-spacing:1px;">Výsledek katalogizační zkoušky</div>
            <h2 style="margin:4px 0 12px 0;font-size:1.4rem;color:#1c1106;">📇 ${result.ratingTitle}</h2>

            ${notShelved ? `<div style="background:rgba(180,83,9,0.12);border:2px solid #b45309;padding:10px 14px;border-radius:6px;margin-bottom:14px;font-size:0.88rem;font-weight:bold;color:#7c3a09;">
                ⚠️ Svazek je zapsán v katalogu, ale police byla plná — fyzicky se nezaložil nikam. Najdeš ho v hlavním seznamu Knih (tlačítko 📇), odkud ho po koupi dalšího regálu založíš přes 🗄️.
            </div>` : ''}

            <div style="background:rgba(139,111,60,0.08);border:1px solid #8b6f3c;padding:12px;border-radius:6px;margin-bottom:16px;">
                <div style="font-weight:bold;font-size:0.95rem;margin-bottom:6px;">Hodnocení kritérií (${result.score} / ${result.totalSteps}):</div>
                <ul style="margin:0;padding-left:20px;font-size:0.85rem;line-height:1.5;">
                    ${result.details.map(d => `<li>${d}</li>`).join('')}
                </ul>
            </div>

            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;margin-bottom:16px;text-align:center;">
                <div style="background:rgba(255,255,255,0.7);padding:8px;border-radius:6px;border:1px solid #8b6f3c;">
                    <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Získané XP:</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#b45309;">+${result.expEarned} XP</div>
                </div>
                <div style="background:rgba(255,255,255,0.7);padding:8px;border-radius:6px;border:1px solid #8b6f3c;">
                    <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Výzkum:</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#2563eb;">+${result.researchReward} ⚗️</div>
                </div>
                <div style="background:rgba(255,255,255,0.7);padding:8px;border-radius:6px;border:1px solid #8b6f3c;">
                    <div style="font-size:0.75rem;color:#7c5f2b;font-weight:bold;">Groše z pokladny:</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#15803d;">+${result.groshenReward} 💰</div>
                </div>
            </div>

            <div style="background:#e8dcbe;padding:10px 14px;border-radius:6px;font-size:0.85rem;margin-bottom:18px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:1.6rem;">${rankInfo.current.icon}</span>
                <div>
                    <div>Aktuální hodnost: <strong>${rankInfo.current.title}</strong> (${rankInfo.exp} XP)</div>
                    <div style="font-size:0.75rem;color:#6b5329;margin-top:2px;">Výhoda: ${rankInfo.current.perk}</div>
                </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;">
                <button class="craft-btn" style="padding:6px 12px;" onclick="UI.openCatalogModal('${bookId}', '1465'); document.getElementById('${resModalId}').remove();">
                    📜 Zobrazit hotový lístek
                </button>
                <button class="craft-btn" style="background:#8b6f3c;color:#fff;font-weight:bold;padding:8px 18px;" onclick="document.getElementById('${resModalId}').remove(); UI.renderCatalogTab();">
                    Hotovo
                </button>
            </div>
        </div>
    `;

    overlay.innerHTML = resultHTML;
    document.body.appendChild(overlay);

    UI.renderCatalogTab();
};

// Plnohodnotný dashboard Katalog & Regály (pro záložku v Knihovně)
UI.renderCatalogTab = function () {
    const container = document.getElementById('library-katalog-content');
    if (!container) return;
    const lang = (GameState.settings && GameState.settings.language) || 'cs';

    if (typeof LibraryHelpers !== 'undefined' && typeof LibraryHelpers.checkLibraryUnlocks === 'function') {
        LibraryHelpers.checkLibraryUnlocks();
    }

    // Gate (katalogizace-mrd, 2.9.2026) — bez tech_marc žádný dashboard,
    // jen info karta proč, mirror vzoru z Výpůjček (hasD2/hasC2/hasInternal).
    const hasMarc = GameState.researchedTechs && GameState.researchedTechs.includes('tech_marc');
    if (!hasMarc) {
        container.innerHTML = `<div style="padding:12px 14px;background:rgba(139,111,60,0.06);border:1px solid rgba(197,160,89,0.25);border-radius:6px;opacity:0.8;">
                <div style="font-weight:bold;font-size:0.85rem;margin-bottom:6px;">${lang === 'en' ? '🔒 Cataloguing' : '🔒 Katalogizace'}</div>
                <div style="font-size:0.8rem;">${lang === 'en' ? "Not available yet — research Brother Marek's Order first." : 'Zatím nedostupné — nejdřív vyzkoumej Řád bratra Marka.'}</div>
              </div>`;
        return;
    }

    if (!GameState.library) GameState.library = {};
    if (!GameState.library.unlockedBooks) GameState.library.unlockedBooks = [];

    const rankInfo = LibraryHelpers.LibraryCatalogSystem.getCurrentRank();
    const unlockedIds = GameState.library.unlockedBooks || [];
    const allBooks = LibraryDB.books || [];
    const unlockedBooks = allBooks.filter(b => unlockedIds.includes(b.id));
    const cataloguedBooks = Object.keys(GameState.library.cataloguedBooks || {});
    const cataloguedCount = cataloguedBooks.length;
    const totalCount = unlockedBooks.length;
    const shelves = LibraryDB.shelves || {};
    const shelfKeys = Object.keys(shelves);
    const shelfState = GameState.library.shelves || {};
    const uncataloguedList = unlockedBooks.filter(b => !cataloguedBooks.includes(b.id));

    // Nezaložené (orphan) svazky — zkatalogizované, ale bez shelfId (police
    // byla plná v okamžiku zkoušky, viz TODO(D2)-styl edge case, 2.9.2026,
    // nahlásil Bouvard: "6/46 katalogizováno, na policích jen 5"). Dřív
    // v dashboardu neviditelné — čekací seznam je vyfiltruje (jsou
    // zkatalogizované), v žádné polici nejsou. Teď vlastní sekce.
    const shelvedIds = new Set(Object.values(shelfState).flat());
    const orphanList = unlockedBooks.filter(b => cataloguedBooks.includes(b.id) && !shelvedIds.has(b.id));

    let html = '';

    // Hlavička — hodnost Armaria a stav fondu
    html += `<div style="margin-bottom:16px;padding:14px 16px;background:linear-gradient(90deg,#2c2018,#3d2d22,#2c2018);color:#f3eee8;border:2px solid #5a4432;border-radius:8px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.8rem;">${rankInfo.current.icon}</span>
            <div>
                <div style="font-size:0.7rem;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#e0b566;">${lang === 'en' ? "Armarius's Cataloguing Office 1465 • Brother Marek's Order" : 'Katalogizační kancelář Armaria 1465 • Řád bratra Marka'}</div>
                <div style="font-size:1.05rem;font-weight:bold;">${lang === 'en' ? rankInfo.current.title_en : rankInfo.current.title}</div>
                <div style="font-size:0.72rem;opacity:0.75;">${lang === 'en' ? 'Experience' : 'Zkušenost'}: <strong>${rankInfo.exp} XP</strong> • ${lang === 'en' ? 'Perk' : 'Perk'}: ${rankInfo.current.perk}</div>
            </div>
        </div>
        <div style="text-align:right;">
            <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:#e0b566;">${lang === 'en' ? 'Fond cataloguing status' : 'Stav katalogizace fondu'}</div>
            <div style="font-size:1.15rem;font-weight:bold;">${cataloguedCount} / ${totalCount} ${lang === 'en' ? 'volumes' : 'svazků'}</div>
            <div style="width:140px;height:8px;background:#1a120b;border:1px solid #5a4432;border-radius:6px;overflow:hidden;margin-top:4px;">
                <div style="height:100%;background:#c5a059;width:${totalCount ? (cataloguedCount / totalCount * 100) : 0}%;"></div>
            </div>
        </div>
    </div>`;

    // Čekající svazky
    if (uncataloguedList.length > 0) {
        html += `<div style="margin-bottom:16px;padding:14px 16px;background:rgba(197,160,89,0.1);border:2px solid var(--accent-gold);border-radius:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap;">
                <div style="font-weight:bold;font-size:0.85rem;">📥 ${lang === 'en' ? `Volumes awaiting measurement and cataloguing (${uncataloguedList.length})` : `Svazky čekající na měření a katalogizaci (${uncataloguedList.length})`}</div>
                <span style="font-size:0.72rem;opacity:0.7;font-style:italic;">${lang === 'en' ? 'Each catalogued volume gains +50% fond durability' : 'Každý zkatalogizovaný svazek získá +50 % odolnost fondu'}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
                ${uncataloguedList.slice(0, 6).map(b => {
            const catData = LibraryDB.getBookCatalogData(b.id);
            return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;background:rgba(255,255,255,0.06);border-radius:5px;">
                        <div style="min-width:0;">
                            <div style="font-weight:bold;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.title}</div>
                            <div style="font-size:0.72rem;opacity:0.7;">${b.author || 'Anonymus'} • ${catData.dimensions}</div>
                        </div>
                        <button class="craft-btn" style="font-size:0.72rem;padding:5px 10px;min-width:auto;background:#b45309;color:#fff;" onclick="UI.openCataloguingExam('${b.id}')">📇 ${lang === 'en' ? 'Catalogue' : 'Katalogizovat'}</button>
                    </div>`;
        }).join('')}
            </div>
        </div>`;
    } else {
        html += `<div style="margin-bottom:16px;padding:10px 14px;background:rgba(90,154,90,0.1);border:1px solid #5a9a5a;border-radius:6px;font-size:0.78rem;">
            ✓ ${lang === 'en' ? 'Every available book in the fond is properly catalogued and given a shelfmark!' : 'Všechny dostupné knihy ve fondu jsou řádně zkatalogizovány a opatřeny signaturami!'}
        </div>`;
    }

    // Nezaložené svazky — mirror sekce výš, ale pro knihy, co zkoušku
    // zvládly, jenže cílová police byla plná (2.9.2026, viz komentář u
    // orphanList). Tlačítko rovnou otevře quickShelvePrompt, ne znovu
    // zkoušku.
    if (orphanList.length > 0) {
        html += `<div style="margin-bottom:16px;padding:14px 16px;background:rgba(180,83,9,0.1);border:2px solid #b45309;border-radius:8px;">
            <div style="font-weight:bold;font-size:0.85rem;margin-bottom:10px;">⚠️ ${lang === 'en' ? `Catalogued but unshelved (${orphanList.length}) — the target shelf was full` : `Zkatalogizováno, ale nezaloženo (${orphanList.length}) — cílová police byla plná`}</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
                ${orphanList.map(b => `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;background:rgba(255,255,255,0.06);border-radius:5px;">
                    <div style="font-weight:bold;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.title}</div>
                    <button class="craft-btn" style="font-size:0.72rem;padding:5px 10px;min-width:auto;background:#b45309;color:#fff;" onclick="UI.quickShelvePrompt('${b.id}')">🗄️ ${lang === 'en' ? 'Shelve' : 'Založit'}</button>
                </div>`).join('')}
            </div>
        </div>`;
    }

    // Formátové regály
    html += `<div style="margin-bottom:16px;padding:16px;background:#241a12;color:#f3eee8;border:2px solid #5a4432;border-radius:8px;">
        <div style="margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #5a4432;">
            <div style="font-weight:bold;font-size:0.9rem;">🏛️ ${lang === 'en' ? 'Monastery format shelving (Size-Format Shelving)' : 'Klášterní formátové plutei & regály (Size-Format Shelving)'}</div>
            <div style="font-size:0.72rem;opacity:0.7;margin-top:2px;">${lang === 'en' ? 'Books are ordered by size and sheet fold to protect bindings and shelf load.' : 'Knihy jsou řazeny dle velikosti a lomu archu pro ochranu vazeb a nosnost polic.'}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
            ${shelfKeys.map(sKey => {
        const shelf = shelves[sKey];
        const bookIdsInShelf = shelfState[sKey] || [];
        const booksInShelf = bookIdsInShelf.map(id => LibraryDB.books.find(b => b.id === id)).filter(Boolean);
        const spineColors = { folio: '#78350f', quarto: '#9a3412', octavo: '#1e3a8a', duodecimo: '#065f46' };
        const spineHeights = { folio: 52, quarto: 42, octavo: 34, duodecimo: 26 };
        const effCapacity = LibraryHelpers.LibraryCatalogSystem.getShelfCapacity(sKey);
        const ownedUnits = GameState.inventory['shelf_' + sKey] || 0;
        return `<div style="padding:10px;background:#1c140e;border:1px solid #4a3627;border-radius:6px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:1.2rem;">${shelf.icon}</span>
                            <div>
                                <strong style="font-size:0.82rem;color:#e0b566;">${lang === 'en' ? (shelf.name_en || shelf.name) : shelf.name}</strong>
                                <span style="font-size:0.7rem;opacity:0.65;margin-left:6px;">(${shelf.format.toUpperCase()} • ${shelf.desc})</span>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-size:0.7rem;padding:2px 8px;background:#2e2117;border:1px solid #5a4432;border-radius:4px;color:#e0b566;">${lang === 'en' ? 'Occupied' : 'Obsazeno'}: ${booksInShelf.length} / ${effCapacity}</span>
                            ${ownedUnits > 0 ? `<button class="craft-btn" style="font-size:0.68rem;padding:3px 7px;min-width:auto;" onclick="LibraryHelpers.LibraryCatalogSystem.installShelfUnit('${sKey}');UI.renderCatalogTab();">${lang === 'en' ? 'Install' : 'Instalovat'} (${ownedUnits}×)</button>` : ''}
                        </div>
                    </div>
                    <div style="display:flex;align-items:flex-end;gap:6px;min-height:60px;padding:8px;background:#120c08;border-top:2px solid #3d2b1f;border-radius:4px;overflow-x:auto;">
                        ${booksInShelf.length === 0
                ? `<div style="width:100%;text-align:center;font-size:0.72rem;opacity:0.4;font-style:italic;padding:10px 0;">${lang === 'en' ? 'Shelf is empty — books can be filed here from the catalogue detail.' : 'Police je prázdná — knihy sem můžete založit z detailu katalogu.'}</div>`
                : booksInShelf.map(b => {
                    const catData = LibraryDB.getBookCatalogData(b.id);
                    const isCorrectFormat = catData.format.recommendedShelf === sKey;
                    const spineColor = spineColors[catData.formatKey] || '#4a3627';
                    const spineHeight = spineHeights[catData.formatKey] || 30;
                    return `<div style="position:relative;cursor:pointer;width:30px;height:${spineHeight}px;background:${spineColor};border:1px solid rgba(197,160,89,0.4);border-radius:3px 3px 0 0;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;flex-shrink:0;" onclick="UI.openCatalogModal('${b.id}', '1465')" title="${b.title}">
                                    ${!isCorrectFormat ? '<span style="position:absolute;top:-2px;right:-2px;font-size:0.6rem;">⚠️</span>' : ''}
                                </div>`;
                }).join('')
            }
                    </div>
                </div>`;
    }).join('')}
        </div>
    </div>`;

    // Příručka formátů
    html += `<div style="padding:14px 16px;background:rgba(139,111,60,0.06);border:1px solid rgba(197,160,89,0.25);border-radius:8px;font-size:0.75rem;">
        <div style="font-weight:bold;font-size:0.82rem;margin-bottom:8px;">📖 ${lang === 'en' ? "Armarius's handbook for format cataloguing" : 'Příručka Armaria pro formátovou katalogizaci'}:</div>
        <div style="display:flex;flex-direction:column;gap:5px;">
            <div><strong>📜 2° Folio:</strong> ${lang === 'en' ? '1 sheet fold (height >38 cm). Lectionaries and large theological summae. Lower plutei, up to 14 kg.' : '1 lom archu (výška >38 cm). Kancionály a velké teologické sumy. Patří do spodních plutei a váží až 14 kg.'}</div>
            <div><strong>📕 4° Quarto:</strong> ${lang === 'en' ? '2 sheet folds (height 26–35 cm). Chronicles and herbaria. Middle shelf rows.' : '2 lomy archu (výška 26–35 cm). Formát kronik a herbářů. Střední řady regálů.'}</div>
            <div><strong>📘 8° Octavo:</strong> ${lang === 'en' ? '3 sheet folds (height 16–25 cm). Rules, tracts, daily reading. Upper shelves.' : '3 lomy archu (výška 16–25 cm). Běžné řehole, traktáty a denní četba. Horní police.'}</div>
            <div><strong>📙 12° Duodecimo:</strong> ${lang === 'en' ? '4 sheet folds (height <15 cm). Pocket breviaries and vademeca. Lockable drawers.' : '4 lomy archu (výška <15 cm). Kapesní brevíře a vademeca. Ukládají se do uzamykatelných zásuvek.'}</div>
        </div>
    </div>`;

    container.innerHTML = html;
};

// ===============================================
// NOTEBOOK SYSTEM - LOCAL ONLY (NO CLOUD)
// ===============================================
