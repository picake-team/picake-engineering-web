import { useEffect } from "react";
import { storeApi } from "@/apps/web-user/features/store/apis/store.api";
import { isSyntheticBrowser } from "@/apps/web-user/common/utils/synthetic-traffic.util";
import {
  getLinkVisitorKey,
  isStoreLinkSearch,
  rememberStoreLinkEntry,
} from "@/apps/web-user/features/store/utils/store-link.util";

/** 한 번 연 화면에서 같은 가게를 두 번 남기지 않는다(다시 그려질 때) */
const recordedThisPage = new Set<string>();

/**
 * 사장님이 보낸 링크(?from=link)로 가게·상품 화면이 열리면 방문을 남기고 이 가게를 30일 기억한다(기획 I-45).
 * 상품 화면은 상품을 불러와 가게 ID를 안 뒤에 부른다. 실패해도 화면에는 아무것도 보이지 않는다.
 */
export function useStoreLinkVisit(storeId: string | undefined) {
  useEffect(() => {
    if (!storeId || typeof window === "undefined") return;
    if (!isStoreLinkSearch(window.location.search) || isSyntheticBrowser()) return;
    const pageKey = `${window.location.pathname}|${storeId}`;
    if (recordedThisPage.has(pageKey)) return;
    recordedThisPage.add(pageKey);

    rememberStoreLinkEntry(storeId);
    void storeApi.recordLinkVisit(storeId, getLinkVisitorKey()).catch(() => undefined);
  }, [storeId]);
}
