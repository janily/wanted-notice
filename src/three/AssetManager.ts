import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { assetUrls } from "../domain/notice";

export type AssetProgress = {
  loaded: number;
  total: number;
  percent: number;
  url: string;
};

export type LoadedAssets = {
  street: GLTF;
  board: GLTF;
  noticeTexture: THREE.Texture;
};

export class AssetManager {
  private readonly manager: THREE.LoadingManager;
  private readonly gltfLoader: GLTFLoader;
  private readonly textureLoader: THREE.TextureLoader;

  constructor(onProgress: (progress: AssetProgress) => void, onError: (message: string) => void) {
    this.manager = new THREE.LoadingManager();
    this.manager.onProgress = (url, loaded, total) => {
      onProgress({ url, loaded, total, percent: Math.round((loaded / total) * 100) });
    };
    this.manager.onError = (url) => {
      onError(`资源加载失败：${url}`);
    };
    this.gltfLoader = new GLTFLoader(this.manager);
    this.textureLoader = new THREE.TextureLoader(this.manager);
  }

  async loadAll(): Promise<LoadedAssets> {
    const [street, board, noticeTexture] = await Promise.all([
      this.loadGLTF(assetUrls.streetModel),
      this.loadGLTF(assetUrls.boardModel),
      this.loadTexture(assetUrls.noticeImage),
    ]);

    noticeTexture.colorSpace = THREE.SRGBColorSpace;
    noticeTexture.anisotropy = 4;
    noticeTexture.needsUpdate = true;

    return { street, board, noticeTexture };
  }

  private loadGLTF(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });
  }

  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(url, resolve, undefined, reject);
    });
  }
}
