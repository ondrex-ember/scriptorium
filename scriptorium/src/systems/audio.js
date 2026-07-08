// ═══════════════════════════════════════════════════════════════
// AUDIO SYSTEM — Procedural fire sound & Music Tier System
// ═══════════════════════════════════════════════════════════════
// Version: 2.0 — Music Tier System (3 generative engines)
//
// MUSIC TIERS:
//   Tier 1: SacralCathedralGenerative — unlock: tech_neuma_notation
//   Tier 2: AbyssalKeepGenerative     — unlock: tech_schola_cantorum
//   Tier 3: ArsNovaGenerative         — unlock: Cellarium (tech_cellarium)
//
// API:
//   AudioSystem.checkMusicTierUpgrade() — volat po každém researchi
//   AudioSystem.switchMusicTier(n)      — manuální přepnutí
//   AudioSystem.getUnlockedMusicTier()  — zjistit aktuální tier
// ═══════════════════════════════════════════════════════════════

// ═══ TIER 1: Sacral Cathedral ═══
// --- JOUZA LAB v6: LEVEL 1 (SACRAL CATHEDRAL) ---
class SacralCathedralGenerative {
    constructor(audioContext, destinationNode) {
        this.ctx = audioContext;
        this.dest = destinationNode;
        this._interval = null;
        this._started = false;
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;

        // OCHRANNÝ LIMITER PROTI PRASKÁNÍ (Clippingu)
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -2.0; // Zasáhne těsně pod maximem
        this.limiter.knee.value = 0.0;       // Okamžitá reakce
        this.limiter.ratio.value = 20.0;     // Funguje jako tvrdá zeď
        this.limiter.attack.value = 0.005;   // Rychlost zásahu
        this.limiter.release.value = 0.05;   // Rychlost uvolnění

        this.master.connect(this.limiter);
        this.limiter.connect(destinationNode);

        // --- GENERÁTOR PROSTORU (Katedrála) ---
        this.reverbBus = this.ctx.createGain();
        this.reverbBus.gain.value = 1.0;

        const revLen = this.ctx.sampleRate * 4.0; // Prodlouženo na masivní 4 vteřiny
        const revBuf = this.ctx.createBuffer(2, revLen, this.ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = revBuf.getChannelData(c);
            for (let i = 0; i < revLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / revLen, 5.0);
        }
        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = revBuf;

        this.reverbOutGain = this.ctx.createGain();
        this.reverbOutGain.gain.value = 1.8;

        this.reverbBus.connect(this.convolver);
        this.convolver.connect(this.reverbOutGain);
        this.reverbOutGain.connect(this.master);
        // --------------------------------------

        // Mystická / Sakrální stupnice (Phrygian Dominant nádech)
        this.scale = [293.7, 311.1, 369.9, 392.0, 440.0, 466.2, 554.4, 587.3, 622.3, 739.9];

        this.motifs = [
            [0, 1, 2, -1, 3, 2],
            [4, -1, 2, 1, 0, -1],
            [2, -1, 4, -1, 5, 4],
            [0, -1, -1, -1, 2, -1],
            [-1, 2, 1, 0, -1, 0]
        ];

        this.currentPhrase = [];
        this.step = 0;
        this.measure = 0;
        this.mood = 0.5;
        this.moodDirection = 0.015; // Změny nálady jsou teď mnohem pomalejší a rozvážnější
    }

    // 🪕 SITAR / CHRÁMOVÁ HARFA
    playSitar(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        // Jemné "sklouznutí" tónu dolů (typictké pro východní nástroje)
        osc.frequency.setValueAtTime(freq * 1.05, t);
        osc.frequency.exponentialRampToValueAtTime(freq, t + 0.1);

        filter.type = 'bandpass';
        filter.frequency.value = freq * 2 + ((Math.random() * 5) * 2); //
        filter.Q.value = 5; // Rezonující, kovové tělo nástroje

        const dur = 3.0 + (Math.random()) * 2.0; //

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(filter); filter.connect(gain);
        gain.connect(this.master);

        const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.8;
        gain.connect(sendRev); sendRev.connect(this.reverbBus);

        osc.start(t); osc.stop(t + dur);
    }

    // 🌬️ DŘEVĚNÁ FLÉTNA (Vzácná a osamělá)
    playFlute(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;
        filter.type = 'lowpass'; filter.frequency.value = 600;

        const dur = 3.5 + Math.random();

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(filter); filter.connect(gain);
        gain.connect(this.reverbBus); gain.connect(this.master);
        osc.start(t); osc.stop(t + dur);
    }

    // 🔔 CHRÁMOVÝ ZVON (Nový masivní nástroj)
    playBell(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;

        // Zvon se skládá z několika "rozladěných" harmonických vrstev
        const overtones = [1, 2.76, 5.4, 8.9, 11.3];

        overtones.forEach((mult, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq * mult;

            // Vyšší harmonické doznívají rychleji
            const dur = 6.0 / (i + 1);

            gain.gain.setValueAtTime(0, t);
            // Extrémně tvrdý, kovový úder
            gain.gain.linearRampToValueAtTime(0.4 / (i + 1), t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

            osc.connect(gain);
            gain.connect(this.master);

            // Zvon zní HLAVNĚ v katedrále
            const sendRev = this.ctx.createGain(); sendRev.gain.value = 1.0;
            gain.connect(sendRev); sendRev.connect(this.reverbBus);

            osc.start(t); osc.stop(t + dur);
        });
    }

    // 🎹 PÍŠŤALOVÉ VARHANY (Zcela nový pedálový zvuk)
    playOrgan(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const dur = 4.0 + (Math.random()) * 2; //

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.8); // Pomalý náběh vzduchu
        gain.gain.setValueAtTime(0.12, t + dur - 1.5);
        gain.gain.linearRampToValueAtTime(0.001, t + dur);

        // Mix 3 trubic varhan
        [0.5, 1, 2].forEach(mult => {
            const osc = this.ctx.createOscillator();
            osc.type = mult === 1 ? 'square' : 'sine';
            osc.frequency.value = freq * mult;

            // Lehký filtr na oříznutí ostrosti obdélníku
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.value = 1200;

            osc.connect(filter); filter.connect(gain);
            osc.start(t); osc.stop(t + dur);
        });

        gain.connect(this.master);
        const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.8;
        gain.connect(sendRev); sendRev.connect(this.reverbBus);
    }

    // 🗣️ MNIŠSKÝ CHORÁL 
    playChant(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        const f1 = this.ctx.createBiquadFilter(); const f2 = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth'; osc.frequency.value = freq / 2;
        f1.type = 'bandpass'; f1.frequency.value = 600; f1.Q.value = 4;
        f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 5;

        osc.connect(f1); f1.connect(gain); osc.connect(f2); f2.connect(gain);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 1.0);
        gain.gain.linearRampToValueAtTime(0, t + 3.0);

        gain.connect(this.master); gain.connect(this.reverbBus);
        osc.start(t); osc.stop(t + 3.0);
    }

    // 👻 CREEPY CHOIR
    playCreepyChoir(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle'; osc.frequency.value = freq;
        filter.type = 'lowpass'; filter.frequency.value = 250 + (Math.random()) * 300; //

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 2.0);
        gain.gain.linearRampToValueAtTime(0, t + 5.0);

        osc.connect(filter); filter.connect(gain);
        gain.connect(this.master); gain.connect(this.reverbBus);
        osc.start(t); osc.stop(t + 5.0);
    }

    manageDrone() {
        if (!this.droneOsc) {
            this.droneOsc = this.ctx.createOscillator();
            this.droneOsc2 = this.ctx.createOscillator();
            this.droneGain = this.ctx.createGain();
            this.droneFilter = this.ctx.createBiquadFilter();

            // Extrémně hluboký základní tón (D1)
            this.droneOsc.type = 'sine';
            this.droneOsc.frequency.value = 36.71;

            // Textura drone (D2)
            this.droneOsc2.type = 'triangle';
            this.droneOsc2.frequency.value = 73.42;

            this.droneFilter.type = 'lowpass';
            this.droneGain.gain.value = 0;

            const osc1Gain = this.ctx.createGain(); osc1Gain.gain.value = 1.0;
            const osc2Gain = this.ctx.createGain(); osc2Gain.gain.value = 0.20;

            this.droneOsc.connect(osc1Gain); osc1Gain.connect(this.droneFilter);
            this.droneOsc2.connect(osc2Gain); osc2Gain.connect(this.droneFilter);

            this.droneFilter.connect(this.droneGain);

            // Drone je zapojen také přímo do Reverbu! Vytváří neuvěřitelně hutné ovzduší.
            this.droneGain.connect(this.master);
            const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.4;
            this.droneGain.connect(sendRev); sendRev.connect(this.reverbBus);

            this.droneOsc.start(); this.droneOsc2.start();
        }

        const targetVol = this.mood > 0.4 ? (this.mood * 0.25) : 0.05;
        this.droneGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 2);
        this.droneFilter.frequency.linearRampToValueAtTime(60 + (this.mood * 80) + (Math.random() * 5), this.ctx.currentTime + 2); //
    }

    start() {
        if (this._started) return;
        this._started = true;
        this.manageDrone();

        this._interval = setInterval(() => {
            if (this.step === 0) {
                this.mood += this.moodDirection;
                if (this.mood > 1.0 || this.mood < 0.0) {
                    this.moodDirection *= -1;
                    this.mood += this.moodDirection;
                }

                let baseMotif = this.motifs[Math.floor(Math.random() * this.motifs.length)];
                let transposition = Math.random() < 0.3 ? 2 : 0;
                if (this.measure % 4 === 0) transposition = 0;

                this.currentPhrase = baseMotif.map(index => {
                    if (index === -1) return null;
                    let newIndex = index + transposition;
                    if (newIndex >= this.scale.length) newIndex = this.scale.length - 1;
                    return this.scale[newIndex];
                });

                this.manageDrone();
                this.measure++;
            }

            const note = this.currentPhrase[this.step];

            if (note) {
                // SVĚTLÁ NÁLADA: Sitar dominuje, Zvony občas, Flétna je velmi vzácná
                if (this.mood < 0.4) {
                    if (Math.random() > 0.3) this.playSitar(note);
                    if (Math.random() > 0.85) this.playBell(note); // Zvon
                    if ((this.step === 0 || this.step === 3) && Math.random() > 0.85) {
                        this.playFlute(note); // Flétna jen pomálu
                    }
                }
                // PŘECHODOVÁ NÁLADA: Chorály mnohem častější, občas zapnou Varhany
                else if (this.mood >= 0.4 && this.mood < 0.7) {
                    if (Math.random() > 0.25) this.playChant(note); // Častý chorál
                    if (Math.random() > 0.8) this.playOrgan(note); // Občasné varhany
                }
                // TEMNOTÁ NÁLADA: Temný sbor, Hlubší varhany a Hluboké Zvony
                else {
                    if (Math.random() > 0.15) this.playCreepyChoir(note); // Dominance temného sboru
                    if (Math.random() > 0.75) this.playOrgan(note / 2); // Varhany hrají o oktávu níž (masivní sub)
                    if (Math.random() > 0.8) this.playBell(note / 2); // Zvon hraje o oktávu níž (obří zvon)
                }
            }

            this.step = (this.step + 1) % 6;

            // Tempo je o něco pomalejší pro důstojnost a prostor zvonů
        }, 400 - ((Math.random() * 0.3) * 150));
    }

    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        this._started = false;
        if (this.droneOsc) { try { this.droneOsc.stop(); } catch (e) { } this.droneOsc = null; }
    }
}

// ═══ TIER 3: Ars Nova ═══
// --- JOUZA LAB v6: ARS NOVA (DRY HI-HAT FIX) ---
class ArsNovaGenerative {
    constructor(audioContext, destinationNode) {
        this.ctx = audioContext;
        this.dest = destinationNode;
        this._interval = null;
        this._started = false;
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;

        // OCHRANNÝ LIMITER PROTI PRASKÁNÍ (Clippingu)
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -2.0; // Zasáhne těsně pod maximem
        this.limiter.knee.value = 0.0;       // Okamžitá reakce
        this.limiter.ratio.value = 20.0;     // Funguje jako tvrdá zeď
        this.limiter.attack.value = 0.005;   // Rychlost zásahu
        this.limiter.release.value = 0.05;   // Rychlost uvolnění

        this.master.connect(this.limiter);
        this.limiter.connect(destinationNode);

        const size = this.ctx.sampleRate * 2;
        this.whiteBuf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
        for (let i = 0; i < size; i++) {
            this.whiteBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
        }

        this.reverbBus = this.ctx.createGain();
        this.reverbBus.gain.value = 1.0;

        const revLen = this.ctx.sampleRate * 2.5;
        const revBuf = this.ctx.createBuffer(2, revLen, this.ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = revBuf.getChannelData(c);
            let filterOut = 0;
            for (let i = 0; i < revLen; i++) {
                filterOut = (filterOut * 0.95) + ((Math.random() * 2 - 1) * 0.05);
                d[i] = filterOut * Math.pow(1 - i / revLen, 4.0) * 4.0;
            }
        }
        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = revBuf;

        this.reverbOutGain = this.ctx.createGain();
        this.reverbOutGain.gain.value = 1.5;

        this.reverbBus.connect(this.convolver);
        this.convolver.connect(this.reverbOutGain);
        this.reverbOutGain.connect(this.master);

        this.scale = [293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3, 587.3, 659.3, 698.5];

        this.motifs = [
            [0, 1, 2, 4, 3, 2],
            [4, 2, 0, 1, 2, -1],
            [2, 3, 4, 6, 5, 4],
            [0, -1, 4, 2, 0, -1],
            [2, 2, 1, 0, -1, 0]
        ];

        this.currentPhrase = [];
        this.step = 0;
        this.measure = 0;
        this.mood = 0.3;
        this.moodDirection = 0.02;
    }

    playLute(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain(); const panner = this.ctx.createStereoPanner();

        osc.type = 'triangle'; osc.frequency.value = freq;
        filter.type = 'lowpass'; filter.frequency.setValueAtTime(2500 + ((Math.random() * 5) * 5), t); filter.frequency.exponentialRampToValueAtTime(200, t + 0.1);
        const dur = 1.0 + (Math.random()) * 1.5;
        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.4, t + 0.015); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        panner.pan.value = -0.35;

        osc.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(this.master);
        const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.6; panner.connect(sendRev); sendRev.connect(this.reverbBus);
        osc.start(t); osc.stop(t + dur);
    }

    playHarp(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain(); const panner = this.ctx.createStereoPanner();

        osc.type = 'sine';
        osc.frequency.value = freq * 2;

        const dur = 2.5 + Math.random();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        panner.pan.value = 0.45;

        osc.connect(gain); gain.connect(panner); panner.connect(this.master);
        const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.9; panner.connect(sendRev); sendRev.connect(this.reverbBus);
        osc.start(t); osc.stop(t + dur);
    }

    playSitar(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain(); const panner = this.ctx.createStereoPanner();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 1.05, t);
        osc.frequency.exponentialRampToValueAtTime(freq, t + 0.1);

        filter.type = 'bandpass'; filter.frequency.value = freq * 2.5; filter.Q.value = 3;
        const dur = 3.0 + (Math.random()) * 2.0;

        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.75, t + 0.05); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        panner.pan.value = Math.sin(t) * 0.5;

        osc.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(this.master);
        const sendRev = this.ctx.createGain(); sendRev.gain.value = 1.0; panner.connect(sendRev); sendRev.connect(this.reverbBus);
        osc.start(t); osc.stop(t + dur);
    }

    playFiddle(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime; const dur = 1.8 + Math.random();
        const osc1 = this.ctx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = freq;
        const osc2 = this.ctx.createOscillator(); osc2.type = 'sawtooth'; osc2.frequency.value = freq * 1.004;

        const bowNoise = this.ctx.createBufferSource(); bowNoise.buffer = this.whiteBuf;
        const noiseFilter = this.ctx.createBiquadFilter(); noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 3500;
        const noiseGain = this.ctx.createGain(); noiseGain.gain.setValueAtTime(0, t);
        noiseGain.gain.linearRampToValueAtTime(0.002, t + 0.3); noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        bowNoise.connect(noiseFilter); noiseFilter.connect(noiseGain);

        const lfo = this.ctx.createOscillator(); const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 4.5 + Math.random() * 1.5;
        lfoGain.gain.setValueAtTime(0, t); lfoGain.gain.linearRampToValueAtTime(freq * 0.015, t + 0.6);
        lfo.connect(lfoGain); lfoGain.connect(osc1.frequency); lfoGain.connect(osc2.frequency);

        const bodyFilter = this.ctx.createBiquadFilter(); bodyFilter.type = 'lowpass'; bodyFilter.frequency.value = freq * 3.5;
        const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.4); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        const panner = this.ctx.createStereoPanner(); panner.pan.value = Math.sin(this.step) * 0.25;

        osc1.connect(bodyFilter); osc2.connect(bodyFilter); noiseGain.connect(bodyFilter);
        bodyFilter.connect(gain); gain.connect(panner); panner.connect(this.master);
        const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.8; panner.connect(sendRev); sendRev.connect(this.reverbBus);

        osc1.start(t); osc1.stop(t + dur); osc2.start(t); osc2.stop(t + dur);
        bowNoise.start(t); bowNoise.stop(t + dur); lfo.start(t); lfo.stop(t + dur);
    }

    playFlute(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter(); const panner = this.ctx.createStereoPanner();

        osc.type = 'sine'; osc.frequency.value = freq * 2; filter.type = 'lowpass'; filter.frequency.value = 1200;
        const dur = 0.4 + Math.random() * 0.4;
        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.2, t + 0.05); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        panner.pan.value = 0.35;

        osc.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(this.master);
        const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.5; panner.connect(sendRev); sendRev.connect(this.reverbBus);
        osc.start(t); osc.stop(t + dur);
    }

    playRhythm() {
        const t = this.ctx.currentTime;

        // VELKÝ BUBEN
        if (this.mood < 0.6 && this.step === 0) {
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); const panner = this.ctx.createStereoPanner();
            osc.frequency.setValueAtTime(80, t); osc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
            gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.6, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            panner.pan.value = 0;
            osc.connect(gain); gain.connect(panner); panner.connect(this.master);
            const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.8; panner.connect(sendRev); sendRev.connect(this.reverbBus);
            osc.start(t); osc.stop(t + 0.5);
        }

        // DARBUKA / BUBÍNKY
        if (this.mood < 0.7 && (this.step === 1 || this.step === 3 || this.step === 4) && Math.random() > 0.15) {
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); const panner = this.ctx.createStereoPanner();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250 + Math.random() * 50, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
            gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.4, t + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            panner.pan.value = -0.3;
            osc.connect(gain); gain.connect(panner); panner.connect(this.master);
            const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.5; panner.connect(sendRev); sendRev.connect(this.reverbBus);
            osc.start(t); osc.stop(t + 0.15);
        }

        // HAJTKA (Tamburína / Luskání) - ÚPRAVA REVERBU!
        if (this.mood < 0.7 && (this.step === 2 || this.step === 5) && Math.random() > 0.3) {
            const noise = this.ctx.createBufferSource(); noise.buffer = this.whiteBuf;
            const filter = this.ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 5000;
            const gain = this.ctx.createGain(); const panner = this.ctx.createStereoPanner();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.01); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            panner.pan.value = 0.3;
            noise.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(this.master);

            // TADY JE TA ZMĚNA - sendRev je teď stažený na 0.05 pro ostrou, suchou hajtku!
            const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.05;
            panner.connect(sendRev); sendRev.connect(this.reverbBus);

            noise.start(t);
        }
    }

    playOrgan(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime; const dur = 3.0;
        const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.3); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        [0.5, 1, 2].forEach(mult => {
            const osc = this.ctx.createOscillator(); osc.type = mult === 1 ? 'square' : 'sine'; osc.frequency.value = freq * mult;
            const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1000;
            osc.connect(filter); filter.connect(gain); osc.start(t); osc.stop(t + dur);
        });

        gain.connect(this.master); const sendRev = this.ctx.createGain(); sendRev.gain.value = 1.0; gain.connect(sendRev); sendRev.connect(this.reverbBus);
    }

    playChant(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        const f1 = this.ctx.createBiquadFilter(); const f2 = this.ctx.createBiquadFilter();
        osc.type = 'sawtooth'; osc.frequency.value = freq / 2;
        f1.type = 'bandpass'; f1.frequency.value = 600; f1.Q.value = 4; f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 5;
        osc.connect(f1); f1.connect(gain); osc.connect(f2); f2.connect(gain);
        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.2, t + 1.0); gain.gain.linearRampToValueAtTime(0, t + 3.0);
        gain.connect(this.master); gain.connect(this.reverbBus); osc.start(t); osc.stop(t + 3.0);
    }

    manageDrone() {
        if (!this.droneOsc) {
            this.droneOsc = this.ctx.createOscillator(); this.droneOsc2 = this.ctx.createOscillator();
            this.droneGain = this.ctx.createGain(); this.droneFilter = this.ctx.createBiquadFilter();

            this.dronePanner = this.ctx.createStereoPanner();

            this.droneOsc.type = 'sine'; this.droneOsc.frequency.value = 36.71;
            this.droneOsc2.type = 'sawtooth'; this.droneOsc2.frequency.value = 73.42;

            this.droneFilter.type = 'lowpass'; this.droneGain.gain.value = 0;
            const g1 = this.ctx.createGain(); g1.gain.value = 1.0;
            const g2 = this.ctx.createGain(); g2.gain.value = 0.15;

            this.droneOsc.connect(g1); g1.connect(this.droneFilter);
            this.droneOsc2.connect(g2); g2.connect(this.droneFilter);

            this.droneFilter.connect(this.dronePanner);
            this.dronePanner.connect(this.droneGain);

            this.droneGain.connect(this.master);
            const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.5;
            this.droneGain.connect(sendRev); sendRev.connect(this.reverbBus);

            this.droneOsc.start(); this.droneOsc2.start();
        }

        const targetVol = this.mood > 0.4 ? 0.35 : 0.15;
        this.droneGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 2);
        this.droneFilter.frequency.linearRampToValueAtTime(60 + (this.mood * 80) + (Math.random() * 5), this.ctx.currentTime + 2);
    }

    start() {
        if (this._started) return;
        this._started = true;
        this.manageDrone();

        this._interval = setInterval(() => {
            if (this.step === 0) {
                this.mood += this.moodDirection;
                if (this.mood > 1.0 || this.mood < 0.0) { this.moodDirection *= -1; this.mood += this.moodDirection; }

                let baseMotif = this.motifs[Math.floor(Math.random() * this.motifs.length)];
                let transposition = Math.random() < 0.3 ? 2 : 0; if (this.measure % 4 === 0) transposition = 0;

                this.currentPhrase = baseMotif.map(index => {
                    if (index === -1) return null;
                    return this.scale[index + transposition] || this.scale[index];
                });

                const panPosition = Math.sin(this.measure * 0.6) * 0.7;
                this.dronePanner.pan.linearRampToValueAtTime(panPosition, this.ctx.currentTime + 1.5);

                this.manageDrone(); this.measure++;
            }

            this.playRhythm();

            const melodyNote = this.currentPhrase[this.step];
            const rootNote = this.currentPhrase[0];

            if (melodyNote) {
                if (this.mood < 0.4) {
                    if (Math.random() > 0.2) this.playLute(melodyNote);
                    if (Math.random() > 0.5) this.playFlute(melodyNote);
                    if (Math.random() > 0.4) this.playHarp(melodyNote);
                    if (Math.random() > 0.6) this.playSitar(melodyNote);
                }
                else if (this.mood >= 0.4 && this.mood < 0.7) {
                    if (Math.random() > 0.1) this.playFiddle(melodyNote);
                    if (Math.random() > 0.5) this.playHarp(melodyNote);
                }
                else {
                    if (Math.random() > 0.3) this.playFiddle(melodyNote);
                }
            }

            if (this.step === 0 && rootNote) {
                if (this.mood >= 0.4 && this.mood < 0.7) {
                    if (Math.random() > 0.4) this.playChant(rootNote);
                }
                else if (this.mood >= 0.7) {
                    if (Math.random() > 0.1) this.playChant(rootNote);
                    if (Math.random() > 0.9) this.playOrgan(rootNote);
                }
            }

            this.step = (this.step + 1) % 6;

        }, 280 - ((Math.random() * 0.3) * 100));
    }

    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        this._started = false;
        if (this.droneOsc) { try { this.droneOsc.stop(); } catch (e) { } this.droneOsc = null; }
        if (this.droneOsc2) { try { this.droneOsc2.stop(); } catch (e) { } this.droneOsc2 = null; }
    }
}

// ═══ AUDIO SYSTEM + TIER 2: Abyssal Keep ═══
class AudioSystem {
    constructor() {
        // AudioContext setup
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 44100,
            latencyHint: 'playback'
        });

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(this.audioContext.destination);

        // Fire gain node (separate from master)
        this.fireGain = this.audioContext.createGain();
        this.fireGain.gain.value = 0.5;  // Default 50%
        this.fireGain.connect(this.masterGain);

        // Kamenný prostor (Convolver reverb)
        this.echoBus = this.audioContext.createGain();
        this.echoBus.gain.value = 1.0;
        const revLen = this.audioContext.sampleRate * 2.2;
        const revBuf = this.audioContext.createBuffer(2, revLen, this.audioContext.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = revBuf.getChannelData(c);
            for (let i = 0; i < revLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / revLen, 4.5);
        }
        this.convolver = this.audioContext.createConvolver();
        this.convolver.buffer = revBuf;
        this.echoBus.connect(this.convolver);
        this.convolver.connect(this.masterGain);

        this.isPlaying = false;
        this.crackleInterval = null;

        // Volume z GameState
        this.volume = (typeof GameState !== 'undefined' && GameState.settings)
            ? GameState.settings.volume
            : 0.17;

        // Fire volume z GameState
        this.fireVolume = (typeof GameState !== 'undefined' && GameState.settings)
            ? GameState.settings.fireVolume
            : 0.5;

        // Music gain node (generativní hudba → masterGain)
        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.value = 0;
        this.musicGain.connect(this.masterGain);

        // Global mute flag
        this.isMuted = (typeof GameState !== 'undefined' && GameState.settings)
            ? (GameState.settings.soundMuted === true)
            : false;

        // Music enabled flag
        this.musicEnabled = (typeof GameState !== 'undefined' && GameState.settings)
            ? (GameState.settings.musicEnabled !== false)
            : true;

        // Music volume z GameState
        this.musicVolume = (typeof GameState !== 'undefined' && GameState.settings)
            ? (GameState.settings.musicVolume ?? 0.5)
            : 0.5;

        // Music tier tracking
        this.musicTier = 0; // 0 = žádná hudba, 1 = Sacral, 2 = Abyssal, 3 = ArsNova

        // Storage pro audio smyčky
        this.loops = {};

        // Backwards compatibility
        this.ctx = this.audioContext;

        // Generativní hudební engine (inicializuje se při start())
        this.music = null;
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════

    start() {
        if (this.isPlaying) return;

        // Resume pro prohlížeče (autoplay policy) — async, čekáme na .then()
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => this._startAfterResume());
        } else {
            this._startAfterResume();
        }
    }

    _startAfterResume() {
        // Pokud je krb rozžehnutý, spustit zvuk
        if (typeof GameState !== 'undefined' && GameState.flags.fireplaceLit) {
            this.startFireLoop(true);
        }

        // Spustit generativní hudbu na správném tieru
        if (this.musicEnabled && this.musicTier === 0) {
            const tier = this.getUnlockedMusicTier();
            this.switchMusicTier(tier);
        }

        // Restore music settings from GameState
        if (typeof GameState !== 'undefined' && GameState.settings) {
            this.setMusicEnabled(GameState.settings.musicEnabled !== false);
            this.setMusicVolume((GameState.settings.musicVolume ?? 0.5) * 100);
        }

        // Enforce mute state (must run after all volume restores)
        if (this.isMuted) {
            this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
            this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MUSIC TIER SYSTEM
    // Tier 1: SacralCathedralGenerative — tech_neuma_notation
    // Tier 2: AbyssalKeepGenerative     — tech_schola_cantorum
    // Tier 3: ArsNovaGenerative         — Cellarium unlock (GameState.cellariumUnlocked)
    // ═══════════════════════════════════════════════════════════

    getUnlockedMusicTier() {
        if (typeof GameState === 'undefined') return 0;
        const techs = GameState.researchedTechs || [];
        const secrets = GameState.secrets || {};
        // Tier 3: Cellarium odemčen
        if (secrets.cellariumUnlocked || techs.includes('tech_cellarium')) return 3;
        // Tier 2: Schola Cantorum
        if (techs.includes('tech_schola_cantorum')) return 2;
        // Tier 1: Neuma Notation
        if (techs.includes('tech_neuma_notation')) return 1;
        return 0;
    }

    switchMusicTier(tier) {
        if (tier === 0) {
            // Stopnout engine + odpojit gain = utiší vše včetně naplánovaných oscillátorů
            if (this.music) { this.music.stop(); this.music = null; }
            try { this.musicGain.disconnect(); } catch (e) { }
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0;
            this.musicGain.connect(this.masterGain);
            this.musicTier = 0;
            console.log('Hudba: vypnuta');
            return;
        }

        if (this.musicTier === tier && this.music && this.music._started) return;

        // 1. Stopnout starý engine (interval + drony)
        if (this.music) {
            if (typeof this.music.stop === 'function') this.music.stop();
            this.music = null;
        }

        // 2. KLIC: Odpojit starý musicGain — okamžitě utiší zbývající oscillátory
        try { this.musicGain.disconnect(); } catch (e) { }

        // 3. Vytvořit čistý nový musicGain
        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.value = 0;
        this.musicGain.connect(this.masterGain);

        // 4. Race condition guard
        if (!this._switchId) this._switchId = 0;
        this._switchId++;
        const thisSwitchId = this._switchId;

        // 5. Spustit nový engine po krátkém fade-in
        setTimeout(() => {
            if (this._switchId !== thisSwitchId) return;
            if (tier === 1) {
                this.music = new SacralCathedralGenerative(this.audioContext, this.musicGain);
            } else if (tier === 2) {
                this.music = new AbyssalKeepGenerative(this.audioContext, this.musicGain);
            } else if (tier === 3) {
                this.music = new ArsNovaGenerative(this.audioContext, this.musicGain);
            }
            this.musicTier = tier;
            if (this.music && this.musicEnabled) {
                this.music.start();
                this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioContext.currentTime, 1.0);
            }
        }, 800);
    }

    // Zavolat po každém researchi — zkontroluje jestli se tier změnil
    checkMusicTierUpgrade() {
        if (!this.musicEnabled) return;
        const newTier = this.getUnlockedMusicTier();
        if (newTier > this.musicTier) {
            console.log(`🎵 Music tier upgrade: ${this.musicTier} → ${newTier}`);
            this.switchMusicTier(newTier);
        }
    }

    // Varhany v Templu (endgame-branches-reference.md, Fabrica furnishing) — hráč
    // klika na jednotlivé píšťaly, každá hraje svůj tón. Hudba se ztiší při prvním
    // kliku, po ~6 s nečinnosti se vrátí předchozí tier. Vlastní krátká syntéza —
    // NE recyklovaný SacralCathedralGenerative.playOrgan() (ten má 4-6s dozvuk,
    // navržený pro řídké ambientní podbarvení, ne rychlé klikání — při klikání
    // po sobě se ozvěny navrství a splynou v nekončící hukot).
    ORGAN_IDLE_MS = 6000;

    playOrganNote(freq) {
        if (!freq) return;
        if (!this._organSoloActive) {
            this._organSoloActive = true;
            this._organPrevTier = this.musicTier;
            this.switchMusicTier(0);
            // Vlastní gain uzel na plnou hlasitost — switchMusicTier(0) ztlumil
            // musicGain na 0, napojení na něj by vygenerovalo zvuk neslyšně.
            this._organSoloGain = this.audioContext.createGain();
            this._organSoloGain.gain.value = this.musicVolume || 0.5;
            this._organSoloGain.connect(this.masterGain);
        }
        this._playOrganKeyTone(freq, this._organSoloGain);

        clearTimeout(this._organIdleTimer);
        this._organIdleTimer = setTimeout(() => {
            this._organSoloActive = false;
            try { this._organSoloGain.disconnect(); } catch (e) { }
            this.switchMusicTier(this._organPrevTier);
        }, this.ORGAN_IDLE_MS);
    }

    // Krátký responzivní tón (~0.9 s) — stejná barva jako ambient varhany
    // (3 mixované harmonické, lowpass), ale bez dlouhého dozvuku.
    _playOrganKeyTone(freq, destGain) {
        const t = this.audioContext.currentTime;
        const dur = 0.9;
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
        gain.gain.setValueAtTime(0.28, t + dur - 0.25);
        gain.gain.linearRampToValueAtTime(0.0001, t + dur);
        [0.5, 1, 2].forEach(mult => {
            const osc = this.audioContext.createOscillator();
            osc.type = mult === 1 ? 'square' : 'sine';
            osc.frequency.value = freq * mult;
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.value = 1200;
            osc.connect(filter); filter.connect(gain);
            osc.start(t); osc.stop(t + dur);
        });
        gain.connect(destGain);
    }

    setVolume(val) {
        // val = 0-100 (slider value)
        const normalizedVolume = val / 100;

        if (typeof GameState !== 'undefined' && GameState.settings) {
            GameState.settings.volume = normalizedVolume;
        }

        this.volume = normalizedVolume;
        if (!this.isMuted) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.1);
        }

        // Save pokud existuje Game objekt
        if (typeof Game !== 'undefined' && typeof Game.save === 'function') {
            Game.save();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        const now = this.audioContext.currentTime;

        if (this.isMuted) {
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(0, now);
            if (this.fireGain) {
                this.fireGain.gain.cancelScheduledValues(now);
                this.fireGain.gain.setValueAtTime(0, now);
            }
        } else {
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.volume, now);
            if (this.fireGain) {
                this.fireGain.gain.cancelScheduledValues(now);
                this.fireGain.gain.setValueAtTime(this.fireVolume, now);
            }
        }

        if (typeof GameState !== 'undefined' && GameState.settings) {
            GameState.settings.soundMuted = this.isMuted;
        }
        if (typeof Game !== 'undefined' && typeof Game.save === 'function') {
            Game.save();
        }

        const icon = this.isMuted ? '🔇' : '🔊';
        const btnBar = document.getElementById('sound-toggle-btn');
        const btnPill = document.getElementById('sound-toggle-pill-icon');
        if (btnBar) btnBar.textContent = icon;
        if (btnPill) btnPill.textContent = icon;
    }

    setFireVolume(volume) {
        // volume = 0-1 (normalized)
        this.fireVolume = volume;

        if (this.fireGain) {
            this.fireGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;

        if (typeof GameState !== 'undefined' && GameState.settings) {
            GameState.settings.musicEnabled = enabled;
        }

        if (enabled) {
            const tier = this.getUnlockedMusicTier();
            this.switchMusicTier(tier);
        } else {
            this.musicGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 1.0);
            if (this.music) { this.music.stop(); this.music = null; }
        }

        if (typeof Game !== 'undefined' && typeof Game.save === 'function') {
            Game.save();
        }
    }

    setMusicVolume(val) {
        // val = 0-100 (slider value)
        const normalized = val / 100;
        this.musicVolume = normalized;

        if (typeof GameState !== 'undefined' && GameState.settings) {
            GameState.settings.musicVolume = normalized;
        }

        if (this.musicEnabled) {
            this.musicGain.gain.setTargetAtTime(normalized, this.audioContext.currentTime, 0.1);
        }

        if (typeof Game !== 'undefined' && typeof Game.save === 'function') {
            Game.save();
        }
    }

    startFireLoop(instant = false) {
        if (this.isPlaying) return;

        this.isPlaying = true;

        // Defensive: obnova fireGain pokud chybí (nemělo by nastat, ale pro jistotu)
        if (!this.fireGain) {
            this.fireGain = this.audioContext.createGain();
            this.fireGain.gain.value = 0;
            this.fireGain.connect(this.masterGain);
        }

        // Fade in fire gain
        this.fireGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        if (instant) {
            this.fireGain.gain.setValueAtTime(this.fireVolume, this.audioContext.currentTime);
        } else {
            this.fireGain.gain.setTargetAtTime(this.fireVolume, this.audioContext.currentTime, 0.5);
        }

        // Fade in master gain (respect mute state)
        this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        if (!this.isMuted) {
            if (instant) {
                this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            } else {
                this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.5);
            }
        }

        // Spuštění vrstev zvuku
        this.startRumble();
        this.startHiss();
        this.scheduleRandomEvents();

        console.log('🔥 Realistic fire sound started');
    }

    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;

        // Fade out fire gain (not master - bells still need to play)
        this.fireGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.fireGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5);

        // Zastavení smyček s malým zpožděním
        setTimeout(() => {
            if (this.loops.rumble) {
                this.loops.rumble.stop();
                this.loops.rumble = null;
            }
            if (this.loops.hiss) {
                this.loops.hiss.stop();
                this.loops.hiss = null;
            }
        }, 600);

        // Vyčištění intervalu
        if (this.crackleInterval) {
            clearInterval(this.crackleInterval);
            this.crackleInterval = null;
        }
        // fireGain node zůstává v grafu — jen ztlumený na 0 (viz setTargetAtTime výše)
    }

    // ═══════════════════════════════════════════════════════════
    // FIRE SOUND SYNTHESIS (Internal) — v3.2 Klidný táborák
    // ═══════════════════════════════════════════════════════════

    scheduleRandomEvents() {
        this.crackleInterval = setInterval(() => {
            if (!this.isPlaying) return;
            const now = this.audioContext.currentTime;

            // 1. Praskání — skupinové (jako v 3.2)
            if (Math.random() > 0.7) {
                const type = Math.random() > 0.4 ? 'sharp' : 'deep';
                const eventTime = now + Math.random() * 0.2;

                this.playCrackle(type, eventTime);

                if (Math.random() > 0.3) {
                    const nextType = type === 'deep' ? 'sharp' : 'deep';
                    this.playCrackle(nextType, eventTime + 0.1 + Math.random() * 0.15);

                    if (Math.random() > 0.6) {
                        this.playCrackle('sharp', eventTime + 0.3 + Math.random() * 0.2);
                    }
                }
            }

            // 2. Táhlé foukavé dýchání (vzácné)
            if (Math.random() < 0.08) {
                this.playBreath(now + Math.random() * 0.2);
            }

        }, 1000);
    }

    playCrackle(type, time) {
        const bufferSize = this.audioContext.sampleRate * 0.15;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        const decay = type === 'sharp' ? 30 + Math.random() * 20 : 8 + Math.random() * 4;
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufferSize) * decay);
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';

        if (type === 'sharp') {
            filter.frequency.value = 3500 + Math.random() * 4000;
            filter.Q.value = 1.0 + Math.random() * 1.5;
        } else {
            filter.frequency.value = 150 + Math.random() * 200;
            filter.Q.value = 0.5 + Math.random() * 0.5;
        }

        const softenFilter = this.audioContext.createBiquadFilter();
        softenFilter.type = 'lowpass';
        softenFilter.frequency.value = 6000;

        const gain = this.audioContext.createGain();
        const targetVolume = (type === 'sharp' ? 0.3 : 0.45) + Math.random() * 0.15;
        gain.gain.value = targetVolume;

        noise.connect(filter);
        filter.connect(softenFilter);
        softenFilter.connect(gain);
        gain.connect(this.fireGain);

        // Silné prasknutí pošleme i do kamenného dozvuku
        if (targetVolume > 0.48) {
            const sendGain = this.audioContext.createGain();
            sendGain.gain.value = targetVolume * 0.8;
            gain.connect(sendGain);
            sendGain.connect(this.echoBus);
        }

        noise.start(time);
    }

    playBreath(time) {
        const duration = 2.5 + Math.random() * 3.0;
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500 + Math.random() * 1000;
        filter.Q.value = 0.4;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.02, time + duration * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.fireGain);
        gain.connect(this.echoBus);

        noise.start(time);
    }

    startRumble() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 50;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.45;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.fireGain);
        noise.start();
        this.loops.rumble = noise;
    }

    startHiss() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;

        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 0.6;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.02;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.fireGain);
        noise.start();
        this.loops.hiss = noise;
    }

    // ═══════════════════════════════════════════════════════════
    // HOUR CHIME SYSTEM — Church bells
    // ═══════════════════════════════════════════════════════════

    playCink(volumeMultiplier = 1.0) {
        // Jednoduchý "cink" — high-pitched bell tap
        // Použití: Basic hour chime (před unlock canonical tech)

        const now = this.audioContext.currentTime;
        const pitch = 1047; // C6

        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = pitch;

        const gain = this.audioContext.createGain();
        const vol = 0.15 * volumeMultiplier * this.volume;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    playChurchBell(type = 'avemaria', volumeMultiplier = 1.0) {
        // Komplexní zvony s harmonics
        // Použití: Po unlocku tech_canonical_hours

        const bells = {
            cink: { pitch: 1047, pattern: [0], duration: 0.5, harmonics: [] },
            sanctus: { pitch: 330, pattern: [0], duration: 2.0, harmonics: [2.0, 3.0, 4.2] },
            avemaria: { pitch: 220, pattern: [0, 0.3, 0.6], duration: 3.0, harmonics: [2.0, 3.0, 4.2, 5.4] },
            compline: { pitch: 147, pattern: [0, 1.2], duration: 5.0, harmonics: [2.0, 3.0, 4.2, 5.4, 6.8] },
            deathknell: { pitch: 98, pattern: [0], duration: 8.0, harmonics: [2.0, 3.0, 4.2, 5.4, 6.8] }
        };

        const bell = bells[type] || bells.avemaria;

        // Play each strike in pattern
        bell.pattern.forEach(delay => {
            this.playBellStrike(bell.pitch, bell.duration, bell.harmonics, delay, volumeMultiplier);
        });
    }

    playBellStrike(fundamental, duration, harmonics, delay, volumeMultiplier) {
        const now = this.audioContext.currentTime + delay;

        // Create fundamental + harmonics
        const partials = [1.0, ...harmonics];

        partials.forEach((ratio, index) => {
            const freq = fundamental * ratio;
            const amplitude = 1.0 / (index + 1); // Каждая гармоника тише

            // Main oscillator
            const osc1 = this.audioContext.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = freq;

            // Detuned oscillator for beating effect
            const osc2 = this.audioContext.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = freq + (Math.random() * 2 - 1); // ±1 Hz detune

            // Envelope
            const gain = this.audioContext.createGain();
            const vol = 0.2 * amplitude * volumeMultiplier * this.volume;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.05); // Sharp attack
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Long decay

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.masterGain);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + duration);
            osc2.stop(now + duration);
        });
    }
}


// ═══════════════════════════════════════════════════════════════
// ABYSSAL KEEP GENERATIVE — Procedural medieval music engine
// ═══════════════════════════════════════════════════════════════
// Cathedral Keep (Deep Sub-Drone Update)
// Adaptováno pro AudioSystem: přijímá audioContext + destinationNode
// Mood engine: 0.0 = Světlo/Vesnice  →  1.0 = Temnota/Kobka
// ═══════════════════════════════════════════════════════════════

class AbyssalKeepGenerative {
    constructor(audioContext, destinationNode) {
        this.ctx = audioContext;
        this.dest = destinationNode;

        this.master = this.ctx.createGain();
        this.master.gain.value = 0.8;
        this.master.connect(this.dest);

        // Katedrální reverb (3.5s)
        this.reverbBus = this.ctx.createGain();
        this.reverbBus.gain.value = 1.0;

        const revLen = this.ctx.sampleRate * 3.5;
        const revBuf = this.ctx.createBuffer(2, revLen, this.ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = revBuf.getChannelData(c);
            for (let i = 0; i < revLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / revLen, 5.0);
        }
        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = revBuf;

        this.reverbOutGain = this.ctx.createGain();
        this.reverbOutGain.gain.value = 1.8;

        this.reverbBus.connect(this.convolver);
        this.convolver.connect(this.reverbOutGain);
        this.reverbOutGain.connect(this.master);

        // D Aeolian
        this.scale = [293.7, 329.6, 349.2, 392.0, 440.0, 466.2, 523.3, 587.3, 659.3, 698.5];

        this.motifs = [
            [0, 1, 2, -1, 3, 2],
            [4, -1, 2, 1, 0, -1],
            [2, 3, 4, -1, 5, 4],
            [0, -1, 4, -1, 2, -1],
            [-1, 2, 1, 0, -1, 0]
        ];

        this.currentPhrase = [];
        this.step = 0;
        this.measure = 0;
        this.mood = 0.3;
        this.moodDirection = 0.015;

        this.droneOsc = null;
        this.droneOsc2 = null;
        this.droneGain = null;
        this.droneFilter = null;

        this._interval = null;
        this._started = false;
    }

    // ── Makra ──────────────────────────────────────────────────
    _macroA() { return 0; }
    _macroB() { return 0; }
    _macroC() { return 0; }

    // ── Nástroje ───────────────────────────────────────────────

    playLute(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.1);

        const dur = 1.0 + this._macroC() * 2.0;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(filter); filter.connect(gain);
        gain.connect(this.master);

        const sendRev = this.ctx.createGain(); sendRev.gain.value = 0.8;
        gain.connect(sendRev); sendRev.connect(this.reverbBus);

        osc.start(t); osc.stop(t + dur);
    }

    playFlute(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const dur = 2.0 + Math.random();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(filter); filter.connect(gain);
        gain.connect(this.reverbBus);
        gain.connect(this.master);

        osc.start(t); osc.stop(t + dur);
    }

    playPsalterium(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'square'; osc.frequency.value = freq * 2;
        filter.type = 'bandpass'; filter.frequency.value = freq * 5;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

        osc.connect(filter); filter.connect(gain);
        gain.connect(this.master);

        const sendRev = this.ctx.createGain(); sendRev.gain.value = 1.0;
        gain.connect(sendRev); sendRev.connect(this.reverbBus);

        osc.start(t); osc.stop(t + 2.5);
    }

    playChant(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const f1 = this.ctx.createBiquadFilter();
        const f2 = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth'; osc.frequency.value = freq / 2;
        f1.type = 'bandpass'; f1.frequency.value = 600; f1.Q.value = 4;
        f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 5;

        osc.connect(f1); f1.connect(gain);
        osc.connect(f2); f2.connect(gain);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 1.0);
        gain.gain.linearRampToValueAtTime(0, t + 3.0);

        gain.connect(this.master);
        gain.connect(this.reverbBus);

        osc.start(t); osc.stop(t + 3.0);
    }

    playCreepyChoir(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle'; osc.frequency.value = freq;
        filter.type = 'lowpass'; filter.frequency.value = 300 + this._macroC() * 300;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 1.5);
        gain.gain.linearRampToValueAtTime(0, t + 4.0);

        osc.connect(filter); filter.connect(gain);
        gain.connect(this.master); gain.connect(this.reverbBus);

        osc.start(t); osc.stop(t + 4.0);
    }

    playRhythm() {
        const t = this.ctx.currentTime;

        if (this.mood > 0.6 && this.step === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(60, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 0.8);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
            osc.connect(gain);
            gain.connect(this.master); gain.connect(this.reverbBus);
            osc.start(t); osc.stop(t + 0.8);
        }

        if (this.mood > 0.7 && Math.random() < 0.2 && this.step !== 0) {
            const bufSize = this.ctx.sampleRate * 0.5;
            const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            for (let i = 0; i < bufSize; i++) buffer.getChannelData(0)[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass'; filter.frequency.value = 1500 + Math.random() * 500; filter.Q.value = 25;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            noise.connect(filter); filter.connect(gain);
            gain.connect(this.master); gain.connect(this.reverbBus);
            noise.start(t);
        }

        if (this.mood < 0.5 && (this.step === 2 || this.step === 5)) {
            const bufSize = this.ctx.sampleRate * 0.1;
            const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            for (let i = 0; i < bufSize; i++) buffer.getChannelData(0)[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass'; filter.frequency.value = 4000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.03, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            noise.connect(filter); filter.connect(gain);
            gain.connect(this.master);
            noise.start(t);
        }
    }

    manageDrone() {
        if (!this.droneOsc) {
            this.droneOsc = this.ctx.createOscillator();
            this.droneOsc2 = this.ctx.createOscillator();
            this.droneGain = this.ctx.createGain();
            this.droneFilter = this.ctx.createBiquadFilter();

            // Sub-bass D1 (sine) + textura D2 (triangle)
            this.droneOsc.type = 'sine'; this.droneOsc.frequency.value = 36.71;
            this.droneOsc2.type = 'triangle'; this.droneOsc2.frequency.value = 73.42;

            this.droneFilter.type = 'lowpass';
            this.droneGain.gain.value = 0;

            const osc1Gain = this.ctx.createGain(); osc1Gain.gain.value = 1.0;
            const osc2Gain = this.ctx.createGain(); osc2Gain.gain.value = 0.25;

            this.droneOsc.connect(osc1Gain); osc1Gain.connect(this.droneFilter);
            this.droneOsc2.connect(osc2Gain); osc2Gain.connect(this.droneFilter);

            this.droneFilter.connect(this.droneGain);
            this.droneGain.connect(this.master);

            this.droneOsc.start();
            this.droneOsc2.start();
        }

        const targetVol = this.mood > 0.4 ? (this.mood * 0.25) : 0.05;
        this.droneGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 2);
        this.droneFilter.frequency.linearRampToValueAtTime(
            60 + (this.mood * 80) + this._macroA(),
            this.ctx.currentTime + 2
        );
    }

    start() {
        if (this._started) return;
        this._started = true;

        this.manageDrone();

        this._interval = setInterval(() => {
            if (this.step === 0) {
                this.mood += this.moodDirection;
                if (this.mood > 1.0 || this.mood < 0.0) {
                    this.moodDirection *= -1;
                    this.mood += this.moodDirection;
                }

                let baseMotif = this.motifs[Math.floor(Math.random() * this.motifs.length)];
                let transposition = Math.random() < 0.3 ? 2 : 0;
                if (this.measure % 4 === 0) transposition = 0;

                this.currentPhrase = baseMotif.map(index => {
                    if (index === -1) return null;
                    let newIndex = index + transposition;
                    if (newIndex >= this.scale.length) newIndex = this.scale.length - 1;
                    return this.scale[newIndex];
                });

                this.manageDrone();
                this.measure++;
            }

            this.playRhythm();

            const note = this.currentPhrase[this.step];
            if (note) {
                if (this.mood < 0.4) {
                    if (Math.random() > 0.3) this.playLute(note);
                    if ((this.step === 0 || this.step === 3) && Math.random() > 0.4) {
                        this.playFlute(note);
                    }
                } else if (this.mood < 0.7) {
                    if (Math.random() > 0.5) this.playChant(note);
                    else this.playPsalterium(note);
                } else {
                    if (Math.random() > 0.3) this.playCreepyChoir(note);
                    if (Math.random() < 0.2) this.playPsalterium(note);
                }
            }

            this.step = (this.step + 1) % 6;

        }, 320);
    }

    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        this._started = false;
        if (this.droneOsc) { this.droneOsc.stop(); this.droneOsc = null; }
        if (this.droneOsc2) { this.droneOsc2.stop(); this.droneOsc2 = null; }
        this.droneGain = null;
        this.droneFilter = null;
    }
}