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
        { name: 'Blažej I.', years: '1189–1204', born: '1155', motto: 'Ignis qui non extinguitur', motto_en_gloss: 'The fire that does not go out', note_cs: 'Zakladatel. Podle klášterní pověsti založil dům na místě, kde v noci žhnul o samotě uhlík, jenž nikdy neuhasl — odtud "Carbunculus".', note_en: 'The founder. Monastery legend holds he built the house where a single ember glowed through the night, never dying out — hence "Carbunculus".' },
        { name: 'Godefrid', years: '1204–1219', born: '1170', motto: 'Lapide fundata, fide firma', motto_en_gloss: 'Founded on stone, firm in faith', note_cs: 'Postavil první kamenný kostel na místě dřevěné kaple.', note_en: 'Built the first stone church on the site of the wooden chapel.' },
        { name: 'Bertold', years: '1219–1241', born: '1185', motto: 'Murus noster Dominus', motto_en_gloss: 'The Lord is our wall', note_cs: 'Za jeho opatství klášter opevnil zdi — na Moravu dolehl strach z tatarského vpádu.', note_en: 'Under his abbacy the monastery fortified its walls — fear of the Tatar invasion reached Moravia.' },
        { name: 'Ctibor', years: '1241–1265', born: '1205', motto: 'Aqua et labor vitam dant', motto_en_gloss: 'Water and labor give life', note_cs: 'Rozšířil hospodářství o první rybníky.', note_en: 'Expanded the estate with the first fishponds.' },
        { name: 'Wolfram', years: '1265–1288', born: '1230', motto: 'Hospes eram, et suscepistis me', motto_en_gloss: 'I was a stranger, and you took me in', note_cs: 'Německého původu — přivedl první konvrše ze Slezska.', note_en: 'Of German origin — brought the first lay brothers from Silesia.' },
        { name: 'Domoslav', years: '1288–1310', born: '1250', motto: 'Littera manet, vox perit', motto_en_gloss: 'The letter remains, the voice perishes', note_cs: 'Založil skriptorium jako samostatnou dílnu, ne pouhý koutek knihovny.', note_en: 'Established the scriptorium as its own workshop, not merely a corner of the library.' },
        { name: 'Jindřich I.', years: '1310–1335', born: '1275', motto: 'Memento mori', motto_en_gloss: 'Remember you must die', note_cs: 'Zemřel na mor, co se toho roku prohnal krajem.', note_en: 'Died of the plague that swept the region that year.' },
        { name: 'Petr z Rokytné', years: '1335–1358', born: '1300', motto: 'De nostris, pro nostris', motto_en_gloss: 'Of our own, for our own', note_cs: 'Rodák z blízké vsi — první opat zvolený z místních, ne dosazený zvenčí.', note_en: 'A native of a nearby village — the first abbot elected from among the local brothers, not appointed from outside.' },
        { name: 'Blažej II.', years: '1358–1379', born: '1325', motto: 'Nomen sequitur virtutem', motto_en_gloss: 'The name follows virtue', note_cs: 'Jmenován po předku ze zbožnosti, ne z příbuzenství.', note_en: 'Named after his predecessor out of piety, not kinship.' },
        { name: 'Racek', years: '1379–1408', born: '1345', motto: 'Diu et in pace', motto_en_gloss: 'Long, and in peace', note_cs: 'Nejdelší funkční období rodokmenu — 29 let klidu před bouří.', note_en: "The longest tenure in the lineage — 29 years of calm before the storm." },
        { name: 'Silvestr', years: '1408–1434', born: '1370', motto: 'In tempestate, statio', motto_en_gloss: 'In the storm, a haven', note_cs: 'Opat husitských válek. Klášter přežil, ne beze ztrát — část knihovny byla zachráněna jen díky včasnému ukrytí.', note_en: 'The abbot of the Hussite Wars. The monastery survived, not unscathed — part of the library was saved only by being hidden in time.' },
        { name: 'Ambrož', years: '1434–1459', born: '1395', motto: 'Post ruinam, aedificatio', motto_en_gloss: 'After ruin, building', note_cs: 'Opat obnovy. Vrátil klášteru hospodářskou sílu po letech válečných útrap.', note_en: 'The abbot of rebuilding. Restored the monastery\'s economic strength after years of wartime hardship.' },
    ],

    // Současný stav (1465) — Bernard jako opat, Augustin jako jeho přímý
    // zástupce/prior. Bernard často cestuje mezi klášterem a Olomouckým
    // opatstvím (Dekret opata, Chronicon) — text zatím, žádný stavový
    // automat (viz hlavička souboru).
    CURRENT: {
        name: 'Bernard',
        born: '1420',
        since: '1459',
        motto: 'Fides sine dubio',
        motto_en_gloss: 'Faith without doubt',
        // Cesta k portrétu — až Bouvarde dodá soubor, nahradí se tímhle
        // řetězcem (zatím null = zobrazí se ozdobný placeholder v rámečku).
        portraitUrl: null,
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
            portraitUrl: null, // ← sem cesta, až Bouvarde dodá obrázek
            traits_cs: ['Mírný soudce — kacířské myšlenky ho zraní méně, hospodářské spory více'],
            traits_en: ['Gentle judge — heretical thoughts wound him less, economic disputes more'],
        },
        {
            name: 'Metoděj',
            portraitUrl: null, // ← sem cesta, až Bouvarde dodá obrázek
            traits_cs: ['Učenec — nakloněn skriptoriu a knihovně nad hospodářstvím'],
            traits_en: ['Scholar — favours the scriptorium and library over the estate'],
        },
    ],

    // ── Cestující opat (abbot-travel-mrd, 9.8.2026) ─────────────────────────
    // 3 polohy: přítomen v klášteře / na cestách / v Olomouckém opatství.
    // Váhovaný náhodný tick, self-guarded ~3 dny (mirror "jen na nějaká
    // období", ne denní přeskakování). Vysoké inquisitionHeat táhne pryč
    // (jedná s biskupem, hasí problém), vysoký abbotFavor táhne domů.
    LOCATIONS: {
        present: { icon: '🏠', name_cs: 'V klášteře', name_en: 'At the Monastery' },
        traveling: { icon: '🚶', name_cs: 'Na cestách', name_en: 'Traveling' },
        abbey: { icon: '🏛️', name_cs: 'V Olomouckém opatství', name_en: 'At the Olomouc Abbey' },
    },
    LOCATION_TICK_DAYS: 3,

    _locationWeights: function () {
        const favor = (GameState.secrets && GameState.secrets.abbotFavor) || 0;
        const heat = (GameState.secrets && GameState.secrets.inquisitionHeat) || 0;
        let w = { present: 40, traveling: 35, abbey: 25 };
        if (heat >= 50) { w.abbey += 25; w.present -= 15; w.traveling -= 10; }
        else if (heat >= 30) { w.abbey += 10; w.present -= 5; w.traveling -= 5; }
        if (favor >= 15) { w.present += 15; w.traveling -= 5; w.abbey -= 10; }
        else if (favor <= -15) { w.present -= 10; w.abbey += 10; }
        // ŽIVÝ Chronicon — klasterMood/vztah s Vrchností (sdílený svět,
        // ne jen tento hráč). Byl to přehmat nechat to jen lokální —
        // opat má být SDÍLENÁ persona, ne dvě oddělené postavy.
        if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._snap && Array.isArray(ChroniconSystem._snap.actors)) {
            const klaster = ChroniconSystem._snap.actors.find(a => a.id === 'klaster');
            if (klaster) {
                if (klaster.mood < 40) { w.abbey += 15; w.traveling += 5; w.present -= 15; }
                else if (klaster.mood >= 70) { w.present += 10; w.abbey -= 5; }
                const vrchnostRel = klaster.relations && klaster.relations.vrchnost;
                if (typeof vrchnostRel === 'number' && vrchnostRel < -20) { w.abbey += 15; w.present -= 10; }
            }
        }
        w.present = Math.max(5, w.present);
        w.traveling = Math.max(5, w.traveling);
        w.abbey = Math.max(5, w.abbey);
        return w;
    },

    _pickWeighted: function (w) {
        const total = w.present + w.traveling + w.abbey;
        let r = Math.random() * total;
        if (r < w.present) return 'present';
        r -= w.present;
        if (r < w.traveling) return 'traveling';
        return 'abbey';
    },

    _locationChangeFlavor: function (loc, isCs) {
        const texts = {
            present: { cs: 'Opat se vrátil do kláštera.', en: 'The abbot has returned to the monastery.' },
            traveling: { cs: 'Opat se vydal na cestu.', en: 'The abbot has set out on the road.' },
            abbey: { cs: 'Opat odjel jednat do Olomouckého opatství.', en: 'The abbot has departed to attend to matters at the Olomouc Abbey.' },
        };
        return isCs ? texts[loc].cs : texts[loc].en;
    },

    locationTick: function () {
        if (!GameState.abbotLocation) GameState.abbotLocation = 'present';
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        if (!GameState.abbotLocationNextTick) {
            GameState.abbotLocationNextTick = now + Math.round(dayMs * this.LOCATION_TICK_DAYS * 0.5);
            return;
        }
        if (now < GameState.abbotLocationNextTick) return;
        GameState.abbotLocationNextTick = now + dayMs * this.LOCATION_TICK_DAYS;

        const newLoc = this._pickWeighted(this._locationWeights());
        if (newLoc === GameState.abbotLocation) return; // beze změny, žádná notifikace navíc
        GameState.abbotLocation = newLoc;
        this.renderPill();

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isCs = lang !== 'en';
        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.panel) {
            NotificationSystem.panel(this.LOCATIONS[newLoc].icon + ' ' + this._locationChangeFlavor(newLoc, isCs), 'system');
        }
        // ZPĚT do Chroniconu (abbot-travel-mrd, 9.8.2026) — dřív jednosměrné
        // (svět → poloha), teď i poloha → svět. Osobní přítomnost v Olomouci
        // = skutečné jednání s biskupstvím, přispívá do sdíleného signálu
        // stejně jako mše/Kategorie D (mirror _reportActorFavorIfNewDay).
        if (newLoc === 'abbey' && typeof ChroniconSystem !== 'undefined' && ChroniconSystem._reportActorFavorIfNewDay) {
            ChroniconSystem._reportActorFavorIfNewDay('klaster');
        }
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    renderPill: function () {
        const loc = GameState.abbotLocation || 'present';
        const def = this.LOCATIONS[loc];
        const iconEl = document.getElementById('pill-abbot-icon');
        const valEl = document.getElementById('pill-abbot-val');
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (iconEl) iconEl.textContent = def.icon;
        if (valEl) valEl.textContent = lang === 'en' ? def.name_en : def.name_cs;
    },

    openTab: function () {
        if (typeof UI !== 'undefined' && UI.switchScreen) UI.switchScreen('library');
        const btn = document.getElementById('lib-tab-opat');
        if (typeof UI !== 'undefined' && UI.switchLibraryTab && btn) UI.switchLibraryTab('opat', btn);
    },

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

    // Portrétní medailon — dvojitý zlatý rám, zaoblené dolní rohy (mirror
    // románského okna/výklenku), rohové kudrlinky, placeholder dokud
    // Bouvarde nedodá skutečný soubor (CURRENT.portraitUrl zůstává null).
    _portraitFrame: function (portraitUrl) {
        // abbot-persona-mrd (9.8.2026) — přednost živému Chronicon snapshotu
        // (abbot.portrait, nastaví GM přes "Dekret opata" panel), fallback
        // na statické CURRENT.portraitUrl, pak placeholder.
        const liveUrl = (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._snap && ChroniconSystem._snap.abbot)
            ? ChroniconSystem._snap.abbot.portrait : null;
        const url = liveUrl || portraitUrl;
        return `
            <div style="position:relative; width:110px; height:130px; flex-shrink:0;">
                <div style="position:absolute; inset:0; border:3px double #c5a059; border-radius:6px 6px 36px 36px; background:linear-gradient(180deg, rgba(197,160,89,0.10), rgba(197,160,89,0.02)); box-shadow:0 2px 6px rgba(0,0,0,0.15);"></div>
                <div style="position:absolute; inset:7px; border-radius:3px 3px 30px 30px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.12);">
                    ${url
                        ? `<img src="${url}" alt="" style="width:100%; height:100%; object-fit:cover;">`
                        : `<span style="font-size:2.4rem; opacity:0.3;">🧔</span>`}
                </div>
                <span style="position:absolute; top:-7px; left:-5px; font-size:0.85rem; color:#c5a059; opacity:0.75;">❦</span>
                <span style="position:absolute; top:-7px; right:-5px; font-size:0.85rem; color:#c5a059; opacity:0.75; display:inline-block; transform:scaleX(-1);">❦</span>
            </div>`;
    },

    _ornateDivider: function () {
        return `<div style="text-align:center; color:#c5a059; opacity:0.45; font-size:0.8rem; letter-spacing:0.3em; margin:12px 0;">❧ ❧ ❧</div>`;
    },

    render: function () {
        const el = document.getElementById('library-opat-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const isCs = lang !== 'en';
        const favor = (GameState.secrets && GameState.secrets.abbotFavor) || 0;

        const lineageHtml = this.LINEAGE.map((a, i) => `
            <div style="display:flex; gap:10px; padding:10px 0; border-bottom:1px solid rgba(197,160,89,0.15);">
                <div style="font-size:0.7rem; opacity:0.5; min-width:26px; text-align:right;">${i + 1}.</div>
                <div>
                    <div style="font-weight:bold; font-size:0.88rem;">${a.name} <span style="font-weight:normal; opacity:0.6; font-size:0.78rem;">(${a.years}${a.born ? `, ${isCs ? 'nar.' : 'b.'} ${a.born}` : ''})</span></div>
                    ${a.motto ? `<div style="font-size:0.74rem; font-style:italic; color:#a08040; margin-top:2px;">„${a.motto}“ <span style="opacity:0.6;">— ${a.motto_en_gloss}</span></div>` : ''}
                    <div style="font-size:0.78rem; opacity:0.75; margin-top:3px;">${isCs ? a.note_cs : a.note_en}</div>
                </div>
            </div>`).join('');

        const c = this.CURRENT;
        el.innerHTML = `
            <div style="background:rgba(197,160,89,0.07); border:2px double rgba(197,160,89,0.4); border-radius:10px; padding:16px 18px; margin-bottom:16px;">
                <div style="font-size:0.72rem; opacity:0.6; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:10px; text-align:center;">${this.MONASTERY_NAME_LAT}</div>
                <div style="display:flex; gap:16px; align-items:flex-start;">
                    ${this._portraitFrame(c.portraitUrl)}
                    <div style="flex:1;">
                        <div style="font-size:1.05rem; font-weight:bold;">${c.name}</div>
                        <div style="font-size:0.76rem; opacity:0.65; margin-bottom:4px;">${isCs ? 'nar.' : 'b.'} ${c.born} — ${isCs ? '13. opat, od' : '13th abbot, since'} ${c.since}</div>
                        <div style="font-size:0.78rem; margin-bottom:4px;">${this.LOCATIONS[GameState.abbotLocation || 'present'].icon} ${isCs ? this.LOCATIONS[GameState.abbotLocation || 'present'].name_cs : this.LOCATIONS[GameState.abbotLocation || 'present'].name_en}</div>
                        <div style="font-size:0.78rem; font-style:italic; color:#a08040;">„${c.motto}“ <span style="opacity:0.6;">— ${c.motto_en_gloss}</span></div>
                        <div style="font-size:0.78rem; margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">
                            ${this.TRAITS.map(tr => `<span style="background:rgba(197,160,89,0.15); border-radius:4px; padding:2px 8px;" title="${isCs ? tr.desc_cs : tr.desc_en}">${isCs ? tr.name_cs : tr.name_en}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div style="font-size:0.8rem; opacity:0.8; margin-top:10px; font-style:italic;">${isCs ? c.note_cs : c.note_en}</div>
                ${this._ornateDivider()}
                <div style="font-size:0.8rem;">
                    👤 <strong>${c.deputyName}</strong> — ${isCs ? 'zástupce opata' : "abbot's deputy"}
                    <div style="font-size:0.78rem; opacity:0.75; font-style:italic; margin-top:2px;">${isCs ? c.deputyNote_cs : c.deputyNote_en}</div>
                </div>
                <div style="font-size:0.8rem; margin-top:10px; padding-top:10px; border-top:1px solid rgba(197,160,89,0.2);">
                    ${this._favorFuzzy(favor, isCs)}
                </div>
            </div>
            ${this._chroniconLiveSection(isCs)}
            <div style="margin-bottom:16px;">
                <div style="font-size:0.72rem; opacity:0.6; font-style:italic; margin-bottom:8px;">
                    ${isCs ? '🕯️ V řádu čekají další bratři, jednou k nástupnictví způsobilí:' : '🕯️ Other brothers wait in the order, one day fit to succeed:'}
                </div>
                <div style="display:flex; gap:16px;">
                    ${this.CANDIDATES.map(cd => `
                        <div style="text-align:center;">
                            <div style="position:relative; width:52px; height:62px; margin:0 auto 4px;">
                                <div style="position:absolute; inset:0; border:2px double #c5a059; border-radius:4px 4px 20px 20px; opacity:0.7;"></div>
                                <div style="position:absolute; inset:4px; border-radius:2px 2px 16px 16px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.1);">
                                    ${cd.portraitUrl ? `<img src="${cd.portraitUrl}" alt="" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:1.1rem; opacity:0.3;">🧔</span>`}
                                </div>
                            </div>
                            <div style="font-size:0.72rem; opacity:0.8;">${cd.name}</div>
                        </div>`).join('')}
                </div>
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