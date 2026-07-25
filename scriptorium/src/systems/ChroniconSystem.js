// ============================================
//  ChroniconSystem
//  Fetchuje chronicon_snapshot.json z GitHubu.
//  Injectuje chronicle záznamy do NotificationSystem
//  jako kategorii 'chronicon'.
//  Read-only — nikdy nepíše do GameState.
// ============================================

const ChroniconSystem = {

    URL:       'https://raw.githubusercontent.com/ondrex-ember/chronicon/main/data/chronicon_snapshot.json',
    CACHE_KEY: 'scriptorium_chronicon_v2',
    SEEN_KEY:  'scriptorium_chronicon_seen',
    TTL:       6 * 60 * 60 * 1000,   // 6 hodin v ms

    _snap: null,
    MAX_PER_LOAD: 4,   // Max nových záznamů zobrazených při jednom načtení

    init: function() {
        const cached = ChroniconSystem._loadCache();
        if (cached) {
            ChroniconSystem._snap = cached;
            ChroniconSystem._apply(cached);
        }
        // Vždy zkus fetch — pokud je cache čerstvá, server odpoví rychle z CDN
        ChroniconSystem._fetch();
    },

    // ─── Fetch ──────────────────────────────────────────────────────────────

    _fetch: function() {
        const cacheRaw = localStorage.getItem(ChroniconSystem.CACHE_KEY);
        if (cacheRaw) {
            try {
                const c = JSON.parse(cacheRaw);
                if (c._fetched && (Date.now() - c._fetched) < ChroniconSystem.TTL) {
                    return; // Cache je čerstvá, nefetchuj
                }
            } catch(e) {}
        }

        fetch(ChroniconSystem.URL)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function(snap) {
                snap._fetched = Date.now();
                localStorage.setItem(ChroniconSystem.CACHE_KEY, JSON.stringify(snap));
                ChroniconSystem._snap = snap;
                ChroniconSystem._apply(snap);
            })
            .catch(function(err) {
                // Tiché selhání — hra funguje bez CHRONICONu
                console.warn('[CHRONICON] Fetch selhal:', err.message);
            });
    },

    // ─── Apply snapshot ─────────────────────────────────────────────────────

    _apply: function(snap) {
        if (!snap || !snap.chronicle) return;

        // Kontrola valid_until
        if (snap.valid_until && new Date(snap.valid_until) < new Date()) {
            console.warn('[CHRONICON] Snapshot expiroval.');
            return;
        }

        // CHRONICON pasivní pohřby (před Proboštem) — hráč je informován,
        // ale nevede obřad (to přijde až s Proboštem přes parishEventTick).
        // Monotónní čítač + lokální "spotřebováno" kvůli 6h fetch cache —
        // stejný důvod jako u advisory_events výš.
        if (snap.region && typeof snap.region.totalFuneralEvents === 'number'
            && typeof GameState !== 'undefined' && !(GameState.rank && GameState.rank.probost)) {
            const consumedKey = 'chroniconFuneralsConsumed';
            const consumed = GameState[consumedKey] || 0;
            const diff = snap.region.totalFuneralEvents - consumed;
            if (diff > 0) {
                const toAdd = Math.min(diff, 2);
                const surnames = (Game && Game.PARISH_SURNAMES) || ['Novák', 'Dvořák', 'Král', 'Procházka', 'Sedlák'];
                if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
                for (let i = 0; i < toAdd; i++) {
                    const surname = surnames[Math.floor(Math.random() * surnames.length)];
                    GameState.cemetery.graves.push({ surname: surname, ts: Date.now() - i * 3600000 });
                    if (!GameState.kronika) GameState.kronika = [];
                    GameState.kronika.push({
                        ts:     Date.now() - i * 3600000,
                        cs:     'Zvěst z kraje: rodina ' + surname + ' pohřbila svého blízkého. Faráři z okolí obřad vykonali bez klášterní účasti.',
                        en:     'News from the region: the ' + surname + ' family buried a loved one. Local priests performed the rite without the monastery\'s part.',
                        la:     null,
                        type:   'chronicon_funeral',
                        source: 'chronicon',
                        icon:   '⚰️',
                        season: null,
                    });
                }
                GameState[consumedKey] = consumed + toAdd;
                Game.save();
            }
        }

        // Abbot message → toast + kanál zpráv + Kronika (jen při nové/změněné zprávě)
        if (snap.abbot && snap.abbot.message) {
            const msgId   = snap.abbot.message_id || snap.abbot.message;
            const lastKey = 'scriptorium_chronicon_abbot_last';
            const lastMsg = localStorage.getItem(lastKey);
            if (lastMsg !== msgId) {
                const lang     = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
                const msgShown = (lang === 'en' && snap.abbot.message_en) ? snap.abbot.message_en : snap.abbot.message;
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.toast('✝️ ' + msgShown, 'warn');
                    NotificationSystem.panel('✝️ ' + msgShown, 'chronicon');
                }
                if (typeof GameState !== 'undefined') {
                    if (!GameState.kronika) GameState.kronika = [];
                    GameState.kronika.push({
                        ts:     Date.now(),
                        cs:     snap.abbot.message,
                        en:     snap.abbot.message_en || snap.abbot.message,
                        la:     null,
                        type:   'chronicon_abbot',
                        source: 'abbot',
                        icon:   '✝️',
                        season: null,
                    });
                }
                localStorage.setItem(lastKey, msgId);
            }
        }

        // CHRONICON unlockFlags → GameState.flags (celá historie vždy — nový
        // hráč dostane na první fetch všechny dosud udělené flagy najednou)
        if (Array.isArray(snap.unlockFlags) && typeof GameState !== 'undefined') {
            if (!GameState.flags) GameState.flags = {};
            snap.unlockFlags.forEach(function (flagName) {
                if (typeof flagName === 'string' && !GameState.flags[flagName]) {
                    GameState.flags[flagName] = true;
                    if (!GameState.kronika) GameState.kronika = [];
                    GameState.kronika.push({
                        ts:     Date.now(),
                        cs:     'Zvěst přinesla novou možnost.',
                        en:     'A rumor has brought a new possibility.',
                        la:     null,
                        type:   'chronicon_unlock',
                        source: 'chronicon',
                        icon:   '🕊️',
                        season: null,
                    });
                }
            });
        }

        // CHRONICON porta_letters (Vrstva 3) → GameState.letters.dynamic.
        // Stejný dedup princip jako unlockFlags — jen nové id se přidá,
        // PortaSystem.getQueue() pak řeší readIds/firstSeen/expiry stejně
        // jako u statických LettersDB dopisů.
        if (Array.isArray(snap.porta_letters) && typeof GameState !== 'undefined') {
            if (!GameState.letters) GameState.letters = { readIds: {}, archive: [], firstSeen: {} };
            if (!GameState.letters.dynamic) GameState.letters.dynamic = [];
            const knownIds = {};
            GameState.letters.dynamic.forEach(function (l) { knownIds[l.id] = true; });
            snap.porta_letters.forEach(function (entry) {
                if (!entry || !entry.id || knownIds[entry.id]) return;
                GameState.letters.dynamic.push(entry);
                knownIds[entry.id] = true;
            });
        }

        // CHRONICON advisory_events → kurátorované rozhodovací eventy (Sprint 3).
        // Cap: jen 1 aktivní najednou. "Odložit" nic neztratí — zůstává
        // aktivní, dokud se hráč nerozhodne jinak. Formát mirror events-reference.md.
        // Vlna 1 / Hostina (ubytovna-mrd.md §8c-A): syntetický kandidát ze
        // snap.feast — GM-ruční pole, žádná změna na CHRONICON straně. Řadí
        // se před advisory_events, jinak stejná cap-1/resolvedIds mechanika.
        const feastCandidate = ChroniconSystem._buildFeastCandidate(snap);
        const hasAdvisorySource = (snap.advisory_events && snap.advisory_events.length) || feastCandidate;
        if (hasAdvisorySource && typeof GameState !== 'undefined') {
            if (!GameState.chroniconAdvisory) GameState.chroniconAdvisory = { activeId: null, pending: null, resolvedIds: {} };
            const adv = GameState.chroniconAdvisory;
            if (!adv.activeId) {
                const isProbost = !!(GameState.rank && GameState.rank.probost);
                const pool = feastCandidate ? [feastCandidate].concat(snap.advisory_events || []) : (snap.advisory_events || []);
                const candidate = pool.find(e => !adv.resolvedIds[e.id] && (!e.probost_only || isProbost));
                if (candidate) {
                    adv.activeId = candidate.id;
                    adv.pending  = candidate;
                    Game.save();
                }
            }
        }

        // Chronicle záznamy → NotificationSystem.panel() + GameState.kronika
        const seen = ChroniconSystem._loadSeen();
        let added  = 0;

        // Záznamy jsou od nejnovějšího — injectujeme od nejstaršího
        const entries = [...snap.chronicle].reverse();

        const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language)
            ? GameState.settings.language
            : 'cs';

        // Syntetický timestamp základ: snap.generated odpovídá nejvyššímu tick číslu
        const snapTs    = snap.generated ? Date.parse(snap.generated) : Date.now();
        const maxTick   = snap.time && snap.time.total_tick != null ? snap.time.total_tick : 0;
        const TICK_MS   = 6 * 60 * 60 * 1000; // 6h per tick

        entries.forEach(function(entry) {
            const id = ChroniconSystem._entryId(entry);
            if (seen[id]) return; // Už viděno

            // Cap: zobraz max MAX_PER_LOAD nových záznamů najednou.
            // Přeskočené starší záznamy se označí jako viděné — nehromadí se.
            if (added >= ChroniconSystem.MAX_PER_LOAD) {
                seen[id] = 1;
                return;
            }

            // Panel notifikace
            if (typeof NotificationSystem !== 'undefined') {
                const icon = entry.icon ? entry.icon + ' ' : '';
                const text = (lang === 'en' && entry.text_en)
                    ? entry.text_en
                    : (entry.text_cs || entry.text);
                // Mapovat source na subkategorii pro správný label v panelu
                const src = entry.source || '';
                const cat = src === 'distant_events'
                    ? 'chronicon_distant'
                    : (src === 'local_events'
                        ? 'chronicon_local'
                        : (src === 'monastery_internal' || src === 'engine' || src === 'gm' || src === 'weather'
                            ? 'chronicon_monastery'
                            : 'chronicon'));
                NotificationSystem.panel(icon + text, cat);
            }

            // Inject do GameState.kronika
            ChroniconSystem._injectToKronika(entry, snapTs, maxTick);

            seen[id] = 1;
            added++;
        });

        if (added > 0) {
            ChroniconSystem._saveSeen(seen);
        }
    },

    // ─── Cache helpers ───────────────────────────────────────────────────────

    _loadCache: function() {
        try {
            const raw = localStorage.getItem(ChroniconSystem.CACHE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch(e) { return null; }
    },

    _loadSeen: function() {
        try {
            const raw = localStorage.getItem(ChroniconSystem.SEEN_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch(e) { return {}; }
    },

    _saveSeen: function(seen) {
        // Udržuj max 500 seen ID — ořež nejstarší pokud přesáhne
        const keys = Object.keys(seen);
        if (keys.length > 500) {
            const trimmed = {};
            keys.slice(-400).forEach(function(k) { trimmed[k] = 1; });
            localStorage.setItem(ChroniconSystem.SEEN_KEY, JSON.stringify(trimmed));
        } else {
            localStorage.setItem(ChroniconSystem.SEEN_KEY, JSON.stringify(seen));
        }
    },

    // ─── Inject do Kroniky ───────────────────────────────────────────────────

    _injectToKronika: function(entry, snapTs, maxTick) {
        if (typeof GameState === 'undefined') return;
        if (!GameState.kronika) GameState.kronika = [];

        // Syntetický timestamp: snap.generated = maxTick, každý tick = 6h zpět
        const tickDelta = maxTick - (entry.tick || 0);
        const ts        = snapTs - tickDelta * 6 * 60 * 60 * 1000;

        GameState.kronika.push({
            ts:     ts,
            cs:     entry.text_cs || entry.text || '',
            en:     entry.text_en || entry.text || '',
            la:     null,
            type:   'chronicon',
            source: entry.source || 'chronicon',
            icon:   entry.icon   || '☩',
            season: entry.season || null,
        });
    },

    // Vlna 1 — Hostina, kalendářní fallback (ubytovna-mrd.md §8c-A
    // rozšíření, Bouvarde 24.7. "navázat na svátky v kalendáři"). Reuse
    // existující !subtle filtr (viz calendar.js showDayDetail/legend) —
    // odděluje "skutečný" svátek od vedlejších (Advent má 24 dní, ale je
    // subtle: true, tudíž vyfiltrovaný).
    _todaysMajorFeast: function() {
        if (typeof CalendarSystem === 'undefined' || !CalendarSystem.getFeastsForMonth) return null;
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const feasts = CalendarSystem.getFeastsForMonth(month, CalendarSystem.GAME_YEAR)
            .filter(f => f.day === day && !f.subtle);
        return feasts.length ? feasts[0] : null;
    },

    // Vlna 1 — Hostina (ubytovna-mrd.md §8c-A): syntetický advisory kandidát
    // ze snap.feast (GM-ruční, přednost) NEBO z kalendáře (automatický
    // fallback, viz _todaysMajorFeast výš). Dedup per svátek+den přes
    // vlastní id — mirror _reportRescueIfNewDay vzor jinde v kódu.
    _buildFeastCandidate: function(snap) {
        let name, nameEn, dateKey;
        if (snap && snap.feast && snap.feast.active) {
            name    = snap.feast.name_cs || 'svátek';
            nameEn  = snap.feast.name_en || name;
            dateKey = (snap.time && snap.time.date_string) || snap.generated || '';
        } else {
            const cf = ChroniconSystem._todaysMajorFeast();
            if (!cf) return null;
            name    = cf.nameCS;
            nameEn  = cf.nameEN;
            // Reálné ISO datum — svátek se přirozeně vrací každý rok
            // (jiný rok = jiný dateKey = nový kandidát, ne navěky resolved).
            dateKey = new Date().toISOString().slice(0, 10);
        }
        return {
            id: 'hostina_' + name + '_' + dateKey,
            kind: 'hostina',
            icon: '🍞',
            title_cs: 'Hosté na ' + name,
            title_en: 'Guests for ' + nameEn,
            text_cs: 'Ke slavnosti "' + name + '" dorazili k bráně poutníci a vesničané — chtějí se přidat k oslavě a přenocovat.',
            text_en: 'Pilgrims and villagers have arrived at the gate for the feast of "' + nameEn + '" — they wish to join the celebration and stay the night.',
            choices: [
                { id: 'accept',  label_cs: 'Přijmout na oslavu',    label_en: 'Welcome them to the feast' },
                { id: 'decline', label_cs: 'Zdvořile odmítnout',    label_en: 'Politely decline' },
                { id: 'defer',   label_cs: 'Rozhodnout se později', label_en: 'Decide later' },
            ],
        };
    },

    _entryId: function(entry) {
        // Stabilní ID nezávislé na textu — EN/CS verze téže zprávy = stejné ID
        if (entry.id) return String(entry.id);
        return (entry.source || '') + '_' + (entry.tick || 0);
    },

    // ─── Advisory events — kurátorované rozhodovací eventy z CHRONICONu ─────

    _advisoryShownThisSession: false,

    // Volat ze stejné kadence jako EventsSystem.checkEvents() (1×/s tick)
    checkPendingAdvisory: function() {
        if (typeof GameState === 'undefined' || !GameState.chroniconAdvisory) return;
        const adv = GameState.chroniconAdvisory;
        if (!adv.pending || !adv.activeId) return;
        if (ChroniconSystem._advisoryShownThisSession) return;
        if (typeof EventsSystem === 'undefined' || typeof NotificationSystem === 'undefined') return;

        ChroniconSystem._advisoryShownThisSession = true;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const p = adv.pending;

        EventsSystem.showEvent({
            icon:  p.icon || '☩',
            title: lang === 'en' ? (p.title_en || p.title_cs) : p.title_cs,
            text:  lang === 'en' ? (p.text_en  || p.text_cs)  : p.text_cs,
            choices: (p.choices || []).map(c => ({
                label: lang === 'en' ? (c.label_en || c.label_cs) : c.label_cs,
                action: () => ChroniconSystem._resolveAdvisory(adv.activeId, c.id, lang),
            })),
        });
    },

    _resolveAdvisory: function(eventId, choiceId, lang) {
        const adv = GameState.chroniconAdvisory;
        const p = adv.pending;

        // Hospes 'accept' — gate kontroly PŘED trvalým resolve (mirror 'defer'
        // chování): plná lůžka nesmí kandidáta ztratit, hráč má šanci se
        // vrátit, jakmile se uvolní. cause: 'war' (Vlna 1 / C —
        // ubytovna-mrd.md §8c-C) míří na Ubytovnu místo Infirmaria —
        // zdravý uprchlík, ne nemocný. Kapacita živě z Game.ubytovnaCapacity()
        // (sklep upgrade 4/5) — základ 1 lůžko od začátku hry.
        if (choiceId === 'accept' && p && p.kind === 'hospes' && p.cause === 'war') {
            if (!GameState.ubytovna) GameState.ubytovna = { guests: [] };
            const bedsNow = (typeof Game !== 'undefined' && Game.ubytovnaCapacity) ? Game.ubytovnaCapacity() : 1;
            if ((GameState.ubytovna.guests || []).length >= bedsNow) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'No room is free. He waits at the gate.'
                    : 'Žádné místo není volné. Čeká u brány.';
            }
        }
        if (choiceId === 'accept' && p && p.kind === 'hospes' && p.cause !== 'war') {
            const hasTech = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_infirmarium_hospitalitas'));
            if (!hasTech) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'The brothers lack the means to take in strangers yet. (Requires: Hospitalitas)'
                    : 'Bratři zatím nemají prostředky přijímat cizí. (Vyžaduje: Hospitalitas)';
            }
            if (!GameState.infirmarium) GameState.infirmarium = { beds: 3, patients: [] };
            const inf = GameState.infirmarium;
            if ((inf.patients || []).length >= inf.beds) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'No bed is free. The traveler waits at the gate.'
                    : 'Žádná postel není volná. Poutník čeká u brány.';
            }
        }

        // Studovna 'accept' — stejný soft-bounce vzor jako hospes: zamčená
        // tech nebo obsazenej hostí slot nesmí žádost ztratit, jen ji odloží.
        if (choiceId === 'accept' && p && p.kind === 'studovna') {
            const hasTech = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_studovna'));
            if (!hasTech) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'There is no room yet fit to receive him. (Requires: Studovna)'
                    : 'Zatím není žádná místnost hodná jeho přijetí. (Vyžaduje: Studovna)';
            }
            if (GameState.studovnaGuest && GameState.studovnaGuest.until > Date.now()) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'The study room is already occupied by another guest.'
                    : 'Studovna je právě obsazená jiným hostem.';
            }
        }

        // Pocestný 'accept' — stejný soft-bounce vzor jako hospes/studovna
        // (ubytovna-mrd.md §8c-B, rozšíření): plná Ubytovna nesmí
        // kandidáta ztratit, jen ho odloží. Kapacita živě z
        // Game.ubytovnaCapacity() (sklep upgrade 4/5, §D — Bouvarde 24.7.),
        // základ 1 lůžko od začátku hry.
        if (choiceId === 'accept' && p && p.kind === 'pocestny') {
            if (!GameState.ubytovna) GameState.ubytovna = { guests: [] };
            const uby = GameState.ubytovna;
            const bedsNow = (typeof Game !== 'undefined' && Game.ubytovnaCapacity) ? Game.ubytovnaCapacity() : 1;
            if ((uby.guests || []).length >= bedsNow) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'No room is free. The traveler waits at the gate.'
                    : 'Žádné místo není volné. Pocestný čeká u brány.';
            }
        }

        if (choiceId === 'defer') {
            // Nic se neztrácí — zůstává aktivní, může se ukázat znovu příště.
            ChroniconSystem._advisoryShownThisSession = false;
            return lang === 'en'
                ? 'You decide to think it over. The matter can wait.'
                : 'Rozhodneš se to ještě promyslet. Věc může počkat.';
        }
        adv.resolvedIds[eventId] = true;
        adv.activeId = null;
        adv.pending  = null;
        if (choiceId === 'bolster') {
            if (!GameState.flags) GameState.flags = {};
            GameState.flags.chroniconPlagueBolstered = true;
            return lang === 'en'
                ? 'The brothers resolve to watch over the sick more closely. (Full effect awaits the Infirmarium — for now, this is a resolve, not yet a remedy.)'
                : 'Bratři se rozhodli bedlivěji dohlížet na nemocné. (Plný účinek čeká na Infirmarium — zatím je to spíš předsevzetí než lék.)';
        }
        if (choiceId === 'accept' && p && p.kind === 'hospes' && p.cause === 'war') {
            // Uprchlík — Ubytovna, ne Infirmarium (Vlna 1 / C —
            // ubytovna-mrd.md §8c-C). Delší plannedDays než pocestný/
            // hostina — "levné ubytování na dlouho", ne noc přes cestu.
            if (!GameState.ubytovna) GameState.ubytovna = { guests: [] };
            GameState.ubytovna.guests.push({
                variant: 'uprchlik',
                title_cs: p.title_cs,
                title_en: p.title_en,
                actorId: p.actorId,
                arrivedAt: Date.now(),
                plannedDays: 6,
                joinChance: 0,
                joinOffered: false,
            });
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? `${p.title_en || 'He'} is given shelter for the days ahead.`
                : `${p.title_cs || 'Uprchlík'} dostává útočiště na několik dní dopředu.`;
        }
        if (choiceId === 'accept' && p && p.kind === 'hospes') {
            // Přijetí hospes pacienta — viz infirmarium-hospites-rescue-mrd.md §3.
            if (!GameState.infirmarium) GameState.infirmarium = { beds: 3, patients: [] };
            GameState.infirmarium.patients.push({
                kind: 'hospes',
                id: p.id,
                name: p.name,
                ailment_cs: p.cause === 'plague' ? 'Mor' : 'Bída a vyčerpání',
                ailment_en: p.cause === 'plague' ? 'Plague' : 'Poverty and exhaustion',
                wealth: p.wealth || 0,
                actorId: p.actorId,
                arrivedAt: Date.now(),
                recoverHours: p.cause === 'plague' ? 144 : 60,
            });
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? `${p.name} is taken into the infirmary. A bed is made ready.`
                : `${p.name} je přijat do Infirmaria. Lůžko je připraveno.`;
        }
        if (choiceId === 'accept' && p && p.kind === 'hostina') {
            // Vlna 1 — Hostina: jednorázový efekt, žádné lůžko (mirror sepultura).
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 2);
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('important',
                    '🍞 ' + p.title_cs + ' — klášter otevřel brány poutníkům a vesničanům.',
                    '🍞 ' + p.title_en + ' — the monastery opened its gates to pilgrims and villagers.',
                    '🍞 Hospites in festo suscepti sunt.');
            }
            return lang === 'en'
                ? 'The gates are opened. Pilgrims and villagers join the feast within the walls.'
                : 'Brány jsou otevřeny. Poutníci a vesničané se přidávají k oslavě uvnitř zdí.';
        }
        if (choiceId === 'accept' && p && p.kind === 'pocestny') {
            // Vlna 1 — Pocestný, s lůžkem (ubytovna-mrd.md §8c-B, rozšíření):
            // obsadí Ubytovnu, odejde + odmění se v
            // ChroniconSystem.ubytovnaDailyTick() po uplynutí plannedDays.
            // plannedDays: placeholder podle typu, snadno doladitelné —
            // do budoucna základ pro delší pobyty (uprchlík/vesničan).
            const PLANNED_DAYS = { poutnik: 1, kramar: 2, zebravy_mnich: 1 };
            if (!GameState.ubytovna) GameState.ubytovna = { guests: [] };
            GameState.ubytovna.guests.push({
                variant: p.variant,
                title_cs: p.title_cs,
                title_en: p.title_en,
                arrivedAt: Date.now(),
                plannedDays: PLANNED_DAYS[p.variant] || 1,
                joinChance: 0,
                joinOffered: false,
            });
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? 'He is given a bed for the night.'
                : 'Dostává lůžko na noc.';
        }
        if (choiceId === 'accept' && p && p.kind === 'studovna') {
            // Vyhovění žádosti — Vrchnost influence + anonymní denní report,
            // viz studovna-vrchnost-mrd.md §3-4. Timed occupancy slot (48h) —
            // vizuálně obsazen ve StudovnaSystem, mirror hospes recoverHours vzor.
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('vrchnost', 4);
            GameState.studovnaGuest = {
                name: lang === 'en' ? 'The Lord' : 'Vrchnost',
                until: Date.now() + 48 * 60 * 60 * 1000,
            };
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('important',
                    '📜 Vrchnost přijata do Studovny — listiny prohledány, klid zachován.',
                    '📜 The Lord was received in the study room — the charters searched, the peace kept.',
                    '📜 Dominus in studiolo susceptus est.');
            }
            ChroniconSystem._reportVrchnostFavorIfNewDay();
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? "The Lord is received in the study room. The monastery's charters are laid open before him."
                : 'Vrchnost je přijat do Studovny. Klášterní listiny jsou před ním otevřeny.';
        }
        if (choiceId === 'accept') {
            // Právo sepultury — dar úměrný jmění zesnulého (historicky přesně
            // takhle kláštery vydělávaly na "dary za spásu duše").
            const gift = Math.round((p && p.wealth ? p.wealth : 60) * 1.2);
            if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(gift);
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('church', 3);
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('important',
                    '⚱️ Právo sepultury uděleno — pohřben uvnitř kostelních zdí, za dar ' + gift + ' grošů.',
                    '⚱️ Right of sepulture granted — buried within the church walls, for a gift of ' + gift + ' groschen.',
                    '⚱️ Sepultura intra muros concessa est.');
            }
            return lang === 'en'
                ? `The gift is accepted — ${gift} groschen for the monastery's coffers. The deceased rests within the church walls, as befits his station.`
                : `Dar je přijat — ${gift} grošů do klášterní pokladny. Zesnulý odpočívá uvnitř kostelních zdí, jak přísluší jeho postavení.`;
        }
        if (choiceId === 'decline' && p && p.kind === 'studovna') {
            return lang === 'en'
                ? 'The request is turned down. The Lord takes no offense — but none either.'
                : 'Žádost je odmítnuta. Vrchnost se neurazí — ale ani nepotěší.';
        }
        if (choiceId === 'decline' && p && p.kind === 'hospes') {
            return lang === 'en'
                ? 'The traveler is turned away. He must seek shelter elsewhere.'
                : 'Poutník je odmítnut. Musí hledat útočiště jinde.';
        }
        if (choiceId === 'decline' && p && p.kind === 'hostina') {
            return lang === 'en'
                ? 'The gates remain closed. The feast is kept within the walls alone.'
                : 'Brány zůstávají zavřené. Oslava se drží jen uvnitř zdí.';
        }
        if (choiceId === 'decline' && p && p.kind === 'pocestny') {
            return lang === 'en'
                ? 'He is turned away and continues down the road.'
                : 'Je odmítnut a pokračuje dál po cestě.';
        }
        if (choiceId === 'decline') {
            return lang === 'en'
                ? 'The request is politely declined. The family must seek burial elsewhere.'
                : 'Žádost je zdvořile odmítnuta. Rodina musí hledat pohřeb jinde.';
        }
        return lang === 'en'
            ? 'The monastery carries on as before. What happens in the wider region is beyond these walls.'
            : 'Klášter pokračuje jako dřív. Co se děje v širším kraji, je mimo tyto zdi.';
    },

    // Anonymní denní report vyhovění Vrchnosti — mirror
    // InfirmariumSystem._reportRescueIfNewDay, ale bez per-actor smyčky
    // (Vrchnost je jeden konkrétní aktér, viz studovna-vrchnost-mrd.md §3).
    _reportVrchnostFavorIfNewDay: function() {
        const today = new Date().toISOString().slice(0, 10);
        if (GameState.vrchnostReportSent === today) return;
        GameState.vrchnostReportSent = today;

        try {
            fetch('/api/vrchnost-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favor: true, day: today }),
            }).catch(() => {});
        } catch (e) { /* tiché selhání */ }
    },

    // Generický anonymní denní favor report pro libovolného CHRONICON
    // aktéra (api/actor-favor-report.js, core/actor-favor-register.js).
    // Dnes voláno pro 'klaster' po odsloužené mši (Game.serveMass) — dělá
    // z "Klášter" v CHRONICONu mechanickou zprávu o komunitě hráčů, ne jen
    // vyprávěcí gesto. Rozšíření na dalšího aktéra = jen další volání
    // odsud, žádný nový engine.
    _reportActorFavorIfNewDay: function(actorId) {
        if (!actorId) return;
        const today = new Date().toISOString().slice(0, 10);
        if (!GameState.actorFavorReportSent) GameState.actorFavorReportSent = {};
        if (GameState.actorFavorReportSent[actorId] === today) return;
        GameState.actorFavorReportSent[actorId] = today;

        try {
            fetch('/api/actor-favor-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actorId: actorId, day: today }),
            }).catch(() => {});
        } catch (e) { /* tiché selhání */ }
    },

    // Vlna 1 — Ubytovna: hosté odcházejí po uplynutí plannedDays, self-
    // guarded 24h (mirror InfirmariumSystem.hospesDailyTick vzoru,
    // ubytovna-mrd.md §8c-B rozšíření).
    UBYTOVNA_DAY_MS: 24 * 60 * 60 * 1000,

    // "Twist" (Bouvarde 24.7.): host se může přimknout k víře/práci a
    // zůstat jako Oblát/Famulus. Růst/den + cílová cesta per varianta.
    UBYTOVNA_JOIN_GROWTH: { poutnik: 18, uprchlik: 15, kramar: 12, zebravy_mnich: 5 },
    UBYTOVNA_JOIN_TRACK:  { poutnik: 'oblat', uprchlik: 'oblat', kramar: 'famulus', zebravy_mnich: 'oblat' },

    ubytovnaDailyTick: function() {
        if (!GameState.ubytovnaTick) GameState.ubytovnaTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.ubytovnaTick.lastTick || 0) < ChroniconSystem.UBYTOVNA_DAY_MS) return;
        GameState.ubytovnaTick.lastTick = now;

        const uby = GameState.ubytovna;
        if (!uby || !uby.guests || !uby.guests.length) return;

        const hasMagister = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_magister'));
        const freeSlot = (typeof Game !== 'undefined' && Game.conversiCapacity)
            ? (GameState.conversi || []).length < Game.conversiCapacity() : false;

        const stillHere = [];
        uby.guests.forEach(g => {
            // Náklonnost roste vždy — i bez volnýho slotu, vidět v dashboardu.
            const growth = ChroniconSystem.UBYTOVNA_JOIN_GROWTH[g.variant] || 10;
            g.joinChance = Math.min(90, (g.joinChance || 0) + growth);

            // Nabídka připojení — jen jednou za pobyt, jen s volným slotem
            // a vyzkoumaným Magistrem (mirror hireOblat/hireFamulus gate).
            if (!g.joinOffered && hasMagister && freeSlot && Math.random() * 100 < g.joinChance) {
                g.joinOffered = true;
                ChroniconSystem._offerGuestJoin(g);
                stillHere.push(g);
                return; // nechat ho tu, dokud hráč nerozhodne
            }

            const dueAt = (g.arrivedAt || 0) + (g.plannedDays || 1) * ChroniconSystem.UBYTOVNA_DAY_MS;
            if (now < dueAt) { stillHere.push(g); return; }

            // Odchází — drobný dar + village influence, mirror hospes vzoru.
            const gift = 2 + Math.floor(Math.random() * 3); // 2-4 grošů
            if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(gift);
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 1);
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('important',
                    '🥾 ' + g.title_cs + ' opouští Ubytovnu — na cestu dostal ' + gift + ' grošů.',
                    '🥾 ' + g.title_en + ' leaves the guesthouse — given ' + gift + ' groschen for the road.',
                    '🥾 Peregrinus hospitio discessit.');
            }
            // Uprchlík (cause: 'war') má actorId — reuse existující rescue
            // report, mirror InfirmariumSystem._reportRescueIfNewDay (§8c-C).
            // Pocestný/hostina nemají actorId, funkce se v tichosti vrátí.
            if (g.actorId && typeof InfirmariumSystem !== 'undefined' && InfirmariumSystem._reportRescueIfNewDay) {
                InfirmariumSystem._reportRescueIfNewDay(g.actorId);
            }
        });
        uby.guests = stillHere;

        // Flavour interakce — čistě narativní, žádnej mechanickej efekt
        // (Bouvarde 24.7., "cokoliv, spíš flavour").
        if (stillHere.length && (GameState.conversi || []).length && Math.random() < 0.08) {
            ChroniconSystem._ubytovnaFlavorVignette(stillHere);
        }

        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // Nabídka "host chce zůstat" — lokální event, mimo CHRONICON (rozhoduje
    // se jen na Scriptorium straně, žádnej round-trip).
    _offerGuestJoin: function(g) {
        if (typeof EventsSystem === 'undefined' || !EventsSystem.showEvent) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const track = ChroniconSystem.UBYTOVNA_JOIN_TRACK[g.variant] || 'oblat';
        const trackName_cs = track === 'famulus' ? 'famula' : 'obláta';
        const trackName_en = track === 'famulus' ? 'famulus' : 'oblate';
        EventsSystem.showEvent({
            icon: '🙏',
            title: lang === 'en' ? 'A guest wishes to stay' : 'Host chce zůstat',
            text: lang === 'en'
                ? `${g.title_en} has grown fond of life here and asks to join as a ${trackName_en}.`
                : `${g.title_cs} si oblíbil klášterní život a prosí, zda by mohl zůstat jako ${trackName_cs}.`,
            choices: [
                {
                    label: lang === 'en' ? 'Welcome him' : 'Přijmout ho',
                    action: () => ChroniconSystem._resolveGuestJoin(g, true),
                },
                {
                    label: lang === 'en' ? 'Let him move on' : 'Nechat ho jít dál',
                    action: () => ChroniconSystem._resolveGuestJoin(g, false),
                },
            ],
        });
    },

    _resolveGuestJoin: function(g, accepted) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!accepted) {
            return lang === 'en' ? 'He nods and, for now, continues on his way.' : 'Přikývne a zatím pokračuje dál svou cestou.';
        }
        if (GameState.ubytovna && GameState.ubytovna.guests) {
            GameState.ubytovna.guests = GameState.ubytovna.guests.filter(x => x !== g);
        }
        const track = ChroniconSystem.UBYTOVNA_JOIN_TRACK[g.variant] || 'oblat';
        if (!GameState.conversi) GameState.conversi = [];
        const namePool = (typeof Game !== 'undefined' && Game.KONVRS_NAMES) ? Game.KONVRS_NAMES : ['Bratr'];
        const usedNames = GameState.conversi.map(k => k.name);
        const available = namePool.filter(n => !usedNames.includes(n));
        const pool = available.length ? available : namePool;
        const name = pool[Math.floor(Math.random() * pool.length)];
        const entry = track === 'famulus'
            ? { id: 'famulus_' + Date.now(), rosterId: null, name: name, type: 'famulus', hiredAt: Date.now(), fatigue: 0, mood: 60, wageOwed: 0 }
            : { id: 'oblat_' + Date.now(), rosterId: null, name: name, type: 'oblat', hiredAt: Date.now(), fatigue: 0, mood: 60, matureAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
        GameState.conversi.push(entry);
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
            Game.addKronikaEntry('important',
                '🙏 ' + g.title_cs + ' zůstává v klášteře jako ' + name + '.',
                '🙏 ' + g.title_en + ' remains at the monastery as ' + name + '.',
                '🙏 Hospes conversus factus est.');
        }
        return lang === 'en'
            ? `${name} — for that is his name now — joins the community.`
            : `${name} — tak se teď jmenuje — se připojuje ke komunitě.`;
    },

    // Krátká narativní vinětka host↔konvrš, žádnej mechanickej efekt.
    // Vzory drženy jen v nominativu na obou stranách (X a Y), ať se
    // vyhnou českýmu skloňování dynamickýho jména.
    _ubytovnaFlavorVignette: function(guests) {
        const conv = GameState.conversi || [];
        if (!guests.length || !conv.length) return;
        const g = guests[Math.floor(Math.random() * guests.length)];
        const k = conv[Math.floor(Math.random() * conv.length)];
        const VIGNETTES = [
            { cs: 'Bratr ' + k.name + ' a ' + g.title_cs + ' strávili večer v tichém rozhovoru.',
              en: 'Brother ' + k.name + ' and ' + g.title_en + ' spent the evening in quiet conversation.' },
            { cs: g.title_cs + ' a bratr ' + k.name + ' si spolu zazpívali žalm na dvoře.',
              en: g.title_en + ' and brother ' + k.name + ' sang a psalm together in the yard.' },
            { cs: 'Bratr ' + k.name + ' a ' + g.title_cs + ' sdíleli chléb u večerního stolu.',
              en: 'Brother ' + k.name + ' and ' + g.title_en + ' shared bread at the evening table.' },
        ];
        const v = VIGNETTES[Math.floor(Math.random() * VIGNETTES.length)];
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
            Game.addKronikaEntry('minor', v.cs, v.en, null);
        }
    },

};