import { OrderStatus } from "@/apps/web-user/features/order/types/order.type";

const ORDER_STATUS_LABEL: Record<string, string> = {
  [OrderStatus.RESERVATION_REQUESTED]: "예약신청",
  [OrderStatus.PAYMENT_PENDING]: "입금대기",
  [OrderStatus.PAYMENT_COMPLETED]: "입금완료",
  [OrderStatus.CONFIRMED]: "예약확정",
  [OrderStatus.PICKUP_PENDING]: "픽업대기",
  [OrderStatus.PICKUP_COMPLETED]: "픽업완료",
  [OrderStatus.CANCEL_COMPLETED]: "예약취소",
  [OrderStatus.CANCEL_REFUND_PENDING]: "환불대기",
  // 환불 완료도 사용자에겐 취소된 예약이므로 "예약취소"로 통일해 노출
  [OrderStatus.CANCEL_REFUND_COMPLETED]: "예약취소",
  [OrderStatus.NO_SHOW]: "노쇼",
};

const STATUS_COLOR: Record<string, string> = {
  [OrderStatus.RESERVATION_REQUESTED]: "text-gray-500 bg-gray-50",
  [OrderStatus.PAYMENT_PENDING]: "text-blue-400 bg-blue-50",
  [OrderStatus.PAYMENT_COMPLETED]: "text-blue-400 bg-blue-50",
  [OrderStatus.CONFIRMED]: "text-blue-400 bg-blue-50",
  [OrderStatus.PICKUP_PENDING]: "text-blue-400 bg-blue-50",
  [OrderStatus.PICKUP_COMPLETED]: "text-gray-500 bg-gray-50",
  [OrderStatus.CANCEL_COMPLETED]: "text-gray-500 bg-gray-50",
  [OrderStatus.CANCEL_REFUND_PENDING]: "text-red-400 bg-red-50",
  [OrderStatus.CANCEL_REFUND_COMPLETED]: "text-gray-500 bg-gray-50",
  [OrderStatus.NO_SHOW]: "text-red-400 bg-red-50",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const label = ORDER_STATUS_LABEL[status] ?? status;
  const color = STATUS_COLOR[status] ?? "text-gray-500 bg-gray-50";

  return (
    <span className={`text-2xs font-bold rounded px-1.5 py-0.5 shrink-0 ${color}`}>{label}</span>
  );
}
