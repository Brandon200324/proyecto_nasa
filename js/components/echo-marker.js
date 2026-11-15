/* ============================================================
   ECHOES OF SOL · components/echo-marker.js
   Panel de ficha del artefacto: datos, hardware y acceso a sintonización
   ============================================================ */
import { openSignalTuner } from '../game/signal-tuner.js';
import { isArtifactCompleted } from '../game/progress.js';
import { soundscape } from '../audio/soundscape.js';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

class EchoMarker extends HTMLElement {
  connectedCallback() {
    this.render();
    this._onCompleted = (event) => {
      if (event.detail?.id === this._artifact?.id) {
        this._badgeEarned = true;
        this.render();
      }
    };
    document.addEventListener('echo:badge-earned', this._onCompleted);
  }

  disconnectedCallback() {
    clearTimeout(this._closeTimer);
    document.removeEventListener('echo:badge-earned', this._onCompleted);
  }

  /** Abre el panel con los datos del artefacto. */
  open(artifact, badgeEarned = false) {
    clearTimeout(this._closeTimer);
    this._artifact = artifact;
    this._badgeEarned = badgeEarned;
    this.style.setProperty('--echo-accent', artifact.color_accent || '#4cc9f0');
    this.render();
    this.hidden = false;
    requestAnimationFrame(() => this.classList.add('is-open'));
    this.querySelector('.marker-close')?.focus();
  }

  close() {
    this.classList.remove('is-open');
    clearTimeout(this._closeTimer);
    this._closeTimer = setTimeout(() => { this.hidden = true; }, 450);
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

        <div class="marker-hardware" aria-label="Hardware que permanece en el lugar">
          ${(a.hardware_remains || []).map((h) => `<span class="chip">${escapeHtml(h)}</span>`).join('')}
        </div>

        <div class="marker-story">
          <h3>LEGADO CIENTÍFICO</h3>
          <p class="voice-text"><strong>Hito:</strong> ${escapeHtml(a.scientific_legacy?.breakthrough || '')}</p>
          <p class="voice-text"><strong>Impacto en la Tierra:</strong> ${escapeHtml(a.scientific_legacy?.earth_impact || '')}</p>
        </div>

        <p class="marker-site" role="status">${isArtifactCompleted(a.id)
          ? '✅ Trivia respondida correctamente'
          : 'Trivia pendiente · sintoniza la voz para continuar'}</p>

        <div class="marker-cta-group">
          <button type="button" class="marker-cta" data-action="tuner">
            📡 SINTONIZAR VOZ ▸
          </button>
        </div>
      </aside>
    `;

    this.querySelector('.marker-close')?.addEventListener('click', () => this.close());
    this.querySelector('[data-action="tuner"]')?.addEventListener('click', () => {
      soundscape.playCue(a.audio_cue, null);
      openSignalTuner(a, this._badgeEarned || isArtifactCompleted(a.id));
    });
  }
}

customElements.define('echo-marker', EchoMarker);
