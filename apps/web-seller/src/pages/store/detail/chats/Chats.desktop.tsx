/**
 * PC 채팅(기획 I-54, 시안 D): 왼쪽 채팅 목록 | 오른쪽 대화. `/chats`, `/chats/:threadId`, `/chats/order/:orderId`가 같은 화면.
 * 목록 몸통과 대화는 휴대폰 채팅과 같은 부품(ChatListBody·SellerChatRoom)이라 견적 요청서 카드·견적 보내기·신고·차단·
 * 사진 붙여 넣기·끌어다 놓기·Enter로 보내기가 그대로다.
 * 840보다 좁으면 한 칸: 목록에서 방을 누르면 대화만(뒤로 = 목록).
 */
import React from "react";
import { useParams } from "react-router-dom";
import { PcPage, PcSplit } from "@/apps/web-seller/common/ui/PcPage";
import { PaneContext } from "@/apps/web-seller/common/ui/shell";
import { EmptyState } from "@/apps/web-seller/common/ui/Surface";
import { useMinWidth } from "@/apps/web-seller/common/hooks/useShowMobileScreens";
import { TWO_PANE_MIN_WIDTH_PX } from "@/apps/web-seller/common/constants/screen.constant";
import { SellerChatRoom } from "@/apps/web-seller/features/chat/components/SellerChatRoom";
import { ChatListBody } from "@/apps/web-seller/features/chat/components/ChatListBody";
import { OrderChatRoom } from "@/apps/web-seller/features/chat/components/OrderChatRoom";

function Room({
  storeId,
  threadId,
  orderId,
}: {
  storeId: string;
  threadId?: string;
  orderId?: string;
}) {
  if (orderId)
    return <OrderChatRoom key={`order-${orderId}`} storeId={storeId} orderId={orderId} />;
  if (threadId) return <SellerChatRoom key={threadId} storeId={storeId} threadId={threadId} />;
  return null;
}

export const StoreDetailChatsDesktopPage: React.FC = () => {
  const {
    storeId = "",
    threadId,
    orderId,
  } = useParams<{
    storeId: string;
    threadId?: string;
    orderId?: string;
  }>();
  const twoPane = useMinWidth(TWO_PANE_MIN_WIDTH_PX);
  const open = Boolean(threadId || orderId);

  // 768~839(한 칸): 방을 열면 대화만(SellerChatRoom이 PC 틀 높이에 맞춘다)
  if (!twoPane && open) {
    return <Room storeId={storeId} threadId={threadId} orderId={orderId} />;
  }

  const list = (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pt-4">
      <ChatListBody storeId={storeId} selectedId={threadId ?? null} />
    </div>
  );

  return (
    <PcPage title="채팅" fill>
      {twoPane ? (
        <PcSplit
          wide="detail"
          list={list}
          detail={
            open ? (
              <PaneContext.Provider value={{ besideList: true }}>
                <Room storeId={storeId} threadId={threadId} orderId={orderId} />
              </PaneContext.Provider>
            ) : null
          }
          empty={
            <div className="flex flex-1 flex-col px-6">
              <EmptyState big icon="chat" title="채팅을 고르면 여기에 보여요" />
            </div>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-ink-100">
          {list}
        </div>
      )}
    </PcPage>
  );
};
