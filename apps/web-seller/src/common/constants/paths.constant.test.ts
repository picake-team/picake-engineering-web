/**
 * "PC ≥ 휴대폰"(운영자 결정 2026-11-19, 기획 I-54)을 지키는 검사.
 * - 주소마다 휴대폰 화면과 PC 화면(따로 만든 화면이거나 SAME_SCREEN)이 다 있어야 한다(빈칸이면 타입 검사도 막는다)
 * - 한쪽에서만 뜻이 있는 화면(onlyOn)은 아래 목록과 같아야 한다. 새로 생기면 이유를 적고 이 목록을 고친다
 * - PC 화면을 따로 만든 주소는 아래 목록과 같아야 한다(나머지는 같은 화면을 PC 틀 안에)
 */
import { describe, expect, it, vi } from "vitest";

// 화면 파일은 불러오지 않는다(주소 목록만 본다). lazyPage는 이름만 남긴 가짜 화면을 돌려준다
vi.mock("@/apps/web-seller/common/utils/lazy-page.util", () => ({
  lazyPage: (_load: unknown, name: string) => {
    const Screen = () => null;
    Screen.displayName = name;
    return Screen;
  },
}));
vi.mock("@/apps/web-seller/pages/auth/Login", () => {
  const LoginPage = () => null;
  LoginPage.displayName = "LoginPage";
  return { LoginPage };
});

const { ADMIN_ROUTE_CONFIG, AUTH_ROUTE_CONFIG, SAME_SCREEN, screenFor } =
  await import("@/apps/web-seller/common/constants/paths.constant");

const ALL = [...AUTH_ROUTE_CONFIG, ...ADMIN_ROUTE_CONFIG];
const nameOf = (c: unknown) => (c as { displayName?: string }).displayName ?? "";

describe("주소 목록: PC ≥ 휴대폰", () => {
  it("모든 주소에 휴대폰 화면과 PC 화면이 있다", () => {
    for (const r of ALL) {
      expect(r.mobile, r.path).toBeTruthy();
      expect(r.desktop, r.path).toBeTruthy();
      expect(screenFor(r, true), r.path).toBeTruthy();
      expect(screenFor(r, false), r.path).toBeTruthy();
    }
  });

  it("같은 주소가 두 번 나오지 않는다", () => {
    const paths = ALL.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("PC 화면을 따로 만든 주소(무엇을 함께 보여 주는지가 다른 곳)", () => {
    const own = ADMIN_ROUTE_CONFIG.filter((r) => r.desktop !== SAME_SCREEN && !r.onlyOn).map(
      (r) => [r.path, nameOf(r.desktop)],
    );
    expect(own).toEqual([
      ["/stores/:storeId", "StoreDetailHomeDesktopPage"],
      ["/stores/:storeId/products", "StoreDetailProductListDesktopPage"],
      ["/stores/:storeId/products/list", "StoreDetailProductListDesktopPage"],
      ["/stores/:storeId/orders", "StoreDetailOrdersDesktopPage"],
      ["/stores/:storeId/orders/:orderId", "StoreDetailOrdersDesktopPage"],
      ["/stores/:storeId/chats", "StoreDetailChatsDesktopPage"],
      ["/stores/:storeId/chats/order/:orderId", "StoreDetailChatsDesktopPage"],
      ["/stores/:storeId/chats/:threadId", "StoreDetailChatsDesktopPage"],
      ["/stores/:storeId/calendar", "StoreDetailCalendarDesktopPage"],
    ]);
  });

  it("한쪽에서만 뜻이 있는 화면은 이유와 함께 이것뿐", () => {
    const only = ALL.filter((r) => r.onlyOn).map((r) => [r.path, r.onlyOn?.surface]);
    expect(only).toEqual([
      ["/stores/:storeId/welcome", "mobile"],
      ["/stores/:storeId/print/orders", "desktop"],
    ]);
    for (const r of ALL.filter((x) => x.onlyOn)) expect(r.onlyOn?.reason.length).toBeGreaterThan(5);
  });

  it("휴대폰 폭은 늘 휴대폰 화면, PC 폭은 PC 화면(같은 화면이면 휴대폰 화면)", () => {
    const home = ADMIN_ROUTE_CONFIG.find((r) => r.path === "/stores/:storeId")!;
    expect(nameOf(screenFor(home, true))).toBe("StoreDetailHomeMobilePage");
    expect(nameOf(screenFor(home, false))).toBe("StoreDetailHomeDesktopPage");
    const mypage = ADMIN_ROUTE_CONFIG.find((r) => r.path === "/mypage")!;
    expect(nameOf(screenFor(mypage, false))).toBe("MypageIndexMobilePage");
  });
});
