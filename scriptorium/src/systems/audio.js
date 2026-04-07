// ═══════════════════════════════════════════════════════════════
// AUDIO SYSTEM — Procedural fire sound & ambience
// ═══════════════════════════════════════════════════════════════
// Version: 1.0
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
        
        this.isPlaying = false;
        this.crackleInterval = null;
        
        // Volume z GameState
        this.volume = (typeof GameState !== 'undefined' && GameState.settings) 
                      ? GameState.settings.volume 
                      : 0.17;
        
        // Storage pro audio smyčky
        this.loops = {};
        
        // Backwards compatibility
        this.ctx = this.audioContext;
        this.fireGain = null;
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
    
    startFireLoop(instant = false) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.fireGain = this.masterGain; // Backwards compatibility
        
        // Fade in
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
        
        // Fade out
        this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.masterGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5);
        
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
    // FIRE SOUND SYNTHESIS (Internal)
    // ═══════════════════════════════════════════════════════════
    
    scheduleRandomEvents() {
        this.crackleInterval = setInterval(() => {
            if (!this.isPlaying) return;
            const now = this.audioContext.currentTime;
            
            // 1. Praskání (časté)
            if (Math.random() > 0.9) {
                const type = Math.random() > 0.7 ? 'deep' : 'sharp';
                this.playCrackle(type, now + Math.random() * 0.5);
            }
            
            // 2. Pískání dřeva (vzácné)
            if (Math.random() < 0.01) {
                this.playWhistle(now);
            }
        }, 500);
    }
    
    playCrackle(type, time) {
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Envelope
        const decay = type === 'sharp' ? 10 : 5;
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufferSize) * decay);
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        
        if (type === 'sharp') {
            filter.frequency.value = 1300 + Math.random() * 1000;
            filter.Q.value = 1;
        } else {
            filter.frequency.value = 150 + Math.random() * 500;
            filter.Q.value = 2;
        }
        
        const gain = this.audioContext.createGain();
        gain.gain.value = (type === 'sharp' ? 0.3 : 0.5) + Math.random() * 0.3;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time);
    }
    
    playWhistle(time) {
        const duration = 0.5 + Math.random() * 0.8;
        
        // Generování šumu (páry)
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        // Filter - dusivý charakter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, time);
        filter.frequency.linearRampToValueAtTime(800, time + duration);
        filter.Q.value = 0.7;
        
        // Hlasitost - rychlý nástup, plynulý konec
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.02, time + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time);
    }
    
    startRumble() {
        // Generátor hlubokého hukotu
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
        filter.frequency.value = 180;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.3;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
        this.loops.rumble = noise;
    }
    
    startHiss() {
        // Generátor syčení
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
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.08;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
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