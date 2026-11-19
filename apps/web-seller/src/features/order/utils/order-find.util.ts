/**
 * 주문 목록의 찾기·거르기 조건과 주소(?tab=&q=&ps=&pe=&os=&oe=&sort=&group=).
 * 휴대폰 주문 목록과 PC 주문 화면(기획 I-54)이 같이 쓴다 — 홈 "처리할 일"·알림 링크가 이 주소를 연다.
 */
import { OrderSortBy } from "@/apps/web-seller/features/order/types/order.dto";
import type { OrderTab } from "@/apps/web-seller/features/order/utils/order-mobile.util";
import type { OrderDateFilter } from "@/apps/web-seller/features/order/hooks/queries/useOrderMobileQuery";

export interface OrderFindState extends OrderDateFilter {
  query: string;
  sortBy?: OrderSortBy;
}

export const EMPTY_FIND: OrderFindState = { query: "" };

export const ORDER_LIST_TABS: OrderTab[] = ["todo", "doing", "past"];

/** 탭·검색마다 기본 정렬(SC-74 ③) */
export function defaultSortFor(tab: OrderTab, searching: boolean): OrderSortBy {
  if (searching) return OrderSortBy.LATEST;
  return tab === "past" ? OrderSortBy.PICKUP_DESC : OrderSortBy.PICKUP_ASC;
}

export const SORT_LABEL: Record<OrderSortBy, string> = {
  [OrderSortBy.PICKUP_ASC]: "픽업 가까운 순",
  [OrderSortBy.PICKUP_DESC]: "픽업 최근 순",
  [OrderSortBy.LATEST]: "최신 주문 순",
  [OrderSortBy.OLDEST]: "오래된 주문 순",
  [OrderSortBy.PRICE_DESC]: "금액 높은 순",
  [OrderSortBy.PRICE_ASC]: "금액 낮은 순",
};

export function readOrderFind(params: URLSearchParams): OrderFindState {
  const sort = params.get("sort");
  return {
    query: params.get("q") ?? "",
    pickupStartDate: params.get("ps") ?? undefined,
    pickupEndDate: params.get("pe") ?? undefined,
    startDate: params.get("os") ?? undefined,
    endDate: params.get("oe") ?? undefined,
    sortBy: sort && sort in SORT_LABEL ? (sort as OrderSortBy) : undefined,
  };
}

export function writeOrderFind(params: URLSearchParams, find: OrderFindState) {
  const set = (k: string, v?: string) => (v ? params.set(k, v) : params.delete(k));
  set("q", find.query.trim() || undefined);
  set("ps", find.pickupStartDate);
  set("pe", find.pickupEndDate);
  set("os", find.startDate);
  set("oe", find.endDate);
  set("sort", find.sortBy);
}

export function orderDateFilterOf(find: OrderFindState): OrderDateFilter {
  return {
    pickupStartDate: find.pickupStartDate,
    pickupEndDate: find.pickupEndDate,
    startDate: find.startDate,
    endDate: find.endDate,
  };
}

function shortRange(start?: string, end?: string) {
  const f = (v?: string) => (v ? v.slice(5).replace("-", ".") : "");
  return `${f(start)} ~ ${f(end)}`.trim();
}

/** 걸러 둔 조건 한 줄(기간·기본과 다른 정렬). 없으면 null */
export function orderFilterSummary(find: OrderFindState, tab: OrderTab): string | null {
  const parts: string[] = [];
  if (find.pickupStartDate || find.pickupEndDate)
    parts.push(`픽업 ${shortRange(find.pickupStartDate, find.pickupEndDate)}`);
  if (find.startDate || find.endDate)
    parts.push(`주문 ${shortRange(find.startDate, find.endDate)}`);
  if (find.sortBy && find.sortBy !== defaultSortFor(tab, Boolean(find.query.trim())))
    parts.push(SORT_LABEL[find.sortBy]);
  return parts.length ? parts.join(" · ") : null;
}
