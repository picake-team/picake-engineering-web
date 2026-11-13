"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/apps/web-user/common/components/icons";
import { cn } from "@/apps/web-user/common/lib/utils";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { quoteLinkApi } from "@/apps/web-user/features/quote/apis/quote.api";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { QUOTE_NO_REPLAY } from "@/apps/web-user/features/quote/constants/quote.constant";
import type { ChatMessage } from "@/apps/web-user/features/chat/types/chat.type";

const TEXT_MAX = 1000;
const POLL_MS = 8000;

const kst = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", ...opts }).format(new Date(iso));
/** 날짜 줄 "11월 12일 (목)" */
const dayLabel = (iso: string) => kst(iso, { month: "long", day: "numeric", weekday: "short" });
/** 말풍선 옆 "오후 8:54" */
const timeLabel = (iso: string) => kst(iso, { hour: "numeric", minute: "2-digit" });

/** 말풍선(손님 앱 채팅과 같은 모양: 사장님 글은 오른쪽 주황, 손님 글은 왼쪽 회색, 시각은 옆에) */
function Line({ m }: { m: ChatMessage }) {
  if (m.card) {
    return (
      <div className="self-center rounded-xl bg-gray-50 px-[12px] py-[8px] text-center text-xs text-gray-700">
        <p className="font-bold text-gray-900">
          {m.kind === "QUOTE"
            ? "보낸 견적"
            : m.kind === "QUOTE_CHOSEN" && !m.card.otherChosen
              ? "손님이 이 견적을 골랐어요"
              : m.card.title}
        </p>
        {m.card.subtitle && <p>{m.card.subtitle}</p>}
      </div>
    );
  }
  return (
    // 대화는 손님과 가게 사이의 것이라 화면 녹화에서 가린다(손님 채팅과 같게)
    <div
      className={cn(QUOTE_NO_REPLAY, "flex gap-[6px]", m.mine ? "flex-row-reverse" : "flex-row")}
    >
      <div className={cn("flex flex-col gap-[4px]", m.mine ? "items-end" : "items-start")}>
        {m.imageUrls.map((url) => (
          <img key={url} src={url} alt="" className="h-[120px] w-[120px] rounded-xl object-cover" />
        ))}
        {m.hidden ? (
          <p className="rounded-2xl bg-gray-50 px-[14px] py-[10px] text-sm text-gray-400">
            운영자가 가린 메시지예요
          </p>
        ) : (
          m.text && (
            <p
              className={cn(
                "max-w-[min(260px,calc(100vw-120px))] select-text whitespace-pre-wrap rounded-2xl px-[14px] py-[10px] text-sm [overflow-wrap:anywhere] [word-break:keep-all]",
                m.mine ? "bg-primary text-white" : "bg-gray-50 text-gray-900",
              )}
            >
              {m.text}
            </p>
          )
        )}
      </div>
      <span className="shrink-0 self-end pb-[2px] text-[11px] text-gray-400">
        {timeLabel(m.createdAt)}
      </span>
    </div>
  );
}

/**
 * 견적 링크 안 대화(기획 I-11, 입점 전 가게). 가게 계정이 없어 링크 열쇠로 손님과 이야기한다.
 * 실시간 연결 없이 8초마다 새 글을 확인한다. 고른 뒤 14일, 고르지 않으면 마감 뒤 7일까지 쓸 수 있다.
 * 손님 앱 채팅과 같은 말풍선·입력 줄이고, 페이지 안에 따로 스크롤 상자를 두지 않는다(11-12 운영자 "깔끔하게").
 */
export function QuoteLinkChat({
  token,
  open,
  requestId,
  closedMessage,
  contactShared = false,
}: {
  token: string;
  open: boolean;
  requestId: string;
  /** 쓸 수 없을 때 안내(이 요청에 아직 견적을 보내지 않았으면 "견적을 보내면…") */
  closedMessage?: string;
  /** 위에 손님 연락처가 보이면 "서로 안 보여요" 문장을 뺀다 */
  contactShared?: boolean;
}) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["quote-link-chat", token],
    queryFn: () => quoteLinkApi.messages(token),
    refetchInterval: POLL_MS,
  });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // 처음 열 때는 위(요청서)부터 보이게 두고, 내가 보낸 뒤에만 대화 끝으로 내린다
  const scrollAfterSend = useRef(false);
  // "보낸 견적" 카드는 바로 위 "보낸 견적" 칸과 같아 대화에서는 뺀다
  const messages = (data?.messages ?? []).filter((m) => m.kind !== "QUOTE");
  const write = data?.thread?.write;
  const canWrite = open && (write?.ok ?? true);

  useEffect(() => {
    if (!scrollAfterSend.current) return;
    scrollAfterSend.current = false;
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  // 입력 칸은 글이 길어지면 네 줄까지 늘어난다
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [text]);

  const onSend = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await quoteLinkApi.send(token, {
        clientId: `link-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        text: body,
      });
      setText("");
      trackEvent("success_quote_link_chat", { quote_request_id: requestId });
      scrollAfterSend.current = true;
      await queryClient.invalidateQueries({ queryKey: ["quote-link-chat", token] });
    } catch (e) {
      setError(getApiMessage.error(e));
    } finally {
      setSending(false);
    }
  };

  let prevDay = "";
  return (
    // 견적 링크 "대화" 탭의 흰 카드(탭 이름이 제목이라 따로 두지 않음, 안쪽 스크롤 상자는 두지 않음)
    <section aria-label="손님과 대화" className="rounded-2xl bg-white px-[16px] py-[16px]">
      <div className="flex flex-col gap-[10px]">
        {messages.length === 0 && (
          <p className="py-[16px] text-center text-sm text-gray-400">
            손님이 궁금한 것을 물어보면 여기에 보여요
          </p>
        )}
        {messages.map((m) => {
          const day = dayLabel(m.createdAt);
          const showDay = day !== prevDay;
          prevDay = day;
          return (
            <div key={m.id} className="flex flex-col gap-[10px]">
              {showDay && <p className="py-[2px] text-center text-xs text-gray-400">{day}</p>}
              <Line m={m} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {canWrite ? (
        <div className="mt-[14px] flex items-end gap-[8px]">
          <textarea
            ref={inputRef}
            value={text}
            maxLength={TEXT_MAX}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="손님에게 답하기"
            aria-label="손님에게 답하기"
            className="ph-no-capture max-h-[96px] min-h-[44px] min-w-0 flex-1 resize-none rounded-[22px] bg-gray-50 px-[16px] py-[11px] text-sm text-gray-900 outline-none"
          />
          <button
            type="button"
            aria-label="보내기"
            disabled={!text.trim() || sending}
            onClick={() => void onSend()}
            className="press flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            <Icon name="send" width={20} height={20} />
          </button>
        </div>
      ) : (
        <p className="mt-[14px] rounded-xl bg-gray-50 px-[12px] py-[10px] text-center text-sm text-gray-500">
          {closedMessage ?? write?.message ?? "대화 기간이 끝났어요."}
        </p>
      )}
      {error && <p className="mt-[6px] text-sm text-red-400">{error}</p>}
      <p className="mt-[10px] text-xs text-gray-400">
        {contactShared
          ? "신고가 들어오면 Picake가 대화를 봐요."
          : "이름·연락처는 서로 보이지 않아요. 신고가 들어오면 Picake가 대화를 봐요."}
      </p>
    </section>
  );
}
