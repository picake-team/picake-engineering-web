import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeNaverOAuthState,
  getOrCreateNaverOAuthState,
  isNaverOAuthStateValid,
} from "@/apps/web-user/features/auth/utils/naver-oauth-state.util";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  };
}

describe("naver-oauth-state.util — 네이버 로그인 state", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal("window", { sessionStorage: storage });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("한 번 만들면 같은 탭에서는 같은 값(로그인 버튼이 여러 곳이어도)", () => {
    const a = getOrCreateNaverOAuthState();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(getOrCreateNaverOAuthState()).toBe(a);
  });

  it("돌아온 값이 이 탭이 만든 값이어야 통과, 없거나 다르면 막는다", () => {
    const state = getOrCreateNaverOAuthState();
    expect(isNaverOAuthStateValid(state)).toBe(true);
    expect(isNaverOAuthStateValid("other")).toBe(false);
    expect(isNaverOAuthStateValid(null)).toBe(false);
    expect(isNaverOAuthStateValid("")).toBe(false);
  });

  it("이 탭에서 만든 적이 없으면(남이 만든 로그인 결과) 막는다", () => {
    expect(isNaverOAuthStateValid("attacker-state")).toBe(false);
  });

  it("동의 화면에서 취소하고 다시 시도해도 통과(취소로 돌아온 값은 지우지 않음, 11-16 staging)", () => {
    const first = getOrCreateNaverOAuthState();
    // 취소로 돌아옴 — 콜백은 code가 없으면 지우지 않는다
    const second = getOrCreateNaverOAuthState();
    expect(second).toBe(first);
    expect(isNaverOAuthStateValid(first)).toBe(true);
  });

  it("통과한 값은 지워서 같은 로그인 결과를 두 번 쓰지 않고, 다음 로그인은 새 값", () => {
    const a = getOrCreateNaverOAuthState();
    consumeNaverOAuthState(a);
    expect(isNaverOAuthStateValid(a)).toBe(false);
    const b = getOrCreateNaverOAuthState();
    expect(b).not.toBe(a);
    expect(isNaverOAuthStateValid(b)).toBe(true);
  });

  it("30분이 지난 값은 받지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    const a = getOrCreateNaverOAuthState();
    vi.setSystemTime(new Date("2026-11-16T12:29:00Z"));
    expect(isNaverOAuthStateValid(a)).toBe(true);
    vi.setSystemTime(new Date("2026-11-16T12:31:00Z"));
    expect(isNaverOAuthStateValid(a)).toBe(false);
    expect(getOrCreateNaverOAuthState()).not.toBe(a);
  });

  it("예전 모양(값 하나)으로 저장돼 있어도 읽는다 — 배포 직전에 로그인을 시작한 탭", () => {
    const old = "0123456789abcdef0123456789abcdef";
    storage.setItem("picake:naver-oauth-state", old);
    expect(isNaverOAuthStateValid(old)).toBe(true);
    expect(getOrCreateNaverOAuthState()).toBe(old);
    storage.setItem("picake:naver-oauth-state", "{broken");
    expect(isNaverOAuthStateValid("{broken")).toBe(false);
  });

  it("저장소를 아예 못 쓰면 확인할 수 없어 막는다", () => {
    vi.stubGlobal("window", {
      get sessionStorage(): Storage {
        throw new Error("blocked");
      },
    });
    expect(getOrCreateNaverOAuthState()).toMatch(/^[0-9a-f]{32}$/);
    expect(isNaverOAuthStateValid("any")).toBe(false);
    expect(isNaverOAuthStateValid("")).toBe(false);
    expect(() => consumeNaverOAuthState("any")).not.toThrow();
  });
});
