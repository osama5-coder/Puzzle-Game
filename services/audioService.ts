
class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: any = null;
  private musicGain: GainNode | null = null;
  private currentStep: number = 0;

  private init() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.ctx.destination);
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn("Audio Context failed to initialize", e);
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(muted ? 0 : 0.4, this.ctx.currentTime, 0.1);
    }
  }

  playJump() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playScore() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playCrash() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
  }

  startMusic() {
    this.init();
    if (this.musicInterval || !this.ctx || !this.musicGain) return;

    this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
    
    const tempo = 120;
    const stepTime = 60 / tempo / 2;

    const bassline = [82.41, 82.41, 82.41, 82.41, 65.41, 65.41, 65.41, 65.41, 73.42, 73.42, 73.42, 73.42, 61.74, 61.74, 61.74, 61.74];
    const lead = [164.81, 0, 196.00, 220.00, 130.81, 0, 164.81, 196.00, 146.83, 0, 174.61, 220.00, 123.47, 0, 146.83, 164.81];

    this.musicInterval = setInterval(() => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;
      
      const time = this.ctx.currentTime;
      
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassline[this.currentStep % bassline.length], time);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, time);
      filter.Q.setValueAtTime(5, time);

      bassGain.gain.setValueAtTime(0.15, time);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + stepTime * 0.9);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.musicGain);
      
      bassOsc.start(time);
      bassOsc.stop(time + stepTime * 0.9);

      if (this.currentStep % 2 === 0 && lead[this.currentStep % lead.length] > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(lead[this.currentStep % lead.length] * 2, time);
        
        leadGain.gain.setValueAtTime(0.08, time);
        leadGain.gain.exponentialRampToValueAtTime(0.001, time + stepTime * 1.5);
        
        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);
        
        leadOsc.start(time);
        leadOsc.stop(time + stepTime * 1.5);
      }

      this.currentStep++;
    }, stepTime * 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
  }
}

export const audioService = new AudioService();