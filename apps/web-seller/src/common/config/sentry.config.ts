import * as Sentry from "@sentry/react";
import type { Breadcrumb, ErrorEvent } from "@sentry/react";
import { isStagingOrProduction } from "@/apps/web-seller/common/utils/environment.util";

/**
 * 오류 기록(주소·이동 기록)에 소셜 로그인 콜백의 code·state와 가입표가 남지 않게 가린다(11-16 밤 검토 —
 * 네이버 state는 취소하고 돌아오면 30분 동안 다시 쓰는 값). 손님 웹 `scrubLinkToken`과 같은 규칙.
 */
export function scrubAuthQuery(value: string): string {
  return value.replace(/([?&](?:code|state|registerToken)=)[^&#\s]+/g, "$1[token]");
}

function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.url) event.request.url = scrubAuthQuery(event.request.url);
  if (event.transaction) event.transaction = scrubAuthQuery(event.transaction);
  for (const b of event.breadcrumbs ?? []) scrubBreadcrumb(b);
  return event;
}

function scrubBreadcrumb(b: Breadcrumb): Breadcrumb {
  if (b.message) b.message = scrubAuthQuery(b.message);
  if (b.data) {
    for (const key of ["url", "from", "to"]) {
      const v = b.data[key];
      if (typeof v === "string") b.data[key] = scrubAuthQuery(v);
    }
  }
  return b;
}

const SENTRY_DSN = import.meta.env.VITE_PUBLIC_SENTRY_DSN;
const NODE_ENV = import.meta.env.VITE_PUBLIC_NODE_ENV || "development";

/**
 * Sentry 전송 활성화 여부
 * - 개발 환경: 비활성화
 * - 검증(staging)/상용(production): DSN이 있을 때만 활성화
 * (백엔드 Sentry 정책과 동일)
 */
export function isSentryEnabled(): boolean {
  return isStagingOrProduction(NODE_ENV) && !!SENTRY_DSN;
}

/** 공통 Sentry 초기화 옵션 */
export const sentryInitOptions = {
  dsn: SENTRY_DSN,
  environment: NODE_ENV,
  // 트랜잭션 비활성화 (에러만 전송하여 비용 절감) — 백엔드와 동일
  tracesSampleRate: 0,
  // 기본 PII 수집 비활성화 (개인정보 보호) — 백엔드와 동일
  sendDefaultPii: false,
  beforeSend: (event: ErrorEvent) => scrubEvent(event),
  beforeBreadcrumb: (breadcrumb: Breadcrumb) => scrubBreadcrumb(breadcrumb),
};

/**
 * Sentry 클라이언트를 초기화합니다.
 * 앱 진입점(main.tsx)에서 렌더링 전에 1회 호출합니다.
 */
export function initSentry(): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.init(sentryInitOptions);
}
