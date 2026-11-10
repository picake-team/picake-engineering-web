"use client";

import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { cn } from "@/apps/web-user/common/lib/utils";
import { QUOTE_NO_REPLAY } from "@/apps/web-user/features/quote/constants/quote.constant";
import type { QuoteRequestListItem } from "@/apps/web-user/features/quote/types/quote.type";

/** 카드 위 작은 표시(SC-17 2): 진행 중은 주황, 지난 요청은 회색 */
export function quoteStatusLabel(item: QuoteRequestListItem): { text: string; active: boolean } {
  if (item.status === "OPEN") {
    return item.quoteCount > 0
      ? { text: `견적 ${item.quoteCount}개`, active: true }
      : { text: "물어보는 중", active: true };
  }
  if (item.status === "CONNECTED") return { text: "가게 연결", active: true };
  return { text: "마감", active: false };
}

export function QuoteStatusBadge({ item }: { item: QuoteRequestListItem }) {
  const { text, active } = quoteStatusLabel(item);
  return (
    <span
      className={cn(
        "rounded-[4px] px-[6px] py-[2px] text-2xs font-bold",
        active ? "bg-primary-50 text-primary" : "bg-gray-50 text-gray-500",
      )}
    >
      {text}
    </span>
  );
}

/** 내 견적 요청 카드: 참고 사진, 케이크, 픽업·동네·예산 */
export function QuoteRequestCard({ item }: { item: QuoteRequestListItem }) {
  return (
    <Link
      href={PATHS.QUOTE.DETAIL(item.id)}
      className="press flex gap-[12px] rounded-xl border border-gray-100 bg-white px-[16px] py-[12px]"
    >
      <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-lg bg-gray-50">
        {item.thumbnailUrl ? (
          // 참고 사진(손님이 올린 사진)
          <img
            src={item.thumbnailUrl}
            alt="참고 사진"
            className={cn("h-full w-full object-cover", QUOTE_NO_REPLAY)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon name="logoPicake" width={32} height={32} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[4px] flex items-center gap-[6px]">
          <QuoteStatusBadge item={item} />
        </div>
        <p className="truncate text-sm font-bold text-gray-900">{item.summary.cake}</p>
        <p className="truncate text-xs text-gray-500">
          {item.summary.pickup} · {item.summary.area}
        </p>
        <p className="truncate text-xs text-gray-500">예산 {item.summary.budget}</p>
      </div>
    </Link>
  );
}
