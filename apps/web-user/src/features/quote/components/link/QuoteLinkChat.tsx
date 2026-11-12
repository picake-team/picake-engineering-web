"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/apps/web-user/common/components/buttons/Button";
import { cn } from "@/apps/web-user/common/lib/utils";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { quoteLinkApi } from "@/apps/web-user/features/quote/apis/quote.api";
import { NoticeBox } from "@/apps/web-user/features/quote/components/form/QuoteFormParts";
import { trackEvent } from "@/apps/web-user/common/utils/analytics.util";
import { QUOTE_NO_REPLAY } from "@/apps/web-user/features/quote/constants/quote.constant";
import type { ChatMessage } from "@/apps/web-user/features/chat/types/chat.type";

const TEXT_MAX = 1000;
const POLL_MS = 8000;

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

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
      className={cn(
        QUOTE_NO_REPLAY,
        "flex flex-col gap-[2px]",
        m.mine ? "items-end" : "items-start",
      )}
    >
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
              "max-w-[80%] whitespace-pre-wrap rounded-2xl px-[14px] py-[10px] text-sm [overflow-wrap:anywhere]",
              m.mine ? "bg-primary text-white" : "bg-gray-50 text-gray-900",
            )}
          >
            {m.text}
          </p>
        )
      )}
      <span className="text-[11px] text-gray-400">
        {m.mine ? "" : "손님 · "}
        {timeLabel(m.createdAt)}
      </span>
    </div>
  );
}

/**
 * 견적 링크 안 대화(기획 I-11, 입점 전 가게). 가게 계정이 없어 링크 열쇠로 손님과 이야기한다.
 * 실시간 연결 없이 8초마다 새 글을 확인한다. 고른 뒤 14일, 고르지 않으면 마감 뒤 7일까지 쓸 수 있다.
 */
export function QuoteLinkChat({
  token,
  open,
  requestId,
}: {
  token: string;
  open: boolean;
  requestId: string;
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
  const messages = data?.messages ?? [];
  const write = data?.thread?.write;
  const canWrite = open && (write?.ok ?? true);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const onSend = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      await quoteLinkApi.send(token, {
        clientId: `link-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        text: body,
      });
      setText("");
      trackEvent("success_quote_link_chat", { quote_request_id: requestId });
      await queryClient.invalidateQueries({ queryKey: ["quote-link-chat", token] });
    } catch (e) {
      setError(getApiMessage.error(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mb-[24px]">
      <p className="mb-[10px] text-base font-bold text-gray-900">손님과 대화</p>
      <div className="mb-[10px]">
        <NoticeBox>
          손님 이름·연락처는 Picake가 보내지 않아요. 욕설은 가려지고, 대화 내용은 손님이 신고했을
          때만 Picake가 봐요.
        </NoticeBox>
      </div>
      <div className="flex max-h-[360px] flex-col gap-[10px] overflow-y-auto rounded-xl border border-gray-100 px-[12px] py-[12px]">
        {messages.length === 0 && (
          <p className="py-[16px] text-center text-sm text-gray-400">
            손님이 궁금한 것을 물어보면 여기에 보여요
          </p>
        )}
        {messages.map((m) => (
          <Line key={m.id} m={m} />
        ))}
        <div ref={endRef} />
      </div>
      {canWrite ? (
        <div className="mt-[10px] flex items-end gap-[8px]">
          <textarea
            value={text}
            maxLength={TEXT_MAX}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="손님에게 답하기"
            aria-label="손님에게 답하기"
            className="ph-no-capture min-w-0 flex-1 resize-none rounded-xl border border-gray-100 px-[12px] py-[10px] text-sm text-gray-900 outline-none focus:border-gray-900"
          />
          <span className="w-[72px]">
            <Button
              size="md"
              className="w-full"
              loading={sending}
              disabled={!text.trim()}
              onClick={() => void onSend()}
            >
              보내기
            </Button>
          </span>
        </div>
      ) : (
        <p className="mt-[10px] text-sm text-gray-500">
          {write?.message ?? "대화 기간이 끝났어요."}
        </p>
      )}
      {error && <p className="mt-[6px] text-sm text-red-400">{error}</p>}
    </section>
  );
}
