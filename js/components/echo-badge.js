/* ============================================================
   ECHOES OF SOL · components/echo-badge.js
   Sistema de insignias con localStorage (Priscila)
   Clave de almacenamiento: echoes_badges (array de ids)
   ============================================================ */

import { t } from '../i18n.js';
import { BADGES_STORAGE_KEY, canonicalArtifactId, completedArtifactIds, completeArtifact } from '../game/progress.js';

function readBadges() {
  const badges = completedArtifactIds();
  if (!window.ECHO_DATA) return badges;
  const known = new Set(window.ECHO_DATA.map((artifact) => canonicalArtifactId(artifact.id)));
  return badges.filter((id) => known.has(id));
}

class EchoBadge extends HTMLElement {
  connectedCallback() {
    this._total = window.ECHO_DATA?.length || 13;
    this._onEarned = () => {
      this.render();
      this.showToast();
    };
    this._onDataReady = (e) => {
      this._total = e.detail?.total || this._total;
      this.render();
    };
    this._onStorage = (e) => {
      if (e.key === BADGES_STORAGE_KEY || e.key === null) this.render();
    };
    document.addEventListener('echo:badge-earned', this._onEarned);
    document.addEventListener('echo:data-ready', this._onDataReady);
    window.addEventListener('storage', this._onStorage);
    this._onLanguage = () => {
      this.render();
      if (this._toast?.isConnected) this._toast.textContent = this.toastText();
    };
    document.addEventListener('echo:lang-changed', this._onLanguage);
    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener('echo:badge-earned', this._onEarned);
    document.removeEventListener('echo:data-ready', this._onDataReady);
    window.removeEventListener('storage', this._onStorage);
    document.removeEventListener('echo:lang-changed', this._onLanguage);
  }

  earn(id) {
    return completeArtifact(id);
  }

  render() {
    const badges = readBadges();
    this.innerHTML = `
      <span class="badge-pill" title="${t('badge.title')}">
        <span aria-hidden="true">🏅</span>
        <span class="badge-count">${badges.length}</span>/${this._total} ${t('badge.suffix')}
      </span>
    `;
  }

  toastText() {
    return `✦ ${t('badge.toast', { count: readBadges().length, total: this._total })}`;
  }

  showToast() {
    document.querySelector('.toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = this.toastText();
    this._toast = toast;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 2600);
    setTimeout(() => toast.remove(), 3200);
  }
}

customElements.define('echo-badge', EchoBadge);
