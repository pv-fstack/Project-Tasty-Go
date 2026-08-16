// Enhanced Web Audio API Chime & Vibration Helper for TastyGo Standalone
class OrderNotifier {
    constructor() {
        this.audioCtx = null;
        this.unlocked = false;
        this.bindUnlock();
    }

    bindUnlock() {
        const unlockEvents = ['click', 'touchstart', 'keydown'];
        const unlockHandler = () => {
            this.initAudio();
            if (this.audioCtx && this.audioCtx.state === 'running') {
                this.unlocked = true;
                unlockEvents.forEach(evt => document.removeEventListener(evt, unlockHandler));
            }
        };
        unlockEvents.forEach(evt => document.addEventListener(evt, unlockHandler, { once: false }));
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playReadyChime() {
        try {
            this.initAudio();
            const now = this.audioCtx.currentTime;

            // Loud 3-tone bell chime (G5 -> C6 -> E6 ring)
            const notes = [
                { freq: 783.99, time: now, duration: 0.35, gain: 0.6 },        // G5
                { freq: 1046.50, time: now + 0.18, duration: 0.45, gain: 0.7 }, // C6
                { freq: 1318.51, time: now + 0.38, duration: 0.75, gain: 0.8 }  // E6
            ];

            notes.forEach(n => {
                const osc = this.audioCtx.createOscillator();
                const gainNode = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(n.freq, n.time);

                gainNode.gain.setValueAtTime(n.gain, n.time);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, n.time + n.duration);

                osc.connect(gainNode);
                gainNode.connect(this.audioCtx.destination);

                osc.start(n.time);
                osc.stop(n.time + n.duration);
            });
        } catch (e) {
            console.log("Audio chime playback error:", e);
        }

        // Phone Haptic Vibration
        if (navigator.vibrate) {
            navigator.vibrate([250, 100, 250, 100, 500]);
        }
    }

    playNewOrderSound() {
        try {
            this.initAudio();
            const now = this.audioCtx.currentTime;
            
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {
            console.log("New order sound error:", e);
        }
    }
}

window.notifier = new OrderNotifier();
