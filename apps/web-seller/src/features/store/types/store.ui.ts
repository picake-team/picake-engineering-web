import type {
  GetSellerStoresRequestDto,
  RefundCancellationPolicyDto,
  StoreAddressDto,
  StoreBankName,
} from "@/apps/web-seller/features/store/types/store.dto";

/** UI 폼: 스토어 기본 정보 + 정산 계좌 + 주소 (스토어 생성/수정 폼) */
export interface StoreForm extends StoreAddressDto {
  name: string;
  description?: string;
  phoneNumber: string;
  logoImageUrl?: string;
  // 정산 계좌
  bankAccountNumber: string;
  bankName: StoreBankName | "";
  accountHolderName: string;
  /** 채널 정보 */
  kakaoChannelId?: string;
  instagramId?: string;
  /** 손님 문의 "손님에게 보이기"(기획 I-01). 끄면 값이 있어도 손님 화면에 안 보인다. 옛 서버 응답에는 없다(없으면 켜짐) */
  chatInquiryVisible?: boolean;
  kakaoChannelVisible?: boolean;
  instagramVisible?: boolean;
  phoneVisible?: boolean;
  /** 환불·취소 규정 (필수, `rules` 배열) */
  refundCancellationPolicy: RefundCancellationPolicyDto;
  /** 스토어 등록 때 함께 연결할 네이버 플레이스 ID (등록 화면에서만 사용) */
  naverPlaceId?: string;
}

/** 쿼리 키/옵션용 (page 제외, 클라이언트 전용) */
export type GetSellerStoresQueryParams = Omit<GetSellerStoresRequestDto, "page">;
