/**
 * PC 홈 주간 보기(기획 I-54, 시안 D): 요일마다 열을 두고 그날 픽업(Picake 주문 + 직접 적은 주문)을 시각 순 카드로.
 * 케이크 가게 서비스(하이케이크 주간 보기·토스 예약 달력)가 기본으로 쓰는 모양이다.
 * 휴대폰 홈의 주간 달력 + 고른 날 픽업과 같은 데이터(useDayPickups)를 넓게 편 것이다.
 *
 * - 오늘 열은 머리 아래 주황 줄 + 주황 글씨, 쉬는 날은 "휴무", 그날만 바꾼 날은 "바꿈", 대목(이브 등)은 작은 글씨
 * - 카드를 누르면 그 주문(직접 적은 주문은 그 상세)
 * - 픽업 완료·취소·노쇼는 흐리게
 */
import { Link } from "react-router-dom";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { StatusPill } from "@/apps/web-seller/common/ui/Badge";
import { NO_REPLAY } from "@/apps/web-seller/common/constants/replay.constant";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import {
  addDaysToKey,
  dayOfKey,
  formatKeyMonthDayWeek,
  kstTime,
  weekdayLabel,
} from "@/apps/web-seller/common/utils/kst-date.util";
import { cakeDayOf } from "@/apps/web-seller/common/utils/cake-days.util";
import { mergeDayPickups } from "@/apps/web-seller/features/manual-order/utils/day-pickups.util";
import { MANUAL_ORDER_SOURCE_LABEL } from "@/apps/web-seller/features/manual-order/constants/manual-order.constant";
import type { ManualOrderDto } from "@/apps/web-seller/features/manual-order/types/manual-order.dto";
import type { OrderResponseDto } from "@/apps/web-seller/features/order/types/order.dto";
import {
  isFinishedStatus,
  orderItemsShort,
  statusTone,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import { orderDetailPath } from "@/apps/web-seller/features/order/components/mobile/OrderCards";

type DayMark = "closed" | "changed" | null;

function OrderCard({ order }: { order: OrderResponseDto }) {
  // 끝난 주문(픽업 완료·노쇼)만 흐리게 — 처리할 주문까지 흐려 보이던 것(11-19 검토)
  const dim = isFinishedStatus(order.orderStatus);
  return (
    <Link
      to={orderDetailPath(order)}
      className="flex min-w-0 flex-col gap-0.5 rounded-control border border-ink-100 bg-white px-2.5 py-2 transition-colors duration-fast hover:border-ink-200 hover:bg-ink-50"
    >
      <span
        className={cx("text-sub font-bold tabular-nums", dim ? "text-ink-600" : "text-ink-900")}
      >
        {kstTime(order.pickupDate)}
      </span>
      <span
        className={cx(
          "line-clamp-2 text-sub leading-snug [overflow-wrap:anywhere]",
          dim ? "text-ink-600" : "text-ink-900",
        )}
      >
        {orderItemsShort(order)}
      </span>
      <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
        <StatusPill tone={statusTone(order.orderStatus)}>
          {getOrderStatusLabel(order.orderStatus)}
        </StatusPill>
        <span className={cx(NO_REPLAY, "min-w-0 truncate text-caption text-ink-600")}>
          {order.reservationContactName?.trim() || ""}
        </span>
      </span>
    </Link>
  );
}

function ManualCard({ manual }: { manual: ManualOrderDto }) {
  return (
    <Link
      to={ROUTES.STORE_DETAIL_MANUAL_ORDER_DETAIL(manual.storeId, manual.id)}
      className="flex min-w-0 flex-col gap-0.5 rounded-control border border-ink-100 bg-white px-2.5 py-2 transition-colors duration-fast hover:border-ink-200 hover:bg-ink-50"
    >
      <span
        className={cx(
          "text-sub tabular-nums",
          manual.pickupTime ? "font-bold text-ink-900" : "font-semibold text-ink-600",
        )}
      >
        {manual.pickupTime ?? "미정"}
      </span>
      <span className="line-clamp-2 text-sub leading-snug text-ink-900 [overflow-wrap:anywhere]">
        {manual.cakeName}
      </span>
      <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
        <StatusPill tone="done">{MANUAL_ORDER_SOURCE_LABEL[manual.source]}</StatusPill>
        {/* 운영자가 가게 대신 적은 주문(기획 I-41) — 휴대폰 그날 목록과 같은 표시 */}
        {manual.enteredByOperator ? (
          <span className="text-caption text-ink-600">운영자 입력</span>
        ) : null}
        {manual.paid === false ? (
          <span className="text-caption font-semibold text-brand-ink">입금 전</span>
        ) : null}
        {manual.customerName?.trim() ? (
          <span className={cx(NO_REPLAY, "min-w-0 truncate text-caption text-ink-600")}>
            {manual.customerName.trim()}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function WeekBoard({
  weekStartKey,
  todayKey,
  byDay,
  manualByDay,
  markOf,
  loaded,
}: {
  /** 그 주 일요일(휴대폰 주간 달력과 같은 일~토) */
  weekStartKey: string;
  todayKey: string;
  byDay: Record<string, OrderResponseDto[]>;
  manualByDay: Record<string, ManualOrderDto[]>;
  /** 쉬는 날·그날만 바꾼 날 */
  markOf: (dateKey: string) => DayMark;
  loaded: boolean;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));
  return (
    <div role="list" aria-label="이번 주 픽업" className="grid min-w-0 grid-cols-7 gap-2">
      {days.map((key, i) => {
        const pickups = mergeDayPickups(byDay[key] ?? [], manualByDay[key] ?? []);
        const today = key === todayKey;
        const mark = markOf(key);
        const tag = cakeDayOf(key);
        return (
          <div
            key={key}
            role="listitem"
            aria-label={`${formatKeyMonthDayWeek(key)}${today ? " 오늘" : ""}${
              tag ? `, ${tag.full}` : ""
            }, 픽업 ${pickups.length}건`}
            className="flex min-w-0 flex-col gap-1.5"
          >
            <div
              className={cx(
                "flex items-baseline gap-1 px-1 pb-2",
                today ? "border-b-2 border-brand pb-[7px]" : "border-b border-ink-100",
              )}
            >
              <span className={cx("text-caption", today ? "text-brand-ink" : "text-ink-600")}>
                {weekdayLabel(i)}
              </span>
              <span
                className={cx(
                  "text-group font-bold tabular-nums",
                  today ? "text-brand-ink" : "text-ink-900",
                )}
              >
                {dayOfKey(key)}
              </span>
              <span className="ml-auto truncate text-caption tabular-nums text-ink-600">
                {loaded ? (pickups.length ? `${pickups.length}건` : "") : ""}
              </span>
            </div>
            {tag || mark === "changed" ? (
              <span className="flex flex-wrap gap-x-1.5 px-1 text-caption">
                {tag ? <span className="text-brand-ink">{tag.short}</span> : null}
                {mark === "changed" ? <span className="text-ink-600">영업 바꿈</span> : null}
              </span>
            ) : null}
            {!loaded ? (
              <span
                className="block h-16 animate-pulse rounded-control bg-ink-50"
                aria-hidden="true"
              />
            ) : pickups.length === 0 && mark === "closed" ? (
              <span className="flex min-h-16 items-center justify-center rounded-control border border-dashed border-ink-200 text-sub text-ink-400">
                휴무
              </span>
            ) : (
              <>
                {mark === "closed" ? (
                  <span className="px-1 text-caption text-ink-600">휴무일</span>
                ) : null}
                {pickups.map((p) =>
                  p.kind === "order" ? (
                    <OrderCard key={p.id} order={p.order} />
                  ) : (
                    <ManualCard key={p.id} manual={p.manual} />
                  ),
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 주간 보기 머리: "이번 주 · 11월 15일~21일" + 지난주·다음 주 */
export function WeekNav({
  weekStartKey,
  isThisWeek,
  onPrev,
  onNext,
  onThisWeek,
}: {
  weekStartKey: string;
  isThisWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
}) {
  const end = addDaysToKey(weekStartKey, 6);
  const range = `${Number(weekStartKey.slice(5, 7))}월 ${dayOfKey(weekStartKey)}일~${
    end.slice(5, 7) === weekStartKey.slice(5, 7) ? "" : `${Number(end.slice(5, 7))}월 `
  }${dayOfKey(end)}일`;
  return (
    <span className="flex items-center gap-1">
      <span className="mr-1 text-sub text-ink-600 tabular-nums">{range}</span>
      {isThisWeek ? null : (
        <button
          type="button"
          onClick={onThisWeek}
          className="press inline-flex h-9 items-center rounded-control border border-ink-200 px-3 text-sub font-bold text-ink-700 hover:bg-ink-50"
        >
          이번 주
        </button>
      )}
      <WeekArrow label="지난주" onClick={onPrev} back />
      <WeekArrow label="다음 주" onClick={onNext} />
    </span>
  );
}

function WeekArrow({
  label,
  onClick,
  back,
}: {
  label: string;
  onClick: () => void;
  back?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-full text-ink-600 hover:bg-ink-50"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={back ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export type { DayMark };
