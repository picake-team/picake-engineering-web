"use client";

import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { usePresence } from "@/apps/web-user/common/hooks/usePresence";
import { usePageScrollLock } from "@/apps/web-user/common/hooks/usePageScrollLock";
import { useSheetDragToClose } from "@/apps/web-user/common/hooks/useSheetDragToClose";

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
  /** 화면 읽기용 창 이름(제목 줄이 없어서 따로 받는다) */
  ariaLabel?: string;
}

/**
 * 상단 drag handle만 노출되는 헤더리스 바텀시트.
 * 콘텐츠 영역(children)은 padding 없이 렌더되니 호출부에서 자유롭게 레이아웃 구성.
 *
 * - draggable=true(기본): 시트 어디서든 아래로 끌면 시트가 따라 내려가고 뒤 어두운 면이 옅어진다. 많이 끌었거나
 *   빠르게 내리면 닫고, 아니면 제자리로(두 앱 공용 sheetGesture, `useSheetDragToClose`).
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
  ariaLabel,
}: DragHandleBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 바텀시트 열릴 때 뒤 화면 스크롤 방지
  usePageScrollLock(isOpen);

  useSheetDragToClose({ open: isOpen, enabled: draggable, sheetRef, scrimRef, onClose });

  // 닫힐 때도 내려가는 움직임이 끝날 때까지 그린다(그동안 내용은 마지막으로 열려 있던 때 그대로)
  const presence = usePresence(isOpen, SHEET_EXIT_MS, children);
  if (!presence.present) return null;
  const { leaving } = presence;

  return (
    <div
      className={clsx("fixed inset-0", leaving && "pointer-events-none", zIndexClassName ?? "z-50")}
    >
      {/* 뒤 어두운 면(창과 따로 두어 끄는 동안 이것만 옅어진다). 누르면 닫힘 */}
      <div
        ref={scrimRef}
        aria-hidden
        onClick={onClose}
        className={clsx(
          "absolute inset-0 bg-black/50",
          leaving ? "animate-scrim-out" : "animate-scrim-in motion-reduce:animate-fade-in",
        )}
      />
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
