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
        },
		{
            id: 'defenestrace_detective',
            name: 'Pravda padá z okna',
            desc: 'Zjisti, co se skutečně stalo na Pražském hradě. (Přečti knihu: Apologie stavův)',
            icon: '🪟',
            condition: () => GameState.library && GameState.library.readBooks.includes('book_defenestrace'),
            reward: { research: 15, coins: 50 },
            secret: false
        },
        {
            id: 'master_of_herbs',
            name: 'Křišťanův učeň',
            desc: 'Kombinuj bylinářství z Mattioliho a Křišťana z Prachatic a poraz mor.',
            icon: '🌿',
            condition: () => {
                if (!GameState.library) return false;
                const required = ['book_mattioli_herbar', 'book_cerny_herbar', 'book_kristan_mor'];
                return required.every(id => GameState.library.readBooks.includes(id));
            },
            reward: { item: 'mattioli_woodcut' }, // Dropne speciální item z předchozího kódu
            secret: true
        },
        {
            id: 'codex_gigas_summon',
            name: 'Osamělá noc v Podlažicích',
            desc: 'Napiš Codex Gigas. (Hraj hru nepřetržitě v kuse mezi půlnocí a 3:00 ráno reálného času).',
            icon: '👹',
            condition: () => {
                // Tento achievement kontroluje reálný čas hráče!
                const hour = new Date().getHours();
                return hour >= 0 && hour < 3 && (GameState.inventory.research || 0) > 1000;
            },
            reward: { book: 'book_voynich' }, // Odměnou je samotný Voynichův rukopis!
            secret: true
        },
        {
            id: 'koldin_lawyer',
            name: 'Kancléř Starého Města',
            desc: 'Nastol řád a právo. Přečti všechny právní kodexy v knihovně.',
            icon: '⚖️',
            condition: () => {
                if (!GameState.library) return false;
                const lawBooks = ['book_rozmberk', 'book_majestas', 'book_koldin'];
                return lawBooks.every(id => GameState.library.readBooks.includes(id));
            },
            reward: { coins: 300 }, // Peníze z daní a soudních poplatků
            secret: false
        }
    ],
    
    specialItems: {
		'mattioli_woodcut': {
            name: 'Mattioliho dřevořez',
            icon: '🪵',
            type: 'lore',
            desc: 'Původní tiskařský štoček z tvrdého hruškového dřeva k Mattioliho herbáři.',
            rarity: 0.005,
            lore: `Když toto staré, zčernalé dřevo otočíš proti světlu, uvidíš mistrovskou práci. Je na něm neuvěřitelně detailně vyřezán kořen mandragory. Zbytky zaschlé, drolící se tiskařské černě z roku 1562 se stále paličatě drží v těch nejjemnějších rýhách vyrytých dlátkem. 
Kolikrát asi tento kousek dřeva tvrdě projel pod obrovským tlakem lisu Jiřího Melantricha, než byl pro své opotřebení odhozen do zaprášeného rohu dílny?`
        },
		
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
            text_en: `*An old man, deep-furrowed of brow and fingers forever blackened with oak-gall ink, slowly lifteth his gaze from his writing-desk. Upon the air hangeth a heavy, ancient scent of parchment and beeswax.*

"Ah... I hear thy footfall. Another of these so-called 'printers,' is it not? Another who, in his pride, believeth a mechanical press may stand in the stead of a human soul. I remember well the days, lad, when books were written by **hand**. When a single volume cost as much as an entire farmstead. Every word, every stroke of the pen was a sacred prayer then. Every page was absolute, unrepeatable, unique.

And now? Clack-clack-clack... thy infernal presses of iron and wood spew forth copies as an old mill spews forth flour. Swift. Cheap. Every last one coldly identical to the next. Thou defilest the written word by hawking it in the marketplace to rabble and drunkards!

But... though I hold thy craft in contempt from the very depths of my heart, I see in thine eyes the same hunger for knowledge I myself once bore, fifty years past, when first I took a quill-pen in hand. I have tales for thee, young printer. Tales of blood, betrayal, ink, and secrets of those who stood at the press long before thee. Tales thou shalt find in none of thy printed books. Hast thou patience enough to hear an old man speak?"`,
            options: ['Ano, mistře. Vypravuj!', 'Možná později, lisy nepočkají.'],
            options_en: ['Aye, master. Speak on!', 'Perhaps another time — the presses wait not.']
        },
        
        trade_info: {
            text: `*Písař se na tebe upřeně zadívá, jeho oči jsou kalné věkem, ale mysl zůstává ostrá jako břitva.*

"Nic na tomto světě není zadarmo. Ani slova, ani čas. Za příběh chci příběh. Za materiál chci materiál. Dones mi **3 čisté listy toho vašeho slavného tiskařského papíru** – a já ti na oplatku ukážu, jak se na ně dá napsat skutečná, nefalšovaná pravda. Ne ta polovičatá, kterou sázíte z olověných liter.

Výměnou ti odhalím tajemství jedné z knih z tvé vlastní knihovny mnohem dříve, než bys na ni sám narazil. Čas je velmi relativní pojem pro ty z nás, kdo strávili celý život sledováním usychajícího inkoustu a pamatují historii, kterou vy teprve tisknete..."`,
            text_en: `*The scribe fixeth thee with a steady stare; his eyes are clouded with age, yet his mind remaineth sharp as a blade.*

"Nothing in this world cometh free. Not words, not time. For a tale, I ask a tale. For a material, I ask a material. Bring me **three clean sheets of that famed printer's paper of thine** — and in return I shall show thee how true, unadulterated truth may be set upon it. Not the half-truth thou settest in leaden type.

In exchange, I shall reveal to thee the secret of one book from thine own library, long ere thou wouldst have stumbled upon it thyself. Time is a most relative notion to those of us who have spent a whole life watching ink dry, and who remember the history thou hast only now begun to print..."`,
            cost: { paper: 3 },
            options: ['Vyměnit (3x Papír)', 'Ne, děkuji, papír je drahý.'],
            options_en: ['Trade (3x Paper)', 'No, thank thee — paper is dear.']
        },
        
        random_wisdom: [
            `"Slavný pan Johannes Gutenberg sice změnil svět, ale zemřel v bídě a zapomnění, obrán o své vlastní dílo. Zrádný Fust naopak zemřel pohádkově bohatý, obklopen luxusem. Ptáš se, kdo z nich byl úspěšnější? Záleží na tom, čím ten úspěch měříš. Penězi? Nebo historickým odkazem?"`,
            `"Dnešní hořká ironie: Většina vašich drahých tiskařů sází a tiskne tisíce Biblí a učené traktáty v latině, ale sami neumí přečíst jediné slovo! Byli to zpočátku jen hrubí řemeslníci od kovu a lisu, kováři slov, ne skuteční učenci. Skutečná vzdělanost za tiskařským lisem přišla až mnohem, mnohem později."`,
            `"Víš z čeho byl můj inkoust? Vyráběli jsme ho pečlivě z dubových duběnek, zelené skalice a arabské gumy. Reagoval přímo s pergamenem a vpaloval se hluboko do něj. Vydrží ostrý a černý tisíc let! Tvůj moderní, levný tiskařský inkoust ze sazí a lněného oleje? Ten vybledne a rozmaže se za padesát let, pokud budeš mít velké štěstí."`,
            `"Když se v Mohuči objevily úplně první tištěné kopie, prostý lid a dokonce i někteří mniši s hrůzou křičeli, že jde o temnou magii a čarodějnictví. Jak jinak by logicky dokázal jeden člověk vyrobit sto naprosto identických stránek za jediný den, s každým písmenem na chlup stejným? Upalování tehdy viselo ve vzduchu..."`,
            `"Praha... ach, Praha přišla k fenoménu tisku hrozně pozdě, opatrně a z dálky přešlapovala. Ale když už tamější mistři konečně začali lisy stavět a tisknout, předběhli svou řemeslnou kvalitou a inovacemi polovinu Evropy. To je prostě typická česká nátura – dlouho čekat v ústraní, a pak nečekaně zazářit."`,
            `"Pan Jiří Melantrich, to nebyl obyčejný tiskař v zástěře, to byl nelítostný obchodní dravec s čichem na krev a peníze. Ale pamatuj, že jen takoví dravci v historii přežívají a tvoří mocné dynastie. Ti slabí a příliš poctiví prostě beze stopy mizí v prachu a bezejmenných archivech."`,
            `"Rychlost. Pořád se honíte jen za rychlostí a efektivitou. Víš, kolik vám reálně zabere vytisknout jednu stranu? Odhadem pět minut práce. Víš, kolik trvalo mně ji krasopisně opsat a složitě iluminovat? Tři čisté hodiny bez jediného mrknutí oka. Přesně proto jsme tuhle válku prohráli. Ale ztratili jsme při tom umění."`,
            `"Mnozí z mých bratrů písařů nedokázali unést chudobu. Zradili své celoživotní přesvědčení a skončili u vás, v těch hlučných dílnách páchnoucích olejem, jako prachobyčejní sazeči. Museli jsme se přizpůsobit nové dravé době, nebo zemřít hlady. Já jsem se sice fyzicky přizpůsobil... ale uvnitř, ve své duši, jsem nikdy nepřestal vzpomínat na ticho scriptoria."`,
            `"Víš, kdo vynalezl pohyblivé litery jako první? Ne Gutenberg. Číňan Pi Šeng, přes čtyři sta let před ním, z pálené hlíny. A Korejci odlévali litery z kovu ještě dřív, než se Mohuč vůbec probudila. Evropa si jen myslí, že vynalézá. Většinou jen dohání."`,
            `"Vidím, žes objednal u Skláře čočky na nos. Oculi, říkáte tomu. My starci jsme si vystačili s berylem položeným na stránku — beryllus, kámen ke čtení. Fungovalo to sto let předtím, než někoho napadlo dát dvě čočky do rámu a pověsit si je na uši jako kozel zvonec."`,
            `"Kniha v mé mladosti nebyla připoutána ke stolu jen tak pro nic za nic. Řetěz, catena, byl dražší než leckterý svazek, co držel. Kdo krade knihu, krade statek. Vaše tištěné kopie? Ty jsou tak levné, že se nikomu nevyplatí je ani ukrást."`,
            `"Nikdy jsme neměli titulní listy, chlapče. Kniha začínala rovnou textem. Jak jsme je od sebe rozeznali, když jich v jedné truhle leželo sto stejně začínajících? Podle druhého listu — secundo folio. Každý opis se lišil už na druhé straně. Vaše tištěné výtisky jsou stejné do posledního puntíku. Žádné druhé folio vám nepomůže."`,
            `"Pergamen se nevyhazuje, ani když je kniha k ničemu. Seškrábeš starý text pemzou, umyješ mlékem, a píšeš znovu. Palimpsest. Pod žaltářem, co dnes čteš, možná leží zapomenutá antika. Váš papír? Shoří a je z něj popel. Nic pod ním nezůstane pro vnuky ke čtení."`,
            `"Anglický král dal roku 1476 kejklíři jménem Caxton povolení stavět lis ve Westminsteru. První v celém království. Zajímavé, jak i ostrované na kraji světa dřív pochopili, že kdo ovládá lis, ovládá i to, co si lidé myslí."`,
            `"Slyšel jsem o rybím tahu vyz na Piscině — prý až sem, k Olomouci, jako za starých časů. To je novinka, co v mých letech ještě potěší: aspoň řeka si pamatuje, jak to bylo, i když lidé zapomínají rychleji než voda teče."`,
            `"Ve vašem Athanoru prý teď vaříte barvy a laky, o kterých starý Theofilus psal v klášterním rukopisu před staletími. Kdo by řekl, že se k němu vrátíte přes kelímek a měchy, místo přes brk a inkoust. Cesty k témuž poznání bývají klikaté."`,
            `"Blázni z jihu prý teď vaří lektvary, co církev nazývá kacířskými, a inkvizitor už čenichá po klášteře. Za mých časů stačilo přepsat špatnou glosu na okraj a shořel jsi za to i s knihou. Buď opatrný, chlapče — plamen se od mého inkoustu k vaší síře nese rychleji, než myslíš."`,
            `"Univerzitní studenti si dřív nekupovali knihu vcelku — najali si arch, opsali ho, vrátili, půjčili si další. Pecie, říkalo se tomu. Stacionář si hlídal každý list jako oko v hlavě. Vaše tiskárny prodávají rovnou celé svazky. Rychlejší, ano. Ale ten student, co si sám přepsal každé slovo, ho znal nazpaměť. Ten váš, co si knihu koupil, ji možná ani nepřečte."`
        ],
        random_wisdom_en: [
            `"The famed Master Johannes Gutenberg did change the world, aye — yet he died in poverty and forgetting, stripped of his own life's work. Treacherous Fust, by contrast, died richer than in any fable, surrounded by luxury. Thou askest which of the twain was the more successful? That dependeth on how thou measurest success. In coin? Or in the legacy history remembers?"`,
            `"Here is bitter irony for thee: most of thy precious printers set and print a thousand Bibles and learned Latin tracts, yet cannot themselves read a single word of them! At the first they were naught but rough craftsmen of metal and press, smiths of words, not true scholars. True learning came to stand behind the printing press only much, much later."`,
            `"Knowest thou of what my ink was made? We wrought it with great care from oak-galls, green vitriol, and gum arabic. It bound itself unto the parchment and burned deep within it. It shall remain sharp and black a thousand years! Thy modern, cheap printer's ink of soot and linseed oil? That shall fade and smear within fifty years, shouldst thou be greatly fortunate."`,
            `"When the very first printed copies appeared in Mainz, the common folk — aye, and even certain monks — cried out in horror that this was dark magic and witchcraft. How else, by reason, could one man produce a hundred wholly identical pages in a single day, every letter matched to the hair? The burning-stake hung heavy in the air in those days..."`,
            `"Prague... ah, Prague came to this phenomenon of printing most tardily, hanging back and shuffling its feet from afar. Yet when at last her masters began to build their presses and set their type, they outstripped half of Europe in craft and cunning. Such is the true Bohemian nature — to wait long in the shadows, and then, unlooked-for, to shine."`,
            `"Master Jiří Melantrich was no common printer in an apron — he was a merciless beast of commerce, with a nose for blood and for coin. But mark thou well: only such beasts survive in history and found mighty dynasties. The weak, and those too honest by half, simply vanish without trace into the dust of nameless archives."`,
            `"Speed. Ever dost thou chase after speed and efficiency alone. Knowest thou how long it truly taketh thee to print a single page? Some five minutes' labour, I would reckon. Knowest thou how long it took me to copy it fair and illuminate it with care? Three full hours, without so much as a blink. This, precisely, is why we lost that war. Yet in the losing of it, we lost also an art."`,
            `"Many of my brother-scribes could not bear the weight of poverty. They betrayed the conviction of a whole lifetime and ended up among you, in those clamorous workshops reeking of oil, as common compositors of type. We were forced to bend to this new, ravenous age, or else to starve. I myself bent, in body... but within, in my very soul, I never ceased to remember the silence of the scriptorium."`,
            `"Knowest thou who first invented movable type? Not Gutenberg. The Chinaman Bi Sheng, some four hundred years before him, out of fired clay. And the Koreans were casting letters of metal ere Mainz had even woken. Europe believeth it invents. Most often, it merely catches up."`,
            `"I see thou hast ordered lenses for thy nose from the Glassmaker. Oculi, you call them. We old men made do with a beryl laid upon the page — beryllus, the reading-stone. It served a hundred years before any thought to set two lenses in a frame and hang them from the ears like a bell on a goat."`,
            `"A book in my youth was not chained to the desk for nothing. The catena, the chain, cost dearer than many a volume it held. He who steals a book steals a farmstead. Thy printed copies? They are so cheap that none troubles even to steal them."`,
            `"We never had title pages, lad. A book began straightway with the text. How did we tell one from another, when a hundred lay in one chest, all beginning alike? By the second leaf — secundo folio. Every copy differed by the second page. Thy printed volumes are alike unto the last dot. No second folio shall aid thee."`,
            `"Parchment is never thrown away, not even when the book is worthless. Thou scrapest the old text off with pumice, washest it with milk, and writest anew. A palimpsest. Beneath the psalter thou readest today may lie some forgotten antiquity. Thy paper? It burns to ash. Nothing remains beneath it for thy grandsons to read."`,
            `"In the year 1476 the English king gave leave to a fellow named Caxton to raise a press at Westminster. The first in the whole kingdom. Curious, how even islanders at the edge of the world grasped early that who commands the press commands also what men think."`,
            `"I have heard of the sturgeon run at the Piscina — as far as Olomouc, they say, as in the old days. That is news to gladden even a man of my years: at least the river remembers how things were, though men forget faster than the water flows."`,
            `"In thy Athanor, they say, thou now brewest colours and varnishes that old Theophilus wrote of in a monastic manuscript centuries past. Who would have said thou wouldst return to him through crucible and bellows, rather than quill and ink. The roads to the selfsame knowledge are ever crooked."`,
            `"Fools from the south, they say, now brew potions the Church calls heretical, and an inquisitor already sniffs about the cloister. In my day, it sufficed to copy one ill-worded gloss into the margin, and thou didst burn for it, book and all. Be wary, lad — the flame travels from my ink to your brimstone faster than thou thinkest."`,
            `"University students of old did not buy a book whole — they hired a quire, copied it, returned it, hired the next. Pecie, it was called. The stationer watched over every leaf as over the apple of his eye. Thy presses sell whole volumes outright. Faster, aye. But the student who copied every word himself knew it by heart. Thine, who merely bought the book, may never even read it."`
        ],
        
        after_trade: {
            text: `*Starý písař se třesoucí rukou převezme tvůj papír. Opatrně ho pohladí bříšky prstů, jako by hodnotil jeho samotnou duši, a zkoumá ho proti mihotavému světlu svíčky.*

"Je tak... neuvěřitelně hladký. Až nepřirozeně dokonalý a jemný. Ale cítíš to? Je naprosto bez duše a bez života. Pravý zvířecí pergamen, ten měl svou hrubou texturu, měl svou specifickou vůni, měl nezaměnitelnou individualitu v každém odřezku. Tisíce jich prošly mýma rukama.

Ale splnil jsi bez okolků svůj slib a tvá touha po vědění je zjevně upřímná, ne jen hnaná vidinou rychlých grošů. Tady, vezmi si tuto starou, ohmatanou knihu. Strážil jsem ji velmi dlouho a tajně. Je to prastarý příběh o tom, jak se formoval náš svět, a možná ti pomůže pochopit, kam směřuje..."

*Zvedne ze spodní zaprášené přihrádky těžký svazek s koženou vazbou a masivními mosaznými sponami a s nejhlubší úctou ti ho předá do rukou.*`,
            text_en: `*The old scribe taketh thy paper with a trembling hand. Gently he strokes it with the pads of his fingers, as though weighing its very soul, and holds it up against the flickering candlelight.*

"It is so... unnaturally smooth. Perfect and fine past all nature's making. But dost thou feel it? It is utterly without soul, without life. True animal parchment — that had its own rough texture, its own particular scent, an individuality unmistakable in every scrap. Thousands of such have passed through these hands of mine.

Yet thou hast kept thy word without complaint, and thy hunger for knowledge is plainly sincere, not merely a chasing after quick coin. Here — take this old, well-worn book. I have guarded it long, and in secret. It is an ancient tale of how our world was shaped, and perchance it shall help thee understand whither it now tends..."

*From a dusty lower shelf he lifts a heavy tome, bound in leather with massive brass clasps, and with the deepest reverence, places it into thy hands.*`,
            options: ['Děkuji za tvou neocenitelnou moudrost a tvůj čas, mistře.'],
            options_en: ['My thanks for thy priceless wisdom, and for thy time, master.']
        }
    },

    // ================================================
    // TÉMATA K ROZHOVORU — 30 témat, 6 pásem podle vztahu (MRD krok 4/5)
    // Každé téma lze položit jen jednou (checklist), denní limit 1 téma/den.
    // ================================================
    topics: [
        // ── PÁSMO A (vztah 0) — obecné řemeslo ───────────────────────────────
        { id: 't01', minRelation: 0,
          title: 'Jak se dělal pergamen', title_en: 'How parchment was made',
          text: `"Kůže, chlapče. Ovčí, kozí, telecí. Namočená do vápna, aby pustila srst, napjatá na rám a škrábaná půlměsícovým nožem, dokud není tenká jako tvé svědomí. Pak se leští pemzou. Trvá to týdny. Žádný stroj ti nedá pergamen za den."`,
          text_en: `"Hide, lad. Sheep, goat, calf. Soaked in lime till the hair lets go, stretched on a frame, and scraped with a half-moon knife till it's thin as thy conscience. Then polished with pumice. It taketh weeks. No machine shall give thee parchment in a day."` },

        { id: 't02', minRelation: 0,
          title: 'Jak se dělal inkoust', title_en: 'How the ink was made',
          text: `"Duběnky z dubu, zelená skalice, arabská guma a voda. Necháš to stát, procedíš, a máš inkoust, co se zakousne do kůže a zčerná navěky. Tvůj tiskařský inkoust ze sazí? Ten leží na povrchu jako lež. Můj se stal součástí stránky."`,
          text_en: `"Oak-galls, green vitriol, gum arabic, and water. Let it stand, strain it, and thou hast ink that bites into the skin and blackens forever. Thy printer's ink of soot? That lieth upon the surface like a falsehood. Mine became part of the page itself."` },

        { id: 't03', minRelation: 0,
          title: 'Co je iniciála a rubrikace', title_en: 'What is an initial and rubrication',
          text: `"Rubrica — červená hlinka nebo rumělka. Prvá litera na stránce se maluje tou barvou, aby oko vědělo: tady začíná nová myšlenka. My tomu říkáme rubrikace. Tvůj lis to všechno tiskne černě, jednotvárně, jako by na začátku nezáleželo."`,
          text_en: `"Rubrica — red ochre, or cinnabar. The first letter on a page is painted in that colour, so the eye knoweth: here beginneth a new thought. We call it rubrication. Thy press printeth it all in black, monotonous, as though beginnings mattered not at all."` },

        { id: 't04', minRelation: 0,
          title: 'Jak dlouho trvá opsat Bibli', title_en: 'How long it takes to copy a Bible',
          text: `"Dobrý rok, chlapče. Někdy déle, má-li být zdobená. Ruka bolí, oči slzí, ale každé slovo je tvoje, protože jsi ho sám napsal. Tvůj lis to udělá za pár týdnů a nikdo, kdo to vytiskl, přitom nepřečetl jediný verš."`,
          text_en: `"A good year, lad. Longer, should it be adorned. The hand aches, the eyes weep, but every word is thine own, for thou hast written it thyself. Thy press doth it in a few weeks, and not one who printed it hath read a single verse thereof."` },

        { id: 't05', minRelation: 0,
          title: 'Kdo byl Johannes Gutenberg', title_en: 'Who was Johannes Gutenberg',
          text: `"Muž z Mohuče, co spojil kov, olej a lis do jedné pekelné mašiny. Kolem roku 1450. Jeho čtyřicetidvouřádková Bible ukázala světu, co tvůj cech dovede. A přesto zemřel v bídě, obraný o vlastní dílo tím zrádcem Fustem. Zapamatuj si to jméno — Fust, ne Faust."`,
          text_en: `"A man of Mainz who bound metal, oil, and press into one infernal machine. Round about 1450. His forty-two-line Bible showed the world what thy guild could do. And yet he died in poverty, stripped of his own life's work by that traitor Fust. Remember the name well — Fust, not Faust."` },

        { id: 't06', minRelation: 0,
          title: 'Co je inkunábule', title_en: 'What is an incunable',
          text: `"Latinsky 'in cunabulis' — v kolébce. Tak se říká každé knize vytištěné před rokem 1501. Vaše řemeslo je ještě v plenkách, chlapče. Jestli přežije padesát let, uvidíme, jaké z toho vyroste dítě."`,
          text_en: `"Latin — 'in cunabulis.' In the cradle. So is called every book printed before the year 1501. Thy craft is yet in its swaddling clothes, lad. Should it survive fifty years, we shall see what manner of child grows from it."` },

        // ── PÁSMO B (vztah 15) — hlubší řemeslo ──────────────────────────────
        { id: 't07', minRelation: 15,
          title: 'Iluminace a zlacení', title_en: 'Illumination and gilding',
          text: `"Zlatý plátek, vaječný bílek jako pojivo, a modř z tlučeného lazuritu — dražší než samo zlato, dovážená až z Persie. Znal jsem jeptišku, co si štětec s lazuritem olizovala, aby nezplýtvala ani zrnkem. Tvůj lis neumí ani ždibec téhle barvy."`,
          text_en: `"Gold leaf, egg-white for a binder, and blue from crushed lapis lazuli — dearer than gold itself, brought all the way from Persia. I knew a nun who licked her brush clean of lapis so as not to waste a single grain. Thy press knoweth not so much as a speck of that colour."` },

        { id: 't08', minRelation: 15,
          title: 'Kolik stála kniha', title_en: 'What a book cost',
          text: `"Zdobená Bible? Tolik co usedlost s poli a kravou k tomu. Slyšel jsem o klášteře, co za jeden žaltář dal celé stádo ovcí. Knihu jsi nekupoval jako věc — kupoval jsi kus něčího života."`,
          text_en: `"An adorned Bible? As much as a farmstead, with fields and a cow besides. I heard of a monastery that gave a whole flock of sheep for a single psalter. Thou didst not buy a book as a thing — thou boughtst a piece of another man's life."` },

        { id: 't09', minRelation: 15,
          title: 'Univerzity a systém pecia', title_en: 'Universities and the pecia system',
          text: `"V Paříži i Boloni to funguje takhle: univerzita schválí přesný opis, rozstříhá ho na sešitky — pecie — a stationarius je půjčuje studentům, sešitek po sešitku, na opsání. Poctivý stationarius účtuje poplatek podle pravidel. Ne každý je poctivý."`,
          text_en: `"In Paris and in Bologna it worketh thus: the university approveth an exact copy, cutteth it into gatherings — pecia — and a stationarius lends them out to students, gathering by gathering, for copying. An honest stationarius chargeth the fee by the rule. Not every one is honest."` },

        { id: 't10', minRelation: 15,
          title: 'Církevní dohled nad texty', title_en: "The Church's watch over texts",
          text: `"Žádný jednotný seznam zakázaných knih zatím neexistuje, chlapče — to přijde později, uvidíš. Ale biskup má oči a inkvizitor má uši, a leckterý spis skončil v ohni dřív, než si ho kdokoli přečetl. Opatrnost byla vždycky levnější než lítost."`,
          text_en: `"No single roll of forbidden books existeth yet, lad — that shall come later, thou shalt see. But a bishop hath eyes, and an inquisitor hath ears, and many a tract hath ended in the fire before any man read it through. Caution hath ever been cheaper than regret."` },

        { id: 't11', minRelation: 15,
          title: 'Stationarius a knižní veletrhy', title_en: 'The stationarius and the book fairs',
          text: `"Znáš ho, toho dealera od univerzity, co sem přijíždí po jarním a podzimním veletrhu? Dobrý obchodník, ale opatrně — přiúčtuje si podíl z pecia navíc, co žákovi nikdy nepřizná. Kupuj od něj inkoust a pergamen, ne důvěru."`,
          text_en: `"Thou knowest him — that university dealer who cometh after the spring and autumn fairs? A fair tradesman, but mind thyself — he skimmeth an extra cut from the pecia fee he never discloseth to the student. Buy ink and vellum from him. Not trust."` },

        { id: 't12', minRelation: 15,
          title: 'Vazba knihy', title_en: 'Binding a book',
          text: `"Dřevěné desky, potažené kůží, a nakonec kování — kovové spony a rohy, co drží desky pevně u sebe, ať vlhko nebo sucho. Neokovaná kniha čeká na kováře jako nevěsta na ženicha. Bez kování se stránky kroutí a kniha umírá zevnitř."`,
          text_en: `"Wooden boards, covered in leather, and at the last, the fittings — metal clasps and corner-pieces that hold the boards fast together, be it damp or dry. An unfitted book awaiteth the smith as a bride awaiteth her groom. Without its fittings, the pages warp and the book dieth from within."` },

        // ── PÁSMO C (vztah 35) — drby o skutečných postavách ─────────────────
        { id: 't13', minRelation: 35,
          title: 'Fust a legenda o Faustovi', title_en: 'Fust and the legend of Faust',
          text: `"Lidé slyší jméno Fust a jméno Faust a v hospodě jim to splyne v jedno. Prostý lid věřil, že tolik identických stránek nemůže udělat člověk — musí to být čarodějnictví, pakt s ďáblem. Pravda je prostší a horší: Fust prostě obral Gutenberga o dílo a zbohatl na tom."`,
          text_en: `"Folk hear the name Fust and the name Faust, and in the tavern the two run together. The common people believed so many identical pages could not be the work of man — it must be sorcery, a pact with the devil. The truth is plainer, and worse: Fust simply robbed Gutenberg of his life's work, and grew rich upon it."` },

        { id: 't14', minRelation: 35,
          title: 'Jiří Melantrich', title_en: 'Jiří Melantrich',
          text: `"Ne obyčejný tiskař v zástěře — obchodní dravec s čichem na krev a peníze. Takoví přežívají a zakládají dynastie. Slabí a příliš poctiví mizí beze stopy. Nelíbí se mi to, ale historie mu za pravdu dává."`,
          text_en: `"No common printer in an apron — a beast of commerce with a nose for blood and coin. Such men survive and found dynasties. The weak, and those too honest by half, vanish without trace. I like it not, yet history proveth him right."` },

        { id: 't15', minRelation: 35,
          title: 'Nicolas Jenson a benátská antikva', title_en: 'Nicolas Jenson and the Venetian roman type',
          text: `"Benátčan, co navrhl písmo podle humanistických rukopisů — tak čitelné, že z něj později vzešly Times i Garamond. I mezi tiskaři jsou tedy řemeslníci se vkusem. Jenson mě skoro obměkčil. Skoro."`,
          text_en: `"A Venetian who designed a type after the humanist hand — so legible that Times and Garamond themselves later sprang from it. So even among printers there are craftsmen of taste. Jenson near softened my heart toward thy trade. Near."` },

        { id: 't16', minRelation: 35,
          title: 'Aldus Manutius a kapesní vydání', title_en: 'Aldus Manutius and the pocket edition',
          text: `"Griffo vyřezal pro Manutia kurzívu napodobující úsporný rukopis kancléřů — a Manutius z ní udělal kapesní Vergilia. První kniha, co se vešla do brašny na cesty. Praktický nápad. Přiznávám to nerad."`,
          text_en: `"Griffo cut a cursive type for Manutius, in imitation of the chancery scribe's economical hand — and Manutius made of it a pocket Virgil. The first book small enough for a traveller's satchel. A practical notion. I own it grudgingly."` },

        { id: 't17', minRelation: 35,
          title: 'Zakázané a nebezpečné knihy', title_en: 'Forbidden and dangerous books',
          text: `"Některé spisy se opisují jen potají, mezi důvěryhodnýma rukama, a nikdy nahlas. Kacířské myšlenky mají zvláštní moc přitahovat právě ty, co je hledají nejpilněji. Já vím o jedné takové. Ale to tajemství si nechám pro sebe, chlapče."`,
          text_en: `"Some tracts are copied only in secret, among trusted hands, and never spoken aloud. Heretical notions have a strange power to draw in precisely those who seek them most diligently. I know of one such. But that secret I shall keep to myself, lad."` },

        { id: 't18', minRelation: 35,
          title: 'Klášterní knihovna před tiskem', title_en: 'The monastic library before printing',
          text: `"Ticho scriptoria, chlapče — to bylo posvátnější než leckterá mše. Řady mnichů, každý nad svým pulpitem, škrábání brku a nic víc. Žádný klapot, žádný spěch. Jen slovo za slovem, jako modlitba bez konce."`,
          text_en: `"The silence of the scriptorium, lad — holier than many a mass. Rows of monks, each at his own desk, the scratch of the quill and nothing more. No clacking, no haste. Only word after word, like a prayer without end."` },

        // ── PÁSMO D (vztah 50) — otevírá se osobně ───────────────────────────
        { id: 't19', minRelation: 50,
          title: 'Jak se stal písařem', title_en: 'How he became a scribe',
          text: `"Byl jsem osmý syn, chlapče, žádná půda pro mě nezbyla. Opat si všiml, že mám klidnou ruku. To stačilo. V třinácti jsem poprvé vzal brk — a už jsem ho nepustil, celých padesát let."`,
          text_en: `"I was an eighth son, lad, no land left over for me. The abbot noticed I had a steady hand. That sufficed. At thirteen I first took up the quill — and never let it go again, these fifty years past."` },

        { id: 't20', minRelation: 50,
          title: 'Co čeká starého písaře', title_en: 'What awaits an old scribe',
          text: `"Řemeslo, co umím, umírá se mnou. Nikdo mladý se už neučí opisovat tak, jak jsem se učil já. Až zemřu, možná já sám budu poslední, kdo si pamatuje, jak se správně ořezává brk. To je zvláštní tíha, nést v sobě konec něčeho."`,
          text_en: `"The craft I know is dying with me. No young man learns to copy as I once learned. When I die, I may well be the last who remembers how properly to trim a quill. It is a strange weight, to carry within oneself the end of a thing."` },

        { id: 't21', minRelation: 50,
          title: 'Proč někteří přešli k tiskařům', title_en: 'Why some went over to the printers',
          text: `"Chudoba, chlapče, ne zrada srdce. Mnozí z mých bratří skončili jako sazeči, protože hlad je silnější než přesvědčení. Přizpůsobili se fyzicky. Jestli se přizpůsobili i uvnitř, na to jsem se nikdy neodvážil zeptat."`,
          text_en: `"Poverty, lad, not treachery of the heart. Many of my brothers ended as compositors of type, for hunger is stronger than conviction. They bent in body. Whether they bent within as well, I never dared to ask."` },

        { id: 't22', minRelation: 50,
          title: 'Kdo dnes čte knihy', title_en: 'Who reads books now',
          text: `"Levnější knihy znamenají víc čtenářů, i takových, co by si dřív nemohli dovolit ani jedinou stránku. To je čestně řečeno dobrá věc. Jen mě mrzí, že spolu s tím mizí úcta k tomu, co čtou."`,
          text_en: `"Cheaper books mean more readers, even such as could not once afford a single page. That is, in honesty, a good thing. I am only grieved that, along with it, reverence for what is read seems to fade away."` },

        { id: 't23', minRelation: 50,
          title: 'Psaní pro Boha vs. pro zisk', title_en: 'Writing for God versus writing for profit',
          text: `"Když jsem opisoval žaltář, dělal jsem to pro Boha, ne pro peníze — i když jsem peníze taky potřeboval, nejsem hlupák. Ale úmysl v srdci mění tah pera. Tvůj lis nemá srdce, natož úmysl."`,
          text_en: `"When I copied a psalter, I did it for God, not for coin — though I needed coin as well, I am no fool. But the intent in one's heart changes the very stroke of the pen. Thy press hath no heart, still less an intent."` },

        { id: 't24', minRelation: 50,
          title: 'Co pro něj znamená "Opus Dei"', title_en: 'What "Opus Dei" means to him',
          text: `"Opus Dei, správně vzato, je modlitba hodinek, ne moje opisování — to vím dobře, nejsem neuk. Ale sám pro sebe jsem si to slovo vypůjčil. Psaní se pro mě stalo mým vlastním Božím dílem. Možná neprávem. Ale upřímně."`,
          text_en: `"Opus Dei, rightly taken, is the prayer of the hours, not my copying — that much I know well, I am no ignoramus. But for myself, I have borrowed the word. Writing became, for me, my own work of God. Wrongly, perhaps. But in earnest."` },

        // ── PÁSMO E (vztah 65) — zranitelnost ─────────────────────────────────
        { id: 't25', minRelation: 65,
          title: 'Zhoršující se zrak', title_en: 'His failing eyesight',
          text: `"Oči už nejsou, co bývaly, chlapče. Léta skloněná nad stránkou při svíčce si vyberou svou daň — mnoho písařů oslepne dřív, než zestárnou. Čtu teď pomaleji, s bolestí. To ti neříkám rád. Ale říkám ti to."`,
          text_en: `"The eyes are not what they were, lad. Years bent over the page by candlelight take their toll — many a scribe goes blind before he grows old. I read more slowly now, and with pain. I tell thee this unwillingly. But I tell thee."` },

        { id: 't26', minRelation: 65,
          title: 'Lítost nad bratřími, co odešli', title_en: 'Grief for the brothers who left',
          text: `"Znal jsem tři, co odešli k lisu. Jeden zemřel bohatý, dva v bídě. Nikdy jsem s žádným z nich už nepromluvil, hrdost mi to nedovolila. Teď je pozdě. To je má vlastní vina, ne jejich, a nesu ji potichu."`,
          text_en: `"I knew three who went over to the press. One died rich, two in poverty. I never spoke with any of them again — pride would not allow it. Now it is too late. That is my own fault, not theirs, and I bear it quietly."` },

        { id: 't27', minRelation: 65,
          title: 'Strach ze zapomnění', title_en: 'Fear of being forgotten',
          text: `"Bojím se, chlapče, že až zemřu, nezbude po mně nic než pár knih, co ani nebudou nést mé jméno — písaři se nepodepisují, to by byla pýcha. Kdo si mě bude pamatovat? Možná ty. To je víc, než jsem čekal."`,
          text_en: `"I fear, lad, that when I die, nothing shall remain of me but a few books that will not even bear my name — scribes do not sign their work, that would be pride. Who shall remember me? Perhaps thou. That is more than I expected."` },

        { id: 't28', minRelation: 65,
          title: 'Co dělá v noci, když nemůže spát', title_en: 'What he does at night when he cannot sleep',
          text: `"Chodím do skriptoria a dotýkám se hřbetů knih po tmě, po paměti, bez svíčky, abych šetřil oči. Poznám je po hmatu, jako staré přátele. To ti nikdo jiný neřekne, ani ty ho o tom nežádej."`,
          text_en: `"I go to the scriptorium and touch the spines of the books in the dark, by memory, without a candle, to spare my eyes. I know them by touch, as one knows old friends. No one else shall tell thee this — nor shalt thou ask it of any other."` },

        // ── PÁSMO F (vztah 80) — nejhlubší ────────────────────────────────────
        { id: 't29', minRelation: 80,
          title: 'Proč vlastně zůstal v klášteře', title_en: 'Why he truly stayed in the monastery',
          text: `"Mohl jsem odejít, chlapče, jako ti druzí. Nezůstal jsem z povinnosti ani ze strachu. Zůstal jsem, protože jsem tu jednou, dávno, něco slíbil — komu a co, to ti povím, až budu vědět, že to uneseš."`,
          text_en: `"I could have left, lad, as those others did. I stayed not from duty, nor from fear. I stayed because, once, long ago, I made a promise here — to whom, and what, I shall tell thee when I know thou canst bear it."` },

        { id: 't30', minRelation: 80,
          title: 'Co si o tobě myslí teď', title_en: 'What he thinks of thee now',
          text: `"Přišel jsi ke mně jako tiskař, co si myslí, že lis nahradí duši. Teď vidím něco jiného — vytrvalost, a snad i úctu k tomu, co pomíjí. Nejsi jako oni, chlapče. Nevím, jestli jsi to už věděl. Já jsem si tím dlouho nebyl jistý."`,
          text_en: `"Thou camest to me as a printer who believed the press could replace the soul. Now I see something else — perseverance, and perhaps even reverence for that which passes away. Thou art not like the others, lad. I know not if thou knewest that already. I myself was long uncertain of it."` }
    ],

    state: {
        visited: false,
        totalTrades: 0,
        lastTrade: 0,
        lastTopicAt: 0,
        askedTopics: []
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
            lastTrade: 0,
            lastTopicAt: 0,
            askedTopics: [],
            aiQuota: { count: 0, resetAt: 0 },
            loyaltyShown: false,
            bartolomejSecretShown: false
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
        
        // Migrace: book_faust_secret omylem odemčená starým loopem (unlockDay 0)
        // Odebrat, pokud hráč nezískal achievement faust_pact poctivě.
        const faustIdx = GameState.library.unlockedBooks.indexOf('book_faust_secret');
        if (faustIdx !== -1 &&
            !(GameState.achievements && GameState.achievements.unlocked &&
              GameState.achievements.unlocked.includes('faust_pact'))) {
            GameState.library.unlockedBooks.splice(faustIdx, 1);
        }
        
        let newUnlocks = 0;
        LibraryDB.books.forEach(book => {
            if (book.unlockDay > 0 &&
                book.unlockDay <= daysPassed && 
                !GameState.library.unlockedBooks.includes(book.id)) {
                GameState.library.unlockedBooks.push(book.id);
                newUnlocks++;
            }
        });
        
        if (newUnlocks > 0 && !GameState.flags.firstVisit) {
            UI.notifyPanel(t('library_lore.new_book').replace('{count}', newUnlocks), 'system');
        }
    },
    
    // Přečtení knihy
    // Veřejný vstupní bod — kliknutí na "Číst". Pokud je aktivní eye_strain
    // (monastery-decay-mrd), čtení netrvá okamžitě, ale spustí 6h odpočet
    // (GameState.library.readingTimer), po jehož vypršení teprve proběhne
    // skutečné čtení (_doReadBook). Běží na pozadí jako timed scavenge akce —
    // timestamp-based, přežije zavření/reload. Zatímco timer běží, žádnou
    // jinou knihu nelze začít číst (viz UI.renderLibrary gate).
    readBook: function(bookId) {
        const book = LibraryDB.books.find(b => b.id === bookId);
        if (!book) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        const hasEyeStrain = (typeof HealthSystem !== 'undefined') && HealthSystem.isActive('eye_strain');
        const timer = GameState.library.readingTimer;

        if (timer) {
            if (timer.bookId !== bookId) {
                // Jiná kniha, zatímco odpočet běží — odmítnout, ostatní jsou zamčené
                UI.notify(lang==='en' ? 'Eyes too strained — finish the current book first.' : 'Oči jsou přepracované — nejprve dočti rozečtenou knihu.', true);
                return;
            }
            if (Date.now() < timer.endTime) {
                // Stejná kniha, odpočet ještě neskončil
                return;
            }
            // Odpočet vypršel — vyzvednutí, skutečné přečtení proběhne níže
            GameState.library.readingTimer = null;
            LibraryHelpers._doReadBook(bookId, book, lang);
            return;
        }

        if (hasEyeStrain && !GameState.library.readBooks.includes(bookId)) {
            // Beryllus/Oculi (knihovna-upgrade-tiers) — optická dvojice zmírňuje
            // 6h odpočet eye_strain. Oculi ho obejdou úplně, ale sklo je křehké
            // (3% šance zániku při každém použití). Beryllus jen zkrátí na 3h,
            // bez rizika — kámen se nerozbije.
            const hasOculi = (GameState.inventory['oculi'] || 0) > 0;
            const hasBeryllus = (GameState.inventory['beryllus'] || 0) > 0;

            if (hasOculi) {
                if (Math.random() < 0.03) {
                    Game.removeItem('oculi', 1);
                    const brokeMsg = Math.random() < 0.5
                        ? (lang==='en' ? 'Your spectacles slipped and shattered on the flagstones.' : 'Brýle ti sklouzly a praskly o dlažbu.')
                        : (lang==='en' ? 'Your spectacles have wandered off somewhere — perhaps a crow took them.' : 'Brýle se ti někde zatoulaly — možná je má vrána.');
                    UI.notifyPanel('👓💥 ' + brokeMsg, 'warning');
                    Game.addKronikaEntry('minor', '👓 Brýle při čtení přišly vniveč.', '👓 The spectacles were lost while reading.', '👓 Oculi lecturae perierunt.');
                }
                LibraryHelpers._doReadBook(bookId, book, lang);
                return;
            }

            // Spustit odpočet místo okamžitého čtení (jen pro NEpřečtené —
            // opakované čtení už přečtené knihy eye_strain neomezuje)
            const restMs = hasBeryllus ? 3 * 3600000 : 6 * 3600000;
            GameState.library.readingTimer = { bookId, startTime: Date.now(), endTime: Date.now() + restMs };
            Game.save();
            UI.notify(hasBeryllus
                ? (lang==='en' ? '🥴 Eyes too strained to read quickly — the beryllus helps: 3 hours needed.' : '🥴 Oči jsou přepracované, beryllus čtení zkrátí — 3 hodiny.')
                : (lang==='en' ? '🥴 Eyes too strained to read quickly — 6 hours needed.' : '🥴 Oči jsou přepracované, čtení potrvá — 6 hodin.'), true);
            if (typeof UI.renderLibrary === 'function') UI.renderLibrary();
            return;
        }

        LibraryHelpers._doReadBook(bookId, book, lang);
    },

    // Skutečné provedení čtení — původní obsah readBook(), beze změny.
    _doReadBook: function(bookId, book, lang) {
        if (!GameState.library.readBooks.includes(bookId)) {
            GameState.library.readBooks.push(bookId);
        }

        // unlocksTech: odemkni technologie při prvním přečtení
        if (book.unlocksTech && Array.isArray(book.unlocksTech)) {
            book.unlocksTech.forEach(techId => {
                if (!GameState.researchedTechs.includes(techId)) {
                    GameState.researchedTechs.push(techId);
                    const techObj = typeof TechTree !== 'undefined' ? TechTree.find(x => x.id === techId) : null;
                    const techName = techObj ? (lang === 'en' ? (techObj.name_en || techObj.name) : techObj.name) : techId;
                    NotificationSystem.panel('📚 ' + (lang === 'en' ? 'Discovered: ' : 'Poznáno: ') + techName, 'system');
                    Game.addKronikaEntry('important',
                        '📚 Studiem knihy poznáno: ' + techName,
                        '📚 Discovered through study: ' + techName,
                        '📚 Per librum cognitum: ' + techName
                    );
                }
            });
            // Recepty odemčené novým techem ať se objeví hned, ne až po dalším loadu
            if (typeof Game !== 'undefined' && Game.syncTechUnlocks) Game.syncTechUnlocks();
            // Re-render aktivního garden tabu pokud je Vinohrad otevřen
            if (typeof GardenSystem !== 'undefined' && GardenSystem._activeTab === 'vinohrad') {
                GardenSystem.renderVinohrad();
            }
        }
        
        // Show modal with book content
        UI.showBookModal(book);
        
        Game.save();
        
        // Check Easter egg achievements
        LibraryHelpers.checkEasterEggs();

        // Scrinium: zkus odemknout Scrinium + označ folio jako nalezené
        if (typeof SecretsSystem !== 'undefined') {
            SecretsSystem.checkForbiddenUnlock();
            SecretsSystem.checkFolioDiscovery(bookId);
        }

        // Refresh library UI to update button text
        if (typeof UI.renderLibrary === 'function') {
            UI.renderLibrary();
        }
    },

    // Odemknutí knihy výzkumem (dříve než unlockDay)
    unlockBookByResearch: function(bookId) {
        const book = LibraryDB.books.find(b => b.id === bookId);
        if (!book || !book.unlockResearch) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Zkontroluj research
        const hasResearch = (GameState.inventory.research || 0) >= book.unlockResearch;
        if (!hasResearch) {
            UI.notify((lang === 'en'
                ? 'Not enough research points. Need: '
                : 'Nedostatek výzkumných bodů. Potřeba: ') + book.unlockResearch + ' ⚗️', true);
            return;
        }

        // Odečti research a odemkni
        Game.removeItem('research', book.unlockResearch);
        if (!GameState.library.unlockedBooks.includes(bookId)) {
            GameState.library.unlockedBooks.push(bookId);
        }
        Game.save();
        NotificationSystem.panel('📚 ' + (lang === 'en' ? 'Book unlocked: ' : 'Kniha odemčena: ') + book.title, 'system');
        if (typeof UI.renderLibrary === 'function') UI.renderLibrary();
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
                    UI.notifyPanel(t('library_lore.easter_eggs.notify_found').replace('{name}', eggName || egg.name), 'system');
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

            // NOVÉ: vztah s Bartolomějem (Persona/Influentia) — +4 hlavní, +1 do scholars osy
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                PersonaSystem.addInfluence('bartolomej', 4);
                PersonaSystem.addInfluence('scholars', 1);
            }
            
            // Trik pro získání názvu knihy rovnou ze slovníku
            const currentLang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
            const dict = currentLang === 'en' ? STRINGS_en : STRINGS_cs;
            
            // Robustní fallback: STRINGS_en → book._en pole → STRINGS_cs → LibraryDB
            const bookTitle = dict.library_lore?.books?.[randomBook.id]?.title || 
                             (currentLang === 'en' && randomBook.title_en) ||
                             STRINGS_cs.library_lore?.books?.[randomBook.id]?.title || 
                             randomBook.title;
            
            UI.notifyPanel(`${t('library_lore.npc_scribe.notify_book')} "${bookTitle}"`, 'system');

            // NOVÉ: reakce písaře po obchodu (dosud nevyužitý dialog)
            const _loyaltyReady = GameState.library.scribeState.totalTrades >= 5
                && !GameState.library.scribeState.loyaltyShown;
            NotificationSystem.modal({
                icon: '🖋️',
                title: ScribeNPC.name,
                text: (currentLang === 'en' && ScribeNPC.dialogues.after_trade.text_en
                        ? ScribeNPC.dialogues.after_trade.text_en
                        : ScribeNPC.dialogues.after_trade.text).replace(/\n/g, '<br>'),
                choices: [{
                    label: (currentLang === 'en' && ScribeNPC.dialogues.after_trade.options_en
                        ? ScribeNPC.dialogues.after_trade.options_en[0]
                        : ScribeNPC.dialogues.after_trade.options[0]),
                    type: 'primary',
                    effect: _loyaltyReady ? function() { LibraryHelpers._showBartolomejLoyalty(); } : function() {}
                }]
            });
        } else {
            UI.notify(t('library_lore.npc_scribe.notify_empty'));
        }
        
        Game.save();
        if (typeof UI.renderLibrary === 'function') {
            UI.renderLibrary();
        } else {
            UI.renderAll();
        }
    },

    // NPC Písař - výběr konkrétní knihy (odemčeno vztahem ≥25, MRD krok 3, cena 10x papír)
    scribeTradeChoice: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const rel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.bartolomej) || 0;
        if (rel < 25) {
            UI.notify(lang === 'en' ? 'The scribe does not yet trust thee enough.' : 'Písař ti ještě natolik nedůvěřuje.', true);
            return;
        }
        const CHOICE_COST = 10;
        if ((GameState.inventory.paper || 0) < CHOICE_COST) {
            UI.notify(t('library_lore.npc_scribe.err_paper'), true);
            return;
        }
        const locked = LibraryDB.books.filter(b =>
            !GameState.library.unlockedBooks.includes(b.id) &&
            b.unlockDay > 0
        );
        if (locked.length === 0) {
            UI.notify(t('library_lore.npc_scribe.notify_empty'));
            return;
        }
        const dict = lang === 'en' ? STRINGS_en : STRINGS_cs;
        const bookChoices = locked.map(book => {
            const bookTitle = dict.library_lore?.books?.[book.id]?.title ||
                             (lang === 'en' && book.title_en) ||
                             STRINGS_cs.library_lore?.books?.[book.id]?.title ||
                             book.title;
            return {
                label: bookTitle,
                type: 'default',
                effect: function() {
                    Game.removeItem('paper', CHOICE_COST);
                    GameState.library.unlockedBooks.push(book.id);
                    GameState.library.scribeState.totalTrades++;
                    GameState.library.scribeState.lastTrade = Date.now();
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                        PersonaSystem.addInfluence('bartolomej', 4);
                        PersonaSystem.addInfluence('scholars', 1);
                    }
                    UI.notifyPanel(`${t('library_lore.npc_scribe.notify_book')} "${bookTitle}"`, 'system');
                    Game.save();
                    if (typeof UI.renderLibrary === 'function') UI.renderLibrary(); else UI.renderAll();
                }
            };
        });
        bookChoices.push({
            label: lang === 'en' ? 'Never mind' : 'Nakonec ne',
            type: 'default',
            effect: function() {}
        });
        NotificationSystem.modal({
            icon: '🖋️',
            title: ScribeNPC.name,
            text: lang === 'en'
                ? '"This time... this time, choose for thyself. Thou hast earned it — bring me ten sheets of paper, and name the book thou desirest."'
                : '"Tentokrát... tentokrát si vyber sám. Zasloužil sis to — dones mi deset listů papíru a řekni, kterou knihu chceš."',
            choices: bookChoices
        });
    },

    // NPC Písař - návštěva/rozhovor (dosud nevyužitý first_visit + random_wisdom dialog)
    scribeVisit: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.library.scribeState.visited) {
            const fv = ScribeNPC.dialogues.first_visit;
            const useEn = lang === 'en' && fv.text_en;
            NotificationSystem.modal({
                icon: '🖋️',
                title: ScribeNPC.name,
                text: (useEn ? fv.text_en : fv.text).replace(/\n/g, '<br>'),
                choices: [
                    {
                        label: useEn ? fv.options_en[0] : fv.options[0],
                        type: 'primary',
                        effect: function() {
                            GameState.library.scribeState.visited = true;
                            Game.save();
                            LibraryHelpers._showRandomWisdom();
                        }
                    },
                    {
                        label: useEn ? fv.options_en[1] : fv.options[1],
                        type: 'default',
                        effect: function() {
                            GameState.library.scribeState.visited = true;
                            Game.save();
                        }
                    }
                ]
            });
        } else {
            LibraryHelpers._showRandomWisdom();
        }
    },

    // Pomocná: zobrazí náhodnou moudrost písaře
    _showRandomWisdom: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const useEn = lang === 'en' && ScribeNPC.dialogues.random_wisdom_en;
        const lines = useEn ? ScribeNPC.dialogues.random_wisdom_en : ScribeNPC.dialogues.random_wisdom;
        const idx = Math.floor(Math.random() * lines.length);
        NotificationSystem.modal({
            icon: '🖋️',
            title: ScribeNPC.name,
            text: lines[idx].replace(/\n/g, '<br>'),
            choices: [{ label: lang === 'en' ? 'Close' : 'Zavřít', type: 'default', effect: function() {} }]
        });
    },

    // NPC Písař - téma k rozhovoru (30 témat, denní limit 1×, checklist — MRD krok 4/5)
    scribeAskTopic: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const st = GameState.library.scribeState;
        if (!st.askedTopics) st.askedTopics = [];

        const DAY_MS = 24 * 3600000;
        if (st.lastTopicAt && (Date.now() - st.lastTopicAt) < DAY_MS) {
            UI.notify(lang === 'en' ? 'The scribe has said his piece for today. Return tomorrow.' : 'Písař dnes už řekl svoje. Vrať se zítra.', true);
            return;
        }

        const rel = (GameState.persona && GameState.persona.influence && GameState.persona.influence.bartolomej) || 0;
        const available = ScribeNPC.topics.filter(top =>
            rel >= top.minRelation && !st.askedTopics.includes(top.id)
        );

        if (available.length === 0) {
            const anyLeft = ScribeNPC.topics.some(top => !st.askedTopics.includes(top.id));
            UI.notify(anyLeft
                ? (lang === 'en' ? 'He has nothing more to say — thou must earn his trust further.' : 'Nemá teď co dodat — musíš si vysloužit víc jeho důvěry.')
                : (lang === 'en' ? "Thou hast heard all the scribe's tales." : 'Vyslechl jsi už všechny písařovy příběhy.'), true);
            return;
        }

        const topicChoices = available.map(top => ({
            label: lang === 'en' ? top.title_en : top.title,
            type: 'default',
            effect: function() {
                st.askedTopics.push(top.id);
                st.lastTopicAt = Date.now();
                if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                    PersonaSystem.addInfluence('bartolomej', 1);
                }
                Game.save();
                const isCapstoneTopic = (top.id === 't29' || top.id === 't30');
                const capstoneReady = isCapstoneTopic
                    && st.askedTopics.includes('t29') && st.askedTopics.includes('t30')
                    && !st.bartolomejSecretShown;
                NotificationSystem.modal({
                    icon: '🖋️',
                    title: ScribeNPC.name,
                    text: (lang === 'en' ? top.text_en : top.text).replace(/\n/g, '<br>'),
                    choices: [{
                        label: lang === 'en' ? 'Close' : 'Zavřít',
                        type: 'default',
                        effect: capstoneReady ? function() { LibraryHelpers._showBartolomejSecret(); } : function() {}
                    }]
                });
                if (typeof UI.renderLibrary === 'function') UI.renderLibrary();
            }
        }));

        NotificationSystem.modal({
            icon: '🖋️',
            title: ScribeNPC.name,
            text: lang === 'en' ? 'On what wouldst thou hear him speak?' : 'Na co se chceš zeptat?',
            choices: topicChoices
        });
    },

    // Uznání po 5. obchodu — jednorázové (MRD krok 5, totalTrades)
    _showBartolomejLoyalty: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        GameState.library.scribeState.loyaltyShown = true;
        Game.save();
        NotificationSystem.modal({
            icon: '🖋️',
            title: ScribeNPC.name,
            text: (lang === 'en'
                ? `*The scribe pauses mid-motion, setting down a book, and looks at thee longer than is his custom.*

"Five times now hast thou brought me thy paper, lad. Five times thou hast not complained of the price, five times thou hast waited till I finished speaking. Perhaps thou art no longer merely 'the printer' — perhaps thou art simply the one who comes. That means something, even to an old man such as I."`
                : `*Písař na okamžik přestane rovnat knihy a podívá se na tebe déle, než je jeho zvykem.*

"Popáté už jsi mi donesl svůj papír, chlapče. Popáté sis nestěžoval na cenu, popáté jsi počkal, až domluvím. Možná už nejsi jen 'ten tiskař' — možná jsi prostě ten, co chodí. To už něco znamená, i pro starého muže, jako jsem já."`
            ).replace(/\n/g, '<br>'),
            choices: [{ label: lang === 'en' ? 'Close' : 'Zavřít', type: 'default', effect: function() {} }]
        });
    },

    // Kapitola/capstone — jednorázové odemčení po zeptání se na témata 29 i 30 (MRD krok 4)
    _showBartolomejSecret: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        GameState.library.scribeState.bartolomejSecretShown = true;
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addMilestone) {
            PersonaSystem.addMilestone('bartolomej_secret',
                'Bartoloměj ti svěřil svoje celoživotní tajemství.',
                'Bartoloměj entrusted thee with his lifelong secret.');
        }
        Game.save();
        NotificationSystem.modal({
            icon: '🖋️',
            title: ScribeNPC.name,
            text: (lang === 'en' ? `*The old scribe catches thee by the sleeve, his voice trembling more than usual.*

"It was Brother Prokop, my master, who taught me to hold a quill. Upon his deathbed, forty years past, he made me swear I would finish his final work by hand — and never, so long as I lived, let it pass through any press. It was a foolish vow, an old man's promise to a dying elder. But I have kept it. That manuscript lies locked in the lower drawer to this day, unfinished, for I never dared complete it myself after his death.

Now thou knowest, lad, why thy press wounds me so. It is not the craft. It is a vow I made to a man who has not heard, these forty years, whether I keep it."`
            : `*Starý písař tě chytne za rukáv, hlas se mu chvěje víc než obvykle.*

"Byl to bratr Prokop, můj mistr, kdo mě naučil držet brk. Na smrtelné posteli, před čtyřiceti lety, mě přiměl přísahat, že dokončím jeho poslední dílo rukou — a že ho nikdy, dokud budu živ, nenechám projít žádným lisem. Byl to hloupý slib starého muže umírajícímu staršímu muži. Ale držel jsem ho. Ten rukopis leží dodnes zamčený ve spodní přihrádce, nedokončený, protože jsem se ho po jeho smrti nikdy neodvážil sám dopsat.

Teď víš, chlapče, proč mě tvůj lis tolik bolí. Nejde o řemeslo. Jde o slib, který jsem dal muži, co už čtyřicet let neslyší, jestli ho držím."`).replace(/\n/g, '<br>'),
            choices: [{ label: lang === 'en' ? 'I will keep thy secret, master.' : 'Zachovám tvé tajemství, mistře.', type: 'primary', effect: function() {} }]
        });
    },

    // NPC Písař - živý rozhovor (Claude Haiku 4.5 přes Vercel /api/bartolomej-chat)
    // Denní kvóta → po vyčerpání výkonová degradace na bezplatnou _showRandomWisdom() (viz MRD)
    scribeAIChat: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const st = GameState.library.scribeState;
        if (!st.aiQuota) st.aiQuota = { count: 0, resetAt: 0 };
        const quota = st.aiQuota;
        const DAY_MS = 24 * 3600000;
        const DAILY_LIMIT = 8;

        if (Date.now() - quota.resetAt > DAY_MS) {
            quota.count = 0;
            quota.resetAt = Date.now();
            Game.save();
        }

        if (quota.count >= DAILY_LIMIT) {
            // Výkonová degradace — žádná tvrdá zeď, jen strohost + bezplatná vrstva
            UI.notify(lang === 'en'
                ? 'Dost pro dnešek, chlapče, jazyk mi už jen tak mele...'
                : 'Dost pro dnešek, chlapče, jazyk mi už jen tak mele...');
            LibraryHelpers._showRandomWisdom();
            return;
        }

        const remaining = DAILY_LIMIT - quota.count;
        NotificationSystem.modal({
            icon: '🖋️',
            title: ScribeNPC.name,
            text: `
                <div style="margin-bottom:8px; font-size:0.85rem; opacity:0.8;">
                    ${lang === 'en' ? `Ask him anything (${remaining} left today):` : `Zeptej se na cokoliv (zbývá ${remaining} dnes):`}
                </div>
                <textarea id="bartolomej-chat-input" rows="2" maxlength="300"
                    style="width:100%; box-sizing:border-box; padding:8px; border-radius:4px; border:1px solid var(--border-color); background:rgba(0,0,0,0.15); color:inherit; font-family:inherit;"
                    placeholder="${lang === 'en' ? 'Type your question...' : 'Napiš svou otázku...'}"></textarea>
                <button class="craft-btn" style="margin-top:8px;" onclick="LibraryHelpers.scribeAISend()">
                    ${lang === 'en' ? '📨 Send' : '📨 Odeslat'}
                </button>
                <div id="bartolomej-chat-reply" style="margin-top:10px; font-style:italic; min-height:20px;"></div>
            `,
            choices: [{ label: lang === 'en' ? 'Close' : 'Zavřít', type: 'default', effect: function() {} }]
        });
    },

    // Odešle zprávu z #bartolomej-chat-input na backend a zobrazí odpověď v modalu
    // Pomocná: sesbírá pár konkrétních faktů o hráči pro Bartolomějův kontext.
    // Jen typovaná pole (žádnej syrovej text) — backend je stejně znovu validuje.
    _gatherAIContext: function() {
        const daysPlayed = GameState.library && GameState.library.startDate
            ? Math.floor((Date.now() - GameState.library.startDate) / 86400000)
            : null;
        return {
            rank: GameState.rank && GameState.rank.secular,
            daysPlayed: daysPlayed,
            religiousName: GameState.persona && GameState.persona.nameReligious,
            bartolomejRel: GameState.persona && GameState.persona.influence && GameState.persona.influence.bartolomej,
            booksRead: GameState.library && GameState.library.readBooks ? GameState.library.readBooks.length : null,
            hasReadRuralia: !!(GameState.library && GameState.library.readBooks && GameState.library.readBooks.includes('book_ruralia_apibus')),
            hasGrandHive: !!(GameState.apiary && GameState.apiary.some(function(h) { return h.grand; }))
        };
    },

    scribeAISend: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const input = document.getElementById('bartolomej-chat-input');
        const replyEl = document.getElementById('bartolomej-chat-reply');
        if (!input || !replyEl) return;
        const message = input.value.trim();
        if (!message) return;

        replyEl.textContent = lang === 'en' ? 'He ponders...' : 'Přemýšlí...';
        input.disabled = true;

        fetch('/api/bartolomej-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message.slice(0, 300), lang, context: LibraryHelpers._gatherAIContext() })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            replyEl.textContent = data && data.reply
                ? data.reply
                : (lang === 'en' ? 'He falls silent.' : 'Odmlčí se.');

            if (data && !data.filtered) {
                const st = GameState.library.scribeState;
                if (!st.aiQuota) st.aiQuota = { count: 0, resetAt: Date.now() };
                st.aiQuota.count++;
                if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                    PersonaSystem.addInfluence('bartolomej', 1);
                }
                Game.save();
            }
            input.disabled = false;
            input.value = '';
        })
        .catch(function() {
            replyEl.textContent = lang === 'en'
                ? 'He falls silent — something interrupted him.'
                : 'Odmlčí se — něco ho vyrušilo.';
            input.disabled = false;
        });
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