import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { notificationApi } from "@/apps/web-seller/features/notification/apis/notification.api";
import { notificationQueryKeys } from "@/apps/web-seller/features/notification/constants/notificationQueryKeys.constant";
import type { SellerNotificationSettings } from "@/apps/web-seller/features/notification/types/notification.dto";

// 스토어 알림 설정 저장. 스위치는 서버를 기다리지 않고 바로 움직이고, 실패하면 되돌리고 알린다
export function useUpdateNotificationPreferences(storeId: string) {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();
  const key = notificationQueryKeys.prefs(storeId);

  return useMutation({
    mutationFn: (patch: Partial<SellerNotificationSettings>) =>
      notificationApi.updatePreferences(storeId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SellerNotificationSettings>(key);
      if (previous) queryClient.setQueryData(key, { ...previous, ...patch });
      return { previous };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
    },
    onError: (error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

// 단일 알림 읽음 처리
export function useMarkNotificationRead(storeId: string) {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(storeId) });
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(storeId) });
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

// 스토어 알림 전체 읽음 처리
export function useMarkAllNotificationsRead(storeId: string) {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();

  return useMutation({
    mutationFn: () => notificationApi.markAllRead(storeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(storeId) });
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(storeId) });
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}
