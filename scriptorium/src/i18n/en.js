// Scriptorium i18n — English (Olde)
// Základ: STRINGS_cs. Chybějící klíče → fallback na CS automaticky.

const STRINGS_en = {
        nav: { home:'Workshop', garden:'Garden', craft:'Craft', inv:'Satchel', lore:'Scriptorium', library:'Library' },
        screens: { home:'The Workshop', garden:'The Garden', craft:'Crafting', inv:'Thy Satchel', lore:'Scriptorium', library:'The Library', settings:'Settings' },
time: { night: 'NIGHT', morning: 'MORNING', forenoon: 'FORENOON', noon: 'NOON', afternoon: 'AFTERNOON', evening: 'EVENING' },
    header: { weatherNow: 'Presently in Prague (click to refresh)', weatherTomorrow: 'Morrow\'s forecast', hunger: 'Hunger', streak: 'Daily Streak', research: 'Knowledge Gathered', settings: 'Settings' },
    wellUI: { title: '🚰 The Well', notBuilt: 'Thou hast no well. Thou mayest construct one below.', buildBasic: '🏗️ Construct Well (20 rock, 10 branch, 3 rope)', level: 'Tier:', condition: 'Condition:', clean: '✨ Purify (powder)', repair: '🔧 Repair (kit)', upgrade: '🏛️ Fortify with Stone (30 rock, 5 rope, 10 charcoal)' },
    settingsUI: { volume: 'Volume', theme: '🎨 Theme', themeClassic: 'Classic Parchment', themeDark: 'Dark Mode 🌙', themeSpring: 'Spring 🌸', themeSummer: 'Summer ☀️', themeAutumn: 'Autumn 🍂', themeWinter: 'Winter ❄️', themeAuto: 'Auto (Weather) 🌦️', themeAutoDesc: 'The theme shall adapt to the present weather in Prague.', reset: 'Reset', resetDesc: 'Erase thy progress.', resetBtn: 'Erase', backup: '💾 Safekeeping', backupDesc: 'Export thy progress for safekeeping or another device.', downloadSave: '📥 Download Save', uploadSave: '📤 Upload Save', resetGame: '🗑️ Reset Game', backupWarning: '⚠️ We urge thee to secure a backup ere making grave changes!', about: 'About', aboutDesc: 'Version, changelog and credits', showBtn: 'View', footerMadeIn: 'Forged with ❤️ in Nový Bor by Ondrex' },
    titivillus: [ '👿 Titivillus hath visited. A note hath vanished.', '👿 "Scripsi totum..." — yet Titivillus claimed the fruit of thy labor.', '👿 The ink runs thin. A letter hath slipped into his sack.', '👿 Titivillus gathers errors for the Devil. Today he took thine.', '👿 "Est mihi causa mali..." Thy blunder, his gain.' ],
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
        craft: { filterAll:'All', filterMat:'Materials', filterFood:'Provisions', filterAlchemy:'Alchemy', filterLore:'Knowledge', btn:'Craft' },
        inv:   { filterAll:'All', filterMat:'Materials', filterTool:'Tools', filterLore:'Other' },
        settings: { langLabel:'🗺️ Language / Jazyk' },
header: {
        weatherNow: 'Presently in Prague (click to refresh)',
        weatherTomorrow: 'Morrow\'s forecast',
        hunger: 'Hunger',
        streak: 'Daily Streak',
        research: 'Knowledge Gathered',
        settings: 'Settings'
    },
    wellUI: {
        title: '🚰 The Well',
        notBuilt: 'Thou hast no well. Thou mayest construct one below.',
        buildBasic: '🏗️ Construct Well (20 rock, 10 branch, 3 rope)',
        level: 'Tier:',
        condition: 'Condition:',
        clean: '✨ Purify (powder)',
        repair: '🔧 Repair (kit)',
        upgrade: '🏛️ Fortify with Stone (30 rock, 5 rope, 10 charcoal)'
    },
    settingsUI: {
        volume: 'Volume',
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
        footerMadeIn: 'Forged with ❤️ in Nový Bor by Ondrex'
    },
        actions: {
            hunt:'Hunt', bark:'Cut', default:'Search',
            cancel:'CANCEL', claim:'COLLECT',
            quick:'Quick!', quickDesc:'Gather by hand',
            done:'Done!', waiting:'Waiting...', remaining:'Remaining:'
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
	    successImport: '✅ Save imported! Refreshing to be certain.'
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
            text:'Thou hast found an abandoned workshop.<br><br>Upon the desk: a cold tinderbox, a shard of flint, a few sheets of parchment thick with dust. Through the shutter comes a steady knocking — someone in the next street works a new machine. They call it a <em>printing press</em>.<br><br>That is outside. In here there is only dark and cold.<br><br><strong>Begin with what thou hast.</strong>',
            btn:'Enter →'
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
        discovered:'Discovered:' 
    },
    library: { 
        tabBooks:'📚 Books', 
        tabRecords:'🏆 Games & Records', 
        tabIching:'☯️ Divination', 
        tabNews:'📜 Tidings' 
    },
    library_lore: {
        new_book: "📚 A new tome hath arrived! ({count})",
        lib_title: "The Library",
        lib_unlocked: "unlocked",
        lib_read: "Perused",
        lib_not_avail: "The Library is shut unto thee.",
        lib_unlocks_in: "Unlocks in",
        lib_days: "days",
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
                content: "**The Usurer's Loan and a Bitter End**\n\nJohannes Gutenberg was undoubtedly a visionary who altered the course of history, yet he was a man without a penny. To realize his secret project, he borrowed the astronomical sum of 1,600 guilders from the Mainz lawyer and wealthy merchant Johann Fust. As collateral, he offered the only thing he had—he pledged his workshop, his innovative presses, and his famous 42-line Bible, which he was currently printing with immense effort.\n\n**The Helmasperger Notarial Instrument (November 6, 1455)**\n\nJust before the Bible could be completed and begin to yield a profit, Fust struck a severe blow. Driven by the prospect of gain, he accused Gutenberg of not having \"eaten the money in books,\" but of having misappropriated it for other purposes. The subsequent trial was relentless and ruled in Fust's favor. Gutenberg lost everything overnight—his presses, his carefully cast metal type, and his precious paper.\n\n**Who was the Judas of the Printing Art?**\n\nHistory points the finger at Peter Schöffer! He was Gutenberg's most talented journeyman and originally a skilled scribe from Paris. It was he who coldly testified against his own master in court! The reward was not long in coming—Fust took the astute Schöffer as his business partner and, to seal the alliance, later gave him his own daughter Christina in marriage. Gutenberg's life's work and workshop thus passed seamlessly under the new, aggressive brand of Fust & Schöffer. Soon after, in 1459, this powerful duo published the famous work *Rationale Divinorum Officiorum*.\n\n**The Dark Legend of Doctor Faust**\n\nJohann Fust was incredibly successful as a merchant. He flooded the market with such a vast quantity of books, printing identical copies with such speed, that the common people began to whisper dark rumors: the man must have sold his soul to the devil himself. This is allegedly the origin of the terrifying legend of Doctor Faust (arising from a corruption of the names Fust and Faust), which was made famous centuries later by the German poet Goethe. In the eyes of the illiterate populace of the time, the entirely new technology of printing was simply pure, dark magic!\n\n*\"He who betrays his master gains an empire, but loses his soul. Blood is ever mingled with the ink.\" - An old chronicle record*"
            },
            book_jenson_spy: {
                title: "The Spy Who Never Returned: Jenson's Secret",
                author: "Royal Chronicles & Secret Archives",
                content: "**A Secret Mission to the Heart of the Holy Roman Empire (1458)**\n\nKing Charles VII of France heard incredible rumors of a \"miracle in Mainz.\" Utterly fascinated, in 1458 he dispatched his finest coin engraver, Nicolas Jenson, on a highly classified espionage mission to Germany. The King's order was clear: *\"Learn this new art, discover how it is done, and bring the secret home for the glory of France!\"*\n\n**The Defection of the Master Engraver**\n\nJenson indeed arrived in Mainz and mastered the revolutionary printing technology in every detail. However, he discovered something profound—printing offered him a freedom that the anxious royal court would never provide. He never returned to his King! After years of silence, he emerged triumphantly in 1470 in Venice, the free commercial heart of contemporary Europe. Here he established his own prosperous printing house and created the **Antiqua** typeface. Jenson is widely recognized today as the true father of the Roman typeface.\n\n**The Birth of Modern Typography**\n\nOne of the first books he published in Venice in 1470 was Eusebius's renowned work *De evangelica præparatione*. Jenson's design was entirely revolutionary: the typeface was not merely a slavish copy of old manuscript models, but was based on entirely new typographic principles. The flowing forms and subtle serifs helped the eye glide across the page. It was a typeface so timeless and perfect that its principles are still used today (even the famous Times New Roman font is conceptually derived directly from it).\n\n**The Venetian Asylum**\n\nIn liberal Venice, Jenson was instantly regarded as an absolute luminary. The King in Paris raged and plotted revenge, but there was nothing he could do. The proud Italian city-states fiercely protected their artists and master craftsmen from any external interference. Nicolas Jenson died a wealthy, revered, and celebrated man. His brilliant typeface has survived a full five centuries.\n\n*\"The King sends a spy bound by duty, but the beauty of art sets him free.\" - Venetian proverb*"
            },
            book_manutius: {
                title: "The Smartphones of the Renaissance: Aldus Manutius",
                author: "Venetian Trade Register",
                content: "**Aldus Manutius - The Visionary of His Age**\n\nThis Venetian printer and humanist (1449–1515), who founded the renowned Aldine Press in 1494, was a true visionary who forever altered the consumption of text. Before him, books—known as incunabula—were massive, heavy, and unwieldy folios that had to rest upon a solid table in a library. Manutius, however, invented a revolutionary octavo format called the **enchiridion** (handbook). These were small books, the direct predecessors of today's modern paperbacks, which easily fit into a saddlebag or the folds of a cloak.\n\n**The Mobility of Knowledge and Purity of Text**\n\nSuddenly, nobles and merchants could read even on long journeys! Students could purchase Aristotle or Homer for the price of a standard dinner. Overnight, books ceased to be untouchable pieces of furniture and became accessible personal guides for everyday life. Furthermore, Manutius was obsessed with accuracy. He desired to publish classical Greek texts in their original, pure form, undistorted by centuries of poor translations. To this end, he collaborated with the foremost scholars of his time, including the famous Erasmus of Rotterdam.\n\n**The Invention of Italics**\n\nTo fit as much text as possible into a small, inexpensive book and save on costly paper, Manutius hired the brilliant engraver Francesco Griffo. Griffo created an entirely new typeface that imitated the elegant yet economical slanted handwriting of Renaissance clerks and humanists—**italics**. It was not originally intended for emphasizing text, as we use it today, but purely for the economic conservation of paper! Their 1501 edition of Virgil's *Opera* was the very first book in the world printed with this new, economical typeface.\n\n**The Dolphin and the Anchor**\n\nHis unmistakable printer's mark was a swift dolphin (symbolizing speed and constant innovation) entwined around a steadfast anchor (symbolizing stability, reliability, and diligence). His lifelong motto was: **Festina Lente** (Make haste slowly). Manutius proved to the world that books need not be merely locked treasures in chests, but active tools in the hands of the people.\n\n*\"A small book in the hand is mightier than a massive one upon the table. The freedom of thought lies in the pocket.\"*"
            },
            book_scribes_war: {
                title: "The War of Scribes: The Virgin and the Harlot",
                author: "Filippo de Strata & Johannes Trithemius",
                content: "**\"The Pen is a Virgin, the Press a Harlot\"**\n\nNot everyone welcomed the invention of the printing press with open arms. Filippo de Strata, a Venetian monk and professional scribe, became a radical voice of resistance. Sometime between 1473 and 1474, he penned a desperate and fiery polemic addressed to the then Doge of Venice, Nicolò Marcello, imploring him to have printing presses banished from the city for good. In his text, he uncompromisingly proclaimed:\n\n*\"The pen is a pure virgin, the press a prostituted harlot! Printers are pimps who flood the market, printing love poetry so that young girls read Ovid only to learn sin and vice. These printers guzzle wine, get drunk in taverns, and sell the sanctity of the text for a few coins!\"*\n\nThe wealthy city, he argued, was stuffed with books, yet had completely and irrevocably lost its soul.\n\n**Trithemius's Paradox (1492)**\n\nOn the other side of Europe, the prominent Abbot Johannes Trithemius joined the cultural fray. In 1492, he wrote the now-legendary work **De Laude Scriptorum** (In Praise of Scribes). In this treatise, he fervently urged his monks to under no circumstances cease copying texts by hand, citing the undeniable quality of the material:\n\n*\"A printed book is made merely of fragile paper. It will burn, succumb to insects, or inevitably disintegrate in 200 years. Conversely, our meticulous work on vellum will endure through the ages and carries spiritual value within it.\"*\n\nHowever, by a cruel historical irony of fate and a truly perfect paradox, Trithemius had this very attack against the printing press **printed** on a press in 1494, having pragmatically realized that otherwise, his urgent ideas would never reach the masses!\n\n**The End of the Golden Age of Calligraphy**\n\nThe new technology was as unstoppable as an avalanche. Many proud scribes eventually, with bitterness in their hearts, ended up in the very printing houses they despised, working as mere typesetters or proofreaders. They were forced to humiliatingly \"retrain.\" Their noble craft, which had endured without interruption or major changes for a thousand years, was absolutely eradicated in a single generation.\n\nBut their magnificent, hand-illuminated manuscripts survived. Today they lie silently in museums and vaults as noble monuments to an age when every single word required blood, sweat, and hours of absolute concentration, and was therefore deemed sacred.\n\n*\"Speed kills the beauty of detail, but truth survives in both forms.\" - The last monastic scribe*"
            },
            book_prague_mystery: {
                title: "The Mystery of the Prague Printer: Birth in Secrecy",
                author: "Prague Archives & Urban Legends",
                content: "**The First Swallow Above the Vltava**\n\nWhile printing presses had been clattering in Pilsen since 1468 (or perhaps 1476; scholars and historians still fiercely debate the exact date of the *Chronicle of Troy*), the heart of the kingdom, Prague, remained remarkably silent for an incredibly long time. The environment here was conservative and dangerous. It was not until **1487** that the first printed book suddenly appeared in Prague—the **Statuta synodalia Arnesti**, followed shortly by the renowned **Psalter**.\n\nBut who brought this technological revolution to Prague? No one knows! The master's name was carefully erased from history.\n\n**The Anonymous Master and Fear of the Guild**\n\nIn historiography, he is simply referred to as the *\"Printer of the Prague Bible,\"* after his later monumental work of 1488. Why did he conceal his identity? Late 15th-century Prague was a city of guilds. The powerful and radical guild of Prague scribes and illuminators would have perceived any mechanical competition as an existential threat. Torching a workshop full of highly flammable paper and linseed oil under the cover of night was an easy resolution to a trade dispute. Or perhaps he was a secretive foreigner, a fleeing heretic terrified of the Inquisition, who merely passed through Prague, fulfilled a commission, and vanished back into the shadows?\n\n**Splendor Woven from Darkness**\n\nYet his work bears no signs of amateurism. His Psalter is a masterpiece—beautifully sharp-cut Gothic type (bastarda), elaborate woodcuts, and a precisely printed red initial, which at the time required an incredibly demanding double pass through the press. Prague printing thus began not with slow learning, but with immediate genius wrapped in mystery.\n\n*\"In the alleys of the Old Town, tales are born that no one will ever finish writing, for ink is sometimes replaced by blood, and silence is more precious than gold.\" - Old Town Chronicler*"
            },
            book_severin_dynasty: {
                title: "The Severýn Dynasty: The Printer at the Town Hall",
                author: "Archives of the Old Town of Prague",
                content: "**Pavel Severýn of Kapí Hora (1520–1557)**\n\nThis was no ordinary craftsman with a soot-stained apron. Pavel Severýn was a man who perfectly managed to combine the scent of printer's black with the scent of political power. He began printing around **1520** in the Old Town of Prague. He quickly understood that printing was not just about books, but about influence. The printer evolved into a respected and exceptionally wealthy burgher.\n\n**A Burgomaster Backed by a Press**\n\nHis influence grew so steeply that in the tumultuous years of **1534–1537**, he was elected **Burgomaster (Mayor) of the Old Town** itself! Imagine the power—a man who decided upon laws and taxes in the kingdom's wealthiest city simultaneously controlled the machines that shaped public opinion. It was under his hands that the famous and beautifully illustrated *Severýn Bible* (1529 and 1537) was published, collaborating with the finest woodcutters in Prague. It became evident that the printing trade was no longer a marginal curiosity, but an absolute political and social force.\n\n**The Mystery of 1557**\n\nHe created a massive and excellently functioning family enterprise, involving his skilled son-in-law, Jan Kosořský of Kosoř, who later took over the workshop. The Severýn era churned out dozens of luxurious Czech and Latin works and boasted the finest connections at court and among the Utraquist nobility.\n\nBut then, around **1557**, this powerful dynasty seemingly vanished from the face of the earth. They disappeared completely from contemporary records. Did the plague, which regularly ravaged the city, kill them? Did they fall victim to secret debts? Or did they perhaps incur the wrath of the harsh counter-reformation censorship of the Habsburgs? The truth remains buried in the archives.\n\n*\"He who controls the press controls the minds of the people. And he who controls the people rules the city. But even the best printer cannot print a contract that would outwit death itself.\" - Entry from the City Council*"
            },
            book_melantrich: {
                title: "The Predator of Prague: The Empire of Jiří Melantrich",
                author: "Royal Chamber and Guild Records",
                content: "**The Rise of a Ruthless Predator**\n\nJiří Melantrich of Aventino was not a man to wait for fortune to fall into his lap. He was an ambitious, tough, and brilliant Renaissance capitalist. He began as an apprentice to the aging, immensely wealthy Bartoloměj Netolický, who boasted the lucrative title of court printer to King Ferdinand I and held a monopoly on printing laws.\n\n**Seizing Power and Building an Empire**\n\nMelantrich was an astute and charming strategist. First, he quietly worked his way up from apprentice to Netolický's **partner**. Once he acquired the know-how and contacts, he coldly **purchased** the entire printing house from the aging master in **1552** (historians still debate whether this was a fair trade or an aggressive, hostile takeover \"under the table\"). He immediately moved the workshop from the remote Lesser Town directly into the beating commercial heart of the Old Town and began building an unstoppable **empire**.\n\n**Melantrich's Bible: A Machine for Money**\n\nHis masterful strategic and commercial achievement was the famous *Melantrich Bible* (published in five successive editions). It was so linguistically and visually perfect that it was purchased by both Catholics and Protestants. Melantrich was a master of duality—he sold to all sides of the religious conflict and amassed an absolute fortune. From these vast profits, he purchased the majestic burgher palace **At the Two Camels** (on the site of today's Melantrich Street, which still bears his name).\n\n**From a Soiled Apprentice to a Nobleman**\n\nTo definitively cement his dominance and social ascent, he was granted a prestigious noble coat of arms and the majestic epithet **\"of Aventino\"** (after the Roman hill) for his political and printing services. He was no longer a craftsman; he was a Renaissance magnate. Upon his death, his highly successful enterprise was seamlessly taken over by his equally capable son-in-law, Daniel Adam of Veleslavín, creating a dynasty that culturally dominated the Czech lands for long decades.\n\n*\"In trade, as in printing, there is never room for the weak and indecisive. Only predators survive to write the rules by which the rest must play.\" - Attributed to Jiří Melantrich*"
            },
            book_rudolf_alchemists: {
                title: "The City of Fools and Geniuses: Rudolf II and the 300 Alchemists",
                author: "Secret Court Chronicle",
                content: "**Prague as the Occult Navel of the World**\n\nThe year is 1583, and the Emperor of the Holy Roman Empire, the eccentric and melancholic Rudolf II, makes a shocking decision. He relocates the entire imperial court from Vienna to Prague. The city is transformed overnight. Obsessed with hermeticism, the stars, and the occult, Rudolf gathered an incredible **300 alchemists, mages, and charlatans** from across Europe at his court. Among them were the legendary Englishmen—the scholar John Dee, who conversed with angels, and his strange companion Edward Kelley, a master of illusions.\n\n**The Secret of the Golden Lane**\n\nLegend has it that the small, cramped houses clinging to the fortifications just beneath Prague Castle (the Golden Lane) served as the secret laboratories for these masters. Over their hearths, retorts and crucibles bubbled day and night. They all sought the *Lapis Philosophorum*—the legendary Philosopher's Stone, the elixir of eternal youth, and the substance that could transmute base metals into pure gold.\n\nThey never found gold for the Emperor... But in their fanatical experiments, they inadvertently laid the foundations of modern science. Quite by chance, they discovered:\n- The production of sulfuric acid (vitriol).\n- Elemental phosphorus, glowing in the dark.\n- The isolation of zinc and other compounds.\n\n**Death Among the Stars**\n\nIn this esoteric atmosphere, the famous Danish astronomer Tycho Brahe also lived and researched in Prague. His precise measurements of the stars without a telescope astonish us to this day. He died here in 1601—according to contemporary gossip, during a banquet where court etiquette forbade him from leaving the table, causing his bladder to burst. However, modern analysis of his beard revealed a more terrifying truth: **mercury poisoning**, likely from his own alchemical elixirs, which he took for kidney disease.\n\nIn Rudolfine Prague, the line between magic and nascent modern science blurred. It was a time that was mad, dangerous, but incredibly fruitful.\n\n*\"In the mist above the Vltava, the boundary between dream and reality is as thin as parchment. We sought gold, but we found the very composition of the stars.\" - John Dee in his diaries*"
            },
            book_czech_glass: {
                title: "The Fragile War: Bohemian Glassmaking vs. Venice",
                author: "Secret Master of the Glassmakers' Guild",
                content: "**The Secret of Forest Crystal**\n\nFew realize that while Europe bled in wars over territory, another, much quieter but far more lucrative war was taking place in parallel—a war for light. Bohemian forest glassmaking had been booming since the **13th century** and ranked among the absolute best in all of Europe. Glassworks hidden deep in the border forests (the Bohemian Forest, the Jizera Mountains) had an inexhaustible supply of wood for their furnaces and high-quality potash from ash, which gave Bohemian glass its typical clarity and hardness.\n\n**The Blood Diamonds of Bohemian Kings**\n\nBohemian glass and gemstones were strategic wealth. For instance, the deep red Bohemian garnet (pyrope) from the Podsedice region was so extremely prized and sought after at courts that Emperor Rudolf II entirely forbade its export from the country **under strict penalty of death**. Later, in the 18th century, Jablonec cut crystal and costume jewelry became such a commodity that in some parts of the world (e.g., in African colonies), these glass pearls were **used as currency instead of money**! It was the number one export article that fed entire generations of highlanders.\n\n**Venetian Jealousy and Industrial Espionage**\n\nOur main rival was proud Venice. For centuries, the Venetians held an absolute **monopoly** on the production of luxury mirrors and fine glass. They were so fiercely protective of it that all their master glassmakers were interned on the isolated island of **Murano** under the threat of draconian punishments. It was a forced golden cage—and de facto the world's first organized technological quarantine. Anyone who dared to escape the island with the secret would have assassins dispatched after them by the authorities. They were automatically declared traitors to the Republic.\n\nDespite the assassins, however, thanks to spies, merchants, and refugees, the Bohemians managed to acquire the Venetian recipes. We improved them by adding chalk, creating the so-called *Bohemian crystal*—a glass that was more massive and could be beautifully deep-cut and engraved, which the thin Venetian glass could not withstand. The monopoly ended, and Bohemian dominance began. Glassmaking, in short, was not just a craft; it was the highly guarded high-tech industry of its time, combining occult alchemy with optics.\n\n*\"Our glass is frozen light, sculpted from the sweat of forest laborers and the tears of Venetian merchants.\" - Master Glassmaker of the North*"
            },
            book_hussite_wars: {
                title: "Ashes of Memory: The Hussite Wars and the End of Libraries",
                author: "Laurentius de Březová (Vavřinec z Březové)",
                content: "**An Apocalypse of Culture and Blood**\n\nThe Hussite Wars (1419–1434) were not merely a local peasant rebellion. They were brutal, the very first truly large-scale religious wars in Europe, shaking the very foundations of the Western world. The toll of this conflict was terrifying—it is estimated that the Czech lands lost up to a **third of their entire population** to famine, disease, and the sword during these years.\n\n**The Fire That Consumed Centuries**\n\nWhile the reformist ideas of the Chalice spread a new interpretation of faith, the armies of radical Hussites (the Taborites and Orphans) left devastation in their wake. Monasteries, to them, were symbols of clerical corruption and wealth. However, with their looting and burning, the flames consumed the most precious things—monastic libraries, the giant vaults of medieval scholarship.\nWithin a few years, hundreds of thousands of pages were irrevocably burned:\n- In Vyšší Brod, libraries containing thousands of rare works went up in flames (some sources hyperbolically speak of up to 70,000 volumes).\n- In Zlatá Koruna, thousands of handwritten and illuminated manuscripts from all over Europe were lost to the fire.\n- In Prague's Emmaus Monastery, unique Old Church Slavonic texts and chorales turned to ash.\n\n**The Price for Hooks and Accents**\n\nThe loss of cultural memory was absolute. What burned then—unknown classical texts, old Bohemian chronicles, ancient medical treatises—we will never rediscover. They are blank spaces in our history.\n\nAt the beginning of this fiery inferno stood Master Jan Hus (1372–1415), a charismatic preacher burned at the stake in Constance for heresy. Hus's teachings may not have survived in their pure form, but they survived in thought for another 200 years until the arrival of Martin Luther. Paradoxically, Hus's most enduring legacy is not merely religious, but linguistic. With his treatise *De orthographia bohemica* (1406), he simplified the complex spelling of digraphs and brilliantly reformed the Czech language by introducing **diacritics** (hooks and acute accents). Were it not for his linguistic vision, we would today write names and words as clumsily as the Poles, piling consonants one after another.\n\nThe subsequently established South Bohemian military city of **Tabor** (founded 1420) became the scene of a primal social experiment—it functioned as an early, radical \"democratic\" commune, where equal brothers and sisters elected their captains and priests, and where (at least initially) money was not used, but shared tubs.\n\nThe Reformation brought the country unprecedented freedom of thought and stood up to a powerful Europe, but we paid for it with the blood of entire generations and a fire that burned our past.\n\n*\"The Truth of the Lord prevails over all, but at the end of the battle, only hot ash and the weeping of widows remain.\" - Motto on the banner of the defeated*"
            },
            book_de_arte_predicandi: {
                title: "De arte predicandi: The Cursed Incunable of Mainz",
                author: "Aurelius Augustinus (Printed by Fust & Schöffer)",
                content: "**The Oldest Literary Gem in the VKOL Collection**\n\nImagine a book that remembers the very dawn of the printed word. This is a rare print from the workshop of **Johann Fust and Peter Schöffer**—yes, the very same two unscrupulous businessmen who, in the 1455 trial, robbed the helpless Gutenberg of his life's invention, his printing workshop, and his unfinished Bible.\n\n**The Dark Irony of History and the Holy Text**\n\nHistory has a twisted sense of humor. Fust and Schöffer, with the blood of betrayal on their hands, paradoxically went on to print some of the visually most beautiful and perfect books of the entire 15th century. This particular volume contains the famous work \"De arte predicandi\" (On the Art of Preaching) by the Church Father Saint Augustine. It functioned as a manual and practical guide for the clergy on how to correctly employ rhetoric to influence and teach the common people. The printing itself was verifiably completed **before 1467**, making it unquestionably one of the oldest surviving printed books (incunabula) in the world.\n\n**Salvation from Swedish Pillaging**\n\nThe fact that such a treasure from Gutenberg's successors is found in Moravian Olomouc is no coincidence. It was brought to the city by the powerful and educated Jesuits. They collected old books from all over Europe as proof that the mass-printed word could spread the Catholic faith infinitely faster than an army of scribes with pens.\n\nThe book was incredibly fortunate. The year is 1642, and during the Thirty Years' War, the Swedish armies of General Torstenson breached the walls of Olomouc and occupied the city. The Swedes looted systematically and carried away valuables by the hundreds—on northern wagons, an incredible 100 carts full of the rarest books from Olomouc monasteries and university collections disappeared to Stockholm as spoils of war. Yet this single, inconspicuous book miraculously survived. How? The Jesuits, along with several other valuables, hastily walled it up deep in the dark crypts and hid it in the roof beams before the soldiers broke down the gates.\n\n*\"This first book may bear the bitter seal of betrayal of its creator in its genesis, but the perfect beauty of its typesetting survives wars and Swedish swords.\"*\n\n---\n\n**GAME EFFECT:** Reading this book unlocks the rare skill **\"Fust's Paradox\"**. Mastery born of betrayal: once per game session, you may sacrifice 10 research points to instantly, without the need for any other materials, \"craft\" any item, even those currently locked for your level."
            },
            book_kutnohorska_bible: {
                title: "The Kutná Hora Bible: A Detective Story from the Archives",
                author: "Martin of Tišnov (Printer of the Prague Bible)",
                content: "**The Great Error of the Library Desks**\n\nSometimes the greatest adventure does not take place on a battlefield, but in the silence of a reading room. The year is 2005, and a meticulous researcher at the Research Library in Olomouc is examining an old, heavy volume that had been safely recorded and cataloged in the inventory for decades as a relatively common *\"Venetian Bible of 1506\"*. Upon closer inspection, however, the researcher experienced a shock. He discovered that he was looking at an extremely rare, Czech **Kutná Hora Bible printed by the wealthy merchant and sponsor of printing, Martin of Tišnov, as early as 1489!**\n\n**How Could Such an Error Occur?**\n\nIt was a masterful deception born of a need for completeness. Sometime in the deep past (likely in the 16th or 17th century), the book was damaged and irretrievably lost its first and last gatherings (the pages containing the beginning of Genesis and the colophon with printing details). An overzealous previous owner or collector decided to \"repair\" the book and rewrite the missing pages by hand. However, he made one colossal, albeit logical, mistake—he used ANOTHER, newer edition of the Bible that he happened to have on hand as the textual source for his transcription! And that was the Venetian print from 1506.\n\nThe scribe, beautifully completing the pages, thus physically inscribed the translation and dates from the Venetian edition into the ancient Czech Olomouc book. For centuries, librarians read this appended introduction and believed the forged title page, without examining the printed body within. The truth was uncompromisingly revealed only by modern forensic typography—comparing the unique shapes of the original printed metal type inside the book with the fonts used in Kutná Hora at the end of the 15th century.\n\nThis print thus abruptly \"aged\" and became **17 years older** than originally assumed. It was automatically ranked among the oldest complete Czech printed books in existence. And all that incredibly long time, it lay dusty, mislabeled, and underestimated on the regular library shelves.\n\n**Mysteries Waiting on the Shelves**\n\nThis event sent shivers through archivists: How many other supposedly \"common Venetian or German\" prints, scattered in repositories across Europe, are actually rare Czech incunabula? How much historical truth is safely hidden under layers of errors, incorrect catalog cards, and washable labels?\n\nIn every great historical library, thousands of volumes quietly breathe, patiently awaiting their true discovery. One only needs to look closely and attentively. One only needs to have the knowledge, carefully compare the lead type, and not blindly trust the labels glued to the spines.\n\n*\"Truth knows how to wait patiently. Sometimes it hides for centuries beneath the wrong coat.\"*\n\n---\n\n**GAME EFFECT:** You gain the passive event ability **\"The Hidden Incunable\"**. Whenever you craft luxury codices (luxury_codex), you have a permanent **5% chance of a critical success**, wherein scholars discover that even a common codex (common_codex) you produced in the past was actually a misclassified luxury original! You instantly receive double the item's value in coins and a massive bonus to research."
            },
            book_olomouc_misal: {
                title: "The Olomouc Missal: The War of Vellum and Paper",
                author: "Johann Sensenschmidt",
                content: "**A Dazzling Commission for an Entire Diocese**\n\nIt was a massive logistical and artistic undertaking. The prominent Bamberg printer Johann Sensenschmidt received an extremely prestigious commission from church dignitaries to create the new official Olomouc Missal (a liturgical book containing texts for the Mass). He completed this monumental printing task in 1488 in a staggering total run of **420 absolutely identical copies**.\n\n**Two Worlds, Two Materials**\n\nHowever, the Church was both practical and vain. Therefore, the print run was strictly divided according to the wealth of the parishes:\n- **400 copies were printed on paper** (this was the cheaper, pragmatic, and lighter variant intended for common, poorer village churches and everyday wear and tear by priests).\n- **A mere 20 copies were printed on luxury vellum** (this was an enormously expensive, heavy, and majestic variant, intended exclusively for the altars of the richest monasteries and the hands of bishops themselves).\n\n**A Unique Treasure of the Olomouc Vaults**\n\nHere the magic of the Research Library in Olomouc (VKOL) comes into play. Safely hidden in their guarded, air-conditioned vaults today are:\n- 1 rare surviving copy printed on paper.\n- And 1 absolutely incalculably valuable copy from those original 20 vellum editions!\n\nFrom a statistical standpoint? The odds that a single institution, after 500 years of wars and fires, would own both material versions of the same edition in its collection are absolutely **astronomical**. But once again, we owe this to the Olomouc Jesuits, who over the centuries collected these artifacts highly systematically, not at random. They wanted to tangibly show their students the entire evolutionary and material scale of the medieval art of printing nicely on one table.\n\n**Vellum vs. Paper: The Battle for Eternity**\n\n- **Vellum** (cleaned animal skin, mostly from calves or sheep) guaranteed durability, physical beauty, but was terrifyingly expensive and unethical. The production of a single book of this size meant the slaughter of an entire herd (often the skins of up to 3 sheep were needed just for the cover and binding of one book, not to mention the dozens of animals for the inner pages!).\n- **Paper** from crushed linen rags was incredibly cheap, dried quickly, took ink beautifully, but was vulnerable to water, mold, and fire.\n\nAbbot Trithemius, a stubborn defender of the old scribes, once warned in a pamphlet: *\"Beautiful vellum will safely endure the ages and Judgment Day, while your modern cheap paper will burn or crumble to dust in 200 years!\"* And technologically, he was absolutely right.\n\nBut historically, he was fundamentally wrong in his mathematics: because of their low price, 1,000 times more paper books were created and purchased than vellum ones, so from a purely statistical perspective, far more of them have survived in absolute numbers to this day and permanently changed the general level of education in society.\n\n**The Printer's Lesson**\n\nTangible rarity and production costs are not always the same as historical value to humanity. Printing on vellum represented luxury, a display of power and the status of a bishop. But it was that ordinary, fragile, and soiled paper print circulating among the poor that ultimately ignited the Reformation and changed the whole world. Speed and accessibility here triumphed over the absolute craftsmanship and beauty of animal skin.\n\nThe fundamental dilemma: Extreme reach of the text vs. unlimited durability of the medium? We are solving this very same basic printing dilemma with digital content in exactly the same way today, six centuries later.\n\n*\"Before us on the table lie two completely identical books with the same text and typesetting. What, then, is the vast difference between them? Only the price paid in time and blood.\"*\n\n---\n\n**GAME EFFECT:** You acquire the ancient knowledge of the masters—you permanently unlock the highest production chain for vellum volumes (vellum crafting chain): **raw hide → processed vellum → luxury vellum codex (vellum_codex)**. You will have to balance your economy carefully. While these exclusive Vellum codices have an incredible **5x higher sale value** on the markets than ordinary paper books, their production will cost you **10x more base material and time**, risking empty storehouses!"
            },
            book_faust_secret: {
                title: "Faust's Covenant: A Myth Clad in Lead",
                author: "An Unknown Heretic and Alchemist",
                content: "**Who Was the True Doctor Faust?**\n\nHistorical legend recounts with horror that the scholar and astrologer Johann Georg Faust (1480–1540), a real historical figure wandering Renaissance Germany, sold his immortal soul to the powerful demon Mephistopheles. In exchange, he gained 24 years of absolute earthly knowledge, wealth, and supernatural power before the devils carried him off to hell.\n\n**But the truth is far more pragmatic and darker...**\n\nConsider the chronological coincidence! Johann **Fust**, the wealthy financier and printer who robbed Gutenberg, published his printed volumes in unprecedented quantities. The books appeared in the markets so swiftly and in hundreds of identical, flawless copies that the superstitious and illiterate populace simply refused to believe they were created by human hands. How could an ordinary mortal transcribe a massive Bible two hundred times without a single error?\n\n**The Loop of Names (Fust ~ Faust)**\n\nThe names of these two entirely distinct men—the printer Fust and the occultist Faust—sounded so similar in the streets that in oral tradition they soon merged into one. From the real events of the invention of the printing press and the charlatan tricks of an astrologer, the ultimate myth was born.\n\n**Goethe and the Demonic Machine**\n\nOver 200 years later, the great German playwright Johann Wolfgang von Goethe wrote his life's monumental work, **Faust** (1808). He brilliantly used this old legend as a metaphor. Faust's pact with the devil was the embodiment of humanity's insatiable desire for divine knowledge, scientific progress at any cost, but also the danger of the newly emerging mechanical and industrial age, which threatened to devour human souls. The printing press, in this conception, was the first \"infernal machine.\"\n\n**Did a Pact with the Devil Ever Exist?**\n\nNo, unless you believe in horned beings smelling of brimstone. But the merchant Johann Fust did indeed draft a pact—a very real, notarized contract with Johannes Gutenberg. And in his pursuit of wealth, he betrayed and socially destroyed him without mercy. Many scholars argue that destroying the life of a genius master and stealing his life's work for personal gain is perhaps a far more terrible and real sin than signing an imaginary pact with a demon in one's own blood.\n\n*\"Sometimes reality itself, written in black printer's ink and account books, is far darker and colder than an ancient legend.\"*\n\n---\n\n**Easter Egg:** This ancient tome, filled with heretical thoughts, is unlocked in the library only to those hardened individuals who have gathered and retained exactly 666 points of forbidden research. Congratulations, you have just peered into the dark abyss of history and discovered one of the greatest secrets of the game! You are now a true master of the Scriptorium."
            }
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
        phase_deepnight: 'Deep Night'
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
};
