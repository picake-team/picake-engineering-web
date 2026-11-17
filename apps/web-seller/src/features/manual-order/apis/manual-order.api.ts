import { sellerClient } from "@/apps/web-seller/common/config/axios.config";
import type {
  CalendarFeedDto,
  ManualOrderDto,
  ManualOrderInput,
  ManualOrderReadResult,
} from "@/apps/web-seller/features/manual-order/types/manual-order.dto";

/** 대화 읽기는 Claude를 기다린다(서버는 20초에서 끊음) */
const READ_TIMEOUT_MS = 30_000;

export const manualOrderApi = {
  list: async (storeId: string, startDate: string, endDate: string): Promise<ManualOrderDto[]> => {
    const response = await sellerClient.get(`/stores/${storeId}/manual-orders`, {
      params: { startDate, endDate },
    });
    return response.data.data.data;
  },
  get: async (storeId: string, id: string): Promise<ManualOrderDto> => {
    const response = await sellerClient.get(`/stores/${storeId}/manual-orders/${id}`);
    return response.data.data;
  },
  create: async (storeId: string, input: ManualOrderInput): Promise<ManualOrderDto> => {
    const response = await sellerClient.post(`/stores/${storeId}/manual-orders`, input);
    return response.data.data;
  },
  update: async (storeId: string, id: string, input: ManualOrderInput): Promise<ManualOrderDto> => {
    const response = await sellerClient.put(`/stores/${storeId}/manual-orders/${id}`, input);
    return response.data.data;
  },
  setPaid: async (storeId: string, id: string, paid: boolean | null): Promise<ManualOrderDto> => {
    const response = await sellerClient.patch(`/stores/${storeId}/manual-orders/${id}/paid`, {
      paid,
    });
    return response.data.data;
  },
  remove: async (storeId: string, id: string): Promise<void> => {
    await sellerClient.delete(`/stores/${storeId}/manual-orders/${id}`);
  },
  /** 대화 글 또는 대화 캡처(data URL) 하나를 읽는다 */
  read: async (
    storeId: string,
    input: { text?: string; image?: string; today: string },
  ): Promise<ManualOrderReadResult> => {
    const response = await sellerClient.post(`/stores/${storeId}/manual-orders/read`, input, {
      timeout: READ_TIMEOUT_MS,
    });
    return response.data.data;
  },
  getCalendarFeed: async (storeId: string): Promise<CalendarFeedDto> => {
    const response = await sellerClient.get(`/stores/${storeId}/calendar-feed`);
    return response.data.data;
  },
  updateCalendarFeed: async (
    storeId: string,
    showCustomerName: boolean,
  ): Promise<CalendarFeedDto> => {
    const response = await sellerClient.patch(`/stores/${storeId}/calendar-feed`, {
      showCustomerName,
    });
    return response.data.data;
  },
};
