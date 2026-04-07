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
    // FUTURE: Bell sound for Canonical Hours
    // ═══════════════════════════════════════════════════════════
    
    playBell(pitch = 440, duration = 2.0) {
        // TODO: Church bell synthesis
        // Komponenty: fundamental + overtones (harmonics)
        // Attack: sharp, Decay: long (5-10s), Release: slow fade
        
        const now = this.audioContext.currentTime;
        
        // Základní tón
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = pitch;
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + duration);
        
        // TODO: Add overtones (partials at: 2.0×, 3.0×, 4.2×, 5.4× fundamental)
        // TODO: Add slight beating (detune oscillators)
        // TODO: Add reverb tail
    }
}
