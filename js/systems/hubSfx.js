const hubSfx = {
    ctx: null,
    gainNode: null,
    bgm: null,
    bgmNode: null,

    init: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Volume mestre para os efeitos sonoros (bips, clicks)
        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.ctx.destination);
        this.gainNode.gain.value = 0.08; 

        this.setupInteractions();
    },

    playMusic: function() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        if (!this.bgm) {
            // ATENÇÃO: Caminho atualizado
            this.bgm = new Audio('assets/audio/hubtrack01.mp3');
            this.bgm.loop = true;
            this.bgm.crossOrigin = "anonymous"; 

            this.bgmNode = this.ctx.createMediaElementSource(this.bgm);
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass'; 
            filter.frequency.value = 400; 

            const musicGain = this.ctx.createGain();
            musicGain.gain.value = 0.05; 

            this.bgmNode.connect(filter);
            filter.connect(musicGain);
            musicGain.connect(this.ctx.destination);
        }

        this.bgm.currentTime = 0;
        this.bgm.play().catch(e => {});
    },

    stopMusic: function() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
    },

    playTone: function(freq, type, duration, slideTo = null, vol = 1.0) {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }

        const masterVol = this.gainNode.gain.value;
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(masterVol * vol, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration + 0.1);
    },

    playNoise: function(duration, filterFreq = 1000) {
        if (!this.ctx) this.init();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const gain = this.ctx.createGain();
        const masterVol = this.gainNode.gain.value;
        
        gain.gain.setValueAtTime(masterVol * 0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = filterFreq;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start();
    },

    hover: function() {
        this.playNoise(0.03, 3000);
        this.playTone(2000, 'triangle', 0.02, null, 0.3);
    },

    click: function() {
        this.playTone(150, 'square', 0.1, 50, 1.2);
        this.playNoise(0.08, 500);
    },

    back: function() {
        this.playTone(200, 'sine', 0.15, 10, 0.8);
        this.playNoise(0.1, 200);
    },

    buySuccess: function() {
        const now = this.ctx.currentTime;
        const speed = 0.04;
        
        this.playToneSchedule(349.23, 'triangle', now, 0.3);
        this.playToneSchedule(440.00, 'triangle', now + speed, 0.3);
        this.playToneSchedule(523.25, 'triangle', now + speed*2, 0.3);
        this.playToneSchedule(659.25, 'square',   now + speed*3, 0.4); 
        this.playToneSchedule(783.99, 'sine',     now + speed*4, 0.6); 
    },

    buyFail: function() {
        this.playTone(100, 'sawtooth', 0.15, 50, 0.8);
        this.playTone(105, 'sawtooth', 0.15, 55, 0.8); 
    },

    playToneSchedule: function(freq, type, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const masterVol = this.gainNode.gain.value;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(masterVol * 0.8, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(time);
        osc.stop(time + duration + 0.1);
    },

    setupInteractions: function() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('#hub-screen button, .hub-card, .lore-entry')) {
                this.hover();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.matches('.hub-nav button')) {
                this.click();
            }
            if (e.target.matches('.btn-back-hub')) {
                this.back();
            }
        });
    }
};

window.addEventListener('load', () => hubSfx.init());