/** 마지막으로 고른 스토어(앱을 다시 켜도 그 스토어로, SC-72 ①). 저장이 막힌 환경에서는 조용히 넘어간다 */
import { getActAsInfo, isActAsMode } from "@/apps/web-seller/common/utils/act-as.util";

const KEY = "picake.seller.lastStoreId";

export function readLastStoreId(): string | null {
  // 운영자 대신 입력 중(기획 I-41)에는 들어간 가게 — 운영자 브라우저에 남은 다른 스토어로 가지 않게
  if (isActAsMode()) return getActAsInfo()?.storeId ?? null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function rememberLastStoreId(storeId: string) {
  // 대리 입력 중에는 운영자 브라우저에 사장님 스토어를 적지 않는다
  if (isActAsMode()) return;
  try {
    window.localStorage.setItem(KEY, storeId);
  } catch {
    // 저장 못 해도 화면은 그대로
  }
}
