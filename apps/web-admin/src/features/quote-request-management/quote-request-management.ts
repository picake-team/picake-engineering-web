import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  closeReason: "EXPIRED" | "CONSUMER" | "ADMIN" | null;
  deadlineAt: string;
  thumbnailUrl: string | null;
  quoteCount: number;
  summary: QuoteRequestSummaryDto;
  createdAt: string;
  storeCount: number;
  photoCount: number;
  entry: QuoteRequestEntry | null;
  quantity: number;
  chosen: boolean;
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
  stores: AdminQuoteRequestStoreDto[];
  consumer: { id: string; nickname: string | null; name: string | null; phone: string };
}

/** 견적 칸이 쓰는 요청 상세(SC-46) */
export type AdminQuoteDetailDtoLike = AdminQuoteRequestDetailDto;

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
  quotes: (id: string) => ["quote-request-management", "quotes", id],
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

// ───────────── 견적 ②(기획 I-46 SC-46): 가게별 상태·가게 추가·견적 링크·대신 적기·알렸어요·마감 ─────────────

export type QuoteSimilarity = "EXACT" | "SIMILAR" | "INSPIRED";
export type QuoteDeclineReason = "FULLY_BOOKED" | "NOT_OUR_STYLE" | "BUDGET" | "OTHER";
export type QuoteTargetState =
  | "OPEN"
  | "SENT"
  | "DECLINED"
  | "CHOSEN_ME"
  | "CHOSEN_OTHER"
  | "CLOSED"
  | "FULL";

export const QUOTE_TARGET_STATE_LABELS: Record<QuoteTargetState, string> = {
  OPEN: "답 기다림",
  SENT: "견적 보냄",
  DECLINED: "어려워요",
  CHOSEN_ME: "손님이 고름",
  CHOSEN_OTHER: "다른 가게를 고름",
  CLOSED: "마감",
  FULL: "견적 다 모임",
};

export const QUOTE_DECLINE_LABELS: Record<QuoteDeclineReason, string> = {
  FULLY_BOOKED: "그날 주문이 꽉 찼어요",
  NOT_OUR_STYLE: "이런 디자인은 만들지 않아요",
  BUDGET: "예산으로는 어려워요",
  OTHER: "다른 이유",
};

export interface AdminQuoteDto {
  id: string;
  storeName: string;
  source: "LINK" | "ADMIN" | "SELLER";
  unitPrice: number;
  quantity: number;
  total: number;
  priceMayVary: boolean;
  similarity: QuoteSimilarity;
  similarityLabel: string;
  memo: string | null;
  photoUrls: string[];
  edited: boolean;
  createdAt: string;
}

export interface AdminQuoteTargetStatusDto {
  targetId: string;
  linkUrl: string | null;
  linkCreatedAt: string | null;
  linkOpenedAt: string | null;
  sentToAppAt: string | null;
  state: QuoteTargetState;
  quote: AdminQuoteDto | null;
  declineReason: QuoteDeclineReason | null;
  hasChat: boolean;
  awaitingShopReply: boolean;
}

export interface AdminQuoteSectionDto {
  targets: AdminQuoteTargetStatusDto[];
  chosenTargetId: string | null;
  chosenAt: string | null;
  chosenNotifiedAt: string | null;
  chosenIsUnentered: boolean;
  chosenStalled: boolean;
}

export interface AdminQuoteInputBody {
  unitPrice: number;
  priceMayVary?: boolean;
  similarity: QuoteSimilarity;
  memo?: string;
}

export interface AdminAddStoreBody {
  storeId?: string;
  kakaoPlaceId?: string;
  name?: string;
  placeUrl?: string;
  phone?: string;
}

const base = (id: string) => `/quote-request-management/requests/${id}`;

export const quoteAdminApi = {
  section: async (id: string): Promise<AdminQuoteSectionDto> =>
    (await adminClient.get(`${base(id)}/quotes`)).data.data,
  addStore: async (id: string, body: AdminAddStoreBody): Promise<AdminQuoteSectionDto> =>
    (await adminClient.post(`${base(id)}/stores`, body)).data.data,
  createLink: async (id: string, targetId: string): Promise<{ linkUrl: string }> =>
    (await adminClient.post(`${base(id)}/stores/${targetId}/link`)).data.data,
  submit: async (id: string, targetId: string, body: AdminQuoteInputBody) =>
    (await adminClient.put(`${base(id)}/stores/${targetId}/quote`, body)).data.data,
  decline: async (id: string, targetId: string, reason: QuoteDeclineReason) =>
    (await adminClient.post(`${base(id)}/stores/${targetId}/decline`, { reason })).data.data,
  chosenNotified: async (id: string) =>
    (await adminClient.post(`${base(id)}/chosen-notified`)).data.data,
  close: async (id: string) => (await adminClient.post(`${base(id)}/close`)).data.data,
};

export function useQuoteSection(requestId: string | undefined) {
  const query = useQuery<AdminQuoteSectionDto>({
    queryKey: keys.quotes(requestId ?? ""),
    queryFn: () => quoteAdminApi.section(requestId!),
    enabled: Boolean(requestId),
  });
  useQueryErrorAlert(query);
  return query;
}

/** 견적 쓰기 뒤 상세·가게별 상태를 함께 다시 읽는다 */
export function useQuoteAdminAction<T, R = unknown>(
  requestId: string,
  fn: (vars: T) => Promise<R>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.quotes(requestId) });
      void queryClient.invalidateQueries({ queryKey: keys.detail(requestId) });
    },
  });
}
