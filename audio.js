/**
 * Audio System for Rubik's Cube
 * Uses Web Audio API to generate sounds for moves and events
 */

class AudioSystem {
    constructor() {
        this.enabled = true;
        this.context = null;
        this.masterGain = null;

        // Initialize on first user interaction
        this.initialized = false;
    }

    /**
     * Initialize the audio context (must be called from user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = 0.3;
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Play a move sound (click/snap)
     */
    playMoveSound() {
        if (!this.enabled || !this.initialized) return;

        this.init();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Quick click sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.05);

        gain.gain.setValueAtTime(0.5, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.08);
    }

    /**
     * Play scramble sound (rapid clicking)
     */
    playScrambleSound() {
        if (!this.enabled || !this.initialized) return;

        this.init();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Swoosh sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.3);
    }

    /**
     * Play solve celebration sound
     */
    playSolveSound() {
        if (!this.enabled || !this.initialized) return;

        this.init();

        // Play a victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = this.context.currentTime + i * 0.15;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });

        // Add a final chord
        setTimeout(() => {
            this.playChord([523.25, 659.25, 783.99, 1046.50], 0.8);
        }, 600);
    }

    /**
     * Play a chord
     */
    playChord(frequencies, duration) {
        if (!this.enabled || !this.initialized) return;

        frequencies.forEach(freq => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + duration);
        });
    }

    /**
     * Play error sound
     */
    playErrorSound() {
        if (!this.enabled || !this.initialized) return;

        this.init();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.2);

        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.3);
    }

    /**
     * Play step sound (subtle click for solution steps)
     */
    playStepSound() {
        if (!this.enabled || !this.initialized) return;

        this.init();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle';
        osc.frequency.value = 600;

        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.05);
    }
}

// Export for use in other modules
window.AudioSystem = AudioSystem;
