import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appleAuthorizeUrl,
  sellerAppleRedirectUri,
} from "@/apps/web-seller/features/auth/components/mobile/socialLogin";
import { isNaverOAuthStateValid } from "@/apps/web-seller/features/auth/utils/naver-oauth-state.util";

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

describe("사장님 애플 로그인 주소(2026-11-26)", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: memoryStorage() });
    vi.stubEnv("VITE_PUBLIC_APPLE_CLIENT_ID", "com.product.picake.web");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("Return URL은 서버 주소 — 상용은 api.picakes.com, 그 밖(로컬·staging)은 api-staging(서버 getSellerAppleRedirectUri와 같게)", () => {
    expect(sellerAppleRedirectUri("production")).toBe(
      "https://api.picakes.com/v1/seller/auth/apple/callback",
    );
    expect(sellerAppleRedirectUri("staging")).toBe(
      "https://api-staging.picakes.com/v1/seller/auth/apple/callback",
    );
    expect(sellerAppleRedirectUri("development")).toBe(
      "https://api-staging.picakes.com/v1/seller/auth/apple/callback",
    );
  });

  it("손님과 같은 Services ID, form_post·이름·이메일, 이 탭의 state를 붙인다", () => {
    const url = new URL(appleAuthorizeUrl());
    expect(`${url.origin}${url.pathname}`).toBe("https://appleid.apple.com/auth/authorize");
    expect(url.searchParams.get("client_id")).toBe("com.product.picake.web");
    expect(url.searchParams.get("redirect_uri")).toBe(sellerAppleRedirectUri());
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("response_mode")).toBe("form_post");
    expect(url.searchParams.get("scope")).toBe("name email");
    const state = url.searchParams.get("state") ?? "";
    expect(state).toMatch(/^[0-9a-f]{32}$/);
    // 콜백에서 확인할 값으로 이 탭에 저장돼 있다
    expect(isNaverOAuthStateValid(state)).toBe(true);
  });
});
