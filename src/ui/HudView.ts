import type { NoticeState } from "../domain/notice";

export class HudView {
  readonly element: HTMLElement;

  constructor() {
    this.element = document.createElement("aside");
    this.element.className = "hud";
  }

  render(state: NoticeState, appStatus: "loading" | "ready" | "error", message = ""): void {
    const prompt = state.isNear ? "E / 点击 查看通缉令" : "靠近公告栏查看通缉令";
    const statusMark = appStatus === "ready" ? "●" : "○";
    this.element.innerHTML = `
      <section class="hud__title">
        <h1>中国社区 · 通缉令演示</h1>
        <p>Three.js WebGL 项目演示</p>
      </section>
      <section class="hud__controls" aria-label="操作说明">
        <h2>操作说明</h2>
        <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动</p>
        <p>鼠标控制视角</p>
        <p><kbd>E</kbd> 交互 / 查看详情</p>
        <p><kbd>Esc</kbd> 退出详情</p>
        <p>滚轮缩放详情页</p>
      </section>
      <section class="hud__status">
        <strong>${statusMark} Three.js + TypeScript + Vite + GSAP</strong>
        <p>${message || prompt}</p>
      </section>
    `;
  }
}
