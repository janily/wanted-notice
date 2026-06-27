import * as THREE from "three";
import type { LoadedAssets } from "./AssetManager";

type SceneLayout = {
  camera: {
    position: THREE.Vector3;
    target: THREE.Vector3;
  };
  street: {
    position: THREE.Vector3;
    scale: number;
    rawFloorY: number;
  };
  board: {
    position: THREE.Vector3;
    scale: number;
    rawFrontX: number;
    rawPanelHalfWidthZ: number;
    rawFrontHeight: number;
    rawPanelSlopeXPerZ: number;
  };
  notice: {
    localPosition: THREE.Vector3;
    rotation: THREE.Euler;
    size: {
      width: number;
      height: number;
    };
    surfaceOffset: number;
  };
};

export function getSceneLayout(): SceneLayout {
  const streetScale = 2.45;
  const streetRawFloorY = -0.743;
  const boardScale = 2.1;
  const boardRawFrontX = -0.021;
  const boardRawPanelHalfWidthZ = 0.513;
  const boardRawFrontHeight = 0.771;
  const boardRawPanelSlopeXPerZ = -0.052;
  const noticeSurfaceOffset = 0.006;
  const boardPosition = new THREE.Vector3(2.7, 0, -1.35);

  return {
    camera: {
      position: new THREE.Vector3(-1.05, 1.65, 4.25),
      target: new THREE.Vector3(2.15, 1.2, -0.85),
    },
    street: {
      position: new THREE.Vector3(-0.4, -streetRawFloorY * streetScale, -0.8),
      scale: streetScale,
      rawFloorY: streetRawFloorY,
    },
    board: {
      position: boardPosition,
      scale: boardScale,
      rawFrontX: boardRawFrontX,
      rawPanelHalfWidthZ: boardRawPanelHalfWidthZ,
      rawFrontHeight: boardRawFrontHeight,
      rawPanelSlopeXPerZ: boardRawPanelSlopeXPerZ,
    },
    notice: {
      localPosition: new THREE.Vector3(boardRawFrontX - noticeSurfaceOffset, 0.45, 0.12),
      rotation: new THREE.Euler(0, -Math.PI / 2 + Math.atan(boardRawPanelSlopeXPerZ), 0, "YXZ"),
      size: {
        width: 0.14,
        height: 0.2,
      },
      surfaceOffset: noticeSurfaceOffset,
    },
  };
}

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
    const layout = getSceneLayout();
    this.camera.position.copy(layout.camera.position);
    this.camera.lookAt(layout.camera.target);

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
      new THREE.PlaneGeometry(layout.notice.size.width, layout.notice.size.height),
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        opacity: 0,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    );
    this.noticeMesh.name = "main-wanted-notice";
    this.noticeMesh.position.copy(layout.notice.localPosition);
    this.noticeMesh.rotation.copy(layout.notice.rotation);

    this.addLights();
  }

  mountAssets(assets: LoadedAssets): void {
    const layout = getSceneLayout();
    const street = assets.street.scene;
    const board = assets.board.scene;
    street.name = "old-street-store";
    board.name = "community-board";
    street.position.copy(layout.street.position);
    street.scale.setScalar(layout.street.scale);
    board.position.copy(layout.board.position);
    board.scale.setScalar(layout.board.scale);

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

    this.paintNoticeOntoBoardTexture(board, assets.noticeTexture, layout.notice);

    board.add(this.noticeMesh);
    this.scene.add(street, board);
  }

  setNoticeHighlighted(_highlighted: boolean): void {
    // The notice is baked into the board texture. The mesh remains invisible and only handles raycasts.
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


  private paintNoticeOntoBoardTexture(
    board: THREE.Object3D,
    noticeTexture: THREE.Texture,
    noticeLayout: SceneLayout["notice"],
  ): void {
    const noticeUvRect = this.getNoticeUvRect(board, noticeLayout);
    if (!noticeUvRect) {
      return;
    }

    board.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial) || !material.map?.image) {
          return;
        }

        const sourceMap = material.map;
        const sourceImage = sourceMap.image as CanvasImageSource & { width: number; height: number };
        const width = sourceImage.width;
        const height = sourceImage.height;
        if (!width || !height || !noticeTexture.image) {
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          return;
        }

        context.drawImage(sourceImage, 0, 0, width, height);
        const noticeX = noticeUvRect.minU * width;
        const noticeWidth = (noticeUvRect.maxU - noticeUvRect.minU) * width;
        const noticeHeight = (noticeUvRect.maxV - noticeUvRect.minV) * height;
        const noticeY = sourceMap.flipY
          ? (1 - noticeUvRect.maxV) * height
          : noticeUvRect.minV * height;
        context.save();
        context.translate(noticeX, noticeY + noticeHeight);
        context.scale(1, -1);
        context.drawImage(noticeTexture.image as CanvasImageSource, 0, 0, noticeWidth, noticeHeight);
        context.restore();

        const composedMap = new THREE.CanvasTexture(canvas);
        composedMap.colorSpace = sourceMap.colorSpace;
        composedMap.flipY = sourceMap.flipY;
        composedMap.wrapS = sourceMap.wrapS;
        composedMap.wrapT = sourceMap.wrapT;
        composedMap.minFilter = sourceMap.minFilter;
        composedMap.magFilter = sourceMap.magFilter;
        composedMap.anisotropy = sourceMap.anisotropy;
        composedMap.needsUpdate = true;

        material.map = composedMap;
        material.needsUpdate = true;
      });
    });
  }

  private getNoticeUvRect(
    board: THREE.Object3D,
    noticeLayout: SceneLayout["notice"],
  ): { minU: number; maxU: number; minV: number; maxV: number } | null {
    board.updateMatrixWorld(true);

    const raycaster = new THREE.Raycaster();
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(noticeLayout.rotation).normalize();
    const center = noticeLayout.localPosition.clone();
    const halfWidth = noticeLayout.size.width / 2;
    const halfHeight = noticeLayout.size.height / 2;
    const localCorners = [
      new THREE.Vector3(-halfWidth, -halfHeight, 0),
      new THREE.Vector3(halfWidth, -halfHeight, 0),
      new THREE.Vector3(halfWidth, halfHeight, 0),
      new THREE.Vector3(-halfWidth, halfHeight, 0),
    ];
    const uvs: THREE.Vector2[] = [];

    localCorners.forEach((corner) => {
      const surfacePoint = corner.applyEuler(noticeLayout.rotation).add(center);
      const worldPoint = surfacePoint.clone().applyMatrix4(board.matrixWorld);
      const worldNormal = normal.clone().transformDirection(board.matrixWorld);
      raycaster.set(worldPoint.clone().addScaledVector(worldNormal, 0.35), worldNormal.negate());
      const hit = raycaster.intersectObject(board, true).find((intersection) => intersection.uv);
      if (hit?.uv) {
        uvs.push(hit.uv.clone());
      }
    });

    if (uvs.length !== localCorners.length) {
      return null;
    }

    return {
      minU: Math.min(...uvs.map((uv) => uv.x)),
      maxU: Math.max(...uvs.map((uv) => uv.x)),
      minV: Math.min(...uvs.map((uv) => uv.y)),
      maxV: Math.max(...uvs.map((uv) => uv.y)),
    };
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
