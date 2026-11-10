import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDaysToKey,
  formatKeyMonthDayWeek,
  formatKstMonthDayTime,
  formatKstMonthDayWeekTime,
  formatRemainingClock,
  formatRemainingHm,
  kstDateKey,
  mondayOfKey,
  sundayOfKey,
  weekdayOfKey,
} from "@/apps/web-seller/common/utils/kst-date.util";

describe("한국 시간 날짜", () => {
  // 해 표시가 "올해"에 따라 달라지므로 오늘을 2026-11-10(한국)으로 고정
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T03:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("UTC 전날 밤도 한국 날짜·요일·시각으로 쓴다", () => {
    const d = "2026-11-11T23:05:00.000Z"; // 한국 11월 12일(목) 08:05
    expect(kstDateKey(d)).toBe("2026-11-12");
    expect(formatKstMonthDayWeekTime(d)).toBe("11월 12일(목) 08:05");
    expect(formatKstMonthDayTime("2026-11-06T00:12:00.000Z")).toBe("11월 6일 09:12");
  });

  it("한국 자정은 00시로", () => {
    expect(formatKstMonthDayWeekTime("2026-11-06T15:00:00.000Z")).toBe("11월 7일(토) 00:00");
  });

  it("날짜 키 계산: 달·해 넘기기, 요일, 주 시작", () => {
    expect(addDaysToKey("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(weekdayOfKey("2026-11-08")).toBe(0); // 일
    expect(sundayOfKey("2026-11-12")).toBe("2026-11-08");
    expect(sundayOfKey("2026-11-08")).toBe("2026-11-08");
    expect(mondayOfKey("2026-11-12")).toBe("2026-11-09");
    expect(mondayOfKey("2026-11-08")).toBe("2026-11-02"); // 일요일이면 지난 월요일
    expect(formatKeyMonthDayWeek("2026-11-10")).toBe("11월 10일(화)");
  });

  it("올해가 아닌 날짜는 해를 붙인다(작년 주문·내년 픽업)", () => {
    expect(formatKeyMonthDayWeek("2025-12-24")).toBe("2025년 12월 24일(수)");
    expect(formatKeyMonthDayWeek("2027-01-05")).toBe("2027년 1월 5일(화)");
    expect(formatKstMonthDayWeekTime("2025-12-24T05:00:00.000Z")).toBe(
      "2025년 12월 24일(수) 14:00",
    );
    expect(formatKstMonthDayTime("2025-12-19T05:00:00.000Z")).toBe("2025년 12월 19일 14:00");
    // 한국 1월 1일 새벽(UTC로는 작년 12월 31일)은 그해로
    expect(formatKstMonthDayWeekTime("2026-12-31T15:30:00.000Z")).toBe("2027년 1월 1일(금) 00:30");
  });

  it("남은 시간 글자", () => {
    expect(formatRemainingHm((2 * 60 + 41) * 60000 + 30000)).toBe("2시간 41분");
    expect(formatRemainingHm(5 * 60000)).toBe("5분");
    expect(formatRemainingHm(3 * 3600000)).toBe("3시간");
    expect(formatRemainingHm(20000)).toBe("1분 미만");
    expect(formatRemainingClock((2 * 3600 + 41 * 60 + 10) * 1000)).toBe("02:41:10");
    expect(formatRemainingClock(-5)).toBe("00:00:00");
  });
});
