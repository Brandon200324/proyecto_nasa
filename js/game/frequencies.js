/* Canales ficticios del minijuego; no son frecuencias de las misiones NASA. */
import { canonicalArtifactId } from './progress.js';

export const FREQ_MIN = 100;
export const FREQ_MAX = 500;
export const MARGIN = 5;

const FREQUENCIES = {
  'apollo-11-descent-stage': 146,
  'surveyor-3': 172,
  'apollo-15-lrv': 198,
  'apollo-alsep-lrrr': 224,
  'apollo17-lrv': 250,
  'viking-1-lander': 276,
  'viking2-lander': 302,
  'pathfinder-sojourner': 328,
  'spirit-mer-a': 354,
  'opportunity-mer-b': 380,
  'phoenix-lander': 406,
  'insight-lander': 432,
  'ingenuity-helicopter': 458,
};

export function targetFrequency(id) {
  const canonicalId = canonicalArtifactId(id);
  return Object.hasOwn(FREQUENCIES, canonicalId) ? FREQUENCIES[canonicalId] : 240;
}
