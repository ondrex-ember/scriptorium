// ═══════════════════════════════════════════════════════════════════════════
// COQUINA VISUALS — SVG ilustrace stanic Vaření (Ohniště/Černá kuchyně/
// Udírna/Panská kuchyně/Sýrárna). Mirror Athanor buildAlembicSvg techniky
// (inline SVG + nativní <animate>, ne sprite obrázky). Samostatný soubor,
// mirror oddělení CheeseSystem.js od CookingSystem.js — jen vizuál, žádná
// herní logika, volané z CookingSystem.js render().
//
// DŮLEŽITÉ: každá stanice může být v gridu vykreslená SOUČASNĚ s ostatními
// (5 panelů vedle sebe) — SVG id atributy (gradienty, clipPath) jsou GLOBÁLNÍ
// v rámci celého dokumentu, ne jen uvnitř vlastního <svg>. Proto má každá
// stanice vlastní prefix na všech gradient/clip ID (coquina-ohniste-*,
// coquina-cernaKuchyne-* atd.) — bez prefixu by při současném zobrazení
// dvou stanic druhá "ukradla" gradient tomu prvnímu (url(#id) resolvuje
// první nalezený element s tím ID v celém dokumentu).
// coquina-visuals-mrd (9.8.2026)
// ═══════════════════════════════════════════════════════════════════════════

const CoquinaVisuals = {

    // ── Sdílený plamenný tvar (3 hroty, mirror flame-only-prototype) ───────
    // Base kotví na (50,108) ve vlastním prostoru; translate+scale ho zasadí
    // kamkoliv (Ohniště pod hrnec, Černá kuchyně do pece i pod komín, Udírna
    // do malého bočního ohniště, Panská kuchyně pod rožeň).
    _flameGroup: function (x, y, scale, active, idPrefix) {
        const outerGrad = idPrefix + '-flameOuter';
        const innerGrad = idPrefix + '-flameInner';
        const embers = `
            <ellipse cx="50" cy="108" rx="26" ry="6" fill="#3a1608"/>
            <ellipse cx="50" cy="106" rx="18" ry="4" fill="${active ? '#ff6a1a' : '#5c3a1a'}" opacity="${active ? 1 : 0.35}">
                ${active ? '<animate attributeName="opacity" values="0.8;1;0.7;1" dur="0.5s" repeatCount="indefinite"/>' : ''}
            </ellipse>`;
        const flames = active ? `
            <path fill="url(#${outerGrad})" opacity="0.92">
                <animate attributeName="d" dur="0.6s" repeatCount="indefinite"
                    values="
                        M30,108 C21,108 17,90 22,72 C17,59 20,48 32,40 C36,49 38,57 40,64 C43,44 46,24 50,8 C55,24 58,44 61,64 C63,57 65,49 69,38 C81,47 83,59 78,72 C83,90 79,108 70,108 Z;
                        M30,108 C20,108 16,89 21,70 C16,58 19,46 30,36 C35,46 37,55 40,62 C42,42 45,22 50,6 C56,22 59,42 61,62 C64,55 66,46 71,35 C82,45 85,58 79,70 C84,89 80,108 70,108 Z;
                        M30,108 C21,108 17,91 22,73 C18,60 21,49 33,44 C37,51 39,58 40,66 C44,46 47,26 50,10 C54,26 57,46 61,66 C62,58 64,51 68,42 C80,49 84,60 79,73 C84,91 79,108 70,108 Z;
                        M30,108 C21,108 17,90 22,72 C17,59 20,48 32,40 C36,49 38,57 40,64 C43,44 46,24 50,8 C55,24 58,44 61,64 C63,57 65,49 69,38 C81,47 83,59 78,72 C83,90 79,108 70,108 Z"/>
            </path>
            <path fill="url(#${innerGrad})">
                <animate attributeName="d" dur="0.45s" repeatCount="indefinite" begin="0.12s"
                    values="
                        M36,106 C29,106 26,92 30,78 C26,68 29,60 38,54 C41,61 42,67 44,72 C46,56 48,40 50,26 C53,40 55,56 57,72 C59,67 60,61 63,53 C72,59 75,68 71,78 C75,92 72,106 65,106 Z;
                        M36,106 C28,106 25,91 29,76 C25,67 28,58 37,51 C40,59 41,65 44,70 C45,54 47,36 50,22 C54,36 56,54 57,70 C60,65 61,59 64,50 C73,57 76,67 72,76 C76,91 73,106 65,106 Z;
                        M36,106 C29,106 26,93 30,79 C27,69 30,61 39,57 C42,63 43,69 44,74 C47,58 48,42 50,30 C53,42 54,58 57,74 C58,69 59,63 62,56 C71,60 74,69 71,79 C75,93 72,106 65,106 Z;
                        M36,106 C29,106 26,92 30,78 C26,68 29,60 38,54 C41,61 42,67 44,72 C46,56 48,40 50,26 C53,40 55,56 57,72 C59,67 60,61 63,53 C72,59 75,68 71,78 C75,92 72,106 65,106 Z"/>
            </path>
            <circle cx="42" cy="40" r="1.3" fill="#ffd280">
                <animate attributeName="cy" values="40;5;40" dur="1.3s" repeatCount="indefinite"/>
                <animate attributeName="cx" values="42;48;42" dur="1.3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="1;0;1" dur="1.3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="60" cy="45" r="1" fill="#ffe8b0">
                <animate attributeName="cy" values="45;8;45" dur="1.6s" repeatCount="indefinite" begin="0.5s"/>
                <animate attributeName="cx" values="60;54;60" dur="1.6s" repeatCount="indefinite" begin="0.5s"/>
                <animate attributeName="opacity" values="1;0;1" dur="1.6s" repeatCount="indefinite" begin="0.5s"/>
            </circle>` : '';
        return `<g transform="translate(${x},${y}) scale(${scale}) translate(-50,-108)">${embers}${flames}</g>`;
    },

    _flameDefs: function (idPrefix) {
        return `
            <linearGradient id="${idPrefix}-flameOuter" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#7a1a0a"/>
                <stop offset="40%" stop-color="#d4390f"/>
                <stop offset="100%" stop-color="#ff8c14"/>
            </linearGradient>
            <linearGradient id="${idPrefix}-flameInner" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#e8590c"/>
                <stop offset="50%" stop-color="#ffb020"/>
                <stop offset="100%" stop-color="#fff3c4"/>
            </linearGradient>`;
    },

    // ── Ohniště — kotlík na trojnožce nad skutečným plamenem. Kotlík se
    //    ukáže jen když ho hráč fakticky vlastní (hasPot), barva podle tieru
    //    (1=kámen/2=železo/3=bronz) — mirror Game.craft() tier hook. ────────
    ohniste: function (active, hasPot, tier) {
        const p = 'coquina-ohniste';
        hasPot = hasPot !== false; // default true pro zpětnou kompatibilitu starých volání bez parametru
        tier = tier || 1;
        const glow = (active && hasPot) ? 'rgba(255,140,20,0.55)' : 'rgba(120,60,10,0.15)';
        const potColors = {
            1: { top: '#7a7368', mid: '#4a453c', low: '#252119' }, // kamenný
            2: { top: '#5c5147', mid: '#332c25', low: '#171310' }, // železný
            3: { top: '#c9822e', mid: '#8a5a1e', low: '#4a2f0e' }, // bronzový
        }[tier] || { top: '#5c5147', mid: '#332c25', low: '#171310' };
        const bubbles = (active && hasPot) ? `
            <circle cx="82" cy="72" r="2.8" fill="rgba(255,235,200,0.55)">
                <animate attributeName="cy" values="72;66;72" dur="1.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.55;0.15;0.55" dur="1.6s" repeatCount="indefinite"/>
            </circle>
            <circle cx="96" cy="70" r="2.2" fill="rgba(255,235,200,0.5)">
                <animate attributeName="cy" values="70;64;70" dur="1.3s" repeatCount="indefinite" begin="0.35s"/>
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.3s" repeatCount="indefinite" begin="0.35s"/>
            </circle>
            <circle cx="106" cy="73" r="2" fill="rgba(255,235,200,0.5)">
                <animate attributeName="cy" values="73;68;73" dur="1.9s" repeatCount="indefinite" begin="0.7s"/>
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.9s" repeatCount="indefinite" begin="0.7s"/>
            </circle>` : '';
        const steam = (active && hasPot) ? `
            <circle cx="88" cy="52" r="2.4" fill="rgba(255,255,255,0.4)">
                <animate attributeName="cy" values="52;24;52" dur="2.2s" repeatCount="indefinite"/>
                <animate attributeName="cx" values="88;94;88" dur="2.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.5;0" dur="2.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="100" cy="50" r="2" fill="rgba(255,255,255,0.35)">
                <animate attributeName="cy" values="50;20;50" dur="1.9s" repeatCount="indefinite" begin="0.5s"/>
                <animate attributeName="cx" values="100;95;100" dur="1.9s" repeatCount="indefinite" begin="0.5s"/>
                <animate attributeName="opacity" values="0;0.45;0" dur="1.9s" repeatCount="indefinite" begin="0.5s"/>
            </circle>` : '';
        const potHtml = hasPot ? `
            <ellipse cx="90" cy="82" rx="34" ry="26" fill="url(#${p}-potBody)" stroke="#0e0b08" stroke-width="1.5"/>
            <ellipse cx="90" cy="70" rx="27" ry="9" fill="${active ? '#4a2f18' : '#221912'}"/>
            <ellipse cx="90" cy="68" rx="29" ry="6" fill="none" stroke="url(#${p}-potRim)" stroke-width="4"/>
            <ellipse cx="58" cy="66" rx="4" ry="6" fill="none" stroke="#3d342a" stroke-width="3"/>
            <ellipse cx="122" cy="66" rx="4" ry="6" fill="none" stroke="#3d342a" stroke-width="3"/>` : '';

        return `<svg viewBox="0 0 180 150" width="100%" height="140" xmlns="http://www.w3.org/2000/svg"
            style="filter:drop-shadow(0 0 14px ${glow});display:block;margin:0 auto;">
            <defs>
                <radialGradient id="${p}-potBody" cx="35%" cy="25%" r="75%">
                    <stop offset="0%" stop-color="${potColors.top}"/>
                    <stop offset="55%" stop-color="${potColors.mid}"/>
                    <stop offset="100%" stop-color="${potColors.low}"/>
                </radialGradient>
                <linearGradient id="${p}-potRim" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#2a231c"/>
                    <stop offset="30%" stop-color="#6e6154"/>
                    <stop offset="70%" stop-color="#443b31"/>
                    <stop offset="100%" stop-color="#1c1712"/>
                </linearGradient>
                ${this._flameDefs(p)}
            </defs>

            <ellipse cx="90" cy="138" rx="52" ry="6" fill="rgba(10,7,3,0.5)"/>

            <line x1="90" y1="82" x2="58" y2="132" stroke="#241a10" stroke-width="4.5" stroke-linecap="round"/>
            <line x1="90" y1="82" x2="122" y2="132" stroke="#241a10" stroke-width="4.5" stroke-linecap="round"/>
            <line x1="90" y1="82" x2="90" y2="134" stroke="#1a130b" stroke-width="4.5" stroke-linecap="round"/>

            ${this._flameGroup(90, 133, 0.34, active && hasPot, p)}

            ${potHtml}

            ${bubbles}
            ${steam}
        </svg>`;
    },

    // ── Černá kuchyně — zděná pec (otvor+plamen) + kotel visící vzadu +
    //    trychtýřovitý soplouch s masem a kouřem ─────────────────────────────
    cernaKuchyne: function (active) {
        const p = 'coquina-cernaKuchyne';
        const meat = active ? `
            <line x1="78" y1="62" x2="118" y2="58" stroke="#2a2015" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="182" y1="58" x2="222" y2="62" stroke="#2a2015" stroke-width="2.5" stroke-linecap="round"/>
            <g stroke="#3d2e1c" stroke-width="1.3">
                <line x1="86" y1="61" x2="86" y2="72"/>
                <line x1="96" y1="60" x2="96" y2="75"/>
                <line x1="106" y1="59" x2="106" y2="70"/>
                <line x1="194" y1="59" x2="194" y2="73"/>
                <line x1="204" y1="60" x2="204" y2="68"/>
                <line x1="214" y1="61" x2="214" y2="76"/>
            </g>
            <text x="86" y="84" font-size="15" text-anchor="middle">🍖</text>
            <text x="96" y="88" font-size="16" text-anchor="middle">🥓</text>
            <text x="106" y="80" font-size="13" text-anchor="middle">🍗</text>
            <text x="194" y="86" font-size="15" text-anchor="middle">🍗</text>
            <text x="204" y="78" font-size="13" text-anchor="middle">🥓</text>
            <text x="214" y="88" font-size="16" text-anchor="middle">🍖</text>` : '';

        const smoke = active ? `
            <ellipse cx="150" cy="58" rx="10" ry="6" fill="#a0a0a0" opacity="0.35">
                <animate attributeName="cy" values="58;18;58" dur="3.2s" repeatCount="indefinite"/>
                <animate attributeName="rx" values="10;20;10" dur="3.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.4;0" dur="3.2s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="138" cy="62" rx="7" ry="5" fill="#969696" opacity="0.3">
                <animate attributeName="cy" values="62;25;62" dur="2.6s" repeatCount="indefinite" begin="0.7s"/>
                <animate attributeName="rx" values="7;15;7" dur="2.6s" repeatCount="indefinite" begin="0.7s"/>
                <animate attributeName="opacity" values="0;0.35;0" dur="2.6s" repeatCount="indefinite" begin="0.7s"/>
            </ellipse>
            <ellipse cx="164" cy="60" rx="8" ry="5" fill="#aaaaaa" opacity="0.32">
                <animate attributeName="cy" values="60;20;60" dur="2.9s" repeatCount="indefinite" begin="1.3s"/>
                <animate attributeName="rx" values="8;17;8" dur="2.9s" repeatCount="indefinite" begin="1.3s"/>
                <animate attributeName="opacity" values="0;0.38;0" dur="2.9s" repeatCount="indefinite" begin="1.3s"/>
            </ellipse>
            <ellipse cx="96" cy="95" rx="16" ry="8" fill="#b4b4b4" opacity="0.28">
                <animate attributeName="cy" values="95;60;95" dur="4.1s" repeatCount="indefinite" begin="0.3s"/>
                <animate attributeName="opacity" values="0;0.32;0" dur="4.1s" repeatCount="indefinite" begin="0.3s"/>
            </ellipse>
            <ellipse cx="204" cy="93" rx="16" ry="8" fill="#b4b4b4" opacity="0.26">
                <animate attributeName="cy" values="93;58;93" dur="3.7s" repeatCount="indefinite" begin="1.1s"/>
                <animate attributeName="opacity" values="0;0.3;0" dur="3.7s" repeatCount="indefinite" begin="1.1s"/>
            </ellipse>` : `
            <ellipse cx="150" cy="55" rx="6" ry="4" fill="#8c8c8c" opacity="0.12">
                <animate attributeName="cy" values="55;40;55" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.15;0" dur="5s" repeatCount="indefinite"/>
            </ellipse>`;

        const ovenBubbles = active ? `
            <circle cx="41" cy="34" r="2" fill="#ffebc8" opacity="0.5">
                <animate attributeName="cy" values="34;29;34" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0.15;0.5" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="53" cy="32" r="1.7" fill="#ffebc8" opacity="0.45">
                <animate attributeName="cy" values="32;27;32" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
                <animate attributeName="opacity" values="0.45;0.1;0.45" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
            </circle>` : '';

        return `<svg viewBox="0 0 240 160" width="100%" height="140" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
            <defs>
                <linearGradient id="${p}-hood" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#3a352f"/>
                    <stop offset="60%" stop-color="#221e1a"/>
                    <stop offset="100%" stop-color="#100e0b"/>
                </linearGradient>
                <linearGradient id="${p}-brick" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#5a4a3a"/>
                    <stop offset="50%" stop-color="#3d3226"/>
                    <stop offset="100%" stop-color="#241d15"/>
                </linearGradient>
                <linearGradient id="${p}-ovenStone" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#6a5c4a"/>
                    <stop offset="55%" stop-color="#4a3d2e"/>
                    <stop offset="100%" stop-color="#2a2117"/>
                </linearGradient>
                <radialGradient id="${p}-ovenPot" cx="35%" cy="25%" r="75%">
                    <stop offset="0%" stop-color="#5c5147"/>
                    <stop offset="55%" stop-color="#332c25"/>
                    <stop offset="100%" stop-color="#171310"/>
                </radialGradient>
                ${this._flameDefs(p)}
            </defs>

            <ellipse cx="120" cy="150" rx="112" ry="6" fill="#050403" opacity="0.5"/>

            <!-- LEVÁ ČÁST — kotel visí vzadu/nahoře, žádné vlastní ohniště -->
            <line x1="49" y1="12" x2="49" y2="32" stroke="#1c1712" stroke-width="2.5"/>
            <ellipse cx="49" cy="40" rx="20" ry="15" fill="url(#${p}-ovenPot)" stroke="#0a0806" stroke-width="1.5"/>
            <ellipse cx="49" cy="29" rx="16" ry="3.5" fill="none" stroke="#5a4a3a" stroke-width="2.2"/>
            <ellipse cx="49" cy="27" rx="13" ry="4.5" fill="${active ? '#3a2412' : '#1c150e'}"/>
            ${ovenBubbles}

            <rect x="8" y="58" width="82" height="86" fill="url(#${p}-ovenStone)" stroke="#100d0a" stroke-width="1.5"/>
            <g stroke="#100d0a" stroke-width="0.6" opacity="0.45">
                <line x1="8" y1="76" x2="90" y2="76"/>
                <line x1="8" y1="94" x2="90" y2="94"/>
                <line x1="8" y1="112" x2="90" y2="112"/>
                <line x1="8" y1="130" x2="90" y2="130"/>
            </g>

            <path d="M 26 144 L 26 112 Q 26 100 40 100 L 58 100 Q 72 100 72 112 L 72 144 Z"
                  fill="#0a0705" stroke="#100d0a" stroke-width="1.5"/>
            ${this._flameGroup(49, 143, 0.38, active, p)}

            <!-- PRAVÁ ČÁST — trychtýřovitý soplouch -->
            <rect x="118" y="118" width="64" height="20" fill="url(#${p}-brick)" stroke="#0d0a07" stroke-width="1"/>
            <line x1="118" y1="124" x2="182" y2="124" stroke="#0d0a07" stroke-width="0.6" opacity="0.5"/>
            <line x1="118" y1="130" x2="182" y2="130" stroke="#0d0a07" stroke-width="0.6" opacity="0.5"/>

            ${this._flameGroup(150, 137, 0.3, active, p)}

            <path d="M 100 118 L 126 55 L 174 55 L 200 118 Z" fill="url(#${p}-hood)" stroke="#080604" stroke-width="1.5"/>
            <rect x="136" y="14" width="28" height="44" fill="url(#${p}-hood)" stroke="#080604" stroke-width="1.5"/>
            <path d="M 100 118 L 200 118" stroke="#5a4a3a" stroke-width="2.5" opacity="0.7"/>

            ${meat}
            ${smoke}
        </svg>`;
    },

    // ── Udírna — samostatná věž, boční ohniště s malým plamenem ─────────────
    udirna: function (active) {
        const p = 'coquina-udirna';
        const meat = active ? `
            <line x1="52" y1="72" x2="52" y2="84" stroke="#3d2e1c" stroke-width="1.3"/>
            <line x1="66" y1="70" x2="66" y2="86" stroke="#3d2e1c" stroke-width="1.3"/>
            <text x="52" y="96" font-size="14" text-anchor="middle">🍖</text>
            <text x="66" y="99" font-size="15" text-anchor="middle">🥓</text>` : '';
        const smoke = active ? `
            <ellipse cx="60" cy="55" rx="4" ry="3" fill="rgba(170,170,170,0.3)">
                <animate attributeName="cy" values="55;20;55" dur="2.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0;0.35;0" dur="2.8s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="68" cy="40" rx="3" ry="2.5" fill="rgba(160,160,160,0.28)">
                <animate attributeName="cy" values="40;10;40" dur="2.3s" repeatCount="indefinite" begin="0.5s"/>
                <animate attributeName="opacity" values="0;0.3;0" dur="2.3s" repeatCount="indefinite" begin="0.5s"/>
            </ellipse>
            <ellipse cx="52" cy="48" rx="3.5" ry="2.5" fill="rgba(175,175,175,0.26)">
                <animate attributeName="cy" values="48;15;48" dur="3.1s" repeatCount="indefinite" begin="1s"/>
                <animate attributeName="opacity" values="0;0.3;0" dur="3.1s" repeatCount="indefinite" begin="1s"/>
            </ellipse>
            <ellipse cx="38" cy="60" rx="3" ry="2" fill="rgba(160,160,160,0.22)">
                <animate attributeName="cx" values="38;24;38" dur="2.6s" repeatCount="indefinite" begin="0.3s"/>
                <animate attributeName="opacity" values="0;0.25;0" dur="2.6s" repeatCount="indefinite" begin="0.3s"/>
            </ellipse>
            <ellipse cx="82" cy="65" rx="3" ry="2" fill="rgba(160,160,160,0.22)">
                <animate attributeName="cx" values="82;96;82" dur="2.9s" repeatCount="indefinite" begin="0.8s"/>
                <animate attributeName="opacity" values="0;0.25;0" dur="2.9s" repeatCount="indefinite" begin="0.8s"/>
            </ellipse>
            <ellipse cx="122" cy="112" rx="4" ry="2.5" fill="rgba(150,150,150,0.25)">
                <animate attributeName="cx" values="122;98;122" dur="1.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0.15;0.3" dur="1.8s" repeatCount="indefinite"/>
            </ellipse>` : '';

        return `<svg viewBox="0 0 180 150" width="100%" height="140" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
            <defs>
                <linearGradient id="${p}-tower" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#4a4038"/>
                    <stop offset="50%" stop-color="#2e2822"/>
                    <stop offset="100%" stop-color="#161310"/>
                </linearGradient>
                <linearGradient id="${p}-roof" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#3a3128"/>
                    <stop offset="100%" stop-color="#1a1712"/>
                </linearGradient>
                ${this._flameDefs(p)}
            </defs>

            <ellipse cx="80" cy="140" rx="60" ry="6" fill="rgba(8,6,3,0.5)"/>

            <rect x="42" y="30" width="46" height="100" fill="url(#${p}-tower)" stroke="#0a0806" stroke-width="1.5"/>
            <g stroke="#0a0806" stroke-width="0.5" opacity="0.4">
                <line x1="42" y1="50" x2="88" y2="50"/>
                <line x1="42" y1="70" x2="88" y2="70"/>
                <line x1="42" y1="90" x2="88" y2="90"/>
                <line x1="42" y1="110" x2="88" y2="110"/>
            </g>
            <path d="M 36 30 L 65 8 L 94 30 Z" fill="url(#${p}-roof)" stroke="#0a0806" stroke-width="1.5"/>
            <rect x="55" y="106" width="20" height="24" fill="#100d0a" stroke="#3d3226" stroke-width="1"/>

            ${meat}

            <rect x="108" y="102" width="26" height="14" fill="url(#${p}-tower)" stroke="#0a0806" stroke-width="1.2"/>
            ${this._flameGroup(121, 115, 0.16, active, p)}
            <path d="M 108 106 L 88 100" stroke="#241d15" stroke-width="4" stroke-linecap="round" fill="none"/>

            ${smoke}
        </svg>`;
    },

    // ── Panská kuchyně — hmoždíř s tloukem (mechanický) + rožeň nad plamenem ─
    panskaKuchyne: function (active) {
        const p = 'coquina-panskaKuchyne';
        const grindMotion = active
            ? `<animateTransform attributeName="transform" type="rotate" values="-8 40 55;8 40 55;-8 40 55" dur="0.9s" repeatCount="indefinite"/>`
            : '';
        const spicePowder = active ? `
            <circle cx="30" cy="68" r="1.1" fill="#c9a24a">
                <animate attributeName="cy" values="68;56;68" dur="1.1s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="48" cy="70" r="1" fill="#d4b05a">
                <animate attributeName="cy" values="70;58;70" dur="1.3s" repeatCount="indefinite" begin="0.3s"/>
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.3s" repeatCount="indefinite" begin="0.3s"/>
            </circle>` : '';

        return `<svg viewBox="0 0 240 160" width="100%" height="140" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
            <defs>
                <radialGradient id="${p}-mortar" cx="35%" cy="20%" r="80%">
                    <stop offset="0%" stop-color="#7a7368"/>
                    <stop offset="55%" stop-color="#4a453c"/>
                    <stop offset="100%" stop-color="#252119"/>
                </radialGradient>
                <linearGradient id="${p}-pestle" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#6a6155"/>
                    <stop offset="50%" stop-color="#8a8072"/>
                    <stop offset="100%" stop-color="#4a453c"/>
                </linearGradient>
                ${this._flameDefs(p)}
            </defs>

            <ellipse cx="120" cy="150" rx="112" ry="6" fill="rgba(8,6,3,0.5)"/>

            <!-- LEVÁ ČÁST — kamenný hmoždíř s tloukem -->
            <ellipse cx="40" cy="98" rx="30" ry="7" fill="rgba(8,6,3,0.4)"/>
            <rect x="28" y="92" width="24" height="14" fill="#332e26" stroke="#100d0a" stroke-width="1"/>
            <path d="M 12 92 L 20 58 Q 40 48 60 58 L 68 92 Z" fill="url(#${p}-mortar)" stroke="#100d0a" stroke-width="1.5"/>
            <ellipse cx="40" cy="58" rx="20" ry="6" fill="#1c1712"/>
            <ellipse cx="40" cy="57" rx="17" ry="5" fill="${active ? '#5a4522' : '#2a2419'}"/>
            ${spicePowder}
            <g transform="rotate(-4 40 55)">
                ${grindMotion}
                <path d="M 36 15 L 44 15 C 46 26 49 36 51 44 C 53 53 50 61 40 64
                         C 30 61 27 53 29 44 C 31 36 34 26 36 15 Z"
                      fill="url(#${p}-pestle)" stroke="#100d0a" stroke-width="1.2"/>
            </g>
            <g transform="rotate(-4 40 55)">
                <path d="M 39 20 C 38 32 37 46 38 58" stroke="#2a251d" stroke-width="1.2" opacity="0.4" fill="none"/>
            </g>

            <!-- PRAVÁ ČÁST — rožeň s masem nad plamenem -->
            <path d="M 148 130 L 148 95 L 138 78 M148 95 L 158 78" stroke="#241a10" stroke-width="4" stroke-linecap="round" fill="none"/>
            <path d="M 232 130 L 232 95 L 222 78 M232 95 L 242 78" stroke="#241a10" stroke-width="4" stroke-linecap="round" fill="none"/>

            ${this._flameGroup(190, 148, 0.32, active, p)}

            <line x1="140" y1="92" x2="240" y2="92" stroke="#4a4038" stroke-width="2.5"/>

            <text x="190" y="98" font-size="20" text-anchor="middle">🍗</text>
            ${active ? `
            <ellipse cx="182" cy="86" rx="6" ry="3" fill="rgba(255,220,150,0.4)">
                <animateTransform attributeName="transform" type="translate" values="0,0; 14,0; 0,0" dur="2.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.2s" repeatCount="indefinite"/>
            </ellipse>
            <circle cx="188" cy="102" r="1.2" fill="#c9852a">
                <animate attributeName="cy" values="102;122" dur="1.4s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0" dur="1.4s" repeatCount="indefinite"/>
            </circle>` : ''}
        </svg>`;
    },

    // ── Sýrárna — šroubový lis (bez ohně, mléko se nesmí vařit) + 5 zracích
    //    polic se stohy bochníků na spodních dvou ───────────────────────────
    syrarna: function (active) {
        const p = 'coquina-syrarna';
        const wheyDrip = active ? `
            <circle cx="42" cy="86" r="1.3" fill="#e8dcb0" opacity="0.7">
                <animate attributeName="cy" values="86;104" dur="1.3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.7;0" dur="1.3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="52" cy="86" r="1.1" fill="#e8dcb0" opacity="0.6">
                <animate attributeName="cy" values="86;104" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
                <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
            </circle>` : '';

        const wheelR = (cx, cy, r, ripe) =>
            `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.62}" fill="${ripe ? '#c9973f' : '#e8d29a'}" stroke="#5a4322" stroke-width="1"/>
             <ellipse cx="${cx}" cy="${cy - r * 0.18}" rx="${r * 0.82}" ry="${r * 0.42}" fill="${ripe ? '#d9aa52' : '#f2e0ab'}" opacity="0.6"/>`;
        const wheelOnShelf = (cx, shelfY, r, ripe) => wheelR(cx, shelfY - r * 0.62, r, ripe);
        const stackOnShelf = (cx, shelfY, r, ripeArr) => {
            let h = '';
            let y = shelfY - r * 0.62;
            for (let i = 0; i < 3; i++) {
                h += wheelR(cx, y, r, ripeArr[i]);
                y -= r * 0.62 * 1.65;
            }
            return h;
        };

        const shelfYs = [30, 58, 86, 114, 142];
        const shelvesIdle = `
            ${wheelOnShelf(150, shelfYs[0], 8, false)} ${wheelOnShelf(200, shelfYs[0], 7, true)}
            ${wheelOnShelf(170, shelfYs[1], 8, true)}
            ${wheelOnShelf(155, shelfYs[2], 8, false)} ${wheelOnShelf(210, shelfYs[2], 7, false)}
            ${stackOnShelf(150, shelfYs[3], 7, [false, false, true])}
            ${wheelOnShelf(200, shelfYs[4], 7, true)}
        `;
        const shelvesActive = `
            ${wheelOnShelf(136, shelfYs[0], 8, false)} ${wheelOnShelf(158, shelfYs[0], 7, true)} ${wheelOnShelf(180, shelfYs[0], 8, true)} ${wheelOnShelf(202, shelfYs[0], 7, false)} ${wheelOnShelf(224, shelfYs[0], 8, true)}
            ${wheelOnShelf(136, shelfYs[1], 8, true)} ${wheelOnShelf(160, shelfYs[1], 9, false)} ${wheelOnShelf(184, shelfYs[1], 8, true)} ${wheelOnShelf(208, shelfYs[1], 7, true)} ${wheelOnShelf(228, shelfYs[1], 7, false)}
            ${wheelOnShelf(138, shelfYs[2], 8, false)} ${wheelOnShelf(162, shelfYs[2], 8, true)} ${wheelOnShelf(186, shelfYs[2], 9, false)} ${wheelOnShelf(210, shelfYs[2], 7, true)} ${wheelOnShelf(230, shelfYs[2], 7, true)}
            ${stackOnShelf(140, shelfYs[3], 7, [false, true, true])}
            ${stackOnShelf(180, shelfYs[3], 8, [true, false, true])}
            ${wheelOnShelf(220, shelfYs[3], 7, false)}
            ${stackOnShelf(150, shelfYs[4], 7, [true, true, false])}
            ${stackOnShelf(200, shelfYs[4], 7, [false, true, true])}
        `;

        return `<svg viewBox="0 0 240 160" width="100%" height="140" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
            <defs>
                <linearGradient id="${p}-pressWood" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#6a5840"/>
                    <stop offset="100%" stop-color="#3d3122"/>
                </linearGradient>
                <linearGradient id="${p}-shelfWood" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#54452f"/>
                    <stop offset="100%" stop-color="#2e2519"/>
                </linearGradient>
                <radialGradient id="${p}-mold" cx="35%" cy="25%" r="80%">
                    <stop offset="0%" stop-color="#e8dcb0"/>
                    <stop offset="60%" stop-color="#d4c48a"/>
                    <stop offset="100%" stop-color="#b0a066"/>
                </radialGradient>
                <linearGradient id="${p}-screw" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#a68a5c"/>
                    <stop offset="50%" stop-color="#e0c48a"/>
                    <stop offset="100%" stop-color="#8a7048"/>
                </linearGradient>
            </defs>

            <ellipse cx="120" cy="150" rx="112" ry="6" fill="rgba(8,6,3,0.5)"/>

            <!-- LEVÁ ČÁST — šroubový lis, šroub s barber-pole animací při aktivní -->
            <rect x="14" y="20" width="8" height="90" fill="url(#${p}-pressWood)" stroke="#100d0a" stroke-width="1"/>
            <rect x="70" y="20" width="8" height="90" fill="url(#${p}-pressWood)" stroke="#100d0a" stroke-width="1"/>
            <rect x="10" y="16" width="72" height="10" fill="url(#${p}-pressWood)" stroke="#100d0a" stroke-width="1"/>
            <line x1="46" y1="26" x2="46" y2="${active ? 58 : 70}" stroke="url(#${p}-screw)" stroke-width="5" stroke-linecap="round"/>
            <clipPath id="${p}-screwClip"><rect x="39" y="26" width="14" height="${active ? 32 : 44}"/></clipPath>
            <g stroke="#e0c48a" stroke-width="1" opacity="0.7" clip-path="url(#${p}-screwClip)">
                <g>
                    ${active ? '<animateTransform attributeName="transform" type="translate" values="0,0;0,7" dur="1.6s" repeatCount="indefinite"/>' : ''}
                    <line x1="41" y1="16" x2="51" y2="19"/>
                    <line x1="41" y1="23" x2="51" y2="26"/>
                    <line x1="41" y1="30" x2="51" y2="33"/>
                    <line x1="41" y1="37" x2="51" y2="40"/>
                    <line x1="41" y1="44" x2="51" y2="47"/>
                    <line x1="41" y1="51" x2="51" y2="54"/>
                    <line x1="41" y1="58" x2="51" y2="61"/>
                    <line x1="41" y1="65" x2="51" y2="68"/>
                </g>
            </g>
            <rect x="28" y="${active ? 58 : 70}" width="36" height="7" rx="1" fill="#8a7048" stroke="#e0c48a" stroke-width="1"/>
            <rect x="20" y="104" width="52" height="8" fill="url(#${p}-pressWood)" stroke="#100d0a" stroke-width="1"/>
            <g stroke="#100d0a" stroke-width="0.6" opacity="0.4">
                <line x1="26" y1="106" x2="26" y2="112"/>
                <line x1="36" y1="106" x2="36" y2="112"/>
                <line x1="46" y1="106" x2="46" y2="112"/>
                <line x1="56" y1="106" x2="56" y2="112"/>
                <line x1="66" y1="106" x2="66" y2="112"/>
            </g>
            <ellipse cx="46" cy="${active ? 66 : 78}" rx="18" ry="10" fill="url(#${p}-mold)" stroke="#5a4322" stroke-width="1.3"/>
            ${wheyDrip}
            <line x1="24" y1="112" x2="24" y2="130" stroke="#241d14" stroke-width="3" stroke-linecap="round"/>
            <line x1="68" y1="112" x2="68" y2="130" stroke="#241d14" stroke-width="3" stroke-linecap="round"/>

            <!-- PRAVÁ ČÁST — 5 polic, sýry dosedají na desku, dole stohy -->
            ${shelfYs.map(y => `<rect x="120" y="${y}" width="118" height="5" fill="url(#${p}-shelfWood)" stroke="#100d0a" stroke-width="1"/>`).join('')}
            <line x1="126" y1="30" x2="126" y2="147" stroke="#241d14" stroke-width="4" stroke-linecap="round"/>
            <line x1="232" y1="30" x2="232" y2="147" stroke="#241d14" stroke-width="4" stroke-linecap="round"/>

            ${active ? shelvesActive : shelvesIdle}
        </svg>`;
    },

    // ── Dispatcher — volané z CookingSystem.js render() ─────────────────────
    // extra: volitelný objekt s dalšími parametry pro konkrétní stanici
    // (dnes jen ohniste: {hasPot, tier}).
    render: function (stationKey, active, extra) {
        if (stationKey === 'ohniste') return this.ohniste(active, extra && extra.hasPot, extra && extra.tier);
        const map = {
            cerna_kuchyne: this.cernaKuchyne,
            udirna: this.udirna,
            panska_kuchyne: this.panskaKuchyne,
        };
        const fn = map[stationKey];
        return fn ? fn.call(this, active) : '';
    },
};