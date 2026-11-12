"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Toast } from "@/apps/web-user/common/components/toast/Toast";
import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { navigateBack } from "@/apps/web-user/common/utils/navigate-back.util";
import { cn } from "@/apps/web-user/common/lib/utils";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { shrinkPhoto } from "@/apps/web-user/features/quote/utils/quote-photo.util";
import { OrderStatusBadge } from "@/apps/web-user/features/order/components/OrderStatusBadge";
import { chatApi } from "@/apps/web-user/features/chat/apis/chat.api";
import { useChatRoom } from "@/apps/web-user/features/chat/hooks/useChat";
import { CHAT_LIMITS, CHAT_NO_REPLAY } from "@/apps/web-user/features/chat/constants/chat.constant";
import {
  ChatMenuSheet,
  ChatReportSheet,
  ChatRulesSheet,
} from "@/apps/web-user/features/chat/components/ChatSheets";
import type { ChatCard, ChatMessage } from "@/apps/web-user/features/chat/types/chat.type";
import { ChatRoomSkeleton } from "@/apps/web-user/common/components/skeleton/ChatSkeleton";
import { LoadErrorState } from "@/apps/web-user/common/components/fallbacks/LoadErrorState";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

const SEOUL_PARTS = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

/** 날짜 줄 "11월 11일 (수)". 올해가 아니면 해를 붙인다("2025년 12월 24일 (수)") — 작년 글이 올해처럼 보이지 않게(사장님 앱과 같음) */
function dayLabel(iso: string): string {
  const get = (d: Date) => {
    const parts = SEOUL_PARTS.formatToParts(d);
    const v = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return { y: v("year"), m: v("month"), d: v("day"), w: v("weekday") };
  };
  const p = get(new Date(iso));
  const thisYear = get(new Date()).y;
  return `${p.y === thisYear ? "" : `${p.y}년 `}${p.m}월 ${p.d}일 (${p.w})`;
}

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** 채팅 사진. 못 불러오면(지워졌거나 주소가 깨짐) 깨진 그림 대신 회색 칸에 안내 */
function ChatPhoto({ url, onOpen }: { url: string; onOpen: (url: string) => void }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="flex h-[120px] w-[120px] items-center justify-center rounded-xl bg-gray-50 px-[8px] text-center text-xs text-gray-400">
        사진을 불러오지 못했어요
      </span>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(url)} aria-label="사진 크게 보기">
      <img
        src={url}
        alt=""
        onError={() => setBroken(true)}
        className="chat-photo h-[120px] w-[120px] rounded-xl object-cover"
      />
    </button>
  );
}

const QUOTE_CARD_TYPES: ChatCard["type"][] = ["QUOTE_REQUEST", "QUOTE", "QUOTE_CHOSEN"];

function CardView({ card, onOpen }: { card: ChatCard; onOpen?: () => void }) {
  const isQuote = QUOTE_CARD_TYPES.includes(card.type);
  // 손님 화면: 내 요청서 카드는 "견적 요청을 보냈어요"(서버 카드 제목은 가게 쪽 말)
  const title = card.type === "QUOTE_REQUEST" ? "견적 요청을 보냈어요" : card.title;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-[min(240px,calc(100vw-120px))] items-center gap-[10px] rounded-xl border border-gray-100 bg-white p-[10px] text-left"
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt=""
          className="h-[48px] w-[48px] shrink-0 rounded-lg object-cover"
        />
      ) : (
        // 사진이 없으면 빈 회색 칸 대신 Picake 로고(손님 견적 화면 요청서 칸과 같게)
        <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-lg bg-gray-50">
          <Icon name="logoPicake" width={26} height={26} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="truncate text-sm font-bold text-gray-900">{title}</span>
        {card.subtitle && <span className="truncate text-xs text-gray-500">{card.subtitle}</span>}
        {isQuote && (
          <span className="mt-[2px] text-xs font-bold text-primary">견적 자세히 보기 ›</span>
        )}
        {card.type === "ORDER" && card.orderStatus && (
          <span className="mt-[2px]">
            <OrderStatusBadge status={card.orderStatus} />
          </span>
        )}
        {card.type === "PRODUCT" && card.available === false && (
          <span className="text-xs text-gray-400">지금은 판매하지 않아요</span>
        )}
      </span>
    </button>
  );
}

function Bubble({
  m,
  readByOther,
  onOpenImage,
  onOpenCard,
}: {
  m: ChatMessage;
  readByOther: boolean;
  onOpenImage: (url: string) => void;
  onOpenCard: (card: ChatCard) => void;
}) {
  const meta = (
    <span className="shrink-0 self-end pb-[2px] text-[11px] text-gray-400">
      {m.mine && readByOther && <span className="mr-[3px] text-primary">읽음</span>}
      {timeLabel(m.createdAt)}
    </span>
  );
  let body: React.ReactNode;
  if (m.hidden) {
    body = (
      <div className="rounded-2xl bg-gray-50 px-[14px] py-[10px] text-sm text-gray-400">
        운영자가 가린 메시지예요
      </div>
    );
  } else if (m.card) {
    body = <CardView card={m.card} onOpen={() => onOpenCard(m.card as ChatCard)} />;
  } else {
    body = (
      <div className={cn("flex flex-col gap-[6px]", m.mine ? "items-end" : "items-start")}>
        {m.imageUrls.length > 0 && (
          <div
            className={cn(
              CHAT_NO_REPLAY,
              "flex max-w-[min(260px,calc(100vw-120px))] flex-wrap gap-[4px]",
              m.mine && "justify-end",
            )}
          >
            {m.imageUrls.map((url, i) => (
              // 같은 사진을 두 번 보내도 겹치지 않게 순서를 키에 넣는다
              <ChatPhoto key={`${i}-${url}`} url={url} onOpen={onOpenImage} />
            ))}
          </div>
        )}
        {m.text && (
          <div
            className={cn(
              CHAT_NO_REPLAY,
              "max-w-[min(260px,calc(100vw-120px))] select-text whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:keep-all] rounded-2xl px-[14px] py-[10px] text-sm",
              m.mine ? "bg-primary text-white" : "bg-gray-50 text-gray-900",
            )}
          >
            {m.text}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={cn("flex gap-[6px]", m.mine ? "flex-row-reverse" : "flex-row")}>
      {body}
      {meta}
    </div>
  );
}

/**
 * 채팅방(기획 I-11, 손님). threadId가 없으면 가게에 처음 보내기 — 첫 글을 보낼 때 방이 생긴다.
 * 말풍선은 버튼이 아니라서 길게 눌러 복사할 수 있다(글자 선택 막기는 버튼·링크에만).
 */
export function ChatRoomScreen({
  threadId,
  title: initialTitle,
  start,
  initialRulesAgreed,
  initialRulesVersion,
  initialWrite,
}: {
  threadId: string | null;
  title?: string;
  start?: { storeId: string; orderId?: string; productId?: string };
  initialRulesAgreed?: boolean;
  initialRulesVersion?: number;
  initialWrite?: { ok: boolean; message?: string | null };
}) {
  const router = useRouter();
  const { showAlert } = useAlertStore();
  // 짧은 안내(차단·신고·알림 끔·장수 제한)는 다른 손님 화면처럼 아래 알약(Toast), 실패만 확인 창
  const [toast, setToast] = useState<string | null>(null);
  const room = useChatRoom({
    threadId,
    start,
    onThreadCreated: (id) => router.replace(PATHS.CHAT.ROOM(id)),
  });
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState<boolean>(initialRulesAgreed ?? false);
  const [agreeing, setAgreeing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const [newBelow, setNewBelow] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // 입력칸은 글에 맞게 늘어난다(최대 높이까지, 그 뒤로는 칸 안에서 스크롤)
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [text]);

  const thread = room.thread;
  const title = thread?.title ?? initialTitle ?? "채팅";
  const write = thread?.write ?? initialWrite ?? { ok: true };
  // 방을 못 열었으면(없는 방·내 방이 아님·불러오기 실패) 입력칸·메뉴를 숨긴다
  const composerHidden = room.notFound || (!!room.error && room.messages.length === 0);
  const agreed = thread?.rulesAgreed ?? rulesAgreed;
  const storeId = thread?.storeId ?? start?.storeId ?? null;

  // 새 글: 맨 아래를 보고 있으면 내려가고, 위를 보는 중이면 "새 메시지 ↓"
  // 위로 올려 옛 글을 불러오는 것은 새 글이 아니라서 맨 아래 글·보내는 중인 글만 본다
  const tailKey = `${room.messages[room.messages.length - 1]?.id ?? ""}:${room.pending.length}`;
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setNewBelow(false);
    } else {
      setNewBelow(true);
    }
  }, [tailKey]);

  useEffect(() => {
    const el = listRef.current;
    if (el && !room.loading) el.scrollTop = el.scrollHeight;
  }, [room.loading]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottomRef.current) setNewBelow(false);
    if (el.scrollTop < 40 && room.hasMore && !room.loadingOlder) {
      const prevHeight = el.scrollHeight;
      void room.loadOlder().then(() => {
        requestAnimationFrame(() => {
          if (listRef.current)
            listRef.current.scrollTop = listRef.current.scrollHeight - prevHeight;
        });
      });
    }
  };

  const doSend = async () => {
    const body = text;
    const shots = photos;
    if (!body.trim() && shots.length === 0) return;
    if (body.length > CHAT_LIMITS.TEXT_MAX) {
      setToast(`글은 ${CHAT_LIMITS.TEXT_MAX.toLocaleString()}자까지 보낼 수 있어요`);
      return;
    }
    setText("");
    setPhotos([]);
    atBottomRef.current = true;
    const res = await room.send(body, shots);
    if (!res.ok && !res.retryable && res.message) {
      showAlert({ type: "error", title: "보내지 못했어요", message: res.message });
    }
  };

  const onSendClick = () => {
    if (!agreed) {
      setRulesOpen(true);
      return;
    }
    void doSend();
  };

  const onAgree = async () => {
    setAgreeing(true);
    try {
      await chatApi.agreeRules(thread?.rulesVersion ?? initialRulesVersion ?? 1);
      setRulesAgreed(true);
      if (room.thread) room.setThread({ ...room.thread, rulesAgreed: true });
      setRulesOpen(false);
      await doSend();
    } catch (e) {
      showAlert({ type: "error", title: "보내지 못했어요", message: getApiMessage.error(e) });
    } finally {
      setAgreeing(false);
    }
  };

  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room_ = CHAT_LIMITS.IMAGES_MAX - photos.length;
    const picked = Array.from(files).slice(0, room_);
    if (files.length > room_) {
      setToast(`사진은 한 번에 ${CHAT_LIMITS.IMAGES_MAX}장까지 보낼 수 있어요`);
    }
    const shrunk: string[] = [];
    for (const f of picked) {
      try {
        shrunk.push(await shrinkPhoto(f));
      } catch {
        // 못 읽은 사진은 건너뜀
      }
    }
    setPhotos((prev) => [...prev, ...shrunk].slice(0, CHAT_LIMITS.IMAGES_MAX));
    if (fileRef.current) fileRef.current.value = "";
  };

  const setFlag = async (flag: "mute" | "block", value: boolean) => {
    if (!threadId) return;
    try {
      const next = await chatApi.setFlag(threadId, flag, value);
      room.setThread(next);
      if (flag === "block")
        setToast(value ? "차단했어요. 더는 채팅할 수 없어요" : "차단을 풀었어요");
      else setToast(value ? "이 채팅 알림을 껐어요" : "이 채팅 알림을 켰어요");
    } catch (e) {
      showAlert({ type: "error", title: "바꾸지 못했어요", message: getApiMessage.error(e) });
    }
  };

  const onReport = async (
    reason: Parameters<typeof chatApi.report>[1]["reason"],
    detail: string,
  ) => {
    if (!threadId) return;
    setReporting(true);
    try {
      const res = await chatApi.report(threadId, {
        reason,
        ...(detail.trim() ? { detail: detail.trim() } : {}),
      });
      setReportOpen(false);
      setToast(res.message || "신고했어요. Picake가 24시간 안에 확인해요");
    } catch (e) {
      showAlert({ type: "error", title: "신고하지 못했어요", message: getApiMessage.error(e) });
    } finally {
      setReporting(false);
    }
  };

  const openCard = (card: ChatCard) => {
    if (card.type === "ORDER") router.push(PATHS.ORDER.DETAIL(card.refId));
    else if (QUOTE_CARD_TYPES.includes(card.type)) router.push(PATHS.QUOTE.DETAIL(card.refId));
    else router.push(PATHS.PRODUCT.DETAIL(card.refId));
  };

  const otherReadAt = thread?.otherReadAt ?? null;
  let lastMineId: string | null = null;
  for (const m of room.messages) if (m.mine) lastMineId = m.id;

  let prevDay = "";
  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <header className="flex h-[52px] shrink-0 items-center gap-[8px] border-b border-gray-50 bg-white px-[16px]">
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => navigateBack(router, { fallbackPath: PATHS.CHAT.LIST })}
        >
          <Icon name="chevronLeft" width={24} height={24} />
        </button>
        <h1 className="flex-1 truncate text-base font-bold text-gray-900">{title}</h1>
        {threadId && !composerHidden ? (
          <button
            type="button"
            aria-label="채팅 메뉴"
            onClick={() => setMenuOpen(true)}
            className="text-gray-700"
          >
            <Icon name="more" width={24} height={24} />
          </button>
        ) : (
          <span className="w-[24px]" />
        )}
      </header>

      {thread?.unenteredShop && (
        // 입점 전 가게(견적 링크로 대화): Picake 밖에서 주문·결제한다는 고지(기획 I-11, 법무 점검표 2번)
        <p className="shrink-0 bg-gray-50 px-[16px] py-[8px] text-xs text-gray-700">
          Picake는 대화를 이어 드려요. 주문과 결제는 가게와 직접 해요.
        </p>
      )}
      <div
        ref={listRef}
        onScroll={onScroll}
        className="relative flex-1 overflow-y-auto px-[16px] py-[12px]"
      >
        {/* 불러오는 동안 회색 뼈대, 못 불러오면 "다시 시도"(손님 앱 디자인 기준) */}
        {room.loadingOlder && (
          <div className="pb-[10px]">
            <ChatRoomSkeleton count={2} />
          </div>
        )}
        {room.loading ? (
          <ChatRoomSkeleton />
        ) : room.notFound ? (
          // 없는 방·내 방이 아님: 다시 시도해도 안 되니 "찾을 수 없어요"
          <EmptyState message="채팅을 찾을 수 없어요." fill />
        ) : room.error && room.messages.length === 0 ? (
          <LoadErrorState fill onRetry={() => void room.reload()} />
        ) : room.messages.length === 0 && room.pending.length === 0 ? (
          <p className="py-[40px] text-center text-sm text-gray-500">
            {title}에 궁금한 것을 물어보세요
          </p>
        ) : null}

        <div className="flex flex-col gap-[10px]">
          {room.messages.map((m) => {
            const day = dayLabel(m.createdAt);
            const showDay = day !== prevDay;
            prevDay = day;
            return (
              <div key={m.id} className="flex flex-col gap-[10px]">
                {showDay && <p className="py-[4px] text-center text-xs text-gray-400">{day}</p>}
                <Bubble
                  m={m}
                  readByOther={m.id === lastMineId && !!otherReadAt && otherReadAt >= m.createdAt}
                  onOpenImage={setViewer}
                  onOpenCard={openCard}
                />
              </div>
            );
          })}
          {room.pending.map((p) => (
            <div key={p.clientId} className="flex flex-col items-end gap-[4px]">
              {p.photos.length > 0 && (
                <div
                  className={cn(
                    CHAT_NO_REPLAY,
                    "flex max-w-[min(260px,calc(100vw-120px))] flex-wrap justify-end gap-[4px] opacity-70",
                  )}
                >
                  {p.photos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-[120px] w-[120px] rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
              {p.text.trim() && (
                <div
                  className={cn(
                    CHAT_NO_REPLAY,
                    "max-w-[min(260px,calc(100vw-120px))] whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:keep-all] rounded-2xl bg-primary px-[14px] py-[10px] text-sm text-white",
                    p.status === "sending" ? "opacity-70" : "opacity-50",
                  )}
                >
                  {p.text}
                </div>
              )}
              {p.status === "sending" ? (
                <span className="text-[11px] text-gray-400">보내는 중…</span>
              ) : (
                <span className="text-[11px] text-red-400">
                  보내지 못했어요 ·{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => room.retry(p.clientId)}
                  >
                    다시 보내기
                  </button>{" "}
                  ·{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => room.discard(p.clientId)}
                  >
                    지우기
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {newBelow && (
        <button
          type="button"
          onClick={() => {
            const el = listRef.current;
            if (el) el.scrollTop = el.scrollHeight;
            atBottomRef.current = true;
            setNewBelow(false);
          }}
          className="mx-auto -mt-[44px] mb-[8px] rounded-full bg-gray-900 px-[14px] py-[8px] text-xs font-bold text-white shadow"
        >
          새 메시지 ↓
        </button>
      )}

      {composerHidden ? null : write.ok ? (
        <div className="shrink-0 border-t border-gray-50 bg-white px-[12px] pb-[max(10px,env(safe-area-inset-bottom))] pt-[8px]">
          {photos.length > 0 && (
            <div className="mb-[8px] flex gap-[6px] overflow-x-auto">
              {photos.map((src, i) => (
                <div key={i} className={cn(CHAT_NO_REPLAY, "relative shrink-0")}>
                  <img src={src} alt="" className="h-[64px] w-[64px] rounded-lg object-cover" />
                  <button
                    type="button"
                    aria-label="사진 빼기"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-[6px] -top-[6px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-gray-900 text-xs text-white before:absolute before:-inset-[10px] before:content-['']"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-[8px]">
            <button
              type="button"
              aria-label="사진 보내기"
              onClick={() => fileRef.current?.click()}
              // 보내기 버튼과 같은 44 동그라미(회색 바탕) — 판매자 앱과 같은 모양(운영자 11-12)
              className="press flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-700"
            >
              <Icon name="plus" width={22} height={22} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => void onPickPhotos(e.target.files)}
            />
            <textarea
              ref={inputRef}
              value={text}
              onKeyDown={(e) => {
                // PC(마우스·키보드)에서는 Enter로 보내고 Shift+Enter로 줄바꿈. 휴대폰은 Enter가 줄바꿈, 한글 조합 중에는 보내지 않음
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing &&
                  window.matchMedia("(hover: hover) and (pointer: fine)").matches
                ) {
                  e.preventDefault();
                  if (text.trim() || photos.length) onSendClick();
                }
              }}
              onChange={(e) => setText(e.target.value)}
              placeholder="메시지 보내기"
              rows={1}
              maxLength={CHAT_LIMITS.TEXT_MAX}
              aria-label="메시지 보내기"
              className={cn(
                CHAT_NO_REPLAY,
                "max-h-[96px] min-h-[44px] flex-1 resize-none rounded-[22px] bg-gray-50 px-[16px] py-[11px] text-sm outline-none",
              )}
            />
            <button
              type="button"
              aria-label="보내기"
              disabled={!text.trim() && photos.length === 0}
              onClick={onSendClick}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              <Icon name="send" width={20} height={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-gray-50 bg-gray-50 px-[16px] py-[16px] text-center text-sm text-gray-500">
          {write.message ?? "지금은 메시지를 보낼 수 없어요."}
        </div>
      )}

      {viewer && (
        <button
          type="button"
          aria-label="사진 닫기"
          onClick={() => setViewer(null)}
          className={cn(
            CHAT_NO_REPLAY,
            "fixed inset-0 z-50 flex items-center justify-center bg-black/90",
          )}
        >
          <img src={viewer} alt="" className="max-h-full max-w-full object-contain" />
        </button>
      )}

      <ChatRulesSheet
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
        onAgree={() => void onAgree()}
        busy={agreeing}
      />
      {thread && (
        <ChatMenuSheet
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          muted={thread.muted}
          blocked={thread.blockedByMe}
          onOpenStore={storeId ? () => router.push(PATHS.STORE.DETAIL(storeId)) : undefined}
          onToggleMute={() => {
            setMenuOpen(false);
            void setFlag("mute", !thread.muted);
          }}
          onReport={() => {
            setMenuOpen(false);
            setReportOpen(true);
          }}
          onToggleBlock={() => {
            setMenuOpen(false);
            void setFlag("block", !thread.blockedByMe);
          }}
        />
      )}
      <ChatReportSheet
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason, detail) => void onReport(reason, detail)}
        busy={reporting}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
