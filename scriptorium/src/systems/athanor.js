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
      name: 'Voda', name_en: 'Water', name_lat: 'Aqua',
      rarity: 'common', source: 'existing',
      color: '#6fa8dc', icon: '💧',
      thermal: -2, moisture: 4,
      lore: 'Základ všeho. Aqua vitae i aqua mortis.',
      lore_en: 'The basis of everything. Aqua vitae and aqua mortis alike.'
    },
    {
      id: 'gum_arabic',
      name: 'Guma arabská', name_en: 'Gum Arabic', name_lat: 'Gummi Arabicum',
      rarity: 'uncommon', source: 'existing',
      color: '#c9a96e', icon: '🫙',
      thermal: 0, moisture: 1,
      lore: 'Prysk z akácie. Váže pigment k pergamenu.',
      lore_en: 'Resin from the acacia tree. Binds pigment to vellum.'
    },
    {
      id: 'gall_nut',
      name: 'Duběnka', name_en: 'Oak Gall', name_lat: 'Galla',
      rarity: 'uncommon', source: 'existing',
      color: '#8b6914', icon: '🌰',
      thermal: -1, moisture: -2,
      lore: 'Hálka na dubovém listu. Základ ferrogalického inkoustu.',
      lore_en: 'A gall on an oak leaf. The base of iron gall ink.'
    },
    {
      id: 'chalk',
      name: 'Křída', name_en: 'Chalk', name_lat: 'Creta',
      rarity: 'common', source: 'existing',
      color: '#f0f0e8', icon: '🪨',
      thermal: 0, moisture: -1,
      lore: 'Běloba pro iluminátory. Základ základů.',
      lore_en: 'Whiting for illuminators. The foundation of foundations.'
    },
    {
      id: 'honey',
      name: 'Med', name_en: 'Honey', name_lat: 'Mel',
      rarity: 'common', source: 'existing',
      color: '#f0c040', icon: '🍯',
      thermal: 2, moisture: 2,
      lore: 'Klášterní med. Sladí i váže. Hildegarda ho chválila.',
      lore_en: 'Monastery honey. Sweetens and binds alike. Hildegard praised it.'
    },
    {
      id: 'propolis',
      name: 'Propolis', name_en: 'Propolis', name_lat: 'Propolis',
      rarity: 'uncommon', source: 'existing',
      color: '#5a3a1a', icon: '🟤',
      thermal: 1, moisture: -2,
      lore: 'Pryskyřičný tmel z úlu. Včely jím utěsňují škvíry proti chladu i hnilobě.',
      lore_en: 'Resinous hive-sealant. Bees use it to seal cracks against cold and rot.'
    },
    {
      id: 'bee_bread',
      name: 'Včelí chléb', name_en: 'Bee Bread', name_lat: 'Panis Apium',
      rarity: 'uncommon', source: 'existing',
      color: '#6b4423', icon: '🟫',
      thermal: 3, moisture: 1,
      lore: 'Pyl zkvašený s medem v plástvi. Hippokratés a Plinius jej chválili jako posilující.',
      lore_en: 'Pollen fermented with honey in the comb. Hippocrates and Pliny praised it as a strengthening food.'
    },
    {
      id: 'carbon_black',
      name: 'Saze', name_en: 'Carbon Black', name_lat: 'Carbo Niger',
      rarity: 'common', source: 'foraging',
      color: '#1a1a1a', icon: '🖤',
      thermal: 4, moisture: -3,
      lore: 'Saze z krbu nebo loučí. Nejstarší černý pigment světa.',
      lore_en: 'Soot from the hearth or a torch. The oldest black pigment in the world.',
      dropNote: 'Sbírej u krbu nebo z pochodně.'
    },
    {
      id: 'ochre',
      name: 'Okr', name_en: 'Ochre', name_lat: 'Ochra',
      rarity: 'common', source: 'foraging',
      color: '#cc7722', icon: '🟤',
      thermal: 1, moisture: -2,
      lore: 'Žlutohnědá zemina bohatá na oxid železitý. Používána od pravěku.',
      lore_en: 'Yellow-brown earth rich in iron oxide. Used since prehistory.',
      dropNote: 'Nalézáš v jílovitých místech při průzkumu.'
    },
    {
      id: 'cinnabar',
      name: 'Rumělka', name_en: 'Cinnabar', name_lat: 'Cinnabaris',
      rarity: 'uncommon', source: 'trade',
      color: '#c0392b', icon: '🔴',
      thermal: 2, moisture: -2,
      lore: 'Sulfid rtuťnatý. Zářivě červená, ale jedovatá. Rubrikátoři si olizovali štětce — a přicházeli o zuby.',
      lore_en: 'Mercuric sulfide. Brilliant red, but poisonous. Rubricators who licked their brushes lost their teeth for it.',
      dropNote: 'Vrchnost ji občas věnuje jako dík za příspěvek do své pokladny.',
      dropNote_en: 'The lord sometimes gifts it in thanks for a contribution to his coffers.'
    },
    {
      id: 'lapis_lazuli',
      name: 'Lapis lazuli', name_en: 'Lapis Lazuli', name_lat: 'Lapis Lazuli',
      rarity: 'rare', source: 'trade',
      color: '#1f4e91', icon: '💎',
      thermal: -1, moisture: 0,
      lore: 'Dražší než zlato. Dovážen z Afghánistánu. Barva Panny Marie. Jeptišky z Dalheim měly z něj modré zuby.',
      lore_en: 'More precious than gold. Imported from Afghanistan. The colour of the Virgin. Nuns at Dalheim had blue teeth from it.',
      dropNote: 'Vzácné zboží — přinese jej občas potulný poutník nebo zprávy od Giacoma.',
      dropNote_en: 'Rare goods — occasionally brought by a wandering pilgrim or news from Giacomo.'
    },
    {
      id: 'verdigris',
      name: 'Měděnka', name_en: 'Verdigris', name_lat: 'Viride Aeris',
      rarity: 'uncommon', source: 'craft',
      color: '#2ecc71', icon: '🟢',
      thermal: -1, moisture: 1,
      lore: 'Zelenomodrá patina na mědi. Vzniká působením octa na měděný plech.',
      lore_en: 'A blue-green patina on copper. Formed by the action of vinegar on copper sheet.',
      dropNote: 'Vyrobit: měděný plech + ocet.'
    },
    {
      id: 'egg_tempera',
      name: 'Vaječná tempera', name_en: 'Egg Tempera', name_lat: 'Temperum Ovi',
      rarity: 'common', source: 'craft',
      color: '#f5deb3', icon: '🥚',
      thermal: 0, moisture: 1,
      lore: 'Žloutek rozmíchaný s trochou vína. Nejstarší pojivo pigmentů v Evropě.',
      lore_en: 'Egg yolk stirred with a little wine. The oldest pigment binder in Europe.',
      dropNote: 'Vyrobit: vejce + víno.'
    },
    {
      id: 'chamomile',
      name: 'Heřmánek', name_en: 'Chamomile', name_lat: 'Chamomilla',
      rarity: 'common', source: 'foraging',
      color: '#f0e68c', icon: '🌼',
      thermal: -1, moisture: 1,
      lore: 'Matka bylinek. Hildegarda z Bingenu ji doporučovala na žaludeční potíže i smutek duše.',
      lore_en: 'Mother of herbs. Hildegard of Bingen recommended it for stomach troubles and sorrow of the soul.',
      dropNote: 'Roste na loukách při průzkumu.'
    },
    {
      id: 'st_johns_wort',
      name: 'Třezalka', name_en: "St. John's Wort", name_lat: 'Hypericum',
      rarity: 'common', source: 'foraging',
      color: '#ffd700', icon: '🌻',
      thermal: 2, moisture: -2,
      lore: 'Bylina svatého Jana. Červený olej z jejích květů léčil rány i melancholii.',
      lore_en: 'The herb of St. John. Red oil from its flowers healed wounds as well as melancholy.',
      dropNote: 'Kvete v létě, sbírej při průzkumu.'
    },
    {
      id: 'plantain',
      name: 'Jitrocel', name_en: 'Plantain', name_lat: 'Plantago Major',
      rarity: 'common', source: 'foraging',
      color: '#6b8e4e', icon: '🌿',
      thermal: -1, moisture: -1,
      lore: 'Poutníkova bylina. Roste u každé cesty — přiložený list zastaví krvácení, odvar tiší kašel.',
      lore_en: "The pilgrim's herb. Grows by every road — a leaf laid on stops bleeding, a decoction soothes coughs.",
      dropNote: 'Roste u cest a mezí, sbírej při průzkumu.'
    },
    {
      id: 'beeswax',
      name: 'Včelí vosk', name_en: 'Beeswax', name_lat: 'Cera Alba',
      rarity: 'uncommon', source: 'foraging',
      color: '#f5c842', icon: '🕯️',
      thermal: 1, moisture: -1,
      lore: 'Čistý vosk z klášterního úlu. Pojivo masti i materiál pro pečetění listin.',
      lore_en: 'Pure wax from the monastery hive. A binder for salves and material for sealing letters.',
      dropNote: 'Nalézáš při průzkumu v blízkosti lesa.'
    },

    // ── NOVÁ VLNA — z Alchemix (historicky věrné) ──
    {
      id: 'vitriol',
      name: 'Zelená skalice', name_en: 'Green Vitriol', name_lat: 'Vitriolum Viride',
      rarity: 'uncommon', source: 'trade',
      color: '#2d6e3e', icon: '🧪',
      thermal: 3, moisture: -3,
      lore: 'Síran železnatý. Klíčová složka ferrogalického inkoustu — bez ní není pravý skriptorský inkoust.',
      lore_en: 'Iron sulfate. A key ingredient of iron gall ink — without it there is no true scriptorium ink.',
      dropNote: 'Vzácný nález konvršů při těžbě v dole.',
      dropNote_en: 'A rare find by lay brothers while mining.'
    },
    {
      id: 'alum',
      name: 'Kamenec', name_en: 'Alum', name_lat: 'Alumen',
      rarity: 'uncommon', source: 'trade',
      color: '#d4e8f0', icon: '💠',
      thermal: -2, moisture: -4,
      lore: 'Síran hlinito-draselný. Fixátor barviv, konzervant pergamenu. Bez kamence by každý rukopis splaskl.',
      lore_en: 'Potassium aluminium sulfate. A dye fixative and vellum preservative. Without alum, every manuscript would sag.',
      dropNote: 'Dostupný u obchodníků na trhu.'
    },
    {
      id: 'vinegar',
      name: 'Ocet', name_en: 'Vinegar', name_lat: 'Acetum',
      rarity: 'common', source: 'existing',
      color: '#d4c97a', icon: '🍶',
      thermal: -1, moisture: 2,
      lore: 'Kyselý přítel alchymisty. Rozpouští, čistí, fixuje. Ocet s mědí dává měděnku.',
      lore_en: "The alchemist's sour friend. Dissolves, cleans, fixes. Vinegar with copper yields verdigris.",
      dropNote: 'Běžná kuchyňská surovina.'
    },
    {
      id: 'wine',
      name: 'Víno', name_en: 'Wine', name_lat: 'Vinum',
      rarity: 'common', source: 'existing',
      color: '#8b2252', icon: '🍷',
      thermal: 2, moisture: 2,
      lore: 'Dar révy. Pojivo vaječné tempery, základ tinktur, útěcha písaře po dlouhém dni.',
      lore_en: "The gift of the vine. A binder for egg tempera, the base of tinctures, a scribe's comfort after a long day.",
      dropNote: 'Z klášterního sklepa nebo od hospodského.'
    },
    {
      id: 'rose',
      name: 'Růže', name_en: 'Wild Rose', name_lat: 'Rosa',
      rarity: 'uncommon', source: 'foraging',
      color: '#e8748a', icon: '🌹',
      thermal: -1, moisture: 2,
      lore: 'Klášterní zahrada bez růže je jako rukopis bez iluminace. Aqua Rosarum léčí i duši.',
      lore_en: 'A monastery garden without a rose is like a manuscript without illumination. Aqua Rosarum heals the soul too.',
      dropNote: 'Sbírej v klášterní zahradě nebo při průzkumu.'
    },
    {
      id: 'linseed_oil',
      name: 'Lněný olej', name_en: 'Linseed Oil', name_lat: 'Oleum Lini',
      rarity: 'uncommon', source: 'trade',
      color: '#c8a84b', icon: '🫗',
      thermal: 2, moisture: 2,
      lore: 'Schnoucí olej ze lnu. Základ laků na pergamen i fermeže. Bez něj by iluminace nesvítily.',
      lore_en: 'A drying oil from flax. The base of varnishes and glazes for vellum. Without it, illuminations would not shine.',
      dropNote: 'Dostupný u obchodníka nebo na trhu.'
    },
    {
      id: 'sulfur',
      name: 'Síra', name_en: 'Sulfur', name_lat: 'Sulphur',
      rarity: 'uncommon', source: 'trade',
      color: '#e8d44a', icon: '🟡',
      thermal: 3, moisture: -3,
      lore: 'Prima Materia alchymie. Hoří modře, páchne peklem. Bez síry není transmutace.',
      lore_en: 'The Prima Materia of alchemy. Burns blue, reeks of hell. Without sulfur there is no transmutation.',
      dropNote: 'Vzácné zboží — přinese jej občas potulný poutník nebo zprávy od Giacoma.',
      dropNote_en: 'Rare goods — occasionally brought by a wandering pilgrim or news from Giacomo.'
    },    {
      id: 'sandarak',
      name: 'Sandarak', name_en: 'Sandarac', name_lat: 'Sandaraca',
      rarity: 'uncommon', source: 'trade',
      color: '#d4a870', icon: '🫙',
      thermal: 2, moisture: -2,
      lore: 'Pryskyřice berberskéhocypřiše. Základ průzračného laku Vernix — chrání pergamen před vlhkostí.',
      lore_en: 'Resin of the Barbary thuja tree. The base of the clear varnish Vernix — protects vellum from damp.',
      dropNote: 'Vzácné zboží od Giacoma Foscariho.'
    },
    {
      id: 'oak_bark',
      name: 'Dubová kůra', name_en: 'Oak Bark', name_lat: 'Cortex Quercus',
      rarity: 'common', source: 'foraging',
      color: '#6b4a2a', icon: '🌳',
      thermal: 0, moisture: -2,
      lore: 'Třísloviny z dubové kůry. Slouží k vydělávání kůže i jako základ taninu pro fixaci barviv.',
      lore_en: 'Tannins from oak bark. Used for tanning hides and as a base for fixing dyes.',
      dropNote: 'Sbírej při průzkumu v lese.'
    },
    {
      id: 'vrbova_kura',
      name: 'Vrbová kůra', name_en: 'Willow Bark', name_lat: 'Cortex Salicis',
      rarity: 'common', source: 'foraging',
      color: '#8ba888', icon: '🌿',
      thermal: -2, moisture: 1,
      lore: 'Chladná a vlhká kůra vrby. Přírodní tišitel horečky a bolesti — základ Contraria contrariis proti Žluté žluči.',
      lore_en: 'Cool, moist willow bark. A natural fever and pain reliever — the base of Contraria contrariis against Yellow Bile.',
      dropNote: 'Sbírej při loupání kůry ze stromu.'
    },
    {
      id: 'grain', name: 'Obilí', name_en: 'Grain', name_lat: 'Granum', rarity: 'common', source: 'existing',
      color: '#d4a820', icon: '🌾', thermal: 1, moisture: 2,
      lore: 'Základ chleba i piva. Kláštery pěstovaly obilí od nepaměti.',
      lore_en: 'The base of bread and beer alike. Monasteries have grown grain since time immemorial.'
    },
    {
      id: 'hops', name: 'Chmel', name_en: 'Hops', name_lat: 'Humulus', rarity: 'uncommon', source: 'existing',
      color: '#7aad4a', icon: '🌿', thermal: -1, moisture: 1,
      lore: 'Hildegarda jako první popsala chmel jako konzervantu piva. Hořkost, vůně, zdraví.',
      lore_en: 'Hildegard was the first to describe hops as a preservative for beer. Bitterness, aroma, health.',
      dropNote: 'Sbírej při průzkumu nebo nakup na Trhu.'
    },
    {
      id: 'thyme', name: 'Tymián', name_en: 'Thyme', name_lat: 'Thymus', rarity: 'common', source: 'existing',
      color: '#8ab87a', icon: '🌿', thermal: 1, moisture: 0,
      lore: 'Odvání Varroa z úlů. Hildegarda ho znala jako bylinu síly a odvahy.',
      lore_en: 'Drives Varroa from the hives. Hildegard knew it as a herb of strength and courage.',
      dropNote: 'Sbírej při průzkumu nebo pěstuj v zahradě.'
    },
    {
      id: 'wort', name: 'Mladina', name_en: 'Wort', name_lat: 'Mustum Cerevisiae', rarity: 'uncommon', source: 'crafted',
      color: '#c8a84b', icon: '🫗', thermal: 2, moisture: 2,
      lore: 'Zlatavá tekutina z povařeného obilí. Základ každého piva. Vzniká jen v Athanoru.',
      lore_en: 'The golden liquid from boiled grain. The base of every beer. Arises only in the Athanor.'
    },

    // ── Doplnění (athanor-integrity-audit.md) — 31 ingrediencí použitých
    // v combos, ale dosud nezaregistrovaných zde. Bez tohoto záznamu je
    // ingredience v pickeru neviditelná, i když ji hráč v inventáři má.
    {
      id: 'rosemary', name: 'Rozmarýn', name_en: 'Rosemary', name_lat: 'Rosmarinus', rarity: 'common', source: 'existing',
      color: '#6b8e4e', icon: '🌿', thermal: 2, moisture: -2,
      lore: 'Prohřívací a vysušující bylina Středomoří.',
      lore_en: 'A warming, drying herb of the Mediterranean.'
    },
    {
      id: 'substantia_ignota', name: 'Neznámá substance', name_en: 'Unknown Substance', name_lat: 'Substantia Ignota', rarity: 'rare', source: 'trade',
      color: '#7f8c8d', icon: '❓', thermal: 0, moisture: 0,
      lore: 'Nikdo neví, co to je. Ani poutník sám to neřekl.',
      lore_en: 'No one knows what it is. Not even the pilgrim who brought it would say.',
      dropNote: 'Vzácný dar tajemného poutníka.'
    },
    {
      id: 'poppy', name: 'Mák', name_en: 'Poppy', name_lat: 'Papaver', rarity: 'uncommon', source: 'existing',
      color: '#e91e63', icon: '🌸', thermal: -3, moisture: 1,
      lore: 'Chladivý a uspávající. Hildegarda znala jeho moc.',
      lore_en: 'Cooling and soporific. Hildegard knew its power.'
    },
    {
      id: 'herb_blue', name: 'Levandule', name_en: 'Lavender', name_lat: 'Lavandula', rarity: 'common', source: 'existing',
      color: '#b39ddb', icon: '💜', thermal: 2, moisture: -1,
      lore: 'Prohřívací vůně proti neklidu a hmyzu.',
      lore_en: 'A warming scent against restlessness and insects.'
    },
    {
      id: 'resin_pine', name: 'Borová pryskyřice', name_en: 'Pine Resin', name_lat: 'Resina Pini', rarity: 'common', source: 'foraging',
      color: '#cc9944', icon: '🌲', thermal: 2, moisture: -2,
      lore: 'Hořlavá, lepkavá míza. Základ terpentýnu a laků.',
      lore_en: 'Sticky, flammable sap. The base of turpentine and varnishes.'
    },
    {
      id: 'berries', name: 'Bobule', name_en: 'Berries', name_lat: 'Baccae', rarity: 'common', source: 'foraging',
      color: '#4a6fa5', icon: '🫐', thermal: -1, moisture: 2,
      lore: 'Chladivé, šťavnaté lesní plody.',
      lore_en: 'Cool, juicy forest fruit.'
    },
    {
      id: 'ink_gallic', name: 'Železitoduběnkový inkoust', name_en: 'Iron Gall Ink', name_lat: 'Atramentum Gallicum', rarity: 'uncommon', source: 'crafted',
      color: '#1a1a1a', icon: '✒️', thermal: 0, moisture: -1,
      lore: 'Hotový inkoust — sám o sobě i vstupní surovina pro dokonalejší verze.',
      lore_en: 'A finished ink — usable on its own, or as a starting material for finer versions.'
    },
    {
      id: 'lead', name: 'Olovo', name_en: 'Lead', name_lat: 'Plumbum', rarity: 'uncommon', source: 'existing',
      color: '#4a4a4a', icon: '⚫', thermal: -3, moisture: -3,
      lore: 'Těžký, chladný a suchý kov — Saturnův kov podle staré nauky.',
      lore_en: "A heavy, cold and dry metal — Saturn's metal, according to old doctrine.",
      dropNote: 'Vzácný byproduct z Dolů.'
    },
    {
      id: 'cerusa', name: 'Olověná běloba', name_en: 'Lead White', name_lat: 'Cerusa', rarity: 'uncommon', source: 'crafted',
      color: '#f5f5f0', icon: '⚪', thermal: -1, moisture: -2,
      lore: 'Olovo zpracované octem na nejzásadnější bělobu středověku.',
      lore_en: 'Lead worked with vinegar into the most essential white of the Middle Ages.'
    },
    {
      id: 'copper', name: 'Měď', name_en: 'Copper', name_lat: 'Cuprum', rarity: 'uncommon', source: 'existing',
      color: '#b87333', icon: '🟠', thermal: 1, moisture: -2,
      lore: 'Červenozlatý kov. Základ měděnky, azuritu i sklářského barvení.',
      lore_en: 'A red-gold metal. The base of verdigris, azurite, and glass colouring.',
      dropNote: 'Vzácný byproduct z Dolů.'
    },
    {
      id: 'tin', name: 'Cín', name_en: 'Tin', name_lat: 'Stannum', rarity: 'uncommon', source: 'existing',
      color: '#c0c0c0', icon: '⚪', thermal: -1, moisture: -2,
      lore: 'Čechy jsou cínová velmoc — Krušné hory dodávají cín celé Evropě.',
      lore_en: 'Bohemia is a tin power — the Ore Mountains supply tin to all of Europe.',
      dropNote: 'Vzácný byproduct z Dolů.'
    },
    {
      id: 'ash', name: 'Popel', name_en: 'Ash', name_lat: 'Cinis', rarity: 'common', source: 'crafted',
      color: '#999999', icon: '🌫️', thermal: 3, moisture: -4,
      lore: 'Krbový zbytek. Horký a suchý — základ louhu.',
      lore_en: 'Hearth residue. Hot and dry — the base of lye.'
    },
    {
      id: 'ash_water', name: 'Louh', name_en: 'Lye Water', name_lat: 'Aqua Cinerum', rarity: 'uncommon', source: 'crafted',
      color: '#d4c9a8', icon: '💧', thermal: 2, moisture: -2,
      lore: 'Voda protažená popelem. Zásaditý louh.',
      lore_en: 'Water passed through ash. An alkaline lye.'
    },
    {
      id: 'tartarus', name: 'Vinný kámen', name_en: 'Tartar', name_lat: 'Tartarus', rarity: 'uncommon', source: 'crafted',
      color: '#7a5c3d', icon: '🍇', thermal: 1, moisture: -2,
      lore: 'Krystalická usazenina ze stěn sudu se zralým vínem.',
      lore_en: 'Crystalline deposit from the walls of a barrel of aged wine.'
    },
    {
      id: 'bone', name: 'Kost', name_en: 'Bone', name_lat: 'Os', rarity: 'common', source: 'existing',
      color: '#e8e0d0', icon: '☠️', thermal: 0, moisture: -3,
      lore: 'Chladná a suchá — odpad z kuchyně, surovina pro Athanor.',
      lore_en: 'Cold and dry — kitchen waste, raw material for the Athanor.'
    },
    {
      id: 'cornu_cervi', name: 'Jelení paroh', name_en: 'Deer Antler', name_lat: 'Cornu Cervi', rarity: 'uncommon', source: 'foraging',
      color: '#d4c4a0', icon: '🦌', thermal: 0, moisture: -3,
      lore: 'Sesbíraný shozený paroh z lesa. Chladný a suchý jako kost.',
      lore_en: 'A shed antler gathered from the forest floor. Cold and dry as bone.',
      dropNote: 'Vzácný nález při sběru v lese.'
    },
    {
      id: 'egg', name: 'Vejce', name_en: 'Hen Egg', name_lat: 'Ovum', rarity: 'common', source: 'existing',
      color: '#f5e6c8', icon: '🥚', thermal: 1, moisture: 2,
      lore: 'Prohřívací a vlhký — živí i pojí pigment.',
      lore_en: 'Warming and moist — nourishes and binds pigment alike.'
    },
    {
      id: 'wood', name: 'Dřevo', name_en: 'Wood', name_lat: 'Lignum', rarity: 'common', source: 'foraging',
      color: '#8b5a2b', icon: '🪵', thermal: 2, moisture: -2,
      lore: 'Klestí a větve. Hořlavé, suché.',
      lore_en: 'Brushwood and branches. Flammable, dry.'
    },
    {
      id: 'aqua_ardens', name: 'Ohnivá voda', name_en: 'Aqua Ardens', name_lat: 'Aqua Ardens', rarity: 'uncommon', source: 'crafted',
      color: '#f0d060', icon: '🔥', thermal: 4, moisture: -2,
      lore: 'První destilát vína. Hořlavý, prudce prohřívací.',
      lore_en: 'The first distillate of wine. Flammable, sharply warming.'
    },
    {
      id: 'sal_petrae', name: 'Ledek', name_en: 'Saltpetre', name_lat: 'Sal Petrae', rarity: 'rare', source: 'existing',
      color: '#e8e8e0', icon: '⚪', thermal: 3, moisture: -3,
      lore: 'Hořlavý výkvět ze stěn hlubších štol.',
      lore_en: 'A flammable efflorescence from the walls of deep mine shafts.',
      dropNote: 'Vzácný byproduct z Dolů.'
    },
    {
      id: 'aqua_fortis', name: 'Kyselina dusičná', name_en: 'Aqua Fortis', name_lat: 'Aqua Fortis', rarity: 'rare', source: 'crafted',
      color: '#d4e157', icon: '🧪', thermal: 5, moisture: -3,
      lore: 'Prudce žíravá lučavka. Pseudo-Geberova Summa Perfectionis.',
      lore_en: "A fiercely corrosive acid water. Pseudo-Geber's Summa Perfectionis."
    },
    {
      id: 'sal_ammoniac', name: 'Salmiak', name_en: 'Sal Ammoniac', name_lat: 'Sal Ammoniacum', rarity: 'rare', source: 'trade',
      color: '#e0e0e0', icon: '⚪', thermal: 2, moisture: -2,
      lore: 'Dovážen draze z Egypta přes Benátky. Hlavní tavidlo metalurgie.',
      lore_en: 'Imported at great cost from Egypt via Venice. The chief flux of metallurgy.'
    },
    {
      id: 'arsenicum', name: 'Arsen', name_en: 'Arsenic', name_lat: 'Arsenicum', rarity: 'rare', source: 'existing',
      color: '#d4d420', icon: '🟡', thermal: 4, moisture: -4,
      lore: 'Prudce jedovatý. Albertus Magnus: jed i bělidlo mědi.',
      lore_en: 'Sharply poisonous. Albertus Magnus: both a poison and a copper whitener.',
      dropNote: 'Vzácný byproduct z Dolů.'
    },
    {
      id: 'mercury', name: 'Rtuť', name_en: 'Mercury', name_lat: 'Argentum Vivum', rarity: 'rare', source: 'trade',
      color: '#b8b8c8', icon: '🔘', thermal: -2, moisture: 3,
      lore: 'Živé stříbro. Tekutý kov, co se nikdy nezastaví.',
      lore_en: 'Quicksilver. A liquid metal that never stops moving.',
      dropNote: 'Vzácné zboží — přinese jej občas potulný poutník nebo zprávy od Giacoma.',
      dropNote_en: 'Rare goods — occasionally brought by a wandering pilgrim or news from Giacomo.'
    },
    {
      id: 'spiritus_vini', name: 'Vinný líh', name_en: 'Spirit of Wine', name_lat: 'Spiritus Vini Rectificatus', rarity: 'uncommon', source: 'crafted',
      color: '#f5f0d0', icon: '🔥', thermal: 5, moisture: -3,
      lore: 'Čistý, vysoce hořlavý alkohol z opakované destilace.',
      lore_en: 'Pure, highly flammable alcohol from repeated distillation.'
    },
    {
      id: 'acetum_destillatum', name: 'Destilovaný ocet', name_en: 'Distilled Vinegar', name_lat: 'Spiritus Aceti', rarity: 'uncommon', source: 'crafted',
      color: '#e8d8b0', icon: '🍶', thermal: -2, moisture: -2,
      lore: 'Koncentrovaná kyselina octová, zbavená vinných nečistot.',
      lore_en: 'Concentrated acetic acid, stripped of wine impurities.'
    },
    {
      id: 'mandrake', name: 'Mandragora', name_en: 'Mandrake', name_lat: 'Mandragora', rarity: 'rare', source: 'existing',
      color: '#6b4c3a', icon: '🌿', thermal: -4, moisture: -1,
      lore: 'Nebezpečně chladivý kořen. Uspává — nebo hůř.',
      lore_en: 'A dangerously cooling root. Induces sleep — or worse.'
    },
    {
      id: 'gentian', name: 'Hořec', name_en: 'Gentian', name_lat: 'Gentiana', rarity: 'uncommon', source: 'foraging',
      color: '#4a90d9', icon: '🌼', thermal: 2, moisture: -2,
      lore: 'Hořká horská bylina, základ theriaku od antiky.',
      lore_en: 'A bitter mountain herb, the base of theriac since antiquity.'
    },
    {
      id: 'wormwood', name: 'Pelyněk', name_en: 'Wormwood', name_lat: 'Absinthium', rarity: 'common', source: 'existing',
      color: '#8a9a5b', icon: '🌿', thermal: -3, moisture: -3,
      lore: 'Nejsilnější chladivá a suchá bylina proti horečce.',
      lore_en: 'The most potent cooling, drying herb against fever.'
    },
    {
      id: 'charcoal', name: 'Uhel', name_en: 'Charcoal', name_lat: 'Carbo', rarity: 'common', source: 'existing',
      color: '#2a2a2a', icon: '⚫', thermal: 3, moisture: -4,
      lore: 'Žíhané dřevo. Horké a suché skrz naskrz.',
      lore_en: 'Charred wood. Hot and dry through and through.'
    },
    {
      id: 'stick', name: 'Větev', name_en: 'Branch', name_lat: 'Ramus', rarity: 'common', source: 'foraging',
      color: '#8b6b47', icon: '🪵', thermal: 1, moisture: -2,
      lore: 'Suchá větévka na podpal nebo žíhání.',
      lore_en: 'A dry twig for kindling or calcining.'
    },

    // ── Doplnění #2 — vstupy pro Media/Ultima Materia a Scrinium recepty
    {
      id: 'minium', name: 'Suřík', name_en: 'Red Lead', name_lat: 'Minium', rarity: 'uncommon', source: 'crafted',
      color: '#c0392b', icon: '🔴', thermal: 3, moisture: -4,
      lore: 'Žíhaná olověná běloba. Zářivě červeno-oranžová.',
      lore_en: 'Calcined lead white. A brilliant red-orange.'
    },
    {
      id: 'ochra_flava', name: 'Zušlechtěný okr', name_en: 'Refined Ochre', name_lat: 'Ochra Flava Preparata', rarity: 'uncommon', source: 'crafted',
      color: '#d4a017', icon: '🟡', thermal: 0, moisture: -1,
      lore: 'Surový okr donekonečna plavený ve vodě.',
      lore_en: 'Raw ochre levigated endlessly in water.'
    },
    {
      id: 'palette_membrana', name: 'Tělová barva', name_en: 'Flesh Tone', name_lat: 'Palette Membrana', rarity: 'rare', source: 'crafted',
      color: '#d9a679', icon: '🎨', thermal: 0, moisture: -1,
      lore: 'Běloba, suřík a okr utřené dohromady.',
      lore_en: 'White, red lead, and ochre ground together.'
    },
    {
      id: 'sinopia_tosta', name: 'Žíhaná sinopia', name_en: 'Roasted Sinopia', name_lat: 'Sinopia Tosta', rarity: 'uncommon', source: 'crafted',
      color: '#a0522d', icon: '🟤', thermal: 3, moisture: -4,
      lore: 'Žlutý okr žíhaný, dokud nezčervená.',
      lore_en: 'Yellow ochre roasted until it turns red.'
    },
    {
      id: 'verdigris_purum', name: 'Krystalická měděnka', name_en: 'Purified Verdigris', name_lat: 'Viride Aeris Purificatum', rarity: 'rare', source: 'crafted',
      color: '#1a9e6b', icon: '🟢', thermal: 1, moisture: 0,
      lore: 'Měděnka rozpuštěná v octě a nechaná krystalizovat.',
      lore_en: 'Verdigris dissolved in vinegar and left to crystallise.'
    },
    {
      id: 'calx_cupri', name: 'Žíhaná měď', name_en: 'Calcined Copper', name_lat: 'Calx Cupri', rarity: 'uncommon', source: 'crafted',
      color: '#3a3a3a', icon: '⚫', thermal: 3, moisture: -3,
      lore: 'Černý oxid měďnatý ze žíhání.',
      lore_en: 'Black copper oxide from calcination.'
    },
    {
      id: 'sal_alkali', name: 'Louhová sůl', name_en: 'Alkali Salt', name_lat: 'Sal Alkali', rarity: 'uncommon', source: 'crafted',
      color: '#e8e4d8', icon: '⚪', thermal: 3, moisture: -4,
      lore: 'Odpařený a žíhaný popelový louh.',
      lore_en: 'Ash lye, evaporated and calcined.'
    },
    {
      id: 'cinere_stanni', name: 'Cínový popel', name_en: 'Tin Ash', name_lat: 'Cinere Stanni', rarity: 'uncommon', source: 'crafted',
      color: '#d4d4d4', icon: '⚪', thermal: 2, moisture: -4,
      lore: 'Oxid cíničitý ze žíhaného cínu.',
      lore_en: 'Tin oxide from calcined tin.'
    },
    {
      id: 'lithargyrum', name: 'Klejt', name_en: 'Litharge', name_lat: 'Lithargyrum', rarity: 'uncommon', source: 'crafted',
      color: '#c9a94a', icon: '🟡', thermal: 2, moisture: -3,
      lore: 'Žlutý oxid olovnatý z taveného olova.',
      lore_en: 'Yellow lead oxide from molten lead.'
    },
    {
      id: 'comfrey', name: 'Kostival', name_en: 'Comfrey', name_lat: 'Symphytum', rarity: 'common', source: 'existing',
      color: '#6b8f5a', icon: '🌿', thermal: -1, moisture: 1,
      lore: 'Základ středověké ortopedie. Slizovitý, chladivý.',
      lore_en: 'The base of medieval orthopaedics. Mucilaginous, cooling.'
    },
    {
      id: 'yarrow', name: 'Řebříček', name_en: 'Yarrow', name_lat: 'Millefolium', rarity: 'common', source: 'existing',
      color: '#e8d5a8', icon: '🌿', thermal: 1, moisture: -2,
      lore: 'Achillova bylina. Svíravá, hojí rány.',
      lore_en: "Achilles' herb. Astringent, heals wounds."
    },
    {
      id: 'juniper', name: 'Jalovec', name_en: 'Juniper', name_lat: 'Juniperus', rarity: 'common', source: 'existing',
      color: '#4a6b4a', icon: '🌲', thermal: 3, moisture: -2,
      lore: 'Silně prohřívací silice, oblíbená na revma.',
      lore_en: 'A strongly warming essence, favoured for rheumatism.'
    },
    {
      id: 'hyssop', name: 'Yzop', name_en: 'Hyssop', name_lat: 'Hyssopus', rarity: 'common', source: 'existing',
      color: '#7a8b6a', icon: '🌿', thermal: 2, moisture: -1,
      lore: 'Benediktinská bylina proti kašli.',
      lore_en: 'A Benedictine herb against coughing.'
    },
    {
      id: 'theriacum_simplex', name: 'Základní theriak', name_en: 'Simple Theriac', name_lat: 'Theriacum Simplex', rarity: 'rare', source: 'crafted',
      color: '#8b6914', icon: '🍯', thermal: 1, moisture: 1,
      lore: 'Pelyněk, hořec a med svařené s vínem.',
      lore_en: 'Wormwood, gentian, and honey boiled down with wine.'
    },
    {
      id: 'lazulium_mellitum', name: 'Medový ultramarín', name_en: 'Honeyed Ultramarine', name_lat: 'Lazulium Mellitum', rarity: 'rare', source: 'crafted',
      color: '#2a52be', icon: '💙', thermal: 0, moisture: 1,
      lore: 'Lapis lazuli hnětený v medu a gumě.',
      lore_en: 'Lapis lazuli kneaded in honey and gum.'
    },
    {
      id: 'fennel', name: 'Fenykl', name_en: 'Fennel', name_lat: 'Foeniculum', rarity: 'common', source: 'existing',
      color: '#c9d97a', icon: '🌿', thermal: 2, moisture: -1,
      lore: 'Dobrý na trávení, Hildegarda jej doporučovala.',
      lore_en: 'Good for digestion — Hildegard recommended it.'
    },
    {
      id: 'malachite', name: 'Malachit', name_en: 'Malachite', name_lat: 'Malachitum', rarity: 'uncommon', source: 'existing',
      color: '#2a8a5a', icon: '🟢', thermal: -1, moisture: -3,
      lore: 'Zelená měděná ruda z dolu.',
      lore_en: 'Green copper ore from the mine.',
      dropNote: 'Vzácný byproduct z Dolů.'
    },
    {
      id: 'spodium', name: 'Kostní popel', name_en: 'Bone Ash', name_lat: 'Spodium', rarity: 'uncommon', source: 'crafted',
      color: '#e8e0d0', icon: '⚪', thermal: 2, moisture: -5,
      lore: 'Extrémně suchý bílý prášek ze žíhané kosti.',
      lore_en: 'An extremely dry white powder from calcined bone.'
    },
    {
      id: 'auripigmentum', name: 'Auripigment', name_en: 'Orpiment', name_lat: 'Auripigmentum', rarity: 'rare', source: 'crafted',
      color: '#f0d020', icon: '🟡', thermal: 4, moisture: -4,
      lore: 'Sulfid arsenitý. Zářivě žlutý — a smrtelně jedovatý.',
      lore_en: 'Arsenic sulfide. Brilliantly yellow — and deadly poisonous.'
    }
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
      name: 'Trituratio', name_cs: 'Drcení',
      icon: '🔨',
      thermal_mod: 0, moisture_mod: -1,
      duration_ms: 8000,
      unlock: null,
      desc: 'Drcení v třecí misce. Rozmělní pevné složky, vysušuje.',
      desc_en: 'Grinding in the mortar. Breaks down solid components, dries them out.'
    },
    {
      id: 'coctio',
      name: 'Coctio', name_cs: 'Vaření',
      icon: '🔥',
      thermal_mod: 3, moisture_mod: -2,
      duration_ms: 15000,
      unlock: null,
      desc: 'Vaření nad Athanorem. Přidává teplo, odpařuje vlhkost.',
      desc_en: 'Boiling over the Athanor. Adds heat, evaporates moisture.'
    },
    {
      id: 'maceratio',
      name: 'Maceratio', name_cs: 'Louhování',
      icon: '💧',
      thermal_mod: -2, moisture_mod: 3,
      duration_ms: 20000,
      unlock: null,
      desc: 'Pomalé louhování v chladné vodě. Jemné, vlhčí.',
      desc_en: 'Slow steeping in cold water. Gentle, moistening.'
    },
    {
      id: 'destillatio',
      name: 'Destillatio', name_cs: 'Destilace',
      icon: '🌡️',
      thermal_mod: 1, moisture_mod: 1,
      duration_ms: 25000,
      unlock: 'tech_destillatio',
      desc: 'Destilace přes alembik. Vyžaduje pokročilé vybavení.',
      desc_en: 'Distillation through the alembic. Requires advanced equipment.'
    },
    {
      id: 'calcinatio',
      name: 'Calcinatio', name_cs: 'Žíhání',
      icon: '⚡',
      thermal_mod: 5, moisture_mod: -4,
      duration_ms: 30000,
      unlock: 'tech_calcinatio',
      desc: 'Žíhání v silném ohni. Extrémní teplo, ničí vlhkost.',
      desc_en: 'Calcining in a fierce fire. Extreme heat, destroys moisture.'
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
      name: 'Sazový inkoust', name_en: 'Carbon Ink',
      name_lat: 'Atramentum Carboneum',
      icon: '🖤',
      effect: null,
      lore: 'Základní černý inkoust ze sazí. Levný, rychlý, vydrží staletí.',
      lore_en: 'The basic black ink made from soot. Cheap, quick, lasts for centuries.'
    },
    'cinnabar+gum_arabic+water:coctio': {
      result: { id: 'ink_red', qty: 1 },
      name: 'Červený inkoust', name_en: 'Red Ink',
      name_lat: 'Atramentum Rubrum',
      icon: '🔴',
      effect: null,
      lore: 'Rumělkový inkoust pro rubriky a iniciály. Kreslí jím první písmeno kapitoly.',
      lore_en: 'Cinnabar ink for rubrics and initials. Used to draw the first letter of a chapter.'
    },
    'egg_tempera+ochre:trituratio': {
      result: { id: 'pigment_yellow', qty: 2 },
      name: 'Žlutý pigment', name_en: 'Yellow Pigment',
      name_lat: 'Pigmentum Ochreum',
      icon: '🟡',
      effect: null,
      lore: 'Okrový pigment v tempera pojivu. Pro iluminace zlatohnědých ploch.',
      lore_en: 'Ochre pigment in a tempera binder. For illuminating golden-brown surfaces.'
    },
    'egg_tempera+verdigris:trituratio': {
      result: { id: 'pigment_green', qty: 1 },
      name: 'Zelený pigment', name_en: 'Green Pigment',
      name_lat: 'Pigmentum Viride',
      icon: '🟢',
      effect: null,
      lore: 'Měděnka v tempera. Krásná zelená, ale časem koroduje pergamen.',
      lore_en: 'Verdigris in tempera. A beautiful green, but it corrodes vellum over time.'
    },
    'egg_tempera+lapis_lazuli:trituratio': {
      result: { id: 'pigment_blue', qty: 1 },
      name: 'Ultramarín', name_en: 'Ultramarine',
      name_lat: 'Pigmentum Lazuli',
      icon: '💙',
      effect: {
        type: 'vigor_restore',
        value: 5,
        duration_ms: 0,
        label: 'Kontemplativní práce s pigmentem +5 vigor'
      },
      lore: 'Pigment z lapis lazuli. Dražší než zlato — vyhrazen pro roucho Panny Marie.',
      lore_en: "Pigment from lapis lazuli. More precious than gold — reserved for the Virgin's robe."
    },
    'gall_nut+gum_arabic+water:maceratio': {
      result: { id: 'ink_gallic', qty: 2 },
      name: 'Duběnkový inkoust', name_en: 'Oak Gall Ink',
      name_lat: 'Atramentum Gallicum',
      icon: '🌰',
      effect: null,
      lore: 'Ferrogalický inkoust. Časem prožírá pergamen — ale trvá staletí.',
      lore_en: 'Iron gall ink. Eats through vellum over time — but lasts for centuries.'
    },

    // ── Tier 2: Lektvary a masti ──
    'chamomile+honey+water:coctio': {
      result: { id: 'potion_vigor_minor', qty: 1 },
      name: 'Heřmánkový odvar', name_en: 'Chamomile Draught',
      name_lat: 'Infusum Chamomillae',
      icon: '🌼',
      effect: {
        type: 'vigor_restore',
        value: 20,
        duration_ms: 0,
        label: 'Vigor +20'
      },
      lore: 'Teplý odvar uklidní žaludek a obnoví síly. Hildegarda by schválila.',
      lore_en: 'A warm decoction that calms the stomach and restores strength. Hildegard would approve.'
    },
    'honey+st_johns_wort+water:coctio': {
      result: { id: 'potion_craft_boost', qty: 1 },
      name: 'Třezalkový lektvar', name_en: "St. John's Tincture",
      name_lat: 'Potio Hyperici',
      icon: '🌻',
      effect: {
        type: 'craft_boost',
        value: 1.5,
        duration_ms: 3600000,
        label: 'Crafting ×1.5 po dobu 1 hodiny'
      },
      lore: 'Bylina svatého Jana žene pryč únavu i melancholii.',
      lore_en: "St. John's wort drives away fatigue as well as melancholy."
    },
    'beeswax+chamomile+honey:trituratio': {
      result: { id: 'potion_hunger_remedy', qty: 1 },
      name: 'Hojivá mast', name_en: 'Healing Salve',
      name_lat: 'Unguentum Sanativum',
      icon: '🕯️',
      effect: {
        type: 'hunger_extend',
        value: 14400000,
        duration_ms: 0,
        label: 'Hlad se zpomalí o 4 hodiny'
      },
      lore: 'Vosk s heřmánkem potírá rozmrzlé prsty a unavené zápěstí.',
      lore_en: 'Wax with chamomile soothes chapped fingers and tired wrists.'
    },

    // ── Valetudo — Apothecarius (Contraria contrariis curantur) ──
    // Alternativní cesta ke stejným cure itemům jako RecipesDB (odvar_z_dubenek
    // atd.) — přes Athanor experimentování místo garantovanýho receptu. Gate
    // pořád tech_infirmarium_apothecarius/tech_chirurgus (kontrolovaný jinde,
    // combo samo o sobě negatuje tech — jen dělá item dostupným ke zkoušení).
    'gall_nut+water:coctio': {
      result: { id: 'odvar_z_dubenek', qty: 1 },
      name: 'Odvar z duběnek', name_en: 'Oak Gall Decoction',
      name_lat: 'Decoctum Gallarum',
      icon: '🫘',
      effect: null,
      unlock: 'tech_infirmarium_apothecarius',
      lore: 'Svíravej odvar — Krev (horko+vlhko) se léčí chladem a suchem. Duběnka sama je už chladná a suchá.',
      lore_en: 'An astringent decoction — Blood (hot+moist) is treated with cold and dry. The oak gall itself is already cold and dry.'
    },
    'linseed_oil:trituratio': {
      result: { id: 'mast_ze_lneneho_oleje', qty: 1 },
      name: 'Mast ze lněného oleje', name_en: 'Linseed Oil Salve',
      name_lat: 'Unguentum Lini',
      icon: '🧴',
      effect: null,
      unlock: 'tech_infirmarium_apothecarius',
      lore: 'Černá žluč (chlad+sucho) se léčí teplem a vlhkem — lněný olej je obojí, drcení v třecí misce ho promění v mast.',
      lore_en: 'Black Bile (cold+dry) is treated with heat and moisture — linseed oil is both; grinding in the mortar turns it into a salve.'
    },
    'vrbova_kura+water:coctio': {
      result: { id: 'odvar_z_vrby', qty: 1 },
      name: 'Odvar z vrbové kůry', name_en: 'Willow Bark Decoction',
      name_lat: 'Decoctum Salicis',
      icon: '🍵',
      effect: null,
      unlock: 'tech_infirmarium_apothecarius',
      lore: 'Žlutá žluč (horko+sucho) se léčí chladem a vlhkem — přesně kvality vrbový kůry.',
      lore_en: 'Yellow Bile (hot+dry) is treated with cold and moist — precisely the qualities of willow bark.'
    },
    'honey+rosemary+wine:coctio': {
      result: { id: 'elixir_purgationis', qty: 1 },
      name: 'Očistný elixír', name_en: 'Purging Elixir',
      name_lat: 'Elixir Purgationis',
      icon: '🍯',
      effect: null,
      unlock: 'tech_infirmarium_apothecarius',
      lore: 'Teplé víno s medem a rozmarýnem — proti studené a suché černé žluči. Vyhání blud, ne jen únavu.',
      lore_en: 'Warm wine with honey and rosemary — against cold, dry black bile. Drives out delusion, not just fatigue.'
    },

    // ── Haeresis Occulta MRD — kacířské lektvary ze substantia_ignota ──
    // Gate = vlastnictví vzácný suroviny (B3 poutník), ne TechTree (schválená
    // výjimka, viz mrd-athanor-haeresis-occulta.md §7). Efekt heresy_brew
    // = riziko Inkvizice + šance na haeresis_occulta, ne mechanická odměna.
    'substantia_ignota+wine:maceratio': {
      result: { id: 'haereticum_stellarum', qty: 1 },
      name: 'Nápoj cizích hvězd', name_en: 'Draught of Foreign Stars',
      name_lat: 'Potio Stellarum Alienarum',
      icon: '✨',
      effect: { type: 'heresy_brew', conditionChance: 0.30, heatGain: 6 },
      lore: 'Bratr usnul nad pohárem a slyšel našeptávat hvězdy, které žádný žebřík k nebi nezná.',
      lore_en: 'The brother fell asleep over his cup and heard the stars whisper — stars no ladder to heaven has ever reached.'
    },
    'poppy+substantia_ignota:coctio': {
      result: { id: 'haereticum_circuli', qty: 1 },
      name: 'Odvar kola životů', name_en: 'Decoction of the Wheel of Lives',
      name_lat: 'Decoctum Rotae Vitarum',
      icon: '🌀',
      effect: { type: 'heresy_brew', conditionChance: 0.55, heatGain: 10 },
      lore: 'Bratr usnul s pohárem u rtů. Probudil se s podivnou jistotou, že tohle tělo už měl jednou dřív.',
      lore_en: 'The brother fell asleep, cup at his lips. He woke with a strange certainty that he had worn this body once before.'
    },
    'honey+substantia_ignota:maceratio': {
      result: { id: 'haereticum_fortunae', qty: 1 },
      name: 'Elixír cizí přízně', name_en: 'Elixir of Foreign Fortune',
      name_lat: 'Elixir Fortunae Alienae',
      icon: '🍀',
      effect: { type: 'heresy_brew', conditionChance: 0.35, heatGain: 8 },
      lore: 'Sladký doušek slibuje štěstí, které si nikdo nezasloužil žádnou prací.',
      lore_en: 'A sweet sip promises luck that no one earned by any labour.'
    },
    'herb_blue+substantia_ignota:maceratio': {
      result: { id: 'haereticum_amoris', qty: 1 },
      name: 'Nápoj cizí touhy', name_en: 'Draught of Foreign Desire',
      name_lat: 'Potio Desiderii Alieni',
      icon: '🌸',
      effect: { type: 'heresy_brew', conditionChance: 0.40, heatGain: 8 },
      lore: 'Levandulová vůně probouzí touhu, která nepatří klášterní cele.',
      lore_en: 'The scent of lavender awakens a longing that has no place in a monastic cell.'
    },

    // ── Discoverable: skryté kombinace ──
    // pyl-prepracovani-mrd (18.8.2026): propolis chybělo v ingredients i zde,
    // ačkoliv CellariumSystem cenu a decay pro propolis_tinktura má už od
    // MRD 5.5 — doplňuje rozjetou, nikdy nedokončenou mechaniku.
    'propolis+spiritus_vini:maceratio': {
      result: { id: 'propolis_tinktura', qty: 1 },
      name: 'Propolisová tinktura', name_en: 'Propolis Tincture',
      name_lat: 'Tinctura Propolis',
      icon: '🧪',
      effect: null,
      lore: 'Propolis louhovaný ve vinném lihu. Klášterní lék proti ranám a bolesti v krku.',
      lore_en: 'Propolis steeped in spirit of wine. A monastery remedy for wounds and sore throats.'
    },
    'bee_bread+honey:maceratio': {
      result: { id: 'potion_vigor_major', qty: 1 },
      name: 'Brtnické tonikum', name_en: "Beeman's Tonic",
      name_lat: 'Tonicum Apium',
      icon: '🍯',
      effect: {
        type: 'vigor_restore',
        value: 35,
        duration_ms: 0,
        label: 'Vigor +35'
      },
      unlock: 'tech_apium_medicina',
      lore: 'Egypťané tomu říkali prach dávající život. Galén jím léčil vyčerpání. Bratr lékárník neví proč to funguje — jen že funguje.',
      lore_en: 'The Egyptians called it the dust that gives life. Galen used it against exhaustion. The infirmarian does not know why it works — only that it does.'
    },
    'chamomile+honey:maceratio': {
      result: { id: 'potion_vigor_minor', qty: 1 },
      name: 'Heřmánkový sirup', name_en: 'Chamomile Syrup',
      name_lat: 'Syrupus Chamomillae',
      icon: '🌼',
      effect: {
        type: 'vigor_restore',
        value: 15,
        duration_ms: 0,
        label: 'Vigor +15'
      },
      lore: 'Studenou cestou. Méně účinný, ale šetrnější.',
      lore_en: 'The cold-steeped way. Less potent, but gentler.'
    },
    'beeswax+st_johns_wort:coctio': {
      result: { id: 'salve_hands', qty: 1 },
      name: 'Mast na prsty', name_en: 'Hand Salve',
      name_lat: 'Unguentum Digitorum',
      icon: '🌻',
      effect: {
        type: 'craft_boost',
        value: 1.25,
        duration_ms: 1800000,
        label: 'Crafting ×1.25 po dobu 30 minut'
      },
      lore: 'Třezalka v vosku. Léčí popraskaná písařská záda. Benediktinský klášterní recept.',
      lore_en: "St. John's wort in wax. Heals a scribe's cracked, aching hands. A Benedictine monastery recipe."
    },
    'chalk+egg_tempera+ochre:trituratio': {
      result: { id: 'pigment_yellow', qty: 3 },
      name: 'Světlý okr', name_en: 'Light Ochre',
      name_lat: 'Ochra Clara',
      icon: '🟡',
      effect: null,
      lore: 'Křída zředí okr. Více materiálu, světlejší tón.',
      lore_en: 'Chalk dilutes the ochre. More material, a lighter tone.'
    },
    'carbon_black+gall_nut+water:maceratio': {
      result: { id: 'ink_carbon', qty: 1 },
      name: 'Tmavý duběnkový', name_en: 'Dark Oak-Gall Black',
      name_lat: 'Atramentum Nigrum',
      icon: '🖤',
      effect: null,
      lore: 'Kombinace sazí a duběnky. Neobvyklá, ale trvanlivá.',
      lore_en: 'A combination of soot and oak gall. Unusual, but durable.'
    },
    'honey+lapis_lazuli:maceratio': {
      result: { id: 'pigment_blue', qty: 1 },
      name: 'Medový ultramarín', name_en: 'Honeyed Ultramarine',
      name_lat: 'Lazulium Mellitum',
      icon: '💙',
      effect: {
        type: 'vigor_restore',
        value: 10,
        duration_ms: 0,
        label: 'Vigor +10 — meditace nad modří'
      },
      lore: 'Med zjemní lapis lazuli. Starší benátský postup.',
      lore_en: 'Honey softens the lapis lazuli. An older Venetian method.'
    },

    // ── Nová vlna: Alchemix recepty adaptované pro Scriptorium ──

    // POT35 — Atramentum (Iron Gall Ink) — nejlepší skriptorský inkoust
    // RE-ENABLED (Fix 3B) — 'vitriol' doplněn (Doly byproduct).
    'gall_nut+vitriol+water:coctio': {
      result: { id: 'ink_gallic', qty: 2 },
      name: 'Ferrogalický inkoust', name_en: 'Iron Gall Ink',
      name_lat: 'Atramentum Ferrogallicum',
      icon: '⚫',
      effect: {
        type: 'craft_boost',
        value: 1.3,
        duration_ms: 7200000,
        label: 'Crafting ×1.3 po dobu 2 hodin — mistrovský inkoust'
      },
      lore: 'Duběnka + skalice + voda. Recept starý jako středověk sám. Prožírá pergamen, ale vydrží tisíc let.',
      lore_en: 'Oak gall + vitriol + water. A recipe as old as the Middle Ages itself. It eats through vellum, yet lasts a thousand years.'
    },

    // POT37 — Encaustum — císařský inkoust
    // RE-ENABLED (Fix 3B) — 'vitriol' doplněn (Doly byproduct).
    'gall_nut+vitriol+wine:coctio': {
      result: { id: 'ink_gallic', qty: 3 },
      name: 'Encaustum', name_en: 'Encaustum',
      name_lat: 'Encaustum Imperiale',
      icon: '⚫',
      effect: null,
      lore: 'Víno místo vody dává bohatší tón. Byzantský císařský postup — červenofialový záblesk v černé.',
      lore_en: 'Wine instead of water gives a richer tone. A Byzantine imperial method — a violet-red glint within the black.'
    },

    // POT05 — Oxymel — med+ocet, klášterní lék
    // RE-ENABLED (Fix 3B) — 'vinegar' doplněn (Athanor-craft z wine:maceratio).
    'honey+vinegar:coctio': {
      result: { id: 'potion_vigor_minor', qty: 2 },
      name: 'Oxymel', name_en: 'Oxymel',
      name_lat: 'Oxymel Simplex',
      icon: '🍯',
      effect: {
        type: 'vigor_restore',
        value: 25,
        duration_ms: 0,
        label: 'Vigor +25 — klášterní osvědčený lék'
      },
      lore: 'Med a ocet. Hippokratés, Galén, Hildegarda — všichni se shodli. Nejjednodušší a nejspolehlivější lék.',
      lore_en: 'Honey and vinegar. Hippocrates, Galen, Hildegard — all agreed. The simplest and most reliable remedy.'
    },

    // POT04 — Aqua Rosarum — růžová voda
    // RE-ENABLED (Fix 3B) — 'rose' doplněn (Scavenge loot).
    'rose+water:destillatio': {
      result: { id: 'potion_vigor_minor', qty: 1 },
      name: 'Aqua Rosarum', name_en: 'Aqua Rosarum',
      name_lat: 'Aqua Rosarum',
      icon: '🌹',
      effect: {
        type: 'vigor_restore',
        value: 15,
        duration_ms: 0,
        label: 'Vigor +15 — klid a mír duše'
      },
      lore: 'Destilovaná voda z okvětních lístků. Léčí unavené oči písaře. Arabský recept, přes Španělsko do Evropy.',
      lore_en: "Distilled rosewater. Soothes a scribe's tired eyes. An Arabic recipe, brought to Europe through Spain."
    },

    // POT10 — Potio Memorativa — paměťový lektvar
    // RE-ENABLED (Fix 3B) — 'rose' doplněn (Scavenge loot).
    'honey+rose+wine:maceratio': {
      result: { id: 'potion_craft_boost', qty: 1 },
      name: 'Potio Memorativa', name_en: 'Potio Memorativa',
      name_lat: 'Potio Memorativa',
      icon: '🧠',
      effect: {
        type: 'craft_boost',
        value: 1.2,
        duration_ms: 5400000,
        label: 'Research ×1.2 po dobu 1.5 hodiny — jasná mysl'
      },
      lore: 'Středověký recept na posílení paměti. Rozmarýn, šalvěj a med — klášterní lékaři ho předepisovali písařům.',
      lore_en: 'A medieval recipe to strengthen memory. Rosemary, sage, and honey — monastery physicians prescribed it to scribes.'
    },

    // POT38 — Vernix — lak na pergamen
    // RE-ENABLED (Fix 3B) — 'sandarak' doplněn (Giacomo import).
    'linseed_oil+sandarak:coctio': {
      result: { id: 'varnish', qty: 1 },
      name: 'Vernix', name_en: 'Vernix',
      name_lat: 'Vernix Clara',
      icon: '✨',
      effect: null,
      lore: 'Průzračný lak na lněném oleji. Chrání iluminace před vlhkostí a hmyzem. Základ každé dílny iluminátorů.',
      lore_en: "A clear varnish on linseed oil. Protects illuminations from damp and insects. The staple of every illuminator's workshop."
    },

    // POT23 — Oleum Hyperici — třezalkový olej
    'linseed_oil+st_johns_wort:maceratio': {
      result: { id: 'potion_hunger_remedy', qty: 1 },
      name: 'Oleum Hyperici', name_en: 'Oleum Hyperici',
      name_lat: 'Oleum Hyperici',
      icon: '🌻',
      effect: {
        type: 'hunger_extend',
        value: 10800000,
        duration_ms: 0,
        label: 'Hlad se zpomalí o 3 hodiny'
      },
      lore: 'Třezalka louhovaná v oleji. Červená jako krev. Léčí rány, spáleniny i pesimismus. Bez tepla — jen čas a slunce.',
      lore_en: "St. John's wort steeped in oil. Red as blood. Heals wounds, burns, and pessimism alike. No heat — just time and sunlight."
    },

    // POT88 — Gesso — podklad pro iluminace
    'chalk+egg_tempera:trituratio': {
      result: { id: 'pigment_yellow', qty: 2 },
      name: 'Gesso', name_en: 'Gesso',
      name_lat: 'Gessus Preparatus',
      icon: '⬜',
      effect: null,
      lore: 'Křída s vaječným bílkem. Bílý podklad pro zlaté iluminace. Bez gessa by zlato nesedělo na pergamenu.',
      lore_en: 'Chalk with egg white. A white ground for gilded illuminations. Without gesso, gold would not sit on vellum.'
    },

    // POT40 — Viride Aes — měděnka z octu
    // RE-ENABLED (Fix 3B) — 'vinegar' doplněn (Athanor-craft z wine:maceratio).
    'oak_bark+vinegar+water:maceratio': {
      result: { id: 'pigment_green', qty: 2 },
      name: 'Tannin Extract', name_en: 'Tannin Extract',
      name_lat: 'Extractum Tannini',
      icon: '🟤',
      effect: null,
      lore: 'Třísloviny z dubové kůry. Základ pro fixaci barviv i výrobu inkoustu bez kovů. Lesní alchymie.',
      lore_en: 'Tannins from oak bark. A base for fixing dyes and for making ink without metal. Forest alchemy.'
    },

    // Nový — síra + saze = deep black pigment (Calcinatio)
    // RE-ENABLED (Fix 3B) — 'sulfur' doplněn (B3/E1 event pool, item konečně existuje).
    'carbon_black+sulfur:calcinatio': {
      result: { id: 'ink_carbon', qty: 3 },
      name: 'Černidlo žíhané', name_en: 'Roasted Black',
      name_lat: 'Nigrum Calcinatum',
      icon: '🖤',
      effect: null,
      lore: 'Saze žíhané se sírou dají absolutní černou. Praxis alchymistů ze 14. století. Nelze spráci jinak.',
      lore_en: "Soot calcined with sulfur yields an absolute black. A fourteenth-century alchemist's practice. Cannot be made any other way."
    },

    // Fix 3B (athanor-integrity-audit.md §3) — vlastní zdroje pro vinegar/turpentine,
    // žádná vnější ekonomika netřeba, obojí self-contained z existujících surovin.
    'wine:maceratio': {
      result: { id: 'vinegar', qty: 2 },
      name: 'Ocet', name_en: 'Vinegar',
      name_lat: 'Acetum',
      icon: '🍶',
      effect: null,
      lore: 'Víno ponechané v teple zkysne samo — starší postup než destilace vína samotného.',
      lore_en: 'Wine left in warmth sours on its own — an older method than distilling wine at all.'
    },
    'resin_pine:destillatio': {
      result: { id: 'turpentine', qty: 2 },
      name: 'Terpentýn', name_en: 'Turpentine',
      name_lat: 'Terebinthina',
      icon: '🧴',
      effect: null,
      lore: 'Destilace borové pryskyřice přes alembik. Postup starý jako antika, dnes vyžaduje pokročilé vybavení.',
      lore_en: 'Distillation of pine resin through an alembic. A method as old as antiquity, but today requiring advanced equipment.'
    },

    // ── Wave 0 (media-materia-konsolidace.md §7) — Theophilus/Cennini strom,
    // zero nových surovin, jen nové combo výstupy z existujících ingrediencí.
    'gum_arabic+ochre+water:trituratio': {
      result: { id: 'ochra_flava', qty: 2 },
      name: 'Zušlechtěný okr', name_en: 'Refined Ochre',
      name_lat: 'Ochra Flava Preparata',
      icon: '🟡',
      effect: null,
      lore: 'Theophilus: surový okr se nekonečně dlouho drtí a plaví ve vodě, aby se oddělil písek a hrubé zrno.',
      lore_en: 'Theophilus: raw ochre is ground and levigated endlessly in water to separate out the sand and coarse grain.'
    },
    'alum+berries+gum_arabic:coctio': {
      result: { id: 'succus_viridis', qty: 1 },
      name: 'Šťávová zeleň', name_en: 'Sap Green',
      name_lat: 'Succus Viridis',
      icon: '🟢',
      effect: null,
      lore: 'Zralé bobule svařené s kamencem. Přírodní, vysoce transparentní lazurovací zeleň na listoví a krajiny.',
      lore_en: 'Ripe berries boiled with alum. A natural, highly transparent glazing green for foliage and landscapes.'
    },
    'alum+chalk+rose:coctio': {
      result: { id: 'lacca_rosarum', qty: 1 },
      name: 'Růžový lak', name_en: 'Rose Lake',
      name_lat: 'Lacca Rosarum',
      icon: '🌸',
      effect: null,
      lore: 'Okvětní lístky vyvařené s kamencem, který barvivo vysráží na jemnou křídu. Efekt rubínového skla v miniaturách.',
      lore_en: 'Rose petals boiled with alum, which precipitates the dye onto fine chalk. The effect of ruby glass in miniatures.'
    },
    'gum_arabic+honey+lapis_lazuli:maceratio': {
      result: { id: 'lazulium_mellitum', qty: 1 },
      name: 'Medový ultramarín', name_en: 'Honeyed Ultramarine',
      name_lat: 'Lazulium Mellitum',
      icon: '💙',
      effect: {
        type: 'vigor_restore',
        value: 10,
        duration_ms: 0,
        label: 'Kontemplativní práce s ultramarínem +10 vigor'
      },
      lore: 'Vrchol iluminátorského umění. Lapis lazuli hnětený v medu, aby se vytáhlo jen čisté modré zrno.',
      lore_en: "The pinnacle of the illuminator's art. Lapis lazuli kneaded in honey to draw out only the purest blue grain."
    },
    'beeswax+linseed_oil+resin_pine:coctio': {
      result: { id: 'mastix_liquida', qty: 2 },
      name: 'Tekutý tmel', name_en: 'Liquid Mastic',
      name_lat: 'Mastix Liquida',
      icon: '🫙',
      effect: null,
      lore: 'Univerzální voděodolné lepidlo. Knihaři jím zpevňují hřbety velkých biblí, hospodáři těsní sudy s pivem.',
      lore_en: 'A universal waterproof glue. Bookbinders reinforce the spines of great bibles with it; farmers seal beer barrels.'
    },
    'egg_tempera+vitriol:trituratio': {
      result: { id: 'lazur_teutonicum', qty: 2 },
      name: 'Německá modř', name_en: 'German Azure',
      name_lat: 'Lazur Teutonicum',
      icon: '💠',
      effect: null,
      lore: 'Dostupná klášterní modř, když v pokladnici není groš na afghánský lapis lazuli.',
      lore_en: 'An affordable monastery blue for when the treasury has no coin for Afghan lapis lazuli.'
    },
    'gum_arabic+ink_gallic:calcinatio': {
      result: { id: 'atramentum_siccum', qty: 1 },
      name: 'Inkoustový koláč', name_en: 'Dried Ink Cake',
      name_lat: 'Atramentum Siccum',
      icon: '⬛',
      effect: null,
      lore: 'Odpařený inkoust pro cestující mnichy a holubí poštu. Před použitím rozřeď kapkou vína nebo vody.',
      lore_en: 'Evaporated ink for travelling monks and pigeon post. Dilute with a drop of wine or water before use.'
    },
    'ochre:calcinatio': {
      result: { id: 'sinopia_tosta', qty: 2 },
      name: 'Žíhaná sinopia', name_en: 'Roasted Sinopia',
      name_lat: 'Sinopia Tosta',
      icon: '🟤',
      effect: null,
      lore: 'Žlutý okr žíhaný v Athanoru, dokud neztratí vázanou vodu a nezčervená. Podklad pro stínování tváří.',
      lore_en: 'Yellow ochre roasted in the Athanor until it loses its bound water and turns red. A ground for shading faces.'
    },

    // ── Vlna 1 (media-materia-konsolidace.md §7) — Doly trojice: olovo/měď/cín
    'lead+vinegar:maceratio': {
      result: { id: 'cerusa', qty: 2 },
      name: 'Olověná běloba', name_en: 'Lead White',
      name_lat: 'Cerusa',
      icon: '⚪',
      effect: null,
      lore: 'Olověné pláty nad octem v teplém hnoji — po týdnech se seškrábne zářivě bílý prášek. Nejzásadnější běloba středověku.',
      lore_en: 'Lead sheets over vinegar in warm dung — after weeks, a brilliant white powder is scraped off. The most essential white of the Middle Ages.'
    },
    'cerusa:calcinatio': {
      result: { id: 'minium', qty: 2 },
      name: 'Suřík', name_en: 'Red Lead',
      name_lat: 'Minium',
      icon: '🔴',
      effect: null,
      lore: 'Dlouhé pražení olověné běloby, dokud se barva nezmění z bílé přes žlutou až po zářivě červeno-oranžovou.',
      lore_en: 'Prolonged roasting of lead white, until the colour shifts from white through yellow to a brilliant red-orange.'
    },
    'lead:calcinatio': {
      result: { id: 'lithargyrum', qty: 2 },
      name: 'Klejt', name_en: 'Litharge',
      name_lat: 'Lithargyrum',
      icon: '🟡',
      effect: null,
      lore: 'Přímé tavení a oxidace olova na vzduchu. Sušidlo do lněného oleje, glazura do sklářské hutě.',
      lore_en: 'Direct melting and oxidation of lead in air. A drier for linseed oil, a glaze for the glassworks.'
    },
    'copper:calcinatio': {
      result: { id: 'calx_cupri', qty: 2 },
      name: 'Žíhaná měď', name_en: 'Calcined Copper',
      name_lat: 'Calx Cupri',
      icon: '⚫',
      effect: null,
      lore: 'Žíhaná měď na černý oxid. Barví sklo do syta zelena až modra ve sklářské huti.',
      lore_en: 'Calcined copper turned to a black oxide. Colours glass a deep green to blue in the glasshouse.'
    },
    'tin:calcinatio': {
      result: { id: 'cinere_stanni', qty: 2 },
      name: 'Cínový popel', name_en: 'Tin Ash',
      name_lat: 'Cinere Stanni',
      icon: '⚪',
      effect: null,
      lore: 'Žíhaný cín na bílý oxid. Základ neprůhledné glazury na klášterní keramiku a klíčová složka mozaikového zlata.',
      lore_en: 'Calcined tin turned to a white oxide. The base of an opaque glaze for monastery pottery and a key ingredient of mosaic gold.'
    },

    // ── Vlna 2 (media-materia-konsolidace.md §7) — zbytek Prima Materia + navazující Media
    'ash+water:maceratio': {
      result: { id: 'ash_water', qty: 2 },
      name: 'Louh z popela', name_en: 'Lye Water',
      name_lat: 'Aqua Cinerum',
      icon: '🫗',
      effect: null,
      lore: 'Voda protažená dřevěným popelem. Zásaditý louh — základ mýdla i sklářské huti.',
      lore_en: 'Water passed through wood ash. An alkaline lye — the base of soap and of glasshouse work.'
    },
    'wine:trituratio': {
      result: { id: 'tartarus', qty: 1 },
      name: 'Vinný kámen', name_en: 'Tartar',
      name_lat: 'Tartarus',
      icon: '🍇',
      effect: null,
      lore: 'Krystalická usazenina seškrábaná ze stěn sudu se zralým vínem.',
      lore_en: 'Crystalline deposit scraped from the walls of a barrel of aged wine.'
    },
    'ash_water:calcinatio': {
      result: { id: 'sal_alkali', qty: 1 },
      name: 'Louhová sůl', name_en: 'Alkali Salt',
      name_lat: 'Sal Alkali',
      icon: '⚪',
      effect: null,
      lore: 'Odpařený a žíhaný popelový louh. Nezbytný pro tavení lesního skla ve sklářské huti.',
      lore_en: 'Evaporated and calcined ash lye. Essential for smelting forest glass in the glasshouse.'
    },
    'tartarus+water:coctio': {
      result: { id: 'oleum_tartari', qty: 1 },
      name: 'Olej vinného kamene', name_en: 'Oil of Tartar',
      name_lat: 'Oleum Tartari per Deliquium',
      icon: '🫗',
      effect: null,
      lore: 'Silná zásada z louhování vinného kamene. Neutralizuje kyseliny, základ klášterních mýdel.',
      lore_en: 'A strong alkali from steeping tartar. Neutralises acids, the base of monastery soaps.'
    },
    'bone:calcinatio': {
      result: { id: 'spodium', qty: 2 },
      name: 'Kostní popel', name_en: 'Bone Ash',
      name_lat: 'Spodium',
      icon: '⚪',
      effect: null,
      lore: 'Extrémně suchý bílý prášek. Leští pergamen, staví žáruvzdorné kelímky pro kupelaci stříbra.',
      lore_en: 'An extremely dry white powder. Polishes vellum, builds heat-resistant crucibles for cupelling silver.'
    },
    'cornu_cervi:calcinatio': {
      result: { id: 'spodium_cervi', qty: 1 },
      name: 'Jelení běloba', name_en: 'Hartshorn White',
      name_lat: 'Spodium Cervi',
      icon: '⚪',
      effect: null,
      lore: 'Dokonale vyžíhaný jelení paroh utřený na nejjemnější prášek. Pro nejjemnější odlesky na rouchách svatých.',
      lore_en: 'A deer antler calcined to perfection, ground to the finest powder. For the subtlest highlights on the robes of saints.'
    },
    'egg:calcinatio': {
      result: { id: 'calx_alba', qty: 2 },
      name: 'Vápenná běloba', name_en: 'Shell White',
      name_lat: 'Calx Alba',
      icon: '⚪',
      effect: null,
      lore: 'Vaječné skořápky žíhané na čistý oxid vápenatý. Levnější náhrada za olověnou bělobu.',
      lore_en: 'Eggshells calcined to pure calcium oxide. A cheaper substitute for lead white.'
    },
    'wood:calcinatio': {
      result: { id: 'carbo_vitis', qty: 2 },
      name: 'Révová čerň', name_en: 'Vine Black',
      name_lat: 'Carbo Vitis',
      icon: '🖤',
      effect: null,
      lore: 'Dřevo žíhané bez přístupu vzduchu na sametově modročerný uhlík — jemnější než obyčejné saze z krbu.',
      lore_en: 'Wood charred without air access into a velvety blue-black char — finer than ordinary hearth soot.'
    },

    // ── Vlna 3 (media-materia-konsolidace.md §5) — prekurzory
    'wine:destillatio': {
      result: { id: 'aqua_ardens', qty: 2 },
      name: 'Ohnivá voda', name_en: 'Aqua Ardens',
      name_lat: 'Aqua Ardens',
      icon: '🔥',
      effect: null,
      lore: 'První průchod vína alembikem. Hořlavý líh nižší koncentrace, dezinfekce pro Infirmarium.',
      lore_en: 'The first pass of wine through the alembic. Low-strength flammable spirit, a disinfectant for the Infirmary.'
    },
    'aqua_ardens:destillatio': {
      result: { id: 'spiritus_vini', qty: 1 },
      name: 'Vinný líh', name_en: 'Spirit of Wine',
      name_lat: 'Spiritus Vini Rectificatus',
      icon: '🔥',
      effect: null,
      lore: 'Vícenásobná destilace přes alembik. Čistý, vysoce hořlavý alkohol pro nejsilnější tinktury.',
      lore_en: 'Repeated distillation through the alembic. A pure, highly flammable alcohol for the strongest tinctures.'
    },
    'vinegar:destillatio': {
      result: { id: 'acetum_destillatum', qty: 1 },
      name: 'Destilovaný ocet', name_en: 'Distilled Vinegar',
      name_lat: 'Spiritus Aceti',
      icon: '🍶',
      effect: null,
      lore: 'Vysoce koncentrovaná kyselina octová zbavená vinných nečistot.',
      lore_en: 'Highly concentrated acetic acid, stripped of wine impurities.'
    },
    'vitriol:destillatio': {
      result: { id: 'spiritus_vitrioli', qty: 1 },
      name: 'Olej vitriolu', name_en: 'Oil of Vitriol',
      name_lat: 'Spiritus Vitrioli',
      icon: '🧪',
      effect: null,
      lore: 'Silná destilace zelené skalice. Extrémně žíravá a dehydratující látka.',
      lore_en: 'A strong distillation of green vitriol. An extremely corrosive and dehydrating substance.'
    },

    // ── Vlna 3 — Ultima Materia (vrchol)
    'alum+sal_petrae+vitriol:destillatio': {
      result: { id: 'aqua_fortis', qty: 1 },
      name: 'Kyselina dusičná', name_en: 'Aqua Fortis',
      name_lat: 'Aqua Fortis',
      icon: '🧪',
      effect: null,
      lore: 'Vitriol, kamenec a ledek destilované v alembiku. Pseudo-Geberova Summa Perfectionis, ~1300 — rozpouští stříbro, leptá kovy.',
      lore_en: "Vitriol, alum, and saltpetre distilled in the alembic. Pseudo-Geber's Summa Perfectionis, c. 1300 — dissolves silver, etches metals."
    },
    'aqua_fortis+sal_ammoniac:destillatio': {
      result: { id: 'aqua_regia', qty: 1 },
      name: 'Lučavka královská', name_en: 'Aqua Regia',
      name_lat: 'Aqua Regia',
      icon: '🧪',
      effect: null,
      lore: 'Aqua Fortis se salmiakem. Jediná kapalina na světě, co rozpustí zlato.',
      lore_en: 'Aqua Fortis with sal ammoniac. The only liquid in the world that dissolves gold.'
    },
    'arsenicum+sulfur:destillatio': {
      result: { id: 'auripigmentum', qty: 1 },
      name: 'Auripigment', name_en: 'Orpiment',
      name_lat: 'Auripigmentum',
      icon: '🟡',
      effect: null,
      lore: 'Síra a arsen. Zářivě citronová, připomíná ryzí zlato — a stejně tak zabíjí. Albertus Magnus varoval.',
      lore_en: 'Sulfur and arsenic. Brilliantly lemon-coloured, resembling pure gold — and just as deadly. Albertus Magnus warned against it.'
    },
    'mercury+sulfur:calcinatio': {
      result: { id: 'cinnabaris_pura', qty: 1 },
      name: 'Syntetická rumělka', name_en: 'Synthetic Vermilion',
      name_lat: 'Cinnabaris Pura',
      icon: '🔴',
      effect: null,
      lore: 'Síra a živé stříbro v zapečetěné baňce. Prudký žár, toxické výpary — riskantní operace v Athanoru.',
      lore_en: 'Sulfur and quicksilver in a sealed flask. Fierce heat, toxic fumes — a risky operation in the Athanor.'
    },
    'gall_nut+spiritus_vini+vitriol:destillatio': {
      result: { id: 'atramentum_perpetuum', qty: 1 },
      name: 'Věčný inkoust', name_en: 'Everlasting Ink',
      name_lat: 'Atramentum Perpetuum',
      icon: '⚫',
      effect: null,
      lore: 'Dokonalý ferrogalický inkoust s vinným lihem pro maximální penetraci pergamenu. Nevybledne nikdy.',
      lore_en: 'The perfect iron gall ink, with spirit of wine for maximum penetration of vellum. It never fades.'
    },
    'acetum_destillatum+verdigris:destillatio': {
      result: { id: 'verdigris_purum', qty: 1 },
      name: 'Krystalická měděnka', name_en: 'Purified Verdigris',
      name_lat: 'Viride Aeris Purificatum',
      icon: '🟢',
      effect: null,
      lore: 'Surová měděnka rozpuštěná v destilovaném octu, nechaná pomalu krystalizovat. Nejhlubší smaragd středověku.',
      lore_en: 'Raw verdigris dissolved in distilled vinegar, left to crystallise slowly. The deepest emerald of the Middle Ages.'
    },
    'honey+mandrake+spiritus_vini:destillatio': {
      result: { id: 'magisterium_mandragorae', qty: 1 },
      name: 'Magisterium mandragory', name_en: 'Magisterium of Mandrake',
      name_lat: 'Magisterium Mandragorae',
      icon: '🌿',
      effect: null,
      lore: 'Mandragora destilovaná s lihem a medem. Vysoce riskantní anestetikum — a most k myšlenkám, co do kláštera nepatří.',
      lore_en: 'Mandrake distilled with spirit and honey. A highly risky anaesthetic — and a bridge to thoughts that have no place in a monastery.'
    },

    // ── tech_athanor_quaternio — 4-slotové recepty (dřív blokované 3-slot stropem)
    'mercury+sal_ammoniac+sulfur+tin:calcinatio': {
      result: { id: 'aurum_musicum', qty: 1 },
      name: 'Mozaikové zlato', name_en: 'Mosaic Gold',
      name_lat: 'Aurum Musicum',
      icon: '✨',
      effect: null,
      lore: 'Rtuť, cín, síra a salmiak žíhané v zapečetěné baňce. Třpytí se jako zlato, nikdy nezčerná — Cennini, ~1400.',
      lore_en: 'Mercury, tin, sulfur, and sal ammoniac calcined in a sealed flask. Glitters like gold, never tarnishes — Cennini, c. 1400.'
    },
    'gentian+honey+wine+wormwood:coctio': {
      result: { id: 'theriacum_simplex', qty: 1 },
      name: 'Základní theriak', name_en: 'Simple Theriac',
      name_lat: 'Theriacum Simplex',
      icon: '🍯',
      effect: null,
      lore: 'Pelyněk, hořec a med svařené s vínem. Hořkosladký základ pro legendární Theriacum Monasticum.',
      lore_en: 'Wormwood, gentian, and honey boiled down with wine. A bittersweet base for the legendary Theriacum Monasticum.'
    },

    // ══════════════════════════════════════════════════════════════════════
    // SCRINIUM RECIPE FOLIOS MRD — 23 receptů, unlockFolio gate (ne TechTree).
    // Nalezení konkrétního folia v Tajných spisech odemkne jeho recepty.
    // ══════════════════════════════════════════════════════════════════════

    // ── Folio 1: Codex Coloris Perditi (Ztracené barvy) ──
    'cerusa+minium+ochra_flava:trituratio': {
      result: { id: 'palette_membrana', qty: 1 },
      name: 'Tělová barva', name_en: 'Flesh Tone', name_lat: 'Palette Membrana', icon: '🎨',
      effect: null, unlockFolio: 'folio_scr01',
      lore: 'Běloba, suřík a okr utřené dohromady. Základní tón lidské kůže v iluminaci.',
      lore_en: 'White, red lead, and ochre ground together. The basic tone of human skin in illumination.'
    },
    'palette_membrana+sinopia_tosta:trituratio': {
      result: { id: 'poschum', qty: 1 },
      name: 'Stínovací barva', name_en: 'Shading Paint', name_lat: 'Poschum', icon: '🎨',
      effect: null, unlockFolio: 'folio_scr01',
      lore: 'Tělová barva prohloubená sinopií. Stín pod oči a líce — hloubka a život.',
      lore_en: 'Flesh tone deepened with sinopia. Shadow beneath the eyes and cheeks — depth and life.'
    },
    'lapis_lazuli+verdigris_purum:trituratio': {
      result: { id: 'pigment_regius', qty: 1 },
      name: 'Královský pigment', name_en: 'Regal Pigment', name_lat: 'Pigmentum Regium', icon: '🟣',
      effect: null, unlockFolio: 'folio_scr01',
      lore: 'Krystalická měděnka s lapis lazuli. Roucha králů a Krista.',
      lore_en: 'Purified verdigris with lapis lazuli. The robes of kings and of Christ.'
    },

    // ── Folio 2: Notata Fornacis (Poznámky od pece) ──
    'calx_cupri+sal_alkali:coctio': {
      result: { id: 'sklo_zelene', qty: 2 },
      name: 'Zelené sklo', name_en: 'Green Glass', name_lat: 'Vitrum Viride', icon: '🟢',
      effect: null, unlockFolio: 'folio_scr02',
      lore: 'Žíhaná měď tavená s louhovou solí. Měď barví sklo do syta zelena.',
      lore_en: 'Calcined copper smelted with alkali salt. Copper colours glass a deep green.'
    },
    'chalk+cinere_stanni:coctio': {
      result: { id: 'glazura_bila', qty: 2 },
      name: 'Bílá glazura', name_en: 'White Glaze', name_lat: 'Glazura Alba', icon: '⚪',
      effect: null, unlockFolio: 'folio_scr02',
      lore: 'Cínový popel s křídou. Neprůhledná bílá glazura, jaká se dřív jinak nedala.',
      lore_en: 'Tin ash with chalk. An opaque white glaze that could not otherwise be made.'
    },
    'lithargyrum+sal_alkali:coctio': {
      result: { id: 'sklo_olovnate', qty: 2 },
      name: 'Olovnaté sklo', name_en: 'Lead Glass', name_lat: 'Vitrum Plumbeum', icon: '🟡',
      effect: null, unlockFolio: 'folio_scr02',
      lore: 'Klejt tavený s louhovou solí. Těžší, měkčí sklo — snáz broušené.',
      lore_en: 'Litharge smelted with alkali salt. A heavier, softer glass — easier to grind.'
    },

    // ── Folio 3: Liber Medicaminum Arcanorum ──
    'beeswax+comfrey+linseed_oil:coctio': {
      result: { id: 'mast_kostivalova', qty: 1 },
      name: 'Kostivalová mast', name_en: 'Comfrey Salve', name_lat: 'Unguentum Symphyti', icon: '🫙',
      effect: null, unlockFolio: 'folio_scr03',
      lore: 'Kostival s voskem a lněným olejem. Základ středověké ortopedie.',
      lore_en: 'Comfrey with wax and linseed oil. The base of medieval orthopaedics.'
    },
    'vinegar+yarrow:maceratio': {
      result: { id: 'tinktura_rebrikova', qty: 1 },
      name: 'Řebříčková tinktura', name_en: 'Yarrow Tincture', name_lat: 'Tinctura Millefolii', icon: '🍶',
      effect: null, unlockFolio: 'folio_scr03',
      lore: 'Řebříček louhovaný v octě. Achilles jím prý léčil rány svých vojáků.',
      lore_en: "Yarrow steeped in vinegar. Achilles is said to have treated his soldiers' wounds with it."
    },
    'honey+juniper:coctio': {
      result: { id: 'sirup_jalovcovy', qty: 1 },
      name: 'Jalovcový sirup', name_en: 'Juniper Syrup', name_lat: 'Syrupus Juniperi', icon: '🍯',
      effect: null, unlockFolio: 'folio_scr03',
      lore: 'Jalovec svařený s medem. Silně prohřívací, na revma a dnu.',
      lore_en: 'Juniper boiled down with honey. Strongly warming, for rheumatism and gout.'
    },
    'hyssop+wine:coctio': {
      result: { id: 'elixir_plicni', qty: 1 },
      name: 'Plicní elixír', name_en: 'Lung Elixir', name_lat: 'Elixir Pulmonis', icon: '🍶',
      effect: null, unlockFolio: 'folio_scr03',
      lore: 'Yzop vařený s vínem. Benediktinská bylina proti kašli od žalmů po klášterní zahrady.',
      lore_en: 'Hyssop boiled with wine. A Benedictine herb against coughing, from the psalms to the monastery garden.'
    },

    // ── Folio 4: Testamentum Ultimum (capstone) ──
    'honey+theriacum_simplex+wormwood:coctio': {
      result: { id: 'theriacum_monasticum', qty: 1 },
      name: 'Theriacum Monasticum', name_en: 'Theriacum Monasticum', name_lat: 'Theriacum Monasticum', icon: '👑',
      effect: null, unlockFolio: 'folio_scr04',
      lore: 'Legendární protijed. Ve středověku 64 složek, 12 let zrání — nejdražší lék světa.',
      lore_en: "The legendary antidote. In the Middle Ages: sixty-four ingredients, twelve years of ageing — the world's most expensive remedy."
    },
    'honey+lazulium_mellitum+spiritus_vini:destillatio': {
      result: { id: 'elixir_vitae', qty: 1 },
      name: 'Elixir Vitae', name_en: 'Elixir Vitae', name_lat: 'Elixir Vitae', icon: '✨',
      effect: {
        type: 'vigor_restore',
        value: 40,
        duration_ms: 0,
        label: 'Elixir Vitae: Vigor +40 — den bez únavy'
      },
      unlockFolio: 'folio_scr04',
      lore: 'Alchymisté od Rogera Bacona snili o látce proti stárnutí. Tahle verze slibuje jen den bez únavy.',
      lore_en: 'Alchemists since Roger Bacon dreamed of a substance against ageing. This version only promises a day without fatigue.'
    },

    // ── Folio 5: Herbarium Occultum ──
    'beeswax+plantain:trituratio': {
      result: { id: 'mast_jitrocelova', qty: 1 },
      name: 'Jitrocelová mast', name_en: 'Plantain Salve', name_lat: 'Unguentum Plantaginis', icon: '🫙',
      effect: null, unlockFolio: 'folio_scr05',
      lore: 'Jitrocel s voskem. Poutníkova bylina, hojí rány od nepaměti.',
      lore_en: "Plantain with wax. The pilgrim's herb, healing wounds since time immemorial."
    },
    'fennel+honey:coctio': {
      result: { id: 'sirup_fenyklovy', qty: 1 },
      name: 'Fenyklový sirup', name_en: 'Fennel Syrup', name_lat: 'Syrupus Foeniculi', icon: '🍯',
      effect: null, unlockFolio: 'folio_scr05',
      lore: 'Fenykl svařený s medem. Hildegarda jej doporučovala na trávení.',
      lore_en: 'Fennel boiled down with honey. Hildegard recommended it for digestion.'
    },
    'beeswax+comfrey+yarrow:coctio': {
      result: { id: 'mast_universalni', qty: 1 },
      name: 'Univerzální mast', name_en: 'Universal Salve', name_lat: 'Unguentum Universale', icon: '🫙',
      effect: null, unlockFolio: 'folio_scr05',
      lore: 'Kostival a řebříček s voskem. Jedna mast na rány, pohmožděniny i popáleniny.',
      lore_en: 'Comfrey and yarrow with wax. One salve for wounds, bruises, and burns alike.'
    },

    // ── Folio 6: Fragmenta Alchemiae ──
    'gum_arabic+malachite+water:trituratio': {
      result: { id: 'pigment_malachit', qty: 2 },
      name: 'Malachitová zeleň', name_en: 'Malachite Green', name_lat: 'Pigmentum Malachitum', icon: '🟢',
      effect: null, unlockFolio: 'folio_scr06',
      lore: 'Malachit rozetřený s arabskou gumou. Zelený pigment od starověkého Egypta.',
      lore_en: 'Malachite ground with gum arabic. A green pigment used since ancient Egypt.'
    },
    'alum+chalk+gum_arabic:coctio': {
      result: { id: 'mordant_universal', qty: 2 },
      name: 'Univerzální mořidlo', name_en: 'Universal Mordant', name_lat: 'Mordant Universalis', icon: '🧪',
      effect: null, unlockFolio: 'folio_scr06',
      lore: 'Kamenec s křídou a gumou. Váže barviva na tkaninu i pergamen proti vlhku.',
      lore_en: 'Alum with chalk and gum. Binds dyes to cloth or vellum against damp.'
    },
    'linseed_oil+spodium:trituratio': {
      result: { id: 'tmel_kostni', qty: 2 },
      name: 'Kostní tmel', name_en: 'Bone Putty', name_lat: 'Cement Ossium', icon: '🦴',
      effect: null, unlockFolio: 'folio_scr06',
      lore: 'Kostní popel s lněným olejem. Podklad pro zlacení.',
      lore_en: 'Bone ash with linseed oil. A ground for gilding.'
    },
    'auripigmentum+gum_arabic:trituratio': {
      result: { id: 'pigment_zlatozluty', qty: 1 },
      name: 'Zlatožlutý pigment', name_en: 'Golden Yellow Pigment', name_lat: 'Pigmentum Aureum', icon: '🟡',
      effect: null, unlockFolio: 'folio_scr06',
      lore: 'Auripigment s gumou. Citronově zlatá barva pro iluzi zlacení v chudších knihách.',
      lore_en: 'Orpiment with gum. A lemon-gold colour for the illusion of gilding in poorer books.'
    },

    // ── Folio 7: Secretum Vitriarii ──
    'lead+tin:calcinatio': {
      result: { id: 'slitina_cin_olovo', qty: 2 },
      name: 'Cínovo-olověná slitina', name_en: 'Tin-Lead Alloy', name_lat: 'Stannum Plumbeum', icon: '⚪',
      effect: null, unlockFolio: 'folio_scr07',
      lore: 'Cín tavený s olovem. Cíncovina — pravá středověká pájka.',
      lore_en: 'Tin smelted with lead. Pewter — a true medieval solder.'
    },
    'copper+tin:calcinatio': {
      result: { id: 'bronz', qty: 2 },
      name: 'Bronz', name_en: 'Bronze', name_lat: 'Aes', icon: '🟠',
      effect: null, unlockFolio: 'folio_scr07',
      lore: 'Měď tavená s cínem. Nejstarší slitina lidstva — zvony, nářadí, sochy.',
      lore_en: "Copper smelted with tin. Humanity's oldest alloy — bells, tools, statues."
    },
    'sandarak+spiritus_vini:coctio': {
      result: { id: 'lak_universalni', qty: 1 },
      name: 'Sandarakový lak', name_en: 'Sandarac Varnish', name_lat: 'Vernix Sandaraca', icon: '✨',
      effect: null, unlockFolio: 'folio_scr07',
      lore: 'Sandarak ve vinném lihu — Cenniniho nejluxusnější čirý lak.',
      lore_en: "Sandarac in spirit of wine — Cennini's most luxurious clear varnish."
    },
    'arsenicum+chalk:trituratio': {
      result: { id: 'belidlo_medi', qty: 1 },
      name: 'Bělidlo mědi', name_en: 'Copper Whitener', name_lat: 'Candificatio Cupri', icon: '⚪',
      effect: null, unlockFolio: 'folio_scr07',
      lore: 'Arsen s křídou. Albertus Magnus: jed i bělidlo mědi — nebezpečné, ale účinné.',
      lore_en: 'Arsenic with chalk. Albertus Magnus: both a poison and a copper whitener — dangerous, but effective.'
    },

    // ══ CERVISIARIA ══
    'grain+water:coctio': {
      result: { id: 'wort', qty: 1 },
      name: 'Mladina', name_en: 'Wort', name_lat: 'Mustum Cerevisiae', icon: '🫗', effect: null,
      lore: 'Obilí povařené s vodou vydá zlatavou tekutinu. Základ každého piva.',
      lore_en: 'Grain boiled with water yields a golden liquid. The base of every beer.'
    },
    'hops+wort:maceratio': {
      result: { id: 'prima_cervisia', qty: 2 },
      name: 'Prima Cervisia', name_en: 'Prima Cervisia', name_lat: 'Cervisia Prima', icon: '🍺',
      effect: { type: 'vigor_restore', value: 15, label: 'Prima Cervisia: Vigor +15 / 30 min' },
      lore: 'Mladina vyluhovaná s chmelem. Benediktini ji vařili pro poutníky i pro sebe.',
      lore_en: 'Wort steeped with hops. The Benedictines brewed it for pilgrims and for themselves.'
    },
    'honey+wort:maceratio': {
      result: { id: 'wine', qty: 1 },
      name: 'Hydromel', name_en: 'Hydromel', name_lat: 'Hydromel Monasticum', icon: '🍯',
      effect: { type: 'vigor_restore', value: 20, label: 'Hydromel: Vigor +20 / 20 min' },
      lore: 'Med fermentovaný v mladině. Starší než víno. Nápoj bohů i mnichů.',
      lore_en: 'Honey fermented in wort. Older than wine. A drink of gods and monks alike.'
    },
    'hops+thyme+wort:coctio': {
      result: { id: 'cervisia_nigra', qty: 2 },
      name: 'Cervisia Nigra', name_en: 'Cervisia Nigra', name_lat: 'Cervisia Nigra', icon: '🍺',
      effect: { type: 'vigor_restore', value: 25, label: 'Cervisia Nigra: Vigor +25 / 45 min' },
      lore: 'Tmavé pivo s tymiánem. Hildegarda by schválila. Prodává se za zlaté.',
      lore_en: 'A dark beer with thyme. Hildegard would approve. Sold for gold coin.'
    },
    'honey+thyme:coctio': {
      result: { id: 'potion_vigor_minor', qty: 1 },
      name: 'Mel Thymicum', name_en: 'Mel Thymicum', name_lat: 'Mel Thymicum', icon: '🌿',
      effect: { type: 'vigor_restore', value: 20, label: 'Mel Thymicum: Vigor +20' },
      lore: 'Med s tymiánem vařený nad Athanorem. Hildegarda doporučovala na zimnici i smutek duše.',
      lore_en: 'Honey with thyme, cooked over the Athanor. Hildegard recommended it for chills as well as sorrow of the soul.'
    },
    'grain+honey:coctio': {
      result: { id: 'stamina_tonic', qty: 1 },
      name: 'Posca Dulcis', name_en: 'Posca Dulcis', name_lat: 'Posca Dulcis', icon: '🥛', effect: null,
      lore: 'Obilný vývar oslazen medem. Posca — nápoj římských legionářů v klášterní podobě.',
      lore_en: 'A grain broth sweetened with honey. Posca — the drink of Roman legionaries, in monastery form.'
    },

    // ── Tier 4: Calcinatio — Žíhání (popel) ──
    'charcoal+charcoal:calcinatio': {
      result: { id: 'ash', qty: 5 },
      name: 'Calcinatio Carbonis', name_en: 'Calcinatio Carbonis',
      name_lat: 'Calcinatio Carbonis',
      icon: '🌫️',
      effect: null,
      lore: 'Dvě uhlí žíhaná v Athanoru vydají čistý popel. Ignis omnia purgat — oheň vše čistí.',
      lore_en: 'Two lumps of charcoal calcined in the Athanor yield pure ash. Ignis omnia purgat — fire purifies all.'
    },
    'charcoal+stick:calcinatio': {
      result: { id: 'ash', qty: 3 },
      name: 'Calcinatio Ligni', name_en: 'Calcinatio Ligni',
      name_lat: 'Calcinatio Ligni',
      icon: '🌫️',
      effect: null,
      lore: 'Uhlí a větev v žáru Athanoru. Méně čisté než dvojí uhlí, ale dostupnější surovina.',
      lore_en: "Charcoal and a branch in the Athanor's heat. Less pure than double charcoal, but a more readily available raw material."
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
      msg_en: 'The mixture caught fire. Too dry and hot — add a moister component or choose another process.',
      lore: 'Titivillus byl zde. Pytel chyb je těžší.',
      lore_en: 'Titivillus was here. His sack of errors grows heavier.'
    },
    {
      id: 'DILUTIO',
      condition: (t, m) => m >= 7,
      icon: '💧',
      title: 'Dilutio',
      msg: 'Vše se rozpustilo bez výsledku. Příliš vodnaté — přidej pojivo nebo suchý pigment.',
      msg_en: 'Everything dissolved with no result. Too watery — add a binder or a dry pigment.',
      lore: 'Aqua omnia vincit — ale ne vždy ku prospěchu díla.',
      lore_en: "Aqua omnia vincit — but not always to the work's benefit."
    },
    {
      id: 'INERTIA',
      condition: (t, m) => t <= -4,
      icon: '🧊',
      title: 'Inertia',
      msg: 'Nic se nestalo. Složky spolu nereagují — zkus jiný proces nebo přidej tepelnou složku.',
      msg_en: 'Nothing happened. The components do not react — try another process or add a warming component.',
      lore: 'Ignis latet in cinere. Oheň se skrývá — ale tentokrát příliš hluboko.',
      lore_en: 'Ignis latet in cinere. Fire hides within — but this time, too deep.'
    },
    {
      id: 'CORRUPTIO',
      condition: (t, m, roll) => roll <= 5,
      icon: '🌑',
      title: 'Corruptio',
      msg: 'Černá kaše bez zápachu. Dílo se zkazilo — možná jiná kombinace, možná špatný den.',
      msg_en: 'A black paste with no scent. The work has spoiled — perhaps the wrong combination, perhaps the wrong day.',
      lore: 'Nigredo. Rozklad. Možná začátek něčeho nového — nebo jen ztráta.',
      lore_en: 'Nigredo. Decay. Perhaps the beginning of something new — or merely a loss.'
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
      desc_en: 'The raw materials break down...',
      color: '#1a1410',
      textColor: '#8b7355'
    },
    {
      id: 'albedo',
      label: 'Albedo',
      desc: 'Pára stoupá, tekutina se čistí...',
      desc_en: 'Vapour rises, the liquid clears...',
      color: '#2a2820',
      textColor: '#c9a96e'
    },
    {
      id: 'rubedo',
      label: 'Rubedo',
      desc: 'Barva se ustálila. Dílo je dokonáno.',
      desc_en: 'The colour has settled. The work is complete.',
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
    const vigorMod = vigor < 30 ? -3 : 0;
    // Role Athanorista: bonus +3 k rollu (getActiveBonus vrátí 1.20 → 0.20 * 15 = 3)
    const roleMod = (typeof RankSystem !== 'undefined') ? Math.round((RankSystem.getActiveBonus('athanor_success') - 1.0) * 15) : 0;
    // Filipojakubská noc — +30% šance úspěchu na 8h po volbě "Pracovat v Athanoru celou noc"
    const walpurgisMod = (GameState.flags && GameState.flags.walpurgisAthanor && GameState.flags.walpurgisAthanor > Date.now()) ? 5 : 0;
    const effectiveRoll = roll + vigorMod + roleMod + walpurgisMod;
    // Role Athanorista: nigredo_bonus — extra ochrana proti Corruptio (Nigredo selhání)
    const nigredoMod = (typeof RankSystem !== 'undefined') ? Math.round((RankSystem.getActiveBonus('nigredo_bonus') - 1.0) * 15) : 0;
    const corruptionRoll = effectiveRoll + nigredoMod;

    // Zkontroluj failures
    for (const f of AthanorDB.failures) {
      if (f.id === 'CORRUPTIO') {
        if (f.condition(thermal, moisture, corruptionRoll)) {
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

    // Tech gate na úrovni combo (nová, volitelná vlastnost — beze změny pro
    // existující combos, žádná z nich unlock nemá nastavenej).
    if (combo.unlock && !(GameState.researchedTechs && GameState.researchedTechs.includes(combo.unlock))) {
      return {
        success: false,
        failure: {
          id: 'LOCKED',
          icon: '🔒',
          title: 'Terra Incognita',
          msg: 'Tato kombinace zatím žádný výsledek nevydala. Zkus jiné složky nebo jiný proces.',
          lore: 'Alchymie je umění trpělivosti. Pokračuj ve zkoumání.'
        }
      };
    }

    // Folio gate (scrinium-recipe-folios MRD) — recept odemčen až PROSTUDOVÁNÍM
    // folia po Arcanum (layer 3), ne pouhým nálezem — stejná logika jako
    // stávající reward.recipe_unlock u netolicky_05/palimpsest (SecretsSystem.js).
    if (combo.unlockFolio) {
      const fState = GameState.scrinium && GameState.scrinium.folios && GameState.scrinium.folios[combo.unlockFolio];
      if (!fState || (fState.layer || 0) < 3) {
        return {
          success: false,
          failure: {
            id: 'LOCKED',
            icon: '🔒',
            title: 'Terra Incognita',
            msg: 'Tato kombinace zatím žádný výsledek nevydala. Zkus jiné složky nebo jiný proces.',
            lore: 'Alchymie je umění trpělivosti. Pokračuj ve zkoumání.'
          }
        };
      }
    }

    // Kritický úspěch (roll 20, vigor >= 70)
    const isCritical = (effectiveRoll === 20 && vigor >= 70);

    return { success: true, combo, isCritical };
  }
};

// ── ENGINE ───────────────────────────────────────────────────

const AthanorSystem = {

  // Jazykový helper — stejný zdroj pravdy jako iName()/iDesc() v i18n/strings.js
  _lang() {
    return (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
  },

  // MRD athanor-quaternio — 3 sloty je základ, tech_athanor_quaternio zvedá na 4.
  maxSlots() {
    return (GameState.researchedTechs && GameState.researchedTechs.includes('tech_athanor_quaternio')) ? 4 : 3;
  },

  // Codex Athanori — sbalitelný panel (UI-only stav, nepersistuje se do save)
  _codexCollapsed: false,
  toggleCodex() {
    AthanorSystem._codexCollapsed = !AthanorSystem._codexCollapsed;
    AthanorSystem.render('home-athanor-content');
  },

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
      if (!GameState.athanor.slots) GameState.athanor.slots = [];
      if (!GameState.athanor.activeProcess) GameState.athanor.activeProcess = 'coctio';
      if (!GameState.athanor.brewing) GameState.athanor.brewing = null;
      if (!GameState.athanor.discovered) GameState.athanor.discovered = [];
      if (!('lastResult' in GameState.athanor)) GameState.athanor.lastResult = null;
    }
    setInterval(() => AthanorSystem.tick(), 2000);
    setInterval(() => AthanorSystem._tickProgressBar(), 500);
  },

  // ── PROGRESS BAR TICK (každých 500ms) ──────────────────────
  // Cíleně aktualizuje jen šířku pruhu a zbývající čas přes DOM, BEZ
  // překreslení celého panelu — jedině tak má CSS transition co animovat.
  _tickProgressBar() {
    const b = GameState.athanor && GameState.athanor.brewing;
    if (!b) return;
    const panel = document.getElementById('home-athanor-content');
    if (!panel || panel.style.display === 'none') return;

    const fillEl = document.getElementById('athanor-progress-fill');
    const remEl = document.getElementById('athanor-progress-remaining');
    if (!fillEl || !remEl) return; // panel otevřený, ale zrovna jinde (např. modal výsledku)

    const now = Date.now();
    const pct = Math.min(100, Math.floor(((now - b.startedAt) / b.duration) * 100));
    const stageIndex = pct < 33 ? 0 : pct < 66 ? 1 : 2;
    const remaining = Math.max(0, Math.ceil((b.expiresAt - now) / 1000));

    // Fáze (Nigredo/Albedo/Rubedo) se změnila — barva/label/ikona potřebují
    // celý přerender panelu, ne jen šířku. Rychlý tick to jednorázově pozná
    // a přepne na plný refresh, pak pokračuje dál v cíleném módu.
    if (fillEl.dataset.stage !== String(stageIndex)) {
      AthanorSystem.refreshIfOpen();
      return;
    }

    fillEl.style.width = pct + '%';
    remEl.textContent = remaining + 's';
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

    // VITREA V3: destilace vyžaduje alembik (nástroj) + 1 baňku (spotřební) za běh
    if (state.activeProcess === 'destillatio') {
      if ((GameState.inventory['alembic'] || 0) <= 0) {
        UI.notify('⚗️ Destilace vyžaduje alembik. Sklář ho dodá.', true);
        return;
      }
      if ((GameState.inventory['glass_flask'] || 0) <= 0) {
        UI.notify('⚗️ Destilace vyžaduje baňku (spotřebuje se).', true);
        return;
      }
    }

    // Zkontroluj inventář
    const counts = {};
    slots.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    for (const [id, qty] of Object.entries(counts)) {
      if ((GameState.inventory[id] || 0) < qty) {
        const ing = AthanorDB.ingredients.find(i => i.id === id);
        UI.notify(`⚗️ Nemáš dostatek: ${ing ? (AthanorSystem._lang()==='en' && ing.name_en ? ing.name_en : ing.name) : id}`, true);
        return;
      }
    }

    // Odečti ingredience
    for (const [id, qty] of Object.entries(counts)) {
      Game.removeItem(id, qty);
    }
    // VITREA V3: destilace spotřebuje 1 baňku
    if (state.activeProcess === 'destillatio') Game.removeItem('glass_flask', 1);

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

    // VITREA V3: po destilaci 10% šance, že alembik praskne (náhrada u Skláře)
    if (processId === 'destillatio' && (GameState.inventory['alembic'] || 0) > 0 && Math.random() < 0.10) {
      Game.removeItem('alembic', 1);
      if (typeof UI !== 'undefined' && UI.notifyPanel) {
        UI.notifyPanel('💥 Alembik žárem praskl. Sklář má náhradní — za groše.', 'warning');
      }
      Game.addKronikaEntry('minor', '💥 Alembik praskl při destilaci.', '💥 The alembic cracked during distillation.', '💥 Alembicum fractum est.');
    }

    const result = CombinationEngine.evaluate(slots, processId);
    const lang = AthanorSystem._lang();

    if (result.success) {
      const { combo, isCritical } = result;
      const dispName = (lang === 'en' && combo.name_en) ? combo.name_en : combo.name;
      const dispLore = (lang === 'en' && combo.lore_en) ? combo.lore_en : combo.lore;

      // Přidej výsledek (kritický = +1 bonus)
      const qty = combo.result.qty + (isCritical ? 1 : 0);
      Game.addItem(combo.result.id, qty);

      // Aplikuj efekt
      if (combo.effect) {
        AthanorSystem.applyEffect(combo.effect, dispName);
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
        name: dispName,
        name_lat: combo.name_lat,
        lore: dispLore,
        effectLabel: combo.effect ? combo.effect.label : null,
        qty: combo.result.qty + (isCritical ? 1 : 0),
        isCritical,
        isNewDiscovery
      };

      // Toast + zvuk
      const critText = isCritical ? (lang === 'en' ? ' ✨ Critical success!' : ' ✨ Kritický úspěch!') : '';
      UI.notifyPanel(`⚗️ ${combo.icon} ${dispName} — ${lang === 'en' ? 'The work is complete.' : 'Dílo je dokonáno.'}${critText}`, 'system');
      AthanorSystem.playBrewingDone(isCritical);

    } else {
      const f = result.failure;

      // Ulož lastResult (selhání)
      state.lastResult = {
        success: false,
        icon: f.icon,
        title: f.title,
        msg: (lang === 'en' && f.msg_en) ? f.msg_en : f.msg,
        lore: (lang === 'en' && f.lore_en) ? f.lore_en : f.lore
      };

      UI.notifyPanel(`${f.icon} ${f.title} — ${(lang === 'en' && f.msg_en) ? f.msg_en : f.msg}`, 'warning');
      AthanorSystem.playBrewingFail();

      // B2 — Exploze v Athanoru (2% šance při neúspěchu)
      if (Math.random() < 0.02) {
        if (!GameState.flags) GameState.flags = {};
        GameState.flags.athanorSealedUntil = Date.now() + (2 * 3600000);
        VigorSystem.addFatigue(15);
        UI.notifyPanel(t('events.athanor_explosion.notify'), 'warning');
        if (typeof Game !== 'undefined' && typeof Game.addKronikaEntry === 'function') {
          Game.addKronikaEntry('important', t('events.athanor_explosion.notify'), t('events.athanor_explosion.notify'), '');
        }
      }
    }

    Game.save();
    AthanorSystem.showResultModal(state.lastResult);
    AthanorSystem.render('home-athanor-content');
  },

  // ── SLOT MANAGEMENT ───────────────────────────────────────
  addToSlot(ingredientId) {
    const state = GameState.athanor;
    if (state.brewing) return; // nelze měnit za vaření
    if (state.slots.length >= this.maxSlots()) {
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
        GameState.satiety = Math.min(
          (typeof VigorSystem !== 'undefined' ? VigorSystem.MAX_SATIETY : 100),
          (GameState.satiety || 0) + effect.value
        );
        if (typeof VigorSystem !== 'undefined') VigorSystem.renderPill();
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
      case 'heresy_brew':
        // MRD: haeresis-occulta — vaření kacířskýho lektvaru samo o sobě
        // riskuje pozornost Inkvizice + šanci na blud. Aktivuje dosud
        // nepoužitej GameState.secrets.inquisitionHeat (0-100, raids at 80+).
        if (GameState.secrets) {
          GameState.secrets.inquisitionHeat = Math.min(100, (GameState.secrets.inquisitionHeat || 0) + effect.heatGain);
        }
        if (Math.random() < effect.conditionChance && typeof HealthSystem !== 'undefined') {
          HealthSystem.addCondition('haeresis_occulta');
        }
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
    // Sjednoceno s CalendarSystem (dřív vlastní Julian-day vzorec, jiné
    // číslo než kalendář — kalendar-widget-mrd.md §4). Fallback zachován
    // pro edge-case, kdy by se athanor.js načetl bez calendar.js.
    if (typeof CalendarSystem !== 'undefined' && CalendarSystem.getLunarPhase) {
      return CalendarSystem.getLunarPhase();
    }
    const now = new Date();
    const jd = 367 * now.getFullYear()
      - Math.floor(7 * (now.getFullYear() + Math.floor((now.getMonth() + 10) / 12)) / 4)
      + Math.floor(275 * (now.getMonth() + 1) / 9)
      + now.getDate() + 1721013.5;
    const p = ((jd - 2451550.1) / 29.53058867) % 1;
    const phase = p < 0 ? p + 1 : p;
    if (phase < 0.03 || phase > 0.97) return { name: 'Nov', icon: '🌑', bonus: 'nigredo', label: 'Nov — Nigredo +20%' };
    if (phase < 0.47) return { name: 'Dorůstá', icon: '🌔', bonus: null, label: 'Dorůstající měsíc' };
    if (phase < 0.53) return { name: 'Úplněk', icon: '🌕', bonus: 'rubedo', label: 'Úplněk — Rubedo +20%' };
    return { name: 'Ubývá', icon: '🌖', bonus: null, label: 'Ubývající měsíc' };
  },

  getCanonicalHour() {
    const h = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour() : new Date().getHours();
    if (h >= 3 && h < 6) return { name: 'Laudes', icon: '🌅', bonus: 'quality', label: 'Laudes — +10% kvalita' };
    if (h >= 6 && h < 9) return { name: 'Prima', icon: '🌄', bonus: null, label: 'Prima' };
    if (h >= 9 && h < 12) return { name: 'Tertia', icon: '☀️', bonus: null, label: 'Tertia' };
    if (h >= 12 && h < 15) return { name: 'Sexta', icon: '🌞', bonus: null, label: 'Sexta' };
    if (h >= 15 && h < 18) return { name: 'Nona', icon: '🌤️', bonus: null, label: 'Nona' };
    if (h >= 18 && h < 21) return { name: 'Vesper', icon: '🌆', bonus: null, label: 'Vesper' };
    if (h >= 21 && h < 24) return { name: 'Completorium', icon: '🌙', bonus: null, label: 'Completorium' };
    return { name: 'Vigilia', icon: '⭐', bonus: null, label: 'Vigilia noctis' };
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
    // Dormitorium "kukaň" — přiřazený bratr (specializace Alchymista)
    const athanorBrother = (GameState.dormitorium && GameState.dormitorium.brothers || [])
      .find(b => b.assignedTab === 'athanor');
    let brotherText = '';
    if (athanorBrother) {
      const rec = (athanorBrother.rosterId && typeof DormitoriumRosterDB !== 'undefined') ? DormitoriumRosterDB[athanorBrother.rosterId] : null;
      const bIcon = (rec && rec.icon) ? rec.icon : '📿';
      const level = (typeof Game !== 'undefined' && Game.dormitoriumBrotherLevel) ? Game.dormitoriumBrotherLevel(athanorBrother, 'athanor') : 1;
      brotherText = `${bIcon} ${athanorBrother.name} · Lv${level}`;
    }
    return `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;
      padding:7px 12px;margin-bottom:14px;
      background:rgba(0,0,0,0.12);border-radius:8px;
      border:1px solid rgba(200,160,60,0.15);
      font-family:'Cinzel',serif;font-size:0.72rem;color:#c9a96e;">
      <span title="${lunar.label}">${lunar.icon} ${lunar.name}</span>
      <span style="opacity:0.3;">·</span>
      <span title="${canonical.label}">${canonical.icon} ${canonical.name}</span>
      <span style="opacity:0.3;">·</span>
      <span style="color:${tc};" title="Teplo">🌡️ ${thermal > 0 ? '+' : ''}${thermal}</span>
      <span style="opacity:0.3;">·</span>
      <span style="color:${mc};" title="Vlhkost">💧 ${moisture > 0 ? '+' : ''}${moisture}</span>
      ${bonusText ? `<span style="opacity:0.3;">·</span><span style="font-size:0.65rem;">✨ ${bonusText}</span>` : ''}
      ${brotherText ? `<span style="opacity:0.3;">·</span><span style="font-size:0.65rem;" title="Řídí">${brotherText}</span>` : ''}
    </div>`;
  },

  buildAlembicSvg(state) {
    const isBrewing = !!state.brewing;
    const procId = isBrewing ? state.brewing.processId : null;
    const isDestilling = procId === 'destillatio';
    const isCalcining = procId === 'calcinatio';
    const isGrinding = procId === 'trituratio';
    const now = Date.now();
    let pct = 0, si = 0;
    if (isBrewing) {
      const b = state.brewing;
      pct = Math.min(100, Math.floor(((now - b.startedAt) / b.duration) * 100));
      si = pct < 33 ? 0 : pct < 66 ? 1 : 2;
    }
    const liqColors = ['#1a0f05', '#d4cfc8', '#8b1a1a'];
    const glowColors = ['rgba(80,40,10,0.5)', 'rgba(220,210,190,0.4)', 'rgba(180,40,40,0.6)'];
    const liq = isBrewing ? liqColors[si] : '#2a1a0a';
    // Calcinatio: intenzivnější žár než ostatní procesy
    const glow = isCalcining ? 'rgba(255,120,20,0.75)' : (isBrewing ? glowColors[si] : 'transparent');
    const lit = isBrewing && !isGrinding; // suché drcení nepotřebuje oheň pod kotlem

    // Trituratio (suché drcení) nemá bublající kapalinu — potlačit bubbles
    const bubbles = (isBrewing && !isGrinding) ? `
      <circle cx="78" cy="73" r="3" fill="rgba(255,255,255,0.4)">
        <animate attributeName="cy" values="73;70;73" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="r" values="3;3.6;2.1;3" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="95" cy="71" r="2" fill="rgba(255,255,255,0.35)">
        <animate attributeName="cy" values="71;67;71" dur="1.4s" repeatCount="indefinite" begin="0.4s"/>
        <animate attributeName="r" values="2;2.6;1.6;2" dur="1.4s" repeatCount="indefinite" begin="0.4s"/>
      </circle>
      <circle cx="105" cy="74" r="2.5" fill="rgba(255,255,255,0.45)">
        <animate attributeName="cy" values="74;72;74" dur="2.1s" repeatCount="indefinite" begin="0.8s"/>
        <animate attributeName="r" values="2.5;2.8;1.5;2.5" dur="2.1s" repeatCount="indefinite" begin="0.8s"/>
      </circle>` : '';
    // Destillatio: pára stoupající od hubice trubice (u hrotu ~168,32)
    const steam = isDestilling ? `
      <circle cx="150" cy="55" r="2.5" fill="rgba(255,255,255,0.35)">
        <animate attributeName="cy" values="55;30;55" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="150;156;150" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.55;0" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="162" cy="44" r="2" fill="rgba(255,255,255,0.3)">
        <animate attributeName="cy" values="44;20;44" dur="1.5s" repeatCount="indefinite" begin="0.4s"/>
        <animate attributeName="cx" values="162;167;162" dur="1.5s" repeatCount="indefinite" begin="0.4s"/>
        <animate attributeName="opacity" values="0;0.5;0" dur="1.5s" repeatCount="indefinite" begin="0.4s"/>
      </circle>
      <circle cx="171" cy="36" r="1.6" fill="rgba(255,255,255,0.3)">
        <animate attributeName="cy" values="36;14;36" dur="1.6s" repeatCount="indefinite" begin="0.9s"/>
        <animate attributeName="cx" values="171;176;171" dur="1.6s" repeatCount="indefinite" begin="0.9s"/>
        <animate attributeName="opacity" values="0;0.45;0" dur="1.6s" repeatCount="indefinite" begin="0.9s"/>
      </circle>` : '';
    // Calcinatio: jiskry vylétávající přímo z kotle (žíhání v silném ohni)
    const sparks = isCalcining ? `
      <circle cx="80" cy="65" r="1.4" fill="#ffb347">
        <animate attributeName="cy" values="65;35;65" dur="0.9s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="80;74;80" dur="0.9s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;1;0" dur="0.9s" repeatCount="indefinite"/>
      </circle>
      <circle cx="100" cy="63" r="1.1" fill="#ffd280">
        <animate attributeName="cy" values="63;30;63" dur="1.1s" repeatCount="indefinite" begin="0.3s"/>
        <animate attributeName="cx" values="100;106;100" dur="1.1s" repeatCount="indefinite" begin="0.3s"/>
        <animate attributeName="opacity" values="0;1;0" dur="1.1s" repeatCount="indefinite" begin="0.3s"/>
      </circle>
      <circle cx="112" cy="68" r="1.2" fill="#ff9f40">
        <animate attributeName="cy" values="68;40;68" dur="0.75s" repeatCount="indefinite" begin="0.6s"/>
        <animate attributeName="cx" values="112;118;112" dur="0.75s" repeatCount="indefinite" begin="0.6s"/>
        <animate attributeName="opacity" values="0;1;0" dur="0.75s" repeatCount="indefinite" begin="0.6s"/>
      </circle>` : '';
    // Trituratio: prach poletující kolem kotle při drcení (suchý mechanický proces)
    const dust = isGrinding ? `
      <circle cx="72" cy="66" r="1.5" fill="rgba(200,180,140,0.5)">
        <animate attributeName="cy" values="66;54;66" dur="0.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="108" cy="62" r="1.3" fill="rgba(200,180,140,0.45)">
        <animate attributeName="cy" values="62;48;62" dur="0.7s" repeatCount="indefinite" begin="0.2s"/>
        <animate attributeName="opacity" values="0.45;0.1;0.45" dur="0.7s" repeatCount="indefinite" begin="0.2s"/>
      </circle>
      <circle cx="90" cy="58" r="1.6" fill="rgba(200,180,140,0.4)">
        <animate attributeName="cy" values="58;44;58" dur="0.55s" repeatCount="indefinite" begin="0.35s"/>
        <animate attributeName="opacity" values="0.4;0.05;0.4" dur="0.55s" repeatCount="indefinite" begin="0.35s"/>
      </circle>` : '';

    return `<svg viewBox="0 0 180 150" width="180" height="150" xmlns="http://www.w3.org/2000/svg"
      style="filter:drop-shadow(0 0 14px ${glow});display:block;margin:0 auto;">
      <defs>
        <radialGradient id="cauldronBodyGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#4a331e"/>
          <stop offset="50%" stop-color="#2b1a0a"/>
          <stop offset="100%" stop-color="#140b03"/>
        </radialGradient>
        <linearGradient id="metalRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3d2712"/>
          <stop offset="30%" stop-color="#6e4a23"/>
          <stop offset="70%" stop-color="#4a3014"/>
          <stop offset="100%" stop-color="#231407"/>
        </linearGradient>
        <linearGradient id="ironLegGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#5c3d1a"/>
          <stop offset="50%" stop-color="#3d2712"/>
          <stop offset="100%" stop-color="#1c1005"/>
        </linearGradient>
        <radialGradient id="fireGlowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,140,20,0.6)"/>
          <stop offset="60%" stop-color="rgba(220,60,10,0.3)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>

      <!-- podlahový stín -->
      <ellipse cx="90" cy="138" rx="55" ry="6" fill="rgba(15,9,3,0.5)"/>

      <!-- zadní noha trojnožky (za ohněm) -->
      <line x1="90" y1="98" x2="90" y2="132" stroke="#241508" stroke-width="5" stroke-linecap="round"/>

      <!-- polena a ohniště -->
      <path d="M 64 135 L 116 127" stroke="#211306" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 116 135 L 64 127" stroke="#1c0f04" stroke-width="5.5" stroke-linecap="round"/>
      ${lit ? `<ellipse cx="90" cy="132" rx="28" ry="6" fill="url(#fireGlowGrad)"/>
      <ellipse cx="90" cy="131" rx="16" ry="3.5" fill="rgba(255,180,40,0.7)"/>
      <circle cx="84" cy="126" r="1.2" fill="#ffaa00">
        <animate attributeName="cy" values="126;100;126" dur="1.4s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="84;90;84" dur="1.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;0;1" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="96" cy="124" r="1" fill="#ffdd44">
        <animate attributeName="cy" values="124;94;124" dur="1.2s" repeatCount="indefinite" begin="0.5s"/>
        <animate attributeName="cx" values="96;92;96" dur="1.2s" repeatCount="indefinite" begin="0.5s"/>
        <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" begin="0.5s"/>
      </circle>
      <ellipse cx="90" cy="124" rx="22" ry="12" fill="#d35400" opacity="0.65">
        <animate attributeName="ry" values="12;15;10;14;12" dur="0.9s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="78" cy="120" rx="6.5" ry="13" fill="#e67e22" opacity="0.8">
        <animate attributeName="ry" values="13;17;10;16;13" dur="1.1s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="102" cy="120" rx="6.5" ry="13" fill="#e67e22" opacity="0.8">
        <animate attributeName="ry" values="13;16;9;17;13" dur="1.3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="90" cy="115" rx="9.5" ry="17" fill="#f39c12" opacity="0.9">
        <animate attributeName="ry" values="17;23;14;20;17" dur="0.8s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="90" cy="112" rx="5.5" ry="11" fill="#f1c40f" opacity="0.95">
        <animate attributeName="ry" values="11;15;9;14;11" dur="0.65s" repeatCount="indefinite"/>
      </ellipse>` : ''}

      <!-- tělo kotle (litina/bronz) -->
      <path d="M 42 70 C 34 100, 52 114, 90 114 C 128 114, 146 100, 138 70 Z"
        fill="url(#cauldronBodyGrad)" stroke="#5c3d1a" stroke-width="2"/>

      <!-- přední nohy trojnožky (přes oheň, kotel na nich stojí) -->
      <line x1="56" y1="104" x2="42" y2="136" stroke="#1c1005" stroke-width="7" stroke-linecap="round"/>
      <line x1="56" y1="104" x2="42" y2="136" stroke="url(#ironLegGrad)" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="124" y1="104" x2="138" y2="136" stroke="#1c1005" stroke-width="7" stroke-linecap="round"/>
      <line x1="124" y1="104" x2="138" y2="136" stroke="url(#ironLegGrad)" stroke-width="4.5" stroke-linecap="round"/>

      <!-- vyztužený límec s nýty -->
      <ellipse cx="90" cy="70" rx="48" ry="17" fill="url(#metalRimGrad)" stroke="#5c3d1a" stroke-width="2.5"/>
      <circle cx="48" cy="72" r="1.5" fill="#f0c040" opacity="0.8"/>
      <circle cx="68" cy="80" r="1.5" fill="#f0c040" opacity="0.8"/>
      <circle cx="90" cy="83" r="1.5" fill="#f0c040" opacity="0.8"/>
      <circle cx="112" cy="80" r="1.5" fill="#f0c040" opacity="0.8"/>
      <circle cx="132" cy="72" r="1.5" fill="#f0c040" opacity="0.8"/>

      <!-- vnitřek kotle -->
      <ellipse cx="90" cy="70" rx="44" ry="14.5" fill="#120a04"/>
      <ellipse cx="90" cy="71" rx="42" ry="13.5" fill="${liq}"/>

      <!-- vlnky na hladině (jen za varu) -->
      ${isBrewing ? `<ellipse cx="90" cy="71" rx="24" ry="7.5" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1">
        <animate attributeName="rx" values="16;35;16" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="4;11;4" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite"/>
      </ellipse>` : ''}

      <!-- destilační trubice (jen pro Destillatio), vychází z pravé strany límce -->
      ${isDestilling ? `<path d="M132 60 Q 155 48 168 32" fill="none" stroke="#5c3d1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M132 60 Q 155 48 168 32" fill="none" stroke="${liq}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <ellipse cx="168" cy="30" rx="7" ry="4" fill="rgba(92,61,26,0.6)" stroke="#5c3d1a" stroke-width="1.2"/>` : ''}

      ${bubbles}
      ${steam}
      ${dust}
      ${isDestilling && pct > 50 ? `<circle cx="168" cy="29" r="2.5" fill="${liq}" opacity="0.8">
        <animate attributeName="r" values="2.5;3.3;2.5" dur="2s" repeatCount="indefinite"/>
      </circle>` : ''}
      ${sparks}

      <!-- kované madlo, levé -->
      <path d="M 49 64 C 28 61, 22 75, 38 77" fill="none" stroke="#1c1005" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M 49 64 C 28 61, 22 75, 38 77" fill="none" stroke="url(#ironLegGrad)" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="49" cy="64" r="2.5" fill="#241508" stroke="#5c3d1a" stroke-width="1"/>
      <circle cx="38" cy="77" r="3" fill="#241508" stroke="#5c3d1a" stroke-width="1"/>

      <!-- kované madlo, pravé -->
      <path d="M 131 64 C 152 61, 158 75, 142 77" fill="none" stroke="#1c1005" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M 131 64 C 152 61, 158 75, 142 77" fill="none" stroke="url(#ironLegGrad)" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="131" cy="64" r="2.5" fill="#241508" stroke="#5c3d1a" stroke-width="1"/>
      <circle cx="142" cy="77" r="3" fill="#241508" stroke="#5c3d1a" stroke-width="1"/>

      <!-- lesk -->
      <ellipse cx="75" cy="68" rx="12" ry="5" fill="rgba(255,255,255,0.06)" transform="rotate(-20 75 68)"/>
    </svg>`;
  },


  // Kategorie pro filtr ingrediencí
  // ingredience-filter-audit-mrd: doplněno 49 ingrediencí, které nikdy nedostaly
  // kategorii (byly viditelné jen pod "Vše") + nová kategorie 'materials' pro
  // živočišné/dřevěné suroviny, které nikam jinam poctivě nezapadají.
  // Smazáno: 'turpentine' (to je combo-výsledek, ne ingredience) a 'pumice'
  // (v AthanorDB.ingredients vůbec neexistuje — mrtvá reference).
  _ingCategories: {
    all: null,
    herbs: ['chamomile', 'st_johns_wort', 'thyme', 'hops', 'rose', 'gentian',
      'comfrey', 'fennel', 'herb_blue', 'hyssop', 'juniper', 'mandrake', 'plantain',
      'poppy', 'rosemary', 'wormwood', 'yarrow', 'vrbova_kura', 'berries', 'theriacum_simplex'],
    pigments: ['lapis_lazuli', 'ochre', 'cinnabar', 'carbon_black', 'egg_tempera', 'linseed_oil', 'malachite',
      'auripigmentum', 'calx_cupri', 'cerusa', 'cinere_stanni', 'ink_gallic', 'lazulium_mellitum',
      'lithargyrum', 'minium', 'ochra_flava', 'palette_membrana', 'sinopia_tosta', 'verdigris_purum', 'verdigris'],
    liquids: ['water', 'wine', 'vinegar', 'ash_water',
      'acetum_destillatum', 'aqua_ardens', 'aqua_fortis', 'spiritus_vini'],
    minerals: ['chalk', 'gum_arabic', 'oak_bark', 'gall_nut', 'sulfur', 'alum', 'vitriol', 'lead', 'copper', 'tin', 'sal_petrae', 'arsenicum',
      'sal_alkali', 'sal_ammoniac', 'sandarak', 'tartarus', 'mercury', 'spodium'],
    brewing: ['grain', 'hops', 'wort', 'honey', 'thyme'],
    materials: ['bone', 'cornu_cervi', 'egg', 'wood', 'stick', 'ash', 'charcoal', 'beeswax', 'propolis', 'bee_bread', 'resin_pine'],
  },

  _activeIngFilter: 'all',
  _stockOnlyFilter: false,

  setIngFilter(cat) {
    AthanorSystem._activeIngFilter = cat;
    AthanorSystem._refreshIngList();
    // Aktualizuj aktivní tlačítko
    document.querySelectorAll('.athanor-filter-btn').forEach(btn => {
      btn.style.background = btn.dataset.cat === cat
        ? 'rgba(200,160,60,0.25)' : 'rgba(0,0,0,0.04)';
      btn.style.color = btn.dataset.cat === cat
        ? 'var(--accent-gold)' : 'var(--ink-primary)';
    });
  },

  toggleStockFilter() {
    AthanorSystem._stockOnlyFilter = !AthanorSystem._stockOnlyFilter;
    AthanorSystem.render('home-athanor-content');
  },

  _refreshIngList() {
    const el = document.getElementById('athanor-ing-list');
    if (el) {
      const state = GameState.athanor;
      const ingMap = {};
      AthanorDB.ingredients.forEach(i => { ingMap[i.id] = i; });
      el.innerHTML = AthanorSystem.buildIngredientListCompact(ingMap, state);
    }
  },

  buildIngFilterBar() {
    const lang = AthanorSystem._lang();
    const filters = [
      { id: 'all', label: 'Vše', label_en: 'All' },
      { id: 'herbs', label: '🌿 Byliny', label_en: '🌿 Herbs' },
      { id: 'pigments', label: '🎨 Pigmenty', label_en: '🎨 Pigments' },
      { id: 'liquids', label: '💧 Tekutiny', label_en: '💧 Liquids' },
      { id: 'minerals', label: '🪨 Minerály', label_en: '🪨 Minerals' },
      { id: 'materials', label: '🦴 Suroviny', label_en: '🦴 Materials' },
      { id: 'brewing', label: '🍺 Pivovar', label_en: '🍺 Brewing' },
    ];
    const active = AthanorSystem._activeIngFilter || 'all';
    const stockOnly = AthanorSystem._stockOnlyFilter;
    return `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px;align-items:center;">
      ${filters.map(f => `<button class="athanor-filter-btn"
        data-cat="${f.id}"
        onclick="AthanorSystem.setIngFilter('${f.id}')"
        style="font-size:0.62rem;padding:2px 7px;border:1px solid rgba(0,0,0,0.15);border-radius:4px;cursor:pointer;
          background:${f.id === active ? 'rgba(200,160,60,0.25)' : 'rgba(0,0,0,0.04)'};
          color:${f.id === active ? 'var(--accent-gold)' : 'var(--ink-primary)'};
          font-family:'Crimson Text';">
        ${lang === 'en' ? f.label_en : f.label}
      </button>`).join('')}
      <span style="width:1px;height:14px;background:rgba(0,0,0,0.15);margin:0 3px;"></span>
      <button onclick="AthanorSystem.toggleStockFilter()"
        style="font-size:0.62rem;padding:2px 7px;border:1px solid rgba(0,0,0,0.15);border-radius:4px;cursor:pointer;
          background:${stockOnly ? 'rgba(200,160,60,0.25)' : 'rgba(0,0,0,0.04)'};
          color:${stockOnly ? 'var(--accent-gold)' : 'var(--ink-primary)'};
          font-family:'Crimson Text';">
        📦 ${lang === 'en' ? 'In stock' : 'Skladem'}
      </button>
    </div>`;
  },

  buildIngredientListCompact(ingMap, state) {
    const isBrewing = !!state.brewing;
    const activeFilter = AthanorSystem._activeIngFilter || 'all';
    const filterIds = AthanorSystem._ingCategories[activeFilter];
    const stockOnly = AthanorSystem._stockOnlyFilter;

    return AthanorDB.ingredients
      .filter(ing => !filterIds || filterIds.includes(ing.id))
      .filter(ing => !stockOnly || (GameState.inventory[ing.id] || 0) > 0)
      .map(ing => {
        const have = GameState.inventory[ing.id] || 0;
        const inSlots = state.slots.filter(s => s === ing.id).length;
        const available = have - inSlots;
        const canAdd = !isBrewing && available > 0 && state.slots.length < AthanorSystem.maxSlots();
        return `<div style="display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:5px;
          border:1px solid ${canAdd ? 'rgba(200,160,60,0.3)' : 'transparent'};
          background:${have === 0 ? 'transparent' : canAdd ? 'rgba(200,160,60,0.04)' : 'rgba(0,0,0,0.03)'};
          opacity:${have === 0 ? '0.3' : '1'};cursor:${canAdd ? 'pointer' : 'default'};"
          ${canAdd ? `onclick="AthanorSystem.addToSlot('${ing.id}')"` : ''}
          title="${(AthanorSystem._lang()==='en' && ing.lore_en ? ing.lore_en : ing.lore) || ''}">
          <span style="font-size:0.9rem;">${ing.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.74rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(AthanorSystem._lang()==='en' && ing.name_en ? ing.name_en : ing.name)}</div>
            <div style="font-size:0.6rem;font-style:italic;opacity:0.5;">${ing.name_lat}</div>
          </div>
          <div style="font-size:0.75rem;font-weight:600;color:${have > 0 ? 'var(--accent-gold)' : '#aaa'};">${available}</div>
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
    if (GameState.flags && GameState.flags.athanorSealedUntil && GameState.flags.athanorSealedUntil > Date.now()) {
      const lang = (GameState.settings && GameState.settings.language) || 'cs';
      const hoursLeft = Math.ceil((GameState.flags.athanorSealedUntil - Date.now()) / 3600000);
      el.innerHTML = `<div style="text-align:center; padding:2rem; opacity:0.75;">
        <div style="font-size:2rem;">🔒</div>
        <div style="margin-top:0.5rem;">${lang === 'en' ? 'The Athanor is sealed.' : 'Athanor je zapečetěný.'}</div>
        <div style="font-size:0.8rem; opacity:0.6; margin-top:0.3rem;">${lang === 'en' ? `Reopens in ~${hoursLeft}h.` : `Otevře se za ~${hoursLeft}h.`}</div>
      </div>`;
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
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;align-items:start;" class="athanor-grid">

          <!-- STŘED: Pracovní stůl (teď 2/3 šířky) -->
          <div style="background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.1);border-radius:8px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:10px;">
            ${AthanorSystem.buildAlembicSvg(state)}
            ${AthanorSystem.buildBrewingProgressHtml()}
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:100%;">
              ${Array.from({ length: AthanorSystem.maxSlots() }, (_, i) => AthanorSystem.buildSlotHtml(i, state, ingMap)).join('')}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
              ${AthanorDB.processes.map(p => AthanorSystem.buildProcessBtn(p, state)).join('')}
            </div>
            <div style="width:100%;">${AthanorSystem.buildStartBtn(state)}</div>
            ${AthanorSystem.buildLastResultHtml(state)}
          </div>

          <!-- PRAVÝ PANEL: Codex (collapsible) -->
          <div style="background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.1);border-radius:8px;padding:10px;">
            <div onclick="AthanorSystem.toggleCodex()" style="font-family:'Cinzel',serif;font-size:0.68rem;letter-spacing:2px;opacity:0.5;text-transform:uppercase;margin-bottom:${AthanorSystem._codexCollapsed ? '0' : '8px'};cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;">
              <span>📜 Codex Athanori</span>
              <span style="font-size:0.9rem;transition:transform 0.2s;transform:rotate(${AthanorSystem._codexCollapsed ? '-90deg' : '0deg'});">▾</span>
            </div>
            ${!AthanorSystem._codexCollapsed ? `
            <span style="font-size:0.62rem;display:block;margin-top:-6px;margin-bottom:6px;opacity:0.5;">${state.discovered.length} / ${Object.keys(AthanorDB.combinations).length} odhaleno</span>
            <div style="max-height:440px;overflow-y:auto;">${AthanorSystem.buildCodexHtml(state)}</div>` : ''}
          </div>

        </div>

        <!-- SPODNÍ PANEL: Ingredience, celá šířka, víc sloupců -->
        <div style="background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.1);border-radius:8px;padding:10px;margin-top:12px;">
          <div style="font-family:'Cinzel',serif;font-size:0.68rem;letter-spacing:2px;opacity:0.5;text-transform:uppercase;margin-bottom:6px;">🌿 Ingredience</div>
          ${AthanorSystem.buildIngFilterBar()}
          <div id="athanor-ing-list" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:5px;" class="athanor-ing-grid">
            ${AthanorSystem.buildIngredientListCompact(ingMap, state)}
          </div>
        </div>
      </div>
      <style>
        @media(max-width:700px){
          .athanor-grid{grid-template-columns:1fr!important}
          .athanor-ing-grid{grid-template-columns:repeat(auto-fill, minmax(110px, 1fr))!important}
        }
      <\/style>
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
          <span style="font-size:0.68rem;margin-top:3px;text-align:center;opacity:0.8;">${(AthanorSystem._lang()==='en' && ing.name_en ? ing.name_en : ing.name)}</span>
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
    const techLocked = process.unlock && !(GameState.researchedTechs && GameState.researchedTechs.includes(process.unlock));
    const needAlembic = process.id === 'destillatio' && !techLocked && (GameState.inventory['alembic'] || 0) <= 0;
    const isLocked = techLocked || needAlembic;
    const lockHint = techLocked ? ' [Zamčeno]' : needAlembic ? ' [Vyžaduje alembik]' : '';

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
        title="${process.desc}${lockHint}"
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

    const stageIcons = ['🌑', '🌕', '🔴'];
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
          <span id="athanor-progress-label" style="color:${stage.textColor};font-family:'Cinzel',serif;font-size:0.8rem;letter-spacing:1px;">
            ${stageIcons[stageIndex]} ${stage.label}
          </span>
          <span id="athanor-progress-remaining" style="font-size:0.75rem;opacity:0.6;">${remaining}s</span>
        </div>
        <div style="font-style:italic;font-size:0.76rem;opacity:0.7;margin-bottom:10px;">
          ${AthanorSystem._lang() === 'en' && stage.desc_en ? stage.desc_en : stage.desc}
        </div>
        <div style="background:rgba(0,0,0,0.3);border-radius:4px;height:6px;overflow:hidden;">
          <div id="athanor-progress-fill" data-stage="${stageIndex}" style="
            width:${pct}%;
            height:100%;
            background:${stage.textColor};
            transition:width 0.5s linear;
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
      const canAdd = !isBrewing && available > 0 && state.slots.length < AthanorSystem.maxSlots();

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
              <div style="font-size:0.78rem;font-weight:600;">${(AthanorSystem._lang()==='en' && ing.name_en ? ing.name_en : ing.name)}</div>
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
        title="${(AthanorSystem._lang()==='en' && ing.lore_en ? ing.lore_en : ing.lore) || ''}">
          <span style="font-size:1rem;">${ing.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.78rem;font-weight:600;">${(AthanorSystem._lang()==='en' && ing.name_en ? ing.name_en : ing.name)}</div>
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

    const lang = AthanorSystem._lang();
    const rows = state.discovered.map(key => {
      const combo = AthanorDB.combinations[key];
      if (!combo) return '';
      const [ingPart, procId] = key.split(':');
      const proc = AthanorDB.processes.find(p => p.id === procId);
      const dispName = (lang === 'en' && combo.name_en) ? combo.name_en : combo.name;
      const dispLore = (lang === 'en' && combo.lore_en) ? combo.lore_en : combo.lore;
      const procLabel = proc ? (lang === 'en' ? proc.name : proc.name_cs) : '';
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
            <strong style="font-size:0.88rem;">${dispName}</strong>
            <span style="font-style:italic;font-size:0.72rem;opacity:0.5;">${combo.name_lat}</span>
            <span style="margin-left:auto;font-size:0.72rem;opacity:0.5;">${proc ? proc.icon + ' ' + procLabel : ''}</span>
          </div>
          <div style="font-size:0.74rem;opacity:0.6;font-style:italic;">${dispLore}</div>
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
      animation:athanorResultOverlayIn 0.25s ease-out;
    `;
    const boxAnim = !isSuccess ? 'athanorResultShake 0.4s ease-out'
      : (result.isCritical ? 'athanorResultCriticalIn 0.5s cubic-bezier(0.34,1.56,0.64,1)'
        : 'athanorResultBoxIn 0.35s cubic-bezier(0.34,1.56,0.64,1)');
    modal.innerHTML = `
      <style>
        @keyframes athanorResultOverlayIn { from{opacity:0} to{opacity:1} }
        @keyframes athanorResultBoxIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes athanorResultCriticalIn {
          0%{opacity:0;transform:scale(0.85);filter:drop-shadow(0 0 0 rgba(232,196,74,0))}
          60%{opacity:1;transform:scale(1.04);filter:drop-shadow(0 0 22px rgba(232,196,74,0.7))}
          100%{opacity:1;transform:scale(1);filter:drop-shadow(0 0 10px rgba(232,196,74,0.35))}
        }
        @keyframes athanorResultShake {
          0%{opacity:0;transform:scale(0.95) translateX(0)}
          25%{opacity:1;transform:scale(1) translateX(-6px)}
          50%{transform:scale(1) translateX(5px)}
          75%{transform:scale(1) translateX(-3px)}
          100%{transform:scale(1) translateX(0)}
        }
      <\/style>
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
        animation:${boxAnim};
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
