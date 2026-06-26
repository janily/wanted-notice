import * as THREE from "three";

export class InteractionManager {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse = new THREE.Vector2();
  private noticeTarget: THREE.Object3D | null = null;
  private openNotice: (() => void) | null = null;
  private hovered = false;
  private lastHoverCheck = 0;

  constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.canvas = canvas;
  }

  bind(): () => void {
    const click = (event: MouseEvent) => {
      this.updateMouse(event);
      if (this.isHoveringNotice()) {
        this.openNotice?.();
      }
    };
    const move = (event: MouseEvent) => {
      const now = performance.now();
      if (now - this.lastHoverCheck < 50) {
        return;
      }
      this.lastHoverCheck = now;
      this.updateMouse(event);
      this.hovered = this.isHoveringNotice();
    };
    const keydown = (event: KeyboardEvent) => this.handleKey(event.code);

    this.canvas.addEventListener("click", click);
    this.canvas.addEventListener("mousemove", move);
    window.addEventListener("keydown", keydown);

    return () => {
      this.canvas.removeEventListener("click", click);
      this.canvas.removeEventListener("mousemove", move);
      window.removeEventListener("keydown", keydown);
    };
  }

  setNoticeTarget(target: THREE.Object3D): void {
    this.noticeTarget = target;
  }

  onOpenNotice(callback: () => void): void {
    this.openNotice = callback;
  }

  handleKey(code: string): void {
    if (code === "KeyE" && this.isNearNotice()) {
      this.openNotice?.();
    }
  }

  isNearNotice(): boolean {
    if (!this.noticeTarget) {
      return false;
    }

    const targetPosition = new THREE.Vector3();
    this.noticeTarget.getWorldPosition(targetPosition);
    return this.camera.position.distanceTo(targetPosition) <= 3.2;
  }

  isHovered(): boolean {
    return this.hovered;
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private isHoveringNotice(): boolean {
    if (!this.noticeTarget || !this.isNearNotice()) {
      return false;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObject(this.noticeTarget, true).length > 0;
  }
}
