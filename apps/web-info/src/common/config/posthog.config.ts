import posthog from "posthog-js";
import { isSyntheticBrowser } from "@/apps/web-info/common/utils/synthetic-traffic.util";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV ?? "development";

/** PostHog 이벤트를 앱/환경별로 구분하기 위한 전역 속성 */
const SUPER_PROPERTIES = {
  app: "web-info",
  environment: NODE_ENV,
};

/**
 * PostHog 활성화 여부
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
 * - web-user(picakes.com)와 같은 PostHog 프로젝트를 쓰며, posthog-js의 기본 설정(cross_subdomain_cookie)
 *   으로 같은 상위 도메인의 방문자 식별자가 공유되어 info → 서비스 유입이 한 사용자 흐름으로 이어진다.
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
    loaded: (ph) => {
      ph.register(SUPER_PROPERTIES);
    },
  });
}
