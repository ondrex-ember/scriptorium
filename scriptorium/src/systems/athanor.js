// ============================================================
//  ATHANOR — Alchymistická laboratoř v2.0
//  src/systems/athanor.js
//  Scriptorium Phase 2
//
//  Závislosti: GameState, Game.addItem(), Game.removeItem(),
//              Game.save(), UI.notify()
//  Volání render: AthanorSystem.render('home-athanor-content')
//  Tick: AthanorSystem.tick() každé 2s z game loop
//
//  Nové v v2.0:
//  - CombinationEngine: sandbox kombinování (ne jen recepty)
//  - Brewing timer: vaření trvá čas, ne okamžitý výsledek
//  - Discovery log: GameState.athanor.discovered[]
//  - Nigredo/Albedo/Rubedo fáze s lore texty
//  - Failure hints: COMBUSTIO / DILUTIO / INERTIA / CORRUPTIO
//  - Risk dice roll ovlivněný Vigorem
//  - Toast notifikace po dovaření (kdekoliv ve hře)
//  - Zvukový signál při dokončení (Web Audio, bez audio.js dep.)
// ============================================================

// ── DATA ────────────────────────────────────────────────────

const AthanorDB = {

  // ----------------------------------------------------------
  //  INGREDIENCE
  //  Každá má skryté vlastnosti thermal + moisture
  //  které CombinationEngine používá k výpočtu výsledku.
  //  Hráč tyto hodnoty nevidí — odhaluje je zkoušením.
  //
  //  source: kde ji hráč získá
  //    'foraging'  = průzkum přírody
  //    'trade'     = Starý Písař / barter
  //    'craft'     = vyrobí se z jiných itemů
  //    'existing'  = již v ItemsDB, žádná změna potřeba
  // ----------------------------------------------------------
  ingredients: [
    {
      id: 'water',
      name: 'Voda',             name_lat: 'Aqua',
      rarity: 'common',         source: 'existing',
      color: '#6fa8dc',         icon: '💧',
      thermal: -2,              moisture: 4,
      lore: 'Základ všeho. Aqua vitae i aqua mortis.'
    },
    {
      id: 'gum_arabic',
      name: 'Guma arabská',     name_lat: 'Gummi Arabicum',
      rarity: 'uncommon',       source: 'existing',
      color: '#c9a96e',         icon: '🫙',
      thermal: 0,               moisture: 1,
      lore: 'Prysk z akácie. Váže pigment k pergamenu.'
    },
    {
      id: 'gall_nut',
      name: 'Duběnka',          name_lat: 'Galla',
      rarity: 'uncommon',       source: 'existing',
      color: '#8b6914',         icon: '🌰',
      thermal: -1,              moisture: -2,
      lore: 'Hálka na dubovém listu. Základ ferrogalického inkoustu.'
    },
    {
      id: 'chalk',
      name: 'Křída',            name_lat: 'Creta',
      rarity: 'common',         source: 'existing',
      color: '#f0f0e8',         icon: '🪨',
      thermal: 0,               moisture: -1,
      lore: 'Běloba pro iluminátory. Základ základů.'
    },
    {
      id: 'honey',
      name: 'Med',              name_lat: 'Mel',
      rarity: 'common',         source: 'existing',
      color: '#f0c040',         icon: '🍯',
      thermal: 2,               moisture: 2,
      lore: 'Klášterní med. Sladí i váže. Hildegarda ho chválila.'
    },
    {
      id: 'carbon_black',
      name: 'Saze',             name_lat: 'Carbo Niger',
      rarity: 'common',         source: 'foraging',
      color: '#1a1a1a',         icon: '🖤',
      thermal: 4,               moisture: -3,
      lore: 'Saze z krbu nebo loučí. Nejstarší černý pigment světa.',
      dropNote: 'Sbírej u krbu nebo z pochodně.'
    },
    {
      id: 'ochre',
      name: 'Okr',              name_lat: 'Ochra',
      rarity: 'common',         source: 'foraging',
      color: '#cc7722',         icon: '🟤',
      thermal: 1,               moisture: -2,
      lore: 'Žlutohnědá zemina bohatá na oxid železitý. Používána od pravěku.',
      dropNote: 'Nalézáš v jílovitých místech při průzkumu.'
    },
    {
      id: 'cinnabar',
      name: 'Rumělka',          name_lat: 'Cinnabaris',
      rarity: 'uncommon',       source: 'trade',
      color: '#c0392b',         icon: '🔴',
      thermal: 2,               moisture: -2,
      lore: 'Sulfid rtuťnatý. Zářivě červená, ale jedovatá. Rubrikátoři si olizovali štětce — a přicházeli o zuby.',
      dropNote: 'Nakoupíš u Starého Písaře.'
    },
    {
      id: 'lapis_lazuli',
      name: 'Lapis lazuli',     name_lat: 'Lapis Lazuli',
      rarity: 'rare',           source: 'trade',
      color: '#1f4e91',         icon: '💎',
      thermal: -1,              moisture: 0,
      lore: 'Dražší než zlato. Dovážen z Afghánistánu. Barva Panny Marie. Jeptišky z Dalheim měly z něj modré zuby.',
      dropNote: 'Vzácné zboží — Starý Písař ho má jen občas.'
    },
    {
      id: 'verdigris',
      name: 'Měděnka',          name_lat: 'Viride Aeris',
      rarity: 'uncommon',       source: 'craft',
      color: '#2ecc71',         icon: '🟢',
      thermal: -1,              moisture: 1,
      lore: 'Zelenomodrá patina na mědi. Vzniká působením octa na měděný plech.',
      dropNote: 'Vyrobit: měděný plech + ocet.'
    },
    {
      id: 'egg_tempera',
      name: 'Vaječná tempera',  name_lat: 'Temperum Ovi',
      rarity: 'common',         source: 'craft',
      color: '#f5deb3',         icon: '🥚',
      thermal: 0,               moisture: 1,
      lore: 'Žloutek rozmíchaný s trochou vína. Nejstarší pojivo pigmentů v Evropě.',
      dropNote: 'Vyrobit: vejce + víno.'
    },
    {
      id: 'chamomile',
      name: 'Heřmánek',         name_lat: 'Chamomilla',
      rarity: 'common',         source: 'foraging',
      color: '#f0e68c',         icon: '🌼',
      thermal: -1,              moisture: 1,
      lore: 'Matka bylinek. Hildegarda z Bingenu ji doporučovala na žaludeční potíže i smutek duše.',
      dropNote: 'Roste na loukách při průzkumu.'
    },
    {
      id: 'st_johns_wort',
      name: 'Třezalka',         name_lat: 'Hypericum',
      rarity: 'common',         source: 'foraging',
      color: '#ffd700',         icon: '🌻',
      thermal: 2,               moisture: -2,
      lore: 'Bylina svatého Jana. Červený olej z jejích květů léčil rány i melancholii.',
      dropNote: 'Kvete v létě, sbírej při průzkumu.'
    },
    {
      id: 'beeswax',
      name: 'Včelí vosk',       name_lat: 'Cera Alba',
      rarity: 'uncommon',       source: 'foraging',
      color: '#f5c842',         icon: '🕯️',
      thermal: 1,               moisture: -1,
      lore: 'Čistý vosk z klášterního úlu. Pojivo masti i materiál pro pečetění listin.',
      dropNote: 'Nalézáš při průzkumu v blízkosti lesa.'
    },

    // ── NOVÁ VLNA — z Alchemix (historicky věrné) ──
    {
      id: 'vitriol',
      name: 'Zelená skalice',   name_lat: 'Vitriolum Viride',
      rarity: 'uncommon',       source: 'trade',
      color: '#2d6e3e',         icon: '🧪',
      thermal: 3,               moisture: -3,
      lore: 'Síran železnatý. Klíčová složka ferrogalického inkoustu — bez ní není pravý skriptorský inkoust.',
      dropNote: 'Nakoupíš u Starého Písaře nebo Giacoma.'
    },
    {
      id: 'alum',
      name: 'Kamenec',          name_lat: 'Alumen',
      rarity: 'uncommon',       source: 'trade',
      color: '#d4e8f0',         icon: '💠',
      thermal: -2,              moisture: -4,
      lore: 'Síran hlinito-draselný. Fixátor barviv, konzervant pergamenu. Bez kamence by každý rukopis splaskl.',
      dropNote: 'Dostupný u obchodníků na trhu.'
    },
    {
      id: 'vinegar',
      name: 'Ocet',             name_lat: 'Acetum',
      rarity: 'common',         source: 'existing',
      color: '#d4c97a',         icon: '🍶',
      thermal: -1,              moisture: 2,
      lore: 'Kyselý přítel alchymisty. Rozpouští, čistí, fixuje. Ocet s mědí dává měděnku.',
      dropNote: 'Běžná kuchyňská surovina.'
    },
    {
      id: 'wine',
      name: 'Víno',             name_lat: 'Vinum',
      rarity: 'common',         source: 'existing',
      color: '#8b2252',         icon: '🍷',
      thermal: 2,               moisture: 2,
      lore: 'Dar révy. Pojivo vaječné tempery, základ tinktur, útěcha písaře po dlouhém dni.',
      dropNote: 'Z klášterního sklepa nebo od hospodského.'
    },
    {
      id: 'rose',
      name: 'Růže',             name_lat: 'Rosa',
      rarity: 'uncommon',       source: 'foraging',
      color: '#e8748a',         icon: '🌹',
      thermal: -1,              moisture: 2,
      lore: 'Klášterní zahrada bez růže je jako rukopis bez iluminace. Aqua Rosarum léčí i duši.',
      dropNote: 'Sbírej v klášterní zahradě nebo při průzkumu.'
    },
    {
      id: 'linseed_oil',
      name: 'Lněný olej',       name_lat: 'Oleum Lini',
      rarity: 'uncommon',       source: 'trade',
      color: '#c8a84b',         icon: '🫗',
      thermal: 2,               moisture: 2,
      lore: 'Schnoucí olej ze lnu. Základ laků na pergamen i fermeže. Bez něj by iluminace nesvítily.',
      dropNote: 'Dostupný u obchodníka nebo na trhu.'
    },
    {
      id: 'sulfur',
      name: 'Síra',             name_lat: 'Sulphur',
      rarity: 'uncommon',       source: 'trade',
      color: '#e8d44a',         icon: '🟡',
      thermal: 3,               moisture: -3,
      lore: 'Prima Materia alchymie. Hoří modře, páchne peklem. Bez síry není transmutace.',
      dropNote: 'Nakoupíš u Starého Písaře nebo Giacoma.'
    },
    {
      id: 'pine_resin',
      name: 'Pryskyřice',       name_lat: 'Resina Pini',
      rarity: 'common',         source: 'foraging',
      color: '#c8892a',         icon: '🌲',
      thermal: 2,               moisture: -2,
      lore: 'Vonná pryskyřice z borovic. Základ laků, pečetního vosku i kadidla. Voní jako les po dešti.',
      dropNote: 'Sbírej při průzkumu v lese.'
    },
    {
      id: 'sandarak',
      name: 'Sandarak',         name_lat: 'Sandaraca',
      rarity: 'uncommon',       source: 'trade',
      color: '#d4a870',         icon: '🫙',
      thermal: 2,               moisture: -2,
      lore: 'Pryskyřice berberskéhocypřiše. Základ průzračného laku Vernix — chrání pergamen před vlhkostí.',
      dropNote: 'Vzácné zboží od Giacoma Foscariho.'
    },
    {
      id: 'oak_bark',
      name: 'Dubová kůra',      name_lat: 'Cortex Quercus',
      rarity: 'common',         source: 'foraging',
      color: '#6b4a2a',         icon: '🌳',
      thermal: 0,               moisture: -2,
      lore: 'Třísloviny z dubové kůry. Slouží k vydělávání kůže i jako základ taninu pro fixaci barviv.',
      dropNote: 'Sbírej při průzkumu v lese.'
    },
    { id: 'grain', name: 'Obilí', name_lat: 'Granum', rarity: 'common', source: 'existing',
      color: '#d4a820', icon: '🌾', thermal: 1, moisture: 2,
      lore: 'Základ chleba i piva. Kláštery pěstovaly obilí od nepaměti.' },
    { id: 'hops', name: 'Chmel', name_lat: 'Humulus', rarity: 'uncommon', source: 'existing',
      color: '#7aad4a', icon: '🌿', thermal: -1, moisture: 1,
      lore: 'Hildegarda jako první popsala chmel jako konzervantu piva. Hořkost, vůně, zdraví.',
      dropNote: 'Sbírej při průzkumu nebo nakup na Trhu.' },
    { id: 'thyme', name: 'Tymián', name_lat: 'Thymus', rarity: 'common', source: 'existing',
      color: '#8ab87a', icon: '🌿', thermal: 1, moisture: 0,
      lore: 'Odvání Varroa z úlů. Hildegarda ho znala jako bylinu síly a odvahy.',
      dropNote: 'Sbírej při průzkumu nebo pěstuj v zahradě.' },
    { id: 'wort', name: 'Mladina', name_lat: 'Mustum Cerevisiae', rarity: 'uncommon', source: 'crafted',
      color: '#c8a84b', icon: '🫗', thermal: 2, moisture: 3,
      lore: 'Zlatavá tekutina z povařeného obilí. Základ každého piva. Vzniká jen v Athanoru.' }
  ],

  // ----------------------------------------------------------
  //  PROCESY
  //  Modifikátory se přičtou k součtu ingrediencí.
  //  duration_ms: jak dlouho trvá vaření
  //  unlock: null = dostupný od začátku, jinak research ID
  // ----------------------------------------------------------
  processes: [
    {
      id: 'trituratio',
      name: 'Trituratio',       name_cs: 'Drcení',
      icon: '🔨',
      thermal_mod: 0,           moisture_mod: -1,
      duration_ms: 8000,
      unlock: null,
      desc: 'Drcení v třecí misce. Rozmělní pevné složky, vysušuje.'
    },
    {
      id: 'coctio',
      name: 'Coctio',           name_cs: 'Vaření',
      icon: '🔥',
      thermal_mod: 3,           moisture_mod: -2,
      duration_ms: 15000,
      unlock: null,
      desc: 'Vaření nad Athanorem. Přidává teplo, odpařuje vlhkost.'
    },
    {
      id: 'maceratio',
      name: 'Maceratio',        name_cs: 'Louhování',
      icon: '💧',
      thermal_mod: -2,          moisture_mod: 3,
      duration_ms: 20000,
      unlock: null,
      desc: 'Pomalé louhování v chladné vodě. Jemné, vlhčí.'
    },
    {
      id: 'destillatio',
      name: 'Destillatio',      name_cs: 'Destilace',
      icon: '🌡️',
      thermal_mod: 1,           moisture_mod: 1,
      duration_ms: 25000,
      unlock: 'tech_destillatio',
      desc: 'Destilace přes alembik. Vyžaduje pokročilé vybavení.'
    },
    {
      id: 'calcinatio',
      name: 'Calcinatio',       name_cs: 'Žíhání',
      icon: '⚡',
      thermal_mod: 5,           moisture_mod: -4,
      duration_ms: 30000,
      unlock: 'tech_calcinatio',
      desc: 'Žíhání v silném ohni. Extrémní teplo, ničí vlhkost.'
    }
  ],

  // ----------------------------------------------------------
  //  KNOWN COMBINATIONS
  //  Klíč = sorted ingredient IDs spojené "_" + ":" + process ID
  //  Hráč tyto kombinace objevuje experimentováním.
  //  Začíná s prázdným discovered[].
  //
  //  Formát klíče: ingredience seřazené abecedně, oddělené "+"
  //  Příklad: "carbon_black+gum_arabic+water:coctio"
  // ----------------------------------------------------------
  combinations: {

    // ── Tier 1: Pigmenty a inkousty ──
    'carbon_black+gum_arabic+water:coctio': {
      result: { id: 'ink_carbon', qty: 2 },
      name: 'Sazový inkoust',
      name_lat: 'Atramentum Carboneum',
      icon: '🖤',
      effect: null,
      lore: 'Základní černý inkoust ze sazí. Levný, rychlý, vydrží staletí.'
    },
    'cinnabar+gum_arabic+water:coctio': {
      result: { id: 'ink_red', qty: 1 },
      name: 'Červený inkoust',
      name_lat: 'Atramentum Rubrum',
      icon: '🔴',
      effect: null,
      lore: 'Rumělkový inkoust pro rubriky a iniciály. Kreslí jím první písmeno kapitoly.'
    },
    'ochre+egg_tempera:trituratio': {
      result: { id: 'pigment_yellow', qty: 2 },
      name: 'Žlutý pigment',
      name_lat: 'Pigmentum Ochreum',
      icon: '🟡',
      effect: null,
      lore: 'Okrový pigment v tempera pojivu. Pro iluminace zlatohnědých ploch.'
    },
    'egg_tempera+verdigris:trituratio': {
      result: { id: 'pigment_green', qty: 1 },
      name: 'Zelený pigment',
      name_lat: 'Pigmentum Viride',
      icon: '🟢',
      effect: null,
      lore: 'Měděnka v tempera. Krásná zelená, ale časem koroduje pergamen.'
    },
    'egg_tempera+lapis_lazuli:trituratio': {
      result: { id: 'pigment_blue', qty: 1 },
      name: 'Ultramarín',
      name_lat: 'Pigmentum Lazuli',
      icon: '💙',
      effect: {
        type: 'vigor_restore',
        value: 5,
        duration_ms: 0,
        label: 'Kontemplativní práce s pigmentem +5 vigor'
      },
      lore: 'Pigment z lapis lazuli. Dražší než zlato — vyhrazen pro roucho Panny Marie.'
    },
    'gall_nut+gum_arabic+water:maceratio': {
      result: { id: 'ink_gallic', qty: 2 },
      name: 'Duběnkový inkoust',
      name_lat: 'Atramentum Gallicum',
      icon: '🌰',
      effect: null,
      lore: 'Ferrogalický inkoust. Časem prožírá pergamen — ale trvá staletí.'
    },

    // ── Tier 2: Lektvary a masti ──
    'chamomile+honey+water:coctio': {
      result: { id: 'potion_vigor_minor', qty: 1 },
      name: 'Heřmánkový odvar',
      name_lat: 'Infusum Chamomillae',
      icon: '🌼',
      effect: {
        type: 'vigor_restore',
        value: 20,
        duration_ms: 0,
        label: 'Vigor +20'
      },
      lore: 'Teplý odvar uklidní žaludek a obnoví síly. Hildegarda by schválila.'
    },
    'honey+st_johns_wort+water:coctio': {
      result: { id: 'potion_craft_boost', qty: 1 },
      name: 'Třezalkový lektvar',
      name_lat: 'Potio Hyperici',
      icon: '🌻',
      effect: {
        type: 'craft_boost',
        value: 1.5,
        duration_ms: 3600000,
        label: 'Crafting ×1.5 po dobu 1 hodiny'
      },
      lore: 'Bylina svatého Jana žene pryč únavu i melancholii.'
    },
    'beeswax+chamomile+honey:trituratio': {
      result: { id: 'potion_hunger_remedy', qty: 1 },
      name: 'Hojivá mast',
      name_lat: 'Unguentum Sanativum',
      icon: '🕯️',
      effect: {
        type: 'hunger_extend',
        value: 14400000,
        duration_ms: 0,
        label: 'Hlad se zpomalí o 4 hodiny'
      },
      lore: 'Vosk s heřmánkem potírá rozmrzlé prsty a unavené zápěstí.'
    },

    // ── Discoverable: skryté kombinace ──
    'chamomile+honey:maceratio': {
      result: { id: 'potion_vigor_minor', qty: 1 },
      name: 'Heřmánkový sirup',
      name_lat: 'Syrupus Chamomillae',
      icon: '🌼',
      effect: {
        type: 'vigor_restore',
        value: 15,
        duration_ms: 0,
        label: 'Vigor +15'
      },
      lore: 'Studenou cestou. Méně účinný, ale šetrnější.'
    },
    'beeswax+st_johns_wort:coctio': {
      result: { id: 'salve_hands', qty: 1 },
      name: 'Mast na prsty',
      name_lat: 'Unguentum Digitorum',
      icon: '🌻',
      effect: {
        type: 'craft_boost',
        value: 1.25,
        duration_ms: 1800000,
        label: 'Crafting ×1.25 po dobu 30 minut'
      },
      lore: 'Třezalka v vosku. Léčí popraskaná písařská záda. Benediktinský klášterní recept.'
    },
    'chalk+egg_tempera+ochre:trituratio': {
      result: { id: 'pigment_yellow', qty: 3 },
      name: 'Světlý okr',
      name_lat: 'Ochra Clara',
      icon: '🟡',
      effect: null,
      lore: 'Křída zředí okr. Více materiálu, světlejší tón.'
    },
    'carbon_black+gall_nut+water:maceratio': {
      result: { id: 'ink_carbon', qty: 1 },
      name: 'Tmavý duběnkový',
      name_lat: 'Atramentum Nigrum',
      icon: '🖤',
      effect: null,
      lore: 'Kombinace sazí a duběnky. Neobvyklá, ale trvanlivá.'
    },
    'honey+lapis_lazuli:maceratio': {
      result: { id: 'pigment_blue', qty: 1 },
      name: 'Medový ultramarín',
      name_lat: 'Lazulium Mellitum',
      icon: '💙',
      effect: {
        type: 'vigor_restore',
        value: 10,
        duration_ms: 0,
        label: 'Vigor +10 — meditace nad modří'
      },
      lore: 'Med zjemní lapis lazuli. Starší benátský postup.'
    },

    // ── Nová vlna: Alchemix recepty adaptované pro Scriptorium ──

    // POT35 — Atramentum (Iron Gall Ink) — nejlepší skriptorský inkoust
    'gall_nut+vitriol+water:coctio': {
      result: { id: 'ink_gallic', qty: 2 },
      name: 'Ferrogalický inkoust',
      name_lat: 'Atramentum Ferrogallicum',
      icon: '⚫',
      effect: {
        type: 'craft_boost',
        value: 1.3,
        duration_ms: 7200000,
        label: 'Crafting ×1.3 po dobu 2 hodin — mistrovský inkoust'
      },
      lore: 'Duběnka + skalice + voda. Recept starý jako středověk sám. Prožírá pergamen, ale vydrží tisíc let.'
    },

    // POT37 — Encaustum — císařský inkoust
    'gall_nut+vitriol+wine:coctio': {
      result: { id: 'ink_gallic', qty: 3 },
      name: 'Encaustum',
      name_lat: 'Encaustum Imperiale',
      icon: '⚫',
      effect: null,
      lore: 'Víno místo vody dává bohatší tón. Byzantský císařský postup — červenofialový záblesk v černé.'
    },

    // POT05 — Oxymel — med+ocet, klášterní lék
    'honey+vinegar:coctio': {
      result: { id: 'potion_vigor_minor', qty: 2 },
      name: 'Oxymel',
      name_lat: 'Oxymel Simplex',
      icon: '🍯',
      effect: {
        type: 'vigor_restore',
        value: 25,
        duration_ms: 0,
        label: 'Vigor +25 — klášterní osvědčený lék'
      },
      lore: 'Med a ocet. Hippokratés, Galén, Hildegarda — všichni se shodli. Nejjednodušší a nejspolehlivější lék.'
    },

    // POT04 — Aqua Rosarum — růžová voda
    'rose+water:destillatio': {
      result: { id: 'potion_vigor_minor', qty: 1 },
      name: 'Aqua Rosarum',
      name_lat: 'Aqua Rosarum',
      icon: '🌹',
      effect: {
        type: 'vigor_restore',
        value: 15,
        duration_ms: 0,
        label: 'Vigor +15 — klid a mír duše'
      },
      lore: 'Destilovaná voda z okvětních lístků. Léčí unavené oči písaře. Arabský recept, přes Španělsko do Evropy.'
    },

    // POT10 — Potio Memorativa — paměťový lektvar
    'honey+rose+wine:maceratio': {
      result: { id: 'potion_craft_boost', qty: 1 },
      name: 'Potio Memorativa',
      name_lat: 'Potio Memorativa',
      icon: '🧠',
      effect: {
        type: 'craft_boost',
        value: 1.2,
        duration_ms: 5400000,
        label: 'Research ×1.2 po dobu 1.5 hodiny — jasná mysl'
      },
      lore: 'Středověký recept na posílení paměti. Rozmarýn, šalvěj a med — klášterní lékaři ho předepisovali písařům.'
    },

    // POT38 — Vernix — lak na pergamen
    'linseed_oil+sandarak:coctio': {
      result: { id: 'varnish', qty: 1 },
      name: 'Vernix',
      name_lat: 'Vernix Clara',
      icon: '✨',
      effect: null,
      lore: 'Průzračný lak na lněném oleji. Chrání iluminace před vlhkostí a hmyzem. Základ každé dílny iluminátorů.'
    },

    // POT23 — Oleum Hyperici — třezalkový olej
    'linseed_oil+st_johns_wort:maceratio': {
      result: { id: 'potion_hunger_remedy', qty: 1 },
      name: 'Oleum Hyperici',
      name_lat: 'Oleum Hyperici',
      icon: '🌻',
      effect: {
        type: 'hunger_extend',
        value: 10800000,
        duration_ms: 0,
        label: 'Hlad se zpomalí o 3 hodiny'
      },
      lore: 'Třezalka louhovaná v oleji. Červená jako krev. Léčí rány, spáleniny i pesimismus. Bez tepla — jen čas a slunce.'
    },

    // POT88 — Gesso — podklad pro iluminace
    'chalk+egg_tempera:trituratio': {
      result: { id: 'pigment_yellow', qty: 2 },
      name: 'Gesso',
      name_lat: 'Gessus Preparatus',
      icon: '⬜',
      effect: null,
      lore: 'Křída s vaječným bílkem. Bílý podklad pro zlaté iluminace. Bez gessa by zlato nesedělo na pergamenu.'
    },

    // POT40 — Viride Aes — měděnka z octu
    'oak_bark+vinegar+water:maceratio': {
      result: { id: 'pigment_green', qty: 2 },
      name: 'Tannin Extract',
      name_lat: 'Extractum Tannini',
      icon: '🟤',
      effect: null,
      lore: 'Třísloviny z dubové kůry. Základ pro fixaci barviv i výrobu inkoustu bez kovů. Lesní alchymie.'
    },

    // Nový — síra + saze = deep black pigment (Calcinatio)
    'carbon_black+sulfur:calcinatio': {
      result: { id: 'ink_carbon', qty: 3 },
      name: 'Černidlo žíhané',
      name_lat: 'Nigrum Calcinatum',
      icon: '🖤',
      effect: null,
      lore: 'Saze žíhané se sírou dají absolutní černou. Praxis alchymistů ze 14. století. Nelze spráci jinak.'
    },

    // ══ CERVISIARIA ══
    'grain+water:coctio': {
      result: { id: 'wort', qty: 1 },
      name: 'Mladina', name_lat: 'Mustum Cerevisiae', icon: '🫗', effect: null,
      lore: 'Obilí povařené s vodou vydá zlatavou tekutinu. Základ každého piva.'
    },
    'hops+wort:maceratio': {
      result: { id: 'prima_cervisia', qty: 2 },
      name: 'Prima Cervisia', name_lat: 'Cervisia Prima', icon: '🍺',
      effect: { type: 'vigor', amount: 15, duration_min: 30, label: 'Prima Cervisia: Vigor +15 / 30 min' },
      lore: 'Mladina vyluhovaná s chmelem. Benediktini ji vařili pro poutníky i pro sebe.'
    },
    'honey+wort:maceratio': {
      result: { id: 'wine', qty: 1 },
      name: 'Hydromel', name_lat: 'Hydromel Monasticum', icon: '🍯',
      effect: { type: 'vigor', amount: 20, duration_min: 20, label: 'Hydromel: Vigor +20 / 20 min' },
      lore: 'Med fermentovaný v mladině. Starší než víno. Nápoj bohů i mnichů.'
    },
    'hops+thyme+wort:coctio': {
      result: { id: 'cervisia_nigra', qty: 2 },
      name: 'Cervisia Nigra', name_lat: 'Cervisia Nigra', icon: '🍺',
      effect: { type: 'vigor', amount: 25, duration_min: 45, label: 'Cervisia Nigra: Vigor +25 / 45 min' },
      lore: 'Tmavé pivo s tymiánem. Hildegarda by schválila. Prodává se za zlaté.'
    },
    'honey+thyme:coctio': {
      result: { id: 'potion_vigor_minor', qty: 1 },
      name: 'Mel Thymicum', name_lat: 'Mel Thymicum', icon: '🌿',
      effect: { type: 'vigor', amount: 20, duration_min: 60, label: 'Mel Thymicum: Vigor +20' },
      lore: 'Med s tymiánem vařený nad Athanorem. Hildegarda doporučovala na zimnici i smutek duše.'
    },
    'grain+honey:coctio': {
      result: { id: 'stamina_tonic', qty: 1 },
      name: 'Posca Dulcis', name_lat: 'Posca Dulcis', icon: '🥛', effect: null,
      lore: 'Obilný vývar oslazen medem. Posca — nápoj římských legionářů v klášterní podobě.'
    }
  },

  // ----------------------------------------------------------
  //  FAILURE HINTS
  //  Podmínky: thermal a moisture výsledného profilu
  // ----------------------------------------------------------
  failures: [
    {
      id: 'COMBUSTIO',
      condition: (t, m) => t >= 7,
      icon: '💥',
      title: 'Combustio',
      msg: 'Směs se vznítila. Příliš sucho a teplo — přidej vlhčí složku nebo zvol jiný proces.',
      lore: 'Titivillus byl zde. Pytel chyb je těžší.'
    },
    {
      id: 'DILUTIO',
      condition: (t, m) => m >= 7,
      icon: '💧',
      title: 'Dilutio',
      msg: 'Vše se rozpustilo bez výsledku. Příliš vodnaté — přidej pojivo nebo suchý pigment.',
      lore: 'Aqua omnia vincit — ale ne vždy ku prospěchu díla.'
    },
    {
      id: 'INERTIA',
      condition: (t, m) => t <= -4,
      icon: '🧊',
      title: 'Inertia',
      msg: 'Nic se nestalo. Složky spolu nereagují — zkus jiný proces nebo přidej tepelnou složku.',
      lore: 'Ignis latet in cinere. Oheň se skrývá — ale tentokrát příliš hluboko.'
    },
    {
      id: 'CORRUPTIO',
      condition: (t, m, roll) => roll <= 5,
      icon: '🌑',
      title: 'Corruptio',
      msg: 'Černá kaše bez zápachu. Dílo se zkazilo — možná jiná kombinace, možná špatný den.',
      lore: 'Nigredo. Rozklad. Možná začátek něčeho nového — nebo jen ztráta.'
    }
  ],

  // ----------------------------------------------------------
  //  BREWING STAGES (Nigredo → Albedo → Rubedo)
  // ----------------------------------------------------------
  stages: [
    {
      id: 'nigredo',
      label: 'Nigredo',
      desc: 'Suroviny se rozpadají...',
      color: '#1a1410',
      textColor: '#8b7355'
    },
    {
      id: 'albedo',
      label: 'Albedo',
      desc: 'Pára stoupá, tekutina se čistí...',
      color: '#2a2820',
      textColor: '#c9a96e'
    },
    {
      id: 'rubedo',
      label: 'Rubedo',
      desc: 'Barva se ustálila. Dílo je dokonáno.',
      color: '#2a1a10',
      textColor: '#e8c44a'
    }
  ]
};

// ── COMBINATION ENGINE ───────────────────────────────────────

const CombinationEngine = {

  // Vyhodnotí kombinaci ingrediencí + proces
  // Vrátí { success: true, combo } nebo { success: false, failure, hint }
  evaluate(slotIds, processId) {
    const ingMap = {};
    AthanorDB.ingredients.forEach(i => { ingMap[i.id] = i; });

    const process = AthanorDB.processes.find(p => p.id === processId);
    if (!process) return { success: false, failure: AthanorDB.failures[2], hint: 'Neznámý proces.' };

    // Spočítej profil
    let thermal = process.thermal_mod;
    let moisture = process.moisture_mod;
    slotIds.forEach(id => {
      const ing = ingMap[id];
      if (ing) {
        thermal += ing.thermal;
        moisture += ing.moisture;
      }
    });

    // Vigor ovlivňuje šanci na Corruptio
    const vigor = GameState.vigor ? GameState.vigor.current : 100;
    const roll = Math.floor(Math.random() * 20) + 1;
    // Při vigor < 30 je roll penalizován (horší šance)
    const effectiveRoll = vigor < 30 ? roll - 3 : roll;

    // Zkontroluj failures
    for (const f of AthanorDB.failures) {
      if (f.id === 'CORRUPTIO') {
        if (f.condition(thermal, moisture, effectiveRoll)) {
          return { success: false, failure: f };
        }
      } else {
        if (f.condition(thermal, moisture)) {
          return { success: false, failure: f };
        }
      }
    }

    // Sestav klíč — ingredience seřazené abecedně
    const key = [...slotIds].sort().join('+') + ':' + processId;
    const combo = AthanorDB.combinations[key];

    if (!combo) {
      // Neznámá kombinace — ale prošla failure check → INERTIA light
      return {
        success: false,
        failure: {
          id: 'UNKNOWN',
          icon: '❓',
          title: 'Terra Incognita',
          msg: 'Tato kombinace zatím žádný výsledek nevydala. Zkus jiné složky nebo jiný proces.',
          lore: 'Alchymie je umění trpělivosti. Pokračuj ve zkoumání.'
        }
      };
    }

    // Kritický úspěch (roll 20, vigor >= 70)
    const isCritical = (effectiveRoll === 20 && vigor >= 70);

    return { success: true, combo, isCritical };
  }
};

// ── ENGINE ───────────────────────────────────────────────────

const AthanorSystem = {

  // ── INIT ──────────────────────────────────────────────────
  init() {
    if (!GameState.athanor) {
      GameState.athanor = {
        activeEffects: [],
        slots: [],
        activeProcess: 'coctio',
        brewing: null,
        discovered: [],
        lastResult: null
      };
    } else {
      // Migrace starších save — přidej nová pole pokud chybí
      if (!GameState.athanor.slots)         GameState.athanor.slots = [];
      if (!GameState.athanor.activeProcess) GameState.athanor.activeProcess = 'coctio';
      if (!GameState.athanor.brewing)       GameState.athanor.brewing = null;
      if (!GameState.athanor.discovered)    GameState.athanor.discovered = [];
      if (!('lastResult' in GameState.athanor)) GameState.athanor.lastResult = null;
    }
    setInterval(() => AthanorSystem.tick(), 2000);
  },

  // ── TICK (každé 2s) ───────────────────────────────────────
  tick() {
    if (!GameState.athanor) return;
    const now = Date.now();

    // Brewing dokončení
    if (GameState.athanor.brewing) {
      const b = GameState.athanor.brewing;
      if (now >= b.expiresAt) {
        AthanorSystem.finishBrewing();
        return;
      }
    }

    // Aktivní efekty — expiry check
    const before = GameState.athanor.activeEffects.length;
    GameState.athanor.activeEffects = GameState.athanor.activeEffects.filter(e => e.expiresAt > now);
    if (GameState.athanor.activeEffects.length !== before) {
      AthanorSystem.refreshIfOpen();
    }
  },

  // ── START BREWING ─────────────────────────────────────────
  startBrewing() {
    const state = GameState.athanor;
    if (!state) return;

    const slots = state.slots.filter(Boolean);
    if (slots.length < 2) {
      UI.notify('⚗️ Přidej alespoň 2 ingredience do kelímku.', true);
      return;
    }
    if (!state.activeProcess) {
      UI.notify('⚗️ Zvol proces.', true);
      return;
    }
    if (state.brewing) {
      UI.notify('⚗️ Athanor již pracuje — počkej na výsledek.', true);
      return;
    }

    // Zkontroluj inventář
    const counts = {};
    slots.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    for (const [id, qty] of Object.entries(counts)) {
      if ((GameState.inventory[id] || 0) < qty) {
        const ing = AthanorDB.ingredients.find(i => i.id === id);
        UI.notify(`⚗️ Nemáš dostatek: ${ing ? ing.name : id}`, true);
        return;
      }
    }

    // Odečti ingredience
    for (const [id, qty] of Object.entries(counts)) {
      Game.removeItem(id, qty);
    }

    const process = AthanorDB.processes.find(p => p.id === state.activeProcess);
    const duration = process ? process.duration_ms : 10000;

    state.brewing = {
      slots: [...slots],
      processId: state.activeProcess,
      startedAt: Date.now(),
      expiresAt: Date.now() + duration,
      duration
    };

    Game.save();
    AthanorSystem.render('home-athanor-content');
  },

  // ── FINISH BREWING ────────────────────────────────────────
  finishBrewing() {
    const state = GameState.athanor;
    if (!state || !state.brewing) return;

    const { slots, processId } = state.brewing;
    state.brewing = null;
    state.slots = [];

    const result = CombinationEngine.evaluate(slots, processId);

    if (result.success) {
      const { combo, isCritical } = result;

      // Přidej výsledek (kritický = +1 bonus)
      const qty = combo.result.qty + (isCritical ? 1 : 0);
      Game.addItem(combo.result.id, qty);

      // Aplikuj efekt
      if (combo.effect) {
        AthanorSystem.applyEffect(combo.effect, combo.name);
      }

      // Discovery log
      const key = [...slots].sort().join('+') + ':' + processId;
      const isNewDiscovery = !state.discovered.includes(key);
      if (isNewDiscovery) {
        state.discovered.push(key);
      }

      // Ulož lastResult
      state.lastResult = {
        success: true,
        icon: combo.icon,
        name: combo.name,
        name_lat: combo.name_lat,
        lore: combo.lore,
        effectLabel: combo.effect ? combo.effect.label : null,
        qty: combo.result.qty + (isCritical ? 1 : 0),
        isCritical,
        isNewDiscovery
      };

      // Toast + zvuk
      const critText = isCritical ? ' ✨ Kritický úspěch!' : '';
      UI.notify(`⚗️ ${combo.icon} ${combo.name} — Dílo je dokonáno.${critText}`, false);
      AthanorSystem.playBrewingDone(isCritical);

    } else {
      const f = result.failure;

      // Ulož lastResult (selhání)
      state.lastResult = {
        success: false,
        icon: f.icon,
        title: f.title,
        msg: f.msg,
        lore: f.lore
      };

      UI.notify(`${f.icon} ${f.title} — ${f.msg}`, true);
      AthanorSystem.playBrewingFail();
    }

    Game.save();
    AthanorSystem.showResultModal(state.lastResult);
    AthanorSystem.render('home-athanor-content');
  },

  // ── SLOT MANAGEMENT ───────────────────────────────────────
  addToSlot(ingredientId) {
    const state = GameState.athanor;
    if (state.brewing) return; // nelze měnit za vaření
    if (state.slots.length >= 3) {
      UI.notify('⚗️ Kelímek je plný — nejprve odeber ingredienci.', true);
      return;
    }
    // Zkontroluj inventář (celkový počet tohoto ID v slotech vs inventáři)
    const alreadyIn = state.slots.filter(s => s === ingredientId).length;
    if ((GameState.inventory[ingredientId] || 0) <= alreadyIn) {
      UI.notify('⚗️ Nemáš dostatek surovin.', true);
      return;
    }
    state.slots.push(ingredientId);
    AthanorSystem.render('home-athanor-content');
  },

  removeFromSlot(index) {
    const state = GameState.athanor;
    if (state.brewing) return;
    state.slots.splice(index, 1);
    AthanorSystem.render('home-athanor-content');
  },

  setProcess(processId) {
    if (GameState.athanor.brewing) return;
    GameState.athanor.activeProcess = processId;
    AthanorSystem.render('home-athanor-content');
  },

  // ── APPLY EFFECT ──────────────────────────────────────────
  applyEffect(effect, sourceName) {
    const now = Date.now();
    switch (effect.type) {
      case 'vigor_restore':
        if (!GameState.vigor) break;
        GameState.vigor.current = Math.min(
          GameState.vigor.max,
          GameState.vigor.current + effect.value
        );
        break;
      case 'hunger_extend':
        if (!GameState.hunger) break;
        GameState.hunger.duration = (GameState.hunger.duration || 0) + effect.value;
        GameState.hunger.fed = true;
        break;
      case 'craft_boost':
        GameState.athanor.activeEffects = GameState.athanor.activeEffects.filter(
          e => e.type !== 'craft_boost'
        );
        GameState.athanor.activeEffects.push({
          type: 'craft_boost',
          value: effect.value,
          label: effect.label,
          source: sourceName,
          expiresAt: now + effect.duration_ms
        });
        break;
      case 'ink_efficiency':
        GameState.athanor.activeEffects = GameState.athanor.activeEffects.filter(
          e => e.type !== 'ink_efficiency'
        );
        GameState.athanor.activeEffects.push({
          type: 'ink_efficiency',
          value: effect.value,
          label: effect.label,
          source: sourceName,
          expiresAt: now + effect.duration_ms
        });
        break;
    }
  },

  // ── QUERY HELPERS ─────────────────────────────────────────
  getCraftSpeedMultiplier() {
    const boost = GameState.athanor?.activeEffects.find(e => e.type === 'craft_boost');
    return boost ? boost.value : 1.0;
  },

  hasInkEfficiency() {
    return GameState.athanor?.activeEffects.some(e => e.type === 'ink_efficiency') || false;
  },

  // ── SOUND: BREWING DONE ───────────────────────────────────
  // Tři klesající tóny — alchymistický signál dokončení.
  // Nevyžaduje audio.js — standalone Web Audio.
  playBrewingDone(isCritical) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const tones = isCritical
        ? [880, 1100, 1320]  // kritický = stoupající fanfára
        : [660, 550, 440];   // normální = klesající tóny
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.22 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.22);
        osc.stop(ctx.currentTime + i * 0.22 + 0.5);
      });
      setTimeout(() => ctx.close(), 2000);
    } catch (e) { /* audio není dostupné */ }
  },

  // ── SOUND: BREWING FAIL ───────────────────────────────────
  playBrewingFail() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      setTimeout(() => ctx.close(), 1500);
    } catch (e) { /* audio není dostupné */ }
  },

  // ── RENDER ────────────────────────────────────────────────
  // ── LUNAR + CANONICAL HELPERS ────────────────────────────
  getLunarPhase() {
    const now = new Date();
    const jd = 367*now.getFullYear()
      - Math.floor(7*(now.getFullYear()+Math.floor((now.getMonth()+10)/12))/4)
      + Math.floor(275*(now.getMonth()+1)/9)
      + now.getDate() + 1721013.5;
    const p = ((jd - 2451550.1) / 29.53058867) % 1;
    const phase = p < 0 ? p + 1 : p;
    if (phase < 0.03 || phase > 0.97) return { name:'Nov', icon:'🌑', bonus:'nigredo', label:'Nov — Nigredo +20%' };
    if (phase < 0.47) return { name:'Dorůstá', icon:'🌔', bonus:null, label:'Dorůstající měsíc' };
    if (phase < 0.53) return { name:'Úplněk', icon:'🌕', bonus:'rubedo', label:'Úplněk — Rubedo +20%' };
    return { name:'Ubývá', icon:'🌖', bonus:null, label:'Ubývající měsíc' };
  },

  getCanonicalHour() {
    const h = new Date().getHours();
    if (h >= 3  && h < 6)  return { name:'Laudes',       icon:'🌅', bonus:'quality', label:'Laudes — +10% kvalita' };
    if (h >= 6  && h < 9)  return { name:'Prima',        icon:'🌄', bonus:null,      label:'Prima' };
    if (h >= 9  && h < 12) return { name:'Tertia',       icon:'☀️', bonus:null,      label:'Tertia' };
    if (h >= 12 && h < 15) return { name:'Sexta',        icon:'🌞', bonus:null,      label:'Sexta' };
    if (h >= 15 && h < 18) return { name:'Nona',         icon:'🌤️', bonus:null,      label:'Nona' };
    if (h >= 18 && h < 21) return { name:'Vesper',       icon:'🌆', bonus:null,      label:'Vesper' };
    if (h >= 21 && h < 24) return { name:'Completorium', icon:'🌙', bonus:null,      label:'Completorium' };
    return { name:'Vigilia', icon:'⭐', bonus:null, label:'Vigilia noctis' };
  },

  buildStatsBar(lunar, canonical, state) {
    const ingMap = {};
    AthanorDB.ingredients.forEach(i => { ingMap[i.id] = i; });
    let thermal = 0, moisture = 0;
    (state.slots || []).forEach(id => {
      const ing = ingMap[id];
      if (ing) { thermal += ing.thermal; moisture += ing.moisture; }
    });
    const proc = AthanorDB.processes.find(p => p.id === state.activeProcess);
    if (proc) { thermal += proc.thermal_mod; moisture += proc.moisture_mod; }
    const tc = thermal > 2 ? '#e8501a' : thermal < -2 ? '#3a9ad9' : '#c9a96e';
    const mc = moisture > 2 ? '#3a9ad9' : moisture < -2 ? '#c8961e' : '#c9a96e';
    const bonusText = lunar.bonus === 'nigredo' ? 'Nov: Nigredo +20%'
                    : lunar.bonus === 'rubedo' ? 'Úplněk: Rubedo +20%'
                    : canonical.bonus === 'quality' ? 'Laudes: +10% kvalita' : '';
    return `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;
      padding:7px 12px;margin-bottom:14px;
      background:rgba(0,0,0,0.12);border-radius:8px;
      border:1px solid rgba(200,160,60,0.15);
      font-family:'Cinzel',serif;font-size:0.72rem;color:#c9a96e;">
      <span title="${lunar.label}">${lunar.icon} ${lunar.name}</span>
      <span style="opacity:0.3;">·</span>
      <span title="${canonical.label}">${canonical.icon} ${canonical.name}</span>
      <span style="opacity:0.3;">·</span>
      <span style="color:${tc};" title="Teplo">🌡️ ${thermal>0?'+':''}${thermal}</span>
      <span style="opacity:0.3;">·</span>
      <span style="color:${mc};" title="Vlhkost">💧 ${moisture>0?'+':''}${moisture}</span>
      ${bonusText ? `<span style="opacity:0.3;">·</span><span style="font-size:0.65rem;">✨ ${bonusText}</span>` : ''}
    </div>`;
  },

  buildAlembicSvg(state) {
    const isBrewing = !!state.brewing;
    const now = Date.now();
    let pct = 0, si = 0;
    if (isBrewing) {
      const b = state.brewing;
      pct = Math.min(100, Math.floor(((now - b.startedAt) / b.duration) * 100));
      si = pct < 33 ? 0 : pct < 66 ? 1 : 2;
    }
    const liqColors = ['#1a0f05','#d4cfc8','#8b1a1a'];
    const glowColors = ['rgba(80,40,10,0.5)','rgba(220,210,190,0.4)','rgba(180,40,40,0.6)'];
    const liq = isBrewing ? liqColors[si] : '#2a1a0a';
    const glow = isBrewing ? glowColors[si] : 'transparent';
    const bubbles = isBrewing ? `
      <circle cx="54" cy="88" r="3" fill="rgba(255,255,255,0.15)">
        <animate attributeName="cy" values="88;58;88" dur="2.1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.1s" repeatCount="indefinite"/>
      </circle>
      <circle cx="63" cy="95" r="2" fill="rgba(255,255,255,0.1)">
        <animate attributeName="cy" values="95;65;95" dur="1.7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0;0.5" dur="1.7s" repeatCount="indefinite"/>
      </circle>
      <circle cx="47" cy="92" r="2.5" fill="rgba(255,255,255,0.12)">
        <animate attributeName="cy" values="92;68;92" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite"/>
      </circle>` : '';
    const flame = isBrewing ? `
      <path d="M42,148 Q50,132 58,148 Q66,132 74,148" fill="rgba(200,80,0,0.5)" stroke="none">
        <animate attributeName="d" values="M42,148 Q50,132 58,148 Q66,132 74,148;M42,148 Q48,128 58,146 Q68,130 74,148;M42,148 Q50,132 58,148 Q66,132 74,148" dur="0.7s" repeatCount="indefinite"/>
      </path>
      <path d="M46,148 Q54,136 58,148 Q62,136 70,148" fill="rgba(240,140,0,0.5)" stroke="none">
        <animate attributeName="d" values="M46,148 Q54,136 58,148 Q62,136 70,148;M46,148 Q52,132 58,146 Q64,134 70,148;M46,148 Q54,136 58,148 Q62,136 70,148" dur="0.5s" repeatCount="indefinite"/>
      </path>` : '';
    return `<svg viewBox="0 0 120 155" width="120" height="155" xmlns="http://www.w3.org/2000/svg"
      style="filter:drop-shadow(0 0 14px ${glow});display:block;margin:0 auto;">
      <ellipse cx="58" cy="100" rx="44" ry="38" fill="${liq}" stroke="#5c3d1a" stroke-width="2"/>
      <ellipse cx="58" cy="110" rx="38" ry="26" fill="rgba(255,255,255,0.04)"/>
      <rect x="48" y="58" width="20" height="30" fill="${liq}" stroke="#5c3d1a" stroke-width="2" rx="2"/>
      <path d="M68 65 Q95 54 115 44" fill="none" stroke="#5c3d1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M68 65 Q95 54 115 44" fill="none" stroke="${liq}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <ellipse cx="58" cy="57" rx="13" ry="5" fill="rgba(92,61,26,0.6)" stroke="#5c3d1a" stroke-width="1.5"/>
      ${bubbles}
      ${isBrewing && pct > 50 ? `<circle cx="116" cy="43" r="3" fill="${liq}" opacity="0.8">
        <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite"/>
      </circle>` : ''}
      ${flame}
      <rect x="18" y="140" width="80" height="6" rx="3" fill="rgba(92,61,26,0.4)" stroke="#5c3d1a" stroke-width="1"/>
    </svg>`;
  },

  // Kategorie pro filtr ingrediencí
  _ingCategories: {
    all:      null,
    herbs:    ['chamomile','st_johns_wort','thyme','hops'],
    pigments: ['lapis_lazuli','ochre','cinnabar','carbon_black','malachite','egg_tempera','linseed_oil'],
    liquids:  ['water','wine','mercury','turpentine'],
    minerals: ['sulfur','chalk','gum_arabic','alum','pumice','oak_bark','gall_nut'],
    brewing:  ['grain','hops','wort','honey','thyme'],
  },

  _activeIngFilter: 'all',

  setIngFilter(cat) {
    AthanorSystem._activeIngFilter = cat;
    const el = document.getElementById('athanor-ing-list');
    if (el) {
      const state = GameState.athanor;
      const ingMap = {};
      AthanorDB.ingredients.forEach(i => { ingMap[i.id] = i; });
      el.innerHTML = AthanorSystem.buildIngredientListCompact(ingMap, state);
    }
    // Aktualizuj aktivní tlačítko
    document.querySelectorAll('.athanor-filter-btn').forEach(btn => {
      btn.style.background = btn.dataset.cat === cat
        ? 'rgba(200,160,60,0.25)' : 'rgba(0,0,0,0.04)';
      btn.style.color = btn.dataset.cat === cat
        ? 'var(--accent-gold)' : 'var(--ink-primary)';
    });
  },

  buildIngFilterBar() {
    const filters = [
      { id: 'all',      label: 'Vše' },
      { id: 'herbs',    label: '🌿 Byliny' },
      { id: 'pigments', label: '🎨 Pigmenty' },
      { id: 'liquids',  label: '💧 Tekutiny' },
      { id: 'minerals', label: '🪨 Minerály' },
      { id: 'brewing',  label: '🍺 Pivovar' },
    ];
    const active = AthanorSystem._activeIngFilter || 'all';
    return `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px;">
      ${filters.map(f => `<button class="athanor-filter-btn"
        data-cat="${f.id}"
        onclick="AthanorSystem.setIngFilter('${f.id}')"
        style="font-size:0.62rem;padding:2px 7px;border:1px solid rgba(0,0,0,0.15);border-radius:4px;cursor:pointer;
          background:${f.id===active?'rgba(200,160,60,0.25)':'rgba(0,0,0,0.04)'};
          color:${f.id===active?'var(--accent-gold)':'var(--ink-primary)'};
          font-family:'Crimson Text';">
        ${f.label}
      </button>`).join('')}
    </div>`;
  },

  buildIngredientListCompact(ingMap, state) {
    const isBrewing = !!state.brewing;
    const activeFilter = AthanorSystem._activeIngFilter || 'all';
    const filterIds = AthanorSystem._ingCategories[activeFilter];

    return AthanorDB.ingredients
      .filter(ing => !filterIds || filterIds.includes(ing.id))
      .map(ing => {
        const have = GameState.inventory[ing.id] || 0;
        const inSlots = state.slots.filter(s => s === ing.id).length;
        const available = have - inSlots;
        const canAdd = !isBrewing && available > 0 && state.slots.length < 3;
        return `<div style="display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:5px;
          border:1px solid ${canAdd ? 'rgba(200,160,60,0.3)' : 'transparent'};
          background:${have===0?'transparent':canAdd?'rgba(200,160,60,0.04)':'rgba(0,0,0,0.03)'};
          opacity:${have===0?'0.3':'1'};cursor:${canAdd?'pointer':'default'};"
          ${canAdd ? `onclick="AthanorSystem.addToSlot('${ing.id}')"` : ''}
          title="${ing.lore||''}">
          <span style="font-size:0.9rem;">${ing.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.74rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ing.name}</div>
            <div style="font-size:0.6rem;font-style:italic;opacity:0.5;">${ing.name_lat}</div>
          </div>
          <div style="font-size:0.75rem;font-weight:600;color:${have>0?'var(--accent-gold)':'#aaa'};">${available}</div>
        </div>`;
      }).join('');
  },

  render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!GameState.secrets || !GameState.secrets.laboratoryUnlocked) {
      SecretsSystem.renderAthanorScreen(containerId);
      return;
    }
    const state = GameState.athanor;
    const ingMap = {};
    AthanorDB.ingredients.forEach(i => { ingMap[i.id] = i; });
    const lunar = AthanorSystem.getLunarPhase();
    const canonical = AthanorSystem.getCanonicalHour();

    el.innerHTML = `
      <div style="padding:12px 8px;max-width:900px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:10px;">
          <h2 style="font-family:'Cinzel',serif;font-size:1.3rem;color:var(--accent-gold);letter-spacing:2px;">⚗️ Athanor Secretus</h2>
          <p style="font-style:italic;font-size:0.78rem;opacity:0.55;margin-top:2px;">Ignis latet in cinere — Oheň se skrývá v popelu</p>
        </div>
        ${AthanorSystem.buildStatsBar(lunar, canonical, state)}
        ${AthanorSystem.buildActiveEffectsHtml()}
        <div style="display:grid;grid-template-columns:210px 1fr 210px;gap:12px;align-items:start;" class="athanor-grid">

          <!-- LEVÝ PANEL: Ingredience -->
          <div style="background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.1);border-radius:8px;padding:10px;">
            <div style="font-family:'Cinzel',serif;font-size:0.68rem;letter-spacing:2px;opacity:0.5;text-transform:uppercase;margin-bottom:6px;">🌿 Ingredience</div>
            ${AthanorSystem.buildIngFilterBar()}
            <div id="athanor-ing-list" style="display:flex;flex-direction:column;gap:3px;max-height:440px;overflow-y:auto;" class="athanor-ing-mobile">
              ${AthanorSystem.buildIngredientListCompact(ingMap, state)}
            </div>
          </div>

          <!-- STŘED: Pracovní stůl -->
          <div style="background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.1);border-radius:8px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:10px;">
            ${AthanorSystem.buildAlembicSvg(state)}
            ${AthanorSystem.buildBrewingProgressHtml()}
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:100%;">
              ${AthanorSystem.buildSlotHtml(0, state, ingMap)}
              ${AthanorSystem.buildSlotHtml(1, state, ingMap)}
              ${AthanorSystem.buildSlotHtml(2, state, ingMap)}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
              ${AthanorDB.processes.map(p => AthanorSystem.buildProcessBtn(p, state)).join('')}
            </div>
            <div style="width:100%;">${AthanorSystem.buildStartBtn(state)}</div>
            ${AthanorSystem.buildLastResultHtml(state)}
          </div>

          <!-- PRAVÝ PANEL: Codex -->
          <div style="background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.1);border-radius:8px;padding:10px;">
            <div style="font-family:'Cinzel',serif;font-size:0.68rem;letter-spacing:2px;opacity:0.5;text-transform:uppercase;margin-bottom:8px;">
              📜 Codex Athanori
              <span style="font-size:0.62rem;display:block;margin-top:2px;">${state.discovered.length} / ${Object.keys(AthanorDB.combinations).length} odhaleno</span>
            </div>
            <div style="max-height:440px;overflow-y:auto;">${AthanorSystem.buildCodexHtml(state)}</div>
          </div>

        </div>
      </div>
      <style>
        @media(max-width:700px){
          .athanor-grid{grid-template-columns:1fr!important}
          .athanor-ing-mobile{max-height:220px!important}
        }
      </style>
    `;
  },

  // ── BUILD: SLOT ───────────────────────────────────────────
  buildSlotHtml(index, state, ingMap) {
    const id = state.slots[index];
    const ing = id ? ingMap[id] : null;
    const isBrewing = !!state.brewing;

    if (ing) {
      return `
        <div style="
          flex:1;min-width:80px;min-height:72px;
          border:2px solid var(--accent-gold);
          border-radius:8px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          background:rgba(var(--accent-gold-rgb,200,160,60),0.08);
          position:relative;cursor:${isBrewing ? 'default' : 'pointer'};
          padding:8px 4px;
        " ${isBrewing ? '' : `onclick="AthanorSystem.removeFromSlot(${index})"`}
           title="${isBrewing ? '' : 'Klikni pro odebrání'}">
          <span style="font-size:1.4rem;">${ing.icon}</span>
          <span style="font-size:0.68rem;margin-top:3px;text-align:center;opacity:0.8;">${ing.name}</span>
          ${!isBrewing ? `<span style="position:absolute;top:3px;right:5px;font-size:0.65rem;opacity:0.4;">✕</span>` : ''}
        </div>
      `;
    }

    return `
      <div style="
        flex:1;min-width:80px;min-height:72px;
        border:2px dashed rgba(0,0,0,0.2);
        border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        opacity:0.4;font-size:1.4rem;
      ">+</div>
    `;
  },

  // ── BUILD: PROCESS BUTTON ─────────────────────────────────
  buildProcessBtn(process, state) {
    const isActive = state.activeProcess === process.id;
    const isBrewing = !!state.brewing;
    const isLocked = process.unlock && !(GameState.tech && GameState.tech[process.unlock]);

    return `
      <button
        onclick="${isLocked || isBrewing ? '' : `AthanorSystem.setProcess('${process.id}')`}"
        style="
          padding:5px 10px;
          background:${isActive ? 'var(--accent-gold)' : 'rgba(0,0,0,0.06)'};
          color:${isActive ? '#1a1410' : isLocked ? '#aaa' : 'inherit'};
          border:1px solid ${isActive ? 'var(--accent-gold)' : 'rgba(0,0,0,0.15)'};
          border-radius:4px;
          font-size:0.75rem;
          cursor:${isLocked || isBrewing ? 'not-allowed' : 'pointer'};
          font-family:inherit;
          opacity:${isLocked ? '0.5' : '1'};
        "
        title="${process.desc}${isLocked ? ' [Zamčeno]' : ''}"
        ${isLocked || isBrewing ? 'disabled' : ''}
      >${process.icon} ${process.name_cs}${isLocked ? ' 🔒' : ''}</button>
    `;
  },

  // ── BUILD: START BUTTON ───────────────────────────────────
  buildStartBtn(state) {
    const isBrewing = !!state.brewing;
    const hasSlots = state.slots.filter(Boolean).length >= 2;
    const canStart = !isBrewing && hasSlots;

    return `
      <button
        onclick="${canStart ? 'AthanorSystem.startBrewing()' : ''}"
        style="
          width:100%;
          padding:9px;
          background:${canStart ? 'var(--accent-gold)' : 'rgba(0,0,0,0.08)'};
          color:${canStart ? '#1a1410' : '#999'};
          border:1px solid ${canStart ? 'var(--accent-gold)' : 'rgba(0,0,0,0.15)'};
          border-radius:6px;
          font-size:0.85rem;
          font-weight:600;
          cursor:${canStart ? 'pointer' : 'not-allowed'};
          font-family:'Cinzel',serif;
          letter-spacing:1px;
        "
        ${canStart ? '' : 'disabled'}
      >${isBrewing ? '⚗️ Athanor pracuje...' : '⚗️ Spustit Athanor'}</button>
    `;
  },

  // ── BUILD: BREWING PROGRESS ───────────────────────────────
  buildBrewingProgressHtml() {
    const b = GameState.athanor?.brewing;
    if (!b) return '';

    const now = Date.now();
    const elapsed = now - b.startedAt;
    const pct = Math.min(100, Math.floor((elapsed / b.duration) * 100));

    // Stage: 0-33% nigredo, 33-66% albedo, 66-100% rubedo
    const stageIndex = pct < 33 ? 0 : pct < 66 ? 1 : 2;
    const stage = AthanorDB.stages[stageIndex];

    const remaining = Math.max(0, Math.ceil((b.expiresAt - now) / 1000));

    const stageIcons = ['🌑','🌕','🔴'];
    return `
      <div style="
        width:100%;
        background:${stage.color};
        border:1px solid rgba(200,160,60,0.2);
        border-radius:8px;
        padding:10px 12px;
        color:#e8d5a3;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:${stage.textColor};font-family:'Cinzel',serif;font-size:0.8rem;letter-spacing:1px;">
            ${stageIcons[stageIndex]} ${stage.label}
          </span>
          <span style="font-size:0.75rem;opacity:0.6;">${remaining}s</span>
        </div>
        <div style="font-style:italic;font-size:0.76rem;opacity:0.7;margin-bottom:10px;">
          ${stage.desc}
        </div>
        <div style="background:rgba(0,0,0,0.3);border-radius:4px;height:6px;overflow:hidden;">
          <div style="
            width:${pct}%;
            height:100%;
            background:${stage.textColor};
            transition:width 2s linear;
            border-radius:4px;
          "></div>
        </div>
      </div>
    `;
  },

  // ── BUILD: INGREDIENT LIST ────────────────────────────────
  buildIngredientList(ingMap, state) {
    const isBrewing = !!state.brewing;
    return AthanorDB.ingredients.map(ing => {
      const have = GameState.inventory[ing.id] || 0;
      const inSlots = state.slots.filter(s => s === ing.id).length;
      const available = have - inSlots;
      const canAdd = !isBrewing && available > 0 && state.slots.length < 3;

      if (have === 0) {
        return `
          <div style="
            border:1px solid rgba(0,0,0,0.08);
            border-radius:6px;padding:8px 10px;
            opacity:0.35;
            display:flex;align-items:center;gap:8px;
          ">
            <span style="font-size:1rem;">${ing.icon}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.78rem;font-weight:600;">${ing.name}</div>
              <div style="font-size:0.68rem;font-style:italic;opacity:0.6;">${ing.name_lat}</div>
            </div>
            <span style="font-size:0.72rem;opacity:0.5;">0</span>
          </div>
        `;
      }

      return `
        <div style="
          border:1px solid ${canAdd ? 'rgba(200,160,60,0.3)' : 'rgba(0,0,0,0.1)'};
          border-radius:6px;padding:8px 10px;
          display:flex;align-items:center;gap:8px;
          cursor:${canAdd ? 'pointer' : 'default'};
          background:${canAdd ? 'rgba(200,160,60,0.04)' : 'transparent'};
        "
        ${canAdd ? `onclick="AthanorSystem.addToSlot('${ing.id}')"` : ''}
        title="${ing.lore || ''}">
          <span style="font-size:1rem;">${ing.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.78rem;font-weight:600;">${ing.name}</div>
            <div style="font-size:0.68rem;font-style:italic;opacity:0.55;">${ing.name_lat}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:0.8rem;font-weight:600;color:var(--accent-gold);">${available}</div>
            ${inSlots > 0 ? `<div style="font-size:0.65rem;opacity:0.5;">(${inSlots} v kelímku)</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  // ── BUILD: CODEX ──────────────────────────────────────────
  buildCodexHtml(state) {
    if (state.discovered.length === 0) {
      return `
        <div style="padding:16px;text-align:center;opacity:0.5;font-style:italic;font-size:0.8rem;">
          Codex je prázdný. Začni experimentovat — každý objev bude zapsán zde.
        </div>
      `;
    }

    const rows = state.discovered.map(key => {
      const combo = AthanorDB.combinations[key];
      if (!combo) return '';
      const [ingPart, procId] = key.split(':');
      const proc = AthanorDB.processes.find(p => p.id === procId);
      return `
        <div style="
          border:1px solid rgba(0,0,0,0.1);
          border-left:3px solid var(--accent-gold);
          border-radius:6px;
          padding:10px 12px;
          margin-bottom:8px;
        ">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:1rem;">${combo.icon}</span>
            <strong style="font-size:0.88rem;">${combo.name}</strong>
            <span style="font-style:italic;font-size:0.72rem;opacity:0.5;">${combo.name_lat}</span>
            <span style="margin-left:auto;font-size:0.72rem;opacity:0.5;">${proc ? proc.icon + ' ' + proc.name_cs : ''}</span>
          </div>
          <div style="font-size:0.74rem;opacity:0.6;font-style:italic;">${combo.lore}</div>
          ${combo.effect ? `<div style="font-size:0.72rem;color:#2c6e49;margin-top:4px;">✨ ${combo.effect.label}</div>` : ''}
        </div>
      `;
    }).join('');

    return `<div>${rows}</div>`;
  },

  // ── BUILD: ACTIVE EFFECTS ─────────────────────────────────
  buildActiveEffectsHtml() {
    if (!GameState.athanor?.activeEffects?.length) return '';
    const now = Date.now();
    const items = GameState.athanor.activeEffects.map(e => {
      const remaining = Math.max(0, e.expiresAt - now);
      const mins = Math.ceil(remaining / 60000);
      return `<span style="font-size:0.76rem;background:rgba(44,110,73,0.15);border:1px solid rgba(44,110,73,0.3);border-radius:12px;padding:3px 10px;color:#2c6e49;">
        ✨ ${e.label} — ${mins} min
      </span>`;
    }).join('');
    return `
      <div style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:rgba(44,110,73,0.05);border-radius:6px;">
        <span style="font-size:0.7rem;opacity:0.5;width:100%;margin-bottom:2px;">Aktivní efekty:</span>
        ${items}
      </div>
    `;
  },

  // ── MODAL: výsledek vaření ───────────────────────────────
  showResultModal(result) {
    if (!result) return;

    // Odstraň existující modal
    const existing = document.getElementById('athanor-result-modal');
    if (existing) existing.remove();

    const isSuccess = result.success;
    const borderColor = isSuccess
      ? (result.isCritical ? '#e8c44a' : 'rgba(200,160,60,0.6)')
      : 'rgba(180,60,60,0.5)';
    const bgColor = isSuccess
      ? (result.isCritical ? 'rgba(40,30,10,0.97)' : 'rgba(25,20,10,0.97)')
      : 'rgba(25,10,10,0.97)';
    const headerColor = isSuccess
      ? (result.isCritical ? '#e8c44a' : '#c9a96e')
      : '#c04040';

    const successBody = isSuccess ? `
      <div style="font-size:3.5rem;margin-bottom:12px;">${result.icon}</div>
      <div style="font-family:'Cinzel',serif;font-size:1.2rem;color:${headerColor};letter-spacing:1px;margin-bottom:4px;">
        ${result.isCritical ? '✨ Kritický úspěch!' : 'Dílo je dokonáno'}
      </div>
      <div style="font-size:1rem;font-weight:600;margin-bottom:2px;">${result.name}</div>
      <div style="font-style:italic;font-size:0.78rem;opacity:0.55;margin-bottom:14px;">${result.name_lat}</div>
      ${result.isNewDiscovery ? `<div style="background:rgba(200,160,60,0.15);border:1px solid rgba(200,160,60,0.3);border-radius:6px;padding:8px 14px;margin-bottom:12px;font-size:0.8rem;color:#c9a96e;">📜 Nový objev — zapsáno do Codexu Athanori</div>` : ''}
      <div style="font-size:0.8rem;opacity:0.65;font-style:italic;margin-bottom:12px;line-height:1.5;">${result.lore}</div>
      ${result.effectLabel ? `<div style="font-size:0.78rem;color:#2c6e49;margin-bottom:12px;">✨ ${result.effectLabel}</div>` : ''}
      <div style="font-size:0.8rem;opacity:0.5;">Získáno: ${result.qty}×</div>
    ` : `
      <div style="font-size:3rem;margin-bottom:12px;">${result.icon}</div>
      <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:${headerColor};letter-spacing:1px;margin-bottom:10px;">
        ${result.title}
      </div>
      <div style="font-size:0.85rem;line-height:1.6;margin-bottom:12px;">${result.msg}</div>
      <div style="font-size:0.75rem;opacity:0.5;font-style:italic;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;">${result.lore}</div>
    `;

    const modal = document.createElement('div');
    modal.id = 'athanor-result-modal';
    modal.style.cssText = `
      position:fixed;top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.75);
      display:flex;align-items:center;justify-content:center;
      z-index:9999;
      padding:20px;
    `;
    modal.innerHTML = `
      <div style="
        background:${bgColor};
        border:2px solid ${borderColor};
        border-radius:12px;
        padding:28px 24px;
        max-width:420px;
        width:100%;
        text-align:center;
        box-shadow:0 8px 40px rgba(0,0,0,0.6);
        position:relative;
        color:#e8d5a3;
      ">
        ${successBody}
        <div style="display:flex;gap:10px;margin-top:18px;justify-content:center;">
          <button onclick="document.getElementById('athanor-result-modal').remove()"
            style="
              padding:8px 20px;
              background:rgba(255,255,255,0.08);
              color:inherit;border:1px solid rgba(255,255,255,0.15);
              border-radius:6px;font-size:0.82rem;cursor:pointer;font-family:inherit;
            ">Zavřít</button>
          <button onclick="document.getElementById('athanor-result-modal').remove();AthanorSystem.render('home-athanor-content')"
            style="
              padding:8px 20px;
              background:var(--accent-gold);
              color:#1a1410;border:1px solid var(--accent-gold);
              border-radius:6px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:inherit;
            ">⚗️ Do Athanoru</button>
        </div>
      </div>
    `;

    // Zavření klikem na overlay
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  },

  // ── LAST RESULT PANEL ─────────────────────────────────────
  buildLastResultHtml(state) {
    const r = state.lastResult;
    if (!r) return '';

    const isSuccess = r.success;
    const bg = isSuccess ? 'rgba(44,110,73,0.08)' : 'rgba(180,60,60,0.08)';
    const border = isSuccess ? 'rgba(44,110,73,0.3)' : 'rgba(180,60,60,0.3)';
    const titleColor = isSuccess ? '#2c6e49' : '#c04040';

    const body = isSuccess ? `
      <span style="font-size:1.2rem;">${r.icon}</span>
      <div style="flex:1;">
        <div style="font-size:0.82rem;font-weight:600;color:${titleColor};">
          ${r.isCritical ? '✨ ' : ''}${r.name}
          <span style="font-style:italic;opacity:0.55;font-size:0.72rem;margin-left:6px;">${r.name_lat}</span>
        </div>
        <div style="font-size:0.74rem;opacity:0.6;font-style:italic;">${r.lore}</div>
        ${r.effectLabel ? `<div style="font-size:0.72rem;color:#2c6e49;margin-top:2px;">✨ ${r.effectLabel}</div>` : ''}
        ${r.isNewDiscovery ? `<div style="font-size:0.72rem;color:#c9a96e;margin-top:2px;">📜 Nový objev</div>` : ''}
      </div>
    ` : `
      <span style="font-size:1.2rem;">${r.icon}</span>
      <div style="flex:1;">
        <div style="font-size:0.82rem;font-weight:600;color:${titleColor};">${r.title}</div>
        <div style="font-size:0.74rem;opacity:0.6;">${r.msg}</div>
      </div>
    `;

    return `
      <div style="
        display:flex;gap:10px;align-items:flex-start;
        background:${bg};border:1px solid ${border};
        border-radius:8px;padding:10px 12px;margin-bottom:14px;
        position:relative;
      ">
        <span style="font-size:0.65rem;opacity:0.4;position:absolute;top:4px;right:6px;">Poslední výsledek</span>
        ${body}
        <button onclick="GameState.athanor.lastResult=null;AthanorSystem.render('home-athanor-content')"
          style="background:none;border:none;opacity:0.3;cursor:pointer;font-size:0.8rem;padding:0 2px;align-self:flex-start;margin-top:2px;">✕</button>
      </div>
    `;
  },

  // ── HELPER: překresli pokud je tab otevřen ────────────────
  refreshIfOpen() {
    const el = document.getElementById('home-athanor-content');
    if (el && el.style.display !== 'none') AthanorSystem.render('home-athanor-content');
  }
};