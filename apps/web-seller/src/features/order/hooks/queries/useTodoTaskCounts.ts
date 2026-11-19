import { useSellerChatUnread } from "@/apps/web-seller/features/chat/hooks/useChat";
import { useOrderStatusGroup } from "@/apps/web-seller/features/order/hooks/queries/useOrderMobileQuery";
import { groupsForTab } from "@/apps/web-seller/features/order/utils/order-mobile.util";

const TODO_GROUPS = groupsForTab("todo");

/**
 * 홈 "처리할 일"과 PC 왼쪽 메뉴 "주문" 숫자(휴대폰 홈·PC 홈·PC 메뉴 공용, 기획 I-54).
 * 처리할 것 탭의 묶음마다 전체 수(주문 탭 칸과 같은 조회라 캐시를 같이 쓴다) + 견적 요청 + 답할 채팅.
 * 묶음이 늘거나 줄어도 맞게 묶음 목록(groupsForTab)을 따라간다 — 훅은 반복문에서 부를 수 없어 네 칸까지 고정으로 부르고 없는 칸은 끈다.
 */
export function useTodoTaskCounts(storeId: string) {
  const a = useOrderStatusGroup(storeId, TODO_GROUPS[0].status);
  const b = useOrderStatusGroup(storeId, TODO_GROUPS[1].status);
  const c = useOrderStatusGroup(
    storeId,
    TODO_GROUPS[2]?.status ?? TODO_GROUPS[0].status,
    {},
    {
      enabled: Boolean(TODO_GROUPS[2]),
    },
  );
  const d = useOrderStatusGroup(
    storeId,
    TODO_GROUPS[3]?.status ?? TODO_GROUPS[0].status,
    {},
    {
      enabled: Boolean(TODO_GROUPS[3]),
    },
  );
  const queries = [a, b, c, d].slice(0, TODO_GROUPS.length);
  const totals = queries.map((q) => q.total);
  const orderTotal = totals.reduce<number>((sum, t) => sum + (t ?? 0), 0);
  // 답할 채팅(기획 I-11)·견적 요청(기획 I-46): 견적 요청이 온 방은 "답할 채팅"에서 뺀다(서버가 나눠 준다)
  const chat = useSellerChatUnread(storeId);
  const quoteOpen = chat.data?.quoteRequests ?? 0;
  const chatReply = chat.data?.replyNeededChats ?? chat.data?.replyNeeded ?? 0;
  return {
    groups: TODO_GROUPS,
    totals,
    loaded: queries.every((q) => q.total !== undefined),
    orderTotal,
    quoteOpen,
    chatReply,
    total: orderTotal + quoteOpen + chatReply,
  };
}
