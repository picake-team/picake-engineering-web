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
  CHAT_REPORT_REASON_LABELS,
  CHAT_SIDE_LABELS,
  formatKst,
  hoursLeft,
  useChatReports,
  type ChatReportStatus,
} from "@/apps/web-admin/features/chat-management/chat-management";

const TABS: { key: ChatReportStatus | "ALL"; label: string }[] = [
  { key: "OPEN", label: "처리할 것" },
  { key: "RESOLVED", label: "처리함" },
  { key: "ALL", label: "전체" },
];

/**
 * 채팅 > 신고(기획 I-11). 24시간 안에 처리한다(애플 1.2).
 * 새 신고는 디스코드 【PICAKE】운영으로도 바로 알린다(대화 내용은 보내지 않음).
 */
export const ChatReportsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ChatReportStatus | "ALL">("OPEN");
  const { data, isLoading } = useChatReports(tab === "ALL" ? undefined : tab);
  const items = data?.reports ?? [];

  return (
    <div className={LIST_SECTION_GAP}>
      <h1 className={LIST_SCREEN_HEADING}>채팅 신고</h1>

      <div className={LIST_FILTER_PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <Button
                key={t.key}
                size="sm"
                variant={tab === t.key ? "default" : "outline"}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className={LIST_STATS_TEXT}>
            최근 100건 중 <span className="font-semibold text-foreground">{items.length}</span>건
          </div>
        </div>
      </div>

      {isLoading ? (
        <ContentLoading variant="section" message="신고를 불러오는 중…" className="py-12" />
      ) : items.length === 0 ? (
        <EmptyState message={tab === "OPEN" ? "처리할 신고가 없습니다." : "신고가 없습니다."} />
      ) : (
        <Card className={LIST_CARD}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {["상태", "이유", "신고한 쪽", "가게", "신고 일시", "처리 기한", ""].map((h) => (
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
                {items.map((item) => {
                  const left = hoursLeft(item.createdAt);
                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-b border-border/80 last:border-0 hover:bg-muted/40"
                      onClick={() => navigate(ROUTES.CHAT.REPORT_DETAIL(item.id))}
                    >
                      <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>
                        {item.status === "OPEN" ? "처리할 것" : "처리함"}
                      </td>
                      <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>
                        {CHAT_REPORT_REASON_LABELS[item.reason]}
                      </td>
                      <td className={cn("px-4 py-3", LIST_TABLE_CELL_MUTED)}>
                        {CHAT_SIDE_LABELS[item.reporter]}
                      </td>
                      <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>{item.shopName}</td>
                      <td className={cn("px-4 py-3", LIST_TABLE_CELL_MUTED)}>
                        {formatKst(item.createdAt)}
                      </td>
                      <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>
                        {item.status === "RESOLVED" ? (
                          <span className="text-muted-foreground">
                            {item.resolvedAt ? formatKst(item.resolvedAt) : "-"}
                          </span>
                        ) : left < 0 ? (
                          <span className="font-semibold text-destructive">지남</span>
                        ) : (
                          <span className={cn(left < 6 && "font-semibold text-destructive")}>
                            {left}시간 남음
                          </span>
                        )}
                      </td>
                      <td className={cn("px-4 py-3", LIST_TABLE_CELL)}>
                        <Button variant="outline" size="sm">
                          상세
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
