/**
 * 주문 목록 주소 상태(휴대폰 주문 목록·PC 주문 화면 공용, 기획 I-54): 탭·찾기 조건·탭 숫자, 찾기 창, 홈 "처리할 일"에서 온 칸(?group=)으로 이동.
 * 목록을 맨 위로 올리는 법만 화면마다 다르다(휴대폰 창 전체, PC 목록 칸).
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OrderSortBy } from "@/apps/web-seller/features/order/types/order.dto";
import {
  groupByKey,
  type OrderTab,
} from "@/apps/web-seller/features/order/utils/order-mobile.util";
import {
  EMPTY_FIND,
  ORDER_LIST_TABS,
  orderDateFilterOf,
  orderFilterSummary,
  readOrderFind,
  writeOrderFind,
  type OrderFindState,
} from "@/apps/web-seller/features/order/utils/order-find.util";
import { useOrderTabCounts } from "@/apps/web-seller/features/order/hooks/queries/useOrderTabCounts";

export function useOrderListParams(storeId: string, scrollToTop: () => void) {
  const [params, setParams] = useSearchParams();

  const tabParam = params.get("tab");
  const tab: OrderTab = ORDER_LIST_TABS.includes(tabParam as OrderTab)
    ? (tabParam as OrderTab)
    : "todo";
  const find = useMemo(() => readOrderFind(params), [params]);
  const searching = Boolean(find.query.trim());
  const dates = orderDateFilterOf(find);
  const groupSort = find.sortBy && tab !== "past" ? find.sortBy : undefined;
  const groupFilter = { ...dates, sortBy: groupSort ?? OrderSortBy.PICKUP_ASC };

  const todo = useOrderTabCounts(storeId, "todo", groupFilter);
  const doing = useOrderTabCounts(storeId, "doing", groupFilter);
  const [findOpen, setFindOpen] = useState(false);

  const setTab = (next: OrderTab) => {
    const p = new URLSearchParams(params);
    p.set("tab", next);
    p.delete("group");
    // 정렬은 탭마다 기본값이 달라 탭을 바꾸면 기본으로
    p.delete("sort");
    setParams(p, { replace: true });
    scrollToTop();
  };

  const applyFind = (next: OrderFindState) => {
    const p = new URLSearchParams(params);
    writeOrderFind(p, next);
    p.delete("group");
    setParams(p);
    setFindOpen(false);
    scrollToTop();
  };

  // 홈 "처리할 일" 줄에서 오면 그 칸으로(?group=deposit)
  const targetGroup = groupByKey(params.get("group"));
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

  return {
    params,
    setParams,
    tab,
    find,
    searching,
    dates,
    groupFilter,
    todo,
    doing,
    /** 지금 탭의 숫자·불러오기(지난 주문 탭은 null) */
    tabState: tab === "todo" ? todo : tab === "doing" ? doing : null,
    /** 걸러 둔 조건 한 줄(없으면 null) */
    summary: orderFilterSummary(find, tab),
    findOpen,
    setFindOpen,
    setTab,
    applyFind,
    clearFind: () => applyFind(EMPTY_FIND),
    clearSearchOnly: () => applyFind({ ...find, query: "", sortBy: undefined }),
  };
}
