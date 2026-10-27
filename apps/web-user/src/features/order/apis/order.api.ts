import { consumerClient } from "@/apps/web-user/common/config/axios.config";
import {
  CreateOrderRequest,
  MyOrdersResponse,
  OrderResponse,
  UpdateReservationOrderItemRequest,
} from "@/apps/web-user/features/order/types/order.type";

export const orderApi = {
  // 주문 생성 (id만 반환)
  createOrder: async (data: CreateOrderRequest): Promise<Pick<OrderResponse, "id">> => {
    const response = await consumerClient.post("/orders", data);
    return response.data.data;
  },
  // 주문 상세조회
  getOrderById: async (orderId: string): Promise<OrderResponse> => {
    const response = await consumerClient.get(`/orders/${orderId}`);
    return response.data.data;
  },
  // 마이페이지 주문 목록 조회
  getMyOrders: async (params?: {
    type?: "UPCOMING" | "PAST";
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<MyOrdersResponse> => {
    const response = await consumerClient.get("/mypage/orders", {
      params: { sortBy: "LATEST", page: 1, limit: 10, ...params },
    });
    return response.data.data;
  },
  // 입금완료 처리
  paymentComplete: async (orderId: string, depositorName: string): Promise<void> => {
    await consumerClient.patch(`/orders/${orderId}/payment-complete`, { depositorName });
  },
  /**
   * 입금 전 예약 취소 (RESERVATION_REQUESTED, PAYMENT_PENDING 상태)
   *
   * `hasDeposited`가 true면 취소완료가 아니라 취소환불대기로 전환되며, 환불 계좌가 함께 필요합니다.
   * (입금대기 상태에서만 사용 가능 — 예약신청 단계는 계좌 안내 전이라 입금이 불가능합니다)
   */
  cancelBeforePayment: async (
    orderId: string,
    reason: string,
    deposited?: {
      bankName: string;
      bankAccountNumber: string;
      accountHolderName: string;
    },
  ): Promise<void> => {
    await consumerClient.patch(`/orders/${orderId}/cancel-before-payment`, {
      reason,
      ...(deposited ? { hasDeposited: true, ...deposited } : {}),
    });
  },
  // 픽업 날짜 변경 (RESERVATION_REQUESTED 상태에서만)
  updateReservationPickupDate: async (orderId: string, pickupDate: string): Promise<void> => {
    await consumerClient.patch(`/orders/${orderId}/reservation/pickup-date`, { pickupDate });
  },
  // 주문 항목 1개 옵션 변경 (RESERVATION_REQUESTED 상태에서만, 다른 항목은 그대로 유지)
  updateReservationOrderItem: async (
    orderId: string,
    itemId: string,
    body: UpdateReservationOrderItemRequest,
  ): Promise<void> => {
    await consumerClient.patch(`/orders/${orderId}/reservation/items/${itemId}`, body);
  },
  // 결제 후 환불 요청 (PAYMENT_COMPLETED, CONFIRMED, PICKUP_PENDING 상태)
  requestRefund: async (
    orderId: string,
    body: {
      reason: string;
      bankName: string;
      bankAccountNumber: string;
      accountHolderName: string;
    },
  ): Promise<void> => {
    await consumerClient.patch(`/orders/${orderId}/refund-request`, body);
  },

  /**
   * 환불 계좌 입력 (이미 취소환불대기인 주문)
   * 관리자가 취소완료 주문을 환불 처리로 되돌린 경우, 환불 계좌가 비어 있어 사용자가 직접 입력합니다.
   */
  submitRefundAccount: async (
    orderId: string,
    body: {
      bankName: string;
      bankAccountNumber: string;
      accountHolderName: string;
    },
  ): Promise<void> => {
    await consumerClient.patch(`/orders/${orderId}/refund-account`, body);
  },
};
