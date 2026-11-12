import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeTime } from "@/apps/web-user/common/utils/date.util";

// 채팅 목록 시각: 일주일 안은 "N분 전"·"N일 전", 그 뒤는 "10월 3일"(올해가 아니면 해를 붙임, 서울 기준)
describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-12T03:00:00Z")); // 서울 11월 12일 12시
  });
  afterEach(() => vi.useRealTimers());

  it("일주일 안은 상대 시간", () => {
    expect(formatRelativeTime(new Date("2026-11-12T02:30:00Z"))).toBe("30분 전");
    expect(formatRelativeTime(new Date("2026-11-09T03:00:00Z"))).toBe("3일 전");
  });

  it("일주일이 지나면 월·일", () => {
    expect(formatRelativeTime(new Date("2026-10-03T03:00:00Z"))).toBe("10월 3일");
  });

  it("서울 날짜로 센다(UTC 전날 밤 = 서울 다음 날)", () => {
    expect(formatRelativeTime(new Date("2026-10-02T16:00:00Z"))).toBe("10월 3일");
  });

  it("올해가 아니면 해를 붙인다", () => {
    expect(formatRelativeTime(new Date("2025-12-24T03:00:00Z"))).toBe("2025년 12월 24일");
  });
});
