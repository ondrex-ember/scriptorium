// Scriptorium i18n — English (Olde)
// Základ: STRINGS_cs. Chybějící klíče → fallback na CS automaticky.

const STRINGS_en = {
        nav: { home:'Workshop', garden:'Garden', craft:'Craft', inv:'Satchel', lore:'Scriptorium', library:'Library' },
        screens: { home:'The Workshop', garden:'The Garden', craft:'Crafting', inv:'Thy Satchel', lore:'Scriptorium', library:'The Library', settings:'Settings' },
    header: { weatherNow: 'Presently in Prague (click to refresh)', weatherTomorrow: 'Morrow\'s forecast', hunger: 'Hunger', streak: 'Daily Streak', research: 'Knowledge Gathered', settings: 'Settings' },
    // ------------------------------
        fireplace: {
            cold:'The Hearth Lies Cold', coldDesc:'A bitter chill claimeth the chamber.', kindle:'KINDLE',
            lit:'The Hearth Burns', litDesc:'Warmth and light fill the scriptorium.'
        },
        light: {
            none:'No Light', noneDesc:'Darkness claimeth this place.',
            candle:'Candle (Burning)', torch:'Torch (Crackling)',
       	    candleDesc: 'A small but steady flame.',
	    torchDesc: 'It smokes and crackles, yet burns bright.',
            btnTorch:'LIGHT TORCH', btnCandle:'LIGHT CANDLE'
        },
        craft: { filterAll:'All', filterTool:'Tools', filterMat:'Materials', filterFood:'Provisions', filterAlchemy:'Alchemy', filterLore:'Knowledge', btn:'Craft' },
        inv:   { filterAll:'All', filterMat:'Materials', filterTool:'Tools', filterLore:'Other' },
        settings: { langLabel:'🗺️ Language / Jazyk' },
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
        condBroken: '💥 Broken'
    },
    settingsUI: {
        volume: 'Volume',
        fireVolume: '🔥 Hearth Volume',
        fireVolumeDesc: 'Controls only the sound of the burning hearth',
        theme: '🎨 Theme',
        themeClassic: 'Classic Parchment',
        themeDark: 'Dark Mode 🌙',
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
            hunt:'Hunt', bark:'Cut', default:'Search',
            cancel:'CANCEL', claim:'COLLECT',
            quick:'Quick!', quickDesc:'Gather by hand',
            done:'Done!', waiting:'Waiting...', remaining:'Remaining:',
            instantly:'Instantly!'
        },
	titivillus: [
        '👿 Titivillus hath visited. A note hath vanished.',
        '👿 "Scripsi totum..." — yet Titivillus claimed the fruit of thy labor.',
        '👿 The ink runs thin. A letter hath slipped into his sack.',
        '👿 Titivillus gathers errors for the Devil. Today he took thine.',
        '👿 "Est mihi causa mali..." Thy blunder, his gain.'
    ],
        game: {
            eat:'Eat', required:'(Required)',
            techDone:'DONE', techStudy:'Study', techRequired:'Required:',
            noTinderbox:'Thou hast no tinderbox!',
            fireKindled:'The hearth is kindled.',
            needFire:'The hearth must burn first!',
            plotLocked:'Locked! (Tech required)',
            needHoe:'A hoe is needed!',
            needFertilizer:'Fertilizer is needed!',
            needSeeds:'Seeds are needed!',
            needWater:'Water is needed!',
            growing:'Growing...',
            needWell:'❌ Thou must first build a well in Crafting!',
            frozenHands:'Thy hands are too cold to work!',
            missingMats:'Materials are wanting!',
            notEnoughResearch:'More study is needed!',
            notFood:'That cannot be eaten!',
            noFood:'Thou hast none!',
            busy:'Already occupied!',
            quickScavenge:'Quick gather!',
            rareFind:'⭐ Rare find: Netolický\'s bitter legacy!',
            candleBurnedOut:'The candle hath burned out.',
            hungry:'⚠️ Hunger claimeth thee!',
            saveExported:'💾 Save exported!',
            saveExportFail:'❌ Export failed!',
            saveImported:'✅ Save imported! Reloading...',
            saveImportFail:'❌ Invalid save file!',
	    waterDrawn: '🚰 +{amt} water',
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
        done: "Done!",
        interrupted: "Interrupted.",
        scavengeResult: "{msg} +{total} pcs.",
        scavengeNothing: "{msg} They found nothing."
        },
        notify: {
            langSwitched:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Language set to English.',
            kindleHint:'🔥 Kindle the hearth — drive out the cold.'
        },
        langPicker: {
            heading:'Scriptorium',
            sub:'Anno Domini 1465 · Olomouc',
            prompt:'Choose thy tongue',
            btnCs:'🇨🇿 Česky',
            btnEn:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 English'
        },
        consent: {
            text:'📜 <strong>Scriptorium doth employ Google Analytics</strong> to measure thy progress through the craft — which arts thou dost master, how long thou remainest at the desk. No personal tidings are shared.',
            moreInfo:'Learn more',
            grant:'I consent',
            deny:'I refuse',
            policyTitle:'Scriptorium Analytics — what we observe:',
            policyBody:'• Thy progress (unlocked arts, achievements)\n• Session length and return visits\n• Which parts of the scriptorium thou dost frequent\n\nWhat we do NOT observe:\n• No personal data\n• IP addresses are anonymised\n• Naught is shared beyond Google Analytics\n\nConsent may be revoked by removing the localStorage key "scriptorium_consent".'
        },
        welcome: {
            text:'Thou hast found an abandoned workshop.<br><br>Upon the desk: a cold tinderbox, a shard of flint, a few sheets of parchment thick with dust. Through the shutter comes a steady knocking — someone in the next street works a new machine. They call it a <em>printing press</em>.<br><br>That is outside. In here there is only dark and cold.<br><br><strong>Begin with what thou hast. So let the fire be kindled upon the hearth anon!</strong>',
            btn:'Enter →',
            aboutLink:'About & Credits →'
        },
        about: {
            version:'Version:', date:'Date:', dateVal:'6 April 2026', author:'Author:',
            aboutTitle:'About the Game',
            aboutText:'A medieval idle game about copying manuscripts, crafting paper, and studying in a monastery scriptorium. Blends survival mechanics (fire, light, hunger) with crafting, gardening, and gradual technology unlocks. Historically grounded, set in the year 1465 in Olomouc.',
            r771:'i18n Phase 1 complete — full UI translation into English',
            r772:'61 historical books in the library',
            r773:'Collapsible tech cards — lore preview, expandable detail',
            r774:'Well system, Games & Records, Divination — localised',
            r761:'CZ/EN localisation — language choice on first launch',
            r762:'English (Olde) — authentic medieval style',
            r763:'Language switcher in Settings, ?lang=en URL support',
            fullChangelog:'📜 Full changelog & Credits →'
        },
        fireout: {
            heading:'The Workshop Lies Cold',
            btn:'Seek the flame →',
            absence:'Away for:',
            texts: [
                'The ash in the hearth is cold. Utterly cold.<br><br>It took thee time — yet thou art returned. The workshop waits as thou didst leave it. Parchment on the desk. Ink congealed. Quill dry.<br><br>Only the fire needeth to be kindled anew.',
                'Thou hast been away {days} {dayWord}.<br><br>The scriptorium is silent and cold. The candle burned out, the torch long spent. Yet the manuscripts remain. Parchment waiteth more patiently than men.<br><br>The desk is ready. Only warmth is wanting.',
                'Three days gone. Perhaps more.<br><br>The abbot would say: <em>"Acedia — sloth of spirit — is the scribe\'s true enemy."</em> Yet thou art here now. And that doth count for something.<br><br>Strike the tinder. Begin where thou left off.'
            ],
            dayWord: { one:'day', few:'days', many:'days' }
        },
        meta: {
            title:'Scriptorium — Medieval Monastery Idle Game',
            desc:'A medieval idle game set in a monastery scriptorium. Copy manuscripts, tend thy garden, and unlock the secrets of parchment and ink.',
            ogLocale:'en_US'

        },
lore: { 
        tabResearch:'Research', 
        tabCodex:'Codex', 
        tabNotebooks:'📓 Notebooks', 
        tabAchievements:'Achievements',
        notes:'Notes:', 
        discovered:'Discovered:',
	notebooks_empty: 'Thou hast no notebooks as yet',
        notebooks_hint: 'Unlock the "Basics of Writing" tech (3 research) and craft thy first Tabula!',
        darkTitle: 'Darkness Claimeth This Place',
        darkDesc: 'Light a Torch or Candle in the Workshop.',
        darkness: 'Darkness claimeth this place',
        darkness_hint: 'Light a Torch or Candle in the Workshop.'
    },
    library: { 
        tabBooks:'📚 Books', 
        tabRecords:'🏅 Records', 
        tabGames:'🎲 Aula Ludi',
        tabIching:'☯️ Divination', 
        tabNews:'📜 Tidings',
	    locked: 'Locked',
        divination_hint: 'Unlock the "Ancient Wisdom" tech to access divination.',
        records_hint: 'Unlock the "Games and Records" tech to access mini-games and statistics.',
        iching_title: '☯️ I-Ching (Book of Changes)',
        iching_need_book: 'Thou lackest the Book of Changes',
        iching_craft_hint: 'Craft it within the Crafting → Knowledge section.', 
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
            local: "Prague & Bohemia"
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
                content: ``
            },
            book_jenson_spy: {
                title: "The Spy Who Never Returned: Jenson's Secret",
                author: "Royal Chronicles & Secret Archives",
                content: ``
            },
            book_manutius: {
                title: "The Smartphones of the Renaissance: Aldus Manutius",
                author: "Venetian Trade Register",
                content: ``
            },
            book_scribes_war: {
                title: "The War of Scribes: The Virgin and the Harlot",
                author: "Filippo de Strata & Johannes Trithemius",
                content: ``
            },
            book_prague_mystery: {
                title: "The Mystery of the Prague Printer: Birth in Secrecy",
                author: "Prague Archives & Urban Legends",
                content: ``
            },
            book_severin_dynasty: {
                title: "The Severýn Dynasty: The Printer at the Town Hall",
                author: "Archives of the Old Town of Prague",
                content: ``
            },
            book_melantrich: {
                title: "The Predator of Prague: The Empire of Jiří Melantrich",
                author: "Royal Chamber and Guild Records",
                content: ``
            },
            book_rudolf_alchemists: {
                title: "The City of Fools and Geniuses: Rudolf II and the 300 Alchemists",
                author: "Secret Court Chronicle",
                content: ``
            },
            book_czech_glass: {
                title: "The Fragile War: Bohemian Glassmaking vs. Venice",
                author: "Secret Master of the Glassmakers' Guild",
                content: ``
            },
            book_hussite_wars: {
                title: "Ashes of Memory: The Hussite Wars and the End of Libraries",
                author: "Laurentius de Březová (Vavřinec z Březové)",
                content: ``
            },
            book_de_arte_predicandi: {
                title: "De arte predicandi: The Cursed Incunable of Mainz",
                author: "Aurelius Augustinus (Printed by Fust & Schöffer)",
                content: ``
            },
            book_kutnohorska_bible: {
                title: "The Kutná Hora Bible: A Detective Story from the Archives",
                author: "Martin of Tišnov (Printer of the Prague Bible)",
                content: ``
            },
            book_olomouc_misal: {
                title: "The Olomouc Missal: The War of Vellum and Paper",
                author: "Johann Sensenschmidt",
                content: ``
            },
            book_faust_secret: {
                title: "Faust's Covenant: A Myth Clad in Lead",
                author: "An Unknown Heretic and Alchemist",
                content: ``
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
                title: "",
                author: "",
                content: ``
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
            }
        },


        book_rudolf_alchemists: {
            title: 'The City of Madmen and Geniuses: Rudolph II and the 300 Alchymists',
            category: 'local',
            unlockDay: 22,
            icon: '🔮',
            author: 'A Secret Court Chronicle',
            year: 1583,
            content: `**Prague as the Occult Navel of the World**

In the Year 1583, the Emperour of the Holy Roman Empire, the eccentrick and melancholy Rudolph II, 
made a most shocking Resolution. [cite: 69] He removed the entire Imperial Court from Vienna unto Prague. [cite: 70] The City was transformed over Night.
Rudolph, obsessed with Hermetism, the Stars, and the Occult, gathered at his Court an incredible Throng of **300 Alchymists, Magi, and Mountebanks** from all Europe.
[cite: 70] Amongst them were the legendary Englishmen – the Scholar John Dee, who communed with Angels, and his strange Companion Edward Kelley, a Master of Illusions.
[cite: 70]

**The Secrets of the Golden Lane**

Legend hath it that the small, cramped Dwellings affixed to the Walls just below the Prague Castle (the Golden Lane) served as secret Laboratories for these Masters.
 Above the Hearths, Retorts and Crucibles bubbled Day and Night.
All sought the *Lapis Philosophorum* – the legendary Philosophers' Stone, the Elixir of Eternal Youth, and that Substance which might transmute base Metals into pure Gold.
 

Gold for the Emperour they never found... But in their fanatical Experiments, they unwittingly laid the Foundations of Modern Science.
By meer Chance, they discovered:
- The Manufacture of Oil of Vitriol (Sulphurick Acid).
- Elementary Phosphorus, glowing in the Dark.

- The Isolation of Zinc and other Compounds.

**Death amongst the Stars**

In this esoteric Atmosphere, the famous Danish Astronomer Tycho Brahe also lived and laboured in Prague.
 His precise Measurements of the Stars without a Telescope move Men to Wonder even to-day.
He died here in the Year 1601 – according to the Gossips of the Time, 'twas at a Banquet where, by Court Etiquette, he could not rise from the Table, and his Bladder burst.
However, modern Analysis of his Beard hath revealed a more ghastly Truth: **Mercury Poisoning**, likely from his own Alchymical Elixirs, which he took for his ailing Kidneys.


In Rudolphine Prague, the Boundary between Magick and the nascent Modern Science was blurred.
 It was a Time distracted, perilous, but incredibly fruitful.


*"In the Mist above the Moldau, the Veil between Dream and Reality is as thin as Parchment. We sought Gold, but found the very Composition of the Stars."* - John Dee in his Journals`
        },
        book_czech_glass: {
            title: 'A Fragile War: Bohemian Glassmaking vs. Venice',
            category: 'local',
            unlockDay: 25,
            icon: '💎',
            author: "A Secret Master of the Glassmakers' Guild",
            year: '13th-18th Centuries',
            content: `**The Secret of Forest Crystal**

Few suspect that while Europe bled in Wars of Territory, there occurred in Parallel another War, much quieter yet far more lucrative – the War for Light.
Bohemian Forest Glassmaking experienced a Flourishing since the **13th Century** and was accounted amongst the absolute finest in all Europe.
 The Glassworks hidden deep in the frontier Forests (the Bohemian Forest, the Jizera Mountains) possessed an inexhaustible Source of Wood for the Furnaces and quality Potash from Ash, which gave Bohemian Glass its typical Purity and Hardness.
**The Blood Diamonds of Bohemian Kings**

Bohemian Glass and Gemstones were a strategick Wealth.
For Instance, the dark red Bohemian Garnet (Pyrope) from Podsedice was so extremely prized and sought after at Courts that the Emperour Rudolph II
utterly forbade its Export from the Land **under Pain of Death**.
 Later, in the 18th Century, Jablonec cut Crystal and Jewellery became such a Commodity that in certain Parts of the World (e.g., in African Colonies), these Glass Pearls **served as Currency in Place of Coin**!
 It was the primary Article of Export, which sustained entire Generations of Mountaineers.


**Venetian Jealousy and Industrial Espionage**

Our principal Rival was proud Venice.
The Venetians for many Centuries held an absolute **Monopoly** on the Manufacture of luxurious Mirrors and delicate Glass.
 They were so jealous of this Secret that they interned all their Glass-masters upon the isolated Island of **Murano** under Threat of draconian Punishments.
It was a forced golden Cage – and de facto the first organised Technological Quarantine in the World.
 Whosoever should dare to flee the Island with the Secret, against him the Authorities dispatched hired Assassinators.
He was automatically declared a Traitor to the Republick.

Notwithstanding the Assassinators, the Bohemians succeeded in obtaining the Venetian Receipts through Spies, Merchants, and Fugitives.
We improved them by the Addition of Chalk and created the so-called *Bohemian Crystal* – Glass that was more massive, could be beautifully ground and engraved, which the thin Venetian Glass could not endure.
The Monopoly ended, and Bohemian Dominance commenced. Glassmaking was, in Truth, not merely a Craft; it was the high-tech Industry of that Age, combining occult Alchymy with Opticks.


*"Our Glass is frozen Light, carved from the Sweat of Forest Labourers and the Tears of Venetian Merchants."* - A Master Glass-maker of the North`
        },
        book_hussite_wars: {
            title: 'Ashes of Memory: The Hussite Wars and the End of Libraries',
            category: 'local',
            unlockDay: 28,
       
     icon: '🔥',
            author: 'Laurentius de Březová',
            year: 1419,
            content: `**An Apocalypse of Culture and Blood**

The Hussite Wars (1419–1434) were no meer local peasant Rebellion.
They were brutal, and indeed the first truly great Religious Wars upon the Continent of Europe, which shook the very Foundations of the Western World.
 The Toll of this Conflict was most dire – it is estimated that the Bohemian Lands lost, by Famine, Pestilence, and the Sword, up to **one Third of their entire Population**.


**The Fire that Consumed Centuries**

While the reformative Ideas of the Chalice spread a new Interpretation of the Faith, the Armies of the radical Hussites (the Taborites and Orphans) left Ruin in their Wake.
To them, the Monasteries were Symbols of Ecclesiastical Corruption and Wealth. Yet with their pillaging and burning, the Flames devoured that which was most precious – the Monastick Libraries, those vast Treasuries of Mediaeval Erudition.
In a few Years, Hundreds of Thousands of Pages were irrevocably burnt:
- At Vyšší Brod, Libraries containing Thousands of rare Works were set ablaze (some Sources speak, with Hyperbole, of up to 70,000 Volumes).

- At Zlatá Koruna, Thousands of hand-written and illuminated Manuscripts from all Europe were lost to the Flames.

- At the Emmaus Monastery in Prague, unique Old-Slavonick Texts and Chorals were reduced to Ashes.


**The Price of Accents and Diatriticks**

The Loss of Cultural Memory was absolute.
That which was then burnt – unknown Antient Texts, old Bohemian Chronicles, antient Medical Treatises – we shall never discover again.
They are the vacant Places of our History. 

At the Beginning of this fiery Hell stood Master John Huss (1372–1415), a charismatick Preacher burnt at Constance for Heresy.
 Though the Teaching of Huss did not survive in its pure Form, it endured in Thought for two hundred Years until the Advent of Martin Luther.
 Paradoxically, the most enduring Legacy of Huss is not merely religious, but linguistic.
By his Treatise *De orthographia bohemica* (1406), he simplified the complex Orthography of Digraphs and genially reformed the Bohemian Tongue by the Introduction of **Hooks and Accents** (nabodeníčka).
 Were it not for his linguistic Vision, we should write Names and Words as awkwardly as the Poles, heaping Consonants one after another.


Subsequently, the newly-founded South Bohemian military City of **Tabor** (established 1420) became the Scene of a primal Social Experiment – it functioned as an early, radical "Democratical" Community, where equal Brothers and Sisters elected their Captains and Pastors, and where (at least initially) Money held no Dominion, but communal Vats were used instead.
 

The Reformation brought to the Land an unprecedented Freedom of Thought and stood against mighty Europe, but we paid for it with the Blood of entire Generations and with Fire that consumed our Past.


*"The Truth of God triumpheth over all, yet at the Battle's End, naught remaineth but hot Ashes and the Lamentation of Widows."* - The Motto upon the Banner of the Vanquished`
        }
    },
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
        senders: {
            scribe: "The Elder Scribe",
            unknown: "Unknown",
            monastery: "From the Monastery"
        },
        news_0: "Knowest thou that in the monastery o'er the hill they scribe through the night? 'Tis said they have vellum from their own flock.",
        news_3: "I was in the refectory. They read a manuscript none of us had ever laid eyes upon. They called it the Regula.",
        news_7: "They seek an experienced scribe for the Monastery of St. Procopius. Labor for God, not the market. I ponder on it.",
        news_10: "Hast thou heard the morning bells? They scribe since Matins. We write only by daylight. Perchance we miss something.",
        news_15: "A patron brought a leaf from Mainz. He calleth it 'Print'. Swift. Soulless. Yet cheap.",
        news_20: "A brother from the monastery approached me. He offered a trade — our paper for their vellum. A fair bargain?",
        news_25: "The abbot seeketh a scribe who knoweth gall ink. For a special commission, 'tis said. From the bishop.",
        news_28: "Hast thou decided who thou art? A craftsman — or a servant? Both paths are honorable. But they are not the same."
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
        desc: 'Cultivate rare flora. The soil requires thy care.',
        fertilize: 'Fertilize',
        locked: 'Locked',
        lockedTech: 'Tech Tree',
        herb: 'Herbs',
        vegetable: 'Vegetables',
        special: 'Special',
        any: 'Any crop',
        sow: 'Sow',
        water: 'Water',
        dry: 'Parched',
        growing: 'Growing...',
        grown: 'Ready',
        harvest: 'Harvest',
        wait: 'Wait'
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
        stats: '📊 Personal Records',
        harvests: '🌿 Harvests',
        gamesWon: '🎮 Games Won',
        meals: '🍖 Meals',
        candles: '🕯️ Candles',
        wellUses: '💧 Well',
        streakDays: 'days',
        streakMax: 'best',
        backup: '💾 Safekeeping',
        backupDesc: 'Export thy progress for safekeeping or another device.',
        backupWarning: '💡 We urge thee to secure a copy ere making grave changes!',
        backupReset: 'To reset the game, visit Settings.',
        downloadSave: '📥 Download Save',
        uploadSave: '📤 Upload Save'
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
  rubricator_requirement: 'Tech illumination + gallic_ink',
  
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

    records: {
  // Stats labels (with emoji included)
  stats: '📊 Personal Statistics',
  items: '📦 Items',
  discovered: '📖 Discovered',
  crafts: '⚒️ Crafts',
  harvests: '🌿 Harvests',
  researchGained: '📜 Research Gained',
  tech: '👑 Tech',
  gamesWon: '🎮 Games Won',
  mealsEaten: '🍖 Meals Eaten',
  candlesLit: '🕯️ Candles Lit',
  well: '💧 Well',
  streak: '🔥 Streak',
  days: 'days',
  max: 'max',
  booksRead: '📚 Books Read',
  booksUnlocked: '📖 Books Unlocked',
  
  // Backup section
  backupTitle: '💾 Save Backup',
  backupDesc: 'Export thy save as backup or transfer to another device.',
  btnDownload: '📥 Download Save',
  btnUpload: '📤 Upload Save',
  backupNote: '💡 Before great experiments, we recommend downloading a backup!<br>For game reset, go to Settings.'
},


    games: {
  // Header
  title: '🎮 Miniature Games',
  
  // Memory Game
  memoryName: 'Memory Game',
  memoryDesc: 'Match pairs of discovered items!',
  memoryCraft: 'Craft playing_cards',
  
  // Royal Game of Ur
  urName: 'Royal Game of Ur',
  urDesc: 'The world\'s oldest game (2600 BCE)',
  urTech: 'Tech: Ancient Games (6 Research)',
  urCraft: 'Craft ur_board',
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
  primeroCraft: 'Craft primero_deck',
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
  karnoffelCraft: 'Craft karnoffel_deck',
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
  freecellCraft: 'Craft french_deck',
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
  rithmoCraft: 'Craft rithmomachia_board',
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
  rithmoRulesTitle: 'RITHMOMACHIA — Rules',
  rithmoRulesMovement: '🎯 Movement: Circles move 1 square, Squares 2, Triangles 3. Pyramids combine all.',
  rithmoRulesCapture: '⚔️ Capture: You can capture opponent\'s piece if your number matches a mathematical relationship (equality, multiple, difference).',
  rithmoRulesVictory: '🏆 Victory: Capture 3 opponent pyramids OR exceed 160 points from captured pieces.',
  rithmoRulesHistory: '📜 History: The game dates from 1030 AD, played at medieval universities as arithmetic and geometry exercise.',
  
  // Common buttons
  btnPlay: 'Play 🎮',
  btnRules: '📖 Rules'
},
};