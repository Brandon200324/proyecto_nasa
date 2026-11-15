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
import { isArtifactCompleted } from './game/progress.js';

const globe = document.getElementById('globe');
const markerPanel = document.getElementById('marker-panel');
const badgeTracker = document.getElementById('badge-tracker');

let ECHO_DATA = [];
let glossaryPromise = null;
let manualDialog = null;

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
    const earned = isArtifactCompleted(artifact.id);
    markerPanel.open(artifact, earned);
  });

  globe.addEventListener('echo:marker-deselect', () => {
    markerPanel.close();
    globe.reset();
  });
}

/* ---------- Insignias (localStorage) ---------- */
function callsignOf(id) {
  const names = {
    'apollo-11-descent-stage': 'EAGLE',
    'apollo11-descent-stage': 'EAGLE',
    'surveyor-3': 'SURVEYOR',
    'apollo-15-lrv': 'FALCON',
    'apollo15-lrv': 'FALCON',
    'apollo-alsep-lrrr': 'ALSEP',
    'apollo17-lrv': 'CHALLENGER',
    'viking-1-lander': 'VIKING',
    'viking1-lander': 'VIKING',
    'viking2-lander': 'VIKING-2',
    'pathfinder-sojourner': 'SOJOURNER',
    'spirit-mer-a': 'SPIRIT',
    'opportunity-mer-b': 'OPPY',
    'phoenix-lander': 'PHOENIX',
    'insight-lander': 'INSIGHT',
    'ingenuity-helicopter': 'INGENUITY'
  };
  return names[id] || 'ECHO';
}

/* ---------- Manual del Cadete (glosario) ---------- */
function loadGlossary() {
  if (!glossaryPromise) {
    glossaryPromise = fetch('data/glossary_data.json')
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el glosario (${res.status})`);
        return res.json();
      })
      .then((terms) => {
        if (!Array.isArray(terms)) throw new Error('El glosario no tiene formato de lista.');
        return terms;
      })
      .catch((err) => {
        glossaryPromise = null;
        throw err;
      });
  }
  return glossaryPromise;
}

function makeManualField(label, value, className = '') {
  if (!value) return null;
  const section = document.createElement('section');
  if (className) section.className = className;
  const heading = document.createElement('h4');
  heading.textContent = label;
  const text = document.createElement('p');
  text.textContent = value;
  section.append(heading, text);
  return section;
}

function ensureManualDialog(button) {
  if (manualDialog) return manualDialog;

  const dialog = document.createElement('dialog');
  dialog.id = 'cadet-manual';
  dialog.className = 'manual-dialog';
  dialog.setAttribute('aria-labelledby', 'manual-title');

  const header = document.createElement('header');
  header.className = 'manual-header';
  const titleGroup = document.createElement('div');
  const kicker = document.createElement('p');
  kicker.className = 'manual-kicker';
  kicker.textContent = 'ARCHIVO DE CAMPO · ACADEMIA 2099';
  const title = document.createElement('h2');
  title.className = 'manual-title';
  title.id = 'manual-title';
  title.textContent = 'Manual del Cadete';
  titleGroup.append(kicker, title);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'manual-close';
  closeButton.setAttribute('aria-label', 'Cerrar Manual del Cadete');
  closeButton.textContent = '✕';
  closeButton.addEventListener('click', () => dialog.close());
  header.append(titleGroup, closeButton);

  const content = document.createElement('div');
  content.className = 'manual-content';
  content.setAttribute('aria-live', 'polite');
  dialog.append(header, content);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    button.setAttribute('aria-expanded', 'false');
    button.focus();
  });

  document.body.appendChild(dialog);
  manualDialog = dialog;
  return dialog;
}

async function populateManual(dialog) {
  const content = dialog.querySelector('.manual-content');
  const loading = document.createElement('p');
  loading.className = 'manual-status';
  loading.textContent = 'Cargando los términos científicos…';
  content.replaceChildren(loading);

  try {
    const terms = await loadGlossary();
    const cards = document.createDocumentFragment();

    terms.forEach((term) => {
      const card = document.createElement('article');
      card.className = 'manual-term';
      const heading = document.createElement('h3');
      heading.textContent = term.term || 'Término sin nombre';
      const category = document.createElement('p');
      category.className = 'manual-category';
      category.textContent = term.category || 'Campo científico';
      card.append(heading, category);

      const summary = makeManualField('En pocas palabras', term.cadet_summary);
      const explanation = makeManualField('Cómo funciona', term.how_it_works);
      const fact = makeManualField('¿Sabías que…?', term.field_manual_did_you_know, 'manual-fact');
      [summary, explanation, fact].forEach((field) => {
        if (field) card.appendChild(field);
      });

      const profile = term.radio_telemetry_profile;
      if (profile) {
        const simulated = document.createElement('p');
        simulated.className = 'manual-simulated';
        simulated.textContent = `SIMULACIÓN 2099 · No es telemetría NASA: ${profile.frequency_mhz} MHz · ${profile.signal_type} · ${profile.difficulty}`;
        card.appendChild(simulated);
      }
      cards.appendChild(card);
    });

    content.replaceChildren(cards);
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'manual-status';
    message.textContent = `No se pudo abrir el manual. ${error.message}`;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'manual-retry';
    retry.textContent = 'Reintentar';
    retry.addEventListener('click', () => populateManual(dialog), { once: true });
    message.appendChild(retry);
    content.replaceChildren(message);
  }
}

async function openManual(button) {
  const dialog = ensureManualDialog(button);
  if (dialog.open) return;
  button.setAttribute('aria-expanded', 'true');
  dialog.showModal();
  dialog.querySelector('.manual-close').focus();
  await populateManual(dialog);
}

function initManual() {
  const button = document.getElementById('btn-manual');
  if (!button) return;
  button.addEventListener('click', () => {
    openManual(button).catch((error) => console.error('[Echoes of Sol] Manual:', error));
  });
}

/* ---------- Preloader ---------- */
function hidePreloader() {
  document.getElementById('preloader')?.classList.add('is-done');
}

/* ---------- Arranque ---------- */
async function boot() {
  try {
    initManual();
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
