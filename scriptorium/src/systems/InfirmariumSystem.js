// ─────────────────────────────────────────────────────────────
// InfirmariumSystem — Ošetřovna (Sprint 1: gate + tab skeleton)
// MRD: infirmarium (project reference), sprint dohodnut v chatu
// Sprint 1 = tab + gate + vizuální kostra (4 stanoviště jako dlaždice).
// Žádná herní mechanika (diagnostika/produkce/přiřazení) zatím neběží —
// ta přichází v dalších sprintech (Konvrši úkoly, humorální diagnostika,
// produkční řetězec, Chirurgus, Capellanus/Zpověď).
// ─────────────────────────────────────────────────────────────

const InfirmariumSystem = {

    // Gate: budova + tab se odemyká tech_infirmarium
    isUnlocked: function() {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_infirmarium'));
    },

    // Zobrazit/skrýt top-level tab dle gate (mirror TemplumSystem.updateTabVisibility)
    updateTabVisibility: function() {
        const btn = document.getElementById('home-tab-infirmarium');
        if (!btn) return;
        const show = this.isUnlocked();
        const cur = btn.style.display !== 'none';
        if (show !== cur) btn.style.display = show ? '' : 'none';
    },

    // 4 stanoviště (konvrší podrole) — ikony + gate tech, mapuje na CONVERSI_TASKS v game.js
    _STATIONS: [
        { id: 'servitor',   icon: '🩺', tech: 'tech_infirmarium_servitor',   name_cs: 'Ošetřovatel', name_en: 'Servitor' },
        { id: 'coquus',     icon: '🍲', tech: 'tech_infirmarium_coquus',     name_cs: 'Kuchař',      name_en: 'Coquus' },
        { id: 'hortulanus', icon: '🌿', tech: 'tech_infirmarium_hortulanus', name_cs: 'Bylinář',     name_en: 'Hortulanus' },
        { id: 'balneator',  icon: '🔥', tech: 'tech_infirmarium_balneator', name_cs: 'Topič',       name_en: 'Balneator' }
    ],

    renderInfirmariumTab: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        if (!this.isUnlocked()) {
            return `<div style="text-align:center; padding:30px; opacity:0.6;
                        border:1px dashed rgba(197,160,89,0.3); border-radius:8px;">
                      <div style="font-size:2rem; margin-bottom:10px;">🩺</div>
                      <div style="font-style:italic; font-size:0.9rem;">
                        ${lang==='en' ? 'The infirmary has not yet been built.' : 'Ošetřovna zatím nestojí.'}
                      </div>
                    </div>`;
        }

        let h = '';

        // Signature: čtyřhumorální proužek (Sprint 3 ho oživí reálnýma daty)
        h += `<div style="display:flex; height:6px; border-radius:3px; overflow:hidden; margin-bottom:14px;">
                <div style="flex:1; background:var(--accent-wax);" title="${lang==='en'?'Blood':'Krev'}"></div>
                <div style="flex:1; background:var(--accent-gold);" title="${lang==='en'?'Yellow bile':'Žlutá žluč'}"></div>
                <div style="flex:1; background:var(--ink-secondary);" title="${lang==='en'?'Black bile':'Černá žluč'}"></div>
                <div style="flex:1; background:#7a95a8;" title="${lang==='en'?'Phlegm':'Hlen'}"></div>
              </div>`;

        h += `<div style="padding:12px 15px; margin-bottom:16px; background:rgba(197,160,89,0.05); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-weight:bold; font-size:0.9rem; margin-bottom:6px;">🩺 Infirmarium</div>
                <div style="font-size:0.78rem; opacity:0.75;">${lang==='en'
                    ? 'The sick have their own hall now. Diagnosis and care will follow.'
                    : 'Nemocní mají vlastní síň. Diagnostika a péče přijdou brzy.'}</div>
              </div>`;

        // Řada 4 stanovišť — dlaždice, ne seznam
        h += `<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">`;
        h += this._STATIONS.map(st => {
            const gated = !(GameState.researchedTechs && GameState.researchedTechs.includes(st.tech));
            const label = lang === 'en' ? st.name_en : st.name_cs;
            return `<div style="text-align:center; padding:10px 6px; border-radius:8px;
                        border:1px solid rgba(197,160,89,0.25);
                        background:rgba(197,160,89,0.05);
                        opacity:${gated ? '0.5' : '1'};">
                      <div style="font-size:1.4rem;">${st.icon}</div>
                      <div style="font-size:0.68rem; font-weight:bold; margin-top:4px;">${label}</div>
                      <div style="font-size:0.6rem; opacity:0.7; margin-top:2px;">${gated ? '🔒 ' + st.tech : (lang==='en' ? 'soon' : 'brzy')}</div>
                    </div>`;
        }).join('');
        h += `</div>`;

        return h;
    }
};
