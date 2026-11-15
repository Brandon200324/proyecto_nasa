/* ============================================================
   ECHOES OF SOL · components/echo-audio.js
   Toggle de sonido (Priscila) — crea el AudioContext en el click
   ============================================================ */
import { soundscape } from '../audio/soundscape.js';

class EchoAudio extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button type="button" class="audio-toggle" aria-pressed="false"
              aria-label="Activar audio inmersivo" title="Audio inmersivo">🔇</button>
    `;
    this._btn = this.querySelector('.audio-toggle');
    const renderState = (on) => {
      this._btn.classList.toggle('on', on);
      this._btn.setAttribute('aria-pressed', String(on));
      this._btn.textContent = on ? '🔊' : '🔇';
      this._btn.setAttribute('aria-label', on ? 'Silenciar audio inmersivo' : 'Activar audio inmersivo');
    };
    this._btn.addEventListener('click', () => {
      const on = soundscape.toggle();
      renderState(on);
    });
    document.addEventListener('echo:audio-state', (event) => {
      renderState(Boolean(event.detail?.enabled));
    });
  }
}

customElements.define('echo-audio', EchoAudio);
