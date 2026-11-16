"""Check ES/EN catalog structure, scientific references and preserved UI features."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return json.loads((ROOT / 'data' / name).read_text(encoding='utf-8'))


def same_shape(original, translated, location):
    assert type(original) is type(translated), f'{location}: type changed'
    if isinstance(original, dict):
        assert original.keys() == translated.keys(), f'{location}: keys changed'
        for key in original:
            same_shape(original[key], translated[key], f'{location}.{key}')
    elif isinstance(original, list):
        assert len(original) == len(translated), f'{location}: list length changed'
        for index, (left, right) in enumerate(zip(original, translated)):
            same_shape(left, right, f'{location}[{index}]')
    elif isinstance(original, str):
        assert translated.strip(), f'{location}: empty translation'


artifacts = read('equipment_data.json')
english = read('equipment_data_en.json')
assert len(artifacts) == len(english) == 13
assert len({artifact['id'] for artifact in english}) == 13
for original, translated in zip(artifacts, english):
    same_shape(original, translated, original['id'])
    for key in ['id', 'nssdca_id', 'nasa_url', 'mission_type', 'body', 'coordinates',
                'landing_date', 'final_contact_date', 'image', 'color_accent', 'audio_cue']:
        assert original[key] == translated[key], (original['id'], key)
    for coordinate in translated['coordinates'].values():
        assert isinstance(coordinate, float), original['id']
    quiz = translated['interactive_challenge']
    assert quiz['correct_index'] == original['interactive_challenge']['correct_index']
    assert len(quiz['options']) == 3 and 0 <= quiz['correct_index'] < 3
    story = translated['first_person_story']['voice_text']
    assert story.startswith('I am '), original['id']
    assert 120 <= len(story.split()) <= 150, original['id']
    assert (ROOT / translated['image']).is_file(), translated['image']

terms = read('glossary_data.json')
english_terms = read('glossary_data_en.json')
assert len(terms) == len(english_terms) == 8
assert len({term['id'] for term in english_terms}) == 8
artifact_ids = {artifact['id'] for artifact in artifacts}
for original, translated in zip(terms, english_terms):
    same_shape(original, translated, original['id'])
    for key in ['id', 'associated_artifacts']:
        assert original[key] == translated[key], (original['id'], key)
    assert set(translated['associated_artifacts']) <= artifact_ids
    for key in ['frequency_mhz', 'signal_type']:
        assert original['radio_telemetry_profile'][key] == translated['radio_telemetry_profile'][key]

# Each local narration must contain exactly the selected catalog's words and timing.
for suffix, catalog in [('', artifacts), ('_en', english)]:
    manifest = read(f'voice_tracks{suffix}.json')
    assert set(manifest) == {artifact['id'] for artifact in catalog}
    for artifact in catalog:
        track = manifest[artifact['id']]
        audio = ROOT / track['audio']
        assert audio.is_file() and audio.stat().st_size > 1000, audio
        prefix = 'assets/audio/en/' if suffix else 'assets/audio/'
        assert track['audio'] == f"{prefix}{artifact['id']}.mp3"
        assert [word['text'] for word in track['words']] == artifact['first_person_story']['voice_text'].split()
        previous = 0
        for word in track['words']:
            assert previous <= word['start'] and word['duration'] > 0, artifact['id']
            assert word['start'] + word['duration'] <= track['duration'] + 0.001, artifact['id']
            previous = word['start']

tuner = (ROOT / 'js/game/signal-tuner.js').read_text(encoding='utf-8')
styles = re.search(r'style.textContent = `([\s\S]*?)`;', tuner).group(1)
for rule in ['width: 90vw;', 'max-height: 85vh;', 'font-size: 1.2rem;',
             'scrollbar-color: var(--echo-accent) transparent;']:
    assert rule in styles, rule
assert 'drawImage' not in tuner, 'Keep the oscilloscope exclusively for radio waves'
assert '<figure class="marker-photo"' in (ROOT / 'js/components/echo-marker.js').read_text(encoding='utf-8')
print('I18N DATA OK: 13 artifacts, 8 terms, 26 local ES/EN narrations with exact word timings, stable scientific references and preserved UI features.')
