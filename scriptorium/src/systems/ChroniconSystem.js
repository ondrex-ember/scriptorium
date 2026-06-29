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

        // Abbot message → toast + kanál zpráv (jen jednou)
        if (snap.abbot && snap.abbot.message) {
            const toastKey = 'chronicon_abbot_' + snap.generated;
            if (!localStorage.getItem(toastKey)) {
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.toast('✝️ ' + snap.abbot.message, 'warn');
                    NotificationSystem.panel('✝️ ' + snap.abbot.message, 'chronicon');
                }
                localStorage.setItem(toastKey, '1');
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

};