import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearActAsSession,
  endActAsAndLeave,
  getActAsInfo,
  isActAsEndedInThisPage,
  isActAsMode,
  remainingMinutes,
  setActAsSession,
} from "@/apps/web-seller/common/utils/act-as.util";
import {
  readLastStoreId,
  rememberLastStoreId,
} from "@/apps/web-seller/common/utils/last-store.util";
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
  let session: ReturnType<typeof fakeStorage>;
  let replace: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    local = fakeStorage();
    session = fakeStorage();
    replace = vi.fn();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("window", {
      localStorage: local,
      sessionStorage: session,
      location: { pathname: "/", replace },
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

  it("저장소에 못 쓰면 false — 들어오기 화면이 실패로 알린다", () => {
    expect(setActAsSession("t", { storeId: "st_1", expiresAt: "2026-12-01T00:00:00.000Z" })).toBe(
      true,
    );
    clearActAsSession();
    session.setItem = () => {
      throw new Error("blocked");
    };
    expect(setActAsSession("t", { storeId: "st_1", expiresAt: "2026-12-01T00:00:00.000Z" })).toBe(
      false,
    );
    expect(getAccessToken()).toBeNull();
  });

  it("끝내면 이 탭에 끝났다는 표시를 남기고, 다시 들어오면 지운다", () => {
    setActAsSession("t", { storeId: "st_1", expiresAt: "2026-12-01T00:00:00.000Z" });
    endActAsAndLeave();
    expect(replace).toHaveBeenCalledWith("/act-as/ended");
    expect(getAccessToken()).toBeNull();
    expect(session.getItem("actAsEnded")).toBe("1");
    expect(isActAsEndedInThisPage()).toBe(true);
    setActAsSession("t2", { storeId: "st_1", expiresAt: "2026-12-01T00:00:00.000Z" });
    expect(session.getItem("actAsEnded")).toBeNull();
  });

  it("대리 입력 중 마지막 스토어는 들어간 가게이고, 운영자 브라우저에 적지 않는다", () => {
    local.setItem("picake.seller.lastStoreId", "st_mine");
    expect(readLastStoreId()).toBe("st_mine");
    setActAsSession("t", { storeId: "st_owner", expiresAt: "2026-12-01T00:00:00.000Z" });
    expect(readLastStoreId()).toBe("st_owner");
    rememberLastStoreId("st_other");
    expect(local.getItem("picake.seller.lastStoreId")).toBe("st_mine");
  });

  it("남은 분은 올림, 지나면 0", () => {
    const now = Date.parse("2026-12-01T00:00:00.000Z");
    expect(remainingMinutes("2026-12-01T00:52:00.000Z", now)).toBe(52);
    expect(remainingMinutes("2026-12-01T00:00:30.000Z", now)).toBe(1);
    expect(remainingMinutes("2026-11-30T23:59:00.000Z", now)).toBe(0);
    expect(remainingMinutes("x", now)).toBe(0);
  });
});
