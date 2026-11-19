/**
 * PC 주문(기획 I-54, 시안 D): 왼쪽 주문 표 | 오른쪽 주문 상세. `/orders`와 `/orders/:orderId`가 같은 화면이다.
 *
 * - 840 이상: 두 칸. 줄을 누르면 오른쪽에 상세가 열리고 주소도 그 주문이 된다(알림·공유 링크가 그대로 열림).
 * - 768~839: 한 칸. 목록에서 누르면 상세 화면(휴대폰 상세를 PC 틀 안에), 뒤로 = 목록.
 * - 오른쪽 상세는 휴대폰 주문 상세 화면을 그대로 칸 안에 넣는다(PaneContext). 단계·입금 마감·처리 버튼·연락처·채팅·
 *   견적 칸·사진 크게 보기가 휴대폰과 똑같이 동작한다.
 * - 탭(처리할 것·진행 중·지난 주문)·찾기·기간·정렬·바로 처리·할 일 칸으로 바로 가기(?group=)는 휴대폰 주문 목록과
 *   같은 조회·같은 주소 조건(?tab=&q=&ps=&pe=&os=&oe=&sort=&group=)을 쓴다.
 * - PC에만 더한 것: 엑셀 내려받기(운영자 결정 2026-11-19), 찾기 칸을 위에 늘 열어 둠.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { PcPage, PcSplit } from "@/apps/web-seller/common/ui/PcPage";
import { PaneContext } from "@/apps/web-seller/common/ui/shell";
import { Button, HeaderIconButton } from "@/apps/web-seller/common/ui/Button";
import { SegmentedTabs } from "@/apps/web-seller/common/ui/Choice";
import { SearchInput } from "@/apps/web-seller/common/ui/Field";
import { EmptyState, LoadErrorState } from "@/apps/web-seller/common/ui/Surface";
import { Icon } from "@/apps/web-seller/common/ui/icons";
import { useNow } from "@/apps/web-seller/common/hooks/useNow";
import { useMinWidth } from "@/apps/web-seller/common/hooks/useShowMobileScreens";
import { useElementWidth } from "@/apps/web-seller/common/hooks/useElementWidth";
import { TWO_PANE_MIN_WIDTH_PX } from "@/apps/web-seller/common/constants/screen.constant";
import { ROUTES } from "@/apps/web-seller/common/constants/route-paths.constant";
import { formatKeyMonthDayWeek, kstDateKey } from "@/apps/web-seller/common/utils/kst-date.util";
import { useStoreDetail } from "@/apps/web-seller/features/store/hooks/queries/useStoreQuery";
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
import { LoadMoreSentinel } from "@/apps/web-seller/features/order/components/mobile/OrderCards";
import { OrderActionSheet } from "@/apps/web-seller/features/order/components/mobile/OrderActionSheet";
import {
  EMPTY_FIND,
  OrderFindSheet,
  OrderGuideSheet,
  SORT_LABEL,
  defaultSortFor,
  type OrderFindState,
} from "@/apps/web-seller/features/order/components/mobile/OrderSheets";
import {
  ORDER_TABLE_MIN_WIDTH,
  OrderDateRow,
  OrderGroupRow,
  OrderListEmpty,
  OrderTableHead,
  OrderTableRow,
} from "@/apps/web-seller/features/order/components/desktop/OrderTable";
import { OrderExportSheet } from "@/apps/web-seller/features/order/components/desktop/OrderExportSheet";
import { StoreDetailOrderDetailMobilePage } from "@/apps/web-seller/pages/store/detail/orders/Detail.mobile";

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

function filterSummary(find: OrderFindState, tab: OrderTab): string | null {
  const parts: string[] = [];
  if (find.pickupStartDate || find.pickupEndDate)
    parts.push(`픽업 ${shortRange(find.pickupStartDate, find.pickupEndDate)}`);
  if (find.startDate || find.endDate)
    parts.push(`주문 ${shortRange(find.startDate, find.endDate)}`);
  if (find.sortBy && find.sortBy !== defaultSortFor(tab, Boolean(find.query.trim())))
    parts.push(SORT_LABEL[find.sortBy]);
  return parts.length ? parts.join(" · ") : null;
}

type QuickAct = (order: OrderResponseDto, to: OrderStatus) => void;

interface RowCtx {
  wide: boolean;
  now: number;
  selectedId: string | null;
  hrefFor: (order: OrderResponseDto) => string;
  onQuickAction: QuickAct;
}

function useTabState(
  storeId: string,
  tab: Exclude<OrderTab, "past">,
  filter: OrderDateFilter & { sortBy?: OrderSortBy },
) {
  // 탭 숫자와 빈 탭 판단(GroupRows와 같은 조건이라 캐시를 같이 쓴다) — 휴대폰 주문 목록과 같다
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

function GroupRows({
  storeId,
  group,
  filter,
  ctx,
}: {
  storeId: string;
  group: OrderTaskGroup;
  filter: OrderDateFilter & { sortBy?: OrderSortBy };
  ctx: RowCtx;
}) {
  const q = useOrderStatusGroup(storeId, group.status, filter);
  if (!q.total) return null;
  return (
    <section aria-labelledby={`group-${group.key}`} role="rowgroup">
      <OrderGroupRow
        id={`group-${group.key}`}
        label={group.label}
        count={q.total}
        hint={group.homeHint ?? group.guideHint}
      />
      {q.orders.map((o) => (
        <OrderTableRow
          key={o.id}
          order={o}
          to={ctx.hrefFor(o)}
          wide={ctx.wide}
          selected={ctx.selectedId === o.id}
          now={ctx.now}
          quickAction={group.quickAction}
          quickTone={group.tab === "doing" ? "secondary" : "primary"}
          onQuickAction={ctx.onQuickAction}
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

function PastRows({
  storeId,
  filter,
  sortBy,
  ctx,
}: {
  storeId: string;
  filter: OrderDateFilter;
  sortBy: OrderSortBy;
  ctx: RowCtx;
}) {
  const q = useOrderMobileList({ storeId, type: OrderType.FINISHED, sortBy, ...filter });
  const byPickupDate = sortBy === OrderSortBy.PICKUP_DESC || sortBy === OrderSortBy.PICKUP_ASC;
  const sections = useMemo(() => {
    const out: { key: string; orders: OrderResponseDto[] }[] = [];
    for (const o of q.orders) {
      const key = byPickupDate ? kstDateKey(o.pickupDate) : "all";
      const last = out[out.length - 1];
      if (last && last.key === key) last.orders.push(o);
      else out.push({ key, orders: [o] });
    }
    return out;
  }, [q.orders, byPickupDate]);

  if (q.isLoading) return <RowsSkeleton />;
  if (q.isError)
    return (
      <OrderListEmpty>
        <LoadErrorState big onRetry={() => void q.refetch()} />
      </OrderListEmpty>
    );
  if (q.orders.length === 0)
    return (
      <OrderListEmpty>
        <EmptyState big title="지난 주문이 없어요" />
      </OrderListEmpty>
    );
  return (
    <>
      {sections.map((s) => (
        <React.Fragment key={s.key}>
          {byPickupDate ? (
            <OrderDateRow label={formatKeyMonthDayWeek(s.key)} count={s.orders.length} />
          ) : null}
          {s.orders.map((o) => (
            <OrderTableRow
              key={o.id}
              order={o}
              to={ctx.hrefFor(o)}
              wide={ctx.wide}
              selected={ctx.selectedId === o.id}
              now={ctx.now}
            />
          ))}
        </React.Fragment>
      ))}
      <LoadMoreSentinel
        hasNext={Boolean(q.hasNextPage)}
        loading={q.isFetchingNextPage}
        onLoad={() => void q.fetchNextPage()}
      />
    </>
  );
}

function SearchRows({
  storeId,
  find,
  ctx,
}: {
  storeId: string;
  find: OrderFindState;
  ctx: RowCtx;
}) {
  const sortBy = find.sortBy ?? defaultSortFor("todo", true);
  const q = useOrderMobileList({
    storeId,
    sortBy,
    ...dateFilterOf(find),
    ...searchParamsFor(find.query),
  });
  if (q.isLoading) return <RowsSkeleton />;
  if (q.isError)
    return (
      <OrderListEmpty>
        <LoadErrorState big onRetry={() => void q.refetch()} />
      </OrderListEmpty>
    );
  if (q.orders.length === 0)
    return (
      <OrderListEmpty>
        <EmptyState
          big
          icon="search"
          title="찾는 주문이 없어요"
          description="이름, 전화번호 뒷자리, 상품명, 주문번호로 찾을 수 있어요"
        />
      </OrderListEmpty>
    );
  return (
    <>
      <OrderGroupRow
        label={`'${find.query.trim()}' 검색 결과`}
        count={q.total ?? q.orders.length}
        hint={SORT_LABEL[sortBy]}
      />
      {q.orders.map((o) => (
        <OrderTableRow
          key={o.id}
          order={o}
          to={ctx.hrefFor(o)}
          wide={ctx.wide}
          selected={ctx.selectedId === o.id}
          now={ctx.now}
        />
      ))}
      <LoadMoreSentinel
        hasNext={Boolean(q.hasNextPage)}
        loading={q.isFetchingNextPage}
        onLoad={() => void q.fetchNextPage()}
      />
    </>
  );
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="불러오는 중">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="block h-14 animate-pulse rounded-control bg-ink-50" />
      ))}
    </div>
  );
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
    <div className="flex items-center gap-2 rounded-control bg-ink-50 py-1.5 pl-4 pr-2">
      <span className="min-w-0 flex-1 truncate text-sub font-bold text-ink-700">{text}</span>
      <button
        type="button"
        aria-label={clearLabel}
        onClick={onClear}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100"
      >
        <Icon name="close" size={18} strokeWidth={2} />
      </button>
    </div>
  );
}

export const StoreDetailOrdersDesktopPage: React.FC = () => {
  const { storeId = "", orderId } = useParams<{ storeId: string; orderId?: string }>();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const now = useNow(30_000);
  const twoPane = useMinWidth(TWO_PANE_MIN_WIDTH_PX);
  const { data: store } = useStoreDetail(storeId);

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
  const [exportOpen, setExportOpen] = useState(false);
  const [action, setAction] = useState<{ order: OrderResponseDto; to: OrderStatus } | null>(null);

  // 찾기 칸은 늘 열어 두고, 치는 동안은 조금 기다렸다 주소에 넣는다
  const [text, setText] = useState(find.query);
  useEffect(() => setText(find.query), [find.query]);
  useEffect(() => {
    if (text.trim() === find.query.trim()) return;
    const t = window.setTimeout(() => {
      const p = new URLSearchParams(params);
      writeFind(p, { ...find, query: text });
      p.delete("group");
      setParams(p, { replace: true });
    }, 300);
    return () => window.clearTimeout(t);
  }, [text, find, params, setParams]);

  const setTab = (next: OrderTab) => {
    const p = new URLSearchParams(params);
    p.set("tab", next);
    p.delete("group");
    p.delete("sort");
    setParams(p, { replace: true });
    listRef.current?.scrollTo({ top: 0 });
  };
  const applyFind = (next: OrderFindState) => {
    const p = new URLSearchParams(params);
    writeFind(p, next);
    p.delete("group");
    setParams(p);
    setFindOpen(false);
    listRef.current?.scrollTo({ top: 0 });
  };
  const clearFind = () => applyFind(EMPTY_FIND);
  const clearSearchOnly = () => {
    setText("");
    applyFind({ ...find, query: "", sortBy: undefined });
  };

  // 홈 "처리할 일" 줄에서 오면 그 칸으로(?group=deposit) — 휴대폰과 같다
  const listRef = useRef<HTMLDivElement>(null);
  const groupParam = params.get("group");
  const targetGroup = groupByKey(groupParam);
  const activeLoading = tab === "todo" ? todo.loading : tab === "doing" ? doing.loading : false;
  useEffect(() => {
    if (!targetGroup || activeLoading) return;
    document.getElementById(`group-${targetGroup.key}`)?.scrollIntoView({ block: "start" });
  }, [targetGroup, activeLoading]);
  useEffect(() => {
    if (targetGroup && targetGroup.tab !== tab) {
      const p = new URLSearchParams(params);
      p.set("tab", targetGroup.tab);
      setParams(p, { replace: true });
    }
  }, [targetGroup, tab, params, setParams]);

  const onQuickAction = useCallback<QuickAct>((order, to) => setAction({ order, to }), []);
  const width = useElementWidth(listRef);
  const ctx: RowCtx = {
    wide: width >= ORDER_TABLE_MIN_WIDTH,
    now,
    selectedId: orderId ?? null,
    hrefFor: (o) => `${ROUTES.STORE_DETAIL_ORDERS_DETAIL(storeId, o.id)}${location.search}`,
    onQuickAction,
  };

  const summary = filterSummary(find, tab);
  const tabState = tab === "todo" ? todo : tab === "doing" ? doing : null;

  // 768~839(한 칸): 상세를 고르면 상세 화면만(휴대폰 상세를 PC 틀 안에, 뒤로 = 목록)
  if (!twoPane && orderId) {
    return <StoreDetailOrderDetailMobilePage />;
  }

  const list = (
    <div
      ref={listRef}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
      role="table"
      aria-label="주문 목록"
    >
      {ctx.wide && !searching ? <OrderTableHead /> : null}
      {searching ? (
        <SearchRows storeId={storeId} find={find} ctx={ctx} />
      ) : tab === "past" ? (
        <PastRows
          storeId={storeId}
          filter={dates}
          sortBy={find.sortBy ?? defaultSortFor("past", false)}
          ctx={ctx}
        />
      ) : tabState?.loading ? (
        <RowsSkeleton />
      ) : tabState?.error ? (
        <OrderListEmpty>
          <LoadErrorState big onRetry={() => void tabState.refetch()} />
        </OrderListEmpty>
      ) : tabState && tabState.total === 0 ? (
        <OrderListEmpty>
          {tab === "todo" ? (
            <EmptyState
              big
              title="처리할 주문이 없어요"
              description="새 예약이 들어오면 여기에 보여요"
            />
          ) : (
            <EmptyState big title="진행 중인 주문이 없어요" />
          )}
        </OrderListEmpty>
      ) : (
        groupsForTab(tab).map((g) => (
          <GroupRows key={g.key} storeId={storeId} group={g} filter={groupFilter} ctx={ctx} />
        ))
      )}
    </div>
  );

  return (
    <PcPage
      title="주문"
      fill
      actions={
        <>
          <Button variant="secondary" size="md" onClick={() => setExportOpen(true)}>
            엑셀 내려받기
          </Button>
          <HeaderIconButton
            icon="help"
            label="주문 상태 안내"
            className="text-ink-600"
            onClick={() => setGuideOpen(true)}
          />
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedTabs
          label="주문 묶음"
          value={tab}
          onChange={setTab}
          className="w-[340px] shrink-0"
          options={[
            {
              value: "todo",
              label: "처리할 것",
              count: todo.loading || todo.error ? undefined : todo.total,
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
        <SearchInput
          label="주문 찾기"
          placeholder="이름·번호 뒷자리·상품명·주문번호"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-[220px] flex-1"
        />
        <Button variant="secondary" size="md" onClick={() => setFindOpen(true)}>
          <Icon name="filter" size={16} strokeWidth={2} />
          기간·정렬
        </Button>
      </div>
      {searching ? (
        <SummaryBar
          text={`'${find.query.trim()}' 찾는 중 · ${SORT_LABEL[find.sortBy ?? defaultSortFor("todo", true)]}`}
          clearLabel="검색 지우기"
          onClear={clearSearchOnly}
        />
      ) : summary ? (
        <SummaryBar text={summary} clearLabel="거르기 지우기" onClear={clearFind} />
      ) : null}

      {twoPane ? (
        <PcSplit
          list={list}
          detail={
            orderId ? (
              <PaneContext.Provider value={{ besideList: true }}>
                {/* 주문을 바꾸면 상세의 열린 창·사진 보기를 처음부터 */}
                <StoreDetailOrderDetailMobilePage key={orderId} />
              </PaneContext.Provider>
            ) : null
          }
          empty={
            <div className="flex flex-1 flex-col px-6">
              <EmptyState big icon="search" title="주문을 고르면 여기에 보여요" />
            </div>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-ink-100">
          {list}
        </div>
      )}

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
      <OrderExportSheet
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        storeId={storeId}
        storeName={store?.name ?? ""}
      />
    </PcPage>
  );
};
