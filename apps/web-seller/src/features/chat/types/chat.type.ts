/** 채팅(기획 I-11) — 서버 modules/chat/dto/chat.dto.ts와 같은 모양(손님 웹 features/chat/types와 같음) */

export type ChatSender = "CONSUMER" | "SHOP" | "SYSTEM";
export type ChatMessageKind = "TEXT" | "IMAGE" | "ORDER" | "PRODUCT";

export interface ChatCard {
  type: "ORDER" | "PRODUCT";
  refId: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  orderStatus?: string | null;
  available?: boolean;
}

export interface ChatMessage {
  id: string;
  clientId: string;
  sender: ChatSender;
  mine: boolean;
  kind: ChatMessageKind;
  text: string | null;
  imageUrls: string[];
  card?: ChatCard | null;
  hidden: boolean;
  createdAt: string;
}

export interface ChatWriteState {
  ok: boolean;
  message?: string | null;
}

export interface ChatThread {
  id: string;
  storeId: string | null;
  title: string;
  imageUrl?: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: boolean;
  needsReply: boolean;
  muted: boolean;
  blockedByMe: boolean;
}

export interface ChatThreadDetail extends ChatThread {
  write: ChatWriteState;
  otherReadAt: string | null;
  rulesAgreed: boolean;
  rulesVersion: number;
  unenteredShop: boolean;
}

export interface ChatThreadList {
  threads: ChatThread[];
  nextCursor: string | null;
}

export interface ChatMessages {
  messages: ChatMessage[];
  hasMore: boolean;
  thread: ChatThreadDetail;
}

export interface ChatSendResult {
  threadId: string;
  messages: ChatMessage[];
}

export interface ChatStatus {
  open: boolean;
  rulesVersion: number;
}

export interface ChatUnread {
  open: boolean;
  unreadThreads: number;
  /** 답할 방 수(마지막 글이 손님 것) */
  replyNeeded?: number;
}

export interface ChatExistingThread {
  threadId: string | null;
  title: string;
  write: ChatWriteState;
  rulesAgreed: boolean;
  rulesVersion: number;
}

export type ChatReportReason = "ABUSE" | "SEXUAL" | "SPAM" | "FRAUD" | "OTHER";

export interface ChatSendBody {
  clientId: string;
  text?: string;
  imageUrls?: string[];
}

/** 화면에서 보내는 중·실패한 글(서버가 받기 전) */
export interface PendingChatMessage {
  clientId: string;
  text: string;
  /** 줄여 둔 사진(data URL) */
  photos: string[];
  status: "sending" | "failed";
  createdAt: string;
}
