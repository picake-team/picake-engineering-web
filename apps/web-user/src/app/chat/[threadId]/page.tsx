"use client";

import { useParams } from "next/navigation";
import { ChatRoomScreen } from "@/apps/web-user/features/chat/components/ChatRoomScreen";
import { ChatLoginGate } from "@/apps/web-user/features/chat/components/ChatLoginGate";

/** 채팅방(기획 I-11). 휴대폰 알림 data.path가 이 주소다 */
export default function ChatRoomPage() {
  const { threadId } = useParams<{ threadId: string }>();
  return (
    <ChatLoginGate>
      <ChatRoomScreen key={threadId} threadId={threadId} />
    </ChatLoginGate>
  );
}
