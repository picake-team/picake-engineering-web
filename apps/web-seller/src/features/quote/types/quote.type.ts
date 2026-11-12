/** 견적(기획 I-46 ②) — 서버 modules/quote-request/dto/quote.dto.ts와 같은 모양 */
export type QuoteSimilarity = "EXACT" | "SIMILAR" | "INSPIRED";
export type QuoteContactType = "KAKAO" | "INSTAGRAM" | "PHONE" | "NAVER";
export type QuoteDeclineReason = "FULLY_BOOKED" | "NOT_OUR_STYLE" | "BUDGET" | "OTHER";
export type QuoteTargetState =
  | "OPEN"
  | "SENT"
  | "DECLINED"
  | "CHOSEN_ME"
  | "CHOSEN_OTHER"
  | "CLOSED"
  | "FULL";

export interface QuoteContact {
  type: QuoteContactType;
  label: string;
  value: string;
  href: string;
}

export interface Quote {
  id: string;
  unitPrice: number;
  quantity: number;
  total: number;
  priceMayVary: boolean;
  similarity: QuoteSimilarity;
  similarityLabel: string;
  contacts: QuoteContact[];
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
  state: QuoteTargetState;
  canEdit: boolean;
  quote: Quote | null;
  declineReason: QuoteDeclineReason | null;
  prefillContacts: QuoteContact[];
}

export interface QuoteInputBody {
  unitPrice: number;
  priceMayVary?: boolean;
  similarity: QuoteSimilarity;
  contacts: { type: QuoteContactType; value: string }[];
  memo?: string;
  photoUrls?: string[];
}
