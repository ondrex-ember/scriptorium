// ═══════════════════════════════════════════════════════════════════════════════
// TUTORIAL SYSTEM — Interaktivní průvodce prvním dnem v klášteře
// Pokrývá: 1. Sběr surovin -> 2. Výroba nože -> 3. První lov -> 4. Výroba & zapálení svíčky -> 5. První výzkum
// ═══════════════════════════════════════════════════════════════════════════════

const TutorialSystem = {

    STEPS: [
        {
            id: 'gather',
            title_cs: '1. První sběr surovin',
            title_en: '1. First Resource Gathering',
            navTarget: '#nav-home',
            target: function () {
                const actBtn = document.querySelector('#workspace-actions .card button') || document.querySelector('#workspace-actions');
                return actBtn || '#home-scavenge-content';
            },
            text_cs: 'Vítej v klášteře! Nejprve potřebuješ nasbírat základní suroviny. V Pracovně klikni na akci "🖐️ Průzkum okolí" nebo "🌿 Sběr bylin" a získej kamení, větve a vlákna.',
            text_en: 'Welcome to the monastery! First, gather basic resources. In the Workshop, click "🖐️ Scavenge" or "🌿 Gather Herbs" to collect stones, sticks, and fibers.',
            hint_cs: 'Tip: Přejdi do Pracovny 🏰 (záložka Sběr) a klikni na akci sběru (např. 🖐️ Průzkum okolí).',
            hint_en: 'Tip: Go to Workshop 🏰 (Gathering tab) and click a gathering action (e.g. 🖐️ Scavenge).',
            isDone: function () {
                if (typeof GameState === 'undefined') return false;
                const actionsNow = (GameState.achievements && GameState.achievements.stats && GameState.achievements.stats.actionsCompleted) || 0;
                const startActions = (GameState.tutorial && GameState.tutorial.startScavenges != null) ? GameState.tutorial.startScavenges : 0;
                const inv = GameState.inventory || {};
                return actionsNow > startActions || (inv['fiber'] || 0) >= 1 || (inv['stone_knife'] || 0) >= 1 || (inv['fat'] || 0) >= 1;
            }
        },
        {
            id: 'knife',
            title_cs: '2. Výroba Kamenného nože',
            title_en: '2. Crafting a Stone Knife',
            navTarget: '#nav-craft',
            target: function () {
                return document.querySelector('[data-recipe-id="stone_knife"]') ||
                       document.querySelector('#craft-filter-stone') ||
                       document.querySelector('#screen-craft');
            },
            text_cs: 'K lovu a zpracování zvěře potřebuješ nůž. Přejdi do záložky Výroba ⚒️ a vyrob Kamenný nůž. (Vyrob 1x Ostrý kámen ze 2 kamenů, 1x Provaz ze 3 vláken a použij 1x Větev).',
            text_en: 'To hunt and dress game, you need a knife. Go to Crafting ⚒️ and craft a Stone Knife. (Craft 1x Sharp Stone from 2 rocks, 1x Rope from 3 fibers, and 1x Stick).',
            hint_cs: 'Tip: Přejdi do záložky Výroba ⚒️ (kategorie 🪨 Kamenné) a vyrob Ostrý kámen, Provaz a Kamenný nůž.',
            hint_en: 'Tip: Go to Crafting ⚒️ (category 🪨 Stone) and craft Sharp Stone, Rope, and Stone Knife.',
            isDone: function () {
                if (typeof GameState === 'undefined') return false;
                const inv = GameState.inventory || {};
                return (inv['stone_knife'] || 0) >= 1 || (inv['bone_knife'] || 0) >= 1 || (inv['iron_knife'] || 0) >= 1 || (inv['worn_stone_knife'] || 0) >= 1 || (inv['fat'] || 0) >= 1;
            }
        },
        {
            id: 'fat_hunt',
            title_cs: '3. První lov zvěře (Tuk a kosti)',
            title_en: '3. First Hunt (Animal Fat & Bones)',
            navTarget: '#nav-home',
            target: function () {
                return document.querySelector('#workspace-actions .card button[onclick*="hunt"]') ||
                       document.querySelector('#workspace-actions') ||
                       document.querySelector('#home-scavenge-content');
            },
            text_cs: 'S kamenným nožem v kapse se ti v Pracovně odemkl Lov zvěře! Přejdi zpět do Pracovny 🏰 a klikni na "🏹 Lov zvěře", abys získal tuk a maso.',
            text_en: 'With a stone knife in hand, Hunting is now available in your Workshop! Return to Workshop 🏰 and click "🏹 Hunt" to gather animal fat and meat.',
            hint_cs: 'Tip: Vrať se do Pracovny 🏰 (záložka Sběr) a klikni na 🏹 Lov zvěře.',
            hint_en: 'Tip: Return to Workshop 🏰 (Gathering tab) and click 🏹 Hunt.',
            isDone: function () {
                if (typeof GameState === 'undefined') return false;
                const inv = GameState.inventory || {};
                const flags = GameState.flags || {};
                return (inv['fat'] || 0) >= 1 || (inv['meat'] || 0) >= 1 || (inv['hide'] || 0) >= 1 || (inv['candle'] || 0) >= 1 || (inv['primitive_torch'] || 0) >= 1 || flags.candleLit || flags.torchLit;
            }
        },
        {
            id: 'candle_light',
            title_cs: '4. Krb a zapálení svíčky / louče',
            title_en: '4. Hearth & Lighting a Candle / Torch',
            navTarget: function () {
                if (typeof GameState === 'undefined') return '#nav-home';
                const flags = GameState.flags || {};
                const inv = GameState.inventory || {};
                if (!flags.fireplaceLit) return '#nav-home';
                if ((inv['candle'] || 0) === 0 && (inv['primitive_torch'] || 0) === 0) return '#nav-craft';
                return '#nav-home';
            },
            target: function () {
                if (typeof GameState === 'undefined') return '#card-fireplace';
                const flags = GameState.flags || {};
                const inv = GameState.inventory || {};
                if (!flags.fireplaceLit) {
                    return document.querySelector('#btn-ignite') || document.querySelector('#card-fireplace');
                }
                if ((inv['candle'] || 0) === 0 && (inv['primitive_torch'] || 0) === 0) {
                    return document.querySelector('[data-recipe-id="primitive_torch"]') ||
                           document.querySelector('[data-recipe-id="candle"]') ||
                           document.querySelector('#craft-filter-fire') ||
                           document.querySelector('#screen-craft');
                }
                return document.querySelector('#btn-light-candle') ||
                       document.querySelector('#btn-light-torch') ||
                       document.querySelector('#card-light-source') ||
                       document.querySelector('#screen-home');
            },
            text_cs: 'Klášter se noří do tmy a bez světla nelze ve Scriptoriu bádat. V Pracovně rozežehni Krb (pomocí Křesadla) a vyrob Louč nebo Svíčku ve Výrobě ⚒️, kterou pak rozsviť u Krbu.',
            text_en: 'Darkness falls over the monastery and research requires light. Ignite the Hearth (using Tinderbox) in Workshop, craft a Torch or Candle in Crafting ⚒️, and light it at the Hearth.',
            hint_cs: 'Tip: V Pracovně 🏰 klikni na "ROZEŽEHNOUT" u Krbu, ve Výrobě ⚒️ vyrob Louč/Svíčku a klikni na "ZAPÁLIT".',
            hint_en: 'Tip: In Workshop 🏰 click "KINDLE" on the Hearth, craft Torch/Candle in Crafting ⚒️, and click "LIGHT".',
            isDone: function () {
                if (typeof GameState === 'undefined') return false;
                const flags = GameState.flags || {};
                return !!(flags.candleLit || flags.torchLit);
            }
        },
        {
            id: 'research',
            title_cs: '5. První výzkum ve Scriptoriu',
            title_en: '5. First Research in Scriptorium',
            navTarget: '#nav-lore',
            target: function () {
                return document.querySelector('#lore-research-content .card button:not([disabled])') ||
                       document.querySelector('#lore-research-content') ||
                       document.querySelector('#screen-lore');
            },
            text_cs: 'Máš světlo a můžeš zasednout k psacímu pultu! Otevři Scriptorium ✒️ a zahaj svůj první výzkum (např. Zpracování Tuku, které odemyká svíčky a klíh, nebo jinou technologii).',
            text_en: 'With light in your chamber, you can sit at the scriptorium desk! Open Scriptorium ✒️ and start your first research (e.g. Fat Rendering to unlock candles and glue, or any available technology).',
            hint_cs: 'Tip: Přejdi do záložky Scriptorium ✒️ a u dostupné technologie klikni na "BÁDAT".',
            hint_en: 'Tip: Go to Scriptorium ✒️ and click "STUDY" on an available technology.',
            isDone: function () {
                if (typeof GameState === 'undefined') return false;
                return (GameState.researchedTechs || []).length >= 1;
            }
        }
    ],

    POLL_MS: 1200,
    _pollHandle: null,

    init: function () {
        if (typeof GameState === 'undefined') return;
        if (!GameState.tutorial) {
            GameState.tutorial = { active: false, step: 0, completed: false, startScavenges: (GameState.achievements?.stats?.actionsCompleted || 0) };
        }
        if (GameState.tutorial.active && !GameState.tutorial.completed) {
            this._startPolling();
        }
    },

    startTutorialFromModal: function () {
        if (!GameState.tutorial) GameState.tutorial = { active: false, step: 0, completed: false };
        if (GameState.tutorial.completed || GameState.tutorial.step >= this.STEPS.length) {
            GameState.tutorial.step = 0;
            GameState.tutorial.completed = false;
        }
        GameState.tutorial.startScavenges = (GameState.achievements && GameState.achievements.stats && GameState.achievements.stats.actionsCompleted) || 0;
        GameState.tutorial.active = true;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.closeAboutModal) UI.closeAboutModal();

        this._startPolling();
        this.render();

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const msg = lang === 'en' ? '🚀 Tutorial started! Follow the glowing guides.' : '🚀 Tutoriál spuštěn! Sleduj zvýrazněné prvky a šipky.';
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
        } else if (typeof UI !== 'undefined' && UI.notify) {
            UI.notify(msg);
        }
    },

    skipCurrentStep: function () {
        if (!GameState.tutorial || !GameState.tutorial.active) return;
        GameState.tutorial.step++;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (GameState.tutorial.step >= this.STEPS.length) {
            this._complete();
        } else {
            this.render();
        }
    },

    resetTutorial: function () {
        GameState.tutorial = {
            active: false,
            step: 0,
            completed: false,
            startScavenges: (GameState.achievements && GameState.achievements.stats && GameState.achievements.stats.actionsCompleted) || 0
        };
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

    _resolveElement: function (targetDef) {
        if (!targetDef) return null;
        if (typeof targetDef === 'function') {
            const res = targetDef();
            if (typeof res === 'string') return document.querySelector(res);
            return res;
        }
        if (typeof targetDef === 'string') {
            return document.querySelector(targetDef);
        }
        return targetDef;
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

        const inScreenEl = this._resolveElement(step.target);
        const navSelector = (typeof step.navTarget === 'function') ? step.navTarget() : step.navTarget;
        const navEl = navSelector ? document.querySelector(navSelector) : null;

        const isVisible = inScreenEl && inScreenEl.offsetParent !== null && inScreenEl.getBoundingClientRect().height > 0;
        const anchorEl = isVisible ? inScreenEl : navEl;

        let arrowHTML = '';
        if (anchorEl) {
            const rect = anchorEl.getBoundingClientRect();
            const arrowX = Math.max(20, Math.min(window.innerWidth - 60, rect.left + rect.width / 2));
            const isTopNav = rect.top < 130;
            const arrowY = isTopNav ? rect.bottom + 10 : Math.max(10, rect.top - 48);
            const arrowIcon = isTopNav ? '⬇️' : '⬆️';

            arrowHTML = `
                <!-- Svítící rámeček na cílovém prvku -->
                <div style="position:fixed; left:${rect.left - 5}px; top:${rect.top - 5}px; width:${rect.width + 10}px; height:${rect.height + 10}px;
                            border:3px solid #f1c40f; border-radius:10px; box-shadow: 0 0 25px #f1c40f, inset 0 0 15px rgba(241,196,15,0.4);
                            pointer-events:none; z-index:2000; animation: tutGlowPulse 1.2s infinite ease-in-out;"></div>

                <!-- Velká animovaná blikající šipka -->
                <div style="position:fixed; left:${arrowX - 25}px; top:${arrowY}px; width:50px; height:50px;
                            font-size:2.6rem; text-align:center; line-height:50px; z-index:2001; pointer-events:none;
                            filter: drop-shadow(0 0 12px #f1c40f); animation: tutArrowBounce 0.9s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95);">
                    ${arrowIcon}
                </div>
            `;
        }

        const isWrongTab = !isVisible;
        const displayText = isWrongTab ? `<span style="color:#ffd700; font-weight:bold;">${hint}</span><br><span style="opacity:0.85; font-size:0.85rem;">${text}</span>` : text;

        overlay.innerHTML = `
            ${arrowHTML}

            <!-- PLOVOUCÍ BANNEREK S DANÝM ÚKOLEM A TOAST STYLEM -->
            <div style="position:fixed; bottom:74px; left:50%; transform:translateX(-50%); width:92%; max-width:560px; z-index:2002;
                        background:linear-gradient(135deg, #2c2219, #1c150f); color:#f5e6c8; border:2px solid #f1c40f;
                        border-radius:12px; padding:12px 16px; box-shadow:0 10px 30px rgba(0,0,0,0.85), 0 0 20px rgba(241,196,15,0.3);
                        font-family:'Crimson Text', serif; display:flex; flex-direction:column; gap:6px;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(241,196,15,0.3); padding-bottom:4px;">
                    <div style="font-family:'Cinzel Decorative', serif; font-weight:bold; color:#f1c40f; font-size:0.98rem; display:flex; align-items:center; gap:6px;">
                        <span>🧭</span> ${title}
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:0.75rem; background:rgba(241,196,15,0.2); color:#f1c40f; padding:2px 8px; border-radius:10px; font-weight:bold;">
                            ${stepIdx + 1} / ${this.STEPS.length}
                        </span>
                        <button onclick="TutorialSystem.skipCurrentStep()" title="${lang === 'en' ? 'Skip step' : 'Přeskočit krok'}"
                                style="background:rgba(255,255,255,0.1); border:1px solid rgba(241,196,15,0.4); color:#ffd700; font-size:0.75rem; padding:2px 6px; border-radius:4px; cursor:pointer;">
                            ${lang === 'en' ? 'Skip ⏩' : 'Přeskočit ⏩'}
                        </button>
                        <button onclick="TutorialSystem.stopTutorial()" title="${lang === 'en' ? 'Pause Tutorial' : 'Pozastavit tutoriál'}"
                                style="background:none; border:none; color:#f5e6c8; font-size:1.2rem; cursor:pointer; opacity:0.8; padding:0 4px; line-height:1;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">✕</button>
                    </div>
                </div>

                <div style="font-size:0.92rem; line-height:1.4; color:#fcebd0;">
                    ${displayText}
                </div>

                <!-- Progress bar -->
                <div style="height:4px; width:100%; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; margin-top:2px;">
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
                    100% { transform: translateY(-10px) scale(1.15); }
                }
            </style>
        `;
    },

    _removeOverlay: function () {
        const el = document.getElementById('tutorial-overlay');
        if (el) el.innerHTML = '';
    }
};
