import { describe, expect, it } from "vitest";
import { isReturnablePath } from "@/apps/web-seller/common/utils/return-to.util";

describe("isReturnablePath", () => {
  it("주문 상세처럼 우리 사이트 안 주소는 기억한다", () => {
    expect(isReturnablePath("/stores/s1/orders/o1")).toBe(true);
    expect(isReturnablePath("/stores/s1?tab=todo")).toBe(true);
  });
  it("로그인·약관·첫 화면·바깥 주소는 기억하지 않는다", () => {
    expect(isReturnablePath("/auth/login")).toBe(false);
    expect(isReturnablePath("/terms/privacy-policy")).toBe(false);
    expect(isReturnablePath("/")).toBe(false);
    expect(isReturnablePath("//evil.example.com")).toBe(false);
    expect(isReturnablePath("https://evil.example.com")).toBe(false);
  });
  it("스토어 만들기는 기억하지 않는다(로그인 뒤 첫 화면이 스토어가 있는지 보고 정한다)", () => {
    expect(isReturnablePath("/store/create")).toBe(false);
    expect(isReturnablePath("/store/create?step=2")).toBe(false);
    expect(isReturnablePath("/store/create#top")).toBe(false);
  });
});
