# 04 · Guía de Roles — onboarding y tareas para continuar

> Encuentra tu sección, lee tu rol y arranca. Tu rama ya está definida:
> parte **siempre** desde `develop`.
>
> ```bash
> cd proyecto_nasa
> git checkout develop && git pull origin develop
> git checkout -b feature/<tu-rama>
> # ...trabaja...
> git add . && git commit -m "feat: ..." && git push -u origin feature/<tu-rama>
> # → abre Pull Request hacia develop en GitHub
> ```

---

## 🎨 DIEGO — UI/UX & Scrollytelling
**Rama:** `feature/ui-scrollytelling` · **Archivos tuyos:** `css/*`, `js/ui/scroll.js`

### Lo que ya tienes listo (no lo rompas)
- Sistema de diseño en `css/base.css`: variables (`--echo-accent` se tiñe solo según el cuerpo/artefacto), glassmorphism en `hud.css`, 3 pasos de scrolly en `scrollytelling.css`.
- GSAP + ScrollTrigger ya cargados y el revelado de pasos funciona (`js/ui/scroll.js`).
- Responsive básico en `hud.css` (<640px).

### Tu misión
1. **Pule el HUD sci-fi:** esquinas con recortes (`clip-path`), líneas de telemetría decorativas, scanlines sutiles sobre el globo, micro-interacciones de hover en chips y botones.
2. **Tipografía de display:** si quieres una fuente tipo Orbitron/Rajdhani, agrega el `.woff2` a `assets/fonts/` con `@font-face` local (evita otro CDN).
3. **Responsive fino:** prueba en móvil real (DevTools + tu celular). El globo usa `height: min(72vh, 640px)`; ajústalo para pantallas cortas. El panel de ficha ya es fullscreen en móvil.
4. **Épilogo:** cuando el badge llega a 6/6, muestra una pantalla de cierre ("Toda la humanidad escucha de nuevo") — puedes crear un evento nuevo `echo:all-badges` (documéntalo en el doc 02).
5. **Animaciones del panel:** entrada escalonada de las secciones de la ficha con GSAP al abrir.

### Cómo probar tu trabajo
```bash
npx serve .   # mira: scrollytelling, toggle Luna/Marte, abrir fichas, móvil
```
Commits: `style: ajusta desenfoque de panel HUD`, `feat: añade epílogo de insignias`.

---

## 🔊 PRISCILA — Lógica Interactiva & Audio
**Rama:** `feature/logic-audio` · **Archivos tuyos:** `js/audio/*`, `js/game/*`, `echo-audio.js`, `echo-badge.js`

### Lo que ya tienes listo
- `soundscape.js`: singleton con AudioContext perezoso (se crea en el primer clic), ambiente en loop, `staticBurst()`, `morse()` completo, `chime()` y `playCue()` por `audio_cue`.
- Trivia completa con insignia en `localStorage` (`echoes_badges`) y toast.
- Toggle de audio en el HUD (crea el contexto en el gesto del usuario — requisito de navegadores).

### Tu misión
1. **Señal débil dinámica:** el volumen de la estática debe crecer cuando la cámara se acerca al marcador. Pista: `PlanetScene` expone `camera.position` y los marcadores están en `markerGroup.userData.dots` — calcula distancia por frame (throttled) y ajusta un GainNode.
2. **Ambiente por cuerpo:** Luna (seco, minimal, frecuencia muy baja) vs Marte (viento polvoriento, filtrado medio). Pasa el `body` al soundscape cuando cambie el toggle (evento nuevo: `echo:body-changed`, documéntalo en doc 02).
3. **Insidia el minijuego (opcional, fase 2):** antes de la trivia, una micro-interacción de "apuntar antena" (arrastrar un dial a cierto ángulo). Manténla corta: la trivia sigue siendo la puerta oficial de la insignia.
4. **Sala de logros:** una vista con las 6 insignias dibujadas en CSS/SVG puro (nada de imágenes pesadas), bloqueadas/ganadas según `localStorage`.
5. **Failsafe de audio:** si el navegador bloquea el AudioContext, el toggle debe avisar (toast) y no romper la app.

### Cuidados técnicos
- Nada de `setTimeout` para schedules de audio: usa los tiempos de `AudioContext.currentTime`.
- Todos los nodos pasan por `this.master` (ya hay GainNode maestro).
- El Morse se agenda con delays relativos en `beep(freq, dur, delay)`; no lo reescribas.

Commits: `feat: añade volumen de estática por cercanía`, `fix: evita duplicar ambiente al alternar cuerpo`.

---

## 📡 JORGE — NASA Data & Storytelling
**Rama:** `feature/nasa-data-content` · **Archivos tuyos:** `data/equipment_data.json` (solo contenido)

### Lo que ya tienes listo
Los 6 artefactos completos (2 Luna + 4 Marte) con monólogos en primera persona, coordenadas reales (NSSDCA/PDS, lon normalizada ±180), trivias y acentos de color.

### Tu misión
1. **Auditar el JSON actual** contra fuentes oficiales: fechas, duraciones (soles/días), `status`, coordenadas. Marca cualquier discrepancia en tu PR con la fuente.
2. **Agregar `fun_fact_telemetry`** a cada artefacto: una frase corta que imite su última transmisión (ej. Spirit: `"Sol 2210… sin datos. Pero ya lo había dicho todo."`). Eso alimenta el panel de telemetría retro de Diego (fase 2).
3. **Anotar `source_urls`** por artefacto (array de URLs oficiales) para el anexo del pitch de Brandon.
4. **Escribir el anexo pedagógico:** para cada artefacto, 1 párrafo de "lección para el aula" (puede vivir en `docs/anexo-pedagogico.md`).
5. **Si el equipo aprueba crecer a 12:** sigue EXACTAMENTE el checklist del doc 03 (§7) — el esquema no puede variar.

### Cuidados técnicos
- NO cambies `id` de los artefactos existentes: es la clave de las insignias guardadas.
- Valida siempre: `node -e "JSON.parse(require('fs').readFileSync('data/equipment_data.json','utf8'))"`.
- Commits: `docs: actualiza ficha de misiones de Apolo`, `docs: añade fuentes PDS de Viking 1`.

---

## 🧪 BRANDON — Creative Lead, Pitch & QA Integrator
**Rama:** `feature/qa-and-assets` · **Archivos tuyos:** `assets/*`, QA, integración y `main`

### Lo que ya tienes listo
- Proyecto funcional completo en `develop` (ver doc 01): flujo preloader → scrollytelling → globo → ficha → trivia → insignia.
- Texturas 2k de Marte y Luna (Solar System Scope CC-BY 4.0) ya acreditadas en el footer y el README.

### Tu misión
1. **QA en tu máquina:** clona `develop`, corre `npx serve .` y prueba en Chrome/Firefox/Edge + móvil. Reporta bugs como issues de GitHub con pasos para reproducir. Prueba también con los JPG de textura renombrados (para ver el fallback procedural).
2. **Assets de marca:** logo del proyecto (SVG) y favicon en `assets/`; enlaza el favicon en `index.html`.
3. **Integración:** cuando las 4 ramas `feature/*` tengan PR aprobados, haz merge a `develop`, prueba de integración completa, y SOLO al final mueve `develop` → `main` (entrega estable).
4. **Video de presentación:** guion sugerido — (1) problema/historia (scrollytelling), (2) demo del globo + ficha de Opportunity, (3) minijuego e insignia, (4) impacto pedagógico, (5) equipo y stack. 90–120 s.
5. **Accesibilidad y rendimiento:** tab-navegar todo el flujo con teclado, comprobar `prefers-reduced-motion`, y que no haya errores en la consola (Network incluida).

Commits: `assets: añade logo y favicon`, `fix: ajusta integración tras QA`.

---

## 👩‍🚀 MICHELLE — Tech Lead & 3D WebGL (referencia del equipo)
**Rama:** `feature/threejs-scene` · **Archivos:** `js/three/*`, `echo-globe.js`, `echo-marker.js`, `main.js`

### Ya hecho (doc 01, sección ✅)
Escena completa: texturas con fallback, marcadores lat/lon→XYZ, raycaster con detección clic vs drag, tweens de cámara, panel de ficha, orquestador.

### Mejoras opcionales si el tiempo lo permite
1. Tooltip flotante en hover del marcador (nombre + año).
2. Tilt del eje de Marte (25°) y Luna (6.7°) con `globe.rotation.z`.
3. Carga diferida de la textura de la Luna (solo al alternar).
4. Sombra/fase (terminador día-noche) con un ShaderMaterial simple.

---

## 📋 Checklist universal antes de abrir tu PR

- [ ] Mi rama parte de `develop` actualizada.
- [ ] `node --check` pasa en cada archivo JS que toqué.
- [ ] Si toqué el JSON: `JSON.parse` pasa y leí el doc 03 completo.
- [ ] Probé con `npx serve .` (no abrí index.html por doble clic).
- [ ] No hardcodeé datos que deben venir del JSON.
- [ ] No cambié nombres de eventos/componentes existentes (doc 02 §3–4).
- [ ] Mi commit usa prefijo: `feat:`, `fix:`, `docs:`, `style:`.
- [ ] Actualicé mi sección del doc 01 (⏳ → ✅ si cerré algo).
