// Scriptorium — Build Script
// Spuštění: node build.js
// Výstup:   dist/index.html
//
// Proces:
//   1. Vytvořit dist/ složku (pokud neexistuje)
//   2. Zkopírovat assety z public/ → dist/ (CNAME, og-image.jpg, ikony...)
//   3. Sestavit index.html ze src/ modulů
//   4. Zapsat dist/index.html
//
// TIP: Statické soubory (obrázky, CNAME, ikony) patří do public/

const fs = require('fs');
const path = require('path');
let minify;
try {
    minify = require('terser').minify;
} catch (e) {
    console.warn('⚠️ Terser library not found, build will proceed without JS minification.');
}

const BASE = __dirname;
const DIST = path.join(BASE, 'dist');

// ─── Pořadí JS modulů ───────────────────────────────────────────────
// KRITICKÉ: závislosti musí být definovány před konzumenty

const JS_MAIN = [
    // Core config — vše závisí na CONFIG
    'src/core/config.js',

    // Data — nezávislá, závisí jen na CONFIG
    'src/data/library.js',          // LibraryDB, FontSpecimensDB, TechLoreDB
    'src/data/library-helpers.js',  // EasterEggsDB, ScribeNPC, LibraryHelpers
    'src/data/items.js',            // ItemsDB
    'src/data/recipes.js',          // RecipesDB
    'src/data/health.js',           // HealthConditionsDB (Valetudo)
    'src/data/lore.js',             // LoreDB
    'src/data/tech.js',             // TechTree
    'src/core/gamestate.js',        // ActionsDB, GameState
    'src/data/achievements.js',     // AchievementsDB
    'src/data/daily-facts.js',      // DailyFactsDB
    'src/data/scrinium.js',         // ScriniumDB
    'src/data/letters.js',          // LettersDB
    'src/data/porta-correspondence.js', // OutgoingLettersDB — odchozí korespondence
    'src/data/conversi.js',         // ConversiRosterDB, ConversiTraitsDB, ConversiBondsDB
    'src/data/dormitorium.js',      // DormitoriumRosterDB, DormitoriumSpecializationDB
    'src/data/contacts.js',         // ContactsDB (Clientela)
    'src/data/guilds.js',           // GuildsDB (Cechy) — K1 infrastruktura
    'src/data/land.js',             // LandParcelsDB (Pozemky) — K1 infrastruktura

    // Systémy
    'src/systems/theme.js',         // ThemeSystem
    'src/systems/records.js',       // PersonalRecords
    'src/systems/weather.js',       // WeatherSystem
    'src/systems/header-image.js',  // HeaderImageSystem
    'src/systems/time.js',          // TimeSys
    'src/systems/canonical.js',     // CanonicalHours
    'src/systems/notifications.js', // NotificationSystem
    'src/systems/ChroniconSystem.js', // ChroniconSystem
    'src/systems/events.js',        // EventsSystem
    'src/systems/rank.js',          // RankSystem
    'src/systems/notebook.js',      // NotebookSystem
    'src/systems/audio.js',
    'src/systems/VigorSystem.js',
    'src/systems/HealthSystem.js',  // Valetudo — neduhy, napojeno na VigorSystem._tick()
    'src/systems/CellariumSystem.js',
    'src/systems/SaeculumSystem.js',
    'src/systems/TemplumSystem.js',  // Templum (kostelní větev, T1 skeleton)
    'src/systems/InfirmariumSystem.js', // Infirmarium (ošetřovna, Sprint 1 skeleton)
    'src/systems/StudovnaSystem.js', // Studovna (čítárna, occupancy sloty)
    'src/systems/DecaySystem.js',
    'src/systems/CheeseSystem.js',
    'src/systems/LimeSystem.js',
    'src/systems/MillSystem.js',           // Vodní mlýn — provoz (mlynar-vlastni-mlyn-mrd.md §4.7)
    'src/systems/DryingSystem.js',
    'src/systems/CoquinaVisuals.js', // coquina-visuals-mrd (9.8.2026), SVG ilustrace stanic, mirror Athanor techniky
    'src/systems/CookingSystem.js', // udirna-mrd (7.8.2026), mirror DryingSystem
    'src/systems/well.js',
    'src/systems/terrain.js',        // TerrainSystem — únava krajiny
    'src/systems/fireplace.js',
    'src/systems/IncenseSystem.js',
    'src/systems/GardenSystem.js',
    'src/systems/FarmyardSystem.js',
    'src/systems/ScriptoriumCat.js',
    'src/systems/PersonaSystem.js',
    'src/systems/PortaSystem.js',
    'src/systems/CommitmentsSystem.js',
    'src/systems/AbbotSystem.js', // abbot-lineage-mrd (9.8.2026)
    'src/systems/SecretsSystem.js',
    'src/systems/TutorialSystem.js',
    'src/systems/athanor.js',
    'src/systems/GamesSystem.js',

    // Mini-hry
    'src/games/memory.js',
    'src/games/primero.js',
    'src/games/rithmomachia.js',
    'src/games/ur.js',
    'src/games/karnoffel.js',
    'src/games/freecell.js',
    'src/games/senet.js',
    'src/games/backgammon.js',
    'src/games/draughts.js',
    'src/games/hnefatafl.js',
    'src/games/TavernDice.js',
    'src/games/sokoban.js',

    // i18n — MUSÍ být před Game a UI
    'src/i18n/cs.js',               // Čeština (master)
    'src/i18n/en.js',               // English
    // 'src/i18n/de.js',            // Deutsch (budoucí)
    // 'src/i18n/pl.js',            // Polski (budoucí)
    'src/i18n/strings.js',          // STRINGS assembler + t() + iName() + iDesc()
    'src/i18n/lang.js',             // LangSystem

    // Manažeři (Krok 2, refactoring-audit-mrd-19-8-2026.md) — extrahováno z game.js
    'src/core/managers/LootModalManager.js', // D2: Fireplace/Loot modály (19.8.2026)
    'src/core/managers/GardenManager.js', // D3: Zahony/Sad (19.8.2026)
    'src/core/managers/ApiaryManager.js', // D4: Apiarium (19.8.2026)
    'src/core/managers/PiscinaManager.js', // D5: Piscina (19.8.2026)
    'src/core/managers/ChronicleManager.js', // D9: Kronika (19.8.2026)
    'src/core/managers/MillManager.js', // D12: Mlýn (19.8.2026)
    'src/core/managers/PetitionManager.js', // D10: Petice/Ubytovna/Cechy/Pozemky (19.8.2026)
    'src/core/managers/SaveManager.js', // D1: Save/Settings (19.8.2026)
    'src/core/managers/HealthcareManager.js', // D13: Zdraví/Infirmarium (19.8.2026) — POZOR: soubor na disku má malé "c" (case-sensitive Linux CI fix, 20.8.2026)
    'src/core/managers/InventoryManager.js', // D8: Inventory/Crafting (19.8.2026)
    'src/core/managers/ScavengeManager.js', // D7: Scavenge/core actions (19.8.2026)
    'src/core/managers/TemplumManager.js', // D11: Templum (20.8.2026)
    'src/core/managers/ConversiManager.js', // D14+D15: Conversi/Dormitorium/Manufaktura (20.8.2026)

    // Herní logika — závisí na všem výše
    'src/core/game.js',             // Game
    'src/core/ui.js',               // UI

    // Astro - iching, calendar
    'src/systems/iching.js',
    'src/systems/calendar.js',

];

const JS_BOOTSTRAP = [
    'src/core/bootstrap.js',        // ConsentManager, Analytics, window.onload
];

// ─── Build ───────────────────────────────────────────────────────────

function readFile(relPath) {
    const fullPath = path.join(BASE, relPath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Soubor neexistuje: ${fullPath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
}

async function build() {
    console.log('🔨 Scriptorium build...\n');

    // Vytvořit dist/ pokud neexistuje
    if (!fs.existsSync(DIST)) {
        fs.mkdirSync(DIST);
        console.log('📁 Vytvořena složka dist/');
    }

    // Zkopírovat assety z public/ do dist/
    const PUBLIC = path.join(BASE, 'public');
    if (fs.existsSync(PUBLIC)) {
        console.log('📦 Kopíruji assety z public/ → dist/...');
        const files = fs.readdirSync(PUBLIC);
        let copied = 0;
        files.forEach(file => {
            const src = path.join(PUBLIC, file);
            const dest = path.join(DIST, file);
            const stat = fs.statSync(src);
            if (stat.isFile()) {
                fs.copyFileSync(src, dest);
                copied++;
                console.log(`   ✓ ${file}`);
            } else if (stat.isDirectory()) {
                // Rekurzivní kopírování složek
                fs.cpSync(src, dest, { recursive: true });
                copied++;
                console.log(`   ✓ ${file}/ (složka)`);
            }
        });
        console.log(`   📌 Zkopírováno: ${copied} souborů/složek\n`);
    } else {
        console.log('⚠️  Složka public/ neexistuje - assety nebudou zkopírovány\n');
    }

    // Zkopírovat api/ (Vercel serverless funkce) do dist/api/
    // Root Directory ve Vercelu ukazuje na dist/, takže funkce musí ležet v dist/api/.
    // Stejný neagresivní vzor jako kopírování public/ výše — nic jinýho v dist/ se nemaže.
    const API = path.join(BASE, 'api');
    if (fs.existsSync(API)) {
        console.log('📡 Kopíruji api/ → dist/api/...');
        const distApi = path.join(DIST, 'api');
        fs.cpSync(API, distApi, { recursive: true });
        console.log('   📌 Zkopírováno: api/\n');
    }

    let shell = readFile('src/shell.html');

    let jsMain = '';
    for (const file of JS_MAIN) {
        jsMain += `\n// ═══ ${file} ═══\n`;
        jsMain += readFile(file);
    }

    let jsBootstrap = '';
    for (const file of JS_BOOTSTRAP) {
        jsBootstrap += `\n// ═══ ${file} ═══\n`;
        jsBootstrap += readFile(file);
    }

    // Minifikace (Krok M, refactoring-audit-mrd-19-8-2026.md) — mangle vypnutý
    // záměrně: 82 souborů sdílí globály (GameState, ChroniconSystem, ...) napříč
    // konkatenací, přejmenování by tohle riskovalo rozbít. compress+strip
    // komentářů samo dává ~30% úsporu bez toho rizika.
    const jsMainBeforeKB = Math.round(Buffer.byteLength(jsMain, 'utf-8') / 1024);
    if (minify) {
        try {
            const minMain = await minify(jsMain, { compress: true, mangle: false, format: { comments: false } });
            if (!minMain.error && minMain.code) {
                jsMain = minMain.code;
                const jsMainAfterKB = Math.round(Buffer.byteLength(jsMain, 'utf-8') / 1024);
                console.log(`🗜️  Minifikace: jsMain ${jsMainBeforeKB} KB → ${jsMainAfterKB} KB (${(100 - jsMainAfterKB / jsMainBeforeKB * 100).toFixed(1)}% úspora)`);
            }
        } catch (e) {
            console.warn('⚠️ Minifikace jsMain selhala, použije se neminifikovaný kód:', e.message);
        }

        try {
            const minBootstrap = await minify(jsBootstrap, { compress: true, mangle: false, format: { comments: false } });
            if (!minBootstrap.error && minBootstrap.code) {
                jsBootstrap = minBootstrap.code;
            }
        } catch (e) {
            console.warn('⚠️ Minifikace jsBootstrap selhala:', e.message);
        }
    }

    if (!shell.includes('/* BUILD:JS_MAIN */')) throw new Error('Placeholder JS_MAIN chybí v shell.html!');
    if (!shell.includes('/* BUILD:JS_BOOTSTRAP */')) throw new Error('Placeholder JS_BOOTSTRAP chybí v shell.html!');

    let output = shell
        .replace('/* BUILD:JS_MAIN */', jsMain)
        .replace('/* BUILD:JS_BOOTSTRAP */', jsBootstrap);

    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);
    const outPath = path.join(DIST, 'index.html');
    fs.writeFileSync(outPath, output, 'utf-8');

    const lines = output.split('\n').length;
    const sizeKB = Math.round(Buffer.byteLength(output, 'utf-8') / 1024);
    console.log(`✅ dist/index.html`);
    console.log(`   Řádků:    ${lines.toLocaleString()}`);
    console.log(`   Velikost: ${sizeKB} KB`);
    console.log(`   Modulů:   ${JS_MAIN.length + JS_BOOTSTRAP.length}`);
}

build().catch(err => { console.error('❌ Build selhal:', err); process.exit(1); });
