import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled, sentryInitOptions } from "@/apps/web-info/common/config/sentry.config";

if (isSentryEnabled()) {
  Sentry.init(sentryInitOptions);
}

/** App Router 클라이언트 네비게이션 계측 (traces 비활성 시 no-op) */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
