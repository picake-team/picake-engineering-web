import { describe, expect, it } from "vitest";
import { resolveBannerLink } from "@/apps/web-user/features/home-banner/utils/banner-link.util";

describe("resolveBannerLink", () => {
  it("우리 사이트 절대 주소는 같은 창 주소창 이동으로, 경로·쿼리만 남긴다", () => {
    expect(resolveBannerLink("https://picakes.com/partner?from=home_banner")).toEqual({
      kind: "page",
      href: "/partner?from=home_banner",
    });
    expect(resolveBannerLink("https://staging.picakes.com/quote/new#top")).toEqual({
      kind: "page",
      href: "/quote/new#top",
    });
  });

  it("경로는 앱 안 이동", () => {
    expect(resolveBannerLink("/design")).toEqual({ kind: "route", href: "/design" });
  });

  it("다른 사이트는 새 창", () => {
    expect(resolveBannerLink("https://info.picakes.com/seller/about")).toEqual({
      kind: "external",
      href: "https://info.picakes.com/seller/about",
    });
    expect(resolveBannerLink("https://example.com")).toEqual({
      kind: "external",
      href: "https://example.com",
    });
  });
});
