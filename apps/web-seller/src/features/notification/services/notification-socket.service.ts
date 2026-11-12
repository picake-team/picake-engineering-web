import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/apps/web-seller/common/utils/token.util";
import type { SellerNotificationItem } from "@/apps/web-seller/features/notification/types/notification.dto";
import { NOTIFICATION_SOCKET_SURFACE } from "@/apps/web-seller/features/notification/constants/notification.constants";

const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_DOMAIN;

/** 서버 NotificationGateway ChatUpdatedSocketPayload(채팅 새 글 신호, 글 내용은 없음) */
export interface ChatUpdatedSignal {
  threadId: string;
  storeId: string | null;
  /** 손님이 보낸 글이면 손님 닉네임 */
  senderName?: string;
  /** 사장님이 이 방 알림을 껐는지 */
  muted?: boolean;
}

/**
 * 알림 WebSocket (Socket.IO namespace `/notifications`).
 * 주문 알림(`seller_notification`)과 채팅 신호(`chat_updated`, 기획 I-11)를 같이 받는다.
 */
export function connectNotificationSocket(params: {
  storeId: string;
  onNotification: (item: SellerNotificationItem) => void;
  onChatUpdated?: (signal: ChatUpdatedSignal) => void;
  onConnectionChange?: (connected: boolean) => void;
}): () => void {
  if (!API_BASE_URL) {
    return () => undefined;
  }

  const token = getAccessToken();
  if (!token) {
    return () => undefined;
  }

  let socket: Socket | null = null;

  socket = io(`${API_BASE_URL}/notifications`, {
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    auth: { token },
    query: { token, storeId: params.storeId, surface: NOTIFICATION_SOCKET_SURFACE },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 30000,
  });

  const handler = (raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    const item = raw as SellerNotificationItem;
    // 다른 표면·다른 스토어 이벤트는 무시 (서버도 필터하지만 이중 방어)
    if (item.appSurface !== NOTIFICATION_SOCKET_SURFACE) return;
    if (item.storeId !== params.storeId) return;
    params.onNotification(item);
  };

  socket.on("seller_notification", handler);

  const chatHandler = (raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    const signal = raw as ChatUpdatedSignal;
    if (typeof signal.threadId !== "string") return;
    params.onChatUpdated?.(signal);
  };
  const onConnect = () => params.onConnectionChange?.(true);
  const onDisconnect = () => params.onConnectionChange?.(false);
  socket.on("chat_updated", chatHandler);
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);

  return () => {
    socket?.off("seller_notification", handler);
    socket?.off("chat_updated", chatHandler);
    socket?.off("connect", onConnect);
    socket?.off("disconnect", onDisconnect);
    params.onConnectionChange?.(false);
    socket?.disconnect();
    socket = null;
  };
}
