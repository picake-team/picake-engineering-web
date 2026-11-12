import { withPostHog } from "@/apps/web-seller/common/config/posthog.config";

/**
 * 판매자 웹 PostHog 커스텀 이벤트(손님 웹 `trackEvent`와 같은 정책: 키가 없으면 보내지 않고, 실패해도 화면은 그대로).
 * 이름은 이벤트 텍소노미 규칙(행동_대상)을 따른다.
 */
export interface SellerAnalyticsEventMap {
  /** 판매자가 주문 상태를 바꿈(I-48 성공 기준: 앱에서 바꾼 비율) */
  success_order_status_change: {
    from_status: string;
    to_status: string;
    /** app = 판매자 앱, mobile_web = 휴대폰 브라우저, pc = PC 화면 */
    surface: "app" | "mobile_web" | "pc";
    /** 목록에서 바로 처리했는지(상세가 아니라) */
    from_list: boolean;
  };
  /** 판매자 앱 채팅 요청서 카드에서 견적을 보냄·고침(기획 I-46 ②) */
  success_quote_send: {
    quote_request_id: string;
    edited: boolean;
    similarity: string;
    photo_count: number;
    surface: "app" | "mobile_web" | "pc";
  };
  /** 판매자 앱에서 "어려워요"로 답함 */
  success_quote_decline: {
    quote_request_id: string;
    reason: string;
    surface: "app" | "mobile_web" | "pc";
  };
}

export function trackSellerEvent<T extends keyof SellerAnalyticsEventMap>(
  event: T,
  properties: SellerAnalyticsEventMap[T],
): void {
  withPostHog((posthog) => posthog.capture(event, properties));
}
