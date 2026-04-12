/**
 * Web Audio API sound effects generator.
 */
const Sound = (() => {
    let audioCtx = null;
    let masterGain = null;
    let muted = false;

    function init() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.3;
            masterGain.connect(audioCtx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    function resume() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function setMuted(val) {
        muted = val;
        if (masterGain) {
            masterGain.gain.value = muted ? 0 : 0.3;
        }
    }

    function isMuted() {
        return muted;
    }

    function playTone(freq, duration, type, volume, ramp) {
        if (!audioCtx || muted) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (ramp) {
            osc.frequency.linearRampToValueAtTime(ramp, audioCtx.currentTime + duration);
        }
        gain.gain.setValueAtTime(volume || 0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration);
    }

    function playNoise(duration, volume) {
        if (!audioCtx || muted) return;
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(volume || 0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        source.start();
    }

    function merge() {
        // Rising happy chime
        playTone(523, 0.15, 'sine', 0.4);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.35), 60);
        setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 120);
        setTimeout(() => playTone(1047, 0.3, 'triangle', 0.25), 180);
        playNoise(0.1, 0.05);
    }

    function summon() {
        // Sparkle appear sound
        playTone(880, 0.08, 'sine', 0.2);
        setTimeout(() => playTone(1100, 0.08, 'sine', 0.2), 50);
        setTimeout(() => playTone(1320, 0.15, 'sine', 0.25), 100);
        playNoise(0.08, 0.03);
    }

    function coin() {
        // Quick coin clink
        playTone(1200, 0.06, 'square', 0.08);
        setTimeout(() => playTone(1600, 0.08, 'square', 0.06), 30);
    }

    function milestone() {
        // Triumphant fanfare
        playTone(523, 0.2, 'triangle', 0.3);
        setTimeout(() => playTone(659, 0.2, 'triangle', 0.3), 150);
        setTimeout(() => playTone(784, 0.2, 'triangle', 0.3), 300);
        setTimeout(() => playTone(1047, 0.4, 'triangle', 0.35), 450);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 650);
        setTimeout(() => playTone(1047, 0.5, 'sine', 0.3), 750);
        setTimeout(() => playNoise(0.2, 0.08), 450);
    }

    function gameOver() {
        // Descending sad tones
        playTone(440, 0.3, 'sine', 0.3, 220);
        setTimeout(() => playTone(330, 0.3, 'sine', 0.25, 165), 200);
        setTimeout(() => playTone(262, 0.5, 'sine', 0.2, 131), 400);
        setTimeout(() => playNoise(0.3, 0.06), 300);
    }

    function newRecord() {
        // Exciting arpeggio
        const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.2, 'triangle', 0.25), i * 80);
        });
        setTimeout(() => playNoise(0.15, 0.06), 300);
    }

    function buttonTap() {
        playTone(600, 0.06, 'sine', 0.15);
    }

    function pickup() {
        playTone(400, 0.05, 'sine', 0.1);
    }

    function drop() {
        playTone(300, 0.08, 'sine', 0.1);
    }

    return {
        init,
        resume,
        setMuted,
        isMuted,
        merge,
        summon,
        coin,
        milestone,
        gameOver,
        newRecord,
        buttonTap,
        pickup,
        drop,
    };
})();
