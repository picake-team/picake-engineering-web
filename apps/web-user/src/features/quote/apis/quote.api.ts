import axios from "axios";
import { consumerClient } from "@/apps/web-user/common/config/axios.config";
import type { MessageResponse } from "@/apps/web-user/common/types/api.type";
import type {
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
