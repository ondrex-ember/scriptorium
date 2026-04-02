const CONFIG = {
    CANDLE_DURATION: 24 * 60 * 60 * 1000,
    GROWTH_SPEED: 2.0,
    BASE_GROWTH_TIME: 20 * 60 * 1000,
    DARKNESS_START: 18,
    DARKNESS_END: 5
};

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
        this.volume = GameState.settings.volume;
        
        // Storage pro audio smyčky
        this.loops = {};
        
        // Backwards compatibility
        this.ctx = this.audioContext;
        this.fireGain = null;
    }
    
    start() {
        if (this.isPlaying) return;
        
        // Resume pro prohlížeče
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Pokud je krb rozžehnutý, spustit zvuk
        if (GameState.flags.fireplaceLit && !this.fireGain) {
            this.startFireLoop(true);
        }
    }
    
    setVolume(val) {
        GameState.settings.volume = val / 100;
        this.volume = GameState.settings.volume;
        this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.1);
        Game.save();
    }
    
    startFireLoop(instant) {
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
            if (this.loops.rumble) { this.loops.rumble.stop(); this.loops.rumble = null; }
            if (this.loops.hiss) { this.loops.hiss.stop(); this.loops.hiss = null; }
        }, 600);
        
        // Vyčištění intervalu
        if (this.crackleInterval) {
            clearInterval(this.crackleInterval);
            this.crackleInterval = null;
        }
        
        this.fireGain = null;
    }
    
    // --- INTERNÍ METODY ---
    
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
}


// ================================================
// SCRIPTORIUM - LIBRARY SYSTEM MODULE v1.0
// ================================================
// Tento modul přidává knihovnu, lore text pro tech tree,
// Easter eggs a NPC Písaře bez změny existující mechaniky.
// ================================================

// ================================================
// FONT SPECIMENS DATABASE
// Ukázky historických písem pro knihy a tech tree
// ================================================
