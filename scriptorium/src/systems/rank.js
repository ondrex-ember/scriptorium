const RankSystem = {

    // ═══════════════════════════════════════════════════════════════════════
    // SECULAR RANKS (6 tiers) — TEXT PROPERTIES REMOVED, USE t() INSTEAD
    // ═══════════════════════════════════════════════════════════════════════
    secular: [
        {
            id: 'laicus',
            tier: 1,
            icon: '📋',
            unlockCondition: {
                check: () => true
            },
            unlocks: { features: [] }
        },
        {
            id: 'librarius',
            tier: 2,
            icon: '📜',
            unlockCondition: {
                check: () => (GameState.achievements?.stats?.researchCount || 0) >= 5
            },
            unlocks: { features: ['library_basic'] }
        },
        {
            id: 'antiquarius',
            tier: 3,
            icon: '✒️',
            unlockCondition: {
                check: () => (GameState.achievements?.stats?.researchCount || 0) >= 15
                          && (GameState.researchedTechs || []).length >= 2
            },
            unlocks: { features: ['library_advanced'] }
        },
        {
            id: 'rubricator',
            tier: 4,
            icon: '🔴',
            unlockCondition: {
                check: () => (GameState.researchedTechs || []).includes('tech_illumination')
                          && (GameState.inventory['gallic_ink'] || 0) > 0
            },
            unlocks: { features: ['illumination_basic'] }
        },
        {
            id: 'illuminator',
            tier: 5,
            icon: '🎨',
            unlockCondition: {
                check: () => (GameState.researchedTechs || []).includes('tech_illumination')
                          && (GameState.inventory['vellum_codex'] || 0) > 0
                          && (GameState.achievements?.stats?.researchCount || 0) >= 25
            },
            unlocks: { features: ['library_full', 'illumination_advanced'] }
        },
        {
            id: 'stationarius',
            tier: 6,
            icon: '📦',
            unlockCondition: {
                check: () => (GameState.inventory['bishop_seal'] || 0) > 0
                          && (GameState.achievements?.stats?.researchCount || 0) >= 40
            },
            unlocks: { features: ['trading_system'] }
        }
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // MONASTIC RANKS (5 tiers) — TEXT PROPERTIES REMOVED, USE t() INSTEAD
    // ═══════════════════════════════════════════════════════════════════════
    monastic: [
        {
            id: 'candidatus',
            tier: 'B1',
            icon: '🚪',
            unlockCondition: {
                check: () => RankSystem.getSecularRankTier() >= 3
            }
        },
        {
            id: 'novitius',
            tier: 'B2',
            icon: '🕊️',
            unlockCondition: {
                check: () => GameState.rank?.monastic === 'candidatus'
                          && (Date.now() - (GameState.rank?.monasticStart || 0)) >= 24 * 60 * 60 * 1000
            },
            cost: { research: 10 }
        },
        {
            id: 'frater',
            tier: 'B3',
            icon: '✝️',
            unlockCondition: {
                check: () => GameState.rank?.monastic === 'novitius'
                          && (GameState.achievements?.stats?.researchCount || 0) >= 50
                          && (GameState.rank?.canonicalStreak || 0) >= 7
            }
        },
        {
            id: 'armarius',
            tier: 'B4',
            icon: '📚',
            unlockCondition: {
                check: () => GameState.rank?.monastic === 'frater'
                          && (GameState.achievements?.stats?.researchCount || 0) >= 75
            }
        },
        {
            id: 'prior',
            tier: 'B5',
            icon: '👑',
            unlockCondition: {
                check: () => GameState.rank?.monastic === 'armarius'
                          && (GameState.rank?.priorNomination || false) === true
            }
        }
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS — NEW: Use t() for all text lookups
    // ═══════════════════════════════════════════════════════════════════════

    getRankName: function(rankId) {
        return t(`ranks.${rankId}_name`);
    },

    getRankNameShort: function(rankId) {
        return t(`ranks.${rankId}_name_short`);
    },

    getRankDesc: function(rankId) {
        return t(`ranks.${rankId}_desc`);
    },

    getRankLore: function(rankId) {
        return t(`ranks.${rankId}_lore`);
    },

    getRankToast: function(rankId) {
        return t(`ranks.${rankId}_toast`);
    },

    getRankRequirement: function(rankId) {
        return t(`ranks.${rankId}_requirement`);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EXISTING FUNCTIONS — MODIFIED to use t()
    // ═══════════════════════════════════════════════════════════════════════

    getSecularRankTier: function() {
        const rankId = GameState.rank?.secular || 'laicus';
        const rank = this.secular.find(r => r.id === rankId);
        return rank ? rank.tier : 1;
    },

    getCurrentSecularRank: function() {
        const rankId = GameState.rank?.secular || 'laicus';
        return this.secular.find(r => r.id === rankId) || this.secular[0];
    },

    checkSecularProgress: function() {
        const currentTier = this.getSecularRankTier();
        const nextRank = this.secular[currentTier]; // tier je 1-based, pole 0-based
        if (!nextRank) return false;
        if (!nextRank.unlockCondition.check()) return false;
        this.promoteSecular(nextRank.id);
        return true;
    },

    // MODIFIED: Use t() for rank name and toast
    promoteSecular: function(rankId) {
        if (!GameState.rank) this._initRankState();
        const oldRank = GameState.rank.secular;
        GameState.rank.secular = rankId;
        GameState.rank.rankHistory = GameState.rank.rankHistory || [];
        GameState.rank.rankHistory.push({ type: 'promotion', from: oldRank, to: rankId, ts: Date.now() });
        
        const rank = this.secular.find(r => r.id === rankId);
        if (rank) {
            const rankName = this.getRankName(rankId);
            const toast = this.getRankToast(rankId);
            UI.notify(`⬆️ ${rank.icon} ${rankName}! ${toast}`);
        }
        
        Analytics.rankPromoted(oldRank, rankId, GameState.rank.path || 'secular');
        Game.save();
    },

    demoteSecular: function() {
        const currentTier = this.getSecularRankTier();
        if (currentTier <= 1) return;
        const prevRank = this.secular[currentTier - 2];
        const old = GameState.rank.secular;
        GameState.rank.secular = prevRank.id;
        GameState.rank.rankHistory = GameState.rank.rankHistory || [];
        GameState.rank.rankHistory.push({ type: 'demotion', from: old, to: prevRank.id, ts: Date.now() });
    },

    // MODIFIED: Use t() for messages
    enterMonasticPath: function() {
        if (this.getSecularRankTier() < 3) {
            UI.notify(t('rank.monasticNotEligible'), true);
            return false;
        }
        if (!confirm(t('rank.monasticEntry') + '?')) return false;
        
        if (!GameState.rank) this._initRankState();
        GameState.rank.path = 'monastic';
        GameState.rank.monastic = 'candidatus';
        GameState.rank.monasticStart = Date.now();
        
        const toastMsg = this.getRankToast('candidatus');
        UI.notify('🚪 ' + toastMsg);
        Game.save();
        return true;
    },

    // MODIFIED: Use t() for display name and lore
    renderRankBadge: function() {
        if (!GameState.rank) return '';
        const monasticId = GameState.rank.monastic;
        const active = monasticId
            ? (this.monastic.find(r => r.id === monasticId) || this.getCurrentSecularRank())
            : this.getCurrentSecularRank();
        
        const displayName = this.getRankNameShort(active.id);
        const lore = this.getRankLore(active.id);
        
        return `<span style="font-size:0.75rem; padding:2px 8px; border:1px solid var(--accent-gold); border-radius:3px; color:var(--accent-gold); font-family:'Cinzel',serif;" title="${lore}">${active.icon} ${displayName}</span>`;
    },

    _initRankState: function() {
        GameState.rank = {
            secular: 'laicus', monastic: null, path: 'secular',
            monasticStart: 0, canonicalStreak: 0, priorNomination: false,
            disciplines: [], rankHistory: []
        };
    },

    init: function() {
        if (!GameState.rank) this._initRankState();
        // Migrace starých savů – přidat chybějící pole
        if (GameState.rank.canonicalStreak === undefined) GameState.rank.canonicalStreak = 0;
        if (!GameState.rank.rankHistory) GameState.rank.rankHistory = [];
        // Zkontrolovat možný postup
        this.checkSecularProgress();
        console.log('[RankSystem] OK – rank:', GameState.rank.secular);
    }
};