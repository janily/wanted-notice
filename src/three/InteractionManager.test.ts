import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { InteractionManager } from "./InteractionManager";

describe("InteractionManager", () => {
  it("reports near state by camera distance", () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 0);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    mesh.position.set(0, 0, -1);
    const manager = new InteractionManager(camera, document.createElement("canvas"));
    manager.setNoticeTarget(mesh);

    expect(manager.isNearNotice()).toBe(true);

    camera.position.set(0, 0, 8);
    expect(manager.isNearNotice()).toBe(false);
  });

  it("opens notice from keyboard only when near", () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 0);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    mesh.position.set(0, 0, -1);
    const onOpen = vi.fn();
    const manager = new InteractionManager(camera, document.createElement("canvas"));
    manager.setNoticeTarget(mesh);
    manager.onOpenNotice(onOpen);

    manager.handleKey("KeyE");

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
