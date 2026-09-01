// ─────────────────────────────────────────────────────────────
// ContactsDB — Clientela: satelitní kontakty kláštera
// MRD: clientela-conversi-porta-reference.md, sekce 1.2b (schváleno)
// K1: infrastruktura. Hra tento soubor zatím NEČTE.
// Hub UI (8. subtab Saeculum, gate: secular antiquarius) = K2.
// Relation mechanika = K3. Sell bonus napojení = K4.
//
// GATE MAPOVÁNÍ (unlockTech) = NÁVRH ověřený proti reálným tech ID
// v data/tech.js — potvrdit před K2. Položky označené TBD čekají
// na rozhodnutí/na vznik techu.
// ─────────────────────────────────────────────────────────────

const ContactsDB = {
    chirurgus: {
        confession: "Přiznává, že žíly pouští i beze svolení faráře — a že nejlepší břitvu ukradl krejčímu.",
        confession_en: "He confesses to letting blood without the priest's leave — and to having stolen his best razor from a tailor.",
        name: 'Chirurgus', name_en: 'Surgeon', icon: '🩹',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_infirmarium',
        // Clientela pool MRD (25.7.2026): bere syrové byliny na svoje masti,
        // prodává hotové mastičky bez vlastního receptu (jeho obor — rány/
        // zlomeniny, ne bylinkářské sirupy, ty zůstávají jinde)
        sellBonus: { items: { comfrey: 3, yarrow: 3, plantain: 3 } },
        buyOffer: {
            items: {
                mast_kostivalova: { price: 10, stock: 3 },
                tinktura_rebrikova: { price: 9, stock: 3 },
                mast_jitrocelova: { price: 8, stock: 4 },
                mast_universalni: { price: 13, stock: 2 },
                spongia_somnifera: { price: 9, stock: 2 },
            }
        },
        desc: 'Potulný ranhojič a lazebník. Klášter mu holí i pouští žilou, chirurgii mniši sami nesmí.',
        desc_en: 'A wandering surgeon-barber. He shaves the brothers and lets their blood — surgery itself monks may not perform.'
    },
    syrar: {
        confession: "Přiznává, že do tvarohu přilévá syrovátku a míru dorovnává palcem.",
        confession_en: "He confesses to thinning the curd with whey and topping the measure with his thumb.",
        name: 'Sýrař', name_en: 'Cheesemaker', icon: '🧀',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_caseus',            // existuje (Lactaria II řetězec)
        sellBonus: {
            items: {
                goat_cheese_fresh: null, goat_cheese_mature: null, goat_cheese_aged: null,
                sheep_cheese_fresh: null, sheep_cheese_mature: null, sheep_cheese_aged: null,
                cow_cheese_fresh: null, cow_cheese_mature: null, cow_cheese_aged: null, syrecky_fresh: null, syrecky_mature: null,
                cheese: 6
            }
        }, // K4b: null = BASE_PRICES; cheese: 6 pevná cena (obecný Sýr z L19 dopisu, dosud bez ceny nikde — Clientela pool MRD 25.7.2026)
        buyOffer: {
            items: {
                rennet: { price: 4, stock: 5 },
                cheese_mold: { price: 10, stock: 2 },
            }
        },
        desc: 'Vesnický sýrař. Vykoupí klášterní sýr lépe než trh.',
        desc_en: 'The village cheesemaker. Buys monastery cheese better than the market.'
    },
    mlynar: {
        confession: "Sype si z každého pytle o hrst víc, než mlynáři náleží.",
        confession_en: "From every sack he takes a handful more than a miller's due.",
        name: 'Mlynář', name_en: 'Miller', icon: '🌾',
        primaryAxis: 'village',
        secondaryAxis: { axis: 'church', weight: 0.2 },   // mlýnský desátek
        unlockTech: null,                     // dostupný hned s hubem (Mola/mouka = raná hra)
        // clientela-chronicon-most-mrd v0.1 (29.7.2026) — propojeno na
        // Chronicon aktéra 'mlynar' (Krok A). Zatím jen identita; report
        // mechanismus (Krok B) přijde samostatně.
        chroniconActorId: 'mlynar',
        // M1 — výkup z polí (mouku NEvykupuje, tu mele sám); zrní mimo BASE_PRICES = exkluzivní kanál
        sellBonus: {
            items: {
                grain: 2, rye_grain_2: 3, wheat_grain_2: 3, rye_grain_1: 5, wheat_grain_1: 5,
                barley: 2, oats: 2, millet: 2, peas: 2
            }
        },
        // M2 — nabídka (prodává hráči): zrní, mouka a seno (denní stock)
        // historicky-podklad-mrd (9.8.2026): seno pro zimní krmení zvěře
        // (goatpen/cowbyre/stable/donkeyStall/pigsty) — mlynář je nejbližší
        // existující "obilní" uzel v Clientele, dedikovaný rolník neexistuje
        buyOffer: {
            items: {
                grain: { price: 4, stock: 10 },
                flour_2: { price: 9, stock: 5 },
                flour_1: { price: 16, stock: 2 },
                hay: { price: 3, stock: 8 }
            }
        },
        desc: 'Mlynář od řeky. Desátek odvádí kostelu, obchody dělá s každým.',
        desc_en: 'The miller by the river. He tithes to the church and trades with everyone.'
    },
    vinar: {
        confession: "Křtil víno vodou — prý jen to pro formany, ne to mešní.",
        confession_en: "He has watered his wine — only the carters' cut, he swears, never the mass wine.",
        name: 'Vinař', name_en: 'Winemaker', icon: '🍷',
        primaryAxis: 'village',
        secondaryAxis: { axis: 'church', weight: 0.2 },   // mešní víno
        unlockTech: 'tech_vinifikace',        // existuje (Mustum→Vinum řetězec)
        sellBonus: {
            items: {
                mustum: 3, vinum: 9, vinum_rubrum: 10, vinum_praeclarum: 22,
                raisins: 4
            }
        }, // K4b: exkluzivní odbyt — trh vinum neprodává (mimo BASE_PRICES); raisins: popisek slibuje prodej, dosud bez ceny (Clientela pool MRD 25.7.2026)
        buyOffer: {
            items: {
                vinegar: { price: 3, stock: 5 },
                tartarus: { price: 6, stock: 3 },
            }
        },
        desc: 'Vinař z jižních strání. Mešní víno dodává i biskupství.',
        desc_en: 'A winemaker from the southern slopes. He supplies mass wine even to the bishopric.'
    },
    kovar: {
        confession: "Klel při kování tak, že se vesnice žehnala. A v neděli rozdělal výheň.",
        confession_en: "He cursed at the anvil till the village crossed itself. And lit the forge on a Sunday.",
        name: 'Kovář', name_en: 'Blacksmith', icon: '🔨',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_kovarina',          // existuje
        // clientela-chronicon-most-mrd v0.1 (29.7.2026) — propojeno na
        // Chronicon aktéra 'kovar' (Krok A), mirror mlynar/sklar.
        chroniconActorId: 'kovar',
        sellBonus: { items: { iron_ore: 6, iron_ingot: 10 } },   // K4b: výkup pod nákupní cenou Obchodu (15) — přebytek rozhodne hráč; iron_ingot: polotovar, přebytek nad truhla_i spotřebou (Clientela pool MRD 25.7.2026)
        buyOffer: {
            items: {
                palice_zelezna: { price: 16, stock: 2 },
                kovani: { price: 8, stock: 4 },
                hrebiky: { price: 2.5, stock: 5 }, // kovani-rozsireni-mrd (7.8.2026): nejlevnější kanál, ale nejvíc omezený
                brass_rivet: { price: 4, stock: 2 }, // athanor-research-mrd: mosaz je dražší a vzácnější než železo
                britva_kovarska: { price: 12, stock: 1 },
                sada_podkov: { price: 14, stock: 2 },
                // kovarna-dilna-mrd.md v0.5 (30.8.2026) — vybavení Kovárny,
                // levnější kanál než Trh (mirror hrebiky/kovani vzoru).
                podkovarske_kladivo: { price: 25, stock: 2 },
                raspa_kopytni: { price: 15, stock: 1 },
            }
        }, // plní starý slib "prodá nástroje" z popisku + kování na Velký úl (Apiarium MRD)
        // cluster-A-mrd (28.8.2026) — Libraria Secreta trezor. Jednorázová
        // zakázka, ne řemeslo Výroby (viz D5 "jednorázovka a složitější" pravidlo).
        // Sdílí generický SaeculumSystem.orderFromContact() vzor se Sklářem/Kameníkem.
        glassOrders: {
            trezor: { itemId: 'libraria_secreta_kit', price: 70, minRelation: 30 }
        },
        // britva_kovarska: Minutio MRD (25.7.2026) — do budoucna i craftovatelná
        // v klášteře po kovárna-upgrade tech (TODO, samostatný sprint)
        desc: 'Vesnický kovář. Vykoupí přebytečnou rudu, prodá nástroje.',
        desc_en: 'The village blacksmith. Buys surplus ore, sells tools.'
    },
    tkadlec: {
        confession: "Do dobré příze přimíchává horší a mlčí o tom.",
        confession_en: "He blends poorer thread into the good yarn and keeps quiet about it.",
        name: 'Tkadlec', name_en: 'Weaver', icon: '🧵',
        primaryAxis: 'village',
        secondaryAxis: { axis: 'church', weight: 0.2 },   // roucha/paramenta
        unlockTech: 'tech_de_re_rustica',     // stříhání vlny žije pod Ovile (tech_lanificium zrušen — mechanika už existovala)
        sellBonus: { items: { wool: null } }, // K4: null = cena z BASE_PRICES (wool: 5)
        // Clientela pool MRD (25.7.2026): hotové plátno/soukno (dosud bez
        // receptu i ceny) + liturgická roucha (přesunuto z ENTITY_SHOP.shop —
        // patří k osobnímu vztahu s tkadlecem, ne anonymnímu pultu Obchodu)
        buyOffer: {
            items: {
                wool_cloth: { price: 9, stock: 4 },
                fulled_wool_cloth: { price: 14, stock: 2 },
                linen_cloth: { price: 7, stock: 3 },
                hemp_canvas: { price: 5, stock: 4 },
                roucho_bile: { price: 12, stock: 1 },
                roucho_fialove: { price: 12, stock: 1 },
                roucho_zelene: { price: 12, stock: 1 },
                roucho_cervene: { price: 12, stock: 1 },
            }
        },
        desc: 'Tkadlec z podhradí. Vlnu bere, roucha tká i pro kostel.',
        desc_en: 'A weaver from below the castle. He takes wool and weaves vestments even for the church.'
    },
    voskar: {
        confession: "Nastavuje včelí vosk lojem a prodává ho kostelům jako čistý.",
        confession_en: "He stretches beeswax with tallow and sells it to churches as pure.",
        name: 'Voskař', name_en: 'Wax Chandler', icon: '🕯️',
        primaryAxis: 'church',
        secondaryAxis: null,
        unlockTech: 'tech_candle',            // existuje (Apiarium/svíce)
        sellBonus: { items: { beeswax: null } }, // K4: null = cena z BASE_PRICES (trh)
        buyOffer: {
            items: {
                candle: { price: 4, stock: 5 }, // schváleno: prodej svící (trh vykupuje za 2; vlastní výroba fat+rope nejlevnější — Voskař = pohodlí)
                incense_spruce: { price: 3, stock: 5 },
                incense_pine: { price: 4, stock: 4 },
            }
        }, // incense_spruce/pine: Clientela pool MRD 25.7.2026, levné místní kadidlo
        desc: 'Voskař u kostela. Surový vosk z Apiária vykoupí líp než kdokoliv.',
        desc_en: 'The wax chandler by the church. He pays better for raw beeswax than anyone.'
    },
    lovec: {
        confession: "Vzal zajíce na panském. Dva. Možná tři, nepočítal.",
        confession_en: "He took a hare on the lord's land. Two. Maybe three — he wasn't counting.",
        name: 'Lovec', name_en: 'Hunter', icon: '🏹',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_de_animalibus',     // NÁVRH (znalost zvěře) — TBD potvrdit, alternativa: scavenge hunt flag
        sellBonus: {
            items: {
                meat: 2, hide: null, leather: null, caught_small_game: 3,
                cornu_cervi: 5, rabbit_pelt: 3
            }
        }, // L2: Divoké maso exkluzivně (mimo trh), kůže z BASE_PRICES; fat/bone záměrně mimo (craft užití); cornu_cervi/rabbit_pelt: Clientela pool MRD 25.7.2026
        // L3a: exkluzivní nabídka — oko až od vztahu ≥ 25 (MRD bod 8 mechanismus)
        buyOffer: { items: { snare: { price: 5, stock: 3, minRelation: 25 } } },
        desc: 'Lovec drobné zvěře. Velká zvěř patří pánům — on to ví nejlíp.',
        desc_en: 'A hunter of small game. The big game belongs to the lords — he knows it best.'
    },
    sklar: {
        confession: "Prodal popraskané kusy jako dobré a závidí benátským jejich zrcadla.",
        confession_en: "He sold cracked pieces as sound, and envies the Venetians their mirrors.",
        name: 'Sklář', name_en: 'Glassmaker', icon: '🔮',
        primaryAxis: 'scholars',
        secondaryAxis: null,
        unlockTech: 'tech_czech_glass',       // existuje
        unlockBook: 'book_czech_glass',       // dvojitý gate (schváleno 7.7.): tech = umíš, kniha = víš o hutích
        // sdileny-pool-mrd v2 (26.7.2026): propojeno na Chronicon aktéra
        // 'sklar' — stock u itemů co má v producesItems se čte živě ze
        // snapshotu (viz ChroniconSystem.getActorItemStock); cena zůstává
        // statická z buyOffer níže (cenový vzorec odloženo na budoucí fázi).
        chroniconActorId: 'sklar',
        sellBonus: { items: { vapno_hasene_mature: { price: 4, minRelation: 50 } } }, // vykup-vapna-mrd (7.8.2026)
        // V4 — nabídka: běžné kusy denně; speciality přes ZAKÁZKY (glassOrders níže)
        buyOffer: {
            items: {
                glass_stopper: { price: 3, stock: 5 },
                glass_flask: { price: 6, stock: 3 },
                glass_goblet: { price: 8, stock: 2 },
                glass_tankard: { price: 8, stock: 2 },
                glass_jug: { price: 9, stock: 2 },
                glass_bowl: { price: 10, stock: 2 },
                glass_pitcher: { price: 12, stock: 1 },
                fly_trap_glass: { price: 7, stock: 1 },
                naramek_sklo_zeleny: { price: 5, stock: 4 },
                naramek_sklo_hnedy: { price: 5, stock: 4 },
                naramek_sklo_modry: { price: 12, stock: 2 }
            }
        }, // náramky: Clientela pool MRD 25.7.2026, nový obsah
        // V4/S2 — zakázky: 48 h, 50 % záloha, vztahové gaty, +2 vztah za dokončení
        glassOrders: {
            vaza: { itemId: 'glass_vase', price: 14, minRelation: 0 },
            tercik: { itemId: 'window_roundel', price: 15, minRelation: 0 },
            alembik: { itemId: 'alembic', price: 25, minRelation: 25 },
            pateriky: { itemId: 'paternoster_beads', price: 18, minRelation: 30 },
            oculi: { itemId: 'oculi', price: 30, minRelation: 35 },
            zrcadlo: { itemId: 'glass_mirror', price: 40, minRelation: 50 }
        },
        desc: 'Sklář z hutě v lesích. Alembiky a křivule pro učené — křehké zboží, stálý odbyt.',
        desc_en: 'A glassmaker from a forest works. Alembics and retorts for the learned — fragile goods, steady trade.'
    },
    kamenik: {
        confession: "Do základů kostela vyzdil kámen z hřbitovní zdi. Nikdo si nevšiml, tvrdí.",
        confession_en: "He walled a stone from the cemetery wall into the church foundations. No one noticed, he claims.",
        name: 'Kameník', name_en: 'Stonemason', icon: '🪨',
        primaryAxis: 'village',
        secondaryAxis: { axis: 'church', weight: 0.3 },   // chrliče a kamenné dílo pro Fabrica
        unlockTech: 'tech_carpentaria',       // existuje — tesařství/kamenictví společný gate (cut_stone)
        sellBonus: { items: { rock: 1, cut_stone: 3 } },   // mimo trh (BASE_PRICES) — pevná exkluzivní cena, ne null (viz Kovář/iron_ore)
        // Clientela pool MRD (25.7.2026): běžná denní nabídka vedle zakázek — kamenná obdoba Kovářových nástrojů
        buyOffer: {
            items: {
                whetstone: { price: 12, stock: 3 },
                palice_kamenna: { price: 9, stock: 2 },
            }
        },
        // zakázka — sdílí generický mechanismus SaeculumSystem.orderFromContact (stejné pole jako Sklář: 48 h, 1 slot, 50 % záloha)
        glassOrders: {
            nahrobek: { itemId: 'nahrobek', price: 8, minRelation: 0 },
            chrlic: { itemId: 'chrlic', price: 25, minRelation: 20 },
            beryllus: { itemId: 'beryllus', price: 8, minRelation: 0 }
        },
        desc: 'Kameník od lomu. Otesá náhrobek pro farní rodinu i chrliče pro chrám.',
        desc_en: 'A stonemason from the quarry. He carves a gravestone for a parish family, or gargoyles for the church.'
    },
    klenotnik: {
        confession: "Zlato, co váží na zlaťáku falešnou váhu, prý poznat nejde — leda by ses zeptal jeho svědomí.",
        confession_en: "Gold weighed on a rigged scale can't be told apart, he says — unless you ask his conscience.",
        name: 'Klenotník', name_en: 'Goldsmith', icon: '💍',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_klenotnictvi',
        // Odemčení navíc vyžaduje vztah s Kameníkem (zvláštní gate, viz
        // renderClientela — zlatnický cech je oddělený od kamenického,
        // Kameník jen zprostředkuje kontakt).
        unlockContact: { id: 'kamenik', minRelation: 40 },
        sellBonus: { items: { stribrny_prut: 105, zlaty_prut: 1190 } },   // výkup zpět — spread ~70 % nákupní ceny (mirror historické praxe zlatníků)
        buyOffer: {
            items: {
                stribrny_prut: { price: 150, stock: 3, minRelation: 0 },
                zlaty_prut: { price: 1700, stock: 2, minRelation: 0 },
                truhla_ii: { price: 1400, stock: 1, minRelation: 0 },
            }
        },
        desc: 'Zlatník ve městě. Kupuje i prodává stříbrné a zlaté pruty — cesta k němu vede přes Kameníkovy styky.',
        desc_en: "A goldsmith in the city. Buys and sells silver and gold ingots — the path to him leads through the Stonemason's connections."
    },
    giacomo: {
        confession: "Prodává janovské zboží jako benátské a benátské jako janovské — podle toho, kdo se ptá.",
        confession_en: "He sells Genoese goods as Venetian, and Venetian as Genoese — whichever the buyer prefers.",
        name: 'Giacomo Foscari', name_en: 'Giacomo Foscari', icon: '⚓',
        primaryAxis: 'scholars',
        secondaryAxis: null,
        unlockTech: null,                     // dostupný hned, jako dnes (persona.influence.giacomo)
        sellBonus: {},                        // Giacomo jen prodává — výkup řeší jinde (vinum bonus zůstává legacy mechanika)
        // Přítomen jen v okně po příjezdu (CellariumSystem.isGiacomoPresent) — gate v buyFromContact
        // giacomo-obchod-audit (7.8.2026): DVĚ NEZÁVISLÉ vrstvy gatingu navrch k sobě:
        //   1) minRelation — osobní důvěra k Giacomovi (beze změny, jako dnes)
        //   2) minReputation — u NEJDRAŽŠÍCH/NEJEXOTIČTĚJŠÍCH 4 položek navíc
        //      persona.reputation.slechta (pověst u šlechty). Zahraniční luxusní
        //      kupec dbá i na společenské postavení klienta, ne jen na to, kolikrát
        //      s ním hráč osobně obchodoval. Práh = mirror minRelation dané položky
        //      (symetrie, žádná nová libovolná čísla).
        //   Navrch na CELÝ katalog (bez ohledu na minReputation) ještě škáluje
        //   efektivní stock CellariumSystem.giacomoStockMult() — Chronicon tension
        //   + goldenAge + slechta jako obranný faktor proti tension (viz tam).
        buyOffer: {
            items: {
                paper_fine: { price: 6, stock: 3, minRelation: 0 },
                pepr_cerny: { price: 6, stock: 3, minRelation: 20 },
                zazvor: { price: 6, stock: 3, minRelation: 20 },
                hrebicek: { price: 12, stock: 2, minRelation: 25 },
                skorice: { price: 10, stock: 2, minRelation: 25 },
                muskat: { price: 14, stock: 2, minRelation: 28 },
                muskatovy_kvet: { price: 20, stock: 1, minRelation: 32, minReputation: { axis: 'slechta', value: 32 } },
                hedvabi: { price: 15, stock: 2, minRelation: 30, minReputation: { axis: 'slechta', value: 30 } },
                safran: { price: 28, stock: 1, minRelation: 35, minReputation: { axis: 'slechta', value: 35 } },
                // coquina-tier4-mrd (7.8.2026): mandle pro panskou kuchyň (Platina)
                almond: { price: 12, stock: 3, minRelation: 22 },
                alum: { price: 8, stock: 4, minRelation: 15 },
                sandarak: { price: 14, stock: 2, minRelation: 22 },
                sal_ammoniac: { price: 18, stock: 2, minRelation: 28 },
                verzino: { price: 16, stock: 2, minRelation: 24 },
                incense_styrax: { price: 10, stock: 2, minRelation: 20 },
                incense_olibanum: { price: 16, stock: 1, minRelation: 28, minReputation: { axis: 'slechta', value: 28 } },
                // mlynar-vlastni-mlyn-mrd.md §4.5 (16.8.2026) — tržní zkratka k
                // vyzrálýmu dubu, alternativa k vlastnímu kácení+sušení (DryingSystem).
                oak_log_seasoned: { price: 18, stock: 3, minRelation: 20 },
            }
        }, // incense_styrax/olibanum: Clientela pool MRD 25.7.2026, exotický dovoz vedle koření
        desc: 'Benátský obchodník. Přiváží, co jinde nekoupíš — ale jen když je jeho loď v přístavu.',
        desc_en: 'A Venetian merchant. He brings what you cannot buy elsewhere — but only while his ship is in port.'
    },
    rybar: {
        confession: "Prodává ryby z cizích vod jako vlastní úlovek — nikdo se neptá, odkud přitáhl síť.",
        confession_en: "He sells fish from other men's waters as his own catch — no one asks whose net it came from.",
        name: 'Rybář', name_en: 'Fisherman', icon: '🎣',
        primaryAxis: 'village',
        secondaryAxis: null,
        unlockTech: 'tech_piscina_administratio',
        // Clientela pool MRD (25.7.2026): mokřadní úlovek bez odbytu (crayfish/
        // snail/frog_legs nejsou ani na trhu), sádkové produkty bez ceny nikde,
        // úhoř (popisek slibuje "cenná na trhu", dosud 0), vyza premium tier.
        // Záměrně BEZ proutí — má zůstat vzácné, nekupovat zpátky.
        sellBonus: {
            items: {
                crayfish: 3, snail: 2, frog_legs: 3,
                uhor: 18,
                kapr_sadky_fresh: 4, kapr_sadky_purified: 6,
                stika_sadky_fresh: 6, stika_sadky_purified: 9,
                vyza_sadky_fresh: 10,
                vyza_maso: 14, vyza_jikry: 20,
            }
        },
        buyOffer: {
            items: {
                stika: { price: 15, stock: 1 },
                pstruh: { price: 12, stock: 2 },
                uhor: { price: 18, stock: 1 }
            }
        },
        desc: 'Rybář od říčky. Prodá i druhy, co v klášterním rybníce sám nenachováš.',
        desc_en: 'A fisherman by the stream. He sells species you cannot breed in the monastery pond yourself.'
    },
    stationarius: {
        confession: "Prodal opsaný text jako originál — a přiúčtoval si podíl z pecia navíc, co žákovi nepřiznal.",
        confession_en: "He sold a copied text as an original — and skimmed an extra cut from the pecia fee he never disclosed to the student.",
        name: 'Stationarius', name_en: 'Stationarius', icon: '📚',
        primaryAxis: 'scholars',
        secondaryAxis: null,
        unlockTech: 'tech_writing_basics',
        // Vlastní vstup v Knihovně (ne Clientela grid v Saeculu) — vyloučen
        // z renderClientela() explicitně. Přítomen periodicky (mirror
        // Giacomo, viz CellariumSystem.checkStationariusEvent) — každých
        // 21 dní na 5 dní, ne vázáno na kalendářní sezónu.
        sellBonus: { items: { ink: 2, vellum: 3, quill: 2, gum_arabic: 2 } },
        buyOffer: {
            items: {
                ink: { price: 3, stock: 5 },
                vellum: { price: 25, stock: 5 }, // ekonomicky-audit-fix (1.9.2026): bylo 5, tržní hodnota (BASE_PRICES.vellum=20) dělala z toho nekonečný arbitráž s výkupem (~21-22g). 25 = mírně nad trh, mirror ink/quill/gum_arabic vzoru (nákup > trh, žádný exploit).
                quill: { price: 4, stock: 3 },
                gum_arabic: { price: 3, stock: 5 },
            }
        },
        desc: 'Univerzitní dealer knih a psacích potřeb. V Olomouci jen po jarním a podzimním knižním veletrhu.',
        desc_en: 'A university dealer in books and writing supplies. In Olomouc only after the spring and autumn book fairs.'
    }
};
