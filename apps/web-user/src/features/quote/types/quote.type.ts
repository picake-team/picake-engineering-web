/** 견적 요청(기획 I-46) — backend `/v1/consumer/quote-requests` 응답·요청 모양 */

export type QuoteCakeSize = "LUNCHBOX" | "MINI" | "NO1" | "NO2" | "NO3" | "LARGER";
export type QuoteCream = "FRESH_CREAM" | "BUTTER_CREAM" | "CREAM_CHEESE";
export type QuoteRequestEntry = "HOME" | "SEARCH" | "MAP" | "STORE" | "MYPAGE";
export type QuoteRequestStatus = "OPEN" | "CONNECTED" | "CLOSED";
export type QuoteRequestCloseReason = "EXPIRED" | "CONSUMER";
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
  agreed: boolean;
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
