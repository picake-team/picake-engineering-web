import type { ChatReportReason } from "@/apps/web-user/features/chat/types/chat.type";

/** 서버 CHAT_LIMITS와 같은 숫자 */
export const CHAT_LIMITS = {
  TEXT_MAX: 1000,
  IMAGES_MAX: 5,
  /** 소켓이 붙어 있을 때 방에서 한 번 더 확인하는 간격(놓친 신호 대비) */
  POLL_MS_WITH_SOCKET: 15_000,
  /** 소켓이 끊겼을 때 확인 간격 */
  POLL_MS_NO_SOCKET: 3_000,
  /** 목록·안 읽음 확인 간격 */
  LIST_POLL_MS: 30_000,
} as const;

export const chatQueryKeys = {
  all: ["chat"] as const,
  unread: () => ["chat", "unread"] as const,
  list: () => ["chat", "list"] as const,
  byStore: (storeId: string) => ["chat", "store", storeId] as const,
  messages: (threadId: string) => ["chat", "messages", threadId] as const,
};

/**
 * PostHog 화면 녹화에서 가리는 class(말풍선·사진·입력칸). 견적 요청의 QUOTE_NO_REPLAY와 같은 값.
 * 대화는 가게와 손님 사이의 것이라 이용 통계에 남기지 않는다.
 */
export const CHAT_NO_REPLAY = "ph-no-capture";

/** 채팅 이용 규칙(처음 보낼 때 한 번 동의). 바뀌면 서버 CHAT_RULES_VERSION을 올린다 */
export const CHAT_RULES_LINES = [
  "욕설·괴롭힘·음란·광고·사기는 안 돼요",
  "불편한 대화는 ⋯ 에서 신고·차단할 수 있어요",
  "신고된 대화는 Picake가 확인하고 가리거나 이용을 막을 수 있어요",
  "가게와 나눈 대화는 이 가게 사장님이 볼 수 있어요",
] as const;

export const CHAT_REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: "ABUSE", label: "욕설·비방·괴롭힘" },
  { value: "SEXUAL", label: "음란·불쾌한 사진" },
  { value: "SPAM", label: "광고·도배" },
  { value: "FRAUD", label: "사기가 의심돼요" },
  { value: "OTHER", label: "그 밖의 이유" },
];
