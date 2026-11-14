/* ============================================================
   ECHOES OF SOL · ui/scroll.js
   Scrollytelling con GSAP + ScrollTrigger (Diego)
   v2: barra de progreso, parallax del paso 1 y contadores de
   estadísticas. Respeta prefers-reduced-motion y es responsivo
   vía gsap.matchMedia(). Sin tocar main.js ni los componentes.
   ============================================================ */

export function initScroll() {
  if (!window.gsap || !window.ScrollTrigger) return;
  window.gsap.registerPlugin(window.ScrollTrigger);

  const gsap = window.gsap;

  /* Accesibilidad: si el usuario pide menos movimiento,
     dejamos todo estático y solo creamos la barra de progreso. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    initProgress();
    return;
  }

  /* matchMedia de GSAP: reglas distintas escritorio vs móvil */
  const mm = gsap.matchMedia();

  mm.add("(min-width: 641px)", () => {
    initSteps(1);
    initParallax();
    initCounters();
  });

  mm.add("(max-width: 640px)", () => {
    /* Móvil: animaciones más cortas, sin parallax (rendimiento táctil) */
    initSteps(0.7);
    initCounters();
  });

  initProgress();
  hudCompact();
}

/* ------------------------------------------------------------
   Pasos del scrollytelling: aparición con ritmo (stagger)
   ------------------------------------------------------------ */
function initSteps(duration) {
  const steps = window.gsap.utils.toArray('.scrolly-step');
  steps.forEach((step, i) => {
    window.gsap.from(step.children, {
      opacity: 0,
      y: 60,
      duration: duration,
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
}

/* ------------------------------------------------------------
   Barra de progreso de scroll (.scroll-progress en index.html)
   Gradiente echo-accent → mars, con seguimiento suavizado.
   ------------------------------------------------------------ */
function initProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  window.gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
    },
  });
}

/* ------------------------------------------------------------
   Parallax del paso 1 (solo escritorio): el texto se apaga y
   flota al fondo mientras el usuario baja → sensación de espacio.
   ------------------------------------------------------------ */
function initParallax() {
  const hero = document.querySelector('.scrolly-step[data-step="1"]');
  if (!hero) return;
  window.gsap.to(hero, {
    opacity: 0.25,
    yPercent: 12,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/* ------------------------------------------------------------
   Contadores de estadísticas
   Uso: <span data-count="2210">0</span>
   Anima de 0 → data-count cuando el número entra en pantalla.
   (Los datos reales provienen de equipment_data.json de Jorge.)
   ------------------------------------------------------------ */
function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count) || 0;
    const obj = { value: 0 };

    window.gsap.to(obj, {
      value: target,
      duration: 2,
      ease: 'power2.out',
      snap: { value: 1 },
      onUpdate: () => { el.textContent = Math.round(obj.value).toLocaleString('es'); },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

/* ------------------------------------------------------------
   Barra HUD superior: se compacta al hacer scroll
   ------------------------------------------------------------ */
function hudCompact() {
  window.ScrollTrigger.create({
    start: 'top -80',
    onToggle: (self) => document.querySelector('.hud-top')?.classList.toggle('is-compact', self.isActive),
  });
}
