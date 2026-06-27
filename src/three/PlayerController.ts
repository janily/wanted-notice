import * as THREE from "three";

export type PlayerBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minYaw: number;
  maxYaw: number;
  minPitch: number;
  maxPitch: number;
  speed: number;
};

const defaultBounds: PlayerBounds = {
  minX: -2.6,
  maxX: 3.6,
  minZ: -4.5,
  maxZ: 4.4,
  minYaw: -0.92,
  maxYaw: 0.52,
  minPitch: -0.45,
  maxPitch: 0.35,
  speed: 2.6,
};

const lookSensitivity = 0.0008;
const maxLookDelta = 28;

export class PlayerController {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly bounds: PlayerBounds;
  private readonly keys = new Set<string>();
  private paused = false;
  private yaw = 0;
  private pitch = 0;

  constructor(camera: THREE.PerspectiveCamera, bounds: Partial<PlayerBounds> = {}) {
    this.camera = camera;
    this.bounds = { ...defaultBounds, ...bounds };
    this.yaw = camera.rotation.y;
    this.pitch = camera.rotation.x;
  }

  bind(target: Window = window): () => void {
    const keydown = (event: KeyboardEvent) => this.setKey(event.code, true);
    const keyup = (event: KeyboardEvent) => this.setKey(event.code, false);
    const mousemove = (event: MouseEvent) => this.look(event.movementX, event.movementY);
    target.addEventListener("keydown", keydown);
    target.addEventListener("keyup", keyup);
    target.addEventListener("mousemove", mousemove);

    return () => {
      target.removeEventListener("keydown", keydown);
      target.removeEventListener("keyup", keyup);
      target.removeEventListener("mousemove", mousemove);
    };
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.keys.clear();
    }
  }

  setKey(code: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(code);
    } else {
      this.keys.delete(code);
    }
  }

  look(movementX: number, movementY: number): void {
    if (this.paused) {
      return;
    }

    const safeMovementX = THREE.MathUtils.clamp(movementX, -maxLookDelta, maxLookDelta);
    const safeMovementY = THREE.MathUtils.clamp(movementY, -maxLookDelta, maxLookDelta);

    this.yaw = THREE.MathUtils.clamp(
      this.yaw - safeMovementX * lookSensitivity,
      this.bounds.minYaw,
      this.bounds.maxYaw,
    );
    this.pitch = THREE.MathUtils.clamp(
      this.pitch - safeMovementY * lookSensitivity,
      this.bounds.minPitch,
      this.bounds.maxPitch,
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  update(deltaSeconds: number): void {
    if (this.paused) {
      return;
    }

    const direction = new THREE.Vector3();
    direction.z += this.keys.has("KeyW") ? -1 : 0;
    direction.z += this.keys.has("KeyS") ? 1 : 0;
    direction.x += this.keys.has("KeyA") ? -1 : 0;
    direction.x += this.keys.has("KeyD") ? 1 : 0;

    if (direction.lengthSq() === 0) {
      return;
    }

    direction.normalize();
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.camera.position.x = THREE.MathUtils.clamp(
      this.camera.position.x + direction.x * this.bounds.speed * deltaSeconds,
      this.bounds.minX,
      this.bounds.maxX,
    );
    this.camera.position.z = THREE.MathUtils.clamp(
      this.camera.position.z + direction.z * this.bounds.speed * deltaSeconds,
      this.bounds.minZ,
      this.bounds.maxZ,
    );
    this.camera.position.y = 1.65;
  }
}
