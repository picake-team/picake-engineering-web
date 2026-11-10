/**
 * 아래에서 올라오는 창.
 * - 뒤 어둡게 rgba(31,31,30,0.4), 위 모서리 22, 손잡이 36 × 4, 안쪽 12·20·아래 안전 영역
 * - 제목 20/700. 버튼 둘이면 왼쪽 흰 보조("돌아가기") · 오른쪽 주황 주 버튼
 * - 내용이 길면 창 안에서 스크롤하고 버튼 줄은 아래에 둔다
 * - 뒤를 누르거나 Esc로, 손잡이·제목 부분을 아래로 끌어 닫는다(처리 중에는 닫지 않음). 열린 동안 화면 스크롤을 멈춘다
 * - 안드로이드 뒤로 버튼은 기본 동작만(I-48 "뒤로 가기" 결정)
 */
import React, { useEffect, useId, useRef } from "react";
import { useSheetDrag } from "@/apps/web-seller/common/ui/useSheetDrag";
import { createPortal } from "react-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { usePresence } from "@/apps/web-seller/common/ui/usePresence";

/** 닫힐 때 내려가는 시간(공용 움직임 값 sheet-out = medium) */
const SHEET_EXIT_MS = 250;

let openSheetCount = 0;
/** 열린 창 차례(창 위에 창을 열면 Esc·Tab은 맨 위 창만) */
const sheetStack: symbol[] = [];

function lockScroll() {
  openSheetCount += 1;
  if (openSheetCount === 1) {
    document.body.style.overflow = "hidden";
  }
}

function unlockScroll() {
  openSheetCount = Math.max(0, openSheetCount - 1);
  if (openSheetCount === 0) {
    document.body.style.overflow = "";
  }
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  showClose = false,
  dismissible = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** 제목 아래 설명(14 #686864) */
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** 아래 버튼 줄 */
  footer?: React.ReactNode;
  /** 제목 오른쪽 닫기(×). 확인 창은 "돌아가기" 버튼이 대신하므로 기본 없음 */
  showClose?: boolean;
  /** false면 뒤 누르기·Esc로 닫지 않음(처리 중) */
  dismissible?: boolean;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;
    // 끌어내려 닫히던 중에 다시 열리면 끌던 자리를 지운다
    for (const el of [panelRef.current, backdropRef.current]) {
      if (!el) continue;
      el.style.transition = "";
      el.style.transform = "";
      el.style.opacity = "";
    }
    restoreRef.current = document.activeElement as HTMLElement | null;
    const me = Symbol("sheet");
    sheetStack.push(me);
    lockScroll();
    // 첫 칸에 바로 키보드를 올리지 않게 창 자체에 초점
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (sheetStack[sheetStack.length - 1] !== me) return;
      if (e.key === "Escape" && dismissibleRef.current) {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      sheetStack.splice(sheetStack.indexOf(me), 1);
      unlockScroll();
      restoreRef.current?.focus?.();
    };
  }, [open]);

  const dragHandle = useSheetDrag({ panelRef, backdropRef, onClose, enabled: dismissible });

  // 닫힐 때도 내려가는 움직임이 끝날 때까지 그린다(그동안 내용은 마지막으로 열려 있던 때 그대로)
  const presence = usePresence(open, SHEET_EXIT_MS, { title, description, children, footer });
  if (!presence.present) return null;
  const { leaving } = presence;
  const shown = presence.content;

  return createPortal(
    <div
      className={cx(
        "fixed inset-0 z-50 flex flex-col justify-end font-app",
        leaving && "pointer-events-none",
      )}
    >
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={cx(
          "absolute inset-0 bg-[rgba(31,31,30,0.4)]",
          leaving ? "animate-scrim-out" : "animate-scrim-in",
        )}
        onClick={() => {
          if (dismissible) onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          "relative mx-auto flex max-h-[90dvh] w-full max-w-[640px] flex-col rounded-t-sheet bg-white text-ink-900 outline-none",
          leaving
            ? "animate-sheet-out motion-reduce:animate-fade-out"
            : "animate-sheet-in motion-reduce:animate-fade-in",
          className,
        )}
      >
        <div className="flex flex-col gap-4 px-5 pt-3" {...dragHandle}>
          <span aria-hidden="true" className="mx-auto mb-1 h-1 w-9 rounded-sm bg-ink-200" />
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-2">
              <h2 id={titleId} className="text-heading font-bold">
                {shown.title}
              </h2>
              {shown.description ? (
                <p className="text-sub text-ink-600">{shown.description}</p>
              ) : null}
            </div>
            {showClose ? (
              <button
                type="button"
                aria-label="닫기"
                onClick={onClose}
                className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-700 active:bg-ink-50"
              >
                <Icon name="close" size={24} strokeWidth={1.8} />
              </button>
            ) : null}
          </div>
        </div>
        {shown.children ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pt-4">
            {shown.children}
          </div>
        ) : null}
        <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5">{shown.footer}</div>
      </div>
    </div>,
    document.body,
  );
}
