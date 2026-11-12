/** 견적 요청(기획 I-46) — backend `/v1/consumer/quote-requests` 응답·요청 모양 */

export type QuoteCakeSize = "LUNCHBOX" | "MINI" | "NO1" | "NO2" | "NO3" | "LARGER";
export type QuoteCream = "FRESH_CREAM" | "BUTTER_CREAM" | "CREAM_CHEESE";
export type QuoteRequestEntry = "HOME" | "SEARCH" | "MAP" | "STORE" | "MYPAGE";
export type QuoteRequestStatus = "OPEN" | "CONNECTED" | "CLOSED";
export type QuoteRequestCloseReason = "EXPIRED" | "CONSUMER" | "ADMIN";
export type QuoteRequestListTab = "ONGOING" | "PAST";

/** 물어볼 가게: Picake 가게(storeId) 또는 지도의 입점 전 가게(kakaoPlaceId + 이름) */
export interface QuoteStoreInput {
  storeId?: string;
  kakaoPlaceId?: string;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  placeUrl?: string;
}

export interface CreateQuoteRequestBody {
  pickupDate: string;
  pickupHourFrom?: number;
  pickupHourTo?: number;
  onlyDesignatedStores?: boolean;
  areaName?: string;
  areaSido?: string;
  areaLatitude?: number;
  areaLongitude?: number;
  distanceKm?: number;
  wholeSido?: boolean;
  stores?: QuoteStoreInput[];
  description?: string;
  photoUrls?: string[];
  size: QuoteCakeSize;
  quantity: number;
  creams?: QuoteCream[];
  flavorNote?: string;
  budgetMin: number;
  budgetMax?: number;
  requestNote?: string;
  entry?: QuoteRequestEntry;
}

export interface CreateQuoteRequestResponse {
  id: string;
  pickupStartAt: string;
  deadlineAt: string;
}

/** 사람이 읽는 줄(서버가 만들어 줌) */
export interface QuoteRequestSummary {
  pickup: string;
  area: string;
  cake: string;
  budget: string;
  deadline: string;
}

export interface QuoteRequestListItem {
  id: string;
  status: QuoteRequestStatus;
  closeReason: QuoteRequestCloseReason | null;
  pickupDate: string;
  pickupHourFrom: number | null;
  pickupHourTo: number | null;
  pickupStartAt: string;
  deadlineAt: string;
  size: QuoteCakeSize;
  quantity: number;
  thumbnailUrl: string | null;
  quoteCount: number;
  /** 아직 보지 않은 견적 수 */
  unseenQuoteCount: number;
  /** 가게를 골랐나(가게 연결) */
  chosen: boolean;
  summary: QuoteRequestSummary;
  createdAt: string;
}

export interface QuoteRequestStore {
  id: string;
  storeId: string | null;
  kakaoPlaceId: string | null;
  name: string;
  address: string | null;
  isPicakeStore: boolean;
}

export interface QuoteRequestDetail extends QuoteRequestListItem {
  description: string | null;
  photoUrls: string[];
  creams: QuoteCream[];
  flavorNote: string | null;
  budgetMin: number;
  budgetMax: number | null;
  requestNote: string | null;
  onlyDesignatedStores: boolean;
  areaName: string | null;
  areaSido: string | null;
  distanceKm: number | null;
  stores: QuoteRequestStore[];
  closedAt: string | null;
}

export interface QuoteRequestListResponse {
  data: QuoteRequestListItem[];
  meta: {
    currentPage: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  counts: { ongoing: number; past: number };
}

/** 카카오 지역(동네) 검색 결과 */
export interface QuoteAreaOption {
  name: string;
  fullName: string;
  sido: string;
  latitude: number;
  longitude: number;
}

/** 카카오 장소(입점 전 가게) 검색 결과 */
export interface QuotePlaceOption {
  kakaoPlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  placeUrl: string;
}

/** 가게 견적(기획 I-46 ②) — 서버 modules/quote-request/dto/quote.dto.ts와 같은 모양 */
export type QuoteSimilarity = "EXACT" | "SIMILAR" | "INSPIRED";
export type QuoteDeclineReason = "FULLY_BOOKED" | "NOT_OUR_STYLE" | "BUDGET" | "OTHER";
export type QuoteTargetState =
  | "OPEN"
  | "SENT"
  | "DECLINED"
  | "CHOSEN_ME"
  | "CHOSEN_OTHER"
  | "CLOSED"
  | "FULL";

export interface Quote {
  id: string;
  targetId: string;
  storeName: string;
  storeId: string | null;
  isPicakeStore: boolean;
  logoImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  total: number;
  priceMayVary: boolean;
  similarity: QuoteSimilarity;
  similarityLabel: string;
  similarityDetail: string;
  memo: string | null;
  photoUrls: string[];
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumerQuote extends Quote {
  unseen: boolean;
  chosen: boolean;
  canChoose: boolean;
  threadId: string | null;
}

export interface ConsumerQuoteSection {
  quotes: ConsumerQuote[];
  /** 어려워요로 답한 가게(이유는 손님에게 보이지 않음, SC-19 3) */
  declined: { targetId: string; storeName: string }[];
  askedCount: number;
  chosenTargetId: string | null;
  chosenAt: string | null;
  rechooseUntil: string | null;
}

export interface ChooseQuoteResponse {
  requestId: string;
  targetId: string;
  threadId: string | null;
}

/** 견적 링크(SC-19, 가입 없이) */
export interface QuoteLinkView {
  requestId: string;
  targetId: string;
  storeName: string;
  pickup: string;
  cake: string;
  budget: string;
  area: string | null;
  deadline: string;
  deadlineAt: string;
  quantity: number;
  description: string | null;
  requestNote: string | null;
  photoUrls: string[];
  state: QuoteTargetState;
  canEdit: boolean;
  quote: Quote | null;
  declineReason: QuoteDeclineReason | null;
  showEntryGuide: boolean;
  threadId: string | null;
  chatOpen: boolean;
  chatOpenUntil: string | null;
}

export interface QuoteInputBody {
  unitPrice: number;
  priceMayVary?: boolean;
  similarity: QuoteSimilarity;
  memo?: string;
  photoUrls?: string[];
}
