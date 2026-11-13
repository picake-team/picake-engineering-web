"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";
import { uploadApi } from "@/apps/web-user/features/upload/apis/upload.api";
import { quoteApi } from "@/apps/web-user/features/quote/apis/quote.api";
import { quoteQueryKeys } from "@/apps/web-user/features/quote/constants/quote.constant";
import type {
  CreateQuoteRequestBody,
  QuoteRequestListTab,
} from "@/apps/web-user/features/quote/types/quote.type";
import type { QuoteDraftPhoto } from "@/apps/web-user/features/quote/store/quote-draft.store";
import { dataUrlToFile } from "@/apps/web-user/features/quote/utils/quote-photo.util";

/** 사진을 올린 뒤 요청서를 보낸다 */
export function useCreateQuoteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      photos,
    }: {
      body: Omit<CreateQuoteRequestBody, "photoUrls">;
      photos: QuoteDraftPhoto[];
    }) => {
      const photoUrls: string[] = [];
      for (const [index, photo] of photos.entries()) {
        const uploaded = await uploadApi.uploadFile(
          dataUrlToFile(photo.dataUrl, `quote-${Date.now()}-${index}.jpg`),
        );
        photoUrls.push(uploaded.fileUrl);
      }
      return quoteApi.create({ ...body, photoUrls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

export function useMyQuoteRequests(tab: QuoteRequestListTab, enabled = true) {
  return useQuery({
    queryKey: quoteQueryKeys.list(tab),
    queryFn: () => quoteApi.getList(tab),
    enabled,
  });
}

export function useQuoteRequestDetail(id: string | null) {
  return useQuery({
    queryKey: quoteQueryKeys.detail(id ?? ""),
    queryFn: () => quoteApi.getDetail(id as string),
    enabled: !!id,
  });
}

export function useCloseQuoteRequest() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();
  return useMutation({
    mutationFn: (id: string) => quoteApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
    onError: (error) => {
      showAlert({ type: "error", title: "오류", message: getApiMessage.error(error) });
    },
  });
}

/** 받은 견적(SC-18). 열면 서버가 새 견적을 본 것으로 적으니 안 본 수도 다시 읽는다 */
export function useQuoteSection(id: string | null, enabled = true) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: quoteQueryKeys.quotes(id ?? ""),
    queryFn: async () => {
      const section = await quoteApi.getQuotes(id as string);
      if (section.quotes.some((q) => q.unseen)) {
        void queryClient.invalidateQueries({ queryKey: quoteQueryKeys.unseen });
      }
      return section;
    },
    enabled: !!id && enabled,
  });
}

export function useChooseQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, quoteId }: { requestId: string; quoteId: string }) =>
      quoteApi.choose(requestId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.all });
    },
  });
}

/** MY "내 견적"의 아직 보지 않은 견적 수 */
export function useUnseenQuoteCount(enabled: boolean) {
  return useQuery({
    queryKey: quoteQueryKeys.unseen,
    queryFn: () => quoteApi.getUnseenCount(),
    enabled,
    staleTime: 30_000,
  });
}
