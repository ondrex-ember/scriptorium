// ============================================
//  ChroniconSystem
//  Fetchuje chronicon_snapshot.json z GitHubu.
//  Injectuje chronicle záznamy do NotificationSystem
//  jako kategorii 'chronicon'.
//  Read-only — nikdy nepíše do GameState.
// ============================================

const ChroniconSystem = {

    URL:       'https://raw.githubusercontent.com/ondrex-ember/chronicon/main/data/chronicon_snapshot.json',
    CACHE_KEY: 'scriptorium_chronicon_v2',
    SEEN_KEY:  'scriptorium_chronicon_seen',
    TTL:       6 * 60 * 60 * 1000,   // 6 hodin v ms

    _snap: null,
    MAX_PER_LOAD: 4,   // Max nových záznamů zobrazených při jednom načtení

    init: function() {
        ChroniconSystem.initLocalState();
        const cached = ChroniconSystem._loadCache();
        if (cached) {
            ChroniconSystem._snap = cached;
            ChroniconSystem._apply(cached);
        }
        // Vždy zkus fetch — pokud je cache čerstvá, server odpoví rychle z CDN
        ChroniconSystem._fetch();
    },

    // ─── Local State Engine & Dynamic Multi-directional Mechanics ──────────

    initLocalState: function() {
        if (typeof GameState === 'undefined') return;
        if (!GameState.chroniconLocal) {
            GameState.chroniconLocal = {
                lastTick: Date.now(),
                actors: {
                    vrchnost: { mood: 75, wealth: 85, status: 'normal', level: 1, quest: null },
                    mlynar:   { mood: 65, wealth: 60, status: 'normal', level: 1, quest: null },
                    kovar:    { mood: 70, wealth: 55, status: 'normal', level: 1, quest: null },
                    uhlic:    { mood: 50, wealth: 40, status: 'normal', level: 1, quest: null },
                    vorar:    { mood: 60, wealth: 50, status: 'normal', level: 1, quest: null },
                    rybnikar: { mood: 80, wealth: 70, status: 'normal', level: 1, quest: null },
                    prevoznik:{ mood: 55, wealth: 45, status: 'normal', level: 1, quest: null },
                    valach:   { mood: 65, wealth: 50, status: 'normal', level: 1, quest: null },
                    klaster:  { mood: 85, wealth: 75, status: 'normal', level: 1, quest: null },
                    vcelar:   { mood: 90, wealth: 65, status: 'normal', level: 1, quest: null },
                },
                history: [],
                stats: { totalHelped: 0, totalTraded: 0 }
            };
        }
        // Doplnění chybějících aktérů — základní seznam + cokoliv navíc,
        // co už dorazilo ze skutečného Chroniconu (např. sklář,
        // 29.7.2026). Bez tohohle "Požehnat" na novém aktérovi tiše nic
        // neudělá (chroniconLocal.actors[id] by bylo undefined a
        // interactWithActor() by na `if (!actor) return;` skončila potichu).
        const defaultList = ['vrchnost','mlynar','kovar','uhlic','vorar','rybnikar','prevoznik','valach','klaster','vcelar'];
        const snapActorIds = (ChroniconSystem._snap && Array.isArray(ChroniconSystem._snap.actors))
            ? ChroniconSystem._snap.actors.map(a => a.id)
            : [];
        const allIds = Array.from(new Set(defaultList.concat(snapActorIds)));
        allIds.forEach(id => {
            if (!GameState.chroniconLocal.actors[id]) {
                GameState.chroniconLocal.actors[id] = { mood: 70, wealth: 60, status: 'normal', level: 1, quest: null };
            }
        });

        // Repair starých savů — quest se ukládal jako "zamrzlá" kopie hodnot
        // v momentě vzniku, takže hráči, co měli aktivní quest ještě před
        // opravou (tallow/tallow_candle/dye_vermilion ID mismatch, 6.8.2026),
        // mají v save napořád rozbité hodnoty. Ty se samy neopraví — bez tohohle
        // by zůstal quest navždy nesplnitelný (žádné tlačítko na jeho zrušení).
        Object.keys(GameState.chroniconLocal.actors).forEach(id => {
            const a = GameState.chroniconLocal.actors[id];
            const canonical = ChroniconSystem.QUEST_TYPES[id];
            if (a.quest && canonical && (a.quest.needItem !== canonical.needItem || a.quest.giveItem !== canonical.giveItem)) {
                a.quest = { ...canonical, created: a.quest.created || Date.now() };
            }
        });
    },

    getBuffs: function() {
        const snap = ChroniconSystem._snap || {};
        const realActors = Array.isArray(snap.actors) ? snap.actors : [];
        const findMood = (id, fallback) => {
            const a = realActors.find(x => x.id === id);
            return (a && typeof a.mood === 'number') ? a.mood : fallback;
        };
        const findWealth = (id, fallback) => {
            const a = realActors.find(x => x.id === id);
            return (a && typeof a.wealth === 'number') ? a.wealth : fallback;
        };

        const tension = (snap.region && typeof snap.region.tension === 'number') ? snap.region.tension : 25;
        const goldenAge = !!(snap.region && snap.region.goldenAge);

        const klasterMood  = findMood('klaster', 85);
        const mlynarWealth = findWealth('mlynar', 60);
        const vrchnostMood = findMood('vrchnost', 75);
        const kovarMood    = findMood('kovar', 70);
        const vcelarMood   = findMood('vcelar', 90);

        return {
            tension: tension,
            goldenAge: goldenAge,
            scriptXpBonus: (goldenAge ? 0.25 : 0) + (klasterMood >= 80 ? 0.15 : 0),
            vigorRegenBonus: tension < 30 ? 0.15 : (tension > 70 ? -0.15 : 0),
            craftSuccessBonus: kovarMood >= 75 ? 0.10 : 0,
            tallowCostDiscount: vcelarMood >= 80 ? 0.20 : 0,
            portaVisitorBonus: vrchnostMood >= 80 ? 0.30 : 0,
            cellariumExtraYield: mlynarWealth >= 70 ? 1 : 0,
            // abbot-persona-mrd (9.8.2026) — LOKÁLNÍ modifikátor (ne ze
            // sdíleného snapshotu jako ostatní pole výše), ale patří sem
            // logicky (odměny/požehnání skrz postavu opata). ±1 %/bod
            // abbotFavor, strop ±25 %.
            abbotFavorRewardMult: (() => {
                const favor = (typeof GameState !== 'undefined' && GameState.secrets && GameState.secrets.abbotFavor) || 0;
                return 1 + Math.max(-0.25, Math.min(0.25, favor * 0.01));
            })(),
        };
    },

    onPlayerAction: function(actionType, detail) {
        ChroniconSystem.initLocalState();
        if (typeof GameState === 'undefined' || !GameState.chroniconLocal) return;
        const actors = GameState.chroniconLocal.actors;
        let msg_cs = '';
        let msg_en = '';

        if (actionType === 'complete_script') {
            if (actors.klaster) actors.klaster.mood = Math.min(100, actors.klaster.mood + 3);
            if (actors.vrchnost) actors.vrchnost.mood = Math.min(100, actors.vrchnost.mood + 2);
            msg_cs = 'Dokončení opisování posílilo duchovní autoritu kláštera u vrchnosti!';
            msg_en = 'Completing manuscript copying strengthened monastery prestige!';
        } else if (actionType === 'cook_food') {
            if (actors.mlynar) actors.mlynar.mood = Math.min(100, actors.mlynar.mood + 2);
            if (actors.rybnikar) actors.rybnikar.wealth = Math.min(100, actors.rybnikar.wealth + 1);
            msg_cs = 'Příprava pokrmů z lokálních zásob těší mlynáře i rybníkáře.';
            msg_en = 'Preparing meals with local supplies pleases local millers and fishermen.';
        } else if (actionType === 'craft_candle' || actionType === 'light_candle') {
            if (actors.vcelar) actors.vcelar.mood = Math.min(100, actors.vcelar.mood + 2);
            msg_cs = 'Práce se svícemi a voskem podporuje cech včelařů.';
            msg_en = 'Work with candles supports the beekeepers guild.';
        } else if (actionType === 'trade_porta') {
            if (actors.prevoznik) actors.prevoznik.mood = Math.min(100, actors.prevoznik.mood + 2);
            if (actors.vrchnost) actors.vrchnost.wealth = Math.min(100, actors.vrchnost.wealth + 1);
            msg_cs = 'Čilý ruch u klášterní brány přináší zisk převozníkovi.';
            msg_en = 'Lively gate trade boosts local ferryman commerce.';
        } else if (actionType === 'prayer' || actionType === 'liturgy') {
            if (actors.klaster) actors.klaster.mood = Math.min(100, actors.klaster.mood + 4);
            msg_cs = 'Duchovní hodinky a mše šíří mír po celém kraji.';
            msg_en = 'Divine hours and mass spread peace throughout the region.';
        }

        if (msg_cs && Math.random() < 0.35) {
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.toast('📜 ' + (lang === 'en' ? msg_en : msg_cs), 'info');
            }
        }
    },

    _lastWorldTick: 0,
    localWorldTick: function() {
        ChroniconSystem.initLocalState();
        const now = Date.now();
        // Spouští se každých 30 sekund
        if (now - ChroniconSystem._lastWorldTick < 30000) return;
        ChroniconSystem._lastWorldTick = now;

        if (typeof GameState === 'undefined' || !GameState.chroniconLocal) return;
        const actors = GameState.chroniconLocal.actors;

        // Skutečný wealth ze sdíleného Chronicon snapshotu (ne lokální kopie)
        // — určuje, jak moc je aktér "v nouzi" v živém světě.
        const snap = ChroniconSystem._snap || {};
        const realActors = Array.isArray(snap.actors) ? snap.actors : [];
        const realWealth = (id, fallback) => {
            const ra = realActors.find(x => x.id === id);
            return (ra && typeof ra.wealth === 'number') ? ra.wealth : fallback;
        };

        // Organická živá fluktuace nálady a jmění (+-1)
        Object.keys(actors).forEach(id => {
            const a = actors[id];
            const moodDelta = Math.floor(Math.random() * 5) - 2; // -2 až +2
            const wealthDelta = Math.floor(Math.random() * 3) - 1; // -1 až +1
            a.mood = Math.max(25, Math.min(100, a.mood + moodDelta));
            a.wealth = Math.max(20, Math.min(100, a.wealth + wealthDelta));

            // Šance na požadavek podle skutečné nouze ve světě (chronicon-link-mrd,
            // 6.8.2026) — chudý aktér prosí častěji, bohatý skoro nikdy. Pořád
            // respektuje cooldown po posledním splnění (QUEST_COOLDOWN_MS).
            const w = realWealth(id, 50);
            const questChance = w < 35 ? 0.30 : (w > 60 ? 0.05 : 0.12);
            if (!a.quest && (!a.questCooldownUntil || now >= a.questCooldownUntil) && Math.random() < questChance) {
                ChroniconSystem._generateActorQuest(id, a);
            }
        });

        ChroniconSystem.updateUIHeader();
    },

    // Cooldown po splnění questu — 6h reálného času, mirror Chronicon
    // vlastního cronu (4x/den = jednou za 6h). Bez tohohle aktér chtěl
    // hned zase další věc (testeři, 6.8.2026).
    QUEST_COOLDOWN_MS: 6 * 60 * 60 * 1000,

    QUEST_TYPES: {
        mlynar:   { needItem: 'wood', needQty: 4, giveItem: 'flour', giveQty: 8, label_cs: 'Potřebuje 4x Dřevo na opravu náhonu', label_en: 'Needs 4x Wood to fix the mill' },
        vcelar:   { needItem: 'fat', needQty: 2, giveItem: 'beeswax', giveQty: 3, label_cs: 'Potřebuje 2x Lůj na ošetření úlů', label_en: 'Needs 2x Tallow for hives' },
        kovar:    { needItem: 'charcoal', needQty: 3, giveItem: 'iron_ingot', giveQty: 2, label_cs: 'Potřebuje 3x Dřevěné uhlí do výhně', label_en: 'Needs 3x Charcoal for forge' },
        vrchnost: { needItem: 'gold', needQty: 15, giveItem: 'cinnabar', giveQty: 2, label_cs: 'Žádá příspěvek 15 Zlatých na obranu', label_en: 'Requests 15 Gold contribution' },
        uhlic:    { needItem: 'wood', needQty: 5, giveItem: 'charcoal', giveQty: 6, label_cs: 'Potřebuje 5x Dřevo na nový milíř', label_en: 'Needs 5x Wood for kiln' },
        rybnikar: { needItem: 'salt', needQty: 2, giveItem: 'fish', giveQty: 5, label_cs: 'Potřebuje 2x Sůl na nasolení ryb', label_en: 'Needs 2x Salt to cure fish' },
        valach:   { needItem: 'bread', needQty: 2, giveItem: 'wool', giveQty: 4, label_cs: 'Potřebuje 2x Chléb pro pastevce', label_en: 'Needs 2x Bread for shepherds' },
        klaster:  { needItem: 'candle', needQty: 2, giveItem: 'script_notes', giveQty: 10, label_cs: 'Prosí o 2x Svíčku na noční modlitby', label_en: 'Needs 2x Candles for vigils' },
    },

    _generateActorQuest: function(id, actor) {
        const q = ChroniconSystem.QUEST_TYPES[id];
        if (q) {
            actor.quest = { ...q, created: Date.now() };
        }
    },

    interactWithActor: function(actorId, action) {
        ChroniconSystem.initLocalState();
        if (typeof GameState === 'undefined' || !GameState.chroniconLocal) return;
        const actors = GameState.chroniconLocal.actors;
        const actor = actors[actorId];
        if (!actor) return;

        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const inv = GameState.inventory || {};

        // Reálné jméno ze snapshotu (dřív se tu čekal actor.label, který na
        // lokálním objektu nikdy neexistoval — zprávy hlásily "undefined").
        const snapActor = (ChroniconSystem._snap && Array.isArray(ChroniconSystem._snap.actors))
            ? ChroniconSystem._snap.actors.find(a => a.id === actorId)
            : null;
        const realLabel = snapActor ? (lang === 'en' ? (snapActor.label_en || snapActor.label) : snapActor.label) : actorId;

        if (action === 'quest') {
            if (!actor.quest) return;
            const q = actor.quest;
            const reqItem = q.needItem;
            const reqQty = q.needQty;

            let hasEnough = false;
            if (reqItem === 'gold') {
                // GameState.gold nikde jinde v kódu neexistuje — skutečná
                // pokladna je GameState.treasury.grose přes CellariumSystem.
                hasEnough = (typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) >= reqQty;
            } else if (reqItem === 'wood') {
                // "Dřevo" v resource baru (core/ui.js woodCount) sčítá wood+log
                // dohromady. Quest musí počítat stejně, jinak hráč s pouze
                // 'log' (kulatina) dostával falešné "nemáš suroviny".
                hasEnough = ((inv.wood || 0) + (inv.log || 0)) >= reqQty;
            } else {
                hasEnough = (inv[reqItem] || 0) >= reqQty;
            }

            if (!hasEnough) {
                const msg = lang === 'en' ? `⚠️ Missing resources for ${realLabel}!` : `⚠️ Nemáš dostatek surovin pro ${realLabel}!`;
                if (typeof NotificationSystem !== 'undefined') NotificationSystem.toast(msg, 'warn');
                return;
            }

            // Odeber suroviny
            if (reqItem === 'gold') {
                if (typeof CellariumSystem !== 'undefined' && CellariumSystem.spendGrose) CellariumSystem.spendGrose(reqQty);
            } else if (reqItem === 'wood') {
                // Spotřebuj nejdřív obyčejné dřevo (wood), kulatinu (log)
                // jen pokud wood nestačí — viz komentář u hasEnough výše.
                let remaining = reqQty;
                const useWood = Math.min(inv.wood || 0, remaining);
                inv.wood = (inv.wood || 0) - useWood;
                remaining -= useWood;
                if (remaining > 0) {
                    inv.log = (inv.log || 0) - remaining;
                }
            } else {
                inv[reqItem] -= reqQty;
            }

            // Přidej odměnu
            if (q.giveItem === 'script_notes') {
                GameState.knowledge = (GameState.knowledge || 0) + q.giveQty;
            } else {
                inv[q.giveItem] = (inv[q.giveItem] || 0) + q.giveQty;
            }

            actor.mood = Math.min(100, actor.mood + 20);
            actor.wealth = Math.min(100, actor.wealth + 10);
            actor.quest = null;
            actor.questCooldownUntil = Date.now() + ChroniconSystem.QUEST_COOLDOWN_MS;
            GameState.chroniconLocal.stats.totalHelped++;

            // Reálný, ne jen lokální dopad — nahlásí do sdíleného Chronicon
            // registru (chronicon-link-mrd, 6.8.2026). Dřív dělal jen klaster
            // po mši, teď libovolný questový aktér po splnění požadavku.
            ChroniconSystem._reportActorFavorIfNewDay(actorId);

            if (typeof Game !== 'undefined' && Game.save) Game.save();

            const succMsg = lang === 'en'
                ? `✅ Helped ${realLabel}! Mood +20, Received rewards.`
                : `✅ Pomohl jsi postavě ${realLabel}! Nálada +20, odměna převzata.`;

            if (typeof NotificationSystem !== 'undefined') NotificationSystem.toast(succMsg, 'success');
            ChroniconSystem.refreshOverview();

        } else if (action === 'bless') {
            // bless-cooldown-fix-mrd (10.8.2026): dřív žádný limit — spamovatelné
            // donekonečna, každé kliknutí +25 nálady bez pauzy. Teď 1/den per aktér.
            const today = new Date().toISOString().slice(0, 10);
            if (!GameState.chroniconLocal.blessedToday) GameState.chroniconLocal.blessedToday = {};
            if (GameState.chroniconLocal.blessedToday[actorId] === today) {
                const msg = lang === 'en' ? `⚠️ You already blessed ${realLabel} today.` : `⚠️ ${realLabel} jsi dnes už požehnal.`;
                if (typeof NotificationSystem !== 'undefined') NotificationSystem.toast(msg, 'warn');
                return;
            }

            // Požehnání / Mše — spotřebuje 1 svíčku/lůj nebo 5 Zápisníků
            const candleQty = inv['candle'] || 0;
            if (candleQty < 1 && (GameState.knowledge || 0) < 5) {
                const msg = lang === 'en' ? '⚠️ You need 1 Candle or 5 Notes to bestow a blessing!' : '⚠️ Pro požehnání potřebuješ 1 Svíčku nebo 5 Zápisníků!';
                if (typeof NotificationSystem !== 'undefined') NotificationSystem.toast(msg, 'warn');
                return;
            }

            if (inv['candle'] > 0) inv['candle']--;
            else GameState.knowledge -= 5;
            GameState.chroniconLocal.blessedToday[actorId] = today;

            // Lokální nálada — dál krmí ChroniconSystem.getBuffs() (herní
            // bonusy), beze změny. Navíc teď propojeno se skutečným
            // Chroniconem — stejný mechanismus jako mše/pohřby/sepultura.
            actor.mood = Math.min(100, actor.mood + 25);
            ChroniconSystem._reportActorFavorIfNewDay(actorId);
            if (typeof Game !== 'undefined' && Game.save) Game.save();

            const msg = lang === 'en'
                ? `✨ Blessed ${realLabel}! Sent to the living Chronicon — the effect on the region will show in tomorrow's summary.`
                : `✨ Udělil jsi požehnání postavě ${realLabel}. Odesláno do živého Chroniconu — projeví se v zítřejším souhrnu kraje.`;

            if (typeof NotificationSystem !== 'undefined') NotificationSystem.toast(msg, 'success');
            ChroniconSystem.refreshOverview();
        }
    },

    // ─── Fetch ──────────────────────────────────────────────────────────────

    _fetch: function() {
        const cacheRaw = localStorage.getItem(ChroniconSystem.CACHE_KEY);
        if (cacheRaw) {
            try {
                const c = JSON.parse(cacheRaw);
                if (c._fetched && (Date.now() - c._fetched) < ChroniconSystem.TTL) {
                    return; // Cache je čerstvá, nefetchuj
                }
            } catch(e) {}
        }

        fetch(ChroniconSystem.URL)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function(snap) {
                snap._fetched = Date.now();
                localStorage.setItem(ChroniconSystem.CACHE_KEY, JSON.stringify(snap));
                ChroniconSystem._snap = snap;
                ChroniconSystem._apply(snap);
            })
            .catch(function(err) {
                // Tiché selhání — hra funguje bez CHRONICONu
                console.warn('[CHRONICON] Fetch selhal:', err.message);
            });
    },

    // ─── Sdílený pool (sdileny-pool-mrd v2, 26.7.2026) ──────────────────────
    // Čte item-úroveň produkci z posledního fetchnutého snapshotu
    // (ChroniconSystem._snap — SKUTEČNÁ cache proměnná z _fetch() níže,
    // ověřeno před psaním, ne odhadnuto). null = aktér/item netracknutý →
    // volající (SaeculumSystem) spadne na statický buyOffer beze změny.
    getActorItemStock: function(actorId, itemId) {
        const snap = ChroniconSystem._snap;
        const a = snap && snap.actors && snap.actors.find(function (x) { return x.id === actorId; });
        if (!a || !a.itemStock) return null;
        const v = a.itemStock[itemId];
        return (v === undefined) ? null : Math.floor(v);
    },

    // ─── Apply snapshot ─────────────────────────────────────────────────────

    _apply: function(snap) {
        if (!snap || !snap.chronicle) return;

        // Kontrola valid_until
        if (snap.valid_until && new Date(snap.valid_until) < new Date()) {
            console.warn('[CHRONICON] Snapshot expiroval.');
            return;
        }

        // CHRONICON pasivní pohřby (před Proboštem) — hráč je informován,
        // ale nevede obřad (to přijde až s Proboštem přes parishEventTick).
        // Monotónní čítač + lokální "spotřebováno" kvůli 6h fetch cache —
        // stejný důvod jako u advisory_events výš.
        if (snap.region && typeof snap.region.totalFuneralEvents === 'number'
            && typeof GameState !== 'undefined' && !(GameState.rank && GameState.rank.probost)) {
            const consumedKey = 'chroniconFuneralsConsumed';
            const consumed = GameState[consumedKey] || 0;
            const diff = snap.region.totalFuneralEvents - consumed;
            if (diff > 0) {
                const toAdd = Math.min(diff, 2);
                const surnames = (Game && Game.PARISH_SURNAMES) || ['Novák', 'Dvořák', 'Král', 'Procházka', 'Sedlák'];
                if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
                for (let i = 0; i < toAdd; i++) {
                    const surname = surnames[Math.floor(Math.random() * surnames.length)];
                    GameState.cemetery.graves.push({ surname: surname, ts: Date.now() - i * 3600000 });
                    if (!GameState.kronika) GameState.kronika = [];
                    GameState.kronika.push({
                        ts:     Date.now() - i * 3600000,
                        cs:     'Zvěst z kraje: rodina ' + surname + ' pohřbila svého blízkého. Faráři z okolí obřad vykonali bez klášterní účasti.',
                        en:     'News from the region: the ' + surname + ' family buried a loved one. Local priests performed the rite without the monastery\'s part.',
                        la:     null,
                        type:   'chronicon_funeral',
                        source: 'chronicon',
                        icon:   '⚰️',
                        season: null,
                    });
                }
                GameState[consumedKey] = consumed + toAdd;
                Game.save();
            }
        }

        // Abbot message → toast + kanál zpráv + Kronika (jen při nové/změněné zprávě)
        if (snap.abbot && snap.abbot.message) {
            const msgId   = snap.abbot.message_id || snap.abbot.message;
            const lastKey = 'scriptorium_chronicon_abbot_last';
            const lastMsg = localStorage.getItem(lastKey);
            if (lastMsg !== msgId) {
                const lang     = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
                const msgShown = (lang === 'en' && snap.abbot.message_en) ? snap.abbot.message_en : snap.abbot.message;
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.toast('✝️ ' + msgShown, 'warn');
                    NotificationSystem.panel('✝️ ' + msgShown, 'chronicon');
                }
                if (typeof GameState !== 'undefined') {
                    if (!GameState.kronika) GameState.kronika = [];
                    GameState.kronika.push({
                        ts:     Date.now(),
                        cs:     snap.abbot.message,
                        en:     snap.abbot.message_en || snap.abbot.message,
                        la:     null,
                        type:   'chronicon_abbot',
                        source: 'abbot',
                        icon:   '✝️',
                        season: null,
                    });
                }
                localStorage.setItem(lastKey, msgId);
            }
        }

        // CHRONICON unlockFlags → GameState.flags (celá historie vždy — nový
        // hráč dostane na první fetch všechny dosud udělené flagy najednou)
        if (Array.isArray(snap.unlockFlags) && typeof GameState !== 'undefined') {
            if (!GameState.flags) GameState.flags = {};
            snap.unlockFlags.forEach(function (flagName) {
                if (typeof flagName === 'string' && !GameState.flags[flagName]) {
                    GameState.flags[flagName] = true;
                    if (!GameState.kronika) GameState.kronika = [];
                    GameState.kronika.push({
                        ts:     Date.now(),
                        cs:     'Zvěst přinesla novou možnost.',
                        en:     'A rumor has brought a new possibility.',
                        la:     null,
                        type:   'chronicon_unlock',
                        source: 'chronicon',
                        icon:   '🕊️',
                        season: null,
                    });
                }
            });
        }

        // CHRONICON porta_letters (Vrstva 3) → GameState.letters.dynamic.
        // Stejný dedup princip jako unlockFlags — jen nové id se přidá,
        // PortaSystem.getQueue() pak řeší readIds/firstSeen/expiry stejně
        // jako u statických LettersDB dopisů.
        if (Array.isArray(snap.porta_letters) && typeof GameState !== 'undefined') {
            if (!GameState.letters) GameState.letters = { readIds: {}, archive: [], firstSeen: {} };
            if (!GameState.letters.dynamic) GameState.letters.dynamic = [];
            const knownIds = {};
            GameState.letters.dynamic.forEach(function (l) { knownIds[l.id] = true; });
            snap.porta_letters.forEach(function (entry) {
                if (!entry || !entry.id || knownIds[entry.id]) return;
                GameState.letters.dynamic.push(entry);
                knownIds[entry.id] = true;
            });
        }

        // CHRONICON advisory_events → kurátorované rozhodovací eventy (Sprint 3).
        // Cap: jen 1 aktivní najednou. "Odložit" nic neztratí — zůstává
        // aktivní, dokud se hráč nerozhodne jinak. Formát mirror events-reference.md.
        // Vlna 1 / Hostina (ubytovna-mrd.md §8c-A): syntetický kandidát ze
        // snap.feast — GM-ruční pole, žádná změna na CHRONICON straně. Řadí
        // se před advisory_events, jinak stejná cap-1/resolvedIds mechanika.
        //
        // farnost-chronicon-reference.md sekce 5, krok 3b (27.7.2026): sepultura/
        // material/farni se STĚHUJÍ do Zakázky tabu (CommitmentsSystem) — sem
        // do modalu už NEPATŘÍ, aby nešly řešit na dvou místech zároveň.
        const ZAKAZKY_KINDS = ['sepultura', 'material', 'farni'];
        const feastCandidate = ChroniconSystem._buildFeastCandidate(snap);
        const hasAdvisorySource = (snap.advisory_events && snap.advisory_events.length) || feastCandidate;
        if (hasAdvisorySource && typeof GameState !== 'undefined') {
            if (!GameState.chroniconAdvisory) GameState.chroniconAdvisory = { activeId: null, pending: null, resolvedIds: {} };
            const adv = GameState.chroniconAdvisory;
            if (!adv.activeId) {
                const isProbost = !!(GameState.rank && GameState.rank.probost);
                const pool = feastCandidate ? [feastCandidate].concat(snap.advisory_events || []) : (snap.advisory_events || []);
                const candidate = pool.find(e => !ZAKAZKY_KINDS.includes(e.kind) && !adv.resolvedIds[e.id] && (!e.probost_only || isProbost));
                if (candidate) {
                    adv.activeId = candidate.id;
                    adv.pending  = candidate;
                    Game.save();
                }
            }
        }

        // Jednorázový toast pro nové Zakázky-kind položky (sepultura/material/
        // farni) — nejdou modalem, ale hráč má vědět, že přibyla nová zakázka.
        // Dedup přes GameState.zakazkyNotified (mirror _loadSeen vzoru u kroniky).
        if (Array.isArray(snap.advisory_events) && typeof GameState !== 'undefined') {
            if (!GameState.zakazkyNotified) GameState.zakazkyNotified = {};
            const lang = (GameState.settings && GameState.settings.language) || 'cs';
            snap.advisory_events.forEach(e => {
                if (!ZAKAZKY_KINDS.includes(e.kind)) return;
                if (GameState.zakazkyNotified[e.id]) return;
                GameState.zakazkyNotified[e.id] = true;
                if (typeof NotificationSystem !== 'undefined' && NotificationSystem.toast) {
                    const title = lang === 'en' ? (e.title_en || e.title_cs) : e.title_cs;
                    NotificationSystem.toast('📋 ' + (lang === 'en'
                        ? 'New commission: ' + title + ' — see the Commitments tab.'
                        : 'Nová zakázka: ' + title + ' — najdeš v tabu Zakázky.'), 'info');
                }
            });
        }

        // Chronicle záznamy → NotificationSystem.panel() + GameState.kronika
        const seen = ChroniconSystem._loadSeen();
        let added  = 0;

        // Záznamy jsou od nejnovějšího — injectujeme od nejstaršího
        const entries = [...snap.chronicle].reverse();

        const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language)
            ? GameState.settings.language
            : 'cs';

        // Syntetický timestamp základ: snap.generated odpovídá nejvyššímu tick číslu
        const snapTs    = snap.generated ? Date.parse(snap.generated) : Date.now();
        const maxTick   = snap.time && snap.time.total_tick != null ? snap.time.total_tick : 0;
        const TICK_MS   = 6 * 60 * 60 * 1000; // 6h per tick

        entries.forEach(function(entry) {
            const id = ChroniconSystem._entryId(entry);
            if (seen[id]) return; // Už viděno

            // Cap: zobraz max MAX_PER_LOAD nových záznamů najednou.
            // Přeskočené starší záznamy se označí jako viděné — nehromadí se.
            if (added >= ChroniconSystem.MAX_PER_LOAD) {
                seen[id] = 1;
                return;
            }

            // Panel notifikace
            if (typeof NotificationSystem !== 'undefined') {
                const icon = entry.icon ? entry.icon + ' ' : '';
                const text = (lang === 'en' && entry.text_en)
                    ? entry.text_en
                    : (entry.text_cs || entry.text);
                // Mapovat source na subkategorii pro správný label v panelu
                const src = entry.source || '';
                const cat = src === 'distant_events'
                    ? 'chronicon_distant'
                    : (src === 'local_events'
                        ? 'chronicon_local'
                        : (src === 'monastery_internal' || src === 'engine' || src === 'gm' || src === 'weather'
                            ? 'chronicon_monastery'
                            : 'chronicon'));
                NotificationSystem.panel(icon + text, cat);
            }

            // Inject do GameState.kronika
            ChroniconSystem._injectToKronika(entry, snapTs, maxTick);

            seen[id] = 1;
            added++;
        });

        if (added > 0) {
            ChroniconSystem._saveSeen(seen);
        }
        ChroniconSystem.updateUIHeader();
    },

    // ─── Cache helpers ───────────────────────────────────────────────────────

    _loadCache: function() {
        try {
            const raw = localStorage.getItem(ChroniconSystem.CACHE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch(e) { return null; }
    },

    _loadSeen: function() {
        try {
            const raw = localStorage.getItem(ChroniconSystem.SEEN_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch(e) { return {}; }
    },

    _saveSeen: function(seen) {
        // Udržuj max 500 seen ID — ořež nejstarší pokud přesáhne
        const keys = Object.keys(seen);
        if (keys.length > 500) {
            const trimmed = {};
            keys.slice(-400).forEach(function(k) { trimmed[k] = 1; });
            localStorage.setItem(ChroniconSystem.SEEN_KEY, JSON.stringify(trimmed));
        } else {
            localStorage.setItem(ChroniconSystem.SEEN_KEY, JSON.stringify(seen));
        }
    },

    // ─── Inject do Kroniky ───────────────────────────────────────────────────

    _injectToKronika: function(entry, snapTs, maxTick) {
        if (typeof GameState === 'undefined') return;
        if (!GameState.kronika) GameState.kronika = [];

        // Syntetický timestamp: snap.generated = maxTick, každý tick = 6h zpět
        const tickDelta = maxTick - (entry.tick || 0);
        const ts        = snapTs - tickDelta * 6 * 60 * 60 * 1000;

        GameState.kronika.push({
            ts:     ts,
            cs:     entry.text_cs || entry.text || '',
            en:     entry.text_en || entry.text || '',
            la:     null,
            type:   'chronicon',
            source: entry.source || 'chronicon',
            icon:   entry.icon   || '☩',
            season: entry.season || null,
        });
    },

    // Vlna 1 — Hostina, kalendářní fallback (ubytovna-mrd.md §8c-A
    // rozšíření, Bouvarde 24.7. "navázat na svátky v kalendáři"). Reuse
    // existující !subtle filtr (viz calendar.js showDayDetail/legend) —
    // odděluje "skutečný" svátek od vedlejších (Advent má 24 dní, ale je
    // subtle: true, tudíž vyfiltrovaný).
    _todaysMajorFeast: function() {
        if (typeof CalendarSystem === 'undefined' || !CalendarSystem.getFeastsForMonth) return null;
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const feasts = CalendarSystem.getFeastsForMonth(month, CalendarSystem.GAME_YEAR)
            .filter(f => f.day === day && !f.subtle);
        return feasts.length ? feasts[0] : null;
    },

    // Vlna 1 — Hostina (ubytovna-mrd.md §8c-A): syntetický advisory kandidát
    // ze snap.feast (GM-ruční, přednost) NEBO z kalendáře (automatický
    // fallback, viz _todaysMajorFeast výš). Dedup per svátek+den přes
    // vlastní id — mirror _reportRescueIfNewDay vzor jinde v kódu.
    _buildFeastCandidate: function(snap) {
        let name, nameEn, dateKey;
        if (snap && snap.feast && snap.feast.active) {
            name    = snap.feast.name_cs || 'svátek';
            nameEn  = snap.feast.name_en || name;
            dateKey = (snap.time && snap.time.date_string) || snap.generated || '';
        } else {
            const cf = ChroniconSystem._todaysMajorFeast();
            if (!cf) return null;
            name    = cf.nameCS;
            nameEn  = cf.nameEN;
            // Reálné ISO datum — svátek se přirozeně vrací každý rok
            // (jiný rok = jiný dateKey = nový kandidát, ne navěky resolved).
            dateKey = new Date().toISOString().slice(0, 10);
        }
        return {
            id: 'hostina_' + name + '_' + dateKey,
            kind: 'hostina',
            icon: '🍞',
            title_cs: 'Hosté na ' + name,
            title_en: 'Guests for ' + nameEn,
            text_cs: 'Ke slavnosti "' + name + '" dorazili k bráně poutníci a vesničané — chtějí se přidat k oslavě a přenocovat.',
            text_en: 'Pilgrims and villagers have arrived at the gate for the feast of "' + nameEn + '" — they wish to join the celebration and stay the night.',
            choices: [
                { id: 'accept',  label_cs: 'Přijmout na oslavu',    label_en: 'Welcome them to the feast' },
                { id: 'decline', label_cs: 'Zdvořile odmítnout',    label_en: 'Politely decline' },
                { id: 'defer',   label_cs: 'Rozhodnout se později', label_en: 'Decide later' },
            ],
        };
    },

    _entryId: function(entry) {
        // Stabilní ID nezávislé na textu — EN/CS verze téže zprávy = stejné ID
        if (entry.id) return String(entry.id);
        return (entry.source || '') + '_' + (entry.tick || 0);
    },

    // ─── Advisory events — kurátorované rozhodovací eventy z CHRONICONu ─────

    _advisoryShownThisSession: false,

    // Volat ze stejné kadence jako EventsSystem.checkEvents() (1×/s tick)
    checkPendingAdvisory: function() {
        if (typeof GameState === 'undefined' || !GameState.chroniconAdvisory) return;
        const adv = GameState.chroniconAdvisory;
        if (!adv.pending || !adv.activeId) return;
        if (ChroniconSystem._advisoryShownThisSession) return;
        if (typeof EventsSystem === 'undefined' || typeof NotificationSystem === 'undefined') return;

        ChroniconSystem._advisoryShownThisSession = true;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const p = adv.pending;

        EventsSystem.showEvent({
            id:     p.id || adv.activeId,
            source: 'chronicon',
            icon:  p.icon || '☩',
            title: lang === 'en' ? (p.title_en || p.title_cs) : p.title_cs,
            text:  lang === 'en' ? (p.text_en  || p.text_cs)  : p.text_cs,
            choices: (p.choices || []).map(c => ({
                label: lang === 'en' ? (c.label_en || c.label_cs) : c.label_cs,
                action: () => ChroniconSystem._resolveAdvisory(adv.activeId, c.id, lang),
            })),
        });
    },

    // Reopen z panelu "Zprávy kláštera" — mimo modal dismiss nic neztrácí,
    // jen skryje dialog; klik na pending položku spustí stejný modal znovu.
    reopenAdvisory: function() {
        ChroniconSystem._advisoryShownThisSession = false;
        ChroniconSystem.checkPendingAdvisory();
    },

    _resolveAdvisory: function(eventId, choiceId, lang) {
        const adv = GameState.chroniconAdvisory;
        const p = adv.pending;

        // Hospes 'accept' — gate kontroly PŘED trvalým resolve (mirror 'defer'
        // chování): plná lůžka nesmí kandidáta ztratit, hráč má šanci se
        // vrátit, jakmile se uvolní. cause: 'war' (Vlna 1 / C —
        // ubytovna-mrd.md §8c-C) míří na Ubytovnu místo Infirmaria —
        // zdravý uprchlík, ne nemocný. Kapacita živě z Game.ubytovnaCapacity()
        // (sklep upgrade 4/5) — základ 1 lůžko od začátku hry.
        if (choiceId === 'accept' && p && p.kind === 'hospes' && p.cause === 'war') {
            if (!GameState.ubytovna) GameState.ubytovna = { guests: [] };
            const bedsNow = (typeof Game !== 'undefined' && Game.ubytovnaCapacity) ? Game.ubytovnaCapacity() : 1;
            if ((GameState.ubytovna.guests || []).length >= bedsNow) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'No room is free. He waits at the gate.'
                    : 'Žádné místo není volné. Čeká u brány.';
            }
        }
        if (choiceId === 'accept' && p && p.kind === 'hospes' && p.cause !== 'war') {
            const hasTech = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_infirmarium_hospitalitas'));
            if (!hasTech) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'The brothers lack the means to take in strangers yet. (Requires: Hospitalitas)'
                    : 'Bratři zatím nemají prostředky přijímat cizí. (Vyžaduje: Hospitalitas)';
            }
            if (!GameState.infirmarium) GameState.infirmarium = { beds: 3, patients: [] };
            const inf = GameState.infirmarium;
            if ((inf.patients || []).length >= inf.beds) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'No bed is free. The traveler waits at the gate.'
                    : 'Žádná postel není volná. Poutník čeká u brány.';
            }
        }

        // Studovna 'accept' — stejný soft-bounce vzor jako hospes: zamčená
        // tech nebo obsazenej hostí slot nesmí žádost ztratit, jen ji odloží.
        if (choiceId === 'accept' && p && p.kind === 'studovna') {
            const hasTech = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_studovna'));
            if (!hasTech) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'There is no room yet fit to receive him. (Requires: Studovna)'
                    : 'Zatím není žádná místnost hodná jeho přijetí. (Vyžaduje: Studovna)';
            }
            if (GameState.studovnaGuest && GameState.studovnaGuest.until > Date.now()) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'The study room is already occupied by another guest.'
                    : 'Studovna je právě obsazená jiným hostem.';
            }
        }

        // Čtenář 'accept' — Cluster C1 (knihovna-rozsireni-mrd §4C, 28.8.2026).
        // Stejný soft-bounce vzor + navíc kontrola, že vůbec něco máš k
        // přečtení (bez odemčené knihy nemá host co číst). Očekávaný tvar
        // příchozího `p` z Chronicon strany: { kind:'ctenar', contactId,
        // icon, title_cs/en, text_cs/en, choices }. `contactId` určuje,
        // komu se připisuje vztah — na rozdíl od studovna (natvrdo
        // 'vrchnost') tady žádný default není, Chronicon musí poslat.
        if (choiceId === 'accept' && p && p.kind === 'ctenar') {
            const hasTech = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_studovna'));
            if (!hasTech) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'There is no room yet fit to receive him. (Requires: Studovna)'
                    : 'Zatím není žádná místnost hodná jeho přijetí. (Vyžaduje: Studovna)';
            }
            if (GameState.studovnaGuest && GameState.studovnaGuest.until > Date.now()) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'The study room is already occupied by another guest.'
                    : 'Studovna je právě obsazená jiným hostem.';
            }
            if (!(GameState.library && GameState.library.unlockedBooks && GameState.library.unlockedBooks.length > 0)) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'There is nothing yet in the library he could read.'
                    : 'V knihovně zatím není nic, co by mohl číst.';
            }
        }

        // Absenční výpůjčka — Cluster C2 (knihovna-rozsireni-mrd §4C2,
        // 28.8.2026). Tři přijímací volby (standard/vyšší zástava/odmítnout)
        // vedle sebe, ne binární accept/decline — Chronicon strana posílá
        // `kind:'vypujcka'` s choices id `accept_standard`/`accept_higher`/
        // `decline`. Sdílené soft-bounce kontroly pro obě accept varianty.
        if ((choiceId === 'accept_standard' || choiceId === 'accept_higher') && p && p.kind === 'vypujcka') {
            const hasTech = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_absentee_lending'));
            if (!hasTech) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'No book may yet leave these walls. (Requires: Absentee Lending)'
                    : 'Zatím žádná kniha nesmí opustit tyto zdi. (Vyžaduje: Výpůjčka mimo klášter)';
            }
            const rank = GameState.rank && GameState.rank.monastic;
            if (rank !== 'prior') {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'Only the Prior may permit a book to leave the monastery.'
                    : 'Jen Prior smí dovolit, aby kniha opustila klášter.';
            }
            const pool = (GameState.library.unlockedBooks || []).filter(id => {
                if (GameState.library.loanedBooks && GameState.library.loanedBooks[id]) return false;
                const prot = LibraryHelpers.getBookProtection ? LibraryHelpers.getBookProtection(LibraryDB.books.find(b => b.id === id)) : null;
                return prot !== 'catena' && prot !== 'secreta';
            });
            if (pool.length === 0) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'Nothing in the fond may safely leave — the rest is chained or already lent.'
                    : 'Nic ve fondu nesmí bezpečně odejít — zbytek je přikován nebo už půjčen.';
            }
            const rel = Math.min(100, (GameState.contactRelation || {})[p.contactId] || 0);
            if (choiceId === 'accept_higher' && rel < 20) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'He does not trust thee enough yet to accept such terms — he simply leaves.'
                    : 'Ještě ti tolik nedůvěřuje, aby přijal takové podmínky — prostě odejde.';
            }
        }

        // Pocestný 'accept' — stejný soft-bounce vzor jako hospes/studovna
        // (ubytovna-mrd.md §8c-B, rozšíření): plná Ubytovna nesmí
        // kandidáta ztratit, jen ho odloží. Kapacita živě z
        // Game.ubytovnaCapacity() (sklep upgrade 4/5, §D — Bouvarde 24.7.),
        // základ 1 lůžko od začátku hry.
        if (choiceId === 'accept' && p && p.kind === 'pocestny') {
            if (!GameState.ubytovna) GameState.ubytovna = { guests: [] };
            const uby = GameState.ubytovna;
            const bedsNow = (typeof Game !== 'undefined' && Game.ubytovnaCapacity) ? Game.ubytovnaCapacity() : 1;
            if ((uby.guests || []).length >= bedsNow) {
                ChroniconSystem._advisoryShownThisSession = false;
                return lang === 'en'
                    ? 'No room is free. The traveler waits at the gate.'
                    : 'Žádné místo není volné. Pocestný čeká u brány.';
            }
        }

        if (choiceId === 'defer') {
            // Nic se neztrácí — zůstává aktivní, může se ukázat znovu příště.
            ChroniconSystem._advisoryShownThisSession = false;
            return lang === 'en'
                ? 'You decide to think it over. The matter can wait.'
                : 'Rozhodneš se to ještě promyslet. Věc může počkat.';
        }
        adv.resolvedIds[eventId] = true;
        adv.activeId = null;
        adv.pending  = null;

        // Generický resolve-report zpět do Chronicon repa (28.8.2026,
        // knihovna-rozsireni-mrd oprava) — nahrazuje trvalé zablokování
        // single-slot pending stavů (pendingStudovna/pendingCtenar/
        // pendingVypujcka). Fire-and-forget, tiché selhání, žádný dopad
        // na hru, pokud endpoint nedoběhne — mirror
        // _reportVrchnostFavorIfNewDay() vzoru, jen bez denní dedup
        // (tohle se má poslat přesně jednou za KAŽDÉ vyřešení, ne 1×/den).
        try {
            fetch('/api/advisory-resolve-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: eventId }),
            }).catch(() => {});
        } catch (e) { /* tiché selhání */ }

        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.resolvePendingEvent) {
            NotificationSystem.resolvePendingEvent(eventId);
        }
        if (choiceId === 'bolster') {
            if (!GameState.flags) GameState.flags = {};
            GameState.flags.chroniconPlagueBolstered = true;
            return lang === 'en'
                ? 'The brothers resolve to watch over the sick more closely. (Full effect awaits the Infirmarium — for now, this is a resolve, not yet a remedy.)'
                : 'Bratři se rozhodli bedlivěji dohlížet na nemocné. (Plný účinek čeká na Infirmarium — zatím je to spíš předsevzetí než lék.)';
        }
        if (choiceId === 'accept' && p && p.kind === 'hospes' && p.cause === 'war') {
            // Uprchlík — Ubytovna, ne Infirmarium (Vlna 1 / C —
            // ubytovna-mrd.md §8c-C). Delší plannedDays než pocestný/
            // hostina — "levné ubytování na dlouho", ne noc přes cestu.
            if (!GameState.ubytovna) GameState.ubytovna = { guests: [] };
            GameState.ubytovna.guests.push({
                variant: 'uprchlik',
                title_cs: p.title_cs,
                title_en: p.title_en,
                actorId: p.actorId,
                arrivedAt: Date.now(),
                plannedDays: 6,
                joinChance: 0,
                joinOffered: false,
            });
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? `${p.title_en || 'He'} is given shelter for the days ahead.`
                : `${p.title_cs || 'Uprchlík'} dostává útočiště na několik dní dopředu.`;
        }
        if (choiceId === 'accept' && p && p.kind === 'hospes') {
            // Přijetí hospes pacienta — viz infirmarium-hospites-rescue-mrd.md §3.
            if (!GameState.infirmarium) GameState.infirmarium = { beds: 3, patients: [] };
            GameState.infirmarium.patients.push({
                kind: 'hospes',
                id: p.id,
                name: p.name,
                ailment_cs: p.cause === 'plague' ? 'Mor' : 'Bída a vyčerpání',
                ailment_en: p.cause === 'plague' ? 'Plague' : 'Poverty and exhaustion',
                wealth: p.wealth || 0,
                actorId: p.actorId,
                arrivedAt: Date.now(),
                recoverHours: p.cause === 'plague' ? 144 : 60,
            });
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? `${p.name} is taken into the infirmary. A bed is made ready.`
                : `${p.name} je přijat do Infirmaria. Lůžko je připraveno.`;
        }
        if (choiceId === 'accept' && p && p.kind === 'hostina') {
            // Vlna 1 — Hostina: jednorázový efekt, žádné lůžko (mirror sepultura).
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 2);
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('important',
                    '🍞 ' + p.title_cs + ' — klášter otevřel brány poutníkům a vesničanům.',
                    '🍞 ' + p.title_en + ' — the monastery opened its gates to pilgrims and villagers.',
                    '🍞 Hospites in festo suscepti sunt.');
            }
            return lang === 'en'
                ? 'The gates are opened. Pilgrims and villagers join the feast within the walls.'
                : 'Brány jsou otevřeny. Poutníci a vesničané se přidávají k oslavě uvnitř zdí.';
        }
        if (choiceId === 'accept' && p && p.kind === 'pocestny') {
            // Vlna 1 — Pocestný, s lůžkem (ubytovna-mrd.md §8c-B, rozšíření):
            // obsadí Ubytovnu, odejde + odmění se v
            // ChroniconSystem.ubytovnaDailyTick() po uplynutí plannedDays.
            // plannedDays: placeholder podle typu, snadno doladitelné —
            // do budoucna základ pro delší pobyty (uprchlík/vesničan).
            const PLANNED_DAYS = { poutnik: 1, kramar: 2, zebravy_mnich: 1 };
            if (!GameState.ubytovna) GameState.ubytovna = { guests: [] };
            GameState.ubytovna.guests.push({
                variant: p.variant,
                title_cs: p.title_cs,
                title_en: p.title_en,
                arrivedAt: Date.now(),
                plannedDays: PLANNED_DAYS[p.variant] || 1,
                joinChance: 0,
                joinOffered: false,
            });
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? 'He is given a bed for the night.'
                : 'Dostává lůžko na noc.';
        }
        if (choiceId === 'accept' && p && p.kind === 'studovna') {
            // Vyhovění žádosti — Vrchnost influence + anonymní denní report,
            // viz studovna-vrchnost-mrd.md §3-4. Timed occupancy slot (48h) —
            // vizuálně obsazen ve StudovnaSystem, mirror hospes recoverHours vzor.
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('vrchnost', 4);
            GameState.studovnaGuest = {
                name: lang === 'en' ? 'The Lord' : 'Vrchnost',
                until: Date.now() + 48 * 60 * 60 * 1000,
            };
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('important',
                    '📜 Vrchnost přijata do Studovny — listiny prohledány, klid zachován.',
                    '📜 The Lord was received in the study room — the charters searched, the peace kept.',
                    '📜 Dominus in studiolo susceptus est.');
            }
            ChroniconSystem._reportVrchnostFavorIfNewDay();
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? "The Lord is received in the study room. The monastery's charters are laid open before him."
                : 'Vrchnost je přijat do Studovny. Klášterní listiny jsou před ním otevřeny.';
        }

        // Čtenář 'accept' execution — Cluster C1. Kniha se vybere náhodně
        // z odemčených (host chce jen to, co fond skutečně má). Poplatek
        // symbolický (§9 knihovna-rozsireni-mrd — NE dle hodnoty knihy),
        // vztah jde na kontakt, co žádost poslal, ne natvrdo na jednu frakci.
        // studovnaVisitors: plný záznam (kdo/co/kdy) rovnou od začátku —
        // UI pro teď jen prostý výpis, pokročilejší dotazování je pozdější
        // sprint, ale data se nemusí zpětně doplňovat.
        // TODO(D2): až vznikne stav opotřebení knih, nedbalý host tady má
        // zrychlit degradaci konkrétní půjčené knihy. Zatím no-op.
        if (choiceId === 'accept' && p && p.kind === 'ctenar') {
            const pool = GameState.library.unlockedBooks;
            const bookId = pool[Math.floor(Math.random() * pool.length)];
            const bookDef = (typeof LibraryDB !== 'undefined') ? LibraryDB.books.find(b => b.id === bookId) : null;
            const bookTitle = bookDef ? (lang === 'en' ? (bookDef.title_en || bookDef.title) : bookDef.title) : bookId;
            const contactId = p.contactId || 'mlynar';
            const visitorName = lang === 'en' ? (p.title_en || 'A reader') : (p.title_cs || 'Čtenář');

            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence(contactId, 4);
            if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                CellariumSystem.addGrose(4);
                if (CellariumSystem.recordCommissionIncome) CellariumSystem.recordCommissionIncome(
                    (lang === 'en' ? 'Study fee' : 'Poplatek za studium'), 4, visitorName, visitorName);
            }
            GameState.studovnaGuest = {
                name: visitorName,
                until: Date.now() + 24 * 60 * 60 * 1000,
                bookId: bookId,
            };
            if (!GameState.library.studovnaVisitors) GameState.library.studovnaVisitors = [];
            GameState.library.studovnaVisitors.push({
                contactId: contactId,
                name: visitorName,
                bookId: bookId,
                bookTitle: bookTitle,
                date: Date.now(),
            });
            if (GameState.library.studovnaVisitors.length > 50) GameState.library.studovnaVisitors.shift();
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('minor',
                    `📖 ${visitorName} přijat do Studovny — čte "${bookTitle}".`,
                    `📖 ${visitorName} received in the study room — reading "${bookTitle}".`,
                    `📖 Lector in studiolo susceptus est.`);
            }
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return lang === 'en'
                ? `He is received in the study room and given "${bookTitle}" to read.`
                : `Je přijat do Studovny a dostává k přečtení "${bookTitle}".`;
        }

        // Absenční výpůjčka execution — obě accept varianty sdílí výběr
        // knihy a základ, liší se jen v zástavě/riziku. Cautio historicky
        // ~třetina nad hodnotu (§9 knihovna-rozsireni-mrd) — deposit =
        // tier × 1.3. "Vyšší zástava" = +20% k ceně, -30% k riziku ztráty
        // (víc v sázce pro dlužníka = víc důvodů vrátit).
        if ((choiceId === 'accept_standard' || choiceId === 'accept_higher') && p && p.kind === 'vypujcka') {
            const pool = (GameState.library.unlockedBooks || []).filter(id => {
                if (GameState.library.loanedBooks && GameState.library.loanedBooks[id]) return false;
                const prot = LibraryHelpers.getBookProtection ? LibraryHelpers.getBookProtection(LibraryDB.books.find(b => b.id === id)) : null;
                return prot !== 'catena' && prot !== 'secreta';
            });
            const bookId = pool[Math.floor(Math.random() * pool.length)];
            const bookDef = LibraryDB.books.find(b => b.id === bookId);
            const bookTitle = bookDef ? (lang === 'en' ? (bookDef.title_en || bookDef.title) : bookDef.title) : bookId;
            const contactId = p.contactId || 'mlynar';
            const borrowerName = lang === 'en' ? (p.title_en || 'A borrower') : (p.title_cs || 'Vypůjčitel');
            const rel = Math.min(100, (GameState.contactRelation || {})[contactId] || 0);

            let days = p.durationDays || 7;
            const isAbbot = contactId === 'klaster';
            if (!isAbbot && days > 7 && rel < 70) days = 7; // pojistka — nižší vztah si delší půjčku nevyžádá (Opat má 14 dní vždy, viz engine.js)

            const tier = (typeof LibraryHelpers !== 'undefined' && LibraryHelpers.getScribePrice) ? LibraryHelpers.getScribePrice() : 10;
            const higher = choiceId === 'accept_higher';
            const deposit = isAbbot ? 0 : Math.round(tier * 1.3 * (higher ? 1.2 : 1));
            let lossChance = Math.max(0, Math.min(30, (100 - rel) * 0.3));
            if (higher) lossChance *= 0.7;
            if (isAbbot) lossChance = 0; // vlastní klášter, kniha se neztratí

            // vypujcky-gradient-mrd (29.8.2026) — Opat neplatí zástavu sám
            // sobě, místo toho drobný abbotFavor bonus za důvěru, se kterou
            // mu klášter knihu svěřuje na cesty.
            if (isAbbot) {
                if (!GameState.secrets) GameState.secrets = {};
                GameState.secrets.abbotFavor = (GameState.secrets.abbotFavor || 0) + 2;
            } else if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                CellariumSystem.addGrose(deposit, { title: lang === 'en' ? 'Loan pledge' : 'Zástava za výpůjčku', source: borrowerName, source_en: borrowerName });
            }
            if (!GameState.library.loanedBooks) GameState.library.loanedBooks = {};
            GameState.library.loanedBooks[bookId] = {
                contactId: contactId, borrowerName: borrowerName, loanedAt: Date.now(),
                dueAt: Date.now() + days * 24 * 60 * 60 * 1000, lossChance: lossChance, deposit: deposit,
            };
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                if (isAbbot) {
                    Game.addKronikaEntry('minor',
                        `📤 Opat si vzal "${bookTitle}" s sebou na cestu, na ${days} dní.`,
                        `📤 The Abbot took "${bookTitle}" with him on his journey, for ${days} days.`,
                        `📤 Abbas librum secum tulit.`);
                } else {
                    Game.addKronikaEntry('minor',
                        `📤 "${bookTitle}" zapůjčena ${borrowerName} na ${days} dní.`,
                        `📤 "${bookTitle}" lent to ${borrowerName} for ${days} days.`,
                        `📤 Liber commodatus est.`);
                }
            }
            Game.save();
            return isAbbot
                ? (lang === 'en'
                    ? `"${bookTitle}" travels with the Abbot for ${days} days.`
                    : `"${bookTitle}" cestuje s Opatem na ${days} dní.`)
                : (lang === 'en'
                    ? `"${bookTitle}" is lent for ${days} days. Pledge received: ${deposit} g.`
                    : `"${bookTitle}" je zapůjčena na ${days} dní. Zástava přijata: ${deposit} g.`);
        }
        // Sepultura accept/decline zde odstraněno (krok 3c, 27.7.2026) —
        // od kroku 3b (ZAKAZKY_KINDS filtr) sem `kind==='sepultura'` už
        // nikdy nedorazí, tenhle catchall se stal orphan kódem. Logika
        // (dar = wealth×1.2, church+3) žije dál v
        // CommitmentsSystem.resolveChronicle() beze změny čísel.
        if (choiceId === 'decline' && p && p.kind === 'studovna') {
            return lang === 'en'
                ? 'The request is turned down. The Lord takes no offense — but none either.'
                : 'Žádost je odmítnuta. Vrchnost se neurazí — ale ani nepotěší.';
        }
        if (choiceId === 'decline' && p && p.kind === 'ctenar') {
            return lang === 'en'
                ? 'The request is turned down. He seeks his reading elsewhere.'
                : 'Žádost je odmítnuta. Čtení si najde jinde.';
        }
        if (choiceId === 'decline' && p && p.kind === 'vypujcka') {
            return lang === 'en'
                ? 'The request is turned down. No book leaves the walls today.'
                : 'Žádost je odmítnuta. Dnes žádná kniha neopustí zdi.';
        }
        if (choiceId === 'decline' && p && p.kind === 'hospes') {
            return lang === 'en'
                ? 'The traveler is turned away. He must seek shelter elsewhere.'
                : 'Poutník je odmítnut. Musí hledat útočiště jinde.';
        }
        if (choiceId === 'decline' && p && p.kind === 'hostina') {
            return lang === 'en'
                ? 'The gates remain closed. The feast is kept within the walls alone.'
                : 'Brány zůstávají zavřené. Oslava se drží jen uvnitř zdí.';
        }
        if (choiceId === 'decline' && p && p.kind === 'pocestny') {
            return lang === 'en'
                ? 'He is turned away and continues down the road.'
                : 'Je odmítnut a pokračuje dál po cestě.';
        }
        return lang === 'en'
            ? 'The monastery carries on as before. What happens in the wider region is beyond these walls.'
            : 'Klášter pokračuje jako dřív. Co se děje v širším kraji, je mimo tyto zdi.';
    },

    // Anonymní denní report vyhovění Vrchnosti — mirror
    // InfirmariumSystem._reportRescueIfNewDay, ale bez per-actor smyčky
    // (Vrchnost je jeden konkrétní aktér, viz studovna-vrchnost-mrd.md §3).
    _reportVrchnostFavorIfNewDay: function() {
        const today = new Date().toISOString().slice(0, 10);
        if (GameState.vrchnostReportSent === today) return;
        GameState.vrchnostReportSent = today;

        try {
            fetch('/api/vrchnost-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favor: true, day: today }),
            }).catch(() => {});
        } catch (e) { /* tiché selhání */ }
    },

    // Krok B (clientela-chronicon-most-mrd.md §5) — vážený denní report
    // contactRelation hodnot pro Clientela kontakty propojené na reálného
    // Chronicon aktéra (chroniconActorId pole v contacts.js). Mirror
    // PersonaSystem.reportRegistrumIfNewDay() 1:1 — stejná denní-dedup a
    // rank-váha logika (RANK_WEIGHT), jen relace místo lux/umbra a
    // per-aktér místo jednoho globálního páru. Volá se z Game.init(),
    // stejně jako checkAbbotPetitions() — jednou za session, ne na tik.
    _reportContactRelationIfNewDay: function() {
        if (typeof GameState === 'undefined') return;
        if (!GameState.contactRelation) GameState.contactRelation = {};
        if (typeof ContactsDB === 'undefined') return;
        const today = new Date().toISOString().slice(0, 10);
        if (GameState.contactRelationLastSent === today) return;
        GameState.contactRelationLastSent = today;

        const relations = {};
        let any = false;
        Object.keys(ContactsDB).forEach(cid => {
            const c = ContactsDB[cid];
            if (!c.chroniconActorId) return;
            const rel = GameState.contactRelation[cid];
            if (typeof rel !== 'number') return;
            relations[c.chroniconActorId] = rel;
            any = true;
        });
        // abbot-persona-mrd (9.8.2026) — Opat (klaster) není ContactsDB
        // záznam (žádné obchodní vztahy), ale patří do stejného váženého
        // kanálu. Normalizace lokálního abbotFavor (neomezená škála) na
        // 0-100 relation škálu, mirror ostatních kontaktů (50 = neutrál).
        if (GameState.secrets && typeof GameState.secrets.abbotFavor === 'number') {
            relations['klaster'] = Math.max(0, Math.min(100, 50 + GameState.secrets.abbotFavor));
            any = true;
        }
        if (!any) return;

        const rankTier = (GameState.rank && GameState.rank.monastic) || null;
        const RANK_WEIGHT = { novitius: 1, frater: 2, armarius: 3, prior: 4 };
        const weight = RANK_WEIGHT[rankTier] || 1;

        try {
            fetch('/api/contact-relation-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relations: relations, weight: weight, day: today }),
            }).catch(() => {});
        } catch (e) { /* tiché selhání */ }
    },

    // Generický anonymní denní favor report pro libovolného CHRONICON
    // aktéra (api/actor-favor-report.js, core/actor-favor-register.js).
    // Dnes voláno pro 'klaster' po odsloužené mši (Game.serveMass) — dělá
    // z "Klášter" v CHRONICONu mechanickou zprávu o komunitě hráčů, ne jen
    // vyprávěcí gesto. Rozšíření na dalšího aktéra = jen další volání
    // odsud, žádný nový engine.
    _reportActorFavorIfNewDay: function(actorId) {
        if (!actorId) return;
        const today = new Date().toISOString().slice(0, 10);
        if (!GameState.actorFavorReportSent) GameState.actorFavorReportSent = {};
        if (GameState.actorFavorReportSent[actorId] === today) return;
        GameState.actorFavorReportSent[actorId] = today;

        try {
            fetch('/api/actor-favor-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actorId: actorId, day: today }),
            }).catch(() => {});
        } catch (e) { /* tiché selhání */ }
    },

    // Fond knihovny — 1×/den nahlásí počet odemčených knih (vypujcky-
    // gradient-mrd §C, 29.8.2026). Mirror _reportActorFavorIfNewDay,
    // volá se z LibraryHelpers.checkLibraryUnlocks() (běží při každém
    // otevření Knihovny), žádný nový hák netřeba.
    _reportLibraryFondIfNewDay: function() {
        const today = new Date().toISOString().slice(0, 10);
        if (GameState.libraryFondReportSent === today) return;
        if (!GameState.library || !GameState.library.unlockedBooks) return;
        GameState.libraryFondReportSent = today;

        try {
            fetch('/api/library-fond-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: GameState.library.unlockedBooks.length, day: today }),
            }).catch(() => {});
        } catch (e) { /* tiché selhání */ }
    },

    // Vlna 1 — Ubytovna: hosté odcházejí po uplynutí plannedDays, self-
    // guarded 24h (mirror InfirmariumSystem.hospesDailyTick vzoru,
    // ubytovna-mrd.md §8c-B rozšíření).
    UBYTOVNA_DAY_MS: 24 * 60 * 60 * 1000,

    // "Twist" (Bouvarde 24.7.): host se může přimknout k víře/práci a
    // zůstat jako Oblát/Famulus. Růst/den + cílová cesta per varianta.
    UBYTOVNA_JOIN_GROWTH: { poutnik: 18, uprchlik: 15, kramar: 12, zebravy_mnich: 5 },
    UBYTOVNA_JOIN_TRACK:  { poutnik: 'oblat', uprchlik: 'oblat', kramar: 'famulus', zebravy_mnich: 'oblat' },

    ubytovnaDailyTick: function() {
        if (!GameState.ubytovnaTick) GameState.ubytovnaTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.ubytovnaTick.lastTick || 0) < ChroniconSystem.UBYTOVNA_DAY_MS) return;
        GameState.ubytovnaTick.lastTick = now;

        const uby = GameState.ubytovna;
        if (!uby || !uby.guests || !uby.guests.length) return;

        const hasMagister = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_magister'));
        const freeSlot = (typeof Game !== 'undefined' && Game.conversiCapacity)
            ? (GameState.conversi || []).length < Game.conversiCapacity() : false;

        const stillHere = [];
        uby.guests.forEach(g => {
            // Náklonnost roste vždy — i bez volnýho slotu, vidět v dashboardu.
            const growth = ChroniconSystem.UBYTOVNA_JOIN_GROWTH[g.variant] || 10;
            g.joinChance = Math.min(90, (g.joinChance || 0) + growth);

            // Nabídka připojení — jen jednou za pobyt, jen s volným slotem
            // a vyzkoumaným Magistrem (mirror hireOblat/hireFamulus gate).
            if (!g.joinOffered && hasMagister && freeSlot && Math.random() * 100 < g.joinChance) {
                g.joinOffered = true;
                ChroniconSystem._offerGuestJoin(g);
                stillHere.push(g);
                return; // nechat ho tu, dokud hráč nerozhodne
            }

            const dueAt = (g.arrivedAt || 0) + (g.plannedDays || 1) * ChroniconSystem.UBYTOVNA_DAY_MS;
            if (now < dueAt) { stillHere.push(g); return; }

            // Odchází — drobný dar + village influence, mirror hospes vzoru.
            // abbot-persona-mrd (9.8.2026) — konečně zapojený portaVisitorBonus,
            // dřív jen dekorativní pilulka. Žádná lokální šance na FREKVENCI
            // návštěv existuje (pocestný vzniká jen na Chronicon straně) —
            // přepnuto na ŠTĚDROST místo četnosti: +30% na odchodový dar.
            const visitorMult = (typeof ChroniconSystem !== 'undefined' && ChroniconSystem.getBuffs)
                ? 1 + (ChroniconSystem.getBuffs().portaVisitorBonus || 0) : 1.0;
            const gift = Math.round((2 + Math.floor(Math.random() * 3)) * visitorMult); // 2-4 grošů, ±bonus
            if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(gift, { title: 'Odchodový dar', source: g.title_cs, source_en: g.title_en });
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', 1);
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('important',
                    '🥾 ' + g.title_cs + ' opouští Ubytovnu — na cestu dostal ' + gift + ' grošů.',
                    '🥾 ' + g.title_en + ' leaves the guesthouse — given ' + gift + ' groschen for the road.',
                    '🥾 Peregrinus hospitio discessit.');
            }
            // Uprchlík (cause: 'war') má actorId — reuse existující rescue
            // report, mirror InfirmariumSystem._reportRescueIfNewDay (§8c-C).
            // Pocestný/hostina nemají actorId, funkce se v tichosti vrátí.
            if (g.actorId && typeof InfirmariumSystem !== 'undefined' && InfirmariumSystem._reportRescueIfNewDay) {
                InfirmariumSystem._reportRescueIfNewDay(g.actorId);
            }
        });
        uby.guests = stillHere;

        // Flavour interakce — čistě narativní, žádnej mechanickej efekt
        // (Bouvarde 24.7., "cokoliv, spíš flavour").
        if (stillHere.length && (GameState.conversi || []).length && Math.random() < 0.08) {
            ChroniconSystem._ubytovnaFlavorVignette(stillHere);
        }

        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    // Nabídka "host chce zůstat" — lokální event, mimo CHRONICON (rozhoduje
    // se jen na Scriptorium straně, žádnej round-trip). id = arrivedAt
    // (unikátní per host) — umožňuje reopen z panelu po dismissu mimo modal.
    _offerGuestJoin: function(g) {
        if (typeof EventsSystem === 'undefined' || !EventsSystem.showEvent) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const track = ChroniconSystem.UBYTOVNA_JOIN_TRACK[g.variant] || 'oblat';
        const trackName_cs = track === 'famulus' ? 'famula' : 'obláta';
        const trackName_en = track === 'famulus' ? 'famulus' : 'oblate';
        const id = 'guestjoin_' + g.arrivedAt;
        EventsSystem.showEvent({
            id: id,
            source: 'chronicon_guestjoin',
            icon: '🙏',
            title: lang === 'en' ? 'A guest wishes to stay' : 'Host chce zůstat',
            text: lang === 'en'
                ? `${g.title_en} has grown fond of life here and asks to join as a ${trackName_en}.`
                : `${g.title_cs} si oblíbil klášterní život a prosí, zda by mohl zůstat jako ${trackName_cs}.`,
            choices: [
                {
                    label: lang === 'en' ? 'Welcome him' : 'Přijmout ho',
                    action: () => {
                        const result = ChroniconSystem._resolveGuestJoin(g, true);
                        if (NotificationSystem.resolvePendingEvent) NotificationSystem.resolvePendingEvent(id);
                        return result;
                    },
                },
                {
                    label: lang === 'en' ? 'Let him move on' : 'Nechat ho jít dál',
                    action: () => {
                        const result = ChroniconSystem._resolveGuestJoin(g, false);
                        if (NotificationSystem.resolvePendingEvent) NotificationSystem.resolvePendingEvent(id);
                        return result;
                    },
                },
            ],
        });
    },

    // Reopen z panelu — hledá hosta podle arrivedAt (zakódováno v id).
    // Pokud mezitím odešel/byl vyřízen jinak, tiše vyčistí pending záznam.
    reopenGuestJoin: function(id) {
        const arrivedAt = Number(String(id).replace('guestjoin_', ''));
        const g = (GameState.ubytovna && GameState.ubytovna.guests || []).find(x => x.arrivedAt === arrivedAt);
        if (!g) {
            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.resolvePendingEvent) NotificationSystem.resolvePendingEvent(id);
            return;
        }
        ChroniconSystem._offerGuestJoin(g);
    },

    _resolveGuestJoin: function(g, accepted) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!accepted) {
            return lang === 'en' ? 'He nods and, for now, continues on his way.' : 'Přikývne a zatím pokračuje dál svou cestou.';
        }
        if (GameState.ubytovna && GameState.ubytovna.guests) {
            GameState.ubytovna.guests = GameState.ubytovna.guests.filter(x => x !== g);
        }
        const track = ChroniconSystem.UBYTOVNA_JOIN_TRACK[g.variant] || 'oblat';
        if (!GameState.conversi) GameState.conversi = [];
        const namePool = (typeof Game !== 'undefined' && Game.KONVRS_NAMES) ? Game.KONVRS_NAMES : ['Bratr'];
        const usedNames = GameState.conversi.map(k => k.name);
        const available = namePool.filter(n => !usedNames.includes(n));
        const pool = available.length ? available : namePool;
        const name = pool[Math.floor(Math.random() * pool.length)];
        const entry = track === 'famulus'
            ? { id: 'famulus_' + Date.now(), rosterId: null, name: name, type: 'famulus', hiredAt: Date.now(), fatigue: 0, mood: 60, wageOwed: 0 }
            : { id: 'oblat_' + Date.now(), rosterId: null, name: name, type: 'oblat', hiredAt: Date.now(), fatigue: 0, mood: 60, matureAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
        GameState.conversi.push(entry);
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
            Game.addKronikaEntry('important',
                '🙏 ' + g.title_cs + ' zůstává v klášteře jako ' + name + '.',
                '🙏 ' + g.title_en + ' remains at the monastery as ' + name + '.',
                '🙏 Hospes conversus factus est.');
        }
        return lang === 'en'
            ? `${name} — for that is his name now — joins the community.`
            : `${name} — tak se teď jmenuje — se připojuje ke komunitě.`;
    },

    // Krátká narativní vinětka host↔konvrš, žádnej mechanickej efekt.
    // Vzory drženy jen v nominativu na obou stranách (X a Y), ať se
    // vyhnou českýmu skloňování dynamickýho jména.
    _ubytovnaFlavorVignette: function(guests) {
        const conv = GameState.conversi || [];
        if (!guests.length || !conv.length) return;
        const g = guests[Math.floor(Math.random() * guests.length)];
        const k = conv[Math.floor(Math.random() * conv.length)];
        const VIGNETTES = [
            { cs: 'Bratr ' + k.name + ' a ' + g.title_cs + ' strávili večer v tichém rozhovoru.',
              en: 'Brother ' + k.name + ' and ' + g.title_en + ' spent the evening in quiet conversation.' },
            { cs: g.title_cs + ' a bratr ' + k.name + ' si spolu zazpívali žalm na dvoře.',
              en: g.title_en + ' and brother ' + k.name + ' sang a psalm together in the yard.' },
            { cs: 'Bratr ' + k.name + ' a ' + g.title_cs + ' sdíleli chléb u večerního stolu.',
              en: 'Brother ' + k.name + ' and ' + g.title_en + ' shared bread at the evening table.' },
        ];
        const v = VIGNETTES[Math.floor(Math.random() * VIGNETTES.length)];
        if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
            Game.addKronikaEntry('minor', v.cs, v.en, null);
        }
    },

    // ─── VISUAL OVERVIEW & MODAL INTEGRATION ──────────────────────────────

    _ACTOR_ICONS: {
        vrchnost: '🏰', mlynar: '🌾', kovar: '⚒️', uhlic: '🔥', vorar: '🪵',
        rybnikar: '🐟', prevoznik: '⛴️', valach: '🐑', klaster: '⛪', vcelar: '🐝',
        sklar: '🔮',
    },

    _activeFilter: 'all',

    setFilter: function(filter) {
        ChroniconSystem._activeFilter = filter;
        ChroniconSystem.refreshOverview();
    },

    openModal: function() {
        let modal = document.getElementById('chronicon-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'chronicon-modal';
            modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.78); z-index:1001; justify-content:center; align-items:center; backdrop-filter:blur(3px);';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background:var(--bg-parchment, #fcf5e5); border:2px solid var(--accent-gold, #c5a059); padding:24px; max-width:850px; width:94%; max-height:88vh; overflow-y:auto; box-shadow:0 0 50px rgba(0,0,0,0.8); border-radius:8px; position:relative; font-family:'Crimson Text', serif; color:var(--ink-primary, #2c241b);">
                <button onclick="ChroniconSystem.closeModal()" style="position:absolute; top:12px; right:14px; background:none; border:none; font-size:1.6rem; cursor:pointer; color:var(--ink-primary); width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.08)'" onmouseout="this.style.background='transparent'">✕</button>
                <div id="chronicon-modal-content">
                    ${ChroniconSystem.renderOverviewHTML('modal')}
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        ChroniconSystem.updateUIHeader();
    },

    closeModal: function() {
        const modal = document.getElementById('chronicon-modal');
        if (modal) modal.style.display = 'none';
    },

    refreshOverview: function() {
        const modalContent = document.getElementById('chronicon-modal-content');
        if (modalContent) {
            modalContent.innerHTML = ChroniconSystem.renderOverviewHTML('modal');
        }
        if (typeof UI !== 'undefined' && UI.renderChroniconWindow) {
            UI.renderChroniconWindow();
        }
    },

    forceSync: function() {
        localStorage.removeItem(ChroniconSystem.CACHE_KEY);
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.toast('🔄 Synchronizuji Chronicon z GitHubu...', 'info');
        }
        fetch(ChroniconSystem.URL + '?t=' + Date.now())
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function(snap) {
                snap._fetched = Date.now();
                localStorage.setItem(ChroniconSystem.CACHE_KEY, JSON.stringify(snap));
                ChroniconSystem._snap = snap;
                ChroniconSystem._apply(snap);
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.toast('📜 Chronicon úspěšně synchronizován!', 'success');
                }
                ChroniconSystem.refreshOverview();
            })
            .catch(function(err) {
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.toast('⚠️ Nelze načíst Chronicon: ' + err.message, 'warn');
                }
            });
    },

    updateUIHeader: function() {
        const snap = ChroniconSystem._snap;
        const pillVal = document.getElementById('pill-chronicon-val');
        if (pillVal && snap) {
            const tension = (snap.region && typeof snap.region.tension === 'number') ? snap.region.tension : 0;
            pillVal.textContent = tension > 50 ? `1465 ⚠️` : `1465`;
        }

        const badge = document.getElementById('chronicon-header-badge');
        const badgeMobile = document.getElementById('chronicon-header-badge-mobile');
        if (snap) {
            const hasUnreadAbbot = snap.abbot && snap.abbot.message && (localStorage.getItem('scriptorium_chronicon_abbot_last') !== (snap.abbot.message_id || snap.abbot.message));
            const hasPendingAdvisory = typeof GameState !== 'undefined' && GameState.chroniconAdvisory && GameState.chroniconAdvisory.pending;
            const showBadge = (hasUnreadAbbot || hasPendingAdvisory);
            if (badge) badge.style.display = showBadge ? 'inline-block' : 'none';
            if (badgeMobile) badgeMobile.style.display = showBadge ? 'inline-block' : 'none';
        }
    },

    renderOverviewHTML: function(context) {
        const snap = ChroniconSystem._snap || ChroniconSystem._loadCache();
        const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';

        if (!snap) {
            return `
                <div style="text-align:center; padding:50px 20px;">
                    <div style="font-size:3rem; margin-bottom:15px; animation: pulse 2s infinite;">📜</div>
                    <h3 style="font-family:'Cinzel Decorative', serif; color:var(--accent-gold, #c5a059);">CHRONICON — Živý Svět 1465</h3>
                    <p style="opacity:0.8; max-width:450px; margin:10px auto; font-style:italic;">
                        ${lang === 'en' ? 'Connecting to Chronicon generative world engine on GitHub...' : 'Připojování k záložnímu živému světu Chroniconu na GitHubu...'}
                    </p>
                    <button onclick="ChroniconSystem.forceSync()" class="craft-btn" style="margin-top:15px; padding:8px 18px; font-weight:bold;">
                        🔄 ${lang === 'en' ? 'Fetch World State' : 'Načíst stav světa'}
                    </button>
                </div>
            `;
        }

        const dateStr = (snap.time && snap.time.date_string) || 'Červenec 1465, Olomoucko';
        const tension = (snap.region && typeof snap.region.tension === 'number') ? snap.region.tension : 25;
        const tColor = tension >= 70 ? '#c0392b' : tension >= 40 ? '#d35400' : '#27ae60';
        const tLabel = tension >= 70
            ? (lang === 'en' ? 'High Tension / Unrest' : 'Vysoké napětí / Nepokoje')
            : tension >= 40
                ? (lang === 'en' ? 'Unsettled Region' : 'Neklidný kraj')
                : (lang === 'en' ? 'Peace & Quiet' : 'Mír a klid');

        const wx = snap.weather || { icon: '🌤️', name: 'Polojasno', desc: 'Příznivý vítr nad Moravou' };
        const goldenBadge = (snap.region && snap.region.goldenAge)
            ? `<span style="background:linear-gradient(135deg, #f39c12, #f1c40f); color:#2c1810; padding:3px 10px; border-radius:12px; font-size:0.75rem; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.2);">✨ ${lang === 'en' ? 'Golden Age of the Region' : 'Zlatá éra kraje'}</span>`
            : '';

        let html = `
            <div style="border-bottom:2px solid var(--accent-gold, #c5a059); padding-bottom:12px; margin-bottom:18px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h2 style="font-family:'Cinzel Decorative', serif; margin:0; color:var(--accent-gold, #c5a059); font-size:1.35rem; display:flex; align-items:center; gap:8px;">
                            <span>📜</span> CHRONICON — ${lang === 'en' ? 'Living World' : 'Živý Svět Olomoucka'}
                            ${goldenBadge}
                        </h2>
                        <div style="font-size:0.85rem; opacity:0.85; margin-top:3px; font-style:italic;">
                            ${lang === 'en' ? 'Generative environment simulation engine for Scriptorium (Anno Domini 1465)' : 'Generativní simulace živého světa v roce 1465 propojená se Scriptorium'}
                        </div>
                    </div>
                    <button onclick="ChroniconSystem.forceSync()" class="craft-btn" style="padding:6px 14px; font-size:0.8rem; display:flex; align-items:center; gap:5px;" title="${lang === 'en' ? 'Sync live snapshot from GitHub' : 'Aktualizovat živý snapshot z GitHubu'}">
                        🔄 ${lang === 'en' ? 'Sync GitHub' : 'Obnovit data'}
                    </button>
                </div>
            </div>
        `;

        if (snap.abbot && snap.abbot.message) {
            const abbotText = (lang === 'en' && snap.abbot.message_en) ? snap.abbot.message_en : snap.abbot.message;
            html += `
                <div style="background:linear-gradient(135deg, rgba(197,160,89,0.18), rgba(120,80,40,0.12)); border:2px solid rgba(197,160,89,0.5); border-radius:8px; padding:16px 20px; margin-bottom:20px; position:relative; box-shadow: inset 0 0 15px rgba(197,160,89,0.1);">
                    <div style="position:absolute; top:-12px; left:20px; background:#8b0000; color:#ffd700; padding:2px 10px; border-radius:4px; font-family:'Cinzel', serif; font-size:0.75rem; font-weight:bold; letter-spacing:1px; box-shadow:0 2px 5px rgba(0,0,0,0.4); display:flex; align-items:center; gap:4px;">
                        ✝️ ${lang === 'en' ? 'DECREE OF THE ABBOT' : 'DEKRÉT OPATA KLÁŠTERA'}
                    </div>
                    <div style="font-style:italic; font-size:1.02rem; line-height:1.6; margin-top:6px; color:var(--ink-primary, #2c241b);">
                        "${abbotText}"
                    </div>
                    <div style="text-align:right; font-size:0.78rem; opacity:0.75; margin-top:8px; font-family:'Cinzel', serif;">
                        — ${snap.abbot.author || (lang === 'en' ? 'Abbot of the Monastery' : 'Opat Kláštera')} (${dateStr})
                    </div>
                </div>
            `;
        }

        // Active World Buffs
        const buffs = ChroniconSystem.getBuffs();
        let buffBadges = [];
        if (buffs.scriptXpBonus > 0) buffBadges.push(`📜 +${Math.round(buffs.scriptXpBonus * 100)}% ${lang === 'en' ? 'Scripting XP' : 'Zkušenosti s psaním'}`);
        if (buffs.vigorRegenBonus > 0) buffBadges.push(`⚡ +${Math.round(buffs.vigorRegenBonus * 100)}% ${lang === 'en' ? 'Energy Regen' : 'Obnova energie'}`);
        if (buffs.craftSuccessBonus > 0) buffBadges.push(`🔨 +10% ${lang === 'en' ? 'Forge Quality' : 'Kvalita v dílně'}`);
        if (buffs.tallowCostDiscount > 0) buffBadges.push(`🕯️ -20% ${lang === 'en' ? 'Candle/Wax Cost' : 'Sleva na vosk & svíce'}`);
        if (buffs.portaVisitorBonus > 0) buffBadges.push(`🚪 +30% ${lang === 'en' ? 'Gate Visitors' : 'Návštěvnost u brány'}`);

        let buffBannerHTML = '';
        if (buffBadges.length) {
            buffBannerHTML = `
                <div style="background:rgba(39,174,96,0.1); border:1px solid rgba(39,174,96,0.35); border-radius:6px; padding:8px 12px; margin-bottom:16px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="font-size:0.8rem; font-weight:bold; color:#27ae60;">✨ ${lang === 'en' ? 'Active World Blessings:' : 'Aktivní požehnání kraje:'}</span>
                    ${buffBadges.map(b => `<span style="font-size:0.75rem; background:rgba(39,174,96,0.2); color:#1e8449; padding:2px 8px; border-radius:10px; font-weight:600;">${b}</span>`).join('')}
                </div>
            `;
        }

        html += buffBannerHTML;

        html += `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:20px;">
                <div style="background:rgba(0,0,0,0.04); border:1px solid rgba(197,160,89,0.3); border-radius:6px; padding:10px 14px;">
                    <div style="font-size:0.72rem; opacity:0.7; font-family:'Cinzel'; text-transform:uppercase;">📅 ${lang === 'en' ? 'World Date' : 'Datum ve světě'}</div>
                    <div style="font-weight:bold; font-size:0.92rem; margin-top:2px;">${dateStr}</div>
                </div>

                <div style="background:rgba(0,0,0,0.04); border:1px solid rgba(197,160,89,0.3); border-radius:6px; padding:10px 14px;">
                    <div style="font-size:0.72rem; opacity:0.7; font-family:'Cinzel'; text-transform:uppercase;">🌤️ ${lang === 'en' ? 'Weather' : 'Počasí & Podnebí'}</div>
                    <div style="font-weight:bold; font-size:0.92rem; margin-top:2px; display:flex; align-items:center; gap:6px;">
                        <span>${wx.icon || '🌤️'}</span> ${lang === 'en' ? (wx.name_en || wx.name) : wx.name}
                    </div>
                    <div style="font-size:0.7rem; opacity:0.7; margin-top:2px;">${wx.desc || ''}</div>
                </div>

                <div style="background:rgba(0,0,0,0.04); border:1px solid rgba(197,160,89,0.3); border-radius:6px; padding:10px 14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.72rem; opacity:0.7; font-family:'Cinzel'; text-transform:uppercase;">⚖️ ${lang === 'en' ? 'Tension' : 'Napětí v kraji'}</span>
                        <span style="font-size:0.8rem; font-weight:bold; color:${tColor}">${tension}%</span>
                    </div>
                    <div style="height:6px; background:rgba(0,0,0,0.1); border-radius:3px; overflow:hidden; margin:6px 0 4px 0;">
                        <div style="height:100%; width:${tension}%; background:${tColor}; transition:width 0.5s;"></div>
                    </div>
                    <div style="font-size:0.7rem; color:${tColor}; font-weight:600;">${tLabel}</div>
                </div>

                <div style="background:rgba(0,0,0,0.04); border:1px solid rgba(197,160,89,0.3); border-radius:6px; padding:10px 14px;">
                    <div style="font-size:0.72rem; opacity:0.7; font-family:'Cinzel'; text-transform:uppercase;">🏰 ${lang === 'en' ? 'Region Status' : 'Obyvatelé & Kraj'}</div>
                    <div style="font-weight:bold; font-size:0.92rem; margin-top:2px;">
                        👥 ${typeof (snap.region && snap.region.population) === 'number'
                            ? snap.region.population.toLocaleString(lang === 'en' ? 'en-US' : 'cs-CZ')
                            : '—'} ${lang === 'en' ? 'souls' : 'duší'}
                    </div>
                    <div style="font-size:0.7rem; opacity:0.7; margin-top:2px;">
                        ${lang === 'en' ? 'Olomouc Region 1465' : 'Olomoucká diecéze'}
                    </div>
                </div>
            </div>
        `;

        // Krok "Opat/real data" — karty teď čtou label/profese/náladu/jmění
        // přímo ze snapshotu (snap.actors), ne z hardcoded tabulky ani z
        // lokální náhodné procházky. chroniconLocal zůstává jen pro .quest
        // (lokální barter "Splnit požadavek", beze změny).
        const localActors = (typeof GameState !== 'undefined' && GameState.chroniconLocal && GameState.chroniconLocal.actors)
            ? GameState.chroniconLocal.actors
            : {};

        const realActors = Array.isArray(snap.actors) ? snap.actors : [];

        html += `
            <div style="margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(197,160,89,0.4); padding-bottom:6px; margin-bottom:12px;">
                    <h3 style="font-family:'Cinzel Decorative', serif; margin:0; color:var(--accent-gold, #c5a059); font-size:1.05rem;">
                        👥 ${lang === 'en' ? 'Figures & Guilds of the Region' : 'Postavy a Cechy Olomoucka'}
                    </h3>
                    <span style="font-size:0.75rem; opacity:0.7; font-style:italic;">
                        ${lang === 'en' ? 'Interactions affect mood and region stability' : 'Interakce a pomoc ovlivňují náladu a mír'}
                    </span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(170px, 1fr)); gap:10px;">
        `;

        const ACTOR_DESCS = {
            vrchnost: 'Feudální páni Olomouce. Vyžadují respekt a darování ve Studovně.',
            mlynar: 'Dodává mouku pro chléb. Ovlivňuje stav zásob v Cellariu.',
            kovar: 'Kuje železo a nástroje. Důležitý pro dílnu a opravy.',
            uhlic: 'Pálí dřevěné uhlí v hlubokých lesích pro kováře a vyhřívání.',
            vorar: 'Splavuje dřevo po řece Moravě pro klášterní stavby.',
            rybnikar: 'Stará se o klášterní rybníky, klíčové pro postní jídlo.',
            prevoznik: 'Propojuje břehy řeky, přivádí poutníky k bráně kláštera.',
            valach: 'Chová ovce, dodává vlnu a skopové maso.',
            klaster: 'Opat kláštera ve městě. Tvoje modlitby a mše přímo posilují jeho postavení!',
            vcelar: 'Stáčí med a vosk — hlavní zdroj pro výrobu klášterních svící.',
        };

        realActors.forEach(baseA => {
            const id = baseA.id;
            const label = lang === 'en' ? (baseA.label_en || baseA.label) : baseA.label;
            const prof = lang === 'en' ? (baseA.profession_en || baseA.profession) : baseA.profession;
            const icon = ChroniconSystem._ACTOR_ICONS[id] || '👤';
            const desc = ACTOR_DESCS[id] || prof;

            const mood = typeof baseA.mood === 'number' ? baseA.mood : 50;
            const wealth = typeof baseA.wealth === 'number' ? baseA.wealth : 50;
            const quest = (localActors[id] && localActors[id].quest) || null;

            let questBtnHTML = '';
            if (quest) {
                const questText = lang === 'en' ? (quest.label_en || quest.label_cs) : quest.label_cs;
                questBtnHTML = `
                    <div style="margin-top:6px; padding:4px 6px; background:rgba(241,196,15,0.15); border:1px solid rgba(241,196,15,0.4); border-radius:4px; font-size:0.68rem; color:#b7950b;">
                        <div style="font-weight:bold; margin-bottom:2px;">⚠️ ${questText}</div>
                        <button onclick="ChroniconSystem.interactWithActor('${id}', 'quest')" class="craft-btn" style="width:100%; padding:2px 4px; font-size:0.65rem; font-weight:bold; margin-top:2px;">
                            🎁 ${lang === 'en' ? 'Fulfill Request' : 'Splnit požadavek'}
                        </button>
                    </div>
                `;
            }

            html += `
                <div style="padding:10px; background:rgba(0,0,0,0.03); border:1px solid rgba(197,160,89,0.25); border-radius:6px; display:flex; flex-direction:column; justify-content:space-between;" title="${desc}">
                    <div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size:1.2rem;">${icon}</span>
                            <div>
                                <div style="font-size:0.82rem; font-weight:bold; line-height:1.1;">${label}</div>
                                <div style="font-size:0.65rem; opacity:0.65;">${prof}</div>
                            </div>
                        </div>
                        <div style="margin-top:8px;">
                            <div style="display:flex; align-items:center; gap:4px; margin-bottom:3px;">
                                <span style="font-size:0.58rem; width:36px; opacity:0.65;">${lang === 'en' ? 'Mood' : 'Nálada'}</span>
                                <div style="flex:1; height:4px; background:rgba(0,0,0,0.1); border-radius:2px; overflow:hidden;">
                                    <div style="height:100%; width:${mood}%; background:#27ae60;"></div>
                                </div>
                                <span style="font-size:0.58rem; opacity:0.7;">${mood}%</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:4px;">
                                <span style="font-size:0.58rem; width:36px; opacity:0.65;">${lang === 'en' ? 'Wealth' : 'Jmění'}</span>
                                <div style="flex:1; height:4px; background:rgba(0,0,0,0.1); border-radius:2px; overflow:hidden;">
                                    <div style="height:100%; width:${wealth}%; background:#c5a059;"></div>
                                </div>
                                <span style="font-size:0.58rem; opacity:0.7;">${wealth}%</span>
                            </div>
                        </div>
                        ${questBtnHTML}
                    </div>

                    <div style="margin-top:8px; display:flex; gap:4px;">
                        <button onclick="ChroniconSystem.interactWithActor('${id}', 'bless')" style="flex:1; padding:3px 0; font-size:0.65rem; background:rgba(197,160,89,0.15); border:1px solid rgba(197,160,89,0.4); border-radius:3px; cursor:pointer; color:var(--ink-primary);" title="${lang === 'en' ? 'Bestow blessing / candles' : 'Věnovat svíčky / požehnání'}">
                            ✨ ${lang === 'en' ? 'Bless' : 'Požehnat'}
                        </button>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;

        const activeFilter = ChroniconSystem._activeFilter || 'all';

        let allEntries = [];
        if (snap.chronicle_local) {
            allEntries = allEntries.concat(snap.chronicle_local.map(e => ({ ...e, cat: 'local' })));
        }
        if (snap.chronicle_distant) {
            allEntries = allEntries.concat(snap.chronicle_distant.map(e => ({ ...e, cat: 'distant' })));
        }
        if (snap.chronicle_monastery) {
            allEntries = allEntries.concat(snap.chronicle_monastery.map(e => ({ ...e, cat: 'monastery' })));
        }
        if (!allEntries.length && snap.chronicle) {
            allEntries = snap.chronicle.map(e => ({ ...e, cat: 'all' }));
        }

        let filtered = allEntries;
        if (activeFilter === 'local') filtered = allEntries.filter(e => e.cat === 'local');
        else if (activeFilter === 'distant') filtered = allEntries.filter(e => e.cat === 'distant');
        else if (activeFilter === 'monastery') filtered = allEntries.filter(e => e.cat === 'monastery');

        const btnStyle = (f) => f === activeFilter
            ? 'background:var(--accent-gold, #c5a059); color:#fff; border:1px solid var(--accent-gold, #c5a059); font-weight:bold;'
            : 'background:rgba(0,0,0,0.04); color:var(--ink-primary); border:1px solid rgba(197,160,89,0.3);';

        html += `
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-bottom:1px solid rgba(197,160,89,0.4); padding-bottom:8px; margin-bottom:12px;">
                    <h3 style="font-family:'Cinzel Decorative', serif; margin:0; color:var(--accent-gold, #c5a059); font-size:1.05rem;">
                        📰 ${lang === 'en' ? 'Chronicle of Events & Rumors' : 'Živá Kronika Událostí a Zpráv'}
                    </h3>
                    <div style="display:flex; gap:4px; flex-wrap:wrap;">
                        <button onclick="ChroniconSystem.setFilter('all')" style="padding:4px 10px; font-size:0.75rem; border-radius:4px; cursor:pointer; ${btnStyle('all')}">
                            ${lang === 'en' ? 'All' : 'Vše'} (${allEntries.length})
                        </button>
                        <button onclick="ChroniconSystem.setFilter('local')" style="padding:4px 10px; font-size:0.75rem; border-radius:4px; cursor:pointer; ${btnStyle('local')}">
                            🏘️ ${lang === 'en' ? 'Local' : 'Olomoucko'}
                        </button>
                        <button onclick="ChroniconSystem.setFilter('distant')" style="padding:4px 10px; font-size:0.75rem; border-radius:4px; cursor:pointer; ${btnStyle('distant')}">
                            🌍 ${lang === 'en' ? 'Distant' : 'Širý Svět'}
                        </button>
                        <button onclick="ChroniconSystem.setFilter('monastery')" style="padding:4px 10px; font-size:0.75rem; border-radius:4px; cursor:pointer; ${btnStyle('monastery')}">
                            ⛪ ${lang === 'en' ? 'Monastery' : 'Klášter'}
                        </button>
                    </div>
                </div>

                <div style="max-height:280px; overflow-y:auto; padding-right:6px; display:flex; flex-direction:column; gap:8px;">
        `;

        if (!filtered.length) {
            html += `
                <div style="text-align:center; padding:20px; opacity:0.6; font-style:italic; font-size:0.88rem;">
                    ${lang === 'en' ? 'No chronicle records in this category.' : 'V této kategorii nejsou žádné nové záznamy.'}
                </div>
            `;
        } else {
            filtered.forEach(e => {
                const text = lang === 'en' ? (e.text_en || e.text) : (e.text_cs || e.text);
                const icon = e.icon || (e.cat === 'local' ? '🏘️' : e.cat === 'distant' ? '🌍' : '⛪');
                const catTag = e.cat === 'local' ? 'Olomoucko' : e.cat === 'distant' ? 'Širý Svět' : 'Klášter';
                html += `
                    <div style="padding:10px 12px; background:rgba(255,255,255,0.4); border-left:3px solid var(--accent-gold, #c5a059); border-radius:0 4px 4px 0; font-size:0.88rem; line-height:1.45;">
                        <div style="display:flex; justify-content:space-between; opacity:0.65; font-size:0.7rem; margin-bottom:3px; font-family:'Cinzel';">
                            <span>${catTag}</span>
                            <span>${e.season || ''} ${e.year || '1465'}</span>
                        </div>
                        <div>${icon} ${text}</div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;

        return html;
    },

};
