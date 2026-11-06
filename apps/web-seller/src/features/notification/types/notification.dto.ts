/**
 * 판매자 알림 API 타입 (백엔드 seller notification DTO와 정합)
 * - 목록: NotificationListResponseDto (`ListResponseDto` 공통 래퍼)
 */
import type { ListResponseDto } from "@/apps/web-seller/common/types/api.dto";

/** 계정은 하나지만 표면(판매자 웹 / 사용자 웹)과 채널(인앱 / FCM)을 분리합니다. */
export type NotificationAppSurface = "SELLER_WEB" | "USER_WEB";

/** 추후 web-user FCM 등 확장용 */
export type NotificationDeliveryChannel = "IN_APP" | "PUSH_FCM";

/** 백엔드 `SellerNotificationItem` 응답과 동기화 (현재 주문 알림 중심). */
export interface SellerNotificationItem {
  id: string;
  createdAt: string;
  /** 수신 표면 (백엔드 연동 시 그대로 전달) */
  appSurface: NotificationAppSurface;
  title: string;
  body: string;
  read: boolean;
  storeId: string;
  orderId: string;
}

export interface SellerNotificationSettings {
  /** 주문 관련 알림 수신 (저장·푸시 등) */
  orderNotificationsEnabled: boolean;
  /** 주문 알림 도착 시 알림음 */
  orderNotificationSoundEnabled: boolean;
  /**
   * 아침 요약 휴대폰 알림(판매자 앱 I-48, backend #32). 서버가 아직 주지 않으면 undefined라
   * 휴대폰 화면 알림 설정에서 그 줄을 숨긴다.
   */
  morningSummaryEnabled?: boolean;
}

export const DEFAULT_SELLER_NOTIFICATION_SETTINGS: SellerNotificationSettings = {
  orderNotificationsEnabled: true,
  orderNotificationSoundEnabled: true,
};

export type NotificationListResponseDto = ListResponseDto<SellerNotificationItem>;
