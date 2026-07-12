// ─────────────────────────────────────────────────────────────
// ConversiRosterDB — autorský roster konvršů
// MRD: conversi-relationship-module-reference.md
// Krok 2-4: infrastruktura + texty + napojení HOTOVO. game.js čte roster
// při najímání (hireKonvrs), traity (_konvrsTraits) i vazby (_runKapitula).
// ─────────────────────────────────────────────────────────────

const ConversiRosterDB = {
    k_jakub: {
        name: 'Jakub',
        icon: '⚔️',
        origin_cs: 'Táhl s vojskem od Lipan až po Uhry, a když už nebylo za koho bojovat, zbyl mu jen meč a špatné sny. Meč prodal u brány. Sny si nechal.',
        origin_en: 'He marched with armies from Lipany to Hungary, and when there was no one left to fight for, all he had was a sword and bad dreams. He sold the sword at the gate. The dreams he kept.',
        quotes: {
            hire:     { cs: 'Umím kopat, nosit a mlčet. Víc toho po mně nechtěj.',
                        en: 'I can dig, carry, and keep quiet. Ask no more of me.' },
            work:     { cs: 'Lopata je lehčí než halapartna. To mi stačí.',
                        en: 'A shovel is lighter than a halberd. That is enough for me.' },
            tired:    { cs: 'Spal jsem v blátě u Lipan. Tohle není únava.',
                        en: 'I slept in the mud at Lipany. This is not tiredness.' },
            refuse:   { cs: 'S tím člověkem pod jednou střechou nebudu. Vím, co je zač.',
                        en: 'I will not share a roof with that man. I know what he is.' },
            officium: { cs: 'Modlím se za ty, co jsem nechal ležet. Je jich dost na celé Officium.',
                        en: 'I pray for those I left behind. There are enough of them to fill the whole Officium.' }
        },
        traits: ['silak'],
        voice_hint: 'Krátké věty. Voják — neplýtvá slovy ani emocemi. Válku nezmiňuje přímo, jen v narážkách. Nikdy si nestěžuje.'
    },

    k_simon: {
        name: 'Šimon',
        icon: '🎻',
        origin_cs: 'Narodil se na cestě a třicet let po ní šel — s kočovným lidem přes Uhry až na Moravu. U Olomouce ho kopl kůň, kterého přišel prodat. Vzal to jako znamení Boží, nechal se pokřtít a zůstal. Kůň prý dostal lepší cenu než sliboval.',
        origin_en: 'Born on the road, he walked it for thirty years — with travelling folk through Hungary to Moravia. Near Olomouc, a horse he came to sell kicked him. He took it as a sign from God, was baptized, and stayed. The horse, they say, fetched a better price than promised.',
        quotes: {
            hire:     { cs: 'Třicet let jsem se učil odcházet. Teď se učím zůstat. To druhé je těžší.',
                        en: 'Thirty years I learned how to leave. Now I learn how to stay. The second is harder.' },
            work:     { cs: 'Koně mi rozumí na první slovo. Osel na páté. Lidi... u těch pořád počítám.',
                        en: 'Horses understand me at the first word. The donkey at the fifth. People... with them I am still counting.' },
            tired:    { cs: 'Nohy si stěžují, že už nechodí. Ať si zvyknou — já si zvykl.',
                        en: 'My feet complain they no longer wander. Let them get used to it — I did.' },
            refuse:   { cs: 'Šel jsem přes sedm zemí. Poznám, kdy se někam nemá vstupovat.',
                        en: 'I crossed seven lands. I know when a place is not to be entered.' },
            officium: { cs: 'Zpívám žalmy po svém. Pán Bůh má rád, když nástroj hraje čistě — ne stejně.',
                        en: 'I sing the psalms my own way. The Lord likes an instrument played true — not played the same.' }
        },
        traits: ['upovidany', 'hudebnik'],
        voice_hint: 'Vtip skrz sebeironii a přísloví z cest. Hrdý, vřelý, nikdy poníženec. Koně a hudba = jeho řeč. Etnikum nikdy jako pointa vtipu.'
    },

    k_matej: {
        name: 'Matěj',
        icon: '📖',
        origin_cs: 'Tři roky na pražském učení, pak došly peníze i trpělivost jeho strýce. Z artistické fakulty si odnesl latinu, dluhy a zvyk psát si poznámky na okraje všeho, co mu přijde pod ruku. Jediný z party umí číst.',
        origin_en: 'Three years at the Prague schools, then both the money and his uncle\u2019s patience ran out. From the faculty of arts he carried away Latin, debts, and the habit of scribbling notes in the margins of anything he can reach. The only one of the crew who can read.',
        quotes: {
            hire:     { cs: 'Umím číst, psát a počítat. A kopat se naučím — quod erat demonstrandum.',
                        en: 'I can read, write, and count. And digging I shall learn — quod erat demonstrandum.' },
            work:     { cs: 'Aristoteles o kydání hnoje nic nenapsal. Škoda. Byl by to jeho nejužitečnější spis.',
                        en: 'Aristotle wrote nothing on mucking stables. A pity. It would have been his most useful work.' },
            tired:    { cs: 'Duch je ochotný, ale tělo je jen bakalář.',
                        en: 'The spirit is willing, but the body is a mere bachelor.' },
            refuse:   { cs: 'Disputovat budu s kýmkoliv. Bydlet ne.',
                        en: 'I will dispute with anyone. Live with them — no.' },
            officium: { cs: 'Žalmy znám nazpaměť. Tak si při nich aspoň v duchu skloňuju řecká slovesa.',
                        en: 'I know the psalms by heart. So during them I decline Greek verbs in my head.' }
        },
        traits: ['ucenec'],
        voice_hint: 'Latinské vsuvky, školská ironie. Chytrý, ale ne nafoukaný — bída ho naučila pokoře. Píše si poznámky o všem.'
    },

    k_ondrej: {
        name: 'Ondřej',
        icon: '🐑',
        origin_cs: 'Ves mu vypálili, když byl chlapec — nepamatuje si kdo, pamatuje si kouř. Od té doby se drží zvířat. Ovce mu jedí z ruky, osel ho poslouchá na slovo. S lidmi mluví, jen když musí.',
        origin_en: 'His village was burned when he was a boy — he does not remember who did it, he remembers the smoke. Since then he keeps to animals. Sheep eat from his hand, the donkey obeys his word. With people he speaks only when he must.',
        quotes: {
            hire:     { cs: 'Zvířata. Ty mi dejte na starost. Lidi si nechte.',
                        en: 'The animals. Give me those. Keep the people.' },
            work:     { cs: 'Ovce nelže. Osel nezradí. Proto jsem radši tady než v krčmě.',
                        en: 'A sheep does not lie. A donkey does not betray. That is why I am here and not in the tavern.' },
            tired:    { cs: 'Zvířata poznají, když je člověk u konce sil. Nechte mě u nich, ony to spraví.',
                        en: 'Animals know when a man is at the end of his strength. Leave me with them, they will mend it.' },
            refuse:   { cs: '…ne.',
                        en: '\u2026no.' },
            officium: { cs: 'Bůh je i v ovčíně. Možná víc než jinde — tam se aspoň nelže.',
                        en: 'God is in the sheepfold too. Perhaps more than elsewhere — at least no one lies there.' }
        },
        traits: ['samotar'],
        voice_hint: 'Málo slov, žádná zbytečná. Nejdelší věty říká o zvířatech. Trauma z ohně nikdy nepopisuje přímo.'
    },

    k_tomas: {
        name: 'Tomáš',
        icon: '🍲',
        origin_cs: 'Vařil pro formanskou hospodu, pro žoldnéře i pro faráře — a každému tvrdil, že jeho kaše je zjevení. Do kláštera přišel, protože prý jedině mniši dokážou ocenit poctivou prostotu. Zatím ocenili hlavně to, že vaří velké porce.',
        origin_en: 'He cooked for a carters\u2019 inn, for mercenaries, and for a parish priest — telling each that his porridge was a revelation. He came to the monastery because, he says, only monks can appreciate honest simplicity. So far they mostly appreciate the large portions.',
        quotes: {
            hire:     { cs: 'Vařím kaši sedmi způsoby. Šest z nich je správně. Ten sedmý vaří ostatní.',
                        en: 'I cook porridge seven ways. Six of them are correct. The seventh way is how everyone else cooks it.' },
            work:     { cs: 'Dobrá kaše chce čas, sůl a pokoru. Hlavně od těch, co ji jedí.',
                        en: 'Good porridge needs time, salt, and humility. Mostly from those who eat it.' },
            tired:    { cs: 'Kuchař nesmí padnout dřív než těsto. To je první přikázání kuchyně.',
                        en: 'A cook must not collapse before the dough does. That is the first commandment of the kitchen.' },
            refuse:   { cs: 'S člověkem, co solí bez ochutnání, já pod jednou střechou nebudu.',
                        en: 'I will not live under one roof with a man who salts without tasting.' },
            officium: { cs: 'Při žalmech mi kyne chleba. Bůh to chápe — taky tvoří z kvasu.',
                        en: 'During the psalms my bread is rising. God understands — He too creates from leaven.' }
        },
        traits: ['upovidany'],
        voice_hint: 'Všechno přirovnává k vaření. Svéhlavý v kuchyni, dobrosrdečný mimo ni. Kaše = svatá věc.'
    },

    k_vojtech: {
        name: 'Vojtěch',
        icon: '🤫',
        origin_cs: 'Přišel před lety odnikud, s rukama, co znají práci, a jménem, které mu možná nepatří. Šeptá se, že stál pod kalichem. On sám o tom nikdy neřekl slovo — a právě to ticho mluví nejhlasitěji.',
        origin_en: 'He came years ago from nowhere, with hands that know work and a name that may not be his. It is whispered he once stood under the chalice. He himself has never said a word about it — and that silence speaks loudest.',
        quotes: {
            hire:     { cs: 'Práci odvedu. Otázky si nechte.',
                        en: 'The work will be done. Keep the questions.' },
            work:     { cs: 'Ruce si pamatují víc než hlava. A míň toho namluví.',
                        en: 'Hands remember more than the head. And they talk less.' },
            tired:    { cs: 'Únava je dobrá. Unavený člověk nesní.',
                        en: 'Tiredness is good. A tired man does not dream.' },
            refuse:   { cs: 'Ten člověk se na mě dívá, jako by mě odněkud znal. Radši ne.',
                        en: 'That man looks at me as if he knows me from somewhere. Better not.' },
            officium: { cs: 'Modlím se tiše. Bůh slyší i to, co se neříká nahlas — v tom je moje naděje.',
                        en: 'I pray quietly. God hears what is not said aloud — therein lies my hope.' }
        },
        traits: ['trpelivy'],
        voice_hint: 'Nejmíň slov ze všech po Ondřejovi. Nikdy minulost, nikdy jména. Napětí s Jakubem — z jeho strany opatrnost, ne nenávist.'
    },

    k_blazej: {
        name: 'Blažej',
        icon: '😴',
        origin_cs: 'Tesařský tovaryš se zlatýma rukama a chrápáním, které v Litovli prý jednou spletli s hromobitím. Tři dílny ho vyhodily — ne pro práci, pro noci. Klášterní dormitář je jeho poslední naděje. A zkouška víry všech ostatních.',
        origin_en: 'A carpenter\u2019s journeyman with golden hands and a snore once mistaken in Litovel for a thunderstorm. Three workshops let him go — not for his work, for his nights. The monastery dormitory is his last hope. And a trial of faith for everyone else.',
        quotes: {
            hire:     { cs: 'Ruce mám zlaté, to uvidíte. O nocích se pobavíme pak.',
                        en: 'My hands are gold, you will see. The nights we can discuss later.' },
            work:     { cs: 'Spoj, co udělám ve dne, drží. Za noc neručím.',
                        en: 'A joint I make by day holds. For the night I take no responsibility.' },
            tired:    { cs: 'Já spím výborně. To ostatní prý ne.',
                        en: 'I sleep excellently. The others, I hear, do not.' },
            refuse:   { cs: 'Prý chrápu. Prý! Ať se ten člověk poslechne sám.',
                        en: 'They say I snore. They say! Let that man listen to himself.' },
            officium: { cs: 'Při ranním Officiu jsem nejzbožnější — to jediné mě spolehlivě probudí.',
                        en: 'At morning Officium I am at my most devout — it is the only thing that reliably wakes me.' }
        },
        traits: ['chrapoun'],
        voice_hint: 'Vlastní chrápání popírá s naprostou vážností. Jinak poctivý řemeslník, hrdý na dílo. Komika situací, ne hlouposti.'
    },

    k_havel: {
        name: 'Havel',
        icon: '🍺',
        origin_cs: 'Dvacet let vozil zboží od Brna po Vratislav a zná každou krčmu, brod i celníka na trase. Formanka skončila, když mu vlci sežrali koně — tak to aspoň vypráví, a pokaždé je těch vlků víc.',
        origin_en: 'Twenty years he hauled goods from Brno to Wroc\u0142aw and knows every tavern, ford, and toll-man on the route. The carting ended when wolves ate his horse — so he tells it, and the wolves grow in number with each telling.',
        quotes: {
            hire:     { cs: 'Znám cesty, lidi a ceny. To se klášteru hodí víc, než myslíte.',
                        en: 'I know the roads, the people, and the prices. That serves a monastery more than you think.' },
            work:     { cs: 'Tohle není práce. Práce je vytáhnout vůz z bláta u Přerova. V listopadu. V noci.',
                        en: 'This is not work. Work is pulling a cart out of the mud near P\u0159erov. In November. At night.' },
            tired:    { cs: 'Unavený? Já jednou spal vestoje mezi dvěma voly. Tohle je odpočinek.',
                        en: 'Tired? I once slept standing between two oxen. This is rest.' },
            refuse:   { cs: 'S tímhle člověkem bych nejel ani prázdný vůz.',
                        en: 'With that man I would not drive even an empty cart.' },
            officium: { cs: 'Kostel je jako krčma — taky tam každý čeká, že mu naliješ příběh. Já mám oboje rád.',
                        en: 'Church is like a tavern — everyone waits for you to pour them a story. I am fond of both.' }
        },
        traits: ['upovidany'],
        voice_hint: 'Historky rostou s každým vyprávěním. Přirovnání z cest a krčem. Soutěží se Šimonem, kdo zná lepší — prohrávat neumí.'
    },

    k_prokop: {
        name: 'Prokop',
        icon: '⚒️',
        origin_cs: 'Mor mu vzal ženu i obě děti během jednoho podzimu. Od té doby nepoznal den bez práce — říká, že ruce, které něco drží, se netřesou. Do kláštera přišel, protože tu se pracuje pořád.',
        origin_en: 'The plague took his wife and both children in a single autumn. Since then he has not known a day without work — hands that hold something, he says, do not shake. He came to the monastery because here the work never ends.',
        quotes: {
            hire:     { cs: 'Dejte mi práci. Jakoukoliv. Hlavně ať je jí dost.',
                        en: 'Give me work. Any work. Just let there be enough of it.' },
            work:     { cs: 'Hotovo. Co dál?',
                        en: 'Done. What next?' },
            tired:    { cs: 'Odpočinek… ano. Chvíli postojím. To se počítá?',
                        en: 'Rest\u2026 yes. I will stand still a moment. Does that count?' },
            refuse:   { cs: 'Vedle něj práce nejde od ruky. A práce jít musí.',
                        en: 'Beside him the work does not flow. And the work must flow.' },
            officium: { cs: 'Při modlitbě mám prázdné ruce. To je ta nejtěžší hodina dne.',
                        en: 'At prayer my hands are empty. That is the hardest hour of the day.' }
        },
        traits: ['pilny'],
        voice_hint: 'Věty krátké jako údery kladiva. Ztrátu nikdy nejmenuje — projevuje se jen neschopností zastavit. Jiljího tiše chrání.'
    },

    k_bartolomej: {
        name: 'Bartoloměj',
        icon: '🙏',
        origin_cs: 'Chtěl být mnichem, ale latina ho porazila třikrát po sobě. Tak slouží Bohu aspoň rukama — a horlivostí, která občas unavuje i samotného převora. Postí se i ve dny, kdy nemusí. Zaklení ostatních ho bolí víc než mozoly.',
        origin_en: 'He wished to be a monk, but Latin defeated him three times running. So he serves God with his hands instead — and with a zeal that at times wearies even the prior. He fasts on days he need not. The others\u2019 cursing pains him more than blisters do.',
        quotes: {
            hire:     { cs: 'Beru to jako službu Bohu. Mzdu si rozdělte mezi chudé. Teda… polovinu.',
                        en: 'I take this as service to God. Share my wage among the poor. Well\u2026 half of it.' },
            work:     { cs: 'I hnůj je dílo Boží. Jen trochu vzdálenější.',
                        en: 'Even dung is God\u2019s work. Merely more distant.' },
            tired:    { cs: 'Tělo reptá, ale duše výská. Duše bohužel nekydá.',
                        en: 'The body grumbles but the soul rejoices. Alas, the soul does not muck stables.' },
            refuse:   { cs: 'Ten člověk kleje při každém druhém slově. Já to slyším i skrz zeď.',
                        en: 'That man curses every second word. I hear it even through the wall.' },
            officium: { cs: 'Konečně! Celý den se těším právě na tohle.',
                        en: 'At last! This is what I wait for all day.' }
        },
        traits: ['zbozny'],
        voice_hint: 'Horlivost s nechtěnou komikou. Míní to smrtelně vážně — humor vzniká kontrastem. Nikdy pokrytec, vždy upřímný.'
    },

    k_jilji: {
        name: 'Jiljí',
        icon: '🤕',
        origin_cs: 'Dobrák, jakého svět neviděl — a taky ruce, jaké svět neviděl. Kbelík mu padá, žebřík pod ním klouže, a slepice utíkají, sotva ho zahlédnou. Nikdo se na něj nedokáže zlobit déle než do večeře.',
        origin_en: 'A kinder soul the world has not seen — nor clumsier hands. Buckets fall from his grip, ladders slip beneath him, and hens flee at the mere sight of him. No one can stay angry at him past supper.',
        quotes: {
            hire:     { cs: 'Budu se moc snažit. Fakt moc. To občas stačí, ne?',
                        en: 'I will try very hard. Really very hard. Sometimes that is enough, no?' },
            work:     { cs: 'Dneska to půjde! …tak od zítřka to půjde.',
                        en: 'Today it will go well! \u2026starting tomorrow it will go well.' },
            tired:    { cs: 'Když jsem unavený, padá mi toho víc. Když nejsem, taky. Ale míň.',
                        en: 'When I am tired, I drop more things. When I am not, I also drop things. But fewer.' },
            refuse:   { cs: 'On se na mě mračí. Vedle mračícího se člověka mi padá úplně všechno.',
                        en: 'He frowns at me. Next to a frowning man I drop absolutely everything.' },
            officium: { cs: 'Při modlitbě se nedá nic rozbít. Proto ji mám ze všeho nejradši.',
                        en: 'Nothing can be broken during prayer. That is why I love it best of all.' }
        },
        traits: ['nesika'],
        voice_hint: 'Odzbrojující upřímnost o vlastní nešikovnosti. Žádná sebelítost — optimista. Každý ho má rád, i když po něm uklízí.'
    },

    k_rehor: {
        name: 'Řehoř',
        icon: '🧓',
        origin_cs: 'Pamatuje klášter, jak vypadal před válkami — a nezapomene vám to připomenout. Všechno bývalo pevnější, pivo hustší a mladí uctivější. Brblá od rána do večera, ale radu od něj chodí prosit i sám cellerarius.',
        origin_en: 'He remembers the monastery as it was before the wars — and will not fail to remind you. Everything used to be sturdier, the beer thicker, the young more respectful. He grumbles from dawn to dusk, yet even the cellarer himself comes to him for advice.',
        quotes: {
            hire:     { cs: 'Za mých časů se nenajímalo. Za mých časů se sloužilo. No — ukažte, kde to je.',
                        en: 'In my day there was no hiring. In my day there was serving. Well — show me where it is.' },
            work:     { cs: 'Takhle se to nedělá. Takhle se to dělalo před dvaceti lety, a drželo to dodnes.',
                        en: 'That is not how it is done. That is how it was done twenty years ago, and it holds to this day.' },
            tired:    { cs: 'Nejsem unavený. Jsem starý. To je rozdíl, mladíku.',
                        en: 'I am not tired. I am old. There is a difference, young man.' },
            refuse:   { cs: 'S tím větroplachem? Ten nevydrží ani do žní.',
                        en: 'With that scatterbrain? He will not last till harvest.' },
            officium: { cs: 'Zpívají to moc rychle. Za opata Zikmunda se žalm táhl jako med. A správně.',
                        en: 'They sing it too fast. Under Abbot Sigismund a psalm flowed slow as honey. And rightly so.' }
        },
        traits: ['mrzout'],
        voice_hint: '"Za mých časů" jako refrén. Brblání = projev péče. K Matějovi překvapivě měkký — vzdělání ctí.'
    },

    k_vit: {
        name: 'Vít',
        icon: '🌿',
        origin_cs: 'Babka kořenářka ho vychovala na kraji lesa a naučila ho, co zabere na horkost, co na vředy a čeho se nedotýkat ani holí. Ve vsi se ho báli, v klášteře se mu hlásí každý, koho bolí záda. Je mu sotva dvacet.',
        origin_en: 'Raised by his herb-wife grandmother at the forest\u2019s edge, he learned what cures fever, what heals sores, and what must not be touched even with a stick. The village feared him; in the monastery, everyone with an aching back reports to him. He is barely twenty.',
        quotes: {
            hire:     { cs: 'Znám byliny. Léčil jsem krávy, lidi i jednoho rychtáře. Ten se uzdravil taky.',
                        en: 'I know herbs. I have healed cows, people, and one magistrate. He recovered as well.' },
            work:     { cs: 'U plotu roste řebříček. To není plevel, to je lékárna. Nešlapat!',
                        en: 'Yarrow grows by the fence. That is not a weed, that is an apothecary. Do not tread on it!' },
            tired:    { cs: 'Na únavu mám odvar. Chutná strašně — to k léčení patří.',
                        en: 'For tiredness I have a brew. It tastes dreadful — that is part of the cure.' },
            refuse:   { cs: 'Tenhle člověk mi rozdupal záhon máty. Máty! Ne.',
                        en: 'That man trampled my mint bed. The mint! No.' },
            officium: { cs: 'Babka říkala: modlitba je taky bylina. Užívat ráno a večer.',
                        en: 'Grandmother used to say: prayer is a herb too. Take morning and evening.' }
        },
        traits: ['bylinkar'],
        voice_hint: 'Mladická vážnost o bylinách, jinak plachý. Babčiny průpovídky cituje jako Písmo. Háček na medicínu proti únavě (MRD bod 9).'
    }
};

// Traity — čte je game.js přes _konvrsTraits(). Zapojeno mechanicky:
// silak, pilny, trpelivy, chrapoun, mrzout, zbozny (fatigue/rest/mood/
// loyalty efekty napříč produkčními ticky). Zatím jen popisné (bez
// mechaniky): upovidany, samotar, nesika, ucenec, hudebnik, bylinkar.
const ConversiTraitsDB = {
    silak:     { name: 'Silák',      name_en: 'Strongman',   icon: '💪', desc: 'Fyzická práce ho neunaví tak snadno.',                    desc_en: 'Physical work does not tire him easily.' },
    pilny:     { name: 'Pilný',      name_en: 'Diligent',    icon: '⚒️', desc: 'Práce mu jde od ruky rychleji než ostatním.',            desc_en: 'Work flows faster in his hands than in others\u2019.' },
    zbozny:    { name: 'Zbožný',     name_en: 'Devout',      icon: '🙏', desc: 'Věrnost klášteru roste rychleji.',                       desc_en: 'His loyalty to the monastery grows faster.' },
    mrzout:    { name: 'Mrzout',     name_en: 'Grumbler',    icon: '😠', desc: 'Dobrá nálada u něj má strop.',                           desc_en: 'His good mood has a ceiling.' },
    upovidany: { name: 'Upovídaný',  name_en: 'Talkative',   icon: '💬', desc: 'Snáz navazuje pouta s ostatními.',                       desc_en: 'Forms bonds with others more easily.' },
    samotar:   { name: 'Samotář',    name_en: 'Loner',       icon: '🌙', desc: 'Pouta s ostatními navazuje jen zřídka.',                desc_en: 'Rarely forms bonds with others.' },
    nesika:    { name: 'Nešika',     name_en: 'Butterfingers', icon: '🤕', desc: 'Občas se mu něco nepovede.',                           desc_en: 'Now and then, something goes wrong in his hands.' },
    trpelivy:  { name: 'Trpělivý',   name_en: 'Patient',     icon: '🕯️', desc: 'Čekání a Officium ho neunavují.',                        desc_en: 'Waiting and the Officium do not weary him.' },
    chrapoun:  { name: 'Chrápe',     name_en: 'Snorer',      icon: '😴', desc: 'Konvrš na vedlejším lůžku spí hůř.',                     desc_en: 'The brother in the next bed sleeps worse.' },
    ucenec:    { name: 'Učený',      name_en: 'Learned',     icon: '📖', desc: 'Jediný, kdo umí číst. Užitečný jinak než ostatní.',      desc_en: 'The only one who can read. Useful in ways the others are not.' },
    hudebnik:  { name: 'Hudebník',   name_en: 'Musician',    icon: '🎻', desc: 'Večerní zpěv zvedá náladu ostatním.',                    desc_en: 'His evening song lifts the others\u2019 spirits.' },
    bylinkar:  { name: 'Bylinkář',   name_en: 'Herbalist',   icon: '🌿', desc: 'Zná odvary proti únavě a neduhům.',                      desc_en: 'Knows brews against tiredness and ailments.' }
};

// Vazby — autorsky psané (MRD sekce 4). Kdo-koho-proč je dané, síla je
// zatím binární (jen typ, ne numerická intenzita — ta zůstává TODO).
// Čte je game.js: hireKonvrs (varuje/odrazuje od najmutí nepřítele
// dohromady) a _runKapitula (týdenní tenze/svornost mezi konvrši).
const ConversiBondsDB = [
    { a: 'k_jakub',      b: 'k_vojtech', type: 'tension',
      desc_cs: 'Válka mezi nimi neskončila. Jeden stál pod kalichem, druhý proti němu — a oba to vědí, i když to nikdy neřekli nahlas.',
      desc_en: 'The war between them never ended. One stood under the chalice, the other against it — and both know it, though neither has ever said it aloud.' },
    { a: 'k_bartolomej', b: 'k_havel',   type: 'tension',
      desc_cs: 'Bartoloměj se modlí za Havlovu duši. Havel vypráví, jak Bartoloměj jednou omylem vypil svěcené pivo. Ani jeden nepřestane.',
      desc_en: 'Bartolom\u011bj prays for Havel\u2019s soul. Havel tells the tale of how Bartolom\u011bj once drank consecrated beer by mistake. Neither will stop.' },
    { a: 'k_prokop',     b: 'k_jilji',   type: 'affinity',
      desc_cs: 'Prokop mlčky dokončuje, co Jiljímu upadlo. Jiljí je jediný, u koho se Prokop občas usměje. Nikdo z nich o tom nemluví.',
      desc_en: 'Prokop silently finishes what Jilj\u00ed has dropped. Jilj\u00ed is the only one who can make Prokop smile. Neither of them speaks of it.' },
    { a: 'k_rehor',      b: 'k_matej',   type: 'affinity',
      desc_cs: 'Mrzout a student. Řehoř brblá na celý svět, ale když Matěj čte nahlas, poslouchá s rukama v klíně jako v kostele.',
      desc_en: 'The grumbler and the student. \u0158eho\u0159 growls at the whole world, but when Mat\u011bj reads aloud, he listens with folded hands as if in church.' },
    { a: 'k_ondrej',     b: 'k_vit',     type: 'affinity',
      desc_cs: 'Dva tiší z venkova. Ondřej zná zvířata, Vít byliny — dorozumí se beze slov, u plotu, kde končí ovčín a začíná zahrada.',
      desc_en: 'Two quiet country souls. Ond\u0159ej knows the animals, V\u00edt the herbs — they understand each other without words, by the fence where the sheepfold ends and the garden begins.' },
    { a: 'k_simon',      b: 'k_havel',   type: 'affinity',
      desc_cs: 'Dva vypravěči z cest. Každý večer soutěž, kdo zná lepší historku — Šimon vede o délku sedmi zemí, Havel to nikdy neuzná.',
      desc_en: 'Two storytellers of the road. Every evening a contest for the better tale — \u0160imon leads by the length of seven lands, Havel will never admit it.' }
];