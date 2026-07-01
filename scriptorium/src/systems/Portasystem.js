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
        const el = document.getElementById('home-porta-content');
        if (!el) return;
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
        if (typeof LettersDB === 'undefined') return;
        const letter = LettersDB.find(l => l.id === letterId);
        if (!letter) return;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #f5f5dc; border: 3px solid #8b4513; border-radius: 10px;
            padding: 20px; max-width: 500px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;

        let html = `<h3 style="margin-top:0;">${t(letter.titleKey)}</h3>`;
        html += `<p style="white-space: pre-wrap;">${t(letter.textKey)}</p>`;
        html += `<div style="margin-top:20px;">`;

        letter.choices.forEach((choice, idx) => {
            const afford = (typeof choice.canAfford === 'function') ? choice.canAfford() : true;
            html += `<button class="game-btn" style="display:block; width:100%; margin-bottom:10px; text-align:left;" data-choice="${idx}" ${afford ? '' : 'disabled'}>
                ${t(choice.labelKey)}
            </button>`;
        });

        html += `</div>`;
        modal.innerHTML = html;

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999;`;

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        modal.querySelectorAll('button:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIdx = parseInt(e.currentTarget.dataset.choice);
                const choice = letter.choices[choiceIdx];
                PortaSystem._resolveLetter(letter, choice);
                modal.remove();
                if (backdrop && backdrop.parentElement) backdrop.remove();
                PortaSystem.render();
            });
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