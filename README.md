# 🛰️ Echoes of Sol · The Cyber-Archaeology Academy (Año 2099)

> **NASA Space Apps Challenge 2026** · Desafío: *«Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars»*  
> Experiencia web interactiva inmersiva de los rovers, landers, experimentos y etapas de descenso que la humanidad dejó en la **Luna** y en **Marte**… preservados no como chatarra espacial, sino como **monumentos eternos de la exploración humana**.

---

## 🌌 Sinopsis y Concepto Narrativo

En el **año 2099**, la humanidad ha establecido colonias de investigación interplanetarias. Los cadetes de la **Academia de Ciberarqueología** reciben una misión de campo: recuperar el contacto con las misiones precursoras de los siglos XX y XXI que allanaron el camino hacia las estrellas.

A través de una consola orbital holográfica (*HUD Glassmorphism*), los cadetes exploran los globos 3D de la Luna y Marte, localizan balizas de telemetría histórica, sintonizan frecuencias radiales perdidas, escuchan sus relatos en primera persona con voces sintéticas neurales, resuelven desafíos de trivia científica y consultan el archivo de campo en el **Manual del Cadete** para ganar insignias de honor.

---

## 🚀 Cómo ejecutar el proyecto localmente

> [!IMPORTANT]
> Debido al uso de módulos nativos de JavaScript (`type="module"`), el `importmap` de Three.js y las peticiones `fetch` a los archivos JSON de datos, **no se debe abrir `index.html` directamente como archivo local (`file:///`)**. Requiere un servidor HTTP local.

### Opción 1: Servidor rápido con Node.js / npx (Recomendada)
```bash
cd proyecto_nasa
npx serve .
# Abre en tu navegador la URL indicada (típicamente http://localhost:3000)
```

### Opción 2: Python 3
```bash
cd proyecto_nasa
python3 -m http.server 3000
# Abre http://localhost:3000 en tu navegador
```

### Opción 3: Extensión Live Server de VS Code
Abre la carpeta `proyecto_nasa` en Visual Studio Code, haz clic derecho sobre `index.html` y selecciona **«Open with Live Server»**.

---

## ✨ Características Principales

1. **Visor 3D Orbital e Interactivo (WebGL / Three.js)**:
   - Globos 3D esféricos de la **Luna** y **Marte** con texturas 2K de alta resolución e iluminación estelar realista.
   - Selector dinámico de mundos (`☾ LUNA` y `♂ MARTE`) con controles orbitales (*OrbitControls*) fluidos y limitados.
   - Proyección matemática esférica de coordenadas reales de aterrizaje (latitud y longitud planetocéntrica) mapeadas a vectores tridimensionales.

2. **Relatos en Primera Persona con Audio Neural**:
   - 13 historias con rigor histórico y emocional contadas por las propias máquinas.
   - 13 archivos de audio `.mp3` grabados con síntesis de voz neural en español (`es-EC-LuisNeural`).
   - **Reproductor directo integrado** en cada ficha para escuchar inmediatamente sin bloqueos de navegador.

3. **Minijuego Sintonizador de Frecuencia (Osciloscopio Interactivo)**:
   - Pantalla de osciloscopio en `<canvas>` donde los cadetes manipulan un dial radial entre ruido y armónicos.
   - Al estabilizar la señal a 240 MHz, se eliminan las interferencias, suena el indicativo en código Morse de la nave y se despliegan **subtítulos dinámicos sincronizados palabra por palabra** (`data/voice_tracks.json`).

4. **Desafíos Interactivos de Trivia Científica**:
   - Cada artefacto cuenta con una pregunta técnica y un dato curioso (*fun fact*) validado con los archivos de la NASA.
   - Responder correctamente otorga la **insignia de restauración** del artefacto y la guarda en `localStorage`.

5. **Manual del Cadete (Glosario Científico de Campo)**:
   - Acceso desde la barra superior del HUD mediante el botón **`📖 MANUAL`**.
   - Diálogo nativo modal accesible (`<dialog>`) con 8 conceptos clave: *Regolito Lunar*, *Espectrómetro APXS*, *Retro-reflector Láser (LRRR)*, *Invernada Marciana*, *Tormentas Globales de Polvo*, *Sismología Planetaria*, *Atmósfera Marciana y Sustentación*, y *Protección del Patrimonio Espacial*.

6. **Archivo Fotográfico Real de la NASA**:
   - Fotografías históricas en alta definición integradas directamente en las fichas de los artefactos.

7. **Paisaje Sonoro Procedural (Web Audio API)**:
   - Botón de cabina en el HUD (`🔇 / 🔊`) que genera sonido ambiental espacial en tiempo real mediante ruido blanco filtrado con paso bajo (220 Hz), campanas de confirmación y sintetizador de código Morse.

8. **Diseño HUD Glassmorphism y Scrollytelling**:
   - Interfaz espacial de cabina con estética cyberpunk sutil, transparencias `backdrop-filter`, fuentes monospace y animaciones cinematográficas con GSAP ScrollTrigger.

---

## 🏛️ Catálogo Oficial Completo (13 Misiones NASA — NSSDCA Gold Master)

Todas las misiones incluidas provienen directamente del registro oficial de la NASA y de los recursos del desafío:

| # | Artefacto / Equipo | Cuerpo | Sitio de Aterrizaje | Coordenadas Oficiales | ID Oficial NASA (NSSDCA) |
| :-: | :--- | :---: | :--- | :---: | :---: |
| 1 | **Apollo 11 Descent Stage — Eagle** | ☾ Luna | Mare Tranquillitatis (*Tranquility Base*) | 0.67416° N, 23.47314° E | [1969-059C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C) |
| 2 | **Surveyor 3** | ☾ Luna | Oceanus Procellarum (*Surveyor Crater*) | 3.0162° S, 336.582° E | [1967-035A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A) |
| 3 | **Apollo 15 LRV — Falcon** | ☾ Luna | Montes Apenninus / Hadley Rille | 26.1322° N, 3.6339° E | [1971-063C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C) |
| 4 | **Apollo 11 EASEP / LRRR** | ☾ Luna | Mare Tranquillitatis | 0.673° N, 23.473° E | [1969-059C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C) |
| 5 | **Apollo 17 LRV — Challenger** | ☾ Luna | Taurus-Littrow Valley | 20.1908° N, 30.7717° E | [1972-096C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096C) |
| 6 | **Viking 1 Lander** | ♂ Marte | Chryse Planitia (*Thomas Mutch Memorial Station*) | 22.48° N, 312.03° E | [1975-075C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-075C) |
| 7 | **Viking 2 Lander** | ♂ Marte | Utopia Planitia | 47.64° N, 134.29° E | [1975-083C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-083C) |
| 8 | **Mars Pathfinder & Sojourner** | ♂ Marte | Ares Vallis (*Carl Sagan Memorial Station*) | 19.33° N, 326.45° E | [1996-068A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A) |
| 9 | **Spirit (MER-A)** | ♂ Marte | Cráter Gusev (*Columbia Memorial Station*) | 14.5684° S, 175.4726° E | [2003-027A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-027A) |
| 10 | **Opportunity (MER-B)** | ♂ Marte | Meridiani Planum (*Challenger Memorial Station*) | 1.9462° S, 354.4734° E | [2003-032A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A) |
| 11 | **Phoenix Mars Lander** | ♂ Marte | Vastitas Borealis (*Green Valley*) | 68.2188° N, 234.2508° E | [2007-034A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2007-034A) |
| 12 | **InSight Mars Lander** | ♂ Marte | Elysium Planitia | 4.5024° N, 135.6234° E | [2018-042A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A) |
| 13 | **Ingenuity Mars Helicopter** | ♂ Marte | Cráter Jezero (*Airfield Nevers*) | 18.4446° N, 77.4509° E | [2020-052C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052C) |

---

## 🧱 Stack Tecnológico (Vanilla & Zero Heavy Frameworks)

El proyecto sigue una estricta política de **cero frameworks pesados** (sin React, Angular, Vue o Tailwind), garantizando rendimiento ultrarrápido, compatibilidad web nativa y portabilidad:

| Capa | Tecnologías Utilizadas |
| :--- | :--- |
| **Estructura** | HTML5 semántico + Custom Elements nativos (Web Components) |
| **Estilos e Interfaz** | CSS3 moderno: Variables CSS, CSS Grid, Flexbox, `backdrop-filter: blur()`, `@keyframes` |
| **Render 3D WebGL** | [Three.js r160](https://threejs.org/) cargado vía `importmap` nativo + `OrbitControls` |
| **Animación y Scrollytelling** | [GSAP 3.12](https://greensock.com/gsap/) + [ScrollTrigger](https://greensock.com/scrolltrigger/) |
| **Audio Síntesis** | Web Audio API nativo (osciladores seno, generador de ruido blanco y filtros biquad) |
| **Audio Narrado** | Archivos MP3 locales de alta definición generados con síntesis neural de Microsoft Edge (`es-EC-LuisNeural`) |
| **Bases de Datos** | JSON estructurado con validación estricta (`equipment_data.json`, `glossary_data.json`, `voice_tracks.json`) |

---

## 📁 Estructura del Repositorio

```
proyecto_nasa/
├── index.html                       # Shell principal, importmap, HUD y scrollytelling
├── README.md                        # Documentación técnica maestra del proyecto
├── css/
│   ├── base.css                     # Reset, tokens de diseño, tipografía monospace y a11y
│   ├── hud.css                      # Estilos HUD Glassmorphism, paneles, trivia y manual
│   └── scrollytelling.css           # Estilos de pasos de narrativa cinematográfica
├── js/
│   ├── main.js                      # Orquestador: carga de datos, eventos, manual y switch
│   ├── components/
│   │   ├── echo-globe.js            # Web Component para el visor Three.js interactivo
│   │   ├── echo-marker.js           # Ficha lateral del artefacto con reproductor inline
│   │   ├── echo-audio.js            # Toggle del sonido ambiental espacial en la cabecera
│   │   └── echo-badge.js            # Tracker dinámico de insignias restauradas
│   ├── three/
│   │   ├── scene.js                 # Inicialización de escena Three.js, cámara, luces y render
│   │   ├── markers.js               # Conversión lat/lon a Vector3 y marcadores de baliza
│   │   └── textures.js              # Carga y fallback de texturas planetarias
│   ├── audio/
│   │   └── soundscape.js            # Motor procedural Web Audio: Morse, estática y chime
│   ├── ui/
│   │   └── scroll.js                # Lógica de progreso y triggers de GSAP ScrollTrigger
│   └── game/
│       ├── signal-tuner.js          # Minijuego de frecuencia radial y subtítulos karaoke
│       └── trivia.js                # Desafío de preguntas interactivas por artefacto
├── data/
│   ├── equipment_data.json          # Catálogo Gold Master de las 13 misiones oficiales NASA
│   ├── glossary_data.json           # 8 términos científicos para el Manual del Cadete
│   └── voice_tracks.json            # Alineación de texto con marcas de tiempo por palabra
├── assets/
│   ├── audio/                       # 13 narraciones en MP3 locales por artefacto
│   ├── images/                      # Fotografías históricas reales de la NASA
│   └── textures/                    # Texturas planetarias 2K (2k_mars.jpg y 2k_moon.jpg)
└── scripts/
    └── generate_voice_assets.py     # Script para generar pistas de audio con edge-tts
```

---

## ♿ Accesibilidad y Rendimiento

- **Navegación por teclado completa**: Foco visible (`:focus-visible`), diálogos modales nativos con cierre en tecla `Escape` y roles ARIA (`role="dialog"`, `aria-label`, `aria-pressed`).
- **Respeto a preferencias del usuario**: Media query `@media (prefers-reduced-motion: reduce)` desactiva animaciones y efectos de traslación.
- **Cero bloqueos de Autoplay**: El reproductor de audio integrado responde a gestos directos del usuario (`click`).
- **Resiliencia de texturas**: Si un archivo de textura no puede cargarse, el sistema genera proceduralmente un gradiente de respaldo en un `<canvas>` sin interrumpir la escena 3D.

---

## 👥 Equipo de Desarrollo · NASA Space Apps Challenge 2026

- **Diego Iván Alomoto** — *UI/UX Designer & Scrollytelling Engineer*
- **Priscila Brito** — *Audio Systems & Game Logic Developer*
- **Michelle Cheme** — *Tech Lead & 3D WebGL / Three.js Engineer*
- **Jorge Taco** — *NASA Data Archivist & Scientific Storyteller*
- **Brandon Sánchez** — *QA, Integration Lead & Pitch Strategist*

---

## 📜 Licencias y Reconocimientos

- **Datos y Coordenadas Oficiales**: [NASA National Space Science Data Center (NSSDCA)](https://nssdc.gsfc.nasa.gov/) y [NASA Planetary Data System (PDS)](https://pds.nasa.gov/).
- **Texturas Planetarias**: NASA / USGS procesadas por [Solar System Scope](https://www.solarsystemscope.com/textures/) bajo licencia [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Fotografías Históricas**: Archivo de dominio público de la NASA (JPL-Caltech / Johnson Space Center / Goddard Space Flight Center).
