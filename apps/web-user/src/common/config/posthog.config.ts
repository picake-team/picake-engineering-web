import type { CaptureResult, PostHog } from "posthog-js";
import { isQuoteLinkPath, scrubLinkToken } from "@/apps/web-user/common/utils/link-token.util";
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
  // 견적 링크 열쇠(/q/열쇠)는 그 가게 권한이라 지운다
  rawUrl = scrubLinkToken(rawUrl);
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
 * $current_url/$referrer에 남은 OAuth 코드·이메일 같은 민감정보를 제거하고, surface(app|web)를 붙입니다.
 * posthog-js가 모든 이벤트에 $current_url을 자동으로 붙이기 때문에, PostHogPageView의
 * 캡처 호출만 고쳐서는 부족합니다(예: /auth/register/google?...&googleEmail=... 페이지에
 * 머무는 동안 발생한 success_signup 같은 커스텀 이벤트에도 같은 URL이 자동으로 붙음).
 */
function sanitizeEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event?.properties) return event;
  // 손님 앱(웹뷰)인지 브라우저인지. Flutter가 브리지를 늦게 넣을 수 있어 보낼 때마다 본다
  // (webview.bridge의 isWebViewEnvironment와 같은 기준, 저장소를 불러오지 않으려고 여기서 직접 봄)
  event.properties.surface =
    typeof window !== "undefined" &&
    typeof (window as { mylocation?: unknown }).mylocation !== "undefined"
      ? "app"
      : "web";
  if (typeof event.properties.$current_url === "string") {
    event.properties.$current_url = sanitizeUrl(event.properties.$current_url);
  }
  if (typeof event.properties.$referrer === "string") {
    event.properties.$referrer = sanitizeUrl(event.properties.$referrer);
  }
  if (typeof event.properties.$pathname === "string") {
    event.properties.$pathname = scrubLinkToken(event.properties.$pathname);
  }
  return event;
}

/**
 * PostHog 활성화 여부 — Sentry의 isSentryEnabled와 동일한 정책
 * - 키가 설정된 경우만 true
 * - Lighthouse·브라우저 자동화 같은 합성 접속은 실제 방문자처럼 집계되므로 false (synthetic-traffic.util 참고)
 */
export function isPostHogEnabled(): boolean {
  return typeof window !== "undefined" && !!POSTHOG_KEY && !isSyntheticBrowser();
}

/** 불러온 PostHog를 초기화한다(loadPostHog에서 한 번) */
function initClient(posthog: PostHog): void {
  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only",
    before_send: sanitizeEvent,
    // 사장님 견적 링크(/q)는 손님 앱이 아니고 손님 요청서·대화가 보이는 화면이라 녹화하지 않는다(이벤트는 보냄).
    // 화면을 옮길 때 녹화를 켜고 끄는 일은 PostHogPageView의 isReplayBlockedPath가 맡는다
    disable_session_recording: isReplayBlockedPath(window.location.pathname),
    loaded: (ph) => {
      ph.register(SUPER_PROPERTIES);
    },
  });
}

/**
 * 화면 녹화(세션 리플레이)를 하지 않는 주소.
 * - /auth/*: OAuth 콜백·가입 플로우라 이메일 등이 화면에 보인다
 * - /q/*: 사장님 견적 링크(손님 요청서·대화)
 * startSessionRecording()은 disable_session_recording 설정을 덮어쓰므로 화면을 옮길 때마다 이 함수로 판단한다.
 */
export function isReplayBlockedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/auth") || isQuoteLinkPath(pathname);
}

/**
 * PostHog는 처음 쓸 때 따로 불러온다(첫 화면 파일에서 빼서 화면이 먼저 뜨게 — 압축 약 50KB).
 * 불러오기 전에 부른 일(페이지뷰·이벤트·회원 묶기)은 부른 순서대로 불러온 뒤 한다.
 * 키가 없거나 꺼져 있으면 아무것도 불러오지 않는다.
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
  const userId = accessToken ? tokenSubject(accessToken) : null;
  withPostHog((posthog) => {
    if (userId) {
      if (posthog.get_distinct_id() !== userId) posthog.identify(userId, { role: "consumer" });
    } else if (posthog.get_property("$user_state") === "identified") {
      posthog.reset();
    }
  });
}
