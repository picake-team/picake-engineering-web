import React from "react";
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
import {
  QUOTE_REQUEST_ENTRY_LABELS,
  QUOTE_REQUEST_STATUS_LABELS,
  formatDateTime,
  useQuoteRequestDetail,
} from "@/apps/web-admin/features/quote-request-management/quote-request-management";
import { QuoteTargetsCard } from "@/apps/web-admin/features/quote-request-management/QuoteTargetsCard";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border/60 py-3 text-sm last:border-0">
      <div className="w-28 shrink-0 text-muted-foreground">{label}</div>
      <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">{children}</div>
    </div>
  );
}

/**
 * 구매자 > 견적 요청 > 상세(기획 I-46 SC-46).
 * 요청서 전체, 물어볼 가게와 견적(가게 추가·견적 링크·대신 적기·고른 뒤 알리기·마감, ②), 근처 가게 찾기 링크.
 */
export const QuoteRequestDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { data, isLoading } = useQuoteRequestDetail(requestId);

  if (isLoading)
    return <ContentLoading variant="section" message="불러오는 중…" className="py-12" />;
  if (!data) return <EmptyState message="견적 요청을 찾을 수 없습니다." />;

  const searchArea = data.areaName ?? data.stores[0]?.name ?? "";
  const kakaoSearchUrl = `https://map.kakao.com/?q=${encodeURIComponent(`${searchArea} 케이크`)}`;

  return (
    <div className={LIST_SECTION_GAP}>
      <div className="flex items-center justify-between gap-4">
        <h1 className={LIST_SCREEN_HEADING}>견적 요청 상세</h1>
        <Link to={ROUTES.CONSUMER.QUOTE_REQUESTS}>
          <Button variant="outline" size="sm">
            목록
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className={LIST_CARD}>
          <div className="px-5 py-3">
            <h2 className="mb-2 font-semibold">요청서</h2>
            <Row label="상태">
              {QUOTE_REQUEST_STATUS_LABELS[data.status]}
              {data.status === "CLOSED" &&
                (data.closeReason === "CONSUMER"
                  ? " (손님이 닫음)"
                  : data.closeReason === "ADMIN"
                    ? " (운영자가 마감)"
                    : " (기간 끝)")}
            </Row>
            <Row label="견적 마감">{data.summary.deadline}</Row>
            <Row label="픽업">{data.summary.pickup}</Row>
            <Row label="받을 동네">{data.summary.area}</Row>
            <Row label="케이크">{data.summary.cake}</Row>
            <Row label="예산">{data.summary.budget}</Row>
            <Row label="설명">{data.description ?? "-"}</Row>
            <Row label="요청 사항">{data.requestNote ?? "-"}</Row>
            <Row label="참고 사진">
              {data.photoUrls.length === 0 ? (
                "-"
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.photoUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt="참고 사진"
                        className="h-28 w-28 rounded-md object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </Row>
            <Row label="들어온 곳">{data.entry ? QUOTE_REQUEST_ENTRY_LABELS[data.entry] : "-"}</Row>
            <Row label="요청일시">{formatDateTime(data.createdAt)}</Row>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <QuoteTargetsCard req={data} />
          {!data.onlyDesignatedStores && (
            <a href={kakaoSearchUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                카카오맵에서 &quot;{searchArea} 케이크&quot; 찾기
              </Button>
            </a>
          )}

          <Card className={LIST_CARD}>
            <div className="px-5 py-3">
              <h2 className="mb-2 font-semibold">요청한 손님</h2>
              <p className="mb-2 text-xs text-muted-foreground">
                가게·디스코드에는 보내지 않아요. 문의 응대할 때만 써 주세요.
              </p>
              <Row label="닉네임">{data.consumer.nickname ?? data.consumer.name ?? "-"}</Row>
              <Row label="휴대폰">{data.consumer.phone}</Row>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
