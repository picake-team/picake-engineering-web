/**
 * 쿼리 키. Picake 주문(["order", …])과 같은 앞자리라 홈을 당겨 새로 고치면 같이 다시 읽는다
 */
export const manualOrderQueryKeys = {
  all: ["order", "manual"] as const,
  range: (storeId: string, startKey: string, endKey: string) =>
    ["order", "manual", "range", storeId, startKey, endKey] as const,
  detail: (storeId: string, id: string) => ["order", "manual", "detail", storeId, id] as const,
  calendarFeed: (storeId: string) => ["manual-order", "calendar-feed", storeId] as const,
} as const;
