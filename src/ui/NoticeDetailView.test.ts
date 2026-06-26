import { describe, expect, it, vi } from "vitest";
import { createInitialNoticeState, openNotice, setZoom } from "../domain/notice";
import { NoticeDetailView } from "./NoticeDetailView";

describe("NoticeDetailView", () => {
  it("renders the notice image and closes through the close button", () => {
    const onClose = vi.fn();
    const onZoom = vi.fn();
    const view = new NoticeDetailView({ onClose, onZoom });

    document.body.appendChild(view.element);
    view.render(openNotice(createInitialNoticeState()));

    expect(view.element.querySelector("img")?.getAttribute("src")).toContain("tjl.png");
    expect(view.element.textContent).toContain("滚轮缩放页面");

    view.element.querySelector<HTMLButtonElement>("[data-close-notice]")?.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("emits clamped zoom changes from wheel input", () => {
    const onClose = vi.fn();
    const onZoom = vi.fn();
    const view = new NoticeDetailView({ onClose, onZoom });

    document.body.appendChild(view.element);
    view.render(openNotice(createInitialNoticeState()));

    view.element.dispatchEvent(new WheelEvent("wheel", { deltaY: -120, bubbles: true }));

    expect(onZoom).toHaveBeenCalledWith(1.1);
  });

  it("hides itself when notice is closed", () => {
    const view = new NoticeDetailView({ onClose: vi.fn(), onZoom: vi.fn() });

    document.body.appendChild(view.element);
    view.render(createInitialNoticeState());

    expect(view.element.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows zoom hint text after zoom-detail is recorded", () => {
    const view = new NoticeDetailView({ onClose: vi.fn(), onZoom: vi.fn() });
    const state = setZoom(openNotice(createInitialNoticeState()), 1.5);

    document.body.appendChild(view.element);
    view.render(state);

    expect(view.element.textContent).toContain("可以检查纸张细节");
  });
});
