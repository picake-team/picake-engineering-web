/**
 * 아래에서 올라오는 창을 손잡이·제목 부분에서 아래로 끌어 닫기(앱처럼).
 * - 끄는 동안 창이 손가락을 따라 내려가고 뒤 어둡게 한 면도 같이 옅어진다.
 * - 창 높이의 30%(최대 120px)보다 많이 끌었거나 빠르게 내렸으면 닫고, 아니면 제자리로 돌아간다.
 * - 버튼(닫기 ×)·입력 칸에서 시작하면 끌지 않는다. enabled가 false(처리 중)면 끌지 않는다.
 */
import { useRef } from "react";
import type React from "react";

const CLOSE_DISTANCE_MAX = 120;
const CLOSE_DISTANCE_RATIO = 0.3;
/** px/ms. 이보다 빠르게 내리면 조금만 끌어도 닫는다 */
const FLICK_VELOCITY = 0.6;
const FLICK_MIN_DISTANCE = 24;

export function shouldCloseSheet(dy: number, velocity: number, panelHeight: number) {
  if (dy <= 0) return false;
  if (velocity > FLICK_VELOCITY && dy > FLICK_MIN_DISTANCE) return true;
  return dy > Math.min(CLOSE_DISTANCE_MAX, panelHeight * CLOSE_DISTANCE_RATIO);
}

export function useSheetDrag({
  panelRef,
  backdropRef,
  onClose,
  enabled = true,
}: {
  panelRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  enabled?: boolean;
}) {
  const drag = useRef<{
    id: number;
    startY: number;
    lastY: number;
    lastT: number;
    v: number;
  } | null>(null);

  const paint = (dy: number, animate: boolean) => {
    const panel = panelRef.current;
    if (!panel) return;
    const ease = animate ? "200ms cubic-bezier(0.2, 0, 0, 1)" : "none";
    panel.style.transition = animate ? `transform ${ease}` : "none";
    panel.style.transform = dy > 0 ? `translateY(${dy}px)` : "";
    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.style.transition = animate ? `opacity ${ease}` : "none";
      backdrop.style.opacity =
        dy > 0 ? String(Math.max(0, 1 - dy / (panel.offsetHeight || 1))) : "";
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!enabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select, [role='switch']")) {
      return;
    }
    const now = performance.now();
    drag.current = { id: e.pointerId, startY: e.clientY, lastY: e.clientY, lastT: now, v: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const now = performance.now();
    d.v = (e.clientY - d.lastY) / Math.max(1, now - d.lastT);
    d.lastY = e.clientY;
    d.lastT = now;
    paint(Math.max(0, e.clientY - d.startY), false);
  };

  const finish = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    const panel = panelRef.current;
    const dy = Math.max(0, d.lastY - d.startY);
    const height = panel?.offsetHeight ?? 0;
    if (e.type === "pointerup" && shouldCloseSheet(dy, d.v, height)) {
      // 끝까지 내려 보낸 뒤 닫는다
      paint(height, true);
      window.setTimeout(onClose, 180);
    } else {
      paint(0, true);
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: finish,
    /** 끄는 동안 화면이 같이 스크롤되지 않게 */
    style: { touchAction: "none" } as React.CSSProperties,
  };
}
