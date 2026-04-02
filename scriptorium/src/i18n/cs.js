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
            btnTorch:'ZAPÁLIT LOUČ', btnCandle:'ZAPÁLIT SVÍČKU'
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
        game: {
            eat:'Sníst', required:'(Nutné)',
            techDone:'HOTOVO',
            techStudy:'Studovat',
            techRequired:'Nutné:',
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
            saveImportFail:'❌ Neplatný save file!'
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
        }
};
