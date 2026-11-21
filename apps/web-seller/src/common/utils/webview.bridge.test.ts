import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appPlatform,
  appVersion,
  canSaveImageToDevice,
  createPushRegistrar,
  getPushPermission,
  getPushRegistration,
  isSellerAppWebView,
  onPushToken,
  openExternal,
  requestPushPermission,
  saveImageToDevice,
  sellerSurface,
  shareViaDevice,
  unregisterDevice,
  type PicakeApp,
} from "@/apps/web-seller/common/utils/webview.bridge";

const g = globalThis as unknown as { window?: Record<string, unknown> };

function setWindow(win: Record<string, unknown> | undefined) {
  g.window = win;
}

function codeError(code: string) {
  return Object.assign(new Error(code), { code });
}

/** 약속대로 생긴 앱 흉내(고칠 메서드만 넘긴다) */
function fakeApp(over: Partial<PicakeApp> = {}): PicakeApp {
  return {
    app: "seller",
    platform: "ios",
    version: "1.0.1",
    build: "18",
    getDeviceId: vi.fn(async () => "device-1"),
    getPushToken: vi.fn(async () => ({ token: "tok-1", deviceId: "device-1" })),
    getPushPermission: vi.fn(async () => "granted" as const),
    requestPushPermission: vi.fn(async () => "granted" as const),
    openSettings: vi.fn(async () => {}),
    openExternal: vi.fn(async () => {}),
    on: vi.fn(() => () => {}),
    share: vi.fn(async () => {}),
    saveImage: vi.fn(async () => {}),
    ...over,
  };
}

function setApp(over: Partial<PicakeApp> = {}): PicakeApp {
  const a = fakeApp(over);
  setWindow({ PicakeApp: a });
  return a;
}

afterEach(() => {
  setWindow(undefined);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("판매자 앱 약속(window.PicakeApp)", () => {
  it("휴대폰 브라우저: PicakeApp이 없으면 앱이 아니고 앱 기능은 조용히 넘어간다", async () => {
    setWindow({});
    expect(isSellerAppWebView()).toBe(false);
    expect(sellerSurface(true)).toBe("mobile_web");
    expect(sellerSurface(false)).toBe("pc");
    expect(appVersion()).toBeNull();
    expect(appPlatform()).toBeNull();
    expect(canSaveImageToDevice()).toBe(false);
    await expect(getPushPermission()).resolves.toBeNull();
    await expect(requestPushPermission()).resolves.toBeNull();
    await expect(getPushRegistration()).resolves.toBeNull();
    await expect(openExternal("https://picakes.com")).resolves.toBe(false);
    expect(onPushToken(() => {})).toBeTypeOf("function");
  });

  it("앱 안: 앱 정보와 알림 허용 상태를 PicakeApp에서 읽는다", async () => {
    const a = setApp({ platform: "android" });
    expect(isSellerAppWebView()).toBe(true);
    expect(sellerSurface(false)).toBe("app");
    expect(appVersion()).toBe("1.0.1");
    expect(appPlatform()).toBe("android");
    await expect(getPushPermission()).resolves.toBe("granted");
    await expect(requestPushPermission()).resolves.toBe("granted");
    expect(a.requestPushPermission).toHaveBeenCalledTimes(1);
  });

  it("앱이 답하지 못하면(unavailable) 알림 상태·토큰은 null", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    setApp({
      getPushPermission: vi.fn(async () => Promise.reject(codeError("unavailable"))),
      getPushToken: vi.fn(async () => Promise.reject(codeError("unavailable"))),
    });
    await expect(getPushPermission()).resolves.toBeNull();
    await expect(getPushRegistration()).resolves.toBeNull();
  });

  it("바깥 링크: 열면 true, 열 앱이 없으면(unsupported) false", async () => {
    const a = setApp();
    await expect(openExternal("https://naver.me/x")).resolves.toBe(true);
    expect(a.openExternal).toHaveBeenCalledWith("https://naver.me/x");
    setApp({ openExternal: vi.fn(async () => Promise.reject(codeError("unsupported"))) });
    await expect(openExternal("webcal://x")).resolves.toBe(false);
  });

  it("공유: 앱 공유 창을 먼저 쓴다", async () => {
    const a = setApp();
    await expect(shareViaDevice("달콤케이크", "https://picakes.com/store/1")).resolves.toBe(true);
    expect(a.share).toHaveBeenCalledWith({
      title: "달콤케이크",
      url: "https://picakes.com/store/1",
    });
  });

  it("사진 저장: 저장·권한 거부·실패를 나눠 돌려주고, 메서드가 없는 앱 버전이면 저장할 수 없다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const a = setApp();
    expect(canSaveImageToDevice()).toBe(true);
    await expect(saveImageToDevice("https://x/y.jpg")).resolves.toBe("saved");
    expect(a.saveImage).toHaveBeenCalledWith("https://x/y.jpg");

    setApp({ saveImage: vi.fn(async () => Promise.reject(codeError("denied"))) });
    await expect(saveImageToDevice("https://x/y.jpg")).resolves.toBe("denied");

    setApp({ saveImage: vi.fn(async () => Promise.reject(codeError("failed"))) });
    await expect(saveImageToDevice("https://x/y.jpg")).resolves.toBe("failed");

    setApp({ saveImage: undefined });
    expect(canSaveImageToDevice()).toBe(false);
  });
});

describe("이 휴대폰 알림 등록", () => {
  it("같은 토큰·기기는 한 번만 보내고, 값이 바뀌면 다시 보낸다", async () => {
    setApp();
    const send = vi.fn(async () => true);
    const registrar = createPushRegistrar(send);
    await registrar.register();
    await registrar.register();
    await registrar.register({ token: " tok-1 ", deviceId: "device-1" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ token: "tok-1", deviceId: "device-1" });

    await registrar.register({ token: "tok-2", deviceId: "device-1" });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith({ token: "tok-2", deviceId: "device-1" });
  });

  it("허용이 아니면(null) 보내지 않는다", async () => {
    setApp({ getPushToken: vi.fn(async () => null) });
    const send = vi.fn(async () => true);
    await createPushRegistrar(send).register();
    expect(send).not.toHaveBeenCalled();
  });

  it("보내지 못했으면(실패·건너뜀) 다음에 다시 보내고, reset 뒤에도 다시 보낸다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    setApp();
    const send = vi
      .fn<(r: { token: string; deviceId: string }) => Promise<boolean>>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    const registrar = createPushRegistrar(send);
    await registrar.register();
    await registrar.register();
    await registrar.register();
    await registrar.register();
    expect(send).toHaveBeenCalledTimes(3);

    registrar.reset();
    await registrar.register();
    expect(send).toHaveBeenCalledTimes(4);
  });

  it("동시에 여러 번 불려도 한 번만 보낸다", async () => {
    setApp();
    const send = vi.fn(async () => true);
    const registrar = createPushRegistrar(send);
    await Promise.all([registrar.register(), registrar.register(), registrar.register()]);
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("로그아웃 때 이 기기 알림 해제", () => {
  it("기기 ID로 서버에서 지운다", async () => {
    setApp();
    const send = vi.fn(async () => {});
    await unregisterDevice(send, 3000);
    expect(send).toHaveBeenCalledWith("device-1");
  });

  it("앱이 답하지 않아도 정한 시간 안에 끝난다", async () => {
    vi.useFakeTimers();
    setApp({ getDeviceId: vi.fn(() => new Promise<string>(() => {})) });
    const send = vi.fn(async () => {});
    let done = false;
    void unregisterDevice(send, 3000).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(2999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  it("서버가 실패해도 reject하지 않는다(로그아웃은 이어진다)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    setApp();
    await expect(
      unregisterDevice(async () => Promise.reject(new Error("500")), 3000),
    ).resolves.toBeUndefined();
  });

  it("앱이 아니면 아무것도 하지 않는다", async () => {
    setWindow({});
    const send = vi.fn(async () => {});
    await unregisterDevice(send, 3000);
    expect(send).not.toHaveBeenCalled();
  });
});
