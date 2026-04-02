// ═══════════════════════════════════════════════════════════════
// CONSENT MANAGER – správa souhlasu s analytics
// ═══════════════════════════════════════════════════════════════
const ConsentManager = {
    STORAGE_KEY: 'scriptorium_consent',

    init: function() {
        const consent = localStorage.getItem(this.STORAGE_KEY);
        const banner = document.getElementById('consent-banner');
        // Nezobrazovat banner pokud ještě nebyl zvolen jazyk — afterLangPicked() to udělá
        if (!GameState.settings.langChosen) return;
        if (consent === null) {
            if (banner) banner.style.display = 'block';
        } else {
            if (consent === 'granted') loadGA();
        }
    },

    grant: function() {
        localStorage.setItem(this.STORAGE_KEY, 'granted');
        document.getElementById('consent-banner').style.display = 'none';
        loadGA();
        Analytics.event('consent', { action: 'granted' });
        // Po souhlasu spustit intro modal pokud je firstVisit
        this._afterDecision();
    },

    deny: function() {
        localStorage.setItem(this.STORAGE_KEY, 'denied');
        document.getElementById('consent-banner').style.display = 'none';
        // Po odmítnutí stejně spustit intro modal
        this._afterDecision();
    },

    _afterDecision: function() {
        // Intro modal se zobrazí jen pro nového hráče
        if (GameState.flags && GameState.flags.firstVisit) {
            setTimeout(() => {
                UI.showWelcomeModal();
                GameState.flags.firstVisit = false;
                Game.save();
            }, 400);
        }
    },

    showPolicy: function() {
        const L = STRINGS[GameState.settings.language || 'cs'] || STRINGS.cs;
        alert(L.consent.policyTitle + '\n\n' + L.consent.policyBody);
    }
};

// ═══════════════════════════════════════════════════════════════
// ANALYTICS – centrální objekt pro všechny události
// Každá metoda bezpečně selže pokud GA není načteno.
// ═══════════════════════════════════════════════════════════════
const Analytics = {

    // Základní event wrapper – vždy přes tuto funkci
    event: function(eventName, params) {
        if (typeof gtag !== 'function') return; // GA není načteno, tiše ignoruj
        gtag('event', eventName, params || {});
    },

    // ── ONBOARDING ──────────────────────────────────────────────
    firstVisit: function() {
        this.event('first_visit_game', { event_category: 'onboarding' });
    },
    welcomeModalClosed: function() {
        this.event('welcome_modal_closed', { event_category: 'onboarding' });
    },
    fireplaceIgnited: function(isFirstTime) {
        this.event('fireplace_ignited', {
            event_category: 'onboarding',
            first_time: isFirstTime
        });
    },

    // ── RESEARCH & TECH ─────────────────────────────────────────
    techUnlocked: function(techId, techName, cost) {
        this.event('tech_unlocked', {
            event_category: 'progression',
            tech_id: techId,
            tech_name: techName,
            research_cost: cost
        });
    },
    researchCrafted: function(totalResearch) {
        this.event('research_crafted', {
            event_category: 'crafting',
            total_research: totalResearch
        });
    },

    // ── CRAFTING ────────────────────────────────────────────────
    itemCrafted: function(itemId, itemName, category) {
        this.event('item_crafted', {
            event_category: 'crafting',
            item_id: itemId,
            item_name: itemName,
            item_category: category
        });
    },
    titivillusStruck: function(itemId, isNight) {
        this.event('titivillus_struck', {
            event_category: 'events',
            stolen_item: itemId,
            was_night: isNight
        });
    },

    // ── LIBRARY & BOOKS ─────────────────────────────────────────
    bookRead: function(bookId, bookTitle) {
        this.event('book_read', {
            event_category: 'library',
            book_id: bookId,
            book_title: bookTitle
        });
    },

    // ── ACHIEVEMENTS ────────────────────────────────────────────
    achievementUnlocked: function(achievId, achievName) {
        this.event('achievement_unlocked', {
            event_category: 'progression',
            achievement_id: achievId,
            achievement_name: achievName
        });
    },

    // ── RANK SYSTEM ─────────────────────────────────────────────
    rankPromoted: function(fromRank, toRank, path) {
        this.event('rank_promoted', {
            event_category: 'progression',
            from_rank: fromRank,
            to_rank: toRank,
            career_path: path // 'secular' nebo 'monastic'
        });
    },

    // ── SESSION ─────────────────────────────────────────────────
    dailyRewardClaimed: function(streak) {
        this.event('daily_reward_claimed', {
            event_category: 'retention',
            streak_days: streak
        });
    },
    sessionStart: function(totalLogins, daysSinceLastSeen) {
        this.event('session_start_game', {
            event_category: 'retention',
            total_logins: totalLogins,
            days_since_last: Math.floor(daysSinceLastSeen)
        });
    },

    // ── THEME ───────────────────────────────────────────────────
    themeChanged: function(themeName) {
        this.event('theme_changed', {
            event_category: 'ui',
            theme: themeName
        });
    },
    languageSwitched: function(from, to) {
        this.event('language_switched', {
            event_category: 'ui',
            language_from: from,
            language_to: to,
            game_day: GameState.dailyRewards ? GameState.dailyRewards.totalLogins : 0
        });
    }
};

// ConsentManager.init() se volá z Game.init() jako poslední krok

// ── SERVICE WORKER – registrace pro PWA / offline ───────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ SW registered:', reg.scope))
            .catch(err => console.log('SW registration failed:', err));
    });
}

window.onload = Game.init;
