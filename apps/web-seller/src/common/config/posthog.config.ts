import posthog, { type CaptureResult } from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const NODE_ENV = import.meta.env.VITE_PUBLIC_NODE_ENV || "development";

/** PostHog 이벤트를 앱/환경별로 구분하기 위한 전역 속성 */
const SUPER_PROPERTIES = {
  app: "web-seller",
  environment: NODE_ENV,
};

/**
 * $current_url/$referrer 쿼리스트링에 남을 수 있는 민감정보 파라미터.
 * web-user의 소셜 로그인 콜백에서 실제로 관측된 키들과 동일한 패턴을 방어적으로 적용.
 */
const SENSITIVE_URL_PARAMS = [
  "code",
  "token",
  "access_token",
  "id_token",
  "googleEmail",
  "appleEmail",
  "googleId",
  "appleId",
  "iss",
  "scope",
  "authuser",
];

function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // /auth/* 는 OAuth 콜백·가입 플로우라 쿼리스트링 자체가 필요 없음 — 전부 제거
    if (url.pathname.startsWith("/auth/")) {
      url.search = "";
      return url.toString();
    }
    let changed = false;
    for (const key of SENSITIVE_URL_PARAMS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    return changed ? url.toString() : rawUrl;
  } catch {
    return rawUrl;
  }
}

/** 전송 직전의 모든 이벤트에서 $current_url/$referrer에 남은 민감정보를 제거합니다. */
function sanitizeEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event?.properties) return event;
  if (typeof event.properties.$current_url === "string") {
    event.properties.$current_url = sanitizeUrl(event.properties.$current_url);
  }
  if (typeof event.properties.$referrer === "string") {
    event.properties.$referrer = sanitizeUrl(event.properties.$referrer);
  }
  return event;
}

/**
 * PostHog 클라이언트를 초기화합니다.
 * - 키가 없으면(로컬 등 미설정) 초기화를 건너뜁니다.
 * - 페이지뷰는 SPA 라우팅 특성상 수동 캡처하므로 자동 캡처를 비활성화합니다.
 */
export function initPostHog(): void {
  if (typeof window === "undefined" || !POSTHOG_KEY) {
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only",
    before_send: sanitizeEvent,
    loaded: (ph) => {
      ph.register(SUPER_PROPERTIES);
    },
  });
}

/** PostHog를 켰는지(키가 있을 때만) */
function isPostHogEnabled(): boolean {
  return !!POSTHOG_KEY;
}

/** 로그인 토큰(JWT)의 회원 번호(sub). 토큰 확인은 서버가 하고 여기서는 읽기만 한다 */
function tokenSubject(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.sub === "string" && json.sub ? json.sub : null;
  } catch {
    return null;
  }
}

/**
 * 로그인한 회원을 PostHog에서 사람 하나로 묶는다(앱·브라우저·기기가 달라도 같은 사람으로 센다).
 * 회원 번호만 보낸다(이름·전화번호·이메일은 보내지 않음, 처리방침 국외 이전 표의 "회원 식별값").
 * 로그아웃하면 묶음을 끊어 같은 기기를 다음에 쓰는 사람과 섞이지 않게 한다.
 * 토큰이 바뀌어도(다시 로그인·갱신) 같은 회원이면 다시 보내지 않는다.
 */
export function syncPostHogUser(accessToken: string | null): void {
  if (typeof window === "undefined" || !isPostHogEnabled()) return;
  if (!(posthog as unknown as { __loaded?: boolean }).__loaded) return;
  const userId = accessToken ? tokenSubject(accessToken) : null;
  if (userId) {
    if (posthog.get_distinct_id() !== userId) posthog.identify(userId, { role: "seller" });
  } else if (posthog.get_property("$user_state") === "identified") {
    posthog.reset();
  }
}
