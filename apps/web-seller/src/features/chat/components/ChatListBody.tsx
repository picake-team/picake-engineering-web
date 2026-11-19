/**
 * 채팅 목록 몸통(기획 I-11): 답할 것·전체 + 방 줄. 휴대폰 채팅 탭과 PC 채팅(목록 | 대화, 기획 I-54)이 같이 쓴다.
 */
import { StatusPill } from "@/apps/web-seller/common/ui/Badge";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { SegmentedTabs } from "@/apps/web-seller/common/ui/Choice";
import { EmptyState, LoadErrorState, SkeletonCards } from "@/apps/web-seller/common/ui/Surface";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { LoadMoreSentinel } from "@/apps/web-seller/common/ui/LoadMoreSentinel";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { formatRelativeTime } from "@/apps/web-seller/common/utils/date.util";
import { CHAT_NO_REPLAY } from "@/apps/web-seller/features/chat/constants/chat.constants";
import {
  useSellerChatList,
  useSellerChatUnread,
} from "@/apps/web-seller/features/chat/hooks/useChat";

/** 채팅 목록(답할 것·전체 + 방 줄). selectedId면 그 방 줄을 회색 바탕으로(PC 목록 | 대화) */
export function ChatListBody({
  storeId,
  selectedId,
}: {
  storeId: string;
  selectedId?: string | null;
}) {
  const [filter, setFilter] = useState<"reply" | "all">("reply");
  const unread = useSellerChatUnread(storeId);
  const list = useSellerChatList(storeId, filter);
  const threads = list.data?.pages.flatMap((p) => p.threads) ?? [];
  const replyNeeded = unread.data?.replyNeeded ?? 0;
  return (
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
          {threads.map((t) => {
            const selected = selectedId === t.id;
            return (
              <li key={t.id}>
                <Link
                  to={ROUTES.STORE_DETAIL_CHAT_ROOM(storeId, t.id)}
                  aria-current={selected ? "true" : undefined}
                  className={cx(
                    "flex min-h-[72px] items-center gap-3 border-b border-ink-100 px-5 py-3 active:bg-ink-50",
                    selected ? "bg-ink-50" : "hover:bg-ink-50/60",
                  )}
                >
                  {/* 손님 사진은 사장님 화면에 주지 않아 사람 그림으로(빈 동그라미는 불러오는 중처럼 보임) */}
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-400"
                    aria-hidden="true"
                  >
                    <Icon name="person" size={22} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {t.quoteRequest ? <StatusPill tone="turn">견적 요청</StatusPill> : null}
                      <span className="truncate text-body font-bold text-ink-900">{t.title}</span>
                    </span>
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
                    ) : t.muted ? (
                      // 알림을 끈 방은 표시해 둔다(끈 줄 모르고 놓치지 않게)
                      <span className="text-caption text-ink-400">알림 끔</span>
                    ) : (
                      <span className="h-2" />
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {/* 주문·상품 목록처럼 내리면 저절로 더 불러온다("더 보기" 버튼 없이) */}
      <LoadMoreSentinel
        hasNext={Boolean(list.hasNextPage)}
        loading={list.isFetchingNextPage}
        onLoad={() => void list.fetchNextPage()}
      />
    </>
  );
}
