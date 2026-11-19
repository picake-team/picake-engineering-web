/** 금액을 "12,000원"으로(주문·상품·통계·인쇄 공용) */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
