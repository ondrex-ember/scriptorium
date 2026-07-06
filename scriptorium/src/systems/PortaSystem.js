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
        return GameState.letters;
    },

    // Fronta — dopisy z LettersDB, jejichž trigger() platí a ještě nebyly přečteny
    getQueue: function () {
        this._ensureState();
        if (typeof LettersDB === 'undefined') return [];
        return LettersDB.filter(letter => {
            if (GameState.letters.readIds[letter.id]) return false;
            try { return letter.trigger(); } catch (e) { return false; }
        });
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
                h += `<div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:rgba(0,0,0,0.04); border-radius:8px;">
                    <span>${sealIcon} <strong>${t(letter.titleKey)}</strong></span>
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
                label: afford ? t(choice.labelKey) : `<span style="opacity:0.5;">${t(choice.labelKey)}</span>`,
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
            title: t(letter.titleKey),
            text: t(letter.textKey),
            choices: choices
        });
    },

    _resolveLetter: function (letter, choice) {
        this._ensureState();
        choice.effect();

        GameState.letters.readIds[letter.id] = true;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const titleTxt = t(letter.titleKey);
        GameState.letters.archive.push({ id: letter.id, title: titleTxt, ts: Date.now() });

        if (choice.notifyKey) {
            UI.notifyPanel('🕊️ ' + t(choice.notifyKey), 'system');
        }
        if (typeof Game !== 'undefined' && typeof Game.addKronikaEntry === 'function') {
            Game.addKronikaEntry('important', t(choice.notifyKey || letter.titleKey), t(choice.notifyKey || letter.titleKey), '');
        }

        if (typeof Game !== 'undefined') Game.save();
    },

};