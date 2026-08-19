// ═══ src/core/managers/MillManager.js ═══
// Extrakce z game.js (Krok 2 / D12, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Mlyn (mlynar-vlastni-mlyn-mrd.md). Původně Game.*
// na řádcích 4597–4746 (HEAD po D2-D5+D9+cleanup). Chování beze změny —
// pouze přesun + přepsání this.removeItem -> Game.removeItem
// (cross-doménová závislost na D8/Inventory, ještě needitovaném).
// MILL_TIERS/MILLWRIGHT_COST/MILLWRIGHT_WAIT_MS jsou tady jako
// self-obsažená config data (this. zůstalo beze změny).
const MillManager = {
    // ── VLASTNÍ VODNÍ MLÝN — mlynar-vlastni-mlyn-mrd.md §4.9 (v1.3,
    // 16.8.2026). Mirror FABRICA_TIERS/upgradeFabrica/checkFabricaBuild
    // Complete přesně, jedna podmínka navíc: vlastněná parcela
    // mlynsky_nahon (pozemky-mrd.md §0.1 hard rule). tier: -1 = nic
    // postaveno (na rozdíl od Fabrica, kde tier 0 = Kaple už existuje
    // vždy). Tier 0 (Základy) JEDINÝ implementovanej teď — Tier 1/2
    // (Kolo/Mechanismus, sekerník najímání) čekaj na budoucí krok,
    // data pro ně tady jsou kompletní (§4.4/4.9), jen upgradeMillTier
    // je zatím nepustí dál (viz kontrola níž).
    MILL_TIERS: [
        { name: 'Základy', name_en: 'Foundations', cost: 300, materials: { cut_stone: 100 }, buildDays: 3 },
        { name: 'Kolo', name_en: 'The Wheel', cost: 350, materials: { oak_log_seasoned: 15, iron_ingot: 5 }, buildDays: 5, needsSekernik: true },
        { name: 'Mechanismus', name_en: 'The Mechanism', cost: 350, materials: { plank: 80, iron_ingot: 5 }, buildDays: 7, needsSekernik: true },
    ],

    upgradeMillTier: function () {
        if (typeof CellariumSystem === 'undefined') return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.storage) GameState.storage = {};
        if (!GameState.storage.mill) GameState.storage.mill = { tier: -1, buildUntil: null, buildTargetTier: null, millwrightHireUntil: null, millwrightReadyForTier: null };
        const m = GameState.storage.mill;
        const tier = (typeof m.tier === 'number') ? m.tier : -1;

        // Pozemky hard rule (pozemky-mrd.md §0.1) — bez vlastněný parcely ani Tier 0 nejde.
        const parcelOwned = GameState.landParcels && GameState.landParcels.mlynsky_nahon && GameState.landParcels.mlynsky_nahon.status === 'owned';
        if (!parcelOwned) {
            UI.notify(lang === 'en' ? '❌ Requires the Mill Race parcel (owned).' : '❌ Vyžaduje vlastněnou parcelu Mlýnský náhon.', true);
            return;
        }
        if (tier >= this.MILL_TIERS.length - 1) return;
        if (m.buildUntil) { UI.notify('⚠️ ' + (lang === 'en' ? 'Construction already underway.' : 'Stavba už probíhá.'), true); return; }
        const nextTier = tier + 1;
        const next = this.MILL_TIERS[nextTier];
        // Tier 1/2 potřebujou najatýho sekerníka pro TENHLE konkrétní tier
        // (mlynar-vlastni-mlyn-mrd.md §4.6 — opakovaná akce per fáze, ne
        // trvalej kontakt). Sekerník se najímá zvlášť (Game.hireMillwright).
        if (next.needsSekernik && m.millwrightReadyForTier !== nextTier) {
            UI.notify(lang === 'en' ? '🔨 Hire the millwright for this stage first.' : '🔨 Nejdřív najmi sekerníka na tuhle fázi.', true);
            return;
        }
        if (CellariumSystem.getGrose() < next.cost) { UI.notify('⚠️ ' + (lang === 'en' ? 'Not enough groschen.' : 'Nedostatek grošů.'), true); return; }
        for (const matId in next.materials) {
            if ((GameState.inventory[matId] || 0) < next.materials[matId]) {
                UI.notify('⚠️ ' + (lang === 'en' ? 'Not enough materials.' : 'Nedostatek materiálu.'), true); return;
            }
        }
        CellariumSystem.spendGrose(next.cost);
        for (const matId in next.materials) Game.removeItem(matId, next.materials[matId]);
        if (next.needsSekernik) m.millwrightReadyForTier = null; // spotřebováno, další tier potřebuje novej nájem
        const name = lang === 'en' ? next.name_en : next.name;
        m.buildUntil = Date.now() + next.buildDays * 24 * 60 * 60 * 1000;
        m.buildTargetTier = nextTier;
        Game.save();
        UI.notifyPanel('🏗️ ' + (lang === 'en' ? 'Construction begins: ' : 'Stavba začíná: ') + name + '.', 'success');
        Game.addKronikaEntry('important',
            '🏗️ Mlýn: stavba ' + name + ' zahájena. Potrvá ' + next.buildDays + ' dní.',
            '🏗️ Mill: construction of ' + name + ' begun. Will take ' + next.buildDays + ' days.',
            '🏗️ Mola aedificatur.');
        // mlynar-vlastni-mlyn-mrd.md §4.9 (17.8.2026) — oprava: tahle funkce
        // dřív neměla ŽÁDNEJ render call, klik na "Postavit" vypadal, že nic
        // nedělá (data se měnila, panel ne). Mirror cellarium-content vzoru.
        const _cel1 = document.getElementById('cellarium-content');
        if (_cel1) _cel1.outerHTML = CellariumSystem.renderCellariumContent();
    },

    checkMillBuildComplete: function () {
        if (!(GameState.storage && GameState.storage.mill)) return;
        const m = GameState.storage.mill;
        if (!m.buildUntil || Date.now() < m.buildUntil) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const targetTier = m.buildTargetTier;
        const def = this.MILL_TIERS[targetTier];
        m.tier = targetTier;
        m.buildUntil = null;
        m.buildTargetTier = null;
        const name = lang === 'en' ? def.name_en : def.name;
        Game.save();
        UI.notifyPanel('🏛️ ' + (lang === 'en' ? 'Construction complete: ' : 'Stavba dokončena: ') + name + '.', 'success');
        Game.addKronikaEntry('important',
            '🏛️ Mlýn: ' + name + ' dokončena.',
            '🏛️ Mill: ' + name + ' completed.',
            '🏛️ Mola perfecta est.');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        const _cel2 = document.getElementById('cellarium-content');
        if (_cel2) _cel2.outerHTML = CellariumSystem.renderCellariumContent();
    },

    // Sekerník — najatá práce (mlynar-vlastni-mlyn-mrd.md §4.6, 16.8.2026).
    // Opakovaná akce PER FÁZI stavby, ne trvalej kontakt ani jednorázovka.
    // 100g + 1 den čekání, mirror abbotPetition/Mola timerový vzoru.
    MILLWRIGHT_COST: 100,
    MILLWRIGHT_WAIT_MS: 86400000,

    hireMillwright: function () {
        if (typeof CellariumSystem === 'undefined') return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.storage) GameState.storage = {};
        if (!GameState.storage.mill) GameState.storage.mill = { tier: -1, buildUntil: null, buildTargetTier: null, millwrightHireUntil: null, millwrightReadyForTier: null };
        const m = GameState.storage.mill;
        const tier = (typeof m.tier === 'number') ? m.tier : -1;
        const nextTier = tier + 1;
        const next = this.MILL_TIERS[nextTier];

        if (!next || !next.needsSekernik) {
            UI.notify(lang === 'en' ? '❌ No stage currently needs the millwright.' : '❌ Žádná fáze teď sekerníka nepotřebuje.', true);
            return;
        }
        if (m.millwrightReadyForTier === nextTier) {
            UI.notify(lang === 'en' ? '✅ The millwright is already ready for this stage.' : '✅ Sekerník je na tuhle fázi už připravenej.', true);
            return;
        }
        if (m.millwrightHireUntil) {
            UI.notify('⏳ ' + (lang === 'en' ? 'The millwright is already on his way.' : 'Sekerník už je na cestě.'), true);
            return;
        }
        if (CellariumSystem.getGrose() < this.MILLWRIGHT_COST) {
            UI.notify('⚠️ ' + (lang === 'en' ? 'Not enough groschen.' : 'Nedostatek grošů.'), true);
            return;
        }
        CellariumSystem.spendGrose(this.MILLWRIGHT_COST);
        m.millwrightHireUntil = Date.now() + this.MILLWRIGHT_WAIT_MS;
        m.millwrightHireForTier = nextTier;
        Game.save();
        UI.notifyPanel('🔨 ' + (lang === 'en' ? 'A millwright has been sent for.' : 'Pro sekerníka bylo posláno.'), 'success');
        Game.addKronikaEntry('minor',
            '🔨 Sekerník najat na mlýn.',
            '🔨 A millwright hired for the mill.',
            '🔨 Molendinarius conductus est.');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        const _cel3 = document.getElementById('cellarium-content');
        if (_cel3) _cel3.outerHTML = CellariumSystem.renderCellariumContent();
    },

    checkMillwrightHireComplete: function () {
        if (!(GameState.storage && GameState.storage.mill)) return;
        const m = GameState.storage.mill;
        if (!m.millwrightHireUntil || Date.now() < m.millwrightHireUntil) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        m.millwrightReadyForTier = m.millwrightHireForTier;
        m.millwrightHireUntil = null;
        m.millwrightHireForTier = null;
        Game.save();
        UI.notifyPanel('🔨 ' + (lang === 'en' ? 'The millwright has arrived and is ready to work.' : 'Sekerník dorazil a je připravenej k práci.'), 'success');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        // mlynar-vlastni-mlyn-mrd.md §4.6 (17.8.2026) — oprava: UI.renderAll()
        // sám o sobě needosahuje Cellarium panel obsah (mirror stejná chyba
        // jako startDrying dřív), karta zůstávala zamrzlá na "na cestě".
        const _cel = document.getElementById('cellarium-content');
        if (_cel) _cel.outerHTML = CellariumSystem.renderCellariumContent();
    },
};
