// ═══════════════════════════════════════════════════════════════════════════════
//  RiskStack — "Sázka s Lapky"
//  eventy-audit-mrd (05.09.2026) §4.1 — 3. volba u road_lapkove_armed /
//  road_lapkove_mercenary, vedle "Podplatit" a "Nechat se obrat".
//
//  Zjednodušená verze Bouvardova prototypu (risk-stack-lapkove.html):
//  JEDNO kolo místo tří, žádní 3 NPC soupeři/archetypy, žádný localStorage —
//  jen kostka, hromádka bodů, pochodeň rizika. Plný 3kolový turnaj (a jeho
//  přesun do Hospody jako sázková hra o groše) je odložený, samostatný krok
//  — viz diskuze 05.09.2026, bod 4.
//
//  Obtížnost zvednutá oproti prototypu (Bouvard: "přišlo mi to lehké") —
//  START_RISK/RISK_STEP níž, snadno doladitelné jedním číslem.
//
//  Použití (z events.js choice.action()):
//    RiskStack.open({ groseMultiplier: 3 }, (outcome) => {
//        if (outcome.won) { ... groše bonus = outcome.bank * groseMultiplier ... }
//        else { ... stejný postih jako "refuse" volba ... }
//    });
// ═══════════════════════════════════════════════════════════════════════════════

const RiskStack = {
    DIE_DATA: {
        plain:  { risk: 1.0, min: 1, max: 3,  icon: '⚄', label_cs: 'Obyčejná', label_en: 'Plain',  desc_cs: 'nízké riziko · +1–3', desc_en: 'low risk · +1–3' },
        gold:   { risk: 1.6, min: 3, max: 6,  icon: '🎲', label_cs: 'Zlatá',    label_en: 'Gold',   desc_cs: 'střední riziko · +3–6', desc_en: 'medium risk · +3–6' },
        cursed: { risk: 2.3, min: 6, max: 11, icon: '☠',  label_cs: 'Prokletá', label_en: 'Cursed', desc_cs: 'vysoké riziko · +6–11', desc_en: 'high risk · +6–11' },
    },

    START_RISK: 10,   // % — vyšší než Bouvardův prototyp (5%), jednorázová sázka, ne 3 kola
    RISK_STEP: 7,     // % přírůstek za úspěšný hod
    RISK_CAP: 92,

    _die: 'plain',
    _risk: 0,
    _bank: 0,
    _rolls: 0,
    _over: false,
    _resolve: null,
    _opts: null,

    open: function (opts, onResolve) {
        this._opts = opts || {};
        this._resolve = onResolve;
        this._die = 'plain';
        this._risk = this.START_RISK;
        this._bank = 0;
        this._rolls = 0;
        this._over = false;
        this._mount();
    },

    _lang: function () {
        return (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language === 'en') ? 'en' : 'cs';
    },

    _mount: function () {
        if (document.getElementById('riskstack-overlay')) return;
        const el = document.createElement('div');
        el.id = 'riskstack-overlay';
        document.body.appendChild(el);
        this._injectStyles();
        this.render();
    },

    _unmount: function () {
        const el = document.getElementById('riskstack-overlay');
        if (el) el.remove();
    },

    pickDie: function (d) {
        if (this._over) return;
        this._die = d;
        this.render();
    },

    roll: function () {
        if (this._over) return;
        const d = this.DIE_DATA[this._die];
        this._rolls++;
        const willCollapse = Math.random() * 100 < Math.min(this.RISK_CAP, this._risk * d.risk);
        if (willCollapse) {
            this._over = true;
            this._collapsed = true;
            this.render();
            setTimeout(() => this._finish(false), 850);
            return;
        }
        const val = Math.floor(Math.random() * (d.max - d.min + 1)) + d.min;
        this._bank += val;
        this._risk = Math.min(this.RISK_CAP, this._risk + this.RISK_STEP);
        this.render();
    },

    stash: function () {
        if (this._over || this._bank <= 0) return;
        this._over = true;
        this.render();
        setTimeout(() => this._finish(true), 400);
    },

    _finish: function (won) {
        const bank = this._bank;
        this._unmount();
        if (typeof this._resolve === 'function') this._resolve({ won: won, bank: won ? bank : 0 });
    },

    render: function () {
        const el = document.getElementById('riskstack-overlay');
        if (!el) return;
        const en = this._lang() === 'en';
        const d = this.DIE_DATA[this._die];
        const riskShown = Math.round(Math.min(this.RISK_CAP, this._risk * d.risk));
        const torchLevel = Math.min(7, Math.ceil(riskShown / 14.3));

        let statusLine;
        if (this._collapsed) {
            statusLine = en ? 'COLLAPSE! The pouch spills — nothing saved.' : 'KOLAPS! Měšec se rozsype — nic se nezachránilo.';
        } else if (this._over) {
            statusLine = en ? `Stashed. ${this._bank} points secured.` : `Schováno. Zajištěno ${this._bank} bodů.`;
        } else if (this._rolls === 0) {
            statusLine = en ? 'Pick a die and decide how deep you reach.' : 'Vyber kostku a rozhodni se, jak hluboko sáhneš.';
        } else {
            statusLine = en ? `+${this._bank} banked so far. The torch grows hotter.` : `+${this._bank} zatím nahromaděno. Pochodeň sílí.`;
        }

        const dieButtons = Object.keys(this.DIE_DATA).map(key => {
            const dd = this.DIE_DATA[key];
            const sel = key === this._die ? 'selected' : '';
            return `<button class="rs-die ${sel}" onclick="RiskStack.pickDie('${key}')" ${this._over ? 'disabled' : ''}>
                <span class="rs-die-icon">${dd.icon}</span>
                <b>${en ? dd.label_en : dd.label_cs}</b>
                <small>${en ? dd.desc_en : dd.desc_cs}</small>
            </button>`;
        }).join('');

        const torchSegs = Array.from({ length: 7 }).map((_, i) =>
            `<i class="rs-seg${i < torchLevel ? ' hot' : ''}${riskShown >= 60 && i < torchLevel ? ' flicker' : ''}"></i>`
        ).join('');

        el.innerHTML = `
            <div class="rs-wrap">
                <div class="rs-box">
                    <div class="rs-eyebrow">${en ? 'A Wager with Bandits' : 'Sázka s lapky'}</div>
                    <h2>${en ? 'RISK STACK' : 'RISK STACK'}</h2>
                    <div class="rs-risk">
                        <div class="rs-risk-line"><span>${en ? 'Torch of Risk' : 'Pochodeň rizika'}</span><b>${riskShown}%</b></div>
                        <div class="rs-torch">${torchSegs}</div>
                    </div>
                    <div class="rs-dice">${dieButtons}</div>
                    <div class="rs-status">${statusLine}</div>
                    <div class="rs-actions">
                        <button class="rs-btn rs-roll" onclick="RiskStack.roll()" ${this._over ? 'disabled' : ''}>${en ? 'ROLL' : 'HODIT KOSTKOU'}</button>
                        <button class="rs-btn rs-stash" onclick="RiskStack.stash()" ${this._over || this._bank <= 0 ? 'disabled' : ''}>${en ? 'STASH & LEAVE' : 'SCHOVAT A ODEJÍT'}</button>
                    </div>
                </div>
            </div>
        `;
    },

    _injectStyles: function () {
        if (document.getElementById('riskstack-styles')) return;
        const style = document.createElement('style');
        style.id = 'riskstack-styles';
        style.textContent = `
            #riskstack-overlay{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;background:#07100cd9;padding:16px;}
            .rs-wrap{width:min(420px,100%);}
            .rs-box{background:linear-gradient(150deg,#25392c,#14231d);border:1px solid #8b744266;border-radius:10px;padding:26px;box-shadow:0 18px 55px #000a;color:#f4e8c1;font-family:'DM Sans',sans-serif;text-align:center;}
            .rs-box h2{font-family:Cinzel,Georgia,serif;letter-spacing:.06em;margin:2px 0 16px;color:#f2cc70;}
            .rs-eyebrow{color:#f2cc70;text-transform:uppercase;font-size:11px;letter-spacing:.18em;}
            .rs-risk{background:#101813cc;border:1px solid #8f733f55;border-radius:6px;padding:10px 14px;margin-bottom:16px;}
            .rs-risk-line{display:flex;justify-content:space-between;font-weight:700;font-family:Cinzel;font-size:13px;}
            .rs-torch{display:flex;gap:4px;margin-top:8px;}
            .rs-seg{height:11px;flex:1;background:#26332b;border-radius:2px;}
            .rs-seg.hot{background:linear-gradient(#f7b744,#c33d26);}
            .rs-seg.flicker{animation:rs-flicker .55s infinite alternate;}
            @keyframes rs-flicker{to{opacity:.45;transform:scaleY(.75);}}
            .rs-dice{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;}
            .rs-die{cursor:pointer;text-align:center;color:#f7e8bb;background:#192a21;border:1px solid #866d3e;border-radius:6px;padding:10px 6px;transition:.2s;}
            .rs-die:hover:not(:disabled),.rs-die.selected{border-color:#f2cc70;background:#344932;}
            .rs-die:disabled{opacity:.4;cursor:not-allowed;}
            .rs-die-icon{font-size:22px;display:block;}
            .rs-die b{display:block;font-family:Cinzel;font-size:12px;margin-top:4px;}
            .rs-die small{display:block;font-size:9px;opacity:.75;margin-top:3px;line-height:1.3;}
            .rs-status{min-height:32px;color:#f2cc70;font-weight:700;font-size:13px;margin-bottom:14px;font-family:Cinzel;}
            .rs-actions{display:flex;gap:10px;}
            .rs-btn{flex:1;border:0;border-radius:6px;cursor:pointer;padding:12px;font-weight:700;letter-spacing:.03em;transition:.15s;font-family:Cinzel;}
            .rs-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.12);}
            .rs-btn:disabled{opacity:.4;cursor:not-allowed;}
            .rs-roll{background:linear-gradient(135deg,#cb8b32,#9b4d25);color:#fff5d7;}
            .rs-stash{background:#d1a650;color:#2d2515;}
        `;
        document.head.appendChild(style);
    },
};
