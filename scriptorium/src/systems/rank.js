const RankSystem = {

    secular: [
        {
            id: 'laicus', name: 'Laicus', nameCz: 'Laický písař', tier: 1, icon: '📋',
            desc: 'Nováček v skriptoriu. Čistíš brka, mícháš inkoust, opisuješ modlitby pod dohledem.',
            lore: 'Písaři od 12 let začínali takto. Levá ruka držela nůž, pravá pero. Obě pracovaly vždy zároveň.',
            unlockCondition: { desc: 'Startovní rank', check: () => true },
            unlocks: { features: [] },
            toast: 'Jsi Laicus – nejnižší článek řetězce. Ale někde začít musíš.'
        },
        {
            id: 'librarius', name: 'Librarius', nameCz: 'Opisovač', tier: 2, icon: '📜',
            desc: 'Opisuješ samostatně. Liturgické texty, legendy. Nikdo nestojí za tvými zády.',
            lore: 'V Cîteaux (12. stol.) byli librarii nejnižším plně funkčním členem skriptoria. Na okraje psali: "Je mi zima. Inkoust je řídký."',
            unlockCondition: {
                desc: '5× research + zápisník',
                check: () => (GameState.achievements?.stats?.researchCount || 0) >= 5
            },
            unlocks: { features: ['library_basic'] },
            toast: 'Librarius – inkoust je na stole. Mistr tě sleduje jen z povzdálí.'
        },
        {
            id: 'antiquarius', name: 'Antiquarius', nameCz: 'Starší opisovač', tier: 3, icon: '✒️',
            desc: 'Opisuješ složité texty. Ostatní přepisují kalendáře – tobě dali Augustina.',
            lore: '"The antiquarii were senior scribes and the librarii junior scribes." Antiquarius stanovoval Ductus – rukopis celé dílny.',
            unlockCondition: {
                desc: '15 research + 2 tech odemčeny',
                check: () => (GameState.achievements?.stats?.researchCount || 0) >= 15
                          && (GameState.researchedTechs || []).length >= 2
            },
            unlocks: { features: ['library_advanced'] },
            toast: 'Antiquarius – tvůj Ductus je čitelný. Ostatní tě kopírují.'
        },
        {
            id: 'rubricator', name: 'Rubricator', nameCz: 'Rubrikátor', tier: 4, icon: '🔴',
            desc: 'Přidáváš červené nadpisy a iniciály. Rudá barva je jedovatá. Neoliž štětec.',
            lore: 'V prvotiscích jsou dodnes prázdné čtverečky – tam měla být iniciála, ale majitel nezaplatil rubrikátora.',
            unlockCondition: {
                desc: 'Tech iluminace + gallic_ink',
                check: () => (GameState.researchedTechs || []).includes('tech_illumination')
                          && (GameState.inventory['gallic_ink'] || 0) > 0
            },
            unlocks: { features: ['illumination_basic'] },
            toast: 'Rubricator – červená je tvoje. Pamatuj, co se stalo Mikuláši z Cluny.'
        },
        {
            id: 'illuminator', name: 'Illuminator', nameCz: 'Iluminátor', tier: 5, icon: '🎨',
            desc: 'Malíř. Zlatem, lapis lazuli, malachitem. Nejvíce placený v celém řetězci výroby.',
            lore: 'V zubním kameni jeptišky z Dalheim (11. stol.) našli lapis lazuli z Afghánistánu. Olizovala štětec při iluminaci. Ženy iluminátoři existovaly, jen se o nich nemluvilo.',
            unlockCondition: {
                desc: 'vellum_codex + tech_illumination + 25 research',
                check: () => (GameState.researchedTechs || []).includes('tech_illumination')
                          && (GameState.inventory['vellum_codex'] || 0) > 0
                          && (GameState.achievements?.stats?.researchCount || 0) >= 25
            },
            unlocks: { features: ['library_full', 'illumination_advanced'] },
            toast: 'Illuminator – lapis lazuli z Afghánistánu. Každá kapka stojí groš. Nekap.'
        },
        {
            id: 'stationarius', name: 'Stationarius', nameCz: 'Stacionář', tier: 6, icon: '📦',
            desc: 'Vedoucí dílny. Přijímáš zakázky. Rozhoduješ, co se bude opisovat. A co tisknout.',
            lore: 'Vespasiano da Bisticci (Florencie) odmítl přejít od rukopisů k tisku – a v roce 1480 zkrachoval. Flexibilní přežili.',
            unlockCondition: {
                desc: 'bishop_seal + 40 research',
                check: () => (GameState.inventory['bishop_seal'] || 0) > 0
                          && (GameState.achievements?.stats?.researchCount || 0) >= 40
            },
            unlocks: { features: ['trading_system'] },
            toast: 'Stationarius – máš dílnu. Za zdí klepe tiskařský lis. Zatím tě nepotřebuje.'
        }
    ],

    monastic: [
        {
            id: 'candidatus', name: 'Candidatus', nameCz: 'Uchazeč', tier: 'B1', icon: '🚪',
            desc: 'Klepeš na bránu. Opat tě odmítl. Přijď zítra.',
            lore: 'Řehole sv. Benedikta (kap. 58): "Nechť mu není přijímání ulehčeno." Čtyřikrát odmítni. Pokud vytrvá, teprve pak ho vpusť.',
            unlockCondition: { desc: 'Antiquarius+ a dobrovolná volba', check: () => RankSystem.getSecularRankTier() >= 3 },
            toast: 'Přistoupils ke bráně. Opat tě odmítl. Je třeba vytrvalosti.'
        },
        {
            id: 'novitius', name: 'Novitius', nameCz: 'Novic', tier: 'B2', icon: '🕊️',
            desc: 'Rok pod dohledem Magistra. Učíš se Řeholi, zpěvu, liturgii. Od nuly.',
            lore: 'Novic rok nesměl vlastnit osobní majetek. Pýcha byla důvodem k vyloučení.',
            unlockCondition: {
                desc: 'Candidatus + 24h + 10 research obětováno',
                check: () => GameState.rank?.monastic === 'candidatus'
                          && (Date.now() - (GameState.rank?.monasticStart || 0)) >= 24 * 60 * 60 * 1000
            },
            cost: { research: 10 },
            toast: 'Novitius – sundal jsi světský oděv. Co jsi byl venku, tady nehraje roli.'
        },
        {
            id: 'frater', name: 'Frater', nameCz: 'Mnich', tier: 'B3', icon: '✝️',
            desc: 'Složil jsi sliby. Stabilitas. Obedientia. Conversatio morum.',
            lore: 'Mniši v 15. stol. většinou nenajímali opisovače sami – najímali světské písaře. Mnich kontroloval a schvaloval.',
            unlockCondition: {
                desc: 'Novitius + 50 research + 7 Canonical Hours streak',
                check: () => GameState.rank?.monastic === 'novitius'
                          && (GameState.achievements?.stats?.researchCount || 0) >= 50
                          && (GameState.rank?.canonicalStreak || 0) >= 7
            },
            toast: 'Frater – modlitba v šest. Skriptorium v devět.'
        },
        {
            id: 'armarius', name: 'Armarius', nameCz: 'Vedoucí skriptoria', tier: 'B4', icon: '📚',
            desc: 'Klíče od regálů jsou teď tvoje starost. Ty rozhoduješ, co se opisuje.',
            lore: 'Armarius přiděloval suroviny, dohlížel na kopírování. Od 10. stol. zpíval 8. responsorium a držel lucernu při opátově čtení.',
            unlockCondition: {
                desc: 'Frater + 75 research',
                check: () => GameState.rank?.monastic === 'frater'
                          && (GameState.achievements?.stats?.researchCount || 0) >= 75
            },
            toast: 'Armarius – skriptorium je tvoje. Každý písař čeká na tvé slovo.'
        },
        {
            id: 'prior', name: 'Prior', nameCz: 'Prior', tier: 'B5', icon: '👑',
            desc: 'Druhý v klášteře. Nejsi povýšen za body – jsi jmenován za zásluhy.',
            lore: 'Prior nebyl kariérní postup – byl jmenován nebo volen komunitou. Opat ho mohl kdykoliv odvolat.',
            unlockCondition: {
                desc: 'Armarius + nomination event',
                check: () => GameState.rank?.monastic === 'armarius'
                          && (GameState.rank?.priorNomination || false) === true
            },
            toast: 'Prior – Opat tě jmenoval. Komunita tě přijala.'
        }
    ],

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

    promoteSecular: function(rankId) {
        if (!GameState.rank) this._initRankState();
        const oldRank = GameState.rank.secular;
        GameState.rank.secular = rankId;
        GameState.rank.rankHistory = GameState.rank.rankHistory || [];
        GameState.rank.rankHistory.push({ type: 'promotion', from: oldRank, to: rankId, ts: Date.now() });
        const rank = this.secular.find(r => r.id === rankId);
        if (rank) UI.notify(`⬆️ ${rank.icon} ${rank.nameCz}! ${rank.toast}`);
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

    enterMonasticPath: function() {
        if (this.getSecularRankTier() < 3) {
            UI.notify('⛔ Musíš být alespoň Antiquarius, aby tě klášter přijal.', true);
            return false;
        }
        if (!confirm('Vstoupit na klášterní cestu? Tato volba změní tvůj postup.')) return false;
        if (!GameState.rank) this._initRankState();
        GameState.rank.path = 'monastic';
        GameState.rank.monastic = 'candidatus';
        GameState.rank.monasticStart = Date.now();
        UI.notify('🚪 Klepeš na bránu. Opat tě odmítl. Přijď zítra.');
        Game.save();
        return true;
    },

    renderRankBadge: function() {
        if (!GameState.rank) return '';
        const monasticId = GameState.rank.monastic;
        const active = monasticId
            ? (this.monastic.find(r => r.id === monasticId) || this.getCurrentSecularRank())
            : this.getCurrentSecularRank();
        return `<span style="font-size:0.75rem; padding:2px 8px; border:1px solid var(--accent-gold); border-radius:3px; color:var(--accent-gold); font-family:'Cinzel',serif;" title="${active.lore}">${active.icon} ${active.nameCz}</span>`;
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

// ═══════════════════════════════════════════════════════════════════════
// i18n — STRINGS (CS / EN) + t() + LangSystem
// Přidat nové klíče sem. Nikdy nesmazat CS fallback.
// ═══════════════════════════════════════════════════════════════════════
