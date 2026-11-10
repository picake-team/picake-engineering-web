/**
 * 주문 목록 카드와 줄 (SC-73 디자인 2-D2 · 지난 B · 검색 결과, SC-70 홈 고른 날 픽업).
 */
import React from "react";
import { Link } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { StatusPill } from "@/apps/web-seller/common/ui/Badge";
import { Card, CardFooterButton, Thumb } from "@/apps/web-seller/common/ui/Surface";
import {
  formatKstMonthDayTime,
  formatKstMonthDayWeekTime,
  kstTime,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import type {
  OrderResponseDto,
  OrderStatus,
} from "@/apps/web-seller/features/order/types/order.dto";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import {
  ORDER_ACTION_LABEL,
  formatWon,
  isDimmedPastStatus,
  orderCardMeta,
  orderItemsLine,
  orderItemsShort,
  statusTone,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";

export function orderDetailPath(order: Pick<OrderResponseDto, "storeId" | "id">) {
  return ROUTES.STORE_DETAIL_ORDERS_DETAIL(order.storeId, order.id);
}

/** 주문에 저장된 첫 사진(주문 항목 참고 사진이 아니라 상품 사진) */
export function orderThumbSrc(order: Pick<OrderResponseDto, "productImages">): string | null {
  return order.productImages?.[0] ?? null;
}

/** 칸 안 주문 카드: 사진 48 · 픽업 일시 16/700 · 상품 16 · 금액·필요한 정보 14. 바로 처리 버튼은 카드 아래 가득 */
export function OrderCard({
  order,
  now,
  showStatus = false,
  quickAction,
  onQuickAction,
  quickTone = "primary",
}: {
  order: OrderResponseDto;
  now: number;
  /** 검색 결과처럼 칸이 없을 때 상태 배지 */
  showStatus?: boolean;
  quickAction?: OrderStatus;
  onQuickAction?: (order: OrderResponseDto, to: OrderStatus) => void;
  /** 기다리는 칸(진행 중 탭)은 흰 보조 버튼 */
  quickTone?: "primary" | "secondary";
}) {
  return (
    <Card
      footer={
        quickAction && onQuickAction ? (
          <CardFooterButton tone={quickTone} onClick={() => onQuickAction(order, quickAction)}>
            {ORDER_ACTION_LABEL[quickAction]}
          </CardFooterButton>
        ) : undefined
      }
    >
      <Link to={orderDetailPath(order)} className="flex gap-3 p-4 active:bg-ink-50">
        <Thumb size={48} src={orderThumbSrc(order)} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-body font-bold text-ink-900">
              {formatKstMonthDayWeekTime(order.pickupDate)} 픽업
            </span>
            {showStatus ? (
              <StatusPill tone={statusTone(order.orderStatus)}>
                {getOrderStatusLabel(order.orderStatus)}
              </StatusPill>
            ) : null}
          </span>
          <span className="text-body text-ink-900">{orderItemsLine(order)}</span>
          <span className="text-sub text-ink-600">
            {formatWon(order.totalPrice)} ·{" "}
            {/* 검색 결과(칸 없음)는 상태 배지 + 예약자 이름(이름·번호 뒷자리로 찾은 손님이 맞는지 바로 보이게).
                이름이 없으면 주문 시각 */}
            {showStatus
              ? order.reservationContactName?.trim()
                ? `예약자 ${order.reservationContactName.trim()}`
                : `주문 ${formatKstMonthDayTime(order.createdAt)}`
              : orderCardMeta(order, now)}
          </span>
        </span>
      </Link>
    </Card>
  );
}

/** 지난 주문 줄: 시각 · 상품 · 금액 · 상태 글자(배지 없이). 취소·노쇼는 흐리게 */
export function PastOrderRow({ order }: { order: OrderResponseDto }) {
  const dim = isDimmedPastStatus(order.orderStatus);
  return (
    <Link
      to={orderDetailPath(order)}
      className="flex items-center gap-3 border-b border-ink-100 py-3 active:bg-ink-50"
    >
      <span
        className={cx(
          "w-[46px] shrink-0 text-body font-bold tabular-nums",
          dim ? "text-ink-600" : "text-ink-900",
        )}
      >
        {kstTime(order.pickupDate)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cx("text-body font-semibold", dim ? "text-ink-600" : "text-ink-900")}>
          {orderItemsLine(order)}
        </span>
        <span className="text-caption text-ink-600">{formatWon(order.totalPrice)}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1 text-caption text-ink-600">
        <span className="font-bold">{getOrderStatusLabel(order.orderStatus)}</span>
        {order.paymentPendingExpiredAt ? <span>기한 만료</span> : null}
      </span>
    </Link>
  );
}

/** 홈 고른 날 픽업 줄: 시각 52 · 상품(두 줄까지) · 예약자 · 배지 */
export function PickupRow({ order, last }: { order: OrderResponseDto; last?: boolean }) {
  return (
    <Link
      to={orderDetailPath(order)}
      className={cx(
        "flex min-h-14 items-center gap-3 active:bg-ink-50",
        !last && "border-b border-ink-100",
      )}
    >
      <span className="w-[52px] shrink-0 text-body font-bold tabular-nums text-ink-900">
        {kstTime(order.pickupDate)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-body font-semibold text-ink-900">
          {orderItemsShort(order)}
        </span>
        <span className="text-sub text-ink-600">
          {order.reservationContactName?.trim() || "예약자 미입력"}
        </span>
      </span>
      <StatusPill tone={statusTone(order.orderStatus)}>
        {getOrderStatusLabel(order.orderStatus)}
      </StatusPill>
    </Link>
  );
}

/** 처리 창 맨 위 주문 한 줄: 사진 44 · 상품 16/600 · "픽업 일시 · 지금 상태" 13 */
export function OrderSummaryBox({ order }: { order: OrderResponseDto }) {
  return (
    <div className="flex items-center gap-3 rounded-control border border-ink-100 px-4 py-3">
      <Thumb size={44} src={orderThumbSrc(order)} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="line-clamp-2 text-body font-semibold text-ink-900">
          {orderItemsLine(order)}
        </span>
        <span className="text-caption text-ink-600">
          {formatKstMonthDayWeekTime(order.pickupDate)} 픽업 ·{" "}
          {getOrderStatusLabel(order.orderStatus)}
        </span>
      </span>
    </div>
  );
}

/** 칸 제목: 이름 16/700 + 수 16/700 회색 */
export function OrderGroupTitle({
  label,
  count,
  id,
}: {
  label: string;
  count?: number;
  id?: string;
}) {
  return (
    <h2 id={id} className="mt-2 flex scroll-mt-28 items-baseline gap-2 text-body font-bold">
      <span className="text-ink-900">{label}</span>
      {count !== undefined ? (
        <span className="tabular-nums text-ink-600">{count.toLocaleString("ko-KR")}</span>
      ) : null}
    </h2>
  );
}

/** 지난 주문 날짜 소제목: 날짜 14/700 #4E4E4B · 건수 14 회색 */
export function PastDateHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex justify-between pb-1 pt-3 text-sub font-bold text-ink-700">
      <span>{label}</span>
      <span className="font-normal text-ink-600">{count}건</span>
    </div>
  );
}

export function LoadMoreSentinel({
  hasNext,
  loading,
  onLoad,
}: {
  hasNext: boolean;
  loading: boolean;
  onLoad: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const loadRef = React.useRef(onLoad);
  loadRef.current = onLoad;
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !hasNext || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadRef.current();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, loading]);
  if (!hasNext) return null;
  return (
    <div ref={ref} className="flex justify-center py-3" aria-busy={loading}>
      {loading ? (
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-ink-100 border-t-brand" />
      ) : null}
    </div>
  );
}
