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

  it("keeps the camera initial yaw when looking starts", () => {
    const camera = new THREE.PerspectiveCamera();
    camera.rotation.set(0, 0.42, 0, "YXZ");
    const controller = new PlayerController(camera);

    controller.look(0, 0);

    expect(camera.rotation.y).toBeCloseTo(0.42);
  });

  it("dampens large mouse deltas to avoid abrupt camera spins", () => {
    const camera = new THREE.PerspectiveCamera();
    const controller = new PlayerController(camera);

    controller.look(1000, 1000);

    expect(camera.rotation.y).toBeCloseTo(-0.0224);
    expect(camera.rotation.x).toBeCloseTo(-0.0224);
  });

  it("limits vertical look range to keep the scene in view", () => {
    const camera = new THREE.PerspectiveCamera();
    const controller = new PlayerController(camera);

    for (let index = 0; index < 40; index += 1) {
      controller.look(0, -28);
    }

    expect(camera.rotation.x).toBeCloseTo(0.35);
  });

  it("limits horizontal look range to avoid empty scene edges", () => {
    const camera = new THREE.PerspectiveCamera();
    const controller = new PlayerController(camera);

    for (let index = 0; index < 80; index += 1) {
      controller.look(28, 0);
    }

    expect(camera.rotation.y).toBeCloseTo(-0.92);
  });
});
