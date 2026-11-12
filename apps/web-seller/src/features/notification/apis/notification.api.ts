import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import type {
  NotificationListResponseDto,
  SellerNotificationSettings,
} from "@/apps/web-seller/features/notification/types/notification.dto";

function toSettings(row: SellerNotificationSettings): SellerNotificationSettings {
  return {
    orderNotificationsEnabled: row.orderNotificationsEnabled,
    orderNotificationSoundEnabled: row.orderNotificationSoundEnabled ?? true,
    ...(typeof row.morningSummaryEnabled === "boolean"
      ? { morningSummaryEnabled: row.morningSummaryEnabled }
      : {}),
    ...(typeof row.chatNotificationsEnabled === "boolean"
      ? { chatNotificationsEnabled: row.chatNotificationsEnabled }
      : {}),
    ...(typeof row.chatQuietNight === "boolean" ? { chatQuietNight: row.chatQuietNight } : {}),
  };
}

export const notificationApi = {
  // 스토어 단위 알림 목록 (페이지네이션)
  getNotifications: async (params: {
    storeId: string;
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationListResponseDto> => {
    const response = await sellerClient.get("/notifications", {
      params: {
        storeId: params.storeId,
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        unreadOnly: params.unreadOnly ? true : undefined,
      },
    });
    return response.data.data as NotificationListResponseDto;
  },

  // 미읽음 개수 (스토어별)
  getUnreadCount: async (storeId: string): Promise<number> => {
    const response = await sellerClient.get("/notifications/unread-count", {
      params: { storeId },
    });
    return response.data.data.count as number;
  },

  // 알림 설정 조회 (스토어별, 없으면 서버에서 기본 생성)
  getPreferences: async (storeId: string): Promise<SellerNotificationSettings> => {
    const response = await sellerClient.get("/notifications/preferences", {
      params: { storeId },
    });
    const row = response.data.data as SellerNotificationSettings & { appSurface?: string };
    return toSettings(row);
  },

  // 알림 설정 저장 (body에 storeId 포함)
  updatePreferences: async (
    storeId: string,
    patch: Partial<SellerNotificationSettings>,
  ): Promise<SellerNotificationSettings> => {
    const response = await sellerClient.put("/notifications/preferences", { storeId, ...patch });
    const row = response.data.data as SellerNotificationSettings & { appSurface?: string };
    return toSettings(row);
  },

  // 단일 알림 읽음
  markRead: async (notificationId: string): Promise<void> => {
    await sellerClient.patch(`/notifications/${notificationId}/read`);
  },

  // 스토어 알림 전체 읽음
  markAllRead: async (storeId: string): Promise<void> => {
    await sellerClient.patch("/notifications/read-all", { storeId });
  },
};

/** 휴대폰 알림(FCM) — backend #32 `POST /v1/seller/fcm-tokens/test` */
export const sellerPushApi = {
  /** 로그인한 내 휴대폰 모두에 테스트 알림. 보낸 기기 수(0이면 앱에서 알림을 켠 기기가 없음) */
  sendTestPush: async (): Promise<number> => {
    const response = await sellerClient.post("/fcm-tokens/test");
    return (response.data.data?.deviceCount as number) ?? 0;
  },
};
