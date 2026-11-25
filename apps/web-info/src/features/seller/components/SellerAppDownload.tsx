"use client";

import { useEffect, useId, useRef, useState } from "react";
import QrSellerApp from "@/apps/web-info/features/seller/assets/qr-seller-app.svg";
import { LineLink } from "@/apps/web-info/common/components/landing/Buttons";
import {
  SELLER_APP_DOWNLOAD_PATH,
  SELLER_PLAY_STORE_URL,
} from "@/apps/web-info/common/constants/app-download.constants";
import { PAPER, WRAP } from "@/apps/web-info/common/components/landing/landing.styles";

/**
 * 사장님 앱 받기 버튼(2026-11-25 Google Play 출시, 기획 I-48·I-49). 손님 소개 첫 화면의 앱 받기(`AppDownloadButtons`)와 같은 방식.
 * - 휴대폰: "앱 받기" 하나. `/seller/app`이 기기에 맞는 곳으로 보낸다(안드로이드 → Google Play, 아이폰 → 판매자 웹).
 * - PC: [Google Play] [QR] — QR 버튼을 누르면 QR 카드가 열린다(바깥을 누르거나 Esc로 닫힘). QR에도 `/seller/app`이 들어 있다.
 * App Store 앱이 아직 없어 아이폰 줄은 없다. App Store에 나오면 PC에 App Store 버튼을 더하고 "아이폰 앱은 준비 중" 글을 뺀다.
 */
export function SellerAppButtons({ cardSide }: { cardSide: "right" | "left" }) {
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

  // 첫 화면은 버튼 줄 오른쪽(손님 소개와 같음) — 다만 768~1023 폭은 오른쪽 자리가 모자라(카드 끝 860px) 버튼 줄 위로 연다.
  // 띠는 버튼 줄 왼쪽(띠가 화면 오른쪽 끝에 버튼을 둔다). 옆으로 열 때는 카드 높이 약 277px의 반만큼 위로 —
  // 움직임(popup-in)이 transform을 써서 위치는 margin으로
  const position =
    cardSide === "right"
      ? "right-0 bottom-[calc(100%+12px)] lg:right-auto lg:bottom-auto lg:top-1/2 lg:left-[calc(100%+14px)] lg:-mt-[138px]"
      : "top-1/2 right-[calc(100%+14px)] -mt-[138px]";

  return (
    <>
      <div className="w-full md:hidden">
        <LineLink href={SELLER_APP_DOWNLOAD_PATH}>앱 받기</LineLink>
      </div>
      <div ref={wrapRef} className="relative hidden items-center gap-2.5 md:flex">
        <LineLink href={SELLER_PLAY_STORE_URL} external>
          Google Play
        </LineLink>
        <button
          ref={buttonRef}
          type="button"
          aria-label="사장님 앱 받기 QR 코드 보기"
          aria-expanded={open}
          aria-controls={cardId}
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${open ? "ring-2 ring-primary" : ""}`}
        >
          <QrGlyph />
        </button>
        <div
          id={cardId}
          hidden={!open}
          className={`absolute ${position} z-20 w-[248px] rounded-[18px] bg-white p-6 text-gray-900 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.45)] data-[open=true]:animate-popup-in`}
          data-open={open}
        >
          {/* QR 둘레는 흰 여백 24px(약 4칸) — 카메라가 QR 끝을 찾게 */}
          <QrSellerApp
            role="img"
            aria-label="사장님 앱 받기 QR 코드"
            className="mx-auto block size-[168px]"
          />
          <p className="mt-4 text-center text-[15px] leading-[1.5] font-semibold">
            안드로이드 휴대폰 카메라로
            <br />
            찍으면 앱을 받을 수 있어요
          </p>
        </div>
      </div>
    </>
  );
}

/**
 * 사장님 앱 띠: 손님 소개의 "사장님이세요?" 띠와 같은 모양. 첫 화면 버튼과 같은 버튼에 앱을 쓰는 까닭(휴대폰 알림)을 붙인다.
 */
export function SellerAppBand({ id }: { id?: string }) {
  return (
    <section id={id} aria-labelledby="seller-app-title" className={`${PAPER} py-12 md:py-16`}>
      <div
        className={`${WRAP} flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8`}
      >
        <div>
          <p className="text-[14px] font-bold text-primary md:text-base">픽케이크 사장님 앱</p>
          <h2
            id="seller-app-title"
            className="mt-1 text-[22px] leading-[1.35] font-extrabold tracking-[-0.03em] text-gray-900 md:text-[28px]"
          >
            새 예약은 휴대폰 알림으로 바로
          </h2>
          <p className="mt-1.5 text-[15px] leading-[1.6] text-gray-700 md:text-[17px]">
            새 예약 신청·손님 입금·채팅이 오면 알려 드려요
          </p>
          <p className="mt-1 text-[14px] leading-[1.6] text-gray-500 md:text-[15px]">
            아이폰 앱은 준비 중이에요. 그동안은 휴대폰 브라우저에서 같은 화면을 써요
          </p>
        </div>
        <div className="flex w-full flex-col md:w-auto md:flex-row">
          <SellerAppButtons cardSide="left" />
        </div>
      </div>
    </section>
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
