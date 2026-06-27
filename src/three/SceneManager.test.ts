import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { getSceneLayout } from "./SceneManager";

describe("SceneManager layout", () => {
  it("aligns the street floor to the player eye height", () => {
    const layout = getSceneLayout();

    expect(layout.street.position.y + layout.street.rawFloorY * layout.street.scale).toBeCloseTo(0, 2);
    expect(layout.camera.position.y).toBeCloseTo(1.65, 2);
    expect(layout.camera.position.z).toBeGreaterThan(layout.board.position.z);
  });

  it("places the notice board at the street edge outside the storefront", () => {
    const layout = getSceneLayout();

    expect(layout.board.position.x).toBeGreaterThan(2);
    expect(layout.board.rawFrontX).toBeGreaterThan(-0.315);
    expect(layout.board.rawFrontX).toBeLessThan(-0.2);
    expect(layout.notice.localPosition.x).toBeCloseTo(
      layout.board.rawFrontX - layout.notice.surfaceOffset,
      2,
    );
    expect(Math.abs(layout.notice.localPosition.z)).toBeLessThan(layout.board.rawPanelHalfWidthZ);
    expect(layout.notice.rotation.y).toBeCloseTo(-Math.PI / 2);
    expect(layout.notice.localPosition.y).toBeGreaterThan(layout.board.rawFrontHeight * 0.5);
    expect(layout.notice.localPosition.y).toBeLessThan(layout.board.rawFrontHeight * 0.7);
    expect(layout.notice.size.width).toBeLessThan(layout.board.rawPanelHalfWidthZ);
    expect(layout.notice.size.height).toBeLessThan(layout.board.rawFrontHeight / 3);
  });

  it("starts from an angled street view facing the notice board", () => {
    const layout = getSceneLayout();
    const viewDirection = layout.camera.target.clone().sub(layout.camera.position).normalize();
    const boardDirection = layout.board.position.clone().sub(layout.camera.position).normalize();

    expect(layout.camera.position.x).toBeLessThan(0);
    expect(layout.camera.target.x).toBeGreaterThan(1);
    expect(viewDirection.dot(boardDirection)).toBeGreaterThan(0.94);
    expect(new THREE.Vector3(0, 0, -1).dot(viewDirection)).toBeGreaterThan(0.5);
  });
});
