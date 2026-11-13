import { withPostHog } from "@/apps/web-user/common/config/posthog.config";
import type {
  AnalyticsEventMap,
  AnalyticsEventName,
} from "@/apps/web-user/common/types/analytics.type";

/**
 * 애널리틱스 유틸리티
 * 이벤트 텍소노미 문서에 정의된 커스텀 이벤트를 PostHog로 전송 (Sentry 유틸과 동일한 정책)
 */

/** 이벤트 텍소노미에 정의된 커스텀 이벤트를 PostHog로 전송 */
export function trackEvent<T extends AnalyticsEventName>(
  event: T,
  ...args: AnalyticsEventMap[T] extends never ? [] : [properties: AnalyticsEventMap[T]]
): void {
  withPostHog((posthog) => posthog.capture(event, args[0]));
}
