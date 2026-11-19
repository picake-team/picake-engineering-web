import { PaginationMeta } from "@/apps/web-user/common/types/api.type";

/**
 * 정렬 enum
 */
export enum SortBy {
  LATEST = "latest", // 최신순(생성일 내림차순)
  PRICE_ASC = "price_asc", // 가격 오름차순
  PRICE_DESC = "price_desc", // 가격 내림차순
  POPULAR = "popular", // 인기순(좋아요 수 내림차순)
  REVIEW_COUNT = "review_count", // 후기 많은 순(후기 수 내림차순)
  RATING_AVG = "rating_avg", // 별점 높은 순(평균 별점 내림차순)
  DISTANCE = "distance", // 거리순(스토어 픽업 좌표 기준, latitude·longitude 필요)
}

export enum SalesStatus {
  ENABLE = "ENABLE",
  DISABLE = "DISABLE",
}

export enum VisibilityStatus {
  ENABLE = "ENABLE",
  DISABLE = "DISABLE",
}

export enum ProductType {
  BASIC_CAKE = "BASIC_CAKE", // 기본 케이크
  CUSTOM_CAKE = "CUSTOM_CAKE", // 커스텀 케이크
}

/**
 * 주문 받는 방법(기획 I-01 2026-11-19). 커스텀 케이크만 사장님이 견적 받기를 고를 수 있다.
 * 견적 받기 상품은 예약신청 대신 "이 디자인으로 견적 받기"(이 가게에만)
 */
export type ProductOrderMethod = "RESERVATION" | "QUOTE";

/** 상품 카테고리 타입 (복수 선택 가능) */
/**
 * 상품 카테고리(2026-11-15 다시 나눔, 서버와 같은 값). 묶음과 이름은 constants/product-category.constant.ts
 */
export enum ProductCategoryType {
  // 상황
  BIRTHDAY = "BIRTHDAY", // 생일
  COUPLE = "COUPLE", // 연인·기념일
  THANKS = "THANKS", // 부모님·감사
  BABY = "BABY", // 백일·돌
  CONGRATS = "CONGRATS", // 축하
  WEDDING = "WEDDING", // 결혼·프로포즈
  SEASON = "SEASON", // 시즌(크리스마스 등)
  // 디자인
  LETTERING = "LETTERING", // 레터링
  DRAWING = "DRAWING", // 드로잉
  PHOTO = "PHOTO", // 사진
  CHARACTER = "CHARACTER", // 캐릭터
  FLOWER = "FLOWER", // 꽃
  RIBBON = "RIBBON", // 리본
  FRUIT = "FRUIT", // 과일
  HEART = "HEART", // 하트
  TWO_TIER = "TWO_TIER", // 2단
  SIMPLE = "SIMPLE", // 심플
  // 서비스
  SAME_DAY_PICKUP = "SAME_DAY_PICKUP", // 당일픽업
}

export enum VisibleStatus {
  ENABLE = "ENABLE",
  DISABLE = "DISABLE",
}

export interface CakeSizeOption {
  id: string;
  visible: VisibleStatus;
  description: string;
  displayName: string;
  price: number;
  lengthCm: number;
}

/** 추가 옵션 형식 */
export enum CustomOptionType {
  SINGLE_SELECT = "SINGLE_SELECT", // 선택형 (1개)
  MULTI_SELECT = "MULTI_SELECT", // 다중선택형 (체크박스)
  TEXT = "TEXT", // 직접입력형
  IMAGE = "IMAGE", // 사진첨부형
}

export interface CustomOptionChoice {
  id: string;
  label: string;
  price: number;
  visible: VisibleStatus;
}

/** 추가 옵션 (상세 응답은 노출 중인 옵션·옵션값만, 목록 응답은 빈 배열) */
export interface CustomOption {
  id: string;
  type: CustomOptionType;
  name: string;
  required: boolean;
  visible: VisibleStatus;
  choices?: CustomOptionChoice[];
  maxSelect?: number;
  maxLength?: number;
  placeholder?: string;
  maxCount?: number;
}

/**
 * 상품 정보
 */
export interface Product {
  id: string;
  storeId: string;
  name: string;
  images: string[];
  originalPrice: number;
  salePrice: number;
  likeCount: number;
  isLiked: boolean | null;
  averageRating: number; // 해당 상품의 모든 후기들의 평균 별점
  totalReviewCount: number; // 해당 상품의 모든 후기 개수
  salesStatus: SalesStatus;
  visibilityStatus: VisibilityStatus;
  cakeSizeOptions: CakeSizeOption[];
  customOptions: CustomOption[];
  /** 주문 시 productOptionsVersion으로 그대로 전달 (옵션이 바뀌었으면 서버가 409) */
  optionsVersion: number;
  productType: ProductType;
  /** 주문 받는 방법. 옛 서버 응답에는 없다(없으면 예약 받기) */
  orderMethod?: ProductOrderMethod;
  /** 보이는 크기·옵션에 추가금이 있는지. 없으면 가격 뒤 물결을 뺀다(옛 응답에는 없음 → 물결 그대로) */
  hasExtraPrice?: boolean;
  productCategoryTypes: ProductCategoryType[]; // 카테고리 (없거나 여러 개)
  searchTags: string[]; // 검색 태그 (없거나 여러 개)
  detailDescription?: string;
  productNoticeFoodType: string;
  productNoticeProducer: string;
  productNoticeOrigin: string;
  productNoticeAddress: string;
  productNoticeManufactureDate: string;
  productNoticeExpirationDate: string;
  productNoticePackageCapacity: string;
  productNoticePackageQuantity: string;
  productNoticeIngredients: string;
  productNoticeCalories: string;
  productNoticeSafetyNotice: string;
  productNoticeGmoNotice: string;
  productNoticeImportNotice: string;
  productNoticeCustomerService: string;
  productNumber: string;
  createdAt: Date;
  updatedAt: Date;
  // 스토어 정보
  storeName: string;
  storeLogoImageUrl?: string | null;
  // 픽업장소
  pickupAddress: string;
  pickupRoadAddress: string;
  pickupDetailAddress?: string;
  pickupZonecode: string;
  pickupLatitude: number;
  pickupLongitude: number;
  /** 스토어가 설정한 환불·취소 규정 (Product 상세에 포함됨) */
  storeRefundCancellationPolicy?: import("@/apps/web-user/features/store/types/store.type").RefundCancellationPolicy;
}

/**
 * 상품 목록 응답
 */
export interface ProductListResponse {
  data: Product[];
  meta: PaginationMeta;
}

/**
 * 상품 목록 조회 쿼리 키용 파라미터 (page 제외)
 */
export interface ProductListQueryParams {
  limit: number;
  sortBy: SortBy;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  storeId?: string;
  productType?: ProductType;
  /** 홈 "바로 예약할 수 있는 케이크"는 RESERVATION만 */
  orderMethod?: ProductOrderMethod;
  productCategoryTypes?: ProductCategoryType[];
  regions?: string;
  /** 케이크 사이즈 표시명(도시락·미니·1호…), 스토어 목록과 같은 값 */
  sizes?: string[];
  /** 거리순(sortBy=distance)일 때만: 기준점 위도·경도 */
  latitude?: number;
  longitude?: number;
}

/**
 * 상품 목록 조회 요청 파라미터
 */
export interface GetProductsParams extends ProductListQueryParams {
  page: number;
}
