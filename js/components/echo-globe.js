/* ============================================================
   ECHOES OF SOL · components/echo-globe.js
   Web Component del globo 3D (Michelle · Three.js)
   Eventos que emite:
   - echo:marker-selected  { id, index }
   - echo:marker-deselect
   ============================================================ */
import { PlanetScene } from '../three/scene.js';

class EchoGlobe extends HTMLElement {
  connectedCallback() {
    if (this._scene) return;
    this._scene = new PlanetScene(this);
    this._scene.onSelect = (id, index) => {
      this.dispatchEvent(new CustomEvent('echo:marker-selected', { detail: { id, index } }));
    };
    this._scene.onDeselect = () => this.dispatchEvent(new CustomEvent('echo:marker-deselect'));
  }

  /** Libera la escena y sus escuchas de progreso al retirar el componente. */
  disconnectedCallback() {
    this._scene?.dispose();
    this._scene = null;
  }

  /** Carga los artefactos de un cuerpo ('mars' | 'moon'). */
  setBody(body, artifacts) {
    this._scene?.setBody(body, artifacts);
  }

  /** Enfoque cinematográfico hacia un marcador. */
  focus(id) {
    this._scene?.focusMarker(id);
  }

  /** Regresa a la vista general. */
  reset() {
    this._scene?.resetView();
  }
}

customElements.define('echo-globe', EchoGlobe);
