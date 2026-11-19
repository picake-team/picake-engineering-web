/**
 * 홈 "처리할 일" 줄들(휴대폰 홈·PC 홈 공용, 기획 I-54): 처리할 것 묶음(예약 확인·입금 확인·픽업 처리·환불 처리) → 견적 요청 → 답할 채팅.
 * 묶음 줄은 그 주문 칸(?tab=todo&group=)으로, 견적·채팅은 채팅 목록으로 간다.
 */
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { ListRowLink, RowCount, RowIconBox } from "@/apps/web-seller/common/ui/List";
import { TaskIcon } from "@/apps/web-seller/common/ui/icons";
import type { useTodoTaskCounts } from "@/apps/web-seller/features/order/hooks/queries/useTodoTaskCounts";

export function TodoTaskRows({
  storeId,
  todo,
}: {
  storeId: string;
  todo: ReturnType<typeof useTodoTaskCounts>;
}) {
  return (
    <>
      {todo.groups.map((g, i) => {
        const count = todo.totals[i];
        const zero = !count;
        return (
          <ListRowLink
            key={g.key}
            to={`${ROUTES.STORE_DETAIL_ORDERS_LIST(storeId)}?tab=todo&group=${g.key}`}
            tall
            dimmed={zero}
            leading={
              <RowIconBox>{g.icon ? <TaskIcon name={g.icon} active={!zero} /> : null}</RowIconBox>
            }
            title={g.label}
            description={g.homeHint}
            trailing={<RowCount value={count ?? "–"} dimmed={zero} />}
          />
        );
      })}
      <ListRowLink
        to={ROUTES.STORE_DETAIL_CHATS(storeId)}
        tall
        dimmed={todo.quoteOpen === 0}
        leading={
          <RowIconBox>
            <TaskIcon name="quote" active={todo.quoteOpen > 0} />
          </RowIconBox>
        }
        title="견적 요청"
        description="마감 전에 견적을 보내 주세요"
        trailing={<RowCount value={todo.quoteOpen} dimmed={todo.quoteOpen === 0} />}
      />
      <ListRowLink
        to={ROUTES.STORE_DETAIL_CHATS(storeId)}
        tall
        divider={false}
        dimmed={todo.chatReply === 0}
        leading={
          <RowIconBox>
            <TaskIcon name="chat" active={todo.chatReply > 0} />
          </RowIconBox>
        }
        title="답할 채팅"
        description="손님이 답을 기다려요"
        trailing={<RowCount value={todo.chatReply} dimmed={todo.chatReply === 0} />}
      />
    </>
  );
}
