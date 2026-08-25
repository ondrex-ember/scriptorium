// ═══ src/core/managers/SaveManager.js ═══
// Extrakce z game.js (Krok 2 / D1, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Save/Load/Settings. Původně Game.* na řádcích
// 987-1275 (bez _saveHint) + 3322-3411 (HEAD po D2-D5+D9+D12+D10+cleanup).
// init() (89-985, 896 řádků) VěDOMĚ NEEXTRAHOVáN — zůstává orchestrátor
// v game.js (volá se jednou při startu, orchestruje všechny ostatní
// systémy/managery, silně provázané se vším).
// _saveHint (data property, ne metoda) VěDOMĚ NEEXTRAHOVáN — zůstává v
// game.js, protože ho čte/mění i init() a jiné domény mimo tento blok
// přímo (Game._saveHint.actions++ apod.) — přesun by vyžadoval editovat
// kód mimo D1 blok, co je mimo rozsah tohoto kroku. SaveManager na něj
// odkazuje přes Game._saveHint (cross-doménová závislost, jako removeItem).
const SaveManager = {
    // data-save-safety-mrd (25.8.2026) — baseline "kolik pokroku jsme
    // NAČETLI" (počet výzkumů — monotónní, v normální hře nikdy neklesá).
    // Nastaví se JEDNOU, když loading gate zavírá (viz load() níž).
    // undefined = load ještě neproběhl / gate ještě neuzavřen.
    _loadedProgressBaseline: undefined,

    _hideLoadingGate: function () {
        const gate = document.getElementById('save-loading-gate');
        if (gate && gate.style.display !== 'none') {
            gate.style.display = 'none';
            SaveManager._loadedProgressBaseline = (GameState.researchedTechs || []).length;
        }
    },

    _idbOpen: function () {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) { reject('IDB not supported'); return; }
            const req = indexedDB.open('ScriptoriumDB', 1);
            req.onupgradeneeded = function (e) {
                e.target.result.createObjectStore('saves', { keyPath: 'key' });
            };
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    },
    _idbSave: function (data) {
        SaveManager._idbOpen().then(db => {
            const tx = db.transaction('saves', 'readwrite');
            tx.objectStore('saves').put({ key: 'main', data: data, ts: Date.now() });
        }).catch(e => console.warn('IDB save failed:', e));
    },
    _idbLoad: function () {
        return SaveManager._idbOpen().then(db => {
            return new Promise((resolve, reject) => {
                const req = db.transaction('saves', 'readonly').objectStore('saves').get('main');
                req.onsuccess = e => resolve(e.target.result || null);
                req.onerror = e => reject(e.target.error);
            });
        });
    },
    _idbClear: function () {
        SaveManager._idbOpen().then(db => {
            db.transaction('saves', 'readwrite').objectStore('saves').delete('main');
        }).catch(e => console.warn('IDB clear failed:', e));
    },
    _checkSaveHint: function () {
        const h = Game._saveHint;
        const now = Date.now();
        const HINT_COOLDOWN = 10 * 60 * 1000;   // min. 10 min mezi hinty
        const ACTION_WARN = 50;                 // žlutý hint
        const ACTION_URGENT = 100;                // oranžový hint
        const TIME_WARN_MS = 30 * 60 * 1000;    // 30 min bez uložení

        if (now - h.lastHintTime < HINT_COOLDOWN) return;

        const timeSinceSave = h.lastSaveTime > 0 ? now - h.lastSaveTime : 0;
        const urgent = h.actions >= ACTION_URGENT || timeSinceSave >= TIME_WARN_MS;
        const warn = h.actions >= ACTION_WARN;

        if (!urgent && !warn) return;

        h.lastHintTime = now;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const minAgo = h.lastSaveTime > 0 ? Math.floor(timeSinceSave / 60000) : null;
        const timeStr = minAgo !== null
            ? (lang === 'en' ? `${minAgo} min ago` : `před ${minAgo} min`)
            : (lang === 'en' ? 'not yet saved' : 'zatím neuloženo');

        const msg = urgent
            ? (lang === 'en' ? `⚠️ Unsaved progress! Last save: ${timeStr}` : `⚠️ Neuložený postup! Poslední uložení: ${timeStr}`)
            : (lang === 'en' ? `💾 Remember to save! Last save: ${timeStr}` : `💾 Nezapomeň uložit! Poslední uložení: ${timeStr}`);

        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            NotificationSystem.panel(msg, urgent ? 'warning' : 'system');
        }
    },

    save: function () {
        // data-save-safety-mrd (25.8.2026) — pojistka proti přepsání reálnýho
        // postupu čerstvým/resetnutým stavem (viz _loadedProgressBaseline výš).
        // researchedTechs.length je monotónní — v normální hře nikdy neklesá,
        // takže pokles oproti tomu, co jsme při loadu skutečně viděli, je
        // silnej signál něčeho špatnýho (neúplný load, race condition),
        // ne legitimní hráčova akce.
        const _curProgress = (GameState.researchedTechs || []).length;
        const _baseline = SaveManager._loadedProgressBaseline;
        if (_baseline !== undefined && _curProgress < _baseline) {
            console.error(`❌ SAVE BLOCKED — GameState má míň pokroku (${_curProgress} techů), než bylo při loadu (${_baseline}). Vypadá to na neúplně načtenej stav, ne skutečnej reset. Ukládání odmítnuto, ať se nepřepíše reálnej postup.`);
            if (typeof UI !== 'undefined' && UI.notifyPanel) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                UI.notifyPanel('🛑 ' + (lang === 'en'
                    ? 'Save blocked — your progress looks incomplete (fewer techs than were loaded). Reload the page before continuing, or you may lose progress.'
                    : 'Uložení zablokováno — tvůj postup vypadá neúplně (míň techů, než se načetlo). Než budeš pokračovat, obnov stránku (F5), jinak riskuješ ztrátu postupu.'), 'warning');
            }
            return;
        }
        try {
            GameState.lastSeen = Date.now();
            const _sd = JSON.stringify(GameState);
            localStorage.setItem('scriptorium_save_v6_4', _sd);
            SaveManager._idbSave(_sd);
            // Reset save hint counter
            Game._saveHint.actions = 0;
            Game._saveHint.lastSaveTime = Date.now();
            // Update Settings UI
            const _el = document.getElementById('save-last-time');
            if (_el) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                _el.textContent = lang === 'en' ? 'just now' : 'právě teď';
            }
        } catch (e) { }
    },
    // Historický základ — klášter roku 1465 už nějakou dobu stojí, hřbitov
    // ani rajský dvůr by neměly být prázdné od prvního dne. Idempotentní —
    // běží jednou (flag), pak nikdy víc. Přidává k tomu, co už tam je,
    // nepřepisuje. Frekvence: farní úmrtí ~1×/60-100 dní (3 roky zpátky),
    // mnišská/konvršská vzácně ~1×/2-3 roky (odpovídá ERGOT_DEATH_CHANCE).
    _seedHistoricalGraves: function () {
        try {
            if (!GameState.flags) GameState.flags = {};
            if (GameState.flags.historicalGravesSeeded) return;

            if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
            if (!Array.isArray(GameState.cemetery.graves)) GameState.cemetery.graves = [];
            const parishSeed = [
                { surname: 'Novák', days: 1095 }, { surname: 'Dvořák', days: 990 },
                { surname: 'Král', days: 890 }, { surname: 'Procházka', days: 810 },
                { surname: 'Sedlák', days: 720 }, { surname: 'Novotný', days: 640 },
                { surname: 'Malý', days: 560 }, { surname: 'Kovář', days: 480 },
                { surname: 'Krejčí', days: 400 }, { surname: 'Novák', days: 320 },
                { surname: 'Dvořák', days: 240 }, { surname: 'Sedlák', days: 160 },
                { surname: 'Král', days: 90 }, { surname: 'Malý', days: 30 },
            ];
            parishSeed.forEach(g => GameState.cemetery.graves.push({ surname: g.surname, ts: Date.now() - g.days * 86400000 }));

            if (!GameState.rajskyDvur) GameState.rajskyDvur = { graves: [] };
            if (!Array.isArray(GameState.rajskyDvur.graves)) GameState.rajskyDvur.graves = [];
            const cloisterSeed = [
                { name: 'Bratr Metoděj', wasBrother: true, days: 2555 },
                { name: 'Bratr Ondřej', wasBrother: true, days: 1460 },
                { name: 'Konvrš Blažej', wasBrother: false, days: 400 },
            ];
            cloisterSeed.forEach(g => GameState.rajskyDvur.graves.push({
                name: g.name, wasBrother: g.wasBrother, cause: 'ergot_fire', ts: Date.now() - g.days * 86400000
            }));

            // Flag se nastaví AŽ po úspěšném dokončení obou seedů — kdyby něco
            // vybouchlo uprostřed, příště se to jen zkusí znovu (nanejvýš pár
            // duplicitních hrobů, nikdy pád nebo poškození save).
            GameState.flags.historicalGravesSeeded = true;
            SaveManager.save();
            console.log('🪦 Historický základ hřbitova/rajského dvora doplněn (14 + 3 hrobů).');
        } catch (e) {
            // Cokoliv se tu pokazí, save hráče to nesmí ovlivnit — jen zaloguj.
            console.error('⚠️ _seedHistoricalGraves selhalo (neškodné, zbytek loadu pokračuje):', e);
        }
    },

    load: function () {
        function deepMerge(target, source) {
            for (let key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }

        // STEP 1 — synchronous localStorage load (identical behaviour to pre-IDB)
        let lsTs = 0;
        try {
            const data = localStorage.getItem('scriptorium_save_v6_4');
            if (data) {
                const loadedState = JSON.parse(data);
                deepMerge(GameState, loadedState);
                lsTs = loadedState.lastSeen || 0;
                console.log('✅ Save loaded from localStorage');
                SaveManager.syncTechUnlocks();
            }
        } catch (e) {
            console.error('❌ Load error (localStorage):', e);
        }
        SaveManager._seedHistoricalGraves();

        // data-save-safety-mrd (25.8.2026) — gate zavíráme až TEĎ, ne hned.
        // Timeout 4s je pojistka proti věčně visícímu IDB (hráč by jinak
        // zůstal navěky zaseknutý na loading obrazovce) — po timeoutu
        // se pokračuje s tím, co localStorage stihlo načíst, a IDB krok
        // níž dál běží na pozadí a případně GameState ještě doplní.
        let _gateClosed = false;
        const _closeGateOnce = () => {
            if (_gateClosed) return;
            _gateClosed = true;
            SaveManager._hideLoadingGate();
        };
        const _gateTimeout = setTimeout(_closeGateOnce, 4000);

        // STEP 2 — async IDB check: if IDB has newer save, patch GameState + re-render
        SaveManager._idbLoad().then(idbRecord => {
            if (!idbRecord) return;
            const idbTs = idbRecord.ts || 0;
            if (idbTs > lsTs) {
                try {
                    const idbState = typeof idbRecord.data === 'string' ? JSON.parse(idbRecord.data) : idbRecord.data;
                    deepMerge(GameState, idbState);
                    // Sync IDB back to localStorage for next load
                    localStorage.setItem('scriptorium_save_v6_4', typeof idbRecord.data === 'string' ? idbRecord.data : JSON.stringify(idbRecord.data));
                    SaveManager.syncTechUnlocks();
                    SaveManager._seedHistoricalGraves();
                    if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
                    // fireplace-idb-refresh-fix (9.8.2026): renderAll() nevolá
                    // checkEnvironment() — pokud IDB doplnilo novější stav, kde
                    // mezitím (jinde/jindy) dohořel krb, "tma"/mode-frozen a
                    // Rozežehnout overlay se bez tohohle nikdy nezobrazí, dokud
                    // hráč neudělá hard refresh (dieOut() sám to volá správně,
                    // tohle byla jediná chybějící cesta).
                    if (typeof Game.checkEnvironment === 'function') Game.checkEnvironment();
                    console.log('✅ IDB save was newer — patched GameState and re-rendered');
                } catch (e) {
                    console.error('❌ IDB patch error:', e);
                }
            }
        }).catch(e => console.warn('IDB load skipped:', e))
          .finally(() => { clearTimeout(_gateTimeout); _closeGateOnce(); });
    },


    resetSave: function () { if (confirm(t('game.confirmReset'))) { try { localStorage.removeItem('scriptorium_save_v6_4'); SaveManager._idbClear(); } catch (e) { } location.reload(); } },

    // Retroaktivní sync: každý researchnutý tech musí mít své unlocks v unlockedRecipes
    syncTechUnlocks: function () {
        if (!GameState.researchedTechs || typeof TechTree === 'undefined') return;
        if (!GameState.unlockedRecipes) GameState.unlockedRecipes = [];
        let added = 0;
        GameState.researchedTechs.forEach(tid => {
            const tech = TechTree.find(x => x.id === tid);
            if (!tech || !Array.isArray(tech.unlocks)) return;
            tech.unlocks.forEach(u => {
                if (!GameState.unlockedRecipes.includes(u)) {
                    GameState.unlockedRecipes.push(u);
                    added++;
                }
            });
        });
        if (added) console.log(`🔧 syncTechUnlocks: doplněno ${added} chybějících unlocků.`);

        // Retroaktivní fix (13.8.2026): ink_netolicky recept dřív nikde neodemykal
        // modal "Prostudovat" pozůstalost — hráč s netolicky_legacy item už dávno
        // pryč (spotřebován) by se k němu jinak nikdy nedostal. Folio je trvalý
        // příznak, že už studoval.
        if (GameState.scrinium && GameState.scrinium.folios && GameState.scrinium.folios.folio_netolicky_01
            && GameState.scrinium.folios.folio_netolicky_01.found
            && !GameState.unlockedRecipes.includes('ink_netolicky')) {
            GameState.unlockedRecipes.push('ink_netolicky');
            console.log('🔧 syncTechUnlocks: doplněn ink_netolicky (retroaktivně, Netolický už studován).');
        }
    },

    setVolume: function (val) { if (audioSys) audioSys.setVolume(val); },
    setFireVolume: function (val) {
        const volume = parseInt(val) / 100;
        GameState.settings.fireVolume = volume;
        if (audioSys) audioSys.setFireVolume(volume);
        SaveManager.save();
    },
    setMusicEnabled: function (enabled) {
        GameState.settings.musicEnabled = enabled;
        if (audioSys) audioSys.setMusicEnabled(enabled);
        SaveManager.save();
    },
    toggleSound: function () {
        if (audioSys) audioSys.toggleMute();
    },
    setMusicVolume: function (val) {
        const volume = parseInt(val) / 100;
        GameState.settings.musicVolume = volume;
        if (audioSys) audioSys.setMusicVolume(val);
        SaveManager.save();
    },
    setMusicTier: function (tier) {
        tier = parseInt(tier);
        GameState.settings.musicTier = tier;
        if (audioSys) audioSys.switchMusicTier(tier);
        SaveManager.save();
    },
    setTheme: function (themeName) {
        if (themeName === 'auto') {
            GameState.settings.autoTheme = true;
            ThemeSystem.updateAutoTheme();
        } else {
            GameState.settings.autoTheme = false;
            ThemeSystem.applyTheme(themeName);
        }
    },
    setDesignStyle: function (styleName) {
        ThemeSystem.applyDesignStyle(styleName);
    },
    setLanguage: function (lang) {
        if (lang !== 'cs' && lang !== 'en') return;
        const prev = GameState.settings.language || 'cs';
        GameState.settings.language = lang;
        LangSystem.apply(lang);
        Game.checkEnvironment(); // Refresh fireplace/light strings

        // MAGICKÝ TRIK PRO STATICKÉ HTML
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.innerHTML = t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });

        UI.notify(t('notify.langSwitched'));
        Analytics.languageSwitched(prev, lang);
        SaveManager.save();
        UI.renderAll(); // <--- TOTO PŘIDAT!
    },
    setDuration: function (min, btn) {
        GameState.selectedDuration = min;
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        UI.renderActions();
    },
    setMineDuration: function (min, btn) {
        GameState.selectedMineDuration = min;
        document.querySelectorAll('.mine-time-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        UI.renderMineActions();
    },

    exportSave: function () {
        try {
            const saveData = JSON.stringify(GameState, null, 2); // Pretty print
            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `scriptorium_save_${timestamp}.json`;

            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            UI.notify(t('game.saveExportedFile').replace('{file}', filename));
        } catch (e) {
            UI.notify(t('game.saveExportFail'), true);
            console.error('Export error:', e);
        }
    },

    importSave: function (file) {
        if (!file) {
            UI.notify(t('game.saveNoFile'), true);
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const importedData = JSON.parse(e.target.result);

                // Validation - check if it looks like valid save
                if (!importedData.inventory || !importedData.flags) {
                    UI.notify(t('game.saveImportFail'), true);
                    return;
                }

                // Confirm before overwriting
                if (!confirm(t('game.overwriteSave'))) {
                    UI.notify(t('game.saveImportCancelled'));
                    return;
                }

                // Import data
                Object.assign(GameState, importedData);

                // Save to localStorage
                SaveManager.save();

                UI.notify(t('game.successImport'));

                // Auto-refresh after 2 seconds
                setTimeout(() => location.reload(), 2000);

            } catch (e) {
                UI.notify(t('game.errorImport'), true);
                console.error('Import error:', e);
            }
        };

        reader.onerror = function () {
            UI.notify(t('game.errorRead'), true);
        };

        reader.readAsText(file);
    },

    triggerImport: function () {
        // Create hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = function (e) {
            const file = e.target.files[0];
            if (file) {
                SaveManager.importSave(file);
            }
        };

        input.click();
    },
};
