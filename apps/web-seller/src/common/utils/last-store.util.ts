/** 마지막으로 고른 스토어(앱을 다시 켜도 그 스토어로, SC-72 ①). 저장이 막힌 환경에서는 조용히 넘어간다 */
const KEY = "picake.seller.lastStoreId";

export function readLastStoreId(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function rememberLastStoreId(storeId: string) {
  try {
    window.localStorage.setItem(KEY, storeId);
  } catch {
    // 저장 못 해도 화면은 그대로
  }
}
