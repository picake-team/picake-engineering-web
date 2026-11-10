"use client";

import { motionDuration, motionEasing } from "@picake/design-tokens";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import {
  LIST_SHEET_HANDLE_HEIGHT,
  MAP_STORE_LIST_FILTER_MODAL_ID,
} from "@/apps/web-user/features/store/constants/map.constant";

function isInsideMapListFilterModal(target: EventTarget | null): boolean {
  if (typeof document === "undefined" || !(target instanceof Node)) return false;
  const modal = document.getElementById(MAP_STORE_LIST_FILTER_MODAL_ID);
  return modal?.contains(target) ?? false;
}

/** 목록 영역에서 시트 드래그로 인식하기 전 최소 이동(px) */
const CONTENT_SHEET_DRAG_THRESHOLD = 8;

interface MapListSheetPanelProps {
  /** 패널 오프셋(px). 0이면 핸들만 보임 */
  offset: number;
  /** true면 최상단까지 펼친 상태 — 이때만 목록 세로 스크롤 허용 */
  expandedToTop?: boolean;
  /** 필터 모달이 열려 있을 때 목록 영역 드래그·스크롤 제스처 비활성화 */
  disableContentGestures?: boolean;
  isDragging: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  sheetPointerDown: (clientY: number) => void;
  sheetPointerMove: (clientY: number) => void;
  sheetPointerUp: () => void;
  children: ReactNode;
}

type ContentGestureMode = "undecided" | "sheet" | "scroll";

export function MapListSheetPanel({
  offset,
  expandedToTop = false,
  disableContentGestures = false,
  isDragging,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseDown,
  sheetPointerDown,
  sheetPointerMove,
  sheetPointerUp,
  children,
}: MapListSheetPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentGestureRef = useRef<{
    mode: ContentGestureMode;
    startY: number;
    startScrollTop: number;
  } | null>(null);

  /** 꽉 찬 상태에서만 목록 스크롤 — 그 외에는 시트 높이 조절만 */
  const contentScrollEnabled = expandedToTop && !disableContentGestures;

  const resetContentGesture = useCallback(() => {
    contentGestureRef.current = null;
    const el = scrollRef.current;
    if (el) el.style.touchAction = "";
  }, []);

  const canScrollListVertically = useCallback((el: HTMLDivElement) => {
    return el.scrollHeight > el.clientHeight + 1;
  }, []);

  const beginSheetDragFromContent = useCallback(
    (
      el: HTMLDivElement,
      gesture: { mode: ContentGestureMode; startY: number },
      clientY: number,
      preventDefault?: () => void,
    ) => {
      gesture.mode = "sheet";
      el.style.touchAction = "none";
      preventDefault?.();
      sheetPointerDown(gesture.startY);
      sheetPointerMove(clientY);
    },
    [sheetPointerDown, sheetPointerMove],
  );

  useEffect(() => {
    if (!disableContentGestures) return;
    const g = contentGestureRef.current;
    if (g?.mode === "sheet") {
      sheetPointerUp();
    }
    resetContentGesture();
  }, [disableContentGestures, resetContentGesture, sheetPointerUp]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (contentScrollEnabled) {
      el.style.overflowY = "auto";
      el.style.overscrollBehavior = "contain";
      el.style.touchAction = "";
    } else {
      el.scrollTop = 0;
      el.style.overflowY = "hidden";
      el.style.overscrollBehavior = "none";
      el.style.touchAction = "none";
      // 시트 드래그가 진행 중이면 제스처 상태를 유지해야 합니다.
      // 여기서 resetContentGesture()를 호출하면 contentGestureRef가 null이 되어
      // 이후 touchmove/touchend에서 sheetPointerMove/sheetPointerUp이 실행되지 않고,
      // 시트가 드래그 위치(full의 90~95%)에 snap 없이 고정되는 버그가 발생합니다.
      if (contentGestureRef.current?.mode !== "sheet") {
        resetContentGesture();
      }
    }
  }, [contentScrollEnabled, resetContentGesture]);

  const handleContentTouchSheetOnly = useCallback(
    (e: React.TouchEvent) => {
      const g = contentGestureRef.current;
      const el = scrollRef.current;
      if (!g || !el) return;

      const clientY = e.touches[0].clientY;

      if (g.mode === "sheet") {
        e.preventDefault();
        sheetPointerMove(clientY);
        return;
      }

      const dy = clientY - g.startY;
      if (Math.abs(dy) < CONTENT_SHEET_DRAG_THRESHOLD) return;

      beginSheetDragFromContent(el, g, clientY, () => e.preventDefault());
    },
    [beginSheetDragFromContent, sheetPointerMove],
  );

  const handleContentTouchScrollEnabled = useCallback(
    (e: React.TouchEvent) => {
      const g = contentGestureRef.current;
      const el = scrollRef.current;
      if (!g || !el) return;

      const clientY = e.touches[0].clientY;

      if (g.mode === "sheet") {
        e.preventDefault();
        sheetPointerMove(clientY);
        return;
      }

      if (g.mode === "scroll") {
        const dy = clientY - g.startY;
        if (el.scrollTop <= 0 && dy > CONTENT_SHEET_DRAG_THRESHOLD) {
          beginSheetDragFromContent(el, g, clientY, () => e.preventDefault());
        }
        return;
      }

      if (el.scrollTop > 0) {
        g.mode = "scroll";
        return;
      }

      const dy = clientY - g.startY;
      if (Math.abs(dy) < CONTENT_SHEET_DRAG_THRESHOLD) return;

      if (dy > 0) {
        beginSheetDragFromContent(el, g, clientY, () => e.preventDefault());
        return;
      }

      if (canScrollListVertically(el)) {
        g.mode = "scroll";
        return;
      }

      beginSheetDragFromContent(el, g, clientY, () => e.preventDefault());
    },
    [beginSheetDragFromContent, canScrollListVertically, sheetPointerMove],
  );

  const onContentTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disableContentGestures || isInsideMapListFilterModal(e.target)) return;
      const el = scrollRef.current;
      if (!el) return;

      if (!contentScrollEnabled) {
        contentGestureRef.current = {
          mode: "undecided",
          startY: e.touches[0].clientY,
          startScrollTop: 0,
        };
        return;
      }

      const startScrollTop = el.scrollTop;
      if (startScrollTop > 0) {
        contentGestureRef.current = {
          mode: "scroll",
          startY: e.touches[0].clientY,
          startScrollTop,
        };
        return;
      }
      contentGestureRef.current = {
        mode: "undecided",
        startY: e.touches[0].clientY,
        startScrollTop: 0,
      };
    },
    [contentScrollEnabled, disableContentGestures],
  );

  const onContentTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disableContentGestures || isInsideMapListFilterModal(e.target)) return;
      if (contentScrollEnabled) {
        handleContentTouchScrollEnabled(e);
      } else {
        handleContentTouchSheetOnly(e);
      }
    },
    [
      contentScrollEnabled,
      disableContentGestures,
      handleContentTouchScrollEnabled,
      handleContentTouchSheetOnly,
    ],
  );

  const onContentTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disableContentGestures || isInsideMapListFilterModal(e.target)) return;
      const g = contentGestureRef.current;
      if (g?.mode === "sheet") {
        e.preventDefault();
        sheetPointerUp();
      }
      resetContentGesture();
    },
    [disableContentGestures, resetContentGesture, sheetPointerUp],
  );

  const onContentMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disableContentGestures || isInsideMapListFilterModal(e.target)) return;
      if (e.button !== 0) return;
      const el = scrollRef.current;
      if (!el) return;

      const startY = e.clientY;
      const startScrollTop = el.scrollTop;
      let mode: ContentGestureMode =
        contentScrollEnabled && startScrollTop > 0 ? "scroll" : "undecided";

      const cleanup = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        el.style.touchAction = contentScrollEnabled ? "" : "none";
      };

      const onUp = () => {
        if (mode === "sheet") sheetPointerUp();
        cleanup();
      };

      const onMove = (moveEvent: MouseEvent) => {
        if (mode === "sheet") {
          sheetPointerMove(moveEvent.clientY);
          return;
        }

        if (!contentScrollEnabled) {
          const dy = moveEvent.clientY - startY;
          if (Math.abs(dy) < CONTENT_SHEET_DRAG_THRESHOLD) return;
          mode = "sheet";
          el.style.touchAction = "none";
          sheetPointerDown(startY);
          sheetPointerMove(moveEvent.clientY);
          return;
        }

        if (mode === "scroll") {
          const dy = moveEvent.clientY - startY;
          if (el.scrollTop <= 0 && dy > CONTENT_SHEET_DRAG_THRESHOLD) {
            mode = "sheet";
            el.style.touchAction = "none";
            sheetPointerDown(startY);
            sheetPointerMove(moveEvent.clientY);
          }
          return;
        }

        if (el.scrollTop > 0) {
          mode = "scroll";
          return;
        }

        const dy = moveEvent.clientY - startY;
        if (Math.abs(dy) < CONTENT_SHEET_DRAG_THRESHOLD) return;

        if (dy > 0) {
          mode = "sheet";
          el.style.touchAction = "none";
          sheetPointerDown(startY);
          sheetPointerMove(moveEvent.clientY);
          return;
        }

        if (canScrollListVertically(el)) {
          mode = "scroll";
          return;
        }

        mode = "sheet";
        el.style.touchAction = "none";
        sheetPointerDown(startY);
        sheetPointerMove(moveEvent.clientY);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [
      canScrollListVertically,
      contentScrollEnabled,
      disableContentGestures,
      sheetPointerDown,
      sheetPointerMove,
      sheetPointerUp,
    ],
  );

  const showSheetDragCursor = !disableContentGestures;

  return (
    <div
      className="fixed left-0 right-0 bottom-[60px] z-50 flex flex-col max-w-[638px] mx-auto overflow-hidden"
      style={{
        height: LIST_SHEET_HANDLE_HEIGHT + offset,
        transition: isDragging ? "none" : `height ${motionDuration.medium}ms ${motionEasing.enter}`,
        background: "#FFFFFF",
        borderRadius: expandedToTop && !isDragging ? 0 : "20px 20px 0 0",
      }}
      aria-label="목록 패널"
    >
      <div
        role="presentation"
        className="shrink-0 flex h-8 items-center justify-center cursor-grab active:cursor-grabbing touch-none py-[13px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{ touchAction: "none" }}
      >
        <div
          className="rounded-full bg-gray-200 shrink-0"
          style={{ width: 56, height: 6 }}
          aria-hidden
        />
      </div>
      <div
        ref={scrollRef}
        className={`flex-1 min-h-0 flex flex-col ${showSheetDragCursor ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ WebkitOverflowScrolling: contentScrollEnabled ? "touch" : undefined }}
        onTouchStart={onContentTouchStart}
        onTouchMove={onContentTouchMove}
        onTouchEnd={onContentTouchEnd}
        onTouchCancel={onContentTouchEnd}
        onMouseDown={onContentMouseDown}
      >
        {children}
      </div>
    </div>
  );
}
