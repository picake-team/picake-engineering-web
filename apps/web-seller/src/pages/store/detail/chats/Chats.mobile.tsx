/**
 * 사장님 채팅(기획 I-11) — 아래 탭 4번째 "채팅" 목록, 방, 주문 상세에서 먼저 열기.
 * 목록 몸통(ChatListBody)과 주문에서 연 방(OrderChatRoom)은 PC 채팅(Chats.desktop, 목록 | 대화)도 같이 쓴다(기획 I-54).
 */
import React from "react";
import { useParams } from "react-router-dom";
import { AppScreen, TabHeader } from "@/apps/web-seller/common/ui/Screen";
import { SellerChatRoom } from "@/apps/web-seller/features/chat/components/SellerChatRoom";
import { ChatListBody } from "@/apps/web-seller/features/chat/components/ChatListBody";
import { OrderChatRoom } from "@/apps/web-seller/features/chat/components/OrderChatRoom";

export const StoreDetailChatsMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  return (
    <AppScreen
      tab="chat"
      storeId={storeId}
      header={<TabHeader title="채팅" />}
      bodyClassName="gap-2 px-0"
    >
      <ChatListBody storeId={storeId} />
    </AppScreen>
  );
};

export const StoreDetailChatRoomMobilePage: React.FC = () => {
  const { storeId = "", threadId = "" } = useParams<{ storeId: string; threadId: string }>();
  return <SellerChatRoom key={threadId} storeId={storeId} threadId={threadId} />;
};

export const StoreDetailChatOrderMobilePage: React.FC = () => {
  const { storeId = "", orderId = "" } = useParams<{ storeId: string; orderId: string }>();
  return <OrderChatRoom storeId={storeId} orderId={orderId} />;
};
