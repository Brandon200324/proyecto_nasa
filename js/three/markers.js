/* ============================================================
   ECHOES OF SOL · three/markers.js
   Conversión lat/lon → XYZ y construcción de marcadores 3D
   ============================================================ */
import * as THREE from 'three';
import { canonicalArtifactId, completedArtifactIds } from '../game/progress.js';

function completionMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#07140d';
  ctx.beginPath();
  ctx.arc(32, 32, 29, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(18, 32);
  ctx.lineTo(28, 42);
  ctx.lineTo(46, 22);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
}

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
  const completionChecks = [];
  const checkMaterial = completionMaterial();

  artifacts.forEach((artifact, i) => {
    const accent = new THREE.Color(artifact.color_accent || '#4cc9f0');
    const pos = latLonToVector3(artifact.coordinates.lat, artifact.coordinates.lon, radius * 1.005);

    // Punto central (objetivo del raycaster)
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 16, 16),
      new THREE.MeshBasicMaterial({ color: accent })
    );
    dot.position.copy(pos);
    dot.userData = { artifactId: artifact.id, index: i };
    group.add(dot);
    dots.push(dot);

    // Visto verde por encima del punto: visible solo si su trivia está resuelta.
    const check = new THREE.Sprite(checkMaterial);
    check.position.copy(pos.clone().multiplyScalar(1.09));
    check.scale.set(0.1, 0.1, 1);
    check.center.set(0.5, 0);
    check.userData = { artifactId: artifact.id, index: i };
    group.add(check);
    completionChecks.push(check);

    // Anillo pulsante
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.004, 8, 48),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.8 })
    );
    ring.position.copy(pos);
    ring.lookAt(pos.clone().multiplyScalar(2)); // tangente a la superficie
    ring.userData = { phase: i * 0.9 };
    group.add(ring);
    rings.push(ring);

    // Estela vertical corta (fijo sobre la superficie)
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0015, 0.0015, 0.09, 6),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5 })
    );
    const mid = pos.clone().multiplyScalar(1.048);
    stem.position.copy(mid);
    stem.lookAt(mid.clone().multiplyScalar(2));
    stem.rotateX(Math.PI / 2);
    group.add(stem);
  });

  group.userData = { dots, rings, completionChecks };
  updateMarkerCompletion(group);
  return group;
}

export function updateMarkerCompletion(group) {
  if (!group) return;
  const completed = new Set(completedArtifactIds());
  (group.userData.dots || []).forEach((dot) => {
    dot.userData.completed = completed.has(canonicalArtifactId(dot.userData.artifactId));
  });
  (group.userData.completionChecks || []).forEach((check) => {
    check.visible = completed.has(canonicalArtifactId(check.userData.artifactId));
  });
}

export function disposeMarkers(group) {
  if (!group) return;
  const materials = new Set();
  group.traverse((object) => {
    if (object.isMesh) object.geometry?.dispose();
    if (object.material) materials.add(object.material);
  });
  materials.forEach((material) => {
    material.map?.dispose();
    material.dispose();
  });
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
