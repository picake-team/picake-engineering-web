import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/apps/web-user/common/store/auth.store";
import type { AlarmNotificationItem } from "@/apps/web-user/features/alarm/types/alarm.type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_DOMAIN;

function isAlarmSocketDisabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ALARM_SOCKET === "false" ||
    process.env.NEXT_PUBLIC_USER_ORDER_NOTIFICATION_SOCKET === "false"
  );
}

/**
 * 알림 Socket.IO (`/notifications` 네임스페이스, 이벤트 `user_order_notification`).
 * `NEXT_PUBLIC_ALARM_SOCKET=false` 로 끌 수 있습니다. (구명칭 `NEXT_PUBLIC_USER_ORDER_NOTIFICATION_SOCKET`도 동일 동작)
 */
export function connectAlarmSocket(params: {
  onNotification: (item: AlarmNotificationItem) => void;
  /** 채팅 새 글 신호(기획 I-11, 내용 없음) */
  onChatUpdated?: (payload: { threadId: string; storeId: string | null }) => void;
  /** 붙음·끊김(채팅은 끊기면 3초마다 확인) */
  onConnectionChange?: (connected: boolean) => void;
}): () => void {
  if (isAlarmSocketDisabled() || !API_BASE_URL) {
    return () => undefined;
  }

  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return () => undefined;
  }

  let socket: Socket | null = null;

  socket = io(`${API_BASE_URL}/notifications`, {
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    // 토큰은 auth로만 — 주소(query)에 실으면 서버 접속 기록에 출입증이 남는다(서버는 auth를 먼저 읽음, 11-16 검토).
    // 다시 붙을 때마다 지금 토큰을 읽는다
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken ?? token }),
    autoConnect: true,
    reconnection: true,
    // 배포로 서버가 잠깐 꺼져도 계속 다시 붙는다(5번에서 포기하면 새로고침 전까지 실시간 알림이 끊겼다)
    reconnectionAttempts: Infinity,
    timeout: 30000,
  });

  const handler = (raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    const item = raw as AlarmNotificationItem;
    if (item.appSurface !== "USER_WEB") return;
    params.onNotification(item);
  };

  socket.on("user_order_notification", handler);

  const chatHandler = (raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    const { threadId, storeId } = raw as { threadId?: unknown; storeId?: unknown };
    if (typeof threadId !== "string") return;
    params.onChatUpdated?.({ threadId, storeId: typeof storeId === "string" ? storeId : null });
  };
  const onConnect = () => params.onConnectionChange?.(true);
  const onDisconnect = () => params.onConnectionChange?.(false);
  socket.on("chat_updated", chatHandler);
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("connect_error", onDisconnect);

  return () => {
    socket?.off("chat_updated", chatHandler);
    socket?.off("connect", onConnect);
    socket?.off("disconnect", onDisconnect);
    socket?.off("connect_error", onDisconnect);
    params.onConnectionChange?.(false);
    socket?.off("user_order_notification", handler);
    socket?.disconnect();
    socket = null;
  };
}
