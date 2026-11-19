/**
 * 휴대폰 홈 (SC-70, 디자인 1-A · A70e): 주간 달력 → 고른 날 픽업 + 주문 적기 → 처리할 주문 → 이번 주 매출.
 * 홈은 무엇을 할지(숫자와 한 줄 안내), 주문 탭은 주문을 보고 처리하는 곳이다(운영자 결정).
 * 고른 날 픽업은 주간 달력 바로 아래(날짜를 누르면 그 자리에서 바뀜, 기획 I-42 11-17). 직접 적은 주문도
 * 같은 달력(회색 점)·목록(시각 순)·매출에 섞는다.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppScreen, HomeHeader } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { GrayBand, GroupTitle } from "@/apps/web-seller/common/ui/List";

import { PullToRefresh } from "@/apps/web-seller/common/ui/PullToRefresh";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  mondayOfKey,
  sundayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";

import { formatWon } from "@/apps/web-seller/common/utils/won.util";

import { WeekStrip } from "@/apps/web-seller/features/home/components/mobile/WeekStrip";
import { useDayPickups } from "@/apps/web-seller/features/manual-order/hooks/queries/useDayPickups";
import { DayPickupList } from "@/apps/web-seller/features/manual-order/components/DayPickupList";
import { useDateParam } from "@/apps/web-seller/common/hooks/useDateParam";

import { mergeDayPickups } from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";

import { useStatisticsOverviewQuery } from "@/apps/web-seller/features/statistics/hooks/queries/useStatisticsOverviewQuery";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import { useMyStores } from "@/apps/web-seller/features/store/hooks/queries/useMyStores";
import { StoreSwitchSheet } from "@/apps/web-seller/features/store/components/mobile/StoreSwitchSheet";
import { useSellerNotifications } from "@/apps/web-seller/features/notification/components/providers/SellerNotificationProvider";
import { useFollowToday, useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import { PushOffBanner } from "@/apps/web-seller/features/notification/components/mobile/PushOffBanner";
import { useNotificationPreferences } from "@/apps/web-seller/features/notification/hooks/queries/useNotificationQuery";
import { usePushPermissionStore } from "@/apps/web-seller/common/store/push-permission.store";
import { isSellerAppWebView } from "@/apps/web-seller/common/utils/webview.bridge";
import { hasSeenWelcome } from "@/apps/web-seller/features/notification/utils/welcome.util";
import { useTodoTaskCounts } from "@/apps/web-seller/features/order/hooks/queries/useTodoTaskCounts";
import { TodoTaskRows } from "@/apps/web-seller/features/home/components/TodoTaskRows";

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
  // 고른 날은 주소(?date=)에도 둔다: 주문 적기·주문 상세에서 뒤로 오면 보던 날이 그대로(캘린더와 같음, 기획 I-42)
  const { selectedKey, setSelectedKey, pickDay } = useDateParam(todayKey);
  // 켜 둔 채 날짜가 바뀌면(자정, 다음 날 앱을 다시 엶) 오늘을 보고 있던 주간 달력도 새 오늘로
  useFollowToday(todayKey, (prev, next) => setSelectedKey((s) => (s === prev ? next : s)));
  const [switchOpen, setSwitchOpen] = useState(false);

  const weekStart = sundayOfKey(selectedKey);
  const weekEnd = addDaysToKey(weekStart, 6);

  const { data: store } = useStoreDetail(storeId);
  const { stores } = useMyStores();
  const notifications = useSellerNotifications();

  // 처리할 일(주문 묶음 + 견적 요청 + 답할 채팅): 휴대폰 홈·PC 홈·PC 메뉴 공용
  const todo = useTodoTaskCounts(storeId);

  // 주간 달력 점·고른 날 픽업: 그 주 Picake 주문(취소 빼고)과 직접 적은 주문(기획 I-42)
  const week = useDayPickups(storeId, weekStart, weekEnd);
  const { byDay, manualByDay, counts } = week;
  const dayPickups = useMemo(
    () => mergeDayPickups(byDay[selectedKey] ?? [], manualByDay[selectedKey] ?? []),
    [byDay, manualByDay, selectedKey],
  );

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
  const dayLoaded = week.loaded;
  const dayCount = dayLoaded ? `${dayPickups.length}건` : "";
  // 이번 주 매출: Picake(픽업 완료) + 직접 적은 주문(픽업 날이 지난, 금액 적은 주문)
  const manualSales = sales.data?.manual;
  const salesTotal = sales.data ? sales.data.totalSales + (manualSales?.totalSales ?? 0) : null;
  const salesOrders = sales.data ? sales.data.totalOrders + (manualSales?.totalOrders ?? 0) : null;
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
          onSelect={pickDay}
          onChangeWeek={(delta) => {
            // 다른 주로 가면 같은 요일을 고른다
            pickDay(addDaysToKey(selectedKey, delta * 7));
          }}
        />

        <div aria-hidden="true" className="h-px bg-ink-100" />
        <GroupTitle
          className="-mt-1"
          action={
            <span className="text-sub text-ink-600">{formatKeyMonthDayWeek(selectedKey)}</span>
          }
        >
          {dayTitle}
        </GroupTitle>
        <div className="-mt-3">
          <DayPickupList
            pickups={dayPickups}
            loaded={week.loaded}
            ordersFailed={week.ordersFailed}
            manualFailed={week.manualFailed}
            onRetryOrders={week.refetchOrders}
            onRetryManual={week.refetchManual}
            emptyText="이 날은 픽업이 없어요"
            emptyClassName="py-2 text-sub text-ink-600"
          />
        </div>
        {/* 카톡·인스타로 받은 주문 적기(기획 I-42): 고른 날이 미리 골라진다 */}
        <Button
          variant="secondary"
          size="md"
          block
          onClick={() =>
            navigate(`${ROUTES.STORE_DETAIL_MANUAL_ORDER_CREATE(storeId)}?date=${selectedKey}`)
          }
        >
          <Icon name="plus" size={18} strokeWidth={2} />
          주문 적기
        </Button>

        <GrayBand />
        <GroupTitle>처리할 일 {todo.loaded ? `${todo.total}건` : ""}</GroupTitle>
        <div className="-mt-3">
          <TodoTaskRows storeId={storeId} todo={todo} />
        </div>

        <GrayBand />
        <GroupTitle>이번 주 매출</GroupTitle>
        <Link
          to={`${ROUTES.STORE_DETAIL_STATISTICS_ORDERS(storeId)}?range=week`}
          aria-label={`이번 주 매출 ${salesTotal !== null ? formatWon(salesTotal) : ""}, 주문 통계 보기`}
          className="-mt-3 flex flex-col active:bg-ink-50"
        >
          <span className="flex min-h-13 items-center gap-3">
            <span className="min-w-0 flex-1 text-sub text-ink-600">
              픽업 완료 {salesOrders !== null ? salesOrders.toLocaleString("ko-KR") : "–"}건 ·
              월요일부터 오늘까지
            </span>
            <span className="shrink-0 text-heading font-bold tabular-nums text-ink-900">
              {salesTotal !== null ? formatWon(salesTotal) : "–"}
            </span>
            <span className="shrink-0 text-ink-400">
              <Icon name="chevronRight" size={18} strokeWidth={2} />
            </span>
          </span>
          {/* 직접 적은 주문이 있을 때만 나눠 보인다(기획 I-42) */}
          {sales.data && manualSales && manualSales.totalOrders > 0 ? (
            <span className="-mt-2 pb-2 text-sub tabular-nums text-ink-600">
              Picake {formatWon(sales.data.totalSales)} · 직접 적음{" "}
              {formatWon(manualSales.totalSales)}
            </span>
          ) : null}
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
