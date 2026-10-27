import { PaginationMeta } from "@/apps/web-user/common/types/api.type";
import type { OrderResponse } from "@/apps/web-user/features/order/types/order.type";

/**
 * 후기 정렬 옵션
 */
export enum ReviewSortBy {
  LATEST = "latest", // 최신순
  RATING_DESC = "rating_desc", // 별점 높은 순
  RATING_ASC = "rating_asc", // 별점 낮은 순
}

/**
 * 후기 정보
 */
export interface Review {
  id: string;
  productId: string;
  storeId: string;
  storeName: string;
  userId: string;
  rating: number;
  content: string;
  imageUrls: string[];
  userNickname: string | null;
  userProfileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 내 후기 정보 (상품 정보 포함)
 */
export interface MyReview extends Review {
  orderId: string | null;
  order: OrderResponse | null;
  productName: string;
  productPrice: number;
  productImageUrl: string | null;
}

/**
 * 후기 목록 응답
 */
export interface ReviewListResponse {
  data: Review[];
  meta: PaginationMeta;
}

/**
 * 내 후기 목록 응답
 */
export interface MyReviewListResponse {
  data: MyReview[];
  meta: PaginationMeta;
}

/**
 * 상품 후기 목록 조회 요청 파라미터
 */
export interface GetProductReviewsParams {
  productId: string;
  page?: number;
  limit?: number;
  sortBy?: ReviewSortBy;
}

/**
 * 스토어 후기 목록 조회 요청 파라미터
 */
export interface GetStoreReviewsParams {
  storeId: string;
  page?: number;
  limit?: number;
  sortBy?: ReviewSortBy;
}

/**
 * 작성 가능한 후기 주문 응답
 */
export interface WritableReviewOrder {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImages: string[];
  storeId: string;
  storeName: string;
  orderNumber: string;
  totalQuantity: number;
  totalPrice: number;
  pickupDate: string;
  pickupAddress: string;
  pickupRoadAddress: string;
  pickupDetailAddress?: string;
  pickupZonecode: string;
  pickupLatitude: number;
  pickupLongitude: number;
  createdAt: string;
  updatedAt: string;
  orderItems: WritableReviewOrderItem[];
  myReviewUiStatus: string;
  linkedProductReviewId: string | null;
}

export interface WritableReviewOrderItem {
  id: string;
  sizeId?: string;
  sizeDisplayName?: string;
  sizeLengthCm?: number;
  sizeDescription?: string;
  sizePrice?: number;
  flavorId?: string;
  flavorDisplayName?: string;
  flavorPrice?: number;
  /** 추가 옵션 선택 내역 (주문 시점 스냅샷) */
  selectedOptions: import("@/apps/web-user/features/order/types/order.type").SelectedOption[];
  optionsPrice: number;
  requestMessage?: string;
  quantity: number;
  itemPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface WritableReviewListResponse {
  data: WritableReviewOrder[];
  meta: PaginationMeta;
}

/**
 * 후기 작성 요청
 */
export interface CreateReviewRequest {
  orderId: string;
  rating: number;
  content: string;
  imageUrls: string[];
}

/**
 * @deprecated Use GetProductReviewsParams instead
 */
export interface GetReviewsParams {
  productId: string;
  page: number;
  limit: number;
  sortBy: ReviewSortBy;
}
