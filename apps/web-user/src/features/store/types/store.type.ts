import type { ProductCategoryType } from "@/apps/web-user/features/product/types/product.type";

/** 환불·취소 규정 한 줄 */
export interface RefundRuleItem {
  /** 픽업 N일 전 (0=픽업 당일) */
  daysBeforePickup: number;
  /** 해당 시점의 환불·취소 조건 */
  refundDescription: string;
}

/** 환불·취소 규정 (Store, Product 상세, Order 상세 응답에 포함) */
export interface RefundCancellationPolicy {
  rules: RefundRuleItem[];
}

/**
 * 화면에 보일 환불·취소 규정 줄. 내용을 적지 않은 줄은 뺀다
 * (새 가게 기본값이 "픽업 당일 · 빈칸" 한 줄이라 그대로 그리면 빈 줄이 보인다)
 */
export function visibleRefundRules(policy?: RefundCancellationPolicy | null): RefundRuleItem[] {
  return (policy?.rules ?? []).filter((rule) => (rule.refundDescription ?? "").trim() !== "");
}

/** "픽업 당일" / "픽업 N일 전" 라벨 */
export function formatRefundRulePeriodLabel(daysBeforePickup: number): string {
  return daysBeforePickup === 0 ? "픽업 당일" : `픽업 ${daysBeforePickup}일 전`;
}

/** 영업 캘린더 (백엔드 StoreBusinessCalendarDto와 동일) */
export interface StoreBusinessDayOverride {
  date: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface StoreBusinessCalendar {
  weeklyClosedWeekdays: number[];
  standardOpenTime: string;
  standardCloseTime: string;
  dayOverrides: StoreBusinessDayOverride[];
}

export interface StoreListResponse {
  data: StoreInfo[];
  meta: {
    currentPage: number;
    hasNext: boolean;
    totalCount: number;
  };
}

/** 스토어 목록 필터 */
export interface StoreListFilter {
  /** 케이크 사이즈 표시명: 도시락, 미니, 1호, 2호, 3호 */
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  productCategoryTypes?: ProductCategoryType[];
}

/** 스토어 목록 픽업 일·구간 필터(백엔드 GetStoresRequestDto와 동일) */
export type StoreListPickupFilterPeriod = "morning" | "afternoon" | "fullday";

/** 스토어 목록 조회 API 요청 파라미터 */
export interface StoreListParams extends StoreListFilter {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  /** YYYY-MM-DD, period와 함께 전달 */
  pickupFilterDate?: string;
  pickupFilterPeriod?: StoreListPickupFilterPeriod;
}

export interface StoreProductRepresentativeImage {
  productId: string;
  imageUrl: string;
}

export interface StoreInfo {
  id: string;
  userId: string;
  logoImageUrl?: string;
  name: string;
  description?: string;
  phoneNumber?: string;
  /** 카카오톡 채널 ID(예: "_xeaCon"). 비어 있으면 "" */
  kakaoChannelId?: string | null;
  /** 인스타그램 ID(@ 없이). 비어 있으면 "" */
  instagramId?: string | null;
  isLiked: boolean | null;
  // 사업자 정보
  businessNo: string;
  representativeName: string;
  openingDate: string;
  businessName: string;
  businessSector: string;
  businessType: string;
  // 통신판매사업자 정보
  permissionManagementNumber: string | null;
  // 주소/위치 정보
  address: string;
  roadAddress: string;
  detailAddress: string;
  zonecode: string;
  latitude: number;
  longitude: number;
  // 시스템 필드
  likeCount: number;
  // 후기 통계
  averageRating: number; // 해당 스토어의 모든 상품 후기들의 평균 별점
  totalReviewCount: number; // 해당 스토어의 모든 상품 후기 개수
  // 상품 대표이미지 (상품당 1장)
  productRepresentativeImages: StoreProductRepresentativeImage[];
  // 상품 중 최소 금액 (노출·판매중인 상품만, 없으면 null)
  minProductPrice: number | null;
  /** 영업 캘린더 (스토어 목록·상세 API) */
  businessCalendar?: StoreBusinessCalendar;
  /** 환불·취소 규정(상세 API, 견적 예약 창에서 씀) */
  refundCancellationPolicy?: RefundCancellationPolicy;
  createdAt: Date;
  updatedAt: Date;
}
