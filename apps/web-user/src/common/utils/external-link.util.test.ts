import { describe, expect, it, vi } from "vitest";
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
  async function withWindow(win: object, run: () => Promise<void>) {
    const original = globalThis.window;
    Object.defineProperty(globalThis, "window", { value: win, configurable: true });
    try {
      await run();
    } finally {
      Object.defineProperty(globalThis, "window", { value: original, configurable: true });
    }
  }

  it("앱에서는 전화·웹 주소 모두 앱이 연다(openExternal)", async () => {
    const { openExternalUrl } = await import("@/apps/web-user/common/utils/external-link.util");
    const loc = { href: "" };
    const open = vi.fn();
    const openExternal = vi.fn().mockResolvedValue(undefined);
    await withWindow({ location: loc, open, PicakeApp: { openExternal } }, async () => {
      await openExternalUrl("tel:01012345678");
      await openExternalUrl("https://pf.kakao.com/_x/chat");
    });
    expect(openExternal).toHaveBeenNthCalledWith(1, "tel:01012345678");
    expect(openExternal).toHaveBeenNthCalledWith(2, "https://pf.kakao.com/_x/chat");
    expect(loc.href).toBe("");
    expect(open).not.toHaveBeenCalled();
  });

  it("앱이 열지 못하면(unsupported) 실패를 돌려준다(대신할 길은 useOpenExternal)", async () => {
    const { openExternalUrl } = await import("@/apps/web-user/common/utils/external-link.util");
    const unsupported = Object.assign(new Error("unsupported"), { code: "unsupported" });
    const openExternal = vi.fn().mockRejectedValue(unsupported);
    await withWindow({ location: { href: "" }, PicakeApp: { openExternal } }, async () => {
      await expect(openExternalUrl("mailto:help@example.com")).rejects.toBe(unsupported);
    });
  });

  it("브라우저에서는 웹 주소는 새 창, 전화는 그 자리에서", async () => {
    const { openExternalUrl } = await import("@/apps/web-user/common/utils/external-link.util");
    const loc = { href: "" };
    const open = vi.fn();
    await withWindow({ location: loc, open }, async () => {
      await openExternalUrl("https://instagram.com/dalcom_cake");
      await openExternalUrl("tel:01012345678");
    });
    expect(open).toHaveBeenCalledWith(
      "https://instagram.com/dalcom_cake",
      "_blank",
      "noopener,noreferrer",
    );
    expect(loc.href).toBe("tel:01012345678");
  });
});
