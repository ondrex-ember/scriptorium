const EasterEggsDB = {
    achievements: [
        {
            id: 'faust_pact',
            name: 'Faustova smlouva s temnotami',
            desc: 'Zaprodej svůj čas. Nasbírej a drž přesně 666 bodů výzkumu (research).',
            icon: '😈',
            condition: () => (GameState.inventory.research || 0) >= 666,
            reward: { book: 'book_faust_secret' },
            secret: true
        },
        {
            id: 'complete_library',
            name: 'Absolutní Bibliofil',
            desc: 'Přečti každičkou stranu všech dostupných knih ve Velké knihovně.',
            icon: '📚',
            condition: () => GameState.library && GameState.library.readBooks.length === LibraryDB.books.length,
            reward: { research: 10 },
            secret: false
        },
        {
            id: 'scholar_praha',
            name: 'Mistr pražských uliček',
            desc: 'Rozpleť všechna tajemství přečtením všech knih z kategorie Praha & Čechy.',
            icon: '🏰',
            condition: () => {
                if (!GameState.library) return false;
                const pragueBooks = LibraryDB.books.filter(b => b.category === 'local').map(b => b.id);
                return pragueBooks.every(id => GameState.library.readBooks.includes(id));
            },
            reward: { research: 5 },
            secret: false
        }
    ],
    
    specialItems: {
        'netolicky_legacy': {
            name: 'Netolického hořká pozůstalost',
            icon: '📜',
            type: 'lore',
            desc: 'Prastarý, napůl sežehlý dokument, nalezený pod podlahou staré tiskárny.',
            rarity: 0.001, // 0.1% chance drop z nature akcí
            lore: `Když rozlomíš starou, ztvrdlou voskovou pečeť, ucítíš zatuchlinu šestnáctého století. Písmo je roztřesené, psané v obrovském spěchu a stresu.

*"Bratře Bartoloměji Netolický! Probůh, vzpamatuj se! Dnešní pochmurný den je tvou naprosto poslední šancí, kdy ještě můžeš legálně zastavit toho chladnokrevného plaza Melantricha. Pokud dnes nepodepíšeš ten ochranný glejt s městskou radou, ten mladík ti zítra vyrve z rukou celou dílnu i s tvým jménem! Zítra už bude pozdě a ty umřeš s prázdnou kapsou."*

Podpis dole je nečitelný, zřejmě rozmazaný slzou nebo dešťovou kapkou. Letopočet: Mrazivý podzim 1551.

Starý a kdysi pyšný Netolický nedbal. Bral Melantricha jen jako schopného poskoka. O rok později (1552) přišel naprosto o vše, přesně jak list varoval. Melantrich převzal tiskárnu a stal se králem trhu. A tento varovný dopis? Zůstal ignorován pod prkny podlahy na půl tisíciletí.`
        }
    }
};

// Secret kniha odemčená přes Faustovu smlouvu
LibraryDB.books.push({
    id: 'book_faust_secret',
    title: 'Faustova smlouva: Mýtus obalený olovem',
    category: 'history',
    unlockDay: 0, // Neodemkne se časem, pouze skrytým eventem!
    icon: '😈',
    author: 'Neznámý heretik a alchymista',
    year: 'L.P. 1580',
    content: `**Kdo byl skutečný doktor Faust?**

Historická legenda s hrůzou vypráví, že učenec a astrolog Johann Georg Faust (1480–1540), reálná postava putující renesančním Německem, upsal svou nesmrtelnou duši mocnému démonu Mefistofelovi. Výměnou za to získal 24 let absolutního pozemského vědění, bohatství a nadpřirozené moci, než si ho čerti odnesli do pekel.

**Ale pravda je mnohem pragmatičtější a temnější...**

Uvědomte si časovou shodu! Johann **Fust**, onen bohatý finančník a tiskař, který okradl Gutenberga, vydával své tištěné svazky v nevídaných objemech. Knihy se objevovaly na trzích tak bleskově a ve stovkách na chlup identických, bezchybných kopií, že pověrčiví a negramotní lidé jednoduše odmítali uvěřit, že to dokázaly vytvořit lidské ruce. Jak by mohl obyčejný smrtelník opsat obří Bibli dvěstěkrát bez jediné chyby?

**Smyčka jmen (Fust ~ Faust)**

Jména těchto dvou naprosto odlišných mužů – tiskaře Fusta a okultisty Fausta – zněla na ulicích natolik podobně, že v ústním podání brzy splynula v jedno. Z reálných událostí vzniku knihtisku a šarlatánských kousků astrologa se zrodil ultimátní mýtus.

**Goethe a strojní démonie**

O více než 200 let později velký německý dramatik Johann Wolfgang von Goethe napsal své životní, obří dílo **Faust** (1808). Brilantně v něm použil tuto starou legendu jako metaforu. Faustův pakt s ďáblem byl ztělesněním lidské neukojitelné touhy po božském poznání, vědeckém pokroku za každou cenu, ale i nebezpečí nově vznikající strojové a průmyslové doby, která hrozila požírat lidské duše. Tiskařský lis byl v tomto pojetí prvním "pekelným strojem".

**Existovala vůbec smlouva s ďáblem?**

Ne, pokud nevěříte na rohaté bytosti se sirným zápachem. Ale obchodník Johann Fust přesto jednu smlouvu sepsal – velmi reálnou, notářsky ověřenou smlouvu s Johannesem Gutenbergem. A v honbě za penězi ho bez milosti zradil a sociálně zničil. Mnozí badatelé tvrdí, že zničit život geniálního mistra a ukrást jeho celoživotní dílo pro vlastní zisk je možná mnohem hroznější a reálnější hřích, než sepsat imaginární pakt s démonem vlastní krví.

*"Někdy je samotná skutečnost, psaná černou tiskařskou černí a účetními knihami, mnohem temnější a chladnější než prastará legenda."*

---

**Easter Egg:** Tato prastará kniha plná kacířských myšlenek se v knihovně odemkne pouze těm otrlým jedincům, kteří shromáždili a podrželi přesně 666 bodů zakázaného výzkumu. 
Gratulujeme, právě jsi pohlédl do temné propasti historie a objevil jedno z největších tajemství hry! Nyní jsi skutečným mistrem Scriptorium.`
});

// ================================================
// 4. NPC PÍSAŘ - Interaktivní postava v Scriptorium
// ================================================

const ScribeNPC = {
    name: 'Mistr Bartoloměj, Starý Písař',
    icon: '🖋️',
    
    dialogues: {
        first_visit: {
            text: `*Starý muž s hlubokými vráskami a prsty navždy zčernalými od duběnkového inkoustu pomalu zvedne zrak od svého pulpitu. Ve vzduchu je cítit těžká, starobylá vůně pergamenu a včelího vosku.*

"Ah... slyším ty tvé kroky. Další z těch takzvaných 'tiskařů', že? Další z těch, co si ve své pýše myslí, že mechanický lis dokáže nahradit lidskou duši. Pamatuji si časy, chlapče, kdy se knihy psaly **rukou**. Kdy jedna jediná kniha stála tolik, co celá usedlost. Každé slovo, každý tah perem byl tehdy posvátnou modlitbou. Každá stránka byla absolutní, neopakovatelný unikát.

A teď? Klak-klak-klak... ty vaše pekelné železné a dřevěné lisy chrlí kopie jako starý mlýn mouku. Rychlé. Levné. Všechny do jedné bezcitně identické. Znesvěcujete texty tím, že je na tržištích prodáváte chátře a opilcům!

Ale... ačkoliv tvé řemeslo ze srdce opovrhuji, v tvých očích vidím stejný hlad po vědění, jaký jsem měl já, když jsem před padesáti lety poprvé vzal do ruky brkové pero. Mám pro tebe příběhy, mladý tiskaři. Příběhy krve, zrady, inkoustu a tajemství o těch, kdo u lisu stáli dávno před tebou. Příběhy, které v žádné z těch vašich tištěných knih nenajdeš. Máš vůbec dost trpělivosti poslouchat starce?"`,
            options: ['Ano, mistře. Vypravuj!', 'Možná později, lisy nepočkají.']
        },
        
        trade_info: {
            text: `*Písař se na tebe upřeně zadívá, jeho oči jsou kalné věkem, ale mysl zůstává ostrá jako břitva.*

"Nic na tomto světě není zadarmo. Ani slova, ani čas. Za příběh chci příběh. Za materiál chci materiál. Dones mi **3 čisté listy toho vašeho slavného tiskařského papíru** – a já ti na oplatku ukážu, jak se na ně dá napsat skutečná, nefalšovaná pravda. Ne ta polovičatá, kterou sázíte z olověných liter.

Výměnou ti odhalím tajemství jedné z knih z tvé vlastní knihovny mnohem dříve, než bys na ni sám narazil. Čas je velmi relativní pojem pro ty z nás, kdo strávili celý život sledováním usychajícího inkoustu a pamatují historii, kterou vy teprve tisknete..."`,
            cost: { paper: 3 },
            options: ['Vyměnit (3x Papír)', 'Ne, děkuji, papír je drahý.']
        },
        
        random_wisdom: [
            `"Slavný pan Johannes Gutenberg sice změnil svět, ale zemřel v bídě a zapomnění, obrán o své vlastní dílo. Zrádný Fust naopak zemřel pohádkově bohatý, obklopen luxusem. Ptáš se, kdo z nich byl úspěšnější? Záleží na tom, čím ten úspěch měříš. Penězi? Nebo historickým odkazem?"`,
            `"Dnešní hořká ironie: Většina vašich drahých tiskařů sází a tiskne tisíce Biblí a učené traktáty v latině, ale sami neumí přečíst jediné slovo! Byli to zpočátku jen hrubí řemeslníci od kovu a lisu, kováři slov, ne skuteční učenci. Skutečná vzdělanost za tiskařským lisem přišla až mnohem, mnohem později."`,
            `"Víš z čeho byl můj inkoust? Vyráběli jsme ho pečlivě z dubových duběnek, zelené skalice a arabské gumy. Reagoval přímo s pergamenem a vpaloval se hluboko do něj. Vydrží ostrý a černý tisíc let! Tvůj moderní, levný tiskařský inkoust ze sazí a lněného oleje? Ten vybledne a rozmaže se za padesát let, pokud budeš mít velké štěstí."`,
            `"Když se v Mohuči objevily úplně první tištěné kopie, prostý lid a dokonce i někteří mniši s hrůzou křičeli, že jde o temnou magii a čarodějnictví. Jak jinak by logicky dokázal jeden člověk vyrobit sto naprosto identických stránek za jediný den, s každým písmenem na chlup stejným? Upalování tehdy viselo ve vzduchu..."`,
            `"Praha... ach, Praha přišla k fenoménu tisku hrozně pozdě, opatrně a z dálky přešlapovala. Ale když už tamější mistři konečně začali lisy stavět a tisknout, předběhli svou řemeslnou kvalitou a inovacemi polovinu Evropy. To je prostě typická česká nátura – dlouho čekat v ústraní, a pak nečekaně zazářit."`,
            `"Pan Jiří Melantrich, to nebyl obyčejný tiskař v zástěře, to byl nelítostný obchodní dravec s čichem na krev a peníze. Ale pamatuj, že jen takoví dravci v historii přežívají a tvoří mocné dynastie. Ti slabí a příliš poctiví prostě beze stopy mizí v prachu a bezejmenných archivech."`,
            `"Rychlost. Pořád se honíte jen za rychlostí a efektivitou. Víš, kolik vám reálně zabere vytisknout jednu stranu? Odhadem pět minut práce. Víš, kolik trvalo mně ji krasopisně opsat a složitě iluminovat? Tři čisté hodiny bez jediného mrknutí oka. Přesně proto jsme tuhle válku prohráli. Ale ztratili jsme při tom umění."`,
            `"Mnozí z mých bratrů písařů nedokázali unést chudobu. Zradili své celoživotní přesvědčení a skončili u vás, v těch hlučných dílnách páchnoucích olejem, jako prachobyčejní sazeči. Museli jsme se přizpůsobit nové dravé době, nebo zemřít hlady. Já jsem se sice fyzicky přizpůsobil... ale uvnitř, ve své duši, jsem nikdy nepřestal vzpomínat na ticho scriptoria."`
        ],
        
        after_trade: {
            text: `*Starý písař se třesoucí rukou převezme tvůj papír. Opatrně ho pohladí bříšky prstů, jako by hodnotil jeho samotnou duši, a zkoumá ho proti mihotavému světlu svíčky.*

"Je tak... neuvěřitelně hladký. Až nepřirozeně dokonalý a jemný. Ale cítíš to? Je naprosto bez duše a bez života. Pravý zvířecí pergamen, ten měl svou hrubou texturu, měl svou specifickou vůni, měl nezaměnitelnou individualitu v každém odřezku. Tisíce jich prošly mýma rukama.

Ale splnil jsi bez okolků svůj slib a tvá touha po vědění je zjevně upřímná, ne jen hnaná vidinou rychlých grošů. Tady, vezmi si tuto starou, ohmatanou knihu. Strážil jsem ji velmi dlouho a tajně. Je to prastarý příběh o tom, jak se formoval náš svět, a možná ti pomůže pochopit, kam směřuje..."

*Zvedne ze spodní zaprášené přihrádky těžký svazek s koženou vazbou a masivními mosaznými sponami a s nejhlubší úctou ti ho předá do rukou.*`,
            options: ['Děkuji za tvou neocenitelnou moudrost a tvůj čas, mistře.']
        }
    },
    
    state: {
        visited: false,
        totalTrades: 0,
        lastTrade: 0
    }
};

// ================================================
// 5. GAME STATE EXTENSION - Rozšíření GameState
// ================================================

// Toto se přidá do GameState v Game.init()
const LibraryStateTemplate = {
    library: {
        startDate: null, // Timestamp prvního spuštění
        unlockedBooks: [], // ID odemčených knih
        readBooks: [], // ID přečtených knih
        scribeState: {
            visited: false,
            totalTrades: 0,
            lastTrade: 0
        }
    }
};

// ================================================
// 6. HELPER FUNCTIONS - Pomocné funkce
// ================================================

const LibraryHelpers = {
    // Kontrola, které knihy jsou odemčené
    checkLibraryUnlocks: function() {
        if (!GameState.library) {
            GameState.library = JSON.parse(JSON.stringify(LibraryStateTemplate.library));
        }
        
        if (!GameState.library.startDate) {
            GameState.library.startDate = Date.now();
        }
        
        const daysPassed = Math.floor(
            (Date.now() - GameState.library.startDate) / (24 * 60 * 60 * 1000)
        );
        
        let newUnlocks = 0;
        LibraryDB.books.forEach(book => {
            if (book.unlockDay <= daysPassed && 
                !GameState.library.unlockedBooks.includes(book.id)) {
                GameState.library.unlockedBooks.push(book.id);
                newUnlocks++;
            }
        });
        
        if (newUnlocks > 0) {
            UI.notify(t('library_lore.new_book').replace('{count}', newUnlocks));
        }
    },
    
    // Přečtení knihy
    readBook: function(bookId) {
        const book = LibraryDB.books.find(b => b.id === bookId);
        if (!book) return;
        
        if (!GameState.library.readBooks.includes(bookId)) {
            GameState.library.readBooks.push(bookId);
        }
        
        // Show modal with book content
        UI.showBookModal(book);
        
        Game.save();
        
        // Check Easter egg achievements
        LibraryHelpers.checkEasterEggs();
    },
    
    // Kontrola Easter eggs
    checkEasterEggs: function() {
        if (!GameState.library) return;
        
        EasterEggsDB.achievements.forEach(egg => {
            if (GameState.achievements.unlocked.includes(egg.id)) return;
            
            if (egg.condition()) {
                GameState.achievements.unlocked.push(egg.id);
                
                // Grant reward
                if (egg.reward.book) {
                    GameState.library.unlockedBooks.push(egg.reward.book);
                    const eggBaseId = egg.id.split('_')[0]; // faust, complete, scholar...
                    const eggName = t(`library_lore.easter_eggs.${eggBaseId}_name`);
                    UI.notify(t('library_lore.easter_eggs.notify_found').replace('{name}', eggName || egg.name));
                }
                if (egg.reward.research) {
                    Game.addItem('research', egg.reward.research);
                }
                
                Game.save();
            }
        });
    },
    
    // NPC Písař - obchod
    scribeTrade: function() {
        const cost = ScribeNPC.dialogues.trade_info.cost;
        
        // Check if player has enough
        if ((GameState.inventory.paper || 0) < cost.paper) {
            UI.notify(t('library_lore.npc_scribe.err_paper'), true);
            return;
        }
        
        // Remove items
        Game.removeItem('paper', cost.paper);
        
        // Unlock random book
        const locked = LibraryDB.books.filter(b => 
            !GameState.library.unlockedBooks.includes(b.id) &&
            b.unlockDay > 0 // Not special books
        );
        
        if (locked.length > 0) {
            const randomBook = locked[Math.floor(Math.random() * locked.length)];
            GameState.library.unlockedBooks.push(randomBook.id);
            
            GameState.library.scribeState.totalTrades++;
            GameState.library.scribeState.lastTrade = Date.now();
            
            // Trik pro získání názvu knihy rovnou ze slovníku
            const currentLang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
            const dict = currentLang === 'en' ? STRINGS_en : STRINGS_cs;
            const bookTitle = dict.library_lore.books[randomBook.id].title;
            
            UI.notify(`${t('library_lore.npc_scribe.notify_book')} "${bookTitle}"`);
        } else {
            UI.notify(t('library_lore.npc_scribe.notify_empty'));
        }
        
        Game.save();
        if (typeof UI.renderLibrary === 'function') {
            UI.renderLibrary();
        } else {
            UI.renderAll();
        }
    }
};

// ================================================
// 7. EXPORT MODULE
// ================================================

// Toto je export pro integraci do hlavního game souboru
const ScriptoriumLibraryModule = {
    LibraryDB,
    TechLoreDB,
    EasterEggsDB,
    ScribeNPC,
    LibraryStateTemplate,
    LibraryHelpers
};

// ================================================
// KONEC MODULU
// ================================================

console.log('📚 Library Module loaded successfully!');

