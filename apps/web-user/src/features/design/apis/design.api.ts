import { consumerClient } from "@/apps/web-user/common/config/axios.config";
import type { MessageResponse } from "@/apps/web-user/common/types/api.type";
import type { FillSource } from "@/apps/web-user/features/design/utils/design-fill.util";

/** 디자인 좋아요 수(1개 이상만)와 내가 좋아요한 디자인(최근 순, 로그인 전에는 빈 목록) */
export interface DesignLikesResponse {
  counts: Record<string, number>;
  myLikes: string[];
}

/** 손님 사진을 AI가 읽은 결과. 케이크가 아니거나 읽지 못하면 unreadable */
export type PhotoReadResponse =
  | (FillSource & { read: { label: string; value: string | null }[] })
  | { unreadable: true };

export const designApi = {
  getLikes: async (): Promise<DesignLikesResponse> => {
    const response = await consumerClient.get("/designs/likes");
    return response.data.data;
  },
  like: async (designId: string): Promise<MessageResponse> => {
    const response = await consumerClient.post(`/designs/${designId}/like`);
    return response.data.data;
  },
  unlike: async (designId: string): Promise<MessageResponse> => {
    const response = await consumerClient.delete(`/designs/${designId}/like`);
    return response.data.data;
  },
  /** 견적 요청서 사진 읽기(기획 I-112 ⑥) */
  readPhoto: async (image: string): Promise<PhotoReadResponse> => {
    const response = await consumerClient.post(
      "/quote-requests/photo-read",
      { image },
      { timeout: 30_000 },
    );
    return response.data.data;
  },
};
