"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/apps/web-user/common/components/icons";
import { PATHS } from "@/apps/web-user/common/constants/paths.constant";
import { navigateBack } from "@/apps/web-user/common/utils/navigate-back.util";
import { formatRelativeTime } from "@/apps/web-user/common/utils/date.util";
import { cn } from "@/apps/web-user/common/lib/utils";
import { useChatList } from "@/apps/web-user/features/chat/hooks/useChat";
import { CHAT_NO_REPLAY } from "@/apps/web-user/features/chat/constants/chat.constant";
import { ChatListSkeleton } from "@/apps/web-user/common/components/skeleton/ChatSkeleton";

/** MY → 채팅 목록(기획 I-11). 가게 사진·이름·마지막 글·안 읽음 점 */
export function ChatListScreen() {
  const router = useRouter();
  const list = useChatList();
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
      <span className="flex-1 text-center text-sm font-bold text-gray-900">채팅</span>
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

  return (
    <div>
      {header}
      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-[8px] px-[20px] py-[80px] text-center">
          <span className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <Icon name="chat" width={26} height={26} />
          </span>
          <p className="mt-[8px] text-base font-bold text-gray-900">아직 채팅이 없어요</p>
          <p className="text-sm text-gray-500">가게 화면이나 주문에서 사장님께 물어볼 수 있어요</p>
        </div>
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
                  <span className="h-[44px] w-[44px] shrink-0 rounded-full bg-gray-50" />
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
                  ) : (
                    <span className="h-[8px]" />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {list.hasNextPage && (
        <button
          type="button"
          onClick={() => void list.fetchNextPage()}
          className="w-full py-[16px] text-sm text-gray-500"
        >
          더 보기
        </button>
      )}
    </div>
  );
}
