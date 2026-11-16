export interface MypageProfile {
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
  appleId: string;
  appleEmail: string;
  /** 네이버로 가입했을 때만(아니면 빈 문자열). 네이버는 이메일을 받지 않는다. 서버가 주기 전 응답에는 없을 수 있다 */
  naverId?: string;
  createdAt: string;
  lastLoginAt: string;
  /** 동의한 서비스 이용약관 버전 (미동의 시 null) */
  agreedTermsVersion: string | null;
  /** 동의한 개인정보 처리방침 버전 (미동의 시 null) */
  agreedPrivacyVersion: string | null;
  /** 동의한 개인정보 제3자 제공 동의 버전 (미동의 시 null) */
  agreedThirdPartyVersion: string | null;
  /** 동의한 위치기반서비스 이용약관 버전 (선택 동의 — 미동의 시 null) */
  agreedLocationTermsVersion: string | null;
}
