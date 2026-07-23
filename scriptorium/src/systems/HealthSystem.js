// ═══════════════════════════════════════════════════════════════════════════
// HEALTH SYSTEM (Valetudo)
// Varianta B — úvodní zásah + průběžný tik/hod + přirozené vypršení + léčba.
// Viz health-system-reference.md v0.2.
// ═══════════════════════════════════════════════════════════════════════════

const HealthSystem = {

    isActive: function(id) {
        return !!(GameState.health && GameState.health.active && GameState.health.active[id]);
    },

    _applyDelta: function(satietyDelta, fatigueDelta) {
        if (typeof VigorSystem === 'undefined') return;
        if (typeof satietyDelta === 'number' && satietyDelta !== 0) {
            GameState.satiety = Math.max(0, Math.min(VigorSystem.MAX_SATIETY, (GameState.satiety || 0) + satietyDelta));
        }
        if (typeof fatigueDelta === 'number' && fatigueDelta !== 0) {
            GameState.fatigue = Math.max(0, Math.min(VigorSystem.MAX_FATIGUE, (GameState.fatigue || 0) + fatigueDelta));
        }
    },

    addCondition: function(id) {
        if (!GameState.health) GameState.health = { active: {} };
        if (!GameState.health.active) GameState.health.active = {};
        if (!GameState.health.everHad) GameState.health.everHad = [];
        const def = HealthConditionsDB[id];
        if (!def) return;
        const now = Date.now();

        // Trvalý záznam "kdy jsem tohle měl aspoň jednou" — pro Valetudo
        // encyklopedii (monastery-decay-mrd), nezávislé na tom, jestli je
        // aktuálně aktivní nebo už dávno vyléčené.
        if (!GameState.health.everHad.includes(id)) GameState.health.everHad.push(id);

        if (this.isActive(id)) {
            // Už aktivní — prodloužit na plné trvání znovu, ne duplicitně stackovat úvodní zásah
            GameState.health.active[id].expiresAt = now + def.durationHours * 3600000;
            return;
        }

        GameState.health.active[id] = { startedAt: now, expiresAt: now + def.durationHours * 3600000 };

        if (def.onApply) this._applyDelta(def.onApply.satiety, def.onApply.fatigue);

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const msg = lang === 'en' ? (def.desc_en || def.name_en) : (def.desc || def.name);
        if (typeof UI !== 'undefined' && UI.notifyPanel) UI.notifyPanel(msg, 'system');
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
            Game.addKronikaEntry('important', `${def.name}: ${def.desc}`, `${def.name_en}: ${def.desc_en}`, '');
        }
        if (typeof VigorSystem !== 'undefined' && VigorSystem.renderPill) VigorSystem.renderPill();

        // Organický trigger pro Athanor Tier I (MRD: athanor-tiers)
        if (typeof SecretsSystem !== 'undefined' && SecretsSystem.checkOrganicAthanorUnlock) {
            SecretsSystem.checkOrganicAthanorUnlock();
        }
    },

    removeCondition: function(id, cured) {
        if (!GameState.health || !GameState.health.active || !GameState.health.active[id]) return;
        const def = HealthConditionsDB[id];
        delete GameState.health.active[id];
        if (def && typeof UI !== 'undefined' && UI.notifyPanel) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            const name = lang === 'en' ? def.name_en : def.name;
            const key = cured ? 'health.cured' : 'health.expired';
            const msg = (typeof t === 'function' ? t(key) : (cured ? '{name} cured.' : '{name} expired.')).replace('{name}', name);
            UI.notifyPanel(msg, 'system');
        }
    },

    // Volat z VigorSystem._tick() se stejným 'elapsed' (ms), co se používá pro Satiety/Fatigue drain.
    tickAll: function(elapsedMs) {
        if (!GameState.health || !GameState.health.active) return;
        const now = Date.now();
        for (const id of Object.keys(GameState.health.active)) {
            const inst = GameState.health.active[id];
            const def = HealthConditionsDB[id];
            if (!def || !inst) { delete GameState.health.active[id]; continue; }
            if (now >= inst.expiresAt) { this.removeCondition(id, false); continue; }
            if (def.tickHour) {
                const hours = elapsedMs / 3600000;
                const sDelta = typeof def.tickHour.satiety === 'number' ? def.tickHour.satiety * hours : 0;
                const fDelta = typeof def.tickHour.fatigue === 'number' ? def.tickHour.fatigue * hours : 0;
                this._applyDelta(sDelta, fDelta);
            }
        }
    },

    // Zkusí najít aktivní neduh, který daný item léčí, a odstraní ho. Vrací true, pokud něco vyléčil.
    cureWith: function(itemId) {
        if (!GameState.health || !GameState.health.active) return false;
        for (const id of Object.keys(GameState.health.active)) {
            const def = HealthConditionsDB[id];
            if (def && def.cures && def.cures.includes(itemId)) {
                this.removeCondition(id, true);
                return true;
            }
        }
        return false;
    },

    // ── Infirmerie (titivillus-infirmary-mrd) — hráčova vlastní zkratka,
    // samostatná od klášterního Infirmaria (budova/tech/NPC admission).
    // Spotřebuje 1× Hřejivou mast, zkrátí léčení infirmaryEligible neduhu
    // na 24h výměnou. Dřív volaná z UI, ale nikde neimplementovaná — doplněno.
    enterInfirmary: function(conditionId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.health || !GameState.health.active || !GameState.health.active[conditionId]) return;
        const def = HealthConditionsDB[conditionId];
        if (!def || !def.infirmaryEligible) return;
        if (GameState.infirmaryTimer) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(lang==='en' ? 'The infirmary is occupied.' : 'Infirmerie je obsazená.', true);
            return;
        }
        const salveCount = (GameState.inventory && GameState.inventory['unguentum_calidum']) || 0;
        if (salveCount < 1) {
            if (typeof UI !== 'undefined' && UI.notify) UI.notify(lang==='en' ? 'You need a Warming Salve.' : 'Potřebuješ Hřejivou mast.', true);
            return;
        }
        if (typeof Game !== 'undefined' && Game.removeItem) Game.removeItem('unguentum_calidum', 1);
        const endTime = Date.now() + 24 * 3600000;
        GameState.infirmaryTimer = { conditionId: conditionId, endTime: endTime };
        // Zkrať zbývající léčení na 24h, pokud by jinak trvalo déle
        const inst = GameState.health.active[conditionId];
        if (inst && inst.expiresAt > endTime) inst.expiresAt = endTime;
        if (typeof UI !== 'undefined' && UI.notifyPanel) {
            UI.notifyPanel('🛏️ ' + (lang==='en' ? 'You enter the infirmary to rest.' : 'Odcházíš odpočívat do infirmerie.'), 'system');
        }
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.render) PersonaSystem.render();
    },

    // Volat z ticku (self-guarded) — jen kontroluje čas, uvolní infirmerii po 24h.
    checkInfirmaryTimer: function() {
        if (!GameState.infirmaryTimer) return;
        if (Date.now() >= GameState.infirmaryTimer.endTime) {
            GameState.infirmaryTimer = null;
            if (typeof Game !== 'undefined' && Game.save) Game.save();
        }
    },
};
