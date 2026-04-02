// Scriptorium — Build Script
// Spuštění: node build.js
// Výstup:   dist/index.html

const fs   = require('fs');
const path = require('path');

const BASE = __dirname;
const SRC  = path.join(BASE, 'src');
const DIST = path.join(BASE, 'dist');

// ─── Pořadí JS modulů ───────────────────────────────────────────────
// POZOR: pořadí je kritické — závislosti musí být dříve než konzumenti

const JS_MAIN = [
    // Core config první — ostatní na ni závisí
    'src/core/config.js',

    // Data — na sobě nezávislá, jen závisí na CONFIG
    'src/data/library.js',          // LibraryDB, FontSpecimensDB, TechLoreDB
    'src/data/library-helpers.js',  // EasterEggsDB, ScribeNPC, LibraryHelpers
    'src/data/items.js',            // ItemsDB
    'src/data/recipes.js',          // RecipesDB
    'src/data/lore.js',             // LoreDB
    'src/data/tech.js',             // TechTree
    'src/core/gamestate.js',        // ActionsDB, GameState
    'src/data/achievements.js',     // AchievementsDB
    'src/data/daily-facts.js',      // DailyFactsDB

    // Systémy
    'src/systems/theme.js',         // ThemeSystem
    'src/systems/records.js',       // PersonalRecords
    'src/systems/weather.js',       // WeatherSystem
    'src/systems/time.js',          // TimeSys
    'src/systems/canonical.js',     // CanonicalHours
    'src/systems/events.js',        // EventsSystem
    'src/systems/rank.js',          // RankSystem
    'src/systems/notebook.js',      // NotebookSystem

    // Mini-hry
    'src/games/memory.js',
    'src/games/primero.js',
    'src/games/rithmomachia.js',
    'src/games/ur.js',
    'src/games/karnoffel.js',
    'src/games/freecell.js',

    // i18n — musí být před Game a UI
    'src/i18n/cs.js',               // Čeština (master)
    'src/i18n/en.js',               // English
    // 'src/i18n/de.js',            // Deutsch (budoucí)
    // 'src/i18n/pl.js',            // Polski (budoucí)
    'src/i18n/strings.js',          // STRINGS assembler + t()
    'src/i18n/lang.js',             // LangSystem

    // Herní logika — závisí na všem výše
    'src/core/game.js',             // Game
    'src/core/ui.js',               // UI
    'src/systems/iching.js',        // IChing — musí být po UI (přiřazuje UI.renderIChing)
];

const JS_BOOTSTRAP = [
    'src/core/bootstrap.js',        // ConsentManager, Analytics, window.onload
];

// ─── Build funkce ────────────────────────────────────────────────────

function readFile(relPath) {
    const fullPath = path.join(BASE, relPath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Soubor neexistuje: ${fullPath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
}

function build() {
    console.log('🔨 Scriptorium build start...\n');

    // 1. Načíst shell
    let shell = readFile('src/shell.html');

    // 2. Sestavit hlavní JS blok
    let jsMain = '';
    for (const file of JS_MAIN) {
        const content = readFile(file);
        jsMain += `\n// ═══ ${file} ═══\n`;
        jsMain += content;
    }

    // 3. Sestavit bootstrap JS blok
    let jsBootstrap = '';
    for (const file of JS_BOOTSTRAP) {
        const content = readFile(file);
        jsBootstrap += `\n// ═══ ${file} ═══\n`;
        jsBootstrap += content;
    }

    // 4. Injektovat do shellu
    let output = shell;
    if (!output.includes('/* BUILD:JS_MAIN */')) {
        throw new Error('Placeholder BUILD:JS_MAIN nenalezen v shell.html!');
    }
    if (!output.includes('/* BUILD:JS_BOOTSTRAP */')) {
        throw new Error('Placeholder BUILD:JS_BOOTSTRAP nenalezen v shell.html!');
    }

    output = output.replace('/* BUILD:JS_MAIN */', jsMain);
    output = output.replace('/* BUILD:JS_BOOTSTRAP */', jsBootstrap);

    // 5. Zapsat výstup
    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);
    const outPath = path.join(DIST, 'index.html');
    fs.writeFileSync(outPath, output, 'utf-8');

    // 6. Statistiky
    const lines = output.split('\n').length;
    const sizeKB = Math.round(Buffer.byteLength(output, 'utf-8') / 1024);
    console.log(`✅ Build hotov: dist/index.html`);
    console.log(`   Řádků:  ${lines.toLocaleString()}`);
    console.log(`   Velikost: ${sizeKB} KB`);
    console.log(`   Modulů: ${JS_MAIN.length + JS_BOOTSTRAP.length}`);
}

build();
