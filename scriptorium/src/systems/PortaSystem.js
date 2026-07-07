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
        return GameState.letters;
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

    // Fronta — dopisy z LettersDB, jejichž trigger() platí a ještě nebyly přečteny
    getQueue: function () {
        this._ensureState();
        if (typeof LettersDB === 'undefined') return [];
        const now = Date.now();
        let changed = false;
        const queue = LettersDB.filter(letter => {
            if (GameState.letters.readIds[letter.id]) return false;
            let active = false;
            try { active = letter.trigger(); } catch (e) { return false; }
            if (!active) return false;
            // Phase 1: firstSeen — od prvního objevení ve frontě
            if (!GameState.letters.firstSeen[letter.id]) {
                GameState.letters.firstSeen[letter.id] = now;
                changed = true;
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
                const sealIcon = letter.seal === 'abbot' ? '✝️' : letter.seal === 'village' ? '🌾' : '🕊️';
                const urgentBadge = letter.urgent ? ' <span style="color:#c0392b; font-weight:bold;">⚡</span>' : '';
                const border = letter.urgent ? 'border-left:3px solid #c0392b;' : '';
                h += `<div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:rgba(0,0,0,0.04); border-radius:8px; ${border}">
                    <span>${sealIcon} <strong>${PortaSystem._title(letter)}</strong>${urgentBadge}</span>
                    <button class="craft-btn" style="font-size:0.78rem;" onclick="PortaSystem.openLetter('${letter.id}')">${t('porta.open')}</button>
                </div>`;
            });
            h += `</div>`;
        }

        // Archiv — krátký přehled posledních přečtených
        const archived = GameState.letters.archive.slice(-10).reverse();
        if (archived.length > 0) {
            h += `<div style="margin-top:18px;">`;
            h += `<div style="font-size:0.72rem; font-weight:bold; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; margin-bottom:8px;">${t('porta.archive')}</div>`;
            archived.forEach(entry => {
                h += `<div style="font-size:0.78rem; opacity:0.65; padding:4px 0;">📜 ${entry.title}</div>`;
            });
            h += `</div>`;
        }

        h += `</div>`;
        el.innerHTML = h;
    },

    openLetter: function (letterId) {
        if (typeof LettersDB === 'undefined' || typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;
        const letter = LettersDB.find(l => l.id === letterId);
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
            icon: letter.seal === 'abbot' ? '✝️' : letter.seal === 'village' ? '🌾' : '🕊️',
            image: letter.image || null,
            title: PortaSystem._title(letter),
            text: PortaSystem._text(letter),
            choices: choices
        });
    },

    _resolveLetter: function (letter, choice) {
        this._ensureState();
        choice.effect();

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