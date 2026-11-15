#!/usr/bin/env python3
"""Generate local Spanish narrations and per-word timing for the artifact stories.

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
DEFAULT_VOICE = "es-EC-LuisNeural"


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


async def generate_track(artifact: dict, voice: str, semaphore: asyncio.Semaphore):
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
                (ROOT / "assets" / "audio" / filename).write_bytes(audio)
                duration = max(word["start"] + word["duration"] for word in words)
                return artifact["id"], {
                    "audio": f"assets/audio/{filename}",
                    "duration": round(duration, 3),
                    "words": words,
                }
            except Exception as error:  # retry transient TTS service failures
                last_error = error
                if attempt < 2:
                    await asyncio.sleep(1.5 * (attempt + 1))
        raise RuntimeError(f"Could not generate {artifact['id']}: {last_error}")


async def main(voice: str) -> None:
    artifacts = json.loads((ROOT / "data" / "equipment_data.json").read_text(encoding="utf-8"))
    (ROOT / "assets" / "audio").mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(2)
    tracks = await asyncio.gather(*(generate_track(item, voice, semaphore) for item in artifacts))
    manifest = dict(tracks)
    (ROOT / "data" / "voice_tracks.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(f"Generated {len(tracks)} tracks with {voice}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--voice", default=DEFAULT_VOICE, help="Edge TTS voice (default: %(default)s)")
    asyncio.run(main(parser.parse_args().voice))
