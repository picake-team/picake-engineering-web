"use client";

import { useEffect, useMemo } from "react";
import { Calendar } from "@/apps/web-user/common/components/calendars/Calendar";
import { TimePicker } from "@/apps/web-user/common/components/timepickers/TimePicker";
import { cn } from "@/apps/web-user/common/lib/utils";
import type { MapPickupPeriodKind } from "@/apps/web-user/features/store/utils/map.util";
import type { StoreBusinessCalendar } from "@/apps/web-user/features/store/types/store.type";
import { getEffectiveSeoulDayOpenMinuteRange } from "@/apps/web-user/features/store/utils/store-business-calendar.util";

interface ReservationCalendarViewProps {
  tempSelectedDate: Date | null;
  setTempSelectedDate: (date: Date | null) => void;
  tempSelectedTime: Date | null;
  setTempSelectedTime: (time: Date | null) => void;
  /** true면 TimePicker 대신 지도용 구간(하루종일·오전·오후) 선택 */
  pickupPeriodMode?: boolean;
  selectedPickupPeriod?: MapPickupPeriodKind | null;
  onPickupPeriodChange?: (period: MapPickupPeriodKind) => void;
  /** 스토어 영업 캘린더 — 정의되면 휴무일 disable + 시간 범위 제한 */
  businessCalendar?: StoreBusinessCalendar;
}

const PERIOD_LABELS: Record<MapPickupPeriodKind, string> = {
  fullday: "하루종일",
  morning: "오전",
  afternoon: "오후",
};

/** PillTabs와 동일한 회색 세로 구분선 */
function PickupPeriodDivider() {
  return <div className="h-3 w-px shrink-0 bg-gray-100" aria-hidden />;
}

export function ReservationCalendarView({
  tempSelectedDate,
  setTempSelectedDate,
  tempSelectedTime,
  setTempSelectedTime,
  pickupPeriodMode = false,
  selectedPickupPeriod,
  onPickupPeriodChange,
  businessCalendar,
}: ReservationCalendarViewProps) {
  // 선택 날짜의 영업 분 범위 (open inclusive, close exclusive). 영업 캘린더 없으면 null
  const timeRange = useMemo(() => {
    if (!businessCalendar || !tempSelectedDate) return null;
    return getEffectiveSeoulDayOpenMinuteRange(businessCalendar, tempSelectedDate);
  }, [businessCalendar, tempSelectedDate]);

  // 오늘을 고른 경우엔 이미 지난 시각은 고를 수 없도록 현재 분을 하한으로 사용
  const minTimeMinutes = useMemo(() => {
    const openMin = timeRange?.openMin;
    if (!tempSelectedDate) return openMin;

    const now = new Date();
    const isToday =
      tempSelectedDate.getFullYear() === now.getFullYear() &&
      tempSelectedDate.getMonth() === now.getMonth() &&
      tempSelectedDate.getDate() === now.getDate();
    if (!isToday) return openMin;

    const nowMin = now.getHours() * 60 + now.getMinutes();
    return openMin != null ? Math.max(openMin, nowMin) : nowMin;
  }, [timeRange, tempSelectedDate]);

  // 선택 시각이 새 영업 범위 / 현재 시각 하한 밖이면 자동으로 비움
  useEffect(() => {
    if (!tempSelectedTime) return;
    if (businessCalendar && !timeRange) {
      setTempSelectedTime(null);
      return;
    }
    const m = tempSelectedTime.getHours() * 60 + tempSelectedTime.getMinutes();
    if (minTimeMinutes != null && m < minTimeMinutes) {
      setTempSelectedTime(null);
      return;
    }
    if (timeRange && m >= timeRange.closeMin) {
      setTempSelectedTime(null);
    }
  }, [businessCalendar, timeRange, minTimeMinutes, tempSelectedTime, setTempSelectedTime]);

  return (
    <div className="px-[20px] py-[16px] flex flex-col gap-[48px]">
      <Calendar
        selectedDate={tempSelectedDate}
        onDateSelect={setTempSelectedDate}
        minDate={new Date()}
        businessCalendar={businessCalendar}
        className="border-0 shadow-none p-0"
      />
      {pickupPeriodMode ? (
        <div className="w-full max-w-sm mx-auto shrink-0 pb-[40px]">
          <div className="flex h-10 w-full items-center" style={{ gap: 12 }}>
            {(["fullday", "morning", "afternoon"] as const).map((key, index) => {
              const selected = selectedPickupPeriod === key;
              return (
                <span key={key} className="contents">
                  {index === 1 ? <PickupPeriodDivider /> : null}
                  <button
                    type="button"
                    onClick={() => onPickupPeriodChange?.(key)}
                    className={cn(
                      "box-border flex shrink-0 items-center justify-center text-center transition-colors",
                      selected ? "bg-primary-50 text-primary" : "bg-white text-gray-900",
                    )}
                    style={{
                      height: 40,
                      boxSizing: "border-box",
                      borderRadius: 6,
                      border: selected
                        ? "1px solid var(--primary-or-100, #FFD2C7)"
                        : "1px solid var(--grayscale-gr-100, #EBEBEA)",
                      padding: "10px 12px",
                      fontSize: 14,
                      lineHeight: "18px",
                      fontWeight: selected ? 700 : 400,
                    }}
                  >
                    {PERIOD_LABELS[key]}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="pb-[40px]">
          <TimePicker
            selectedTime={tempSelectedTime}
            onTimeSelect={setTempSelectedTime}
            interval={30}
            timeFormat="12h"
            minTimeMinutes={minTimeMinutes}
            maxTimeMinutes={timeRange?.closeMin}
          />
        </div>
      )}
    </div>
  );
}
