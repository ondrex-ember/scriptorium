// IncenseSystem.js — Thuribulum (Kadidlo1)
// Pálení kadidla v Ohništi (Foculus) → pasivní snížení únavy po dobu hoření
// Vzor: fireplace.js _teaInterval / _coffeeInterval

const IncenseSystem = {

    // Konfigurace kadidel: trvání (s) + fatigue snížení za sekundu
    CONFIG: {
        "incense_spruce":   { duration: 10, fatiguePerSec: 0.8 },
        "incense_pine":     { duration: 15, fatiguePerSec: 0.8 },
        "incense_styrax":   { duration: 22, fatiguePerSec: 1.0 },
        "incense_olibanum": { duration: 30, fatiguePerSec: 1.2 }
    },

    _interval: null,

    // ── Init (voláno při load/save) ──────────────────────────────────────────
    init: function() {
        if (!GameState.incense) {
            GameState.incense = { activeItem: null, timerRemaining: 0, maxTimer: 0, fatiguePerSec: 0 };
        }
        // Obnov interval pokud kadidlo stále hoří (po reloadu stránky)
        if (GameState.incense.timerRemaining > 0) {
            this._ensureInterval();
        }
    },

    // ── Zapálit kadidlo ──────────────────────────────────────────────────────
    ignite: function(itemId) {
        if (!GameState.incense) this.init();
        if (GameState.incense.timerRemaining > 0) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('fireplace.incenseBurning').replace('{name}', this._itemName(GameState.incense.activeItem)).replace('{s}', Math.ceil(GameState.incense.timerRemaining)));
            return;
        }
        const cfg = this.CONFIG[itemId];
        if (!cfg) return;
        if ((GameState.inventory[itemId] || 0) <= 0) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('fireplace.incenseEmpty'));
            return;
        }
        // Spotřebovat kadidlo
        GameState.inventory[itemId] = Math.max(0, (GameState.inventory[itemId] || 0) - 1);

        // Nastavit stav
        GameState.incense.activeItem    = itemId;
        GameState.incense.timerRemaining = cfg.duration;
        GameState.incense.maxTimer       = cfg.duration;
        GameState.incense.fatiguePerSec  = cfg.fatiguePerSec;

        this._ensureInterval();
        this.render();
        if (typeof Game !== 'undefined' && Game.saveGame) Game.saveGame();
    },

    // ── Uhasit kadidlo předčasně ─────────────────────────────────────────────
    extinguish: function() {
        if (!GameState.incense || GameState.incense.timerRemaining <= 0) return;
        this._clearInterval();
        GameState.incense.activeItem    = null;
        GameState.incense.timerRemaining = 0;
        GameState.incense.fatiguePerSec  = 0;
        if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('fireplace.incenseExtinguished'));
        this.render();
        if (typeof Game !== 'undefined' && Game.saveGame) Game.saveGame();
    },

    // ── Sekundový interval (tick) ────────────────────────────────────────────
    _ensureInterval: function() {
        if (this._interval) return;
        this._interval = setInterval(() => { this._tick(); }, 1000);
    },

    _clearInterval: function() {
        if (this._interval) { clearInterval(this._interval); this._interval = null; }
    },

    _tick: function() {
        if (!GameState.incense || GameState.incense.timerRemaining <= 0) {
            this._clearInterval();
            return;
        }
        GameState.incense.timerRemaining -= 1;

        // Vigor efekt: snížit únavu
        if (typeof VigorSystem !== 'undefined') {
            GameState.fatigue = Math.max(0, (GameState.fatigue || 0) - GameState.incense.fatiguePerSec);
        }

        if (GameState.incense.timerRemaining <= 0) {
            // Dohořelo
            GameState.incense.activeItem    = null;
            GameState.incense.timerRemaining = 0;
            GameState.incense.fatiguePerSec  = 0;
            this._clearInterval();
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(t('fireplace.incenseBurnedOut'));
            if (typeof Game !== 'undefined' && Game.saveGame) Game.saveGame();
        }

        this.render();
    },

    // ── Render sekce v Fokusu ────────────────────────────────────────────────
    render: function() {
        const el = document.getElementById('foculus-incense');
        if (!el) return;

        // Tech gate
        const techUnlocked = GameState.researchedTechs && GameState.researchedTechs.includes('tech_thuribulum');
        if (!techUnlocked) {
            el.innerHTML = '<div style="opacity:0.5; font-style:italic; font-size:0.85rem;">' + t('fireplace.incenseLocked') + '</div>';
            el.style.display = 'block';
            return;
        }

        const inc = GameState.incense;
        let html = '<div style="margin-top:4px;"><strong>' + t('fireplace.incenseTitle') + '</strong></div>';

        if (inc && inc.timerRemaining > 0) {
            // Kadidlo hoří — zobraz progress bar + tlačítko Uhasit
            const pct = Math.round((inc.timerRemaining / inc.maxTimer) * 100);
            const name = this._itemName(inc.activeItem);
            html += '<div style="margin-top:6px; font-size:0.9rem;">💨 ' + name + ' — ' + Math.ceil(inc.timerRemaining) + ' s</div>';
            html += '<div style="height:8px; background:rgba(0,0,0,0.2); border-radius:4px; overflow:hidden; margin:6px 0; border:1px solid rgba(197,160,89,0.3);">';
            html += '<div style="width:' + pct + '%; height:100%; background:#c8a96e; transition:width 1s linear;"></div></div>';
            html += '<button class="filter-btn" onclick="IncenseSystem.extinguish()" style="font-size:0.8rem;">' + t('fireplace.incenseExtinguish') + '</button>';
        } else {
            // Kadidlo nehoří — zobraz dostupná kadidla
            const order = ["incense_spruce", "incense_pine", "incense_styrax", "incense_olibanum"];
            let hasAny = false;
            order.forEach(function(itemId) {
                const qty = GameState.inventory[itemId] || 0;
                if (qty > 0) {
                    hasAny = true;
                    const iName = IncenseSystem._itemName(itemId);
                    const icon = (ItemsDB[itemId] && ItemsDB[itemId].icon) ? ItemsDB[itemId].icon : '💨';
                    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px; font-size:0.88rem;">';
                    html += '<span>' + icon + ' ' + iName + ' <span style="color:var(--accent-gold);">×' + qty + '</span></span>';
                    html += '<button class="filter-btn" onclick="IncenseSystem.ignite(\'' + itemId + '\')" style="font-size:0.78rem; padding:3px 8px;">' + t('fireplace.incenseBurn') + '</button>';
                    html += '</div>';
                }
            });
            if (!hasAny) {
                html += '<div style="opacity:0.55; font-size:0.85rem; font-style:italic; margin-top:5px;">' + t('fireplace.incenseEmpty') + '</div>';
            }
        }

        el.innerHTML = html;
        el.style.display = 'block';
    },

    // ── Helper: jméno itemu dle jazyka ──────────────────────────────────────
    _itemName: function(itemId) {
        if (!itemId || !ItemsDB[itemId]) return itemId || '';
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        return lang === 'en' ? (ItemsDB[itemId].name_en || ItemsDB[itemId].name) : ItemsDB[itemId].name;
    }
};
