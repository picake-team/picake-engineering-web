import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/apps/web-seller/common/components/tabs/Tabs";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import { useSellerNotificationsRequired } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";
import type { SellerNotificationItem } from "@/apps/web-seller/features/notification/types/notification.dto";
import { Bell, ChevronRight } from "lucide-react";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";

/** 알림 행 클릭 시 읽음 처리 후 주문 상세로 이동 (주문 알림 전제). */
function NotificationListCard(props: {
  entries: SellerNotificationItem[];
  emptyLabel: string;
  onRowClick: (orderId: string, id: string) => void;
}) {
  const { entries, emptyLabel, onRowClick } = props;
  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Bell className="h-10 w-10 opacity-40" />
            <p className="text-sm">{emptyLabel}</p>
          </div>
        ) : (
          <ul className="divide-y">
            {entries.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onRowClick(n.orderId, n.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                      n.read
                        ? "border-border/60 bg-muted/40 text-muted-foreground"
                        : "border-primary/25 bg-primary/[0.07] text-primary",
                    )}
                    aria-hidden
                  >
                    <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="block text-base font-medium leading-snug text-foreground">
                      {n.title}
                    </span>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-muted-foreground/70"
                    strokeWidth={2}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** 스토어 알림 목록: 탭(전체/미읽음)·모두 읽음은 Provider 데이터 사용 */
export const StoreDetailNotificationsListPage: React.FC = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { items, markRead, markAllRead, isListLoading } = useSellerNotificationsRequired();
  const [tab, setTab] = useState<"all" | "unread">("all");

  if (!storeId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어가 선택되지 않았습니다.</h2>
      </div>
    );
  }

  const onRowClick = (orderId: string, id: string) => {
    markRead(id);
    navigate(ROUTES.STORE_DETAIL_ORDERS_DETAIL(storeId, orderId));
  };

  if (isListLoading && items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">알림 목록</h1>
        <ContentLoading variant="page" message="알림을 불러오는 중…" showLogo />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">알림 목록</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <TabsList className="w-full justify-start sm:w-auto">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="unread">안 읽음</TabsTrigger>
          </TabsList>
          <Button
            variant="secondary"
            className="w-full shrink-0 sm:w-auto"
            onClick={markAllRead}
            disabled={items.every((n) => n.read)}
          >
            모두 읽음
          </Button>
        </div>
        <TabsContent value="all" className="mt-4">
          <NotificationListCard
            emptyLabel="알림이 없습니다."
            entries={items}
            onRowClick={onRowClick}
          />
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          <NotificationListCard
            emptyLabel="읽지 않은 알림이 없습니다."
            entries={items.filter((n) => !n.read)}
            onRowClick={onRowClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
