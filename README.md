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
   - La ficha inicial muestra datos y legado científico; **el monólogo, su texto y su voz se desbloquean únicamente al completar la sintonización**.

3. **Minijuego Sintonizador de Frecuencia (Osciloscopio Interactivo)**:
   - Pantalla de osciloscopio en `<canvas>` donde los cadetes manipulan un dial radial entre ruido y armónicos.
   - Cada uno de los **13 artefactos tiene una frecuencia propia**, configurada en `js/game/frequencies.js`, dentro del dial de 100 a 500 MHz.
   - Mantener el dial a ±5 MHz de su frecuencia durante **un segundo continuo** desbloquea la narración; salir del margen reinicia la espera.
   - Las frecuencias son **ficticias para el juego de la Academia 2099**, no frecuencias de telemetría reales de la NASA.
   - Al restaurar el enlace, aparecen la fotografía real del artefacto, su audio y los **subtítulos sincronizados palabra por palabra** (`data/voice_tracks.json`).

4. **Desafíos Interactivos de Trivia Científica**:
   - Cada artefacto cuenta con una pregunta técnica y un dato curioso (*fun fact*) validado con los archivos de la NASA.
   - El desafío se abre desde la narración al terminar el relato; no hay acceso directo desde la ficha inicial.
   - Responder correctamente guarda la **insignia de restauración** en `localStorage`, actualiza el contador y muestra un **visto verde encima del punto del artefacto en el globo**.
   - Abrir una ficha, sintonizar o elegir una respuesta incorrecta no completa la trivia. Las respuestas incorrectas permiten reintentar.
   - El progreso se conserva al recargar y cambiar entre Luna y Marte; también se reconocen los IDs antiguos de Apollo 11, Apollo 15 y Viking 1.

5. **Manual del Cadete (Glosario Científico de Campo)**:
   - Acceso desde la barra superior del HUD mediante el botón **`📖 MANUAL`**.
   - Diálogo nativo modal accesible (`<dialog>`) con 8 conceptos: *Retroreflector Láser (LRRR)*, *Ruedas de Malla Metálica y Odometría*, *GCMS*, *APXS*, *Herramienta de Abrasión de Rocas (RAT)*, *Esférulas de Hematita*, *Sismómetro SEIS* y *Paquete Térmico HP3*.

6. **Archivo Fotográfico Real de la NASA**:
   - Fotografías históricas locales que se muestran en el área del relato después de restaurar la señal, conservando las proporciones de cada imagen.

7. **Paisaje Sonoro Procedural (Web Audio API)**:
   - Botón de cabina en el HUD (`🔇 / 🔊`) que genera sonido ambiental espacial en tiempo real mediante ruido blanco filtrado con paso bajo (220 Hz), campanas de confirmación y sintetizador de código Morse.

8. **Diseño HUD Glassmorphism y Scrollytelling**:
   - Interfaz espacial de cabina con estética cyberpunk sutil, transparencias `backdrop-filter`, fuentes monospace y animaciones cinematográficas con GSAP ScrollTrigger.

---

## 🎮 Recorrido del cadete y progreso

1. Seleccionar un punto de la Luna o Marte para consultar su ficha.
2. Pulsar **SINTONIZAR VOZ** y buscar su frecuencia hasta mantenerla estable durante un segundo.
3. Escuchar y leer el relato restaurado junto a la imagen del artefacto.
4. Abrir la trivia al finalizar la narración y responder correctamente para obtener el visto verde.

El contador, el estado de la ficha y los vistos verdes comparten el progreso de `js/game/progress.js`, guardado bajo la clave `echoes_badges`. Si el navegador impide escribir en el almacenamiento, los resultados se mantienen durante la sesión, pero no se garantiza recuperarlos tras recargar. Los cambios de esta actualización conservan los archivos CSS y el catálogo Gold Master.

**Validación realizada:** recorrido completo de los 13 artefactos en navegador con WebGL y audio local, frecuencias distintas sin solapamiento, bloqueo previo a sintonizar, respuestas incorrectas y reintentos, vistos inmediatos, recuperación tras recarga y cambio de planeta, compatibilidad con IDs antiguos y almacenamiento no disponible. También se verificaron la sintaxis JavaScript y `git diff --check`.

---

## 🏛️ Catálogo Oficial Completo (13 Misiones NASA — NSSDCA Gold Master)

La fuente de datos de la aplicación es `data/equipment_data.json`. La tabla reproduce sus coordenadas e identificadores; el campo `status` aclara las aproximaciones, el sistema de referencia y cuándo un ID corresponde a la nave que transportó el artefacto. Las coordenadas de llegada de los rovers y de Ingenuity no deben confundirse con sus ubicaciones finales:

| # | Artefacto / Equipo | Cuerpo | Región / referencia | Coordenadas del catálogo | Registro NASA (NSSDCA) |
| :-: | :--- | :---: | :--- | :---: | :---: |
| 1 | **Apollo 11 Descent Stage — Eagle** | ☾ Luna | Mare Tranquillitatis — Tranquility Base | 0.67416° N, 23.47314° E | [1969-059C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C) |
| 2 | **Surveyor 3** | ☾ Luna | Oceanus Procellarum — Surveyor Crater | 3.0162° S, 336.582° E | [1967-035A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A) |
| 3 | **Apollo 15 LRV — Falcon** | ☾ Luna | Hadley-Apennine — Hadley Rille | 26.132° N, 3.633° E | [1971-063C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C) |
| 4 | **Apollo 11 EASEP / LRRR** | ☾ Luna | Mare Tranquillitatis — campo de experimentos de Apollo 11 | 0.67345° N, 23.47307° E | [1969-059C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C) |
| 5 | **Apollo 17 LRV — Challenger** | ☾ Luna | Taurus-Littrow Valley | 20.191° N, 30.772° E | [1972-096C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096C) |
| 6 | **Viking 1 Lander** | ♂ Marte | Chryse Planitia | 22.269° N, 312.049° E | [1975-075C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-075C) |
| 7 | **Viking 2 Lander** | ♂ Marte | Utopia Planitia | 47.64° N, 134.29° E | [1975-083C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-083C) |
| 8 | **Mars Pathfinder & Sojourner** | ♂ Marte | Ares Vallis — Carl Sagan Memorial Station | 19.33° N, 326.45° E | [1996-068A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A) |
| 9 | **Spirit (MER-A)** | ♂ Marte | Gusev Crater — Troy, junto a Home Plate | 14.569° S, 175.473° E | [2003-027A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-027A) |
| 10 | **Opportunity (MER-B)** | ♂ Marte | Meridiani Planum — Perseverance Valley, Endeavour Crater | 1.946° S, 354.473° E | [2003-032A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A) |
| 11 | **Phoenix Mars Lander** | ♂ Marte | Green Valley — Vastitas Borealis | 68.218° N, 234.248° E | [2007-034A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2007-034A) |
| 12 | **InSight Mars Lander** | ♂ Marte | Elysium Planitia — Homestead hollow | 4.502° N, 135.623° E | [2018-042A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A) |
| 13 | **Ingenuity Mars Helicopter** | ♂ Marte | Jezero Crater — Valinor Hills, ubicación final | 18.444° N, 77.451° E | [2020-052A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052A) |

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
│   │   ├── echo-marker.js           # Ficha lateral con datos y acceso al sintonizador
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
│       ├── trivia.js                # Preguntas y confirmación de respuesta correcta
│       ├── frequencies.js           # 13 frecuencias de juego y compatibilidad de IDs
│       └── progress.js              # Persistencia compartida y estado de las trivias
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
- **Control de reproducción**: Si el navegador bloquea el inicio automático tras sintonizar, el botón **INICIAR RELATO** permite comenzar el audio con un clic.
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
