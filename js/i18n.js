/* Native ES/EN interface and catalog loading. Progress always uses stable IDs. */
export const messages = {
  es: {
    'page.title': 'Echoes of Sol · Abandoned but not Forgotten',
    'page.description': 'Echoes of Sol — Relatos interactivos del equipamiento que permanece en la Luna y Marte. NASA Space Apps Challenge 2026.',
    'language.switch': 'Cambiar a inglés / Switch to English',
    'header.home': 'Echoes of Sol, inicio',
    'header.manual': '📖 MANUAL',
    'header.badges': 'Trivias completadas',
    'header.audio': 'Control de audio',
    'preloader.title': 'ESTABLECIENDO ENLACE PROFUNDO…',
    'preloader.subtitle': 'sintonizando frecuencias lunares y marcianas',
    'intro.label': 'Introducción',
    'intro.kicker1': 'NASA SPACE APPS CHALLENGE 2026<br>«Abandoned but not Forgotten»',
    'intro.title1': 'El silencio<em>también habla</em>',
    'intro.text1': 'En la Luna y en Marte quedaron atrás rovers, landers y etapas de descenso. Máquinas con nombre, con misión y con historias que merecen ser escuchadas otra vez.',
    'intro.kicker2': 'NO SON CHATARRA ESPACIAL',
    'intro.title2': 'Son <em>monumentos</em>',
    'intro.text2': 'Cada uno fue dejado en el lugar exacto donde cumplió su deber. Sus «huesos de metal» son testigos eternos de la curiosidad humana.',
    'intro.kicker3': 'TU MISIÓN COMO OPERADOR',
    'intro.title3': 'Restaura <em>su señal</em>',
    'intro.text3': 'Gira los mundos, encuentra cada eco y escucha sus monólogos en primera persona. Responde su trivia y repara el enlace de comunicaciones para ganar tu insignia.',
    'intro.enter': 'ENTRAR AL CONSULTORIO ORBITAL ↓',
    'explorer.label': 'Globos 3D de la Luna y Marte',
    'explorer.title': 'CONSULTORIO <em>ORBITAL</em>',
    'explorer.tabs': 'Seleccionar cuerpo celeste',
    'explorer.mars': '♂ MARTE',
    'explorer.moon': '☾ LUNA',
    'explorer.globe': 'Globo 3D interactivo con marcadores de aterrizaje',
    'explorer.hint': 'Arrastra para rotar · Rueda para acercar · Clic en un marcador <span class="pulse-dot">✦</span>',
    'body.moon': 'Luna',
    'body.mars': 'Marte',
    'mission.Rover': 'Róver',
    'mission.Lander': 'Módulo de aterrizaje',
    'mission.Descent Stage': 'Etapa de descenso',
    'mission.Science Package': 'Paquete científico',
    'mission.Helicopter': 'Helicóptero',
    'mission.default': 'Equipo',
    'marker.dialog': 'Ficha de {name}',
    'marker.close': 'Cerrar ficha',
    'marker.photoAlt': 'Imagen real de la NASA: {name}',
    'marker.photoCaption': '📷 Foto real · NASA ({body})',
    'marker.landing': 'ATERRIZAJE',
    'marker.contact': 'ÚLTIMA SEÑAL',
    'marker.duration': 'DURACIÓN',
    'marker.status': 'ESTADO',
    'marker.monologue': 'MONÓLOGO EN PRIMERA PERSONA',
    'marker.hardware': 'Hardware que permanece en el lugar',
    'marker.legacy': 'LEGADO CIENTÍFICO',
    'marker.breakthrough': 'Hito',
    'marker.impact': 'Impacto en la Tierra',
    'marker.complete': '✅ Trivia respondida correctamente',
    'marker.pending': 'Trivia pendiente · sintoniza la voz para continuar',
    'marker.tune': '📡 SINTONIZAR VOZ ▸',
    'audio.enable': 'Activar sonido ambiental espacial (Web Audio)',
    'audio.mute': 'Silenciar sonido ambiental espacial',
    'audio.title': 'Sonido ambiental espacial (Web Audio)',
    'badge.title': 'Trivias respondidas correctamente',
    'badge.suffix': 'ECOS',
    'badge.toast': 'Trivia completada · {count}/{total}',
    'tuner.dialog': 'Restauración de frecuencia de {name}',
    'tuner.kicker': 'RESTAURANDO ENLACE · {name}',
    'tuner.title': 'Restaurar la Frecuencia',
    'tuner.description': 'El transmisor de <strong>{name}</strong> quedó en silencio en {site}. Cada artefacto tiene una frecuencia propia. Mueve el dial: la estática se limpiará al acercarte. Si mantienes la frecuencia correcta durante un segundo, escucharás su mensaje.',
    'tuner.site': 'su sitio',
    'tuner.dial': 'Frecuencia del dial en megahercios',
    'tuner.static': '🔊 Estática',
    'tuner.mute': '🔇 Silenciar',
    'tuner.close': 'Cerrar',
    'tuner.listen': '▶ ESCUCHAR RELATO',
    'tuner.replay': '↻ REPETIR RELATO',
    'tuner.start': '▶ INICIAR RELATO',
    'tuner.narration': 'Narración de {name}',
    'tuner.located': '✓ Señal localizada · mantén el dial quieto durante 1 segundo…',
    'tuner.weak': 'Señal débil · sigue moviendo el dial hasta limpiar la onda.',
    'tuner.stable': '✓ Frecuencia estable durante 1 segundo.',
    'tuner.connected': '🛰️ CONEXIÓN RESTABLECIDA · Escucha el mensaje de {name}…',
    'tuner.loading': 'Cargando la transmisión de voz…',
    'tuner.empty': 'No hay un mensaje de voz disponible para este eco.',
    'tuner.end': '— fin de transmisión · eco registrado —',
    'tuner.trivia': '🧩 RESPONDER DESAFÍO TRIVIA ➜',
    'tuner.audioUnavailable': 'El audio no está disponible en este navegador.',
    'tuner.playError': 'No se pudo iniciar el audio. Pulsa INICIAR RELATO para reintentar.',
    'tuner.ready': 'El audio está listo: pulsa ▶ INICIAR RELATO para escucharlo.',
    'tuner.speechUnavailable': 'La voz no está disponible en este navegador. Puedes leer el relato y continuar con la trivia.',
    'trivia.dialog': 'Trivia de {name}',
    'trivia.kicker': 'DESAFÍO TRIVIA · {name}',
    'trivia.correct': '✓ Respuesta correcta. ¡Eco registrado!',
    'trivia.wrong': 'Respuesta incorrecta. Prueba otra opción.',
    'trivia.fact': 'Dato curioso:',
    'trivia.back': 'VOLVER',
    'trivia.completed': 'TRIVIA COMPLETADA ✓',
    'trivia.already': 'TRIVIA YA COMPLETADA ✓',
    'manual.title': 'Manual del Cadete',
    'manual.kicker': 'ARCHIVO DE CAMPO · ACADEMIA 2099',
    'manual.close': 'Cerrar Manual del Cadete',
    'manual.loading': 'Cargando los términos científicos…',
    'manual.untitled': 'Término sin nombre',
    'manual.category': 'Campo científico',
    'manual.summary': 'En pocas palabras',
    'manual.how': 'Cómo funciona',
    'manual.fact': '¿Sabías que…?',
    'manual.simulation': 'SIMULACIÓN 2099 · No es telemetría NASA: {frequency} MHz · {signal} · {difficulty}',
    'manual.error': 'No se pudo abrir el manual. Inténtalo de nuevo.',
    'manual.retry': 'Reintentar',
    'footer.project': 'ECHOES OF SOL · NASA Space Apps Challenge 2026',
    'footer.credits': 'Créditos a los Estudiantes: Alomoto Ivan - Brito Priscila - Cheme Michelle - Sánchez Brandon - Taco Jorge',
    'errors.boot': '⚠ No se pudieron cargar los datos. Sirve el proyecto con: npx serve .',
    'errors.resource': 'No se pudo cargar {file} ({status}).',
  },
  en: {
    'page.title': 'Echoes of Sol · Abandoned but not Forgotten',
    'page.description': 'Echoes of Sol — Interactive stories of equipment remaining on the Moon and Mars. NASA Space Apps Challenge 2026.',
    'language.switch': 'Switch to Spanish / Cambiar a español',
    'header.home': 'Echoes of Sol, home',
    'header.manual': '📖 FIELD MANUAL',
    'header.badges': 'Completed quizzes',
    'header.audio': 'Audio controls',
    'preloader.title': 'ESTABLISHING DEEP-SPACE LINK…',
    'preloader.subtitle': 'tuning in to lunar and Martian frequencies',
    'intro.label': 'Introduction',
    'intro.kicker1': 'NASA SPACE APPS CHALLENGE 2026<br>“Abandoned but not Forgotten”',
    'intro.title1': 'Silence<em>has a voice, too</em>',
    'intro.text1': 'Rovers, landers, and descent stages remain on the Moon and Mars. Machines with names, missions, and stories that deserve to be heard again.',
    'intro.kicker2': 'MORE THAN SPACE JUNK',
    'intro.title2': 'They are <em>monuments</em>',
    'intro.text2': 'Each was left where it completed its task. Their metal frames bear witness to human curiosity.',
    'intro.kicker3': 'YOUR MISSION AS AN OPERATOR',
    'intro.title3': 'Restore <em>their signal</em>',
    'intro.text3': 'Rotate the worlds, find each echo, and listen to its first-person story. Answer its quiz and restore the communications link to earn your badge.',
    'intro.enter': 'ENTER THE ORBITAL EXPLORER ↓',
    'explorer.label': '3D globes of the Moon and Mars',
    'explorer.title': 'ORBITAL <em>EXPLORER</em>',
    'explorer.tabs': 'Select a celestial body',
    'explorer.mars': '♂ MARS',
    'explorer.moon': '☾ MOON',
    'explorer.globe': 'Interactive 3D globe with landing-site markers',
    'explorer.hint': 'Drag to rotate · Scroll to zoom · Click a marker <span class="pulse-dot">✦</span>',
    'body.moon': 'Moon',
    'body.mars': 'Mars',
    'mission.Rover': 'Rover',
    'mission.Lander': 'Lander',
    'mission.Descent Stage': 'Descent Stage',
    'mission.Science Package': 'Science Package',
    'mission.Helicopter': 'Helicopter',
    'mission.default': 'Equipment',
    'marker.dialog': '{name} mission record',
    'marker.close': 'Close mission record',
    'marker.photoAlt': 'NASA photograph: {name}',
    'marker.photoCaption': '📷 Mission photograph · NASA ({body})',
    'marker.landing': 'LANDING',
    'marker.contact': 'LAST SIGNAL',
    'marker.duration': 'DURATION',
    'marker.status': 'STATUS',
    'marker.monologue': 'FIRST-PERSON STORY',
    'marker.hardware': 'Hardware remaining at the site',
    'marker.legacy': 'SCIENTIFIC LEGACY',
    'marker.breakthrough': 'Breakthrough',
    'marker.impact': 'Impact on Earth',
    'marker.complete': '✅ Quiz answered correctly',
    'marker.pending': 'Quiz pending · tune in to continue',
    'marker.tune': '📡 TUNE IN TO THE STORY ▸',
    'audio.enable': 'Enable space ambience (Web Audio)',
    'audio.mute': 'Mute space ambience',
    'audio.title': 'Space ambience (Web Audio)',
    'badge.title': 'Quizzes answered correctly',
    'badge.suffix': 'ECHOES',
    'badge.toast': 'Quiz completed · {count}/{total}',
    'tuner.dialog': 'Signal restoration for {name}',
    'tuner.kicker': 'RESTORING LINK · {name}',
    'tuner.title': 'Restore the Frequency',
    'tuner.description': 'The transmitter of <strong>{name}</strong> fell silent at {site}. Each artifact has its own frequency. Move the dial: the static will fade as you get closer. Hold the correct frequency for one second to hear its message.',
    'tuner.site': 'its site',
    'tuner.dial': 'Dial frequency in megahertz',
    'tuner.static': '🔊 Static',
    'tuner.mute': '🔇 Mute',
    'tuner.close': 'Close',
    'tuner.listen': '▶ LISTEN TO THE STORY',
    'tuner.replay': '↻ REPLAY STORY',
    'tuner.start': '▶ START STORY',
    'tuner.narration': 'Narration for {name}',
    'tuner.located': '✓ Signal located · hold the dial steady for 1 second…',
    'tuner.weak': 'Weak signal · keep moving the dial until the wave clears.',
    'tuner.stable': '✓ Frequency held steady for 1 second.',
    'tuner.connected': '🛰️ CONNECTION RESTORED · Listen to the message from {name}…',
    'tuner.loading': 'Loading voice transmission…',
    'tuner.empty': 'No voice message is available for this echo.',
    'tuner.end': '— end of transmission · echo recorded —',
    'tuner.trivia': '🧩 TAKE THE QUIZ ➜',
    'tuner.audioUnavailable': 'Audio is not available in this browser.',
    'tuner.playError': 'Audio could not start. Press START STORY to try again.',
    'tuner.ready': 'Audio is ready: press ▶ START STORY to listen.',
    'tuner.speechUnavailable': 'Speech is unavailable in this browser. You can read the story and continue to the quiz.',
    'trivia.dialog': '{name} quiz',
    'trivia.kicker': 'QUIZ CHALLENGE · {name}',
    'trivia.correct': '✓ Correct answer. Echo recorded!',
    'trivia.wrong': 'Incorrect answer. Try another option.',
    'trivia.fact': 'Fun fact:',
    'trivia.back': 'BACK',
    'trivia.completed': 'QUIZ COMPLETED ✓',
    'trivia.already': 'QUIZ ALREADY COMPLETED ✓',
    'manual.title': 'Cadet Field Manual',
    'manual.kicker': 'FIELD ARCHIVE · ACADEMY 2099',
    'manual.close': 'Close Cadet Field Manual',
    'manual.loading': 'Loading scientific terms…',
    'manual.untitled': 'Unnamed term',
    'manual.category': 'Scientific field',
    'manual.summary': 'In a nutshell',
    'manual.how': 'How it works',
    'manual.fact': 'Did you know…?',
    'manual.simulation': 'SIMULATION 2099 · Not NASA telemetry: {frequency} MHz · {signal} · {difficulty}',
    'manual.error': 'The manual could not be opened. Please try again.',
    'manual.retry': 'Try again',
    'footer.project': 'ECHOES OF SOL · NASA Space Apps Challenge 2026',
    'footer.credits': 'Student team: Alomoto Ivan - Brito Priscila - Cheme Michelle - Sánchez Brandon - Taco Jorge',
    'errors.boot': '⚠ Data could not be loaded. Serve this project with: npx serve .',
    'errors.resource': 'Could not load {file} ({status}).',
  },
};

let language = 'es';
try {
  const saved = localStorage.getItem('echoes_lang');
  if (saved === 'es' || saved === 'en') language = saved;
} catch (_) { /* Spanish remains the default when storage is unavailable. */ }

export function getLang() { return language; }

export function t(key, values = {}) {
  const text = messages[language][key] ?? messages.es[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}

export function applyTranslations(root = document) {
  document.documentElement.lang = language;
  for (const element of root.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
  for (const element of root.querySelectorAll('[data-i18n-html]')) element.innerHTML = t(element.dataset.i18nHtml);
  for (const attribute of ['aria-label', 'title', 'content']) {
    for (const element of root.querySelectorAll(`[data-i18n-${attribute}]`)) {
      element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
    }
  }
}

export function setLang(newLang) {
  if (!['es', 'en'].includes(newLang) || newLang === language) return;
  language = newLang;
  try { localStorage.setItem('echoes_lang', language); } catch (_) { /* Session-only preference. */ }
  applyTranslations();
  document.dispatchEvent(new CustomEvent('echo:lang-changed', { detail: { lang: language } }));
}

const resources = new Map();
function loadResource(kind, lang) {
  const key = `${kind}:${lang}`;
  if (!resources.has(key)) {
    const file = `data/${kind}_data${lang === 'en' ? '_en' : ''}.json`;
    const entry = { data: null, promise: null };
    entry.promise = fetch(file).then((response) => {
      if (!response.ok) throw new Error(t('errors.resource', { file, status: response.status }));
      return response.json();
    }).then((data) => {
      if (!Array.isArray(data)) throw new Error(`Invalid catalog: ${file}`);
      entry.data = data;
      return data;
    }).catch((error) => { resources.delete(key); throw error; });
    resources.set(key, entry);
  }
  return resources.get(key).promise;
}

export function loadCatalog(lang = language) { return loadResource('equipment', lang); }
export function loadGlossary(lang = language) { return loadResource('glossary', lang); }
export function cachedGlossary(lang = language) { return resources.get(`glossary:${lang}`)?.data; }
export function localizeArtifact(artifact) {
  return resources.get(`equipment:${language}`)?.data?.find((item) => item.id === artifact?.id) || artifact;
}
export function preloadLanguages() {
  return Promise.all(['es', 'en'].flatMap((lang) => [loadCatalog(lang), loadGlossary(lang)]));
}
