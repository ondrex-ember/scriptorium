const LangSystem = {
    apply: function(lang) {
        const L = STRINGS[lang] || STRINGS.cs;

        // 1. html[lang] attribute
        document.documentElement.lang = lang;

        // 2. Nav buttons — zachovat icon <span>, nahradit text
        const navMap = { 'nav-home':L.nav.home, 'nav-garden':L.nav.garden, 'nav-craft':L.nav.craft, 'nav-inv':L.nav.inv, 'nav-lore':L.nav.lore, 'nav-library':L.nav.library };
        Object.entries(navMap).forEach(([id, text]) => {
            const el = document.getElementById(id);
            if (!el) return;
            const icon = el.querySelector('span');
            el.innerHTML = (icon ? icon.outerHTML : '') + text;
        });

        // 3. Screen h2 headers
        ['home','garden','craft','inv','lore','library','settings'].forEach(name => {
            const screen = document.getElementById('screen-' + name);
            if (!screen) return;
            const h2 = screen.querySelector('h2');
            if (h2) h2.textContent = L.screens[name] || h2.textContent;
        });

        // 4. Settings — language card label
        const langLabel = document.getElementById('lang-selector-label');
        if (langLabel) langLabel.textContent = L.settings.langLabel;

        // 5. Meta tags
        document.title = L.meta.title;
        [
            ['meta[name="description"]',        'content',   L.meta.desc],
            ['meta[property="og:title"]',        'content',   L.meta.title],
            ['meta[property="og:description"]',  'content',   L.meta.desc],
            ['meta[property="og:locale"]',       'content',   L.meta.ogLocale],
            ['meta[name="twitter:title"]',       'content',   L.meta.title],
            ['meta[name="twitter:description"]', 'content',   L.meta.desc]
        ].forEach(([sel, attr, val]) => {
            const el = document.querySelector(sel);
            if (el) el.setAttribute(attr, val);
        });

        // 6. URL param — bez reloadu
        const url = new URL(window.location.href);
        if (lang === 'en') { url.searchParams.set('lang', 'en'); }
        else               { url.searchParams.delete('lang'); }
        window.history.replaceState({}, '', url.toString());

        // 7. Sync settings selector
        const sel = document.getElementById('lang-selector');
        if (sel) sel.value = lang;

        // 8. Fireplace text (cold state) + light source buttons
        if (typeof GameState !== 'undefined') {
            const fpTitle = document.getElementById('fireplace-title');
            const fpDesc  = document.getElementById('fireplace-desc');
            const btnIgnite = document.getElementById('btn-ignite');
            if (!GameState.flags.fireplaceLit) {
                if (fpTitle)   fpTitle.innerText   = L.fireplace.cold;
                if (fpDesc)    fpDesc.innerText     = L.fireplace.coldDesc;
                if (btnIgnite) btnIgnite.textContent = L.fireplace.kindle;
            }
            const btnTorch  = document.getElementById('btn-light-torch');
            const btnCandle = document.getElementById('btn-light-candle');
            if (btnTorch)  btnTorch.textContent  = L.light.btnTorch;
            if (btnCandle) btnCandle.textContent = L.light.btnCandle;
        }

        // 9. Filter buttons — craft, inv, lore tabs, library tabs
        const filterMap = {
            'craft-filter-all':       L.craft.filterAll,
            'craft-filter-tool':      L.craft.filterTool,
            'craft-filter-mat':       L.craft.filterMat,
            'craft-filter-food':      L.craft.filterFood,
            'craft-filter-alch':      L.craft.filterAlchemy,
            'craft-filter-lore':      L.craft.filterLore,
            'inv-filter-all':         L.inv.filterAll,
            'inv-filter-mat':         L.inv.filterMat,
            'inv-filter-tool':        L.inv.filterTool,
            'inv-filter-lore':        L.inv.filterLore,
            'lore-tab-research':      L.lore.tabResearch,
            'lore-tab-codex':         L.lore.tabCodex,
            'lore-tab-notebooks':     L.lore.tabNotebooks,
            'lore-tab-achievements':  L.lore.tabAchievements,
            'lib-tab-books':          L.library.tabBooks,
            'lib-tab-records':        L.library.tabRecords,
            'lib-tab-iching':         L.library.tabIching,
            'lib-tab-news':           L.library.tabNews,
        };
        Object.entries(filterMap).forEach(([id, text]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        });

        // 10. Generic data-i18n sweep — pokryje všechny elementy automaticky
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val && val !== key) el.innerHTML = val;
        });
    }
};