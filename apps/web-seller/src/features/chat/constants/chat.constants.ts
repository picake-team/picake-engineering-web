import type { ChatReportReason } from "@/apps/web-seller/features/chat/types/chat.type";
import { OrderStatus } from "@/apps/web-seller/features/order/types/order.dto";

/**
 * 픽업 전 예약(서버 CHAT_ACTIVE_ORDER_STATUSES와 같음). 이때만 주문 상세에서 사장님이 먼저 채팅할 수 있다
 * (운영자 결정 2026-11-11, 기획 I-11)
 */
export const CHAT_FIRST_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.RESERVATION_REQUESTED,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAYMENT_COMPLETED,
  OrderStatus.CONFIRMED,
  OrderStatus.PICKUP_PENDING,
];

/** 서버 CHAT_LIMITS와 같은 숫자 */
export const CHAT_LIMITS = {
  TEXT_MAX: 1000,
  IMAGES_MAX: 5,
  POLL_MS_WITH_SOCKET: 15_000,
  POLL_MS_NO_SOCKET: 3_000,
  LIST_POLL_MS: 30_000,
} as const;

/** 서버 CHAT_RULES_VERSION */
export const CHAT_RULES_VERSION = 1;

export const chatQueryKeys = {
  all: ["chat"] as const,
  unread: (storeId: string) => ["chat", storeId, "unread"] as const,
  list: (storeId: string, filter: "reply" | "all") => ["chat", storeId, "list", filter] as const,
  byOrder: (storeId: string, orderId: string) => ["chat", storeId, "order", orderId] as const,
};

/** PostHog 화면 녹화에서 가리는 class(말풍선·사진·입력칸). 대화는 손님과 가게 사이의 것 */
export const CHAT_NO_REPLAY = "ph-no-capture";

/** 서버 SELLER_CHAT_PUSH_TITLE과 같은 글(토스트 아이콘이 이 제목으로 고른다) */
export const SELLER_CHAT_TITLE = "새 문의가 왔어요";

export const CHAT_RULES_LINES = [
  "욕설·괴롭힘·음란·광고·사기는 안 돼요",
  "가게는 손님이 먼저 말한 채팅에만 답할 수 있어요(손님 마지막 글 30일 안, 또는 픽업 전 예약이 있을 때)",
  "할인·행사 안내처럼 손님이 원하지 않는 광고는 보낼 수 없어요",
  "신고된 대화는 Picake가 확인하고 가리거나 이용을 막을 수 있어요",
] as const;

export const CHAT_REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: "ABUSE", label: "욕설·비방·괴롭힘" },
  { value: "SEXUAL", label: "음란·불쾌한 사진" },
  { value: "SPAM", label: "광고·도배" },
  { value: "FRAUD", label: "사기가 의심돼요" },
  { value: "OTHER", label: "그 밖의 이유" },
];
