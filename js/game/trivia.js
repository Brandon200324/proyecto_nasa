/* ============================================================
   ECHOES OF SOL · game/trivia.js
   Minijuego "restaurar señal": trivia por artefacto (Priscila)
   Al acertar → chime + Morse + insignia (evento echo:badge-earned)
   ============================================================ */
import { soundscape } from '../audio/soundscape.js';
import { completeArtifact, isArtifactCompleted } from './progress.js';

/**
 * @param {object} artifact - registro de equipment_data.json
 * @param {boolean} alreadyEarned - si la insignia ya fue ganada
 */
export function openTrivia(artifact, alreadyEarned = false) {
  const challenge = artifact.interactive_challenge;
  if (!challenge) return;

  const overlay = document.createElement('div');
  overlay.className = 'trivia-overlay';
  overlay.innerHTML = `
    <div class="trivia-card" role="dialog" aria-modal="true" aria-label="Trivia de restauración de señal">
      <p class="trivia-kicker">RESTAURANDO ENLACE · ${escapeHtml(artifact.name)}</p>
      <h3>${escapeHtml(challenge.question)}</h3>
      <div class="trivia-options"></div>
      <div class="trivia-after" hidden></div>
      <div class="trivia-actions">
        <button type="button" class="trivia-btn" data-action="close">CERRAR</button>
        <button type="button" class="trivia-btn primary" data-action="restore" hidden>SEÑAL RESTAURADA ✓</button>
      </div>
    </div>
  `;

  const optionsBox = overlay.querySelector('.trivia-options');
  const afterBox = overlay.querySelector('.trivia-after');
  const restoreBtn = overlay.querySelector('[data-action="restore"]');

  challenge.options.forEach((text, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'trivia-option';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      const correct = index === challenge.correct_index;
      btn.classList.add(correct ? 'correct' : 'wrong');

      if (!correct) {
        soundscape.staticBurst(0.5, 0.08); // interferencia al fallar
        // Deshabilita solo la opción errada; permite reintentar
        btn.disabled = true;
        return;
      }

      // Acertó: congela el juego y muestra el dato curioso
      const completedBefore = alreadyEarned || isArtifactCompleted(artifact.id);
      optionsBox.querySelectorAll('.trivia-option').forEach((b) => (b.disabled = true));
      soundscape.chime();
      soundscape.morse(callsign(artifact.id));

      afterBox.innerHTML = `
        <div class="trivia-funfact">
          <strong>Dato curioso:</strong> ${escapeHtml(challenge.fun_fact)}
        </div>`;
      afterBox.hidden = false;
      restoreBtn.hidden = false;
      restoreBtn.disabled = completedBefore;
      restoreBtn.textContent = completedBefore ? 'TRIVIA YA COMPLETADA ✓' : 'TRIVIA COMPLETADA ✓';

      completeArtifact(artifact.id);
    });
    optionsBox.appendChild(btn);
  });

  const close = () => {
    document.removeEventListener('keydown', esc);
    overlay.remove();
  };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  overlay.querySelector('[data-action="close"]').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', esc);
  document.body.appendChild(overlay);
  optionsBox.querySelector('.trivia-option')?.focus();
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
