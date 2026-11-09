"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/apps/web-user/common/components/icons";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { navigateBack } from "@/apps/web-user/common/utils/navigate-back.util";
import { cn } from "@/apps/web-user/common/lib/utils";
import { QUOTE_NO_REPLAY } from "@/apps/web-user/features/quote/constants/quote.constant";

/** 손님이 직접 쓴 글이라 화면 녹화에서 가리는 줄 */
const FREE_TEXT_ROWS = ["설명", "요청 사항"];
import {
  useCloseQuoteRequest,
  useQuoteRequestDetail,
} from "@/apps/web-user/features/quote/hooks/useQuoteRequests";
import { QuoteStatusBadge } from "@/apps/web-user/features/quote/components/QuoteRequestCard";
import { NoticeBox } from "@/apps/web-user/features/quote/components/form/QuoteFormParts";
import { QuoteLoginGate } from "@/apps/web-user/features/quote/components/QuoteLoginGate";

/**
 * 요청 상세(SC-18). 1단계 ①에서는 요청 내용과 "물어보는 중"을 보여 주고,
 * 견적 카드·고르기는 ②에서 붙는다. 이 주소는 카카오 알림톡 [견적 보기] 버튼에 고정돼 있다.
 */
function QuoteRequestDetailContent() {
  const router = useRouter();
  const { requestId } = useParams<{ requestId: string }>();
  const { data, isLoading, isError } = useQuoteRequestDetail(requestId ?? null);
  const close = useCloseQuoteRequest();
  const [formOpen, setFormOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const header = (
    <header className="sticky top-0 z-10 flex h-[52px] items-center bg-white px-[16px]">
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigateBack(router, { fallbackPath: PATHS.MY_QUOTES })}
      >
        <Icon name="chevronLeft" width={24} height={24} />
      </button>
      <span className="flex-1 text-center text-sm font-bold text-gray-900">견적 요청</span>
      <span className="w-[24px]" />
    </header>
  );

  if (isLoading)
    return (
      <div>
        {header}
        <p className="py-[40px] text-center text-sm text-gray-400">불러오는 중…</p>
      </div>
    );
  if (isError || !data) {
    return (
      <div>
        {header}
        <p className="py-[40px] text-center text-sm text-gray-500">견적 요청을 찾을 수 없어요.</p>
      </div>
    );
  }

  const open = data.status === "OPEN";
  const rows: [string, string | null][] = [
    ["픽업", data.summary.pickup],
    ["받을 동네", data.summary.area],
    ["케이크", data.summary.cake],
    ["예산", data.summary.budget],
    ["설명", data.description],
    ["요청 사항", data.requestNote],
    [
      "넣은 가게",
      data.stores.map((s) => `${s.name}${s.isPicakeStore ? "" : "(미입점)"}`).join(", ") || null,
    ],
  ];

  return (
    <div className="min-h-screen bg-white pb-[100px]">
      {header}
      <main className="px-[20px] pt-[16px]">
        <div className="mb-[24px] rounded-xl border border-gray-100 px-[16px] py-[12px]">
          <div className="flex gap-[12px]">
            <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-lg bg-gray-50">
              {data.photoUrls[0] ? (
                <img
                  src={data.photoUrls[0]}
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
              <div className="mb-[4px] flex items-center justify-between">
                <QuoteStatusBadge item={data} />
                <button
                  type="button"
                  className="text-xs text-gray-500 underline"
                  onClick={() => setFormOpen(true)}
                >
                  요청서 보기
                </button>
              </div>
              <p className="truncate text-sm font-bold text-gray-900">{data.summary.cake}</p>
              <p className="truncate text-xs text-gray-500">
                {data.summary.pickup} · {data.summary.area}
              </p>
              <p className="truncate text-xs text-gray-500">예산 {data.summary.budget}</p>
            </div>
          </div>
        </div>

        <div className="mb-[10px] flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">받은 견적 {data.quoteCount}</span>
          <span className="text-xs text-gray-500">견적 마감 {data.summary.deadline}</span>
        </div>
        {open ? (
          <div className="flex flex-col items-center gap-[16px] rounded-xl bg-gray-50 px-[20px] py-[32px]">
            <Icon name="noData" width={62} height={57} />
            <p className="text-center text-sm leading-[22px] text-gray-700">
              Picake가 근처 가게에 물어보고 있어요.
              <br />
              견적이 오면 알림으로 알려 드릴게요.
            </p>
          </div>
        ) : (
          <NoticeBox>
            {data.closeReason === "CONSUMER" ? "닫은 요청이에요." : "견적 받는 기간이 끝났어요."}
            {data.quoteCount === 0 && " 견적을 보낸 가게가 없었어요."}
          </NoticeBox>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-[638px] gap-[8px] bg-white px-[20px] pb-[12px] pt-[10px]">
        {open ? (
          <Button variant="outline" size="lg" className="w-full" onClick={() => setCloseOpen(true)}>
            요청 닫기
          </Button>
        ) : (
          <Link href={`${PATHS.QUOTE.NEW}?entry=MYPAGE`} className="w-full">
            <Button size="lg" className="w-full">
              새로 견적 받기
            </Button>
          </Link>
        )}
      </div>

      <BottomSheet isOpen={formOpen} onClose={() => setFormOpen(false)} title="요청서">
        <div className="px-[20px] pb-[24px]">
          {data.photoUrls.length > 0 && (
            <div className={cn("mb-[12px] flex gap-[6px] overflow-auto", QUOTE_NO_REPLAY)}>
              {data.photoUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="참고 사진"
                  className="h-[100px] w-[100px] shrink-0 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          {rows
            .filter((r): r is [string, string] => Boolean(r[1]))
            .map(([label, value]) => (
              <div
                key={label}
                className="flex gap-[12px] border-b border-gray-50 py-[12px] text-sm last:border-b-0"
              >
                <span className="w-[64px] shrink-0 text-gray-500">{label}</span>
                <span
                  className={cn(
                    "min-w-0 flex-1 whitespace-pre-wrap text-gray-900",
                    FREE_TEXT_ROWS.includes(label) && QUOTE_NO_REPLAY,
                  )}
                >
                  {value}
                </span>
              </div>
            ))}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="요청을 닫을까요?"
        footer={
          <div className="flex gap-[8px]">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setCloseOpen(false)}
            >
              그대로 두기
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={close.isPending}
              onClick={() =>
                close.mutate(data.id, {
                  onSuccess: () => setCloseOpen(false),
                })
              }
            >
              닫기
            </Button>
          </div>
        }
      >
        <p className="px-[20px] pb-[16px] text-center text-sm text-gray-700">
          닫으면 더 이상 견적을 받지 않아요. 되돌릴 수 없어요.
        </p>
      </BottomSheet>
    </div>
  );
}

export default function QuoteRequestDetailPage() {
  const router = useRouter();
  return (
    <QuoteLoginGate
      fallbackHeader={
        <header className="sticky top-0 z-10 flex h-[52px] items-center bg-white px-[16px]">
          <button
            type="button"
            aria-label="뒤로"
            onClick={() => navigateBack(router, { fallbackPath: PATHS.HOME })}
          >
            <Icon name="chevronLeft" width={24} height={24} />
          </button>
          <span className="flex-1 text-center text-sm font-bold text-gray-900">견적 요청</span>
          <span className="w-[24px]" />
        </header>
      }
    >
      <QuoteRequestDetailContent />
    </QuoteLoginGate>
  );
}
