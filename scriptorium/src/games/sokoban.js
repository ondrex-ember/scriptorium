// ═══════════════════════════════════════════════════════════════════════════════
// SOKOBAN — Knihovní uspořádání (Ars Bibliothecae)
// Středověký logický hlavolam pro Aula Ludi v klášterní knihovně Scriptorium.
// Obsahuje všech 10 autentických klášterních komnat (Chambers I — X).
// Target: scriptorium/src/games/sokoban.js
// ═══════════════════════════════════════════════════════════════════════════════

const SokobanGame = {
    gameActive: false,
    currentLevel: 0,
    moves: 0,
    pushes: 0,
    score: 0,
    history: [],
    keyboardBound: false,
    maxUnlocked: 0,
    completedLevels: [],
    _audioCtx: null,

    // ── 10 Klášterních komnat (Chambers I — X) ─────────────────────────────────
    levels: [
        {
            "id": 1,
            "name": "Komnata I — Skriptorium začátečníků",
            "name_en": "Chamber I — The Novice’s Scriptorium",
            "subtitle": "Quiet cloister study table",
            "desc": "U krbu ve Foculu dohasínají polena. Bratr Bernard vám svěřil první dva manuskripty: Liber Herbalis a De Sphaera. Uložte je na osvětlené pulty.",
            "desc_en": "Brother Bernard left rare manuscripts scattered across the study tables. Guide each tome to its designated illuminated lectern.",
            "parMoves": 17,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 4,
                "c": 2
            },
            "books": [
                {
                    "id": "book-1-1",
                    "title": "Liber Herbalis",
                    "author": "Albertus Magnus",
                    "category": "alchemy",
                    "icon": "🌿",
                    "r": 3,
                    "c": 3,
                    "targetR": 1,
                    "targetC": 4
                },
                {
                    "id": "book-1-2",
                    "title": "De Sphaera",
                    "author": "Sacrobosco",
                    "category": "astronomy",
                    "icon": "✨",
                    "r": 3,
                    "c": 4,
                    "targetR": 1,
                    "targetC": 5
                }
            ],
            "targets": [
                {
                    "id": "target-1-1",
                    "name": "Herbalism Lectern",
                    "category": "alchemy",
                    "symbol": "🌿",
                    "runeLabel": "HERB",
                    "r": 1,
                    "c": 4
                },
                {
                    "id": "target-1-2",
                    "name": "Astrological Shelf",
                    "category": "astronomy",
                    "symbol": "✨",
                    "runeLabel": "ASTRO",
                    "r": 1,
                    "c": 5
                }
            ],
            "guardian": null
        },
        {
            "id": 2,
            "name": "Komnata II — Klenutá krypta manuskriptů",
            "name_en": "Chamber II — The Vault of Illuminated Manuscripts",
            "subtitle": "The grand archive hall of cloister scrolls",
            "desc": "Studený vzduch se mísí s vůní starého pergamenu. V této klenuté komnatě spočívají Hortus Sanitatis, Kosmova kronika a Biblia Sacra.",
            "desc_en": "Dust motes float in the candlelight. Three invaluable master treatises must be restored to the oak alcoves without blocking passages.",
            "parMoves": 47,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 5,
                "c": 2
            },
            "books": [
                {
                    "id": "book-2-1",
                    "title": "Hortus Sanitatis",
                    "author": "Petrus de Crescentiis",
                    "category": "botany",
                    "icon": "🌱",
                    "r": 3,
                    "c": 2,
                    "targetR": 1,
                    "targetC": 4
                },
                {
                    "id": "book-2-2",
                    "title": "Chronicon Bohemiae",
                    "author": "Cosmas Pragensis",
                    "category": "history",
                    "icon": "📜",
                    "r": 3,
                    "c": 5,
                    "targetR": 1,
                    "targetC": 5
                },
                {
                    "id": "book-2-3",
                    "title": "Biblia Sacra",
                    "author": "Scriba Hieronymus",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 4,
                    "c": 4,
                    "targetR": 1,
                    "targetC": 6
                }
            ],
            "targets": [
                {
                    "id": "target-2-1",
                    "name": "Botanical Shelf",
                    "category": "botany",
                    "symbol": "🌱",
                    "runeLabel": "BOTAN",
                    "r": 1,
                    "c": 4
                },
                {
                    "id": "target-2-2",
                    "name": "Bohemian Chronicle Rack",
                    "category": "history",
                    "symbol": "📜",
                    "runeLabel": "CHRON",
                    "r": 1,
                    "c": 5
                },
                {
                    "id": "target-2-3",
                    "name": "Theological Sanctuary",
                    "category": "theology",
                    "symbol": "🕊️",
                    "runeLabel": "THEOL",
                    "r": 1,
                    "c": 6
                }
            ],
            "guardian": null
        },
        {
            "id": 3,
            "name": "Komnata III — Svatyně hlavního kustoda",
            "name_en": "Chamber III — The Grand Custodian’s Sanctum",
            "subtitle": "The secret inner library of ancient wisdom",
            "desc": "Zde spočívají čtyři kardinální pilíře lidského poznání: Clavicula Salomonis, Ptolemaiův Almagest, Smaragdová deska a slavný Codex Gigas.",
            "desc_en": "Four cardinal pillars of human knowledge: Clavicula Salomonis, Almagest, Tabula Smaragdina, and Codex Gigas await their pedestals.",
            "parMoves": 34,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 4,
                "c": 4
            },
            "books": [
                {
                    "id": "book-3-1",
                    "title": "Clavicula Salomonis",
                    "author": "Hermes Trismegistus",
                    "category": "arcana",
                    "icon": "🔮",
                    "r": 3,
                    "c": 2,
                    "targetR": 1,
                    "targetC": 2
                },
                {
                    "id": "book-3-2",
                    "title": "Almagest Ptolemaei",
                    "author": "Claudius Ptolemaeus",
                    "category": "astronomy",
                    "icon": "✨",
                    "r": 3,
                    "c": 6,
                    "targetR": 1,
                    "targetC": 6
                },
                {
                    "id": "book-3-3",
                    "title": "Tabula Smaragdina",
                    "author": "Jabir ibn Hayyan",
                    "category": "alchemy",
                    "icon": "🌿",
                    "r": 5,
                    "c": 2,
                    "targetR": 6,
                    "targetC": 2
                },
                {
                    "id": "book-3-4",
                    "title": "Codex Gigas",
                    "author": "Herman the Recluse",
                    "category": "history",
                    "icon": "📜",
                    "r": 5,
                    "c": 6,
                    "targetR": 6,
                    "targetC": 6
                }
            ],
            "targets": [
                {
                    "id": "target-3-1",
                    "name": "Arcane Pedestal",
                    "category": "arcana",
                    "symbol": "🔮",
                    "runeLabel": "ARCAN",
                    "r": 1,
                    "c": 2
                },
                {
                    "id": "target-3-2",
                    "name": "Celestial Armillary Desk",
                    "category": "astronomy",
                    "symbol": "🌌",
                    "runeLabel": "CELEST",
                    "r": 1,
                    "c": 6
                },
                {
                    "id": "target-3-3",
                    "name": "Alchemical Alembic Shelf",
                    "category": "alchemy",
                    "symbol": "⚗️",
                    "runeLabel": "ALCHEM",
                    "r": 6,
                    "c": 2
                },
                {
                    "id": "target-3-4",
                    "name": "Imperial Codex Shrine",
                    "category": "history",
                    "symbol": "👑",
                    "runeLabel": "IMPER",
                    "r": 6,
                    "c": 6
                }
            ],
            "guardian": null
        },
        {
            "id": 4,
            "name": "Komnata IV — Kapitulní síň & Titivillus",
            "name_en": "Chamber IV — The Chapter Hall & Titivillus",
            "subtitle": "RPG Mechanics Awakened: The Demon of Scribal Errors",
            "desc": "V Kapitulní síni se ozývá cinkání kopyt a šustění pergamenu. Skřet Titivillus sbírá vynechaná slova mnichů. Roztřiďte svazky dříve, než vám ukradne písmena!",
            "desc_en": "The scribe demon Titivillus lurks in the Chapter Hall, collecting dropped syllables and slips of the pen. Restore order!",
            "parMoves": 30,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 5,
                "c": 1
            },
            "books": [
                {
                    "id": "book-4-1",
                    "title": "Regula Benedicti",
                    "author": "Benedictus de Nursia",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 4,
                    "c": 3,
                    "targetR": 1,
                    "targetC": 1
                },
                {
                    "id": "book-4-2",
                    "title": "Tractatus de Erroribus",
                    "author": "Johannes de Wallia",
                    "category": "history",
                    "icon": "📜",
                    "r": 3,
                    "c": 5,
                    "targetR": 1,
                    "targetC": 2
                },
                {
                    "id": "book-4-3",
                    "title": "De Titivillo Daemone",
                    "author": "Scriba Ignotus",
                    "category": "arcana",
                    "icon": "🔮",
                    "r": 2,
                    "c": 3,
                    "targetR": 4,
                    "targetC": 6
                }
            ],
            "targets": [
                {
                    "id": "target-4-1",
                    "name": "Benedictine Lectern",
                    "category": "theology",
                    "symbol": "✝️",
                    "runeLabel": "REGULA",
                    "r": 1,
                    "c": 1
                },
                {
                    "id": "target-4-2",
                    "name": "Erroribus Archive",
                    "category": "history",
                    "symbol": "📜",
                    "runeLabel": "TRACT",
                    "r": 1,
                    "c": 2
                },
                {
                    "id": "target-4-3",
                    "name": "Daemon Sigil Altar",
                    "category": "arcana",
                    "symbol": "🔮",
                    "runeLabel": "SIGIL",
                    "r": 4,
                    "c": 6
                }
            ],
            "guardian": {
                "icon": "🐐",
                "name": "Titivillus (Běs písařských chyb)",
                "name_en": "Titivillus",
                "quote": "„Každou vynechanou slabiku hodím do svého pytle!\""
            }
        },
        {
            "id": 5,
            "name": "Komnata V — Polední samota & Acedia",
            "name_en": "Chamber V — The Solitude of Noon & Acedia",
            "subtitle": "Daemon Meridianus: The Stifling Torpor of Midday",
            "desc": "Polední démon (Acedia) vysílá na mnichy těžkou lenost a malomyslnost. Uspořádejte teologické a botanické spisy, abyste zahnali pokušení poledního spánku.",
            "desc_en": "The midday demon Acedia brings spiritual weariness upon the brethren. Guard the sacred texts from sloth and decay.",
            "parMoves": 34,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 5,
                "c": 7
            },
            "books": [
                {
                    "id": "book-5-1",
                    "title": "De Acedia Monachorum",
                    "author": "Evagrius Ponticus",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 3,
                    "c": 3,
                    "targetR": 1,
                    "targetC": 1
                },
                {
                    "id": "book-5-2",
                    "title": "Collationes Patrum",
                    "author": "Johannes Cassianus",
                    "category": "botany",
                    "icon": "🌱",
                    "r": 3,
                    "c": 5,
                    "targetR": 1,
                    "targetC": 7
                },
                {
                    "id": "book-5-3",
                    "title": "Soliloquium de Anima",
                    "author": "Hugo de Sancto Victore",
                    "category": "history",
                    "icon": "📜",
                    "r": 4,
                    "c": 4,
                    "targetR": 5,
                    "targetC": 1
                }
            ],
            "targets": [
                {
                    "id": "target-5-1",
                    "name": "Patristic Pulpit",
                    "category": "theology",
                    "symbol": "🕊️",
                    "runeLabel": "PATRES",
                    "r": 1,
                    "c": 1
                },
                {
                    "id": "target-5-2",
                    "name": "Monastic Herbal Desk",
                    "category": "botany",
                    "symbol": "🌱",
                    "runeLabel": "MEDIC",
                    "r": 1,
                    "c": 7
                },
                {
                    "id": "target-5-3",
                    "name": "Soliloquy Lectern",
                    "category": "history",
                    "symbol": "📜",
                    "runeLabel": "ANIMA",
                    "r": 5,
                    "c": 1
                }
            ],
            "guardian": {
                "icon": "😴",
                "name": "Daemon meridianus (Acedia)",
                "name_en": "Daemon meridianus",
                "quote": "„Nač se modlit a třídit? Čas se zastavil a slunce nikdy nezajde...\""
            }
        },
        {
            "id": 6,
            "name": "Komnata VI — Chór šepotů (Zrcadlo sváru)",
            "name_en": "Chamber VI — The Choir of Whispers",
            "subtitle": "Titivillus Secunda Facies: The Demon of Gossiping Tongues",
            "desc": "Titivillus — druhá tvář zrcadlí vaše kroky v chodbách chóru. Každý krok musí být přesně vyměřen mezi lavicemi kůru.",
            "desc_en": "Whispering voices echo through the choir stalls. Move the liturgical tomes with divine precision.",
            "parMoves": 38,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 5,
                "c": 1
            },
            "books": [
                {
                    "id": "book-6-1",
                    "title": "Antiphonale Sarisburiense",
                    "author": "Chorus Monasticus",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 3,
                    "c": 2,
                    "targetR": 4,
                    "targetC": 1
                },
                {
                    "id": "book-6-2",
                    "title": "Speculum Laicorum",
                    "author": "Jacobus de Vitriaco",
                    "category": "arcana",
                    "icon": "🔮",
                    "r": 3,
                    "c": 4,
                    "targetR": 2,
                    "targetC": 5
                },
                {
                    "id": "book-6-3",
                    "title": "Graduale Romanum",
                    "author": "Cantor Guido",
                    "category": "history",
                    "icon": "📜",
                    "r": 4,
                    "c": 3,
                    "targetR": 5,
                    "targetC": 4
                }
            ],
            "targets": [
                {
                    "id": "target-6-1",
                    "name": "Antiphonal Desk",
                    "category": "theology",
                    "symbol": "🎶",
                    "runeLabel": "CANTUS",
                    "r": 4,
                    "c": 1
                },
                {
                    "id": "target-6-2",
                    "name": "Mirror Altar",
                    "category": "arcana",
                    "symbol": "🔮",
                    "runeLabel": "SPECUL",
                    "r": 2,
                    "c": 5
                },
                {
                    "id": "target-6-3",
                    "name": "Choir Rack",
                    "category": "history",
                    "symbol": "📜",
                    "runeLabel": "GRADU",
                    "r": 5,
                    "c": 4
                }
            ],
            "guardian": {
                "icon": "👂",
                "name": "Titivillus — druhá tvář (Běs klevet)",
                "name_en": "Titivillus — druhá tvář",
                "quote": "„Slyším každé slovo, které jste si šeptali za zády opata...\""
            }
        },
        {
            "id": 7,
            "name": "Komnata VII — Krypta hniloby & Belzebub",
            "name_en": "Chamber VII — The Vault of Rot & Belzebub",
            "subtitle": "Lord of the Flies: Decay, Flies and Pestilence",
            "desc": "Belzebub krouží se svým rojem much po starých sklepních skladech. Manuskripty o alchymii a pohřbívání musí být uloženy do bezpečí.",
            "desc_en": "Beelzebub and his swarm descend upon the cellar archives. Purify the vault with ancient alchemical treatises.",
            "parMoves": 40,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 5,
                "c": 4
            },
            "books": [
                {
                    "id": "book-7-1",
                    "title": "Physiologus de Putredine",
                    "author": "Epiphanius",
                    "category": "alchemy",
                    "icon": "🌿",
                    "r": 2,
                    "c": 3,
                    "targetR": 1,
                    "targetC": 1
                },
                {
                    "id": "book-7-2",
                    "title": "Malleus Maleficarum",
                    "author": "Heinrich Kramer",
                    "category": "arcana",
                    "icon": "🔮",
                    "r": 2,
                    "c": 5,
                    "targetR": 1,
                    "targetC": 7
                },
                {
                    "id": "book-7-3",
                    "title": "De Contemptu Mundi",
                    "author": "Innocentius III",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 4,
                    "c": 3,
                    "targetR": 4,
                    "targetC": 1
                },
                {
                    "id": "book-7-4",
                    "title": "De Arte Moriendi",
                    "author": "Johannes Gerson",
                    "category": "history",
                    "icon": "📜",
                    "r": 4,
                    "c": 5,
                    "targetR": 4,
                    "targetC": 7
                }
            ],
            "targets": [
                {
                    "id": "target-7-1",
                    "name": "Alembic of Cleansing",
                    "category": "alchemy",
                    "symbol": "⚗️",
                    "runeLabel": "CLEAN",
                    "r": 1,
                    "c": 1
                },
                {
                    "id": "target-7-2",
                    "name": "Hex-Warded Sanctum",
                    "category": "arcana",
                    "symbol": "🔮",
                    "runeLabel": "HEX",
                    "r": 1,
                    "c": 7
                },
                {
                    "id": "target-7-3",
                    "name": "Contemptu Shrine",
                    "category": "theology",
                    "symbol": "🕊️",
                    "runeLabel": "MUNDI",
                    "r": 4,
                    "c": 1
                },
                {
                    "id": "target-7-4",
                    "name": "Memento Mori Lectern",
                    "category": "history",
                    "symbol": "💀",
                    "runeLabel": "MORI",
                    "r": 4,
                    "c": 7
                }
            ],
            "guardian": {
                "icon": "🪰",
                "name": "Belzebub (Pán much)",
                "name_en": "Belzebub",
                "quote": "„Bzzzz... Kde hnije pergamen, tam vládnu já!\""
            }
        },
        {
            "id": 8,
            "name": "Komnata VIII — Kostelní hřbitov & Kostelní grim",
            "name_en": "Chamber VIII — The Churchyard of Silence & Church Grim",
            "subtitle": "The Spectral Black Dog: Faithful Guardian of Hallowed Soil",
            "desc": "Kostelní grim (věrný strážný pes) střeží hřbitovní bránu a posvátný první hrob. Uctěte legendy a životy svatých otců.",
            "desc_en": "The Church Grim keeps vigil by the ancient cemetery. Lay the Martyrologies and Golden Legend upon the blessed shrines.",
            "parMoves": 46,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 5,
                "c": 4
            },
            "books": [
                {
                    "id": "book-8-1",
                    "title": "Vitae Patrum",
                    "author": "Hieronymus",
                    "category": "history",
                    "icon": "📜",
                    "r": 3,
                    "c": 2,
                    "targetR": 1,
                    "targetC": 1
                },
                {
                    "id": "book-8-2",
                    "title": "Legenda Aurea",
                    "author": "Jacobus de Voragine",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 3,
                    "c": 6,
                    "targetR": 1,
                    "targetC": 7
                },
                {
                    "id": "book-8-3",
                    "title": "Martyrologium Romanum",
                    "author": "Beda Venerabilis",
                    "category": "history",
                    "icon": "📜",
                    "r": 4,
                    "c": 3,
                    "targetR": 5,
                    "targetC": 1
                },
                {
                    "id": "book-8-4",
                    "title": "Liber Confraternitatis",
                    "author": "Monachi Cluniacenses",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 4,
                    "c": 5,
                    "targetR": 5,
                    "targetC": 7
                }
            ],
            "targets": [
                {
                    "id": "target-8-1",
                    "name": "Patrum Sepulchre",
                    "category": "history",
                    "symbol": "📜",
                    "runeLabel": "PATRUM",
                    "r": 1,
                    "c": 1
                },
                {
                    "id": "target-8-2",
                    "name": "Golden Legend Altar",
                    "category": "theology",
                    "symbol": "⭐",
                    "runeLabel": "AUREA",
                    "r": 1,
                    "c": 7
                },
                {
                    "id": "target-8-3",
                    "name": "Martyr Tomb Pedestal",
                    "category": "history",
                    "symbol": "🕊️",
                    "runeLabel": "MARTYR",
                    "r": 5,
                    "c": 1
                },
                {
                    "id": "target-8-4",
                    "name": "Confraternity Shrine",
                    "category": "theology",
                    "symbol": "✝️",
                    "runeLabel": "FRATRES",
                    "r": 5,
                    "c": 7
                }
            ],
            "guardian": {
                "icon": "🐕‍🦺",
                "name": "Church Grim (Kostelní grim)",
                "name_en": "Church Grim",
                "quote": "„Střežím tuto půdu od prvního pohřbu. Zlým duchům vstup zakázán.\""
            }
        },
        {
            "id": 9,
            "name": "Komnata IX — Katakomby mučedníků & Umrlci",
            "name_en": "Chamber IX — The Catacombs of Martyrs & Revenants",
            "subtitle": "The Restless Dead: Shambling Horrors of Neglected Tombs",
            "desc": "Dva nemrtví kráčejí chodbami starobylých katakomb. Pečlivě se vyhněte stínům a navraťte spisy o věčném životě na oltáře.",
            "desc_en": "Shambling revenants wander through the forgotten ossuary. Safely navigate the codices of resurrection to holy ground.",
            "parMoves": 52,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 3,
                "c": 1
            },
            "books": [
                {
                    "id": "book-9-1",
                    "title": "Ars Bene Moriendi",
                    "author": "Matthaeus de Cracovia",
                    "category": "arcana",
                    "icon": "🔮",
                    "r": 2,
                    "c": 3,
                    "targetR": 1,
                    "targetC": 1
                },
                {
                    "id": "book-9-2",
                    "title": "Dialogi Gregorii",
                    "author": "Gregorius Magnus",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 2,
                    "c": 4,
                    "targetR": 1,
                    "targetC": 6
                },
                {
                    "id": "book-9-3",
                    "title": "Danse Macabre",
                    "author": "Johannes Lydgate",
                    "category": "history",
                    "icon": "📜",
                    "r": 4,
                    "c": 3,
                    "targetR": 5,
                    "targetC": 1
                },
                {
                    "id": "book-9-4",
                    "title": "De Resurrectione",
                    "author": "Thomas Aquinas",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 4,
                    "c": 4,
                    "targetR": 5,
                    "targetC": 6
                }
            ],
            "targets": [
                {
                    "id": "target-9-1",
                    "name": "Ars Moriendi Lectern",
                    "category": "arcana",
                    "symbol": "💀",
                    "runeLabel": "ARS_MOR",
                    "r": 1,
                    "c": 1
                },
                {
                    "id": "target-9-2",
                    "name": "Gregorian Dialogues Altar",
                    "category": "theology",
                    "symbol": "🕊️",
                    "runeLabel": "GREGOR",
                    "r": 1,
                    "c": 6
                },
                {
                    "id": "target-9-3",
                    "name": "Danse Macabre Shrine",
                    "category": "history",
                    "symbol": "🎻",
                    "runeLabel": "MACABR",
                    "r": 5,
                    "c": 1
                },
                {
                    "id": "target-9-4",
                    "name": "Resurrectio Pedestal",
                    "category": "theology",
                    "symbol": "✝️",
                    "runeLabel": "RESURR",
                    "r": 5,
                    "c": 6
                }
            ],
            "guardian": {
                "icon": "🧟",
                "name": "Revenant (Severní chodba)",
                "name_en": "Revenant (Severní mnich)",
                "quote": "„Hrob bez modlitby je otevřená brána do noci...\""
            }
        },
        {
            "id": 10,
            "name": "Komnata X — Velká drolerie & Marginalie",
            "name_en": "Chamber X — The Grand Drolerie Chamber & Marginalia",
            "subtitle": "The Scriptor’s Exhaustion: Giant Snail & The Demons of Distraction",
            "desc": "Finální mistrovská zkouška! Vražedný šnek z okrajů iluminací, Titivillus i Belzebub se spojili v jedné síni. Uspořádejte pět vrcholných svazků moudrosti!",
            "desc_en": "The ultimate ordeal! The Marginalia snail and cloister fiends emerge from illuminated borders. Arrange all five grand master codices!",
            "parMoves": 56,
            "grid": [
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall",
                    "wall",
                    "floor",
                    "floor",
                    "floor",
                    "wall"
                ],
                [
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall",
                    "wall"
                ]
            ],
            "playerStart": {
                "r": 5,
                "c": 5
            },
            "books": [
                {
                    "id": "book-10-1",
                    "title": "Opus Majus",
                    "author": "Rogerus Bacon",
                    "category": "arcana",
                    "icon": "🔮",
                    "r": 2,
                    "c": 3,
                    "targetR": 1,
                    "targetC": 1
                },
                {
                    "id": "book-10-2",
                    "title": "Cosmographia Magna",
                    "author": "Claudius Ptolemaeus",
                    "category": "astronomy",
                    "icon": "✨",
                    "r": 2,
                    "c": 6,
                    "targetR": 1,
                    "targetC": 8
                },
                {
                    "id": "book-10-3",
                    "title": "Theologia Mystica",
                    "author": "Dionysius Areopagita",
                    "category": "theology",
                    "icon": "🕊️",
                    "r": 3,
                    "c": 5,
                    "targetR": 3,
                    "targetC": 1
                },
                {
                    "id": "book-10-4",
                    "title": "Liber Aureus",
                    "author": "Hermes Trismegistus",
                    "category": "alchemy",
                    "icon": "🌿",
                    "r": 4,
                    "c": 3,
                    "targetR": 5,
                    "targetC": 1
                },
                {
                    "id": "book-10-5",
                    "title": "Bestiarium Divinum",
                    "author": "Hugo de Folieto",
                    "category": "history",
                    "icon": "📜",
                    "r": 4,
                    "c": 6,
                    "targetR": 5,
                    "targetC": 8
                }
            ],
            "targets": [
                {
                    "id": "target-10-1",
                    "name": "Opus Majus Throne",
                    "category": "arcana",
                    "symbol": "🔮",
                    "runeLabel": "BACON",
                    "r": 1,
                    "c": 1
                },
                {
                    "id": "target-10-2",
                    "name": "Cosmographia Pedestal",
                    "category": "astronomy",
                    "symbol": "🌌",
                    "runeLabel": "COSMO",
                    "r": 1,
                    "c": 8
                },
                {
                    "id": "target-10-3",
                    "name": "Mystica Central Altar",
                    "category": "theology",
                    "symbol": "🕊️",
                    "runeLabel": "MYSTIC",
                    "r": 3,
                    "c": 1
                },
                {
                    "id": "target-10-4",
                    "name": "Aureus Shrine",
                    "category": "alchemy",
                    "symbol": "⚗️",
                    "runeLabel": "AUREUS",
                    "r": 5,
                    "c": 1
                },
                {
                    "id": "target-10-5",
                    "name": "Bestiarium Vault",
                    "category": "history",
                    "symbol": "🐉",
                    "runeLabel": "BESTIA",
                    "r": 5,
                    "c": 8
                }
            ],
            "guardian": {
                "icon": "🐌",
                "name": "Marginalie (Bojový šnek s ulitou)",
                "name_en": "Marginalie (Vražedný šnek)",
                "quote": "„Rytíř v plné zbroji se třese před mou ulitou!\""
            }
        }
    ],

    // ── Spuštění hry ──────────────────────────────────────────────────────────
    start: function (lvlIdx) {
        // Kontrola inventáře podle zvyklostí Scriptorium
        if (typeof GameState !== 'undefined' && GameState.inventory) {
            if (!GameState.inventory.sokoban_scroll || GameState.inventory.sokoban_scroll < 1) {
                if (typeof UI !== 'undefined' && UI.notify) {
                    const msg = typeof t === 'function' ? t('games.sokobanNeedScroll') : 'Nemáš Knihovní plán (sokoban_scroll)!';
                    UI.notify(msg, true);
                } else if (typeof alert !== 'undefined') {
                    alert('Nemáš Knihovní plán (sokoban_scroll)!');
                }
                return;
            }
        }

        // Načíst postup hráče
        this.loadProgress();

        let targetIdx = 0;
        if (typeof lvlIdx === 'number') {
            targetIdx = Math.max(0, Math.min(lvlIdx, this.levels.length - 1));
        } else {
            targetIdx = Math.min(this.maxUnlocked, this.levels.length - 1);
        }

        this.gameActive = true;
        this.loadLevel(targetIdx);
        this.bindKeyboard();
        this.render();
    },

    loadProgress: function () {
        try {
            if (typeof GameState !== 'undefined' && typeof GameState.sokobanMaxUnlocked === 'number') {
                this.maxUnlocked = GameState.sokobanMaxUnlocked;
            } else if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('scriptorium_sokoban_unlocked_v1');
                if (saved) this.maxUnlocked = parseInt(saved, 10) || 0;
            }
            if (typeof localStorage !== 'undefined') {
                const savedComp = localStorage.getItem('scriptorium_sokoban_completed_v1');
                if (savedComp) this.completedLevels = JSON.parse(savedComp) || [];
            }
        } catch (e) {
            this.maxUnlocked = 0;
            this.completedLevels = [];
        }
    },

    saveProgress: function () {
        try {
            if (typeof GameState !== 'undefined') {
                GameState.sokobanMaxUnlocked = Math.max(GameState.sokobanMaxUnlocked || 0, this.maxUnlocked);
            }
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('scriptorium_sokoban_unlocked_v1', this.maxUnlocked.toString());
                localStorage.setItem('scriptorium_sokoban_completed_v1', JSON.stringify(this.completedLevels));
            }
        } catch (e) { }
    },

    loadLevel: function (lvlIdx) {
        this.currentLevel = Math.max(0, Math.min(lvlIdx, this.levels.length - 1));
        const lvl = this.levels[this.currentLevel];
        this.playerPos = { ...lvl.playerStart };
        this.playerDir = 'down';
        this.books = lvl.books.map(b => ({ ...b }));
        this.moves = 0;
        this.pushes = 0;
        this.history = [];
        this.victoryModal = false;
    },

    // ── Zvukové efekty (AudioSys & Web Audio API fallback) ────────────────────
    playSfx: function (type) {
        if (typeof AudioSys !== 'undefined' && AudioSys.play) {
            try {
                if (type === 'step') AudioSys.play('step');
                else if (type === 'push') AudioSys.play('book');
                else if (type === 'placed') (AudioSys.play('chime') || AudioSys.play('success'));
                else if (type === 'win') (AudioSys.play('success') || AudioSys.play('level_up'));
                return;
            } catch (e) { }
        }

        try {
            if (typeof window === 'undefined') return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            if (!this._audioCtx) this._audioCtx = new AudioContext();
            const ac = this._audioCtx;
            if (ac.state === 'suspended') ac.resume();

            const now = ac.currentTime;
            if (type === 'step') {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.07);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.07);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(now);
                osc.stop(now + 0.07);
            } else if (type === 'push') {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
                gain.gain.setValueAtTime(0.09, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'placed') {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.09);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'win') {
                [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
                    const osc = ac.createOscillator();
                    const gain = ac.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.1);
                    gain.gain.setValueAtTime(0.12, now + i * 0.1);
                    gain.gain.linearRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.35);
                });
            }
        } catch (e) { }
    },

    // ── Pohyb mnicha & Tlačení knih ───────────────────────────────────────────
    move: function (dir) {
        if (!this.gameActive || this.victoryModal) return;

        let dr = 0, dc = 0;
        if (dir === 'up') dr = -1;
        if (dir === 'down') dr = 1;
        if (dir === 'left') dc = -1;
        if (dir === 'right') dc = 1;

        this.playerDir = dir;

        const nextR = this.playerPos.r + dr;
        const nextC = this.playerPos.c + dc;
        const lvl = this.levels[this.currentLevel];
        const grid = lvl.grid;

        // Kontrola hranic
        if (nextR < 0 || nextR >= grid.length || nextC < 0 || nextC >= grid[0].length) return;

        // Zeď nebo sloup před mnichem
        if (grid[nextR][nextC] === 'wall' || grid[nextR][nextC] === 'pillar') return;

        // Je na cílovém poli kniha?
        const bookIndex = this.books.findIndex(b => b.r === nextR && b.c === nextC);

        if (bookIndex !== -1) {
            // Pokus o potlačení knihy (TLAČIT, NIKOLI TÁHNOUT)
            const pushR = nextR + dr;
            const pushC = nextC + dc;

            // Kontrola hranic pro knihu
            if (pushR < 0 || pushR >= grid.length || pushC < 0 || pushC >= grid[0].length) return;

            // Zeď za knihou
            if (grid[pushR][pushC] === 'wall' || grid[pushR][pushC] === 'pillar') return;

            // Jiná kniha za touto knihou (dvě knihy za sebou nelze tlačit)
            const isBlockedByBook = this.books.some(b => b.r === pushR && b.c === pushC);
            if (isBlockedByBook) return;

            // Ulož stav pro Zpět (Undo)
            this.history.push({
                playerPos: { ...this.playerPos },
                playerDir: this.playerDir,
                books: this.books.map(b => ({ ...b })),
                moves: this.moves,
                pushes: this.pushes
            });

            // Posun knihy i hráče
            this.books[bookIndex].r = pushR;
            this.books[bookIndex].c = pushC;
            this.playerPos = { r: nextR, c: nextC };
            this.moves++;
            this.pushes++;

            // Zvukový feedback
            const pushedBook = this.books[bookIndex];
            const onTarget = lvl.targets.some(t => t.r === pushR && t.c === pushC && (t.category === pushedBook.category || !t.category));
            if (onTarget) {
                this.playSfx('placed');
            } else {
                this.playSfx('push');
            }

            this.checkWin();
        } else {
            // Pouhý krok hráče
            this.history.push({
                playerPos: { ...this.playerPos },
                playerDir: this.playerDir,
                books: this.books.map(b => ({ ...b })),
                moves: this.moves,
                pushes: this.pushes
            });

            this.playerPos = { r: nextR, c: nextC };
            this.moves++;
            this.playSfx('step');
        }

        this.render();
    },

    // ── Návrat tahu (Undo) ───────────────────────────────────────────────────
    undo: function () {
        if (!this.gameActive || this.victoryModal || this.history.length === 0) return;
        const prev = this.history.pop();
        this.playerPos = prev.playerPos;
        this.playerDir = prev.playerDir;
        this.books = prev.books;
        this.moves = prev.moves;
        this.pushes = prev.pushes;
        this.playSfx('step');
        this.render();
    },

    // ── Restart komnaty ──────────────────────────────────────────────────────
    reset: function () {
        if (!this.gameActive) return;
        this.loadLevel(this.currentLevel);
        this.render();
    },

    // ── Kontrola vítězství v komnatě ──────────────────────────────────────────
    checkWin: function () {
        const lvl = this.levels[this.currentLevel];
        const allPlaced = this.books.every(b => {
            return lvl.targets.some(t => t.r === b.r && t.c === b.c && (t.category === b.category || !t.category));
        });

        if (allPlaced) {
            setTimeout(() => {
                this.onLevelComplete();
            }, 250);
        }
    },

    onLevelComplete: function () {
        this.victoryModal = true;
        this.playSfx('win');

        // Postup v odemčení
        if (!this.completedLevels.includes(this.currentLevel)) {
            this.completedLevels.push(this.currentLevel);
        }
        if (this.currentLevel + 1 < this.levels.length) {
            this.maxUnlocked = Math.max(this.maxUnlocked, this.currentLevel + 1);
        }
        this.saveProgress();

        // Vigor regenerace podle Scriptorium standardu
        if (typeof VigorSystem !== 'undefined') {
            if (typeof VigorSystem.restFromPlay === 'function') {
                VigorSystem.restFromPlay();
            } else if (typeof VigorSystem.add === 'function') {
                VigorSystem.add(15);
            }
        }

        // Zápisky a lore do GameState
        const rewardNotes = 15 + this.currentLevel * 2;
        if (typeof GameState !== 'undefined') {
            GameState.notes = (GameState.notes || 0) + rewardNotes;
            if (typeof GameState.addResource === 'function') {
                GameState.addResource('notes', rewardNotes);
            }
            if (typeof UI !== 'undefined' && UI.notify) {
                const msg = typeof t === 'function' ? t('games.sokobanWon') : 'Komnata uspořádána!';
                UI.notify('📚 ' + msg + ' (+' + rewardNotes + ' Zápisků)');
            }
        }

        this.render();
    },

    nextLevel: function () {
        this.victoryModal = false;
        if (this.currentLevel < this.levels.length - 1) {
            this.loadLevel(this.currentLevel + 1);
            this.render();
        } else {
            this.loadLevel(0);
            this.render();
        }
    },

    // ── Klávesové ovládání ────────────────────────────────────────────────────
    bindKeyboard: function () {
        if (this.keyboardBound) return;
        this.keyboardBound = true;
        this._keyHandler = (e) => {
            if (!this.gameActive) return;

            // Zákaz scrollování stránky šipkami při hře
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }

            if (this.victoryModal) {
                if (e.code === 'Enter' || e.code === 'Space') {
                    this.nextLevel();
                } else if (e.code === 'Escape') {
                    this.close();
                }
                return;
            }

            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.move('up');
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.move('down');
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.move('left');
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.move('right');
                    break;
                case 'KeyZ':
                    this.undo();
                    break;
                case 'KeyR':
                    this.reset();
                    break;
                case 'Escape':
                    this.close();
                    break;
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this._keyHandler);
        }
    },

    unbindKeyboard: function () {
        if (this.keyboardBound && this._keyHandler && typeof window !== 'undefined') {
            window.removeEventListener('keydown', this._keyHandler);
            this.keyboardBound = false;
        }
    },

    // ── Vykreslení modálního okna Scriptorium ─────────────────────────────────
    render: function () {
        if (typeof document === 'undefined') return;

        let modal = document.getElementById('sokoban-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sokoban-modal';
            modal.className = 'game-modal';
            modal.innerHTML = `
                <div class="game-modal-content" style="max-width: 740px; width: 95%; max-height: 94vh; overflow-y: auto; padding: 16px 20px; background: var(--bg-card, #f4ecd6); color: var(--ink-primary, #2c1a0e); border: 3px solid var(--accent-gold, #c5a059); border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.55); font-family: 'Cormorant Garamond', Georgia, serif; position: relative;">
                    <button class="game-modal-close" onclick="SokobanGame.close()" style="position: absolute; top: 12px; right: 14px; background: transparent; border: none; font-size: 26px; cursor: pointer; color: var(--accent-wax, #8b3a2b); font-weight: bold; line-height: 1;">×</button>
                    <div id="sokoban-game-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) SokobanGame.close();
            });
        }

        const container = document.getElementById('sokoban-game-content');
        if (!container) return;

        const lvl = this.levels[this.currentLevel];
        const grid = lvl.grid;
        const romanNums = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

        // Spočítat umístěné knihy
        let placedCount = 0;
        this.books.forEach(b => {
            if (lvl.targets.some(t => t.r === b.r && t.c === b.c && (t.category === b.category || !t.category))) {
                placedCount++;
            }
        });

        // Vypočet adaptivní velikosti buňky pro responzivní zobrazení
        const cols = grid[0].length;
        const rows = grid.length;
        const availWidth = Math.min(600, (typeof window !== 'undefined' ? window.innerWidth - 60 : 540));
        const cellSize = Math.max(28, Math.min(42, Math.floor(availWidth / Math.max(cols, 8))));

        let h = '<div>';

        // Hlavička komnaty
        h += `
            <div style="text-align: center; margin-bottom: 8px; padding-right: 24px;">
                <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--accent-gold, #c5a059); font-weight: bold;">
                    Aula Ludi • Ars Bibliothecae
                </div>
                <h2 style="font-family: 'Cinzel', serif, Georgia; margin: 2px 0 4px 0; font-size: 1.35rem; color: var(--ink-primary, #2c1a0e); line-height: 1.2;">
                    ${lvl.name}
                </h2>
                <div style="font-size: 0.85rem; opacity: 0.85; max-width: 580px; margin: 0 auto; line-height: 1.35; font-style: italic;">
                    ${lvl.desc}
                </div>
            </div>
        `;

        // Výběr všech 10 komnat (Chambers I — X)
        h += '<div style="display:flex; justify-content:center; gap:4px; margin: 8px 0 10px 0; flex-wrap:wrap;">';
        this.levels.forEach((l, idx) => {
            const isCur = idx === this.currentLevel;
            const isUnlocked = idx <= this.maxUnlocked;
            const isDone = this.completedLevels.includes(idx);

            let bg = 'rgba(0,0,0,0.06)';
            let borderColor = 'rgba(197,160,89,0.3)';
            let color = 'var(--ink-primary, #2c1a0e)';

            if (isCur) {
                bg = 'var(--accent-gold, #c5a059)';
                borderColor = '#91712a';
                color = '#fff';
            } else if (isDone) {
                borderColor = 'var(--accent-gold, #c5a059)';
            }

            let badge = '';
            if (isDone) badge = '★';
            else if (!isUnlocked) badge = '🔒';

            const disabled = !isUnlocked
                ? 'disabled style="opacity:0.4; cursor:not-allowed; padding: 4px 7px; font-size: 0.75rem; border-radius: 4px;"'
                : ('onclick="SokobanGame.loadLevel(' + idx + '); SokobanGame.render();" style="padding: 4px 7px; font-size: 0.75rem; border-radius: 4px; background:' + bg + '; border: 1px solid ' + borderColor + '; color:' + color + '; font-weight: ' + (isCur ? 'bold' : 'normal') + '; cursor:pointer;"');

            h += '<button class="craft-btn" ' + disabled + ' title="' + l.name + '">' + romanNums[idx] + ' ' + badge + '</button>';
        });
        h += '</div>';

        // Lišta stavu (Knihy na pultech, Tahy, Par, Strážce)
        h += `
            <div style="display:flex; justify-content:space-around; align-items:center; background: rgba(0,0,0,0.05); border: 1px solid rgba(197,160,89,0.3); border-radius: 6px; padding: 6px 12px; margin-bottom: 8px; font-size: 0.85rem;">
                <div>📚 Pulty: <strong>${placedCount}/${this.books.length}</strong></div>
                <div>👣 Tahy: <strong>${this.moves}</strong> <span style="opacity:0.65;">(Par: ${lvl.parMoves})</span></div>
                <div>📦 Zátěž: <strong>${this.pushes}</strong></div>
                ${lvl.guardian ? ('<div title="' + lvl.guardian.name + ': ' + lvl.guardian.quote + '" style="cursor:help;">👾 ' + lvl.guardian.icon + ' <span style="font-size:0.75rem; opacity:0.8;">' + lvl.guardian.name.split(' ')[0] + '</span></div>') : ''}
            </div>
        `;

        // Hrací deska + D-Pad — responzivní (PC: vedle sebe, mobil: pod sebou)
        h += `<div class="sokoban-playarea">`;
        h += `
                <div style="display:inline-grid; grid-template-columns: repeat(${cols}, ${cellSize}px); grid-template-rows: repeat(${rows}, ${cellSize}px); gap: 2px; padding: 8px; background: rgba(0,0,0,0.1); border: 2px solid var(--accent-gold, #c5a059); border-radius: 8px; box-shadow: inset 0 0 10px rgba(0,0,0,0.2);">
        `;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                const isWall = cell === 'wall' || cell === 'pillar';
                const isPlayer = this.playerPos.r === r && this.playerPos.c === c;
                const book = this.books.find(b => b.r === r && b.c === c);
                const target = lvl.targets.find(t => t.r === r && t.c === c);

                let bg = 'rgba(255,255,255,0.45)';
                let border = '1px solid rgba(197,160,89,0.25)';
                let content = '';

                if (isWall) {
                    bg = 'linear-gradient(135deg, #382717, #22160d)';
                    border = '1px solid #140d07';
                    content = '<span style="font-size:14px; opacity:0.35;">🧱</span>';
                } else if (target && !book && !isPlayer) {
                    bg = 'rgba(197,160,89,0.22)';
                    border = '2px dashed var(--accent-gold, #c5a059)';
                    content = `<span style="font-size:${Math.round(cellSize * 0.45)}px; opacity:0.9;" title="${target.name}">${target.symbol}</span>`;
                }

                if (book) {
                    const onTarget = target && (target.category === book.category || !target.category);
                    const bookBg = onTarget
                        ? 'linear-gradient(135deg, #2e7d32, #1b5e20)'
                        : 'linear-gradient(135deg, #8a3324, #5a1c12)';
                    const bookBorder = onTarget ? '#4ade80' : '#f59e0b';
                    const bookGlow = onTarget ? 'box-shadow: 0 0 8px #4ade80;' : 'box-shadow: 0 2px 5px rgba(0,0,0,0.3);';

                    content = `
                        <div style="width:${cellSize - 6}px; height:${cellSize - 6}px; background:${bookBg}; border:1.5px solid ${bookBorder}; border-radius:5px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:${Math.round(cellSize * 0.45)}px; ${bookGlow}" title="${book.title} (${book.author || ''})">
                            ${book.icon || '📖'}
                        </div>
                    `;
                } else if (isPlayer) {
                    content = `
                        <div style="width:${cellSize - 6}px; height:${cellSize - 6}px; background:linear-gradient(135deg, #d97706, #b45309); border:1.5px solid #fef3c7; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px #f59e0b; font-size:${Math.round(cellSize * 0.48)}px;">
                            🧙‍♂️
                        </div>
                    `;
                }

                h += `
                    <div style="width:${cellSize}px; height:${cellSize}px; background:${bg}; border:${border}; border-radius:4px; display:flex; align-items:center; justify-content:center; position:relative;">
                        ${content}
                    </div>
                `;
            }
        }

        h += '</div>'; // konec mřížky

        // Dotykový/klikací D-Pad — PC: vedle desky (větší), mobil: pod deskou
        h += `
            <div class="sokoban-dpad">
                <div></div>
                <button class="craft-btn sokoban-dpad-btn" onclick="SokobanGame.move('up')">▲</button>
                <div></div>
                <button class="craft-btn sokoban-dpad-btn" onclick="SokobanGame.move('left')">◀</button>
                <button class="craft-btn sokoban-dpad-btn" onclick="SokobanGame.move('down')">▼</button>
                <button class="craft-btn sokoban-dpad-btn" onclick="SokobanGame.move('right')">▶</button>
            </div>
        `;
        h += '</div>'; // konec .sokoban-playarea

        // Tlačítka ovládání — vždy pod hrací plochou i D-Padem
        h += `
            <div class="sokoban-actions">
                <button class="craft-btn" onclick="SokobanGame.undo()" style="background:var(--accent-gold, #c5a059); padding:5px 10px; font-size:0.8rem;">↩️ Zpět (Z)</button>
                <button class="craft-btn" onclick="SokobanGame.reset()" style="background:var(--accent-wax, #8b3a2b); padding:5px 10px; font-size:0.8rem;">🔄 Restart (R)</button>
                <button class="craft-btn" onclick="SokobanGame.showRules()" style="padding:5px 10px; font-size:0.8rem;">📜 Pravidla</button>
            </div>
            <div style="font-size:0.72rem; opacity:0.65; margin-top:6px; text-align:center;">
                Ovládání: Šipky / WASD • Krok zpět: Z • Restart: R • Klášterní kodexy lze pouze TLAČIT!
            </div>
        `;

        // Victory Dialog uvnitř modálu (místo rušivého alert / confirm)
        if (this.victoryModal) {
            const isLast = this.currentLevel === this.levels.length - 1;
            const stars = this.moves <= lvl.parMoves ? '★★★ (Excelentní par)' : (this.moves <= lvl.parMoves * 1.4 ? '★★☆ (Chvályhodné)' : '★☆☆ (Splněno)');

            h += `
                <div style="position: absolute; inset: 0; background: rgba(20, 14, 10, 0.85); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 10; border-radius: 12px;">
                    <div style="background: var(--bg-card, #f4ecd6); border: 3px solid var(--accent-gold, #c5a059); border-radius: 10px; padding: 20px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.6);">
                        <div style="font-size: 38px; margin-bottom: 6px;">${isLast ? '👑' : '🏆'}</div>
                        <h3 style="font-family: 'Cinzel', serif; margin: 0 0 6px 0; color: var(--ink-primary, #2c1a0e); font-size: 1.3rem;">
                            ${isLast ? 'Mistr Skriptoria dokonal dílo!' : 'Komnata úspěšně uspořádána!'}
                        </h3>
                        <p style="font-size: 0.88rem; opacity: 0.9; margin: 0 0 12px 0;">
                            ${isLast ? 'Všech 10 komnat klášterní knihovny září vzorným řádem. Staré rukopisy i vzácné herbáře spočívají na posvátných pultech.' : 'Všechny vzácné svazky této komnaty byly uloženy na své čtecí pulty.'}
                        </p>
                        <div style="background: rgba(0,0,0,0.06); padding: 8px; border-radius: 6px; font-size: 0.82rem; margin-bottom: 14px; text-align: left;">
                            <div>👣 Dokončeno na: <strong>${this.moves} tahů</strong> (Par: ${lvl.parMoves})</div>
                            <div>📦 Přemístění: <strong>${this.pushes} potlačení</strong></div>
                            <div>⭐ Ocenění: <strong>${stars}</strong></div>
                            <div>🌿 Zisk: <strong>+${15 + this.currentLevel * 2} Zápisků</strong> a plné zotavení mnicha (Vigor)</div>
                        </div>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="craft-btn" onclick="SokobanGame.reset()" style="padding: 7px 14px; font-size: 0.85rem; background: rgba(0,0,0,0.1);">🔄 Znovu</button>
                            <button class="craft-btn" onclick="SokobanGame.nextLevel()" style="padding: 7px 16px; font-size: 0.85rem; background: var(--accent-gold, #c5a059); font-weight: bold;">
                                ${isLast ? 'Znovu od I. komnaty ➔' : 'Další komnata ➔'}
                            </button>
                            <button class="craft-btn" onclick="SokobanGame.close()" style="padding: 7px 12px; font-size: 0.85rem;">Zavřít</button>
                        </div>
                    </div>
                </div>
            `;
        }

        h += '</div>';
        container.innerHTML = h;
    },

    // ── Zavření modálu ────────────────────────────────────────────────────────
    close: function () {
        this.gameActive = false;
        this.victoryModal = false;
        this.unbindKeyboard();
        if (typeof document !== 'undefined') {
            const modal = document.getElementById('sokoban-modal');
            if (modal) modal.remove();
        }
    },

    // ── Okno s pravidly ───────────────────────────────────────────────────────
    showRules: function () {
        if (typeof document === 'undefined') return;

        let modal = document.getElementById('sokoban-rules-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sokoban-rules-modal';
            modal.className = 'game-modal';
            document.body.appendChild(modal);
            modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        }

        let h = '<div class="game-modal-content" style="max-width:620px; padding:20px; background:var(--bg-card, #f4ecd6); border-radius:10px; border:2px solid var(--accent-gold, #c5a059); color:var(--ink-primary, #2c1a0e); font-family:serif;">';
        h += '<button class="game-modal-close" onclick="document.getElementById(\'sokoban-rules-modal\').remove()" style="position:absolute; top:12px; right:14px; background:none; border:none; font-size:22px; cursor:pointer;">×</button>';
        h += '<h2 style="margin-bottom:12px; color:var(--ink-primary, #2c1a0e); font-family:\'Cinzel\',serif; font-size:1.3rem;">📚 Knihovní uspořádání (Ars Bibliothecae)</h2>';

        h += '<h3 style="margin-top:10px; font-size:1rem;">📜 10 Klášterních komnat (Chambers I — X)</h3>';
        h += '<p style="opacity:0.9; font-size:0.88rem; line-height:1.4;">V klášterní knihovně Scriptorium čeká 10 autentických komnat od Novicova stolu přes Kapitulní síň s démonem Titivillem až po velkou kryptu drolerií. Každá komnata skrývá vzácné rukopisy (Biblia Sacra, Hortus Sanitatis, Codex Gigas...).</p>';

        h += '<h3 style="margin-top:12px; font-size:1rem;">❓ Lze knihu odtáhnout od zdi?</h3>';
        h += '<p style="opacity:0.9; font-size:0.88rem; line-height:1.4; background:rgba(138,51,36,0.1); border-left:3px solid var(--accent-wax, #8a3324); padding:8px 12px; border-radius:4px;"><strong>Ne!</strong> Podle starobylých pravidel skladnických hlavolamů (Sokoban) lze těžké vázané kodexy pouze <strong>TLAČIT</strong> před sebou. Pokud knihu natlačíte do rohu nebo k rovné stěně, nelze ji vytáhnout. Využijte tlačítko <strong>Zpět (Undo / klávesa Z)</strong> nebo <strong>Restart (R)</strong>.</p>';

        h += '<h3 style="margin-top:12px; font-size:1rem;">🎯 Pravidla řazení & Odměny</h3>';
        h += '<ul style="opacity:0.9; font-size:0.85rem; line-height:1.5; padding-left:20px;">' +
            '<li>Každá kniha patří na osvětlený pult se stejným symbolem (🌿 Herbář, ✨ Astronomie, 🕊️ Teologie, 📜 Kronika, 🔮 Tajné vědy, ⚗️ Alchymie, 👑 Výnosy, ⭐ Legendy, 💀 Memento Mori).</li>' +
            '<li>Správně usazený svazek zazáří zeleným iluminovaným lemem.</li>' +
            '<li>Nelze tlačit dvě knihy za sebou najednou.</li>' +
            '<li>Vyřešením komnaty získá bratr plné zotavení Vigor a +15 až +35 Zápisků (podle hloubky komnaty).</li>' +
            '<li>Postup se ukládá a odemyká další komnaty až do finální X. komnaty.</li>' +
            '</ul>';

        h += '</div>';
        modal.innerHTML = h;
    }
};

if (typeof window !== 'undefined') {
    window.SokobanGame = SokobanGame;
}
if (typeof globalThis !== 'undefined') {
    globalThis.SokobanGame = SokobanGame;
}

try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SokobanGame };
    }
} catch (e) { }
