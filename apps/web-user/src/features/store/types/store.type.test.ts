import { describe, expect, it } from "vitest";
import { visibleRefundRules } from "./store.type";

describe("visibleRefundRules", () => {
  it("내용을 적지 않은 줄은 뺀다(새 가게 기본값)", () => {
    expect(visibleRefundRules({ rules: [{ daysBeforePickup: 0, refundDescription: "" }] })).toEqual(
      [],
    );
    expect(
      visibleRefundRules({ rules: [{ daysBeforePickup: 0, refundDescription: "  " }] }),
    ).toEqual([]);
  });

  it("적은 줄은 순서대로 그대로 둔다", () => {
    const rules = [
      { daysBeforePickup: 3, refundDescription: "전액 환불" },
      { daysBeforePickup: 0, refundDescription: "" },
      { daysBeforePickup: 0, refundDescription: "환불 불가" },
    ];
    expect(visibleRefundRules({ rules })).toEqual([rules[0], rules[2]]);
  });

  it("규정이 없으면 빈 목록", () => {
    expect(visibleRefundRules(undefined)).toEqual([]);
    expect(visibleRefundRules(null)).toEqual([]);
  });
});
