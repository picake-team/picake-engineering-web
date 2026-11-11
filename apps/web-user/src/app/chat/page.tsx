"use client";

import { ChatListScreen } from "@/apps/web-user/features/chat/components/ChatListScreen";
import { ChatLoginGate } from "@/apps/web-user/features/chat/components/ChatLoginGate";

/** MY → 채팅 목록(기획 I-11) */
export default function ChatListPage() {
  return (
    <ChatLoginGate>
      <ChatListScreen />
    </ChatLoginGate>
  );
}
