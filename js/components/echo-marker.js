/* ============================================================
   ECHOES OF SOL · components/echo-marker.js
   Panel de ficha del artefacto: datos, hardware y acceso a sintonización
   ============================================================ */
import { openSignalTuner } from '../game/signal-tuner.js';
import { isArtifactCompleted } from '../game/progress.js';
import { t, getLang, setLang, localizeArtifact } from '../i18n.js';
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
    this._onLanguage = () => {
      this._artifact = localizeArtifact(this._artifact);
      const focused = this.contains(document.activeElement) ? document.activeElement.className : null;
      const scrollTop = this.querySelector('.marker-panel')?.scrollTop || 0;
      this.render();
      if (this.querySelector('.marker-panel')) this.querySelector('.marker-panel').scrollTop = scrollTop;
      if (focused) this.getElementsByClassName(focused)[0]?.focus({ preventScroll: true });
    };
    document.addEventListener('echo:lang-changed', this._onLanguage);
    document.addEventListener('echo:data-ready', this._onLanguage);
  }

  disconnectedCallback() {
    clearTimeout(this._closeTimer);
    document.removeEventListener('echo:badge-earned', this._onCompleted);
    document.removeEventListener('echo:lang-changed', this._onLanguage);
    document.removeEventListener('echo:data-ready', this._onLanguage);
  }

  /** Abre el panel con los datos del artefacto. */
  open(artifact, badgeEarned = false) {
    clearTimeout(this._closeTimer);
    this._artifact = localizeArtifact(artifact);
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
      <aside class="marker-panel" role="dialog" aria-label="${escapeHtml(t('marker.dialog', { name: a.name }))}">
        <button type="button" class="marker-close" aria-label="${t('marker.close')}">✕</button>

        <p class="marker-kicker">${t(a.body === 'moon' ? 'explorer.moon' : 'explorer.mars')} · ${escapeHtml(t('mission.' + (a.mission_type || 'default')))}
          <button type="button" class="hud-lang-btn" data-action="language" aria-label="${escapeHtml(t('language.switch'))}"><span class="lang-icon" aria-hidden="true">🌐</span><span class="lang-code">${getLang() === 'es' ? 'EN' : 'ES'}</span></button>
        </p>
        <h2 class="marker-title">${escapeHtml(a.name)}</h2>
        <p class="marker-site">📍 ${escapeHtml(a.site || '')}</p>

        ${a.image ? `
        <figure class="marker-photo" style="margin: 0.75rem 0;">
          <img src="${a.image}" alt="${escapeHtml(t('marker.photoAlt', { name: a.name }))}"
               loading="lazy"
               style="width: 100%; border-radius: 10px; border: 1px solid var(--line);
                      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45); display: block;
                      aspect-ratio: 16 / 10; object-fit: cover;
                      background: rgba(0, 0, 0, 0.4);"
               onerror="this.parentElement.hidden = true" />
          <figcaption style="font-family: var(--font-mono); font-size: 0.65rem;
                      letter-spacing: 0.15em; color: var(--muted); margin-top: 0.35rem;
                      text-transform: uppercase;">
            ${escapeHtml(t('marker.photoCaption', { body: t('body.' + a.body) }))}
          </figcaption>
        </figure>` : ''}

        <div class="marker-stats">
          <div class="stat"><b>${t('marker.landing')}</b><span>${escapeHtml(a.landing_date)}</span></div>
          <div class="stat"><b>${t('marker.contact')}</b><span>${escapeHtml(a.final_contact_date)}</span></div>
          <div class="stat"><b>${t('marker.duration')}</b><span>${escapeHtml(a.operational_duration)}</span></div>
          <div class="stat"><b>${t('marker.status')}</b><span>${escapeHtml(a.status)}</span></div>
        </div>

        <blockquote class="marker-monument">${escapeHtml(a.monument_significance)}</blockquote>

        <div class="marker-hardware" aria-label="${t('marker.hardware')}">
          ${(a.hardware_remains || []).map((h) => `<span class="chip">${escapeHtml(h)}</span>`).join('')}
        </div>

        <div class="marker-story">
          <h3>${t('marker.legacy')}</h3>
          <p class="voice-text"><strong>${t('marker.breakthrough')}:</strong> ${escapeHtml(a.scientific_legacy?.breakthrough || '')}</p>
          <p class="voice-text"><strong>${t('marker.impact')}:</strong> ${escapeHtml(a.scientific_legacy?.earth_impact || '')}</p>
        </div>

        <p class="marker-site" role="status">${isArtifactCompleted(a.id)
          ? t('marker.complete')
          : t('marker.pending')}</p>

        <div class="marker-cta-group">
          <button type="button" class="marker-cta" data-action="tuner">
            ${t('marker.tune')}
          </button>
        </div>
      </aside>
    `;

    this.querySelector('.marker-close')?.addEventListener('click', () => this.close());
    this.querySelector('[data-action="language"]')?.addEventListener('click', () => setLang(getLang() === 'es' ? 'en' : 'es'));
    this.querySelector('[data-action="tuner"]')?.addEventListener('click', () => {
      soundscape.playCue(a.audio_cue, null);
      openSignalTuner(a, this._badgeEarned || isArtifactCompleted(a.id));
    });
  }
}

customElements.define('echo-marker', EchoMarker);
