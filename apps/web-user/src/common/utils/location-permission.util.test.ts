import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgetLocationGranted,
  getBrowserGeolocationPermission,
  hasLocationGranted,
  rememberLocationGranted,
} from "./location-permission.util";

/** 첫 화면에서 위치를 묻지 않고, 전에 허용한 사람만 조용히 다시 받기(2026-11-16) */
describe("location-permission.util", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("위치를 받으면 기억하고, 거부를 알면 잊는다", () => {
    expect(hasLocationGranted()).toBe(false);
    rememberLocationGranted();
    expect(hasLocationGranted()).toBe(true);
    forgetLocationGranted();
    expect(hasLocationGranted()).toBe(false);
  });

  it("저장소를 쓸 수 없으면 받은 적 없는 것으로 보고 오류를 내지 않는다", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("window", {
      localStorage: { getItem: blocked, setItem: blocked, removeItem: blocked },
    });
    expect(() => rememberLocationGranted()).not.toThrow();
    expect(() => forgetLocationGranted()).not.toThrow();
    expect(hasLocationGranted()).toBe(false);
  });

  it("브라우저 권한 상태는 묻는 창 없이 읽고, 알 수 없으면 unknown", async () => {
    vi.stubGlobal("navigator", {
      permissions: { query: vi.fn().mockResolvedValue({ state: "granted" }) },
    });
    expect(await getBrowserGeolocationPermission()).toBe("granted");
    vi.stubGlobal("navigator", {
      permissions: { query: vi.fn().mockRejectedValue(new Error("x")) },
    });
    expect(await getBrowserGeolocationPermission()).toBe("unknown");
    vi.stubGlobal("navigator", {});
    expect(await getBrowserGeolocationPermission()).toBe("unknown");
  });
});
