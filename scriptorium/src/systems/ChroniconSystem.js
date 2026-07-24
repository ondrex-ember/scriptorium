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

        // CHRONICON advisory_events → kurátorované rozhodovací eventy (Sprint 3).
        // Cap: jen 1 aktivní najednou. "Odložit" nic neztratí — zůstává
        // aktivní, dokud se hráč nerozhodne jinak. Formát mirror events-reference.md.
        if (snap.advisory_events && snap.advisory_events.length && typeof GameState !== 'undefined') {
            if (!GameState.chroniconAdvisory) GameState.chroniconAdvisory = { activeId: null, pending: null, resolvedIds: {} };
            const adv = GameState.chroniconAdvisory;
            if (!adv.activeId) {
                const isProbost = !!(GameState.rank && GameState.rank.probost);
                const candidate = snap.advisory_events.find(e => !adv.resolvedIds[e.id] && (!e.probost_only || isProbost));
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
        // chování): zamčená tech nebo plná lůžka nesmí kandidáta ztratit,
        // hráč má šanci se vrátit, jakmile podmínky splní.
        if (choiceId === 'accept' && p && p.kind === 'hospes') {
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

};