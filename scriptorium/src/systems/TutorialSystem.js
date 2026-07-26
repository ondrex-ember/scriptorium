// ═══════════════════════════════════════════════════════════════════════════════
// TUTORIAL SYSTEM — Interaktivní průvodce prvním dnem v klášteře
// Obsahuje animované velké blikající šipky, zvýraznění prvků a plovoucí toast/banner.
// ═══════════════════════════════════════════════════════════════════════════════

const TutorialSystem = {

    STEPS: [
        {
            id: 'gather',
            title_cs: '1. Sběr surovin',
            title_en: '1. Resource Gathering',
            navTarget: '#nav-home',
            target: '#home-scavenge-content',
            text_cs: 'V Pracovně nasbírej dřevo a klestí. Klikni na akce sběru níže.',
            text_en: 'In the Workshop, gather wood and brushwood. Click the gathering actions below.',
            hint_cs: 'Tip: Přejdi do Pracovně 🏠 a klikni na Sběr dřeva.',
            hint_en: 'Tip: Go to the Workshop 🏠 and click Gather Wood.',
            isDone: function () {
                const inv = (typeof GameState !== 'undefined' && GameState.inventory) || {};
                return (inv['wood'] || 0) >= 3 || (inv['sticks'] || 0) >= 3;
            }
        },
        {
            id: 'knife',
            title_cs: '2. Výroba Kamenného nože',
            title_en: '2. Crafting a Stone Knife',
            navTarget: '#nav-craft',
            target: '#craft-filter-stone',
            text_cs: 'Otevři Výrobu a vyrob svojí první pomůcku — Kamenný nůž.',
            text_en: 'Open Crafting and craft your first tool — a Stone Knife.',
            hint_cs: 'Tip: Přejdi do záložky Výroba 🔨.',
            hint_en: 'Tip: Go to the Crafting tab 🔨.',
            isDone: function () {
                const inv = (typeof GameState !== 'undefined' && GameState.inventory) || {};
                return (inv['stone_knife'] || 0) >= 1 || (inv['bone_knife'] || 0) >= 1;
            }
        },
        {
            id: 'fat_hunt',
            title_cs: '3. Úlovek a Získání Tuku',
            title_en: '3. Hunting & Gathering Fat',
            navTarget: '#nav-home',
            target: '#home-scavenge-content',
            text_cs: 'V Pracovně ulov drobnou zvěř nebo nasbírej tuk z úlovku.',
            text_en: 'In the Workshop, hunt small game or gather fat from your catch.',
            hint_cs: 'Tip: Vrať se do Pracovny 🏠 a nastav oko nebo zpracuj zvěř.',
            hint_en: 'Tip: Return to Workshop 🏠 and set a snare or dress game.',
            isDone: function () {
                const inv = (typeof GameState !== 'undefined' && GameState.inventory) || {};
                return (inv['fat'] || 0) >= 1 || (inv['tallow'] || 0) >= 1;
            }
        },
        {
            id: 'candle_light',
            title_cs: '4. Výroba a Zapálení Svíčky / Louče',
            title_en: '4. Crafting & Lighting Candle / Torch',
            navTarget: '#nav-craft',
            target: '#btn-light-candle',
            text_cs: 'Vyrob svíčku nebo louč a rozsviť ji pro světlo při večerní práci.',
            text_en: 'Craft a candle or torch and light it for reading in the dark.',
            hint_cs: 'Tip: Ve Výrobě získáš svíčku/louč, pak ji rozsviť tlačítkem v záhlaví.',
            hint_en: 'Tip: Craft candle/torch in Crafting, then click light button in header.',
            isDone: function () {
                if (typeof GameState === 'undefined') return false;
                const flags = GameState.flags || {};
                const activeLight = GameState.activeLight || null;
                return !!(flags.candleLit || flags.torchLit || activeLight);
            }
        },
        {
            id: 'research',
            title_cs: '5. První Výzkum ve Scriptoriu',
            title_en: '5. First Research in Scriptorium',
            navTarget: '#nav-lore',
            target: '#lore-research-content',
            text_cs: 'Otevři Scriptorium a zahaj svůj první vědecký výzkum.',
            text_en: 'Open Scriptorium and initiate your first research.',
            hint_cs: 'Tip: Přejdi do Kláštera / Scriptoria 📜 a klikni na Výzkum.',
            hint_en: 'Tip: Go to Scriptorium 📜 and start research.',
            isDone: function () {
                if (typeof GameState === 'undefined') return false;
                return (GameState.researchedTechs || []).length >= 1 || (GameState.currentResearch !== null);
            }
        }
    ],

    POLL_MS: 1200,
    _pollHandle: null,

    init: function () {
        if (typeof GameState === 'undefined') return;
        if (!GameState.tutorial) {
            GameState.tutorial = { active: false, step: 0, completed: false };
        }
        if (GameState.tutorial.active && !GameState.tutorial.completed) {
            this._startPolling();
        }
    },

    startTutorialFromModal: function () {
        if (!GameState.tutorial) GameState.tutorial = { active: false, step: 0, completed: false };
        if (GameState.tutorial.completed) {
            GameState.tutorial.step = 0;
            GameState.tutorial.completed = false;
        }
        GameState.tutorial.active = true;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.closeAboutModal) UI.closeAboutModal();

        this._startPolling();
        this.render();

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const msg = lang === 'en' ? '🚀 Tutorial started! Follow the arrows.' : '🚀 Tutoriál spuštěn! Sleduj blikající šipky.';
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.toast(msg, 'info');
        } else if (typeof UI !== 'undefined' && UI.notify) {
            UI.notify(msg);
        }
    },

    stopTutorial: function () {
        if (!GameState.tutorial) return;
        GameState.tutorial.active = false;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this._stopPolling();
        this._removeOverlay();

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const msg = lang === 'en' ? '⏸️ Tutorial paused.' : '⏸️ Tutoriál pozastaven.';
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.toast(msg, 'info');
        }
    },

    resetTutorial: function () {
        GameState.tutorial = { active: false, step: 0, completed: false };
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this._stopPolling();
        this._removeOverlay();
        if (typeof UI !== 'undefined' && UI.openAboutModal) UI.openAboutModal();
    },

    _startPolling: function () {
        if (this._pollHandle) return;
        this._pollHandle = setInterval(() => this._tick(), this.POLL_MS);
        this._tick();
    },

    _stopPolling: function () {
        if (this._pollHandle) {
            clearInterval(this._pollHandle);
            this._pollHandle = null;
        }
    },

    _tick: function () {
        if (!GameState.tutorial || !GameState.tutorial.active) return;
        const step = this.STEPS[GameState.tutorial.step];
        if (!step) {
            this._complete();
            return;
        }

        if (step.isDone()) {
            const completedStep = step;
            GameState.tutorial.step++;
            if (typeof Game !== 'undefined' && Game.save) Game.save();

            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const toastTitle = lang === 'en' ? completedStep.title_en : completedStep.title_cs;
            const toastMsg = lang === 'en'
                ? `🎉 Step ${GameState.tutorial.step}/${this.STEPS.length} completed: ${toastTitle}`
                : `🎉 Krok ${GameState.tutorial.step}/${this.STEPS.length} splněn: ${toastTitle}`;

            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.toast(toastMsg, 'success');
            } else if (typeof UI !== 'undefined' && UI.notify) {
                UI.notify(toastMsg);
            }

            if (GameState.tutorial.step >= this.STEPS.length) {
                this._complete();
                return;
            }
        }

        this.render();
    },

    _complete: function () {
        GameState.tutorial.active = false;
        GameState.tutorial.completed = true;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        this._stopPolling();
        this._removeOverlay();

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const msg = lang === 'en'
            ? '🏆 Tutorial completed! You are ready for life in the monastery.'
            : '🏆 Tutoriál dokončen! Jsi připraven na klášterní život.';

        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.toast(msg, 'success');
        } else if (typeof UI !== 'undefined' && UI.notify) {
            UI.notify(msg);
        }
    },

    render: function () {
        if (!GameState.tutorial || !GameState.tutorial.active) {
            this._removeOverlay();
            return;
        }

        const stepIdx = GameState.tutorial.step;
        const step = this.STEPS[stepIdx];
        if (!step) return;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const title = lang === 'en' ? step.title_en : step.title_cs;
        const text = lang === 'en' ? step.text_en : step.text_cs;
        const hint = lang === 'en' ? step.hint_en : step.hint_cs;

        let overlay = document.getElementById('tutorial-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'tutorial-overlay';
            document.body.appendChild(overlay);
        }

        // Zjištění viditelnosti cílového prvku
        const inScreenEl = document.querySelector(step.target);
        const isVisible = inScreenEl && inScreenEl.offsetParent !== null && inScreenEl.getBoundingClientRect().height > 0;
        const anchorEl = isVisible ? inScreenEl : document.querySelector(step.navTarget);

        let arrowHTML = '';
        if (anchorEl) {
            const rect = anchorEl.getBoundingClientRect();
            const arrowX = rect.left + rect.width / 2;
            const isTopNav = rect.top < 120;
            const arrowY = isTopNav ? rect.bottom + 12 : rect.top - 45;
            const arrowIcon = isTopNav ? '⬇️' : '⬆️';

            arrowHTML = `
                <!-- Svítící rámeček na cílovém prvku -->
                <div style="position:fixed; left:${rect.left - 6}px; top:${rect.top - 6}px; width:${rect.width + 12}px; height:${rect.height + 12}px;
                            border:3px solid #f1c40f; border-radius:10px; box-shadow: 0 0 25px #f1c40f, inset 0 0 15px rgba(241,196,15,0.4);
                            pointer-events:none; z-index:2000; animation: tutGlowPulse 1.2s infinite ease-in-out;"></div>

                <!-- Velká animovaná blikající šipka -->
                <div style="position:fixed; left:${arrowX - 25}px; top:${arrowY}px; width:50px; height:50px;
                            font-size:2.8rem; text-align:center; line-height:50px; z-index:2001; pointer-events:none;
                            filter: drop-shadow(0 0 12px #f1c40f); animation: tutArrowBounce 0.9s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95);">
                    ${arrowIcon}
                </div>
            `;
        }

        const isWrongTab = !isVisible;
        const displayText = isWrongTab ? `${hint}<br><span style="opacity:0.85; font-size:0.8rem;">${text}</span>` : text;

        overlay.innerHTML = `
            ${arrowHTML}

            <!-- PLOVOUCÍ BANNEREK S DANEI ÚKOLEM A TOAST STYLEM -->
            <div style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:92%; max-width:560px; z-index:2002;
                        background:linear-gradient(135deg, #2c2219, #1c150f); color:#f5e6c8; border:2px solid #f1c40f;
                        border-radius:12px; padding:14px 18px; box-shadow:0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(241,196,15,0.3);
                        font-family:'Crimson Text', serif; display:flex; flex-direction:column; gap:8px;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(241,196,15,0.3); padding-bottom:6px;">
                    <div style="font-family:'Cinzel Decorative', serif; font-weight:bold; color:#f1c40f; font-size:1.02rem; display:flex; align-items:center; gap:8px;">
                        <span>🧭</span> ${title}
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:0.78rem; background:rgba(241,196,15,0.2); color:#f1c40f; padding:2px 8px; border-radius:10px; font-weight:bold;">
                            ${stepIdx + 1} / ${this.STEPS.length}
                        </span>
                        <button onclick="TutorialSystem.stopTutorial()" title="${lang === 'en' ? 'Pause Tutorial' : 'Pozastavit tutoriál'}"
                                style="background:none; border:none; color:#f5e6c8; font-size:1.2rem; cursor:pointer; opacity:0.8; transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">✕</button>
                    </div>
                </div>

                <div style="font-size:0.95rem; line-height:1.45; color:#fcebd0;">
                    ${displayText}
                </div>

                <!-- Progress bar -->
                <div style="height:5px; width:100%; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; margin-top:2px;">
                    <div style="height:100%; width:${((stepIdx + 1) / this.STEPS.length) * 100}%; background:linear-gradient(90deg, #f1c40f, #e67e22); transition:width 0.4s ease;"></div>
                </div>
            </div>

            <style>
                @keyframes tutGlowPulse {
                    0%, 100% { box-shadow: 0 0 15px #f1c40f, inset 0 0 10px rgba(241,196,15,0.3); border-color:#f1c40f; }
                    50%      { box-shadow: 0 0 30px #f39c12, inset 0 0 20px rgba(243,156,18,0.6); border-color:#f39c12; }
                }
                @keyframes tutArrowBounce {
                    0%   { transform: translateY(0) scale(1); }
                    100% { transform: translateY(-12px) scale(1.18); }
                }
            </style>
        `;
    },

    _removeOverlay: function () {
        const el = document.getElementById('tutorial-overlay');
        if (el) el.innerHTML = '';
    }
};
