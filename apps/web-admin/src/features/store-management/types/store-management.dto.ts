import type { ListResponseDto } from "@/apps/web-admin/common/types/api.dto";
import type {
  MemberStatus,
  SellerVerificationStatus,
} from "@/apps/web-admin/features/member-management/types/member-management.dto";

/**
 * 스토어 관리 DTO (백엔드 store-management.dto와 동일 구조)
 */

/** 정산 계좌 은행 코드 (백엔드 StoreBankName) */
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

/** 스토어 목록 조회 쿼리 */
export interface StoreManagementListQueryDto {
  page?: number;
  limit?: number;
  /** 스토어명·사업자명·사업자번호·연락처·판매자 이름·닉네임·휴대폰 */
  search?: string;
  sellerStatus?: MemberStatus;
}

/** 스토어에 연결된 판매자 요약 */
export interface StoreManagementSellerDto {
  id: string;
  phone: string;
  name: string | null;
  nickname: string | null;
  isActive: boolean;
  withdrawnAt: string | null;
  sellerVerificationStatus: SellerVerificationStatus;
  /** 상세 조회 시 포함 */
  createdAt?: string;
}

/** 스토어 목록 항목 */
export interface StoreManagementItemResponseDto {
  id: string;
  name: string;
  logoImageUrl: string | null;
  phoneNumber: string | null;
  address: string | null;
  roadAddress: string | null;
  detailAddress: string | null;
  businessNo: string;
  businessName: string;
  representativeName: string;
  likeCount: number;
  productCount: number;
  orderCount: number;
  seller: StoreManagementSellerDto;
  createdAt: string;
  updatedAt: string;
}

/** 스토어 목록 응답 */
export type StoreManagementListResponseDto = ListResponseDto<StoreManagementItemResponseDto>;

/** 스토어 상세 */
export interface StoreManagementDetailResponseDto extends StoreManagementItemResponseDto {
  description: string | null;
  zonecode: string | null;
  latitude: number | null;
  longitude: number | null;
  openingDate: string;
  businessSector: string;
  businessType: string;
  permissionManagementNumber: string | null;
  bankAccountNumber: string | null;
  bankName: StoreBankName | null;
  accountHolderName: string | null;
  kakaoChannelId: string | null;
  instagramId: string | null;
  feedCount: number;
  statistics: StoreManagementStatisticsDto;
}

/** 주문 상태별 건수 */
export interface StoreManagementOrderStatusCountDto {
  status: string;
  count: number;
}

/** 최근 기간 주문·매출 */
export interface StoreManagementRecentPeriodStatDto {
  /** 전체 주문 수 (모든 상태) */
  orders: number;
  /** 픽업 완료 주문 수 */
  completedOrders: number;
  /** GMV(원). 픽업 완료 기준 */
  gmv: number;
}

/** 매출 상위 상품 */
export interface StoreManagementTopProductStatDto {
  productId: string;
  productName: string;
  revenue: number;
  orderCount: number;
}

/** 스토어 상세 통계 */
export interface StoreManagementStatisticsDto {
  totalOrders: number;
  completedOrders: number;
  gmv: number;
  byStatus: StoreManagementOrderStatusCountDto[];
  last7Days: StoreManagementRecentPeriodStatDto;
  last30Days: StoreManagementRecentPeriodStatDto;
  topProductsByRevenue: StoreManagementTopProductStatDto[];
}
