/**
 * 판매자 마이페이지 API — `GET|PATCH /v1/seller/mypage/profile`, `POST /v1/seller/mypage/change-phone`
 * 백엔드 `mypage-profile.dto` 등과 정합
 */

/** GET /v1/seller/mypage/profile */
export interface SellerMypageProfileResponseDto {
  id: string;
  phone: string;
  name: string;
  nickname: string;
  profileImageUrl: string;
  isPhoneVerified: boolean;
  isActive: boolean;
  googleId: string;
  googleEmail: string;
  kakaoId: string;
  kakaoEmail: string;
  /** 네이버로 가입했을 때만(아니면 빈 문자열). 네이버는 이메일을 받지 않는다. 서버가 주기 전 응답에는 없을 수 있다 */
  naverId?: string;
  /** 애플로 가입했을 때만(아니면 빈 문자열, 2026-11-26). 서버가 주기 전 응답에는 없을 수 있다 */
  appleId?: string;
  appleEmail?: string;
  sellerVerificationStatus: string;
  createdAt: string;
  lastLoginAt: string;
  /** 동의한 서비스 이용약관 버전 (미동의 시 null) */
  agreedTermsVersion: string | null;
  /** 동의한 개인정보 처리방침 버전 (미동의 시 null) */
  agreedPrivacyVersion: string | null;
}

/** PATCH /v1/seller/mypage/profile */
export interface UpdateSellerMypageProfileRequestDto {
  name?: string;
  nickname?: string;
  profileImageUrl?: string | null;
}

/** POST /v1/seller/mypage/change-phone — `purpose: phone_change` 인증 완료 후 */
export interface ChangePhoneRequestDto {
  newPhone: string;
}

/** POST /v1/seller/mypage/withdraw */
export interface WithdrawAccountRequestDto {
  reason: string;
}
