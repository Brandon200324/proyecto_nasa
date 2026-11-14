/* ============================================================
   ECHOES OF SOL · audio/soundscape.js
   Sonido 100% sintetizado con Web Audio API (Priscila)
   - Estática de radio (ruido blanco + filtros)
   - Pitidos Morse del callsign de cada equipo
   - Ambiente espacial en loop + chime de éxito
   ============================================================ */

const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

const DOT = 0.08;   // duración del punto (s)
const DASH = 0.24;  // duración de la raya (s)

class Soundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientNodes = null;
    this.enabled = false;
    this._noiseBuffer = null;
  }

  /** Crea el AudioContext (solo tras un gesto del usuario). */
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggle() {
    this.ensure();
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.startAmbient();
      this.beep(880, 0.09, 0.06); // confirmación de enlace
    } else {
      this.stopAmbient();
    }
    return this.enabled;
  }

  /** Buffer de ruido blanco reutilizable. */
  _getNoise() {
    if (this._noiseBuffer) return this._noiseBuffer;
    const len = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuffer = buffer;
    return buffer;
  }

  /** Ambiente: ruido espacial filtrado en loop muy sutil. */
  startAmbient() {
    if (!this.enabled || this.ambientNodes) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._getNoise();
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.04;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    this.ambientNodes = { src, gain };
  }

  stopAmbient() {
    if (!this.ambientNodes) return;
    try { this.ambientNodes.src.stop(); } catch (_) { /* ya detenido */ }
    this.ambientNodes = null;
  }

  /** Beep puro con envolvente. */
  beep(freq = 700, dur = 0.1, delay = 0, vol = 0.15) {
    if (!this.enabled) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** Estática radial (volumen sube al abrir/interactuar con un marcador). */
  staticBurst(dur = 1.2, vol = 0.12) {
    if (!this.enabled) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._getNoise();
    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 900;
    band.Q.value = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.08);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);
    src.connect(band).connect(gain).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.1);
  }

  /** Transmite el nombre del artefacto en Morse (ej. "SPIRIT"). */
  morse(text) {
    if (!this.enabled) return;
    let delay = 0;
    const letters = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const ch of letters) {
      const pattern = MORSE[ch];
      if (!pattern) continue;
      for (const symbol of pattern) {
        const dur = symbol === '-' ? DASH : DOT;
        this.beep(620, dur, delay, 0.12);
        delay += dur + DOT;
      }
      delay += DOT * 2; // separación entre letras
    }
  }

  /** Chime de éxito al restaurar una señal. */
  chime() {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => this.beep(f, 0.28, i * 0.12, 0.14));
  }

  /** Cue por tipo de artefacto (campo audio_cue del JSON). */
  playCue(audioCue, callsign) {
    if (!this.enabled) return;
    this.staticBurst(1.1, 0.1);
    this.morse(callsign || (audioCue === 'static_morse' ? 'ECHO' : 'SOL'));
  }
}

export const soundscape = new Soundscape();
