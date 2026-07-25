// ─────────────────────────────────────────────────────────────
// InfirmariumSystem — Ošetřovna
// MRD: infirmarium (project reference) + infirmarium-library-books-mrd.md
// Sprint 1: tab + gate + 4 stanoviště (dlaždice).
// Sprint 3 (fáze 1 — interní pacienti): admission systém (Game.admitToInfirmarium/
// dischargeFromInfirmarium), kvalita péče (Game.infirmariumCareModifier — lůžko +
// staffing Servitor/Coquus/Balneator + CHRONICON chroniconPlagueBolstered flag),
// napojeno na ergot_fire death chance a obecné tlumení fatigue/satiety ticku.
// Humorální diagnostika (Medicus) a produkční řetězec (Apothecarius) zatím neběží —
// ta přichází v dalších sprintech. Externí pacienti (poutníci/hosté) odloženo.
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

    // Humorální diagnostika — jen viditelná/aktivní když je Medicus přiřazenej.
    // Bez Medica zůstává stávající chování (holej název neduhu, statickej proužek).
    _HUMOR_NAMES: {
        sanguis:     { cs: 'Krev',        en: 'Blood' },
        cholera:     { cs: 'Žlutá žluč',  en: 'Yellow bile' },
        melancholia: { cs: 'Černá žluč',  en: 'Black bile' },
        phlegma:     { cs: 'Hlen',        en: 'Phlegm' }
    },

    _medicusPresent: function() {
        return ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_medicus');
    },

    _humorCounts: function() {
        const counts = { sanguis: 0, cholera: 0, melancholia: 0, phlegma: 0 };
        const inf = GameState.infirmarium || { patients: [] };
        (inf.patients || []).forEach(p => {
            const pool = p.isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
            const entity = pool.find(e => e.id === p.entityId);
            if (!entity || !entity.conditions) return;
            Object.keys(entity.conditions).forEach(id => {
                const def = typeof HealthConditionsDB !== 'undefined' ? HealthConditionsDB[id] : null;
                if (def && def.humor && Object.prototype.hasOwnProperty.call(counts, def.humor)) counts[def.humor]++;
            });
        });
        return counts;
    },

    // Kdo leží v Infirmariu — čte GameState.infirmarium.patients, jméno/neduh
    // resolvuje z conversi/dormitorium poolu. Propuštění se řeší v Saeculu
    // (detail konvrše/bratra), tady je jen přehled.
    _renderPatientsSection: function(lang) {
        const inf = GameState.infirmarium || { beds: 3, patients: [] };
        const patients = inf.patients || [];
        const medicusPresent = this._medicusPresent();
        let h = `<div style="padding:12px 15px; margin-bottom:14px; background:rgba(197,160,89,0.05); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">`;
        h += `<div style="font-weight:bold; font-size:0.9rem; margin-bottom:6px;">🛏️ ${lang==='en'?'Beds':'Lůžka'} — ${patients.length}/${inf.beds}</div>`;
        if (!patients.length) {
            h += `<div style="font-size:0.75rem; opacity:0.6;">${lang==='en'?'No one lies here yet.':'Zatím tu nikdo neleží.'}</div>`;
        } else {
            h += patients.map(p => {
                const pool = p.isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
                const entity = pool.find(e => e.id === p.entityId);
                if (!entity) return '';
                const conditionIds = entity.conditions ? Object.keys(entity.conditions) : [];
                const condNames = conditionIds.map(id => {
                    const def = typeof HealthConditionsDB !== 'undefined' ? HealthConditionsDB[id] : null;
                    return def ? (lang==='en' ? def.name_en : def.name) : id;
                }).join(', ');
                let humorLine = '';
                if (medicusPresent) {
                    const humors = conditionIds.map(id => {
                        const def = typeof HealthConditionsDB !== 'undefined' ? HealthConditionsDB[id] : null;
                        if (!def || !def.humor) return null;
                        const hn = this._HUMOR_NAMES[def.humor];
                        return hn ? (lang==='en' ? hn.en : hn.cs) : null;
                    }).filter(Boolean);
                    if (humors.length) {
                        humorLine = `<div style="font-size:0.68rem; opacity:0.65; font-style:italic; margin-top:2px;">⚕️ ${lang==='en'?'Diagnosis':'Diagnóza'}: ${humors.join(', ')}</div>`;
                    }
                }
                return `<div style="font-size:0.75rem; padding:4px 0; border-top:1px solid rgba(197,160,89,0.15);">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span>🤒 ${entity.name}${condNames ? ' — '+condNames : ''}</span>
                            </div>
                            ${humorLine}
                        </div>`;
            }).join('');
        }
        h += `</div>`;
        return h;
    },

    // 4 mnišský role (Infirmarius/Medicus/Apothecarius/Capellanus) — jen Infirmarius
    // má zatím funkci (viz Game.infirmariumCareModifier), zbytek vědomej stub.
    _MONK_ROLES: [
        { id: 'infirmarium_infirmarius',  icon: '🩺', name_cs: 'Infirmarius',  name_en: 'Infirmarian' },
        { id: 'infirmarium_medicus',      icon: '⚕️', name_cs: 'Medicus',      name_en: 'Medicus' },
        { id: 'infirmarium_apothecarius', icon: '🧪', name_cs: 'Apothecarius', name_en: 'Apothecary' },
        { id: 'infirmarium_capellanus',   icon: '⛪', name_cs: 'Capellanus',   name_en: 'Chaplain' }
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

        // Signature: čtyřhumorální proužek — dynamickej podle pacientů, jen když
        // je Medicus přiřazenej. Bez něj zůstává dekorativní (4 stejný díly).
        const medicusPresent = this._medicusPresent();
        if (medicusPresent) {
            const c = this._humorCounts();
            const total = c.sanguis + c.cholera + c.melancholia + c.phlegma;
            const flex = total > 0 ? c : { sanguis: 1, cholera: 1, melancholia: 1, phlegma: 1 };
            h += `<div style="display:flex; height:6px; border-radius:3px; overflow:hidden; margin-bottom:14px;">
                    <div style="flex:${flex.sanguis || 0.02}; background:var(--accent-wax);" title="${lang==='en'?'Blood':'Krev'} (${c.sanguis})"></div>
                    <div style="flex:${flex.cholera || 0.02}; background:var(--accent-gold);" title="${lang==='en'?'Yellow bile':'Žlutá žluč'} (${c.cholera})"></div>
                    <div style="flex:${flex.melancholia || 0.02}; background:var(--ink-secondary);" title="${lang==='en'?'Black bile':'Černá žluč'} (${c.melancholia})"></div>
                    <div style="flex:${flex.phlegma || 0.02}; background:#7a95a8;" title="${lang==='en'?'Phlegm':'Hlen'} (${c.phlegma})"></div>
                  </div>`;
        } else {
            h += `<div style="display:flex; height:6px; border-radius:3px; overflow:hidden; margin-bottom:14px;">
                    <div style="flex:1; background:var(--accent-wax);" title="${lang==='en'?'Blood':'Krev'}"></div>
                    <div style="flex:1; background:var(--accent-gold);" title="${lang==='en'?'Yellow bile':'Žlutá žluč'}"></div>
                    <div style="flex:1; background:var(--ink-secondary);" title="${lang==='en'?'Black bile':'Černá žluč'}"></div>
                    <div style="flex:1; background:#7a95a8;" title="${lang==='en'?'Phlegm':'Hlen'}"></div>
                  </div>`;
        }

        h += `<div style="padding:12px 15px; margin-bottom:16px; background:rgba(197,160,89,0.05); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-weight:bold; font-size:0.9rem; margin-bottom:6px;">🩺 Infirmarium</div>
                <div style="font-size:0.78rem; opacity:0.75;">${lang==='en'
                    ? (medicusPresent ? 'The Medicus reads each patient by their humors.' : 'The sick have their own hall and beds now. A Medicus would bring diagnosis.')
                    : (medicusPresent ? 'Medicus čte nemocné podle jejich humorů.' : 'Nemocní mají vlastní síň a lůžka. Medicus by přinesl diagnostiku.')}</div>
              </div>`;

        h += this._renderPatientsSection(lang);

        // Řada 4 stanovišť — dlaždice, ne seznam
        h += `<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">`;
        h += this._STATIONS.map(st => {
            const gated = !(GameState.researchedTechs && GameState.researchedTechs.includes(st.tech));
            const label = lang === 'en' ? st.name_en : st.name_cs;
            const count = (!gated && typeof Game !== 'undefined' && Game.conversiTaskCount) ? Game.conversiTaskCount(st.id) : 0;
            let statusText;
            if (gated) {
                const techDef = (typeof TechTree !== 'undefined') ? TechTree.find(t => t.id === st.tech) : null;
                const techName = techDef ? (lang==='en' ? techDef.name_en : techDef.name) : st.tech;
                statusText = `<span style="font-style:italic;">🔒 ${lang==='en'?'needs':'chybí'}: ${techName}</span>`;
            } else {
                statusText = count + '/2';
            }
            return `<div style="text-align:center; padding:10px 6px; border-radius:8px;
                        border:1px solid rgba(197,160,89,0.25);
                        background:rgba(197,160,89,0.05);
                        opacity:${gated ? '0.5' : '1'};">
                      <div style="font-size:1.4rem;">${st.icon}</div>
                      <div style="font-size:0.68rem; font-weight:bold; margin-top:4px;">${label}</div>
                      <div style="font-size:0.6rem; opacity:0.7; margin-top:2px;">${statusText}</div>
                    </div>`;
        }).join('');
        h += `</div>`;

        // Mnišský dohled — 4 role, jen Infirmarius má zatím funkci
        h += `<div style="font-size:0.68rem; font-weight:bold; opacity:0.6; text-transform:uppercase; letter-spacing:0.05em; margin:14px 0 6px;">${lang==='en'?'Monastic oversight':'Mnišský dohled'}</div>`;
        h += `<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">`;
        h += this._MONK_ROLES.map(r => {
            const brother = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).find(b => b.assignedTab === r.id);
            const label = lang==='en' ? r.name_en : r.name_cs;
            const statusText = brother ? brother.name : (lang==='en'?'vacant':'volné');
            return `<div style="text-align:center; padding:10px 6px; border-radius:8px;
                        border:1px solid rgba(197,160,89,0.25);
                        background:rgba(197,160,89,0.05);">
                      <div style="font-size:1.4rem;">${r.icon}</div>
                      <div style="font-size:0.68rem; font-weight:bold; margin-top:4px;">${label}</div>
                      <div style="font-size:0.6rem; opacity:0.7; margin-top:2px;">${statusText}</div>
                    </div>`;
        }).join('');
        h += `</div>`;

        return h;
    }
};