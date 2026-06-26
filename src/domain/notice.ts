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

export const assetUrls = {
  streetModel: new URL("../../assets/old_street_store.glb", import.meta.url).href,
  boardModel: new URL("../../assets/board.glb", import.meta.url).href,
  noticeImage: new URL("../../assets/tjl.png", import.meta.url).href,
};

export const defaultNotice: Notice = {
  id: "main-wanted-notice",
  title: "通缉令",
  imageUrl: assetUrls.noticeImage,
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
