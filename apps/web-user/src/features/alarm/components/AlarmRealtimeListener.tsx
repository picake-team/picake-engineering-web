"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore, useAuthHasHydrated } from "@/apps/web-user/common/store/auth.store";
import { connectAlarmSocket } from "@/apps/web-user/features/alarm/services/alarm-socket.service";
import { alarmQueryKeys } from "@/apps/web-user/features/alarm/constants/alarmQueryKeys.constant";
import { chatQueryKeys } from "@/apps/web-user/features/chat/constants/chat.constant";
import { useChatSignalStore } from "@/apps/web-user/features/chat/store/chat-signal.store";

/**
 * 로그인 시 주문 알림 소켓을 붙이고, 수신 시 목록·미읽음 쿼리만 갱신합니다.
 * 채팅 새 글 신호(chat_updated)도 같은 소켓으로 받아 채팅 목록·안 읽음을 다시 가져오고 열린 방에 알린다(기획 I-11).
 */
export function AlarmRealtimeListener() {
  const queryClient = useQueryClient();
  const hasHydrated = useAuthHasHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!hasHydrated || !accessToken || !isAuthenticated) {
      return;
    }

    return connectAlarmSocket({
      onNotification: () => {
        void queryClient.invalidateQueries({ queryKey: alarmQueryKeys.list() });
        void queryClient.invalidateQueries({ queryKey: alarmQueryKeys.unread() });
        // useAlertStore.getState().showAlert({
        //   type: "info",
        //   title: item.title,
        //   message: item.body,
        // });
      },
      onChatUpdated: ({ threadId }) => {
        useChatSignalStore.getState().signal(threadId);
        void queryClient.invalidateQueries({ queryKey: chatQueryKeys.unread() });
        void queryClient.invalidateQueries({ queryKey: chatQueryKeys.list() });
      },
      onConnectionChange: (connected) => {
        useChatSignalStore.getState().setSocketConnected(connected);
      },
    });
  }, [hasHydrated, accessToken, isAuthenticated, queryClient]);

  return null;
}
