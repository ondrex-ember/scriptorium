// Scriptorium i18n — STRINGS assembler + t() helper
// Jazyky jsou v samostatných souborech: cs.js, en.js, de.js ...
// Přidání nového jazyka: 1) vytvořit xx.js, 2) přidat do STRINGS níže, 3) přidat do build.js

const STRINGS = {
    cs: STRINGS_cs,
    en: STRINGS_en,
};


// Překladová funkce — fallback na CS pokud klíč chybí
function t(path) {
    const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
    const obj = STRINGS[lang] || STRINGS.cs;
    const val = path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
    if (val !== null) return val;
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), STRINGS.cs) || path;
}

// Item name helper — vrátí přeložený název itemu, fallback na CS
function iName(id) {
    const item = ItemsDB[id];
    if (!item) return id;
    const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
    return (lang !== 'cs' && item.name_en) ? item.name_en : item.name;
}

// Item description helper — vrátí přeložený popis itemu
function iDesc(id) {
    const item = ItemsDB[id];
    if (!item) return '';
    const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
    return (lang !== 'cs' && item.desc_en) ? item.desc_en : item.desc;
}

// Tech name helper
function tName(id) {
    const tech = TechTree.find(x => x.id === id);
    if (!tech) return id;
    const lang = (typeof GameState !== 'undefined' && GameState.settings && GameState.settings.language) || 'cs';
    return (lang !== 'cs' && tech.name_en) ? tech.name_en : tech.name;
}
