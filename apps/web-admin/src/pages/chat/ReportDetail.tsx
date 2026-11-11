import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BaseButton as Button } from "@/apps/web-admin/common/components/buttons/BaseButton";
import { Card } from "@/apps/web-admin/common/components/cards/Card";
import { EmptyState } from "@/apps/web-admin/common/components/fallbacks/EmptyState";
import { ContentLoading } from "@/apps/web-admin/common/components/loading/ContentLoading";
import {
  LIST_CARD,
  LIST_SCREEN_HEADING,
  LIST_SECTION_GAP,
} from "@/apps/web-admin/common/constants/list-typography.constant";
import { ROUTES } from "@/apps/web-admin/common/constants/paths.constant";
import { cn } from "@/apps/web-admin/common/utils/classname.util";
import {
  CHAT_REPORT_REASON_LABELS,
  CHAT_SIDE_LABELS,
  formatKst,
  hoursLeft,
  useChatReport,
  useResolveChatReport,
} from "@/apps/web-admin/features/chat-management/chat-management";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border/60 py-3 text-sm last:border-0">
      <div className="w-28 shrink-0 text-muted-foreground">{label}</div>
      <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">{children}</div>
    </div>
  );
}

/**
 * 채팅 > 신고 > 상세(기획 I-11). 최근 대화 50개 원문을 본다(열면 열람 기록이 남음).
 * 가릴 메시지를 골라 "가리고 처리"하거나 "그대로 두고 처리"한다. 디스코드 알림 링크가 이 주소로 온다.
 */
export const ChatReportDetailPage: React.FC = () => {
  const { reportId = "" } = useParams<{ reportId: string }>();
  const { data, isLoading } = useChatReport(reportId);
  const resolve = useResolveChatReport(reportId);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // 메시지 하나를 신고했으면 그 메시지를 먼저 골라 둔다
  useEffect(() => {
    if (data?.messageId) setPicked([data.messageId]);
  }, [data?.messageId]);

  if (isLoading)
    return <ContentLoading variant="section" message="불러오는 중…" className="py-12" />;
  if (!data) return <EmptyState message="신고를 찾을 수 없습니다." />;

  const open = data.status === "OPEN";
  const left = hoursLeft(data.createdAt);
  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className={LIST_SECTION_GAP}>
      <div className="flex items-center justify-between gap-4">
        <h1 className={LIST_SCREEN_HEADING}>채팅 신고 상세</h1>
        <Link to={ROUTES.CHAT.REPORTS}>
          <Button variant="outline" size="sm">
            목록
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-4">
          <Card className={LIST_CARD}>
            <div className="px-5 py-3">
              <h2 className="mb-2 font-semibold">신고</h2>
              <Row label="상태">
                {open ? (
                  <span className={cn(left < 6 && "font-semibold text-destructive")}>
                    처리할 것 · {left < 0 ? "기한 지남" : `${left}시간 남음`}
                  </span>
                ) : (
                  "처리함"
                )}
              </Row>
              <Row label="이유">{CHAT_REPORT_REASON_LABELS[data.reason]}</Row>
              <Row label="신고한 쪽">{CHAT_SIDE_LABELS[data.reporter]}</Row>
              <Row label="자세히">{data.detail ?? "-"}</Row>
              <Row label="대상">{data.messageId ? "메시지 하나" : "대화 전체"}</Row>
              <Row label="신고 일시">{formatKst(data.createdAt)}</Row>
              {!open ? (
                <>
                  <Row label="처리">{data.resolution ?? "-"}</Row>
                  <Row label="처리 일시">{data.resolvedAt ? formatKst(data.resolvedAt) : "-"}</Row>
                </>
              ) : null}
            </div>
          </Card>

          <Card className={LIST_CARD}>
            <div className="px-5 py-3">
              <h2 className="mb-2 font-semibold">대화한 사람</h2>
              <Row label="손님">{data.consumerNickname ?? "-"}</Row>
              <Row label="가게">{data.shopName}</Row>
              <p className="pt-2 text-xs text-muted-foreground">
                계속 문제를 일으키면 회원 관리에서 이용을 막아 주세요.
              </p>
            </div>
          </Card>

          {open ? (
            <Card className={LIST_CARD}>
              <div className="flex flex-col gap-3 px-5 py-4">
                <h2 className="font-semibold">처리</h2>
                <p className="text-sm text-muted-foreground">
                  오른쪽 대화에서 가릴 메시지를 고르세요. 가린 메시지는 두 사람 모두에게
                  &quot;운영자가 가린 메시지예요&quot;로 보여요.
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="처리 메모(선택, 200자)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    disabled={picked.length === 0 || resolve.isPending}
                    onClick={() =>
                      resolve.mutate({
                        action: "HIDE_MESSAGE",
                        messageIds: picked,
                        note: note.trim() || undefined,
                      })
                    }
                  >
                    고른 {picked.length}개 가리고 처리
                  </Button>
                  <Button
                    variant="outline"
                    disabled={resolve.isPending}
                    onClick={() =>
                      resolve.mutate({ action: "NONE", note: note.trim() || undefined })
                    }
                  >
                    그대로 두고 처리
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>

        <Card className={LIST_CARD}>
          <div className="px-5 py-3">
            <h2 className="mb-1 font-semibold">최근 대화 {data.messages.length}개</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              원문(거르기 전 글)이에요. 이 화면을 연 기록이 남아요. 신고 처리 말고는 쓰지 마세요.
            </p>
            <ul className="flex flex-col gap-2">
              {data.messages.map((m) => {
                const reported = m.id === data.messageId;
                const canPick = open && !m.hidden && (m.kind === "TEXT" || m.kind === "IMAGE");
                return (
                  <li
                    key={m.id}
                    className={cn(
                      "flex gap-3 rounded-md border px-3 py-2 text-sm",
                      reported ? "border-destructive/60 bg-destructive/5" : "border-border/60",
                      m.sender === "SHOP" && "ml-10",
                    )}
                  >
                    {canPick ? (
                      <input
                        type="checkbox"
                        aria-label="이 메시지 가리기"
                        checked={picked.includes(m.id)}
                        onChange={() => toggle(m.id)}
                        className="mt-1 size-4 shrink-0"
                      />
                    ) : (
                      <span className="size-4 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {CHAT_SIDE_LABELS[m.sender]}
                        </span>
                        <span>{formatKst(m.createdAt)}</span>
                        {reported ? (
                          <span className="font-semibold text-destructive">신고된 메시지</span>
                        ) : null}
                        {m.hidden ? <span>가림</span> : null}
                        {m.kind === "ORDER" ? <span>주문 카드</span> : null}
                        {m.kind === "PRODUCT" ? <span>상품 카드</span> : null}
                      </div>
                      {m.text ? (
                        <p
                          className={cn(
                            "whitespace-pre-wrap break-words",
                            m.hidden && "line-through opacity-60",
                          )}
                        >
                          {m.text}
                        </p>
                      ) : null}
                      {m.imageUrls.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {m.imageUrls.map((url) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer">
                              <img
                                src={url}
                                alt="채팅 사진"
                                className="h-24 w-24 rounded-md object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};
