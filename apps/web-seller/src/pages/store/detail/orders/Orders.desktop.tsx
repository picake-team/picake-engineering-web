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
import { useLocation, useParams } from "react-router-dom";
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
  groupsForTab,
  searchParamsFor,
  type OrderTaskGroup,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
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
  writeOrderFind,
} from "@/apps/web-seller/features/order/utils/order-find.util";
import { FilterSummaryBar } from "@/apps/web-seller/common/ui/FilterSummaryBar";
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
import { canExportOrPrint } from "@/apps/web-seller/common/utils/pc-extras.util";
import { useOrderListParams } from "@/apps/web-seller/features/order/hooks/useOrderListParams";

type QuickAct = (order: OrderResponseDto, to: OrderStatus) => void;

interface RowCtx {
  wide: boolean;
  now: number;
  selectedId: string | null;
  hrefFor: (order: OrderResponseDto) => string;
  onQuickAction: QuickAct;
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
    ...orderDateFilterOf(find),
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
          searching
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

export const StoreDetailOrdersDesktopPage: React.FC = () => {
  const { storeId = "", orderId } = useParams<{ storeId: string; orderId?: string }>();
  const location = useLocation();
  const now = useNow(30_000);
  const twoPane = useMinWidth(TWO_PANE_MIN_WIDTH_PX);
  const { data: store } = useStoreDetail(storeId);

  const listRef = useRef<HTMLDivElement>(null);
  const {
    params,
    setParams,
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
    clearSearchOnly: clearSearchParams,
  } = useOrderListParams(storeId, () => listRef.current?.scrollTo({ top: 0 }));

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
      writeOrderFind(p, { ...find, query: text });
      p.delete("group");
      setParams(p, { replace: true });
    }, 300);
    return () => window.clearTimeout(t);
  }, [text, find, params, setParams]);

  const clearSearchOnly = () => {
    setText("");
    clearSearchParams();
  };

  const onQuickAction = useCallback<QuickAct>((order, to) => setAction({ order, to }), []);
  const width = useElementWidth(listRef);
  const ctx: RowCtx = {
    wide: width >= ORDER_TABLE_MIN_WIDTH,
    now,
    selectedId: orderId ?? null,
    hrefFor: (o) => `${ROUTES.STORE_DETAIL_ORDERS_DETAIL(storeId, o.id)}${location.search}`,
    onQuickAction,
  };

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
          {canExportOrPrint() ? (
            <Button variant="secondary" size="md" onClick={() => setExportOpen(true)}>
              엑셀 내려받기
            </Button>
          ) : null}
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
          maxLength={50}
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
        <FilterSummaryBar
          text={`'${find.query.trim()}' 찾는 중 · ${SORT_LABEL[find.sortBy ?? defaultSortFor("todo", true)]}`}
          clearLabel="검색 지우기"
          onClear={clearSearchOnly}
        />
      ) : summary ? (
        <FilterSummaryBar text={summary} clearLabel="거르기 지우기" onClear={clearFind} />
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
