import type { OrderResponse } from "@/apps/web-user/features/order/types/order.type";

/**
 * 환불 금액을 무엇으로 정하는지(2026-11-16).
 * - 가게가 취소한 예약(사장님 취소·취소환불대기)과 입금 마감으로 자동 취소됐는데 입금이 확인된 예약은
 *   결제한 금액을 돌려받는다(알림톡 M-08·M-11 "이체해 주신 금액을 환불"과 같게).
 * - 손님이 취소·환불을 요청한 예약만 가게 환불·취소 규정대로 정한다(11-15 운영자: 전액으로 약속하지 않기).
 */
export type RefundBasis = "store-cancel" | "payment-expired" | "store-rules";

type RefundBasisOrder = Pick<
  OrderResponse,
  "sellerCancelReason" | "sellerCancelRefundPendingReason" | "paymentPendingExpiredAt"
>;

export function getRefundBasis(order: RefundBasisOrder): RefundBasis {
  if (order.sellerCancelRefundPendingReason || order.sellerCancelReason) return "store-cancel";
  if (order.paymentPendingExpiredAt) return "payment-expired";
  return "store-rules";
}

/** 취소·환불 계좌 화면 맨 위 안내 한 줄 */
export function refundNoticeMessage(
  order: RefundBasisOrder & Pick<OrderResponse, "totalPrice">,
): string {
  const paid = `결제 금액 ${order.totalPrice.toLocaleString()}원`;
  switch (getRefundBasis(order)) {
    case "store-cancel":
      return `${paid} · 가게 사정으로 취소되어 결제한 금액을 돌려받아요`;
    case "payment-expired":
      return `${paid} · 입금이 확인되어 결제한 금액을 돌려받아요`;
    default:
      return `${paid} · 환불 금액은 가게 환불 규정대로 정해요`;
  }
}
