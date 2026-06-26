import { getVisibleHint, type NoticeState } from "../domain/notice";

type NoticeDetailViewOptions = {
  onClose: () => void;
  onZoom: (zoom: number) => void;
};

export class NoticeDetailView {
  readonly element: HTMLElement;
  private readonly image: HTMLImageElement;
  private currentZoom = 1;
  private readonly onClose: () => void;
  private readonly onZoom: (zoom: number) => void;

  constructor(options: NoticeDetailViewOptions) {
    this.onClose = options.onClose;
    this.onZoom = options.onZoom;
    this.element = document.createElement("section");
    this.element.className = "notice-detail";
    this.element.setAttribute("aria-label", "通缉令详情");
    this.element.setAttribute("aria-hidden", "true");

    this.image = document.createElement("img");
    this.image.className = "notice-detail__image";
    this.image.alt = "通缉令详情";

    this.element.addEventListener("wheel", (event) => {
      if (this.element.getAttribute("aria-hidden") === "true") {
        return;
      }

      event.preventDefault();
      const nextZoom = Number((this.currentZoom + (event.deltaY < 0 ? 0.1 : -0.1)).toFixed(2));
      this.onZoom(nextZoom);
    });
  }

  render(state: NoticeState): void {
    this.currentZoom = state.zoom;
    const hint = getVisibleHint(state);
    this.element.setAttribute("aria-hidden", String(!state.isOpen));
    this.image.src = state.notice.imageUrl;
    this.image.style.transform = `scale(${state.zoom})`;

    this.element.innerHTML = `
      <div class="notice-detail__panel" role="dialog" aria-modal="true">
        <button class="notice-detail__close" data-close-notice type="button" aria-label="关闭通缉令">×</button>
        <div class="notice-detail__paper"></div>
        <p class="notice-detail__help">滚轮缩放页面</p>
        <p class="notice-detail__hint" aria-live="polite">${hint ?? ""}</p>
      </div>
    `;

    this.element.querySelector(".notice-detail__paper")?.appendChild(this.image);
    this.element.querySelector("[data-close-notice]")?.addEventListener("click", this.onClose);
  }
}
