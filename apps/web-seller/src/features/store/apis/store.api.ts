import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import {
  CreateStoreRequestDto,
  CreateStoreResponseDto,
  StoreResponseDto,
  StoreBusinessCalendarDto,
  UpdateStoreBusinessCalendarResponseDto,
  UpdateStoreRequestDto,
  UpdateStoreResponseDto,
  GetSellerStoresRequestDto,
  StoreListResponseDto,
  NaverPlacePreviewResponseDto,
  StoreLinkStatsResponseDto,
} from "@/apps/web-seller/features/store/types/store.dto";

export const storeApi = {
  // 스토어 목록 조회
  getStoreList: async (params: GetSellerStoresRequestDto): Promise<StoreListResponseDto> => {
    const response = await sellerClient.get("/store/list", { params });
    return response.data.data;
  },

  // 스토어 상세 조회
  getStoreDetail: async (storeId: string): Promise<StoreResponseDto> => {
    const response = await sellerClient.get(`/store/${storeId}`);
    return response.data.data;
  },

  // 링크 효과(I-45): 최근 30일 링크로 온 손님·예약 신청 수
  getLinkStats: async (storeId: string): Promise<StoreLinkStatsResponseDto> => {
    const response = await sellerClient.get(`/store/${storeId}/link-stats`);
    return response.data.data;
  },

  // 스토어 생성
  createStore: async (request: CreateStoreRequestDto): Promise<CreateStoreResponseDto> => {
    const response = await sellerClient.post("/store/create", request);
    return response.data.data;
  },

  // 스토어 수정
  updateStore: async (
    storeId: string,
    request: UpdateStoreRequestDto,
  ): Promise<UpdateStoreResponseDto> => {
    const response = await sellerClient.put(`/store/${storeId}`, request);
    return response.data.data;
  },

  updateBusinessCalendar: async (
    storeId: string,
    request: StoreBusinessCalendarDto,
  ): Promise<UpdateStoreBusinessCalendarResponseDto> => {
    const response = await sellerClient.put(`/store/${storeId}/business-calendar`, request);
    return response.data.data;
  },

  // 네이버 플레이스 링크(또는 플레이스 ID)로 매장 정보 미리보기 (저장하지 않음)
  previewNaverPlace: async (url: string): Promise<NaverPlacePreviewResponseDto> => {
    const response = await sellerClient.get("/naver-place/preview", { params: { url } });
    return response.data.data;
  },

  // 스토어에 네이버 플레이스 연결 (스토어 정보는 바뀌지 않음)
  connectNaverPlace: async (
    storeId: string,
    placeId: string,
  ): Promise<NaverPlacePreviewResponseDto> => {
    const response = await sellerClient.put(`/store/${storeId}/naver-place`, { placeId });
    return response.data.data;
  },

  // 스토어의 네이버 플레이스 연결 해제 (스토어 정보는 그대로)
  disconnectNaverPlace: async (storeId: string): Promise<UpdateStoreResponseDto> => {
    const response = await sellerClient.delete(`/store/${storeId}/naver-place`);
    return response.data.data;
  },
};
