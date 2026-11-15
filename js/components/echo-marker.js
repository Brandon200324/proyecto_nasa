/* ============================================================
   ECHOES OF SOL · components/echo-marker.js
   Panel de ficha del artefacto: monólogo, hardware y CTA (Michelle)
   ============================================================ */
import { openSignalTuner } from '../game/signal-tuner.js';
import { openTrivia } from '../game/trivia.js';
import { soundscape } from '../audio/soundscape.js';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function badgeAlreadyEarned(id) {
  try {
    return JSON.parse(localStorage.getItem('echoes_badges') || '[]').includes(id);
  } catch (_) {
    return false;
  }
}

class EchoMarker extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  /** Abre el panel con los datos del artefacto. */
  open(artifact, badgeEarned = false) {
    this.pauseVoice();
    this._artifact = artifact;
    this._badgeEarned = badgeEarned;
    this.style.setProperty('--echo-accent', artifact.color_accent || '#4cc9f0');
    this.render();
    this.hidden = false;
    requestAnimationFrame(() => this.classList.add('is-open'));
    this.querySelector('.marker-close')?.focus();
  }

  pauseVoice() {
    const audio = this.querySelector('#marker-voice-audio');
    const btn = this.querySelector('[data-action="play-voice"]');
    if (audio && !audio.paused) {
      audio.pause();
    }
    if (btn) {
      const icon = btn.querySelector('.voice-icon');
      const label = btn.querySelector('.voice-label');
      if (icon) icon.textContent = '▶';
      if (label) label.textContent = 'ESCUCHAR RELATO';
      btn.style.background = 'rgba(76, 201, 240, 0.12)';
    }
  }

  close() {
    this.pauseVoice();
    this.classList.remove('is-open');
    setTimeout(() => { this.hidden = true; }, 450);
  }

  render() {
    const a = this._artifact;
    if (!a) { this.innerHTML = '<aside class="marker-panel"></aside>'; return; }

    this.innerHTML = `
      <aside class="marker-panel" role="dialog" aria-label="Ficha de ${escapeHtml(a.name)}">
        <button type="button" class="marker-close" aria-label="Cerrar ficha">✕</button>

        <p class="marker-kicker">${a.body === 'moon' ? '☾ LUNA' : '♂ MARTE'} · ${escapeHtml(a.mission_type || 'EQUIPO')}</p>
        <h2 class="marker-title">${escapeHtml(a.name)}</h2>
        <p class="marker-site">📍 ${escapeHtml(a.site || '')}</p>

        ${a.image ? `
        <figure class="marker-photo" style="margin: 0.75rem 0;">
          <img src="${a.image}" alt="Imagen real de la NASA: ${escapeHtml(a.name)}"
               loading="lazy"
               style="width: 100%; border-radius: 10px; border: 1px solid var(--line);
                      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45); display: block;
                      aspect-ratio: 16 / 10; object-fit: cover;
                      background: rgba(0, 0, 0, 0.4);"
               onerror="this.parentElement.hidden = true" />
          <figcaption style="font-family: var(--font-mono); font-size: 0.65rem;
                      letter-spacing: 0.15em; color: var(--muted); margin-top: 0.35rem;
                      text-transform: uppercase;">
            📷 Foto real · NASA (${escapeHtml(a.body === 'moon' ? 'Luna' : 'Marte')})
          </figcaption>
        </figure>` : ''}

        <div class="marker-stats">
          <div class="stat"><b>ATERRIZAJE</b><span>${escapeHtml(a.landing_date)}</span></div>
          <div class="stat"><b>ÚLTIMA SEÑAL</b><span>${escapeHtml(a.final_contact_date)}</span></div>
          <div class="stat"><b>DURACIÓN</b><span>${escapeHtml(a.operational_duration)}</span></div>
          <div class="stat"><b>ESTADO</b><span>${escapeHtml(a.status)}</span></div>
        </div>

        <blockquote class="marker-monument">${escapeHtml(a.monument_significance)}</blockquote>

        <div class="marker-story">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="margin: 0;">MONÓLOGO EN PRIMERA PERSONA</h3>
            <button type="button" class="btn-voice-inline" data-action="play-voice"
                    aria-label="Escuchar monólogo en audio de ${escapeHtml(a.name)}"
                    style="display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.35rem 0.85rem;
                           font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.12em;
                           color: var(--echo-accent); background: rgba(76, 201, 240, 0.12);
                           border: 1px solid var(--echo-accent); border-radius: 999px; cursor: pointer;
                           transition: all 0.2s ease;">
              <span class="voice-icon">▶</span>
              <span class="voice-label">ESCUCHAR RELATO</span>
            </button>
          </div>
          <p class="story-title"><em>${escapeHtml(a.first_person_story?.title || '')}</em></p>
          <p class="voice-text">${escapeHtml(a.first_person_story?.voice_text || '')}</p>
          <audio id="marker-voice-audio" preload="none" src="assets/audio/${escapeHtml(a.id)}.mp3"></audio>
        </div>

        <div class="marker-hardware" aria-label="Hardware que permanece en el lugar">
          ${(a.hardware_remains || []).map((h) => `<span class="chip">${escapeHtml(h)}</span>`).join('')}
        </div>

        <div class="marker-story">
          <h3>LEGADO CIENTÍFICO</h3>
          <p class="voice-text"><strong>Hito:</strong> ${escapeHtml(a.scientific_legacy?.breakthrough || '')}</p>
          <p class="voice-text"><strong>Impacto en la Tierra:</strong> ${escapeHtml(a.scientific_legacy?.earth_impact || '')}</p>
        </div>

        <div class="marker-cta-group">
          <button type="button" class="marker-cta" data-action="tuner">
            📡 SINTONIZAR VOZ ▸
          </button>
          <button type="button" class="marker-cta secondary" data-action="trivia">
            🧩 DESAFÍO TRIVIA ✦
          </button>
        </div>
      </aside>
    `;

    this.querySelector('.marker-close')?.addEventListener('click', () => this.close());
    this.querySelector('[data-action="tuner"]')?.addEventListener('click', () => {
      this.pauseVoice();
      soundscape.playCue(a.audio_cue, null);
      openSignalTuner(a, this._badgeEarned || badgeAlreadyEarned(a.id));
    });
    this.querySelector('[data-action="trivia"]')?.addEventListener('click', () => {
      this.pauseVoice();
      soundscape.playCue(a.audio_cue, null);
      openTrivia(a, this._badgeEarned || badgeAlreadyEarned(a.id));
    });

    const voiceBtn = this.querySelector('[data-action="play-voice"]');
    const voiceAudio = this.querySelector('#marker-voice-audio');

    if (voiceBtn && voiceAudio) {
      voiceBtn.addEventListener('click', () => {
        const icon = voiceBtn.querySelector('.voice-icon');
        const label = voiceBtn.querySelector('.voice-label');
        if (voiceAudio.paused) {
          voiceAudio.play().then(() => {
            if (icon) icon.textContent = '⏸';
            if (label) label.textContent = 'PAUSAR';
            voiceBtn.style.background = 'color-mix(in srgb, var(--echo-accent) 28%, transparent)';
          }).catch((err) => {
            console.error('[Echoes of Sol] Error reproduciendo audio:', err);
          });
        } else {
          voiceAudio.pause();
          if (icon) icon.textContent = '▶';
          if (label) label.textContent = 'REANUDAR';
          voiceBtn.style.background = 'rgba(76, 201, 240, 0.12)';
        }
      });

      voiceAudio.addEventListener('ended', () => {
        const icon = voiceBtn.querySelector('.voice-icon');
        const label = voiceBtn.querySelector('.voice-label');
        if (icon) icon.textContent = '▶';
        if (label) label.textContent = 'ESCUCHAR RELATO';
        voiceBtn.style.background = 'rgba(76, 201, 240, 0.12)';
      });

      voiceAudio.addEventListener('error', () => {
        const label = voiceBtn.querySelector('.voice-label');
        if (label) label.textContent = 'AUDIO NO DISPONIBLE';
      });
    }
  }
}

customElements.define('echo-marker', EchoMarker);
