/* Math Treasure Quest - Procedural Synthesizer (Web Audio API) */

class AudioController {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        this.initialized = false;
        
        // Synth settings
        this.musicPlaying = false;
        this.ambientOscillators = [];
        this.ambientInterval = null;
    }

    init() {
        if (this.initialized) return;
        
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            
            // Nodes setup
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.6, this.ctx.currentTime); // Overall volume
            
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // Music volume
            
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime); // Sound effects volume
            
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);
            
            this.initialized = true;
            console.log("Audio Engine initialized successfully.");
            
            // Start background pad
            this.startAmbientPad();
        } catch (e) {
            console.warn("Web Audio API not supported or blocked: ", e);
        }
    }

    resume() {
        if (!this.initialized) {
            this.init();
        } else if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Play standard SFX notes
    playTone(frequency, type, duration, gainStart, slideTo = null, delay = 0) {
        if (!this.initialized || !this.ctx) return;
        if (this.ctx.state === 'suspended') return;

        const time = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, time);
        
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, time + duration);
        }

        gainNode.gain.setValueAtTime(0.0001, time);
        gainNode.gain.linearRampToValueAtTime(gainStart, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    // Jump sound (quick ascending pulse sweep)
    playJump() {
        this.resume();
        this.playTone(150, 'triangle', 0.25, 0.5, 450);
    }

    // Teleport/Respawn sound
    playRespawn() {
        this.resume();
        this.playTone(600, 'sine', 0.6, 0.4, 80);
        // Play secondary detuned tone
        setTimeout(() => {
            this.playTone(590, 'triangle', 0.5, 0.25, 75);
        }, 50);
    }

    // Modern digital click/chirp when interacting with monoliths
    playInteract() {
        this.resume();
        this.playTone(880, 'sine', 0.08, 0.3, 1200);
        setTimeout(() => {
            this.playTone(1760, 'sine', 0.12, 0.2);
        }, 40);
    }

    // Correct Answer chime (arpeggio major chord)
    playCorrect() {
        this.resume();
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
            this.playTone(freq, 'sine', 0.4, 0.4, freq * 1.05, idx * 0.08);
        });
    }

    // Wrong Answer sound (low detuned sawtooth buzz)
    playWrong() {
        this.resume();
        this.playTone(130, 'sawtooth', 0.4, 0.5, 70);
        this.playTone(128, 'sawtooth', 0.4, 0.4, 69); // Detuned clone
    }

    // Lose Life (descending beep sequence)
    playLoseLife() {
        this.resume();
        const notes = [392.00, 311.13, 261.63, 196.00]; // G4, Eb4, C4, G3
        notes.forEach((freq, idx) => {
            this.playTone(freq, 'triangle', 0.25, 0.45, freq * 0.9, idx * 0.12);
        });
    }

    // Game Over (sad minor chord pad sweep)
    playGameOver() {
        this.resume();
        const chord = [130.81, 155.56, 196.00, 233.08]; // C minor 7 (C3, Eb3, G3, Bb3)
        chord.forEach((freq) => {
            this.playTone(freq, 'sawtooth', 1.5, 0.4, freq * 0.95);
            this.playTone(freq * 1.002, 'triangle', 1.5, 0.2);
        });
    }

    // Key Collection (glittering chiming sequence)
    playKeyCollect() {
        this.resume();
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 to G6 arpeggio
        notes.forEach((freq, idx) => {
            this.playTone(freq, 'sine', 0.6, 0.35, freq * 1.02, idx * 0.06);
            // Sparkly layer
            setTimeout(() => {
                this.playTone(freq * 1.5, 'triangle', 0.3, 0.1, freq * 1.52);
            }, idx * 60 + 20);
        });
    }

    // Bridge Construction sounds
    playBridgeStep(index) {
        this.resume();
        const freq = 120 + (index * 8); // Pitch increases slightly per segment
        this.playTone(freq, 'triangle', 0.2, 0.4, freq - 20);
        setTimeout(() => {
            this.playTone(freq * 3, 'sine', 0.05, 0.15); // metallic tap
        }, 10);
    }

    // Victory Anthem
    playVictory() {
        this.resume();
        // Rich major chord blocks playing in sequence
        const chords = [
            [261.63, 329.63, 392.00], // C
            [349.23, 440.00, 523.25], // F
            [392.00, 493.88, 587.33], // G
            [523.25, 659.25, 783.99, 1046.5] // C major oct
        ];
        
        chords.forEach((chord, chordIdx) => {
            const delay = chordIdx * 0.35;
            const duration = chordIdx === 3 ? 1.5 : 0.4;
            chord.forEach((freq) => {
                this.playTone(freq, 'sine', duration, 0.35, null, delay);
                this.playTone(freq * 1.005, 'triangle', duration, 0.15, null, delay); // Thickener
            });
        });
    }

    // Procedural Ambient Background Music (Dreamy Chord progression pad)
    startAmbientPad() {
        if (this.musicPlaying || !this.initialized || !this.ctx) return;
        this.musicPlaying = true;
        
        const chords = [
            [130.81, 164.81, 196.00, 293.66], // C major 9 (C3, E3, G3, D4)
            [174.61, 220.00, 261.63, 392.00], // F major 9 (F3, A3, C4, G4)
            [146.83, 174.61, 220.00, 329.63], // D minor 7 (D3, F3, A3, E4)
            [196.00, 246.94, 293.66, 440.00]  // G major 9 (G3, B3, D4, A4)
        ];

        let chordIndex = 0;
        
        const playPadChord = () => {
            if (!this.musicPlaying) return;
            const currentChord = chords[chordIndex];
            const time = this.ctx.currentTime;
            const chordDuration = 9.0; // 9 seconds chord duration
            const fadeTime = 2.5;     // 2.5 seconds fade in/out
            
            // Clear reference array
            this.ambientOscillators = this.ambientOscillators.filter(o => {
                try {
                    o.stop();
                } catch(e) {}
                return false;
            });
            
            currentChord.forEach((freq) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                // Dreamy smooth triangle wave
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, time);
                
                // Subtly modulate pitch for chorus effect
                osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.8, time);
                
                // Volume envelope for padding: slow fade in, stay, slow fade out
                gain.gain.setValueAtTime(0.0001, time);
                gain.gain.linearRampToValueAtTime(0.12, time + fadeTime);
                gain.gain.setValueAtTime(0.12, time + chordDuration - fadeTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, time + chordDuration - 0.05);
                
                osc.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start(time);
                osc.stop(time + chordDuration);
                
                this.ambientOscillators.push(osc);
            });
            
            chordIndex = (chordIndex + 1) % chords.length;
        };

        // Trigger first chord
        playPadChord();
        
        // Loop every 8.5 seconds to overlap chords nicely
        this.ambientInterval = setInterval(playPadChord, 8500);
    }

    stopAmbientPad() {
        this.musicPlaying = false;
        if (this.ambientInterval) {
            clearInterval(this.ambientInterval);
            this.ambientInterval = null;
        }
        this.ambientOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch(e) {}
        });
        this.ambientOscillators = [];
    }
}

export const gameAudio = new AudioController();
export default gameAudio;
