/**
 * PC 주문 목록 줄(기획 I-54, 시안 D).
 *
 * - 칸이 넓으면(600 이상) 표: 픽업 | 상품 | 예약자 | 금액 | 상태 | 할 일
 * - 좁으면(태블릿·옆에 상세가 열린 좁은 칸) 두 줄: 픽업 시각 · 상품 / 예약자 · 금액 · 상태, 할 일은 오른쪽
 * - 줄 전체를 누르면 그 주문 상세(오른쪽 칸). 바로 처리 버튼(예약 확정·픽업 완료)은 줄 안 따로(휴대폰 카드 아래 버튼과 같은 처리)
 * - 고른 줄은 회색 바탕(테두리는 쓰지 않음 — 디자인 기준 "고른 표시는 하나만")
 * 내용(말·금액·상태 이름)은 휴대폰 주문 카드와 같은 함수를 쓴다.
 */
import React from "react";
import { Link } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { StatusPill } from "@/apps/web-seller/common/ui/Badge";
import { NO_REPLAY } from "@/apps/web-seller/common/constants/replay.constant";
import {
  formatKstMonthDayWeek,
  formatKstMonthDayWeekTime,
  kstTime,
} from "@/apps/web-seller/common/utils/kst-date.util";
import type {
  OrderResponseDto,
  OrderStatus,
} from "@/apps/web-seller/features/order/types/order.dto";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import {
  ORDER_ACTION_LABEL,
  isCanceledOrNoShow,
  orderExpiryMarks,
  orderItemsLine,
  orderSubline,
  statusTone,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { formatWon } from "@/apps/web-seller/common/utils/won.util";

/** 표로 그리는 칸 넓이(이보다 좁으면 두 줄) */
export const ORDER_TABLE_MIN_WIDTH = 600;

const WIDE_COLS = "grid-cols-[124px_minmax(0,1fr)_84px_88px_92px_108px]";

export function OrderTableHead() {
  return (
    <div
      role="row"
      className={cx(
        "grid items-center gap-3 border-b border-ink-100 px-4 py-2.5 text-caption font-semibold text-ink-600",
        WIDE_COLS,
      )}
    >
      <span role="columnheader">픽업</span>
      <span role="columnheader">상품</span>
      <span role="columnheader">예약자</span>
      <span role="columnheader" className="text-right">
        금액
      </span>
      <span role="columnheader">상태</span>
      <span role="columnheader">할 일</span>
    </div>
  );
}

/** 칸 묶음 머리(예약 확인 1 · 확인해야 손님이 입금할 수 있어요) */
export function OrderGroupRow({
  id,
  label,
  count,
  hint,
}: {
  id?: string;
  label: string;
  count?: number;
  hint?: string;
}) {
  return (
    <h2
      id={id}
      className="flex scroll-mt-2 items-baseline gap-2 border-b border-ink-100 bg-white px-4 pb-2 pt-4 text-body font-bold"
    >
      <span className="text-ink-900">{label}</span>
      {count !== undefined ? (
        <span className="tabular-nums text-ink-600">{count.toLocaleString("ko-KR")}</span>
      ) : null}
      {hint ? (
        <span className="ml-auto truncate text-caption font-normal text-ink-600">{hint}</span>
      ) : null}
    </h2>
  );
}

/** 지난 주문 날짜 머리 */
export function OrderDateRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex justify-between border-b border-ink-100 px-4 pb-2 pt-4 text-sub font-bold text-ink-700">
      <span>{label}</span>
      <span className="font-normal text-ink-600">{count}건</span>
    </div>
  );
}

export function OrderTableRow({
  order,
  to,
  wide,
  selected,
  now,
  quickAction,
  quickTone = "primary",
  onQuickAction,
  searching = false,
}: {
  order: OrderResponseDto;
  /** 누르면 갈 주소(찾기·탭 조건을 붙인 상세) */
  to: string;
  wide: boolean;
  selected: boolean;
  now: number;
  quickAction?: OrderStatus;
  quickTone?: "primary" | "secondary";
  onQuickAction?: (order: OrderResponseDto, to: OrderStatus) => void;
  /** 찾기 결과 줄(금액 뒤 글을 예약자로 — 휴대폰 찾기 결과와 같음) */
  searching?: boolean;
}) {
  // 처리할 주문은 흐리게 하지 않는다 — 취소·노쇼만(휴대폰 지난 주문 줄과 같음)
  const dim = isCanceledOrNoShow(order.orderStatus);
  const status = getOrderStatusLabel(order.orderStatus);
  const name = order.reservationContactName?.trim() || "예약자 미입력";
  const items = orderItemsLine(order);
  const meta = orderSubline(order, now, searching ? "search" : "group");
  const marks = orderExpiryMarks(order);
  const action =
    quickAction && onQuickAction ? (
      <button
        type="button"
        onClick={() => onQuickAction(order, quickAction)}
        className={cx(
          "press pointer-events-auto relative z-[2] inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-control px-3 text-sub font-bold",
          quickTone === "primary"
            ? "bg-brand text-white"
            : "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
        )}
      >
        {ORDER_ACTION_LABEL[quickAction]}
      </button>
    ) : null;

  return (
    <div
      role="row"
      aria-selected={selected}
      className={cx(
        "group relative border-b border-ink-100 transition-colors duration-fast",
        selected ? "bg-ink-50" : "hover:bg-ink-50/60",
      )}
    >
      <Link
        to={to}
        aria-current={selected ? "true" : undefined}
        aria-label={`${formatKstMonthDayWeekTime(order.pickupDate)} 픽업, ${items}, ${status}`}
        className="absolute inset-0 z-[1] rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
      />
      {wide ? (
        <div className={cx("pointer-events-none grid items-center gap-3 px-4 py-3", WIDE_COLS)}>
          <span className="flex flex-col">
            <span className="text-caption text-ink-600">
              {formatKstMonthDayWeek(order.pickupDate)}
            </span>
            <span
              className={cx(
                "text-body font-bold tabular-nums",
                dim ? "text-ink-600" : "text-ink-900",
              )}
            >
              {kstTime(order.pickupDate)}
            </span>
          </span>
          <span className="flex min-w-0 flex-col">
            <span
              className={cx(
                "truncate text-body font-semibold",
                dim ? "text-ink-600" : "text-ink-900",
              )}
            >
              {items}
            </span>
            <span className={cx(NO_REPLAY, "truncate text-caption text-ink-600")}>{meta}</span>
          </span>
          <span className={cx(NO_REPLAY, "truncate text-sub text-ink-700")}>{name}</span>
          <span className="text-right text-sub font-semibold tabular-nums text-ink-900">
            {formatWon(order.totalPrice)}
          </span>
          <span className="flex flex-col items-start gap-1">
            <StatusPill tone={statusTone(order.orderStatus)}>{status}</StatusPill>
            {marks.length ? (
              <span className="text-caption text-ink-600">{marks.join(" · ")}</span>
            ) : null}
          </span>
          <span className="flex">{action}</span>
        </div>
      ) : (
        <div className="pointer-events-none flex items-center gap-3 px-4 py-3">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              className={cx(
                "text-body font-bold tabular-nums",
                dim ? "text-ink-600" : "text-ink-900",
              )}
            >
              {formatKstMonthDayWeekTime(order.pickupDate)} 픽업
            </span>
            <span className={cx("line-clamp-2 text-body", dim ? "text-ink-600" : "text-ink-900")}>
              {items}
            </span>
            <span
              className={cx(
                NO_REPLAY,
                "flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-600",
              )}
            >
              <StatusPill tone={statusTone(order.orderStatus)}>{status}</StatusPill>
              {marks.length ? <span>{marks.join(" · ")}</span> : null}
              {/* 휴대폰 카드와 같은 "금액 · 할 일 정보"(입금자명·입금 마감·예약자) */}
              <span className="min-w-0">
                <span className="tabular-nums">{formatWon(order.totalPrice)}</span> · {meta}
              </span>
            </span>
          </span>
          {action}
        </div>
      )}
    </div>
  );
}

export function OrderListEmpty({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[240px] flex-1 flex-col px-4">{children}</div>;
}
