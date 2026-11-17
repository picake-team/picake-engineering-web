import { sellerClient } from "@/apps/web-seller/common/config/axios.config";

/** 서버 ExchangeActAsCodeResponseDto(기획 I-41) */
export interface ActAsExchangeResponseDto {
  accessToken: string;
  storeId: string;
  expiresAt: string;
}

/** 서버 ActAsMeResponseDto — 위 띠 */
export interface ActAsMeResponseDto {
  sessionId: string;
  storeId: string;
  storeName: string;
  expiresAt: string;
}

/** 운영자 대신 입력(기획 I-41): 들어오기 코드 바꾸기·위 띠·끝내기 */
export const actAsApi = {
  exchange: async (code: string): Promise<ActAsExchangeResponseDto> => {
    const response = await sellerClient.post("/act-as/exchange", { code });
    return response.data.data;
  },
  me: async (): Promise<ActAsMeResponseDto> => {
    const response = await sellerClient.get("/act-as/me");
    return response.data.data;
  },
  end: async (): Promise<void> => {
    await sellerClient.post("/act-as/end");
  },
};
