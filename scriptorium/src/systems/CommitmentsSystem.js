// ═══════════════════════════════════════════════════════════════════════════
// CommitmentsSystem — Scriptorium
// Přehled aktivních zakázek ze DVOU zdrojů:
//   1) LettersDB.commitment (Porta dopisy) — beze změny, gate porta_active.
//   2) CHRONICON advisory_events, kind ∈ {sepultura, material, farni} —
//      NEZÁVISLÉ na Portě (farnost-chronicon-reference.md sekce 5, krok 3c,
//      27.7.2026). Tyto 3 kindy už nejdou modalem (ChroniconSystem._apply,
//      krok 3b) — řeší se výhradně tady.
// Nová LettersDB zakázka = jen přidat `commitment` blok k dopisu, nic víc.
// Nová Chronicon zakázka = nový `kind` v _CHRONICON_KINDS + větev v
// _normalizeChronicleEvent/resolveChronicle.
// ═══════════════════════════════════════════════════════════════════════════

const CommitmentsSystem = {

    // Chronicon kindy řešené tady, ne modalem (mirror ZAKAZKY_KINDS v
    // ChroniconSystem.js — musí se udržovat shodné).
    _CHRONICON_KINDS: ['sepultura', 'material', 'farni'],

    // Najde všechny dopisy s definovaným commitment blokem, jejichž
    // aktuální flag-stav odpovídá "aktivní" (probíhající) zakázce.
    _getActiveCommitments: function () {
        if (typeof LettersDB === 'undefined' || !GameState.flags) return [];
        const now = Date.now();
        return LettersDB
            .filter(l => l.commitment)
            .map(l => {
                const c = l.commitment;
                const status = GameState.flags[c.flagKey];
                if (!c.activeStatuses.includes(status)) return null;
                const deadline = c.deadlineFlagKey ? GameState.flags[c.deadlineFlagKey] : null;
                return { source: 'letter', letter: l, commitment: c, deadline, daysLeft: deadline ? Math.ceil((deadline - now) / 86400000) : null };
            })
            .filter(Boolean);
    },

    // Krok 3c — CHRONICON-sourced zakázky. Čte ChroniconSystem._snap (stejný
    // vzor jako TemplumSystem.js/CellariumSystem.js), filtruje na 3 kindy,
    // vylučuje už vyřešené (GameState.chroniconAdvisory.resolvedIds — sdílený
    // dedup se starým modal systémem, aby se nic nezobrazilo dvakrát).
    _getChronicleCommitments: function () {
        const snap = (typeof ChroniconSystem !== 'undefined') ? ChroniconSystem._snap : null;
        if (!snap || !Array.isArray(snap.advisory_events)) return [];
        if (!GameState.chroniconAdvisory) GameState.chroniconAdvisory = { activeId: null, pending: null, resolvedIds: {} };
        const resolvedIds = GameState.chroniconAdvisory.resolvedIds;
        const isProbost = !!(GameState.rank && GameState.rank.probost);

        return snap.advisory_events
            .filter(e => this._CHRONICON_KINDS.includes(e.kind))
            .filter(e => !resolvedIds[e.id])
            .filter(e => !e.probost_only || isProbost)
            .map(e => this._normalizeChronicleEvent(e));
    },

    // Stabilní pseudo-náhodné příjmení odvozené z id (ne Math.random() —
    // aby se rodina "nepřejmenovávala" při každém re-renderu). Mirror
    // totalFuneralEvents vzoru (Scriptorium přiřazuje jméno, CHRONICON
    // zůstává anonymní — farnost-chronicon-reference.md sekce 2).
    _pickSurname: function (id) {
        if (typeof Game === 'undefined' || !Game.PARISH_SURNAMES || !Game.PARISH_SURNAMES.length) return '';
        let hash = 0;
        for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
        return Game.PARISH_SURNAMES[hash % Game.PARISH_SURNAMES.length];
    },

    // Sjednocuje 3 různé tvary (sepultura/material/farni) do společného
    // { id, kind, icon, title, text, requiredItems[] } — render i resolve
    // pak nemusí vědět, odkud záznam přišel.
    _normalizeChronicleEvent: function (e) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        let requiredItems = [];
        if (e.kind === 'material' && e.itemId) {
            requiredItems = [{ id: e.itemId, qty: e.qty }];
        } else if (e.kind === 'farni' && Array.isArray(e.requiredItems)) {
            requiredItems = e.requiredItems;
        }
        let title = lang === 'en' ? (e.title_en || e.title_cs) : e.title_cs;
        let text  = lang === 'en' ? (e.text_en  || e.text_cs)  : e.text_cs;
        if (e.kind === 'farni') {
            const surname = this._pickSurname(e.id);
            if (surname) { title += ' — ' + surname; text = text.replace(/^Rodina/, 'Rodina ' + surname).replace(/^Snoubenci/, 'Snoubenci (rodina ' + surname + ')').replace(/^A family/, 'The ' + surname + ' family').replace(/^A couple/, 'The ' + surname + ' couple'); }
        }
        return {
            source: 'chronicon',
            id: e.id,
            kind: e.kind,
            icon: e.icon,
            title: title,
            text: text,
            requiredItems: requiredItems,
            wealth: e.wealth,
            rewardGrose: e.rewardGrose,
            deadlineDays: e.deadlineDays,
            farniType: e.farniType,
        };
    },

    // Dodatek 27.7.2026 — lokální Klášter pool (parishEventTick "Naplánovat"
    // volba). Stejné materiálové náklady jako Vesnice farni (rozhodnuto),
    // ale žádný _reportActorFavorIfNewDay a žádný Chronicon zdroj — čistě
    // GameState.localFarniEvents, mizí okamžitě po vyřešení (ne resolvedIds
    // dedup, protože to není sdílená fronta).
    _FARNI_REQUIRED_ITEMS: {
        baptism: [{ id: 'wine', qty: 1 }, { id: 'hostia', qty: 1 }, { id: 'paper', qty: 1 }],
        wedding: [{ id: 'vellum', qty: 1 }, { id: 'candle', qty: 1 }, { id: 'wine', qty: 1 }],
        funeral: [{ id: 'candle', qty: 2 }, { id: 'paper', qty: 1 }],
    },
    _FARNI_TITLE_CS: { baptism: 'Křest', wedding: 'Svatba', funeral: 'Pohřeb' },
    _FARNI_TITLE_EN: { baptism: 'Baptism', wedding: 'Wedding', funeral: 'Funeral' },
    _FARNI_TEXT_CS: {
        baptism: 'žádá o křest dítěte.', wedding: 'žádá o oddání.', funeral: 'žádá o pohřeb.',
    },
    _FARNI_TEXT_EN: {
        baptism: 'asks for a christening.', wedding: 'asks to be wed.', funeral: 'asks for a funeral rite.',
    },

    // Zakázky od Clientela↔Chronicon propojených aktérů (Krok C,
    // zakazky-3-kandidati.md). Seed: sklář první (nejdál rozjetá
    // infrastruktura — chroniconActorId, živý itemStock). Mlynář/kovář
    // přijdou později — přidání dalšího aktéra = jen nový klíč sem,
    // žádná jiná změna v generátoru/renderu/resolveru.
    _AKTER_ZAKAZKY_CATALOG: {
        sklar: [
            {
                key: 'sifra_receptura',
                icon: '🔮',
                title_cs: 'Zašifrovaný zápis tajné receptury',
                title_en: 'An Encoded Recipe for a Secret Glass Colour',
                text_cs: 'Sklář prosí o zapsání jeho receptury na barvu skla — tak, aby ji nikdo cizí nepřečetl.',
                text_en: "The glassmaker asks for his glass-colour recipe to be written down — but so no stranger could read it.",
                requiredItems: [{ id: 'ink', qty: 2 }, { id: 'paper', qty: 1 }],
                rewardGrose: 12,
                contactRelationReward: 5,
            },
        ],
        kovar: [
            {
                key: 'cechovni_listina',
                icon: '🔨',
                title_cs: 'Cechovní listina',
                title_en: 'A Guild Charter',
                text_cs: 'Kovář prosí o sepsání cechovní listiny — potvrzení jeho privilegií, ať má na dokázání, když se v cechu povede spor.',
                text_en: 'The blacksmith asks for a guild charter to be drafted — proof of his privileges, should a dispute arise within the guild.',
                requiredItems: [{ id: 'ink', qty: 1 }, { id: 'paper', qty: 2 }],
                rewardGrose: 10,
                contactRelationReward: 5,
            },
        ],
        mlynar: [
            {
                key: 'potvrzeni_vodniho_prava',
                icon: '🌾',
                title_cs: 'Potvrzení vodního práva',
                title_en: 'Confirmation of Water Rights',
                text_cs: 'Mlynář prosí o sepsání potvrzení vodního práva na jez a strouhu — bez listiny mu soused hrozí sporem.',
                text_en: 'The miller asks for a written confirmation of his water rights over the weir and millrace — without it, a neighbour threatens a dispute.',
                requiredItems: [{ id: 'ink', qty: 1 }, { id: 'paper', qty: 1 }],
                rewardGrose: 8,
                contactRelationReward: 5,
            },
        ],
    },

    // ═══ ZAKÁZKY — Kategorie A: existující Clientela kontakty ═══
    // zakazky-rozsireni-ctyri-kategorie-mrd.md §2. Oddělený katalog od
    // _AKTER_ZAKAZKY_CATALOG (sklar/kovar/mlynar), ať se nemění jejich
    // už doladěná týdenní/25% kadence — tahle kategorie má být častější,
    // viditelná "fronta" (viz vlastní tik níže, MRD §1 revize).
    _KLIENTELA_A_CATALOG: {
        stationarius: [
            {
                key: 'pecia_opis',
                icon: '📚',
                title_cs: 'Opis na pecii pro žáky',
                title_en: 'A Pecia Copy for Students',
                text_cs: 'Stationarius prosí o rozepsání textu na nezašité archy k pronájmu studentům — pecia systém, jak ho zná z univerzit.',
                text_en: 'The stationarius asks for a text copied onto unbound quires for rent to students — the pecia system, as known from the universities.',
                requiredItems: [{ id: 'paper', qty: 2 }, { id: 'ink', qty: 1 }],
                rewardGrose: 10,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 1,
                bonusItem: { id: 'glosa_studenta', qty: 1 },
            },
        ],
        klenotnik: [
            {
                key: 'kovana_vazba',
                icon: '💍',
                title_cs: 'Kovaná vazba na evangeliář',
                title_en: 'A Metal Binding for a Gospel Book',
                text_cs: 'Klenotník nabízí stříbrný prut na kovanou vazbu, žádá jen dohled písaře nad prací — a podíl na hotovém díle.',
                text_en: 'The goldsmith offers a silver ingot for a metal binding, and asks only for a scribe\'s oversight of the work — and a share of the finished piece.',
                requiredItems: [{ id: 'stribrny_prut', qty: 1 }],
                rewardGrose: 25,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 2,
                bonusItem: { id: 'drahokam_ulomek', qty: 1 },
            },
        ],
        giacomo: [
            {
                key: 'horologium_export',
                icon: '⚓',
                title_cs: 'Iluminovaný kodex na export',
                title_en: 'An Illuminated Codex for Export',
                text_cs: 'Giacomo shání luxusní kodex pro benátského patrona — platí dobře, ale čeká práci hodnou vývozu.',
                text_en: 'Giacomo seeks a luxury codex for a Venetian patron — he pays well, but expects work worthy of export.',
                requiredItems: [{ id: 'luxury_codex', qty: 1 }],
                rewardGrose: 50,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 2,
            },
        ],
        kamenik: [
            {
                key: 'pametni_napis',
                icon: '🪨',
                title_cs: 'Pamětní nápis pro rodinu',
                title_en: 'A Memorial Inscription for a Family',
                text_cs: 'Kameník prosí o návrh textu pamětního nápisu — rodina si přeje důstojná slova, ne jen datum.',
                text_en: 'The stonemason asks for a memorial inscription text — the family wants dignified words, not just a date.',
                requiredItems: [{ id: 'cut_stone', qty: 2 }],
                rewardGrose: 15,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 1,
            },
        ],
        vinar: [
            {
                key: 'osvedceni_mesniho_vina',
                icon: '🍷',
                title_cs: 'Osvědčení pravosti mešního vína',
                title_en: 'Certificate of Authenticity for Mass Wine',
                text_cs: 'Vinař prosí o sepsání osvědčení, že dodávané mešní víno je ryzí — biskupství si to prý bude ověřovat.',
                text_en: 'The winemaker asks for a certificate attesting that the mass wine he supplies is unadulterated — the bishopric, he says, will be checking.',
                requiredItems: [{ id: 'paper', qty: 1 }, { id: 'ink', qty: 1 }],
                rewardGrose: 10,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 1,
            },
        ],
        syrar: [
            {
                key: 'seznam_zrani_syru',
                icon: '🧀',
                title_cs: 'Seznam zrání sýrů',
                title_en: 'A Cheese-Aging Ledger',
                text_cs: 'Sýrař prosí o sepsání přehledné listiny, kdy který bochník začal zrát — sám prý čísla plete.',
                text_en: 'The cheesemaker asks for a clear ledger of when each wheel began ageing — he admits he muddles the numbers himself.',
                requiredItems: [{ id: 'paper', qty: 1 }, { id: 'ink', qty: 1 }],
                rewardGrose: 8,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 1,
            },
        ],
        voskar: [
            {
                key: 'objednaci_listina_svic',
                icon: '🕯️',
                title_cs: 'Objednací listina svící pro kostel',
                title_en: 'An Order Ledger for Church Candles',
                text_cs: 'Voskař prosí o sepsání objednací listiny pro kostel — ať je jasné, kolik svící a kdy, ne jen po paměti.',
                text_en: 'The wax chandler asks for a written order ledger for the church — so the count and timing of candles is clear, not just remembered.',
                requiredItems: [{ id: 'paper', qty: 1 }, { id: 'ink', qty: 1 }],
                rewardGrose: 10,
                contactRelationReward: 5,
                reputationKey: 'cirkev', reputationAmt: 1,
            },
        ],
        lovec: [
            {
                key: 'lovecke_povoleni',
                icon: '🏹',
                title_cs: 'Lovecké povolení',
                title_en: 'A Hunting Permit',
                text_cs: 'Lovec prosí o sepsání povolení k drobnému lovu na klášterním pozemku — ať má čím se prokázat, přijde-li hajný.',
                text_en: 'The hunter asks for a written permit for small-game hunting on monastery land — something to show, should the gamekeeper come asking.',
                requiredItems: [{ id: 'paper', qty: 1 }, { id: 'ink', qty: 1 }],
                rewardGrose: 12,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 1,
            },
        ],
        rybar: [
            {
                key: 'rybarske_pravo',
                icon: '🎣',
                title_cs: 'Rybářské právo',
                title_en: 'A Fishing Right',
                text_cs: 'Rybář prosí o sepsání listiny potvrzující jeho právo lovit v klášterních vodách — soused prý začal reptat.',
                text_en: 'The fisherman asks for a charter confirming his right to fish the monastery waters — a neighbour, he says, has started to grumble.',
                requiredItems: [{ id: 'paper', qty: 1 }, { id: 'ink', qty: 1 }],
                rewardGrose: 12,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 1,
            },
        ],
        tkadlec: [
            {
                key: 'navrh_vzoru_roucha',
                icon: '🧵',
                title_cs: 'Návrh vzoru na liturgické roucho',
                title_en: 'A Pattern Design for a Liturgical Vestment',
                text_cs: 'Tkadlec prosí o návrh vzoru na roucho — sám prý umí tkát, ne kreslit.',
                text_en: 'The weaver asks for a pattern design for a vestment — he can weave, he says, but not draw.',
                requiredItems: [{ id: 'paper', qty: 1 }, { id: 'ink', qty: 1 }],
                rewardGrose: 10,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 1,
            },
        ],
        chirurgus: [
            {
                key: 'opis_receptu_masti',
                icon: '🩹',
                title_cs: 'Opis receptu na mast',
                title_en: 'A Copied Salve Recipe',
                text_cs: 'Chirurgus prosí o čitelný opis svého receptu — vlastní rukou píše prý tak, že to nepřečte ani on sám.',
                text_en: 'The surgeon asks for a legible copy of his recipe — his own hand, he admits, is illegible even to himself.',
                requiredItems: [{ id: 'paper', qty: 1 }, { id: 'ink', qty: 1 }],
                rewardGrose: 10,
                contactRelationReward: 5,
                reputationKey: 'lidovost', reputationAmt: 1,
            },
        ],
    },

    // Denní self-guarded generátor (MRD §1 revize — Kategorie A má být
    // "fronta", ne vzácnost). Stejný per-aktér strop (max 1 najednou)
    // jako u _AKTER_ZAKAZKY_CATALOG, ale vlastní, kratší kadence.
    klientelaATick: function () {
        if (!Array.isArray(GameState.localAkterZakazky)) GameState.localAkterZakazky = [];
        const DAY = 24 * 60 * 60 * 1000;
        if (!GameState.klientelaANextTick) {
            GameState.klientelaANextTick = Date.now() + Math.round(DAY * 0.5);
            return;
        }
        if (Date.now() < GameState.klientelaANextTick) return;
        GameState.klientelaANextTick = Date.now() + DAY;
        if (Math.random() >= 0.12) return; // ~12 %/den

        const researched = GameState.researchedTechs || [];
        const readBooks = (GameState.library && GameState.library.readBooks) || [];
        let changed = false;

        Object.keys(this._KLIENTELA_A_CATALOG).forEach(actorId => {
            const contact = (typeof ContactsDB !== 'undefined') ? ContactsDB[actorId] : null;
            if (!contact) return;
            if (contact.unlockTech && !researched.includes(contact.unlockTech)) return;
            if (contact.unlockBook && !readBooks.includes(contact.unlockBook)) return;
            if (contact.unlockContact) {
                const rel = (GameState.contactRelation && GameState.contactRelation[contact.unlockContact.id]) || 0;
                if (rel < contact.unlockContact.minRelation) return;
            }
            if (GameState.localAkterZakazky.some(z => z.actorId === actorId)) return;

            const options = this._KLIENTELA_A_CATALOG[actorId];
            const opt = options[Math.floor(Math.random() * options.length)];
            GameState.localAkterZakazky.push({
                id: 'akter_' + actorId + '_' + opt.key + '_' + Date.now(),
                actorId: actorId,
                key: opt.key,
                createdAt: Date.now(),
                deadlineDays: 7,
            });
            changed = true;
            // Zprávy z kláštera (bell panel) + Kronika — zakázka dorazila
            const _lang = (GameState.settings && GameState.settings.language) || 'cs';
            const _senderName = _lang === 'en' ? (contact.name_en || contact.name) : contact.name;
            if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel(
                (_lang === 'en' ? `📜 ${_senderName} has a request for you.` : `📜 ${_senderName} má pro tebe žádost.`), 'obchod');
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
                `📜 Zakázka od ${contact.name}.`,
                `📜 A commission from ${contact.name_en || contact.name}.`,
                `📜 Opus novum oblatum est.`);
        });

        if (changed) {
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
        }
    },

    // ═══ ZAKÁZKY — Kategorie B: Cizí vrchnost ═══
    // zakazky-rozsireni-ctyri-kategorie-mrd.md §3. Abstraktní odesílatel,
    // ŽÁDNÝ ContactsDB záznam (rozhodnuto — levnější, žádný nový systém).
    // Odměna/postih jde přes Pověst (reputation.slechta), ne contactRelation
    // — pro "vrchnost" žádná taková osa neexistuje.
    _VRCHNOST_ZAKAZKY_CATALOG: {
        vrchnost: [
            {
                key: 'erbovnik',
                icon: '🛡️',
                senderName_cs: 'Cizí vrchnost', senderName_en: 'A Foreign Lord',
                title_cs: 'Erbovník pro rodový dům',
                title_en: 'An Armorial for the Family House',
                text_cs: 'Šlechtic žádá o sepsání erbovníku svého rodu — má zdobit síň, ne knihovnu.',
                text_en: 'A nobleman asks for an armorial of his family to be drawn up — meant to adorn a hall, not a library.',
                requiredItems: [{ id: 'vellum', qty: 2 }, { id: 'ink_gallic', qty: 1 }],
                rewardGrose: 40,
                reputationKey: 'slechta', reputationAmt: 3,
                bonusItem: { id: 'erbovni_nakres', qty: 1 },
            },
            {
                key: 'hranicni_listina',
                icon: '📜',
                senderName_cs: 'Cizí vrchnost', senderName_en: 'A Foreign Lord',
                title_cs: 'Hraniční listina',
                title_en: 'A Boundary Charter',
                text_cs: 'Spor o mez se sousedem — šlechtic žádá o sepsání listiny, co jeho právo potvrdí na papíře, ne jen na slovo.',
                text_en: 'A boundary dispute with a neighbour — the lord asks for a charter confirming his right on paper, not just by word.',
                requiredItems: [{ id: 'paper', qty: 2 }, { id: 'ink', qty: 1 }],
                rewardGrose: 30,
                reputationKey: 'slechta', reputationAmt: 2,
            },
        ],
    },

    // Týdenní self-guarded generátor (mirror akterZakazkyTick kadence),
    // jen 1 slot najednou (žádný per-aktér strop potřeba — jeden abstraktní
    // odesílatel, ne více kontaktů).
    //
    // Gate na Šlechtu (slechta≥3, DECIDED 1.8.2026): MRD navrhovala vyšší
    // práh, ale zdroje `slechta` jsou dnes jen Visitatio Laudatio (+3,
    // vzácné) a tahle zakázka sama (+3 při přijetí) — vysoký práh by byl
    // kruhová závislost (potřebuješ Šlechtu, abys dostal zakázku, co dává
    // Šlechtu). Práh 3 = symbolický, "šlechta o tobě ví" spíš než bariéra;
    // stačí 1× Laudatio. ZATÍM — přehodnotit, až bude víc zdrojů slechta
    // (vrstva 3/4 z zakazky-rozsireni MRD, další Vrchnost dopisy apod.).
    vrchnostZakazkyTick: function () {
        if (!Array.isArray(GameState.localAkterZakazky)) GameState.localAkterZakazky = [];
        const _slechta = (GameState.persona && GameState.persona.reputation && GameState.persona.reputation.slechta) || 0;
        if (_slechta < 3) return;
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!GameState.vrchnostZakazkyNextTick) {
            GameState.vrchnostZakazkyNextTick = Date.now() + Math.round(WEEK * 0.5);
            return;
        }
        if (Date.now() < GameState.vrchnostZakazkyNextTick) return;
        GameState.vrchnostZakazkyNextTick = Date.now() + WEEK;
        if (Math.random() >= 0.20) return; // ~20 %/týden

        if (GameState.localAkterZakazky.some(z => z.actorId === 'vrchnost')) return;

        const options = this._VRCHNOST_ZAKAZKY_CATALOG.vrchnost;
        const opt = options[Math.floor(Math.random() * options.length)];
        GameState.localAkterZakazky.push({
            id: 'akter_vrchnost_' + opt.key + '_' + Date.now(),
            actorId: 'vrchnost',
            key: opt.key,
            createdAt: Date.now(),
            deadlineDays: 10,
        });
        // Zprávy z kláštera (bell panel) + Kronika — zakázka dorazila
        const _lang = (GameState.settings && GameState.settings.language) || 'cs';
        const _senderName = _lang === 'en' ? opt.senderName_en : opt.senderName_cs;
        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel(
            (_lang === 'en' ? `📜 ${_senderName} has a request for you.` : `📜 ${_senderName} má pro tebe žádost.`), 'obchod');
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
            `📜 Zakázka od ${opt.senderName_cs}.`,
            `📜 A commission from ${opt.senderName_en}.`,
            `📜 Opus novum oblatum est.`);
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this.render();
    },

    // Týdenní self-guarded generátor (mirror Game.parishEventTick vzoru,
    // ale gate na odemčenost kontaktu, ne na rank Probošt — tohle jsou
    // řemeslné zakázky, ne farní povinnosti).
    akterZakazkyTick: function () {
        if (!Array.isArray(GameState.localAkterZakazky)) GameState.localAkterZakazky = [];
        const DAY = 24 * 60 * 60 * 1000;
        if (!GameState.akterZakazkyNextTick) {
            GameState.akterZakazkyNextTick = Date.now() + Math.round(DAY * 0.2); // ~5h zahřívačka, ne 3,5 dne
            return;
        }
        if (Date.now() < GameState.akterZakazkyNextTick) return;
        GameState.akterZakazkyNextTick = Date.now() + DAY; // denní hod, ne týdenní
        if (Math.random() >= 0.25) return; // ~25 % šance/den na aktéra (dřív týdně — celkově mnohem živější)

        const researched = GameState.researchedTechs || [];
        const readBooks = (GameState.library && GameState.library.readBooks) || [];
        let changed = false;

        Object.keys(this._AKTER_ZAKAZKY_CATALOG).forEach(actorId => {
            const contact = (typeof ContactsDB !== 'undefined') ? ContactsDB[actorId] : null;
            if (!contact) return;
            if (contact.unlockTech && !researched.includes(contact.unlockTech)) return;
            if (contact.unlockBook && !readBooks.includes(contact.unlockBook)) return;
            // Nejvýš 1 aktivní zakázka na aktéra najednou
            if (GameState.localAkterZakazky.some(z => z.actorId === actorId)) return;

            const options = this._AKTER_ZAKAZKY_CATALOG[actorId];
            const opt = options[Math.floor(Math.random() * options.length)];
            GameState.localAkterZakazky.push({
                id: 'akter_' + actorId + '_' + opt.key + '_' + Date.now(),
                actorId: actorId,
                key: opt.key,
                createdAt: Date.now(),
                deadlineDays: 7,
            });
            changed = true;
            // Zprávy z kláštera (bell panel) + Kronika — zakázka dorazila
            const _lang = (GameState.settings && GameState.settings.language) || 'cs';
            const _senderName = _lang === 'en' ? (contact.name_en || contact.name) : contact.name;
            if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel(
                (_lang === 'en' ? `📜 ${_senderName} has a request for you.` : `📜 ${_senderName} má pro tebe žádost.`), 'obchod');
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
                `📜 Zakázka od ${contact.name}.`,
                `📜 A commission from ${contact.name_en || contact.name}.`,
                `📜 Opus novum oblatum est.`);
        });

        if (changed) {
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
        }
    },

    _getLocalAkterCommitments: function () {
        if (!Array.isArray(GameState.localAkterZakazky)) return [];
        return GameState.localAkterZakazky.map(z => this._normalizeLocalAkterEvent(z)).filter(Boolean);
    },

    _normalizeLocalAkterEvent: function (z) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        // Hledá napříč všemi 3 katalogy (sklar/kovar/mlynar, Klientela A, Vrchnost B)
        const options = this._AKTER_ZAKAZKY_CATALOG[z.actorId]
            || this._KLIENTELA_A_CATALOG[z.actorId]
            || this._VRCHNOST_ZAKAZKY_CATALOG[z.actorId];
        const opt = options && options.find(o => o.key === z.key);
        if (!opt) return null;
        const contact = (typeof ContactsDB !== 'undefined') ? ContactsDB[z.actorId] : null;
        // senderName_cs/en override — pro odesílatele bez ContactsDB záznamu (Vrchnost)
        const actorName = opt.senderName_cs
            ? (lang === 'en' ? opt.senderName_en : opt.senderName_cs)
            : (contact ? (lang === 'en' ? contact.name_en : contact.name) : z.actorId);
        const daysLeft = Math.max(0, Math.ceil(((z.createdAt + z.deadlineDays * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000)));
        return {
            source: 'local',
            id: z.id,
            kind: 'akter',
            actorId: z.actorId,
            actorName: actorName,
            icon: opt.icon,
            title: (lang === 'en' ? opt.title_en : opt.title_cs) + ' — ' + actorName,
            text: lang === 'en' ? opt.text_en : opt.text_cs,
            requiredItems: opt.requiredItems,
            rewardGrose: opt.rewardGrose,
            contactRelationReward: opt.contactRelationReward,
            reputationKey: opt.reputationKey,
            reputationAmt: opt.reputationAmt,
            bonusItem: opt.bonusItem,
            daysLeft: daysLeft,
        };
    },

    _getLocalFarniCommitments: function () {
        if (!Array.isArray(GameState.localFarniEvents)) return [];
        return GameState.localFarniEvents.map(f => this._normalizeLocalFarniEvent(f));
    },

    _normalizeLocalFarniEvent: function (f) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const title = (lang === 'en' ? this._FARNI_TITLE_EN[f.type] : this._FARNI_TITLE_CS[f.type]) + ' — ' + f.surname;
        const text = lang === 'en'
            ? 'The ' + f.surname + ' family ' + this._FARNI_TEXT_EN[f.type]
            : 'Rodina ' + f.surname + ' ' + this._FARNI_TEXT_CS[f.type];
        return {
            source: 'local',
            id: f.id,
            kind: 'farni',
            farniType: f.type,
            icon: f.type === 'baptism' ? '👶' : f.type === 'wedding' ? '💍' : '⚰️',
            title: title,
            text: text,
            requiredItems: this._FARNI_REQUIRED_ITEMS[f.type] || [],
        };
    },

    // Dodatek 27.7.2026 — poslední historie (accept i decline, napříč
    // všemi 3 zdroji). Cap 15, nejnovější první.
    _pushHistory: function (entry) {
        if (!Array.isArray(GameState.commitmentsHistory)) GameState.commitmentsHistory = [];
        GameState.commitmentsHistory.unshift(Object.assign({ ts: Date.now() }, entry));
        if (GameState.commitmentsHistory.length > 15) GameState.commitmentsHistory.length = 15;
    },


    render: function () {
        const el = document.getElementById('lore-commitments-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Krok 3c (farnost-chronicon-reference.md sekce 5.3): gate posunut
        // z "celý tab" na "jen LettersDB položky" — Chronicon zakázky
        // (sepultura/material/farni) se zobrazí i bez aktivní Porty.
        const portaActive = !!(GameState.flags && GameState.flags.porta_active);
        const chronicleCommitments = this._getChronicleCommitments();
        const localCommitments = this._getLocalFarniCommitments();
        const localAkterCommitments = this._getLocalAkterCommitments();
        const letterCommitments = portaActive ? this._getActiveCommitments() : [];

        // Dvě kategorie (stejný design karet, jen oddělené nadpisem):
        // 1) sliby dané přes Portu + farní rodiny ze vsi (beze změny)
        // 2) zakázky vázané na konkrétního reálného Chronicon aktéra —
        //    sepultura/material/farní-z-Chroniconu + nové řemeslné
        //    zakázky (Krok C, zakazky-3-kandidati.md)
        const villageGroup = letterCommitments.concat(localCommitments);
        const akterGroup = chronicleCommitments.concat(localAkterCommitments);
        const active = villageGroup.concat(akterGroup);

        if (!portaActive && chronicleCommitments.length === 0 && localCommitments.length === 0 && localAkterCommitments.length === 0) {
            el.innerHTML = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold); text-align:center; opacity:0.7;">
                <div style="font-size:2rem; margin-bottom:8px;">📋</div>
                <div style="font-size:0.85rem; font-style:italic;">${lang==='en' ? 'No commitments yet — nothing to track.' : 'Zatím žádné zakázky — není co sledovat.'}</div>
            </div>`;
            return;
        }

        let h = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        h += `<h3 style="margin:0 0 12px 0; font-size:1rem;">📋 ${lang==='en' ? 'Commitments' : 'Zakázky'}</h3>`;
        h += `<p style="font-size:0.82rem; opacity:0.7; margin-bottom:14px;">${lang==='en'
            ? 'Promises made through Porta, and requests from the wider village — who they are for, how much time remains, what is at stake.'
            : 'Sliby dané přes Portu i žádosti ze širší vsi — pro koho jsou, kolik zbývá času, co je v sázce.'}</p>`;

        if (active.length === 0) {
            h += `<div style="font-size:0.82rem; opacity:0.6; font-style:italic;">${lang==='en' ? 'No open commitments right now.' : 'Momentálně žádné otevřené zakázky.'}</div>`;
        } else {
            if (villageGroup.length > 0) {
                h += `<div style="font-size:0.78rem; font-weight:bold; opacity:0.75; margin:4px 0 8px;">🕊️ ${lang==='en' ? 'Promises & village requests' : 'Sliby a žádosti ze vsi'}</div>`;
                h += `<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">`;
                villageGroup.forEach(item => {
                    h += (item.source === 'letter') ? this._renderLetterCard(item, lang) : this._renderChronicleCard(item, lang);
                });
                h += `</div>`;
            }
            if (akterGroup.length > 0) {
                h += `<div style="font-size:0.78rem; font-weight:bold; opacity:0.75; margin:4px 0 8px;">🏛️ ${lang==='en' ? 'Commissions from Chronicon actors' : 'Zakázky od aktérů Chroniconu'}</div>`;
                h += `<div style="display:flex; flex-direction:column; gap:10px;">`;
                akterGroup.forEach(item => {
                    h += this._renderChronicleCard(item, lang);
                });
                h += `</div>`;
            }
        }

        h += this._renderHistory(lang);

        h += `</div>`;
        el.innerHTML = h;
    },

    // Beze změny oproti původnímu render() — jen extrahováno do vlastní
    // metody, aby render() mohl větvit podle zdroje (letter/chronicon).
    _renderLetterCard: function ({ commitment: c, daysLeft }, lang) {
        const forWhom = lang === 'en' ? (c.forWhom_en || c.forWhom_cs) : c.forWhom_cs;
        const what = lang === 'en' ? (c.what_en || c.what_cs) : c.what_cs;
        const reward = lang === 'en' ? (c.reward_en || c.reward_cs) : c.reward_cs;
        const risk = lang === 'en' ? (c.risk_en || c.risk_cs) : c.risk_cs;

        let timeLine;
        if (daysLeft === null) {
            timeLine = lang === 'en' ? 'No fixed deadline' : 'Bez pevné lhůty';
        } else if (daysLeft < 0) {
            timeLine = `<span style="color:#c0392b;">${lang==='en' ? 'Overdue' : 'Po lhůtě'}</span>`;
        } else if (daysLeft <= 3) {
            timeLine = `<span style="color:#c0392b; font-weight:bold;">${lang==='en' ? `${daysLeft} days left` : `zbývá ${daysLeft} dní`}</span>`;
        } else {
            timeLine = lang === 'en' ? `${daysLeft} days left` : `zbývá ${daysLeft} dní`;
        }

        let fulfillLine = '';
        if (c.requiredItem) {
            const have = GameState.inventory[c.requiredItem.id] || 0;
            const enough = have >= c.requiredItem.qty;
            const itemName = (typeof iName === 'function') ? iName(c.requiredItem.id) : c.requiredItem.id;
            fulfillLine = `<button class="craft-btn" style="margin-top:8px; font-size:0.76rem;" ${enough ? '' : 'disabled'}
                onclick="CommitmentsSystem.fulfill('${c.flagKey}')">
                📜 ${lang==='en'?'Deliver':'Odbavit'} (${have}/${c.requiredItem.qty} ${itemName})
            </button>`;
        }

        return `<div style="padding:12px; background:rgba(0,0,0,0.04); border-radius:8px;">
            <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">🕊️ ${forWhom}</div>
            <div style="font-size:0.82rem; opacity:0.85; margin-bottom:6px;">${what}</div>
            <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:0.76rem; opacity:0.75;">
                <span>⏳ ${timeLine}</span>
                ${reward ? `<span>💰 ${reward}</span>` : ''}
                ${risk ? `<span style="opacity:0.65;">⚠️ ${risk}</span>` : ''}
            </div>
            ${fulfillLine}
        </div>`;
    },

    // Krok 3c — CHRONICON zakázky (sepultura/material/farni). requiredItems
    // checklist barevně podle skladu (vinum/wine fallback jako u mše),
    // Vykonat/Přijmout disabled dokud sklad nesedí. Odmítnout vždy dostupné.
    _renderChronicleCard: function (item, lang) {
        let itemsLine = '';
        let enough = true;
        const requiredItems = item.requiredItems || [];
        if (requiredItems.length) {
            const parts = requiredItems.map(req => {
                let have = GameState.inventory[req.id] || 0;
                if (req.id === 'wine' && have < req.qty && GameState.inventory.vinum) have = GameState.inventory.vinum;
                const ok = have >= req.qty;
                if (!ok) enough = false;
                const itemName = (typeof iName === 'function') ? iName(req.id) : req.id;
                return `<span style="${ok ? '' : 'color:#c0392b;'}">${have}/${req.qty} ${itemName}</span>`;
            });
            itemsLine = `<div style="display:flex; flex-wrap:wrap; gap:10px; font-size:0.76rem; opacity:0.85; margin-bottom:6px;">${parts.join('')}</div>`;
        }

        const acceptLabel = lang === 'en'
            ? (item.kind === 'sepultura' ? '⚱️ Grant the right' : item.kind === 'material' ? '📦 We shall help' : item.kind === 'akter' ? '📜 Complete' : '✝️ Officiate')
            : (item.kind === 'sepultura' ? '⚱️ Udělit právo' : item.kind === 'material' ? '📦 Pomůžeme' : item.kind === 'akter' ? '📜 Vyhotovit' : '✝️ Vykonat obřad');
        const declineLabel = lang === 'en' ? '🚪 Decline' : '🚪 Odmítnout';

        let extraLine = '';
        if (item.kind === 'material' && item.rewardGrose) {
            extraLine = `<span>💰 ${item.rewardGrose} ${lang==='en'?'groschen':'grošů'}</span>` + (item.deadlineDays ? `<span>⏳ ${item.deadlineDays} ${lang==='en'?'days':'dní'}</span>` : '');
        } else if (item.kind === 'sepultura' && item.wealth) {
            extraLine = `<span>💰 ~${Math.round(item.wealth * 1.2)} ${lang==='en'?'groschen':'grošů'}</span>`;
        } else if (item.kind === 'akter') {
            const parts = [];
            if (item.rewardGrose) parts.push(`<span>💰 ${item.rewardGrose} ${lang==='en'?'groschen':'grošů'}</span>`);
            if (item.contactRelationReward) parts.push(`<span>🤝 +${item.contactRelationReward} ${lang==='en'?'relation':'vztah'}</span>`);
            if (item.reputationKey && item.reputationAmt) {
                const _repLabel = { lidovost: lang==='en'?'Common folk':'Lid', slechta: lang==='en'?'Nobility':'Šlechta', cirkev: lang==='en'?'Clergy':'Církev' }[item.reputationKey] || item.reputationKey;
                parts.push(`<span>📜 +${item.reputationAmt} ${_repLabel} (${lang==='en'?'reputation':'pověst'})</span>`);
            }
            if (item.bonusItem && typeof ItemsDB !== 'undefined' && ItemsDB[item.bonusItem.id]) {
                const _bi = ItemsDB[item.bonusItem.id];
                parts.push(`<span>${_bi.icon} ${lang==='en'?_bi.name_en:_bi.name}</span>`);
            }
            if (typeof item.daysLeft === 'number') parts.push(`<span>⏳ ${item.daysLeft} ${lang==='en'?'days left':'dní zbývá'}</span>`);
            extraLine = parts.join('');
        }

        const resolveFn = item.source === 'local' ? 'resolveLocal' : 'resolveChronicle';
        const sourceTag = item.source === 'local'
            ? `<span style="opacity:0.5; font-style:italic;">${lang==='en'?'(monastery)':'(klášter)'}</span>`
            : '';

        return `<div style="padding:12px; background:rgba(0,0,0,0.04); border-radius:8px;">
            <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">${item.icon} ${item.title} ${sourceTag}</div>
            <div style="font-size:0.82rem; opacity:0.85; margin-bottom:6px;">${item.text}</div>
            ${itemsLine}
            ${extraLine ? `<div style="display:flex; flex-wrap:wrap; gap:12px; font-size:0.76rem; opacity:0.75; margin-bottom:6px;">${extraLine}</div>` : ''}
            <div style="display:flex; gap:8px; margin-top:4px;">
                <button class="craft-btn" style="font-size:0.76rem;" ${enough ? '' : 'disabled'}
                    onclick="CommitmentsSystem.${resolveFn}('${item.id}', 'accept')">${acceptLabel}</button>
                <button class="craft-btn" style="font-size:0.76rem; opacity:0.7;"
                    onclick="CommitmentsSystem.${resolveFn}('${item.id}', 'decline')">${declineLabel}</button>
            </div>
        </div>`;
    },

    // Dodatek 27.7.2026 — posledních 15 vyřešených zakázek, nejnovější první.
    _renderHistory: function (lang) {
        const hist = GameState.commitmentsHistory || [];
        if (!hist.length) return '';
        let h = `<div style="margin-top:18px; padding-top:12px; border-top:1px solid rgba(0,0,0,0.08);">
            <h4 style="font-size:0.8rem; opacity:0.65; margin:0 0 8px 0;">🕰️ ${lang==='en' ? 'Recent history' : 'Poslední historie'}</h4>
            <div style="display:flex; flex-direction:column; gap:5px;">`;
        hist.forEach(e => {
            const outcome = e.outcome === 'accept'
                ? (lang==='en' ? 'done' : 'vykonáno')
                : (lang==='en' ? 'declined' : 'odmítnuto');
            h += `<div style="font-size:0.74rem; opacity:0.6; padding:5px 8px; background:rgba(0,0,0,0.03); border-radius:6px;">
                ${e.icon || '📋'} ${e.title} — ${outcome}${e.detail ? ' · ' + e.detail : ''}
            </div>`;
        });
        h += `</div></div>`;
        return h;
    },


    // zakazky-centralizace-mrd, Fáze 1 (26.7.2026) — univerzální odbavení
    // libovolné zakázky s requiredItem (nahrazuje ad-hoc "L8" dopisy).
    // flagKey identifikuje KTEROU zakázku (unikátní per commitment blok).
    fulfill: function (flagKey) {
        if (typeof LettersDB === 'undefined') return;
        const letter = LettersDB.find(l => l.commitment && l.commitment.flagKey === flagKey);
        const c = letter && letter.commitment;
        if (!c || !c.requiredItem) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const have = GameState.inventory[c.requiredItem.id] || 0;
        if (have < c.requiredItem.qty) {
            if (typeof UI !== 'undefined') UI.notify(lang==='en' ? '⚠️ Not enough in stock.' : '⚠️ Nemáš dost na skladě.', true);
            return;
        }
        Game.removeItem(c.requiredItem.id, c.requiredItem.qty);
        if (c.reward) {
            if (c.reward.grose && typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(c.reward.grose);
            if (c.reward.influenceKey && typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence(c.reward.influenceKey, c.reward.influenceAmt || 0);
            // Pověst (povest-frakcni-reputace-mrd.md) — volitelné, jen pokud dopis reputationKey definuje
            if (c.reward.reputationKey && typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation(c.reward.reputationKey, c.reward.reputationAmt || 0);
        }
        GameState.flags[flagKey] = c.deliveredValue || 'delivered';
        GameState.flags[flagKey + 'DeliveredAt'] = Date.now();
        const forWhom = lang === 'en' ? (c.forWhom_en || c.forWhom_cs) : c.forWhom_cs;
        const what = lang === 'en' ? (c.what_en || c.what_cs) : c.what_cs;
        if (typeof UI !== 'undefined') UI.notify('📜 ' + (lang==='en' ? 'Delivered: ' : 'Odbaveno: ') + what);
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
            '📜 Zakázka odevzdána: ' + forWhom + ' — ' + what + '.',
            '📜 Commission delivered: ' + forWhom + ' — ' + what + '.',
            '📜 Opus traditum est.');
        this._pushHistory({ icon: '📜', title: forWhom, outcome: 'accept', detail: what });
        if (typeof Game !== 'undefined') Game.save();
        this.render();
    },

    // Krok 3c — resolve CHRONICON zakázky (accept/decline). Item se získá
    // znovu přes _getChronicleCommitments (stejná normalizace, žádná
    // duplicitní logika/stav navíc).
    resolveChronicle: function (id, choiceId) {
        const item = this._getChronicleCommitments().find(i => i.id === id);
        if (!item) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.chroniconAdvisory) GameState.chroniconAdvisory = { activeId: null, pending: null, resolvedIds: {} };

        if (choiceId === 'accept') {
            // Kontrola skladu — vinum/wine fallback jako u serveMass().
            for (const req of item.requiredItems) {
                let have = GameState.inventory[req.id] || 0;
                if (req.id === 'wine' && have < req.qty && GameState.inventory.vinum) have = GameState.inventory.vinum;
                if (have < req.qty) {
                    if (typeof UI !== 'undefined') UI.notify(lang==='en' ? '⚠️ Not enough in stock.' : '⚠️ Nemáš dost na skladě.', true);
                    return;
                }
            }
            item.requiredItems.forEach(req => {
                let useId = req.id;
                if (useId === 'wine' && (GameState.inventory.wine || 0) < req.qty && GameState.inventory.vinum) useId = 'vinum';
                Game.removeItem(useId, req.qty);
            });

            if (item.kind === 'sepultura') {
                // Dar úměrný jmění zesnulého — přesně přenesená logika
                // z bývalého _resolveAdvisory catchallu (teď mrtvý kód, viz
                // krok 3c cleanup), žádná změna čísel.
                const gift = Math.round((item.wealth || 60) * 1.2);
                if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(gift);
                if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('church', 3);
                if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('important',
                    '⚱️ Právo sepultury uděleno — pohřben uvnitř kostelních zdí, za dar ' + gift + ' grošů.',
                    '⚱️ Right of sepulture granted — buried within the church walls, for a gift of ' + gift + ' groschen.',
                    '⚱️ Sepultura intra muros concessa est.');
                if (typeof UI !== 'undefined') UI.notify('⚱️ ' + (lang==='en' ? 'Right of sepulture granted.' : 'Právo sepultury uděleno.'));
                this._pushHistory({ icon: '⚱️', title: item.title, outcome: 'accept', detail: gift + (lang==='en'?' groschen':' grošů') });
            } else if (item.kind === 'material') {
                if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(item.rewardGrose || 0);
                if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
                    '📦 Zakázka odevzdána — ' + (item.rewardGrose||0) + ' grošů.',
                    '📦 Commission delivered — ' + (item.rewardGrose||0) + ' groschen.',
                    '📦 Opus traditum est.');
                if (typeof UI !== 'undefined') UI.notify('📦 ' + (lang==='en' ? 'Delivered.' : 'Odbaveno.'));
                this._pushHistory({ icon: '📦', title: item.title, outcome: 'accept', detail: (item.rewardGrose||0) + (lang==='en'?' groschen':' grošů') });
            } else if (item.kind === 'farni') {
                // Odměny beze změny oproti parishEventTick (core/game.js) —
                // stejné hodnoty, jen jiný spouštěč (Zakázky, ne modal).
                if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
                if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                    PersonaSystem.addInfluence('church', 2);
                    PersonaSystem.addInfluence('village', 2);
                }
                if (item.farniType === 'wedding' && typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                    CellariumSystem.addGrose(5 + Math.floor(Math.random() * 10));
                }
                if (item.farniType === 'funeral') {
                    if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
                    GameState.cemetery.graves.push({ surname: this._pickSurname(item.id), ts: Date.now() });
                    if (GameState.cemetery.graves.length === 1 && typeof SecretsSystem !== 'undefined' && SecretsSystem.unlockFolioById) {
                        SecretsSystem.unlockFolioById('folio_grim_bestiar');
                    }
                }
                // Vesnice pool → echo do sdíleného CHRONICON světa. Lokální
                // parishEventTick tohle NEVOLÁ — farnost-chronicon-
                // reference.md sekce 1/4, rozlišení pool.
                if (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._reportActorFavorIfNewDay) {
                    ChroniconSystem._reportActorFavorIfNewDay('klaster');
                }
                if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
                    '✝️ ' + item.title + ' — obřad vykonán.',
                    '✝️ ' + item.title + ' — rite performed.',
                    '✝️ Ritus peractus est.');
                if (typeof UI !== 'undefined') UI.notify('✝️ ' + (lang==='en' ? 'Rite performed.' : 'Obřad vykonán.'));
                this._pushHistory({ icon: item.icon, title: item.title, outcome: 'accept' });
            }

            GameState.chroniconAdvisory.resolvedIds[id] = true;
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
            return;
        }

        if (choiceId === 'decline') {
            if (item.kind === 'farni') {
                if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', -2);
            }
            GameState.chroniconAdvisory.resolvedIds[id] = true;
            if (typeof UI !== 'undefined') UI.notify(lang==='en' ? 'Declined.' : 'Odmítnuto.');
            this._pushHistory({ icon: item.icon, title: item.title, outcome: 'decline' });
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
        }
    },

    // Dodatek 27.7.2026 — resolve pro lokální Klášter pool (parishEventTick
    // "Naplánovat" volba). Stejná materiálová logika jako resolveChronicle,
    // ale: (1) žádný _reportActorFavorIfNewDay, (2) po vyřešení se záznam
    // ODEBERE z GameState.localFarniEvents (ne resolvedIds — není to sdílená
    // fronta, nemá smysl si pamatovat "vyřešeno", prostě zmizí).
    resolveLocal: function (id, choiceId) {
        if (typeof id === 'string' && id.indexOf('akter_') === 0) {
            this.resolveLocalAkter(id, choiceId);
            return;
        }
        if (!Array.isArray(GameState.localFarniEvents)) return;
        const idx = GameState.localFarniEvents.findIndex(f => f.id === id);
        if (idx === -1) return;
        const item = this._normalizeLocalFarniEvent(GameState.localFarniEvents[idx]);
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        if (choiceId === 'accept') {
            for (const req of item.requiredItems) {
                let have = GameState.inventory[req.id] || 0;
                if (req.id === 'wine' && have < req.qty && GameState.inventory.vinum) have = GameState.inventory.vinum;
                if (have < req.qty) {
                    if (typeof UI !== 'undefined') UI.notify(lang==='en' ? '⚠️ Not enough in stock.' : '⚠️ Nemáš dost na skladě.', true);
                    return;
                }
            }
            item.requiredItems.forEach(req => {
                let useId = req.id;
                if (useId === 'wine' && (GameState.inventory.wine || 0) < req.qty && GameState.inventory.vinum) useId = 'vinum';
                Game.removeItem(useId, req.qty);
            });

            // Odměny beze změny oproti parishEventTick "Vykonat" — jen bez
            // actor favor reportu (rozhodnuto: zůstává lokální).
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                PersonaSystem.addInfluence('church', 2);
                PersonaSystem.addInfluence('village', 2);
            }
            if (item.farniType === 'wedding' && typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                CellariumSystem.addGrose(5 + Math.floor(Math.random() * 10));
            }
            if (item.farniType === 'funeral') {
                if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
                GameState.cemetery.graves.push({ surname: GameState.localFarniEvents[idx].surname, ts: Date.now() });
                if (GameState.cemetery.graves.length === 1 && typeof SecretsSystem !== 'undefined' && SecretsSystem.unlockFolioById) {
                    SecretsSystem.unlockFolioById('folio_grim_bestiar');
                }
            }
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
                '✝️ ' + item.title + ' — obřad vykonán.',
                '✝️ ' + item.title + ' — rite performed.',
                '✝️ Ritus peractus est.');
            if (typeof UI !== 'undefined') UI.notify('✝️ ' + (lang==='en' ? 'Rite performed.' : 'Obřad vykonán.'));
            this._pushHistory({ icon: item.icon, title: item.title, outcome: 'accept' });

            GameState.localFarniEvents.splice(idx, 1);
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
            return;
        }

        if (choiceId === 'decline') {
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', -2);
            if (typeof UI !== 'undefined') UI.notify(lang==='en' ? 'Declined.' : 'Odmítnuto.');
            this._pushHistory({ icon: item.icon, title: item.title, outcome: 'decline' });
            GameState.localFarniEvents.splice(idx, 1);
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
        }
    },

    // Krok C (zakazky-3-kandidati.md) — zakázky od Clientela↔Chronicon
    // propojených aktérů. Na rozdíl od farní/mše se odměna promítá do
    // GameState.contactRelation[actorId] — a ten se pak SÁM propíše přes
    // ChroniconSystem._reportContactRelationIfNewDay() (Krok B) do
    // Chroniconu. Žádné další propojení tu není potřeba, kruh se
    // uzavírá existující mechanikou.
    resolveLocalAkter: function (id, choiceId) {
        if (!Array.isArray(GameState.localAkterZakazky)) return;
        const idx = GameState.localAkterZakazky.findIndex(z => z.id === id);
        if (idx === -1) return;
        const raw = GameState.localAkterZakazky[idx];
        const item = this._normalizeLocalAkterEvent(raw);
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!item) { GameState.localAkterZakazky.splice(idx, 1); return; }

        if (choiceId === 'accept') {
            for (const req of item.requiredItems) {
                const have = GameState.inventory[req.id] || 0;
                if (have < req.qty) {
                    if (typeof UI !== 'undefined') UI.notify(lang==='en' ? '⚠️ Not enough in stock.' : '⚠️ Nemáš dost na skladě.', true);
                    return;
                }
            }
            item.requiredItems.forEach(req => Game.removeItem(req.id, req.qty));

            if (item.rewardGrose && typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                CellariumSystem.addGrose(item.rewardGrose);
            }
            // contactRelation jen pro skutečné Clientela kontakty (sklar/kovar/mlynar, Kategorie A)
            if (item.contactRelationReward && typeof ContactsDB !== 'undefined' && ContactsDB[raw.actorId]) {
                if (!GameState.contactRelation) GameState.contactRelation = {};
                const cur = GameState.contactRelation[raw.actorId] || 0;
                GameState.contactRelation[raw.actorId] = Math.max(0, Math.min(100, cur + item.contactRelationReward));
            }
            // Pověst (povest-frakcni-reputace-mrd.md) — Kategorie A→lidovost, B→slechta
            if (item.reputationKey && typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
                PersonaSystem.addReputation(item.reputationKey, item.reputationAmt || 0);
            }
            // Vrstva 3 (zakazky-rozsireni-ctyri-kategorie-mrd.md §6) — kontakt-specifická
            // věcná odměna, curio do Truhly (ItemsDB lostItem:true, čistě zobrazovací tam)
            if (item.bonusItem && typeof Game !== 'undefined' && Game.addItem) {
                Game.addItem(item.bonusItem.id, item.bonusItem.qty || 1);
            }
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
                '📜 ' + item.title + ' — vyhotoveno.',
                '📜 ' + item.title + ' — completed.',
                '📜 Opus peractum est.');
            if (typeof UI !== 'undefined') UI.notify('📜 ' + (lang==='en' ? 'Commission completed.' : 'Zakázka vyhotovena.'));
            this._pushHistory({ icon: item.icon, title: item.title, outcome: 'accept' });

            GameState.localAkterZakazky.splice(idx, 1);
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
            return;
        }

        if (choiceId === 'decline') {
            // contactRelation jen pro skutečné Clientela kontakty
            if (item.contactRelationReward && typeof ContactsDB !== 'undefined' && ContactsDB[raw.actorId]) {
                if (!GameState.contactRelation) GameState.contactRelation = {};
                const cur = GameState.contactRelation[raw.actorId] || 0;
                GameState.contactRelation[raw.actorId] = Math.max(0, cur - 1);
            }
            // Pověst — malý postih při odmítnutí (jen Kategorie A/B, mají reputationKey)
            if (item.reputationKey && typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
                PersonaSystem.addReputation(item.reputationKey, -1);
            }
            if (typeof UI !== 'undefined') UI.notify(lang==='en' ? 'Declined.' : 'Odmítnuto.');
            this._pushHistory({ icon: item.icon, title: item.title, outcome: 'decline' });
            GameState.localAkterZakazky.splice(idx, 1);
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
        }
    },

};