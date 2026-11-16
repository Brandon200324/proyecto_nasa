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
import { t, getLang, setLang, applyTranslations, loadCatalog, loadGlossary as loadGlossaryData, cachedGlossary, preloadLanguages } from './i18n.js';

const globe = document.getElementById('globe');
const markerPanel = document.getElementById('marker-panel');
const badgeTracker = document.getElementById('badge-tracker');

let ECHO_DATA = [];
let currentBody = 'mars';
let manualRequest = 0;
let manualDialog = null;

/* ---------- Carga de datos ---------- */
async function loadData(lang = getLang()) {
  const data = await loadCatalog(lang);
  if (lang !== getLang()) return;
  ECHO_DATA = data;
  window.ECHO_DATA = ECHO_DATA;
  document.dispatchEvent(new CustomEvent('echo:data-ready', { detail: { total: data.length, lang } }));
}

function updateLanguageButtons() {
  document.querySelectorAll('.hud-lang-btn').forEach((button) => {
    button.querySelector('.lang-code').textContent = getLang() === 'es' ? 'EN' : 'ES';
    button.setAttribute('aria-label', t('language.switch'));
    button.setAttribute('title', t('language.switch'));
  });
}

function initLanguage() {
  applyTranslations();
  updateLanguageButtons();
  document.getElementById('btn-lang').addEventListener('click', () => setLang(getLang() === 'es' ? 'en' : 'es'));
  document.addEventListener('echo:lang-changed', async () => {
    updateLanguageButtons();
    const lang = getLang();
    try {
      await loadData(lang);
      if (lang !== getLang()) return;
      globe.updateArtifacts(ECHO_DATA.filter((artifact) => artifact.body === currentBody));
      if (manualDialog?.open) populateManual(manualDialog);
    } catch (error) {
      console.error('[Echoes of Sol] Language catalog:', error);
    }
  });
}

/* ---------- Selector Luna / Marte ---------- */
function initBodySwitch() {
  const buttons = document.querySelectorAll('.body-switch button');
  let current = '';

  const setBody = (body) => {
    if (body === current) return;
    current = body;
    currentBody = body;
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
function loadGlossary(lang = getLang()) {
  return loadGlossaryData(lang);
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
  kicker.dataset.i18n = 'manual.kicker';
  kicker.textContent = t('manual.kicker');
  const title = document.createElement('h2');
  title.className = 'manual-title';
  title.id = 'manual-title';
  title.dataset.i18n = 'manual.title';
  title.textContent = t('manual.title');
  titleGroup.append(kicker, title);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'manual-close';
  closeButton.setAttribute('data-i18n-aria-label', 'manual.close');
  closeButton.setAttribute('aria-label', t('manual.close'));
  closeButton.textContent = '✕';
  closeButton.addEventListener('click', () => dialog.close());
  const languageButton = document.createElement('button');
  languageButton.type = 'button';
  languageButton.className = 'hud-lang-btn';
  languageButton.innerHTML = '<span class="lang-icon" aria-hidden="true">🌐</span> <span class="lang-code"></span>';
  languageButton.addEventListener('click', () => setLang(getLang() === 'es' ? 'en' : 'es'));
  header.append(titleGroup, languageButton, closeButton);

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
  updateLanguageButtons();
  return dialog;
}

async function populateManual(dialog) {
  const content = dialog.querySelector('.manual-content');
  const lang = getLang();
  const request = ++manualRequest;
  const scrollTop = content.scrollTop;
  const loading = document.createElement('p');
  loading.className = 'manual-status';
  loading.textContent = t('manual.loading');
  if (!cachedGlossary(lang)) content.replaceChildren(loading);

  try {
    const terms = cachedGlossary(lang) || await loadGlossary(lang);
    if (request !== manualRequest || lang !== getLang()) return;
    const cards = document.createDocumentFragment();

    terms.forEach((term) => {
      const card = document.createElement('article');
      card.className = 'manual-term';
      const heading = document.createElement('h3');
      heading.textContent = term.term || t('manual.untitled');
      const category = document.createElement('p');
      category.className = 'manual-category';
      category.textContent = term.category || t('manual.category');
      card.append(heading, category);

      const summary = makeManualField(t('manual.summary'), term.cadet_summary);
      const explanation = makeManualField(t('manual.how'), term.how_it_works);
      const fact = makeManualField(t('manual.fact'), term.field_manual_did_you_know, 'manual-fact');
      [summary, explanation, fact].forEach((field) => {
        if (field) card.appendChild(field);
      });

      const profile = term.radio_telemetry_profile;
      if (profile) {
        const simulated = document.createElement('p');
        simulated.className = 'manual-simulated';
        simulated.textContent = t('manual.simulation', { frequency: profile.frequency_mhz, signal: profile.signal_type, difficulty: profile.difficulty });
        card.appendChild(simulated);
      }
      cards.appendChild(card);
    });

    content.replaceChildren(cards);
    content.scrollTop = scrollTop;
  } catch (error) {
    if (request !== manualRequest || lang !== getLang()) return;
    const message = document.createElement('p');
    message.className = 'manual-status';
    message.textContent = t('manual.error');
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'manual-retry';
    retry.textContent = t('manual.retry');
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
    initLanguage();
    initManual();
    await preloadLanguages();
    await loadData();
    initGlobeEvents();
    initBodySwitch();
    initScroll();
  } catch (err) {
    console.error('[Echoes of Sol]', err);
    const sub = document.getElementById('preloader-sub');
    if (sub) { sub.dataset.i18n = 'errors.boot'; sub.textContent = t('errors.boot'); }
  } finally {
    // Pequeño retiro para que la textura termine de montar
    setTimeout(hidePreloader, 600);
  }
}

boot();
