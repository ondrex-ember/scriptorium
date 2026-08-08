// ═══════════════════════════════════════════════════════════════════════════════
// TAVERN DICE SYSTEM — Vrhcáby & Středověký Hazard v Hospodě
// 3 historical dice games: Hazard (2d6 Craps), Passage (3d6), Zara (3d6)
// ═══════════════════════════════════════════════════════════════════════════════

const TavernDice = {
  activeGame: 'hazard', // 'hazard' | 'passage' | 'zara'
  bet: 10,
  mainNumber: 7, // for Hazard (5..9)
  zaraTarget: 10, // for Zara (3..18)

  // State for multi-roll games like Hazard
  hazardState: {
    phase: 'main', // 'main' | 'chance'
    main: 7,
    chance: null,
    history: []
  },

  streak: 0, // Hot streak counter
  lastResult: null, // { win: boolean|null, payout: number, msg: string, dice: [], caught?: boolean }
  isRolling: false,
  useLoadedDice: false,

  // Web Audio sound effects for dice rolling
  playDiceSound: function() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = (typeof AudioSystem !== 'undefined' && AudioSystem.ctx) ? AudioSystem.ctx : new AudioCtxClass();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      // Cup rattle noise (series of soft wood/bone rattle clicks)
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const bufSize = Math.floor(ctx.sampleRate * 0.04);
          const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / bufSize, 3);
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1600 + Math.random() * 800;
          const gain = ctx.createGain();
          gain.gain.value = 0.18;
          src.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          src.start();
        }, i * 110 + Math.random() * 30);
      }

      // Final wood thud when dice hit table
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.45, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }, 1000);
    } catch (e) {
      console.warn("TavernDice sound error:", e);
    }
  },

  setGame: function(game) {
    if (this.isRolling) return;
    this.activeGame = game;
    this.resetHazardState();
    this.lastResult = null;
    this.render();
  },

  resetHazardState: function() {
    this.hazardState = {
      phase: 'main',
      main: this.mainNumber,
      chance: null,
      history: []
    };
  },

  setBet: function(amt) {
    if (this.isRolling) return;
    const coins = (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) ? CellariumSystem.getGrose() : (GameState.coins || 0);
    let val = parseInt(amt) || 10;
    if (val < 1) val = 1;
    if (val > coins && coins > 0) val = coins;
    this.bet = val;
    this.render();
  },

  setBetAllIn: function() {
    const coins = (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) ? CellariumSystem.getGrose() : (GameState.coins || 0);
    this.setBet(coins);
  },

  parleyDouble: function() {
    if (this.isRolling || !this.lastResult || !this.lastResult.win) return;
    const coins = (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) ? CellariumSystem.getGrose() : (GameState.coins || 0);
    const targetBet = this.lastResult.payout || (this.bet * 2);
    const parleyAmt = Math.min(coins, targetBet);
    if (parleyAmt <= 0) return;
    this.bet = parleyAmt;
    this.roll();
  },

  toggleLoadedDice: function() {
    if (this.isRolling) return;
    this.useLoadedDice = !this.useLoadedDice;
    this.render();
  },

  rollDice: function(numDice) {
    const dice = [];
    for (let i = 0; i < numDice; i++) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice;
  },

  // Main action: execute roll
  roll: function() {
    if (this.isRolling) return;
    const coins = (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) ? CellariumSystem.getGrose() : (GameState.coins || 0);
    if (coins < this.bet) {
      if (typeof NotificationSystem !== 'undefined') NotificationSystem.show("Nemáš dostatek grošů!", "error");
      return;
    }

    // Check loaded dice risk (5% chance of being caught)
    const hasLoaded = (GameState.inventory['loaded_dice'] || 0) > 0;
    if (this.useLoadedDice && hasLoaded) {
      const caught = Math.random() < 0.05; // 5% risk
      if (caught) {
        const fine = Math.min(coins, 100);
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.spendGrose) CellariumSystem.spendGrose(Math.min(coins, fine + this.bet));
        else GameState.coins = Math.max(0, GameState.coins - fine - this.bet);
        if (GameState.persona && GameState.persona.influence) {
          GameState.persona.influence.benedikt = Math.max(0, (GameState.persona.influence.benedikt || 0) - 10);
        }
        this.streak = 0;
        this.useLoadedDice = false;
        this.lastResult = {
          win: false,
          payout: 0,
          caught: true,
          msg: `🚨 ODHALEN PŘI PODVODU! Šenkýř Benedikt tě přistihl s cinknutými kostkami! Zkonfiskoval sázku (${this.bet} g), uložil pokutu ${fine} g a reputace klesla!`,
          dice: [1, 1]
        };
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this.render();
        return;
      }
    }

    // Deduct bet if at start of game or main roll
    if (this.activeGame !== 'hazard' || this.hazardState.phase === 'main') {
      if (typeof CellariumSystem !== 'undefined' && CellariumSystem.spendGrose) CellariumSystem.spendGrose(this.bet);
      else GameState.coins -= this.bet;
    }

    this.isRolling = true;
    this.playDiceSound();
    this.render();

    setTimeout(() => {
      this.isRolling = false;
      this.evaluateGame();
      if (typeof Game !== 'undefined' && Game.save) Game.save();
      this.render();
    }, 1200);
  },

  evaluateGame: function() {
    const hasLoaded = this.useLoadedDice && (GameState.inventory['loaded_dice'] || 0) > 0;

    if (this.activeGame === 'hazard') {
      this.evalHazard(hasLoaded);
    } else if (this.activeGame === 'passage') {
      this.evalPassage(hasLoaded);
    } else if (this.activeGame === 'zara') {
      this.evalZara(hasLoaded);
    }
  },

  evalHazard: function(hasLoaded) {
    let dice = this.rollDice(2);
    let sum = dice[0] + dice[1];

    if (hasLoaded && Math.random() < 0.15) {
      if (this.hazardState.phase === 'main') {
        const target = this.mainNumber;
        const d1 = Math.min(6, Math.max(1, Math.floor(target / 2)));
        const d2 = target - d1;
        if (d2 >= 1 && d2 <= 6) { dice = [d1, d2]; sum = target; }
      } else if (this.hazardState.phase === 'chance') {
        const target = this.hazardState.chance;
        const d1 = Math.min(6, Math.max(1, Math.floor(target / 2)));
        const d2 = target - d1;
        if (d2 >= 1 && d2 <= 6) { dice = [d1, d2]; sum = target; }
      }
    }

    const main = this.mainNumber;

    if (this.hazardState.phase === 'main') {
      this.hazardState.main = main;
      // Nick (Instant Win)
      let isNick = false;
      if (sum === main) isNick = true;
      else if ((main === 6 || main === 8) && sum === 12) isNick = true;
      else if (main === 7 && sum === 11) isNick = true;

      // Crabs / Outs (Instant Loss)
      let isCrabs = false;
      if (sum === 2 || sum === 3) isCrabs = true;
      else if ((main === 5 || main === 9) && (sum === 11 || sum === 12)) isCrabs = true;
      else if ((main === 6 || main === 8) && sum === 11) isCrabs = true;
      else if (main === 7 && sum === 12) isCrabs = true;

      if (isNick) {
        const payout = this.bet * 2;
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(payout);
        else GameState.coins += payout;
        this.streak++;
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playCink) AudioSystem.playCink(1.2);
        this.lastResult = {
          win: true,
          payout: payout,
          msg: `🎉 VÝHRA! NICK! Padl součet ${sum} (${dice.join('+')}). Získáváš ${payout} grošů!`,
          dice: dice
        };
        this.resetHazardState();
      } else if (isCrabs) {
        this.streak = 0;
        this.lastResult = {
          win: false,
          payout: 0,
          msg: `💀 PROHRA! CRABS / OUTS! Padl součet ${sum} (${dice.join('+')}). Ztrácíš ${this.bet} grošů.`,
          dice: dice
        };
        this.resetHazardState();
      } else {
        // Set Chance Point
        this.hazardState.phase = 'chance';
        this.hazardState.chance = sum;
        this.hazardState.history.push(sum);
        this.lastResult = {
          win: null,
          payout: 0,
          msg: `🎲 PADLA ŠANCE (CHANCE) = ${sum}! Nyní házíš znovu: vyhráváš při ${sum}, prohráváš při ${main}.`,
          dice: dice
        };
      }
    } else {
      // Chance phase roll
      const chance = this.hazardState.chance;
      this.hazardState.history.push(sum);

      if (sum === chance) {
        const payout = this.bet * 2;
        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(payout);
        else GameState.coins += payout;
        this.streak++;
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playCink) AudioSystem.playCink(1.2);
        this.lastResult = {
          win: true,
          payout: payout,
          msg: `🎉 VÝHRA! Padla tvoje Šance ${chance} (${dice.join('+')})! Získáváš ${payout} grošů!`,
          dice: dice
        };
        this.resetHazardState();
      } else if (sum === main) {
        this.streak = 0;
        this.lastResult = {
          win: false,
          payout: 0,
          msg: `💀 PROHRA! Padl původní Main ${main} (${dice.join('+')}). Ztrácíš sázku ${this.bet} grošů.`,
          dice: dice
        };
        this.resetHazardState();
      } else {
        this.lastResult = {
          win: null,
          payout: 0,
          msg: `🎲 Házíš dál! Padlo ${sum} (${dice.join('+')}). Cíl: Šance ${chance} (výhra) vs Main ${main} (prohra).`,
          dice: dice
        };
      }
    }
  },

  evalPassage: function(hasLoaded) {
    let dice = this.rollDice(3);
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const hasPair = Object.values(counts).some(c => c >= 2);
    let sum = dice[0] + dice[1] + dice[2];

    if (hasLoaded && Math.random() < 0.15) {
      dice = [5, 5, 3];
      sum = 13;
    }

    const isWin = (sum > 10) && hasPair;

    if (isWin) {
      const payout = Math.floor(this.bet * 1.95);
      if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(payout);
      else GameState.coins += payout;
      this.streak++;
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playCink) AudioSystem.playCink(1.2);
      this.lastResult = {
        win: true,
        payout: payout,
        msg: `🎉 VÝHRA! Padla dvojice se součtem ${sum} (${dice.join('+')}) > 10! Vyhráváš ${payout} grošů!`,
        dice: dice
      };
    } else {
      this.streak = 0;
      let reason = !hasPair ? "chybí dvojice stejných čísel" : `součet ${sum} je pod 10`;
      this.lastResult = {
        win: false,
        payout: 0,
        msg: `💀 PROHRA! Padlo ${dice.join('+')} (součet ${sum}) — ${reason}. Ztrácíš ${this.bet} grošů.`,
        dice: dice
      };
    }
  },

  evalZara: function(hasLoaded) {
    let dice = this.rollDice(3);
    let sum = dice[0] + dice[1] + dice[2];
    const target = this.zaraTarget;

    if (hasLoaded && Math.random() < 0.15) {
      const p1 = Math.min(6, Math.max(1, Math.floor(target / 3)));
      const p2 = Math.min(6, Math.max(1, Math.floor((target - p1) / 2)));
      const p3 = target - p1 - p2;
      if (p3 >= 1 && p3 <= 6) { dice = [p1, p2, p3]; sum = target; }
    }

    let mult = 1.8;
    if (target === 3 || target === 18) mult = 12.0;
    else if (target === 4 || target === 17) mult = 8.0;
    else if (target === 5 || target === 16) mult = 5.0;
    else if (target === 6 || target === 15) mult = 4.0;
    else if (target === 7 || target === 14) mult = 3.0;
    else if (target === 8 || target === 13) mult = 2.5;

    if (sum === target) {
      const payout = Math.floor(this.bet * mult);
      if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(payout);
      else GameState.coins += payout;
      this.streak++;
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playCink) AudioSystem.playCink(1.2);
      this.lastResult = {
        win: true,
        payout: payout,
        msg: `🎉 VÝHRA! ZARA! Přesně trefeno cílové číslo ${target}! (${dice.join('+')} = ${sum}). Kurz ${mult}× → Vyhráváš ${payout} grošů!`,
        dice: dice
      };
    } else {
      this.streak = 0;
      this.lastResult = {
        win: false,
        payout: 0,
        msg: `💀 PROHRA! Padlo ${dice.join('+')} = ${sum} (vsazeno na ${target}). Ztrácíš ${this.bet} grošů.`,
        dice: dice
      };
    }
  },

  render: function() {
    const el = document.getElementById('tavern-dice-container');
    if (!el) return;

    const coins = (typeof CellariumSystem !== 'undefined' && CellariumSystem.getGrose) ? CellariumSystem.getGrose() : (GameState.coins || 0);
    const lang = (GameState.settings && GameState.settings.language) || 'cs';
    const hasLoaded = (GameState.inventory['loaded_dice'] || 0) > 0;

    let h = `
      <div style="background: rgba(20, 15, 10, 0.92); border: 2px solid #c5a059; border-radius: 10px; padding: 18px; color: #f5e6c8; box-shadow: 0 8px 24px rgba(0,0,0,0.5); font-family: 'Cinzel', serif, sans-serif; position: relative; overflow: hidden;">
        
        <!-- Background header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(197, 160, 89, 0.4); padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0; color: #e6c687; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
              🎲 <span>${lang==='en'?'Medieval Dice Gambling':'Středověký Hazard & Vrhcáby'}</span>
            </h3>
            <div style="font-size: 0.78rem; color: #a89474; margin-top: 3px; font-style: italic;">
              "Surová krčemní hra v kostky. Vsaď, kolik odvahy máš — i celý měšec grošů."
            </div>
          </div>
          <div style="text-align: right; background: rgba(0,0,0,0.4); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(197,160,89,0.3);">
            <span style="font-size: 0.72rem; color: #aaa; text-transform: uppercase;">Měšec:</span>
            <div style="font-size: 1.1rem; font-weight: bold; color: #ffd700;">💰 ${coins} g</div>
          </div>
        </div>

        <!-- Hot Streak Banner -->
        ${this.streak >= 3 ? `
          <div style="background: linear-gradient(90deg, #d35400, #f39c12); color: #fff; padding: 8px 12px; border-radius: 6px; text-align: center; font-weight: bold; font-size: 0.85rem; margin-bottom: 14px; box-shadow: 0 0 12px rgba(243, 156, 18, 0.6);">
            🔥 SÉRIE VÝHER (${this.streak}× v řadě)! Šenkýř nervózně přihlíží a hosté v krčmě hlučně fandí!
          </div>
        ` : ''}

        <!-- Game Selector Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button onclick="TavernDice.setGame('hazard')" class="craft-btn" style="flex: 1; padding: 6px 4px; font-size: 0.7rem; white-space: normal; line-height: 1.25; background: ${this.activeGame==='hazard'?'var(--accent-gold)':'rgba(255,255,255,0.08)'}; color: ${this.activeGame==='hazard'?'#000':'#f5e6c8'}; border: 1px solid #c5a059;">
            🎲 Hazard (2d6)
          </button>
          <button onclick="TavernDice.setGame('passage')" class="craft-btn" style="flex: 1; padding: 6px 4px; font-size: 0.7rem; white-space: normal; line-height: 1.25; background: ${this.activeGame==='passage'?'var(--accent-gold)':'rgba(255,255,255,0.08)'}; color: ${this.activeGame==='passage'?'#000':'#f5e6c8'}; border: 1px solid #c5a059;">
            🎲 Passage (3d6)
          </button>
          <button onclick="TavernDice.setGame('zara')" class="craft-btn" style="flex: 1; padding: 6px 4px; font-size: 0.7rem; white-space: normal; line-height: 1.25; background: ${this.activeGame==='zara'?'var(--accent-gold)':'rgba(255,255,255,0.08)'}; color: ${this.activeGame==='zara'?'#000':'#f5e6c8'}; border: 1px solid #c5a059;">
            🎲 Zara (3d6)
          </button>
        </div>

        <!-- Game Info & Controls -->
        <div style="background: rgba(0,0,0,0.35); padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px dashed rgba(197,160,89,0.3);">
    `;

    if (this.activeGame === 'hazard') {
      h += `
        <div style="font-size: 0.82rem; line-height: 1.4; color: #ddd;">
          <strong>📜 Pravidla hry Hazard (2 kostky):</strong><br>
          Zvol cíl <strong>Main</strong> (5–9). Okamžitá výhra při shodu/NICK, prohra při 2, 3 nebo CRABS. Jiné číslo vytvoří <strong>Šanci (Chance)</strong> — hází se dál, dokud nepadne Šance (výhra) nebo Main (prohra).
        </div>
        <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
          <label style="font-size: 0.85rem; color: #e6c687;">Zvol Main:</label>
          <select id="select-hazard-main" onchange="TavernDice.mainNumber = parseInt(this.value); TavernDice.resetHazardState(); TavernDice.render();" ${this.hazardState.phase === 'chance' ? 'disabled' : ''} style="background: #2b2219; color: #ffd700; border: 1px solid #c5a059; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
            <option value="5" ${this.mainNumber===5?'selected':''}>Main 5</option>
            <option value="6" ${this.mainNumber===6?'selected':''}>Main 6</option>
            <option value="7" ${this.mainNumber===7?'selected':''}>Main 7 (Klasika)</option>
            <option value="8" ${this.mainNumber===8?'selected':''}>Main 8</option>
            <option value="9" ${this.mainNumber===9?'selected':''}>Main 9</option>
          </select>
          ${this.hazardState.phase === 'chance' ? `
            <span style="background: #8e44ad; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">
              🎯 ŠANCE (CHANCE) = ${this.hazardState.chance} | Main = ${this.hazardState.main}
            </span>
          ` : ''}
        </div>
      `;
    } else if (this.activeGame === 'passage') {
      h += `
        <div style="font-size: 0.82rem; line-height: 1.4; color: #ddd;">
          <strong>📜 Pravidla hry Passage (3 kostky):</strong><br>
          Blesková hospodská řežba! Pro výhru musíte hodit <strong>součet nad 10 A ZÁROVEŇ alespoň dvojici stejných čísel</strong> (např. 5-5-2 = 12). Vše ostatní prohrává!
        </div>
      `;
    } else if (this.activeGame === 'zara') {
      h += `
        <div style="font-size: 0.82rem; line-height: 1.4; color: #ddd;">
          <strong>📜 Pravidla hry Zara (3 kostky):</strong><br>
          Před hodem zvol přesný součet 3 kostek (3 až 18). Vzácnější součty mají obří kurz výhry!
        </div>
        <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
          <label style="font-size: 0.85rem; color: #e6c687;">Tipuj součet (3-18):</label>
          <input type="number" min="3" max="18" value="${this.zaraTarget}" onchange="TavernDice.zaraTarget = Math.max(3, Math.min(18, parseInt(this.value)||10)); TavernDice.render();" style="width: 60px; background: #2b2219; color: #ffd700; border: 1px solid #c5a059; padding: 4px; text-align: center; font-weight: bold; border-radius: 4px;">
          <span style="font-size: 0.8rem; color: #aaa;">
            Kurz výhry: <strong style="color:#5a9;">${this.zaraTarget===3||this.zaraTarget===18?'12×':this.zaraTarget===4||this.zaraTarget===17?'8×':this.zaraTarget===5||this.zaraTarget===16?'5×':this.zaraTarget===6||this.zaraTarget===15?'4×':this.zaraTarget===7||this.zaraTarget===14?'3×':this.zaraTarget===8||this.zaraTarget===13?'2.5×':'1.8×'}</strong>
          </span>
        </div>
      `;
    }

    h += `</div>`; // end Game info

    // Dice Table Display Area
    h += `
      <div style="background: radial-gradient(circle, #3a2717 0%, #1a1008 100%); border: 3px solid #5c3c1e; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px; min-height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);">
    `;

    if (this.isRolling) {
      h += `
        <div style="font-size: 2.2rem; display: flex; gap: 15px;">
          <span style="display:inline-block; transform: rotate(15deg);">🎲</span>
          <span style="display:inline-block; transform: rotate(-20deg);">🎲</span>
          ${this.activeGame !== 'hazard' ? '<span style="display:inline-block; transform: rotate(10deg);">🎲</span>' : ''}
        </div>
        <div style="margin-top: 10px; font-style: italic; color: #e6c687; font-size: 0.88rem;">
          "Kostky chrastí v koženém poháru a dopadají na dubový stůl..."
        </div>
      `;
    } else if (this.lastResult && this.lastResult.dice) {
      const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      h += `
        <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 10px;">
          ${this.lastResult.dice.map(val => `
            <div style="width: 50px; height: 50px; background: #fff8eb; color: #2b1704; border: 2px solid #8b5a2b; border-radius: 8px; font-size: 2.2rem; display: flex; align-items: center; justify-content: center; box-shadow: 2px 4px 10px rgba(0,0,0,0.5); font-weight: bold;">
              ${diceFaces[val - 1] || val}
            </div>
          `).join('')}
        </div>
        <div style="font-size: 0.95rem; font-weight: bold; color: ${this.lastResult.win === true ? '#2ecc71' : this.lastResult.win === false ? '#e74c3c' : '#f1c40f'}; padding: 0 10px;">
          ${this.lastResult.msg}
        </div>
      `;
    } else {
      h += `
        <div style="font-size: 2.5rem; opacity: 0.4;">🎲 🎲 ${this.activeGame !== 'hazard' ? '🎲' : ''}</div>
        <div style="color: #aaa; font-size: 0.85rem; margin-top: 6px;">Zvol výši sázky a hoď kostky na stůl.</div>
      `;
    }

    h += `</div>`; // end dice table

    // Parley (Double or Nothing) Banner if previous turn was a win
    if (!this.isRolling && this.lastResult && this.lastResult.win && coins > 0) {
      const parleyVal = Math.min(coins, this.lastResult.payout || (this.bet * 2));
      h += `
        <div style="background: rgba(211, 84, 0, 0.22); border: 1px solid #e67e22; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 0.82rem; color: #f39c12;">
            <strong>💥 CHAMTIVOST VOLÁ (DOUBLE OR NOTHING):</strong><br>
            Ponechat výhru na stole a vsadit <strong>${parleyVal} g</strong> o dvojnásobek?
          </div>
          <button onclick="TavernDice.parleyDouble()" class="craft-btn" style="background: linear-gradient(180deg, #e67e22, #d35400); color: #fff; font-weight: bold; font-size: 0.85rem; padding: 6px 14px; border: none; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
            🔥 Hráno o ${parleyVal} g!
          </button>
        </div>
      `;
    }

    // Betting controls & Action Button
    h += `
      <div style="background: rgba(0,0,0,0.4); padding: 14px; border-radius: 8px; border: 1px solid rgba(197,160,89,0.2);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="font-size: 0.8rem; color: #a89474;">Sázka:</span>
            <button onclick="TavernDice.setBet(10)" class="craft-btn" style="padding: 4px 8px; font-size: 0.75rem;">10 g</button>
            <button onclick="TavernDice.setBet(50)" class="craft-btn" style="padding: 4px 8px; font-size: 0.75rem;">50 g</button>
            <button onclick="TavernDice.setBet(100)" class="craft-btn" style="padding: 4px 8px; font-size: 0.75rem;">100 g</button>
            <button onclick="TavernDice.setBet(500)" class="craft-btn" style="padding: 4px 8px; font-size: 0.75rem;">500 g</button>
            <button onclick="TavernDice.setBetAllIn()" class="craft-btn" style="padding: 4px 8px; font-size: 0.75rem; white-space: normal; line-height: 1.2; background: #c0392b; color: #fff; font-weight: bold;">
              💀 ALL IN (${coins} g)
            </button>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <input type="number" min="1" max="${coins}" value="${this.bet}" onchange="TavernDice.setBet(this.value)" style="width: 80px; background: #1a120b; color: #ffd700; border: 1px solid #c5a059; padding: 5px; font-weight: bold; border-radius: 4px; text-align: center;">
            <span style="font-size: 0.85rem; color: #ffd700;">g</span>
          </div>
        </div>

        <!-- Loaded Dice Toggle -->
        ${hasLoaded ? `
          <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #e67e22;">
            <input type="checkbox" id="chk-loaded-dice" ${this.useLoadedDice ? 'checked' : ''} onchange="TavernDice.toggleLoadedDice()">
            <label for="chk-loaded-dice" style="cursor: pointer;">
              🎲 <strong>Použít Cinknuté kostky</strong> (+15% výhra, 5% riziko odhalení šenkýřem!)
            </label>
          </div>
        ` : ''}

        <!-- Main Roll Button -->
        <button onclick="TavernDice.roll()" ${this.isRolling || coins < this.bet ? 'disabled' : ''} class="craft-btn" style="width: 100%; padding: 12px; font-size: 1.05rem; font-weight: bold; background: linear-gradient(180deg, #c5a059, #8b5a2b); color: #fff; border: 1px solid #ffd700; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: 1px;">
          🎲 ${this.isRolling ? 'Kostky se kutálí...' : `HOĎ KOSTKY (Sázka ${this.bet} g)`}
        </button>
      </div>

      </div>
    `;

    el.innerHTML = h;
  }
};