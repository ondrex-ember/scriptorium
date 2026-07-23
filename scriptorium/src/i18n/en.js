// Scriptorium i18n — English (Olde)
// Základ: STRINGS_cs. Chybějící klíče → fallback na CS automaticky.

const STRINGS_en = {
    nav: { home: 'Workshop', garden: 'Garden', craft: 'Craft', inv: 'Penum', lore: 'Scriptorium', library: 'Library' },
    screens: { home: 'Officina', garden: 'The Garden', craft: 'Crafting', inv: 'Penum', lore: 'Scriptorium', library: 'The Library', settings: 'Settings', scavenge: 'Scavenge', mine: 'Mine' },
    header: { weatherNow: 'Presently in Prague (click to refresh)', weatherTomorrow: 'Morrow\'s forecast', hunger: 'Hunger', streak: 'Daily Streak', research: 'Knowledge Gathered', settings: 'Settings' },
    // ------------------------------
    fireplace: {
        cold: 'The Hearth Lies Cold', coldDesc: 'A bitter chill claimeth the chamber.', kindle: 'KINDLE',
        lit: 'The Hearth Burns', litDesc: 'Warmth and light fill the scriptorium.',
        diedOutShort: 'The hearth has died out', diedOut: '❄️ The fire has died out.',
        full: 'The hearth is full!', fuelAdded: 'Fuel added.',
        notEnough: 'Not enough {item}.',
        foculusTab: 'Foculus', foculusLocked: "Study Meteorologica to manage the hearth's fuel.",
        statusLabel: 'Fire status:',
        burnNow: 'dying out', burnSoon: 'burning out soon',
        burnToday: 'burns out today {part}', burnTomorrow: 'burns out tomorrow {part}',
        partMorning: 'in the morning', partAfternoon: 'in the afternoon', partEvening: 'in the evening', partNight: 'at night',
        dashTitle: 'Workshop status', dashWeather: 'Weather', dashWeatherNA: '—', dashEnviron: 'Environment',
        dashStav: 'Status', dashTime: 'Time & Calendar', dashForecast: 'Forecast',
        dashNotes: 'Notes', dashCoins: 'Coins', dashRank: 'Rank', dashTech: 'Techs', dashKronika: 'Latest chronicle',
        dashTimeLabel: 'Time', dashDate: 'Date', dashMoon: 'Moon', dashHora: 'Hour',
        teaTitle: 'Tea', teaBrew: 'Brew tea', teaDrink: 'DRINK TEA', teaBrewing: 'Brewing… {s} s',
        teaNeedKettle: 'You need a Kettle (craft it)', teaNeedFire: 'Light the fire', teaNeedHerb: 'No herb (chamomile, thyme, linden)', teaNeedWater: 'No water',
        coffeeTitle: 'Coffee Substitute — Acorn Brew & Chicory Coffee', coffeeBrew: 'Brew coffee substitute', coffeeDrink: 'DRINK COFFEE SUBSTITUTE', coffeeBrewing: 'Brewing… {s} s',
        coffeeNeedKettle: 'You need a Kettle (craft it)', coffeeNeedFire: 'Light the fire', coffeeNeedHerb: 'No roasted ingredient (acorn, chicory)', coffeeNeedWater: 'No water',
        sweepReady: '🧹 Sweep the hearth (+4 ash)', sweepWait: '🧹 Sweep — in {h} h',
        sweepDone: 'Swept. +{n} ash, +4 soot.', sweepNeedFire: 'Light the fire first.', sweepCooldown: 'The hearth was swept recently.',
        incenseTitle: 'Incense (Thuribulum)',
        incenseBurn: 'Ignite',
        incenseExtinguish: 'Extinguish',
        incenseBurnedOut: 'The incense has burned out. The fragrance fades.',
        incenseExtinguished: 'The incense was extinguished early.',
        incenseEmpty: 'You have no incense in stock.',
        incenseBurning: 'Burning: {name} ({s} s)',
        incenseLocked: 'Study Thuribulum to burn incense.'
    },
    light: {
        none: 'No Light', noneDesc: 'Darkness claimeth this place.',
        candle: 'Candle (Burning)', torch: 'Torch (Crackling)',
        candleDesc: 'A small but steady flame.',
        torchDesc: 'It smokes and crackles, yet burns bright.',
        btnTorch: 'LIGHT TORCH', btnCandle: 'LIGHT CANDLE'
    },
    craft: { filterAll: 'All', filterTool: 'Tools', filterMat: 'Materials', filterFood: 'Provisions', filterAlchemy: 'Alchemy', filterLore: 'Knowledge', btn: 'Craft', repair: 'Repair' },
    inv: { filterAll: 'All', filterMat: 'Materials', filterTool: 'Tools', filterLore: 'Other' },
    settings: { langLabel: '🗺️ Language / Jazyk' },
    wellUI: {
        title: '🚰 The Well',
        notBuilt: 'Thou hast no well. Thou mayest construct one below.',
        buildBasic: '🏗️ Construct Well (20 rock, 10 branch, 3 rope)',
        level: 'Tier:',
        condition: 'Condition:',
        clean: '✨ Purify (powder)',
        repair: '🔧 Repair (kit)',
        upgrade: '🏛️ Fortify with Stone (30 rock, 5 rope, 10 charcoal)',
        levelBasic: 'Basic',
        levelStone: 'Stone',
        levelBlessed: 'Blessed',
        levelUnknown: 'Unknown',
        condClean: '✓ Pure',
        condDirty: '⚠️ Fouled',
        condBroken: '💥 Broken',
        purity: 'Water quality:',
        waterLevel: 'Water level:',
        frozen: 'Frozen',
        consumers: 'Water usage:',
        bandAlive: 'alive',
        bandMurky: 'murky',
        bandClogged: 'clogged',
        bandDead: 'dead',
        yieldNow: 'Yield per draw:',
        yieldBase: 'base',
        graceLeft: 'Fresh water — protected for {n} more days',
        forecast: 'Forecast (7 days): {dry} dry, {rainy} rainy',
        statsUses: 'Drawn {uses}× · cleaned {cleans}×',
        levelBandEmpty: 'parched',
        levelBandLow: 'low',
        levelBandModerate: 'moderate',
        levelBandGood: 'good',
        levelBandFull: 'full',
        levelYieldInfo: 'Water level: {band} → yield ×{mod}',
        levelYieldInfoFixed: 'Water level: {band} → yield only {amt} (minimum)'
    },
    settingsUI: {
        musicTitle: '🎵 Music',
        musicEnabled: 'Enable music',
        musicVolumeDesc: 'Volume of the generative music',
        musicTrack: 'Track',
        musicTier1: '🏛️ Sacral Cathedral',
        musicTier2: '🏰 Abyssal Keep',
        musicTier3: '🎻 Ars Nova',
        volume: 'Volume',
        fireVolume: '🔥 Hearth Volume',
        fireVolumeDesc: 'Controls only the sound of the burning hearth',
        theme: '🎨 Theme',
        themeClassic: 'Classic Parchment',
        themeDark: 'Dark Mode 🌙',
        themeNight: 'Night Mode 🌑',
        themeSunlight: 'Sunlight Mode ☀️',
        themeSpring: 'Spring 🌸',
        themeSummer: 'Summer ☀️',
        themeAutumn: 'Autumn 🍂',
        themeWinter: 'Winter ❄️',
        themeAuto: 'Auto (Weather) 🌦️',
        themeAutoDesc: 'The theme shall adapt to the present weather in Prague.',
        reset: 'Reset',
        resetDesc: 'Erase thy progress.',
        resetBtn: 'Erase',
        backup: '💾 Safekeeping',
        backupDesc: 'Export thy progress for safekeeping or another device.',
        downloadSave: '📥 Download Save',
        uploadSave: '📤 Upload Save',
        resetGame: '🗑️ Reset Game',
        backupWarning: '⚠️ We urge thee to secure a backup ere making grave changes!',
        lastSaveLabel: 'Last saved:',
        about: 'About',
        aboutDesc: 'Version, changelog and credits',
        showBtn: 'View',
        footerMadeIn: 'Forged with ❤️ in Nový Bor by Ondrex',
        hourChime: {
            title: 'Hour Chime Sound',
            basicEnabled: 'Enabled (basic sound)',
            mode: 'Mode',
            modeAuto: 'Follow canonical hours',
            modeCustom: 'Custom selection',
            sound: 'Sound',

            // Bell names
            cink: 'Cink (basic)',
            sanctus: 'Sanctus (high)',
            avemaria: 'Ave Maria (medium)',
            compline: 'Compline (deep)',
            deathknell: 'Death Knell (dark)',
            off: 'Disabled',

            // Quiet hours
            quietTitle: 'Quiet Hours',
            quietEnabled: 'Enabled',
            quietFrom: 'From',
            quietTo: 'To',
            quietNote: 'Sounds will be muted during this time'
        }
    },
    actions: {
        hunt: 'Hunt', bark: 'Cut',
        basic: 'Explore', wetlands: 'Explore',
        nature: 'Gather', foraging: 'Gather', resin_harvest: 'Gather',
        fishing: 'Fish',
        well_water: 'Draw',
        grass_gather: 'Mow',
        wood_harvest: 'Chop',
        worms_dig: 'Dig', dig_clay: 'Dig',
        yard_cleanup: 'Clean',
        default: 'Search',
        cancel: 'CANCEL', claim: 'COLLECT',
        quick: 'Quick!', quickDesc: 'Gather by hand',
        done: 'Done!', waiting: 'Waiting...', remaining: 'Remaining:',
        instantly: 'Instantly!'
    },
    titivillus: [
        '👿 Titivillus hath visited. A note hath vanished.',
        '👿 "Scripsi totum..." — yet Titivillus claimed the fruit of thy labor.',
        '👿 The ink runs thin. A letter hath slipped into his sack.',
        '👿 Titivillus gathers errors for the Devil. Today he took thine.',
        '👿 "Est mihi causa mali..." Thy blunder, his gain.'
    ],
    game: {
        eat: 'Eat', drink: 'Drink', required: '(Required)', needTool: 'Missing tool:',
        techDone: 'DONE', techStudy: 'Study', techRequired: 'Required:',
        noTinderbox: 'Thou hast no tinderbox!',
        fireKindled: 'The hearth is kindled.',
        needFire: 'The hearth must burn first!',
        plotLocked: 'Locked! (Tech required)',
        needHoe: 'A hoe is needed!',
        needFertilizer: 'Fertilizer is needed!',
        needSeeds: 'Seeds are needed!',
        needWater: 'Water is needed!',
        watered: '💧 The plot has been watered.',
        wateredSpring: '💧 The plot has been watered with spring water.',
        growing: 'Growing...',
        needWell: '❌ Thou must first build a well in Crafting!',
        fallowCropOnly: '❌ The fallow slot accepts only fallow crops (vetch).',
        frozenHands: 'Thy hands are too cold to work!',
        missingMats: 'Materials are wanting!',
        notEnoughResearch: 'More study is needed!',
        notFood: 'That cannot be eaten!',
        crafted: 'Mastered:',
        noFood: 'Thou hast none!',
        busy: 'Already occupied!',
        quickScavenge: 'Quick gather!',
        rareFind: '⭐ Rare find: Netolický\'s bitter legacy!',
        vigor: {
            exhausted:    '😵 The scribe is utterly exhausted. Find food before continuing.',
            researchBlock: '⚠️ Research requires Vigor ≥ 20. Eat something first.',
            deficiens:    '⚠️ Vigor deficiens. Only light tasks available.',
            insufficient: '😔 Not enough strength for this task.',
            tooTiredHeavy:'😵 Too exhausted for this task. Eat something first. (Vigor < 25)',
            tooTiredLight:'😔 Too tired for crafting. Rest or eat first. (Vigor < 10)',
        },
        candleBurnedOut: 'The candle hath burned out.',
        hungry: '⚠️ Hunger claimeth thee!',
        saveExported: '💾 Save exported!',
        saveExportFail: '❌ Export failed!',
        saveImported: '✅ Save imported! Reloading...',
        saveImportFail: '❌ Invalid save file!',
        waterDrawn: '🚰 +{amt} {item}',
        needItemAmt: '❌ Thou needest {amt}x {item}!',
        missingItem: 'Thou lackest {item}!',
        itemIgnited: '{item} kindled.',
        fed: 'Nourished for {hours}h{bonus}',
        itemAdded: '+{qty} {item}',
        saveExportedFile: '💾 Save exported: {file}',
        overwriteSave: '⚠️ WARNING: This shall overwrite thy current progress!\n\nDost thou wish to proceed?',
        confirmReset: 'Dost thou truly wish to cast thy progress into the void and start anew?',
        newCodexEntry: '📖 A new record in thy Codex!',
        errorImport: '❌ An error occurred during import!',
        errorRead: '❌ The file could not be read!',
        successImport: '✅ Save imported! Refreshing to be certain.',
        // v8.x — Orchard & Apiary notifications
        treePlanted: '🌱 The sapling is set in earth.',
        treeHarvested: '🍎 Harvest complete — {qty} gathered.',
        treeFelled: '🪓 The tree is felled. +{qty} branches.',
        hiveBuilt: '🪹 The hive stands ready.',
        queenAdded: '🐝 The queen is housed. The colony shall grow.',
        hiveCollected: '🍯 Collected: honey and wax.',
        noSeedSelected: '❌ Choose a seed first!',
        noSeeds: '❌ Thou hast no such seed!',
        slotOccupied: '❌ This slot is already taken!',
        needWood: '❌ Ten branches are needed!',
        needRope: '❌ Five ropes are needed!',
        needQueen: '❌ Thou hast no queen bee! (Buy at the Market)',
        hiveNotReady: '⏳ The bees still labour.',
        penNotReady: '⏳ Nothing ready to collect yet.',
        // v8.x — Farmyard notifications
        hennhouseBuilt: 'The henhouse stands ready.',
        sheepfoldBuilt: 'The sheepfold is built.',
        henAdded: 'Hen added to the flock.',
        sheepAdded: 'Sheep added to the fold.',
        roosterAlready: 'A rooster already guards the henhouse!',
        hennsFull: 'The henhouse is full (10 hens)!',
        sheepFull: 'The sheepfold is full (6 sheep)!',
        needRooster: 'A rooster is needed! (buy at the Market)',
        needHen: 'Thou hast no such hen!',
        needSheep: 'Thou hast no sheep! (buy at the Market)',
        needDeReRustica: 'Unlock the De Re Rustica technology first!',
        needDePiscibus: 'Unlock the De Piscibus technology first!',
        piscinaBuilt: 'Pond tier {tier} constructed.',
        piscinaAlready: 'This pond already exists!',
        piscinaTierOrder: 'Build the previous tier first!',
        needPiscina1: 'Build the breeding pond first!',
        noFry: 'Thou hast no fry! (wetlands or Market)',
        fryAdded: '{qty} fry added.',
        piscinaEmpty: 'The pond is empty!',
        needFeedFish: 'Grass (fiber) is needed',
        piscinaFed: 'The fish are fed.',
        noCarp: 'No adult carp yet!',
        carpHarvested: '{qty} carp harvested.',
        noFryPending: 'No fry ready to transfer!',
        fryTransferred: '{qty} fry moved to the breeding pond.',
        nestingStarted: 'The hen settles upon her eggs.',
        nestingActive: 'Nesting is already underway!',
        nestingReq: 'A rooster and at least one hen are needed.',
        breedingStarted: 'Lamb rearing has begun.',
        breedingActive: 'Breeding is already underway!',
        breedingReq: 'At least two sheep are needed.',
        hennouseCollected: 'Collected from the henhouse.',
        hennouseNotReady: '⏳ No eggs or feathers ready yet.',
        sheepCollected: 'Collected from the sheepfold.',
        slaughtered: '{qty} chicks slaughtered.',
        henSlaughtered: 'The hen is slaughtered.',
        lambSlaughtered: '{qty} lambs slaughtered.',
        sheepSlaughtered: 'The sheep is slaughtered.',
        noChicks: 'No chicks ready for slaughter!',
        noLambs: 'No lambs ready for slaughter!',
        needFeedHen: 'You need feed',
        needFeedSheep: 'Grass is needed',
        henFed: 'Hens fed with grain. 🌾',
        henFedSeeds: 'Hens fed with seeds (emergency — 1/4 portion).',
        seeds: 'seeds',
        sheepFed: 'The sheep are fed and watered.',
        needStone: '❌ Stone is needed',
        wellTurningGreen: '⚠️ The well is turning green — water is contaminated.',
        wellCollapsed: '💥 The well has collapsed!',
        wellClouding: 'The well water is beginning to cloud. It will need cleaning soon.',
        wellClogged: 'The well is clogged. Clean it before the water runs out.',
        wellFrozen: '❄️ The well has frozen — water cannot be drawn.',
        wellNeedStone: 'First line the well with stone.',
        wellBlessed: '✨ The well has been blessed — holy water, nearly maintenance-free.',
        wellNoWell: '❌ Build a well first.',
        wellBroken: '💥 The well has collapsed — repair it first.',
        wellBuilt: '🪣 Well built.',
        wellCleaned: '🪣 Well cleaned.',
        wellRepaired: '🪣 Well repaired.',
        wellUpgraded: '🪣 Well upgraded.',
        wellNotDirty: '⚠️ The well is not contaminated.',
        wellNotBroken: '⚠️ The well is not collapsed.',
        wellNoPowder: '❌ No purification powder.',
        wellNoKit: '❌ No repair kit.',
        wellNeedBasic: '❌ Build a basic well first.',
        wellAlreadyBuilt: '⚠️ A well already stands here.',
        wellHolyWater: '✨ The well yielded holy water!',
        wellMurky: 'The water is murky.',
        waterSickness: '🤢 Something about that water was not right...',
        done: "Done!",
        interrupted: "Interrupted.",
        scavengeResult: "{msg} +{total} pcs.",
        scavengeNothing: "{msg} They found nothing."
    },
    notify: {
        langSwitched: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Language set to English.',
        kindleHint: '🔥 Kindle the hearth — drive out the cold.'
    },
    langPicker: {
        heading: 'Scriptorium',
        sub: 'Anno Domini 1465 · Olomouc',
        prompt: 'Choose thy tongue',
        btnCs: '🇨🇿 Česky',
        btnEn: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 English'
    },
    consent: {
        text: '📜 <strong>Scriptorium doth employ Google Analytics</strong> to measure thy progress through the craft — which arts thou dost master, how long thou remainest at the desk. No personal tidings are shared.',
        moreInfo: 'Learn more',
        grant: 'I consent',
        deny: 'I refuse',
        policyTitle: 'Scriptorium Analytics — what we observe:',
        policyBody: '• Thy progress (unlocked arts, achievements)\n• Session length and return visits\n• Which parts of the scriptorium thou dost frequent\n\nWhat we do NOT observe:\n• No personal data\n• IP addresses are anonymised\n• Naught is shared beyond Google Analytics\n\nConsent may be revoked by removing the localStorage key "scriptorium_consent".'
    },
    welcome: {
        text: 'Thou hast found an abandoned workshop.<br><br>Upon the desk: a cold tinderbox, a shard of flint, a few sheets of parchment thick with dust. Through the shutter comes a steady knocking — someone in the next street works a new machine. They call it a <em>printing press</em>.<br><br>That is outside. In here there is only dark and cold.<br><br><strong style="font-size:1.1em;">❄️ Thy fingers grow stiff with cold and yet work awaits.<br>The hearth must be kindled.</strong><br><br><span style="font-size:0.9em; opacity:0.8;">👉 Click <strong>Kindle</strong> in the Workshop to begin.</span>',
        btn: 'Enter →',
        aboutLink: 'About & Credits →'
    },
    about: {
        version: 'Version:', date: 'Date:', dateVal: '10 June 2026', author: 'Author:',
        aboutTitle: 'About the Game',
        aboutText: 'A medieval idle game about copying manuscripts, crafting paper, and studying in a monastery scriptorium. Blends survival mechanics (fire, light, hunger) with crafting, gardening, and gradual technology unlocks. Historically grounded, set in the year 1465 in Olomouc.',
        r791: 'Tools — stone and iron with wear, degradation and repair',
        r792: 'Fabrica — iron ingots, tools and repairs from raw materials',
        r793: 'Storage — Almarium / Cella / Horreum with growing inventory capacity',
        r794: 'Farmyard — Ovile (wool, milk, hides, lambs) and Piscina (carp pond)',
        r795: 'Monastery Tidings — toast / panel / modal notification system',
        r796: 'Tidings — 26 historical letters in five voices',
        r797: 'Mobile pills — compact info bar in the header for mobile',
        r798: 'Calendarium — lunar calendar with Christian feasts, Anno Domini 1465',
        r799: 'Fixes: study() crash, music off by default, repair buttons, duplicates',
        r779: 'Dynamic bg header changes by season, time of day and weather',
        r780: 'Athanor 2.0 — CombEngine, brewing, Nig/Alb/Rub phases, discovery log',
        r781: 'Cellarium — Tavern with beer and wine (effects: Lupulin, In vino veritas)',
        r778: 'Curia (Farmyard) — Well moved to Dvůr tab, structure prepared',
        r775: 'about.html — hero section with image, GTM, JSON-LD VideoGame schema',
        r776: 'Fixes: PWA padding, garden tab active state, ui fixes',
        r777: '...And many many more :)',
        r771: 'i18n Phase 1 complete — full UI translation into English',
        r772: '61 historical books in the library',
        r773: 'Collapsible tech cards — lore preview, expandable detail',
        r774: 'Well system — fully translated and localised',
        fullChangelog: '📜 Full changelog & Credits →'
    },
    fireout: {
        heading: 'The Workshop Lies Cold',
        btn: 'Seek the flame →',
        absence: 'Away for:',
        texts: [
            'The ash in the hearth is cold. Utterly cold.<br><br>It took thee time — yet thou art returned. The workshop waits as thou didst leave it. Parchment on the desk. Ink congealed. Quill dry.<br><br>Only the fire needeth to be kindled anew.',
            'Thou hast been away {days} {dayWord}.<br><br>The scriptorium is silent and cold. The candle burned out, the torch long spent. Yet the manuscripts remain. Parchment waiteth more patiently than men.<br><br>The desk is ready. Only warmth is wanting.',
            'Three days gone. Perhaps more.<br><br>The abbot would say: <em>"Acedia — sloth of spirit — is the scribe\'s true enemy."</em> Yet thou art here now. And that doth count for something.<br><br>Strike the tinder. Begin where thou left off.'
        ],
        dayWord: { one: 'day', few: 'days', many: 'days' }
    },
    meta: {
        title: 'Scriptorium — Medieval Monastery Idle Game',
        desc: 'A medieval idle game set in a monastery scriptorium. Copy manuscripts, tend thy garden, and unlock the secrets of parchment and ink.',
        ogLocale: 'en_US'

    },
    lore: {
        tabResearch: 'Research',
        tabCodex: 'Codex',
        tabNotebooks: '📓 Notebooks',
        tabAchievements: 'Achievements',
        notes: 'Notes:',
        discovered: 'Discovered:',
        notebooks_empty: 'Thou hast no notebooks as yet',
        notebooks_hint: 'Unlock the "Basics of Writing" tech (3 research) and craft thy first Tabula!',
        darkTitle: 'Darkness Claimeth This Place',
        darkDesc: 'Light a Torch or Candle in the Workshop.',
        darkness: 'Darkness claimeth this place',
        darkness_hint: 'Light a Torch or Candle in the Workshop.'
    },
    library: {
        tabBooks: '📚 Books',
        tabRecords: '🏅 Records',
        tabGames: '🎲 Aula Ludi',
        tabIching: '☯️ Divination',
        tabNews: '📜 Tidings',
        tabKronika: '📖 Chronicle',
        locked: 'Locked',
        divination_hint: 'Unlock the "Ancient Wisdom" tech to access divination.',
        records_hint: 'Unlock the "Games and Records" tech to access mini-games and statistics.',
        iching_title: '☯️ I-Ching (Book of Changes)',
        iching_need_book: 'Thou lackest the Book of Changes',
        iching_craft_hint: 'Craft it within the Crafting → Knowledge section.',
    },
    kronika: {
        title: 'Chronicle',
        locked: 'The Chronicle is not yet available.',
        lockedHint: 'Unlock the Ars Chronicae tech in the Scriptorium.',
        empty: 'No entries yet.',
        langCs: 'Česky',
        langEn: 'English',
        langLa: 'Latine',
        prev: '← Previous',
        next: 'Next →',
        pageOf: 'Page {cur} of {total}',
        filterAll:       'All',
        filterLocal:     'Local',
        filterChronicon: '☩ Chronicon',
        chroniconSrc: {
            local_events:       'Local rumours',
            distant_events:     'From afar',
            monastery_internal: 'Monastery',
            engine:             'World',
            gm:                 'From the Abbot',
        },
    },

    library_lore: {
        new_book: "📚 A new tome hath arrived! ({count})",
        lib_title: "The Library",
        lib_unlocked: "unlocked",
        lib_read: "Perused",
        lib_not_avail: "The Library is shut unto thee.",
        lib_unlocks_in: "Unlocks in",
        lib_days: "days",
        desc: 'For 3x Paper, I shall reveal one book unto thee prematurely...',
        btn_read: "Read",
        btn_read_again: "Read Anew",
        categories: {
            history: "History of the Press",
            innovation: "Innovations",
            conflict: "Conflicts",
            local: "Prague & Bohemia",
            viticis: "Viticulture"
        },
        npc_scribe: {
            name: "Master Bartholomew, The Elder Scribe",
            first_visit_text: "*An aged man, his fingers forever stained by the black gall ink, slowly lifteth his gaze from his pulpit. A heavy, ancient scent of parchment and beeswax hangs in the air.*\n\n\"Ah... I hear thy steps. Another of those so-called 'printers', eh? Another who, in his unholy pride, thinketh a mechanical press can replace a human soul. I remember the days, lad, when books were penned by hand... Hast thou even the patience to listen to an old man?\"",
            opt_yes: "Aye, Master. Speak on!",
            opt_no: "Perchance later. The presses wait for no man.",
            trade_text: "*The scribe gazeth upon thee intently.*\n\n\"Naught in this world is freely given. Neither words, nor time. A tale for a tale, I say. Bring unto me three blank sheets of thy vaunted printer's paper — and in return, I shall show thee how true truth is written upon them...\"",
            opt_trade: "Trade (3x Paper)",
            opt_trade_no: "Nay, I thank thee. Paper is costly.",
            after_trade: "*The old scribe taketh thy paper with a trembling hand. He gently stroketh it with his fingertips...*\n\n\"It is so... incredibly smooth. Yet utterly bereft of a soul. Take this old, worn tome. I have guarded it long and in secret.\"",
            opt_thanks: "I thank thee for thy priceless wisdom, Master.",
            err_paper: "Thou lackest sufficient paper!",
            scribe_short: '"For 3x Paper, I shall reveal one tome unto thee prematurely..."',
            notify_book: "📖 The scribe hath bestowed a book upon thee:",
            notify_empty: "Scribe: \"Thou knowest all the tales already...\""
        },
        easter_eggs: {
            faust_name: "Faust's Pact with the Shadows",
            faust_desc: "Barter thy time. Gather and hold exactly 666 points of research.",
            complete_name: "The Absolute Bibliophile",
            complete_desc: "Read every single page of every available book in the Great Library.",
            scholar_name: "Master of Prague's Alleys",
            scholar_desc: "Unravel all mysteries by reading every tome in the Prague & Bohemia category.",
            netolicky_name: "Netolický's Bitter Legacy",
            netolicky_desc: "An ancient, half-burnt parchment, found beneath the floorboards of the old press.",
            netolicky_lore: "As thou dost break the old, hardened wax seal, the musty scent of the sixteenth century greets thee...\n\n\"Brother Bartholomew Netolický! For God's sake, come to thy senses! This dismal day is thine absolutely final chance...\"",
            notify_found: "🎉 Secret Found: {name}! A hidden tome hath been unlocked!"
        },
        books: {
            book_gutenberg_betrayal: {
                title: "The Mainz Betrayal: A Bloody Dawn of Print",
                author: "Anonymous Chronicler",
                content: `**A Loan from a Moneylender and a Bitter End**

Johannes Gutenberg was beyond doubt a visionary who changed the course of history, but he was a man without a penny to his name. To realise his secret project, he borrowed the astronomical sum of 1,600 guilders from a Mainz lawyer and wealthy merchant, Johann Fust. As security he offered the only thing he possessed — he pledged everything: his workshop, his innovative presses, and the famous forty-two-line Bible he was printing with such immense effort.

**The Helmasperger Notarial Instrument (6 November 1455)**

Just before the Bible could be completed and begin earning money, Fust struck hard. Driven by the prospect of profit, he accused Gutenberg of having "not eaten the money in books" but of having embezzled it for other purposes. The ensuing trial was merciless and ruled in Fust's favour. Overnight, Gutenberg lost everything — his presses, his carefully cast metal type, and his precious paper.

**Who Was the Judas of the Printing Arts?**

History points its finger at Peter Schöffer! He was Gutenberg's most talented journeyman, originally a skilled scribe from Paris. It was he who coolly testified against his own master in court! The reward was not long in coming — Fust took the sharp-witted Schöffer as his business partner and, to seal the alliance, later gave him his own daughter Christina in marriage. Gutenberg's life's work and workshop thus passed smoothly into the new, predatory firm of Fust & Schöffer. Shortly thereafter, in 1459, this powerful pair published the celebrated *Rationale Divinorum Officiorum*.

**The Dark Legend of Doctor Faustus**

Johann Fust was an extraordinarily successful merchant. He flooded the market with books and printed so quickly — hundreds of perfectly identical, flawless copies — that the superstitious and illiterate populace began to whisper dark rumours: this man must have sold his soul to the devil himself. From these whispers sprang the terrifying legend of Doctor Faustus (born of the confusion between the names Fust and Faust), which centuries later the German poet Goethe made immortal. This wholly new technology of printing was, in the eyes of the illiterate masses of the day, simply pure, black magic.

*"He who betrays his master gains an empire but loses his soul. In the ink there is always a trace of blood." — An old chronicle*`
            },
            book_jenson_spy: {
                title: "The Spy Who Never Returned: Jenson's Secret",
                author: "Royal Chronicles & Secret Archives",
                content: `**A Secret Mission to the Heart of the Holy Roman Empire (1458)**

The French king Charles VII heard incredible rumours of "the miracle at Mainz". Fascinated, he dispatched in 1458 his finest engraver of coins, Nicolas Jenson, on a strictly secret espionage mission to Germany. The king's order was clear: *"Learn this new art, discover how it is done, and bring the secret home, for the glory of France!"*

**The Defection of the Master Engraver**

Jenson duly arrived in Mainz and mastered the revolutionary technology of printing in every detail. He discovered something fundamental, however — printing offered him a freedom that the anxious royal court would never provide. He never returned to his king. After years of silence, in 1470 he emerged triumphantly in Venice, the free commercial heart of the age. There he founded his own prospering press and created the typeface known as **Antiqua**. Jenson is today widely acknowledged as the true father of the Roman type.

**The Birth of Modern Typography**

One of the first books he published in Venice in 1470 was the celebrated work of Eusebius, *De evangelica præparatione*. Jenson's design was wholly revolutionary: the typeface was not a slavish copy of old manuscript models but was founded on entirely new typographical principles. Flowing forms and discreet serifs helped the eye to glide across the page. It was a typeface so timeless and perfect that its principles are used to this day — even the celebrated font Times New Roman draws directly from it in spirit.

**Venetian Asylum**

In the liberal republic of Venice, Jenson was immediately regarded as an absolute star. The king in Paris raged and hatched plans for revenge, but could do nothing whatever. The proud Italian city-states jealously protected their artists and master craftsmen from any outside interference. Nicolas Jenson died wealthy, honoured, and celebrated to the last day of his life. His brilliant typeface has outlasted him by five centuries.

*"The king sends a spy in the shackles of duty, but the beauty of art shall set him free." — A Venetian proverb*`
            },
            book_manutius: {
                title: "The Smartphones of the Renaissance: Aldus Manutius",
                author: "Venetian Trade Register",
                content: `**Aldus Manutius — The Steve Jobs of His Age**

This Venetian printer and humanist (1449–1515), who in 1494 founded the celebrated Aldine Press, was a true visionary who changed for ever the way people consumed the written word. Before him, books — the so-called incunabula — were enormous, heavy, unwieldy folios that had to lie on a massive library table. Manutius, however, devised a revolutionary octavo format called the **enchiridion** (handbook): small books, the direct ancestors of today's paperbacks, which slipped easily into a saddlebag or the folds of a travelling cloak.

**The Mobility of Knowledge and the Purity of the Text**

Suddenly nobles and merchants could read even on long journeys. Students could purchase Aristotle or Homer for the price of an ordinary supper. Overnight, books ceased to be pieces of inviolable furniture and became accessible personal companions of daily life. Manutius was moreover obsessed with accuracy. He wished to publish classical Greek texts in their original, pure form, uncorrupted by centuries of faulty translation. To that end he collaborated with the leading scholars of his day, including the celebrated Erasmus of Rotterdam.

**The Invention of Italic Type**

To fit as much text as possible into a small, inexpensive book and to economise on costly paper, Manutius engaged the brilliant punch-cutter Francesco Griffo. Griffo created an entirely new typeface, modelled on the elegant but economical slanted handwriting of Renaissance officials and humanists — **italic**. This was not originally intended for emphasis, as we use it today, but purely for the economic saving of paper. Their edition of Virgil's *Opera* in 1501 was the very first book in the world to be printed in this new, economical script.

**The Dolphin and the Anchor**

His unmistakable printer's device was a lithe dolphin (symbolising speed and constant innovation) wound about a firm anchor (symbolising stability, reliability and care). His lifelong motto ran: **Festina Lente** — Make haste slowly. Manutius proved to the whole world that books need not be locked treasures in coffers but active instruments in the hands of people.

*"A small book in the hand is mightier than a great one upon the table. Freedom of thought lies in the pocket."*`
            },
            book_scribes_war: {
                title: "The War of Scribes: The Virgin and the Harlot",
                author: "Filippo de Strata & Johannes Trithemius",
                content: `**"The Pen is a Virgin, the Press a Harlot"**

Not everyone greeted the invention of the printing press with open arms. Filippo de Strata, a Venetian monk and professional scribe, became the radical voice of resistance. Sometime between 1473 and 1474 he composed a desperate and fiery polemic addressed to the then Doge of Venice, Nicolò Marcello, imploring him to have the printing presses banished from the city for good. In his text he proclaimed, among other things, without compromise:

*"The pen is a pure virgin, the press a venal harlot! Printers are procurers who flood the market, print love poetry and teach young girls to read Ovid only that they may learn sin and vice. These printers guzzle wine, carousing in taverns, and for a handful of coins sell the sanctity of the text!"*

The wealthy city, in his view, was choked with books but had utterly and irretrievably lost its soul.

**The Trithemian Paradox (1492)**

On the other side of Europe, the eminent Abbot Johannes Trithemius entered the cultural fray. In 1492 he composed the now legendary work **De Laude Scriptorum** (In Praise of Scribes). In it he passionately urged his monks on no account to cease copying texts by hand, citing the incontestable quality of the material:

*"A printed book is made only of fragile paper. It will burn, succumb to insects, or inevitably crumble within 200 years. Our careful work on parchment, by contrast, will endure the ages and carries within it spiritual value."*

Yet the cruel irony of history and the utterly perfect paradox is that Trithemius himself had this very polemic against the printing press **printed** on a press in 1494, because he pragmatically realised that otherwise his urgent thoughts would never reach the masses.

**The End of the Golden Age of Calligraphy**

The new technology was as unstoppable as an avalanche. Many a proud scribe ended up, with bitterness in his heart, working in the very same printshops he had loathed from the depths of his soul — as a common typesetter or proofreader. They were compelled to "retrain" in a humiliating fashion. Their noble craft, which had continued without interruption or great change for a thousand years, was utterly annihilated within a single generation.

But their magnificent, hand-illuminated manuscripts survived. Today they lie quietly in museums and vaults as stately monuments to an age when every single word demanded blood, sweat, and hours of absolute concentration, and was therefore held sacred.

*"Speed kills the beauty of detail, but truth survives in both forms." — The last monastic scribe*`
            },
            book_prague_mystery: {
                title: "The Mystery of the Prague Printer: Birth in Secrecy",
                author: "Prague Archives & Urban Legends",
                content: `**The First Swallow above the Vltava**

While in Pilsen the printing presses had been clattering since 1468 (or perhaps 1476 — scholars and historians still quarrel bitterly over the precise date of the **Trojan Chronicle**), in the very heart of the kingdom, in Prague, there was an astonishing silence for years on end. The city's milieu was conservative and dangerous. Only in **1487** did the first printed book appear in Prague from nowhere — the *Statuta synodalia Arnesti*, and shortly after, the celebrated **Psalter**.

But who brought this technological revolution to Prague? No one knows. The master's name was carefully erased from history.

**The Anonymous Master and the Fear of the Guild**

In historiography he is known simply as the *"Printer of the Prague Bible"*, after his later monumental work of 1488. Why did he conceal his identity? Prague at the end of the fifteenth century was a city of guilds. The powerful and radical guild of Prague scribes and illuminators would have perceived any mechanical competition as an existential threat. To set fire to a workshop full of highly flammable paper and linseed oil under cover of night was an easy resolution to a commercial dispute. Or was he perhaps a secret foreigner, a heretic on the run, afraid of the Inquisition, merely passing through Prague — he fulfilled the commission and vanished back into the shadows?

**Mastery Woven from Darkness**

His work, however, bears no marks of amateurism. His Psalter is a masterpiece — beautifully sharp Gothic type (bastarda), elaborate woodcuts, and precisely printed red initials, which at that time demanded an extraordinarily difficult double pass through the press. Prague printing thus did not begin with slow apprenticeship, but with immediate genius wrapped in mystery.

*"In the lanes of the Old Town, stories are born that no one will ever finish, for ink sometimes replaces blood, and silence is worth more than gold." — A chronicler of the Old Town*`
            },
            book_severin_dynasty: {
                title: "The Severýn Dynasty: The Printer at the Town Hall",
                author: "Archives of the Old Town of Prague",
                content: `**Pavel Severýn of Kapí Hora (1520–1557)**

This was no ordinary craftsman with an apron stained with printer's black. Pavel Severýn was a man who knew how to combine perfectly the scent of printing ink with the scent of political power. He began printing around **1520** in the Old Town of Prague. He quickly understood that printing was not merely about books but about influence. From printer he became a respected and extraordinarily wealthy burgher.

**The Mayor with a Press at His Back**

His influence grew so steeply that in the turbulent years **1534–1537** he was elected the **burgomaster (mayor) of the Old Town** itself. Imagine the power — a man who decided on laws and taxes in the wealthiest city in the kingdom simultaneously controlled the machines that shaped public opinion. It was under his hands that the celebrated and beautifully illustrated *Severýn Bible* (1529 and 1537) was produced, on which he collaborated with the finest Prague woodcarvers. It was proven that the printer's craft was no longer a marginal curiosity but an absolute political and social force.

**The Mystery of 1557**

He created an enormous and superbly functioning family enterprise, into which he drew his capable son-in-law, Jan Kosořský of Kosoř, who took over the workshop after him. The Severýn era poured forth dozens of luxury Czech and Latin works and boasted the finest connections at court and among the Utraquist nobility.

But then, around **1557**, this powerful dynasty simply vanished from the historical record. Were they killed by the plague that regularly ravaged the city? Did they fall victim to secret debts? Or did they perhaps fall from favour under the hard Counter-Reformation censorship of the Habsburgs? The truth lies buried in the archives.

*"He who controls the press controls the thought of the people. And he who controls the people rules the city. But not even the finest printer can print a contract that will outwit death itself." — A record of the city council*`
            },
            book_melantrich: {
                title: "The Predator of Prague: The Empire of Jiří Melantrich",
                author: "Royal Chamber and Guild Records",
                content: `**The Rise of the Predator**

The story of Jiří Melantrich of Aventino (c. 1511–1580) is a textbook story of ruthless ambition in the printing trade. He came to Prague as a young, unknown student, but he had two weapons that would prove decisive: exceptional intelligence and absolute cold-bloodedness. He became an apprentice to the established Catholic printer Bartoloměj Netolický, who held the privileged royal concession from King Ferdinand I. Netolický was getting old and, after the ill-fated uprising of the Bohemian Estates in 1547, was in serious financial trouble.

**The Takeover**

Melantrich manoeuvred with the patience of a chess grandmaster. First he became Netolický's business partner, then in **1552** he bought — or rather *absorbed* — the entire workshop from him. He immediately moved it to the Old Town and began building an empire. He reorganised the whole operation, invested in new fonts and presses, hired the best craftsmen, and above all understood something his predecessors had not: the book trade is above all marketing.

**The Melantrich Bible**

His masterpiece was the *Melantrich Bible*, which he published several times (1549, 1556–1557, 1560–1561, 1570, and 1577). On this work he earned a fortune. He bought the magnificent house *U Dvou Velbloudů* (At the Two Camels) on what is today Melantrichova Street in Prague — and the street bears his name to this day. He received from the Emperor himself the title of nobility *"of Aventino"*. He was the most powerful printer in the kingdom.

**The Legacy of an Empire**

After Melantrich's death, his son-in-law **Daniel Adam of Veleslavín** took over the workshop. He married Melantrich's daughter Anna — a marriage of reason, love, or both? No one knows. But Daniel Adam made the print house into a centre of learning and Czech humanist culture. He is credited with forcing Praguers to read, even when they had no particular desire to.

*"The press is a more powerful weapon than a cannon. A cannon destroys walls, but the press destroys minds — and rebuilds them anew." — A guild record*`
            },
            book_rudolf_alchemists: {
                title: "The City of Fools and Geniuses: Rudolf II and the 300 Alchemists",
                author: "Secret Court Chronicle",
                content: `**The Golden Prague of Rudolf II**

When the melancholic Habsburg Emperor Rudolf II moved the imperial seat from Vienna to Prague in 1583, the Bohemian capital was transformed overnight into the most extraordinary city in Europe. Rudolf was not merely a ruler — he was a passionate collector, art lover, and above all a fervent patron of science and the occult. Prague became a magnet for the most extraordinary minds of the age.

**Three Hundred Alchemists**

Rudolf gathered at his court an estimated three hundred alchemists, astrologers, magicians, and natural philosophers — among them the astronomer Tycho Brahe, the mathematician Johannes Kepler, and the enigmatic Edward Kelley. All of them, genuine scientists and genuine frauds alike, worked in an atmosphere of feverish experimentation.

**The Search for the Philosopher's Stone**

Rudolf's primary obsession was the transmutation of base metals into gold — the Philosopher's Stone. He invested enormous sums. The alchemical laboratories in the cellars of Prague Castle worked day and night.

**The Paradox of Rudolf's Legacy**

Rudolf never found the Stone. Yet in their frenzied search for gold, his scientists accidentally made many real chemical and astronomical discoveries. Without Rudolf's eccentric patronage, Kepler's laws of planetary motion might have been delayed by decades.

*"A fool's gold is sometimes the best ore. In the alchemist's furnace, not gold but knowledge is born." — Court chronicle of Rudolf II*`
            },
            book_czech_glass: {
                title: "The Fragile War: Bohemian Glassmaking vs. Venice",
                author: "Secret Master of the Glassmakers' Guild",
                content: `**The Secret of Forest Crystal**

Bohemian glass became in the 17th and 18th centuries a synonym for quality throughout the civilised world. Its roots lie in the dense forests of Bohemia and Moravia, where medieval glass furnaces first began to flare up. The raw materials were ideal: pure quartz sand, potash from burned fern and beech, and unlimited wood for firing. Bohemian glass was exceptional for its purity, clarity, and almost perfect transparency.

**The Venetian Monopoly and Its Cracks**

For centuries Venice held an absolute monopoly on quality glass in Europe. The Venetians guarded their secrets with such fanaticism that all master glassmakers were confined on the island of Murano — officially for their protection, in practice as prisoners. Any master who dared share Venetian secrets with foreigners faced a death sentence. Despite this, the secrets gradually leaked out.

**The Bohemian Counter-Attack**

Around the mid-17th century, the engraver Caspar Lehmann and later Georg Schwanhardt perfected the technique of cutting and engraving glass with copper wheels. Bohemian cut glass suddenly surpassed Venetian blown glass in luxury, precision, and decorative richness. European courts began to prefer Bohemian crystal.

**The Trade War**

Venice reacted with panic — lobbying, attempted sabotage, trying to lure Bohemian masters away. The Bohemian masters guarded their own secrets in return. This economic war for glass supremacy was waged for two full centuries.

*"Glass holds light like no other material — it neither devours it nor reflects it, but transforms it." — A Bohemian master glassmaker*`
            },
            book_hussite_wars: {
                title: "Ashes of Memory: The Hussite Wars and the End of Libraries",
                author: "Laurentius de Březová (Vavřinec z Březové)",
                content: `**The Bonfire of Books**

The Hussite Wars (1419–1434) left behind not only a landscape ravaged by war but an almost incalculable cultural loss. The Hussite armies, driven by religious fervour and hatred of the wealthy church establishment, systematically destroyed monasteries, churches, and above all their libraries. Hundreds of years of painstaking scribal work burned within hours.

**The Library of Sázava**

The Benedictine monastery at Sázava — the oldest Czech monastic library — was plundered and burned. The monks fled, and with them vanished dozens of unique manuscripts, some copied since the 11th century. Czech-language liturgical texts, Old Church Slavonic manuscripts, chronicles — all lost for ever.

**The Paradox of the Hussites and Books**

It would be a simplification to portray the Hussites as mere barbarians. Jan Hus himself was a university-educated man who fought for the right of the common people to read the Bible in their own language. His followers were often highly literate artisans and burghers. The destruction of monastic libraries was in their eyes not an attack on knowledge but on the corrupt wealth of the church.

**The Legacy of Loss**

We shall never know exactly what was lost in those fires. Some scholars believe that among the destroyed manuscripts were unique Old Czech literary works that might have changed our understanding of medieval Bohemian culture entirely.

*"A book burns in minutes. Recreating it takes a lifetime. And some things cannot be recreated at all." — Laurence of Březová, chronicler of the Hussite Wars*`
            },
            book_de_arte_predicandi: {
                title: "De arte predicandi: The Cursed Incunable of Mainz",
                author: "Aurelius Augustinus (Printed by Fust & Schöffer)",
                content: `**The Oldest Bibliographic Jewel in the VKOL Collection**

Imagine a book that remembers the very dawn of the printed word. This is a rare print from the workshop of **Johann Fust and Peter Schöffer** — yes, precisely those two unscrupulous businessmen who in the trial of 1455 robbed the helpless Gutenberg of his life's invention, his print workshop, and his unfinished Bible.

**The Dark Irony of History and the Sacred Text**

History has a perverse sense of humour. Fust and Schöffer, with the blood of betrayal on their hands, paradoxically went on to print some of the visually most beautiful and technically most perfect books of the entire 15th century. This particular volume contains the celebrated work *De arte predicandi* (On the Art of Preaching) by the Church Father Saint Augustine. It served as a manual and practical handbook for clergy on how to address and instruct the common people with proper rhetorical effect. The print itself was demonstrably completed **before the year 1467**, which makes it without question one of the very oldest surviving printed books in the world — a so-called incunable.

**Salvation from Swedish Pillaging**

That such a treasure is to be found in Olomouc in Moravia is no accident. It was brought there by the powerful and learned Jesuits, who collected old books from across Europe as proof that the mass-printed word could spread the Catholic faith infinitely faster than an army of scribes with quills. The book had incredible good fortune. The year is 1642 and, in the course of the Thirty Years' War, the Swedish armies of General Torstenson broke through the city walls of Olomouc and occupied the city. The Swedes looted systematically and carted away treasures by the hundredload — some hundred cartloads of the rarest books from Olomouc's monasteries and university collections disappeared northward to Stockholm as war booty. But this one small, inconspicuous book miraculously survived. How? The Jesuits, together with a handful of other valuables, hastily walled it up deep in the dark crypts and hid it in the roof timbers before the soldiers broke down the gates.

*"This first book bears in its origin the bitter seal of betrayal of its creator, but the perfect beauty of its typesetting outlives wars and Swedish swords."*

---

**GAME EFFECT:** Reading this book unlocks the rare skill **"Fust's Paradox"**. Mastery born of betrayal: once per game session you may sacrifice 10 research points and immediately *craft* any item without requiring any other materials, even those that are otherwise locked for your level.*`
            },
            book_kutnohorska_bible: {
                title: "The Kutná Hora Bible: A Detective Story from the Archives",
                author: "Martin of Tišnov (Printer of the Prague Bible)",
                content: `**The Great Blunder of the Library Shelves**

Sometimes the greatest adventure unfolds not on the battlefield but in the silence of a study. The year is 2005, and a careful researcher at the Research Library in Olomouc is examining an old, heavy volume that had been safely catalogued in the inventory for decades as a fairly ordinary *"Venetian Bible of 1506"*. On closer examination, however, the researcher experienced a shock. He realised he was looking at an extremely rare Czech **Kutná Hora Bible, printed by the wealthy merchant and patron of printing Martin of Tišnov as far back as 1489!**

**How Did Such a Blunder Occur?**

It was a masterful deception born of the need to restore completeness. At some point in the distant past (probably in the 16th or 17th century), the book was damaged and irretrievably lost its first and last gatherings (the pages containing the beginning of Genesis and the colophon with printing details). Some previous zealous owner or collector decided to "repair" the book and rewrote the missing pages by hand. He made one enormous, if logical, mistake, however — as a text template for the rewriting he used a DIFFERENT, newer edition of the Bible that happened to be lying on his desk. That was the Venetian print of 1506.

The scribe who beautifully supplemented the pages thus physically inscribed into the ancient Czech Olomouc book the translation and dates from the Venetian edition. For whole centuries, librarians read this supplemented preface and believed the falsified title page, without examining the printed body within. The truth was uncompromisingly revealed only by modern forensic typography — the comparison of the unique shapes of the original printed metal type within the book with the fonts used in Kutná Hora at the end of the 15th century.

This print thus suddenly "aged" and became **17 years older** than had previously been assumed. In so doing, it was automatically ranked among the very oldest complete Czech book prints. And all that long time it had lain dusty, misdescribed, and underestimated on ordinary library shelves.

**A Mystery Waiting on the Shelves**

This event sent a chill through archivists: how many other supposedly "ordinary Venetian or German" prints, scattered in depositories throughout Europe, are in fact rare Czech incunabula? How much historical truth lies safely hidden beneath layers of errors, faulty catalogue cards, and removable labels?

In every great historical library, thousands of volumes quietly breathe and patiently await their true revelation. One need only look closely and carefully. One need only possess knowledge, diligently compare the lead type, and never trust the labels glued to the spines.

*"Truth knows how to wait patiently. Sometimes it hides for whole centuries beneath the wrong coat."*

---

**GAME EFFECT:** You gain the passive event ability **"Hidden Incunable"**. Whenever you craft luxury codices (luxury_codex), you have a permanent **5% chance of a critical success**, in which scholars reveal that even one of your ordinary codices (common_codex) crafted in the past was in fact a mislabelled luxury original! You immediately receive double the item's value in coins and a great bonus to research.*`
            },
            book_olomouc_misal: {
                title: "The Olomouc Missal: The War of Vellum and Paper",
                author: "Johann Sensenschmidt",
                content: `**A Dazzling Commission for an Entire Diocese**

It was an enormous logistical and artistic undertaking. The eminent Bamberg printer Johann Sensenschmidt received from church dignitaries an extremely prestigious commission for a new official Olomouc Missal (the liturgical book containing the texts for Mass). He completed this monumental printing task in 1488 in the astonishing total edition of **420 perfectly identical copies**.

**Two Worlds, Two Materials**

The Church, however, was both practical and vain. The edition was therefore strictly divided according to the wealth of the parishes:
- **400 copies were printed on paper** (the cheaper, pragmatic, and lighter variant intended for ordinary, poorer village churches and for everyday use by priests).
- **Only 20 copies were printed on luxury vellum** (the enormously expensive, heavy, and magnificent variant, intended exclusively for the altars of the wealthiest monasteries and the hands of the bishops themselves).

**The Unique Holdings of Olomouc**

Here the magic of the Research Library in Olomouc (VKOL) comes into play. In their guarded, climate-controlled vaults today lie safely preserved:
- 1 rare surviving copy printed on paper.
- And 1 absolutely priceless copy from among those original 20 vellum copies.

From a statistical point of view? The probability that a single institution, after 500 years of wars and fires, should hold in its collection both material variants of one edition, is utterly **astronomical**. But again we owe this to the Olomouc Jesuits, who over the centuries collected these artefacts with great system rather than haphazardly. They wished to show students the full evolutionary and material range of medieval printing art laid out on a single table.

**Vellum vs. Paper: A Duel for Eternity**

- **Vellum** (cleaned animal hide, usually from calves or sheep) was a guarantee of durability and physical beauty, but was terrifyingly expensive and ethically fraught. The production of one such large book meant the slaughter of an entire flock.
- **Paper** from pounded linen rags was extraordinarily cheap, dried quickly, took ink beautifully, but was vulnerable to water, mould, and fire.

Abbot Trithemius, the stubborn defender of the old scribes, once warned in a pamphlet: *"Beautiful vellum will safely endure the ages and the Day of Judgement, while your modern cheap paper will burn or crumble to dust within 200 years!"* And technologically he was of course absolutely right.

But from the perspective of history he was gravely wrong in his arithmetic: because of their low cost, paper books were produced and purchased in numbers a thousand times greater than vellum books, and so from a purely statistical standpoint far more of them have survived to the present day in absolute terms, and they changed the educational level of whole societies for ever.

**The Lesson of the Press**

Tangible rarity and production cost are not always the same as historical value to humanity. Printing on vellum represented luxury, a display of the bishop's power and status. But it was the ordinary, fragile, and grubby paper print circulating among the poor that ultimately ignited the Reformation and changed the whole world.

*"On the table before us lie two absolutely identical books with one text and one setting of type. What, then, is the vast difference between them? Only the price of the time and blood paid." *

---

**GAME EFFECT:** You gain the ancient wisdom of the masters — you permanently unlock the supreme production chain for vellum volumes: **raw hide → processed vellum → luxury vellum codex**. These exclusive vellum codices command an **extraordinary value five times greater** on the markets than ordinary paper books, but their production will cost you **ten times more** in basic materials and time, risking empty storerooms.*`
            },
            book_faust_secret: {
                title: "Faust's Covenant: A Myth Clad in Lead",
                author: "An Unknown Heretic and Alchemist",
                content: `**Who Was the Real Doctor Faustus?**

Historical legend recounts with horror that the scholar and astrologer Johann Georg Faust (1480–1540), a real figure wandering Renaissance Germany, sold his immortal soul to the mighty demon Mephistopheles. In exchange he received 24 years of absolute earthly knowledge, wealth, and supernatural power, before the devils bore him off to Hell.

**But the Truth Is Far More Pragmatic and Darker...**

Consider the chronological coincidence. Johann **Fust**, that wealthy financier and printer who robbed Gutenberg, published his printed volumes in unheard-of quantities. Books appeared on the markets with such lightning speed, in hundreds of perfectly identical, flawless copies, that the superstitious and illiterate populace simply refused to believe that human hands had produced them. How could an ordinary mortal have copied a vast Bible two hundred times without a single error?

**The Loop of Names (Fust ~ Faust)**

The names of these two utterly different men — the printer Fust and the occultist Faust — sounded so similar in the street that in oral tradition they soon merged into one. From the real events of the birth of printing and the charlatan tricks of the astrologer, the ultimate myth was born.

**Goethe and the Demonry of the Machine**

More than 200 years later, the great German dramatist Johann Wolfgang von Goethe wrote his life's masterwork, **Faust** (1808). He brilliantly used this old legend as a metaphor. Faust's pact with the devil embodied the human insatiable desire for divine knowledge, for scientific progress at any cost, but also the danger of the newly emerging age of machinery and industry, which threatened to devour human souls. The printing press was, in this conception, the first "infernal machine".

**Did a Pact with the Devil Ever Exist?**

No, if you do not believe in horned creatures reeking of sulphur. But the merchant Johann Fust nevertheless drew up one contract — a very real, notarially attested contract with Johannes Gutenberg. And in his pursuit of money, he betrayed him mercilessly and destroyed him socially. Many scholars argue that to ruin the life of a genius and steal his life's work for personal gain is perhaps a far more terrible and real sin than to sign an imaginary pact with a demon in one's own blood.

*"Sometimes the bare truth, written in black printer's ink and account books, is far darker and colder than an ancient legend."*

---

**Easter Egg:** This ancient book full of heretical thoughts is unlocked in the library only for those hardy souls who have gathered and held exactly 666 points of forbidden research. Congratulations — thou hast gazed into the dark abyss of history and discovered one of the greatest secrets of the game! Thou art now a true master of Scriptorium.*`
            },
            book_pfister: {
                title: "The Man with Pictures: Albrecht Pfister and the First Comic",
                author: "Bamberg Register & Guild of Woodcarvers",
                content: `**Books for the Common Folk**

				While the noble Gutenberg in Mainz sweated blood over his perfect and extraordinarily expensive Latin Bibles intended exclusively for bishops and wealthy monasteries, around 1460 in nearby Bamberg there appeared a man with an entirely different vision. Albrecht Pfister was a pragmatic printer. He swiftly grasped that the true market lay not in Latin, but on the muddy streets. He therefore began to print what we would today call **picture books for the people**.

				**Revolution in German**

				He was the very first to dare to print books on a large scale in the local language—in **German**. Ordinary burghers, merchants, and craftsmen did not command Latin, but they spoke German and desired to read stories they could understand.

				**The Birth of the Illustrated Book**

				Pfister's greatest triumph, however, lay in technology. He was the first in the world to successfully combine typesetting from metal letters with hand-carved **woodcuts** (illustrations) on a single printing form! In 1461, he published the renowned book of fables *Der Edelstein* (The Jewel) by the Dominican monk Ulrich Boner. This book was filled with crude yet remarkably expressive images, which were often hand-colored after printing. It was, in fact, the great-grandfather of today's comic book.

				**Democratization of Knowledge**

				Pfister did not sell his books to universities or abbots. He offered his wares directly at noisy city markets and fairs. People enthusiastically carried home beloved fables, knightly epics, and poems supplemented with pictures. Gutenberg indeed brought the technology itself, but it was precisely Pfister who brought the printed word to the masses. That is the subtle difference between a brilliant inventor and a true cultural revolutionary.

				*"Gutenberg gave words a body of lead, but Pfister breathed a soul into them and sent them dancing among the common folk. Words are for learned minds, but pictures speak directly to the heart." - Notes of a Bamberg burgher*`
            },
            book_veleslavin: {
                title: "The Golden Age: Daniel Adam of Veleslavín",
                author: "Prague Humanist and University Annals",
                content: `**The Academic Who Took Over a Printing Empire**

Daniel Adam of Veleslavín (1546–1599) came to the Melantrich printing house through marriage — he wedded the printer's daughter Anna Melantrichová. It was a marriage of reason, love, or perhaps both; in any case it proved extraordinarily fruitful for Czech culture. Under his direction, the workshop became the most important centre of Czech humanist learning of the second half of the 16th century.

**The Encyclopaedist of the Czech Language**

Veleslavín was above all a passionate linguist and lexicographer. He understood that Czech, in order to compete with Latin, German, and Italian, needed to be systematically cultivated and enriched. He published dictionaries, grammars, and above all translations of important historical and geographical works. His *Calendar Historical* (1578) and *Nomenclator Quadrilinguis* (1598) — a four-language dictionary of Czech, Latin, Greek, and German — were extraordinary achievements for their time.

**The Era of Veleslavín**

The period of Czech literary history from approximately 1570 to 1620 is even called the "Age of Veleslavín" by literary historians. It is characterised by a flourishing of Czech prose, a high standard of printing, and wide readership among educated burghers. Books were no longer the privilege of monasteries and nobles — they had truly reached the middle class.

**The End of an Era**

Veleslavín died in 1599. His heirs continued the printing house for some years, but the catastrophe of the Battle of White Mountain (1620) and the subsequent forced re-Catholicisation brought the golden age of Czech Humanist printing to an abrupt end.

*"A language lives as long as someone writes it with care. The press is not merely a machine — it is the lungs of the language." — Daniel Adam of Veleslavín*`
            },
            book_kronika_trojanska: {
                title: "The Mystery of the Trojan Chronicle: Pride and Watermarks",
                author: "An Unknown Printer of Pilsen",
                content: `**Primacy Shrouded in Mystery**

For long Centuries, we took great Pride in the Belief that Bohemian Typography commenced at a most early Date. The famous Trojan Chronicle, produced by an unknown Printer in Pilsen, proudly beareth within its Text the Year 1468. Were this Assertion true, we should be accounted amongst the absolute Pioneers of Printing in all Europe.

Furthermore, this most antient Bohemian Incunabulum is by no means of a religious Character, as one might expect of so early a Work, but is rather a secular Romance of Chivalry and adventurous Reading intended for the wealthier Burghers!

**The Betrayal of the Translucent Paper**

Modern Science, however, hath dealt a heavy Blow to our national Pride. Scholars began to examine the so-called Filigrees or Watermarks—those Marks of the Paper-mills pressed directly into the very Structure of the Paper whereon the Chronicle is physically printed. These Translucencies serve as a perfect and indisputable Fingerprint of that Age.

The Analysis hath uncompromisingly proven that the Paper employed for the Printing of the Trojan Chronicle was manufactured only around the Year 1484. The Volume is therefore, in all Likelihood, a full seventeen Years younger than was formerly asserted with such Confidence!

**Wherefore did the Printer Lie?**

The Printer, 'twould seem, had no Intent to deceive. As a Textual Model for his Typesetting, he likely employed an older hand-written Manuscript from the Year 1468, and in his mechanical Zeal (or perchance through Inadvertence), he simply and blindly set that antient Date into Lead.

"Paper unerringly remembereth that which Men have forgotten, and a Watermark never lieth. Even Lead may fall into Errour."`
            },
            book_moravian_flyer: {
                title: "The Birth of Marketing: The First Moravian Handbill",
                author: "An Unknown Merchant and Printer",
                content: `To print a Volume and bind the same is but half the Victory. The second Part, from a Merchant’s Station much more arduous, is to sell the Book. In the Year 1501, there appeared in Moravia a Phaenomenon that absolutely outstripped its Age – the very first extant printed Advertisement in our Lands!

It was a relatively simple, yet ingenious single-sheet Print promoting one specifick Title. The Merchant, whose Task was to distribute this Book in Moravia, commissioned a Parcel of these promotional Handbills to be struck.

Interactive Advertisement of the Middle Age

His Method was, for that Time, incredibly modern. He posted the Handbills in great Numbers at the most frequented Places where Folk passed – upon the heavy Oak Doors of Churches and upon the Walls of bustling City Halls.

The Text upon the Bill praised the Book with Ostentation, but the finest Part followed at the very End. There was a Sentence announcing that the Book was to be had at the local Inn, whereby the Printer intentionally left a vacant Space upon the Paper. The distributing Agent then, with a Goose-quill, merely wrote in haste the Name of the particular Tavern in that Town where he had just unpacked his Wares and taken Lodging!

"The Soul of Commerce hath not changed since the Middle Age. Naught changeth but whether the Advertisement for thy Book be shouted by a Crier at a muddy Market, or be softly whispered by Paper upon a Gate."`
            },
            book_mattioli_herbar: {
                title: "Mattioli’s Herbal: A Pharmacy upon Paper",
                author: "Pietro Andrea Mattioli / Jiří Melantrich",
                content: `**A Renaissance Encyclopaedia of Life**

When the mighty typographical magnate Jiří Melantrich and his colleague Daniel Adam of Veleslavín published the costly Bohemian translation of the Italian physician Mattioli’s work, they wrought a revolution in every burgher’s household. This massive Herbal or Book of Herbs was no meer volume for idle scholars. It was oftentimes, in literal truth, a matter of survival.

**Exquisite Illustrations as a Manual for Preservation**

In an age when most common maladies and distempers were yet treated by strange methods (such as the rubbing of cat’s grease) or by simple incantations, the Herbal brought exact and rational instructions. The book was extremely dear and hazardous to produce, for it contained hundreds of vast, incredibly detailed, and beautiful woodcuts (for instance, the root of the mystical mandrake). By these images, folk upon the meadows and in the forests finally discerned with safety that which was a healing remedy and that which, contrariwise, was a mortal poison.

**A Treasure transmitted through Generations**

To-day, as these antient paper witnesses lie in archives, we find within them fascinating traces. Folk employed these herbals daily in their cookery and physick. Their pages are therefore very often tarnished, soiled by earth, fallen blood, and bee’s wax.

The owners frequently inscribed their own remarks, family events (the births of children, deaths by the plague), and inserted pressed plants or devotional holy pictures between the leaves. Thus, the Herbal very soon ceased to be a meer botanical book and became a family chronicle for entire generations.

"This book doth not smell of musty printer’s ink, but of dried wormwood, of hope, and of deliverance."`
            },
            book_hajek_kronika: {
                title: "Hájek’s Chronicle: The Lie that Forged History",
                author: "Wenceslaus Hájek of Libočany",
                content: `**A Book of greatest Sale replete with grandiose Phantasy**

In the Year 1541, there issued from the Printing-Presses a monumental Tome, which forever altered the Bohemians' Perception of themselves and of their own Past – The Bohemian Chronicle. Wenceslaus Hájek of Libočany was without Doubt a famous Narrator with a Genius for the Dramatick, but as an Historian he was most tragical.

Wheresoever he lacked hard Facts and verifiable Historical Springs, he simply and shamelessly feigned the Events, specifick Dates, and even the entire Names of fabled Monarchs!

**Flattery unto the Mighty Nobility**

The Publication of so gigantick a Book was exceedingly dear, and Hájek stood in need of potent Patrons. Therefore, for the Forefathers of the then mighty Noble Houses, he oftentimes purposefully forged heroick praehistorical Deeds, that he might flatter their Vanity and secure their bountiful Financial Favour. By Virtue of its fabulous Readability, the Chronicle became an absolute Triumph. All Men read it, and for entire Centuries following, the Nation uncritically learnt from it "their" glorious History.

It was not until the Close of the 18th Century that the learned Luminary, Joseph Dobrovský, began mercilessly to correct these fabled Nonsenses of Hájek and to reduce them unto the Measure of Truth.

**The Power of the Printed Word over Truth**

'Tis a piquant Matter that from Hájek's Inventions the Writer Alois Jirásek later directly drew Inspiration in his much-venerated Antient Bohemian Legends (Croccus and his Daughters, the Strongman Bivoj, the Maidens' War).

It is a most perfect and chilling Demonstration of the Power of Typography and of the Publick Prints in general: If thou printest a piece of Intelligence with sufficient Beauty, publishest it in a great Impression, and the People moreover delight to read it, the feigned Fiction and Lie becometh, de facto, the official National History.

"The naked Truth is oftentimes tedious and selleth very ill at the Markets. A Lie set in hard Lead and cloaked in Gold liveth eternally."`
            },
            book_kosmas: {
                title: "Cosmas’s Chronicle: Myths and Politicks",
                author: "Dean Cosmas",
                content: `**The First Bohemian Historian, or the First Propagandist?**

Cosmas, the Dean of the Prague Chapter, composed his Masterpiece Chronica Boemorum in the Latin Tongue at the Close of his Life. 'Tis the most antient of all Bohemian Chronicles and the Foundation-stone of our History. It presenteth unto us the Tales of Father Boemus, of Croccus, of Libussa, and of Przemyslas the Ploughman.

**Purposeful Oblivion**

But mark! Cosmas was no independent Journalist. He was a sworn Catholick and a Pragmatist. In his Chronicle, he absolutely, intentionally, and perfectly expunged any Mention of the Slavonick Liturgy, of Cyril and Methodius, or of the Flourishing of Great Moravia. Wherefore? Forasmuch as at that Time 'twas not politically expedient. He desired to show the Bohemians as firmly anchored within the Western and Latin World.

"History is not written by the Victors. History is written by those who have Access unto Parchment and who know that which is better suppressed in Silence."`
            },
            book_dalimil: {
                title: "Dalimil’s Chronicle: Hatred in Verse",
                author: "An Unknown Nobleman",
                content: `**The First Chronicle penned in the Bohemian Tongue**

Whilst Cosmas composed for learned Priests in the Latin Tongue, he that is called Dalimil wrote his Chronicle in Bohemian and in Rhyme, that it might be easily recited and committed to Memory. Who was he? The Name of Dalimil is an Errour of later Historians. The true Authour was an unknown, embittered, and radical Bohemian Nobleman.

**The Dread of Strangers**

The Volume is literally imbued with Xenophoby and a Hatred against Germans and Strangers in general. It had its Origin at a Time when German Colonists and Burghers flocked in great Multitudes into Bohemia, and the antient Bohemian Nobility lost their Interest and Weight. The Authour doth not spare bloody Descriptions and Exhortations to the Defence of the "Bohemian Tongue" (by which he signifieth the Nation).

*"I had rather take a Bohemian Peasant-woman to Wife, than receive a German Queen into my Bed. Blood and Tongue are more potent than the Crown."*`
            },
            book_rozmberk: {
                title: "The Rosenberg Book: The Law of the Stronger",
                author: "Petr I. of Rosenberg (attributed)",
                content: `**Law written by the Sword and by Possessions**

'Tis the most antient legal Text penned in the Bohemian Tongue. It is no Royall Code of Laws, but a private Record of Customary Law (the so-called Land Law), which the mighty South Bohemian Nobility – the Witigonen and the Rosenbergs – caused to be set down for their own Account.

**Blood Feuds and Divine Judgments**

This Text affordeth us a fascinating and rugged Prospect of Mediaeval Justice. It defineth the Punishments for Murders and Thefts, and how the so-called "Divine Judgments" (Ordeals) – such as the bearing of glowing Iron or the Trial by Water – should be conducted. It portrayeth an Age when the King in Prague signified less than a provoked Rosenberg upon his own Domain.

*"Justice is blind, yet she is never deaf to the Clinking of the Gold Coins of the mighty Lords of the Rose."*`
            },
            book_zbraslav: {
                title: "The Zbraslav Chronicle: Tears of the Cistercians",
                author: "Otto and Peter of Zittau",
                content: `The Fall of the Golden King

When Przemyslas Ottocarus II fell upon the Marchfield, it seemed that the End of Bohemia was at Hand. The Zbraslav Chronicle (Chronicon Aulae regiae) is a literary Jewel, which describeth the Rise and Fall of the last Przemyslids and the Accession of the House of Luxembourg.

The Monastery as a Sepulchre of Dreams

The Foundation of the Zbraslav Monastery by King Wenceslaus II was intended to create a new spiritual Centre and a Burial-place for Kings. Peter of Zittau writeth with such emotional Depth and poetical Elegance, that the Chronicle in Places resembleth an antient Tragedy. He describeth in Detail the Famines, Court Intrigues, and Visitations of the Plague with the Precision of a Chronicler.

"Gold and Silver from Kuttenberg purchaseth Armies, yet shall it not ransom the King from the Clutches of Death, which danceth about his Couch."`
            },
            book_majestas: {
                title: "Majestas Carolina: The Law that was Consumed by Fire",
                author: "Charles IV",
                content: `**The Royall Failure of the Greatest of Bohemians**

Charles IV is venerated as the Father of the Fatherland, yet few know his most grievous political Defeat. He endeavoured to set forth the Majestas Carolina – a modern written Code of Laws, which might restrain the Power of the Nobility, forbid the arbitrary Seizure of Estates, and prevent the Alienation of the Royall Fortresses.

**Fire as a Politick Evasion**

The Bohemian Nobility opposed this Code with such Rancour and the Menace of an armed Insurrection, that Charles was compelled ignominiously to withdraw. To the End that he might preserve his Dignity, he employed an ingenious, albeit transparent Evasion: he declared that the original Draught of the Code had "by an unhappy Accident fallen into the Fire and was burnt." Thus was the Proposition formally quashed, without the King being forced to acknowledge his Overthrow.

"Even the most puissant Emperour of the Holy Roman Empire must bow before the Wrath of the Bohemian Nobility in the Defence of their antient Privileges."`
            },
            book_malleus: {
                title: "The Hammer of Witches: A Manual of Madness",
                author: "Heinrich Kramer",
                content: `The most Perilous Book of Europe

Malleus Maleficarum. A Volume that cost the Lives of tens of Thousands of innocent Women (and many Men). The Inquisitor Heinrich Kramer composed the same after he was, for his Brutality and Fanaticism, expelled from Innsbruck by the local Bishop. The Book was intended to serve him as a Justification.

A Legal Framework for Mass Murder

This Print removed Witchcraft from the Sphere of local Superstitions into the Sphere of Heresy against God. It provided detailed, bureaucratick Instructions: how to discern a Witch, how to employ the Question (Torture) to obtain a Confession, and how to prevent "diabolical Influence" during the Trial. By Virtue of Typography, this Manual for Murder spread throughout all Europe like a Pestilence. Later, it inspired the bloody Trials upon the Losiny Estate in our Lands (Henry Francis Boblig).

"When Paranoia is conjoined with Bureaucracy and the Printing-Press, there is born a Hell upon Earth."`
            },
            book_malleus_maleficarum: {
                title: "The Hammer of Witches: An Architecture of Madness",
                author: "Heinrich Kramer",
                content: `**CHAPTER I: The Abased Inquisitor**

To understand the Genesis of the most murderous Book in the History of Europe, we must understand its Creatour. Heinrich Kramer was no venerable Saint, but a fanatical Dominican Inquisitor, replete with Paranoia and a profound, pathological Hatred of Women. 

In the Year 1485, he arrived at Innsbruck in the Tyrol, that he might unleash a Prosecution of Witches. He apprehended several Women and commenced a brutal Examination of them. Kramer’s Methods, however, were so depraved, obsessed with sexual Particulars, and so contrary to the Law of that Time, that the local Bishop, Georg Golser, himself stood against him. The Bishop denounced Kramer as a Madman and expelled him from the City with Ignominy. The Women were set at Liberty. Kramer, abased and thirsting for Vengeance, withdrew into Seclusion and resolved to compose a Book that should legalise his perverse Methods before the whole World. 

**CHAPTER II: A Masterly Deception and the Printing-Press**

The Book was published in the Year 1486 at Speyer, bearing the Title *Malleus Maleficarum*. Kramer knew that for the Book to be held in Regard by secular Judges and Bishops alike, he required Authority from the highest Stations. He therefore made a brilliant Stroke of Propaganda: at the very Commencement of the Volume, he inserted the Papal Bull *Summis desiderantes affectibus* of Pope Innocent VIII. 

The Bull did indeed exist and permitted Kramer’s inquisitorial Labours, yet the Pope had issued the same *before* the writing of the Book, and it served by no means as an Approbation thereof. Furthermore, Kramer subjoined a forged Recommendation from the Faculty of Theology at the University of Cologne (for the Professors had, in Truth, rejected the Text as unethick and contrary to Catholick Doctrine). 

By Virtue of the new Invention of Typography, these Lies and the Text itself flew across Europe with incredible Speed. Within two hundred Years, the Book was issued in no fewer than thirty Editions.

**CHAPTER III: A Manual for Judicial Murders**

The Book is coldly systematical and is divided into three Parts. 
The first Part proveth theologically that Witchcraft existeth, and asserteth that whosoever believeth not in Witches is himself an Heretick. It describeth Women as Creatures by Nature weaker, more prone to carnal Sins, and incapable of maintaining the Faith (Kramer here even manipulateth the Latin Word for Woman, *femina*, and falsely claimeth it to proceed from the Words *fe* and *minus*, signifying "having less Faith").

The second Part is a Collection of ghastly Fables presented as Facts. It describeth how Witches fly to Sabbats, how they sacrifice unbaptized Infants, how they conjure destructive Hailstorms, how they transmute Men into Beasts, and how they physically deprive Men of their Member.

The third Part is the most cruel – 'tis a detailed legal Manual. It instructeth Judges how to circumvent the customary Rights of the Accused. It ordaineth that the meer Testimony of a malicious Neighbour sufficeth to commence a Process. It commandeth the Use of the Question (brutal Torture upon the Rack and Thumb-screws). And it giveth unto the Judges a diabolical Counsel: if a Woman weepeth during Torture and confesseth, she is guilty. If she weepeth not and remaineth obstinately silent, she is likewise guilty, for the Devil hath granted her a dark Strength to endure the Pain.

**CHAPTER IV: A Legacy of Ashes**

*The Hammer of Witches* was not merely a Book. It was a deadly Virus installed into the legal System of Early Modern Europe. It inspired Inquisitors across the Centuries, and even in Protestant Lands, where they otherwise burnt Catholick Books. In the Bohemian Lands alone, upon the Estates of Losiny and Šumperk, the infamous Inquisitor Henry Francis Boblig of Edelstadt sent over an hundred innocent Souls to the Stake, following fanatically the Procedures of the *Hammer*. 

The Words in this Book literally melted human Flesh and transformed the Fear of a poor Harvest into a State-sanctioned Genocide of Women.`
            },
            book_bartos_pisar: {
                title: "The Prague Chronicle: Tidings from the Barricadoes",
                author: "Bartoš the Scribe",
                content: `An Inquisitive Chronicler of the 16th Century

Bartoš the Scribe was an Officer of a sharp Tongue and a biting Pen. His Prague Chronicle is no Panegyrick unto Kings, but a most severe and candid Narration of the Insurrection of the Prague Burghers against King Ferdinand I of the House of Habsburg (in the Year 1524 and the Commotions surrounding the Leader Jan Hlavsa).

Censorship and Banishment

Bartoš described in Detail the Corruption, the Intrigues of the Aldermen, and the Treachery at the Town Hall. He named particular Persons and their Transgressions. For his Boldness he paid dearly – he was tortured upon the Rack and banished from Prague. His Chronicle is written as a lively Relation of a Man who stood in the very Centre of the political Tempest and refused to keep Silence.

"When a Clerk forbeareth to write that which is dictated unto him, and beginneth to write that which he seeth, he signeth his own Sentence of Death."`
            },

            book_sit_viry: {
                title: "The Net of True Faith: Medieval Anarchism",
                author: "Petr Chelčický",
                content: `**The Rejection of Power and Violence**

Petr Chelčický was a self-taught man, a rural thinker and radical. While the Hussites shed blood in the name of divine truth, he composed *The Net of True Faith*. In it he absolutely refused all violence, even in self-defence. He rejected the division of society into three estates — clergy, nobility, and common people.

**The Tearing of the Net**

According to his metaphor, the Church and the State are like a heavy whale tearing apart the delicate net of true faith. Kings and popes, in his view, have no right to exist, for they enforce power by the sword. His ideas on absolute pacifism and equality laid the ideological foundation for the founding of the Unity of Brethren. These were thoughts so heretical that even the Hussite priests themselves were afraid of them.

*"He who takes a sword in hand, though in the name of good, has long since lost his soul."*`
            },
            book_jistebnicky: {
                title: "The Jistebnice Cantional: Song Instead of Weapons",
                author: "Unknown Hussite Cantors",
                content: `**A Weapon of Mass Destruction in Musical Notes**

This manuscript songbook, found in the attic of a parish house in Jistebnice, is one of the most precious treasures of our musical history. It is here that the text and notation of the battle hymn *"Ye Who Are Warriors of God"* are recorded.

**Psychological Warfare**

The Hussites did not use music only for divine services. It was part of their military tactics. When an enormous mass of thousands of soldiers began in unison to sing this hymn and beat upon their wagons, it produced a deafening, terrifying acoustic pressure, so that crusading armies (as at Domažlice) often fled the field before any clash had even begun.

*"When words believe in their own power and become a hymn, they need not the edge of a sword."*`
            },
            book_schedel: {
                title: "The Nuremberg Chronicle: The End of the World in Woodcuts",
                author: "Hartmann Schedel",
                content: `**A Medieval Encyclopaedia of the World**

One of the most magnificent and best-documented incunabula in the world. Hartmann Schedel encompassed in it the history of the world from the biblical creation to the year 1493. The book is celebrated for its extraordinary 1,809 woodcuts, which were produced in the workshop of Michael Wolgemut — incidentally the teacher of the celebrated Albrecht Dürer.

**The Recycling of Cities**

There is an amusing typographical detail here. The production of woodcuts was expensive, and so the printers recycled without embarrassment. The same image of a city is used in the chronicle to depict Damascus, Verona, and Mantua alike. Most people at that time did not travel, so no one noticed the difference. The book also ends with blank pages — Schedel left them there so that readers might write in events until the approaching end of the world.

*"The world is but a theatrical backdrop, which the printer rearranges according to whatever story he wishes to sell."*`
            },
            book_voynich: {
                title: "The Voynich Manuscript: The Book That Cannot Be Read",
                author: "Unknown",
                content: `**A Mystery Worth 600 Ducats**

This strange, handwritten manuscript is filled with drawings of non-existent plants, naked bathing women, and astrological diagrams. It is written in an unknown script, in an unknown language, and to this day the most powerful supercomputers and NSA cryptologists have been unable to decipher it.

**The Bohemian Connection and Rudolf II**

The book has a deep Bohemian connection. According to surviving letters, Emperor Rudolf II purchased it for the outrageous sum of 600 gold ducats, believing it had been written by the celebrated English scholar Roger Bacon. It was later owned by the Prague alchemist Georg Baresch and the rector of Charles University, Jan Marcus Marci. Does the book conceal the secret of immortality, or is it a brilliant, centuries-old fraud perpetrated upon a grasping emperor?

*"The greatest wisdom is sometimes not to read a text but to leave it unread as an eternal mystery."*`
            },
            book_cerny_herbar: {
                title: "Černý's Herbal: The Czech Pharmacist",
                author: "Jan Černý",
                content: `**Medicine Without Latin**

Several decades before the celebrated translation of Mattioli, the Litomyšl physician and member of the Unity of Brethren, Jan Černý (Joannes Niger), published his work *The Medical Book Called the Herbal or Book of Herbs*. It was a revolutionary undertaking, for it was written in Czech, thereby circumventing the monopoly of the educated, Latin-speaking university masters.

**Accessibility for the Poor**

The book contained advice for common ailments and referred to herbs that grew behind every farmyard hedge, not to inaccessible oriental spices. It is the first original Czech medical and botanical work. The print has survived in very few copies, because those books were literally "read to pieces" in households.

*"The remedy for every human pain God has already planted in the earth — we have merely forgotten its name."*`
            },
            book_agricola: {
                title: "De re metallica: Treasure from the Depths",
                author: "Georgius Agricola",
                content: `**The Bible of Miners and Metallurgists**

Georgius Agricola lived in Jáchymov (Joachimsthal), at that time the European centre of silver mining and the minting of the celebrated thalers (whence the word "dollar" derives). His work *Twelve Books on Mining and Metallurgy* became an engineering masterpiece.

**Machines, Poisons, and Dust**

The book was the first to describe scientifically how to drive tunnels, how ventilation machines and mine pumps work. It also addresses miners' diseases (silicosis, arsenic poisoning). It is filled with magnificent technical woodcuts of mining mechanisms. For a full 200 years it remained the unsurpassed textbook for all geologists and miners in the world.

*"The wealth of nations lies not in the palaces of kings, but in the darkness, sweat, and dust beneath our feet."*`
            },
            book_alchymie_kelley: {
                title: "Tractatus de Lapide: Kelley's Deception",
                author: "Edward Kelley (attributed)",
                content: `**Gold from Lead and Promises**

The English alchemist Edward Kelley captivated the court of Rudolf II. He claimed to possess a remnant of red powder from the tomb of a bishop at Glastonbury, with which he could transmute metals. His manuscripts (frequently attributed to him retrospectively) promised the revelation of the Philosopher's Stone.

**A Fall Without Ears**

Kelley was a showman. At public transmutations he reportedly concealed pieces of gold in the double bottoms of crucibles. He wore his hair long not from vanity but to conceal his severed ears — punishment for forging documents in England. When he failed to deliver to the Emperor the tons of promised gold, he was imprisoned at Křivoklát castle and later Hněvín, where in a desperate escape attempt he leaped from a window to his death.

*"Gold can be created by only two means: in the sweat of one's brow deep in a mine, or through lies in the ears of a greedy sovereign."*`
            },
            book_kralice: {
                title: "The Kralice Bible: A Six-Part Jewel",
                author: "Brethren Translators (Jan Blahoslav and others)",
                content: `**A Secret Press in Exile**

The Unity of Brethren was persecuted and was compelled constantly to move its press (Ivančice, Kralice nad Oslavou). In this hidden press arose the supreme work of Czech literature and typography. They did not translate from the Latin Vulgate, as was the custom, but directly from the original Hebrew and Greek texts.

**The Perfection of the Typesetting**

The six-part edition contained not only the text itself but on the margins immensely detailed commentaries and explanatory notes. The Czech employed in this Bible polished our language to absolute perfection. When after the Battle of White Mountain the destruction of the nation threatened, it was precisely the smuggled Kralice Bible that kept the Czech language alive in exile and in peasants' hiding places beneath the floorboards.

*"When you lose your land, your king, and your freedom, your home becomes the language hidden between the pages of a single book."*`
            },
            book_bible_prazska: {
                title: "The Prague Bible: The Birth of Czech Typesetting",
                author: "Printer of the Prague Bible (Jan Kamp?)",
                content: `**The First Complete Bible in Czech**

While Gutenberg printed in Latin for the élites, a group of wealthy Prague burghers (including Jan of the Peacocks and Severin the Draper) pooled their resources for an utterly unprecedented and extremely costly project: to publish the entire, complete Bible in the Czech language. The year is 1488 and from the printing presses of the Old Town falls upon tables a monumental work.

**Czech in Lead**

To set Czech text meant creating entirely new lead type. Czech required its specific ligatures and characters that German printers did not know. This book thus in effect standardised the form of printed Czech for long decades. Moreover the book was published in a large edition and became accessible to wealthier burgher families, not only to inviolable monasteries.

*"When God first spoke in print in Czech, the old vellum-makers trembled to their foundations."*`
            },
            book_michna_loutna: {
                title: "The Bohemian Lute: A Baroque Spark in the Darkness",
                author: "Adam Michna of Otradovice",
                content: `**A Broken Land Sings**

After the Thirty Years' War the Bohemian lands were plundered, a third of the population dead, and the non-Catholic élite driven into exile. In this hopeless darkness of the so-called "Age of Darkness", the organist of Jindřichův Hradec, Adam Michna of Otradovice, composed *The Bohemian Lute*.

**Music as a Remedy for Censorship**

It was a collection of mystical, devotional songs, but composed with such genius and with such fervent and comprehensible Czech that people loved them at once. Music circumvented the strict Habsburg censorship and Jesuit control. It was not political rebellion but a quiet escape of the wounded soul of a nation. These notes and texts kept the vernacular Czech alive when the official language of the authorities was becoming exclusively German.

*"Where they forbid speech and reading, the people learn to sing their truths."*`
            },
            book_balbin_obrana: {
                title: "A Discourse in Defence of the Language: Hidden Defiance",
                author: "Bohuslav Balbín",
                content: `**A Jesuit Who Loved His Nation**

Bohuslav Balbín was a Jesuit, historian, and deep patriot. He watched the Czech language decline, being driven from offices and schools, and saw the nobility beginning to be ashamed of it. In secret, full of anger and sorrow, he composed his most celebrated work: *A Discourse in Defence of the Slavonic Language, and in Particular the Czech*.

**A Book That Waited a Hundred Years in a Drawer**

Balbín knew that were he to publish the book, it would destroy him. It was so sharp a critique of denationalisation and Habsburg officials that he would have ended in prison. He therefore carefully concealed the manuscript. It took an extraordinary 103 years before F. M. Pelcl found it in 1775 and finally published it in print. Balbín's hidden text then became the dynamite that set off the Czech National Revival.

*"The most powerful book is not the one lying on a king's table, but the one that waits a hundred years in the dark for its proper moment."*`
            },
            book_veleslavin_kalendar: {
                title: "The Historical Calendar: The Social Media of the Renaissance",
                author: "Daniel Adam of Veleslavín",
                content: `**More Than Just Days and Months**

Printed calendars in the 16th century were the absolute bestselling commodity, a kind of Facebook of the age. Veleslavín's *Historical Calendar* was no dry catalogue of feast days. It contained astrological predictions, advice for farmers, the dates of fairs throughout Europe, and brief descriptions of significant historical events for each date.

**The Organisation of Time and Society**

It was precisely thanks to the enormous print runs of these printed calendars that time began to be unified on a mass scale. A peasant suddenly knew precisely when the market at Leipzig took place and when to expect an eclipse of the moon. Veleslavín created an information highway along which the whole of society was unified, and taught ordinary people to plan their future according to printed paper.

*"He who controls the calendar controls time. And he who controls time governs the whole world."*`
            },
            book_codex_gigas: {
                title: "Codex Gigas: The Devil's Bible and Its Curse",
                author: "Herman the Recluse (per palaeographic analysis)",
                content: `**A Pact Made at Midnight**

The legend is as follows: in the early 13th century, a monk in the Benedictine monastery at Podlažice near Chrudim committed a grave transgression. His punishment was to be walled up alive. In his despair he begged for one last chance at redemption — he promised to write in a single night a book that would contain all human knowledge and bring eternal glory to the monastery. At midnight he realised he could not finish in time. In his despair he turned to the fallen angel — to the Devil himself — and promised him his soul in exchange for completing the work. The Devil wrote the book in one night. As a token of gratitude, the monk painted a large, full-page portrait of the Devil in the middle of the codex.

**The Largest Book in the World**

The Codex Gigas (Giant Book) weighs 75 kilograms, measures 92 centimetres in height, and requires two strong men to lift it. Despite the legend, modern graphological analysis has established that the entire codex was written by a single hand — and that this hand did not age or tire over the entire duration of the work. The script is consistent from the first to the last page, without any detectable tremor or deterioration. If the monk wrote it himself, by the most conservative estimate it would have taken him 20 to 30 years of daily work.

**The Swedish Plunder**

In 1648, at the very end of the Thirty Years' War, Swedish troops plundered Prague and among other treasures seized the Codex Gigas as war booty. It was carried to Stockholm, where it remains to this day in the National Library of Sweden. The Czechs have repeatedly requested its return — so far without result.

*"The greatest books are never written in a single night. They are written across an entire life — only we prefer to believe in the Devil."*`
            },
            book_kralicka_bible: {
                title: "The Kralice Bible: The Six-Part Jewel of Exile",
                author: "Brethren Translators and Jan Blahoslav",
                content: `**Scribes on the Run and a Secret Press**

The sixteenth century in Europe was an age of religious wars and intolerance. In the Bohemian lands there operated the Unity of Brethren — a strict, Puritanical but extraordinarily learned reforming church. They were a thorn in the side of both Catholics and moderate Utraquists alike. They were systematically persecuted, their churches closed, and their printing presses destroyed by the authorities.

To survive and preserve their teaching, they were compelled to go underground. They secretly moved their heavy printing presses on wagons from place to place under the protection of tolerant nobles. From Ivančice they finally moved them safely to a manor house in the inconspicuous Moravian village of Kralice nad Oslavou. Here, in secret, surrounded by fortifications, they began the greatest literary project in Czech history.

**Dissatisfaction with Latin and Blahoslav's Triumph**

Until that time, Czech Bibles had been translated mostly from the Latin Vulgate. The bishop of the Unity of Brethren, the brilliant philologist and scholar Jan Blahoslav, however, considered this insufficient. He wished for the Czech people an absolutely pure, uncorrupted text of God. He therefore first translated the New Testament himself (published 1564) directly from the original ancient Greek. His work was linguistically so brilliant, refined, and rich that it set the standard.

**The Six-Part Edition and the Marginal Notes**

The fruit of their fifteen years of labour was not a single ordinary volume but a monumental six-part edition, published progressively between 1579 and 1593. The Brethren scholars did not wish to give the people merely text. Around the central block of biblical text there wound on the pages enormous columns of so-called marginalia — explanatory notes, theological interpretations, linguistic observations on Hebrew words, and cross-references. The Kralice Bible was not merely a book for prayer — it was a complete, deeply analytical theological university hidden within paper pages.

**A Lifeline in the Age of Darkness**

Its full historical significance became apparent only thirty years later. After the Battle of White Mountain in 1620, the Unity of Brethren was banned, its members driven into exile, and non-Catholic books burned en masse on public squares. The Kralice Bible became a forbidden, mortally dangerous commodity. The men who had smuggled it back into Bohemia hid it under floorboards and in false walls. Two hundred years later, when patriots like Josef Dobrovský and Josef Jungmann were reviving the almost extinct and Germanised Czech language, they took as their absolute model of grammar and vocabulary precisely the language of the Kralice Bible.`
            },
            book_voynichuv_rukopis: {
                title: "The Voynich Manuscript: A Cipher That Defies the Centuries",
                author: "Unknown (estimated 1404–1438)",
                content: `**A Bibliographic Ghost in the Villa Mondragone**

In 1912 the Polish-American antiquary Wilfrid Voynich was searching through a collection of old books in a Jesuit college at the Villa Mondragone near Rome. The Jesuits needed money to repair the building and were secretly selling off part of their archive. Among the old folios Voynich came across a book unlike any he had seen in his life.

It was a medieval codex written on fine parchment, roughly 240 pages long. At first glance it appeared not at all alarming. It was decorated with drawings of plants, astrological schemata, and images of women bathing in peculiar greenish liquids. But when Voynich attempted to read the text, a cold sweat came over him. The letters resembled a strange mixture of the Latin alphabet and an elvish script. There was not a single word that made sense. The manuscript was written in an unknown, perfectly structured language that the world had neither seen before nor since.

**Anatomy of Alien Botany**

The manuscript is divided into several distinct sections that only deepen its mystery. The botanical section contains over a hundred drawings of entire plants — yet botanists have to this day been unable to identify a single one with certainty. They look like chimeras, leaves of one plant grafted onto the roots of another. The astronomical section contains complex circular diagrams of the sun, moon, and stars. The balneological section — the strangest of all — depicts dozens of naked women with swollen bellies bathing in systems of tubes, vats, and basins through which flow liquids resembling human organs and vessels.

**The Bohemian Connection**

Among the documents associated with the book was a letter of 1666 from the Prague rector and scientist Jan Marcus Marci of Kronland. This letter revealed a fascinating trail: the book had originally been owned by Emperor Rudolf II. Rudolf purchased the manuscript at his Prague court for the enormous sum of 600 gold ducats, probably from the English charlatans John Dee or Edward Kelley, under the belief that it was the lost work of the great medieval mage Roger Bacon.

**The Undefeated Mystery of Supercomputers**

In over a hundred years since Voynich's discovery, the finest minds on the planet have attempted to decipher it. British code-breakers who cracked the Nazi Enigma in wartime failed on this text. NSA cryptologists in the Cold War found no solution. Not even the most modern artificial intelligence algorithms have succeeded. Radiocarbon analysis (C-14) has proven that the parchment was produced between 1404 and 1438. The language displays clear statistical patterns (Zipf's law, which applies to all natural languages), which rules out the possibility that it is mere random scribbling. Is it the encrypted diary of heretical alchemists? A medieval women's herbal community writing in a secret argot to escape the Inquisition? Or a masterly 15th-century fraud intended to extract money from wealthy European rulers? The Voynich Manuscript remains the Holy Grail of cryptography — a perfect lock for which the world has lost the key for ever.`
            },
            book_koldin: {
                title: "Municipal Law: Koldín's Code and the End of Chaos",
                author: "Pavel Kristián of Koldín",
                content: `**A Legal Babylon in the Heart of Europe**

Until the end of the 16th century, the legal system in the Bohemian lands resembled a dark, impenetrable forest. Every city had its own law. If you stole a loaf of bread or brawled in a tavern in the Old Town of Prague, the magistrate would judge you entirely differently than if you had committed the same offence in Brno, Jihlava, or Litoměřice. Cities were governed by ancient privileges, local customs, and Magdeburg or Nuremberg law, which everyone interpreted as he saw fit.

**The Chancellor and His Life's Work**

Koldín was no armchair theorist but a hard-headed practitioner. He served as chancellor of the Old Town of Prague — at that time one of the most influential and demanding bureaucratic positions in the kingdom. He saw daily the tears of bankrupt merchants, the frauds of guild masters, and bloody quarrels over inheritances. He resolved to write a complete, unifying legal code. His *Koldín Code* (officially *Municipal Laws of the Kingdom of Bohemia*) was in preparation for decades. He had to encompass everything: from rules for trade, through family law, guardianship, and guild regulations, to brutal criminal law.

**Print and the Resistance of the Cities**

When Koldín finally published his masterwork in print in 1579, he met with unexpected resistance. Moravia in particular and some northern Bohemian cities rebelled. They were unwilling to surrender their old rights and submit to the "Prague" code. Only King Rudolf II was compelled to intervene and gradually impose the code on all.

**An Immortal Code**

The true genius of this printed code was shown in the test of time. While dynasties fell, kings came and went, and the Thirty Years' War ravaged the land, Koldín's code stood firmly on. His laws were so deeply rooted and functional in Bohemia that Czech courts were governed by them for an extraordinary 232 years. The Koldín Code was definitively abolished only in 1811, when it was replaced by the modern Austrian General Civil Code.`
            },
            book_kristan_mor: {
                title: "A Counsel Against the Plague: Dances with Death",
                author: "Křišťan of Prachatice",
                content: `**Stars and Miasma**

When a plague struck in the Middle Ages, cities were transformed into a foretaste of Hell. People fell dead in the streets and carts could not keep pace with carrying away the bodies. In this atmosphere of utter hopelessness and horror, the people sought salvation. It was offered to them by Křišťan of Prachatice, a brilliant astronomer, rector of Prague University, and close friend of Master Jan Hus.

Křišťan composed in Czech the very first comprehensive medical treatise in our language — *Medical Booklets*, the most celebrated and important part of which was the *Counsel Against the Plague*. The medical science of the time had no inkling of the existence of bacteria or fleas. They believed in two things: unfavourable positions of the planets (malign conjunctions of Saturn and Mars) and the so-called miasma — a poisonous, corrupted air that penetrated through the pores into the body.

**Purification by Fire and Juniper**

Křišťan's treatise, which was later massively printed and saved lives for whole centuries, contained precise instructions for survival. The first rule was flight ("Flee quickly, flee far, and return late"). For those who could not flee, Křišťan advised how to arrange the household. The foundation was to destroy the poisoned air. He recommended lighting large fires of fragrant wood — juniper, oak, and ash — in the houses. Windows were to be tightly sealed to prevent the entry of marsh fog. The air in the rooms was also "purified" by spraying strong vinegar and rose water.

**Ground Emeralds and Bloodletting**

The chapters on treating the disease itself appear to us today as terrifying. The fundamental assumption was that the body must expel the corrupted "black bile" and blood. Drastic bloodletting (phlebotomy) was therefore applied. Physicians cut the veins of the sick on precisely prescribed days according to the phases of the moon.

**A Book as a Lifeline**

Although from today's perspective Křišťan's medicine resembles quackery, in its own time it had an enormous psychological significance. In an age when plague was regarded as purely divine punishment for sin, the printed *Counsel Against the Plague* gave people a sense of control. It offered a tangible, rational guide to what to do, rather than merely resigned waiting for death. This small book was often the only thing frightened families could grasp in the darkness.`
            },
            book_klaudyan: {
                title: "Klaudyán's Map: Politics Drawn Upside Down",
                author: "Mikuláš Klaudyán",
                content: `**A Physician of the Brethren**

Mikuláš Klaudyán was a Renaissance polymath — physician, pharmacist, theologian, and printer of the Unity of Brethren at Mladá Boleslav. In 1518 he embarked on an unprecedented project: to create the very first detailed, printed map of the Bohemian Kingdom. To achieve the highest quality and avoid the censorship of powerful Catholic censors, he travelled with the design all the way to Nuremberg, to the celebrated woodcut workshop of Hieronymus Höltzel.

**A World Where the Sun Shows the Way**

When a modern person unfolds Klaudyán's map, he is utterly disoriented. The map is oriented in precisely the opposite manner to what we are accustomed — south is at the top and north at the bottom. Why? In the 16th century, maps were not commonly laid on tables. People used them while travelling and held them in their hands, orienting themselves by compasses and above all by small sundials. It was entirely natural for them to turn the map toward the sun, that is toward the south, and to have it in the upper part of their field of vision. Bohemia thus has Austrian borders at the top of this map and the Ore Mountains at the bottom.

**A Travel Network and Secret Centres**

The map is astonishing in its topographical detail. It records over 280 cities, castles, and monasteries. The red lines connecting the cities are not ordinary roads but the very first representation of postal and trade routes. Large and small symbols distinguish royal cities from subject towns.

A sharp censor's eye would not, however, have missed one "inconspicuous" detail: Brethren centres such as Mladá Boleslav or Litomyšl are emphasised on the map with large crowns and coats of arms, with far greater pride and space than their objective size would warrant.`
            },
            book_defenestrace: {
                title: "The Defenestration of Prague: A Pamphlet That Started a War",
                author: "Czech Protestant Estates",
                content: `**Three Men and a Window**

On 23 May 1618, a group of Bohemian Protestant noblemen entered Prague Castle and threw three imperial Catholic governors out of a window approximately 17 metres above the ground. All three survived, landing in a heap of refuse below the window — a fact which the Catholics immediately declared a miracle wrought by the Virgin Mary, while the Protestants claimed it merely proved the low quality of imperial officials.

**The Printed Apologia**

This event was not merely a physical act but above all a political statement that had to be immediately explained to all of Europe. The Bohemian Estates therefore immediately set to work on a political pamphlet — the *Apologia* — which was to legitimise their violent act in the eyes of European courts.

The Apologia was a masterwork of crisis communication and legal cunning. The document claimed that the throwing from the windows was not at all an attack on imperial majesty or the sovereign himself. The rebels falsely and cleverly argued that the Emperor was actually good and knew nothing of the matter. The attack was directed *exclusively* against these specific, corrupt royal officials who were manipulating the Emperor.

**A Spark That Set a Continent Ablaze**

For the Apologia to fulfil its purpose, it had to spread faster than the Emperor's army. The Prague printing presses did not stop. The document was immediately printed not only in Czech but above all in German, Latin, and French, and dispatched by swift messengers to all the Protestant royal courts of Europe.

It worked. The book provided Protestant princes with the legal and moral pretext to become involved in the Bohemian conflict. This small printed pamphlet, sewn from a few sheets of paper, ultimately served not to calm the situation but as the formal declaration of the bloodiest conflict of the 17th century — the Thirty Years' War, which left behind a burned Europe and millions of dead.`
            },
            book_komensky_labyrint: {
                title: "The Labyrinth of the World: A Pilgrimage through Madness",
                author: "Jan Amos Comenius",
                content: `**The Most Painful Book in Czech Literature**

The year is 1623. Jan Amos Comenius — future "Teacher of Nations", great pedagogical reformer and bishop of the Unity of Brethren — is hiding in the Bohemian countryside. He is a fugitive. After the Battle of White Mountain (1620) all Brethren were expelled from the country, their schools burned and their books destroyed. Comenius has just lost his wife and children to plague.

**The Pilgrim's Journey**

In this situation he writes his most personal work: *The Labyrinth of the World and the Paradise of the Heart*. The book is an allegory in which the protagonist — the Pilgrim — travels through the city of the World on a donkey. He is accompanied by two guides: Searchall (representing curiosity) and Delusion (representing self-deception), who place spectacles on his nose that distort reality and present the world as better than it is.

**The Anatomy of Human Foolishness**

In each district of the city the Pilgrim witnesses a different form of human folly and suffering. In the scholarly district, the learned quibble over words while the world burns. In the marketplace, merchants cheat one another and call it wisdom. In the halls of power, the powerful destroy one another for hollow titles. Nowhere does the Pilgrim find true happiness or meaning.

**The Paradise of the Heart**

Utterly exhausted and close to absolute madness, the Pilgrim wishes to flee the world entirely. At that moment he hears a quiet voice calling him back — not into the external city, but into his own inner self. The Pilgrim closes himself in his own heart, to which the world, wars, and false people have no access. Here he meets with Christ and finds that "Paradise of the Heart".

This extraordinarily powerful literary therapy saved Comenius from madness and enabled him later to become the "Teacher of Nations", even though for the rest of his life he was never permitted to see his homeland again.`
            },
            book_schedula_diversarum_artium: {
                title: "Schedula Diversarum Artium: The Secrets of Crafts",
                author: "Theophilus Presbyter",
                content: `**The Monk Who Knew Everything**

Theophilus Presbyter — probably a German Benedictine monk — wrote in the early 12th century a work without parallel in contemporary Europe. The Schedula Diversarum Artium (Handbook of Various Arts) is a three-volume encyclopaedia of craft techniques: painting, glasswork, and metalwork. But it conceals something that surprises scholars even today — a detailed guide to building organs.

**Leather, Air and God**

According to Theophilus, the organ is an instrument worthy of God, but its construction is work worthy of a master. The key is the bellows — great leather sacks that drive air into the pipes. Theophilus describes how the leather must be saturated with wax and tallow so that no air escapes. Without perfect bellows there is no sound. Without sound there is no prayer.

*"Master, before thou reach for wood and metal, prepare the leather. Upon it all depends."*

**GAME EFFECT:** Unlocks the Organum Hydraulicum tech — the construction of hydraulic organs. Without reading this treatise, the organ builder from Nuremberg shall not come.`
            },
            book_tacuinum_sanitatis: {
                title: "Tacuinum Sanitatis: Tables of Health and Ruin",
                author: "Ibn Butlan (Latin translation: Italian schools, 13th c.)",
                content: ``
            },
            book_crescenzi: {
                title: "Liber Ruralium Commodorum: The Order of Field and Farmyard",
                author: "Pietro de' Crescenzi of Bologna",
                content: ``
            },
            book_pegolotti: {
                title: "La Pratica della Mercatura: Notes of a Venetian Merchant",
                author: "Francesco Balducci Pegolotti",
                content: ``
            }
        }},
    time: {
        phase_dawn: 'Dawn',
        phase_morning: 'Morning',
        phase_forenoon: 'Forenoon',
        phase_noon: 'Noon',
        phase_afternoon: 'Afternoon',
        phase_evening: 'Evening',
        phase_night: 'Night',
        phase_midnight: 'Midnight',
        phase_deepnight: 'Deep Night',
        night: 'NIGHT', morning: 'MORNING', forenoon: 'FORENOON', noon: 'NOON', afternoon: 'AFTERNOON', evening: 'EVENING'
    },
    hunger: {
        full: 'Fully Nourished ({h}h {m}m)',
        light: 'Peckish ({h}h {m}m)',
        medium: 'Moderate Hunger ({h}h {m}m)',
        heavy: 'Ravenous! ({h}h {m}m)',
        starving: 'STARVING!',
        notified: 'Thy belly rumbles. Thou art starving!'
    },
    // candleBurnedOut: 'Thy candle hath burned out.',

    tidings: {
        empty: "No tidings as yet. Resume thy work.",
        subtitle: "Letters and tidings that have reached the scriptorium...",
        from: "From:",
        unread: "Unread",
        senders: {
            scribe: "The Elder Scribe",
            unknown: "Unknown",
            monastery: "From the Monastery",
            medicus: "Brother Physician",
            cellar: "Brother Cellarer",
            porter: "Brother Porter"
        },

        // ── Daily tidings (minDay trigger) ──────────────────────────────
        news_0: "Knowest thou that in the monastery o'er the hill they scribe through the night? 'Tis said they have vellum from their own flock. I have pondered this since yesterday. Our parchment is thin and spoils quickly — perhaps it is the water, perhaps the manner of curing. But their volumes are firm as stone. I must ask the Abbot whether we might visit them under pretense of exchanging texts.",
        news_3: "I was in the refectory when they brought an old manuscript. None of us had ever seen it — they called it simply the Regula, but it was not the Benedictine Regula. The script was older, perhaps Carolingian minuscule, but with strange ligatures I did not know. Brother Thomas claimed the text came from Ireland. Brother Kryštof crossed himself. I secretly copied three lines onto a scrap of paper and have hidden it well.",
        news_7: "They seek an experienced scribe for the Monastery of St. Procopius by the Sázava. Work for God, not the market — those are their words. I have pondered it all day. Their library holds forty volumes, five in Greek. Here we have thirteen, one half-crumbled. Yet I know every stone in the paving here, every crack in the wall. Is it cowardice, to remain in the place one knows?",
        news_10: "Hast thou heard the morning bells at Matins? They say at Rajhrad they scribe from the third hour of the night. We begin after Prime, by candlelight and oat gruel. And yet the finest thoughts come in that dark hour before dawn, when the hand moves of itself and the mind does not yet judge. Perhaps we miss something indeed. Or perhaps it is merely another manner of suffering.",
        news_15: "A patron from Brno brought a single leaf from Mainz. He calleth it Druk — he says it in German, but he means Print. I saw it with mine own eyes: letters precise as God's own hand, each the same height, every line as straight as measured cord. Swift. Cheap. Soulless — that is my word, not his. He wants a hundred copies by Christmas. A hundred. In a year I copy seven volumes, and that with effort.",
        news_20: "A brother from the monastery at Velehrad came to me. He offered an exchange — our paper notes for their vellum. He said they have sheepskins from their own flock and space for drying. Vellum is a different matter than paper — heavier, more certain, it endures the ages. Paper yields to damp and mice are fond of it. I know not whether to accept. I asked the Abbot. The Abbot was silent, then said: Pray upon it. So I pray.",
        news_25: "The Abbot seeketh a scribe who knoweth gall ink — that dark mixture of oak galls and vitriol. For a special commission from the Bishop of Olomouc, 'tis said. He would not say what. But gall ink is a thing prepared over three days and must ripen like wine. I tried it last year. The first batch came too pale, the second too acid. The third — the third was good. But I told no one at the time. Now I wonder whether I should tell the Abbot.",
        news_28: "Hast thou decided who thou art? A craftsman or a servant? Both paths are honorable, but they are not the same. The craftsman measures the price of work, guards the stores, counts the groschen. The servant writes without regard to price, for the word must be set down. I myself still know not. Each morning I say: today I shall be a servant. Each evening I count how many candles we have spent. Perhaps that is how it must be — perhaps a good steward is the finest servant of all.",

        // ── Seasonal tidings ────────────────────────────────────────────
        season_spring: "The snow in the garden melted in the night. I went out in the morning and caught that scent — wet earth, tree bark, air without the winter's weight. The garden awaits. The beds are still hard, but life stirs beneath. Brother Gardener says we shall plant more thyme and less mint this year, for mint spreads like heretical thought and crowds out all else. I am glad of spring. And of the metaphor.",
        season_summer: "The sun shines into the scriptorium long into the evening and the ink dries faster than it ought. I must add more water — but then the lines grow pale. This is summer's eternal compromise. On the other hand — natural light till None, no candles, no smoke over the parchment. The bees fly from Prime to Vespers. The Abbot says summer is God's reward for surviving winter. I believe him.",
        season_autumn: "Leaves are falling from Blaník to Křemešník. I saw it from the scriptorium window — a golden dusting across the whole valley. Winter stores are a matter of survival, not comfort. Brother Cellarer counted groschen yesterday with a troubled face. I count candles — we have forty-two, and winter lasts a hundred and twenty days, one candle each day. It will not be enough.",
        season_winter: "Frost cracks in the roof beams like shots from a sling. The ink in the pot thickens toward morning — I must warm it in my palms each day before it will flow. The brothers scribe with fingerless gloves; the hand is worse for it, but at least the fingers do not fall. The Abbot has shortened morning prayer by twenty minutes, for breath freezes in the air of the chapel. That has not happened in my memory. This winter is different.",

        // ── Flag tidings — Athanor ──────────────────────────────────────
        flag_athanor: "I have heard things about thee, friend. They say thou dost work with fire in the night, and that from thy cell come smells the Brother Porter cannot name. These are not reproaches — they are envy. I studied the art of alchemy for twenty years and I know what that furnace means. It is faith of another kind — faith that the world has structure, that things change according to law, not by chance. Be wary of inquisitors. And send me a sample of that Nigredo, if thou hast any.",
        flag_athanor_nigredo: "Nigredo. The first phase. I know how it looks — black as sin, foul as a grave, and yet in it lies the beginning of all. Weep not over lost material. That which burns in the Athanor does not vanish — it transforms. So says Paracelsus, so say I. Persevere. Albedo will come, if thou art patient. And patience is rarer in this scriptorium than lapis lazuli.",
        flag_prima_cervisia: "So I hear thy ale is done. Prima Cervisia — the first brewing. That is a feast, friend, a true feast. In Benedictine monasteries ale has been brewed since the days of Charlemagne. Monks drank three litres a day in Lent — in place of meat, in place of wine, in place of all else. They called it Flüssiges Brot — liquid bread. Send me a sample, if thou hast the heart. I have.",

        // ── Flag tidings — Farmyard ─────────────────────────────────────
        flag_henhouse: "So thou hast a henhouse. A good thing, a henhouse. Hens are modest, reliable, and do not protest. Unlike goats. One goat can ruin a garden in an hour — I tell thee this from painful experience, still fresh. Eggs are another matter: each morning a small miracle, a small protein, a small hope. Brother Physician says yolk mixed with ale cures a cough. I know not whether to believe it, but it tastes well enough.",
        flag_sheepfold: "Sheep. Yes, sheep is the right choice. Wool in winter, skin for parchment, milk in summer. They are humble, silent creatures — unlike pigs, which scream. Only one thing I tell thee: a sheep needs other sheep. One alone is wretched and will stop eating. Two are better. Five is the ideal. Brother Shepherd here says the flock is like a community — without the others, every member diminishes.",
        flag_piscina: "Fish. An excellent choice for fasting days, and these are many — forty days of Advent, forty of Lent, every Friday. Brother Physician swears by fish broth as a remedy against melancholy. Whether that is true I know not, but a carp soup in winter warms one differently than anything else. Only beware of overpopulation. Fish are fruitful as sins — they multiply easily and are harder to manage.",

        // ── Flag tidings — Printing ─────────────────────────────────────
        flag_printing: "So thou hast done it. The press. I stood beside one in Mainz in the year of Our Lord 1462 — I was young then, picking lead type from the floor where it had fallen. Heavy, precise, cold. Gutenberg was still alive then, but his trial with Fust was known throughout the city. They said Fust was a devil in a fur coat. Perhaps he was. But those letters — those letters are another matter. They are seeds. One sheet of paper with one impression is like one seed. And seeds grow.",
        flag_zaltar: "The Psalter. A hundred and fifty psalms in one volume, translated, printed, bound. Dost thou know how long it would take to copy that by hand? Seven years. Seven years of patient labour by one scribe, from Prime to Compline, resting only for the Divine Hours. And thou hast done it in — how long? Days. Days. I know not whether to celebrate or weep. I celebrate. But I weep a little withal.",

        // ── Flag tidings — Scrinium ─────────────────────────────────────
        flag_scrinium: "So the Abbot has decided to open the Scrinium. This does not happen often — in my lifetime it has happened twice. Once when a legate came from Rome. Once when the library at Olomouc burned and they brought the rescued volumes here. What is inside, I will not tell thee — not because I would not, but because I do not know. The Scrinium is a place where knowledge awaits the one who is ready to receive it. Art thou ready?",
        flag_epistola: "Epistola de Rebus Ignotis. A letter concerning unknown things. I read it once, in a manuscript lent to me by an old monk at Karlštejn on condition I return it within three days and mention it to no one. I returned it. I mentioned it to no one. But I remember every word. What the letter contains, only one who has read it through to the Arcanum will know. I will tell thee only this: the Athanor is not merely a furnace.",

        // ── Mystery tidings (unknown sender) ────────────────────────────
        mystery_1: "I know not who thou art. But I know what thou dost — and I know thou dost it rightly. There are those who see the work of the scriptorium as mere craft. There are those who see in it a prayer. And there are those — we are few — who see it as both at once. Thou art among us. It can be told. Continue.",
        mystery_2: "A man without a name came to me. He asked after thee. He would not say why. He wore a ring with a lion and at his belt a parchment case — empty. I said I did not know thee. He departed toward the monastery. Be wary, friend. I know not what he wants. But men without names want various things, and seldom is it good.",
        mystery_3: "Titivillus was with me last night. I swear it. He sat in the corner of the scriptorium, small and grey as dust, gathering into his bag those letters I had skipped. There were many — I was tired, the light poor, the parchment rough. He looked at me and smiled. Then he vanished. In the morning I corrected errors from the third hour of the night. That is his punishment — not posthumous judgment, but morning correction. It is merciful, in its way.",
        mystery_4: "The codex that lies at Podlažice weighs seventy-five pounds. One man wrote it all his life — or in one night, if thou believest the legend. I have seen it. Those pages are not written in fear or duty. They are written — I know not how else to say it — in ecstasy. As though the hand knew what it did, even while the mind slept. Hast thou such moments? I have. They are rare. But they are real."
    },

    // ── NotificationSystem i18n ──────────────────────────────────────────────
    notifications: {
        panel_title: "Tidings from the Monastery",
        panel_empty: "No tidings.",
        panel_clear: "Mark all as read",
        just_now: "just now",
        minutes_ago: "{n} min ago",
        hours_ago: "{n}h ago",
        days_ago: "{n}d ago",
        cat_sklad: "stores",
        cat_dvur: "farmyard",
        cat_athanor: "athanor",
        cat_obchod: "trade",
        cat_udalost: "event",
        cat_system: "system",
        cat_postup: "progress"
    },
    canonical: {
        buff_crafting: 'Crafting +{percent}%',
        buff_research: 'Research +{percent}%',
        buff_foraging: 'Foraging +{percent}%',
        buff_alchemy: 'Alchemy +{percent}%',
        buff_garden: 'Garden check',
        buff_quest: 'Daily quest',
        buff_darkness: 'Darkness warning',
        vesperae_warning: 'Darkness approaches. Light thy lamp!'
    },

    garden: {
        title: 'The Garden',
        desc: 'Cultivate rare flora. The soil requires thy care.',
        fertilize: 'Fertilize',
        locked: 'Locked',
        lockedTech: 'Technology required',
        herb: 'Herbs',
        vegetable: 'Vegetables',
        special: 'Special',
        any: 'Any crop',
        sow: 'Sow',
        restNona: 'Nona Rest',
        restNonaUsed: 'You have already rested today.',
        plant: 'Plant',
        uproot: 'Uproot',
        noSeedsAvail: 'No seeds in stores',
        water: 'Water',
        dry: 'Parched',
        growing: 'Growing...',
        grown: 'Ready',
        harvest: 'Harvest',
        wait: 'Wait',
        tabPiscina: '🐟 Piscina',
        piscinaLocked: 'Unlock the De Piscibus technology (8 notes) to access the pond.',
        piscinaDesc: 'The monastery pond. Build a breeding pond, rearing pond and carp pond.',
        piscinaTier1: 'Breeding Pond',
        piscinaTier1Sub: 'Piscina Fecundationis — hatches fry (1 week)',
        piscinaTier2: 'Rearing Pond',
        piscinaTier2Sub: 'Piscina Educatoria — young shoal growing (2 weeks)',
        piscinaTier3: 'Pond',
        piscinaTier3Sub: 'Piscina Corporum — market fish ready to harvest',
        piscinaBuild: 'Construct',
        piscinaAddFry: 'Add fry',
        piscinaFry: 'Fry',
        piscinaYoung: 'Young carp',
        piscinaCarp: 'Carp',
        piscinaGrowing: 'Growing',
        piscinaMaturing: 'Maturing',
        piscinaWaitingCarp: 'Awaiting carp from the rearing pond...',
        piscinaUpgradeFirst: 'Build the previous pond first.',
        tabZahony: '🌱 Plots',
        tabPole: '🌾 Fields',
        // Fields (Ager)
        poleLocked: 'Study De Re Rustica and build Sulci (Furrows) to unlock the fields.',
        poleDesc: 'Monastic fields. Plough, sow, irrigate and harvest.',
        poleEmpty: 'Empty',
        polePloughed: 'Ploughed',
        poleGrowing: 'Growing',
        poleReady: 'Ready',
        poleFallow: 'Fallow',
        polePlough: 'Plough',
        poleSow: 'Sow',
        poleWater: 'Water',
        poleHarvest: 'Harvest',
        poleNeedsSulci: 'Requires: Sulci built',
        poleDrought: 'Drought',
        poleDroughtWarn: 'Drought! {days} dry days — yield -20%',
        poleRotation: 'Three-field system: +25% yield',
        poleFallowResting: 'Resting',
        tabVinohrad: '🍇 Vineyard',
        // Vineyard (Vinea)
        vineaLocked: 'Study Liber de Cultura Vitis (Library → Master Bartholomew) to unlock the Vineyard.',
        vineaDesc: 'Six vine plots. Plant, prune, harvest within the window.',
        vineaEmpty: 'Empty',
        vineaPlant: '🌿 Plant',
        vineaPrune: '✂️ Prune',
        vineaPruned: '✂️ Pruned ✓',
        vineaUproot: '🪴 Uproot',
        vineaHarvest: '🍇 Harvest',
        vineaRipe: 'Ready!',
        vineaOverripe: 'Overripe!',
        vineaDormant: 'Dormant',
        vineaPruneOnlySpring: '✂️ Pruning is done in spring (March–April).',
        vineaAlreadyPruned: 'Already pruned this season.',
        vineaNoViticis: 'No cutting available.',
        vineaOccupied: 'Slot is occupied.',
        vineaPlanted: ' planted.',
        vineaUprooted: 'Vine uprooted.',
        vineaHarvested: 'Harvested: ',
        tabSad: '🌳 Orchard',
        tabApiarium: '🐝 Apiary',
        tabDvur: '🐄 Farmyard',
        dvorDesc: 'The monastery farmyard. Build a henhouse, a sheepfold and tend the well.',
        // Orchard (Pomarium)
        orchardLocked: 'Unlock the Tractatus de Arboribus (10 notes) to tend the orchard.',
        orchardDesc: 'The monastery orchard. Plant a seed, await its growth, and harvest fruit in season.',
        orchardEmpty: 'Empty slot',
        orchardNoSeeds: 'No seeds',
        orchardPlant: '🌱 Plant',
        orchardGrowing: 'Growing',
        orchardHarvest: '🍎 Harvest',
        orchardFell: 'Fell tree',
        orchardWait: 'Wait',
        // Apiary (Apiarium)
        apiaryLocked: 'Unlock the Liber Apium (12 notes) to tend the apiary.',
        apiaryDesc: 'The monastery apiary. Build a hive, place a queen, and harvest honey and wax.',
        apiaryEmpty: 'Empty slot',
        apiaryNoQueen: 'No queen',
        apiaryBuild: '🪵 Build hive (10 branch, 5 rope)',
        apiaryAddQueen: '🐝 Place queen',
        apiaryReady: 'Honey and wax are ready!',
        apiaryWorking: 'The bees labour...',
        apiaryWintering: 'The bees winter',
        apiaryCollect: '🍯 Collect',
        apiaryWait: 'Wait',
    },

    daily: {
        streak: 'Streak',
        streakTitle: 'Daily streak:',
        loyaltyBonus: '🎉 Loyalty Bonus!',
        factTitle: 'Today\'s Fact'
    },
    achievements: {
        unlocked: 'Achievements unlocked',
        hidden: 'Hidden',
        reward: 'Reward:'
    },
    records: {
        locked: 'Locked',
        lockHint: 'Unlock the "Games and Records" tech to access mini-games and statistics.',
        miniGames: '🎮 Mini-Games',
        stats: '📊 Personal Statistics',
        items: '📦 Items',
        discovered: '📖 Discovered',
        crafts: '⚒️ Crafts',
        harvests: '🌿 Harvests',
        researchGained: '📜 Research Gained',
        tech: '👑 Tech',
        gamesWon: '🎮 Games Won',
        meals: '🍖 Meals',
        mealsEaten: '🍖 Meals Eaten',
        candles: '🕯️ Candles',
        candlesLit: '🕯️ Candles Lit',
        wellUses: '💧 Well',
        well: '💧 Well',
        streak: '🔥 Streak',
        streakDays: 'days',
        streakMax: 'best',
        days: 'days',
        max: 'max',
        booksRead: '📚 Books Read',
        booksUnlocked: '📖 Books Unlocked',
        backup: '💾 Safekeeping',
        backupTitle: '💾 Save Backup',
        backupDesc: 'Export thy save as backup or transfer to another device.',
        backupWarning: '💡 We urge thee to secure a copy ere making grave changes!',
        backupReset: 'To reset the game, visit Settings.',
        backupNote: '💡 Before great experiments, we recommend downloading a backup!<br>For game reset, go to Settings.',
        downloadSave: '📥 Download Save',
        uploadSave: '📤 Upload Save',
        btnDownload: '📥 Download Save',
        btnUpload: '📤 Upload Save'
    },
    fontSpec: {
        unlocked: 'Unlocked',
        title: '✒️ Script of the Age',
        close: 'Close'
    },
    ui: {
        close: 'Close'
    },
    rank: {
        current: 'CURRENT RANK',
        next: 'Next Rank',
        remaining: 'remaining',
        needCreate: 'must be crafted',
        needObtain: 'must be obtained',
        maxReached: 'Thou hast attained the highest secular rank!',
        monasticEntry: 'Enter the Monastery',
        monasticNotEligible: '⛔ Thou must be at least Antiquarius for the monastery to accept thee.'
    },

    ranks: {
        // ===== TIER 1: LAICUS =====
        laicus_name: 'Laicus',
        laicus_name_short: 'Laicus',
        laicus_desc: 'A novice in the scriptorium. Cleaning quills, mixing ink, copying prayers under watchful eyes.',
        laicus_lore: 'Scribes began thus from the age of twelve. The left hand held the knife, the right the quill. Both labored together always.',
        laicus_toast: 'Thou art Laicus — the lowest link in the chain. But somewhere a start must be made.',
        laicus_requirement: 'Starting rank',

        // ===== TIER 2: LIBRARIUS =====
        librarius_name: 'Librarius',
        librarius_name_short: 'Librarius',
        librarius_desc: 'Thou dost copy alone. Liturgical texts, legends. No one stands behind thee now.',
        librarius_lore: 'At Cîteaux (12th century) the librarii were the lowest fully functioning members of the scriptorium. In the margins they wrote: "I am cold. The ink is thin."',
        librarius_toast: 'Librarius — the ink is on the desk. The master watcheth from afar.',
        librarius_requirement: '5× research + notebook',

        // ===== TIER 3: ANTIQUARIUS =====
        antiquarius_name: 'Antiquarius',
        antiquarius_name_short: 'Antiquarius',
        antiquarius_desc: 'Thou dost copy complex texts. Others transcribe calendars — thou hast been given Augustine.',
        antiquarius_lore: '"The antiquarii were senior scribes and the librarii junior scribes." The antiquarius established the Ductus — the hand of the entire workshop.',
        antiquarius_toast: 'Antiquarius — thy Ductus is legible. Others copy thee now.',
        antiquarius_requirement: '15 research + 2 tech unlocked',

        // ===== TIER 4: RUBRICATOR =====
        rubricator_name: 'Rubricator',
        rubricator_name_short: 'Rubricator',
        rubricator_desc: 'Thou dost add red headings and initials. The red pigment is poisonous. Do not lick the brush.',
        rubricator_lore: 'In early printed books there remain empty squares to this day — there should have been an initial, but the owner paid not the rubricator.',
        rubricator_toast: 'Rubricator — the red is thine. Remember what befell Nicholas of Cluny.',
        rubricator_requirement: 'Tech illumination + ink_gallic',

        // ===== TIER 5: ILLUMINATOR =====
        illuminator_name: 'Illuminator',
        illuminator_name_short: 'Illuminator',
        illuminator_desc: 'A painter. Gold, lapis lazuli, malachite. The highest paid in the entire chain of craft.',
        illuminator_lore: 'In the dental calculus of a nun from Dalheim (11th century) they found lapis lazuli from Afghanistan. She licked the brush during illumination. Women illuminators existed, though none spoke of them.',
        illuminator_toast: 'Illuminator — lapis lazuli from Afghanistan. Every drop costeth a groat. Spill not.',
        illuminator_requirement: 'vellum_codex + tech_illumination + 25 research',

        // ===== TIER 6: STATIONARIUS =====
        stationarius_name: 'Stationarius',
        stationarius_name_short: 'Stationarius',
        stationarius_desc: 'Head of the workshop. Thou dost take commissions. Thou decidest what shall be copied. And what printed.',
        stationarius_lore: 'Vespasiano da Bisticci (Florence) refused to shift from manuscripts to print — and in the year 1480 went bankrupt. The flexible survived.',
        stationarius_toast: 'Stationarius — thou hast a workshop. Beyond the wall, a printing press knocketh. It needeth thee not yet.',
        stationarius_requirement: 'bishop_seal + 40 research',

        // ===== MONASTIC B1: CANDIDATUS =====
        candidatus_name: 'Candidatus',
        candidatus_name_short: 'Candidatus',
        candidatus_desc: 'Thou knockest at the gate. The abbot hath refused thee. Come again tomorrow.',
        candidatus_lore: 'The Rule of St. Benedict (ch. 58): "Let not admission be easily granted." Refuse four times. If he persisteth, only then admit him.',
        candidatus_toast: 'Thou hast approached the gate. The abbot hath refused thee. Perseverance is needed.',
        candidatus_requirement: 'Antiquarius+ and voluntary choice',

        // ===== MONASTIC B2: NOVITIUS =====
        novitius_name: 'Novitius',
        novitius_name_short: 'Novitius',
        novitius_desc: 'A year under the Master\'s watch. Learning the Rule, the chant, the liturgy. From nothing.',
        novitius_lore: 'A novice for one year might not own personal property. Pride was grounds for expulsion.',
        novitius_toast: 'Novitius — thou hast shed thy worldly garb. What thou wert outside mattereth not here.',
        novitius_requirement: 'Candidatus + 24h + 10 research sacrificed',

        // ===== MONASTIC B3: FRATER =====
        frater_name: 'Frater',
        frater_name_short: 'Frater',
        frater_desc: 'Thou hast taken thy vows. Stabilitas. Obedientia. Conversatio morum.',
        frater_lore: 'Monks in the 15th century mostly hired not copyists themselves — they hired lay scribes. The monk supervised and approved.',
        frater_toast: 'Frater — prayer at six. Scriptorium at nine.',
        frater_requirement: 'Novitius + 50 research + 7 Canonical Hours streak',

        // ===== MONASTIC B4: ARMARIUS =====
        armarius_name: 'Armarius',
        armarius_name_short: 'Armarius',
        armarius_desc: 'The keys to the shelves are now thy care. Thou decidest what shall be copied.',
        armarius_lore: 'The armarius assigned materials, supervised copying. From the 10th century he sang the 8th responsory and held the lamp during the abbot\'s reading.',
        armarius_toast: 'Armarius — the scriptorium is thine. Every scribe awaiteth thy word.',
        armarius_requirement: 'Frater + 75 research',

        // ===== MONASTIC B5: PRIOR =====
        prior_name: 'Prior',
        prior_name_short: 'Prior',
        prior_desc: 'Second in the monastery. Thou art not promoted for points — thou art appointed for merit.',
        prior_lore: 'The prior was not a career advancement — he was appointed or elected by the community. The abbot could recall him at any time.',
        prior_toast: 'Prior — the abbot hath named thee. The community hath accepted thee.',
        prior_requirement: 'Armarius + nomination event',
    },


    games: {
        // Header
        title: '🎮 Miniature Games',

        // Memory Game
        memoryName: 'Memory Game',
        memoryDesc: 'Match pairs of discovered items!',
        memoryCraft: 'Craft Playing Cards',

        // Royal Game of Ur
        urName: 'Royal Game of Ur',
        urDesc: 'The world\'s oldest game (2600 BCE)',
        urTech: 'Tech: Ancient Games (6 Research)',
        urCraft: 'Craft the Royal Game of Ur Board',
        urPlayVsAI: 'VS AI 🤖',
        urPlaySolo: 'Solo 🧩',
        urNeedBoard: 'You don\'t have an Ur board!',
        urTitleVs: 'Royal Game of Ur',
        urSubtitleVs: 'Play against AI',
        urDescVs: 'The world\'s oldest board game (2600 BCE)',
        urBtnVsAi: 'Play VS AI',
        urBtnBackVs: 'Back to selection',
        urLabelYou: 'You',
        urLabelAi: 'AI',
        urLabelFinished: 'finished',
        urLabelOffboard: 'off board',
        urLabelRoll: 'Roll',
        urLabelTrack: 'Track',
        urBtnRoll: 'Roll dice',
        urErrMoveFirst: 'Roll dice first!',
        urErrNoMoves: 'Can\'t move! Try another piece.',
        urErrInvalid: 'Invalid move!',
        urRollSuccess: 'You rolled {roll}!',
        urRollZeroRetry: 'You rolled 0. Roll again!',
        urRollZeroSkip: 'You rolled 0. Opponent\'s turn.',
        urRosette: '🌟 Rosette! Play again!',
        urCapture: '⚔️ You captured opponent\'s piece!',
        urAiMove: 'AI moved a piece.',
        urAiRosette: 'AI hit a Rosette!',
        urAiRollZero: 'AI rolled 0.',
        urAiNoMoves: 'AI can\'t move.',
        urWinVs: '🏆 You won! +{reward} Research',
        urLossVs: '💀 AI won.',
        urTitleSolo: 'Royal Game of Ur — Solo',
        urSubtitleSolo: 'Practice game',
        urBtnPlaySolo: 'Play Solo',
        urBtnSolo: 'Solo mode',
        urLabelOffboardSolo: 'Off board',
        urLabelRolls: 'Rolls',
        urLabelMoves: 'Moves',
        urLabelPace: 'Pace',
        urLabelRating: 'Rating',
        urGradePass: 'Pass',
        urGradeOk: 'Good',
        urGradeGood: 'Great',
        urGradePerfect: 'Perfect',
        urRatingPass: '⭐ Pass (30+ rolls)',
        urRatingOk: '⭐⭐ Good (20-29 rolls)',
        urRatingGood: '⭐⭐⭐ Great (15-19 rolls)',
        urRatingPerfect: '⭐⭐⭐⭐ Perfect (<15 rolls)',
        urWinSolo: '🎉 All pieces finished! {grade} | +{reward} Research | {rolls} rolls',
        urRulesTitle: 'ROYAL GAME OF UR — Rules',
        urRulesHistory: '📜 History',
        urRulesHistoryText: 'The world\'s oldest known board game, discovered in tombs at Ur (modern Iraq) from 2600 BCE.',
        urRulesGoal: '🎯 Goal',
        urRulesGoalText: 'Be the first to get all 7 pieces through the track and off the board.',
        urRulesDice: '🎲 Dice',
        urRulesDiceText: 'Roll 4 tetrahedra (pyramids). Sum of marks = squares to move (0-4).',
        urRulesRosettes: '🌟 Rosettes',
        urRulesRosettesText: 'Star squares = Rosettes. Landing on one gives you another turn! Opponent can\'t capture you on the middle rosette.',
        urRulesCapture: '⚔️ Capture',
        urRulesCaptureText: 'Landing on opponent\'s piece (except middle rosette) sends it back to start.',

        // Primero
        primeroName: 'Primero',
        primeroDesc: 'Ancestor of poker (1530)',
        primeroTech: 'Tech: Primero (10 Research)',
        primeroCraft: 'Craft the Primero Deck',
        primeroNeedDeck: 'You don\'t have a Primero deck!',
        primeroNeedBet: 'Not enough Research for the bet ({bet})',
        primeroTitle: 'Primero',
        primeroSubtitle: '16th century Spanish card game',
        primeroBetInfo: 'Bet: {bet} Research',
        primeroBtnPlay: 'Play',
        primeroLabelYou: 'You',
        primeroLabelRound: 'Round',
        primeroLabelOpponent: 'Opponent',
        primeroLabelYourCards: 'Your cards',
        primeroBtnReveal: 'Reveal!',
        primeroRoundWin: '🎉 You win the round! ({player} vs {opponent})',
        primeroRoundLoss: '😔 You lose the round ({player} vs {opponent})',
        primeroRoundDraw: '🤝 Draw ({player})',
        primeroGameWin: '🏆 You won the game! +{reward} Research',
        primeroGameLoss: '💸 You lost. -{bet} Research',
        primeroGameDraw: '🤝 Draw! Bet returned ({bet})',

        // Primero Rules
        primeroRulesTitle: 'PRIMERO — Rules',
        primeroRulesHistory: '📜 History',
        primeroRulesHistoryText: 'Primero is a 16th-century Spanish card game, the ancestor of modern poker. It was played at royal courts.',
        primeroRulesDeck: '🎴 Deck',
        primeroRulesDeckText: '40 cards (10 ranks × 4 suits: ♠️♥️♣️♦️)',
        primeroRulesGoal: '🎯 Goal',
        primeroRulesGoalText: 'Win 2 out of 3 rounds with the best hand.',
        primeroRulesScoring: '🏆 Scoring',
        primeroRulesScoringFlux: '• Flux (all 4 cards same suit): +40 points',
        primeroRulesScoringFour: '• Four of a kind: +50 points',
        primeroRulesScoringThree: '• Three of a kind: +30 points',
        primeroRulesScoringPair: '• Pair: +10 points',
        primeroRulesScoringFace: '• Face cards: King +5, Queen +4, Jack +3',
        primeroRulesHowTo: '🎮 How to play',
        primeroRulesHowToText: 'You get 4 cards, opponent too. Click "Reveal!" — higher score wins the round. First to 2 wins gets double the bet!',

        // Karnöffel
        karnoffelName: 'Karnöffel',
        karnoffelDesc: 'The oldest trump game (1426)',
        karnoffelTech: 'Tech: Karnöffel (12 Research)',
        karnoffelCraft: 'Craft the Karnöffel Deck',
        karnoffelNeedDeck: 'You don\'t have a Karnöffel deck!',
        karnoffelTitle: 'Karnöffel',
        karnoffelSubtitle: '15th century German trump game',
        karnoffelBtnPlay: 'Play',
        karnoffelLabelYourTricks: 'Your tricks',
        karnoffelLabelTrump: 'Trump',
        karnoffelLabelOpponent: 'Opponent',
        karnoffelLabelCurrentTrick: 'Current trick',
        karnoffelLabelYourCards: 'Your cards',
        karnoffelTrickWin: '🎉 You won the trick!',
        karnoffelTrickLoss: '😔 Opponent won the trick',
        karnoffelGameWin: '🏆 You won! +{reward} Research',
        karnoffelGameLoss: '💸 You lost.',

        // Karnöffel Rules
        karnoffelRulesTitle: 'KARNÖFFEL — Rules',
        karnoffelRulesHistory: '📜 History',
        karnoffelRulesHistoryText: 'Karnöffel is the oldest known trump card game, first mentioned in 1426 in Germany. The name comes from "Karniffel" (executioner).',
        karnoffelRulesDeck: '🎴 Deck',
        karnoffelRulesDeckText: '32 cards (4 suits × 8 ranks): 🍃 Leaves, 🔔 Bells, ❤️ Hearts, 🎯 Acorns',
        karnoffelRulesGoal: '🎯 Goal',
        karnoffelRulesGoalText: 'Win the majority of 5 tricks (3+).',
        karnoffelRulesTrump: '🃏 Trump',
        karnoffelRulesTrumpText: 'At game start, a trump suit is randomly chosen. Trump cards beat other suits.',
        karnoffelRulesPlay: '🎮 Play',
        karnoffelRulesPlayText: 'Click a card from your hand to play it. AI plays its card. Higher value (or trump) wins the trick.',

        // FreeCell
        freecellName: 'FreeCell Solitaire',
        freecellDesc: 'A game of logic and cards',
        freecellTech: 'Tech: Solitaire Mastery (15 Research)',
        freecellCraft: 'Craft the French Deck',
        freecellNeedDeck: 'You don\'t have a French deck!',
        freecellTitle: 'FreeCell Solitaire',
        freecellSubtitle: 'Strategy-based patience game',
        freecellBtnPlay: 'Play',
        freecellBtnNew: 'New Game',
        freecellLabelMoves: 'Moves: {moves}',
        freecellErrAce: 'Only Aces can start foundations!',
        freecellErrInvalid: 'Invalid move!',
        freecellErrColorVal: 'Must be opposite color and 1 lower value!',
        freecellErrCellFull: 'This free cell is occupied!',
        freecellWin: '🏆 You won! +{reward} Research ({moves} moves)',

        // FreeCell Rules
        freecellRulesTitle: 'FREECELL SOLITAIRE — Rules',
        freecellRulesHistory: '📜 History',
        freecellRulesHistoryText: 'FreeCell was created in 1978 by Paul Alfille. It became famous in 1995 as part of Windows.',
        freecellRulesGoal: '🎯 Goal',
        freecellRulesGoalText: 'Move all cards to 4 foundation piles (sorted by suit from A to K).',
        freecellRulesFreeCells: '💠 Free Cells',
        freecellRulesFreeCellsText: '4 free cells (💠) can temporarily hold 1 card each. Use them strategically!',
        freecellRulesTableau: '🃏 Columns',
        freecellRulesTableauText: 'Cards must be placed in descending order and alternating colors (red on black, black on red).',
        freecellRulesStrategy: '🧠 Strategy',
        freecellRulesStrategyText: 'Almost every deal is solvable! The key is planning ahead and smart use of free cells.',

        // Rithmomachia
        rithmoName: 'Rithmomachia',
        rithmoDesc: '"Philosophers\' Chess" (1030)',
        rithmoTech: 'Tech: Philosophical Mathematics (20 Research)',
        rithmoCraft: 'Craft the Rithmomachia Board',
        rithmoNeedBoard: 'You don\'t have a Rithmomachia board!',
        rithmoTitle: 'Rithmomachia',
        rithmoSubtitle: 'Medieval game of numbers and geometry',
        rithmoVictoryCond: 'Victory conditions: Capture 3 opponent pyramids OR reach 160+ points',
        rithmoBtnPlay: 'Play',
        rithmoBtnClose: 'Close',
        rithmoBtnRules: 'Rules',
        rithmoLabelYou: 'You (white)',
        rithmoLabelAi: 'AI (black)',
        rithmoLabelPoints: 'points',
        rithmoLabelYourTurn: 'Your turn',
        rithmoLabelAiTurn: 'AI\'s turn',
        rithmoLegend: 'Legend: ○ circle | □ square | △ triangle | Number = piece value',
        rithmoTutMsg: 'Click on your piece (white) then on target square.',
        rithmoErrNotYours: 'That\'s not your piece!',
        rithmoErrNoMove: 'This piece cannot move!',
        rithmoErrInvalid: 'Invalid move!',
        rithmoCapture: 'You captured {value}!',
        rithmoAiMove: 'AI moved {type} to [{x}, {y}]',
        rithmoWinWhitePyr: 'You captured 3 pyramids!',
        rithmoWinBlackPyr: 'AI captured 3 pyramids!',
        rithmoWinPoints: 'You won by points!',
        rithmoWin: '🏆 Victory! {reason} +{reward} Research',
        rithmoLoss: '💀 Defeat. {reason}',

        // Rithmomachia Rules
        rithmoRulesTitle: 'Rithmomachia — Rules',
        rithmoRulesMovementTitle: '🎯 Movement',
        rithmoRulesMovementText: 'Circles move 1 square, Squares move 2, Triangles move 3. Pyramids combine all movement types.',
        rithmoRulesCaptureTitle: '⚔️ Capture',
        rithmoRulesCaptureText: 'You can capture an opponent\'s piece if your number matches a mathematical relationship (equality, multiple, or difference).',
        rithmoRulesVictoryTitle: '🏆 Victory',
        rithmoRulesVictoryText: 'Capture 3 opponent pyramids OR exceed 160 points from captured pieces.',
        rithmoRulesHistoryTitle: '📜 History',
        rithmoRulesHistoryText: 'The game dates from 1030 AD, played at medieval universities as an exercise in arithmetic and geometry.',

        // Common buttons
        btnPlay: 'Play 🎮',
        btnRules: '📖 Rules',

        // ── Senet ──────────────────────────────────────────────────────────────────
        senetName: 'Senet',
        senetDesc: 'Game of the Pharaohs (3100 BC)',
        senetTech: 'Tech: Senet — Game of Pharaohs (6 Research)',
        senetCraft: 'Craft the Senet Board',
        senetNeedBoard: 'You have no Senet board!',
        senetTitle: 'Senet',
        senetSubtitle: "The world's oldest board game",
        senetBtnPlay: 'Play',
        senetBtnNew: 'New Game',
        senetLabelMoves: 'Moves: {moves}',
        senetLabelYou: 'You',
        senetLabelAi: 'AI',
        senetLabelYourTurn: 'Your turn — cast the sticks',
        senetLabelAiTurn: "AI's turn...",
        senetBtnRoll: 'Cast Sticks',
        senetWin: '🏆 Victory! All stones passed through the afterlife. +{reward} Research',
        senetLoss: '💀 The AI moved all its stones first.',
        senetRulesTitle: 'Senet — Rules',
        senetRulesHistoryTitle: '📜 History',
        senetRulesHistoryText: 'Senet is the oldest recorded board game in the world (3100 BC). Egyptian pharaohs played it as preparation for the journey to the afterlife — 30 squares symbolise the soul\'s passage.',
        senetRulesGoalTitle: '🎯 Goal',
        senetRulesGoalText: 'Move all 5 of your stones across all 30 squares and off the board before your opponent.',
        senetRulesDiceTitle: '🎲 Throw-sticks',
        senetRulesDiceText: '4 sticks are cast — each lands light or dark side up. Number of light sides = number of steps (0–4). All dark = 5 steps.',
        senetRulesSpecialTitle: '⭐ Special Squares',
        senetRulesSpecialText: 'Square 15 (House of Rebirth): a stone must stop here. Squares 27–29: dangerous squares that send stones back to start. Square 30: safe exit.',

        // ── Backgammon (Tables) ────────────────────────────────────────────────────
        backgammonName: 'Tables',
        backgammonDesc: 'Ancestor of Backgammon',
        backgammonTech: 'Tech: Tables — Journey of Stones (8 Research)',
        backgammonCraft: 'Craft the Tables Board',
        backgammonNeedBoard: 'You have no Tables board!',
        backgammonTitle: 'Tables',
        backgammonSubtitle: 'Medieval ancestor of Backgammon',
        backgammonBtnPlay: 'Play',
        backgammonBtnNew: 'New Game',
        backgammonBtnRoll: 'Roll Dice',
        backgammonLabelYou: 'You (white)',
        backgammonLabelAi: 'AI (black)',
        backgammonLabelYourTurn: 'Your turn',
        backgammonLabelAiTurn: "AI's turn...",
        backgammonLabelDice: 'Dice: {d1} and {d2}',
        backgammonWin: '🏆 Victory! All stones home. +{reward} Research',
        backgammonLoss: '💀 The AI bore off all its stones first.',
        backgammonRulesTitle: 'Tables — Rules',
        backgammonRulesHistoryTitle: '📜 History',
        backgammonRulesHistoryText: 'Tables is the medieval ancestor of Backgammon, popular in monasteries and taverns from the 12th to 15th century. Played across the world from England to Persia.',
        backgammonRulesGoalTitle: '🎯 Goal',
        backgammonRulesGoalText: 'Move all 15 of your stones into your home quarter and bear them off before your opponent.',
        backgammonRulesMoveTitle: '♟️ Movement',
        backgammonRulesMoveText: 'Players alternate rolling two dice. Stones move in opposite directions. A point with one stone is vulnerable — the opponent can hit it to the bar.',
        backgammonRulesHitTitle: '⚔️ Hitting',
        backgammonRulesHitText: 'A stone on the bar must re-enter the game before the player can move other stones. It enters on the opponent\'s home quarter.',

        // ── Draughts ───────────────────────────────────────────────────────────────
        draughtsName: 'Draughts',
        draughtsDesc: 'Game of Ladies and Lords',
        draughtsTech: 'Tech: Draughts — Game of Ladies (10 Research)',
        draughtsCraft: 'Craft the Draughts Board',
        draughtsNeedBoard: 'You have no Draughts board!',
        draughtsTitle: 'Draughts',
        draughtsSubtitle: 'From Arabic Alquerque (10th cent.)',
        draughtsBtnPlay: 'Play',
        draughtsBtnNew: 'New Game',
        draughtsLabelYou: 'You (white)',
        draughtsLabelAi: 'AI (black)',
        draughtsLabelYourTurn: 'Your turn',
        draughtsLabelAiTurn: "AI's turn...",
        draughtsLabelCaptured: 'Captured: {n}',
        draughtsPromoted: 'King! Piece promoted.',
        draughtsWin: '🏆 Victory! +{reward} Research',
        draughtsLoss: '💀 Defeat. The AI won.',
        draughtsDraw: '🤝 Draw.',
        draughtsRulesTitle: 'Draughts — Rules',
        draughtsRulesHistoryTitle: '📜 History',
        draughtsRulesHistoryText: 'Draughts descends from the Arabic game Alquerque (10th cent.). It reached Europe via Spain around 1100 and spread rapidly as a favourite pastime of nobility and commoners alike.',
        draughtsRulesGoalTitle: '🎯 Goal',
        draughtsRulesGoalText: "Capture or block all of your opponent's pieces.",
        draughtsRulesMoveTitle: '♟️ Movement',
        draughtsRulesMoveText: 'Pieces move diagonally one square forward. A jump over an opponent\'s piece captures it — and if a jump is possible, it is mandatory.',
        draughtsRulesKingTitle: '👑 King',
        draughtsRulesKingText: 'A piece reaching the far row becomes a King — it may move diagonally in any direction.',

        // ── Hnefatafl ──────────────────────────────────────────────────────────────
        hnefataflName: 'Hnefatafl',
        hnefataflDesc: "The Royal Viking Game",
        hnefataflTech: 'Tech: Hnefatafl — King\'s Game (14 Research)',
        hnefataflCraft: 'Craft the Hnefatafl Board',
        hnefataflNeedBoard: 'You have no Hnefatafl board!',
        hnefataflTitle: 'Hnefatafl',
        hnefataflSubtitle: 'Viking royal game (400–1100 AD)',
        hnefataflBtnPlay: 'Play',
        hnefataflBtnNew: 'New Game',
        hnefataflLabelAttacker: 'Attackers (black)',
        hnefataflLabelDefender: 'Defenders (white)',
        hnefataflLabelYourTurn: 'Your turn',
        hnefataflLabelAiTurn: "AI's turn...",
        hnefataflLabelCaptured: 'Captured: {n}',
        hnefataflKingEscaped: '🏆 The King escaped! You win. +{reward} Research',
        hnefataflKingCaptured: '💀 The King was captured. AI wins.',
        hnefataflRulesTitle: 'Hnefatafl — Rules',
        hnefataflRulesHistoryTitle: '📜 History',
        hnefataflRulesHistoryText: 'Hnefatafl (the King\'s Game) was played by the Vikings from the 4th to the 11th century. It vanished with the arrival of chess. Its asymmetric design — attackers vs. defenders — is unique in gaming history.',
        hnefataflRulesGoalTitle: '🎯 Goal',
        hnefataflRulesGoalText: 'Defenders: move the King to a corner square. Attackers: surround the King on all four sides (or three sides plus the board edge).',
        hnefataflRulesMoveTitle: '♟️ Movement',
        hnefataflRulesMoveText: 'All pieces move like the rook in chess — any number of squares in a straight line. No jumping.',
        hnefataflRulesCaptureTitle: '⚔️ Capture',
        hnefataflRulesCaptureText: 'A piece is captured when the opponent flanks it on two opposite sides. The King requires flanking on all four sides (or three sides plus the board edge).',
    },

    cellarium: {
        title: 'Cellarium',
        benedict: 'Benedikt of Litomyšl',
        benedictRole: 'Cellarius · monastic steward',
        motto: '"Quid offers? Quid quaeris?" — What dost thou offer? What dost thou seek?',
        mottoEmpty: '"Arca vacua est." — The treasury lies empty. I pray for better days.',
        mottoPoor: '"Pecunia deficit." — The coins run thin, brother. Sell something.',
        mottoShuttered: '"Taberna clausa est." — The tavern is not yet open. Come after Vespers.',
        mottoFull: '"Horreum plenum est!" — The stores are bursting. Sell before it rots.',
        mottoRich: '"Deus laboriosus benedicit." — The treasury sings! God blesses the industrious.',
        grose: 'groschen',
        have: 'Have',
        price: 'Price',
        sellPrompt: 'Select quantity and sell:',
        nothingToSell: 'Nothing to sell.',
        closed: 'Closed now.',
        lockedMsg: 'Unlock <strong>Cellarium — Order of the Cellar</strong> to access Benedikt.',
        lockedMsgPre: 'Unlock <strong>Commercium — Merchant Routes</strong> for first contact with traders.',
        numLocked: 'Benedikt welcomes thy visit, but trade stands still. Unlock <strong>Numismatica — The Science of Groschen</strong> for full access.',
        soldNotify: '+{total} groschen for {qty}× {item}',
        boughtNotify: 'Purchased: {qty}× {item} for {total} groschen',
        noGrose: 'Insufficient groschen!',
        entityOpen: 'OPEN',
        entityClosed: 'CLOSED',
        buySection: 'Buy from {entity}:',
        tavernHours: 'daily 14:00–02:00',
        shopHours: 'Mon–Fri 09:00–17:00',
        marketHours: 'Sat–Sun 08:00–16:00',
        giacomoTitle: 'Giacomo Foscari has arrived!',
        giacomoSubtitle: 'Venetian merchant · trader from afar',
        giacomoGreeting: '"Salve, fratello! I have brought goods from distant lands — from Venice, from the Levant, from places where the sun burns differently. See what I have for thee..."',
        giacomoBtnClose: 'Close the gate',
        giacomoBtnVisit: 'Visit at the Market',
        heinrichTitle: 'Heinrich Traxdorf from Nuremberg',
        heinrichSubtitle: 'Organ builder · weekly visit',
        heinrichGreeting: '"My organs resound in churches from Prague to Basel! I cast the pipes from Nuremberg tin — the finest in all the Empire. Dost thou require a set of pipes?"',
        heinrichBtnClose: 'Not today',
        heinrichBtnBuy: 'Buy organ (600 💰)',
        heinrichAlready: '(Thou already hast an organ)',
    },

    invFilter: {
        all:     'All',
        mat:     '🌾 Materials',
        tool:    '🔨 Tools',
        lore:    '📜 Writings',
        animal:  '🐄 Animals',
        food:    '🍖 Food',
        alchemy: '⚗️ Alchemy',
        stone:   '🪨 Stone',
        iron:    '⚒️ Iron',
        fire:    '🔥 Fire',
        other:   '🗝️ Miscellaneous',
    },
    craftFilter: {
        all: 'All',
        stone: '🪨 Stone',
        iron: '⚒️ Iron',
        craft: '🪵 Crafting',
        fire: '🕯️ Fire',
        parchment: '📜 Parchment',
        codex: '📖 Codex',
        food: '🍖 Provisions',
        alchemy: '⚗️ Alchemy',
        lore: '🎲 Knowledge',
    },
    dvur: {
        dashTitle: 'Farmyard status',
        tab_kurnik: 'Henhouse',
        tab_kosar: 'Sheepfold',
        tab_kotce: 'Hutches',
        tab_chlevy: 'The Byres',
        tab_mastal: 'Stable',
        tab_studna: 'Well',
        tab_columbarium: 'Dovecote',
        catFed: 'fed, resting',
        catHunting: 'hungry — hunting at night',
        decayImpact: 'Mice speed up the spoilage of grain, bread and cheese.',
        comingSoon: 'Research complete. The enclosure is being prepared — animals arrive soon.',
        notEnough: 'Not enough materials.',
        penFull: 'The pen is full.',
        noAnimal: 'No animal to place. Buy at the Market (weekends).',
        buyAtMarket: 'Animals are bought at the Market — open on weekends.',
        occupancy: 'Occupancy',
        have: 'have',
        title_rabbitry: 'Cuniculi (Rabbit Hutch)',
        title_goatpen: 'Caprile (Goat Pen)',
        title_cowbyre: 'Armentum (Cow Byre)',
        title_pigsty: 'Suile (Pigsty)',
        buildDesc_rabbitry: 'A wooden rabbit hutch. Two rabbits suffice — they handle the rest themselves.',
        buildDesc_goatpen: 'A pen for goats. Milk even in winter, hides for parchment.',
        buildDesc_cowbyre: 'A stone cow byre. A cow gives far more milk than a goat, but costs more and eats more.',
        buildDesc_pigsty: 'A sturdy sty of cut stone. A piglet matures in two months — then comes the slaughter.',
        title_stable: 'Stabulum (Stable)',
        buildDesc_stable: 'A stone stable for horses. The monastery needs it for distant markets and representation.',
        place_stable: 'Stable a horse',
        placed_stable: '🐎 Horse stabled.',
        build_rabbitry: 'Build rabbit hutch',
        build_goatpen: 'Build goat pen',
        build_cowbyre: 'Build cow byre',
        build_pigsty: 'Build pigsty',
        built_rabbitry: 'Rabbit hutch built.',
        built_goatpen: 'Goat pen built.',
        built_cowbyre: 'Cow byre built.',
        built_pigsty: 'Pigsty built.',
        place_rabbitry: 'Place rabbit',
        place_goatpen: 'Place goat',
        place_cowbyre: 'Place cow',
        place_pigsty: 'Place piglet',
        placed_rabbitry: '🐇 Rabbit settled in the hutch.',
        placed_goatpen: '🐐 Goat in the pen.',
        placed_cowbyre: '🐄 Cow in the byre.',
        placed_pigsty: '🐷 Piglet in the sty. Feed it acorns!',
        breeding: 'A pair of rabbits is getting along — expect newcomers.',
        rabbitBorn: 'A kit was born in the hutch!',
        slaughterRabbit: 'Slaughter rabbit (meat + pelt)',
        rabbitSlaughtered: 'Rabbit slaughtered: +1 meat, +1 pelt.',
        milkGoats: 'Milk the goats',
        goatMilked: 'Collected {n}× goat milk.',
        goatNotReady: 'The goats are not ready for milking yet.',
        milkCow: 'Milk the cows',
        cowMilked: 'Collected {n}× cow milk.',
        cowNotReady: 'The cows are not ready for milking yet.',
        feedAcorn: 'Acorn',
        noAcorn: 'No acorns. Available at the Market.',
        acornFed: 'The pig munches happily. Growth sped up by 5 days.',
        pigGrowing: 'Growing...',
        pigMature: 'Mature — ready for slaughter',
        slaughterPig: 'Slaughter',
        pigSlaughtered: 'Pig slaughter! +4 meat, +3 lard, +2 cured meat.',
        slaughterCow: 'Slaughter cow',
        cowSlaughtered: 'Cattle slaughter! +5 beef, +2 cured beef, +2 hide.',
        buildInCellarium: 'Order construction in the Cellarium → Buildings (Farmyard section).',
        penHungry: 'The animals are hungry! Production halted — restock feed (the Horreum feeds automatically).',
        goatsHungry: 'The goats are hungry and give no milk. Restock hay.',
        cowsHungry: 'The cows are hungry and give no milk. Restock hay.',
        feedStock: 'Feed',
        feedHay: 'hay',
        feedGrain: 'grain',
        days: 'days',
        rabbitMature: 'Mature — ready for slaughter',
        rabbitGrowing: 'Growing...',
        rabbitNotMature: 'The rabbit is not yet mature. Wait 4 days.',
        daysLeft: 'days',
        milkReady: 'Ready to milk',
        nextMilk: 'Next milk',
        goatLabel: 'Goat',
        mineBonus: 'Mine bonus',
        mineBonusDesc: '(horses speed up mining)',
        horseLabel: 'Horse',
        noBonus: 'none',
        needRam: 'You need a ram for breeding — arrange a loan in the Saeculum (Forum Pecuarium).',
        built_donkeyStall: 'Donkey stall built.',
        title_donkeyStall: 'Donkey Stall (Asinus)',
        buildDesc_donkeyStall: 'A shelter for the donkey. Powers the well, hauls to the fields, grants +15% field yield.',
        lockedPrefix: 'Requires research:',
        mice_label: 'Mice',
        mice_scraps: 'Scraps eaten/day',
        mice_decay: 'Decay multiplier',
        mice_net_per_day: '/day',
        feedScraps: 'scraps',
    },
    decay: {
        lossMsg: 'Spoiled: {items}. Details in the Inventarium (Cellarium).',
        overflowNote: 'Stores are overflowing — the surplus spoils twice as fast!',
        overflowWarn: 'Stores overflowing! Goods above capacity spoil at double speed.',
        discardAll: 'ALL',
        discardConfirm: 'Really discard the whole stack: {qty}× {item}?',
        discarded: 'Discarded: {qty}× {item}',
        trapBroken: 'A mousetrap broke ({n}×).',
        lastLosses: 'Yesterday\'s losses',
        miceNone: 'The cloister is quiet. Mice pose no threat to the stores.',
        miceFew: 'A faint scurrying behind the walls at night. Grain slowly dwindles.',
        miceSome: 'Mice have been seen near the granary. Grain, bread and cheese spoil faster.',
        miceMany: 'A mouse paradise! Droppings in the flour, holes in the sacks. The stores suffer.',
        fliesNone: 'The Farmyard is quiet. Flies pose no threat to the stores.',
        fliesFew: 'A few flies buzz around the pens. Nothing serious.',
        fliesSome: 'Flies gather at the uncleared manure. Meat and cheese spoil faster.',
        fliesMany: 'Swarms of flies over the Farmyard! Raw meat and fish stores suffer. Clean the pens or get a fly trap.',
    },
    felis: {
        locked: 'The cat roams the cloister wild and wary. Research Cura Felium to care for her.',
        defaultName: 'Nameless mouser',
        age: 'Age',
        namePlaceholder: 'Name the cat...',
        satiety: 'Satiety',
        affection: 'Affection',
        huntDrive: 'Hunting drive',
        feedTitle: 'Feed',
        noFood: 'You have nothing the cat would eat. Cream, fish, meat...',
        caught: 'Mice caught',
        stolenCount: 'Stolen from stores',
        shameHall: 'Hall of shame',
    },
    saeculum: {
        mola: 'Mola (Mill)',
        millActive: 'The mill is already grinding — wait until it is done.',
        millNoGold: 'Not enough groats for the trip to the miller.',
        millSent: 'Grain sent to the mill. Returns as flour in 4 hours.',
        millCollected: 'Flour collected from the mill.',
        millCollect: 'Collect',
        milling: 'Milling',
        readyIn: 'ready in',
        millCostNote: '4 hours, 3 groats per trip',
        millTo: 'mill',
    },
    farmyard: {
        gallinarium: 'Gallinarium (Henhouse)',
        ovile: 'Ovile (Sheepfold)',
        buildHenhouse: 'Build henhouse',
        hennhouseBuildDesc: 'Build a henhouse to raise hens. Produces eggs and feathers.',
        buildSheepfold: 'Build sheepfold',
        sheepfoldBuildDesc: 'Build a sheepfold to raise sheep. Produces milk, wool and hide.',
        ovileLocked: 'Unlock the De Re Rustica technology to access the sheepfold.',
        columbarium: 'Columbarium (Dovecote)',
        columbariumBuildDesc: 'Wicker nesting niches for the messenger pigeons. The Abbot will send a flock once it is built.',
        columbariumBuilt: 'Columbarium built. Awaiting pigeons from the abbey.',
        columbariumCollected: 'Eggs and feathers collected from the Columbarium.',
        columbariumWhitewash_btn: 'Whitewash the walls with lime',
        columbariumWhitewashed: 'Walls whitewashed with lime. Martens and snakes can no longer climb in.',
        columbariumPredatorRisk: 'Unwhitewashed walls — a marten or snake occasionally steals a pigeon.',
        hens: 'Hens',
        rooster: 'Rooster',
        sheep: 'Sheep',
        eggs: 'Eggs',
        feathers: 'Feathers',
        milk: 'Milk',
        wool: 'Wool',
        ready: '✓ Ready',
        collect: 'Collect',
        feed: 'Feed',
        addRooster: 'Add rooster',
        addSheep: 'Add sheep',
        slaughterSheep: 'Slaughter sheep',
        nesting: 'Nesting (hatching)',
        startNesting: '🥚 Start nesting',
        nestingProgress: 'The hen broods upon her eggs',
        chicksGrowing: 'Chicks growing ({n} pcs)',
        chickPool: 'Chicks ready to slaughter',
        breeding: 'Lamb rearing',
        startBreeding: '🐑 Start breeding',
        gestating: 'Ewe is with lamb',
        lambGrowing: 'Lamb is growing',
        lambPool: 'Lambs ready to slaughter',
        clean: 'Clean pen',
        cleanDone: 'Pen cleaned! +{n}× manure.',
        cleanCooldown: 'You can clean again tomorrow.',
        cleanTomorrow: 'Tomorrow',
        addDonkey: 'Tie the donkey',
        donkeyStallTitle: 'Donkey Stall (Asinus)',
        donkeyBuildDesc: 'A shelter for the donkey. Powers the well, hauls to the fields, grants +15% yield.',
        donkeyStallBuilt: 'Donkey stall built.',
        donkeyPlaced: 'Donkey tied up. Ouško is home.',
        donkeyDefault: 'Ouško',
        donkeyRename: "What is the donkey's name?",
        donkeyStubborn: '{name} refused to work today.',
        borrowNoGold: 'Not enough groschen for the loan.',
        borrowActive: 'A loan is already in progress.',
        borrowDone_ram: 'A ram has arrived from the village.',
        borrowDone_billy_goat: 'A billy goat has arrived from the village.',
        borrowDone_boar: 'A boar has arrived from the village.',
        needRam: 'You need a ram for breeding — arrange a loan in the Saeculum.',
        loanActive_ram: 'Ram on loan',
        loanActive_billy_goat: 'Billy goat on loan',
        loanActive_boar: 'Boar on loan',
        feedSlug: 'Feed slugs', slugFed: '🐌 Hens feasted on slugs. +25% eggs for 8h.',
        slugBonus: 'Slug bonus', needSlug: 'Not enough slugs (2× per hen)',
    },
    // ── VALETUDO (Health System) ────────────────────────────────────────────
    health: {
        cured: '{name} cured.',
        expired: '{name} has passed.',
    },
    // ── PORTA (correspondence) ───────────────────────────────────────────────
    porta: {
        title: 'Porta',
        intro: 'The monastery\'s pigeon post — news from near and far.',
        empty: 'No new letters.',
        open: 'Open',
        archive: 'Archive',
        locked: 'The dovecote does not yet stand. Porta awaits the Abbot\'s decision.',
        cannotAfford: 'You lack the means for this choice.',
    },
    // ── SCRINIUM ABBATIS ─────────────────────────────────────────────────────
    scrinium: {
        title: 'Scrinium Abbatis',
        subtitle: "The Abbot's Private Library",
        locked_title: 'Entry Forbidden',
        locked_text: '"Nondum tempus tuum venit, frater." — Thy time hath not yet come, brother.',
        locked_hint: 'Earn the favour of the Abbot, that he may open this chamber unto thee.',

        subtabs: {
            bestiar: '🐉 Bestiary',
            herbar: '🌿 Herbarium',
            kroniky: '📜 Chronicles',
            tajne_spisy: '🔐 Secret Writings',
            mapy: '🗺️ Maps',
        },

        folio: {
            not_found: 'This folio hath not yet been found.',
            found: 'Folio found',
            physical_scroll: '📜 Scroll',
            physical_leaf: '📃 Loose Leaf',
            physical_codex: '📖 Codex',
            physical_map: '🗺️ Map',
            btn_lectio: 'Lectio (read)',
            btn_glossa: 'Glossa (translate)',
            btn_arcanum: 'Arcanum (decipher)',
            btn_done: '✓ Read',
            layer_lectio: 'Lectio',
            layer_glossa: 'Glossa',
            layer_arcanum: 'Arcanum',
            cost_label: 'Requireth:',
            err_no_item: 'Thou lackest the necessary materials.',
        },

        folios: {

            epistola: {
                title: 'Epistola de Rebus Ignotis',
                lectio: `*The scroll is scorched at its edges. Part of the text is missing. The Latin heading is barely legible.*

"Est locus post murum, ubi ignis non dormit. Ibi calor perpetuus servat formas rerum, quae oculis communibus non patent..."

— A fragment of a letter to an unknown addressee. Year unknown.`,

                glossa: `*By careful study in candlelight the words begin to yield their meaning.*

"There is a place behind the wall, where fire sleepeth not. There eternal heat preserveth the forms of things hidden from common eyes."

The writer speaks of a room or chamber with a constant fire — perhaps a furnace. He mentions three phases of the transformation of matter. The words are deliberately veiled. Who wrote this letter — and to whom?`,

                arcanum: `*The final lines of the scroll, concealed behind a scorched fold:*

"Qui scit verbum, intrat. Verbum est: exordium."

— He who knoweth the word, entereth. The word is: exordium.

*In the lower right corner of the scroll is a drawing — a circle with a triangle within. The symbol of the athanor.*`,

                reward_notify: '🔥 The Athanor is unlocked! The furnace behind the wall is thine.',
            },

            fausto: {
                title: 'De Fausto Contractu',
                lectio: `*A loose leaf, greasy with tallow-candle stains. The signature at the end is struck through.*

"Hear ye who read: there was a man who made a compact beyond all reason. For the swift completion of his great work — in a single night — he sold that which was most precious."

— A fragment. No title, no author.`,

                glossa: `*By comparing with other documents, a name and place become clear.*

Johann Fust, Mainz, anno Domini 1455. Gutenberg's press passed into other hands — not by law, as the chronicles say, but otherwise. Schöffer testified against his master. Gutenberg lost everything.

The people whispered: no man prints so swiftly without aid from dark powers. "Fust" — "Faust". The names blurred together. The legend was born.`,

                arcanum: `*On the reverse of the leaf, written in another hand, in small script:*

"I offer the same. Sign, and thy work shall be completed. Materials shall multiply, knowledge shall advance.
Or refuse — and remain what thou art: an honest craftsman without shortcut."

— The signature is absent. Only the place for thine remaineth.`,

                choice_prompt: 'What wilt thou do?',
                choice_sign: '✍️ Sign the compact',
                choice_refuse: '🙏 Refuse',
                signed_notify: '😈 The compact is signed. A fleeting boon — but at a price.',
                refused_notify: '✝️ Thou hast refused. Honest labour taketh longer — but thy soul remaineth thine own.',
                achievement: 'I Resisted',
            },

            palimpsest: {
                title: 'Ars Palimpsesti',
                lectio: `*A loose leaf, beneath the text the traces of an older layer are visible — like the shadow of a former hand.*

"De arte radendi et rescribendi. On the art of scraping and rewriting."

A technical description in Latin. It mentions pumice, a knife, a wet cloth. The process in five steps.`,

                glossa: `*After reading the whole leaf, an older text appears beneath — legible in the oblique light of a candle.*

Beneath the recipe for scraping parchment lies an older text: a fragment of verse.

"Omnia mutantur, nihil interit." — All things change, nothing perisheth.

The parchment was once someone's chronicle. Then it became a recipe. What shall it become next?`,

                arcanum: `*At the lower margin, concealed in a fold:*

"Pumice and water. Scrape. Let it dry. Write again. Nothing is lost — it only changeth its face."

This method may be employed in the workshop. Spent parchment is not waste — it is a new beginning.

*Recipe unlocked: Parchment Recycling*`,

                reward_notify: '📋 New recipe unlocked: Parchment Recycling.',
            },

            titivillus: {
                title: 'De Titivillo Daemone',
                lectio: `*A codex furnished with numerous marginalia — small pointing hands ☞ mark the key passages.*

"De daemone qui in scriptoriis habitat. Of the demon who dwelleth in scriptoria."

In every scriptorium lurks Titivillus. His task is not to tempt to sin — others do that. Titivillus collecteth errors.`,

                glossa: `*The marginalia are denser than the text itself. One of them readeth:*

"I have seen him. Small, grey, silent. He passeth among the desks. He hath a sack of goatskin. He collecteth omitted letters, transposed syllables, mangled words. Each day he carrieth the sack to the devil."

"After death the monk shall be judged. Titivillus shall empty the sack upon the scales. Each error shall weigh."`,

                arcanum: `*The final page of the codex — written in different ink, as though added much later:*

"Titivillus sleepeth not. He watcheth most keenly when the darkness falleth and the scribe is weary. The light of a candle repelleth him — but only true light."

*From this hour thou shalt see a gentle warning in thy workshop when Vigour sinketh too low.*`,

                reward_notify: "👁️ Titivillus's warning: thou shalt now see when errors threaten thy manuscripts.",
            },

            // ── Scrinium Recipe Folios MRD — 7 folios, 23 Athanor recipes ──
            scr01: {
                title: 'Codex Coloris Perditi',
                lectio: `*A codex bound in brown leather, its spine cracked with age. The first page is missing — torn out, or rotted away.*

"...secundum Theophilum, quod pictor sciens tenere debet." — According to Theophilus, what a knowing painter ought to hold.

The rest of the first chapter is illegible. Water hath done its work.`,
                glossa: `*The second chapter hath fared better.*

The author citeth an old monk named Theophilus — perhaps of Helmarshausen, perhaps elsewhere — and his manual for painters, glassworkers and goldsmiths. Colours, it seemeth, are not mere colours. They are recipes passed hand to hand, generation to generation, and he who forgetteth them forgetteth the craft itself.

"Lost colours" — a title that maketh sense only now.`,
                arcanum: `*The final pages, densely written in small script — recipes, one after another.*

"Lead white, red lead and ochre, ground together, yield the colour of living skin."

"That same colour, deepened with sinopia, casteth a shadow beneath eye and cheek — and the face cometh alive."

"Pure verdigris with the stone of the Afghan mountains, mingled, yield a colour fit for a king's robe."

*Recipes unlocked: Flesh Tone, Shading Paint, Regal Pigment.*`,
                reward_notify: '🎨 Codex Coloris Perditi studied. 3 recipes unlocked.',
            },
            scr02: {
                title: 'Notata Fornacis',
                lectio: `*A scroll scorched at one end — perhaps in the very furnace-fire it speaketh of.*

"Notata de arte vitri." — Notes on the art of glass, set down by the furnace while memory yet burneth like the fire itself.`,
                glossa: `*The text describeth the glassworks where the author learned his trade.*

The glassmaker, it seemeth, could neither read nor write Latin — yet he knew fire better than any monk knoweth the psalter. A scribe who visited the works set down what he heard. The colours of glass, saith the glassmaker, are no magic. They are metals — copper, tin, lead — each lending the glass a different soul.`,
                arcanum: `*The final leaf, in the rougher hand of the glass-master:*

"Copper, calcined and melted with lye, giveth glass green as moss."

"Tin ash with chalk giveth glass white and covering — for vessels, not for windows."

"Litharge with lye giveth glass heavy and soft, easily cut and ground."

*Recipes unlocked: Green Glass, White Glaze, Lead Glass.*`,
                reward_notify: '🔥 Notata Fornacis studied. 3 recipes unlocked.',
            },
            scr03: {
                title: 'Liber Medicaminum Arcanorum',
                lectio: `*A codex of small size, easily hidden in a habit's sleeve. Perhaps that was its very purpose.*

"Liber medicaminum arcanorum, quem non omnis frater legere debet." — The book of arcane remedies, which not every brother may read.

Why arcane? Herbs, surely, are no sin.`,
                glossa: `*The second page explaineth the reason for secrecy.*

Some recipes in the book belong to the infirmarian. Others belong to the town's barber-surgeon — a layman who doth what the Rule forbids to monks. The author gathered both, heedless of whose recipe it was. The Abbot would not have liked that.

"A remedy asketh no leave as to whom it may belong."`,
                arcanum: `*Recipes, one after another, in a neat hand:*

"Comfrey with wax and linseed oil, boiled together, healeth fracture and bruise alike."

"Yarrow steeped in vinegar — Achilles is said to have healed his soldiers' wounds with it before the walls of Troy."

"Juniper boiled with honey easeth gout and the ache of joints."

"Hyssop boiled with wine relieveth cough and tightness of the chest."

*Recipes unlocked: Comfrey Salve, Yarrow Tincture, Juniper Syrup, Lung Elixir.*`,
                reward_notify: '🌿 Liber Medicaminum Arcanorum studied. 4 recipes unlocked.',
            },
            scr04: {
                title: 'Testamentum Ultimum',
                lectio: `*A codex bound in black leather, unadorned. The weight of the volume is out of proportion to its thinness — as though something were sewn into the boards.*

"Testamentum ultimum." — The final testament. The author left no name. Perhaps by design.`,
                glossa: `*The introduction speaketh of death, and of what remaineth after it.*

The author, it seemeth, spent a life seeking two things: a remedy against every poison, and a substance that would return a day of youth to a weary body. The first he found — or so he believed. The second he sought until his last breath.

"I leave no gold. I leave a recipe."`,
                arcanum: `*The final two pages, written in a hand already trembling with age:*

"Wormwood, gentian and honey, boiled with wine — a simple theriac, but a theriac still. Not the sixty-four ingredients of the old masters, but what a monastery hath to hand."

"And for one who desireth more: spirit of wine, honey and honeyed ultramarine, distilled together. I promise no immortality. I promise a day without weariness — and that is more than most men ever know."

*Recipes unlocked: Theriacum Monasticum, Elixir Vitae.*`,
                reward_notify: '👑 Testamentum Ultimum studied. 2 legendary recipes unlocked.',
            },
            scr05: {
                title: 'Herbarium Occultum',
                lectio: `*A gathering of leaves, stitched with cord rather than bound — as though the author was in haste, or had no coin for a bookbinder.*

"Herbarium occultum." — The hidden herbarium. Hidden from whom? The text doth not say.`,
                glossa: `*The recipes are plain, almost commonplace — why would anyone hide them?*

Perhaps not because they were dangerous. Perhaps because they worked better than the remedies sanctioned by the infirmary, and the author would not have them taken from him — or taxed. Poverty maketh secret-keepers of herbalists.`,
                arcanum: `*Three recipes, each in a different hand — perhaps written across the years, one at a time:*

"Plantain ground with wax healeth the wound of a pilgrim upon the road."

"Fennel boiled with honey easeth a swollen belly and a heavy stomach."

"Comfrey with yarrow and wax — a salve for all that aches and will not heal."

*Recipes unlocked: Plantain Salve, Fennel Syrup, Universal Salve.*`,
                reward_notify: '🌱 Herbarium Occultum studied. 3 recipes unlocked.',
            },
            scr06: {
                title: 'Fragmenta Alchemiae',
                lectio: `*Several loose leaves, of different ages and hands, bound together later by someone who deemed them precious but did not know how they were joined.*

"Fragmenta." — Fragments. An accurate description.`,
                glossa: `*One theme joineth the fragments: how to make common clay and stone into something that outlasteth the ages.*

Malachite from the mountains. Alum from trade. Bone from the slaughterhouse. Orpiment from the mine. Seemingly unrelated things — yet all solving the same problem: how to make a colour or a glue cling to vellum longer than a human life endureth.`,
                arcanum: `*Four recipes, four different hands:*

"Malachite ground with gum and water giveth a green as old as Egypt."

"Alum with chalk and gum bindeth dye so damp cannot wash it away."

"Bone ash with linseed oil giveth a putty beneath gilding."

"Orpiment with gum giveth a yellow golden to the eye — for one who cannot afford true gold."

*Recipes unlocked: Malachite Green, Universal Mordant, Bone Putty, Golden Yellow Pigment.*`,
                reward_notify: '⚗️ Fragmenta Alchemiae studied. 4 recipes unlocked.',
            },
            scr07: {
                title: 'Secretum Vitriarii',
                lectio: `*A sealed scroll, though the seal was long since broken — another read it before I.*

"Secretum vitriarii." — The glassmaker's secret. Yet the scroll speaketh not of glass alone.`,
                glossa: `*The author was a glassmaker, or a smith — perhaps both. The furnace and the forge shared more than one might think.*

Alloys of metal, varnishes for wood and vellum, a poison that whiteneth copper instead of killing — all the craft of one man who could read fire as others read books.`,
                arcanum: `*The final four notes, crowded into the scroll's margin:*

"Tin and lead, melted together, give pewter — solder and tableware alike."

"Copper and tin, melted, give bronze — a bell, a tool, a statue."

"Sandarac dissolved in spirit of wine giveth a varnish clear as glass itself."

"Arsenic with chalk whiteneth copper — Albertus Magnus wrote of it. Poison or remedy, according to who holdeth it."

*Recipes unlocked: Tin-Lead Alloy, Bronze, Sandarac Varnish, Copper Whitener.*`,
                reward_notify: '⚒️ Secretum Vitriarii studied. 4 recipes unlocked.',
            },

            // ── Herbarium ────────────────────────────────────────────────────
            signatura: {
                title: 'De Signatura Rerum',
                lectio: '*A loose leaf, its edges smoothed by frequent handling.*\n\n"Deus omnem herbam signavit forma sua." — God hath marked every herb with its own likeness.\n\nA list of plants and their shapes follows.',
                glossa: '*Study reveals logic, not superstition.*\n\nThe walnut resembleth the brain — it healeth the head. The lungwort beareth spotted leaves like lungs — it healeth the cough. The bean is shaped as a kidney — it healeth the kidney.\n\nThe doctrine holds: God inscribed upon every plant a sign of its healing purpose. One need only learn to read it.',
                arcanum: '*In the margin, in small script:*\n\n"He who seeketh signs shall find them everywhere — even where none exist. Take heed, brother. The signature showeth a path, not a certainty."\n\n*From this hour thou shalt perceive a subtle hint of each herb\'s healing purpose in thy garden.*',
                reward_notify: "🌿 The Doctrine of Signatures understood. The herbs now reveal more.",
            },
            hildegardis: {
                title: 'Hildegardis de Herbis',
                lectio: '*A codex, plainly bound but carefully kept. On the first page, a name: Hildegardis.*\n\n"Physica — on the nature of various created things." Written by a nun of Bingen, more than three hundred years past.',
                glossa: '*The text explains why these very herbs belong in a monastery garden.*\n\nChamomile — "mother of herbs," calmeth body and mind alike. Thyme — purifieth the air, healeth wounds, driveth pests from the hives. Hildegard recommended them together, steeped and sweetened with honey.\n\n"What groweth near the cloister is oft a remedy for what troubleth the cloister most."',
                arcanum: '*The final page bears a recipe, written in another hand — perhaps a scribe, centuries later:*\n\n"Chamomile and thyme, in equal part. Pour boiling water upon them. Sweeten with honey. Drink at dusk."\n\n*Recipe unlocked: Hildegard\'s Tisane.*',
                reward_notify: "🍵 New recipe unlocked: Hildegard's Tisane.",
            },
            miasma: {
                title: 'Miasma et Odor Malus',
                lectio: '*A scroll, its edges stained with wax — perhaps protective, perhaps accidental.*\n\n"De aere corrupto." On corrupted air. Author unknown; the time of its writing uncertain — perhaps after the great plague.',
                glossa: '*The text describes a theory believed and doubted in equal measure.*\n\nDisease, it is said, cometh not from touch but from the air — from marshes, from the unburied dead, from foul odor. Protection: scented vinegars, herbs held to the nose, a beaked mask filled with dried flowers.\n\n"Where it stinketh, tarry not. Where it is sweet, thou mayest dwell."',
                arcanum: '*In the margin, another hand, unsettlingly specific:*\n\n"I have seen it myself. A scribe who labored in darkness and hunger fell ill sooner than those who had light and bread. Perhaps \'tis the air. Perhaps something else. Who knoweth what the body shall yet reveal, before its turn cometh?"',
            },
            mandragora: {
                title: 'Mandragora Vociferans',
                lectio: '*A loose leaf, the ink smeared in places — perhaps from sweat, perhaps from fear.*\n\n"De radice clamante." On the shrieking root. A warning upon the first line: Read not at midnight.',
                glossa: '*The text describes the ritual of gathering, step by step.*\n\nA moonless night. No iron — only ivory or bone. A rope tied to the root, its other end about the neck of a starved dog. The gatherer\'s ears sealed with wax. Meat cast just beyond reach, that the dog might tear the root free in its stead.\n\nThe root is said to shriek. The dog payeth with its life. The gatherer surviveth — if all was done aright.',
                arcanum: '*On the reverse of the leaf, a soberer note, as though penned by another — less superstitious — hand:*\n\n"The root is poisonous, that much is certain truth. The shriek, perhaps not. But who would test whether the curse is merely a tale kept alive by merchants wishing to hold their price?"\n\n*Perhaps the garden itself shall reveal what it hideth — none can know beforehand what shall grow from an unknown seed.*',
            },
            theriaca: {
                title: 'Theriaca Universalis',
                lectio: '*A codex, heavy, bound in leather. On the first page, the crest of an unknown apothecary.*\n\n"Theriaca — a remedy against all poisons." King Mithridates, it is said, consumed poisons in small doses to build his resistance. Whence the name: Mithridatium.',
                glossa: "*The recipe is long — perhaps the longest thou hast ever seen.*\n\nSixty-four ingredients. Viper's flesh, opium, myrrh, honey, and many more whose names are now forgotten. Twelve years to mature. A price — higher than gold of equal weight.\n\n\"He who possesseth Theriac possesseth peace of mind. He knoweth that whatever poison may come, he holdeth a weapon against it.\"",
                arcanum: '*On the final page, a note almost illegible:*\n\n"I have heard that the abbot of an old monastery to the south possessed a furnace that could hasten what nature doeth slowly. Perhaps it could accomplish this too. Perhaps. I have never seen it with mine own eyes — only heard it told."\n\n*The Athanor may yet hide more than it seemeth.*',
            },

            // ── Netolický's Legacy ──────────────────────────────────────────
            netolicky_01: {
                title: 'The Privilege of Ferdinand (1527)',
                lectio: '*Parchment bearing a royal seal. The ink is faded in places, but the text remains legible.*\n\n"We, Ferdinand, by the grace of God King of Bohemia... do grant to Bartoloměj Netolický the exclusive right to print on the Lesser Town of Prague, without hindrance from any party..."\n\n— Original privilege. Lesser Town printing house, 1527.',
                glossa: '*On closer reading, the details emerge.*\n\nNetolický was a loyal Catholic — precisely what Ferdinand needed after the Battle of Mohács. Prague was in turmoil, the nobility resisting. But a printer with a royal privilege was untouchable.\n\nA monopoly on printing in Bohemia. At the price of loyalty.',
                arcanum: '*On the reverse of the privilege, in small script, another hand:*\n\n"Every privilege has its time. Ours ended in 1552. Melantrich came with money and young blood. What could I do?"\n\n— Netolický, old and tired.',
                reward_notify: '📜 +5 notes. The Privilege of Ferdinand studied.',
            },
            netolicky_02: {
                title: 'Price List of Prints (1541)',
                lectio: '*A loose leaf, greasy with ink stains. The figures are carefully aligned.*\n\nNew Testament — 8 groschen\nPsalter — 3 groschen\nCalendar — 1 groschen\nOrdinary — 5 groschen\n\n— Price list of Netolický\'s printing house, Lesser Town, 1541.',
                glossa: '*Comparison with other sources reveals the context.*\n\nDaily wage of a craftsman in Prague: 2–3 groschen. A calendar for 1 groschen was within anyone\'s reach. A psalter for 3 — a week\'s work. The New Testament for 8 — nearly a month.\n\nThe printed book had ceased to be a bishop\'s luxury. It had become a commodity.',
                arcanum: '*At the bottom, in pencil:*\n\n"We had to lower prices three times. Competition from Nuremberg. Paper dearer. Compositors dearer. And yet — the press feeds twelve families."\n\nThe economics of printing in a nutshell. It was always about the margin.',
                reward_notify: '📜 +5 notes. The Price List studied.',
            },
            netolicky_03: {
                title: 'Letter to Melantrich (1551)',
                lectio: '*A sheet folded into quarters. The fold is sharp — the letter was kept folded for a long time.*\n\n"Esteemed Master Melantrich, I come to you with an offer which — I hope — will be received in a spirit of mutual respect and benefit to both parties..."\n\n— Netolický, 1551. His last year before the transfer.',
                glossa: '*Between the lines, another truth emerges.*\n\nMelantrich did not come with an offer — he came with pressure. Netolický was ageing, in debt to the papermakers, his privilege expiring. The letter is courteous. But the courtesy of a desperate man.\n\n"Mutual respect" — words that conceal a surrender.',
                arcanum: '*On the reverse, in Melantrich\'s hand:*\n\n"Accepted. The workshop to be moved to the Old Town. Name: Melantrich of Aventino. Netolický to receive a lifetime pension — provided he does not interfere."\n\nThe end of one era. The beginning of an empire.',
                reward_notify: '📜 +5 notes. Letter to Melantrich studied.',
            },
            netolicky_04: {
                title: 'Inventory of Type (workshop stock)',
                lectio: '*A folded sheet with tables. Each row is a different typeface.*\n\nLatin Fraktur — 847 pieces\nBohemian Bastarda — 623 pieces\nHebrew characters — 89 pieces\nGreek capitals — 44 pieces\n\n— Type inventory, Netolický\'s workshop, undated.',
                glossa: '*Study of the inventory reveals a surprise.*\n\nHebrew type. In the Catholic printing house of Ferdinand\'s court printer. Why?\n\nPrague had a thriving Jewish community in Josefov. Someone ordered a Hebrew print — Netolický supplied it. Business is business, even for a loyal Catholic.',
                arcanum: '*In pencil in the lower corner, an old hand:*\n\n"Gutenberg\'s type. Father brought it from Mainz himself. It cost as much as a house. Melantrich took it as part of the workshop — at scrap price."\n\nGutenberg\'s legacy in Prague. And then — scrap.',
                reward_notify: '📜 +5 notes. The Type Inventory studied.',
            },
            netolicky_05: {
                title: 'Ink Recipe (personal formula)',
                lectio: '*A small booklet, bound with twine. Written in different inks — the recipe was amended over many years.*\n\n"Gall nuts: 4 lots. Vitriol: 2 lots. Gum arabic: 1 lot. Rainwater: 1 pint. Leave to stand 3 days before printing."\n\n— Netolický\'s personal formula, amended 1530–1548.',
                glossa: '*Comparison with standard recipes reveals deviations.*\n\nStandard formula: vitriol and gall nuts in a ratio of 1:2. Netolický used 1:4 — more gall nuts, less acid. The ink dried more slowly, but did not eat through the type so quickly.\n\nA master\'s trick: it saved him money on type. Type lasts longer = lower costs.',
                arcanum: '*On the last page, added later:*\n\n"For special prints: add a pinch of soot from birchwood. The ink will be blacker and lustrous. Bishops love it."\n\nRecipe unlocked: Netolický\'s iron gall ink.',
                reward_notify: '⚗️ Recipe unlocked: Netolický\'s Iron Gall Ink.',
            },
            netolicky_06: {
                title: 'Contract with the Papermaker (1538)',
                lectio: '*Parchment bearing two seals — Netolický\'s and the mill at Zbraslav.*\n\n"Master Václav of the Zbraslav mill undertakes to supply the printer Netolický with paper of middling and better quality, in quantity 200 sheets per month, at a price of 3 groschen per hundred sheets..."\n\n— Contract, 1538, for five years.',
                glossa: '*The numbers do not add up.*\n\n200 sheets per month. Netolický\'s largest print — the New Testament — consumed over 800 sheets. The contract barely covered a quarter.\n\nNetolický had to buy paper elsewhere — from Nuremberg, from Venice. At three times the price. The margin vanished.',
                arcanum: '*On the margin of the contract, in red chalk:*\n\n"The mill flooded in 1541. Václav died. Contract void. I had to buy paper stocks from Melantrich — at his price. From that moment I knew how it would end."\n\nPaper as a weapon. Melantrich had known it all along.',
                reward_notify: '📜 +5 notes. The Papermaker\'s Contract studied.',
            },
            netolicky_07: {
                title: 'Colophon of the Last Book (1552)',
                lectio: '*The final page. The ink is smeared in places — as though the paper was wet, or the hand trembling.*\n\n"Printed in Prague, in the Lesser Town, in the year of Our Lord 1552, at the printing house of Bartoloměj Netolický of Kapí Hora."\n\nBelow — added in another hand, fresh ink:\n\n"Now the printing house of Jiří Melantrich of Aventino."',
                glossa: '*Two names on one page. History in miniature.*\n\nNetolický had been printing for thirty years. Melantrich erased it with a single sentence.\n\nYet Netolický lived another ten years. He drew his pension. He walked past the printing house that had borne his name — and then ceased to.\n\nHistory does not ask how the overwritten feel.',
                arcanum: '*On the very last page, hidden behind a folded edge:*\n\n"Whosoever finds this page — know that I printed honestly. What was mine was good. What came after me — let time be the judge."\n\n— B. N.',
                reward_notify: '📜 Netolický\'s legacy studied. The printer\'s memory endures.',
            },

            // ── Bestiary ───────────────────────────────────────────────────
            titivillus_bestiar: {
                title: 'Titivillus',
                lectio: '*A German copperplate engraving, 17th century. A horned, goat-legged figure carries a bundle of books and scrolls on its back; two church towers rise in the background. Ribbons bearing a Latin inscription curl around its head — no one in the scriptorium has managed to translate it in full.*\n\nTITIVILLUS\nDaemon librarius, minor\n\nHaunts: any scriptorium where the Office is read aloud\nBehaviour: collects skipped syllables, garbled words, dropped lines\nTool: a sack on his back — filled a thousand times a day\nPurpose: evidence against the scribe on Judgment Day',
                glossa: 'The legend of a demon collecting scribal errors first appears in preachers\' exempla at the end of the 12th century. The name "Titivillus" settles into the texts around 1285, in the writings of John of Wales — though the demon himself is older, and wandered Europe nameless before that.\n\nAcross the centuries he gathered dozens of names: Tutivillus, Tintinillus, Titelinus, Tantillus... in Bohemia he was reportedly called Tibini. Every monastery, every church from England to Byzantium held its own version of the same fear — that even the faintest mumbled syllable in the Hours would one day be placed on the scales.\n\nWhen printing arrived, monks whispered with a bitter smile: now Titivillus will have his harvest. The first printed books were full of errors — and the demon, it was said, did not hesitate a moment to switch from parchment to type.',
                arcanum: 'The oldest tellers of the tale added a detail that still makes even a solemn chronicler smile: when no more errors would fit in the sack, Titivillus was said to stretch the parchment with his teeth. And when it tore, he struck his head helplessly against the wall.\n\n*Fragmina verborum Titivillus colligit horum,\nQuaque die mille vicibus se sarcinat ille.*\n\n"Titivillus gathers up these fragments of words, and fills his sack with them a thousand times a day."\n\nIn the scriptorium this holds literally true: write in the dark, without a candle or torch, and you risk Titivillus stealing the work from your hand — sometimes taking a cramp in your fingers along with it. Light a flame before you begin.',
            },

            acedia_bestiar: {
                title: 'Daemon meridianus',
                lectio: '*A copperplate engraving by Pieter van der Heyden after Pieter Bruegel the Elder, 1558. The figure of Desidia lies among snails and a donkey in the middle of a world turned upside down — the mill stands still, the house crumbles, nothing is ever finished.*\n\nDAEMON MERIDIANUS\nAlso called Acedia\n\nHaunts: the cell, whenever the sun stands highest\nBehaviour: time drags, the day grows fifty hours long, everything sours at once\nTool: none — only silence where prayer should be\nPurpose: the most dangerous of all — commander of the other demons (Evagrius)',
                glossa: 'Fourth-century Egyptian hermits called him daemon meridianus — a demon who, unlike the others, does not wait for darkness but walks by day, in the hottest hour. His name comes from Psalm 90: "nor the destruction that wastes at noonday."\n\nEvagrius Ponticus, who first described him, called him the most troublesome of all the demons — commander of the whole host of temptation. He writes: first the sun seems to stand still. The day grows fifty hours long. The cell feels like a prison, the brothers like strangers, prayer like a duty stripped of meaning. The monk becomes a "runaway" — he either falls asleep at prayer, flees his cell, or abandons the monastery altogether.\n\nJohn Cassian carried the teaching west — and through him it remained in every rule to this day, whichever one a monastery follows.',
                arcanum: 'Later centuries flattened Acedia into mere "sloth" — one of the seven deadly sins, easily pictured as a sleeper astride a donkey. But the old fathers knew it was something else: not rest, but dryness. Not laziness of the body, but a weariness of the spirit that cannot be seen until it is too late.\n\n*Segnities robur frangit, longa ocia nervos.*\n"Sloth breaks strength, long idleness withers the sinews."\n\nIn the monastery this holds exactly true: neglect the body and the spirit long enough — lose track of how much strength remains — and you will not notice how quietly your Piety drains away with it. Acedia never arrives all at once. It arrives as a tiredness that never quite rests.',
            },

            titivillus_secunda: {
                title: 'Titivillus — The Other Face',
                lectio: '*The same Titivillus, a different pew. On the misericords carved beneath choir seats (England, 14th–15th c.) he sits among gossiping women, not among scribes. The sack is the same — only what falls into it differs.*\n\nTITIVILLUS (secunda facies)\nHaunts: the choir, the chapter house, wherever whispering replaces prayer\nBehaviour: collects gossip, idle talk, laughter behind backs\nTool: the very same sack — it does not distinguish where the words came from, only their worthlessness\nPurpose: the same judgment, a different witness',
                glossa: 'The earliest mention is older than he himself might expect — Jacques de Vitry recorded it already in the 1220s: a demon who listens to the choir during the psalms and gathers into his sack the syllables skipped and swallowed. Two centuries later the English priest John the Blind Audeley warned against those who "over-hip and over-skip, mutter and mumble" — but added the other half of his work too: gossip in the pews, talk behind backs, laughter that has no place in church.\n\nOn the misericords (New College, Oxford, 14th c.; St Mary the Virgin, Enville, 15th c.) he sits precisely between two women, listening. Same figure, same sack — only the head turned the other way.',
                arcanum: 'The brothers knew it, and gossiped anyway. Perhaps precisely because of it: believing a demon recorded the gossip was a way to keep confessing it for forgiveness — and keep on doing it regardless.\n\nIn the monastery this holds exactly true: where two lay brothers carry an old grudge against each other, it takes little for it to surface as a dispute at Chapter. Who knows how much of it Titivillus heard before the abbot did.',
            },

            belzebub_bestiar: {
                title: 'Beelzebub',
                lectio: 'Lord of the Flies — the name is an insult, not a title. Originally Baal Zebul, "Lord of the Lofty Dwelling," a god honored in Philistine Ekron. The Israelites turned the name inside out: Baal Zebub, Lord of Flies — from palace to dung heap by a single letter.\n\nBEELZEBUB\nHaunts: wherever meat rots, wherever filth gathers\nBehaviour: harasses concentration with buzzing, tempts toward the sin of gluttony\nTool: the swarm — never alone, always many\nPurpose: one of the seven princes of Hell, patron of intemperance (Peter Binsfeld, 1589)',
                glossa: 'In the Second Book of Kings (c. 850 BCE), the Israelite king Ahaziah sends messengers to Baal Zebub, god of Ekron, to ask whether he will recover from his injury. The prophet Elijah condemns him for it — and from that moment theology steadily dismantles the old cult into ruins. Baal Zebul, "Lord of the Lofty Dwelling," becomes Baal Zebub, "Lord of Flies" — an insult stamped permanently into the name.\n\nIn medieval art he appears as a giant fly, or as a bloated figure with insect wings, crowned by a swarm. Peter Binsfeld placed him in 1589 among the seven princes of Hell as patron of Gluttony (Gula) — the link between flies, rot, and excess of food is as old as the Bible itself.',
                arcanum: 'A fly buzzing around the head of a praying monk was never just an irritating insect. It was a scout, or perhaps a small demon in its own right, trying to break concentration and remind the body it is hungry before the spirit has finished praying.\n\nIn the monastery this holds literally true: an uncleaned pen and rotting stores are not merely untidy. In the warm season they draw swarms that speed up decay all around them — raw meat, fish, cheese. The more manure and the more neglect, the more flies; the more flies, the faster the rest rots. Beelzebub does not ask where to begin.',
            },

            grim_bestiar: {
                title: 'Church Grim',
                lectio: 'An English and Scandinavian legend, carried into Christian ground from pagan roots. It was believed that the first being buried in a new churchyard had to guard its gate against the Devil forever.\n\nCHURCH GRIM\nHaunts: the churchyard gate, the first grave\nBehaviour: guards the consecrated ground against grave robbers and evil spirits\nTool: none — only presence, a black dog with burning eyes\nPurpose: a protector, not a scourge — the only kindly demon in this whole bestiary',
                glossa: 'So that no human soul had to carry the task, a black dog was often walled alive into the foundations of the church, or buried at the edge of the churchyard — the first victim, the first guardian. Its ghost then walked the grounds at night, visible only to those soon to die.\n\nThe legend is as old as the custom of founding consecrated ground itself — protection through sacrifice, not through prayer. The Church never officially sanctioned it, nor forbade it outright; it survived in folk belief alongside the liturgy.',
                arcanum: 'Unlike every other demon in this bestiary, the Church Grim punishes no one, collects no errors, tempts no one toward sin. It guards.\n\nIn the monastery this holds literally true: the first grave in a churchyard is not merely the first loss. It is the moment consecrated ground truly becomes consecrated — it has something to defend, and someone.',
            },

            revenanti_bestiar: {
                title: 'Revenants',
                lectio: 'Forerunners of today\'s zombies and vampires — but no romantic blood-drinking aristocrats. Rotting, bloated corpses of sinners, suicides, or plague victims who climb out of their graves at night.\n\nREVENANTUS\nHaunts: a neglected churchyard, an untended grave\nBehaviour: wanders the village, spreads a plague-breath, terrifies the living\nTool: its own body — swelling, blisters, a stench attributed to demonic power\nPurpose: a warning — a neglected grave is an open gate',
                glossa: 'William of Newburgh, a 12th-century English chronicler, recorded several such cases as fact, not rumor — the dead rising from the grave to torment the living, until someone dug up the body and stopped it.\n\nThe defense was practical as much as spiritual: the body was exhumed, its head struck off with a spade, its heart pierced or removed and burned — meant to release the trapped gases of decomposition, taken at the time for demonic force itself.',
                arcanum: 'Behind the talk of plague-breath and swollen bodies lies a simple, literal truth: a grave no one tends is a grave that speaks. The stench, the swelling, things emerging from the ground — all of it has a perfectly ordinary explanation, except the medieval mind looked for that explanation elsewhere.\n\nIn the monastery this holds exactly true: a neglected churchyard is not merely an unpleasant sight. It is a place where legend and neglect blur into one — and the longer it goes on, the harder they are to tell apart.',
            },

            marginalie_bestiar: {
                title: 'Marginalia (Wandering Demons)',
                lectio: 'Not everything in this bestiary has a name, a theology, or even a body. These creatures were born directly in the tired minds of scribes — in the margins of the parchment, not in any treatise.\n\nMARGINALIA (DROLLERIES)\nHaunts: the edge of the page, whenever attention fades\nBehaviour: murderous snails, dog-headed men, hares hunting hounds, monkeys playing instruments\nTool: the scribe\'s own quill — the only demon that draws itself\nPurpose: a release valve, not a sin — a visual symptom of fatigue, not a temptation',
                glossa: 'When a scribe\'s attention faded after hours of work, his struggle to concentrate visualized itself directly in the margins of the parchment. The most common motif: a fully armed knight retreating before a giant snail — satire on cowardice, or perhaps simply on how unbearably slowly the work on the manuscript crept along.\n\nDog-headed men, Blemmyes, hares hunting hounds, monkeys with musical instruments — none of these figures has a theological treatise, a sermon, a name in any bestiary. They were born right here, in the margin, and nowhere else.',
                arcanum: 'All six demons found so far — Titivillus in two faces, Acedia, Beelzebub, the Church Grim, the Revenants — had a name, a treatise, a theologian who described them. This last one does not. It is the only beast in the whole bestiary that no one invented — it drew itself, by the hand of an exhausted man.\n\nPerhaps it was the most honest record of all: not what the monastery believed threatened it, but what it actually felt, when it could go no further.',
            },

        }, // end folios

    }, // end scrinium

    // ── EVENTS ───────────────────────────────────────────────────────────────
    events: {
        ui: {
            result: 'Outcome',
            close: 'Close',
        },

        // ── CALENDAR EVENTS ───────────────────────────────────────────────────
        cal_ash_wednesday: {
            title: 'Ash Wednesday',
            text: 'The bells have rung since dawn. The Abbot hath decreed a fast — no meat, no wine, no excess. Forty days of penance begin this day. The scriptorium worketh on, but the hands are heavier.',
            notify: '✝️ Ash Wednesday. Forty days of fasting begin.',
        },
        cal_walpurgis: {
            title: 'Walpurgis Night',
            text: 'Fires burn upon the hills from Blaník to Říp. It is said that this night herbs hold their greatest power and the Athanor burns more brightly. But also — that the inquisitor from Olomouc keepeth his eyes open.',
            athanor_btn: 'Work in the Athanor through the night',
            athanor_desc: 'Make use of the magical night. Combinations have +30% chance of success — but the inquisitor may come in the morning.',
            athanor_notif: '🔥 The furnace blazeth. This night belongeth to fire.',
            athanor_res: 'The Athanor burned all night long. Attempts in the next 8 hours will have a better chance of success. We shall see if anyone noticed the lights.',
            pray_btn: 'Close the shutters and pray',
            pray_desc: 'The safe choice. No risk.',
            pray_notif: '🙏 Prayer hath protected the scriptorium.',
            pray_res: 'A quiet night. The fires upon the hills burned out unnoticed. The scriptorium is safe.',
            herbs_btn: 'Send a helper to gather herbs',
            herbs_desc: 'Walpurgis herbs are the rarest of the whole year.',
            herbs_notif: '🌿 The helper returned before dawn with arms full of herbs.',
            herbs_res: 'Thyme, St. John\u2019s wort, chamomile \u2014 all gathered at midnight. Hildegard would approve.',
        },
        cal_easter: {
            title: 'Easter Morning',
            text: 'Alleluia ringeth from the church tower. Pilgrims come from every direction. Benedikt of Litomyšl hath opened the Tavern since dawn and Giacomo Foscari hath arrived with new wares.',
            notify: '✝️ Christus resurrexit. The scriptorium rejoiceth.',
        },
        cal_may_day: {
            title: 'The First of May',
            text: 'The young men spent the whole night raising the maypole before the village. The maidens garland the cattle. The garden seemeth to know — everything groweth faster, the bees fly further than usual.',
            notify: '🌿 May hath come. The garden awaketh.',
        },
        cal_midsummer: {
            title: 'St. John\u2019s Night',
            text: 'The shortest night of the year. Herb-gatherers believe that St. John\u2019s wort picked at midnight cureth all. The fires upon the hills speak in the pagan tongue, the bells in the church in the Christian tongue. Both tongues sound as one this day.',
            herbs_btn: 'Go gathering herbs at midnight',
            herbs_desc: 'Midsummer herbs hold the greatest power. But the short night will make itself felt.',
            herbs_notif: '🌿 Herbs gathered at midnight hold a singular power.',
            herbs_res: 'St. John’s wort, thyme, pollen — all gathered by the light of midsummer. Vigour suffereth, but the stores are rich.',
            work_btn: 'Stay in the scriptorium and work',
            work_desc: 'A bright night meaneth fewer candles. A good time to work.',
            work_notif: '🌙 A bright night. Candles scarce needed.',
            work_res: 'Thou worked by natural light. Candles saved, manuscripts advancing.',
        },
        cal_all_souls: {
            title: 'All Souls’ Day',
            text: 'Candles burn upon the graves since dusk. Titivillus is more lively this night than any other — it is said that the dead souls of scribes who erred bring him fresh letters for his sack. Write with care.',
            notify: '🕯️ All Souls’ Day. Titivillus watcheth.',
        },
        cal_advent: {
            title: 'Advent Hath Begun',
            text: 'Four weeks of waiting. The church smelleth of incense, the market of gingerbread. The demand for psalters and prayer books groweth — everyone wisheth to have the word of God at home before Christmas.',
            notify: '✝️ Advent. A time of waiting and light.',
        },
        cal_christmas: {
            title: 'Christmas Eve',
            text: 'The star hath risen. The Cellarium is closed, Benedikt and Giacomo are with their families. The community needeth food and warmth. The scriptorium resteth — but the fire in the hearth never goeth out.',
            notify: '⭐ Christmas Eve. Pax et bonum.',
        },
        cal_new_year: {
            title: 'The Year’s End',
            text: 'The old year departeth. The chronicler shall write the last line. All old matters are closed — and new ones begin upon a clean page.',
            notify: '🕯️ New Year. A clean page.',
        },
        swedish_siege: {
            title: 'Raiders from the North',
            text: 'Word cometh from the lower town — an armed band marcheth from the north. They call them Swedes, yet they speak a strange mixture of tongues. They seek valuables. Thy manuscripts are in peril.',
            sartorius_btn: 'Treat with Captain Sartorius',
            sartorius_desc: 'Offer part of thy stores in exchange for protection.',
            sartorius_notif: '⚔️ Sartorius hath accepted. The losses are bearable.',
            sartorius_res: 'Captain Sartorius took his share and withdrew. The scriptorium still standeth.',
            wall_btn: 'Wall up the stores in the cellar',
            wall_desc: 'Conceal all behind a false wall. Risky, but thy best chance.',
            wall_notif: '🧱 The stores are walled up. Thou waitest.',
            wall_res: 'All is hidden. The raiders searched the scriptorium — they found nothing. In 48 hours thou shalt dig it out.',
            wall_return: '🧱 The false wall uncovered — thy stores have returned, most of them saved.',
            nego_btn: 'Surrender part of the manuscripts as ransom',
            nego_desc: 'Painful, but swift.',
            nego_notif: '📜 The ransom hath been delivered. They have gone.',
            nego_res: 'They took the manuscripts and vanished into the forest. The rest of the scriptorium is safe.',
        },
        hidden_incunabula: {
            title: 'A Mysterious Book',
            text: 'While rearranging the shelves, thou findest a dusty book behind a beam. Printed, but old — very old. It may be an incunabulum.',
            compare_btn: 'Compare with the Kutná Hora Bible',
            compare_desc: 'A scholarly comparison — it may yield precious insight.',
            compare_notif_ok: '📚 The comparison hath yielded remarkable findings!',
            compare_res_ok: 'The manuscript is truly rare. Thy notes shall enrich the knowledge of the scriptorium.',
            compare_notif_fail: '📚 The comparison hath yielded no clear conclusion.',
            compare_res_fail: 'The book remaineth a mystery. At least a few notes.',
            ignore_btn: 'Set aside for later',
            ignore_desc: 'There is no time for scholarship now.',
            ignore_notif: '📦 The book awaiteth better times.',
            ignore_res: 'Thou hast stored it safely. Perhaps thou shalt return to it.',
        },
        discovered_old_vaults: {
            title: 'The Collapsed Floor',
            text: 'While moving stores, the timber gave way beneath the cellarer\'s feet. Beneath the floor — forgotten vaults. Old masonry, darkness, the smell of damp. Someone was here before us.',
            explore_btn: 'Explore',
            explore_desc: 'Take a lantern and descend.',
            explore_notif: '🕯️ Old Cellars discovered beneath the monastery.',
            explore_res: 'The vaults run deeper than thou expected. They will need clearing and repair — but the space is there.',
            wall_btn: 'Wall it up',
            wall_desc: 'Safer to let sleeping things lie.',
            wall_notif: '🧱 The opening was walled up again.',
            wall_res: 'The cellarer nodded. "What lies beneath, let it remain." The hole is sealed.',
            wait_btn: 'Wait',
            wait_desc: 'Think it over first, return to it later.',
            wait_notif: '⏳ The decision is postponed.',
            wait_res: 'Thou leavest the hole covered with planks. Thou mayest return to this decision another time.',
        },

        // ── REPEATABLE EVENTS (Category B — Athanor & Inquisition) ─────────────
        inq_morning_visit: {
            title: 'A Knock at the Door',
            text: 'The porter brother arrived pale as a sheet. A man in black stands at the gate — a Dominican bearing the seal of the Olomouc inquisitorial tribunal. He asks about suspicious smells and lights at night.',
            open_btn: 'Open up and show the scriptorium',
            open_desc: 'Admit to the scriptorium, hide the Athanor.',
            open_notif_ok: '🕊️ The inquisitor left satisfied. The scriptorium is clean.',
            open_res_ok: 'He examined the shelves, leafed through a few manuscripts, nodded. "All in order, brother." He left without suspicion.',
            open_notif_fail: '⚠️ The inquisitor found the laboratory. The Athanor is sealed.',
            open_res_fail: 'Behind the false wall he caught the scent of sulfur. The Athanor is sealed as of today — no one may enter for 48 hours.',
            bribe_btn: 'Bribe him (20 groschen)',
            bribe_desc: 'Coin speaks louder than words.',
            bribe_notif: '💰 The Dominican accepted the gift and left. God forgives.',
            bribe_res: 'The coins vanished up his sleeve faster than thou wouldst expect from a man of a holy order. He left without further questions.',
            bribe_notif_poor: '⚠️ Thou hast not enough groschen for a bribe.',
            bribe_res_poor: 'Thou reachest into the purse — it is empty. The inquisitor waits, impatiently.',
            refuse_btn: 'Refuse entry — monastic right',
            refuse_desc: 'The monastery holds immunity from secular power. Risky.',
            refuse_notif_ok: '🛡️ The inquisitor respected the monastery\'s right. He left.',
            refuse_res_ok: 'The Abbot would be proud. The Dominican studied the seal on the gate, nodded silently, and turned to leave.',
            refuse_notif_fail: '⚠️ The inquisitor will return with reinforcements.',
            refuse_res_fail: 'His face hardened. "We shall see what the bishop says." He left — but this was not the end.',
        },
        athanor_pilgrim_ingredient: {
            title: 'A Pilgrim at the Gate',
            text: 'A man with no name arrived. He says he comes from afar — from Constantinople, perhaps farther still. He offers a small pouch of an unknown substance. "For one who knows what to do with it," he says.',
            accept_btn: 'Accept it (5 groschen)',
            accept_desc: 'The pouch looks promising.',
            accept_notif: '🎒 The pouch is thine. The pilgrim vanished before thou couldst turn around.',
            accept_res: 'Inside — a rare ingredient the likes of which thou hast never seen in these parts. Best not to ask where he got it.',
            accept_notif_poor: '⚠️ Thou hast not enough groschen for the pouch.',
            accept_res_poor: 'Thou reachest into the purse — the pilgrim only smiles and walks away in silence.',
            decline_btn: 'Decline',
            decline_desc: 'Caution is its own reward.',
            decline_notif: '🙏 Thou declinest. The pilgrim shrugged and left.',
            decline_res: 'Perhaps needless caution, perhaps wisdom. The porter brother nodded — strange things from strangers never end well.',
        },
        athanor_explosion: {
            notify: '💥 Explosion! The Athanor has cooled and sealed for 2 hours.',
        },

        // ── REPEATABLE EVENTS (Category C — Printing & Incunabula) ─────────────
        print_malleus: {
            title: 'A Dangerous Commission',
            text: 'A messenger from the Dominicans of Cologne arrived. They bring a manuscript — the Malleus Maleficarum, the Hammer of Witches. They want it printed. They pay well. Very well.',
            anon_btn: 'Accept the commission (anonymous printing)',
            anon_desc: 'No colophon. No one will know.',
            anon_notif: '💰 The book was printed without a colophon. No one knows.',
            anon_res: 'The type worked all night without a name on the title page. The messenger paid and left satisfied. Conscience rests easier when no one knows.',
            open_btn: 'Accept it openly',
            open_desc: 'With the scriptorium\'s name on the title page. Higher pay, higher risk.',
            open_notif: '⚠️ The book bears thy name. The Dominicans are pleased. Others less so.',
            open_res: 'Thou didst print openly, proudly, with the monastery\'s seal on the title page. The Dominicans are pleased. The same cannot be said of others.',
            refuse_btn: 'Refuse',
            refuse_desc: 'Some commissions are not worth the money.',
            refuse_notif: '🕊️ Thou refusedst. The messenger left coldly.',
            refuse_res: 'The messenger took the manuscript back without a word. Cologne will find another workshop. Thy conscience is clear — thy purse the lighter for it.',
        },
        print_gutenberg_type: {
            title: 'An Estate from Mainz',
            text: 'Giacomo Foscari came with an unusual offer. He has a contact in Mainz — someone is selling a set of type from Gutenberg\'s original workshop. A historical rarity. The price matches.',
            buy_btn: 'Buy it (200 groschen)',
            buy_desc: 'Full price, a certain purchase.',
            buy_notif: '🔡 The type from Mainz is thine. Gutenberg\'s spirit is with thee.',
            buy_res: 'The pouch of type weighs more in the hand than it should. History itself. Giacomo smiled — he knew thou wouldst not refuse.',
            buy_notif_poor: '⚠️ Thou hast not enough groschen for the type.',
            buy_res_poor: 'The purse is too light. Giacomo shrugged — perhaps next time.',
            haggle_btn: 'Haggle (150 groschen)',
            haggle_desc: 'Riskier, but cheaper — if it works.',
            haggle_notif_ok: '🔡 Giacomo agreed. The type for a fair price.',
            haggle_res_ok: 'After lengthy bargaining, Giacomo nodded. "For an old friend." The type is thine, thy purse fuller than expected.',
            haggle_notif_fail: '📦 Giacomo shrugged. Another buyer was faster.',
            haggle_res_fail: 'The negotiation dragged on too long. Meanwhile someone else in Mainz paid full price. The type is gone.',
            haggle_notif_poor: '⚠️ Thou hast not enough groschen even to haggle.',
            haggle_res_poor: 'The purse is too light even for haggling. Giacomo keeps the offer to himself.',
            decline_btn: 'Decline',
            decline_desc: 'The type is a costly affair.',
            decline_notif: '📦 Thou let the opportunity pass.',
            decline_res: 'Giacomo packed the type back up. "A pity," he said. "Such things are not offered twice."',
        },

        // ── REPEATABLE EVENTS (Category D — Farmyard & Nature) ─────────────────
        curia_sheep_disease: {
            title: 'The Sheep Are Coughing',
            text: 'The shepherd arrived at dawn with unpleasant news — the sheep stand still and will not eat. Their eyes are clouded, their wool dull. He knows this as murrain.',
            thyme_btn: 'Treat with thyme',
            thyme_desc: 'A tried remedy, but not always enough.',
            thyme_notif_ok: '🌿 The thyme helped. The sheep recovered.',
            thyme_res_ok: 'The shepherd mixed thyme into the water and feed. Within two days the sheep were on their feet again, grazing and bleating as if nothing had happened.',
            thyme_notif_fail: '⚠️ Too late for one. A sheep did not survive.',
            thyme_res_fail: 'The thyme helped most of the flock, but one sheep was already too weak. The shepherd bowed his head — he did what he could.',
            thyme_notif_poor: '⚠️ Thou hast not enough thyme (2 needed).',
            thyme_res_poor: 'There is not enough thyme in store to treat the whole flock. The sheep will have to wait.',
            healer_btn: 'Call a healer (10 groschen)',
            healer_desc: 'Costly, but reliable.',
            healer_notif: '💊 The healer came and helped. The flock is saved.',
            healer_res: 'The village healer came with her own herbs and a steady hand. By evening the whole flock was on its feet.',
            healer_notif_fail: '⚠️ Even the healer was too late for one sheep.',
            healer_res_fail: 'The healer did what she could, but one sheep was beyond help. The rest of the flock is well.',
            healer_notif_poor: '⚠️ Thou hast not enough groschen for a healer.',
            healer_res_poor: 'The purse is too light. The healer will not come without payment upfront.',
            healer_notif_called: '💊 A healer has been summoned — she will arrive tomorrow.',
            healer_res_called: 'You sent for the village healer. With her herbs and steady hand she will arrive tomorrow — until then the flock is safe.',
            healer_notif_active: '⏳ The healer is already on her way.',
            healer_res_active: 'A healer has already been summoned and is on her way. No need to send for another.',
            isolate_btn: 'Isolate the sick',
            isolate_desc: 'A harsh solution, but it stops the spread.',
            isolate_notif: '🐑 The sick sheep are isolated. There are losses, but the murrain does not spread.',
            isolate_res: 'The shepherd separated the sick animals from the healthy. A painful decision, but the rest of the flock is safe.',
        },
        garden_hail: {
            title: 'Hailstorm',
            text: 'It came without warning. Pea-sized hail lashed the garden for a quarter hour. What survived?',
            notify: '🧊 Hailstorm! The garden and orchard are damaged.',
        },

        // ── REPEATABLE EVENTS (Category E — Cellarium & NPCs) ───────────────────
        cellarium_giacomo_news: {
            title: 'Giacomo Has News',
            text: 'The Venetian arrived with a broad smile and new goods. "From the Orient," he says mysteriously. "Things no one in Bohemia has."',
            view_btn: 'Look at the goods (30 groschen)',
            view_desc: 'A rare material, but Giacomo charges for the exotic.',
            view_notif: '📦 Giacomo opened the chest. A rare material is thine.',
            view_res: 'The chest smells of spice and distance. Inside — a material the local market has never known. Giacomo asked a fair price, and did not haggle.',
            view_notif_poor: '⚠️ Thou hast not enough groschen for Giacomo\'s goods.',
            view_res_poor: 'The purse is too light. Giacomo closed the chest again — "Next time, friend."',
            decline_btn: 'Decline',
            decline_desc: 'Not today.',
            decline_notif: '🤷 Giacomo shrugged. "Next time, friend."',
            decline_res: 'Giacomo kept the offer to himself and left with the chest under his arm. Perhaps next time.',
        },
        cellarium_benedikt_debt: {
            title: 'Benedikt Needs Help',
            text: 'Innkeeper Benedikt of Litomyšl came in person. He owes groschen to a brewer in Brno. The tavern will close for a week unless thou helpest.',
            lend_btn: 'Lend 30 groschen',
            lend_desc: 'Benedikt is a good friend of the monastery.',
            lend_notif: '🍺 Benedikt left with relief. "I shall never forget this."',
            lend_notif_poor: '⚠️ Thou hast not enough groschen to lend.',
            lend_res: 'Benedikt gripped thy hand tighter than expected. "The monastery has my debt," he said, and left with the coin for the brewer.',
            lend_res_poor: 'The purse is too light even to help a friend. Benedikt nodded sadly and left.',
            decline_btn: 'Decline',
            decline_desc: 'The monastery is not a bank.',
            decline_notif: '🍺 Benedikt understood. The tavern closes tomorrow.',
            decline_res: 'Benedikt shrugged — it was not the first time he had to manage alone. The tavern will remain closed tomorrow.',
        },
        cellarium_counterfeit: {
            title: 'Counterfeit Groschen',
            text: 'While counting the coffer, thou foundest three groschen with a suspicious sheen. Counterfeit. Who slipped them in?',
            benedikt_btn: 'Return them to Benedikt',
            benedikt_desc: 'Suspicion falls on the Tavern.',
            benedikt_notif: '🍺 Benedikt protested, but took the coins back.',
            benedikt_res: 'Benedikt looked offended — "I would never cheat the monastery!" — but took the coins back without further argument.',
            giacomo_btn: 'Return them to Giacomo',
            giacomo_desc: 'Suspicion falls on the Market.',
            giacomo_notif: '📦 Giacomo protested, but took the coins back.',
            giacomo_res: 'Giacomo looked hurt — "A Venetian never counterfeits!" — but silently pocketed the coins and left.',
            keep_btn: 'Keep them and stay silent',
            keep_desc: 'The simplest, if not the cleanest, solution.',
            keep_notif: '🤐 The counterfeit coins are hidden. The problem solved in thine own way.',
            keep_res: 'The counterfeit groschen ended up buried at the bottom of a chest. No one asked, no one found out. The coffer is a few groschen poorer.',
        },

        // ── REPEATABLE EVENTS (Category F — Scrinium & Abbot) ───────────────────
        scrinium_abbot_ill: {
            title: 'The Abbot Lies Ill',
            text: 'The apothecary brother arrived with a grave face. The Abbot has a fever. Scrinium is locked — the Abbot keeps the keys, and no one else may enter.',
            notify: '🤒 The Abbot has fallen ill. Scrinium is closed for 12 hours.',
        },
        scrinium_mysterious_guest: {
            title: 'Who Is That Man?',
            text: 'Walking through the monastery, thou glimpsedst a stranger through Scrinium\'s half-open door. The Abbot speaks with him quietly. The stranger carries a large pouch — and the corner of a scroll peeks out.',
            enter_btn: 'Enter and introduce thyself',
            enter_desc: 'Risky, but curiosity wins.',
            enter_notif_ok: '📜 The stranger is a folio merchant. He showed thee what he has.',
            enter_res_ok: 'The man introduced himself as a collector of old manuscripts. "I have something for thee too, brother," he said, drawing a forgotten folio from his pouch.',
            enter_notif_fail: '⚠️ The Abbot is angered. Scrinium closed for 6 hours.',
            enter_res_fail: 'The Abbot turned with a look that brooked no argument. "This is not thy concern, brother." Scrinium was locked for a while.',
            wait_btn: 'Wait and observe',
            wait_desc: 'Patience may reveal more than questions.',
            wait_notif: '🗺️ The stranger showed the Abbot a map. Interesting.',
            wait_res: 'From fragments of the conversation thou caughtest the word "map" and the name of a distant town. Something is brewing — perhaps the Maps are worth watching.',
            leave_btn: 'Leave it be',
            leave_desc: 'Not everything is thy concern.',
            leave_kronika: 'A mysterious stranger visited the Abbot in Scrinium. No one knows what they discussed.',
            leave_res: 'Thou turned and went about thy business. Let the Abbot manage his own affairs — thou hast enough work of thine own.',
        },
    },
    abbotPetition: {
        fodina: {
            title: 'Request for Mining Rights',
            submit_btn: 'Submit petition to the Abbot',
            pending: '⏳ Petition submitted {date}. The Abbot will reply by {responseDate}.',
            approved: '✅ The Abbot has granted mining rights. The Fodina may be opened.',
            denied_tech: '❌ Abbot denied: The monastery has not yet acquired knowledge of mining. Research: Fodina — Art of Mining.',
            denied_fabrica: '❌ Abbot denied: You have no place to work the ore. Build the Fabrica first.',
            denied_groats: '❌ Abbot denied: The monastery lacks funds for the royal mining toll (50 groats).',
            denied_pickaxe: '❌ Abbot denied: No tools to open a mine. Obtain a pickaxe first.',
            kronika_submit: 'Petition submitted to the Abbot for mining rights (Fodina). Reply expected by {responseDate}.',
            kronika_approved: 'The Abbot granted the opening of the mine (Fodina). Mining privilege awarded.',
            kronika_denied: 'The Abbot denied the petition for the Fodina. Reason: {reason}',
            inspect_hint: 'The Abbot has promised an inspection visit in the coming days.',
            locked_hint: 'To mine iron ore, you need the Abbot\'s consent to open a mine.',
        },
        fornax: {
            title: 'Request to Build a Smelting Furnace',
            submit_btn: 'Submit petition to the Abbot',
            pending: '⏳ Petition submitted {date}. The Abbot will reply by {responseDate}.',
            approved: '✅ The Abbot has approved the Fornax Ferraria. The furnace may be built.',
            denied_tech: '❌ Abbot denied: The monastery has not yet acquired knowledge of iron smelting. Research: Fornax Ferraria — Smelting Iron.',
            denied_fodina: '❌ Abbot denied: A mine (Fodina) must be opened first.',
            denied_groats: '❌ Abbot denied: The monastery lacks sufficient funds (80 groats).',
            denied_charcoal: '❌ Abbot denied: No charcoal stores to run a furnace (15 required).',
            kronika_submit: 'Petition submitted to the Abbot for the Fornax Ferraria. Reply expected by {responseDate}.',
            kronika_approved: 'The Abbot approved the Fornax Ferraria. Ore smelting may begin.',
            kronika_denied: 'The Abbot denied the petition for the Fornax Ferraria. Reason: {reason}',
            inspect_hint: 'The Abbot has promised an inspection visit once the furnace is complete.',
            locked_hint: 'Smelting ore requires the Abbot\'s consent to build a furnace.',
            build_cost: 'Build cost: 40 rock, 15 cut stone, 20 clay, 20 planks, 15 charcoal.',
        },
        columbarium: {
            title: 'Request for a Flock of Pigeons',
            submit_btn: 'Submit petition to the Abbot',
            pending: '⏳ Petition submitted {date}. The Abbot will reply by {responseDate}.',
            approved: '✅ The Abbot sends a flock of pigeons for training. The Columbarium comes alive.',
            denied_tech: '❌ Abbot denied: The monastery does not yet know the art of pigeon post. Research: Porta — Pigeon Post.',
            denied_build: '❌ Abbot denied: The dovecote does not yet stand. Build the Columbarium first.',
            kronika_submit: 'Petition submitted to the Abbot for pigeons for the Columbarium. Reply expected by {responseDate}.',
            kronika_approved: 'The Abbot sent a flock of pigeons. The Columbarium is inhabited.',
            kronika_denied: 'The Abbot denied the petition for pigeons. Reason: {reason}',
            inspect_hint: 'The Abbot has promised to visit the dovecote soon.',
            locked_hint: 'The pigeon post requires the Abbot\'s consent to deliver birds.',
        },
        domus_ii: {
            title: 'Request to Expand the House of Lay Brothers',
            submit_btn: 'Submit petition to the Abbot',
            pending: '⏳ Petition submitted {date}. The Abbot will reply by {responseDate}.',
            approved: '✅ The Abbot has approved the expansion to Domus Conversorum II. Construction may begin.',
            denied_phase2: '❌ Abbot denied: Phase 2 (Domus Conversorum I) must be completed first.',
            denied_influence: '❌ Abbot denied: The monastery has not yet earned enough of the Abbot\'s trust.',
            denied_food: '❌ Abbot denied: Food stores are too modest to support a larger community.',
            denied_economy: '❌ Abbot denied: The monastery lacks sufficient funds or a stable income.',
            denied_drink: '❌ Abbot denied: The monastery must show its prosperity — wine, ale or honey in store.',
            denied_rank: '❌ Abbot denied: Only a Prior may petition for so great an expansion.',
            kronika_submit: 'Petition submitted to the Abbot to expand the House of Lay Brothers. Reply expected by {responseDate}.',
            kronika_approved: 'The Abbot approved the expansion to Domus Conversorum II.',
            kronika_denied: 'The Abbot denied the petition to expand the House of Lay Brothers. Reason: {reason}',
            inspect_hint: 'The Abbot has promised an inspection visit once the building is complete.',
        },
        probost: {
            title: 'Request for the Office of Provost',
            submit_btn: 'Submit petition to the Abbot',
            pending: '⏳ Petition submitted {date}. The Abbot will reply by {responseDate}.',
            approved: '✅ The Abbot has confirmed the office of Provost. The parish is entrusted to you.',
            denied_fabrica: '❌ Abbot denied: The church must first reach the tier of Church (Fabrica Ecclesiae).',
            denied_rank: '❌ Abbot denied: Only a brother of rank Armarius or higher may petition for the office of Provost.',
            kronika_submit: 'Petition submitted to the Abbot for the office of Provost. Reply expected by {responseDate}.',
            kronika_approved: 'The Abbot confirmed the office of Provost. The parish entrusted to the monastery\'s care.',
            kronika_denied: 'The Abbot denied the petition for the office of Provost. Reason: {reason}',
            inspect_hint: 'The Abbot has promised to visit the parish soon.',
            locked_hint: 'To administer a parish, you need the Abbot\'s consent to the office of Provost.',
        },
    },
};