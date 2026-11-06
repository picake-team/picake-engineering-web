import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { connectNotificationSocket } from "@/apps/web-seller/features/notification/services/notification-socket.service";
import type {
  SellerNotificationItem,
  SellerNotificationSettings,
} from "@/apps/web-seller/features/notification/types/notification.dto";
import { DEFAULT_SELLER_NOTIFICATION_SETTINGS } from "@/apps/web-seller/features/notification/types/notification.dto";
import { notificationQueryKeys } from "@/apps/web-seller/features/notification/constants/notificationQueryKeys.constant";
import {
  useNotificationList,
  useNotificationPreferences,
  useNotificationUnreadCount,
} from "@/apps/web-seller/features/notification/hooks/queries/useNotificationQuery";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUpdateNotificationPreferences,
} from "@/apps/web-seller/features/notification/hooks/mutations/useNotificationMutation";
import { playNotificationChime } from "@/apps/web-seller/features/notification/utils/play-notification-sound.util";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { orderQueryKeys } from "@/apps/web-seller/features/order/constants/orderQueryKeys.constant";
import { wasOrderChangedHere } from "@/apps/web-seller/features/order/utils/recent-order-change.util";

/**
 * 스토어 컨텍스트 안에서 알림 목록·설정·미읽음 수를 React Query로 묶고,
 * Socket.IO로 실시간 갱신 시 토스트/알림음을 띄웁니다.
 *
 * 데이터 패칭은 `hooks/queries`·`hooks/mutations`에 두고, 이 파일은 컨텍스트 조립과 소켓 부작용만 담당합니다.
 */
interface SellerNotificationContextValue {
  storeId: string;
  /** 현재 스토어 알림 목록 (목록 쿼리 캐시 기준) */
  items: SellerNotificationItem[];
  /** 서버 preferences + 로컬 기본값 */
  settings: SellerNotificationSettings;
  /** 미읽음 개수 쿼리 값, 없으면 목록에서 계산 */
  unreadCount: number;
  isListLoading: boolean;
  /** 설정 저장은 내부에서 mutation 호출 */
  setSettings: (next: SellerNotificationSettings) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const SellerNotificationContext = createContext<SellerNotificationContextValue | null>(null);

export const SellerNotificationProvider: React.FC<{
  storeId: string;
  children: React.ReactNode;
}> = ({ storeId, children }) => {
  const queryClient = useQueryClient();

  // --- React Query: 목록 / 미읽음 수 / 설정 (키는 notificationQueryKeys와 동일) ---
  const listQuery = useNotificationList(storeId);
  const unreadQuery = useNotificationUnreadCount(storeId);
  const prefsQuery = useNotificationPreferences(storeId);

  const settings: SellerNotificationSettings =
    prefsQuery.data ?? DEFAULT_SELLER_NOTIFICATION_SETTINGS;

  // --- 읽음·설정 변경 (invalidate는 각 mutation 훅에서 처리) ---
  const updatePrefsMutation = useUpdateNotificationPreferences(storeId);
  const markReadMutation = useMarkNotificationRead(storeId);
  const markAllReadMutation = useMarkAllNotificationsRead(storeId);

  // 소켓: 푸시마다 목록·카운트 무효화 후, 현재 스토어·설정에 맞을 때만 토스트/알림음
  useEffect(() => {
    return connectNotificationSocket({
      storeId,
      onNotification: (item) => {
        void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(storeId) });
        void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(storeId) });
        // 주문 알림이면 주문 목록·상세·홈 숫자도 새로(앱을 켜 둔 채 새 예약이 오면 바로 보이게)
        void queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
        // 소켓은 계정 단위로 붙으므로, 현재 라우트 스토어와 일치할 때만 UI 반응
        if (item.storeId !== storeId) {
          return;
        }
        // 이 화면에서 방금 바꾼 주문이면 "주문 상태가 변경되었습니다." 하나만 보이게
        if (wasOrderChangedHere(item.orderId)) {
          return;
        }
        // 캐시에 prefs가 없으면 기본값으로 동작 (설정 페이지 미방문 등)
        const prefs =
          queryClient.getQueryData<SellerNotificationSettings>(
            notificationQueryKeys.prefs(storeId),
          ) ?? DEFAULT_SELLER_NOTIFICATION_SETTINGS;
        if (!prefs.orderNotificationsEnabled) {
          return;
        }
        useAlertStore.getState().addAlert({
          severity: "info",
          title: item.title,
          message: item.body,
        });
        if (prefs.orderNotificationSoundEnabled) {
          playNotificationChime();
        }
      },
    });
  }, [queryClient, storeId]);

  const setSettings = useCallback(
    (next: SellerNotificationSettings) => {
      updatePrefsMutation.mutate({
        orderNotificationsEnabled: next.orderNotificationsEnabled,
        orderNotificationSoundEnabled: next.orderNotificationSoundEnabled,
      });
    },
    [updatePrefsMutation],
  );

  const markRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation],
  );

  const markAllRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  const items = listQuery.data?.data ?? [];
  /** 서버 unread-count 실패·미요청 시 목록으로 대략치 복구 */
  const unreadCount = unreadQuery.data ?? items.filter((n) => !n.read).length;

  const value = useMemo<SellerNotificationContextValue>(
    () => ({
      storeId,
      items,
      settings,
      unreadCount,
      isListLoading: listQuery.isLoading,
      setSettings,
      markRead,
      markAllRead,
    }),
    [
      storeId,
      items,
      settings,
      unreadCount,
      listQuery.isLoading,
      setSettings,
      markRead,
      markAllRead,
    ],
  );

  return (
    <SellerNotificationContext.Provider value={value}>
      {children}
    </SellerNotificationContext.Provider>
  );
};

/** Provider 밖(헤더 배지 등)에서도 호출 가능 — 없으면 `null` */
export function useSellerNotifications(): SellerNotificationContextValue | null {
  return useContext(SellerNotificationContext);
}

/** 알림 페이지 등 Provider 필수 구역용 */
export function useSellerNotificationsRequired(): SellerNotificationContextValue {
  const ctx = useContext(SellerNotificationContext);
  if (!ctx) {
    throw new Error(
      "useSellerNotificationsRequired는 SellerNotificationProvider 안에서만 사용하세요.",
    );
  }
  return ctx;
}

/**
 * `/stores/:storeId/...` 에서만 `SellerNotificationProvider`로 감쌉니다.
 * 스토어 밖 라우트에서는 자식만 렌더해 컨텍스트 없음(`useSellerNotifications()` → null).
 */
export function SellerNotificationScope({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const storeId = useMemo(() => {
    const m = location.pathname.match(/^\/stores\/([^/]+)/);
    return m ? m[1] : null;
  }, [location.pathname]);

  if (!storeId) {
    return <>{children}</>;
  }

  return <SellerNotificationProvider storeId={storeId}>{children}</SellerNotificationProvider>;
}
