"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

interface FeatureSheetProps {
  /** 창 제목(기능 이름). 화면 읽기 프로그램도 이 이름으로 읽는다 */
  title: string;
  children: ReactNode;
}

/**
 * 기능 카드의 "자세히" → 아래에서 올라오는 창.
 * 카드는 두 줄로 짧게 두고, 왜 좋은지(설명 3~4줄과 화면)는 여기서 보여 준다.
 * `<dialog>`라 Esc로 닫히고, 열린 동안 뒤 화면은 눌리지 않으며, 닫으면 "자세히" 버튼으로 포커스가 돌아온다.
 * 바깥(어두운 곳)을 누르면 닫힌다. 내용은 처음부터 HTML에 있어 검색·AI도 읽는다.
 */
export function FeatureSheet({ title, children }: FeatureSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className="mt-2 -ml-1 rounded-md px-1 py-1 text-[14px] font-semibold text-white/85 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        자세히 ›
      </button>
      <dialog
        ref={dialogRef}
        aria-label={title}
        onClick={closeOnBackdrop}
        className="mx-auto mt-auto mb-0 max-h-[88dvh] w-full max-w-[640px] overflow-y-auto rounded-t-[24px] bg-white p-0 text-gray-900 backdrop:bg-black/55 open:animate-sheet-in motion-reduce:open:animate-none"
      >
        <div className="pb-[calc(28px+env(safe-area-inset-bottom))]">
          {/* 제목·닫기는 창 안을 내려도 위에 남는다(2026-11-17 검토: 내리면 닫기 버튼이 사라졌다) */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 rounded-t-[24px] bg-white px-5 pt-5 pb-2">
            <h3 className="text-[22px] leading-[1.35] font-bold tracking-[-0.03em]">{title}</h3>
            <button
              type="button"
              aria-label="닫기"
              onClick={() => dialogRef.current?.close()}
              className="-mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-[26px] leading-none text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900"
            >
              ×
            </button>
          </div>
          <div className="mt-1 px-5">{children}</div>
        </div>
      </dialog>
    </>
  );
}
