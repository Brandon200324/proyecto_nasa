# 02 · Arquitectura y Flujo de la Aplicación

> Esta app **no tiene servidor**: el "backend" es la capa de datos (`equipment_data.json`)
> + la lógica local en JS. Todo corre en el navegador. Stack cerrado: HTML/CSS/JS +
> Three.js + GSAP + Web Audio API + JSON. **No agregar frameworks.**

## 1. Mapa de módulos y dependencias

```
index.html
└─ js/main.js  (orquestador)
   ├─ carga data/equipment_data.json  (fetch)
   ├─ importa los 4 Web Components (se auto-registran)
   ├─ importa ui/scroll.js  (GSAP)
   └─ importa audio/soundscape.js
        │
        ├── components/echo-globe.js ─── three/scene.js ─── three/textures.js
        │       (eventos)                │
        │                                └── three/markers.js (lat/lon → XYZ)
        ├── components/echo-marker.js ── game/trivia.js ── audio/soundscape.js
        ├── components/echo-badge.js   (localStorage)
        └── components/echo-audio.js   (toggle maestro)
```

**Reglas de dependencia:**
- Los componentes se comunican por **eventos CustomEvent** en `document` o en el propio
  componente. No llames lógica de otro módulo "por la espalda".
- `window.ECHO_DATA` lo publica `main.js` tras el fetch: es la única variable global.
- El CSS vive en archivos, no en Shadow DOM (estilos globales compartidos).

## 2. Flujo de la experiencia (punta a punta)

```
1. PRELOADER
   boot() en main.js → fetch JSON → window.ECHO_DATA → evento echo:data-ready
   → badge actualiza su total → preloader se desvanece (600 ms)

2. SCROLLYTELLING (GSAP + ScrollTrigger)
   3 pasos a pantalla completa: "El silencio también habla" →
   "Son monumentos" → "Restaura su señal" (CTA a #explorer)

3. EXPLORADOR 3D
   initBodySwitch() → setBody('mars') (prototipo acordado)
   → echo-globe.setBody(body, artefactos) → PlanetScene.setBody():
     · carga textura (con fallback procedural)
     · crea marcadores de los artefactos de ESE cuerpo
     · tween de reentrada de cámara

4. INTERACCIÓN
   Raycaster: clic en marcador (distingue de drags)
   → echo:marker-selected { id, index }
   → main.js: globe.focus(id)  (tween GSAP de cámara)
             + soundscape.playCue(audio_cue, callsign)  (estática + Morse)
             + markerPanel.open(artefacto, insigniaYaGanada)

5. FICHA (echo-marker)
   Stats, hardware, legado y estado de la trivia; no incluye texto ni audio del monólogo.
   → "Sintonizar voz" → dial con frecuencia propia por artefacto (js/game/frequencies.js).
   → Mantener la frecuencia correcta ±5 MHz durante 1 segundo desbloquea imagen, voz y texto.
   → Al terminar el relato aparece el acceso a la trivia.

6. TRIVIA (game/trivia.js)
   Acertar → chime + Morse del callsign + dato curioso.
   → progress.js guarda el id canónico en localStorage('echoes_badges').
   → Después emite document.dispatchEvent('echo:badge-earned', { id }).
   → echo-badge actualiza contador y toast; el globo muestra un visto verde sobre el punto.
   → Ficha, contador y vistos se restauran al recargar y al cambiar entre Luna y Marte.
   → Una respuesta incorrecta, abrir la ficha o sintonizar no completan la trivia.

7. CIERRE DE FICHA
   Botón ✕ o clic en el globo (no en marcador) → echo:marker-deselect
   → panel.close() + globe.reset() (cámara vuelve, autorrotación on)
```

## 3. Contratos de eventos (⚠️ NO cambiar nombres: hay módulos suscritos)

| Evento | Quién lo emite | Quién escucha | `detail` |
| :--- | :--- | :--- | :--- |
| `echo:marker-selected` | `echo-globe` (clic en marcador) | `main.js` | `{ id: string, index: number }` |
| `echo:marker-deselect` | `echo-globe` (clic fuera de marcadores) | `main.js` | — |
| `echo:badge-earned` | `game/progress.js`, llamado por trivia al acertar y después de guardar el progreso | `echo-badge`, ficha y globo | `{ id: string }` |
| `echo:data-ready` | `main.js` (tras fetch OK) | `echo-badge` | `{ total: number }` |

**Para agregar un evento nuevo:** crea el nombre con prefijo `echo:`, documenta aquí,
y suscríbete con `document.addEventListener` (si es global) o en el elemento (si es local).

## 4. API de los Web Components

```js
<echo-globe id="globe">
  .setBody('mars' | 'moon', artifacts[])   // recarga planeta + marcadores
  .focus(artifactId)                       // tween de cámara al marcador
  .reset()                                 // vista general + autorrotación

<echo-marker id="marker-panel">
  .open(artifact, badgeEarned: boolean)    // abre panel con datos
  .close()                                 // cierra (450 ms de transición)
  // usa --echo-accent (del color_accent del artefacto) para todo su tinte

<echo-badge id="badge-tracker">
  .earn(artifactId)                        // interno vía evento; expone render/toast

<echo-audio>                               // autónomo, toggle de soundscape
```

## 5. Variables CSS de integración

```css
:root {
  --echo-accent: <color>;  /* la cambia main.js al alternar Luna/Marte,
                              y echo-marker al abrir una ficha */
  --mars: #e05a3a;  --moon: #c9a227;  --accent: #4cc9f0;
}
```
Regla: **toda UI nueva debe teñirse con `--echo-accent`** (o un acento semántico),
nunca con colores fijos, para respetar el tema por cuerpo/artefacto.

## 6. Decisiones técnicas ya tomadas (no re-litigar sin el equipo)

- Three.js y GSAP por CDN; el resto del audio es sintetizado (0 KB de sonido).
- Convención de coordenadas: lon normalizada a ±180 (oeste negativo) — el JSON ya viene así; `latLonToVector3` convierte a XYZ con Y = polo norte.
- El minijuego oficial de v1 es **trivia** (campo `interactive_challenge`); puzzle físico es fase 2 opcional.
- Cuerpo inicial: **Marte** (4 de 6 artefactos). Luna accesible con el toggle.
- Persistencia: `localStorage` con la clave `echoes_badges` (array de ids).
- Accesibilidad obligatoria: `aria-*`, foco visible, `prefers-reduced-motion`.
