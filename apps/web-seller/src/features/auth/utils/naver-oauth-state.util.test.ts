import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearNaverOAuthState,
  getOrCreateNaverOAuthState,
  isNaverOAuthStateValid,
} from "@/apps/web-seller/features/auth/utils/naver-oauth-state.util";

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
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: memoryStorage() });
  });

  it("한 번 만들면 같은 탭에서는 같은 값(로그인 버튼이 여러 곳이어도)", () => {
    const a = getOrCreateNaverOAuthState();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(getOrCreateNaverOAuthState()).toBe(a);
  });

  it("돌아온 값이 같아야 통과, 없거나 다르면 막는다", () => {
    const state = getOrCreateNaverOAuthState();
    expect(isNaverOAuthStateValid(state)).toBe(true);
    expect(isNaverOAuthStateValid("other")).toBe(false);
    expect(isNaverOAuthStateValid(null)).toBe(false);
  });

  it("이 탭에서 만든 적이 없으면(남이 만든 로그인 결과) 막는다", () => {
    expect(isNaverOAuthStateValid("attacker-state")).toBe(false);
  });

  it("지우면 다음 로그인은 새 값", () => {
    const a = getOrCreateNaverOAuthState();
    clearNaverOAuthState();
    expect(isNaverOAuthStateValid(a)).toBe(false);
    expect(getOrCreateNaverOAuthState()).not.toBe(a);
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
  });
});
