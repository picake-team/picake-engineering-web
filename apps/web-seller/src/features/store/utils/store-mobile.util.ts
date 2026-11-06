import { weekdayLabel } from "@/apps/web-seller/common/utils/kst-date.util";
import type { StoreResponseDto } from "@/apps/web-seller/features/store/types/store.dto";

/** 스토어 탭 "영업시간" 한 줄: "쉬는 요일 일요일 · 10:00~19:00" */
export function businessHoursSummary(
  store: Pick<StoreResponseDto, "businessCalendar"> | undefined,
): string | undefined {
  const bc = store?.businessCalendar;
  if (!bc) return undefined;
  const closed = [...bc.weeklyClosedWeekdays]
    .sort((a, b) => a - b)
    .map((d) => `${weekdayLabel(d)}요일`);
  const allDay = bc.standardOpenTime === "00:00" && bc.standardCloseTime === "00:00";
  const hours = allDay ? "하루 종일" : `${bc.standardOpenTime}~${bc.standardCloseTime}`;
  return `쉬는 요일 ${closed.length ? closed.join("·") : "없음"} · ${hours}`;
}
