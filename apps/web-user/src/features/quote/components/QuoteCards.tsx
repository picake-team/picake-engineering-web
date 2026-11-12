"use client";

import { useState } from "react";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Icon } from "@/apps/web-user/common/components/icons";
import { cn } from "@/apps/web-user/common/lib/utils";
import type { ConsumerQuote } from "@/apps/web-user/features/quote/types/quote.type";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 금액 줄: 1개면 "58,000원", 2개 이상이면 "1개 25,000원 × 10개 = 250,000원"(SC-18 5) */
export function quotePriceText(q: Pick<ConsumerQuote, "unitPrice" | "quantity" | "total">): string {
  return q.quantity > 1
    ? `1개 ${won(q.unitPrice)} × ${q.quantity}개 = ${won(q.total)}`
    : won(q.total);
}

/** 견적 카드(SC-18 3~13). 먼저 온 견적이 위 */
export function QuoteCard({
  quote,
  closed,
  onChoose,
  onChat,
}: {
  quote: ConsumerQuote;
  /** 고를 수 없는 견적(다른 견적을 골랐고 다시 고르기 기간이 지남, 마감) */
  closed: boolean;
  onChoose: () => void;
  onChat: () => void;
}) {
  const [viewer, setViewer] = useState<string | null>(null);
  return (
    <article
      className={cn(
        "rounded-xl border bg-white px-[16px] py-[14px]",
        quote.chosen ? "border-primary" : "border-gray-100",
        closed && !quote.chosen && "opacity-60",
      )}
    >
      <div className="mb-[8px] flex items-center gap-[6px]">
        <span className="truncate text-sm font-bold text-gray-900">{quote.storeName}</span>
        {/* 입점 가게는 주황 "Picake", 입점 전 가게는 회색 "미입점"(지도 표시와 같은 모양) */}
        <span
          className={cn(
            "shrink-0 rounded-[4px] px-[6px] py-[2px] text-2xs font-bold",
            quote.isPicakeStore ? "bg-primary-50 text-primary" : "bg-gray-50 text-gray-500",
          )}
        >
          {quote.isPicakeStore ? "Picake" : "미입점"}
        </span>
        {quote.unseen && <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-primary" />}
        {quote.chosen && (
          <span className="ml-auto shrink-0 text-xs font-bold text-primary">고른 가게</span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-[6px]">
        <span className="text-base font-bold text-gray-900">{quotePriceText(quote)}</span>
        {quote.edited && <span className="text-xs text-gray-400">고침</span>}
        <span className="text-sm font-bold text-primary">{quote.similarityLabel}</span>
      </div>
      <p className="mt-[2px] text-xs text-gray-500">{quote.similarityDetail}</p>
      {quote.priceMayVary && (
        <p className="mt-[2px] text-xs text-gray-500">디자인을 보고 달라질 수 있어요</p>
      )}

      {quote.memo && (
        <div className="relative mt-[10px] rounded-xl bg-gray-50 px-[12px] py-[10px]">
          <p className="mb-[2px] text-2xs font-bold text-gray-500">사장님 메모</p>
          <p className="whitespace-pre-wrap text-sm text-gray-900">{quote.memo}</p>
        </div>
      )}

      {quote.photoUrls.length > 0 && (
        <div className="mt-[10px] flex gap-[6px] overflow-auto">
          {quote.photoUrls.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setViewer(url)}
              aria-label="사진 크게 보기"
            >
              <img
                src={url}
                alt=""
                className="h-[72px] w-[72px] shrink-0 rounded-lg object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 고른 가게는 화면 아래 큰 "○○과 채팅하기" 하나로(운영자 11-12) */}
      {((quote.threadId && !quote.chosen) || quote.canChoose) && (
        <div className="mt-[12px] flex gap-[8px]">
          {quote.threadId && !quote.chosen && (
            <span className="w-1/2">
              <Button variant="outline" size="sm" className="w-full" onClick={onChat}>
                채팅으로 묻기
              </Button>
            </span>
          )}
          {quote.canChoose && (
            <span className={quote.threadId && !quote.chosen ? "w-1/2" : "w-full"}>
              {/* 카드마다 있어 진한 주황 대신 흰 버튼에 주황 글씨(진한 주황은 화면당 하나) */}
              <Button
                variant="outline"
                size="sm"
                className="w-full !text-primary"
                onClick={onChoose}
              >
                이 가게로 고르기
              </Button>
            </span>
          )}
        </div>
      )}

      {viewer && (
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
        >
          <img
            src={viewer}
            alt=""
            className="max-h-[80vh] max-w-[92vw] rounded-lg object-contain"
          />
          <span className="absolute right-[16px] top-[16px] text-white">
            <Icon name="close" width={24} height={24} />
          </span>
        </button>
      )}
    </article>
  );
}
