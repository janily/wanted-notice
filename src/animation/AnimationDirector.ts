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
    this.adapter =
      options.adapter ??
      ({
        timeline: (vars) => gsap.timeline(vars) as unknown as TimelineLike,
      } satisfies AnimationAdapter);
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
