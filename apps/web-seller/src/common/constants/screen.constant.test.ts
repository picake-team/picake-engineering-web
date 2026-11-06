import { describe, expect, it } from "vitest";
import {
  screenModeFor,
  shouldShowMobileScreens,
} from "@/apps/web-seller/common/constants/screen.constant";

describe("screenModeFor", () => {
  it("production은 출시 전까지 지금 PC 화면만", () => {
    expect(screenModeFor("production")).toBe("desktop-only");
  });

  it("개발·staging(값 없음 포함)은 휴대폰 폭에서 휴대폰 화면", () => {
    expect(screenModeFor("development")).toBe("mobile-on-phone");
    expect(screenModeFor("staging")).toBe("mobile-on-phone");
    expect(screenModeFor(undefined)).toBe("mobile-on-phone");
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
