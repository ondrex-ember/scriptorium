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
        salted_pork: { input: 'pork', inputQty: 1, saltQty: 2, needsItem: 'barrel_tool',
            needsTech: 'tech_ruralia_meat', output: 'salted_pork', durationH: 8,
            fastDurationH: 5, fastTech: 'tech_tacuinum_sanitatis' },
        salted_beef: { input: 'beef', inputQty: 1, saltQty: 2, needsItem: 'barrel_tool',
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
    },

    // coquina-tier1-mrd: tab je vidět, jakmile hráč má ASPOŇ jeden tier —
    // jednotlivé recepty se pak filtrují zvlášť podle vlastního needsTech.
    isActive: function() {
        const t = GameState.researchedTechs || [];
        return t.includes('tech_ruralia_meat') || t.includes('tech_udirna');
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
        if (def.needsItem === 'barrel_tool' && (GameState.inventory['barrel_tool'] || 0) < 1) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'Needs a barrel (vat) for salting.' : 'Na nasolení je potřeba sud (kádě).', true);
            return;
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
        const effH = this._effectiveDuration(def, _chefMult);
        // udirna-mrd: elegantní modal — "začalo se vařit", odkaz do Vaření tabu
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) {
            NotificationSystem.modal({
                icon: '🍲',
                title: lang === 'en' ? 'Cooking has begun' : 'Začalo se vařit',
                text: lang === 'en'
                    ? `Ready in ${effH}h. Track progress in the Cooking tab.`
                    : `Hotovo za ${effH}h. Sleduj postup v tabu Vaření.`,
                choices: [
                    { label: lang === 'en' ? 'Go to Cooking' : 'Do Vaření', type: 'primary',
                      effect: function() { if (typeof UI !== 'undefined' && UI.switchHomeSubTab) UI.switchHomeSubTab('cooking', document.getElementById('home-sub-cooking')); } },
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
                Game.addItem(def.output, 1);
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

    // ── Vaření tab — seznam receptů + aktivní procesy s progress bary ──────
    render: function() {
        if (!this.isActive()) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            return `<div style="padding:20px; text-align:center; opacity:0.6; font-style:italic;">${lang === 'en' ? 'Requires research first.' : 'Vyžaduje nejdřív výzkum.'}</div>`;
        }
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const list = this._ensureState();
        let h = `<div style="padding:12px;">`;

        if (list.length > 0) {
            h += `<h4 style="margin:0 0 10px 0; color:var(--ink-primary);">🔥 ${lang === 'en' ? 'In Progress' : 'Probíhá'}</h4>`;
            list.forEach(inst => {
                const def = this.COOK_TYPES[inst.type];
                if (!def) return;
                const totalMs = this._effectiveDuration(def, inst.brotherMult || 1.0) * this.HOUR_MS;
                const elapsed = Date.now() - inst.startedAt;
                const pct = Math.min(100, Math.round(elapsed / totalMs * 100));
                const remainH = Math.max(0, Math.ceil((totalMs - elapsed) / this.HOUR_MS));
                const outName = (typeof iName === 'function') ? iName(def.output) : def.output;
                h += `<div style="background:rgba(0,0,0,0.05); padding:12px; border-radius:8px; border-left:3px solid var(--accent-gold); margin-bottom:8px;">
                        <div style="font-size:0.85rem; font-weight:bold; margin-bottom:6px;">${outName}</div>
                        <div style="background:rgba(0,0,0,0.1); border-radius:4px; height:8px;">
                          <div style="width:${pct}%; background:var(--accent-gold); height:8px; border-radius:4px; transition:width 0.3s;"></div>
                        </div>
                        <div style="font-size:0.72rem; opacity:0.65; margin-top:4px;">${lang === 'en' ? `${remainH}h remaining` : `zbývá ${remainH}h`}</div>
                      </div>`;
            });
        }

        h += `<h4 style="margin:14px 0 10px 0; color:var(--ink-primary);">📖 ${lang === 'en' ? 'Recipes' : 'Recepty'}</h4>`;
        Object.keys(this.COOK_TYPES).forEach(key => {
            const def = this.COOK_TYPES[key];
            const hasTech = !def.needsTech || (GameState.researchedTechs && GameState.researchedTechs.includes(def.needsTech));
            if (!hasTech) return; // recept se vůbec nezobrazí, dokud není tech
            const outName = (typeof iName === 'function') ? iName(def.output) : def.output;
            const inName = (typeof iName === 'function') ? iName(def.input) : def.input;
            const have = GameState.inventory[def.input] || 0;
            const hasBuild = !def.needsBuild || (GameState.storage && GameState.storage[def.needsBuild] && GameState.storage[def.needsBuild].built);
            const hasBarrel = def.needsItem !== 'barrel_tool' || (GameState.inventory['barrel_tool'] || 0) >= 1;
            const hasSalt = !def.saltQty || (GameState.inventory['salt'] || 0) >= def.saltQty;
            const hasWood = def.needsItem !== 'log' || (GameState.inventory['log'] || 0) >= (def.needsItemQty || 1);
            // coquina-tier4-mrd (7.8.2026): extraInputs kontrola pro recepty s víc surovinami
            const hasExtraInputs = !def.extraInputs || Object.entries(def.extraInputs).every(([id, qty]) => (GameState.inventory[id] || 0) >= qty);
            const can = have >= def.inputQty && hasBuild && hasBarrel && hasSalt && hasWood && hasExtraInputs;
            const effH = this._effectiveDuration(def);
            let reqStr = `${def.inputQty}× ${inName}`;
            if (def.saltQty) reqStr += `, ${def.saltQty}× ${(typeof iName === 'function') ? iName('salt') : 'sůl'}`;
            if (def.needsItem === 'log') reqStr += `, ${def.needsItemQty}× ${(typeof iName === 'function') ? iName('log') : 'dřevo'}`;
            if (def.extraInputs) {
                Object.entries(def.extraInputs).forEach(([id, qty]) => {
                    reqStr += `, ${qty}× ${(typeof iName === 'function') ? iName(id) : id}`;
                });
            }
            h += `<div style="background:rgba(255,255,255,0.4); padding:10px; border-radius:8px; border:1px solid rgba(197,160,89,0.3); margin-bottom:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <div style="font-size:0.82rem; font-weight:bold;">${outName}</div>
                        <div style="font-size:0.7rem; opacity:0.65;">${reqStr} — ${effH}h</div>
                        ${!hasBuild ? `<div style="font-size:0.68rem; color:#c0392b;">🔒 ${lang === 'en' ? 'Needs Smokehouse' : 'Potřeba Udírna'}</div>` : ''}
                        ${def.needsItem === 'barrel_tool' && !hasBarrel ? `<div style="font-size:0.68rem; color:#c0392b;">🔒 ${lang === 'en' ? 'Needs a barrel' : 'Potřeba sud'}</div>` : ''}
                      </div>
                      <button class="craft-btn" onclick="CookingSystem.startCooking('${key}')" ${can ? '' : 'disabled'} style="font-size:0.75rem;">🍲 ${lang === 'en' ? 'Start' : 'Vařit'}</button>
                    </div>
                  </div>`;
        });

        h += `</div>`;
        return h;
    },
};