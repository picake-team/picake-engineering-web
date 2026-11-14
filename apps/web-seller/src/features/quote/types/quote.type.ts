/** 견적(기획 I-46 ②) — 서버 modules/quote-request/dto/quote.dto.ts와 같은 모양 */
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
  unitPrice: number;
  quantity: number;
  total: number;
  priceMayVary: boolean;
  similarity: QuoteSimilarity;
  similarityLabel: string;
  memo: string | null;
  photoUrls: string[];
  edited: boolean;
}

export interface QuoteRequestForShop {
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
  /** photoUrls와 같은 순서: 디자인 모음 사진인지·가져올 것(기획 I-112, 옛 서버는 없음) */
  photoDetails?: QuotePhotoDetail[];
  /** 끝난 요청이라 손님이 쓴 내용·사진을 서버가 보내지 않음(옛 서버는 없음) */
  contentHidden?: boolean;
  /** 손님 이름·휴대폰(보낼 때 "받는 가게에 전달돼요" 안내를 본 요청에만, 손님 글과 같은 기간. 옛 서버는 없음) */
  customer?: { name: string; phone: string } | null;
  /** 손님이 이 견적으로 만든 살아 있는 예약(주문) ID(기획 I-01, 옛 서버는 없음) */
  orderId?: string | null;
  state: QuoteTargetState;
  canEdit: boolean;
  quote: Quote | null;
  declineReason: QuoteDeclineReason | null;
}

export interface QuoteInputBody {
  unitPrice: number;
  priceMayVary?: boolean;
  similarity: QuoteSimilarity;
  memo?: string;
  photoUrls?: string[];
}

/** 사진에서 가져올 것(기획 I-112, 손님이 요청서에서 고름) */
export type QuotePhotoPart = "ALL" | "SHAPE" | "COLOR" | "DECORATION" | "LETTERING";
export interface QuotePhotoDetail {
  designId: string | null;
  parts: QuotePhotoPart[];
}
