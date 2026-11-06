import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appVersion,
  externalHref,
  isSellerAppWebView,
  saveImageToDevice,
  sellerSurface,
  shareViaDevice,
} from "@/apps/web-seller/common/utils/webview.bridge";

const g = globalThis as unknown as { window?: Record<string, unknown>; navigator?: unknown };

function setWindow(win: Record<string, unknown> | undefined) {
  g.window = win;
}

afterEach(() => {
  setWindow(undefined);
});

describe("판매자 앱 브릿지", () => {
  it("휴대폰 브라우저: 앱 채널이 없으면 앱이 아니고 바깥 링크는 그대로", () => {
    setWindow({});
    expect(isSellerAppWebView()).toBe(false);
    expect(externalHref("https://picakes.com/mypage/support")).toBe(
      "https://picakes.com/mypage/support",
    );
    expect(sellerSurface(true)).toBe("mobile_web");
    expect(sellerSurface(false)).toBe("pc");
    expect(appVersion()).toBeNull();
    expect(saveImageToDevice("https://x/y.jpg")).toBe(false);
  });

  it("앱 안: 바깥 링크는 apps://, 사진 저장·공유는 앱 채널로", async () => {
    const save = vi.fn();
    const share = vi.fn();
    setWindow({
      requestFcmTokenUpsert: { postMessage: vi.fn() },
      saveImage: { postMessage: save },
      shareLink: { postMessage: share },
      PicakeSellerApp: { version: "1.0.0" },
    });
    expect(isSellerAppWebView()).toBe(true);
    expect(externalHref("https://picakes.com")).toBe("apps://https://picakes.com");
    expect(sellerSurface(true)).toBe("app");
    expect(appVersion()).toBe("1.0.0");
    expect(saveImageToDevice("https://x/y.jpg")).toBe(true);
    expect(save).toHaveBeenCalledWith("https://x/y.jpg");
    await expect(shareViaDevice("달콤케이크", "https://picakes.com/store/1")).resolves.toBe(true);
    expect(share).toHaveBeenCalledWith(
      JSON.stringify({ title: "달콤케이크", url: "https://picakes.com/store/1" }),
    );
  });
});
