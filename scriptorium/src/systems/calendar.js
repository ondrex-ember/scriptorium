// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR SYSTEM — Perpetuum Calendarium
// Scriptorium tab: Calendarium (requires tech_astronomy + perpetuum_calendarium)
// ═══════════════════════════════════════════════════════════════════════════════

const CalendarSystem = {

    // ── Latinské názvy ────────────────────────────────────────────────────────
    MONTHS_LAT: ['Ianuarius', 'Februarius', 'Martius', 'Aprilis', 'Maius', 'Iunius',
        'Iulius', 'Augustus', 'September', 'October', 'November', 'December'],
    MONTHS_CS: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
    MONTHS_EN: ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],
    DAYS_LAT: ['Lun', 'Mar', 'Mer', 'Iov', 'Ven', 'Sat', 'Sol'],
    DAYS_CS: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
    DAYS_EN: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

    // ── Sanctorale — fixní svátky (z Divinum Officium + historické prameny) ──
    feastDays: [
        // LEDEN
        { month:1,  day:1,  name:'Obřezání Páně',         nameEN:'Circumcision of the Lord',    nameLA:'In Circumcisione Domini',
          rank:'duplex_I', icon:'✝️', effect:null, fastDay:false, noWork:true,
          martyrCS:'Osmého dne po svém narození byl Pán Ježíš obřezán a dostal jméno Ježíš.',
          martyrEN:'On the eighth day after His birth the Lord Jesus was circumcised and received the name Jesus.' },
        { month:1,  day:6,  name:'Tři Králové',            nameEN:'Epiphany',                    nameLA:'In Epiphania Domini',
          rank:'duplex_I', icon:'⭐', effect:'vigor_bonus', effectVal:10, fastDay:false, noWork:true,
          martyrCS:'Mudrcové z Východu přišli do Betléma, vedeni hvězdou, aby vzdali poctu narozenému Králi.',
          martyrEN:'The Magi from the East came to Bethlehem, guided by a star, to pay homage to the newborn King.' },
        { month:1,  day:17, name:'Sv. Antonín Veliký',     nameEN:'St. Anthony Abbot',           nameLA:'S. Antonii Abbatis',
          rank:'duplex', icon:'🐷', effect:'animal_bonus', effectVal:0.1, fastDay:false, noWork:false,
          martyrCS:'Antonín, otec mnichů, odešel na poušť a žil tam přes 80 let v modlitbě a askezi. Patron domácích zvířat.',
          martyrEN:'Anthony, father of monks, withdrew to the desert and lived there for over 80 years. Patron of domestic animals.' },
        { month:1,  day:25, name:'Obrácení Sv. Pavla',     nameEN:'Conversion of St. Paul',      nameLA:'In Conversione S. Pauli',
          rank:'duplex', icon:'⚡', effect:'research_bonus', effectVal:0.1, fastDay:false, noWork:false,
          martyrCS:'Saul z Tarsu byl na cestě do Damašku osvícen nebeským světlem a stal se Pavlem, apoštolem národů.',
          martyrEN:'Saul of Tarsus was struck by heavenly light on the road to Damascus and became Paul, apostle of the nations.' },
        // ÚNOR
        { month:2,  day:2,  name:'Hromnice',               nameEN:'Candlemas',                   nameLA:'Purificatio B.M.V.',
          rank:'duplex_II', icon:'🕯️', effect:'candle_bonus', effectVal:3, fastDay:false, noWork:true,
          martyrCS:'Čtyřicátého dne po Vánocích byla Panna Maria představena v chrámě. Požehnané svíčky chrání dům po celý rok.',
          martyrEN:'Forty days after Christmas the Virgin Mary was presented at the Temple. Blessed candles protect the home all year.' },
        { month:2,  day:3,  name:'Sv. Blažej',             nameEN:'St. Blaise',                  nameLA:'S. Blasii Episcopi et Martyris',
          rank:'simplex', icon:'🩺', effect:null, fastDay:false, noWork:false,
          martyrCS:'Blažej, biskup a mučedník, je patronem nemocných hrdlem. Žehnal krky dvěma zkříženými svícemi.',
          martyrEN:'Blaise, bishop and martyr, patron of the sick throat. He blessed throats with two crossed candles.' },
        // BŘEZEN
        { month:3,  day:12, name:'Sv. Řehoř Veliký',       nameEN:'St. Gregory the Great',       nameLA:'S. Gregorii Papae',
          rank:'duplex', icon:'📖', effect:'research_bonus', effectVal:0.15, fastDay:false, noWork:false,
          martyrCS:'Řehoř Veliký, mnich a papež, reformoval liturgii. Gregoriánský chorál nese jeho jméno dodnes.',
          martyrEN:'Gregory the Great, monk and pope, reformed the liturgy. Gregorian chant bears his name to this day.' },
        { month:3,  day:19, name:'Sv. Josef',               nameEN:'St. Joseph',                  nameLA:'S. Joseph Sponsi B.M.V.',
          rank:'duplex_I', icon:'⚒️', effect:'craft_bonus', effectVal:0.15, fastDay:false, noWork:true,
          martyrCS:'Josef, tesař z Nazaretu, byl pěstounem Ježíšovým. Patron řemeslníků a všech pracujících.',
          martyrEN:'Joseph, carpenter of Nazareth, was the foster father of Jesus. Patron of craftsmen and all workers.' },
        { month:3,  day:25, name:'Zvěstování Páně',         nameEN:'Annunciation',                nameLA:'Annuntiatio B.M.V.',
          rank:'duplex_I', icon:'🌸', effect:'garden_bonus', effectVal:0.2, fastDay:false, noWork:true,
          martyrCS:'Archanděl Gabriel zvěstoval Panně Marii, že počne a porodí Syna Božího. Den jara a naděje.',
          martyrEN:'The archangel Gabriel announced to the Virgin Mary that she would conceive and bear the Son of God. Day of spring and hope.' },
        // DUBEN
        { month:4,  day:23, name:'Sv. Jiří',                nameEN:'St. George',                  nameLA:'S. Georgii Martyris',
          rank:'simplex', icon:'⚔️', effect:null, fastDay:false, noWork:false,
          martyrCS:'Jiří, vojín a mučedník, patron rytířů. Legenda praví, že osvobodil princeznu od draka.',
          martyrEN:'George, soldier and martyr, patron of knights. Legend says he freed a princess from a dragon.' },
        // KVĚTEN
        { month:5,  day:3,  name:'Nalezení sv. Kříže',      nameEN:'Finding of the Holy Cross',   nameLA:'Inventio Sanctae Crucis',
          rank:'duplex_II', icon:'✝️', effect:null, fastDay:false, noWork:false,
          martyrCS:'Císařovna Helena nalezla v Jeruzalémě kříž, na němž byl Kristus ukřižován.',
          martyrEN:'Empress Helena found in Jerusalem the cross on which Christ was crucified.' },
        // ČERVEN
        { month:6,  day:6,  name:'Sv. Norbert',             nameEN:'St. Norbert',                 nameLA:'S. Norberti Episcopi',
          rank:'duplex', icon:'⚜️', effect:'research_bonus', effectVal:0.1, fastDay:false, noWork:false,
          martyrCS:'Norbert z Xantenu, zakladatel Premonstrátského řádu. Arcibiskup olomoucký byl jeho duchovním dědicem.',
          martyrEN:'Norbert of Xanten, founder of the Premonstratensian Order. The Archbishop of Olomouc was his spiritual heir.' },
        // ČERVENEC
        { month:7,  day:11, name:'Sv. Benedikt',            nameEN:'St. Benedict',                nameLA:'S. Benedicti Abbatis',
          rank:'duplex_II', icon:'📜', effect:'research_bonus', effectVal:0.15, effectDuration:86400000, fastDay:false, noWork:true,
          martyrCS:'Benedikt z Nursie, otec západního mnišství, napsal Regulu: Ora et labora. V jeho svátku je každý výzkum požehnaný.',
          martyrEN:'Benedict of Nursia, father of western monasticism, wrote the Rule: Ora et labora. On his feast every research is blessed.' },
        { month:7,  day:22, name:'Sv. Maří Magdaléna',      nameEN:'St. Mary Magdalene',          nameLA:'S. Mariae Magdalenae',
          rank:'duplex', icon:'🌹', effect:null, fastDay:false, noWork:false,
          martyrCS:'Marie Magdaléna, kajícnice a apoštolka apoštolů, první spatřila vzkříšeného Krista.',
          martyrEN:'Mary Magdalene, penitent and apostle of apostles, was the first to see the risen Christ.' },
        { month:7,  day:25, name:'Sv. Jakub',               nameEN:'St. James the Apostle',       nameLA:'S. Jacobi Apostoli',
          rank:'duplex_II', icon:'🐚', effect:null, fastDay:false, noWork:false,
          martyrCS:'Jakub, syn Zebedeův, byl prvním apoštolem mučedníkem. Jeho hrob v Compostele přitahuje poutníky z celé Evropy.',
          martyrEN:'James, son of Zebedee, was the first apostle martyr. His tomb in Compostela draws pilgrims from all of Europe.' },
        // SRPEN
        { month:8,  day:10, name:'Sv. Vavřinec',            nameEN:'St. Lawrence',                nameLA:'S. Laurentii Martyris',
          rank:'duplex_II', icon:'🔥', effect:null, fastDay:false, noWork:false,
          martyrCS:'Vavřinec, jáhen a mučedník, byl upálen na roštu. Řekl: Obraťte mne, jsem již upečen.',
          martyrEN:"Lawrence, deacon and martyr, was roasted on a gridiron. He said: Turn me over, I'm done on this side." },
        { month:8,  day:15, name:'Nanebevzetí P. Marie',    nameEN:'Assumption of Mary',          nameLA:'Assumptio B.M.V.',
          rank:'duplex_I', icon:'🌟', effect:'vigor_bonus', effectVal:20, fastDay:false, noWork:true,
          martyrCS:'Panna Maria byla vzata s tělem i duší do nebeské slávy. Největší mariánský svátek, konec léta a čas díků.',
          martyrEN:'The Virgin Mary was taken body and soul into heavenly glory. The greatest Marian feast, end of summer and thanksgiving.' },
        { month:8,  day:24, name:'Sv. Bartoloměj',          nameEN:'St. Bartholomew',             nameLA:'S. Bartholomaei Apostoli',
          rank:'duplex_II', icon:'🗡️', effect:null, fastDay:false, noWork:false,
          martyrCS:'Bartoloměj apoštol hlásal evangelium v Arménii a byl stažen z kůže. Patron koželuhů a řezníků.',
          martyrEN:'Bartholomew the apostle preached in Armenia and was flayed alive. Patron of tanners and butchers.' },
        // ZÁŘÍ
        { month:9,  day:1,  name:'Sv. Jiljí',               nameEN:'St. Giles',                   nameLA:'S. Aegidii Abbatis',
          rank:'simplex', icon:'🦌', effect:null, fastDay:false, noWork:false,
          martyrCS:'Jiljí, poustevník a opat, žil v jihofrancouzských lesích. Patron žebráků a chudých.',
          martyrEN:'Giles, hermit and abbot, lived in the forests of southern France. Patron of beggars and the poor.' },
        { month:9,  day:14, name:'Povýšení sv. Kříže',      nameEN:'Exaltation of the Cross',     nameLA:'Exaltatio Sanctae Crucis',
          rank:'duplex_majus', icon:'✝️', effect:null, fastDay:false, noWork:false,
          martyrCS:'Heraklius přinesl kříž zpět do Jeruzaléma. Den kdy se každý pokloní před křížem spasení.',
          martyrEN:'Heraclius brought the cross back to Jerusalem. A day when all bow before the cross of salvation.' },
        { month:9,  day:28, name:'Sv. Václav',              nameEN:'St. Wenceslas',               nameLA:'S. Wenceslai Ducis et Martyris',
          rank:'duplex', icon:'👑', effect:'vigor_bonus', effectVal:15, fastDay:false, noWork:true,
          martyrCS:'Václav, kníže český, byl zavražděn bratrem Boleslavem. Patron Čech, jeho koruna střeží národ dodnes.',
          martyrEN:'Wenceslas, Czech duke, was murdered by his brother Boleslav. Patron of Bohemia, his crown guards the nation to this day.' },
        // ŘÍJEN
        { month:10, day:4,  name:'Sv. František z Assisi',  nameEN:'St. Francis of Assisi',       nameLA:'S. Francisci Confessoris',
          rank:'duplex', icon:'🕊️', effect:'animal_bonus', effectVal:0.25, fastDay:false, noWork:false,
          martyrCS:'František z Assisi, chudý a radostný, mluvil s ptáky a vlkem. V jeho svátku jsou zvířata v Dvůru šťastnější.',
          martyrEN:'Francis of Assisi, poor and joyful, spoke with birds and the wolf. On his feast animals in the Farmyard are happier.' },
        { month:10, day:18, name:'Sv. Lukáš',               nameEN:'St. Luke the Evangelist',     nameLA:'S. Lucae Evangelistae',
          rank:'duplex_II', icon:'🎨', effect:null, fastDay:false, noWork:false,
          martyrCS:'Lukáš, lékař a evangelista, namaloval prý první ikonu Panny Marie. Patron malířů, lékařů a písařů.',
          martyrEN:'Luke, physician and evangelist, reportedly painted the first icon of the Virgin Mary. Patron of painters and scribes.' },
        // LISTOPAD
        { month:11, day:1,  name:'Svátek všech svatých',    nameEN:'All Saints Day',              nameLA:'Festum Omnium Sanctorum',
          rank:'duplex_I', icon:'👼', effect:'vigor_bonus', effectVal:10, fastDay:false, noWork:true,
          martyrCS:'Dnes slavíme všechny svaté, jejichž jména neznáme, ale kteří jsou s Bohem v nebi.',
          martyrEN:'Today we celebrate all saints whose names we do not know but who are with God in heaven.' },
        { month:11, day:11, name:'Sv. Martin',              nameEN:'St. Martin of Tours',         nameLA:'S. Martini Episcopi et Confessoris',
          rank:'duplex', icon:'🍷', effect:'market_bonus', effectVal:0.2, fastDay:false, noWork:false,
          martyrCS:'Martin z Tours přeřízl plášť pro žebráka. Na Martina se otvírají sudy s mladým vínem a porážejí husy.',
          martyrEN:"Martin of Tours cut his cloak for a beggar. On Martin's Day new wine barrels are opened and geese are slaughtered." },
        { month:11, day:25, name:'Sv. Kateřina',            nameEN:'St. Catherine of Alexandria', nameLA:'S. Catharinae Virginis et Martyris',
          rank:'duplex', icon:'✒️', effect:'notes_bonus', effectVal:1, fastDay:false, noWork:false,
          martyrCS:'Kateřina Alexandrijská disputovala s padesáti filozofy a všechny přesvědčila. Patronka písařů, studentů a knihkupců.',
          martyrEN:'Catherine of Alexandria disputed with fifty philosophers and convinced them all. Patron of scribes, students and booksellers.' },
        // PROSINEC
        { month:12, day:6,  name:'Sv. Mikuláš',             nameEN:'St. Nicholas',                nameLA:'S. Nicolai Episcopi et Confessoris',
          rank:'duplex', icon:'🎁', effect:'groschen_bonus', effectVal:5, fastDay:false, noWork:false,
          martyrCS:'Mikuláš, biskup z Myry, tajně dával věno chudým dívkám. Patron dětí, námořníků a obchodníků.',
          martyrEN:'Nicholas, bishop of Myra, secretly gave dowries to poor girls. Patron of children, sailors and merchants.' },
        { month:12, day:13, name:'Sv. Lucie',               nameEN:'St. Lucy',                    nameLA:'S. Luciae Virginis et Martyris',
          rank:'duplex', icon:'🕯️', effect:'candle_bonus', effectVal:2, fastDay:false, noWork:false,
          martyrCS:'Lucie, panna a mučednice, světlo uprostřed tmy. Její jméno znamená latinsky světlo.',
          martyrEN:'Lucy, virgin and martyr, light in the midst of darkness. Her name means light in Latin.' },
        { month:12, day:26, name:'Sv. Štěpán',              nameEN:'St. Stephen',                 nameLA:'S. Stephani Protomartyris',
          rank:'duplex_II', icon:'⭐', effect:null, fastDay:false, noWork:true,
          martyrCS:'Štěpán, první mučedník, byl ukamenován pro svou víru. Den po Vánocích připomíná cenu víry.',
          martyrEN:'Stephen, the first martyr, was stoned for his faith. The day after Christmas recalls the price of faith.' },
    ],

    // ── Výpočet Velikonoc (algoritmus Meeuse/Jones/Butcher) ──────────────────
    getEaster: function (year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return { month, day };
    },

    // Liturgická barva pro daný den — endgame-branches-reference.md, vestment-sezóna
    // fialová: advent + půst · bílá: vánoční + velikonoční doba · červená: letnice · zelená: jinak
    getLiturgicalColor: function (date) {
        const y = date.getFullYear();
        const easter = this.getEaster(y);
        const easterDate = new Date(y, easter.month - 1, easter.day);
        const ashDate = new Date(easterDate); ashDate.setDate(easterDate.getDate() - 46);
        const pentecostDate = new Date(easterDate); pentecostDate.setDate(easterDate.getDate() + 49);
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (d.getMonth() === 11 && d.getDate() <= 24) return 'purple'; // advent
        if ((d.getMonth() === 11 && d.getDate() >= 25) || (d.getMonth() === 0 && d.getDate() <= 5)) return 'white'; // vánoční doba
        if (d >= ashDate && d < easterDate) return 'purple'; // půst
        if (d >= easterDate && d < pentecostDate) return 'white'; // velikonoční doba
        if (d.getTime() === pentecostDate.getTime()) return 'red'; // letnice
        return 'green'; // mezidobí
    },

    // ── Sváteční databáze (fixní + pohyblivé) ────────────────────────────────
    getFeastsForMonth: function (month, year) {
        const feasts = [];
        const easter = this.getEaster(year);
        const easterDate = new Date(year, easter.month - 1, easter.day);
        const ashDate = new Date(easterDate); ashDate.setDate(easterDate.getDate() - 46);

        // Eventy A1-A9 (mají vlastní handlery)
        if (month === 4) feasts.push({ day: 30, key: 'cal_walpurgis', icon: '🔥', nameCS: 'Filipojakubská noc', nameEN: 'Walpurgis Night', nameLAT: 'Nox Philippi et Iacobi' });
        if (month === 5) feasts.push({ day: 1, key: 'cal_may_day', icon: '🌿', nameCS: 'Svátek máje', nameEN: 'May Day', nameLAT: 'Calendae Maiae' });
        if (month === 6) feasts.push({ day: 24, key: 'cal_midsummer', icon: '🌞', nameCS: 'Sv. Jan / Slunovrat', nameEN: 'St. John / Midsummer', nameLAT: 'Nativitas Sancti Ioannis' });
        if (month === 11) feasts.push({ day: 2, key: 'cal_all_souls', icon: '🕯️', nameCS: 'Dušičky', nameEN: 'All Souls', nameLAT: 'Commemoratio Omnium Fidelium Defunctorum' });
        if (month === 12) feasts.push({ day: 24, key: 'cal_christmas', icon: '⭐', nameCS: 'Štědrý den', nameEN: 'Christmas Eve', nameLAT: 'Vigilia Nativitatis Domini' });
        if (month === 12) feasts.push({ day: 31, key: 'cal_new_year', icon: '🎉', nameCS: 'Silvestr', nameEN: "New Year's Eve", nameLAT: 'Ultima Dies Anni' });
        if (month === 1)  feasts.push({ day: 1, key: 'cal_new_year', icon: '🎉', nameCS: 'Nový rok', nameEN: 'New Year', nameLAT: 'Calendae Ianuariae' });
        if (month === 12) {
            for (let d = 1; d <= 24; d++) feasts.push({ day: d, key: 'cal_advent', icon: '✝️', nameCS: 'Advent', nameEN: 'Advent', nameLAT: 'Tempus Adventus', subtle: true });
        }
        if (ashDate.getMonth() + 1 === month) feasts.push({ day: ashDate.getDate(), key: 'cal_ash_wednesday', icon: '✝️', nameCS: 'Popeleční středa', nameEN: 'Ash Wednesday', nameLAT: 'Feria IV Cinerum' });
        if (easter.month === month) feasts.push({ day: easter.day, key: 'cal_easter', icon: '✝️', nameCS: 'Velikonoce', nameEN: 'Easter', nameLAT: 'Pascha' });

        // Sanctorale — fixní svátky z feastDays databáze
        this.feastDays.forEach(f => {
            if (f.month === month) {
                // Přidat jen pokud ještě není v poli (pro dny jako 1/1, 11/2, 24/6 co jsou v obou)
                const alreadyHas = feasts.some(x => x.day === f.day && x.key && x.key !== 'cal_advent');
                if (!alreadyHas) {
                    feasts.push({
                        day: f.day,
                        key: 'feast_' + f.month + '_' + f.day,
                        icon: f.icon,
                        nameCS: f.name,
                        nameEN: f.nameEN,
                        nameLAT: f.nameLA,
                        rank: f.rank,
                        martyrCS: f.martyrCS,
                        martyrEN: f.martyrEN,
                        effect: f.effect,
                        effectVal: f.effectVal,
                        noWork: f.noWork,
                    });
                }
            }
        });

        return feasts;
    },

    // ── Lunární fáze pro den ──────────────────────────────────────────────────
    getLunarForDay: function (year, month, day) {
        const d = new Date(year, month - 1, day);
        const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
        const daysSince = (d - knownNewMoon) / 86400000;
        const phase = ((daysSince % 29.53058867) + 29.53058867) % 29.53058867;
        const idx = Math.round(phase / 29.53058867 * 8) % 8;
        return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][idx];
    },

    // ── Homo Signorum — Zvěrokruh a jeho vláda nad tělem ────────────────────
    // Klasická "Zodiac Man" tradice: každé znamení vládne tělesné části,
    // nebezpečné je pouštět žilou pod znamením, kterým měsíc právě prochází.
    // Aproximace: sidereálnej oběh měsíce (~27.32 dne) rozdělenej na 12 dílů —
    // stejnej kotevní bod jako getLunarForDay (synodickej cyklus), jiná perioda.
    ZODIAC_SIGNS: [
        { cs: 'Beran',     en: 'Aries',       icon: '♈', bodyPart_cs: 'hlava',           bodyPart_en: 'head' },
        { cs: 'Býk',       en: 'Taurus',      icon: '♉', bodyPart_cs: 'krk',             bodyPart_en: 'neck' },
        { cs: 'Blíženci',  en: 'Gemini',      icon: '♊', bodyPart_cs: 'ramena a paže',   bodyPart_en: 'shoulders and arms' },
        { cs: 'Rak',       en: 'Cancer',      icon: '♋', bodyPart_cs: 'hruď',            bodyPart_en: 'chest' },
        { cs: 'Lev',       en: 'Leo',         icon: '♌', bodyPart_cs: 'srdce a záda',    bodyPart_en: 'heart and back' },
        { cs: 'Panna',     en: 'Virgo',       icon: '♍', bodyPart_cs: 'břicho',          bodyPart_en: 'belly' },
        { cs: 'Váhy',      en: 'Libra',       icon: '♎', bodyPart_cs: 'ledviny',         bodyPart_en: 'kidneys' },
        { cs: 'Štír',      en: 'Scorpio',     icon: '♏', bodyPart_cs: 'klín',            bodyPart_en: 'loins' },
        { cs: 'Střelec',   en: 'Sagittarius', icon: '♐', bodyPart_cs: 'stehna',          bodyPart_en: 'thighs' },
        { cs: 'Kozoroh',   en: 'Capricorn',   icon: '♑', bodyPart_cs: 'kolena',          bodyPart_en: 'knees' },
        { cs: 'Vodnář',    en: 'Aquarius',    icon: '♒', bodyPart_cs: 'lýtka',           bodyPart_en: 'shins' },
        { cs: 'Ryby',      en: 'Pisces',      icon: '♓', bodyPart_cs: 'chodidla',        bodyPart_en: 'feet' },
    ],
    // Vodní trojice (Rak/Štír/Ryby) — přebytek vlhkosti, dobově nejrizikovější pro Minutio.
    ZODIAC_UNSAFE_IDX: [3, 7, 11],

    getZodiacForMoonDay: function (year, month, day) {
        const d = new Date(year, month - 1, day);
        const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
        const daysSince = (d - knownNewMoon) / 86400000;
        const SIDEREAL = 27.321661;
        const pos = ((daysSince % SIDEREAL) + SIDEREAL) % SIDEREAL;
        return Math.floor(pos / SIDEREAL * 12) % 12;
    },

    // ── Navigace ─────────────────────────────────────────────────────────────
    GAME_YEAR: 1465,

    getViewState: function () {
        if (!GameState.ui) GameState.ui = {};
        const now = new Date();
        if (!GameState.ui.calViewMonth) GameState.ui.calViewMonth = now.getMonth() + 1;
        if (!GameState.ui.calViewYear || GameState.ui.calViewYear > 1500) GameState.ui.calViewYear = this.GAME_YEAR;
        return { month: GameState.ui.calViewMonth, year: GameState.ui.calViewYear };
    },

    navigateTo: function (month, year) {
        const now = new Date();
        const baseYear = this.GAME_YEAR;
        const baseMonth = now.getMonth() + 1;
        const baseAbs = baseYear * 12 + baseMonth;
        const minAbs = baseAbs - 6;
        const maxAbs = baseAbs + 12;
        const targetAbs = year * 12 + month;
        if (targetAbs < minAbs || targetAbs > maxAbs) return;
        if (!GameState.ui) GameState.ui = {};
        GameState.ui.calViewMonth = month;
        GameState.ui.calViewYear = year;
        this.render();
    },

    prevMonth: function () {
        const { month, year } = this.getViewState();
        if (month === 1) this.navigateTo(12, year - 1);
        else this.navigateTo(month - 1, year);
    },

    nextMonth: function () {
        const { month, year } = this.getViewState();
        if (month === 12) this.navigateTo(1, year + 1);
        else this.navigateTo(month + 1, year);
    },

    // ── Klik na den — detail modal ────────────────────────────────────────────
    showDayDetail: function (day, month, year) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const feasts = this.getFeastsForMonth(month, year).filter(f => f.day === day && !f.subtle);
        const moonPhase = this.getLunarForDay(year, month, day);
        const monthName = lang === 'en' ? this.MONTHS_EN[month - 1] : this.MONTHS_CS[month - 1];

        let body = '<div style="text-align:center; margin-bottom:12px; font-size:1.5rem;">' + moonPhase + '</div>';
        body += '<p style="text-align:center; opacity:0.7; font-style:italic; font-size:0.85rem; margin-bottom:16px;">' + this.MONTHS_LAT[month - 1] + ' ' + day + ', Anno Domini ' + year + '</p>';

        if (feasts.length > 0) {
            feasts.forEach(f => {
                const name = lang === 'en' ? f.nameEN : f.nameCS;
                const martyr = lang === 'en' ? f.martyrEN : f.martyrCS;
                const rankLabel = f.rank ? '<span style="font-size:0.7rem; opacity:0.5; margin-left:6px; font-style:italic;">' + f.rank.replace(/_/g,' ') + '</span>' : '';
                body += '<div style="padding:10px 12px; margin:6px 0; background:rgba(197,160,89,0.1); border-left:3px solid var(--accent-gold); border-radius:4px;">';
                body += '<strong>' + f.icon + ' ' + name + '</strong>' + rankLabel;
                body += '<div style="font-size:0.78rem; opacity:0.6; font-style:italic; margin-top:2px;">' + f.nameLAT + '</div>';
                if (martyr) {
                    body += '<div style="font-size:0.82rem; margin-top:8px; line-height:1.5; border-top:1px solid rgba(197,160,89,0.2); padding-top:6px;">' + martyr + '</div>';
                }
                if (f.effect) {
                    const effectLabel = lang === 'en' ? 'Effect today:' : 'Efekt dnes:';
                    body += '<div style="font-size:0.75rem; color:var(--accent-gold); margin-top:6px;">✨ ' + effectLabel + ' ' + f.effect.replace(/_/g,' ') + (f.effectVal ? ' +' + (f.effectVal > 1 ? Math.round(f.effectVal*100)+'%' : f.effectVal) : '') + '</div>';
                }
                body += '</div>';
            });
        } else {
            const noFeast = lang === 'en' ? 'No feast day.' : 'Feria — žádný svátek.';
            body += '<p style="opacity:0.5; font-style:italic;">' + noFeast + '</p>';
        }

        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.modal({
                title: day + '. ' + monthName,
                text: body,
                choices: [{ label: lang === 'en' ? 'Close' : 'Zavřít', type: 'default', effect: () => { } }]
            });
        }
    },

    // ── Martyrologium — ranní čtení při Primě ────────────────────────────────
    readMartyrologyForTomorrow: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const m = tomorrow.getMonth() + 1;
        const d = tomorrow.getDate();
        const feast = this.feastDays.find(f => f.month === m && f.day === d);
        if (!feast) return;
        const name = lang === 'en' ? feast.nameEN : feast.name;
        const text = lang === 'en'
            ? 'Tomorrow: ' + feast.icon + ' ' + name + '. ' + (feast.martyrEN || '')
            : 'Zítra: ' + feast.icon + ' ' + name + '. ' + (feast.martyrCS || '');
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.panel(text, 'system');
        }
    },

    // ── Hlavní render ─────────────────────────────────────────────────────────
    render: function () {
        const el = document.getElementById('lore-calendarium-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        const hasTech = GameState.researchedTechs && GameState.researchedTechs.includes('tech_astronomy');
        const hasCal = (GameState.inventory && (GameState.inventory['perpetuum_calendarium'] || 0) > 0);

        if (!hasTech) {
            el.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.6;"><div style="font-size:2rem; margin-bottom:8px;">🔒</div><strong>' + (lang === 'en' ? 'Research Computus — Celestial Mechanics to unlock.' : 'Prostuduj Computus — Nebeská Mechanika pro odemčení.') + '</strong></div>';
            return;
        }

        if (!hasCal) {
            el.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.7;"><div style="font-size:2rem; margin-bottom:8px;">📅</div><strong>' + (lang === 'en' ? 'Craft a Perpetuum Calendarium to access this tab.' : 'Vytvoř Perpetuum Calendarium pro přístup k záložce.') + '</strong><p style="font-size:0.85rem; opacity:0.6; margin-top:8px; font-style:italic;">' + (lang === 'en' ? 'Recipe: 3× Paper, 2× Ink, 1× Vellum' : 'Recept: 3× Papír, 2× Inkoust, 1× Vellum') + '</p></div>';
            return;
        }

        const { month, year } = this.getViewState();
        const now = new Date();
        const isCurrentMonth = (month === now.getMonth() + 1);
        const today = now.getDate();

        const feasts = this.getFeastsForMonth(month, year);
        const feastMap = {};
        feasts.forEach(f => {
            if (!feastMap[f.day]) feastMap[f.day] = [];
            feastMap[f.day].push(f);
        });

        const realYear = new Date().getFullYear();
        const firstDay = new Date(realYear, month - 1, 1).getDay();
        const startOffset = (firstDay === 0) ? 6 : firstDay - 1;
        const daysInMonth = new Date(realYear, month, 0).getDate();
        let monthHasAdvent = false;

        const monthNameLat = this.MONTHS_LAT[month - 1];
        const monthNameLocal = lang === 'en' ? this.MONTHS_EN[month - 1] : this.MONTHS_CS[month - 1];
        const dayNames = this.DAYS_LAT;

        const baseAbs = this.GAME_YEAR * 12 + (now.getMonth() + 1);
        const minAbs = baseAbs - 6;
        const maxAbs = baseAbs + 12;
        const prevAbs = (month === 1 ? (year - 1) * 12 + 12 : year * 12 + (month - 1));
        const nextAbs = (month === 12 ? (year + 1) * 12 + 1 : year * 12 + (month + 1));
        const canPrev = prevAbs >= minAbs;
        const canNext = nextAbs <= maxAbs;

        let h = '<div style="font-family:\'Cinzel\'; text-align:center; margin-bottom:20px;">';
        h += '<div style="font-size:0.7rem; opacity:0.5; letter-spacing:2px; text-transform:uppercase; margin-bottom:4px;">Anno Domini ' + year + '</div>';
        h += '<div style="display:flex; align-items:center; justify-content:center; gap:16px;">';
        h += '<button onclick="CalendarSystem.prevMonth()" style="background:none; border:1px solid var(--accent-gold); color:var(--accent-gold); padding:4px 10px; border-radius:4px; cursor:pointer; font-family:\'Cinzel\'; font-size:0.8rem;" ' + (canPrev ? '' : 'disabled') + '>◀</button>';
        h += '<div><div style="font-size:1.2rem; font-weight:600; color:var(--accent-gold);">' + monthNameLat + '</div>';
        h += '<div style="font-size:0.75rem; opacity:0.6;">' + monthNameLocal + '</div></div>';
        h += '<button onclick="CalendarSystem.nextMonth()" style="background:none; border:1px solid var(--accent-gold); color:var(--accent-gold); padding:4px 10px; border-radius:4px; cursor:pointer; font-family:\'Cinzel\'; font-size:0.8rem;" ' + (canNext ? '' : 'disabled') + '>▶</button>';
        h += '</div></div>';

        h += '<div style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:4px;">';
        dayNames.forEach(d => { h += '<div style="text-align:center; font-size:0.65rem; font-family:\'Cinzel\'; opacity:0.5; letter-spacing:1px; padding:4px 0;">' + d + '</div>'; });
        h += '</div>';
        h += '<div style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px;">';

        for (let i = 0; i < startOffset; i++) h += '<div style="padding:6px; min-height:44px;"></div>';

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = isCurrentMonth && d === today;
            const dayFeasts = feastMap[d] || [];
            const mainFeast = dayFeasts.find(f => !f.subtle);
            const isAdvent = dayFeasts.some(f => f.subtle && f.key === 'cal_advent');
            if (isAdvent) monthHasAdvent = true;
            const moon = (d === 1 || d === 8 || d === 15 || d === 22 || d === 29) ? this.getLunarForDay(year, month, d) : '';

            let bg = 'rgba(0,0,0,0.03)';
            if (isToday) bg = 'rgba(197,160,89,0.25)';
            else if (mainFeast) bg = 'rgba(197,160,89,0.12)';
            else if (isAdvent) bg = 'rgba(100,80,150,0.08)';

            const border = isToday ? '2px solid var(--accent-gold)' : mainFeast ? '1px solid rgba(197,160,89,0.4)' : '1px solid rgba(0,0,0,0.06)';

            h += '<div onclick="CalendarSystem.showDayDetail(' + d + ',' + month + ',' + year + ')" style="padding:5px 4px; min-height:44px; background:' + bg + '; border:' + border + '; border-radius:4px; cursor:pointer; position:relative; transition:background 0.15s;" onmouseover="this.style.background=\'rgba(197,160,89,0.18)\'" onmouseout="this.style.background=\'' + bg + '\'">';
            h += '<div style="font-size:0.75rem; font-family:\'Cinzel\'; ' + (isToday ? 'color:var(--accent-gold);font-weight:700;' : '') + '">' + d + '</div>';
            if (moon) h += '<div style="font-size:0.7rem; line-height:1;">' + moon + '</div>';
            if (mainFeast) h += '<div style="font-size:0.8rem; line-height:1; margin-top:2px;" title="' + mainFeast.nameLAT + '">' + mainFeast.icon + '</div>';
            if (isAdvent && !mainFeast) h += '<div style="font-size:0.6rem; opacity:0.4; font-style:italic;">adv</div>';
            h += '</div>';
        }

        h += '</div>';

        // Legenda
        h += '<div style="margin-top:16px; padding:12px; background:rgba(0,0,0,0.04); border-radius:6px; font-size:0.78rem; opacity:0.7;">';
        h += '<strong style="font-family:\'Cinzel\'; font-size:0.7rem; letter-spacing:1px;">' + (lang === 'en' ? 'LEGEND' : 'LEGENDA') + '</strong>';
        const legend = feasts.filter(f => !f.subtle).filter((f, i, a) => a.findIndex(x => x.key === f.key) === i);
        if (legend.length > 0) {
            legend.forEach(f => {
                const name = lang === 'en' ? f.nameEN : f.nameCS;
                h += '<div style="margin-top:4px;">' + f.icon + ' <strong>' + name + '</strong> <span style="opacity:0.6; font-style:italic;">— ' + f.nameLAT + '</span></div>';
            });
        } else {
            h += '<div style="margin-top:4px; font-style:italic; opacity:0.6;">' + (lang === 'en' ? 'No feast days this month.' : 'V tomto měsíci žádné svátky.') + '</div>';
        }
        if (monthHasAdvent) h += '<div style="margin-top:4px;">✝️ <strong>Advent</strong> <span style="opacity:0.6; font-style:italic;">— Tempus Adventus</span></div>';
        h += '</div>';

        el.innerHTML = h;
    },

    // ── Kalendářní eventy A1-A9 ───────────────────────────────────────────────
    checkCalendarEvents: function () {
        const today = new Date().toISOString().slice(0, 10);
        if (!GameState.flags) GameState.flags = {};
        if (GameState.flags.calEventChecked === today) return;
        GameState.flags.calEventChecked = today;

        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const year = now.getFullYear();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const L = (key) => t('events.' + key);
        const easter = this.getEaster(year);
        const easterDate = new Date(year, easter.month - 1, easter.day);
        const ashDate = new Date(easterDate); ashDate.setDate(easterDate.getDate() - 46);

        const flagKey = (id) => 'calEvent_' + id + '_' + year;
        const done = (id) => !!GameState.flags[flagKey(id)];
        const mark = (id) => { GameState.flags[flagKey(id)] = true; };

        // Martyrologium — ranní čtení při Primě
        if (typeof CanonicalHours !== 'undefined' || true) {
            const hour = (typeof TimeSys !== 'undefined') ? TimeSys.gameHour() : new Date().getHours();
            if (hour >= 6 && hour <= 8 && !GameState.flags['martyrologyRead_' + today]) {
                GameState.flags['martyrologyRead_' + today] = true;
                this.readMartyrologyForTomorrow();
            }
        }

        if (ashDate.getMonth() + 1 === month && ashDate.getDate() === day && !done('cal_ash_wednesday')) {
            mark('cal_ash_wednesday');
            NotificationSystem.panel(L('cal_ash_wednesday.notify'), 'system');
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.ashWednesdayUntil = Date.now() + 3 * 24 * 3600 * 1000;
            Game.save();
        }

        if (month === 4 && day === 30 && !done('cal_walpurgis')) {
            mark('cal_walpurgis');
            NotificationSystem.panel(L('cal_walpurgis.athanor_notif'), 'system');
            NotificationSystem.modal({
                title: L('cal_walpurgis.title'),
                text: L('cal_walpurgis.text'),
                icon: '🔥',
                choices: [
                    { label: L('cal_walpurgis.athanor_btn'), type: 'primary', effect: () => {
                        if (!GameState.eventFlags) GameState.eventFlags = {};
                        GameState.eventFlags.walpurgisBonus = true;
                        GameState.eventFlags.inquisitorRisk = (Math.random() < 0.4);
                        NotificationSystem.panel(L('cal_walpurgis.athanor_res'), 'system');
                        Game.save();
                    }},
                    { label: L('cal_walpurgis.pray_btn'), type: 'default', effect: () => {
                        if (typeof VigorSystem !== 'undefined') VigorSystem.add(10);
                        NotificationSystem.panel(L('cal_walpurgis.pray_res'), 'system');
                        Game.save();
                    }},
                    { label: L('cal_walpurgis.herbs_btn'), type: 'default', effect: () => {
                        Game.addItem('thyme', 3);
                        Game.addItem('st_johns_wort', 2);
                        Game.addItem('chamomile', 1);
                        NotificationSystem.panel(L('cal_walpurgis.herbs_res'), 'system');
                        Game.save();
                    }},
                ]
            });
        }

        if (easter.month === month && easter.day === day && !done('cal_easter')) {
            mark('cal_easter');
            NotificationSystem.panel(L('cal_easter.notify'), 'system');
            if (typeof VigorSystem !== 'undefined') VigorSystem.add(30);
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.easterToday = true;
            Game.save();
        }

        if (month === 5 && day === 1 && !done('cal_may_day')) {
            mark('cal_may_day');
            NotificationSystem.panel(L('cal_may_day.notify'), 'system');
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.mayDayBonus = true;
            Game.save();
        }

        if (month === 6 && day === 24 && !done('cal_midsummer')) {
            mark('cal_midsummer');
            NotificationSystem.panel(L('cal_midsummer.herbs_notif'), 'system');
            NotificationSystem.modal({
                title: L('cal_midsummer.title'),
                text: L('cal_midsummer.text'),
                icon: '🌞',
                choices: [
                    { label: L('cal_midsummer.herbs_btn'), type: 'primary', effect: () => {
                        Game.addItem('st_johns_wort', 3);
                        Game.addItem('thyme', 2);
                        Game.addItem('pollen', 1);
                        if (typeof VigorSystem !== 'undefined') VigorSystem.add(-10);
                        NotificationSystem.panel(L('cal_midsummer.herbs_res'), 'system');
                        Game.save();
                    }},
                    { label: L('cal_midsummer.work_btn'), type: 'default', effect: () => {
                        if (!GameState.eventFlags) GameState.eventFlags = {};
                        GameState.eventFlags.midsummerCandleBonus = true;
                        NotificationSystem.panel(L('cal_midsummer.work_res'), 'system');
                        Game.save();
                    }},
                ]
            });
        }

        if (month === 11 && day === 2 && !done('cal_all_souls')) {
            mark('cal_all_souls');
            NotificationSystem.panel(L('cal_all_souls.notify'), 'system');
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.titivillusActive = true;
            GameState.eventFlags.nigredoBonus = true;
            Game.save();
        }

        if (month === 12 && day === 1 && !done('cal_advent')) {
            mark('cal_advent');
            NotificationSystem.panel(L('cal_advent.notify'), 'system');
            if (!GameState.eventFlags) GameState.eventFlags = {};
            GameState.eventFlags.adventActive = true;
            Game.save();
        }

        if (month === 12 && day === 24 && !done('cal_christmas')) {
            mark('cal_christmas');
            NotificationSystem.panel(L('cal_christmas.notify'), 'system');
            if (typeof VigorSystem !== 'undefined') VigorSystem.add(50);
            Game.save();
        }

        if (month === 12 && day === 31 && !done('cal_new_year')) {
            mark('cal_new_year');
            NotificationSystem.panel(L('cal_new_year.notify'), 'system');
            Game.addKronikaEntry('important',
                'Rok ' + year + ' uzavřen. Calendarium se obnovuje.',
                'Year ' + year + ' closed. The Calendarium renews.',
                'Annus ' + year + ' clausus est.'
            );
            Game.save();
        }
    }
};
