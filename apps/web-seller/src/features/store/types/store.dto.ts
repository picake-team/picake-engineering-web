/**
 * 스토어 API 타입 (백엔드 store DTO와 1:1 정합)
 * - 단일: StoreResponseDto
 * - 목록: GetSellerStoresRequestDto, StoreListResponseDto
 * - CRUD: CreateStoreRequestDto, CreateStoreResponseDto, UpdateStoreRequestDto
 */

import type { ListResponseDto } from "@/apps/web-seller/common/types/api.dto";
import {
  BusinessValidationRequestDto,
  OnlineTradingCompanyDetailRequestDto,
} from "@/apps/web-seller/features/business/types/business.dto";
import type {
  CakeSizeDisplayName,
  ProductCategoryType,
} from "@/apps/web-seller/features/product/types/product.dto";

export enum StoreSortBy {
  LATEST = "latest",
  POPULAR = "popular",
  RATING_AVG = "rating_avg",
  DISTANCE = "distance",
}

/** 정산 계좌 은행 코드 (백엔드·Prisma StoreBankName과 동일) */
export enum StoreBankName {
  NH_NONGHYUP = "NH_NONGHYUP",
  KAKAO_BANK = "KAKAO_BANK",
  KB_KOOKMIN = "KB_KOOKMIN",
  TOSS_BANK = "TOSS_BANK",
  SHINHAN = "SHINHAN",
  WOORI = "WOORI",
  IBK = "IBK",
  HANA = "HANA",
  SAEMAEUL = "SAEMAEUL",
  BUSAN = "BUSAN",
  IM_BANK_DAEGU = "IM_BANK_DAEGU",
  K_BANK = "K_BANK",
  SINHYEOP = "SINHYEOP",
  POST_OFFICE = "POST_OFFICE",
  SC_JEIL = "SC_JEIL",
  KYONGNAM = "KYONGNAM",
  GWANGJU = "GWANGJU",
  SUHYUP = "SUHYUP",
  JEONBUK = "JEONBUK",
  SAVINGS_BANK = "SAVINGS_BANK",
  JEJU = "JEJU",
  CITI = "CITI",
  KDB = "KDB",
}

/** 주소 정보 (백엔드 StoreAddressDto) */
export interface StoreAddressDto {
  address: string;
  roadAddress: string;
  detailAddress: string;
  zonecode: string;
  latitude: number;
  longitude: number;
}

/** 환불·취소 규칙 한 줄 */
export interface RefundRuleItemDto {
  daysBeforePickup: number;
  refundDescription: string;
}

/** 환불·취소 규정 (`rules` 배열, 백엔드 JSON과 동일) */
export interface RefundCancellationPolicyDto {
  rules: RefundRuleItemDto[];
}

/** 스토어 상품 대표이미지 (상품당 1장) */
export interface StoreProductRepresentativeImageDto {
  productId: string;
  imageUrl: string;
}

export interface StoreResponseDto extends StoreAddressDto {
  id: string;
  userId: string;
  logoImageUrl?: string | null;
  name: string;
  description?: string | null;
  phoneNumber?: string | null;
  kakaoChannelId?: string | null;
  instagramId?: string | null;
  businessNo: string;
  representativeName: string;
  openingDate: string;
  businessName: string;
  businessSector: string;
  businessType: string;
  permissionManagementNumber: string;
  /** 정산 계좌번호 */
  bankAccountNumber?: string | null;
  /** 정산 계좌 은행 코드 */
  bankName?: StoreBankName | null;
  /** 정산 계좌 예금주명 */
  accountHolderName?: string | null;
  likeCount: number;
  isLiked?: boolean | null;
  /** 연결한 네이버 플레이스 (판매자 상세 조회에서만, 연결 안 했으면 null) */
  naverPlace?: StoreNaverPlaceDto | null;
  averageRating: number;
  totalReviewCount: number;
  /** 해당 스토어의 모든 상품 대표이미지 (상품당 1장) */
  productRepresentativeImages: StoreProductRepresentativeImageDto[];
  /** 상품 중 최소 금액 (노출·판매중인 상품만, 없으면 null) */
  minProductPrice: number | null;
  /** 영업 캘린더 (백엔드 StoreResponseDto.businessCalendar, 구버전 API는 생략될 수 있음) */
  businessCalendar?: StoreBusinessCalendarDto;
  /** 환불·취소 규정 (구버전 배포 시 생략될 수 있음) */
  refundCancellationPolicy?: RefundCancellationPolicyDto;
  createdAt: Date;
  updatedAt: Date;
}

/** 날짜별 영업 예외 (백엔드 StoreBusinessDayOverrideDto) */
export interface StoreBusinessDayOverrideDto {
  date: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

/** 영업 캘린더 (백엔드 StoreBusinessCalendarDto) */
export interface StoreBusinessCalendarDto {
  weeklyClosedWeekdays: number[];
  standardOpenTime: string;
  standardCloseTime: string;
  dayOverrides: StoreBusinessDayOverrideDto[];
}

export interface UpdateStoreBusinessCalendarResponseDto {
  businessCalendar: StoreBusinessCalendarDto;
}

/** 스토어 생성 요청 (3단계: 사업자진위 + 통신판매 + 스토어정보) */
export interface CreateStoreRequestDto extends StoreAddressDto {
  businessValidation: BusinessValidationRequestDto;
  onlineTradingCompanyDetail: OnlineTradingCompanyDetailRequestDto;
  name: string;
  description?: string;
  phoneNumber: string;
  logoImageUrl?: string;
  kakaoChannelId?: string;
  instagramId?: string;
  /** 판매자가 자기 매장이 맞다고 확인한 네이버 플레이스 ID */
  naverPlaceId?: string;
  bankAccountNumber: string;
  bankName: StoreBankName;
  accountHolderName: string;
  refundCancellationPolicy: RefundCancellationPolicyDto;
}

export interface CreateStoreResponseDto {
  id: string;
}

export interface UpdateStoreRequestDto extends StoreAddressDto {
  name: string;
  description?: string;
  phoneNumber: string;
  logoImageUrl?: string;
  kakaoChannelId?: string;
  instagramId?: string;
  bankAccountNumber: string;
  bankName: StoreBankName;
  accountHolderName: string;
  refundCancellationPolicy: RefundCancellationPolicyDto;
}

export interface UpdateStoreResponseDto {
  id: string;
}

/** 판매자용 스토어 목록 조회 요청 (백엔드 GetSellerStoresRequestDto) */
export interface GetSellerStoresRequestDto {
  page: number;
  limit: number;
  search?: string;
  sortBy?: StoreSortBy;
  /** 상품 필터: 사이즈(도시락, 미니, 1호 등). 상품 cakeSizeOptions.displayName과 동일한 CakeSizeDisplayName enum */
  sizes?: CakeSizeDisplayName[];
  /** 상품 필터: 최소 가격 */
  minPrice?: number;
  /** 상품 필터: 최대 가격 */
  maxPrice?: number;
  /** 상품 필터: 유형(캐릭터, 커스텀 등). 상품 목록 조회와 동일한 ProductCategoryType enum */
  productCategoryTypes?: ProductCategoryType[];
  /** 거리순 정렬(sortBy=distance)일 때 필수. 기준점 WGS84 위도 */
  latitude?: number;
  /** 거리순 정렬(sortBy=distance)일 때 필수. 기준점 WGS84 경도 */
  longitude?: number;
}

export type StoreListResponseDto = ListResponseDto<StoreResponseDto>;

/** 스토어에 연결한 네이버 플레이스 */
export interface StoreNaverPlaceDto {
  placeId: string;
  placeUrl: string;
  connectedAt: string;
}

/** 네이버에서 가져와 스토어 폼에 채울 수 있는 값 (주소는 참고용) */
export interface NaverPlaceStorePrefillDto {
  name: string;
  description: string | null;
  phoneNumber: string | null;
  instagramId: string | null;
  address: string | null;
  roadAddress: string | null;
  latitude: number | null;
  longitude: number | null;
}

/** 네이버에 적힌 요일별 영업시간 (참고용) */
export interface NaverPlaceBusinessDayDto {
  day: string;
  open: string | null;
  close: string | null;
  endsNextDay: boolean;
  breakHours: { start: string; end: string }[];
  description: string | null;
}

/** 네이버 영업시간을 정기 휴무·표준 영업시간으로 바꾼 제안값 */
export interface NaverPlaceCalendarSuggestionDto {
  weeklyClosedWeekdays: number[] | null;
  standardOpenTime: string | null;
  standardCloseTime: string | null;
  /** 그대로 옮길 수 없어 직접 설정해야 하는 항목 */
  warnings: string[];
}

/** 네이버 플레이스 미리보기 응답 */
export interface NaverPlacePreviewResponseDto {
  placeId: string;
  placeUrl: string;
  category: string | null;
  /** 네이버에서 정보를 읽은 시각 (ISO) */
  fetchedAt: string;
  storePrefill: NaverPlaceStorePrefillDto;
  businessHours: { days: NaverPlaceBusinessDayDto[]; freeText: string | null };
  /** 네이버 영업시간을 영업 캘린더 형식으로 바꾼 제안값 (자동 반영하지 않음) */
  calendarSuggestion: NaverPlaceCalendarSuggestionDto;
  /** 그대로 쓸 수 없거나 확인이 필요한 항목 */
  warnings: string[];
}
