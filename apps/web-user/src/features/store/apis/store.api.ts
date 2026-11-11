import { consumerClient } from "@/apps/web-user/common/config/axios.config";
import {
  StoreInfo,
  StoreListResponse,
  type StoreListParams,
} from "@/apps/web-user/features/store/types/store.type";
import { StoreRegionsResponse } from "@/apps/web-user/features/store/types/region.type";
import type {
  CreateStoreEntryRequest,
  StoreEntryRequestExistsResponse,
} from "@/apps/web-user/features/store/types/store-entry-request.type";
import { MessageResponse } from "@/apps/web-user/common/types/api.type";

export const storeApi = {
  // 스토어 목록 조회
  getList: async (params: StoreListParams): Promise<StoreListResponse> => {
    const response = await consumerClient.get("/store", { params });
    return response.data.data;
  },
  // 스토어 상세 조회
  getDetail: async (storeId: string): Promise<StoreInfo> => {
    const response = await consumerClient.get(`/store/${storeId}`);
    return response.data.data;
  },
  // 사장님이 보낸 링크로 들어온 방문 남기기(기획 I-45). 기기 임의 값만 보낸다
  recordLinkVisit: async (storeId: string, visitorKey: string): Promise<void> => {
    await consumerClient.post(`/store/${storeId}/link-visits`, { visitorKey });
  },
  // 서비스 가능 지역 조회
  getRegions: async (): Promise<StoreRegionsResponse> => {
    const response = await consumerClient.get("/store/regions");
    return response.data.data;
  },
  // 미입점 스토어 입점 요청
  createEntryRequest: async (data: CreateStoreEntryRequest): Promise<MessageResponse> => {
    const response = await consumerClient.post("/store-entry-requests", data);
    return response.data.data;
  },
  // 미입점 스토어 입점 요청 존재 여부 조회
  getEntryRequestExists: async (kakaoPlaceId: string): Promise<StoreEntryRequestExistsResponse> => {
    const response = await consumerClient.get("/store-entry-requests/exists", {
      params: { kakaoPlaceId },
    });
    return response.data.data;
  },
};
