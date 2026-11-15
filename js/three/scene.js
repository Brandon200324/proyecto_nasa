/* ============================================================
   ECHOES OF SOL · three/scene.js
   Escena principal: render, cámara, OrbitControls, raycaster
   y transiciones cinemáticas de cámara (GSAP)
   ============================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadPlanetTexture } from './textures.js';
import { createMarkers, updateMarkerPulse } from './markers.js';

const RADIUS = 1;

export class PlanetScene {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.container = container;
    this.onSelect = null;        // callback(id)
    this.onDeselect = null;      // callback()
    this.selectedId = null;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Escena y cámara
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 1.1, 3.1);

    // Controles
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 6;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.enablePan = false;

    // Luces
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
    sun.position.set(4, 2, 3);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4cc9f0, 0.6);
    rim.position.set(-4, -1, -3);
    this.scene.add(rim);

    // Campo de estrellas
    this._buildStars();

    // Globo + marcadores
    this.globe = new THREE.Group();
    this.scene.add(this.globe);

    this.planetMesh = null;
    this.markerGroup = null;
    this.artifacts = [];

    // Interacción (raycaster)
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._downXY = null;
    this.renderer.domElement.addEventListener('pointerdown', (e) => (this._downXY = [e.clientX, e.clientY]));
    this.renderer.domElement.addEventListener('pointerup', (e) => this._handleClick(e));
    this.renderer.domElement.addEventListener('pointermove', (e) => this._handleHover(e));

    // Resize
    this._resize = this._resize.bind(this);
    this._resizeObserver = new ResizeObserver(this._resize);
    this._resizeObserver.observe(container);
    this._resize();

    // Loop
    this.clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this.renderer.setAnimationLoop(this._animate);
  }

  /** Reemplaza el planeta y los marcadores por el cuerpo indicado. */
  async setBody(body, artifacts) {
    this.artifacts = artifacts;
    this.selectedId = null;
    this.controls.autoRotate = true;

    // Textura (con fallback automático)
    const texture = await loadPlanetTexture(body);
    if (this.planetMesh) {
      this.globe.remove(this.planetMesh);
      this.planetMesh.material.map?.dispose();
      this.planetMesh.material.dispose();
      this.planetMesh.geometry.dispose();
    }
    this.planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 })
    );
    this.globe.add(this.planetMesh);

    // Marcadores
    if (this.markerGroup) this.globe.remove(this.markerGroup);
    this.markerGroup = createMarkers(artifacts, RADIUS);
    this.globe.add(this.markerGroup);

    // Reentrada cinematográfica
    this._flyTo(new THREE.Vector3(0, 1.1, 3.1));
  }

  /** Mueve la cámara suavemente hacia un marcador (tween GSAP). */
  focusMarker(id) {
    const dot = this.markerGroup?.userData?.dots?.find((d) => d.userData.artifactId === id);
    if (!dot) return;
    this.selectedId = id;
    this.controls.autoRotate = false;

    const dir = dot.position.clone().normalize();
    const targetPos = dir.multiplyScalar(2.2);
    // Eleva un poco la cámara para composición HUD
    targetPos.y = Math.max(targetPos.y, 0.25);
    this._flyTo(targetPos);
  }

  /** Devuelve el zoom general y reanuda la rotación. */
  resetView() {
    this.selectedId = null;
    this.controls.autoRotate = true;
    this._flyTo(new THREE.Vector3(0, 1.1, 3.1));
  }

  _flyTo(pos) {
    if (window.gsap) {
      window.gsap.to(this.camera.position, {
        x: pos.x, y: pos.y, z: pos.z,
        duration: 1.4,
        ease: 'power2.inOut',
      });
    } else {
      this.camera.position.copy(pos);
    }
  }

  _buildStars() {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 25 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.scene.add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ color: 0x9db8ff, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.8 })
      )
    );
  }

  _pointerToNDC(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _pick(e) {
    this._pointerToNDC(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const dots = this.markerGroup?.userData?.dots || [];
    const hits = this.raycaster.intersectObjects(dots, false);
    return hits.length ? hits[0].object : null;
  }

  _handleHover(e) {
    if (!this.markerGroup) return;
    const hit = this._pick(e);
    this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
  }

  _handleClick(e) {
    // Ignora drags (rotaciones del OrbitControls)
    if (this._downXY) {
      const dx = e.clientX - this._downXY[0];
      const dy = e.clientY - this._downXY[1];
      if (Math.hypot(dx, dy) > 6) { this._downXY = null; return; }
    }
    this._downXY = null;
    if (!this.markerGroup) return;

    const hit = this._pick(e);
    if (hit) {
      this.selectedId = hit.userData.artifactId;
      this.onSelect?.(this.selectedId, hit.userData.index);
    } else if (this.selectedId) {
      this.onDeselect?.();
    }
  }

  _resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _animate() {
    const t = this.clock.getElapsedTime();
    this.controls.update();
    updateMarkerPulse(this.markerGroup, t);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this._resizeObserver.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
