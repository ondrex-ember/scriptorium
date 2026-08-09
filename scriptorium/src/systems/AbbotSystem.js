// ═══════════════════════════════════════════════════════════════════════════
// ABBOT SYSTEM — rodokmen opatů Monasterium Sancti Carbunculi (založeno 1189)
// + současný stav. "Nejlehčí run" hlubšího Opat vlákna (zakazky-rozsireni-
// ctyri-kategorie-mrd.md traces, 9.8.2026) — čistě obsahová/UI vrstva,
// žádná nová herní mechanika. Zobrazuje existující GameState.secrets.abbotFavor
// (dnes tiše měněný Kategorií C/D zakázek), jinak jen historie/lore.
//
// Augustin NENÍ opat — je jeho přímý zástupce (mirror "Dekret opata"
// Chronicon vzoru: "skrze mne káže vám zvěstovati... bratr váš, Augustin").
// Aktuální opat (Bernard) je často na cestách mezi klášterem a Olomouckým
// opatstvím — připraveno jako háček pro budoucí "cestující opat" mechaniku,
// dnes jen text, žádný stavový automat.
// abbot-lineage-mrd (9.8.2026)
// ═══════════════════════════════════════════════════════════════════════════

const AbbotSystem = {

    MONASTERY_NAME_LAT: 'Monasterium Sancti Carbunculi',
    FOUNDED_YEAR: 1189,

    // Rodokmen — 12 opatů 1189–1459, pak současný (Bernard, viz CURRENT níže).
    // Vymyšlená lore (žádný reálný klášter), ale roky/události kotví na
    // existující historické zakotvení hry (husitské války 1419–1434 —
    // mirror i18n/cs.js husitský blok).
    LINEAGE: [
        { name: 'Blažej I.', years: '1189–1204', note_cs: 'Zakladatel. Podle klášterní pověsti založil dům na místě, kde v noci žhnul o samotě uhlík, jenž nikdy neuhasl — odtud "Carbunculus".', note_en: 'The founder. Monastery legend holds he built the house where a single ember glowed through the night, never dying out — hence "Carbunculus".' },
        { name: 'Godefrid', years: '1204–1219', note_cs: 'Postavil první kamenný kostel na místě dřevěné kaple.', note_en: 'Built the first stone church on the site of the wooden chapel.' },
        { name: 'Bertold', years: '1219–1241', note_cs: 'Za jeho opatství klášter opevnil zdi — na Moravu dolehl strach z tatarského vpádu.', note_en: 'Under his abbacy the monastery fortified its walls — fear of the Tatar invasion reached Moravia.' },
        { name: 'Ctibor', years: '1241–1265', note_cs: 'Rozšířil hospodářství o první rybníky.', note_en: 'Expanded the estate with the first fishponds.' },
        { name: 'Wolfram', years: '1265–1288', note_cs: 'Německého původu — přivedl první konvrše ze Slezska.', note_en: 'Of German origin — brought the first lay brothers from Silesia.' },
        { name: 'Domoslav', years: '1288–1310', note_cs: 'Založil skriptorium jako samostatnou dílnu, ne pouhý koutek knihovny.', note_en: 'Established the scriptorium as its own workshop, not merely a corner of the library.' },
        { name: 'Jindřich I.', years: '1310–1335', note_cs: 'Zemřel na mor, co se toho roku prohnal krajem.', note_en: 'Died of the plague that swept the region that year.' },
        { name: 'Petr z Rokytné', years: '1335–1358', note_cs: 'Rodák z blízké vsi — první opat zvolený z místních, ne dosazený zvenčí.', note_en: 'A native of a nearby village — the first abbot elected from among the local brothers, not appointed from outside.' },
        { name: 'Blažej II.', years: '1358–1379', note_cs: 'Jmenován po předku ze zbožnosti, ne z příbuzenství.', note_en: 'Named after his predecessor out of piety, not kinship.' },
        { name: 'Racek', years: '1379–1408', note_cs: 'Nejdelší funkční období rodokmenu — 29 let klidu před bouří.', note_en: "The longest tenure in the lineage — 29 years of calm before the storm." },
        { name: 'Silvestr', years: '1408–1434', note_cs: 'Opat husitských válek. Klášter přežil, ne beze ztrát — část knihovny byla zachráněna jen díky včasnému ukrytí.', note_en: 'The abbot of the Hussite Wars. The monastery survived, not unscathed — part of the library was saved only by being hidden in time.' },
        { name: 'Ambrož', years: '1434–1459', note_cs: 'Opat obnovy. Vrátil klášteru hospodářskou sílu po letech válečných útrap.', note_en: 'The abbot of rebuilding. Restored the monastery\'s economic strength after years of wartime hardship.' },
    ],

    // Současný stav (1465) — Bernard jako opat, Augustin jako jeho přímý
    // zástupce/prior. Bernard často cestuje mezi klášterem a Olomouckým
    // opatstvím (Dekret opata, Chronicon) — text zatím, žádný stavový
    // automat (viz hlavička souboru).
    CURRENT: {
        name: 'Bernard',
        since: '1459',
        note_cs: 'Třináctý opat od založení. Často na cestách mezi klášterem a Olomouckým opatstvím — jedná s biskupstvím, dohlíží na záležitosti řádu ve městě.',
        note_en: 'The thirteenth abbot since the founding. Often travelling between the monastery and the Olomouc Abbey — dealing with the bishopric, overseeing the order\'s affairs in the city.',
        deputyName: 'Augustin',
        deputyNote_cs: 'Bratr Augustin, přímý zástupce opata. V jeho nepřítomnosti mluví jeho jménem a řídí denní chod domu.',
        deputyNote_en: "Brother Augustin, the abbot's direct deputy. In his absence, he speaks in his name and runs the daily life of the house.",
    },

    // Fuzzy popis abbotFavor — mirror DecaySystem.miceFuzzyShort stylu,
    // ale inline text (ne i18n dictionary — mirror letters.js/Zakázky
    // katalog vzoru pro obsahově těžké, ne mechanicky sdílené texty).
    _favorFuzzy: function (favor, isCs) {
        if (favor >= 15) return isCs ? '🙏 Opat vás chová ve zvláštní přízni.' : "🙏 The abbot holds you in special favour.";
        if (favor >= 5) return isCs ? '✅ Opat je s vámi spokojen.' : '✅ The abbot is pleased with you.';
        if (favor > -5) return isCs ? '➖ Opat vás nezná blíže, ani v dobrém, ani ve zlém.' : "➖ The abbot does not know you well, for good or ill.";
        if (favor > -15) return isCs ? '⚠️ Opat vás sleduje s jistou obezřetností.' : '⚠️ The abbot watches you with some wariness.';
        return isCs ? '🔥 Opat má o vás vážné pochybnosti.' : '🔥 The abbot has serious doubts about you.';
    },

    render: function () {
        const el = document.getElementById('library-opat-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isCs = lang !== 'en';
        const favor = (GameState.secrets && GameState.secrets.abbotFavor) || 0;

        const lineageHtml = this.LINEAGE.map((a, i) => `
            <div style="display:flex; gap:10px; padding:8px 0; border-bottom:1px solid rgba(197,160,89,0.15);">
                <div style="font-size:0.7rem; opacity:0.5; min-width:26px; text-align:right;">${i + 1}.</div>
                <div>
                    <div style="font-weight:bold; font-size:0.88rem;">${a.name} <span style="font-weight:normal; opacity:0.6; font-size:0.78rem;">(${a.years})</span></div>
                    <div style="font-size:0.78rem; opacity:0.75; font-style:italic; margin-top:2px;">${isCs ? a.note_cs : a.note_en}</div>
                </div>
            </div>`).join('');

        const c = this.CURRENT;
        el.innerHTML = `
            <div style="background:rgba(197,160,89,0.07); border:1px solid rgba(197,160,89,0.25); border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                <div style="font-size:0.72rem; opacity:0.6; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:4px;">${this.MONASTERY_NAME_LAT}</div>
                <div style="font-size:0.85rem;">${isCs ? 'Založeno' : 'Founded'} ${this.FOUNDED_YEAR} — ${isCs ? '13. opat' : '13th abbot'}: <strong>${c.name}</strong> (${isCs ? 'od' : 'since'} ${c.since})</div>
                <div style="font-size:0.8rem; opacity:0.8; margin-top:6px; font-style:italic;">${isCs ? c.note_cs : c.note_en}</div>
                <div style="font-size:0.8rem; margin-top:10px; padding-top:10px; border-top:1px solid rgba(197,160,89,0.2);">
                    👤 <strong>${c.deputyName}</strong> — ${isCs ? 'zástupce opata' : "abbot's deputy"}
                    <div style="font-size:0.78rem; opacity:0.75; font-style:italic; margin-top:2px;">${isCs ? c.deputyNote_cs : c.deputyNote_en}</div>
                </div>
                <div style="font-size:0.8rem; margin-top:10px; padding-top:10px; border-top:1px solid rgba(197,160,89,0.2);">
                    ${this._favorFuzzy(favor, isCs)}
                </div>
            </div>
            <div style="font-size:0.72rem; opacity:0.6; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:8px;">${isCs ? 'Rodokmen opatů' : 'Lineage of Abbots'}</div>
            <div>${lineageHtml}</div>
        `;
    },
};