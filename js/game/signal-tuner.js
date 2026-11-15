/* ============================================================
   ECHOES OF SOL · game/signal-tuner.js
   Minijuego "Restaurar la Frecuencia" (Priscila · Prompt 4)
   ------------------------------------------------------------
   1. Dial de 100 a 500 MHz; frecuencia propia por artefacto (±5).
   2. Onda de canvas que se limpia al acercarse al objetivo.
   3. Estática sonora continua con Web Audio API (volumen ∝ distancia).
   4. Al sincronizar: chime + Morse + audio narrado local con
      marcas de tiempo para resaltar cada palabra.
   ============================================================ */
import { soundscape } from '../audio/soundscape.js';
import { openTrivia } from './trivia.js';
import { FREQ_MIN, FREQ_MAX, MARGIN, targetFrequency } from './frequencies.js';
import { isArtifactCompleted } from './progress.js';

/* ---------- Configuración del juego (según Prompt 4) ---------- */
const VOICE_TRACKS_URL = 'data/voice_tracks.json';

let voiceTracksManifestPromise = null;

async function loadVoiceTrack(id) {
  if (!voiceTracksManifestPromise) {
    voiceTracksManifestPromise = fetch(VOICE_TRACKS_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`No se pudo cargar el índice de voces (${response.status})`);
        return response.json();
      })
      .catch((error) => {
        voiceTracksManifestPromise = null;
        throw error;
      });
  }

  const manifest = await voiceTracksManifestPromise;
  const track = manifest[id];
  if (!track?.audio || !Array.isArray(track.words)) {
    throw new Error(`No existe una pista de voz válida para ${id}`);
  }
  return track;
}

/* Callsign por artefacto (igual que trivia.js) */
const CALLSIGNS = {
  'apollo-11-descent-stage': 'EAGLE',
  'surveyor-3': 'SURVEYOR',
  'apollo-15-lrv': 'FALCON',
  'apollo-alsep-lrrr': 'ALSEP',
  'apollo17-lrv': 'CHALLENGER',
  'viking-1-lander': 'VIKING',
  'viking2-lander': 'VIKING-2',
  'pathfinder-sojourner': 'SOJOURNER',
  'spirit-mer-a': 'SPIRIT',
  'opportunity-mer-b': 'OPPY',
  'phoenix-lander': 'PHOENIX',
  'insight-lander': 'INSIGHT',
  'ingenuity-helicopter': 'INGENUITY',
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
      width: 90vw;
      max-height: 85vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--echo-accent) transparent;
      background: var(--panel-strong);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: clamp(1rem, 4vw, 1.75rem);
      box-shadow: 0 0 40px rgba(76, 201, 240, 0.15);
    }
    .st-card::-webkit-scrollbar { width: 10px; }
    .st-card::-webkit-scrollbar-track { background: rgba(76, 201, 240, 0.06); border-radius: 8px; }
    .st-card::-webkit-scrollbar-thumb { background: var(--echo-accent); border-radius: 8px; }
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
      font-size: 1.2rem; line-height: 1.7; color: var(--text);
      max-height: min(55vh, 560px); overflow-y: auto;
    }
    /* Cursor lateral temático para la caja de subtítulos (añadido, no modifica lo existente) */
    .st-captions {
      scrollbar-width: thin;
      scrollbar-color: var(--echo-accent) transparent;
    }
    .st-captions::-webkit-scrollbar { width: 8px; }
    .st-captions::-webkit-scrollbar-track { background: rgba(76, 201, 240, 0.06); border-radius: 8px; }
    .st-captions::-webkit-scrollbar-thumb { background: var(--echo-accent); border-radius: 8px; }
    .st-captions mark,
    .st-captions .st-word.is-speaking {
      background: var(--echo-accent); color: #04070f;
      border-radius: 3px; padding: 0 2px; font-weight: 700;
    }
    .st-captions .st-caption-end {
      display: block; margin-top: 0.5rem;
      font-family: var(--font-mono); font-size: 0.65rem;
      letter-spacing: 0.2em; color: var(--muted); text-transform: uppercase;
    }
    .st-narration { display: block; width: 100%; margin-top: 0.75rem; }
    .st-narration[hidden] { display: none; }
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
function quality(freq, target) {
  const maxDistance = Math.max(target - FREQ_MIN, FREQ_MAX - target);
  return Math.max(0, 1 - Math.abs(freq - target) / maxDistance);
}

/**
 * Abre el minijuego de sintonización para un artefacto.
 * @param {object} artifact - registro de equipment_data.json
 * @param {boolean} alreadyEarned - si la insignia ya fue ganada
 */
export function openSignalTuner(artifact, alreadyEarned = false) {
  injectStyles();
  const target = targetFrequency(artifact.id);
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--echo-accent').trim() || '#4cc9f0';

  const overlay = document.createElement('div');
  overlay.className = 'st-overlay';
  overlay.innerHTML = `
    <div class="st-card" role="dialog" aria-modal="true" aria-label="Minijuego de restauración de frecuencia de ${artifact.name}">
      <p class="st-kicker"><span class="st-led"></span> RESTAURANDO ENLACE · ${artifact.id.replace(/-/g, ' ').toUpperCase()}</p>
      <h3 class="st-title">Restaurar la Frecuencia</h3>
      <p class="st-desc">El transmisor de <strong>${artifact.name}</strong> quedó en silencio en ${artifact.site || 'su sitio'}. Cada artefacto tiene una frecuencia propia. Mueve el dial: la estática se limpiará al acercarte. Si mantienes la frecuencia correcta durante un segundo, escucharás su mensaje.</p>

      <canvas class="st-canvas" width="640" height="150" aria-hidden="true"></canvas>
      <div class="st-readout" aria-live="polite"><span class="st-value">100.0</span> <small>MHz</small></div>

      <input type="range" class="st-dial" min="${FREQ_MIN}" max="${FREQ_MAX}" step="0.5" value="${FREQ_MIN}"
             aria-label="Frecuencia del dial en megahercios" />
      <div class="st-scale"><span>100</span><span>300</span><span>500 MHz</span></div>

      <div class="st-feedback" aria-live="polite"></div>

      <div class="st-actions">
        <button type="button" class="st-btn ghost" data-action="sound" aria-pressed="false">🔊 Estática</button>
        <button type="button" class="st-btn ghost" data-action="close">Cerrar</button>
      </div>

      <div class="st-success" role="status"></div>
      <button type="button" class="st-btn primary" data-action="play-voice" hidden>▶ ESCUCHAR RELATO</button>
      <audio class="st-narration" controls preload="auto" hidden aria-label="Narración del artefacto"></audio>
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
  const playVoiceBtn = overlay.querySelector('[data-action="play-voice"]');
  const voicePlayer = overlay.querySelector('.st-narration');
  const captionsBox = overlay.querySelector('.st-captions');
  const soundBtn = overlay.querySelector('[data-action="sound"]');
  const artifactImage = new Image();
  if (artifact.image) artifactImage.src = artifact.image;

  /* ---------- Estado ---------- */
  let raf = 0;
  let synced = false;
  let narrationStarted = false;
  let staticOn = false;
  let lockTimer = null;
  let voiceWords = [];
  let voiceWordElements = [];
  let activeVoiceMark = null;
  let activeVoiceWordIndex = -1;
  let staticNodes = null; // { src, band, gain, carrier, carrierGain }

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

    const carrier = ctx.createOscillator();              // tono reconocible al acercarse
    carrier.type = 'sine';
    carrier.frequency.value = 440;
    const carrierGain = ctx.createGain();
    carrierGain.gain.value = 0;

    src.connect(band).connect(gain).connect(master);
    carrier.connect(carrierGain).connect(master);
    src.start();
    carrier.start();
    staticNodes = { src, band, gain, carrier, carrierGain };
  }

  function updateStatic(freq) {
    if (!staticOn || !staticNodes || !soundscape.ctx) return;
    const q = quality(freq, target);
    const t = soundscape.ctx.currentTime;
    const noise = (1 - q) ** 1.7;

    // Lejos domina un siseo áspero; cerca cae el ruido y emerge el tono.
    staticNodes.gain.gain.setTargetAtTime(0.015 + noise * 0.25, t, 0.08);
    staticNodes.band.frequency.setTargetAtTime(700 + q * 1800, t, 0.08);
    staticNodes.band.Q.setTargetAtTime(0.65 + q * 7, t, 0.08);
    staticNodes.carrier.frequency.setTargetAtTime(360 + q * 240, t, 0.08);
    staticNodes.carrierGain.gain.setTargetAtTime(0.01 + q * 0.11, t, 0.08);
  }

  function setStatic(on) {
    staticOn = on;
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.textContent = on ? '🔇 Silenciar' : '🔊 Estática';
    if (on) {
      try {
        ensureStatic();
        // Habilita también los tonos de confirmación y el Morse.
        if (!soundscape.enabled) {
          soundscape.enabled = true;
          document.dispatchEvent(new CustomEvent('echo:audio-state', { detail: { enabled: true } }));
        }
        updateStatic(parseFloat(slider.value));
      } catch (_) {
        staticOn = false;
        soundBtn.setAttribute('aria-pressed', 'false');
        soundBtn.textContent = '🔊 Estática';
        feedback.textContent = 'El audio no está disponible en este navegador.';
      }
    } else if (staticNodes) {
      staticNodes.gain.gain.setTargetAtTime(0, soundscape.ctx.currentTime, 0.03);
      staticNodes.carrierGain.gain.setTargetAtTime(0, soundscape.ctx.currentTime, 0.03);
    }
  }

  function renderVoiceTranscript(words) {
    voiceWords = words;
    voiceWordElements = words.map((word) => {
      const element = document.createElement('span');
      element.className = 'st-word';
      element.textContent = word.text;
      return element;
    });
    const transcript = document.createDocumentFragment();
    voiceWordElements.forEach((element, index) => {
      if (index) transcript.appendChild(document.createTextNode(' '));
      transcript.appendChild(element);
    });
    captionsBox.replaceChildren(transcript);
    captionsBox.style.display = 'block';
    activeVoiceWordIndex = -1;
  }

  function updateVoiceHighlight() {
    if (voicePlayer.paused || !voiceWords.length) return;
    const elapsed = voicePlayer.currentTime;
    let low = 0;
    let high = voiceWords.length - 1;
    let activeIndex = -1;

    while (low <= high) {
      const middle = (low + high) >> 1;
      if (voiceWords[middle].start <= elapsed) {
        activeIndex = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    if (activeIndex === activeVoiceWordIndex) return;
    if (activeVoiceWordIndex >= 0) {
      voiceWordElements[activeVoiceWordIndex].classList.remove('is-speaking');
      voiceWordElements[activeVoiceWordIndex].removeAttribute('aria-current');
    }
    activeVoiceWordIndex = activeIndex;
    if (activeIndex >= 0) {
      const activeWord = voiceWordElements[activeIndex];
      activeWord.classList.add('is-speaking');
      activeWord.setAttribute('aria-current', 'true');
      const wordRect = activeWord.getBoundingClientRect();
      const captionRect = captionsBox.getBoundingClientRect();
      if (wordRect.top < captionRect.top || wordRect.bottom > captionRect.bottom) {
        captionsBox.scrollTop += wordRect.top - captionRect.top
          - (captionsBox.clientHeight - wordRect.height) / 2;
      }
    }
  }

  /* ---------- Osciloscopio en canvas ---------- */
  function draw() {
    const freq = parseFloat(slider.value);
    const q = quality(freq, target);
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

    updateVoiceHighlight();
    raf = requestAnimationFrame(draw);
  }

  /* ---------- Dial ---------- */
  slider.addEventListener('input', () => {
    const freq = parseFloat(slider.value);
    valueEl.textContent = freq.toFixed(1);
    updateStatic(freq);

    if (lockTimer !== null) {
      clearTimeout(lockTimer);
      lockTimer = null;
    }

    if (Math.abs(freq - target) <= MARGIN) {
      feedback.textContent = '✓ Señal localizada · mantén el dial quieto durante 1 segundo…';
      lockTimer = window.setTimeout(() => {
        lockTimer = null;
        if (!synced && Math.abs(parseFloat(slider.value) - target) <= MARGIN) succeed();
      }, 1000);
    } else {
      feedback.textContent = 'Señal débil · sigue moviendo el dial hasta limpiar la onda.';
    }
  });

  /* ---------- Botones ---------- */
  soundBtn.addEventListener('click', () => setStatic(!staticOn));
  playVoiceBtn.addEventListener('click', async () => {
    try {
      voicePlayer.currentTime = 0;
      await voicePlayer.play();
    } catch (_) {
      feedback.textContent = 'No se pudo iniciar el audio. Prueba ▶ en el reproductor.';
    }
  });

  /* ---------- Éxito: conexión restablecida ---------- */
  function succeed() {
    if (synced) return;
    synced = true;
    slider.disabled = true;
    if (staticNodes && soundscape.ctx) {
      staticNodes.gain.gain.setTargetAtTime(0, soundscape.ctx.currentTime, 0.03);
      staticNodes.carrierGain.gain.setTargetAtTime(0, soundscape.ctx.currentTime, 0.03);
    }

    soundscape.chime();                                   // armonía de éxito
    soundscape.morse(CALLSIGNS[artifact.id] || 'ECHO');   // callsign en Morse

    feedback.textContent = '✓ Frecuencia estable durante 1 segundo.';
    successBox.textContent = `🛰️ CONEXIÓN RESTABLECIDA · Escucha el mensaje de ${artifact.name}…`;
    successBox.style.display = 'block';

    // Narración MP3 local con tiempos de palabra incluidos en voice_tracks.json.
    speak(artifact.first_person_story?.voice_text || '');

    // La trivia otorga la insignia al responder correctamente.
  }

  /* ---------- Reproducción local + subtítulos cronometrados ---------- */
  async function speak(text) {
    if (!text) {
      captionsBox.textContent = 'No hay un mensaje de voz disponible para este eco.';
      captionsBox.style.display = 'block';
      addTriviaAction();
      return;
    }

    captionsBox.style.display = 'block';
    captionsBox.textContent = 'Cargando la transmisión de voz…';
    narrationStarted = true;

    try {
      const track = await narrationPromise;
      if (!track) throw new Error('Pista de voz no disponible');
      if (!overlay.isConnected) return;

      renderVoiceTranscript(track.words);
      playVoiceBtn.hidden = false;
      voicePlayer.hidden = false;
      voicePlayer.volume = 1;
      voicePlayer.currentTime = 0;
      voicePlayer.onplay = () => {
        playVoiceBtn.textContent = '↻ REPETIR RELATO';
      };
      voicePlayer.onended = () => {
        if (activeVoiceWordIndex >= 0) {
          voiceWordElements[activeVoiceWordIndex].classList.remove('is-speaking');
          voiceWordElements[activeVoiceWordIndex].removeAttribute('aria-current');
        }
        activeVoiceWordIndex = -1;
        const ending = document.createElement('span');
        ending.className = 'st-caption-end';
        ending.textContent = '— fin de transmisión · eco registrado —';
        captionsBox.appendChild(ending);
        addTriviaAction();
      };
      voicePlayer.onerror = () => {
        feedback.textContent = 'No se pudo reproducir el MP3 local. Usa los subtítulos y continúa con el desafío.';
        addTriviaAction();
      };

      try {
        await voicePlayer.play();
      } catch (_) {
        playVoiceBtn.textContent = '▶ INICIAR RELATO';
        playVoiceBtn.style.boxShadow = '0 0 20px var(--echo-accent)';
        feedback.textContent = 'El audio está listo: pulsa ▶ INICIAR RELATO para escucharlo.';
      }
    } catch (error) {
      console.error('[Echoes of Sol] No se pudo reproducir la voz:', error);
      captionsBox.textContent = `${text} · No se pudo cargar el audio local.`;
      addTriviaAction();
    }
  }

  function addTriviaAction() {
    if (!overlay.isConnected || overlay.querySelector('[data-action="go-trivia"]')) return;

    const triviaBtn = document.createElement('button');
    triviaBtn.type = 'button';
    triviaBtn.className = 'st-btn primary';
    triviaBtn.dataset.action = 'go-trivia';
    triviaBtn.textContent = '🧩 RESPONDER DESAFÍO TRIVIA ➜';
    triviaBtn.addEventListener('click', () => {
      close();
      openTrivia(artifact, alreadyEarned || isArtifactCompleted(artifact.id));
    });
    overlay.querySelector('.st-actions')?.appendChild(triviaBtn);
  }

  /* ---------- Cierre y limpieza ---------- */
  function close() {
    cancelAnimationFrame(raf);
    if (lockTimer !== null) clearTimeout(lockTimer);
    voicePlayer.pause();
    voicePlayer.onended = null;
    voicePlayer.onerror = null;
    voicePlayer.removeAttribute('src');
    voicePlayer.load();
    if (staticNodes) {
      try { staticNodes.src.stop(); } catch (_) { /* ya detenido */ }
      try { staticNodes.carrier.stop(); } catch (_) { /* ya detenido */ }
      staticNodes = null;
    }
    document.removeEventListener('keydown', escHandler);
    overlay.remove();
  }
  function escHandler(e) { if (e.key === 'Escape') close(); }

  overlay.querySelector('[data-action="close"]').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', escHandler);

  document.body.appendChild(overlay);
  // El botón que abrió este panel es un gesto del usuario: activa aquí el audio.
  setStatic(true);
  const narrationPromise = loadVoiceTrack(artifact.id)
    .then((track) => {
      voicePlayer.src = track.audio;
      voicePlayer.load();
      return track;
    })
    .catch((error) => {
      console.error('[Echoes of Sol] No se pudo preparar el audio:', error);
      return null;
    });
  slider.focus();
  raf = requestAnimationFrame(draw);
}

/* ---------- Utilidades: descomponer un color hex ---------- */
function hexR(hex) { return parseInt(hex.slice(1, 3), 16) || 76; }
function hexG(hex) { return parseInt(hex.slice(3, 5), 16) || 201; }
function hexB(hex) { return parseInt(hex.slice(5, 7), 16) || 240; }
