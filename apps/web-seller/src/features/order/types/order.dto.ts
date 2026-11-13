/**
 * 주문 API 타입 (백엔드 order DTO와 1:1 정합)
 * - 단일: OrderResponseDto, OrderItemResponseDto
 * - 목록: OrderListRequestDto, OrderListResponseDto
 * - 변경: UpdateOrderStatusRequestDto, UpdateOrderStatusResponseDto
 */

import type { ListResponseDto } from "@/apps/web-seller/common/types/api.dto";

export enum OrderStatus {
  RESERVATION_REQUESTED = "RESERVATION_REQUESTED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
  CONFIRMED = "CONFIRMED",
  PICKUP_PENDING = "PICKUP_PENDING",
  PICKUP_COMPLETED = "PICKUP_COMPLETED",
  CANCEL_COMPLETED = "CANCEL_COMPLETED",
  CANCEL_REFUND_PENDING = "CANCEL_REFUND_PENDING",
  CANCEL_REFUND_COMPLETED = "CANCEL_REFUND_COMPLETED",
  NO_SHOW = "NO_SHOW",
}

export enum OrderSortBy {
  LATEST = "LATEST",
  OLDEST = "OLDEST",
  PRICE_DESC = "PRICE_DESC",
  PRICE_ASC = "PRICE_ASC",
  /** 픽업 가까운 순(픽업 일시 오름차순). 휴대폰 화면 처리할 것·진행 중 */
  PICKUP_ASC = "PICKUP_ASC",
  /** 픽업 최근 순(픽업 일시 내림차순). 휴대폰 화면 지난 주문 */
  PICKUP_DESC = "PICKUP_DESC",
}

export enum OrderType {
  UPCOMING = "UPCOMING",
  PAST = "PAST",
  /** 끝난 주문(픽업완료·노쇼·취소완료·취소환불완료만). 휴대폰 화면 지난 주문 탭 */
  FINISHED = "FINISHED",
}

/** 추가 옵션 형식 (상품 CustomOptionType과 동일) */
export type SelectedOptionType = "SINGLE_SELECT" | "MULTI_SELECT" | "TEXT" | "IMAGE";

/** 주문 항목의 추가 옵션 스냅샷 (주문 시점 옵션명·옵션값·금액) */
export interface SelectedOptionResponseDto {
  optionId: string;
  type: SelectedOptionType;
  name: string;
  choices?: { id: string; label: string; price: number }[];
  text?: string;
  imageUrls?: string[];
  /** 이 옵션의 금액 합계 (1개 기준) */
  price: number;
}

export interface OrderItemResponseDto {
  id: string;
  sizeId?: string;
  sizeDisplayName?: string;
  sizeLengthCm?: number;
  sizeDescription?: string;
  sizePrice?: number;
  /** 추가 옵션 선택 내역 (판매자가 정한 옵션 순서) */
  selectedOptions: SelectedOptionResponseDto[];
  optionsPrice: number;
  /** @deprecated selectedOptions 사용 (정리 단계에서 삭제) */
  letteringMessage?: string;
  requestMessage?: string;
  quantity: number;
  itemPrice: number;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** 견적으로 만든 예약(기획 I-01)의 견적·요청서. 상품 예약은 null */
export interface OrderQuoteInfo {
  quoteRequestId: string;
  /** 사진과 얼마나 비슷하게(거의 똑같이·비슷하게·느낌만 살려서) */
  similarityLabel: string;
  /** 사장님 견적 메모·사진 */
  memo: string | null;
  quotePhotoUrls: string[];
  /** 손님 요청서 글·사진(픽업 24시간 뒤에는 서버가 가림) */
  description: string | null;
  requestNote: string | null;
  requestPhotoUrls: string[];
  contentHidden: boolean;
}

export interface OrderResponseDto {
  id: string;
  userId: string;
  /** 견적으로 만든 예약이면 null(옛 서버는 늘 있음) */
  productId: string | null;
  quote?: OrderQuoteInfo | null;
  productName: string;
  productImages: string[];
  storeId: string;
  storeName: string;
  storePhoneNumber?: string | null;
  storeKakaoChannelId?: string | null;
  storeInstagramId?: string | null;
  storeBankName?: string | null;
  storeBankAccountNumber?: string | null;
  storeAccountHolderName?: string | null;
  orderNumber: string;
  totalQuantity: number;
  totalPrice: number;
  pickupAddress: string;
  pickupRoadAddress: string;
  pickupDetailAddress?: string;
  pickupZonecode: string;
  pickupLatitude: number;
  pickupLongitude: number;
  orderStatus: OrderStatus;
  /** 입금대기 진입 시각. 예약신청 단계에서는 null */
  paymentPendingAt?: Date | string | null;
  /** 입금 마감 시각(픽업 일정 반영). 입금대기가 아니면 null */
  paymentPendingDeadlineAt?: Date | string | null;
  /** 사용자가 입금완료 처리 시 입력한 입금자명 */
  depositorName?: string | null;
  /** 입금 기한 만료로 자동 취소된 시각. 값이 있으면 고객·판매자가 의도한 취소가 아님 */
  paymentPendingExpiredAt?: Date | string | null;
  /** 주문 시 선택 입력한 예약자명 */
  reservationContactName?: string | null;
  /** 주문 시 선택 입력한 예약 연락처(휴대폰) */
  reservationPhone?: string | null;
  pickupDate: Date;
  userCancelReason?: string | null;
  sellerCancelReason?: string | null;
  sellerNoShowReason?: string | null;
  refundRequestReason?: string | null;
  sellerCancelRefundPendingReason?: string | null;
  refundBankName?: string | null;
  refundBankAccountNumber?: string | null;
  refundAccountHolderName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItemResponseDto[];
}

/** 주문 목록 조회 요청 (백엔드 OrderListRequestDto) */
export interface OrderListRequestDto {
  page: number;
  limit: number;
  sortBy: OrderSortBy;
  storeId?: string;
  orderStatus?: OrderStatus;
  startDate?: string;
  endDate?: string;
  orderNumber?: string;
  /** 상품명 부분 일치 검색 */
  productName?: string;
  /** 검색어 하나로 주문번호·상품명·예약자 이름·연락처(숫자 4자리 이상) 찾기 */
  keyword?: string;
  type?: OrderType;
  /** YYYY-MM-DD, Asia/Seoul 달력 (백엔드 pickupStartDate) */
  pickupStartDate?: string;
  /** YYYY-MM-DD, Asia/Seoul 달력 (백엔드 pickupEndDate) */
  pickupEndDate?: string;
}

/** 주문 목록 조회 응답 */
export type OrderListResponseDto = ListResponseDto<OrderResponseDto>;

export interface UpdateOrderStatusRequestDto {
  orderStatus: OrderStatus;
  sellerCancelReason?: string;
  sellerNoShowReason?: string;
  sellerCancelRefundPendingReason?: string;
}

export interface UpdateOrderStatusResponseDto {
  id: string;
}
