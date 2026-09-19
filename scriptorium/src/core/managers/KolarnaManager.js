// ═══ src/core/managers/KolarnaManager.js ═══
// polnosti-iii-vozovy-park-mrd.md v0.1 (18.9.2026) — Kolárna/Vozový park,
// 7. dílna. Mirror MillManager.js 1:1 v architektuře (tier systém, najatý
// specialista, self-contained config data) — jediné dvě odchylky od
// vzoru jsou requiresOxen/requiresHorses (§4, kontrola ŽIVÝCH zvířat v
// chlévě/stáji, ne vlastnictví budovy — "přísnější, nejsme na začátku
// hry" — Bouvard, 18.9.2026) a chybějící herní efekt na výnos Pole,
// který je vědomě odložený do Fáze 2 (MRD §5, otevřená otázka 4,
// explicitně odloženo).
const KolarnaManager = {
    // tier: -1 = nic postaveno (mirror mill.tier). Tier 0 = Základy
    // (samotná dílna), Tier 1 = první craftovatelná jednotka bez
    // tažného zvířete, Tier 2/3 = těžší povozy s requiresOxen/requiresHorses.
    VOZOVY_PARK_TIERS: [
        { name: 'Základy', name_en: 'Foundations', cost: 400, materials: { cut_stone: 80, plank: 35 }, buildDays: 3 },
        { name: 'Dvoukolá kára', name_en: 'Two-Wheeled Handcart', cost: 250, materials: { plank: 20, iron_ingot: 5, kovani: 3 }, buildDays: 2, needsKolar: true },
        { name: 'Lehký žebřiňák', name_en: 'Light Hay Wagon', cost: 550, materials: { oak_log_seasoned: 18, iron_ingot: 14, rope: 8 }, buildDays: 6, needsKolar: true, requiresOxen: 1 },
        { name: 'Kupecký vůz', name_en: "Merchant's Wagon", cost: 850, materials: { oak_log_seasoned: 30, iron_ingot: 22, rope: 12, leather: 8 }, buildDays: 9, needsKolar: true, requiresHorses: 1 },
    ],

    // Kolik živých volů/koní klášter aktuálně má — čte se ze skutečných
    // chlévů (GameState.cowbyre/stable), NE z vlastnictví budovy. Tier 2
    // (vůl) i Tier 3 (kůň) tak vyžadují SPOTŘEBOVANÉ, žijící zvíře v
    // ohradě v momentě stavby — mirror materiálu, ne mazlíčka (MRD §7.3,
    // rozhodnuto 18.9.2026: "přísnější, nejsme na začátku hry uz").
    _liveOxenCount: function () {
        const st = GameState.cowbyre;
        return (st && Array.isArray(st.animals)) ? st.animals.filter(a => a.type === 'vul').length : 0;
    },
    _liveHorseCount: function () {
        const st = GameState.stable;
        return (st && Array.isArray(st.animals)) ? st.animals.length : 0;
    },

    upgradeVozovyParkTier: function () {
        if (typeof CellariumSystem === 'undefined') return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.storage) GameState.storage = {};
        if (!GameState.storage.kolarna) GameState.storage.kolarna = { tier: -1, buildUntil: null, buildTargetTier: null, kolarHireUntil: null, kolarReadyForTier: null };
        const k = GameState.storage.kolarna;
        const tier = (typeof k.tier === 'number') ? k.tier : -1;

        // Pozemky hard rule (pozemky-mrd.md §0.1, mirror mlynsky_nahon) —
        // bez vlastněné parcely Kolárenský dvůr ani Tier 0 nejde.
        const parcelOwned = GameState.landParcels && GameState.landParcels.kolarensky_dvur && GameState.landParcels.kolarensky_dvur.status === 'owned';
        if (!parcelOwned) {
            UI.notify(lang === 'en' ? '❌ Requires the Wheelwright\'s Yard parcel (owned).' : '❌ Vyžaduje vlastněnou parcelu Kolárenský dvůr.', true);
            return;
        }
        if (tier >= this.VOZOVY_PARK_TIERS.length - 1) return;
        if (k.buildUntil) { UI.notify('⚠️ ' + (lang === 'en' ? 'Construction already underway.' : 'Stavba už probíhá.'), true); return; }
        const nextTier = tier + 1;
        const next = this.VOZOVY_PARK_TIERS[nextTier];
        // Kolář — najatý specialista per fáze stavby (mirror sekerník, §4).
        if (next.needsKolar && k.kolarReadyForTier !== nextTier) {
            UI.notify(lang === 'en' ? '🛞 Hire the wheelwright for this stage first.' : '🛞 Nejdřív najmi koláře na tuhle fázi.', true);
            return;
        }
        // requiresOxen/requiresHorses — živý počet, ne vlastnictví (§4/§7.3).
        if (next.requiresOxen && this._liveOxenCount() < next.requiresOxen) {
            UI.notify(lang === 'en' ? `❌ Requires ${next.requiresOxen} live ox(en) in the byre.` : `❌ Vyžaduje ${next.requiresOxen}× živého vola v chlévě.`, true);
            return;
        }
        if (next.requiresHorses && this._liveHorseCount() < next.requiresHorses) {
            UI.notify(lang === 'en' ? `❌ Requires ${next.requiresHorses} live horse(s) in the stable.` : `❌ Vyžaduje ${next.requiresHorses}× živého koně ve stáji.`, true);
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
        if (next.needsKolar) k.kolarReadyForTier = null; // spotřebováno, další tier potřebuje novej nájem
        const name = lang === 'en' ? next.name_en : next.name;
        k.buildUntil = Date.now() + next.buildDays * 24 * 60 * 60 * 1000;
        k.buildTargetTier = nextTier;
        Game.save();
        UI.notifyPanel('🏗️ ' + (lang === 'en' ? 'Construction begins: ' : 'Stavba začíná: ') + name + '.', 'success');
        Game.addKronikaEntry('important',
            '🏗️ Kolárna: stavba ' + name + ' zahájena. Potrvá ' + next.buildDays + ' dní.',
            '🏗️ Wheelwright\'s Workshop: construction of ' + name + ' begun. Will take ' + next.buildDays + ' days.',
            '🏗️ Officina rotaria aedificatur.');
        const _cel1 = document.getElementById('cellarium-content');
        if (_cel1) _cel1.outerHTML = CellariumSystem.renderCellariumContent();
    },

    checkVozovyParkBuildComplete: function () {
        if (!(GameState.storage && GameState.storage.kolarna)) return;
        const k = GameState.storage.kolarna;
        if (!k.buildUntil || Date.now() < k.buildUntil) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const targetTier = k.buildTargetTier;
        const def = this.VOZOVY_PARK_TIERS[targetTier];
        k.tier = targetTier;
        k.buildUntil = null;
        k.buildTargetTier = null;
        const name = lang === 'en' ? def.name_en : def.name;
        Game.save();
        UI.notifyPanel('🛞 ' + (lang === 'en' ? 'Construction complete: ' : 'Stavba dokončena: ') + name + '.', 'success');
        Game.addKronikaEntry('important',
            '🛞 Kolárna: ' + name + ' dokončena.',
            '🛞 Wheelwright\'s Workshop: ' + name + ' completed.',
            '🛞 Officina rotaria perfecta est.');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        const _cel2 = document.getElementById('cellarium-content');
        if (_cel2) _cel2.outerHTML = CellariumSystem.renderCellariumContent();
    },

    // Kolář — najatá práce (mirror sekerník, mlynar-vlastni-mlyn-mrd.md
    // §4.6). Dražší a delší čekání než sekerník — Kolárna je pozdější,
    // kapitálově náročnější dílna (pending-implementation čísla, 18.9.2026).
    KOLAR_COST: 150,
    KOLAR_WAIT_MS: 86400000,

    hireKolar: function () {
        if (typeof CellariumSystem === 'undefined') return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.storage) GameState.storage = {};
        if (!GameState.storage.kolarna) GameState.storage.kolarna = { tier: -1, buildUntil: null, buildTargetTier: null, kolarHireUntil: null, kolarReadyForTier: null };
        const k = GameState.storage.kolarna;
        const tier = (typeof k.tier === 'number') ? k.tier : -1;
        const nextTier = tier + 1;
        const next = this.VOZOVY_PARK_TIERS[nextTier];

        if (!next || !next.needsKolar) {
            UI.notify(lang === 'en' ? '❌ No stage currently needs the wheelwright.' : '❌ Žádná fáze teď koláře nepotřebuje.', true);
            return;
        }
        if (k.kolarReadyForTier === nextTier) {
            UI.notify(lang === 'en' ? '✅ The wheelwright is already ready for this stage.' : '✅ Kolář je na tuhle fázi už připravenej.', true);
            return;
        }
        if (k.kolarHireUntil) {
            UI.notify('⏳ ' + (lang === 'en' ? 'The wheelwright is already on his way.' : 'Kolář už je na cestě.'), true);
            return;
        }
        if (CellariumSystem.getGrose() < this.KOLAR_COST) {
            UI.notify('⚠️ ' + (lang === 'en' ? 'Not enough groschen.' : 'Nedostatek grošů.'), true);
            return;
        }
        CellariumSystem.spendGrose(this.KOLAR_COST);
        k.kolarHireUntil = Date.now() + this.KOLAR_WAIT_MS;
        k.kolarHireForTier = nextTier;
        Game.save();
        UI.notifyPanel('🛞 ' + (lang === 'en' ? 'A wheelwright has been sent for.' : 'Pro koláře bylo posláno.'), 'success');
        Game.addKronikaEntry('minor',
            '🛞 Kolář najat do Kolárny.',
            '🛞 A wheelwright hired for the workshop.',
            '🛞 Rotarius conductus est.');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        const _cel3 = document.getElementById('cellarium-content');
        if (_cel3) _cel3.outerHTML = CellariumSystem.renderCellariumContent();
    },

    checkKolarHireComplete: function () {
        if (!(GameState.storage && GameState.storage.kolarna)) return;
        const k = GameState.storage.kolarna;
        if (!k.kolarHireUntil || Date.now() < k.kolarHireUntil) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        k.kolarReadyForTier = k.kolarHireForTier;
        k.kolarHireUntil = null;
        k.kolarHireForTier = null;
        Game.save();
        UI.notifyPanel('🛞 ' + (lang === 'en' ? 'The wheelwright has arrived and is ready to work.' : 'Kolář dorazil a je připravenej k práci.'), 'success');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
        const _cel = document.getElementById('cellarium-content');
        if (_cel) _cel.outerHTML = CellariumSystem.renderCellariumContent();
    },
};
