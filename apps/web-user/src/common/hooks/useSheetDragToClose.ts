"use client";

import { useEffect, useRef, type RefObject } from "react";
import { sheetGesture, sheetReleaseMs, shouldCloseSheet } from "@picake/design-tokens";

/** 손짓이 콘텐츠 안의 다른 스크롤 영역(또는 data-no-sheet-drag)에서 시작했는지 */
function isInNestedScroll(target: Node, content: HTMLElement): boolean {
  let el: HTMLElement | null = target instanceof HTMLElement ? target : target.parentElement;
  while (el && el !== content) {
    if (el.hasAttribute("data-no-sheet-drag")) return true;
    const overflowY = getComputedStyle(el).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

interface Options {
  open: boolean;
  enabled?: boolean;
  sheetRef: RefObject<HTMLElement | null>;
  /** 뒤 어두운 면. 끄는 동안 창이 내려간 만큼 옅어진다 */
  scrimRef: RefObject<HTMLElement | null>;
  /**
   * 내용 스크롤 상자. 주면 내용에서 시작한 손짓은 내용이 맨 위이고 아래로 당길 때만 창을 끈다
   * (안쪽 다른 스크롤 — 시간 휠 등 — 에서 시작하면 그 스크롤이 받는다). 없으면 창 어디서든 끈다.
   */
  contentRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}

/**
 * 아래 창을 손으로 끌어 닫기(손님 앱). 규칙·값은 판매자 앱과 같은 `sheetGesture`(@picake/design-tokens).
 * - 창이 손가락을 1:1로 따라 내려가고 뒤 어두운 면이 같이 옅어진다
 * - 놓으면 속도·거리로 닫을지 정한다. 닫을 때는 손가락 속도를 이어받아 내려가고(창의 sheet-out 움직임 시간·곡선을
 *   그때만 바꿈), 닫지 않으면 바로 출발해 제자리에 멈춘다
 * - 끌기를 시작하는 첫 움직임부터 막아 뒤 화면 스크롤·당겨서 새로 고침이 시작되지 않게 한다
 * - onClose를 불러도 창이 닫히지 않으면(예: "예약 진행을 취소할까요?" 확인 창) 제자리로 돌려 둔다
 */
export function useSheetDragToClose({
  open,
  enabled = true,
  sheetRef,
  scrimRef,
  contentRef,
  onClose,
}: Options) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (!open || !sheet) return;
    // 끌어내려 닫히던 중에 다시 열리면 끌던 자리·바꿔 둔 움직임을 지운다
    const reset = () => {
      for (const el of [sheet, scrim]) {
        if (!el) continue;
        el.style.transition = "";
        el.style.transform = "";
        el.style.opacity = "";
        el.style.animationDuration = "";
        el.style.animationTimingFunction = "";
        el.style.willChange = "";
      }
    };
    reset();
    if (!enabled) return;

    let disposed = false;
    let dragging = false;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let delta = 0;
    let settleTimer = 0;

    const paint = (y: number) => {
      sheet.style.transform = y > 0 ? `translate3d(0, ${y}px, 0)` : "";
      if (scrim) {
        scrim.style.opacity = y > 0 ? String(Math.max(0, 1 - y / (sheet.offsetHeight || 1))) : "";
      }
    };

    const settle = () => {
      const ease = `${sheetGesture.settleMs}ms ${sheetGesture.releaseEasing}`;
      sheet.style.transition = `transform ${ease}`;
      if (scrim) scrim.style.transition = `opacity ${ease}`;
      paint(0);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (disposed || dragging) return;
        sheet.style.transition = "";
        sheet.style.willChange = "";
        if (scrim) scrim.style.transition = "";
      }, sheetGesture.settleMs + 20);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = lastY = e.touches[0].clientY;
      lastT = performance.now();
      velocity = 0;
      delta = 0;
      dragging = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const y = e.touches[0].clientY;
      const now = performance.now();
      if (!dragging) {
        const dy = y - startY;
        if (dy <= 0) return;
        const content = contentRef?.current;
        const target = e.target as Node;
        if (content && content.contains(target)) {
          // 내용에서는 맨 위이고 아래로 당길 때만, 안쪽 다른 스크롤이 아닐 때만
          if (content.scrollTop > 0 || isInNestedScroll(target, content)) return;
        }
        dragging = true;
        window.clearTimeout(settleTimer);
        startY = y;
        sheet.style.transition = "none";
        sheet.style.willChange = "transform";
        if (scrim) scrim.style.transition = "none";
        // 시작하는 움직임부터 막는다(놓아두면 브라우저가 뒤 화면 스크롤을 시작해 그 뒤는 막을 수 없음)
        if (e.cancelable) e.preventDefault();
        lastY = y;
        lastT = now;
        return;
      }
      if (e.cancelable) e.preventDefault();
      const dt = Math.max(1, now - lastT);
      // 마지막 몇 움직임을 고르게(손가락 떨림에 흔들리지 않게)
      velocity = velocity * 0.4 + ((y - lastY) / dt) * 0.6;
      lastY = y;
      lastT = now;
      delta = Math.max(0, y - startY);
      paint(delta);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!dragging) return;
      dragging = false;
      // 손을 멈췄다 놓으면 속도는 0으로 본다
      if (performance.now() - lastT > 80) velocity = 0;
      const height = sheet.offsetHeight;
      if (e.type === "touchend" && shouldCloseSheet(delta, velocity, height)) {
        // 손가락 속도를 이어받아 지금 자리에서 끝까지 내려간다(sheet-out은 지금 자리에서 시작하는 움직임)
        const ms = sheetReleaseMs(height - delta, velocity);
        for (const el of [sheet, scrim]) {
          if (!el) continue;
          el.style.animationDuration = `${ms}ms`;
          el.style.animationTimingFunction = sheetGesture.releaseEasing;
        }
        closeRef.current();
        // 닫히지 않았으면(확인 창 등) 제자리로
        window.setTimeout(() => {
          if (disposed) return;
          for (const el of [sheet, scrim]) {
            if (!el) continue;
            el.style.animationDuration = "";
            el.style.animationTimingFunction = "";
          }
          settle();
        }, 80);
      } else {
        settle();
      }
      delta = 0;
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd);
    sheet.addEventListener("touchcancel", onTouchEnd);
    return () => {
      disposed = true;
      window.clearTimeout(settleTimer);
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open, enabled, sheetRef, scrimRef, contentRef]);
}
