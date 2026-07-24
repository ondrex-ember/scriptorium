// ─────────────────────────────────────────────────────────────
// StudovnaSystem — Studovna (čítárna při Knihovně)
// MRD: studovna-vrchnost-mrd.md. Tři sloty obsazenosti:
// 1) Vrchnost/Chronicon host — timed pobyt (GameState.studovnaGuest),
//    nastavuje ChroniconSystem._resolveAdvisory() po přijetí žádosti.
// 2) Mnišský Lector — bratr s assignedTab === 'studovna' (DormitoriumSpecializationDB).
// 3) Hráč — kosmetickej slot, vždy přítomen, jakmile je tech odemčená.
// Žádná nová produkční smyčka — čistě vizuální přehled "kdo je ve Studovně".
// ─────────────────────────────────────────────────────────────

const StudovnaSystem = {

    isUnlocked: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_studovna'));
    },

    // Vyprší-li pobyt hosta, tiše ho uklidí. Voláno lazy při každém renderu —
    // žádný samostatný denní tick netřeba, sloty se dívají jen na požádání.
    _clearExpiredGuest: function() {
        const g = GameState.studovnaGuest;
        if (g && g.until && Date.now() >= g.until) {
            GameState.studovnaGuest = null;
            if (typeof Game !== 'undefined' && Game.save) Game.save();
        }
    },

    render: function() {
        const el = document.getElementById('library-studovna-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        if (!this.isUnlocked()) {
            el.innerHTML = `<div style="text-align:center; padding:40px 20px; opacity:0.6;
                        border:1px dashed rgba(197,160,89,0.3); border-radius:8px;">
                      <div style="font-size:2rem; margin-bottom:10px;">📖</div>
                      <div style="font-style:italic; font-size:0.9rem;">
                        ${lang==='en' ? 'The study room has not yet been built.' : 'Studovna zatím nestojí.'}
                      </div>
                    </div>`;
            return;
        }

        this._clearExpiredGuest();

        let h = `<div style="padding:12px 15px; margin-bottom:16px; background:rgba(197,160,89,0.05); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-weight:bold; font-size:0.9rem; margin-bottom:6px;">📖 ${lang==='en'?'Study Room':'Studovna'}</div>
                <div style="font-size:0.78rem; opacity:0.75;">${lang==='en'
                    ? 'A quiet room by the library, kept for reading — by brothers, by you, and now and then by a guest from outside the walls.'
                    : 'Tichá místnost při knihovně, vyhrazená ke čtení — bratry, tebou, a čas od času i hostem zvenčí kláštera.'}</div>
              </div>`;

        h += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:10px;">`;

        // Slot 1 — hráč (kosmetický, vždy přítomen)
        h += `<div style="text-align:center; padding:14px 10px; border-radius:8px; border:1px solid rgba(197,160,89,0.25); background:rgba(197,160,89,0.08);">
                <div style="font-size:1.6rem;">🕯️</div>
                <div style="font-size:0.75rem; font-weight:bold; margin-top:6px;">${lang==='en'?'You':'Ty'}</div>
                <div style="font-size:0.6rem; opacity:0.6; margin-top:2px;">${lang==='en'?'always at your desk':'vždy u svého pultu'}</div>
              </div>`;

        // Slot 2 — mnišský Lector
        const lector = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).find(b => b.assignedTab === 'studovna');
        h += `<div style="text-align:center; padding:14px 10px; border-radius:8px; border:1px solid rgba(197,160,89,0.25); background:${lector ? 'rgba(197,160,89,0.08)' : 'rgba(0,0,0,0.03)'};">
                <div style="font-size:1.6rem;">📖</div>
                <div style="font-size:0.75rem; font-weight:bold; margin-top:6px;">${lector ? lector.name : (lang==='en'?'Lector':'Lector')}</div>
                <div style="font-size:0.6rem; opacity:0.6; margin-top:2px;">${lector ? (lang==='en'?'reading':'čte') : (lang==='en'?'vacant':'volné')}</div>
              </div>`;

        // Slot 3 — Vrchnost/Chronicon host (timed)
        const guest = GameState.studovnaGuest;
        let guestSub = lang === 'en' ? 'vacant' : 'volné';
        if (guest) {
            const hoursLeft = Math.max(0, Math.ceil((guest.until - Date.now()) / 3600000));
            guestSub = lang === 'en' ? `${hoursLeft}h remaining` : `zbývá ${hoursLeft}h`;
        }
        h += `<div style="text-align:center; padding:14px 10px; border-radius:8px; border:1px solid rgba(197,160,89,0.25); background:${guest ? 'rgba(197,160,89,0.08)' : 'rgba(0,0,0,0.03)'};">
                <div style="font-size:1.6rem;">${guest ? '🏰' : '💺'}</div>
                <div style="font-size:0.75rem; font-weight:bold; margin-top:6px;">${guest ? guest.name : (lang==='en'?'Guest':'Host')}</div>
                <div style="font-size:0.6rem; opacity:0.6; margin-top:2px;">${guestSub}</div>
              </div>`;

        h += `</div>`;
        el.innerHTML = h;
    },

};
