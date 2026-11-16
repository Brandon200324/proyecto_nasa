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
import { t, getLang, setLang, localizeArtifact } from '../i18n.js';

/* ---------- Configuración del juego (según Prompt 4) ---------- */
const voiceManifests = new Map();
async function loadVoiceTrack(id, lang) {
  if (!voiceManifests.has(lang)) {
    const file = `data/voice_tracks${lang === 'en' ? '_en' : ''}.json`;
    voiceManifests.set(lang, fetch(file).then((response) => response.ok ? response.json() : null)
      .catch(() => { voiceManifests.delete(lang); return null; }));
  }
  const manifest = await voiceManifests.get(lang);
  const track = manifest?.[id];
  return track?.audio && Array.isArray(track.words) && track.words.length ? track : null;
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));
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
  artifact = localizeArtifact(artifact);
  const target = targetFrequency(artifact.id);
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--echo-accent').trim() || '#4cc9f0';
  const overlay = document.createElement('div');
  overlay.className = 'st-overlay';
  overlay.innerHTML = `
    <div class="st-card" role="dialog" aria-modal="true">
      <p class="st-kicker"><span class="st-led"></span><span class="st-kicker-text"></span>
        <button type="button" class="hud-lang-btn" data-action="language"><span class="lang-icon" aria-hidden="true">🌐</span><span class="lang-code"></span></button>
      </p>
      <h3 class="st-title"></h3>
      <p class="st-desc"></p>
      <canvas class="st-canvas" width="640" height="150" aria-hidden="true"></canvas>
      <div class="st-readout" aria-live="polite"><span class="st-value">100.0</span> <small>MHz</small></div>
      <input type="range" class="st-dial" min="${FREQ_MIN}" max="${FREQ_MAX}" step="0.5" value="${FREQ_MIN}" />
      <div class="st-scale"><span>100</span><span>300</span><span>500 MHz</span></div>
      <div class="st-feedback" aria-live="polite"></div>
      <div class="st-actions">
        <button type="button" class="st-btn ghost" data-action="sound" aria-pressed="false"></button>
        <button type="button" class="st-btn ghost" data-action="close"></button>
      </div>
      <div class="st-success" role="status"></div>
      <h4 class="st-story-title" hidden></h4>
      <button type="button" class="st-btn primary" data-action="play-voice" hidden></button>
      <audio class="st-narration" controls preload="auto" hidden></audio>
      <p class="st-captions" aria-live="polite"></p>
    </div>`;

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
  let raf = 0;
  let synced = false;
  let staticOn = false;
  let lockTimer = null;
  let voiceWords = [];
  let voiceWordElements = [];
  let activeVoiceWordIndex = -1;
  let staticNodes = null;
  let feedbackKey = '';
  let voiceButtonKey = 'tuner.listen';
  let narrationState = 'idle';
  let narrationVersion = 0;
  let utterance = null;
  let speechStartedAt = 0;
  let hasSpeechBoundaries = false;
  // Prefetch the current-language manifest during tuning; never play Spanish in English mode.
  loadVoiceTrack(artifact.id, getLang());

  function setFeedback(key) {
    feedbackKey = key;
    feedback.textContent = key ? t(key) : '';
  }

  function renderLabels() {
    artifact = localizeArtifact(artifact);
    overlay.querySelector('.st-card').setAttribute('aria-label', t('tuner.dialog', { name: artifact.name }));
    overlay.querySelector('.st-kicker-text').textContent = t('tuner.kicker', { name: artifact.name });
    overlay.querySelector('.st-title').textContent = t('tuner.title');
    overlay.querySelector('.st-desc').innerHTML = t('tuner.description', {
      name: escapeHtml(artifact.name), site: escapeHtml(artifact.site || t('tuner.site')),
    });
    slider.setAttribute('aria-label', t('tuner.dial'));
    voicePlayer.setAttribute('aria-label', t('tuner.narration', { name: artifact.name }));
    soundBtn.textContent = t(staticOn ? 'tuner.mute' : 'tuner.static');
    overlay.querySelector('[data-action="close"]').textContent = t('tuner.close');
    const languageButton = overlay.querySelector('[data-action="language"]');
    languageButton.setAttribute('aria-label', t('language.switch'));
    languageButton.title = t('language.switch');
    languageButton.querySelector('.lang-code').textContent = getLang() === 'es' ? 'EN' : 'ES';
    feedback.textContent = feedbackKey ? t(feedbackKey) : '';
    playVoiceBtn.textContent = t(voiceButtonKey);
    successBox.textContent = synced ? t('tuner.connected', { name: artifact.name }) : '';
    const storyTitle = overlay.querySelector('.st-story-title');
    storyTitle.hidden = !synced;
    storyTitle.textContent = synced ? `${t('marker.monologue')} · ${artifact.first_person_story?.title || ''}` : '';
    const triviaButton = overlay.querySelector('[data-action="go-trivia"]');
    if (triviaButton) triviaButton.textContent = t('tuner.trivia');
  }

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
    soundBtn.textContent = t(on ? 'tuner.mute' : 'tuner.static');
    if (on) {
      try {
        ensureStatic();
        if (!soundscape.enabled) {
          soundscape.enabled = true;
          document.dispatchEvent(new CustomEvent('echo:audio-state', { detail: { enabled: true } }));
        }
        updateStatic(parseFloat(slider.value));
      } catch (_) {
        staticOn = false;
        soundBtn.setAttribute('aria-pressed', 'false');
        soundBtn.textContent = t('tuner.static');
        setFeedback('tuner.audioUnavailable');
      }
    } else if (staticNodes) {
      staticNodes.gain.gain.setTargetAtTime(0, soundscape.ctx.currentTime, 0.03);
      staticNodes.carrierGain.gain.setTargetAtTime(0, soundscape.ctx.currentTime, 0.03);
    }
  }

  function transcriptWords() {
    return Array.from((artifact.first_person_story?.voice_text || '').matchAll(/\S+/g),
      (match) => ({ text: match[0], charIndex: match.index }));
  }

  function highlight(index) {
    if (index === activeVoiceWordIndex) return;
    if (activeVoiceWordIndex >= 0) {
      voiceWordElements[activeVoiceWordIndex]?.classList.remove('is-speaking');
      voiceWordElements[activeVoiceWordIndex]?.removeAttribute('aria-current');
    }
    activeVoiceWordIndex = index;
    const word = voiceWordElements[index];
    if (!word) return;
    word.classList.add('is-speaking');
    word.setAttribute('aria-current', 'true');
    const rect = word.getBoundingClientRect();
    const box = captionsBox.getBoundingClientRect();
    if (rect.top < box.top || rect.bottom > box.bottom) {
      captionsBox.scrollTop += rect.top - box.top - (captionsBox.clientHeight - rect.height) / 2;
    }
  }

  function renderVoiceTranscript(words) {
    highlight(-1);
    voiceWords = words;
    const fragment = document.createDocumentFragment();
    voiceWordElements = words.map((word, index) => {
      if (index) fragment.appendChild(document.createTextNode(' '));
      const element = document.createElement('span');
      element.className = 'st-word';
      element.textContent = word.text;
      fragment.appendChild(element);
      return element;
    });
    captionsBox.replaceChildren(fragment);
    captionsBox.style.display = 'block';
    captionsBox.scrollTop = 0;
  }

  function updateVoiceHighlight() {
    if (narrationState !== 'playing') return;
    if (utterance) {
      // Word boundaries are authoritative. Estimate only on engines without boundary events.
      if (!hasSpeechBoundaries && speechStartedAt) {
        const index = Math.min(voiceWords.length - 1, Math.floor((performance.now() - speechStartedAt) / 375));
        highlight(index);
      }
      return;
    }
    if (voicePlayer.paused || !voiceWords.length) return;
    let low = 0, high = voiceWords.length - 1, index = -1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      if (voiceWords[middle].start <= voicePlayer.currentTime) { index = middle; low = middle + 1; }
      else high = middle - 1;
    }
    highlight(index);
  }

  function cancelNarration() {
    narrationVersion++;
    voicePlayer.onplay = null;
    voicePlayer.onended = null;
    voicePlayer.onerror = null;
    voicePlayer.pause();
    voicePlayer.removeAttribute('src');
    voicePlayer.load();
    if (utterance) {
      utterance.onstart = utterance.onend = utterance.onerror = utterance.onboundary = null;
      window.speechSynthesis?.cancel();
      utterance = null;
    }
    highlight(-1);
    speechStartedAt = 0;
    voicePlayer.hidden = true;
  }

  function finishNarration(unavailable = false) {
    narrationState = unavailable ? 'unavailable' : 'finished';
    highlight(-1);
    captionsBox.querySelector('.st-caption-end')?.remove();
    const ending = document.createElement('span');
    ending.className = 'st-caption-end';
    ending.textContent = t(unavailable ? 'tuner.speechUnavailable' : 'tuner.end');
    captionsBox.appendChild(ending);
    if (unavailable) setFeedback('tuner.speechUnavailable');
    addTriviaAction();
  }

  function browserSpeech(text, version) {
    renderVoiceTranscript(transcriptWords());
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      finishNarration(true);
      return;
    }
    const speech = new SpeechSynthesisUtterance(text);
    utterance = speech; // Keep a strong reference until completion/cancellation.
    speech.lang = getLang() === 'en' ? 'en-US' : 'es-ES';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => item.lang.toLowerCase() === speech.lang.toLowerCase())
      || voices.find((item) => item.lang.toLowerCase().startsWith(getLang()));
    if (voice) speech.voice = voice;
    speech.rate = 1;
    hasSpeechBoundaries = false;
    speech.onstart = () => {
      if (version !== narrationVersion) return;
      narrationState = 'playing';
      speechStartedAt = performance.now();
      voiceButtonKey = 'tuner.replay';
      playVoiceBtn.textContent = t(voiceButtonKey);
      highlight(0);
    };
    speech.onboundary = (event) => {
      if (version !== narrationVersion || event.name === 'sentence') return;
      hasSpeechBoundaries = true;
      const index = voiceWords.findIndex((word, i) => word.charIndex <= event.charIndex
        && (i === voiceWords.length - 1 || voiceWords[i + 1].charIndex > event.charIndex));
      highlight(index);
    };
    speech.onend = () => { if (version === narrationVersion) { utterance = null; finishNarration(); } };
    speech.onerror = () => { if (version === narrationVersion) { utterance = null; finishNarration(true); } };
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    } catch (_) { utterance = null; finishNarration(true); }
  }

  async function playNarration() {
    if (!synced || !overlay.isConnected) return;
    cancelNarration();
    const version = narrationVersion;
    const lang = getLang();
    const text = artifact.first_person_story?.voice_text || '';
    narrationState = 'loading';
    captionsBox.style.display = 'block';
    captionsBox.textContent = t('tuner.loading');
    playVoiceBtn.hidden = false;
    voiceButtonKey = 'tuner.start';
    playVoiceBtn.textContent = t(voiceButtonKey);
    overlay.querySelector('[data-action="go-trivia"]')?.remove();
    if (!text) { captionsBox.textContent = t('tuner.empty'); finishNarration(true); return; }
    const track = await loadVoiceTrack(artifact.id, lang);
    if (!overlay.isConnected || version !== narrationVersion || lang !== getLang()) return;
    if (!track) { browserSpeech(text, version); return; }
    renderVoiceTranscript(track.words);
    voicePlayer.src = track.audio;
    voicePlayer.hidden = false;
    voicePlayer.volume = 1;
    let fallbackStarted = false;
    voicePlayer.onplay = () => {
      if (version !== narrationVersion) return;
      narrationState = 'playing';
      captionsBox.querySelector('.st-caption-end')?.remove();
      voiceButtonKey = 'tuner.replay';
      playVoiceBtn.textContent = t(voiceButtonKey);
    };
    voicePlayer.onended = () => { if (version === narrationVersion) finishNarration(); };
    voicePlayer.onerror = () => {
      if (version !== narrationVersion) return;
      // Keep narration usable if an optional local audio file cannot be decoded.
      fallbackStarted = true;
      voicePlayer.pause();
      voicePlayer.hidden = true;
      browserSpeech(text, version);
    };
    try { await voicePlayer.play(); }
    catch (_) {
      if (version !== narrationVersion || fallbackStarted) return;
      narrationState = 'ready';
      setFeedback('tuner.ready');
    }
  }

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

  slider.addEventListener('input', () => {
    const freq = parseFloat(slider.value);
    valueEl.textContent = freq.toFixed(1);
    updateStatic(freq);
    if (lockTimer !== null) { clearTimeout(lockTimer); lockTimer = null; }
    if (Math.abs(freq - target) <= MARGIN) {
      setFeedback('tuner.located');
      lockTimer = window.setTimeout(() => {
        lockTimer = null;
        if (!synced && Math.abs(parseFloat(slider.value) - target) <= MARGIN) succeed();
      }, 1000);
    } else setFeedback('tuner.weak');
  });

  soundBtn.addEventListener('click', () => setStatic(!staticOn));
  playVoiceBtn.addEventListener('click', playNarration);
  overlay.querySelector('[data-action="language"]').addEventListener('click', () => setLang(getLang() === 'es' ? 'en' : 'es'));

  function succeed() {
    if (synced) return;
    synced = true;
    slider.disabled = true;
    setStatic(false);
    soundscape.chime();
    soundscape.morse(CALLSIGNS[artifact.id] || 'ECHO');
    setFeedback('tuner.stable');
    successBox.textContent = t('tuner.connected', { name: artifact.name });
    successBox.style.display = 'block';
    renderLabels();
    playNarration();
  }

  function addTriviaAction() {
    if (!overlay.isConnected || overlay.querySelector('[data-action="go-trivia"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'st-btn primary';
    button.dataset.action = 'go-trivia';
    button.textContent = t('tuner.trivia');
    button.addEventListener('click', () => {
      close();
      openTrivia(artifact, alreadyEarned || isArtifactCompleted(artifact.id));
    });
    overlay.querySelector('.st-actions').appendChild(button);
  }

  function onLanguage() {
    const previousState = narrationState;
    renderLabels();
    if (!synced) { loadVoiceTrack(artifact.id, getLang()); return; }
    if (['finished', 'unavailable'].includes(previousState)) {
      cancelNarration();
      renderVoiceTranscript(transcriptWords());
      finishNarration(previousState === 'unavailable');
    } else playNarration();
  }

  function close() {
    cancelAnimationFrame(raf);
    if (lockTimer !== null) clearTimeout(lockTimer);
    cancelNarration();
    if (staticNodes) {
      try { staticNodes.src.stop(); } catch (_) { /* Already stopped. */ }
      try { staticNodes.carrier.stop(); } catch (_) { /* Already stopped. */ }
      staticNodes = null;
    }
    document.removeEventListener('keydown', escHandler);
    document.removeEventListener('echo:lang-changed', onLanguage);
    overlay.remove();
  }
  function escHandler(event) { if (event.key === 'Escape') close(); }
  overlay.querySelector('[data-action="close"]').addEventListener('click', close);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', escHandler);
  document.addEventListener('echo:lang-changed', onLanguage);
  document.body.appendChild(overlay);
  renderLabels();
  setStatic(true);
  slider.focus();
  raf = requestAnimationFrame(draw);
}

/* ---------- Utilidades: descomponer un color hex ---------- */
function hexR(hex) { return parseInt(hex.slice(1, 3), 16) || 76; }
function hexG(hex) { return parseInt(hex.slice(3, 5), 16) || 201; }
function hexB(hex) { return parseInt(hex.slice(5, 7), 16) || 240; }
