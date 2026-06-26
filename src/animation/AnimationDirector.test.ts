import { describe, expect, it, vi } from "vitest";
import { AnimationDirector, type AnimationAdapter } from "./AnimationDirector";

describe("AnimationDirector", () => {
  it("opens and closes the notice detail with timeline calls", () => {
    const adapter: AnimationAdapter = {
      timeline: vi.fn(() => ({
        set: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        play: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        kill: vi.fn(),
      })),
    };
    const panel = document.createElement("section");
    const paper = document.createElement("img");
    panel.appendChild(paper);

    const director = new AnimationDirector({ adapter, reduceMotion: false });
    director.openNotice(panel, paper);
    director.closeNotice();

    expect(adapter.timeline).toHaveBeenCalledTimes(1);
  });

  it("uses zero-duration transitions when motion is reduced", () => {
    const to = vi.fn().mockReturnThis();
    const adapter: AnimationAdapter = {
      timeline: vi.fn(() => ({
        set: vi.fn().mockReturnThis(),
        to,
        play: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        kill: vi.fn(),
      })),
    };
    const panel = document.createElement("section");
    const paper = document.createElement("img");

    const director = new AnimationDirector({ adapter, reduceMotion: true });
    director.openNotice(panel, paper);

    expect(to).toHaveBeenCalledWith(panel, expect.objectContaining({ duration: 0 }), 0);
  });
});
