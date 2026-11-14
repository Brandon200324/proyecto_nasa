/* ============================================================
   ECHOES OF SOL · ui/pages.js (Diego · feature/nav-pages)
   Sistema de páginas emergentes:
   - Cada botón [data-page] abre un HTML emergente (pages/*.html)
     cargado con fetch dentro de un overlay glassmorphism.
   - Botón "← REGRESAR" en cada página (y tecla ESC, y el botón
     atrás del navegador vía hash).
   - Carga dinámica: glosario (JSON de Jorge) y misiones
     (equipment_data.json vía window.ECHO_DATA).
   ============================================================ */

const PAGES = {
  glosario: { title: 'GLOSARIO DE LA ACADEMIA', file: 'pages/glosario.html', dynamic: 'glossary' },
  misiones: { title: 'ARCHIVO DE MISIONES', file: 'pages/misiones.html', dynamic: 'missions' },
  equipo:   { title: 'TRIPULACIÓN ECHOES OF SOL', file: 'pages/equipo.html', dynamic: null },
};

let overlay = null;
let isOpen = false;
let lastFocused = null;

/* ------------------------------------------------------------
   Arranque: crea el overlay, conecta botones [data-page],
   escucha hashchange (soporta botón ATRÁS del navegador) y
   activa el botón flotante VOLVER ARRIBA.
   ------------------------------------------------------------ */
export function initPages() {
  buildOverlay();

  document.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (location.hash !== `#${page}`) location.hash = page;
      else openPage(page);
    });
  });

  // Botón ATRÁS del navegador: hash vacío → cerrar página
  window.addEventListener('hashchange', () => {
    const page = location.hash.slice(1);
    if (page && PAGES[page]) openPage(page);
    else if (isOpen) closePage();
  });

  // Abrir directamente si la URL ya trae hash (deep-link)
  const initial = location.hash.slice(1);
  if (initial && PAGES[initial]) openPage(initial);

  setupToTop();
}

/* ------------------------------------------------------------
   Overlay: se crea una sola vez y se reutiliza
   ------------------------------------------------------------ */
function buildOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'page-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="page-dialog" role="dialog" aria-modal="true" aria-labelledby="page-title-text">
      <header class="page-head">
        <button type="button" class="page-back" aria-label="Regresar">← REGRESAR</button>
        <div class="page-title">
          <span class="page-kicker">ECHOES OF SOL · CONSULTA</span>
          <span id="page-title-text"></span>
        </div>
        <button type="button" class="page-close" aria-label="Cerrar página">✕</button>
      </header>
      <div class="page-body" id="page-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.page-back').addEventListener('click', goBack);
  overlay.querySelector('.page-close').addEventListener('click', goBack);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) goBack(); // clic en el fondo también regresa
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) goBack();
  });
}

/* ------------------------------------------------------------
   Abrir / cargar una página
   ------------------------------------------------------------ */
async function openPage(pageId) {
  const config = PAGES[pageId];
  if (!config || !overlay) return;

  lastFocused = document.activeElement;
  const body = overlay.querySelector('#page-body');
  const title = overlay.querySelector('#page-title-text');

  title.textContent = config.title;
  body.innerHTML = '<p class="page-empty">CARGANDO TRANSMISIÓN…</p>';
  overlay.hidden = false;
  document.body.style.overflow = 'hidden'; // congela el scroll de fondo
  isOpen = true;
  markActiveNav(pageId);

  try {
    const res = await fetch(config.file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body.innerHTML = await res.text();
    if (config.dynamic === 'glossary') await renderGlossary(body);
    if (config.dynamic === 'missions') renderMissions(body);
  } catch (err) {
    body.innerHTML = `
      <p class="page-empty">⚠ NO SE PUDO CARGAR LA PÁGINA (${config.file}).<br>
      Sirve el proyecto con: npx serve .</p>`;
    console.error('[Echoes of Sol · pages]', err);
  }

  // Enfoque inicial para navegación con teclado
  overlay.querySelector('.page-back').focus();
}

/* ------------------------------------------------------------
   Regresar: botón ← REGRESAR / ✕ / ESC / fondo / ATRÁS navegador
   ------------------------------------------------------------ */
function goBack() {
  // Si llegamos por hash, el botón ATRÁS del navegador debe ser
  // el camino natural (así el historial queda coherente).
  if (location.hash && PAGES[location.hash.slice(1)]) {
    history.back();
    // Por si el historial venía vacío, garantizamos el cierre:
    setTimeout(() => { if (isOpen) closePage(); }, 50);
  } else {
    closePage();
  }
}

function closePage() {
  if (!overlay) return;
  overlay.hidden = true;
  overlay.querySelector('#page-body').innerHTML = '';
  document.body.style.overflow = '';
  isOpen = false;
  markActiveNav('');
  lastFocused?.focus?.();
}

function markActiveNav(pageId) {
  document.querySelectorAll('[data-page]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.page === pageId);
  });
}

/* ------------------------------------------------------------
   DINÁMICO 1: Glosario (data/glossary_data.json de Jorge)
   Con buscador en vivo.
   ------------------------------------------------------------ */
async function renderGlossary(container) {
  const list = container.querySelector('#glossary-list');
  const search = container.querySelector('#glossary-search');
  if (!list) return;

  let terms = [];
  try {
    const res = await fetch('data/glossary_data.json');
    terms = await res.json();
  } catch (err) {
    list.innerHTML = '<p class="page-empty">⚠ SIN DATOS DEL GLOSARIO</p>';
    console.error('[Echoes of Sol · glossary]', err);
    return;
  }

  const render = (query = '') => {
    const q = query.trim().toLowerCase();
    const items = terms.filter((t) =>
      !q || `${t.term} ${t.category} ${t.cadet_summary}`.toLowerCase().includes(q)
    );
    list.innerHTML = items.length
      ? items.map((t) => `
          <article class="page-card">
            <span class="page-card__cat">${escapeHtml(t.category)}</span>
            <h3>${escapeHtml(t.term)}</h3>
            <p>${escapeHtml(t.cadet_summary)}</p>
            <p class="page-card__meta">📡 ${t.radio_telemetry_profile?.frequency_mhz ?? '—'} MHz · ${escapeHtml(t.radio_telemetry_profile?.difficulty ?? '')}</p>
            <p class="page-card__meta">💡 ${escapeHtml(t.field_manual_did_you_know ?? '')}</p>
          </article>`).join('')
      : '<p class="page-empty">SIN RESULTADOS EN ESTA FRECUENCIA</p>';
  };

  render();
  search?.addEventListener('input', () => render(search.value));
}

/* ------------------------------------------------------------
   DINÁMICO 2: Misiones (window.ECHO_DATA cargado por main.js)
   Clic en una tarjeta → cierra la página y abre su ficha.
   ------------------------------------------------------------ */
function renderMissions(container) {
  const grid = container.querySelector('#missions-grid');
  if (!grid) return;
  const data = window.ECHO_DATA || [];

  grid.innerHTML = data.length
    ? data.map((a) => `
        <button type="button" class="page-card" data-artifact="${escapeHtml(a.id)}" style="text-align:left; cursor:pointer; font: inherit; color: inherit;">
          ${a.image ? `<img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.name)}" loading="lazy">` : ''}
          <span class="page-card__cat">${a.body === 'moon' ? '☾ LUNA' : '♂ MARTE'}</span>
          <h3>${escapeHtml(a.name)}</h3>
          <p>${escapeHtml(a.monument_significance || a.status || '')}</p>
          <p class="page-card__meta">📍 ${escapeHtml(a.site || '')} · 🗓 ${escapeHtml(a.landing_date || '')}</p>
        </button>`).join('')
    : '<p class="page-empty">SIN ARTEFACTOS EN EL ARCHIVO</p>';

  grid.querySelectorAll('[data-artifact]').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.artifact;
      closePage();
      // main.js escucha este evento y abre la ficha (echo-marker)
      document.dispatchEvent(new CustomEvent('echo:open-artifact', { detail: { id } }));
    });
  });
}

/* ---------- Utilidad ---------- */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ------------------------------------------------------------
   Botón flotante VOLVER ARRIBA (aparece tras 600px de scroll)
   ------------------------------------------------------------ */
function setupToTop() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.textContent = '↑';
  document.body.appendChild(btn);

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const onScroll = () => btn.classList.toggle('is-visible', window.scrollY > 600);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
