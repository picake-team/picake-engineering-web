import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { useSnackbarStore } from "@/apps/web-seller/common/store/snackbar.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { withEulReul } from "@/apps/web-seller/common/utils/josa.util";
import { productApi } from "@/apps/web-seller/features/product/apis/product.api";
import { productQueryKeys } from "@/apps/web-seller/features/product/constants/productQueryKeys.constant";
import {
  EnableStatus,
  type ProductListResponseDto,
} from "@/apps/web-seller/features/product/types/product.dto";

/**
 * 상품 목록에서 판매 상태 바로 바꾸기(SC-82 ⑤). 확인 창 없이 바로 바꾸고
 * 화면 아래 스낵바로 "(상품)을 판매중지로 바꿨어요 · 되돌리기"를 잠깐 보인다(되돌리기는 같은 요청을 반대로).
 * 스위치는 서버를 기다리지 않고 누르자마자 움직이고(목록 캐시를 먼저 바꿈), 실패하면 되돌리고 알린다.
 */
export function useProductSalesToggle() {
  const queryClient = useQueryClient();
  const addAlert = useAlertStore((s) => s.addAlert);
  const showSnackbar = useSnackbarStore((s) => s.showSnackbar);

  const mutation = useMutation({
    mutationFn: ({
      productId,
      next,
    }: {
      productId: string;
      name: string;
      next: EnableStatus;
      undo?: boolean;
    }) => productApi.updateProduct(productId, { salesStatus: next }),
    onMutate: async (v) => {
      await queryClient.cancelQueries({ queryKey: productQueryKeys.lists() });
      const previous = queryClient.getQueriesData<InfiniteData<ProductListResponseDto>>({
        queryKey: productQueryKeys.lists(),
      });
      queryClient.setQueriesData<InfiniteData<ProductListResponseDto>>(
        { queryKey: productQueryKeys.lists() },
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((p) =>
                p.id === v.productId ? { ...p, salesStatus: v.next } : p,
              ),
            })),
          },
      );
      return { previous };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueryKeys.all }),
    onSuccess: (_res, v) => {
      if (v.undo) return;
      const to = v.next === EnableStatus.ENABLE ? "판매중으로" : "판매중지로";
      showSnackbar({
        message: `${withEulReul(v.name)} ${to} 바꿨어요`,
        duration: 5000,
        actionLabel: "되돌리기",
        onAction: () =>
          mutation.mutate({
            productId: v.productId,
            name: v.name,
            next: v.next === EnableStatus.ENABLE ? EnableStatus.DISABLE : EnableStatus.ENABLE,
            undo: true,
          }),
      });
    },
    onError: (e, _v, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      addAlert({ severity: "error", message: getApiMessage.error(e) });
    },
  });
  return mutation;
}
