// ═══ src/core/managers/ChronicleManager.js ═══
// Extrakce z game.js (Krok 2 / D9, refactoring-audit-mrd-19-8-2026.md §2),
// 19.8.2026. Domain: Kronika (denni zapisy). Původně Game.* na řádcích
// 3414-3451 + 8230-8242 (HEAD po D2-D5+cleanup). Chování beze změny —
// pouze přesun + přepsání self-referencí Game.addKronikaEntry ->
// ChronicleManager.addKronikaEntry (obe metody se stěhují spolu).
// addKronikaEntry má 120+ externích volacích míst napříc celým
// projektem — všechna přes Game. prefix, nedotčena (delegují přes stub).
const ChronicleManager = {
    kronikaCraftFlushBuffer: function () {
        if (!GameState.kronikaCraftBuffer) return;
        const buf = GameState.kronikaCraftBuffer;
        if (!buf.date || Object.keys(buf.crafts).length === 0) return;
        const craftList = Object.entries(buf.crafts).map(([id, qty]) => {
            const item = (typeof ItemsDB !== 'undefined' && ItemsDB[id]) ? ItemsDB[id] : null;
            const name = item ? item.name : id;
            const nameEn = item ? (item.name_en || item.name) : id;
            return { cs: `${qty}× ${name}`, en: `${qty}× ${nameEn}` };
        });
        if (craftList.length === 0) return;
        const cs = 'Vyrobeno: ' + craftList.map(g => g.cs).join(', ');
        const en = 'Crafted: ' + craftList.map(g => g.en).join(', ');
        const la = 'Facta: ' + craftList.map(g => g.cs).join(', ');
        ChronicleManager.addKronikaEntry('normal', cs, en, la);
        GameState.kronikaCraftBuffer = { date: buf.date, crafts: {} };
    },

    kronikaFlushBuffer: function () {
        if (!GameState.kronikaDailyBuffer) GameState.kronikaDailyBuffer = { date: '', gains: {} };
        const buf = GameState.kronikaDailyBuffer;
        if (!buf.date || Object.keys(buf.gains).length === 0) return;
        // Sestavit text ze získaných položek
        const gainList = Object.entries(buf.gains)
            .map(([id, qty]) => {
                const item = (typeof ItemsDB !== 'undefined' && ItemsDB[id]) ? ItemsDB[id] : null;
                const name = item ? item.name : id;
                const nameEn = item ? (item.name_en || item.name) : id;
                return { cs: `${qty}× ${name}`, en: `${qty}× ${nameEn}` };
            });
        if (gainList.length === 0) return;
        const cs = 'Sesbíráno: ' + gainList.map(g => g.cs).join(', ');
        const en = 'Gathered: ' + gainList.map(g => g.en).join(', ');
        const la = 'Collectum: ' + gainList.map(g => g.cs).join(', ');
        ChronicleManager.addKronikaEntry('normal', cs, en, la);
        // Reset buffer
        GameState.kronikaDailyBuffer = { date: buf.date, gains: {} };
    },

    addKronikaEntry: function (type, cs, en, la) {
        if (!GameState.kronika) GameState.kronika = [];
        GameState.kronika.push({
            ts: Date.now(),
            type: type,
            cs: cs,
            en: en,
            la: la
        });
        if (GameState.kronika.length > 500) {
            GameState.kronika = GameState.kronika.slice(-500);
        }
    },
};
