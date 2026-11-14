/* ============================================================
   ECHOES OF SOL · main.js
   Orquestador (Michelle · Tech Lead)
   Carga equipment_data.json, coordina módulos y eventos.
   ============================================================ */
import './components/echo-globe.js';
import './components/echo-marker.js';
import './components/echo-audio.js';
import './components/echo-badge.js';
import { initScroll } from './ui/scroll.js';
import { soundscape } from './audio/soundscape.js';

const globe = document.getElementById('globe');
const markerPanel = document.getElementById('marker-panel');
const badgeTracker = document.getElementById('badge-tracker');

let ECHO_DATA = [];

/* ---------- Carga de datos ---------- */
async function loadData() {
  const res = await fetch('data/equipment_data.json');
  if (!res.ok) throw new Error(`No se pudo cargar equipment_data.json (${res.status})`);
  ECHO_DATA = await res.json();
  window.ECHO_DATA = ECHO_DATA; // visible para los web components
  document.dispatchEvent(new CustomEvent('echo:data-ready', { detail: { total: ECHO_DATA.length } }));
}

/* ---------- Selector Luna / Marte ---------- */
function initBodySwitch() {
  const buttons = document.querySelectorAll('.body-switch button');
  let current = 'mars';

  const setBody = (body) => {
    if (body === current) return;
    current = body;
    buttons.forEach((b) => {
      const active = b.dataset.body === body;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    document.documentElement.style.setProperty(
      '--echo-accent',
      body === 'moon' ? 'var(--moon)' : 'var(--mars)'
    );
    globe.reset();
    markerPanel.close();
    globe.setBody(body, ECHO_DATA.filter((a) => a.body === body));
    if (soundscape.enabled) soundscape.staticBurst(0.8, 0.07);
  };

  buttons.forEach((b) => b.addEventListener('click', () => setBody(b.dataset.body)));

  // Cuerpo inicial: MARTE (prototipo acordado)
  current = '';
  setBody('mars');
}

/* ---------- Eventos del globo ---------- */
function initGlobeEvents() {
  globe.addEventListener('echo:marker-selected', (e) => {
    const artifact = ECHO_DATA.find((a) => a.id === e.detail.id);
    if (!artifact) return;
    globe.focus(e.detail.id);
    soundscape.playCue(artifact.audio_cue, callsignOf(artifact.id));
    const earned = badgeEarned(artifact.id);
    markerPanel.open(artifact, earned);
  });

  globe.addEventListener('echo:marker-deselect', () => {
    markerPanel.close();
    globe.reset();
  });
}

/* ---------- Insignias (localStorage) ---------- */
function badgeEarned(id) {
  try { return (JSON.parse(localStorage.getItem('echoes_badges') || '[]')).includes(id); }
  catch (_) { return false; }
}

function callsignOf(id) {
  const names = {
    'apollo11-descent-stage': 'EAGLE',
    'apollo15-lrv': 'FALCON',
    'viking1-lander': 'VIKING',
    'spirit-mer-a': 'SPIRIT',
    'opportunity-mer-b': 'OPPY',
    'insight-lander': 'INSIGHT',
  };
  return names[id] || 'ECHO';
}

/* ---------- Preloader ---------- */
function hidePreloader() {
  document.getElementById('preloader')?.classList.add('is-done');
}

/* ---------- Arranque ---------- */
async function boot() {
  try {
    await loadData();
    initGlobeEvents();
    initBodySwitch();
    initScroll();
  } catch (err) {
    console.error('[Echoes of Sol]', err);
    const sub = document.getElementById('preloader-sub');
    if (sub) sub.textContent = '⚠ Error cargando datos. Sirve el proyecto con: npx serve .';
  } finally {
    // Pequeño retiro para que la textura termine de montar
    setTimeout(hidePreloader, 600);
  }
}

boot();
