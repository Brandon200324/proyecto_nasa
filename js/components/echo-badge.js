/* ============================================================
   ECHOES OF SOL · components/echo-badge.js
   Sistema de insignias con localStorage (Priscila)
   Clave de almacenamiento: echoes_badges (array de ids)
   ============================================================ */

const STORAGE_KEY = 'echoes_badges';

function readBadges() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (_) { return []; }
}

class EchoBadge extends HTMLElement {
  connectedCallback() {
    this._total = window.ECHO_DATA?.length || 6;
    this.render();

    document.addEventListener('echo:badge-earned', (e) => {
      this.earn(e.detail?.id);
    });
    // Si el catálogo carga después del componente, actualiza el total
    document.addEventListener('echo:data-ready', (e) => {
      this._total = e.detail?.total || this._total;
      this.render();
    });
  }

  earn(id) {
    if (!id) return;
    const badges = readBadges();
    if (!badges.includes(id)) {
      badges.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
      this.render();
      this.showToast(`Eco restaurado · ${badges.length}/${this._total}`);
    }
  }

  render() {
    const badges = readBadges();
    this.innerHTML = `
      <span class="badge-pill" title="Ecos restaurados">
        <span aria-hidden="true">🏅</span>
        <span class="badge-count">${badges.length}</span>/${this._total} ECOS
      </span>
    `;
  }

  showToast(message) {
    document.querySelector('.toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = `✦ ${message}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 2600);
    setTimeout(() => toast.remove(), 3200);
  }
}

customElements.define('echo-badge', EchoBadge);
