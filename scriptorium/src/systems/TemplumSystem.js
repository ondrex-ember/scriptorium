// ─────────────────────────────────────────────────────────────
// TemplumSystem — kostelní větev (MRD templum-reference.md)
// T1: skeleton — gate (mnišský rank frater+) + kostra pilířů.
// Žádná mechanika; pilíře (Úklid/Mše/Zpověď/Dary) = další sprinty.
// ─────────────────────────────────────────────────────────────

const TemplumSystem = {

    // Vytáhne posledních N záznamů daného typu ze sdíleného Templum logu.
    _logEntries: function(type, n) {
        const log = (GameState.templum && GameState.templum.log) || [];
        return log.filter(e => e.type === type).slice(0, n || 5);
    },

    _timeAgo: function(ts, lang) {
        const days = Math.floor((Date.now() - ts) / (24 * 3600000));
        if (days <= 0) return lang === 'en' ? 'today' : 'dnes';
        if (days === 1) return lang === 'en' ? '1 day ago' : 'včera';
        if (days < 30) return lang === 'en' ? days + ' days ago' : 'před ' + days + ' dny';
        if (days < 365) {
            const months = Math.round(days / 30);
            return lang === 'en'
                ? months + (months === 1 ? ' month ago' : ' months ago')
                : 'před ' + months + (months === 1 ? ' měsícem' : ' měsíci');
        }
        const years = Math.round(days / 365);
        return lang === 'en'
            ? years + (years === 1 ? ' year ago' : ' years ago')
            : 'před ' + years + (years === 1 ? ' rokem' : ' lety');
    },

    _confessionHistoryHtml: function(lang) {
        const entries = this._logEntries('confession', 5);
        if (!entries.length) return '';
        const choiceTxt = (c) => c === 'strict' ? (lang==='en'?'strict penance':'přísné pokání')
            : c === 'lenient' ? (lang==='en'?'leniency':'shovívavost')
            : (lang==='en'?'turned away':'odmítnut');
        const rows = entries.map(e => `<div style="font-size:0.68rem; opacity:0.65; margin-top:2px;">${e.name} — ${choiceTxt(e.choice)} · ${this._timeAgo(e.ts, lang)}</div>`).join('');
        return `<div style="margin-top:4px;">${rows}</div>`;
    },

    _massHistoryHtml: function(lang) {
        const entries = this._logEntries('mass', 5);
        if (!entries.length) return '';
        const rows = entries.map(e => {
            const nm = (typeof iName === 'function') ? iName(e.incense) : e.incense;
            const flag = e.degraded ? ' ⚠️' : (e.feastName ? ' 🎉' : '');
            return `<div style="font-size:0.68rem; opacity:0.65; margin-top:2px;">${nm}${flag} · ${this._timeAgo(e.ts, lang)}</div>`;
        }).join('');
        return `<div style="margin-top:4px;">${rows}</div>`;
    },

    _donationHistoryHtml: function(lang) {
        const entries = this._logEntries('donation', 5);
        if (!entries.length) return '';
        const rows = entries.map(e => {
            const nm = (typeof iName === 'function') ? iName(e.itemId) : e.itemId;
            return `<div style="font-size:0.68rem; opacity:0.65; margin-top:2px;">${nm} — Ecclesia +${e.influence} · ${this._timeAgo(e.ts, lang)}</div>`;
        }).join('');
        return `<div style="margin-top:4px;">${rows}</div>`;
    },

    _pilgrimsHistoryHtml: function(lang) {
        const entries = this._logEntries('pilgrims', 5);
        if (!entries.length) return '';
        const rows = entries.map(e => `<div style="font-size:0.68rem; opacity:0.65; margin-top:2px;">${e.grose} g · ${this._timeAgo(e.ts, lang)}</div>`).join('');
        return `<div style="margin-top:4px;">${rows}</div>`;
    },

    // Nová karta — Farní život (křest/svatba/pohřeb). Gate stejný jako
    // Game.parishEventTick() (rank.probost), jinak by karta ukazovala
    // funkci, co pro hráče vůbec neběží.
    _parishCardHtml: function(lang) {
        if (!(GameState.rank && GameState.rank.probost)) return '';
        const entries = this._logEntries('parish', 5);
        const iconFor = (t) => t === 'baptism' ? '👶' : t === 'wedding' ? '💍' : '⚰️';
        const nameFor = (t) => {
            const m = { baptism: [lang==='en'?'Baptism':'Křest'], wedding: [lang==='en'?'Wedding':'Svatba'], funeral: [lang==='en'?'Funeral':'Pohřeb'] };
            return m[t][0];
        };
        const rows = entries.map(e => `<div style="font-size:0.68rem; margin-top:2px; ${e.officiated ? 'opacity:0.65;' : 'color:#c0392b;'}">${iconFor(e.eventType)} ${nameFor(e.eventType)} — ${e.surname}${e.officiated ? '' : (lang==='en'?' (declined)':' (odmítnuto)')} · ${this._timeAgo(e.ts, lang)}</div>`).join('');
        return `<div style="padding:12px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-size:1.5rem; margin-bottom:4px;">✝️</div>
                <div style="font-weight:bold; font-size:0.82rem;">${lang==='en'?'Parish life':'Farní život'}</div>
                ${entries.length ? `<div style="margin-top:4px;">${rows}</div>` : `<div style="font-size:0.7rem; margin-top:5px; opacity:0.6;">${lang==='en'?'the parish is quiet for now':'farnost zatím mlčí'}</div>`}
                <div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'weekly · baptisms, weddings, funerals of the parish':'týdně · křty, svatby, pohřby farnosti'}</div>
              </div>`;
    },

    // Gate: mnišská dráha od bratra výš (Cursus Monasticus)
    isUnlocked: function() {
        const m = GameState.rank && GameState.rank.monastic;
        return ['frater', 'armarius', 'prior'].includes(m);
    },

    // Gate: Hřbitov — otevřen dřív než zbytek Templum, od novitius (24h na mnišské dráze)
    isCemeteryUnlocked: function() {
        const m = GameState.rank && GameState.rank.monastic;
        return ['novitius', 'frater', 'armarius', 'prior'].includes(m);
    },

    // Zobrazit/skrýt top-level tab dle gate (volá se z existujícího tick call-site + při přepínání tabů)
    updateTabVisibility: function() {
        const btn = document.getElementById('home-tab-templum');
        if (!btn) return;
        const show = this.isCemeteryUnlocked();
        const cur = btn.style.display !== 'none';
        if (show !== cur) btn.style.display = show ? '' : 'none';
    },

    switchEntity: function(entityId) {
        if (!GameState.ui) GameState.ui = {};
        GameState.ui.templumEntity = entityId;
        const el = document.getElementById('home-templum-content');
        if (el) el.innerHTML = this.renderTemplumTab();
    },

    _renderCemeteryPanel: function(lang) {
        if (!GameState.cemetery) GameState.cemetery = { condition: 100, graves: [] };
        const cem = GameState.cemetery;
        const cond = cem.condition != null ? cem.condition : 100;
        const condColor = cond >= 70 ? '#5a9a5a' : cond >= 40 ? 'var(--accent-gold)' : '#c0392b';
        const condLabel = cond >= 70 ? (lang==='en'?'tended':'udržovaný') : cond >= 40 ? (lang==='en'?'neglected':'zanedbaný') : (lang==='en'?'overgrown':'zarostlý');

        let h = '';
        if (cond < 40) {
            h += `<div style="padding:8px 12px; margin-bottom:10px; background:rgba(192,57,43,0.1); border-left:4px solid #c0392b; border-radius:6px; font-size:0.78rem; font-weight:bold;">
                    ⚠️ ${lang==='en' ? 'The villagers notice the overgrown graves — Village relations are quietly slipping.' : 'Vesničané si všímají zarostlých hrobů — vztah s Vsí tiše klesá.'}
                  </div>`;
        }
        h += `<div style="padding:12px 15px; margin-bottom:16px; background:rgba(197,160,89,0.05); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
            <div style="font-weight:bold; font-size:0.9rem; margin-bottom:6px;">⚰️ ${lang==='en'?'Cemetery condition':'Stav hřbitova'} — <span style="color:${condColor};">${condLabel}</span></div>
            <div style="height:6px; background:rgba(0,0,0,0.1); border-radius:3px; overflow:hidden; margin-bottom:6px;">
                <div style="height:100%; width:${cond}%; background:${condColor}; border-radius:3px;"></div>
            </div>
            <div style="font-size:0.7rem; opacity:0.65;">${Math.round(cond)} %${cem.lastCleaner ? ' · ' + (lang==='en'?'last tended by ':'naposled udržoval ') + cem.lastCleaner : ''}</div>
            <div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'daily · a lay brother or the Sacristan keeps it clear':'denně · udržuje konvrš přiřazený na Hřbitov, nebo Kostelník'}</div>
          </div>`;

        const graves = (cem.graves || []).slice().reverse();
        h += `<div style="padding:12px 15px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
            <div style="font-weight:bold; font-size:0.9rem; margin-bottom:6px;">🪦 ${lang==='en'?'Graves':'Hroby'} (${graves.length})</div>`;
        if (!graves.length) {
            h += `<div style="font-size:0.75rem; opacity:0.6;">${lang==='en'?'No one rests here yet.':'Zatím tu nikdo neodpočívá.'}</div>`;
        } else {
            const haveStone = (GameState.inventory['nahrobek'] || 0) >= 1;
            h += graves.slice(0, 15).map(g => {
                const mark = g.nahrobek ? '🪦' : '⬜';
                const btn = g.nahrobek ? '' : `<button class="craft-btn" style="padding:1px 6px; font-size:0.62rem; margin-left:6px;" ${haveStone ? '' : 'disabled'} onclick="Game.buildNahrobek(${g.ts})">${lang==='en'?'Set gravestone':'Postavit náhrobek'}</button>`;
                return `<div style="font-size:0.72rem; opacity:0.7; margin-top:3px; display:flex; align-items:center; justify-content:space-between;">
                          <span>${mark} ${g.surname} · ${this._timeAgo(g.ts, lang)}</span>${btn}
                        </div>`;
            }).join('');
        }
        h += `</div>`;

        // Rajský dvůr — vnitřní pohřebiště komunity (bratři/konvrši), odděleno
        // od farního Hřbitova (ten je jen pro farní rodiny přes parishEventTick).
        const cloister = ((GameState.rajskyDvur && GameState.rajskyDvur.graves) || []).slice().reverse();
        h += `<div style="padding:14px 16px; margin-top:16px; background:rgba(122,150,122,0.08); border:1px solid rgba(122,150,122,0.35); border-radius:8px;">
                <div style="font-weight:bold; font-size:0.9rem; margin-bottom:4px; color:#5a7a5a;">🕊️ ${lang==='en'?'Cloister Garth':'Rajský dvůr'} (${cloister.length})</div>
                <div style="font-size:0.68rem; opacity:0.6; font-style:italic; margin-bottom:8px;">${lang==='en' ? 'Where the brothers who have gone before us rest, within these walls.' : 'Kde odpočívají bratři, kteří odešli před námi, uvnitř těchto zdí.'}</div>`;
        if (!cloister.length) {
            h += `<div style="font-size:0.75rem; opacity:0.55;">${lang==='en'?'No brother has yet gone to his rest.':'Žádný bratr zatím neodešel na věčný odpočinek.'}</div>`;
        } else {
            h += cloister.slice(0, 15).map(g => {
                const icon = g.wasBrother ? '📿' : '✝️';
                const causeDef = (typeof HealthConditionsDB !== 'undefined') ? HealthConditionsDB[g.cause] : null;
                const causeName = causeDef ? (lang==='en' ? causeDef.name_en : causeDef.name) : g.cause;
                return `<div style="font-size:0.72rem; opacity:0.8; margin-top:6px;">
                          ${icon} <strong>${g.name}</strong> <span style="opacity:0.65;">— ${causeName} · ${this._timeAgo(g.ts, lang)}</span>
                          <div style="font-size:0.62rem; opacity:0.5; font-style:italic;">Requiescat in pace.</div>
                        </div>`;
            }).join('');
        }
        h += `</div>`;
        return h;
    },

    renderTemplumTab: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!this.isCemeteryUnlocked()) {
            return `<div style="text-align:center; padding:30px; opacity:0.6;
                        border:1px dashed rgba(197,160,89,0.3); border-radius:8px;">
                      <div style="font-size:2rem; margin-bottom:10px;">🕍</div>
                      <div style="font-style:italic; font-size:0.9rem;">
                        ${lang==='en' ? 'The church opens only to a brother of the order.' : 'Kostel se otevírá jen bratru řádu.'}
                      </div>
                    </div>`;
        }

        let h = `<div style="padding:10px;">`;
        // Visitatio V1: odpočet přípravy — viditelná zkouška, ne překvapení
        const _vAt = GameState.flags && GameState.flags.visitatioAt;
        if (_vAt && _vAt > Date.now()) {
            const vD = Math.ceil((_vAt - Date.now()) / (24*3600000));
            h += `<div style="padding:8px 12px; margin-bottom:10px; background:rgba(192,57,43,0.08); border-left:4px solid #c0392b; border-radius:6px; font-size:0.8rem; font-weight:bold;">🔔 ${lang==='en' ? 'Visitation in ' + vD + ' d — let the church be lit, the mass be sung, the stores be full.' : 'Vizitace za ' + vD + ' d — kostel ať svítí, mše ať zní, zásoby ať jsou plné.'}</div>`;
        }
        h += `
          <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;
                      padding:15px; background:rgba(197,160,89,0.07);
                      border-radius:10px; border-left:4px solid var(--accent-gold);">
            <div style="font-size:2.5rem;">🕍</div>
            <div style="flex:1;">
              <div style="font-weight:bold; font-size:1rem;">Templum</div>
              <div style="font-size:0.8rem; opacity:0.65; font-style:italic;">${lang==='en'?'The monastery church':'Klášterní kostel'}</div>
              <div style="font-size:0.8rem; opacity:0.6; margin-top:4px;">
                ${lang==='en' ? '"Domus mea domus orationis vocabitur." The church stands quiet — its life will come piece by piece.' : '„Domus mea domus orationis vocabitur." Kostel stojí ztichlý — jeho život přijde kus po kuse.'}
              </div>
              ${(typeof Game !== 'undefined' && Game.isOfficiumHours && Game.isOfficiumHours())
                ? `<div style="font-size:0.75rem; color:var(--accent-gold); margin-top:4px;">🔔 ${lang==='en'?'Bells call to Officium.':'Zvony volají k Officiu.'}</div>`
                : ''}
              ${(GameState.inventory['reliquia'] || 0) >= 1 ? `<div style="font-size:0.78rem; color:var(--accent-gold); margin-top:4px;">✨ ${lang==='en' ? 'A relic is enshrined — the mass bears greater grace.' : 'Relikvie vystavena — mše nese větší milost.'}</div>` : ''}
            </div>
          </div>`;

        // Registrum Coenobii (Fáze 0) — čistě informační, žádný nový tech gate
        // (nic neodemyká, jen ukazuje odvozený stav). registrum-coenobii-reference.md
        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.computeRegistrum) {
            const reg = PersonaSystem.computeRegistrum();
            const tone = reg.lux >= reg.umbra
                ? (lang === 'en' ? 'a hearth of learning' : 'ohnisko vzdělanosti')
                : (lang === 'en' ? 'a nest of whispers' : 'hnízdo šepotu');
            h += `<div style="padding:10px 14px; margin-bottom:16px; background:rgba(197,160,89,0.05); border:1px solid rgba(197,160,89,0.2); border-radius:8px;">
                    <div style="font-weight:bold; font-size:0.85rem; margin-bottom:6px;">📜 Registrum Coenobii — <span style="opacity:0.75; font-style:italic; font-weight:normal;">${tone}</span></div>
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:4px;">
                      <span style="font-size:0.68rem; width:100px;">☀️ Lux Scientiae</span>
                      <div style="flex:1; height:6px; background:rgba(0,0,0,0.1); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; width:${reg.lux}%; background:#c5a559;"></div>
                      </div>
                      <span style="font-size:0.68rem; opacity:0.6; width:24px; text-align:right;">${reg.lux}</span>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                      <span style="font-size:0.68rem; width:100px;">🌑 Umbra Corruptionis</span>
                      <div style="flex:1; height:6px; background:rgba(0,0,0,0.1); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; width:${reg.umbra}%; background:#8a3a3a;"></div>
                      </div>
                      <span style="font-size:0.68rem; opacity:0.6; width:24px; text-align:right;">${reg.umbra}</span>
                    </div>
                    <div style="font-size:0.6rem; opacity:0.5; font-style:italic; margin-top:6px;">${lang === 'en' ? 'How this house is spoken of beyond its walls.' : 'Jak se o tomto domě mluví za jeho zdmi.'}</div>
                  </div>`;
        }

        // Subtab přepínač: Hřbitov / Hlavní (mirror Cellarium/Manufaktura vzoru)
        const entity = (GameState.ui && GameState.ui.templumEntity) || (this.isUnlocked() ? 'main' : 'hrbitov');
        h += `<div style="display:flex; gap:8px; margin-bottom:16px;">
                <button class="craft-btn" style="flex:1; ${entity==='hrbitov' ? 'background:#2c1810;' : ''}" onclick="TemplumSystem.switchEntity('hrbitov')">⚰️ ${lang==='en'?'Cemetery':'Hřbitov'}</button>
                <button class="craft-btn" style="flex:1; ${entity==='main' ? 'background:#2c1810;' : ''}" onclick="TemplumSystem.switchEntity('main')">🕍 ${lang==='en'?'Main':'Hlavní'}</button>
              </div>`;

        if (entity === 'hrbitov') {
            h += this._renderCemeteryPanel(lang);
            h += `</div>`;
            return h;
        }

        if (!this.isUnlocked()) {
            h += `<div style="text-align:center; padding:30px; opacity:0.6;
                        border:1px dashed rgba(197,160,89,0.3); border-radius:8px;">
                      <div style="font-size:2rem; margin-bottom:10px;">🕍</div>
                      <div style="font-style:italic; font-size:0.9rem;">
                        ${lang==='en' ? 'The nave opens only to a brother of the order.' : 'Hlavní loď se otevírá jen bratru řádu.'}
                      </div>
                    </div>`;
            h += `</div>`;
            return h;
        }

        // Fabrica Ecclesiae — 4 stavební úrovně (endgame-branches-reference.md sekce 4.2)
        {
            const t0 = GameState.templum || {};
            const tier = t0.fabricaTier || 0;
            const cond = t0.condition != null ? t0.condition : 100;
            const cur = Game.FABRICA_TIERS[tier];
            const next = Game.FABRICA_TIERS[tier + 1];
            const curName = lang==='en' ? cur.name_en : cur.name;
            const condColor = cond >= 70 ? '#5a9a5a' : cond >= 40 ? 'var(--accent-gold)' : '#c0392b';
            if (cond < 40) {
                h += `<div style="padding:8px 12px; margin-bottom:10px; background:rgba(192,57,43,0.1); border-left:4px solid #c0392b; border-radius:6px; font-size:0.78rem; font-weight:bold;">
                        ⚠️ ${lang==='en' ? 'The dilapidated church does not escape the hierarchy — Church relations are quietly slipping.' : 'Sešlý kostel neujde pozornosti hierarchie — vztah s Církví tiše klesá.'}
                      </div>`;
            }
            h += `<div style="padding:12px 15px; margin-bottom:16px; background:rgba(197,160,89,0.05); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <div style="font-weight:bold; font-size:0.9rem;">🏛️ Fabrica Ecclesiae — ${curName}</div>`;
            {
                const repCost = cur.repairCost || 20;
                const repMats = cur.repairMaterials || {};
                const repMatsOk = Object.keys(repMats).every(mid => (GameState.inventory[mid] || 0) >= repMats[mid]);
                const repLabel = Object.keys(repMats).map(mid => (typeof iName === 'function' ? iName(mid) : mid) + ' ' + repMats[mid]).join(', ');
                const repDisabled = cond >= 89 || CellariumSystem.getGrose() < repCost || !repMatsOk;
                h += `<button class="craft-btn" style="font-size:0.7rem; padding:3px 10px;" onclick="Game.repairFabrica()" ${repDisabled?'disabled':''}>🔧 ${lang==='en'?'Repair':'Opravit'} (${repCost}g${repLabel?', '+repLabel:''})</button>`;
            }
            h += `</div>
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; opacity:0.65; margin-bottom:3px;">
                    <span>${lang==='en'?'Structural condition':'Strukturální stav'}</span><span>${Math.round(cond)} %</span>
                </div>
                <div style="height:6px; background:rgba(0,0,0,0.1); border-radius:3px; overflow:hidden; margin-bottom:8px;">
                    <div style="height:100%; width:${cond}%; background:${condColor}; border-radius:3px;"></div>
                </div>`;
            if ((GameState.inventory['organ'] || 0) >= 1) {
                const pipeMults = [0.5, 0.7, 0.9, 1.0, 0.9, 0.7, 0.5];
                const pipeNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]; // C4–B4
                const pipes = pipeMults.map((m, i) => {
                    const x = 8 + i * 18, h = 45 * m, y = 55 - h, delay = (i * 0.15).toFixed(2), freq = pipeNotes[i];
                    return `<rect x="${x}" y="${y}" width="12" height="${h}" rx="2" fill="var(--accent-gold)" opacity="0.55"
                        style="cursor:pointer;" onclick="if(typeof audioSys!=='undefined' && audioSys) audioSys.playOrganNote(${freq});">
                        <animate attributeName="opacity" values="0.55;0.95;0.55" dur="2.4s" begin="${delay}s" repeatCount="indefinite"/>
                    </rect>`;
                }).join('');
                h += `<div style="margin-bottom:10px;" title="${lang==='en'?'Click a pipe to play':'Klikni na píšťalu'}">
                    <svg viewBox="0 0 140 60" style="width:140px; height:60px; display:block; margin:0 auto;">${pipes}</svg>
                    <div style="text-align:center; font-size:0.68rem; opacity:0.55; font-style:italic;">🎹 ${lang==='en'?'click a pipe to play':'klikej na píšťaly'}</div>
                </div>`;
            }
            if (t0.fabricaBuildUntil) {
                const remMs = t0.fabricaBuildUntil - Date.now();
                const remDays = Math.max(0, Math.ceil(remMs / (24*60*60*1000)));
                const targetDef = Game.FABRICA_TIERS[t0.fabricaBuildTargetTier];
                const targetName = lang==='en' ? targetDef.name_en : targetDef.name;
                h += `<div style="font-size:0.78rem; margin-top:6px;">🏗️ ${lang==='en'?'Under construction: ':'Probíhá stavba: '}<strong>${targetName}</strong> — ${lang==='en'?'ready in':'hotovo za'} ${remDays} ${lang==='en'?(remDays===1?'day':'days'):'dní'}</div>`;
            } else if (next) {
                const nextName = lang==='en' ? next.name_en : next.name;
                const req = next.req || {};
                const eccl = (GameState.persona && GameState.persona.influence && GameState.persona.influence.church) || 0;
                const zbozn = (GameState.persona && GameState.persona.zboznost) || 0;
                const rows = [];
                if (req.condition) rows.push([cond >= req.condition, (lang==='en'?'Condition':'Stav')+' ≥'+req.condition+'% ('+Math.round(cond)+')']);
                if (req.ecclesia)  rows.push([eccl >= req.ecclesia,  'Ecclesia ≥'+req.ecclesia+' ('+Math.round(eccl)+')']);
                if (req.zboznost)  rows.push([zbozn >= req.zboznost, (lang==='en'?'Piety':'Zbožnost')+' ≥'+req.zboznost+' ('+Math.round(zbozn)+')']);
                if (req.organ)     rows.push([(GameState.inventory['organ']||0) >= 1, lang==='en'?'Organ in the church':'Varhany v kostele']);
                if (req.materials) {
                    Object.keys(req.materials).forEach(matId => {
                        const need = req.materials[matId];
                        const have = GameState.inventory[matId] || 0;
                        const matName = (typeof iName === 'function') ? iName(matId) : matId;
                        rows.push([have >= need, matName + ' ' + have + '/' + need]);
                    });
                }
                const met = rows.every(r => r[0]);
                h += rows.map(r => `<div style="font-size:0.68rem; ${r[0]?'opacity:0.7;':'color:#c0392b;'}">${r[0]?'✓':'✗'} ${r[1]}</div>`).join('');
                const buildPart = next.buildDays ? (', ' + (lang==='en'?'build':'stavba') + ' ' + next.buildDays + (lang==='en'?'d':' dní')) : '';
                h += `<button class="craft-btn" style="margin-top:8px; width:100%;" ${met && CellariumSystem.getGrose() >= next.cost ? '' : 'disabled'} onclick="Game.upgradeFabrica()">⬆️ ${lang==='en'?'Raise to':'Povýšit na'} ${nextName} (${next.cost}g${buildPart})</button>`;
            } else {
                h += `<div style="font-size:0.75rem; opacity:0.6; font-style:italic;">${lang==='en'?'Highest tier reached.':'Nejvyšší úroveň dosažena.'}</div>`;
            }
            h += `</div>`;
        }

        // Probošt — petice k opatovi, gate Fabrica tier≥1 + armarius+ (endgame-branches-reference.md sekce 4.3)
        {
            const fTier0 = (GameState.templum && GameState.templum.fabricaTier) || 0;
            const mRank0 = GameState.rank && GameState.rank.monastic;
            const isProbost = !!(GameState.rank && GameState.rank.probost);
            const pet = GameState.abbotPetition && GameState.abbotPetition.probost;
            if (fTier0 >= 1 && ['armarius','prior'].includes(mRank0)) {
                if (isProbost) {
                    h += `<div style="padding:10px 15px; margin-bottom:16px; background:rgba(90,154,90,0.08); border-left:3px solid #5a9a5a; border-radius:6px; font-size:0.8rem;">
                        ✝️ ${lang==='en'?'You serve as Provost — the parish is entrusted to you.':'Sloužíš jako Probošt — farnost je ti svěřena.'}
                    </div>`;
                } else if (pet && pet.status === 'pending') {
                    h += `<div style="padding:10px 15px; margin-bottom:16px; background:rgba(197,160,89,0.06); border-left:3px solid var(--accent-gold); border-radius:6px; font-size:0.8rem;">
                        ⏳ ${lang==='en'?'Petition awaits the Abbot\'s reply.':'Žádost čeká na odpověď opata.'}
                    </div>`;
                } else {
                    h += `<div style="padding:10px 15px; margin-bottom:16px; background:rgba(197,160,89,0.06); border-left:3px solid var(--accent-gold); border-radius:6px; font-size:0.8rem;">
                        <div style="margin-bottom:6px;">✝️ ${lang==='en'?'The parish could be entrusted to you.':'Farnost by ti mohla být svěřena.'}</div>
                        <button class="craft-btn" onclick="Game.submitAbbotPetition('probost')">📜 ${lang==='en'?'Petition the Abbot':'Zažádat opata'}</button>
                    </div>`;
                }
            }
        }

        // Pilíř Úklid (T2) — živý stav; ostatní pilíře zamčené (sprinty T3–T5)
        const t = GameState.templum || {};
        const now = Date.now();
        const lit = (t.litUntil || 0) > now;
        const clean = (t.cleanUntil || 0) > now;
        const litTxt = lit
            ? `🕯️ ${lang==='en'?'candles burning':'svíce hoří'} (${Math.ceil(((t.litUntil) - now) / 3600000)} h)`
            : `🌑 ${lang==='en'?'dark — no candles in store':'zhasnuto — chybí svíce v zásobě'}`;
        const cleanTxt = clean
            ? `🧹 ${lang==='en'?'clean':'uklizeno'} (${Math.ceil(((t.cleanUntil) - now) / 3600000)} h)${t.lastCleaner ? ` · ${t.lastCleaner}` : ''}`
            : `🕸️ ${lang==='en'?'dusty — no brother available':'zaprášeno — žádný bratr neměl kdy'}`;

        // Pilíř Mše (T3) — checklist surovin + tlačítko, cooldown 7 d
        const inv = GameState.inventory || {};
        const nextMass = t.nextMass || 0;
        const massReady = nextMass <= now;
        const bestIncense = ['incense_olibanum','incense_styrax','incense_pine','incense_spruce'].find(id => (inv[id] || 0) > 0);
        const wineOk = (inv['vinum'] || 0) > 0 || (inv['wine'] || 0) > 0;
        const reqRow = (ok, label) => `<div style="font-size:0.7rem; margin-top:2px; ${ok ? 'opacity:0.75;' : 'color:#c0392b;'}">${ok ? '✓' : '✗'} ${label}</div>`;
        const allOk = (inv['candle'] || 0) >= 2 && wineOk && !!bestIncense && (inv['hostia'] || 0) >= 3;
        const incName = bestIncense ? ((typeof iName === 'function') ? iName(bestIncense) : bestIncense) : (lang==='en'?'incense':'kadidlo');

        h += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:8px;">`;
        h += `<div style="padding:12px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-size:1.5rem; margin-bottom:4px;">🕯️</div>
                <div style="font-weight:bold; font-size:0.82rem;">${lang==='en'?'Church upkeep':'Úklid kostela'}</div>
                <div style="font-size:0.7rem; margin-top:5px; ${lit ? '' : 'color:#c0392b;'}">${litTxt}</div>
                <div style="font-size:0.7rem; margin-top:2px; ${clean ? '' : 'color:#c0392b;'}">${cleanTxt}</div>
                <div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'1 candle/day · a lay brother cleans daily':'1 svíce/den · konvrš uklízí denně'}</div>
              </div>`;

        h += `<div style="padding:12px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-size:1.5rem; margin-bottom:4px;">⛪</div>
                <div style="font-weight:bold; font-size:0.82rem;">${lang==='en'?'Mass':'Mše'}</div>`;
        if (!massReady) {
            h += `<div style="font-size:0.7rem; margin-top:5px; opacity:0.7;">⏳ ${lang==='en'?'next mass in':'příští mše za'} ${Math.ceil((nextMass - now) / (24*3600000))} d</div>`;
        } else {
            const _fs = (typeof ChroniconSystem !== 'undefined' && ChroniconSystem._snap && ChroniconSystem._snap.feast && ChroniconSystem._snap.feast.active) ? ChroniconSystem._snap.feast : null;
            if (_fs) {
                const fName = (lang === 'en' ? (_fs.name_en || _fs.name_cs) : _fs.name_cs) || '';
                h += `<div style="font-size:0.68rem; color:var(--accent-gold); font-weight:bold; margin-top:4px;">🎉 ${lang==='en'?'Feast of':'Svátek'} ${fName} — ${lang==='en'?'mass counts double!':'mše dvojnásob!'}</div>`;
            }
            h += reqRow((inv['candle'] || 0) >= 2, `2× ${lang==='en'?'candle':'svíce'} (${inv['candle'] || 0})`);
            h += reqRow(wineOk, `1× ${lang==='en'?'wine':'víno'} (${(inv['vinum'] || 0) + (inv['wine'] || 0)})`);
            h += reqRow(!!bestIncense, `1× ${incName}`);
            h += reqRow((inv['hostia'] || 0) >= 3, `3× ${lang==='en'?'host wafers':'hostie'} (${inv['hostia'] || 0})`);
            {
                const VESTMENT_BY_COLOR = { white: 'roucho_bile', purple: 'roucho_fialove', green: 'roucho_zelene', red: 'roucho_cervene' };
                const colorNames = { white: lang==='en'?'white':'bílá', purple: lang==='en'?'purple':'fialová', green: lang==='en'?'green':'zelená', red: lang==='en'?'red':'červená' };
                const litColor = (typeof CalendarSystem !== 'undefined' && CalendarSystem.getLiturgicalColor) ? CalendarSystem.getLiturgicalColor(new Date()) : null;
                const vId = litColor ? VESTMENT_BY_COLOR[litColor] : null;
                const hasV = vId ? (inv[vId] || 0) >= 1 : true;
                if (litColor) h += reqRow(hasV, (lang==='en'?'vestment: ':'roucho: ') + colorNames[litColor]);
            }
            if ((inv['reliquia'] || 0) >= 1) h += `<div style="font-size:0.7rem; margin-top:2px; color:var(--accent-gold);">✨ ${lang==='en'?'relic':'relikvie'} +1</div>`;
            if (!lit || !clean) h += `<div style="font-size:0.64rem; color:#e67e22; margin-top:4px;">⚠️ ${lang==='en'?'dark/dusty church — mass will be halved':'zhaslý/zaprášený kostel — mše bude poloviční'}</div>`;
            h += `<button class="craft-btn" style="margin-top:6px;" ${allOk ? '' : 'disabled'} onclick="Game.serveMass()">⛪ ${lang==='en'?'Hold mass':'Sloužit mši'}</button>`;
        }
        h += `<div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'weekly · better incense, greater grace':'týdně · lepší kadidlo, větší milost'}</div>
              ${this._massHistoryHtml(lang)}
              </div>`;

        // Pilíř Zpověď (T4) — odpočet + poslední záznam
        const nextConf = t.nextConfession || 0;
        const confDays = Math.max(0, Math.ceil((nextConf - now) / (24*3600000)));
        const lc = t.lastConfession;
        const lcChoiceTxt = lc ? (lc.choice === 'strict' ? (lang==='en'?'strict penance':'přísné pokání')
                              : lc.choice === 'lenient' ? (lang==='en'?'leniency':'shovívavost')
                              : (lang==='en'?'turned away':'odmítnut')) : null;
        h += `<div style="padding:12px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-size:1.5rem; margin-bottom:4px;">🙏</div>
                <div style="font-weight:bold; font-size:0.82rem;">${lang==='en'?'Confession':'Zpověď'}</div>
                <div style="font-size:0.7rem; margin-top:5px; opacity:0.75;">⏳ ${lang==='en'?'next penitent in':'další zpovědník za'} ${confDays} d</div>
                ${this._confessionHistoryHtml(lang)}
                <div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'the countryside comes to confess · your word weighs':'kraj se přichází vyznat · tvé slovo má váhu'}</div>
              </div>`;

        // Pilíř Dary (T5) — páteříky/vosk → Ecclesia
        const beadsN = inv['paternoster_beads'] || 0;
        const waxN = inv['beeswax'] || 0;
        const crayfishN = inv['crayfish_boiled'] || 0;
        const ld = t.lastDonation;
        h += `<div style="padding:12px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-size:1.5rem; margin-bottom:4px;">📿</div>
                <div style="font-weight:bold; font-size:0.82rem;">${lang==='en'?'Offerings':'Dary'}</div>
                <div style="display:flex; align-items:center; gap:6px; font-size:0.7rem; margin-top:5px;">
                  <span style="flex:1;">📿 ${lang==='en'?'Paternoster beads':'Páteříky'} (${beadsN}) → +5</span>
                  <button class="craft-btn" style="padding:2px 8px; font-size:0.66rem;" ${beadsN >= 1 ? '' : 'disabled'} onclick="Game.templumDonate('paternoster_beads')">${lang==='en'?'Offer':'Darovat'}</button>
                </div>
                <div style="display:flex; align-items:center; gap:6px; font-size:0.7rem; margin-top:3px;">
                  <span style="flex:1;">🐝 5× ${lang==='en'?'beeswax':'vosk'} (${waxN}) → +2</span>
                  <button class="craft-btn" style="padding:2px 8px; font-size:0.66rem;" ${waxN >= 5 ? '' : 'disabled'} onclick="Game.templumDonate('beeswax')">${lang==='en'?'Offer':'Darovat'}</button>
                </div>
                <div style="display:flex; align-items:center; gap:6px; font-size:0.7rem; margin-top:3px;">
                  <span style="flex:1;">🦞 ${lang==='en'?'crayfish boiled in beer':'raci vaření v pivu'} (${crayfishN}) → +3</span>
                  <button class="craft-btn" style="padding:2px 8px; font-size:0.66rem;" ${crayfishN >= 1 ? '' : 'disabled'} onclick="Game.templumDonate('crayfish_boiled')">${lang==='en'?'Offer':'Darovat'}</button>
                </div>
                ${ld ? `<div style="font-size:0.66rem; opacity:0.6; margin-top:4px;">${lang==='en'?'last offering':'poslední dar'}: ${(typeof iName==='function')?iName(ld.id):ld.id}</div>` : ''}
                ${this._donationHistoryHtml(lang)}
                <div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'Ecclesia remembers the giving hand':'Ecclesia si pamatuje štědrou ruku'}</div>
              </div>`;

        // Pilíř Poutníci (T6-V1)
        const lp = t.lastPilgrims;
        h += `<div style="padding:12px; background:rgba(255,255,255,0.4); border:1px solid rgba(197,160,89,0.25); border-radius:8px;">
                <div style="font-size:1.5rem; margin-bottom:4px;">🚶</div>
                <div style="font-weight:bold; font-size:0.82rem;">${lang==='en'?'Pilgrims':'Poutníci'}</div>
                <div style="font-size:0.7rem; margin-top:5px; opacity:0.75;">${lp
                    ? (lang==='en' ? 'last pilgrimage: ' + lp.grose + ' groschen offering' : 'poslední pouť: ' + lp.grose + ' grošů ofěry')
                    : (lang==='en' ? 'the countryside is quiet for now' : 'kraj zatím mlčí')}</div>
                ${this._pilgrimsHistoryHtml(lang)}
                ${(inv['reliquia'] || 0) >= 1 ? `<div style="font-size:0.68rem; color:var(--accent-gold); margin-top:2px;">✨ ${lang==='en'?'the relic draws them':'relikvie je přitahuje'}</div>` : `<div style="font-size:0.66rem; opacity:0.55; margin-top:2px;">${lang==='en'?'a relic would draw more':'relikvie by přitáhla víc'}</div>`}
                <div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'weekly · a living church draws the road':'týdně · živý kostel přitahuje cestu'}</div>
              </div>`;

        h += this._parishCardHtml(lang);

        h += `</div></div>`;
        return h;
    },
};