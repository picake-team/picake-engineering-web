import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import { endActAsAndLeave } from "@/apps/web-seller/common/utils/act-as.util";

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
  /** 들어오기는 됐는데 이 탭에 출입증을 둘 수 없을 때: 받은 출입증으로 바로 끝낸다 */
  endWithToken: async (accessToken: string): Promise<void> => {
    await sellerClient.post("/act-as/end", undefined, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },
};

/** 끝내기(띠 버튼·로그아웃): 서버가 끝내지 못해도(끊김) 이 탭에서는 출입증을 지운다. 세션은 60분이 지나면 저절로 끝난다 */
export function finishActAs(): Promise<void> {
  return actAsApi
    .end()
    .catch(() => undefined)
    .finally(endActAsAndLeave);
}
