import type { QuoteCakeSize, QuoteCream } from "@/apps/web-user/features/quote/types/quote.type";

/** 요청서 규칙(기획 I-46 요청서 표, backend와 같은 숫자) */
export const QUOTE_LIMITS = {
  MIN_LEAD_HOURS: 3,
  MAX_PHOTOS: 3,
  DESCRIPTION_MAX: 500,
  REQUEST_NOTE_MAX: 200,
  FLAVOR_NOTE_MAX: 30,
  MAX_STORES: 5,
  MAX_QUANTITY: 50,
  BUDGET_MIN: 10_000,
  BUDGET_MAX: 100_000,
  BUDGET_STEP: 10_000,
} as const;

/** 크기 칸: 이름·인원·지름(대략, 가게마다 조금씩 다름) */
export const QUOTE_SIZE_OPTIONS: {
  value: QuoteCakeSize;
  label: string;
  people: string;
  diameter: string;
}[] = [
  { value: "LUNCHBOX", label: "도시락", people: "1명", diameter: "도시락은 지름 약 10cm예요" },
  { value: "MINI", label: "미니", people: "1~2명", diameter: "미니는 지름 약 12cm예요" },
  { value: "NO1", label: "1호", people: "2~4명", diameter: "1호는 지름 약 15cm예요" },
  { value: "NO2", label: "2호", people: "4~6명", diameter: "2호는 지름 약 18cm예요" },
  { value: "NO3", label: "3호", people: "6~8명", diameter: "3호는 지름 약 21cm예요" },
  { value: "LARGER", label: "더 크게", people: "8명+", diameter: "3호(지름 약 21cm)보다 커요" },
];

export const QUOTE_CREAM_OPTIONS: { value: QuoteCream; label: string }[] = [
  { value: "FRESH_CREAM", label: "생크림" },
  { value: "BUTTER_CREAM", label: "버터크림" },
  { value: "CREAM_CHEESE", label: "크림치즈" },
];

/** 거리 막대: 1·2·3·4·5·10·20km·시도 전체(마지막 칸) */
export const QUOTE_DISTANCE_STOPS = [1, 2, 3, 4, 5, 10, 20, "SIDO"] as const;
export type QuoteDistance = (typeof QUOTE_DISTANCE_STOPS)[number];
export const QUOTE_DEFAULT_DISTANCE: QuoteDistance = 3;

export const quoteQueryKeys = {
  all: ["quote-requests"] as const,
  list: (tab: string) => ["quote-requests", "list", tab] as const,
  detail: (id: string) => ["quote-requests", "detail", id] as const,
};

export const QUOTE_DRAFT_STORAGE_KEY = "picake:quoteDraft";

/**
 * PostHog 화면 녹화(세션 리플레이)에서 가리는 class. 손님이 올린 참고 사진(얼굴·이름이 있을 수 있음)과
 * 직접 쓴 설명·요청 사항은 가게에 주려고 받은 것이라 이용 통계(PostHog)에 남기지 않는다. 녹화에는 빈 상자로 보인다.
 * 입력칸은 PostHog가 원래 가린다.
 */
export const QUOTE_NO_REPLAY = "ph-no-capture";
