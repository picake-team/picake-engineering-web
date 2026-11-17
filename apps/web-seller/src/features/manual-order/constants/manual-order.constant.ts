import type { ManualOrderSource } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

/** 받은 곳(고르는 순서 = 화면 칩 순서) */
export const MANUAL_ORDER_SOURCES: { value: ManualOrderSource; label: string }[] = [
  { value: "KAKAO", label: "카톡" },
  { value: "INSTAGRAM", label: "인스타" },
  { value: "PHONE", label: "전화" },
  { value: "NAVER", label: "네이버" },
  { value: "OTHER", label: "기타" },
];

export const MANUAL_ORDER_SOURCE_LABEL: Record<ManualOrderSource, string> = {
  KAKAO: "카톡",
  INSTAGRAM: "인스타",
  PHONE: "전화",
  NAVER: "네이버",
  OTHER: "기타",
};

/** 서버와 같은 칸 길이 */
export const MANUAL_ORDER_LIMITS = {
  CAKE_NAME_MAX: 100,
  LETTERING_MAX: 100,
  CUSTOMER_NAME_MAX: 50,
  MEMO_MAX: 500,
  PRICE_MAX: 10_000_000,
  PHOTO_MAX: 3,
} as const;

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

/** 마지막으로 고른 받은 곳(다음 주문 적기에서 미리 골라 둔다, 휴대폰마다) */
export const LAST_SOURCE_STORAGE_KEY = "picake.manualOrder.lastSource";
