import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/apps/web-user/features/order/apis/order.api";
import { orderQueryKeys } from "@/apps/web-user/features/order/constants/orderQueryKeys.constant";
import { UpdateReservationOrderItemRequest } from "@/apps/web-user/features/order/types/order.type";
import { useAlertStore } from "@/apps/web-user/common/store/alert.store";
import getApiMessage from "@/apps/web-user/common/utils/getApiMessage";

/** 예약신청 단계 주문 항목 1개 옵션 변경 (다른 항목은 주문 시점 옵션·금액 유지) */
export function useUpdateReservationOrderItem() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      body,
    }: {
      orderId: string;
      itemId: string;
      body: UpdateReservationOrderItemRequest;
    }) => orderApi.updateReservationOrderItem(orderId, itemId, body),
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
