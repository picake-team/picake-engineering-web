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
    auth: { token },
    query: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
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
