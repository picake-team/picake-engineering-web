import { describe, expect, it } from "vitest";
import type { StoreBusinessCalendarDto } from "@/apps/web-seller/features/store/types/store.dto";
import { calendarWithDay, dayHoursTimeError, draftForDay } from "./day-hours.util";

// 일요일(0) 휴무, 평소 10:00~20:00. 2026-11-22는 일요일, 2026-11-24는 화요일
const cal: StoreBusinessCalendarDto = {
  weeklyClosedWeekdays: [0],
  standardOpenTime: "10:00",
  standardCloseTime: "20:00",
  dayOverrides: [{ date: "2026-11-25", isOpen: false }],
};

describe("그날만 영업 바꾸기", () => {
  it("창을 열면 그날 지금 영업으로 시작한다", () => {
    expect(draftForDay(cal, "2026-11-24")).toEqual({ mode: "base", start: "10:00", end: "20:00" });
    expect(draftForDay(cal, "2026-11-25")).toMatchObject({ mode: "closed" });
  });

  it("평소와 다르면 그날만 바꾼 것으로 넣는다", () => {
    const next = calendarWithDay(cal, "2026-11-24", { mode: "open", start: "09:00", end: "21:00" });
    expect(next.dayOverrides).toContainEqual({
      date: "2026-11-24",
      isOpen: true,
      openTime: "09:00",
      closeTime: "21:00",
    });
    // 다른 날 바꾼 것과 매주 규칙은 그대로
    expect(next.dayOverrides).toContainEqual({ date: "2026-11-25", isOpen: false });
    expect(next.weeklyClosedWeekdays).toEqual([0]);
    expect(next.standardOpenTime).toBe("10:00");
  });

  it("쉬는 요일에 그날만 연다", () => {
    const next = calendarWithDay(cal, "2026-11-22", { mode: "open", start: "10:00", end: "20:00" });
    expect(next.dayOverrides).toContainEqual({
      date: "2026-11-22",
      isOpen: true,
      openTime: "10:00",
      closeTime: "20:00",
    });
  });

  it("평소대로·평소와 같은 값이면 바꾼 것을 지운다", () => {
    const back = calendarWithDay(cal, "2026-11-25", { mode: "base", start: "10:00", end: "20:00" });
    expect(back.dayOverrides.find((d) => d.date === "2026-11-25")).toBeUndefined();
    const same = calendarWithDay(cal, "2026-11-24", { mode: "open", start: "10:00", end: "20:00" });
    expect(same.dayOverrides.find((d) => d.date === "2026-11-24")).toBeUndefined();
    const closedSunday = calendarWithDay(cal, "2026-11-22", {
      mode: "closed",
      start: "10:00",
      end: "20:00",
    });
    expect(closedSunday.dayOverrides.find((d) => d.date === "2026-11-22")).toBeUndefined();
  });

  it("끝이 시작보다 이르면 막고, 00:00~00:00은 하루 종일", () => {
    expect(dayHoursTimeError({ mode: "open", start: "20:00", end: "10:00" })).not.toBeNull();
    expect(dayHoursTimeError({ mode: "open", start: "00:00", end: "00:00" })).toBeNull();
    expect(dayHoursTimeError({ mode: "closed", start: "20:00", end: "10:00" })).toBeNull();
  });
});
