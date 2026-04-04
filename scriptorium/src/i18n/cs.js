// Scriptorium i18n — Čeština (master jazyk)
// Tento soubor je zdrojem pravdy pro všechny klíče.
// Při přidávání nového klíče: přidej SEM, pak do ostatních jazyků.

const STRINGS_cs = {
        nav: { home:'Pracovna', garden:'Zahrada', craft:'Výroba', inv:'Batoh', lore:'Scriptorium', library:'Knihovna' },
        screens: { home:'Pracovna', garden:'Zahrada', craft:'Výroba', inv:'Batoh', lore:'Scriptorium', library:'Knihovna', settings:'Nastavení' },
        fireplace: {
            cold:'Vyhaslý Krb', coldDesc:'Je tu zima.', kindle:'ROZEŽEHNOUT',
            lit:'Hřejivý Krb', litDesc:'Oheň dává život.'
        },
        light: {
            none:'Není světlo', noneDesc:'Tma halí knihy.',
            candle:'Svíčka (Hoří)', torch:'Louč (Praská)',
	    candleDesc: 'Malý, ale stálý plamen.',
	    torchDesc: 'Kouří a prská, ale svítí jasně.',
            btnTorch:'ZAPÁLIT LOUČ', btnCandle:'ZAPÁLIT SVÍČKU'
        },
    header: {
        weatherNow: 'Aktuálně v Praze (klikni pro refresh)',
        weatherTomorrow: 'Předpověď na zítra',
        hunger: 'Hlad',
        streak: 'Denní streak',
        research: 'Počet Research',
        settings: 'Nastavení'
    },
    wellUI: {
        title: '🚰 Správa Studny',
        notBuilt: 'Nemáš studnu. Můžeš ji postavit níže.',
        buildBasic: '🏗️ Postavit studnu (20 kámen, 10 větev, 3 provaz)',
        level: 'Úroveň:',
        condition: 'Stav:',
        clean: '✨ Vyčistit (prášek)',
        repair: '🔧 Opravit (sada)',
        upgrade: '🏛️ Vyzdít kamenem (30 kámen, 5 provaz, 10 uhel)'
    },
    settingsUI: {
        volume: 'Hlasitost',
        theme: '🎨 Téma',
        themeClassic: 'Klasické Pergamen',
        themeDark: 'Temný Mód 🌙',
        themeSpring: 'Jaro 🌸',
        themeSummer: 'Léto ☀️',
        themeAutumn: 'Podzim 🍂',
        themeWinter: 'Zima ❄️',
        themeAuto: 'Automaticky (počasí) 🌦️',
        themeAutoDesc: 'Automatické téma se přizpůsobí aktuálnímu počasí v Praze.',
        reset: 'Reset',
        resetDesc: 'Smaže postup (v6.4).',
        resetBtn: 'Smazat',
        backup: '💾 Záloha Save',
        backupDesc: 'Exportuj save jako zálohu nebo přenes na jiné zařízení.',
        downloadSave: '📥 Stáhnout Save',
        uploadSave: '📤 Nahrát Save',
        resetGame: '🗑️ Resetovat Hru',
        backupWarning: '⚠️ Před velkými změnami doporučujeme stáhnout zálohu!',
        about: 'O hře',
        aboutDesc: 'Verze, changelog a credits',
        showBtn: 'Zobrazit',
        footerMadeIn: 'Vyvíjeno s ❤️ v Novém Boru by Ondrex'
    },
        craft: { filterAll:'Vše', filterMat:'Materiály', filterFood:'Jídlo', filterAlchemy:'Alchymie', filterLore:'Vědění', btn:'Výroba' },
        inv:   { filterAll:'Vše', filterMat:'Suroviny', filterTool:'Nástroje', filterLore:'Ostatní' },
        settings: { langLabel:'🗺️ Jazyk / Language' },
        actions: {
            hunt:'Lovit', bark:'Řezat', default:'Hledat',
            cancel:'ZRUŠIT', claim:'VYZVEDNOUT',
            quick:'Rychle!', quickDesc:'Ruční sběr',
            done:'Hotovo!', waiting:'Čekám...', remaining:'Zbývá:'
        },
	titivillus: [
 	   '👿 Titivillus byl zde. Zápisek zmizel.',
	    '👿 "Scripsi totum..." — ale Titivillus vzal výsledek.',
	    '👿 Inkoust je řídký. Písmeno zmizelo do jeho pytle.',
	    '👿 Titivillus sbírá chyby pro ďábla. Dnes i tvoje.',
	    '👿 "Est mihi causa mali..." Chyba tvá, zisk jeho.'
	],
        game: {
            eat:'Sníst', required:'(Nutné)',
            techDone:'HOTOVO', techStudy:'Studovat', techRequired:'Nutné:',
            noTinderbox:'Nemáš Troud!',
            fireKindled:'Krb rozežehnut.',
            needFire:'Nejdřív oheň!',
            plotLocked:'Zamčeno! (Tech)',
            needHoe:'Motyku!',
            needFertilizer:'Hnojivo!',
            needSeeds:'Semínka!',
            needWater:'Vodu!',
            growing:'Roste...',
            needWell:'❌ Nejprve musíš postavit studnu v Řemeslo!',
            frozenHands:'Máš zmrzlé ruce!',
            missingMats:'Chybí suroviny!',
            notEnoughResearch:'Zápisky!',
            notFood:'Tohle nejde jíst!',
            noFood:'Nemáš to!',
            busy:'Jsem zaneprázdněn!',
            quickScavenge:'Rychlý sběr!',
            rareFind:'⭐ Vzácný nález: Netolického pozůstalost!',
            candleBurnedOut:'Svíčka dohořela.',
            hungry:'⚠️ Máš hlad!',
            saveExported:'💾 Save exportován!',
            saveExportFail:'❌ Export selhal!',
            saveImported:'✅ Save importován! Reloaduji...',
	    waterDrawn: '🚰 +{amt} voda',
	    needItemAmt: '❌ Potřebuješ {amt}x {item}!',
	    missingItem: 'Nemáš {item}!',
	    itemIgnited: '{item} zapálena.',
	    fed: 'Nasycen na {hours}h{bonus}',
	    itemAdded: '+{qty} {item}',
	    saveExportedFile: '💾 Save exportován: {file}',
	    overwriteSave: '⚠️ VAROVÁNÍ: Toto přepíše tvůj současný save!\n\nPokračovat?',
	    confirmReset: 'Opravdu chceš nenávratně smazat celý svůj postup a resetovat hru?',
	    newCodexEntry: '📖 Nový zápis v Codexu!',
	    errorImport: '❌ Chyba při importu!',
	    errorRead: '❌ Nelze přečíst soubor!',
	    successImport: '✅ Save importován! Refresh pro jistotu.',
            saveImportFail:'❌ Neplatný save file!',
            done: "Hotovo!",
        interrupted: "Přerušeno.",
        scavengeResult: "{msg} +{total} ks.",
        scavengeNothing: "{msg} Nic nestihli."
        },
        notify: {
            langSwitched:'🇨🇿 Jazyk přepnut na češtinu.',
            kindleHint:'🔥 Rozežehni krb – zahřej ruce.'
        },
        langPicker: {
            heading:'Scriptorium',
            sub:'Léta Páně 1465 · Město Olomouc',
            prompt:'Vyber jazyk / Choose language',
            btnCs:'🇨🇿 Česky',
            btnEn:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 English'
        },
        consent: {
            text:'📜 <strong>Scriptorium používá Google Analytics</strong> pro měření herního postupu (které technologie se odemykají, jak dlouho se hraje apod.). Žádné osobní údaje nejsou sdíleny.',
            moreInfo:'Více info',
            grant:'Souhlasím',
            deny:'Odmítám',
            policyTitle:'Scriptorium Analytics – co měříme:',
            policyBody:'• Herní postup (odemčené technologie, achievementy)\n• Délka session a opakované návštěvy\n• Které části hry se nejvíce používají\n\nCo NEMĚŘÍME:\n• Žádné osobní údaje\n• IP adresy jsou anonymizovány\n• Data nejdou třetím stranám kromě Google Analytics\n\nSouhlas lze kdykoliv odvolat smazáním localStorage klíče "scriptorium_consent".'
        },
        welcome: {
            text:'Nalezl jsi opuštěnou pracovnu.<br><br>Na stole leží vyhaslý troud, kousek křemene a pár listů pergamenu pokrytých prachem. Za oknem je slyšet rytmické klepání – někdo v sousední ulici provozuje nový stroj. Říkají mu <em>tiskařský lis</em>.<br><br>Ale to je venku. Tady uvnitř je tma a zima.<br><br><strong>Začni s tím, co máš.</strong>',
            btn:'Vstoupit →'
        },
        fireout: {
            heading:'Pracovna je studená',
            btn:'Hledat oheň →',
            absence:'Nepřítomnost:',
            texts: [
                'Popel v krbu je studený. Úplně studený.<br><br>Trvalo ti to – ale vrátil ses. Pracovna čeká, tak jak jsi ji nechal. Pergamen na stole. Inkoust zatuhlý. Brko suché.<br><br>Jen krb je potřeba rozžehnout znovu.',
                'Vrátil ses po {days} {dayWord}.<br><br>V skriptoriu je ticho a chlad. Svíčka dohořela, louč vyprchala. Ale rukopisy na stole jsou stále tam. Pergamen čeká trpělivěji než lidé.<br><br>Stůl je připraven. Chybí jen teplo.',
                'Tři dny pryč. Možná víc.<br><br>Opat by řekl: <em>"Acedia – lenost ducha – je nepřítel písaře."</em> Ale ty jsi zpět. A to se počítá.<br><br>Rozžehni troud. Začni tam, kde jsi přestal.'
            ],
            dayWord: { one:'den', few:'dny', many:'dní' }
        },
        meta: {
            title:'Scriptorium – Středověká idle hra',
            desc:'Středověká idle hra o životě v klášterním skriptoriu. Kopíruj rukopisy, pěstuj byliny a odemykej tajemství pergamenu a inkoustu.',
            ogLocale:'cs_CZ'

        },
lore: { 
        tabResearch:'Research', 
        tabCodex:'Codex', 
        tabNotebooks:'📓 Zápisníky', 
        tabAchievements:'Achievementy',
        notes:'Zápisky:', 
	notebooks_empty: 'Zatím nemáš žádný zápisník',
        notebooks_hint: 'Odemkni tech "Základy Psaní" (3 research) a vycrafti svou první Tabulu!',
        discovered:'Objeveno:' 
    },
    library: { 
        tabBooks:'📚 Knihy', 
        tabRecords:'🏆 Hry & Záznamy', 
        tabIching:'☯️ Věštění', 
        tabNews:'📜 Zprávy',
	    locked: 'Zamčeno',
        divination_hint: 'Odemkni tech "Starověká Moudrost" pro přístup k věštění.',
        records_hint: 'Odemkni tech "Hry a Záznamy" pro přístup k mini-games a statistikám.',
        scribe_short: '"Za 3x Papír ti odkryji jednu knihu předčasně..."',
        iching_title: '☯️ I-Ching (Kniha Proměn)',
        iching_need_book: 'Potřebuješ Knihu Proměn',
        iching_craft_hint: 'Vyrob si ji v sekci Výroba → Scriptorium.', 
    },

    library_lore: {
        new_book: "📚 Nová kniha v knihovně! ({count})",
        lib_title: "Knihovna",
        lib_unlocked: "odemčeno",
        lib_read: "Přečteno",
        lib_not_avail: "Knihovna není dostupná.",
        lib_unlocks_in: "Odemkne se za",
        lib_days: "dní",
        desc: 'Za 3x Papír ti odkryji jednu knihu předčasně...',
        btn_read: "Číst",
        btn_read_again: "Přečíst znovu",
        categories: {
            history: "Historie Tisku",
            innovation: "Inovace",
            conflict: "Konflikty",
            local: "Praha & Čechy"
        },
        npc_scribe: {
            name: "Mistr Bartoloměj, Starý Písař",
            first_visit_text: "*Starý muž s hlubokými vráskami a prsty navždy zčernalými od duběnkového inkoustu pomalu zvedne zrak od svého pulpitu. Ve vzduchu je cítit těžká, starobylá vůně pergamenu a včelího vosku.*\n\n\"Ah... slyším ty tvé kroky. Další z těch takzvaných 'tiskařů', že? Další z těch, co si ve své pýše myslí, že mechanický lis dokáže nahradit lidskou duši. Pamatuji si časy, chlapče, kdy se knihy psaly rukou... Máš vůbec dost trpělivosti poslouchat starce?\"",
            opt_yes: "Ano, mistře. Vypravuj!",
            opt_no: "Možná později, lisy nepočkají.",
            trade_text: "*Písař se na tebe upřeně zadívá.*\n\n\"Nic na tomto světě není zadarmo. Ani slova, ani čas. Za příběh chci příběh. Dones mi 3 čisté listy toho vašeho slavného tiskařského papíru – a já ti na oplatku ukážu, jak se na ně dá napsat skutečná pravda...\"",
            opt_trade: "Vyměnit (3x Papír)",
            opt_trade_no: "Ne, děkuji, papír je drahý.",
            after_trade: "*Starý písař se třesoucí rukou převezme tvůj papír. Opatrně ho pohladí bříšky prstů...*\n\n\"Je tak... neuvěřitelně hladký. Ale naprosto bez duše. Vezmi si tuto starou, ohmatanou knihu. Strážil jsem ji velmi dlouho a tajně.\"",
            opt_thanks: "Děkuji za tvou neocenitelnou moudrost, mistře.",
            err_paper: "Nemáš dost papíru!",
            notify_book: "📖 Písař ti dal knihu:",
            notify_empty: "Písař: \"Už znáš všechny příběhy...\""
        },
        easter_eggs: {
            faust_name: "Faustova smlouva s temnotami",
            faust_desc: "Zaprodej svůj čas. Nasbírej a drž přesně 666 bodů výzkumu.",
            complete_name: "Absolutní Bibliofil",
            complete_desc: "Přečti každičkou stranu všech dostupných knih ve Velké knihovně.",
            scholar_name: "Mistr pražských uliček",
            scholar_desc: "Rozpleť všechna tajemství přečtením všech knih z kategorie Praha & Čechy.",
            netolicky_name: "Netolického hořká pozůstalost",
            netolicky_desc: "Prastarý, napůl sežehlý dokument, nalezený pod podlahou staré tiskárny.",
            netolicky_lore: "Když rozlomíš starou, ztvrdlou voskovou pečeť, ucítíš zatuchlinu šestnáctého století...\n\n\"Bratře Bartoloměji Netolický! Probůh, vzpamatuj se! Dnešní pochmurný den je tvou naprosto poslední šancí...\"",
            notify_found: "🎉 Easter Egg: {name}! Odemčena tajná kniha!"
        },
        books: {
            book_gutenberg_betrayal: {
                title: "Mohučská zrada: Krvavý úsvit tisku",
                author: "Anonymní kronikář",
                content: "**Půjčka od lichváře a hořký konec**\n\nJohannes Gutenberg byl bezesporu vizionář, který změnil běh dějin, ale byl to muž bez groše. Aby mohl svůj tajný projekt realizovat, půjčil si astronomickou částku 1600 zlatých od mohučského právníka a bohatého obchodníka Johanna Fusta. Jako zástavu použil to jediné, co měl – ručil vším: svou dílnou, inovativními lisy i tou svou slavnou dvaačtyřicetiřádkovou Biblí, kterou právě s nesmírným úsilím tiskl. \n\n**Helmaspergerův notářský zápis (6. listopadu 1455)**\n\nTěsně předtím, než mohla být Bible dokončena a začít vydělávat, Fust tvrdě udeřil. Hnán vidinou zisku obvinil Gutenberga, že peníze „neprojedl v knihách\", ale prý je zpronevěřil na jiné účely. Následný soud byl neúprosný a rozhodl ve prospěch Fusta. Gutenberg přišel ze dne na den o všechno – o své lisy, o pečlivě odlité kovové litery (typy) i o drahocenný papír.\n\n**Kdo byl onen Jidáš tiskařského umění?**\n\nHistorie ukazuje prstem na Petera Schöffera! Byl to Gutenbergův nejtalentovanější tovaryš a původně zručný písař pocházející z Paříže. Právě on u soudu chladnokrevně svědčil proti svému vlastnímu mistrovi! Odměna na sebe nenechala dlouho čekat – Fust si bystrého Schöffera vzal za svého obchodního společníka a aby spojenectví zpečetil, dal mu později za ženu svou vlastní dceru Christinu. Gutenbergova celoživotní práce a dílna tak plynule přešla pod novou, dravou značku Fust & Schöffer. Brzy poté, v roce 1459, tato mocná dvojice vydala slavné dílo *Rationale Divinorum Officiorum*.\n\n**Temná legenda o doktoru Faustovi**\n\nJohann Fust byl jako obchodník neuvěřitelně úspěšný. Chrlil na trh takové množství knih a tiskl tak rychle zcela identické kopie, že si prostý lid začal šeptat temné zvěsti: ten muž musel upsat svou duši samotnému ďáblu. Odtud prý pramení děsivá legenda o Doktoru Faustovi (vzniklá ze zkomoleniny jmen Fust a Faust), kterou o staletí později proslavil německý básník Goethe. Zcela nová technologie tisku byla v očích tehdejšího negramotného lidu zkrátka čistá, černá magie!\n\n*\"Kdo zradí mistra, získá impérium, ale ztratí duši. V inkoustu je vždy přimíchána krev.\" - Starý kronikářský spis*"
            },
            book_jenson_spy: {
                title: "Špion, který se nevrátil: Jensonovo tajemství",
                author: "Královská kronika & Tajné archivy",
                content: "**Tajná mise do srdce Svaté říše římské (1458)**\n\nFrancouzský král Karel VII. zaslechl neuvěřitelné zvěsti o „zázraku v Mohuči\". Zcela fascinován poslal v roce 1458 svého nejlepšího rytce mincí, Nicolase Jensona, na přísně tajnou špionážní misi do Německa. Králův rozkaz zněl jasně: *\"Nauč se toto nové umění, zjisti, jak to dělají, a přines to tajemství domů, pro slávu Francie!\"* \n\n**Zběhnutí mistra rytce**\n\nJenson do Mohuče skutečně dorazil a revoluční technologii tisku si do detailu osvojil. Zjistil však něco zásadního – tisk mu dával svobodu, kterou mu úzkostlivý královský dvůr nikdy nenabídne. Ke svému králi se už nikdy nevrátil! Po letech ticha se v roce 1470 triumfálně vynořil v Benátkách, svobodném obchodním srdci tehdejší Evropy. Zde založil svou vlastní prosperující tiskárnu a vytvořil písmo **Antiqua**. Jenson je dnes široce uznáván jako skutečný otec římského typu písma. \n\n**Zrození moderní typografie**\n\nJednou z prvních knih, kterou v Benátkách v roce 1470 vydal, bylo proslulé Eusebiovo dílo *De evangelica præparatione*. Jensonův návrh byl naprosto revoluční: písmo nebylo jen otrockou kopií starých rukopisných modelů, ale bylo založeno na zcela nových typografických principech. Plynulé tvary a decentní serify pomáhaly oku klouzat po stránce. Bylo to písmo tak nadčasové a dokonalé, že se principielně používá dodnes (dokonce i slavný font Times New Roman z něj myšlenkově přímo vychází).\n\n**Benátský azyl**\n\nV liberálních Benátkách byl Jenson rázem považován za naprostou hvězdu. Král v Paříži sice zuřil a spřádal plány na pomstu, ale nemohl s tím dělat vůbec nic. Hrdé italské městské státy si bedlivě chránily své umělce a špičkové řemeslníky před jakýmkoliv vnějším zásahem. Nicolas Jenson zemřel bohatý, uctívaný a do konce života oslavovaný. Jeho geniální písmo přežilo plných pět století.\n\n*\"Král posílá špeha v okovech povinnosti, ale krása umění ho osvobodí.\" - Benátské přísloví*"
            },
            book_manutius: {
                title: "Smartphony renesance: Aldus Manutius",
                author: "Benátský obchodní registr",
                content: "**Aldus Manutius - Steve Jobs své doby**\n\nTento benátský tiskař a humanista (1449–1515), který v roce 1494 založil proslulou tiskárnu Aldine Press, byl skutečným vizionářem, jenž navždy změnil konzumaci textu. Před ním byly knihy – takzvané inkunábule – obrovské, těžké a neforemné folianty, které musely ležet na masivním stole v knihovně. Manutius však vymyslel revoluční formát velikosti oktáva zvaný **enchiridion** (příručka). Šlo o malé knížky, přímé předchůdce dnešních moderních paperbacků, které se hravě vešly do kapsy u sedla či do záhybů pláště.\n\n**Mobilita vědění a čistota textu**\n\nNajednou mohli šlechtici a kupci číst i na dlouhých cestách! Studenti si mohli koupit Aristotela nebo Homéra za cenu běžné večeře. Knihy přes noc přestaly být kusem nedotknutelného nábytku a staly se z nich dostupní osobní průvodci každodenním životem. Manutius byl navíc posedlý přesností. Chtěl vydávat klasické řecké texty v jejich původní, čisté podobě, nezkreslené staletími špatných překladů. Kvůli tomu spolupracoval s předními učenci tehdejší doby, včetně slavného Erasma Rotterdamského. \n\n**Vynález kurzívy (Italiky)**\n\nAby se do malé a levné knížky vešlo co nejvíce textu a ušetřilo se za drahý papír, najal Manutius geniálního rytce Francesca Griffa. Ten vytvořil zcela nový typ písma, který napodoboval elegantní, ale úsporné nakloněné psaní renesančních úředníků a humanistů – **italiku** (kurzívu). Nebylo to původně určeno pro zvýrazňování textu, jak to děláme dnes, ale čistě pro ekonomickou úsporu papíru! Jejich vydání Vergiliova díla *Opera* z roku 1501 bylo vůbec první knihou na světě tištěnou tímto novým, úsporným písmem.\n\n**Delfín a Kotva**\n\nJeho nezaměnitelným tiskařským znakem byl mrštný delfín (symbolizující rychlost a neustálou inovaci) omotaný kolem pevné kotvy (symbolizující stabilitu, spolehlivost a pečlivost). Jeho celoživotní motto znělo: **Festina Lente** (Spěchej pomalu). Manutius dokázal celému světu, že knihy nemusí být jen zamčené poklady v truhlách, ale aktivní nástroje v rukou lidí.\n\n*\"Malá kniha v ruce je mocnější než obrovská na stole. Svoboda myšlení leží v kapse.\"*"
            },
            book_scribes_war: {
                title: "Válka písařů: Panna a Děvka",
                author: "Filippo de Strata & Johannes Trithemius",
                content: "**\"Pero je panna, tisk je děvka\"**\n\nNe každý vítal vynález knihtisku s otevřenou náručí. Filippo de Strata, benátský mnich a profesionální písař, se stal radikálním hlasem odporu. Někdy v letech 1473 až 1474 sepsal zoufalou a ohnivou polemiku adresovanou tehdejšímu benátskému dóžeti Nicolò Marcellovi, ve které ho zapřísahal, aby z města nechal tiskařské lisy nadobro vyhnat. Ve svém textu mimo jiné nekompromisně hlásal: \n\n*\"Pero je čistá panna, tisk je prodejná děvka! Tiskaři jsou pasáci, kteří zaplavují trh, tisknou milostnou poezii a mladé dívky pak čtou Ovidia jen proto, aby se učily hříchu a neřesti. Tito tiskaři guzzlí víno, opíjejí se v krčmách a za pár drobných prodávají posvátnost textu!\"*\n\nBohaté město podle něj bylo sice přecpané knihami, ale zcela a nenávratně ztratilo svou duši.\n\n**Trithemiův paradox (1492)**\n\nNa druhé straně Evropy se do kulturního boje zapojil významný opat Johannes Trithemius. V roce 1492 sepsal dnes již legendární dílo **De Laude Scriptorum** (Chvála písařů). Ve spise plamenně přesvědčoval své mnichy, aby v žádném případě nepřestávali ručně kopírovat texty, s odůvodněním na nepopiratelnou kvalitu materiálu:\n\n*\"Tištěná kniha je pouze z křehkého papíru. Shoří, podlehne hmyzu nebo se nevyhnutelně rozpadne za 200 let. Naproti tomu naše pečlivá práce na pergamenu přetrvá věky a nese v sobě duchovní hodnotu.\"*\n\nKrutou historickou ironií osudu a naprosto dokonalým paradoxem však zůstává, že právě Trithemius nechal tento svůj útočný spis proti knihtisku v roce 1494 **vytisknout** na lisu, protože si pragmaticky uvědomil, že jinak by se jeho naléhavé myšlenky nikdy nedostaly k masám!\n\n**Konec zlaté éry kaligrafie**\n\nNová technologie byla nezastavitelná jako lavina. Mnozí hrdí písaři nakonec s hořkostí v srdci skončili v těch samých tiskárnách, které z hloubi duše nenáviděli, jako prachobyčejní sazeči nebo korektoři. Museli se ponižujícím způsobem \"přeškolit\". Jejich ušlechtilé řemeslo, které bez přerušení a větších změn trvalo tisíc let, bylo absolutně vyhlazeno za jedinou generaci.\n\nAle jejich nádherné, ručně iluminované rukopisy přežily. Dnes tiše leží v muzeích a trezorech jako vznešené památníky věku, kdy každé jednotlivé slovo vyžadovalo krev, pot a hodiny naprostého soustředění a bylo proto považováno za posvátné.\n\n*\"Rychlost zabíjí krásu detailu, ale pravda přežije v obou formách.\" - Poslední klášterní písař*"
            },
            book_prague_mystery: {
                title: "Záhada pražského tiskaře: Zrození v utajení",
                author: "Pražský archiv & Městské legendy",
                content: "**První vlaštovka nad Vltavou**\n\nZatímco v Plzni tiskařské lisy klapaly již od roku 1468 (nebo snad 1476, učenci a historici se o přesný datový údaj **Kroniky trojánské** dodnes do krve hádají), v samotném srdci království, v Praze, bylo neuvěřitelně dlouho ticho. Zdejší prostředí bylo konzervativní a nebezpečné. Až v roce **1487** se v Praze zničehonic objevuje první tištěná kniha – **Statuta synodalia Arnesti** a nedlouho po ní proslulý **Žaltář**.\n\nAle kdo tuto technologickou revoluci do Prahy přinesl? Nikdo neví! Jméno mistra bylo pečlivě vymazáno z dějin.\n\n**Anonymní mistr a strach z cechu**\n\nV historiografii se mu říká prostě *\"Tiskář Pražské bible\"*, podle jeho pozdějšího monumentálního díla z roku 1488. Proč tajil svou identitu? Praha konce 15. století byla městem cechů. Silný a radikální cech pražských písařů a iluminátorů by jakoukoliv mechanickou konkurenci vnímal jako existenční hrozbu. Zapálit dílnu plnou vysoce hořlavého papíru a lněného oleje pod rouškou noci bylo snadné řešení obchodního sporu. Nebo to snad byl utajený cizinec, kacíř na útěku, který se bál inkvizice, jen Prahou projížděl, splnil zakázku a zmizel zpět do stínů?\n\n**Nádhera utkaná z temnoty**\n\nJeho dílo přitom nenese žádné znaky amatérismu. Jeho Žaltář je mistrovským kouskem – nádherně ostře řezané gotické písmo (bastarda), propracované dřevořezy a precizně tištěná červená iniciála, což tehdy vyžadovalo neuvěřitelně náročný dvojitý průjezd lisem. Pražský tisk tak nezačal pomalým učením, ale okamžitou genialitou zabalenou do tajemství.\n\n*\"V uličkách Starého Města se rodí příběhy, které nikdo nedopíše, protože inkoust občas nahrazuje krev a mlčení je cennější než zlato.\" - Staroměstský kronikář*"
            },
            book_severin_dynasty: {
                title: "Severinská dynastie: Tiskař na radnici",
                author: "Archiv Starého Města pražského",
                content: "**Pavel Severýn z Kapí Hory (1520–1557)**\n\nTohle nebyl jen obyčejný řemeslník se zástěrou ušpiněnou od sazí. Pavel Severýn byl muž, který dokázal dokonale propojit vůni tiskařské černě s vůní politické moci. Začal tisknout kolem roku **1520** na Starém Městě pražském. Rychle pochopil, že tisk není jen o knihách, ale o vlivu. Z tiskaře se stal vážený a neobyčejně bohatý měšťan.\n\n**Purkmistr s lisem v zádech**\n\nJeho vliv rostl tak strmě, že v bouřlivých letech **1534–1537** byl zvolen samotným **purkmistrem (starostou) Starého Města**! Představte si tu moc – muž, který rozhodoval o zákonech a daních v nejbohatším městě království, měl zároveň pod kontrolou stroje, které formovaly veřejné mínění. Právě pod jeho rukama vyšla slavná a nádherně ilustrovaná *Severýnská bible* (1529 a 1537), na které spolupracoval s nejlepšími pražskými dřevorytci. Ukázalo se, že tiskové řemeslo už není jen okrajová kuriozita, ale absolutní politická a společenská síla.\n\n**Záhada roku 1557**\n\nVytvořil obrovský a skvěle fungující rodinný podnik, do kterého zapojil i svého šikovného zetě, Jan Kosořského z Kosoře, jenž po něm dílnu převzal. Éra Severýnů chrlila desítky luxusních českých i latinských děl a pyšnila se těmi nejlepšími kontakty u dvora i mezi kališnickou šlechtou. \n\nAle pak, kolem roku **1557**, se po této mocné dynastii doslova slehla zem. Úplně zmizeli z dobových záznamů. Zabil je mor, který město pravidelně pustošil? Doplatili na tajné dluhy? Nebo snad padli v nemilost tvrdé protireformační cenzury Habsburků? Pravda zůstává pohřbena v archivech.\n\n*\"Kdo ovládá tisk, ovládá myšlení lidu. A kdo ovládá lid, vládne městu. Ale ani ten nejlepší tiskař nevytiskne smlouvu, která by přelstila samotnou smrt.\" - Zápis z městské rady*"
            },
            book_melantrich: {
                title: "Dravec z Prahy: Impérium Jiřího Melantricha",
                author: "Královská komora a Cechovní spisy",
                content: "**Nástup nekompromisního dravce**\n\nJiří Melantrich z Aventina nebyl člověk, který by čekal, až mu štěstí spadne do klína. Byl to ambiciózní, tvrdý a brilantní renesanční kapitalista. Na zkušenou přišel do učení ke starému, tehdy nesmírně bohatému Bartoloměji Netolickému, který se pyšnil výnosným titulem dvorního tiskaře krále Ferdinanda I. a měl lukrativní monopol na tisk zákonů.\n\n**Převzetí moci a budování impéria**\n\nMelantrich byl bystrý a okouzlující stratég. Nejdříve se nenápadně vypracoval z učně na Netolického **společníka**. Jakmile získal know-how a kontakty, v roce **1552** od stárnoucího mistra celou tiskárnu chladnokrevně **koupil** (historici se dodnes přou, nakolik šlo o férový obchod a nakolik o agresivní, nepřátelské převzetí takzvaně \"pod cenou\"). Okamžitě dílnu přesunul z odlehlé Malé Strany přímo do tepajícího obchodního srdce na Staré Město a začal z ní budovat nezastavitelné **impérium**.\n\n**Melantrichova Bible: Stroj na peníze**\n\nJeho mistrovským strategickým a komerčním kusem se stala slavná *Melantrichova Bible* (vydána postupně pětkrát!). Byla jazykově i vizuálně tak dokonalá, že ji kupovali katolíci i protestanti. Melantrich byl mistr obojakosti – prodával všem stranám náboženského konfliktu a vydělal na tom naprosté jmění. Z obrovských zisků si koupil majestátní měšťanský palác **U Dvou velbloudů** (v místech dnešní Melantrichovy ulice, která dodnes nese jeho jméno).\n\n**Z ušmudlaného učně šlechticem**\n\nAby svou dominanci a společenský vzestup definitivně stvrdil, nechal si za své politické a tiskařské služby udělit prestižní šlechtický erb a majestátní přídomek **\"z Aventina\"** (podle římského pahorku). To už nebyl řemeslník, to byl renesanční magnát. Když zemřel, jeho veleúspěšnou firmu plynule převzal jeho neméně schopný zeť Daniel Adam z Veleslavína, čímž vznikla dynastie, která kulturně ovládala české země po dlouhá desetiletí.\n\n*\"V obchodu, stejně jako v tisku, není nikdy místo pro slabé a nerozhodné. Pouze dravci přežijí a napíší pravidla, podle kterých budou hrát ti ostatní.\" - Připisováno Jiřímu Melantrichovi*"
            },
            book_rudolf_alchemists: {
                title: "Město bláznů a géniů: Rudolf II. a 300 alchymistů",
                author: "Tajná dvorská kronika",
                content: "**Praha jako okultní pupek světa**\n\nPíše se rok 1583 a císař Svaté říše římské, excentrický a melancholický Rudolf II., dělá šokující rozhodnutí. Přesouvá celý císařský dvůr z Vídně do Prahy. Město se přes noc mění. Rudolf, posedlý hermetismem, hvězdami a okultismem, shromáždil na svém dvoře neuvěřitelných **300 alchymistů, mágů a šarlatánů** z celé Evropy. Byli mezi nimi i legendární Angličané – učenec John Dee, který rozmlouval s anděly, a jeho podivný společník Edward Kelley, mistr iluzí.\n\n**Tajemství Zlaté uličky**\n\nLegenda praví, že malé, stísněné domky přilepené k hradbám těsně pod Pražským hradem (Zlatá ulička) sloužily jako tajné laboratoře těchto mistrů. Nad ohništěmi dnem i nocí bublaly křivule a tyglíky. Všichni hledali *Lapis Philosophorum* – legendární kámen mudrců, elixír věčného mládí a substanci, která by dokázala proměňovat obyčejné kovy v ryzí zlato. \n\nZlato pro císaře nikdy nenašli... Ale při svých fanatických pokusech mimoděk položili základy moderní vědy. Zcela náhodou objevili:\n- Výrobu kyseliny sírové (vitriol).\n- Elementární fosfor, zářící ve tmě.\n- Izolaci zinku a dalších sloučenin.\n\n**Smrt mezi hvězdami**\n\nV této esoterické atmosféře žil a bádal v Praze i slavný dánský astronom Tycho Brahe. Jeho přesná měření hvězd bez dalekohledu dodnes udivují. Zemřel tu roku 1601 – podle dobových klepů prý při hostině, kdy z dvorské etikety nemohl vstát od stolu a praskl mu močový měchýř. Moderní analýza jeho vousů však odhalila děsivější pravdu: **otravu rtutí**, pravděpodobně z jeho vlastních alchymistických elixírů, které užíval na nemocné ledviny.\n\nV Rudolfově Praze se stírala hranice mezi magií a rodící se moderní vědou. Byla to doba šílená, nebezpečná, ale neuvěřitelně plodná.\n\n*\"V mlze nad Vltavou je hranice mezi snem a skutečností tenká jako pergamen. Hledali jsme zlato, ale našli jsme samotné složení hvězd.\" - John Dee ve svých denících*"
            },
            book_czech_glass: {
                title: "Křehká válka: České sklářství vs. Benátky",
                author: "Tajný mistr Sklářského cechu",
                content: "**Tajemství lesního křišťálu**\n\nMálokdo tuší, že zatímco Evropa krvácela ve válkách o území, probíhala paralelně ještě jedna, mnohem tišší, ale o to lukrativnější válka – válka o světlo. České lesní sklářství zažívalo boom už od **13. století** a patřilo k tomu absolutně nejlepšímu v celé Evropě. Hutě skryté hluboko v pohraničních hvozdech (Šumava, Jizerské hory) měly nevyčerpatelný zdroj dřeva pro pece a kvalitní potaš z popela, což dávalo českému sklu typickou čistotu a tvrdost. \n\n**Krvavé diamanty českých králů**\n\nČeské sklo a drahokamy byly strategickým bohatstvím. Například temně rudý český granát (pyrop) z Podsedicka byl u dvorů tak extrémně ceněný a vyhledávaný, že císař Rudolf II. zcela zakázal jeho vývoz ze země **pod přísným trestem smrti**. Později, v 18. století, se Jablonecký broušený křišťál a bižuterie staly takovou komoditou, že v některých částech světa (např. v afrických koloniích) se těmito skleněnými perlami **platilo místo peněz**! Byl to exportní artikl číslo jedna, který živil celé generace horalů.\n\n**Benátská žárlivost a průmyslová špionáž**\n\nHlavním rivalem nám byly hrdé Benátky. Benátčané měli po dlouhá staletí absolutní **monopol** na výrobu luxusních zrcadel a jemného skla. Byli na něj tak hákliví, že všechny své sklářské mistry pod hrozbou drakonických trestů internovali na izolovaném ostrově **Murano**. Šlo o nucenou zlatou klec – a de facto první organizovanou technologickou karanténu na světě. Kdo by se opovážil z ostrova s tajemstvím uprchnout, na toho úřady vyslaly nájemné vrahy. Byl automaticky prohlášen za zrádce republiky.\n\nNavzdory zabijákům se však Čechům díky špionům, kupcům a uprchlíkům podařilo benátské receptury získat. Vylepšili jsme je přidáním křídy a vytvořili takzvaný *český křišťál* – sklo, které bylo masivnější, dalo se nádherně brousit do hloubky a rýt, což tenké benátské sklo nevydrželo. Skončil monopol, začala česká dominance. Sklářství zkrátka nebylo jen řemeslo, byl to tehdejší přísně střežený high-tech průmysl, kombinující okultní alchymii s optikou.\n\n*\"Naše sklo je zmrzlé světlo, vytesané z potu lesních dělníků a slz benátských kupců.\" - Mistr huťmistr ze severu*"
            },
            book_hussite_wars: {
                title: "Popel paměti: Husitské války a konec knihoven",
                author: "Laurentius de Březová (Vavřinec z Březové)",
                content: "**Apokalypsa kultury a krve**\n\nHusitské války (1419–1434) nebyly jen lokální selskou rebelií. Byly to brutální, vůbec první skutečně velké náboženské války na území Evropy, které otřásly samotnými základy západního světa. Daň za tento konflikt byla strašlivá – odhaduje se, že české země během těchto let ztratily hladem, nemocemi a mečem až **třetinu veškerého obyvatelstva**.\n\n**Oheň, který pohltil staletí**\n\nZatímco reformní myšlenky kalicha šířily novou interpretaci víry, vojska radikálních husitů (táborité a sirotci) zanechávala za svými pochody zkázu. Kláštery pro ně byly symbolem církevní zkorumpovanosti a bohatství. S jejich pleněním a vypalováním však plameny pohlcovaly to nejcennější – klášterní knihovny, obří trezory středověké vzdělanosti.\nBěhem několika let nenávratně shořely statisíce stran:\n- Ve Vyšším Brodě vzplály knihovny čítající tisíce vzácných děl (některé prameny s nadsázkou mluví až o 70 000 svazcích).\n- Ve Zlaté Koruně byly v plamenech ztraceny tisíce ručně psaných a iluminovaných rukopisů z celé Evropy.\n- V pražských Emauzích lehly popelem unikátní staroslověnské texty a chorály.\n\n**Cena za háčky a čárky**\n\nZtráta kulturní paměti byla absolutní. To, co tehdy shořelo – neznámé antické texty, staré české kroniky, prastaré lékařské spisy – už nikdy znovu neobjevíme. Jsou to prázdná místa naší historie.\n\nNa počátku tohoto ohnivého pekla stál mistr Jan Hus (1372–1415), charismatický kazatel upálený v Kostnici pro kacířství. Husovo učení sice nepřežilo ve své čisté podobě, ale přežilo v myšlenkách o 200 let déle až do příchodu Martina Luthera. Paradoxně, Husův nejtrvalejší odkaz není jen náboženský, ale jazykový. Spisem *De orthographia bohemica* (1406) zjednodušil složitý pravopis spřežek a geniálně reformoval češtinu zavedením **háčků a čárek** (nabodeníček). Kdyby nebylo jeho lingvistického vizionářství, psali bychom dnes jména a slova neohrabaně jako Poláci, vršící hlásky za sebe.\n\nNásledně vzniklé jihočeské vojenské město **Tábor** (založeno 1420) se stalo dějištěm prvotního sociálního experimentu – fungovalo jako raná, radikální \"demokratická\" obec, kde si rovní bratři a sestry volili své hejtmany i faráře a kde (alespoň zpočátku) neplatily peníze, ale společné kádě.\n\nReformace přinesla zemi nevídanou svobodu myšlení a postavila se mocné Evropě, ale zaplatili jsme za ni krví celých generací a ohněm, který spálil naši minulost.\n\n*\"Pravda Boží vítězí nad vším, ale na konci bitvy zůstává jen horký popel a pláč vdov.\" - Heslo na korouhvi poražených*"
            },
            book_de_arte_predicandi: {
                title: "De arte predicandi: Prokletý prvotisk z Mohuče",
                author: "Aurelius Augustinus (tisk: Fust & Schöffer)",
                content: "**Nejstarší knižní drahokam ve fondu VKOL**\n\nPředstavte si knihu, která pamatuje samotný úsvit tištěného slova. Toto je vzácný tisk z dílny **Johanna Fusta a Petera Schöffera** – ano, přesně těch dvou bezskrupulózních obchodníků, kteří v soudním procesu roku 1455 okradli bezmocného Gutenberga o jeho životní vynález, tiskařskou dílnu i rozpracovanou Bibli.\n\n**Temná ironie dějin a svatý text**\n\nDějiny mají zvrácený smysl pro humor. Fust a Schöffer, s krví zrady na rukou, posléze paradoxně vytiskli některé z vizuálně nejkrásnějších a nejdokonalejších knih celého 15. století. Tento konkrétní svazek obsahuje slavné dílo \"De arte predicandi\" (O umění kázat) od církevního otce svatého Augustina. Fungovala jako manuál a praktická příručka pro duchovní, jak správně rétoricky působit a učit prostý lid. Samotný tisk byl prokazatelně dokončen **před rokem 1467**, což z něj bez debat činí jeden z vůbec nejstarších dochovaných tisků na světě (takzvaných inkunábulí).\n\n**Záchrana před švédským rabováním**\n\nTo, že se právě v moravské Olomouci nachází takový poklad od Gutenbergových nástupců, není žádná náhoda. Do města jej přivezli mocní a vzdělaní jezuité. Ti sbírali staré knihy z celé Evropy jako důkaz toho, že masově tištěné slovo dokáže šířit katolickou víru nekonečně rychleji než armáda písařů s perem.\n\nKniha měla neuvěřitelné štěstí. Píše se rok 1642 a v rámci třicetileté války olomoucké hradby prolomila a město obsadila švédská vojska generála Torstensona. Švédové rabovali systematicky a po stovkách odváželi cennosti – na severních vozech tehdy do Stockholmu jako válečná kořist zmizelo neuvěřitelných 100 vozů plných těch nejvzácnějších knih z olomouckých klášterů a univerzitních fondů. Ale tato jediná, nenápadná kniha zázračně přežila. Jak? Jezuité ji spolu s několika dalšími cennostmi narychlo zazdili hluboko v temných kryptách a schovali do střešních trámů, než vojáci vylomili brány.\n\n*\"Tato první kniha sice ve svém zrodu nese hořkou pečeť zrady na tvůrci, ale dokonalá krása její sazby přežívá války i švédské meče.\"*\n\n---\n\n**HERNÍ EFEKT:** Čtení této knihy odemkne vzácný skill **\"Fustův paradox\"**. Mistrovství, které se zrodilo ze zrady: jednou za herní seanci můžeš obětovat 10 bodů výzkumu (research) a okamžitě, bez potřeby jakýchkoliv dalších materiálů, \"vycraftit\" jakýkoliv předmět, dokonce i ty, které jsou jinak pro tvou úroveň zamčené (locked)."
            },
            book_kutnohorska_bible: {
                title: "Kutnohorská Bible: Detektivka z archivu",
                author: "Martin z Tišnova (Tiskař Pražské bible)",
                content: "**Velký omyl knihovních pultů**\n\nNěkdy se to největší dobrodružství neodehrává na bojišti, ale v tichu studovny. Píše se rok 2005 a jeden z pečlivých badatelů ve Vědecké knihovně v Olomouci zkoumá starý, těžký svazek, který byl v inventáři celá desetiletí bezpečně evidován a katalogizován jako poměrně běžná *\"Benátská bible z roku 1506\"*. Při bližším pohledu však badatel zažil šok. Zjistil, že se dívá na extrémně vzácnou, českou **Kutnohorskou bibli vytištěnou bohatým kramářem a sponzorem knihtisku Martinem z Tišnova už v roce 1489!**\n\n**Jak k takovému omylu vůbec došlo?**\n\nByl to mistrovský podvod pramenící z nouze o celistvost. Někdy v hluboké minulosti (patrně v 16. nebo 17. století) se kniha poškodila a nenávratně ztratila své první a poslední složky (papíry obsahující začátek Genesis a tiráž s údaji o tisku). Jakýsi horlivý předchozí majitel nebo sběratel se rozhodl, že knihu \"opraví\" a chybějící stránky znovu rukopisně dopíše. Udělal však jednu obrovskou, byť logickou chybu – jako textovou předlohu pro přepis použil JINÉ, novější vydání Bible, které měl zrovna po ruce na stole! A to byl onen benátský tisk z roku 1506. \n\nPísař, který stránky krasopisně doplňoval, tak do starobylé české olomoucké knihy fyzicky vepsal překlad textu a letopočty z benátské edice. Celá staletí si pak knihovníci četli tento doplněný úvod a věřili falšované titulce, aniž by zkoumali tištěné tělo uvnitř. Pravdu nekompromisně odhalila až moderní forenzní typografie – porovnání jedinečných tvarů původních tištěných kovových liter uvnitř knihy s fonty používanými v Kutné Hoře na konci 15. století. \n\nTento tisk tak rázem \"zestárl\" a stal se o **17 let starším**, než se původně předpokládalo. Tím se automaticky zařadil mezi vůbec nejstarší kompletní české knižní tisky. A celou tu neuvěřitelně dlouhou dobu ležel zaprášený, chybně popsaný a podceňovaný v běžných regálech knihovny.\n\n**Záhada čekající na poličkách**\n\nTato událost mezi archiváři vyvolala mrazení: Kolik dalších domněle \"běžných benátských nebo německých\" tisků, roztroušených v depozitářích po celé Evropě, je ve skutečnosti vzácnými českými prvotisky? Kolik historické pravdy je bezpečně ukryto pod vrstvami omylů, špatných katalogizačních lístků a omyvatelných etiket?\n\nV každé velké historické knihovně tiše dýchají tisíce svazků a trpělivě čekají na své pravé odhalení. Stačí se podívat zblízka a pozorně. Stačí mít znalosti, pečlivě porovnat litery z olova a bezmezně nevěřit přilepeným etiketám na hřbetech.\n\n*\"Pravda umí čekat trpělivě. Někdy se schovává celé staletí pod špatným kabátem.\"*\n\n---\n\n**HERNÍ EFEKT:** Získáš pasivní schopnost eventu **\"Skrytý prvotisk\"**. Kdykoliv budeš vyrábět luxusní kodexy (luxury_codex), máš trvalou **5% šanci na kritický úspěch**, při kterém badatelé odhalí, že i tvůj běžný kodex (common_codex) vyrobený v minulosti byl vlastně chybně zařazený luxusní originál! Okamžitě získáváš dvojnásobnou hodnotu předmětu v mincích a obrovský bonus do výzkumu (research)."
            },
            book_olomouc_misal: {
                title: "Olomoucký Misál: Válka pergamenu a papíru",
                author: "Johann Sensenschmidt",
                content: "**Oslnivá zakázka pro celou diecézi**\n\nByl to obří logistický a umělecký počin. Významný bamberský tiskař Johann Sensenschmidt dostal od církevních hodnostářů extrémně prestižní zakázku na vytvoření nového oficiálního Olomouckého misálu (liturgické knihy obsahující texty ke mši). Tento monumentální tiskařský úkol dokončil v roce 1488 v ohromujícím celkovém nákladu **420 naprosto identických exemplářů**.\n\n**Dva světy, dva materiály**\n\nCírkev však byla praktická i marnivá zároveň. Proto byl náklad přísně rozdělen podle bohatství farností:\n- **400 exemplářů bylo vytištěno na papíru** (šlo o levnější, pragmatickou a lehčí variantu určenou pro běžné, chudší vesnické kostely a každodenní opotřebení kněžími).\n- **Pouhých 20 exemplářů bylo vytištěno na luxusním pergamenu** (to byla ohromně drahá, těžká a honosná varianta, určená výhradně pro oltáře nejbohatších klášterů a ruky samotných biskupů).\n\n**Unikát olomouckých trezorů**\n\nZde nastupuje kouzlo Vědecké knihovny v Olomouci (VKOL). V jejich střežených klimatizovaných trezorech se dnes bezpečně ukrývá:\n- 1 vzácně dochovaný exemplář tištěný na papíru.\n- A 1 absolutně nedozírně cenný z oněch původních 20 pergamenových exemplářů!\n\nZ pohledu statistiky? Šance, že jedna jediná instituce po 500 letech válek a požárů bude ve sbírce vlastnit obě materiálové verze jednoho vydání, je naprosto **astronomická**. Ale opět za to vděčíme olomouckým jezuitům, kteří v průběhu staletí sbírali tyto artefakty vysoce systematicky, nikoliv nahodile. Chtěli totiž studentům názorně ukázat celou evoluční a materiálovou škálu středověkého tiskařského umění hezky na jednom stole.\n\n**Pergamen vs. Papír: Souboj o věčnost**\n\n- **Pergamen** (vyčištěná zvířecí kůže, většinou z telat nebo ovcí) byl garantem trvanlivosti, fyzické krásy, ale byl děsivě drahý a neetický. Výroba jedné takto velké knihy znamenala vyvraždění celého stáda (často byla potřeba kůže až ze 3 ovcí jen na samotný obal a vazbu jedné knihy, nemluvě o desítkách zvířat na vnitřní strany!).\n- **Papír** z drcených lněných hadrů byl neuvěřitelně levný, rychle schnul, bral krásně inkoust, ale byl zranitelný vodou, plísní a ohněm.\n\nOpat Trithemius, zarputilý obhájce starých písařů, kdysi v pamfletu varoval: *\"Krásný pergamen bezpečně vydrží věky a soudný den, zatímco váš moderní levný papír za 200 let shoří nebo se rozpadne na prach!\"* A technologicky měl samozřejmě naprostou pravdu. \n\nAle z hlediska dějin se zásadně mýlil v matematice: papírových knih se kvůli jejich nízké ceně vzniklo a nakoupilo 1000x více než pergamenových, takže z čistě statistického hlediska jich do dnešních dnů v absolutních číslech přežilo mnohem více a navždy změnily celospolečenskou úroveň vzdělanosti.\n\n**Tiskařské ponaučení**\n\nHmatatelná vzácnost a výrobní náklady nejsou vždy to samé jako historická hodnota pro lidstvo. Tisk na pergamenu reprezentoval luxus, ukázku moci a statusu biskupa. Ale byl to ten obyčejný, křehký a ušmudlaný papírový tisk kolující mezi chudými, který nakonec zažehl reformaci a změnil celý svět. Rychlost a dostupnost zde zvítězila nad absolutní řemeslnou krásou zvířecí kůže. \n\nZásadní dilema: Extrémní dosah textu vs. neomezená trvanlivost média? Toto základní tiskařské dilema řešíme s digitálním obsahem vlastně úplně stejně i dnes, o šest století později.\n\n*\"Na stole před námi leží dvě naprosto identické knihy s jedním textem i sázkou liter. Jaký je tedy ten propastný rozdíl mezi nimi? Jen cena zaplaceného času a krve.\"*\n\n---\n\n**HERNÍ EFEKT:** Získáš prastarou vědomost mistrů – navždy si odemkneš vrcholný výrobní řetězec na pergamenové svazky (vellum crafting chain): **surová kůže (hide) → zpracovaný pergamen (vellum) → luxusní pergamenový kodex (vellum_codex)**. Budeš muset pečlivě balancovat svou ekonomiku. Tyto exkluzivní Vellum kodexy sice mají na trzích neuvěřitelnou, **5x větší prodejní hodnotu** než obyčejné papírové knihy, ale jejich výroba tě bude stát **10x více základního materiálu a času**, čímž riskneš prázdné sklady!"
            },
            book_faust_secret: {
                title: "Faustova smlouva: Mýtus obalený olovem",
                author: "Neznámý heretik a alchymista",
                content: "**Kdo byl skutečný doktor Faust?**\n\nHistorická legenda s hrůzou vypráví, že učenec a astrolog Johann Georg Faust (1480–1540), reálná postava putující renesančním Německem, upsal svou nesmrtelnou duši mocnému démonu Mefistofelovi. Výměnou za to získal 24 let absolutního pozemského vědění, bohatství a nadpřirozené moci, než si ho čerti odnesli do pekel.\n\n**Ale pravda je mnohem pragmatičtější a temnější...**\n\nUvědomte si časovou shodu! Johann **Fust**, onen bohatý finančník a tiskař, který okradl Gutenberga, vydával své tištěné svazky v nevídaných objemech. Knihy se objevovaly na trzích tak bleskově a ve stovkách na chlup identických, bezchybných kopií, že pověrčiví a negramotní lidé jednoduše odmítali uvěřit, že to dokázaly vytvořit lidské ruce. Jak by mohl obyčejný smrtelník opsat obří Bibli dvěstěkrát bez jediné chyby?\n\n**Smyčka jmen (Fust ~ Faust)**\n\nJména těchto dvou naprosto odlišných mužů – tiskaře Fusta a okultisty Fausta – zněla na ulicích natolik podobně, že v ústním podání brzy splynula v jedno. Z reálných událostí vzniku knihtisku a šarlatánských kousků astrologa se zrodil ultimátní mýtus.\n\n**Goethe a strojní démonie**\n\nO více než 200 let později velký německý dramatik Johann Wolfgang von Goethe napsal své životní, obří dílo **Faust** (1808). Brilantně v něm použil tuto starou legendu jako metaforu. Faustův pakt s ďáblem byl ztělesněním lidské neukojitelné touhy po božském poznání, vědeckém pokroku za každou cenu, ale i nebezpečí nově vznikající strojové a průmyslové doby, která hrozila požírat lidské duše. Tiskařský lis byl v tomto pojetí prvním \"pekelným strojem\".\n\n**Existovala vůbec smlouva s ďáblem?**\n\nNe, pokud nevěříte na rohaté bytosti se sirným zápachem. Ale obchodník Johann Fust přesto jednu smlouvu sepsal – velmi reálnou, notářsky ověřenou smlouvu s Johannesem Gutenbergem. A v honbě za penězi ho bez milosti zradil a sociálně zničil. Mnozí badatelé tvrdí, že zničit život geniálního mistra a ukrást jeho celoživotní dílo pro vlastní zisk je možná mnohem hroznější a reálnější hřích, než sepsat imaginární pakt s démonem vlastní krví.\n\n*\"Někdy je samotná skutečnost, psaná černou tiskařskou černí a účetními knihami, mnohem temnější a chladnější než prastará legenda.\"*\n\n---\n\n**Easter Egg:** Tato prastará kniha plná kacířských myšlenek se v knihovně odemkne pouze těm otrlým jedincům, kteří shromáždili a podrželi přesně 666 bodů zakázaného výzkumu. \nGratulujeme, právě jsi pohlédl do temné propasti historie a objevil jedno z největších tajemství hry! Nyní jsi skutečným mistrem Scriptorium."
            }
        }
    },
    time: { 
        night: 'NOC', morning: 'RÁNO', forenoon: 'DOPOLEDNE', noon: 'POLEDNE', afternoon: 'ODPOLEDNE', evening: 'VEČER',
        phase_dawn: 'Svítání', phase_morning: 'Ráno', phase_forenoon: 'Dopoledne', phase_noon: 'Poledne', phase_afternoon: 'Odpoledne', phase_evening: 'Večer', phase_night: 'Noc', phase_midnight: 'Půlnoc', phase_deepnight: 'Hluboká noc' 
    },
    hunger: {
        full: 'Plně sytý ({h}h {m}m)',
        light: 'Lehký hlad ({h}h {m}m)',
        medium: 'Střední hlad ({h}h {m}m)',
        heavy: 'Velký hlad! ({h}h {m}m)',
        starving: 'HLADOVÝ!',
        notified: 'Tvé břicho kručí. Jsi hladový!'
    },

tidings: {
        empty: "Zatím žádné zprávy. Pokračuj v práci.",
        subtitle: "Dopisy a zprávy, které přišly do skriptoria...",
        from: "Od:",
        senders: {
            scribe: "Starý Písař",
            unknown: "Neznámý",
            monastery: "Z kláštera"
        },
        news_0: "Víš, že v klášteře za kopcem opisují celé noci? Prý mají pergamen z vlastních ovcí.",
        news_3: "Byl jsem v refektáři. Četli tam rukopis, který nikdo z nás nikdy neviděl. Říkali mu Regula.",
        news_7: "Hledají zkušeného písaře do kláštera sv. Prokopa. Práce pro Boha, ne pro trh. Přemýšlím.",
        news_10: "Slyšel jsi ranní zvony? Oni píší od Matutina. My píšeme jen za denního světla. Možná nám něco uniká.",
        news_15: "Zákazník přinesl stránku z Mohuče. Říká tomu Druk. Rychlé. Bez duše. Ale levné.",
        news_20: "Přišel za mnou bratr z kláštera. Nabídl výměnu — naše papíry za jejich pergamen. Dobrý obchod?",
        news_25: "Opat hledá písaře, který zná galický inkoust. Prý pro zvláštní zakázku. Biskupa.",
        news_28: "Rozhodl ses, kdo jsi? Řemeslník — nebo služebník? Obě cesty jsou čestné. Ale nejsou stejné."
    },
garden: {
        desc: 'Pěstuj vzácné rostliny. Půda vyžaduje péči.',
        fertilize: 'Zúrodnit',
        locked: 'Zamčeno',
        lockedTech: 'Tech Tree',
        herb: 'Byliny',
        vegetable: 'Zelenina',
        special: 'Speciál',
        any: 'Jakékoliv',
        sow: 'Zasít',
        water: 'Zalít',
        dry: 'Suché',
        growing: 'Roste...',
        grown: 'Vzrostlé',
        harvest: 'Sklidit',
        wait: 'Čekat'
    },
    daily: {
    streak: 'Streak',
    streakTitle: 'Denní streak:',
    loyaltyBonus: '🎉 Bonus za věrnost!',
    factTitle: 'Dnešní fakt'
    },
    achievements: {
        unlocked: 'Achievementy odemčeny',
        hidden: 'Neobjeveno',
        reward: 'Odměna:'
    },
    records: {
        locked: 'Zamčeno',
        lockHint: 'Odemkni tech "Hry a Záznamy" pro přístup k mini-games a statistikám.',
        miniGames: '🎮 Mini-Games',
        stats: '📊 Osobní Statistiky',
        harvests: '🌿 Sklizně',
        gamesWon: '🎮 Hry vyhráno',
        meals: '🍖 Jídel',
        candles: '🕯️ Svíčky',
        wellUses: '💧 Studna',
        streakDays: 'dní',
        streakMax: 'max',
        backup: '💾 Záloha Save',
        backupDesc: 'Exportuj save jako zálohu nebo přenes na jiné zařízení.',
        backupWarning: '💡 Před velkými experimenty doporučujeme stáhnout zálohu!',
        backupReset: 'Pro reset hry jdi do Nastavení.',
        downloadSave: '📥 Stáhnout Save',
        uploadSave: '📤 Nahrát Save'
    },
    fontSpec: {
        unlocked: 'Odemčeno',
        title: '✒️ Písmo té doby',
        close: 'Zavřít'
    },
    ui: {
        close: 'Zavřít'
    },
};