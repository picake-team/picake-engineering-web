/**
 * 휴대폰 주문 목록 (SC-73, 디자인 2-D2 · 진행 중 · 지난 B · 검색 결과).
 * 탭 3개(처리할 것·진행 중·지난 주문)와 할 일 칸, 찾기·상태 안내, 목록에서 바로 처리.
 * 탭·찾기 조건은 주소(?tab=…&q=…)에 둬 주문 상세에서 돌아와도 그대로다.
 */
import React, { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppScreen, TabHeader } from "@/apps/web-seller/common/ui/Screen";
import { HeaderIconButton } from "@/apps/web-seller/common/ui/Button";
import { SegmentedTabs } from "@/apps/web-seller/common/ui/Choice";
import { EmptyState, LoadErrorState, SkeletonCards } from "@/apps/web-seller/common/ui/Surface";
import { PullToRefresh } from "@/apps/web-seller/common/ui/PullToRefresh";
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
  groupsForTab,
  searchParamsFor,
  type OrderTaskGroup,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import {
  OrderCard,
  OrderGroupTitle,
  PastDateHeader,
  PastOrderRow,
} from "@/apps/web-seller/features/order/components/mobile/OrderCards";
import { LoadMoreSentinel } from "@/apps/web-seller/common/ui/LoadMoreSentinel";
import { OrderActionSheet } from "@/apps/web-seller/features/order/components/mobile/OrderActionSheet";
import {
  OrderFindSheet,
  OrderGuideSheet,
} from "@/apps/web-seller/features/order/components/mobile/OrderSheets";
import {
  SORT_LABEL,
  defaultSortFor,
  type OrderFindState,
  orderDateFilterOf,
} from "@/apps/web-seller/features/order/utils/order-find.util";
import { FilterSummaryBar } from "@/apps/web-seller/common/ui/FilterSummaryBar";
import { useOrderListParams } from "@/apps/web-seller/features/order/hooks/useOrderListParams";

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
    ...orderDateFilterOf(find),
    ...searchParamsFor(find.query),
  });
  const count = q.total ?? 0;
  return (
    <>
      <FilterSummaryBar
        clearLabel="검색 지우기"
        onClear={onClear}
        text={`'${find.query}' 검색 결과 ${q.isLoading ? "…" : `${count.toLocaleString("ko-KR")}건`} · ${SORT_LABEL[sortBy]}`}
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
          description="이름, 전화번호 뒷자리, 상품명, 주문번호로 찾을 수 있어요"
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
  const queryClient = useQueryClient();
  const now = useNow(30_000);

  const {
    tab,
    find,
    searching,
    dates,
    groupFilter,
    todo,
    doing,
    tabState,
    summary,
    findOpen,
    setFindOpen,
    setTab,
    applyFind,
    clearFind,
    clearSearchOnly,
  } = useOrderListParams(storeId, () => window.scrollTo({ top: 0 }));

  const [guideOpen, setGuideOpen] = useState(false);
  const [action, setAction] = useState<{ order: OrderResponseDto; to: OrderStatus } | null>(null);

  const onQuickAction = useCallback<QuickAct>((order, to) => setAction({ order, to }), []);

  const refresh = () => queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() });

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
              <FilterSummaryBar text={summary} clearLabel="거르기 지우기" onClear={clearFind} />
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
