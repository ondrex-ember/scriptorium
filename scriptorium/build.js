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
    'src/data/conversi.js',         // ConversiRosterDB, ConversiTraitsDB, ConversiBondsDB
    'src/data/dormitorium.js',      // DormitoriumRosterDB, DormitoriumSpecializationDB
    'src/data/contacts.js',         // ContactsDB (Clientela)

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
    'src/systems/DryingSystem.js',
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
    'src/systems/SecretsSystem.js',
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

    // i18n — MUSÍ být před Game a UI
    'src/i18n/cs.js',               // Čeština (master)
    'src/i18n/en.js',               // English
    // 'src/i18n/de.js',            // Deutsch (budoucí)
    // 'src/i18n/pl.js',            // Polski (budoucí)
    'src/i18n/strings.js',          // STRINGS assembler + t() + iName() + iDesc()
    'src/i18n/lang.js',             // LangSystem

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

function build() {
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

build();