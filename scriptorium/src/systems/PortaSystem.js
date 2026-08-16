// ═══════════════════════════════════════════════════════════════════════════
// PortaSystem — Scriptorium
// Korespondenční vrstva. Aktivní teprve po schválené petition 'columbarium'
// (GameState.flags.porta_active === true). Před tím tab v navigaci neexistuje.
// Fronta nepřečtených dopisů + archiv přečtených (per destination: tidings/scrinium).
// ═══════════════════════════════════════════════════════════════════════════

const PortaSystem = {

    _ensureState: function () {
        if (!GameState.letters) {
            GameState.letters = { readIds: {}, archive: [] };
        }
        if (!GameState.letters.readIds) GameState.letters.readIds = {};
        if (!GameState.letters.archive) GameState.letters.archive = [];
        if (!GameState.letters.firstSeen) GameState.letters.firstSeen = {};
        // CHRONICON Vrstva 3 — dynamické dopisy přijaté ze snapshotu
        // (porta_letters). Trvalý store, roste jako LettersDB, nemaže se.
        if (!GameState.letters.dynamic) GameState.letters.dynamic = [];
        // Odchozí korespondence — dopisy na cestě (holub letí), viz sendLetter/_resolveOutgoing.
        if (!GameState.letters.outgoing) GameState.letters.outgoing = [];
        return GameState.letters;
    },

    // Odchozí korespondence — pošle dopis, spotřebuje holuba + zásoby, zařadí do fronty "na cestě".
    sendLetter: function (contactId, topicId) {
        this._ensureState();
        const contact = (typeof OutgoingLettersDB !== 'undefined') ? OutgoingLettersDB.find(function (c) { return c.id === contactId; }) : null;
        const topic = contact && contact.topics.find(function (tp) { return tp.id === topicId; });
        if (!topic) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Holubnik-mrd (27.7.2026): jen VYCVIČENÍ holubi lítají pro Portu —
        // nevycvičení množí/dávají vejce a maso, ale nelítají.
        const pigeonsAvailable = (GameState.columbarium && GameState.columbarium.trainedCount) || 0;
        const paper = GameState.inventory['paper'] || 0;
        const ink = GameState.inventory['ink'] || 0;
        const cost = topic.cost || {};
        if (pigeonsAvailable < (cost.pigeon || 0) || paper < (cost.paper || 0) || ink < (cost.ink || 0)) {
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.panel('🕊️ ' + (lang === 'en' ? 'Not enough trained pigeons or supplies.' : 'Nemáš dost vycvičených holubů nebo zásob.'), 'porta');
            }
            return;
        }

        // Odletěný holub mizí z hejna úplně — snižuje se count i trainedCount stejně.
        if (cost.pigeon) {
            GameState.columbarium.count -= cost.pigeon;
            GameState.columbarium.trainedCount -= cost.pigeon;
        }
        if (cost.paper) GameState.inventory['paper'] -= cost.paper;
        if (cost.ink) GameState.inventory['ink'] -= cost.ink;

        const now = Date.now();
        const lost = Math.random() < (topic.riskLoss || 0);
        const travelHours = typeof topic.travelHours === 'function' ? topic.travelHours() : (topic.travelHours || 24);
        GameState.letters.outgoing.push({
            contactId: contactId, topicId: topicId,
            sentAt: now, arrivesAt: now + travelHours * 3600000,
            lost: lost
        });

        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.panel('🕊️ ' + (lang === 'en' ? 'Pigeon sent.' : 'Holub vypuštěn.'), 'porta');
        }
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this.render();
    },

    // Lazy vyřešení dopisů "na cestě", jejichž čas doručení uplynul — voláno na začátku render().
    // Odpověď se vloží přímo do dynamic poolu a firstSeen se rovnou nastaví, aby obešla drip
    // cooldown (je to přímá reakce na hráčovu akci, ne náhodně objevený dopis).
    _resolveOutgoing: function () {
        this._ensureState();
        if (typeof OutgoingLettersDB === 'undefined') return;
        const now = Date.now();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const stillPending = [];
        let changed = false;

        GameState.letters.outgoing.forEach(function (entry) {
            if (entry.arrivesAt > now) { stillPending.push(entry); return; }
            changed = true;
            const contact = OutgoingLettersDB.find(function (c) { return c.id === entry.contactId; });
            const topic = contact && contact.topics.find(function (tp) { return tp.id === entry.topicId; });
            if (!topic) return;

            if (entry.lost) {
                const lostTitle = (lang === 'en' ? 'Pigeon lost — no reply from ' : 'Holub se ztratil — bez odpovědi od ') + (lang === 'en' ? contact.name_en : contact.name_cs);
                GameState.letters.archive.push({ id: 'lost_' + entry.topicId + '_' + entry.sentAt, title: lostTitle, ts: now, seal: contact.seal });
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.panel('🕊️💔 ' + (lang === 'en' ? 'A pigeon never returned.' : 'Holub se nevrátil.'), 'porta');
                }
                return;
            }

            const replyId = 'reply_' + entry.topicId + '_' + entry.sentAt;
            const reply = topic.reply;
            GameState.letters.dynamic.push({
                id: replyId,
                sender_cs: contact.name_cs, sender_en: contact.name_en,
                seal: contact.seal,
                title_cs: reply.title_cs, title_en: reply.title_en,
                text_cs: reply.text_cs, text_en: reply.text_en,
                choices: [{
                    label_cs: '📜 Vzít na vědomí', label_en: '📜 Take note',
                    effect: reply.effect || function () {},
                    notify_cs: reply.notify_cs || '', notify_en: reply.notify_en || ''
                }]
            });
            GameState.letters.firstSeen[replyId] = now;
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.panel('🕊️ ' + (lang === 'en' ? 'A reply has arrived' : 'Dorazila odpověď'), 'porta');
            }
        });

        GameState.letters.outgoing = stillPending;
        if (changed && typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // Malý stavový řádek holubníku — počet/kapacita + odvozená nálada (žádný nový ukládaný stav).
    _dovecoteStatusHtml: function () {
        if (typeof FarmyardSystem === 'undefined' || !GameState.columbarium) return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const count = GameState.columbarium.count || 0;
        const trained = GameState.columbarium.trainedCount || 0;
        const capacity = FarmyardSystem.columbariumCapacity ? FarmyardSystem.columbariumCapacity() : 20;
        const now = Date.now();
        const recentPredator = GameState.columbarium.lastPredatorTick && (now - GameState.columbarium.lastPredatorTick) < 3 * 24 * 3600000;
        const uneasy = recentPredator || !!GameState.columbarium.nesting;
        const moodLabel = uneasy ? (lang === 'en' ? 'Uneasy' : 'Neklidný') : (lang === 'en' ? 'Calm' : 'Klidný');
        return `<div style="display:flex; align-items:center; gap:10px; padding:8px 12px; margin-bottom:12px; background:rgba(0,0,0,0.03); border-radius:8px; font-size:0.78rem; opacity:0.85;">
            <span>🐦 ${count}/${capacity} <span style="opacity:0.6;">(${lang === 'en' ? 'trained' : 'vycvičeno'} ${trained})</span></span>
            <span style="opacity:0.4;">·</span>
            <span>${uneasy ? '😟' : '😊'} ${moodLabel}</span>
        </div>`;
    },

    // Psací stůl — výběr kontaktu + tématu, odešle dopis.
    _composeHtml: function () {
        if (typeof OutgoingLettersDB === 'undefined') return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const pigeonsAvailable = (GameState.columbarium && GameState.columbarium.trainedCount) || 0;
        const paper = GameState.inventory['paper'] || 0;
        const ink = GameState.inventory['ink'] || 0;

        let h = `<div style="margin-top:18px;">`;
        h += `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; margin-bottom:8px;">${lang === 'en' ? 'Write a letter' : 'Napsat dopis'}</div>`;
        OutgoingLettersDB.forEach(function (contact) {
            h += `<div style="margin-bottom:10px; padding:8px 10px; background:rgba(0,0,0,0.03); border-radius:8px;">
                <div style="font-size:0.82rem; font-weight:bold; margin-bottom:6px;">${contact.icon} ${lang === 'en' ? contact.name_en : contact.name_cs}</div>`;
            contact.topics.forEach(function (topic) {
                if (topic.hideIf && topic.hideIf()) return;
                const label = lang === 'en' ? topic.label_en : topic.label_cs;
                const cost = topic.cost || {};
                const canAfford = pigeonsAvailable >= (cost.pigeon || 0) && paper >= (cost.paper || 0) && ink >= (cost.ink || 0);
                h += `<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:5px 0; font-size:0.76rem;">
                    <span style="opacity:0.85;">${label}</span>
                    <button class="craft-btn" style="font-size:0.68rem; padding:3px 8px; flex-shrink:0;" onclick="PortaSystem.sendLetter('${contact.id}','${topic.id}')" ${canAfford ? '' : 'disabled'}>🕊️${cost.pigeon || 0} · 📄${cost.paper || 0} · 🖋️${cost.ink || 0}</button>
                </div>`;
            });
            h += `</div>`;
        });
        h += `</div>`;
        return h;
    },

    // "V doručování" — dopisy na cestě, s odpočtem.
    _outgoingHtml: function () {
        this._ensureState();
        const pending = GameState.letters.outgoing;
        if (!pending.length || typeof OutgoingLettersDB === 'undefined') return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const now = Date.now();
        let h = `<div style="margin-top:16px;">`;
        h += `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; margin-bottom:8px;">${lang === 'en' ? 'In transit' : 'V doručování'}</div>`;
        pending.forEach(function (entry) {
            const contact = OutgoingLettersDB.find(function (c) { return c.id === entry.contactId; });
            const topic = contact && contact.topics.find(function (tp) { return tp.id === entry.topicId; });
            if (!contact || !topic) return;
            const hoursLeft = Math.max(0, Math.ceil((entry.arrivesAt - now) / 3600000));
            h += `<div style="display:flex; align-items:center; gap:8px; padding:5px 0; font-size:0.76rem; opacity:0.7;">
                <span>🕊️</span>
                <span>${contact.icon} ${lang === 'en' ? contact.name_en : contact.name_cs} — ${lang === 'en' ? topic.label_en : topic.label_cs}</span>
                <span style="opacity:0.6; margin-left:auto;">${lang === 'en' ? hoursLeft + 'h left' : 'zbývá ' + hoursLeft + 'h'}</span>
            </div>`;
        });
        h += `</div>`;
        return h;
    },

    // Najde dopis buď ve statickém LettersDB, nebo v dynamickém CHRONICON poolu.
    _findLetter: function (letterId) {
        if (typeof LettersDB !== 'undefined') {
            const s = LettersDB.find(l => l.id === letterId);
            if (s) return s;
        }
        this._ensureState();
        return GameState.letters.dynamic.find(l => l.id === letterId) || null;
    },

    // Deklarativní efekty z CHRONICON dopisů (Vrstva 3) — data, ne kód.
    // Neznámý/chybný typ efektu se potichu přeskočí, nesmí shodit resolveLetter.
    _applyEffects: function (effects) {
        (effects || []).forEach(function (e) {
            try {
                if (!e || !e.type) return;
                if (e.type === 'influence' && e.axis) {
                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) {
                        PersonaSystem.addInfluence(e.axis, e.amount || 0);
                    }
                } else if (e.type === 'item' && e.id) {
                    const qty = e.qty || 0;
                    if (qty >= 0) {
                        if (typeof Game !== 'undefined' && Game.addItem) Game.addItem(e.id, qty);
                    } else {
                        if (typeof Game !== 'undefined' && Game.removeItem) Game.removeItem(e.id, Math.abs(qty));
                    }
                } else if (e.type === 'grose') {
                    if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                        CellariumSystem.addGrose(e.amount || 0);
                    }
                } else if (e.type === 'contactRelation' && e.id) {
                    if (typeof SaeculumSystem !== 'undefined' && SaeculumSystem.addContactRelation) {
                        SaeculumSystem.addContactRelation(e.id, e.amount || 0);
                    }
                } else if (e.type === 'flag' && e.name) {
                    if (!GameState.flags) GameState.flags = {};
                    GameState.flags[e.name] = (e.value !== undefined) ? e.value : true;
                }
            } catch (err) { /* jeden vadný efekt nesmí shodit zbytek */ }
        });
    },

    // Inline dvojjazyčné texty (vzor Chronicon text_cs/text_en) s fallbackem na i18n klíče
    _title: function (l) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        return (lang === 'en' ? (l.title_en || l.title_cs) : l.title_cs) || t(l.titleKey);
    },
    _text: function (l) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        return (lang === 'en' ? (l.text_en || l.text_cs) : l.text_cs) || t(l.textKey);
    },
    _label: function (c) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        return (lang === 'en' ? (c.label_en || c.label_cs) : c.label_cs) || t(c.labelKey);
    },
    _sender: function (l) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        return (lang === 'en' ? l.sender_en : l.sender_cs) || l.sender_cs || '';
    },
    // MRD Porta-katalogizace — datum ve hře, offset na rok 1465 (nikdy skutečný rok)
    _dateStr: function (ts) {
        if (!ts) return '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const d = new Date(ts);
        const gameDate = new Date(1465, d.getMonth(), d.getDate());
        return gameDate.toLocaleDateString(lang === 'en' ? 'en-GB' : 'cs-CZ');
    },

    // Fronta — dopisy z LettersDB (trigger() platí) + dynamické CHRONICON
    // dopisy (Vrstva 3 — Chronicon už podmínku vyhodnotil při výběru, takže
    // mají syntetický trigger()=>true), obojí ještě nepřečtené.
    //
    // DRIP (25.7.2026): dopis, co ještě nikdy nebyl ve frontě (firstSeen na
    // něj nesahal), se pustí max 1 za DRIP_COOLDOWN_MS reálného času — jako
    // by holub nosil jedno psaní za dva dny. Bez tohohle by hráč se spoustou
    // splněných podmínek najednou (starý save, rychlý postup) dostal
    // desítky dopisů v jednu chvíli. Jednou vypuštěný dopis touhle brzdou
    // dál neprochází — čte se kdykoliv, žádná další podmínka.
    getQueue: function () {
        this._ensureState();
        if (typeof LettersDB === 'undefined') return [];
        const now = Date.now();
        let changed = false;
        const DRIP_COOLDOWN_MS = 48 * 60 * 60 * 1000; // ob dva dny
        const dynPool = GameState.letters.dynamic.map(d => Object.assign({}, d, { trigger: function () { return true; } }));
        const pool = LettersDB.concat(dynPool);

        const eligible = pool.filter(letter => {
            if (GameState.letters.readIds[letter.id]) return false;
            try { return letter.trigger(); } catch (e) { return false; }
        });

        if (!GameState.letters.lastDripAt) GameState.letters.lastDripAt = 0;
        const canDripNow = (now - GameState.letters.lastDripAt) >= DRIP_COOLDOWN_MS;
        let dripUsed = false;

        const queue = eligible.filter(letter => {
            const alreadyReleased = !!GameState.letters.firstSeen[letter.id];
            if (!alreadyReleased) {
                if (!canDripNow || dripUsed) return false; // čeká na svou řadu
                dripUsed = true;
                GameState.letters.lastDripAt = now;
                GameState.letters.firstSeen[letter.id] = now;
                changed = true;
                if (typeof NotificationSystem !== 'undefined') {
                    const _plang = (GameState.settings && GameState.settings.language) || 'cs';
                    NotificationSystem.panel('🕊️ ' + (_plang === 'en' ? 'New letter in Porta' : 'Nový dopis v Portě'), 'porta');
                }
            }
            // Phase 1: expiry — prošlé dopisy mizí (archiv: nezodpovězeno)
            if (letter.expiry_days) {
                const deadline = GameState.letters.firstSeen[letter.id] + letter.expiry_days * 24 * 60 * 60 * 1000;
                if (now > deadline) {
                    GameState.letters.readIds[letter.id] = true;
                    const lang = (GameState.settings && GameState.settings.language) || 'cs';
                    GameState.letters.archive.push({ id: letter.id, title: this._title(letter) + (lang==='en' ? ' (unanswered)' : ' (nezodpovězeno)'), ts: now });
                    if (typeof letter.onExpire === 'function') { try { letter.onExpire(); } catch (e) {} }
                    changed = true;
                    return false;
                }
            }
            return true;
        });
        if (changed && typeof Game !== 'undefined') Game.save();
        return queue;
    },

    _sealIcon: function (seal) {
        return seal === 'abbot' ? '✝️' : seal === 'village' ? '🌾' : seal === 'scholars' ? '📚' : seal === 'noble' ? '🛡️' : seal === 'church' ? '⛪' : '🕊️';
    },

    // Archiv — filtr podle pečeti + řazení, uloženo v GameState.ui (přežije reload).
    setArchiveFilter: function (seal) {
        if (!GameState.ui) GameState.ui = {};
        GameState.ui.portaArchiveFilter = seal;
        this.render();
    },
    toggleArchiveSort: function () {
        if (!GameState.ui) GameState.ui = {};
        GameState.ui.portaArchiveSort = (GameState.ui.portaArchiveSort === 'asc') ? 'desc' : 'asc';
        this.render();
    },

    render: function () {
        const el = document.getElementById('lore-porta-content');
        if (!el) return;

        if (!(GameState.flags && GameState.flags.porta_active)) {
            el.innerHTML = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold); text-align:center; opacity:0.7;">
                <div style="font-size:2rem; margin-bottom:8px;">🕊️</div>
                <div style="font-size:0.85rem; font-style:italic;">${t('porta.locked')}</div>
            </div>`;
            return;
        }

        this._ensureState();
        this._resolveOutgoing();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const queue = this.getQueue();

        let h = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        h += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🕊️ ${t('porta.title')}</h3>`;
        h += `<p style="font-size:0.82rem; opacity:0.7; margin-bottom:14px;">${t('porta.intro')}</p>`;
        h += this._dovecoteStatusHtml();

        if (queue.length === 0) {
            h += `<div style="font-size:0.82rem; opacity:0.6; font-style:italic;">${t('porta.empty')}</div>`;
        } else {
            h += `<div style="display:flex; flex-direction:column; gap:8px;">`;
            queue.forEach(letter => {
                const sealIcon = PortaSystem._sealIcon(letter.seal);
                const urgentBadge = letter.urgent ? ' <span style="color:#c0392b; font-weight:bold;">⚡</span>' : '';
                const border = letter.urgent ? 'border-left:3px solid #c0392b;' : '';
                const sender = PortaSystem._sender(letter);
                const received = PortaSystem._dateStr(GameState.letters.firstSeen[letter.id]);
                h += `<div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:rgba(0,0,0,0.04); border-radius:8px; ${border}">
                    <div>
                        <div>${sealIcon} <strong>${PortaSystem._title(letter)}</strong>${urgentBadge}</div>
                        <div style="font-size:0.7rem; opacity:0.55; margin-top:2px;">
                            ${sender ? (lang==='en' ? `From ${sender}` : `Od: ${sender}`) : ''}${sender && received ? ' · ' : ''}${received ? (lang==='en' ? `Received ${received}` : `Přijato ${received}`) : ''}
                        </div>
                    </div>
                    <button class="craft-btn" style="font-size:0.78rem;" onclick="PortaSystem.openLetter('${letter.id}')">${t('porta.open')}</button>
                </div>`;
            });
            h += `</div>`;
        }

        h += this._outgoingHtml();
        h += this._composeHtml();

        // Archiv — filtr podle pečeti + řazení, klikatelný pro zpětné přečtení plného textu
        if (!GameState.ui) GameState.ui = {};
        const archFilter = GameState.ui.portaArchiveFilter || 'all';
        const archSort = GameState.ui.portaArchiveSort || 'desc';
        const sealLookup = function (entry) {
            if (entry.seal) return entry.seal;
            const src = PortaSystem._findLetter(entry.id);
            return src ? src.seal : null;
        };
        let filteredArchive = GameState.letters.archive.filter(function (entry) {
            return archFilter === 'all' || sealLookup(entry) === archFilter;
        });
        filteredArchive = filteredArchive.slice(-30); // cap: 30 nejnovějších (podle skutečného pořadí archivace)
        if (archSort === 'desc') filteredArchive = filteredArchive.slice().reverse();

        if (GameState.letters.archive.length > 0) {
            const sealChips = [
                { key: 'all', icon: '📜', label_cs: 'Vše', label_en: 'All' },
                { key: 'abbot', icon: '✝️', label_cs: 'Opat', label_en: 'Abbot' },
                { key: 'church', icon: '⛪', label_cs: 'Církev', label_en: 'Church' },
                { key: 'noble', icon: '🛡️', label_cs: 'Šlechta', label_en: 'Nobles' },
                { key: 'scholars', icon: '📚', label_cs: 'Učenci', label_en: 'Scholars' },
                { key: 'village', icon: '🌾', label_cs: 'Ves', label_en: 'Village' }
            ];
            h += `<div style="margin-top:18px;">`;
            h += `<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; margin-bottom:8px;">`;
            h += `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55;">${t('porta.archive')}</div>`;
            h += `<button class="filter-btn" style="font-size:0.68rem; padding:2px 8px;" onclick="PortaSystem.toggleArchiveSort()">${archSort === 'desc' ? (lang === 'en' ? '↓ Newest' : '↓ Nejnovější') : (lang === 'en' ? '↑ Oldest' : '↑ Nejstarší')}</button>`;
            h += `</div>`;
            h += `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px;">`;
            sealChips.forEach(function (chip) {
                const active = archFilter === chip.key;
                h += `<button class="filter-btn${active ? ' active' : ''}" style="font-size:0.68rem; padding:2px 8px;" onclick="PortaSystem.setArchiveFilter('${chip.key}')">${chip.icon} ${lang === 'en' ? chip.label_en : chip.label_cs}</button>`;
            });
            h += `</div>`;

            if (filteredArchive.length === 0) {
                h += `<div style="font-size:0.76rem; opacity:0.5; font-style:italic;">${lang === 'en' ? 'Nothing under this seal yet.' : 'Pod touto pečetí zatím nic.'}</div>`;
            }
            filteredArchive.forEach(entry => {
                const srcLetter = PortaSystem._findLetter(entry.id);
                const sender = srcLetter ? PortaSystem._sender(srcLetter) : '';
                const resolved = PortaSystem._dateStr(entry.ts);
                const chipIcon = PortaSystem._sealIcon(sealLookup(entry));
                h += `<div style="padding:4px 0; cursor:pointer;" onclick="PortaSystem.openArchivedLetter('${entry.id}')" title="${lang==='en' ? 'Click to re-read' : 'Klikni pro znovupřečtení'}">
                    <div style="font-size:0.78rem; opacity:0.7;">${chipIcon} ${entry.title}</div>
                    <div style="font-size:0.66rem; opacity:0.45; margin-top:1px;">
                        ${sender ? (lang==='en' ? `From ${sender}` : `Od: ${sender}`) : ''}${sender && resolved ? ' · ' : ''}${resolved ? (lang==='en' ? `Resolved ${resolved}` : `Vyřízeno ${resolved}`) : ''}
                    </div>
                </div>`;
            });
            h += `</div>`;
        }

        h += `</div>`;
        el.innerHTML = h;
    },

    // Znovu otevřít archivovaný dopis — jen ke čtení, bez voleb (rozhodnutí už padlo)
    openArchivedLetter: function (letterId) {
        if (typeof LettersDB === 'undefined' || typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;
        const letter = PortaSystem._findLetter(letterId);
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!letter) {
            if (typeof UI !== 'undefined') UI.notify(lang === 'en' ? 'This letter is no longer available.' : 'Tenhle dopis už není dostupný.', true);
            return;
        }
        NotificationSystem.modal({
            icon: letter.seal === 'abbot' ? '✝️' : letter.seal === 'village' ? '🌾' : letter.seal === 'scholars' ? '📚' : letter.seal === 'noble' ? '🛡️' : '🕊️',
            image: letter.image || null,
            title: PortaSystem._title(letter),
            text: PortaSystem._letterDateline(letter) + PortaSystem._text(letter) + `<div style="margin-top:12px; font-size:0.72rem; opacity:0.5; font-style:italic;">${lang==='en' ? '— already resolved —' : '— již vyřízeno —'}</div>`,
            choices: [{ label: lang === 'en' ? 'Close' : 'Zavřít', type: 'primary', effect: () => {} }]
        });
    },

    // Katalogizační hlavička dopisu — odesílatel + datum přijetí, nad text jako skutečná dopisní hlavička
    _letterDateline: function (letter) {
        this._ensureState();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const sender = this._sender(letter);
        const received = this._dateStr(GameState.letters.firstSeen[letter.id]);
        if (!sender && !received) return '';
        return `<div style="font-size:0.74rem; opacity:0.6; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid rgba(0,0,0,0.1);">
            ${sender ? `<div>${lang==='en' ? 'From' : 'Od'}: <strong>${sender}</strong></div>` : ''}
            ${received ? `<div>${lang==='en' ? 'Received' : 'Přijato'}: ${received}</div>` : ''}
        </div>`;
    },

    openLetter: function (letterId) {
        if (typeof LettersDB === 'undefined' || typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;
        const letter = PortaSystem._findLetter(letterId);
        if (!letter) return;

        const choices = (letter.choices || []).map(choice => {
            const afford = (typeof choice.canAfford === 'function') ? choice.canAfford() : true;
            return {
                label: afford ? PortaSystem._label(choice) : `<span style="opacity:0.5;">${PortaSystem._label(choice)}</span>`,
                type: 'default',
                effect: () => {
                    if (!afford) {
                        if (typeof UI !== 'undefined') UI.notify(t('porta.cannotAfford'), true);
                        return;
                    }
                    PortaSystem._resolveLetter(letter, choice);
                    PortaSystem.render();
                }
            };
        });

        NotificationSystem.modal({
            icon: letter.seal === 'abbot' ? '✝️' : letter.seal === 'village' ? '🌾' : letter.seal === 'scholars' ? '📚' : letter.seal === 'noble' ? '🛡️' : '🕊️',
            image: letter.image || null,
            title: PortaSystem._title(letter),
            text: PortaSystem._letterDateline(letter) + PortaSystem._text(letter),
            choices: choices
        });
    },

    _resolveLetter: function (letter, choice) {
        this._ensureState();
        // Statické dopisy (LettersDB) mají choice.effect jako funkci.
        // Dynamické CHRONICON dopisy (Vrstva 3) mají choice.effects jako
        // deklarativní pole — viz PortaSystem._applyEffects.
        if (typeof choice.effect === 'function') {
            choice.effect();
        } else if (Array.isArray(choice.effects)) {
            this._applyEffects(choice.effects);
        }

        GameState.letters.readIds[letter.id] = true;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const titleTxt = this._title(letter);
        GameState.letters.archive.push({ id: letter.id, title: titleTxt, ts: Date.now() });

        const notifyTxt = (lang === 'en' ? (choice.notify_en || choice.notify_cs) : choice.notify_cs) || (choice.notifyKey ? t(choice.notifyKey) : null);
        if (notifyTxt) {
            UI.notifyPanel('🕊️ ' + notifyTxt, 'system');
        }
        if (typeof Game !== 'undefined' && typeof Game.addKronikaEntry === 'function') {
            const kTxt = notifyTxt || titleTxt;
            Game.addKronikaEntry('important', '🕊️ ' + kTxt, '🕊️ ' + kTxt, '');
        }

        if (typeof Game !== 'undefined') Game.save();
    },

};