"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/apps/web-user/common/components/icons";
import { usePresence } from "@/apps/web-user/common/hooks/usePresence";
import { usePageScrollLock } from "@/apps/web-user/common/hooks/usePageScrollLock";
import { useSheetDragToClose } from "@/apps/web-user/common/hooks/useSheetDragToClose";

/**
 * 닫힐 때 내려가는 시간(공용 움직임 값 sheet-out = medium).
 * 창을 열릴 때만 그리는 곳(`{open && <창 />}`)은 `usePresence(open, BOTTOM_SHEET_EXIT_MS, …)`로 이만큼 더 그려 둔다
 */
export const BOTTOM_SHEET_EXIT_MS = 250;

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** 최대 높이 (기본값: "80%") */
  maxHeight?: string;
  /** 오버레이·시트 스택 순서 (기본 z-50) */
  zIndexClassName?: string;
  /** Footer 영역 그림자 표시 여부 (기본값: true) */
  footerShadow?: boolean;
  /** 화면을 가득 채우고 상단 radius 제거 (페이지처럼 노출) */
  fullScreen?: boolean;
  /** 이 값이 바뀔 때마다 콘텐츠 영역을 맨 위로 스크롤 */
  scrollResetKey?: string | number;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxHeight = "80%",
  zIndexClassName,
  footerShadow = true,
  fullScreen = false,
  scrollResetKey,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // 제목 아래 선은 내용을 내렸을 때만 그린다(운영자 고름 11-13: 선에 내용이 붙어 보이지 않게, 판매자 앱 창과 같은 모양)
  const [scrolled, setScrolled] = useState(false);

  // scrollResetKey 변경 시 콘텐츠 스크롤을 맨 위로 리셋
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    setScrolled(false);
  }, [scrollResetKey]);

  // 아래로 끌어내려 닫기: 내용이 맨 위일 때(또는 제목·아래 버튼 줄에서) 아래로 끌면 창이 따라 내려가고
  // 뒤 어두운 면이 옅어진다. 많이 끌었거나 빠르게 내리면 닫고, 아니면 제자리로(두 앱 공용 sheetGesture).
  // 바깥(어두운 면)을 누르면 닫힘
  useSheetDragToClose({ open: isOpen, sheetRef, scrimRef, contentRef, onClose });

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 바텀시트 열릴 때 뒤 화면 스크롤 방지
  usePageScrollLock(isOpen);

  // 닫힐 때도 내려가는 움직임이 끝날 때까지 그린다(그동안 내용은 마지막으로 열려 있던 때 그대로)
  const presence = usePresence(isOpen, BOTTOM_SHEET_EXIT_MS, { title, children, footer });
  if (!presence.present) return null;
  const { leaving } = presence;
  const shown = presence.content;

  return (
    <div
      className={clsx(
        "fixed mx-auto inset-0",
        leaving && "pointer-events-none",
        zIndexClassName ?? "z-50",
      )}
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
        aria-labelledby={titleId}
        className={clsx(
          "fixed bottom-0 left-0 right-0 max-w-[638px] mx-auto bg-white flex flex-col",
          leaving
            ? "animate-sheet-out motion-reduce:animate-fade-out"
            : "animate-sheet-in motion-reduce:animate-fade-in",
          fullScreen ? "top-0" : "rounded-t-3xl",
        )}
        style={fullScreen ? undefined : { maxHeight }}
      >
        {/* Header */}
        <div
          className={clsx(
            "relative",
            "border-b transition-colors duration-base",
            fullScreen ? "h-[52px]" : "h-[56px]",
            scrolled ? "border-gray-100" : "border-transparent",
          )}
        >
          <h2
            id={titleId}
            className={clsx(
              "flex items-center justify-center text-base font-bold text-center text-gray-900",
              fullScreen ? "h-[52px]" : "h-[56px]",
            )}
          >
            {shown.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute top-1/2 -translate-y-1/2 right-[20px] w-[24px] h-[24px] flex items-center justify-center"
          >
            <Icon name="close" width={24} height={24} className="text-gray-900" />
          </button>
        </div>

        {/* Content - 스크롤 가능 영역 */}
        <div
          ref={contentRef}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
          className={clsx(
            // 스크롤 막대는 숨긴다(화면 전체와 같음). 창이 열리며 맨 위로 돌릴 때 오른쪽에 짧은 회색 막대가 보였다
            "flex-1 overflow-y-auto overscroll-contain scrollbar-hide",
            !fullScreen && "pt-[4px]",
          )}
        >
          {shown.children}
        </div>

        {/* Footer - 고정 영역 */}
        {shown.footer && (
          <div
            className={clsx(
              "border-gray-100 bg-white",
              footerShadow ? "shadow-[0_12px_48px_-12px_rgba(0,0,0,0.16)]" : "shadow-none",
            )}
          >
            {shown.footer}
          </div>
        )}
      </div>
    </div>
  );
}
