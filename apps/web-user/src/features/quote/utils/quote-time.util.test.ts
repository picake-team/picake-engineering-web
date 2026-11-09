import { describe, expect, it } from "vitest";
import {
  firstSelectableHour,
  formatDeadline,
  formatHour,
  formatHourRange,
  formatShortDate,
  kstHour,
  pickupWindow,
  todayKstYmd,
} from "@/apps/web-user/features/quote/utils/quote-time.util";

/** 한국 시각 → Date (기기 시간대와 상관없이 같은 순간) */
const kst = (s: string) => new Date(`${s}+09:00`);

describe("요청서 시간 규칙(견적 마감 = 픽업 1시간 전, 지금부터 3시간 안은 못 고름, 한국 시간)", () => {
  it("다른 날 아무 때나 → 그날 0시 시작, 전날 밤 11시 마감", () => {
    const w = pickupWindow("2026-12-24", null, kst("2026-12-20T10:00:00"));
    expect(w?.start).toEqual(kst("2026-12-24T00:00:00"));
    expect(w?.deadline).toEqual(kst("2026-12-23T23:00:00"));
    expect(w?.shifted).toBe(false);
  });

  it("오늘 오후 4시 20분에 오늘 아무 때나 → 오후 8시 이후로 보고 오후 7시 마감", () => {
    const w = pickupWindow("2026-11-09", null, kst("2026-11-09T16:20:00"));
    expect(w?.start).toEqual(kst("2026-11-09T20:00:00"));
    expect(w?.deadline).toEqual(kst("2026-11-09T19:00:00"));
    expect(w?.shifted).toBe(true);
    expect(kstHour(w!.start)).toBe(20);
  });

  it("3시간 안의 시각과 저녁 9시 이후의 오늘은 고를 수 없다", () => {
    expect(pickupWindow("2026-11-09", 19, kst("2026-11-09T16:20:00"))).toBeNull();
    expect(firstSelectableHour("2026-11-09", kst("2026-11-09T16:20:00"))).toBe(20);
    expect(firstSelectableHour("2026-11-09", kst("2026-11-09T21:00:00"))).toBeNull();
  });

  it("한국 날짜·요일은 기기 시간대와 상관없다", () => {
    // 한국 11월 10일 새벽 1시 = UTC 11월 9일 16시
    expect(todayKstYmd(kst("2026-11-10T01:00:00"))).toBe("2026-11-10");
    expect(formatShortDate("2026-12-24")).toBe("12/24(목)");
  });

  it("문구", () => {
    expect(formatHour(23)).toBe("밤 11시");
    expect(formatHourRange(14, 17)).toBe("오후 2시 ~ 5시");
    expect(formatHourRange(11, 14)).toBe("오전 11시 ~ 오후 2시");
    expect(formatDeadline(kst("2026-12-23T23:00:00"), kst("2026-12-20T10:00:00"))).toBe(
      "23일(수) 밤 11시",
    );
    expect(formatDeadline(kst("2027-01-03T23:00:00"), kst("2026-12-20T10:00:00"))).toBe(
      "1월 3일(일) 밤 11시",
    );
  });
});
