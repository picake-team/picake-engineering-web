import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BaseButton as Button } from "@/apps/web-admin/common/components/buttons/BaseButton";
import { Card } from "@/apps/web-admin/common/components/cards/Card";
import { EmptyState } from "@/apps/web-admin/common/components/fallbacks/EmptyState";
import { ContentLoading } from "@/apps/web-admin/common/components/loading/ContentLoading";
import {
  LIST_CARD,
  LIST_FILTER_PANEL,
  LIST_SCREEN_HEADING,
  LIST_SECTION_GAP,
  LIST_STATS_TEXT,
  LIST_TABLE_CELL,
  LIST_TABLE_CELL_MUTED,
  LIST_TABLE_HEAD,
} from "@/apps/web-admin/common/constants/list-typography.constant";
import { ROUTES } from "@/apps/web-admin/common/constants/paths.constant";
import { cn } from "@/apps/web-admin/common/utils/classname.util";
import {
  QUOTE_REQUEST_ENTRY_LABELS,
  QUOTE_REQUEST_STATUS_LABELS,
  formatDateTime,
  useQuoteRequestList,
  type QuoteRequestStatus,
} from "@/apps/web-admin/features/quote-request-management/quote-request-management";

const PAGE_SIZE = 20;
const TABS: { key: QuoteRequestStatus | "ALL"; label: string }[] = [
  { key: "OPEN", label: "견적 받는 중" },
  { key: "CONNECTED", label: "가게 연결" },
  { key: "CLOSED", label: "마감" },
  { key: "ALL", label: "전체" },
];

/**
 * 구매자 > 견적 요청(기획 I-46 SC-45).
 * 견적 받는 중은 마감이 가까운 순. 새 요청은 디스코드 【PICAKE】운영으로도 바로 알린다.
 */
export const QuoteRequestsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<QuoteRequestStatus | "ALL">("OPEN");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuoteRequestList({
    status: tab === "ALL" ? undefined : tab,
    page,
    limit: PAGE_SIZE,
  });
  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className={LIST_SECTION_GAP}>
      <h1 className={LIST_SCREEN_HEADING}>견적 요청</h1>

      <div className={LIST_FILTER_PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <Button
                key={t.key}
                size="sm"
                variant={tab === t.key ? "default" : "outline"}
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className={LIST_STATS_TEXT}>
            <span className="font-semibold text-foreground">{meta?.totalItems ?? 0}</span>건
          </div>
        </div>
      </div>

      {isLoading ? (
        <ContentLoading variant="section" message="견적 요청을 불러오는 중…" className="py-12" />
      ) : items.length === 0 ? (
        <EmptyState message="견적 요청이 없습니다." />
      ) : (
        <Card className={LIST_CARD}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {[
                    "상태",
                    "케이크",
                    "픽업",
                    "받을 동네",
                    "예산",
                    "견적 마감",
                    "견적",
                    "들어온 곳",
                    "요청일시",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className={cn("whitespace-nowrap px-4 py-3 text-left", LIST_TABLE_HEAD)}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-border/80 last:border-0 hover:bg-muted/40"
                    onClick={() => navigate(ROUTES.CONSUMER.QUOTE_REQUEST_DETAIL(item.id))}
                  >
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>
                      {QUOTE_REQUEST_STATUS_LABELS[item.status]}
                    </td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>
                      <div className="font-medium">{item.summary.cake}</div>
                      <div className="text-xs text-muted-foreground">
                        사진 {item.photoCount}장 · 넣은 가게 {item.storeCount}곳
                      </div>
                    </td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL_MUTED)}>
                      {item.summary.pickup}
                    </td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL_MUTED)}>{item.summary.area}</td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL_MUTED)}>
                      {item.summary.budget}
                    </td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>{item.summary.deadline}</td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL_MUTED)}>{item.quoteCount}</td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL_MUTED)}>
                      {item.entry ? QUOTE_REQUEST_ENTRY_LABELS[item.entry] : "-"}
                    </td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL_MUTED)}>
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>
                      <Button variant="outline" size="sm">
                        상세
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            이전
          </Button>
          <div className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page === meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};
