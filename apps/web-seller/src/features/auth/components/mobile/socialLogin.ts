import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { isProduction } from "@/apps/web-seller/common/utils/environment.util";
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

/**
 * 애플 키(Services ID)가 있는 환경만 애플 버튼(2026-11-26, 판매자 앱 App Store 4.8). 서버(판매자 애플 로그인)가 그 환경에 나가고
 * 앱담당자가 애플 Services ID에 판매자 Return URL(서버 주소)을 저장한 뒤 Vercel에 `VITE_PUBLIC_APPLE_CLIENT_ID`를 넣는다 —
 * 그전에는 버튼이 없어 웹이 서버보다 먼저 나가도 깨지지 않는다.
 */
export const SELLER_APPLE_LOGIN_ENABLED = Boolean(import.meta.env.VITE_PUBLIC_APPLE_CLIENT_ID);

/** 사장님 로그인 방법 이름(탈퇴 안내·번호 바꾸기 안내) — 네이버·애플은 키를 넣은 환경에서만(11-16 검토) */
export const SELLER_LOGIN_METHODS_LABEL = ["카카오", "네이버", "구글", "애플"]
  .filter(
    (name) =>
      (name !== "네이버" || SELLER_NAVER_LOGIN_ENABLED) &&
      (name !== "애플" || SELLER_APPLE_LOGIN_ENABLED),
  )
  .join("·");

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
 * 애플 Return URL — 판매자 웹은 정적 앱이라 애플의 form_post를 받을 수 없어 서버 주소다(서버 `getSellerAppleRedirectUri`와 글자까지 같게).
 * 상용 판매자 웹은 상용 서버, 그 밖(로컬·staging)은 staging 서버 — 애플은 HTTPS 주소만 받아서 로컬도 staging 서버로 간다(손님과 같음).
 */
export function sellerAppleRedirectUri(
  nodeEnv: string | undefined = import.meta.env.VITE_PUBLIC_NODE_ENV,
): string {
  const base = isProduction(nodeEnv)
    ? "https://api.picakes.com"
    : "https://api-staging.picakes.com";
  return `${base}/v1/seller/auth/apple/callback`;
}

/**
 * 애플 로그인 시작 주소(손님과 같은 Services ID). `name email`을 받아 처음 한 번 오는 이름으로 가입 화면 이름 칸을 채운다(심사 4).
 * state는 이 탭의 OAuth state(네이버와 같은 저장소 — 콜백에서 같은 값인지 확인해 남이 만든 로그인 결과를 받지 않게).
 */
export function appleAuthorizeUrl(): string {
  const clientId = encodeURIComponent(import.meta.env.VITE_PUBLIC_APPLE_CLIENT_ID ?? "");
  const redirectUri = encodeURIComponent(sellerAppleRedirectUri());
  return `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&response_mode=form_post&scope=${encodeURIComponent("name email")}&state=${getOrCreateNaverOAuthState()}`;
}

/** 애플 버튼을 누를 때 주소를 다시 만든다(state 30분 — 로그인 화면을 오래 띄워 둔 뒤 눌러도 막히지 않게, 네이버와 같음) */
export function refreshAppleHrefOnClick(event: { currentTarget: HTMLAnchorElement }): void {
  event.currentTarget.href = appleAuthorizeUrl();
}
