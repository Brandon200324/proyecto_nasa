# Narraciones locales ES / EN

Los 26 MP3 se generan a partir de `first_person_story.voice_text` de cada
catálogo. Son voces sintéticas, no grabaciones de la NASA ni telemetría real.

| Idioma | Voz | Archivos | Índice de tiempos |
| --- | --- | --- | --- |
| Español | es-EC-LuisNeural | assets/audio/[id].mp3 | data/voice_tracks.json |
| Inglés | en-US-GuyNeural | assets/audio/en/[id].mp3 | data/voice_tracks_en.json |

La web reproduce ambos idiomas con el reproductor local y sincroniza el
resaltado palabra por palabra con su tiempo. La reproducción no necesita voces
instaladas en el sistema ni solicita audio a un servicio TTS externo.

Para regenerar cuando cambien los relatos (desde la raíz del proyecto):

```bash
python3 -m venv .venv-voices
.venv-voices/bin/python -m pip install edge-tts==7.3.1
.venv-voices/bin/python scripts/generate_voice_assets.py --lang es
.venv-voices/bin/python scripts/generate_voice_assets.py --lang en
```

El generador usa [edge-tts](https://github.com/rany2/edge-tts) para obtener audio
y eventos `WordBoundary`; requiere Internet solamente durante la generación.
Los índices conservan las palabras exactas de los catálogos y sus tiempos en
segundos. `--lang en` escribe en una carpeta y un índice propios para preservar
los archivos españoles. El índice se reemplaza al completar las trece pistas.

Para verificar la integridad de ambos idiomas:

```bash
python3 scripts/check_i18n_data.py
CHROME_BIN=/ruta/a/chrome node scripts/check_i18n_browser.cjs
```
