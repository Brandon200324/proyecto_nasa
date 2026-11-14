# 03 · Esquema de Datos — `data/equipment_data.json`

> **Dueño del archivo: Jorge** (rol NASA Data & Storytelling).
> Este archivo es la única fuente de verdad de la app: si cambias un campo,
> actualiza este documento en el mismo PR.

## 1. Forma general

```json
[
  { ...artefacto1... },
  { ...artefacto2... }   // array plano; el orden define el orden de marcadores
]
```

Estado actual: **6 artefactos** — 2 de Luna, 4 de Marte:

| id | Cuerpo | Sitio |
| :--- | :--- | :--- |
| `apollo11-descent-stage` | moon | Base de la Tranquilidad (Mare Tranquillitatis) |
| `apollo15-lrv` | moon | Montes Apeninos / Hadley Rille |
| `viking1-lander` | mars | Chryse Planitia |
| `spirit-mer-a` | mars | Cráter Gusev / Home Plate |
| `opportunity-mer-b` | mars | Meridiani Planum / Valle de la Perseverancia |
| `insight-lander` | mars | Elysium Planitia |

## 2. Campos obligatorios (todos los objetos deben tenerlos)

| Campo | Tipo | Regla | Consumido por |
| :--- | :--- | :--- | :--- |
| `id` | string | kebab-case, único, estable (es la clave de insignias) | todos |
| `name` | string | Nombre oficial de la misión | panel ficha |
| `mission_type` | string | `'Rover' \| 'Lander' \| 'Descent Stage'` | panel ficha |
| `body` | string | `'moon'` o `'mars'` (minúsculas) | globo, panel |
| `site` | string | Nombre del lugar de aterrizaje | panel ficha |
| `coordinates` | `{lat, lon}` | floats; **lon normalizada ±180** (oeste = negativo) | marcadores 3D |
| `landing_date` | string | `YYYY-MM-DD` | panel |
| `final_contact_date` | string | `YYYY-MM-DD` | panel |
| `operational_duration` | string | Texto legible (ej. `"2,210 días terrestres (2,269 soles)"`) | panel |
| `status` | string | Estado físico actual, una línea | panel |
| `monument_significance` | string | Frase concisa: por qué es un monumento | panel (blockquote) |
| `hardware_remains` | string[] | 3–4 instrumentos que quedaron físicamente | chips del panel |
| `scientific_legacy` | `{breakthrough, earth_impact}` | Hito + impacto en la Tierra | panel |
| `first_person_story` | `{title, voice_text}` | ver §4 | panel |
| `interactive_challenge` | `{question, options, correct_index, fun_fact}` | ver §5 | trivia |
| `audio_cue` | string | `'static_morse'` (Luna/Apolo) o `'static_rover'` (Marte) | sonidoscape |
| `color_accent` | string | Hex, acento visual único por artefacto | HUD, panel, marcador |

## 3. Reglas de coordenadas (crítico para el globo 3D)

- Latitud: −90 a 90 (norte positivo).
- Longitud: **±180** (Este positivo, Oeste negativo). Si tu fuente (PDS) usa 0–360 E,
  convierte: `lon_±180 = 360 − lon_E` cuando lon_E > 180.
- Ejemplo ya convertido: Opportunity `354.4734 E` → `-5.5266`.
- Fuentes oficiales: NASA NSSDCA (`nssdc.gsfc.nasa.gov`), Planetary Data System,
  hoja de "Landing Site" de cada misión en `planetarynames.wr.usgs.gov`.
- Al agregar un artefacto, verifica el par (lat, lon) contra **dos fuentes** y anota las
  URLs en tu PR (Brandon las necesita para el anexo del pitch).

## 4. `first_person_story` (monólogo)

```json
"first_person_story": {
  "title": "Título poético corto (3–6 palabras)",
  "voice_text": "Monólogo en primera persona ('Yo soy...')"
}
```

Reglas de redacción de `voice_text`:
- 140–180 palabras, dirigido a chicos/as de 10–14 años.
- Tono cálido, orgulloso, emotivo; **científicamente exacto** (números reales).
- Debe incluir: (1) propósito original, (2) mayor logro explicado de forma asombrosa,
  (3) cómo se siente "quedar atrás" + orgullo del deber cumplido.
- **Debe cerrar** con una invitación a restaurar su señal (ej. "¿Me ayudas a que mi
  señal vuelva a sonar?") — es el gancho hacia el CTA de la trivia.
- Se renderiza con saltos de línea preservados (`white-space: pre-line`).

## 5. `interactive_challenge` (trivia → insignia)

```json
"interactive_challenge": {
  "question": "Pregunta clara para un niño de 10–14 años",
  "options": ["A", "B", "C"],          // EXACTAMENTE 3 opciones
  "correct_index": 0,                   // 0, 1 o 2 (índice de la correcta)
  "fun_fact": "Dato curioso que se muestra al acertar"
}
```

⚠️ La app **no baraja opciones**: si `correct_index` siempre es 0, el juego se vuelve
predecible. **Al agregar artefactos, varía `correct_index`** (0, 1 o 2).

## 6. Campos opcionales en evaluación (no bloquean la app si faltan)

| Campo | Propósito | Consumidor |
| :--- | :--- | :--- |
| `fun_fact_telemetry` | Frase que imita su última transmisión; panel de "telemetría retro" | (Diego, fase 2) |
| `source_urls` | array de URLs oficiales NASA/PDS | anexo del pitch (Brandon) |

## 7. Checklist para agregar un artefacto nuevo

1. Coordenadas verificadas en 2 fuentes oficiales (+ lon en ±180).
2. Fechas según la cronología oficial NASA.
3. Monólogo 140–180 palabras, cierre con invitación.
4. 3 opciones de trivia con `correct_index` variado.
5. `audio_cue` y `color_accent` (hex que contraste sobre fondo oscuro, y distinto al de los 6 actuales).
6. Validar: `node -e "JSON.parse(require('fs').readFileSync('data/equipment_data.json','utf8'))"`.
7. Probar visualmente con `npx serve .` (el marcador debe aparecer en el lugar correcto del globo).
8. Commits tipo: `docs: añade ficha de Phoenix Lander con monólogo y coordenadas`.
