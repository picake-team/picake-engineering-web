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

describe("바깥 링크 열기", () => {
  it("전화는 앱에서도 tel: 그대로(apps://를 붙이지 않음)", async () => {
    const { openExternalUrl } = await import("@/apps/web-user/common/utils/external-link.util");
    const loc = { href: "" };
    const win = { location: loc, mylocation: {}, open: () => null } as unknown as Window;
    const original = globalThis.window;
    Object.defineProperty(globalThis, "window", { value: win, configurable: true });
    try {
      openExternalUrl("tel:01012345678");
      expect(loc.href).toBe("tel:01012345678");
      openExternalUrl("https://pf.kakao.com/_x/chat");
      expect(loc.href).toBe("apps://https://pf.kakao.com/_x/chat");
    } finally {
      Object.defineProperty(globalThis, "window", { value: original, configurable: true });
    }
  });
});
