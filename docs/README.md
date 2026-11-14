# 📚 Documentación del Proyecto — Echoes of Sol

Bienvenido/a al equipo 👋 Esta carpeta es el **mapa oficial del proyecto**.
Léela antes de tocar código: aquí sabrás qué está hecho, qué falta y cómo
continuar con tu rol sin romper el trabajo de los demás.

## Orden de lectura recomendado

| # | Documento | Para quién | Qué contiene |
| :--- | :--- | :--- | :--- |
| 1 | [01-estado-del-proyecto.md](./01-estado-del-proyecto.md) | Todos | Qué está hecho ✅ y qué falta ⏳, archivo por archivo |
| 2 | [02-arquitectura-y-flujo.md](./02-arquitectura-y-flujo.md) | Todos | Cómo funciona la app de punta a punta, mapa de módulos y eventos |
| 3 | [03-esquema-de-datos.md](./03-esquema-de-datos.md) | Jorge (y quien toque el JSON) | Reglas de `equipment_data.json`: campos, coordenadas, monólogos |
| 4 | [04-guia-de-roles.md](./04-guia-de-roles.md) | Cada quien (su sección) | Onboarding por rol: tareas pendientes, dónde trabajar, cómo probar |

## Reglas rápidas antes de programar

1. **Nunca abras `index.html` directo**: sirve siempre con `npx serve .` o Live Server (CORS con Three.js y el fetch del JSON).
2. **Nunca hagas push a `main`**: trabaja en tu rama `feature/*` desde `develop` y abre PR.
3. **El JSON (`data/equipment_data.json`) es la única fuente de verdad**: no hardcodees datos en JS/CSS.
4. **No agregues frameworks ni librerías nuevas** sin acordarlo en el equipo (stack cerrado).
5. Antes de abrir tu PR: `node --check` a tus archivos JS y prueba visual con `npx serve .`.

## Cómo correr el proyecto

```bash
cd proyecto_nasa
npx serve .
# abre la URL que imprime (típicamente http://localhost:3000)
```

## ¿A quién pregunto qué?

| Duda sobre… | Pregunta a |
| :--- | :--- |
| Escena 3D, cámara, marcadores, ficha del artefacto | Michelle (@Michelle38907) |
| CSS, HUD, animaciones de scroll | Diego |
| Web Audio, trivia, insignias | Priscila |
| Coordenadas, fechas, monólogos, telemetría | Jorge |
| Assets, integración final, video, QA | Brandon |
