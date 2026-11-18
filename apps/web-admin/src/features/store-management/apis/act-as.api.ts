import { adminClient } from "@/apps/web-admin/common/config/axios.config";
import type {
  ActAsActionItemDto,
  ActAsSessionItemDto,
  StartActAsSessionRequestDto,
  StartActAsSessionResponseDto,
} from "@/apps/web-admin/features/store-management/types/act-as.dto";

/** 운영자 대신 입력(기획 I-41): 이 가게로 들어가기·기록·끝내기 */
export const actAsApi = {
  start: async (
    storeId: string,
    dto: StartActAsSessionRequestDto,
  ): Promise<StartActAsSessionResponseDto> => {
    const response = await adminClient.post(`/stores/${storeId}/act-as-sessions`, dto);
    return response.data.data;
  },

  listSessions: async (storeId: string): Promise<ActAsSessionItemDto[]> => {
    const response = await adminClient.get(`/stores/${storeId}/act-as-sessions`);
    return response.data.data.data;
  },

  listActions: async (sessionId: string): Promise<ActAsActionItemDto[]> => {
    const response = await adminClient.get(`/act-as-sessions/${sessionId}/actions`);
    return response.data.data.data;
  },

  end: async (sessionId: string): Promise<void> => {
    await adminClient.post(`/act-as-sessions/${sessionId}/end`);
  },
};
