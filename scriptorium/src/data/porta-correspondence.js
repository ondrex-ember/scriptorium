// ═══════════════════════════════════════════════════════════════════════════
// OutgoingLettersDB — Porta, odchozí korespondence.
// Hráč vybere kontakt + téma, holub odletí (spotřebuje se), po travelHours
// dorazí odpověď (nebo se holub ztratí — riskLoss). Odpověď se generuje
// přímo jako dynamický dopis (stejný pool jako Chronicon Vrstva 3), NE přes
// LettersDB+trigger — obchází to drip cooldown, protože je to přímá reakce
// na hráčovu akci, ne náhodně objevený dopis.
// ═══════════════════════════════════════════════════════════════════════════

const OutgoingLettersDB = [
    {
        id: 'opat',
        name_cs: 'Opat', name_en: 'The Abbot',
        icon: '🏛️',
        seal: 'abbot',
        topics: [
            {
                id: 'opat_rada_kazen',
                label_cs: 'Požádat o radu ve věci řádové kázně',
                label_en: 'Ask for guidance on monastic discipline',
                cost: { pigeon: 1, paper: 1, ink: 1 },
                travelHours: 18,
                riskLoss: 0.05,
                reply: {
                    title_cs: 'Odpověď Opata',
                    title_en: 'Reply from the Abbot',
                    text_cs: '„Bratře, kázeň se nevynucuje strachem, ale příkladem. Dohlédni na mladší bratry sám, dřív než na ně dohlédne Bůh přísněji, než by sis přál. — Opat"',
                    text_en: '"Brother, discipline is not enforced by fear but by example. Watch over the younger brothers yourself, before God watches over them more sternly than you would wish. — The Abbot"',
                    effect: function () {
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('church', 2);
                    },
                    notify_cs: 'Opatova slova zapsána. (Ecclesia +2)',
                    notify_en: 'The Abbot\'s words are noted. (Ecclesia +2)'
                }
            },
            {
                id: 'opat_zapujceni_rukopisu',
                label_cs: 'Požádat o zapůjčení rukopisu z opatovy sbírky',
                label_en: 'Ask to borrow a manuscript from the Abbot\'s collection',
                cost: { pigeon: 1, paper: 1, ink: 1 },
                travelHours: 24,
                riskLoss: 0.05,
                reply: {
                    title_cs: 'Odpověď Opata',
                    title_en: 'Reply from the Abbot',
                    text_cs: '„Budiž, bratře — posílám s poslem pár listů popsaných mou vlastní rukou. Nakládej s nimi šetrněji než se svým svědomím. — Opat"',
                    text_en: '"So be it, brother — I send with the messenger a few leaves in my own hand. Handle them more carefully than your conscience. — The Abbot"',
                    effect: function () {
                        if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('paper', 3);
                    },
                    notify_cs: 'Dorazilo: 3× Papír z opatovy sbírky.',
                    notify_en: 'Arrived: 3× Paper from the Abbot\'s collection.'
                }
            },
            {
                // vrchcaby-hrich-mrd (15.8.2026): žádost o návštěvu, potřeba pro
                // osobní zpověď (presence gate). Skrytá, když je opat už tu.
                id: 'opat_pozadat_navstevu',
                label_cs: 'Požádat opata o návštěvu',
                label_en: "Ask the Abbot to visit",
                cost: { pigeon: 1, paper: 1, ink: 1 },
                travelHours: function () {
                    return (GameState.abbotLocation === 'traveling') ? 24 : 60;
                },
                riskLoss: 0.05,
                hideIf: function () {
                    return GameState.abbotLocation === 'present';
                },
                reply: {
                    title_cs: 'Odpověď Opata',
                    title_en: 'Reply from the Abbot',
                    text_cs: '„Bratře, vyslyšel jsem tvé volání a vydávám se na cestu do kláštera. Buď trpělivý — cesty jsou, jaké jsou. — Opat"',
                    text_en: '"Brother, I have heard your call and set out for the monastery. Be patient — the roads are as they are. — The Abbot"',
                    effect: function () {
                        GameState.abbotLocation = 'present';
                        GameState.abbotLocationNextTick = Date.now() + 2 * 24 * 3600000;
                        if (typeof AbbotSystem !== 'undefined' && AbbotSystem.renderPill) AbbotSystem.renderPill();
                    },
                    notify_cs: 'Opat dorazil do kláštera.',
                    notify_en: 'The Abbot has arrived at the monastery.'
                }
            }
        ]
    },
    {
        id: 'vrchnost',
        name_cs: 'Vrchnost', name_en: 'The Lord',
        icon: '🏰',
        seal: 'noble',
        topics: [
            {
                id: 'vrchnost_stiznost_mlyn',
                label_cs: 'Postěžovat si na stav cesty ke mlýnu',
                label_en: 'Complain about the state of the mill road',
                cost: { pigeon: 1, paper: 1, ink: 1 },
                travelHours: 30,
                riskLoss: 0.08,
                reply: {
                    title_cs: 'Odpověď Vrchnosti',
                    title_en: 'Reply from the Lord',
                    text_cs: '„Ctihodný, cesty spravuje ten, kdo má na to lidi a groše — tedy vy, ne já. Ale posílám aspoň pár mincí na dobrou vůli. — Vrchnost"',
                    text_en: '"Reverend, roads are kept by whoever has the men and coin for it — that is you, not I. But I send a few coins for goodwill\'s sake. — The Lord"',
                    effect: function () {
                        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(5);
                    },
                    notify_cs: 'Dorazilo: 5 Grošů od Vrchnosti.',
                    notify_en: 'Arrived: 5 Groschen from the Lord.'
                }
            },
            {
                id: 'vrchnost_zadost_ochrana',
                label_cs: 'Požádat o ochranu kláštera v neklidných časech',
                label_en: 'Ask for protection of the monastery in unquiet times',
                cost: { pigeon: 1, paper: 1, ink: 1 },
                travelHours: 36,
                riskLoss: 0.08,
                reply: {
                    title_cs: 'Odpověď Vrchnosti',
                    title_en: 'Reply from the Lord',
                    text_cs: '„Ochranu poskytnu tomu, kdo mi ji jednou oplatí. Zapamatuji si tuhle prosbu, ctihodný. — Vrchnost"',
                    text_en: '"Protection I grant to those who repay it in kind one day. I shall remember this request, reverend. — The Lord"',
                    effect: function () {
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 2);
                    },
                    notify_cs: 'Vrchnost si tě zapamatovala. (Vesnice +2)',
                    notify_en: 'The Lord remembers you. (Village +2)'
                }
            }
        ]
    },
    {
        id: 'kovar',
        name_cs: 'Kovář', name_en: 'The Blacksmith',
        icon: '🔨',
        seal: 'village',
        topics: [
            {
                id: 'kovar_objednavka_naradi',
                label_cs: 'Objednat kování na příští veletrh',
                label_en: 'Order ironwork for the next fair',
                cost: { pigeon: 1, paper: 1, ink: 1 },
                travelHours: 20,
                riskLoss: 0.1,
                reply: {
                    title_cs: 'Odpověď Kováře',
                    title_en: 'Reply from the Blacksmith',
                    text_cs: '„Ctihodný otče, kování bude hotové, jak slíbeno. Posílám na dobro pár kousků navíc — ať vidíte, že Kovář nezklame. — Kovář"',
                    text_en: '"Reverend father, the ironwork will be ready as promised. I send a few extra pieces besides — so you see the Smith does not disappoint. — The Blacksmith"',
                    effect: function () {
                        if (typeof Game !== 'undefined' && Game.addItem) Game.addItem('kovani', 2);
                    },
                    notify_cs: 'Dorazilo: 2× Kování od Kováře.',
                    notify_en: 'Arrived: 2× Ironwork from the Blacksmith.'
                }
            },
            {
                id: 'kovar_smlouvani_cena',
                label_cs: 'Smlouvat o ceně za poslední zakázku',
                label_en: 'Haggle over the price of the last order',
                cost: { pigeon: 1, paper: 1, ink: 1 },
                travelHours: 16,
                riskLoss: 0.1,
                reply: {
                    title_cs: 'Odpověď Kováře',
                    title_en: 'Reply from the Blacksmith',
                    text_cs: '„Ctihodný, s klášterem se smlouvat nesluší, ale pár grošů vám vrátím — ať je mezi námi klid. — Kovář"',
                    text_en: '"Reverend, haggling with a monastery is unseemly, but I\'ll return a few groschen — let there be peace between us. — The Blacksmith"',
                    effect: function () {
                        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(3);
                    },
                    notify_cs: 'Dorazilo: 3 Groše od Kováře.',
                    notify_en: 'Arrived: 3 Groschen from the Blacksmith.'
                }
            }
        ]
    }
];