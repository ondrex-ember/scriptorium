const EventsSystem = {
    events: [
        {
            id: 'pellinga_swedish_siege',
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
                        CellariumSystem.addGrose(80);
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
                        CellariumSystem.addGrose(120);
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

    // ── Kalendářní eventy (1× za den, jen dnešní datum) ───────────────────────
    checkCalendarEvents: function() {
        if (!GameState.events) GameState.events = {};
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
        if (GameState.events.lastCalendarDate === todayStr) return; // už zobrazeno dnes
        GameState.events.lastCalendarDate = todayStr;
        Game.save();

        const month = today.getMonth() + 1; // 1-12
        const day   = today.getDate();

        // Velikonoce — pohyblivé datum (přibližný výpočet)
        const easter = this._getEaster(today.getFullYear());
        const ashWed = new Date(easter); ashWed.setDate(ashWed.getDate() - 46);
        const isAshWed   = month === ashWed.getMonth()+1 && day === ashWed.getDate();
        const isEaster   = month === easter.getMonth()+1 && day === easter.getDate();

        // Advent — 1.12 až 23.12
        const isAdvent = month === 12 && day >= 1 && day <= 23;

        let calEvent = null;

        if (isAshWed)                        calEvent = this.calendarEvents.find(e => e.id === 'cal_ash_wednesday');
        else if (isEaster)                   calEvent = this.calendarEvents.find(e => e.id === 'cal_easter');
        else if (month === 4 && day === 30)  calEvent = this.calendarEvents.find(e => e.id === 'cal_walpurgis');
        else if (month === 5 && day === 1)   calEvent = this.calendarEvents.find(e => e.id === 'cal_may_day');
        else if (month === 6 && day === 24)  calEvent = this.calendarEvents.find(e => e.id === 'cal_midsummer');
        else if (month === 11 && day === 2)  calEvent = this.calendarEvents.find(e => e.id === 'cal_all_souls');
        else if (isAdvent)                   calEvent = this.calendarEvents.find(e => e.id === 'cal_advent');
        else if (month === 12 && day === 24) calEvent = this.calendarEvents.find(e => e.id === 'cal_christmas');
        else if (month === 12 && day === 31) calEvent = this.calendarEvents.find(e => e.id === 'cal_new_year');
        else if (month === 1  && day === 1)  calEvent = this.calendarEvents.find(e => e.id === 'cal_new_year');

        if (!calEvent) return;

        if (calEvent.choices && calEvent.choices.length > 0) {
            this.showEvent(calEvent);
        } else {
            this.applyAutoEffect(calEvent);
        }
    },

    // ── Výpočet Velikonoc (Anonymní Gregorian) ────────────────────────────────
    _getEaster: function(year) {
        const a = year % 19, b = Math.floor(year/100), c = year % 100;
        const d = Math.floor(b/4), e = b % 4, f = Math.floor((b+8)/25);
        const g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15) % 30;
        const i = Math.floor(c/4), k = c % 4;
        const l = (32+2*e+2*i-h-k) % 7;
        const m = Math.floor((a+11*h+22*l)/451);
        const month = Math.floor((h+l-7*m+114)/31);
        const day   = ((h+l-7*m+114) % 31) + 1;
        return new Date(year, month-1, day);
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

    // ── checkEvents — zachován pro zpětnou kompatibilitu, volá nové funkce ──
    checkEvents: function() {
        if (Date.now() - this.lastCheck < 60 * 60 * 1000) return;
        this.lastCheck = Date.now();
        this.checkCalendarEvents();
        // walledBooks + random eventy přesunuto do checkRandomEvents
    },
    
    // ── KALENDÁŘNÍ EVENTY ────────────────────────────────────────────────────
    calendarEvents: [

        // A1 — Popeleční středa (automatický)
        {
            id: 'cal_ash_wednesday',
            titleKey: 'events.cal_ash_wednesday.title',
            textKey:  'events.cal_ash_wednesday.text',
            notifyKey: 'events.cal_ash_wednesday.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.ashWednesday = Date.now() + (3 * 24 * 3600000);
                Game.save();
            }
        },

        // A2 — Filipojakubská noc (s volbou)
        {
            id: 'cal_walpurgis',
            titleKey: 'events.cal_walpurgis.title',
            textKey:  'events.cal_walpurgis.text',
            choices: [
                {
                    labelKey: 'events.cal_walpurgis.athanor_btn',
                    descKey:  'events.cal_walpurgis.athanor_desc',
                    action: () => {
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.walpurgisAthanor = Date.now() + (8 * 3600000);
                        // 40% šance inkvizitor druhý den
                        if (Math.random() < 0.4) {
                            GameState.flags.inquisitorComing = true;
                        }
                        Game.save();
                        UI.notifyPanel(t('events.cal_walpurgis.athanor_notif'), 'system');
                        EventsSystem._addKronika(t('events.cal_walpurgis.athanor_notif'));
                        return t('events.cal_walpurgis.athanor_res');
                    }
                },
                {
                    labelKey: 'events.cal_walpurgis.pray_btn',
                    descKey:  'events.cal_walpurgis.pray_desc',
                    action: () => {
                        if (typeof VigorSystem !== 'undefined') {
                            GameState.satiety = Math.min(VigorSystem.MAX_SATIETY, (GameState.satiety || 0) + 10);
                            VigorSystem.renderPill();
                        }
                        UI.notifyPanel(t('events.cal_walpurgis.pray_notif'), 'system');
                        EventsSystem._addKronika(t('events.cal_walpurgis.pray_notif'));
                        return t('events.cal_walpurgis.pray_res');
                    }
                },
                {
                    labelKey: 'events.cal_walpurgis.herbs_btn',
                    descKey:  'events.cal_walpurgis.herbs_desc',
                    action: () => {
                        Game.addItem('thyme', 3);
                        Game.addItem('st_johns_wort', 2);
                        Game.addItem('chamomile', 1);
                        UI.notifyPanel(t('events.cal_walpurgis.herbs_notif'), 'system');
                        EventsSystem._addKronika(t('events.cal_walpurgis.herbs_notif'));
                        return t('events.cal_walpurgis.herbs_res');
                    }
                }
            ]
        },

        // A3 — Velikonoce (automatický)
        {
            id: 'cal_easter',
            titleKey:  'events.cal_easter.title',
            textKey:   'events.cal_easter.text',
            notifyKey: 'events.cal_easter.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.easterBonus = true;
                Game.addItem('honey', 2);
                Game.save();
            }
        },

        // A4 — Máj (automatický)
        {
            id: 'cal_may_day',
            titleKey:  'events.cal_may_day.title',
            textKey:   'events.cal_may_day.text',
            notifyKey: 'events.cal_may_day.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.mayDayBonus = Date.now() + (24 * 3600000);
                Game.save();
            }
        },

        // A5 — Slunovrat / Svatý Jan (s volbou)
        {
            id: 'cal_midsummer',
            titleKey: 'events.cal_midsummer.title',
            textKey:  'events.cal_midsummer.text',
            choices: [
                {
                    labelKey: 'events.cal_midsummer.herbs_btn',
                    descKey:  'events.cal_midsummer.herbs_desc',
                    action: () => {
                        Game.addItem('st_johns_wort', 3);
                        Game.addItem('thyme', 2);
                        Game.addItem('pollen', 1);
                        UI.notifyPanel(t('events.cal_midsummer.herbs_notif'), 'system');
                        EventsSystem._addKronika(t('events.cal_midsummer.herbs_notif'));
                        return t('events.cal_midsummer.herbs_res');
                    }
                },
                {
                    labelKey: 'events.cal_midsummer.work_btn',
                    descKey:  'events.cal_midsummer.work_desc',
                    action: () => {
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags.midsummerWork = true;
                        Game.save();
                        UI.notifyPanel(t('events.cal_midsummer.work_notif'), 'system');
                        EventsSystem._addKronika(t('events.cal_midsummer.work_notif'));
                        return t('events.cal_midsummer.work_res');
                    }
                }
            ]
        },

        // A6 — Dušičky (automatický)
        {
            id: 'cal_all_souls',
            titleKey:  'events.cal_all_souls.title',
            textKey:   'events.cal_all_souls.text',
            notifyKey: 'events.cal_all_souls.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.allSoulsNight = Date.now() + (24 * 3600000);
                Game.save();
            }
        },

        // A7 — Advent (automatický, jen 1. prosince)
        {
            id: 'cal_advent',
            titleKey:  'events.cal_advent.title',
            textKey:   'events.cal_advent.text',
            notifyKey: 'events.cal_advent.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.adventSeason = true;
                Game.save();
            }
        },

        // A8 — Štědrý den (automatický)
        {
            id: 'cal_christmas',
            titleKey:  'events.cal_christmas.title',
            textKey:   'events.cal_christmas.text',
            notifyKey: 'events.cal_christmas.notify',
            choices: [],
            effect: () => {
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.christmasDay = true;
                GameState.flags.adventSeason = false;
                Game.save();
            }
        },

        // A9 — Silvestr / Nový rok (automatický)
        {
            id: 'cal_new_year',
            titleKey:  'events.cal_new_year.title',
            textKey:   'events.cal_new_year.text',
            notifyKey: 'events.cal_new_year.notify',
            choices: [],
            effect: () => {
                // Reset canTrigger všech náhodných eventů (in-memory + persistovaný)
                EventsSystem.events.forEach(e => { e.canTrigger = true; });
                if (GameState.events) GameState.events.triggered = {};
                if (!GameState.flags) GameState.flags = {};
                GameState.flags.christmasDay = false;
                Game.save();
            }
        },

    ], // konec calendarEvents

    showEvent: function(event) {
        if (typeof NotificationSystem === 'undefined' || !NotificationSystem.modal) return;

        // Podpora title/text/label/desc jako funkce (lazy, jazykově reaktivní) —
        // vedle stávajícího title/text stringu a titleKey/textKey (t() lookup).
        // Nesahá do cs.js/en.js — pro nové eventy s inline dvojjazyčným textem.
        const resolve = (val) => typeof val === 'function' ? val() : val;

        const choices = (event.choices || []).map(choice => {
            const label = resolve(choice.label) || t(choice.labelKey);
            const desc  = resolve(choice.desc)  || (choice.descKey ? t(choice.descKey) : '');
            return {
                label: desc ? `${label}<br><small style="opacity:0.7; font-weight:normal; text-transform:none; letter-spacing:0;">${desc}</small>` : label,
                type: 'default',
                effect: () => {
                    const result = choice.action();
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
            title: resolve(event.title) || t(event.titleKey),
            text: resolve(event.text) || t(event.textKey),
            choices: choices
        });
    }
};