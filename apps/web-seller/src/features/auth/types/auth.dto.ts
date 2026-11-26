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
  NAVER_REGISTRATION: "naver_registration",
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

/** 네이버 로그인 요청 — 콜백 주소의 code와, 로그인 요청 때 이 화면이 만든 state(확인을 마친 값) */
export interface NaverLoginRequestDto {
  code: string;
  state: string;
}

export interface GoogleRegisterRequestDto {
  /** 가입표 — 로그인 응답(400 PHONE_VERIFICATION_REQUIRED)의 registerToken. 소셜 ID는 보내지 않는다 */
  registerToken: string;
  name: string;
  phone: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  /** 만 14세 이상 확인(법무 LG-02) — 카카오 간편가입에서 동의했으면 생략 */
  agreedToAge14?: boolean;
  /** 동의한 약관 문서 ID 목록 (버전 이력 기록용) */
  termsDocumentIds?: string[];
}

export interface KakaoRegisterRequestDto {
  /** 가입표 — 로그인 응답(400 PHONE_VERIFICATION_REQUIRED)의 registerToken. 소셜 ID는 보내지 않는다 */
  registerToken: string;
  /** 가입표 안 카카오 번호를 사장님이 확인했으면 true — phone·문자 인증 없이 그 번호로 가입 */
  useTicketPhone?: boolean;
  name: string;
  /** 문자 인증한 번호(useTicketPhone이 아닐 때) */
  phone?: string;
  /** 카카오 간편가입에서 약관에 모두 동의했으면 보내지 않는다(서버가 가입표로 확인) */
  agreedToTerms?: boolean;
  agreedToPrivacy?: boolean;
  /** 만 14세 이상 확인(법무 LG-02) — 카카오 간편가입에서 동의했으면 생략 */
  agreedToAge14?: boolean;
  /** 동의한 약관 문서 ID 목록 (버전 이력 기록용) */
  termsDocumentIds?: string[];
}

/** 네이버 가입 — 카카오와 같게 가입표의 네이버 번호로 문자 인증 없이 가입할 수 있다. 약관은 늘 가입 화면에서 */
export interface NaverRegisterRequestDto {
  registerToken: string;
  /** 가입표 안 네이버 번호로 가입하면 true — phone·문자 인증 없이 그 번호로 */
  useTicketPhone?: boolean;
  name: string;
  /** 문자 인증한 번호(useTicketPhone이 아닐 때) */
  phone?: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  /** 만 14세 이상 확인(법무 LG-02) — 카카오 간편가입에서 동의했으면 생략 */
  agreedToAge14?: boolean;
  termsDocumentIds?: string[];
}

/** POST /v1/seller/auth/find-account */
export interface FindAccountRequestDto {
  phone: string;
}

export interface FindAccountResponseDto {
  loginType: "google" | "kakao" | "naver";
  loginId: string;
  loginEmail: string | null;
}
