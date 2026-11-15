# Narraciones locales

Las trece narraciones se generan a partir de `first_person_story.voice_text`.
Son voces sintéticas en español ecuatoriano (**es-EC-LuisNeural**), no son
grabaciones de la NASA ni forman parte de la telemetría real de las misiones.

Los MP3 y los tiempos por palabra están incluidos en el repositorio. La web los
reproduce localmente y sincroniza el resaltado con el tiempo del reproductor; no
depende de voces instaladas en el sistema ni solicita audio a un servicio externo
en tiempo de ejecución.

Para regenerar los archivos cuando cambie el texto fuente:

```bash
python3 -m pip install edge-tts
python3 scripts/generate_voice_assets.py
```

El generador usa `edge-tts` para obtener audio y marcas `WordBoundary`; requiere
conexión a Internet solo durante la generación. Las marcas se guardan en
`data/voice_tracks.json` y se expresan en segundos.
