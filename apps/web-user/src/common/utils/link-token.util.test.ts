import { describe, expect, it } from "vitest";
import { isQuoteLinkPath, scrubLinkToken } from "@/apps/web-user/common/utils/link-token.util";

describe("견적 링크 열쇠 지우기", () => {
  it("화면 주소와 API 주소의 열쇠를 지운다", () => {
    expect(scrubLinkToken("https://picakes.com/q/AbC_d-123456789012?x=1")).toBe(
      "https://picakes.com/q/[token]?x=1",
    );
    expect(
      scrubLinkToken(
        "https://api.picakes.com/v1/consumer/quote-links/AbC_d-1234567890/chat/messages",
      ),
    ).toBe("https://api.picakes.com/v1/consumer/quote-links/[token]/chat/messages");
    expect(scrubLinkToken("https://picakes.com/quote/abc")).toBe("https://picakes.com/quote/abc");
  });
  it("견적 링크 화면인지", () => {
    expect(isQuoteLinkPath("/q/abc")).toBe(true);
    expect(isQuoteLinkPath("/quote/abc")).toBe(false);
  });
});

describe("소셜 가입표도 지운다(저장소를 못 쓰는 브라우저만 주소에 실림)", () => {
  it("registerToken 값을 가린다", () => {
    expect(
      scrubLinkToken("https://picakes.com/auth/register/kakao?registerToken=eyJ.abc.def&x=1"),
    ).toBe("https://picakes.com/auth/register/kakao?registerToken=[token]&x=1");
  });
  it("소셜 로그인 콜백의 code·state를 가린다", () => {
    expect(scrubLinkToken("https://picakes.com/auth/login/naver?code=abc123&state=0f9e8d")).toBe(
      "https://picakes.com/auth/login/naver?code=[token]&state=[token]",
    );
    expect(scrubLinkToken("/auth/login/kakao?state=x&code=y#frag")).toBe(
      "/auth/login/kakao?state=[token]&code=[token]#frag",
    );
    // 애플 콜백은 애플이 준 실명(appleName)이 주소에 실린다(11-26)
    expect(scrubLinkToken("/auth/login/apple/callback?code=c1&appleName=홍길동")).toBe(
      "/auth/login/apple/callback?code=[token]&appleName=[token]",
    );
    expect(scrubLinkToken("https://picakes.com/search?q=하트")).toBe(
      "https://picakes.com/search?q=하트",
    );
  });
});
