
import { Category } from '../types';

type SFXType = 'hover' | 'click' | 'activate' | 'close';

export class LyriaSimulator {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private isInitialized = false;
  private processingSource: AudioBufferSourceNode | null = null;
  private processingFilter: BiquadFilterNode | null = null;

  constructor() {}

  private init() {
    if (this.isInitialized) return;

    try {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContextClass();

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.ctx.destination);
        this.sfxGain.gain.value = 0.3; // Default SFX Volume

        this.isInitialized = true;
    } catch (e) {
        console.error("Lyria Audio Engine Failed:", e);
    }
  }

  // --- CONTEXT-AWARE SOUND EFFECTS ---

  public playSFX(type: SFXType, category?: string) {
    // If not initialized, try to init (might fail if no interaction, but okay)
    if (!this.isInitialized) this.init();
    
    if (!this.ctx || !this.sfxGain || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Base Frequency Mapping based on Category
    let baseFreq = 800;
    let waveType: OscillatorType = 'sine';

    if (category) {
        switch (category) {
            case Category.GEMINI: baseFreq = 1200; waveType = 'sine'; break;
            case Category.COMMAND: baseFreq = 400; waveType = 'square'; break;
            case Category.VIDEO: baseFreq = 600; waveType = 'sawtooth'; break;
            case Category.AUDIO: baseFreq = 500; waveType = 'triangle'; break;
            case Category.OPENAI: baseFreq = 1000; waveType = 'triangle'; break;
            case Category.CLAUDE: baseFreq = 900; waveType = 'sine'; break;
            case Category.OPENSOURCE: baseFreq = 300; waveType = 'square'; break;
            default: baseFreq = 800;
        }
    }

    switch (type) {
        case 'hover':
            // Short, pitched blip based on category
            osc.type = waveType;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.05);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            break;

        case 'click':
            // Thud + High Click
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;

        case 'activate':
            // Sci-fi Swoosh up
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(1500, now + 0.4);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
            break;

        case 'close':
             // Sci-fi Swoosh down
             osc.type = 'sine';
             osc.frequency.setValueAtTime(800, now);
             osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
             gain.gain.setValueAtTime(0.1, now);
             gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
             osc.start(now);
             osc.stop(now + 0.2);
             break;
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    // Cleanup
    setTimeout(() => { osc.disconnect(); gain.disconnect(); }, 500);
  }

  public startProcessingLoop() {
      if (!this.ctx || !this.sfxGain || this.processingSource) return;
      
      const bufferSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; 
      }

      this.processingSource = this.ctx.createBufferSource();
      this.processingSource.buffer = buffer;
      this.processingSource.loop = true;

      this.processingFilter = this.ctx.createBiquadFilter();
      this.processingFilter.type = 'bandpass';
      this.processingFilter.frequency.value = 400;
      this.processingFilter.Q.value = 2;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.05;

      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 6; 
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 300;

      lfo.connect(lfoGain);
      lfoGain.connect(this.processingFilter.frequency);
      lfo.start();

      this.processingSource.connect(this.processingFilter);
      this.processingFilter.connect(gain);
      gain.connect(this.sfxGain);
      
      this.processingSource.start();
  }

  public stopProcessingLoop() {
      if (this.processingSource) {
          try {
            this.processingSource.stop();
          } catch(e) {} 
          this.processingSource.disconnect();
          this.processingSource = null;
      }
  }

  public async enableAudio() {
    if (!this.isInitialized) this.init();
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  public mute(isMuted: boolean) {
    if (this.sfxGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.sfxGain.gain.cancelScheduledValues(now);
        this.sfxGain.gain.linearRampToValueAtTime(isMuted ? 0 : 0.3, now + 0.1);
    }
  }
}

let lastOut = 0;
export const ambientEngine = new LyriaSimulator();
