"use client";

import Link from "next/link";
import { useRef } from "react";
import { useInfiniteScroll } from "@/apps/web-user/common/hooks/useInfiniteScroll";
import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { navigateBack } from "@/apps/web-user/common/utils/navigate-back.util";
import { formatRelativeTime } from "@/apps/web-user/common/utils/date.util";
import { cn } from "@/apps/web-user/common/lib/utils";
import { useChatList } from "@/apps/web-user/features/chat/hooks/useChat";
import { CHAT_NO_REPLAY } from "@/apps/web-user/features/chat/constants/chat.constant";
import { ChatListSkeleton } from "@/apps/web-user/common/components/skeleton/ChatSkeleton";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";
import { LoadErrorState } from "@/apps/web-user/common/components/fallbacks/LoadErrorState";

/** MY → 채팅 목록(기획 I-11). 가게 사진·이름·마지막 글·안 읽음 점 */
export function ChatListScreen() {
  const router = useRouter();
  const list = useChatList();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useInfiniteScroll({
    hasNextPage: list.hasNextPage,
    isFetchingNextPage: list.isFetchingNextPage,
    fetchNextPage: () => void list.fetchNextPage(),
    loadMoreRef,
  });
  const threads = list.data?.pages.flatMap((p) => p.threads) ?? [];

  const header = (
    <header className="sticky top-0 z-10 flex h-[52px] items-center bg-white px-[16px]">
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigateBack(router, { fallbackPath: PATHS.MYPAGE })}
      >
        <Icon name="chevronLeft" width={24} height={24} />
      </button>
      <h1 className="flex-1 text-center text-sm font-bold text-gray-900">채팅</h1>
      <span className="w-[24px]" />
    </header>
  );

  if (list.isLoading) {
    return (
      <div>
        {header}
        <ChatListSkeleton />
      </div>
    );
  }

  // 못 불러오면 "없어요" 대신 "다시 시도"(손님 화면 공통, F-65). 빈 화면은 다른 MY 목록과 같은 부품
  if (list.isError) {
    return (
      <div>
        {header}
        <LoadErrorState fill className="px-[20px]" onRetry={() => void list.refetch()} />
      </div>
    );
  }

  return (
    <div>
      {header}
      {threads.length === 0 ? (
        <EmptyState message="아직 채팅이 없어요." fill>
          <span className="-mt-[12px] text-center text-xs text-gray-500">
            가게 화면이나 주문에서 사장님께 물어볼 수 있어요
          </span>
        </EmptyState>
      ) : (
        <ul className="flex flex-col">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={PATHS.CHAT.ROOM(t.id)}
                className="press-bg flex items-center gap-[12px] border-b border-gray-50 px-[20px] py-[14px]"
              >
                {t.imageUrl ? (
                  <img
                    src={t.imageUrl}
                    alt=""
                    className="h-[44px] w-[44px] shrink-0 rounded-full object-cover"
                  />
                ) : (
                  // 로고가 없는 가게는 가게 화면과 같은 가게 그림
                  <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                    <Icon name="noneStore" width={44} height={44} />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="truncate text-sm font-bold text-gray-900">{t.title}</span>
                  <span className={cn(CHAT_NO_REPLAY, "truncate text-xs text-gray-500")}>
                    {t.lastMessagePreview ?? ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-[6px]">
                  <span className="text-[11px] text-gray-400">
                    {t.lastMessageAt ? formatRelativeTime(new Date(t.lastMessageAt)) : ""}
                  </span>
                  {t.unread ? (
                    <span
                      className="h-[8px] w-[8px] rounded-full bg-primary"
                      aria-label="안 읽음"
                    />
                  ) : t.muted ? (
                    // 알림을 끈 방은 표시해 둔다(끈 줄 모르고 놓치지 않게)
                    <span className="text-[11px] text-gray-400">알림 끔</span>
                  ) : (
                    <span className="h-[8px]" />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {/* 저장·최근 본 목록처럼 내리면 저절로 더 불러온다("더 보기" 버튼 없이) */}
      {list.hasNextPage && <div ref={loadMoreRef} className="h-[40px]" aria-hidden="true" />}
    </div>
  );
}
