import { useSnackbarStore } from "@/apps/web-seller/common/store/snackbar.store";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { BackHeader, APP_COLUMN_CLASS } from "@/apps/web-seller/common/ui/Screen";
import { Button, ButtonPair, HeaderIconButton } from "@/apps/web-seller/common/ui/Button";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { ListRowButton } from "@/apps/web-seller/common/ui/List";
import { Field, TextArea } from "@/apps/web-seller/common/ui/Field";
import { EmptyState, LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { ImageLightbox } from "@/apps/web-seller/common/components/images/ImageLightbox";
import { formatKstMonthDayWeek, kstTime } from "@/apps/web-seller/common/utils/kst-date.util";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { canGoBackInApp } from "@/apps/web-seller/common/hooks/useLeaveAfterSave";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import { chatApi } from "@/apps/web-seller/features/chat/apis/chat.api";
import { shrinkPhoto, useSellerChatRoom } from "@/apps/web-seller/features/chat/hooks/useChat";
import { QuoteRequestPanel } from "@/apps/web-seller/features/quote/components/QuoteRequestPanel";
import {
  CHAT_LIMITS,
  CHAT_NO_REPLAY,
  CHAT_REPORT_REASONS,
  CHAT_RULES_LINES,
  CHAT_RULES_VERSION,
} from "@/apps/web-seller/features/chat/constants/chat.constants";
import type {
  ChatCard,
  ChatMessage,
  ChatReportReason,
  ChatWriteState,
} from "@/apps/web-seller/features/chat/types/chat.type";

// 날짜는 "11월 12일(목)"(올해가 아니면 해), 시각은 24시 "20:05" — 판매자 앱 디자인 기준(kst-date.util)
const dayLabel = (iso: string) => formatKstMonthDayWeek(iso);
const timeLabel = (iso: string) => kstTime(iso);

/** 불러오는 동안 말풍선 모양 회색 뼈대(디자인 기준: "불러오는 중…" 글자 대신 뼈대) */
function RoomSkeleton({ count = 6 }: { count?: number }) {
  const widths = ["w-48", "w-36", "w-56", "w-40", "w-52", "w-32"];
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cx(
            "h-11 animate-pulse rounded-2xl bg-ink-50",
            widths[i % widths.length],
            i % 2 === 1 && "self-end",
          )}
        />
      ))}
    </div>
  );
}

/** 채팅 사진. 못 불러오면(지워졌거나 주소가 깨짐) 빈칸 대신 회색 칸에 안내 */
function ChatPhoto({ url, onOpen }: { url: string; onOpen: (url: string) => void }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="flex size-[120px] flex-col items-center justify-center gap-1 rounded-control bg-ink-50 px-2 text-center text-caption text-ink-400">
        <Icon name="camera" size={20} />
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
        className="size-[120px] rounded-control object-cover"
      />
    </button>
  );
}

function CardView({ card, onOpen }: { card: ChatCard; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-[min(248px,calc(100vw-120px))] items-center gap-3 rounded-card border border-ink-100 bg-white p-3 text-left"
    >
      {card.imageUrl ? (
        <img src={card.imageUrl} alt="" className="size-12 shrink-0 rounded-control object-cover" />
      ) : (
        <span className="size-12 shrink-0 rounded-control bg-ink-50" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sub font-bold text-ink-900">{card.title}</span>
        {card.subtitle ? (
          <span className="truncate text-caption text-ink-600">{card.subtitle}</span>
        ) : null}
        {card.type === "ORDER" && card.orderStatus ? (
          <span className="text-caption font-semibold text-ink-900">
            {getOrderStatusLabel(card.orderStatus as never)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function Bubble({
  m,
  storeId,
  readByOther,
  onOpenImage,
  onOpenCard,
}: {
  m: ChatMessage;
  storeId: string;
  readByOther: boolean;
  onOpenImage: (url: string) => void;
  onOpenCard: (card: ChatCard) => void;
}) {
  // 손님 견적 요청서(기획 I-46 ②, 판매자 앱 A안): 방 맨 위 넓은 카드에서 바로 견적을 보낸다
  if (m.kind === "QUOTE_REQUEST" && m.card && !m.hidden) {
    return <QuoteRequestPanel storeId={storeId} requestId={m.card.refId} />;
  }
  // 견적·고름 카드는 가운데 회색 띠(누가 보낸 말이 아니라 일어난 일)
  if ((m.kind === "QUOTE" || m.kind === "QUOTE_CHOSEN") && m.card && !m.hidden) {
    return (
      <div className="self-center rounded-card bg-ink-50 px-4 py-2.5 text-center">
        <p
          className={cx("text-sub font-bold", m.card.otherChosen ? "text-ink-600" : "text-ink-900")}
        >
          {m.kind === "QUOTE_CHOSEN" && !m.card.otherChosen
            ? "손님이 이 견적을 골랐어요"
            : m.kind === "QUOTE"
              ? "견적을 보냈어요"
              : m.card.title}
        </p>
        {m.card.subtitle ? <p className="text-caption text-ink-600">{m.card.subtitle}</p> : null}
        <p className="text-badge text-ink-400">{timeLabel(m.createdAt)}</p>
      </div>
    );
  }
  const meta = (
    <span className="shrink-0 self-end pb-0.5 text-badge text-ink-400">
      {m.mine && readByOther ? (
        <span className="mr-1 font-semibold text-brand-ink" data-chat-read>
          읽음
        </span>
      ) : null}
      {timeLabel(m.createdAt)}
    </span>
  );
  let body: React.ReactNode;
  if (m.hidden) {
    body = (
      <div className="rounded-2xl bg-ink-50 px-3.5 py-2.5 text-sub text-ink-400">
        운영자가 가린 메시지예요
      </div>
    );
  } else if (m.card) {
    body = <CardView card={m.card} onOpen={() => onOpenCard(m.card as ChatCard)} />;
  } else {
    body = (
      <div className={cx("flex flex-col gap-1.5", m.mine ? "items-end" : "items-start")}>
        {m.imageUrls.length > 0 ? (
          <div
            className={cx(
              CHAT_NO_REPLAY,
              "flex max-w-[min(264px,calc(100vw-120px))] flex-wrap gap-1",
              m.mine && "justify-end",
            )}
          >
            {m.imageUrls.map((url, i) => (
              // 같은 사진을 두 번 보내도 겹치지 않게 순서를 키에 넣는다
              <ChatPhoto key={`${i}-${url}`} url={url} onOpen={onOpenImage} />
            ))}
          </div>
        ) : null}
        {m.text ? (
          <div
            className={cx(
              CHAT_NO_REPLAY,
              "max-w-[min(264px,calc(100vw-120px))] select-text whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:keep-all] rounded-2xl px-3.5 py-2.5 text-body",
              // 내 말풍선은 주황(손님 앱과 같게, 운영자 결정 11-12 — 디자인 기준의 채팅 예외)
              m.mine ? "bg-brand text-white" : "bg-ink-50 text-ink-900",
            )}
            data-chat-bubble={m.mine ? "mine" : "other"}
          >
            {m.text}
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <div className={cx("flex gap-1.5", m.mine ? "flex-row-reverse" : "flex-row")}>
      {body}
      {meta}
    </div>
  );
}

/**
 * 사장님 채팅방(기획 I-11). 목록에서 열거나(threadId), 주문 상세 "채팅"에서 열면(fromOrderId)
 * 첫 글에 주문 카드가 붙고 방이 없으면 그때 생긴다.
 */
export function SellerChatRoom({
  storeId,
  threadId,
  fromOrderId,
  initialTitle,
  initialWrite,
  initialRulesAgreed,
  pc = false,
}: {
  storeId: string;
  threadId: string | null;
  fromOrderId?: string;
  initialTitle?: string;
  initialWrite?: ChatWriteState;
  initialRulesAgreed?: boolean;
  /** PC 화면(왼쪽 메뉴·위쪽 줄 안): 높이를 그 안에 맞춘다(위 80 + 아래 24) */
  pc?: boolean;
}) {
  const navigate = useNavigate();
  const { addAlert } = useAlertStore();
  const room = useSellerChatRoom({
    storeId,
    threadId,
    fromOrderId,
    onThreadCreated: (id) =>
      navigate(ROUTES.STORE_DETAIL_CHAT_ROOM(storeId, id), { replace: true }),
  });
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(initialRulesAgreed ?? false);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ChatReportReason | null>(null);
  const [reportDetail, setReportDetail] = useState("");
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
  // 방을 못 열었으면(없는 방·다른 스토어 방·불러오기 실패) 입력칸을 숨긴다
  const composerHidden = room.notFound || (!!room.error && room.messages.length === 0);
  const agreed = thread?.rulesAgreed ?? rulesAgreed;

  // 새 글(맨 아래 글·보내는 중인 글)이 생겼을 때만. 위로 올려 옛 글을 불러오는 것은 새 글이 아니다
  const tailKey = `${room.messages[room.messages.length - 1]?.id ?? ""}:${room.pending.length}`;
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setNewBelow(false);
    } else setNewBelow(true);
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
      const prev = el.scrollHeight;
      void room.loadOlder().then(() =>
        requestAnimationFrame(() => {
          if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight - prev;
        }),
      );
    }
  };

  const doSend = async () => {
    const body = text;
    const shots = photos;
    if (!body.trim() && shots.length === 0) return;
    setText("");
    setPhotos([]);
    atBottomRef.current = true;
    const res = await room.send(body, shots);
    if (!res.ok && !res.retryable && res.message)
      addAlert({ severity: "error", message: res.message });
  };

  const onSendClick = () => {
    if (!agreed) {
      setRulesOpen(true);
      return;
    }
    void doSend();
  };

  const onAgree = async () => {
    setBusy(true);
    try {
      await chatApi.agreeRules(storeId, CHAT_RULES_VERSION);
      setRulesAgreed(true);
      if (room.thread) room.setThread({ ...room.thread, rulesAgreed: true });
      setRulesOpen(false);
      await doSend();
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    } finally {
      setBusy(false);
    }
  };

  const onPickPhotos = async (picked: FileList | File[] | null) => {
    // 붙여 넣기·끌어다 놓기로 사진이 아닌 파일이 오면 뺀다(종류를 모르는 파일은 줄여 보며 걸러짐)
    const files = picked
      ? Array.from(picked).filter((f) => !f.type || f.type.startsWith("image/"))
      : [];
    if (files.length === 0) return;
    const left = CHAT_LIMITS.IMAGES_MAX - photos.length;
    if (files.length > left) {
      addAlert({
        severity: "warning",
        message: `사진은 한 번에 ${CHAT_LIMITS.IMAGES_MAX}장까지 보낼 수 있어요`,
      });
    }
    const out: string[] = [];
    for (const f of files.slice(0, left)) {
      try {
        out.push(await shrinkPhoto(f));
      } catch {
        // 못 읽은 사진은 건너뜀
      }
    }
    setPhotos((prev) => [...prev, ...out].slice(0, CHAT_LIMITS.IMAGES_MAX));
    if (fileRef.current) fileRef.current.value = "";
  };

  const showSnackbar = useSnackbarStore((st) => st.showSnackbar);
  const setFlag = async (flag: "mute" | "block", value: boolean) => {
    if (!thread) return;
    try {
      room.setThread(await chatApi.setFlag(storeId, thread.id, flag, value));
      if (flag === "block" && value) {
        // 판매 상태 바꾸기처럼 한 일 + 되돌리기(잘못 눌러도 바로 풀 수 있게)
        showSnackbar({
          message: "차단했어요. 더는 채팅할 수 없어요",
          duration: 5000,
          actionLabel: "되돌리기",
          onAction: () => void setFlag("block", false),
        });
      } else if (flag === "block") {
        addAlert({ severity: "info", message: "차단을 풀었어요" });
      } else {
        addAlert({
          severity: "info",
          message: value ? "이 채팅 알림을 껐어요" : "이 채팅 알림을 켰어요",
        });
      }
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    }
  };

  const onReport = async () => {
    if (!thread || !reason) return;
    setBusy(true);
    try {
      await chatApi.report(storeId, thread.id, {
        reason,
        ...(reportDetail.trim() ? { detail: reportDetail.trim() } : {}),
      });
      setReportOpen(false);
      setReason(null);
      setReportDetail("");
      // 안내 띠는 한 일을 말하고 마침표를 찍지 않는다(디자인 기준)
      addAlert({ severity: "info", message: "신고했어요. Picake가 24시간 안에 확인해요" });
    } catch (e) {
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    } finally {
      setBusy(false);
    }
  };

  const openCard = (card: ChatCard) => {
    if (card.type === "ORDER") navigate(ROUTES.STORE_DETAIL_ORDERS_DETAIL(storeId, card.refId));
  };

  const otherReadAt = thread?.otherReadAt ?? null;
  let lastMineId: string | null = null;
  for (const m of room.messages) if (m.mine) lastMineId = m.id;
  let prevDay = "";

  return (
    <div
      className={cx(
        APP_COLUMN_CLASS,
        "flex flex-col bg-white font-app text-ink-900",
        pc ? "-mt-4 h-[calc(100dvh-88px)]" : "h-dvh",
      )}
    >
      <header
        className={cx(
          "shrink-0 border-b border-ink-100 bg-white",
          !pc && "pt-[env(safe-area-inset-top)]",
        )}
      >
        <BackHeader
          title={title}
          // 들어온 곳(주문 상세·채팅 목록)으로. 휴대폰 알림으로 바로 열렸으면 채팅 목록으로
          onBack={() =>
            canGoBackInApp()
              ? navigate(-1)
              : navigate(ROUTES.STORE_DETAIL_CHATS(storeId), { replace: true })
          }
          actions={
            thread ? (
              <HeaderIconButton icon="more" label="채팅 메뉴" onClick={() => setMenuOpen(true)} />
            ) : null
          }
        />
      </header>

      <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3">
        {room.loadingOlder ? (
          <div className="pb-2.5">
            <RoomSkeleton count={2} />
          </div>
        ) : null}
        {room.loading ? (
          <RoomSkeleton />
        ) : room.notFound ? (
          // 없는 방·이 스토어 방이 아님: 다시 시도해도 안 되니 "찾을 수 없어요"(주문·상품 상세와 같은 모양)
          <div className="flex h-full flex-col">
            <EmptyState big icon="search" title="채팅을 찾을 수 없어요" />
          </div>
        ) : room.error && room.messages.length === 0 ? (
          <div className="flex h-full flex-col">
            <LoadErrorState big onRetry={() => void room.reload()} />
          </div>
        ) : room.messages.length === 0 && room.pending.length === 0 ? (
          <div className="flex h-full flex-col">
            <EmptyState
              big
              icon="chat"
              title={fromOrderId ? "손님에게 물어볼 것을 보내 보세요" : "아직 글이 없어요"}
              description={fromOrderId ? "첫 글에 이 예약 카드가 함께 가요" : undefined}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2.5">
          {room.messages.map((m) => {
            const day = dayLabel(m.createdAt);
            const showDay = day !== prevDay;
            prevDay = day;
            return (
              <div key={m.id} className="flex flex-col gap-2.5">
                {showDay ? (
                  <p className="py-1 text-center text-caption text-ink-400">{day}</p>
                ) : null}
                <Bubble
                  m={m}
                  readByOther={m.id === lastMineId && !!otherReadAt && otherReadAt >= m.createdAt}
                  onOpenImage={setViewer}
                  storeId={storeId}
                  onOpenCard={openCard}
                />
              </div>
            );
          })}
          {room.pending.map((p) => (
            <div key={p.clientId} className="flex flex-col items-end gap-1">
              {p.photos.length > 0 ? (
                <div
                  className={cx(
                    CHAT_NO_REPLAY,
                    "flex max-w-[min(264px,calc(100vw-120px))] flex-wrap justify-end gap-1 opacity-70",
                  )}
                >
                  {p.photos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="size-[120px] rounded-control object-cover"
                    />
                  ))}
                </div>
              ) : null}
              {p.text.trim() ? (
                <div
                  className={cx(
                    CHAT_NO_REPLAY,
                    "max-w-[min(264px,calc(100vw-120px))] whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:keep-all] rounded-2xl bg-brand px-3.5 py-2.5 text-body text-white",
                  )}
                  data-chat-bubble="mine"
                >
                  {p.text}
                </div>
              ) : null}
              {p.status === "sending" ? (
                <span className="text-badge text-ink-400">보내는 중…</span>
              ) : (
                <span className="text-badge font-semibold text-brand-ink">
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

      {newBelow ? (
        <button
          type="button"
          onClick={() => {
            const el = listRef.current;
            if (el) el.scrollTop = el.scrollHeight;
            atBottomRef.current = true;
            setNewBelow(false);
          }}
          // 검정 버튼은 쓰지 않는다(디자인 기준) — 위쪽 알림 띠처럼 흰 바탕·회색 테두리·그림자
          className="press mx-auto -mt-12 mb-2 inline-flex min-h-10 items-center gap-1 rounded-full border border-ink-200 bg-white px-4 text-caption font-bold text-ink-900 shadow-md"
          data-chat-new-below
        >
          새 메시지
          <Icon name="chevronDown" size={16} />
        </button>
      ) : null}

      {composerHidden ? null : write.ok ? (
        <div
          className="shrink-0 border-t border-ink-100 bg-white px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2"
          // PC: 사진을 끌어다 놓아도 보낼 사진에 들어간다
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) e.preventDefault();
          }}
          onDrop={(e) => {
            if (e.dataTransfer.files.length === 0) return;
            e.preventDefault();
            void onPickPhotos(e.dataTransfer.files);
          }}
        >
          {photos.length > 0 ? (
            <div className="mb-2 flex gap-1.5 overflow-x-auto">
              {photos.map((src, i) => (
                <div key={i} className={cx(CHAT_NO_REPLAY, "relative shrink-0")}>
                  <img src={src} alt="" className="size-16 rounded-control object-cover" />
                  <button
                    type="button"
                    aria-label="사진 빼기"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 before:absolute before:-inset-2 before:content-['']"
                  >
                    <Icon name="close" size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <button
              type="button"
              aria-label="사진 보내기"
              onClick={() => fileRef.current?.click()}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
            >
              <Icon name="camera" size={22} />
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
              // PC: 복사한 사진을 붙여 넣으면 보낼 사진에 들어간다(글이 함께 복사됐으면 글로 붙임)
              onPaste={(e) => {
                const files = Array.from(e.clipboardData.files);
                if (files.length === 0 || e.clipboardData.getData("text/plain")) return;
                e.preventDefault();
                void onPickPhotos(files);
              }}
              placeholder="메시지 보내기"
              aria-label="메시지 보내기"
              rows={1}
              maxLength={CHAT_LIMITS.TEXT_MAX}
              className={cx(
                CHAT_NO_REPLAY,
                "max-h-24 min-h-12 flex-1 resize-none rounded-control border border-ink-200 px-4 py-3 text-body outline-none focus:border-ink-900",
              )}
            />
            <button
              type="button"
              aria-label="보내기"
              disabled={!text.trim() && photos.length === 0}
              onClick={onSendClick}
              className="press inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:bg-ink-100 disabled:text-ink-400"
            >
              <Icon name="send" size={22} strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-ink-100 bg-ink-50 px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))] text-center text-sub text-ink-600">
          {write.message ?? "지금은 메시지를 보낼 수 없어요."}
        </div>
      )}

      {viewer ? (
        // 주문 상세 참고 사진과 같은 사진 보기(확대·넘기기)
        <div className={CHAT_NO_REPLAY}>
          <ImageLightbox images={[viewer]} alt="채팅 사진" onClose={() => setViewer(null)} />
        </div>
      ) : null}

      <BottomSheet
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        title="채팅 이용 규칙"
        footer={
          <Button block onClick={() => void onAgree()} loading={busy} loadingLabel="보내는 중">
            동의하고 보내기
          </Button>
        }
      >
        <ul className="flex flex-col gap-2.5 text-sub text-ink-600">
          {CHAT_RULES_LINES.map((l) => (
            <li key={l} className="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </BottomSheet>

      {/* 메뉴: 주문 "다른 처리" 창처럼 BottomSheet + ListRowButton(디자인 기준) */}
      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="채팅 메뉴"
        footer={
          <Button variant="secondary" block onClick={() => setMenuOpen(false)}>
            돌아가기
          </Button>
        }
      >
        <div className="flex flex-col">
          <ListRowButton
            title={thread?.muted ? "이 채팅 알림 켜기" : "이 채팅 알림 끄기"}
            description={
              thread?.muted
                ? "새 글이 오면 다시 휴대폰 알림을 보내요"
                : "새 글이 와도 휴대폰 알림을 보내지 않아요"
            }
            onClick={() => {
              setMenuOpen(false);
              void setFlag("mute", !thread?.muted);
            }}
          />
          <ListRowButton
            title="신고하기"
            description="욕설·광고·사기 등을 Picake에 알려요"
            chevron
            onClick={() => {
              setMenuOpen(false);
              setReportOpen(true);
            }}
          />
          <ListRowButton
            title={thread?.blockedByMe ? "차단 풀기" : "차단하기"}
            description={
              thread?.blockedByMe ? "다시 채팅할 수 있어요" : "이 손님과 더는 채팅할 수 없어요"
            }
            divider={false}
            onClick={() => {
              setMenuOpen(false);
              void setFlag("block", !thread?.blockedByMe);
            }}
          />
        </div>
      </BottomSheet>

      {/* 신고: 주문 취소 사유 창처럼 동그라미 고르기 + 자세히(선택) + 버튼 둘(디자인 기준) */}
      <BottomSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="신고하기"
        description="Picake가 24시간 안에 확인하고 가리거나 이용을 막아요"
        footer={
          <ButtonPair>
            <Button variant="secondary" onClick={() => setReportOpen(false)}>
              돌아가기
            </Button>
            <Button
              disabled={!reason}
              loading={busy}
              loadingLabel="보내는 중"
              onClick={() => void onReport()}
            >
              신고하기
            </Button>
          </ButtonPair>
        }
      >
        <p className="text-body font-bold text-ink-900">이유</p>
        <div role="radiogroup" aria-label="신고 이유" className="-mt-2 flex flex-col">
          {CHAT_REPORT_REASONS.map((r) => {
            const on = reason === r.value;
            return (
              <label
                key={r.value}
                className={cx(
                  "flex min-h-11 cursor-pointer items-center gap-3 border-b border-ink-100 text-body text-ink-900",
                  on ? "font-bold" : "font-normal",
                )}
              >
                <input
                  type="radio"
                  name="chat-report-reason"
                  value={r.value}
                  checked={on}
                  onChange={() => setReason(r.value)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cx(
                    "inline-block size-[22px] shrink-0 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-ink-900 peer-focus-visible:ring-offset-2",
                    on ? "border-[7px] border-brand" : "border-[1.5px] border-ink-200",
                  )}
                />
                {r.label}
              </label>
            );
          })}
        </div>
        <Field>
          {(p) => (
            <TextArea
              id={p.id}
              aria-label="자세히 (선택)"
              rows={3}
              className="min-h-[68px]"
              maxLength={300}
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              placeholder="어떤 일이 있었는지 적어 주세요(선택)"
            />
          )}
        </Field>
      </BottomSheet>
    </div>
  );
}
