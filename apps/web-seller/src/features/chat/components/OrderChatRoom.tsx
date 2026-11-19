/**
 * 주문에서 연 채팅방(기획 I-11): 주문 상세 "채팅". 휴대폰과 PC 채팅(기획 I-54)이 같이 쓴다.
 */
import { useQuery } from "@tanstack/react-query";
import { LoadErrorState, SkeletonCards } from "@/apps/web-seller/common/ui/Surface";
import { chatApi } from "@/apps/web-seller/features/chat/apis/chat.api";
import { chatQueryKeys } from "@/apps/web-seller/features/chat/constants/chat.constants";
import { SellerChatRoom } from "@/apps/web-seller/features/chat/components/SellerChatRoom";

/** 주문 상세 "채팅": 이 손님과 방이 있으면 그 방, 없으면 첫 글을 보낼 때 주문 카드와 함께 생긴다 */
export function OrderChatRoom({ storeId, orderId }: { storeId: string; orderId: string }) {
  const q = useQuery({
    queryKey: chatQueryKeys.byOrder(storeId, orderId),
    queryFn: () => chatApi.byOrder(storeId, orderId),
    retry: false,
  });
  if (q.isLoading) {
    return (
      <div className="mx-auto w-full max-w-column px-5 py-6">
        <SkeletonCards count={3} thumb={false} />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="mx-auto flex min-h-[50dvh] w-full max-w-column flex-col px-5">
        <LoadErrorState big onRetry={() => void q.refetch()} />
      </div>
    );
  }
  return (
    <SellerChatRoom
      storeId={storeId}
      threadId={q.data.threadId}
      fromOrderId={orderId}
      initialTitle={q.data.title}
      initialWrite={q.data.write}
      initialRulesAgreed={q.data.rulesAgreed}
    />
  );
}
