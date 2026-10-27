import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/apps/web-info/common/config/sentry.config";

/**
 * Sentry 유틸리티
 * 에러 로깅 및 모니터링을 위한 공통 유틸리티 (web-user와 동일 정책)
 */
export function captureSentryException(
  exception: unknown,
  captureContext?: Parameters<typeof Sentry.captureException>[1],
): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.captureException(exception, captureContext);
  } catch (error) {
    console.error("Sentry 예외 전송 실패:", error);
  }
}
