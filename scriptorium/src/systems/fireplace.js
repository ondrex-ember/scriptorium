// ═══════════════════════════════════════════════════════════════════════════
// FIREPLACE SYSTEM — Teplo domova
// Krb sám (ignite/dead/lit) je odemčen od začátku — beze změny.
// FireplaceSystem rozšiřuje správu o palivo (fuel panel), gated tech_meteorologica.
// Subtab: Pracovna → FOCULUS (home-foculus-content)
// ═══════════════════════════════════════════════════════════════════════════

const FireplaceSystem = {
    MAX_FUEL_MS: 24 * 60 * 60 * 1000, // Maximální kapacita krbu: 24 hodin

    // Kolik času přidá dané palivo
    FUEL_VALUES: {
        'stick': 1 * 60 * 60 * 1000,   // Větev: +1 hodina
        'log': 4 * 60 * 60 * 1000,     // Poleno: +4 hodiny
        'charcoal': 8 * 60 * 60 * 1000 // Dřevěné uhlí: +8 hodin
    },

    hasMeteorologica: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_meteorologica'));
    },

    _ensureState: function() {
        if (!GameState.fire) {
            GameState.fire = {
                active: GameState.flags.fireplaceLit || false,
                fuelMs: GameState.flags.fireplaceLit ? (6 * 60 * 60 * 1000) : 0, // Pro staré savy: dostanou 6h do začátku
                lastUpdate: Date.now()
            };
        }
    },

    addFuel: function(itemId) {
        this._ensureState();
        if (!GameState.fire.active) return;
        if (!this.hasMeteorologica()) return;

        const fuelAmount = this.FUEL_VALUES[itemId];
        if (!fuelAmount) return;

        if ((GameState.inventory[itemId] || 0) < 1) {
            const itemName = (typeof iName === 'function') ? iName(itemId) : itemId;
            UI.notify(t('fireplace.notEnough').replace('{item}', itemName), true);
            return;
        }

        if (GameState.fire.fuelMs + fuelAmount > this.MAX_FUEL_MS) {
            UI.notify(t('fireplace.full'), true);
            return;
        }

        Game.removeItem(itemId, 1);
        GameState.fire.fuelMs += fuelAmount;
        Game.save();
        this.render();

        UI.notify(t('fireplace.fuelAdded'));
    },

    tick: function() {
        this._ensureState();
        if (!GameState.fire.active) return;

        const now = Date.now();
        const delta = now - GameState.fire.lastUpdate; // Započítá i čas, kdy byl hráč offline!
        GameState.fire.lastUpdate = now;

        GameState.fire.fuelMs -= delta;

        if (GameState.fire.fuelMs <= 0) {
            this.dieOut();
        } else {
            this.render();
        }
    },

    dieOut: function() {
        GameState.fire.active = false;
        GameState.fire.fuelMs = 0;
        GameState.flags.fireplaceLit = false;
        GameState.flags.candleLit = false;
        GameState.flags.torchLit = false;

        if ((GameState.inventory['tinderbox'] || 0) <= 0) {
            GameState.inventory['tinderbox'] = 1;
        }

        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.panel(t('fireplace.diedOut'), 'warning');
        }

        Game.save();
        if (typeof Game.checkEnvironment === 'function') Game.checkEnvironment();
        this.render();
    },

    // Volá se z Game.checkEnvironment() — synchronizuje stav po ignite/dieOut
    render: function() {
        this._ensureState();

        const panel = document.getElementById('fireplace-fuel-panel');
        if (!panel) return; // Foculus subtab není v DOM (jiný subtab aktivní) — nic k vykreslení

        const lockedView = document.getElementById('foculus-locked');
        const unlockedView = document.getElementById('foculus-unlocked');

        if (!this.hasMeteorologica()) {
            if (lockedView) lockedView.style.display = 'block';
            if (unlockedView) unlockedView.style.display = 'none';
            return;
        }
        if (lockedView) lockedView.style.display = 'none';
        if (unlockedView) unlockedView.style.display = 'block';

        const visualFoculus = document.getElementById('fireplace-visual-foculus');
        if (visualFoculus) {
            visualFoculus.src = GameState.flags.fireplaceLit ? '/img/hearth_base_red.png' : '/img/hearth_base_dead.png';
        }

        const btnStick = document.getElementById('btn-fuel-stick');
        const btnLog = document.getElementById('btn-fuel-log');
        const bar = document.getElementById('fireplace-fuel-bar');
        const timeText = document.getElementById('fireplace-time-left');
        const statusText = document.getElementById('fireplace-status-text');

        if (!bar || !timeText) return;

        if (GameState.fire.active) {
            panel.style.display = 'block';
            if (statusText) statusText.textContent = t('fireplace.lit');

            let pct = (GameState.fire.fuelMs / this.MAX_FUEL_MS) * 100;
            if (pct > 100) pct = 100;
            if (pct < 0) pct = 0;
            bar.style.width = pct + '%';

            if (pct > 50) bar.style.backgroundColor = '#4ade80';
            else if (pct > 20) bar.style.backgroundColor = '#ffbd40';
            else bar.style.backgroundColor = '#ef4444';

            const totalMins = Math.floor(GameState.fire.fuelMs / 60000);
            const hours = Math.floor(totalMins / 60);
            const mins = totalMins % 60;
            timeText.textContent = `${hours}h ${mins}m`;

            const hasStick = (GameState.inventory['stick'] || 0) > 0;
            const hasLog = (GameState.inventory['log'] || 0) > 0;
            const canFitStick = (GameState.fire.fuelMs + this.FUEL_VALUES['stick']) <= this.MAX_FUEL_MS;
            const canFitLog = (GameState.fire.fuelMs + this.FUEL_VALUES['log']) <= this.MAX_FUEL_MS;

            if (btnStick) {
                btnStick.disabled = !hasStick || !canFitStick;
                btnStick.style.opacity = (!hasStick || !canFitStick) ? '0.5' : '1';
                const sQty = GameState.inventory['stick'] || 0;
                btnStick.textContent = `+ ${iName('stick')} (${sQty})`;
            }
            if (btnLog) {
                btnLog.disabled = !hasLog || !canFitLog;
                btnLog.style.opacity = (!hasLog || !canFitLog) ? '0.5' : '1';
                const lQty = GameState.inventory['log'] || 0;
                btnLog.textContent = `+ ${iName('log')} (${lQty})`;
            }
        } else {
            panel.style.display = 'block';
            if (statusText) statusText.textContent = t('fireplace.diedOutShort');
            bar.style.width = '0%';
            timeText.textContent = '0h 0m';
            if (btnStick) { btnStick.disabled = true; btnStick.style.opacity = '0.5'; btnStick.textContent = `+ ${iName('stick')}`; }
            if (btnLog) { btnLog.disabled = true; btnLog.style.opacity = '0.5'; btnLog.textContent = `+ ${iName('log')}`; }
        }
    }
};