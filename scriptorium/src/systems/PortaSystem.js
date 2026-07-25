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
        return GameState.letters;
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
    getQueue: function () {
        this._ensureState();
        if (typeof LettersDB === 'undefined') return [];
        const now = Date.now();
        let changed = false;
        const dynPool = GameState.letters.dynamic.map(d => Object.assign({}, d, { trigger: function () { return true; } }));
        const pool = LettersDB.concat(dynPool);
        const queue = pool.filter(letter => {
            if (GameState.letters.readIds[letter.id]) return false;
            let active = false;
            try { active = letter.trigger(); } catch (e) { return false; }
            if (!active) return false;
            // Phase 1: firstSeen — od prvního objevení ve frontě
            if (!GameState.letters.firstSeen[letter.id]) {
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
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const queue = this.getQueue();

        let h = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        h += `<h3 style="margin:0 0 12px 0; font-size:1rem;">🕊️ ${t('porta.title')}</h3>`;
        h += `<p style="font-size:0.82rem; opacity:0.7; margin-bottom:14px;">${t('porta.intro')}</p>`;

        if (queue.length === 0) {
            h += `<div style="font-size:0.82rem; opacity:0.6; font-style:italic;">${t('porta.empty')}</div>`;
        } else {
            h += `<div style="display:flex; flex-direction:column; gap:8px;">`;
            queue.forEach(letter => {
                const sealIcon = letter.seal === 'abbot' ? '✝️' : letter.seal === 'village' ? '🌾' : letter.seal === 'scholars' ? '📚' : letter.seal === 'noble' ? '🛡️' : '🕊️';
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

        // Archiv — přehled přečtených, klikatelný pro zpětné přečtení plného textu
        const archived = GameState.letters.archive.slice(-30).reverse();
        if (archived.length > 0) {
            h += `<div style="margin-top:18px;">`;
            h += `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; margin-bottom:8px;">${t('porta.archive')}</div>`;
            archived.forEach(entry => {
                const srcLetter = PortaSystem._findLetter(entry.id);
                const sender = srcLetter ? PortaSystem._sender(srcLetter) : '';
                const resolved = PortaSystem._dateStr(entry.ts);
                h += `<div style="padding:4px 0; cursor:pointer;" onclick="PortaSystem.openArchivedLetter('${entry.id}')" title="${lang==='en' ? 'Click to re-read' : 'Klikni pro znovupřečtení'}">
                    <div style="font-size:0.78rem; opacity:0.7;">📜 ${entry.title}</div>
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