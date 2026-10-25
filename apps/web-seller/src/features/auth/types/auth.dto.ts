/**
 * 인증 API 타입 — picake-engineering-backend 레포 `apps/backend` 판매자 `SellerAuthController` + auth DTO와 정합
 * Base: `GET|POST /v1/seller/auth/...`
 */

/** 백엔드 `AUDIENCE`와 동일 (JWT aud) */
export const AUDIENCE = {
  CONSUMER: "consumer",
  SELLER: "seller",
  ADMIN: "admin",
} as const;
export type AudienceConst = (typeof AUDIENCE)[keyof typeof AUDIENCE];

export const PHONE_VERIFICATION_PURPOSE = {
  REGISTRATION: "registration",
  GOOGLE_REGISTRATION: "google_registration",
  KAKAO_REGISTRATION: "kakao_registration",
  PHONE_CHANGE: "phone_change",
  FIND_ACCOUNT: "find_account",
} as const;

export type PhoneVerificationPurpose =
  (typeof PHONE_VERIFICATION_PURPOSE)[keyof typeof PHONE_VERIFICATION_PURPOSE];

/** GET /v1/seller/auth/me */
export interface MeResponseDto {
  available: true;
}

/**
 * POST /v1/seller/auth/google/login | google/register — 본문
 * 백엔드는 `refreshToken`도 포함하나, web-seller는 현재 액세스 토큰만 사용
 */
export interface TokenResponseDto {
  accessToken: string;
  refreshToken?: string;
}

/** 휴대폰 인증번호 검증 요청 — `audience`는 클라이언트에서 seller로 보내도 서버가 동일하게 덮어씀 */
export interface VerifyPhoneCodeRequestDto {
  phone: string;
  verificationCode: string;
  audience: AudienceConst;
  purpose: PhoneVerificationPurpose;
}

export interface GoogleLoginRequestDto {
  code: string;
}

export interface KakaoLoginRequestDto {
  code: string;
}

export interface GoogleRegisterRequestDto {
  googleId: string;
  googleEmail: string;
  name: string;
  phone: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  /** 동의한 약관 문서 ID 목록 (버전 이력 기록용) */
  termsDocumentIds?: string[];
}

export interface KakaoRegisterRequestDto {
  kakaoId: string;
  kakaoEmail: string;
  name: string;
  phone: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  /** 동의한 약관 문서 ID 목록 (버전 이력 기록용) */
  termsDocumentIds?: string[];
}

/** POST /v1/seller/auth/find-account */
export interface FindAccountRequestDto {
  phone: string;
}

export interface FindAccountResponseDto {
  loginType: "google" | "kakao";
  loginId: string;
  loginEmail: string | null;
}
