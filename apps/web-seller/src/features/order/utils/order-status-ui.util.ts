import { OrderStatus } from "@/apps/web-seller/features/order/types/order.dto";

const LABELS: Record<OrderStatus, string> = {
  [OrderStatus.RESERVATION_REQUESTED]: "예약신청",
  [OrderStatus.PAYMENT_PENDING]: "입금대기",
  [OrderStatus.PAYMENT_COMPLETED]: "입금완료",
  [OrderStatus.CONFIRMED]: "예약확정",
  [OrderStatus.PICKUP_PENDING]: "픽업대기",
  [OrderStatus.PICKUP_COMPLETED]: "픽업완료",
  [OrderStatus.CANCEL_COMPLETED]: "취소완료",
  [OrderStatus.CANCEL_REFUND_PENDING]: "취소환불대기",
  [OrderStatus.CANCEL_REFUND_COMPLETED]: "취소환불완료",
  [OrderStatus.NO_SHOW]: "노쇼",
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return LABELS[status] ?? status;
}
