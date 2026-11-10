import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/apps/web-seller/features/order/apis/order.api";
import { orderQueryKeys } from "@/apps/web-seller/features/order/constants/orderQueryKeys.constant";
import {
  OrderStatus,
  UpdateOrderStatusRequestDto,
  UpdateOrderStatusResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import getApiMessage from "@/apps/web-seller/common/utils/getApiMessage";
import { useAlertStore } from "@/apps/web-seller/common/store/alert.store";
import { markOrderChangedHere } from "@/apps/web-seller/features/order/utils/recent-order-change.util";
import { trackSellerEvent } from "@/apps/web-seller/common/utils/analytics.util";
import { sellerSurface } from "@/apps/web-seller/common/utils/webview.bridge";
import { PHONE_MAX_WIDTH_PX } from "@/apps/web-seller/common/constants/screen.constant";

/** 처리한 뒤 띠 글자: 무엇이 됐는지 바로 알게 바뀐 상태별로 */
const DONE_MESSAGE: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.PAYMENT_PENDING]: "예약을 확인했어요. 이제 손님 입금을 기다려요",
  [OrderStatus.CONFIRMED]: "예약을 확정했어요",
  [OrderStatus.PICKUP_PENDING]: "픽업 대기로 바꿨어요",
  [OrderStatus.PICKUP_COMPLETED]: "픽업 완료했어요",
  [OrderStatus.CANCEL_COMPLETED]: "예약을 취소했어요",
  [OrderStatus.CANCEL_REFUND_PENDING]: "예약을 취소했어요. 송금한 뒤 '취소환불 완료'를 눌러 주세요",
  [OrderStatus.CANCEL_REFUND_COMPLETED]: "취소환불 완료로 바꿨어요",
  [OrderStatus.NO_SHOW]: "노쇼로 바꿨어요",
};

export function orderStatusDoneMessage(status: OrderStatus): string {
  return DONE_MESSAGE[status] ?? "주문 상태를 바꿨어요";
}

// 주문 상태 변경 뮤테이션
export function useUpdateOrderStatus() {
  const { addAlert } = useAlertStore();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    UpdateOrderStatusResponseDto,
    Error,
    {
      orderId: string;
      request: UpdateOrderStatusRequestDto;
      /** 분석용: 바꾸기 전 상태와 목록에서 바로 처리했는지 */
      meta?: { fromStatus: string; fromList: boolean };
    }
  >({
    mutationFn: ({ orderId, request }) => orderApi.updateOrderStatus(orderId, request),
    onMutate: ({ orderId }) => {
      // 같은 주문의 실시간 알림이 곧 오므로 안내 띠를 겹쳐 띄우지 않게 표시
      markOrderChangedHere(orderId);
    },
    onSuccess: (_res, variables) => {
      addAlert({
        severity: "success",
        message: orderStatusDoneMessage(variables.request.orderStatus),
      });
      trackSellerEvent("success_order_status_change", {
        from_status: variables.meta?.fromStatus ?? "unknown",
        to_status: variables.request.orderStatus,
        surface: sellerSurface(window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH_PX}px)`).matches),
        from_list: variables.meta?.fromList ?? false,
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
