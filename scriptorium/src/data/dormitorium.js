// ─────────────────────────────────────────────────────────────
// DormitoriumRosterDB — autorský roster bratrů (mnichů/skriptorů)
// Odlišné od ConversiRosterDB: bratři jsou manažerská vrstva —
// specializace se odvozuje z přiřazení na tab a roste s časem/prací,
// ne z pevných traitů jako u Conversi.
// MRD: dormitorium-mrd.md
// ─────────────────────────────────────────────────────────────

const DormitoriumRosterDB = {
    b_bonaventura: {
        name: 'Bonaventura',
        icon: '🌿',
        origin_cs: 'Vstoupil do kláštera jako chlapec a od té doby nezná nic jiného než hlínu pod nehty a bylinkovou zahradu. Opat mu jednou řekl, že mluví s rostlinami víc než s bratřími. Nepopřel to.',
        origin_en: 'He entered the monastery as a boy and has known nothing else since but soil under his nails and the herb garden. The Abbot once told him he speaks to plants more than to his brothers. He did not deny it.',
        quotes: {
            hire: {
                cs: 'Dej mi záhon a nech mě být. Zbytek přijde sám.',
                en: 'Give me a bed of earth and leave me be. The rest follows on its own.'
            },
            work: {
                cs: 'Réva neposlouchá rozkazy, jen trpělivost.',
                en: 'The vine obeys no orders, only patience.'
            },
            tired: {
                cs: 'Únava mizí, když jsou ruce v zemi.',
                en: 'Fatigue fades once the hands are in the earth.'
            },
            refuse: {
                cs: 'Ten člověk šlape po sazenicích. Ne, díky.',
                en: 'That man tramples seedlings underfoot. No, thank you.'
            },
            officium: {
                cs: 'Modlím se stejně jako pletu — v tichu a beze spěchu.',
                en: 'I pray the way I weed — in silence, without haste.'
            }
        },
        voice_hint: 'Klidný, věcný, mluví v obrazech ze zahrady. Nikdy nespěchá, ani v řeči.'
    },

    b_kolumban: {
        name: 'Kolumbán',
        icon: '🐐',
        origin_cs: 'Pastevecký syn, který si ke klášteru zvykl rychleji než klášter na jeho pach chléva. Pozná nemocné zvíře dřív, než samo ví, že je nemocné. S lidmi je to horší.',
        origin_en: 'A shepherd\u2019s son who grew used to the monastery faster than the monastery grew used to the smell of the byre on him. He can spot a sick animal before it knows it itself. With people, it is harder.',
        quotes: {
            hire: {
                cs: 'Zvířata mi věří. To je víc, než mohu říct o bratřích v kapitulní síni.',
                en: 'The animals trust me. That is more than I can say for the brothers in the chapter house.'
            },
            work: {
                cs: 'Koza pozná faleš na sto kroků. Poslouchejte ji.',
                en: 'A goat smells falseness a hundred paces off. Listen to her.'
            },
            tired: {
                cs: 'Stádo nikdy neodpočívá celé najednou. Ani já.',
                en: 'A herd never rests all at once. Neither do I.'
            },
            refuse: {
                cs: 'Bil zvíře, které nekopalo. Ať jde jinam.',
                en: 'He struck an animal that had not kicked. Let him go elsewhere.'
            },
            officium: {
                cs: 'Ovce bečí za úsvitu skoro jako žalm. Skoro.',
                en: 'The sheep bleat at dawn almost like a psalm. Almost.'
            }
        },
        voice_hint: 'Krátké věty, přirovnání ke zvířatům. Nedůvěřivý k lidem, věrný ke stádu.'
    },

    b_prokulus: {
        name: 'Prokulus',
        icon: '📜',
        origin_cs: 'Ruka se mu netřese ani po deseti hodinách u pulpitu. Iluminátoři ho obdivují, opisovači závidí, opat ho půjčuje jiným klášterům jako vzácnou relikvii.',
        origin_en: 'His hand does not shake even after ten hours at the desk. Illuminators admire him, copyists envy him, the Abbot lends him to other monasteries like a precious relic.',
        quotes: {
            hire: {
                cs: 'Inkoust je mi bližší než víno. To už něco znamená v tomhle domě.',
                en: 'Ink is dearer to me than wine. That means something in this house.'
            },
            work: {
                cs: 'Každé písmeno je modlitba, která zůstane, i když ustanu zpívat.',
                en: 'Every letter is a prayer that remains after I stop singing.'
            },
            tired: {
                cs: 'Ruka odmítá dřív než duch. Poslouchám ruku.',
                en: 'The hand refuses before the spirit does. I listen to the hand.'
            },
            refuse: {
                cs: 'Skvrnil by mi stránky. Ne.',
                en: 'He would stain my pages. No.'
            },
            officium: {
                cs: 'Znám žalmy zpaměti z toho, kolikrát jsem je přepsal.',
                en: 'I know the psalms by heart from copying them so many times.'
            }
        },
        voice_hint: 'Přesný, trochu pyšný na řemeslo, ale upřímně pokorný k Písmu. Mluví o písmu jako o modlitbě.'
    },

    b_teofil: {
        name: 'Teofil',
        icon: '⚗️',
        origin_cs: 'Přišel z Prahy s pověstí, že uměl vyléčit koně, kterého už čtyři mastičkáři vzdali. Nikdo neví, co přesně dělá v Athanoru, a on to tak rád nechává.',
        origin_en: 'He came from Prague with a reputation for curing a horse four healers had already given up on. No one quite knows what he does in the Athanor, and he rather likes it that way.',
        quotes: {
            hire: {
                cs: 'Oheň a trpělivost. Zbytek jsou jen recepty.',
                en: 'Fire and patience. The rest is only recipes.'
            },
            work: {
                cs: 'Co se nepovede dnes, povede se za týden — nebo nikdy. Obojí je poučné.',
                en: 'What fails today may succeed in a week — or never. Both are instructive.'
            },
            tired: {
                cs: 'Athanor nespí. Já bohužel musím.',
                en: 'The Athanor never sleeps. I, alas, must.'
            },
            refuse: {
                cs: 'Rozlil by mi rtuť po celé laboratoři. Ne.',
                en: 'He would spill mercury across my whole workshop. No.'
            },
            officium: {
                cs: 'Modlím se za správný poměr — v lučavce i v duši.',
                en: 'I pray for the right proportion — in the alchemy and in the soul.'
            }
        },
        voice_hint: 'Tajemný, přemýšlivý, mluví v polovičních větách jako by pořád něco počítal. Fascinovaný, ne posedlý.'
    },

    b_radim: {
        name: 'Radim',
        icon: '📚',
        origin_cs: 'Nejstarší bratr v Armariu — pamatuje, kam se která kniha zatoulala, ještě než se ztratila. Řetězy na pulpitech osobně kontroluje každý týden.',
        origin_en: 'The oldest brother in the Armarium — he remembers where a book wandered off to before it was even lost. He personally checks the chains on the lecterns every week.',
        quotes: {
            hire: {
                cs: 'Knihy nelžou. Lidé, kteří je vracejí pozdě, ano.',
                en: 'Books do not lie. The people who return them late, however, do.'
            },
            work: {
                cs: 'Pořádek na poličce je pořádek v duši. Řekl to někdo moudřejší, ale zapomněl jsem kdo.',
                en: 'Order on the shelf is order in the soul. Someone wiser said that, but I forget who.'
            },
            tired: {
                cs: 'Oči už neslouží tak jako dřív. Paměť naštěstí ano.',
                en: 'The eyes no longer serve as they once did. The memory, thankfully, still does.'
            },
            refuse: {
                cs: 'Poškodil hřbet vzácného kodexu. Sem už nesmí.',
                en: 'He damaged the spine of a rare codex. He does not set foot here again.'
            },
            officium: {
                cs: 'Znám pořadí žalmů nazpaměť — i pořadí, ve kterém je špatně zpívají.',
                en: 'I know the order of the psalms by heart — and the order in which they sing them wrong.'
            }
        },
        voice_hint: 'Suchý humor, mírně škrobený, ale s vřelostí ke knihám a mladším bratřím, které učí.'
    },

    b_borek: {
        name: 'Bořek',
        icon: '🗝️',
        origin_cs: 'Kdysi žoldák, který viděl víc bitev, než chce počítat. Do kláštera přišel s mečem u pasu a odešel s ním do kovárny na přetavení. Hlídá bránu, jako by od toho stále záviselo přežití posádky.',
        origin_en: 'Once a mercenary who saw more battles than he cares to count. He arrived at the monastery with a sword at his hip and walked it straight to the forge to be melted down. He guards the gate as if a garrison\u2019s survival still depended on it.',
        quotes: {
            hire: {
                cs: 'Meč jsem složil. Ostražitost ne.',
                en: 'I laid down the sword. Not the watchfulness.'
            },
            work: {
                cs: 'Nepřítel nečeká na pozvání. Ani zloděj.',
                en: 'An enemy does not wait for an invitation. Neither does a thief.'
            },
            tired: {
                cs: 'Spím jedním okem otevřeným. Zvyk z tažení.',
                en: 'I sleep with one eye open. A habit from the campaigns.'
            },
            refuse: {
                cs: 'Ten muž lže tak, jak jiní dýchají. Pryč s ním.',
                en: 'That man lies the way others breathe. Away with him.'
            },
            officium: {
                cs: 'Modlím se kratčeji než ostatní. Bůh slyší i krátké modlitby vojáků.',
                en: 'I pray shorter than the others. God hears even a soldier\u2019s short prayers.'
            }
        },
        voice_hint: 'Úsečný, ostražitý, mluví vojenskou zkratkou. Nedůvěřuje snadno, ale je věrný, komu jednou slouží.'
    },

    b_jaroslav: {
        name: 'Jaroslav',
        icon: '🐝',
        origin_cs: 'Nejstarší z bratří u úlů, o včelách mluví, jako by to byla jeho vlastní obec. Tvrdí, že mu jednou předpověděly mráz o dva dny dřív, než to poznal opat z oblohy.',
        origin_en: 'The eldest of the brothers at the hives, he speaks of bees as though they were his own parish. He claims they once foretold a frost two days before the Abbot read it in the sky.',
        quotes: {
            hire: {
                cs: 'Úl neodpouští netrpělivost. Doufám, že vy ano.',
                en: 'The hive forgives no impatience. I hope you do.'
            },
            work: {
                cs: 'Včela nikdy nepracuje pro sebe. Měli bychom se od ní učit.',
                en: 'A bee never labors for herself alone. We should learn from her.'
            },
            tired: {
                cs: 'Odpočinu si, až si odpočine úl. Tedy nikdy.',
                en: 'I will rest when the hive rests. So, never.'
            },
            refuse: {
                cs: 'Kouřil od úlů dýmkou. Ať se drží dál.',
                en: 'He smoked his pipe near the hives. Let him keep his distance.'
            },
            officium: {
                cs: 'Bzučení úlů je taky žalm, jen ho zatím nikdo nezapsal.',
                en: 'The hum of the hives is a psalm too — no one has written it down yet.'
            }
        },
        voice_hint: 'Klidný, mluví v přirovnáních ke včelám a úlu, mírně tajemný ohledně toho, co všechno od nich ví.'
    },

    b_vratislav: {
        name: 'Vratislav',
        icon: '🖋️',
        origin_cs: 'Nejmladší z bratří, přišel z německy mluvící kupecké rodiny z Olomouce. Zapisuje si všechno — počasí, sny, i to, kolik kroků má cesta od cely ke kapitulní síni.',
        origin_en: 'The youngest of the brothers, he came from a German-speaking merchant family in Olomouc. He writes everything down — the weather, his dreams, even how many steps it is from his cell to the chapter house.',
        quotes: {
            hire: {
                cs: 'Otec chtěl, abych počítal groše. Radši budu počítat milosti.',
                en: 'Father wanted me to count coins. I would rather count graces.'
            },
            work: {
                cs: 'Kdo si nezapíše, zapomene. Já nezapomínám nic.',
                en: 'He who writes nothing down forgets. I forget nothing.'
            },
            tired: {
                cs: 'Ruka se třese, ale poznámky počkají do zítřka jen neochotně.',
                en: 'My hand shakes, but my notes wait until tomorrow only reluctantly.'
            },
            refuse: {
                cs: 'Roztrhl mi sešit. To se neodpouští snadno.',
                en: 'He tore my notebook. That is not easily forgiven.'
            },
            officium: {
                cs: 'Počítám verše žalmů. Je jich přesně tolik, kolik jsem čekal.',
                en: 'I count the verses of the psalms. There are exactly as many as I expected.'
            }
        },
        voice_hint: 'Horlivý, trochu úzkostlivý, mluví o číslech a záznamech. Mladická dychtivost, ještě nezocelená klášterní rutinou.'
    },

    b_nezamysl: {
        name: 'Nezamysl',
        icon: '🎣',
        origin_cs: 'Mlčenlivý rybář z okolí Litovle, věří, že obloha a hladina rybníka mluví, jen jim málokdo naslouchá. S lidmi mluví míň než s rybami.',
        origin_en: 'A quiet fisherman from around Litovel, he believes the sky and the pond\u2019s surface speak — few simply listen. He talks less with people than with fish.',
        quotes: {
            hire: {
                cs: 'Ryba nikdy nelže o počasí. Lidé ano.',
                en: 'A fish never lies about the weather. People do.'
            },
            work: {
                cs: 'Trpělivost u vody se počítá jinak než trpělivost jinde.',
                en: 'Patience by the water counts differently than patience elsewhere.'
            },
            tired: {
                cs: 'Únava odplyne s proudem, když se dost dlouho dívám na hladinu.',
                en: 'Fatigue drifts off with the current, if I watch the surface long enough.'
            },
            refuse: {
                cs: 'Plašil ryby křikem. Ať křičí jinde.',
                en: 'He scared the fish with shouting. Let him shout elsewhere.'
            },
            officium: {
                cs: 'Modlím se tiše, jako když se vrhá síť — bez rozruchu.',
                en: 'I pray quietly, the way a net is cast — without commotion.'
            }
        },
        voice_hint: 'Málomluvný, věcný, přirovnání k vodě a rybám. Dlouhé pauzy v řeči, nikdy nespěchá s odpovědí.'
    },

    b_ctirad: {
        name: 'Ctirad',
        icon: '📅',
        origin_cs: 'Kronikář posedlý přesností — data, jména, pořadí událostí. Tvrdí, že chyba jednoho dne v zápisu je stejný hřích jako chyba jednoho slova v modlitbě.',
        origin_en: 'A chronicler obsessed with precision — dates, names, the order of events. He claims an error of a single day in the record is the same sin as an error of a single word in prayer.',
        quotes: {
            hire: {
                cs: 'Dějiny bez přesných dat jsou jen povídačky. Nechci psát povídačky.',
                en: 'History without exact dates is mere gossip. I refuse to write gossip.'
            },
            work: {
                cs: 'Zapsal jsem to třikrát, aby se to nepopletlo. Podruhé se to popletlo.',
                en: 'I wrote it down three times so it would not get muddled. It got muddled the second time.'
            },
            tired: {
                cs: 'I unavená ruka musí zapsat správné datum. Zítřek to nezachrání.',
                en: 'Even a tired hand must record the correct date. Tomorrow will not save it.'
            },
            refuse: {
                cs: 'Přepsal datum bitvy o rok. To se neomlouvá.',
                en: 'He copied the date of the battle a year wrong. That is not excused.'
            },
            officium: {
                cs: 'Znám přesně, kolikátý je dnes den liturgického roku. Ptejte se, budu-li vám k službám.',
                en: 'I know precisely which day of the liturgical year it is today. Ask, and I am at your service.'
            }
        },
        voice_hint: 'Suchý, přesný, trochu pedantský, ale s tichou hrdostí na svou práci. Cituje data jako jiní citují žalmy.'
    },
};

// Specializace odvozené z přiřazení na tab — mapování tab → titul.
// Žádné mechanické efekty zde; skutečný bonus počítá DormitoriumSystem
// podle nastřádaného XP v dané specializaci (viz DormitoriumSystem.js).
const DormitoriumSpecializationDB = {
    zahony: { name: 'Zahradník', name_en: 'Gardener', icon: '🌿' },
    sad: { name: 'Sadař', name_en: 'Orchardist', icon: '🍎' },
    vinohrad: { name: 'Vinař', name_en: 'Vintner', icon: '🍇' },
    pole: { name: 'Rolník', name_en: 'Husbandman', icon: '🌾' },
    dvur: { name: 'Chovatel', name_en: 'Herdsman', icon: '🐐' },
    apiarium: { name: 'Včelař', name_en: 'Beekeeper', icon: '🐝' },
    piscina: { name: 'Rybář', name_en: 'Fisherman', icon: '🐟' },
    athanor: { name: 'Alchymista', name_en: 'Alchemist', icon: '⚗️' },
    athanor_research: { name: 'Badatel', name_en: 'Researcher', icon: '🎡' },
    columbarium: { name: 'Columbarius', name_en: 'Columbarius', icon: '🕊️' },
    scriptorium: { name: 'Skriptor', name_en: 'Scriptor', icon: '📜' },
    kostel: { name: 'Kostelník', name_en: 'Sacristan', icon: '⛪' },
    hrbitov: { name: 'Hrobník', name_en: 'Gravedigger', icon: '⚰️' }, // jen konvrš titul — bratr je pořád Kostelník (viz manufacturaStatus/renderManufactura)
    infirmarium_infirmarius: { name: 'Infirmarius', name_en: 'Infirmarian', icon: '🩺' },
    infirmarium_medicus: { name: 'Medicus', name_en: 'Medicus', icon: '⚕️' },
    infirmarium_apothecarius: { name: 'Apothecarius', name_en: 'Apothecary', icon: '🧪' },
    infirmarium_capellanus: { name: 'Capellanus', name_en: 'Chaplain', icon: '⛪' },
    studovna: { name: 'Lector', name_en: 'Lector', icon: '📖' },
    kantor: { name: 'Kantor', name_en: 'Cantor', icon: '🎵' },
};