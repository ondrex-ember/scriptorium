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

// TIER 2 - Druhý týden (day 8-14)
        {
            id: 'book_prague_mystery',
            title: 'Záhada pražského tiskaře: Zrození v utajení',
            category: 'local',
            unlockDay: 19,
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
            unlockDay: 24,
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
            unlockDay: 29,
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
		
// TIER 3 - Třetí týden (day 15-21)
        {
            id: 'book_pfister',
            title: 'Muž s obrázky: Albrecht Pfister a první komiks',
            category: 'innovation',
            unlockDay: 34,
            icon: '🎨',
            author: 'Bamberský registr & Cech dřevorytkyň',
            year: 1460,
            content: `**Knihy pro prostý lid**

Zatímco vznešený Gutenberg v Mohuči potil krev nad svými dokonalými a nesmírně drahými latinskými Biblemi určenými výhradně pro biskupy a bohaté kláštery, v nedalekém Bamberku se kolem roku 1460 objevil muž s úplně jinou vizí. Albrecht Pfister byl tiskař-pragmatik. [cite: 55] Rychle pochopil, že opravdový trh neleží v latině, ale na zablácených ulicích. Začal proto tisknout to, co bychom dnes nazvali **obrázkovými knížkami pro lidi**. [cite: 55]

**Revoluce v němčině**

Byl vůbec prvním, kdo se odvážil ve velkém tisknout knihy v lokálním jazyce – v **němčině**. [cite: 56] Obyčejní měšťané, kupci a řemeslníci latinu neovládali, ale německy mluvili a chtěli číst příběhy, kterým rozuměli. [cite: 56] 

**Zrození ilustrované knihy**

Pfisterův největší triumf však spočíval v technologii. Jako první na světě dokázal úspěšně zkombinovat sazbu z kovových liter s ručně vyřezávanými **dřevořezy** (ilustracemi) na jedné jediné tiskové formě! [cite: 57] V roce 1461 vydal proslulou knihu bajek *Der Edelstein* (Drahokam) od dominikánského mnicha Ulricha Bonera. [cite: 57] Tato kniha byla plná hrubých, ale nesmírně expresivních obrázků, které se po vytištění často ještě ručně kolorovaly. Byl to de facto pradědeček dnešního komiksu. [cite: 57]

**Demokratizace vědění**

Pfister neprodával své knihy univerzitám ani opatům. Své zboží nabízel přímo na hlučných městských trzích a jarmarcích. [cite: 58] Lidé si domů s nadšením odnášeli oblíbené bajky, rytířské eposy a básně doplněné o obrázky. [cite: 58] Gutenberg sice přinesl samotnou technologii, ale byl to právě Pfister, kdo přinesl tištěné slovo k masám. [cite: 59] To je onen jemný rozdíl mezi geniálním vynálezcem a skutečným kulturním revolucionářem. [cite: 59]

*"Gutenberg dal slovům tělo z olova, ale Pfister jim vdechl duši a poslal je tančit mezi prostý lid. Slova jsou pro učené hlavy, ale obrázky promlouvají přímo k srdci."* - Zápisky bamberského měšťana`
        },
        {
            id: 'book_veleslavin',
            title: 'Zlatý věk: Daniel Adam z Veleslavína',
            category: 'local',
            unlockDay: 39,
            icon: '📚',
            author: 'Pražský humanista a Univerzitní anály',
            year: 1590,
            content: `**Akademik, který převzal tiskařské impérium**

Když mocný tiskařský magnát Jiří Melantrich hledal nástupce, nevybral si řemeslníka. Vybral si elitního intelektuála. Daniel Adam, uznávaný univerzitní profesor historie, se oženil s Annou, jednou z Melantrichových dcer. [cite: 61] Byla to svatba z rozumu, z vypočítavosti, nebo z čisté lásky? To už dnes nikdo s jistotou neví! Jisté však je, že když Daniel obrovskou tiskárnu po tchánovi převzal, přetransformoval ji z továrny na peníze ve **skutečné centrum evropské vzdělanosti**. [cite: 62]

**Humanista u lisu**

Daniel rozhodně nebyl jen suchopárný podnikatel. Byl to brilantní vzdělanec, neúnavný překladatel, nadaný básník a přísný redaktor v jedné osobě. [cite: 63] Jeho ediční plán byl ohromující. Z jeho lisů padaly na trh:
- Brilantní české překlady antických klasiků. [cite: 64]
- Monumentální vícejazyčné slovníky (např. *Nomenclator quadrilinguis*), které propojovaly latinu s češtinou a dalšími jazyky. [cite: 64]
- Astronomické a hospodářské kalendáře pro běžný lid. [cite: 64]
- Modlitební knihy a kroniky. [cite: 64]

Jeho čeština byla tak dokonalá, bohatá a vytříbená, že se pro tuto epochu dodnes používá pojem "veleslavínská čeština" – stal se jazykovým standardem na celá staletí.

**Šlechtic z Veleslavína**

Jeho obrovský přínos kultuře a obchodu nezůstal bez odezvy. Získal vytoužený šlechtický titul a hrdě změnil své jméno na **"Daniel Adam z Veleslavína"**. [cite: 65] Měl obrovské ambice a ještě větší disciplínu. [cite: 65] Jeho tiskařská značka zaručovala absolutní absenci chyb.

**Knihy do každé krčmy**

S nadsázkou se mezi historiky říká, že to byl právě on, kdo svou neúnavnou publikační činností donutil Pražany číst, i když o to původně ani nestáli. [cite: 66] Během jeho života zaplavily knihy celé království – ležely v hlučných krčmách, prodávaly se na jarmarcích, četly se dokonce i u barbířů při holení. [cite: 66] Tisk už nebyl výsadou, stal se každodenní potřebou. Zemřel v roce 1599, a ačkoliv jeho tiskárna pokračovala, už nikdy nedosáhla takové hvězdné slávy. [cite: 67]

*"Tisk sice osvobozuje mysl, ale to platí jen tehdy, pokud tu línou mysl nejprve donutíš číst. Kniha v polici je jen mrtvé dřevo, kniha v ruce je zbraň."* - Připisováno Veleslavínovi`
        },


// TIER 4 - Čtvrtý týden (day 22-28)
        {
            id: 'book_czech_glass',
            title: 'Křehká válka: České sklářství vs. Benátky',
            category: 'local',
            unlockDay: 59,
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
        
// TIER 4 - Poslední týden (day 26-30)
        {
            id: 'book_de_arte_predicandi',
            title: 'De arte predicandi: Prokletý prvotisk z Mohuče',
            category: 'history',
            unlockDay: 64,
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
            id: 'book_olomouc_misal',
            title: 'Olomoucký Misál: Válka pergamenu a papíru',
            category: 'local',
            unlockDay: 74,
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
        },
		
		// TIER 5 - Klenoty a kontroverze (day 31-40)
        {
            id: 'book_kronika_trojanska',
            title: 'Záhada Kroniky trojánské: Pýcha a vodoznaky',
            category: 'local',
            unlockDay: 95,
            icon: '🏛️',
            author: 'Neznámý tiskař v Plzni',
            year: '1468 (nebo 1484?)',
            content: `**Prvenství zahalené tajemstvím**

Dlouhá staletí jsme byli hrdí na to, že český knihtisk začal neuvěřitelně brzy. Slavná *Kronika trojánská*, vytištěná neznámým tiskařem v Plzni, hrdě nese v textu letopočet 1468. Pokud by to byla pravda, patřili bychom k absolutním průkopníkům knihtisku v Evropě. 

A co víc, tento nejstarší český prvotisk vůbec není náboženského charakteru, jak by se dalo u tak raného díla čekat, ale jde o světský rytířský román a dobrodružné čtení pro bohatší měšťany!

**Zrada průsvitného papíru**

Moderní věda však naší národní pýše zasadila tvrdou ránu. Badatelé začali zkoumat takzvané filigrány neboli vodoznaky – značky papíren zalisované přímo do struktury papíru, na kterém je kronika fyzicky vytištěna. Tyto průsvitky fungují jako dokonalý a nezpochybnitelný otisk prstu tehdejší doby.

Rozbor nekompromisně prokázal, že papír použitý pro tisk Kroniky trojánské byl vyroben až kolem roku 1484. Kniha je tedy s největší pravděpodobností o celých 17 let mladší, než se dříve s jistotou tvrdilo! 

**Proč tiskař lhal?**

Tiskař zřejmě vůbec lhat nechtěl. Jako textovou předlohu pro svou sazbu patrně použil starší ručně psaný rukopis z roku 1468 a ve své řemeslné horlivosti (nebo z nepozornosti) prostě do olova slepě vysázel i tento starý letopočet. 

*"Papír si neomylně pamatuje to, co lidé zapomněli, a vodoznak nikdy nelže. I olovo se může mýlit."*`
        },
        {
            id: 'book_moravian_flyer',
            title: 'Zrození marketingu: První moravský leták',
            category: 'innovation',
            unlockDay: 101,
            icon: '🪧',
            author: 'Neznámý obchodník a tiskař',
            year: 1501,
            content: `**Kniha, kterou nikdo nezná, se neprodá**

Vytisknout knihu a svázat ji je jen polovina úspěchu. Ta druhá, z obchodního hlediska mnohem těžší, je knihu prodat. V roce 1501 se na Moravě objevil fenomén, který absolutně předběhl svou dobu – vůbec první dochovaná tištěná reklama v našich zemích! 

Jednalo se o poměrně jednoduchý, ale geniální jednolistový tisk propagující jeden konkrétní knižní titul. Obchodník, který měl za úkol tuto knihu na Moravě distribuovat, si nechal natisknout balík těchto propagačních letáčků.

**Interaktivní reklama středověku**

Jeho postup byl na tehdejší dobu neuvěřitelně moderní. Letáčky masově vyvěšoval na ta nejfrekventovanější místa, kudy procházel lid – na těžké dubové dveře kostelů a na zdi rušných městských radnic. 

Text na letáku knihu okázale chválil, ale to nejlepší přišlo na samém konci. Byla tam věta oznamující, že kniha je k dostání v místním hostinci, přičemž tiskař nechal na papíře záměrně **vynechané prázdné místo**. Distribuční agent pak do tohoto pole jen narychlo husím brkem dopsal jméno konkrétní krčmy v daném městě, kde zrovna rozbalil svůj krám a ubytoval se!

*"Obchodní duše se od středověku nezměnila. Mění se jen to, zda reklamu na vaši knihu křičí vyvolávač na zabláceném trhu, nebo ji tiše šeptá papír na vratech."*`
        },
        {
            id: 'book_mattioli_herbar',
            title: 'Mattioliho Herbář: Lékárna na papíru',
            category: 'innovation',
            unlockDay: 107,
            icon: '🌿',
            author: 'Pietro Andrea Mattioli / Jiří Melantrich',
            year: 1562,
            content: `**Renesanční encyklopedie života**

Když mocný tiskařský magnát Jiří Melantrich a jeho kolega Daniel Adam z Veleslavína vydali nákladný český překlad díla italského lékaře Mattioliho, způsobili revoluci v každé měšťanské domácnosti. Tento masivní *Herbář aneb Bylinář* nebyl jen obyčejnou knihou pro znuděné vzdělance. Byla to často doslova otázka přežití.

**Překrásné ilustrace jako návod k přežití**

V době, kdy se většina běžných nemocí a neduhů stále léčila podivnými metodami (například potíráním kočičím sádlem) nebo pouhým zaříkáváním, přinesl Herbář exaktní, racionální návody. Kniha byla extrémně drahá a riskantní na výrobu, protože obsahovala stovky obrovských, neuvěřitelně detailních a krásných tiskařských dřevořezů (například kořen mystické mandragory). Lidé podle těchto obrázků na lukách a v lesích konečně bezpečně poznávali, co je hojivý lék a co naopak smrtelný jed.

**Poklad předávaný generacemi**

Dnes, když tito staří papíroví svědkové leží v archivech, nacházíme v nich fascinující stopy. Lidé tyto herbáře používali denně při vaření i léčbě. Jejich stránky jsou proto velmi často zašlé, špinavé od hlíny, popadané krve a včelího vosku. 

Majitelé si do volných míst často vpisovali vlastní poznámky, rodinné události (narození dětí, úmrtí na mor) a vkládali mezi listy vylisované rostliny či pouťové svaté obrázky. Herbář tak velmi brzy přestal být jen obyčejnou botanickou knihou a stal se rodinnou kronikou celých pokolení.

*"Tato kniha nevoní po zatuchlé tiskařské černi, ale po sušeném pelyňku, naději a záchraně."*`
        },
        {
            id: 'book_hajek_kronika',
            title: 'Hájkova Kronika: Lež, která stvořila historii',
            category: 'conflict',
            unlockDay: 119,
            icon: '📖',
            author: 'Václav Hájek z Libočan',
            year: 1541,
            content: `**Bestseller plný velkolepé fantazie**

V roce 1541 vyšla na tiskařských lisech monumentální kniha, která navždy změnila pohled Čechů na sebe sama a na vlastní minulost – *Kronika česká*. Václav Hájek z Libočan byl bezpochyby famózní vypravěč s citem pro drama, ale jako historik byl naprosto tragický. 

Kde mu zrovna chyběla tvrdá fakta a ověřitelné historické prameny, tam si události, konkrétní letopočty a dokonce i celá jména bájných panovníků prostě a jednoduše bezostyšně vymyslel!

**Lichocení mocné šlechtě**

Vydání takto obří knihy bylo mimořádně drahé a Hájek potřeboval vlivné sponzory. Proto si pro předky tehdejších mocných šlechtických rodů často účelově vymýšlel hrdinské prehistorické činy, aby polichotil jejich egu a zajistil si jejich štědrou finanční přízeň. Kronika se díky své pohádkové čtivosti stala absolutním hitem. Četli ji všichni a po celá další staletí se z ní národ nekriticky učil "svou" slavnou historii. 

Až na konci 18. století začal vzdělaný osvícenec Josef Dobrovský tyto Hájkovy vybájené nesmysly nemilosrdně korigovat a uvádět na pravou míru.

**Síla tištěného slova nad pravdou**

Pikantní je, že z Hájkových výmyslů později přímo čerpal inspiraci i spisovatel Alois Jirásek ve svých kultovních *Starých pověstech českých* (Krok a jeho dcery, silák Bivoj, Dívčí válka). 

Je to naprosto dokonalá a mrazivá ukázka moci knihtisku a médií obecně: Pokud nějakou informaci vytisknete dostatečně krásně, vydáte ji ve velkém nákladu a lidé to navíc rádi čtou, stane se z vymyšlené fikce a lži de facto oficiální národní historie.

*"Holá pravda je mnohdy nudná a velmi špatně se prodává na trzích. Lež zasazená v tvrdém olovu a obalená zlatem žije věčně."*`
        },
		
		// TIER 6 - Paměť národa (day 41-48)
        {
            id: 'book_kosmas',
            title: 'Kosmova kronika: Mýty a politika',
            category: 'local',
            unlockDay: 125,
            icon: '✒️',
            author: 'Děkan Kosmas',
            year: 'cca 1125',
            content: `**První český historik, nebo první propagandista?**

Kosmas, děkan pražské kapituly, sepsal své mistrovské dílo *Chronica Boemorum* latinsky na sklonku svého života. Je to vůbec nejstarší česká kronika a základní kámen naší historie. Přináší nám příběhy o praotci Čechovi, Krokovi, Libuši a Přemyslu Oráčovi.

**Účelové zapomínání**

Ale pozor! Kosmas nebyl nezávislý novinář. Byl to zapřisáhlý katolík a pragmatik. Ve své kronice absolutně, záměrně a dokonale vymazal jakoukoliv zmínku o slovanské liturgii, Cyrilu a Metodějovi nebo o rozmachu Velké Moravy. Proč? Protože se to tehdy politicky nehodilo do krámu. Chtěl ukázat Čechy jako pevně ukotvené v západním, latinském světě.

*"Historii nepíší vítězové. Historii píší ti, kteří mají přístup k pergamenu a vědí, co je lepší zamlčet."*`
        },
        {
            id: 'book_dalimil',
            title: 'Dalimilova kronika: Veršovaná nenávist',
            category: 'conflict',
            unlockDay: 131,
            icon: '⚔️',
            author: 'Neznámý šlechtic',
            year: 'cca 1314',
            content: `**První česky psaná kronika**

Zatímco Kosmas psal pro učené kněze latinsky, takzvaný Dalimil napsal svou kroniku česky a ve verších, aby se dala snadno recitovat a pamatovat. Kdo to byl? Jméno Dalimil je omyl pozdějších historiků. Skutečným autorem byl neznámý, zahořklý a radikální český šlechtic.

**Strach z cizinců**

Kniha je doslova prodchnutá xenofobií a nenávistí vůči Němcům a cizincům obecně. Vznikla v době, kdy do Čech masivně proudili němečtí kolonisté a měšťané, a stará česká šlechta ztrácela vliv. Autor nešetří krvavými popisy a výzvami k obraně "českého jazyka" (myšleno národa).

*"Raději chci českou selku za ženu míti, nežli německou královnu do lože vzíti. Krev a jazyk jsou silnější než koruna."*`
        },
        {
            id: 'book_rozmberk',
            title: 'Kniha rožmberská: Zákon silnějšího',
            category: 'local',
            unlockDay: 137,
            icon: '⚖️',
            author: 'Petr I. z Rožmberka (připisováno)',
            year: 'začátek 14. století',
            content: `**Právo psané mečem a majetkem**

Jde o nejstarší česky psaný právní text vůbec. Nejedná se o královský zákoník, ale o soukromý soupis zvykového práva (tzv. zemského práva), který si pro sebe nechala sepsat mocná jihočeská šlechta – Vítkovci a Rožmberkové. 

**Krevní msta a boží soudy**

Tento text nám dává fascinující a surový pohled do středověké justice. Definuje tresty za vraždy, krádeže i to, jak mají probíhat takzvané "boží soudy" (ordálie) – například nošení žhavého železa nebo zkouška vodou. Ukazuje dobu, kdy král v Praze znamenal méně než rozzlobený Rožmberk na svém panství.

*"Spravedlnost je slepá, ale nikdy není hluchá ke cinkání zlaťáků mocných pánů z Růže."*`
        },
        {
            id: 'book_zbraslav',
            title: 'Zbraslavská kronika: Slzy cisterciáků',
            category: 'history',
            unlockDay: 143,
            icon: '🏛️',
            author: 'Ota a Petr Žitavský',
            year: '1305–1339',
            content: `**Pád zlatého krále**

Když Přemysl Otakar II. padl na Moravském poli, zdálo se, že je s Čechami konec. Zbraslavská kronika (Chronicon Aulae regiae) je literárním klenotem, který popisuje vzestup a pád posledních Přemyslovců a nástup Lucemburků. 

**Klášter jako hrobka snů**

Založení Zbraslavského kláštera králem Václavem II. mělo vytvořit nové duchovní centrum a pohřebiště králů. Petr Žitavský píše s takovou emocionální hloubkou a básnickou elegancí, že kronika místy připomíná antickou tragédii. Detailně popisuje hladomory, dvorské intriky i morové rány s reportážní přesností.

*"Zlato a stříbro z Kutné Hory kupuje vojska, ale nevykoupí krále ze spárů smrti, jež tančí kolem jeho lůžka."*`
        },
        {
            id: 'book_majestas',
            title: 'Majestas Carolina: Zákon, který shořel',
            category: 'conflict',
            unlockDay: 155,
            icon: '📜',
            author: 'Karel IV.',
            year: '1355',
            content: `**Královský debakl největšího z Čechů**

Karel IV. je uctíván jako Otec vlasti, ale málokdo zná jeho největší politickou prohru. Pokusil se vydat *Majestas Carolina* – moderní psaný zákoník, který by omezil moc šlechty, zakázal svévolné zabavování majetku a zamezil zcizování královských hradů.

**Oheň jako politická výmluva**

Česká šlechta se proti tomuto kodexu postavila s takovým odporem a hrozbou ozbrojené vzpoury, že Karel musel potupně ustoupit. Aby neztratil tvář, použil geniální, ale průhlednou výmluvu: prohlásil, že originální text zákoníku "nešťastnou náhodou spadl do ohně a shořel". Návrh tak byl formálně zrušen, aniž by král musel přiznat porážku.

*"I ten nejmocnější císař Svaté říše římské se musí uklonit před hněvem české šlechty bránící svá stará privilegia."*`
        },

        // TIER 7 - Zločin, trest a inkvizice (day 49-55)
        {
            id: 'book_malleus',
            title: 'Kladivo na čarodějnice: Manuál šílenství',
            category: 'conflict',
            unlockDay: 161,
            icon: '🔥',
            author: 'Heinrich Kramer',
            year: '1486',
            content: `**Nejnebezpečnější kniha Evropy**

*Malleus Maleficarum*. Kniha, která stála život desítky tisíc nevinných žen (a mnoha mužů). Inkvizitor Heinrich Kramer ji sepsal poté, co byl pro svou brutalitu a fanatismus vyhnán z Innsbrucku místním biskupem. Kniha mu měla posloužit jako ospravedlnění.

**Právní rámec pro masovou vraždu**

Tento tisk posunul čarodějnictví z roviny lokálních pověr do roviny kacířství proti Bohu. Poskytl detailní, byrokratické návody: jak čarodějnici poznat, jak použít právo útrpné (mučení) k získání doznání a jak zamezit "ďábelskému vlivu" během soudu. Díky knihtisku se tento návod na vraždění rozšířil po celé Evropě jako mor. Později inspiroval i krvavé procesy na losinském panství u nás (Jindřich František Boblig).

*"Když se paranoia spojí s byrokracií a tiskařským lisem, rodí se peklo na zemi."*`
        },
        {
            id: 'book_bartos_pisar',
            title: 'Kronika pražská: Zpravodajství z barikád',
            category: 'local',
            unlockDay: 173,
            icon: '🏰',
            author: 'Bartoš Písař',
            year: 'cca 1532',
            content: `**Investigativní novinář 16. století**

Bartoš Písař byl úředník s proříznutou pusou a ostrým perem. Jeho *Kronika pražská* není oslavou králů, ale brutálně upřímným popisem povstání pražských měšťanů proti králi Ferdinandu I. Habsburskému (rok 1524 a dění kolem vůdce Jana Hlavsy).

**Cenzura a vyhnanství**

Bartoš detailně popisoval korupci, intriky konšelů a zradu na radnici. Jmenoval konkrétní lidi a jejich hříchy. Za svou troufalost zaplatil – byl mučen na skřipci a vyhnán z Prahy. Jeho kronika je psána jako živá reportáž muže, který stál přímo uprostřed politické bouře a odmítl mlčet.

*"Když úředník přestane psát to, co mu diktují, a začne psát to, co vidí, podepisuje si rozsudek smrti."*`
        },
        {
            id: 'book_sit_viry',
            title: 'Síť víry pravé: Středověký anarchismus',
            category: 'conflict',
            unlockDay: 185,
            icon: '🕸️',
            author: 'Petr Chelčický',
            year: '1450 (tisk 1521)',
            content: `**Odmítnutí moci a násilí**

Petr Chelčický byl samouk, venkovský myslitel a radikál. Zatímco husité prolévali krev ve jménu Boží pravdy, on sepsal *Síť víry pravé*. V ní absolutně odmítl jakékoliv násilí, dokonce i obranné. Odmítl rozdělení společnosti na trojí lid (církev, šlechta, poddaní).

**Zničení sítě**

Podle jeho metafory je církev a stát jako těžká velryba, která trhá jemnou síť pravé víry. Králové a papežové podle něj nemají právo existovat, protože si moc vynucují mečem. Jeho myšlenky o absolutním pacifismu a rovnosti položily ideový základ pro vznik Jednoty bratrské. Šlo o myšlenky tak kacířské, že se jich báli i samotní husitští kněží.

*"Kdo bere meč do ruky, byť i ve jménu dobra, již dávno prohrál svou duši."*`
        },

        // TIER 8 - Hudba, mapy a obří formáty (day 56-60)
        {
            id: 'book_jistebnicky',
            title: 'Jistebnický kancionál: Zpěv místo zbraní',
            category: 'conflict',
            unlockDay: 203,
            icon: '🎶',
            author: 'Neznámí husitští kantoři',
            year: 'kolem 1420',
            content: `**Zbraň hromadného ničení v notách**

Tento rukopisný zpěvník nalezený na půdě fary v Jistebnici je jedním z nejcennějších pokladů naší hudební historie. Právě zde je zaznamenán text a notace bojového chorálu *Ktož jsú boží bojovníci*.

**Psychologická válka**

Husité nepoužívali hudbu jen k bohoslužbám. Byla to součást jejich vojenské taktiky. Když obrovská masa tisíců vojáků začala unisono zpívat tento chorál a bubnovat na vozy, vznikal tak ohlušující, děsivý akustický tlak, že křižácká vojska (např. u Domažlic) často utekla z bojiště dřív, než vůbec došlo ke střetu. 

*"Když slova uvěří ve svou vlastní sílu a stanou se chorálem, nepotřebují ani ostří meče."*`
        },
        {
            id: 'book_schedel',
            title: 'Norimberská kronika: Konec světa v dřevořezech',
            category: 'history',
            unlockDay: 209,
            icon: '🌍',
            author: 'Hartmann Schedel',
            year: '1493',
            content: `**Středověká encyklopedie světa**

Jeden z nejvelkolepějších a nejlépe dokumentovaných prvotisků na světě. Hartmann Schedel do ní zahrnul dějiny světa od biblického stvoření až po rok 1493. Kniha je proslulá svými neuvěřitelnými 1809 dřevořezy, na kterých pracovala dílna Michaela Wolgemuta (mimochodem učitele slavného Albrechta Dürera).

**Recyklace měst**

Je zde vtipný tiskařský detail. Výroba dřevořezů byla drahá, a tak tiskaři bez uzardění recyklovali. Stejný obrázek města je v kronice použit pro zobrazení Damašku, Verony i Mantovy! Většina lidí tehdy stejně necestovala, takže nikdo nepoznal rozdíl. Kniha také končí prázdnými stránkami – Schedel je tam nechal, aby si čtenáři mohli dopsat události až do blížícího se konce světa.

*"Svět je jen divadelní kulisa, kterou tiskař přeskupí podle toho, jaký příběh chce zrovna prodat."*`
        },

        // TIER 9 - Věda, příroda a okultno (day 61-64)
        {
            id: 'book_voynich',
            title: 'Voynichův rukopis: Kniha, kterou nelze přečíst',
            category: 'innovation',
            unlockDay: 215,
            icon: '👽',
            author: 'Neznámý',
            year: 'počátek 15. století',
            content: `**Záhada za 600 zlatých**

Tento podivný, ručně psaný rukopis je plný kreseb neexistujících rostlin, nahých koupajících se žen a astrologických diagramů. Je napsán neznámým písmem, neznámým jazykem a dodnes ho nedokázaly rozluštit ani ty nejvýkonnější superpočítače a kryptologové NSA.

**Česká stopa a Rudolf II.**

Kniha má hlubokou českou stopu. Podle dochovaných dopisů ji za nehoráznou sumu 600 dukátů zakoupil císař Rudolf II., protože věřil, že ji napsal slavný anglický učenec Roger Bacon. Později ji vlastnil pražský alchymista Georg Baresch a rektor Karlovy univerzity Jan Marcus Marci. Skrývá kniha tajemství nesmrtelnosti, nebo jde o geniální, staletí starý podvod na ziskuchtivého císaře?

*"Největší moudrostí někdy není text přečíst, ale nechat ho nečtený jako věčné tajemství."*`
        },
        {
            id: 'book_cerny_herbar',
            title: 'Herbář Jana Černého: Český lékárník',
            category: 'innovation',
            unlockDay: 227,
            icon: '🌱',
            author: 'Jan Černý',
            year: '1517',
            content: `**Medicína bez latiny**

O několik desítek let dříve než slavný Mattioliho překlad, vydal litomyšlský lékař a člen Jednoty bratrské Jan Černý (Joannes Niger) svůj spis *Knieha lékárska, kteráž slove herbář aneb zelinář*. Byl to revoluční počin, protože byl psán česky, čímž obešel monopol vzdělaných latinsky mluvících univerzitních mistrů.

**Dostupnost pro chudé**

Kniha obsahovala rady pro běžné nemoci a odkazovala na byliny, které rostly za každými humny, nikoliv na nedostupné orientální koření. Je to první originální české lékařské a botanické dílo. Tisk se bohužel dochoval jen ve velmi málo exemplářích, protože ty knihy se v domácnostech doslova "učetly k rozpadnutí".

*"Lék na každou lidskou bolest už Bůh zasadil do hlíny, jen jsme zapomněli, jak se jmenuje."*`
        },
        {
            id: 'book_agricola',
            title: 'De re metallica: Poklad z hlubin',
            category: 'innovation',
            unlockDay: 233,
            icon: '⛏️',
            author: 'Georgius Agricola',
            year: '1556',
            content: `**Bible horníků a hutníků**

Georgius Agricola žil v Jáchymově (Joachimsthal), tehdejším evropském centru těžby stříbra a ražby slavných tolarů (odkud pochází slovo "dolar"). Jeho dílo *Dvanáct knih o hornictví a hutnictví* se stalo inženýrským mistrovským kouskem.

**Stroje, jedy a prach**

Kniha jako první vědecky popisuje, jak razit štoly, jak fungují větrací stroje a důlní čerpadla. Zabývá se také nemocemi horníků (silikóza, otravy arzenem). Je naplněna nádhernými technickými dřevořezy důlních mechanismů. Na celých 200 let se stala nepřekonanou učebnicí pro všechny geology a těžaře na světě.

*"Bohatství národa neleží v palácích králů, ale v temnotě, potu a prachu pod našima nohama."*`
        },
        {
            id: 'book_alchymie_kelley',
            title: 'Tractatus de Lapide: Kelleyho podvod',
            category: 'local',
            unlockDay: 239,
            icon: '🧪',
            author: 'Edward Kelley (připisováno)',
            year: 'konec 16. století',
            content: `**Zlato z olova a sliby**

Anglický alchymista Edward Kelley okouzlil dvůr Rudolfa II. Tvrdil, že vlastní zbytek červeného prášku z hrobu biskupa v Glastonbury, pomocí kterého dokáže transmutovat kovy. Jeho rukopisy (často mu zpětně připisované) slibovaly odhalení Kamene mudrců.

**Pád bez uší**

Kelley byl showman. Při veřejných transmutacích prý schovával kousky zlata ve dvojitém dně kelímků. Dlouhé vlasy nenosil z frajeřiny, ale aby zakryl uříznuté uši – trest za falšování listin v Anglii. Když nedokázal císaři dodat tuny slíbeného zlata, byl uvězněn na hradě Křivoklát a později Hněvín, kde při zoufalém pokusu o útěk skokem z okna zemřel.

*"Zlato lze vytvořit jen dvěma způsoby: v potu tváře hluboko v dole, nebo lží v uších chamtivého panovníka."*`
        },

        // TIER 10 - Apokalypsa a nové světy (day 65)
        {
            id: 'book_kralice',
            title: 'Bible kralická: Šestidílný klenot',
            category: 'innovation',
            unlockDay: 245,
            icon: '✨',
            author: 'Bratrští překladatelé (Jan Blahoslav a další)',
            year: '1579–1593',
            content: `**Tajná tiskárna v exilu**

Jednota bratrská byla pronásledovaná a musela svou tiskárnu neustále přesouvat (Ivančice, Kralice nad Oslavou). V této utajené tiskárně vzniklo vrcholné dílo české literatury a typografie. Nepřekládali z latinské Vulgáty, jako bylo zvykem, ale přímo z původních hebrejských a řeckých textů.

**Dokonalost sazby**

Šestidílná edice obsahovala nejen samotný text, ale po stranách i nesmírně podrobné komentáře a vysvětlivky. Čeština použitá v této Bibli vybrousila náš jazyk k naprosté dokonalosti. Když po Bílé hoře hrozilo zničení národa, byla to právě pašovaná Kralická bible, která udržela český jazyk při životě v exilu i v selských skrýších pod podlahou.

*"Když ztratíš zemi, krále i svobodu, domovem se ti stane jazyk skrytý mezi stránkami jediné knihy."*`
        },
		// TIER 10 (Pokračování) - Baroko a vzdor (day 66-70)
        {
            id: 'book_bible_prazska',
            title: 'Bible pražská: Zrození české sazby',
            category: 'local',
            unlockDay: 257,
            icon: '📜',
            author: 'Tiskař Pražské bible (Jan Kamp?)',
            year: '1488',
            content: `**První kompletní Bible v češtině**

Zatímco Gutenberg tiskl latinsky pro elity, skupina bohatých pražských měšťanů (včetně Jana od Pávů a Severina kramáře) se složila na naprosto nevídaný a extrémně drahý projekt: vydat celou, kompletní Bibli v českém jazyce. Píše se rok 1488 a z tiskařských lisů na Starém Městě padá na stoly monumentální dílo.

**Čeština v olovu**

Sázet český text znamenalo vytvořit zcela nové olověné litery. Čeština potřebovala své specifické spřežky a znaky, které němečtí tiskaři neznali. Tato kniha tak de facto standardizovala podobu tištěné češtiny na dlouhá desetiletí. A co víc, kniha byla vydána ve velkém nákladu a stala se přístupnou pro bohatší měšťanské rodiny, ne jen pro nedotknutelné kláštery.

*"Když Bůh poprvé promluvil z tištěného papíru česky, staré pergameniště se otřáslo v základech."*`
        },
        {
            id: 'book_michna_loutna',
            title: 'Loutna česká: Barokní jiskra v temnotě',
            category: 'innovation',
            unlockDay: 275,
            icon: '🎻',
            author: 'Adam Michna z Otradovic',
            year: '1653',
            content: `**Zlomená země zpívá**

Po třicetileté válce byly české země zplundrované, třetina obyvatel mrtvá a nekatolická elita vyhnána do exilu. V této beznadějné temnotě takzvaného "doby temna" složil jindřichohradecký varhaník Adam Michna z Otradovic *Loutnu českou*.

**Hudba jako lék na cenzuru**

Byla to sbírka mystických, duchovních písní, ale složených tak geniálně a s tak vroucí a srozumitelnou češtinou, že si je lidé okamžitě zamilovali. Hudba obcházela přísnou habsburskou cenzuru a jezuitskou kontrolu. Nebyla to politická rebelie, byl to tichý únik zraněné duše národa. Tyto noty a texty držely lidovou češtinu při životě, když oficiálním jazykem úřadů se stávala výhradně němčina.

*"Kde zakážou mluvit a číst, tam se lidé naučí své pravdy zpívat."*`
        },
        {
            id: 'book_balbin_obrana',
            title: 'Rozprava na obranu jazyka: Skrytý vzdor',
            category: 'conflict',
            unlockDay: 281,
            icon: '🛡️',
            author: 'Bohuslav Balbín',
            year: 'napsáno 1672 (tisk až 1775)',
            content: `**Jezuita, který miloval svůj národ**

Bohuslav Balbín byl jezuita, historik a hluboký vlastenec. Viděl, jak český jazyk upadá, jak je vytlačován z úřadů i škol a jak se za něj šlechta začíná stydět. V utajení, plný hněvu a smutku, sepsal své nejslavnější dílo: *Rozprava na obranu jazyka slovanského, zvláště pak českého*.

**Kniha, která čekala sto let v šuplíku**

Balbín věděl, že kdyby knihu vydal, zničilo by ho to. Byla tak ostrou kritikou odnárodňování a habsburských úředníků, že by skončil ve vězení. Rukopis proto pečlivě ukryl. Trvalo neuvěřitelných 103 let, než ho v roce 1775 nalezl a tiskem konečně vydal F. M. Pelcl. Balbínův utajený text se pak stal dynamitem, který odstartoval české národní obrození.

*"Nejmocnější knihou není ta, která leží na stole krále, ale ta, která čeká sto let ve tmě na svou správnou chvíli."*`
        },
        {
            id: 'book_veleslavin_kalendar',
            title: 'Kalendář historický: Sociální sítě renesance',
            category: 'history',
            unlockDay: 287,
            icon: '📆',
            author: 'Daniel Adam z Veleslavína',
            year: '1590',
            content: `**Víc než jen dny a měsíce**

Tištěné kalendáře byly v 16. století absolutně nejprodávanějším zbožím, jakýmsi tehdejším Facebookem. Veleslavínův *Kalendář historický* nebyl jen suchým výčtem svátků. Obsahoval astrologické předpovědi, rady pro zemědělce, termíny jarmarků po celé Evropě a stručné popisy významných historických událostí k danému datu.

**Organizace času a společnosti**

Právě díky obrovským nákladům těchto tištěných kalendářů se začal masově sjednocovat čas. Rolník najednou věděl, kdy přesně probíhá trh v Lipsku a kdy má čekat zatmění měsíce. Veleslavín vytvořil informační dálnici, po které se sjednocovala celá společnost, a naučil prostý lid plánovat svou budoucnost podle tištěného papíru.

*"Kdo ovládne kalendář, ovládne čas. A kdo ovládne čas, řídí celý svět."*`
        },
		{
            id: 'book_codex_gigas',
            title: 'Codex Gigas: Ďáblova bible a její prokletí',
            category: 'local',
            unlockDay: 191,
            icon: '👹',
            author: 'Herman Inkluz (dle paleografické analýzy)',
            year: 'počátek 13. století',
            content: `**KAPITOLA I: Fyzická nemožnost a 160 obětovaných zvířat**

Codex Gigas (doslova "Obří kniha") není jen knihou, je to monument, který se vzpírá lidskému chápání. Její rozměry jsou děsivé: 92 cm na výšku, 50 cm na šířku a váha úctyhodných 75 kilogramů. K jejímu přemístění jsou zapotřebí dva silní muži. Kniha nebyla vytištěna, je to čistý rukopis. Aby vůbec mohl vzniknout pergamen pro jejích 312 dochovaných listů, muselo být staženo z kůže odhadem 160 oslů nebo telat. 

Vznikla v malém, nevýznamném a chudém benediktinském klášteře v Podlažicích u Chrudimi. Historikům dodnes vrtá hlavou, jak si tak malý klášter mohl dovolit tak astronomicky drahý projekt.

**KAPITOLA II: Smlouva podepsaná krví a o půlnoci**

Středověká legenda, která knihu obestírá, je známá a děsivá. Podlažický mnich, který porušil přísnou řeholi, byl odsouzen k zazdění zaživa. Aby se vyhnul tomuto krutému trestu, nabídl opatovi šílenou dohodu: za jedinou noc napíše a iluminuje největší knihu, jakou kdy svět spatřil, a shrne do ní veškeré tehdejší vědění světa. 

Když se blížila půlnoc a mnich s krví krvácejícíma rukama pochopil, že úkol fyzicky nezvládne, nezačal se modlit k Bohu. Zavolal na pomoc padlého anděla. Satan úkol dokončil a jako "podpis" po sobě na straně 290 zanechal svou vlastní podobiznu. Jde o bezmála půl metru velkou, unikátní kresbu čerta v bederní roušce z hermelínu (což je symbol královské moci), se zelenou tváří, rozeklaným jazykem a drápy. Zajímavé je, že předchozí strana 289 zobrazuje "Nebeské město" (Jeruzalém). Tento kontrast nebe a pekla měl čtenáře neustále varovat.

**KAPITOLA III: Pravda psaná třicet let**

Moderní paleografický a grafologický výzkum z počátku 21. století odhalil možná ještě děsivější pravdu než samotný mýtus. Celý kodex – od prvního do posledního písmene – napsal prokazatelně **jeden jediný člověk**. Písmo je po celou dobu naprosto konzistentní, nevykazuje známky stárnutí, nemoci ani střídání nálad. 

Odborníci spočítali, že pokud by tento písař pracoval šest hodin denně, šest dní v týdnu, trvalo by mu pouhé samotné mechanické psaní (bez přípravy linek a malování složitých iluminací) plných pět let. Reálně, s ohledem na klášterní povinnosti a přípravu materiálů, zasvětil tento mnich knize 20 až 30 let svého života. Šlo o jeho celoživotní opus magnum, pravděpodobně dílo pokání.

**KAPITOLA IV: Encyklopedie a válečná kořist**

Obsah knihy je fascinující. Není to jen Bible (přepis Vulgáty). Je to celá tehdejší knihovna v jednom svazku. Obsahuje Kosmovu kroniku českou, encyklopedii Isidora ze Sevilly, traktáty o lidském těle od Galéna, zaklínadla proti padoucnici, a dokonce i magické rituály pro zaříkávání démonů a hledání zlodějů.

Kniha přinášela spíše neštěstí. Podlažický klášter zkrachoval a musel ji zastavit cisterciákům do Sedlce. Později ji vykoupil Břevnovský klášter. Císař Rudolf II., posedlý okultismem, si ji "vypůjčil" na Pražský hrad a už ji nikdy nevrátil. A tam ji v roce 1648, na samém konci třicetileté války, ukořistili Švédové pod vedením generála Königsmarcka. 

Při zničujícím požáru stockholmského královského paláce Tre Kronor v roce 1697 hrozilo kodexu zničení. Knihovníci tuto 75kilogramovou relikvii v panice vyhodili z okna hořícího zámku do nádvoří. Legenda praví, že při dopadu těžce zranila nebo dokonce zabila jednoho z přihlížejících. Ďáblova bible tak přežila oheň a dodnes odpočívá ve Švédsku, přičemž do Čech se vrátila pouze na krátkou výstavu v roce 2007.`
        },
        {
            id: 'book_malleus_maleficarum',
            title: 'Kladivo na čarodějnice: Architektura šílenství',
            category: 'conflict',
            unlockDay: 167,
            icon: '⚖️',
            author: 'Heinrich Kramer',
            year: '1486 (první tisk)',
            content: `**KAPITOLA I: Ponížený inkvizitor**

Abychom pochopili vznik nejvražednější knihy v dějinách Evropy, musíme pochopit jejího tvůrce. Heinrich Kramer nebyl žádný ctihodný světec, ale fanatický dominikánský inkvizitor, plný paranoie a hluboké, patologické nenávisti k ženám. 

V roce 1485 dorazil do tyrolského Innsbrucku, aby zde rozpoutal hon na čarodějnice. Zatkne několik žen a začne je brutálně vyslýchat. Kramerovy metody však byly natolik zvrhlé, posedlé sexuálními detaily a natolik v rozporu s tehdejším právem, že se proti němu postavil samotný místní biskup Georg Golser. Biskup Kramera označil za blázna a s ostudou ho z města vyhnal. Ženy byly propuštěny. Kramer, ponížený a toužící po pomstě, se stáhl do ústraní a rozhodl se sepsat knihu, která by jeho zvrácené metody legalizovala před celým světem. 

**KAPITOLA II: Mistrovský podvod a tiskařský lis**

Kniha vyšla v roce 1486 ve Špýru a nesla název *Malleus Maleficarum*. Kramer věděl, že k tomu, aby knihu brali vážně světští soudci i biskupové, potřebuje autoritu z nejvyšších míst. Udělal tedy brilantní propagandistický tah: na úplný začátek knihy vložil papežskou bulu *Summis desiderantes affectibus* od papeže Inocence VIII. 

Bula sice existovala a Kramerovi povolovala inkviziční činnost, ale papež ji vydal ještě *před* napsáním knihy a rozhodně nesloužila jako její schválení. Kramer navíc připojil zfalšované doporučení teologické fakulty univerzity v Kolíně nad Rýnem (profesoři ve skutečnosti text odmítli jako neetický a odporující katolické nauce). 

Díky novému vynálezu knihtisku se tyto lži a samotný text rozletěly po Evropě neuvěřitelnou rychlostí. Během dvou set let vyšla kniha v neuvěřitelných 30 vydáních.

**KAPITOLA III: Manuál pro soudní vraždy**

Kniha je chladně systematická a dělí se do tří částí. 
První část teologicky dokazuje, že čarodějnictví existuje, a tvrdí, že kdo na čarodějnice nevěří, je sám kacíř. Popisuje ženy jako tvory od přírody slabší, náchylnější k tělesným hříchům a neschopné udržet víru (Kramer zde dokonce manipuluje s latinským slovem pro ženu, *femina*, a lživě tvrdí, že pochází ze slov *fe* a *minus*, tedy "mající méně víry").

Druhá část je sbírkou děsivých báchorek prezentovaných jako fakta. Popisuje, jak čarodějnice létají na sabaty, jak obětují nekřtěňátka, jak vyvolávají ničivé krupobití, jak proměňují lidi ve zvířata a jak fyzicky odnímají mužům jejich přirození.

Třetí část je nejkrutější – jde o detailní právní manuál. Instruuje soudce, jak obejít obvyklá práva obžalovaných. Stanovuje, že pouhá výpověď zlomyslného souseda stačí k zahájení procesu. Nařizuje používání práva útrpného (brutálního mučení na skřipci a palečnicích). A dává soudcům ďábelskou radu: pokud žena při mučení pláče a přizná se, je vinna. Pokud nepláče a zatvrzele mlčí, je také vinna, protože jí ďábel poskytl temnou sílu k vydržení bolesti.

**KAPITOLA IV: Dědictví popela**

*Kladivo na čarodějnice* nebylo jen knihou. Byl to smrtící virus nainstalovaný do právního systému raně novověké Evropy. Inspiroval inkvizitory napříč stoletími, a dokonce i v protestantských zemích, kde jinak katolické knihy pálili. Jen v českých zemích na losinském a šumperském panství poslal na hranici přes stovku nevinných lidí nechvalně známý inkvizitor Jindřich František Boblig z Edelstadtu, který postupy z Kladiva fanaticky následoval. 

Slova v této knize doslova tavila lidské maso a proměnila strach ze špatné úrody ve státem schválenou genocidu žen.`
        },
        {
            id: 'book_kralicka_bible',
            title: 'Bible kralická: Šest dílů exilového klenotu',
            category: 'innovation',
            unlockDay: 251,
            icon: '✨',
            author: 'Bratrští překladatelé a Jan Blahoslav',
            year: '1579–1593',
            content: `**KAPITOLA I: Písmáci na útěku a tajná tiskárna**

Šestnácté století v Evropě bylo dobou náboženských válek a nesnášenlivosti. V českých zemích působila Jednota bratrská – přísná, puritánská, ale neuvěřitelně vzdělaná reformní církev. Byli trnem v oku jak katolíkům, tak umírněnějším utrakvistům. Byli systematicky pronásledováni, jejich kostely zavírány a jejich tiskárny úřady ničily. 

Aby přežili a zachovali své učení, museli přejít do ilegality. Své mohutné těžké tiskařské lisy tajně stěhovali na vozech z místa na místo pod ochranou tolerantní šlechty. Z Ivančic je nakonec bezpečně přesunuli na tvrz do nenápadné moravské vesničky Kralice nad Oslavou. Zde, v utajení, obklopeni hradbami, zahájili největší literární projekt našich dějin.

**KAPITOLA II: Nespokojenost s latinou a Blahoslavův triumf**

Do té doby byly české Bible překládány převážně z latinské Vulgáty (což byl sám o sobě už překlad svatého Jeronýma). Biskup Jednoty bratrské, geniální filolog a vzdělanec Jan Blahoslav, to však považoval za nedostatečné. Chtěl pro český lid naprosto čistý, nezkažený Boží text. Sám proto nejprve přeložil Nový zákon (vydán 1564) přímo z původní, starověké řečtiny. 

Jeho práce byla jazykově tak brilantní, vybroušená a bohatá, že nastavila laťku. Po Blahoslavově smrti na jeho odkaz navázal tým vzdělaných bratrských překladatelů, kteří vystudovali na kalvínských univerzitách ve Švýcarsku a Německu. Ti se pustili do překladu Starého zákona, a to rovnou z původních hebrejských a aramejských textů! Šlo o intelektuální výkon, který v tehdejší Evropě neměl téměř obdoby.

**KAPITOLA III: Šestidílka a marginalie**

Výsledek jejich patnáctileté práce nebyl jen jeden obyčejný svazek, ale monumentální šestidílná edice, vydávaná postupně v letech 1579 až 1593 (tzv. "Šestidílka"). 

Proč šest dílů? Protože bratrští učenci nechtěli dát lidem jen text. Kolem ústředního bloku biblického textu se na stránkách vinuly obrovské sloupce takzvaných marginalií – vysvětlivek, teologických výkladů, lingvistických poznámek k hebrejským slovům a křížových odkazů. Bible kralická nebyla jen kniha k modlitbě, byla to kompletní, hluboce analytická teologická univerzita ukrytá v papírových stránkách. Byla vytištěna krásným typografickým písmem (bratrskou bastardou) a zdobena renesančními dřevořezy iniciál.

**KAPITOLA IV: Záchranný kruh v době temna**

Její historický význam se naplno ukázal až o třicet let později. Po bitvě na Bílé hoře v roce 1620 začala tvrdá rekatolizace. Jednota bratrská byla zakázána, její členové museli odejít do exilu (včetně Jana Amose Komenského) a nekatolické knihy se na příkaz jezuitů, jako byl Koniáš, masově pálily na náměstích.

Kralická bible se stala zakázaným, smrtelně nebezpečným zbožím. Pašeráci (často tajní exulanti, kterým se říkalo "emisaři") ji v sudech a falešných dnech vozů pašovali zpět do Čech. Rodiny tyto staré výtisky schovávaly pod podlahami, zazdívaly do pecí a tajně z nich po nocích četly dětem. 

Tento text doslova zachránil český jazyk. O dvě stě let později, když vlastenci jako Josef Dobrovský a Josef Jungmann křísili téměř mrtvou a poněmčenou češtinu, vzali si jako absolutní vzor gramatiky a slovní zásoby právě jazyk Bible kralické. Tištěná kniha tajných moravských bratrů tak zachránila celou identitu národa.`
        },
        {
            id: 'book_voynichuv_rukopis',
            title: 'Voynichův rukopis: Šifra, která vzdoruje staletím',
            category: 'innovation',
            unlockDay: 221,
            icon: '👽',
            author: 'Neznámý (odhadováno 1404–1438)',
            year: 'objeveno 1912',
            content: `**KAPITOLA I: Knižní duch ve Ville Mondragone**

V roce 1912 prohledával polsko-americký antikvář Wilfrid Voynich sbírku starých knih v jezuitské koleji ve Ville Mondragone nedaleko Říma. Jezuité potřebovali peníze na opravu budovy a tajně odprodávali část svého archivu. Mezi starými folianty narazil Voynich na knihu, jakou nikdy v životě neviděl. 

Byl to středověký kodex psaný na jemném pergamenu, zhruba 240 stran dlouhý. Na první pohled nevypadal nijak hrozivě. Zdobily jej kresby rostlin, astrologická schémata a obrázky žen koupajících se v prapodivných zelenkavých tekutinách. Ale když se Voynich pokusil přečíst text, polil ho studený pot. Písmena připomínala podivnou směs latinky a elfského písma. Neexistovalo jediné slovo, které by dávalo smysl. Rukopis byl napsán v neznámém, dokonale strukturovaném jazyce, který svět nikdy předtím ani potom nespatřil.

**KAPITOLA II: Anatomie mimozemské botaniky**

Rukopis je rozdělen do několika zřetelných částí, které jeho tajemství jen prohlubují:
1. **Botanická část:** Obsahuje přes sto kreseb celých rostlin. Problém je, že ačkoliv vypadají velmi realisticky (mají kořeny, listy, květy), botanici dodnes nedokázali s jistotou identifikovat ani jedinou z nich. Vypadají jako chiméry – listy jedné rostliny naroubované na kořeny jiné.
2. **Astronomická část:** Složité kruhové diagramy se slunci, měsíci a hvězdami, včetně symbolů zvěrokruhu.
3. **Balneologická (biologická) část:** Nejpodivnější sekce. Zobrazuje desítky nahých žen s oteklými břichy, jak se koupou v soustavách trubek, kádí a bazénků, do kterých vtékají tekutiny připomínající lidské orgány a cévy.
4. **Farmakologická a receptářová část:** Kresby stovek malých lékárnických nádob a kořínků, doplněné krátkými odstavci textu, pravděpodobně návody na přípravu magických či léčivých lektvarů.

**KAPITOLA III: Česká stopa na dvoře alchymistů**

Součástí knihy byl i zapadlý dopis z roku 1666 od pražského rektora a vědce Jana Marca Marciho z Kronlandu. Tento dopis odhalil fascinující stopu: knihu původně vlastnil císař Rudolf II. Habsburský, známý milovník okultismu. Rudolf rukopis koupil na svém pražském dvoře za ohromnou sumu 600 zlatých dukátů, pravděpodobně od anglických šarlatánů Johna Dee nebo Edwarda Kelleyho, pod domněnkou, že jde o ztracené dílo velkého středověkého mága Rogera Bacona.

Po Rudolfově smrti knihu zdědil pražský lékárník Georg Baresch. Ten strávil půl života tím, že se marně snažil šifru rozluštit. V naprostém zoufalství odeslal kopie textu do Říma jezuitskému učenci Athanasiu Kircherovi, tehdejšímu mistrovi na egyptské hieroglyfy, ale ani ten si s ním nevěděl rady. Tak nakonec kniha skončila zapomenutá v italských trezorech.

**KAPITOLA IV: Neporažená záhada superpočítačů**

Za více než sto let od Voynichova objevu se o rozluštění pokusili ti nejlepší mozky planety. Britští lamači kódů, kteří za války zlomili nacistickou Enigmu, na tomto textu selhali. Kryptologové americké NSA v době studené války nenasli řešení. Nepomohly ani nejmodernější algoritmy umělé inteligence. 

Moderní radiokarbonová analýza (C-14) prokázala, že pergamen byl prokazatelně vyroben v letech 1404 až 1438. Nejde tedy o moderní falzifikát, jak se někteří domnívali. Jazyk vykazuje jasná statistická pravidla (tzv. Zipfův zákon, který platí pro všechny přirozené jazyky), což vylučuje, že by šlo o náhodně sepsané klikyháky. 

Je to zašifrovaný deník kacířských alchymistů? Deník středověké ženské bylinářské komunity psaný v tajném argotu, aby unikly inkvizici? Nebo mistrovský podvod ze 15. století s cílem vytáhnout peníze z bohatých evropských panovníků? Voynichův rukopis zůstává svatým grálem kryptografie – dokonalým zámkem, ke kterému svět navždy ztratil klíč.`
        },
		{
            id: 'book_koldin',
            title: 'Práva městská: Koldínův kodex a konec chaosu',
            category: 'innovation',
            unlockDay: 179,
            icon: '⚖️',
            author: 'Pavel Kristián z Koldína',
            year: '1579',
            content: `**KAPITOLA I: Právní babylón v srdci Evropy**

Až do konce 16. století připomínal právní systém v českých zemích spíše temný, neprostupný prales. Co město, to jiný zákon. Kdybyste ukradli bochník chleba nebo se poprali v krčmě na Starém Městě pražském, soudil by vás rychtář úplně jinak, než kdybyste ten samý přečin udělali v Brně, Jihlavě nebo v Litoměřicích. Města se řídila prastarými privilegii, lokálními zvyklostmi a magdeburským či norimberským právem, které si každý vykládal po svém.

Tento zmatek neuvěřitelně brzdil obchod a způsoboval neustálé, roky se táhnoucí spory. Do tohoto právního babylónu však vstoupil muž železné vůle a geniálního logického myšlení – Pavel Kristián z Koldína.

**KAPITOLA II: Kancléř a jeho životní dílo**

Koldín nebyl žádný od stolu teoretizující snílek, ale tvrdý praktik. Působil jako kancléř Starého Města pražského, což byla v té době jedna z nejvlivnějších a nejnáročnějších byrokratických funkcí v království. Denně viděl slzy zkrachovalých kupců, podvody cechmistrů i krvavé hádky o dědictví.

Rozhodl se napsat kompletní, sjednocující zákoník. Svůj *Koldínův kodex* (oficiálně *Práva městská Království českého*) připravoval celá desetiletí. Musel do něj zahrnout vše: od pravidel pro obchod, přes rodinné právo, poručnictví, cechovní předpisy, až po brutální trestní právo (právo útrpné, popravy a tresty za kacířství). 

**KAPITOLA III: Tisk a odpor měst**

Když Koldín svůj mistrovský kodex v roce 1579 konečně vydal tiskem, narazil na nečekaný odpor. Zejména moravská a některá severočeská města se bouřila. Nechtěla se vzdát svých starých práv a podřídit se "pražskému" zákoníku. Teprve král Rudolf II. musel zasáhnout a postupně zákoník vnutit všem.

Koldínův text byl jazykově i strukturálně tak dokonalý, že se dal číst jako napínavá kniha o lidských hříších. Koldín přesně definoval, jak se má chovat dobrý měšťan, a nemilosrdně trestal falešné míry, lichvu i cizoložství.

**KAPITOLA IV: Nesmrtelný zákoník**

Skutečná genialita tohoto vytištěného kodexu se ukázala v testu časem. Zatímco dynastie padaly, králové se střídali a zemi zpustošila Třicetiletá válka, Koldínův zákoník stál pevně dál. Jeho zákony byly v Čechách tak hluboce zakořeněné a funkční, že se jimi české soudy řídily neuvěřitelných 232 let! Koldínův kodex byl definitivně zrušen až v roce 1811, kdy jej nahradil moderní rakouský Všeobecný zákoník občanský (ABGB).`
        },
        {
            id: 'book_kristan_mor',
            title: 'Rada proti moru: Tance se smrtí',
            category: 'innovation',
            unlockDay: 263,
            icon: '💀',
            author: 'Křišťan z Prachatic',
            year: 'počátek 15. století',
            content: `**KAPITOLA I: Hvězdy a miasma**

Když ve středověku udeřila morová rána, města se proměnila v předpeklí. Lidé padali mrtví na ulicích a vozy nestíhaly odvážet těla. V této atmosféře naprosté beznaděje a hrůzy hledal lid záchranu. Tu jim nabídl Křišťan z Prachatic, brilantní astronom, rektor pražské univerzity a blízký přítel Mistra Jana Husa.

Křišťan sepsal v češtině vůbec první ucelený lékařský spis v našem jazyce – *Lékařské knížky*, jejichž nejslavnější a nejdůležitější částí byla *Rada proti moru*. Tehdejší lékařská věda vůbec netušila o existenci bakterií (Yersinia pestis) nebo blech. Věřili ve dvě věci: v nepříznivé postavení planet (špatné konjunkce Saturnu a Marsu) a v takzvané miasma – jedovatý, zkažený vzduch, který proniká póry do těla.

**KAPITOLA II: Očista ohněm a jalovcem**

Křišťanův spis, který se později masivně tiskl a zachraňoval životy celá staletí, obsahoval přesné návody na přežití. Prvním pravidlem byl útěk ("Uteč rychle, uteč daleko a vrať se pozdě"). Pro ty, kteří utéct nemohli, Křišťan radil, jak upravit domácnost. 

Základem bylo zničit otrávený vzduch. Radil zapalovat v domech velké ohně z vonného dřeva – jalovce, dubu a jasanu. Okna se musela těsně uzavřít, aby se zabránilo průniku mlhy z bažin. Vzduch se v místnostech "čistil" také rozprašováním silného octa a růžové vody.

**KAPITOLA III: Drcené smaragdy a pouštění žilou**

Kapitoly o léčbě samotné nemoci nám dnes připadají děsivé. Základním předpokladem bylo, že tělo musí vyhnat zkaženou "černou žluč" a krev. Aplikovalo se proto drastické pouštění žilou (flebotomie). Lékaři nemocným uřezávali žíly v přesně stanovených dnech podle fází měsíce. 

Dále se podávaly silně projímavé dryáky a jako ultimátní lék pro bohaté se doporučoval *Theriak* – univerzální protijed obsahující desítky bylin, opium a sušené maso zmijí, to vše zapíjené octem s drcenými smaragdy či perlami. 

**KAPITOLA IV: Kniha jako záchranné stéblo**

Ačkoli z dnešního pohledu Křišťanova medicína připomíná šarlatánství, ve své době měla obrovský psychologický význam. V době, kdy se mor považoval čistě za Boží trest za hříchy, dávala tištěná *Rada proti moru* lidem pocit kontroly. Nabízela hmatatelný, racionální návod, co dělat, místo pouhého odevzdaného čekání na smrt. Tato malá kniha byla často tím jediným, čeho se vyděšené rodiny mohly ve tmě zachytit.`
        },
        {
            id: 'book_klaudyan',
            title: 'Klaudyánova mapa: Politika nakreslená vzhůru nohama',
            category: 'innovation',
            unlockDay: 197,
            icon: '🗺️',
            author: 'Mikuláš Klaudyán',
            year: '1518',
            content: `**KAPITOLA I: Lékař od Bratří**

Mikuláš Klaudyán byl renesanční polyhistor – lékař, lékárník, teolog a tiskař mladoboleslavské Jednoty bratrské. V roce 1518 se rozhodl pro nevídaný projekt: vytvořit vůbec první podrobnou, tištěnou mapu Českého království. Aby dosáhl špičkové kvality a vyhnul se cenzuře mocných katolických cenzorů, odcestoval s návrhem až do Norimberka, do slavné dřevorytecké dílny Jeronýma Höltzela.

**KAPITOLA II: Svět, kde slunce ukazuje směr**

Když dnešní člověk rozbalí Klaudyánovu mapu, je naprosto zmaten. Mapa je totiž orientována přesně opačně, než jsme zvyklí – jih je nahoře a sever dole! Proč? 

V 16. století se mapy běžně nenechávaly ležet na stole. Lidé je používali při cestování a drželi je v rukou, přičemž se orientovali podle kompasů a hlavně podle malých slunečních hodin. Bylo pro ně naprosto přirozené obrátit mapu ke slunci, tedy k jihu, a mít ho ve vrchní části zorného pole. Čechy tak mají na této mapě nahoře rakouské hranice a dole Krušné hory.

**KAPITOLA III: Cestovní síť a tajná centra**

Mapa je ohromující svým topografickým detailem. Zachycuje přes 280 měst, hradů a klášterů. Červené linie spojující města nejsou obyčejné cesty, jde o vůbec první znázornění poštovních a obchodních tras. Velké a malé značky rozlišují královská města od měst poddanských.

Bystrému oku cenzora by ovšem neunikl jeden "nenápadný" detail: bratrská centra jako Mladá Boleslav nebo Litomyšl jsou na mapě zdůrazněna velkými korunkami a erby s mnohem větší pýchou a prostorem, než by jim z hlediska objektivní velikosti náleželo.

**KAPITOLA IV: Vůz roztržený dví**

Samotná mapa zabírá jen menší, spodní třetinu celého tisku. Většinu obrovského listu papíru pokrývá ohromující ilustrace, která je ostrou politickou karikaturou a moralistickým varováním. 

Zobrazuje alegorii české společnosti rozervané náboženskými spory mezi katolíky a kališníky. Nejvýraznějším motivem je "vůz táhnutý na dvě strany". Do jednoho vozu jsou z obou stran zapřaženi koně, každý tažený kočím na opačnou stranu. Vůz tak stojí na místě, skřípe a hrozí rozlomením. Klaudyán tím vyslal celému národu drsný a srozumitelný vzkaz vyrytý do dřeva: pokud se Čechy nesjednotí a budou se neustále hádat, vůz našeho království se nevyhnutelně rozpadne v prach.`
        },
        {
            id: 'book_defenestrace',
            title: 'Apologie stavův: Výstřel z papíru, který zničil Evropu',
            category: 'conflict',
            unlockDay: 269,
            icon: '📜',
            author: 'Direktoři Českých stavů',
            year: '1618',
            content: `**KAPITOLA I: Krev v příkopu**

Je ráno, 23. května 1618. Skupina rozzuřených, po zuby ozbrojených nekatolických šlechticů vtrhne do kanceláře Pražského hradu. Zmocní se dvou nejvyšších královských místodržících, hraběte Slavaty a Martinice (a jejich sekretáře Fabricia), obviňují je z porušování svobody vyznání a z vlastizrady. Následuje krátká, brutální hádka a zoufalý křik. Tři těla letí z šestnáctimetrové výšky oken hradu přímo do hlubokého hradního příkopu.

Třetí pražská defenestrace. Místodržící pád jako zázrakem přežijí (katolíci to označí za zásah Panny Marie, protestanti za měkkou hromadu odpadků), ale kostky jsou vrženy. Šlechta právě fyzicky zaútočila na zástupce samotného císaře Ferdinanda II. Tohle už nešlo vzít zpět. Byla to vzpoura a nevyhnutelná válka.

**KAPITOLA II: Propagandistická ofenziva**

Rebelující stavové si velmi dobře uvědomovali, jak tento akt bude vypadat v očích evropských panovníků – jako sprostá vražedná anarchie lůzy a zrádců koruny. Potřebovali rychle, okamžitě a efektivně změnit mezinárodní veřejné mínění. Potřebovali peníze, žoldnéře a spojence ze Svaté říše římské a Anglie.

Místo mečů tak jako první sáhli po mnohem mocnější zbrani – po tiskařském lisu. Pouhé dva dny po defenestraci, 25. května 1618, vydali úřední ospravedlnění celé akce, slavnou *Apologii stavův království Českého*.

**KAPITOLA III: Mistrovský text právnické lsti**

Apologie byla mistrovským kusem krizové komunikace a právní lsti. Dokument tvrdil, že vyhození z oken nebylo vůbec útokem proti císařskému majestátu nebo panovníkovi samotnému. Rebelové lživě a dovedně argumentovali, že císař je vlastně dobrý a o ničem neví. Útok byl prý namířen *výhradně* proti těmto konkrétním, zkorumpovaným zemským úředníkům, kteří císařem manipulovali a rušili Rudolfův majestát zaručující svobodu vyznání. 

Spis překypoval odkazy na staré české ústavy, práva šlechty a historické precedenty "spravedlivého svržení tyranů". Byla to obhajoba státního převratu převedená do elegantního renesančního manifestu.

**KAPITOLA IV: Jiskra, která zapálila kontinent**

Aby Apologie splnila svůj účel, musela se šířit rychleji než císařova armáda. Tiskařské lisy v Praze se nezastavily. Dokument byl okamžitě vytištěn nejen v češtině, ale především v němčině, latině a francouzštině, a prostřednictvím rychlých poslů rozehnán na všechny panovnické dvory protestantské Evropy.

Zafungovala. Kniha poskytla protestantským kurfiřtům právní a morální záminku, aby se do českého konfliktu zapojili. Tato malá tiskovina, sešitá z několika archů papíru, nakonec nesloužila k uklidnění situace, ale jako formální vyhlášení nejkrvavějšího konfliktu 17. století. Z lokálního konfliktu v Praze vytvořila Třicetiletou válku, která za sebou nechala spálenou Evropu a miliony mrtvých.`
        },
		{
            id: 'book_jenson_spy',
            title: 'Špion, který se nevrátil: Jensonovo tajemství',
            category: 'history',
            unlockDay: 9,
            icon: '🕵️',
            author: 'Královská kronika & Tajné archivy',
            year: '1458 (mise) / 1470 (tisk)',
            content: `**KAPITOLA I: Králova paranoia a tajná mise**

Píše se říjen 1458 a do Paříže dorazily naprosto šokující zvěsti. Francouzský král Karel VII. se doslechl o "mohučském zázraku". Špioni mu hlásili, že kdesi v Německu jistí muži jménem Gutenberg a Fust dokážou vyrábět knihy bez pomoci husího brka, a to neuvěřitelnou rychlostí pomocí zvláštních kovových písmen a mechanického lisu. 

Pro krále to nebyla jen kulturní kuriozita, byla to otázka národní bezpečnosti a prestiže. Vědění a propaganda znamenaly moc. Karel VII. se rozhodl jednat. Vybral svého absolutně nejlepšího mistra královské mincovny – Nicolase Jensona, geniálního rytce kovů a tvůrce mincovních razidel. Rozkaz zněl naprosto jasně: "Odjeď v utajení do Mohuče. Infiltruj se do jejich dílen. Nauč se toto nové umění, zjisti, jak odlévají svá písmena, a přines toto tajemství neporušené domů pro slávu Francie!"

**KAPITOLA II: Umění matrice a olova**

Jenson svou misi splnil. Dostal se do Mohuče a díky svým hlubokým znalostem práce s tvrdými kovy rychle prohlédl samotné jádro tiskařského tajemství. Zjistil, že tajemství neleží v dřevěném lisu, ale v kovu. K vytvoření písma bylo potřeba vyřezat ocelový patrici (razidlo s písmenem), ten pak silou zarazit do měkčí mědi, čímž vznikla matrice (forma). Do ní se následně lila roztavená směs olova, cínu a antimonu.

Tento proces vyžadoval neuvěřitelnou mikroskopickou přesnost, aby všechna písmena byla stejně vysoká a dala se skládat do řádků. Jenson, zvyklý řezat tváře králů na zlaté mince, se toto umění naučil k naprosté dokonalosti. Měl tajemství v kapse a mohl se vrátit do Paříže jako hrdina.

**KAPITOLA III: Zběhnutí do města na laguně**

Během svého pobytu v Německu si však Jenson uvědomil jednu zásadní věc. Pokud se vrátí k francouzskému dvoru, bude sice odměněn, ale stane se doživotním majetkem a sluhou koruny. Jeho lisy budou chrlit jen to, co mu král nebo církev nařídí. Tisk mu přitom nabízel svobodu, kterou nikdy předtím nepoznal.

Udělal rozhodnutí, za které se v té době platilo hlavou. Ke svému králi se prostě nevrátil. Odjel na jih a po několika letech ticha a příprav se v roce 1470 triumfálně vynořil v Benátkách, tehdejším nejbohatším, svobodném obchodním srdci Evropy. Liberální Benátská republika si bedlivě chránila své umělce a špičkové řemeslníky před jakýmkoliv zásahem cizích králů. Tady byl Jenson v bezpečí.

**KAPITOLA IV: Zrození moderní typografie**

V Benátkách Jenson založil vlastní tiskárnu a způsobil estetickou revoluci. První německé knihy (včetně Gutenbergovy Bible) se tiskly těžkým, hranatým gotickým písmem (texturou), které napodobovalo dobové německé rukopisy. Bylo sice slavnostní, ale velmi špatně se četlo. 

Jenson toto olověné vězení rozbil. Inspiroval se starověkými římskými nápisy na antických sloupech a vytvořil zcela nový typ písma – *Antiqua* (dnes známé jako římské písmo nebo patkové písmo). Jeho písmena měla dokonalé proporce, jemné přechody tloušťky a elegantní serify (patky), které přirozeně vedly lidské oko po řádku. 

Jeho návrh z roku 1470 byl natolik vizuálně dokonalý a nadčasový, že položil základ veškeré moderní typografii. Všechna písma, která dnes v knihách i na monitorech běžně čteme (např. slavný Times New Roman nebo Garamond), jsou myšlenkovými vnoučaty Jensonova vynálezu. Francouzský král tak sice přišel o svého špiona, ale svět získal dokonalou čitelnost a krásu.`
        },
        {
            id: 'book_manutius',
            title: 'Smartphony renesance: Impérium Alda Manutia',
            category: 'innovation',
            unlockDay: 14,
            icon: '📱',
            author: 'Benátský obchodní registr',
            year: '1494–1515',
            content: `**KAPITOLA I: Tíha uvězněného vědění**

Když si představíte středověkou knihu před rokem 1500, musíte si představit kus nábytku. Inkubánule (prvotisky) a staré kodexy byly obrovské, těžké folianty. Nešlo s nimi cestovat. Abyste si je mohli přečíst, museli jste jít do studovny, položit je na masivní dřevěný pulpit a velmi často byly tyto knihy k pultu doslova přikovány těžkým železným řetězem (tzv. *libri catenati*), aby je nikdo neukradl. 

Vědění bylo stacionární. Texty byly vlastnictvím institucí, nikoliv jednotlivců. S tím se však nehodlal smířit benátský tiskař, humanista a učitel Aldus Manutius.

**KAPITOLA II: Enchiridion – kniha do kapsy u pláště**

Manutius věřil, že vědění má být mobilní. Že kupec, který pluje na lodi, diplomat cestující kočárem nebo student sedící pod stromem, by měli mít možnost vzít si Aristotela či Vergilia s sebou. V roce 1494 založil svou proslulou tiskárnu Aldine Press a brzy poté představil naprostou revoluci: formát knihy nazvaný *enchiridion* (příručka). 

Šlo o malé, kompaktní knížky velikosti takzvaného oktávu. Byly to přímí předchůdci dnešních moderních paperbacků. Tento vynález fungoval pro renesanční elitu podobně jako vynález smartphonu pro nás. Najednou jste si mohli dát celou antickou filozofii do kapsy u sedla a vyrazit na cestu. Ceny těchto knih navíc drasticky klesly, takže si je mohla dovolit rodící se střední třída.

**KAPITOLA III: Úspora papíru a vynález kurzívy**

Malý formát knihy s sebou ale nesl jeden obrovský technický problém. Jak nacpat co nejvíce slov na malou, drahou stránku papíru, aniž by se text stal nečitelným bludištěm? 

Manutius a jeho geniální hlavní rytec Francesco Griffo si všimli, jak píší tehdejší úředníci a učenci, když si dělají rychlé poznámky. Psali lehce nakloněným, zúženým písmem, které bylo rychlé a šetřilo místo. Griffo vzal tento rukopisný styl a brilantně ho převedl do kovových tiskařských liter. V roce 1501 vydali první knihu na světě vytištěnou tímto nakloněným písmem.

Vznikla tak **italika** (kurzíva). Dnes kurzívu používáme převážně k optickému zvýraznění textu, ale její původní smysl byl čistě ekonomický – byl to "kompresní algoritmus" 16. století. Do jednoho řádku se zkrátka vešlo více nakloněných písmen než těch rovných!

**KAPITOLA IV: Delfín a kotva**

Manutius byl posedlý nejen formou, ale i obsahem. Zděsil se, kolik chyb obsahovaly tehdejší středověké překlady řeckých a římských filozofů. Rozhodl se proto tisknout "čisté" původní texty. Spolupracoval s předními učenci Evropy, včetně slavného Erasma Rotterdamského, a založil tzv. Novou akademii, kde se při redakčních radách smělo mluvit výhradně starořecky. Kdo promluvil jinak, platil pokutu! 

Jeho nezaměnitelným tiskařským znakem byl rychlý, hbitý delfín ovíjející se kolem pevné, stabilní kotvy. Bylo to ztělesnění latinského hesla *Festina Lente* (Spěchej pomalu). Rychlost a neustálá inovace (delfín) musely být vždy v rovnováze s absolutní pečlivostí a přesností textu (kotva). Aldus Manutius zemřel v roce 1515 v chudobě (všechny peníze vložil zpět do výroby knih), ale jeho tiskárna natrvalo osvobodila lidskou mysl z těžkých řetězů klášterních pultů.`
        },
        {
            id: 'book_hussite_wars',
            title: 'Popel paměti: Husitské války a konec knihoven',
            category: 'local',
            unlockDay: 79,
            icon: '🔥',
            author: 'Vavřinec z Březové / Kroniky klášterů',
            year: '1419–1434',
            content: `**KAPITOLA I: Plameny z Kostnice**

6. července 1415 vzplála v Kostnici hranice s Mistrem Janem Husem. Tento plamen však neukončil kacířství, jak si papežští legáti a císař Zikmund bláhově mysleli. Naopak. Tato jiskra zažehla celou střední Evropu a vrhla české království do vůbec prvních velkých náboženských válek západního světa. Husitské války (1419–1434) nebyly jen selskou rebelií s cepy. Bylo to mohutné intelektuální, sociální a vojenské zemětřesení.

Cena za tento radikální pokus o nápravu církve byla však strašlivá. Odhaduje se, že během patnácti let bojů, pochodů hladomoru a nemocí ztratily české země více než čtvrtinu veškerého obyvatelstva. Společně s krví však byla nenávratně zničena i naše kulturní paměť.

**KAPITOLA II: Zkáza klášterních trezorů**

Zatímco reformní myšlenky kalicha hlásaly návrat k chudé církvi bez majetků, radikální vojska táboritů a sirotků brala svá kázání doslova. Zabezpečené a pohádkově bohaté katolické kláštery se staly hlavním terčem jejich hněvu. Kláštery pro ně byly symbolem církevní zkorumpovanosti, prodeje odpustků a utlačování chudiny.

S pleněním a vypalováním obrovských opatství (např. premonstrátský Strahov, Velehrad, cisterciácký Vyšší Brod nebo Zlatá Koruna) vzplanuly plameny, které polykaly to vůbec nejcennější – klášterní knihovny. Během těchto let shořely stovky tisíc stran. Šlo o unikátní, ručně na pergamenu psané a zlatem iluminované rukopisy sbírané po celá staletí z celé Evropy. V pražských Emauzích lehly popelem prastaré staroslověnské texty. 

Ztráta kulturní paměti byla absolutní. To, co tehdy v klášterech shořelo – neznámé antické texty, kroniky a prastaré mapy – už nikdy znovu neobjevíme. V české historii po nich zůstala jen prázdná, ohořelá místa.

**KAPITOLA III: Experiment na hoře Tábor**

Ale bylo by nespravedlivé vidět v husitech jen ničitele. Na počátku revoluce vybudovali v jižních Čechách na strmém kopci nad Lužnicí vojenské město Tábor (1420). Nešlo jen o pevnost, šlo o první sociální experiment svého druhu.

V prvních fázích existence Tábora zde fungovala raná, radikální "komuna". Obyvatelé se oslovovali bratře a sestro, zrušili šlechtické tituly, a každý, kdo do města přišel, musel vhodit svůj veškerý majetek a peníze do společných kádí na náměstí. Volili si sami své hejtmany i kněze bez ohledu na papežskou hierarchii. Působilo zde mnoho "písmáků" a prostý lid najednou vášnivě diskutoval o teologii a čerpal z překladů Bible do srozumitelného jazyka. Ačkoliv se tento majetkový experiment brzy zhroutil pod tíhou reality a vojenské byrokracie, myšlenka lidské rovnosti před Bohem už v lidech zůstala.

**KAPITOLA IV: Cena za háčky a čárky**

Husité dokázali s cepy a vozovou hradbou porazit pět po sobě jdoucích mezinárodních křižáckých výprav. Tisk ještě neexistoval, ale jejich zbraní se stal zpěv a psané slovo přibité na vratech kostelů (manifesty). 

Paradoxně nejtrvalejším a nejvíce viditelným odkazem samotného Jana Husa pro dnešního Čecha není jen náboženská reformace, ale jazyková revoluce. Hus ve svém spise *De orthographia bohemica* (O pravopise českém) z roku 1406 navrhl zjednodušení děsivě složitého spřežkového pravopisu (kdy se pro jeden zvuk muselo napsat i několik písmen, např. 'rz' místo 'ř'). Zavedl systém takzvaných nabodeníček (dnešních háčků a čárek nad písmeny). Zreformoval jazyk, udělal ho vizuálně čistým a moderním. 

A tak, zatímco fyzické knihy a knihovny předhusitské doby lehly popelem, samotná slova z nich povstala modernější a silnější.`
        },
        {
            id: 'book_kutnohorska_bible',
            title: 'Kutnohorská Bible: Detektivka ze studovny',
            category: 'local',
            unlockDay: 84, // Přepisujeme kratší verzi
            icon: '🔍',
            author: 'Martin z Tišnova (Tiskař Pražské bible)',
            year: '1489',
            content: `**KAPITOLA I: Benátská rutina na stole**

Někdy se ty největší světové objevy neodehrávají v temných kryptách ani v egyptských hrobkách, ale v naprostém tichu za klimatizovanými zdmi moderní knihovny. Píše se rok 2005 a v prestižní Vědecké knihovně v Olomouci (VKOL) probíhá rutinní revize vzácných starých tisků. Badatel si na stůl nechá přinést těžký, ohmataný svazek, který byl v inventáři celá dlouhá desetiletí bezpečně evidován a katalogizován jako *"Benátská bible tištěná roku 1506"*. 

Knihovníkům na ní nepřipadalo nic zvlášť unikátního. Byla to vzácná stará kniha, ano, ale benátských vydání se po evropských archivech povalují tisíce. Byla jen jednou z mnoha položek v nekonečném seznamu trezoru. 

**KAPITOLA II: Tajemství poškozeného hřbetu**

Při bližším pohledu a listování zažil však badatel naprostý šok. Uvědomil si, že kniha je podvod – nikoliv zlý, ale zoufalý. Dávno v minulosti (patrně někdy koncem 16. nebo v 17. století) se tento svazek pravděpodobně špatným zacházením silně poškodil. Kniha nenávratně ztratila své první (papíry s obsahem a začátkem Genesis) a poslední složky, tedy takzvanou tiráž, kde býval přesný letopočet a jméno původního tiskaře.

Neznámý, pravděpodobně velmi pečlivý horlivec nebo tehdejší majitel knihy se rozhodl tento defekt "opravit". Vzal husí brko, atrament a chybějící strany na začátku a konci knihy prostě krasopisně ručně dopsal. Udělal však jednu logickou, ale obrovskou chybu. Jelikož nevěděl, z jakého vydání zničený blok papíru pochází, půjčil si jako textovou předlohu pro opis JINOU, novější tištěnou Bibli, kterou měl zrovna tehdy po ruce na stole! A onou předlohou byl právě benátský tisk z roku 1506.

**KAPITOLA III: Typografická forenzní analýza**

Písař tedy s dobrým úmyslem fyzicky vepsal do starobylé olomoucké knihy falešný letopočet a údaje z úplně jiné doby a země. Knihovníci po staletí četli tento ručně doplněný úvod, automaticky uvěřili "Benátkám 1506" a knihu podle toho zkatalogizovali, aniž by důkladněji a mikroskopicky zkoumali tištěné "tělo" uvnitř samotného bloku.

Pravdu nade vši pochybnost odhalila až moderní forenzní typografie. Badatelé v roce 2005 porovnali jedinečné řezy a tvary původních tištěných kovových liter uvnitř svazku se známými fonty 15. století. Litery okamžitě promluvily. Tohle nebyly italské písmoviny. Toto bylo stoprocentně typické české písmo (bastarda), přesně to, které na samém konci 15. století používal bohatý kramář, sponzor knihtisku a utrakvista Martin z Tišnova. 

Kniha na stole nebyla benátská. Byla to extrémně vzácná česká **Kutnohorská bible vytištěná už v roce 1489!**

**KAPITOLA IV: Nalezené stáří a mrazení v zádech**

Po tomto úžasném zjištění se kniha přes noc změnila z běžného evropského starotisku v absolutní národní klenot. Okamžitě "zestárla" o 17 let a rázem se zařadila po bok těch vůbec nejstarších a nejdůležitějších kompletních českých knižních prvotisků na světě. A celou tu neuvěřitelně dlouhou dobu trpělivě a tiše ležela zakonzervovaná a podceňovaná ve standardních regálech, maskovaná omylem.

Tato událost vyvolala mezi archiváři po celém světě příjemné mrazení a jednu zásadní, děsivou otázku: Kolik tisíců dalších nedoceněných "běžných" německých či benátských tisků, roztroušených v obrovských depozitářích a zapadlých klášterech, jsou ve skutečnosti vzácné národní prvotisky pod falešnou identitou? Kolik historické pravdy zůstává bezpečně ukryto pod vrstvami dobrých úmyslů, omyvatelných štítků a omylů knihovníků z 19. století? Archivy nejsou mrtvá místa; jsou to spící detektivky, které jen čekají, až někdo otevře správnou stránku.`
        },
		{
            id: 'book_gutenberg_betrayal',
            title: 'Mohučská zrada: Krvavý úsvit tisku',
            category: 'history',
            unlockDay: 1,
            icon: '⚖️',
            author: 'Anonymní kronikář',
            year: '1455',
            content: `**KAPITOLA I: Muž posedlý olovem**

V polovině 15. století byla Evropa hladová po slovech. Klášterní písaři nestíhali, univerzity rostly a knihy byly tak drahé, že se za ně daly kupovat statky. V této atmosféře pracoval v německé Mohuči Johannes Gutenberg, zlatník a vizionář, který byl naprosto posedlý myšlenkou mechanického psaní. Věděl, že dřevěné štočky se rychle opotřebují a nedají se měnit. Potřeboval pohyblivá písmena z kovu. 

Dlouhá léta potají experimentoval. Vyvinul slitinu olova, cínu a antimonu, která se při chladnutí nesmršťovala a dokonale vyplnila matrici. Upravil starý vinařský lis, aby vyvíjel rovnoměrný tlak na papír. Namíchal nový, hustý inkoust ze sazí a lněného oleje, který se na kovu nerozpíjel. Vytvořil dokonalou technologii. Měl však jeden obrovský problém: byl absolutně na mizině.

**KAPITOLA II: Smlouva s chladným právníkem**

Aby mohl svůj sen, monumentální 42řádkovou Bibli, dotáhnout do konce, musel se spojit s bohatým mohučským právníkem a finančníkem Johannem Fustem. V roce 1450 si od něj půjčil na tehdejší dobu astronomickou částku 800 zlatých a o dva roky později dalších 800. Jako zástavu použil to jediné, co měl – celé své "Dílo knih" (Werk der Bücher), veškeré lisy, formy, litery i právě tištěné svazky.

Fust nebyl mecenáš umění, byl to tvrdý a nemilosrdný kapitalista. Investoval do Gutenberga, protože v jeho vynálezu viděl továrnu na peníze. Dlouhé roky čekal, zatímco perfekcionista Gutenberg dál ladil litery a pomalu tiskl první, neuvěřitelně nádherné archy Bible, která měla vzhledem nerozeznatelně napodobit nejlepší rukopisy.

**KAPITOLA III: Zrada v Helmaspergerově notářství**

Píše se listopad 1455. Gutenbergova Bible je téměř hotová, zbývá vytisknout jen pár posledních stran a knihy mohou jít na trh, kde vygenerují obrovský zisk. A přesně v tento moment Fust udeří. Nečeká, až Gutenberg začne vydělávat. Zažaluje ho o okamžité splacení celé půjčky i se zničujícími úroky – celkem přes 2000 zlatých. Tvrdí, že Gutenberg peníze zpronevěřil.

Klíčovým svědkem u soudu se stává Peter Schöffer, původně pařížský kaligraf a Gutenbergův nejtalentovanější tovaryš. Schöffer zná všechna technická tajemství výroby. A tento mladý muž u soudu bez mrknutí oka zradí svého mistra a svědčí ve prospěch Fusta. 

Soud je neúprosný (dokládá to dochovaný tzv. Helmaspergerův notářský instrument). Gutenberg přichází ze dne na den o vše. O své lisy, o pečlivě odlité litery i o všechny vytištěné Bible.

**KAPITOLA IV: Dynastie zrozená ze rzi a slz**

Vítěz bere vše. Fust si okamžitě bere Schöffera za obchodního společníka a později mu dává za ženu svou jedinou dceru. Zakládají mocnou dynastii *Fust & Schöffer*, která do světa chrlí Gutenbergovým vynálezem obrovské náklady knih a neuvěřitelně bohatne. 

Zlomený, stárnoucí a chudý Gutenberg je vyhnán ze své vlastní dílny. Svět si dodnes pamatuje jeho jméno jako tvůrce tisku, ale skutečné finanční impérium a plody jeho celoživotní geniality sklidili muži, kteří do stroje neinvestovali srdce, ale jen chladné zlaťáky a zradu.`
        },
        {
            id: 'book_scribes_war',
            title: 'Válka písařů: Panna a prodejná děvka',
            category: 'conflict',
            unlockDay: 5,
            icon: '⚔️',
            author: 'Filippo de Strata / J. Trithemius',
            year: '1473–1492',
            content: `**KAPITOLA I: Panika v klášterech**

Když se první tištěné knihy začaly po roce 1460 šířit Evropou, zástupy profesionálních kaligrafů, iluminátorů a klášterních písařů zachvátila čirá panika. Celá tisíciletí měli tito lidé absolutní monopol na výrobu a šíření textu. Byli elitou. Kniha byla posvátný předmět, na kterém jeden člověk pracoval i několik let. Nyní se do měst vřítily umazané, hlučné, páchnoucí tiskařské dílny, které stejný text dokázaly vyplivnout ve stovkách kopií za jediný týden.

Byla to rána nejen pro jejich pýchu, ale především pro jejich živobytí. Cena knih rapidně klesala a s ní i cena jejich ruční práce. Začal první velký boj proti nastupující technologii.

**KAPITOLA II: Benátský hněv**

Nejradikálnějším hlasem odporu se stal benátský dominikánský mnich a profesionální písař Filippo de Strata. Kolem roku 1473 napsal tehdejšímu benátskému dóžeti plamennou polemiku, ve které žádal, aby byli tiskaři z města okamžitě a navždy vyhnáni. 

Jeho argumentace byla drsná a emotivní. Filippo prohlásil své slavné rčení: *"Est virgo hec penna, meretrix est stampificata"* – tedy: *"Pero je čistá panna, zatímco tisk je prodejná děvka."* Tvrdil, že tiskaři jsou jen hrubí, nevzdělaní řemeslníci, kteří se opíjejí v tavernách a svými stroji przní posvátnost textu. Děsilo ho, že díky levnému tisku si nyní milostnou poezii a pochybné antické romány mohou koupit i mladé dívky a prostý lid, čímž se kazí jejich mravy. 

**KAPITOLA III: Trithemiův dokonalý paradox**

Na obranu starého řemesla vystoupil o něco později (1492) také slavný učenec a opat Johannes Trithemius, který pro své mnichy sepsal spis *De Laude Scriptorum* (Chvála písařů). V něm vášnivě naléhal, aby mniši nepřestávali knihy ručně opisovat, i když tisk existuje. Jeho argumentem byla trvanlivost. 

*"Tištěná kniha je jen z papíru a ten časem zplesniví a shoří. Tisk nepřežije dvě stě let. Ale naše psaní na poctivém pergamenu přetrvá až do konce světa,"* argumentoval. Varoval, že mnich, který přestane pracovat rukama, zleniví a podlehne svodům ďábla. Práce s brkem byla vnímána jako modlitba samotná.

Dějiny si však připravily pro Trithemia ten nejkrutější, ale nejdokonalejší paradox. Když chtěl opat tento svůj obhajující spis proti knihtisku rozšířit mezi co nejvíce klášterů, zjistil, že ruční přepisování by trvalo moc dlouho. Musel nakonec poníženě jít do tiskárny v Mohuči a nechat svou Chválu písařů... vytisknout!

**KAPITOLA IV: Konec jedné éry**

Tiskařský lis nešlo zastavit argumenty ani zákazy. Písařské cechy po celé Evropě zkrachovaly za jedinou generaci. Mnozí hrdí umělci, kteří kdysi zdobili bible pro krále, museli sehnout hlavu a nechat se zaměstnat v tiskárnách jako obyčejní sazeči nebo návrháři tiskařských písem, protože jako jediní dokonale ovládali tvary písmen.

Byl to konec krásného, tichého klášterního světa iluminací, ale zároveň to byl začátek nové, hlučné éry, ve které mohla číst celá Evropa.`
        },
        {
            id: 'book_rudolf_alchemists',
            title: 'Město bláznů a géniů: Alchymisté Rudolfa II.',
            category: 'local',
            unlockDay: 49,
            icon: '🔮',
            author: 'Tajná dvorská kronika',
            year: 'konec 16. století',
            content: `**KAPITOLA I: Císař utíká do melancholie**

Píše se rok 1583. Svatá říše římská je ohrožována rozpínající se Osmanskou říší a náboženskými spory. Císař Rudolf II., panovník excentrický, vzdělaný, ale trpící hlubokou dědičnou melancholií a paranoiou, dělá nečekaný krok. Rozhodne se přesunout celý svůj obrovský císařský dvůr z Vídně na bezpečný Pražský hrad.

Rudolf neměl rád státnictví ani války. Miloval umění, hvězdy a tajemství hmoty. V Praze rychle vybudoval takzvané "Kunstkomory" – obrovské sbírky podivností z celého světa, od vycpaných draků přes rohy jednorožců (ve skutečnosti zuby narvala) až po geniální hodinové strojky. Především ale proměnil Prahu v absolutní hlavní město okultismu a vědy.

**KAPITOLA II: Evropský úl mágů**

Rudolfova touha po poznání (a penězích do prázdné státní pokladny) do města přilákala přes 300 nejlepších i nejhorších alchymistů, astrologů a hermetiků z celé Evropy. Malé, stísněné domky na Pražském hradě (Zlatá ulička) dnem i nocí doutnaly kouřem z pecí a křivulí. 

Každý se snažil najít *Lapis Philosophorum* – legendární Kámen mudrců, který dokáže léčit všechny nemoci a proměnit olovo v ryzí zlato. Na dvoře působili i slavní Angličané: John Dee, učenec, který tvrdil, že rozmlouvá s anděly v tajném enochiánském jazyce, a jeho asistent Edward Kelley, charismatický podvodník, který císaře fascinoval údajnými ukázkami transmutace, ale nakonec skončil ve vězení na Křivoklátě, když nedokázal dodat slíbené tuny zlata.

**KAPITOLA III: Zlatý prach a pravá věda**

Historie se často alchymistům vysmívá jako šarlatánům, ale to je obrovská chyba. Mezi podvodníky se skrývali skuteční průkopníci. Protože při svých neustálých (a často výbušných) pokusech o transmutaci míchali nejrůznější kyseliny, rudy a soli, objevovali zcela nové, reálné chemické postupy.

V pražských laboratořích tehdy vznikaly základy moderní farmacie, metalurgie a chemie. Byla zde například zdokonalena výroba kyseliny dusičné a sírové (vitriolu), alchymisté zjistili, jak destilovat vysoce čistý alkohol, jak izolovat fosfor a jak pracovat se sloučeninami zinku pro výrobu lepších slitin. Magie a věda nebyly nepřátelé – věda se zrodila přímo z nitra magie.

**KAPITOLA IV: Vražedné nebe Tychona Braha**

Do této ezoterické atmosféry dorazil i slavný dánský astronom Tycho Brahe. I když neměl k dispozici dalekohled (ten vynalezl Galileo až o několik let později), vytvořil díky obřím sextantům nejpreciznější mapy hvězdné oblohy na světě. 

Brahe byl však také alchymistou a připravoval si vlastní elixíry na zdraví. Zemřel náhle v Praze na podzim roku 1601. Dlouho se tradovala spíše komická legenda, že zemřel kvůli prasklému močovému měchýři, protože kvůli císařské etiketě nemohl vstát od hostiny. Moderní exhumace jeho vousů a kostí však odhalila vysoké, toxické hladiny rtuti. Brahe s největší pravděpodobností nezemřel na hostinu, ale otrávil sám sebe vlastním "léčivým" alchymistickým lektvarem, který rtuť obsahoval. V Rudolfově Praze byla hranice mezi genialitou, životem a smrtí tenčí než dým z křivule.`
        },
        {
            id: 'book_komensky_labyrint',
            title: 'Labyrint světa a ráj srdce: Cesta troskami Evropy',
            category: 'history',
            unlockDay: 293,
            icon: '👁️',
            author: 'Jan Amos Komenský',
            year: '1623',
            content: `**KAPITOLA I: Spisovatel na dně propasti**

Je těžké si představit větší osobní i národní tragédii, než jakou prožíval Jan Amos Komenský v roce 1623. Po bitvě na Bílé hoře (1620) byla Jednota bratrská, v níž působil jako kněz, postavena mimo zákon. Císařští vojáci spálili jeho dům i celou jeho rozsáhlou knihovnu s nedokončenými rukopisy. Musel prchat a skrývat se jako psanec. Do toho zasáhla Čechy krutá morová epidemie, která mu během několika dnů zabila milovanou manželku Magdalenu i obě jejich malé děti. 

Zlomený, zoufalý třicetiletý muž našel tajný azyl na panství Karla staršího ze Žerotína v Brandýse nad Orlicí. A právě zde, uprostřed hluboké deprese a ztráty úplně všeho, na čem mu záleželo, napsal jednu z nejgeniálnějších a nejkritičtějších knih v dějinách naší literatury – alegorický román *Labyrint světa a ráj srdce*.

**KAPITOLA II: Růžové brýle klamu**

Kniha je vyprávěna z pohledu Poutníka (samotného Komenského), který chce zjistit, jaké povolání si má ve světě vybrat, aby našel klid a smysl života. Brzy se k němu připojí dva nezvaní průvodci: Všezvěd Všudybud (symbolizující lidskou zvědavost a těkavost) a Mámení (symbolizující zvyk a iluze). Mámení nasadí Poutníkovi na nos speciální brýle. Skla těchto brýlí jsou vybroušena z "Domnění" a obroučky jsou ze zvyku. Přes tyto brýle vypadá celý svět krásně, spravedlivě a bohatě.

Poutník má ale štěstí – brýle mu sedí nakřivo. Může tak pod nimi pošilhávat a vidět svět v jeho skutečné, drsné, kruté a ošklivé podobě.

**KAPITOLA III: Pitva lidské hlouposti**

Společně procházejí alegorickým městem, které představuje celý tehdejší svět a jeho společenské vrstvy (stavy). Komenský zde s naprosto břitkým a cynickým humorem kritizuje celou společnost. 

Když přijdou mezi lékaře, vidí, že nemocným spíše berou peníze, než aby je léčili, a jejich pacientům nakonec kopou hroby. Když jdou na trh k obchodníkům, vidí jen lež, falešná závaží a okrádání. Když navštíví soudy, sedí na soudcovských křeslech figuríny se jmény "Nedorozum", "Nepozor" a "Úplatek". 

Když přijdou mezi vzdělance a filozofy, nachází Poutník jen hádající se hlupáky, kteří mlátí prázdnou slámu. A největší odpor chová Komenský k vojákům – popisuje boj jako nesmyslná jatka, kde se lidé pro pýchu panovníků radostně mění ve zvířata, která se navzájem kuchají.

**KAPITOLA IV: Útěk do nitra**

Po prohlídce celého světa, od žebráků až po císaře, Poutník zjišťuje, že nikde nenalezl štěstí. Všude vidí jen *„marnost nad marnost, pachtění a svízel“*. Svět je labyrint bez východu, kde vládne přetvářka, násilí a smrt.

Zcela vyčerpaný a blízko absolutnímu šílenství chce Poutník utéct ze světa úplně. V tu chvíli zaslechne tichý hlas, který ho volá zpět, ne však do vnějšího města, ale do jeho vlastního nitra. Poutník se zavře ve svém vlastním srdci, kam nemá svět, války ani falešní lidé přístup. Zde se setkává s Kristem a nachází onen "Ráj srdce". 

Tato neuvěřitelně silná literární terapie zachránila Komenského před šílenstvím a umožnila mu později se stát „učitelem národů“, i když pro zbytek svého života už nesměl spatřit svou vlast.`
        },
        {
            id: 'book_schedula_diversarum_artium',
            title: 'Schedula Diversarum Artium: Tajemství řemesel',
            title_en: 'Schedula Diversarum Artium: The Secrets of Crafts',
            category: 'technical',
            unlockDay: 113,
            unlocksTech: ['tech_organum_hydraulicum'],
            icon: '🎹',
            author: 'Theophilus Presbyter',
            year: 'cca 1100–1120',
            content: `**Mnich, který uměl vše**

Theophilus Presbyter — pravděpodobně německý benediktinský mnich — napsal na počátku 12. století dílo, které nemá v tehdejší Evropě obdoby. Schedula Diversarum Artium (Příručka rozmanitých umění) je třísvazková encyklopedie řemeslných technik: malířství, sklářství a kovářství. Ale skrývá i něco, co dnes badatele překvapuje — podrobný návod na stavbu varhan.

**Kůže, vzduch a Bůh**

Podle Theophila jsou varhany nástrojem hodným Boha, ale jejich stavba je prací hodnou mistra. Klíčem jsou měchy — obrovské kožené pytle, které pohánějí vzduch do píšťal. Theophilus popisuje, jak musí být kůže napuštěna voskem a lojem, aby vzduch neunikal. Bez dokonalých měchů není zvuku. Bez zvuku není modlitby.

*"Mistře, než sáhneš po dřevu a kovu, připrav kůži. Na ní vše závisí."*

**HERNÍ EFEKT:** Odemkne tech Organum Hydraulicum — stavbu hydraulických varhan. Bez přečtení tohoto spisu varhanář z Norimberka nepřijede.`,
            content_en: `**The Monk Who Knew Everything**

Theophilus Presbyter — likely a German Benedictine monk — wrote in the early 12th century a work without parallel in contemporary Europe. The Schedula Diversarum Artium (Handbook of Various Arts) is a three-volume encyclopaedia of craft techniques: painting, glasswork and metalwork. But it conceals something that surprises scholars even today — a detailed guide to building organs.

**Leather, Air and God**

According to Theophilus, the organ is an instrument worthy of God, but its construction is work worthy of a master. The key is the bellows — great leather sacks that drive air into the pipes. Theophilus describes how the leather must be saturated with wax and tallow so that no air escapes. Without perfect bellows there is no sound. Without sound there is no prayer.

*"Master, before thou reach for wood and metal, prepare the leather. Upon it all depends."*

**GAME EFFECT:** Unlocks the Organum Hydraulicum tech — the construction of hydraulic organs. Without reading this treatise, the organ builder from Nuremberg shall not come.`
        },
        {
            id: 'book_tacuinum_sanitatis',
            title: 'Tacuinum Sanitatis: Tabulky zdraví a zkázy',
            title_en: 'Tacuinum Sanitatis: Tables of Health and Ruin',
            category: 'innovation',
            unlockDay: 44,
            icon: '🌿',
            author: 'Ibn Butlan (latinský překlad: italské školy, 13. stol.)',
            year: 'cca 1050 (překlad cca 1250)',
            content: `**Arabská moudrost v latinském hávu**

Původní spis napsal bagdádský křesťanský lékař Ibn Butlan kolem roku 1050. Byl to praktický zdravotní průvodce — přesné tabulky o 280 potravinách, bylinách, nádobách a podmínkách prostředí. Co kdy jíst, co uchovávat, za jakého počasí, v jaké míře. Středověká dietetika v nejčistší podobě.

Latinský překlad se rozšířil italskými lékařskými školami ve 13. století a záhy se dostal do každého kláštera. Mniši ho opisovali dychtivě — ne proto, že by nutně věřili všem arabským teoriím, ale protože tabulky fungovaly. Potraviny uchovávané podle Tacuina prostě vydržely déle.

**Chladný sklep jako lékárna**

Klíčovým poznatkem Tacuina bylo rozlišení prostředí. Chlad, teplo, sucho, vlhkost — každá potravina má své ideální podmínky. Mléko ve sklepě vydrží pětkrát déle než na slunci. Byliny sušené ve stínu si uchovají účinné látky déle než sušené na přímém světle. Ryby zabalené do mokré trávy přežijí přenos bez zápachu.

Toto vědění formovalo klášterní architekturu. Cella — chladný klenutý sklep — nebyla náhoda. Byl to vědomý nástroj výživy a přežití komunity.

*"Co zachováš chladno a temno, to zachová život tvůj. Co vystavíš světlu a teplu, to ztrácí svou sílu dříve, než je užiješ."*

**HERNÍ EFEKT:** Přečtením tohoto spisu odemkneš tech *Cella* — stavbu chladného sklepa. Organické suroviny (vejce, mléko, byliny, ryby) vydrží v Celle 2–3× déle než bez ní.`,
            content_en: `**Arabic Wisdom in a Latin Garb**

The original treatise was written by the Baghdad Christian physician Ibn Butlan around 1050. It was a practical health guide — precise tables covering 280 foodstuffs, herbs, vessels, and environmental conditions. What to eat and when, what to store, in what weather, in what measure. Medieval dietetics in its purest form.

The Latin translation spread through the Italian medical schools in the 13th century and soon reached every monastery. Monks copied it eagerly — not because they necessarily believed all the Arabic theories, but because the tables worked. Foodstuffs kept according to the Tacuinum simply lasted longer.

**The Cold Cellar as a Pharmacy**

The key insight of the Tacuinum was the distinction of environments. Cold, heat, dryness, moisture — every foodstuff has its ideal conditions. Milk in a cellar lasts five times longer than in the sun. Herbs dried in the shade retain their active compounds longer than those dried in direct light. Fish wrapped in wet grass survive transport without spoiling.

This knowledge shaped monastic architecture. The cella — a cool, vaulted cellar — was no accident. It was a conscious instrument of nutrition and the community's survival.

*"That which thou keepest cold and dark shall preserve thy life. That which thou exposest to light and heat loses its strength before thou canst use it."*

**GAME EFFECT:** Reading this treatise unlocks the *Cella* tech — the construction of a cold cellar. Organic stores (eggs, milk, herbs, fish) last 2–3 times longer in the Cella than without it.`
        },
        {
            id: 'book_palladius_caseus',
            title: 'Opus Agriculturae: O sýření mléka',
            title_en: 'Opus Agriculturae: On the Curdling of Milk',
            category: 'innovation',
            unlockDay: 67,
            icon: '🧀',
            author: 'Palladius Rutilius Taurus Aemilianus',
            year: 'cca 4. stol. n. l.',
            content: `**Praktik, ne teoretik**

Zatímco Columella psal o hospodářství jako filozof, Palladius psal jako muž, který si od rána do večera špiní ruce. Jeho Opus Agriculturae je rozdělené podle měsíců v roce — co dělat v lednu, co v červenci. Žádné velké úvahy o důstojnosti rolnické práce, jen suchý, přesný návod. Středověcí opati ho milovali přesně pro tuhle stručnost: kniha, kterou si bratr cellarius mohl otevřít ráno a hned vědět, co má dělat.

**Tři cesty k téže hroudě**

Palladius věnuje sýření mléka samostatnou kapitolu a popisuje to, co praxe znala odjakživa — existuje víc než jeden způsob, jak mléko srazit. Nejjistější je slez z útrob neodstaveného mláděte, vysušený a nastrouhaný do vlažného mléka. Kdo mládě nemá nebo ho nechce obětovat, sáhne po bylině — výluh ze svízelu syřišťového funguje podobně, jen pomaleji a méně jistě. A nakonec — pro toho, kdo nemá ani jedno — stačí čas a teplo. Mléko samo zkysne, oddělí se syrovátka od tvarohu, a z tvarohu vznikne sýr bez jediné kapky syřidla.

*"Co příroda sama promění, k tomu netřeba ruky řezníkovy. Ale co příroda sama nedokáže rychle, tomu pomoz slezem nebo bylinou — podle toho, co máš po ruce."*

**Klášterní variace**

Palladius nepíše o Olomouci ani o Moravě — psal o římském panství o tisíc let dřív. Ale jeho metoda cestovala s mnišskými řády po celé Evropě, a každý kraj si ji ohnul po svém. V Čechách se traduje, že nejprostší cesta — kyselé srážení bez syřidla — dala vzniknout drobným, ostře vonícím sýrečkům, které se daly udělat i tam, kde na mladé jehně nebylo ani pomyšlení. Říká se, že podobně vznikaly i v okolí Olomouce.

**HERNÍ EFEKT:** Přečtením tohoto spisu odemkneš tech *Caseus* — sýření mléka. Slez z jehněte, výluh ze svízelu, nebo jen čas a teplo: tři cesty k sýru podle toho, co máš zrovna po ruce.`,
            content_en: `**A Practitioner, Not a Theorist**

While Columella wrote about husbandry as a philosopher, Palladius wrote as a man who got his hands dirty from morning to night. His Opus Agriculturae is arranged by the months of the year — what to do in January, what in July. No grand reflections on the dignity of peasant labour, just dry, precise instruction. Medieval abbots loved it for exactly this brevity: a book the cellarer brother could open in the morning and immediately know what to do.

**Three Paths to the Same Wheel**

Palladius devotes a chapter of its own to curdling milk, describing what practice had always known — there is more than one way to set milk. The surest is rennet from the stomach of an unweaned kid, dried and grated into warm milk. He who has no kid, or will not sacrifice one, reaches for an herb — an extract of lady's bedstraw works similarly, only slower and less certain. And finally — for one who has neither — time and warmth suffice. The milk sours on its own, the whey separates from the curd, and from the curd a cheese is born without a drop of rennet.

*"What nature transforms of herself needs no butcher's hand. But what nature cannot do quickly, help along with rennet or herb — whichever lies to hand."*

**Monastic Variations**

Palladius wrote nothing of Olomouc or Moravia — he wrote of a Roman estate a thousand years earlier. But his method travelled with the monastic orders across Europe, and every region bent it to its own use. In Bohemia it is said that the simplest path — souring without rennet — gave rise to small, sharply scented curd cheeses, made even where no young lamb was to be had. Something similar, the story goes, arose around Olomouc as well.

**GAME EFFECT:** Reading this treatise unlocks the *Caseus* tech — curdling milk. A lamb's rennet, an extract of bedstraw, or simply time and warmth: three paths to cheese, depending on what lies to hand.`
        },
        {
            id: 'book_ruralia_apibus',
            title: 'Ruralia Commoda: O sídlech a péči o včely',
            title_en: 'Ruralia Commoda: On the Dwellings and Care of Bees',
            category: 'innovation',
            unlockDay: 140,
            icon: '🐝',
            author: "Petrus de Crescentiis (Pietro de' Crescenzi)",
            year: 'psáno 1304–1309 (opis z mnišské tradice, ne tisk)',
            content: `**Bolognský soudce na venkovském statku**

Petrus de Crescentiis nebyl mnich ani učenec z kláštera — byl to bolognský právník, kterej se po letech u soudu stáhl na svůj venkovský statek a sepsal tam mezi lety 1304 a 1309 dílo Ruralia Commoda, dvanáctero knih o hospodářství od polí po sady, od dobytka po ryby. Čerpal z Catona, Varrona, Columelly a Palladia — starých římských autorů — ale přidal i vlastní zkušenost hospodáře. Kniha se rozšířila po celé Evropě v opisech dřív, než ji kdokoli vytiskl; do roku 1465 koluje jako rukopisný kodex, ne jako tisk — mnišské skriptorium ji zná z opisu, ne z lisu.

**Kde má úl stát**

Devátá kniha se věnuje výhradně včelám a začíná tam, kde by měl začít každý dobrý hospodář — místem. Crescenzi cituje Palladia: úl patří do odlehlého kouta zahrady, na slunném a teplém místě, chráněném před větrem. Podle Varrona má stát poblíž dvora, ale ne tam, kde se ozývá ozvěna — bzukot odražený od zdi prý včely plaší, jako by slyšely křídla nepřítele. Podle Vergilia má úl hledět k zimnímu východu slunce a mít nablízku čistou vodu — ale ne jen tak ledajakou: do vody se má hodit vrbové proutí a kameny napříč, aby včely, když si letí pro vodu, měly kde přistát a usušit si křídla, než utonou. Úly samy stojí na podezdívce vysoké tři stopy, nabílené vápnem — kvůli ještěrkám a hadům, co by jinak vlezli dovnitř.

*"Kde chybí místo, chybí i med — o úl se nestará ten, kdo mu nevybere správný domov."*

**Naslouchat úlu**

Nejpozoruhodnější rada se netýká stavby, ale sluchu. Crescenzi píše, že dřív, než se úl otevře ke sklizni, má se hospodář naklonit a poslouchat: je-li bzukot hlasitý a chraplavý, plástve ještě nejsou zralé. Sklízet se má ráno, dokud včely ještě nejsou rozehřáté vedrem, a před otevřením úlu se má zakouřit — pryskyřicí galbanem nebo suchým hovězím trusem, aby včely ztichly. A pak přichází otázka, kolik vzít: Varro radí nechat včelám dvě třetiny na zimu a vzít jen třetinu; Vergilius jde dál — obává-li se hospodář tuhé zimy, nemá brát vůbec nic. Lidé Crescenziho doby, jak sám píše, se drží jednoho pravidla: med se bere jen jednou za rok, od konce srpna do poloviny září.

**Strážce, ne dobyvatel**

Crescenzi na rozdíl od suššího Palladia zdůrazňuje něco navíc — úl si žádá službu, ne pouhé využívání. Hospodář, kterej se o včely stará pozorně a trpělivě, z mála za krátký čas získá mnoho; kdo je jen obírá, brzy nemá nic. Přesně tenhle tón — péče jako povinnost, ne jen zisk — sedí na klášterní život líp než na kterýkoli světský statek. Crescenzi nikdy nepsal o Olomouci ani o Moravě, ale bratr, kterej se ve skriptoriu skloní nad opsanou stránkou o zimním slunci a vrbovém proutí ve vodě, pozná přesně, oč jde — letos na jaře postaví úl přesně tam, kam radí kniha.

**HERNÍ EFEKT:** Přečtením tohoto spisu odemkneš MOŽNOST výzkumu nového tech *Custos Apium* (pracovní název, k potvrzení) — bez přečtení nejde tech vůbec zkoumat, i kdybys měl grošů dost.`,
            content_en: `**A Bolognese Judge on a Country Estate**

Petrus de Crescentiis was no monk or cloistered scholar — he was a Bolognese jurist who, after years at court, retired to his country estate and wrote there, between 1304 and 1309, the Ruralia Commoda: twelve books on husbandry, from fields to orchards, from cattle to fish. He drew on Cato, Varro, Columella, and Palladius — the old Roman authors — but added his own experience as a landowner. The book spread across Europe in copies long before anyone printed it; by 1465 it still circulates as a hand-copied codex, not a printed one — the monastic scriptorium knows it from the copyist's pen, not the press.

**Where the Hive Should Stand**

The ninth book is devoted entirely to bees, and it begins where every good husbandman should begin — with the site. Crescenzi cites Palladius: the hive belongs in a secluded corner of the garden, sunny and warm, sheltered from the wind. According to Varro it should stand near the farmyard, but not where an echo answers — a hum bounced off a wall is said to frighten the bees, as though they heard an enemy's wings. According to Virgil the hive should face the winter sunrise and have clean water nearby — but not just any water: willow twigs and stones should be thrown across it, so bees flying out for water have somewhere to land and dry their wings before they drown. The hives themselves stand on a plastered platform three feet high, whitewashed with lime — against lizards and snakes that would otherwise creep inside.

*"Where there is no proper place, there is no honey either — no one truly tends a hive who has not first chosen it the right home."*

**Listening to the Hive**

The most remarkable advice concerns not construction but hearing. Crescenzi writes that before a hive is opened for harvest, the keeper should lean in and listen: if the hum is loud and hoarse, the combs are not yet ripe. Harvesting should happen in the morning, while the bees are not yet stirred by heat, and smoke — from galbanum resin or dried cow-dung — should calm them before the hive is opened. Then comes the question of how much to take: Varro advises leaving two-thirds for the bees through winter and taking only a third; Virgil goes further — if a hard winter is feared, take nothing at all. The people of Crescenzi's own time, he notes, hold to one rule: honey is taken only once a year, from the end of August to the middle of September.

**A Guardian, Not a Conqueror**

Unlike the drier Palladius, Crescenzi stresses something more: the hive asks for service, not mere use. A keeper who tends the bees attentively and patiently gains much from little in a short time; one who only takes from them soon has nothing left. That very tone — care as duty, not just profit — suits monastic life better than any worldly estate. Crescenzi never wrote of Olomouc or Moravia, but a brother bent over the copied page about the winter sun and the willow twigs in the water will know exactly what it means — this spring, he will build the hive exactly where the book advises.

**GAME EFFECT:** Reading this treatise unlocks the POSSIBILITY of researching the new tech *Custos Apium* (working title, pending confirmation) — without reading it, the tech cannot be researched at all, no matter how much research you have.`
        },
        {
            id: 'book_palladius_columbaria',
            title: 'Opus Agriculturae: O stavbě holubníku',
            title_en: 'Opus Agriculturae: On the Building of the Dovecote',
            category: 'innovation',
            unlockDay: 0,
            icon: '🕊️',
            author: 'Palladius Rutilius Taurus Aemilianus',
            year: 'cca 4. stol. n. l.',
            content: `**Stejný autor, jiná kapitola**

Sýření mléka nebylo jedinou praktickou otázkou, kterou se Palladius ve svém Opus Agriculturae zabýval. Kniha první věnuje samostatnou kapitolu stavbě holubníku — a píše o ní stejně věcně jako o všem ostatním, skoro jako inženýr. Zdi věže musí být zevnitř i zvenčí dokonale hladké a nabílené vápnem; jinak po nich vyleze kuna nebo had a vybere hnízda dřív, než se holubi vzpamatují. Uvnitř řady výklenků — columbaria — v přesných rozměrech, aby měl pár dost místa a soused sousedovi nekazil hnízdo zobáním.

**Krmivo a hnůj**

Palladius radí sypat hrách a vikev — levné, vydatné, snadno dostupné z pole, které zrovna leží ladem. A připojuje poznámku, kterou by žádný teoretik nenapsal: holubí trus, sesbíraný a uležený, patří mezi nejsilnější hnojiva, jaká zahrada zná. Nic se nevyhodí.

*"Zeď, po níž nevyleze ani had, ani kuna, je zeď, která holuby ochrání líp než sebelepší zámek."*

**Klášterní variace**

Palladius psal o římském statku o tisíc let dřív, ale jeho rady cestovaly s mnišskými řády po celé Evropě beze změny — holubník totiž zůstal holubníkem, ať stál v Kampánii nebo na Moravě.

**PROČ TO VÍTE:** Tahle kapitola leží teď otevřená v klášterní knihovně — přesně podle ní byla Porta postavena. Vysvětluje, proč holubník potřebuje proutěné výklenky, proč se krmí hrachem a vikví, a proč zdi čekají na nabílení vápnem, než budou holubi doopravdy v bezpečí.`,
            content_en: `**Same Author, Different Chapter**

Curdling milk was not the only practical matter Palladius addressed in his Opus Agriculturae. Book One devotes a chapter of its own to building a dovecote — and writes of it just as matter-of-factly as everything else, almost like an engineer. The tower's walls must be perfectly smooth and whitewashed with lime, inside and out; otherwise a marten or a snake will climb them and empty the nests before the pigeons know what happened. Inside, rows of niches — columbaria — of precise dimensions, so a pair has room enough and no neighbour pecks apart another's nest.

**Feed and Manure**

Palladius advises scattering peas and vetch — cheap, plentiful, easily had from a field currently lying fallow. And he adds a note no theorist would ever write: pigeon droppings, gathered and left to settle, rank among the strongest manures a garden knows. Nothing goes to waste.

*"A wall that neither snake nor marten can climb protects the pigeons better than any lock."*

**Monastic Variations**

Palladius wrote of a Roman estate a thousand years earlier, but his advice travelled with the monastic orders across Europe unchanged — a dovecote remained a dovecote, whether it stood in Campania or in Moravia.

**WHY YOU KNOW THIS:** This chapter now lies open in the monastery library — it is exactly what the Porta was built by. It explains why the dovecote needs wicker niches, why it is fed on peas and vetch, and why the walls await a coat of lime before the pigeons are truly safe.`
        },
        {
            id: 'book_barid_columbinus',
            title: 'Nihájat al-arab: O holubí poště sultánů',
            title_en: "Nihájat al-arab: On the Sultans' Pigeon Post",
            category: 'innovation',
            unlockDay: 0,
            icon: '📜',
            author: 'Šihāb al-Dín al-Nuwayrí (zprostředkováno janovskými a benátskými kupci)',
            year: '14. stol. (latinský výtah, doba opisu neznámá)',
            content: `**Pošta, jakou Evropa neznala**

Zatímco evropské kláštery chovaly holuby hlavně na maso, vejce a hnůj, na Blízkém východě fungovala celá staletí organizovaná státní holubí pošta zvaná Barid. Al-Nuwayrí, egyptský úředník čtrnáctého století, popsal ve své obrovské encyklopedii Nihájat al-arab logistiku téhle sítě do posledního detailu — a zlomek toho textu, přeložený a zprostředkovaný janovskými kupci, se dostal i sem.

**Ptačí papír a pouzdro**

Zpráva se nepsala na tlustý klášterní pergamen — na to by holub neuletěl daleko. Používal se tenký, lehký, drahý papír, který sotva zašustí ve větru. Připevňoval se buď v drobném pouzdře na nožičce, nebo přivázán hedvábnou nití k ocasnímu peru, aby holubovi nepřekážel v letu.

**Byrokracie, která zachraňovala životy**

Text nejvíc zdůrazňuje registr. Každý pták byl značen — často razítkem na zobáku — a písař vedl přesnou evidenci, který holub patří kam. Sáhnout pro špatného ptáka neznamenalo jen ztracenou zprávu, ale zprávu doručenou do rukou někoho úplně jiného.

*"Kdo nezná svého ptáka, nezná svou zprávu — a kdo neví, kam zpráva doletí, neměl ji posílat vůbec."*

**PROČ TO VÍTE:** Tenhle výtah vysvětluje, odkud se vzal Ptačí papír a proč se s ním zachází tak opatrně — bez něj holubí pošta nedoletí, a bez přesného vedení evidence doletí ke špatným rukám.`,
            content_en: `**A Post Unknown to Europe**

While European monasteries kept pigeons chiefly for meat, eggs, and manure, the Middle East had run an organised state pigeon post called the Barid for centuries. Al-Nuwayrí, a fourteenth-century Egyptian official, described the logistics of this network down to the last detail in his vast encyclopedia Nihájat al-arab — and a fragment of that text, translated and carried by Genoese merchants, made its way even here.

**Bird Paper and Capsule**

A message was not written on thick monastic parchment — a pigeon could never fly far with that. Instead, thin, light, expensive paper was used, one that barely rustled in the wind. It was fastened either in a tiny capsule on the leg, or tied with silk thread to a tail feather, so as not to hinder the bird's flight.

**Bureaucracy That Saved Lives**

The text dwells most on the registry. Every bird was marked — often stamped on the beak — and a clerk kept exact record of which pigeon belonged where. Reaching for the wrong bird meant not just a lost message, but one delivered into entirely the wrong hands.

*"Who knows not his bird knows not his message — and who knows not where a message will land should not have sent it at all."*

**WHY YOU KNOW THIS:** This digest explains where the Bird Paper came from, and why it is handled with such care — without it the pigeon post cannot fly, and without exact record-keeping it arrives in the wrong hands.`
        },
        {
            id: 'book_crescenzi',
            title: 'Liber Ruralium Commodorum: Řád pole a dvora',
            title_en: 'Liber Ruralium Commodorum: The Order of Field and Farmyard',
            category: 'innovation',
            unlockDay: 54,
            icon: '🌾',
            author: "Pietro de' Crescenzi z Boloně",
            year: '1304–1309',
            content: `**Encyklopedie hospodářství, jakou středověk neznal**

Pietro de' Crescenzi byl boloňský právník a správce statků. Po odchodu do důchodu sepsal dílo, které nemělo v tehdejší Evropě obdoby — dvanáctidílnou encyklopedii zemědělství, chovu zvířat a správy hospodářství. Sám v úvodním věnování píše: "Věnuji tuto knihu urozenému pánu Karlovi z Anjou, neboť bez dobrého hospodáře není ani dobrého pána."

**Co kniha skrývá**

Každá kapitola je lahůdkou pro každého, kdo má zájem o zemi, zvíře nebo zásoby:
— Jak volit polohu sýpky, aby do ní nevnikaly myši a vlhkost.
— Kdy sklízet obilí (ne dřív, ne později — záleží na barvě klasů).
— Jak uchovávat víno v sudech a jak poznám, že se kazí.
— Kolik píce potřebuje ovce v zimě, kolik kráva, kolik kůň.
— Jak léčit nemocné drůbež.

Iluminované rukopisy tohoto spisu patřily k největším klenotům klášterních knihoven 14. a 15. století — viděli jsme jeden z nich na vlastní oči, s nádhernou modrou iniciálou a zlatou bordeaux vazbou.

**Česká stopa**

Karel IV. si dal spis přeložit do češtiny. V Čechách 15. století byl Crescenzi v každém větším klášteře. Opat si bez něj nepomyslel stavět novou sýpku.

*"Pán, který nezná pole, nezná ani svůj lid. A hospodář, který nezná zásoby, nezná ani svou zimu."*

**HERNÍ EFEKT:** Odemkne tech *Horreum* — velkou sýpku s kapacitou 1600 jednotek. Zároveň aktivuje mechaniku krmiva: zvířata ve Dvoře začnou vyžadovat denní krmení ze zásob.`,
            content_en: `**An Encyclopaedia of Agriculture Such as the Middle Ages Had Not Known**

Pietro de' Crescenzi was a Bolognese lawyer and estate manager. After retiring, he composed a work without parallel in contemporary Europe — a twelve-part encyclopaedia of agriculture, animal husbandry, and estate management. In the dedicatory preface he writes: "I dedicate this book to the noble lord Charles of Anjou, for without a good steward there is no good lord."

**What the Book Conceals**

Every chapter is a treat for anyone with an interest in land, animals, or stores:
— How to choose the position of a granary so that mice and damp do not enter it.
— When to harvest grain (not too early, not too late — it depends on the colour of the ears).
— How to keep wine in barrels and how to tell when it is turning.
— How much fodder a sheep needs in winter, a cow, a horse.
— How to treat sick poultry.

The illuminated manuscripts of this treatise were among the greatest jewels of monastic libraries in the 14th and 15th centuries — we have seen one with our own eyes: a beautiful blue initial and a gold bordeaux binding.

**The Bohemian Connection**

Charles IV had the treatise translated into Czech. In 15th-century Bohemia, Crescenzi was to be found in every larger monastery. No abbot would think of building a new granary without it.

*"The lord who does not know the field does not know his people. And the steward who does not know his stores does not know his winter."*

**GAME EFFECT:** Unlocks the *Horreum* tech — a large granary with a capacity of 1,600 units. It also activates the fodder mechanic: animals in the Farmyard begin to require daily feeding from the stores.`
        },
        {
            id: 'book_columella_piscinis',
            title: 'De Re Rustica, Kniha VIII: O rybnících a voliérách',
            title_en: 'De Re Rustica, Book VIII: On Fishponds and Aviaries',
            category: 'innovation',
            unlockDay: 92,
            icon: '🎣',
            author: 'Lucius Iunius Moderatus Columella',
            author_en: 'Columella',
            year: 'cca 60–65 n.l.',
            content: `**Muž, který psal o všem**

Lucius Iunius Moderatus Columella byl římský voják a statkář z Hispánie, který v 1. století sepsal dvanáctidílné *De Re Rustica* — nejucelenější římskou encyklopedii hospodářství, jaká se dochovala. Osmá kniha mění téma od polí a vinic k tomu, čemu Římané říkali *pastio villatica* — chov na statku: drůbež, holubníky, a rybníky.

**Rybník jako investice, ne rozmar**

Columella nepíše o rybníku jako o okrase. Píše o něm jako o výnosné části hospodářství, srovnatelné s polem obilí — kde ho vykopat, jak velké mají být přítokové otvory, a proč obsádka musí odpovídat velikosti nádrže, ne touze hospodáře nasadit co nejvíc najednou.

*"Kdo do rybníka nasadí víc, než unese, sklidí neduživé ryby a prázdnou pokladnici. Rybník, jenž je přeplněn, netučnní — hladoví."*

**O výběru ryb**

Columella věnuje pozornost tomu, které ryby se hodí do rybníka spolu a které ne — dravá ryba vedle plůdku znamená jistou ztrátu, pokud hospodář nezná poměr a účel. Zmiňuje i praxi, kterou pozdější staletí zdokonalí do celého systému: oddělit rybník, kde se ryba líhne, od rybníka, kde dorůstá, a od rybníka, odkud se prodává.

**Moravská stopa**

Opisy Columelly kolovaly klášterními knihovnami po celé Evropě jako standardní agronomická příručka — vedle Palladia a Crescenziho patřil k základní výbavě každého kláštera, který bral hospodářství vážně.

*"Pole živí klášter dnes. Rybník ho živí i v den, kdy pole mlčí."*

**HERNÍ EFEKT:** Odemkne výzkum *Piscina — Přehled Hejna* — druhovou evidenci rybníka, chov štiky jako přirozené kontroly hejna, a možnost ulovit konkrétní kus podle druhu místo hromadné sklizně.`,
            content_en: `**The Man Who Wrote of Everything**

Lucius Iunius Moderatus Columella was a Roman soldier and estate-owner from Hispania who, in the 1st century, composed the twelve-book *De Re Rustica* — the most complete Roman encyclopaedia of husbandry to survive. The eighth book shifts subject from fields and vineyards to what the Romans called *pastio villatica* — estate husbandry: poultry, dovecotes, and fishponds.

**A Pond as Investment, Not Indulgence**

Columella does not write of the fishpond as an ornament. He writes of it as a profitable part of the estate, comparable to a field of grain — where to dig it, how large the inflow openings should be, and why the stock must match the size of the basin, not the steward's wish to stock as many as possible at once.

*"He who stocks a pond beyond its bearing shall reap sickly fish and an empty purse. A pond that is overcrowded does not fatten — it starves."*

**On the Choice of Fish**

Columella pays attention to which fish suit a pond together and which do not — a predator beside fry means certain loss, unless the steward knows the ratio and the purpose. He also mentions a practice later centuries would refine into a whole system: to separate the pond where fish hatch from the pond where they grow, and from the pond whence they are sold.

**The Bohemian Connection**

Copies of Columella circulated monastic libraries across Europe as a standard agronomic manual — alongside Palladius and Crescenzi, he belonged to the basic equipment of any monastery that took husbandry seriously.

*"The field feeds the monastery today. The pond feeds it also on the day the field falls silent."*

**GAME EFFECT:** Unlocks the research *Piscina — Overview of the Shoal* — species tracking for the pond, pike husbandry as a natural check on the shoal, and the ability to catch a specific fish by species instead of a bulk harvest.`
        },
        {
            id: 'book_de_animalibus',
            title: 'De Animalibus: Kniha o živé přírodě',
            title_en: 'De Animalibus: On the Nature of Animals',
            category: 'innovation',
            unlockDay: 89,
            icon: '🐭',
            author: 'Albertus Magnus (Albert Veliký)',
            author_en: 'Albertus Magnus',
            year: 'cca 1258–1262',
            content: `**Muž, který se ptal proč**

Albert Veliký — dominikánský mnich, učitel Tomáše Akvinského, patron přírodovědců — napsal na sklonku 13. století dílo, které nemělo v tehdejší Evropě obdoby. De Animalibus bylo dvacetsedmisvazkové pojednání o zvířatech, jejich povaze, chování a anatomii. Ale co z něj dělalo výjimečné dílo, nebyla pouhá kompilace starých autorit.

Albert skutečně pozoroval. Sám. Na vlastní oči.

**Hlodavci v klášterní spíži**

Jednu kapitolu věnoval Albert výhradně hlodavcům — a byla to svým způsobem revoluční věda. Rozlišil různé druhy myší a potkanů. Popsal jejich způsob života: jak hloubí nory (vždy s únikovou chodbou), jak si přenášejí zásoby (v lících, v tlapkách), jak se chovají v kolonii (hierarchie samic), jak se vyhýbají pastem (nová past voní cizím, proto ji ignorují, dokud „zestárne").

*„Mus domesticus,"* píše Albert, *„jest tvor, jenž prospívá z nedbalosti hospodáře. Kde jsou zásoby hlídány a uloženy řádně, tam myš strádá. Kde panuje nepořádek, tam se množí nad míru."*

Toto nebyla alegorie. Byl to poznatek zkušeného hospodáře.

**Kočka jako vědecký nástroj**

Albert věnoval pozornost i kočce. Popsal přesně mechanismus lovu: jak kočka „počítá" vzdálenost skoku, jak dokáže v naprosté tmě sledovat pohyb myši pouze sluchem, proč hladová kočka loví lépe než sytá. Přišel s poznatkem, který kuchyně klášterů aplikovaly velmi pragmaticky: *kočka, které dáš příliš mnoho, přestane lovit. Kočka, které nedáš nic, loví sama od sebe — ale může krást ze zásoby.*

*„Felis domestica,"* uzavírá, *„jest nejlepším myšolovem tehdy, když ji nepřekrmíš, avšak ani neumoříš hladem."*

**Moravská stopa**

Opisovači v olomouckém skriptoriu znali Albertovo dílo. Bylo součástí kanonické vědecké literatury a opat ho doporučoval ke studiu každému bratrovi, jenž měl na starost spíž. Albert sám navštívil Čechy v roce 1247 — tehdy jako provinciál dominikánského řádu.

*„Kdo chce dobře hospodařit, musí znát nejen pole a zásoby, ale i nepřítele zásoby. A nepřítelem zásoby je myš."*

**HERNÍ EFEKT:** Odemkne výzkum *De Animalibus* — přesné sledování myší populace v klášteře. Na Dvoře se zobrazí myší panel s přesným počtem, trendem a dopadem na zásoby.`,
            content_en: `**The Man Who Asked Why**

Albertus Magnus — Dominican friar, teacher of Thomas Aquinas, patron of natural scientists — wrote in the latter half of the 13th century a work without parallel in contemporary Europe. De Animalibus was a twenty-seven-volume treatise on animals, their nature, behaviour, and anatomy. But what made it exceptional was not mere compilation of old authorities.

Albert actually observed. Himself. With his own eyes.

**Rodents in the Monastic Larder**

Albert devoted an entire chapter to rodents — and it was, in its way, revolutionary science. He distinguished between different species of mice and rats. He described their way of life: how they dig burrows (always with an escape tunnel), how they carry stores (in cheeks, in paws), how they behave in a colony (female hierarchy), how they avoid traps (a new trap smells foreign, so they ignore it until it has "aged").

*"Mus domesticus,"* writes Albert, *"is a creature that thrives on the negligence of the steward. Where stores are guarded and properly housed, the mouse suffers. Where disorder reigns, it multiplies beyond measure."*

This was no allegory. It was the insight of an experienced householder.

**The Cat as a Scientific Instrument**

Albert paid close attention to the cat. He described the precise mechanism of hunting: how the cat "calculates" the distance of its leap, how it can track a mouse in total darkness by sound alone, why a hungry cat hunts better than a satiated one. He arrived at an insight that monastery kitchens applied very pragmatically: *a cat given too much ceases to hunt. A cat given nothing hunts by herself — but may steal from the stores.*

*"Felis domestica,"* he concludes, *"is the finest mouser when thou dost not overfeed her, yet dost not starve her either."*

**The Bohemian Connection**

Scribes in the Olomouc scriptorium knew Albert's work. It formed part of the canonical scientific literature and the abbot recommended it to every brother charged with the care of the larder. Albert himself visited Bohemia in 1247 — then as provincial of the Dominican order.

*"He who would keep good stores must know not only the field and the cellar, but the enemy of the cellar. And the enemy of the cellar is the mouse."*

**GAME EFFECT:** Unlocks the *De Animalibus* research — precise tracking of the mouse population in the monastery. A mouse panel appears in the Farmyard, showing exact count, trend, and impact on stores.`
        },
        {
            id: 'book_pegolotti',
            title: 'La Pratica della Mercatura: Zápisky benátského kupce',
            title_en: 'La Pratica della Mercatura: Notes of a Venetian Merchant',
            category: 'history',
            unlockDay: 69,
            icon: '💰',
            author: 'Francesco Balducci Pegolotti (Florencie)',
            year: 'cca 1335–1343',
            content: `**Rukopis, který znal cenu všeho**

Francesco Balducci Pegolotti byl agentem florentské bankovní rodiny Bardi a obchodoval po celé Evropě, Levantě a dokonce až do Číny. Svůj zápisník — La Pratica della Mercatura — psal průběžně jako praktickou příručku pro obchodníky na cestách. Není to filozofie ani teologie. Je to tvrdá realita trhů.

**Co v zápisníku najdete**

Pegolotti zapsal ceny komodit z desítek měst — od Londýna po Caffu na Krymu. Jak se platí v Benátkách, jak v Praze, jak se převádí florentské zlaté na pražské groše. Jaké váhy se používají v Paříži, jaké v Alexandrii. Kdy je trh v Champagne, kdy v Bruges.

A pak — to nejcennější — záznamy o poctivosti. Která obchodní rodina platí včas. Která podvádí na váze. Ke komu se obrátit v Janově, když potřebuješ zálohu. Giacomo Foscari by tuto knihu znal nazpaměť.

**Česká stopa**

Pražský groš byl v době vzniku rukopisu jednou z nejstabilnějších měn Evropy — Pegolotti ho zmiňuje jako "solidní". Čechy vyvážely stříbro, plátno a kůže. Klášterní Cellarius, který obchodoval na trzích, potřeboval přesně tento typ vědění.

*"Každý groš má dvě strany. Na jedné je tvář krále, na druhé cena tvé pověsti. Pečuj o obě stejně."*

**HERNÍ EFEKT:** Odemkne tech *Liber Rationum* — účetní knihu v Cellariu. Každá transakce (nákup, prodej, Giacomo, Trh) se automaticky zapisuje s datem, zbožím a cenou. Vidíš trendy, nejlepší zákazníky a varování před přesycením trhu.`,
            content_en: `**A Manuscript That Knew the Price of Everything**

Francesco Balducci Pegolotti was an agent of the Florentine banking family Bardi and traded throughout Europe, the Levant, and even into China. He wrote his notebook — La Pratica della Mercatura — continuously as a practical guide for merchants on the road. This is no philosophy, no theology. It is the hard reality of markets.

**What the Notebook Contains**

Pegolotti recorded commodity prices from dozens of cities — from London to Caffa in the Crimea. How payment is made in Venice, how in Prague, how to convert Florentine gold florins into Prague groschen. What weights are used in Paris, what in Alexandria. When the fair is in Champagne, when in Bruges.

And then — the most valuable thing — records of trustworthiness. Which merchant family pays on time. Which cheats on the scales. Whom to approach in Genoa when you need an advance. Giacomo Foscari would have known this book by heart.

**The Bohemian Connection**

The Prague groschen was, at the time of writing, one of the most stable currencies in Europe — Pegolotti mentions it as "solid". Bohemia exported silver, linen, and hides. The monastic Cellarius trading at the markets needed precisely this kind of knowledge.

*"Every groschen has two sides. On one is the face of the king; on the other, the price of your reputation. Guard both equally."*

**GAME EFFECT:** Unlocks the *Liber Rationum* tech — the account book in the Cellarium. Every transaction (purchase, sale, Giacomo, Market) is automatically recorded with date, goods, and price. You see trends, your best customers, and warnings of market saturation.`
        },
        {
            id: 'liber_de_cultura_vitis',
            title: 'Liber de Cultura Vitis',
            category: 'viticis',
            unlockDay: 149,
            unlockResearch: 120,
            unlocksTech: ['tech_vinohrad'],
            icon: '🍇',
            author: 'Olomoucký klášterní archiv',
            author_en: 'Olomouc Monastery Archive',
            year: 1423,
            content: `**O povaze révy a jejím množení**

Réva vinná není rostlina pro netrpělivé. Kdo ji zasadí ze semínka, dočká se plodu možná za pět let — a plodu nepředvídatelného, divokého, bez jakékoliv záruky kvality. Proto mniši odjakživa sáhli po řízku: odřežeš jednoletou větev v zimním klidu, zapícháš do vlhké země a čekáš. Réva sama ví, co má dělat.

*"Non ex semine, sed ex sarmente."* — Nikoli ze semínka, ale z ratolesti.

**Odrůdy olomouckého kraje**

Nejstarší odrůdou na Moravě je Bělina, kterou starší písemnosti nazývají Heunisch. Přišla s Římany, přežila Tatary, přečkala mor. Zraje rychle, odpouští chyby, dává mošt sladký i kyselý podle počasí. Vhodná pro každého, kdo teprve začíná.

Klevner — v Burgundsku mu říkají Rulandské bílé — přivezl na Moravu Karel IV. Zraje pomaleji, vyžaduje více péče, ale víno z něj je čisté a trvanlivé. Benediktini ho pěstují v Třebíči již od roku 1101.

Frankovka je jiná — tmavá, modrá, silná. Na Znojemsku ji pěstují s oblibou a říkají, že víno z ní je "velmi kvalitní." Zraje stejně jako Klevner, ale chce jiného odběratele — kupce, který zná cenu červeného.

Tramín červený — vzácný host. Jeho řízek nedostaneš na trhu. Musíš ho získat od vlastní révy nebo od cizince, který prochází. Zraje nejdéle, okno sklizně nejkratší. Ale Vinum Praeclarum z Tramínu — to je víno pro biskupský stůl.

Modrý Janek je znojemská rarita. Mutace Veltlínského zeleného, nízký výnos, tmavé víno zvláštní chuti. Říká se, že má afinitu k ohni Athanoru.

**O prořezu a sklizni**

Réva se prořezává na jaře — v březnu nebo dubnu, dřív než se probudí míza. Bez prořezu réva roste bujně ale plodí chaoticky. S prořezem dáš ratolesti směr a výnos vzroste. A navíc — z ořezaných výhonů získáš řízky pro nové výsadby.

Sklizeň má své okno. Bělina čeká trpělivě — třicet dní. Tramín jen čtrnáct. Kdo prošvihne okno, najde hrozny na zemi.

**Moravská stopa**

Znojemský cech vinařů byl založen 3. listopadu 1486. Horenské právo, perkmistr, každoroční shromáždění vinařů. Klášter v Louce u Znojma vlastnil roku 1620 vinice ve 45 obcích. Réva a klášter patřily k sobě od pradávna.

*"Qui vitam vitis non curat, nec vinum meretur."*
Kdo nepečuje o život révy, nezaslouží si víno.`,
            content_en: `**On the Nature of the Vine and Its Propagation**

The grapevine is no plant for the impatient. Those who plant from seed may wait five years for fruit — unpredictable, wild, with no guarantee of quality. This is why monks have always reached for the cutting: trim a one-year branch in winter dormancy, press it into moist earth, and wait. The vine knows what to do.

*"Non ex semine, sed ex sarmente."* — Not from seed, but from the shoot.

**Varieties of the Olomouc Region**

The oldest variety in Moravia is Bělina, which older manuscripts call Heunisch. It came with the Romans, survived the Tatars, outlasted the plague. It ripens quickly, forgives mistakes, gives must sweet or sour depending on the weather. Suitable for any beginner.

Klevner — in Burgundy they call it Pinot Blanc — was brought to Moravia by Charles IV. It ripens more slowly, demands more care, but the wine is clean and lasting. The Benedictines have grown it in Třebíč since 1101.

Frankovka is different — dark, blue, strong. In the Znojmo region they say the wine is "very fine." It ripens like Klevner, but requires a different buyer — one who knows the value of red.

Red Traminer — a rare guest. Its cutting cannot be found at market. You must obtain it from your own vine, or from a stranger passing through. It ripens the latest, its harvest window the shortest. But Vinum Praeclarum from Traminer — that is wine for the bishop's table.

Modrý Janek is a Znojmo rarity. A mutation of Grüner Veltliner, low yield, a dark wine of peculiar taste. It is said to have an affinity with the fire of the Athanor.

**On Pruning and Harvest**

The vine is pruned in spring — March or April, before the sap wakes. Without pruning the vine grows lush but yields chaotically. With pruning you give the shoot direction, and yield increases. And moreover — from the trimmed shoots you gain cuttings for new plantings.

The harvest has its window. Bělina waits patiently — thirty days. Traminer only fourteen. Those who miss the window find the grapes on the ground.

**The Moravian Thread**

The Znojmo winemakers' guild was founded on 3 November 1486. Horenské právo, the perkmistr, the annual assembly of vintners. The monastery at Louka near Znojmo held vineyards in 45 villages by 1620. Vine and monastery have belonged together since time immemorial.

*"Qui vitam vitis non curat, nec vinum meretur."*
He who does not tend the life of the vine does not deserve the wine.`
        },
        {
            id: 'libro_de_arte_coquinaria',
            title: 'Libro de Arte Coquinaria',
            category: 'coquina',
            unlockDay: 44,
            unlockResearch: 45,
            unlocksTech: ['tech_ars_coquinaria'],
            icon: '🦞',
            author: 'Martino de Rossi',
            author_en: 'Martino de Rossi',
            year: 1465,
            content: `**Mistr, který vařil pro patriarchy**

Do kláštera dorazil svazek, o kterém se šeptá po celé Itálii. Jeho autor, Martino de Rossi, vaří pro patriarchu z Aquileje a pro nejvyšší římskou šlechtu — a jako první kuchař v paměti lidstva se rozhodl své umění zapsat vlastním jménem, ne jako anonymní sbírku receptů. Učenci mu už dnes říkají první "hvězdný kuchař" Evropy.

*"Chi cucina con arte, nutre non solo il corpo, ma anche l'onore della casa."*
Kdo vaří s uměním, sytí nejen tělo, ale i čest domu.

**Co je v knize**

Martino nepohrdá ničím, co dá řeka, mokřad nebo les. Raci, vaření celí ve slabém pivu s kmínem, dokud nezčervenají. Hlemýždi, vytažení z ulit dřívkem, omytí v octové vodě, dušení v omáčce zahuštěné chlebem. Žabí stehýnka, stažená a osmažená na sádle s česnekem — pokrm, který šlechta jí stejně dychtivě jako prostý lid, jen z jiného nádobí.

**Osud knihy**

Zvláštní je, jak se tahle kniha bude šířit dál. Humanista jménem Bartolomeo Sacchi, zvaný Platina, si Martinovo dílo za pár let vypůjčí — a beze slova o původu ho vydá tiskem jako *De honesta voluptate et valetudine*. Bude to první vytištěná kuchařka v dějinách. Někteří říkají, že spravedlnost dohnala i tiskaře: kdo krade cizí recepty, ať aspoň nakrmí celou Evropu.

**HERNÍ EFEKT:** Přečtením této knihy odemkneš tech *Ars Coquinaria* — umění vařit raky, hlemýždě a žabí stehýnka. Bez ní se tech dá vyzkoumat i normálně, ale kniha ti ho dá dřív a levněji.`,
            content_en: `**The Master Who Cooked for Patriarchs**

A volume arrived at the monastery that all of Italy whispers about. Its author, Martino de Rossi, cooks for the Patriarch of Aquileia and for the highest Roman nobility — and as the first cook within living memory, he chose to set his art down under his own name, not as an anonymous collection of recipes. Scholars already call him Europe's first "celebrity chef."

*"Chi cucina con arte, nutre non solo il corpo, ma anche l'onore della casa."*
Whoever cooks with art nourishes not only the body, but the honour of the house.

**What the Book Contains**

Martino scorns nothing the river, the marsh, or the forest provides. Crayfish, boiled whole in weak beer with caraway until they redden. Snails, drawn from their shells with a small stick, washed in vinegar water, stewed in a sauce thickened with bread. Frog legs, skinned and fried in lard with garlic — a dish nobility eats as eagerly as common folk, only from finer dishware.

**The Book's Fate**

It is strange how this book will spread further. A humanist named Bartolomeo Sacchi, called Platina, will borrow Martino's work within a few years — and publish it in print, without a word of its origin, as *De honesta voluptate et valetudine*. It will be the first printed cookbook in history. Some say justice caught up with the printer too: whoever steals another's recipes had better feed all of Europe in return.

**GAME EFFECT:** Reading this book unlocks the *Ars Coquinaria* tech — the art of preparing crayfish, snails, and frog legs. It can also be researched normally without the book, but the book grants it sooner and cheaper.`
        },
        {
            id: 'herbarium_populare',
            title: 'Herbarium Populare',
            category: 'coquina',
            unlockDay: 38,
            unlockResearch: 35,
            unlocksTech: ['tech_cultus_herbarum'],
            icon: '🌿',
            author: 'Neznámý bratr, klášterní herbář',
            author_en: 'An unknown brother, monastery herbarium',
            year: 1464,
            content: `**Kniha bez jména**

Nikdo neví, kdo tenhle svazek sepsal. Žádný erb na deskách, žádné jméno v kolofonu — jen desetiletí sbíraná moudrost venkovských žen a klášterních zahradníků, zapsaná bratrem, kterému na slávě evidentně nezáleželo. Je to sbírka toho, co roste samo, bez setí, bez péče — a přesto sytí, když obilí nestačí.

*"Quod terra sponte dat, sapiens non spernit."*
Co země dává sama od sebe, moudrý nepohrdá.

**Co se v ní píše**

Kopřiva a bršlice kozí noha, spařené a nasekané do jarní kaše s kroupami. Kořen lopuchu, vykopaný na podzim, pečený v popelu, když obilí došlo. Šípky, namočené přes noc a rozvařené na jíchu, zahuštěnou starým chlebem místo drahého koření. Smrže, ty nejvzácnější z jarních hub, plněné bylinkami a pečené v hliněné nádobě.

**Ozvěna budoucnosti**

Zvláštní je, jak podobné recepty — slovo od slova — se o šedesát let později objeví tištěné pod jménem Bavora Rodovského z Hustiřan. Možná opsal stejný pramen. Možná se lidová moudrost prostě nikdy neztratí, jen čeká, až ji někdo znovu zapíše.

**HERNÍ EFEKT:** Přečtením této knihy odemkneš tech *Cultus Herbarum* — základ pro budoucí zpracování divokých bylin, kořenů a hub. Recepty samotné přibudou postupně, jak bude klášter svou znalost rozšiřovat.`,
            content_en: `**A Book Without a Name**

No one knows who wrote this volume. No coat of arms on the cover, no name in the colophon — only decades of wisdom gathered from country women and monastery gardeners, set down by a brother who plainly cared nothing for fame. It is a collection of what grows on its own, without sowing, without tending — and yet feeds when the grain runs short.

*"Quod terra sponte dat, sapiens non spernit."*
What the earth gives freely, the wise man does not scorn.

**What It Contains**

Nettle and ground elder, scalded and chopped into a spring porridge with groats. Burdock root, dug in autumn, baked in ashes when the grain has run out. Rosehips, soaked overnight and boiled down into a sauce, thickened with stale bread in place of costly spice. Morels, the rarest of spring mushrooms, stuffed with herbs and baked in a clay dish.

**An Echo of the Future**

It is strange how similar recipes — word for word — will appear in print sixty years hence, under the name of Bavor Rodovský z Hustiřan. Perhaps he copied the same source. Or perhaps folk wisdom is never truly lost — it only waits for someone to set it down again.

**GAME EFFECT:** Reading this book unlocks the *Cultus Herbarum* tech — the foundation for future preparation of wild herbs, roots, and mushrooms. The recipes themselves will arrive gradually, as the monastery's knowledge grows.`
        },
        {
            id: 'regula_infirmis_fratribus',
            title: 'Regula Benedicti — Caput XXXVI',
            category: 'valetudo',
            unlockDay: 40,
            unlockResearch: 35,
            unlocksTech: ['tech_infirmarium'],
            icon: '📖',
            author: 'Benedikt z Nursie',
            author_en: 'Benedict of Nursia',
            year: 1465,
            content: `**De infirmis fratribus — O nemocných bratřích**

Bratr Infirmarius listuje ve staré opsané Řeholi, hledaje oporu pro to, co klášter už dávno tuší, ale dosud nevyřkl nahlas: nemocní bratři potřebují víc než modlitbu.

Kapitola třicátá šestá je krátká, ale nekompromisní. Svatý Benedikt v ní klade péči o nemocné nade všechno ostatní jednání v klášteře — dřív než poslušnost, dřív než mlčení, dřív než práce rukou. Slabý bratr nemá být trestán za to, že je slabý.

Řehole přikazuje tři konkrétní věci. Za prvé: nemocní mají dostat vlastní místnost, oddělenou od společného dormitáře, kde je neruší zvon k Officiu ani chlad kamenné podlahy. Za druhé: má jim sloužit bratr, kterého Bůh obdařil bázní a pečlivostí — ošetřovatel, ne pouhý dozorce. Za třetí, a to je věta, nad kterou se leckterý mladý mnich pozastaví: nemocným se povoluje maso a koupel, cokoliv zdraví bratři odpírají svému tělu z kázně, slabým se má poskytnout z milosrdenství.

Infirmarius zavírá knihu. Řehole nežádá zázrak. Žádá jen místnost, ruce a trochu masa v hrnci. To se dá postavit.

**HERNÍ EFEKT:** Přečtením této knihy odemkneš stavbu *Infirmaria* — vlastní síň pro nemocné, oddělenou od Templa. Lze také vyzkoumat běžně bez knihy, ale kniha to umožní dřív a levněji.`,
            content_en: `**De infirmis fratribus — On the Sick Brothers**

Brother Infirmarius leafs through the old copied Rule, searching for grounds for something the monastery has long suspected but never said aloud: sick brothers need more than prayer.

Chapter thirty-six is short but uncompromising. Saint Benedict places care of the sick above every other observance of the house — before obedience, before silence, before manual labor. A weak brother is not to be punished for his weakness.

The Rule commands three concrete things. First: the sick are to have their own room, set apart from the common dormitory, where the bell for the Office and the cold of the stone floor cannot reach them. Second: they are to be served by a brother whom God has endowed with fear of Him and with diligence — an attendant, not merely a guard. Third, and this is the line at which many a young monk pauses: the sick are permitted meat and baths, whatever the healthy deny their bodies out of discipline is to be granted the weak out of mercy.

Infirmarius closes the book. The Rule asks for no miracle. It asks only for a room, a pair of hands, and a little meat in the pot. That can be built.

**GAME EFFECT:** Reading this book unlocks construction of the *Infirmarium* — its own hall for the sick, separate from the Templum. It can also be researched normally without the book, but the book grants it sooner and cheaper.`
        },
        {
            id: 'hortulus_walahfrid',
            title: 'Hortulus',
            category: 'valetudo',
            unlockDay: 50,
            unlockResearch: 45,
            unlocksTech: ['tech_infirmarium_hortulanus'],
            icon: '🌿',
            author: 'Walahfrid Strabo',
            author_en: 'Walahfrid Strabo',
            year: 1465,
            content: `**Hortulus — Zahrádka**

Opis básně starý bezmála šest set let, a přesto voní hlínou, jako by ji autor napsal včera. Walahfrid, kdysi opat na ostrově Reichenau, ji sepsal jako mladý mnich — čtyři sta čtyřicet čtyři veršů o vlastnoručně obdělané zahrádce, věnovaných příteli Grimaldovi ze Sankt Gallen.

Není to suchý herbář. Walahfrid popisuje, jak si od jara dře ruce v hlíně, jak plevel dusí sazenice dřív, než stačí vzejít, a teprve pak, řádku po řádce, čtyřiadvacet bylin, které v té zahrádce pěstoval — šalvěj, routu, meduňku, mátu, mandragoru. U každé nejen jméno, ale k čemu je dobrá a jak se s ní zachází.

Infirmarius čte a přemýšlí, kolik z těch čtyřiadvaceti by se uchytilo i tady, na Moravě, o šest století později. Hlína je hlína. Nemoc je nemoc. A bylinář, který ví, co roste za zdí jeho vlastní ošetřovny, nemusí čekat na kupce z města.

**HERNÍ EFEKT:** Přečtením této knihy odemkneš léčivou zahrádku Infirmaria a konvrší úkol *Bylinář*. Lze také vyzkoumat běžně bez knihy, ale kniha to umožní dřív a levněji.`,
            content_en: `**Hortulus — The Little Garden**

A copy of a poem nearly six hundred years old, and yet it still smells of turned earth, as if written yesterday. Walahfrid, once abbot of the island of Reichenau, wrote it as a young monk — four hundred and forty-four verses about a garden he tended with his own hands, dedicated to his friend Grimald of St. Gallen.

It is no dry herbal. Walahfrid describes how from spring onward he wears his hands raw in the soil, how weeds choke the seedlings before they can rise, and only then, line by line, the twenty-four herbs he grew in that garden — sage, rue, lemon balm, mint, mandrake. For each, not only the name but what it is good for and how it is to be handled.

Infirmarius reads and wonders how many of those twenty-four would take root here too, in Moravia, six centuries later. Soil is soil. Illness is illness. And a herbalist who knows what grows behind his own infirmary's wall need not wait for a merchant from town.

**GAME EFFECT:** Reading this book unlocks the Infirmarium's physic garden and the Hortulanus lay-brother task. It can also be researched normally without the book, but the book grants it sooner and cheaper.`
        },
        {
            // TODO: text/zdroj dodá Ondrex — nahradit content/content_en, případně author/year/icon
            id: 'liber_de_recreatione',
            title: 'Liber de Recreatione',
            category: 'valetudo',
            unlockDay: 160,
            unlockResearch: 140,
            unlocksTech: ['tech_ars_recreationis'],
            icon: '🛌',
            author: 'Neznámý bratr, klášterní tradice',
            author_en: 'An unknown brother, monastic tradition',
            year: 1465,
            content: `**[PLACEHOLDER — čeká na dodání textu]**

Tento zápis zatím nemá finální znění.

**HERNÍ EFEKT:** Přečtením této knihy odemkneš tech *Ars Recreationis* — únava (Fatigue) se odbourává 2× rychleji.`,
            content_en: `**[PLACEHOLDER — text pending]**

This entry does not yet have its final wording.

**GAME EFFECT:** Reading this book unlocks the *Ars Recreationis* tech — Fatigue recovers 2× faster.`
        },
        {
            id: 'book_buch_der_natur',
            title: 'Buch der Natur: O rybách',
            title_en: 'Buch der Natur: On Fishes',
            category: 'technical',
            unlockDay: 299,
            icon: '🐋',
            author: 'Konrad von Megenberg',
            year: 'cca 1350 (opisováno do 15. stol.)',
            content: `**První přírodopis v mateřském jazyce**

Konrad von Megenberg sepsal ve 14. století *Buch der Natur* — první přírodovědnou encyklopedii psanou německy, ne latinsky. Opis měl skoro každý větší klášter ve střední Evropě. Kapitola *Von den Fischen* (O rybách) popisuje i dva obry: **Huso** (vyzu) a **Sturio** (jesetera).

**Obři, co táhli od moře**

Megenberg zaznamenává jejich jarní tah — z moře proti proudu velkých řek, až k výtěru. V roce 1465 to znamenalo, že tyhle několikasettilové obry bylo možné potkat i na řece pod samotnou Olomoucí. Popisuje jejich obrovské rozměry a zvláštní vlastnost kůže a vnitřností — "zázračnou lepkavou moc". O jikrách píše jako o výživném pokrmu, který smí na stůl i o nejpřísnějším postu.

*"Kdo rozumí rybám řeky, rozumí i tomu, co posílá moře do hlubin země."*

**HERNÍ EFEKT:** Přečtením této knihy (spolu s příslušným výzkumem) odemkneš jarní **Tah vyz** v Piscině — bez znalosti, kdy obry čekat, zátaras zůstane prázdný.`,
            content_en: `**The First Natural History in a Vernacular Tongue**

Konrad von Megenberg wrote the *Buch der Natur* in the 14th century — the first natural history encyclopaedia written in German rather than Latin. Nearly every major monastery in Central Europe owned a copy. The chapter *Von den Fischen* (On Fishes) describes two giants: **Huso** (the beluga) and **Sturio** (the sturgeon).

**Giants That Ran from the Sea**

Megenberg records their spring migration — from the sea, upriver, to spawn. In 1465 that meant these many-hundred-kilogram giants could be met on the river even below Olomouc itself. He describes their vast size and a peculiar property of their skin and innards — a "miraculous sticking power." He writes of their roe as a nourishing dish permitted even during the strictest fast.

*"He who understands the fish of the river also understands what the sea sends into the depths of the land."*

**GAME EFFECT:** Reading this book (together with the matching research) unlocks the spring **Sturgeon Run** in the Piscina — without knowing when to expect the giants, the weir stays empty.`
        },
        {
            id: 'book_cennini_libro_dellarte',
            title: "Il libro dell'arte: O barvách a zlatu",
            title_en: "Il libro dell'arte: On Colours and Gold",
            category: 'technical',
            unlockDay: 305,
            icon: '🎨',
            author: 'Cennino Cennini',
            year: 'cca 1400',
            content: `**Řemeslo psané pro učně**

Cennino Cennini sepsal kolem roku 1400 *Il libro dell'arte* — praktickou příručku malířského a iluminátorského řemesla, psanou ne pro učence, ale pro učně. Přesně proto přežila a šířila se po celé Evropě.

**Klih, co nežloutne**

Cennini popisuje *colla di pesce* — rybí (vyzí) klih — jako nezbytný pro fixaci nejdražšího modrého pigmentu, lapisu lazuli, a jako podklad pod plátkové zlato. Na rozdíl od běžného kostního klihu nežloutne a netrhá jemný pergamen — malá věc, co rozhoduje, jestli iluminace vydrží staletí, nebo popraská za pár let.

*"Mistře, dřív než sáhneš po zlatě, připrav si čistý klih. Zlato bez pojiva je jen prach na listu."*

**HERNÍ EFEKT:** Zatím čistě lore — recepty na prémiové iluminátorské barvy s vyzím klihem čekají na budoucí rozšíření Scrinia.`,
            content_en: `**A Craft Written for Apprentices**

Cennino Cennini wrote *Il libro dell'arte* around 1400 — a practical handbook of painting and illumination, written not for scholars but for apprentices. That is precisely why it survived and spread across Europe.

**The Glue That Never Yellows**

Cennini describes *colla di pesce* — fish (sturgeon) glue — as essential for fixing the most expensive blue pigment, lapis lazuli, and as an underlayer for gold leaf. Unlike ordinary bone glue, it does not yellow and does not tear the fine parchment — a small thing that decides whether an illumination lasts centuries or cracks within a few years.

*"Master, before thou reach for gold, prepare thy purest glue. Gold without a binder is but dust upon the leaf."*

**GAME EFFECT:** Lore only for now — recipes for premium illuminator's pigments using isinglass await a future expansion of the Scrinium.`
        },
        {
            id: 'book_strasburger_manuskript',
            title: 'Strasburský rukopis: O čiření nápoje',
            title_en: 'The Strasbourg Manuscript: On Clarifying Drink',
            category: 'coquina',
            unlockDay: 311,
            icon: '🍺',
            author: 'Neznámý cechovní mistr',
            author_en: 'An unknown guild master',
            year: '15. století',
            content: `**Cechovní vědění, ne klášterní**

Strasburský rukopis je nejvýznamnější německy psaný cechovní receptář 15. století, hojně opisovaný a šířený po střední Evropě. Na rozdíl od klášterních spisů nevznikl v skriptoriu, ale v dílně — a přesto skončil i v klášterních knihovnách, protože sládci a vinaři byli mniši stejně jako písaři.

**Rybí měchýř na dně sudu**

Rukopis popisuje, jak čistit víno a pivo pomocí rybích měchýřů — klih na sebe naváže kaly a stáhne je ke dnu, čímž vznikne křišťálově čistý nápoj místo kalného. Prostý trik, co dělá z obyčejného piva zboží hodné prodeje ve městě.

*"Kalný nápoj kalí i mysl. Čistý klih, čistý mok, čistá hlava."*

**HERNÍ EFEKT:** Zatím čistě lore — čiření piva vyzím klihem čeká na budoucí Pivovar (endgame větev).`,
            content_en: `**Guild Knowledge, Not Monastic**

The Strasbourg Manuscript is the most important German-language guild recipe book of the 15th century, widely copied and circulated across Central Europe. Unlike monastic treatises it did not originate in a scriptorium but in a workshop — and yet it still found its way into monastery libraries, since brewers and vintners were monks just as much as scribes were.

**A Fish Bladder at the Bottom of the Barrel**

The manuscript describes how to clarify wine and beer using fish bladders — the glue binds the sediment and draws it to the bottom, producing a crystal-clear drink instead of a cloudy one. A simple trick that turns ordinary beer into goods worthy of sale in town.

*"A cloudy drink clouds the mind as well. Clean glue, clean brew, clear head."*

**GAME EFFECT:** Lore only for now — clarifying beer with isinglass awaits the future Brewery (endgame branch).`
        }
    ],

    
// ================================================
// 2. TECH TREE LORE - Flavor text pro každou technologii
// ================================================

// Kategorie pro filtrování
    categories: {
        'history': { name: 'Historie Tisku', icon: '📜', desc: 'Krvavé počátky, zrady a triumfy prvních tiskařů.' },
        'innovation': { name: 'Inovace', icon: '💡', desc: 'Technologické milníky, které navždy změnily tvář knih.' },
        'conflict': { name: 'Konflikty', icon: '⚔️', desc: 'Cenzura, války písařů a zničené knihovny.' },
        'local': { name: 'Praha & Čechy', icon: '🏰', desc: 'Tajemství pražských uliček a českých luhů.' },
        'viticis': { name: 'Vinohradnictví', icon: '🍇', desc: 'Réva, víno a tajemství klášterních vinohradů.' }
    }
};

const TechLoreDB = {
    'tech_candle': `*"Pan Fust tiskl tak rychle a neúnavně, že si prostý lid šeptal o smlouvě s temnotami. Ale skutečným démonem byla jen lidská ctižádost a světlo svíček odhalující tajemství inkoustu..."*

Čistý včelí vosk byl v temném středověku považován za téměř posvátný materiál, vyhrazený oltářům. Obyčejný lid svítil páchnoucím lojem. Rané tiskařské dílny však musely pracovat dlouho do noci – lisy nesměly stát, investice byly obrovské. Každá hodina navíc, vykoupená drahou voskovou svící, znamenala drtivou konkurenční výhodu. Světlo znamenalo vědění.`,
    
    'tech_backpack': `*"Pořádek v batohu je odrazem pořádku v tvé mysli. Chaos je nástrojem ďábla."*

Organizace je absolutním základem každého klášterního scriptoria i tiskařské dílny. Věděl jsi, že přísné benediktinské kláštery měly dokonalé katalogizační systémy a pojízdné knihovny již ve 12. století? Mniši na cestách museli nosit těžké pergamenové kodexy a relikvie tisíce mil přes nebezpečné hvozdy. Dobré zavazadlo znamenalo rozdíl mezi uchováním vědomostí a jejich ztrátou v bahně.`,
    
    'tech_alchemy_1': `*"Alchymisté Rudolfa II. bláhově hledali zlato a elixír mládí, ale v dýmu svých pecí nalezli něco cennějšího – skutečnou moudrost. Bylinky často léčí víc než zaříkávání..."*

Dlouho předtím, než se zrodila moderní medicína, představovaly rozlehlé klášterní zahrady na pražském Strahově vrchol vědy. Pěstovaly přes 500 druhů pečlivě roztříděných léčivých rostlin. První alchymie nehledala jen transmutaci kovů, ale i rovnováhu čtyř lidských humorů (šťáv).`,
    
    'tech_cooking_1': `Klášterní kuchyně byly obrovskými laboratořemi přežití. Nasycení stovek bratrů a poutníků vyžadovalo železnou logistiku. Vaření zde nebylo jen řemeslem, byla to každodenní alchymie – proměna syrových, často tvrdých darů země v živící pokrm. 

Když přišel přísný půst a maso bylo zakázáno, mniši se spoléhali na husté polévky a silné pivo, zvané "tekutý chléb". *"Teplé jídlo zahřívá prokřehlé tělo, ale poctivé studium zahřívá nesmrtelnou duši."*`,
    
    'tech_fishing': `*"Rybář čeká v tichu, naprosto odevzdán, jako mnich čekající na Boha."* - oblíbená klášterní analogie z 13. století.

Pátek byl tradičně dnem odříkání a rybím dnem. Mocné rody a kláštery (např. v jižních Čechách) proměnily krajinu výstavbou monumentálních rybníků. Český kapr, šlechtěný pro maso, je vlastně husitský vynález! Rybníky představovaly bezpečné zlato středověku.`,
    
    'tech_foraging': `Bratři bylináři a lesníci znali každý jedovatý druh houby, každý prospěšný kořínek a každou bobuli ukrytou v hlubokých hvozdech. Zatímco pro obyčejný lid byl hluboký les plný děsivých pohanských běsů a vlků, pro vzdělané mnichy to byla jen další kniha.

Jejich znalost byla ústně i písemně předávána z generace na generaci. *"Hluboký les je jen nespoutaná knihovna přírody. Stačí umět číst v listí."*`,
    
    'tech_cooking_2': `Pokročilé receptury vyžadovaly suroviny z dovozu, jako šafrán či pepř, a hlavně nadlidskou trpělivost. Pece a ohniště v klášterech nikdy nevyhasly. Tradiční masový guláš či kaše se vařily celý boží den, silná kostní polévka probublávala nad řeřavými uhlíky celou noc.

*"Dobrá a silná polévka potřebuje svůj čas, aby vydala sílu, úplně stejně jako dobrá kniha potřebuje čas, aby vydala svou myšlenku."*`,
    
    'tech_garden_expand': `Přísná benediktinská řehole, sepsaná v 6. století, stála na tvrdé zásadě: *"Ora et labora"* - modli se a pracuj. Fyzická práce v hlíně byla vnímána jako očista od hříchů.

Každý mnich měl přidělený svůj vlastní záhon, a každý tento záhon byl vnímán jako malý, symbolický kousek ztraceného Ráje. Rozšíření vaší zahrady neznamená jen více bylin, znamená to rozšíření hranic vašeho osobního Edenu.`,
    
    'tech_herbalism_2': `České klášterní bylinářství bylo proslulé napříč Svatou říší římskou. Měsíček na hnisající rány, třezalka (lidově zvaná krevníček) na melancholii a zahnání zlých duchů, dobromysl na čistou mysl – to vše bylo precizně katalogizováno již ve 12. století.

*"Byliny jsou přímý dar matky Země moudrým, kteří umí naslouchat a ne jen brát."*`,
    
    'tech_composting': `Byla to hnilobná, zapáchající alchymie – zázračná proměna zbytečného odpadu v životodárnou živinu. Benediktinští mniši nevnímali hnůj jako špínu, ale jako základ života. Měli kompostové jámy vystavěné s takovou pečlivostí, jako by šlo o katedrály pro žížaly.

*"Nic nevznikne z ničeho, a nic se na tomto světě neztratí, jen to změní svou formu."* - Aristoteles (a každý moudrý zahradník).`,
    
    'tech_alchemy_2': `Pokročilá alchymistická a lékařská praxe vyžadovala nesmírně nebezpečné, hraniční ingredience. Rulík zlomocný (belladonna) – rostlina temně krásná, způsobující halucinace a při špatném dávkování naprosto smrtící. Ženy si ji kapaly do očí pro krásu, mniši ji používali proti křečím.

*"Jed je to, co léčí, a lék je to, co zabíjí. Rozdíl mezi oběma je jen a pouze ve správné dávce."* - Paracelsus`,
    
    'tech_alchemy_3': `Mistrovské bylinné lektvary kombinovaly i desítky vzácných složek a minerálů z celého světa. Každá konkrétní bylina měla svůj přesně stanovený čas sběru (např. o svatojánské noci) a vyžadovala správnou fázi měsíce, aby měla tu nejvyšší astrologickou potenci.

*"Alchymie není jen míchání, je to trpělivost sama. Zlaté dílo nelze uspěchat."*`,
    
    'tech_alchemy_4': `Pověstný Lektvar spánku neboli *Spongia somnifera* (soporifiká houba) představovala středověkou anestézii, která zachraňovala příčetnost. Obsahovala extrakty z muchomůrky, opiového máku a rulíku. Zkušení ranhojiči a chirurgové houbu napustili lektvarem a přiložili pacientovi na tvář před drastickými operacemi a amputacemi.

*"Spánek je malá smrt, probuzení z něj je znovuzrození do nového dne."*`,
    
    'tech_monastery_wisdom': `Kláštery nebyly jen domy modliteb. Byla to opevněná centra prežití. Studium českých klášterů, jako je starobylý Břevnov (založen již 993) či vznešená Zlatá Koruna (1263), zachránilo antickou vzdělanost. Mniši za tlustými kamennými zdmi trpělivě uchovávali znalosti po celý temný středověk.

*"Klášter je nedobytná pevnost vědění, osamělý maják v nekonečném moři lidské nevědomosti a válek."*`,
    
    'tech_czech_herbs': `Věhlas českých léčivých bylin a bylinných mastí sahal daleko za hranice království. Byly exportovány do celé Evropy jako luxusní farmaceutické zboží. Mniši si své speciální receptury na masti bedlivě střežili jako obchodní tajemství.

*"Tato země zná léky na každou bolest, jen je třeba pokleknout do hlíny a naslouchat."*`,
    
    'tech_advanced_farming': `Již vzpomínané zahrady strahovských premonstrátů nepěstovaly jen pár cibulek, ale plných 500 druhů užitkových rostlin. Zavedli systematickou rotaci plodin (trojpolní systém), pokročilé kompostování a rané metody křížení a šlechtění osiva. Skutečná středověká agrární revoluce!

**HERNÍ EFEKT: +50% rychlejší růst všech plodin na záhoncích!**`,
    
    'tech_preservation': `Přežití dlouhých, krutých zim znamenalo přežití národa. Kláštery mistrně zvládaly nasolování, uzení, kvašení a sušení. Dokonce uchovávaly cenná semena rostlin ponořená v sudech s medem – v tomto stavu vydržela klíčivá i přes 50 let! Byla to vlastně úplně první genová banka na světě.

**HERNÍ EFEKT: Veškeré vyprodukované jídlo se kazí o polovinu pomaleji (vydrží 2x déle)!**`,
    
    'tech_master_alchemist': `Císař Rudolf II. se na přelomu 16. a 17. století rozhodl proměnit Prahu v hlavní město magie. Shromáždil přes 300 špičkových alchymistů, astrologů i prachobyčejných podvodníků z celého známého světa (1583). Zlatá ulička bzučela jako úl podivuhodnými experimenty. Ačkoliv bájné zlato z olova nikdy nevytvořili, mimoděk tím nastartovali obory moderní chemie, metalurgie a farmacie.`,
    
    'tech_illumination': `Slovo iluminace pochází z latinského *illuminare* (osvětlit). Je to dechberoucí umění ručního zdobení pergamenových rukopisů plátkovým zlatem a drcenými drahokamy (např. lapis lazuli pro modrou). České bohatě iluminované bible (např. Bible Václava IV.) představují absolutní vizuální vrchol gotického umění v Evropě.

*"Každá vymalovaná stránka je modlitbou otisknutou v barvách a zlatém prachu."*`,
    
    'tech_astrology': `Pozice planet podle středověkého přesvědčení určovaly nejen počasí a úrodu, ale i samotný osud králů. Pověstný dánský astronom Tycho Brahe našel útočiště na dvoře v Praze, kde roku 1601 za podivných okolností zemřel. Geniální Pražský orloj (dokončený roku 1410 mistrem Mikulášem z Kadaně) ukazuje přesné pozice Slunce, Měsíce a znamení zvířetníku do dnešních dnů a zůstává mechanickým zázrakem světa.

*"Hvězdy nepíšou jen na oblohu, hvězdy píší přímo naše osudy."*`,
    
    'tech_czech_glass': `Lesní sklářské hutě produkovaly od 13. století hotové zázraky. Naše potašové sklo bylo pro svou čistotu a tvrdost naprostým fenoménem. Samotné pyšné Benátky se po staletí marně snažily okopírovat naše výrobní techniky a brusy. Český krvavý granát zasazený ve zlatě byl často ceněn výše než diamanty a sloužil jako platidlo šlechty.`,
    
    'tech_games': `Když večer utichly modlitby a přestaly klapat tiskařské lisy, nastoupil hazard. Středověké deskové a karetní hry (Trumf, Vrhcáby, Karnöffel nebo mystický Tarot s ručně malovanými kartami) vládly krčmám i šlechtickým dvorům. Církev i úřady je zuřivě zakazovaly pro marnotratnost, karban a opilství, které je vždy provázelo.

*"Ukaž mi, jak a s čím hraješ, a já ti řeknu, jaký máš odraz na duši."*`
};



// ================================================
// 3. EASTER EGGS - Skryté achievementy a speciální itemy
// ================================================