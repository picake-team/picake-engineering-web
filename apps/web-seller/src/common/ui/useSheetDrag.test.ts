import { describe, expect, it } from "vitest";
import { shouldCloseSheet } from "@/apps/web-seller/common/ui/useSheetDrag";

describe("아래 창 끌어 닫기", () => {
  it("창 높이의 30%(최대 120px)보다 많이 끌면 닫는다", () => {
    expect(shouldCloseSheet(100, 0, 300)).toBe(true); // 300의 30% = 90
    expect(shouldCloseSheet(80, 0, 300)).toBe(false);
    expect(shouldCloseSheet(119, 0, 800)).toBe(false); // 긴 창은 120까지
    expect(shouldCloseSheet(121, 0, 800)).toBe(true);
  });

  it("빠르게 내리면 조금만 끌어도 닫고, 거의 안 끌었으면 닫지 않는다", () => {
    expect(shouldCloseSheet(40, 1, 800)).toBe(true);
    expect(shouldCloseSheet(10, 1, 800)).toBe(false);
    expect(shouldCloseSheet(0, 2, 800)).toBe(false);
  });
});
