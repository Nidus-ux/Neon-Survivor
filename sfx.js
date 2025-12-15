const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let masterGain;

const TRACKS = [
    "https://files.catbox.moe/qzmnih.mp3",
    "https://files.catbox.moe/d3vit9.mp3",
    "https://files.catbox.moe/pip6g7.mp3",
    "https://files.catbox.moe/hwvj7d.mp3" 
];

const BGM_VOL = 0.2;
const FADE_TIME_S = 2.0;

const COOLDOWNS = { shoot: 80, hit: 100, explosion: 150, collect: 50, bossShoot: 120, bossGlitch: 60 };
let lastPlayed = { shoot: 0, hit: 0, explosion: 0, collect: 0, bossShoot: 0, bossGlitch: 0 };

const musicLibrary = {};
let currentTrackId = -1;
let hasUnlockedAudio = false;

const sfx = {
    init: () => {
        if (audioCtx) return;
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);

        TRACKS.forEach((src, index) => {
            const audio = new Audio(src);
            audio.loop = true;
            audio.volume = 0;
            musicLibrary[index] = audio;
        });
    },

    unlockAudio: () => {
        if (hasUnlockedAudio) return;
        sfx.init();

        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        Object.values(musicLibrary).forEach(audio => audio.play().catch(e => {}));
        
        hasUnlockedAudio = true;
        sfx.playTrack(0);
    },

    playTrack: (id, transitionType = 'fade') => {
        if (!hasUnlockedAudio || !musicLibrary[id] || currentTrackId === id) return;

        const oldTrackId = currentTrackId;
        currentTrackId = id;
        
        const oldTrack = musicLibrary[oldTrackId];
        const newTrack = musicLibrary[id];
        
        if (oldTrack && oldTrack.fadeInterval) clearInterval(oldTrack.fadeInterval);
        if (newTrack && newTrack.fadeInterval) clearInterval(newTrack.fadeInterval);
        
        if (transitionType === 'cut') {
            if (oldTrack) {
                oldTrack.volume = 0;
            }
            newTrack.volume = BGM_VOL;
        } else {
            if (oldTrack) {
                fadeVolume(oldTrack, 0, FADE_TIME_S);
            }
            fadeVolume(newTrack, BGM_VOL, FADE_TIME_S);
        }
    },
    
    cutToSilence: () => {
        if (!hasUnlockedAudio || currentTrackId === -1) return;
        const oldTrack = musicLibrary[currentTrackId];
        if (oldTrack) {
            if (oldTrack.fadeInterval) clearInterval(oldTrack.fadeInterval);
            oldTrack.volume = 0;
        }
        currentTrackId = -1;
    },

    stopMusic: () => {
        Object.values(musicLibrary).forEach(audio => {
            fadeVolume(audio, 0, 1.0);
        });
        currentTrackId = -1;
    },
    
    shoot: () => {
        if (!checkCooldown('shoot')) return;
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain(), f = audioCtx.createBiquadFilter();
        const pMod = 1 + (Math.random() * 0.15 - 0.075);
        osc.type = 'square';
        osc.frequency.setValueAtTime(600 * pMod, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
        f.type = 'highpass';
        f.frequency.setValueAtTime(1200, t);
        f.frequency.linearRampToValueAtTime(100, t + 0.08);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(f); f.connect(g); g.connect(masterGain);
        osc.start(t); osc.stop(t + 0.15);
    },

    explosion: () => {
        if (!checkCooldown('explosion')) return;
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g1 = audioCtx.createGain();
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.3);
        g1.gain.setValueAtTime(0.4, t);
        g1.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(g1); g1.connect(masterGain);
        osc.start(t); osc.stop(t + 0.4);
        const bs = audioCtx.sampleRate * 0.2;
        const buf = audioCtx.createBuffer(1, bs, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for(let i = 0; i < bs; i++) d[i] = Math.random() * 2 - 1;
        const n = audioCtx.createBufferSource(), f = audioCtx.createBiquadFilter(), g2 = audioCtx.createGain();
        n.buffer = buf;
        f.type = 'lowpass';
        f.frequency.setValueAtTime(900, t);
        f.frequency.linearRampToValueAtTime(100, t + 0.2);
        g2.gain.setValueAtTime(0.25, t);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        n.connect(f); f.connect(g2); g2.connect(masterGain);
        n.start(t);
    },

    hit: () => {
        if (!checkCooldown('hit')) return;
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.08);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(g); g.connect(masterGain);
        osc.start(t); osc.stop(t + 0.15);
    },

    collect: () => {
        if (!checkCooldown('collect')) return;
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'sine';
        const p = Math.random() > 0.5 ? 1500 : 2000;
        osc.frequency.setValueAtTime(p, t);
        osc.frequency.linearRampToValueAtTime(p + 500, t + 0.05);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.connect(g); g.connect(masterGain);
        osc.start(t); osc.stop(t + 0.1);
    },

    levelUp: () => {
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((f, i) => {
            const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t + i * 0.06);
            g.gain.setValueAtTime(0, t + i * 0.06);
            g.gain.linearRampToValueAtTime(0.15, t + i * 0.06 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.06 + 0.4);
            osc.connect(g); g.connect(masterGain);
            osc.start(t + i * 0.06);
            osc.stop(t + i * 0.06 + 0.5);
        });
        return () => {};
    },
    
    bossCharging: (duration) => {
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain(), f = audioCtx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.linearRampToValueAtTime(1000, t + duration);
        f.type = 'lowpass';
        f.frequency.setValueAtTime(200, t);
        f.frequency.linearRampToValueAtTime(8000, t + duration);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.25, t + 0.2);
        g.gain.linearRampToValueAtTime(0, t + duration);
        osc.connect(f);
        f.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + duration);
    },

    bossDisintegrate: (duration) => {
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + duration);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + duration);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + duration);

        for(let i=0; i < duration * 10; i++) {
            const startTime = t + Math.random() * duration * 0.9;
            const bs = audioCtx.sampleRate * 0.05;
            const buf = audioCtx.createBuffer(1, bs, audioCtx.sampleRate);
            const d = buf.getChannelData(0);
            for(let j = 0; j < bs; j++) d[j] = Math.random() * 2 - 1;
            const n = audioCtx.createBufferSource(), ng = audioCtx.createGain();
            n.buffer = buf;
            ng.gain.setValueAtTime(0.2, startTime);
            ng.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
            n.connect(ng);
            ng.connect(masterGain);
            n.start(startTime);
        }
    },

    bossShoot: () => {
        if (!checkCooldown('bossShoot')) return;
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t); 
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(g); g.connect(masterGain);
        osc.start(t); osc.stop(t + 0.25);
    },

    bossSpecial: () => {
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(800, t + 0.5); 
        g.gain.setValueAtTime(0.2, t);
        g.gain.linearRampToValueAtTime(0, t + 0.6);
        osc.connect(g); g.connect(masterGain);
        osc.start(t); osc.stop(t + 0.6);
        setTimeout(() => {
            if(!audioCtx) return;
            const t2 = audioCtx.currentTime;
            const osc2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(100, t2);
            osc2.frequency.exponentialRampToValueAtTime(10, t2 + 0.5);
            g2.gain.setValueAtTime(0.3, t2);
            g2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.5);
            osc2.connect(g2); g2.connect(masterGain);
            osc2.start(t2); osc2.stop(t2 + 0.6);
        }, 500);
    },

    bossSpawn: () => {
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 1.5);
        g.gain.setValueAtTime(0.8, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 2.0);
        osc.connect(g); g.connect(masterGain);
        osc.start(t); osc.stop(t + 2.0);
        const bs = audioCtx.sampleRate * 1.0;
        const buf = audioCtx.createBuffer(1, bs, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for(let i=0; i<bs; i++) d[i] = Math.random() * 2 - 1;
        const n = audioCtx.createBufferSource(), g2 = audioCtx.createGain();
        n.buffer = buf;
        g2.gain.setValueAtTime(0.4, t);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
        n.connect(g2); g2.connect(masterGain);
        n.start(t);
    },

    textGlitch: () => {
        if (!checkCooldown('bossGlitch')) return;
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000 + Math.random()*2000, t);
        g.gain.setValueAtTime(0.03, t); 
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(g); g.connect(masterGain);
        osc.start(t); osc.stop(t + 0.06);
    },

    bossIntro: () => {
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 2);
        g.gain.setValueAtTime(0.3, t);
        g.gain.linearRampToValueAtTime(0, t + 2);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 2.5);
    },

    gameOver: () => {
        sfx.stopMusic();
        if (!audioCtx) sfx.init();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 2);
        g.gain.setValueAtTime(0.3, t);
        g.gain.linearRampToValueAtTime(0, t + 2);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 2.5);
    }
};

function checkCooldown(type) {
    const now = Date.now();
    if (now - lastPlayed[type] < COOLDOWNS[type]) return false;
    lastPlayed[type] = now;
    return true;
}

function fadeVolume(audioObj, targetVolume, duration) {
    const startVolume = audioObj.volume;
    const difference = targetVolume - startVolume;
    const stepTime = 50;
    const steps = duration * 1000 / stepTime;
    const volumeStep = difference / steps;

    if (audioObj.fadeInterval) {
        clearInterval(audioObj.fadeInterval);
    }
    
    if (steps <= 0) {
        audioObj.volume = targetVolume;
        return;
    }

    audioObj.fadeInterval = setInterval(() => {
        const newVolume = audioObj.volume + volumeStep;
        if ((volumeStep > 0 && newVolume >= targetVolume) || (volumeStep < 0 && newVolume <= targetVolume)) {
            audioObj.volume = targetVolume;
            clearInterval(audioObj.fadeInterval);
        } else {
            audioObj.volume = newVolume;
        }
    }, stepTime);
}