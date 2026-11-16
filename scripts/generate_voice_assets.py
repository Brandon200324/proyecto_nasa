#!/usr/bin/env python3
"""Generate local ES/EN narrations and per-word timing for the artifact stories.

Build-time only: install `edge-tts` and run from any directory. The website
plays the resulting MP3 files locally and does not contact a TTS service.
"""

import argparse
import asyncio
import json
import re
import unicodedata
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
TICKS_PER_SECOND = 10_000_000
DEFAULT_VOICES = {"es": "es-EC-LuisNeural", "en": "en-US-GuyNeural"}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFD", value.lower())
    return "".join(char for char in value if char.isalnum())


def align_words(text: str, events: list[dict]) -> list[dict]:
    """Expand occasional multi-word TTS boundaries to source word timings."""
    tokens = re.findall(r"\S+", text)
    aligned = []
    token_index = 0

    for event in events:
        expected = normalize(event["text"])
        match_end = None
        combined = ""
        for end in range(token_index + 1, min(len(tokens), token_index + 10) + 1):
            combined += normalize(tokens[end - 1])
            if combined == expected:
                match_end = end
                break
            if not expected.startswith(combined):
                break

        if match_end is None:
            nearby = " ".join(tokens[token_index : token_index + 5])
            raise ValueError(f"Could not align source words {nearby!r} with {event['text']!r}")

        group = tokens[token_index:match_end]
        weights = [max(1, len(normalize(token))) for token in group]
        total_weight = sum(weights)
        cursor = event["offset"] / TICKS_PER_SECOND
        duration = event["duration"] / TICKS_PER_SECOND
        for token, weight in zip(group, weights):
            word_duration = duration * weight / total_weight
            aligned.append(
                {
                    "text": token,
                    "start": round(cursor, 4),
                    "duration": round(word_duration, 4),
                }
            )
            cursor += word_duration
        token_index = match_end

    if token_index != len(tokens):
        raise ValueError(f"{len(tokens) - token_index} source words have no timing")
    return aligned


async def generate_track(artifact: dict, voice: str, semaphore: asyncio.Semaphore, output_dir: Path):
    async with semaphore:
        text = artifact["first_person_story"]["voice_text"]
        last_error = None
        for attempt in range(3):
            try:
                communicate = edge_tts.Communicate(
                    text,
                    voice,
                    rate="-5%",
                    volume="+0%",
                    pitch="-1Hz",
                    boundary="WordBoundary",
                )
                audio = bytearray()
                events = []
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        events.append(chunk)

                words = align_words(text, events)
                if len(audio) < 1_000 or not words:
                    raise ValueError("TTS returned empty audio or timings")

                filename = f"{artifact['id']}.mp3"
                audio_path = output_dir / filename
                audio_path.write_bytes(audio)
                duration = max(word["start"] + word["duration"] for word in words)
                print(f"Generated {artifact['id']}: {len(words)} words, {duration:.1f}s", flush=True)
                return artifact["id"], {
                    "audio": audio_path.relative_to(ROOT).as_posix(),
                    "duration": round(duration, 3),
                    "words": words,
                }
            except Exception as error:  # retry transient TTS service failures
                last_error = error
                if attempt < 2:
                    await asyncio.sleep(1.5 * (attempt + 1))
        raise RuntimeError(f"Could not generate {artifact['id']}: {last_error}")


async def main(voice: str, lang: str = "es") -> None:
    suffix = "_en" if lang == "en" else ""
    artifacts = json.loads((ROOT / "data" / f"equipment_data{suffix}.json").read_text(encoding="utf-8"))
    output_dir = ROOT / "assets" / "audio"
    if lang == "en":
        output_dir /= "en"
    output_dir.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(2)
    tracks = await asyncio.gather(*(generate_track(item, voice, semaphore, output_dir) for item in artifacts))
    manifest = dict(tracks)
    manifest_path = ROOT / "data" / f"voice_tracks{suffix}.json"
    temporary_path = manifest_path.with_suffix(".json.tmp")
    temporary_path.write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    temporary_path.replace(manifest_path)
    print(f"Generated {len(tracks)} {lang} tracks with {voice}: {manifest_path.relative_to(ROOT)}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=["es", "en"], default="es", help="Catalog language (default: es)")
    parser.add_argument("--voice", help="Override the language's default Edge TTS voice")
    args = parser.parse_args()
    asyncio.run(main(args.voice or DEFAULT_VOICES[args.lang], args.lang))
