import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminClient } from "@/apps/web-admin/common/config/axios.config";
import { useQueryErrorAlert } from "@/apps/web-admin/common/hooks/useQueryErrorAlert";
import type { PaginationMetaDto } from "@/apps/web-admin/common/types/api.dto";

/** 견적 요청(기획 I-46) — backend `/v1/admin/quote-request-management` */

export type QuoteRequestStatus = "OPEN" | "CONNECTED" | "CLOSED";
export type QuoteRequestEntry = "HOME" | "SEARCH" | "MAP" | "STORE" | "MYPAGE";

export const QUOTE_REQUEST_STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  OPEN: "견적 받는 중",
  CONNECTED: "가게 연결",
  CLOSED: "마감",
};

export const QUOTE_REQUEST_ENTRY_LABELS: Record<QuoteRequestEntry, string> = {
  HOME: "홈",
  SEARCH: "검색",
  MAP: "지도",
  STORE: "가게 상세",
  MYPAGE: "MY",
};

export interface QuoteRequestSummaryDto {
  pickup: string;
  area: string;
  cake: string;
  budget: string;
  deadline: string;
}

export interface AdminQuoteRequestListItemDto {
  id: string;
  status: QuoteRequestStatus;
  closeReason: "EXPIRED" | "CONSUMER" | null;
  deadlineAt: string;
  thumbnailUrl: string | null;
  quoteCount: number;
  summary: QuoteRequestSummaryDto;
  createdAt: string;
  storeCount: number;
  photoCount: number;
  entry: QuoteRequestEntry | null;
}

export interface AdminQuoteRequestStoreDto {
  id: string;
  storeId: string | null;
  kakaoPlaceId: string | null;
  name: string;
  address: string | null;
  isPicakeStore: boolean;
  addedBy: "CONSUMER" | "ADMIN";
  phone: string | null;
  placeUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AdminQuoteRequestDetailDto extends AdminQuoteRequestListItemDto {
  description: string | null;
  photoUrls: string[];
  requestNote: string | null;
  onlyDesignatedStores: boolean;
  areaName: string | null;
  areaSido: string | null;
  distanceKm: number | null;
  areaLatitude: number | null;
  areaLongitude: number | null;
  closedAt: string | null;
  consentedAt: string;
  stores: AdminQuoteRequestStoreDto[];
  consumer: { id: string; nickname: string | null; name: string | null; phone: string };
}

export interface AdminQuoteRequestListResponseDto {
  data: AdminQuoteRequestListItemDto[];
  meta: PaginationMetaDto;
}

export interface AdminQuoteRequestListQueryDto {
  status?: QuoteRequestStatus;
  page: number;
  limit: number;
}

export const quoteRequestManagementApi = {
  getRequests: async (
    params: AdminQuoteRequestListQueryDto,
  ): Promise<AdminQuoteRequestListResponseDto> => {
    const response = await adminClient.get("/quote-request-management/requests", { params });
    return response.data.data;
  },
  getRequest: async (requestId: string): Promise<AdminQuoteRequestDetailDto> => {
    const response = await adminClient.get(`/quote-request-management/requests/${requestId}`);
    return response.data.data;
  },
};

const keys = {
  list: (params: AdminQuoteRequestListQueryDto) => ["quote-request-management", "list", params],
  detail: (id: string) => ["quote-request-management", "detail", id],
};

export function useQuoteRequestList(params: AdminQuoteRequestListQueryDto) {
  const query = useQuery<AdminQuoteRequestListResponseDto>({
    queryKey: keys.list(params),
    queryFn: () => quoteRequestManagementApi.getRequests(params),
    placeholderData: keepPreviousData,
  });
  useQueryErrorAlert(query);
  return query;
}

export function useQuoteRequestDetail(requestId: string | undefined) {
  const query = useQuery<AdminQuoteRequestDetailDto>({
    queryKey: keys.detail(requestId ?? ""),
    queryFn: () => quoteRequestManagementApi.getRequest(requestId!),
    enabled: Boolean(requestId),
  });
  useQueryErrorAlert(query);
  return query;
}

/** "11. 9. 21:05" 같은 짧은 한국 시각 */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
