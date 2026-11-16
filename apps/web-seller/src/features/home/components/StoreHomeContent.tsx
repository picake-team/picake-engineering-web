import { PcLoadError } from "@/apps/web-seller/common/components/fallbacks/PcLoadError";
import React from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, ClipboardList, Newspaper } from "lucide-react";
import { cn } from "@/apps/web-seller/common/utils/classname.util";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/apps/web-seller/common/components/cards/Card";
import { BaseButton as Button } from "@/apps/web-seller/common/components/buttons/BaseButton";
import { StatusBadge } from "@/apps/web-seller/common/components/badges/StatusBadge";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import {
  getOrderStatusBadgeVariant,
  getOrderStatusLabel,
} from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import { StoreHomeStoreProfile } from "@/apps/web-seller/features/home/components/StoreHomeStoreProfile";
import { StoreBusinessCalendarPreview } from "@/apps/web-seller/features/store/components/calendar/StoreBusinessCalendarPreview";
import { StoreHomeStatisticsSection } from "@/apps/web-seller/features/home/components/StoreHomeStatisticsSection";
import { useStoreHomeDashboardQuery } from "@/apps/web-seller/features/home/hooks/queries/useStoreHomeDashboardQuery";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";
import { feedContentToExcerpt } from "@/apps/web-seller/features/home/utils/feed-excerpt.util";
import {
  HOME_CARD,
  HOME_CARD_ACTION_BUTTON,
  HOME_CARD_CONTENT,
  HOME_CARD_CONTENT_TABLE,
  HOME_CARD_HEADER,
  HOME_BODY_MUTED,
  HOME_CARD_TITLE,
  HOME_CAPTION,
  HOME_EMPHASIS,
  HOME_GRID_2_COL,
  HOME_ITEM_BOX,
  HOME_MONO,
  HOME_NUMBER,
  HOME_NUMBER_MUTED,
  HOME_SECTION_GAP,
  HOME_TABLE_CELL,
  HOME_TABLE_HEAD,
} from "@/apps/web-seller/features/home/constants/store-home-typography.constant";

export interface StoreHomeContentProps {
  storeId: string;
}

export const StoreHomeContent: React.FC<StoreHomeContentProps> = ({ storeId }) => {
  const { data: home, isLoading, isError, refetch } = useStoreHomeDashboardQuery(storeId);
  // 불러오지 못했으면 "없습니다" 대신 다시 시도(11-17)
  const homeFailed = isError && !home;

  const recentOrders = home?.recentOrders ?? [];
  const todayPickups = home?.todayPickups ?? [];
  const recentNotifications = home?.recentNotifications ?? [];
  const recentFeeds = home?.recentFeeds ?? [];

  return (
    <div className={HOME_SECTION_GAP}>
      <StoreHomeStoreProfile storeId={storeId} />

      <StoreBusinessCalendarPreview storeId={storeId} className="w-full" />

      <div className={cn("w-full", HOME_GRID_2_COL)}>
        <Card className={HOME_CARD}>
          <CardHeader className={HOME_CARD_HEADER}>
            <div className="min-w-0">
              <CardTitle className={cn("flex items-center gap-2", HOME_CARD_TITLE)}>
                <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
                최근 주문
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" className={HOME_CARD_ACTION_BUTTON} asChild>
              <Link to={ROUTES.STORE_DETAIL_ORDERS_LIST(storeId)}>주문 보기</Link>
            </Button>
          </CardHeader>
          <CardContent className={HOME_CARD_CONTENT_TABLE}>
            {isLoading ? (
              <ContentLoading variant="section" message="불러오는 중…" className="px-6 py-8" />
            ) : homeFailed ? (
              <PcLoadError onRetry={() => void refetch()} className="px-6 py-8" />
            ) : recentOrders.length === 0 ? (
              <p className={cn("px-6 py-8", HOME_BODY_MUTED)}>표시할 주문이 없습니다.</p>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className={cn("px-6 py-2", HOME_TABLE_HEAD)}>주문번호</th>
                    <th className={cn("py-2 pr-4", HOME_TABLE_HEAD)}>상품</th>
                    <th className={cn("py-2 pr-4", HOME_TABLE_HEAD)}>금액</th>
                    <th className={cn("py-2 pr-4", HOME_TABLE_HEAD)}>상태</th>
                    <th className={cn("py-2 pr-4", HOME_TABLE_HEAD)}>픽업</th>
                    <th className={cn("py-2 pr-6", HOME_TABLE_HEAD)}>접수</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((row) => (
                    <tr key={row.id} className="border-b border-border/80 last:border-0">
                      <td className={cn("px-6 py-3", HOME_MONO)}>{row.orderNumber}</td>
                      <td className={cn("max-w-[200px] truncate py-3 pr-4", HOME_TABLE_CELL)}>
                        {row.productName}
                      </td>
                      <td className={cn("py-3 pr-4", HOME_NUMBER)}>
                        ₩{row.totalPrice.toLocaleString("ko-KR")}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge variant={getOrderStatusBadgeVariant(row.orderStatus)}>
                          {getOrderStatusLabel(row.orderStatus)}
                        </StatusBadge>
                      </td>
                      <td className={cn("py-3 pr-4", HOME_NUMBER_MUTED)}>
                        {row.pickupDate != null
                          ? new Date(row.pickupDate).toLocaleString("ko-KR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className={cn("py-3 pr-6", HOME_NUMBER_MUTED)}>
                        {new Date(row.createdAt).toLocaleString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className={HOME_CARD}>
          <CardHeader className={HOME_CARD_HEADER}>
            <div className="min-w-0">
              <CardTitle className={cn("flex items-center gap-2", HOME_CARD_TITLE)}>
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                오늘 픽업 예정
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" className={HOME_CARD_ACTION_BUTTON} asChild>
              <Link to={ROUTES.STORE_DETAIL_CALENDAR(storeId)}>캘린더 보기</Link>
            </Button>
          </CardHeader>
          <CardContent className={HOME_CARD_CONTENT}>
            {isLoading ? (
              <ContentLoading variant="section" message="불러오는 중…" className="py-8" />
            ) : homeFailed ? (
              <PcLoadError onRetry={() => void refetch()} className="px-6 py-8" />
            ) : todayPickups.length === 0 ? (
              <p className={HOME_BODY_MUTED}>오늘 픽업 예정인 주문이 없습니다.</p>
            ) : (
              todayPickups.map((o) => (
                <div key={o.id} className={HOME_ITEM_BOX}>
                  <p className={HOME_MONO}>{o.orderNumber}</p>
                  <p className={HOME_BODY_MUTED}>
                    {o.productName} · {getOrderStatusLabel(o.orderStatus)}
                  </p>
                  <p className={cn("mt-1", HOME_CAPTION)}>
                    {new Date(o.pickupDate).toLocaleString("ko-KR")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className={HOME_GRID_2_COL}>
        <Card className={HOME_CARD}>
          <CardHeader className={HOME_CARD_HEADER}>
            <div className="min-w-0">
              <CardTitle className={cn("flex items-center gap-2", HOME_CARD_TITLE)}>
                <Bell className="h-4 w-4 shrink-0 text-primary" />
                최근 알림
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" className={HOME_CARD_ACTION_BUTTON} asChild>
              <Link to={ROUTES.STORE_DETAIL_NOTIFICATIONS_LIST(storeId)}>알림 보기</Link>
            </Button>
          </CardHeader>
          <CardContent className={HOME_CARD_CONTENT}>
            {isLoading ? (
              <ContentLoading variant="section" message="불러오는 중…" className="py-8" />
            ) : homeFailed ? (
              <PcLoadError onRetry={() => void refetch()} className="px-6 py-8" />
            ) : recentNotifications.length === 0 ? (
              <p className={HOME_BODY_MUTED}>알림이 없습니다.</p>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`${HOME_ITEM_BOX} ${!n.read ? "border-primary/40 bg-primary/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={HOME_EMPHASIS}>{n.title}</p>
                    {!n.read ? (
                      <span className="shrink-0 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        N
                      </span>
                    ) : null}
                  </div>
                  <p className={HOME_BODY_MUTED}>{n.body}</p>
                  <p className={cn("mt-1", HOME_CAPTION)}>
                    {new Date(n.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className={HOME_CARD}>
          <CardHeader className={HOME_CARD_HEADER}>
            <div className="min-w-0">
              <CardTitle className={cn("flex items-center gap-2", HOME_CARD_TITLE)}>
                <Newspaper className="h-4 w-4 shrink-0 text-primary" />
                최근 피드
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" className={HOME_CARD_ACTION_BUTTON} asChild>
              <Link to={ROUTES.STORE_DETAIL_FEED_LIST(storeId)}>피드 보기</Link>
            </Button>
          </CardHeader>
          <CardContent className={HOME_CARD_CONTENT}>
            {isLoading ? (
              <ContentLoading variant="section" message="불러오는 중…" className="py-8" />
            ) : homeFailed ? (
              <PcLoadError onRetry={() => void refetch()} className="px-6 py-8" />
            ) : recentFeeds.length === 0 ? (
              <p className={HOME_BODY_MUTED}>등록된 피드가 없습니다.</p>
            ) : (
              recentFeeds.map((f) => (
                <div key={f.id} className={HOME_ITEM_BOX}>
                  <p className={HOME_EMPHASIS}>{f.title}</p>
                  <p className={HOME_BODY_MUTED}>{feedContentToExcerpt(f.content)}</p>
                  <p className={cn("mt-1", HOME_CAPTION)}>
                    {new Date(f.updatedAt).toLocaleString("ko-KR")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <StoreHomeStatisticsSection storeId={storeId} />
    </div>
  );
};
