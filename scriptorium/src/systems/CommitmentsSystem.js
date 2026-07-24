// ═══════════════════════════════════════════════════════════════════════════
// CommitmentsSystem — Scriptorium
// Přehled aktivních zakázek vzešlých z dopisů (Porta). Nečte žádný nový
// stav sám — jen prohledá LettersDB, jestli má nějaký dopis pole
// `commitment`, a porovná ho proti GameState.flags. Nová zakázka
// v budoucnu = jen přidat `commitment` blok k dopisu, nic víc.
// Sesterský tab k Portě — stejná viditelnostní podmínka (porta_active).
// ═══════════════════════════════════════════════════════════════════════════

const CommitmentsSystem = {

    // Najde všechny dopisy s definovaným commitment blokem, jejichž
    // aktuální flag-stav odpovídá "aktivní" (probíhající) zakázce.
    _getActiveCommitments: function () {
        if (typeof LettersDB === 'undefined' || !GameState.flags) return [];
        const now = Date.now();
        return LettersDB
            .filter(l => l.commitment)
            .map(l => {
                const c = l.commitment;
                const status = GameState.flags[c.flagKey];
                if (!c.activeStatuses.includes(status)) return null;
                const deadline = c.deadlineFlagKey ? GameState.flags[c.deadlineFlagKey] : null;
                return { letter: l, commitment: c, deadline, daysLeft: deadline ? Math.ceil((deadline - now) / 86400000) : null };
            })
            .filter(Boolean);
    },

    render: function () {
        const el = document.getElementById('lore-commitments-content');
        if (!el) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        if (!(GameState.flags && GameState.flags.porta_active)) {
            el.innerHTML = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold); text-align:center; opacity:0.7;">
                <div style="font-size:2rem; margin-bottom:8px;">📋</div>
                <div style="font-size:0.85rem; font-style:italic;">${lang==='en' ? 'No commitments yet — nothing to track.' : 'Zatím žádné zakázky — není co sledovat.'}</div>
            </div>`;
            return;
        }

        const active = this._getActiveCommitments();

        let h = `<div style="padding:16px; background:rgba(197,160,89,0.06); border-radius:10px; border-left:4px solid var(--accent-gold);">`;
        h += `<h3 style="margin:0 0 12px 0; font-size:1rem;">📋 ${lang==='en' ? 'Commitments' : 'Zakázky'}</h3>`;
        h += `<p style="font-size:0.82rem; opacity:0.7; margin-bottom:14px;">${lang==='en'
            ? 'Promises made through Porta — who they are for, how much time remains, what is at stake.'
            : 'Sliby dané přes Portu — pro koho jsou, kolik zbývá času, co je v sázce.'}</p>`;

        if (active.length === 0) {
            h += `<div style="font-size:0.82rem; opacity:0.6; font-style:italic;">${lang==='en' ? 'No open commitments right now.' : 'Momentálně žádné otevřené zakázky.'}</div>`;
        } else {
            h += `<div style="display:flex; flex-direction:column; gap:10px;">`;
            active.forEach(({ commitment: c, daysLeft }) => {
                const forWhom = lang === 'en' ? (c.forWhom_en || c.forWhom_cs) : c.forWhom_cs;
                const what = lang === 'en' ? (c.what_en || c.what_cs) : c.what_cs;
                const reward = lang === 'en' ? (c.reward_en || c.reward_cs) : c.reward_cs;
                const risk = lang === 'en' ? (c.risk_en || c.risk_cs) : c.risk_cs;

                let timeLine;
                if (daysLeft === null) {
                    timeLine = lang === 'en' ? 'No fixed deadline' : 'Bez pevné lhůty';
                } else if (daysLeft < 0) {
                    timeLine = `<span style="color:#c0392b;">${lang==='en' ? 'Overdue' : 'Po lhůtě'}</span>`;
                } else if (daysLeft <= 3) {
                    timeLine = `<span style="color:#c0392b; font-weight:bold;">${lang==='en' ? `${daysLeft} days left` : `zbývá ${daysLeft} dní`}</span>`;
                } else {
                    timeLine = lang === 'en' ? `${daysLeft} days left` : `zbývá ${daysLeft} dní`;
                }

                h += `<div style="padding:12px; background:rgba(0,0,0,0.04); border-radius:8px;">
                    <div style="font-weight:bold; font-size:0.88rem; margin-bottom:4px;">🕊️ ${forWhom}</div>
                    <div style="font-size:0.82rem; opacity:0.85; margin-bottom:6px;">${what}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:0.76rem; opacity:0.75;">
                        <span>⏳ ${timeLine}</span>
                        ${reward ? `<span>💰 ${reward}</span>` : ''}
                        ${risk ? `<span style="opacity:0.65;">⚠️ ${risk}</span>` : ''}
                    </div>
                </div>`;
            });
            h += `</div>`;
        }

        h += `</div>`;
        el.innerHTML = h;
    },

};
