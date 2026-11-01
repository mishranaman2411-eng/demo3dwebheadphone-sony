// Atmospheric Web Audio synthesizer for background ambient sound
class AmbientAudioController {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private gainNode: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  public toggle(): boolean {
    this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  private start() {
    if (!this.ctx) return;
    this.stop();

    const now = this.ctx.currentTime;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(0.04, now + 2); // Soft subtle volume

    // Low pass filter for warm sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    // Warm chords: Root (A2 110Hz), 5th (E3 164.81Hz), 9th (B3 246.94Hz)
    const frequencies = [110, 164.81, 220, 246.94];
    this.oscillators = frequencies.map((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, now); // slight chorus detuning
      osc.connect(filter);
      osc.start(now);
      return osc;
    });

    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    this.isPlaying = true;
  }

  private stop() {
    if (this.gainNode && this.ctx) {
      const now = this.ctx.currentTime;
      this.gainNode.gain.linearRampToValueAtTime(0.0001, now + 1.2);
      setTimeout(() => {
        this.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // Ignore if already stopped
          }
        });
        this.oscillators = [];
        this.gainNode?.disconnect();
        this.gainNode = null;
      }, 1300);
    }
    this.isPlaying = false;
  }

  public getState(): boolean {
    return this.isPlaying;
  }
}

export const ambientAudio = new AmbientAudioController();
