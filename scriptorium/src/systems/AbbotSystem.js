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

    // Charakterové rysy Bernarda — určují VÁHU (ne jen text), jak silně
    // konkrétní akce ovlivní abbotFavor. Viz _abbotFavorMultiplier níže,
    // volané z CommitmentsSystem.resolveLocalAkter. Zatím jen Scriptorium
    // strana — živá mood hodnota aktéra 'klaster' v Chroniconu (core/engine.js)
    // se dnes počítá z frekvence favor-reportů, ne z charakteru; provázání
    // charakteru do TÉ hodnoty je budoucí krok (zásah do běžícího Chronicon
    // enginu, ne jen do Scriptoria — samostatné rozhodnutí).
    // abbot-persona-mrd (9.8.2026)
    TRAITS: [
        {
            id: 'prisny_ve_vire',
            name_cs: 'Přísný ve víře', name_en: 'Strict in Faith',
            desc_cs: 'Kacířské myšlenky ho zraní hluboko — každý opis pro kteroukoliv stranu bolí víc, než by čekal nezasvěcený.',
            desc_en: 'Heretical thoughts wound him deeply — every copy, for either side, stings more than an outsider would expect.',
        },
        {
            id: 'verny_rimu',
            name_cs: 'Věrný Římu', name_en: 'Loyal to Rome',
            desc_cs: 'Nakloněn katolické straně sporu — utrakvistické psaní ho zraní citelně víc než provolání Zelenohorské jednoty.',
            desc_en: 'Inclined toward the Catholic side of the dispute — an Utraquist letter wounds him noticeably more than a League proclamation.',
        },
    ],

    // Připravená zásoba budoucích opatů — následníci pro (zatím
    // neimplementovaný) engine úmrtí/volby. Dnes jen data, nikde nečtená
    // krom tohoto pole samotného.
    CANDIDATES: [
        {
            name: 'Prokop',
            traits_cs: ['Mírný soudce — kacířské myšlenky ho zraní méně, hospodářské spory více'],
            traits_en: ['Gentle judge — heretical thoughts wound him less, economic disputes more'],
        },
        {
            name: 'Metoděj',
            traits_cs: ['Učenec — nakloněn skriptoriu a knihovně nad hospodářstvím'],
            traits_en: ['Scholar — favours the scriptorium and library over the estate'],
        },
    ],

    // Váhování abbotFavorDelta podle Bernardova charakteru. Volané z
    // CommitmentsSystem.resolveLocalAkter TĚSNĚ před zápisem do
    // GameState.secrets.abbotFavor — inquisitionHeatDelta zůstává
    // nedotčený (to je objektivní riziko, ne osobní reakce opata).
    _abbotFavorMultiplier: function (actorId, letterKey) {
        if (actorId !== 'kacirska') return 1.0; // Přísný ve víře cílí jen na herezi, D-kategorie beze změny
        let mult = 1.5; // Přísný ve víře — obecný základ pro celou Kategorii C
        if (letterKey === 'utrakvisticky_opis') mult *= 1.3;   // Věrný Římu — extra bolest
        else if (letterKey === 'zelenohorska_provolani') mult *= 0.8; // Věrný Římu — soucit s vlastní stranou
        return mult;
    },


    // ale inline text (ne i18n dictionary — mirror letters.js/Zakázky
    // katalog vzoru pro obsahově těžké, ne mechanicky sdílené texty).
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
                <div style="font-size:0.78rem; margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
                    ${this.TRAITS.map(tr => `<span style="background:rgba(197,160,89,0.15); border-radius:4px; padding:2px 8px;" title="${isCs ? tr.desc_cs : tr.desc_en}">${isCs ? tr.name_cs : tr.name_en}</span>`).join('')}
                </div>
                <div style="font-size:0.8rem; margin-top:10px; padding-top:10px; border-top:1px solid rgba(197,160,89,0.2);">
                    👤 <strong>${c.deputyName}</strong> — ${isCs ? 'zástupce opata' : "abbot's deputy"}
                    <div style="font-size:0.78rem; opacity:0.75; font-style:italic; margin-top:2px;">${isCs ? c.deputyNote_cs : c.deputyNote_en}</div>
                </div>
                <div style="font-size:0.8rem; margin-top:10px; padding-top:10px; border-top:1px solid rgba(197,160,89,0.2);">
                    ${this._favorFuzzy(favor, isCs)}
                </div>
            </div>
            ${this._chroniconLiveSection(isCs)}
            <div style="font-size:0.72rem; opacity:0.5; margin-bottom:14px; font-style:italic;">
                ${isCs ? '🕯️ V řádu čekají další bratři, jednou k nástupnictví způsobilí' : '🕯️ Other brothers wait in the order, one day fit to succeed'}: ${this.CANDIDATES.map(cd => cd.name).join(', ')}
            </div>
            <div style="font-size:0.72rem; opacity:0.6; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:8px;">${isCs ? 'Rodokmen opatů' : 'Lineage of Abbots'}</div>
            <div>${lineageHtml}</div>
        `;
    },

    // Živá sekce z Chronicon snapshotu (abbot-persona-mrd, 9.8.2026) —
    // nálada/jmění/zásoby "legitimity" a vztahy s ostatními 10 aktéry
    // (relations pole, dřív jen interní pro engine, teď v exponovaném
    // snapshotu). Tichý fallback (prázdný string), pokud snapshot chybí/
    // je starý — mirror principu zbytku ChroniconSystem.
    _chroniconLiveSection: function (isCs) {
        if (typeof ChroniconSystem === 'undefined' || !ChroniconSystem._snap) return '';
        const actors = ChroniconSystem._snap.actors;
        if (!Array.isArray(actors)) return '';
        const klaster = actors.find(a => a.id === 'klaster');
        if (!klaster) return '';

        const nameById = {};
        actors.forEach(a => { nameById[a.id] = isCs ? a.label : (a.label_en || a.label); });

        const relEntries = klaster.relations
            ? Object.entries(klaster.relations)
                .filter(([id]) => nameById[id])
                .sort((a, b) => b[1] - a[1])
            : [];
        const relHtml = relEntries.map(([id, val]) => {
            const color = val > 20 ? '#5a9a5a' : val < -5 ? '#c0392b' : '#a0722d';
            const sign = val > 0 ? '+' : '';
            return `<span style="display:inline-block; margin:2px 6px 2px 0; font-size:0.76rem;">${nameById[id]}: <strong style="color:${color};">${sign}${val}</strong></span>`;
        }).join('');

        return `
            <div style="background:rgba(90,120,150,0.07); border:1px solid rgba(90,120,150,0.2); border-radius:8px; padding:12px 16px; margin-bottom:16px;">
                <div style="font-size:0.72rem; opacity:0.6; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:6px;">
                    ${isCs ? '🌍 Živý svět — Chronicon' : '🌍 The Living World — Chronicon'}
                </div>
                <div style="font-size:0.8rem;">
                    ${isCs ? 'Nálada' : 'Mood'}: <strong>${klaster.mood}</strong>/100 ·
                    ${isCs ? 'Jmění' : 'Wealth'}: <strong>${klaster.wealth}</strong>/100 ·
                    ${isCs ? 'Zásoby legitimity' : 'Legitimacy stores'}: <strong>${klaster.stores}</strong>
                </div>
                ${relHtml ? `<div style="margin-top:8px;">
                    <div style="font-size:0.7rem; opacity:0.6; margin-bottom:4px;">${isCs ? 'Vztahy s krajem' : 'Relations with the region'}:</div>
                    ${relHtml}
                </div>` : ''}
            </div>`;
    },
};