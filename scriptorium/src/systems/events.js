const EventsSystem = {
    events: [
        {
            id: 'pellinga_swedish_siege',
            // eventy-audit-mrd (05.09.2026) pending-timeout fix: pole "nego"
            // (index 2, poslední) ztrácí 60 % knih — NENÍ to bezpečná volba.
            // "wall" (index 1) ztrácí 0 % (vrátí se za 48h) — skutečně
            // nejbezpečnější, proto explicitní timeoutIndex místo spoléhání
            // na "poslední v poli".
            timeoutIndex: 1,
            titleKey: 'events.swedish_siege.title',
            textKey: 'events.swedish_siege.text',
            image: '/events/pellinga_swedish_siege.jpg',
            trigger: () => {
                const totalBooks = (GameState.inventory['paper'] || 0) + 
                                  (GameState.inventory['research'] || 0) + 
                                  (GameState.inventory['common_codex'] || 0) + 
                                  (GameState.inventory['luxury_codex'] || 0) + 
                                  (GameState.inventory['vellum_codex'] || 0);
                return totalBooks >= 20 && Math.random() < 0.02;
            },
            choices: [
                {
                    labelKey: "events.swedish_siege.sartorius_btn",
                    descKey: "events.swedish_siege.sartorius_desc",
                    action: () => {
                        if(GameState.inventory['paper']) Game.addItem('paper', -Math.floor(GameState.inventory['paper'] * 0.4));
                        if(GameState.inventory['research']) Game.addItem('research', -Math.floor(GameState.inventory['research'] * 0.4));
                        if(GameState.inventory['common_codex']) Game.addItem('common_codex', -Math.floor(GameState.inventory['common_codex'] * 0.4));
                        
                        UI.notifyPanel(t("events.swedish_siege.sartorius_notif"), 'system');
                        EventsSystem._addKronika(t("events.swedish_siege.sartorius_notif"));
                        return t("events.swedish_siege.sartorius_res");
                    }
                },
                {
                    labelKey: "events.swedish_siege.wall_btn",
                    descKey: "events.swedish_siege.wall_desc",
                    action: () => {
                        GameState.eventData = GameState.eventData || {};
                        GameState.eventData.walledBooks = {
                            paper: GameState.inventory['paper'] || 0,
                            research: GameState.inventory['research'] || 0,
                            common_codex: GameState.inventory['common_codex'] || 0,
                            luxury_codex: GameState.inventory['luxury_codex'] || 0,
                            vellum_codex: GameState.inventory['vellum_codex'] || 0,
                            returnTime: Date.now() + (48 * 60 * 60 * 1000)
                        };
                        Game.addItem('paper', -(GameState.inventory['paper'] || 0));
                        Game.addItem('research', -(GameState.inventory['research'] || 0));
                        Game.addItem('common_codex', -(GameState.inventory['common_codex'] || 0));
                        Game.addItem('luxury_codex', -(GameState.inventory['luxury_codex'] || 0));
                        Game.addItem('vellum_codex', -(GameState.inventory['vellum_codex'] || 0));
                        
                        UI.notifyPanel(t("events.swedish_siege.wall_notif"), 'system');
                        EventsSystem._addKronika(t("events.swedish_siege.wall_notif"));
                        return t("events.swedish_siege.wall_res");
                    }
                },
                {
                    labelKey: "events.swedish_siege.nego_btn",
                    descKey: "events.swedish_siege.nego_desc",
                    action: () => {
                        if(GameState.inventory['paper']) Game.addItem('paper', -Math.floor(GameState.inventory['paper'] * 0.6));
                        if(GameState.inventory['common_codex']) Game.addItem('common_codex', -Math.floor(GameState.inventory['common_codex'] * 0.6));
                        
                        UI.notifyPanel(t("events.swedish_siege.nego_notif"), 'system');
                        EventsSystem._addKronika(t("events.swedish_siege.nego_notif"));
                        return t("events.swedish_siege.nego_res");
                    }
                }
            ],
            canTrigger: true
        },
        {
            id: 'hidden_incunabula',
            titleKey: 'events.hidden_incunabula.title',
            textKey: 'events.hidden_incunabula.text',
            trigger: () => {
                const hasBook = GameState.library && GameState.library.readBooks.includes('book_kutnohorska_bible');
                const hasLuxury = (GameState.inventory['luxury_codex'] || 0) > 0;
                return hasBook && hasLuxury && Math.random() < 0.01;
            },
            choices: [
                {
                    labelKey: "events.hidden_incunabula.compare_btn",
                    descKey: "events.hidden_incunabula.compare_desc",
                    action: () => {
                        if(Math.random() > 0.3) {
                            Game.addItem('research', 10);
                            Game.addItem('luxury_codex', 1);
                            // Scrinium Recipe Folios MRD — malá šance na odhalení tajného spisu
                            if (typeof SecretsSystem !== 'undefined' && GameState.secrets && GameState.secrets.forbiddenUnlocked && Math.random() < 0.1) {
                                const db = (typeof ScriniumDB !== 'undefined') ? ScriniumDB.folios : [];
                                const unfound = db.filter(f => f.subtab === 'tajne_spisy' && (!GameState.scrinium || !GameState.scrinium.folios[f.id] || !GameState.scrinium.folios[f.id].found));
                                if (unfound.length > 0) {
                                    const pick = unfound[Math.floor(Math.random() * unfound.length)];
                                    SecretsSystem.unlockFolioById(pick.id);
                                }
                            }
                            UI.notifyPanel(t("events.hidden_incunabula.compare_notif_ok"), 'system');
                            EventsSystem._addKronika(t("events.hidden_incunabula.compare_notif_ok"));
                            return t("events.hidden_incunabula.compare_res_ok");
                        } else {
                            Game.addItem('research', 2);
                            UI.notifyPanel(t("events.hidden_incunabula.compare_notif_fail"), 'system');
                            EventsSystem._addKronika(t("events.hidden_incunabula.compare_notif_fail"));
                            return t("events.hidden_incunabula.compare_res_fail");
                        }
                    }
                },
                {
                    labelKey: "events.hidden_incunabula.ignore_btn",
                    descKey: "events.hidden_incunabula.ignore_desc",
                    action: () => {
                        UI.notifyPanel(t("events.hidden_incunabula.ignore_notif"), 'system');
                        EventsSystem._addKronika(t("events.hidden_incunabula.ignore_notif"));
                        return t("events.hidden_incunabula.ignore_res");
                    }
                }
            ],
            canTrigger: true
        },
        {
            id: 'discovered_old_vaults',
            titleKey: 'events.discovered_old_vaults.title',
            textKey: 'events.discovered_old_vaults.text',
            trigger: () => {
                if (typeof CellariumSystem === 'undefined' || !CellariumSystem.hasCellarium()) return false;
                const storages = ['almarium','cella','cella_fermentaria','cellarium_vini','fabrica','fodina','fornax_ferraria','foudres','horreum','humno','prelum','prelum_olei','sulci','uvarium'];
                const allBuilt = storages.every(id => GameState.storage && GameState.storage[id] && GameState.storage[id].built);
                if (!allBuilt) return false;
                if (GameState.oldCellarsFound) return false;
                return Math.random() < 0.02;
            },
            choices: [
                {
                    labelKey: "events.discovered_old_vaults.explore_btn",
                    descKey: "events.discovered_old_vaults.explore_desc",
                    action: () => {
                        GameState.oldCellarsFound = true;
                        // Scrinium Recipe Folios MRD — malá šance na odhalení tajného spisu
                        if (typeof SecretsSystem !== 'undefined' && GameState.secrets && GameState.secrets.forbiddenUnlocked && Math.random() < 0.15) {
                            const db = (typeof ScriniumDB !== 'undefined') ? ScriniumDB.folios : [];
                            const unfound = db.filter(f => f.subtab === 'tajne_spisy' && (!GameState.scrinium || !GameState.scrinium.folios[f.id] || !GameState.scrinium.folios[f.id].found));
                            if (unfound.length > 0) {
                                const pick = unfound[Math.floor(Math.random() * unfound.length)];
                                SecretsSystem.unlockFolioById(pick.id);
                            }
                        }
                        UI.notifyPanel(t("events.discovered_old_vaults.explore_notif"), 'system');
                        EventsSystem._addKronika(t("events.discovered_old_vaults.explore_notif"));
                        return t("events.discovered_old_vaults.explore_res");
                    }
                },
                {
                    labelKey: "events.discovered_old_vaults.wall_btn",
                    descKey: "events.discovered_old_vaults.wall_desc",
                    action: () => {
                        UI.notifyPanel(t("events.discovered_old_vaults.wall_notif"), 'system');
                        EventsSystem._addKronika(t("events.discovered_old_vaults.wall_notif"));
                        return t("events.discovered_old_vaults.wall_res");
                    }
                },
                {
                    labelKey: "events.discovered_old_vaults.wait_btn",
                    descKey: "events.discovered_old_vaults.wait_desc",
                    action: () => {
                        GameState.events.triggered['discovered_old_vaults'] = false;
                        UI.notifyPanel(t("events.discovered_old_vaults.wait_notif"), 'system');
                        EventsSystem._addKronika(t("events.discovered_old_vaults.wait_notif"));
                        return t("events.discovered_old_vaults.wait_res");
                    }
                }
            ],
            canTrigger: true
        }
    ],
    
    // ── Opakovatelné náhodné eventy (vlastní cooldown, ne navždy-jednou) ──────
    repeatableEvents: [
        // B1 — Návštěva inkvizitora
        {
            id: 'inq_morning_visit',
            titleKey: 'events.inq_morning_visit.title',
            textKey:  'events.inq_morning_visit.text',
            cooldownDays: 14,
            trigger: () => {
                if (GameState.flags && GameState.flags.inquisitorComing) return true; // navázáno na Filipojakubskou noc
                return !!(GameState.secrets && GameState.secrets.laboratoryUnlocked) && Math.random() < 0.005;
            },
            choices: [
                {
                    labelKey: 'events.inq_morning_visit.open_btn',
                    descKey:  'events.inq_morning_visit.open_desc',
                    action: () => {
                        if (Math.random() < 0.7) {
                            PersonaSystem.addInfluence('church', 5);
                            UI.notifyPanel(t('events.inq_morning_visit.open_notif_ok'), 'system');
                            EventsSystem._addKronika(t('events.inq_morning_visit.open_notif_ok'));
                            return t('events.inq_morning_visit.open_res_ok');
                        } else {
                            if (!GameState.flags) GameState.flags = {};
                            GameState.flags.athanorSealedUntil = Date.now() + (48 * 3600000);
                            VigorSystem.addFatigue(20);
                            UI.notifyPanel(t('events.inq_morning_visit.open_notif_fail'), 'warning');
                            EventsSystem._addKronika(t('events.inq_morning_visit.open_notif_fail'));
                            return t('events.inq_morning_visit.open_res_fail');
                        }
                    }
                },
                {
                    labelKey: 'events.inq_morning_visit.bribe_btn',
                    descKey:  'events.inq_morning_visit.bribe_desc',
                    action: () => {
                        if (CellariumSystem.getGrose() < 20) {
                            UI.notifyPanel(t('events.inq_morning_visit.bribe_notif_poor'), 'warning');
                            return t('events.inq_morning_visit.bribe_res_poor');
                        }
                        CellariumSystem.spendGrose(20);
                        PersonaSystem.addInfluence('church', -5);
                        UI.notifyPanel(t('events.inq_morning_visit.bribe_notif'), 'system');
                        EventsSystem._addKronika(t('events.inq_morning_visit.bribe_notif'));
                        return t('events.inq_morning_visit.bribe_res');
                    }
                },
                {
                    labelKey: 'events.inq_morning_visit.refuse_btn',
                    descKey:  'events.inq_morning_visit.refuse_desc',
                    action: () => {
                        if (Math.random() < 0.5) {
                            PersonaSystem.addInfluence('church', 10);
                            UI.notifyPanel(t('events.inq_morning_visit.refuse_notif_ok'), 'system');
                            EventsSystem._addKronika(t('events.inq_morning_visit.refuse_notif_ok'));
                            return t('events.inq_morning_visit.refuse_res_ok');
                        } else {
                            PersonaSystem.addInfluence('church', -8);
                            UI.notifyPanel(t('events.inq_morning_visit.refuse_notif_fail'), 'warning');
                            EventsSystem._addKronika(t('events.inq_morning_visit.refuse_notif_fail'));
                            return t('events.inq_morning_visit.refuse_res_fail');
                        }
                    }
                }
            ]
        },

        // B-Haeresis — Nájezd Inkvizice (inquisitionHeat >= 80, důsledek kacířských lektvarů)
        {
            id: 'inq_raid',
            // eventy-audit-mrd (05.09.2026) pending-timeout fix: poslední
            // volba je "Podplatit notáře (1000 grošů)" — v žádném případě
            // bezpečný auto-default. "Confess" (index 0) je deterministické,
            // bez grošů, bez gamblingu.
            timeoutIndex: 0,
            icon: '⚖️',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'The Inquisition Comes' : 'Přijela Inkvizice',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*This is no polite morning visit. Three riders in black stop at the gate, and with them a notary with a sealed writ. Someone has spoken of strange lights and stranger smells from your workshop. The tribunal has heard enough to come in person.*'
                    : '*Tohle není zdvořilá ranní návštěva. U brány zastavují tři jezdci v černém, a s nimi notář s pečetěnou listinou. Někdo mluvil o podivných světlech a ještě podivnějším zápachu z vaší dílny. Tribunál slyšel dost na to, aby přijel osobně.*';
            },
            cooldownDays: 21,
            trigger: () => {
                return !!(GameState.secrets && GameState.secrets.laboratoryUnlocked)
                    && (GameState.secrets && (GameState.secrets.inquisitionHeat || 0) >= 80);
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Confess and do penance' : 'Přiznat se a podstoupit pokání',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Surrender the heretical brews. Public penance, but a clean slate.'
                        : 'Vydat kacířské lektvary. Veřejné pokání, ale čistý štít.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const heretical = ['haereticum_stellarum', 'haereticum_circuli', 'haereticum_fortunae', 'haereticum_amoris'];
                        let lost = 0;
                        heretical.forEach(id => {
                            const qty = GameState.inventory[id] || 0;
                            if (qty > 0) { lost += qty; Game.removeItem(id, qty); }
                        });
                        if (GameState.secrets) GameState.secrets.inquisitionHeat = 0;
                        if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', -10);
                        if (typeof HealthSystem !== 'undefined' && HealthSystem.removeCondition) {
                            HealthSystem.removeCondition('haeresis_occulta', true);
                        }
                        const msg = en
                            ? `Public penance. ${lost} heretical brews surrendered and destroyed. The tribunal's suspicion is gone — for now.`
                            : `Veřejné pokání. ${lost}× kacířských lektvarů vydáno a zničeno. Podezření tribunálu je pryč — prozatím.`;
                        UI.notifyPanel(msg, 'warning');
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Deny everything' : 'Vše zapřít',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Risky. If believed, suspicion eases. If not — the Athanor is sealed for a long time.'
                        : 'Riskantní. Uvěří-li, podezření poleví. Neuvěří-li — Athanor bude zapečetěný nadlouho.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (Math.random() < 0.5) {
                            if (GameState.secrets) GameState.secrets.inquisitionHeat = 40;
                            const msg = en
                                ? 'The notary hesitates, unconvinced but unable to prove otherwise. They leave — suspicion lingers, but eases.'
                                : 'Notář váhá, nepřesvědčen, ale bez důkazu. Odjíždějí — podezření trvá, ale poleví.';
                            UI.notifyPanel(msg, 'system');
                            EventsSystem._addKronika(msg);
                            return msg;
                        } else {
                            if (!GameState.flags) GameState.flags = {};
                            GameState.flags.athanorSealedUntil = Date.now() + (5 * 24 * 3600000);
                            if (typeof VigorSystem !== 'undefined') VigorSystem.addFatigue(25);
                            const msg = en
                                ? 'They did not believe you. The Athanor is sealed under the tribunal\'s wax, for five long days.'
                                : 'Neuvěřili vám. Athanor je zapečetěn tribunálním voskem, na dlouhých pět dní.';
                            UI.notifyPanel(msg, 'warning');
                            EventsSystem._addKronika(msg);
                            return msg;
                        }
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Bribe the notary (1000 groše)' : 'Podplatit notáře (1000 grošů)',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Steep, but certain. The writ quietly disappears.'
                        : 'Drahé, ale jisté. Listina tiše zmizí.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (CellariumSystem.getGrose() < 1000) {
                            const msg = en
                                ? 'You do not have 1000 groše. The notary notices your empty purse and writes something down.'
                                : 'Nemáte 1000 grošů. Notář si všimne prázdného měšce a něco si zapisuje.';
                            UI.notifyPanel(msg, 'warning');
                            return msg;
                        }
                        CellariumSystem.spendGrose(1000);
                        if (GameState.secrets) GameState.secrets.inquisitionHeat = 0;
                        if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', -15);
                        const msg = en
                            ? 'A heavy purse changes hands beneath the table. The writ is folded away, unread. The tribunal rides on.'
                            : 'Těžký měšec mění majitele pod stolem. Listina je sbalena, nepřečtená. Tribunál jede dál.';
                        UI.notifyPanel(msg, 'system');
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                }
            ]
        },

        // B-Cechy — Cechovní rváči (guild tension >= 70, důsledek fušerství —
        // mirror inq_raid, MRD v0.2 §2.3 / v0.7, 25.8.2026). Tension je sdílená
        // world-hodnota z CHRONICONu — event ji lokálně NERESETUJE (to by bylo
        // falešné přepsání sdíleného stavu). Volby řeší jen lokální důsledek
        // TÉHLE konkrétní srážky, ne politické napětí samotné — to dál řídí
        // kurzor v engine.js (klesá samo, když fušerství přestane).
        {
            id: 'guild_raid',
            icon: '⚔️',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'Guild Enforcers' : 'Cechovní rváči',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                const gid = GameState.flags && GameState.flags.guildRaidTarget;
                const g = (typeof GuildsDB !== 'undefined' && gid) ? GuildsDB[gid] : null;
                const gName = g ? (en ? g.name_en : g.name) : (en ? 'a guild' : 'nějaký cech');
                return en
                    ? `*Word of your dealings reached the wrong ears at ${gName}. Rough men with cudgels stop the next wagon on the road out — not yet a war, but the message is plain: sell without leave, and the road grows unsafe.*`
                    : `*Zvěsti o vašich kšeftech dolehly ke špatným uším u cechu ${gName}. Drsní muži s obušky zastaví příští povoz na cestě z brány — zatím ne válka, ale poselství je jasné: prodávej bez povolení, a cesta přestane být bezpečná.*`;
            },
            cooldownDays: 21,
            trigger: () => {
                const snap = (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._snap) ? ChroniconSystem._snap : null;
                const worldGuilds = (snap && snap.guilds) || null;
                if (!worldGuilds) return false;
                const active = (typeof getActiveGuilds === 'function') ? getActiveGuilds() : [];
                for (const gid of active) {
                    const gState = worldGuilds[gid];
                    if (gState && (gState.tension || 0) >= 70) {
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.guildRaidTarget = gid;
                        return true;
                    }
                }
                return false;
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Pay off the enforcers (200 groše)' : 'Vyplatit rváče (200 grošů)',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Costly, but the wagon and its cargo stay untouched.'
                        : 'Drahé, ale povoz i náklad zůstanou netknuté.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (CellariumSystem.getGrose() < 200) {
                            const msg = en
                                ? 'You do not have 200 groše. They take what they please instead.'
                                : 'Nemáte 200 grošů. Místo toho si vezmou, co se jim zlíbí.';
                            UI.notifyPanel(msg, 'warning');
                            return msg;
                        }
                        CellariumSystem.spendGrose(200);
                        const msg = en
                            ? 'A purse changes hands on the road. The men step aside — the wagon rolls on, cargo intact.'
                            : 'Na cestě mění měšec majitele. Muži uhýbají — povoz jede dál, náklad netknutý.';
                        UI.notifyPanel(msg, 'system');
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Refuse — let it be' : 'Odmítnout — nechat být',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Free, but they take goods from the wagon as their toll.'
                        : 'Zadarmo, ale vezmou si z povozu zboží jako svoje mýto.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const gid = GameState.flags && GameState.flags.guildRaidTarget;
                        const g = (typeof GuildsDB !== 'undefined' && gid) ? GuildsDB[gid] : null;
                        // Vezmou přednostně zboží z kategorie napadeného cechu (tematicky
                        // přesné — "povoz s fušersky prodávanou mlékou"), jinak pár grošů.
                        let stolenLabel = null, stolenQty = 0;
                        if (g && g.matters) {
                            for (const m of g.matters) {
                                for (const itemId of (m.affectedGoods || [])) {
                                    const have = GameState.inventory[itemId] || 0;
                                    if (have > 0) {
                                        stolenQty = Math.min(have, Math.max(1, Math.floor(have * 0.3)));
                                        Game.removeItem(itemId, stolenQty);
                                        stolenLabel = itemId;
                                        break;
                                    }
                                }
                                if (stolenLabel) break;
                            }
                        }
                        let msg;
                        if (stolenLabel) {
                            msg = en
                                ? `They ransack the wagon and make off with ${stolenQty}× ${stolenLabel}.`
                                : `Vyrabují povoz a odnesou si ${stolenQty}× ${stolenLabel}.`;
                        } else {
                            const groseLost = Math.min(CellariumSystem.getGrose(), 80);
                            CellariumSystem.spendGrose(groseLost);
                            msg = en
                                ? `The wagon carried little of value — they take ${groseLost} groše from your purse instead.`
                                : `Povoz vezl málo cenného — vezmou si tedy ${groseLost} grošů z měšce.`;
                        }
                        UI.notifyPanel(msg, 'warning');
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                }
            ]
        },

        // B3 — Záhadný poutník s ingrediencí
        {
            id: 'athanor_pilgrim_ingredient',
            titleKey: 'events.athanor_pilgrim_ingredient.title',
            textKey:  'events.athanor_pilgrim_ingredient.text',
            cooldownDays: 10,
            trigger: () => !!(GameState.secrets && GameState.secrets.laboratoryUnlocked) && Math.random() < 0.01,
            choices: [
                {
                    labelKey: 'events.athanor_pilgrim_ingredient.accept_btn',
                    descKey:  'events.athanor_pilgrim_ingredient.accept_desc',
                    action: () => {
                        if (CellariumSystem.getGrose() < 5) {
                            UI.notifyPanel(t('events.athanor_pilgrim_ingredient.accept_notif_poor'), 'warning');
                            return t('events.athanor_pilgrim_ingredient.accept_res_poor');
                        }
                        CellariumSystem.spendGrose(5);
                        const pool = ['sulfur', 'lapis_lazuli', 'mercury', 'substantia_ignota'];
                        const gained = pool[Math.floor(Math.random() * pool.length)];
                        Game.addItem(gained, 1);
                        UI.notifyPanel(t('events.athanor_pilgrim_ingredient.accept_notif'), 'system');
                        EventsSystem._addKronika(t('events.athanor_pilgrim_ingredient.accept_notif'));
                        return t('events.athanor_pilgrim_ingredient.accept_res');
                    }
                },
                {
                    labelKey: 'events.athanor_pilgrim_ingredient.decline_btn',
                    descKey:  'events.athanor_pilgrim_ingredient.decline_desc',
                    action: () => {
                        PersonaSystem.addInfluence('abbot', 2);
                        UI.notifyPanel(t('events.athanor_pilgrim_ingredient.decline_notif'), 'system');
                        EventsSystem._addKronika(t('events.athanor_pilgrim_ingredient.decline_notif'));
                        return t('events.athanor_pilgrim_ingredient.decline_res');
                    }
                }
            ]
        },

        // MRD 5.8 — Apiarium weather-flavor: bouřka nad úlem (WMO 95-99, sdílí data s _apiaryWeatherMod)
        {
            id: 'apiary_storm',
            icon: '⛈️',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'Storm Over the Hives' : 'Bouřka nad úly',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*Thunder rolls low over the wall. The hives rock in the gusting wind — bees cluster tight inside, but a loose board or two could give way before it passes.*'
                    : '*Hrom se valí nízko nad zdí. Úly se houpou v poryvech větru — včely se uvnitř tisknou k sobě, ale jedno dvě uvolněná prkna to nemusí vydržet.*';
            },
            cooldownDays: 7,
            trigger: () => {
                if (!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_liber_apium'))) return false;
                if (!(GameState.apiary && GameState.apiary.some(h => h.built && h.hasQueen))) return false;
                const code = (typeof WeatherSystem !== 'undefined' && WeatherSystem.cache && WeatherSystem.cache.current)
                    ? WeatherSystem.cache.current.weather_code : null;
                return code !== null && code >= 95 && code <= 99 && Math.random() < 0.15;
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Rush out and hold the hives' : 'Přiběhnout a přidržet úly',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Risky in this weather, but it lessens the damage.'
                        : 'Riskantní v tomhle počasí, ale zmírní to škodu.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const active = GameState.apiary.filter(h => h.built && h.hasQueen);
                        const hive = active[Math.floor(Math.random() * active.length)];
                        if (Math.random() < 0.6) {
                            hive.strength = Math.max(0, (hive.strength || 0) - 1);
                            const msg = en
                                ? `You reach the hives in time. "${hive.queenName}" loses only a little strength in the wind.`
                                : `Stihneš to k úlům včas. „${hive.queenName}" ztrácí ve větru jen málo síly.`;
                            UI.notifyPanel(msg, 'system');
                            return msg;
                        } else {
                            hive.strength = Math.max(0, (hive.strength || 0) - 2);
                            if (typeof VigorSystem !== 'undefined') VigorSystem.addFatigue(8);
                            const msg = en
                                ? `The wind wins. Soaked and bruised, you watch "${hive.queenName}"'s hive take the worst of it.`
                                : `Vítr vyhrává. Promočený a potlučený sleduješ, jak úl „${hive.queenName}" schytal to nejhorší.`;
                            UI.notifyPanel(msg, 'warning');
                            return msg;
                        }
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Leave it to fate' : 'Nechat osudu',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Stay inside, dry. The hives weather it alone.'
                        : 'Zůstat uvnitř, v suchu. Úly to přečkají samy.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const active = GameState.apiary.filter(h => h.built && h.hasQueen);
                        const hive = active[Math.floor(Math.random() * active.length)];
                        hive.strength = Math.max(0, (hive.strength || 0) - 2);
                        const msg = en
                            ? `The storm passes. "${hive.queenName}"'s hive weathered it, but weaker for the wear.`
                            : `Bouřka přejde. Úl „${hive.queenName}" ji přečkal, ale oslabený.`;
                        UI.notifyPanel(msg, 'system');
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                }
            ]
        },

        // C1 — Kladivo na čarodějnice
        {
            id: 'print_malleus',
            titleKey: 'events.print_malleus.title',
            textKey:  'events.print_malleus.text',
            cooldownDays: 21,
            trigger: () => {
                const techs = GameState.researchedTechs || [];
                return techs.includes('tech_printing_basics') && Math.random() < 0.02;
            },
            choices: [
                {
                    labelKey: 'events.print_malleus.anon_btn',
                    descKey:  'events.print_malleus.anon_desc',
                    action: () => {
                        CellariumSystem.addGrose(80, { title: 'Tisk Malleus (anonymně)', source: 'Tiskárna', source_en: 'Print shop' });
                        PersonaSystem.addInfluence('church', -10);
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.printed_malleus = true;
                        UI.notifyPanel(t('events.print_malleus.anon_notif'), 'system');
                        EventsSystem._addKronika(t('events.print_malleus.anon_notif'));
                        return t('events.print_malleus.anon_res');
                    }
                },
                {
                    labelKey: 'events.print_malleus.open_btn',
                    descKey:  'events.print_malleus.open_desc',
                    action: () => {
                        CellariumSystem.addGrose(120, { title: 'Tisk Malleus (veřejně)', source: 'Tiskárna', source_en: 'Print shop' });
                        PersonaSystem.addInfluence('church', -25);
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.printed_malleus = true;
                        UI.notifyPanel(t('events.print_malleus.open_notif'), 'warning');
                        EventsSystem._addKronika(t('events.print_malleus.open_notif'));
                        return t('events.print_malleus.open_res');
                    }
                },
                {
                    labelKey: 'events.print_malleus.refuse_btn',
                    descKey:  'events.print_malleus.refuse_desc',
                    action: () => {
                        PersonaSystem.addInfluence('church', 15);
                        UI.notifyPanel(t('events.print_malleus.refuse_notif'), 'system');
                        EventsSystem._addKronika(t('events.print_malleus.refuse_notif'));
                        return t('events.print_malleus.refuse_res');
                    }
                }
            ]
        },

        // C2 — Gutenbergovy litery na prodej
        {
            id: 'print_gutenberg_type',
            titleKey: 'events.print_gutenberg_type.title',
            textKey:  'events.print_gutenberg_type.text',
            cooldownDays: 21,
            trigger: () => {
                const techs = GameState.researchedTechs || [];
                return techs.includes('tech_printing_basics') && Math.random() < 0.01;
            },
            choices: [
                {
                    labelKey: 'events.print_gutenberg_type.buy_btn',
                    descKey:  'events.print_gutenberg_type.buy_desc',
                    action: () => {
                        if (CellariumSystem.getGrose() < 200) {
                            UI.notifyPanel(t('events.print_gutenberg_type.buy_notif_poor'), 'warning');
                            return t('events.print_gutenberg_type.buy_res_poor');
                        }
                        CellariumSystem.spendGrose(200);
                        Game.addItem('font_set', 1);
                        UI.notifyPanel(t('events.print_gutenberg_type.buy_notif'), 'system');
                        EventsSystem._addKronika(t('events.print_gutenberg_type.buy_notif'));
                        return t('events.print_gutenberg_type.buy_res');
                    }
                },
                {
                    labelKey: 'events.print_gutenberg_type.haggle_btn',
                    descKey:  'events.print_gutenberg_type.haggle_desc',
                    action: () => {
                        if (CellariumSystem.getGrose() < 150) {
                            UI.notifyPanel(t('events.print_gutenberg_type.haggle_notif_poor'), 'warning');
                            return t('events.print_gutenberg_type.haggle_res_poor');
                        }
                        if (Math.random() < 0.5) {
                            CellariumSystem.spendGrose(150);
                            Game.addItem('font_set', 1);
                            UI.notifyPanel(t('events.print_gutenberg_type.haggle_notif_ok'), 'system');
                            EventsSystem._addKronika(t('events.print_gutenberg_type.haggle_notif_ok'));
                            return t('events.print_gutenberg_type.haggle_res_ok');
                        } else {
                            UI.notifyPanel(t('events.print_gutenberg_type.haggle_notif_fail'), 'warning');
                            return t('events.print_gutenberg_type.haggle_res_fail');
                        }
                    }
                },
                {
                    labelKey: 'events.print_gutenberg_type.decline_btn',
                    descKey:  'events.print_gutenberg_type.decline_desc',
                    action: () => {
                        UI.notifyPanel(t('events.print_gutenberg_type.decline_notif'), 'system');
                        return t('events.print_gutenberg_type.decline_res');
                    }
                }
            ]
        },

        // D1 — Nemoc ve stádě
        {
            id: 'curia_sheep_disease',
            titleKey: 'events.curia_sheep_disease.title',
            textKey:  'events.curia_sheep_disease.text',
            cooldownDays: 14,
            trigger: () => !!(GameState.sheepfold && GameState.sheepfold.sheep > 0) && Math.random() < 0.03,
            choices: [
                {
                    labelKey: 'events.curia_sheep_disease.thyme_btn',
                    descKey:  'events.curia_sheep_disease.thyme_desc',
                    action: () => {
                        if ((GameState.inventory['thyme'] || 0) < 2) {
                            UI.notifyPanel(t('events.curia_sheep_disease.thyme_notif_poor'), 'warning');
                            return t('events.curia_sheep_disease.thyme_res_poor');
                        }
                        Game.removeItem('thyme', 2);
                        if (Math.random() < 0.8) {
                            UI.notifyPanel(t('events.curia_sheep_disease.thyme_notif_ok'), 'system');
                            EventsSystem._addKronika(t('events.curia_sheep_disease.thyme_notif_ok'));
                            return t('events.curia_sheep_disease.thyme_res_ok');
                        } else {
                            GameState.sheepfold.sheep = Math.max(0, GameState.sheepfold.sheep - 1);
                            UI.notifyPanel(t('events.curia_sheep_disease.thyme_notif_fail'), 'warning');
                            EventsSystem._addKronika(t('events.curia_sheep_disease.thyme_notif_fail'));
                            return t('events.curia_sheep_disease.thyme_res_fail');
                        }
                    }
                },
                {
                    labelKey: 'events.curia_sheep_disease.healer_btn',
                    descKey:  'events.curia_sheep_disease.healer_desc',
                    action: () => {
                        if (GameState.sheepfold.healerPending) {
                            UI.notifyPanel(t('events.curia_sheep_disease.healer_notif_active'), 'warning');
                            return t('events.curia_sheep_disease.healer_res_active');
                        }
                        if (CellariumSystem.getGrose() < 100) {
                            UI.notifyPanel(t('events.curia_sheep_disease.healer_notif_poor'), 'warning');
                            return t('events.curia_sheep_disease.healer_res_poor');
                        }
                        CellariumSystem.spendGrose(100);
                        GameState.sheepfold.healerPending = { readyAt: Date.now() + 86400000 };
                        UI.notifyPanel(t('events.curia_sheep_disease.healer_notif_called'), 'system');
                        return t('events.curia_sheep_disease.healer_res_called');
                    }
                },
                {
                    labelKey: 'events.curia_sheep_disease.isolate_btn',
                    descKey:  'events.curia_sheep_disease.isolate_desc',
                    action: () => {
                        const lost = Math.max(1, Math.round(GameState.sheepfold.sheep * 0.3));
                        GameState.sheepfold.sheep = Math.max(0, GameState.sheepfold.sheep - lost);
                        UI.notifyPanel(t('events.curia_sheep_disease.isolate_notif'), 'system');
                        EventsSystem._addKronika(t('events.curia_sheep_disease.isolate_notif'));
                        return t('events.curia_sheep_disease.isolate_res');
                    }
                }
            ]
        },

        // D3 — Krupobití (automatický efekt, bez volby)
        {
            id: 'garden_hail',
            titleKey: 'events.garden_hail.title',
            textKey:  'events.garden_hail.text',
            notifyKey: 'events.garden_hail.notify',
            cooldownDays: 30,
            trigger: () => {
                const month = new Date().getMonth() + 1; // 1-12; léto/podzim = 6-11
                return month >= 6 && month <= 11 && Math.random() < 0.01;
            },
            choices: [],
            effect: () => {
                if (GameState.garden) {
                    GameState.garden.forEach(plot => { if (plot.state === 2) plot.state = 1; });
                }
                if (GameState.orchard) {
                    const mature = GameState.orchard.filter(s => s.state === 'mature');
                    const affected = mature.slice(0, Math.ceil(mature.length / 2));
                    affected.forEach(s => { s.state = 'growing'; s.plantedAt = Date.now(); });
                }
                Game.save();
            }
        },

        // E1 — Giacomo přináší zprávy
        {
            id: 'cellarium_giacomo_news',
            titleKey: 'events.cellarium_giacomo_news.title',
            textKey:  'events.cellarium_giacomo_news.text',
            cooldownDays: 14,
            trigger: () => {
                const techs = GameState.researchedTechs || [];
                return techs.includes('tech_cellarium') && Math.random() < 0.02;
            },
            choices: [
                {
                    labelKey: 'events.cellarium_giacomo_news.view_btn',
                    descKey:  'events.cellarium_giacomo_news.view_desc',
                    action: () => {
                        if (CellariumSystem.getGrose() < 30) {
                            UI.notifyPanel(t('events.cellarium_giacomo_news.view_notif_poor'), 'warning');
                            return t('events.cellarium_giacomo_news.view_res_poor');
                        }
                        CellariumSystem.spendGrose(30);
                        const pool = ['sulfur', 'lapis_lazuli', 'mercury'];
                        const gained = pool[Math.floor(Math.random() * pool.length)];
                        Game.addItem(gained, 1);
                        SaeculumSystem.addContactRelation('giacomo', 3);
                        UI.notifyPanel(t('events.cellarium_giacomo_news.view_notif'), 'system');
                        EventsSystem._addKronika(t('events.cellarium_giacomo_news.view_notif'));
                        return t('events.cellarium_giacomo_news.view_res');
                    }
                },
                {
                    labelKey: 'events.cellarium_giacomo_news.decline_btn',
                    descKey:  'events.cellarium_giacomo_news.decline_desc',
                    action: () => {
                        UI.notifyPanel(t('events.cellarium_giacomo_news.decline_notif'), 'system');
                        return t('events.cellarium_giacomo_news.decline_res');
                    }
                }
            ]
        },

        // E2 — Benedikt má problém
        {
            id: 'cellarium_benedikt_debt',
            titleKey: 'events.cellarium_benedikt_debt.title',
            textKey:  'events.cellarium_benedikt_debt.text',
            cooldownDays: 14,
            trigger: () => {
                const techs = GameState.researchedTechs || [];
                return techs.includes('tech_cellarium') && Math.random() < 0.01;
            },
            choices: [
                {
                    labelKey: 'events.cellarium_benedikt_debt.lend_btn',
                    descKey:  'events.cellarium_benedikt_debt.lend_desc',
                    action: () => {
                        if (CellariumSystem.getGrose() < 30) {
                            UI.notifyPanel(t('events.cellarium_benedikt_debt.lend_notif_poor'), 'warning');
                            return t('events.cellarium_benedikt_debt.lend_res_poor');
                        }
                        CellariumSystem.spendGrose(30);
                        PersonaSystem.addInfluence('benedikt', 10);
                        UI.notifyPanel(t('events.cellarium_benedikt_debt.lend_notif'), 'system');
                        EventsSystem._addKronika(t('events.cellarium_benedikt_debt.lend_notif'));
                        return t('events.cellarium_benedikt_debt.lend_res');
                    }
                },
                {
                    labelKey: 'events.cellarium_benedikt_debt.decline_btn',
                    descKey:  'events.cellarium_benedikt_debt.decline_desc',
                    action: () => {
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.tavernClosedUntil = Date.now() + (24 * 3600000);
                        UI.notifyPanel(t('events.cellarium_benedikt_debt.decline_notif'), 'warning');
                        EventsSystem._addKronika(t('events.cellarium_benedikt_debt.decline_notif'));
                        return t('events.cellarium_benedikt_debt.decline_res');
                    }
                }
            ]
        },

        // E3 — Falešné groše
        {
            id: 'cellarium_counterfeit',
            titleKey: 'events.cellarium_counterfeit.title',
            textKey:  'events.cellarium_counterfeit.text',
            cooldownDays: 14,
            trigger: () => CellariumSystem.getGrose() > 50 && Math.random() < 0.01,
            choices: [
                {
                    labelKey: 'events.cellarium_counterfeit.benedikt_btn',
                    descKey:  'events.cellarium_counterfeit.benedikt_desc',
                    action: () => {
                        PersonaSystem.addInfluence('benedikt', -5);
                        UI.notifyPanel(t('events.cellarium_counterfeit.benedikt_notif'), 'warning');
                        EventsSystem._addKronika(t('events.cellarium_counterfeit.benedikt_notif'));
                        return t('events.cellarium_counterfeit.benedikt_res');
                    }
                },
                {
                    labelKey: 'events.cellarium_counterfeit.giacomo_btn',
                    descKey:  'events.cellarium_counterfeit.giacomo_desc',
                    action: () => {
                        SaeculumSystem.addContactRelation('giacomo', -5);
                        UI.notifyPanel(t('events.cellarium_counterfeit.giacomo_notif'), 'warning');
                        EventsSystem._addKronika(t('events.cellarium_counterfeit.giacomo_notif'));
                        return t('events.cellarium_counterfeit.giacomo_res');
                    }
                },
                {
                    labelKey: 'events.cellarium_counterfeit.keep_btn',
                    descKey:  'events.cellarium_counterfeit.keep_desc',
                    action: () => {
                        CellariumSystem.spendGrose(Math.min(3, CellariumSystem.getGrose()));
                        UI.notifyPanel(t('events.cellarium_counterfeit.keep_notif'), 'system');
                        EventsSystem._addKronika(t('events.cellarium_counterfeit.keep_notif'));
                        return t('events.cellarium_counterfeit.keep_res');
                    }
                }
            ]
        },

        // F1 — Opat onemocněl (automatický efekt, bez volby)
        {
            id: 'scrinium_abbot_ill',
            titleKey: 'events.scrinium_abbot_ill.title',
            textKey:  'events.scrinium_abbot_ill.text',
            notifyKey: 'events.scrinium_abbot_ill.notify',
            cooldownDays: 30,
            trigger: () => !!(GameState.secrets && GameState.secrets.forbiddenUnlocked) && Math.random() < 0.01,
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.scriniumSealedUntil = Date.now() + (12 * 3600000);
            }
        },

        // F2 — Tajemný host v Scriniu
        {
            id: 'scrinium_mysterious_guest',
            titleKey: 'events.scrinium_mysterious_guest.title',
            textKey:  'events.scrinium_mysterious_guest.text',
            cooldownDays: 21,
            trigger: () => !!(GameState.secrets && GameState.secrets.forbiddenUnlocked) && Math.random() < 0.005,
            choices: [
                {
                    labelKey: 'events.scrinium_mysterious_guest.enter_btn',
                    descKey:  'events.scrinium_mysterious_guest.enter_desc',
                    action: () => {
                        if (Math.random() < 0.5) {
                            const db = (typeof ScriniumDB !== 'undefined') ? ScriniumDB.folios : [];
                            const unfound = db.filter(f => !GameState.scrinium || !GameState.scrinium.folios[f.id] || !GameState.scrinium.folios[f.id].found);
                            if (unfound.length > 0) {
                                const pick = unfound[Math.floor(Math.random() * unfound.length)];
                                SecretsSystem.unlockFolioById(pick.id);
                            }
                            UI.notifyPanel(t('events.scrinium_mysterious_guest.enter_notif_ok'), 'system');
                            EventsSystem._addKronika(t('events.scrinium_mysterious_guest.enter_notif_ok'));
                            return t('events.scrinium_mysterious_guest.enter_res_ok');
                        } else {
                            if (!GameState.flags) GameState.flags = {};
                            GameState.flags.scriniumSealedUntil = Date.now() + (6 * 3600000);
                            UI.notifyPanel(t('events.scrinium_mysterious_guest.enter_notif_fail'), 'warning');
                            EventsSystem._addKronika(t('events.scrinium_mysterious_guest.enter_notif_fail'));
                            return t('events.scrinium_mysterious_guest.enter_res_fail');
                        }
                    }
                },
                {
                    labelKey: 'events.scrinium_mysterious_guest.wait_btn',
                    descKey:  'events.scrinium_mysterious_guest.wait_desc',
                    action: () => {
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.mapyHint = true;
                        UI.notifyPanel(t('events.scrinium_mysterious_guest.wait_notif'), 'system');
                        EventsSystem._addKronika(t('events.scrinium_mysterious_guest.wait_notif'));
                        return t('events.scrinium_mysterious_guest.wait_res');
                    }
                },
                {
                    labelKey: 'events.scrinium_mysterious_guest.leave_btn',
                    descKey:  'events.scrinium_mysterious_guest.leave_desc',
                    action: () => {
                        EventsSystem._addKronika(t('events.scrinium_mysterious_guest.leave_kronika'));
                        return t('events.scrinium_mysterious_guest.leave_res');
                    }
                }
            ]
        },

        // ═══ ZAKÁZKY — Kategorie C: kacířská/hříšná zakázka ═══
        // zakazky-rozsireni-ctyri-kategorie-mrd.md §4. Instant-choice modal,
        // NE fronta (mirror print_malleus) — morální dilema má být naléhavé.
        // Historické zakotvení: rok 1465, spor Jiřího z Poděbrad s Římem
        // (papežský půhon obnoven VIII/1465, Zelenohorská jednota XI/1465).
        // Lidovost/Šlechta/Církev delty jsou herní zjednodušení dobové
        // nálady, ne tvrzení o skutečném rozvrstvení sympatií.

        // C-Kacir1 — Žádost o opis Basilejských kompaktát pro utrakvistu
        {
            id: 'kacir_kompaktata',
            icon: '📜',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'A Quiet Request' : 'Tichá žádost',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*A traveller lingers after Compline, voice low. He asks for a copy of the Basel Compacts — the old settlement that lets a man take both kinds at Mass. "For a sick uncle," he says, not meeting your eyes. Rome\'s patience with the king\'s party grows thin this year. Copying such a thing now is not nothing.*'
                    : '*Poutník se zdrží po kompletáři, hlas ztišený. Žádá o opis Basilejských kompaktát — starého narovnání, co dovoluje přijímat pod obojí. „Pro nemocného strýce," praví, aniž by pohlédl do očí. Řím letos nemá s královou stranou trpělivosti nazbyt. Opsat něco takového teď není nic málo.*';
            },
            cooldownDays: 21,
            trigger: () => {
                const m = GameState.rank && GameState.rank.monastic;
                return !!(m && ['frater', 'armarius', 'prior'].includes(m)) && Math.random() < 0.012;
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Copy the compacts' : 'Opsat kompaktáta',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'A few groschen, and the village remembers a kindness. But the tribunal keeps its own ledger.'
                        : 'Pár grošů, a ves si pamatuje laskavost. Ale tribunál si vede vlastní účty.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        CellariumSystem.addGrose(35, { title: en ? 'Copying the Compacts' : 'Opis kompaktát', source: en ? 'Traveler' : 'Poutník', source_en: 'Traveler' });
                        if (GameState.secrets) GameState.secrets.inquisitionHeat = Math.min(100, (GameState.secrets.inquisitionHeat || 0) + 15);
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
                            PersonaSystem.addReputation('lidovost', 2);
                            PersonaSystem.addReputation('cirkev', -3);
                        }
                        const msg = en
                            ? 'The compacts are copied and pass quietly into other hands. 35 groschen. (Suspicion +15, Clergy reputation −3, Common folk +2)'
                            : 'Kompaktáta jsou opsána a tiše přechází do jiných rukou. 35 grošů. (Podezření +15, Církevní pověst −3, Lid +2)';
                        UI.notifyPanel(msg, 'warning');
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Decline' : 'Odmítnout',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Safe. The traveller nods and says no more.'
                        : 'Bezpečné. Poutník přikývne a víc neřekne.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const msg = en
                            ? 'You decline. The traveller leaves as quietly as he came.'
                            : 'Odmítáš. Poutník odchází stejně tiše, jako přišel.';
                        UI.notifyPanel(msg, 'system');
                        return msg;
                    }
                }
            ]
        },

        // C-Kacir2 — Žádost o opis provolání Zelenohorské jednoty
        {
            id: 'kacir_zelenohorska',
            icon: '🛡️',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'A Sealed Letter' : 'Zapečetěný list',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*A rider in a lord\'s livery brings a sealed proclamation — the founding writ of a league of Catholic lords against the king, sworn at the end of November. He asks for copies, quietly, to be sent on to other houses. "The king\'s men," he adds, "do not love readers of this."*'
                    : '*Jezdec v panském livreji přiváží zapečetěné provolání — zakládací listinu jednoty katolických pánů proti králi, přísahanou koncem listopadu. Žádá o opisy, tiše, k rozeslání dalším domům. „Královi lidé," dodává, „nemají čtenáře tohoto listu v lásce."*';
            },
            cooldownDays: 21,
            trigger: () => {
                const m = GameState.rank && GameState.rank.monastic;
                return !!(m && ['frater', 'armarius', 'prior'].includes(m)) && Math.random() < 0.012;
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Copy the proclamation' : 'Opsat provolání',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Lordly favour and the Church\'s quiet approval — but the village hears whose side you have chosen.'
                        : 'Přízeň šlechty a tiché uznání církve — ale ves slyší, na čí stranu ses přiklonil.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        CellariumSystem.addGrose(35, { title: en ? 'Copying the proclamation' : 'Opis provolání', source: en ? 'Nobility' : 'Šlechta', source_en: 'Nobility' });
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
                            PersonaSystem.addReputation('slechta', 3);
                            PersonaSystem.addReputation('cirkev', 2);
                            PersonaSystem.addReputation('lidovost', -2);
                        }
                        const msg = en
                            ? 'Copies are made and sent on with the rider. 35 groschen. (Nobility +3, Clergy reputation +2, Common folk −2)'
                            : 'Opisy jsou hotové a odeslané s jezdcem. 35 grošů. (Šlechta +3, Církevní pověst +2, Lid −2)';
                        UI.notifyPanel(msg, 'system');
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Decline' : 'Odmítnout',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Safe. The rider rides on to the next house.'
                        : 'Bezpečné. Jezdec pokračuje k dalšímu domu.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const msg = en
                            ? 'You decline. The rider takes his sealed letter elsewhere.'
                            : 'Odmítáš. Jezdec odváží svůj zapečetěný list jinam.';
                        UI.notifyPanel(msg, 'system');
                        return msg;
                    }
                }
            ]
        },

        // eventy-audit-mrd (04.09.2026) §2.3/§4.7 Fáze 1 — sucho a vánice už
        // dnes mechanicky fungují (WeatherSystem.countDryDays/isFrostDay,
        // reálné počasí Prahy), ale tiše — hráč to nikdy neuvidí jako
        // pojmenovanou událost. Tyhle dva eventy nic mechanicky nemění,
        // jen zviditelňují to, co se už počítá. Jedna volba "Rozumím" —
        // žádný nový efekt, žádné riziko pro existující výpočty.
        {
            id: 'weather_drought_wave',
            icon: '🌵',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'The Wells Run Low' : 'Studně vysychají',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*No rain in days. The garden beds crack, the vines droop, and the fields wait for water that does not come. What is watered by hand will hold — the rest suffers.*'
                    : '*Už dlouho nepršelo. Záhony pukají, réva svěsila listy, pole čekají na vodu, která nepřichází. Co je zaléváno ručně, to vydrží — zbytek trpí.*';
            },
            cooldownDays: 12,
            trigger: () => {
                if (typeof WeatherSystem === 'undefined' || !WeatherSystem.countDryDays) return false;
                const hasGarden = (GameState.garden && GameState.garden.length)
                    || (GameState.fields && GameState.fields.length)
                    || (GameState.vinea && GameState.vinea.length);
                if (!hasGarden) return false;
                return WeatherSystem.countDryDays(3).dry >= 3;
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Understood' : 'Rozumím',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Note it in the chronicle. Watering by hand is the only remedy.'
                        : 'Zaznamenat do kroniky. Ruční zálivka je jediná náprava.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const msg = en ? 'The dry spell is noted. Unwatered crops will suffer.' : 'Sucho zaznamenáno. Nezalévané plodiny ponesou následky.';
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                }
            ]
        },
        {
            id: 'weather_blizzard_local',
            icon: '🌨️',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'Snow Closes the Roads' : 'Vánice uzavírá cesty',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*The blizzard has raged since dawn. Drifts pile against the gate, and no sensible traveller sets out today. The monastery is, for now, alone with the snow.*'
                    : '*Vánice zuří od svítání. Závěje se hromadí u brány a žádný rozumný poutník dnes nevyráží na cestu. Klášter je zatím sám se sněhem.*';
            },
            cooldownDays: 20,
            trigger: () => {
                if (typeof WeatherSystem === 'undefined' || !WeatherSystem.cache || !WeatherSystem.cache.current) return false;
                const code = WeatherSystem.cache.current.weather_code;
                const isSnow = code !== undefined && code !== null && ((code >= 71 && code <= 77) || (code >= 85 && code <= 86));
                if (!isSnow) return false;
                return !WeatherSystem.isFrostDay || WeatherSystem.isFrostDay(-5);
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Understood' : 'Rozumím',
                    desc: () => (GameState.settings && GameState.settings.language === 'en')
                        ? 'Note it in the chronicle.'
                        : 'Zaznamenat do kroniky.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const msg = en ? 'The blizzard is noted in the chronicle.' : 'Vánice zaznamenána do kroniky.';
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                }
            ]
        },

        // eventy-audit-mrd (04.09.2026) §4.1 Fáze 3 — LOKÁLNĚ, abstraktní
        // trigger (žádná Karavana/cestovní vrstva neexistuje, viz diskuze
        // 05.09.2026 — ta je vlastní budoucí MRD). 4 odlišné varianty pro
        // variabilitu, každá vlastní dlouhý cooldown, ať to v součtu není
        // časté. Historicky: lapkovství na Moravě v 1. pol. 15. stol. je
        // zdokumentovaný fenomén (rozpuštěné žoldnéřské družiny z
        // husitských válek bez obživy).
        {
            id: 'road_lapkove_begging',
            icon: '🥖',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'Hungry Men at the Gate' : 'Hladoví u brány',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*A ragged handful of men wait by the gate — soldiers with no company left to serve, or so they claim. They ask only for bread.*'
                    : '*U brány čeká hrstka otrhaných mužů — vojáci bez roty, co by je živila, aspoň to tvrdí. Žádají jen o chléb.*';
            },
            cooldownDays: 14,
            trigger: () => Math.random() < 0.03,
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Give alms' : 'Dát almužnu',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'A few loaves, freely given.' : 'Pár bochníků, dobrovolně.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        Game.addItem('bread', -Math.min(3, GameState.inventory['bread'] || 0));
                        if (typeof PersonaSystem !== 'undefined') {
                            if (PersonaSystem.addZboznost) PersonaSystem.addZboznost(1);
                            if (PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', 2);
                        }
                        const msg = en ? 'The men bow and move on, fed.' : 'Muži se ukloní a sytí jdou dál.';
                        return msg;
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Turn them away' : 'Odmítnout',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'The gate stays shut.' : 'Brána zůstává zavřená.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', -1);
                        return en ? 'They leave without a word. Word of this will travel too.' : 'Odcházejí beze slova. I tohle se v kraji rozkřikne.';
                    }
                }
            ]
        },
        {
            id: 'road_lapkove_wounded',
            icon: '🩹',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'The Wounded' : 'Zranění',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*Two men lie by the wall, bloodied and past fighting. Whatever band they belonged to, they were left behind.*'
                    : '*Dva muži leží u zdi, zakrvácení a k boji už neschopní. Ať patřili k jakékoliv rotě, tahle je nechala napospas.*';
            },
            cooldownDays: 16,
            trigger: () => Math.random() < 0.025,
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Take them to the Infirmarium' : 'Přijmout do Infirmária',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Bandages and broth cost a little.' : 'Obvazy a vývar něco stojí.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                            CellariumSystem.addGrose(-5, { title: en ? 'Care for the wounded' : 'Ošetření raněných', source: 'Infirmarium' });
                        }
                        if (typeof PersonaSystem !== 'undefined') {
                            if (PersonaSystem.addZboznost) PersonaSystem.addZboznost(2);
                            if (PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', 1);
                        }
                        return en ? 'They are carried in. One thanks you by name he does not give.' : 'Odnesou je dovnitř. Jeden děkuje jménem, které neřekne.';
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Send them away' : 'Poslat pryč',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Not our concern.' : 'Není to naše starost.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (typeof PersonaSystem !== 'undefined') {
                            if (PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', -1);
                            if (PersonaSystem.addZboznost) PersonaSystem.addZboznost(-1);
                        }
                        return en ? 'They drag themselves elsewhere.' : 'Odvlečou se jinam.';
                    }
                }
            ]
        },
        {
            id: 'road_lapkove_armed',
            icon: '⚔️',
            // eventy-audit-mrd (05.09.2026) pending-timeout: přidáním 3. volby
            // (minihra) by "poslední index" znamenal auto-spuštění RiskStack
            // bez hráče u toho — explicitní index 1 (Odmítnout) zůstává default.
            timeoutIndex: 1,
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'Armed Men on the Road' : 'Ozbrojená rota na cestě',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*A armed company blocks the path near the walls — not soldiers of any lord, just men with weapons and no one to answer to. They want payment to let goods pass unmolested.*'
                    : '*Ozbrojená rota obsadila cestu kousek od zdí — nejsou ničí vojáci, jen muži se zbraněmi a bez pána. Chtějí zaplatit za to, že nechají zboží projít.*';
            },
            cooldownDays: 20,
            trigger: () => Math.random() < 0.02,
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Pay them off (40 groše)' : 'Zaplatit výpalné (40 grošů)',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Cheaper than a fight.' : 'Levnější než rvačka.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                            CellariumSystem.addGrose(-40, { title: en ? 'Bandit toll' : 'Výpalné lapkům', source: 'Porta' });
                        }
                        return en ? 'Groše change hands. The road stays open.' : 'Groše mění majitele. Cesta zůstává volná.';
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Refuse' : 'Odmítnout',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Risk it.' : 'Riskovat.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (Math.random() < 0.5) {
                            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('slechta', 1);
                            return en ? 'They grumble and let the matter drop.' : 'Zabručí a věc nechají být.';
                        }
                        const loss = Math.floor((GameState.inventory['paper'] || 0) * 0.2);
                        if (loss > 0) Game.addItem('paper', -loss);
                        return en ? `They take what they can carry — ${loss} paper lost.` : `Vezmou si, co unesou — ztraceno ${loss} papíru.`;
                    }
                },
                {
                    label: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        return GameState.mercenary ? (en ? 'The Lapkové Watch (mercenary)' : 'Lapková patrola (žoldnéř)') : (en ? 'The Lapkové Watch (dice)' : 'Lapková patrola (kostky)');
                    },
                    desc: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        return GameState.mercenary ? (en ? 'You are not alone this time.' : 'Tentokrát nejsi sám.') : (en ? 'Win groše, or lose the goods trying.' : 'Vyhraješ groše, nebo o zboží přijdeš ve snaze.');
                    },
                    // vyroba-stavby-mrd navazuje (6.9.2026), Fáze D — guarded/unguarded
                    // rozlišení. Bez žoldnéře beze změny (RiskStack), se žoldnéřem
                    // jde stejná volba přes MercenaryBattle. Ztrátová sazba na
                    // defeat/escape mirror původní RiskStack proherní větev přesně.
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (GameState.mercenary) {
                            if (typeof MercenaryBattle === 'undefined') return en ? 'Your mercenary is not at hand.' : 'Žoldnéř není po ruce.';
                            MercenaryBattle.open((outcome) => {
                                let msg;
                                if (outcome.result === 'victory') {
                                    msg = en ? 'Your mercenary leads the charge — the camp falls silent.' : 'Tvůj žoldnéř vede útok — tábor utichne.';
                                } else if (outcome.result === 'escape') {
                                    msg = en ? 'You and your mercenary slip away into the dark.' : 'Ty a tvůj žoldnéř zmizíte ve tmě.';
                                } else {
                                    const loss = Math.floor((GameState.inventory['paper'] || 0) * 0.2);
                                    if (loss > 0) Game.addItem('paper', -loss);
                                    msg = en ? `The fight turns against you — ${loss} paper lost.` : `Boj se obrátí proti vám — ztraceno ${loss} papíru.`;
                                }
                                EventsSystem._addKronika(msg);
                                if (typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) {
                                    NotificationSystem.modal({
                                        title: t('events.ui.result'), text: msg,
                                        choices: [{ label: t('events.ui.close'), type: 'primary', effect: () => { if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll(); } }]
                                    });
                                }
                            });
                            return '';
                        }
                        if (typeof RiskStack === 'undefined') return en ? 'The dice are not at hand.' : 'Kostky nejsou po ruce.';
                        RiskStack.open({}, (outcome) => {
                            let msg;
                            if (outcome.won) {
                                const bonus = outcome.bank * 3;
                                if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                                    CellariumSystem.addGrose(bonus, { title: en ? 'Bandit dice winnings' : 'Výhra ze sázky s lapky', source: 'Porta' });
                                }
                                msg = en ? `Luck holds — you walk away ${bonus} groše richer.` : `Štěstí drží — odcházíš o ${bonus} grošů bohatší.`;
                            } else {
                                const loss = Math.floor((GameState.inventory['paper'] || 0) * 0.2);
                                if (loss > 0) Game.addItem('paper', -loss);
                                msg = en ? `The dice turn — ${loss} paper lost.` : `Kostky se obrátí — ztraceno ${loss} papíru.`;
                            }
                            EventsSystem._addKronika(msg);
                            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) {
                                NotificationSystem.modal({
                                    title: t('events.ui.result'), text: msg,
                                    choices: [{ label: t('events.ui.close'), type: 'primary', effect: () => { if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll(); } }]
                                });
                            }
                        });
                        return '';
                    }
                }
            ]
        },
        {
            id: 'road_lapkove_mercenary',
            icon: '🏴',
            timeoutIndex: 1, // eventy-audit-mrd (05.09.2026) — stejný důvod jako u road_lapkove_armed
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'A Mercenary Company' : 'Žoldnéřská tlupa',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*This is no ragged band — a proper mercenary company has made camp within sight of the walls, unpaid since whichever lord hired them ran out of coin. They are not asking politely.*'
                    : '*Tohle není ledajaká tlupa — u zdí se utábořila pořádná žoldnéřská rota, nevyplacená od chvíle, co pánovi, co je najal, došly peníze. Neptají se zdvořile.*';
            },
            cooldownDays: 28,
            trigger: () => (typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0) > 100 && Math.random() < 0.015,
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Negotiate (80 groše)' : 'Vyjednat (80 grošů)',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Expensive, but final.' : 'Drahé, ale definitivní.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                            CellariumSystem.addGrose(-80, { title: en ? 'Mercenary settlement' : 'Vyrovnání se žoldnéři', source: 'Porta' });
                        }
                        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('slechta', 1);
                        return en ? 'A captain takes the sum and moves his company on.' : 'Hejtman vezme sumu a rotu odvede jinam.';
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Bar the gates' : 'Zavřít brány',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Wait it out.' : 'Vyčkat.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const loss = Math.floor((GameState.inventory['common_codex'] || 0) * 0.15);
                        if (loss > 0) Game.addItem('common_codex', -loss);
                        const currentGrose = typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0;
                        const grLoss = Math.min(30, currentGrose);
                        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                            CellariumSystem.addGrose(-grLoss, { title: en ? 'Looted while gates held' : 'Vypleněno za zavřenými branami', source: 'Porta' });
                        }
                        return en ? `They camp three days and take what stragglers leave behind — ${loss} codices, ${grLoss} groše gone.` : `Utáboří se na tři dny a berou, co zůstane venku — ${loss} kodexů, ${grLoss} grošů pryč.`;
                    }
                },
                {
                    label: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        return GameState.mercenary ? (en ? 'The Lapkové Watch (mercenary)' : 'Lapková patrola (žoldnéř)') : (en ? 'The Lapkové Watch (dice)' : 'Lapková patrola (kostky)');
                    },
                    desc: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        return GameState.mercenary ? (en ? 'Higher stakes than the road bandits — but you are not alone.' : 'Vyšší sázky než u obyčejných lapků — ale nejsi sám.') : (en ? 'Higher stakes than the road bandits.' : 'Vyšší sázky než u obyčejných lapků.');
                    },
                    // vyroba-stavby-mrd navazuje (6.9.2026), Fáze D — mirror road_lapkove_armed přesně.
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (GameState.mercenary) {
                            if (typeof MercenaryBattle === 'undefined') return en ? 'Your mercenary is not at hand.' : 'Žoldnéř není po ruce.';
                            MercenaryBattle.open((outcome) => {
                                let msg;
                                if (outcome.result === 'victory') {
                                    msg = en ? 'Your mercenary leads the charge — the company scatters.' : 'Tvůj žoldnéř vede útok — rota se rozprchne.';
                                } else if (outcome.result === 'escape') {
                                    msg = en ? 'You and your mercenary slip away into the dark.' : 'Ty a tvůj žoldnéř zmizíte ve tmě.';
                                } else {
                                    const loss = Math.floor((GameState.inventory['common_codex'] || 0) * 0.15);
                                    if (loss > 0) Game.addItem('common_codex', -loss);
                                    const currentGrose = typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0;
                                    const grLoss = Math.min(30, currentGrose);
                                    if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                                        CellariumSystem.addGrose(-grLoss, { title: en ? 'Lost the fight' : 'Prohraný boj', source: 'Porta' });
                                    }
                                    msg = en ? `The fight turns against you — ${loss} codices and ${grLoss} groše gone.` : `Boj se obrátí proti vám — ztraceno ${loss} kodexů a ${grLoss} grošů.`;
                                }
                                EventsSystem._addKronika(msg);
                                if (typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) {
                                    NotificationSystem.modal({
                                        title: t('events.ui.result'), text: msg,
                                        choices: [{ label: t('events.ui.close'), type: 'primary', effect: () => { if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll(); } }]
                                    });
                                }
                            });
                            return '';
                        }
                        if (typeof RiskStack === 'undefined') return en ? 'The dice are not at hand.' : 'Kostky nejsou po ruce.';
                        RiskStack.open({}, (outcome) => {
                            let msg;
                            if (outcome.won) {
                                const bonus = outcome.bank * 5;
                                if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                                    CellariumSystem.addGrose(bonus, { title: en ? 'Mercenary dice winnings' : 'Výhra ze sázky se žoldnéři', source: 'Porta' });
                                }
                                msg = en ? `The captain grins — bad luck for him. You walk away ${bonus} groše richer.` : `Hejtman se křiví — smůla na jeho straně. Odcházíš o ${bonus} grošů bohatší.`;
                            } else {
                                const loss = Math.floor((GameState.inventory['common_codex'] || 0) * 0.15);
                                if (loss > 0) Game.addItem('common_codex', -loss);
                                const currentGrose = typeof CellariumSystem !== 'undefined' ? CellariumSystem.getGrose() : 0;
                                const grLoss = Math.min(30, currentGrose);
                                if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                                    CellariumSystem.addGrose(-grLoss, { title: en ? 'Lost the dice game' : 'Prohra v kostkách', source: 'Porta' });
                                }
                                msg = en ? `The dice turn against you — ${loss} codices and ${grLoss} groše gone.` : `Kostky se obrátí proti tobě — ztraceno ${loss} kodexů a ${grLoss} grošů.`;
                            }
                            EventsSystem._addKronika(msg);
                            if (typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) {
                                NotificationSystem.modal({
                                    title: t('events.ui.result'), text: msg,
                                    choices: [{ label: t('events.ui.close'), type: 'primary', effect: () => { if (typeof UI !== 'undefined' && UI.renderAll) UI.renderAll(); } }]
                                });
                            }
                        });
                        return '';
                    }
                }
            ]
        },

        // eventy-audit-mrd (04.09.2026) §4.4-4.6 Fáze 4 — poslední fáze
        // z auditu. Dravec: denní/viditelný predátor, volba s agencí (na
        // rozdíl od nočních tichých ticků liška/kuna/vlk z Fáze 2).
        // Historicky ověřeno: jestřáb lesní je zdokumentovaný, agresivní
        // predátor drůbeže — i v současnosti (ČSO/policejní záznamy z
        // Kroměřížska 2023: chovatel slepic řešil opakované útoky
        // jestřába pastí). Sokol/káně jako doplňkové druhy pro variabilitu.
        {
            id: 'predator_raptor_poultry',
            icon: '🦅',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'A Hawk Over the Yard' : 'Jestřáb nad dvorem',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*A shadow circles low over the yard — goshawk, maybe a falcon. The hens scatter, the pigeons scatter. It only needs one moment of carelessness.*'
                    : '*Nad dvorem krouží nízko stín — jestřáb, možná sokol. Slepice se rozprchnou, holubi taky. Stačí chvilka nepozornosti.*';
            },
            cooldownDays: 18,
            trigger: () => {
                const hens = (GameState.henhouse && GameState.henhouse.built && Array.isArray(GameState.henhouse.hens)) ? GameState.henhouse.hens.length : 0;
                const pigeons = (GameState.columbarium && GameState.columbarium.built) ? (GameState.columbarium.count || 0) : 0;
                if (hens + pigeons <= 0) return false;
                return Math.random() < 0.025;
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Scare it off' : 'Zahnat křikem a klackem',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Quick reaction, no guarantee.' : 'Rychlá reakce, žádná záruka.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (typeof VigorSystem !== 'undefined') VigorSystem.addFatigue(6);
                        if (Math.random() < 0.7) {
                            return en ? 'It wheels away, empty-taloned.' : 'Odlétá pryč, s prázdnými spáry.';
                        }
                        const hens = (GameState.henhouse && Array.isArray(GameState.henhouse.hens)) ? GameState.henhouse.hens : [];
                        if (hens.length > 0) { hens.splice(0, 1); return en ? 'Too slow — one hen taken.' : 'Pozdě — jedna slepice pryč.'; }
                        if (GameState.columbarium && (GameState.columbarium.count || 0) > 0) { GameState.columbarium.count -= 1; return en ? 'Too slow — one pigeon taken.' : 'Pozdě — jeden holub pryč.'; }
                        return en ? 'It leaves on its own.' : 'Odlétá sám od sebe.';
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Let it be' : 'Nechat být',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Saves effort, costs a bird.' : 'Šetříš síly, drůbež platí.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const hens = (GameState.henhouse && Array.isArray(GameState.henhouse.hens)) ? GameState.henhouse.hens : [];
                        if (hens.length > 0) { hens.splice(0, 1); return en ? 'It stoops once — one hen gone.' : 'Jednou se snese — jedna slepice pryč.'; }
                        if (GameState.columbarium && (GameState.columbarium.count || 0) > 0) { GameState.columbarium.count -= 1; return en ? 'It stoops once — one pigeon gone.' : 'Jednou se snese — jeden holub pryč.'; }
                        return en ? 'It circles and moves on.' : 'Zakrouží a odletí jinam.';
                    }
                }
            ]
        },
        {
            id: 'weather_flood',
            icon: '🌊',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'The River Runs High' : 'Rozvodněná řeka',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*Days of rain have swollen the streams past their banks. The lower beds and fields stand in water — what is not lost outright will rot at the root.*'
                    : '*Dny deště vzedmuly potoky přes břehy. Nižší záhony a pole stojí ve vodě — co nezůstane úplně, to shnije v kořeni.*';
            },
            cooldownDays: 14,
            trigger: () => {
                if (typeof WeatherSystem === 'undefined' || !WeatherSystem.countWetDays) return false;
                const hasGarden = (GameState.garden && GameState.garden.length) || (GameState.fields && GameState.fields.length);
                if (!hasGarden) return false;
                return WeatherSystem.countWetDays(3).wet >= 3;
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Understood' : 'Rozumím',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Note it in the chronicle.' : 'Zaznamenat do kroniky.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const msg = en ? 'The flood is noted. Low-lying beds will pay for it.' : 'Povodeň zaznamenána. Nízko položené záhony to odnesou.';
                        EventsSystem._addKronika(msg);
                        return msg;
                    }
                }
            ]
        },
        {
            id: 'accident_fire',
            icon: '🔥',
            title: () => (GameState.settings && GameState.settings.language === 'en') ? 'A Spark from the Forge' : 'Jiskra z výhně',
            text: () => {
                const en = GameState.settings && GameState.settings.language === 'en';
                return en
                    ? '*A stray spark catches in the woodpile by the smithy — the furnace has burned unwatched too long. Smoke, not yet flame, but not far from it.*'
                    : '*Bludná jiskra chytla ve dřevníku vedle kovárny — pec hoří bez dozoru už dlouho. Zatím kouř, ne plamen, ale nedaleko k němu.*';
            },
            cooldownDays: 25,
            trigger: () => {
                const kov = GameState.storage && GameState.storage.kovarna;
                if (!kov || !kov.built || !kov.furnace || !(kov.furnace.fuelMs > 0)) return false;
                return Math.random() < 0.012;
            },
            choices: [
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Douse it now' : 'Uhasit rychle',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'Costs effort, saves the fuel.' : 'Stojí sílu, zachrání palivo.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        if (typeof VigorSystem !== 'undefined') VigorSystem.addFatigue(8);
                        return en ? 'Smothered in time. The furnace still burns.' : 'Uhašeno včas. Pec dál hoří.';
                    }
                },
                {
                    label: () => (GameState.settings && GameState.settings.language === 'en') ? 'Let it burn out' : 'Nechat dohořet',
                    desc: () => (GameState.settings && GameState.settings.language === 'en') ? 'No effort — but the furnace goes cold, and repairs cost.' : 'Bez námahy — ale pec vychladne a oprava něco stojí.',
                    action: () => {
                        const en = GameState.settings && GameState.settings.language === 'en';
                        const kov = GameState.storage && GameState.storage.kovarna;
                        if (kov && kov.furnace) kov.furnace.fuelMs = 0;
                        if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                            CellariumSystem.addGrose(-15, { title: en ? 'Furnace repair' : 'Oprava výhně', source: 'Kovárna' });
                        }
                        return en ? 'The furnace goes dark. Repairs cost 15 groše.' : 'Pec zhasne. Oprava stála 15 grošů.';
                    }
                }
            ]
        }
    ],

    // ── checkRepeatableEvents — vlastní cooldown per event, ne navždy-jednou ──
    checkRepeatableEvents: function() {
        if (!GameState.events) GameState.events = {};
        if (!GameState.events.repeatable) GameState.events.repeatable = {};
        const now = Date.now();

        const last = GameState.events.lastRandomEvent || 0;
        if (now - last < 24 * 3600000) return; // sdílená 24h pojistka s jednorázovými eventy

        for (let event of this.repeatableEvents) {
            const lastFired = GameState.events.repeatable[event.id] || 0;
            const cooldownMs = (event.cooldownDays || 7) * 24 * 3600000;
            if (now - lastFired < cooldownMs) continue;
            if (event.trigger()) {
                if (event.id === 'inq_morning_visit' && GameState.flags) GameState.flags.inquisitorComing = false;
                if (event.choices && event.choices.length > 0) {
                    this.showEvent(event);
                } else {
                    this.applyAutoEffect(event);
                }
                GameState.events.repeatable[event.id] = now;
                GameState.events.lastRandomEvent = now;
                Game.save();
                break;
            }
        }
    },

    lastCheck: 0,
    ACTION_THRESHOLD: 50,

    // ── Volá se z Game loop při každé akci hráče ─────────────────────────────
    onAction: function() {
        if (!GameState.events) GameState.events = {};
        // actionCount persistovaný v GameState
        GameState.events.actionCount = (GameState.events.actionCount || 0) + 1;
        if (GameState.events.actionCount >= this.ACTION_THRESHOLD) {
            GameState.events.actionCount = 0;
            this.checkRandomEvents();
            this.checkRepeatableEvents();
        }
        this.checkPendingTimeouts(); // eventy-audit-mrd (05.09.2026) — každou akci, levné (early-return když fronta prázdná)
    },

    // ── Náhodné eventy (akce-based, max 1/24h) ────────────────────────────────
    checkRandomEvents: function() {
        if (!GameState.events) GameState.events = {};
        if (!GameState.events.triggered) GameState.events.triggered = {};
        const now = Date.now();

        // Walledbooks return check — naplánovaný návrat, nezávislý na 24h pojistce níže
        if (GameState.eventData && GameState.eventData.walledBooks) {
            const data = GameState.eventData.walledBooks;
            if (Date.now() >= data.returnTime) {
                Game.addItem('paper', Math.floor(data.paper * 0.8));
                Game.addItem('research', Math.floor(data.research * 0.8));
                Game.addItem('common_codex', Math.floor(data.common_codex * 0.8));
                Game.addItem('luxury_codex', Math.floor(data.luxury_codex * 0.8));
                Game.addItem('vellum_codex', Math.floor(data.vellum_codex * 0.8));
                delete GameState.eventData.walledBooks;
                UI.notifyPanel(t("events.swedish_siege.wall_return"), 'system');
                EventsSystem._addKronika(t("events.swedish_siege.wall_return"));
                Game.save();
            }
        }

        const last = GameState.events.lastRandomEvent || 0;
        if (now - last < 24 * 3600000) return; // max 1 nový event za 24h

        for (let event of this.events) {
            // canTrigger persistovaný v GameState.events.triggered
            if (GameState.events.triggered[event.id]) continue;
            if (event.trigger()) {
                this.showEvent(event);
                GameState.events.triggered[event.id] = true;
                GameState.events.lastRandomEvent = now;
                Game.save();
                break;
            }
        }
    },

    // ── Automatický efekt bez modalu ──────────────────────────────────────────
    // ── Helper: zápis do Kroniky ─────────────────────────────────────────────
    _addKronika: function(msgCs) {
        if (typeof Game !== 'undefined' && typeof Game.addKronikaEntry === 'function') {
            Game.addKronikaEntry('important', msgCs, msgCs, '');
        }
    },

    applyAutoEffect: function(event) {
        if (!event.effect) return;
        event.effect();
        if (event.notifyKey) {
            UI.notifyPanel(t(event.notifyKey), 'system');
            if (typeof Game !== 'undefined' && typeof Game.addKronikaEntry === 'function') {
                Game.addKronikaEntry('important', t(event.notifyKey), t(event.notifyKey), '');
            }
        }
    },

    // ── KALENDÁŘNÍ EVENTY — ODSTRANĚNO 15.8.2026 (kalendar-widget-mrd.md §0) ──
    // Duplicitní systém k CalendarSystem.checkCalendarEvents() (calendar.js),
    // stejných 9 ID, rozešlé efekty (dvojí palba na shodné datum). Funkční
    // část (walpurgisAthanor flag pro Athanor bonus, Silvestrovský reset
    // canTrigger/triggered) přenesena do calendar.js. Zbytek byl mrtvý kód
    // (flags, co nikde nic nečetlo).


    // ── Najít definici eventu podle id napříč všemi 3 pooly (pro reopen z panelu) ──
    _findEventById: function(id) {
        return this.events.find(e => e.id === id) ||
               this.repeatableEvents.find(e => e.id === id) ||
               null;
    },

    // eventy-audit-mrd (05.09.2026) — pending decision eventy z tohohle
    // souboru dřív mohly viset v NotificationSystem.pendingDecisionEvents
    // navěky (žádný timeout nikde v `notifications.js`). Netýká se to
    // ostatních pending zdrojů (chronicon/calendar_*/game_confession apod.
    // — mají source jiný než 'events', tenhle check je nechává být).
    // Default volba PRIORITNĚ z event.timeoutIndex (explicitní, ověřené
    // ručně — u pellinga_swedish_siege/inq_raid poslední volba v poli NENÍ
    // bezpečná, viz komentáře u těch dvou eventů); jinak poslední index.
    PENDING_TIMEOUT_DAYS: 3,
    checkPendingTimeouts: function() {
        if (typeof GameState === 'undefined' || !GameState.pendingDecisionEvents || !GameState.pendingDecisionEvents.length) return;
        if (typeof NotificationSystem === 'undefined' || !NotificationSystem.resolvePendingEvent) return;

        const now = Date.now();
        const timeoutMs = this.PENDING_TIMEOUT_DAYS * 24 * 3600000;
        const due = GameState.pendingDecisionEvents.filter(p => p.source === 'events' && (now - p.time) >= timeoutMs);
        if (!due.length) return;

        due.forEach(p => {
            const event = this._findEventById(p.id);
            if (!event || !event.choices || !event.choices.length) {
                NotificationSystem.resolvePendingEvent(p.id); // definice zmizela/nekompatibilní — zahodit, ne nechat viset
                return;
            }
            const idx = (event.timeoutIndex !== undefined) ? event.timeoutIndex : (event.choices.length - 1);
            const choice = event.choices[idx] || event.choices[event.choices.length - 1];
            const result = choice.action();
            NotificationSystem.resolvePendingEvent(p.id);

            if (NotificationSystem.panel) {
                const lang = (GameState.settings && GameState.settings.language) || 'cs';
                const resolve = (val) => typeof val === 'function' ? val() : val;
                const title = resolve(event.title) || p.title || '';
                NotificationSystem.panel('⏳ ' + (lang === 'en'
                    ? `Unanswered — "${title}" resolved on its own: ${result}`
                    : `Nezodpovězeno — „${title}" se vyřešilo samo: ${result}`), 'warning');
            }
        });
        Game.save();
    },

    showEvent: function(event) {
        if (typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;

        // Podpora title/text/label/desc jako funkce (lazy, jazykově reaktivní) —
        // vedle stávajícího title/text stringu a titleKey/textKey (t() lookup).
        // Nesahá do cs.js/en.js — pro nové eventy s inline dvojjazyčným textem.
        const resolve = (val) => typeof val === 'function' ? val() : val;
        const resolvedTitle = resolve(event.title) || (event.titleKey ? t(event.titleKey) : '');

        // Nevyřízený decision-event zůstává ve frontě (Panel), dokud hráč
        // nevybere volbu — klik mimo modal ho dnes jen zavře, nezmaže.
        // event.id musí být stabilní (buď z EventsSystem poolů, nebo dodané
        // volajícím systémem — viz ChroniconSystem.checkPendingAdvisory,
        // event.source='chronicon'); bez id nelze položku znovu otevřít.
        if (event.choices && event.choices.length > 0 && event.id && NotificationSystem.pendingEvent) {
            NotificationSystem.pendingEvent({
                id:     event.id,
                icon:   event.icon || '📜',
                title:  resolvedTitle,
                source: event.source || 'events',
            });
        }

        const choices = (event.choices || []).map(choice => {
            const label = resolve(choice.label) || t(choice.labelKey);
            const desc  = resolve(choice.desc)  || (choice.descKey ? t(choice.descKey) : '');
            return {
                label: desc ? `${label}<br><small style="opacity:0.7; font-weight:normal; text-transform:none; letter-spacing:0;">${desc}</small>` : label,
                type: 'default',
                effect: () => {
                    const result = choice.action();
                    // Auto-resolve z fronty jen pro vlastní eventy (events.js pooly) —
                    // u cizích volajících (source='chronicon' aj.) může volba znamenat
                    // "odložit" (defer) a záznam má zůstat pending; ten systém si
                    // resolvePendingEvent zavolá sám v momentě, kdy je opravdu hotovo.
                    if ((!event.source || event.source === 'events') && event.id && NotificationSystem.resolvePendingEvent) {
                        NotificationSystem.resolvePendingEvent(event.id);
                    }
                    Game.save();
                    NotificationSystem.modal({
                        title: t('events.ui.result'),
                        image: event.image || null,
                        text: result,
                        choices: [{
                            label: t('events.ui.close'),
                            type: 'primary',
                            effect: () => {
                                if (typeof UI !== 'undefined' && typeof UI.renderAll === 'function') UI.renderAll();
                            }
                        }]
                    });
                }
            };
        });

        NotificationSystem.modal({
            icon: event.icon || '📜',
            image: event.image || null,
            title: resolvedTitle,
            text: resolve(event.text) || t(event.textKey),
            choices: choices
        });
    }
};