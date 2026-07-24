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
            hire:     { cs: 'Dej mi záhon a nech mě být. Zbytek přijde sám.',
                        en: 'Give me a bed of earth and leave me be. The rest follows on its own.' },
            work:     { cs: 'Réva neposlouchá rozkazy, jen trpělivost.',
                        en: 'The vine obeys no orders, only patience.' },
            tired:    { cs: 'Únava mizí, když jsou ruce v zemi.',
                        en: 'Fatigue fades once the hands are in the earth.' },
            refuse:   { cs: 'Ten člověk šlape po sazenicích. Ne, díky.',
                        en: 'That man tramples seedlings underfoot. No, thank you.' },
            officium: { cs: 'Modlím se stejně jako pletu — v tichu a beze spěchu.',
                        en: 'I pray the way I weed — in silence, without haste.' }
        },
        voice_hint: 'Klidný, věcný, mluví v obrazech ze zahrady. Nikdy nespěchá, ani v řeči.'
    },

    b_kolumban: {
        name: 'Kolumbán',
        icon: '🐐',
        origin_cs: 'Pastevecký syn, který si ke klášteru zvykl rychleji než klášter na jeho pach chléva. Pozná nemocné zvíře dřív, než samo ví, že je nemocné. S lidmi je to horší.',
        origin_en: 'A shepherd\u2019s son who grew used to the monastery faster than the monastery grew used to the smell of the byre on him. He can spot a sick animal before it knows it itself. With people, it is harder.',
        quotes: {
            hire:     { cs: 'Zvířata mi věří. To je víc, než mohu říct o bratřích v kapitulní síni.',
                        en: 'The animals trust me. That is more than I can say for the brothers in the chapter house.' },
            work:     { cs: 'Koza pozná faleš na sto kroků. Poslouchejte ji.',
                        en: 'A goat smells falseness a hundred paces off. Listen to her.' },
            tired:    { cs: 'Stádo nikdy neodpočívá celé najednou. Ani já.',
                        en: 'A herd never rests all at once. Neither do I.' },
            refuse:   { cs: 'Bil zvíře, které nekopalo. Ať jde jinam.',
                        en: 'He struck an animal that had not kicked. Let him go elsewhere.' },
            officium: { cs: 'Ovce bečí za úsvitu skoro jako žalm. Skoro.',
                        en: 'The sheep bleat at dawn almost like a psalm. Almost.' }
        },
        voice_hint: 'Krátké věty, přirovnání ke zvířatům. Nedůvěřivý k lidem, věrný ke stádu.'
    },

    b_prokulus: {
        name: 'Prokulus',
        icon: '📜',
        origin_cs: 'Ruka se mu netřese ani po deseti hodinách u pulpitu. Iluminátoři ho obdivují, opisovači závidí, opat ho půjčuje jiným klášterům jako vzácnou relikvii.',
        origin_en: 'His hand does not shake even after ten hours at the desk. Illuminators admire him, copyists envy him, the Abbot lends him to other monasteries like a precious relic.',
        quotes: {
            hire:     { cs: 'Inkoust je mi bližší než víno. To už něco znamená v tomhle domě.',
                        en: 'Ink is dearer to me than wine. That means something in this house.' },
            work:     { cs: 'Každé písmeno je modlitba, která zůstane, i když ustanu zpívat.',
                        en: 'Every letter is a prayer that remains after I stop singing.' },
            tired:    { cs: 'Ruka odmítá dřív než duch. Poslouchám ruku.',
                        en: 'The hand refuses before the spirit does. I listen to the hand.' },
            refuse:   { cs: 'Skvrnil by mi stránky. Ne.',
                        en: 'He would stain my pages. No.' },
            officium: { cs: 'Znám žalmy zpaměti z toho, kolikrát jsem je přepsal.',
                        en: 'I know the psalms by heart from copying them so many times.' }
        },
        voice_hint: 'Přesný, trochu pyšný na řemeslo, ale upřímně pokorný k Písmu. Mluví o písmu jako o modlitbě.'
    },

    b_teofil: {
        name: 'Teofil',
        icon: '⚗️',
        origin_cs: 'Přišel z Prahy s pověstí, že uměl vyléčit koně, kterého už čtyři mastičkáři vzdali. Nikdo neví, co přesně dělá v Athanoru, a on to tak rád nechává.',
        origin_en: 'He came from Prague with a reputation for curing a horse four healers had already given up on. No one quite knows what he does in the Athanor, and he rather likes it that way.',
        quotes: {
            hire:     { cs: 'Oheň a trpělivost. Zbytek jsou jen recepty.',
                        en: 'Fire and patience. The rest is only recipes.' },
            work:     { cs: 'Co se nepovede dnes, povede se za týden — nebo nikdy. Obojí je poučné.',
                        en: 'What fails today may succeed in a week — or never. Both are instructive.' },
            tired:    { cs: 'Athanor nespí. Já bohužel musím.',
                        en: 'The Athanor never sleeps. I, alas, must.' },
            refuse:   { cs: 'Rozlil by mi rtuť po celé laboratoři. Ne.',
                        en: 'He would spill mercury across my whole workshop. No.' },
            officium: { cs: 'Modlím se za správný poměr — v lučavce i v duši.',
                        en: 'I pray for the right proportion — in the alchemy and in the soul.' }
        },
        voice_hint: 'Tajemný, přemýšlivý, mluví v polovičních větách jako by pořád něco počítal. Fascinovaný, ne posedlý.'
    },

    b_radim: {
        name: 'Radim',
        icon: '📚',
        origin_cs: 'Nejstarší bratr v Armariu — pamatuje, kam se která kniha zatoulala, ještě než se ztratila. Řetězy na pulpitech osobně kontroluje každý týden.',
        origin_en: 'The oldest brother in the Armarium — he remembers where a book wandered off to before it was even lost. He personally checks the chains on the lecterns every week.',
        quotes: {
            hire:     { cs: 'Knihy nelžou. Lidé, kteří je vracejí pozdě, ano.',
                        en: 'Books do not lie. The people who return them late, however, do.' },
            work:     { cs: 'Pořádek na poličce je pořádek v duši. Řekl to někdo moudřejší, ale zapomněl jsem kdo.',
                        en: 'Order on the shelf is order in the soul. Someone wiser said that, but I forget who.' },
            tired:    { cs: 'Oči už neslouží tak jako dřív. Paměť naštěstí ano.',
                        en: 'The eyes no longer serve as they once did. The memory, thankfully, still does.' },
            refuse:   { cs: 'Poškodil hřbet vzácného kodexu. Sem už nesmí.',
                        en: 'He damaged the spine of a rare codex. He does not set foot here again.' },
            officium: { cs: 'Znám pořadí žalmů nazpaměť — i pořadí, ve kterém je špatně zpívají.',
                        en: 'I know the order of the psalms by heart — and the order in which they sing them wrong.' }
        },
        voice_hint: 'Suchý humor, mírně škrobený, ale s vřelostí ke knihám a mladším bratřím, které učí.'
    },
};

// Specializace odvozené z přiřazení na tab — mapování tab → titul.
// Žádné mechanické efekty zde; skutečný bonus počítá DormitoriumSystem
// podle nastřádaného XP v dané specializaci (viz DormitoriumSystem.js).
const DormitoriumSpecializationDB = {
    zahony:   { name: 'Zahradník',  name_en: 'Gardener',     icon: '🌿' },
    sad:      { name: 'Sadař',      name_en: 'Orchardist',   icon: '🍎' },
    vinohrad: { name: 'Vinař',      name_en: 'Vintner',      icon: '🍇' },
    pole:     { name: 'Rolník',     name_en: 'Husbandman',   icon: '🌾' },
    dvur:     { name: 'Chovatel',   name_en: 'Herdsman',     icon: '🐐' },
    apiarium: { name: 'Včelař',     name_en: 'Beekeeper',    icon: '🐝' },
    piscina:  { name: 'Rybář',      name_en: 'Fisherman',    icon: '🐟' },
    athanor:  { name: 'Alchymista', name_en: 'Alchemist',    icon: '⚗️' },
    columbarium: { name: 'Columbarius', name_en: 'Columbarius', icon: '🕊️' },
    scriptorium: { name: 'Skriptor', name_en: 'Scriptor',    icon: '📜' },
    kostel:   { name: 'Kostelník',  name_en: 'Sacristan',    icon: '⛪' },
    hrbitov:  { name: 'Hrobník',    name_en: 'Gravedigger',  icon: '⚰️' }, // jen konvrš titul — bratr je pořád Kostelník (viz manufacturaStatus/renderManufactura)
    infirmarium_infirmarius:  { name: 'Infirmarius',  name_en: 'Infirmarian', icon: '🩺' },
    infirmarium_medicus:      { name: 'Medicus',      name_en: 'Medicus',     icon: '⚕️' },
    infirmarium_apothecarius: { name: 'Apothecarius', name_en: 'Apothecary',  icon: '🧪' },
    infirmarium_capellanus:   { name: 'Capellanus',   name_en: 'Chaplain',    icon: '⛪' },
    studovna: { name: 'Lector',   name_en: 'Lector',   icon: '📖' },
};