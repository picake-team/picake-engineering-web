import posthog, { type CaptureResult } from "posthog-js";
import { isSyntheticBrowser } from "@/apps/web-user/common/utils/synthetic-traffic.util";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV ?? "development";

/** PostHog 이벤트를 앱/환경별로 구분하기 위한 전역 속성 */
const SUPER_PROPERTIES = {
  app: "web-user",
  environment: NODE_ENV,
};

/**
 * $current_url/$referrer 쿼리스트링에 남을 수 있는 민감정보 파라미터.
 * 소셜 로그인 콜백(OAuth code)·가입 화면(이메일)에서 실제로 관측된 키들.
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
    // /auth/* 는 통째로 OAuth 콜백·가입 플로우라 쿼리스트링 자체가 필요 없음 — 전부 제거
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

/**
 * 전송 직전의 모든 이벤트(수동 $pageview + trackEvent 커스텀 이벤트 전부)에서
 * $current_url/$referrer에 남은 OAuth 코드·이메일 같은 민감정보를 제거합니다.
 * posthog-js가 모든 이벤트에 $current_url을 자동으로 붙이기 때문에, PostHogPageView의
 * 캡처 호출만 고쳐서는 부족합니다(예: /auth/register/google?...&googleEmail=... 페이지에
 * 머무는 동안 발생한 success_signup 같은 커스텀 이벤트에도 같은 URL이 자동으로 붙음).
 */
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
 * PostHog 활성화 여부 — Sentry의 isSentryEnabled와 동일한 정책
 * - 키가 설정된 경우만 true
 * - Lighthouse·브라우저 자동화 같은 합성 접속은 실제 방문자처럼 집계되므로 false (synthetic-traffic.util 참고)
 */
export function isPostHogEnabled(): boolean {
  return !!POSTHOG_KEY && !isSyntheticBrowser();
}

/**
 * PostHog 클라이언트를 초기화합니다.
 * - 키가 없으면(로컬 등 미설정) 또는 합성 접속이면 초기화를 건너뜁니다.
 * - 페이지뷰는 App Router 특성상 수동 캡처하므로 자동 캡처를 비활성화합니다.
 */
export function initPostHog(): void {
  if (typeof window === "undefined" || !POSTHOG_KEY || !isPostHogEnabled()) {
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
