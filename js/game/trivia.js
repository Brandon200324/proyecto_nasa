/* ============================================================
   ECHOES OF SOL · game/trivia.js
   Minijuego "restaurar señal": trivia por artefacto (Priscila)
   Al acertar → chime + Morse + insignia (evento echo:badge-earned)
   ============================================================ */
import { t, getLang, setLang, localizeArtifact } from '../i18n.js';
import { soundscape } from '../audio/soundscape.js';
import { completeArtifact, isArtifactCompleted } from './progress.js';

/**
 * @param {object} artifact - registro de equipment_data.json
 * @param {boolean} alreadyEarned - si la insignia ya fue ganada
 */
export function openTrivia(artifact, alreadyEarned = false) {
  artifact = localizeArtifact(artifact);
  if (!artifact.interactive_challenge) return;
  const wrong = new Set();
  let solved = false;
  let completedBefore = alreadyEarned || isArtifactCompleted(artifact.id);
  const overlay = document.createElement('div');
  overlay.className = 'trivia-overlay';

  function render() {
    artifact = localizeArtifact(artifact);
    const challenge = artifact.interactive_challenge;
    overlay.innerHTML = `
      <div class="trivia-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(t('trivia.dialog', { name: artifact.name }))}">
        <p class="trivia-kicker">${escapeHtml(t('trivia.kicker', { name: artifact.name }))}</p>
        <h3>${escapeHtml(challenge.question)}</h3>
        <div class="trivia-options"></div>
        <p class="trivia-feedback" role="status">${solved ? t('trivia.correct') : wrong.size ? t('trivia.wrong') : ''}</p>
        <div class="trivia-after" ${solved ? '' : 'hidden'}>
          <div class="trivia-funfact"><strong>${t('trivia.fact')}</strong> ${escapeHtml(challenge.fun_fact)}</div>
        </div>
        <div class="trivia-actions">
          <button type="button" class="hud-lang-btn" data-action="language" aria-label="${escapeHtml(t('language.switch'))}"><span class="lang-icon" aria-hidden="true">🌐</span><span class="lang-code">${getLang() === 'es' ? 'EN' : 'ES'}</span></button>
          <button type="button" class="trivia-btn" data-action="close">${t('trivia.back')}</button>
          <button type="button" class="trivia-btn primary" data-action="restore" ${solved ? '' : 'hidden'} ${completedBefore ? 'disabled' : ''}>${t(completedBefore ? 'trivia.already' : 'trivia.completed')}</button>
        </div>
      </div>`;
    challenge.options.forEach((text, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'trivia-option';
      button.textContent = text;
      button.disabled = solved || wrong.has(index);
      button.classList.toggle('wrong', wrong.has(index));
      button.classList.toggle('correct', solved && index === challenge.correct_index);
      button.addEventListener('click', () => {
        if (index !== challenge.correct_index) {
          wrong.add(index);
          soundscape.staticBurst(0.5, 0.08);
        } else {
          completedBefore = alreadyEarned || isArtifactCompleted(artifact.id);
          solved = true;
          soundscape.chime();
          soundscape.morse(callsign(artifact.id));
          completeArtifact(artifact.id);
        }
        render();
        overlay.querySelector('.trivia-option:not(:disabled), [data-action="close"]')?.focus();
      });
      overlay.querySelector('.trivia-options').appendChild(button);
    });
    overlay.querySelector('[data-action="close"]').addEventListener('click', close);
    overlay.querySelector('[data-action="language"]').addEventListener('click', () => setLang(getLang() === 'es' ? 'en' : 'es'));
  }

  const onLanguage = () => {
    const active = document.activeElement;
    const focused = overlay.contains(active);
    const action = active?.dataset.action;
    const option = [...overlay.querySelectorAll('.trivia-option')].indexOf(active);
    render();
    if (focused) {
      const target = action ? overlay.querySelector(`[data-action="${action}"]`)
        : overlay.querySelectorAll('.trivia-option')[option];
      (target || overlay.querySelector('[data-action="close"]'))?.focus({ preventScroll: true });
    }
  };
  const close = () => {
    document.removeEventListener('keydown', esc);
    document.removeEventListener('echo:lang-changed', onLanguage);
    overlay.remove();
  };
  const esc = (event) => { if (event.key === 'Escape') close(); };
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', esc);
  document.addEventListener('echo:lang-changed', onLanguage);
  render();
  document.body.appendChild(overlay);
  overlay.querySelector('.trivia-option')?.focus();
}

/** Callsign corto para el Morse a partir del id estable del artefacto. */
function callsign(id) {
  const names = {
    'apollo-11-descent-stage': 'EAGLE',
    'surveyor-3': 'SURVEYOR',
    'apollo-15-lrv': 'FALCON',
    'apollo-alsep-lrrr': 'ALSEP',
    'apollo17-lrv': 'CHALLENGER',
    'viking-1-lander': 'VIKING',
    'viking2-lander': 'VIKING-2',
    'pathfinder-sojourner': 'SOJOURNER',
    'spirit-mer-a': 'SPIRIT',
    'opportunity-mer-b': 'OPPY',
    'phoenix-lander': 'PHOENIX',
    'insight-lander': 'INSIGHT',
    'ingenuity-helicopter': 'INGENUITY',
  };
  return names[id] || 'ECHO';
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
