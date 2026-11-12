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
  useChooseQuote,
  useCloseQuoteRequest,
  useQuoteRequestDetail,
  useQuoteSection,
} from "@/apps/web-user/features/quote/hooks/useQuoteRequests";
import {
  QuoteCard,
  QuoteContactList,
  quotePriceText,
} from "@/apps/web-user/features/quote/components/QuoteCards";
import type { ConsumerQuote } from "@/apps/web-user/features/quote/types/quote.type";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { withEulReul, withRo, withWaGwa } from "@/apps/web-user/common/utils/josa.util";

/** "11월 13일 오후 3시" */
function kstShort(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "numeric",
  }).format(new Date(iso));
}
import { QuoteStatusBadge } from "@/apps/web-user/features/quote/components/QuoteRequestCard";
import { NoticeBox } from "@/apps/web-user/features/quote/components/form/QuoteFormParts";
import { QuoteLoginGate } from "@/apps/web-user/features/quote/components/QuoteLoginGate";

/**
 * 요청 상세·견적 고르기(SC-18, 기획 I-46 ②). 가게 견적 카드(먼저 온 것이 위), 어려워요 한 줄,
 * 이 가게로 고르기 → 그 가게와의 채팅. 이 주소는 카카오 알림톡 [견적 보기] 버튼에 고정돼 있다.
 */
function QuoteRequestDetailContent() {
  const router = useRouter();
  const { requestId } = useParams<{ requestId: string }>();
  const { data, isLoading, isError } = useQuoteRequestDetail(requestId ?? null);
  const { data: section } = useQuoteSection(requestId ?? null);
  const close = useCloseQuoteRequest();
  const choose = useChooseQuote();
  const { showAlert } = useAlertStore();
  const [formOpen, setFormOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [picking, setPicking] = useState<ConsumerQuote | null>(null);

  const goChat = (threadId: string | null) => {
    if (threadId) router.push(PATHS.CHAT.ROOM(threadId));
  };
  const onConfirmChoose = () => {
    if (!picking || !data) return;
    choose.mutate(
      { requestId: data.id, quoteId: picking.id },
      {
        onSuccess: (res) => {
          setPicking(null);
          goChat(res.threadId);
        },
        onError: (e) => {
          setPicking(null);
          showAlert({ type: "error", title: "고르지 못했어요", message: getApiMessage.error(e) });
        },
      },
    );
  };

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
  const quotes = section?.quotes ?? [];
  const chosen = quotes.find((q) => q.chosen) ?? null;
  const rechooseOpen =
    !!section?.rechooseUntil && new Date(section.rechooseUntil).getTime() > Date.now();
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

        {chosen && (
          <div className="mb-[24px] rounded-xl border border-gray-100 px-[16px] py-[14px]">
            <p className="text-sm font-bold text-gray-900">
              {withEulReul(chosen.storeName)} 골랐어요
            </p>
            <p className="mt-[2px] text-xs text-gray-500">
              {quotePriceText(chosen)} · {chosen.similarityLabel}
            </p>
            {chosen.contacts.length > 0 && (
              <div className="-mx-[16px] mt-[8px]">
                <QuoteContactList contacts={chosen.contacts} />
              </div>
            )}
            <div className="mt-[8px]">
              <NoticeBox>
                {/* 통신판매중개자 고지(법무 점검표 2번) */}
                Picake는 가게를 이어 드려요. 주문과 결제는 가게와 직접 해요.
                {rechooseOpen && section?.rechooseUntil
                  ? ` 다른 견적은 ${kstShort(section.rechooseUntil)}까지 다시 고를 수 있어요.`
                  : ""}
              </NoticeBox>
            </div>
          </div>
        )}

        <div className="mb-[10px] flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">받은 견적 {quotes.length}</span>
          <span className="text-xs text-gray-500">견적 마감 {data.summary.deadline}까지</span>
        </div>
        {(section?.askedCount ?? 0) > 0 && open && (
          <p className="-mt-[4px] mb-[10px] text-xs text-gray-500">
            Picake가 {section?.askedCount}곳에 물어봤어요
          </p>
        )}
        {quotes.length > 0 && (
          <div className="mb-[16px] flex flex-col gap-[10px]">
            {quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                closed={!q.canChoose && !q.chosen}
                onChoose={() => setPicking(q)}
                onChat={() => goChat(q.threadId)}
              />
            ))}
          </div>
        )}
        {(section?.declined.length ?? 0) > 0 && (
          <ul className="mb-[16px] flex flex-col gap-[6px]">
            {section?.declined.map((d) => (
              <li key={d.targetId} className="text-xs text-gray-500">
                {d.storeName} · 이번 요청은 어렵대요
              </li>
            ))}
          </ul>
        )}
        {quotes.length > 0 ? null : open ? (
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
            {data.status === "CONNECTED"
              ? "가게를 골랐어요."
              : data.closeReason === "CONSUMER"
                ? "닫은 요청이에요."
                : data.closeReason === "ADMIN"
                  ? "Picake가 마감한 요청이에요."
                  : "견적 받는 기간이 끝났어요."}
            {data.quoteCount === 0 && " 견적을 보낸 가게가 없었어요."}
          </NoticeBox>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-[638px] gap-[8px] bg-white px-[20px] pb-[12px] pt-[10px]">
        {chosen ? (
          <Button size="lg" className="w-full" onClick={() => goChat(chosen.threadId)}>
            {withWaGwa(chosen.storeName)} 채팅하기
          </Button>
        ) : open ? (
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
        isOpen={!!picking}
        onClose={() => setPicking(null)}
        title={picking ? `${withRo(picking.storeName)} 고를까요?` : ""}
        footer={
          <div className="flex gap-2 px-5 py-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setPicking(null)}>
              취소
            </Button>
            <Button
              size="lg"
              className="flex-1"
              loading={choose.isPending}
              onClick={onConfirmChoose}
            >
              {choose.isPending ? "고르는 중…" : "고르기"}
            </Button>
          </div>
        }
      >
        {picking && (
          <div className="px-[20px] pb-[16px] text-center">
            <p className="text-sm font-bold text-gray-900">
              {quotePriceText(picking)} · {picking.similarityLabel}
            </p>
            <p className="mt-[8px] text-sm leading-[22px] text-gray-700">
              고르면 그 가게와 채팅으로 이어져요. 24시간 안에는 다른 견적으로 바꿀 수 있어요.
              <br />
              주문과 결제는 가게와 직접 해요.
            </p>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="요청을 닫을까요?"
        footer={
          <div className="flex gap-2 px-5 py-3">
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
              loading={close.isPending}
              onClick={() =>
                close.mutate(data.id, {
                  onSuccess: () => setCloseOpen(false),
                })
              }
            >
              {close.isPending ? "닫는 중…" : "닫기"}
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
