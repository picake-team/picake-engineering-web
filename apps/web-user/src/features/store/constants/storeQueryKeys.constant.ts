import type { StoreListFilter } from "@/apps/web-user/features/store/types/store.type";

export const storeQueryKeys = {
  all: ["store"] as const,
  detail: (storeId: string) => ["store", "detail", storeId] as const,
  list: (
    params: {
      search?: string;
      sortBy?: string;
      latitude?: number;
      longitude?: number;
    } & StoreListFilter,
  ) => ["store", "list", params] as const,
  /** 지도 페이지 — 필터 조건별 전체 스토어 조회 캐시 */
  mapAll: (params: Record<string, unknown>) => ["store", "map-all", params] as const,
  entryRequestExists: (kakaoPlaceId: string) =>
    ["store", "entry-request", "exists", kakaoPlaceId] as const,
} as const;
