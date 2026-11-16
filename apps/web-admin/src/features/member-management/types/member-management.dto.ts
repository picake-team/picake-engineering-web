import type { ListResponseDto } from "@/apps/web-admin/common/types/api.dto";

/**
 * 회원(구매자·판매자) 관리 DTO (백엔드 member-management-*.dto와 동일 구조)
 */

/** 회원 상태 필터 (백엔드 MEMBER_STATUS_FILTER_VALUES) */
export enum MemberStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  WITHDRAWN = "WITHDRAWN",
}

/** 판매자 검증 상태 (백엔드 SellerVerificationStatus) */
export enum SellerVerificationStatus {
  REGISTERED = "REGISTERED",
  BUSINESS_VERIFIED = "BUSINESS_VERIFIED",
}

/** 회원 목록 조회 공통 쿼리 */
export interface MemberListQueryDto {
  page?: number;
  limit?: number;
  /** 이름·닉네임·휴대폰 부분 일치 */
  search?: string;
  status?: MemberStatus;
}

/** 구매자 목록 조회 쿼리 */
export type MemberConsumerListQueryDto = MemberListQueryDto;

/** 판매자 목록 조회 쿼리 */
export interface MemberSellerListQueryDto extends MemberListQueryDto {
  verificationStatus?: SellerVerificationStatus;
  /** 소속 세그먼트 키 필터 (예: EARLY_BIRD_2026) */
  segmentKey?: string;
}

/** 구매자 목록 항목 */
export interface MemberConsumerItemResponseDto {
  id: string;
  phone: string;
  name: string | null;
  nickname: string | null;
  isPhoneVerified: boolean;
  isActive: boolean;
  withdrawReason: string | null;
  /** 탈퇴 일시 (null이면 미탈퇴) */
  withdrawnAt: string | null;
  /** 구글 연동 이메일 (null이면 미연동) */
  googleEmail: string | null;
  /** 카카오 연동 이메일 (null이면 미연동) */
  kakaoEmail: string | null;
  /** 애플 연동 이메일 (null이면 미연동). 서버가 주기 전 응답에는 없을 수 있다 */
  appleEmail?: string | null;
  /** 네이버 회원 식별자 (null이면 미연동 — 네이버는 이메일을 받지 않음). 서버가 주기 전 응답에는 없을 수 있다 */
  naverId?: string | null;
  /** 누적 주문 수 (모든 상태) */
  orderCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

/** 판매자 보유 스토어 요약 */
export interface MemberSellerStoreDto {
  id: string;
  name: string;
}

/** 판매자가 소속된 세그먼트 요약 (얼리버드 등 향후 혜택 대상 구분) */
export interface MemberSellerSegmentDto {
  key: string;
  label: string;
}

/** 판매자 목록 항목 */
export interface MemberSellerItemResponseDto {
  id: string;
  phone: string;
  name: string | null;
  nickname: string | null;
  isPhoneVerified: boolean;
  isActive: boolean;
  withdrawReason: string | null;
  withdrawnAt: string | null;
  googleEmail: string | null;
  kakaoEmail: string | null;
  /** 네이버 회원 식별자 (null이면 미연동). 서버가 주기 전 응답에는 없을 수 있다 */
  naverId?: string | null;
  sellerVerificationStatus: SellerVerificationStatus;
  stores: MemberSellerStoreDto[];
  segments: MemberSellerSegmentDto[];
  lastLoginAt: string | null;
  createdAt: string;
}

/** 구매자 목록 응답 */
export type MemberConsumerListResponseDto = ListResponseDto<MemberConsumerItemResponseDto>;

/** 판매자 목록 응답 */
export type MemberSellerListResponseDto = ListResponseDto<MemberSellerItemResponseDto>;

/** 계정 활성/비활성 변경 요청 */
export interface UpdateMemberActiveRequestDto {
  isActive: boolean;
}
