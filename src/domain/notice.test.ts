import { describe, expect, it } from "vitest";
import {
  closeNotice,
  createInitialNoticeState,
  defaultNotice,
  markHintShown,
  openNotice,
  setNearNotice,
  setNoticeHovered,
  setZoom,
} from "./notice";

describe("notice domain state", () => {
  it("starts with one closed notice and no hints shown", () => {
    const state = createInitialNoticeState();

    expect(state.notice.id).toBe("main-wanted-notice");
    expect(state.notice.imageUrl).toContain("tjl.png");
    expect(state.isOpen).toBe(false);
    expect(state.isNear).toBe(false);
    expect(state.isHovered).toBe(false);
    expect(state.zoom).toBe(1);
    expect(state.shownHintIds).toEqual([]);
  });

  it("opens, closes, and records first-view hint", () => {
    let state = createInitialNoticeState(defaultNotice);

    state = openNotice(state);
    expect(state.isOpen).toBe(true);
    expect(state.shownHintIds).toContain("viewed-notice");

    state = closeNotice(state);
    expect(state.isOpen).toBe(false);
    expect(state.zoom).toBe(1);
  });

  it("clamps zoom to readable limits", () => {
    const state = createInitialNoticeState();

    expect(setZoom(state, 0.25).zoom).toBe(0.75);
    expect(setZoom(state, 4).zoom).toBe(2.4);
    expect(setZoom(state, 1.35).zoom).toBe(1.35);
  });

  it("tracks near, hover, and one-time hint state", () => {
    let state = createInitialNoticeState();

    state = setNearNotice(state, true);
    state = setNoticeHovered(state, true);
    state = markHintShown(state, "zoom-detail");
    state = markHintShown(state, "zoom-detail");

    expect(state.isNear).toBe(true);
    expect(state.isHovered).toBe(true);
    expect(state.shownHintIds).toEqual(["zoom-detail"]);
  });
});
