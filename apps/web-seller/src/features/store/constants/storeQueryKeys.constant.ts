import type { GetSellerStoresQueryParams } from "@/apps/web-seller/features/store/types/store.ui";

/**
 * Store 관련 쿼리 키 상수
 */
export const storeQueryKeys = {
  all: ["store"] as const,
  lists: () => ["store", "list"] as const,
  list: (params: Partial<GetSellerStoresQueryParams>) => ["store", "list", params] as const,
  details: () => ["store", "detail"] as const,
  detail: (storeId: string) => ["store", "detail", storeId] as const,
  linkStats: (storeId: string) => ["store", "link-stats", storeId] as const,
} as const;
