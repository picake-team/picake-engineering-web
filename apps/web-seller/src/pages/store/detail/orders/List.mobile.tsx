/**
 * 휴대폰 주문 목록 (SC-73, 디자인 2-D2 · 진행 중 · 지난 B · 검색 결과).
 * 탭 3개(처리할 것·진행 중·지난 주문)와 할 일 칸, 찾기·상태 안내, 목록에서 바로 처리.
 * 탭·찾기 조건은 주소(?tab=…&q=…)에 둬 주문 상세에서 돌아와도 그대로다.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppScreen, TabHeader } from "@/apps/web-seller/common/ui/Screen";
import { HeaderIconButton } from "@/apps/web-seller/common/ui/Button";
import { SegmentedTabs } from "@/apps/web-seller/common/ui/Choice";
import { EmptyState, LoadErrorState, SkeletonCards } from "@/apps/web-seller/common/ui/Surface";
import { PullToRefresh } from "@/apps/web-seller/common/ui/PullToRefresh";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { useNow } from "@/apps/web-seller/common/hooks/useNow";
import { formatKeyMonthDayWeek, kstDateKey } from "@/apps/web-seller/common/utils/kst-date.util";
import { orderQueryKeys } from "@/apps/web-seller/features/order/constants/orderQueryKeys.constant";
import {
  useOrderMobileList,
  useOrderStatusGroup,
  type OrderDateFilter,
} from "@/apps/web-seller/features/order/hooks/queries/useOrderMobileQuery";
import {
  OrderSortBy,
  OrderType,
  type OrderResponseDto,
  type OrderStatus,
} from "@/apps/web-seller/features/order/types/order.dto";
import {
  groupByKey,
  groupsForTab,
  searchParamsFor,
  type OrderTab,
  type OrderTaskGroup,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import {
  LoadMoreSentinel,
  OrderCard,
  OrderGroupTitle,
  PastDateHeader,
  PastOrderRow,
} from "@/apps/web-seller/features/order/components/mobile/OrderCards";
import { OrderActionSheet } from "@/apps/web-seller/features/order/components/mobile/OrderActionSheet";
import {
  EMPTY_FIND,
  OrderFindSheet,
  OrderGuideSheet,
  SORT_LABEL,
  defaultSortFor,
  type OrderFindState,
} from "@/apps/web-seller/features/order/components/mobile/OrderSheets";

const TABS: OrderTab[] = ["todo", "doing", "past"];

function readFind(params: URLSearchParams): OrderFindState {
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

function writeFind(params: URLSearchParams, find: OrderFindState) {
  const set = (k: string, v?: string) => (v ? params.set(k, v) : params.delete(k));
  set("q", find.query.trim() || undefined);
  set("ps", find.pickupStartDate);
  set("pe", find.pickupEndDate);
  set("os", find.startDate);
  set("oe", find.endDate);
  set("sort", find.sortBy);
}

function dateFilterOf(find: OrderFindState): OrderDateFilter {
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

/** 걸러 둔 조건 한 줄(검색이 아닐 때) */
function filterSummary(find: OrderFindState, tab: OrderTab): string | null {
  const parts: string[] = [];
  if (find.pickupStartDate || find.pickupEndDate)
    parts.push(`픽업 ${shortRange(find.pickupStartDate, find.pickupEndDate)}`);
  if (find.startDate || find.endDate)
    parts.push(`주문 ${shortRange(find.startDate, find.endDate)}`);
  if (find.sortBy && find.sortBy !== defaultSortFor(tab, false))
    parts.push(SORT_LABEL[find.sortBy]);
  return parts.length ? parts.join(" · ") : null;
}

function SummaryBar({
  text,
  onClear,
  clearLabel,
}: {
  text: string;
  onClear: () => void;
  clearLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-control bg-ink-50 py-2 pl-4 pr-3">
      <span className="min-w-0 flex-1 text-sub font-bold text-ink-700">{text}</span>
      <button
        type="button"
        aria-label={clearLabel}
        onClick={onClear}
        className="-my-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-700 active:bg-ink-100"
      >
        <Icon name="close" size={18} strokeWidth={2} />
      </button>
    </div>
  );
}

type QuickAct = (order: OrderResponseDto, to: OrderStatus) => void;

/** 할 일 칸 하나: 칸 제목 + 카드 + 계속 불러오기. 비면 숨긴다 */
function GroupSection({
  storeId,
  group,
  filter,
  now,
  onQuickAction,
}: {
  storeId: string;
  group: OrderTaskGroup;
  filter: OrderDateFilter & { sortBy?: OrderSortBy };
  now: number;
  onQuickAction: QuickAct;
}) {
  const q = useOrderStatusGroup(storeId, group.status, filter);
  if (!q.total) return null;
  return (
    <section aria-labelledby={`group-${group.key}`} className="flex flex-col gap-3">
      <OrderGroupTitle id={`group-${group.key}`} label={group.label} count={q.total} />
      {q.orders.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          now={now}
          quickAction={group.quickAction}
          onQuickAction={onQuickAction}
          quickTone={group.tab === "doing" ? "secondary" : "primary"}
        />
      ))}
      <LoadMoreSentinel
        hasNext={Boolean(q.hasNextPage)}
        loading={q.isFetchingNextPage}
        onLoad={() => void q.fetchNextPage()}
      />
    </section>
  );
}

function useTabState(
  storeId: string,
  tab: Exclude<OrderTab, "past">,
  filter: OrderDateFilter & { sortBy?: OrderSortBy },
) {
  // 탭 숫자와 빈 탭 판단에 쓰는 칸들(GroupSection과 같은 조건이라 캐시를 같이 쓴다)
  const groups = groupsForTab(tab);
  const silent = { silent: true };
  const a = useOrderStatusGroup(storeId, groups[0].status, filter, silent);
  const b = useOrderStatusGroup(storeId, groups[1].status, filter, silent);
  const c = useOrderStatusGroup(storeId, groups[2]?.status ?? groups[0].status, filter, {
    ...silent,
    enabled: Boolean(groups[2]),
  });
  const d = useOrderStatusGroup(storeId, groups[3]?.status ?? groups[0].status, filter, {
    ...silent,
    enabled: Boolean(groups[3]),
  });
  const qs = [a, b, c, d].slice(0, groups.length);
  const loading = qs.some((q) => q.isLoading);
  const error = qs.find((q) => q.isError);
  const total = qs.reduce((sum, q) => sum + (q.total ?? 0), 0);
  return { loading, error, total, refetch: () => Promise.all(qs.map((q) => q.refetch())) };
}

function PastList({
  storeId,
  filter,
  sortBy,
}: {
  storeId: string;
  filter: OrderDateFilter;
  sortBy: OrderSortBy;
}) {
  const q = useOrderMobileList({ storeId, type: OrderType.FINISHED, sortBy, ...filter });
  const byPickupDate = sortBy === OrderSortBy.PICKUP_DESC || sortBy === OrderSortBy.PICKUP_ASC;
  const sections = useMemo(() => {
    if (!byPickupDate) return null;
    const out: { key: string; orders: OrderResponseDto[] }[] = [];
    for (const o of q.orders) {
      const key = kstDateKey(o.pickupDate);
      const last = out[out.length - 1];
      if (last && last.key === key) last.orders.push(o);
      else out.push({ key, orders: [o] });
    }
    return out;
  }, [q.orders, byPickupDate]);

  if (q.isLoading) return <SkeletonCards />;
  if (q.isError) return <LoadErrorState big onRetry={() => void q.refetch()} />;
  if (q.orders.length === 0) return <EmptyState big title="지난 주문이 없어요" />;
  return (
    <div className="mt-1 flex flex-col">
      {sections
        ? sections.map((s) => (
            <React.Fragment key={s.key}>
              <PastDateHeader label={formatKeyMonthDayWeek(s.key)} count={s.orders.length} />
              {s.orders.map((o) => (
                <PastOrderRow key={o.id} order={o} />
              ))}
            </React.Fragment>
          ))
        : q.orders.map((o) => <PastOrderRow key={o.id} order={o} />)}
      <LoadMoreSentinel
        hasNext={Boolean(q.hasNextPage)}
        loading={q.isFetchingNextPage}
        onLoad={() => void q.fetchNextPage()}
      />
    </div>
  );
}

function SearchResults({
  storeId,
  find,
  now,
  onClear,
}: {
  storeId: string;
  find: OrderFindState;
  now: number;
  onClear: () => void;
}) {
  const sortBy = find.sortBy ?? defaultSortFor("todo", true);
  const q = useOrderMobileList({
    storeId,
    sortBy,
    ...dateFilterOf(find),
    ...searchParamsFor(find.query),
  });
  const count = q.total ?? 0;
  return (
    <>
      <SummaryBar
        clearLabel="검색 지우기"
        onClear={onClear}
        text={`‘${find.query}’ 검색 결과 ${q.isLoading ? "…" : `${count.toLocaleString("ko-KR")}건`} · ${SORT_LABEL[sortBy]}`}
      />
      {q.isLoading ? (
        <SkeletonCards />
      ) : q.isError ? (
        <LoadErrorState big onRetry={() => void q.refetch()} />
      ) : q.orders.length === 0 ? (
        <EmptyState
          big
          icon="search"
          title="찾는 주문이 없어요"
          description="주문번호나 상품명을 다시 확인해 주세요"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {q.orders.map((o) => (
            <OrderCard key={o.id} order={o} now={now} showStatus />
          ))}
          <LoadMoreSentinel
            hasNext={Boolean(q.hasNextPage)}
            loading={q.isFetchingNextPage}
            onLoad={() => void q.fetchNextPage()}
          />
        </div>
      )}
    </>
  );
}

export const StoreDetailOrderListMobilePage: React.FC = () => {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const now = useNow(30_000);

  const tabParam = params.get("tab");
  const tab: OrderTab = TABS.includes(tabParam as OrderTab) ? (tabParam as OrderTab) : "todo";
  const find = useMemo(() => readFind(params), [params]);
  const searching = Boolean(find.query.trim());
  const dates = dateFilterOf(find);
  const groupSort = find.sortBy && tab !== "past" ? find.sortBy : undefined;
  const groupFilter = { ...dates, sortBy: groupSort ?? OrderSortBy.PICKUP_ASC };

  const todo = useTabState(storeId, "todo", groupFilter);
  const doing = useTabState(storeId, "doing", groupFilter);

  const [findOpen, setFindOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [action, setAction] = useState<{ order: OrderResponseDto; to: OrderStatus } | null>(null);

  const setTab = (next: OrderTab) => {
    const p = new URLSearchParams(params);
    p.set("tab", next);
    p.delete("group");
    // 정렬은 탭마다 기본값이 달라 탭을 바꾸면 기본으로
    p.delete("sort");
    setParams(p, { replace: true });
    window.scrollTo({ top: 0 });
  };

  const applyFind = (next: OrderFindState) => {
    const p = new URLSearchParams(params);
    writeFind(p, next);
    p.delete("group");
    setParams(p);
    setFindOpen(false);
    window.scrollTo({ top: 0 });
  };

  const clearFind = () => applyFind(EMPTY_FIND);
  const clearSearchOnly = () => applyFind({ ...find, query: "", sortBy: undefined });

  // 홈 "처리할 주문" 줄에서 오면 그 칸으로(?group=deposit)
  const groupParam = params.get("group");
  const targetGroup = groupByKey(groupParam);
  const activeLoading = tab === "todo" ? todo.loading : tab === "doing" ? doing.loading : false;
  useEffect(() => {
    if (!targetGroup || activeLoading) return;
    const el = document.getElementById(`group-${targetGroup.key}`);
    el?.scrollIntoView({ block: "start" });
  }, [targetGroup, activeLoading]);
  useEffect(() => {
    if (targetGroup && targetGroup.tab !== tab) {
      const p = new URLSearchParams(params);
      p.set("tab", targetGroup.tab);
      setParams(p, { replace: true });
    }
  }, [targetGroup, tab, params, setParams]);

  const onQuickAction = useCallback<QuickAct>((order, to) => setAction({ order, to }), []);

  const refresh = () => queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() });

  const summary = filterSummary(find, tab);
  const tabState = tab === "todo" ? todo : tab === "doing" ? doing : null;

  return (
    <AppScreen
      tab="orders"
      storeId={storeId}
      header={
        <TabHeader
          title="주문"
          actions={
            <>
              <HeaderIconButton icon="search" label="주문 찾기" onClick={() => setFindOpen(true)} />
              <HeaderIconButton
                icon="help"
                label="주문 상태 안내"
                className="text-ink-600"
                onClick={() => setGuideOpen(true)}
              />
            </>
          }
        />
      }
    >
      <PullToRefresh onRefresh={refresh}>
        {searching ? (
          <SearchResults storeId={storeId} find={find} now={now} onClear={clearSearchOnly} />
        ) : (
          <>
            <SegmentedTabs
              label="주문 묶음"
              value={tab}
              onChange={setTab}
              options={[
                {
                  value: "todo",
                  label: "처리할 것",
                  count: todo.loading || todo.error ? undefined : todo.total,
                  // 주황은 사장님이 할 일이 있을 때만
                  countAccent: true,
                },
                {
                  value: "doing",
                  label: "진행 중",
                  count: doing.loading || doing.error ? undefined : doing.total,
                },
                { value: "past", label: "지난 주문" },
              ]}
            />
            {summary ? (
              <SummaryBar text={summary} clearLabel="거르기 지우기" onClear={clearFind} />
            ) : null}
            {tab === "past" ? (
              <PastList
                storeId={storeId}
                filter={dates}
                sortBy={find.sortBy ?? defaultSortFor("past", false)}
              />
            ) : tabState?.loading ? (
              <SkeletonCards />
            ) : tabState?.error ? (
              <LoadErrorState big onRetry={() => void tabState.refetch()} />
            ) : tabState && tabState.total === 0 ? (
              tab === "todo" ? (
                <EmptyState
                  big
                  title="처리할 주문이 없어요"
                  description="새 예약이 들어오면 여기에 보여요"
                />
              ) : (
                <EmptyState big title="진행 중인 주문이 없어요" />
              )
            ) : (
              groupsForTab(tab).map((g) => (
                <GroupSection
                  key={g.key}
                  storeId={storeId}
                  group={g}
                  filter={groupFilter}
                  now={now}
                  onQuickAction={onQuickAction}
                />
              ))
            )}
          </>
        )}
      </PullToRefresh>

      <OrderFindSheet
        open={findOpen}
        tab={tab}
        value={find}
        onApply={applyFind}
        onClose={() => setFindOpen(false)}
      />
      <OrderGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
      <OrderActionSheet
        order={action?.order ?? null}
        target={action?.to ?? null}
        onClose={() => setAction(null)}
        fromList
      />
    </AppScreen>
  );
};
