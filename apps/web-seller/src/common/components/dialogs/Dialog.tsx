import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useInMobileFrame } from "@/apps/web-seller/common/components/layouts/mobile-frame.context";
import { useSheetDrag } from "@/apps/web-seller/common/ui/useSheetDrag";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** 제목 아래 한 줄 설명 */
  description?: React.ReactNode;
  /** 아래 고정 영역 (버튼) */
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: "md" | "lg";
}

/**
 * 가벼운 팝업 창. Esc·바깥 클릭으로 닫히고, 열려 있는 동안 뒤 화면은 스크롤되지 않는다.
 * 휴대폰에서는 아래에서 올라오는 시트처럼 화면을 꽉 채운다.
 * 휴대폰 틀(MobileFrame) 안에서는 판매자 앱 창 모양(손잡이, 제목 18/700, 모서리 22, 안전 영역)으로 그리고, 손잡이·제목 부분을 아래로 끌어 닫는다.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = "md",
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const inFrame = useInMobileFrame();
  const dragHandle = useSheetDrag({ panelRef, backdropRef, onClose, enabled: inFrame });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        ref={backdropRef}
        className={cn("absolute inset-0", inFrame ? "bg-[rgba(31,31,30,0.4)]" : "bg-black/40")}
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-background shadow-xl outline-none sm:rounded-2xl",
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl",
          inFrame &&
            "max-h-[92dvh] max-w-[640px] rounded-t-sheet font-app text-ink-900 shadow-none",
        )}
      >
        {inFrame ? (
          <div className="px-5 pt-3" {...dragHandle}>
            <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-ink-200" aria-hidden />
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 pt-2">
                <h2 id={titleId} className="text-heading font-bold text-ink-900">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sub text-ink-600">{description}</p>}
              </div>
              <button
                type="button"
                aria-label="닫기"
                className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-700 active:bg-ink-50"
                onClick={onClose}
              >
                <X className="h-6 w-6" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 border-b px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              aria-label="닫기"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={cn("flex-1 overflow-y-auto px-5", inFrame ? "pb-4 pt-3" : "py-4")}>
          {children}
        </div>
        {footer && (
          <div
            className={cn(
              "border-t px-5 py-3",
              inFrame && "border-ink-100 pb-[max(12px,env(safe-area-inset-bottom))]",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
