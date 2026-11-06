import { describe, expect, it } from "vitest";
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import { dayMark, effectiveRule } from "@/apps/web-seller/features/store/utils/business-day.util";

// 2026-11-08은 일요일
const cal: StoreBusinessCalendarDto = {
  weeklyClosedWeekdays: [0],
  standardOpenTime: "10:00",
  standardCloseTime: "19:00",
  dayOverrides: [{ date: "2026-11-17", isOpen: true, openTime: "15:00", closeTime: "19:00" }],
};

describe("날짜별 영업", () => {
  it("쉬는 요일·그날만 바꾼 날·평일", () => {
    expect(effectiveRule("2026-11-08", cal)).toMatchObject({ isOpen: false, overridden: false });
    expect(effectiveRule("2026-11-17", cal)).toEqual({
      isOpen: true,
      start: "15:00",
      end: "19:00",
      overridden: true,
    });
    expect(dayMark("2026-11-08", cal)).toBe("closed");
    expect(dayMark("2026-11-17", cal)).toBe("changed");
    expect(dayMark("2026-11-18", cal)).toBeNull();
  });
});
