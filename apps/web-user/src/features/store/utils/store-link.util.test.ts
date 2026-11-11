import { describe, expect, it } from "vitest";
import {
  STORE_LINK_REMEMBER_MS,
  getLinkVisitorKey,
  getStoreLinkEntrySource,
  isStoreLinkSearch,
  rememberStoreLinkEntry,
} from "@/apps/web-user/features/store/utils/store-link.util";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("링크 효과 — 손님 기기 기록 (I-45)", () => {
  it("사장님이 보낸 링크(?from=link)만 알아본다", () => {
    expect(isStoreLinkSearch("?from=link")).toBe(true);
    expect(isStoreLinkSearch("?entry_point=home&from=link")).toBe(true);
    expect(isStoreLinkSearch("?from=home")).toBe(false);
    expect(isStoreLinkSearch("")).toBe(false);
  });

  it("기기 임의 값은 한 번 만들면 그대로 쓴다", () => {
    const storage = memoryStorage();
    const a = getLinkVisitorKey(storage);
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(getLinkVisitorKey(storage)).toBe(a);
  });

  it("링크로 온 가게는 30일 동안 예약에 STORE_LINK를 붙이고, 다른 가게에는 붙이지 않는다", () => {
    const storage = memoryStorage();
    const t0 = 1_800_000_000_000;
    rememberStoreLinkEntry("store-a", t0, storage);

    expect(getStoreLinkEntrySource("store-a", t0 + 1000, storage)).toBe("STORE_LINK");
    expect(getStoreLinkEntrySource("store-b", t0 + 1000, storage)).toBeUndefined();
    expect(getStoreLinkEntrySource("store-a", t0 + STORE_LINK_REMEMBER_MS + 1, storage)).toBe(
      undefined,
    );
  });

  it("다시 링크로 오면 30일을 새로 센다", () => {
    const storage = memoryStorage();
    const t0 = 1_800_000_000_000;
    rememberStoreLinkEntry("store-a", t0, storage);
    rememberStoreLinkEntry("store-a", t0 + STORE_LINK_REMEMBER_MS - 10, storage);
    expect(getStoreLinkEntrySource("store-a", t0 + STORE_LINK_REMEMBER_MS + 1000, storage)).toBe(
      "STORE_LINK",
    );
  });

  it("저장된 값이 깨져 있어도 멈추지 않는다", () => {
    const storage = memoryStorage();
    storage.setItem("picake:store-link-entries", "{not json");
    expect(getStoreLinkEntrySource("store-a", Date.now(), storage)).toBeUndefined();
    rememberStoreLinkEntry("store-a", Date.now(), storage);
    expect(getStoreLinkEntrySource("store-a", Date.now(), storage)).toBe("STORE_LINK");
  });
});
