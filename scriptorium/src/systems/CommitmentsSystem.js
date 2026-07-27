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
                return { letter: l, commitment: c, deadline, daysLeft: deadline ? Math.ceil((deadline - now) / 86400000) : null };
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

    render: function () {
        const el = document.getElementById('lore-commitments-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Krok 3c (farnost-chronicon-reference.md sekce 5.3): gate posunut
        // z "celý tab" na "jen LettersDB položky" — Chronicon zakázky
        // (sepultura/material/farni) se zobrazí i bez aktivní Porty.
        const portaActive = !!(GameState.flags && GameState.flags.porta_active);
        const chronicleCommitments = this._getChronicleCommitments();
        const letterCommitments = portaActive ? this._getActiveCommitments() : [];
        const active = letterCommitments.concat(chronicleCommitments);

        if (!portaActive && chronicleCommitments.length === 0) {
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
            h += `<div style="display:flex; flex-direction:column; gap:10px;">`;
            active.forEach(item => {
                h += (item.source === 'letter') ? this._renderLetterCard(item, lang) : this._renderChronicleCard(item, lang);
            });
            h += `</div>`;
        }

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
        if (item.requiredItems.length) {
            const parts = item.requiredItems.map(req => {
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
            ? (item.kind === 'sepultura' ? '⚱️ Grant the right' : item.kind === 'material' ? '📦 We shall help' : '✝️ Officiate')
            : (item.kind === 'sepultura' ? '⚱️ Udělit právo' : item.kind === 'material' ? '📦 Pomůžeme' : '✝️ Vykonat obřad');
        const declineLabel = lang === 'en' ? '🚪 Decline' : '🚪 Odmítnout';

        let extraLine = '';
        if (item.kind === 'material' && item.rewardGrose) {
            extraLine = `<span>💰 ${item.rewardGrose} ${lang==='en'?'groschen':'grošů'}</span>` + (item.deadlineDays ? `<span>⏳ ${item.deadlineDays} ${lang==='en'?'days':'dní'}</span>` : '');
        } else if (item.kind === 'sepultura' && item.wealth) {
            extraLine = `<span>💰 ~${Math.round(item.wealth * 1.2)} ${lang==='en'?'groschen':'grošů'}</span>`;
        }

        return `<div style="padding:12px; background:rgba(0,0,0,0.04); border-radius:8px;">
            <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">${item.icon} ${item.title}</div>
            <div style="font-size:0.82rem; opacity:0.85; margin-bottom:6px;">${item.text}</div>
            ${itemsLine}
            ${extraLine ? `<div style="display:flex; flex-wrap:wrap; gap:12px; font-size:0.76rem; opacity:0.75; margin-bottom:6px;">${extraLine}</div>` : ''}
            <div style="display:flex; gap:8px; margin-top:4px;">
                <button class="craft-btn" style="font-size:0.76rem;" ${enough ? '' : 'disabled'}
                    onclick="CommitmentsSystem.resolveChronicle('${item.id}', 'accept')">${acceptLabel}</button>
                <button class="craft-btn" style="font-size:0.76rem; opacity:0.7;"
                    onclick="CommitmentsSystem.resolveChronicle('${item.id}', 'decline')">${declineLabel}</button>
            </div>
        </div>`;
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
            } else if (item.kind === 'material') {
                if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(item.rewardGrose || 0);
                if (typeof Game !== 'undefined' && Game.addKronikaEntry) Game.addKronikaEntry('minor',
                    '📦 Zakázka odevzdána — ' + (item.rewardGrose||0) + ' grošů.',
                    '📦 Commission delivered — ' + (item.rewardGrose||0) + ' groschen.',
                    '📦 Opus traditum est.');
                if (typeof UI !== 'undefined') UI.notify('📦 ' + (lang==='en' ? 'Delivered.' : 'Odbaveno.'));
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
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            this.render();
        }
    },

};