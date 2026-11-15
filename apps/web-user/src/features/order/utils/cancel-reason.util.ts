export type CancelReasonOption = "CHANGE_OF_MIND" | "ORDER_MISTAKE" | "OTHER";

export const CANCEL_REASON_LABELS: Record<CancelReasonOption, string> = {
  CHANGE_OF_MIND: "단순 변심",
  ORDER_MISTAKE: "주문 실수 (디자인 변경, 옵션 누락 등)",
  OTHER: "기타",
};

/**
 * 분석 이벤트에 보낼 취소 사유: 고른 사유 이름만. "기타"에 손님이 직접 쓴 글은 보내지 않는다
 * (개인정보·연락처가 들어갈 수 있음, 11-15 검토)
 */
export function cancelReasonForEvent(reason: string): string {
  const fixed = [CANCEL_REASON_LABELS.CHANGE_OF_MIND, CANCEL_REASON_LABELS.ORDER_MISTAKE];
  return fixed.includes(reason) ? reason : CANCEL_REASON_LABELS.OTHER;
}
