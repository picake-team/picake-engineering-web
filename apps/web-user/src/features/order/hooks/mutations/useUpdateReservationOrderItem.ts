import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/apps/web-user/features/order/apis/order.api";
import { orderQueryKeys } from "@/apps/web-user/features/order/constants/orderQueryKeys.constant";
import { CreateOrderItemRequest } from "@/apps/web-user/features/order/types/order.type";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";

export function useUpdateReservationOrderItems() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: ({
      orderId,
      items,
      totalQuantity,
      totalPrice,
    }: {
      orderId: string;
      items: CreateOrderItemRequest[];
      totalQuantity: number;
      totalPrice: number;
    }) => orderApi.updateReservationOrderItems(orderId, { items, totalQuantity, totalPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
    },
    onError: (error) => {
      showAlert({
        type: "error",
        title: "오류",
        message: getApiMessage.error(error),
      });
    },
  });
}
