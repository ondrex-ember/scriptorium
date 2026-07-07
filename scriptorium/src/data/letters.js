// ═══════════════════════════════════════════════════════════════════════════
// LettersDB — obsah Porty (P1, dávka 1: L1–L6 + 2 follow-upy).
// Zdroje: exempla (Vokabulář), anály, městská kniha olomoucká. MRD: templum-reference.md
// Texty inline (title_cs/en, text_cs/en) — vzor Chronicon; engine má fallback na i18n klíče.
// expiry_days: od prvního objevení ve frontě; urgent: ⚡ badge.
// ═══════════════════════════════════════════════════════════════════════════

const LettersDB = [

  // ── L1 — Farář: o falešné zpovědi (předehra Zpovědi) ──
  {
    id: 'l1_farar_zpoved',
    seal: 'village',
    title_cs: 'List faráře Havla',
    title_en: 'A Letter from Father Havel',
    text_cs: '„Ctihodný bratře, doslechl jsem, že zpovídáš. Střez se vlažnosti — u nás vyprávějí o muži, jemuž sám ďábel v kněžském rouše uložil, aby se svého hříchu už nikdy nezpovídal. Váž slova pokání, jež ukládáš. Kraj si je pamatuje déle než ty. — Farář Havel od Panny Marie"',
    text_en: '"Venerable brother, I hear you now take confessions. Beware of laxity — here they tell of a man to whom the devil himself, robed as a priest, assigned the penance of never confessing his sin again. Weigh the penances you set. The countryside remembers them longer than you do. — Father Havel of Our Lady"',
    trigger: function () {
      return typeof TemplumSystem !== 'undefined' && TemplumSystem.isUnlocked();
    },
    choices: [
      {
        label_cs: '📜 Přečíst a uložit', label_en: '📜 Read and file',
        effect: function () {
          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('church', 1);
        },
        notify_cs: 'Farářova slova zůstala v mysli. (Ecclesia +1)',
        notify_en: 'The priest\'s words linger. (Ecclesia +1)'
      }
    ]
  },

  // ── L2 — Křivě obviněná paní Ofka (⚡ 5 dní; první dvoudílný řetěz) ──
  {
    id: 'l2_ofka',
    seal: 'village',
    urgent: true,
    expiry_days: 5,
    title_cs: 'Úpěnlivá prosba písaře Jindřicha',
    title_en: 'A Desperate Plea from Henry the Scribe',
    text_cs: '„Bratře v Kristu, píši za paní Ofku z Újezda. Nalezli u ní zavražděné dítě a krvavý nůž, ona však přísahá nevinu — a já jí věřím, neboť vrah měl důvod ji zničit. Pán ji chce upálit. Přimluvíš-li se, klášter si znepřátelí pána; mlčíš-li, shoří možná nevinná. — Písař Jindřich, v spěchu"',
    text_en: '"Brother in Christ, I write for Lady Ofka of Újezd. A murdered child and a bloody knife were found by her, yet she swears innocence — and I believe her, for the murderer had cause to ruin her. The lord means to burn her. Speak for her and the monastery earns the lord\'s enmity; stay silent and an innocent may burn. — Henry the scribe, in haste"',
    trigger: function () {
      if (typeof TemplumSystem === 'undefined' || !TemplumSystem.isUnlocked()) return false;
      const rel = GameState.contactRelation || {};
      return Object.keys(rel).some(k => (rel[k] || 0) >= 25);
    },
    onExpire: function () { GameState.flags.letterOfka = 'silent'; },
    choices: [
      {
        label_cs: '⚖️ Přimluvit se za paní Ofku', label_en: '⚖️ Speak for Lady Ofka',
        effect: function () {
          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
            PersonaSystem.addInfluence('church', 4);
            PersonaSystem.addInfluence('village', 2);
          }
          GameState.flags.letterOfka = 'spoke';
          // TODO (šlechtic-řetěz): pán z Újezda si pamatuje — budoucí nepřítel
        },
        notify_cs: 'Klášter se přimluvil za paní Ofku. Pán z Újezda mlčí — zatím.',
        notify_en: 'The monastery spoke for Lady Ofka. The lord of Újezd says nothing — for now.'
      },
      {
        label_cs: '🤐 Mlčet', label_en: '🤐 Stay silent',
        effect: function () { GameState.flags.letterOfka = 'silent'; },
        notify_cs: 'Klášter mlčel. Někdy je i mlčení rozsudkem.',
        notify_en: 'The monastery stayed silent. Sometimes silence, too, is a verdict.'
      }
    ]
  },

  // ── L2b — rozuzlení (přimluvil ses): +7 dní po L2 ──
  {
    id: 'l2b_ofka_spoke',
    seal: 'village',
    title_cs: 'Zpráva z Újezda: pravda vyšla najevo',
    title_en: 'News from Újezd: The Truth Comes Out',
    text_cs: '„Bratře — paní Ofka je volná! Tvá přímluva zdržela hranici a mezitím se bratr jejího muže opil a chvástal, že nůž vedl on, aby ji zničil. Kraj ví, kdo se zastal nevinné. Pán z Újezda ovšem neodpouští těm, kdo mu zkřížili vůli. — Jindřich"',
    text_en: '"Brother — Lady Ofka is free! Your intercession stayed the pyre, and meanwhile her husband\'s brother drank and boasted that he had guided the knife to ruin her. The countryside knows who stood up for the innocent. The lord of Újezd, however, does not forgive those who cross his will. — Henry"',
    trigger: function () {
      if (GameState.flags.letterOfka !== 'spoke') return false;
      const a = (GameState.letters && GameState.letters.archive || []).find(e => e.id === 'l2_ofka');
      return !!a && (Date.now() - a.ts) >= 7 * 24 * 60 * 60 * 1000;
    },
    choices: [
      {
        label_cs: '📜 Zaplaťpánbůh', label_en: '📜 Thanks be to God',
        effect: function () {
          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 2);
        },
        notify_cs: 'Paní Ofka je volná. Kraj si pamatuje. (vesnice +2)',
        notify_en: 'Lady Ofka is free. The countryside remembers. (village +2)'
      }
    ]
  },

  // ── L2c — rozuzlení (mlčel jsi / prošvihl): +7 dní po L2 ──
  {
    id: 'l2c_ofka_silent',
    seal: 'village',
    title_cs: 'Zpráva z Újezda: po ohni',
    title_en: 'News from Újezd: After the Fire',
    text_cs: '„Bratře — paní Ofka shořela v pátek za úsvitu. O týden později se bratr jejího muže opil a chvástal, že nůž vedl on. Teď ho pán soudí, ale mrtvé to nohy nevrátí. Kraj se ptá, kde byl hlas kláštera. Nemám, co bych dodal. — Jindřich"',
    text_en: '"Brother — Lady Ofka burned on Friday at dawn. A week later her husband\'s brother drank and boasted that he had guided the knife. Now the lord tries him, but that returns no legs to the dead. The countryside asks where the monastery\'s voice was. I have nothing to add. — Henry"',
    trigger: function () {
      if (GameState.flags.letterOfka !== 'silent') return false;
      const a = (GameState.letters && GameState.letters.archive || []).find(e => e.id === 'l2_ofka');
      return !!a && (Date.now() - a.ts) >= 7 * 24 * 60 * 60 * 1000;
    },
    choices: [
      {
        label_cs: '🕯️ Odsloužit tichou modlitbu', label_en: '🕯️ Say a quiet prayer',
        effect: function () {
          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', -2);
        },
        notify_cs: 'Kraj nezapomíná, kdo mlčel. (vesnice −2)',
        notify_en: 'The countryside does not forget who stayed silent. (village −2)'
      }
    ]
  },

  // ── L3 — Kupec Mikuláš: ceny a rada (anály 1342) ──
  {
    id: 'l3_kupec_ceny',
    seal: 'village',
    title_cs: 'List kupce Mikuláše',
    title_en: 'A Letter from Nicholas the Merchant',
    text_cs: '„Bratře celeráři, na trhu se šeptá o slabé sklizni na Hané. Pamatuj léta MCCCXLII — strych žita za kopu! Kdo měl tehdy plnou sýpku, kupoval domy. Kdo prázdnou, prodával děti do služby. Radím: kupuj zrní teď, dokud mlynář prodává lacino. — Mikuláš, kupec od Dolního rynku"',
    text_en: '"Brother cellarer, the market whispers of a weak harvest in the Haná. Recall the year 1342 — a strych of rye for a threescore of groschen! Whoever had a full granary then bought houses. Whoever had an empty one sold his children into service. My counsel: buy grain now while the miller sells cheap. — Nicholas, merchant of the Lower Square"',
    trigger: function () {
      const r = GameState.researchedTechs || [];
      return r.includes('tech_numismatica')
          && typeof RankSystem !== 'undefined' && RankSystem.getSecularRankTier && RankSystem.getSecularRankTier() >= 2;
    },
    choices: [
      { label_cs: '📜 Vzít na vědomí', label_en: '📜 Take note',
        effect: function () {},
        notify_cs: 'Kupcova rada uložena v paměti celeráře.',
        notify_en: 'The merchant\'s counsel is filed in the cellarer\'s memory.' }
    ]
  },

  // ── L4 — Vdova Kačna: vosk za duši (první dopis s přílohou) ──
  {
    id: 'l4_vdova_vosk',
    seal: 'village',
    title_cs: 'Dar vdovy Kačny',
    title_en: 'The Widow Kačna\'s Gift',
    text_cs: '„Důstojný otče, posílám po čeledínovi hroudu vosku z úlů mého nebožtíka. Ať hoří za jeho duši při mši. Víc nemám — leda modlitbu, a tu si nechávám pro sebe, odpusťte. — Vdova Kačna z Chválkovic"',
    text_en: '"Reverend father, I send by my farmhand a lump of wax from my late husband\'s hives. Let it burn for his soul at mass. I have nothing more — save a prayer, and that one I keep for myself, forgive me. — Widow Kačna of Chválkovice"',
    trigger: function () {
      return !!(GameState.templum && GameState.templum.lastMass);
    },
    choices: [
      { label_cs: '🐝 Přijmout dar (3× vosk)', label_en: '🐝 Accept the gift (3× beeswax)',
        effect: function () {
          if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('beeswax', 3);
          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('church', 1);
        },
        notify_cs: 'Vosk vdovy Kačny uložen. Bude hořet při mši. (+3 vosk, Ecclesia +1)',
        notify_en: 'Widow Kačna\'s wax is stored. It will burn at mass. (+3 beeswax, Ecclesia +1)' }
    ]
  },

  // ── L5 — Bratr Prokop z Hradiska: mlýny (předehra vodních služeb) ──
  {
    id: 'l5_hradisko_mlyny',
    seal: 'abbot',
    title_cs: 'List bratra Prokopa z Hradiska',
    title_en: 'A Letter from Brother Prokop of Hradisko',
    text_cs: '„Bratře, náš klášter na Hradisku drží mlýny na rameni Moravy — a věz, že kolo nemele jen mouku. Pohání pilu, stoupu na tříslo i hamr. Váš mlynář má jen jedno kolo? Pak platí vodě daň z lenosti. Přijeď se podívat, než zamrzne řeka. — Bratr Prokop, Hradisko"',
    text_en: '"Brother, our monastery at Hradisko holds mills on a branch of the Morava — and know that the wheel grinds more than flour. It drives a saw, a tanbark stamp and a hammer-mill. Your miller has but one wheel? Then he pays the water a tax of idleness. Come and see before the river freezes. — Brother Prokop, Hradisko"',
    trigger: function () {
      return ((GameState.contactRelation || {}).mlynar || 0) >= 5;
    },
    choices: [
      { label_cs: '📜 Zajímavé…', label_en: '📜 Interesting…',
        effect: function () {},
        notify_cs: 'Hradiská kola se ti otiskla do mysli. Jednou možná…',
        notify_en: 'The Hradisko wheels turn in your mind. One day, perhaps…' }
    ]
  },

  // ── L6 — Biskupská kancelář: misál (14 dní; vstup vizitačního řetězu) ──
  {
    id: 'l6_biskup_misal',
    seal: 'abbot',
    expiry_days: 14,
    title_cs: 'List biskupské kanceláře',
    title_en: 'A Letter from the Bishop\'s Chancery',
    text_cs: '„Bratře, Jeho Milost biskup olomoucký doslechl se o vašem skriptoriu. Táže se, zda by vaše dílna svedla opis misálu hodný katedrálního oltáře. Odpověz po tomto poslu, leč važ slova: co slíbíš, to bude čteno nahlas. — Kancelář biskupství olomouckého"',
    text_en: '"Brother, His Grace the Bishop of Olomouc has heard of your scriptorium. He asks whether your workshop could produce a missal copy worthy of the cathedral altar. Reply by this messenger, but weigh your words: what you promise will be read aloud. — Chancery of the Bishopric of Olomouc"',
    trigger: function () {
      const m = GameState.rank && GameState.rank.monastic;
      return ['frater', 'armarius', 'prior'].includes(m)
          && (GameState.researchedTechs || []).includes('tech_codex_luxury');
    },
    onExpire: function () { GameState.flags.bishopMissal = 'ignored'; },
    choices: [
      { label_cs: '📜 Přijmout zakázku', label_en: '📜 Accept the commission',
        effect: function () { GameState.flags.bishopMissal = 'accepted'; },
        notify_cs: 'Slíbil jsi biskupovi misál. Kancelář odpoví — a bude to čteno nahlas. (řetěz pokračuje)',
        notify_en: 'You promised the bishop a missal. The chancery will reply — and it will be read aloud. (the chain continues)' },
      { label_cs: '🙏 Pokorně odmítnout', label_en: '🙏 Humbly decline',
        effect: function () {
          GameState.flags.bishopMissal = 'declined';
          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('church', -1);
        },
        notify_cs: 'Odmítl jsi. Kancelář mlčí — biskupové ale nezapomínají. (Ecclesia −1)',
        notify_en: 'You declined. The chancery is silent — but bishops do not forget. (Ecclesia −1)' }
    ]
  },

];