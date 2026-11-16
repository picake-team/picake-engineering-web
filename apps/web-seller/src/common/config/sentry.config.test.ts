import { describe, expect, it } from "vitest";
import { scrubAuthQuery } from "@/apps/web-seller/common/config/sentry.config";

describe("Sentry 주소 가리기 — 소셜 로그인 콜백", () => {
  it("code·state·registerToken 값을 가리고 나머지는 그대로 둔다", () => {
    expect(scrubAuthQuery("https://seller.picakes.com/auth/login/naver?code=abc&state=0f9e")).toBe(
      "https://seller.picakes.com/auth/login/naver?code=[token]&state=[token]",
    );
    expect(scrubAuthQuery("/auth/register?registerToken=eyJ.a.b&x=1")).toBe(
      "/auth/register?registerToken=[token]&x=1",
    );
    expect(scrubAuthQuery("https://seller.picakes.com/orders?status=PAID")).toBe(
      "https://seller.picakes.com/orders?status=PAID",
    );
  });
});
