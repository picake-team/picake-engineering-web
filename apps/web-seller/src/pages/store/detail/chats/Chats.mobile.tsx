/**
 * 사장님 채팅(기획 I-11) — 아래 탭 4번째 "채팅" 목록, 방, 주문 상세에서 먼저 열기.
 * PC에서도 같은 휴대폰 화면을 가운데(640) 띄운다(PC 채팅 화면은 따로 만들지 않음).
 */
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { AppScreen, TabHeader } from "@/apps/web-seller/common/ui/Screen";
import { SegmentedTabs } from "@/apps/web-seller/common/ui/Choice";
import { EmptyState, LoadErrorState, SkeletonCards } from "@/apps/web-seller/common/ui/Surface";
import { Button } from "@/apps/web-seller/common/ui/Button";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { formatRelativeTime } from "@/apps/web-seller/common/utils/date.util";
import { chatApi } from "@/apps/web-seller/features/chat/apis/chat.api";
import {
  chatQueryKeys,
  CHAT_NO_REPLAY,
} from "@/apps/web-seller/features/chat/constants/chat.constants";
import {
  useSellerChatList,
  useSellerChatUnread,
} from "@/apps/web-seller/features/chat/hooks/useChat";
import { SellerChatRoom } from "@/apps/web-seller/features/chat/components/SellerChatRoom";

function ChatsScreen({ pc }: { pc: boolean }) {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const [filter, setFilter] = useState<"reply" | "all">("reply");
  const unread = useSellerChatUnread(storeId);
  const list = useSellerChatList(storeId, filter);
  const threads = list.data?.pages.flatMap((p) => p.threads) ?? [];
  const replyNeeded = unread.data?.replyNeeded ?? 0;

  return (
    <AppScreen
      // PC는 왼쪽 메뉴가 있어 아래 탭을 그리지 않는다
      tab={pc ? undefined : "chat"}
      storeId={storeId}
      // PC는 위쪽 줄이 고정돼 있어 제목을 붙이지 않고 본문 첫 줄로
      header={pc ? undefined : <TabHeader title="채팅" />}
      bodyClassName="gap-2 px-0"
    >
      {pc ? <TabHeader title="채팅" /> : null}
      <>
        <div className="px-5">
          <SegmentedTabs
            label="채팅 묶음"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "reply", label: "답할 것", count: replyNeeded, countAccent: true },
              { value: "all", label: "전체" },
            ]}
          />
        </div>
        {list.isError ? (
          // 빈·실패 화면은 남은 높이를 채워 세로 가운데에(주문 탭과 같게)
          <div className="flex flex-1 flex-col px-5">
            <LoadErrorState big onRetry={() => void list.refetch()} />
          </div>
        ) : list.isLoading ? (
          <div className="px-5">
            <SkeletonCards count={4} />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-1 flex-col px-5">
            <EmptyState
              big
              icon="chat"
              title={filter === "reply" ? "답할 채팅이 없어요" : "아직 채팅이 없어요"}
              description={
                filter === "reply" ? '답한 채팅은 "전체"에 있어요' : "손님이 문의하면 여기에 모여요"
              }
            />
          </div>
        ) : (
          <ul className="flex flex-col">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  to={ROUTES.STORE_DETAIL_CHAT_ROOM(storeId, t.id)}
                  className="flex min-h-[72px] items-center gap-3 border-b border-ink-100 px-5 py-3 active:bg-ink-50"
                >
                  {/* 손님 사진은 사장님 화면에 주지 않아 사람 그림으로(빈 동그라미는 불러오는 중처럼 보임) */}
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-400"
                    aria-hidden="true"
                  >
                    <Icon name="person" size={22} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-body font-bold text-ink-900">{t.title}</span>
                    <span className={cx(CHAT_NO_REPLAY, "truncate text-sub text-ink-600")}>
                      {t.lastMessagePreview ?? ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-caption text-ink-400">
                      {t.lastMessageAt ? formatRelativeTime(new Date(t.lastMessageAt)) : ""}
                    </span>
                    {t.blockedByMe ? (
                      <span className="text-caption text-ink-400">차단함</span>
                    ) : t.unread ? (
                      <span className="size-2 rounded-full bg-brand" aria-label="안 읽음" />
                    ) : (
                      <span className="h-2" />
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {list.hasNextPage ? (
          <div className="px-5">
            <Button variant="secondary" size="md" onClick={() => void list.fetchNextPage()}>
              더 보기
            </Button>
          </div>
        ) : null}
      </>
    </AppScreen>
  );
}

export const StoreDetailChatsMobilePage: React.FC = () => <ChatsScreen pc={false} />;
export const StoreDetailChatsPage: React.FC = () => <ChatsScreen pc />;

function RoomScreen({ pc }: { pc: boolean }) {
  const { storeId = "", threadId = "" } = useParams<{ storeId: string; threadId: string }>();
  return <SellerChatRoom key={threadId} storeId={storeId} threadId={threadId} pc={pc} />;
}
export const StoreDetailChatRoomMobilePage: React.FC = () => <RoomScreen pc={false} />;
export const StoreDetailChatRoomPage: React.FC = () => <RoomScreen pc />;

/** 주문 상세 "채팅": 이 손님과 방이 있으면 그 방, 없으면 첫 글을 보낼 때 주문 카드와 함께 생긴다 */
function OrderChatScreen({ pc }: { pc: boolean }) {
  const { storeId = "", orderId = "" } = useParams<{ storeId: string; orderId: string }>();
  const q = useQuery({
    queryKey: chatQueryKeys.byOrder(storeId, orderId),
    queryFn: () => chatApi.byOrder(storeId, orderId),
    retry: false,
  });
  if (q.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-5 py-6">
        <SkeletonCards count={3} thumb={false} />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-5">
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
      pc={pc}
    />
  );
}
export const StoreDetailChatOrderMobilePage: React.FC = () => <OrderChatScreen pc={false} />;
export const StoreDetailChatOrderPage: React.FC = () => <OrderChatScreen pc />;
