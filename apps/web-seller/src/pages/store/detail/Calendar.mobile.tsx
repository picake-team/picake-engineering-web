/**
 * 휴대폰 캘린더 탭 (SC-79, 디자인 4-A · 4-B): 달력 하나(안쪽 탭 없음).
 * 날짜 아래 점 = 그날 픽업 수(3개까지, 취소 빼고), "휴무", 그날만 바꾼 날 "바꿈".
 * 날짜를 누르면 아래가 그날 픽업으로 바뀐다. 그날만 영업을 바꾸는 것은 휴대폰에서 하지 않는다(운영자 결정
 * 2026-11-06, PC 캘린더에서). 쉬는 요일·영업시간은 스토어 탭 "영업시간".
 */
import React, { useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AppScreen, TabHeader } from "@/apps/web-seller/common/ui/Screen";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  kstDateKey,
  monthEndKey,
  monthStartKey,
  shiftMonthKey,
  weekdayLabel,
  weekdayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useCalendarMonthOrders } from "@/apps/web-seller/features/order/hooks/queries/useOrderQuery";
import { CANCELED_ORDER_STATUSES } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { PickupRow } from "@/apps/web-seller/features/order/components/mobile/OrderCards";
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
  const [todayKey] = useState(() => kstDateKey(new Date()));
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [monthKey, setMonthKey] = useState(() => monthStartKey(todayKey));
  const touch = useRef<{ x: number; y: number } | null>(null);

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

  const [y, m] = monthKey.split("-").map(Number);
  const firstWeekday = weekdayOfKey(monthKey);
  const days: string[] = [];
  for (let k = monthKey; k <= monthEnd; k = addDaysToKey(k, 1)) days.push(k);

  const goMonth = (delta: number) => {
    const next = shiftMonthKey(monthKey, delta);
    setMonthKey(next);
    // 이번 달로 돌아오면 오늘, 아니면 그달 1일을 고른다
    setSelectedKey(next === monthStartKey(todayKey) ? todayKey : next);
  };

  const selectedOrders = byDay[selectedKey] ?? [];
  const selectedRule = effectiveRule(selectedKey, cal);
  const inMonth = selectedKey.slice(0, 7) === monthKey.slice(0, 7);

  return (
    <AppScreen
      tab="calendar"
      storeId={storeId}
      header={<TabHeader title="캘린더" />}
      bodyClassName="gap-2"
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
              setSelectedKey(todayKey);
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
            const count = Math.min(byDay[key]?.length ?? 0, 3);
            const selected = key === selectedKey;
            const today = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                aria-label={`${formatKeyMonthDayWeek(key)}${today ? " 오늘" : ""}${
                  mark === "closed" ? ", 휴무" : mark === "changed" ? ", 영업 바꿈" : ""
                }, 픽업 ${byDay[key]?.length ?? 0}건`}
                onClick={() => setSelectedKey(key)}
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
                {mark === "closed" ? (
                  <span className="text-tab text-ink-600">휴무</span>
                ) : mark === "changed" ? (
                  <span className="text-tab font-bold text-brand-ink">바꿈</span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-[15px] items-center justify-center gap-1"
                  >
                    {Array.from({ length: count }, (_, d) => (
                      <span key={d} className="size-[5px] rounded-full bg-brand" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-hidden="true" className="h-px bg-ink-100" />

      {inMonth ? (
        <>
          <h2 className="mt-1 text-group font-bold text-ink-900">
            {formatKeyMonthDayWeek(selectedKey)} ·{" "}
            {selectedRule.isOpen ? `픽업 ${selectedOrders.length}건` : "쉬는 날"}
          </h2>
          {monthQuery.isError ? (
            <LoadErrorState onRetry={() => void monthQuery.refetch()} />
          ) : selectedOrders.length > 0 ? (
            <div className="-mt-1">
              {selectedOrders.map((o, i) => (
                <PickupRow key={o.id} order={o} last={i === selectedOrders.length - 1} />
              ))}
            </div>
          ) : (
            <p className="text-sub text-ink-600">
              {monthQuery.isLoading
                ? "불러오는 중…"
                : selectedRule.isOpen
                  ? "이 날은 픽업이 없어요"
                  : "쉬는 날이라 픽업이 없어요"}
            </p>
          )}
        </>
      ) : null}
    </AppScreen>
  );
};
