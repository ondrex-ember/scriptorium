	const NotebookSystem = {
    activeType: null,
    activeContainer: 'notebook-content-inline',
    
    // Trik: všechny staré funkce nyní tajně čtou z hlavního GameState
    get data() {
        return GameState.notebooks;
    },
    
    init() {
        // Migrace ze starých izolovaných local storage přímo do savu
        if (!GameState.notebooks.migrated) {
            try {
                const adv = localStorage.getItem('scp_adversaria');
                if (adv) GameState.notebooks.adversaria = JSON.parse(adv);
                
                const vad = localStorage.getItem('scp_vademecum');
                if (vad) GameState.notebooks.vademecum = JSON.parse(vad);
                
                const flo = localStorage.getItem('scp_florilegium');
                if (flo) GameState.notebooks.florilegium = JSON.parse(flo);
                
                const ench = localStorage.getItem('scp_enchiridion');
                if (ench) GameState.notebooks.enchiridion = JSON.parse(ench);
                
                GameState.notebooks.migrated = true;
                Game.save();
            } catch(e) {}
        }
    },
    
    save() {
        Game.save(); // Nyní se sešity ukládají společně s celou hrou (a funguje na ně Export!)
    },
    
    addTabula(text) {
        if (!text || text.trim().length === 0) return false;
        if (text.length > 200) return false;
        this.data.tabula.unshift({ id: Date.now(), text, timestamp: Date.now() });
        if (this.data.tabula.length > 3) this.data.tabula.pop();
        this.save();
        return true;
    },
    
    wipeTabula() {
        this.data.tabula = [];
        this.save();
    },
    
    addAdversaria(text, category = 'general') {
        if (!text || text.length > 500) return false;
        this.data.adversaria.unshift({ id: Date.now(), text, category, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    deleteAdversaria(id) {
        this.data.adversaria = this.data.adversaria.filter(n => n.id !== id);
        this.save();
    },
    
    addVademecum(text, pinned = false) {
        if (!text || text.length > 1000) return false;
        this.data.vademecum.unshift({ id: Date.now(), text, pinned, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    togglePinVademecum(id) {
        const note = this.data.vademecum.find(n => n.id === id);
        if (note) {
            note.pinned = !note.pinned;
            this.save();
        }
    },
    
    addFlorilegium(quote, source, category = 'library') {
        const exists = this.data.florilegium.some(e => e.source === source && e.quote === quote);
        if (exists) return false;
        this.data.florilegium.unshift({ id: Date.now(), quote, source, category, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    addEnchiridion(section, title, content) {
        if (!['recipes', 'strategies', 'journal', 'goals'].includes(section)) return false;
        this.data.enchiridion[section].unshift({ id: Date.now(), title, content, timestamp: Date.now() });
        this.save();
        return true;
    },
    
    deleteEnchiridion(section, id) {
        this.data.enchiridion[section] = this.data.enchiridion[section].filter(e => e.id !== id);
        this.save();
    },
    
    exportEnchiridion() {
        const blob = new Blob([JSON.stringify(this.data.enchiridion, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enchiridion_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    render(type, containerId = 'notebook-content') {
        this.activeType = type;
        // Pokud je containerId předán, použijeme ho, jinak zkusíme zapamatovaný activeContainer, jinak fallback
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
    
    renderTabula(el) {
        const notes = this.data.tabula;
        let h = `<div style="padding:20px;">
            <h2>📋 Vosková destička (Tabula)</h2>
            <p style="opacity:0.7; font-size:0.9rem;">Dočasné poznámky (${notes.length}/3). Zmizí při restartu prohlížeče.</p>
            <textarea id="tabula-input" placeholder="Vyrýt poznámku (max 200 znaků)..." maxlength="200"
                style="width:100%; min-height:60px; padding:10px; margin:10px 0; border:2px solid var(--border-color); 
                border-radius:4px; font-family:inherit; background:var(--bg-parchment); color:var(--ink-primary);"></textarea>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button onclick="NotebookSystem.wipeTabula(); NotebookSystem.render('tabula', NotebookSystem.activeContainer); UI.notify('🧹 Vosk uhlazený!');" 
                    class="craft-btn" style="background:var(--accent-wax);">🧹 Uhladit vosk</button>
                <button onclick="if(NotebookSystem.addTabula(document.getElementById('tabula-input').value)){document.getElementById('tabula-input').value=''; NotebookSystem.render('tabula', NotebookSystem.activeContainer); UI.notify('✅ Vyryt!');}else{alert('⚠️ Zadej text (max 200 znaků)')}" 
                    class="craft-btn">📝 Vyrýt</button>
            </div><div>`;
        
        if (notes.length === 0) {
            h += '<div style="text-align:center; opacity:0.5; padding:20px;">Žádné poznámky</div>';
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
        const notes = this.data.adversaria;
        const categories = [...new Set(notes.map(n => n.category))];
        const active = this.activeCategory || 'all';
        const filtered = active === 'all' ? notes : notes.filter(n => n.category === active);
        
        let h = `<div style="padding:20px;">
            <h2>📔 Pracovní sešit (Adversaria)</h2>
            <p style="opacity:0.7; font-size:0.9rem;">${notes.length} poznámek</p>
            <div style="margin:10px 0; display:flex; gap:5px; flex-wrap:wrap;">
                <button onclick="NotebookSystem.activeCategory='all'; NotebookSystem.render('adversaria', NotebookSystem.activeContainer);" 
                    class="filter-btn" style="${active==='all'?'background:var(--accent-gold); color:white;':''}">Vše</button>`;
        
        categories.forEach(cat => {
            h += `<button onclick="NotebookSystem.activeCategory='${cat}'; NotebookSystem.render('adversaria', NotebookSystem.activeContainer);" 
                class="filter-btn" style="${active===cat?'background:var(--accent-gold); color:white;':''}">${cat}</button>`;
        });
        
        h += `</div>
            <textarea id="adv-input" placeholder="Nová poznámka (max 500 znaků)..." maxlength="500"
                style="width:100%; min-height:80px; padding:10px; margin:10px 0; border:2px solid var(--border-color); 
                border-radius:4px; font-family:inherit; background:var(--bg-parchment); color:var(--ink-primary);"></textarea>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="adv-cat" placeholder="Kategorie" style="flex:1; padding:8px; border:2px solid var(--border-color); border-radius:4px;">
                <button onclick="if(NotebookSystem.addAdversaria(document.getElementById('adv-input').value, document.getElementById('adv-cat').value||'general')){document.getElementById('adv-input').value=''; document.getElementById('adv-cat').value=''; NotebookSystem.render('adversaria', NotebookSystem.activeContainer); UI.notify('✅ Uloženo!');}else{alert('Max 500 znaků!')}" 
                    class="craft-btn">💾 Uložit</button>
            </div><div>`;
        
        if (filtered.length === 0) {
            h += '<div style="text-align:center; opacity:0.5; padding:20px;">Žádné poznámky</div>';
        } else {
            filtered.forEach(n => {
                const date = new Date(n.timestamp).toLocaleString('cs-CZ');
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
        const notes = this.data.vademecum;
        const pinned = notes.filter(n => n.pinned);
        const unpinned = notes.filter(n => !n.pinned);
        
        let h = `<div style="padding:20px;">
            <h2>📘 Vademecum (Jdi se mnou)</h2>
            <p style="opacity:0.7; font-size:0.9rem;">${notes.length} poznámek | Local storage</p>
            <textarea id="vad-input" placeholder="Důležitá poznámka (max 1000 znaků)..." maxlength="1000"
                style="width:100%; min-height:100px; padding:10px; margin:10px 0; border:2px solid var(--border-color); 
                border-radius:4px; font-family:inherit; background:var(--bg-parchment); color:var(--ink-primary);"></textarea>
            <div style="display:flex; gap:10px; margin-bottom:20px; align-items:center;">
                <label style="display:flex; align-items:center; gap:5px;">
                    <input type="checkbox" id="vad-pin"> ⭐ Připnout
                </label>
                <button onclick="if(NotebookSystem.addVademecum(document.getElementById('vad-input').value, document.getElementById('vad-pin').checked)){document.getElementById('vad-input').value=''; document.getElementById('vad-pin').checked=false; NotebookSystem.render('vademecum', NotebookSystem.activeContainer); UI.notify('✅ Uloženo!');}else{alert('Max 1000 znaků!')}" 
                    class="craft-btn" style="margin-left:auto;">💾 Uložit</button>
            </div>`;
        
        if (pinned.length > 0) {
            h += `<h3>⭐ Připnuté (${pinned.length})</h3>`;
            pinned.forEach(n => {
                const date = new Date(n.timestamp).toLocaleString('cs-CZ');
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
            h += `<h3>📝 Všechny poznámky (${unpinned.length})</h3>`;
            unpinned.forEach(n => {
                const date = new Date(n.timestamp).toLocaleString('cs-CZ');
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
            h += '<div style="text-align:center; opacity:0.5; padding:20px;">Žádné poznámky</div>';
        }
        
        el.innerHTML = h + '</div>';
    },
    
    renderFlorilegium(el) {
        const entries = this.data.florilegium;
        let h = `<div style="padding:20px;">
            <h2>🌸 Florilegium (Sbírka květů)</h2>
            <p style="opacity:0.7; font-size:0.9rem;">${entries.length} citátů</p>`;
        
        if (entries.length === 0) {
            h += '<div style="text-align:center; opacity:0.5; padding:20px;">Zatím žádné citáty.<br>Čti knihy v Knihovně a ukládej zajímavé pasáže!</div>';
        } else {
            entries.forEach(e => {
                const date = new Date(e.timestamp).toLocaleString('cs-CZ');
                h += `<div style="padding:14px; background:rgba(0,0,0,0.05); border-left:3px solid var(--accent-gold); margin-bottom:15px; border-radius:4px;">
                    <div style="font-size:0.75rem; opacity:0.7; margin-bottom:8px;">📖 ${e.source} | ${date}</div>
                    <div style="font-style:italic;">"${this.esc(e.quote)}"</div></div>`;
            });
        }
        
        el.innerHTML = h + '</div>';
    },
    
    renderEnchiridion(el) {
        const active = this.activeEnSection || 'recipes';
        const entries = this.data.enchiridion[active];
        
        let h = `<div style="padding:20px;">
            <h2>📖 Enchiridion (Mistrovský manuál)</h2>
            <div style="display:flex; gap:5px; margin:10px 0; flex-wrap:wrap;">`;
        
        ['recipes', 'strategies', 'journal', 'goals'].forEach(sec => {
            const labels = {recipes:'📜 Recepty', strategies:'⚔️ Strategie', journal:'📔 Denník', goals:'🎯 Cíle'};
            h += `<button onclick="NotebookSystem.activeEnSection='${sec}'; NotebookSystem.render('enchiridion', NotebookSystem.activeContainer);" 
                class="filter-btn" style="${active===sec?'background:var(--accent-gold); color:white;':''}">${labels[sec]}</button>`;
        });
        
        h += `</div>
            <input type="text" id="en-title" placeholder="Nadpis..." style="width:100%; padding:10px; margin:10px 0; border:2px solid var(--border-color); border-radius:4px;">
            <textarea id="en-content" placeholder="Obsah..."
                style="width:100%; min-height:120px; padding:10px; margin:10px 0; border:2px solid var(--border-color); 
                border-radius:4px; font-family:inherit; background:var(--bg-parchment); color:var(--ink-primary);"></textarea>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button onclick="if(NotebookSystem.addEnchiridion('${active}', document.getElementById('en-title').value, document.getElementById('en-content').value)){document.getElementById('en-title').value=''; document.getElementById('en-content').value=''; NotebookSystem.render('enchiridion', NotebookSystem.activeContainer); UI.notify('✅ Přidáno!');}else{alert('Zadej nadpis i obsah!')}" 
                    class="craft-btn">💾 Přidat</button>
                <button onclick="NotebookSystem.exportEnchiridion(); UI.notify('✅ Export!');" 
                    class="craft-btn">📤 Export JSON</button>
            </div><div>`;
        
        if (entries.length === 0) {
            h += '<div style="text-align:center; opacity:0.5; padding:20px;">Žádné záznamy</div>';
        } else {
            entries.forEach(e => {
                const date = new Date(e.timestamp).toLocaleString('cs-CZ');
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
        const sec = Math.floor((Date.now() - ts) / 1000);
        if (sec < 60) return 'před chvílí';
        if (sec < 3600) return `před ${Math.floor(sec/60)} min`;
        if (sec < 86400) return `před ${Math.floor(sec/3600)} h`;
        return `před ${Math.floor(sec/86400)} dny`;
    }
};
	// ===== I-CHING SYSTEM =====

