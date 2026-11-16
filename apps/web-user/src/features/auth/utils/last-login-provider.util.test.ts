import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearLastLoginProvider,
  readLastLoginProvider,
  saveLastLoginProvider,
} from "@/apps/web-user/features/auth/utils/last-login-provider.util";

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("최근 로그인 방법(로그인 화면 말풍선)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("저장한 방법을 읽고, 탈퇴하면 지운다", () => {
    vi.stubGlobal("window", { localStorage: fakeStorage() });
    expect(readLastLoginProvider()).toBeNull();
    saveLastLoginProvider("kakao");
    expect(readLastLoginProvider()).toBe("kakao");
    saveLastLoginProvider("google");
    expect(readLastLoginProvider()).toBe("google");
    clearLastLoginProvider();
    expect(readLastLoginProvider()).toBeNull();
  });

  it("모르는 값은 무시한다(말풍선 없음)", () => {
    const storage = fakeStorage();
    storage.setItem("picake:last-login-provider", "line");
    vi.stubGlobal("window", { localStorage: storage });
    expect(readLastLoginProvider()).toBeNull();
  });

  it("네이버도 최근 로그인으로 알아본다", () => {
    const storage = fakeStorage();
    storage.setItem("picake:last-login-provider", "naver");
    vi.stubGlobal("window", { localStorage: storage });
    expect(readLastLoginProvider()).toBe("naver");
  });

  it("저장소를 못 써도(사생활 보호 모드 등) 오류 없이 말풍선만 안 뜬다", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    vi.stubGlobal("window", { localStorage: broken });
    expect(() => saveLastLoginProvider("apple")).not.toThrow();
    expect(readLastLoginProvider()).toBeNull();
    expect(() => clearLastLoginProvider()).not.toThrow();
  });
});
