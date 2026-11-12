import type { PostHog } from "posthog-js";
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
  return typeof window !== "undefined" && !!POSTHOG_KEY && !isSyntheticBrowser();
}

/**
 * 불러온 PostHog를 초기화합니다(loadPostHog에서 한 번).
 * - 페이지뷰는 App Router 특성상 수동 캡처하므로 자동 캡처를 비활성화합니다.
 * - web-user(picakes.com)와 같은 PostHog 프로젝트를 쓰며, posthog-js의 기본 설정(cross_subdomain_cookie)
 *   으로 같은 상위 도메인의 방문자 식별자가 공유되어 info → 서비스 유입이 한 사용자 흐름으로 이어진다.
 */
function initClient(posthog: PostHog): void {
  posthog.init(POSTHOG_KEY!, {
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

/**
 * PostHog는 처음 쓸 때 따로 불러온다(첫 화면 파일에서 빼서 소개 페이지가 먼저 뜨게 — 압축 약 67KB).
 * 불러오기 전에 부른 일(페이지뷰)은 부른 순서대로 불러온 뒤 한다. 키가 없거나 합성 접속이면 불러오지 않는다.
 */
let loading: Promise<PostHog | null> | null = null;

function loadPostHog(): Promise<PostHog | null> {
  if (!isPostHogEnabled()) return Promise.resolve(null);
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      initClient(posthog);
      return posthog;
    })
    .catch((error) => {
      // 파일을 못 받았으면(끊김) 다음 호출 때 다시 시도
      loading = null;
      console.error("PostHog 불러오기 실패:", error);
      return null;
    });
  return loading;
}

/** PostHog가 준비되면 fn을 부른다(실패해도 화면은 그대로) */
export function withPostHog(fn: (posthog: PostHog) => void): void {
  void loadPostHog().then((posthog) => {
    if (!posthog) return;
    try {
      fn(posthog);
    } catch (error) {
      console.error("PostHog 호출 실패:", error);
    }
  });
}

/** 앱이 뜰 때 한 번: PostHog를 불러와 초기화 */
export function initPostHog(): void {
  withPostHog(() => {});
}
