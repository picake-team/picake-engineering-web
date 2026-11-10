import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "@/apps/web-seller/features/product/apis/product.api";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import {
  CreateProductRequestDto,
  UpdateProductRequestDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import { ROUTES } from "@/apps/web-seller/common/constants/paths.constant";
import { productQueryKeys } from "../../constants/productQueryKeys.constant";

// 상품 등록 뮤테이션
export function useCreateProduct() {
  const { addAlert } = useAlertStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateProductRequestDto) => productApi.createProduct(request),
    onSuccess: (_response, variables) => {
      addAlert({
        severity: "success",
        message: "상품을 등록했어요.",
      });
      // 상품 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      navigate(ROUTES.STORE_DETAIL_PRODUCTS_LIST(variables.storeId));
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

// 상품 수정 뮤테이션
export function useUpdateProduct() {
  const { addAlert } = useAlertStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      request,
    }: {
      productId: string;
      request: UpdateProductRequestDto;
      storeId: string;
    }) => productApi.updateProduct(productId, request),
    onSuccess: (_response, variables) => {
      addAlert({
        severity: "success",
        message: "상품을 저장했어요.",
      });
      // 상품 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      navigate(ROUTES.STORE_DETAIL_PRODUCTS_LIST(variables.storeId));
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}

// 상품 삭제 뮤테이션
export function useDeleteProduct() {
  const { addAlert } = useAlertStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId }: { productId: string; storeId: string }) =>
      productApi.deleteProduct(productId),
    onSuccess: (_response, variables) => {
      addAlert({
        severity: "success",
        message: "상품을 삭제했어요.",
      });
      // 상품 쿼리 무효화. 지운 상품의 상세는 다시 부르지 않는다(열려 있던 상세 화면이 다시 불러
      // "상품을 찾을 수 없습니다" 오류 안내가 함께 뜨던 것)
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.all,
        predicate: (query) => query.queryKey[2] !== variables.productId,
      });
      navigate(ROUTES.STORE_DETAIL_PRODUCTS_LIST(variables.storeId));
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });
}
