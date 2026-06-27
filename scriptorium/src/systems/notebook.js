const NotebookSystem = {
    activeType: 'tabula',
    activeContainer: 'notebook-content',
    activeCategory: 'all',
    activeEnSection: 'recipes',
    
    data: {
        tabula: [],
        adversaria: [],
        vademecum: [],
        florilegium: [],
        enchiridion: { recipes: [], strategies: [], journal: [], goals: [] }
    },
    
    init() {
        const saved = localStorage.getItem('scriptorium_notebooks');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.assign(this.data, parsed);
            } catch(e) {}
        }
    },
    
    save() {
        localStorage.setItem('scriptorium_notebooks', JSON.stringify(this.data));
    },
    
    addTabula(text) {
        if (!text || text.trim().length === 0 || text.length > 200) return false;
        if (this.data.tabula.length >= 3) this.data.tabula.pop();
        this.data.tabula.unshift({ id: Date.now(), text, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    wipeTabula() {
        this.data.tabula = [];
        this.save();
    },
    
    addAdversaria(text, category = 'general') {
        if (!text || text.trim().length === 0 || text.length > 500) return false;
        this.data.adversaria.unshift({ id: Date.now(), text, category, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    deleteAdversaria(id) {
        this.data.adversaria = this.data.adversaria.filter(n => n.id !== id);
        this.save();
    },
    
    addVademecum(text, pinned = false) {
        if (!text || text.trim().length === 0 || text.length > 1000) return false;
        this.data.vademecum.unshift({ id: Date.now(), text, pinned, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    togglePinVademecum(id) {
        const n = this.data.vademecum.find(n => n.id === id);
        if (n) { n.pinned = !n.pinned; this.save(); }
    },
    
    addFlorilegium(quote, source, category = 'library') {
        if (!quote || !source) return false;
        this.data.florilegium.unshift({ id: Date.now(), quote, source, category, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    addEnchiridion(section, title, content) {
        if (!title || !content) return false;
        this.data.enchiridion[section].unshift({ id: Date.now(), title, content, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    deleteEnchiridion(section, id) {
        this.data.enchiridion[section] = this.data.enchiridion[section].filter(e => e.id !== id);
        this.save();
    },
    
    exportEnchiridion() {
        const blob = new Blob([JSON.stringify(this.data.enchiridion, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enchiridion_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    render(type, containerId = 'notebook-content') {
        this.activeType = type;
        if (containerId !== 'notebook-content') {
            this.activeContainer = containerId;
        }
        
        const el = document.getElementById(this.activeContainer);
        if (!el) return;
        
        switch(type) {
            case 'tabula': this.renderTabula(el); break;
            case 'adversaria': this.renderAdversaria(el); break;
            case 'vademecum': this.renderVademecum(el); break;
            case 'florilegium': this.renderFlorilegium(el); break;
            case 'enchiridion': this.renderEnchiridion(el); break;
            default: el.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.5;">Vyber typ zápisníku</div>';
        }
    },
    
    _lang() {
        return (GameState.settings && GameState.settings.language) || 'cs';
    },

    _locale() {
        return this._lang() === 'en' ? 'en-GB' : 'cs-CZ';
    },

    renderTabula(el) {
        const lang = this._lang();
        const notes = this.data.tabula;
        const title     = lang==='en' ? '📋 Wax Tablet (Tabula)'                                      : '📋 Vosková destička (Tabula)';
        const subtitle  = lang==='en' ? `Temporary notes (${notes.length}/3). Erased on page reload.` : `Dočasné poznámky (${notes.length}/3). Zmizí při restartu prohlížeče.`;
        const pholder   = lang==='en' ? 'Inscribe a note (max 200 chars)...'                          : 'Vyrýt poznámku (max 200 znaků)...';
        const btnWipe   = lang==='en' ? '🧹 Smooth the wax'                                           : '🧹 Uhladit vosk';
        const btnCarve  = lang==='en' ? '📝 Inscribe'                                                  : '📝 Vyrýt';
        const notifyW   = lang==='en' ? '🧹 Wax smoothed!'                                             : '🧹 Vosk uhlazený!';
        const notifyC   = lang==='en' ? '✅ Inscribed!'                                                : '✅ Vyryt!';
        const alertMsg  = lang==='en' ? '⚠️ Enter text (max 200 chars)'                               : '⚠️ Zadej text (max 200 znaků)';
        const empty     = lang==='en' ? 'No notes'                                                     : 'Žádné poznámky';

        let h = `<div style="padding:20px;">
            <h2>${title}</h2>
            <p style="opacity:0.7; font-size:0.9rem;">${subtitle}</p>
            <textarea id="tabula-input" placeholder="${pholder}" maxlength="200"
                style="width:100%; min-height:60px; padding:10px; margin:10px 0; border:2px solid var(--border-color); 
                border-radius:4px; font-family:inherit; background:var(--bg-parchment); color:var(--ink-primary);"></textarea>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button onclick="NotebookSystem.wipeTabula(); NotebookSystem.render('tabula', NotebookSystem.activeContainer); UI.notify('${notifyW}');" 
                    class="craft-btn" style="background:var(--accent-wax);">${btnWipe}</button>
                <button onclick="if(NotebookSystem.addTabula(document.getElementById('tabula-input').value)){document.getElementById('tabula-input').value=''; NotebookSystem.render('tabula', NotebookSystem.activeContainer); UI.notify('${notifyC}');}else{alert('${alertMsg}')}" 
                    class="craft-btn">${btnCarve}</button>
            </div><div>`;
        
        if (notes.length === 0) {
            h += `<div style="text-align:center; opacity:0.5; padding:20px;">${empty}</div>`;
        } else {
            notes.forEach(n => {
                const ago = this.timeAgo(n.timestamp);
                h += `<div style="padding:12px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold); margin-bottom:10px; border-radius:4px;">
                    <div style="font-size:0.75rem; opacity:0.6; margin-bottom:6px;">📌 ${ago}</div>
                    <div style="white-space:pre-wrap;">${this.esc(n.text)}</div></div>`;
            });
        }
        el.innerHTML = h + '</div></div>';
    },
    
    renderAdversaria(el) {
        const lang = this._lang();
        const notes = this.data.adversaria;
        const categories = [...new Set(notes.map(n => n.category))];
        const active = this.activeCategory || 'all';
        const filtered = active === 'all' ? notes : notes.filter(n => n.category === active);

        const title     = lang==='en' ? '📔 Working Notes (Adversaria)'                 : '📔 Pracovní sešit (Adversaria)';
        const countLbl  = lang==='en' ? `${notes.length} notes`                         : `${notes.length} poznámek`;
        const allLbl    = lang==='en' ? 'All'                                            : 'Vše';
        const pholder   = lang==='en' ? 'New note (max 500 chars)...'                    : 'Nová poznámka (max 500 znaků)...';
        const catPh     = lang==='en' ? 'Category'                                       : 'Kategorie';
        const btnSave   = lang==='en' ? '💾 Save'                                        : '💾 Uložit';
        const notify    = lang==='en' ? '✅ Saved!'                                      : '✅ Uloženo!';
        const alertMsg  = lang==='en' ? 'Max 500 chars!'                                 : 'Max 500 znaků!';
        const empty     = lang==='en' ? 'No notes'                                       : 'Žádné poznámky';
        
        let h = `<div style="padding:20px;">
            <h2>${title}</h2>
            <p style="opacity:0.7; font-size:0.9rem;">${countLbl}</p>
            <div style="margin:10px 0; display:flex; gap:5px; flex-wrap:wrap;">
                <button onclick="NotebookSystem.activeCategory='all'; NotebookSystem.render('adversaria', NotebookSystem.activeContainer);" 
                    class="filter-btn" style="${active==='all'?'background:var(--accent-gold); color:white;':''}">${allLbl}</button>`;
        
        categories.forEach(cat => {
            h += `<button onclick="NotebookSystem.activeCategory='${cat}'; NotebookSystem.render('adversaria', NotebookSystem.activeContainer);" 
                class="filter-btn" style="${active===cat?'background:var(--accent-gold); color:white;':''}">${cat}</button>`;
        });
        
        h += `</div>
            <textarea id="adv-input" placeholder="${pholder}" maxlength="500"
                style="width:100%; min-height:80px; padding:10px; margin:10px 0; border:2px solid var(--border-color); 
                border-radius:4px; font-family:inherit; background:var(--bg-parchment); color:var(--ink-primary);"></textarea>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="adv-cat" placeholder="${catPh}" style="flex:1; padding:8px; border:2px solid var(--border-color); border-radius:4px;">
                <button onclick="if(NotebookSystem.addAdversaria(document.getElementById('adv-input').value, document.getElementById('adv-cat').value||'general')){document.getElementById('adv-input').value=''; document.getElementById('adv-cat').value=''; NotebookSystem.render('adversaria', NotebookSystem.activeContainer); UI.notify('${notify}');}else{alert('${alertMsg}')}" 
                    class="craft-btn">${btnSave}</button>
            </div><div>`;
        
        if (filtered.length === 0) {
            h += `<div style="text-align:center; opacity:0.5; padding:20px;">${empty}</div>`;
        } else {
            filtered.forEach(n => {
                const date = new Date(n.timestamp).toLocaleString(this._locale());
                h += `<div style="padding:12px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-wax); margin-bottom:12px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="font-size:0.75rem; opacity:0.7;">📝 ${date} | #${n.category}</div>
                        <button onclick="NotebookSystem.deleteAdversaria(${n.id}); NotebookSystem.render('adversaria', NotebookSystem.activeContainer);" 
                            style="background:none; border:none; cursor:pointer; opacity:0.5; font-size:1.2rem;">🗑️</button>
                    </div>
                    <div style="white-space:pre-wrap;">${this.esc(n.text)}</div></div>`;
            });
        }
        el.innerHTML = h + '</div></div>';
    },
    
    renderVademecum(el) {
        const lang = this._lang();
        const notes = this.data.vademecum;
        const pinned   = notes.filter(n => n.pinned);
        const unpinned = notes.filter(n => !n.pinned);

        const title     = lang==='en' ? '📘 Vademecum (Go with me)'                        : '📘 Vademecum (Jdi se mnou)';
        const countLbl  = lang==='en' ? `${notes.length} notes | Local storage`            : `${notes.length} poznámek | Local storage`;
        const pholder   = lang==='en' ? 'Important note (max 1000 chars)...'               : 'Důležitá poznámka (max 1000 znaků)...';
        const pinLbl    = lang==='en' ? '⭐ Pin'                                            : '⭐ Připnout';
        const btnSave   = lang==='en' ? '💾 Save'                                           : '💾 Uložit';
        const notify    = lang==='en' ? '✅ Saved!'                                         : '✅ Uloženo!';
        const alertMsg  = lang==='en' ? 'Max 1000 chars!'                                  : 'Max 1000 znaků!';
        const pinnedLbl = lang==='en' ? `⭐ Pinned (${pinned.length})`                     : `⭐ Připnuté (${pinned.length})`;
        const allLbl    = lang==='en' ? `📝 All notes (${unpinned.length})`                : `📝 Všechny poznámky (${unpinned.length})`;
        const empty     = lang==='en' ? 'No notes'                                          : 'Žádné poznámky';
        
        let h = `<div style="padding:20px;">
            <h2>${title}</h2>
            <p style="opacity:0.7; font-size:0.9rem;">${countLbl}</p>
            <textarea id="vad-input" placeholder="${pholder}" maxlength="1000"
                style="width:100%; min-height:100px; padding:10px; margin:10px 0; border:2px solid var(--border-color); 
                border-radius:4px; font-family:inherit; background:var(--bg-parchment); color:var(--ink-primary);"></textarea>
            <div style="display:flex; gap:10px; margin-bottom:20px; align-items:center;">
                <label style="display:flex; align-items:center; gap:5px;">
                    <input type="checkbox" id="vad-pin"> ${pinLbl}
                </label>
                <button onclick="if(NotebookSystem.addVademecum(document.getElementById('vad-input').value, document.getElementById('vad-pin').checked)){document.getElementById('vad-input').value=''; document.getElementById('vad-pin').checked=false; NotebookSystem.render('vademecum', NotebookSystem.activeContainer); UI.notify('${notify}');}else{alert('${alertMsg}')}" 
                    class="craft-btn" style="margin-left:auto;">${btnSave}</button>
            </div>`;
        
        if (pinned.length > 0) {
            h += `<h3>${pinnedLbl}</h3>`;
            pinned.forEach(n => {
                const date = new Date(n.timestamp).toLocaleString(this._locale());
                h += `<div style="padding:12px; background:rgba(197,160,89,0.1); border-left:3px solid var(--accent-gold); margin-bottom:12px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="font-size:0.75rem; opacity:0.7;">${date}</div>
                        <button onclick="NotebookSystem.togglePinVademecum(${n.id}); NotebookSystem.render('vademecum', NotebookSystem.activeContainer);" 
                            style="background:none; border:none; cursor:pointer; font-size:1.2rem;">⭐</button>
                    </div>
                    <div style="white-space:pre-wrap;">${this.esc(n.text)}</div></div>`;
            });
        }
        
        if (unpinned.length > 0) {
            h += `<h3>${allLbl}</h3>`;
            unpinned.forEach(n => {
                const date = new Date(n.timestamp).toLocaleString(this._locale());
                h += `<div style="padding:12px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold); margin-bottom:12px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="font-size:0.75rem; opacity:0.7;">${date}</div>
                        <button onclick="NotebookSystem.togglePinVademecum(${n.id}); NotebookSystem.render('vademecum', NotebookSystem.activeContainer);" 
                            style="background:none; border:none; cursor:pointer; opacity:0.5; font-size:1.2rem;">⭐</button>
                    </div>
                    <div style="white-space:pre-wrap;">${this.esc(n.text)}</div></div>`;
            });
        }
        
        if (notes.length === 0) {
            h += `<div style="text-align:center; opacity:0.5; padding:20px;">${empty}</div>`;
        }
        
        el.innerHTML = h + '</div>';
    },
    
    renderFlorilegium(el) {
        const lang = this._lang();
        const entries = this.data.florilegium;

        const title     = lang==='en' ? '🌸 Florilegium (Anthology of Flowers)'                                     : '🌸 Florilegium (Sbírka květů)';
        const countLbl  = lang==='en' ? `${entries.length} quotes`                                                  : `${entries.length} citátů`;
        const empty     = lang==='en' ? 'No quotes yet.\nRead books in the Library and save interesting passages!'  : 'Zatím žádné citáty.\nČti knihy v Knihovně a ukládej zajímavé pasáže!';

        let h = `<div style="padding:20px;">
            <h2>${title}</h2>
            <p style="opacity:0.7; font-size:0.9rem;">${countLbl}</p>`;
        
        if (entries.length === 0) {
            h += `<div style="text-align:center; opacity:0.5; padding:20px;">${empty}</div>`;
        } else {
            entries.forEach(e => {
                const date = new Date(e.timestamp).toLocaleString(this._locale());
                h += `<div style="padding:14px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold); margin-bottom:15px; border-radius:4px;">
                    <div style="font-size:0.75rem; opacity:0.7; margin-bottom:8px;">📖 ${e.source} | ${date}</div>
                    <div style="font-style:italic;">"${this.esc(e.quote)}"</div></div>`;
            });
        }
        
        el.innerHTML = h + '</div>';
    },
    
    renderEnchiridion(el) {
        const lang = this._lang();
        const active  = this.activeEnSection || 'recipes';
        const entries = this.data.enchiridion[active];

        const title     = lang==='en' ? '📖 Enchiridion (Master Manual)'  : '📖 Enchiridion (Mistrovský manuál)';
        const titlePh   = lang==='en' ? 'Title...'                         : 'Nadpis...';
        const contentPh = lang==='en' ? 'Content...'                       : 'Obsah...';
        const btnAdd    = lang==='en' ? '💾 Add'                           : '💾 Přidat';
        const btnExp    = lang==='en' ? '📤 Export JSON'                   : '📤 Export JSON';
        const notifyA   = lang==='en' ? '✅ Added!'                        : '✅ Přidáno!';
        const notifyE   = lang==='en' ? '✅ Exported!'                     : '✅ Export!';
        const alertMsg  = lang==='en' ? 'Enter title and content!'         : 'Zadej nadpis i obsah!';
        const empty     = lang==='en' ? 'No entries'                       : 'Žádné záznamy';

        const labels = lang==='en'
            ? {recipes:'📜 Recipes', strategies:'⚔️ Strategies', journal:'📔 Journal', goals:'🎯 Goals'}
            : {recipes:'📜 Recepty', strategies:'⚔️ Strategie', journal:'📔 Denník', goals:'🎯 Cíle'};
        
        let h = `<div style="padding:20px;">
            <h2>${title}</h2>
            <div style="display:flex; gap:5px; margin:10px 0; flex-wrap:wrap;">`;
        
        ['recipes', 'strategies', 'journal', 'goals'].forEach(sec => {
            h += `<button onclick="NotebookSystem.activeEnSection='${sec}'; NotebookSystem.render('enchiridion', NotebookSystem.activeContainer);" 
                class="filter-btn" style="${active===sec?'background:var(--accent-gold); color:white;':''}">${labels[sec]}</button>`;
        });
        
        h += `</div>
            <input type="text" id="en-title" placeholder="${titlePh}" style="width:100%; padding:10px; margin:10px 0; border:2px solid var(--border-color); border-radius:4px;">
            <textarea id="en-content" placeholder="${contentPh}"
                style="width:100%; min-height:120px; padding:10px; margin:10px 0; border:2px solid var(--border-color); 
                border-radius:4px; font-family:inherit; background:var(--bg-parchment); color:var(--ink-primary);"></textarea>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button onclick="if(NotebookSystem.addEnchiridion('${active}', document.getElementById('en-title').value, document.getElementById('en-content').value)){document.getElementById('en-title').value=''; document.getElementById('en-content').value=''; NotebookSystem.render('enchiridion', NotebookSystem.activeContainer); UI.notify('${notifyA}');}else{alert('${alertMsg}')}" 
                    class="craft-btn">${btnAdd}</button>
                <button onclick="NotebookSystem.exportEnchiridion(); UI.notify('${notifyE}');" 
                    class="craft-btn">${btnExp}</button>
            </div><div>`;
        
        if (entries.length === 0) {
            h += `<div style="text-align:center; opacity:0.5; padding:20px;">${empty}</div>`;
        } else {
            entries.forEach(e => {
                const date = new Date(e.timestamp).toLocaleString(this._locale());
                h += `<div style="padding:14px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-wax); margin-bottom:15px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="margin:0;">${this.esc(e.title)}</h3>
                        <button onclick="NotebookSystem.deleteEnchiridion('${active}', ${e.id}); NotebookSystem.render('enchiridion', NotebookSystem.activeContainer);" 
                            style="background:none; border:none; cursor:pointer; opacity:0.5; font-size:1.2rem;">🗑️</button>
                    </div>
                    <div style="font-size:0.75rem; opacity:0.6; margin-bottom:10px;">${date}</div>
                    <div style="white-space:pre-wrap;">${this.esc(e.content)}</div></div>`;
            });
        }
        
        el.innerHTML = h + '</div></div>';
    },
    
    esc(t) {
        const div = document.createElement('div');
        div.textContent = t;
        return div.innerHTML;
    },
    
    timeAgo(ts) {
        const lang = this._lang();
        const sec = Math.floor((Date.now() - ts) / 1000);
        if (lang === 'en') {
            if (sec < 60)    return 'just now';
            if (sec < 3600)  return `${Math.floor(sec/60)} min ago`;
            if (sec < 86400) return `${Math.floor(sec/3600)} h ago`;
            return `${Math.floor(sec/86400)} days ago`;
        }
        if (sec < 60)    return 'před chvílí';
        if (sec < 3600)  return `před ${Math.floor(sec/60)} min`;
        if (sec < 86400) return `před ${Math.floor(sec/3600)} h`;
        return `před ${Math.floor(sec/86400)} dny`;
    }
};
	// ===== I-CHING SYSTEM =====
