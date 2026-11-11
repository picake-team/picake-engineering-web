import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { BackHeader, APP_COLUMN_CLASS } from "@/apps/web-seller/common/ui/Screen";
import { Button, HeaderIconButton } from "@/apps/web-seller/common/ui/Button";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import { chatApi } from "@/apps/web-seller/features/chat/apis/chat.api";
import { shrinkPhoto, useSellerChatRoom } from "@/apps/web-seller/features/chat/hooks/useChat";
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

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(iso));
}

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function CardView({ card, onOpen }: { card: ChatCard; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-[248px] items-center gap-3 rounded-card border border-ink-100 bg-white p-3 text-left"
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
    <span className="shrink-0 self-end pb-0.5 text-[11px] text-ink-400">
      {m.mine && readByOther ? <span className="mr-1 font-semibold text-ink-600">읽음</span> : null}
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
              "flex max-w-[264px] flex-wrap gap-1",
              m.mine && "justify-end",
            )}
          >
            {m.imageUrls.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => onOpenImage(url)}
                aria-label="사진 크게 보기"
              >
                <img src={url} alt="" className="size-[120px] rounded-control object-cover" />
              </button>
            ))}
          </div>
        ) : null}
        {m.text ? (
          <div
            className={cx(
              CHAT_NO_REPLAY,
              "max-w-[264px] select-text whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-body",
              // 판매자 앱은 진한 주황을 버튼 하나에만 쓴다 — 내 말풍선은 검정(디자인 기준)
              m.mine ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-900",
            )}
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
  const [viewer, setViewer] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const [newBelow, setNewBelow] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const thread = room.thread;
  const title = thread?.title ?? initialTitle ?? "채팅";
  const write = thread?.write ?? initialWrite ?? { ok: true };
  const agreed = thread?.rulesAgreed ?? rulesAgreed;

  const count = room.messages.length + room.pending.length;
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setNewBelow(false);
    } else setNewBelow(true);
  }, [count]);
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
    if (!res.ok && res.message) addAlert({ severity: "error", message: res.message });
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

  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;
    const left = CHAT_LIMITS.IMAGES_MAX - photos.length;
    if (files.length > left) {
      addAlert({
        severity: "warning",
        message: `사진은 한 번에 ${CHAT_LIMITS.IMAGES_MAX}장까지 보낼 수 있어요`,
      });
    }
    const out: string[] = [];
    for (const f of Array.from(files).slice(0, left)) {
      try {
        out.push(await shrinkPhoto(f));
      } catch {
        // 못 읽은 사진은 건너뜀
      }
    }
    setPhotos((prev) => [...prev, ...out].slice(0, CHAT_LIMITS.IMAGES_MAX));
    if (fileRef.current) fileRef.current.value = "";
  };

  const setFlag = async (flag: "mute" | "block", value: boolean) => {
    if (!thread) return;
    try {
      room.setThread(await chatApi.setFlag(storeId, thread.id, flag, value));
      if (flag === "block") {
        addAlert({
          severity: "info",
          message: value ? "차단했어요. 더는 채팅할 수 없어요" : "차단을 풀었어요",
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
      const res = await chatApi.report(storeId, thread.id, { reason });
      setReportOpen(false);
      setReason(null);
      addAlert({ severity: "info", message: res.message });
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
          onBack={() => navigate(ROUTES.STORE_DETAIL_CHATS(storeId))}
          actions={
            thread ? (
              <HeaderIconButton icon="more" label="채팅 메뉴" onClick={() => setMenuOpen(true)} />
            ) : null
          }
        />
      </header>

      <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3">
        {room.loadingOlder ? (
          <p className="py-2 text-center text-caption text-ink-400">불러오는 중…</p>
        ) : null}
        {room.loading ? (
          <p className="py-10 text-center text-sub text-ink-400">불러오는 중…</p>
        ) : room.error ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sub text-ink-600">{room.error}</p>
            <Button variant="secondary" size="md" onClick={() => void room.reload()}>
              다시 불러오기
            </Button>
          </div>
        ) : room.messages.length === 0 && room.pending.length === 0 ? (
          <p className="py-10 text-center text-sub text-ink-600">
            {fromOrderId ? "이 예약에 대해 손님에게 물어볼 것을 보내 보세요" : "아직 글이 없어요"}
          </p>
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
                    "flex max-w-[264px] flex-wrap justify-end gap-1 opacity-70",
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
                    "max-w-[264px] whitespace-pre-wrap break-words rounded-2xl bg-ink-900 px-3.5 py-2.5 text-body text-white opacity-60",
                  )}
                >
                  {p.text}
                </div>
              ) : null}
              {p.status === "sending" ? (
                <span className="text-[11px] text-ink-400">보내는 중…</span>
              ) : (
                <span className="text-[11px] font-semibold text-brand-ink">
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
          className="mx-auto -mt-11 mb-2 rounded-full bg-ink-900 px-3.5 py-2 text-caption font-bold text-white"
        >
          새 메시지 ↓
        </button>
      ) : null}

      {write.ok ? (
        <div className="shrink-0 border-t border-ink-100 bg-white px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
          {photos.length > 0 ? (
            <div className="mb-2 flex gap-1.5 overflow-x-auto">
              {photos.map((src, i) => (
                <div key={i} className={cx(CHAT_NO_REPLAY, "relative shrink-0")}>
                  <img src={src} alt="" className="size-16 rounded-control object-cover" />
                  <button
                    type="button"
                    aria-label="사진 빼기"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-ink-900 text-[12px] text-white"
                  >
                    ×
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
              value={text}
              onChange={(e) => setText(e.target.value)}
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
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:bg-ink-100 disabled:text-ink-400"
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
        <button
          type="button"
          aria-label="사진 닫기"
          onClick={() => setViewer(null)}
          className={cx(
            CHAT_NO_REPLAY,
            "fixed inset-0 z-50 flex items-center justify-center bg-black/90",
          )}
        >
          <img src={viewer} alt="" className="max-h-full max-w-full object-contain" />
        </button>
      ) : null}

      <BottomSheet
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        title="채팅 이용 규칙"
        footer={
          <Button onClick={() => void onAgree()} loading={busy} loadingLabel="보내는 중">
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

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="채팅">
        <div className="-mx-5 flex flex-col">
          {[
            {
              label: thread?.muted ? "이 채팅 알림 켜기" : "이 채팅 알림 끄기",
              onClick: () => void setFlag("mute", !thread?.muted),
            },
            { label: "신고하기", onClick: () => setReportOpen(true) },
            {
              label: thread?.blockedByMe ? "차단 풀기" : "차단하기",
              danger: !thread?.blockedByMe,
              onClick: () => void setFlag("block", !thread?.blockedByMe),
            },
          ].map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                row.onClick();
              }}
              className={cx(
                "min-h-12 px-5 py-3 text-left text-body active:bg-ink-50",
                row.danger ? "font-semibold text-brand-ink" : "text-ink-900",
              )}
            >
              {row.label}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="어떤 점이 불편했나요?"
        description="신고하면 Picake가 24시간 안에 확인해요"
        footer={
          <Button
            disabled={!reason}
            loading={busy}
            loadingLabel="보내는 중"
            onClick={() => void onReport()}
          >
            신고하기
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {CHAT_REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={reason === r.value}
              onClick={() => setReason(r.value)}
              className={cx(
                "flex min-h-12 items-center rounded-control border px-4 text-body",
                reason === r.value
                  ? "border-brand font-semibold text-ink-900"
                  : "border-ink-200 text-ink-900",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
