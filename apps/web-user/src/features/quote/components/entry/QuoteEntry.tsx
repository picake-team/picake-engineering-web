"use client";

import Link from "next/link";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { cn } from "@/apps/web-user/common/lib/utils";
import type { QuoteRequestEntry } from "@/apps/web-user/features/quote/types/quote.type";

/**
 * 견적 요청 입구(기획 I-46 SC-12·13).
 * 배너 모양 칸(홈 카드, 검색·가게 상세 아래 칸)은 크림 바탕·초콜릿 버튼(운영자 결정 2026-11-09),
 * 버튼만 있는 곳(지도)은 손님 앱의 다른 버튼과 같은 주황이다.
 */
const CREAM = "#FFF6DF";
const CHOCOLATE = "#5C3D2E";
const EYEBROW = "#B7791F";

/** 카드 사진: 지금 홈 배너(MK-13)와 같은 Unsplash 사진. 운영자가 고르면 바꾼다 */
const QUOTE_CARD_PHOTOS = ["/images/quote/cake-lettering.jpg", "/images/quote/cake-bento.jpg"];

/** 요청서 주소. 가게 화면·지도에서 들어오면 그 가게를 넣고, "이 가게에만"이면 only=1 */
export function buildQuoteNewHref(
  entry: QuoteRequestEntry,
  extra: Record<string, string | number | undefined | null> = {},
): string {
  const params = new URLSearchParams({ entry });
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  return `${PATHS.QUOTE.NEW}?${params}`;
}

function TiltedPhotos({ size }: { size: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size * 1.55, height: size * 1.1 }}>
      {QUOTE_CARD_PHOTOS.slice(0, 2).map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          className="absolute rounded-[10px] border-2 border-white object-cover shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          style={{
            width: size,
            height: size,
            top: i === 0 ? 0 : size * 0.1,
            left: i === 0 ? 0 : size * 0.55,
            transform: `rotate(${i === 0 ? -6 : 7}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/** 홈 카테고리 아래 사진 카드(SC-12). 항상 같은 자리에 보인다 */
export function QuoteHomeCard() {
  return (
    <Link
      href={buildQuoteNewHref("HOME")}
      className="flex items-center justify-between gap-[12px] overflow-hidden rounded-2xl px-[20px] py-[20px]"
      style={{ background: CREAM, minHeight: 155 }}
    >
      <div className="min-w-0">
        <p className="mb-[4px] text-xs font-bold" style={{ color: EYEBROW }}>
          원하는 디자인 그대로
        </p>
        <p className="mb-[14px] text-base font-bold leading-[22px] text-gray-900">
          사진만 올리면
          <br />
          근처 가게 견적이 와요
        </p>
        <span
          className="inline-flex h-[36px] items-center rounded-full px-[16px] text-sm font-bold text-white"
          style={{ background: CHOCOLATE }}
        >
          견적 받기
        </span>
      </div>
      <TiltedPhotos size={78} />
    </Link>
  );
}

/** 검색 결과·가게 상세 아래에 붙여 두는 칸(SC-13 1·3). 높이 약 76px, 양옆·아래 12px */
export function QuoteStickyBar({
  eyebrow,
  title,
  href,
  onClick,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <div
      className="flex h-[76px] items-center gap-[10px] rounded-2xl px-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
      style={{ background: CREAM }}
    >
      <TiltedPhotos size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-2xs font-bold" style={{ color: EYEBROW }}>
          {eyebrow}
        </p>
        <p className="truncate text-sm font-bold text-gray-900">{title}</p>
      </div>
      <span
        className="inline-flex h-[34px] shrink-0 items-center rounded-full px-[14px] text-sm font-bold text-white"
        style={{ background: CHOCOLATE }}
      >
        견적 받기
      </span>
    </div>
  );
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[640px] px-[12px] pb-[calc(12px+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto">
        {href ? (
          <Link href={href}>{body}</Link>
        ) : (
          <button type="button" className="w-full text-left" onClick={onClick}>
            {body}
          </button>
        )}
      </div>
    </div>
  );
}

/** 가게 상세·지도에서 요청서를 열기 전에 묻는 창(SC-14 11) */
export function QuoteAskSheet({
  isOpen,
  onClose,
  storeName,
  isUnlisted,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  isUnlisted: boolean;
  onSelect: (only: boolean) => void;
}) {
  const option = (only: boolean, title: string, desc: string) => (
    <button
      type="button"
      onClick={() => onSelect(only)}
      className={cn(
        "flex w-full flex-col items-start gap-[2px] rounded-xl border border-gray-100 px-[16px] py-[14px] text-left",
      )}
    >
      <span className="text-sm font-bold text-gray-900">{title}</span>
      <span className="text-xs text-gray-500">{desc}</span>
    </button>
  );
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="어디에 물어볼까요?">
      <div className="flex flex-col gap-[8px] px-[20px] pb-[24px] pt-[4px]">
        <p className="mb-[8px] text-center text-sm text-gray-500">
          이 가게에만 물을 수도, 다른 가게와 비교할 수도 있어요
        </p>
        {option(
          true,
          `${storeName}에만 물어보기`,
          isUnlisted
            ? "이 가게 견적만 받아요 · 입점 전 가게라 답이 없을 수도 있어요"
            : "이 가게 견적만 받아요",
        )}
        {option(false, "다른 가게에도 물어보기", "원하는 동네의 다른 가게 견적도 받아 비교해요")}
      </div>
    </BottomSheet>
  );
}
