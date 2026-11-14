"use client";

import type { QuotePhotoDetail } from "@/apps/web-user/features/quote/types/quote.type";
import { photoBadge } from "@/apps/web-user/features/design/utils/design-fill.util";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { BottomSheet } from "@/apps/web-user/common/components/bottom-sheets/BottomSheet";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { Icon } from "@/apps/web-user/common/components/icons";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import { LoadErrorState } from "@/apps/web-user/common/components/fallbacks/LoadErrorState";
import { Skeleton } from "@/apps/web-user/common/components/skeleton";
import { Tabs } from "@/apps/web-user/common/components/tabs/Tabs";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { CharCountHint } from "@/apps/web-user/common/components/textareas/TextArea";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { cn } from "@/apps/web-user/common/lib/utils";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { quoteLinkApi } from "@/apps/web-user/features/quote/apis/quote.api";
import {
  Field,
  NoticeBox,
  Pill,
} from "@/apps/web-user/features/quote/components/form/QuoteFormParts";
import {
  QUOTE_CONTACT_OPTIONS,
  QUOTE_NO_REPLAY,
} from "@/apps/web-user/features/quote/constants/quote.constant";
import { dataUrlToFile, shrinkPhoto } from "@/apps/web-user/features/quote/utils/quote-photo.util";
import type {
  QuoteContact,
  QuoteContactType,
  QuoteDeclineReason,
  QuoteLinkView,
  QuoteSimilarity,
} from "@/apps/web-user/features/quote/types/quote.type";
import { QuoteLinkChat } from "@/apps/web-user/features/quote/components/link/QuoteLinkChat";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";

const SIMILARITY: { value: QuoteSimilarity; label: string; detail: string }[] = [
  { value: "EXACT", label: "거의 똑같이", detail: "모양·색·글씨까지 사진대로 만들어요" },
  {
    value: "SIMILAR",
    label: "비슷하게",
    detail: "전체 모양과 색은 같고, 캐릭터 표정·장식은 가게 솜씨대로 만들어요",
  },
  {
    value: "INSPIRED",
    label: "느낌만 살려서",
    detail: "색과 분위기를 살려 가게 디자인으로 만들어요",
  },
];

const DECLINE: { value: QuoteDeclineReason; label: string }[] = [
  { value: "FULLY_BOOKED", label: "그날 주문이 꽉 찼어요" },
  { value: "NOT_OUR_STYLE", label: "이런 디자인은 만들지 않아요" },
  { value: "BUDGET", label: "예산으로는 어려워요" },
  { value: "OTHER", label: "다른 이유" },
];

const MEMO_MAX = 200;
const PHOTOS_MAX = 3;
/** 대화 탭 숫자(답할 손님 글)를 확인하는 간격(대화 칸과 같음) */
const CHAT_POLL_MS = 8000;

type TabId = "request" | "quote" | "chat";

type FormState = {
  price: string;
  similarity: QuoteSimilarity | null;
  memo: string;
  photos: string[];
  /** 고른 연락할 곳과 적은 값(고르지 않은 종류는 없음) */
  contacts: Partial<Record<QuoteContactType, string>>;
};

function initialForm(view: QuoteLinkView): FormState {
  const q = view.quote;
  const saved: QuoteContact[] = q?.contacts?.length ? q.contacts : (view.prefillContacts ?? []);
  return {
    price: q ? q.unitPrice.toLocaleString("ko-KR") : "",
    similarity: q?.similarity ?? null,
    memo: q?.memo ?? "",
    photos: q?.photoUrls ?? [],
    contacts: Object.fromEntries(saved.map((c) => [c.type, c.value])),
  };
}

const digits = (v: string) => Number(v.replace(/[^0-9]/g, "")) || 0;

/** 요청서 맨 위 작은 배지: 받는 중이면 마감까지 남은 때, 끝났으면 상태 */
function stateBadge(view: QuoteLinkView): { text: string; gray: boolean } {
  switch (view.state) {
    case "CHOSEN_ME":
      return { text: "손님이 골랐어요", gray: false };
    case "CHOSEN_OTHER":
      return { text: "다른 가게를 골랐어요", gray: true };
    case "CLOSED":
      return { text: "마감됐어요", gray: true };
    case "FULL":
      return { text: "견적이 다 모였어요", gray: true };
    case "DECLINED":
      return { text: "어려워요로 답했어요", gray: true };
    default: {
      const left = new Date(view.deadlineAt).getTime() - Date.now();
      if (left <= 0) return { text: "마감됐어요", gray: true };
      const hours = Math.floor(left / 3_600_000);
      if (hours < 1) {
        return { text: `마감까지 ${Math.max(1, Math.floor(left / 60_000))}분`, gray: false };
      }
      if (hours < 48) return { text: `마감까지 ${hours}시간`, gray: false };
      return { text: `${view.deadline}까지`, gray: false };
    }
  }
}

/** 견적을 보낼 수 없는 상태의 한 줄(요청서 탭 위·내 견적 탭) */
function stateNotice(view: QuoteLinkView): string | null {
  if (view.state === "CHOSEN_OTHER")
    return "손님이 다른 견적을 골랐어요. 견적을 보내 주셔서 고마워요.";
  if (view.state === "CLOSED") {
    return "이 요청은 마감됐어요. 다른 가게를 골랐거나 견적 받는 기간이 끝났어요.";
  }
  if (view.state === "FULL" && !view.quote) return "이 요청은 견적이 다 모였어요.";
  return null;
}

/** 이름 | 값 한 줄(요청서·보낸 견적). 판매자 앱 요청서 카드와 같은 모양 */
function InfoLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-[12px] py-[5px] text-sm">
      <span className="w-[48px] shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0 flex-1 font-semibold text-gray-900 [overflow-wrap:anywhere]">
        {children}
      </span>
    </div>
  );
}

/** 탭 안의 흰 카드(회색 바탕 위) */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl bg-white px-[16px] py-[16px]", className)}>
      {children}
    </section>
  );
}

/** 손님 사진: 첫 장은 크게, 나머지(2장까지)는 옆에 작게. 누르면 크게 본다 */
function RequestPhotos({
  urls,
  details,
  onOpen,
}: {
  urls: string[];
  details?: QuotePhotoDetail[];
  onOpen: (url: string) => void;
}) {
  if (urls.length === 0) return null;
  const [first, ...rest] = urls;
  // 사진이 여러 장이면 번호와 손님이 고른 "가져올 것"(기획 I-112)
  const badge = (i: number) => {
    const text = photoBadge(details, i, urls.length);
    return text ? (
      <span className="absolute left-[6px] top-[6px] rounded-full bg-white/90 px-[8px] py-[2px] text-2xs font-bold text-gray-900">
        {text}
      </span>
    ) : null;
  };
  return (
    <div className={cn("mt-[14px] flex h-[180px] gap-[6px]", QUOTE_NO_REPLAY)}>
      <button
        type="button"
        onClick={() => onOpen(first)}
        aria-label="사진 크게 보기"
        className="press relative min-w-0 flex-1 overflow-hidden rounded-xl bg-gray-50"
      >
        <img src={first} alt="참고 사진" className="h-full w-full object-cover" />
        {badge(0)}
      </button>
      {rest.length > 0 && (
        <div className="flex w-[88px] shrink-0 flex-col gap-[6px]">
          {rest.slice(0, 2).map((url, i) => (
            <button
              key={`${i}-${url}`}
              type="button"
              onClick={() => onOpen(url)}
              aria-label="사진 크게 보기"
              className="press relative min-h-0 flex-1 overflow-hidden rounded-xl bg-gray-50"
            >
              <img src={url} alt="참고 사진" className="h-full w-full object-cover" />
              {badge(i + 1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 손님 설명·요청 사항(길면 줄여 보이고 "더 보기") */
function RequestText({ view }: { view: QuoteLinkView }) {
  const [open, setOpen] = useState(false);
  if (!view.description && !view.requestNote) return null;
  const long = (view.description ?? "").length + (view.requestNote ?? "").length > 120;
  return (
    <div className={cn("mt-[10px] rounded-xl bg-gray-50 px-[12px] py-[10px]", QUOTE_NO_REPLAY)}>
      {view.description && (
        <p className={cn("whitespace-pre-wrap text-sm text-gray-900", !open && "line-clamp-4")}>
          {view.description}
        </p>
      )}
      {view.requestNote && (
        <p
          className={cn(
            "whitespace-pre-wrap text-sm text-gray-700",
            view.description && "mt-[6px]",
            !open && "line-clamp-2",
          )}
        >
          <span className="font-semibold text-gray-500">요청 사항 </span>
          {view.requestNote}
        </p>
      )}
      {!open && long && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          // 누르는 칸 40(글자는 그대로, 위아래 여백으로 넓힘)
          className="-mb-[10px] -mt-[6px] inline-block py-[10px] text-sm font-semibold text-gray-900 underline"
        >
          더 보기
        </button>
      )}
    </div>
  );
}

/**
 * 사장님 견적 링크(기획 I-46 SC-19). 가입 없이 금액·비슷한 정도(필요하면 사진·메모·연락할 곳)를 보낸다.
 * 위쪽 탭 셋(요청서 · 내 견적 · 대화)으로 나눠 섞이지 않게 한다(운영자 11-13, 시안 4번: 회색 바탕 흰 카드, 견적 칸 주황 테두리, 파란 안내).
 * 연락할 곳은 손님이 이 가게를 고른 뒤에만 손님에게 보인다(운영자 결정 11-13). 대화(Picake)는 늘 열려 있다.
 * 보낸 뒤에는 손님이 고르기 전까지 고칠 수 있고, 손님과 링크 안에서 대화한다(기획 I-11).
 */
export function QuoteLinkScreen({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const {
    data: view,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["quote-link", token],
    queryFn: () => quoteLinkApi.view(token),
    enabled: !!token,
    retry: false,
  });
  // 대화 탭 숫자: 사장님이 아직 답하지 않은 손님 글(대화 칸과 같은 목록을 함께 씀)
  const { data: chat } = useQuery({
    queryKey: ["quote-link-chat", token],
    queryFn: () => quoteLinkApi.messages(token),
    refetchInterval: CHAT_POLL_MS,
    enabled: !!view?.threadId,
  });
  const [tab, setTab] = useState<TabId | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // 보낸 뒤 한 줄 안내(판매자 앱 견적 보내기와 같은 말)
  const [toast, setToast] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // 사장님이 링크를 엶(한 번)
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!view || viewedRef.current) return;
    viewedRef.current = true;
    trackEvent("view_quote_link", { quote_request_id: view.requestId, state: view.state });
  }, [view]);

  useEffect(() => {
    if (view && !form) setForm(initialForm(view));
  }, [view, form]);

  // 처음 열 때: 손님이 이 가게를 골랐으면 대화부터, 아니면 요청서부터
  useEffect(() => {
    if (view && tab === null) setTab(view.state === "CHOSEN_ME" ? "chat" : "request");
  }, [view, tab]);

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["quote-link", token] });
  }, [queryClient, token]);

  const header = (
    <header className="sticky top-0 z-10 flex h-[52px] items-center gap-[8px] border-b border-gray-50 bg-white px-[16px]">
      <Icon name="logoPicake" width={28} height={28} />
      <span className="text-sm font-bold text-gray-900">손님 견적 요청</span>
    </header>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {header}
        {/* 다른 화면과 같은 회색 뼈대(탭 줄 + 요청서 카드) */}
        <div className="h-[44px] border-b border-gray-100 bg-white" />
        <div className="flex flex-col gap-[12px] px-[16px] pt-[16px]">
          <Skeleton className="h-[340px] rounded-2xl" />
          <Skeleton className="h-[100px] rounded-2xl" />
        </div>
      </div>
    );
  }
  if (isError || !view || !form) {
    return (
      <div className="min-h-screen bg-white">
        {header}
        {/* 없는 링크(404)는 다시 해도 같아서 "다시 시도" 없이, 인터넷 끊김·서버 오류만 다른 화면과 같은 "다시 시도" */}
        {isAxiosError(error) && error.response?.status === 404 ? (
          <EmptyState
            message="견적 링크를 찾을 수 없어요. 받은 메시지의 링크를 다시 확인해 주세요."
            fill
          />
        ) : isError ? (
          <LoadErrorState fill onRetry={() => void refetch()} />
        ) : (
          <EmptyState message="견적 링크를 찾을 수 없어요." fill />
        )}
      </div>
    );
  }

  const activeTab: TabId = tab ?? "request";
  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));
  // 버튼으로 다른 탭에 보낼 때는 맨 위(탭 줄)부터 보이게
  const goTo = (next: TabId) => {
    setTab(next);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };
  const openEditor = () => {
    setForm(initialForm(view));
    setFormError(null);
    setEditing(true);
    goTo("quote");
  };
  const price = digits(form.price);
  // 어려워요로 답한 뒤에도 "견적 보내기로 바꾸기"를 누르면 칸이 열린다
  const showForm =
    view.canEdit && (!view.quote || editing) && (view.state !== "DECLINED" || editing);
  const showDeclined = view.state === "DECLINED" && !editing;
  const notice = stateNotice(view);
  const badge = stateBadge(view);
  const sentContacts = view.quote?.contacts ?? [];
  // 마지막 사장님 글 뒤에 온 손님 글 수(카드 제외)
  const waiting = (() => {
    const lines = (chat?.messages ?? []).filter((m) => !m.card);
    let n = 0;
    for (let i = lines.length - 1; i >= 0 && !lines[i].mine; i--) n++;
    return n;
  })();

  const toggleContact = (type: QuoteContactType) => {
    const next = { ...form.contacts };
    if (next[type] === undefined) next[type] = "";
    else delete next[type];
    set({ contacts: next });
  };

  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room = PHOTOS_MAX - form.photos.length;
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      try {
        const shrunk = await shrinkPhoto(f);
        urls.push(
          await quoteLinkApi.uploadPhoto(token, dataUrlToFile(shrunk, `quote-${Date.now()}.jpg`)),
        );
      } catch (e) {
        setFormError(getApiMessage.error(e));
      }
    }
    set({ photos: [...form.photos, ...urls].slice(0, PHOTOS_MAX) });
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async () => {
    setFormError(null);
    if (price < 1000) return setFormError("금액을 적어 주세요.");
    if (!form.similarity) return setFormError("사진과 얼마나 비슷하게 만들 수 있는지 골라 주세요.");
    const contacts = QUOTE_CONTACT_OPTIONS.filter((o) => form.contacts[o.type] !== undefined).map(
      (o) => ({ type: o.type, value: (form.contacts[o.type] ?? "").trim() }),
    );
    const empty = QUOTE_CONTACT_OPTIONS.find(
      (o) => form.contacts[o.type] !== undefined && !form.contacts[o.type]?.trim(),
    );
    if (empty) {
      return setFormError(
        empty.type === "PHONE"
          ? "전화번호를 적어 주세요."
          : `${empty.label} ${empty.type === "INSTAGRAM" ? "아이디" : "주소"}를 적어 주세요.`,
      );
    }
    setSending(true);
    try {
      await quoteLinkApi.submit(token, {
        unitPrice: price,
        similarity: form.similarity,
        ...(form.memo.trim() ? { memo: form.memo.trim() } : {}),
        photoUrls: form.photos,
        contacts,
      });
      trackEvent("success_quote_link_submit", {
        quote_request_id: view.requestId,
        edited: !!view.quote,
        similarity: form.similarity,
        photo_count: form.photos.length,
        contact_count: contacts.length,
      });
      setToast(view.quote ? "고친 견적을 보냈어요" : "견적을 보냈어요");
      setEditing(false);
      await reload();
    } catch (e) {
      setFormError(getApiMessage.error(e));
      // 그사이 손님이 닫았거나 다른 가게를 골랐을 수 있어 화면 상태를 다시 읽는다
      void reload();
    } finally {
      setSending(false);
    }
  };

  const onDecline = async (reason: QuoteDeclineReason) => {
    setDeclining(true);
    try {
      await quoteLinkApi.decline(token, reason);
      trackEvent("success_quote_link_decline", { quote_request_id: view.requestId, reason });
      setDeclineOpen(false);
      setToast("어려워요로 답했어요");
      await reload();
    } catch (e) {
      setDeclineOpen(false);
      setFormError(getApiMessage.error(e));
      void reload();
    } finally {
      setDeclining(false);
    }
  };

  // ── 요청서 탭 ──
  const requestTab = (
    <div className="flex flex-col gap-[12px]">
      {notice && <NoticeBox>{notice}</NoticeBox>}
      <Card className="py-[18px]">
        {/* 누구에게 온 요청인지(가게 이름)와 어떤 케이크인지(제목)를 맨 위에(운영자 11-13) */}
        <div className="flex items-center gap-[8px]">
          <span className="min-w-0 flex-1 truncate text-sm text-gray-500">
            {view.storeName} 사장님께
          </span>
          <span
            className={cn(
              "inline-flex h-[22px] shrink-0 items-center rounded-full px-[8px] text-xs font-bold",
              badge.gray ? "bg-gray-50 text-gray-600" : "bg-primary-50 text-primary",
            )}
          >
            {badge.text}
          </span>
        </div>
        <h1 className="mt-[8px] text-xl font-bold leading-[28px] text-gray-900 [overflow-wrap:anywhere]">
          {view.cake}
        </h1>
        <p className="mt-[4px] text-base font-bold text-gray-900">{view.pickup} 픽업</p>
        <p className="mt-[2px] text-base font-bold text-primary">예산 {view.budget}</p>
        <RequestPhotos urls={view.photoUrls} details={view.photoDetails} onOpen={setViewer} />
        {view.contentHidden && (
          // 처리방침 보유 기간: 끝난 요청의 손님 글·사진은 서버가 보내지 않는다
          <p className="mt-[10px] rounded-xl bg-gray-50 px-[12px] py-[10px] text-sm text-gray-500">
            끝난 요청이라 손님이 쓴 내용과 사진은 보이지 않아요
          </p>
        )}
        <RequestText view={view} />
      </Card>
      {(view.area || view.customer) && (
        <Card className={cn("py-[12px]", view.customer && QUOTE_NO_REPLAY)}>
          {view.area && <InfoLine label="동네">{view.area} 근처</InfoLine>}
          {view.customer && (
            <>
              <InfoLine label="손님">{view.customer.name}</InfoLine>
              <InfoLine label="휴대폰">
                <a href={`tel:${view.customer.phone.replace(/[^0-9]/g, "")}`} className="underline">
                  {view.customer.phone}
                </a>
              </InfoLine>
              <p className="mt-[6px] text-xs text-gray-500">
                견적·주문 상담에만 써 주세요.{" "}
                {view.state === "CHOSEN_ME"
                  ? "픽업 다음 날까지 보여요."
                  : "손님이 다른 가게를 고르거나 요청이 끝나면 보이지 않아요."}
              </p>
            </>
          )}
        </Card>
      )}
    </div>
  );

  // ── 내 견적 탭 ──
  const quoteTab = (
    <div className="flex flex-col gap-[12px]">
      {/* 어느 요청의 견적인지 한 줄 */}
      <Card className="flex items-center gap-[12px] py-[12px]">
        <div className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-lg bg-gray-50">
          {view.photoUrls[0] ? (
            <img
              src={view.photoUrls[0]}
              alt=""
              className={cn("h-full w-full object-cover", QUOTE_NO_REPLAY)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon name="logoPicake" width={24} height={24} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{view.cake}</p>
          <p className="truncate text-xs text-gray-500">
            {view.pickup} 픽업 · 예산 {view.budget}
          </p>
        </div>
      </Card>

      {!view.quote && !showForm && !showDeclined && notice && <NoticeBox>{notice}</NoticeBox>}

      {showDeclined && (
        <Card className="flex flex-col gap-[10px]">
          <NoticeBox>
            어려워요로 답했어요({DECLINE.find((d) => d.value === view.declineReason)?.label ?? ""}
            ). 손님에게는 한 줄로 보여요.
          </NoticeBox>
          {view.canEdit && (
            <Button variant="outline" size="md" onClick={openEditor}>
              견적 보내기로 바꾸기
            </Button>
          )}
        </Card>
      )}

      {view.quote && !editing && (
        <Card>
          <div className="flex items-baseline justify-between gap-[8px]">
            <p className="text-base font-bold text-gray-900">보낸 견적</p>
            <p className="text-xl font-bold text-gray-900">
              {view.quote.total.toLocaleString("ko-KR")}원
            </p>
          </div>
          {view.quote.quantity > 1 && (
            <p className="text-right text-xs text-gray-500">
              1개 {view.quote.unitPrice.toLocaleString("ko-KR")}원 × {view.quote.quantity}개
            </p>
          )}
          <div className="mt-[6px]">
            <InfoLine label="디자인">{view.quote.similarityLabel}</InfoLine>
            {view.quote.memo && (
              <InfoLine label="메모">
                <span className="whitespace-pre-wrap font-normal">{view.quote.memo}</span>
              </InfoLine>
            )}
            <InfoLine label="연락처">
              {sentContacts.length > 0
                ? sentContacts.map((c) => c.label).join(" · ")
                : "이 화면 대화만"}
            </InfoLine>
          </div>
          {view.quote.photoUrls.length > 0 && (
            <div className="mt-[6px] flex gap-[6px]">
              {view.quote.photoUrls.map((url, i) => (
                <img
                  key={`${i}-${url}`}
                  src={url}
                  alt=""
                  className="h-[56px] w-[56px] rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          {sentContacts.length > 0 && (
            <p className="mt-[6px] text-xs text-gray-500">
              {view.state === "CHOSEN_ME"
                ? "연락처는 손님에게 보여요."
                : "연락처는 손님이 이 가게를 고르면 보여요."}
            </p>
          )}
          {view.canEdit && (
            <Button variant="outline" size="md" className="mt-[12px] w-full" onClick={openEditor}>
              견적 고치기
            </Button>
          )}
        </Card>
      )}

      {showForm && (
        <>
          {/* 쓸 칸은 주황 테두리로 묶는다(운영자 11-13 시안에서 고름) */}
          <section className="rounded-2xl border-[1.5px] border-primary bg-white px-[16px] pb-[2px] pt-[18px]">
            <p className="mb-[16px] text-base font-bold text-gray-900">
              {view.quote ? "견적 고치기" : "견적 보내기"}
            </p>
            <Field label={view.quantity > 1 ? "1개 금액" : "금액"}>
              <div className="flex items-center gap-[8px]">
                <input
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => {
                    const n = digits(e.target.value);
                    set({ price: n ? n.toLocaleString("ko-KR") : "" });
                  }}
                  placeholder="58,000"
                  aria-label="금액"
                  className="h-[48px] min-w-0 flex-1 rounded-xl border border-gray-100 px-[14px] text-right text-base text-gray-900 outline-none focus:border-gray-900"
                />
                <span className="text-sm text-gray-900">원</span>
              </div>
              {view.quantity > 1 && price > 0 && (
                <p className="mt-[6px] text-right text-xs text-gray-500">
                  {view.quantity}개 합계 {(price * view.quantity).toLocaleString("ko-KR")}원
                </p>
              )}
            </Field>

            <Field
              label="사진과 얼마나 비슷하게 만들 수 있나요?"
              caption={SIMILARITY.find((s) => s.value === form.similarity)?.detail}
            >
              <div className="flex flex-wrap gap-[8px]">
                {SIMILARITY.map((s) => (
                  <Pill
                    key={s.value}
                    selected={form.similarity === s.value}
                    onClick={() => set({ similarity: s.value })}
                  >
                    {s.label}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field label="비슷하게 만든 케이크 사진" optional={`선택 · ${PHOTOS_MAX}장까지`}>
              <div className="flex gap-[8px]">
                {form.photos.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-[72px] w-[72px] rounded-lg object-cover" />
                    <button
                      type="button"
                      aria-label="사진 빼기"
                      onClick={() => set({ photos: form.photos.filter((p) => p !== url) })}
                      className="absolute -right-[6px] -top-[6px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-gray-900 text-white"
                    >
                      <Icon name="close" width={12} height={12} />
                    </button>
                  </div>
                ))}
                {form.photos.length < PHOTOS_MAX && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-lg border border-gray-100 text-gray-400"
                    aria-label="사진 넣기"
                  >
                    <Icon name="plus" width={20} height={20} />
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => void onPickPhotos(e.target.files)}
                />
              </div>
            </Field>
            <Field label="메모" optional="선택 · 고를 수 있는 맛, 포함 사항 등">
              <textarea
                value={form.memo}
                maxLength={MEMO_MAX}
                onChange={(e) => set({ memo: e.target.value })}
                rows={3}
                aria-label="메모"
                className="w-full resize-none rounded-xl border border-gray-100 px-[14px] py-[12px] text-sm text-gray-900 outline-none focus:border-gray-900"
              />
              <CharCountHint length={form.memo.length} maxLength={MEMO_MAX} />
            </Field>
            <Field
              label="손님이 연락할 곳"
              optional="선택"
              caption="이 화면 대화는 늘 열려 있어요. 고른 곳은 손님이 이 가게를 고른 뒤에 보여요."
            >
              <div className="flex flex-wrap gap-[8px]">
                {QUOTE_CONTACT_OPTIONS.map((o) => (
                  <Pill
                    key={o.type}
                    selected={form.contacts[o.type] !== undefined}
                    onClick={() => toggleContact(o.type)}
                  >
                    {o.label}
                  </Pill>
                ))}
              </div>
              {QUOTE_CONTACT_OPTIONS.some((o) => form.contacts[o.type] !== undefined) && (
                <div className="mt-[10px] flex flex-col gap-[8px]">
                  {QUOTE_CONTACT_OPTIONS.filter((o) => form.contacts[o.type] !== undefined).map(
                    (o) => (
                      <label
                        key={o.type}
                        className="flex h-[48px] items-center gap-[10px] rounded-xl border border-gray-100 px-[14px] focus-within:border-gray-900"
                      >
                        <span className="w-[52px] shrink-0 text-sm text-gray-500">{o.short}</span>
                        <input
                          value={form.contacts[o.type] ?? ""}
                          onChange={(e) =>
                            set({ contacts: { ...form.contacts, [o.type]: e.target.value } })
                          }
                          inputMode={o.inputMode}
                          placeholder={o.placeholder}
                          aria-label={o.label}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          maxLength={200}
                          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                        />
                      </label>
                    ),
                  )}
                </div>
              )}
            </Field>
          </section>
          {/* 다른 안내와 같은 파란 안내 상자(운영자 11-13) */}
          <NoticeBox tone="blue">
            보내면 손님에게 가게 이름·견적·메모가 보여요. 손님이 고르면 대화 탭에서 주문을 정해요.
          </NoticeBox>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
        </>
      )}

      {view.showEntryGuide && view.quote && !editing && (
        <Card>
          <p className="text-sm font-bold text-gray-900">다음부터는 Picake로 바로 받아 보세요</p>
          <p className="mt-[4px] text-xs leading-[18px] text-gray-700">
            근처 손님 요청에 견적만 보내면 돼요.{" "}
            {/* 초기 입점 혜택 약속 문장(기획 P-60 그대로, 바꾸지 않음) */}
            처음 상품 등록은 저희가 대신 해 드리고, 이용료·수수료는 0원이에요.
          </p>
          {/* 다른 사이트라 next/link가 아니라 a(소개 페이지는 info로 리다이렉트) */}
          <a
            href={PATHS.PARTNER_ABOUT}
            className="-mb-[10px] mt-[-2px] inline-block py-[10px] text-sm font-bold text-gray-900"
          >
            입점 알아보기 ›
          </a>
        </Card>
      )}
    </div>
  );

  // ── 대화 탭 ──
  const chatTab = (
    <div className="flex flex-col gap-[12px]">
      {view.state === "CHOSEN_ME" && (
        <NoticeBox tone="blue">
          손님이 사장님 견적을 골랐어요. 이 대화에서 디자인·픽업·입금을 정해 주세요.
        </NoticeBox>
      )}
      {view.threadId ? (
        <QuoteLinkChat
          token={token}
          open={view.chatOpen}
          requestId={view.requestId}
          contactShared={!!view.customer}
          // 같은 손님이 이 가게에 다시 요청하면 지난 대화가 보이는데, 이 요청에 견적을 보내기 전에는 쓸 수 없다
          closedMessage={
            !view.quote && view.canEdit ? "견적을 보내면 손님과 대화할 수 있어요." : undefined
          }
        />
      ) : (
        <Card className="py-[32px] text-center text-sm text-gray-500">
          견적을 보내면 손님과 대화할 수 있어요.
        </Card>
      )}
    </div>
  );

  // 아래 고정 버튼: 요청서 탭은 "어려워요 / 견적 쓰기", 내 견적 탭은 칸이 열렸을 때 "보내기"
  const startBar =
    activeTab === "request" && view.canEdit && !view.quote && view.state !== "DECLINED";
  const formBar = activeTab === "quote" && showForm;

  return (
    <div className={cn("min-h-screen bg-gray-50", startBar || formBar ? "pb-[96px]" : "pb-[24px]")}>
      {header}
      <div ref={topRef} className="scroll-mt-[52px]" />
      <Tabs
        tabs={[
          { id: "request", label: "요청서", content: requestTab },
          { id: "quote", label: "내 견적", content: quoteTab },
          {
            id: "chat",
            label: "대화",
            content: chatTab,
            badge: activeTab === "chat" ? 0 : waiting,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setTab(id as TabId)}
        scrollOnSelect
        contentClassName="bg-gray-50 px-[16px] pb-[24px] pt-[16px]"
      />

      {(startBar || formBar) && (
        <div className="fixed bottom-0 left-0 right-0 z-10 mx-auto flex max-w-[638px] gap-[8px] bg-white px-[20px] pb-[12px] pt-[10px]">
          {!view.quote && !editing ? (
            <span className="w-1/3">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setDeclineOpen(true)}
              >
                어려워요
              </Button>
            </span>
          ) : (
            <span className="w-1/3">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => {
                  setEditing(false);
                  setFormError(null);
                }}
              >
                취소
              </Button>
            </span>
          )}
          <span className="flex-1">
            {startBar ? (
              <Button size="lg" className="w-full" onClick={() => goTo("quote")}>
                견적 쓰기
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                loading={sending}
                onClick={() => void onSubmit()}
              >
                {sending ? "보내는 중…" : view.quote ? "고친 견적 보내기" : "이 견적 보내기"}
              </Button>
            )}
          </span>
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
        </button>
      )}

      {toast && (
        <Toast
          message={toast}
          iconName="checkCircle"
          iconClassName="text-green-400"
          onClose={() => setToast(null)}
        />
      )}

      <BottomSheet
        isOpen={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="어려운 이유를 골라 주세요"
      >
        <div className="flex flex-col px-[20px] pb-[20px]">
          {DECLINE.map((d) => (
            <button
              key={d.value}
              type="button"
              disabled={declining}
              onClick={() => void onDecline(d.value)}
              className="border-b border-gray-50 py-[14px] text-left text-sm text-gray-900 last:border-b-0"
            >
              {d.label}
            </button>
          ))}
          <p className="mt-[8px] text-xs text-gray-500">
            손님에게는 &ldquo;이번 요청은 어렵대요&rdquo;로만 보여요.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
