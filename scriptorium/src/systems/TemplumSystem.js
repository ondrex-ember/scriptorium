// ─────────────────────────────────────────────────────────────
// TemplumSystem — kostelní větev (MRD templum-reference.md)
// T1: skeleton — gate (mnišský rank frater+) + kostra pilířů.
// Žádná mechanika; pilíře (Úklid/Mše/Zpověď/Dary) = další sprinty.
// ─────────────────────────────────────────────────────────────

const TemplumSystem = {

    // Gate: mnišská dráha od bratra výš (Cursus Monasticus)
    isUnlocked: function() {
        const m = GameState.rank && GameState.rank.monastic;
        return ['frater', 'armarius', 'prior'].includes(m);
    },

    // Zobrazit/skrýt top-level tab dle gate (volá se z existujícího tick call-site + při přepínání tabů)
    updateTabVisibility: function() {
        const btn = document.getElementById('home-tab-templum');
        if (!btn) return;
        const show = this.isUnlocked();
        const cur = btn.style.display !== 'none';
        if (show !== cur) btn.style.display = show ? '' : 'none';
    },

    renderTemplumTab: function() {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        if (!this.isUnlocked()) {
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
              ${(GameState.inventory['reliquia'] || 0) >= 1 ? `<div style="font-size:0.78rem; color:var(--accent-gold); margin-top:4px;">✨ ${lang==='en' ? 'A relic is enshrined — the mass bears greater grace.' : 'Relikvie vystavena — mše nese větší milost.'}</div>` : ''}
            </div>
          </div>`;

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
            if ((inv['reliquia'] || 0) >= 1) h += `<div style="font-size:0.7rem; margin-top:2px; color:var(--accent-gold);">✨ ${lang==='en'?'relic':'relikvie'} +1</div>`;
            if (!lit || !clean) h += `<div style="font-size:0.64rem; color:#e67e22; margin-top:4px;">⚠️ ${lang==='en'?'dark/dusty church — mass will be halved':'zhaslý/zaprášený kostel — mše bude poloviční'}</div>`;
            h += `<button class="craft-btn" style="margin-top:6px;" ${allOk ? '' : 'disabled'} onclick="Game.serveMass()">⛪ ${lang==='en'?'Hold mass':'Sloužit mši'}</button>`;
        }
        h += `<div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'weekly · better incense, greater grace':'týdně · lepší kadidlo, větší milost'}</div>
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
                ${lc ? `<div style="font-size:0.7rem; margin-top:2px; opacity:0.65;">${lang==='en'?'last':'naposled'}: ${lc.name} — ${lcChoiceTxt}</div>` : ''}
                <div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'the countryside comes to confess · your word weighs':'kraj se přichází vyznat · tvé slovo má váhu'}</div>
              </div>`;

        // Pilíř Dary (T5) — páteříky/vosk → Ecclesia
        const beadsN = inv['paternoster_beads'] || 0;
        const waxN = inv['beeswax'] || 0;
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
                ${ld ? `<div style="font-size:0.66rem; opacity:0.6; margin-top:4px;">${lang==='en'?'last offering':'poslední dar'}: ${(typeof iName==='function')?iName(ld.id):ld.id}</div>` : ''}
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
                ${(inv['reliquia'] || 0) >= 1 ? `<div style="font-size:0.68rem; color:var(--accent-gold); margin-top:2px;">✨ ${lang==='en'?'the relic draws them':'relikvie je přitahuje'}</div>` : `<div style="font-size:0.66rem; opacity:0.55; margin-top:2px;">${lang==='en'?'a relic would draw more':'relikvie by přitáhla víc'}</div>`}
                <div style="font-size:0.62rem; opacity:0.55; font-style:italic; margin-top:5px;">${lang==='en'?'weekly · a living church draws the road':'týdně · živý kostel přitahuje cestu'}</div>
              </div>`;

        h += `</div></div>`;
        return h;
    },
};