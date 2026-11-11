import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminClient } from "@/apps/web-admin/common/config/axios.config";
import { useQueryErrorAlert } from "@/apps/web-admin/common/hooks/useQueryErrorAlert";
import { useAlertStore } from "@/apps/web-admin/common/store/alert.store";
import getApiMessage from "@/apps/web-admin/common/utils/getApiMessage";

/** 채팅(기획 I-11) — backend `/v1/admin/chat`. 신고 처리(24시간 안)와 채팅 여는 시각 */

export type ChatReportReason = "ABUSE" | "SEXUAL" | "SPAM" | "FRAUD" | "OTHER";
export type ChatReportStatus = "OPEN" | "RESOLVED";
export type ChatSide = "CONSUMER" | "SHOP";

export const CHAT_REPORT_REASON_LABELS: Record<ChatReportReason, string> = {
  ABUSE: "욕설·비방·괴롭힘",
  SEXUAL: "음란·불쾌한 사진",
  SPAM: "광고·도배",
  FRAUD: "사기 의심",
  OTHER: "그 밖의 이유",
};

export const CHAT_SIDE_LABELS: Record<ChatSide, string> = {
  CONSUMER: "손님",
  SHOP: "가게",
};

export interface AdminChatReportListItem {
  id: string;
  reason: ChatReportReason;
  reporter: ChatSide;
  status: ChatReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  threadId: string;
  shopName: string;
}

export interface AdminChatReportMessage {
  id: string;
  sender: ChatSide;
  kind: "TEXT" | "IMAGE" | "ORDER" | "PRODUCT";
  /** 원문(거르기 전) */
  text: string | null;
  maskedText: string | null;
  imageUrls: string[];
  hidden: boolean;
  createdAt: string;
}

export interface AdminChatReportDetail {
  id: string;
  reason: ChatReportReason;
  reporter: ChatSide;
  detail: string | null;
  status: ChatReportStatus;
  resolution: string | null;
  /** 메시지 하나를 신고했으면 그 id, 방 전체면 null */
  messageId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  threadId: string;
  consumerId: string;
  consumerNickname: string | null;
  shopName: string;
  storeId: string | null;
  messages: AdminChatReportMessage[];
}

export interface AdminChatOpenConfig {
  chatOpensAt: string | null;
  open: boolean;
}

export const chatManagementApi = {
  getOpen: async (): Promise<AdminChatOpenConfig> => {
    const response = await adminClient.get("/chat/open");
    return response.data.data;
  },
  setOpen: async (chatOpensAt: string | null): Promise<AdminChatOpenConfig> => {
    const response = await adminClient.put("/chat/open", { chatOpensAt });
    return response.data.data;
  },
  getReports: async (
    status?: ChatReportStatus,
  ): Promise<{ reports: AdminChatReportListItem[] }> => {
    const response = await adminClient.get("/chat/reports", { params: status ? { status } : {} });
    return response.data.data;
  },
  getReport: async (id: string): Promise<AdminChatReportDetail> => {
    const response = await adminClient.get(`/chat/reports/${id}`);
    return response.data.data;
  },
  resolve: async (
    id: string,
    body: { action: "HIDE_MESSAGE" | "NONE"; messageIds?: string[]; note?: string },
  ): Promise<AdminChatReportDetail> => {
    const response = await adminClient.patch(`/chat/reports/${id}`, body);
    return response.data.data;
  },
};

const keys = {
  all: ["chat-management"] as const,
  open: ["chat-management", "open"] as const,
  reports: (status?: ChatReportStatus) => ["chat-management", "reports", status ?? "ALL"] as const,
  report: (id: string) => ["chat-management", "report", id] as const,
};

export function useChatOpenConfig() {
  const query = useQuery({ queryKey: keys.open, queryFn: chatManagementApi.getOpen });
  useQueryErrorAlert(query);
  return query;
}

export function useSetChatOpen() {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();
  return useMutation({
    mutationFn: (chatOpensAt: string | null) => chatManagementApi.setOpen(chatOpensAt),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.open, data);
      addAlert({
        severity: "success",
        message: data.chatOpensAt ? "채팅 여는 시각을 저장했어요." : "채팅을 닫았어요.",
      });
    },
    onError: (e) => addAlert({ severity: "error", message: getApiMessage.error(e) }),
  });
}

export function useChatReports(status?: ChatReportStatus) {
  const query = useQuery({
    queryKey: keys.reports(status),
    queryFn: () => chatManagementApi.getReports(status),
  });
  useQueryErrorAlert(query);
  return query;
}

/** 상세를 열면 서버에 열람 기록이 남는다(다시 불러올 때마다 남지 않게 자동 새로고침을 끈다) */
export function useChatReport(id: string | undefined) {
  const query = useQuery({
    queryKey: keys.report(id ?? ""),
    queryFn: () => chatManagementApi.getReport(id as string),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  useQueryErrorAlert(query);
  return query;
}

export function useResolveChatReport(id: string) {
  const queryClient = useQueryClient();
  const { addAlert } = useAlertStore();
  return useMutation({
    mutationFn: (body: { action: "HIDE_MESSAGE" | "NONE"; messageIds?: string[]; note?: string }) =>
      chatManagementApi.resolve(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.report(id), data);
      void queryClient.invalidateQueries({ queryKey: ["chat-management", "reports"] });
      addAlert({ severity: "success", message: "신고를 처리했어요." });
    },
    onError: (e) => addAlert({ severity: "error", message: getApiMessage.error(e) }),
  });
}

/** "11. 9. 21:05" 같은 짧은 한국 시각 */
export function formatKst(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/**
 * 한국 시각 입력(datetime-local, "2026-11-25T00:00") ↔ 서버 ISO(UTC).
 * 서버·DB는 UTC로 저장하므로 +09:00을 붙여 바꾼다(그냥 넣으면 9시간 어긋남).
 */
export function kstInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function isoToKstInput(iso: string | null): string {
  if (!iso) return "";
  const kst = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return kst.toISOString().slice(0, 16);
}

/** 24시간 안 처리(애플 1.2). 남은 시간(시간 단위, 음수면 지남) */
export function hoursLeft(createdAt: string, now = Date.now()): number {
  return Math.floor((new Date(createdAt).getTime() + 24 * 3600_000 - now) / 3600_000);
}
