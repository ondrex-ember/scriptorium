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

    // ═══════════════════════════════════════════════════════════════════
    //  TAVERN MODE — "RISK STACK: Sázka s Lapky" — plný 3kolový turnaj
    //  eventy-audit-mrd (05.09.2026), diskuze 05.09.2026 bod 3 — věrný
    //  port Bouvardova testovaného HTML prototypu (risk-stack-lapkove.html)
    //  do TavernDice jako 4. hra. Rámování: lapkové, co zrovna sedí v
    //  hospodě u stolu — Kápo/Mazák/Špeh, jeden aktivní na kolo.
    //
    //  Vlastní `_tv*` state, oddělené od overlay single-round modu výš
    //  (ten zůstává beze změny pro road_lapkove_* eventy).
    //
    //  Rozdíly oproti prototypu (vědomé, ne opomenutí):
    //  1) Sázka je skutečná — `TavernDice.bet` grošů, strhne se při
    //     vstupu (CellariumSystem.addGrose), výplata při konci.
    //  2) Prototyp měl `safe` i `total` jako DVA akumulátory se stejnou
    //     hodnotou (stash() plnil oba) — sečteny na konci to fakticky
    //     zdvojovalo skóre. U bodů to nevadilo, u grošů by to byl
    //     neúmyslný duplicitní výherní násobič. Používám jen `safe`.
    //  3) Prototyp měl u remízy "Sudden Death" (nedopracované, jen text).
    //     Zjednodušeno: remíza = sázka vrácena, žádná výhra ani ztráta.
    //  Vyhrát = 2× sázka. Remíza = sázka zpět. Prohra = sázka propadá
    //  (byla stržena při vstupu).
    // ═══════════════════════════════════════════════════════════════════

    _tvDieData: {
        plain:  { risk: 1.0, min: 1, max: 3 },
        gold:   { risk: 1.7, min: 3, max: 6 },
        cursed: { risk: 2.5, min: 6, max: 11 },
    },
    _tvArchetypes: {
        Opilý:   { base: 42, voice: ['Ještě jednu... a pak možná přestanu.', 'Kostky se mi smějí, nebo já jim?'] },
        Mazaný:  { base: 32, voice: ['Vidím ti až do kapsy.', 'Bezpečí je jen dobře načasovaný trik.'] },
        Zoufalý: { base: 55, voice: ['Potřebuju ty body. Teď hned.', 'Když padnu, strhnu tě s sebou.'] },
    },
    _tvLapci: ['Kápo', 'Mazák', 'Špeh'],
    _tvFaces: ['🧔', '🦹', '🗡️'],

    _tv: null, // celý stav partie, null = intro fáze (ještě nezačato)

    _tvLang: function () {
        return (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language === 'en') ? 'en' : 'cs';
    },

    _tvActiveIdx: function () {
        return Math.max(0, Math.min(2, this._tv.round - 1));
    },

    _tvRisk: function (n) {
        const cap = this._tv.mode === 'calm' ? 85 : 90;
        return Math.min(cap, 5 + (this._tv.mode === 'calm' ? n * 4 : n * n * 1.2));
    },

    tvSelectMode: function (mode) {
        if (this._tv) return; // jen na intro obrazovce
        this._tvPendingMode = mode;
        TavernDice.render();
    },

    tvStart: function () {
        const coins = (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) ? CellariumSystem.getGrose() : 0;
        const ante = TavernDice.bet || 10;
        if (coins < ante) return;
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
            CellariumSystem.addGrose(-ante, { title: this._tvLang() === 'en' ? 'Risk Stack ante' : 'Sázka do Risk Stacku', source: 'Hospoda' });
        }
        const names = Object.keys(this._tvArchetypes);
        this._tv = {
            mode: this._tvPendingMode || 'calm',
            ante: ante,
            die: 'plain',
            round: 1,
            risk: 5,
            bank: 0,
            safe: 0,
            bribes: 0,
            bribeTurns: 0,
            challenged: false,
            gameOver: false,
            capoType: names[Math.floor(Math.random() * names.length)],
            capoScores: [0, 0, 0],
            notice: '',
            speech: '',
            speechWho: 'Kápo',
            rolling: false,
            collapsed: false,
        };
        this._tv.speech = this._tvArchetypes[this._tv.capoType].voice[0];
        TavernDice.render();
    },

    tvSelectDie: function (d) {
        if (!this._tv || this._tv.gameOver || this._tv.rolling) return;
        this._tv.die = d;
        TavernDice.render();
    },

    tvRoll: function () {
        const s = this._tv;
        if (!s || s.gameOver || s.rolling) return;
        const d = this._tvDieData[s.die];
        const currentRisk = Math.min(100, s.risk - (s.bribeTurns > 0 ? 12 : 0));
        const hit = Math.random() * 100 < currentRisk * d.risk;
        const mult = s.challenged ? 2 : 1;
        s.rolling = true;
        TavernDice.render();

        setTimeout(() => {
            s.rolling = false;
            if (hit) {
                s.collapsed = true;
                s.bank = 0;
                s.risk = 100;
                s.bribeTurns = 0;
                s.notice = this._tvLang() === 'en' ? 'COLLAPSE! Unbanked points are gone. The game goes on.' : 'KOLAPS! Nezajištěné body jsou pryč. Hra pokračuje.';
                s.speech = this._tvLang() === 'en' ? 'Ha! The dice scattered. Get up and try again.' : 'Ha! Kostky se rozsypaly. Zvedni se a zkus to znovu.';
                s.speechWho = 'Kápo';
                if (s.challenged) s.challenged = false;
                TavernDice.render();
                setTimeout(() => { s.collapsed = false; s.risk = 5; TavernDice.render(); }, 900);
                return;
            }
            let val = Math.floor(Math.random() * (d.max - d.min + 1)) + d.min;
            val *= mult;
            s.bank += val;
            s.capoScores[this._tvActiveIdx()] += Math.floor(val / 3);
            s.risk = Math.min(s.mode === 'calm' ? 85 : 90, this._tvRisk(Math.max(0, Math.round(s.risk / 4 - 1))) * d.risk * (s.challenged ? 1.5 : 1));
            if (s.challenged) s.challenged = false;
            if (s.bribeTurns > 0) s.bribeTurns--;
            s.notice = this._tvLang() === 'en' ? `Success! The die brought +${val} points. Risk rises.` : `Úspěch! Kostka přinesla +${val} bodů. Risk roste.`;
            const arch = this._tvArchetypes[s.capoType];
            s.speech = arch.voice[Math.floor(Math.random() * arch.voice.length)];
            s.speechWho = this._tvLapci[this._tvActiveIdx()];
            TavernDice.render();
        }, 650);
    },

    tvStash: function () {
        const s = this._tv;
        if (!s || s.bank <= 0 || s.gameOver) return;
        s.safe += s.bank;
        s.bank = 0;
        s.notice = this._tvLang() === 'en' ? 'Winnings stashed under the cloak.' : 'Výhra schována pod pláštěm.';
        if (s.round < 3) {
            s.round++;
            s.risk = 5; s.bribes = 0; s.bribeTurns = 0;
            s.speech = this._tvLang() === 'en' ? 'Another round, another debt. Don\'t disappoint me.' : 'Další kolo, další dluh. Nezklam mě.';
            s.speechWho = 'Kápo';
            TavernDice.render();
        } else {
            this._tvFinish();
        }
    },

    tvBribe: function () {
        const s = this._tv;
        if (!s || s.bribes >= 1 || s.safe < 2 || s.gameOver) return;
        s.safe -= 2;
        s.bribes = 1;
        s.bribeTurns = 2;
        s.notice = this._tvLang() === 'en' ? 'Bribe accepted. The torch dims for a while.' : 'Úplatek přijat. Pochodeň na chvíli zhasíná.';
        s.speech = this._tvLang() === 'en' ? 'Two coins? Fine. I\'ll be blind for a while.' : 'Dvě mince? Dobrá. Na chvíli budu slepý.';
        s.speechWho = 'Kápo';
        TavernDice.render();
    },

    tvChallenge: function () {
        const s = this._tv;
        if (!s || s.challenged || s.gameOver) return;
        s.challenged = true;
        s.notice = this._tvLang() === 'en' ? 'KÁPO\'S CHALLENGE! Next roll is doubled — risk and value.' : 'VÝZVA KÁPA! Příští hod je dvojnásobný — risk i hodnota.';
        s.speech = this._tvLang() === 'en' ? 'So you challenge me? Roll and pray.' : 'Tak ty vyzýváš mě? Hoď a modli se.';
        s.speechWho = 'Kápo';
        TavernDice.render();
    },

    _tvFinish: function () {
        const s = this._tv;
        const en = this._tvLang() === 'en';
        s.gameOver = true;

        // Jeden AI tah navíc na konci (mirror prototypu) — dohání ztrátu
        const deficit = Math.max(0, s.safe - (s.capoScores[0] + s.capoScores[1] + s.capoScores[2]) / 3);
        const arch = this._tvArchetypes[s.capoType];
        const threshold = arch.base + deficit * 0.8 + (Math.random() * 15 - 7.5);
        let gain = 0;
        if (Math.random() * 100 < Math.max(15, threshold - s.risk)) gain = Math.floor(3 + Math.random() * 6);
        s.capoScores[0] += gain;

        const player = s.safe; // NE total+safe (viz komentář na začátku sekce — fix duplicitního součtu z prototypu)
        const others = s.capoScores[0] + s.capoScores[1] + s.capoScores[2];
        let outcome, payout;
        if (player > others) {
            outcome = 'win'; payout = s.ante * 2;
        } else if (player === others) {
            outcome = 'draw'; payout = s.ante;
        } else {
            outcome = 'lose'; payout = 0;
        }
        if (payout > 0 && typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
            CellariumSystem.addGrose(payout, {
                title: outcome === 'win' ? (en ? 'Risk Stack — won at the table' : 'Risk Stack — výhra u stolu')
                    : (en ? 'Risk Stack — stake returned' : 'Risk Stack — sázka vrácena'),
                source: 'Hospoda',
            });
        }
        s.result = { outcome, payout, player, others };
        TavernDice.render();
    },

    tvContinue: function () {
        // Zavře souhrnnou obrazovku a vrátí na intro (nová partie)
        this._tv = null;
        this._tvPendingMode = null;
        TavernDice.render();
    },

    renderTavern: function (coins, lang) {
        const en = lang === 'en';
        this._tvInjectTavernStyles();

        if (!this._tv) {
            // ── INTRO — volba cesty (risk křivka) + sázka (sdílená s ostatními hrami) ──
            const mode = this._tvPendingMode || 'calm';
            const ante = TavernDice.bet || 10;
            return `
                <div class="rst-intro">
                    <div class="rst-eyebrow">${en ? 'The Three Dice Inn' : 'Hostinec U Tří kostek'}</div>
                    <h2>RISK STACK</h2>
                    <p>${en
                        ? 'A band of lapkové is drinking at the corner table — and dealing. Bet on luck, or stash your winnings before they smell blood. Three rounds. One barely-held stack of points.'
                        : 'U rohového stolu popíjí (a rozdává) partička lapků. Vsadíš na štěstí, nebo schováš výhru dřív, než ucítí krev? Tři kola. Jedna stěží udržená hromádka bodů.'}</p>
                    <div class="rst-paths">
                        <button class="rst-path ${mode === 'calm' ? 'chosen' : ''}" onclick="RiskStack.tvSelectMode('calm')">
                            <b>${en ? 'The Calm Road' : 'Klidná cesta'}</b>
                            <small>${en ? 'Linear risk<br>5% + n×4% · cap 85%' : 'Lineární risk<br>5 % + n × 4 % · strop 85 %'}</small>
                        </button>
                        <button class="rst-path ${mode === 'wild' ? 'chosen' : ''}" onclick="RiskStack.tvSelectMode('wild')">
                            <b>${en ? 'The Wild Road' : 'Divoká cesta'}</b>
                            <small>${en ? 'Exponential risk<br>5% + n²×1.2% · cap 90%' : 'Exponenciální risk<br>5 % + n² × 1,2 % · strop 90 %'}</small>
                        </button>
                    </div>
                    <div class="rst-ante">${en ? 'Ante' : 'Sázka'}: <strong>${ante} g</strong> <span style="opacity:0.6;">(${en ? 'set above with the other games' : 'nastav výše, sdílené s ostatními hrami'})</span></div>
                    <button class="rst-start" onclick="RiskStack.tvStart()" ${coins < ante ? 'disabled' : ''}>${en ? 'SIT DOWN AT THE TABLE' : 'PŘISEDNOUT KE STOLU'}</button>
                </div>
            `;
        }

        const s = this._tv;

        if (s.gameOver && s.result) {
            const r = s.result;
            const title = r.outcome === 'win' ? (en ? 'VICTORY AT THE TABLE' : 'VÍTĚZSTVÍ U STOLU')
                : r.outcome === 'draw' ? (en ? 'A DRAW — STAKE RETURNED' : 'REMÍZA — SÁZKA VRÁCENA')
                : (en ? 'THE LAPKOVÉ TAKE IT ALL' : 'LAPKOVÉ SI BEROU VŠECHNO');
            const text = r.outcome === 'win'
                ? (en ? `Your haul: ${r.player} points against their ${r.others}. The inn whispers your name.` : `Tvůj lup: ${r.player} bodů proti jejich ${r.others}. Hostinec šeptá tvé jméno.`)
                : r.outcome === 'draw'
                    ? (en ? `Tied at ${r.player} vs ${r.others}. Nobody wins tonight — the ante returns to your purse.` : `Nerozhodně, ${r.player} vs ${r.others}. Dnes nevyhrál nikdo — sázka se vrací do měšce.`)
                    : (en ? `Your ${r.player} points didn't stand a chance against their ${r.others}. Stash your winnings sooner next time.` : `Tvých ${r.player} bodů nemělo šanci proti jejich ${r.others}. Příště schovej výhru dřív.`);
            return `
                <div class="rst-modal">
                    <div class="rst-eyebrow">${en ? 'A Record in the Ledger' : 'Záznam v pergamenu'}</div>
                    <h2>${title}</h2>
                    <p>${text}</p>
                    <div class="rst-summary">
                        <div><b>${r.payout}</b><span>${en ? 'groše paid' : 'grošů vyplaceno'}</span></div>
                        <div><b>${r.player}</b><span>${en ? 'your points' : 'tvé body'}</span></div>
                        <div><b>${r.others}</b><span>${en ? 'lapkové points' : 'body lapků'}</span></div>
                    </div>
                    <button class="rst-start" onclick="RiskStack.tvContinue()">${en ? 'LEAVE THE TABLE' : 'ODEJÍT OD STOLU'}</button>
                </div>
            `;
        }

        // ── HLAVNÍ HERNÍ OBRAZOVKA ──
        const adjustedRisk = Math.max(0, Math.min(100, s.risk - (s.bribeTurns > 0 ? 12 : 0)));
        const torchLevel = Math.min(7, Math.ceil(adjustedRisk / 14.3));
        const torchSegs = Array.from({ length: 7 }).map((_, i) =>
            `<i class="rst-seg${i < torchLevel ? ' hot' : ''}${adjustedRisk >= 60 && i < torchLevel ? ' flicker' : ''}"></i>`
        ).join('');
        const dieButtons = Object.keys(this._tvDieData).map(key => {
            const dd = this._tvDieData[key];
            const labels = {
                plain: { cs: 'Obyčejná', en: 'Plain', d_cs: 'nízké riziko · +1–3 body', d_en: 'low risk · +1–3 pts' },
                gold: { cs: 'Zlatá', en: 'Gold', d_cs: 'střední riziko · +3–6 bodů', d_en: 'medium risk · +3–6 pts' },
                cursed: { cs: 'Prokletá', en: 'Cursed', d_cs: 'vysoké riziko · +6–11 bodů', d_en: 'high risk · +6–11 pts' },
            };
            const icon = key === 'plain' ? '⚄' : key === 'gold' ? '🎲' : '☠';
            const sel = key === s.die ? 'selected' : '';
            return `<button class="rst-die ${sel}" onclick="RiskStack.tvSelectDie('${key}')" ${s.gameOver || s.rolling ? 'disabled' : ''}>
                <span class="rst-die-icon">${icon}</span><b>${en ? labels[key].en : labels[key].cs}</b><small>${en ? labels[key].d_en : labels[key].d_cs}</small>
            </button>`;
        }).join('');

        const crew = this._tvLapci.map((name, i) => `
            <div class="rst-crew">
                <span class="rst-face">${this._tvFaces[i]}</span>
                <div><strong>${name}</strong><small>${i === this._tvActiveIdx() ? (en ? 'active now' : 'právě aktivní') : (en ? 'watching' : 'sleduje')}</small></div>
                <span class="rst-score">${s.capoScores[i]}</span>
            </div>`).join('');

        return `
            <div class="rst-grid">
                <div class="rst-side">
                    <div class="rst-card"><h3>${en ? 'Lapkové' : 'Lapkové'}</h3>${crew}</div>
                </div>
                <div class="rst-center">
                    <div class="rst-hud">
                        <div class="rst-round">${en ? 'Round' : 'Kolo'} ${s.round} / 3</div>
                        <div class="rst-mode-label">${s.mode === 'calm' ? (en ? 'Calm road' : 'Klidná cesta') : (en ? 'Wild road' : 'Divoká cesta')}</div>
                    </div>
                    <div class="rst-stage ${s.rolling ? 'rolling' : ''} ${s.collapsed ? 'collapsed' : ''}">
                        ${s.rolling
                            ? `<div class="rst-rolling-dice">🎲 🎲 🎲</div>`
                            : `<div class="rst-dice-stack"><div class="rst-die-face">⚄</div><div class="rst-die-face">⚁</div><div class="rst-die-face">⚅</div><div class="rst-die-face">⚂</div></div>`}
                    </div>
                    <div class="rst-risk">
                        <div class="rst-risk-line"><span>${en ? 'Torch of Risk' : 'Pochodeň rizika'}</span><b>${Math.round(adjustedRisk)}%</b></div>
                        <div class="rst-torch">${torchSegs}</div>
                    </div>
                    <div class="rst-choices">${dieButtons}</div>
                    <div class="rst-notice">${s.notice || (en ? 'Pick a die and decide how deep you reach.' : 'Vyber kostku a rozhodni se, jak hluboko saháš.')}</div>
                    <div class="rst-actions">
                        <button class="rst-btn rst-roll" onclick="RiskStack.tvRoll()" ${s.gameOver || s.rolling ? 'disabled' : ''}>${en ? 'ROLL' : 'HODIT KOSTKOU'}</button>
                        <button class="rst-btn rst-stash2" onclick="RiskStack.tvStash()" ${s.bank <= 0 || s.gameOver ? 'disabled' : ''}>${en ? 'STASH WINNINGS' : 'SCHOVEJ VÝHRU'}</button>
                        <button class="rst-btn rst-challenge ${s.challenged ? 'active' : ''}" onclick="RiskStack.tvChallenge()" ${s.challenged || s.gameOver ? 'disabled' : ''}>${en ? "KÁPO'S CHALLENGE" : 'VÝZVA KÁPA'} <small>(1×)</small></button>
                    </div>
                    <div class="rst-lower">
                        <div class="rst-mini"><h3>${en ? 'Unbanked points' : 'Nezajištěné body'}</h3><div class="rst-big">${s.bank}</div></div>
                        <div class="rst-mini"><h3>${en ? 'Stashed score' : 'Schované skóre'}</h3><div class="rst-big">${s.safe}</div></div>
                    </div>
                </div>
                <div class="rst-side">
                    <div class="rst-speech"><b>${s.speechWho}</b><span>${s.speech}</span></div>
                    <div class="rst-card"><h3>${en ? 'Leverage' : 'Výhoda'}</h3>
                        <button class="rst-btn rst-stash2" style="width:100%;" onclick="RiskStack.tvBribe()" ${s.bribes >= 1 || s.safe < 2 || s.gameOver ? 'disabled' : ''}>${en ? 'BRIBE · −2 pts' : 'ÚPLATEK · −2 body'}</button>
                        <p style="font-size:11px;color:#aaa786;line-height:1.4;">${s.bribes >= 1 ? (en ? 'Bribe already spent this game.' : 'Úplatek pro tuto partii už padl.') : (en ? 'Lowers risk 12% for the next 2 rolls.' : 'Sníží risk o 12 % na příští 2 hody.')}</p>
                    </div>
                </div>
            </div>
        `;
    },

    _tvInjectTavernStyles: function () {
        if (document.getElementById('riskstack-tavern-styles')) return;
        const style = document.createElement('style');
        style.id = 'riskstack-tavern-styles';
        style.textContent = `
            .rst-intro,.rst-modal{max-width:560px;margin:0 auto;background:linear-gradient(150deg,#e8d29c,#c5a66b);color:#2b2116;border:6px double #634822;border-radius:4px;padding:26px;text-align:center;font-family:'DM Sans',sans-serif;}
            .rst-intro h2,.rst-modal h2{font-family:Cinzel,Georgia,serif;font-size:26px;margin:5px 0;color:#5c2d1d;}
            .rst-intro p,.rst-modal p{line-height:1.6;color:#473521;font-size:0.85rem;}
            .rst-eyebrow{color:#8a5a24;text-transform:uppercase;font-size:10px;letter-spacing:.2em;font-family:Cinzel;}
            .rst-paths{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0;}
            .rst-path{background:#dcc083;border:2px solid #8d6632;padding:12px;text-align:left;cursor:pointer;border-radius:3px;}
            .rst-path:hover,.rst-path.chosen{background:#f0daa4;border-color:#6d2d1e;}
            .rst-path b{font:700 14px Cinzel;color:#6d2d1e;display:block;}
            .rst-path small{display:block;margin-top:5px;line-height:1.35;font-size:10.5px;}
            .rst-ante{margin:10px 0 16px;font-size:0.85rem;color:#473521;}
            .rst-start{background:#6f3024;color:#ffe7ae;width:100%;font:700 13px Cinzel;border:0;border-radius:4px;padding:12px;cursor:pointer;}
            .rst-start:hover:not(:disabled){filter:brightness(1.1);}
            .rst-start:disabled{opacity:.4;cursor:not-allowed;}
            .rst-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0;}
            .rst-summary div{background:#ead49d;padding:10px;border-radius:3px;}
            .rst-summary b{display:block;font:19px Cinzel;color:#6b3923;}
            .rst-summary span{font-size:9px;text-transform:uppercase;}
            .rst-grid{display:grid;grid-template-columns:150px 1fr 150px;gap:14px;align-items:start;color:#f4e8c1;font-family:'DM Sans',sans-serif;}
            @media(max-width:760px){.rst-grid{grid-template-columns:1fr;}}
            .rst-card{background:linear-gradient(145deg,#25392cdd,#14231ddb);border:1px solid #8b744255;border-radius:8px;padding:12px;margin-bottom:10px;}
            .rst-card h3{font-size:11px;color:#f2cc70;margin:0 0 8px;text-transform:uppercase;font-family:Cinzel;}
            .rst-crew{display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #ffffff13;}
            .rst-face{font-size:22px;}
            .rst-crew strong{display:block;font-family:Cinzel;font-size:12px;}
            .rst-crew small{color:#a9a385;font-size:9px;}
            .rst-score{margin-left:auto;color:#f2cc70;font:bold 15px Cinzel;}
            .rst-center{min-width:0;}
            .rst-hud{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
            .rst-round{color:#f2cc70;font:700 14px Cinzel;}
            .rst-mode-label{color:#9f987e;font-size:11px;}
            .rst-stage{min-height:120px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:radial-gradient(ellipse,#45614844,transparent 68%);border-radius:8px;}
            .rst-dice-stack{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
            .rst-die-face{width:38px;height:38px;border-radius:8px;display:grid;place-items:center;font-size:22px;color:#302317;background:linear-gradient(135deg,#f0d27c,#ad6e24);border:2px solid #f9de88;}
            .rst-rolling-dice{font-size:2rem;animation:rst-toss .5s infinite alternate;}
            @keyframes rst-toss{to{transform:translateY(-8px) rotate(8deg);}}
            .rst-stage.collapsed{background:radial-gradient(ellipse,#8b2c2c44,transparent 68%);}
            .rst-risk{background:#101813cc;border:1px solid #8f733f55;border-radius:6px;padding:10px 14px;margin-bottom:12px;}
            .rst-risk-line{display:flex;justify-content:space-between;font-weight:700;font-family:Cinzel;font-size:12px;}
            .rst-torch{display:flex;gap:3px;margin-top:7px;}
            .rst-seg{height:10px;flex:1;background:#26332b;border-radius:2px;}
            .rst-seg.hot{background:linear-gradient(#f7b744,#c33d26);}
            .rst-seg.flicker{animation:rst-flicker .55s infinite alternate;}
            @keyframes rst-flicker{to{opacity:.45;transform:scaleY(.75);}}
            .rst-choices{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;}
            .rst-die{cursor:pointer;text-align:center;color:#f7e8bb;background:#192a21;border:1px solid #866d3e;border-radius:6px;padding:8px 4px;}
            .rst-die:hover:not(:disabled),.rst-die.selected{border-color:#f2cc70;background:#344932;}
            .rst-die:disabled{opacity:.4;cursor:not-allowed;}
            .rst-die-icon{font-size:18px;display:block;}
            .rst-die b{display:block;font-family:Cinzel;font-size:10px;margin-top:2px;}
            .rst-die small{display:block;font-size:8px;opacity:.75;margin-top:2px;line-height:1.2;}
            .rst-notice{min-height:26px;color:#f2cc70;font-weight:700;font-size:11px;margin-bottom:10px;font-family:Cinzel;text-align:center;}
            .rst-actions{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;}
            .rst-btn{flex:1;min-width:100px;border:0;border-radius:5px;cursor:pointer;padding:9px 6px;font-weight:700;font-size:10.5px;letter-spacing:.02em;font-family:Cinzel;}
            .rst-btn:hover:not(:disabled){filter:brightness(1.12);}
            .rst-btn:disabled{opacity:.4;cursor:not-allowed;}
            .rst-roll{background:linear-gradient(135deg,#cb8b32,#9b4d25);color:#fff5d7;}
            .rst-stash2{background:#d1a650;color:#2d2515;}
            .rst-challenge{background:transparent;color:#ef7a68;border:1px solid #b8493d !important;}
            .rst-challenge.active{background:#8b2c2c;color:#ffe0c8;}
            .rst-lower{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
            .rst-mini{background:rgba(0,0,0,0.2);border-radius:6px;padding:8px 10px;}
            .rst-mini h3{font-size:9px;margin:0 0 4px;color:#f2cc70;text-transform:uppercase;font-family:Cinzel;}
            .rst-big{font:bold 18px Cinzel;color:#e4c477;}
            .rst-speech{position:relative;background:#dfc68d;color:#2b2116;padding:12px 10px;border-radius:5px;margin-bottom:10px;font-size:11px;}
            .rst-speech b{display:block;color:#6e3225;font:11px Cinzel;margin-bottom:4px;}
        `;
        document.head.appendChild(style);
    },
};