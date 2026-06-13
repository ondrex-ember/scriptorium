// ═══════════════════════════════════════════════════════════════════════════
// PERSONA SYSTEM — Liber Personae
// Subtab ve Scriptoriu — 3 sekce: Persona | Statistiky | Influentia
// ═══════════════════════════════════════════════════════════════════════════

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

        // Zkontrolovat zda zobrazit origin modal
        this.checkOriginModal();
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
            <button id="persona-tab-stats" class="filter-btn ${this._activeTab==='stats'?'active':''}"
                onclick="PersonaSystem.switchTab('stats',this)">📊 ${lang==='en'?'Statistics':'Statistiky'}</button>
            <button id="persona-tab-influentia" class="filter-btn ${this._activeTab==='influentia'?'active':''}"
                onclick="PersonaSystem.switchTab('influentia',this)">🤝 ${lang==='en'?'Influentia':'Influentia'}</button>
            <button id="persona-tab-felis" class="filter-btn ${this._activeTab==='felis'?'active':''}"
                onclick="PersonaSystem.switchTab('felis',this)">🐈‍⬛ Felis</button>
        </div>`;

        h += `<div id="persona-subtab-persona"  style="${this._activeTab==='persona'?'':'display:none'}">` + this._renderPersona(lang) + `</div>`;
        h += `<div id="persona-subtab-stats"    style="${this._activeTab==='stats'?'':'display:none'}">` + this._renderStats(lang) + `</div>`;
        h += `<div id="persona-subtab-influentia" style="${this._activeTab==='influentia'?'':'display:none'}">` + this._renderInfluentia(lang) + `</div>`;
        h += `<div id="persona-subtab-felis" style="${this._activeTab==='felis'?'':'display:none'}">` + this._renderFelis(lang) + `</div>`;

        el.innerHTML = h;
    },

    switchTab: function(tab, btn) {
        this._activeTab = tab;
        document.querySelectorAll('#lore-persona-content .filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        ['persona','stats','influentia','felis'].forEach(t => {
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
            ? `<img src="${p.portrait}" style="width:96px;height:96px;object-fit:cover;border-radius:6px;border:2px solid var(--accent-gold);">`
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
                <span style="opacity:0.5;">${new Date(r.timestamp).toLocaleDateString()}</span>
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
        </div>`;
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
        h += stat('⚒️', lang==='en'?'Crafts':'Výroba', stats.itemsCrafted||0);
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

        // Vigor
        if (typeof VigorSystem !== 'undefined') {
            h += `<div style="margin-top:8px;">` + VigorSystem.renderFullDisplay() + `</div>`;
        }

        // Záloha save
        h += `<div style="margin-top:20px;padding:14px;background:rgba(0,0,0,0.04);border-radius:8px;border:1px solid rgba(197,160,89,0.2);">
            <div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;margin-bottom:8px;">💾 ${lang==='en'?'Save Backup':'Záloha Save'}</div>
            <button class="craft-btn" onclick="UI.exportSave()" style="font-size:0.82rem;margin-right:8px;">📤 ${lang==='en'?'Export':'Export'}</button>
            <button class="craft-btn" onclick="UI.importSave()" style="font-size:0.82rem;">📥 ${lang==='en'?'Import':'Import'}</button>
        </div>`;

        return h;
    },

    // ── Sekce 3: Influentia ──────────────────────────────────────────────────
    _renderInfluentia: function(lang) {
        const inf = (GameState.persona && GameState.persona.influence) || { benedikt:0, giacomo:0, abbot:0 };

        const bar = (icon, name, value, desc) => {
            const pct = Math.min(100, Math.round(value));
            const color = pct >= 75 ? '#5a9a5a' : pct >= 40 ? 'var(--accent-gold)' : 'var(--ink-secondary)';
            return `<div style="margin-bottom:16px;padding:12px;background:var(--bg-card);border:1px solid rgba(197,160,89,0.2);border-radius:8px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:1.4rem;">${icon}</span>
                    <div style="flex:1;">
                        <div style="font-weight:bold;font-size:0.9rem;">${name}</div>
                        <div style="font-size:0.75rem;opacity:0.65;font-style:italic;">${desc}</div>
                    </div>
                    <strong style="color:${color};">${pct}/100</strong>
                </div>
                <div style="height:6px;background:rgba(0,0,0,0.1);border-radius:3px;">
                    <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width 0.4s;"></div>
                </div>
            </div>`;
        };

        let h = bar('🏠', lang==='en'?'Benedikt of Litomyšl (Cellarius)':'Benedikt z Litomyšle (Cellarius)',
            inf.benedikt,
            lang==='en'?'Master of the cellar and trade. High influence → better prices in Hospoda.':'Správce sklepa a obchodu. Vysoký vliv → lepší ceny v Hospodě.');
        h += bar('⚓', lang==='en'?'Giacomo Foscari (Mercator)':'Giacomo Foscari (Mercator)',
            inf.giacomo,
            lang==='en'?'Venetian merchant. High influence → rare goods and special orders.':'Benátský obchodník. Vysoký vliv → vzácné zboží a speciální zakázky.');
        h += bar('✝️', lang==='en'?'The Abbot':'Opat',
            inf.abbot,
            lang==='en'?'Father of the monastery. High influence → Scrinium access and rank advancement.':'Otec kláštera. Vysoký vliv → přístup do Scrinia a postup v ranku.');

        h += `<div style="margin-top:16px;padding:12px;background:rgba(197,160,89,0.06);border-radius:8px;border-left:3px solid rgba(197,160,89,0.3);">
            <div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.6;margin-bottom:8px;">⚒️ ${lang==='en'?'Professions':'Professio'}</div>
            <div style="font-size:0.82rem;opacity:0.6;font-style:italic;">
                ${lang==='en'?'Professions unlock through activity. Coming in a future update.':'Profese se odemykají aktivitou. Přijde v budoucí aktualizaci.'}
            </div>
        </div>`;

        return h;
    },

    // ── Sekce 4: Felis Monastica — kočičí char sheet ─────────────────────────
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
            GameState.persona.portrait = e.target.result;
            Game.save();
            this.render();
        };
        reader.readAsDataURL(file);
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

    // Upravit vliv NPC
    addInfluence: function(npc, amount) {
        if (!GameState.persona || !GameState.persona.influence) return;
        if (!(npc in GameState.persona.influence)) return;
        GameState.persona.influence[npc] = Math.max(0, Math.min(100, (GameState.persona.influence[npc]||0) + amount));
        Game.save();
    },

};