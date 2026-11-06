import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/apps/web-seller/features/order/apis/order.api";
import { orderQueryKeys } from "@/apps/web-seller/features/order/constants/orderQueryKeys.constant";
import {
  UpdateOrderStatusRequestDto,
  UpdateOrderStatusResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { markOrderChangedHere } from "@/apps/web-seller/features/order/utils/recent-order-change.util";

// 주문 상태 변경 뮤테이션
export function useUpdateOrderStatus() {
  const { addAlert } = useAlertStore();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    UpdateOrderStatusResponseDto,
    Error,
    { orderId: string; request: UpdateOrderStatusRequestDto }
  >({
    mutationFn: ({ orderId, request }) => orderApi.updateOrderStatus(orderId, request),
    onMutate: ({ orderId }) => {
      // 같은 주문의 실시간 알림이 곧 오므로 안내 띠를 겹쳐 띄우지 않게 표시
      markOrderChangedHere(orderId);
    },
    onSuccess: () => {
      addAlert({
        severity: "success",
        message: "주문 상태가 변경되었습니다.",
      });
      // 주문 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
    },
    onError: (error) => {
      addAlert({
        severity: "error",
        message: getApiMessage.error(error),
      });
    },
  });

  return mutation;
}
