/* ============================================================
   ECHOES OF SOL · ui/scroll.js
   Scrollytelling con GSAP + ScrollTrigger (Diego)
   ============================================================ */

export function initScroll() {
  if (!window.gsap || !window.ScrollTrigger) return;
  window.gsap.registerPlugin(window.ScrollTrigger);

  const steps = window.gsap.utils.toArray('.scrolly-step');
  steps.forEach((step, i) => {
    window.gsap.from(step.children, {
      opacity: 0,
      y: 60,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: step, start: 'top 70%', toggleActions: 'play none none none' },
    });

    // La última letra del título entra con retardo (ritmo de escritura)
    const title = step.querySelector('.scrolly-title em');
    if (title) {
      window.gsap.from(title, {
        opacity: 0, x: 40, duration: 0.9, delay: 0.35,
        scrollTrigger: { trigger: step, start: 'top 70%' },
      });
    }
    void i; // reservado para efectos por-paso
  });

  // Barra HUD superior: se compacta al hacer scroll
  window.ScrollTrigger.create({
    start: 'top -80',
    onToggle: (self) => document.querySelector('.hud-top')?.classList.toggle('is-compact', self.isActive),
  });
}
