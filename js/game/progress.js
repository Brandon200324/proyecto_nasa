/* Progreso de trivia compartido por el contador, las fichas y el globo. */
export const BADGES_STORAGE_KEY = 'echoes_badges';

const LEGACY_IDS = {
  'apollo11-descent-stage': 'apollo-11-descent-stage',
  'apollo15-lrv': 'apollo-15-lrv',
  'viking1-lander': 'viking-1-lander',
};

let sessionBadges = [];
const pendingBadges = new Set();

export function canonicalArtifactId(id) {
  return Object.hasOwn(LEGACY_IDS, id) ? LEGACY_IDS[id] : id;
}

export function completedArtifactIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(BADGES_STORAGE_KEY) || '[]');
    const saved = Array.isArray(stored)
      ? stored.filter((id) => typeof id === 'string').map(canonicalArtifactId)
      : [];
    sessionBadges = [...new Set([...saved, ...pendingBadges])];
  } catch (_) { /* Mantiene el progreso de la sesión si el almacenamiento no está disponible. */ }
  return [...sessionBadges];
}

export function isArtifactCompleted(id) {
  return completedArtifactIds().includes(canonicalArtifactId(id));
}

/** Se llama únicamente después de responder correctamente la trivia. */
export function completeArtifact(id) {
  if (typeof id !== 'string' || !id || isArtifactCompleted(id)) return false;
  const canonicalId = canonicalArtifactId(id);
  sessionBadges = [...completedArtifactIds(), canonicalId];
  try {
    localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(sessionBadges));
    pendingBadges.clear();
  } catch (_) {
    pendingBadges.add(canonicalId);
  }
  document.dispatchEvent(new CustomEvent('echo:badge-earned', { detail: { id: canonicalId } }));
  return true;
}
