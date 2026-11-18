import { describe, expect, it } from "vitest";

import { sellerNotificationPath } from "@/apps/web-seller/features/notification/utils/notification-path.util";

describe("sellerNotificationPath", () => {
  it("주문 알림은 주문 상세, 스토어 안내(정산 계좌가 바뀜)는 스토어 정보 수정", () => {
    expect(sellerNotificationPath({ storeId: "s1", orderId: "o1", category: "ORDER" })).toBe(
      "/stores/s1/orders/o1",
    );
    expect(sellerNotificationPath({ storeId: "s1", orderId: null, category: "STORE" })).toBe(
      "/stores/s1/edit",
    );
  });

  it("옛 서버(category 없음)는 orderId가 있으면 주문 알림", () => {
    expect(sellerNotificationPath({ storeId: "s1", orderId: "o1" })).toBe("/stores/s1/orders/o1");
  });
});
