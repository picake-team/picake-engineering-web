import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { NODE_ENV } from "@/apps/web-user/common/constants/environment.constants";
import { getOrCreateNaverOAuthState } from "@/apps/web-user/features/auth/utils/naver-oauth-state.util";

/**
 * 브라우저에서 카카오 OAuth 로그인 시작 URL (동일 도메인 redirect_uri)
 */
/** 카카오 간편가입 약관 태그(손님) — 카카오 콘솔 [카카오 로그인] > [간편가입]에 등록한 태그 */
export const KAKAO_CONSUMER_SERVICE_TERMS =
  "picake_c_tos,picake_c_privacy,picake_c_third_party,picake_c_location";

export function getKakaoOAuthLoginUrl(): string | null {
  if (typeof window === "undefined") return null;
  const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!clientId) return null;
  const redirectUri = `${window.location.origin}${PATHS.AUTH.KAKAO_REDIRECT_URI}`;
  // 카카오 간편가입: 손님 약관만 보여 준다(사장님과 카카오 앱을 같이 써서). 태그는 backend KAKAO_SERVICE_TERMS.consumer와 같게
  return `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&service_terms=${KAKAO_CONSUMER_SERVICE_TERMS}`;
}

/**
 * 브라우저에서 네이버 로그인 시작 URL (동일 도메인 Callback URL, 이 탭의 state).
 * 손님·사장님이 네이버 앱 하나를 같이 쓴다. 키가 없는 환경(검수 승인 전 상용 등)은 null — 버튼이 안 보인다.
 * 받는 정보(이름·휴대전화번호)는 네이버 개발자센터 앱 설정에서 정한다(요청에 범위를 싣지 않음).
 *
 * `reauthenticate`: 네이버에 로그인돼 있어도 아이디·비밀번호를 다시 받는다(네이버 `auth_type=reauthenticate`).
 * "이미 가입한 계정" 화면에서만 쓴다 — 네이버 아이디가 둘인 사람이 지금 로그인된 다른 아이디로 그냥 넘어가
 * 같은 화면으로 돌아오지 않게(구글은 늘 계정 고르기 `prompt=select_account`, 11-18 검토).
 */
export function getNaverOAuthLoginUrl(options?: { reauthenticate?: boolean }): string | null {
  if (typeof window === "undefined") return null;
  const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  if (!clientId) return null;
  const redirectUri = `${window.location.origin}${PATHS.AUTH.NAVER_REDIRECT_URI}`;
  const state = getOrCreateNaverOAuthState();
  const authType = options?.reauthenticate ? "&auth_type=reauthenticate" : "";
  return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}${authType}`;
}

/**
 * 브라우저에서 구글 OAuth 로그인 시작 URL (동일 도메인 redirect_uri)
 */
export function getGoogleOAuthLoginUrl(): string | null {
  if (typeof window === "undefined") return null;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const redirectUri = `${window.location.origin}${PATHS.AUTH.GOOGLE_REDIRECT_URI}`;
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email+profile&prompt=select_account`;
}

/**
 * Apple Return URL(Services ID Website URLs)은 HTTPS 도메인만 등록 가능해 `window.location.origin`
 * (dev=localhost)을 쓸 수 없습니다. dev도 staging 도메인으로 고정 — 실제 콜백 처리는 스테이징
 * 배포본이 담당합니다(로컬로 돌아오지 않음). `getAppleAppSiteAssociation`과 동일한 패턴.
 */
function getAppleRedirectBaseUrl(): string {
  const nodeEnv = process.env.NEXT_PUBLIC_NODE_ENV;
  return nodeEnv === NODE_ENV.PRODUCTION ? "https://picakes.com" : "https://staging.picakes.com";
}

/**
 * 브라우저에서 애플 OAuth 로그인 시작 URL.
 * `scope=email` 요청 시 Apple이 `response_mode=form_post`를 강제하므로 인가 응답은 GET 쿼리가 아니라
 * `/auth/login/apple`(route.ts)로 POST 됩니다 — Google/Kakao와 달리 페이지가 아닌 route handler가 받습니다.
 *
 * `name`도 함께 요청합니다 — Apple은 **최초 인가 시 1회에 한해서만** `user`(이름) 파라미터를
 * form_post 바디에 실어 보냅니다. 이걸 요청하지 않으면 회원가입 화면에서 이미 Apple이 알고 있는
 * 이름을 사용자에게 다시 입력하라고 요구하게 되는데, 이는 Apple 심사 가이드라인 4(Sign in with
 * Apple 디자인 요구사항) 위반으로 실제 반려된 사유입니다 — `route.ts`에서 이 `user` 값을 파싱해
 * 회원가입 화면 "이름" 필드를 미리 채웁니다.
 */
export function getAppleOAuthLoginUrl(): string | null {
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  if (!clientId) return null;
  const redirectUri = `${getAppleRedirectBaseUrl()}${PATHS.AUTH.APPLE_REDIRECT_URI}`;
  return `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&response_mode=form_post&scope=${encodeURIComponent("name email")}`;
}
