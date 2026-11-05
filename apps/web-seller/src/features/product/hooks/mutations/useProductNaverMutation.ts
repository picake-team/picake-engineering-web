import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productNaverApi } from "@/apps/web-seller/features/product/apis/product-naver.api";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { productQueryKeys } from "@/apps/web-seller/features/product/constants/productQueryKeys.constant";
import type { ProductDescriptionDraftRequestDto } from "@/apps/web-seller/features/product/types/product-naver.dto";

/** API 에러의 HTTP 상태 (axios) */
export const getErrorStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;

function useErrorAlert() {
  const { addAlert } = useAlertStore();
  return (error: unknown) => addAlert({ severity: "error", message: getApiMessage.error(error) });
}

/** 연결한 네이버 매장의 상품 목록 (누를 때만 불러온다) */
export function useLoadNaverProducts() {
  const onError = useErrorAlert();
  return useMutation({
    mutationFn: (storeId: string) => productNaverApi.getNaverProducts(storeId),
    onError,
  });
}

/** 네이버 상품 1개의 등록 제안값. 404(네이버에서 사라짐)는 화면에서 따로 안내한다 */
export function useLoadNaverProductDetail() {
  const onError = useErrorAlert();
  return useMutation({
    mutationFn: ({ storeId, itemKey }: { storeId: string; itemKey: string }) =>
      productNaverApi.getNaverProductDetail(storeId, itemKey),
    onError: (error) => {
      if (getErrorStatus(error) !== 404) onError(error);
    },
  });
}

/** 고른 네이버 사진을 Picake에 올리기 */
export function useImportNaverImages() {
  const onError = useErrorAlert();
  return useMutation({
    mutationFn: ({
      storeId,
      itemKey,
      indexes,
    }: {
      storeId: string;
      itemKey: string;
      indexes: number[];
    }) => productNaverApi.importNaverImages(storeId, itemKey, indexes),
    onError,
  });
}

/** 상품을 네이버 예약 상품과 연결 / 끊기 */
export function useLinkNaverItem() {
  const onError = useErrorAlert();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, bizItemId }: { productId: string; bizItemId: string }) =>
      productNaverApi.linkNaverItem(productId, bizItemId),
    onSuccess: (_r, v) =>
      queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(v.productId) }),
    onError,
  });
}

export function useUnlinkNaverItem() {
  const onError = useErrorAlert();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => productNaverApi.unlinkNaverItem(productId),
    onSuccess: (_r, productId) =>
      queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(productId) }),
    onError,
  });
}

/** 상품 상세설명 AI 초안 */
export function useCreateDescriptionDraft() {
  const onError = useErrorAlert();
  return useMutation({
    mutationFn: ({
      storeId,
      request,
    }: {
      storeId: string;
      request: ProductDescriptionDraftRequestDto;
    }) => productNaverApi.createDescriptionDraft(storeId, request),
    onError,
  });
}
