import { describe, expect, it } from "vitest";
import {
  markOrderChangedHere,
  wasOrderChangedHere,
} from "@/apps/web-seller/features/order/utils/recent-order-change.util";

describe("방금 바꾼 주문", () => {
  it("15초 안에 같은 주문 알림이면 겹쳐 띄우지 않는다", () => {
    markOrderChangedHere("o1", 1_000);
    expect(wasOrderChangedHere("o1", 10_000)).toBe(true);
    expect(wasOrderChangedHere("o2", 10_000)).toBe(false);
  });

  it("15초가 지나면 다시 띄운다", () => {
    markOrderChangedHere("o3", 1_000);
    expect(wasOrderChangedHere("o3", 17_000)).toBe(false);
  });
});
