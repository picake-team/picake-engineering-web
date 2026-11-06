import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { withEulReul } from "@/apps/web-seller/common/utils/josa.util";
import { productApi } from "@/apps/web-seller/features/product/apis/product.api";
import { productQueryKeys } from "@/apps/web-seller/features/product/constants/productQueryKeys.constant";
import { EnableStatus } from "@/apps/web-seller/features/product/types/product.dto";

/**
 * 상품 목록에서 판매 상태 바로 바꾸기(SC-82 ⑤). 확인 창 없이 바로 바꾸고
 * "(상품)을 판매중지로 바꿨어요 · 되돌리기"를 잠깐 보인다(되돌리기는 같은 요청을 반대로).
 */
export function useProductSalesToggle() {
  const queryClient = useQueryClient();
  const addAlert = useAlertStore((s) => s.addAlert);

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
    onSuccess: (_res, v) => {
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      if (v.undo) return;
      const to = v.next === EnableStatus.ENABLE ? "판매중으로" : "판매중지로";
      addAlert({
        severity: "success",
        message: `${withEulReul(v.name)} ${to} 바꿨어요`,
        autoHideDuration: 5000,
        action: {
          label: "되돌리기",
          onClick: () =>
            mutation.mutate({
              productId: v.productId,
              name: v.name,
              next: v.next === EnableStatus.ENABLE ? EnableStatus.DISABLE : EnableStatus.ENABLE,
              undo: true,
            }),
        },
      });
    },
    onError: (e) => addAlert({ severity: "error", message: getApiMessage.error(e) }),
  });
  return mutation;
}
