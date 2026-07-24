const PersonaSystem = {

    _activeTab: 'persona',

    ORIGINS: {
        merchant_son: {
            nameCs: 'Syn kupce',
            nameEn: "Merchant's Son",
            descCs: 'Vyrostl jsi na tržišti. Znáš cenu věcí a lidé jako Giacomo s tebou mluví jinak.',
            descEn: 'You grew up on the market square. You know the price of things, and men like Giacomo speak to you differently.',
            bonusCs: '+10 % prodejní ceny, Giacomo tě zná od začátku.',
            bonusEn: '+10% selling price, Giacomo knows you from the start.',
        },
        noble_scribe: {
            nameCs: 'Šlechtický písař',
            nameEn: 'Noble Scribe',
            descCs: 'Vychován v kanceláři. Pero ti sedí v ruce jako meč rytíři. Tvůj daily streak přináší více papíru a inkoustu.',
            descEn: 'Raised in a chancery. The quill fits your hand like a knight\'s sword. Your daily streak brings more paper and ink.',
            bonusCs: 'Daily streak: +1 papír + 1 inkoust navíc.',
            bonusEn: 'Daily streak: +1 extra paper + 1 ink.',
        },
        village_boy: {
            nameCs: 'Venkovský chlapec',
            nameEn: 'Village Boy',
            descCs: 'Přišel jsi bos a bez groše. Ale znáš půdu, byliny a zvířata lépe než kdokoli v klášteře.',
            descEn: 'You came barefoot and penniless. But you know soil, herbs and animals better than anyone in the monastery.',
            bonusCs: '+20 % výnos zahrady, Vigor se obnovuje rychleji.',
            bonusEn: '+20% garden yield, Vigor restores faster.',
        },
    },

    BIRTH_PLACES: ['Olomouc', 'Brno', 'Znojmo', 'Kroměříž', 'Uherské Hradiště', 'Přerov', 'Prostějov', 'Opava'],

    // ── Inicializace ─────────────────────────────────────────────────────────
    // Registrum Coenobii — denní anonymní vzorek na komunitní agregát
    // (Fáze 2, Varianta A). Žádné ID hráče, jen lux/umbra/weight/den.
    // Tiché selhání vždy — síťová chyba nesmí hráči nic zpomalit ani zobrazit.
    RANK_WEIGHT: { novitius: 1, frater: 2, armarius: 3, prior: 4 },

    reportRegistrumIfNewDay: function() {
        if (!GameState.persona) return;
        const today = new Date().toISOString().slice(0, 10);
        if (GameState.persona.registrumLastSent === today) return;
        GameState.persona.registrumLastSent = today; // nastavit hned — zabrání dalším pokusům tento den i při chybě sítě

        const reg = this.computeRegistrum();
        const rankTier = (GameState.rank && GameState.rank.monastic) || null;
        const weight = this.RANK_WEIGHT[rankTier] || 1;

        try {
            fetch('/api/registrum-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lux: reg.lux, umbra: reg.umbra, weight, day: today }),
            }).catch(() => {}); // tiché selhání — offline, výpadek, cokoliv
        } catch (e) { /* tiché selhání */ }
    },

    init: function() {
        if (!GameState.persona) {
            GameState.persona = {
                nameGiven: '', nameReligious: '', portrait: null,
                bornYear: 0, bornMonth: 0, bornDay: 0, bornPlace: '',
                origin: null, originChosen: false, originModalShown: false,
                milestones: [],
                influence: { benedikt: 0, giacomo: 0, abbot: 0 },
                professions: [],
            };
        }
        // Migrace — nová pole
        if (!GameState.persona.influence) GameState.persona.influence = { benedikt: 0, giacomo: 0, abbot: 0 };
        if (!GameState.persona.milestones) GameState.persona.milestones = [];
        if (!GameState.persona.professions) GameState.persona.professions = [];
        // Migrace v2 — rozšířená influence + role
        if (GameState.persona.influence.village  === undefined) GameState.persona.influence.village  = 0;
        if (GameState.persona.influence.church   === undefined) GameState.persona.influence.church   = 0;
        if (GameState.persona.influence.scholars === undefined) GameState.persona.influence.scholars = 0;
        if (GameState.persona.influence.mercatus === undefined) GameState.persona.influence.mercatus = 0;
        if (GameState.persona.influenceLastDecay === undefined) GameState.persona.influenceLastDecay = Date.now();
        if (GameState.persona.role               === undefined) GameState.persona.role               = null;
        // Migrace v3 — Mistr Bartoloměj (Starý Písař)
        if (GameState.persona.influence.bartolomej === undefined) GameState.persona.influence.bartolomej = 0;
        // Migrace v4 — Vrchnost (Studovna, studovna-vrchnost-mrd.md)
        if (GameState.persona.influence.vrchnost === undefined) GameState.persona.influence.vrchnost = 0;

        // Zkontrolovat zda zobrazit origin modal
        this.checkOriginModal();

        // Registrum Coenobii — denní vzorek na komunitní agregát (tiché selhání uvnitř)
        this.reportRegistrumIfNewDay();
    },

    checkOriginModal: function() {
        if (!GameState.persona) return;
        if (GameState.persona.originChosen) return;
        if (GameState.persona.originModalShown) return;

        const daysSinceStart = Math.floor(
            (Date.now() - (GameState.dailyRewards.lastLogin || Date.now())) / 86400000
        );
        const rankThreshold = GameState.rank &&
            ['antiquarius', 'rubricator', 'illuminator', 'master_scribe'].includes(GameState.rank.secular);

        if (daysSinceStart >= 7 || rankThreshold) {
            GameState.persona.originModalShown = true;
            Game.save();
            // Počkat až se zavře daily reward modal
            const _waitForReward = () => {
                const dr = document.getElementById('daily-reward-modal');
                if (dr && dr.style.display !== 'none') {
                    setTimeout(_waitForReward, 500);
                } else {
                    setTimeout(() => PersonaSystem.showOriginModal(), 400);
                }
            };
            setTimeout(_waitForReward, 800);
        }
    },

    showOriginModal: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const modal = document.createElement('div');
        modal.id = 'persona-origin-modal';
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;`;

        let opts = Object.entries(this.ORIGINS).map(([id, o]) => `
            <div data-origin="${id}"
                 style="cursor:pointer;padding:14px;margin-bottom:10px;border:2px solid rgba(197,160,89,0.3);border-radius:8px;background:rgba(197,160,89,0.05);transition:border-color 0.2s;"
                 onmouseover="this.style.borderColor='var(--accent-gold)'"
                 onmouseout="this.style.borderColor='rgba(197,160,89,0.3)'">
                <div style="font-weight:bold;font-size:0.95rem;margin-bottom:4px;">${lang==='en'?o.nameEn:o.nameCs}</div>
                <div style="font-size:0.82rem;opacity:0.8;margin-bottom:6px;font-style:italic;">${lang==='en'?o.descEn:o.descCs}</div>
                <div style="font-size:0.78rem;color:var(--accent-gold);">✨ ${lang==='en'?o.bonusEn:o.bonusCs}</div>
            </div>`).join('');

        modal.innerHTML = `
            <div style="background:#f5efe0;border:1px solid var(--accent-gold);border-radius:12px;padding:24px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
                <div style="font-size:1.6rem;text-align:center;margin-bottom:8px;">📜</div>
                <h3 style="text-align:center;margin:0 0 6px 0;font-family:'Cinzel',serif;">${lang==='en'?'Who art thou, Scribe?':'Kdo jsi, písaři?'}</h3>
                <p style="text-align:center;font-size:0.83rem;opacity:0.7;margin:0 0 18px 0;font-style:italic;">
                    ${lang==='en'?'Your origin shapes your path. Choose once — cannot be undone.':'Tvůj původ formuje cestu. Vybereš jednou — nelze vrátit.'}
                </p>
                ${opts}
                <div style="text-align:center;margin-top:12px;">
                    <button id="persona-origin-later" class="craft-btn" style="background:rgba(0,0,0,0.1);font-size:0.8rem;">
                        ${lang==='en'?'Decide later':'Rozhodnu se později'}
                    </button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        // Event listenery — bezpečnější než inline onclick
        modal.querySelectorAll('[data-origin]').forEach(el => {
            el.addEventListener('click', () => {
                PersonaSystem.chooseOrigin(el.dataset.origin);
            });
        });
        document.getElementById('persona-origin-later').addEventListener('click', () => {
            modal.remove();
        });
    },

    chooseOrigin: function(originId) {
        if (!this.ORIGINS[originId]) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Generovat datum narození
        const year = 1430 + Math.floor(Math.random() * 18);
        const month = 1 + Math.floor(Math.random() * 12);
        const day = 1 + Math.floor(Math.random() * 28);
        const place = this.BIRTH_PLACES[Math.floor(Math.random() * this.BIRTH_PLACES.length)];

        GameState.persona.origin = originId;
        GameState.persona.originChosen = true;
        GameState.persona.bornYear = year;
        GameState.persona.bornMonth = month;
        GameState.persona.bornDay = day;
        GameState.persona.bornPlace = place;

        Game.save();

        // Zavřít modal
        const modal = document.getElementById('persona-origin-modal');
        if (modal) modal.remove();

        const o = this.ORIGINS[originId];
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.panel('📜 ' + (lang==='en'?'Origin chosen: ':'Původ zvolen: ') + (lang==='en'?o.nameEn:o.nameCs), 'system');
        }

        // Re-render pokud je Persona tab otevřen
        const el = document.getElementById('lore-persona-content');
        if (el && el.style.display !== 'none') this.render();
    },

    // ── Hlavní render ─────────────────────────────────────────────────────────
    render: function() {
        const el = document.getElementById('lore-persona-content');
        if (!el) return;
        this.init();

        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        // Filter bar
        let h = `<div class="filter-bar" style="margin-bottom:16px;display:flex;gap:6px;flex-wrap:wrap;">
            <button id="persona-tab-persona" class="filter-btn ${this._activeTab==='persona'?'active':''}"
                onclick="PersonaSystem.switchTab('persona',this)">🧑 ${lang==='en'?'Persona':'Persona'}</button>
            <button id="persona-tab-vigor" class="filter-btn ${this._activeTab==='vigor'?'active':''}"
                onclick="PersonaSystem.switchTab('vigor',this)">⚡ Vigor</button>
            <button id="persona-tab-valetudo" class="filter-btn ${this._activeTab==='valetudo'?'active':''}"
                onclick="PersonaSystem.switchTab('valetudo',this)">🩺 Valetudo</button>
            <button id="persona-tab-stats" class="filter-btn ${this._activeTab==='stats'?'active':''}"
                onclick="PersonaSystem.switchTab('stats',this)">📊 ${lang==='en'?'Statistics':'Statistiky'}</button>
            <button id="persona-tab-influentia" class="filter-btn ${this._activeTab==='influentia'?'active':''}"
                onclick="PersonaSystem.switchTab('influentia',this)">🤝 ${lang==='en'?'Influentia':'Influentia'}</button>
            <button id="persona-tab-professio" class="filter-btn ${this._activeTab==='professio'?'active':''}"
                onclick="PersonaSystem.switchTab('professio',this)">⚒️ ${lang==='en'?'Professio':'Professio'}</button>
            <button id="persona-tab-felis" class="filter-btn ${this._activeTab==='felis'?'active':''}"
                onclick="PersonaSystem.switchTab('felis',this)">🐈‍⬛ Felis</button>
        </div>`;

        h += `<div id="persona-subtab-persona"  style="${this._activeTab==='persona'?'':'display:none'}">` + this._renderPersona(lang) + `</div>`;
        h += `<div id="persona-subtab-vigor"    style="${this._activeTab==='vigor'?'':'display:none'}">` + this._renderVigor(lang) + `</div>`;
        h += `<div id="persona-subtab-valetudo" style="${this._activeTab==='valetudo'?'':'display:none'}">` + this._renderValetudo(lang) + `</div>`;
        h += `<div id="persona-subtab-stats"    style="${this._activeTab==='stats'?'':'display:none'}">` + this._renderStats(lang) + `</div>`;
        h += `<div id="persona-subtab-influentia" style="${this._activeTab==='influentia'?'':'display:none'}">` + this._renderInfluentia(lang) + `</div>`;
        h += `<div id="persona-subtab-professio" style="${this._activeTab==='professio'?'':'display:none'}">` + this._renderProfessio(lang) + `</div>`;
        h += `<div id="persona-subtab-felis" style="${this._activeTab==='felis'?'':'display:none'}">` + this._renderFelis(lang) + `</div>`;

        el.innerHTML = h;
    },

    switchTab: function(tab, btn) {
        this._activeTab = tab;
        document.querySelectorAll('#lore-persona-content .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        ['persona','vigor','valetudo','stats','influentia','professio','felis'].forEach(t => {
            const d = document.getElementById('persona-subtab-' + t);
            if (d) d.style.display = t === tab ? '' : 'none';
        });
    },

    // ── Sekce 1: Persona ─────────────────────────────────────────────────────
    _renderPersona: function(lang) {
        const p = GameState.persona;
        const rank = GameState.rank ? GameState.rank.secular : 'laicus';
        const rankHigh = ['antiquarius','rubricator','illuminator','master_scribe','prior','abbas'].includes(rank);

        // Portrét
        const portraitHtml = p.portrait
            ? `<img src="${p.portrait}" style="width:96px;height:96px;object-fit:cover;border-radius:6px;border:2px solid var(--accent-gold);background:var(--bg-parchment);">`
            : `<div style="width:96px;height:96px;border:2px dashed rgba(197,160,89,0.4);border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:0.6rem;line-height:1.2;white-space:pre;opacity:0.6;">  ___\n /   \\\n| o o |\n|  &gt;  |\n \\___/</div>`;

        // Datum narození
        const birthHtml = p.bornYear
            ? `<div style="font-size:0.82rem;opacity:0.7;margin-top:8px;font-style:italic;">
                ${lang==='en'?'Born':'Natus'}: ${p.bornDay}. ${p.bornMonth}. ${p.bornYear}, ${p.bornPlace}
               </div>`
            : '';

        // Původ
        const originHtml = p.originChosen && p.origin
            ? `<div style="margin-top:8px;padding:8px 10px;background:rgba(197,160,89,0.08);border-left:3px solid var(--accent-gold);border-radius:4px;font-size:0.82rem;">
                <strong>${lang==='en'?'Origin':'Původ'}:</strong> ${lang==='en'?this.ORIGINS[p.origin].nameEn:this.ORIGINS[p.origin].nameCs}<br>
                <span style="opacity:0.7;">✨ ${lang==='en'?this.ORIGINS[p.origin].bonusEn:this.ORIGINS[p.origin].bonusCs}</span>
               </div>`
            : `<div style="margin-top:8px;">
                <button class="craft-btn" onclick="PersonaSystem.showOriginModal()" style="font-size:0.8rem;">
                    📜 ${lang==='en'?'Choose your origin':'Zvolit původ'}
                </button>
                ${!rankHigh ? `<div style="font-size:0.75rem;opacity:0.55;margin-top:4px;font-style:italic;">${lang==='en'?'Bonuses activate at rank Antiquarius+':'Bonusy se aktivují od ranku Antiquarius+'}</div>` : ''}
               </div>`;

        // Rank timeline
        const rankHistory = (GameState.rank && GameState.rank.rankHistory) || [];
        const currentRank = GameState.rank ? GameState.rank.secular : 'laicus';
        const validHistory = rankHistory.filter(r => r.rank && r.timestamp && r.timestamp > 1000000);
        const timelineHtml = validHistory.length > 0
            ? validHistory.map(r => `<div style="font-size:0.78rem;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
                <span style="opacity:0.5;">${new Date(1465, new Date(r.timestamp).getMonth(), new Date(r.timestamp).getDate()).toLocaleDateString()}</span>
                &nbsp;→&nbsp;<strong>${r.rank}</strong>
              </div>`).join('')
            : `<div style="font-size:0.82rem;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
                <span style="opacity:0.5;">${lang==='en'?'Now':'Nyní'}</span>
                &nbsp;→&nbsp;<strong>${currentRank}</strong>
               </div>
               <div style="font-size:0.78rem;opacity:0.5;font-style:italic;margin-top:4px;">${lang==='en'?'Full history records from next rank onward.':'Plná historie od příštího ranku.'}</div>`;

        return `
        <div style="display:grid;grid-template-columns:110px 1fr;gap:16px;margin-bottom:20px;">
            <div>
                ${portraitHtml}
                <div style="margin-top:8px;">
                    <label class="craft-btn" style="cursor:pointer;font-size:0.75rem;padding:4px 8px;display:block;text-align:center;">
                        📤 ${lang==='en'?'Upload':'Nahrát'}
                        <input type="file" accept="image/*" onchange="PersonaSystem.uploadPortrait(this.files[0])" style="display:none;">
                    </label>
                    ${p.portrait ? `<button onclick="PersonaSystem.removePortrait()" class="craft-btn" style="font-size:0.72rem;padding:3px 8px;margin-top:4px;width:100%;background:#8b4a3a;">🗑️</button>` : ''}
                </div>
            </div>
            <div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:0.8rem;font-weight:bold;display:block;margin-bottom:4px;">${lang==='en'?'Nomen:':'Nomen:'}</label>
                    <div style="display:flex;gap:6px;">
                        <input type="text" id="persona-name-input" value="${p.nameGiven||''}"
                            placeholder="${lang==='en'?'Johannes de Praga':'Johannes de Praga'}"
                            style="flex:1;padding:6px 8px;border:1px solid rgba(0,0,0,0.2);border-radius:4px;font-family:'Cinzel',serif;font-size:0.85rem;">
                        <button onclick="PersonaSystem.saveName()" class="craft-btn" style="padding:6px 12px;">💾</button>
                    </div>
                </div>
                ${rankHigh ? `<div style="margin-bottom:12px;">
                    <label style="font-size:0.8rem;font-weight:bold;display:block;margin-bottom:4px;">✝️ ${lang==='en'?'Nomen religiosum:':'Nomen religiosum:'}</label>
                    <div style="display:flex;gap:6px;">
                        <input type="text" id="persona-name-rel-input" value="${p.nameReligious||''}"
                            placeholder="${lang==='en'?'Frater Benedictus':'Frater Benedictus'}"
                            style="flex:1;padding:6px 8px;border:1px solid rgba(0,0,0,0.2);border-radius:4px;font-family:'Cinzel',serif;font-size:0.85rem;">
                        <button onclick="PersonaSystem.saveReligiousName()" class="craft-btn" style="padding:6px 12px;">💾</button>
                    </div>
                </div>` : ''}
                <div style="padding:8px 10px;background:rgba(197,160,89,0.08);border-left:3px solid var(--accent-gold);border-radius:4px;font-size:0.85rem;margin-bottom:8px;">
                    <strong>${lang==='en'?'Nomen completum:':'Nomen completum:'}</strong><br>
                    <span style="font-family:'Cinzel',serif;">${p.nameReligious||p.nameGiven||'Anonymus'}</span>
                </div>
                ${birthHtml}
                ${originHtml}
            </div>
        </div>
        <div style="margin-top:16px;">
            <div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;margin-bottom:8px;">📜 ${lang==='en'?'Cursus Vitae':'Cursus Vitae'}</div>
            ${timelineHtml}
        </div>
        ${this._renderNextRankProgress(lang)}
        ${this._renderMonasticPath(lang)}`;
    },

    // ── Cursus Monasticus — klášterní dráha (odděleně od světské) ───────────
    _renderMonasticPath: function(lang) {
        const monasticId = GameState.rank && GameState.rank.monastic;
        if (!monasticId) {
            const tier = (typeof RankSystem !== 'undefined') ? RankSystem.getSecularRankTier() : 1;
            if (tier >= 3) {
                return `<div style="margin-top:14px;padding:10px 12px;background:rgba(197,160,89,0.06);border-left:3px solid var(--accent-gold);border-radius:4px;font-size:0.82rem;">
                    <div style="opacity:0.75;margin-bottom:8px;font-style:italic;">${lang==='en'?'The monastery would accept you.':'Klášter by tě přijal.'}</div>
                    <button class="craft-btn" style="width:100%;" onclick="RankSystem.enterMonasticPath(); PersonaSystem.render();">${t('rank.monasticEntry')}</button>
                </div>`;
            }
            return `<div style="margin-top:14px;padding:10px 12px;background:rgba(197,160,89,0.06);border-left:3px solid var(--accent-gold);border-radius:4px;font-size:0.82rem;opacity:0.65;font-style:italic;">
                ${lang==='en'?'Not yet on the monastic path.':'Zatím mimo klášterní dráhu.'}
            </div>`;
        }
        const rankDef = (typeof RankSystem !== 'undefined' && RankSystem.monastic) ? RankSystem.monastic.find(r => r.id === monasticId) : null;
        const icon = rankDef ? rankDef.icon : '✝️';
        const name = (typeof RankSystem !== 'undefined' && RankSystem.getRankName) ? RankSystem.getRankName(monasticId) : monasticId;
        const desc = (typeof RankSystem !== 'undefined' && RankSystem.getRankDesc) ? RankSystem.getRankDesc(monasticId) : '';
        return `<div style="margin-top:16px;">
            <div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;margin-bottom:8px;">✝️ Cursus Monasticus</div>
            <div style="padding:12px;background:rgba(197,160,89,0.06);border:1px solid rgba(197,160,89,0.2);border-radius:8px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    <span style="font-size:1.3rem;">${icon}</span>
                    <strong style="font-size:0.9rem;">${name}</strong>
                </div>
                <div style="font-size:0.8rem;opacity:0.75;font-style:italic;">${desc}</div>
            </div>
        </div>`;
    },

    // ── Progress k příštímu ranku ────────────────────────────────────────────
    _renderNextRankProgress: function(lang) {
        if (typeof RankSystem === 'undefined') return '';
        const currentTier = RankSystem.getSecularRankTier();
        const nextRank = RankSystem.secular[currentTier]; // tier je 1-based, pole 0-based
        if (!nextRank) {
            return `<div style="margin-top:14px;padding:10px 12px;background:rgba(197,160,89,0.08);border-left:3px solid var(--accent-gold);border-radius:4px;font-size:0.82rem;opacity:0.75;font-style:italic;">
                ${lang==='en'?'Maximum secular rank reached.':'Nejvyšší světský rank dosažen.'}
            </div>`;
        }

        const rc = GameState.achievements?.stats?.researchCount || 0;
        const techs = GameState.researchedTechs || [];
        const inv = GameState.inventory || {};
        const nid = nextRank.id;

        // Sestavit checklist podmínek pro každý rank
        const checks = [];
        if (nid === 'librarius') {
            checks.push({ label: lang==='en'?`Research ${rc}/5`:`Research ${rc}/5`, done: rc >= 5 });
        } else if (nid === 'antiquarius') {
            checks.push({ label: lang==='en'?`Research ${rc}/15`:`Research ${rc}/15`, done: rc >= 15 });
            checks.push({ label: lang==='en'?`Technologies ${techs.length}/2`:`Technologie ${techs.length}/2`, done: techs.length >= 2 });
        } else if (nid === 'rubricator') {
            const hasIllum = techs.includes('tech_illumination');
            const hasInk = (inv['ink_gallic'] || 0) > 0;
            checks.push({ label: lang==='en'?'Tech: Illumination':'Tech: Iluminace', done: hasIllum });
            checks.push({ label: lang==='en'?'Gallic ink in inventory':'Gallic ink na skladě', done: hasInk });
        } else if (nid === 'illuminator') {
            const hasIllum = techs.includes('tech_illumination');
            const hasVellum = (inv['vellum_codex'] || 0) > 0;
            checks.push({ label: lang==='en'?'Tech: Illumination':'Tech: Iluminace', done: hasIllum });
            checks.push({ label: lang==='en'?'Vellum codex in inventory':'Vellum codex na skladě', done: hasVellum });
            checks.push({ label: lang==='en'?`Research ${rc}/25`:`Research ${rc}/25`, done: rc >= 25 });
        } else if (nid === 'stationarius') {
            const hasSeal = (inv['bishop_seal'] || 0) > 0;
            checks.push({ label: lang==='en'?'Bishop seal in inventory':'Bishop seal na skladě', done: hasSeal });
            checks.push({ label: lang==='en'?`Research ${rc}/40`:`Research ${rc}/40`, done: rc >= 40 });
        }

        if (!checks.length) return '';

        const doneCnt = checks.filter(c => c.done).length;
        const pct = Math.round((doneCnt / checks.length) * 100);
        const nextName = RankSystem.getRankName ? RankSystem.getRankName(nid) : nid;
        const nextIcon = nextRank.icon || '📜';

        const checkRows = checks.map(c => `
            <div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;padding:3px 0;">
                <span style="color:${c.done ? '#5a9a5a' : 'rgba(0,0,0,0.3)'};">${c.done ? '✓' : '○'}</span>
                <span style="opacity:${c.done ? '1' : '0.55'};">${c.label}</span>
            </div>`).join('');

        return `<div style="margin-top:14px;padding:12px;background:rgba(197,160,89,0.06);border:1px solid rgba(197,160,89,0.2);border-radius:8px;">
            <div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;margin-bottom:8px;">
                ${lang==='en'?'Path to next rank':'Cesta k příštímu ranku'}: ${nextIcon} ${nextName}
            </div>
            ${checkRows}
            <div style="margin-top:10px;">
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;opacity:0.6;margin-bottom:4px;">
                    <span>${lang==='en'?'Progress':'Postup'}</span><span>${pct} %</span>
                </div>
                <div style="height:6px;background:rgba(0,0,0,0.1);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:${pct >= 100 ? '#5a9a5a' : 'var(--accent-gold)'};border-radius:3px;transition:width 0.5s;"></div>
                </div>
            </div>
        </div>`;
    },

    // ── Vigor tab ─────────────────────────────────────────────────────────────
    _renderVigor: function(lang) {
        if (typeof VigorSystem === 'undefined') return '<p>VigorSystem not loaded.</p>';
        return VigorSystem.renderFullDisplay();
    },

    // ── Valetudo tab (Health System) ─────────────────────────────────────────
    _renderValetudo: function(lang) {
        const active = (GameState.health && GameState.health.active) || {};
        const everHad = (GameState.health && GameState.health.everHad) || [];
        const activeIds = Object.keys(active);
        const now = Date.now();

        // ── Sekce A: status nahoře — "Jsi zdráv" NEBO aktivní nemoci s plným
        // detailem (příčina, advice, cures). ──
        let statusHtml;
        if (activeIds.length === 0) {
            statusHtml = `<div style="text-align:center;padding:24px 12px;opacity:0.7;">
                <div style="font-size:2.4rem;margin-bottom:8px;">💚</div>
                <div>${lang==='en' ? 'Healthy. No ailments.' : 'Zdráv. Žádné neduhy.'}</div>
            </div>`;
        } else {
            const infTimer = GameState.infirmaryTimer;
            const cards = activeIds.map(id => {
                const def = (typeof HealthConditionsDB !== 'undefined') ? HealthConditionsDB[id] : null;
                if (!def) return '';
                const inst = active[id];
                const name = lang === 'en' ? def.name_en : def.name;
                const desc = lang === 'en' ? def.desc_en : def.desc;
                const advice = lang === 'en' ? def.advice_en : def.advice;
                const hoursLeft = Math.max(0, Math.round((inst.expiresAt - now) / 3600000));
                const cureNames = (def.cures || []).map(cid => (typeof iName === 'function' ? iName(cid) : cid)).join(' / ');
                const cureLine = cureNames
                    ? `<div style="font-size:0.78rem;opacity:0.7;margin-top:6px;">${lang==='en'?'Cured by':'Léčí'}: ${cureNames}</div>`
                    : `<div style="font-size:0.78rem;opacity:0.5;margin-top:6px;font-style:italic;">${lang==='en'?'No cure — will pass naturally':'Bez léku — jen doběhne'}</div>`;

                // Infirmerie (titivillus-infirmary-mrd) — jen pro infirmaryEligible nemoci
                let infirmaryLine = '';
                if (def.infirmaryEligible) {
                    if (infTimer && infTimer.conditionId === id) {
                        const remainMs = Math.max(0, infTimer.endTime - now);
                        const hh = String(Math.floor(remainMs / 3600000)).padStart(2, '0');
                        const mm = String(Math.floor((remainMs % 3600000) / 60000)).padStart(2, '0');
                        infirmaryLine = `<div style="font-size:0.75rem;margin-top:8px;padding:6px 8px;background:rgba(0,0,0,0.05);border-radius:5px;">🛏️ ${lang==='en'?'Resting in the infirmary — ':'Odpočíváš v infirmerii — '}${hh}:${mm}</div>`;
                    } else if (infTimer) {
                        infirmaryLine = `<div style="font-size:0.72rem;margin-top:8px;opacity:0.5;font-style:italic;">${lang==='en'?'Infirmary occupied.':'Infirmerie obsazená.'}</div>`;
                    } else {
                        const hasSalve = (GameState.inventory['unguentum_calidum'] || 0) > 0;
                        infirmaryLine = `<button onclick="HealthSystem.enterInfirmary('${id}')" class="craft-btn" style="margin-top:8px; font-size:0.75rem;" ${hasSalve ? '' : 'disabled'}>
                            🛏️ ${lang==='en'?'Go to the infirmary (1× Warming Salve, 24h)':'Do infirmerie (1× Hřejivá mast, 24h)'}
                        </button>`;
                    }
                }

                // Haeresis Occulta MRD — Cesta B, dedikovaná mimo villager zpověď
                let confessLine = '';
                if (id === 'haeresis_occulta') {
                    confessLine = `<button onclick="Game.confessHeresy()" class="craft-btn" style="margin-top:8px; font-size:0.75rem;">
                        🙏 ${lang==='en'?'Confess to the Abbot':'Vyznat se opatovi'}
                    </button>`;
                }

                return `<div style="padding:12px 14px;margin-bottom:10px;background:rgba(197,160,89,0.08);border-left:3px solid var(--accent-gold);border-radius:6px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong>${def.icon} ${name}</strong>
                        <span style="font-size:0.8rem;opacity:0.7;">${lang==='en'?`${hoursLeft}h left`:`zbývá ${hoursLeft}h`}</span>
                    </div>
                    <div style="font-size:0.85rem;opacity:0.8;margin-top:4px;">${desc}</div>
                    ${advice ? `<div style="font-size:0.78rem;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(197,160,89,0.3);"><strong>${lang==='en'?'What to do:':'Co dělat:'}</strong> ${advice}</div>` : ''}
                    ${cureLine}
                    ${infirmaryLine}
                    ${confessLine}
                </div>`;
            }).join('');
            statusHtml = `<div>${cards}</div>`;
        }

        // ── Sekce B: encyklopedie dole — všech 12 nemocí. Zažité (everHad)
        // mají plný profil, nezažité jen krátký teaser (causeShort). ──
        let encyclopediaHtml = '';
        if (typeof HealthConditionsDB !== 'undefined') {
            const allIds = Object.keys(HealthConditionsDB);
            const rows = allIds.map(id => {
                const def = HealthConditionsDB[id];
                const name = lang === 'en' ? def.name_en : def.name;
                const hasExperienced = everHad.includes(id);
                if (hasExperienced) {
                    const desc = lang === 'en' ? def.desc_en : def.desc;
                    const advice = lang === 'en' ? def.advice_en : def.advice;
                    const cureNames = (def.cures || []).map(cid => (typeof iName === 'function' ? iName(cid) : cid)).join(' / ');
                    return `<div style="padding:8px 10px;margin-bottom:6px;background:rgba(0,0,0,0.03);border-radius:5px;">
                        <div style="font-size:0.82rem;"><strong>${def.icon} ${name}</strong></div>
                        <div style="font-size:0.74rem;opacity:0.75;margin-top:2px;">${desc}</div>
                        ${advice ? `<div style="font-size:0.72rem;opacity:0.65;margin-top:3px;"><em>${lang==='en'?'Advice:':'Rada:'}</em> ${advice}</div>` : ''}
                        ${cureNames ? `<div style="font-size:0.7rem;opacity:0.55;margin-top:2px;">${lang==='en'?'Cured by':'Léčí'}: ${cureNames}</div>` : ''}
                    </div>`;
                } else {
                    const causeShort = lang === 'en' ? def.causeShort_en : def.causeShort;
                    return `<div style="padding:6px 10px;margin-bottom:6px;background:rgba(0,0,0,0.02);border-radius:5px;opacity:0.55;">
                        <div style="font-size:0.78rem;"><strong>${def.icon} ${lang==='en'?'???':'???'}</strong></div>
                        <div style="font-size:0.7rem;font-style:italic;margin-top:2px;">${causeShort || ''}</div>
                    </div>`;
                }
            }).join('');
            encyclopediaHtml = `<div style="margin-top:16px;">
                <div style="font-size:0.72rem;font-weight:bold;opacity:0.7;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em;border-top:1px solid rgba(197,160,89,0.3);padding-top:10px;">
                    ${lang==='en'?'Compendium of Ailments':'Kompendium neduhů'} (${everHad.length}/${allIds.length})
                </div>
                ${rows}
            </div>`;
        }

        return statusHtml + encyclopediaHtml;
    },

    // ── Sekce 2: Statistiky ──────────────────────────────────────────────────
    _renderStats: function(lang) {
        const stats = (GameState.achievements && GameState.achievements.stats) || {};
        const booksRead = GameState.library ? GameState.library.readBooks.length : 0;
        const booksUnlocked = GameState.library ? GameState.library.unlockedBooks.length : 0;
        const totalBooks = (typeof LibraryDB !== 'undefined') ? LibraryDB.books.length : 0;
        const techCount = (GameState.researchedTechs || []).length;
        const totalTechs = (typeof TechTree !== 'undefined') ? TechTree.length : 0;
        const streak = GameState.dailyRewards ? GameState.dailyRewards.streak : 0;
        const totalLogins = GameState.dailyRewards ? GameState.dailyRewards.totalLogins : 0;

        const stat = (icon, labelKey, value) => `
            <div style="padding:10px;background:var(--bg-card);border:1px solid rgba(197,160,89,0.2);border-radius:6px;">
                <div style="font-size:1.1rem;">${icon}</div>
                <div style="font-size:0.72rem;opacity:0.65;margin:2px 0;">${labelKey}</div>
                <div style="font-size:1.1rem;font-weight:bold;color:var(--accent-gold);">${value}</div>
            </div>`;

        let h = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">`;
        h += stat('📦', lang==='en'?'Items discovered':'Předměty objeveny', Object.keys(GameState.inventory||{}).length);
        const craftedTotal = GameState.craftedItems ? Object.values(GameState.craftedItems).reduce((a,b) => a+b, 0) : 0;
        h += stat('⚒️', lang==='en'?'Crafts':'Výroba', craftedTotal);
        h += stat('📥', lang==='en'?'Items obtained':'Získané předměty', stats.itemsCrafted||0);
        h += stat('📜', lang==='en'?'Research gained':'Research získáno', stats.researchCount||0);
        h += stat('🔬', lang==='en'?'Technologies':'Technologie', `${techCount}/${totalTechs}`);
        h += stat('📚', lang==='en'?'Books read':'Knihy přečtené', `${booksRead}/${totalBooks}`);
        h += stat('🔓', lang==='en'?'Books unlocked':'Knihy odemčeny', `${booksUnlocked}/${totalBooks}`);
        h += stat('🌾', lang==='en'?'Harvests':'Sklizně', stats.harvests||0);
        h += stat('🎮', lang==='en'?'Games won':'Hry vyhráno', stats.totalGamesPlayed||0);
        h += stat('🍖', lang==='en'?'Meals eaten':'Jídel snězeno', stats.mealsEaten||0);
        h += stat('🕯️', lang==='en'?'Candles lit':'Svíčky zapáleny', stats.candlesLit||0);
        h += stat('💧', lang==='en'?'Water drawn':'Voda načerpána', stats.waterDrawn||0);
        h += stat('🔥', lang==='en'?'Streak':'Streak', `${streak} ${lang==='en'?'days':'dní'} (max: ${stats.maxStreak||streak})`);
        h += stat('📅', lang==='en'?'Total logins':'Celkem přihlášení', totalLogins);
        h += stat('⏳', lang==='en'?'Days in monastery':'Dní v klášteře', Math.max(totalLogins-1,0));
        h += `</div>`;

        // Záloha save
        h += `<div style="margin-top:20px;padding:14px;background:rgba(0,0,0,0.04);border-radius:8px;border:1px solid rgba(197,160,89,0.2);">
            <div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;margin-bottom:8px;">💾 ${lang==='en'?'Save Backup':'Záloha Save'}</div>
            <button class="craft-btn" onclick="Game.exportSave()" style="font-size:0.82rem;margin-right:8px;">📤 ${lang==='en'?'Export':'Export'}</button>
            <button class="craft-btn" onclick="Game.triggerImport()" style="font-size:0.82rem;">📥 ${lang==='en'?'Import':'Import'}</button>
        </div>`;

        return h;
    },

    // ── Sekce 3: Influentia ──────────────────────────────────────────────────
    _renderInfluentia: function(lang) {
        const inf = (GameState.persona && GameState.persona.influence) || {};

        const bar = (icon, name, value, desc, locked) => {
            const pct = Math.min(100, Math.round(value || 0));
            const color = pct >= 75 ? '#5a9a5a' : pct >= 40 ? 'var(--accent-gold)' : 'var(--ink-secondary)';
            const opacity = locked ? 'opacity:0.42;' : '';
            const lockBadge = locked
                ? `<span style="font-size:0.72rem;opacity:0.6;font-style:italic;">${lang==='en'?'unlock via activity':'odemkne aktivitou'}</span>`
                : `<strong style="color:${color};">${pct}/100</strong>`;
            return `<div style="margin-bottom:12px;padding:12px;background:var(--bg-card);border:1px solid rgba(197,160,89,0.2);border-radius:8px;${opacity}">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:1.3rem;">${icon}</span>
                    <div style="flex:1;">
                        <div style="font-weight:bold;font-size:0.88rem;">${name}</div>
                        <div style="font-size:0.74rem;opacity:0.65;font-style:italic;">${desc}</div>
                    </div>
                    ${lockBadge}
                </div>
                <div style="height:5px;background:rgba(0,0,0,0.1);border-radius:3px;">
                    <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width 0.4s;"></div>
                </div>
            </div>`;
        };

        let h = `<div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin-bottom:10px;">${lang==='en'?'NPC relations':'Vztahy s NPC'}</div>`;

        h += bar('🖋️', lang==='en'?'Master Bartoloměj':'Mistr Bartoloměj',
            inf.bartolomej,
            lang==='en'?'Old scribe — high influence → choose a specific book, deeper personal stories.':'Starý písař — vysoký vliv → výběr konkrétní knihy, hlubší osobní příběhy.', false);
        h += bar('🏠', lang==='en'?'Benedikt of Litomyšl':'Benedikt z Litomyšle',
            inf.benedikt,
            lang==='en'?'Cellarius — high influence → better prices in Hospoda.':'Cellarius — vysoký vliv → lepší ceny v Hospodě.', false);
        h += bar('⚓', lang==='en'?'Giacomo Foscari':'Giacomo Foscari',
            (GameState.contactRelation || {}).giacomo || 0,
            lang==='en'?'Venetian merchant — high influence → rare goods, special orders.':'Benátský obchodník — vysoký vliv → vzácné zboží, speciální zakázky.', false);
        h += bar('✝️', lang==='en'?'The Abbot':'Opat',
            inf.abbot,
            lang==='en'?'Father of the monastery — Scrinium access, rank advancement.':'Otec kláštera — přístup do Scrinia, postup v ranku.', false);

        h += `<div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin:14px 0 10px;">${lang==='en'?'Faction relations':'Vztahy s frakcemi'}</div>`;

        h += bar('🌾', lang==='en'?'Village':'Vesnice',
            inf.village || 0,
            lang==='en'?'Saeculum / Kontakt se Vsí — unlocks village events and supply chains.':'Saeculum / Kontakt se Vsí — odemkne vesnicové eventy a dodávky.', (inf.village || 0) === 0);
        h += bar('⛪', lang==='en'?'Church':'Církev',
            inf.church || 0,
            lang==='en'?'Inquisition severity, bishop commissions, liturgical events.':'Závažnost inkvizice, biskupské zakázky, liturgické eventy.', (inf.church || 0) === 0);
        h += bar('📖', lang==='en'?'Scholars':'Učenci',
            inf.scholars || 0,
            lang==='en'?'Prvotisk customers, Library bonuses, manuscript reputation.':'Zákazníci Prvotisku, bonusy Knihovny, reputace rukopisů.', (inf.scholars || 0) === 0);

        h += `<div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin:14px 0 10px;">${lang==='en'?'Inner life':'Vnitřní život'}</div>`;
        h += bar('🙏', lang==='en'?'Piety':'Zbožnost',
            (GameState.persona && GameState.persona.zboznost) || 0,
            lang==='en'?'Personal, inward — distinct from Church (institutional). Grows through Mass, confession, quiet endurance.':'Osobní, vnitřní — odlišné od Církve (institucionální). Roste mší, zpovědí, tichou vytrvalostí.', false);

        // Clientela — jen promítnutí souhrnu; ovládání a jednání probíhá v Saeculum → Clientela
        const clientelaTier = (typeof RankSystem !== 'undefined' && RankSystem.getSecularRankTier) ? RankSystem.getSecularRankTier() : 1;
        if (clientelaTier >= 3 && typeof ContactsDB !== 'undefined') {
            const rel = GameState.contactRelation || {};
            const researched = GameState.researchedTechs || [];
            h += `<div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin:14px 0 10px;">${lang==='en'?'Clientela — contacts':'Clientela — kontakty'}</div>`;
            let lockedCount = 0;
            Object.keys(ContactsDB).forEach(id => {
                const c = ContactsDB[id];
                const unlocked = (!c.unlockTech || researched.includes(c.unlockTech))
                              && (!c.unlockBook || (GameState.library && GameState.library.readBooks && GameState.library.readBooks.includes(c.unlockBook)));
                if (!unlocked) { lockedCount++; return; }
                const r = Math.min(100, Math.round(rel[id] || 0));
                const rColor = r >= 75 ? '#5a9a5a' : r >= 40 ? 'var(--accent-gold)' : 'var(--ink-secondary)';
                h += `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;margin-bottom:5px;background:var(--bg-card);border:1px solid rgba(197,160,89,0.15);border-radius:6px;">
                    <span style="font-size:1.05rem;">${c.icon}</span>
                    <span style="font-size:0.8rem;flex:0 0 110px;">${lang==='en'?c.name_en:c.name}</span>
                    <div style="flex:1;height:4px;background:rgba(0,0,0,0.1);border-radius:2px;">
                        <div style="height:100%;width:${r}%;background:${rColor};border-radius:2px;"></div>
                    </div>
                    <span style="font-size:0.7rem;opacity:0.65;min-width:42px;text-align:right;">${r}/100</span>
                </div>`;
            });
            if (lockedCount > 0) {
                h += `<div style="font-size:0.72rem;opacity:0.5;font-style:italic;margin-bottom:4px;">🔒 ${lang==='en' ? lockedCount+' more contact(s) await research.' : 'Dalších '+lockedCount+' kontaktů čeká na odemčení výzkumem.'}</div>`;
            }
            h += `<div style="font-size:0.72rem;opacity:0.5;font-style:italic;">${lang==='en'?'Dealings take place in Saeculum → Clientela.':'Jednání probíhá v Saeculum → Clientela.'}</div>`;
        }

        h += `<div style="margin-top:14px;font-size:0.75rem;opacity:0.5;font-style:italic;">
            ${lang==='en'?'Influence decays −1 per week without related activity.':'Vliv klesá −1 týdně bez příslušné aktivity.'}
        </div>`;

        return h;
    },

    // ── Sekce 5: Professio — role a specializace ─────────────────────────────
    _renderProfessio: function(lang) {
        const p = GameState.persona;
        const currentRank = (GameState.rank && GameState.rank.secular) || 'laicus';
        const rankTier = (typeof RankSystem !== 'undefined') ? RankSystem.getSecularRankTier() : 1;
        const activeRole = p ? p.role : null;

        const ROLES = [
            {
                id: 'scriptor',
                icon: '📜',
                nameCs: 'Scriptor', nameEn: 'Scriptor',
                descCs: 'Mistr pera. Rychlost výroby +15 %, chyby −20 %.',
                descEn: 'Master of the quill. Craft speed +15%, errors −20%.',
                endgameCs: '→ endgame: Prvotisk', endgameEn: '→ endgame: Prvotisk',
                reqTier: 3,
            },
            {
                id: 'illuminator',
                icon: '🎨',
                nameCs: 'Illuminator', nameEn: 'Illuminator',
                descCs: 'Malíř iniciál. Cena rukopisů +25 %, bonus na lapis lazuli.',
                descEn: 'Painter of initials. Manuscript price +25%, lapis lazuli bonus.',
                endgameCs: '→ endgame: Žaltář', endgameEn: '→ endgame: Psalter',
                reqTier: 4,
            },
            {
                id: 'athanorista',
                icon: '🔥',
                nameCs: 'Athanorista', nameEn: 'Athanorista',
                descCs: 'Alchymista. Úspěch Athanoru +20 %, bonus na Nigredo.',
                descEn: 'Alchemist. Athanor success +20%, Nigredo bonus.',
                endgameCs: '→ endgame: Magnum Opus', endgameEn: '→ endgame: Magnum Opus',
                reqTier: 3,
            },
            {
                id: 'celerarius',
                icon: '🍺',
                nameCs: 'Celerarius', nameEn: 'Celerarius',
                descCs: 'Hospodář. Tržní ceny lepší, NPC rep +5 za obchod.',
                descEn: 'Cellarer. Better market prices, NPC rep +5 per deal.',
                endgameCs: '→ endgame: Pivovar', endgameEn: '→ endgame: Brewery',
                reqTier: 3,
            },
            {
                id: 'zahradnik',
                icon: '🌿',
                nameCs: 'Zahradník', nameEn: 'Herbalist',
                descCs: 'Správce zahrady. Výnos bylin +20 %, Vigor food bonus.',
                descEn: 'Garden keeper. Herb yield +20%, Vigor food bonus.',
                endgameCs: '→ endgame: Apiarium', endgameEn: '→ endgame: Apiary',
                reqTier: 3,
            },
        ];

        const canChoose = rankTier >= 3 && !activeRole;
        const alreadyChosen = !!activeRole;

        let h = '';

        if (rankTier < 3) {
            h += `<div style="padding:20px;text-align:center;opacity:0.65;">
                <div style="font-size:2rem;margin-bottom:8px;">⚒️</div>
                <div style="font-size:0.88rem;font-style:italic;">${lang==='en'?'Reach rank Antiquarius to choose a Professio.':'Dosáhni ranku Antiquarius pro volbu Professio.'}</div>
            </div>`;
            return h;
        }

        if (canChoose) {
            h += `<div style="padding:10px 12px;background:rgba(197,160,89,0.1);border-left:3px solid var(--accent-gold);border-radius:4px;font-size:0.82rem;margin-bottom:14px;">
                <strong>${lang==='en'?'Choose your path — this decision shapes your endgame.':'Zvol svou cestu — toto rozhodnutí formuje endgame.'}</strong><br>
                <span style="opacity:0.7;">${lang==='en'?'Cannot be changed later.':'Nelze změnit zpětně.'}</span>
            </div>`;
        }

        if (alreadyChosen) {
            h += `<div style="padding:8px 12px;background:rgba(90,154,90,0.1);border-left:3px solid #5a9a5a;border-radius:4px;font-size:0.8rem;margin-bottom:14px;opacity:0.85;">
                ${lang==='en'?'Professio chosen. Your path is set.':'Professio zvolena. Tvá cesta je určena.'}
            </div>`;
        }

        h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">`;

        ROLES.forEach(role => {
            const isActive = activeRole === role.id;
            const isLocked = rankTier < role.reqTier && !isActive;
            const name = lang === 'en' ? role.nameEn : role.nameCs;
            const desc = lang === 'en' ? role.descEn : role.descCs;
            const endgame = lang === 'en' ? role.endgameEn : role.endgameCs;

            const borderStyle = isActive
                ? 'border:2px solid var(--accent-gold);background:rgba(197,160,89,0.1);'
                : 'border:1px solid rgba(197,160,89,0.2);background:var(--bg-card);';
            const opacityStyle = (!isActive && alreadyChosen) || isLocked ? 'opacity:0.45;' : '';

            const chooseBtn = canChoose && !isLocked
                ? `<button class="craft-btn" style="margin-top:8px;font-size:0.75rem;width:100%;"
                      onclick="PersonaSystem.chooseRole('${role.id}')">${lang==='en'?'Choose':'Zvolit'}</button>`
                : '';

            h += `<div style="padding:10px;border-radius:8px;${borderStyle}${opacityStyle}">
                <div style="font-size:1.2rem;margin-bottom:4px;">${role.icon}</div>
                <div style="font-weight:bold;font-size:0.88rem;">${name}${isActive ? ' ✓' : ''}</div>
                <div style="font-size:0.76rem;opacity:0.75;margin-top:3px;">${desc}</div>
                <div style="font-size:0.72rem;opacity:0.55;margin-top:4px;font-style:italic;">${endgame}</div>
                ${chooseBtn}
            </div>`;
        });

        h += `</div>`;
        return h;
    },

    chooseRole: function(roleId) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!GameState.persona) return;
        if (GameState.persona.role) return; // nelze změnit
        const rankTier = (typeof RankSystem !== 'undefined') ? RankSystem.getSecularRankTier() : 1;
        if (rankTier < 3) return;

        const ROLE_NAMES = { scriptor:'Scriptor', illuminator:'Illuminator', athanorista:'Athanorista', celerarius:'Celerarius', zahradnik: lang==='en'?'Herbalist':'Zahradník' };
        const name = ROLE_NAMES[roleId] || roleId;
        if (!confirm(lang==='en'?`Choose Professio: ${name}? This cannot be undone.`:`Zvolit Professio: ${name}? Toto nelze vrátit.`)) return;

        GameState.persona.role = roleId;
        Game.save();

        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.panel('⚒️ ' + (lang==='en'?`Professio: ${name}`:`Professio: ${name}`), 'system');
        }
        PersonaSystem.addMilestone('role_' + roleId,
            `Zvolena Professio: ${name}`,
            `Professio chosen: ${name}`
        );
        this.render();
    },

    // ── Sekce 6: Felis Monastica — kočičí char sheet ─────────────────────────
    _renderFelis: function(lang) {
        const hasTech = !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_cura_felium'));

        if (!hasTech) {
            return `<div style="padding:24px;text-align:center;opacity:0.65;">
                <div style="font-size:2.5rem;margin-bottom:10px;">🐈‍⬛</div>
                <div style="font-style:italic;font-size:0.9rem;">${t('felis.locked')}</div>
            </div>`;
        }

        if (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat._ensureCatState) ScriptoriumCat._ensureCatState();
        const c = GameState.cat || {};
        const catName = c.name || t('felis.defaultName');
        const title = (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.getTitle) ? ScriptoriumCat.getTitle() : '';
        const satiety = Math.round(c.satiety || 0);
        const affection = Math.round(c.affection || 0);
        const huntDrive = 100 - satiety; // lovecký pud = inverze sytosti
        const warmth = typeof c.warmth === 'number' ? Math.round(c.warmth) : 50;
        const warmthEmoji = warmth >= 80 ? '🔥' : warmth >= 50 ? '😺' : warmth >= 25 ? '🐱' : '🥶';
        const warmthLabel = lang === 'en'
            ? ['Freezing','Cold','Comfortable','Warm','Very warm']
            : ['Zmrzlá','Zima','Pohoda','Teplo','Velmi teplo'];
        const warmthLabelStr = warmthLabel[Math.min(4, Math.floor(warmth / 20))];
        const ageDays = c.bornAt ? Math.max(0, Math.floor((Date.now() - c.bornAt) / 86400000)) : 0;

        const bar = (icon, label, val, color) => `
            <div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:3px;">
                    <span>${icon} ${label}</span><span style="opacity:0.7;">${val}/100</span>
                </div>
                <div style="height:8px;background:rgba(0,0,0,0.12);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${val}%;background:${color};border-radius:4px;"></div>
                </div>
            </div>`;

        let h = `<div style="padding:4px;">`;

        // Hlavička: portrét + jméno + titul + rename
        h += `<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;padding:12px;background:rgba(197,160,89,0.06);border-radius:8px;border-left:3px solid rgba(197,160,89,0.3);">
            <div style="width:64px;height:64px;background-image:url('/cat/Cat-2-Sitting.png');background-size:cover;image-rendering:pixelated;flex-shrink:0;"></div>
            <div style="flex:1;">
                <div style="font-weight:bold;font-size:1rem;">${catName}</div>
                <div style="font-size:0.78rem;opacity:0.65;font-style:italic;">「 ${title} 」</div>
                <div style="font-size:0.72rem;opacity:0.5;">${t('felis.age')}: ${ageDays} ${lang==='en'?'days':'dní'}</div>
            </div>
        </div>`;
        h += `<div style="display:flex;gap:6px;margin-bottom:16px;">
            <input type="text" id="cat-name-input" value="${catName}"
                placeholder="${t('felis.namePlaceholder')}"
                style="flex:1;padding:6px 8px;border:1px solid rgba(0,0,0,0.2);border-radius:4px;font-family:'Cinzel',serif;font-size:0.85rem;">
            <button onclick="PersonaSystem.saveCatName()" class="craft-btn" style="padding:6px 12px;">💾</button>
        </div>`;

        // Staty
        h += bar('🍖', t('felis.satiety'),  satiety,   'linear-gradient(90deg,#a0722d,#c5a059)');
        h += bar('❤️', t('felis.affection'), affection, 'linear-gradient(90deg,#8c2f39,#c54a59)');
        h += bar('🐭', t('felis.huntDrive'), huntDrive, 'linear-gradient(90deg,#4a5a4a,#7a8a6a)');
        h += bar(warmthEmoji, (lang==='en'?'Warmth — ':'Teplo — ') + warmthLabelStr, warmth,
            warmth >= 80 ? 'linear-gradient(90deg,#c0392b,#e74c3c)' :
            warmth >= 40 ? 'linear-gradient(90deg,#c5a059,#f0c070)' :
                           'linear-gradient(90deg,#4a7ab5,#6aabf5)');

        // Fuzzy myší hláška
        const fuzzy = (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.miceFuzzy) ? ScriptoriumCat.miceFuzzy() : '';
        h += `<div style="margin:14px 0;padding:10px;background:rgba(0,0,0,0.04);border-radius:6px;font-size:0.82rem;font-style:italic;opacity:0.8;">
            🏚️ ${fuzzy}
        </div>`;

        // Krmení
        h += `<div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;margin:14px 0 8px;">🍽️ ${t('felis.feedTitle')}</div>`;
        const ft = (typeof ScriptoriumCat !== 'undefined' && ScriptoriumCat.FEED_TABLE) ? ScriptoriumCat.FEED_TABLE : {};
        const feedable = Object.keys(ft).filter(id => (GameState.inventory[id] || 0) > 0);
        if (feedable.length) {
            h += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;">`;
            feedable.forEach(id => {
                const item = (typeof ItemsDB !== 'undefined') ? ItemsDB[id] : null;
                const icon = item ? item.icon : '🍖';
                const nm = (typeof iName === 'function') ? iName(id) : id;
                const qty = GameState.inventory[id];
                h += `<button class="craft-btn" style="padding:6px 8px;font-size:0.78rem;"
                    onclick="ScriptoriumCat.feed('${id}')">${icon} ${nm} <span style="opacity:0.6;">×${qty}</span></button>`;
            });
            h += `</div>`;
        } else {
            h += `<div style="font-size:0.8rem;opacity:0.55;font-style:italic;">${t('felis.noFood')}</div>`;
        }

        // Počítadla + síň hanby
        h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px;font-size:0.82rem;">
            <div style="padding:8px;background:rgba(197,160,89,0.06);border-radius:6px;">🐭 ${t('felis.caught')}: <strong>${c.caught || 0}</strong></div>
            <div style="padding:8px;background:rgba(197,160,89,0.06);border-radius:6px;">😼 ${t('felis.stolenCount')}: <strong>${(c.stolen || []).length}</strong></div>
        </div>`;
        if ((c.stolen || []).length) {
            h += `<div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;margin:12px 0 6px;">😼 ${t('felis.shameHall')}</div>`;
            h += `<div style="font-size:0.78rem;opacity:0.7;">`;
            c.stolen.slice(-5).reverse().forEach(s => {
                const nm = (typeof iName === 'function') ? iName(s.item) : s.item;
                h += `<div>· ${nm}</div>`;
            });
            h += `</div>`;
        }

        h += `</div>`;
        return h;
    },

    // Re-render Felis subtab pokud je otevřen (po krmení)
    rerenderIfOpen: function() {
        if (this._activeTab === 'felis') this.render();
    },

    // ── Pomocné funkce ───────────────────────────────────────────────────────
    saveCatName: function() {
        const input = document.getElementById('cat-name-input');
        if (!input) return;
        const name = input.value.trim();
        if (!name) return;
        if (!GameState.cat) GameState.cat = {};
        GameState.cat.name = name;
        if (typeof ScriptoriumCat !== 'undefined') ScriptoriumCat.rename(name);
        Game.save();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        UI.notify('🐈‍⬛ ' + (lang==='en'?`${name} — name saved.`:`${name} — jméno uloženo.`));
        this.render();
    },
    saveName: function() {
        const input = document.getElementById('persona-name-input');
        if (!input) return;
        GameState.persona.nameGiven = input.value.trim();
        Game.save();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        UI.notify('✍️ ' + (lang==='en'?'Name saved.':'Jméno uloženo.'));
        this.render();
    },

    saveReligiousName: function() {
        const input = document.getElementById('persona-name-rel-input');
        if (!input) return;
        GameState.persona.nameReligious = input.value.trim();
        Game.save();
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        UI.notify('✝️ ' + (lang==='en'?'Religious name saved.':'Řádové jméno uloženo.'));
        this.render();
    },

    uploadPortrait: function(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this._processPortraitInk(e.target.result, (inkDataUrl) => {
                GameState.persona.portrait = inkDataUrl;
                Game.save();
                this.render();
            });
        };
        reader.readAsDataURL(file);
    },

    // Převede nahranou fotku na "dřevoryt" — dvoubarevný práh (pergamen/inkoust)
    // + zrno + dřevěný rám. Osvědčený algoritmus z dřívější session, obnoveno.
    _processPortraitInk: function(sourceDataUrl, callback) {
        const img = new Image();
        img.onload = function() {
            const SIZE = 128;
            const canvas = document.createElement('canvas');
            canvas.width = SIZE; canvas.height = SIZE;
            const ctx = canvas.getContext('2d');

            // Oříznout na čtverec ze středu
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            ctx.drawImage(img, sx, sy, size, size, 0, 0, SIZE, SIZE);

            const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
            const data = imageData.data;

            const PARCHMENT_R = 235, PARCHMENT_G = 215, PARCHMENT_B = 175;
            const INK_R = 28, INK_G = 18, INK_B = 10;
            const threshold = 128;

            for (let i = 0; i < data.length; i += 4) {
                const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const noise = (Math.random() - 0.5) * 40;
                const val = lum + noise;
                if (val > threshold) {
                    data[i] = PARCHMENT_R; data[i + 1] = PARCHMENT_G; data[i + 2] = PARCHMENT_B;
                } else {
                    const grain = Math.floor(Math.random() * 15);
                    data[i] = INK_R + grain; data[i + 1] = INK_G + grain; data[i + 2] = INK_B + grain;
                }
                data[i + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);

            // Zestárlý pergamenový nádech
            ctx.fillStyle = 'rgba(139, 90, 30, 0.08)';
            ctx.fillRect(0, 0, SIZE, SIZE);

            // Dřevěný rám
            ctx.strokeStyle = 'rgba(60, 30, 10, 0.95)';
            ctx.lineWidth = 8;
            ctx.strokeRect(0, 0, SIZE, SIZE);
            ctx.strokeStyle = 'rgba(139, 90, 30, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, SIZE - 20, SIZE - 20);

            // Rohové značky (charakteristické pro středověké dřevoryty)
            ctx.fillStyle = 'rgba(60, 30, 10, 0.9)';
            [[0, 0], [SIZE - 10, 0], [0, SIZE - 10], [SIZE - 10, SIZE - 10]].forEach(([cx, cy]) => {
                ctx.fillRect(cx, cy, 10, 10);
            });

            callback(canvas.toDataURL('image/png'));
        };
        img.src = sourceDataUrl;
    },

    removePortrait: function() {
        GameState.persona.portrait = null;
        Game.save();
        this.render();
    },

    // Přidat milestone (volat z jiných systémů)
    addMilestone: function(id, descCs, descEn) {
        if (!GameState.persona) return;
        if (GameState.persona.milestones.find(m => m.id === id)) return; // jen jednou
        GameState.persona.milestones.push({ id, timestamp: Date.now(), descCs, descEn });
        Game.save();
    },

    // Upravit vliv NPC / frakce (volat z ostatních systémů)
    // Příklady: PersonaSystem.addInfluence('giacomo', 5)
    //           PersonaSystem.addInfluence('village', 3)
    //           PersonaSystem.addInfluence('church', -10)
    addInfluence: function(npc, amount) {
        if (!GameState.persona || !GameState.persona.influence) return;
        if (!(npc in GameState.persona.influence)) return;
        GameState.persona.influence[npc] = Math.max(0, Math.min(100, (GameState.persona.influence[npc]||0) + amount));
        Game.save();
    },

    // Registrum Coenobii (Fáze 0, registrum-coenobii-reference.md) — čistě čtecí
    // formule, nic nemutuje, nic neukládá. Počítá se na požádání (renderTemplumTab),
    // ne jednou denně — je to levný výpočet nad už existujícím stavem.
    // Stejné váhy pro každou položku (dohodnuto s Bouvardem), doladit až podle
    // reálného chování hráčů.
    computeRegistrum: function() {
        const infl = (GameState.persona && GameState.persona.influence) || {};
        const readBooks = (GameState.library && GameState.library.readBooks) || [];
        const totalBooks = (typeof LibraryDB !== 'undefined' && LibraryDB.books) ? LibraryDB.books.length : 0;
        const readPct = totalBooks ? (readBooks.length / totalBooks) * 100 : 0;
        const folios = (GameState.scrinium && GameState.scrinium.folios) || {};
        const folioIds = Object.keys(folios);
        const foundPct = folioIds.length ? (Object.values(folios).filter(f => f.found).length / folioIds.length) * 100 : 0;
        const probostBonus = (GameState.rank && GameState.rank.probost) ? 100 : 0;
        const deliveredBonus = (GameState.flags && GameState.flags.bishopMissal === 'delivered') ? 100 : 0;

        const luxParts = [infl.scholars || 0, Math.min(100, infl.church || 0), readPct, foundPct, probostBonus, deliveredBonus];
        const lux = Math.round(luxParts.reduce((a, b) => a + b, 0) / luxParts.length);

        const heat = (GameState.secrets && GameState.secrets.inquisitionHeat) || 0;
        const cond = (GameState.cemetery && GameState.cemetery.condition != null) ? GameState.cemetery.condition : 100;
        const neglect = cond < 40 ? (100 - cond) : 0;
        const log = (GameState.templum && GameState.templum.log) || [];
        const parishEntries = log.filter(e => e.type === 'parish');
        const declinedPct = parishEntries.length ? (parishEntries.filter(e => e.officiated === false).length / parishEntries.length) * 100 : 0;
        const failedBonus = (GameState.flags && GameState.flags.bishopMissal === 'failed') ? 100 : 0;

        const umbraParts = [heat, neglect, declinedPct, failedBonus];
        const umbra = Math.round(umbraParts.reduce((a, b) => a + b, 0) / umbraParts.length);

        return { lux: Math.max(0, Math.min(100, lux)), umbra: Math.max(0, Math.min(100, umbra)) };
    },

    // Zbožnost — osobní/vnitřní stav mnicha (Cassianových osm myšlenek, endgame-branches-reference.md sekce 9)
    // Odlišné od addInfluence('church',...) — Ecclesia je institucionální, Zbožnost je osobní
    addZboznost: function(amount) {
        if (!GameState.persona) return;
        GameState.persona.zboznost = Math.max(0, Math.min(100, (GameState.persona.zboznost||0) + amount));
        Game.save();
    },

    // Decay influence — volat z game.js daily tick
    // Každých 7 reálných dní odečte -1 od každé osy influence
    // Osy s hodnotou 0 se nemění (nevznikají záporné)
    tickDecay: function() {
        if (!GameState.persona || !GameState.persona.influence) return;
        const DECAY_INTERVAL = 7 * 24 * 3600000; // 7 dní v ms
        const now = Date.now();
        const last = GameState.persona.influenceLastDecay || 0;
        if (now - last < DECAY_INTERVAL) return; // ještě není čas

        const inf = GameState.persona.influence;
        const keys = ['benedikt','mercatus','abbot','village','church','scholars','bartolomej'];
        let changed = false;
        keys.forEach(k => {
            if ((inf[k] || 0) > 0) {
                inf[k] = Math.max(0, (inf[k] || 0) - 1);
                changed = true;
            }
        });
        // Clientela: vztahy s kontakty chladnou stejným rytmem (-1/týden)
        if (typeof ContactsDB !== 'undefined' && GameState.contactRelation) {
            Object.keys(GameState.contactRelation).forEach(cid => {
                if ((GameState.contactRelation[cid] || 0) > 0) {
                    GameState.contactRelation[cid] = Math.max(0, GameState.contactRelation[cid] - 1);
                    changed = true;
                }
            });
        }
        // Acedia (endgame-branches-reference.md sekce 9) — nízký Vigor beze změny celý týden = eroze Zbožnosti
        if (typeof VigorSystem !== 'undefined' && VigorSystem.getVigorPct && VigorSystem.getVigorPct() < 30) {
            this.addZboznost(-2);
            // Bestiář: první reálný zásah Acedie rovnou odemkne její záznam.
            // unlockFolioById je idempotentní (no-op, pokud už nalezeno).
            if (typeof SecretsSystem !== 'undefined') SecretsSystem.unlockFolioById('folio_acedia_bestiar');
        }
        GameState.persona.influenceLastDecay = now;
        if (changed) Game.save();
    },

};