import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { getOrCreateNaverOAuthState } from "@/apps/web-seller/features/auth/utils/naver-oauth-state.util";

/** 소셜 로그인 시작 주소(지금 PC 로그인과 같은 OAuth code flow) */
export function googleAuthorizeUrl(): string {
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}${ROUTES.AUTH.GOOGLE_REDIRECT_URI}&response_type=code&scope=email+profile&prompt=select_account`;
}

export function kakaoAuthorizeUrl(): string {
  return `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_PUBLIC_KAKAO_RESTAPI_KEY}&redirect_uri=${window.location.origin}${ROUTES.AUTH.KAKAO_REDIRECT_URI}&response_type=code&service_terms=user_age_check,picake_s_tos,picake_s_privacy`;
}

/**
 * 소셜 로그인 버튼 안 아이콘 자리(손님 앱과 같은 규칙, 2026-11-16 운영자 결정): 아이콘은 버튼 왼쪽 20px의 20×20 칸에 고정하고
 * 글자는 버튼 가운데. 그래서 버튼을 쌓아도 아이콘은 한 줄, 글자는 가운데로 맞는다. 버튼에는 `relative`를 둔다.
 */
export const SOCIAL_LOGIN_ICON_CLASS = "absolute left-5 top-1/2 size-5 -translate-y-1/2";
/** 네이버 N은 16px — 20×20 칸 가운데(왼쪽 22px) */
export const SOCIAL_LOGIN_NAVER_ICON_CLASS = "absolute left-[22px] top-1/2 size-4 -translate-y-1/2";

/** 네이버 키가 있는 환경만 네이버 버튼(검수 승인 전 상용은 키를 넣지 않는다) */
export const SELLER_NAVER_LOGIN_ENABLED = Boolean(import.meta.env.VITE_PUBLIC_NAVER_CLIENT_ID);

/** 사장님 로그인 방법 이름(탈퇴 안내·번호 바꾸기 안내) — 사장님은 애플 로그인이 없고, 네이버는 키를 넣은 환경에서만(11-16 검토) */
export const SELLER_LOGIN_METHODS_LABEL = SELLER_NAVER_LOGIN_ENABLED
  ? "카카오·네이버·구글"
  : "카카오·구글";

/**
 * 네이버 로그인 시작 주소(손님과 같은 네이버 앱, 이 탭의 state). 받는 정보(이름·휴대전화번호)는 네이버 앱 설정에서 정한다.
 *
 * `reauthenticate`: 네이버에 로그인돼 있어도 아이디·비밀번호를 다시 받는다(네이버 `auth_type=reauthenticate`).
 * "이미 가입한 계정" 화면에서만 쓴다 — 네이버 아이디가 둘인 사람이 지금 로그인된 다른 아이디로 그냥 넘어가
 * 같은 화면으로 돌아오지 않게(구글은 늘 계정 고르기 `prompt=select_account`, 11-18 검토).
 */
export function naverAuthorizeUrl(options?: { reauthenticate?: boolean }): string {
  const clientId = encodeURIComponent(import.meta.env.VITE_PUBLIC_NAVER_CLIENT_ID ?? "");
  const redirectUri = encodeURIComponent(
    `${window.location.origin}${ROUTES.AUTH.NAVER_REDIRECT_URI}`,
  );
  const authType = options?.reauthenticate ? "&auth_type=reauthenticate" : "";
  return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${getOrCreateNaverOAuthState()}${authType}`;
}

/**
 * 네이버 버튼(`<a href={naverAuthorizeUrl()}>`)을 누를 때 주소를 다시 만든다. 화면을 그린 때 만든 state는
 * 로그인 화면을 30분 넘게 띄워 두면 콜백에서 "로그인을 확인하지 못했어요"로 막히기 때문(11-16 검토).
 */
export function refreshNaverHrefOnClick(event: { currentTarget: HTMLAnchorElement }): void {
  event.currentTarget.href = naverAuthorizeUrl();
}

/** "이미 가입한 계정" 화면의 네이버 버튼 — 누를 때 주소를 다시 만들고 아이디·비밀번호를 다시 받는다 */
export function refreshNaverReauthHrefOnClick(event: { currentTarget: HTMLAnchorElement }): void {
  event.currentTarget.href = naverAuthorizeUrl({ reauthenticate: true });
}

/**
 * 판매자 애플 로그인(I-48 "애플 로그인을 넣는다"). 서버(애플 로그인·계정 찾기)와 앱담당자 애플 개발자 계정의
 * 판매자 로그인 설정이 끝나면 켠다. 그전에는 버튼을 숨긴다.
 */
export const SELLER_APPLE_LOGIN_ENABLED = false;
