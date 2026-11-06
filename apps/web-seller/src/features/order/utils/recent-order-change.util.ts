/**
 * 이 화면에서 방금 상태를 바꾼 주문. 실시간 알림(소켓)이 같은 주문으로 오면 안내 띠·소리를 겹쳐 띄우지 않는다
 * ("주문 상태가 변경되었습니다." 하나만). 알림 목록에는 그대로 남는다.
 */
const changedAt = new Map<string, number>();
const WINDOW_MS = 15_000;

export function markOrderChangedHere(orderId: string, now = Date.now()) {
  changedAt.set(orderId, now);
}

export function wasOrderChangedHere(orderId: string, now = Date.now()): boolean {
  const at = changedAt.get(orderId);
  if (at === undefined) return false;
  if (now - at > WINDOW_MS) {
    changedAt.delete(orderId);
    return false;
  }
  return true;
}
