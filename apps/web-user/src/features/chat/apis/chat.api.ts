import { consumerClient } from "@/apps/web-user/common/config/axios.config";
import type {
  ChatExistingThread,
  ChatMessages,
  ChatReportReason,
  ChatSendBody,
  ChatSendResult,
  ChatStatus,
  ChatThreadDetail,
  ChatThreadList,
  ChatUnread,
} from "@/apps/web-user/features/chat/types/chat.type";

/** 손님 채팅 API(기획 I-11) */
export const chatApi = {
  status: async (): Promise<ChatStatus> => {
    const response = await consumerClient.get("/chat-status");
    return response.data.data;
  },
  unread: async (): Promise<ChatUnread> => {
    const response = await consumerClient.get("/chats/unread");
    return response.data.data;
  },
  list: async (cursor?: string): Promise<ChatThreadList> => {
    const response = await consumerClient.get("/chats", { params: cursor ? { cursor } : {} });
    return response.data.data;
  },
  byStore: async (storeId: string): Promise<ChatExistingThread> => {
    const response = await consumerClient.get(`/chats/stores/${storeId}`);
    return response.data.data;
  },
  thread: async (threadId: string): Promise<ChatThreadDetail> => {
    const response = await consumerClient.get(`/chats/${threadId}`);
    return response.data.data;
  },
  messages: async (
    threadId: string,
    params: { after?: string; before?: string; markRead?: boolean },
  ): Promise<ChatMessages> => {
    const response = await consumerClient.get(`/chats/${threadId}/messages`, { params });
    return response.data.data;
  },
  start: async (
    body: ChatSendBody & { storeId: string; orderId?: string; productId?: string },
  ): Promise<ChatSendResult> => {
    const response = await consumerClient.post("/chats", body);
    return response.data.data;
  },
  send: async (threadId: string, body: ChatSendBody): Promise<ChatSendResult> => {
    const response = await consumerClient.post(`/chats/${threadId}/messages`, body);
    return response.data.data;
  },
  agreeRules: async (version: number) => {
    const response = await consumerClient.post("/chats/rules/agree", { version });
    return response.data.data;
  },
  setFlag: async (
    threadId: string,
    flag: "mute" | "block",
    value: boolean,
  ): Promise<ChatThreadDetail> => {
    const response = await consumerClient.post(`/chats/${threadId}/${flag}`, { value });
    return response.data.data;
  },
  report: async (
    threadId: string,
    body: { reason: ChatReportReason; detail?: string; messageId?: string },
  ): Promise<{ reportId: string; message: string }> => {
    const response = await consumerClient.post(`/chats/${threadId}/reports`, body);
    return response.data.data;
  },
};
