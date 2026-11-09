import { describe, expect, it } from "vitest";
import {
  firstSelectableHour,
  formatDeadline,
  formatHour,
  formatHourRange,
  pickupWindow,
} from "@/apps/web-user/features/quote/utils/quote-time.util";

/** 기기 시간대와 상관없이 같은 결과가 나오도록 로컬 시각으로 만든다 */
const local = (y: number, m: number, d: number, h: number, min = 0) =>
  new Date(y, m - 1, d, h, min);

describe("요청서 시간 규칙(견적 마감 = 픽업 1시간 전, 지금부터 3시간 안은 못 고름)", () => {
  it("다른 날 아무 때나 → 그날 0시 시작, 전날 밤 11시 마감", () => {
    const w = pickupWindow("2026-12-24", null, local(2026, 12, 20, 10));
    expect(w?.start).toEqual(local(2026, 12, 24, 0));
    expect(w?.deadline).toEqual(local(2026, 12, 23, 23));
    expect(w?.shifted).toBe(false);
  });

  it("오늘 오후 4시 20분에 오늘 아무 때나 → 오후 8시 이후로 보고 오후 7시 마감", () => {
    const w = pickupWindow("2026-11-09", null, local(2026, 11, 9, 16, 20));
    expect(w?.start).toEqual(local(2026, 11, 9, 20));
    expect(w?.deadline).toEqual(local(2026, 11, 9, 19));
    expect(w?.shifted).toBe(true);
  });

  it("3시간 안의 시각과 저녁 9시 이후의 오늘은 고를 수 없다", () => {
    expect(pickupWindow("2026-11-09", 19, local(2026, 11, 9, 16, 20))).toBeNull();
    expect(firstSelectableHour("2026-11-09", local(2026, 11, 9, 16, 20))).toBe(20);
    expect(firstSelectableHour("2026-11-09", local(2026, 11, 9, 21))).toBeNull();
  });

  it("문구", () => {
    expect(formatHour(23)).toBe("밤 11시");
    expect(formatHourRange(14, 17)).toBe("오후 2시 ~ 5시");
    expect(formatHourRange(11, 14)).toBe("오전 11시 ~ 오후 2시");
    expect(formatDeadline(local(2026, 12, 23, 23), local(2026, 12, 20, 10))).toBe(
      "23일(수) 밤 11시",
    );
    expect(formatDeadline(local(2027, 1, 3, 23), local(2026, 12, 20, 10))).toBe(
      "1월 3일(일) 밤 11시",
    );
  });
});
