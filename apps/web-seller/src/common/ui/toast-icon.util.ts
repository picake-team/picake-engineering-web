import type { AlertItem } from "@/apps/web-seller/common/store/alert.store";
import type { IconName, TaskIconName } from "@/apps/web-seller/common/ui/icons";

export type ToastIcon = { kind: "task"; name: TaskIconName } | { kind: "line"; name: IconName };

/**
 * 안내 띠 아이콘을 내용에 맞춰 고른다. 주문 알림은 홈 "처리할 주문" 아이콘과 같게(예약 확인·입금·픽업·환불),
 * 그 밖에는 한 일(복사·삭제·저장)이나 문제(끊김·오류)에 맞는 선 아이콘
 */
export function toastIconFor(
  a: Pick<AlertItem, "severity" | "title" | "message" | "onClick">,
): ToastIcon {
  const text = `${a.title ?? ""} ${a.message}`;
  if (a.onClick) {
    // 주문 알림은 제목으로만 고른다(내용에는 늘 "… 픽업"이 들어 있다). 서버 seller-order-notification-copy 제목
    const title = a.title ?? "";
    if (/취소/.test(title)) return { kind: "line", name: "close" };
    if (/환불/.test(title)) return { kind: "task", name: "refund" };
    if (/입금/.test(title)) return { kind: "task", name: "deposit" };
    if (/픽업/.test(title)) return { kind: "task", name: "pickup" };
    if (/노쇼/.test(title)) return { kind: "line", name: "person" };
    if (/예약/.test(title)) return { kind: "task", name: "confirm" };
    return { kind: "line", name: "bell" };
  }
  if (a.severity === "error" || a.severity === "warning") {
    if (/인터넷|연결/.test(text)) return { kind: "line", name: "offline" };
    return { kind: "line", name: "warning" };
  }
  if (/복사/.test(text)) return { kind: "line", name: "copy" };
  if (/삭제|지웠/.test(text)) return { kind: "line", name: "trash" };
  return { kind: "line", name: "check" };
}
