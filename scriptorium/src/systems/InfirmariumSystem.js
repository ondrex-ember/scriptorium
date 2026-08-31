// ─────────────────────────────────────────────────────────────
// InfirmariumSystem — Klášterní Ošetřovna & Sanatorium
// MRD: infirmarium (project reference) + infirmarium-library-books-mrd.md
// Sprint 1-3 + Enhanced Graphic Hospital Beds & Visitatio Medica Minigame
// ─────────────────────────────────────────────────────────────

const InfirmariumSystem = {

    // Gate: budova + tab se odemyká tech_infirmarium
    isUnlocked: function () {
        return !!(GameState.researchedTechs && GameState.researchedTechs.includes('tech_infirmarium'));
    },

    // Zobrazit/skrýt top-level tab dle gate (mirror TemplumSystem.updateTabVisibility)
    updateTabVisibility: function () {
        const btn = document.getElementById('home-tab-infirmarium');
        if (!btn) return;
        const show = this.isUnlocked();
        const cur = btn.style.display !== 'none';
        if (show !== cur) btn.style.display = show ? '' : 'none';
    },

    // 4 stanoviště (konvrší podrole) — ikony + gate tech, mapuje na CONVERSI_TASKS v game.js
    _STATIONS: [
        { id: 'servitor', icon: '🩺', tech: 'tech_infirmarium_servitor', name_cs: 'Ošetřovatel', name_en: 'Servitor', desc_cs: 'Přikládá obklady a pečuje o čistotu lůžek (-10% riziko).', desc_en: 'Applies compresses and cleans cots (-10% risk).' },
        { id: 'coquus', icon: '🍲', tech: 'tech_infirmarium_coquus', name_cs: 'Kuchař', name_en: 'Coquus', desc_cs: 'Vaří posilující bylinné polévky a kaše pro marody (-10% riziko).', desc_en: 'Brews restorative herbal broths for the sick (-10% risk).' },
        { id: 'hortulanus', icon: '🌿', tech: 'tech_infirmarium_hortulanus', name_cs: 'Bylinář', name_en: 'Hortulanus', desc_cs: 'Pěstuje šalvěj, heřmánek a léčivé byliny v klášterní zahradě.', desc_en: 'Grows sage, chamomile and healing herbs in monastery garden.' },
        { id: 'balneator', icon: '🔥', tech: 'tech_infirmarium_balneator', name_cs: 'Topič', name_en: 'Balneator', desc_cs: 'Udržuje síň ošetřovny a lázeň v teple (-10% riziko prochladnutí).', desc_en: 'Keeps the ward and bath warm (-10% chill risk).' }
    ],

    // 4 mnišský role (Infirmarius/Medicus/Apothecarius/Capellanus)
    _MONK_ROLES: [
        { id: 'infirmarium_infirmarius', icon: '🩺', name_cs: 'Infirmarius', name_en: 'Infirmarian', desc_cs: 'Celkový dohled nad ošetřovnou (-10% smrtelnost).', desc_en: 'General oversight of the ward (-10% mortality).' },
        { id: 'infirmarium_medicus', icon: '⚕️', name_cs: 'Medicus', name_en: 'Medicus', desc_cs: 'Humorální diagnostika a vedení vizit.', desc_en: 'Humoral diagnosis and medical rounds.' },
        { id: 'infirmarium_apothecarius', icon: '🧪', name_cs: 'Apothecarius', name_en: 'Apothecary', desc_cs: 'Příprava a podávání léků ze skladu.', desc_en: 'Prepares and dispenses remedies from stores.' },
        { id: 'infirmarium_capellanus', icon: '⛪', name_cs: 'Capellanus', name_en: 'Chaplain', desc_cs: 'Duchovní útěcha a svatá zpověď pro marody.', desc_en: 'Spiritual solace and confession for the sick.' }
    ],

    // Humorální diagnostika
    _HUMOR_NAMES: {
        sanguis: { cs: 'Krev (Sanguis)', en: 'Blood (Sanguis)', attr_cs: 'horká & vlhká', attr_en: 'hot & wet', color: '#b23b3b' },
        cholera: { cs: 'Žlutá žluč (Cholera)', en: 'Yellow bile (Cholera)', attr_cs: 'horká & suchá', attr_en: 'hot & dry', color: '#d49b28' },
        melancholia: { cs: 'Černá žluč (Melancholia)', en: 'Black bile (Melancholia)', attr_cs: 'studená & suchá', attr_en: 'cold & dry', color: '#4a3f35' },
        phlegma: { cs: 'Hlen (Phlegma)', en: 'Phlegm (Phlegma)', attr_cs: 'studený & vlhký', attr_en: 'cold & wet', color: '#5b8296' }
    },

    // Vtipné dobové lékařské poznámky (procedurální chorobopisy)
    _FUNNY_CHART_NOTES: [
        { cs: "Pacient tvrdí, že ho očarovala kuchařova řepa. Předepsán heřmánkový klystýr a zákaz zpěvu v chóru.", en: "Patient claims the cook's turnips cursed him. Prescribed chamomile clyster and choir singing ban." },
        { cs: "Nález: Příliš mnoho žluči a málo poslušnosti. Doporučeno 10x Ave Maria a teplý odvar z duběnek.", en: "Finding: Too much yellow bile and lack of obedience. Recommended 10x Ave Maria and oak gall brew." },
        { cs: "Stěžuje si na ztuhlé klouby z klečení, ale do refektáře běžel s obdivuhodnou lehkostí.", en: "Complains of stiff knees from kneeling, yet ran to the refectory with admirable swiftness." },
        { cs: "Oči unaveny čtením při lojové svíčce — doporučeno zavřít oči a meditovat o pomíjivosti světa.", en: "Eyes weary from candlelight reading — advised to close eyes and contemplate the vanity of this world." },
        { cs: "Pacient přísahá, že viděl svatého Rocha v podobě jezevce. Horečka je vysoká, ale duch pevný.", en: "Patient swears he saw St. Roch in the form of a badger. High fever, but sturdy spirit." },
        { cs: "Bratr sténá a žádá více klášterního piva z cellaria pro posílení žaludeční ctnosti.", en: "Brother groans and demands more monastery beer from the cellarium to strengthen his gastric virtue." },
        { cs: "Podezření na vdechování rumělky — kýchá červeným prachem a má vidění létajících rukopisů.", en: "Suspected cinnabar inhalation — sneezes red dust and hallucinates flying codices." },
        { cs: "Dásně krvácejí z nedostatku jablek v pozdní zimě. Pacient sní o pečené hrušce.", en: "Bleeding gums from late winter fruit shortage. Patient dreams wistfully of roasted pears." }
    ],

    // Léčebné procedury pro minihru Vizity
    TREATMENTS: {
        hirudo: {
            id: 'hirudo', icon: '🪱', name_cs: 'Pijavice na spánky (Hirudines)', name_en: 'Leeches on Temples (Hirudines)',
            desc_cs: 'Odebere zkaženou horkou krev a zklidní divokou žluč.', desc_en: 'Draws corrupt hot blood and calms wild bile.',
            humorDeltas: { sanguis: -25, cholera: -20, melancholia: +5, phlegma: +10 },
            responses_cs: [
                "„Au! Ta pijavice je tlustší než převorův palec, ale v hlavě se mi vyjasnilo!“",
                "„Slyším šumění krve... pijavice sají hřích i horečku!“",
                "„Pijavičky pracují pilně. Horkost v čele pomalu ustupuje.“"
            ],
            responses_en: [
                "\"Ouch! That leech is fatter than the prior's thumb, but my head feels clearer!\"",
                "\"I hear the blood flowing... the leeches feast on my fever!\"",
                "\"Little blood-letters at work. The burning in my temples cools down.\""
            ]
        },
        tea: {
            id: 'tea', icon: '🍵', name_cs: 'Šalvějový a lipový odvar (Decoctum)', name_en: 'Sage & Linden Tisane (Decoctum)',
            desc_cs: 'Rozpouští tuhý hlen v plicích a prohřívá prochladlé tělo.', desc_en: 'Melts stubborn phlegm in lungs and warms cold bones.',
            humorDeltas: { phlegma: -25, cholera: +10, sanguis: +15, melancholia: -10 },
            responses_cs: [
                "„Ten čaj voní jako louka za klášterem... kašel hned povoluje!“",
                "„Horký doušek s medem pohladil mé hrdlo. Už nemám v plicích led.“",
                "„Hořké byliny Hildegardy z Bingenu dělají divy, Deo gratias!“"
            ],
            responses_en: [
                "\"The tisane smells of the abbey meadow... my coughing eases at once!\"",
                "\"A hot draught with honey soothed my throat. The ice in my chest melts.\"",
                "\"Hildegard of Bingen's bitter herbs work wonders, Deo gratias!\""
            ]
        },
        poultice: {
            id: 'poultice', icon: '🧄', name_cs: 'Křenovo-česneková náplast (Emplastrum)', name_en: 'Horseradish & Garlic Poultice (Emplastrum)',
            desc_cs: 'Zahřívá klouby, dráždí kůži a spolehlivě vyhání černou žluč.', desc_en: 'Warms joints, irritates skin and drives away black bile.',
            humorDeltas: { melancholia: -30, cholera: +15, sanguis: +10, phlegma: -5 },
            responses_cs: [
                "„Pálí to jak pekelný oheň! Černá chmura mě ale rázem opouští!“",
                "„Česnek čpí na celou síň, ale křeč v břiše i zádech povolila!“",
                "„Křenová mast vytáhla z mých kostí i tu nejstarší zimnici.“"
            ],
            responses_en: [
                "\"It burns like hellfire! But the black sorrow flees my spirit at once!\"",
                "\"The garlic reeks across the entire ward, but the cramps have released me!\"",
                "\"The pungent poultice drew the ancient chill right out of my marrow.\""
            ]
        },
        holy_water: {
            id: 'holy_water', icon: '💦', name_cs: 'Kropení svěcenou vodou & Sv. Roch', name_en: 'Holy Water & St. Roch Prayer',
            desc_cs: 'Duchovní očista, zahání noční běsy a uvádí všechny humory do míru.', desc_en: 'Spiritual cleansing, banishes night terrors and soothes humors.',
            humorDeltas: { sanguis: -10, cholera: -10, melancholia: -10, phlegma: -10 },
            responses_cs: [
                "„Studená kapka na čele a modlitba... cítím andělskou posilu v duši!“",
                "„Amen! Pokoj vstoupil do mého srdce a tělo už se netřese.“",
                "„Svatý Rochu a svatý Šebestiáne, orodujte za mé uzdravení!“"
            ],
            responses_en: [
                "\"A cold drop on my forehead and a psalm... angelic peace fills my soul!\"",
                "\"Amen! Tranquility enters my heart and my limbs cease their trembling.\"",
                "\"Saint Roch and Saint Sebastian, pray for my recovery!\""
            ]
        },
        fumigation: {
            id: 'fumigation', icon: '🌿', name_cs: 'Levandulové vykuřování (Fumigatio)', name_en: 'Lavender Fumigation (Fumigatio)',
            desc_cs: 'Čistí zkažený vzduch od miazmat a uspává zjitřenou mysl.', desc_en: 'Purifies foul air of miasmas and calms agitated minds.',
            humorDeltas: { melancholia: -15, cholera: -15, phlegma: +5, sanguis: +5 },
            responses_cs: [
                "„Vonný dým zahnal zápach nemoci. Dýchá se mi lehce a klidně.“",
                "„Levandule a šalvěj... víčka mi těžknou sladkým spánkem.“",
                "„Miazmata se rozplynula v kouři, síň voní jako rajská zahrada.“"
            ],
            responses_en: [
                "\"Sweet fragrant smoke chased away the ward's foul stench. I breathe easy.\"",
                "\"Lavender and dried sage... my eyelids grow heavy with peaceful slumber.\"",
                "\"Miasmas dissolve in sweet smoke; the hall smells of paradise.\""
            ]
        },
        porridge: {
            id: 'porridge', icon: '🥣', name_cs: 'Ječná kaše s máslem (Puls Avenacea)', name_en: 'Barley Porridge with Butter (Puls)',
            desc_cs: 'Posiluje žaludek, dodává hutnou výživu a mírní slabost.', desc_en: 'Strengthens stomach, gives solid nourishment and eases weakness.',
            humorDeltas: { sanguis: +20, phlegma: +10, cholera: -15, melancholia: -10 },
            responses_cs: [
                "„Miska teplé kaše! Cítím, jak se mi do žil vrací životní síla!“",
                "„Kuchař dnes nešetřil máslem — žaludek spokojeně přede.“",
                "„Poctivá strava je nejlepší lékař. Už mám chuť vstát z lůžka!“"
            ],
            responses_en: [
                "\"A bowl of warm porridge! I feel life's vigor returning to my veins!\"",
                "\"The cook was generous with butter today — my stomach purrs contentedly.\"",
                "\"Good honest food is the finest physician. I almost feel ready to rise!\""
            ]
        }
    },

    _medicusPresent: function () {
        return ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_medicus');
    },

    _humorCounts: function () {
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

    // Hospes recovery
    DAY_MS: 24 * 60 * 60 * 1000,

    hospesDailyTick: function () {
        if (!GameState.infirmariumHospesTick) GameState.infirmariumHospesTick = { lastTick: 0 };
        const now = Date.now();
        if (now - (GameState.infirmariumHospesTick.lastTick || 0) < this.DAY_MS) return;
        GameState.infirmariumHospesTick.lastTick = now;

        const inf = GameState.infirmarium;
        if (!inf || !inf.patients || !inf.patients.length) return;
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        const stillHere = [];
        inf.patients.forEach(p => {
            if (p.kind !== 'hospes') { stillHere.push(p); return; }
            const dueAt = (p.arrivedAt || 0) + (p.recoverHours || 60) * 60 * 60 * 1000;
            if (now < dueAt) { stillHere.push(p); return; }

            const gift = Math.round((p.wealth || 30) * 0.8);
            if (typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) CellariumSystem.addGrose(gift, { title: lang === 'en' ? "Healed patient's gift" : 'Dar uzdraveného', source: p.name, source_en: p.name });
            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('church', 2);
            if (typeof Game !== 'undefined' && Game.addKronikaEntry) {
                Game.addKronikaEntry('important',
                    '🩺 ' + p.name + ' opouští Infirmarium uzdraven — na cestu dostal ' + gift + ' grošů.',
                    '🩺 ' + p.name + ' leaves the infirmary healed — given ' + gift + ' groschen for the road.',
                    '🩺 Hospes sanus discessit.');
            }
            this._reportRescueIfNewDay(p.actorId);
        });
        inf.patients = stillHere;
        if (typeof Game !== 'undefined' && Game.save) Game.save();
    },

    _reportRescueIfNewDay: function (actorId) {
        if (!actorId) return;
        if (!GameState.rescueReportSent) GameState.rescueReportSent = {};
        const today = new Date().toISOString().slice(0, 10);
        if (GameState.rescueReportSent[actorId] === today) return;
        GameState.rescueReportSent[actorId] = today;

        try {
            fetch('/api/rescue-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actorId: actorId, day: today }),
            }).catch(() => { });
        } catch (e) { /* tiché selhání */ }
    },

    // Inicializace stavu minihry
    initMinigame: function (entity, isBrother) {
        this._minigameState = {
            patientId: entity.id,
            patientName: entity.name,
            isBrother: isBrother,
            turnsUsed: 0,
            finished: false,
            lastReaction: null,
            lastTreatment: null,
            humors: {
                sanguis: 50 + Math.floor(Math.random() * 30 - 15),
                cholera: 50 + Math.floor(Math.random() * 30 - 15),
                melancholia: 50 + Math.floor(Math.random() * 30 - 15),
                phlegma: 50 + Math.floor(Math.random() * 30 - 15)
            }
        };
        // Posílit humor dle reálných neduhů pacienta
        if (entity.conditions) {
            Object.keys(entity.conditions).forEach(cid => {
                const def = typeof HealthConditionsDB !== 'undefined' ? HealthConditionsDB[cid] : null;
                if (def && def.humor && typeof this._minigameState.humors[def.humor] === 'number') {
                    this._minigameState.humors[def.humor] = Math.min(85, this._minigameState.humors[def.humor] + 25);
                }
            });
        }
    },

    closeMinigame: function () {
        this._minigameState = null;
        const el = document.getElementById('home-infirmarium-content');
        if (el) el.innerHTML = this.renderInfirmariumTab();
    },

    // Vykreslení minihry Vizity
    _renderMinigameSection: function (lang) {
        if (!this._minigameState) return '';
        const s = this._minigameState;
        const pool = s.isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
        const entity = pool.find(x => x.id === s.patientId);
        if (!entity) return '';

        // Urinální baňka — barva dle dominantního humoru
        let uroscopyColor = '#f3db78'; // standard straw yellow
        let uroscopyTitle = lang === 'en' ? 'Normal straw urine' : 'Normální slámová urina';
        const maxH = Object.entries(s.humors).reduce((a, b) => a[1] > b[1] ? a : b);
        if (maxH[0] === 'sanguis' && maxH[1] > 60) {
            uroscopyColor = '#d96464';
            uroscopyTitle = lang === 'en' ? 'Rubicund — blood excess' : 'Rubínově zardělá — přetlak krve';
        } else if (maxH[0] === 'cholera' && maxH[1] > 60) {
            uroscopyColor = '#e0a32e';
            uroscopyTitle = lang === 'en' ? 'Tawny yellow — bile burning' : 'Temně žlučová — vnitřní horkost';
        } else if (maxH[0] === 'melancholia' && maxH[1] > 60) {
            uroscopyColor = '#735f4c';
            uroscopyTitle = lang === 'en' ? 'Turbid dark — melancholic sludge' : 'Zakalená hnědavá — černá žluč';
        } else if (maxH[0] === 'phlegma' && maxH[1] > 60) {
            uroscopyColor = '#a7c6d6';
            uroscopyTitle = lang === 'en' ? 'Pale watery — cold phlegm flood' : 'Bledě vodnatá — hlenové prochladnutí';
        }

        let h = `<div style="padding:16px; margin-bottom:16px; background:radial-gradient(ellipse at top, rgba(212,168,83,0.15) 0%, rgba(35,26,18,0.4) 100%), var(--bg-parchment); border:2px solid var(--accent-gold); border-radius:10px; box-shadow:0 4px 14px rgba(0,0,0,0.12);">`;

        // Header minihry
        h += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(197,160,89,0.3); padding-bottom:8px; margin-bottom:12px;">
                <div>
                    <span style="font-weight:bold; font-size:1.05rem; color:var(--accent-wax);">🩺 ${lang === 'en' ? 'Visitatio Medica — Bedside Medical Round' : 'Visitatio Medica — Humorální Vizita u Lůžka'}</span>
                    <span style="font-size:0.75rem; opacity:0.7; margin-left:8px;">(${s.patientName})</span>
                </div>
                <button class="craft-btn" style="padding:2px 10px; font-size:0.72rem;" onclick="InfirmariumSystem.closeMinigame()">✕ ${lang === 'en' ? 'Exit Visit' : 'Ukončit vizitu'}</button>
              </div>`;

        // Diagnostic row: Uroscopia flask + 4 Humor Scales
        h += `<div style="display:grid; grid-template-columns:110px 1fr; gap:14px; align-items:center; margin-bottom:14px; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(197,160,89,0.2);">
                <div style="text-align:center;">
                    <div style="font-size:0.68rem; font-weight:bold; text-transform:uppercase; opacity:0.75; margin-bottom:4px;">🧪 Uroscopia</div>
                    <div style="display:inline-block; width:44px; height:58px; border:2px solid #5c4d3c; border-radius:10px 10px 22px 22px; background:linear-gradient(to top, ${uroscopyColor} 70%, rgba(255,255,255,0.4) 100%); position:relative; box-shadow:inset 0 -4px 6px rgba(0,0,0,0.2);" title="${uroscopyTitle}">
                        <div style="position:absolute; top:-6px; left:10px; width:20px; height:6px; border:2px solid #5c4d3c; border-bottom:none; border-radius:4px 4px 0 0; background:#e8dfcc;"></div>
                    </div>
                    <div style="font-size:0.62rem; opacity:0.8; margin-top:4px; line-height:1.1;">${uroscopyTitle}</div>
                </div>
                <div>
                    <div style="font-size:0.72rem; font-weight:bold; margin-bottom:6px;">⚖️ ${lang === 'en' ? 'Humor Balance (Ideal: 50%)' : 'Rovnováha čtyř humorů (Ideál: 50%)'}</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; font-size:0.7rem;">
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                <span>🩸 ${lang === 'en' ? 'Blood (Sanguis)' : 'Krev (Sanguis)'}</span>
                                <b>${Math.round(s.humors.sanguis)}%</b>
                            </div>
                            <div style="height:6px; background:#e0d3be; border-radius:3px; overflow:hidden;">
                                <div style="width:${Math.min(100, s.humors.sanguis)}%; height:100%; background:#b23b3b; transition:width 0.4s;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                <span>🟡 ${lang === 'en' ? 'Yellow Bile (Cholera)' : 'Žlutá žluč (Cholera)'}</span>
                                <b>${Math.round(s.humors.cholera)}%</b>
                            </div>
                            <div style="height:6px; background:#e0d3be; border-radius:3px; overflow:hidden;">
                                <div style="width:${Math.min(100, s.humors.cholera)}%; height:100%; background:#d49b28; transition:width 0.4s;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                <span>🖤 ${lang === 'en' ? 'Black Bile (Melancholia)' : 'Černá žluč (Melancholia)'}</span>
                                <b>${Math.round(s.humors.melancholia)}%</b>
                            </div>
                            <div style="height:6px; background:#e0d3be; border-radius:3px; overflow:hidden;">
                                <div style="width:${Math.min(100, s.humors.melancholia)}%; height:100%; background:#4a3f35; transition:width 0.4s;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                <span>💧 ${lang === 'en' ? 'Phlegm (Phlegma)' : 'Hlen (Phlegma)'}</span>
                                <b>${Math.round(s.humors.phlegma)}%</b>
                            </div>
                            <div style="height:6px; background:#e0d3be; border-radius:3px; overflow:hidden;">
                                <div style="width:${Math.min(100, s.humors.phlegma)}%; height:100%; background:#5b8296; transition:width 0.4s;"></div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>`;

        // Patient response quote
        if (s.lastReaction) {
            h += `<div style="margin-bottom:12px; padding:8px 12px; background:rgba(212,168,83,0.18); border-left:4px solid var(--accent-gold); border-radius:0 6px 6px 0; font-style:italic; font-size:0.78rem;">
                    💬 <b>${s.patientName}:</b> ${s.lastReaction}
                  </div>`;
        }

        // Treatment Actions Grid
        if (!s.finished) {
            h += `<div style="font-size:0.75rem; font-weight:bold; margin-bottom:8px; opacity:0.85;">🥣 ${lang === 'en' ? 'Select Bedside Treatment (' + (3 - s.turnsUsed) + ' rounds remaining):' : 'Zvolte léčebný postup (zbývá ' + (3 - s.turnsUsed) + ' kroky):'}</div>`;
            h += `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">`;
            Object.values(this.TREATMENTS).forEach(t => {
                const name = lang === 'en' ? t.name_en : t.name_cs;
                const desc = lang === 'en' ? t.desc_en : t.desc_cs;
                h += `<button class="craft-btn" style="text-align:left; padding:8px 10px; height:auto; display:flex; flex-direction:column; justify-content:space-between;" onclick="Game.applyVisitatioTreatment('${s.patientId}', ${s.isBrother}, '${t.id}')">
                        <div>
                            <div style="font-weight:bold; font-size:0.75rem; margin-bottom:3px;">${t.icon} ${name}</div>
                            <div style="font-size:0.65rem; opacity:0.75; font-weight:normal; line-height:1.2;">${desc}</div>
                        </div>
                      </button>`;
            });
            h += `</div>`;
        } else {
            h += `<div style="text-align:center; padding:12px; background:rgba(76,140,76,0.12); border:1px solid rgba(76,140,76,0.3); border-radius:8px;">
                    <div style="font-weight:bold; font-size:0.85rem; color:#2e6b2e; margin-bottom:4px;">✨ ${lang === 'en' ? 'Visitatio Medica Concluded Successfully!' : 'Vizita úspěšně dokončena!'}</div>
                    <div style="font-size:0.72rem; opacity:0.8; margin-bottom:8px;">${lang === 'en' ? 'The humors have calmed and the patient rests peacefully (-18h illness, +2 Research).' : 'Humory se zklidnily a nemocný v pokoji odpočívá (-18h trvání neduhů, +2 Zápisky).'}</div>
                    <button class="craft-btn" style="padding:4px 14px; font-size:0.75rem;" onclick="InfirmariumSystem.closeMinigame()">📜 ${lang === 'en' ? 'Return to Ward' : 'Zpět na lůžka'}</button>
                  </div>`;
        }

        h += `</div>`;
        return h;
    },

    // Grafické vykreslení lůžek (Full vs. Empty) a chorobopisů
    _renderBedsWard: function (lang) {
        const inf = GameState.infirmarium || { beds: 3, patients: [] };
        const patients = inf.patients || [];
        const medicusPresent = this._medicusPresent();
        const careMod = typeof Game !== 'undefined' && Game.infirmariumCareModifier ? Game.infirmariumCareModifier() : 0.85;
        const carePercent = Math.round((1 - careMod) * 100);

        let h = `<div style="margin-bottom:16px;">`;

        // Ward Title & Subtitle
        h += `<div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px;">
                <div>
                    <div style="font-weight:bold; font-size:1.05rem; letter-spacing:0.02em;">🛏️ ${lang === 'en' ? 'Monastic Hospital Ward' : 'Lůžková Síň Ošetřovny'}</div>
                    <div style="font-size:0.72rem; opacity:0.65;">${lang === 'en' ? 'Clean straw, quiet prayers, and attentive care for the sick and weary.' : 'Čistá sláma, tiché modlitby a laskavá péče pro zkoušené bratry a konvrše.'}</div>
                </div>
                <div style="font-size:0.72rem; padding:3px 8px; background:rgba(197,160,89,0.15); border-radius:12px; border:1px solid rgba(197,160,89,0.3);">
                    <b>${patients.length}/${inf.beds}</b> ${lang === 'en' ? 'occupied' : 'obsazeno'}
                </div>
              </div>`;

        // Grid lůžek (1 to 3 sloupce)
        h += `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">`;

        for (let i = 0; i < inf.beds; i++) {
            const p = patients[i];
            if (p) {
                // OBSAZENÉ LŮŽKO
                let entityName = p.name || 'Nemocný';
                let entityRole = lang === 'en' ? 'Guest / Pilgrim' : 'Host / Poutník';
                let conditionsList = [];
                let entity = null;
                let isBrother = !!p.isBrother;
                let mood = 50, fatigue = 0;

                if (p.kind === 'hospes') {
                    entityName = p.name;
                    entityRole = lang === 'en' ? 'Pilgrim' : 'Poutník';
                    if (p.ailment_cs) conditionsList.push({ name: lang === 'en' ? p.ailment_en : p.ailment_cs, icon: '🕊️', id: 'hospes' });
                } else {
                    const pool = isBrother ? ((GameState.dormitorium && GameState.dormitorium.brothers) || []) : (GameState.conversi || []);
                    entity = pool.find(e => e.id === p.entityId);
                    if (entity) {
                        entityName = entity.name;
                        entityRole = isBrother ? (lang === 'en' ? 'Monk' : 'Bratr mnich') : (lang === 'en' ? 'Lay Brother' : 'Konvrš');
                        mood = entity.mood || 50;
                        fatigue = Math.round(entity.fatigue || 0);
                        if (entity.conditions) {
                            Object.keys(entity.conditions).forEach(cid => {
                                const def = typeof HealthConditionsDB !== 'undefined' ? HealthConditionsDB[cid] : null;
                                if (def) {
                                    conditionsList.push({
                                        id: cid,
                                        name: lang === 'en' ? def.name_en : def.name,
                                        icon: def.icon || '🤒',
                                        humor: def.humor,
                                        desc: lang === 'en' ? def.desc_en : def.desc
                                    });
                                } else {
                                    conditionsList.push({ id: cid, name: cid, icon: '🤒' });
                                }
                            });
                        }
                    }
                }

                // Vtipný chorobopis a vitální funkce
                const noteObj = this._FUNNY_CHART_NOTES[(entityName.length + i) % this._FUNNY_CHART_NOTES.length];
                const chartNote = lang === 'en' ? noteObj.en : noteObj.cs;
                const tempC = (37.8 + ((entityName.charCodeAt(0) % 15) / 10)).toFixed(1);
                const heartBpm = 68 + (entityName.charCodeAt(1) || 70) % 24;

                h += `<div style="background:linear-gradient(145deg, rgba(250,243,228,0.95), rgba(240,230,210,0.95)); border:2px solid var(--accent-wax); border-radius:10px; padding:12px; box-shadow:0 3px 8px rgba(0,0,0,0.08); position:relative; overflow:hidden;">
                        
                        <!-- Záhlaví lůžka -->
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; border-bottom:1px dashed rgba(197,160,89,0.35); padding-bottom:6px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="font-size:1.6rem; line-height:1; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.15));">🛏️</div>
                                <div>
                                    <div style="font-weight:bold; font-size:0.88rem; color:var(--ink-primary);">${entityName}</div>
                                    <div style="font-size:0.65rem; opacity:0.65; text-transform:uppercase;">${entityRole} • ${lang === 'en' ? 'Bed #' + (i + 1) : 'Lůžko č. ' + (i + 1)}</div>
                                </div>
                            </div>
                            <span style="font-size:0.65rem; background:rgba(178,59,59,0.12); color:#b23b3b; padding:2px 6px; border-radius:4px; font-weight:bold;">
                                🤒 ${lang === 'en' ? 'In Care' : 'V léčení'}
                            </span>
                        </div>

                        <!-- Mini grafika pacienta na lůžku -->
                        <div style="display:flex; gap:10px; align-items:center; background:rgba(197,160,89,0.08); border-radius:6px; padding:8px; margin-bottom:8px;">
                            <div style="font-size:2rem; text-align:center; min-width:40px;">
                                ${(conditionsList[0] && conditionsList[0].icon) || '🤒'}
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:0.7rem; font-weight:bold; margin-bottom:2px;">
                                    ${conditionsList.map(c => `<span title="${c.desc || ''}" style="display:inline-block; margin-right:4px; background:rgba(0,0,0,0.06); padding:1px 5px; border-radius:3px;">${c.icon} ${c.name}</span>`).join('') || (lang === 'en' ? 'Recovering' : 'Zotavuje se')}
                                </div>
                                <div style="display:flex; gap:10px; font-size:0.64rem; opacity:0.8;">
                                    <span>🌡️ <b>${tempC} °C</b></span>
                                    <span>💓 <b>${heartBpm} bpm</b></span>
                                    <span>😊 <b>${mood}%</b></span>
                                </div>
                            </div>
                        </div>

                        <!-- Chorobopis (Vtipná dobová lékařská poznámka) -->
                        <div style="font-size:0.68rem; font-style:italic; opacity:0.8; background:rgba(255,255,255,0.6); border-left:3px solid var(--accent-wax); padding:5px 8px; border-radius:0 4px 4px 0; margin-bottom:8px; line-height:1.25;">
                            📜 <b>${lang === 'en' ? 'Monastic Chart:' : 'Chorobopis:'}</b> „${chartNote}“
                        </div>

                        <!-- Akční panel u lůžka -->
                        <div style="border-top:1px solid rgba(197,160,89,0.2); padding-top:8px;">`;

                if (entity) {
                    h += `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px;">
                            <button class="craft-btn" style="padding:3px 8px; font-size:0.68rem; background:rgba(212,168,83,0.25);" onclick="InfirmariumSystem.initMinigame((${JSON.stringify(entity).replace(/"/g, '&quot;')}), ${isBrother}); InfirmariumSystem._refreshTab();">🩺 ${lang === 'en' ? 'Bedside Visit' : 'Provést Vizitu'}</button>
                            <button class="craft-btn" style="padding:3px 8px; font-size:0.68rem;" onclick="Game.serveNourishingBroth('${entity.id}', ${isBrother})">🍲 ${lang === 'en' ? 'Serve Broth' : 'Podat vývar'}</button>
                            ${(typeof SaeculumSystem !== 'undefined' && SaeculumSystem._flebotomieActionHtml) ? SaeculumSystem._flebotomieActionHtml(entity, isBrother, lang) : ''}
                          </div>`;

                    // Lékárna — podání léku
                    const hasApothecarius = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_apothecarius');
                    if (hasApothecarius && entity.conditions) {
                        const available = [];
                        Object.keys(entity.conditions).forEach(cid => {
                            const def = typeof HealthConditionsDB !== 'undefined' ? HealthConditionsDB[cid] : null;
                            if (def && def.cures) {
                                def.cures.forEach(itemId => {
                                    if ((GameState.inventory[itemId] || 0) > 0 && !available.includes(itemId)) available.push(itemId);
                                });
                            }
                        });
                        if (available.length) {
                            h += `<div style="font-size:0.65rem; opacity:0.75; margin:4px 0 2px;">🧪 ${lang === 'en' ? 'Apothecary Dispensary:' : 'Lékárna (Podat lék):'}</div>`;
                            h += `<div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px;">`;
                            h += available.map(itemId => `<button class="craft-btn" style="padding:2px 7px; font-size:0.65rem;" onclick="Game.administerCure('${entity.id}', ${isBrother}, '${itemId}')">💊 ${typeof iName === 'function' ? iName(itemId) : itemId} (${GameState.inventory[itemId]})</button>`).join('');
                            h += `</div>`;
                        }
                    }

                    const hasCapellanus = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).some(b => b.assignedTab === 'infirmarium_capellanus');
                    if (hasCapellanus && !entity.confessedThisStay) {
                        h += `<button class="craft-btn" style="padding:3px 8px; font-size:0.68rem; margin-right:4px;" onclick="Game.hearConfession('${entity.id}', ${isBrother})">🙏 ${lang === 'en' ? 'Hear Confession' : 'Vyslechnout zpověď'}</button>`;
                    }

                    h += `<button class="craft-btn" style="padding:3px 8px; font-size:0.68rem; opacity:0.8;" onclick="Game.dischargeFromInfirmarium('${entity.id}', ${isBrother})">🚪 ${lang === 'en' ? 'Discharge' : 'Propustit z lůžka'}</button>`;
                }

                h += `</div></div>`;

            } else {
                // PRÁZDNÉ LŮŽKO
                h += `<div style="background:rgba(197,160,89,0.04); border:1.5px dashed rgba(197,160,89,0.35); border-radius:10px; padding:16px 12px; display:flex; flex-direction:column; justify-content:space-between; min-height:220px; text-align:center;">
                        
                        <div>
                            <div style="font-size:2.4rem; margin-bottom:4px; opacity:0.85;">✨🛏️</div>
                            <div style="font-weight:bold; font-size:0.85rem; color:var(--ink-primary); margin-bottom:2px;">
                                ${lang === 'en' ? 'Clean Bed #' + (i + 1) : 'Čisté lůžko č. ' + (i + 1)}
                            </div>
                            <div style="font-size:0.68rem; opacity:0.65; font-style:italic; margin-bottom:12px;">
                                ${lang === 'en' ? 'Fresh straw scented with wild lavender. Ready for the next soul in need.' : 'Čerstvá sláma provoněná divokou levandulí. Připraveno pro příštího maroda.'}
                            </div>
                        </div>

                        <div>
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <button class="craft-btn" style="padding:5px 10px; font-size:0.72rem; width:100%;" onclick="InfirmariumSystem.showAdmitPicker(${i})">
                                    ➕ ${lang === 'en' ? 'Admit a Sick Brother...' : 'Uložit nemocného...'}
                                </button>
                                <button class="craft-btn" style="padding:4px 8px; font-size:0.68rem; opacity:0.75; width:100%;" onclick="Game.takeMonasticRest()">
                                    🛌 ${lang === 'en' ? 'Take Monastic Rest (+15 Vigor)' : 'Klášterní odpočinek (+15 energie)'}
                                </button>
                            </div>
                        </div>

                      </div>`;
            }
        }

        h += `</div>`; // end grid
        h += `</div>`; // end ward
        return h;
    },

    _refreshTab: function () {
        const el = document.getElementById('home-infirmarium-content');
        if (el) el.innerHTML = this.renderInfirmariumTab();
    },

    // Rychlý modal pro výběr nemocného k uložení na lůžko
    // AUDIT FIX (31.8.2026, Pécuchet): původní verze volala UI.showCustomModal/
    // UI.hideModal — tyhle funkce v codebase NEEXISTUJÍ (ověřeno grep přes celej
    // repo). Nešlo o pád (typeof-guard), ale výběrovka se nikdy nezobrazila —
    // ticho spadlo do fallbacku (automaticky první nemocnej v pořadí, bez
    // možnosti výběru). Přepsáno na existující NotificationSystem.modal()
    // vzor (mirror core/ui.js showItemModal, řádek ~727).
    showAdmitPicker: function (bedIndex) {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';
        const brothers = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
        const conversi = GameState.conversi || [];

        const sickBrothers = brothers.filter(b => b.conditions && Object.keys(b.conditions).length > 0 && !b.admittedToInfirmarium);
        const sickConversi = conversi.filter(k => k.conditions && Object.keys(k.conditions).length > 0 && !k.admittedToInfirmarium);

        if (!sickBrothers.length && !sickConversi.length) {
            UI.notify(lang === 'en' ? 'No brothers or conversi are currently ill — Deo gratias!' : 'Žádný bratr ani konvrš není momentálně nemocný — Deo gratias!', true);
            return;
        }

        const condsOf = (entity) => Object.keys(entity.conditions).map(cid => {
            const def = typeof HealthConditionsDB !== 'undefined' ? HealthConditionsDB[cid] : null;
            return def ? (lang === 'en' ? def.name_en : def.name) : cid;
        }).join(', ');

        const choices = [];
        sickBrothers.forEach(b => {
            choices.push({
                label: '✝️ ' + b.name + ' — ' + condsOf(b),
                type: 'default',
                effect: () => Game.admitToInfirmarium(b.id, true)
            });
        });
        sickConversi.forEach(k => {
            choices.push({
                label: '🔨 ' + k.name + ' — ' + condsOf(k),
                type: 'default',
                effect: () => Game.admitToInfirmarium(k.id, false)
            });
        });
        choices.push({ label: lang === 'en' ? 'Cancel' : 'Zrušit', type: 'secondary', effect: () => { } });

        if (typeof NotificationSystem !== 'undefined' && NotificationSystem.modal) {
            NotificationSystem.modal({
                icon: '🛏️',
                title: lang === 'en' ? 'Infirmary Admission' : 'Příjem na lůžko',
                text: lang === 'en' ? 'Select person to admit to bed #' + (bedIndex + 1) + ':' : 'Vyberte maroda k uložení na lůžko č. ' + (bedIndex + 1) + ':',
                choices: choices
            });
        } else {
            // fallback: direct admit first
            const first = sickBrothers[0] ? { id: sickBrothers[0].id, isBrother: true } : { id: sickConversi[0].id, isBrother: false };
            Game.admitToInfirmarium(first.id, first.isBrother);
        }
    },

    // Statistiky a přehled nemocnice
    _renderFacilityOverview: function (lang) {
        const inf = GameState.infirmarium || { beds: 3, patients: [] };
        const careMod = typeof Game !== 'undefined' && Game.infirmariumCareModifier ? Game.infirmariumCareModifier() : 0.85;
        const careEfficiency = Math.round((1 - careMod) * 100);

        const brothers = (GameState.dormitorium && GameState.dormitorium.brothers) || [];
        const conversi = GameState.conversi || [];
        const totalSick = brothers.filter(b => b.conditions && Object.keys(b.conditions).length > 0).length
            + conversi.filter(k => k.conditions && Object.keys(k.conditions).length > 0).length;

        // Herb stocks
        const teaStock = GameState.inventory['herbal_tea'] || 0;
        const healStock = GameState.inventory['potion_heal'] || 0;
        const sleepStock = GameState.inventory['sleep_potion'] || 0;
        const spongiaStock = GameState.inventory['spongia_somnifera'] || 0;

        return `<div style="padding:12px 16px; margin-bottom:14px; background:radial-gradient(circle at 10% 20%, rgba(212,168,83,0.12) 0%, rgba(255,255,255,0.02) 90%), var(--bg-parchment); border:1px solid rgba(197,160,89,0.35); border-radius:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:8px;">
                        <div style="font-weight:bold; font-size:0.95rem; color:var(--ink-primary);">
                            🩺 ${lang === 'en' ? 'Infirmarium Sanatorium' : 'Klášterní Ošetřovna & Špitál'}
                        </div>
                        <div style="display:flex; gap:6px; font-size:0.68rem;">
                            <span style="background:rgba(0,0,0,0.06); padding:2px 8px; border-radius:10px;">🛡️ ${lang === 'en' ? 'Care Quality' : 'Kvalita péče'}: <b>+${careEfficiency}%</b></span>
                            <span style="background:rgba(0,0,0,0.06); padding:2px 8px; border-radius:10px;">🤒 ${lang === 'en' ? 'Monastery Sick' : 'Nemocní v komunitě'}: <b>${totalSick}</b></span>
                        </div>
                    </div>
                    <div style="font-size:0.75rem; opacity:0.75; line-height:1.3; margin-bottom:8px;">
                        ${lang === 'en'
                ? 'The sick receive specialized beds, warm baths, herbal infusions, and monastic consolation. Care lowers illness impact by 50% and dramatically reduces mortality.'
                : 'Nemocní mají vlastní lůžka, teplou lázeň, bylinné odvary a duchovní posilu. Péče tlumí dopad nemocí na polovinu a výrazně snižuje riziko úmrtí.'}
                    </div>
                    <div style="display:flex; gap:6px; font-size:0.65rem; opacity:0.85; flex-wrap:wrap; border-top:1px dashed rgba(197,160,89,0.25); padding-top:6px;">
                        <span>📦 ${lang === 'en' ? 'Remedies in Stock:' : 'Zásoby lékárny:'}</span>
                        <span>🍵 ${lang === 'en' ? 'Herbal Tea' : 'Bylinný čaj'}: <b>${teaStock}</b></span>
                        <span>🩹 ${lang === 'en' ? 'Healing Potion' : 'Léčivý lektvar'}: <b>${healStock}</b></span>
                        <span>🧽 ${lang === 'en' ? 'Spongia' : 'Uspávací houba'}: <b>${spongiaStock}</b></span>
                        <span>🌙 ${lang === 'en' ? 'Sleep Draught' : 'Lektvar spánku'}: <b>${sleepStock}</b></span>
                    </div>
                </div>`;
    },

    renderInfirmariumTab: function () {
        const lang = (GameState.settings && GameState.settings.language) || 'cs';

        if (!this.isUnlocked()) {
            return `<div style="text-align:center; padding:40px 20px; opacity:0.6;
                        border:2px dashed rgba(197,160,89,0.35); border-radius:12px; background:rgba(197,160,89,0.03);">
                      <div style="font-size:2.8rem; margin-bottom:12px;">🩺</div>
                      <div style="font-weight:bold; font-size:1.1rem; margin-bottom:4px;">
                        ${lang === 'en' ? 'Infirmary Not Built' : 'Ošetřovna zatím nestojí'}
                      </div>
                      <div style="font-style:italic; font-size:0.82rem; max-width:400px; margin:0 auto;">
                        ${lang === 'en' ? 'Research tech_infirmarium in the library to build beds and care for sick brothers.' : 'Vyzkoumejte tech_infirmarium v knihovně pro stavbu lůžek a péči o nemocné mnichy.'}
                      </div>
                    </div>`;
        }

        let h = '';

        // Signature: Čtyřhumorální spektrální proužek
        const medicusPresent = this._medicusPresent();
        const c = this._humorCounts();
        const total = c.sanguis + c.cholera + c.melancholia + c.phlegma;
        const flex = total > 0 ? c : { sanguis: 1, cholera: 1, melancholia: 1, phlegma: 1 };

        h += `<div style="display:flex; height:7px; border-radius:4px; overflow:hidden; margin-bottom:14px; box-shadow:0 1px 4px rgba(0,0,0,0.15);" title="${lang === 'en' ? 'Humoral balance across patients' : 'Humorální rovnováha nemocných'}">
                <div style="flex:${flex.sanguis || 0.05}; background:#b23b3b;" title="${lang === 'en' ? 'Blood (Sanguis)' : 'Krev (Sanguis)'} (${c.sanguis})"></div>
                <div style="flex:${flex.cholera || 0.05}; background:#d49b28;" title="${lang === 'en' ? 'Yellow bile (Cholera)' : 'Žlutá žluč (Cholera)'} (${c.cholera})"></div>
                <div style="flex:${flex.melancholia || 0.05}; background:#4a3f35;" title="${lang === 'en' ? 'Black bile (Melancholia)' : 'Černá žluč (Melancholia)'} (${c.melancholia})"></div>
                <div style="flex:${flex.phlegma || 0.05}; background:#5b8296;" title="${lang === 'en' ? 'Phlegm (Phlegma)' : 'Hlen (Phlegma)'} (${c.phlegma})"></div>
              </div>`;

        // Overview
        h += this._renderFacilityOverview(lang);

        // Minigame section (if active)
        h += this._renderMinigameSection(lang);

        // Graphical Beds Ward
        h += this._renderBedsWard(lang);

        // Řada 4 stanovišť (Konvrší role)
        h += `<div style="font-size:0.7rem; font-weight:bold; opacity:0.65; text-transform:uppercase; letter-spacing:0.05em; margin:16px 0 8px;">${lang === 'en' ? 'Infirmary Service Stations' : 'Stanoviště Ošetřovny (Konvrši)'}</div>`;
        h += `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px;">`;
        h += this._STATIONS.map(st => {
            const gated = !(GameState.researchedTechs && GameState.researchedTechs.includes(st.tech));
            const label = lang === 'en' ? st.name_en : st.name_cs;
            const desc = lang === 'en' ? st.desc_en : st.desc_cs;
            const count = (!gated && typeof Game !== 'undefined' && Game.conversiTaskCount) ? Game.conversiTaskCount(st.id) : 0;
            let statusText;
            if (gated) {
                const techDef = (typeof TechTree !== 'undefined') ? TechTree.find(t => t.id === st.tech) : null;
                const techName = techDef ? (lang === 'en' ? techDef.name_en : techDef.name) : st.tech;
                statusText = `<span style="font-style:italic; color:#8c3535;">🔒 ${lang === 'en' ? 'needs' : 'chybí'}: ${techName}</span>`;
            } else {
                statusText = `<span style="font-weight:bold;">${count}/2</span>`;
            }
            return `<div style="text-align:center; padding:10px 8px; border-radius:8px;
                        border:1px solid rgba(197,160,89,0.3);
                        background:rgba(197,160,89,0.06);
                        opacity:${gated ? '0.55' : '1'}; transition:transform 0.2s;" title="${desc}">
                      <div style="font-size:1.6rem; margin-bottom:2px;">${st.icon}</div>
                      <div style="font-size:0.72rem; font-weight:bold; color:var(--ink-primary);">${label}</div>
                      <div style="font-size:0.65rem; opacity:0.8; margin-top:3px;">${statusText}</div>
                    </div>`;
        }).join('');
        h += `</div>`;

        // Mnišský dohled — 4 role
        h += `<div style="font-size:0.7rem; font-weight:bold; opacity:0.65; text-transform:uppercase; letter-spacing:0.05em; margin:18px 0 8px;">${lang === 'en' ? 'Monastic Oversight & Physicians' : 'Mnišský Dohled & Lékaři'}</div>`;
        h += `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px;">`;
        h += this._MONK_ROLES.map(r => {
            const brother = ((GameState.dormitorium && GameState.dormitorium.brothers) || []).find(b => b.assignedTab === r.id);
            const label = lang === 'en' ? r.name_en : r.name_cs;
            const desc = lang === 'en' ? r.desc_en : r.desc_cs;
            const statusText = brother ? `<span style="font-weight:bold; color:var(--accent-wax);">${brother.name}</span>` : `<span style="opacity:0.6;">${lang === 'en' ? 'vacant' : 'volné'}</span>`;
            return `<div style="text-align:center; padding:10px 8px; border-radius:8px;
                        border:1px solid rgba(197,160,89,0.3);
                        background:rgba(197,160,89,0.06);" title="${desc}">
                      <div style="font-size:1.6rem; margin-bottom:2px;">${r.icon}</div>
                      <div style="font-size:0.72rem; font-weight:bold; color:var(--ink-primary);">${label}</div>
                      <div style="font-size:0.65rem; margin-top:3px;">${statusText}</div>
                    </div>`;
        }).join('');
        h += `</div>`;

        return h;
    }
};