import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import type {
  ChatExistingThread,
  ChatMessages,
  ChatReportReason,
  ChatSendBody,
  ChatSendResult,
  ChatThreadDetail,
  ChatThreadList,
  ChatUnread,
} from "@/apps/web-seller/features/chat/types/chat.type";

const base = (storeId: string) => `/stores/${storeId}/chats`;

/** 사장님 채팅 API(기획 I-11) — 스토어마다 */
export const chatApi = {
  unread: async (storeId: string): Promise<ChatUnread> => {
    const response = await sellerClient.get(`${base(storeId)}/unread`);
    return response.data.data;
  },
  list: async (
    storeId: string,
    filter: "reply" | "all",
    cursor?: string,
  ): Promise<ChatThreadList> => {
    const response = await sellerClient.get(base(storeId), {
      params: { filter, ...(cursor ? { cursor } : {}) },
    });
    return response.data.data;
  },
  byOrder: async (storeId: string, orderId: string): Promise<ChatExistingThread> => {
    const response = await sellerClient.get(`${base(storeId)}/orders/${orderId}`);
    return response.data.data;
  },
  thread: async (storeId: string, threadId: string): Promise<ChatThreadDetail> => {
    const response = await sellerClient.get(`${base(storeId)}/${threadId}`);
    return response.data.data;
  },
  messages: async (
    storeId: string,
    threadId: string,
    params: { after?: string; before?: string; markRead?: boolean },
  ): Promise<ChatMessages> => {
    const response = await sellerClient.get(`${base(storeId)}/${threadId}/messages`, { params });
    return response.data.data;
  },
  send: async (storeId: string, threadId: string, body: ChatSendBody): Promise<ChatSendResult> => {
    const response = await sellerClient.post(`${base(storeId)}/${threadId}/messages`, body);
    return response.data.data;
  },
  startFromOrder: async (
    storeId: string,
    orderId: string,
    body: ChatSendBody,
  ): Promise<ChatSendResult> => {
    const response = await sellerClient.post(`${base(storeId)}/orders/${orderId}/messages`, body);
    return response.data.data;
  },
  agreeRules: async (storeId: string, version: number) => {
    const response = await sellerClient.post(`${base(storeId)}/rules/agree`, { version });
    return response.data.data;
  },
  setFlag: async (
    storeId: string,
    threadId: string,
    flag: "mute" | "block",
    value: boolean,
  ): Promise<ChatThreadDetail> => {
    const response = await sellerClient.post(`${base(storeId)}/${threadId}/${flag}`, { value });
    return response.data.data;
  },
  report: async (
    storeId: string,
    threadId: string,
    body: { reason: ChatReportReason; detail?: string },
  ): Promise<{ reportId: string; message: string }> => {
    const response = await sellerClient.post(`${base(storeId)}/${threadId}/reports`, body);
    return response.data.data;
  },
};
