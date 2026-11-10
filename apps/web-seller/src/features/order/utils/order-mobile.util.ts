/**
 * 휴대폰 화면(판매자 앱 I-48) 주문 규칙: 탭·할 일 칸·배지 색·단계 막대·처리 버튼·카드 글자.
 * 기획: SC-70 홈 "처리할 주문", SC-73 주문 목록, SC-75 상태 안내, SC-76 주문 상세, SC-77 처리 창.
 */
import type { StatusTone } from "@/apps/web-seller/common/ui/Badge";
import type { TaskIconName } from "@/apps/web-seller/common/ui/icons";
import {
  formatKstMonthDayTime,
  formatRemainingHm,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { PAYMENT_PENDING_VALIDITY_MS } from "@/apps/web-seller/features/order/constants/order-lifecycle.constant";
import {
  OrderStatus,
  type OrderItemResponseDto,
  type OrderResponseDto,
} from "@/apps/web-seller/features/order/types/order.dto";
import { isSellerTransitionAllowed } from "@/apps/web-seller/features/order/utils/order-seller-transition.util";

export type OrderTab = "todo" | "doing" | "past";

export interface OrderTaskGroup {
  key: "confirm" | "deposit" | "pickup" | "refund" | "awaitDeposit" | "awaitPickup";
  /** 할 일 이름(홈 줄·주문 탭 칸 제목) */
  label: string;
  status: OrderStatus;
  tab: Exclude<OrderTab, "past">;
  /** 목록 카드 아래 바로 처리 버튼(확인 창 한 번) */
  quickAction?: OrderStatus;
  /** 홈 줄 한 줄 안내(제안) */
  homeHint?: string;
  /** 상태 안내 창 한 줄(제안) */
  guideHint: string;
  icon?: TaskIconName;
}

export const ORDER_TASK_GROUPS: readonly OrderTaskGroup[] = [
  {
    key: "confirm",
    label: "예약 확인",
    status: OrderStatus.RESERVATION_REQUESTED,
    tab: "todo",
    homeHint: "확인해야 손님이 입금할 수 있어요",
    guideHint: "예약 확인을 눌러야 손님이 입금할 수 있어요",
    icon: "confirm",
  },
  {
    key: "deposit",
    label: "입금 확인",
    status: OrderStatus.PAYMENT_COMPLETED,
    tab: "todo",
    quickAction: OrderStatus.CONFIRMED,
    homeHint: "통장을 보고 확정해요",
    guideHint: "통장을 보고 예약 확정",
    icon: "deposit",
  },
  {
    key: "pickup",
    label: "픽업 처리",
    status: OrderStatus.PICKUP_PENDING,
    tab: "todo",
    quickAction: OrderStatus.PICKUP_COMPLETED,
    homeHint: "손님이 가져갔으면 픽업 완료",
    guideHint: "픽업 완료 또는 노쇼",
    icon: "pickup",
  },
  {
    key: "refund",
    label: "환불 처리",
    status: OrderStatus.CANCEL_REFUND_PENDING,
    tab: "todo",
    homeHint: "송금하고 환불 완료",
    guideHint: "환불 송금 뒤 취소환불 완료",
    icon: "refund",
  },
  {
    key: "awaitDeposit",
    label: "입금 기다리는 중",
    status: OrderStatus.PAYMENT_PENDING,
    tab: "doing",
    guideHint: "마감이 지나면 자동 취소",
  },
  {
    key: "awaitPickup",
    label: "픽업 기다리는 중",
    status: OrderStatus.CONFIRMED,
    tab: "doing",
    quickAction: OrderStatus.PICKUP_COMPLETED,
    guideHint: "픽업 시각이 되면 자동으로 픽업대기",
  },
];

/** 지난 주문 탭(끝난 주문) */
export const FINISHED_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PICKUP_COMPLETED,
  OrderStatus.NO_SHOW,
  OrderStatus.CANCEL_COMPLETED,
  OrderStatus.CANCEL_REFUND_COMPLETED,
];

/** 홈 주간 달력 점·고른 날 픽업에서 빼는 취소된 주문 */
export const CANCELED_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.CANCEL_COMPLETED,
  OrderStatus.CANCEL_REFUND_PENDING,
  OrderStatus.CANCEL_REFUND_COMPLETED,
];

export function groupsForTab(tab: Exclude<OrderTab, "past">): OrderTaskGroup[] {
  return ORDER_TASK_GROUPS.filter((g) => g.tab === tab);
}

export function groupByKey(key: string | null | undefined): OrderTaskGroup | undefined {
  return ORDER_TASK_GROUPS.find((g) => g.key === key);
}

/** 상태 → 탭 */
export function tabForStatus(status: OrderStatus): OrderTab {
  return ORDER_TASK_GROUPS.find((g) => g.status === status)?.tab ?? "past";
}

/** 배지 색: 사장님 차례(처리할 것) / 기다림(진행 중) / 끝(지난 주문) */
export function statusTone(status: OrderStatus): StatusTone {
  const tab = tabForStatus(status);
  if (tab === "todo") return "turn";
  if (tab === "doing") return "wait";
  return "done";
}

/** 지난 주문 줄을 흐리게(취소·노쇼) */
export function isDimmedPastStatus(status: OrderStatus): boolean {
  return status !== OrderStatus.PICKUP_COMPLETED;
}

export const ORDER_STEP_LABELS = [
  "예약신청",
  "입금대기",
  "입금완료",
  "예약확정",
  "픽업대기",
  "픽업완료",
] as const;

const MAIN_FLOW: readonly OrderStatus[] = [
  OrderStatus.RESERVATION_REQUESTED,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAYMENT_COMPLETED,
  OrderStatus.CONFIRMED,
  OrderStatus.PICKUP_PENDING,
  OrderStatus.PICKUP_COMPLETED,
];

/**
 * 단계 막대. 정상 단계 밖(취소·환불·노쇼)은 지나온 단계까지만 칠하고 지금 단계 표시는 없다(SC-76 ①).
 * 지나온 단계는 알 수 있는 만큼: 취소환불은 입금까지, 입금 전 취소는 입금대기를 거쳤으면 입금대기까지, 노쇼는 픽업대기까지.
 */
export function orderStepState(order: Pick<OrderResponseDto, "orderStatus" | "paymentPendingAt">): {
  current: number | null;
  filledThrough: number;
} {
  const i = MAIN_FLOW.indexOf(order.orderStatus);
  if (i >= 0) return { current: i, filledThrough: i };
  switch (order.orderStatus) {
    case OrderStatus.CANCEL_REFUND_PENDING:
    case OrderStatus.CANCEL_REFUND_COMPLETED:
      return { current: null, filledThrough: 2 };
    case OrderStatus.CANCEL_COMPLETED:
      return { current: null, filledThrough: order.paymentPendingAt ? 1 : 0 };
    case OrderStatus.NO_SHOW:
      return { current: null, filledThrough: 4 };
    default:
      return { current: null, filledThrough: -1 };
  }
}

/** 처리 버튼(바꿀 상태) 이름. 입금한 주문 취소(취소환불대기)도 사장님 말로 "예약 취소"(PC는 "취소환불대기로 변경") */
export const ORDER_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.PAYMENT_PENDING]: "예약 확인",
  [OrderStatus.CONFIRMED]: "예약 확정",
  [OrderStatus.PICKUP_COMPLETED]: "픽업 완료",
  [OrderStatus.CANCEL_COMPLETED]: "예약 취소",
  [OrderStatus.NO_SHOW]: "노쇼 처리",
  [OrderStatus.CANCEL_REFUND_PENDING]: "예약 취소",
  [OrderStatus.CANCEL_REFUND_COMPLETED]: "취소환불 완료",
};

export interface DetailActions {
  /** 오른쪽 주황 주 버튼 */
  primary?: OrderStatus;
  /** 왼쪽 흰 버튼 하나 */
  secondary?: OrderStatus;
  /** 보조가 둘 이상이면 "다른 처리"로 접는다 */
  more?: OrderStatus[];
}

/** 주문 상세 아래 처리 버튼(SC-76 ⑧). 서버 전환 규칙을 다시 확인해 둘 다 맞는 것만 */
export function detailActionsFor(status: OrderStatus): DetailActions {
  const allowed = (to: OrderStatus) => isSellerTransitionAllowed(status, to);
  let plan: DetailActions;
  switch (status) {
    case OrderStatus.RESERVATION_REQUESTED:
      plan = { secondary: OrderStatus.CANCEL_COMPLETED, primary: OrderStatus.PAYMENT_PENDING };
      break;
    case OrderStatus.PAYMENT_PENDING:
      plan = { secondary: OrderStatus.CANCEL_COMPLETED, primary: OrderStatus.CONFIRMED };
      break;
    case OrderStatus.PAYMENT_COMPLETED:
      plan = { secondary: OrderStatus.CANCEL_REFUND_PENDING, primary: OrderStatus.CONFIRMED };
      break;
    case OrderStatus.CONFIRMED:
      plan = {
        secondary: OrderStatus.CANCEL_REFUND_PENDING,
        primary: OrderStatus.PICKUP_COMPLETED,
      };
      break;
    case OrderStatus.PICKUP_PENDING:
      plan = {
        more: [OrderStatus.NO_SHOW, OrderStatus.CANCEL_REFUND_PENDING],
        primary: OrderStatus.PICKUP_COMPLETED,
      };
      break;
    case OrderStatus.CANCEL_REFUND_PENDING:
      plan = { primary: OrderStatus.CANCEL_REFUND_COMPLETED };
      break;
    default:
      plan = {};
  }
  return {
    primary: plan.primary && allowed(plan.primary) ? plan.primary : undefined,
    secondary: plan.secondary && allowed(plan.secondary) ? plan.secondary : undefined,
    more: plan.more?.filter(allowed),
  };
}

/** 주문 항목에서 사이즈 이름 하나(케이크가 여러 개면 모두 같을 때만) */
function singleSizeName(items: Pick<OrderItemResponseDto, "sizeDisplayName">[]): string | null {
  const names = Array.from(new Set(items.map((i) => i.sizeDisplayName?.trim()).filter(Boolean)));
  return names.length === 1 ? (names[0] as string) : null;
}

/** 카드 둘째 줄: "무화과 케이크 2호 ×1" (사이즈가 이름에 이미 있으면 빼고) */
export function orderItemsLine(
  order: Pick<OrderResponseDto, "productName" | "totalQuantity" | "orderItems">,
): string {
  const name = order.productName?.trim() || "상품";
  const size = singleSizeName(order.orderItems ?? []);
  const withSize = size && !name.includes(size) ? `${name} ${size}` : name;
  return `${withSize} ×${order.totalQuantity}`;
}

/** 홈 고른 날 픽업 줄: "딸기 생크림 케이크 1호", 여러 개면 "레터링 미니 케이크 2개" */
export function orderItemsShort(
  order: Pick<OrderResponseDto, "productName" | "totalQuantity" | "orderItems">,
): string {
  const name = order.productName?.trim() || "상품";
  const size = singleSizeName(order.orderItems ?? []);
  const withSize = size && !name.includes(size) ? `${name} ${size}` : name;
  return order.totalQuantity > 1 ? `${withSize} ${order.totalQuantity}개` : withSize;
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 입금 마감 시각(서버 값, 없으면 입금대기 진입 + 12시간) */
export function paymentDeadlineMs(
  order: Pick<OrderResponseDto, "paymentPendingDeadlineAt" | "paymentPendingAt" | "createdAt">,
): number {
  if (order.paymentPendingDeadlineAt) return new Date(order.paymentPendingDeadlineAt).getTime();
  const start = order.paymentPendingAt ?? order.createdAt;
  return new Date(start).getTime() + PAYMENT_PENDING_VALIDITY_MS;
}

/** 카드 셋째 줄 뒤쪽: 상태마다 그 주문에서 지금 필요한 것(SC-73 ④) */
export function orderCardMeta(order: OrderResponseDto, now: number): string {
  const name = (v?: string | null) => v?.trim() || null;
  switch (order.orderStatus) {
    case OrderStatus.PAYMENT_COMPLETED:
      return name(order.depositorName)
        ? `입금자명 ${name(order.depositorName)}`
        : `주문 ${formatKstMonthDayTime(order.createdAt)}`;
    case OrderStatus.PAYMENT_PENDING: {
      const left = paymentDeadlineMs(order) - now;
      return left > 0 ? `입금 마감까지 ${formatRemainingHm(left)}` : "입금 마감 지남";
    }
    case OrderStatus.CONFIRMED:
    case OrderStatus.PICKUP_PENDING:
      return name(order.reservationContactName)
        ? `예약자 ${name(order.reservationContactName)}`
        : `주문 ${formatKstMonthDayTime(order.createdAt)}`;
    default:
      return `주문 ${formatKstMonthDayTime(order.createdAt)}`;
  }
}

/**
 * 검색어 하나로 예약자 이름·전화번호(뒷자리 4자리 이상)·상품명·주문번호를 함께 찾는다(SC-74 ①).
 * 픽업하러 온 손님을 이름이나 번호 뒷자리로 바로 찾기 위해서다(서버 `keyword`)
 */
export function searchParamsFor(query: string): { keyword?: string } {
  const q = query.trim();
  return q ? { keyword: q } : {};
}

/** 휴대폰 화면 "전화"·"문자" 링크용 번호(숫자·+만) */
export function telHref(phone: string, kind: "tel" | "sms"): string {
  return `${kind}:${phone.replace(/[^\d+]/g, "")}`;
}
