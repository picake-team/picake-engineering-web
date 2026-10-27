/**
 * 상품 API 타입 (백엔드 product DTO와 1:1 정합)
 * - 단일: ProductResponseDto
 * - 목록: GetSellerProductsRequestDto, ProductListResponseDto
 * - CRUD: CreateProductRequestDto, CreateProductResponseDto, UpdateProductRequestDto
 */

import type { ListResponseDto } from "@/apps/web-seller/common/types/api.dto";

export enum EnableStatus {
  ENABLE = "ENABLE",
  DISABLE = "DISABLE",
}

export enum ProductType {
  BASIC_CAKE = "BASIC_CAKE",
  CUSTOM_CAKE = "CUSTOM_CAKE",
}

export enum ProductCategoryType {
  BIRTHDAY = "BIRTHDAY",
  LOVER = "LOVER",
  FRIEND = "FRIEND",
  FAMILY = "FAMILY",
  ANNIVERSARY = "ANNIVERSARY",
  SAME_DAY_PICKUP = "SAME_DAY_PICKUP",
  LETTERING = "LETTERING",
  CHARACTER = "CHARACTER",
  SIMPLE = "SIMPLE",
  FLOWER = "FLOWER",
  PHOTO = "PHOTO",
}

export enum CakeSizeDisplayName {
  DOSIRAK = "도시락",
  MINI = "미니",
  SIZE_1 = "1호",
  SIZE_2 = "2호",
  SIZE_3 = "3호",
}

export enum SortBy {
  LATEST = "latest",
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  POPULAR = "popular",
  REVIEW_COUNT = "review_count",
  RATING_AVG = "rating_avg",
  DISTANCE = "distance",
}

/** 케이크 사이즈 옵션 (생성/수정 요청·응답 공용, id는 응답에서 필수) */
export interface CakeSizeOptionDto {
  id?: string;
  visible: EnableStatus;
  displayName: CakeSizeDisplayName;
  lengthCm: number;
  price: number;
  description?: string;
}

/** 케이크 맛 옵션 (생성/수정 요청·응답 공용) */
export interface CakeFlavorOptionDto {
  id?: string;
  visible: EnableStatus;
  displayName: string;
  price: number;
}

/** 추가 옵션 형식 (선택형·다중선택형·직접입력형·사진첨부형) */
export enum CustomOptionType {
  SINGLE_SELECT = "SINGLE_SELECT",
  MULTI_SELECT = "MULTI_SELECT",
  TEXT = "TEXT",
  IMAGE = "IMAGE",
}

/** 추가 옵션의 옵션값 (선택형·다중선택형) */
export interface CustomOptionChoiceDto {
  id?: string;
  label: string;
  price: number;
  visible: EnableStatus;
}

/** 추가 옵션 (생성/수정 요청·응답 공용, id는 응답에서 필수) */
export interface CustomOptionDto {
  id?: string;
  type: CustomOptionType;
  name: string;
  required: boolean;
  visible: EnableStatus;
  choices?: CustomOptionChoiceDto[];
  /** 다중선택형 최대 선택 개수 (없으면 제한 없음) */
  maxSelect?: number;
  /** 직접입력형 최대 글자 수 */
  maxLength?: number;
  /** 직접입력형 입력 안내 문구 */
  placeholder?: string;
  /** 사진첨부형 최대 사진 수 */
  maxCount?: number;
}

export interface CreateProductRequestDto {
  storeId: string;
  name: string;
  images: string[];
  originalPrice: number;
  salePrice: number;
  salesStatus: EnableStatus;
  visibilityStatus: EnableStatus;
  cakeSizeOptions: CakeSizeOptionDto[];
  cakeFlavorOptions: CakeFlavorOptionDto[];
  customOptions?: CustomOptionDto[];
  productType: ProductType;
  productCategoryTypes?: ProductCategoryType[];
  searchTags?: string[];
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
}

export interface CreateProductResponseDto {
  id: string;
}

/** 상품 단일 응답 (목록·상세 동일, 백엔드 ProductResponseDto) */
export interface ProductResponseDto {
  id: string;
  storeId: string;
  name: string;
  images: string[];
  originalPrice: number;
  salePrice: number;
  salesStatus: EnableStatus;
  visibilityStatus: EnableStatus;
  cakeSizeOptions?: CakeSizeOptionDto[] | null;
  cakeFlavorOptions?: CakeFlavorOptionDto[] | null;
  /** 추가 옵션 (판매자 상세 응답은 숨김 포함 전체, 목록 응답은 빈 배열) */
  customOptions: CustomOptionDto[];
  optionsVersion: number;
  productType: ProductType;
  productCategoryTypes: ProductCategoryType[];
  searchTags: string[];
  detailDescription?: string | null;
  productNumber: string;
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
  likeCount: number;
  isLiked?: boolean | null;
  averageRating: number;
  totalReviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  storeName: string;
  storeLogoImageUrl?: string | null;
  pickupAddress: string;
  pickupRoadAddress: string;
  pickupDetailAddress?: string;
  pickupZonecode: string;
  pickupLatitude: number;
  pickupLongitude: number;
}

/** 판매자용 상품 목록 조회 요청 (백엔드 GetSellerProductsRequestDto) */
export interface GetSellerProductsRequestDto {
  page: number;
  limit: number;
  sortBy: SortBy;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: CakeSizeDisplayName[];
  storeId?: string;
  productType?: ProductType;
  productCategoryTypes?: ProductCategoryType[];
  salesStatus?: EnableStatus;
  visibilityStatus?: EnableStatus;
  /** 거리순 정렬(sortBy=distance)일 때 필수 */
  latitude?: number;
  /** 거리순 정렬(sortBy=distance)일 때 필수 */
  longitude?: number;
}

export type ProductListResponseDto = ListResponseDto<ProductResponseDto>;

export interface UpdateProductRequestDto {
  name?: string;
  images?: string[];
  originalPrice?: number;
  salePrice?: number;
  salesStatus?: EnableStatus;
  visibilityStatus?: EnableStatus;
  cakeSizeOptions?: CakeSizeOptionDto[];
  cakeFlavorOptions?: CakeFlavorOptionDto[];
  customOptions?: CustomOptionDto[];
  productType?: ProductType;
  productCategoryTypes?: ProductCategoryType[];
  searchTags?: string[];
  detailDescription?: string;
  productNoticeFoodType?: string;
  productNoticeProducer?: string;
  productNoticeOrigin?: string;
  productNoticeAddress?: string;
  productNoticeManufactureDate?: string;
  productNoticeExpirationDate?: string;
  productNoticePackageCapacity?: string;
  productNoticePackageQuantity?: string;
  productNoticeIngredients?: string;
  productNoticeCalories?: string;
  productNoticeSafetyNotice?: string;
  productNoticeGmoNotice?: string;
  productNoticeImportNotice?: string;
  productNoticeCustomerService?: string;
}
