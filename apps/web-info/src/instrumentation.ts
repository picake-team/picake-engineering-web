import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled, sentryInitOptions } from "@/apps/web-info/common/config/sentry.config";

export async function register() {
  if (!isSentryEnabled()) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(sentryInitOptions);
  }
}

/** 서버 컴포넌트 / 라우트 핸들러 에러 캡처 */
export const onRequestError = Sentry.captureRequestError;
