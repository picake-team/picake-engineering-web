/**
 * 판매자용 주문 상태 안내 문구.
 * 입금 마감(픽업까지 남은 시간에 따라 최대 12h·6h·1h)·픽업 시각 도달 자동 전환 등은 백엔드 `order-automation`·`order-datetime.util` 규칙과 맞춥니다.
 */
import { OrderStatus } from "@/apps/web-seller/features/order/types/order.dto";

export type OrderStatusGuideItem = {
  label: string;
  description: string;
};

/** 상태별 안내 문장 (상세 힌트·흐름 목록 공통) */
export const ORDER_STATUS_SELLER_FLOW_LINE_BY_STATUS: Record<OrderStatus, string> = {
  [OrderStatus.RESERVATION_REQUESTED]:
    "예약신청: 손님이 예약을 막 신청했어요. '예약 확인'을 눌러야 손님이 입금할 수 있어요. 받기 어려우면 사유를 적고 예약을 취소할 수 있어요. 픽업 날까지 확인하지 않으면 다음 날 아침 자동으로 취소돼요.",
  [OrderStatus.PAYMENT_PENDING]:
    "입금대기: 손님이 입금하기를 기다리는 중이에요. 입금 마감까지 손님이 '입금 완료'를 누르지 않으면 자동으로 취소돼요. 통장에서 입금을 확인했으면 바로 '예약 확정'을 눌러도 돼요.",
  [OrderStatus.PAYMENT_COMPLETED]:
    "입금완료: 손님이 '입금 완료'를 눌렀어요. 통장을 보고 '예약 확정'을 눌러 주세요. 취소·환불이 필요하면 예약을 취소하고 환불할 수 있어요.",
  [OrderStatus.CONFIRMED]:
    "예약확정: 예약이 확정됐어요. 케이크를 준비해 주세요. 픽업 시각이 되면 자동으로 픽업대기로 바뀌어요.",
  [OrderStatus.PICKUP_PENDING]:
    "픽업대기: 픽업 시각이 됐어요. 손님이 가져가면 '픽업 완료', 오지 않으면 '노쇼'를 눌러 주세요. 환불해야 하면 예약을 취소하고 환불할 수 있어요.",
  [OrderStatus.PICKUP_COMPLETED]:
    "픽업완료: 손님이 케이크를 가져갔어요. 이제 손님이 후기를 쓸 수 있어요.",
  [OrderStatus.NO_SHOW]: "노쇼: 손님이 픽업하러 오지 않아 노쇼로 처리한 예약이에요.",
  [OrderStatus.CANCEL_COMPLETED]:
    "취소완료: 입금 전에 손님이나 사장님이 취소했거나, 입금 마감이 지나 자동으로 취소된 예약이에요.",
  [OrderStatus.CANCEL_REFUND_PENDING]:
    "취소환불대기: 입금한 뒤 취소된 예약이에요(손님 요청 또는 사장님 취소). 손님 계좌로 송금한 뒤 '취소환불 완료'를 눌러 주세요.",
  [OrderStatus.CANCEL_REFUND_COMPLETED]: "취소환불완료: 환불까지 마친 예약이에요.",
};

/** 현재 주문 상태에 대한 판매자용 안내 (`ORDER_STATUS_SELLER_FLOW_LINE_BY_STATUS`와 동일 문장) */
export function getOrderStatusSellerHint(status: OrderStatus): string {
  return ORDER_STATUS_SELLER_FLOW_LINE_BY_STATUS[status] ?? "";
}

/**
 * 안내 문장에서 맨 앞 `상태명: ` 접두를 제거한 본문.
 * 배지로 상태명을 표시할 때 중복을 피하기 위해 사용합니다.
 */
export function getOrderStatusSellerHintBody(status: OrderStatus): string {
  const full = ORDER_STATUS_SELLER_FLOW_LINE_BY_STATUS[status] ?? "";
  const idx = full.indexOf(": ");
  if (idx === -1) return full.trim();
  return full.slice(idx + 2).trim();
}
