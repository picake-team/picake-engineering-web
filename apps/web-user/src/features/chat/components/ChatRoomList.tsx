"use client";

import React from "react";
import Link from "next/link";
import { ChatRoom } from "@/apps/web-user/features/chat/types/chat.type";
import { formatRelativeTime } from "@/apps/web-user/common/utils/date.util";
import { EmptyState } from "@/apps/web-user/common/components/fallbacks/EmptyState";

interface ChatRoomListProps {
  chatRooms: ChatRoom[];
}

export const ChatRoomList: React.FC<ChatRoomListProps> = ({ chatRooms }) => {
  if (chatRooms.length === 0) {
    return <EmptyState message="채팅방이 없어요." fill />;
  }

  return (
    <div className="space-y-2">
      {chatRooms.map((room) => (
        <Link
          key={room.id}
          href={`/chat/${room.id}`}
          className="flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
        >
          {/* 스토어 로고 이미지 */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            {room.store.logoImageUrl ? (
              <img
                src={room.store.logoImageUrl}
                alt={room.store.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-lg font-semibold text-muted-foreground">
                {room.store.name[0]}
              </div>
            )}
          </div>

          {/* 채팅방 정보 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-semibold">{room.store.name}</h3>
              {room.lastMessageAt && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(room.lastMessageAt)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm text-muted-foreground">
                {room.lastMessage || "메시지가 없어요."}
              </p>
              {room.userUnread > 0 && (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {room.userUnread}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
