/* ============================================================
   ECHOES OF SOL · components/echo-audio.js
   Toggle de sonido (Priscila) — crea el AudioContext en el click
   ============================================================ */
import { t } from '../i18n.js';
import { soundscape } from '../audio/soundscape.js';

class EchoAudio extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button type="button" class="audio-toggle" aria-pressed="false"
              aria-label="${t('audio.enable')}" title="${t('audio.title')}">🔇</button>
    `;
    this._btn = this.querySelector('.audio-toggle');
    const renderState = (on) => {
      this._btn.classList.toggle('on', on);
      this._btn.setAttribute('aria-pressed', String(on));
      this._btn.textContent = on ? '🔊' : '🔇';
      this._btn.setAttribute('aria-label', t(on ? 'audio.mute' : 'audio.enable'));
      this._btn.setAttribute('title', t(on ? 'audio.mute' : 'audio.title'));
    };
    this._btn.addEventListener('click', () => {
      const on = soundscape.toggle();
      renderState(on);
    });
    this._onAudio = (event) => renderState(Boolean(event.detail?.enabled));
    this._onLanguage = () => renderState(soundscape.enabled);
    document.addEventListener('echo:audio-state', this._onAudio);
    document.addEventListener('echo:lang-changed', this._onLanguage);
    renderState(soundscape.enabled);
  }
  disconnectedCallback() {
    document.removeEventListener('echo:audio-state', this._onAudio);
    document.removeEventListener('echo:lang-changed', this._onLanguage);
  }
}

customElements.define('echo-audio', EchoAudio);
