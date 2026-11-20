"use client";

import { useEffect, useId, useRef, useState } from "react";
import QrAppDownload from "@/apps/web-info/features/customer/assets/qr-app-download.svg";
import { PrimaryLink } from "@/apps/web-info/common/components/landing/Buttons";
import {
  APP_DOWNLOAD_URL,
  APP_STORE_URL,
  PLAY_STORE_URL,
} from "@/apps/web-info/common/constants/app-download.constants";

/**
 * 손님 소개 첫 화면의 앱 받기(2026-11-20 운영자: "QR이 바로 보이지 말고 배달의민족처럼 버튼으로").
 * - 휴대폰: "앱 받기" 하나. 손님 웹 `/app`이 기기에 맞는 스토어로 보낸다(QR은 휴대폰에서 쓸 일이 없다).
 * - PC: [App Store] [Google Play] [QR] 버튼. QR 버튼을 누르면 그 아래에 QR 카드가 열린다(바깥을 누르거나 Esc로 닫힘).
 * 스토어 상표 그림(배지)은 쓰지 않고 글자 버튼으로 둔다.
 */
export function AppDownloadButtons({ id }: { id?: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 흰 버튼 바탕(가로 여백은 따로: 글자 버튼 px-6, QR 버튼은 정사각형)
  const store =
    "inline-flex h-14 items-center justify-center rounded-[14px] bg-white text-[16px] font-bold text-gray-900 transition-transform duration-fast active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <>
      <div className="w-full md:hidden">
        <PrimaryLink id={id} href={APP_DOWNLOAD_URL}>
          앱 받기
        </PrimaryLink>
      </div>
      <div ref={wrapRef} className="relative hidden items-center gap-2.5 md:flex">
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${store} px-6`}
        >
          App Store
        </a>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${store} px-6`}
        >
          Google Play
        </a>
        <button
          ref={buttonRef}
          type="button"
          aria-label="앱 받기 QR 코드 보기"
          aria-expanded={open}
          aria-controls={cardId}
          onClick={() => setOpen((v) => !v)}
          className={`${store} w-14 shrink-0 ${open ? "ring-2 ring-primary" : ""}`}
        >
          <QrGlyph />
        </button>
        <div
          id={cardId}
          role="dialog"
          aria-label="앱 받기 QR 코드"
          hidden={!open}
          className="absolute top-[calc(100%+12px)] left-0 z-20 w-[248px] rounded-[18px] bg-white p-4 text-gray-900 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.45)] data-[open=true]:animate-popup-in"
          data-open={open}
        >
          <QrAppDownload aria-hidden className="mx-auto block size-[168px]" />
          <p className="mt-3 text-center text-[15px] leading-[1.5] font-semibold">
            휴대폰 카메라로 찍으면
            <br />
            앱을 받을 수 있어요
          </p>
        </div>
      </div>
    </>
  );
}

/** QR 버튼 모양(세 모서리 네모). 뜻은 버튼의 aria-label이 전한다 */
function QrGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h1M20 14h1" strokeLinecap="round" />
    </svg>
  );
}
