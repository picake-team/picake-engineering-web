import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";
import { isStagingOrProduction } from "@/apps/web-user/common/utils/environment.util";
import { scrubLinkToken } from "@/apps/web-user/common/utils/link-token.util";

/** 견적 링크 열쇠가 오류 기록(주소·요청 주소)에 남지 않게(11-12 검토) */
function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.url) event.request.url = scrubLinkToken(event.request.url);
  if (event.transaction) event.transaction = scrubLinkToken(event.transaction);
  for (const b of event.breadcrumbs ?? []) scrubBreadcrumb(b);
  return event;
}

function scrubBreadcrumb(b: Breadcrumb): Breadcrumb {
  if (b.message) b.message = scrubLinkToken(b.message);
  if (b.data) {
    for (const key of ["url", "from", "to"]) {
      const v = b.data[key];
      if (typeof v === "string") b.data[key] = scrubLinkToken(v);
    }
  }
  return b;
}

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV ?? "development";

/**
 * Sentry 전송 활성화 여부
 * - 개발 환경: 비활성화
 * - 검증(staging)/상용(production): DSN이 있을 때만 활성화
 * (백엔드 Sentry 정책과 동일)
 */
export function isSentryEnabled(): boolean {
  return isStagingOrProduction(NODE_ENV) && !!SENTRY_DSN;
}

/** 공통 Sentry 초기화 옵션 (client / server / edge 공용) */
export const sentryInitOptions = {
  dsn: SENTRY_DSN,
  environment: NODE_ENV,
  // 트랜잭션 비활성화 (에러만 전송하여 비용 절감) — 백엔드와 동일
  tracesSampleRate: 0,
  // 기본 PII 수집 비활성화 (개인정보 보호) — 백엔드와 동일
  sendDefaultPii: false,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
};
