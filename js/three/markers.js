/* ============================================================
   ECHOES OF SOL · three/markers.js
   Conversión lat/lon → XYZ y construcción de marcadores 3D
   ============================================================ */
import * as THREE from 'three';

/**
 * Convierte coordenadas planetarias (lat/lon en grados) a posición
 * sobre una esfera de radio `radius`. Convención: eje Y = polo norte,
 * lon en grados Este positivo (JSON ya normalizado a ±180).
 */
export function latLonToVector3(lat, lon, radius = 1) {
  const latR = THREE.MathUtils.degToRad(lat);
  const lonR = THREE.MathUtils.degToRad(lon);
  const x = radius * Math.cos(latR) * Math.cos(lonR);
  const y = radius * Math.sin(latR);
  const z = radius * Math.cos(latR) * Math.sin(lonR) * -1;
  return new THREE.Vector3(x, y, z);
}

/**
 * Crea el grupo de marcadores para los artefactos del cuerpo activo.
 * Cada marcador = punto luminoso + anillo pulsante orientado tangencialmente.
 */
export function createMarkers(artifacts, radius = 1) {
  const group = new THREE.Group();
  const dots = [];
  const rings = [];

  // La Luna tiene menos artefactos y se ve más vacía:
  // sus marcadores son más grandes para mantener la legibilidad.
  const body = artifacts[0]?.body;
  const scale = body === 'moon' ? 1.4 : 1;

  artifacts.forEach((artifact, i) => {
    const accent = new THREE.Color(artifact.color_accent || '#4cc9f0');
    const pos = latLonToVector3(artifact.coordinates.lat, artifact.coordinates.lon, radius * 1.005);

    // Punto central (objetivo del raycaster)
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.022 * scale, 16, 16),
      new THREE.MeshBasicMaterial({ color: accent })
    );
    dot.position.copy(pos);
    dot.userData = { artifactId: artifact.id, index: i };
    group.add(dot);
    dots.push(dot);

    // Anillo pulsante
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.05 * scale, 0.004 * scale, 8, 48),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.8 })
    );
    ring.position.copy(pos);
    ring.lookAt(pos.clone().multiplyScalar(2)); // tangente a la superficie
    ring.userData = { phase: i * 0.9 };
    group.add(ring);
    rings.push(ring);

    // Estela vertical corta (fijo sobre la superficie)
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0015 * scale, 0.0015 * scale, 0.09 * scale, 6),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5 })
    );
    const mid = pos.clone().multiplyScalar(1.048);
    stem.position.copy(mid);
    stem.lookAt(mid.clone().multiplyScalar(2));
    stem.rotateX(Math.PI / 2);
    group.add(stem);
  });

  group.userData = { dots, rings };
  return group;
}

/** Anima los anillos (llamar cada frame con el tiempo en segundos). */
export function updateMarkerPulse(group, t) {
  if (!group?.userData?.rings) return;
  group.userData.rings.forEach((ring) => {
    const { phase } = ring.userData;
    const pulse = 1 + 0.35 * Math.sin(t * 2.2 + phase);
    ring.scale.setScalar(pulse);
    ring.material.opacity = 0.85 - 0.45 * ((Math.sin(t * 2.2 + phase) + 1) / 2);
  });
}
