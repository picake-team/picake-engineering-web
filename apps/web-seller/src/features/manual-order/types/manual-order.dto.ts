/**
 * 직접 적은 주문(기획 I-42): 사장님이 Picake 밖(카톡·인스타·전화 등)에서 받아 적은 주문.
 * 서버 `/v1/seller/stores/:storeId/manual-orders`. Picake 주문과 같은 달력·목록에 보이지만 다른 표라
 * 알림톡·수수료·정산·관리자 숫자와 섞이지 않는다.
 */

export type ManualOrderSource = "KAKAO" | "INSTAGRAM" | "PHONE" | "NAVER" | "OTHER";

export interface ManualOrderDto {
  id: string;
  storeId: string;
  /** 픽업 날 YYYY-MM-DD(Asia/Seoul) */
  pickupDate: string;
  /** HH:mm, 모르면 null("미정") */
  pickupTime: string | null;
  cakeName: string;
  lettering: string | null;
  price: number | null;
  /** true 받음, false 아직, null 고르지 않음 */
  paid: boolean | null;
  customerName: string | null;
  source: ManualOrderSource;
  memo: string | null;
  photoUrls: string[];
  /** 운영자가 가게 대신 적은 주문(기획 I-41). 옛 서버 응답에는 없다 */
  enteredByOperator?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManualOrderInput {
  pickupDate: string;
  pickupTime: string | null;
  cakeName: string;
  lettering: string | null;
  price: number | null;
  paid: boolean | null;
  customerName: string | null;
  source: ManualOrderSource;
  memo: string | null;
  photoUrls: string[];
}

/** 대화 붙여 넣어 채우기 결과. 읽지 못한 칸은 null */
export interface ManualOrderReadResult {
  found: boolean;
  pickupDate: string | null;
  pickupTime: string | null;
  cakeName: string | null;
  lettering: string | null;
  price: number | null;
  paid: boolean | null;
  customerName: string | null;
  source: ManualOrderSource | null;
  memo: string | null;
}

/** 다른 캘린더로 내보내기 */
export interface CalendarFeedDto {
  /** API 주소 뒤에 붙이는 경로(/v1/seller/calendar-feeds/{비밀 값}.ics) */
  path: string;
  showCustomerName: boolean;
}
