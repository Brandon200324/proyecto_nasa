/* ============================================================
   ECHOES OF SOL · game/signal-tuner.js
   Minijuego "Restaurar la Frecuencia" (Priscila · Prompt 4)
   ------------------------------------------------------------
   1. Dial de 100 a 500 MHz; señal oculta en 240 MHz (±5).
   2. Onda de canvas que se limpia al acercarse al objetivo.
   3. Estática sonora continua con Web Audio API (volumen ∝ distancia).
   4. Al sincronizar: chime + Morse + mensaje de voz del rover
      (SpeechSynthesis lee first_person_story.voice_text del JSON).
   ============================================================ */
import { soundscape } from '../audio/soundscape.js';

/* ---------- Configuración del juego (según Prompt 4) ---------- */
const FREQ_MIN = 100;   // MHz — mínimo del dial
const FREQ_MAX = 500;   // MHz — máximo del dial
const TARGET = 240;     // MHz — señal oculta del artefacto
const MARGIN = 5;       // ±5 MHz = sincronía exitosa

/* Callsign por artefacto (igual que trivia.js) */
const CALLSIGNS = {
  'apollo11-descent-stage': 'EAGLE',
  'apollo15-lrv': 'FALCON',
  'viking1-lander': 'VIKING',
  'spirit-mer-a': 'SPIRIT',
  'opportunity-mer-b': 'OPPY',
  'insight-lander': 'INSIGHT',
};

/* ---------- Estilos del panel (inyectados una sola vez) ----------
   Se inyectan desde JS para no tocar css/ (rama de Diego).        */
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    .st-overlay {
      position: fixed; inset: 0; z-index: 60;
      display: flex; align-items: center; justify-content: center;
      background: rgba(3, 6, 14, 0.75);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      padding: 1rem;
    }
    .st-card {
      width: min(640px, 100%);
      background: var(--panel-strong);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: clamp(1rem, 4vw, 1.75rem);
      box-shadow: 0 0 40px rgba(76, 201, 240, 0.15);
    }
    .st-kicker {
      font-family: var(--font-mono);
      font-size: 0.72rem; letter-spacing: 0.25em;
      color: var(--echo-accent); text-transform: uppercase;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .st-led {
      width: 9px; height: 9px; border-radius: 50%;
      background: var(--echo-accent);
      animation: st-blink 1.4s ease-in-out infinite;
    }
    @keyframes st-blink { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
    .st-title { font-size: 1.1rem; margin: 0.35rem 0 0.6rem; }
    .st-desc { font-size: 0.85rem; color: var(--muted); margin-bottom: 1rem; }
    .st-canvas {
      width: 100%; height: 150px;
      border: 1px solid var(--line); border-radius: 8px;
      background: rgba(0, 0, 0, 0.45); margin-bottom: 0.75rem;
    }
    .st-readout {
      font-family: var(--font-mono); font-variant-numeric: tabular-nums;
      font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 700;
      color: var(--echo-accent); text-align: center;
      text-shadow: 0 0 14px color-mix(in srgb, var(--echo-accent) 60%, transparent);
    }
    .st-readout small { font-size: 0.45em; color: var(--muted); }
    .st-dial { width: 100%; height: 34px; cursor: pointer; accent-color: var(--echo-accent); }
    .st-scale {
      display: flex; justify-content: space-between;
      font-family: var(--font-mono); font-size: 0.68rem;
      color: var(--muted); margin: 0.25rem 0 1rem;
    }
    .st-feedback {
      min-height: 1.4em; font-size: 0.8rem; color: var(--muted);
      text-align: center; margin-top: 0.6rem; font-family: var(--font-mono);
    }
    .st-success {
      display: none; margin-top: 1rem; padding: 0.75rem 1rem;
      border: 1px solid var(--echo-accent); border-radius: 10px;
      color: var(--echo-accent); font-weight: 600;
      letter-spacing: 0.08em; text-align: center;
      animation: st-blink 1.6s ease-in-out infinite;
    }
    /* Subtítulos en vivo: resaltan la palabra que pronuncia la voz */
    .st-captions {
      display: none; margin-top: 0.8rem; padding: 0.7rem 0.9rem;
      border-left: 3px solid var(--echo-accent);
      background: rgba(0, 0, 0, 0.35); border-radius: 0 8px 8px 0;
      font-size: 0.85rem; line-height: 1.65; color: var(--text);
      max-height: 6.6em; overflow-y: auto;
    }
    .st-captions mark {
      background: var(--echo-accent); color: #04070f;
      border-radius: 3px; padding: 0 2px; font-weight: 700;
    }
    .st-captions .st-caption-end {
      display: block; margin-top: 0.5rem;
      font-family: var(--font-mono); font-size: 0.65rem;
      letter-spacing: 0.2em; color: var(--muted); text-transform: uppercase;
    }
    .st-actions { display: flex; gap: 0.6rem; margin-top: 1rem; flex-wrap: wrap; }
    .st-btn {
      flex: 1; min-width: 140px; padding: 0.7rem 0.9rem;
      font-family: var(--font-mono); font-size: 0.8rem;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--echo-accent);
      border: 1px solid var(--echo-accent); border-radius: 8px;
      transition: background 0.25s, color 0.25s, box-shadow 0.25s, transform 0.1s;
    }
    .st-btn:hover {
      background: var(--echo-accent); color: #04070f;
      box-shadow: 0 0 18px color-mix(in srgb, var(--echo-accent) 55%, transparent);
    }
    .st-btn:active { transform: scale(0.98); }
    .st-btn.ghost { border-color: var(--line); color: var(--muted); }
    .st-btn.ghost:hover { background: var(--line); color: var(--text); box-shadow: none; }
    @media (max-width: 480px) { .st-canvas { height: 110px; } }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

/** 1 = perfecto en el objetivo · 0 = en el extremo del rango. */
function quality(freq) {
  return Math.max(0, 1 - Math.abs(freq - TARGET) / ((FREQ_MAX - FREQ_MIN) / 2));
}

/**
 * Abre el minijuego de sintonización para un artefacto.
 * @param {object} artifact - registro de equipment_data.json
 * @param {boolean} alreadyEarned - si la insignia ya fue ganada
 */
export function openSignalTuner(artifact, alreadyEarned = false) {
  injectStyles();
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--echo-accent').trim() || '#4cc9f0';

  const overlay = document.createElement('div');
  overlay.className = 'st-overlay';
  overlay.innerHTML = `
    <div class="st-card" role="dialog" aria-modal="true" aria-label="Minijuego de restauración de frecuencia de ${artifact.name}">
      <p class="st-kicker"><span class="st-led"></span> RESTAURANDO ENLACE · ${artifact.id.replace(/-/g, ' ').toUpperCase()}</p>
      <h3 class="st-title">Restaurar la Frecuencia</h3>
      <p class="st-desc">El transmisor de <strong>${artifact.name}</strong> quedó en silencio en ${artifact.site || 'su sitio'}. Ajusta el dial de 100 a 500 MHz hasta sintonizar su señal oculta. La onda se limpia y la estática baja cuando te acercas.</p>

      <canvas class="st-canvas" width="640" height="150" aria-hidden="true"></canvas>
      <div class="st-readout" aria-live="polite"><span class="st-value">100.0</span> <small>MHz</small></div>

      <input type="range" class="st-dial" min="${FREQ_MIN}" max="${FREQ_MAX}" step="0.5" value="${FREQ_MIN}"
             aria-label="Frecuencia del dial en megahercios" />
      <div class="st-scale"><span>100</span><span>300</span><span>500 MHz</span></div>

      <div class="st-feedback" aria-live="polite"></div>

      <div class="st-actions">
        <button type="button" class="st-btn" data-action="sync">Sincronizar señal</button>
        <button type="button" class="st-btn ghost" data-action="sound" aria-pressed="false">🔊 Estática</button>
        <button type="button" class="st-btn ghost" data-action="close">Cerrar</button>
      </div>

      <div class="st-success" role="status"></div>
      <p class="st-captions" aria-live="polite"></p>
    </div>
  `;

  /* ---------- Referencias del DOM ---------- */
  const canvas = overlay.querySelector('.st-canvas');
  const ctx2d = canvas.getContext('2d');
  const slider = overlay.querySelector('.st-dial');
  const valueEl = overlay.querySelector('.st-value');
  const feedback = overlay.querySelector('.st-feedback');
  const successBox = overlay.querySelector('.st-success');
  const captionsBox = overlay.querySelector('.st-captions');
  const syncBtn = overlay.querySelector('[data-action="sync"]');
  const soundBtn = overlay.querySelector('[data-action="sound"]');

  /* ---------- Estado ---------- */
  let raf = 0;
  let synced = false;
  let staticOn = false;
  let staticNodes = null; // { src, band, gain }

  /* ---------- Estática sonora continua (Web Audio) ----------
     Reutiliza el AudioContext y el bus master del soundscape
     del equipo para que todo salga por la misma salida.       */
  function ensureStatic() {
    soundscape.ensure(); // crea/resume el AudioContext (requiere gesto del usuario)
    if (staticNodes) return;
    const { ctx, master } = soundscape;
    const len = ctx.sampleRate * 2;                     // buffer de ruido blanco
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const band = ctx.createBiquadFilter();              // textura de radio vieja
    band.type = 'bandpass';
    band.frequency.value = 900;
    band.Q.value = 0.7;

    const gain = ctx.createGain();                      // volumen según distancia
    gain.gain.value = 0;

    src.connect(band).connect(gain).connect(master);
    src.start();
    staticNodes = { src, band, gain };
  }

  function setStatic(on) {
    staticOn = on;
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.textContent = on ? '🔇 Silenciar' : '🔊 Estática';
    if (on) {
      ensureStatic();
      if (!soundscape.enabled) soundscape.toggle(); // habilita chime/Morse del juego
    } else if (staticNodes) {
      staticNodes.gain.gain.setTargetAtTime(0, soundscape.ctx.currentTime, 0.03);
    }
  }

  /* ---------- Osciloscopio en canvas ---------- */
  function draw() {
    const freq = parseFloat(slider.value);
    const q = quality(freq);
    const noise = (1 - q) ** 2; // al cuadrado: se "limpia" de forma progresiva

    const w = canvas.width, h = canvas.height;
    ctx2d.clearRect(0, 0, w, h);
    ctx2d.lineWidth = 2;

    // Color: entre gris estático y el acento del artefacto
    const r = Math.round(90 + q * (hexR(accent) - 90));
    const g = Math.round(111 + q * (hexG(accent) - 111));
    const b = Math.round(143 + q * (hexB(accent) - 143));
    ctx2d.strokeStyle = `rgba(${r},${g},${b},0.95)`;

    ctx2d.beginPath();
    for (let x = 0; x <= w; x++) {
      const t = x / w;
      const seno = Math.sin(t * Math.PI * 6 + freq * 0.01) * (h * 0.22) * q;
      const estatica = (Math.random() * 2 - 1) * (h * 0.35) * noise;
      const y = h / 2 + seno + estatica;
      x === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y);
    }
    ctx2d.stroke();

    // Estática sonora: volumen ∝ distancia al objetivo
    if (staticOn && staticNodes) {
      const level = noise * 0.22;
      staticNodes.gain.gain.setTargetAtTime(level, soundscape.ctx.currentTime, 0.05);
    }

    raf = requestAnimationFrame(draw);
  }

  /* ---------- Dial ---------- */
  slider.addEventListener('input', () => {
    valueEl.textContent = parseFloat(slider.value).toFixed(1);
    feedback.textContent = '';
  });

  /* ---------- Botones ---------- */
  syncBtn.addEventListener('click', () => {
    if (synced) return;
    const freq = parseFloat(slider.value);
    if (Math.abs(freq - TARGET) <= MARGIN) {
      succeed();
    } else {
      soundscape.staticBurst(0.5, 0.08); // interferencia al fallar
      feedback.textContent = `✕ Señal perdida en ${freq.toFixed(1)} MHz · sigue la onda limpia…`;
    }
  });

  soundBtn.addEventListener('click', () => setStatic(!staticOn));

  /* ---------- Éxito: conexión restablecida ---------- */
  function succeed() {
    synced = true;
    slider.disabled = true;
    syncBtn.disabled = true;
    syncBtn.textContent = 'Señal sincronizada ✓';
    if (staticNodes) staticNodes.gain.gain.setTargetAtTime(0, soundscape.ctx.currentTime, 0.03);

    soundscape.chime();                                   // armonía de éxito
    soundscape.morse(CALLSIGNS[artifact.id] || 'ECHO');   // callsign en Morse

    successBox.textContent = `🛰️ CONEXIÓN RESTABLECIDA · Reproduciendo mensaje de ${artifact.name}…`;
    successBox.style.display = 'block';

    // Mensaje de voz del rover: first_person_story.voice_text del JSON
    speak(artifact.first_person_story?.voice_text || '');

    // La insignia la otorga el sistema global (igual que la trivia)
    if (!alreadyEarned) {
      document.dispatchEvent(new CustomEvent('echo:badge-earned', { detail: { id: artifact.id } }));
    }
  }

  /* ---------- Subtítulos sincronizados con la voz ----------
     Cada palabra se ilumina al ritmo exacto del habla gracias al
     evento `boundary` de SpeechSynthesis (estilo karaoke).       */
  function speak(text) {
    if (!text) return;

    if (!('speechSynthesis' in window)) {
      // Fallback: mostrar el texto completo sin sincronía
      captionsBox.textContent = text;
      captionsBox.style.display = 'block';
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

    // El navegador avisa justo cuando empieza CADA palabra
    utterance.onboundary = (e) => {
      if (e.charIndex == null) return;
      const spoken = words.find((w) => e.charIndex >= w.start && e.charIndex < w.end);
      if (spoken && spoken !== current.word) {
        current.word = spoken;
        render();
        // Desplaza la vista para que la palabra activa siempre se vea
        const mark = captionsBox.querySelector('mark');
        if (mark) mark.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    };
    utterance.onend = () => {
      current.word = null;
      render();
      captionsBox.insertAdjacentHTML('beforeend',
        '<span class="st-caption-end">— fin de transmisión · eco registrado —</span>');
    };

    captionsBox.style.display = 'block';
    speechSynthesis.speak(utterance);
  }

  /* ---------- Cierre y limpieza ---------- */
  function close() {
    cancelAnimationFrame(raf);
    if (staticNodes) {
      try { staticNodes.src.stop(); } catch (_) { /* ya detenido */ }
      staticNodes = null;
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    document.removeEventListener('keydown', escHandler);
    overlay.remove();
  }
  function escHandler(e) { if (e.key === 'Escape') close(); }

  overlay.querySelector('[data-action="close"]').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', escHandler);

  document.body.appendChild(overlay);
  slider.focus();
  raf = requestAnimationFrame(draw);
}

/* ---------- Utilidades: descomponer un color hex ---------- */
function hexR(hex) { return parseInt(hex.slice(1, 3), 16) || 76; }
function hexG(hex) { return parseInt(hex.slice(3, 5), 16) || 201; }
function hexB(hex) { return parseInt(hex.slice(5, 7), 16) || 240; }
