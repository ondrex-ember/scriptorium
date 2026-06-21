const IChing = {
	  
	  // === HEXAGRAM DATABASE (všech 64) ===
	  hexagrams: {
		1: {
		  num: 1, name: "Qian (Tvůrčí)", chinese: "乾",
		  lines: "111111",
		  judgment: "Velký úspěch skrze vytrvalost. Síla nebes jedná bez ustání.",
		  effect: { type: "action_boost", value: 1.5, desc: "Všechny akce dnes přinesou +50% výnosu" }
		},
		2: {
		  num: 2, name: "Kun (Přijímající)", chinese: "坤",
		  lines: "000000",
		  judgment: "Úspěch oddaností. Země nese všechno s trpělivostí.",
		  effect: { type: "garden_boost", value: 2, desc: "Zahrada roste 2x rychleji dnes" }
		},
		3: {
		  num: 3, name: "Zhun (Počáteční obtíže)", chinese: "屯",
		  lines: "010001",
		  judgment: "Chaos předchází řádu. Hledej pomoc, nepokračuj unáhleně.",
		  effect: { type: "chaos_reward", value: 3, desc: "První 3 akce selžou, pak najdeš 3 research" }
		},
		4: {
		  num: 4, name: "Meng (Mladická nezkušenost)", chinese: "蒙",
		  lines: "100010",
		  judgment: "Úspěch. Nejsem já, kdo hledá mladého blázna, mladý blázen hledá mě.",
		  effect: { type: "learning", value: 2, desc: "Další vyzkoumaný tech stojí -2 research" }
		},
		5: {
		  num: 5, name: "Xu (Čekání)", chinese: "需",
		  lines: "010111",
		  judgment: "Trpělivost. Pokud jsi upřímný, dosáhneš skvělého úspěchu.",
		  effect: { type: "patience", value: 1.2, desc: "Všechny timery (akce, garden) jdou 20% rychleji" }
		},
		6: {
		  num: 6, name: "Song (Konflikt)", chinese: "訟",
		  lines: "111010",
		  judgment: "Jsi upřímný, ale setkáváš se s překážkami. Střední cesta vede k štěstí.",
		  effect: { type: "conflict", desc: "Ztratíš 5 random items, ale dostaneš 5 research" }
		},
		7: {
		  num: 7, name: "Shi (Armáda)", chinese: "師",
		  lines: "000010",
		  judgment: "Armáda potřebuje vytrvalost a zkušeného muže. Štěstí bez kazu.",
		  effect: { type: "strength", value: 10, desc: "Další Hunt akce přinese garantovaně +10 meat/fat" }
		},
		8: {
		  num: 8, name: "Bi (Držet se pohromadě)", chinese: "比",
		  lines: "010000",
		  judgment: "Štěstí. Zeptej se věštby znovu, zda máš vytrvalost. Žádný kaz.",
		  effect: { type: "unity", desc: "Craft speed zdvojnásoben dnes" }
		},
		9: {
		  num: 9, name: "Xiao Chu (Síla malého)", chinese: "小畜",
		  lines: "110111",
		  judgment: "Úspěch. Husté mraky, žádný déšť z našich západních území.",
		  effect: { type: "small_gains", value: 5, desc: "Získáš 5x každého basic materiálu (rock, stick, fiber)" }
		},
		10: {
		  num: 10, name: "Lü (Chůze)", chinese: "履",
		  lines: "111011",
		  judgment: "Šlápni na ocas tygra. Nekouše tě. Úspěch.",
		  effect: { type: "danger", desc: "Risk/reward: 50% ztratíš vše, 50% zdvojnásobíš inventory" }
		},
		11: {
		  num: 11, name: "Tai (Mír)", chinese: "泰",
		  lines: "000111",
		  judgment: "Malé ustupuje, velké přichází. Štěstí a úspěch.",
		  effect: { type: "peace", value: 1.2, desc: "Perfektní den: +20% ke všemu (akce, craft, garden)" }
		},
		12: {
		  num: 12, name: "Pi (Stagnace)", chinese: "否",
		  lines: "111000",
		  judgment: "Zlí lidé neprospívají vytrvalosti ušlechtilého člověka.",
		  effect: { type: "stagnation", desc: "Dnes nemůžeš studovat tech ani craftit. Jen sbírej." }
		},
		13: {
		  num: 13, name: "Tong Ren (Společenství)", chinese: "同人",
		  lines: "111101",
		  judgment: "Společenství s lidmi ve volném prostoru. Úspěch.",
		  effect: { type: "community", value: 3, desc: "Všechny food recepty dnes dávají +3 porce" }
		},
		14: {
		  num: 14, name: "Da You (Velká držba)", chinese: "大有",
		  lines: "101111",
		  judgment: "Velký úspěch.",
		  effect: { type: "abundance", desc: "Najdeš rare item: preservation_oil nebo holy_water" }
		},
		15: {
		  num: 15, name: "Qian (Skromnost)", chinese: "謙",
		  lines: "000100",
		  judgment: "Úspěch. Ušlechtilý člověk má závěrečný výsledek.",
		  effect: { type: "humility", value: 0.5, desc: "Všechny crafty dnes stojí 50% materiálů" }
		},
		16: {
		  num: 16, name: "Yu (Nadšení)", chinese: "豫",
		  lines: "001000",
		  judgment: "Nadšení. Prospívá ustanovit pomocníky a uvést armády do pohybu.",
		  effect: { type: "enthusiasm", value: 2, desc: "Hunger timer se dnes nepohybuje (nemusíš jíst)" }
		},
		17: {
		  num: 17, name: "Sui (Následování)", chinese: "隨",
		  lines: "011001",
		  judgment: "Velký úspěch skrze vytrvalost. Žádný kaz.",
		  effect: { type: "following", desc: "Získáš automaticky poslední item, který jsi craftil (bonus kopie)" }
		},
		18: {
		  num: 18, name: "Gu (Dílo na zkažené)", chinese: "蠱",
		  lines: "100110",
		  judgment: "Velký úspěch. Prospívá překročit velkou řeku.",
		  effect: { type: "decay_repair", desc: "Pokud máš rozbitou studnu, opraví se zdarma" }
		},
		19: {
		  num: 19, name: "Lin (Přiblížení)", chinese: "臨",
		  lines: "000011",
		  judgment: "Velký úspěch skrze vytrvalost. V osmém měsíci bude neštěstí.",
		  effect: { type: "approach", value: 5, desc: "Další akce (jakákoliv) přinese +5 random items" }
		},
		20: {
		  num: 20, name: "Guan (Kontemplace)", chinese: "觀",
		  lines: "110000",
		  judgment: "Omyl, ale posvátný. Král předkládá oběť.",
		  effect: { type: "contemplation", value: 3, desc: "Meditace: Získáš +3 research, ale nemůžeš dnes nic craftit" }
		},
		21: {
		  num: 21, name: "Shi He (Prokousání se)", chinese: "噬嗑",
		  lines: "101001",
		  judgment: "Úspěch. Prospívá použít právo.",
		  effect: { type: "breakthrough", desc: "Unlock náhodný zamčený recept (i bez tech)" }
		},
		22: {
		  num: 22, name: "Bi (Ozdoba)", chinese: "賁",
		  lines: "100101",
		  judgment: "Úspěch. V malých věcech prospívá mít kam jít.",
		  effect: { type: "beauty", desc: "Všechny crafty dnes dávají +1 bonus item (paper→+1 ink atd.)" }
		},
		23: {
		  num: 23, name: "Bo (Rozpad)", chinese: "剝",
		  lines: "100000",
		  judgment: "Neprospívá mít kam jít.",
		  effect: { type: "decay", desc: "Ztratíš 10% inventáře, ale fireplace se nikdy nevyhasne" }
		},
		24: {
		  num: 24, name: "Fu (Návrat)", chinese: "復",
		  lines: "000001",
		  judgment: "Úspěch. Vstup a výstup bez nemoci. Přátelé přicházejí.",
		  effect: { type: "return", desc: "Všechny itemy, které jsi dnes ztratil, se vrátí zpět" }
		},
		25: {
		  num: 25, name: "Wu Wang (Nevinnost)", chinese: "無妄",
		  lines: "111001",
		  judgment: "Velký úspěch skrze vytrvalost.",
		  effect: { type: "innocence", desc: "Dnes nemůžeš selhat v žádné akci (vše uspěje)" }
		},
		26: {
		  num: 26, name: "Da Chu (Síla velkého)", chinese: "大畜",
		  lines: "100111",
		  judgment: "Vytrvalost přináší štěstí. Nejedení doma přináší štěstí.",
		  effect: { type: "accumulation", value: 2, desc: "Všechny storage limity dnes 2x větší" }
		},
		27: {
		  num: 27, name: "Yi (Výživa)", chinese: "頤",
		  lines: "100001",
		  judgment: "Vytrvalost přináší štěstí. Pozoruj poskytování výživy.",
		  effect: { type: "nourishment", desc: "Všechna jídla dnes dávají 2x delší hunger timer" }
		},
		28: {
		  num: 28, name: "Da Guo (Převaha velkého)", chinese: "大過",
		  lines: "011110",
		  judgment: "Trám se prohýbá. Prospívá mít kam jít. Úspěch.",
		  effect: { type: "excess", desc: "Můžeš dnes craftit i locked recepty (ale potřebuješ materiály)" }
		},
		29: {
		  num: 29, name: "Kan (Propast)", chinese: "坎",
		  lines: "010010",
		  judgment: "Pokud jsi upřímný, máš úspěch v srdci.",
		  effect: { type: "danger_water", desc: "Wetlands akce dnes přináší 3x víc, ale může selhat" }
		},
		30: {
		  num: 30, name: "Li (Přilnutí)", chinese: "離",
		  lines: "101101",
		  judgment: "Vytrvalost přináší štěstí. Úspěch. Pěstuj krávu – štěstí.",
		  effect: { type: "fire", desc: "Fireplace nikdy nevyhasne + svíčka trvá nekonečně dnes" }
		},
		31: {
		  num: 31, name: "Xian (Ovlivnění)", chinese: "咸",
		  lines: "011100",
		  judgment: "Úspěch. Vytrvalost přináší štěstí. Vzít dívku přináší štěstí.",
		  effect: { type: "attraction", value: 5, desc: "Všechny byliny (herbs) v Nature mají dnes +5% drop rate" }
		},
		32: {
		  num: 32, name: "Heng (Trvání)", chinese: "恆",
		  lines: "001110",
		  judgment: "Úspěch. Žádný kaz. Vytrvalost přináší štěstí.",
		  effect: { type: "duration", desc: "Všechny timery dnes jdou 50% pomaleji (více času na vše)" }
		},
		33: {
		  num: 33, name: "Dun (Ústup)", chinese: "遯",
		  lines: "111100",
		  judgment: "Úspěch. V malých věcech prospívá vytrvalost.",
		  effect: { type: "retreat", desc: "Nemůžeš dnes zahájit akce, ale všechny pasivní věci +100%" }
		},
		34: {
		  num: 34, name: "Da Zhuang (Síla velkého)", chinese: "大壯",
		  lines: "001111",
		  judgment: "Vytrvalost přináší štěstí.",
		  effect: { type: "power", value: 3, desc: "Hunting dnes přináší 3x více meat/fat/bone" }
		},
		35: {
		  num: 35, name: "Jin (Pokrok)", chinese: "晉",
		  lines: "101000",
		  judgment: "Mocný princ je poctěn koni v množství.",
		  effect: { type: "progress", value: 5, desc: "Okamžitě získáš +5 research" }
		},
		36: {
		  num: 36, name: "Ming Yi (Ztmavení světla)", chinese: "明夷",
		  lines: "000101",
		  judgment: "Vytrvalost v nepřízni osudu přináší štěstí.",
		  effect: { type: "darkness", desc: "Dnes funguje vše i ve tmě (bez candle/torch)" }
		},
		37: {
		  num: 37, name: "Jia Ren (Rodina)", chinese: "家人",
		  lines: "110101",
		  judgment: "Vytrvalost ženy přináší štěstí.",
		  effect: { type: "family", desc: "Garden dnes sklízí 2x a okamžitě se znovu zasadí" }
		},
		38: {
		  num: 38, name: "Kui (Opozice)", chinese: "睽",
		  lines: "101011",
		  judgment: "V malých věcech, štěstí.",
		  effect: { type: "opposition", desc: "Inverze: Yang→Yin: Crafty stojí víc, ale dávají víc" }
		},
		39: {
		  num: 39, name: "Jian (Překážka)", chinese: "蹇",
		  lines: "010100",
		  judgment: "Prospívá jihozápad. Neprospívá severovýchod.",
		  effect: { type: "obstacle", desc: "První akce selže, druhá uspěje 2x, třetí selže..." }
		},
		40: {
		  num: 40, name: "Jie (Osvobození)", chinese: "解",
		  lines: "001010",
		  judgment: "Prospívá jihozápad. Pokud není kam jít, návrat přináší štěstí.",
		  effect: { type: "liberation", desc: "Všechny cooldowny se resetují (můžeš všechno znovu)" }
		},
		41: {
		  num: 41, name: "Sun (Zmenšení)", chinese: "損",
		  lines: "100011",
		  judgment: "Upřímnost. Velké štěstí. Žádný kaz.",
		  effect: { type: "decrease", desc: "Ztratíš 20% inventáře, ale další craft je zadarmo" }
		},
		42: {
		  num: 42, name: "Yi (Zvětšení)", chinese: "益",
		  lines: "110001",
		  judgment: "Prospívá mít kam jít. Prospívá překročit velkou řeku.",
		  effect: { type: "increase", value: 1.5, desc: "Všechno v inventáři se zvětší o 50%" }
		},
		43: {
		  num: 43, name: "Guai (Průlom)", chinese: "夬",
		  lines: "011111",
		  judgment: "Musí být oznámeno u královského dvora. Upřímně se ozve nebezpečí.",
		  effect: { type: "breakthrough2", desc: "Unlock všechny locked recepty na 24h" }
		},
		44: {
		  num: 44, name: "Gou (Setkání)", chinese: "姤",
		  lines: "111110",
		  judgment: "Dívka je mocná. Neměl by sis brát dívku.",
		  effect: { type: "encounter", desc: "Objeví se NPC 'Tajemný obchodník' (special trades)" }
		},
		45: {
		  num: 45, name: "Cui (Shromáždění)", chinese: "萃",
		  lines: "011000",
		  judgment: "Úspěch. Král přichází do svého chrámu.",
		  effect: { type: "gathering", value: 10, desc: "Získáš 10x random common item" }
		},
		46: {
		  num: 46, name: "Sheng (Vzestup)", chinese: "升",
		  lines: "000110",
		  judgment: "Velký úspěch. Musíš vidět velkého člověka. Žádný strach.",
		  effect: { type: "ascent", desc: "Všechny tech dnes stojí -50% research" }
		},
		47: {
		  num: 47, name: "Kun (Vyčerpání)", chinese: "困",
		  lines: "011010",
		  judgment: "Úspěch. Vytrvalost. Velký člověk přináší štěstí.",
		  effect: { type: "exhaustion", desc: "Hunger klesá 3x rychleji, ale crafty jsou instant" }
		},
		48: {
		  num: 48, name: "Jing (Studna)", chinese: "井",
		  lines: "010110",
		  judgment: "Město může být změněno, ale studna ne.",
		  effect: { type: "well", desc: "Pokud nemáš studnu, objeví se zdarma. Pokud máš, upgrade!" }
		},
		49: {
		  num: 49, name: "Ge (Revoluce)", chinese: "革",
		  lines: "011101",
		  judgment: "Na svůj den budeš důvěryhodný. Velký úspěch skrze vytrvalost.",
		  effect: { type: "revolution", desc: "Reset celého inventáře, ale +20 research" }
		},
		50: {
		  num: 50, name: "Ding (Kotel)", chinese: "鼎",
		  lines: "101110",
		  judgment: "Velké štěstí. Úspěch.",
		  effect: { type: "cauldron", desc: "Všechny alchemy recepty dnes dávají 3x výstup" }
		},
		51: {
		  num: 51, name: "Zhen (Hřmění)", chinese: "震",
		  lines: "001001",
		  judgment: "Úspěch. Hřmění přichází – oh, oh! Smějící se slova – ha, ha!",
		  effect: { type: "shock", desc: "Random chaos: 3 random efekty najednou!" }
		},
		52: {
		  num: 52, name: "Gen (Nehybnost)", chinese: "艮",
		  lines: "100100",
		  judgment: "Nehybnost zad. Nezískáš jeho tělo.",
		  effect: { type: "stillness", desc: "Dnes nemůžeš dělat akce, ale pasivní income 5x" }
		},
		53: {
		  num: 53, name: "Jian (Postupný pokrok)", chinese: "漸",
		  lines: "110100",
		  judgment: "Dívčino oddání přináší štěstí. Vytrvalost přináší štěstí.",
		  effect: { type: "gradual", value: 1.1, desc: "Každá akce dnes +10% lepší než předchozí (stacking)" }
		},
		54: {
		  num: 54, name: "Gui Mei (Vdavky)", chinese: "歸妹",
		  lines: "001011",
		  judgment: "Jednání přináší neštěstí. Nic prospívá.",
		  effect: { type: "marriage", desc: "Všechny párové akce (craft 2x item) zdvojnásobeny" }
		},
		55: {
		  num: 55, name: "Feng (Hojnost)", chinese: "豐",
		  lines: "001101",
		  judgment: "Úspěch. Král ho dosahuje. Nebuď smutný; měl by být jako slunce v poledne.",
		  effect: { type: "abundance2", desc: "Každý item v inventáři +10 kusů" }
		},
		56: {
		  num: 56, name: "Lü (Poutník)", chinese: "旅",
		  lines: "101100",
		  judgment: "Úspěch v malých věcech. Vytrvalost poutníka přináší štěstí.",
		  effect: { type: "wanderer", desc: "Objevíš 5 random items, které jsi nikdy neviděl" }
		},
		57: {
		  num: 57, name: "Xun (Mírnost)", chinese: "巽",
		  lines: "110110",
		  judgment: "Úspěch v malých věcech. Prospívá mít kam jít.",
		  effect: { type: "gentle", value: 0.3, desc: "Všechny negativní efekty dnes -70% síly" }
		},
		58: {
		  num: 58, name: "Dui (Radost)", chinese: "兌",
		  lines: "011011",
		  judgment: "Úspěch. Vytrvalost přináší štěstí.",
		  effect: { type: "joy", desc: "Všichni jsou šťastní: Žádný hunger, žádná tma, vše funguje" }
		},
		59: {
		  num: 59, name: "Huan (Rozptýlení)", chinese: "渙",
		  lines: "110010",
		  judgment: "Úspěch. Král přichází do svého chrámu.",
		  effect: { type: "dispersion", desc: "Dej 50% inventáře pryč, získáš 10 research" }
		},
		60: {
		  num: 60, name: "Jie (Omezení)", chinese: "節",
		  lines: "010011",
		  judgment: "Úspěch. Trpké omezení by nemělo být vytrvalé.",
		  effect: { type: "limitation", desc: "Můžeš mít max 50 každého itemu, ale crafty zadarmo" }
		},
		61: {
		  num: 61, name: "Zhong Fu (Vnitřní pravda)", chinese: "中孚",
		  lines: "110011",
		  judgment: "Prasata a ryby. Štěstí. Prospívá překročit velkou řeku.",
		  effect: { type: "truth", desc: "Odhalení: Vidíš všechny skryté drop rates a šance" }
		},
		62: {
		  num: 62, name: "Xiao Guo (Převaha malého)", chinese: "小過",
		  lines: "001100",
		  judgment: "Úspěch. Vytrvalost přináší štěstí.",
		  effect: { type: "small_exceeding", desc: "Všechny 'small' itemy (fiber, stick...) dnes +200%" }
		},
		63: {
		  num: 63, name: "Ji Ji (Po dovršení)", chinese: "既濟",
		  lines: "010101",
		  judgment: "Úspěch v malých věcech. Vytrvalost přináší štěstí.",
		  effect: { type: "completion", desc: "Unlock achievement 'Mistr I-Ching' + 15 research" }
		},
		64: {
		  num: 64, name: "Wei Ji (Před dovršením)", chinese: "未濟",
		  lines: "101010",
		  judgment: "Úspěch. Malá liška téměř překročila řeku.",
		  effect: { type: "before_completion", desc: "Všechny probíhající akce dokončeny okamžitě" }
		}
	  },
	  
	  // === COIN CASTING ===
	  castReading: function() {
		if (!GameState.inventory.iching_book) { UI.notify("❌ Nemáš Knihu Proměn!"); return; }
		if (IChing.isOnCooldown()) { UI.notify("⏳ Už jsi dnes konzultoval I-Ching!"); return; }
		
		document.getElementById('btn-cast-coins').disabled = true;
		UI.notify("🪙 Házím mince...");
		
		setTimeout(() => {
		  // Zde jsme nahradili "this" za "IChing" - už nikdy neztratí kontext!
		  const hexagram = IChing.generateHexagram();
		  IChing.displayHexagram(hexagram);
		  IChing.applyEffect(hexagram);
		  
		  // Ukládání napojeno na náš nový sjednocený systém
		  GameState.iching.lastCast = Date.now();
		  
		  // Track I-Ching casts
		  if(GameState.achievements) {
			  GameState.achievements.stats.ichingCasts++;
		  }
		  
		  Game.save();
		  UI.renderIChing();
		}, 3000);
	  },
	  
	  // Generate hexagram from coin tosses
	  generateHexagram: function() {
		let lines = "";
		for (let i = 0; i < 6; i++) {
		  let yangCount = 0;
		  for (let j = 0; j < 3; j++) {
			if (Math.random() < 0.5) yangCount++;
		  }
		  lines += (yangCount >= 2) ? "1" : "0";
		}
		const num = parseInt(lines, 2) % 64 + 1;
		return IChing.hexagrams[num];
	  },
	  
	  // Display hexagram
	  displayHexagram: function(hex) {
		const visual = IChing.renderHexagram(hex.lines);
		
		// Tady používáme innerHTML (místo textContent), aby fungovaly naše nové hezké symboly!
		document.getElementById('hexagram-visual').innerHTML = visual; 
		document.getElementById('hex-number').textContent = `Hexagram ${hex.num}`;
		document.getElementById('hex-name').textContent = hex.name;
		document.getElementById('hex-chinese').textContent = hex.chinese;
		document.getElementById('hex-judgment').textContent = hex.judgment;
		
		const effectBox = document.getElementById('hex-effect');
		effectBox.innerHTML = `
		  <h4>🔮 Dnešní vliv:</h4>
		  <p>${hex.effect.desc}</p>
		`;
		
		document.getElementById('hexagram-display').style.display = 'block';
	  },
	  
	  // Render Unicode HTML hexagram
	  renderHexagram: function(lines) {
		let html = "";
		for (let i = 5; i >= 0; i--) {
		  const isYang = lines[i] === "1";
		  const symbol = isYang ? '\u268A' : '\u268B'; 
		  const className = isYang ? 'yang' : 'yin';
		  html += `<div class="iching-line ${className}">${symbol}</div>`;
		}
		return html;
	  },
	  
	  // Apply effect to game
	  applyEffect: function(hex) {
		const effect = hex.effect;
		
		GameState.iching.effect = {
		  type: effect.type,
		  value: effect.value || 1,
		  hexNum: hex.num,
		  appliedAt: Date.now()
		};
		GameState.iching.lastHexagram = {
		  num: hex.num,
		  name: hex.name,
		  chinese: hex.chinese,
		  lines: hex.lines,
		  judgment: hex.judgment,
		  effect: hex.effect
		};
		
		// Immediate effects
		switch(effect.type) {
		  case "progress":
			Game.addItem("research", effect.value);
			UI.notify(`✨ Získal jsi ${effect.value} research!`);
			break;
		  case "abundance":
			const rares = ["preservation_oil", "holy_water"];
			const item = rares[Math.floor(Math.random() * rares.length)];
			Game.addItem(item, 1);
			UI.notify(`✨ Nalezl jsi vzácný předmět: ${item}!`);
			break;
		  case "well":
			if (!GameState.well.built) {
			  GameState.well = { built: true, level: "basic", condition: "clean" };
			  UI.notify("✨ Objevila se studna!");
			} else if (GameState.well.level === "basic") {
			  GameState.well.level = "stone";
			  UI.notify("✨ Studna se vylepšila na kamennou!");
			}
			break;
		  case "completion":
			Game.addItem("research", 15);
			UI.notify("🏆 ACHIEVEMENT: Mistr I-Ching unlocked!");
			break;
		}
		Game.save();
	  },
	  
	  checkEffect: function(context, baseValue) {
		const effect = GameState.iching.effect;
		if (!effect) return baseValue;
		
		const elapsed = Date.now() - effect.appliedAt;
		if (elapsed > 24 * 60 * 60 * 1000) {
		  GameState.iching.effect = null;
		  return baseValue;
		}
		
		switch(effect.type) {
		  case "action_boost": if (context === "action") return baseValue * 1.5; break;
		  case "garden_boost": if (context === "garden_speed") return baseValue * 2; break;
		  case "peace": return baseValue * 1.2;
		  case "craft_safety": if (context === "craft_fail") return 0; break;
		}
		return baseValue;
	  },
	  
	  isOnCooldown: function() {
		if (!GameState.iching.lastCast) return false;
		const elapsed = Date.now() - GameState.iching.lastCast;
		return elapsed < 24 * 60 * 60 * 1000;
	  },
	  
	  getCooldownRemaining: function() {
		if (!IChing.isOnCooldown()) return 0;
		const elapsed = Date.now() - GameState.iching.lastCast;
		return 24 * 60 * 60 * 1000 - elapsed;
	  }
	  
	  };

	
	UI.renderIChing = function() {
    const container = document.getElementById('lore-iching-content');
    if (!container) return;
    
    const hasBook = GameState.inventory.iching_book > 0;
    const hasTech = GameState.researchedTechs.includes('tech_iching') || (GameState.secrets && GameState.secrets.ichingUnlocked);
    
    // Build HTML
    let html = `<h2>${t('library.iching_title')}</h2>`;
    
    if (!hasTech) {
        html += `
            <div style="padding: 40px; text-align: center;">
                <div style="font-size: 4rem; opacity: 0.3; margin-bottom: 20px;">🔒</div>
                <h3 style="color: var(--ink-secondary); margin-bottom: 10px;">${t('library.locked')}</h3>
                <p style="color: var(--ink-secondary); font-size: 14px;">
                    ${t('library.divination_hint')}
                </p>
            </div>
        `;
    } else if (!hasBook) {
        html += `
            <div style="padding: 40px; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 20px;">📜</div>
                <h3 style="color: var(--ink-secondary); margin-bottom: 10px;">${t('library.iching_need_book')}</h3>
                <p style="color: var(--ink-secondary); font-size: 14px; margin-bottom: 20px;">
                    ${t('library.iching_craft_hint')}
                </p>
            </div>
        `;
    } else {
        const onCooldown = IChing.isOnCooldown();
		const lastHex = GameState.iching.lastHexagram;
        
        html += `
            <div class="iching-intro">
                <p>Starobylá čínská kniha věštění. Hoď tři mince šestkrát a odhal hexagram, který mluví o tvém dni.</p>
                ${onCooldown ? `<p class="cooldown-text">Další konzultace za: <span id="iching-timer">--:--:--</span></p>` : ''}
            </div>
            
            <button id="btn-cast-coins" onclick="IChing.castReading()" class="btn-mystical" ${onCooldown ? 'disabled' : ''}>
                🪙 Hodit mince
            </button>
        `;
        
        // Show last hexagram if exists and still in cooldown
        if (onCooldown && lastHex) {
            html += `
                <div id="hexagram-display" style="margin-top: 30px; display: block;">
                    <h3 style="text-align: center; opacity: 0.7; margin-bottom: 15px; font-size: 0.9rem;">Dnešní hexagram:</h3>
                    <div class="hexagram-container">
                        <div class="hexagram-art">${IChing.renderHexagram(lastHex.lines)}</div>
                        <div class="hexagram-info">
                            <h3>Hexagram ${lastHex.num}</h3>
                            <h2>${lastHex.name}</h2>
                            <p class="chinese-char">${lastHex.chinese}</p>
                            <p class="judgment-text">${lastHex.judgment}</p>
                            <div class="effect-box">
                                <h4>🔮 Dnešní vliv:</h4>
                                <p>${lastHex.effect.desc}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Empty placeholder for new cast
            html += `
                <div id="hexagram-display" style="display: none;">
                    <div class="hexagram-container">
                        <div id="hexagram-visual" class="hexagram-art"></div>
                        <div id="hexagram-info">
                            <h3 id="hex-number"></h3>
                            <h2 id="hex-name"></h2>
                            <p id="hex-chinese" class="chinese-char"></p>
                            <p id="hex-judgment" class="judgment-text"></p>
                            <div id="hex-effect" class="effect-box"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Update cooldown timer if needed
        if (onCooldown) {
            setTimeout(() => {
                const updateTimer = () => {
                    const timerEl = document.getElementById('iching-timer');
                    if (!timerEl) return;
                    
                    const remaining = IChing.getCooldownRemaining();
                    if (remaining <= 0) {
                        UI.renderIChing(); // Refresh
                        return;
                    }
                    
                    const hours = Math.floor(remaining / 3600000);
                    const mins = Math.floor((remaining % 3600000) / 60000);
                    const secs = Math.floor((remaining % 60000) / 1000);
                    
                    timerEl.textContent = `${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
                };
                
                updateTimer();
                const timerInterval = setInterval(updateTimer, 1000);
                
                // Clear interval after 24h
                setTimeout(() => clearInterval(timerInterval), 24 * 60 * 60 * 1000);
            }, 100);
        }
    }
    
    container.innerHTML = html;
};