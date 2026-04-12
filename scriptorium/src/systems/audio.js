// ═══════════════════════════════════════════════════════════════
// AUDIO SYSTEM — Procedural fire sound & ambience
// ═══════════════════════════════════════════════════════════════
// Version: 1.1 — + AbyssalKeepGenerative music engine
// Dependencies: GameState (for volume setting)
//
// Features:
// - Realistic procedural fire sound (rumble, hiss, crackles, whistles)
// - Master volume control with fade in/out
// - Automatic suspend/resume handling
// - Backwards compatibility with old code (ctx, fireGain properties)
//
// Usage:
//   const audio = new AudioSystem();
//   audio.start();
//   audio.startFireLoop(false);  // Fade in
//   audio.setVolume(50);         // 0-100
//   audio.stop();                // Fade out
// ═══════════════════════════════════════════════════════════════

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

        // Music enabled flag
        this.musicEnabled = (typeof GameState !== 'undefined' && GameState.settings)
                            ? (GameState.settings.musicEnabled !== false)
                            : true;

        // Music volume z GameState
        this.musicVolume = (typeof GameState !== 'undefined' && GameState.settings)
                           ? (GameState.settings.musicVolume ?? 0.5)
                           : 0.5;

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
        
        // Resume pro prohlížeče (autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Pokud je krb rozžehnutý, spustit zvuk
        if (typeof GameState !== 'undefined' && GameState.flags.fireplaceLit && !this.fireGain) {
            this.startFireLoop(true);
        }

        // Spustit generativní hudbu
        if (!this.music) {
            this.music = new AbyssalKeepGenerative(this.audioContext, this.musicGain);
        }
        if (this.musicEnabled) {
            this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioContext.currentTime, 1.0);
            this.music.start();
        }
    }
    
    setVolume(val) {
        // val = 0-100 (slider value)
        const normalizedVolume = val / 100;
        
        if (typeof GameState !== 'undefined' && GameState.settings) {
            GameState.settings.volume = normalizedVolume;
        }
        
        this.volume = normalizedVolume;
        this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.1);
        
        // Save pokud existuje Game objekt
        if (typeof Game !== 'undefined' && typeof Game.save === 'function') {
            Game.save();
        }
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
            // Spustit engine pokud ještě neběží
            if (!this.music) {
                this.music = new AbyssalKeepGenerative(this.audioContext, this.musicGain);
                this.music.start();
            }
            this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioContext.currentTime, 1.0);
        } else {
            this.musicGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 1.0);
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
        
        // Fade in fire gain
        this.fireGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        if (instant) {
            this.fireGain.gain.setValueAtTime(this.fireVolume, this.audioContext.currentTime);
        } else {
            this.fireGain.gain.setTargetAtTime(this.fireVolume, this.audioContext.currentTime, 0.5);
        }
        
        // Fade in master gain
        this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        if (instant) {
            this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        } else {
            this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.5);
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
        
        this.fireGain = null;
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
            cink:       { pitch: 1047, pattern: [0],           duration: 0.5, harmonics: [] },
            sanctus:    { pitch: 330,  pattern: [0],           duration: 2.0, harmonics: [2.0, 3.0, 4.2] },
            avemaria:   { pitch: 220,  pattern: [0, 0.3, 0.6], duration: 3.0, harmonics: [2.0, 3.0, 4.2, 5.4] },
            compline:   { pitch: 147,  pattern: [0, 1.2],      duration: 5.0, harmonics: [2.0, 3.0, 4.2, 5.4, 6.8] },
            deathknell: { pitch: 98,   pattern: [0],           duration: 8.0, harmonics: [2.0, 3.0, 4.2, 5.4, 6.8] }
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

        // D Aeolian (D, E, F, G, A, Bb, C)
        this.scale = [293.7, 329.6, 349.2, 392.0, 440.0, 466.2, 523.3, 587.3, 659.3, 698.5];

        // Motivy (-1 = pomlka/ticho)
        this.motifs = [
            [0, -1, -1, 4, -1, -1],
            [-1, -1, 1,  0, -1, -1],
            [4,  -1,  2, -1,  0, -1],
            [-1,  3, -1,  6, -1,  5],
            [0,   1, -1, -1, -1, -1]
        ];

        this.currentPhrase = [];
        this.step    = 0;
        this.measure = 0;

        // Mood engine
        this.mood          = 0.3;   // Začínáme ve "světle"
        this.moodDirection = 0.015;

        // Drone nodes (lazy init)
        this.droneOsc    = null;
        this.droneOsc2   = null;
        this.droneGain   = null;
        this.droneFilter = null;

        this._interval = null;
        this._started  = false;
    }

    // ── Makra (interní, nahrazují globální getA/B/C) ───────────────
    _macroA() { return 0; }   // Lze v budoucnu napojit na GameState
    _macroB() { return 0; }
    _macroC() { return 0; }

    // ── Nástroje ───────────────────────────────────────────────────

    playLute(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain   = this.ctx.createGain();

        osc1.type = 'sawtooth'; osc1.frequency.value = freq;
        osc2.type = 'square';   osc2.frequency.value = freq * 1.005;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.1);

        const dur = 0.2 + this._macroC();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc1.connect(filter); osc2.connect(filter);
        filter.connect(gain); gain.connect(this.master);
        osc1.start(t); osc2.start(t);
        osc1.stop(t + dur); osc2.stop(t + dur);
    }

    playPsalterium(freq) {
        if (!freq) return;
        const t = this.ctx.currentTime;
        const osc    = this.ctx.createOscillator();
        const gain   = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'square'; osc.frequency.value = freq * 2;
        filter.type = 'bandpass'; filter.frequency.value = freq * 5;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

        osc.connect(filter); filter.connect(gain); gain.connect(this.master);
        osc.start(t); osc.stop(t + 2.5);
    }

    playChant(freq) {
        if (!freq) return;
        const t  = this.ctx.currentTime;
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const f1   = this.ctx.createBiquadFilter();
        const f2   = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth'; osc.frequency.value = freq / 2;

        f1.type = 'bandpass'; f1.frequency.value = 600;  f1.Q.value = 4;
        f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 5;

        osc.connect(f1); f1.connect(gain);
        osc.connect(f2); f2.connect(gain);
        gain.connect(this.master);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 1.0);
        gain.gain.linearRampToValueAtTime(0,    t + 3.0);

        osc.start(t); osc.stop(t + 3.0);
    }

    playCreepyChoir(freq) {
        if (!freq) return;
        const t      = this.ctx.currentTime;
        const osc    = this.ctx.createOscillator();
        const gain   = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle'; osc.frequency.value = freq;
        filter.type = 'lowpass'; filter.frequency.value = 300 + this._macroC() * 300;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 1.5);
        gain.gain.linearRampToValueAtTime(0,   t + 4.0);

        osc.connect(filter); filter.connect(gain); gain.connect(this.master);
        osc.start(t); osc.stop(t + 4.0);
    }

    playRhythm() {
        const t = this.ctx.currentTime;

        if (this.mood > 0.6 && this.step === 0) {
            const osc  = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(60, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 0.8);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
            osc.connect(gain); gain.connect(this.master);
            osc.start(t); osc.stop(t + 0.8);
        }

        if (this.mood > 0.7 && Math.random() < 0.2 && this.step !== 0) {
            const bufSize = this.ctx.sampleRate * 0.5;
            const buffer  = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            for (let i = 0; i < bufSize; i++) buffer.getChannelData(0)[i] = Math.random() * 2 - 1;
            const noise  = this.ctx.createBufferSource(); noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass'; filter.frequency.value = 1500 + Math.random() * 500; filter.Q.value = 25;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            noise.connect(filter); filter.connect(gain); gain.connect(this.master);
            noise.start(t);
        }

        if (this.mood < 0.5 && (this.step === 2 || this.step === 5)) {
            const bufSize = this.ctx.sampleRate * 0.1;
            const buffer  = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            for (let i = 0; i < bufSize; i++) buffer.getChannelData(0)[i] = Math.random() * 2 - 1;
            const noise  = this.ctx.createBufferSource(); noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass'; filter.frequency.value = 4000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            noise.connect(filter); filter.connect(gain); gain.connect(this.master);
            noise.start(t);
        }
    }

    manageDrone() {
        if (!this.droneOsc) {
            this.droneOsc    = this.ctx.createOscillator();
            this.droneOsc2   = this.ctx.createOscillator();
            this.droneGain   = this.ctx.createGain();
            this.droneFilter = this.ctx.createBiquadFilter();

            this.droneOsc.type  = 'sawtooth'; this.droneOsc.frequency.value  = 73.42; // D2
            this.droneOsc2.type = 'square';   this.droneOsc2.frequency.value = 74.00;

            this.droneFilter.type = 'lowpass';
            this.droneGain.gain.value = 0;

            this.droneOsc.connect(this.droneFilter);
            this.droneOsc2.connect(this.droneFilter);
            this.droneFilter.connect(this.droneGain);
            this.droneGain.connect(this.master);

            this.droneOsc.start();
            this.droneOsc2.start();
        }

        const targetVol = this.mood > 0.4 ? (this.mood * 0.25) : 0.05;
        this.droneGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 2);
        this.droneFilter.frequency.linearRampToValueAtTime(
            100 + (this.mood * 400) + (this._macroA() * 2),
            this.ctx.currentTime + 2
        );
    }

    start() {
        if (this._started) return;
        this._started = true;

        this.manageDrone();

        this._interval = setInterval(() => {
            // 1. Mood engine
            if (this.step === 0) {
                this.mood += this.moodDirection;
                if (this.mood > 1.0 || this.mood < 0.0) {
                    this.moodDirection *= -1;
                    this.mood += this.moodDirection;
                }

                // Výběr motivu
                let baseMotif    = this.motifs[Math.floor(Math.random() * this.motifs.length)];
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

            // 2. Rytmus
            this.playRhythm();

            // 3. Melodie
            const note = this.currentPhrase[this.step];
            if (note) {
                if (this.mood < 0.4) {
                    if (Math.random() > 0.3) this.playLute(note);
                } else if (this.mood < 0.7) {
                    if (Math.random() > 0.5) this.playChant(note);
                    else this.playPsalterium(note);
                    if (Math.random() < 0.15) this.playLute(note);
                } else {
                    if (Math.random() > 0.4) this.playCreepyChoir(note);
                    if (Math.random() < 0.2)  this.playPsalterium(note);
                }
            }

            this.step = (this.step + 1) % 6;

        }, 320 - (this._macroB() * 120));
    }

    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        this._started = false;
        if (this.droneOsc)  { this.droneOsc.stop();  this.droneOsc  = null; }
        if (this.droneOsc2) { this.droneOsc2.stop(); this.droneOsc2 = null; }
        this.droneGain   = null;
        this.droneFilter = null;
    }
}