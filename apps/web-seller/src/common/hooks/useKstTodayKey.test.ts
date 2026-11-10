import { describe, expect, it } from "vitest";
import { msUntilNextKstMidnight } from "@/apps/web-seller/common/hooks/useKstTodayKey";

describe("msUntilNextKstMidnight", () => {
  it("한국 23:58이면 2분 뒤가 자정이다", () => {
    expect(msUntilNextKstMidnight(Date.parse("2026-11-10T14:58:00.000Z"))).toBe(2 * 60 * 1000);
  });
  it("한국 자정 바로 뒤면 하루 가까이 남는다", () => {
    expect(msUntilNextKstMidnight(Date.parse("2026-11-10T15:00:01.000Z"))).toBe(
      24 * 3600 * 1000 - 1000,
    );
  });
  it("UTC 자정(한국 아침 9시)과 헷갈리지 않는다", () => {
    expect(msUntilNextKstMidnight(Date.parse("2026-11-11T00:00:00.000Z"))).toBe(15 * 3600 * 1000);
  });
});
