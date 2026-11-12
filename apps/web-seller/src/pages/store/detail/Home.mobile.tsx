/**
 * 휴대폰 홈 (SC-70, 디자인 1-A · A70e): 주간 달력 → 처리할 주문 → 고른 날 픽업 → 이번 주 매출.
 * 홈은 무엇을 할지(숫자와 한 줄 안내), 주문 탭은 주문을 보고 처리하는 곳이다(운영자 결정).
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppScreen, HomeHeader } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import {
  GrayBand,
  GroupTitle,
  ListRowLink,
  RowCount,
  RowIconBox,
} from "@/apps/web-seller/common/ui/List";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { PullToRefresh } from "@/apps/web-seller/common/ui/PullToRefresh";
import { Icon, TaskIcon } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  kstDateKey,
  mondayOfKey,
  sundayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useCalendarMonthOrders } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import { useOrderStatusGroup } from "@/apps/web-seller/features/order/hooks/queries/useOrderMobileQuery";
import {
  CANCELED_ORDER_STATUSES,
  formatWon,
  groupsForTab,
  type OrderTaskGroup,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { PickupRow } from "@/apps/web-seller/features/order/components/mobile/OrderCards";
import { WeekStrip } from "@/apps/web-seller/features/home/components/mobile/WeekStrip";
import { useStatisticsOverviewQuery } from "@/apps/web-seller/features/statistics/hooks/queries/useStatisticsOverviewQuery";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { StoreSwitchSheet } from "@/apps/web-seller/features/store/components/mobile/StoreSwitchSheet";
import { useSellerNotifications } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";
import { useFollowToday, useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import { PushOffBanner } from "@/apps/web-seller/features/notification/components/mobile/PushOffBanner";
import { useNotificationPreferences } from "@/apps/web-seller/features/notification/hooks/queries/useNotificationQuery";
import { usePushPermissionStore } from "@/apps/web-seller/common/store/push-permission.store";
import { isSellerAppWebView } from "@/apps/web-seller/common/utils/webview.bridge";
import { hasSeenWelcome } from "@/apps/web-seller/features/notification/utils/welcome.util";
import { useSellerChatUnread } from "@/apps/web-seller/features/chat/hooks/useChat";

const TODO_GROUPS = groupsForTab("todo");

function TaskRow({
  storeId,
  group,
  count,
  last,
}: {
  storeId: string;
  group: OrderTaskGroup;
  count: number | undefined;
  last: boolean;
}) {
  const zero = !count;
  return (
    <ListRowLink
      to={`${ROUTES.STORE_DETAIL_ORDERS_LIST(storeId)}?tab=todo&group=${group.key}`}
      tall
      divider={!last}
      dimmed={zero}
      leading={
        <RowIconBox>{group.icon ? <TaskIcon name={group.icon} active={!zero} /> : null}</RowIconBox>
      }
      title={group.label}
      description={group.homeHint}
      trailing={<RowCount value={count ?? "–"} dimmed={zero} />}
    />
  );
}

function FirstProductCard({ storeId }: { storeId: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 rounded-card border border-ink-100 px-4 py-3">
      <span className="shrink-0 text-brand">
        <Icon name="cake" size={22} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body font-semibold text-ink-900">아직 상품이 없어요</span>
        <span className="text-caption text-ink-600">첫 상품을 올리면 손님이 예약할 수 있어요</span>
      </span>
      <Button size="md" onClick={() => navigate(ROUTES.STORE_DETAIL_PRODUCTS_CREATE(storeId))}>
        상품 등록
      </Button>
    </div>
  );
}

export const StoreDetailHomeMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const todayKey = useKstTodayKey();
  const [selectedKey, setSelectedKey] = useState(todayKey);
  // 켜 둔 채 날짜가 바뀌면(자정, 다음 날 앱을 다시 엶) 오늘을 보고 있던 주간 달력도 새 오늘로
  useFollowToday(todayKey, (prev, next) => setSelectedKey((s) => (s === prev ? next : s)));
  const [switchOpen, setSwitchOpen] = useState(false);

  const weekStart = sundayOfKey(selectedKey);
  const weekEnd = addDaysToKey(weekStart, 6);

  const { data: store } = useStoreDetail(storeId);
  const { stores } = useMyStores();
  const notifications = useSellerNotifications();

  // 처리할 주문: 상태마다 전체 수(주문 탭 칸과 같은 조회라 캐시를 같이 쓴다)
  const confirm = useOrderStatusGroup(storeId, TODO_GROUPS[0].status);
  const deposit = useOrderStatusGroup(storeId, TODO_GROUPS[1].status);
  const pickup = useOrderStatusGroup(storeId, TODO_GROUPS[2].status);
  const refund = useOrderStatusGroup(storeId, TODO_GROUPS[3].status);
  const taskQueries = [confirm, deposit, pickup, refund];
  const tasksLoaded = taskQueries.every((q) => q.total !== undefined);
  // 답할 채팅(기획 I-11): "처리할 일"에 한 줄 더한다
  const chat = useSellerChatUnread(storeId);
  const chatReply = chat.data?.replyNeeded ?? 0;
  const taskTotal = taskQueries.reduce((sum, q) => sum + (q.total ?? 0), 0) + chatReply;

  // 주간 달력 점·고른 날 픽업: 그 주 픽업 주문(취소된 주문은 빼고 셈)
  const weekQuery = useCalendarMonthOrders(storeId, weekStart, weekEnd);
  const byDay = useMemo(() => {
    const map: Record<string, OrderResponseDto[]> = {};
    for (const o of weekQuery.data?.data ?? []) {
      if (CANCELED_ORDER_STATUSES.includes(o.orderStatus)) continue;
      const key = kstDateKey(o.pickupDate);
      (map[key] ??= []).push(o);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime());
    }
    return map;
  }, [weekQuery.data]);
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const key of Object.keys(byDay)) out[key] = byDay[key].length;
    return out;
  }, [byDay]);
  const dayOrders = byDay[selectedKey] ?? [];

  // 이번 주 매출: 주문 통계와 같은 기준(이번 주 월요일부터 오늘까지 접수한 주문 중 픽업 완료)
  const sales = useStatisticsOverviewQuery({
    storeId,
    startDate: mondayOfKey(todayKey),
    endDate: todayKey,
  });

  const prefs = useNotificationPreferences(storeId);
  const pushStatus = usePushPermissionStore((st) => st.status);
  // 앱에서 처음이면(알림을 아직 묻지 않았고 안내를 안 봤으면) 처음 사용 안내(SC-69)로
  useEffect(() => {
    if (isSellerAppWebView() && pushStatus === "notDetermined" && !hasSeenWelcome()) {
      navigate(ROUTES.STORE_DETAIL_WELCOME(storeId), { replace: true });
    }
  }, [pushStatus, storeId, navigate]);

  const products = useProductList({ storeId, limit: 1 });
  const noProducts = products.data?.pages[0]?.meta.totalItems === 0;

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["order"] }),
      queryClient.invalidateQueries({ queryKey: ["statistics"] }),
      queryClient.invalidateQueries({ queryKey: ["chat"] }),
      notifications ? queryClient.invalidateQueries({ queryKey: ["notification"] }) : null,
    ]);

  const isToday = selectedKey === todayKey;
  // 불러오는 동안은 건수를 비운다("0건"으로 보이면 픽업이 없는 줄 안다)
  const dayCount = weekQuery.data ? `${dayOrders.length}건` : "";
  const dayTitle = isToday
    ? `오늘 픽업 ${dayCount}`.trim()
    : `${formatKeyMonthDayWeek(selectedKey)} 픽업 ${dayCount}`.trim();

  return (
    <AppScreen
      tab="home"
      storeId={storeId}
      header={
        <HomeHeader
          storeName={store?.name ?? ""}
          switchable={stores.length > 1}
          onSwitchStore={() => setSwitchOpen(true)}
          unreadCount={notifications?.unreadCount ?? 0}
          onOpenNotifications={() => navigate(ROUTES.STORE_DETAIL_NOTIFICATIONS_LIST(storeId))}
        />
      }
    >
      <PullToRefresh onRefresh={refresh}>
        <PushOffBanner
          storeId={storeId}
          orderNotificationsEnabled={prefs.data?.orderNotificationsEnabled}
        />
        {noProducts ? <FirstProductCard storeId={storeId} /> : null}

        {/* 캘린더는 아래 탭에서 빠져(채팅 탭) 여기서 들어간다 */}
        <GroupTitle
          className="-mb-3"
          action={
            <Link
              to={ROUTES.STORE_DETAIL_CALENDAR(storeId)}
              className="-mr-2 inline-flex min-h-11 items-center gap-0.5 px-2 text-sub font-semibold text-ink-600 active:bg-ink-50"
            >
              캘린더 보기
              <Icon name="chevronRight" size={16} />
            </Link>
          }
        >
          이번 주
        </GroupTitle>
        <WeekStrip
          weekStartKey={weekStart}
          selectedKey={selectedKey}
          todayKey={todayKey}
          countsByDay={counts}
          onSelect={setSelectedKey}
          onChangeWeek={(delta) => {
            // 다른 주로 가면 같은 요일을 고른다
            const next = addDaysToKey(selectedKey, delta * 7);
            setSelectedKey(next);
          }}
        />

        <GrayBand />
        <GroupTitle>처리할 일 {tasksLoaded ? `${taskTotal}건` : ""}</GroupTitle>
        <div className="-mt-3">
          {TODO_GROUPS.map((g, i) => (
            <TaskRow
              key={g.key}
              storeId={storeId}
              group={g}
              count={taskQueries[i].total}
              last={false}
            />
          ))}
          <ListRowLink
            to={ROUTES.STORE_DETAIL_CHATS(storeId)}
            tall
            divider={false}
            dimmed={chatReply === 0}
            leading={
              <RowIconBox>
                <TaskIcon name="chat" active={chatReply > 0} />
              </RowIconBox>
            }
            title="답할 채팅"
            description="손님이 답을 기다려요"
            trailing={<RowCount value={chatReply} dimmed={chatReply === 0} />}
          />
        </div>

        <GrayBand />
        <GroupTitle
          action={
            <span className="text-sub text-ink-600">{formatKeyMonthDayWeek(selectedKey)}</span>
          }
        >
          {dayTitle}
        </GroupTitle>
        <div className="-mt-3">
          {weekQuery.isError && !weekQuery.data ? (
            <LoadErrorState onRetry={() => void weekQuery.refetch()} />
          ) : weekQuery.isLoading ? (
            <span className="block h-16 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
          ) : dayOrders.length === 0 ? (
            <p className="py-2 text-sub text-ink-600">이 날은 픽업이 없어요</p>
          ) : (
            dayOrders.map((o, i) => (
              <PickupRow key={o.id} order={o} last={i === dayOrders.length - 1} />
            ))
          )}
        </div>

        <GrayBand />
        <GroupTitle>이번 주 매출</GroupTitle>
        <Link
          to={`${ROUTES.STORE_DETAIL_STATISTICS_ORDERS(storeId)}?range=week`}
          aria-label={`이번 주 매출 ${sales.data ? formatWon(sales.data.totalSales) : ""}, 주문 통계 보기`}
          className="-mt-3 flex min-h-13 items-center gap-3 active:bg-ink-50"
        >
          <span className="min-w-0 flex-1 text-sub text-ink-600">
            픽업 완료 {sales.data ? sales.data.totalOrders.toLocaleString("ko-KR") : "–"}건 ·
            월요일부터 오늘까지
          </span>
          <span className="shrink-0 text-heading font-bold tabular-nums text-ink-900">
            {sales.data ? formatWon(sales.data.totalSales) : "–"}
          </span>
          <span className="shrink-0 text-ink-400">
            <Icon name="chevronRight" size={18} strokeWidth={2} />
          </span>
        </Link>
      </PullToRefresh>

      <StoreSwitchSheet
        open={switchOpen}
        currentStoreId={storeId}
        onClose={() => setSwitchOpen(false)}
      />
    </AppScreen>
  );
};
