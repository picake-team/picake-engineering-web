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
