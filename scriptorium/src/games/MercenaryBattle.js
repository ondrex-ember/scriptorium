// ═══════════════════════════════════════════════════════════════════════════════
//  MercenaryBattle — "Zteč na saeculumské stezce"
//  vyroba-stavby-mrd navazuje (6.9.2026), Fáze C.
//
//  Věrný port Bouvardova testovaného HTML prototypu
//  (zte-na-saeculumske-stezce.html) — mirror RiskStack.js vzoru přesně
//  (open/onResolve, overlay mount, vlastní prefixovaný CSS).
//
//  Vědomé rozdíly oproti prototypu (ne opomenutí):
//  1) Party O DVOU (hráč + žoldnéř), ne jeden bojovník — Bouvard:
//     "buď partička, nebo sám, a to je horší". Sólo cesta (bez žoldnéře)
//     jde přes existující RiskStack, ne přes tenhle engine.
//  2) Archetyp/item výběrový screen odpadá — žoldnéř je danej
//     (GameState.mercenary z Fáze B). Hráč má provizorní bojový staty
//     (HP 60 / atk 8, bez kritu/schopnosti) — equip slot z Fáze A je
//     zatím prázdnej, dokud nepřijdou zbraně. Až equip ožije, jen se
//     přepíšou čísla tady, engine se nemění.
//  3) Útočná tlačítka teď akcí hejbou CELOU parti (oba živí členové
//     zaútočí na stejnej cíl při jednom kliku) — jednodušší ovládání
//     než volba "kdo právě táhne", drží to "lehké jako doposud".
//  4) Ability tlačítko je jen žoldnéřovo (hráč bez gearu žádnou nemá).
//  5) Itemy (Lektvar/Ostří/Dým) jsou sdílená party výbava, ne osobní.
//  6) Reálná odměna (groše + šance suroviny) místo fake loot karet.
//  7) Žoldnéřovo HP se PO bitvě nezapisuje zpět do GameState.mercenary —
//     každá "hlídka" začíná na plné HP (žádnej healing-mezi-boji systém
//     zatím neexistuje, nechceme trvale zmrzačenýho žoldnéře bez cesty
//     ven). Otevřená otázka pro Fázi D, až se napojí na skutečný road eventy.
//
//  Použití (test tlačítko v Persona/Družina, později i road eventy):
//    MercenaryBattle.open((outcome) => { ... });
// ═══════════════════════════════════════════════════════════════════════════════

const MercenaryBattle = {
    ENEMY_TYPES: {
        kapo:  { name: 'Kápo',  name_en: 'The Boss',   role: 'velitel lapků',    role_en: 'bandit chief',       icon: '👑', hp: 78, atk: 13 },
        mazak: { name: 'Mazák', name_en: 'The Brute',  role: 'tvrdý rváč',       role_en: 'hardened brawler',   icon: '🛡️', hp: 62, atk: 15 },
        speh:  { name: 'Špeh',  name_en: 'The Shadow', role: 'stín mezi stromy', role_en: 'shadow among trees', icon: '🥷', hp: 44, atk: 11 },
    },
    ITEM_DEFS: {
        lektvar: { name: 'Lektvar mízy', name_en: 'Sap Potion', icon: '🧪' },
        ostri:   { name: 'Ostří z poutnické dílny', name_en: "Pilgrim's Edge", icon: '🗡️' },
        dym:     { name: 'Dýmová šiška', name_en: 'Smoke Pellet', icon: '💨' },
    },

    _resolve: null,
    _screen: 'prep',
    _party: [],
    _enemies: [],
    _round: 1,
    _target: 0,
    _logs: [],
    _busy: false,
    _items: {},
    _loot: null,
    _resultKind: null,

    _lang: function () {
        return (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language === 'en') ? 'en' : 'cs';
    },

    open: function (onResolve) {
        const lang = this._lang();
        const merc = (typeof GameState !== 'undefined') ? GameState.mercenary : null;
        if (!merc) { if (onResolve) onResolve({ result: 'abort' }); return; }
        this._resolve = onResolve;
        // vyroba-stavby-mrd navazuje (6.9.2026) — equip základ. atk_bonus
        // z equipnutý zbraně se připočítá k základnímu atk. Budoucí
        // sekera/meč/luk fungujou stejnou cestou beze změny tady.
        const playerWeapon = (typeof GameState !== 'undefined' && GameState.equipment && GameState.equipment.weapon && typeof ItemsDB !== 'undefined') ? ItemsDB[GameState.equipment.weapon] : null;
        const mercWeapon = (merc.equipment && merc.equipment.weapon && typeof ItemsDB !== 'undefined') ? ItemsDB[merc.equipment.weapon] : null;
        this._party = [
            { key: 'player', name: 'Ty', name_en: 'You', icon: '🧑', hp: 60, max: 60, atk: 8 + (playerWeapon ? (playerWeapon.atk_bonus || 0) : 0), crit: 10, buff: 0, dodge: 0 },
            { key: 'merc', name: merc.name, name_en: merc.name_en, icon: merc.icon || '🛡️', hp: merc.max, max: merc.max, atk: merc.atk + (mercWeapon ? (mercWeapon.atk_bonus || 0) : 0), crit: merc.id === 'lovec' ? 25 : 10, buff: 0, dodge: 0, ability: merc.ability, ability_en: merc.ability_en, archId: merc.id },
        ];
        const keys = Math.random() < 0.5 ? ['kapo', 'mazak'] : ['kapo', 'mazak', 'speh'];
        this._enemies = keys.map((k, i) => ({ ...this.ENEMY_TYPES[k], id: i, type: k, max: this.ENEMY_TYPES[k].hp, hp: this.ENEMY_TYPES[k].hp }));
        this._round = 1; this._target = 0; this._logs = []; this._busy = false; this._loot = null; this._resultKind = null;
        this._items = { lektvar: 2, ostri: 1, dym: 1 };
        this._screen = 'prep';
        this._mount();
    },

    _mount: function () {
        if (document.getElementById('mercbattle-overlay')) return;
        const el = document.createElement('div');
        el.id = 'mercbattle-overlay';
        document.body.appendChild(el);
        this._injectStyles();
        this.render();
    },

    close: function (outcome) {
        const el = document.getElementById('mercbattle-overlay');
        if (el) el.remove();
        const r = this._resolve;
        this._resolve = null;
        if (r) r(outcome || { result: this._resultKind });
    },

    _log: function (type, icon, text) {
        this._logs.unshift({ type, icon, text });
    },

    _injectStyles: function () {
        if (document.getElementById('mercbattle-styles')) return;
        const style = document.createElement('style');
        style.id = 'mercbattle-styles';
        style.textContent = `
            #mercbattle-overlay{position:fixed;inset:0;z-index:5000;overflow-y:auto;background:#0d0906e6;padding:16px;font-family:Georgia,serif;color:#f2e5c9;}
            .mb-shell{width:min(880px,100%);margin:0 auto;}
            .mb-panel{background:linear-gradient(150deg,#2b211aee,#1a130fee);border:1px solid #765e3a88;border-radius:8px;padding:18px;box-shadow:0 18px 55px #000a;}
            .mb-h{font-family:'Cinzel',serif;letter-spacing:.04em;color:#f1d395;margin:0 0 8px;}
            .mb-eyebrow{color:#c9a86a;text-transform:uppercase;font-size:11px;letter-spacing:.16em;font-weight:700;}
            .mb-muted{color:#bcae94;font-size:13px;line-height:1.5;}
            .mb-statline{display:flex;justify-content:space-between;border-bottom:1px solid #765e3a55;padding:8px 0;font-size:13px;}
            .mb-statline b{color:#f1d395;}
            .mb-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
            .mb-btn{background:linear-gradient(135deg,#8d6b38,#b18a4a);border:1px solid #e3c27f;color:#1b140e;border-radius:3px;padding:10px 16px;font-weight:700;letter-spacing:.03em;cursor:pointer;font-family:inherit;transition:.15s;}
            .mb-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1);}
            .mb-btn:disabled{opacity:.35;cursor:not-allowed;transform:none;}
            .mb-btn.ghost{background:#30251c;border-color:#80633b;color:#f1d395;}
            .mb-btn.danger{background:#5e302c;border-color:#bb6a58;color:#f5d0b0;}
            .mb-battlefield{display:grid;grid-template-columns:1fr 44px 1fr;gap:14px;align-items:start;margin-bottom:14px;}
            .mb-side{display:flex;flex-direction:column;gap:8px;}
            .mb-versus{text-align:center;color:#c9a86a;font:600 22px 'Cinzel',serif;padding-top:30px;}
            .mb-combatant{padding:12px;border:1px solid #765e3a88;background:#241b16cc;border-radius:6px;position:relative;transition:.15s;}
            .mb-combatant.enemy{cursor:pointer;}
            .mb-combatant.enemy:hover,.mb-combatant.targeted{border-color:#f1d395;box-shadow:0 0 0 2px #c9a86a33;}
            .mb-combatant.dead{opacity:.4;filter:grayscale(.8);cursor:default;}
            .mb-chead{display:flex;gap:10px;align-items:center;}
            .mb-mini{font-size:1.6rem;}
            .mb-combatant h4{font:600 15px 'Cinzel',serif;margin:0;color:#f2e5c9;}
            .mb-role{font-size:11px;color:#bcae94;}
            .mb-hp{height:9px;background:#120e0c;border:1px solid #5f4a31;margin-top:9px;border-radius:8px;overflow:hidden;}
            .mb-hp-fill{height:100%;background:linear-gradient(90deg,#4d9a62,#8dc879);transition:width .5s;}
            .mb-hp-fill.mid{background:linear-gradient(90deg,#b68734,#e0bf5b);}
            .mb-hp-fill.low{background:linear-gradient(90deg,#913934,#d6644d);}
            .mb-hptext{display:flex;justify-content:space-between;color:#bcae94;font-size:11px;margin-top:4px;}
            .mb-target-mark{position:absolute;right:8px;top:8px;color:#f1d395;font-size:10px;letter-spacing:.08em;}
            .mb-turn{margin:10px 0;padding:8px 12px;border-left:3px solid #c9a86a;background:#30251b;color:#f1d395;font-size:12px;}
            .mb-controls{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-top:10px;}
            .mb-ctitle{font:600 13px 'Cinzel',serif;color:#f1d395;margin:0 0 8px;}
            .mb-attack-grid{display:flex;gap:6px;flex-wrap:wrap;}
            .mb-attack{flex:1;min-width:100px;text-align:left;padding:9px;background:#211813;border:1px solid #765e3a;color:#f2e5c9;border-radius:3px;cursor:pointer;font-family:inherit;}
            .mb-attack:hover:not(:disabled){border-color:#f1d395;}
            .mb-attack:disabled{opacity:.4;cursor:not-allowed;}
            .mb-attack strong{display:block;font-size:12px;}
            .mb-attack small{display:block;color:#bcae94;font-size:10px;margin-top:2px;}
            .mb-item-grid{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
            .mb-item-btn{padding:7px 10px;background:#211813;border:1px solid #765e3a;color:#f1d395;border-radius:3px;font-size:11px;cursor:pointer;font-family:inherit;}
            .mb-item-btn:disabled{opacity:.35;cursor:not-allowed;}
            .mb-log{height:150px;overflow-y:auto;background:#17110e;border:1px solid #765e3a55;padding:8px;margin-top:12px;font-size:12px;border-radius:4px;}
            .mb-log p{margin:0;padding:4px 6px;border-bottom:1px solid #765e3a22;color:#cbbfa8;}
            .mb-log .hit{color:#e6c888;} .mb-log .crit{color:#f0a26f;} .mb-log .heal{color:#9bd19a;}
            .mb-log .miss{color:#9ca8ad;} .mb-log .special{color:#c5a0d9;} .mb-log .danger{color:#e7826f;}
            .mb-result{text-align:center;padding:20px 0;}
            .mb-result .seal{font-size:56px;}
            .mb-result h1{font:600 clamp(26px,5vw,42px) 'Cinzel',serif;margin:10px 0;color:#f1d395;}
            .mb-result.defeat h1{color:#cd7b70;} .mb-result.escape h1{color:#9db4aa;}
            .mb-loot{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:18px 0;}
            .mb-loot-card{background:linear-gradient(145deg,#392b1c,#211812);border:1px solid #9f7d46;padding:12px 16px;border-radius:4px;font-size:13px;}
            @media(max-width:620px){.mb-battlefield{grid-template-columns:1fr 24px 1fr;gap:6px;}.mb-versus{font-size:14px;padding-top:20px;}.mb-controls{grid-template-columns:1fr;}}
        `;
        document.head.appendChild(style);
    },

    render: function () {
        const el = document.getElementById('mercbattle-overlay');
        if (!el) return;
        const body = this._screen === 'prep' ? this._prepScreen() : this._screen === 'battle' ? this._battleScreen() : this._resultScreen();
        el.innerHTML = `<div class="mb-shell">${body}</div>`;
    },

    _hpClass: function (e) {
        const p = e.hp / e.max * 100;
        return p < 25 ? 'low' : p < 50 ? 'mid' : '';
    },

    _fighter: function (e, enemy) {
        const lang = this._lang();
        const p = Math.max(0, e.hp / e.max * 100);
        const nm = lang === 'en' ? (e.name_en || e.name) : e.name;
        const role = lang === 'en' ? (e.role_en || e.role) : e.role;
        const targeted = enemy && this._target === e.id && e.hp > 0;
        return `<div class="mb-combatant ${enemy ? 'enemy' : ''} ${e.hp <= 0 ? 'dead' : ''} ${targeted ? 'targeted' : ''}"
            ${enemy && e.hp > 0 ? `onclick="MercenaryBattle.targetEnemy(${e.id})"` : ''}>
            <div class="mb-chead"><span class="mb-mini">${e.icon}</span><div><h4>${nm}</h4>${role ? `<div class="mb-role">${role}</div>` : ''}</div></div>
            ${targeted ? `<span class="mb-target-mark">◈ ${lang === 'en' ? 'TARGET' : 'CÍL'}</span>` : ''}
            <div class="mb-hp"><div class="mb-hp-fill ${this._hpClass(e)}" style="width:${p}%;"></div></div>
            <div class="mb-hptext"><span>${e.hp} / ${e.max} HP</span><span>${e.hp <= 0 ? (lang === 'en' ? 'fallen' : 'padl') : ''}</span></div>
        </div>`;
    },

    _prepScreen: function () {
        const lang = this._lang();
        const merc = this._party[1];
        return `<div class="mb-panel">
            <div class="mb-eyebrow">${lang === 'en' ? 'Preparation · scouting' : 'Příprava · scouting'}</div>
            <h2 class="mb-h" style="font-size:24px;">${lang === 'en' ? 'A camp around the bend' : 'Tábor za zatáčkou'}</h2>
            <p class="mb-muted">${lang === 'en'
                ? `Scouting revealed a group of <b>${this._enemies.length} Lapkové</b>. The Kápo holds the middle, the rest wait in the shadows.`
                : `Scouting odhalil skupinu <b>${this._enemies.length} Lapků</b>. Kápo drží střed, ostatní čekají ve stínech.`}</p>
            <div class="mb-statline"><span>${lang === 'en' ? 'Your mercenary' : 'Tvůj žoldnéř'}</span><b>${lang === 'en' ? merc.name_en : merc.name}</b></div>
            <div class="mb-statline"><span>${lang === 'en' ? 'Advantage' : 'Výhoda'}</span><b>${(lang === 'en' ? merc.ability_en : merc.ability) || ''}</b></div>
            <div class="mb-statline"><span>${lang === 'en' ? 'Difficulty' : 'Obtížnost'}</span><b>${lang === 'en' ? 'Escalates from round 5' : 'Stupňuje se od 5. kola'}</b></div>
            <div class="mb-actions">
                <button class="mb-btn" onclick="MercenaryBattle.beginBattle()">${lang === 'en' ? 'Charge into camp →' : 'Vpadnout do tábora →'}</button>
                <button class="mb-btn ghost" onclick="MercenaryBattle.close()">${lang === 'en' ? '← Back' : '← Zpět'}</button>
            </div>
        </div>`;
    },

    beginBattle: function () {
        const lang = this._lang();
        this._log('special', '✦', lang === 'en' ? 'You enter the camp. The Lapkové draw their weapons.' : 'Vstupujete do tábora. Lapkové tasí zbraně.');
        this._screen = 'battle';
        this.render();
    },

    targetEnemy: function (id) {
        if (this._busy || !this._enemies[id] || this._enemies[id].hp <= 0) return;
        this._target = id;
        this.render();
    },

    _battleScreen: function () {
        const lang = this._lang();
        const merc = this._party[1];
        const mercAlive = merc.hp > 0;
        return `<div class="mb-panel" id="mb-battle">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h2 class="mb-h" style="font-size:22px;margin:0;">${lang === 'en' ? 'Lapkové camp' : 'Tábor lapků'}</h2>
                <div class="mb-eyebrow">${lang === 'en' ? 'Round' : 'Kolo'} ${this._round}</div>
            </div>
            <div class="mb-battlefield">
                <div class="mb-side">${this._party.map(p => this._fighter(p, false)).join('')}</div>
                <div class="mb-versus">⚔</div>
                <div class="mb-side">${this._enemies.map(e => this._fighter(e, true)).join('')}</div>
            </div>
            <div class="mb-turn">${this._busy ? (lang === 'en' ? 'The Lapkové are moving…' : 'Lapkové se dávají do pohybu…') : (lang === 'en' ? 'Your turn · pick a target (marked gold) and an attack.' : 'Tvůj tah · vyber cíl (zlatě označený) a způsob útoku.')}</div>
            <div class="mb-controls">
                <div>
                    <div class="mb-ctitle">${lang === 'en' ? 'Attacks · risk / reward' : 'Útoky · risk / reward'}</div>
                    <div class="mb-attack-grid">
                        <button class="mb-attack" ${this._busy ? 'disabled' : ''} onclick="MercenaryBattle.attack('jisty')"><strong>${lang === 'en' ? 'Sure strike' : 'Jistý sek'}</strong><small>90% · 14–18 dmg</small></button>
                        <button class="mb-attack" ${this._busy ? 'disabled' : ''} onclick="MercenaryBattle.attack('prudky')"><strong>${lang === 'en' ? 'Fierce lunge' : 'Prudký výpad'}</strong><small>70% · 24–32 dmg</small></button>
                        <button class="mb-attack" ${this._busy ? 'disabled' : ''} onclick="MercenaryBattle.attack('omraceni')"><strong>${lang === 'en' ? 'Stunning blow' : 'Omračující rána'}</strong><small>55% · 20 dmg · stun</small></button>
                    </div>
                    <div class="mb-ctitle" style="margin-top:14px;">${lang === 'en' ? 'Items' : 'Itemy'}</div>
                    <div class="mb-item-grid">
                        ${Object.keys(this.ITEM_DEFS).map(id => {
                            const def = this.ITEM_DEFS[id]; const have = this._items[id] || 0;
                            return `<button class="mb-item-btn" ${this._busy || have <= 0 ? 'disabled' : ''} onclick="MercenaryBattle.useItem('${id}')">${def.icon} ${lang === 'en' ? def.name_en : def.name} ×${have}</button>`;
                        }).join('')}
                    </div>
                </div>
                <div>
                    <div class="mb-ctitle">${lang === 'en' ? 'Tactics & retreat' : 'Taktika a ústup'}</div>
                    <div class="mb-muted" style="margin-bottom:8px;">${this._enemies.filter(e => e.hp > 0).map(e => (lang === 'en' ? e.name_en : e.name)).join(', ')}</div>
                    <div class="mb-actions" style="margin-top:0;">
                        <button class="mb-btn ghost" ${this._busy || !mercAlive ? 'disabled' : ''} onclick="MercenaryBattle.ability()">✦ ${(lang === 'en' ? (merc.ability_en || '').split(':')[0] : (merc.ability || '').split(':')[0]) || (lang === 'en' ? 'Ability' : 'Schopnost')}</button>
                        <button class="mb-btn danger" ${this._busy ? 'disabled' : ''} onclick="MercenaryBattle.escapeBattle()">${lang === 'en' ? 'Retreat' : 'Ustoupit'}</button>
                        <button class="mb-btn danger" ${this._busy ? 'disabled' : ''} onclick="MercenaryBattle.surrender()">${lang === 'en' ? 'Surrender' : 'Vzdát se'}</button>
                    </div>
                    <div class="mb-log">${this._logs.slice(0, 14).map(l => `<p class="${l.type}">${l.icon} ${l.text}</p>`).join('')}</div>
                </div>
            </div>
        </div>`;
    },

    attack: function (kind) {
        if (this._busy) return;
        const lang = this._lang();
        const e = this._enemies[this._target];
        if (!e || e.hp <= 0) { this._log('danger', '⚠', lang === 'en' ? 'Pick a living target first.' : 'Nejdřív vyber živý cíl.'); this.render(); return; }
        this._busy = true;
        const cfg = { jisty: { chance: .9, min: 14, max: 18, crit: 0 }, prudky: { chance: .7, min: 24, max: 32, crit: 15 }, omraceni: { chance: .55, min: 20, max: 20, crit: 5 } }[kind];
        let anyStun = false;
        this._party.filter(p => p.hp > 0).forEach(p => {
            if (e.hp <= 0) return;
            const nm = lang === 'en' ? p.name_en : p.name;
            if (Math.random() >= cfg.chance) { this._log('miss', '↝', lang === 'en' ? `${nm} misses ${e.name_en || e.name}.` : `${nm} útočí na ${e.name} a míjí.`); return; }
            let dmg = cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1)) + p.buff;
            p.buff = 0;
            const crit = Math.random() < (p.crit + cfg.crit) / 100;
            if (crit) dmg = Math.floor(dmg * 1.6);
            e.hp = Math.max(0, e.hp - dmg);
            this._log(crit ? 'crit' : 'hit', crit ? '✹' : '⚔', lang === 'en'
                ? `${crit ? 'Critical hit' : 'Hit'}: ${nm} deals ${dmg} damage to ${e.name_en || e.name}.`
                : `${crit ? 'Kritický zásah' : 'Zásah'}: ${nm} udělá ${e.name} ${dmg} poškození.`);
            if (kind === 'omraceni' && Math.random() < 0.35) anyStun = true;
        });
        this.render();
        setTimeout(() => {
            if (e.hp <= 0) this._log('special', '✦', lang === 'en' ? `${e.name_en || e.name} falls.` : `${e.name} padá do prachu stezky.`);
            if (this._enemies.every(x => x.hp <= 0)) { this.win(); return; }
            this._finishTurn(anyStun);
        }, 420);
    },

    ability: function () {
        if (this._busy) return;
        const merc = this._party[1];
        if (!merc || merc.hp <= 0) return;
        const lang = this._lang();
        this._busy = true;
        if (merc.archId === 'strazce') { merc.hp = Math.min(merc.max, merc.hp + 12); this._log('heal', '✚', lang === 'en' ? 'Fortify restores 12 HP.' : 'Opevnění obnovilo 12 HP.'); }
        else if (merc.archId === 'lovec') { merc.crit += 15; this._log('special', '◎', lang === 'en' ? 'Aimed shot: critical chance rises.' : 'Přesný výstřel: kritická šance vzrostla.'); }
        else { merc.hp = Math.min(merc.max, merc.hp + 24); this._log('heal', '✚', lang === 'en' ? 'The sap ritual restores 24 HP.' : 'Rituál mízy obnovil 24 HP.'); }
        this.render();
        setTimeout(() => this._enemyTurn(), 450);
    },

    useItem: function (id) {
        if (this._busy || !(this._items[id] > 0)) return;
        const lang = this._lang();
        this._items[id]--;
        this._busy = true;
        if (id === 'lektvar') {
            const alive = this._party.filter(p => p.hp > 0);
            const tgt = alive.reduce((a, b) => (a.max - a.hp) >= (b.max - b.hp) ? a : b);
            tgt.hp = Math.min(tgt.max, tgt.hp + 30);
            this._log('heal', '✚', lang === 'en' ? 'The sap potion restores 30 HP.' : 'Lektvar mízy obnovil 30 HP.');
        } else if (id === 'ostri') {
            this._party.forEach(p => { if (p.hp > 0) p.buff += 10; });
            this._log('special', '✦', lang === 'en' ? "The edge is set: next attack +10." : 'Ostří je připravené: další útok +10.');
        } else {
            this._party.forEach(p => { if (p.hp > 0) p.dodge = 0.35; });
            this._log('special', '☁', lang === 'en' ? 'Smoke conceals your position.' : 'Dýmová šiška skryla vaši pozici.');
        }
        this.render();
        setTimeout(() => this._enemyTurn(), 450);
    },

    _finishTurn: function (stun) {
        const lang = this._lang();
        setTimeout(() => {
            if (this._screen !== 'battle') return;
            if (!stun) { this._enemyTurn(); }
            else { this._log('special', '✦', lang === 'en' ? 'The stunning blow holds the Lapkové in place.' : 'Omračující rána drží lapky na místě.'); this._round++; this._busy = false; this.render(); }
        }, 700);
    },

    _enemyTurn: function () {
        const lang = this._lang();
        this._enemies.filter(e => e.hp > 0).forEach(e => {
            const targets = this._party.filter(p => p.hp > 0);
            if (!targets.length) return;
            const tgt = targets[Math.floor(Math.random() * targets.length)];
            const chance = .78 + Math.max(0, this._round - 5) * .04;
            const tnm = lang === 'en' ? tgt.name_en : tgt.name;
            if (Math.random() > chance || Math.random() < tgt.dodge) { this._log('miss', '↝', lang === 'en' ? `${e.name_en || e.name} misses.` : `${e.name} mine.`); return; }
            let dmg = e.atk + Math.floor(Math.random() * 6) + (this._round >= 5 ? Math.floor((this._round - 4) * 1.5) : 0);
            const crit = e.type === 'speh' && Math.random() < 0.32;
            if (crit) dmg = Math.floor(dmg * 1.6);
            tgt.hp = Math.max(0, tgt.hp - dmg);
            this._log(crit ? 'crit' : 'danger', crit ? '✹' : '☠', lang === 'en'
                ? `${e.name_en || e.name} strikes ${tnm} for ${dmg}${crit ? ' (critical)' : ''}.`
                : `${e.name} zasáhne ${tnm} za ${dmg}${crit ? ' kriticky' : ''}.`);
            if (e.type === 'kapo' && Math.random() < 0.22) this._enemies.filter(x => x.hp > 0 && x !== e).forEach(x => x.atk += 2);
        });
        this._party.forEach(p => p.dodge = 0);
        this._round++;
        this._busy = false;
        if (this._party.every(p => p.hp <= 0)) { this.lose(); return; }
        this.render();
    },

    escapeBattle: function () {
        if (this._busy) return;
        const lang = this._lang();
        this._busy = true;
        if (Math.random() < 0.55) {
            this._log('special', '↪', lang === 'en' ? 'The retreat succeeds.' : 'Ústup se podařil.');
            this._loot = null;
            setTimeout(() => this._result('escape'), 500);
        } else {
            this._log('danger', '⚠', lang === 'en' ? 'The retreat fails — the Lapkové catch up.' : 'Ústup selhal — lapkové vás dostihli.');
            setTimeout(() => this._enemyTurn(), 500);
        }
    },

    surrender: function () {
        const lang = this._lang();
        if (confirm(lang === 'en' ? 'Really surrender? The battle ends in defeat.' : 'Opravdu se vzdát? Souboj skončí porážkou.')) {
            this._loot = null;
            this._result('defeat');
        }
    },

    win: function () {
        this._busy = false;
        const grose = 20 + Math.floor(Math.random() * 21);
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
            CellariumSystem.addGrose(grose, { title: this._lang() === 'en' ? 'Lapkové Watch reward' : 'Odměna z Lapkové patroly', source: 'Porta' });
        }
        const bonusPool = ['wild_leather', 'kovani'];
        const bonusId = bonusPool[Math.floor(Math.random() * bonusPool.length)];
        const items = [];
        if (Math.random() < 0.5 && typeof Game !== 'undefined' && Game.addItem) {
            Game.addItem(bonusId, 1);
            items.push(bonusId);
        }
        this._loot = { grose, items };
        this._result('victory');
    },

    lose: function () {
        this._busy = false;
        this._loot = null;
        this._result('defeat');
    },

    _result: function (kind) {
        this._screen = 'result';
        this._resultKind = kind;
        this.render();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    _resultScreen: function () {
        const lang = this._lang();
        const k = this._resultKind;
        const data = {
            victory: ['✦', lang === 'en' ? 'Victory on the Trail' : 'Vítězství na stezce', lang === 'en' ? 'The camp falls silent. Saeculum will remember your step.' : 'Tábor utichl. Saeculum si bude pamatovat tvůj krok.'],
            defeat: ['☠', lang === 'en' ? 'The Trail Broke You' : 'Stezka tě zlomila', lang === 'en' ? 'The Lapkové fire burned out — but not by your hand.' : 'Oheň lapků dohořel, ale ne tvým přičiněním.'],
            escape: ['↪', lang === 'en' ? 'Retreat into Dusk' : 'Ústup do šera', lang === 'en' ? 'You survived the night. Some trails come back around.' : 'Přežili jste noc. Některé stezky se vracejí později.'],
        }[k];
        let lootHtml = '';
        if (this._loot) {
            const parts = [`<div class="mb-loot-card">🪙 <b>${this._loot.grose}</b> ${lang === 'en' ? 'groats' : 'grošů'}</div>`];
            this._loot.items.forEach(id => {
                const item = (typeof ItemsDB !== 'undefined') ? ItemsDB[id] : null;
                const nm = (typeof iName === 'function') ? iName(id) : id;
                parts.push(`<div class="mb-loot-card">${item ? item.icon : '📦'} <b>${nm}</b></div>`);
            });
            lootHtml = `<div class="mb-loot">${parts.join('')}</div>`;
        }
        return `<div class="mb-panel mb-result ${k}">
            <div class="seal">${data[0]}</div>
            <div class="mb-eyebrow">${lang === 'en' ? 'Lapkové Watch — result' : 'Výsledek Lapkové patroly'}</div>
            <h1>${data[1]}</h1>
            <p class="mb-muted">${data[2]}</p>
            ${lootHtml}
            <div class="mb-actions" style="justify-content:center;">
                <button class="mb-btn" onclick="MercenaryBattle.close()">${lang === 'en' ? 'Close' : 'Zavřít'}</button>
            </div>
        </div>`;
    },
};
