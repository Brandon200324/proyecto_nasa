# 01 · Estado del Proyecto — qué está hecho y qué falta

> Última actualización: primer commit de `develop` (Michelle).
> **Convención de este documento:** al terminar una tarea, muévela de
> ⏳ Pendiente a ✅ Hecho y sube tu rama. Así todos vemos el avance real.

## ✅ HECHO — Construido por Michelle (Tech Lead, rama `develop`)

### Estructura general
- ✅ `index.html` — Shell semántico: preloader, barra HUD, 3 pasos de scrollytelling, selector Luna/Marte, globo, panel de ficha y footer con créditos NASA.
- ✅ Import map de Three.js 0.160 (CDN jsdelivr) y scripts clásicos de GSAP 3.12.5 + ScrollTrigger (CDN cdnjs).

### CSS (base lista para que Diego pula)
- ✅ `css/base.css` — Variables (`--echo-accent` dinámico), reset, a11y, `prefers-reduced-motion`.
- ✅ `css/hud.css` — Glassmorphism: preloader, barra HUD, botones, panel de ficha, trivia, toast de insignias, audio toggle, footer. Responsive básico (<640px).
- ✅ `css/scrollytelling.css` — Pasos narrativos a pantalla completa con kicker/título/texto.

### Capa 3D (Three.js)
- ✅ `js/three/textures.js` — Carga de texturas `assets/textures/2k_mars.jpg` / `2k_moon.jpg` con **fallback procedural** (canvas: cráteres + ruido) si el JPG falla. La demo nunca se rompe.
- ✅ `js/three/markers.js` — `latLonToVector3(lat, lon, r)` (fórmula confirmada) + creación de marcadores (punto + anillo pulsante tangente + estela) + animación de pulso.
- ✅ `js/three/scene.js` — Clase `PlanetScene`: renderer, cámara, OrbitControls (damping, autorrotación), luces, campo de estrellas, raycaster con detección de clic (ignora drags), hover cursor, `focusMarker()` con tween GSAP de cámara, `resetView()`, ResizeObserver, loop de animación.

### Web Components
- ✅ `echo-globe.js` — Envuelve `PlanetScene`; emite `echo:marker-selected` y `echo:marker-deselect`; expone `setBody()`, `focus()`, `reset()`.
- ✅ `echo-marker.js` — Panel de ficha: monólogo completo, stats (fechas/duración/estado), monumento, hardware en chips, legado científico, CTA "Restaurar su señal" (abre la trivia). El acento de color se toma de `color_accent` del JSON.
- ✅ `echo-audio.js` — Toggle 🔊/🔇 que crea el AudioContext en el clic (política de navegadores) y enciende el ambiente.
- ✅ `echo-badge.js` — Contador de insignias con `localStorage` (clave `echoes_badges`), escucha `echo:badge-earned`, toast animado.

### Audio sintetizado (Web Audio API — 0 archivos de sonido)
- ✅ `js/audio/soundscape.js` — Singleton `soundscape`: ambiente espacial (ruido filtrado en loop), `staticBurst()`, `morse()` (alfabeto A–Z + 0–9), `chime()` de éxito, `playCue()` según `audio_cue` del JSON.

### Scrollytelling y minijuego
- ✅ `js/ui/scroll.js` — Revelado de pasos con GSAP + ScrollTrigger, título con ritmo, barra HUD compacta al hacer scroll.
- ✅ `js/game/trivia.js` — Modal de trivia con opciones, estados correcto/incorrecto (shake), dato curioso al acertar, chime + Morse del callsign, dispatch de `echo:badge-earned`, cierre con Escape/clic fuera.

### Orquestador y datos
- ✅ `js/main.js` — Fetch + validación de JSON, selector de cuerpo con cambio de `--echo-accent`, eventos globo↔panel↔insignias, callsigns para Morse, preloader con mensaje de error útil.
- ✅ `data/equipment_data.json` — 6 artefactos completos con monólogos: Apollo 11, LRV Apollo 15 (Luna) · Viking 1, Spirit, Opportunity, InSight (Marte). Coordenadas reales según NSSDCA/PDS.
- ✅ `assets/textures/` — `2k_mars.jpg` y `2k_moon.jpg` descargados (Solar System Scope, CC-BY 4.0).
- ✅ Git: ramas `main` (protegida de facto) y `develop` con commit inicial.

---

## ⏳ PENDIENTE — Por rol (ver detalle en 04-guia-de-roles.md)

### Diego — UI/UX & Scrollytelling
- ⏳ Pulir visual: líneas de telemetría decorativas, esquinas de HUD tipo sci-fi, micro-interacciones de hover.
- ⏳ Tipografía de display (opcional: fuente local tipo Orbitron en `assets/fonts/`, sin CDN nuevo).
- ⏳ Responsive fino: probar en móvil real, ajustar alturas del globo y del panel de ficha.
- ⏳ Pantalla de cierre/épilogo cuando las insignias llegan a 6/6.

### Priscila — Lógica & Audio
- ⏳ Modo "señal débil": volumen de la estática que suba según la cercanía de la cámara al marcador.
- ⏳ Ambient soundscape por cuerpo (Luna: más seco/minimal; Marte: viento polvoriento).
- ⏳ Segunda mecánica opcional si sobra tiempo: arrastrar para "apuntar la antena" antes de la trivia.
- ⏳ Pantalla de logros con las 6 insignias dibujadas (CSS/SVG, sin imágenes pesadas).

### Jorge — NASA Data & Storytelling
- ⏳ Revisar/confirmar monólogos y datos del JSON actual (ver 03-esquema-de-datos.md).
- ⏳ Agregar `fun_fact_telemetry` por artefacto (frase que imite su última transmisión) para el panel de telemetría.
- ⏳ Lista de fuentes oficiales (URL NASA/PDS) por artefacto para el anexo del pitch.
- ⏳ Si el equipo decide crecer a 12 artefactos: mantener el esquema EXACTO del doc 03.

### Brandon — Creative Lead, Pitch & QA
- ⏳ Assets propios: logo, favicon (`assets/`), posible textura 8k si el equipo lo aprueba.
- ⏳ QA en su máquina: probar `npx serve .` en Chrome/Firefox/Edge, móvil y tableta.
- ⏳ Checklist de PR: fusionar `feature/*` → `develop` cuando el team apruebe, y solo al final `develop` → `main`.
- ⏳ Grabación del video de presentación (guion con las escenas del flujo).
- ⏳ Página de "Acerca del equipo" (opcional) o sección en el footer.

### Michelle — 3D (posibles mejoras si el tiempo lo permite)
- ⏳ Tooltip flotante en hover del marcador (nombre + año).
- ⏳ Órbitas/lunas decorativas o tilt del eje de Marte.
- ⏳ Carga diferida (lazy) de la textura de la Luna.

---

## 🧪 Estado de verificación

| Prueba | Estado |
| :--- | :--- |
| `equipment_data.json` parsea (JSON válido) | ✅ |
| `node --check` en los 11 archivos JS | ✅ |
| Servidor local `npx serve .`: rutas 200 (HTML/CSS/JS/JSON/texturas) | ✅ |
| Prueba visual manual en navegador (degradados de textura, marcadores, trivia, insignias) | ⏳ (la puede hacer cualquiera — es el primer QA del equipo) |
