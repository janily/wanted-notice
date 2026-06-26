# Wanted Notice Exploration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + TypeScript + Three.js + GSAP first-person community notice-board exploration web app from `PRD.md`.

**Architecture:** The app is split into small modules: Three.js scene setup and asset loading live under `src/three/`, pure notice state lives under `src/domain/`, DOM UI lives under `src/ui/`, and GSAP sequencing lives under `src/animation/`. Unit tests cover pure state, DOM UI, player bounds, interaction state, and animation accessibility; Playwright verifies the main user path in a browser.

**Tech Stack:** Vite, TypeScript, Three.js, GSAP, Vitest, jsdom, Playwright.

---

## Scope Check

`PRD.md` describes one coherent MVP: one street scene, one notice board, one main wanted notice, first-person exploration, detail viewing, GSAP animations, error/loading states, and verification. It does not need decomposition into separate plans.

## File Structure

Create and modify these files:

- Create `package.json`: project scripts and dependencies.
- Create `tsconfig.json`: strict TypeScript settings for app code.
- Create `vite.config.ts`: Vite and Vitest configuration.
- Create `index.html`: app mount point.
- Create `src/main.ts`: bootstrap the app.
- Create `src/App.ts`: compose managers, state, UI, and render loop.
- Create `src/styles.css`: full-screen canvas, HUD, loading, notice detail, and reduced-motion-friendly UI.
- Create `src/domain/notice.ts`: notice data, app state, reducer-style state transitions.
- Create `src/domain/notice.test.ts`: state tests.
- Create `src/three/AssetManager.ts`: `LoadingManager`, `GLTFLoader`, `TextureLoader`, progress, success, and error handling.
- Create `src/three/SceneManager.ts`: scene, camera, renderer, lights, resize, render loop, disposal.
- Create `src/three/PlayerController.ts`: keyboard/mouse movement, bounds, pause/resume.
- Create `src/three/PlayerController.test.ts`: movement and pause tests.
- Create `src/three/InteractionManager.ts`: raycast target registration, hover/click/keyboard interaction.
- Create `src/three/InteractionManager.test.ts`: interaction state tests with lightweight object stubs.
- Create `src/ui/HudView.ts`: title, controls, status, and prompt UI.
- Create `src/ui/NoticeDetailView.ts`: wanted notice detail panel, close button, zoom, hint trigger.
- Create `src/ui/NoticeDetailView.test.ts`: close, zoom, and hint tests.
- Create `src/animation/AnimationDirector.ts`: GSAP timelines and reduced-motion behavior.
- Create `src/animation/AnimationDirector.test.ts`: animation adapter tests.
- Create `src/test/setup.ts`: Vitest DOM setup.
- Create `tests/e2e/wanted-notice.spec.ts`: browser acceptance path.
- Create `playwright.config.ts`: Playwright config.

Implementation follows TDD where practical. WebGL rendering is verified with browser smoke tests because jsdom cannot create a real WebGL context.

---

### Task 1: Project Scaffold, Git, and Test Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/test/setup.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Initialize git for frequent commits**

Run:

```bash
git init
```

Expected: `Initialized empty Git repository` or `Reinitialized existing Git repository`.

- [ ] **Step 2: Create `package.json`**

Create `package.json` with this content:

```json
{
  "name": "wanted-notice-exploration",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@vitejs/plugin-basic-ssl": "^2.0.0",
    "gsap": "^3.13.0",
    "three": "^0.179.1",
    "vite": "^7.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@types/node": "^24.0.0",
    "jsdom": "^26.1.0",
    "typescript": "^5.8.3",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies installed and `package-lock.json` created.

- [ ] **Step 4: Create TypeScript and Vite config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    globals: true,
  },
});
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>中国社区 · 通缉令演示</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `src/test/setup.ts`:

```ts
import { afterEach } from "vitest";

afterEach(() => {
  document.body.innerHTML = "";
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 5: Run baseline checks**

Run:

```bash
npm exec tsc -- --showConfig >/dev/null
npm exec vite -- --version
```

Expected: both commands exit with code 0. This verifies TypeScript and Vite are installed before app files are added.

- [ ] **Step 6: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/test/setup.ts playwright.config.ts
git commit -m "chore: scaffold wanted notice web app"
```

Expected: commit succeeds.

---

### Task 2: Domain State and Notice Data

**Files:**
- Create: `src/domain/notice.ts`
- Create: `src/domain/notice.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `src/domain/notice.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createInitialNoticeState,
  defaultNotice,
  markHintShown,
  openNotice,
  closeNotice,
  setNearNotice,
  setNoticeHovered,
  setZoom,
} from "./notice";

describe("notice domain state", () => {
  it("starts with one closed notice and no hints shown", () => {
    const state = createInitialNoticeState();

    expect(state.notice.id).toBe("main-wanted-notice");
    expect(state.notice.imageUrl).toBe("/assets/tjl.png");
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/domain/notice.test.ts
```

Expected: FAIL with an import error because `src/domain/notice.ts` does not exist.

- [ ] **Step 3: Implement notice domain**

Create `src/domain/notice.ts`:

```ts
export type NoticeHintId = "viewed-notice" | "zoom-detail";

export type Notice = {
  id: string;
  title: string;
  imageUrl: string;
  status: "available";
  hints: Array<{ id: NoticeHintId; message: string }>;
};

export type NoticeState = {
  notice: Notice;
  isOpen: boolean;
  isNear: boolean;
  isHovered: boolean;
  zoom: number;
  shownHintIds: NoticeHintId[];
};

export const defaultNotice: Notice = {
  id: "main-wanted-notice",
  title: "通缉令",
  imageUrl: "/assets/tjl.png",
  status: "available",
  hints: [
    { id: "viewed-notice", message: "已查看通缉令详情" },
    { id: "zoom-detail", message: "可以检查纸张细节" },
  ],
};

export function createInitialNoticeState(notice: Notice = defaultNotice): NoticeState {
  return {
    notice,
    isOpen: false,
    isNear: false,
    isHovered: false,
    zoom: 1,
    shownHintIds: [],
  };
}

export function setNearNotice(state: NoticeState, isNear: boolean): NoticeState {
  return { ...state, isNear };
}

export function setNoticeHovered(state: NoticeState, isHovered: boolean): NoticeState {
  return { ...state, isHovered };
}

export function markHintShown(state: NoticeState, hintId: NoticeHintId): NoticeState {
  if (state.shownHintIds.includes(hintId)) {
    return state;
  }

  return { ...state, shownHintIds: [...state.shownHintIds, hintId] };
}

export function openNotice(state: NoticeState): NoticeState {
  return markHintShown({ ...state, isOpen: true }, "viewed-notice");
}

export function closeNotice(state: NoticeState): NoticeState {
  return { ...state, isOpen: false, zoom: 1 };
}

export function setZoom(state: NoticeState, zoom: number): NoticeState {
  const clampedZoom = Math.min(2.4, Math.max(0.75, Number(zoom.toFixed(2))));
  const nextState = { ...state, zoom: clampedZoom };
  return clampedZoom >= 1.45 ? markHintShown(nextState, "zoom-detail") : nextState;
}

export function getVisibleHint(state: NoticeState): string | null {
  const latestHintId = state.shownHintIds[state.shownHintIds.length - 1];
  const hint = state.notice.hints.find((item) => item.id === latestHintId);
  return hint?.message ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- src/domain/notice.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit domain module**

```bash
git add src/domain/notice.ts src/domain/notice.test.ts
git commit -m "feat: add wanted notice state model"
```

Expected: commit succeeds.

---

### Task 3: DOM UI for HUD and Notice Detail

**Files:**
- Create: `src/ui/HudView.ts`
- Create: `src/ui/NoticeDetailView.ts`
- Create: `src/ui/NoticeDetailView.test.ts`
- Create: `src/styles.css`

- [ ] **Step 1: Write failing UI tests**

Create `src/ui/NoticeDetailView.test.ts`:

```ts
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

    expect(view.element.querySelector("img")?.getAttribute("src")).toBe("/assets/tjl.png");
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
```

- [ ] **Step 2: Run UI test to verify it fails**

Run:

```bash
npm run test -- src/ui/NoticeDetailView.test.ts
```

Expected: FAIL with an import error because UI files do not exist.

- [ ] **Step 3: Implement HUD and detail view**

Create `src/ui/HudView.ts`:

```ts
import type { NoticeState } from "../domain/notice";

export class HudView {
  readonly element: HTMLElement;

  constructor() {
    this.element = document.createElement("aside");
    this.element.className = "hud";
  }

  render(state: NoticeState, appStatus: "loading" | "ready" | "error", message = ""): void {
    const prompt = state.isNear ? "E / 点击 查看通缉令" : "靠近公告栏查看通缉令";
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
        <strong>${appStatus === "ready" ? "●" : "○"} Three.js + TypeScript + Vite + GSAP</strong>
        <p>${message || prompt}</p>
      </section>
    `;
  }
}
```

Create `src/ui/NoticeDetailView.ts`:

```ts
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
```

Create `src/styles.css`:

```css
:root {
  font-family: "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif;
  color: #f4f1ea;
  background: #0f1517;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow: hidden;
}

#app,
.app-shell,
.webgl-stage {
  width: 100vw;
  height: 100vh;
}

.webgl-stage canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.hud {
  position: fixed;
  left: 24px;
  top: 24px;
  z-index: 10;
  width: min(320px, calc(100vw - 48px));
  display: grid;
  gap: 16px;
  pointer-events: none;
}

.hud section,
.loading-screen,
.error-screen {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(12, 17, 19, 0.72);
  backdrop-filter: blur(10px);
  padding: 16px;
}

.hud h1,
.hud h2,
.hud p {
  margin: 0;
}

.hud h1 {
  font-size: 24px;
  line-height: 1.2;
}

.hud h2 {
  margin-bottom: 10px;
  font-size: 15px;
}

.hud p {
  margin-top: 8px;
  color: rgba(244, 241, 234, 0.8);
}

kbd {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  margin-right: 4px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.notice-detail {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center end;
  padding: 32px;
  background: rgba(0, 0, 0, 0.42);
}

.notice-detail[aria-hidden="true"] {
  visibility: hidden;
  pointer-events: none;
}

.notice-detail__panel {
  position: relative;
  width: min(560px, calc(100vw - 48px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(17, 20, 19, 0.9);
  padding: 18px 18px 54px;
}

.notice-detail__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 28px;
  cursor: pointer;
}

.notice-detail__paper {
  max-height: calc(100vh - 150px);
  overflow: auto;
  transform-origin: center top;
}

.notice-detail__image {
  display: block;
  width: 100%;
  transform-origin: center top;
  will-change: transform;
}

.notice-detail__help,
.notice-detail__hint {
  position: absolute;
  bottom: 14px;
  margin: 0;
  color: rgba(244, 241, 234, 0.82);
}

.notice-detail__help {
  left: 18px;
}

.notice-detail__hint {
  right: 18px;
  color: #f2c36b;
}

.loading-screen,
.error-screen {
  position: fixed;
  inset: auto 24px 24px 24px;
  z-index: 30;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Run UI test to verify it passes**

Run:

```bash
npm run test -- src/ui/NoticeDetailView.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit UI module**

```bash
git add src/ui/HudView.ts src/ui/NoticeDetailView.ts src/ui/NoticeDetailView.test.ts src/styles.css
git commit -m "feat: add wanted notice UI views"
```

Expected: commit succeeds.

---

### Task 4: GSAP Animation Director

**Files:**
- Create: `src/animation/AnimationDirector.ts`
- Create: `src/animation/AnimationDirector.test.ts`

- [ ] **Step 1: Write failing animation tests**

Create `src/animation/AnimationDirector.test.ts`:

```ts
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
```

- [ ] **Step 2: Run animation test to verify it fails**

Run:

```bash
npm run test -- src/animation/AnimationDirector.test.ts
```

Expected: FAIL with an import error because `AnimationDirector.ts` does not exist.

- [ ] **Step 3: Implement AnimationDirector**

Create `src/animation/AnimationDirector.ts`:

```ts
import { gsap } from "gsap";

type TimelineLike = {
  set: (target: Element, vars: Record<string, unknown>, position?: string | number) => TimelineLike;
  to: (target: Element, vars: Record<string, unknown>, position?: string | number) => TimelineLike;
  play: () => TimelineLike;
  reverse: () => TimelineLike;
  kill: () => void;
};

export type AnimationAdapter = {
  timeline: (vars?: Record<string, unknown>) => TimelineLike;
};

type AnimationDirectorOptions = {
  adapter?: AnimationAdapter;
  reduceMotion?: boolean;
};

export class AnimationDirector {
  private readonly adapter: AnimationAdapter;
  private readonly reduceMotion: boolean;
  private noticeTimeline: TimelineLike | null = null;

  constructor(options: AnimationDirectorOptions = {}) {
    this.adapter = options.adapter ?? {
      timeline: (vars) => gsap.timeline(vars) as unknown as TimelineLike,
    };
    this.reduceMotion =
      options.reduceMotion ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  openNotice(panel: Element, paper: Element): void {
    this.noticeTimeline?.kill();
    const duration = this.reduceMotion ? 0 : 0.42;
    this.noticeTimeline = this.adapter.timeline({
      defaults: { ease: "power2.out", duration },
    });

    this.noticeTimeline
      .set(panel, { autoAlpha: 1 }, 0)
      .set(paper, { scale: this.reduceMotion ? 1 : 0.96, y: this.reduceMotion ? 0 : 16 }, 0)
      .to(panel, { autoAlpha: 1, duration }, 0)
      .to(paper, { scale: 1, y: 0, duration }, 0)
      .play();
  }

  closeNotice(): void {
    this.noticeTimeline?.reverse();
  }

  pulseHotspot(target: Element): void {
    if (this.reduceMotion) {
      return;
    }
    gsap.to(target, {
      scale: 1.03,
      duration: 0.18,
      yoyo: true,
      repeat: 1,
      ease: "power1.out",
      overwrite: "auto",
    });
  }
}
```

- [ ] **Step 4: Run animation test to verify it passes**

Run:

```bash
npm run test -- src/animation/AnimationDirector.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit animation director**

```bash
git add src/animation/AnimationDirector.ts src/animation/AnimationDirector.test.ts
git commit -m "feat: add GSAP animation director"
```

Expected: commit succeeds.

---

### Task 5: Player Controller

**Files:**
- Create: `src/three/PlayerController.ts`
- Create: `src/three/PlayerController.test.ts`

- [ ] **Step 1: Write failing player tests**

Create `src/three/PlayerController.test.ts`:

```ts
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
```

- [ ] **Step 2: Run player test to verify it fails**

Run:

```bash
npm run test -- src/three/PlayerController.test.ts
```

Expected: FAIL with an import error because `PlayerController.ts` does not exist.

- [ ] **Step 3: Implement PlayerController**

Create `src/three/PlayerController.ts`:

```ts
import * as THREE from "three";

export type PlayerBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  speed: number;
};

const defaultBounds: PlayerBounds = {
  minX: -6,
  maxX: 6,
  minZ: -8,
  maxZ: 5,
  speed: 2.6,
};

export class PlayerController {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly bounds: PlayerBounds;
  private readonly keys = new Set<string>();
  private paused = false;
  private yaw = 0;
  private pitch = 0;

  constructor(camera: THREE.PerspectiveCamera, bounds: Partial<PlayerBounds> = {}) {
    this.camera = camera;
    this.bounds = { ...defaultBounds, ...bounds };
  }

  bind(target: Window = window): () => void {
    const keydown = (event: KeyboardEvent) => this.setKey(event.code, true);
    const keyup = (event: KeyboardEvent) => this.setKey(event.code, false);
    const mousemove = (event: MouseEvent) => this.look(event.movementX, event.movementY);
    target.addEventListener("keydown", keydown);
    target.addEventListener("keyup", keyup);
    target.addEventListener("mousemove", mousemove);
    return () => {
      target.removeEventListener("keydown", keydown);
      target.removeEventListener("keyup", keyup);
      target.removeEventListener("mousemove", mousemove);
    };
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.keys.clear();
    }
  }

  setKey(code: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(code);
    } else {
      this.keys.delete(code);
    }
  }

  look(movementX: number, movementY: number): void {
    if (this.paused) {
      return;
    }
    this.yaw -= movementX * 0.002;
    this.pitch = THREE.MathUtils.clamp(this.pitch - movementY * 0.002, -0.72, 0.72);
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  update(deltaSeconds: number): void {
    if (this.paused) {
      return;
    }

    const direction = new THREE.Vector3();
    direction.z += this.keys.has("KeyW") ? -1 : 0;
    direction.z += this.keys.has("KeyS") ? 1 : 0;
    direction.x += this.keys.has("KeyA") ? -1 : 0;
    direction.x += this.keys.has("KeyD") ? 1 : 0;

    if (direction.lengthSq() === 0) {
      return;
    }

    direction.normalize();
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.camera.position.x = THREE.MathUtils.clamp(
      this.camera.position.x + direction.x * this.bounds.speed * deltaSeconds,
      this.bounds.minX,
      this.bounds.maxX,
    );
    this.camera.position.z = THREE.MathUtils.clamp(
      this.camera.position.z + direction.z * this.bounds.speed * deltaSeconds,
      this.bounds.minZ,
      this.bounds.maxZ,
    );
    this.camera.position.y = 1.65;
  }
}
```

- [ ] **Step 4: Run player test to verify it passes**

Run:

```bash
npm run test -- src/three/PlayerController.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit player controller**

```bash
git add src/three/PlayerController.ts src/three/PlayerController.test.ts
git commit -m "feat: add first person player controller"
```

Expected: commit succeeds.

---

### Task 6: Asset Manager

**Files:**
- Create: `src/three/AssetManager.ts`

- [ ] **Step 1: Create asset manager**

Create `src/three/AssetManager.ts`:

```ts
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

export type AssetProgress = {
  loaded: number;
  total: number;
  percent: number;
  url: string;
};

export type LoadedAssets = {
  street: GLTF;
  board: GLTF;
  noticeTexture: THREE.Texture;
};

export class AssetManager {
  private readonly manager: THREE.LoadingManager;
  private readonly gltfLoader: GLTFLoader;
  private readonly textureLoader: THREE.TextureLoader;

  constructor(onProgress: (progress: AssetProgress) => void, onError: (message: string) => void) {
    this.manager = new THREE.LoadingManager();
    this.manager.onProgress = (url, loaded, total) => {
      onProgress({ url, loaded, total, percent: Math.round((loaded / total) * 100) });
    };
    this.manager.onError = (url) => {
      onError(`资源加载失败：${url}`);
    };
    this.gltfLoader = new GLTFLoader(this.manager);
    this.textureLoader = new THREE.TextureLoader(this.manager);
  }

  async loadAll(): Promise<LoadedAssets> {
    const [street, board, noticeTexture] = await Promise.all([
      this.loadGLTF("/assets/old_street_store.glb"),
      this.loadGLTF("/assets/board.glb"),
      this.loadTexture("/assets/tjl.png"),
    ]);

    noticeTexture.colorSpace = THREE.SRGBColorSpace;
    noticeTexture.anisotropy = 4;
    noticeTexture.needsUpdate = true;

    return { street, board, noticeTexture };
  }

  private loadGLTF(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });
  }

  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(url, resolve, undefined, reject);
    });
  }
}
```

- [ ] **Step 2: Type-check asset manager**

Run:

```bash
npm exec tsc -- --noEmit --pretty false
```

Expected: TypeScript exits with code 0.

- [ ] **Step 3: Commit asset manager**

```bash
git add src/three/AssetManager.ts
git commit -m "feat: add Three.js asset manager"
```

Expected: commit succeeds.

---

### Task 7: Scene Manager and Notice Mesh

**Files:**
- Create: `src/three/SceneManager.ts`

- [ ] **Step 1: Create scene manager**

Create `src/three/SceneManager.ts`:

```ts
import * as THREE from "three";
import type { LoadedAssets } from "./AssetManager";

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly noticeMesh: THREE.Mesh;
  private readonly container: HTMLElement;
  private readonly clock = new THREE.Clock();
  private animationFrame = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x121719);
    this.scene.fog = new THREE.Fog(0x121719, 8, 32);

    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 80);
    this.camera.position.set(0, 1.65, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    container.appendChild(this.renderer.domElement);

    this.noticeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 1.58),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.82,
        metalness: 0,
        emissive: new THREE.Color(0x000000),
      }),
    );
    this.noticeMesh.name = "main-wanted-notice";
    this.noticeMesh.position.set(0, 1.7, -1.2);

    this.addLights();
  }

  mountAssets(assets: LoadedAssets): void {
    const street = assets.street.scene;
    const board = assets.board.scene;
    street.name = "old-street-store";
    board.name = "community-board";
    street.position.set(0, 0, 0);
    board.position.set(0, 0, -1.8);

    street.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.receiveShadow = true;
      }
    });

    board.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const material = this.noticeMesh.material;
    if (material instanceof THREE.MeshStandardMaterial) {
      material.map = assets.noticeTexture;
      material.needsUpdate = true;
    }

    board.add(this.noticeMesh);
    this.scene.add(street, board);
  }

  setNoticeHighlighted(highlighted: boolean): void {
    const material = this.noticeMesh.material;
    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive.setHex(highlighted ? 0x35210c : 0x000000);
    }
  }

  start(onFrame: (deltaSeconds: number) => void): void {
    const tick = () => {
      const delta = this.clock.getDelta();
      onFrame(delta);
      this.renderer.render(this.scene, this.camera);
      this.animationFrame = window.requestAnimationFrame(tick);
    };
    tick();
  }

  resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrame);
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.renderer.dispose();
    this.container.replaceChildren();
  }

  private addLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.6);
    sun.position.set(4, 8, 5);
    this.scene.add(sun);
  }
}
```

- [ ] **Step 2: Type-check scene manager**

Run:

```bash
npm exec tsc -- --noEmit --pretty false
```

Expected: TypeScript exits with code 0.

- [ ] **Step 3: Commit scene manager**

```bash
git add src/three/SceneManager.ts
git commit -m "feat: add Three.js scene manager"
```

Expected: commit succeeds.

---

### Task 8: Interaction Manager

**Files:**
- Create: `src/three/InteractionManager.ts`
- Create: `src/three/InteractionManager.test.ts`

- [ ] **Step 1: Write failing interaction tests**

Create `src/three/InteractionManager.test.ts`:

```ts
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
```

- [ ] **Step 2: Run interaction test to verify it fails**

Run:

```bash
npm run test -- src/three/InteractionManager.test.ts
```

Expected: FAIL with an import error because `InteractionManager.ts` does not exist.

- [ ] **Step 3: Implement InteractionManager**

Create `src/three/InteractionManager.ts`:

```ts
import * as THREE from "three";

export class InteractionManager {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse = new THREE.Vector2();
  private noticeTarget: THREE.Object3D | null = null;
  private openNotice: (() => void) | null = null;
  private hovered = false;
  private lastHoverCheck = 0;

  constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.canvas = canvas;
  }

  bind(): () => void {
    const click = (event: MouseEvent) => {
      this.updateMouse(event);
      if (this.isHoveringNotice()) {
        this.openNotice?.();
      }
    };
    const move = (event: MouseEvent) => {
      const now = performance.now();
      if (now - this.lastHoverCheck < 50) {
        return;
      }
      this.lastHoverCheck = now;
      this.updateMouse(event);
      this.hovered = this.isHoveringNotice();
    };
    const keydown = (event: KeyboardEvent) => this.handleKey(event.code);

    this.canvas.addEventListener("click", click);
    this.canvas.addEventListener("mousemove", move);
    window.addEventListener("keydown", keydown);

    return () => {
      this.canvas.removeEventListener("click", click);
      this.canvas.removeEventListener("mousemove", move);
      window.removeEventListener("keydown", keydown);
    };
  }

  setNoticeTarget(target: THREE.Object3D): void {
    this.noticeTarget = target;
  }

  onOpenNotice(callback: () => void): void {
    this.openNotice = callback;
  }

  handleKey(code: string): void {
    if (code === "KeyE" && this.isNearNotice()) {
      this.openNotice?.();
    }
  }

  isNearNotice(): boolean {
    if (!this.noticeTarget) {
      return false;
    }
    const targetPosition = new THREE.Vector3();
    this.noticeTarget.getWorldPosition(targetPosition);
    return this.camera.position.distanceTo(targetPosition) <= 3.2;
  }

  isHovered(): boolean {
    return this.hovered;
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private isHoveringNotice(): boolean {
    if (!this.noticeTarget || !this.isNearNotice()) {
      return false;
    }
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObject(this.noticeTarget, true).length > 0;
  }
}
```

- [ ] **Step 4: Run interaction test to verify it passes**

Run:

```bash
npm run test -- src/three/InteractionManager.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit interaction manager**

```bash
git add src/three/InteractionManager.ts src/three/InteractionManager.test.ts
git commit -m "feat: add wanted notice interaction manager"
```

Expected: commit succeeds.

---

### Task 9: App Composition and Bootstrap

**Files:**
- Create: `src/App.ts`
- Create: `src/main.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Create app composition**

Create `src/App.ts`:

```ts
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
        if (event.code === "Escape" && this.state.isOpen) {
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
    const paper = panel.querySelector(".notice-detail__image");
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
  }
}
```

Create `src/main.ts`:

```ts
import "./styles.css";
import { App } from "./App";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("App root #app not found");
}

const app = new App(root);
void app.start();

window.addEventListener("beforeunload", () => {
  app.dispose();
});
```

- [ ] **Step 2: Run all unit tests and build**

Run:

```bash
npm run test
npm run build
```

Expected: all Vitest tests pass and Vite build succeeds.

- [ ] **Step 3: Commit app integration**

```bash
git add src/App.ts src/main.ts src/styles.css
git commit -m "feat: compose wanted notice exploration app"
```

Expected: commit succeeds.

---

### Task 10: Browser Acceptance Tests

**Files:**
- Create: `tests/e2e/wanted-notice.spec.ts`

- [ ] **Step 1: Write Playwright acceptance test**

Create `tests/e2e/wanted-notice.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("loads the scene shell and opens the wanted notice detail", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "中国社区 · 通缉令演示" })).toBeVisible();
  await expect(page.getByText("Three.js + TypeScript + Vite + GSAP")).toBeVisible();
  await expect(page.getByText("靠近公告栏查看通缉令")).toBeVisible({ timeout: 20_000 });

  await page.keyboard.press("KeyE");
  const detail = page.getByLabel("通缉令详情");

  await expect(detail).toBeVisible({ timeout: 20_000 });
  await expect(detail.getByAltText("通缉令详情")).toHaveAttribute("src", /\/assets\/tjl\.png$/);

  await page.keyboard.press("Escape");
  await expect(detail).toBeHidden();
});
```

- [ ] **Step 2: Run Playwright test**

Run:

```bash
npm run test:e2e
```

Expected: PASS in Chromium.

- [ ] **Step 3: Commit acceptance test**

```bash
git add tests/e2e/wanted-notice.spec.ts src/App.ts src/three/SceneManager.ts
git commit -m "test: add wanted notice browser acceptance path"
```

Expected: commit succeeds.

---

### Task 11: Loading and Error Screen Polish

**Files:**
- Modify: `src/App.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Add explicit loading and error markup**

Add this method to `src/App.ts`:

```ts
  private renderOverlay(): void {
    this.shell.querySelector(".loading-screen")?.remove();
    this.shell.querySelector(".error-screen")?.remove();

    if (this.status === "ready") {
      return;
    }

    const overlay = document.createElement("section");
    overlay.className = this.status === "error" ? "error-screen" : "loading-screen";
    overlay.setAttribute("role", this.status === "error" ? "alert" : "status");
    overlay.innerHTML = `
      <strong>${this.status === "error" ? "加载失败" : "加载中"}</strong>
      <p>${this.message}</p>
    `;
    this.shell.appendChild(overlay);
  }
```

Update the existing `render()` method in `src/App.ts` to:

```ts
  private render(): void {
    this.hud.render(this.state, this.status, this.message);
    this.detail.render(this.state);
    this.renderOverlay();
  }
```

- [ ] **Step 2: Run build and tests**

Run:

```bash
npm run test
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 3: Commit loading and error UI**

```bash
git add src/App.ts src/styles.css
git commit -m "feat: add loading and error overlays"
```

Expected: commit succeeds.

---

### Task 12: Final Verification and Manual QA

**Files:**
- No new files.

- [ ] **Step 1: Run complete automated verification**

Run:

```bash
npm run test
npm run build
npm run test:e2e
```

Expected: all commands pass.

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Vite serves the app at `http://127.0.0.1:5173/`.

- [ ] **Step 3: Manual QA checklist**

Open `http://127.0.0.1:5173/` and verify:

```text
[ ] Loading progress or loading message appears before the scene is ready.
[ ] old_street_store.glb is visible.
[ ] board.glb is visible.
[ ] WASD moves the camera.
[ ] Mouse movement changes view direction.
[ ] Camera remains inside the intended street area.
[ ] Near the notice board, the HUD prompt changes to E / 点击 查看通缉令.
[ ] Pressing E opens the wanted notice detail.
[ ] Clicking the notice opens the wanted notice detail.
[ ] Detail panel shows assets/tjl.png clearly.
[ ] Mouse wheel zooms the detail image within limits.
[ ] Esc closes the detail panel.
[ ] Close button closes the detail panel.
[ ] GSAP transitions are visible unless reduced motion is enabled.
[ ] Browser console has no uncaught errors.
```

- [ ] **Step 4: Record final git state**

Run:

```bash
git status --short
```

Expected: no output after successful QA. When manual QA produces code or style changes, run:

```bash
git add src tests package.json package-lock.json index.html tsconfig.json vite.config.ts playwright.config.ts
git commit -m "fix: polish wanted notice exploration experience"
```

Expected: commit succeeds and `git status --short` prints nothing afterward.

---

## Self-Review

- Spec coverage: Tasks cover scaffold, state, UI, GSAP animation, player movement, asset loading, scene rendering, Raycaster interaction, loading/error states, e2e acceptance, and manual QA from `PRD.md`.
- Placeholder scan: No placeholder markers are used. All code-changing steps include concrete code or exact replacement snippets.
- Type consistency: `NoticeState`, `NoticeHintId`, `AnimationDirector`, `PlayerController`, `InteractionManager`, `AssetManager`, `SceneManager`, `HudView`, and `NoticeDetailView` names are consistent across tasks.
- Scope check: The plan keeps one main notice and no multi-case system, matching the MVP.
