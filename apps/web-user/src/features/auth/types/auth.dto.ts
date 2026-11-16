/** 백엔드 JWT `aud`와 동일 */
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
  APPLE_REGISTRATION: "apple_registration",
  PHONE_CHANGE: "phone_change",
  FIND_ACCOUNT: "find_account",
} as const;
export type PhoneVerificationPurpose =
  (typeof PHONE_VERIFICATION_PURPOSE)[keyof typeof PHONE_VERIFICATION_PURPOSE];

export interface TokenResponseDto {
  accessToken: string;
  refreshToken?: string;
}

export interface GoogleLoginRequestDto {
  code: string;
}

export interface KakaoLoginRequestDto {
  code: string;
}

export interface AppleLoginRequestDto {
  code: string;
}

/** 앱스토어/플레이스토어 심사(리뷰) 전용 로그인 요청 */
export interface ReviewLoginRequestDto {
  code: string;
}

export interface GoogleRegisterRequestDto {
  /** 가입표 — 로그인 응답(400 PHONE_VERIFICATION_REQUIRED)의 registerToken. 소셜 ID는 보내지 않는다 */
  registerToken: string;
  name: string;
  phone: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  agreedToThirdParty: boolean;
  agreedToLocationTerms: boolean;
  /** 동의한 약관 문서 ID 목록 (버전 이력 기록용) */
  termsDocumentIds?: string[];
}

export interface KakaoRegisterRequestDto {
  /** 가입표 — 로그인 응답(400 PHONE_VERIFICATION_REQUIRED)의 registerToken. 소셜 ID는 보내지 않는다 */
  registerToken: string;
  /** 가입표 안 카카오 번호를 손님이 확인했으면 true — phone·문자 인증 없이 그 번호로 가입 */
  useTicketPhone?: boolean;
  name: string;
  /** 문자 인증한 번호(useTicketPhone이 아닐 때) */
  phone?: string;
  /** 카카오 간편가입에서 약관에 모두 동의했으면 보내지 않는다(서버가 가입표로 확인) */
  agreedToTerms?: boolean;
  agreedToPrivacy?: boolean;
  agreedToThirdParty?: boolean;
  agreedToLocationTerms?: boolean;
  /** 동의한 약관 문서 ID 목록 (버전 이력 기록용) */
  termsDocumentIds?: string[];
}

export interface AppleRegisterRequestDto {
  /** 가입표 — 로그인 응답(400 PHONE_VERIFICATION_REQUIRED)의 registerToken. 소셜 ID는 보내지 않는다 */
  registerToken: string;
  name: string;
  phone: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  agreedToThirdParty: boolean;
  agreedToLocationTerms: boolean;
  /** 동의한 약관 문서 ID 목록 (버전 이력 기록용) */
  termsDocumentIds?: string[];
}

export interface VerifyPhoneCodeRequestDto {
  phone: string;
  verificationCode: string;
  audience: AudienceConst;
  purpose: PhoneVerificationPurpose;
}

export interface MessageResponseDto {
  message: string;
  /** 인증번호 입력 만료 시각 (ISO 8601) — `POST .../send-verification-code` 응답에 포함 */
  expiresAt?: string;
}

export type DuplicateAccountPayload = {
  /** 서버 409 글 그대로 */
  message: string;
  /** 이미 가입한 로그인 수단(서버 글로 알아냄) */
  provider: OAuthLoginProvider;
  name: string;
  phone: string;
  /** 가입된 로그인 계정의 이메일(가림, 예: pi***er@gmail.com). 없으면 null */
  email: string | null;
};

export type OAuthLoginProvider = "google" | "kakao" | "apple";
