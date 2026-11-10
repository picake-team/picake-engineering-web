"use client";

import { motionDuration, motionEasing } from "@picake/design-tokens";
import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { usePresence } from "@/apps/web-user/common/hooks/usePresence";

/** 닫힐 때 내려가는 시간(공용 움직임 값 sheet-out = medium) */
const SHEET_EXIT_MS = 250;

interface DragHandleBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 오버레이·시트 스택 순서 (기본 z-50) */
  zIndexClassName?: string;
  /** 시트를 아래로 끌어내려 닫을 수 있는지 (기본 true). false면 핸들은 시각 표시만 됨 */
  draggable?: boolean;
  /** 드래그 닫힘 임계값(px). 끌어내린 거리가 이 값보다 크면 onClose. 기본 80 */
  closeThresholdPx?: number;
  /** 화면 읽기용 창 이름(제목 줄이 없어서 따로 받는다) */
  ariaLabel?: string;
}

/**
 * 상단 drag handle만 노출되는 헤더리스 바텀시트.
 * 콘텐츠 영역(children)은 padding 없이 렌더되니 호출부에서 자유롭게 레이아웃 구성.
 *
 * - draggable=true(기본): 시트 어디서든 아래로 끌어내리면 시트가 따라 내려가고, 임계값 이상이면 닫힘. 미만은 스냅백.
 * - draggable=false: 핸들은 시각 표시만 됨.
 *
 * 헤더(중앙 제목 + X 버튼)가 있는 표준 시트는 `BottomSheet` 사용.
 */
export function DragHandleBottomSheet({
  isOpen,
  onClose,
  children,
  zIndexClassName,
  draggable = true,
  closeThresholdPx = 80,
  ariaLabel,
}: DragHandleBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 바텀시트 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 아래로 끌어내려 닫기: 시트 어디서든 아래로 드래그하면 시트가 따라 내려가고, 임계값 이상이면 닫힘.
  // touchmove는 passive:false로 등록해야 드래그 중 pull-to-refresh/스크롤을 막을 수 있어 React 핸들러 대신 직접 등록.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!isOpen || !draggable || !sheet) return;
    // 끌어내려 닫히던 중에 다시 열리면 끌던 자리를 지운다
    sheet.style.transition = "";
    sheet.style.transform = "";

    let startY = 0;
    let delta = 0;
    let dragging = false;

    const setTransform = (y: number, animate: boolean) => {
      sheet.style.transition = animate
        ? `transform ${motionDuration.base}ms ${motionEasing.enter}`
        : "none";
      sheet.style.transform = y ? `translateY(${y}px)` : "";
    };

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      delta = 0;
      dragging = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;
      if (!dragging) {
        if (dy <= 0) return;
        dragging = true;
        startY = e.touches[0].clientY;
        return;
      }
      delta = Math.max(0, dy);
      if (e.cancelable) e.preventDefault();
      setTransform(delta, false);
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      if (delta > closeThresholdPx) {
        onClose();
      } else {
        setTransform(0, true);
      }
      delta = 0;
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd);
    sheet.addEventListener("touchcancel", onTouchEnd);
    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isOpen, draggable, closeThresholdPx, onClose]);

  // 닫힐 때도 내려가는 움직임이 끝날 때까지 그린다(그동안 내용은 마지막으로 열려 있던 때 그대로)
  const presence = usePresence(isOpen, SHEET_EXIT_MS, children);
  if (!presence.present) return null;
  const { leaving } = presence;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 bg-black/50",
        leaving
          ? "pointer-events-none animate-scrim-out"
          : "animate-scrim-in motion-reduce:animate-fade-in",
        zIndexClassName ?? "z-50",
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={clsx(
          "fixed bottom-0 left-0 right-0 max-w-[638px] mx-auto bg-white rounded-t-3xl flex flex-col",
          leaving
            ? "animate-sheet-out motion-reduce:animate-fade-out"
            : "animate-sheet-in motion-reduce:animate-fade-in",
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full bg-gray-200" aria-hidden />
        </div>

        {presence.content}
      </div>
    </div>
  );
}
