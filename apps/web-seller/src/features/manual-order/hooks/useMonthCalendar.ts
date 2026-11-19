/**
 * 픽업 달력 상태(휴대폰·PC 캘린더 공용, 기획 I-42·I-54): 보는 달·고른 날(주소 ?date=), 그달 Picake·직접 적은 주문, 영업 규칙, 창 열기.
 * 화면은 달력 모양(휴대폰 점·PC 칸 안 줄)과 넘기는 법(휴대폰 밀기)만 따로 갖는다.
 */
import { useMemo, useState } from "react";
import {
  addDaysToKey,
  monthEndKey,
  monthStartKey,
  shiftMonthKey,
  weekdayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { useFollowToday, useKstTodayKey } from "@/apps/web-seller/common/hooks/useKstTodayKey";
import { useDateParam } from "@/apps/web-seller/common/hooks/useDateParam";
import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
import {
  calendarOrDefault,
  effectiveRule,
} from "@/apps/web-seller/features/store/utils/business-day.util";
import { useDayPickups } from "@/apps/web-seller/features/manual-order/hooks/queries/useDayPickups";
import { mergeDayPickups } from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";

export function useMonthCalendar(storeId: string) {
  const todayKey = useKstTodayKey();
  // 고른 날은 주소(?date=)에도 둔다: 주문 적기·상세에서 뒤로 오면 보던 날이 그대로 열리게(기획 I-42)
  const { selectedKey, setSelectedKey, pickDay } = useDateParam(todayKey);
  const [monthKey, setMonthKey] = useState(() => monthStartKey(selectedKey));
  // 켜 둔 채 날짜가 바뀌면 오늘을 보고 있던 칸·달도 새 오늘로(다른 날을 골라 뒀으면 그대로)
  useFollowToday(todayKey, (prev, next) => {
    setSelectedKey((s) => (s === prev ? next : s));
    setMonthKey((m) => (m === monthStartKey(prev) ? monthStartKey(next) : m));
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

  const { data: store } = useStoreDetail(storeId);
  const cal = calendarOrDefault(store?.businessCalendar);
  const monthEnd = monthEndKey(monthKey);
  // 그달 Picake 주문(취소 빼고)과 직접 적은 주문(기획 I-42)
  const month = useDayPickups(storeId, monthKey, monthEnd);
  const { byDay, manualByDay } = month;

  const [y, m] = monthKey.split("-").map(Number);
  const days = useMemo(() => {
    const out: string[] = [];
    for (let k = monthKey; k <= monthEnd; k = addDaysToKey(k, 1)) out.push(k);
    return out;
  }, [monthKey, monthEnd]);

  const goToday = () => {
    setMonthKey(monthStartKey(todayKey));
    pickDay(todayKey);
  };

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

  return {
    todayKey,
    selectedKey,
    pickDay,
    monthKey,
    y,
    m,
    /** 1일 앞 빈칸 수(일요일 0) */
    firstWeekday: weekdayOfKey(monthKey),
    days,
    goMonth,
    goToday,
    /** 가게 정보를 받았는지(영업시간 창은 받은 뒤에 연다) */
    storeLoaded: Boolean(store),
    cal,
    month,
    counts: month.counts,
    byDay,
    manualByDay,
    selectedPickups,
    selectedTag: cakeDayOf(selectedKey),
    selectedRule: effectiveRule(selectedKey, cal),
    /** 고른 날이 보고 있는 달 안인지 */
    inMonth: selectedKey.slice(0, 7) === monthKey.slice(0, 7),
    openExport: () => setExportOpen(true),
    openHours: () => setHoursOpen(true),
    /** <CalendarExportSheet {...exportSheet} /> */
    exportSheet: { storeId, open: exportOpen, onClose: () => setExportOpen(false) },
    /** <DayHoursSheet {...hoursSheet} /> — 고른 날만 바꾼다 */
    hoursSheet: {
      open: hoursOpen,
      onClose: () => setHoursOpen(false),
      storeId,
      dateKey: selectedKey,
      calendar: cal,
      dayOrders: byDay[selectedKey] ?? [],
    },
  };
}
