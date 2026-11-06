import { describe, expect, it } from "vitest";
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import {
  calendarWithDay,
  dayMark,
  dayRuleNow,
  dayRuleSummary,
  effectiveRule,
} from "@/apps/web-seller/features/store/utils/business-day.util";

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

  it("기본과 같게 바꾸면 그날 바꾼 것을 지운다", () => {
    const next = calendarWithDay(cal, "2026-11-17", { isOpen: true, start: "10:00", end: "19:00" });
    expect(next.dayOverrides).toEqual([]);
  });

  it("쉬는 요일에 그날만 열기, 평일에 그날만 쉬기", () => {
    const open = calendarWithDay(cal, "2026-11-15", { isOpen: true, start: "11:00", end: "15:00" });
    expect(open.dayOverrides).toContainEqual({
      date: "2026-11-15",
      isOpen: true,
      openTime: "11:00",
      closeTime: "15:00",
    });
    const closed = calendarWithDay(cal, "2026-11-20", {
      isOpen: false,
      start: "10:00",
      end: "19:00",
    });
    expect(closed.dayOverrides).toContainEqual({ date: "2026-11-20", isOpen: false });
    // 날짜 순서 유지
    expect(closed.dayOverrides.map((d) => d.date)).toEqual(["2026-11-17", "2026-11-20"]);
  });

  it("한 줄 설명", () => {
    expect(dayRuleSummary("2026-11-18", cal)).toBe("기본 영업시간대로 열어요 · 10:00~19:00");
    expect(dayRuleSummary("2026-11-16", { ...cal, weeklyClosedWeekdays: [1] })).toBe(
      "매주 월요일 쉬어요 · 이 날만 열 수 있어요",
    );
    expect(dayRuleSummary("2026-11-17", cal)).toBe("이 날만 바꿨어요 · 15:00~19:00");
    expect(dayRuleNow("2026-11-18", cal)).toBe("지금은 기본 영업시간대로 열어요 (10:00~19:00)");
  });
});
