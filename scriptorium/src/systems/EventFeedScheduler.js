// ============================================
//  EventFeedScheduler
//  eventy-audit-mrd (04.09.2026), Fáze 0, varianta A (Scriptorium-only).
//
//  Chronicon fetchuje 1×/den, ale sám tiká 4×/den — nastřádané chronicle
//  záznamy (až MAX_PER_LOAD, viz ChroniconSystem.js) se dřív vypouštěly
//  všechny najednou v jedné synchronní smyčce (jeden toast+kronika-push
//  za druhým). Tenhle modul je mezivrstva: ChroniconSystem._apply() teď
//  jen ENQUEUE, samotné zobrazení (panel + kronika) se rozprostře přes
//  EventFeedScheduler.onAction() — stejný action-count hook jako
//  EventsSystem (viz InventoryManager.js/ScavengeManager.js), žádný
//  nový časovač navíc.
//
//  Funguje i offline: fronta se plní při fetchi (síť), ale čerpá se
//  lokálně z GameState — žádné síťové volání potřeba k vypuštění položky.
// ============================================

const EventFeedScheduler = {

    DAILY_BUDGET: 5, // kolik položek smí vypustit za jeden reálný den — laditelné

    _ensureState: function () {
        if (typeof GameState === 'undefined') return null;
        if (!GameState.eventFeed) {
            GameState.eventFeed = { queue: [], dispensedToday: 0, lastDayKey: null };
        }
        return GameState.eventFeed;
    },

    // Reálný kalendářní den (ne herní) — fronta se čerpá, i když hráč
    // dlouho nehraje a pak se vrátí, ne jen "jednou za herní den".
    _dayKey: function () {
        const d = new Date();
        return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
    },

    // B (hrozba) a D (škoda) mají přednost před A/C/E (drby/info/pozitivní) —
    // hráč se dřív dozví o problému než o tom, že v Litovli prodali ječmen.
    _priorityWeight: function (entry) {
        const type = entry && entry.type;
        return (type === 'B' || type === 'D') ? 2 : 1;
    },

    // Zavolat místo okamžitého panel+kronika — entry/snapTs/maxTick mají
    // stejný tvar jako dřív v ChroniconSystem._apply() smyčce.
    enqueue: function (entry, snapTs, maxTick) {
        const st = this._ensureState();
        if (!st || !entry) return;
        st.queue.push({ entry: entry, snapTs: snapTs, maxTick: maxTick, enqueuedAt: Date.now() });
    },

    // ── Volá se ze stejného action-count hooku jako EventsSystem.onAction ──
    onAction: function () {
        const st = this._ensureState();
        if (!st) return;

        const today = this._dayKey();
        if (st.lastDayKey !== today) {
            st.lastDayKey = today;
            st.dispensedToday = 0;
        }

        if (st.dispensedToday >= this.DAILY_BUDGET) return;
        if (!st.queue.length) return;

        // Vyber nejvyšší prioritu; mezi stejnou prioritou první ve frontě (FIFO).
        let bestIdx = 0, bestW = -1;
        st.queue.forEach(function (item, i) {
            const w = EventFeedScheduler._priorityWeight(item.entry);
            if (w > bestW) { bestW = w; bestIdx = i; }
        });

        const picked = st.queue.splice(bestIdx, 1)[0];
        st.dispensedToday++;
        this._dispense(picked.entry, picked.snapTs, picked.maxTick);
    },

    // Přesně to, co dřív dělala smyčka v ChroniconSystem._apply() inline —
    // jen teď na jednu položku, v čase vypuštění místo v čase fetche.
    _dispense: function (entry, snapTs, maxTick) {
        const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language)
            ? GameState.settings.language : 'cs';

        if (typeof NotificationSystem !== 'undefined') {
            const icon = entry.icon ? entry.icon + ' ' : '';
            const text = (lang === 'en' && entry.text_en) ? entry.text_en : (entry.text_cs || entry.text);
            const src = entry.source || '';
            const cat = src === 'distant_events' ? 'chronicon_distant'
                : (src === 'local_events' ? 'chronicon_local'
                    : (src === 'monastery_internal' || src === 'engine' || src === 'gm' || src === 'weather'
                        ? 'chronicon_monastery' : 'chronicon'));
            NotificationSystem.panel(icon + text, cat);
        }

        if (typeof ChroniconSystem !== 'undefined' && typeof ChroniconSystem._injectToKronika === 'function') {
            ChroniconSystem._injectToKronika(entry, snapTs, maxTick);
        }

        // eventy-audit-mrd (04.09.2026) §1.1 dodatek: jen B (hrozba) a D
        // (škoda) jdou navíc jako Porta dopis — A/C/E (drby/info/pozitivní)
        // zůstávají jen v Kronice. Mirror vzoru z PortaSystem._checkOutgoingReplies
        // (jednoduchý dopis, jedna volba "Vzít na vědomí", žádný effect).
        if (entry.type === 'B' || entry.type === 'D') {
            this._toPortaLetter(entry);
        }

        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    _toPortaLetter: function (entry) {
        if (typeof GameState === 'undefined') return;
        if (!GameState.letters) GameState.letters = { readIds: {}, archive: [], firstSeen: {} };
        if (!GameState.letters.dynamic) GameState.letters.dynamic = [];

        const rawId = (typeof ChroniconSystem !== 'undefined' && typeof ChroniconSystem._entryId === 'function')
            ? ChroniconSystem._entryId(entry) : (entry.id || entry.text_cs || '');
        const letterId = 'feed_' + rawId;
        if (GameState.letters.dynamic.some(function (l) { return l.id === letterId; })) return; // už existuje

        const src = entry.source || '';
        const senderFallback_cs = src === 'distant_events' ? 'Zprávy z dálky'
            : (src === 'local_events' ? 'Zprávy z kraje' : 'Klášterní zápisky');
        const senderFallback_en = src === 'distant_events' ? 'News from afar'
            : (src === 'local_events' ? 'News from the region' : 'Monastery notes');

        GameState.letters.dynamic.push({
            id: letterId,
            seal: 'noble', // 🛡️ — hrozba/škoda, odlišené od běžné korespondence
            sender_cs: entry.source_label || senderFallback_cs,
            sender_en: entry.source_label || senderFallback_en,
            title_cs: entry.icon ? (entry.icon + ' Znepokojivá zvěst') : 'Znepokojivá zvěst',
            title_en: entry.icon ? (entry.icon + ' Troubling news') : 'Troubling news',
            text_cs: entry.text_cs || entry.text || '',
            text_en: entry.text_en || entry.text || '',
            choices: [{
                label_cs: '📜 Vzít na vědomí', label_en: '📜 Take note',
                effect: function () {}, notify_cs: '', notify_en: ''
            }]
        });
        GameState.letters.firstSeen[letterId] = Date.now();

        if (typeof NotificationSystem !== 'undefined') {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            NotificationSystem.panel('🕊️ ' + (lang === 'en' ? 'A troubling letter has arrived' : 'Dorazil znepokojivý dopis'), 'porta');
        }
    },
};