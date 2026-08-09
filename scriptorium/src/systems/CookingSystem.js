// ═══════════════════════════════════════════════════════════════════════════
// COOKING SYSTEM v1 — Vaření (subtab Pracovna, vedle Sběr/Těžba)
// udirna-mrd (7.8.2026). Mirror DryingSystem.js architektury (viz tam) —
// instance-based, data-driven COOK_TYPES, self-guarded tick.
// Rozšíření na budoucí recepty = jen další řádek v COOK_TYPES, žádný nový kód.
// DryingSystem.js zůstává nedotčený — Vaření tab renderuje oba systémy
// vedle sebe na UI úrovni, ne sloučené na úrovni dat.
// ═══════════════════════════════════════════════════════════════════════════

const CookingSystem = {

    HOUR_MS: 60 * 60 * 1000,
    TICK_GUARD_MS: 5 * 60 * 1000, // 5 min — kratší než DryingSystem (naše časy jsou v hodinách, ne dnech)

    // coquina-tier1-mrd (7.8.2026): needsTech přidán ke KAŽDÉMU receptu —
    // salting patří Tier 1 (Ruralia Commoda odemyká oboje, nasolování i
    // pasivní uzení), cured_* zůstává Tier 3 (Udírna). Dva tiery, jeden
    // sdílený mezikrok (salted_pork/salted_beef).
    COOK_TYPES: {
        // coquina-tier2-mrd (7.8.2026): "vylepšené solné kádě" z knihy —
        // s tech_tacuinum_sanitatis se solení zrychlí 8h→5h. Viz _effectiveDuration().
        salted_pork: { input: 'pork', inputQty: 1, saltQty: 2, needsTool: ['barrel_tool'],
            needsTech: 'tech_ruralia_meat', output: 'salted_pork', durationH: 8,
            fastDurationH: 5, fastTech: 'tech_tacuinum_sanitatis' },
        salted_beef: { input: 'beef', inputQty: 1, saltQty: 2, needsTool: ['barrel_tool'],
            needsTech: 'tech_ruralia_meat', output: 'salted_beef', durationH: 8,
            fastDurationH: 5, fastTech: 'tech_tacuinum_sanitatis' },
        // Tier 1 — přes existující Ohniště, žádná stavba, pomalu (24h),
        // horší výsledek (smoked_meat_home, decay 0.05) než Tier 3.
        smoked_home_pork: { input: 'salted_pork', inputQty: 1,
            needsTech: 'tech_ruralia_meat', output: 'smoked_meat_home', durationH: 24 },
        smoked_home_beef: { input: 'salted_beef', inputQty: 1,
            needsTech: 'tech_ruralia_meat', output: 'smoked_meat_home', durationH: 24 },
        // Tier 2 — Černá kuchyně/Soplouch, rychlejší (20h) a lepší
        // (smoked_meat_chimney, decay 0.02) než holé Ohniště, pořád ne
        // tak dobré jako Udírna. Žádné dřevo navíc (soplouch svede kouř sám).
        smoked_chimney_pork: { input: 'salted_pork', inputQty: 1,
            needsBuild: 'cerna_kuchyne', needsTech: 'tech_tacuinum_sanitatis', output: 'smoked_meat_chimney', durationH: 20 },
        smoked_chimney_beef: { input: 'salted_beef', inputQty: 1,
            needsBuild: 'cerna_kuchyne', needsTech: 'tech_tacuinum_sanitatis', output: 'smoked_meat_chimney', durationH: 20 },
        // Tier 3 — Udírna, dřevo, rychlejší (16h), plná imunita (decay 0.005).
        cured_meat: { input: 'salted_pork', inputQty: 1, needsItem: 'log', needsItemQty: 2,
            needsBuild: 'udirna', needsTech: 'tech_udirna', output: 'cured_meat', durationH: 16 },
        cured_beef: { input: 'salted_beef', inputQty: 1, needsItem: 'log', needsItemQty: 2,
            needsBuild: 'udirna', needsTech: 'tech_udirna', output: 'cured_beef', durationH: 16 },
        // coquina-tier4-mrd (7.8.2026): panská kuchyně (Platina). Mezikroky
        // rychlé (drcení v hmoždíři), vlajkový recept pomalejší a propojuje
        // 3 systémy najednou (Udírna+koření+sádlo) přes nový extraInputs.
        almond_paste: { input: 'almond', inputQty: 3,
            needsBuild: 'velky_hmozdir', needsTech: 'tech_platina_honesta', output: 'almond_paste', durationH: 1 },
        ground_spice: { input: 'pepr_cerny', inputQty: 2,
            needsBuild: 'velky_hmozdir', needsTech: 'tech_platina_honesta', output: 'ground_spice', durationH: 1 },
        pork_pie_abbot: { input: 'cured_meat', inputQty: 3, extraInputs: { flour: 2, ground_spice: 1, lard: 1 },
            needsBuild: 'rozen', needsTech: 'tech_platina_honesta', output: 'pork_pie_abbot', durationH: 6,
            influenceGain: { axis: 'church', amount: 8 } },
        // coquina-tier1-mrd (7.8.2026): první ze 23 receptů — rychlá kaše,
        // žádná stavba, gate na stejný tech jako zbytek Tier 1.
        pohanka_s_cesnekem: { input: 'pohanka', inputQty: 1, extraInputs: { garlic: 1, linseed_oil: 1 },
            needsTech: 'tech_ruralia_meat', output: 'pohanka_s_cesnekem', durationH: 1 },
        // coquina-tier1-mrd (7.8.2026): druhý ze 23 receptů. Fermentace
        // (48h, skutečný kvasný proces) + rychlá polévka z hotových surovin.
        sauerkraut: { input: 'cabbage', inputQty: 2, saltQty: 1,
            needsTech: 'tech_ruralia_meat', output: 'sauerkraut', durationH: 48 },
        zelnacka_s_kroupami: { input: 'sauerkraut', inputQty: 1, extraInputs: { kroupy: 2 },
            needsTech: 'tech_ruralia_meat', output: 'zelnacka_s_kroupami', durationH: 1 },
        // coquina-tier1-mrd (7.8.2026): poslední 4 recepty Úrovně 1, žádná
        // nová surovina, vše mirror pohanka_s_cesnekem vzoru (rychlé, žádná stavba).
        pucalka: { input: 'peas', inputQty: 2,
            needsTech: 'tech_ruralia_meat', output: 'pucalka', durationH: 1 },
        ovesna_kase: { input: 'oats', inputQty: 2, saltQty: 1,
            needsTech: 'tech_ruralia_meat', output: 'ovesna_kase', durationH: 1 },
        cibulova_jicha: { input: 'onion', inputQty: 2, extraInputs: { bread: 1 },
            needsTech: 'tech_ruralia_meat', output: 'cibulova_jicha', durationH: 1 },
        placky_z_popela: { input: 'flour', inputQty: 2,
            needsTech: 'tech_ruralia_meat', output: 'placky_z_popela', durationH: 1 },
        // coquina-tier2-mrd (7.8.2026): Úroveň 2, žádná nová stavba potřeba
        vajecna_jicha: { input: 'egg', inputQty: 2, extraInputs: { vinegar: 1, bread: 1 },
            needsTech: 'tech_ruralia_meat', output: 'vajecna_jicha', durationH: 1 },
        stika_s_maslem: { input: 'stika', inputQty: 1, extraInputs: { butter: 1 },
            needsTech: 'tech_ruralia_meat', output: 'stika_s_maslem', durationH: 1 },
        // coquina-tier2-dopocet-mrd (9.8.2026): zbylé 4 z 23-seznamu (Starý
        // Pepřovník zůstává blokovaný na Furnus, viz plánovací MRD bod 7).
        // Stejný tech gate jako sourozenci výše — tech_ruralia_meat, MRD
        // "Tier 2" značka je jen historicko-tematická, ne nový tech strom.
        pecena_slanecka: { input: 'slany_sled', inputQty: 2, needsTool: ['cooking_pot'],
            needsTech: 'tech_ruralia_meat', output: 'pecena_slanecka', durationH: 1 },
        repny_prejt: { input: 'turnip', inputQty: 2, extraInputs: { kroupy: 2, fat: 1 }, needsTool: ['cooking_pot'],
            needsTech: 'tech_ruralia_meat', output: 'repny_prejt', durationH: 1.5 },
        raci_s_koprem: { input: 'crayfish', inputQty: 3, extraInputs: { beer: 1, kopr: 1, salt: 1 }, needsTool: ['cooking_pot'],
            needsTech: 'tech_ruralia_meat', output: 'raci_s_koprem', durationH: 1.5 },
        // tvaroh — mléko srazené bez syřidla (mirror syrečky koncept z
        // cheese-system-reference.md), vlastní gate tech_caseus (Sýrárna
        // znalost), ne Coquina strom — tvarohove_tasticky pak potřebuje obojí.
        tvaroh: { input: 'milk', inputQty: 3, needsTool: ['cooking_pot'],
            needsTech: 'tech_caseus', output: 'tvaroh', durationH: 0.5 },
        tvarohove_tasticky: { input: 'tvaroh', inputQty: 2, extraInputs: { flour: 2, egg: 1 }, needsTool: ['cooking_pot'],
            needsTech: 'tech_ruralia_meat', output: 'tvarohove_tasticky', durationH: 1 },
        // coquina-migrace-mrd (7.8.2026): Fáze 1 migrace existujících receptů
        // z Výroby. ID MUSÍ sedět s RecipesDB id (Game.craft() redirect podle
        // shody). Žádné needsTech — spoléhá na vlastní starší RecipesDB unlock,
        // ne na Coquina strom. Čaj jako kotva časování — 20 min (7.8.2026 revize).
        herbal_tea: { input: 'chamomile', inputQty: 1, extraInputs: { water: 1 }, needsTool: ['cooking_pot'],
            output: 'herbal_tea', durationH: 0.333 },
        herbal_tea_alt: { input: 'thyme', inputQty: 1, extraInputs: { water: 1 }, needsTool: ['cooking_pot'],
            output: 'herbal_tea_alt', durationH: 0.333 },
        hildegard_tisane: { input: 'chamomile', inputQty: 1, extraInputs: { thyme: 1, honey: 1, water: 1 }, needsTool: ['cooking_pot'],
            output: 'hildegard_tisane', durationH: 0.333 },
        linden_tea: { input: 'linden_blossom', inputQty: 1, extraInputs: { water: 1 }, needsTool: ['cooking_pot'],
            output: 'linden_tea', durationH: 0.333 },
        kroupy: { input: 'barley', inputQty: 3, outputQty: 2,
            output: 'kroupy', durationH: 0.417 },
        // coquina-migrace-mrd (7.8.2026): Fáze 2 — jednoduché pečení/pražení,
        // věrná migrace stávajících RecipesDB receptů (žádné nové needsTool
        // přidané navíc, i tam kde popis mluví o hmoždíři/peci ale req ho
        // nevyžadoval). cattail_root_flour output je "couch_grass_flour" už
        // ve stávajících datech (pravděpodobný překlep) — zachováno věrně.
        frog_legs_prep: { input: 'frog', inputQty: 1, output: 'frog_legs', durationH: 0.5 },
        burdock_root_baked: { input: 'burdock_root', inputQty: 2, output: 'burdock_root_baked', durationH: 0.5 },
        couch_grass_flour: { input: 'couch_grass', inputQty: 3, output: 'couch_grass_flour', durationH: 0.5 },
        cattail_root_flour: { input: 'cattail_root', inputQty: 3, output: 'couch_grass_flour', durationH: 0.5 },
        famine_bread: { input: 'acorn', inputQty: 2, extraInputs: { beechnut: 2 }, needsTool: ['pestle'],
            output: 'famine_bread', durationH: 0.5 },
        dried_wild_fruit: { input: 'wild_fruit', inputQty: 2, extraInputs: { cornel_cherry: 1 }, output: 'dried_wild_fruit', durationH: 0.5 },
        sloe_jam: { input: 'sloe', inputQty: 3, needsTool: ['cooking_pot'], output: 'sloe_jam', durationH: 0.5 },
        acorn_roasted: { input: 'acorn', inputQty: 2, needsTool: ['cooking_pot'], output: 'acorn_roasted', durationH: 0.5 },
        chicory_roasted: { input: 'roots', inputQty: 2, needsTool: ['cooking_pot'], output: 'chicory_roasted', durationH: 0.5 },
        // Žaludovka/Cikorka — druhý krok, 15 min (zadáno explicitně)
        acorn_brew: { input: 'acorn_roasted', inputQty: 1, extraInputs: { water: 1 }, needsTool: ['cooking_pot'],
            output: 'acorn_brew', durationH: 0.25 },
        chicory_drink: { input: 'chicory_roasted', inputQty: 1, extraInputs: { water: 1 }, needsTool: ['cooking_pot'],
            output: 'chicory_drink', durationH: 0.25 },
        // coquina-migrace-mrd (7.8.2026): Fáze 3 — jednoduché maso, 1 surovina + hrnec
        cooked_meat: { input: 'meat', inputQty: 1, needsTool: ['cooking_pot'], output: 'cooked_meat', durationH: 0.75 },
        cooked_beef: { input: 'beef', inputQty: 1, needsTool: ['cooking_pot'], output: 'cooked_beef', durationH: 0.75 },
        cooked_mutton: { input: 'mutton', inputQty: 1, needsTool: ['cooking_pot'], output: 'cooked_mutton', durationH: 0.75 },
        cooked_chicken: { input: 'chicken_meat', inputQty: 1, needsTool: ['cooking_pot'], output: 'cooked_chicken', durationH: 0.75 },
        cooked_rabbit: { input: 'rabbit_meat', inputQty: 1, needsTool: ['cooking_pot'], output: 'cooked_rabbit', durationH: 0.75 },
        cooked_fish: { input: 'fish', inputQty: 1, needsTool: ['cooking_pot'], output: 'cooked_fish', durationH: 0.75 },
        // navazuje na frog_legs_prep (Fáze 2) — druhý krok
        frog_legs_fried: { input: 'frog_legs', inputQty: 2, extraInputs: { fat: 1, garlic: 1 }, needsTool: ['cooking_pot'],
            output: 'frog_legs_fried', durationH: 1 },
        // coquina-migrace-mrd (7.8.2026): Fáze 4 — dvoukroková jídla, navazují na Fázi 3
        roast_beef: { input: 'cooked_beef', inputQty: 1, extraInputs: { onion: 1 }, needsTool: ['cooking_pot'],
            output: 'roast_beef', durationH: 1 },
        braised_beef: { input: 'cooked_beef', inputQty: 1, extraInputs: { carrot: 1 }, needsTool: ['cooking_pot'],
            output: 'braised_beef', durationH: 1 },
        roast_rabbit_dish: { input: 'cooked_rabbit', inputQty: 1, extraInputs: { carrot: 1, cabbage: 1 }, needsTool: ['cooking_pot'],
            output: 'roast_rabbit_dish', durationH: 1 },
        // coquina-migrace-mrd (7.8.2026): Fáze 5 — polévky/dušená jídla, víc surovin
        stew: { input: 'meat', inputQty: 1, extraInputs: { carrot: 1, turnip: 1, water: 1 }, needsTool: ['cooking_pot'],
            output: 'stew', durationH: 1.5 },
        stew_koreni: { input: 'meat', inputQty: 1, extraInputs: { carrot: 1, turnip: 1, water: 1, pepr_cerny: 1 }, needsTool: ['cooking_pot'],
            output: 'stew_koreni', durationH: 1.5 },
        mushroom_soup: { input: 'mushroom', inputQty: 2, extraInputs: { onion: 1, water: 1 }, needsTool: ['cooking_pot'],
            output: 'mushroom_soup', durationH: 1.5 },
        spring_herb_porridge: { input: 'nettle', inputQty: 1, extraInputs: { ground_elder: 1, goosefoot: 1, oats: 1 }, needsTool: ['cooking_pot'],
            output: 'spring_herb_porridge', durationH: 1.5 },
        rosehip_sauce: { input: 'rosehip', inputQty: 3, extraInputs: { bread: 1 }, needsTool: ['cooking_pot'],
            output: 'rosehip_sauce', durationH: 1.5 },
        crayfish_boiled: { input: 'crayfish', inputQty: 3, extraInputs: { beer: 1 }, needsTool: ['cooking_pot'],
            output: 'crayfish_boiled', durationH: 1.5 },
        snails_black_sauce: { input: 'snail', inputQty: 4, extraInputs: { bread: 1, honey: 1, fat: 1 }, needsTool: ['cooking_pot'],
            output: 'snails_black_sauce', durationH: 1.5 },
        morel_stuffed: { input: 'morel', inputQty: 3, extraInputs: { bread: 1, garlic: 1, fat: 1 }, needsTool: ['cooking_pot'],
            output: 'morel_stuffed', durationH: 1.5 },
        smazenice: { input: 'mushroom', inputQty: 3, extraInputs: { onion: 1, egg: 2 }, needsTool: ['cooking_pot'],
            output: 'smazenice', durationH: 1.5 },
        // coquina-migrace-mrd (7.8.2026): Fáze 6 — nakládání, delší proces (mirror sauerkraut)
        pickled_mushrooms: { input: 'saffron_milk_cap', inputQty: 2, extraInputs: { porcini: 1 }, needsTool: ['barrel_tool'],
            output: 'pickled_mushrooms', durationH: 24 },
        // coquina-migrace-mrd (7.8.2026): Fáze 7 (poslední) — pečivo, pečení
        // trvá nejdéle. bread/bread_fine/bread_fine_1 mají outputQty:2
        // (stejné jako stávající recepty). 7 variant, ne 6 (dodatečně
        // nalezené berry_pie_koreni při auditu).
        bread: { input: 'fiber', inputQty: 3, extraInputs: { water: 1 }, needsTool: ['cooking_pot'],
            output: 'bread', outputQty: 2, durationH: 2 },
        bread_fine: { input: 'flour_2', inputQty: 3, extraInputs: { water: 1 }, needsTool: ['cooking_pot'],
            output: 'bread_fine', outputQty: 2, durationH: 2 },
        bread_fine_1: { input: 'flour_1', inputQty: 3, extraInputs: { water: 1 }, needsTool: ['cooking_pot'],
            output: 'bread_fine_1', outputQty: 2, durationH: 2 },
        berry_pie: { input: 'berries', inputQty: 3, extraInputs: { honey: 1 }, needsTool: ['cooking_pot'],
            output: 'berry_pie', durationH: 1.5 },
        berry_pie_koreni: { input: 'berries', inputQty: 3, extraInputs: { honey: 1, skorice: 1 }, needsTool: ['cooking_pot'],
            output: 'berry_pie_koreni', durationH: 1.5 },
        berry_pie_fine: { input: 'flour_2', inputQty: 2, extraInputs: { berries: 3, honey: 1 }, needsTool: ['cooking_pot'],
            output: 'berry_pie_fine', durationH: 1.5 },
        berry_pie_fine_1: { input: 'flour_1', inputQty: 2, extraInputs: { berries: 3, honey: 1 }, needsTool: ['cooking_pot'],
            output: 'berry_pie_fine_1', durationH: 1.5 },
    },

    // coquina-tier1-mrd: tab je vidět, jakmile hráč má ASPOŇ jeden tier —
    // jednotlivé recepty se pak filtrují zvlášť podle vlastního needsTech.
    // coquina-vyroba-modal-mrd (7.8.2026): tab viditelný i BEZ Coquina tech,
    // pokud má hráč odemčený aspoň 1 migrovaný recept (vlastní, starší tech
    // cesta) — jinak by klik ve Výrobě na odemčený čaj nic neudělal.
    isActive: function() {
        const t = GameState.researchedTechs || [];
        if (t.includes('tech_ruralia_meat') || t.includes('tech_udirna')) return true;
        const unlocked = GameState.unlockedRecipes || [];
        return Object.keys(this.COOK_TYPES).some(k => unlocked.includes(k));
    },

    _ensureState: function() {
        if (!GameState.cookingInstances) GameState.cookingInstances = [];
        return GameState.cookingInstances;
    },

    // coquina-tier4-mrd (7.8.2026): Mistr kuchař — přiřazený bratr na
    // 'kuchyne' tab. fatigue<90 mirror ostatních specializací (unavený
    // bratr se nevybere).
    _getChef: function() {
        return (GameState.dormitorium && GameState.dormitorium.brothers || [])
            .find(b => b.assignedTab === 'kuchyne' && (b.fatigue || 0) < 90) || null;
    },

    // coquina-tier2-mrd (7.8.2026): "vylepšené solné kádě" — vrátí kratší
    // dobu, má-li hráč fastTech; jinak normální durationH. Jedno místo
    // pravdy pro tick/render/startCooking, ať se nerozjede na 3 kopiích.
    // coquina-tier4-mrd: + volitelný chefMult — u BĚŽÍCÍ instance je to
    // hodnota zapečená při startu (inst.brotherMult), u náhledu receptu
    // (ještě nezačato) se počítá živě z aktuálně přiřazeného bratra.
    _effectiveDuration: function(def, chefMult) {
        let dur = def.durationH;
        if (def.fastTech && GameState.researchedTechs && GameState.researchedTechs.includes(def.fastTech)) {
            dur = def.fastDurationH || def.durationH;
        }
        if (chefMult === undefined) {
            const chef = this._getChef();
            chefMult = (chef && typeof Game !== 'undefined' && Game.dormitoriumBrotherMult) ? Game.dormitoriumBrotherMult(chef, 'kuchyne') : 1.0;
        }
        return dur / chefMult;
    },

    // coquina-migrace-mrd (7.8.2026): oprava zobrazení — Math.ceil() dřív
    // zaokrouhloval cokoliv pod hodinu nahoru na "1h" (12 min → "1h" lež).
    // Pod hodinu ukáže minuty, nad hodinu hodiny (zaokrouhleno na 15 min).
    _formatDuration: function(hours, lang) {
        if (hours < 1) {
            const min = Math.max(1, Math.round(hours * 60));
            return min + ' ' + (lang === 'en' ? 'min' : 'min');
        }
        const rounded = Math.round(hours * 4) / 4; // čtvrthodiny
        return (rounded % 1 === 0 ? rounded : rounded.toFixed(2).replace(/0$/, '')) + 'h';
    },

    startCooking: function(typeKey) {
        if (!this.isActive()) return;
        const def = this.COOK_TYPES[typeKey];
        if (!def) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (def.needsTech && !(GameState.researchedTechs && GameState.researchedTechs.includes(def.needsTech))) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Requires further research.' : 'Vyžaduje další výzkum.', true);
            return;
        }
        if (def.needsBuild && !(GameState.storage && GameState.storage[def.needsBuild] && GameState.storage[def.needsBuild].built)) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Needs the Smokehouse built first.' : 'Nejdřív je třeba postavit Udírnu.', true);
            return;
        }
        // coquina-vyroba-modal-mrd (7.8.2026): needsTool — obecné pole
        // vlastněných-ne-spotřebovaných nástrojů (cooking_pot, pestle,
        // cheese_mold, barrel_tool...). Nahrazuje starší hardcoded barrel_tool.
        if (def.needsTool) {
            for (const toolId of def.needsTool) {
                if ((GameState.inventory[toolId] || 0) < 1) {
                    const nm = (typeof iName === 'function') ? iName(toolId) : toolId;
                    if (typeof UI !== 'undefined') UI.notify((lang === 'en' ? 'Needs: ' : 'Potřeba: ') + nm, true);
                    return;
                }
            }
        }
        if ((GameState.inventory[def.input] || 0) < def.inputQty) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Not enough raw material.' : 'Nedostatek suroviny.', true);
            return;
        }
        if (def.saltQty && (GameState.inventory['salt'] || 0) < def.saltQty) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Not enough salt.' : 'Nedostatek soli.', true);
            return;
        }
        if (def.needsItem === 'log' && (GameState.inventory['log'] || 0) < (def.needsItemQty || 1)) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Not enough wood for smoking.' : 'Nedostatek dřeva na uzení.', true);
            return;
        }
        // coquina-tier4-mrd (7.8.2026): extraInputs — obecná podpora pro
        // recepty s víc než jednou surovinou (Masový koláč: mouka+koření+sádlo).
        if (def.extraInputs) {
            for (const [id, qty] of Object.entries(def.extraInputs)) {
                if ((GameState.inventory[id] || 0) < qty) {
                    const nm = (typeof iName === 'function') ? iName(id) : id;
                    if (typeof UI !== 'undefined') UI.notify((lang === 'en' ? 'Not enough: ' : 'Nedostatek: ') + nm, true);
                    return;
                }
            }
        }
        Game.removeItem(def.input, def.inputQty);
        if (def.saltQty) Game.removeItem('salt', def.saltQty);
        if (def.needsItem === 'log') Game.removeItem('log', def.needsItemQty || 1);
        if (def.extraInputs) {
            for (const [id, qty] of Object.entries(def.extraInputs)) Game.removeItem(id, qty);
        }
        const _chef = this._getChef();
        const _chefMult = (_chef && typeof Game !== 'undefined' && Game.dormitoriumBrotherMult) ? Game.dormitoriumBrotherMult(_chef, 'kuchyne') : 1.0;
        this._ensureState().push({ type: typeKey, startedAt: Date.now(), brotherMult: _chefMult, brotherId: _chef ? _chef.id : null });
        Game.save();
        // vareni-refresh-fix (9.8.2026): okamžitě zobrazit nově rozjetý proces,
        // ne až po přepnutí tabu — mirror stejné opravy v UI.renderAll().
        // coquina-visibility-fix (9.8.2026): style.display na home-cooking-content
        // samo o sobě neříká, jestli je hráč na Vaření — .screen/.screen.active
        // skrývá CELOU Home obrazovku přes CSS třídu nezávisle na tomhle inline
        // stylu. Bez tohohle: klik na Uvařit z Výroby tiše potlačil "Začalo se
        // vařit" modal (myslel si, že hráč kouká na Vaření, i když ne) — recept
        // se spustil správně, jen to nebylo vidět. offsetParent===null pokrývá
        // i skrytí přes rodiče.
        const _cookEl = document.getElementById('home-cooking-content');
        const _cookingTabVisible = !!(_cookEl && _cookEl.offsetParent !== null);
        if (_cookingTabVisible) {
            _cookEl.innerHTML = this.render();
        }
        const effH = this._effectiveDuration(def, _chefMult);
        // udirna-mrd: elegantní modal — "začalo se vařit", odkaz do Vaření tabu.
        // vareni-refresh-fix (9.8.2026): jen když Vaření není zrovna vidět (klik
        // z Výroby, přesměrovaný přes Game.craft()) — na Vaření tabu je zbytečný,
        // hráč vidí rozjetý proces v progress baru rovnou (_cookEl refresh výše).
        if (!_cookingTabVisible && typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) {
            NotificationSystem.modal({
                icon: '🍲',
                title: lang === 'en' ? 'Cooking has begun' : 'Začalo se vařit',
                text: lang === 'en'
                    ? `Ready in ${this._formatDuration(effH, 'en')}. Track progress in the Cooking tab.`
                    : `Hotovo za ${this._formatDuration(effH, 'cs')}. Sleduj postup v tabu Vaření.`,
                choices: [
                    { label: lang === 'en' ? 'Go to Cooking' : 'Do Vaření', type: 'primary',
                      effect: function() { if (typeof UI !== 'undefined' && UI.switchScreen) UI.switchScreen('home', document.getElementById('nav-home')); if (typeof UI !== 'undefined' && UI.switchHomeSubTab) UI.switchHomeSubTab('cooking', document.getElementById('home-sub-cooking')); } },
                    { label: lang === 'en' ? 'Continue' : 'Pokračovat', type: 'default', effect: function() {} },
                ],
            });
        }
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.render) CellariumSystem.render();
    },

    // ── Tick (self-guarded 5 min, volán z game.js tick batch) ──────────────
    tick: function() {
        if (!this.isActive()) return;
        if (!GameState.cookingTick) GameState.cookingTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.cookingTick.lastTick || 0) < this.TICK_GUARD_MS) return;
        GameState.cookingTick.lastTick = now;

        const list = this._ensureState();
        let done = [];
        for (let i = list.length - 1; i >= 0; i--) {
            const inst = list[i];
            const def = this.COOK_TYPES[inst.type];
            if (!def) { list.splice(i, 1); continue; }
            const _brotherMult = inst.brotherMult || 1.0;
            if (now - inst.startedAt >= this._effectiveDuration(def, _brotherMult) * this.HOUR_MS) {
                Game.addItem(def.output, def.outputQty || 1);
                done.push(def.output);
                // coquina-tier4-mrd (7.8.2026): elitní recepty zvyšují Vliv,
                // mirror mše/relikvie vzoru (PersonaSystem.addInfluence).
                // Mistr kuchař násobí výsledný Vliv stejným multiplikátorem
                // jako rychlost — zapečeno při startu, ne živě.
                if (def.influenceGain && typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                    const amt = Math.round(def.influenceGain.amount * _brotherMult * 10) / 10;
                    PersonaSystem.addInfluence(def.influenceGain.axis, amt);
                }
                // XP guard 1×/den — jinak by krátké recepty (mletí koření,
                // 1h) nahnaly level rychleji než ostatní specializace (denní tick).
                if (inst.brotherId && typeof Game !== 'undefined' && Game.dormitoriumAddXp) {
                    const brother = (GameState.dormitorium && GameState.dormitorium.brothers || []).find(b => b.id === inst.brotherId);
                    if (brother) {
                        if (!GameState.cookingXpLastAt) GameState.cookingXpLastAt = {};
                        const lastXp = GameState.cookingXpLastAt[inst.brotherId] || 0;
                        if (now - lastXp >= 24 * this.HOUR_MS) {
                            Game.dormitoriumAddXp(brother, 'kuchyne');
                            GameState.cookingXpLastAt[inst.brotherId] = now;
                        }
                    }
                }
                list.splice(i, 1);
            }
        }

        if (done.length > 0) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
                const names = done.map(id => (typeof iName === 'function') ? iName(id) : id).join(', ');
                NotificationSystem.panel('🍲 ' + (lang === 'en' ? `Ready: ${names}` : `Hotovo: ${names}`), 'info');
            }
            Game.save();
        }
    },

    // coquina-dashboard-mrd (9.8.2026): mapování receptu na stanici podle
    // needsBuild — Hmoždíř i Rožeň sdílí "Panská kuchyně" (mirror MRD
    // modulového seznamu: Ohniště/Černá kuchyně/Udírna/Panská kuchyně).
    STATIONS: {
        ohniste:        { icon: '🔥', name: 'Ohniště',        name_en: 'Hearth',         tier: 'Tier 1', flame: true },
        cerna_kuchyne:  { icon: '🏚️', name: 'Černá kuchyně',  name_en: 'Black Kitchen',  tier: 'Tier 2' },
        udirna:         { icon: '🏚️', name: 'Udírna',         name_en: 'Smokehouse',     tier: 'Tier 3' },
        panska_kuchyne: { icon: '⚱️', name: 'Panská kuchyně', name_en: "Lord's Kitchen", tier: 'Tier 4' },
    },
    _stationKey: function(def) {
        if (!def.needsBuild) return 'ohniste';
        if (def.needsBuild === 'cerna_kuchyne') return 'cerna_kuchyne';
        if (def.needsBuild === 'udirna') return 'udirna';
        if (def.needsBuild === 'velky_hmozdir' || def.needsBuild === 'rozen') return 'panska_kuchyne';
        return 'ohniste';
    },
    _buildNames: {
        cerna_kuchyne: { cs: 'Černá kuchyně', en: 'Black Kitchen' },
        udirna: { cs: 'Udírna', en: 'Smokehouse' },
        velky_hmozdir: { cs: 'Velký hmoždíř', en: 'Great Mortar' },
        rozen: { cs: 'Rožeň', en: 'Spit' },
    },
    _buildName: function(id, lang) {
        return (this._buildNames[id] && this._buildNames[id][lang === 'en' ? 'en' : 'cs']) || id;
    },

    // ── Vaření tab — grid stanic (Ohniště/Černá kuchyně/Udírna/Panská
    // kuchyně/Sýrárna), každá s vlastním "Probíhá" + seznamem receptů.
    // Mirror Athanor panel jazyka (coquina-station CSS třída v shell.html).
    render: function() {
        if (!this.isActive()) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            return `<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Requires research first.' : 'Vyžaduje nejdřív výzkum.'}</div>`;
        }
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isCs = lang !== 'en';
        const list = this._ensureState();
        if (!GameState.ui) GameState.ui = {};

        const buildInProgressHtml = (stationKey) => {
            const items = list.filter(inst => {
                const def = this.COOK_TYPES[inst.type];
                return def && this._stationKey(def) === stationKey;
            });
            if (items.length === 0) return { count: 0, html: '' };
            let h = '';
            items.forEach(inst => {
                const def = this.COOK_TYPES[inst.type];
                const totalMs = this._effectiveDuration(def, inst.brotherMult || 1.0) * this.HOUR_MS;
                const elapsed = Date.now() - inst.startedAt;
                const pct = Math.min(100, Math.round(elapsed / totalMs * 100));
                const remainH = Math.max(0, (totalMs - elapsed) / this.HOUR_MS);
                const outName = (typeof iName === 'function') ? iName(def.output) : def.output;
                const remainStr = isCs ? `zbývá ${this._formatDuration(remainH, 'cs')}` : `${this._formatDuration(remainH, 'en')} left`;
                h += `<div class="coquina-brewing" style="display:flex; align-items:center; gap:7px; background:rgba(0,0,0,0.18); padding:5px 8px; border-radius:6px; margin-bottom:4px; font-size:0.72rem;">
                        <span style="font-weight:bold; white-space:nowrap;">${outName}</span>
                        <div style="flex:1; background:rgba(0,0,0,0.25); border-radius:3px; height:5px; overflow:hidden;">
                          <div style="width:${pct}%; background:var(--accent-gold); height:5px; border-radius:3px; transition:width 0.3s;"></div>
                        </div>
                        <span style="opacity:0.6; white-space:nowrap;">${remainStr}</span>
                      </div>`;
            });
            return { count: items.length, html: h };
        };

        const buildRecipeCard = (key, def) => {
            const outName = (typeof iName === 'function') ? iName(def.output) : def.output;
            const inName = (typeof iName === 'function') ? iName(def.input) : def.input;
            const have = GameState.inventory[def.input] || 0;
            const hasBuild = !def.needsBuild || (GameState.storage && GameState.storage[def.needsBuild] && GameState.storage[def.needsBuild].built);
            const missingTool = def.needsTool ? def.needsTool.find(t => (GameState.inventory[t] || 0) < 1) : null;
            const hasTool = !missingTool;
            const hasSalt = !def.saltQty || (GameState.inventory['salt'] || 0) >= def.saltQty;
            const hasWood = def.needsItem !== 'log' || (GameState.inventory['log'] || 0) >= (def.needsItemQty || 1);
            const hasExtraInputs = !def.extraInputs || Object.entries(def.extraInputs).every(([id, qty]) => (GameState.inventory[id] || 0) >= qty);
            const can = have >= def.inputQty && hasBuild && hasTool && hasSalt && hasWood && hasExtraInputs;
            const effH = this._effectiveDuration(def);
            let reqStr = `${def.inputQty}× ${inName}`;
            if (def.saltQty) reqStr += `, ${def.saltQty}× ${(typeof iName === 'function') ? iName('salt') : 'sůl'}`;
            if (def.needsItem === 'log') reqStr += `, ${def.needsItemQty}× ${(typeof iName === 'function') ? iName('log') : 'dřevo'}`;
            if (def.extraInputs) {
                Object.entries(def.extraInputs).forEach(([id, qty]) => {
                    reqStr += `, ${qty}× ${(typeof iName === 'function') ? iName(id) : id}`;
                });
            }
            return `<div style="background:rgba(255,255,255,0.09); padding:9px; border-radius:7px; border:1px solid rgba(197,160,89,0.45); margin-bottom:5px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <div style="font-size:0.8rem; font-weight:bold;">${outName}</div>
                        <div style="font-size:0.68rem; opacity:0.65;">${reqStr} — ${this._formatDuration(effH, lang)}</div>
                        ${!hasBuild ? `<div style="font-size:0.65rem; color:#e07a5f;">🔒 ${isCs ? 'Potřeba' : 'Needs'}: ${this._buildName(def.needsBuild, lang)}</div>` : ''}
                        ${missingTool ? `<div style="font-size:0.65rem; color:#e07a5f;">🔒 ${isCs ? 'Potřeba' : 'Needs'}: ${(typeof iName === 'function') ? iName(missingTool) : missingTool}</div>` : ''}
                      </div>
                      <button class="craft-btn" onclick="CookingSystem.startCooking('${key}')" ${can ? '' : 'disabled'} style="font-size:0.72rem;">🍲 ${isCs ? 'Vařit' : 'Start'}</button>
                    </div>
                  </div>`;
        };

        let gridHtml = '';
        Object.keys(this.STATIONS).forEach(stationKey => {
            const meta = this.STATIONS[stationKey];
            const recipeKeys = Object.keys(this.COOK_TYPES).filter(key => {
                const def = this.COOK_TYPES[key];
                if (this._stationKey(def) !== stationKey) return false;
                const hasTech = !def.needsTech || (GameState.researchedTechs && GameState.researchedTechs.includes(def.needsTech));
                return hasTech;
            });
            const inProgress = buildInProgressHtml(stationKey);
            if (recipeKeys.length === 0 && inProgress.count === 0) return; // stanice zatím nedostupná — skrýt celou

            const collapseKey = 'cookingStation_' + stationKey + 'Open';
            const isOpen = GameState.ui[collapseKey] !== false;
            const stationName = isCs ? meta.name : meta.name_en;
            const flameIcon = meta.flame ? `<span class="coquina-flame">${meta.icon}</span>` : meta.icon;

            const progressCollapseKey = 'cookingStation_' + stationKey + 'ProgressOpen';
            // defaultně otevřeno jen do 3 rozjetých procesů — nad to bobtná panel, radši sbalit
            const progressDefaultOpen = inProgress.count <= 3;
            const progressOpen = GameState.ui[progressCollapseKey] !== undefined ? GameState.ui[progressCollapseKey] : progressDefaultOpen;
            const progressHtml = inProgress.count === 0 ? '' : `
                <details ${progressOpen ? 'open' : ''} ontoggle="GameState.ui.${progressCollapseKey} = this.open; Game.save();" style="margin-bottom:8px;">
                  <summary class="coquina-summary" style="cursor:pointer; font-size:0.72rem; opacity:0.7; user-select:none; margin-bottom:4px;">🔥 ${isCs ? 'Probíhá' : 'In progress'} (${inProgress.count})</summary>
                  ${inProgress.html}
                </details>`;

            gridHtml += `<div class="coquina-station">
                <div class="coquina-station-head">
                  <div class="coquina-station-title">${flameIcon}<span class="coquina-station-name">${stationName}</span></div>
                  <span class="coquina-station-tier">${meta.tier}</span>
                </div>
                ${progressHtml}
                <details ${isOpen ? 'open' : ''} ontoggle="GameState.ui.${collapseKey} = this.open; Game.save();">
                  <summary class="coquina-summary" style="cursor:pointer; font-size:0.72rem; opacity:0.6; user-select:none; margin-bottom:4px;">📖 ${isCs ? 'Recepty' : 'Recipes'} (${recipeKeys.length})</summary>
                  ${recipeKeys.map(key => buildRecipeCard(key, this.COOK_TYPES[key])).join('')}
                </details>
              </div>`;
        });

        // Sýrárna — vlastní panel ve stejném gridu, obsah beze změny (CheeseSystem.render()).
        const cheeseContent = (typeof CheeseSystem !== 'undefined' && CheeseSystem.render) ? CheeseSystem.render() : '';
        if (cheeseContent) {
            gridHtml += `<div class="coquina-station">
                <div class="coquina-station-head">
                  <div class="coquina-station-title">🧀<span class="coquina-station-name">${isCs ? 'Sýrárna' : 'Dairy'}</span></div>
                  <span class="coquina-station-tier">Caseus</span>
                </div>
                <div style="margin:0 -12px -12px;">${cheeseContent}</div>
              </div>`;
        }

        return `<div style="padding:12px;"><div class="coquina-stations">${gridHtml}</div></div>`;
    },
};