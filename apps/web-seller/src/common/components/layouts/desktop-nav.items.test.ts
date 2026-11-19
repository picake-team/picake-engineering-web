import { describe, expect, it } from "vitest";
import { activeNavKey } from "./desktop-nav.items";

describe("PC 왼쪽 메뉴: 지금 메뉴", () => {
  const s = "/stores/abc";
  it("홈은 스토어 첫 주소에서만", () => {
    expect(activeNavKey(s, "abc")).toBe("home");
    expect(activeNavKey(`${s}/`, "abc")).toBe("home");
  });
  it("주문 목록과 상세는 주문", () => {
    expect(activeNavKey(`${s}/orders`, "abc")).toBe("orders");
    expect(activeNavKey(`${s}/orders/o1`, "abc")).toBe("orders");
  });
  it("직접 적은 주문·주문서 인쇄는 캘린더", () => {
    expect(activeNavKey(`${s}/calendar`, "abc")).toBe("calendar");
    expect(activeNavKey(`${s}/manual-orders/new`, "abc")).toBe("calendar");
    expect(activeNavKey(`${s}/print/orders`, "abc")).toBe("calendar");
  });
  it("스토어 정보·영업시간·피드는 스토어, 알림 설정과 마이페이지는 설정", () => {
    expect(activeNavKey(`${s}/edit`, "abc")).toBe("store");
    expect(activeNavKey(`${s}/hours`, "abc")).toBe("store");
    expect(activeNavKey(`${s}/feed/f1`, "abc")).toBe("store");
    expect(activeNavKey(`${s}/notifications`, "abc")).toBe("notifications");
    expect(activeNavKey(`${s}/notifications/settings`, "abc")).toBe("settings");
    expect(activeNavKey("/mypage/phone", "abc")).toBe("settings");
  });
  it("다른 스토어 주소면 고른 메뉴가 없다", () => {
    expect(activeNavKey("/stores/zzz/orders", "abc")).toBeNull();
  });
});
