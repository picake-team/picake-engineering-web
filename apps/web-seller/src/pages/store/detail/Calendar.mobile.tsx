/**
 * 휴대폰 캘린더 (SC-79, 디자인 4-A · 4-B): 달력 하나(안쪽 탭 없음).
 * 날짜 아래 그날 픽업 = 점(3건까지, Picake 주황·직접 적은 주문 회색, 취소 빼고) 또는 4건부터 숫자.
 * 픽업이 없으면 "휴무"·그날만 바꾼 날 "바꿈". 그 아래 대목 이름(이브·성탄절 등, 기획 I-42).
 * 날짜를 누르면 아래가 그날 픽업(Picake + 직접 적은 주문 시각 순)으로 바뀌고, 화면 아래 "○월 ○일 주문 적기"는
 * 고른 날로 주문 적기를 연다. 오른쪽 위 버튼은 다른 캘린더로 내보내기.
 * 그날만 영업을 바꾸는 것은 휴대폰에서 하지 않는다(운영자 결정, PC 캘린더에서). 쉬는 요일·영업시간은 스토어 탭 "영업시간".
 */
import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppScreen, BackHeader, BottomActionBar } from "@/apps/web-seller/common/ui/Screen";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  isDateKey,
  kstDateKey,
  monthEndKey,
  monthStartKey,
  shiftMonthKey,
  weekdayLabel,
  weekdayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useFollowToday, useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import { useCalendarMonthOrders } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import { CANCELED_ORDER_STATUSES } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { PickupRow } from "@/apps/web-seller/features/order/components/mobile/OrderCards";
import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";
import { DayMarks, DayTag } from "@/apps/web-seller/features/manual-order/components/DayMarks";
import { ManualPickupRow } from "@/apps/web-seller/features/manual-order/components/ManualPickupRow";
import { CalendarExportSheet } from "@/apps/web-seller/features/manual-order/components/CalendarExportSheet";
import { useManualOrdersInRange } from "@/apps/web-seller/features/manual-order/hooks/useManualOrderQuery";
import {
  groupManualByDay,
  mergeDayPickups,
  pickupCountsByDay,
} from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  calendarOrDefault,
  dayMark,
  effectiveRule,
} from "@/apps/web-seller/features/store/utils/business-day.util";

const SWIPE_PX = 56;

export const StoreDetailCalendarMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const todayKey = useKstTodayKey();
  // 고른 날은 주소(?date=)에도 둔다: 주문 적기·상세에서 뒤로 오면 보던 날이 그대로 열리게(기획 I-42)
  const [params, setParams] = useSearchParams();
  const dateParam = params.get("date");
  const initialKey = isDateKey(dateParam) ? dateParam : todayKey;
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const [monthKey, setMonthKey] = useState(() => monthStartKey(initialKey));
  /** 사장님이 날짜를 고르면 주소도 바꾼다(뒤로 가기 기록은 늘리지 않음) */
  const pickDay = (key: string) => {
    setSelectedKey(key);
    setParams({ date: key }, { replace: true });
  };
  // 켜 둔 채 날짜가 바뀌면 오늘을 보고 있던 칸·달도 새 오늘로(다른 날을 골라 뒀으면 그대로)
  useFollowToday(todayKey, (prev, next) => {
    setSelectedKey((s) => (s === prev ? next : s));
    setMonthKey((m) => (m === monthStartKey(prev) ? monthStartKey(next) : m));
  });
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const { data: store } = useStoreDetail(storeId);
  const cal = calendarOrDefault(store?.businessCalendar);
  const monthEnd = monthEndKey(monthKey);
  const monthQuery = useCalendarMonthOrders(storeId, monthKey, monthEnd);

  const byDay = useMemo(() => {
    const map: Record<string, OrderResponseDto[]> = {};
    for (const o of monthQuery.data?.data ?? []) {
      if (CANCELED_ORDER_STATUSES.includes(o.orderStatus)) continue;
      const key = kstDateKey(o.pickupDate);
      (map[key] ??= []).push(o);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime());
    }
    return map;
  }, [monthQuery.data]);

  // 직접 적은 주문(기획 I-42): 같은 달
  const monthManual = useManualOrdersInRange(storeId, monthKey, monthEnd);
  const manualByDay = useMemo(() => groupManualByDay(monthManual.data), [monthManual.data]);
  const counts = useMemo(() => pickupCountsByDay(byDay, manualByDay), [byDay, manualByDay]);

  const [y, m] = monthKey.split("-").map(Number);
  const firstWeekday = weekdayOfKey(monthKey);
  const days: string[] = [];
  for (let k = monthKey; k <= monthEnd; k = addDaysToKey(k, 1)) days.push(k);

  const goMonth = (delta: number) => {
    const next = shiftMonthKey(monthKey, delta);
    setMonthKey(next);
    // 이번 달로 돌아오면 오늘, 아니면 그달 1일을 고른다
    pickDay(next === monthStartKey(todayKey) ? todayKey : next);
  };

  const selectedPickups = useMemo(
    () => mergeDayPickups(byDay[selectedKey] ?? [], manualByDay[selectedKey] ?? []),
    [byDay, manualByDay, selectedKey],
  );
  const monthLoaded = Boolean(monthQuery.data) && Boolean(monthManual.data);
  const selectedTag = cakeDayOf(selectedKey);
  const [selMonth, selDay] = [Number(selectedKey.slice(5, 7)), Number(selectedKey.slice(8))];
  const selectedRule = effectiveRule(selectedKey, cal);
  const inMonth = selectedKey.slice(0, 7) === monthKey.slice(0, 7);

  return (
    // 아래 탭에서 빠지고(채팅 탭, 운영자 결정 11-11) 홈 "캘린더 보기"로 들어오는 안쪽 화면
    <AppScreen
      header={
        <BackHeader
          title="캘린더"
          onBack={() => navigate(ROUTES.STORE_DETAIL_HOME(storeId))}
          actions={
            <button
              type="button"
              aria-label="다른 캘린더로 내보내기"
              onClick={() => setExportOpen(true)}
              className="mr-1 inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
            >
              <Icon name="share" size={22} strokeWidth={1.8} />
            </button>
          }
        />
      }
      bodyClassName="gap-2"
      footer={
        <BottomActionBar>
          <Button
            block
            onClick={() =>
              navigate(`${ROUTES.STORE_DETAIL_MANUAL_ORDER_CREATE(storeId)}?date=${selectedKey}`)
            }
          >
            {selMonth}월 {selDay}일 주문 적기
          </Button>
        </BottomActionBar>
      }
    >
      <div className="flex items-center justify-between">
        <h2 className="text-heading font-bold text-ink-900" aria-live="polite">
          {y}년 {m}월
        </h2>
        <div className="flex items-center">
          <button
            type="button"
            aria-label="지난달"
            onClick={() => goMonth(-1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
          >
            <Icon name="back" size={24} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => goMonth(1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-900 active:bg-ink-50"
          >
            <span className="rotate-180">
              <Icon name="back" size={24} strokeWidth={1.8} />
            </span>
          </button>
          <Button
            variant="secondary"
            size="md"
            className="ml-1 px-3"
            onClick={() => {
              setMonthKey(monthStartKey(todayKey));
              pickDay(todayKey);
            }}
          >
            오늘
          </Button>
        </div>
      </div>

      <div
        className="touch-pan-y"
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5)
            goMonth(dx < 0 ? 1 : -1);
        }}
      >
        <div className="grid grid-cols-7 text-center text-caption text-ink-600" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>{weekdayLabel(i)}</span>
          ))}
        </div>
        <div className="grid grid-cols-7" role="grid" aria-label={`${y}년 ${m}월 달력`}>
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden="true" />
          ))}
          {days.map((key) => {
            const mark = dayMark(key, cal);
            const count = counts[key];
            const total = (count?.picake ?? 0) + (count?.manual ?? 0);
            const tag = cakeDayOf(key);
            const selected = key === selectedKey;
            const today = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                aria-label={`${formatKeyMonthDayWeek(key)}${today ? " 오늘" : ""}${
                  tag ? `, ${tag.full}` : ""
                }${mark === "closed" ? ", 휴무" : mark === "changed" ? ", 영업 바꿈" : ""}, 픽업 ${total}건`}
                onClick={() => pickDay(key)}
                className={cx(
                  "flex flex-col items-center gap-1 py-1",
                  mark === "closed" && !selected ? "text-ink-500" : "text-ink-900",
                )}
              >
                <span
                  className={cx(
                    "flex size-8 items-center justify-center rounded-full text-body tabular-nums",
                    selected
                      ? "bg-brand font-bold text-white"
                      : today
                        ? "font-bold text-brand-ink"
                        : "font-normal",
                  )}
                >
                  {Number(key.slice(8))}
                </span>
                {/* 픽업이 있으면 쉬는 날에도 픽업을 먼저(직접 적은 주문은 쉬는 날에도 적을 수 있다) */}
                {total === 0 && mark === "closed" ? (
                  <span className="h-[15px] text-tab leading-[15px] text-ink-600">휴무</span>
                ) : total === 0 && mark === "changed" ? (
                  <span className="h-[15px] text-tab font-bold leading-[15px] text-brand-ink">
                    바꿈
                  </span>
                ) : (
                  <DayMarks count={count} />
                )}
                {/* 대목이 있는 날만(그 주만 한 줄 높아지고 다른 주는 그대로) */}
                {tag ? <DayTag label={tag.short} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-hidden="true" className="h-px bg-ink-100" />

      {inMonth ? (
        <>
          <h2 className="mt-1 flex items-baseline justify-between gap-2 text-group font-bold text-ink-900">
            <span className="min-w-0">
              {formatKeyMonthDayWeek(selectedKey)} ·{" "}
              {!selectedRule.isOpen && (!monthLoaded || selectedPickups.length === 0)
                ? "쉬는 날"
                : monthLoaded
                  ? `픽업 ${selectedPickups.length}건`
                  : "픽업"}
            </span>
            {selectedTag ? (
              <span className="shrink-0 text-sub font-normal text-ink-600">{selectedTag.full}</span>
            ) : null}
          </h2>
          {(monthQuery.isError && !monthQuery.data) ||
          (monthManual.isError && !monthManual.data) ? (
            <LoadErrorState
              onRetry={() => {
                void monthQuery.refetch();
                void monthManual.refetch();
              }}
            />
          ) : !monthLoaded ? (
            // 불러오는 동안은 회색 뼈대(글자 "불러오는 중…" 대신, 다른 화면과 같게)
            <span className="block h-16 animate-pulse rounded-card bg-ink-50" aria-busy="true" />
          ) : selectedPickups.length > 0 ? (
            <div className="-mt-1">
              {selectedPickups.map((p, i) =>
                p.kind === "order" ? (
                  <PickupRow key={p.id} order={p.order} last={i === selectedPickups.length - 1} />
                ) : (
                  <ManualPickupRow
                    key={p.id}
                    manual={p.manual}
                    last={i === selectedPickups.length - 1}
                  />
                ),
              )}
            </div>
          ) : (
            <p className="text-sub text-ink-600">
              {selectedRule.isOpen ? "이 날은 픽업이 없어요" : "쉬는 날이라 픽업이 없어요"}
            </p>
          )}
        </>
      ) : null}
      <CalendarExportSheet
        storeId={storeId}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </AppScreen>
  );
};
