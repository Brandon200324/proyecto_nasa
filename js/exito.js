/* ============================================================
   ECHOES OF SOL · exito.js (Diego · feature/nav-pages)
   Página exito.html — sala de transmisión tras sincronizar.
   ------------------------------------------------------------
   Flujo:
   1. signal-tuner.js guarda el id del artefacto sincronizado en
      sessionStorage ('echo:exito-artifact') y redirige aquí.
   2. Este script carga equipment_data.json, pinta la ficha y
      reproduce el monólogo con subtítulos karaoke (lógica de voz
      adaptada del minijuego de Priscila, con su crédito).
   3. Navegación: botón REGRESAR/CONSULTORIO → index.html,
      GLOSARIO/MISIONES → index.html#glosario|#misiones (allí el
      sistema de páginas emergentes abre la vista por deep-link).
   ============================================================ */

import './components/echo-badge.js';
import { soundscape } from './audio/soundscape.js';

const ARTIFACT_KEY = 'echo:exito-artifact';

/* ------------------------------------------------------------
   Arranque
   ------------------------------------------------------------ */
async function boot() {
  let id = null;
  try { id = sessionStorage.getItem(ARTIFACT_KEY); } catch (_) { /* modo privado */ }

  let artifact = null;
  try {
    const res = await fetch('data/equipment_data.json');
    const data = await res.json();
    window.ECHO_DATA = data; // para que echo-badge muestre el total real
    document.dispatchEvent(new CustomEvent('echo:data-ready', { detail: { total: data.length } }));
    artifact = data.find((a) => a.id === id) || null;
  } catch (err) {
    console.error('[Echoes of Sol · exito]', err);
  }

  if (!artifact) {
    document.getElementById('exito-error').hidden = false;
    return;
  }

  render(artifact);
  setupVoice(artifact);
}

/* ------------------------------------------------------------
   Render de la sala de transmisión
   ------------------------------------------------------------ */
function render(artifact) {
  document.title = `Enlace Restablecido · ${artifact.name} · Echoes of Sol`;
  document.getElementById('exito-name').textContent = artifact.name;
  // Acento temático del artefacto (igual que en la ficha echo-marker)
  if (artifact.color_accent) {
    document.documentElement.style.setProperty('--echo-accent', artifact.color_accent);
  }

  const img = document.getElementById('exito-img');
  if (artifact.image) {
    img.src = artifact.image;
    img.alt = `Modelo real de la NASA: ${artifact.name}`;
    img.onerror = () => { img.closest('.exito-model').hidden = true; };
  } else {
    img.closest('.exito-model').hidden = true;
  }

  // Botón REGRESAR → página principal
  document.getElementById('back-home').addEventListener('click', () => {
    location.href = 'index.html';
  });

  // Animación de entrada (si GSAP cargó)
  if (window.gsap) {
    window.gsap.from('.exito-main > *', {
      opacity: 0, y: 30, duration: 0.8, stagger: 0.12, ease: 'power3.out',
    });
  }
}

/* ------------------------------------------------------------
   Voz del artefacto con subtítulos sincronizados palabra a
   palabra (evento `boundary` de SpeechSynthesis).
   Lógica adaptada de js/game/signal-tuner.js (Priscila).
   ------------------------------------------------------------ */
function setupVoice(artifact) {
  const captionsBox = document.getElementById('exito-captions');
  const btn = document.getElementById('btn-speak');
  const text = artifact.first_person_story?.voice_text || '';

  if (!text) {
    captionsBox.textContent = '(Este artefacto no tiene mensaje de voz registrado.)';
    btn.disabled = true;
    return;
  }

  // Render inicial: la primera palabra marcada como "pendiente"
  captionsBox.textContent = text;

  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = '📡 TRANSMITIENDO…';
    speakWithCaptions(text, captionsBox, () => {
      btn.disabled = false;
      btn.textContent = '🔊 REPRODUCIR DE NUEVO';
    });
  });
}

function speakWithCaptions(text, captionsBox, onEnd) {
  if (!('speechSynthesis' in window)) {
    captionsBox.textContent = text; // fallback sin voz
    if (onEnd) onEnd();
    return;
  }

  speechSynthesis.cancel();

  // Mapear cada palabra a su posición en el texto original
  const words = [];
  for (const match of text.matchAll(/\S+/g)) {
    words.push({ text: match[0], start: match.index, end: match.index + match[0].length });
  }
  const current = { word: null };
  const render = () => {
    captionsBox.innerHTML = words.map((w) => (
      w === current.word ? `<mark>${w.text}</mark>` : w.text
    )).join(' ');
  };
  current.word = words[0];
  render();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.95;
  utterance.pitch = 1.05;

  // Voz en español, preferencia por ESPAÑOL DE ECUADOR (igual que
  // el minijuego): es-EC → cualquier es-* → por nombre.
  const pickSpanishVoice = () => {
    const voices = speechSynthesis.getVoices();
    const norm = (v) => (v.lang || '').toLowerCase().replace('_', '-');
    const ecuatoriana = voices.find((v) => norm(v).startsWith('es-ec'))
      || voices.find((v) => /ecuador/i.test(v.name));
    const cualquierEspanol = voices.find((v) => norm(v).startsWith('es'));
    const porNombre = voices.find((v) => /spanish|espa/i.test(v.name));
    const elegida = ecuatoriana || cualquierEspanol || porNombre;
    if (elegida) utterance.voice = elegida;
    return elegida;
  };
  pickSpanishVoice();
  speechSynthesis.onvoiceschanged = () => {
    if (!utterance.voice) pickSpanishVoice();
  };

  // El navegador avisa justo cuando empieza CADA palabra
  utterance.onboundary = (e) => {
    if (e.charIndex == null) return;
    const spoken = words.find((w) => e.charIndex >= w.start && e.charIndex < w.end);
    if (spoken && spoken !== current.word) {
      current.word = spoken;
      render();
      const mark = captionsBox.querySelector('mark');
      if (mark) mark.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };
  utterance.onend = () => {
    current.word = null;
    render();
    captionsBox.insertAdjacentHTML('beforeend',
      '<span class="exito-caption-end">— fin de transmisión · eco registrado —</span>');
    if (onEnd) onEnd();
  };

  speechSynthesis.speak(utterance);
}

boot();
