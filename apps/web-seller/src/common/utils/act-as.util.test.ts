import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearActAsSession,
  getActAsInfo,
  isActAsMode,
  remainingMinutes,
  setActAsSession,
} from "@/apps/web-seller/common/utils/act-as.util";
import { getAccessToken, setAccessToken } from "@/apps/web-seller/common/utils/token.util";

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("운영자 대신 입력 출입증(기획 I-41)", () => {
  let local: ReturnType<typeof fakeStorage>;
  beforeEach(() => {
    local = fakeStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("window", {
      localStorage: local,
      sessionStorage: fakeStorage(),
      location: { pathname: "/" },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("대리 출입증이 있으면 그것을 먼저 쓰고, 사장님 출입증(localStorage)은 그대로 둔다", () => {
    setAccessToken("seller-token");
    expect(getAccessToken()).toBe("seller-token");
    setActAsSession("act-as-token", { storeId: "st_1", expiresAt: "2026-12-01T00:00:00.000Z" });
    expect(getAccessToken()).toBe("act-as-token");
    expect(local.getItem("accessToken")).toBe("seller-token");
    expect(getActAsInfo()).toEqual({ storeId: "st_1", expiresAt: "2026-12-01T00:00:00.000Z" });

    clearActAsSession();
    expect(getAccessToken()).toBe("seller-token");
    expect(getActAsInfo()).toBeNull();
  });

  it("들어오기·끝난 화면 주소도 대리 입력으로 본다(PostHog를 처음부터 켜지 않게)", () => {
    expect(isActAsMode("/act-as")).toBe(true);
    expect(isActAsMode("/act-as/ended")).toBe(true);
    expect(isActAsMode("/act-ass")).toBe(false);
    expect(isActAsMode("/stores/st_1")).toBe(false);
    expect(isActAsMode()).toBe(false);
    setActAsSession("t", { storeId: "st_1", expiresAt: "2026-12-01T00:00:00.000Z" });
    expect(isActAsMode("/stores/st_1")).toBe(true);
  });

  it("남은 분은 올림, 지나면 0", () => {
    const now = Date.parse("2026-12-01T00:00:00.000Z");
    expect(remainingMinutes("2026-12-01T00:52:00.000Z", now)).toBe(52);
    expect(remainingMinutes("2026-12-01T00:00:30.000Z", now)).toBe(1);
    expect(remainingMinutes("2026-11-30T23:59:00.000Z", now)).toBe(0);
    expect(remainingMinutes("x", now)).toBe(0);
  });
});
