/**
 * 페이지네이션 메타 정보
 */
export interface PaginationMeta {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 마이페이지 주문 목록 응답
 */
export interface MyOrdersResponse {
  data: OrderResponse[];
  meta: PaginationMeta;
}

/**
 * 주문 항목의 추가 옵션 선택값 (옵션 ID 기준, 이름·가격은 서버가 계산)
 */
export interface OrderItemOptionInput {
  optionId: string;
  choiceIds?: string[];
  text?: string;
  imageUrls?: string[];
}

/**
 * 주문 항목의 추가 옵션 스냅샷 (주문 시점 옵션명·옵션값·금액)
 */
export interface SelectedOption {
  optionId: string;
  type: import("@/apps/web-user/features/product/types/product.type").CustomOptionType;
  name: string;
  choices?: { id: string; label: string; price: number }[];
  text?: string;
  imageUrls?: string[];
  /** 이 옵션 금액 합계 (1개 기준) */
  price: number;
}

/**
 * 주문 항목 생성 요청
 */
export interface CreateOrderItemRequest {
  sizeId?: string;
  sizeDisplayName?: string;
  sizeLengthCm?: number;
  sizeDescription?: string;
  sizePrice?: number;
  flavorId?: string;
  flavorDisplayName?: string;
  flavorPrice?: number;
  options: OrderItemOptionInput[];
  requestMessage?: string;
  quantity: number;
}

/**
 * 예약신청 단계 주문 항목 1개 옵션 변경 요청
 */
export interface UpdateReservationOrderItemRequest extends CreateOrderItemRequest {
  /** 변경 후 주문 총 금액 (다른 항목 기존 금액 + 이 항목 새 금액) */
  totalPrice: number;
  productOptionsVersion: number;
}

/**
 * 주문 생성 요청 (주문 시점의 정보 전달)
 */
export interface CreateOrderRequest {
  pickupDate: string; // ISO 8601 형식
  productId: string;
  productName: string;
  productImages: string[];
  items: CreateOrderItemRequest[];
  totalQuantity: number;
  totalPrice: number;
  /** 옵션을 고를 때 본 상품 optionsVersion (다르면 서버가 409) */
  productOptionsVersion: number;
  storeName: string;
  /** 예약자명 (선택) */
  reservationContactName?: string;
  /** 예약 연락처 휴대폰 (선택) */
  reservationPhone?: string;
  // 픽업장소
  pickupAddress: string;
  pickupRoadAddress: string;
  pickupDetailAddress?: string;
  pickupZonecode: string;
  pickupLatitude: number;
  pickupLongitude: number;
}

/**
 * 주문 상태 enum
 */
export enum OrderStatus {
  RESERVATION_REQUESTED = "RESERVATION_REQUESTED", // 예약신청
  PAYMENT_PENDING = "PAYMENT_PENDING", // 입금대기
  PAYMENT_COMPLETED = "PAYMENT_COMPLETED", // 입금완료
  CONFIRMED = "CONFIRMED", // 예약확정
  PICKUP_PENDING = "PICKUP_PENDING", // 픽업대기
  PICKUP_COMPLETED = "PICKUP_COMPLETED", // 픽업완료
  CANCEL_COMPLETED = "CANCEL_COMPLETED", // 취소완료
  CANCEL_REFUND_PENDING = "CANCEL_REFUND_PENDING", // 취소/환불 대기
  CANCEL_REFUND_COMPLETED = "CANCEL_REFUND_COMPLETED", // 취소/환불 완료
  SELLER_CANCELLED = "SELLER_CANCELLED", // 판매자 예약취소
  BUYER_CANCELLED = "BUYER_CANCELLED", // 구매자 예약취소
  NO_SHOW = "NO_SHOW", // 노쇼
}

/**
 * 주문 응답
 * 백엔드 OrderItemResponseDto와 일치
 */
export interface OrderItemResponse {
  id: string;
  pickupDate: string; // JSON 직렬화 시 ISO 8601 문자열로 변환됨 (백엔드는 Date 타입)
  sizeId?: string;
  sizeDisplayName?: string;
  sizeLengthCm?: number;
  sizeDescription?: string;
  sizePrice?: number;
  flavorId?: string;
  flavorDisplayName?: string;
  flavorPrice?: number;
  /** 추가 옵션 선택 내역 (판매자가 정한 옵션 순서) */
  selectedOptions: SelectedOption[];
  optionsPrice: number;
  requestMessage?: string;
  quantity: number;
  itemPrice: number;
  createdAt: string; // JSON 직렬화 시 ISO 8601 문자열로 변환됨 (백엔드는 Date 타입)
  updatedAt: string; // JSON 직렬화 시 ISO 8601 문자열로 변환됨 (백엔드는 Date 타입)
}

/**
 * 주문 응답
 */
export interface OrderResponse {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImages: string[];
  storeId: string;
  storeName: string;
  storePhoneNumber?: string | null;
  storeKakaoChannelId?: string | null;
  storeInstagramId?: string | null;
  orderNumber: string;
  totalQuantity: number;
  totalPrice: number;
  // 픽업장소
  pickupAddress: string;
  pickupRoadAddress: string;
  pickupDate: string; // ISO 8601 형식
  pickupDetailAddress?: string;
  pickupZonecode: string;
  pickupLatitude: number;
  pickupLongitude: number;
  paymentPendingAt?: string;
  /** 입금 마감 시각(ISO). 입금대기에서만 의미 있음 */
  paymentPendingDeadlineAt?: string | null;
  orderStatus: OrderStatus;
  /** 주문 시 선택 입력한 예약자명 */
  reservationContactName?: string | null;
  /** 주문 시 선택 입력한 예약 연락처(휴대폰) */
  reservationPhone?: string | null;
  // 스토어 정산 계좌 (입금대기 시 표시)
  storeBankName?: string | null;
  storeBankAccountNumber?: string | null;
  storeAccountHolderName?: string | null;
  sellerCancelReason?: string | null;
  userCancelReason?: string | null;
  sellerNoShowReason?: string | null;
  refundRequestReason?: string | null;
  sellerCancelRefundPendingReason?: string | null;
  refundBankName?: string | null;
  refundBankAccountNumber?: string | null;
  refundAccountHolderName?: string | null;
  /** 스토어가 설정한 환불·취소 규정 (주문 시점의 스냅샷) */
  storeRefundCancellationPolicy?: import("@/apps/web-user/features/store/types/store.type").RefundCancellationPolicy;
  // 후기 UI 상태
  myReviewUiStatus: OrderMyReviewUiStatus;
  linkedProductReviewId?: string | null;
  createdAt: string; // JSON 직렬화 시 ISO 8601 문자열로 변환됨
  updatedAt: string; // JSON 직렬화 시 ISO 8601 문자열로 변환됨
  orderItems: OrderItemResponse[];
}

/**
 * 후기 UI 상태
 * - NOT_AVAILABLE: 후기 작성 대상 아님 (픽업 전, 취소 등)
 * - WRITABLE: 후기 작성 가능 (픽업 완료 + 미작성)
 * - WRITTEN: 후기 작성 완료
 * - WITHDRAWN: 후기 삭제로 재작성 불가
 */
export enum OrderMyReviewUiStatus {
  NOT_AVAILABLE = "NOT_AVAILABLE",
  WRITABLE = "WRITABLE",
  WRITTEN = "WRITTEN",
  WITHDRAWN = "WITHDRAWN",
}
