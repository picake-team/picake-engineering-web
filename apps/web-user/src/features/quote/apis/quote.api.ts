import axios from "axios";
import { consumerClient } from "@/apps/web-user/common/config/axios.config";
import type { MessageResponse } from "@/apps/web-user/common/types/api.type";
import type {
  ChatSendBody,
  ChatSendResult,
  LinkChatMessages,
} from "@/apps/web-user/features/chat/types/chat.type";
import type {
  ChooseQuoteResponse,
  ConsumerQuoteSection,
  ReserveQuoteBody,
  Quote,
  QuoteDeclineReason,
  QuoteInputBody,
  QuoteLinkView,
  CreateQuoteRequestBody,
  CreateQuoteRequestResponse,
  QuoteAreaOption,
  QuotePlaceOption,
  QuoteRequestDetail,
  QuoteRequestListResponse,
  QuoteRequestListTab,
} from "@/apps/web-user/features/quote/types/quote.type";

export const quoteApi = {
  create: async (body: CreateQuoteRequestBody): Promise<CreateQuoteRequestResponse> => {
    const response = await consumerClient.post("/quote-requests", body);
    return response.data.data;
  },
  getList: async (tab: QuoteRequestListTab, page = 1): Promise<QuoteRequestListResponse> => {
    const response = await consumerClient.get("/quote-requests", {
      params: { tab, page, limit: 20 },
    });
    return response.data.data;
  },
  getDetail: async (id: string): Promise<QuoteRequestDetail> => {
    const response = await consumerClient.get(`/quote-requests/${id}`);
    return response.data.data;
  },
  close: async (id: string): Promise<MessageResponse> => {
    const response = await consumerClient.post(`/quote-requests/${id}/close`);
    return response.data.data;
  },
  getQuotes: async (id: string): Promise<ConsumerQuoteSection> => {
    const response = await consumerClient.get(`/quote-requests/${id}/quotes`);
    return response.data.data;
  },
  choose: async (id: string, quoteId: string): Promise<ChooseQuoteResponse> => {
    const response = await consumerClient.post(`/quote-requests/${id}/choose`, { quoteId });
    return response.data.data;
  },
  /** 고른 견적으로 예약하기(기획 I-01). 예약신청 주문 ID를 돌려준다 */
  reserve: async (id: string, body: ReserveQuoteBody): Promise<{ orderId: string }> => {
    const response = await consumerClient.post(`/quote-requests/${id}/reservation`, body);
    return response.data.data;
  },
  getUnseenCount: async (): Promise<number> => {
    const response = await consumerClient.get("/quote-requests/quotes/unseen-count");
    return response.data.data.count;
  },
};

/**
 * 견적 링크(SC-19): 입점 전 가게 사장님이 가입 없이 쓴다. 이 기기에 손님으로 로그인돼 있어도
 * 손님 토큰을 보내지 않게 따로 만든 요청(링크 열쇠가 곧 권한).
 */
const linkClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/consumer/quote-links`,
  timeout: 15000,
});

export const quoteLinkApi = {
  view: async (token: string): Promise<QuoteLinkView> => {
    const response = await linkClient.get(`/${token}`);
    return response.data.data;
  },
  submit: async (token: string, body: QuoteInputBody): Promise<Quote> => {
    const response = await linkClient.post(`/${token}/quote`, body);
    return response.data.data;
  },
  decline: async (token: string, reason: QuoteDeclineReason): Promise<void> => {
    await linkClient.post(`/${token}/decline`, { reason });
  },
  uploadPhoto: async (token: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const response = await linkClient.post(`/${token}/photos`, form);
    return response.data.data.fileUrl;
  },
  messages: async (token: string, after?: string): Promise<LinkChatMessages> => {
    const response = await linkClient.get(`/${token}/chat/messages`, {
      params: { markRead: true, ...(after ? { after } : {}) },
    });
    return response.data.data;
  },
  send: async (token: string, body: ChatSendBody): Promise<ChatSendResult> => {
    const response = await linkClient.post(`/${token}/chat/messages`, body);
    return response.data.data;
  },
};

/** 동네·가게 찾기는 카카오 로컬 검색(키는 서버에만, `app/api/kakao-local`) */
export const quoteLocalApi = {
  searchAreas: async (query: string): Promise<QuoteAreaOption[]> => {
    const response = await axios.get("/api/kakao-local", { params: { type: "area", query } });
    return response.data.items;
  },
  areaFromCoords: async (latitude: number, longitude: number): Promise<QuoteAreaOption | null> => {
    const response = await axios.get("/api/kakao-local", {
      params: { type: "coord", latitude, longitude },
    });
    return response.data.items[0] ?? null;
  },
  searchPlaces: async (
    query: string,
    near?: { latitude: number; longitude: number },
  ): Promise<QuotePlaceOption[]> => {
    const response = await axios.get("/api/kakao-local", {
      params: { type: "place", query, ...near },
    });
    return response.data.items;
  },
  /** 동네 중심에서 반경 안의 케이크 가게 수(대략) */
  countPlaces: async (
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<number | null> => {
    const response = await axios.get("/api/kakao-local", {
      params: { type: "count", latitude, longitude, radius: radiusKm * 1000 },
    });
    return response.data.count ?? null;
  },
};
