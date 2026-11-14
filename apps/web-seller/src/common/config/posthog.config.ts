import type { CaptureResult, PostHog } from "posthog-js";

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

/** 불러온 PostHog를 초기화한다(loadPostHog에서 한 번) */
function initClient(posthog: PostHog): void {
  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only",
    before_send: sanitizeEvent,
    // 로그인 화면에서 앱을 열면 처음부터 녹화하지 않는다. 화면을 옮길 때 켜고 끄는 일은
    // PostHogPageView가 isReplayBlockedPath로 맡는다(전에는 열자마자 잠깐 녹화된 뒤 꺼졌다)
    disable_session_recording: isReplayBlockedPath(window.location.pathname),
    loaded: (ph) => {
      ph.register(SUPER_PROPERTIES);
    },
  });
}

/**
 * 화면 녹화(세션 리플레이)를 하지 않는 주소.
 * - /auth/*: 로그인·가입·OAuth 콜백이라 휴대폰 번호·이메일이 화면에 보인다
 * startSessionRecording()은 disable_session_recording 설정을 덮어쓰므로 화면을 옮길 때마다 이 함수로 판단한다.
 */
export function isReplayBlockedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/auth");
}

/** PostHog를 켰는지(키가 있을 때만) */
function isPostHogEnabled(): boolean {
  return typeof window !== "undefined" && !!POSTHOG_KEY;
}

/**
 * PostHog는 처음 쓸 때 따로 불러온다(첫 화면 파일에서 빼서 화면이 먼저 뜨게 — 압축 약 50KB).
 * 불러오기 전에 부른 일(페이지뷰·이벤트·회원 묶기)은 부른 순서대로 불러온 뒤 한다.
 * 키가 없으면 아무것도 불러오지 않는다.
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
      if (posthog.get_distinct_id() !== userId) posthog.identify(userId, { role: "seller" });
    } else if (posthog.get_property("$user_state") === "identified") {
      posthog.reset();
    }
  });
}
