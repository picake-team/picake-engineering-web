import type { ManualOrderSource } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

/** 받은 곳(고르는 순서 = 화면 칩 순서) */
export const MANUAL_ORDER_SOURCES: { value: ManualOrderSource; label: string }[] = [
  { value: "KAKAO", label: "카톡" },
  { value: "INSTAGRAM", label: "인스타" },
  { value: "PHONE", label: "전화" },
  { value: "NAVER", label: "네이버" },
  { value: "OTHER", label: "기타" },
];

export const MANUAL_ORDER_SOURCE_LABEL = Object.fromEntries(
  MANUAL_ORDER_SOURCES.map((s) => [s.value, s.label]),
) as Record<ManualOrderSource, string>;

/** 서버와 같은 칸 길이 */
export const MANUAL_ORDER_LIMITS = {
  CAKE_NAME_MAX: 100,
  LETTERING_MAX: 100,
  CUSTOMER_NAME_MAX: 50,
  MEMO_MAX: 500,
  PRICE_MAX: 10_000_000,
  PHOTO_MAX: 3,
} as const;

/** 마지막으로 고른 받은 곳(다음 주문 적기에서 미리 골라 둔다, 휴대폰마다) */
export const LAST_SOURCE_STORAGE_KEY = "picake.manualOrder.lastSource";
