/**
 * 링크 효과(기획 I-45)
 *
 * 사장님이 판매자 앱 "손님에게 링크 보내기"로 보낸 가게·상품 주소에는 `?from=link`가 붙는다.
 * 그 주소로 열리면 ① 서버에 이 기기가 링크로 왔다고 남기고(기기 임의 값만, 계정과 잇지 않음)
 * ② 이 기기에 "이 가게는 링크로 왔음"을 30일 남겨, 그 가게에 예약하면 주문에 STORE_LINK를 붙인다.
 * 미리보기를 만드는 프로그램은 화면을 실행하지 않아 남지 않고, 자동화 브라우저는 일부러 남기지 않는다.
 */

export const STORE_LINK_PARAM = "from";
export const STORE_LINK_PARAM_VALUE = "link";
export const STORE_LINK_ENTRY_SOURCE = "STORE_LINK" as const;

/** 링크로 온 가게를 기억하는 기간 — 판매자 앱이 보여 주는 기간(최근 30일)과 같다 */
export const STORE_LINK_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

const VISITOR_KEY_STORAGE = "picake:link-visitor";
const ENTRIES_STORAGE = "picake:store-link-entries";

type Entries = Record<string, number>;

/** 주소가 사장님이 보낸 링크인지 */
export function isStoreLinkSearch(search: string): boolean {
  return new URLSearchParams(search).get(STORE_LINK_PARAM) === STORE_LINK_PARAM_VALUE;
}

function newUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // randomUUID가 없는 오래된 브라우저: 같은 모양(v4)으로 만든다
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** 이 기기의 임의 값(처음 한 번 만들어 둔다). 저장소를 못 쓰면 매번 새로 만든다 */
export function getLinkVisitorKey(storage: Storage | null = safeLocalStorage()): string {
  try {
    const saved = storage?.getItem(VISITOR_KEY_STORAGE);
    if (saved) return saved;
    const key = newUuid();
    storage?.setItem(VISITOR_KEY_STORAGE, key);
    return key;
  } catch {
    return newUuid();
  }
}

function readEntries(storage: Storage | null, now: number): Entries {
  try {
    const raw = storage?.getItem(ENTRIES_STORAGE);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (!parsed || typeof parsed !== "object") return {};
    const fresh: Entries = {};
    for (const [storeId, at] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof at === "number" && now - at < STORE_LINK_REMEMBER_MS) fresh[storeId] = at;
    }
    return fresh;
  } catch {
    return {};
  }
}

/** 이 가게에 링크로 왔다고 기억한다(30일 지난 기록은 지운다) */
export function rememberStoreLinkEntry(
  storeId: string,
  now: number = Date.now(),
  storage: Storage | null = safeLocalStorage(),
): void {
  const entries = readEntries(storage, now);
  entries[storeId] = now;
  try {
    storage?.setItem(ENTRIES_STORAGE, JSON.stringify(entries));
  } catch {
    // 저장소를 못 쓰면 예약에 표시하지 않는다(방문 수는 서버에 남는다)
  }
}

/** 이 가게에 30일 안에 링크로 왔으면 주문에 붙일 값, 아니면 undefined */
export function getStoreLinkEntrySource(
  storeId: string,
  now: number = Date.now(),
  storage: Storage | null = safeLocalStorage(),
): typeof STORE_LINK_ENTRY_SOURCE | undefined {
  return readEntries(storage, now)[storeId] !== undefined ? STORE_LINK_ENTRY_SOURCE : undefined;
}

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
