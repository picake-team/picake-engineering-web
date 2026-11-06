import { describe, expect, it } from "vitest";
import {
  SCREEN_MODE,
  shouldShowMobileScreens,
} from "@/apps/web-seller/common/constants/screen.constant";

describe("SCREEN_MODE", () => {
  it("모든 환경(production 포함)에서 휴대폰 폭이면 휴대폰 화면, PC 폭은 지금 PC 화면", () => {
    expect(SCREEN_MODE).toBe("mobile-on-phone");
  });
});

describe("shouldShowMobileScreens", () => {
  it("desktop-only는 폭과 관계없이 PC 화면", () => {
    expect(shouldShowMobileScreens("desktop-only", true)).toBe(false);
    expect(shouldShowMobileScreens("desktop-only", false)).toBe(false);
  });

  it("mobile-on-phone은 휴대폰 폭에서만", () => {
    expect(shouldShowMobileScreens("mobile-on-phone", true)).toBe(true);
    expect(shouldShowMobileScreens("mobile-on-phone", false)).toBe(false);
  });

  it("mobile-everywhere는 PC에서도 휴대폰 화면", () => {
    expect(shouldShowMobileScreens("mobile-everywhere", false)).toBe(true);
  });
});
