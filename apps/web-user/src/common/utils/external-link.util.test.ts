import { describe, expect, it } from "vitest";
import {
  storeInstagramUrl,
  storeKakaoChatUrl,
} from "@/apps/web-user/common/utils/external-link.util";

describe("가게 연락 주소", () => {
  it("카카오톡 채널 ID·주소 전체를 채팅 주소로", () => {
    expect(storeKakaoChatUrl("_xeaCon")).toBe("https://pf.kakao.com/_xeaCon/chat");
    expect(storeKakaoChatUrl(" http://pf.kakao.com/_xeaCon ")).toBe(
      "https://pf.kakao.com/_xeaCon/chat",
    );
    expect(storeKakaoChatUrl("")).toBeNull();
    expect(storeKakaoChatUrl("달콤케이크")).toBeNull();
  });

  it("인스타 ID·@·주소 전체를 프로필 주소로", () => {
    expect(storeInstagramUrl("dalcom.cake")).toBe("https://instagram.com/dalcom.cake");
    expect(storeInstagramUrl("@dalcom_cake")).toBe("https://instagram.com/dalcom_cake");
    expect(storeInstagramUrl("https://www.instagram.com/dalcom_cake/")).toBe(
      "https://instagram.com/dalcom_cake",
    );
    expect(storeInstagramUrl(null)).toBeNull();
    expect(storeInstagramUrl("달콤 케이크")).toBeNull();
  });
});
