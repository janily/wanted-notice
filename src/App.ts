import { AnimationDirector } from "./animation/AnimationDirector";
import {
  closeNotice,
  createInitialNoticeState,
  openNotice,
  setNearNotice,
  setNoticeHovered,
  setZoom,
  type NoticeState,
} from "./domain/notice";
import { AssetManager } from "./three/AssetManager";
import { InteractionManager } from "./three/InteractionManager";
import { PlayerController } from "./three/PlayerController";
import { SceneManager } from "./three/SceneManager";
import { HudView } from "./ui/HudView";
import { NoticeDetailView } from "./ui/NoticeDetailView";

export class App {
  private readonly root: HTMLElement;
  private readonly shell: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly hud = new HudView();
  private readonly detail: NoticeDetailView;
  private readonly animator = new AnimationDirector();
  private sceneManager: SceneManager | null = null;
  private player: PlayerController | null = null;
  private interaction: InteractionManager | null = null;
  private cleanupHandlers: Array<() => void> = [];
  private state: NoticeState = createInitialNoticeState();
  private status: "loading" | "ready" | "error" = "loading";
  private message = "资源加载中：0%";

  constructor(root: HTMLElement) {
    this.root = root;
    this.shell = document.createElement("main");
    this.shell.className = "app-shell";
    this.stage = document.createElement("div");
    this.stage.className = "webgl-stage";
    this.detail = new NoticeDetailView({
      onClose: () => this.closeNotice(),
      onZoom: (zoom) => this.updateState(setZoom(this.state, zoom)),
    });
  }

  async start(): Promise<void> {
    this.root.replaceChildren(this.shell);
    this.shell.append(this.stage, this.hud.element, this.detail.element);
    this.render();

    try {
      const sceneManager = new SceneManager(this.stage);
      this.sceneManager = sceneManager;
      const assets = await new AssetManager(
        (progress) => {
          this.message = `资源加载中：${progress.percent}%`;
          this.render();
        },
        (message) => {
          this.status = "error";
          this.message = message;
          this.render();
        },
      ).loadAll();

      sceneManager.mountAssets(assets);
      this.player = new PlayerController(sceneManager.camera);
      this.interaction = new InteractionManager(sceneManager.camera, sceneManager.renderer.domElement);
      this.interaction.setNoticeTarget(sceneManager.noticeMesh);
      this.interaction.onOpenNotice(() => this.openNotice());

      const resize = () => sceneManager.resize();
      const escapeClose = (event: KeyboardEvent) => {
        if ((event.code === "Escape" || event.key === "Escape" || event.key === "Esc") && this.state.isOpen) {
          this.closeNotice();
        }
      };
      window.addEventListener("resize", resize);
      window.addEventListener("keydown", escapeClose);

      this.cleanupHandlers.push(this.player.bind());
      this.cleanupHandlers.push(this.interaction.bind());
      this.cleanupHandlers.push(() => window.removeEventListener("resize", resize));
      this.cleanupHandlers.push(() => window.removeEventListener("keydown", escapeClose));

      this.status = "ready";
      this.message = "靠近公告栏查看通缉令";
      sceneManager.start((deltaSeconds) => this.update(deltaSeconds));
      this.render();
    } catch (error) {
      this.status = "error";
      this.message = error instanceof Error ? error.message : "WebGL 初始化失败";
      this.render();
    }
  }

  dispose(): void {
    this.cleanupHandlers.forEach((cleanup) => cleanup());
    this.sceneManager?.dispose();
  }

  private update(deltaSeconds: number): void {
    this.player?.update(deltaSeconds);
    const isNear = this.interaction?.isNearNotice() ?? false;
    const isHovered = this.interaction?.isHovered() ?? false;
    if (isNear !== this.state.isNear || isHovered !== this.state.isHovered) {
      this.updateState(setNoticeHovered(setNearNotice(this.state, isNear), isHovered));
    }
    this.sceneManager?.setNoticeHighlighted(isNear || isHovered);
  }

  private openNotice(): void {
    this.updateState(openNotice(this.state));
    this.player?.setPaused(true);
    const panel = this.detail.element;
    const paper = panel.querySelector(".notice-detail__paper");
    if (paper instanceof Element) {
      this.animator.openNotice(panel, paper);
    }
  }

  private closeNotice(): void {
    this.updateState(closeNotice(this.state));
    this.player?.setPaused(false);
    this.animator.closeNotice();
  }

  private updateState(state: NoticeState): void {
    this.state = state;
    this.render();
  }

  private render(): void {
    this.hud.render(this.state, this.status, this.message);
    this.detail.render(this.state);
    this.renderOverlay();
  }

  private renderOverlay(): void {
    this.shell.querySelector(".error-screen")?.remove();

    if (this.status !== "error") {
      return;
    }

    const overlay = document.createElement("section");
    overlay.className = "error-screen";
    overlay.setAttribute("role", "alert");
    overlay.innerHTML = `
      <strong>加载失败</strong>
      <p>${this.message}</p>
    `;
    this.shell.appendChild(overlay);
  }
}
