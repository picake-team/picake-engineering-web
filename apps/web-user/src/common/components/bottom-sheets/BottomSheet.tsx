"use client";

import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/apps/web-user/common/components/icons";

/** 아래로 끌어내려 닫히는 최소 거리(px) */
const CLOSE_THRESHOLD_PX = 100;

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
  const contentRef = useRef<HTMLDivElement>(null);

  // scrollResetKey 변경 시 콘텐츠 스크롤을 맨 위로 리셋
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [scrollResetKey]);

  // 아래로 끌어내려 닫기: 콘텐츠가 맨 위일 때(또는 헤더/푸터에서) 아래로 드래그하면 시트가 따라 내려가고,
  // 임계값 이상이면 닫힘. 그 외에는 원래 위치로 스냅백.
  useEffect(() => {
    const sheet = sheetRef.current;
    const content = contentRef.current;
    if (!isOpen || !sheet || !content) return;

    let startY = 0;
    let dragging = false;
    let delta = 0;

    const setTransform = (y: number, animate: boolean) => {
      sheet.style.transition = animate ? "transform 0.2s ease-out" : "none";
      sheet.style.transform = y ? `translateY(${y}px)` : "";
    };

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      dragging = false;
      delta = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;
      if (!dragging) {
        const target = e.target as Node;
        const inContent = content.contains(target);
        // 콘텐츠 안에서는 최상단이고 아래로 당길 때만 드래그 시작
        if (dy <= 0 || (inContent && content.scrollTop > 0)) return;
        dragging = true;
        startY = e.touches[0].clientY;
        return;
      }
      delta = Math.max(0, dy);
      // 드래그 중에는 브라우저 기본 스크롤/pull-to-refresh 방지
      if (e.cancelable) e.preventDefault();
      setTransform(delta, false);
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      if (delta > CLOSE_THRESHOLD_PX) {
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
  }, [isOpen, onClose]);

  // 바깥 영역 클릭 시 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

  // 바텀시트 열릴 때 스크롤 방지
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

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        "fixed mx-auto inset-0 bg-black/50 transition-opacity",
        zIndexClassName ?? "z-50",
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={clsx(
          "fixed bottom-0 left-0 right-0 max-w-[638px] mx-auto bg-white flex flex-col animate-slide-up",
          fullScreen ? "top-0" : "rounded-t-3xl",
        )}
        style={fullScreen ? undefined : { maxHeight }}
      >
        {/* Header */}
        <div
          className={clsx(
            "relative",
            fullScreen ? "h-[52px]" : "h-[64px] border-b border-gray-100",
          )}
        >
          <h2
            className={clsx(
              "flex items-center justify-center text-base font-bold text-center text-gray-900",
              fullScreen ? "h-[52px]" : "h-[64px]",
            )}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-1/2 -translate-y-1/2 right-[20px] w-[24px] h-[24px] flex items-center justify-center"
          >
            <Icon name="close" width={24} height={24} className="text-gray-900" />
          </button>
        </div>

        {/* Content - 스크롤 가능 영역 */}
        <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Footer - 고정 영역 */}
        {footer && (
          <div
            className={clsx(
              "border-gray-100 bg-white",
              footerShadow ? "shadow-[0_12px_48px_-12px_rgba(0,0,0,0.16)]" : "shadow-none",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
