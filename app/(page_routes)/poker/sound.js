/** Lightweight synthesized poker sounds; no audio assets or network requests. */
const STORAGE_KEY = 'poker:sound-enabled';

class PokerSoundManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = this._readPreference();
    this.button = null;
    this.lastConnection = null;
  }

  _readPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  async unlock() {
    if (!this.enabled) return false;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    if (!this.context) {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context.state === 'running';
  }

  initButton(buttonId) {
    this.button = document.getElementById(buttonId);
    this._renderButton();
    this.button?.addEventListener('click', async () => {
      this.enabled = !this.enabled;
      try { localStorage.setItem(STORAGE_KEY, String(this.enabled)); } catch {}
      this._renderButton();
      if (this.enabled) {
        await this.unlock();
        this.play('check');
      }
    });

    const unlockOnce = () => { void this.unlock(); };
    document.addEventListener('pointerdown', unlockOnce, { once: true, capture: true });
    document.addEventListener('keydown', unlockOnce, { once: true, capture: true });
  }

  _renderButton() {
    if (!this.button) return;
    this.button.textContent = this.enabled ? '🔊' : '🔇';
    this.button.setAttribute('aria-pressed', String(!this.enabled));
    this.button.setAttribute('aria-label', this.enabled ? 'Mute poker sounds' : 'Enable poker sounds');
    this.button.title = this.enabled ? 'Mute sounds' : 'Enable sounds';
  }

  _tone(frequency, duration, options = {}) {
    if (!this.context || !this.master || !this.enabled) return;
    const start = this.context.currentTime + (options.delay || 0);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = options.type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (options.to) oscillator.frequency.exponentialRampToValueAtTime(options.to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(options.volume || 0.18, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  _noise(duration, volume = 0.08, delay = 0) {
    if (!this.context || !this.master || !this.enabled) return;
    const sampleCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const start = this.context.currentTime + delay;
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
  }

  play(name) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    if (name === 'deal' || name === 'card') {
      this._noise(0.07, 0.11);
      if (name === 'deal') this._noise(0.07, 0.1, 0.09);
    } else if (name === 'chips' || name === 'call' || name === 'raise') {
      this._tone(1180, 0.08, { type: 'triangle', volume: 0.13 });
      this._tone(1540, 0.09, { type: 'triangle', volume: 0.1, delay: 0.06 });
    } else if (name === 'check') {
      this._tone(320, 0.08, { type: 'square', volume: 0.07, to: 250 });
    } else if (name === 'fold') {
      this._noise(0.16, 0.08);
      this._tone(210, 0.16, { volume: 0.06, to: 130 });
    } else if (name === 'allin') {
      [220, 330, 440, 660].forEach((frequency, index) =>
        this._tone(frequency, 0.2, { type: 'sawtooth', volume: 0.08, delay: index * 0.075 }));
    } else if (name === 'turn') {
      this._tone(880, 0.18, { type: 'sine', volume: 0.12 });
      this._tone(1320, 0.2, { type: 'sine', volume: 0.08, delay: 0.11 });
    } else if (name === 'win') {
      [523, 659, 784, 1047].forEach((frequency, index) =>
        this._tone(frequency, 0.34, { type: 'triangle', volume: 0.11, delay: index * 0.11 }));
    } else if (name === 'lose') {
      this._tone(294, 0.3, { type: 'triangle', volume: 0.1, to: 196 });
      this._tone(196, 0.38, { type: 'sine', volume: 0.08, delay: 0.22, to: 130 });
    } else if (name === 'connected') {
      this._tone(660, 0.1, { volume: 0.07 });
      this._tone(880, 0.12, { volume: 0.06, delay: 0.08 });
    } else if (name === 'timer') {
      this._tone(880, 0.055, { type: 'square', volume: 0.055 });
    } else if (name === 'timer-end') {
      this._tone(220, 0.18, { type: 'sawtooth', volume: 0.08, to: 140 });
    }
  }

  handleState(previous, next) {
    if (!previous || !next) return;
    if (next.handNumber > previous.handNumber) this.play('deal');
    else if ((next.community?.length || 0) > (previous.community?.length || 0)) this.play('card');

    if ((next.lastCompletedHand || 0) > (previous.lastCompletedHand || 0)) {
      const heroWon = next.lastWinners?.some((winner) => winner.seat === next.heroSeat);
      this.play(heroWon ? 'win' : 'lose');
    } else if (next.heroSeat >= 0 && next.actionSeat === next.heroSeat && previous.actionSeat !== next.heroSeat) {
      this.play('turn');
    }
  }

  handleConnection(status) {
    if (status === 'connected' && this.lastConnection === 'reconnecting') this.play('connected');
    this.lastConnection = status;
  }
}

window.PokerSound = new PokerSoundManager();
export {};
