import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import type {
  Quote,
  QuoteDeclineReason,
  QuoteInputBody,
  QuoteRequestForShop,
} from "@/apps/web-seller/features/quote/types/quote.type";

const base = (storeId: string, requestId: string) =>
  `/stores/${storeId}/quote-requests/${requestId}`;

/** 판매자 앱 견적(기획 I-46 ②): 채팅방 요청서 카드에서 견적 보내기 */
export const quoteApi = {
  view: async (storeId: string, requestId: string): Promise<QuoteRequestForShop> => {
    const response = await sellerClient.get(base(storeId, requestId));
    return response.data.data;
  },
  submit: async (storeId: string, requestId: string, body: QuoteInputBody): Promise<Quote> => {
    const response = await sellerClient.post(`${base(storeId, requestId)}/quote`, body);
    return response.data.data;
  },
  decline: async (storeId: string, requestId: string, reason: QuoteDeclineReason) => {
    await sellerClient.post(`${base(storeId, requestId)}/decline`, { reason });
  },
};
