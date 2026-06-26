import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { PlayerController } from "./PlayerController";

describe("PlayerController", () => {
  it("moves with WASD and clamps inside bounds", () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 1.65, 0);
    const controller = new PlayerController(camera, {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 1,
      speed: 10,
    });

    controller.setKey("KeyW", true);
    controller.update(1);
    controller.setKey("KeyW", false);

    expect(camera.position.z).toBe(-1);
  });

  it("does not move when paused", () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 1.65, 0);
    const controller = new PlayerController(camera);

    controller.setPaused(true);
    controller.setKey("KeyD", true);
    controller.update(1);

    expect(camera.position.x).toBe(0);
  });
});
