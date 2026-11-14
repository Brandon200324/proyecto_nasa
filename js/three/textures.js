/* ============================================================
   ECHOES OF SOL · three/textures.js
   Carga de texturas NASA/USGS con fallback procedural
   (si el JPG falla, se genera una esfera convincente en canvas)
   ============================================================ */
import * as THREE from 'three';

const TEXTURE_URLS = {
  mars: 'assets/textures/2k_mars.jpg',
  moon: 'assets/textures/2k_moon.jpg',
};

const FALLBACK_COLORS = {
  mars: { base: '#b1502e', blotch: 'rgba(60,20,10,0.25)' },
  moon: { base: '#8d8d92', blotch: 'rgba(40,40,45,0.3)' },
};

/** Textura procedural de respaldo (ruido + manchas/cráteres). */
export function createFallbackTexture(body) {
  const w = 1024, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const cfg = FALLBACK_COLORS[body] || FALLBACK_COLORS.mars;

  ctx.fillStyle = cfg.base;
  ctx.fillRect(0, 0, w, h);

  // Manchas irregulares (mares / mares marcianos)
  for (let i = 0; i < 90; i++) {
    const r = 20 + Math.random() * 90;
    ctx.fillStyle = cfg.blotch;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ruido de alta frecuencia
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  // Cráteres con borde iluminado
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * w, y = 60 + Math.random() * (h - 120);
    const r = 2 + Math.random() * 14;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.arc(x + 1, y + 1, r * 0.8, 0, Math.PI * 2); ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Carga la textura real; resuelve con fallback si la red o el archivo fallan. */
export function loadPlanetTexture(body) {
  return new Promise((resolve) => {
    const url = TEXTURE_URLS[body] || TEXTURE_URLS.mars;
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        resolve(tex);
      },
      undefined,
      () => resolve(createFallbackTexture(body))
    );
  });
}
