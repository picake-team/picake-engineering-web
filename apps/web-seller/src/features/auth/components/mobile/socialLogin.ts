import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";

/** 소셜 로그인 시작 주소(지금 PC 로그인과 같은 OAuth code flow) */
export function googleAuthorizeUrl(): string {
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}${ROUTES.AUTH.GOOGLE_REDIRECT_URI}&response_type=code&scope=email+profile&prompt=select_account`;
}

export function kakaoAuthorizeUrl(): string {
  return `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_PUBLIC_KAKAO_RESTAPI_KEY}&redirect_uri=${window.location.origin}${ROUTES.AUTH.KAKAO_REDIRECT_URI}&response_type=code`;
}

/**
 * 판매자 애플 로그인(I-48 "애플 로그인을 넣는다"). 서버(애플 로그인·계정 찾기)와 앱담당자 애플 개발자 계정의
 * 판매자 로그인 설정이 끝나면 켠다. 그전에는 버튼을 숨긴다.
 */
export const SELLER_APPLE_LOGIN_ENABLED = false;
