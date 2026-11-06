/**
 * 주문 찾기 창(SC-74)과 주문 상태 안내 창(SC-75).
 */
import { useEffect, useState } from "react";
import { BottomSheet } from "@/apps/web-seller/common/ui/Sheet";
import { Button, ButtonPair, CircleIconButton } from "@/apps/web-seller/common/ui/Button";
import { Chip } from "@/apps/web-seller/common/ui/Choice";
import { StatusPill } from "@/apps/web-seller/common/ui/Badge";
import { StepBar } from "@/apps/web-seller/common/ui/Surface";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { cx } from "@/apps/web-seller/common/ui/cx";
import { OrderSortBy } from "@/apps/web-seller/features/order/types/order.dto";
import type { OrderDateFilter } from "@/apps/web-seller/features/order/hooks/queries/useOrderMobileQuery";
import {
  FINISHED_ORDER_STATUSES,
  ORDER_STEP_LABELS,
  groupsForTab,
  statusTone,
  type OrderTab,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import { getOrderStatusLabel } from "@/apps/web-seller/features/order/utils/order-status-ui.util";
import { getOrderStatusSellerHint } from "@/apps/web-seller/features/order/utils/order-status-seller-guide.util";

export interface OrderFindState extends OrderDateFilter {
  query: string;
  sortBy?: OrderSortBy;
}

export const EMPTY_FIND: OrderFindState = { query: "" };

/** 탭·검색마다 기본 정렬(SC-74 ③) */
export function defaultSortFor(tab: OrderTab, searching: boolean): OrderSortBy {
  if (searching) return OrderSortBy.LATEST;
  return tab === "past" ? OrderSortBy.PICKUP_DESC : OrderSortBy.PICKUP_ASC;
}

export const SORT_LABEL: Record<OrderSortBy, string> = {
  [OrderSortBy.PICKUP_ASC]: "픽업 가까운 순",
  [OrderSortBy.PICKUP_DESC]: "픽업 최근 순",
  [OrderSortBy.LATEST]: "최신 주문순",
  [OrderSortBy.OLDEST]: "오래된 주문순",
  [OrderSortBy.PRICE_DESC]: "금액 높은순",
  [OrderSortBy.PRICE_ASC]: "금액 낮은순",
};

function DateBox({
  label,
  placeholder,
  value,
  min,
  max,
  onChange,
}: {
  /** 화면 읽기 프로그램용 이름(예: "픽업 날짜 시작일") */
  label: string;
  /** 칸 안 예시 글씨(시작일·종료일) */
  placeholder: string;
  value?: string;
  min?: string;
  max?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <label className="relative flex h-13 min-w-0 flex-1 items-center justify-between rounded-control border border-ink-200 bg-white px-4 text-body focus-within:border-[1.5px] focus-within:border-ink-900">
      <span className={cx("truncate", value ? "text-ink-900" : "text-ink-500")}>
        {value ? value.replace(/-/g, ".") : placeholder}
      </span>
      <span className="shrink-0 text-ink-600">
        <Icon name="chevronDown" size={18} strokeWidth={2} />
      </span>
      {/* 휴대폰 날짜 고르기 창으로 연다 */}
      <input
        type="date"
        aria-label={label}
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function DateRange({
  title,
  start,
  end,
  onChange,
}: {
  title: string;
  start?: string;
  end?: string;
  onChange: (start?: string, end?: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-body font-bold text-ink-900">{title}</p>
      <div className="flex items-center gap-2">
        <DateBox
          label={`${title} 시작일`}
          placeholder="시작일"
          value={start}
          max={end}
          onChange={(v) => onChange(v, end)}
        />
        <span aria-hidden="true" className="text-ink-900">
          ~
        </span>
        <DateBox
          label={`${title} 종료일`}
          placeholder="종료일"
          value={end}
          min={start}
          onChange={(v) => onChange(start, v)}
        />
      </div>
    </div>
  );
}

export function OrderFindSheet({
  open,
  tab,
  value,
  onApply,
  onClose,
}: {
  open: boolean;
  tab: OrderTab;
  value: OrderFindState;
  onApply: (next: OrderFindState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<OrderFindState>(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const searching = Boolean(draft.query.trim());
  const sort = draft.sortBy ?? defaultSortFor(tab, searching);
  const sortOptions: OrderSortBy[] = [
    tab === "past" ? OrderSortBy.PICKUP_DESC : OrderSortBy.PICKUP_ASC,
    OrderSortBy.LATEST,
    OrderSortBy.OLDEST,
    OrderSortBy.PRICE_DESC,
    OrderSortBy.PRICE_ASC,
  ];

  const apply = () => onApply({ ...draft, query: draft.query.trim() });

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showClose
      title="주문 찾기"
      footer={
        <ButtonPair>
          <Button variant="secondary" onClick={() => setDraft(EMPTY_FIND)}>
            초기화
          </Button>
          <Button onClick={apply}>결과 보기</Button>
        </ButtonPair>
      }
    >
      <form
        role="search"
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <input
          type="search"
          enterKeyHint="search"
          aria-label="주문번호나 상품명"
          placeholder="주문번호나 상품명"
          value={draft.query}
          onChange={(e) => setDraft((d) => ({ ...d, query: e.target.value }))}
          className="h-13 min-w-0 flex-1 rounded-control border border-ink-200 bg-white px-4 text-body text-ink-900 outline-none placeholder:text-ink-500 focus:border-[1.5px] focus:border-ink-900 [&::-webkit-search-cancel-button]:hidden"
        />
        <CircleIconButton icon="search" label="검색" type="submit" />
      </form>
      <DateRange
        title="픽업 날짜"
        start={draft.pickupStartDate}
        end={draft.pickupEndDate}
        onChange={(s, e) => setDraft((d) => ({ ...d, pickupStartDate: s, pickupEndDate: e }))}
      />
      <DateRange
        title="주문 날짜"
        start={draft.startDate}
        end={draft.endDate}
        onChange={(s, e) => setDraft((d) => ({ ...d, startDate: s, endDate: e }))}
      />
      <div className="flex flex-col gap-2">
        <p className="text-body font-bold text-ink-900">정렬</p>
        <div role="group" aria-label="정렬" className="flex flex-wrap gap-2">
          {sortOptions.map((s) => (
            <Chip
              key={s}
              selected={sort === s}
              onClick={() => setDraft((d) => ({ ...d, sortBy: s }))}
            >
              {SORT_LABEL[s]}
            </Chip>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

function GuideRow({
  title,
  hint,
  status,
}: {
  title: string;
  hint: string;
  status: Parameters<typeof getOrderStatusLabel>[0];
}) {
  const [open, setOpen] = useState(false);
  const long = getOrderStatusSellerHint(status).replace(/^[^:]+:\s*/, "");
  return (
    <div className="border-b border-ink-100">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-body font-bold text-ink-900">{title}</span>
          <span className="text-caption text-ink-600">{hint}</span>
        </span>
        <StatusPill tone={statusTone(status)}>{getOrderStatusLabel(status)}</StatusPill>
      </button>
      {open ? <p className="pb-3 text-sub leading-normal text-ink-700">{long}</p> : null}
    </div>
  );
}

export function OrderGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} showClose title="주문 상태 안내">
      <p className="text-body font-bold text-ink-900">주문이 흘러가는 순서</p>
      <StepBar steps={ORDER_STEP_LABELS.map((label) => ({ label }))} filledThrough={-1} />
      <p className="text-caption leading-normal text-ink-600">
        입금 전 취소 → 취소완료 · 입금 뒤 취소 → 취소환불대기 → 취소환불완료 · 픽업대기에서 안 오면
        → 노쇼
      </p>
      <div className="flex flex-col gap-1">
        <p className="text-body font-bold text-ink-900">처리할 것</p>
        <p className="text-caption text-ink-600">사장님이 눌러야 해요</p>
      </div>
      <div className="-mt-2">
        {groupsForTab("todo").map((g) => (
          <GuideRow key={g.key} title={g.label} hint={g.guideHint} status={g.status} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-body font-bold text-ink-900">진행 중</p>
        <p className="text-caption text-ink-600">기다리면 돼요</p>
      </div>
      <div className="-mt-2">
        {groupsForTab("doing").map((g) => (
          <GuideRow key={g.key} title={g.label} hint={g.guideHint} status={g.status} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-body font-bold text-ink-900">지난 주문</p>
        <p className="text-caption text-ink-600">끝난 주문이에요</p>
      </div>
      <div className="-mt-2 flex flex-wrap gap-2 py-3">
        {FINISHED_ORDER_STATUSES.map((s) => (
          <StatusPill key={s} tone="done">
            {getOrderStatusLabel(s)}
          </StatusPill>
        ))}
      </div>
    </BottomSheet>
  );
}
