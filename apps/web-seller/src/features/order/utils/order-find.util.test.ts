import { describe, expect, it } from "vitest";
import { OrderSortBy } from "@/apps/web-seller/features/order/types/order.dto";
import { EMPTY_FIND, orderFilterSummary, readOrderFind, writeOrderFind } from "./order-find.util";

describe("주문 목록 주소 조건(휴대폰·PC 공용)", () => {
  it("쓰고 다시 읽으면 같다(빈 값은 주소에서 뺀다)", () => {
    const params = new URLSearchParams("tab=todo&group=confirm");
    const find = {
      query: " 딸기 ",
      pickupStartDate: "2026-11-01",
      pickupEndDate: "2026-11-30",
      sortBy: OrderSortBy.PRICE_DESC,
    };
    writeOrderFind(params, find);
    expect(params.get("q")).toBe("딸기");
    expect(params.has("os")).toBe(false);
    expect(params.get("tab")).toBe("todo");
    expect(readOrderFind(params)).toEqual({
      ...find,
      query: "딸기",
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("모르는 정렬 값은 버린다", () => {
    expect(readOrderFind(new URLSearchParams("sort=HACK")).sortBy).toBeUndefined();
  });

  it("걸러 둔 조건 한 줄: 기간과 기본과 다른 정렬만", () => {
    expect(orderFilterSummary(EMPTY_FIND, "todo")).toBeNull();
    // 처리할 것의 기본은 픽업 가까운 순이라 안 보인다
    expect(orderFilterSummary({ query: "", sortBy: OrderSortBy.PICKUP_ASC }, "todo")).toBeNull();
    expect(
      orderFilterSummary(
        {
          query: "",
          pickupStartDate: "2026-11-01",
          pickupEndDate: "2026-11-30",
          sortBy: OrderSortBy.PRICE_DESC,
        },
        "todo",
      ),
    ).toBe("픽업 11.01 ~ 11.30 · 금액 높은 순");
  });
});
