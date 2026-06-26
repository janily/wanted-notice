import * as THREE from "three";
import type { LoadedAssets } from "./AssetManager";

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly noticeMesh: THREE.Mesh;
  private readonly container: HTMLElement;
  private readonly clock = new THREE.Clock();
  private animationFrame = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x15191a);
    this.scene.fog = new THREE.Fog(0x15191a, 12, 42);

    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 80);
    this.camera.position.set(0, 1.45, 4);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    container.appendChild(this.renderer.domElement);

    this.noticeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 1.58),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.82,
        metalness: 0,
        emissive: new THREE.Color(0x000000),
      }),
    );
    this.noticeMesh.name = "main-wanted-notice";
    this.noticeMesh.position.set(0, 1.55, -2.45);

    this.addLights();
  }

  mountAssets(assets: LoadedAssets): void {
    const street = assets.street.scene;
    const board = assets.board.scene;
    street.name = "old-street-store";
    board.name = "community-board";
    street.position.set(-0.4, 0, -0.8);
    street.scale.setScalar(2.45);
    board.position.set(0, 0, -2.7);
    board.scale.setScalar(2.6);

    street.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.receiveShadow = true;
      }
    });

    board.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const material = this.noticeMesh.material;
    if (material instanceof THREE.MeshStandardMaterial) {
      material.map = assets.noticeTexture;
      material.needsUpdate = true;
    }

    this.scene.add(street, board, this.noticeMesh);
  }

  setNoticeHighlighted(highlighted: boolean): void {
    const material = this.noticeMesh.material;
    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive.setHex(highlighted ? 0x35210c : 0x000000);
    }
  }

  start(onFrame: (deltaSeconds: number) => void): void {
    const tick = () => {
      const delta = this.clock.getDelta();
      onFrame(delta);
      this.renderer.render(this.scene, this.camera);
      this.animationFrame = window.requestAnimationFrame(tick);
    };
    tick();
  }

  resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrame);
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.renderer.dispose();
    this.container.replaceChildren();
  }

  private addLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff2dc, 0x1b2024, 1.1));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xfff2dc, 2.6);
    sun.position.set(4, 8, 5);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb7d3ff, 0.8);
    fill.position.set(-4, 3, 2);
    this.scene.add(fill);
  }
}
