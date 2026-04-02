const FontSpecimensDB = {

    // Pro knihy – klíč = book id
    books: {
        'book_gutenberg_betrayal': {
            fontClass: 'font-fraktur',
            fontName: 'Textura Quadrata (Mohučský tisk, 1455)',
            sample: 'In principio erat Verbum · et Verbum erat apud Deum · et Deus erat Verbum',
            context: 'Tímto písmem sázel Gutenberg svou 42řádkovou Bibli. Každá litera byla ručně rytá v olovu. Fust toto písmo zdědil spolu s dílnou.'
        },
        'book_jenson_spy': {
            fontClass: 'font-antiqua',
            fontName: 'Venetian Antiqua (Nicolas Jenson, Benátky 1470)',
            sample: 'Ars sine scientia nihil est · Věda bez umění není nic',
            context: 'Jenson vytvořil písmo inspirované humanistickými rukopisy. Tak čitelné, že sloužilo jako vzor pro Times New Roman, Garamond i Century.'
        },
        'book_manutius': {
            fontClass: 'font-italic',
            fontName: 'Corsiva / Italika (Francesco Griffo pro Aldus Manutius, 1501)',
            sample: 'Festina lente · Spěchej pomalu · Virgilii opera omnia',
            context: 'Griffo navrhl kurzívu aby napodobil úsporný rukopis kancelářů. Manutius ji použil pro kapesní edice Vergilia – první „paperbacky" světa.'
        },
        'book_scribes_war': {
            fontClass: 'font-uncial',
            fontName: 'Unciála (Klášterní písmo, 4.–8. stol.)',
            sample: 'Nunc scripsi totum · pro Christo da mihi potum',
            context: 'Tímto písmem kopíroval sv. Kolumbán i jeho irští mniši. Věta nahoře je autentický výkřik středověkého písaře z 9. století: „Teď jsem dopsal vše – pro Krista dejte mi napít!"'
        },
        'book_de_arte_predicandi': {
            fontClass: 'font-fraktur',
            fontName: 'Rotunda / Gotická Rotunda (Mohučský prvotisk, 1465)',
            sample: 'Verbum Dei manet in aeternum · Slovo Boží trvá věčně',
            context: 'Méně hranatá než Textura – oblíbená v jižní Evropě. Prvotisky z Mohuče kombinovaly oba styly podle toho, kdo sázel.'
        },
        'book_kutnohorska_bible': {
            fontClass: 'font-fraktur',
            fontName: 'Česká Švabach (Kutnohorská tiskárna, 1489)',
            sample: 'Na počátku stvořil Bůh nebe i zemi · a země byla nesličná a prázdná',
            context: 'Švabach je zaoblenou verzí textury. Martin z Tišnova použil toto písmo pro první českou tištěnou Bibli. Dodnes se používá v německých pivních restauracích.'
        },
        'book_olomouc_misal': {
            fontClass: 'font-antiqua',
            fontName: 'Humanistická Minuskula (Olomoucká tiskárna, 1488)',
            sample: 'Kyrie eleison · Christe eleison · Pane smiluj se',
            context: 'Konrad Stahel a Mathias Preinlein přivezli do Olomouce humanistické písmo přímo z Benátek. Misál měl 420 výtisků – 20 na pergamenu pro katedrály.'
        },
    },

    // Pro tech tree – klíč = tech id
    techs: {
        'tech_illumination': {
            fontClass: 'font-uncial',
            fontName: 'Insular Majuskula (Irské kláštery, 7. stol.)',
            sample: 'Quoniam quidem multi conati sunt ordinare narrationem',
            context: 'Iluminátoři psali unciálou a zdobili iniciály zlatem a lazuritem. Pigmenty míchali s vaječným bílkem (tempera). Jeptiška s modrými zuby v Dalheimu olizovala štětec namočený v lapis lazuli.'
        },
        'tech_gallic_ink': {
            fontClass: 'font-antiqua',
            fontName: 'Karolinská Minuskula (9. stol., za Karla Velikého)',
            sample: 'Atramentum ex gallae vitrioloque confectum permanet in saecula',
            context: 'Železitoduběnkový inkoust (atramentum) je kyselý – po 80 letech prožírá pergamen. Proto dnes vidíme v rukopisech díry. Karel Veliký standardizoval toto písmo pro celou říši.'
        },
        'tech_printing_basics': {
            fontClass: 'font-fraktur',
            fontName: 'Textura Quadrata (Gutenbergův vzor, Mohuč 1450)',
            sample: 'Biblia Sacra Vulgata · Anno Domini MCDLV · Moguntiae impressa',
            context: 'Gutenberg záměrně kopíroval rukopisnou texturu aby tiskoviny vypadaly jako drahé ručně psané knihy. Kupci si měsíce nevšimli rozdílu.'
        },
        'tech_privilegium': {
            fontClass: 'font-italic',
            fontName: 'Aldine Italika (Standard humanistického tisku, po 1501)',
            sample: 'Jiří Melantrich z Aventina · Tiskař Jeho Milosti Císařské',
            context: 'Tiskařské privilegium znamenalo výhradní právo na tisk v regionu. Melantrich ho získal v roce 1552 a přesunul tiskárnu na Staré Město. Italika jako znak vzdělanosti a humanismu.'
        },
        'tech_vellum_mastery': {
            fontClass: 'font-uncial',
            fontName: 'Unciála na pergamenu (4.–9. stol.)',
            sample: 'Membrana ex ovium pellibus · pergamena · arte facta',
            context: 'Na pergamen se psalo jiným tlakem než na papír. Husí brk musel být přesně seříznutý. Písaři drželi brk v levé ruce a nožík (peciolus) v pravé – na okamžité škrabání chyb.'
        },
    }
};

// ================================================
// 1. LIBRARY DATABASE - Knihy z historických příběhů
// ================================================

const LibraryDB = {
    books: [
        // TIER 1 - První týden (day 1-7)
        {
            id: 'book_gutenberg_betrayal',
            title: 'Mohučská zrada: Krvavý úsvit tisku',
            category: 'history',
            unlockDay: 1,
            icon: '⚖️',
            author: 'Anonymní kronikář',
            year: 1455,
            content: `**Půjčka od lichváře a hořký konec**

Johannes Gutenberg byl bezesporu vizionář, který změnil běh dějin, ale byl to muž bez groše. Aby mohl svůj tajný projekt realizovat, půjčil si astronomickou částku 1600 zlatých od mohučského právníka a bohatého obchodníka Johanna Fusta. Jako zástavu použil to jediné, co měl – ručil vším: svou dílnou, inovativními lisy i tou svou slavnou dvaačtyřicetiřádkovou Biblí, kterou právě s nesmírným úsilím tiskl. 

**Helmaspergerův notářský zápis (6. listopadu 1455)**

Těsně předtím, než mohla být Bible dokončena a začít vydělávat, Fust tvrdě udeřil. Hnán vidinou zisku obvinil Gutenberga, že peníze „neprojedl v knihách", ale prý je zpronevěřil na jiné účely. Následný soud byl neúprosný a rozhodl ve prospěch Fusta. Gutenberg přišel ze dne na den o všechno – o své lisy, o pečlivě odlité kovové litery (typy) i o drahocenný papír.

**Kdo byl onen Jidáš tiskařského umění?**

Historie ukazuje prstem na Petera Schöffera! Byl to Gutenbergův nejtalentovanější tovaryš a původně zručný písař pocházející z Paříže. Právě on u soudu chladnokrevně svědčil proti svému vlastnímu mistrovi! Odměna na sebe nenechala dlouho čekat – Fust si bystrého Schöffera vzal za svého obchodního společníka a aby spojenectví zpečetil, dal mu později za ženu svou vlastní dceru Christinu. Gutenbergova celoživotní práce a dílna tak plynule přešla pod novou, dravou značku Fust & Schöffer. Brzy poté, v roce 1459, tato mocná dvojice vydala slavné dílo *Rationale Divinorum Officiorum*.

**Temná legenda o doktoru Faustovi**

Johann Fust byl jako obchodník neuvěřitelně úspěšný. Chrlil na trh takové množství knih a tiskl tak rychle zcela identické kopie, že si prostý lid začal šeptat temné zvěsti: ten muž musel upsat svou duši samotnému ďáblu. Odtud prý pramení děsivá legenda o Doktoru Faustovi (vzniklá ze zkomoleniny jmen Fust a Faust), kterou o staletí později proslavil německý básník Goethe. Zcela nová technologie tisku byla v očích tehdejšího negramotného lidu zkrátka čistá, černá magie!

*"Kdo zradí mistra, získá impérium, ale ztratí duši. V inkoustu je vždy přimíchána krev."* - Starý kronikářský spis`
        },
        {
            id: 'book_jenson_spy',
            title: 'Špion, který se nevrátil: Jensonovo tajemství',
            category: 'history',
            unlockDay: 3,
            icon: '🕵️',
            author: 'Královská kronika & Tajné archivy',
            year: 1458,
            content: `**Tajná mise do srdce Svaté říše římské (1458)**

Francouzský král Karel VII. zaslechl neuvěřitelné zvěsti o „zázraku v Mohuči". Zcela fascinován poslal v roce 1458 svého nejlepšího rytce mincí, Nicolase Jensona, na přísně tajnou špionážní misi do Německa. Králův rozkaz zněl jasně: *"Nauč se toto nové umění, zjisti, jak to dělají, a přines to tajemství domů, pro slávu Francie!"* 

**Zběhnutí mistra rytce**

Jenson do Mohuče skutečně dorazil a revoluční technologii tisku si do detailu osvojil. Zjistil však něco zásadního – tisk mu dával svobodu, kterou mu úzkostlivý královský dvůr nikdy nenabídne. Ke svému králi se už nikdy nevrátil! Po letech ticha se v roce 1470 triumfálně vynořil v Benátkách, svobodném obchodním srdci tehdejší Evropy. Zde založil svou vlastní prosperující tiskárnu a vytvořil písmo **Antiqua**. Jenson je dnes široce uznáván jako skutečný otec římského typu písma. 

**Zrození moderní typografie**

Jednou z prvních knih, kterou v Benátkách v roce 1470 vydal, bylo proslulé Eusebiovo dílo *De evangelica præparatione*. Jensonův návrh byl naprosto revoluční: písmo nebylo jen otrockou kopií starých rukopisných modelů, ale bylo založeno na zcela nových typografických principech. Plynulé tvary a decentní serify pomáhaly oku klouzat po stránce. Bylo to písmo tak nadčasové a dokonalé, že se principielně používá dodnes (dokonce i slavný font Times New Roman z něj myšlenkově přímo vychází).

**Benátský azyl**

V liberálních Benátkách byl Jenson rázem považován za naprostou hvězdu. Král v Paříži sice zuřil a spřádal plány na pomstu, ale nemohl s tím dělat vůbec nic. Hrdé italské městské státy si bedlivě chránily své umělce a špičkové řemeslníky před jakýmkoliv vnějším zásahem. Nicolas Jenson zemřel bohatý, uctívaný a do konce života oslavovaný. Jeho geniální písmo přežilo plných pět století.

*"Král posílá špeha v okovech povinnosti, ale krása umění ho osvobodí."* - Benátské přísloví`
        },
        {
            id: 'book_manutius',
            title: 'Smartphony renesance: Aldus Manutius',
            category: 'innovation',
            unlockDay: 5,
            icon: '📱',
            author: 'Benátský obchodní registr',
            year: 1501,
            content: `**Aldus Manutius - Steve Jobs své doby**

Tento benátský tiskař a humanista (1449–1515), který v roce 1494 založil proslulou tiskárnu Aldine Press, byl skutečným vizionářem, jenž navždy změnil konzumaci textu. Před ním byly knihy – takzvané inkunábule – obrovské, těžké a neforemné folianty, které musely ležet na masivním stole v knihovně. Manutius však vymyslel revoluční formát velikosti oktáva zvaný **enchiridion** (příručka). Šlo o malé knížky, přímé předchůdce dnešních moderních paperbacků, které se hravě vešly do kapsy u sedla či do záhybů pláště.

**Mobilita vědění a čistota textu**

Najednou mohli šlechtici a kupci číst i na dlouhých cestách! Studenti si mohli koupit Aristotela nebo Homéra za cenu běžné večeře. Knihy přes noc přestaly být kusem nedotknutelného nábytku a staly se z nich dostupní osobní průvodci každodenním životem. Manutius byl navíc posedlý přesností. Chtěl vydávat klasické řecké texty v jejich původní, čisté podobě, nezkreslené staletími špatných překladů. Kvůli tomu spolupracoval s předními učenci tehdejší doby, včetně slavného Erasma Rotterdamského. 

**Vynález kurzívy (Italiky)**

Aby se do malé a levné knížky vešlo co nejvíce textu a ušetřilo se za drahý papír, najal Manutius geniálního rytce Francesca Griffa. Ten vytvořil zcela nový typ písma, který napodoboval elegantní, ale úsporné nakloněné psaní renesančních úředníků a humanistů – **italiku** (kurzívu). Nebylo to původně určeno pro zvýrazňování textu, jak to děláme dnes, ale čistě pro ekonomickou úsporu papíru! Jejich vydání Vergiliova díla *Opera* z roku 1501 bylo vůbec první knihou na světě tištěnou tímto novým, úsporným písmem.

**Delfín a Kotva**

Jeho nezaměnitelným tiskařským znakem byl mrštný delfín (symbolizující rychlost a neustálou inovaci) omotaný kolem pevné kotvy (symbolizující stabilitu, spolehlivost a pečlivost). Jeho celoživotní motto znělo: **Festina Lente** (Spěchej pomalu). Manutius dokázal celému světu, že knihy nemusí být jen zamčené poklady v truhlách, ale aktivní nástroje v rukou lidí.

*"Malá kniha v ruce je mocnější než obrovská na stole. Svoboda myšlení leží v kapse."*`
        },
        {
            id: 'book_scribes_war',
            title: 'Válka písařů: Panna a Děvka',
            category: 'conflict',
            unlockDay: 7,
            icon: '⚔️',
            author: 'Filippo de Strata & Johannes Trithemius',
            year: 1473,
            content: `**"Pero je panna, tisk je děvka"**

Ne každý vítal vynález knihtisku s otevřenou náručí. Filippo de Strata, benátský mnich a profesionální písař, se stal radikálním hlasem odporu. Někdy v letech 1473 až 1474 sepsal zoufalou a ohnivou polemiku adresovanou tehdejšímu benátskému dóžeti Nicolò Marcellovi, ve které ho zapřísahal, aby z města nechal tiskařské lisy nadobro vyhnat. Ve svém textu mimo jiné nekompromisně hlásal: 

*"Pero je čistá panna, tisk je prodejná děvka! Tiskaři jsou pasáci, kteří zaplavují trh, tisknou milostnou poezii a mladé dívky pak čtou Ovidia jen proto, aby se učily hříchu a neřesti. Tito tiskaři guzzlí víno, opíjejí se v krčmách a za pár drobných prodávají posvátnost textu!"*

Bohaté město podle něj bylo sice přecpané knihami, ale zcela a nenávratně ztratilo svou duši.

**Trithemiův paradox (1492)**

Na druhé straně Evropy se do kulturního boje zapojil významný opat Johannes Trithemius. V roce 1492 sepsal dnes již legendární dílo **De Laude Scriptorum** (Chvála písařů). Ve spise plamenně přesvědčoval své mnichy, aby v žádném případě nepřestávali ručně kopírovat texty, s odůvodněním na nepopiratelnou kvalitu materiálu:

*"Tištěná kniha je pouze z křehkého papíru. Shoří, podlehne hmyzu nebo se nevyhnutelně rozpadne za 200 let. Naproti tomu naše pečlivá práce na pergamenu přetrvá věky a nese v sobě duchovní hodnotu."*

Krutou historickou ironií osudu a naprosto dokonalým paradoxem však zůstává, že právě Trithemius nechal tento svůj útočný spis proti knihtisku v roce 1494 **vytisknout** na lisu, protože si pragmaticky uvědomil, že jinak by se jeho naléhavé myšlenky nikdy nedostaly k masám!

**Konec zlaté éry kaligrafie**

Nová technologie byla nezastavitelná jako lavina. Mnozí hrdí písaři nakonec s hořkostí v srdci skončili v těch samých tiskárnách, které z hloubi duše nenáviděli, jako prachobyčejní sazeči nebo korektoři. Museli se ponižujícím způsobem "přeškolit". Jejich ušlechtilé řemeslo, které bez přerušení a větších změn trvalo tisíc let, bylo absolutně vyhlazeno za jedinou generaci.

Ale jejich nádherné, ručně iluminované rukopisy přežily. Dnes tiše leží v muzeích a trezorech jako vznešené památníky věku, kdy každé jednotlivé slovo vyžadovalo krev, pot a hodiny naprostého soustředění a bylo proto považováno za posvátné.

*"Rychlost zabíjí krásu detailu, ale pravda přežije v obou formách."* - Poslední klášterní písař`
        },

// TIER 2 - Druhý týden (day 8-14)
        {
            id: 'book_prague_mystery',
            title: 'Záhada pražského tiskaře: Zrození v utajení',
            category: 'local',
            unlockDay: 10,
            icon: '🔒',
            author: 'Pražský archiv & Městské legendy',
            year: 1487,
            content: `**První vlaštovka nad Vltavou**

[cite_start]Zatímco v Plzni tiskařské lisy klapaly již od roku 1468 (nebo snad 1476, učenci a historici se o přesný datový údaj **Kroniky trojánské** dodnes do krve hádají)[cite: 34], v samotném srdci království, v Praze, bylo neuvěřitelně dlouho ticho. Zdejší prostředí bylo konzervativní a nebezpečné. [cite_start]Až v roce **1487** se v Praze zničehonic objevuje první tištěná kniha – **Statuta synodalia Arnesti** a nedlouho po ní proslulý **Žaltář**[cite: 35]. 

Ale kdo tuto technologickou revoluci do Prahy přinesl? [cite_start]Nikdo neví! [cite: 36] Jméno mistra bylo pečlivě vymazáno z dějin.

**Anonymní mistr a strach z cechu**

[cite_start]V historiografii se mu říká prostě *"Tiskář Pražské bible"*, podle jeho pozdějšího monumentálního díla z roku 1488. [cite: 36] [cite_start]Proč tajil svou identitu? [cite: 36] Praha konce 15. století byla městem cechů. [cite_start]Silný a radikální cech pražských písařů a iluminátorů by jakoukoliv mechanickou konkurenci vnímal jako existenční hrozbu. [cite: 37] Zapálit dílnu plnou vysoce hořlavého papíru a lněného oleje pod rouškou noci bylo snadné řešení obchodního sporu. [cite_start]Nebo to snad byl utajený cizinec, kacíř na útěku, který se bál inkvizice, jen Prahou projížděl, splnil zakázku a zmizel zpět do stínů? [cite: 38]

**Nádhera utkaná z temnoty**

Jeho dílo přitom nenese žádné znaky amatérismu. [cite_start]Jeho Žaltář je mistrovským kouskem – nádherně ostře řezané gotické písmo (bastarda), propracované dřevořezy a precizně tištěná červená iniciála, což tehdy vyžadovalo neuvěřitelně náročný dvojitý průjezd lisem. [cite: 39] [cite_start]Pražský tisk tak nezačal pomalým učením, ale okamžitou genialitou zabalenou do tajemství. [cite: 40]

*"V uličkách Starého Města se rodí příběhy, které nikdo nedopíše, protože inkoust občas nahrazuje krev a mlčení je cennější než zlato."* - Staroměstský kronikář`
        },
        {
            id: 'book_severin_dynasty',
            title: 'Severinská dynastie: Tiskař na radnici',
            category: 'local',
            unlockDay: 12,
            icon: '👑',
            author: 'Archiv Starého Města pražského',
            year: 1520,
            content: `**Pavel Severýn z Kapí Hory (1520–1557)**

Tohle nebyl jen obyčejný řemeslník se zástěrou ušpiněnou od sazí. Pavel Severýn byl muž, který dokázal dokonale propojit vůni tiskařské černě s vůní politické moci. [cite_start]Začal tisknout kolem roku **1520** na Starém Městě pražském. [cite: 42] Rychle pochopil, že tisk není jen o knihách, ale o vlivu. [cite_start]Z tiskaře se stal vážený a neobyčejně bohatý měšťan. [cite: 42]

**Purkmistr s lisem v zádech**

[cite_start]Jeho vliv rostl tak strmě, že v bouřlivých letech **1534–1537** byl zvolen samotným **purkmistrem (starostou) Starého Města**! [cite: 43] [cite_start]Představte si tu moc – muž, který rozhodoval o zákonech a daních v nejbohatším městě království, měl zároveň pod kontrolou stroje, které formovaly veřejné mínění. [cite: 43] Právě pod jeho rukama vyšla slavná a nádherně ilustrovaná *Severýnská bible* (1529 a 1537), na které spolupracoval s nejlepšími pražskými dřevorytci. [cite_start]Ukázalo se, že tiskové řemeslo už není jen okrajová kuriozita, ale absolutní politická a společenská síla. [cite: 44]

**Záhada roku 1557**

[cite_start]Vytvořil obrovský a skvěle fungující rodinný podnik, do kterého zapojil i svého šikovného zetě, Jana Kosořského z Kosoře, jenž po něm dílnu převzal. [cite: 45] [cite_start]Éra Severýnů chrlila desítky luxusních českých i latinských děl a pyšnila se těmi nejlepšími kontakty u dvora i mezi kališnickou šlechtou. [cite: 46] 

[cite_start]Ale pak, kolem roku **1557**, se po této mocné dynastii doslova slehla zem. [cite: 45] Úplně zmizeli z dobových záznamů. Zabil je mor, který město pravidelně pustošil? Doplatili na tajné dluhy? [cite_start]Nebo snad padli v nemilost tvrdé protireformační cenzury Habsburků? [cite: 45] [cite_start]Pravda zůstává pohřbena v archivech. [cite: 45]

*"Kdo ovládá tisk, ovládá myšlení lidu. A kdo ovládá lid, vládne městu. Ale ani ten nejlepší tiskař nevytiskne smlouvu, která by přelstila samotnou smrt."* - Zápis z městské rady`
        },
        {
            id: 'book_melantrich',
            title: 'Dravec z Prahy: Impérium Jiřího Melantricha',
            category: 'local',
            unlockDay: 14,
            icon: '🦅',
            author: 'Královská komora a Cechovní spisy',
            year: 1552,
            content: `**Nástup nekompromisního dravce**

Jiří Melantrich z Aventina nebyl člověk, který by čekal, až mu štěstí spadne do klína. Byl to ambiciózní, tvrdý a brilantní renesanční kapitalista. [cite_start]Na zkušenou přišel do učení ke starému, tehdy nesmírně bohatému Bartoloměji Netolickému, který se pyšnil výnosným titulem dvorního tiskaře krále Ferdinanda I. a měl lukrativní monopol na tisk zákonů. [cite: 48] 

**Převzetí moci a budování impéria**

Melantrich byl bystrý a okouzlující stratég. [cite_start]Nejdříve se nenápadně vypracoval z učně na Netolického **společníka**. [cite: 49] [cite_start]Jakmile získal know-how a kontakty, v roce **1552** od stárnoucího mistra celou tiskárnu chladnokrevně **koupil** (historici se dodnes přou, nakolik šlo o férový obchod a nakolik o agresivní, nepřátelské převzetí takzvaně "pod cenou"). [cite: 49] [cite_start]Okamžitě dílnu přesunul z odlehlé Malé Strany přímo do tepajícího obchodního srdce na Staré Město a začal z ní budovat nezastavitelné **impérium**. [cite: 50]

**Melantrichova Bible: Stroj na peníze**

[cite_start]Jeho mistrovským strategickým a komerčním kusem se stala slavná *Melantrichova Bible* (vydána postupně pětkrát!). [cite: 51] Byla jazykově i vizuálně tak dokonalá, že ji kupovali katolíci i protestanti. [cite_start]Melantrich byl mistr obojakosti – prodával všem stranám náboženského konfliktu a vydělal na tom naprosté jmění. [cite: 51] [cite_start]Z obrovských zisků si koupil majestátní měšťanský palác **U Dvou velbloudů** (v místech dnešní Melantrichovy ulice, která dodnes nese jeho jméno). [cite: 51]

**Z ušmudlaného učně šlechticem**

[cite_start]Aby svou dominanci a společenský vzestup definitivně stvrdil, nechal si za své politické a tiskařské služby udělit prestižní šlechtický erb a majestátní přídomek **"z Aventina"** (podle římského pahorku). [cite: 52] To už nebyl řemeslník, to byl renesanční magnát. [cite_start]Když zemřel, jeho veleúspěšnou firmu plynule převzal jeho neméně schopný zeť Daniel Adam z Veleslavína, čímž vznikla dynastie, která kulturně ovládala české země po dlouhá desetiletí. [cite: 53]

*"V obchodu, stejně jako v tisku, není nikdy místo pro slabé a nerozhodné. Pouze dravci přežijí a napíší pravidla, podle kterých budou hrát ti ostatní."* - Připisováno Jiřímu Melantrichovi`
        },


// TIER 4 - Čtvrtý týden (day 22-28)
        {
            id: 'book_rudolf_alchemists',
            title: 'Město bláznů a géniů: Rudolf II. a 300 alchymistů',
            category: 'local',
            unlockDay: 22,
            icon: '🔮',
            author: 'Tajná dvorská kronika',
            year: 1583,
            content: `**Praha jako okultní pupek světa**

[cite_start]Píše se rok 1583 a císař Svaté říše římské, excentrický a melancholický Rudolf II., dělá šokující rozhodnutí. [cite: 69] [cite_start]Přesouvá celý císařský dvůr z Vídně do Prahy. [cite: 70] Město se přes noc mění. [cite_start]Rudolf, posedlý hermetismem, hvězdami a okultismem, shromáždil na svém dvoře neuvěřitelných **300 alchymistů, mágů a šarlatánů** z celé Evropy. [cite: 70] [cite_start]Byli mezi nimi i legendární Angličané – učenec John Dee, který rozmlouval s anděly, a jeho podivný společník Edward Kelley, mistr iluzí. [cite: 70]

**Tajemství Zlaté uličky**

[cite_start]Legenda praví, že malé, stísněné domky přilepené k hradbám těsně pod Pražským hradem (Zlatá ulička) sloužily jako tajné laboratoře těchto mistrů. [cite: 71] Nad ohništěmi dnem i nocí bublaly křivule a tyglíky. [cite_start]Všichni hledali *Lapis Philosophorum* – legendární kámen mudrců, elixír věčného mládí a substanci, která by dokázala proměňovat obyčejné kovy v ryzí zlato. [cite: 71] 

[cite_start]Zlato pro císaře nikdy nenašli... [cite: 72] Ale při svých fanatických pokusech mimoděk položili základy moderní vědy. Zcela náhodou objevili:
- [cite_start]Výrobu kyseliny sírové (vitriol). [cite: 72]
- [cite_start]Elementární fosfor, zářící ve tmě. [cite: 72]
- [cite_start]Izolaci zinku a dalších sloučenin. [cite: 72]

**Smrt mezi hvězdami**

[cite_start]V této esoterické atmosféře žil a bádal v Praze i slavný dánský astronom Tycho Brahe. [cite: 73] Jeho přesná měření hvězd bez dalekohledu dodnes udivují. Zemřel tu roku 1601 – podle dobových klepů prý při hostině, kdy z dvorské etikety nemohl vstát od stolu a praskl mu močový měchýř. [cite_start]Moderní analýza jeho vousů však odhalila děsivější pravdu: **otravu rtutí**, pravděpodobně z jeho vlastních alchymistických elixírů, které užíval na nemocné ledviny. [cite: 73]

[cite_start]V Rudolfově Praze se stírala hranice mezi magií a rodící se moderní vědou. [cite: 74] [cite_start]Byla to doba šílená, nebezpečná, ale neuvěřitelně plodná. [cite: 74]

*"V mlze nad Vltavou je hranice mezi snem a skutečností tenká jako pergamen. Hledali jsme zlato, ale našli jsme samotné složení hvězd."* - John Dee ve svých denících`
        },
        {
            id: 'book_czech_glass',
            title: 'Křehká válka: České sklářství vs. Benátky',
            category: 'local',
            unlockDay: 25,
            icon: '💎',
            author: 'Tajný mistr Sklářského cechu',
            year: '13.-18. století',
            content: `**Tajemství lesního křišťálu**

Málokdo tuší, že zatímco Evropa krvácela ve válkách o území, probíhala paralelně ještě jedna, mnohem tišší, ale o to lukrativnější válka – válka o světlo. [cite_start]České lesní sklářství zažívalo boom už od **13. století** a patřilo k tomu absolutně nejlepšímu v celé Evropě. [cite: 76, 77] Hutě skryté hluboko v pohraničních hvozdech (Šumava, Jizerské hory) měly nevyčerpatelný zdroj dřeva pro pece a kvalitní potaš z popela, což dávalo českému sklu typickou čistotu a tvrdost. 

**Krvavé diamanty českých králů**

České sklo a drahokamy byly strategickým bohatstvím. [cite_start]Například temně rudý český granát (pyrop) z Podsedicka byl u dvorů tak extrémně ceněný a vyhledávaný, že císař Rudolf II. zcela zakázal jeho vývoz ze země **pod přísným trestem smrti**. [cite: 77, 78] [cite_start]Později, v 18. století, se Jablonecký broušený křišťál a bižuterie staly takovou komoditou, že v některých částech světa (např. v afrických koloniích) se těmito skleněnými perlami **platilo místo peněz**! [cite: 78] [cite_start]Byl to exportní artikl číslo jedna, který živil celé generace horalů. [cite: 79]

**Benátská žárlivost a průmyslová špionáž**

Hlavním rivalem nám byly hrdé Benátky. [cite_start]Benátčané měli po dlouhá staletí absolutní **monopol** na výrobu luxusních zrcadel a jemného skla. [cite: 80] Byli na něj tak hákliví, že všechny své sklářské mistry pod hrozbou drakonických trestů internovali na izolovaném ostrově **Murano**. [cite_start]Šlo o nucenou zlatou klec – a de facto první organizovanou technologickou karanténu na světě. [cite: 80] Kdo by se opovážil z ostrova s tajemstvím uprchnout, na toho úřady vyslaly nájemné vrahy. [cite_start]Byl automaticky prohlášen za zrádce republiky. [cite: 81]

Navzdory zabijákům se však Čechům díky špionům, kupcům a uprchlíkům podařilo benátské receptury získat. Vylepšili jsme je přidáním křídy a vytvořili takzvaný *český křišťál* – sklo, které bylo masivnější, dalo se nádherně brousit do hloubky a rýt, což tenké benátské sklo nevydrželo. [cite_start]Skončil monopol, začala česká dominance. [cite: 80, 81] [cite_start]Sklářství zkrátka nebylo jen řemeslo, byl to tehdejší přísně střežený high-tech průmysl, kombinující okultní alchymii s optikou. [cite: 82]

*"Naše sklo je zmrzlé světlo, vytesané z potu lesních dělníků a slz benátských kupců."* - Mistr huťmistr ze severu`
        },
        {
            id: 'book_hussite_wars',
            title: 'Popel paměti: Husitské války a konec knihoven',
            category: 'local',
            unlockDay: 28,
            icon: '🔥',
            author: 'Laurentius de Březová (Vavřinec z Březové)',
            year: 1419,
            content: `**Apokalypsa kultury a krve**

Husitské války (1419–1434) nebyly jen lokální selskou rebelií. [cite_start]Byly to brutální, vůbec první skutečně velké náboženské války na území Evropy, které otřásly samotnými základy západního světa. [cite: 83] [cite_start]Daň za tento konflikt byla strašlivá – odhaduje se, že české země během těchto let ztratily hladem, nemocemi a mečem až **třetinu veškerého obyvatelstva**. [cite: 84]

**Oheň, který pohltil staletí**

Zatímco reformní myšlenky kalicha šířily novou interpretaci víry, vojska radikálních husitů (táborité a sirotci) zanechávala za svými pochody zkázu. Kláštery pro ně byly symbolem církevní zkorumpovanosti a bohatství. S jejich pleněním a vypalováním však plameny pohlcovaly to nejcennější – klášterní knihovny, obří trezory středověké vzdělanosti.
Během několika let nenávratně shořely statisíce stran:
- [cite_start]Ve Vyšším Brodě vzplály knihovny čítající tisíce vzácných děl (některé prameny s nadsázkou mluví až o 70 000 svazcích). [cite: 84]
- [cite_start]Ve Zlaté Koruně byly v plamenech ztraceny tisíce ručně psaných a iluminovaných rukopisů z celé Evropy. [cite: 84]
- [cite_start]V pražských Emauzích lehly popelem unikátní staroslověnské texty a chorály. [cite: 84]

**Cena za háčky a čárky**

Ztráta kulturní paměti byla absolutní. To, co tehdy shořelo – neznámé antické texty, staré české kroniky, prastaré lékařské spisy – už nikdy znovu neobjevíme. [cite_start]Jsou to prázdná místa naší historie. [cite: 85] 

[cite_start]Na počátku tohoto ohnivého pekla stál mistr Jan Hus (1372–1415), charismatický kazatel upálený v Kostnici pro kacířství. [cite: 86] [cite_start]Husovo učení sice nepřežilo ve své čisté podobě, ale přežilo v myšlenkách o 200 let déle až do příchodu Martina Luthera. [cite: 86] Paradoxně, Husův nejtrvalejší odkaz není jen náboženský, ale jazykový. [cite_start]Spisem *De orthographia bohemica* (1406) zjednodušil složitý pravopis spřežek a geniálně reformoval češtinu zavedením **háčků a čárek** (nabodeníček). [cite: 86] [cite_start]Kdyby nebylo jeho lingvistického vizionářství, psali bychom dnes jména a slova neohrabaně jako Poláci, vršící hlásky za sebe. [cite: 86]

[cite_start]Následně vzniklé jihočeské vojenské město **Tábor** (založeno 1420) se stalo dějištěm prvotního sociálního experimentu – fungovalo jako raná, radikální "demokratická" obec, kde si rovní bratři a sestry volili své hejtmany i faráře a kde (alespoň zpočátku) neplatily peníze, ale společné kádě. [cite: 87] 

[cite_start]Reformace přinesla zemi nevídanou svobodu myšlení a postavila se mocné Evropě, ale zaplatili jsme za ni krví celých generací a ohněm, který spálil naši minulost. [cite: 88]

*"Pravda Boží vítězí nad vším, ale na konci bitvy zůstává jen horký popel a pláč vdov."* - Heslo na korouhvi poražených`
        },
        
// TIER 4 - Poslední týden (day 26-30)
        {
            id: 'book_de_arte_predicandi',
            title: 'De arte predicandi: Prokletý prvotisk z Mohuče',
            category: 'history',
            unlockDay: 26,
            icon: '📜',
            author: 'Aurelius Augustinus (tisk: Fust & Schöffer)',
            year: 'před 1467',
            content: `**Nejstarší knižní drahokam ve fondu VKOL**

Představte si knihu, která pamatuje samotný úsvit tištěného slova. [cite_start]Toto je vzácný tisk z dílny **Johanna Fusta a Petera Schöffera** – ano, přesně těch dvou bezskrupulózních obchodníků, kteří v soudním procesu roku 1455 okradli bezmocného Gutenberga o jeho životní vynález, tiskařskou dílnu i rozpracovanou Bibli. [cite: 89, 90]

**Temná ironie dějin a svatý text**

Dějiny mají zvrácený smysl pro humor. [cite_start]Fust a Schöffer, s krví zrady na rukou, posléze paradoxně vytiskli některé z vizuálně nejkrásnějších a nejdokonalejších knih celého 15. století. [cite: 90] [cite_start]Tento konkrétní svazek obsahuje slavné dílo "De arte predicandi" (O umění kázat) od církevního otce svatého Augustina. [cite: 91] [cite_start]Fungovala jako manuál a praktická příručka pro duchovní, jak správně rétoricky působit a učit prostý lid. [cite: 91] [cite_start]Samotný tisk byl prokazatelně dokončen **před rokem 1467**, což z něj bez debat činí jeden z vůbec nejstarších dochovaných tisků na světě (takzvaných inkunábulí). [cite: 92]

**Záchrana před švédským rabováním**

To, že se právě v moravské Olomouci nachází takový poklad od Gutenbergových nástupců, není žádná náhoda. Do města jej přivezli mocní a vzdělaní jezuité. [cite_start]Ti sbírali staré knihy z celé Evropy jako důkaz toho, že masově tištěné slovo dokáže šířit katolickou víru nekonečně rychleji než armáda písařů s perem. [cite: 93, 94] 

Kniha měla neuvěřitelné štěstí. Píše se rok 1642 a v rámci třicetileté války olomoucké hradby prolomila a město obsadila švédská vojska generála Torstensona. [cite_start]Švédové rabovali systematicky a po stovkách odváželi cennosti – na severních vozech tehdy do Stockholmu jako válečná kořist zmizelo neuvěřitelných 100 vozů plných těch nejvzácnějších knih z olomouckých klášterů a univerzitních fondů. [cite: 95] Ale tato jediná, nenápadná kniha zázračně přežila. Jak? [cite_start]Jezuité ji spolu s několika dalšími cennostmi narychlo zazdili hluboko v temných kryptách a schovali do střešních trámů, než vojáci vylomili brány. [cite: 96]

*"Tato první kniha sice ve svém zrodu nese hořkou pečeť zrady na tvůrci, ale dokonalá krása její sazby přežívá války i švédské meče."*

---

**HERNÍ EFEKT:** Čtení této knihy odemkne vzácný skill **"Fustův paradox"**. Mistrovství, které se zrodilo ze zrady: jednou za herní seanci můžeš obětovat 10 bodů výzkumu (research) a okamžitě, bez potřeby jakýchkoliv dalších materiálů, "vycraftit" jakýkoliv předmět, dokonce i ty, které jsou jinak pro tvou úroveň zamčené (locked).`
        },
        {
            id: 'book_kutnohorska_bible',
            title: 'Kutnohorská Bible: Detektivka z archivu',
            category: 'local',
            unlockDay: 28,
            icon: '🔍',
            author: 'Martin z Tišnova (Tiskař Pražské bible)',
            year: 1489,
            content: `**Velký omyl knihovních pultů**

Někdy se to největší dobrodružství neodehrává na bojišti, ale v tichu studovny. Píše se rok 2005 a jeden z pečlivých badatelů ve Vědecké knihovně v Olomouci zkoumá starý, těžký svazek, který byl v inventáři celá desetiletí bezpečně evidován a katalogizován jako poměrně běžná *"Benátská bible z roku 1506"*. Při bližším pohledu však badatel zažil šok. [cite_start]Zjistil, že se dívá na extrémně vzácnou, českou **Kutnohorskou bibli vytištěnou bohatým kramářem a sponzorem knihtisku Martinem z Tišnova už v roce 1489!** [cite: 97]

**Jak k takovému omylu vůbec došlo?**

Byl to mistrovský podvod pramenící z nouze o celistvost. [cite_start]Někdy v hluboké minulosti (patrně v 16. nebo 17. století) se kniha poškodila a nenávratně ztratila své první a poslední složky (papíry obsahující začátek Genesis a tiráž s údaji o tisku). [cite: 98] [cite_start]Jakýsi horlivý předchozí majitel nebo sběratel se rozhodl, že knihu "opraví" a chybějící stránky znovu rukopisně dopíše. [cite: 99] Udělal však jednu obrovskou, byť logickou chybu – jako textovou předlohu pro přepis použil JINÉ, novější vydání Bible, které měl zrovna po ruce na stole! [cite_start]A to byl onen benátský tisk z roku 1506. [cite: 99] 

[cite_start]Písař, který stránky krasopisně doplňoval, tak do starobylé české olomoucké knihy fyzicky vepsal překlad textu a letopočty z benátské edice. [cite: 100] Celá staletí si pak knihovníci četli tento doplněný úvod a věřili falšované titulce, aniž by zkoumali tištěné tělo uvnitř. [cite_start]Pravdu nekompromisně odhalila až moderní forenzní typografie – porovnání jedinečných tvarů původních tištěných kovových liter uvnitř knihy s fonty používanými v Kutné Hoře na konci 15. století. [cite: 100] 

Tento tisk tak rázem "zestárl" a stal se o **17 let starším**, než se původně předpokládalo. [cite_start]Tím se automaticky zařadil mezi vůbec nejstarší kompletní české knižní tisky. [cite: 101] [cite_start]A celou tu neuvěřitelně dlouhou dobu ležel zaprášený, chybně popsaný a podceňovaný v běžných regálech knihovny. [cite: 102]

**Záhada čekající na poličkách**

[cite_start]Tato událost mezi archiváři vyvolala mrazení: Kolik dalších domněle "běžných benátských nebo německých" tisků, roztroušených v depozitářích po celé Evropě, je ve skutečnosti vzácnými českými prvotisky? [cite: 102, 103] [cite_start]Kolik historické pravdy je bezpečně ukryto pod vrstvami omylů, špatných katalogizačních lístků a omyvatelných etiket? [cite: 103]

V každé velké historické knihovně tiše dýchají tisíce svazků a trpělivě čekají na své pravé odhalení. [cite_start]Stačí se podívat zblízka a pozorně. [cite: 103, 104] [cite_start]Stačí mít znalosti, pečlivě porovnat litery z olova a bezmezně nevěřit přilepeným etiketám na hřbetech. [cite: 104]

*"Pravda umí čekat trpělivě. Někdy se schovává celé staletí pod špatným kabátem."*

---

**HERNÍ EFEKT:** Získáš pasivní schopnost eventu **"Skrytý prvotisk"**. Kdykoliv budeš vyrábět luxusní kodexy (luxury_codex), máš trvalou **5% šanci na kritický úspěch**, při kterém badatelé odhalí, že i tvůj běžný kodex (common_codex) vyrobený v minulosti byl vlastně chybně zařazený luxusní originál! Okamžitě získáváš dvojnásobnou hodnotu předmětu v mincích a obrovský bonus do výzkumu (research).`
        },
        {
            id: 'book_olomouc_misal',
            title: 'Olomoucký Misál: Válka pergamenu a papíru',
            category: 'local',
            unlockDay: 30,
            icon: '📿',
            author: 'Johann Sensenschmidt',
            year: 1488,
            content: `**Oslnivá zakázka pro celou diecézi**

Byl to obří logistický a umělecký počin. [cite_start]Významný bamberský tiskař Johann Sensenschmidt dostal od církevních hodnostářů extrémně prestižní zakázku na vytvoření nového oficiálního Olomouckého misálu (liturgické knihy obsahující texty ke mši). [cite: 105] [cite_start]Tento monumentální tiskařský úkol dokončil v roce 1488 v ohromujícím celkovém nákladu **420 naprosto identických exemplářů**. [cite: 106]

**Dva světy, dva materiály**

Církev však byla praktická i marnivá zároveň. [cite_start]Proto byl náklad přísně rozdělen podle bohatství farností: [cite: 107]
- [cite_start]**400 exemplářů bylo vytištěno na papíru** (šlo o levnější, pragmatickou a lehčí variantu určenou pro běžné, chudší vesnické kostely a každodenní opotřebení kněžími). [cite: 107]
- [cite_start]**Pouhých 20 exemplářů bylo vytištěno na luxusním pergamenu** (to byla ohromně drahá, těžká a honosná varianta, určená výhradně pro oltáře nejbohatších klášterů a ruky samotných biskupů). [cite: 107]

**Unikát olomouckých trezorů**

Zde nastupuje kouzlo Vědecké knihovny v Olomouci (VKOL). V jejich střežených klimatizovaných trezorech se dnes bezpečně ukrývá:
- 1 vzácně dochovaný exemplář tištěný na papíru.
- A 1 absolutně nedozírně cenný z oněch původních 20 pergamenových exemplářů!

Z pohledu statistiky? [cite_start]Šance, že jedna jediná instituce po 500 letech válek a požárů bude ve sbírce vlastnit obě materiálové verze jednoho vydání, je naprosto **astronomická**. [cite: 108] [cite_start]Ale opět za to vděčíme olomouckým jezuitům, kteří v průběhu staletí sbírali tyto artefakty vysoce systematicky, nikoliv nahodile. [cite: 108] [cite_start]Chtěli totiž studentům názorně ukázat celou evoluční a materiálovou škálu středověkého tiskařského umění hezky na jednom stole. [cite: 108]

**Pergamen vs. Papír: Souboj o věčnost**

- **Pergamen** (vyčištěná zvířecí kůže, většinou z telat nebo ovcí) byl garantem trvanlivosti, fyzické krásy, ale byl děsivě drahý a neetický. [cite_start]Výroba jedné takto velké knihy znamenala vyvraždění celého stáda (často byla potřeba kůže až ze 3 ovcí jen na samotný obal a vazbu jedné knihy, nemluvě o desítkách zvířat na vnitřní strany!). [cite: 109]
- [cite_start]**Papír** z drcených lněných hadrů byl neuvěřitelně levný, rychle schnul, bral krásně inkoust, ale byl zranitelný vodou, plísní a ohněm. [cite: 109]

[cite_start]Opat Trithemius, zarputilý obhájce starých písařů, kdysi v pamfletu varoval: *"Krásný pergamen bezpečně vydrží věky a soudný den, zatímco váš moderní levný papír za 200 let shoří nebo se rozpadne na prach!"* [cite: 109] A technologicky měl samozřejmě naprostou pravdu. 

[cite_start]Ale z hlediska dějin se zásadně mýlil v matematice: papírových knih se kvůli jejich nízké ceně vzniklo a nakoupilo 1000x více než pergamenových, takže z čistě statistického hlediska jich do dnešních dnů v absolutních číslech přežilo mnohem více a navždy změnily celospolečenskou úroveň vzdělanosti. [cite: 109]

**Tiskařské ponaučení**

[cite_start]Hmatatelná vzácnost a výrobní náklady nejsou vždy to samé jako historická hodnota pro lidstvo. [cite: 110] Tisk na pergamenu reprezentoval luxus, ukázku moci a statusu biskupa. Ale byl to ten obyčejný, křehký a ušmudlaný papírový tisk kolující mezi chudými, který nakonec zažehl reformaci a změnil celý svět. [cite_start]Rychlost a dostupnost zde zvítězila nad absolutní řemeslnou krásou zvířecí kůže. [cite: 110] 

Zásadní dilema: Extrémní dosah textu vs. neomezená trvanlivost média? [cite_start]Toto základní tiskařské dilema řešíme s digitálním obsahem vlastně úplně stejně i dnes, o šest století později. [cite: 111]

*"Na stole před námi leží dvě naprosto identické knihy s jedním textem i sázkou liter. Jaký je tedy ten propastný rozdíl mezi nimi? Jen cena zaplaceného času a krve."*

---

[cite_start]**HERNÍ EFEKT:** Získáš prastarou vědomost mistrů – navždy si odemkneš vrcholný výrobní řetězec na pergamenové svazky (vellum crafting chain): **surová kůže (hide) → zpracovaný pergamen (vellum) → luxusní pergamenový kodex (vellum_codex)**. [cite: 111] Budeš muset pečlivě balancovat svou ekonomiku. Tyto exkluzivní Vellum kodexy sice mají na trzích neuvěřitelnou, **5x větší prodejní hodnotu** než obyčejné papírové knihy, ale jejich výroba tě bude stát **10x více základního materiálu a času**, čímž riskneš prázdné sklady!`
        }
    ],
    
    // Kategorie pro filtrování
    categories: {
        'history': { name: 'Historie Tisku', icon: '📜' },
        'innovation': { name: 'Inovace', icon: '💡' },
        'conflict': { name: 'Konflikty', icon: '⚔️' },
        'local': { name: 'Praha & Čechy', icon: '🏰' }
    }
};

// ================================================
// 2. TECH TREE LORE - Flavor text pro každou technologii
// ================================================

const TechLoreDB = {

};



// ================================================
// 3. EASTER EGGS - Skryté achievementy a speciální itemy
// ================================================

