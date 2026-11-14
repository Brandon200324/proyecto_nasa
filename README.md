# 🛰️ Echoes of Sol

> **NASA Space Apps Challenge 2026** · Reto: *«Abandoned but not Forgotten»*
> Experiencia web interactiva de los rovers, landers y etapas de descenso que la humanidad
> abandonó en la **Luna** y en **Marte**… pero que nunca olvidó.

## 🚀 Cómo correr el proyecto (importante: nunca abrir `index.html` directo)

```bash
cd proyecto_nasa
npx serve .
# abre la URL que imprime (típicamente http://localhost:3000)
```

> Se necesita un servidor local por los módulos ES (`importmap` de Three.js) y el `fetch`
> del JSON. Alternativa: la extensión **Live Server** de VS Code.

## 🧱 Stack (regla del equipo: no agregar frameworks)

| Capa | Tecnología |
| :--- | :--- |
| Estructura | HTML5 semántico + Web Components |
| Estilos | CSS moderno: variables, grid, glassmorphism, `@keyframes` |
| Render 3D | Three.js (WebGL) + OrbitControls |
| Animación | GSAP + ScrollTrigger |
| Audio | Web Audio API (100% sintetizado, sin archivos) |
| Datos | `data/equipment_data.json` (única fuente de verdad) |

## 📁 Estructura

```
proyecto_nasa/
├── index.html                  # Shell + importmap + GSAP
├── css/
│   ├── base.css                # Variables, reset, a11y
│   ├── hud.css                 # Paneles HUD, trivia, insignias
│   └── scrollytelling.css      # Pasos narrativos
├── js/
│   ├── main.js                 # Orquestador (fetch JSON + eventos)
│   ├── components/             # echo-globe · echo-marker · echo-audio · echo-badge
│   ├── three/                  # scene.js · markers.js · textures.js
│   ├── audio/soundscape.js     # Estática, Morse, ambiente, chime
│   ├── ui/scroll.js            # GSAP + ScrollTrigger
│   └── game/
│       ├── signal-tuner.js     # Minijuego "Restaurar la Frecuencia" (dial + onda + estática)
│       └── trivia.js           # Minijuego de trivia por artefacto
├── data/equipment_data.json    # 6 artefactos (2 Luna + 4 Marte)
└── assets/textures/            # 2k_mars.jpg · 2k_moon.jpg
```

## 🌑 Catálogo incluido

| Artefacto | Cuerpo | Sitio |
| :--- | :--- | :--- |
| Apollo 11 LM 'Eagle' (Descent Stage) | Luna | Base de la Tranquilidad |
| LRV Apollo 15 | Luna | Montes Apeninos / Hadley Rille |
| Viking 1 | Marte | Chryse Planitia |
| Spirit (MER-A) | Marte | Cráter Gusev |
| Opportunity (MER-B) | Marte | Meridiani Planum |
| InSight | Marte | Elysium Planitia |

## 🥇 Reglas de Oro de Git

1. **Nadie hace `push` directo a `main`.** Solo entregas finales de Brandon.
2. **`develop` es la rama de integración.** Todo el equipo parte desde ahí y abre PRs hacia `develop`.
3. **Commits atómicos y descriptivos** con prefijos:
   - `feat: añade esfera 3D de Marte`
   - `fix: corrige error de coordenadas en Opportunity`
   - `docs: actualiza ficha de misiones de Apolo`
   - `style: ajusta desenfoque de panel HUD`

### Ramas por rol

| Persona | Rama | Archivos |
| :--- | :--- | :--- |
| Michelle (Tech Lead & 3D) | `feature/threejs-scene` | `js/three/*`, `echo-globe.js`, `echo-marker.js` |
| Diego (UI/UX & Scrollytelling) | `feature/ui-scrollytelling` | `css/*`, `js/ui/scroll.js` |
| Priscila (Lógica & Audio) | `feature/logic-audio` | `js/audio/*`, `js/game/*`, `echo-audio.js`, `echo-badge.js` |
| Jorge (NASA Data) | `feature/nasa-data-content` | `data/equipment_data.json` |
| Brandon (QA & Assets) | `feature/qa-and-assets` | `assets/*`, merges a `main` |

### Primer día de contribución

```bash
git clone git@github.com:Michelle38907/proyecto_nasa.git
cd proyecto_nasa
git checkout develop && git pull
git checkout -b feature/tu-rama
# … trabaja …
git add . && git commit -m "feat: …" && git push -u origin feature/tu-rama
# abre el PR hacia develop en GitHub
```

## ♿ Accesibilidad y rendimiento

- Navegación por teclado, `aria-*` en HUD, trivias y globos.
- `prefers-reduced-motion` desactiva animaciones y scroll effects.
- Audio sintetizado: **0 archivos descargados** para sonido.
- Textura procedural de respaldo si un JPG falla (nunca rompe la demo).

## 📜 Créditos

- Datos y coordenadas: NASA NSSDCA / Planetary Data System.
- Texturas globales: **NASA/USGS** — Mars Viking MDIM 2.1 Color Mosaic (datos NASA/JPL/USGS, dominio público) y Lunar Reconnaissance Orbiter WAC Color Global Mosaic (NASA SVS, dominio público).
- Fotos de artefactos: NASA Image and Video Library (`images-api.nasa.gov`), dominio público.
- Historias: monólogos educativos basados en la línea de tiempo oficial de cada misión.

¡Vamos por ese premio global! 🌟
