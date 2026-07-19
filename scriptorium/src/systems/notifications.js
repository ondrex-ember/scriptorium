// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SYSTEM — Scriptorium
// Tři vrstvy: Toast | Panel | Modal
// Kronika: automatický zápis do GameState.kronika
// ═══════════════════════════════════════════════════════════════════════════════

const NotificationSystem = {

    // ─── Konfigurace ────────────────────────────────────────────────────────
    TOAST_DURATION:  3200,   // ms — jak dlouho toast visí
    TOAST_MAX_STACK: 3,      // max toastů najednou
    PANEL_MAX:       50,     // max zpráv v panelu

    // ─── Stav ───────────────────────────────────────────────────────────────
    _toastCount: 0,
    _panelOpen:  false,

    // ════════════════════════════════════════════════════════════════════════
    // VRSTVA 1 — TOAST
    // Rychlá přechodná zpráva, zmizí sama.
    // type: 'info' | 'warn' | 'error'
    // ════════════════════════════════════════════════════════════════════════
    toast: function(msg, type) {
        if (this._toastCount >= this.TOAST_MAX_STACK) return;

        const area = document.getElementById('notification-area');
        if (!area) return;

        this._toastCount++;

        const el = document.createElement('div');
        el.className = 'ns-toast';
        if (type === 'error' || type === true) el.classList.add('ns-toast--error');
        if (type === 'warn')                   el.classList.add('ns-toast--warn');
        el.innerText = msg;

        area.appendChild(el);

        setTimeout(() => {
            el.classList.add('ns-toast--fade');
            setTimeout(() => {
                el.remove();
                this._toastCount = Math.max(0, this._toastCount - 1);
            }, 400);
        }, this.TOAST_DURATION);
    },

    // ════════════════════════════════════════════════════════════════════════
    // TOAST ACCUM — agregovaný toast pro scavenge gains
    // Přesunuto z UI.notifyAccum pro jednotnou správu
    // ════════════════════════════════════════════════════════════════════════
    _accumEl:    null,
    _accumTimer: null,
    _accumData:  {},

    toastAccum: function(gains) {
        if (!gains || Object.keys(gains).length === 0) return;

        for (const [id, qty] of Object.entries(gains)) {
            this._accumData[id] = (this._accumData[id] || 0) + qty;
        }

        const buildContent = () => Object.entries(this._accumData).map(([id, qty]) => {
            const item = (typeof ItemsDB !== 'undefined' && ItemsDB[id]) ? ItemsDB[id] : null;
            const icon = item ? (item.icon || '📦') : '📦';
            const name = item
                ? (typeof iName === 'function' ? iName(id) : item.name)
                : id;
            return `<span class="ns-accum-item">${icon} <strong>+${qty}</strong> ${name}</span>`;
        }).join('');

        const area = document.getElementById('notification-area');
        if (!area) return;

        if (!this._accumEl || !this._accumEl.isConnected) {
            this._accumEl = document.createElement('div');
            this._accumEl.className = 'ns-toast-accum';
            area.appendChild(this._accumEl);
        }
        this._accumEl.innerHTML = buildContent();

        if (this._accumTimer) clearTimeout(this._accumTimer);
        this._accumTimer = setTimeout(() => {
            if (this._accumEl) { this._accumEl.remove(); this._accumEl = null; }
            this._accumData  = {};
            this._accumTimer = null;
        }, 4000);
    },

    // ════════════════════════════════════════════════════════════════════════
    // VRSTVA 2 — PANEL (boční, persistentní)
    // Záložka Civ5 styl — přichycena k pravému okraji.
    // category: 'sklad' | 'dvur' | 'athanor' | 'obchod' | 'udalost' | 'system'
    // ════════════════════════════════════════════════════════════════════════
    panel: function(msg, category) {
        category = category || 'system';

        if (!GameState.notifications) GameState.notifications = [];

        // Akumulace — pokud poslední zpráva má stejný text, jen inkrementuj čítač
        const last = GameState.notifications[0];
        if (last && last.msg === msg && last.category === category) {
            last.count = (last.count || 1) + 1;
            last.time = Date.now();
            last.read = false;
            this._renderPanelBadge();
            if (this._panelOpen) this._renderPanelList();
            return;
        }

        const entry = {
            id:       Date.now() + Math.random(),
            msg:      msg,
            category: category,
            time:     Date.now(),
            read:     false,
            count:    1,
        };

        GameState.notifications.unshift(entry);

        // Ořez na max
        if (GameState.notifications.length > this.PANEL_MAX) {
            GameState.notifications = GameState.notifications.slice(0, this.PANEL_MAX);
        }

        this._renderPanelBadge();
        if (this._panelOpen) this._renderPanelList();
    },

    // ─── Ikony kategorií ────────────────────────────────────────────────────
    _catIcon: function(cat) {
        const map = {
            sklad:     '📦', dvur: '🐄', athanor: '⚗️',
            obchod:    '💰', udalost: '📜', system: '🔔',
            porta:     '🕊️', tidings: '🔔',
            chronicon:            '🕊️',
            chronicon_distant:    '🕊️',
            chronicon_local:      '🗣️',
            chronicon_monastery:  '✝️',
        };
        return map[cat] || '🔔';
    },

    _catLabel: function(cat) {
        const key = 'notifications.cat_' + cat;
        const val = (typeof t === 'function') ? t(key) : null;
        if (val && val !== key) return val;
        // Chronicon subkategorie — využít chroniconSrc překlady (cs.js / en.js)
        if (cat === 'chronicon_distant')   return (typeof t === 'function') ? t('kronika.chroniconSrc.distant_events')    : 'z dálky';
        if (cat === 'chronicon_local')     return (typeof t === 'function') ? t('kronika.chroniconSrc.local_events')      : 'místní drby';
        if (cat === 'chronicon_monastery') return (typeof t === 'function') ? t('kronika.chroniconSrc.monastery_internal') : 'klášter';
        const fallback = { sklad: 'sklad', dvur: 'dvůr', athanor: 'athanor', obchod: 'obchod', udalost: 'událost', system: 'systém', postup: 'postup', chronicon: 'zprávy světa', porta: 'Porta', tidings: 'zprávy' };
        return fallback[cat] || cat;
    },

    // ─── Badge (záložka) ────────────────────────────────────────────────────
    _renderPanelBadge: function() {
        const total = (GameState.notifications || []).length;

        // Skrýt záložku pokud nejsou žádné zprávy
        if (total === 0) {
            const existing = document.getElementById('ns-panel-tab');
            if (existing) existing.style.display = 'none';
            return;
        }

        let tab = document.getElementById('ns-panel-tab');
        if (!tab) {
            tab = document.createElement('div');
            tab.id = 'ns-panel-tab';
            tab.className = 'ns-panel-tab';
            tab.setAttribute('aria-label', 'Otevřít zprávy kláštera');
            tab.onclick = () => this.togglePanel();
            document.body.appendChild(tab);
        }

        tab.style.display = '';
        const unread = (GameState.notifications || []).filter(n => !n.read).length;
        tab.innerHTML = `
            <span class="ns-tab-icon">🔔</span>
            ${unread > 0 ? `<span class="ns-tab-badge">${unread}</span>` : ''}
        `;
    },

    // ─── Panel toggle ───────────────────────────────────────────────────────
    togglePanel: function() {
        this._panelOpen = !this._panelOpen;
        const existing = document.getElementById('ns-panel');
        if (existing) { existing.remove(); }
        if (this._panelOpen) this._renderPanelList();
    },

    // ─── Panel list ─────────────────────────────────────────────────────────
    _renderPanelList: function() {
        const existing = document.getElementById('ns-panel');
        if (existing) existing.remove();

        const notifications = GameState.notifications || [];

        const panel = document.createElement('div');
        panel.id = 'ns-panel';
        panel.className = 'ns-panel';
        panel.innerHTML = `
            <div class="ns-panel-head">
                <span class="ns-panel-title">${t('notifications.panel_title')}</span>
                <button class="ns-panel-close" onclick="NotificationSystem.togglePanel()" aria-label="Zavřít">✕</button>
            </div>
            <div class="ns-panel-body" id="ns-panel-body">
                ${notifications.length === 0
                    ? `<div class="ns-panel-empty">${t('notifications.panel_empty')}</div>`
                    : notifications.map(n => `
                        <div class="ns-panel-item ${n.read ? '' : 'ns-panel-item--unread'}" data-id="${n.id}">
                            <span class="ns-item-icon">${this._catIcon(n.category)}</span>
                            <span class="ns-item-body">
                                <span class="ns-item-msg">${n.msg}${n.count > 1 ? ` <span class="ns-item-count">(${n.count})</span>` : ''}</span>
                                <span class="ns-item-meta">${this._catLabel(n.category)} · ${this._relTime(n.time)}</span>
                            </span>
                            <button class="ns-item-close" onclick="NotificationSystem.dismiss('${n.id}')" aria-label="Zavřít zprávu">✕</button>
                        </div>
                    `).join('')
                }
            </div>
            ${notifications.length > 0 ? `
            <div class="ns-panel-footer">
                <button class="ns-panel-clear" onclick="NotificationSystem.dismissAll()">${t('notifications.panel_clear')}</button>
            </div>` : ''}
        `;

        document.body.appendChild(panel);

        // Označit vše jako přečtené při otevření
        (GameState.notifications || []).forEach(n => { n.read = true; });
        this._renderPanelBadge();
    },

    // ─── Dismiss jednotlivé zprávy ──────────────────────────────────────────
    dismiss: function(id) {
        if (!GameState.notifications) return;
        GameState.notifications = GameState.notifications.filter(n => String(n.id) !== String(id));
        this._renderPanelList();
        this._renderPanelBadge();
    },

    dismissAll: function() {
        GameState.notifications = [];
        this.togglePanel();
        this._renderPanelBadge();
    },

    // ─── Relativní čas ──────────────────────────────────────────────────────
    _relTime: function(ts) {
        const diff = Date.now() - ts;
        const min  = Math.floor(diff / 60000);
        const h    = Math.floor(diff / 3600000);
        const d    = Math.floor(diff / 86400000);
        if (diff < 60000)  return t('notifications.just_now');
        if (min  < 60)     return t('notifications.minutes_ago').replace('{n}', min);
        if (h    < 24)     return t('notifications.hours_ago').replace('{n}', h);
        return t('notifications.days_ago').replace('{n}', d);
    },

    // ════════════════════════════════════════════════════════════════════════
    // VRSTVA 3 — MODAL (blokující, vyžaduje rozhodnutí)
    // opts: { title, text, choices: [{label, type, effect}], onClose }
    // type volby: 'primary' | 'danger' | 'default'
    // ════════════════════════════════════════════════════════════════════════
    modal: function(opts) {
        const existing = document.getElementById('ns-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'ns-modal-overlay';
        overlay.className = 'ns-modal-overlay';
        // Klik na tmavé pozadí (ne na samotný modal box) = zavřít
        overlay.onclick = (e) => { if (e.target === overlay) NotificationSystem.closeModal(); };

        const choices = (opts.choices || []).map((c, i) => `
            <button class="ns-modal-btn ns-modal-btn--${c.type || 'default'}"
                    onclick="NotificationSystem._modalChoice(${i})">
                ${c.label}
            </button>
        `).join('');

        // Banner (ilustrace + titulek přes gradient) — jen když opts.image je vyplněný.
        // Bez obrázku zůstává dnešní vzhled (ikona + titulek nad textem).
        const bannerBlock = opts.image
            ? `<div class="ns-modal-banner" style="background-image:url('${opts.image}')">
                   <div class="ns-modal-banner-title">${opts.title || ''}</div>
               </div>`
            : '';
        const headerBlock = opts.image
            ? ''
            : `${opts.icon ? `<span class="ns-modal-icon">${opts.icon}</span>` : ''}
               <div class="ns-modal-title">${opts.title || ''}</div>`;

        overlay.innerHTML = `
            <div class="ns-modal${opts.image ? ' ns-modal--banner' : ''}" role="dialog" aria-modal="true">
                ${bannerBlock}
                <div class="ns-modal-content">
                    ${headerBlock}
                    <div class="ns-modal-body">${opts.text || ''}</div>
                    <div class="ns-modal-footer">${choices}</div>
                </div>
            </div>
        `;

        // Uložit callbacks
        this._modalChoices  = opts.choices || [];
        this._modalOnClose  = opts.onClose || null;

        document.body.appendChild(overlay);
    },

    _modalChoices: [],
    _modalOnClose: null,

    // Zavření kliknutím mimo modal — stejný cleanup jako volba, bez efektu
    closeModal: function() {
        const overlay = document.getElementById('ns-modal-overlay');
        if (overlay) overlay.remove();
        if (this._modalOnClose) this._modalOnClose();
    },

    _modalChoice: function(idx) {
        const choice = this._modalChoices[idx];
        const overlay = document.getElementById('ns-modal-overlay');
        if (overlay) overlay.remove();
        if (this._modalOnClose) this._modalOnClose();
        if (choice && typeof choice.effect === 'function') choice.effect();
    },


    // ════════════════════════════════════════════════════════════════════════
    // KRONIKA — automatický zápis s kategorií
    // category: 'obchod' | 'athanor' | 'sklad' | 'udalost' | 'dvur' | 'postup'
    // ════════════════════════════════════════════════════════════════════════
    kronika: function(msg, category) {
        if (typeof Game === 'undefined' || typeof Game.addKronikaEntry !== 'function') return;
        // addKronikaEntry přijme zprávu; kategorii předáme jako prefix
        const catPrefix = category ? `[${this._catLabel(category)}] ` : '';
        Game.addKronikaEntry(catPrefix + msg);
    },

    // ════════════════════════════════════════════════════════════════════════
    // INIT — vložit CSS + záložku při startu hry
    // ════════════════════════════════════════════════════════════════════════
    init: function() {
        this._injectCSS();
        this._renderPanelBadge();
    },

    // ─── CSS ────────────────────────────────────────────────────────────────
    _injectCSS: function() {
        if (document.getElementById('ns-styles')) return;
        const style = document.createElement('style');
        style.id = 'ns-styles';
        style.textContent = `

/* ── Toast — shodný styl s originálním .toast ── */
.ns-toast {
    display: inline-block;
    background: var(--ink-primary, #2c1810);
    color: var(--bg-parchment, #f5f0e4);
    padding: 8px 16px;
    border-radius: 4px;
    margin-top: 5px;
    border: 1px solid var(--accent-gold, #c8a96e);
    font-family: 'Cinzel Decorative', 'Cinzel', serif;
    animation: fadeOut 2.5s forwards;
    pointer-events: none;
}
.ns-toast--error { border-color: #c0392b; filter: brightness(1.15); }
.ns-toast--warn  { border-color: #e67e22; filter: brightness(1.1); }
.ns-toast--fade  { opacity: 0; }

.ns-toast-accum {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: 90vw;
    justify-content: center;
    background: var(--bg-card, #f5f0e8);
    border: 1px solid var(--accent-gold, #c8a96e);
    border-radius: 4px;
    padding: 6px 10px;
    font-family: var(--font-body, 'Crimson Text', serif);
    font-size: 0.9rem;
    color: var(--ink-primary, #2c1810);
}
.ns-accum-item { margin: 2px 6px; }

/* ── Panel záložka ── */
.ns-panel-tab {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: var(--bg-card, #f5f0e8);
    border: 1px solid var(--accent-gold, #c8a96e);
    border-right: none;
    border-radius: 6px 0 0 6px;
    padding: 10px 8px;
    cursor: pointer;
    z-index: 900;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    box-shadow: -2px 0 8px rgba(0,0,0,0.15);
    transition: background 0.2s;
}
.ns-panel-tab:hover { background: var(--bg-parchment, #ede8dc); }
.ns-tab-icon { font-size: 1.1rem; }
.ns-tab-badge {
    background: #c0392b;
    color: #fff;
    font-size: 0.65rem;
    font-weight: bold;
    border-radius: 10px;
    padding: 1px 5px;
    min-width: 16px;
    text-align: center;
    font-family: var(--font-ui, sans-serif);
}

/* ── Panel ── */
.ns-panel {
    position: fixed;
    right: 0;
    top: 0;
    height: 100%;
    width: 300px;
    max-width: 90vw;
    background: var(--bg-parchment, #ede8dc);
    border-left: 2px solid var(--accent-gold, #c8a96e);
    z-index: 950;
    display: flex;
    flex-direction: column;
    box-shadow: -4px 0 16px rgba(0,0,0,0.2);
    font-family: var(--font-body, 'Crimson Text', serif);
}
.ns-panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid var(--accent-gold, #c8a96e);
    background: var(--bg-card, #f5f0e8);
}
.ns-panel-title {
    font-size: 1rem;
    font-weight: bold;
    color: var(--ink-primary, #2c1810);
    letter-spacing: 0.03em;
}
.ns-panel-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: var(--ink-secondary, #6b4c3b);
    padding: 2px 6px;
    border-radius: 3px;
}
.ns-panel-close:hover { background: rgba(0,0,0,0.08); }
.ns-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 6px 0;
}
.ns-panel-empty {
    padding: 20px;
    text-align: center;
    color: var(--ink-secondary, #6b4c3b);
    font-style: italic;
    font-size: 0.9rem;
}
.ns-panel-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(0,0,0,0.07);
    transition: background 0.15s;
}
.ns-panel-item--unread { background: rgba(200,169,110,0.12); }
.ns-item-count { font-size: 0.8em; opacity: 0.7; font-weight: bold; color: var(--accent-gold); }
.ns-panel-item:hover   { background: rgba(200,169,110,0.18); }
.ns-item-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
.ns-item-body { flex: 1; min-width: 0; }
.ns-item-msg  {
    display: block;
    font-size: 0.9rem;
    color: var(--ink-primary, #2c1810);
    line-height: 1.4;
}
.ns-item-meta {
    display: block;
    font-size: 0.75rem;
    color: var(--ink-secondary, #6b4c3b);
    margin-top: 2px;
}
.ns-item-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--ink-secondary, #6b4c3b);
    font-size: 0.8rem;
    padding: 2px 4px;
    flex-shrink: 0;
    border-radius: 3px;
    opacity: 0.6;
}
.ns-item-close:hover { opacity: 1; background: rgba(0,0,0,0.08); }
.ns-panel-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--accent-gold, #c8a96e);
    background: var(--bg-card, #f5f0e8);
}
.ns-panel-clear {
    width: 100%;
    background: none;
    border: 1px solid var(--accent-gold, #c8a96e);
    border-radius: 3px;
    padding: 6px;
    font-family: var(--font-body, 'Crimson Text', serif);
    font-size: 0.85rem;
    color: var(--ink-secondary, #6b4c3b);
    cursor: pointer;
}
.ns-panel-clear:hover { background: rgba(200,169,110,0.15); }

/* ── Modal ── */
.ns-modal-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.72);
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
}
.ns-modal {
    background: var(--bg-parchment, #f5f0e4);
    border: 2px solid var(--accent-gold, #c8a96e);
    border-radius: 4px;
    max-width: 420px;
    width: 100%;
    max-height: min(85vh, 640px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 40px rgba(0,0,0,0.6);
    font-family: var(--font-body, 'Crimson Text', serif);
    animation: nsFadeIn 0.25s ease;
    text-align: center;
    overflow: hidden;
}
.ns-modal-content {
    padding: 32px 28px 24px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
    min-height: 0;
}
.ns-modal--banner .ns-modal-content {
    padding-top: 20px;
}
.ns-modal-banner {
    position: relative;
    width: 100%;
    height: 180px;
    background-size: cover;
    background-position: center;
}
.ns-modal-banner-title {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 40px 18px 14px;
    background: linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0));
    font-family: var(--font-display, 'Cinzel', serif);
    font-size: 1.15rem;
    font-weight: bold;
    color: var(--accent-gold, #f0d98f);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: left;
}
.ns-modal-icon {
    font-size: 3.2rem;
    margin-bottom: 12px;
    display: block;
}
.ns-modal-title {
    font-family: var(--font-display, 'Cinzel', serif);
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--accent-gold, #c8a96e);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 12px;
}
.ns-modal-body {
    font-size: 1rem;
    color: var(--ink-primary, #2c1810);
    line-height: 1.65;
    white-space: pre-line;
    margin-bottom: 20px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}
.ns-modal-footer {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 4px;
    flex-shrink: 0;
}
.ns-modal-btn {
    font-family: var(--font-body, 'Crimson Text', serif);
    font-size: 1rem;
    padding: 10px 22px;
    border-radius: 3px;
    border: 1px solid var(--accent-gold, #c8a96e);
    cursor: pointer;
    background: var(--bg-card, #f5f0e8);
    color: var(--ink-primary, #2c1810);
    transition: background 0.15s;
    letter-spacing: 0.03em;
}
.ns-modal-btn:hover            { background: rgba(200,169,110,0.18); }
.ns-modal-btn--primary {
    background: var(--accent-gold, #c8a96e);
    color: #fff;
    border-color: var(--accent-gold, #c8a96e);
    font-weight: bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    width: 100%;
}
.ns-modal-btn--primary:hover   { background: #b8923a; }
.ns-modal-btn--danger          { border-color: #c0392b; color: #c0392b; }
.ns-modal-btn--danger:hover    { background: rgba(192,57,43,0.08); }

/* ── Mobile ── */
@media (max-width: 600px) {
    .ns-panel { width: 100%; max-width: 100%; }
    .ns-panel-tab { top: auto; bottom: 80px; transform: none; }
}

@keyframes nsFadeIn {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
}
        `;
        document.head.appendChild(style);
    },
};
