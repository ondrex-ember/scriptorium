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
        // kocarnictvi-mrd (19.9.2026): Kolárna migrovala z Cellaria do
        // vlastního Pracovna tabu — refresh teď jde přes UI.renderAll()
        // (_SUBTAB_REFRESH_MAP → home-kolarna-content), mirror ostatních
        // Pracovna dílen, ne přímý cellarium-content outerHTML swap.
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
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
    },

    // ═══ Pracovna tab — render() (kocarnictvi-mrd, 19.9.2026) ═══
    // "B - do PRACOVNY... jako vše podobné... tam se craftuje, opravuje"
    // (Bouvard, 19.9.2026) — celý tier-build panel migrovaný sem 1:1
    // z CellariumSystem (viz git historie/dřívější polnosti-iii-vozovy-
    // park-mrd.md blok, teď odstraněný) PLUS nová Kočárnictví craft UI.
    // Mirror renderKovarnaTab (CellariumSystem.js) v celkové struktuře.
    render: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        let h = `<div style="background:rgba(0,0,0,0.05); padding:14px; border-radius:10px; border-left:3px solid var(--accent-gold); margin-bottom:12px;">
      <h4 style="margin:0 0 8px 0; color:var(--ink-primary);">🛞 ${lang === 'en' ? "Kolárna — the Wheelwright's Workshop" : 'Kolárna'}</h4>
      <div style="font-size:0.82rem; opacity:0.75; font-style:italic;">
        ${lang === 'en'
                ? 'Wheel, axle, bed — carts and wagons first. In time, for those who can afford it, a carriage.'
                : 'Kolo, náprava, korba — nejdřív vozíky a vozy. Časem, pro toho, kdo si to může dovolit, i kočár.'}
      </div>
    </div>`;

        if (!GameState.storage) GameState.storage = {};
        if (!GameState.storage.kolarna) GameState.storage.kolarna = { tier: -1, buildUntil: null, buildTargetTier: null, kolarHireUntil: null, kolarReadyForTier: null };
        const k = GameState.storage.kolarna;
        const tier = (typeof k.tier === 'number') ? k.tier : -1;
        const parcelOwned = GameState.landParcels && GameState.landParcels.kolarensky_dvur && GameState.landParcels.kolarensky_dvur.status === 'owned';

        // ── Vozový park — tier-build progress ──
        h += `<div style="background:rgba(0,0,0,0.03); padding:14px; border-radius:8px; margin-bottom:12px;">`;
        h += `<div style="font-weight:bold; font-size:0.85rem; margin-bottom:8px;">🛞 ${lang === 'en' ? 'Wagon Tiers' : 'Vozový park'}</div>`;
        if (!parcelOwned) {
            h += `<div style="font-size:0.82rem; opacity:0.6; font-style:italic;">${lang === 'en' ? "Requires the Wheelwright's Yard parcel (Cellarium → Land)." : 'Vyžaduje vlastněnou parcelu Kolárenský dvůr (Cellarium → Pozemky).'}</div>`;
        } else if (k.buildUntil) {
            const hoursLeft = Math.max(0, Math.ceil((k.buildUntil - Date.now()) / 3600000));
            const buildingName = lang === 'en' ? this.VOZOVY_PARK_TIERS[k.buildTargetTier].name_en : this.VOZOVY_PARK_TIERS[k.buildTargetTier].name;
            h += `<div style="font-size:0.82rem; opacity:0.7;">⏳ ${lang === 'en' ? `Building ${buildingName}, ~${hoursLeft}h` : `Staví se ${buildingName}, ~${hoursLeft}h`}</div>`;
        } else if (tier >= this.VOZOVY_PARK_TIERS.length - 1) {
            h += `<div style="font-size:0.82rem;">✅ ${lang === 'en' ? "Complete: Merchant's Wagon" : 'Dokončeno: Kupecký vůz'}</div>`;
        } else {
            const next = this.VOZOVY_PARK_TIERS[tier + 1];
            const nextName = lang === 'en' ? next.name_en : next.name;
            const curLabel = tier === -1 ? (lang === 'en' ? 'not started' : 'nezahájeno') : (lang === 'en' ? this.VOZOVY_PARK_TIERS[tier].name_en : this.VOZOVY_PARK_TIERS[tier].name);
            const matsStr = Object.entries(next.materials).map(([id, qty]) => `${qty}× ${(typeof iName === 'function') ? iName(id) : id}`).join(', ');
            h += `<div style="font-size:0.82rem; opacity:0.7; margin-bottom:6px;">${lang === 'en' ? 'Current' : 'Aktuálně'}: ${curLabel} → ${nextName} (${next.cost}g, ${matsStr})</div>`;
            if (next.requiresOxen) {
                const haveOxen = this._liveOxenCount();
                const oxenOk = haveOxen >= next.requiresOxen;
                h += `<div style="font-size:0.76rem; opacity:0.7; margin-bottom:4px;">🐂 ${lang === 'en' ? 'Live oxen' : 'Živí voli'}: <strong style="color:${oxenOk ? '#5a9a5a' : '#c0392b'};">${haveOxen}/${next.requiresOxen}</strong></div>`;
            }
            if (next.requiresHorses) {
                const haveHorses = this._liveHorseCount();
                const horsesOk = haveHorses >= next.requiresHorses;
                h += `<div style="font-size:0.76rem; opacity:0.7; margin-bottom:4px;">🐴 ${lang === 'en' ? 'Live horses' : 'Živí koně'}: <strong style="color:${horsesOk ? '#5a9a5a' : '#c0392b'};">${haveHorses}/${next.requiresHorses}</strong></div>`;
            }
            if (next.needsKolar && k.kolarReadyForTier !== (tier + 1)) {
                if (k.kolarHireUntil) {
                    const kHoursLeft = Math.max(0, Math.ceil((k.kolarHireUntil - Date.now()) / 3600000));
                    h += `<div style="font-size:0.76rem; opacity:0.6; font-style:italic;">🛞 ${lang === 'en' ? `Wheelwright on his way, ~${kHoursLeft}h` : `Kolář na cestě, ~${kHoursLeft}h`}</div>`;
                } else {
                    h += `<button onclick="Game.hireKolar()" class="craft-btn" style="font-size:0.82rem;">🛞 ${lang === 'en' ? `Hire the wheelwright (${this.KOLAR_COST}g)` : `Najmout koláře (${this.KOLAR_COST}g)`}</button>`;
                }
            } else {
                h += `<button onclick="Game.upgradeVozovyParkTier()" class="craft-btn" style="font-size:0.82rem;">🏗️ ${lang === 'en' ? 'Build' : 'Postavit'}</button>`;
            }
        }
        h += `</div>`;

        if (!parcelOwned) return h; // nic dalšího nedává smysl bez dvora

        // ── Kočárnictví — craft UI, gate tier>=3 + tech_kocarnictvi ──
        const techs = GameState.researchedTechs || [];
        if (!techs.includes('tech_kocarnictvi') || tier < 3) {
            h += `<div style="text-align:center; padding:16px; opacity:0.6; border:1px dashed rgba(197,160,89,0.3); border-radius:8px;">
        <div style="font-size:1.6rem; margin-bottom:6px;">🛞</div>
        <div style="font-style:italic; font-size:0.85rem;">
          ${!techs.includes('tech_kocarnictvi')
                    ? (lang === 'en' ? 'Study <strong>Coach-Building</strong> to craft the carriage.' : 'Prostuduj <strong>Kočárnictví</strong> pro stavbu kočáru.')
                    : (lang === 'en' ? "Requires the wagon tiers completed (Merchant's Wagon)." : 'Vyžaduje dokončený Vozový park (Kupecký vůz).')}
        </div>
      </div>`;
            return h;
        }

        h += this._renderKocarnictviCraftList(lang);

        // Hotové kočáry — gift k opatovi (prodej jde přes Trh, viz níž) —
        // kocarnictvi-mrd §4, 19.9.2026, mechanický efekt abbotFavor
        // vědomě odložen (jen syrový counter + Kronika, viz giftCarriageToAbbot).
        const haveCarriage = GameState.inventory.carriage || 0;
        h += `<div style="background:rgba(197,160,89,0.06); padding:12px 14px; border-radius:8px; margin-top:12px;">
      <div style="font-size:0.82rem; margin-bottom:8px;">🛺 ${lang === 'en' ? 'Finished carriages' : 'Hotové kočáry'}: <strong>${haveCarriage}</strong></div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="craft-btn" style="font-size:0.78rem;" ${haveCarriage < 1 ? 'disabled' : ''} onclick="Game.giftCarriageToAbbot()">🎁 ${lang === 'en' ? 'Present to the Abbot' : 'Darovat opatovi'}</button>
      </div>
      <div style="font-size:0.7rem; opacity:0.6; margin-top:6px; font-style:italic;">${lang === 'en' ? 'To sell a carriage, use the Market (Cellarium → Trh) or wait for a nobility commission (Zakázky).' : 'Prodej kočáru přes Trh (Cellarium → Trh), nebo počkej na zakázku od vrchnosti (Zakázky).'}</div>
    </div>`;

        return h;
    },

    _renderKocarnictviCraftList: function (lang) {
        if (typeof RecipesDB === 'undefined') return '';
        const recipes = RecipesDB.filter(r => r.cat === 'kolarna'
            && (!r.locked || (GameState.unlockedRecipes && GameState.unlockedRecipes.includes(r.id))));
        if (!recipes.length) return '';
        let h = `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:var(--accent-gold); opacity:0.85; margin:10px 0 8px;">🛠️ ${lang === 'en' ? 'Coach-Building' : 'Kočárnictví'}</div>`;
        h += `<div style="display:grid; grid-template-columns:1fr; gap:6px;">`;
        recipes.forEach(r => { h += this._renderKocarnictviRecipeRow(r, lang); });
        h += `</div>`;
        return h;
    },

    _renderKocarnictviRecipeRow: function (r, lang) {
        const prod = (typeof ItemsDB !== 'undefined' && ItemsDB[r.output]) || {};
        let can = true;
        let reqStr = '';
        Object.entries(r.req).forEach(([id, amt]) => {
            const has = GameState.inventory[id] || 0;
            const missing = has < amt;
            if (missing) can = false;
            const iN = (typeof iName === 'function') ? iName(id) : id;
            reqStr += `<span style="${missing ? 'color:#b05a3c;' : ''}">${iN} ${has}/${amt}</span> `;
        });
        const label = lang === 'en' ? 'Build' : 'Sestavit';
        return `<div style="display:flex; align-items:center; gap:10px; padding:8px 10px; background:rgba(0,0,0,0.03); border-radius:6px;">
      <div style="font-size:1.3rem;">${prod.icon || '🛞'}</div>
      <div style="flex:1; font-size:0.8rem;"><strong>${lang === 'en' ? (prod.name_en || prod.name) : prod.name}</strong><div style="font-size:0.68rem; opacity:0.75;">${reqStr}</div></div>
      <button class="craft-btn" onclick="Game.craft('${r.id}')" ${can ? '' : 'disabled'}>${label}</button>
    </div>`;
    },

    // Darování kočáru opatovi — spotřebuje 1 carriage, přičte abbotFavor.
    // Přesný mechanický efekt abbotFavor vědomě odložen (kocarnictvi-mrd §4,
    // 19.9.2026, Bouvard: "opat si to bude pamatovat a bude to oceňovat,
    // domyslim později") — zatím jen syrový counter + Kronika zápis, žádná
    // navázaná herní mechanika.
    giftCarriageToAbbot: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if ((GameState.inventory.carriage || 0) < 1) {
            UI.notify(lang === 'en' ? '❌ No finished carriage to present.' : '❌ Žádný hotový kočár k darování.', true);
            return;
        }
        Game.removeItem('carriage', 1);
        if (!GameState.secrets) GameState.secrets = {};
        GameState.secrets.abbotFavor = (GameState.secrets.abbotFavor || 0) + 10;
        Game.save();
        UI.notifyPanel('🛞 ' + (lang === 'en' ? 'The carriage is presented to the abbot.' : 'Kočár je darován opatovi.'), 'success');
        Game.addKronikaEntry('important',
            '🛞 Nový kočár byl slavnostně darován opatovi.',
            '🛞 A new carriage has been ceremonially presented to the abbot.',
            '🛞 Currus novus abbati sollemniter donatus est.');
        if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll();
    },

    // isBuilt() — pro WORKSHOPS_REGISTRY (core/ui.js): "workshop existuje" =
    // Tier 0 (Základy) dokončen. Pracovna TAB samotný je viditelný dřív
    // (gate na tech_kolarstvi, core/ui.js renderAll) — hráč potřebuje vidět
    // tenhle tab, aby Tier 0 vůbec mohl postavit, mirror důvodu, proč se
    // celý tier-build panel migroval sem z Cellaria.
    isBuilt: function () {
        return !!(GameState.storage && GameState.storage.kolarna && typeof GameState.storage.kolarna.tier === 'number' && GameState.storage.kolarna.tier >= 0);
    },
};
