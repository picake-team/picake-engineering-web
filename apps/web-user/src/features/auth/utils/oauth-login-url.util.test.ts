import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getNaverOAuthLoginUrl } from "@/apps/web-user/features/auth/utils/oauth-login-url.util";

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

describe("getNaverOAuthLoginUrl — 네이버 로그인 시작 주소", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      sessionStorage: memoryStorage(),
      location: { origin: "https://picakes.com" },
    });
    vi.stubEnv("NEXT_PUBLIC_NAVER_CLIENT_ID", "test-client-id");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("보통 로그인은 네이버에 로그인돼 있으면 그대로 넘어간다(auth_type 없음)", () => {
    const url = new URL(getNaverOAuthLoginUrl() ?? "");
    expect(url.origin + url.pathname).toBe("https://nid.naver.com/oauth2.0/authorize");
    expect(url.searchParams.get("client_id")).toBe("test-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://picakes.com/auth/login/naver");
    expect(url.searchParams.get("state")).toMatch(/^[0-9a-f]{32}$/);
    expect(url.searchParams.has("auth_type")).toBe(false);
  });

  it("'이미 가입한 계정' 화면은 아이디·비밀번호를 다시 받는다(auth_type=reauthenticate)", () => {
    const url = new URL(getNaverOAuthLoginUrl({ reauthenticate: true }) ?? "");
    expect(url.searchParams.get("auth_type")).toBe("reauthenticate");
    expect(url.searchParams.get("state")).toMatch(/^[0-9a-f]{32}$/);
  });

  it("키가 없는 환경은 null(버튼을 숨김)", () => {
    vi.stubEnv("NEXT_PUBLIC_NAVER_CLIENT_ID", "");
    expect(getNaverOAuthLoginUrl({ reauthenticate: true })).toBeNull();
  });
});
