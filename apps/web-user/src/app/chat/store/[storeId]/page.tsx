"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { chatApi } from "@/apps/web-user/features/chat/apis/chat.api";
import { chatQueryKeys } from "@/apps/web-user/features/chat/constants/chat.constant";
import { ChatRoomScreen } from "@/apps/web-user/features/chat/components/ChatRoomScreen";
import { ChatLoginGate } from "@/apps/web-user/features/chat/components/ChatLoginGate";

/**
 * 이 가게에 채팅하기(기획 I-11). 방이 있으면 그 방, 없으면 빈 방에서 첫 글을 보낼 때 생긴다.
 * 주문·상품에서 열었으면(orderId·productId) 첫 글 앞에 그 카드가 한 번 붙는다.
 */
function ChatStoreEntry() {
  const router = useRouter();
  const { storeId } = useParams<{ storeId: string }>();
  const search = useSearchParams();
  const orderId = search.get("orderId") ?? undefined;
  const productId = search.get("productId") ?? undefined;
  const { data, isLoading, error } = useQuery({
    queryKey: chatQueryKeys.byStore(storeId),
    queryFn: () => chatApi.byStore(storeId),
    retry: false,
  });
  const hasRef = !!orderId || !!productId;

  // 이미 방이 있고 붙일 카드가 없으면 그 방 주소로(뒤로 가기가 자연스럽게)
  useEffect(() => {
    if (data?.threadId && !hasRef) router.replace(PATHS.CHAT.ROOM(data.threadId));
  }, [data?.threadId, hasRef, router]);

  if (isLoading || (data?.threadId && !hasRef)) {
    return <p className="py-[60px] text-center text-sm text-gray-400">불러오는 중…</p>;
  }
  if (error || !data) {
    return (
      <p className="py-[60px] text-center text-sm text-gray-500">{getApiMessage.error(error)}</p>
    );
  }
  return (
    <ChatRoomScreen
      threadId={data.threadId}
      title={data.title}
      start={{ storeId, orderId, productId }}
      initialRulesAgreed={data.rulesAgreed}
      initialRulesVersion={data.rulesVersion}
      initialWrite={data.write}
    />
  );
}

export default function ChatStorePage() {
  return (
    <ChatLoginGate>
      <Suspense fallback={null}>
        <ChatStoreEntry />
      </Suspense>
    </ChatLoginGate>
  );
}
