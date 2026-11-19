/**
 * PC 홈(기획 I-54, 시안 D: B 구조 + A 색).
 * 위: 숫자 칸 셋(이번 주 매출 · 이번 주 픽업 · 링크로 온 손님). 아래: 주간 보기(요일 열 + 시간별 픽업 카드) | 처리할 일.
 * 1200보다 좁으면(태블릿·작은 노트북) 처리할 일이 주간 보기 아래로 내려가 두 줄로 놓인다.
 *
 * 휴대폰 홈과 같은 데이터·같은 말이다: 처리할 일 줄은 같은 조회(주문 탭 숫자와 같은 캐시), 주간 보기는 휴대폰
 * 주간 달력 + 고른 날 픽업과 같은 useDayPickups, 이번 주 매출은 월요일부터 오늘까지 픽업 완료(+ 직접 적은 주문).
 * PC에만 더한 것: 주간 보기를 넓게, 그날 주문서 묶음 인쇄(운영자 결정 2026-11-19).
 */
import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { PcPage, PcPanel } from "@/apps/web-seller/common/ui/PcPage";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import {
  addDaysToKey,
  mondayOfKey,
  sundayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useFollowToday, useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import { useDateParam } from "@/apps/web-seller/common/hooks/useDateParam";
import { formatWon } from "@/apps/web-seller/common/utils/won.util";
import { useDayPickups } from "@/apps/web-seller/features/manual-order/hooks/queries/useDayPickups";
import { useStatisticsOverviewQuery } from "@/apps/web-seller/features/statistics/hooks/queries/useStatisticsOverviewQuery";
import { useProductList } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import {
  useStoreDetail,
  useStoreLinkStats,
} from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  calendarOrDefault,
  dayMark,
} from "@/apps/web-seller/features/store/utils/business-day.util";
import { WeekBoard, WeekNav } from "@/apps/web-seller/features/home/components/desktop/WeekBoard";
import { printOrdersPath } from "@/apps/web-seller/features/order/utils/order-print.util";
import { canExportOrPrint } from "@/apps/web-seller/common/utils/pc-extras.util";
import { useTodoTaskCounts } from "@/apps/web-seller/features/order/hooks/queries/useTodoTaskCounts";
import { TodoTaskRows } from "@/apps/web-seller/features/home/components/TodoTaskRows";

function StatTile({
  label,
  value,
  sub,
  to,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  to?: string;
}) {
  const body = (
    <>
      <span className="text-sub text-ink-600">{label}</span>
      <span className="text-[24px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-ink-900">
        {value}
      </span>
      {sub ? <span className="text-caption text-ink-600">{sub}</span> : null}
    </>
  );
  const className =
    "flex min-w-0 flex-col gap-1 rounded-card border border-ink-100 bg-white px-5 py-4";
  return to ? (
    <Link
      to={to}
      className={`${className} transition-colors duration-fast hover:border-ink-200 hover:bg-ink-50`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export const StoreDetailHomeDesktopPage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const todayKey = useKstTodayKey();
  // 보고 있는 주는 주소(?date=)에 둔다: 주문 상세에서 돌아와도 보던 주 그대로(휴대폰 홈과 같은 방식)
  const { selectedKey, setSelectedKey, pickDay } = useDateParam(todayKey);
  useFollowToday(todayKey, (prev, next) => setSelectedKey((s) => (s === prev ? next : s)));

  const weekStart = sundayOfKey(selectedKey);
  const weekEnd = addDaysToKey(weekStart, 6);
  const thisWeekStart = sundayOfKey(todayKey);
  const isThisWeek = weekStart === thisWeekStart;

  const { data: store } = useStoreDetail(storeId);
  const cal = calendarOrDefault(store?.businessCalendar);

  // 처리할 일(주문 묶음 + 견적 요청 + 답할 채팅): 휴대폰 홈·PC 홈·PC 메뉴 공용
  const todo = useTodoTaskCounts(storeId);

  // 주간 보기(보고 있는 주)와 이번 주 픽업 수(오늘이 든 주). 같은 주면 같은 조회
  const week = useDayPickups(storeId, weekStart, weekEnd);
  const thisWeek = useDayPickups(storeId, thisWeekStart, addDaysToKey(thisWeekStart, 6));
  const thisWeekCounts = Object.values(thisWeek.counts);
  const weekPicake = thisWeekCounts.reduce((s, c) => s + c.picake, 0);
  const weekManual = thisWeekCounts.reduce((s, c) => s + c.manual, 0);
  const todayCount =
    (thisWeek.counts[todayKey]?.picake ?? 0) + (thisWeek.counts[todayKey]?.manual ?? 0);

  // 이번 주 매출: 휴대폰 홈과 같은 기준(이번 주 월요일부터 오늘까지 픽업 완료 + 직접 적은 주문)
  const sales = useStatisticsOverviewQuery({
    storeId,
    startDate: mondayOfKey(todayKey),
    endDate: todayKey,
  });
  const manualSales = sales.data?.manual;
  const salesTotal = sales.data ? sales.data.totalSales + (manualSales?.totalSales ?? 0) : null;
  const salesOrders = sales.data ? sales.data.totalOrders + (manualSales?.totalOrders ?? 0) : null;

  const link = useStoreLinkStats(storeId);
  const products = useProductList({ storeId, limit: 1 });
  const noProducts = products.data?.pages[0]?.meta.totalItems === 0;

  return (
    <PcPage
      title="홈"
      actions={
        <>
          {canExportOrPrint() ? (
            <a
              href={printOrdersPath(storeId, todayKey)}
              target="_blank"
              rel="noopener"
              className="press inline-flex h-10 items-center gap-1.5 rounded-control border border-ink-200 bg-white px-4 text-sub font-bold text-ink-700 hover:bg-ink-50"
            >
              <Icon name="copy" size={16} strokeWidth={1.9} />
              오늘 주문서 인쇄
            </a>
          ) : null}
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              navigate(`${ROUTES.STORE_DETAIL_MANUAL_ORDER_CREATE(storeId)}?date=${selectedKey}`)
            }
          >
            <Icon name="plus" size={16} strokeWidth={2} />
            주문 적기
          </Button>
        </>
      }
    >
      {noProducts ? (
        <div className="flex items-center gap-3 rounded-card border border-ink-100 px-5 py-4">
          <span className="shrink-0 text-brand">
            <Icon name="cake" size={22} strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-body font-semibold text-ink-900">아직 상품이 없어요</span>
            <span className="text-caption text-ink-600">
              첫 상품을 올리면 손님이 예약할 수 있어요
            </span>
          </span>
          <Button size="md" onClick={() => navigate(ROUTES.STORE_DETAIL_PRODUCTS_CREATE(storeId))}>
            상품 등록
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="이번 주 매출"
          value={salesTotal !== null ? formatWon(salesTotal) : "–"}
          sub={`픽업 완료 ${salesOrders !== null ? salesOrders.toLocaleString("ko-KR") : "–"}건 · 월요일부터 오늘까지`}
          to={`${ROUTES.STORE_DETAIL_STATISTICS_ORDERS(storeId)}?range=week`}
        />
        <StatTile
          label="이번 주 픽업"
          value={thisWeek.loaded ? `${(weekPicake + weekManual).toLocaleString("ko-KR")}건` : "–"}
          sub={
            thisWeek.loaded
              ? `오늘 ${todayCount}건${weekManual ? ` · 직접 적음 ${weekManual}건` : ""}`
              : undefined
          }
          to={ROUTES.STORE_DETAIL_CALENDAR(storeId)}
        />
        <StatTile
          label="링크로 온 손님 (30일)"
          value={link.data ? `${link.data.visitorCount.toLocaleString("ko-KR")}명` : "–"}
          sub={
            link.data
              ? `예약 신청 ${link.data.reservationCount.toLocaleString("ko-KR")}건`
              : undefined
          }
          to={ROUTES.STORE_DETAIL_MENU(storeId)}
        />
      </div>

      <div className="grid items-start gap-4 nav:grid-cols-[minmax(0,1fr)_340px]">
        <PcPanel
          title="이번 주"
          labelledBy="home-week"
          action={
            <>
              <WeekNav
                weekStartKey={weekStart}
                isThisWeek={isThisWeek}
                onPrev={() => pickDay(addDaysToKey(selectedKey, -7))}
                onNext={() => pickDay(addDaysToKey(selectedKey, 7))}
                onThisWeek={() => pickDay(todayKey)}
              />
              <Link
                to={ROUTES.STORE_DETAIL_CALENDAR(storeId)}
                className="ml-1 inline-flex min-h-9 items-center gap-0.5 rounded-control px-2 text-sub font-semibold text-ink-600 hover:bg-ink-50"
              >
                캘린더 보기
                <Icon name="chevronRight" size={16} />
              </Link>
            </>
          }
        >
          {week.ordersFailed ? (
            <div className="flex flex-col items-start gap-2 py-6">
              <p className="text-body text-ink-700">픽업을 불러오지 못했어요</p>
              <Button variant="secondary" size="md" onClick={week.refetchOrders}>
                다시 시도
              </Button>
            </div>
          ) : (
            <>
              <WeekBoard
                weekStartKey={weekStart}
                todayKey={todayKey}
                byDay={week.byDay}
                manualByDay={week.manualByDay}
                markOf={(key) => dayMark(key, cal)}
                loaded={week.loaded}
              />
              {/* 직접 적은 주문만 못 불러오면 Picake 주문은 그대로 보이고 따로 알린다(휴대폰 홈·캘린더와 같음) */}
              {week.manualFailed ? (
                <LoadErrorState
                  title="직접 적은 주문을 불러오지 못했어요"
                  onRetry={week.refetchManual}
                />
              ) : null}
            </>
          )}
        </PcPanel>

        <PcPanel
          title={`처리할 일 ${todo.loaded ? `${todo.total}건` : ""}`.trim()}
          labelledBy="home-tasks"
        >
          <div className="grid gap-x-6 sm:grid-cols-2 nav:grid-cols-1">
            <TodoTaskRows storeId={storeId} todo={todo} />
          </div>
        </PcPanel>
      </div>
    </PcPage>
  );
};
